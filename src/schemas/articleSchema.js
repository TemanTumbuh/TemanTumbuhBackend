import { z } from "zod";

// ---- GET /articles/:id, PUT /articles/:id, DELETE /articles/:id ----
// Hanya param :id yang divalidasi. Body create/update sengaja tidak divalidasi:
// articleModel.js menulis ke tabel "posts" yang tidak punya kolom title/body,
// jadi POST/PUT /articles sudah gagal di DB apapun isi body-nya - menambah
// skema title/body di sini akan memvalidasi kontrak yang tidak pernah nyata.
const articleIdParamSchema = z.object({
    id: z.string().uuid(),
});

export { articleIdParamSchema };
