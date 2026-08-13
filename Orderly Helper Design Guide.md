# Orderly Helper Design Guide

Status: proposal pengembangan, bukan kontrak stabil.

## 1. Keputusan nama

Nama Worker yang direkomendasikan adalah **Orderly Helper** dengan public handle bawaan **`@orderly.helper`**. Nama ini membedakan asisten sistem dari merek Orderly dan dari instance buatan user.

Setiap user memiliki tepat satu instance sistem Orderly Helper. Handle tampilannya boleh sama untuk semua user karena resolusi dilakukan dalam konteks akun aktif, tetapi setiap instance MUST memiliki UUID internal unik dan owner user yang unik di database.

```text
User A -> helper_instance_uuid_a -> @orderly.helper
User B -> helper_instance_uuid_b -> @orderly.helper
```

Instance ini dibuat otomatis ketika akun diaktifkan atau melalui proses backfill idempoten. Ia tidak berasal dari tindakan `Gunakan` di Worker Store dan tidak boleh dipindahkan kepemilikannya.

## 2. Tujuan

Orderly Helper adalah worker sistem bawaan yang menjadi:

- inbox notifikasi dan undangan;
- antarmuka percakapan untuk pengaturan akun;
- pintu pencarian profil publik dan rekomendasi yang diizinkan;
- koordinator tindakan antar-user dan antar-worker;
- histori ringkas tindakan dan notifikasi.

Orderly Helper bukan administrator tanpa batas. Semua tindakan tetap melalui capability, permission, validasi, dan audit Orderly Core.

## 3. Chat dan Workspace

Chat menyimpan percakapan interaktif. Workspace Helper menampilkan **activity history**, bukan salinan percakapan penuh.

Contoh activity:

```text
@temanmu mengundang Anda ke @notes-kerja.b8sj8.
Anda menerima undangan sebagai Editor pukul 10.14.
Anda mengubah tema profil menjadi hijau pukul 11.02.
Anda menambahkan link GitHub “Project Saya” pukul 11.08.
Anda meminta rekomendasi kafe di Jogja pukul 13.20.
```

Activity record SHOULD menyimpan jenis aksi, actor, target, status, ringkasan aman, timestamp, correlation ID, dan referensi objek. Activity history MUST NOT menyimpan secret, token API, prompt internal, atau seluruh isi percakapan secara otomatis.

## 4. Undangan dengan rich action

Undangan workspace dikirim sebagai pesan sistem terstruktur di chat Helper.

```text
@temanmu mengundangmu ke workspace @notes-kerja.b8sj8 sebagai Editor.

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

Helper harus mengubah intent menjadi action plan terstruktur. Tindakan berisiko rendah MAY dieksekusi langsung jika user sudah mengaktifkan preferensi tersebut. Tindakan destruktif, sensitif, ambigu, eksternal, atau berdampak luas MUST meminta konfirmasi eksplisit.

Orderly Helper MUST menggunakan capability sempit seperti:

```text
account.profile.theme.write
account.profile.links.write
directory.public.search
workspace.invitation.respond
activity.write
```

Ia MUST NOT memperoleh raw database access atau capability generik seperti `account:*`.

## 6. Pencarian dan rekomendasi

Helper MAY mencari profil publik Orderly untuk memenuhi permintaan user dan memberi link langsung ke hasil yang relevan. Pencarian harus menghormati visibilitas profil, rate limit, ranking yang dapat dijelaskan, serta tidak mengekspos email, nomor telepon, atau data nonpublik.

Rekomendasi web eksternal, misalnya kafe di Jogja, memerlukan provider pencarian yang dikonfigurasi dan permission HTTP/search. Hasil SHOULD menyertakan sumber dan waktu pencarian. Jika provider belum tersedia, Helper harus menjelaskan keterbatasan dan tidak mengarang hasil.

## 7. AI provider

Orderly Helper dapat menggunakan model yang disediakan Orderly atau API milik user. Provider AI tidak menentukan otoritas. Runtime capability dan policy server tetap menjadi security boundary.

Prompt/model output MUST diperlakukan sebagai input tidak tepercaya. Model hanya mengusulkan action; Core memvalidasi identity, permission, membership, schema, confirmation policy, dan idempotency sebelum mengeksekusi.

## 8. Identitas dan resolusi

Instance internal:

```text
id: UUID unik
worker_definition_id: ID Orderly Helper
owner_user_id: UUID user, unik untuk helper
public_handle: @orderly.helper
system_managed: true
```

Link dan event internal MUST menggunakan UUID, bukan hanya handle. Handle `@orderly.helper` bersifat account-scoped dan reserved; user atau contributor tidak boleh mendaftarkannya.

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
  id, helper_instance_id, actor_type, actor_id, event_type,
  target_type, target_id, summary, status, correlation_id, occurred_at
```

`subject_type` dan `invitee_type` minimal mendukung `user` dan `worker_instance`. Database constraints MUST mencegah owner ganda yang tidak valid, membership duplikat, dan helper lebih dari satu per user.

## 11. Event minimum

```text
workspace.invitation.created
workspace.invitation.accepted
workspace.invitation.rejected
workspace.membership.changed
account.profile.theme.changed
account.profile.link.added
helper.search.requested
helper.search.completed
helper.action.failed
```

Event delivery, retries, deduplication, dan correlation ID mengikuti Runtime Specification.

## 12. Tahap implementasi

1. Definisi resmi Orderly Helper dan provisioning satu instance per user.
2. Database instance, membership, invitation, dan activity.
3. Chat rich actions Terima/Tolak dengan idempotency.
4. Workspace activity history realtime.
5. Capability tema profil dan link profil.
6. Directory public search.
7. Provider AI dan pencarian eksternal.
8. Worker-to-worker delegation dengan grant eksplisit.

Implementasi lokal berbasis `localStorage` bukan sumber kebenaran untuk Helper. Fitur ini membutuhkan backend dan database sebelum dianggap aman atau realtime.

## 13. Hal yang masih perlu diputuskan

- apakah Helper selalu terlihat di Worker List atau hanya Chat;
- kebijakan retensi activity dan percakapan;
- tindakan mana yang boleh auto-execute;
- apakah `guest` identik dengan viewer atau perlu role `viewer` terpisah;
- sumber pencarian eksternal dan model AI default;
- batas delegasi worker-to-worker dan mekanisme pencabutan grant.

