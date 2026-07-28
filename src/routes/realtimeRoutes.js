import express from "express";
import RealtimeController from "../controllers/realtimeController.js";

const router = express.Router();

/**
 * @swagger
 * /api/realtime/config:
 *   get:
 *     summary: Get Supabase Realtime channel configuration for frontend
 *     description: |
 *       Mengembalikan konfigurasi channel Supabase Realtime yang bisa digunakan frontend
 *       untuk subscribe perubahan data secara live.
 *
 *       ### Cara pakai di Frontend:
 *       ```js
 *       import { createClient } from '@supabase/supabase-js'
 *
 *       const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 *
 *       // 1. Subscribe live like count
 *       supabase.channel('public:likes')
 *         .on('postgres_changes',
 *           { event: '*', schema: 'public', table: 'likes' },
 *           (payload) => {
 *             // payload.new / payload.old berisi data like
 *             // Refresh like count di UI
 *           }
 *         )
 *         .subscribe()
 *
 *       // 2. Subscribe live komentar
 *       supabase.channel('public:comments')
 *         .on('postgres_changes',
 *           { event: '*', schema: 'public', table: 'comments' },
 *           (payload) => {
 *             // Tambah/hapus komentar di UI secara realtime
 *           }
 *         )
 *         .subscribe()
 *       ```
 *
 *       **Catatan:** Pastikan tabel `likes` dan `comments` sudah di-enable Realtime
 *       di Supabase Dashboard → Database → Replication → Realtime enabled.
 *     tags: [Realtime]
 *     responses:
 *       200:
 *         description: Realtime config
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/RealtimeConfig' }
 */
router.get("/config", RealtimeController.getConfig);

export default router;
