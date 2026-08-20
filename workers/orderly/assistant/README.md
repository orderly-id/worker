# Orderly Assistant

Orderly Assistant adalah Worker sistem bawaan yang diprovisikan otomatis satu kali untuk setiap user. User tidak memasangnya dari Worker Store dan tidak membuat instance secara manual.

- Compatibility Worker ID: `wrk_orderly_helper_000000000000001`
- Default instance name: `assistant`
- Public Instance Name: `@assistant.{owner-username}`
- Ownership: tepat satu instance untuk setiap user
- Peran saat ini: notifikasi, histori aksi, dan pengaturan akun yang sudah didukung implementasi Orderly

ID internal lama sengaja dipertahankan agar data dan referensi dari implementasi Orderly Helper dapat dimigrasikan tanpa membuat sistem paralel. Fitur orkestrasi Worker belum diaktifkan; arsitektur masa depan mengikuti alur `User → Orderly Assistant → Other Workers` melalui capability yang eksplisit dan diaudit.
