import AuthService from "../services/authService.js";

const OAUTH_STATE_COOKIE = "oauth_state";
const isProd = process.env.NODE_ENV === "production";

class AuthController {
    // POST /auth/register
    static async register(req, res) {
        try {
            const { username, email, password, confirmPassword } = req.body;
            const result = await AuthService.register({ username, email, password, confirmPassword });
            return res.status(201).json({ success: true, message: "Registrasi berhasil.", data: result });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Terjadi kesalahan server." });
        }
    }

    // POST /auth/login
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login({ email, password });
            return res.status(200).json({ success: true, message: "Login berhasil.", data: result });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Terjadi kesalahan server." });
        }
    }

    // POST /auth/refresh
    static async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await AuthService.refresh(refreshToken);
            return res.status(200).json({ success: true, data: result });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Terjadi kesalahan server." });
        }
    }

    // POST /auth/logout
    static async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            await AuthService.logout(refreshToken);
            return res.status(200).json({ success: true, message: "Logout berhasil." });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Terjadi kesalahan server." });
        }
    }

    // GET /auth/me
    static async me(req, res) {
        try {
            const user = await AuthService.me(req.user.id);
            return res.status(200).json({ success: true, data: user });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Terjadi kesalahan server." });
        }
    }

    // GET /auth/google
    static async googleRedirect(req, res) {
        const state = AuthService.generateOAuthState();

        res.cookie(OAUTH_STATE_COOKIE, state, {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax",
            maxAge: 5 * 60 * 1000, // 5 menit
        });

        const consentUrl = AuthService.getGoogleConsentUrl(state);
        return res.redirect(302, consentUrl);
    }

    // GET /auth/callback
    static async googleCallback(req, res) {
        const frontendUrl = process.env.FRONTEND_REDIRECT_URL;
        const cookieState = req.cookies?.[OAUTH_STATE_COOKIE];
        res.clearCookie(OAUTH_STATE_COOKIE);

        try {
            const { code, state } = req.query;

            if (!AuthService.verifyOAuthState(cookieState, state)) {
                const err = new Error("State tidak valid, kemungkinan permintaan CSRF.");
                err.status = 401;
                throw err;
            }

            const { exchangeCode } = await AuthService.handleGoogleCallback(code);
            return res.redirect(302, `${frontendUrl}?code=${encodeURIComponent(exchangeCode)}`);
        } catch (err) {
            const message = encodeURIComponent(err.message ?? "Login Google gagal.");
            return res.redirect(302, `${frontendUrl}?error=${message}`);
        }
    }

    // POST /auth/exchange
    static async exchange(req, res) {
        try {
            const { code } = req.body;
            const result = await AuthService.exchangeCode(code);
            return res.status(200).json({ success: true, data: result });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Terjadi kesalahan server." });
        }
    }
}

export default AuthController;
