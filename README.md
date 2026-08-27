# Orderly Worker

Repository ini adalah rumah kontrak, template, dan Worker resmi Orderly. Worker tidak mengimpor kode internal Phoenix/Vue; seluruh perilaku menggunakan context SDK yang juga dipakai test harness.

## Identitas instance

Setiap Worker Instance memiliki UUID internal dan public **Instance Name** dengan format:

```text
@{instance-name}.{owner-username}
```

Contoh: Worker Notes menyediakan default instance name `notes`. Jika `@rizalsambayu` menggunakan Notes, Orderly membuat `@notes.rizalsambayu` dengan halaman utama `/@notes.rizalsambayu`.

Halaman root `/@{instance-name}.{owner-username}` adalah **Dashboard** instance. Semua path turunannya, `/@{instance-name}.{owner-username}/*`, merupakan area **Workspace** untuk antarmuka operasional Worker. Seluruh Worker memakai shell UI yang konsisten: Dashboard hanya menampilkan identitas dan ringkasan instance; tombol Worker membuka menu `/workspace`; fitur operasional memiliki route turunannya sendiri; sedangkan `/setting` memusatkan General Setting, User Access, Instance Connect, Worker Information, dan Permissions. Worker boleh menentukan isi fitur dan datanya, tetapi tidak mengganti hierarki shell tersebut.

Contoh route bawaan: Notes memakai `/workspace/folder`, Orderly Assistant memakai `/workspace/notification`, dan FnB Order Management System memakai `/order`, `/catalog`, serta `/respond`. Card, navbar, header section, spacing, status, dan pola navigasi mengikuti komponen platform agar Worker baru tetap mudah dipahami tanpa membatasi UI domain di dalam area kontennya.

Satu user hanya boleh memiliki satu instance dari Worker Definition yang sama. User tetap dapat menjadi Editor atau Guest pada instance milik user lain; membership tersebut tidak membuat instance baru dan tidak mengubah owner. Public Instance Name tidak menggantikan UUID internal untuk authorization, storage scope, relasi, atau event.

## Mulai cepat

```bash
cp -R templates/basic-worker workers/<publisher>/<slug>
npm run validate
npm test
```

Contoh yang tersedia:

- `notes`: storage, chat, dan action workspace;
- `fnb-oms`: katalog, pesanan, pelanggan, chat AI, dan workspace operasional bisnis makanan dan minuman;
- `tasks`: state/status dan action domain;
- `webhook-relay`: konfigurasi secret dan network allowlist.

Lihat [CONTRIBUTING.md](./CONTRIBUTING.md) untuk kontrak kontribusi.

## AI, knowledge, dan koneksi

Worker AI menggunakan prompt, action schema, examples, dan eval yang dimiliki paket Worker. Pemilik instance dapat menambahkan instruksi dan knowledge dalam lapisan yang lebih rendah tanpa memperoleh permission baru. Koneksi antar-Worker harus berupa capability terstruktur, eksplisit, scoped, dapat dicabut, dan bukan akses database atau prompt bebas.

Kontrak lengkap: [Orderly Worker AI, Knowledge, and Connection Specification.md](./Orderly%20Worker%20AI%2C%20Knowledge%2C%20and%20Connection%20Specification.md).
