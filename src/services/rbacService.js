import supabase from "../config/supabase.js";
import RoleModel from "../models/roleModel.js";

// Cache singkat supaya authenticate tidak query DB berlapis di setiap request.
// Perubahan lewat API ini langsung meng-invalidate cache; TTL jadi pengaman untuk
// perubahan lewat SQL manual atau instance server lain.
const CACHE_TTL_MS = Number(process.env.RBAC_CACHE_TTL_MS ?? 30_000);

const userRoleCache = new Map(); // userId -> { roleId, expires }
const roleAccessCache = new Map(); // roleId | "default" -> { access, expires }

const EMPTY_ACCESS = Object.freeze({
    roleId: null,
    role: null,
    isSuperadmin: false,
    permissions: [],
});

function toAccess(roleRow) {
    if (!roleRow) return EMPTY_ACCESS;
    return {
        roleId: roleRow.id,
        role: roleRow.slug,
        isSuperadmin: roleRow.is_superadmin,
        permissions: (roleRow.role_permissions ?? []).map((rp) => rp.permissions.key),
    };
}

async function getUserRoleId(userId) {
    const hit = userRoleCache.get(userId);
    if (hit && hit.expires > Date.now()) return { found: true, roleId: hit.roleId };

    const { data, error } = await supabase
        .from("users")
        .select("role_id")
        .eq("id", userId)
        .maybeSingle();
    if (error) throw error;
    if (!data) return { found: false, roleId: null };

    userRoleCache.set(userId, { roleId: data.role_id, expires: Date.now() + CACHE_TTL_MS });
    return { found: true, roleId: data.role_id };
}

async function getRoleAccess(cacheKey, loader) {
    const hit = roleAccessCache.get(cacheKey);
    if (hit && hit.expires > Date.now()) return hit.access;

    const access = toAccess(await loader());
    roleAccessCache.set(cacheKey, { access, expires: Date.now() + CACHE_TTL_MS });
    return access;
}

const RbacService = {
    // Dipakai middleware authenticate. Return null jika user tidak ada di DB.
    // User tanpa role (role_id NULL) otomatis diperlakukan sebagai role default.
    async getUserAccess(userId) {
        const { found, roleId } = await getUserRoleId(userId);
        if (!found) return null;

        if (roleId) {
            const access = await getRoleAccess(roleId, () => RoleModel.getById(roleId));
            if (access !== EMPTY_ACCESS) return access;
        }
        return getRoleAccess("default", () => RoleModel.getDefault());
    },

    // Dipakai saat membuat user baru (register / Google SSO).
    async getDefaultRoleId() {
        const access = await getRoleAccess("default", () => RoleModel.getDefault());
        return access.roleId;
    },

    invalidateUser(userId) {
        userRoleCache.delete(userId);
    },

    // Panggil setelah permission / properti sebuah role berubah.
    invalidateRoles() {
        roleAccessCache.clear();
    },
};

export default RbacService;
