# Contributing a Worker

1. Salin `templates/basic-worker` ke `workers/<publisher>/<slug>`.
2. Ganti identitas manifest; `id`, `slug`, `version`, dan `instance.default_name` wajib stabil serta route-safe.
3. Deklarasikan hanya permission yang benar-benar digunakan.
4. Simpan logika domain di fungsi terpisah dari handler SDK.
5. Tambahkan tes untuk happy path, input invalid, dan permission-sensitive behavior.
6. Jalankan `npm run check` sebelum mengirim perubahan.

Worker tidak boleh mengakses database Core, filesystem host, token user, atau Worker lain secara langsung. Gunakan `ctx.storage`, `ctx.chat`, `ctx.config`, `ctx.secrets`, `ctx.network`, dan kontrak action yang disediakan runtime.

## Identitas instance

- Core membentuk nama publik dengan format `@{instance-name}.{owner-username}` dari `instance.default_name` dan username pemilik. Contoh Notes milik `@rizalsambayu` adalah `@notes.rizalsambayu`, dengan halaman publik `/@notes.rizalsambayu`.
- Satu user hanya boleh memiliki satu instance dari Worker Definition yang sama. Worker package tidak boleh mengakali batas ini dengan suffix acak.
- Akses Editor atau Guest ke instance milik user lain adalah membership, bukan kepemilikan instance tambahan.
- Worker harus memakai UUID instance dari runtime untuk penyimpanan, otorisasi, relasi, dan event. Nama publik hanya identitas yang dapat dibaca user.
