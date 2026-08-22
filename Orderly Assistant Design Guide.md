# Orderly Assistant Design Guide

Status: proposal pengembangan, bukan kontrak stabil.

## 1. Keputusan nama

Nama Worker adalah **Orderly Assistant** dengan default instance name **`assistant`**. Sesuai kontrak Worker Instance, public handle dibentuk sebagai **`@assistant.{owner-username}`**. Contoh milik `@rizalsambayu` adalah `@assistant.rizalsambayu` dengan halaman `/@assistant.rizalsambayu`.

Setiap user memiliki tepat satu instance sistem Orderly Assistant. Handle bersifat global dan memuat username owner, sementara setiap instance MUST memiliki UUID internal unik dan owner user yang unik di database.

```text
@user-a -> assistant_instance_uuid_a -> @assistant.user-a
@user-b -> assistant_instance_uuid_b -> @assistant.user-b
```

Instance ini dibuat otomatis ketika akun diaktifkan atau melalui proses backfill idempoten. Ia tidak berasal dari tindakan `Gunakan` di Worker Store dan tidak boleh dipindahkan kepemilikannya.

## 2. Tujuan

Orderly Assistant adalah worker sistem bawaan yang menjadi:

- inbox notifikasi dan undangan;
- antarmuka percakapan untuk pengaturan akun;
- pintu pencarian profil publik dan rekomendasi yang diizinkan;
- koordinator tindakan antar-user dan antar-worker;
- histori ringkas tindakan dan notifikasi.

Orderly Assistant bukan administrator tanpa batas. Semua tindakan tetap melalui capability, permission, validasi, dan audit Orderly Core.

## 2.1 Primary Worker direction

Orderly Assistant adalah Worker utama milik user dan menjadi titik koordinasi masa depan:

```text
User → Orderly Assistant → Other Workers
```

Implementasi saat ini hanya mempertahankan perilaku yang sudah tersedia, terutama notifikasi, undangan, chat, dan activity history. Delegasi atau kontrol Worker lain tidak boleh diasumsikan tersedia sampai ada capability, permission grant, audit, dan kontrak runtime yang eksplisit.

## 3. Chat dan Workspace

Chat menyimpan percakapan interaktif. Workspace Assistant menampilkan **activity history**, bukan salinan percakapan penuh.

Contoh activity:

```text
@temanmu mengundang Anda ke @notes.temanmu.
Anda menerima undangan sebagai Editor pukul 10.14.
Anda mengubah tema profil menjadi hijau pukul 11.02.
Anda menambahkan link GitHub “Project Saya” pukul 11.08.
Anda meminta rekomendasi kafe di Jogja pukul 13.20.
```

Activity record SHOULD menyimpan jenis aksi, actor, target, status, ringkasan aman, timestamp, correlation ID, dan referensi objek. Activity history MUST NOT menyimpan secret, token API, prompt internal, atau seluruh isi percakapan secara otomatis.

## 4. Undangan dengan rich action

Undangan workspace dikirim sebagai pesan sistem terstruktur di chat Assistant.

```text
@temanmu mengundangmu ke workspace @notes.temanmu sebagai Editor.

[Terima] [Tolak]
```

Tombol adalah action terstruktur, bukan teks yang ditafsirkan bebas. Action MUST memiliki invitation ID, expiry, status, actor, target instance, offered role, dan token sekali pakai atau mekanisme server-side ekuivalen.

Pemrosesan accept/reject MUST bersifat idempoten. UI MUST menampilkan status akhir dan tidak boleh menjalankan action dua kali.

Role awal:

- `owner`: mengelola instance dan membership;
- `editor`: membaca dan mengubah workspace;
- `guest`: hanya melihat.

Membership dapat menargetkan user atau instance worker lain. Member instance berarti agent tersebut memperoleh akses ke target sesuai role dan capability grant, bukan akses transitif ke seluruh akun pemiliknya.

## 5. Tindakan akun melalui chat

Contoh:

```text
“Ganti tema profil menjadi hijau.”
“Tambahkan link GitHub ini dengan judul Project Saya.”
```

Assistant harus mengubah intent menjadi action plan terstruktur. Tindakan berisiko rendah MAY dieksekusi langsung jika user sudah mengaktifkan preferensi tersebut. Tindakan destruktif, sensitif, ambigu, eksternal, atau berdampak luas MUST meminta konfirmasi eksplisit.

Orderly Assistant MUST menggunakan capability sempit seperti:

```text
account.profile.theme.write
account.profile.links.write
directory.public.search
workspace.invitation.respond
activity.write
```

Ia MUST NOT memperoleh raw database access atau capability generik seperti `account:*`.

## 6. Pencarian dan rekomendasi

Assistant MAY mencari profil publik Orderly untuk memenuhi permintaan user dan memberi link langsung ke hasil yang relevan. Pencarian harus menghormati visibilitas profil, rate limit, ranking yang dapat dijelaskan, serta tidak mengekspos email, nomor telepon, atau data nonpublik.

Rekomendasi web eksternal, misalnya kafe di Jogja, memerlukan provider pencarian yang dikonfigurasi dan permission HTTP/search. Hasil SHOULD menyertakan sumber dan waktu pencarian. Jika provider belum tersedia, Assistant harus menjelaskan keterbatasan dan tidak mengarang hasil.

## 7. AI provider

Orderly Assistant dapat menggunakan model yang disediakan Orderly atau API milik user. Provider AI tidak menentukan otoritas. Runtime capability dan policy server tetap menjadi security boundary.

Prompt/model output MUST diperlakukan sebagai input tidak tepercaya. Model hanya mengusulkan action; Core memvalidasi identity, permission, membership, schema, confirmation policy, dan idempotency sebelum mengeksekusi.

## 8. Identitas dan resolusi

Instance internal:

```text
id: UUID unik
worker_definition_id: compatibility ID Orderly Assistant
owner_user_id: UUID user, unik untuk Assistant
instance_name: assistant
public_handle: @assistant.rizalsambayu
system_managed: true
```

Link dan event internal MUST menggunakan UUID, bukan hanya handle. Prefix/default instance name `assistant` untuk Worker Definition resmi Orderly Assistant bersifat reserved; user atau contributor tidak boleh mendaftarkannya untuk Worker lain. Public route mengikuti `/@assistant.{owner-username}`.

## 9. Lifecycle

- dibuat otomatis setelah aktivasi akun;
- selalu tersedia di Chat dan Worker List sesuai kebijakan UI;
- MAY dinonaktifkan notifikasi proaktifnya oleh user;
- MUST NOT dapat dihapus permanen melalui UI biasa;
- penghapusan akun mengikuti retensi dan cascade policy platform;
- upgrade SHOULD mendukung rollout, rollback, dan migrasi activity schema.

## 10. Model data konseptual

```text
worker_instances
  id, worker_definition_id, owner_user_id, public_handle,
  system_managed, status, version, inserted_at, updated_at

worker_instance_memberships
  id, instance_id, subject_type, subject_id, role,
  invited_by_user_id, status, inserted_at, updated_at

worker_invitations
  id, instance_id, inviter_user_id, invitee_type, invitee_id,
  offered_role, status, expires_at, responded_at

worker_activities
  id, assistant_instance_id, actor_type, actor_id, event_type,
  target_type, target_id, summary, status, correlation_id, occurred_at
```

`subject_type` dan `invitee_type` minimal mendukung `user` dan `worker_instance`. Database constraints MUST mencegah owner ganda yang tidak valid, membership duplikat, dan Assistant lebih dari satu per user.

## 11. Event minimum

```text
workspace.invitation.created
workspace.invitation.accepted
workspace.invitation.rejected
workspace.membership.changed
account.profile.theme.changed
account.profile.link.added
assistant.search.requested
assistant.search.completed
assistant.action.failed
```

Event delivery, retries, deduplication, dan correlation ID mengikuti Runtime Specification.

## 12. Tahap implementasi

1. Definisi resmi Orderly Assistant dan provisioning satu instance per user.
2. Database instance, membership, invitation, dan activity.
3. Chat rich actions Terima/Tolak dengan idempotency.
4. Workspace activity history realtime.
5. Capability tema profil dan link profil.
6. Directory public search.
7. Provider AI dan pencarian eksternal.
8. Worker-to-worker delegation dengan grant eksplisit.

Instance identity, ownership, dan membership Assistant sudah diprovisikan melalui backend dan PostgreSQL. Pesan, activity history, dan sebagian read-state masih memakai `localStorage` sampai persistence server untuk area tersebut selesai.

## 13. Hal yang masih perlu diputuskan

- apakah Assistant selalu terlihat di Worker List atau hanya Chat;
- kebijakan retensi activity dan percakapan;
- tindakan mana yang boleh auto-execute;
- apakah `guest` identik dengan viewer atau perlu role `viewer` terpisah;
- sumber pencarian eksternal dan model AI default;
- batas delegasi worker-to-worker dan mekanisme pencabutan grant.

## 14. Typed orchestration direction

Orderly Assistant is the user's primary coordinator, but orchestration MUST use the same typed connection contract as other Workers. A connection lists granted capabilities per target instance; it does not expose target storage or create transitive authority. Assistant may search/read or request an action only when the target publishes that capability and the owner grants it. Financial, physical, sensitive, and irreversible calls remain subject to confirmation outside the model.

Assistant instance instructions and knowledge use the lower-priority instance layer. They cannot override Orderly policy, package system instructions, permission grants, or audit requirements. Follow `Orderly Worker AI, Knowledge, and Connection Specification.md`.
