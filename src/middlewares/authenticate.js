import jwt from "jsonwebtoken";
import RbacService from "../services/rbacService.js";

/**
 * Middleware: verifikasi JWT dari header Authorization, lalu muat role & permission
 * user dari database (RBAC).
 *
 * Set req.user = { id, email, role, roleId, isSuperadmin, permissions } jika valid.
 *   - role        : slug role (mis. "admin", "user")
 *   - permissions : array key permission, mis. ["posts:create", ...]
 *
 * Role selalu dibaca dari DB (bukan dari JWT), sehingga perubahan role/permission
 * berlaku tanpa user harus login ulang.
 */
const authenticate = async (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Token tidak ditemukan. Silakan login terlebih dahulu.",
        });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    } catch {
        return res.status(403).json({
            success: false,
            message: "Token tidak valid atau sudah kedaluwarsa.",
        });
    }

    try {
        const access = await RbacService.getUserAccess(decoded.id);
        if (!access) {
            return res.status(401).json({
                success: false,
                message: "User tidak ditemukan. Silakan login ulang.",
            });
        }
        req.user = { ...decoded, ...access };
        return next();
    } catch (err) {
        return next(err);
    }
};

/**
 * Seperti authenticate, tetapi tidak menolak request tanpa/dengan token salah:
 * request diperlakukan sebagai anonim (req.user tidak diset).
 * Dipakai untuk route publik yang isinya berbeda untuk user dengan izin tertentu.
 */
const optionalAuthenticate = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

    try {
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "default_secret");
        const access = await RbacService.getUserAccess(decoded.id);
        if (access) req.user = { ...decoded, ...access };
    } catch (err) {
        // Token rusak/kedaluwarsa -> anonim. Error DB tetap diteruskan.
        if (!(err instanceof jwt.JsonWebTokenError)) return next(err);
    }
    return next();
};

export { optionalAuthenticate };
export default authenticate;
