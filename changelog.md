# Changelog — Sistem Penilaian v2
**SD Muhammadiyah 01 Kukusan**

Catatan perkembangan seluruh sistem (Tahsin-Tahfizh, Akademik & Rapor, dan modul lain di masa depan), diurutkan dari yang terbaru ke terlama.

Dokumen ini bukan versioning rilis formal (tidak ada proses build/deploy bertahap — GitHub Pages men-serve langsung dari branch), tapi catatan kronologis "apa yang berubah, kapan, dan kenapa" supaya siapa pun (manusia atau AI) yang melanjutkan pengembangan tidak perlu membaca ulang seluruh histori percakapan/commit.

---

## Cara memakai & menambah entri

- **Urutan**: entri terbaru selalu di paling atas, tepat di bawah bagian ini.
- **Tag modul** di setiap judul entri: `[Tahsin-Tahfizh]`, `[Akademik]`, atau `[Bersama]` (kalau menyentuh file yang dipakai lintas modul — `firestore.rules`, `assets/firebase.js`, `assets/style.css`, `assets/firestore-data.js`, `index.html`).
- **Tanggal**: pakai tanggal sesi kerja sebenarnya (WIB), format `YYYY-MM-DD`. Kalau tidak yakin tanggal pastinya (misalnya saat merapikan histori lama), tulis `[tanggal tidak tercatat]` — jangan mengarang tanggal.
- **Kategori perubahan** per entri, pilih yang relevan: `Ditambahkan`, `Diubah`, `Diperbaiki`, `Dihapus`, `Catatan Insiden`.
- **Untuk perubahan yang berpotensi menyebabkan regresi** (mengubah skema data, mengubah file bersama, dsb.) — tambahkan referensi ke bagian terkait di `antiregresi.md`, dan perbarui `antiregresi.md` itu sendiri kalau ada aturan/jebakan baru yang perlu diwariskan.

---

## 2026-08-25 — `[Tahsin-Tahfizh]` Penilaian Menulis: pemilih Surah/Ayat + rubrik skor

### Ditambahkan
- **Materi Salinan bercabang otomatis** di `catat-menulis.html` sesuai jenjang siswa (`siswa.jenjang`/`siswa.tamatIqro`, bukan nomor kelas):
  - Jenjang Iqro (belum tamat): tetap Jilid + Halaman seperti sebelumnya.
  - Jenjang Al-Qur'an (sudah tamat Iqro): pemilih **Surah Awal/Akhir + Ayat Mulai/Akhir**, konsisten dengan pola yang sudah dipakai di Membaca & Menghapal (`input-setoran.html`).
- **Rubrik Penilaian Menulis**, skor 1-4 per kategori, wajib diisi lengkap untuk jenjang Al-Qur'an sebelum entri bisa disimpan:
  - Kebenaran Huruf & Sambungan *(shurah huruf hijaiyah)*
  - Kelengkapan Harakat *(tasykil)*
  - Keutuhan Teks *(kesesuaian mushaf)*
  - Kerapian & Keterbacaan *(khat)*
  - Rata-rata dihitung otomatis, ditampilkan sebagai lencana di semua tempat riwayat `menulis_log` ditampilkan.
- Field baru pada koleksi Firestore `menulis_log`: `materi` (object, `tipe: 'iqro' | 'quran'`) dan `penilaian` (object, 4 skor integer 1-4, khusus `tipe === 'quran'`). Lihat `antiregresi.md` §4 untuk aturan kompatibilitas mundur.
- CSS baru murni aditif di `assets/style.css`: `.rubrik-legend`, `.rubrik-row`, `.rubrik-head`, `.rubrik-label`, `.rubrik-sublabel`, `.rubrik-skor-btns`, `.rubrik-avg-badge`.

### Diubah
- `riwayat-siswa.html` — tampilan riwayat, panel Edit (surah/ayat + rubrik, cabang berdasarkan `materi.tipe` milik entri itu sendiri, bukan status siswa saat ini), tab Ringkasan.
- `riwayat-anak.html` — kartu "Menulis" di Ringkasan portal orang tua, memakai posisi terakhir & rata-rata skor yang baru.
- `cetak-laporan.html` — narasi otomatis (termasuk deskripsi kualitatif dari rata-rata skor rubrik), statistik, dan log riwayat pada bagian "Menulis Al-Qur'an".

### Catatan
- Status: sudah dikirim & dideploy, **belum dikonfirmasi dites end-to-end** untuk bagian baru (surah picker + rubrik). Alur Iqro lama tidak berubah strukturnya, jadi dianggap tetap aman.
- Semua halaman pembaca (`riwayat-siswa.html`, `riwayat-anak.html`, `cetak-laporan.html`) punya fallback untuk entri `menulis_log` LAMA yang belum punya field `materi`/`penilaian` — tidak perlu migrasi data.

---

## 2026-08-25 — `[Bersama]` Perbaikan insiden: file bersama tertimpa versi lama

### Catatan Insiden
Sesi pengembangan modul Akademik yang berjalan paralel sempat menimpa 2 file bersama dengan versi lama (kemungkinan bekerja dari basis `firestore.rules`/`assets/firestore-data.js` sebelum sejumlah perubahan Tahsin-Tahfizh ditambahkan):
- **`firestore.rules`** — rule `allow update` untuk koleksi `setoran` & `menulis_log` (dasar fitur Edit) hilang, berubah jadi `allow update: if false`.
- **`assets/firestore-data.js`** — fungsi `updateSetoran()` dan `updateMenulisLog()` (35 baris) hilang total. Karena `riwayat-siswa.html` melakukan *static import* kedua fungsi ini, dampaknya bukan cuma tombol Edit mati, tapi seluruh halaman Riwayat Siswa gagal dimuat (module import error) kalau versi rusak ini yang ter-deploy.

### Diperbaiki
- Kedua file dikembalikan (rule update & fungsi yang hilang direstorasi persis seperti versi sebelum tertimpa), tanpa menghapus perubahan sah dari sesi Akademik (koleksi `nilai_tp`, `proyek_stem`, dsb. di `firestore.rules` tetap dipertahankan).
- Ditemukan & dikonfirmasi (bukan insiden) 2 file Tahsin-Tahfizh lain yang berubah tanpa sepengetahuan sesi ini — link "Ke Halaman Utama" di `kelola-akun-ortu.html` dan `target-hafalan.html` dihapus. Setelah dikonfirmasi ke pemilik proyek: **perubahan disengaja**, bukan bug, dibiarkan apa adanya.

### Ditambahkan
- Protokol kerja baru: kalau ada indikasi file bersama mungkin bermasalah, minta **zip seluruh repo** untuk diff sistematis, bukan file bersama satu-satu — cara ini terbukti jauh lebih efektif menemukan perubahan tak terduga. Didetailkan di `antiregresi.md` §2.

---

## `[tanggal tidak tercatat]` — `[Tahsin-Tahfizh]` Fitur Edit entri riwayat

### Ditambahkan
- Fitur Edit di `riwayat-siswa.html` untuk entri `setoran` (field terbatas: jenis, status hafalan, catatan — BUKAN materi/Baca & Tandai, supaya histori bacaan tetap konsisten) dan `menulis_log` (semua field yang relevan).
- Rule `firestore.rules`: `allow update` dengan proteksi kepemilikan (`createdBy == request.auth.uid`) dan penguncian field (`siswaId`, `kelas`, `createdBy` tidak boleh diubah lewat update).

### Catatan
- Sempat tertimpa oleh insiden di atas, sudah diperbaiki dan **dikonfirmasi berfungsi baik oleh pemilik proyek** setelah perbaikan.

---

## `[tanggal tidak tercatat]` — `[Tahsin-Tahfizh]` Pembangunan awal modul

### Ditambahkan
- **Login & role system**: `login.html`, redirect otomatis sesuai role (`admin`, `guru_tahsin_tahfizh`, `orangtua`). Firebase Auth email+password, tanpa Google Sign-In.
- **Input Setoran** (`input-setoran.html`): 3 jenis (Ziyadah/Muroja'ah/Tahsin), Baca & Tandai penuh untuk Al-Qur'an (teks Arab via API `equran.id`) + versi teks-bebas untuk Iqro, toggle "Tamat Iqro" per siswa.
- **Catat Menulis** (`catat-menulis.html`): pencatatan periodik progres menyalin Iqro/Al-Qur'an, terpisah dari antrean harian.
- **Riwayat Siswa** (`riwayat-siswa.html`): 4 tab (Membaca/Menghapal/Menulis/Ringkasan), hapus entri, progress vs Target Hafalan, atribusi "Diinput oleh" (khusus admin).
- **Cetak Laporan** (`cetak-laporan.html`): mode Per Kelas/Per Siswa, narasi otomatis, gauge kualitas bacaan, print-ready A4.
- **Target Hafalan** (`target-hafalan.html`): set target per kelas per semester.
- **Akun Orang Tua**: `daftar-ortu.html` (self-signup), `kelola-akun-ortu.html` (approval admin, pencocokan NIS otomatis), `riwayat-anak.html` (portal read-only untuk orang tua).
- **Seed data**: `seed-siswa.html` — migrasi 403 siswa kelas 1-6 dari CSV (sumber lama: Google Sheets), NIS sebagai document ID Firestore.
- Desain visual hijau-emas islami, font Plus Jakarta Sans + Amiri, mobile-first dengan simulasi "phone-shell" di layar besar.

### Diubah
- **Pergeseran pedagogis**: framework KKTP (rubrik kompetensi generik) ditinggalkan untuk penilaian Membaca, diganti Baca & Tandai (tandai per-ayat saat sesi berlangsung) karena dianggap lebih otentik untuk pedagogi Tahsin-Tahfizh. Koleksi `kktp_tahsin_tahfizh` tidak dipakai aktif lagi tapi rules-nya dipertahankan demi kompatibilitas.

### Dihapus
- Sistem lama berbasis Google Sheets API + Google OAuth (`penilaian-main`) — digantikan bertahap oleh sistem ini.
