import jwt from "jsonwebtoken";

/**
 * Middleware: verifikasi JWT dari header Authorization.
 * Set req.user = { id, email, role } jika valid.
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Token tidak ditemukan. Silakan login terlebih dahulu.",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
        req.user = decoded; // { id, email, role (jika ada) }
        next();
    } catch {
        return res.status(403).json({
            success: false,
            message: "Token tidak valid atau sudah kedaluwarsa.",
        });
    }
};

export default authenticate;
