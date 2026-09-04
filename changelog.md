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

## 2026-09-04 — `[Akademik]` Rapor STS (cetak per siswa) + kolom NISN

### Ditambahkan
- **Rapor STS** — laporan cetak per siswa berbasis nilai STS murni (fondasi datanya sudah dibangun sesi sebelumnya). Alur: `wali-hub.html` → `rapor-sts-hub.html` (pilih kelas) → `rapor-sts-pilih-siswa.html` (pilih siswa) → `rapor-sts-cetak.html` (pratinjau + cetak).
  - Nilai per mapel = rata-rata tertimbang `bobotMapel` dari nilai STS murni per TP dalam cakupan STS mapel itu (fungsi baru `getRaporSTSSiswa()`), **independen dari SLM/SAS** — beda dari nilai akhir rapor resmi.
  - Layout mengikuti template PDF yang diberikan pemilik proyek: header identitas 2 kolom, tabel flat No/Mata Pelajaran/Nilai Akhir (tanpa Capaian Kompetensi), footer 3 kolom tanda tangan (Orang Tua/Kepala Sekolah/Wali Kelas).
  - **Mekanisme cetak mengadopsi pola aplikasi v1** (`rapor/preview.html`), BUKAN pola `@media print` di halaman yang sama seperti `cetak-laporan.html` Tahsin-Tahfizh: tombol Cetak membuka jendela baru independen (`window.open`+`document.write`) dengan `@page{ @bottom-left/@bottom-right }` — footer "Kelas | Nama | NISN" dan "Halaman N dari M" muncul otomatis di tiap halaman fisik lewat `counter(page)`/`counter(pages)`, tanpa perlu tahu di muka tabelnya jadi berapa halaman. `tr{page-break-inside:avoid}` + `thead{display:table-header-group}` mencegah baris tabel terpotong; blok tanda tangan dibungkus `page-break-inside:avoid` terpisah.
- **Profil Sekolah** (`admin-hub.html` → `profil-sekolah.html`) — form admin utk nama sekolah, alamat, nama+NBM kepala sekolah, kota untuk baris tanggal rapor. Disimpan sebagai field tambahan di `config/akademik` (merge, tidak menyentuh `semesterAktif`/`tahunAjaran`).
- **Kolom NISN** — field baru di koleksi `siswa` (terpisah dari `nis` yang sudah ada), wajib karena selalu dicantumkan di rapor resmi. Diisi lewat halaman admin baru `kelola-nisn.html` (`admin-hub.html` → per kelas, `saveNisnBatch()` pakai `updateDoc` per siswa — bukan overwrite penuh seperti `seed-siswa.html`, supaya field lain di dokumen siswa aman).

### Diubah
- `assets/firestore-data-akademik.js` — fungsi baru: `getRaporSTSSiswa()`, `saveProfilSekolah()`, `saveNisnBatch()`.
- `wali-hub.html` — kartu baru "Rapor STS".
- `admin-hub.html` — kartu baru "Profil Sekolah" dan "Kelola NISN".

### Catatan
- Status: **belum dikirim/dideploy**.
- **NISN kosong untuk seluruh siswa existing** (403 siswa) — tidak ada sumber data nyata yang bisa dipakai mengisi otomatis. Rapor menampilkan "—" sampai admin mengisi manual lewat `kelola-nisn.html`.
- Rapor STS baru mendukung **satu siswa per satu kali cetak** — opsi "cetak semua siswa sekelas sekaligus" disepakati menyusul, belum dibangun sesi ini.
- Nama Wali Kelas di tanda tangan rapor diambil dari **akun yang sedang login** saat mencetak, bukan dari sumber data terpisah — kalau admin mencetak atas nama wali kelas lain, nama itu perlu diedit manual sebelum dicetak (dicatat sebagai keterbatasan di komentar kode `rapor-sts-cetak.html`).
- Tanggal di entri changelog sesi sebelumnya (restrukturisasi navigasi) dikoreksi dari 2026-09-02 menjadi 2026-09-04 — kesalahan pencatatan tanggal, bukan perubahan isi.

---

## 2026-09-04 — `[Akademik]` Dekomposisi Nilai (SLM/STS/SAS) + restrukturisasi navigasi total

### Ditambahkan
- **Nilai dipecah jadi 3 fitur terpisah** (sebelumnya 1 halaman `nilai-mapel.html` menggabung SLM+SAS):
  - **SLM** (`nilai-slm-hub.html` → `nilai-slm.html`) — input berkelanjutan per TP, pola sama seperti sebelumnya, SAS dihapus dari halaman ini.
  - **STS** (`nilai-sts-hub.html` → cakupan/`nilai-sts-cakupan.html` + input/`nilai-sts.html`) — **baru total**. Guru wajib pilih dulu TP mana yang diikutkan STS (cakupan STS & SAS untuk mapel+kelas yang sama SENGAJA boleh beda, tidak otomatis sama) sebelum bisa input nilai. Disiapkan sebagai fondasi rapor bayangan STS (laporannya sendiri belum dibangun).
  - **SAS** (`nilai-sas-hub.html` → cakupan/`nilai-sas-cakupan.html` + input/`nilai-sas.html`) — pola identik STS, tapi langsung membentuk nilai akhir rapor. Halaman input menampilkan referensi SLM+STS dan pratinjau nilai akhir TP yang live-update saat SAS diketik.
  - Formula nilai akhir TP: `efektifSLM = STS kalau lebih tinggi dari SLM pada TP yang sama, kalau tidak = SLM asli` → `nilaiAkhirTP = efektifSLM×bobotSlm% + SAS×bobotSas%` (SAS tetap opsional per TP seperti sebelumnya).
- **Bobot TP dalam nilai akhir mapel** — field baru `bobotMapel` di `tp_kktp` (via `setup-tp.html`), dipakai `hitungNilaiAkhirMapel()` sebagai rata-rata tertimbang (sebelumnya rata-rata polos). TP lama tanpa field ini dianggap bobot 1 (rata), tidak ada migrasi data.
- **Restrukturisasi navigasi total** — `beranda.html` yang tadinya 1 halaman berat (banyak `await` per penugasan/kelas) dipecah jadi hierarki hub kartu-terpisah:
  ```
  beranda.html (3 kartu: Nilai & Pembelajaran / Wali Kelas / Administrasi)
  ├─ nilai-hub.html → Setup TP & KKTP, SLM, STS, SAS
  ├─ wali-hub.html  → Absensi & Keputusan, Kelola DPL, Kokurikuler, Ekstrakurikuler (segera), Presensi Harian (segera)
  └─ admin-hub.html → Semua Mapel, Kelola Mapel, Generator Akun Guru
  ```
  Peta lengkap & alasan tiap keputusan ada di `antiregresi.md` §8.3.
- Koleksi Firestore baru: `asesmen_cakupan`, `nilai_sts`, `nilai_sas` — skema & rules di `antiregresi.md` §8.4.
- 20 file HTML baru di `akademik/` (daftar lengkap `antiregresi.md` §8.2, tidak diulang di sini).

### Diubah
- `assets/firestore-data-akademik.js` — `hitungNilaiAkhirTP()` tambah parameter `nilaiSts` opsional (posisi terakhir, backward compatible); `hitungNilaiAkhirMapel()` **ganti signature** (terima `[{nilai, bobot}]`, bukan array angka polos — satu-satunya pemanggil lama sudah ikut direstrukturisasi jadi tidak ada breakage); `saveTP()` tambah field `bobotMapel`; blok fungsi baru untuk `asesmen_cakupan`/`nilai_sts`/`nilai_sas`.
- `firestore.rules` — 3 match block baru, pola identik `nilai_tp` (`bolehMapelKelas()`).
- `beranda.html` — ditulis ulang total, landing tipis 3-kartu tanpa `await` mahal (ringkasan tiap kartu dihitung dari `session`, bukan query Firestore).
- `setup-tp.html`, `absensi.html`, `kelola-dpl.html`, `proyek-stem.html` — tombol kembali jadi kondisional per role (guru/wali → hub barunya, admin → `beranda.html`/`admin-hub.html`).
- `nilai-mapel.html` — jadi redirect stub ke `nilai-slm-hub.html`, pola persis `input-nilai.html` (bookmark lama tidak 404).

### Catatan
- Status: **belum dikirim/dideploy** — menunggu pemilik proyek menimpa manual & push.
- Ekstrakurikuler, 7KAIH, Presensi Harian: baru kartu placeholder "Segera", belum ada rancangan detail penilaian.
- Semua file baru & diubah lolos `node --check` (JS di tiap `<script type="module">`) dan audit grep lintas repo (tautan antar halaman, sisa teks salah tempel saat menyalin template STS→SAS/Kokurikuler via `sed`) sebelum diserahkan.

---

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
