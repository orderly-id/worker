# Notes

Notes adalah Worker pertama untuk memvalidasi alur Worker Store, pembuatan Worker Instance, Chat, dan penyimpanan data yang terisolasi per instance.

## Status

Tahap saat ini hanya menyediakan definisi katalog dan manifest awal. Runtime, handler Chat, Workspace, dan penyimpanan server belum diaktifkan.

## Identitas

- Worker ID: `wrk_01k2notes000000000000000001`
- Slug: `notes`
- Publisher: `Orderly`
- Version: `0.1.0`

Nama Worker tidak harus unik. `Worker ID` adalah identitas internal Worker Definition yang unik dan tidak berubah. User menentukan nama instance, lalu Orderly menghasilkan public Instance ID dengan format `@{slug-nama-instance}.{5-karakter-acak}`, misalnya `@catatan-pribadi.a45fc`. UUID terpisah tetap digunakan sebagai identitas internal instance.
