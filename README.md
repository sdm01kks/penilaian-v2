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
  - **Firestore** — seluruh data (pengguna, siswa, riwayat setoran, dst).
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
│   ├── firestore-data.js    #   Akses data siswa & setoran (dgn fallback DEMO_MODE)
│   ├── quran-surah.js       #   Daftar 114 surah (nama & jumlah ayat)
│   ├── logo.png             #   Logo sekolah (transparan, 512×512)
│   ├── favicon-32.png
│   └── apple-touch-icon.png
└── tahsin-tahfizh/          # Modul Tahsin-Tahfizh
    ├── login.html
    ├── input-setoran.html
    ├── seed-siswa.html      #   Utilitas sekali-jalan: isi data siswa ke Firestore
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

Setelah Firebase tersambung, satu koleksi ini perlu diisi sebelum Input
Setoran bisa dipakai sungguhan:

- **`siswa`** (nama, NIS, kelas, jenjang per siswa) — buka
  `tahsin-tahfizh/seed-siswa.html`, login dulu di tab lain, lalu klik
  tombol untuk menulis seluruh siswa sekaligus. NIS dipakai
  sebagai ID dokumen, jadi aman dijalankan ulang (menimpa, bukan
  menduplikasi). Pengelolaan siswa lebih lanjut (naik kelas, siswa baru,
  dst.) akan jadi bagian dari modul Admin, bukan modul Tahsin-Tahfizh ini.

## Catatan Desain: Kenapa Tanpa KKTP

Modul ini sempat memakai kerangka KKTP (skor tertimbang per aspek,
0–100) untuk menilai tahsin-tahfizh, mengikuti pola penilaian akademik.
Setelah dipakai, ini dianggap kurang cocok: hafalan bersifat kumulatif
(bukan tujuan pembelajaran diskrit per unit), dan skor tertimbang tiap
sesi terasa artifisial dibanding menilai bacaan per-ayat secara langsung.

Sebagai gantinya, penilaian harian cukup: jenis setoran, materi, hasil
**Baca & Tandai** (lulus/gagal per ayat + kata yang keliru beserta
jenis kesalahannya), status hafalan, dan catatan guru. Laporan periodik
(progres juz/surah, tren kualitas bacaan, konsistensi setoran) akan
dihasilkan otomatis dari akumulasi data ini di modul Riwayat Siswa /
Rapor — bukan diinput manual per sesi.

## Kontribusi & Alur Kerja

Repo ini dikembangkan bersama pendampingan AI (Claude). Setiap fitur baru
disusun bertahap: satu halaman ditinjau dulu sebelum lanjut ke halaman
berikutnya, supaya arah desain & logika data bisa dikoreksi sedini
mungkin.
