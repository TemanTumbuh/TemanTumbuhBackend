## [Dev 1.1] - 2026-07-16 [Ramen]

### Added (Sprint: TEMAN-31 / TEMAN-32 / TEMAN-39)

**Database**
- Buat tabel `categories` (`id`, `name`, `slug`, `is_active`)
- Tambah kolom `category_id` (FK → categories) dan `is_pinned` ke tabel `posts`
- Tambah kolom `created_at` ke tabel `post_media`
- Tambah `ON DELETE CASCADE` pada FK `posts.user_id` dan `post_media.post_id`
- Tambah `CHECK (media_type IN ('image','video'))` pada `post_media.media_type`
- Tambah `NOT NULL` yang kurang di `posts.created_at` dan `post_media.sort_order`

**Dependencies**
- Install `sharp` — konversi gambar ke WebP
- Install `multer` — parse multipart/form-data
- Install `@aws-sdk/client-s3` — upload ke Cloudflare R2

**Config & Middleware**
- `src/config/r2.js` — S3Client untuk Cloudflare R2 (S3-compatible)
- `src/middlewares/authenticate.js` — JWT Bearer token middleware, set `req.user`
- `src/middlewares/upload.js` — multer memoryStorage, max 3 file, max 5 MB, image only

**Model**
- `src/models/postModel.js` — query `getAll` (cursor-based pagination), `getById`, `create`, `update`, `remove`, `addMedia`, `getMediaByPostId`

**Service**
- `src/services/postService.js` — business logic: ownership check, camelCase mapping, validasi content/media, serta menangani pembuatan post terpadu (`createPostWithMedia`)
- `src/services/mediaService.js` — konversi WebP via sharp, upload/delete ke R2

**Controller & Routes**
- `src/controllers/postController.js` — handler HTTP untuk 5 endpoint post (GET all, GET by ID, POST unified, PATCH, DELETE)
- `src/routes/postRoutes.js` — definisi route `/api/v1/posts` (GET, POST, PATCH, DELETE) dengan single unified entrypoint untuk POST

### Changed
- `src/app.js` — daftarkan `postRoutes` di `/api/v1/posts`, tambah global error handler
- `.env.example` — tambah 5 env vars Cloudflare R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`)
- `schema.sql` — update ke state final setelah migration


---

