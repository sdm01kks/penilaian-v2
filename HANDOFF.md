# HANDOFF — Sistem Penilaian v2
**SD Muhammadiyah 01 Kukusan**

Catatan kontinuitas sesi singkat: status terkini, apa yang sedang dikerjakan, dan langkah lanjutan yang sudah disepakati. Untuk detail teknis lengkap, lihat `changelog.md` (kronologis) dan `antiregresi.md` (aturan & jebakan). Dokumen ini pertama kali dibuat 2026-09-04, diperbarui 2026-09-06 (Ekstrakurikuler + Rapor SAS), 2026-09-10 (Kelola Data Siswa + Ganti NIS), dan 2026-09-10 lanjutan (Mutasi Siswa).

---

## Status per 2026-09-10 lanjutan (setelah sub-sesi Mutasi Siswa)

**Belum dikirim/dideploy.** Detail penuh di `changelog.md` entri "Mutasi Siswa" dan `antiregresi.md` §11.

**Yang baru selesai:** fitur Mutasi — wali kelas mengusulkan siswa baru masuk atau siswa yang sudah pindah/keluar (`mutasi-hub.html` → `mutasi.html`), admin menyetujui/menolak (`kelola-mutasi.html`, ditautkan dari `admin-hub.html`). Setuju otomatis memanggil `createSiswa()`/`updateSiswaData()` yang sudah ada dari sub-sesi sebelumnya. NIS `-` (belum diketahui) di-generate jadi NIS sementara unik, ditandai `nisSementara:true`, difinalisasi lewat fitur Ganti NIS. Skema `siswa` bertambah `tempatLahir`/`tanggalLahir`, ikut ditambahkan ke form `kelola-siswa.html`.

**Masih berlaku dari sebelumnya:** Impor Data Siswa belum dibangun, menunggu file dari pemilik proyek — **tanyakan format filenya dulu sebelum membangun.**

---

## Status per 2026-09-10 (setelah sub-sesi Kelola Data Siswa + Ganti NIS)

**Belum dikirim/dideploy.** Detail penuh di `changelog.md` entri 2026-09-10 dan `antiregresi.md` §10 (baca §10 dulu kalau melanjutkan area ini — terutama §10.1, peta lengkap 8 koleksi yang menyimpan `siswaId`).

**Yang baru selesai:**
1. `akademik/kelola-siswa.html` (baru, ditautkan dari `admin-hub.html`) — admin bisa lihat siswa per kelas (aktif+nonaktif), edit nama/kelas/jenjang, toggle aktif (soft-delete), tambah siswa baru, dan **Ganti NIS** per siswa.
2. `gantiNis()` di `firestore-data-akademik.js` — migrasi `siswaId` di 8 koleksi (`setoran`, `menulis_log`, `nilai_tp`, `nilai_sts`, `nilai_sas`, `absensi_rapor`, `kokurikuler`, `ekstrakurikuler_siswa`) + `anakIds` akun orang tua, idempoten, progress via callback log ke UI.
3. `firestore.rules` — `setoran`/`menulis_log` ditambah `|| isAdmin()` di `create`+`delete` saja (bukan `update`, tetap `if false`) — lihat alasan di `antiregresi.md` §10.2.
4. Verifikasi: `node --check` pada `firestore-data-akademik.js` + script module `kelola-siswa.html`, audit brace/paren/bracket, audit balance tag `<div>`, grep pemakaian fungsi baru — semua bersih. **Belum diuji end-to-end dengan Firestore sungguhan.**

**Belum dikerjakan (arah lanjutan yang sudah disinggung pemilik proyek):**
- **Impor Data Siswa** — pemilik proyek berencana mengirim file sumber data siswa untuk sesi berikutnya. Belum ada keputusan arsitektur soal ini (format file belum diketahui, apakah upsert create+update, apakah menggantikan `seed-siswa.html`) — **tanyakan dulu format filenya sebelum membangun**, jangan berasumsi mengikuti pola `import-nisn.html` begitu saja karena kebutuhannya bisa beda (import-nisn hanya UPDATE field nisn siswa existing, tidak pernah CREATE siswa baru).

---

## Status per 2026-09-06 (setelah sub-sesi Ekstrakurikuler + Rapor SAS)

**Belum dikirim/dideploy.** Seluruh pekerjaan sesi ini (lihat entri `changelog.md` 2026-09-06) baru diserahkan sebagai arsip file ke pemilik proyek — belum ditimpa ke repo lokal, belum di-commit, belum di-push.

**Repo yang diterima sesi ini (per 2026-09-04) TIDAK memuat scaffold Ekstrakurikuler/Rapor SAS apa pun** — kedua fitur dibangun dari nol pada sesi ini, bukan melanjutkan pekerjaan sebelumnya.

**Yang baru selesai, urutan kronologis:**
1. **Keputusan arsitektur disepakati dulu sebelum coding** (detail penuh di `antiregresi.md` §9): Ekstrakurikuler dinilai wali kelas (bukan pembina lintas kelas spt v1), predikat 4-level tetap (Layak/Cakap/Mahir/Tidak Ikut), Rapor SAS dibangun PENUH (capaian naratif + kokurikuler + ekstrakurikuler + absensi + catatan + keputusan) — bukan flat spt Rapor STS.
2. **Modul Ekstrakurikuler** — data layer baru (`ekstrakurikuler`, `ekstrakurikuler_siswa`) + `kelola-ekstrakurikuler.html` (admin) + `ekstrakurikuler-hub.html` + `ekstrakurikuler.html` (wali kelas), pola UI diambil dari `setup-tp.html` dan `kokurikuler.html` yang sudah ada.
3. **Rapor SAS** — `getRaporSASSiswa()` (nilai resmi + capaian naratif), `getKokurikulerRaporSiswa()`, `getEkstrakurikulerRaporSiswa()` di data layer; `rapor-sas-hub.html` → `rapor-sas-pilih-siswa.html` → `rapor-sas-cetak.html` (disalin dari `rapor-sts-*`, diaudit grep — 1 link lolos sed, sudah diperbaiki, lihat `antiregresi.md` §9.5).
4. `wali-hub.html` — kartu Ekstrakurikuler aktif (dari "Segera"), kartu baru Rapor Semester (SAS). `admin-hub.html` — kartu baru Kelola Ekstrakurikuler. `firestore.rules` — 2 match block baru.
5. Verifikasi: `node --check` pada `firestore-data-akademik.js` + semua script module di 8 file baru/diubah, audit brace/paren/bracket & tag `<div>`, audit grep sisa teks "STS" — semua bersih.

**Modul Tahsin-Tahfizh** tidak tersentuh sesi ini.

---

## Langkah lanjutan yang sudah disepakati (belum dikerjakan)

1. **Uji manual oleh pemilik proyek** — Rapor SAS baru bisa dilihat terisi penuh kalau ada data sungguhan: mapel+TP+KKTP, proyek STEM+DPL, nilai SLM/STS/SAS, Ekstrakurikuler, dan Absensi&Keputusan untuk siswa yang sama. Belum diuji end-to-end dengan data nyata sesi ini (hanya diverifikasi sintaks & konsistensi kode).
2. **Isi minimal 1 kegiatan Ekstrakurikuler** lewat `kelola-ekstrakurikuler.html` sebelum wali kelas bisa mengisi nilai — halaman `ekstrakurikuler-hub.html`/`ekstrakurikuler.html` akan menampilkan pesan kosong kalau belum ada kegiatan aktif.
3. **Cetak Rapor SAS massal sekelas — TIDAK DIBANGUN**, alasan sama persis Rapor STS (lihat `antiregresi.md` §8.11) — satu-siswa-per-cetak, final.
4. **Jalankan Impor NISN** — masih pekerjaan admin yang tertunda dari sesi sebelumnya (lihat riwayat `changelog.md` 2026-09-04), NISN 403 siswa masih kosong.
5. **7KAIH, Presensi Harian** — status sama seperti tercatat sebelumnya, belum ada progres baru.

---

## Kalau melanjutkan sesi ini (checklist orientasi cepat)

1. Baca `antiregresi.md` §9 dulu untuk Ekstrakurikuler/Rapor SAS — khususnya §9.1 (kenapa TIDAK ada pembina lintas kelas), §9.4 (cakupan resmi Rapor SAS, MENGGANTIKAN asumsi lama "cukup salin rapor-sts").
2. §8.10/§8.11 tetap berlaku utuh (lokasi hub di `wali-hub.html`, pola cetak jendela baru + `@page`).
3. Minta **zip seluruh repo terbaru** ke pemilik proyek sebelum mengubah file bersama (`firestore.rules`, `assets/firebase.js`, `assets/style.css`, `assets/firestore-data.js`) — lihat `antiregresi.md` §2.
4. Kalau menyalin halaman existing sebagai basis halaman baru: baca `antiregresi.md` §8.8 DAN §9.5 (jebakan nama file yang tidak ikut ter-`sed` kalau regex-nya cuma menyasar kata tampilan, bukan nama file).
5. Update `changelog.md` dan `antiregresi.md` di akhir sesi, sebelum menyerahkan file ke pemilik proyek — bukan sesudahnya.


