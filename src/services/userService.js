import UserModel from "../models/userModel.js";
import RbacService from "./rbacService.js";
import PERMISSIONS from "../constants/permissions.js";
import { can } from "../utils/rbac.js";

const ALLOWED_SEARCH_BY = ["username", "email"];
const ALLOWED_ORDER_BY = ["created_at", "username", "email", "last_login"];
const SELF_PATCHABLE_FIELDS = ["username", "bio", "avatar_url", "place_id"];
// is_active butuh permission users:manage_status. role_id TIDAK diubah lewat PATCH ini,
// gunakan PUT /api/users/:id/role (permission users:assign_role).

// Mapping raw DB row -> response JSON (password_hash tidak pernah disertakan)
function formatUser(row) {
    return {
        id: row.id,
        username: row.username,
        email: row.email,
        bio: row.bio,
        avatar_url: row.avatar_url,
        is_active: row.is_active,
        role_id: row.role_id,
        place_id: row.place_id,
        created_at: row.created_at,
        last_login: row.last_login,
    };
}

const UserService = {
    // Dipakai oleh authService - lookup user by email TERMASUK password_hash/provider.
    // (UserModel.findByEmail sudah select("*"), tapi diekspos ulang di sini secara eksplisit
    // supaya authService tidak perlu import UserModel langsung - satu pintu masuk data user.)
    async findByEmailRaw(email) {
        return UserModel.findByEmail(email);
    },

    // Dipakai oleh authService (Google callback) - lookup by (provider, provider_id).
    async findByProviderAndProviderId(provider, providerId) {
        return UserModel.findByProviderAndProviderId(provider, providerId);
    },

    // Dipakai oleh authService untuk ambil user by id TERMASUK password_hash (mis. saat /auth/me
    // butuh cek provider, atau alur internal lain). Controller publik tetap pakai getUserById().
    async findByIdRaw(id) {
        return UserModel.findById(id);
    },

    // Registrasi user baru (provider='local', dipanggil dari authService.register).
    // Password hashing tetap tanggung jawab authService (User Management tidak tahu soal
    // kata_sandi mentah), tapi UNIQUE-check + insert tetap lewat sini - satu-satunya jalur create.
    async createLocalUser({ username, email, password_hash }) {
        const existing = await UserModel.findByEmail(email);
        if (existing) {
            const err = new Error("Email sudah terdaftar.");
            err.status = 409;
            throw err;
        }

        try {
            const user = await UserModel.create({
                username,
                email,
                password_hash,
                provider: "local",
                role_id: await RbacService.getDefaultRoleId(),
            });
            return user;
        } catch (error) {
            if (error.code === "23505") {
                const err = new Error("username atau email sudah digunakan.");
                err.status = 409;
                throw err;
            }
            throw error;
        }
    },

    // Auto-provisioning untuk Google SSO (dipanggil dari authService saat callback,
    // user belum pernah login dengan provider ini dan emailnya belum terdaftar sama sekali).
    async createGoogleUser({ username, email, providerId, avatarUrl }) {
        try {
            const user = await UserModel.create({
                username,
                email,
                password_hash: null,
                provider: "google",
                provider_id: providerId,
                avatar_url: avatarUrl ?? null,
                role_id: await RbacService.getDefaultRoleId(),
            });
            return user;
        } catch (error) {
            if (error.code === "23505") {
                const err = new Error("username sudah digunakan.");
                err.status = 409;
                throw err;
            }
            throw error;
        }
    },

    // GET /api/users - list dengan pagination, search, sort.
    async listUsers({ page, limit, order, orderBy, search, searchBy, includeInactive }) {
        const parsedPage = Math.max(parseInt(page) || 0, 0);
        const rawLimit = limit === undefined ? 20 : parseInt(limit);
        const parsedLimit = Number.isNaN(rawLimit) ? 20 : Math.max(rawLimit, 0);

        const cleanOrder = order === "asc" ? "asc" : "desc";
        const cleanOrderBy = ALLOWED_ORDER_BY.includes(orderBy) ? orderBy : "created_at";
        const cleanSearchBy = ALLOWED_SEARCH_BY.includes(searchBy) ? searchBy : "username";

        const { data, total } = await UserModel.getAll({
            page: parsedPage,
            limit: parsedLimit,
            order: cleanOrder,
            orderBy: cleanOrderBy,
            search: search || null,
            searchBy: cleanSearchBy,
            includeInactive: !!includeInactive,
        });

        const totalPages = parsedLimit > 0 ? Math.ceil(total / parsedLimit) : 1;

        return {
            data: data.map(formatUser),
            meta: { page: parsedPage, limit: parsedLimit, total, totalPages },
        };
    },

    // GET /api/users/:id
    async getUserById(id) {
        const user = await UserModel.getById(id);
        if (!user) {
            const err = new Error("User tidak ditemukan.");
            err.status = 404;
            throw err;
        }
        return formatUser(user);
    },

    // PATCH /api/users/:id - partial update, hanya field yang diizinkan.
    // Pemilik akun (users:update:own) atau pemegang users:update:any yang boleh mengubah.
    async updateUser(id, body, reqUser) {
        const existing = await UserModel.getById(id);
        if (!existing) {
            const err = new Error("User tidak ditemukan.");
            err.status = 404;
            throw err;
        }

        const isOwner = reqUser?.id === id;
        const allowed =
            (isOwner && can(reqUser, PERMISSIONS.USERS_UPDATE_OWN)) || can(reqUser, PERMISSIONS.USERS_UPDATE_ANY);
        if (!allowed) {
            const err = new Error("Tidak diizinkan mengubah user ini.");
            err.status = 403;
            throw err;
        }

        const fields = {};
        for (const key of SELF_PATCHABLE_FIELDS) {
            if (body[key] !== undefined) fields[key] = body[key];
        }
        if (body.is_active !== undefined && can(reqUser, PERMISSIONS.USERS_MANAGE_STATUS)) {
            fields.is_active = body.is_active;
        }

        if (fields.username !== undefined) {
            if (typeof fields.username !== "string" || fields.username.trim() === "") {
                const err = new Error("username tidak boleh kosong.");
                err.status = 400;
                throw err;
            }
            fields.username = fields.username.trim();
        }

        if (Object.keys(fields).length === 0) {
            return formatUser(existing);
        }

        try {
            const updated = await UserModel.update(id, fields);
            return formatUser(updated);
        } catch (error) {
            if (error.code === "23505") {
                const err = new Error("username sudah digunakan.");
                err.status = 409;
                throw err;
            }
            throw error;
        }
    },

    // DELETE /api/users/:id - hard delete, cascade ditangani DB.
    // Pemilik akun (users:delete:own) atau pemegang users:delete:any yang boleh menghapus.
    async deleteUser(id, reqUser) {
        const existing = await UserModel.getById(id);
        if (!existing) {
            const err = new Error("User tidak ditemukan.");
            err.status = 404;
            throw err;
        }

        const isOwner = reqUser?.id === id;
        const allowed =
            (isOwner && can(reqUser, PERMISSIONS.USERS_DELETE_OWN)) || can(reqUser, PERMISSIONS.USERS_DELETE_ANY);
        if (!allowed) {
            const err = new Error("Tidak diizinkan menghapus user ini.");
            err.status = 403;
            throw err;
        }

        await UserModel.remove(id);
    },
};

export default UserService;
