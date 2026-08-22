# Notes

Notes adalah Worker pertama untuk memvalidasi alur Worker Store, pembuatan Worker Instance, Chat, dan penyimpanan data yang terisolasi per instance.

## Status

Worker reference yang dapat diuji. Handler Chat membuat catatan, action menyediakan list/create, dan data disimpan melalui `ctx.storage` yang diisolasi runtime per instance.

## Identitas

- Worker ID: `wrk_01k2notes000000000000000001`
- Slug: `notes`
- Publisher: `Orderly`
- Version: `0.2.0`

Nama Worker tidak harus unik. `Worker ID` adalah identitas internal Worker Definition yang unik dan tidak berubah. Notes menyediakan default instance name `notes`. Public **Instance Name** dibentuk dengan format `@{instance-name}.{owner-username}`. Jika `@rizalsambayu` menggunakan Notes, instance yang dibuat adalah `@notes.rizalsambayu` dan halaman utamanya `/@notes.rizalsambayu`. UUID terpisah tetap digunakan sebagai Internal ID instance.

Seorang user hanya dapat memiliki satu instance Notes. Menjadi Editor atau Guest pada Notes milik user lain hanya menambah membership dan tidak membuat instance Notes kedua milik user tersebut. Display label MAY diubah tanpa mengubah Worker Definition atau UUID internal; perubahan instance-name segment harus tetap unik dalam namespace owner.

## Chat

Notes memahami permintaan bahasa Indonesia atau Inggris melalui prompt dan action contract paket. Contoh:

- `catat ulang tahun El tanggal 13 Mei` menggunakan folder default;
- `buat catatan kerja tentang rapat Jumat` memilih folder `Kerja` jika tersedia;
- `simpan di folder Pribadi: perpanjang paspor bulan depan` memilih folder secara eksplisit;
- `buat folder test` disimpan sebagai `Test` melalui normalisasi server;
- target rename, move, atau delete yang ambigu harus menghasilkan pertanyaan klarifikasi.

Urutan resolusi folder adalah: `folder_id` eksplisit dari AI yang tervalidasi, nama folder eksplisit, kecocokan kuat dengan nama folder, kemudian folder default. ID yang tidak dikenal tidak boleh diam-diam diarahkan ke folder default.

## AI resources

```text
prompts/system.md
prompts/action.schema.json
prompts/examples.json
prompts/evals.json
```

`system.md` mendefinisikan perilaku bahasa, role, pemilihan folder, ambiguitas, dan batas keamanan. Schema membatasi action terstruktur. Examples menjadi referensi runtime, sementara evals menjadi acceptance cases dan tidak digunakan sebagai knowledge pengguna.

Saat seed/release, Orderly memuat resource yang direferensikan manifest, memvalidasi bahwa path tetap di dalam paket, lalu menyimpan hasil resolusinya pada Worker Definition. Perubahan prompt memerlukan sinkronisasi versi; file deployment tidak boleh mengubah perilaku instance secara diam-diam.

## Context and safety

Runtime memberi AI daftar folder dan ID, indeks catatan, catatan terbaru, pemilik, pengguna aktif, role, anggota, koneksi yang diizinkan, dan riwayat percakapan terbatas. Model hanya memilih action. Core tetap memvalidasi role, instance scope, folder/note ID, dan menyimpan perubahan.

Isi catatan, dokumen instance, chat, serta output Worker lain adalah data tidak tepercaya dan tidak dapat mengganti system prompt atau permission. Owner/editor dapat menulis; guest hanya dapat membaca/bertanya.

## Knowledge and connections direction

Notes nantinya menyediakan capability terstruktur seperti `notes.search` dan `notes.read`. Worker lain, misalnya Finance, hanya dapat memakai capability yang secara eksplisit diberikan pemilik. Koneksi tidak memberikan seluruh isi Notes atau akses database. Hasil yang dipakai Worker lain harus scoped dan dapat menyertakan citation ke note asal.

Prompt, schema, examples, evals, action planning, dan perilaku domain Notes berasal dari paket ini. `src/index.js#onAction` mengubah hasil AI menjadi versioned capability envelope. Generic package dispatcher menjalankan package pada proses Node terpisah dengan akses filesystem read-only yang dibatasi, memvalidasi action/resource/permission, lalu menyerahkan mutasi kepada capability host Core. Package tidak menerima database credentials.

Adapter PostgreSQL untuk logical model `folders` dan `notes` masih menjadi bagian vertical slice Core sampai manifest-provisioned generic storage selesai. Namun pemilihan action, target, normalisasi domain, reply, dan operation plan tidak lagi berada di `Orderly.Workers.Gateway`.
