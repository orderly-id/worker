# Orderly Worker

Repository ini adalah rumah kontrak, template, dan Worker resmi Orderly. Worker tidak mengimpor kode internal Phoenix/Vue; seluruh perilaku menggunakan context SDK yang juga dipakai test harness.

## Mulai cepat

```bash
cp -R templates/basic-worker workers/<publisher>/<slug>
npm run validate
npm test
```

Contoh yang tersedia:

- `notes`: storage, chat, dan action workspace;
- `tasks`: state/status dan action domain;
- `webhook-relay`: konfigurasi secret dan network allowlist.

Lihat [CONTRIBUTING.md](./CONTRIBUTING.md) untuk kontrak kontribusi.
