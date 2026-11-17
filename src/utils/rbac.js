/**
 * Cek apakah user (req.user hasil middleware authenticate) punya sebuah permission.
 * Role superadmin otomatis lolos semua pengecekan.
 */
function can(user, permission) {
    if (!user) return false;
    if (user.isSuperadmin) return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

export { can };
