import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "default_secret";
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";

// Access token: dipakai di header Authorization, divalidasi oleh middlewares/authenticate.js.
function signAccessToken(payload) {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

// Refresh token: JWT juga (agar expiry/signature bisa divalidasi tanpa query DB dulu),
// tapi keberadaannya di DB (sebagai hash) adalah sumber kebenaran soal revoked/tidaknya.
function signRefreshToken(payload) {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

function verifyRefreshToken(token) {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

// Konversi "15m" / "30d" dsb ke Date expiry, untuk disimpan di kolom expires_at.
function expiresInToDate(expiresIn) {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
        throw new Error(`Format expiresIn tidak valid: ${expiresIn}`);
    }
    const value = parseInt(match[1], 10);
    const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
    return new Date(Date.now() + value * unitMs);
}

export {
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    expiresInToDate,
    ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN,
};
