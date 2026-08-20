# Notes

Notes adalah Worker pertama untuk memvalidasi alur Worker Store, pembuatan Worker Instance, Chat, dan penyimpanan data yang terisolasi per instance.

## Status

Worker reference yang dapat diuji. Handler Chat membuat catatan, action menyediakan list/create, dan data disimpan melalui `ctx.storage` yang diisolasi runtime per instance.

## Identitas

- Worker ID: `wrk_01k2notes000000000000000001`
- Slug: `notes`
- Publisher: `Orderly`
- Version: `0.1.0`

Nama Worker tidak harus unik. `Worker ID` adalah identitas internal Worker Definition yang unik dan tidak berubah. Notes menyediakan default instance name `notes`. Public **Instance Name** dibentuk dengan format `@{instance-name}.{owner-username}`. Jika `@rizalsambayu` menggunakan Notes, instance yang dibuat adalah `@notes.rizalsambayu` dan halaman utamanya `/@notes.rizalsambayu`. UUID terpisah tetap digunakan sebagai Internal ID instance.

Seorang user hanya dapat memiliki satu instance Notes. Menjadi Editor atau Guest pada Notes milik user lain hanya menambah membership dan tidak membuat instance Notes kedua milik user tersebut. Display label MAY diubah tanpa mengubah Worker Definition atau UUID internal; perubahan instance-name segment harus tetap unik dalam namespace owner.

## Chat

Kirim `catat <isi>` untuk menyimpan catatan ke folder default.
