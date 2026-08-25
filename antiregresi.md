# Catatan Anti-Regresi — Sistem Penilaian v2
**SD Muhammadiyah 01 Kukusan**

Dokumen hidup berisi aturan wajib & jebakan yang **sudah benar-benar pernah terjadi** atau berpotensi besar terjadi lagi. Ditulis untuk siapa pun (manusia atau AI) yang mengerjakan repo ini, lintas semua modul.

**Wajib dibaca sebelum**: mengubah `firestore.rules`, mengubah skema koleksi Firestore mana pun, mengubah file bersama (lihat §2), atau menambah field baru ke koleksi yang sudah dipakai banyak halaman.

---

## Cara memakai & menambah entri

- Setiap aturan diberi nomor (`§bagian.nomor`) supaya bisa dirujuk dari `changelog.md` atau dari commit message.
- Tag modul di judul tiap bagian: `[Tahsin-Tahfizh]`, `[Akademik]`, atau `[Semua Modul]`.
- Kalau menemukan jebakan baru (baik lewat insiden nyata maupun ketahuan sebelum kejadian), **tambahkan sebagai aturan baru di bagian yang relevan**, sertakan kejadian nyatanya kalau ada (bukan cuma teori) — itu yang membuat aturan ini dipercaya dan diikuti.
- Bagian Akademik (§8) sengaja dikosongkan sebagian besar — **diisi oleh sesi yang mengerjakan modul itu sendiri**, karena penulis dokumen ini (sesi Tahsin-Tahfizh) tidak punya visibilitas penuh ke keputusan arsitektur Akademik.

---

## 1. `[Semua Modul]` Firestore Rules & Query — pola `get()` cross-document

**1.1.** Kalau security rule butuh baca dokumen lain lewat `get()` (misalnya cek `kelasAmpu` dari `users/{uid}` untuk memvalidasi akses), DAN query dari klien **tidak** menyertakan `where()` yang cocok dengan field yang dicek rule tersebut, Firestore akan **menolak SELURUH query** dengan `Missing or insufficient permissions` — bukan menyaring hasil per dokumen secara diam-diam.

> **Kejadian nyata**: ini yang mendasari kenapa `getSiswaList()`, `getRiwayatSetoran()`, `getMenulisLog()` di `assets/firestore-data.js` (Tahsin-Tahfizh) semuanya WAJIB dikasih parameter `kelas`/`scope` eksplisit, bukan cuma `siswaId`. Konsekuensinya: kalau menambah query baru ke koleksi mana pun yang rule-nya pakai `get()`, pastikan klien selalu kasih `where()` yang sama sebelum dianggap selesai.

**1.2.** `allow get:` dan `allow list:` bisa dipisah dari `allow read:` gabungan. Berguna kalau butuh kondisi berbeda untuk baca-satu-dokumen vs baca-daftar (contoh: koleksi `users` — admin boleh `list` semua permintaan akun orang tua lewat kondisi konstan `allow list: if isAdmin();`, tanpa kena masalah §1.1 karena kondisinya tidak bergantung `resource.data`).

**1.3.** Kalau menambah collection/query Firestore baru untuk fitur apa pun, **selalu cek dulu**: apakah rule-nya butuh `get()` cross-document? Kalau iya, pastikan query klien sudah dibatasi field yang sama.

---

## 2. `[Semua Modul]` File Bersama — Protokol Wajib

**File yang dimaksud** (dipakai lintas modul, rawan tertimpa kalau dua sesi kerja paralel menyentuhnya dari basis yang berbeda):
- `firestore.rules` (root)
- `assets/firebase.js`
- `assets/style.css`
- `assets/firestore-data.js` *(catatan: Akademik sudah punya `assets/firestore-data-akademik.js` sendiri — pemisahan ini mengurangi risiko tabrakan, pertahankan pola ini, jangan digabung lagi)*
- `index.html`

**2.1. Aturan wajib**: SEBELUM mengubah file di atas, selalu minta versi terbaru dari pemilik proyek — jangan asumsikan versi yang sedang dipegang masih akurat, walau baru saja diberikan di sesi/percakapan yang sama.

**2.2. Kejadian nyata (2026-08-25)**: sesi pengembangan Akademik menimpa `firestore.rules` dan `assets/firestore-data.js` dengan versi lama — kemungkinan bekerja dari basis sebelum sejumlah perubahan Tahsin-Tahfizh ditambahkan, lalu menambahkan perubahan mereka sendiri di atas basis lama itu dan hasilnya menimpa balik ke repo. Dampak nyata:
- Rule `allow update` untuk `setoran`/`menulis_log` hilang → fitur Edit di `riwayat-siswa.html` gagal total.
- Fungsi `updateSetoran()`/`updateMenulisLog()` hilang dari `firestore-data.js` → karena `riwayat-siswa.html` melakukan **static import** kedua fungsi ini, dampaknya bukan cuma fitur Edit mati, tapi **seluruh halaman Riwayat Siswa gagal dimuat** (module import error).

**2.3. Cara verifikasi yang terbukti efektif**: minta **zip seluruh repo**, lalu diff sistematis (file baru / file hilang / file berubah), bukan minta file bersama satu-satu secara reaktif. Diff satu-satu pernah gagal menemukan 2 file Tahsin-Tahfizh lain yang ternyata berubah (`kelola-akun-ortu.html`, `target-hafalan.html` — walau di kasus itu perubahannya ternyata disengaja oleh pemilik proyek, bukan insiden, tapi tanpa full-repo diff itu tidak akan pernah ketahuan).

```
# Pola verifikasi:
comm -13 snapshot_files.txt repo_files.txt   # file baru
comm -23 snapshot_files.txt repo_files.txt   # file hilang — WASPADA kalau ada
comm -12 snapshot_files.txt repo_files.txt lalu diff satu-satu   # file yang isinya berubah
```

**2.4.** Kalau mengubah `assets/style.css`: SELALU cek dulu apakah class/selector baru yang ditambahkan bentrok dengan yang dipakai modul lain (`grep -rn "nama-class" .` di seluruh repo, bukan cuma folder modul sendiri). Gunakan prefix yang cukup spesifik untuk fitur baru (contoh: `.rubrik-*` untuk rubrik penilaian menulis) supaya kecil kemungkinan tabrakan nama generik.

---

## 3. `[Tahsin-Tahfizh]` Penentuan Jenjang Siswa — Jangan Hardcode Kelas

**3.1.** JANGAN PERNAH menentukan materi/fitur berdasarkan nomor kelas mentah (misalnya "kelas 3 ke atas pakai X"). Selalu pakai kombinasi field `siswa.jenjang === 'iqro' && !siswa.tamatIqro` untuk cek apakah siswa masih jenjang Iqro, karena siswa bisa tamat Iqro di kelas berapa pun (tidak selalu tepat naik kelas 3), dan sebaliknya siswa kelas atas yang belum tamat Iqro tetap harus dapat materi Iqro.

**3.2.** Pola ini konsisten dipakai di `input-setoran.html` (materi Membaca/Menghapal) dan `catat-menulis.html` (materi Menulis, surah picker vs jilid+halaman). Fitur baru apa pun yang perlu tahu "siswa ini level berapa" harus ikut pola yang sama, bukan menciptakan logika baru.

---

## 4. `[Tahsin-Tahfizh]` Kompatibilitas Mundur Skema Data

**4.1.** Koleksi `menulis_log` punya 2 generasi skema yang HARUS tetap didukung bersamaan (tidak ada migrasi data, entri lama dibiarkan apa adanya):
- **Lama (flat)**: `jilidIqro`, `halamanMulai`, `halamanAkhir` di level atas dokumen.
- **Baru (nested)**: `materi` (object dengan `tipe: 'iqro' | 'quran'`) dan `penilaian` (object, hanya untuk `tipe === 'quran'`).

**4.2. Aturan wajib**: setiap halaman yang MEMBACA `menulis_log` (saat ini: `riwayat-siswa.html`, `riwayat-anak.html`, `cetak-laporan.html`, dan `catat-menulis.html` sendiri untuk riwayat ringkas) HARUS punya fallback: kalau `r.materi` tidak ada, jatuh balik ke field flat lama. Pola helper yang dipakai (duplikasi disengaja per halaman, karena tidak ada shared JS antar file HTML selain modul `assets/*.js`):

```js
function menulisPosisiLabel(r) {
  if (!r) return '-';
  if (r.materi?.tipe === 'quran') return r.materi.label;
  if (r.materi?.tipe === 'iqro') return `Iqro ${r.materi.jilidIqro} — Hal. ...`;
  return `${r.jilidIqro ? `Iqro ${r.jilidIqro} — ` : ''}Halaman ${r.halamanMulai}...`; // fallback lama
}
```

**4.3.** Pola ini berlaku umum: **kalau menambah field baru ke koleksi yang sudah dipakai/punya data produksi**, jangan mengganti/menghapus field lama kecuali sudah ada rencana migrasi data eksplisit yang disepakati. Tambah field baru secara aditif, dan pastikan semua pembaca data lama tetap bisa menampilkan entri tanpa field baru itu tanpa error atau tampilan rusak (`undefined`, dsb).

**4.4. Kejadian nyata yang hampir terlewat**: saat menambah field `materi`/`penilaian` ke `menulis_log`, awalnya hanya `catat-menulis.html` (form input) dan `riwayat-siswa.html` (riwayat guru) yang terpikir untuk diubah. Baru setelah `grep -rn "halamanAkhir\|jilidIqro" --include="*.html"` dijalankan ke seluruh repo, ketahuan `riwayat-anak.html` (portal orang tua) dan `cetak-laporan.html` (laporan cetak) **juga** membaca field-field itu secara langsung dan akan tampil rusak untuk mayoritas siswa (kelas 3-6, jenjang Al-Qur'an) kalau tidak ikut diubah.

**4.5. Aturan wajib turunan**: sebelum menganggap perubahan skema/field pada koleksi Firestore manapun selesai, jalankan pencarian menyeluruh (`grep -rn` nama field/koleksi ke seluruh repo, bukan cuma folder modul sendiri) untuk memastikan semua konsumen data itu sudah tertangani.

---

## 5. `[Tahsin-Tahfizh]` Fitur Edit — Batasan Kepemilikan & Field

**5.1.** Entri `setoran` dan `menulis_log` hanya boleh diedit/dihapus oleh pembuatnya sendiri (`createdBy == request.auth.uid`), dijaga di `firestore.rules`, bukan cuma disembunyikan di UI. Field `siswaId`, `kelas`, `createdBy` dikunci di rule `allow update` (tidak boleh berubah lewat operasi update) supaya kepemilikan/atribusi tidak bisa dipindah diam-diam.

**5.2.** Untuk `setoran` khususnya: field materi/Baca & Tandai (`materi`, `detailAyat`, `detailBacaanIqro`) **sengaja tidak dibuka untuk diedit** — hanya `jenis`, `statusHafalan`, `catatan`. Kalau materi yang salah input, alurnya hapus & input ulang, bukan edit, supaya histori bacaan (dasar perhitungan progres surah) tetap konsisten. Jangan buka field materi untuk edit di masa depan tanpa mendiskusikan dampaknya ke logika progres terlebih dahulu.

---

## 6. `[Semua Modul]` Sanity Check Sebelum Mengirim File Hasil Edit

**6.1.** Untuk file HTML/JS yang diedit signifikan (bukan perubahan satu-dua baris), selalu jalankan pengecekan sederhana sebelum dianggap selesai:
- Keseimbangan `{`/`}` dan `(`/`)` (mis. `content.count('{') - content.count('}')` harus 0).
- Untuk file dengan `<script type="module">`, ekstrak isi script dan jalankan `node --check` untuk memastikan sintaks JS valid.
- Untuk perubahan CSS di file bersama, jalankan diff terhadap versi sebelumnya dan pastikan hanya baris yang dimaksud yang berubah (murni aditif kalau memang niatnya begitu).

---

## 7. `[Semua Modul]` Prinsip Umum Arsitektur — Jangan Dilanggar Tanpa Diskusi

**7.1.** Tidak ada framework, tidak ada build step. Semua halaman HTML statis + `<script type="module">` inline, import modul ES langsung dari `assets/*.js` dan CDN (`gstatic.com/firebasejs`). Kalau ada dorongan menambah bundler/framework, itu perubahan arsitektur besar — diskusikan dulu dengan pemilik proyek, jangan langsung dikerjakan.

**7.2.** `DEMO_MODE` di `assets/firebase.js` (aktif otomatis kalau `firebaseConfig.apiKey` masih placeholder) harus tetap dipertahankan di semua fungsi data layer (`firestore-data.js`, `firestore-data-akademik.js`), walau config asli sudah terpasang dan DEMO_MODE tidak aktif di produksi — ini penting untuk development/preview tanpa koneksi backend.

**7.3.** Pola kerja dengan pemilik proyek: **tidak ada akses push langsung ke repo** dari sesi AI mana pun. Alurnya selalu: kirim file yang berubah (dengan path repo-relative persis, dizip kalau lebih dari satu file) → pemilik proyek menimpa manual ke repo lokal → commit & push dilakukan pemilik proyek sendiri. Konsekuensi: **jangan pernah asumsikan perubahan sudah "live"** hanya karena sudah dikirim — selalu anggap perlu konfirmasi eksplisit bahwa file sudah dideploy sebelum membangun fitur lanjutan di atasnya.

---

## 8. `[Akademik]` — Bagian ini diisi oleh sesi yang mengerjakan modul Akademik

*(Catatan informasional dari sesi Tahsin-Tahfizh, bukan aturan otoritatif — sesi Akademik sebaiknya melengkapi/mengoreksi bagian ini sendiri.)*

- Data layer sudah dipisah ke `assets/firestore-data-akademik.js` — pertahankan pemisahan ini, jangan digabung kembali ke `firestore-data.js` milik Tahsin-Tahfizh.
- Koleksi yang teramati sejauh ini: `mapel`, `tp_kktp`, `nilai_tp` (gabungan `nilai_slm`+`nilai_sas` versi lama), `proyek_stem`, `absensi_rapor`, `dpl`, `kokurikuler`, `config/akademik`. Daftar ini kemungkinan besar sudah berubah lagi — jangan dianggap final tanpa verifikasi ulang.
- Role `guru_mapel` sengaja dipisah dari `guru_tahsin_tahfizh` supaya tidak otomatis dapat akses data Tahsin-Tahfizh.
