# Orderly Worker

Repository ini adalah rumah kontrak, template, dan Worker resmi Orderly. Worker tidak mengimpor kode internal Phoenix/Vue; seluruh perilaku menggunakan context SDK yang juga dipakai test harness.

## Identitas instance

Setiap Worker Instance memiliki UUID internal dan public **Instance Name** dengan format:

```text
@{instance-name}.{owner-username}
```

Contoh: Worker Notes menyediakan default instance name `notes`. Jika `@rizalsambayu` menggunakan Notes, Orderly membuat `@notes.rizalsambayu` dengan halaman utama `/@notes.rizalsambayu`.

Halaman root `/@{instance-name}.{owner-username}` adalah **Dashboard** instance. Semua path turunannya, `/@{instance-name}.{owner-username}/*`, merupakan area **Workspace** untuk antarmuka operasional Worker.

Satu user hanya boleh memiliki satu instance dari Worker Definition yang sama. User tetap dapat menjadi Editor atau Guest pada instance milik user lain; membership tersebut tidak membuat instance baru dan tidak mengubah owner. Public Instance Name tidak menggantikan UUID internal untuk authorization, storage scope, relasi, atau event.

## Mulai cepat

```bash
cp -R templates/basic-worker workers/<publisher>/<slug>
npm run validate
npm test
```

Contoh yang tersedia:

- `notes`: storage, chat, dan action workspace;
- `cafe-oms`: katalog, pesanan, pelanggan, chat AI, dan workspace operasional cafe;
- `tasks`: state/status dan action domain;
- `webhook-relay`: konfigurasi secret dan network allowlist.

Lihat [CONTRIBUTING.md](./CONTRIBUTING.md) untuk kontrak kontribusi.

## AI, knowledge, dan koneksi

Worker AI menggunakan prompt, action schema, examples, dan eval yang dimiliki paket Worker. Pemilik instance dapat menambahkan instruksi dan knowledge dalam lapisan yang lebih rendah tanpa memperoleh permission baru. Koneksi antar-Worker harus berupa capability terstruktur, eksplisit, scoped, dapat dicabut, dan bukan akses database atau prompt bebas.

Kontrak lengkap: [Orderly Worker AI, Knowledge, and Connection Specification.md](./Orderly%20Worker%20AI%2C%20Knowledge%2C%20and%20Connection%20Specification.md).
