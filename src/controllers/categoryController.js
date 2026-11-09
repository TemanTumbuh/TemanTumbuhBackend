import CategoryService from "../services/categoryService.js";

function handleError(res, err, tag) {
    if (!err.status) console.error(`[${tag}]`, err);
    return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Internal server error" });
}

const CategoryController = {
    // GET /api/v1/categories
    async list(req, res) {
        try {
            const data = await CategoryService.listCategories(req.query, req.user);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return handleError(res, err, "CategoryController.list");
        }
    },

    // GET /api/v1/categories/:id
    async getById(req, res) {
        try {
            const data = await CategoryService.getCategory(req.params.id);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return handleError(res, err, "CategoryController.getById");
        }
    },

    // POST /api/v1/categories
    async create(req, res) {
        try {
            const data = await CategoryService.createCategory(req.body);
            return res.status(201).json({ success: true, message: "Kategori berhasil dibuat.", data });
        } catch (err) {
            return handleError(res, err, "CategoryController.create");
        }
    },

    // PATCH /api/v1/categories/:id
    async update(req, res) {
        try {
            const data = await CategoryService.updateCategory(req.params.id, req.body);
            return res.status(200).json({ success: true, message: "Kategori berhasil diperbarui.", data });
        } catch (err) {
            return handleError(res, err, "CategoryController.update");
        }
    },

    // DELETE /api/v1/categories/:id
    async remove(req, res) {
        try {
            await CategoryService.deleteCategory(req.params.id);
            return res.status(200).json({ success: true, message: "Kategori berhasil dihapus." });
        } catch (err) {
            return handleError(res, err, "CategoryController.remove");
        }
    },
};

export default CategoryController;