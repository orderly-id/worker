# Orderly Assistant

Orderly Assistant adalah Worker sistem bawaan yang diprovisikan otomatis satu kali untuk setiap user. User tidak memasangnya dari Worker Store dan tidak membuat instance secara manual.

- Compatibility Worker ID: `wrk_orderly_helper_000000000000001`
- Default instance name: `assistant`
- Public Instance Name: `@assistant.{owner-username}`
- Public route: `/assistant/{owner-username}`
- Ownership: tepat satu instance untuk setiap user
- Peran target: satu-satunya antarmuka chat Worker, notifikasi, histori aksi, pengaturan akun, knowledge Assistant, pengelolaan access/koneksi, dan koordinasi capability Worker sesuai izin

ID internal lama sengaja dipertahankan agar data dan referensi dari implementasi Orderly Helper dapat dimigrasikan tanpa membuat sistem paralel. Target Worker lain ditulis sebagai `#instance.username` di Assistant Chat. Bentuk `#` hanya reference/mention; route dan UUID internal tetap terpisah.

Fitur orkestrasi lengkap belum diaktifkan. Implementasi harus berkembang melalui alur `User → Orderly Assistant → Other Workers` dengan capability yang eksplisit, scoped, dapat dicabut, dan diaudit. Worker non-Assistant tidak memiliki antarmuka chat sendiri; ia tetap dapat digunakan melalui Assistant Chat atau Workspace instance.
