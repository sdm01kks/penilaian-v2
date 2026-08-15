# Sistem Penilaian v2 — SD Muhammadiyah 01 Kukusan

Generasi baru aplikasi Sistem Penilaian SD Muhammadiyah 01 Kukusan.
Menggantikan versi lama (berbasis Google Sheets API + Google OAuth) dengan
**Firebase (Authentication + Firestore)** sebagai backend, dan desain
antarmuka yang dirombak total dengan pendekatan *mobile-first* — karena
sebagian besar guru menginput nilai langsung dari HP.

Aplikasi ini **internal**, digunakan oleh SD Muhammadiyah 01 Kukusan saja,
dan tidak untuk penggunaan komersial.

## Status & Roadmap

Migrasi dilakukan **bertahap per modul**, bukan sekaligus. Modul yang
paling mendesak dikerjakan lebih dulu.

| Modul | Status | Keterangan |
|---|---|---|
| **Tahsin-Tahfizh** | 🟢 Dalam pengerjaan (prioritas saat ini) | Login ✅ · Input Setoran ✅ · Riwayat Siswa (menyusul) |
| Akademik & Rapor | ⚪ Belum dimulai | Menyusul setelah Tahsin-Tahfizh selesai |
| Ujian Sekolah | ⚪ Belum dimulai | |
| Presensi Siswa | ⚪ Belum dimulai | |

**Target:** seluruh modul selesai migrasi pertengahan **Oktober 2026**.

Versi lama (Google Sheets) tetap berjalan berdampingan selama migrasi,
lalu ditinggalkan total setelah semua modul di sini selesai dan stabil.

## Arsitektur

- **Frontend**: HTML/CSS/JS statis, tanpa framework atau build step —
  bisa langsung di-hosting sebagai static site (GitHub Pages, Firebase
  Hosting, dll).
- **Backend**: Firebase
  - **Authentication** — login email + password untuk guru & admin.
  - **Firestore** — seluruh data (pengguna, siswa, konfigurasi KKTP,
    target hafalan, riwayat setoran, dst).
- Tidak ada server/API custom — halaman berkomunikasi langsung ke
  Firebase lewat Firebase SDK (modular, v10, dimuat dari CDN).

## Struktur Folder

```
penilaian-v2/
├── index.html              # Landing — daftar semua modul & tautannya
├── firestore.rules         # Security rules Firestore (salin ke Firebase Console)
├── assets/                  # Dipakai bersama oleh seluruh modul
│   ├── style.css            #   Design tokens & komponen UI bersama
│   ├── firebase.js          #   Inisialisasi Firebase + helper Auth
│   ├── firestore-data.js    #   Akses data siswa, KKTP, setoran (dgn fallback DEMO_MODE)
│   ├── quran-surah.js       #   Daftar 114 surah (nama & jumlah ayat)
│   ├── logo.png             #   Logo sekolah (transparan, 512×512)
│   ├── favicon-32.png
│   └── apple-touch-icon.png
└── tahsin-tahfizh/          # Modul Tahsin-Tahfizh
    ├── login.html
    ├── input-setoran.html
    ├── seed-kktp.html       #   Utilitas sekali-jalan: isi KKTP bawaan ke Firestore
    ├── seed-siswa.html      #   Utilitas sekali-jalan: isi data siswa kelas 1-5 ke Firestore
    └── riwayat-siswa.html   # (menyusul)
```

Modul berikutnya (Akademik & Rapor, dst.) akan mengikuti pola folder
yang sama, dan memakai `assets/` bersama di root supaya tampilan &
sesi login konsisten di seluruh aplikasi.

## Menjalankan secara lokal

Karena tidak ada build step, cukup jalankan static server apa saja dari
root folder, misalnya:

```bash
npx serve .
# atau
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Konfigurasi Firebase

Sebelum dipakai sungguhan, isi `assets/firebase.js` dengan config asli
dari **Firebase Console → Project Settings → Your apps → Web app**:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

Selama config masih placeholder (`TODO_...`), aplikasi otomatis berjalan
dalam **mode pratinjau (DEMO_MODE)** — login & data disimulasikan lewat
`localStorage`, supaya tampilan & alur tetap bisa dites tanpa Firebase
nyata. Begitu config asli terpasang, DEMO_MODE otomatis nonaktif.

## Menyiapkan Data Awal

Setelah Firebase tersambung, dua koleksi ini perlu diisi sebelum Input
Setoran bisa dipakai sungguhan:

1. **`kktp_tahsin_tahfizh`** (aspek & bobot penilaian) — buka
   `tahsin-tahfizh/seed-kktp.html`, login dulu di tab lain, lalu klik
   tombol "Tulis KKTP ke Firestore". Aman dijalankan berkali-kali.
2. **`siswa`** (nama, NIS, kelas, jenjang per siswa) — buka
   `tahsin-tahfizh/seed-siswa.html`, login dulu di tab lain, lalu klik
   tombol untuk menulis 351 siswa (kelas 1–5) sekaligus. NIS dipakai
   sebagai ID dokumen, jadi aman dijalankan ulang (menimpa, bukan
   menduplikasi). Kelas 6 sengaja tidak diikutkan karena sudah lulus.
   Pengelolaan siswa lebih lanjut (naik kelas, siswa baru, dst.) akan
   jadi bagian dari modul Admin, bukan modul Tahsin-Tahfizh ini.

## Kontribusi & Alur Kerja

Repo ini dikembangkan bersama pendampingan AI (Claude). Setiap fitur baru
disusun bertahap: satu halaman ditinjau dulu sebelum lanjut ke halaman
berikutnya, supaya arah desain & logika data bisa dikoreksi sedini
mungkin.
