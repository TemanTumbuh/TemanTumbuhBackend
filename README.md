# TemanTumbuhBackend
repository resmi website backend TemanTumbuh

## Prasyarat

- Node.js **22 atau lebih baru** (script `dev` memakai `node --watch` bawaan Node)

## Menjalankan di lokal

```bash
npm install
cp .env.example .env   # lalu isi nilainya
npm run dev
```

- Env dibaca dari file **`.env`** (lewat `dotenv`), bukan `.env.local`.
- `npm run dev` otomatis me-restart server setiap ada file yang disimpan.
- Swagger docs tersedia di `http://localhost:<PORT>/api-docs`.

## Menjalankan di production

```bash
npm ci --omit=dev
npm start
```

- `npm ci` memasang persis sesuai `package-lock.json`.
- `--omit=dev` memastikan devDependency tidak ikut terpasang di server.

## CI

`.github/workflows/ci.yml` tidak berjalan otomatis (atas arahan tim DevOps).
Jalankan manual dari tab **Actions → CI → Run workflow**. Isinya:

1. `npm ci`
2. `npm audit --omit=dev --audit-level=high` — gagal bila ada celah
   high/critical di dependency production
3. Smoke test — memastikan server bisa menyala dan merespons
