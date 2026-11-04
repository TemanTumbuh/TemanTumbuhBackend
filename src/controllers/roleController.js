import RoleService from "../services/roleService.js";

function handleError(res, err, tag) {
    if (!err.status) console.error(`[${tag}]`, err);
    return res.status(err.status ?? 500).json({ success: false, message: err.message ?? "Internal server error" });
}

const RoleController = {
    // GET /api/roles
    async list(req, res) {
        try {
            const data = await RoleService.listRoles();
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return handleError(res, err, "RoleController.list");
        }
    },

    // GET /api/roles/permissions
    async listPermissions(req, res) {
        try {
            const data = await RoleService.listPermissions();
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return handleError(res, err, "RoleController.listPermissions");
        }
    },

    // GET /api/roles/:id
    async getById(req, res) {
        try {
            const data = await RoleService.getRole(req.params.id);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return handleError(res, err, "RoleController.getById");
        }
    },

    // POST /api/roles
    async create(req, res) {
        try {
            const data = await RoleService.createRole(req.body);
            return res.status(201).json({ success: true, message: "Role berhasil dibuat.", data });
        } catch (err) {
            return handleError(res, err, "RoleController.create");
        }
    },

    // PATCH /api/roles/:id
    async update(req, res) {
        try {
            const data = await RoleService.updateRole(req.params.id, req.body);
            return res.status(200).json({ success: true, message: "Role berhasil diperbarui.", data });
        } catch (err) {
            return handleError(res, err, "RoleController.update");
        }
    },

    // PUT /api/roles/:id/permissions
    async setPermissions(req, res) {
        try {
            const data = await RoleService.setPermissions(req.params.id, req.body.permissions);
            return res.status(200).json({ success: true, message: "Permission role berhasil diperbarui.", data });
        } catch (err) {
            return handleError(res, err, "RoleController.setPermissions");
        }
    },

    // DELETE /api/roles/:id
    async remove(req, res) {
        try {
            await RoleService.deleteRole(req.params.id);
            return res.status(204).send();
        } catch (err) {
            return handleError(res, err, "RoleController.remove");
        }
    },

    // PUT /api/users/:id/role
    async assignToUser(req, res) {
        try {
            const data = await RoleService.assignRoleToUser(req.params.id, req.body.role_id);
            return res.status(200).json({ success: true, message: "Role user berhasil diubah.", data });
        } catch (err) {
            return handleError(res, err, "RoleController.assignToUser");
        }
    },
};

export default RoleController;
