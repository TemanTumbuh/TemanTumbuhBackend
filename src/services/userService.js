import UserModel from "../models/userModel.js";

const ALLOWED_SEARCH_BY = ["username", "email"];
const ALLOWED_ORDER_BY = ["created_at", "username", "email", "last_login"];
const SELF_PATCHABLE_FIELDS = ["username", "bio", "avatar_url", "place_id"];
const ADMIN_ONLY_FIELDS = ["is_active", "role_id"];

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
    // Hanya pemilik akun atau admin yang boleh mengubah.
    async updateUser(id, body, reqUser) {
        const existing = await UserModel.getById(id);
        if (!existing) {
            const err = new Error("User tidak ditemukan.");
            err.status = 404;
            throw err;
        }

        const isOwner = reqUser?.id === id;
        const isAdmin = reqUser?.role === "admin";
        if (!isOwner && !isAdmin) {
            const err = new Error("Tidak diizinkan mengubah user ini.");
            err.status = 403;
            throw err;
        }

        const fields = {};
        for (const key of SELF_PATCHABLE_FIELDS) {
            if (body[key] !== undefined) fields[key] = body[key];
        }
        // is_active dan role_id: admin-only (role_id belum punya tabel sumber kebenaran, ditahan sampai ROLES table ada)
        if (isAdmin) {
            for (const key of ADMIN_ONLY_FIELDS) {
                if (body[key] !== undefined) fields[key] = body[key];
            }
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
    // Hanya pemilik akun atau admin yang boleh menghapus.
    async deleteUser(id, reqUser) {
        const existing = await UserModel.getById(id);
        if (!existing) {
            const err = new Error("User tidak ditemukan.");
            err.status = 404;
            throw err;
        }

        const isOwner = reqUser?.id === id;
        const isAdmin = reqUser?.role === "admin";
        if (!isOwner && !isAdmin) {
            const err = new Error("Tidak diizinkan menghapus user ini.");
            err.status = 403;
            throw err;
        }

        await UserModel.remove(id);
    },
};

export default UserService;
