import crypto from "crypto";
import RefreshTokenModel from "../models/refreshTokenModel.js";
import { signRefreshToken, verifyRefreshToken, expiresInToDate, REFRESH_TOKEN_EXPIRES_IN } from "../utils/jwt.js";

// Hash refresh token sebelum disimpan (never simpan plaintext di DB).
function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

const RefreshTokenService = {
    // Terbitkan refresh token baru untuk user + simpan hash-nya.
    async issue(userId) {
        const token = signRefreshToken({ id: userId, type: "refresh" });
        await RefreshTokenModel.create({
            userId,
            tokenHash: hashToken(token),
            expiresAt: expiresInToDate(REFRESH_TOKEN_EXPIRES_IN),
        });
        return token;
    },

    // Verifikasi refresh token: signature valid, ada di DB, belum expired.
    // Mengembalikan { userId, tokenHash } jika valid, melempar error 401 jika tidak.
    async verify(token) {
        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch {
            const err = new Error("Refresh token tidak valid atau sudah kedaluwarsa.");
            err.status = 401;
            throw err;
        }

        const tokenHash = hashToken(token);
        const stored = await RefreshTokenModel.findByTokenHash(tokenHash);
        if (!stored) {
            const err = new Error("Refresh token tidak dikenali atau sudah dicabut.");
            err.status = 401;
            throw err;
        }

        if (new Date(stored.expires_at) < new Date()) {
            await RefreshTokenModel.removeByTokenHash(tokenHash);
            const err = new Error("Refresh token sudah kedaluwarsa.");
            err.status = 401;
            throw err;
        }

        return { userId: decoded.id, tokenHash };
    },

    // Rotasi: hapus token lama, terbitkan token baru untuk user yang sama.
    async rotate(oldToken) {
        const { userId, tokenHash } = await this.verify(oldToken);
        await RefreshTokenModel.removeByTokenHash(tokenHash);
        return this.issue(userId);
    },

    // Logout: cabut satu refresh token (device saat ini).
    async revoke(token) {
        await RefreshTokenModel.removeByTokenHash(hashToken(token));
    },
};

export default RefreshTokenService;
