# HANDOFF — Sistem Penilaian v2
**SD Muhammadiyah 01 Kukusan**

Catatan kontinuitas sesi singkat: status terkini, apa yang sedang dikerjakan, dan langkah lanjutan yang sudah disepakati. Untuk detail teknis lengkap, lihat `changelog.md` (kronologis) dan `antiregresi.md` (aturan & jebakan). Dokumen ini pertama kali dibuat 2026-09-04, diperbarui 2026-09-06 setelah sub-sesi Ekstrakurikuler + Rapor SAS.

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


