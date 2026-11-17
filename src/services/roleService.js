import RoleModel from "../models/roleModel.js";
import PermissionModel from "../models/permissionModel.js";
import UserModel from "../models/userModel.js";
import RbacService from "./rbacService.js";
import { SLUG_REGEX } from "../schemas/roleSchema.js";

function httpError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}

function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);
}

// Row DB (dengan nested role_permissions) -> response JSON.
function formatRole(row) {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        is_system: row.is_system,
        is_default: row.is_default,
        is_superadmin: row.is_superadmin,
        // Superadmin otomatis punya semua izin, daftar eksplisitnya memang kosong.
        permissions: (row.role_permissions ?? []).map((rp) => rp.permissions.key).sort(),
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

// Pastikan semua key ada di katalog permission; kalau tidak -> 400 dengan daftar yang salah.
async function assertPermissionKeysExist(keys) {
    const catalog = new Set((await PermissionModel.getAll()).map((p) => p.key));
    const unknown = [...new Set(keys)].filter((k) => !catalog.has(k));
    if (unknown.length > 0) {
        throw httpError(400, `Permission tidak dikenal: ${unknown.join(", ")}`);
    }
}

async function getRoleOrThrow(id) {
    const role = await RoleModel.getById(id);
    if (!role) throw httpError(404, "Role tidak ditemukan.");
    return role;
}

const RoleService = {
    // GET /api/roles
    async listRoles() {
        const roles = await RoleModel.getAll();
        return roles.map(formatRole);
    },

    // GET /api/roles/permissions
    async listPermissions() {
        return PermissionModel.getAll();
    },

    // GET /api/roles/:id
    async getRole(id) {
        return formatRole(await getRoleOrThrow(id));
    },

    // POST /api/roles
    async createRole({ name, slug, description, permissions = [], is_default = false }) {
        const finalSlug = slug ?? slugify(name);
        if (!SLUG_REGEX.test(finalSlug)) {
            throw httpError(400, "Slug tidak valid. Berikan slug manual (huruf kecil, angka, - dan _).");
        }
        await assertPermissionKeysExist(permissions);

        let created;
        try {
            created = await RoleModel.create({ name, slug: finalSlug, description });
        } catch (error) {
            if (error.code === "23505") throw httpError(409, "Nama atau slug role sudah digunakan.");
            throw error;
        }

        // Insert role + permission tidak satu transaksi; kalau langkah lanjutan gagal, batalkan role-nya.
        try {
            if (permissions.length > 0) await RoleModel.setPermissions(created.id, permissions);
            if (is_default) await RoleModel.setDefault(created.id);
        } catch (error) {
            await RoleModel.remove(created.id).catch(() => {});
            throw error;
        }

        RbacService.invalidateRoles();
        return this.getRole(created.id);
    },

    // PATCH /api/roles/:id
    async updateRole(id, { name, description, is_default }) {
        const role = await getRoleOrThrow(id);

        if (is_default && role.is_superadmin) {
            throw httpError(400, "Role superadmin tidak boleh dijadikan role default.");
        }

        const fields = {};
        if (name !== undefined) fields.name = name;
        if (description !== undefined) fields.description = description;

        try {
            if (Object.keys(fields).length > 0) await RoleModel.update(id, fields);
        } catch (error) {
            if (error.code === "23505") throw httpError(409, "Nama role sudah digunakan.");
            throw error;
        }
        if (is_default) await RoleModel.setDefault(id);

        RbacService.invalidateRoles();
        return this.getRole(id);
    },

    // PUT /api/roles/:id/permissions - ganti seluruh daftar permission role.
    async setPermissions(id, permissions) {
        const role = await getRoleOrThrow(id);
        if (role.is_superadmin) {
            throw httpError(400, "Role superadmin otomatis memiliki semua permission dan tidak dapat diatur.");
        }
        await assertPermissionKeysExist(permissions);

        await RoleModel.setPermissions(id, [...new Set(permissions)]);

        RbacService.invalidateRoles();
        return this.getRole(id);
    },

    // DELETE /api/roles/:id
    async deleteRole(id) {
        const role = await getRoleOrThrow(id);

        if (role.is_system) throw httpError(403, "Role bawaan sistem tidak dapat dihapus.");
        if (role.is_default) {
            throw httpError(409, "Role default tidak dapat dihapus. Jadikan role lain sebagai default terlebih dahulu.");
        }
        const usersCount = await RoleModel.countUsers(id);
        if (usersCount > 0) {
            throw httpError(409, `Role masih dipakai ${usersCount} user. Pindahkan user ke role lain terlebih dahulu.`);
        }

        await RoleModel.remove(id);
        RbacService.invalidateRoles();
    },

    // PUT /api/users/:id/role
    async assignRoleToUser(userId, roleId) {
        const user = await UserModel.getById(userId);
        if (!user) throw httpError(404, "User tidak ditemukan.");

        const newRole = await getRoleOrThrow(roleId);

        // Cegah lockout: jangan biarkan superadmin terakhir diturunkan.
        if (user.role_id && user.role_id !== roleId && !newRole.is_superadmin) {
            const currentRole = await RoleModel.getById(user.role_id);
            if (currentRole?.is_superadmin && (await RoleModel.countSuperadminUsers()) <= 1) {
                throw httpError(409, "Tidak dapat menurunkan superadmin terakhir.");
            }
        }

        await UserModel.update(userId, { role_id: roleId });
        RbacService.invalidateUser(userId);

        return { user_id: userId, role: formatRole(newRole) };
    },
};

export default RoleService;
