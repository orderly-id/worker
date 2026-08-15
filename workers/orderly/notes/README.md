# Notes

Notes adalah Worker pertama untuk memvalidasi alur Worker Store, pembuatan Worker Instance, Chat, dan penyimpanan data yang terisolasi per instance.

## Status

Worker reference yang dapat diuji. Handler Chat membuat catatan, action menyediakan list/create, dan data disimpan melalui `ctx.storage` yang diisolasi runtime per instance.

## Identitas

- Worker ID: `wrk_01k2notes000000000000000001`
- Slug: `notes`
- Publisher: `Orderly`
- Version: `0.1.0`

Nama Worker tidak harus unik. `Worker ID` adalah identitas internal Worker Definition yang unik dan tidak berubah. User menentukan label instance, lalu Orderly menghasilkan public **Instance Name** dengan format `@{slug-label}.{5-karakter-acak}`, misalnya `@catatan-pribadi.a45fc`. UUID terpisah tetap digunakan sebagai Internal ID instance.

## Chat

Kirim `catat <isi>` untuk menyimpan catatan ke folder default.
