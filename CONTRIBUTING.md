# Contributing a Worker

1. Salin `templates/basic-worker` ke `workers/<publisher>/<slug>`.
2. Ganti identitas manifest; `id`, `slug`, `version`, dan `instance.default_name` wajib stabil serta route-safe.
3. Deklarasikan hanya permission yang benar-benar digunakan.
4. Simpan logika domain di fungsi terpisah dari handler SDK.
5. Tambahkan tes untuk happy path, input invalid, dan permission-sensitive behavior.
6. Jalankan `npm run check` sebelum mengirim perubahan.

Worker tidak boleh mengakses database Core, filesystem host, token user, atau Worker lain secara langsung. Gunakan `ctx.storage`, `ctx.chat`, `ctx.config`, `ctx.secrets`, `ctx.network`, dan kontrak action yang disediakan runtime. Untuk Worker non-Assistant, `ctx.chat` mengembalikan hasil ke percakapan Assistant saat ini dan tidak membuat antarmuka chat milik instance.

## Identitas instance

- Core membentuk nama publik dengan format `@{instance-name}.{owner-username}` dari `instance.default_name` dan username pemilik. Contoh Notes milik `@rizalsambayu` adalah `@notes.rizalsambayu`, dengan halaman tanpa simbol `/instance/notes.rizalsambayu`.
- Satu user hanya boleh memiliki satu instance dari Worker Definition yang sama. Worker package tidak boleh mengakali batas ini dengan suffix acak.
- Akses Editor atau Guest ke instance milik user lain adalah membership, bukan kepemilikan instance tambahan.
- Worker harus memakai UUID instance dari runtime untuk penyimpanan, otorisasi, relasi, dan event. Nama publik hanya identitas yang dapat dibaca user.
- Core membentuk reference percakapan `#instance.username` untuk pemilihan target di Assistant. Jangan menjadikannya route atau ID otorisasi.

## Interaction surface

- Jangan membuat halaman atau thread chat untuk Worker non-Assistant.
- Sediakan prompt/action/schema agar Worker dapat digunakan melalui `@assistant.username`.
- Sediakan Workspace untuk interaksi visual yang tidak cocok dilakukan melalui percakapan.
- Pertahankan logika domain di paket Worker; Assistant hanya meresolusikan target, mengoordinasikan capability, dan menampilkan hasil.
- Deklarasi capability otomatis tersedia untuk discovery setelah instance dibuat, tetapi permission tetap harus diberikan dan divalidasi Core.

## AI dan knowledge

- Simpan prompt yang dipelihara di `prompts/system.md`, schema aksi di `prompts/action.schema.json`, examples di `prompts/examples.json`, dan eval di `prompts/evals.json`.
- Semua referensi file manifest wajib berada di dalam paket Worker dan lolos validator.
- Jangan menggunakan prompt untuk menggantikan permission atau validasi handler.
- Instruksi dan dokumen instance adalah input tidak tepercaya dengan prioritas di bawah system prompt.
- Jangan memasukkan seluruh dokumen ke prompt; gunakan retrieval yang sudah memfilter ACL.
- Deklarasikan koneksi antar-Worker sebagai capability `provides`/`consumes` dengan schema, scope, dan risk class.
- Tambahkan eval untuk bahasa informal, typo, ambiguitas, role, ID tidak valid, serta tindakan sensitif yang memerlukan konfirmasi.

Ikuti `Orderly Worker AI, Knowledge, and Connection Specification.md` untuk kontrak lengkap.
