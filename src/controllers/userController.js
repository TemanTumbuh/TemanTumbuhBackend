import UserService from "../services/userService.js";

const UserController = {
    // GET /api/users
    async getAll(req, res) {
        try {
            const { page, limit, order, orderBy, search, searchBy } = req.query;
            const isAdmin = req.user?.role === "admin";
            const result = await UserService.listUsers({
                page,
                limit,
                order,
                orderBy,
                search,
                searchBy,
                includeInactive: isAdmin,
            });
            return res.status(200).json(result);
        } catch (err) {
            console.error("[UserController.getAll]", err);
            return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Internal server error" });
        }
    },

    // GET /api/users/:id
    async getById(req, res) {
        try {
            const user = await UserService.getUserById(req.params.id);
            return res.status(200).json({ success: true, data: user });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Internal server error" });
        }
    },

    // PATCH /api/users/:id
    async update(req, res) {
        try {
            const user = await UserService.updateUser(req.params.id, req.body, req.user);
            return res.status(200).json({ success: true, message: "User berhasil diperbarui.", data: user });
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Internal server error" });
        }
    },

    // DELETE /api/users/:id
    async remove(req, res) {
        try {
            await UserService.deleteUser(req.params.id, req.user);
            return res.status(204).send();
        } catch (err) {
            return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Internal server error" });
        }
    },
};

export default UserController;
