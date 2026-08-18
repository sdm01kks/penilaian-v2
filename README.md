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
| **Tahsin-Tahfizh** | 🟢 Dalam pengerjaan (prioritas saat ini) | Login ✅ · Input Setoran ✅ · Catat Menulis ✅ · Riwayat Siswa ✅ · Cetak Laporan ✅ · Target Hafalan ✅ |
| **Akademik & Rapor** | 🟡 Mulai diujicobakan ke guru | Login ✅ · Setup TP & KKTP ✅ · Input Nilai Mapel ⏳ (menyusul) |
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
│   ├── firestore-data-akademik.js #   Akses data mapel & TP/KKTP modul Akademik (idem)
│   ├── quran-surah.js       #   Daftar 114 surah (nama & jumlah ayat)
│   ├── logo.png             #   Logo sekolah (transparan, 512×512)
│   ├── favicon-32.png
│   └── apple-touch-icon.png
├── tahsin-tahfizh/          # Modul Tahsin-Tahfizh
│   ├── login.html
│   ├── input-setoran.html   # Membaca + Menghapal (harian, per antrean)
│   ├── catat-menulis.html   # Menulis (berkala, bukan per antrean)
│   ├── riwayat-siswa.html   # Riwayat per siswa (3 tab, lintas kelas)
│   ├── cetak-laporan.html   # Laporan cetak per kelas, per periode (semester)
│   ├── target-hafalan.html # Atur target surah/jilid per kelas per semester
│   └── seed-siswa.html      #   Utilitas sekali-jalan: isi data siswa ke Firestore
└── akademik/                # Modul Akademik & Rapor (mulai diujicobakan)
    ├── login.html           #   Sama persis pola & sesi loginnya dengan Tahsin-Tahfizh
    ├── input-nilai.html     #   Landasan: verifikasi kelas/mapel yang diampu guru,
                              #   tautan ke Setup TP & KKTP tiap mapel. Grid isi nilai
                              #   per siswa (SLM per TP + SAS sekali/semester) menyusul.
    └── setup-tp.html        #   CRUD Tujuan Pembelajaran + 4 level KKTP per mapel &
                              #   tingkatan (bukan per kelas paralel — 4A/4B berbagi TP).
```

Akademik & Rapor memakai `assets/` yang sama dengan Tahsin-Tahfizh
(termasuk sesi login — satu akun guru berlaku untuk semua modul,
Firebase Auth bersifat global per browser) supaya tampilan & sesi
login konsisten di seluruh aplikasi. Data & aturan akses tiap modul
tetap dipisah lewat role spesifik (`guru_tahsin_tahfizh` vs
`guru_akademik`) — lihat komentar di `firestore.rules`.

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

## Catatan Desain: Tiga Kompetensi Terpisah

Penilaian tahsin-tahfizh sebenarnya mencakup tiga kompetensi yang
berbeda sifatnya, jadi sengaja dipisah alurnya, bukan dipaksa jadi satu
form:

| Kompetensi | Alur | Frekuensi |
|---|---|---|
| **Membaca** Al-Qur'an | `input-setoran.html` → Baca & Tandai | Per sesi antrean harian |
| **Menghapal** Al-Qur'an | `input-setoran.html` → Ziyadah/Muroja'ah + status hafalan | Per sesi antrean harian |
| **Menulis** Al-Qur'an | `catat-menulis.html` | Berkala (mingguan/bulanan), dari buku salinan fisik siswa |

Menulis sengaja **tidak** dimasukkan ke antrean harian — kompetensi ini
butuh waktu review fokus per anak, bukan penilaian sekilas di sela
antrean (yang selama ini justru membuatnya jadi kegiatan mengisi
waktu, bukan kompetensi yang benar-benar diajar & dinilai). Fase
sekarang: sekadar tercatat rutin (halaman yang disalin sejak terakhir
diperiksa). Penilaian kualitas tulisan menyusul di tahap berikutnya,
setelah pencatatan rutin ini terbiasa dipakai.

## Modul Akademik & Rapor — Mapel, TP & KKTP

Berbeda dari Tahsin-Tahfizh, penilaian akademik memang cocok memakai
kerangka Tujuan Pembelajaran (TP) berskor — karena mapel akademik
(Matematika, IPAS, dst.) memang tersusun dari TP-TP diskrit per fase,
bukan kompetensi kumulatif seperti hafalan.

Konsep ini dipelajari dari repo aplikasi lama (`penilaian-main`,
lihat `ANTIREGRESI.md` & `assets/js/sheets.js`), lalu **dikoreksi**
sesuai arahan pemilik sistem — di aplikasi lama, nilai SAS ternyata
diinput berulang per TP, padahal seharusnya sekali per semester per
mapel. Versi di sini memakai rumus yang sudah dikoreksi:

- Tiap **mapel** (koleksi `mapel/{nama}`) punya bobot SLM/SAS sendiri
  (default 60/40). ID dokumen sengaja berupa nama mapel persis (mis.
  `"Matematika"`), supaya cocok langsung dengan
  `users/{uid}.penugasan[].mapel` tanpa tabel terjemahan.
- Tiap mapel punya beberapa **Tujuan Pembelajaran / TP** (koleksi
  `tp_kktp/{id}`), didefinisikan per **tingkatan** (angka kelas, mis.
  `"4"`) — bukan per kelas paralel, karena 4A & 4B memakai kurikulum
  yang sama dan boleh diedit bersama oleh guru yang mengampu salah
  satunya.
- Tiap TP bertipe `pengetahuan` (level: Perlu Bimbingan → Cukup →
  Baik → Sangat Baik) atau `kinerja` (level: Mulai Berkembang → Layak
  → Cakap → Mahir), dengan 4 level KKTP (rentang nilai + kalimat
  deskripsi) yang ditulis sendiri oleh guru mapel per TP lewat
  `akademik/setup-tp.html`.
- **Nilai SLM** akan diisi per siswa per TP (menentukan level KKTP TP
  itu). **Nilai SAS** akan diisi **sekali per siswa per mapel per
  semester** — halaman untuk keduanya belum dibangun, menyusul
  setelah Setup TP & KKTP.
- **Nilai akhir mapel di rapor** = (rata-rata SLM semua TP × bobotSLM%)
  + (SAS × bobotSAS%). Deskripsi capaian di rapor = gabungan deskripsi
  TP dengan SLM tertinggi + TP dengan SLM terendah. Rumus ini sudah
  ada di `assets/firestore-data-akademik.js`
  (`hitungNilaiAkhirMapel`, `tentukanLevel`), dipakai nanti oleh
  halaman Input Nilai Mapel.

### Penugasan Guru

Guru Akademik hanya boleh mengakses kelas & mapel yang diampunya —
beda dari Tahsin-Tahfizh yang aksesnya per-kelas datar (`kelasAmpu`).
Ini disimpan sebagai field `penugasan` pada dokumen `users/{uid}`:

```json
{
  "nama": "Bapak Rudi Hartono",
  "role": "guru_akademik",
  "penugasan": [
    { "kelas": "4A", "mapel": "Matematika" },
    { "kelas": "4B", "mapel": "Matematika" },
    { "kelas": "4A", "mapel": "IPAS" }
  ]
}
```

Diisi manual lewat Firebase Console per akun guru, sama seperti
`nama`/`kelasAmpu` milik Tahsin-Tahfizh. Role **wajib** persis
`"guru_akademik"` (bukan `"guru"` generik) — lihat komentar di
`firestore.rules` untuk alasannya (supaya tidak ada silang akses tak
sengaja antar modul).

Aturan akses `tp_kktp` di `firestore.rules` untuk saat ini baru
dibatasi per role (harus `guru_akademik`/`admin`), belum per
mapel+tingkatan spesifik — alasannya didokumentasikan langsung di
komentar `firestore.rules`. **Wajib diperketat** sebelum koleksi
nilai siswa sungguhan dibangun.

## Kontribusi & Alur Kerja

Repo ini dikembangkan bersama pendampingan AI (Claude). Setiap fitur baru
disusun bertahap: satu halaman ditinjau dulu sebelum lanjut ke halaman
berikutnya, supaya arah desain & logika data bisa dikoreksi sedini
mungkin.
