# HANDOFF — Sistem Penilaian v2
**SD Muhammadiyah 01 Kukusan**

Catatan kontinuitas sesi singkat: status terkini, apa yang sedang dikerjakan, dan langkah lanjutan yang sudah disepakati. Untuk detail teknis lengkap, lihat `changelog.md` (kronologis) dan `antiregresi.md` (aturan & jebakan). Dokumen ini pertama kali dibuat 2026-09-04, diperbarui hari yang sama setelah sub-sesi kedua.

---

## Status per 2026-09-04 (setelah sub-sesi Rapor STS + NISN)

**Belum dikirim/dideploy.** Seluruh pekerjaan (lihat dua entri `changelog.md` tertanggal 2026-09-04) baru diserahkan sebagai arsip file ke pemilik proyek — belum ditimpa ke repo lokal, belum di-commit, belum di-push.

**Yang baru selesai, urutan kronologis:**
1. Dekomposisi total fitur Nilai (SLM/STS/SAS terpisah) + restrukturisasi navigasi Akademik jadi hierarki hub. Peta lengkap di `antiregresi.md` §8.3.
2. **Rapor STS** (cetak per siswa, satu siswa per cetak) — `wali-hub.html` → `rapor-sts-hub.html` → `rapor-sts-pilih-siswa.html` → `rapor-sts-cetak.html`. Mekanisme cetak diadopsi dari aplikasi v1 (jendela baru + `@page` running footer), BUKAN pola lama `cetak-laporan.html` — lihat `antiregresi.md` §8.11 kalau mau bikin halaman cetak baru lagi.
3. **Profil Sekolah** (`admin-hub.html` → `profil-sekolah.html`) — prasyarat kop & tanda tangan rapor.
4. **Kolom NISN** — field baru di koleksi `siswa`, diisi lewat `kelola-nisn.html` (manual, per kelas).
5. **Impor NISN massal** (`admin-hub.html` → `import-nisn.html`) — unggah file Dapodik (.xlsx), dicocokkan otomatis nama+kelas, tabel review sebelum simpan. Diuji terhadap file Dapodik asli (403 siswa) — semua valid, tidak perlu koreksi. Pola SheetJS/validasi defensif NISN ada di `antiregresi.md` §8.14, dipakai lagi kalau ada impor Excel lain di masa depan.

**NISN masih kosong untuk semua 403 siswa** sampai admin benar-benar menjalankan `import-nisn.html` — fitur ini menyediakan JALANNYA, belum mengisi data produksi.

**Modul Tahsin-Tahfizh** tidak tersentuh sejak entri changelog 2026-08-25.

---

## Langkah lanjutan yang sudah disepakati (belum dikerjakan)

1. **Cetak Rapor STS massal sekelas — DIPUTUSKAN TIDAK DIBANGUN** (bukan "menyusul", final). Alasan: footer per halaman (`@page{ @bottom-left }`) di CSS cetak browser cuma bisa satu isi statis untuk SELURUH dokumen — tidak ada mekanisme native yang stabil lintas-browser untuk mengganti isi footer otomatis per siswa dalam satu dokumen cetak gabungan. Ada teknik `@page` bernama + properti `page:` yang secara teori bisa, tapi dukungan browser belum cukup matang untuk dipertaruhkan pada dokumen resmi seperti rapor — risiko halaman tercetak tanpa identitas siswa yang benar kalau lembarnya tercecer. Pemilik proyek sudah menyetujui: kalau butuh cetak banyak siswa, tetap lewat `rapor-sts-pilih-siswa.html` satu per satu — setiap dokumen dijamin utuh 1 identitas siswa di setiap halamannya. **Jangan diusulkan ulang** kecuali ada perubahan nyata pada dukungan CSS Paged Media di browser target.
2. **Rapor SAS** — belum dibangun, tapi fondasi & pola kerjanya sudah jelas: hampir seluruhnya bisa menyalin `rapor-sts-*` (ganti sumber data ke `nilai_sas`/efektifSLM+SAS gabungan via `hitungNilaiAkhirTP()` yang sudah ada, bukan STS murni). Taruh di `wali-hub.html` juga (§8.10), bukan `nilai-sas-hub.html`.
3. **Jalankan Impor NISN** — pekerjaan admin (bukan pekerjaan sesi Claude), tapi FYI: fitur `import-nisn.html` sudah siap, tinggal admin unggah file Dapodik terbaru dan tinjau hasil pencocokan sebelum menekan Terapkan. Sampai ini dijalankan, rapor yang dicetak akan menampilkan "—" di kolom NISN.
4. **STS "rapor bayangan"**, **7KAIH**, **Ekstrakurikuler**, **Presensi Harian** — status sama seperti tercatat sebelumnya (lihat riwayat `changelog.md` 2026-09-04 entri pertama), belum ada progres baru.

---

## Kalau melanjutkan sesi ini (checklist orientasi cepat)

1. Baca `antiregresi.md` §8 dulu — khususnya §8.10 (kenapa Rapor taruh di wali-hub, bukan nilai-hub), §8.11 (pola cetak mana yang dipakai untuk apa), §8.12 (kenapa NISN pakai `updateDoc`, bukan `seed-siswa.html`).
2. Minta **zip seluruh repo terbaru** ke pemilik proyek sebelum mengubah file bersama (`firestore.rules`, `assets/firebase.js`, `assets/style.css`, `assets/firestore-data.js`) — lihat `antiregresi.md` §2.
3. Kalau menyalin halaman existing sebagai basis halaman baru: baca `antiregresi.md` §8.8 dulu (ada 2 bug nyata yang sempat lolos sed sebelum ketahuan lewat audit grep).
4. Update `changelog.md` dan `antiregresi.md` di akhir sesi, sebelum menyerahkan file ke pemilik proyek — bukan sesudahnya.

