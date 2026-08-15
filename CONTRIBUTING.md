# Contributing a Worker

1. Salin `templates/basic-worker` ke `workers/<publisher>/<slug>`.
2. Ganti identitas manifest; `id`, `slug`, dan `version` wajib stabil.
3. Deklarasikan hanya permission yang benar-benar digunakan.
4. Simpan logika domain di fungsi terpisah dari handler SDK.
5. Tambahkan tes untuk happy path, input invalid, dan permission-sensitive behavior.
6. Jalankan `npm run check` sebelum mengirim perubahan.

Worker tidak boleh mengakses database Core, filesystem host, token user, atau Worker lain secara langsung. Gunakan `ctx.storage`, `ctx.chat`, `ctx.config`, `ctx.secrets`, `ctx.network`, dan kontrak action yang disediakan runtime.
