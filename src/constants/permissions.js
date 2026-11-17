// Daftar key permission yang dipakai di kode.
// HARUS sama dengan baris di tabel `permissions` (lihat supabase/migrations).
// Menambah permission baru: tambah di sini + buat migrasi INSERT ke tabel permissions.
const PERMISSIONS = Object.freeze({
    POSTS_CREATE: "posts:create",
    POSTS_UPDATE_OWN: "posts:update:own",
    POSTS_DELETE_OWN: "posts:delete:own",
    POSTS_DELETE_ANY: "posts:delete:any",

    COMMENTS_CREATE: "comments:create",
    COMMENTS_DELETE_OWN: "comments:delete:own",
    COMMENTS_DELETE_ANY: "comments:delete:any",

    LIKES_TOGGLE: "likes:toggle",

    CATEGORIES_CREATE: "categories:create",
    CATEGORIES_UPDATE: "categories:update",
    CATEGORIES_DELETE: "categories:delete",

    USERS_READ_INACTIVE: "users:read:inactive",
    USERS_UPDATE_OWN: "users:update:own",
    USERS_UPDATE_ANY: "users:update:any",
    USERS_DELETE_OWN: "users:delete:own",
    USERS_DELETE_ANY: "users:delete:any",
    USERS_MANAGE_STATUS: "users:manage_status",
    USERS_ASSIGN_ROLE: "users:assign_role",

    ROLES_READ: "roles:read",
    ROLES_MANAGE: "roles:manage",
});

export default PERMISSIONS;
