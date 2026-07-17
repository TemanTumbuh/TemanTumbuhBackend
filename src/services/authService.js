import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserService from "./userService.js";
import RefreshTokenService from "./refreshTokenService.js";
import OauthExchangeCodeModel from "../models/oauthExchangeCodeModel.js";
import UserModel from "../models/userModel.js";
import googleOAuthClient from "../config/google.js";
import { signAccessToken } from "../utils/jwt.js";

const OAUTH_STATE_SECRET = process.env.OAUTH_STATE_SECRET || "oauth_state_secret";
const EXCHANGE_CODE_TTL_MS = 60_000; // 60s

// Mapping user row -> payload JWT (dipakai baik untuk login password maupun Google).
function tokenPayload(user) {
    return { id: user.id, email: user.email };
}

// user row (raw, punya password_hash) -> shape publik yang aman dikirim ke client.
function publicUser(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        role_id: user.role_id,
        place_id: user.place_id,
        created_at: user.created_at,
        last_login: user.last_login,
    };
}

async function issueTokens(user) {
    const accessToken = signAccessToken(tokenPayload(user));
    const refreshToken = await RefreshTokenService.issue(user.id);
    return { accessToken, refreshToken };
}

// Bikin username unik dari nama Google (fallback increment jika sudah dipakai).
async function generateUniqueUsername(base) {
    const slug = base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 40) || "user";

    let candidate = slug;
    let suffix = 0;
    // Dibatasi supaya tidak infinite loop pada kasus ekstrem.
    while (suffix < 50) {
        const taken = await UserModel.usernameExists(candidate);
        if (!taken) return candidate;
        suffix += 1;
        candidate = `${slug}${suffix}`;
    }
    return `${slug}${Date.now()}`;
}

const AuthService = {
    // Registrasi user baru (provider='local'), lalu auto-login (issue token).
    async register({ username, email, password, confirmPassword }) {
        if (!username || !email || !password || !confirmPassword) {
            const err = new Error("Semua field harus diisi.");
            err.status = 400;
            throw err;
        }
        if (password !== confirmPassword) {
            const err = new Error("Kata sandi tidak cocok.");
            err.status = 400;
            throw err;
        }

        const password_hash = await bcrypt.hash(password, 10);
        const user = await UserService.createLocalUser({ username, email, password_hash });

        const tokens = await issueTokens(user);
        return { user: publicUser(user), ...tokens };
    },

    // Login email/password.
    async login({ email, password }) {
        const user = await UserService.findByEmailRaw(email);
        if (!user) {
            const err = new Error("Email atau kata sandi salah.");
            err.status = 401;
            throw err;
        }

        if (user.provider !== "local" || !user.password_hash) {
            const err = new Error(`Akun ini terdaftar via ${user.provider}. Silakan login dengan metode tersebut.`);
            err.status = 401;
            throw err;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            const err = new Error("Email atau kata sandi salah.");
            err.status = 401;
            throw err;
        }

        await UserModel.updateLastLogin(user.id);
        const tokens = await issueTokens(user);
        return { user: publicUser(user), ...tokens };
    },

    // Tukar refresh token lama dengan pasangan access+refresh baru (rotation).
    async refresh(oldRefreshToken) {
        if (!oldRefreshToken) {
            const err = new Error("Refresh token diperlukan.");
            err.status = 400;
            throw err;
        }

        const { userId } = await RefreshTokenService.verify(oldRefreshToken);
        const user = await UserModel.findById(userId);
        if (!user) {
            const err = new Error("User tidak ditemukan.");
            err.status = 401;
            throw err;
        }

        const newRefreshToken = await RefreshTokenService.rotate(oldRefreshToken);
        const accessToken = signAccessToken(tokenPayload(user));
        return { accessToken, refreshToken: newRefreshToken };
    },

    // Logout: cabut refresh token yang dikirim client.
    async logout(refreshToken) {
        if (!refreshToken) return;
        await RefreshTokenService.revoke(refreshToken);
    },

    // GET /auth/me
    async me(userId) {
        return UserService.getUserById(userId);
    },

    // ── Google SSO ──────────────────────────────────────────────────────────

    // state: signed cookie, bukan JWT - payload minimal, expiry pendek.
    generateOAuthState() {
        const nonce = crypto.randomBytes(16).toString("hex");
        const signature = crypto.createHmac("sha256", OAUTH_STATE_SECRET).update(nonce).digest("hex");
        return `${nonce}.${signature}`;
    },

    verifyOAuthState(cookieState, queryState) {
        if (!cookieState || !queryState || cookieState !== queryState) {
            return false;
        }
        const [nonce, signature] = cookieState.split(".");
        if (!nonce || !signature) return false;
        const expected = crypto.createHmac("sha256", OAUTH_STATE_SECRET).update(nonce).digest("hex");
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    },

    getGoogleConsentUrl(state) {
        return googleOAuthClient.generateAuthUrl({
            access_type: "offline",
            scope: ["openid", "profile", "email"],
            state,
        });
    },

    // Tukar authorization code Google -> verified ID token payload.
    async verifyGoogleCode(code) {
        const { tokens } = await googleOAuthClient.getToken(code);
        if (!tokens.id_token) {
            const err = new Error("Google tidak mengembalikan ID token.");
            err.status = 401;
            throw err;
        }

        const ticket = await googleOAuthClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            const err = new Error("ID token Google tidak valid.");
            err.status = 401;
            throw err;
        }
        if (!payload.email_verified) {
            const err = new Error("Email Google belum diverifikasi.");
            err.status = 401;
            throw err;
        }

        return {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
        };
    },

    // Cari-atau-buat user untuk Google login. Melempar 409 jika email sudah
    // terdaftar sebagai akun password (tidak silently attach/convert).
    async resolveGoogleUser({ sub, email, name, picture }) {
        const existingByProvider = await UserService.findByProviderAndProviderId("google", sub);
        if (existingByProvider) return existingByProvider;

        const existingByEmail = await UserService.findByEmailRaw(email);
        if (existingByEmail) {
            const err = new Error(
                "Email ini sudah terdaftar dengan kata sandi. Silakan login menggunakan email dan kata sandi."
            );
            err.status = 409;
            throw err;
        }

        const username = await generateUniqueUsername(name || email.split("@")[0]);
        return UserService.createGoogleUser({ username, email, providerId: sub, avatarUrl: picture });
    },

    // Full Google callback flow: code -> verified profile -> user -> one-time exchange code.
    // Token yang sebenarnya baru diterbitkan saat exchangeCode() dipanggil, supaya tidak ada
    // refresh token "yatim" yang terlanjur dibuat lalu dibuang begitu saja di sini.
    async handleGoogleCallback(code) {
        const profile = await this.verifyGoogleCode(code);
        const user = await this.resolveGoogleUser(profile);
        await UserModel.updateLastLogin(user.id);

        const exchangeCode = crypto.randomBytes(24).toString("hex");
        await OauthExchangeCodeModel.create({
            code: exchangeCode,
            userId: user.id,
            expiresAt: new Date(Date.now() + EXCHANGE_CODE_TTL_MS),
        });

        return { exchangeCode };
    },

    // POST /auth/exchange - tukar one-time code dari redirect Google dengan token asli.
    async exchangeCode(code) {
        const record = await OauthExchangeCodeModel.consume(code);
        if (!record) {
            const err = new Error("Kode exchange tidak valid atau sudah digunakan.");
            err.status = 401;
            throw err;
        }
        if (new Date(record.expires_at) < new Date()) {
            const err = new Error("Kode exchange sudah kedaluwarsa.");
            err.status = 401;
            throw err;
        }

        const user = await UserModel.findById(record.user_id);
        if (!user) {
            const err = new Error("User tidak ditemukan.");
            err.status = 401;
            throw err;
        }

        const tokens = await issueTokens(user);
        return { user: publicUser(user), ...tokens };
    },
};

export default AuthService;
