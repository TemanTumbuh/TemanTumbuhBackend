import CategoryModel from "../models/categoryModel.js";
import PERMISSIONS from "../constants/permissions.js";
import { can } from "../utils/rbac.js";

function httpError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}

function slugify(name) {
    return name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100);
}

function formatCategory(row) {
    return { id: row.id, name: row.name, slug: row.slug, isActive: row.is_active };
}

// User boleh melihat kategori nonaktif jika punya salah satu permission kelola kategori.
function canSeeInactive(user) {
    return (
        can(user, PERMISSIONS.CATEGORIES_CREATE) ||
        can(user, PERMISSIONS.CATEGORIES_UPDATE) ||
        can(user, PERMISSIONS.CATEGORIES_DELETE)
    );
}

const CategoryService = {
    async listCategories({ includeInactive = false } = {}, reqUser = null) {
        const withInactive = includeInactive && canSeeInactive(reqUser);
        const rows = await CategoryModel.getAll({ includeInactive: withInactive });
        return rows.map(formatCategory);
    },

    async getCategory(id) {
        const row = await CategoryModel.getById(id);
        if (!row) throw httpError(404, "Kategori tidak ditemukan.");
        return formatCategory(row);
    },

    async createCategory({ name, slug, is_active = true }) {
        const finalSlug = slug ?? slugify(name);
        if (finalSlug.length < 2) {
            throw httpError(400, "Slug tidak valid. Berikan slug manual (huruf kecil, angka, dan -).");
        }

        try {
            const row = await CategoryModel.create({ name, slug: finalSlug, isActive: is_active });
            return formatCategory(row);
        } catch (error) {
            if (error.code === "23505") throw httpError(409, "Slug kategori sudah digunakan.");
            throw error;
        }
    },

    async updateCategory(id, { name, slug, is_active }) {
        const fields = {};
        if (name !== undefined) fields.name = name;
        if (slug !== undefined) fields.slug = slug;
        if (is_active !== undefined) fields.is_active = is_active;

        try {
            const row = await CategoryModel.update(id, fields);
            if (!row) throw httpError(404, "Kategori tidak ditemukan.");
            return formatCategory(row);
        } catch (error) {
            if (error.code === "23505") throw httpError(409, "Slug kategori sudah digunakan.");
            throw error;
        }
    },

    // Post yang memakai kategori ini TIDAK dihapus; category_id-nya menjadi NULL (ON DELETE SET NULL).
    async deleteCategory(id) {
        const deleted = await CategoryModel.remove(id);
        if (!deleted) throw httpError(404, "Kategori tidak ditemukan.");
    },

    // Dipakai PostService: pastikan kategori ada dan aktif sebelum post di-link ke sana.
    async assertUsable(id) {
        const row = await CategoryModel.getById(id);
        if (!row) throw httpError(400, "Kategori tidak ditemukan.");
        if (!row.is_active) throw httpError(400, "Kategori tidak aktif.");
    },
};

export default CategoryService;