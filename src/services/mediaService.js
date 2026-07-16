import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import r2 from "../config/r2.js";

// Helper: baca env saat runtime (lazy) agar dotenv sudah pasti terload
function getBucket() {
    const val = process.env.R2_BUCKET_NAME;
    if (!val) throw new Error("R2_BUCKET_NAME tidak ada di .env");
    return val;
}
function getPublicUrl() {
    const val = process.env.R2_PUBLIC_URL;
    if (!val) throw new Error("R2_PUBLIC_URL tidak ada di .env");
    return val.replace(/\/$/, "");
}

const MediaService = {
    // Konversi buffer gambar → WebP (quality 80).
    async convertToWebp(buffer) {
        return sharp(buffer).webp({ quality: 80 }).toBuffer();
    },

    // Upload buffer WebP ke Cloudflare R2:
    // buffer  - WebP buffer
    // key     - path di bucket, e.g. "posts/uuid/0.webp"
    // returns - URL publik file
    async uploadToR2(buffer, key) {
        const command = new PutObjectCommand({
            Bucket: getBucket(),
            Key: key,
            Body: buffer,
            ContentType: "image/webp",
        });

        await r2.send(command);
        return `${getPublicUrl()}/${key}`;
    },

    // Hapus file dari R2 (best-effort, tidak throw jika gagal)
    // key - path di bucket
    async deleteFromR2(key) {
        try {
            const command = new DeleteObjectCommand({ Bucket: getBucket(), Key: key });
            await r2.send(command);
        } catch (err) {
            console.error(`[R2] Gagal hapus key "${key}":`, err.message);
        }
    },

    // Ekstrak key dari URL R2 publik.
    // e.g. "https://domain.r2.dev/posts/uuid/0.webp" → "posts/uuid/0.webp"
    extractKeyFromUrl(url) {
        return url.replace(`${getPublicUrl()}/`, "");
    },
};

export default MediaService;
