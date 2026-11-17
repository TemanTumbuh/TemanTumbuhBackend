import { can } from "../utils/rbac.js";

/**
 * Middleware factory: izinkan request hanya jika user punya SEMUA permission yang diminta.
 * Harus dipasang SETELAH `authenticate`.
 *
 * Contoh:
 *   router.post("/", authenticate, authorize(PERMISSIONS.POSTS_CREATE), handler);
 */
const authorize = (...requiredPermissions) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Token tidak ditemukan. Silakan login terlebih dahulu.",
        });
    }

    const allowed = requiredPermissions.every((permission) => can(req.user, permission));
    if (!allowed) {
        return res.status(403).json({
            success: false,
            message: "Anda tidak memiliki izin untuk melakukan aksi ini.",
            required: requiredPermissions,
        });
    }

    return next();
};

export default authorize;
