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

## 8. `[Akademik]` Dekomposisi Nilai (SLM/STS/SAS) & Navigasi Hub

*(Diisi oleh sesi yang mengerjakan restrukturisasi ini — 2026-09-04. Menggantikan catatan informasional sesi Tahsin-Tahfizh sebelumnya, termasuk koreksi nama role.)*

**8.1. Koreksi nama role & pemisahan data layer.** Role guru mata pelajaran di kode adalah **`guru_akademik`**, BUKAN `guru_mapel` seperti tercatat sebelumnya di bagian ini. Cek `firestore.rules` dan `generator-akun.html` kalau ragu — jangan asumsikan dari nama variabel/field lain yang mirip. Data layer Akademik tetap di `assets/firestore-data-akademik.js`, terpisah dari `firestore-data.js` milik Tahsin-Tahfizh — pertahankan pemisahan ini (lihat §2 di atas), jangan digabung kembali.

**8.2. Daftar file `akademik/` per fitur** (supaya sesi berikutnya tidak perlu `ls` manual untuk tahu file mana milik fitur mana):
- **Nilai SLM**: `nilai-slm-hub.html` (pemilih mapel+kelas), `nilai-slm.html` (input)
- **Nilai STS**: `nilai-sts-hub.html` (2 kartu) → `nilai-sts-cakupan-hub.html` + `nilai-sts-cakupan.html` (pilih TP) / `nilai-sts-nilai-hub.html` + `nilai-sts.html` (input)
- **Nilai SAS**: pola identik STS — `nilai-sas-hub.html`, `nilai-sas-cakupan-hub.html`, `nilai-sas-cakupan.html`, `nilai-sas-nilai-hub.html`, `nilai-sas.html`
- **Setup TP**: `setup-tp-hub.html` (pemilih mapel+**tingkatan**, di-dedupe dari penugasan — lihat §8.7) → `setup-tp.html` (sudah ada sebelumnya, cuma ditambah field bobot)
- **Wali Kelas**: `wali-hub.html` (5 kartu) → `absensi-hub.html`→`absensi.html`, `kelola-dpl-hub.html`→`kelola-dpl.html`, `kokurikuler-hub.html` (2 kartu: Proyek STEM & 7KAIH-segera) → `proyek-stem-hub.html`→`proyek-stem.html`
- **Administrasi**: `admin-hub.html` (grid mapel×tingkatan + link `seed-mapel.html`/`generator-akun.html`)
- **Landing**: `beranda.html` (3 kartu ke 3 hub di atas)
- **Redirect stub** (bookmark lama): `nilai-mapel.html` → `nilai-slm-hub.html`

**8.3. Peta navigasi lengkap & alasan setiap keputusan.**
```
login.html → beranda.html
├─ nilai-hub.html   (tampil kalau session.penugasan ada isinya)
│   ├─ setup-tp-hub.html  → setup-tp.html?mapel=&tingkatan=
│   ├─ nilai-slm-hub.html → nilai-slm.html?mapel=&kelas=
│   ├─ nilai-sts-hub.html → nilai-sts-cakupan-hub.html → nilai-sts-cakupan.html?mapel=&kelas=
│   │                     → nilai-sts-nilai-hub.html   → nilai-sts.html?mapel=&kelas=
│   └─ nilai-sas-hub.html → (pola identik nilai-sts-hub.html)
├─ wali-hub.html     (tampil kalau session.waliKelas ada isinya)
│   ├─ absensi-hub.html    → absensi.html?kelas=
│   ├─ kelola-dpl-hub.html → kelola-dpl.html?kelas=
│   └─ kokurikuler-hub.html
│       ├─ proyek-stem-hub.html → proyek-stem.html?kelas=
│       └─ (7KAIH — kartu "Segera", belum ada halaman)
└─ admin-hub.html    (khusus role==='admin')
```
- **Kenapa selalu ada lapisan hub-pemilih**, bahkan untuk guru yang cuma punya 1 penugasan/kelas: konsistensi pola lebih penting daripada menghemat satu klik untuk kasus umum — dan tetap benar kalau suatu saat guru punya banyak penugasan/kelas.
- **Kenapa bukan "baris status per kartu penugasan"** (pola lama `beranda.html`): pemilik sistem eksplisit minta kartu/kontainer terpisah per fitur, bukan baris di dalam satu kartu — lihat histori percakapan kalau ingin tahu alasan detailnya.
- **Setiap halaman aksi** (`nilai-slm.html`, `nilai-sts.html`, dst.) sekarang **kembali ke hub pemilihnya**, bukan langsung ke `beranda.html` — kecuali diakses admin, yang kembali ke `beranda.html`/`admin-hub.html` (lihat §8.6).

**8.4. Skema Firestore baru (per 2026-09-04).**
- `tp_kktp` — field baru `bobotMapel` (number, default 1 kalau kosong = bobot rata). Dipakai `hitungNilaiAkhirMapel()`. **BUKAN persen, bukan wajib total 100** — angka bebas dibandingkan relatif antar TP dalam mapel yang sama.
- `nilai_tp` — sekarang **khusus SLM**. Field `sas` lama di dokumen existing dibiarkan menggantung (TIDAK dihapus, TIDAK dibaca lagi) — kompatibilitas mundur murni pasif, tidak perlu migrasi karena belum ada data SAS produksi saat perubahan ini dibuat (dikonfirmasi ke pemilik sistem).
- `asesmen_cakupan/{id}` *(baru)* — 1 dokumen per (mapel, kelas, semester, tahunAjaran, **jenis**: `'sts'|'sas'`), berisi `tpIds: string[]`. Cakupan STS dan SAS untuk mapel+kelas yang SAMA sengaja terpisah total, tidak ada logika "copy dari STS ke SAS" atau sebaliknya.
- `nilai_sts/{id}` & `nilai_sas/{id}` *(baru)* — nilai murni per (tpId, siswaId, mapel, kelas, semester, tahunAjaran), field `nilai`. Fungsi baca/tulisnya di `firestore-data-akademik.js` **generik lewat parameter `jenis`** (nama koleksi ditentukan lookup `KOLEKSI_NILAI_ASESMEN[jenis]`) — kalau menambah jenis asesmen baru serupa di masa depan, ikuti pola generik ini, jangan duplikasi fungsi.
- `firestore.rules` — ketiga koleksi baru di atas pakai rule persis pola `nilai_tp` (`bolehMapelKelas()`), sudah ditambahkan.

**8.5. Formula nilai akhir (rapor resmi).**
```
efektifSLM(tp, siswa) = STS > SLM pada TP itu?  → pakai STS
                                                 → pakai SLM asli
nilaiAkhirTP  = SAS kosong pada TP itu?  → efektifSLM saja
                                          → efektifSLM × bobotSlm% + SAS × bobotSas%
nilaiAkhirMapel = rata-rata TERTIMBANG nilaiAkhirTP semua TP, bobot = tp.bobotMapel (default 1)
```
STS yang TIDAK lebih tinggi dari SLM tidak berpengaruh sama sekali ke nilai akhir — hanya tersimpan untuk rapor bayangan STS (belum dibangun). Implementasi ada di `hitungNilaiAkhirTP(nilaiSlm, nilaiSas, tp, nilaiSts)` dan `hitungNilaiAkhirMapel(entriesPerTP)` di `firestore-data-akademik.js` — **jangan hitung ulang formula ini secara manual di halaman baru manapun**, selalu impor & pakai kedua fungsi ini supaya rumus rapor tidak pernah punya 2 sumber kebenaran yang bisa berbeda hasil.

**8.6. Pola back-button kondisional per role.** Halaman yang bisa diakses admin *dan* guru/wali lewat jalur berbeda (`setup-tp.html`, `absensi.html`, `kelola-dpl.html`, `proyek-stem.html`) simpan `session` sebagai variabel scope-modul (`let session = null;` di luar `onAuthChange`, diisi `session = s;` di dalamnya), lalu tombol kembali baca variabel itu:
```js
$('btnBack').addEventListener('click', () => {
  window.location.href = session?.role === 'admin' ? 'admin-hub.html' : 'setup-tp-hub.html';
});
```
Kalau menambah halaman baru yang diakses lebih dari satu jalur, ikuti pola ini — jangan hardcode satu tujuan kembali saja.

**8.7. Setup TP di-dedupe per (mapel, tingkatan), BUKAN per (mapel, kelas).** TP & KKTP berlaku per tingkatan (kelas paralel 4A/4B pakai TP yang sama), beda dari SLM/STS/SAS yang memang per kelas. `setup-tp-hub.html` men-dedupe `session.penugasan` (yang berbentuk `{mapel, kelas}`) jadi pasangan unik `{mapel, tingkatan}` sebelum ditampilkan sebagai kartu — kalau lupa dedupe ini, guru yang mengampu mapel sama di 2 kelas paralel akan lihat kartu Setup TP dobel untuk TP yang sebenarnya sama.

**8.8. Kejadian nyata — sisa teks salah tempel saat menyalin halaman via `sed`.** Membangun SAS dan Kokurikuler dengan menyalin struktur STS lewat `sed` (mengganti kata kunci "STS"→"SAS" dst.) dua kali menghasilkan bug nyata yang baru ketahuan lewat audit grep, bukan saat menulis:
- `nilai-sas-cakupan-hub.html`: 2 baris teks UI masih menyebut "STS" walau sudah jadi halaman SAS.
- `kokurikuler-hub.html` (disalin dari `nilai-sts-hub.html`, bukan sekadar sed kata "STS"→"Kokurikuler"): **guard akses ikut salah tersalin** — awalnya memeriksa `session.penugasan` (punya guru mapel) padahal Kokurikuler itu fitur wali kelas yang seharusnya memeriksa `session.waliKelas`. Kalau tidak ketahuan, wali kelas yang bukan guru mapel manapun akan selalu melihat halaman kosong "Belum ada penugasan", padahal harusnya bisa akses.
- **Aturan wajib turunan**: setelah menyalin halaman dengan `sed`/copy-paste sebagai basis halaman baru, WAJIB `grep -n` nama fitur asal (case-sensitive, termasuk singkatan) ke file hasil salinan, DAN baca ulang bagian guard akses (`session.role`, `session.penugasan` vs `session.waliKelas`) secara eksplisit — sed yang mengganti teks tampilan tidak menjamin logika kondisional ikut benar secara semantik.

**8.9. Prinsip beranda tipis.** `beranda.html` (dan landing hub lain di bawahnya seperti `nilai-hub.html`/`wali-hub.html`) TIDAK melakukan query Firestore per-item untuk menghitung status lengkap/belum — cukup hitung ringkasan dari `session` (`penugasan.length`, `waliKelas.length`, dsb.) yang sudah tersedia tanpa fetch tambahan. Query yang lebih detail (status "X/Y TP terisi", dsb.) baru dilakukan di hub selanjutnya yang lebih spesifik, saat kartu itu benar-benar dibuka. Kalau ada dorongan menambah status detail langsung di `beranda.html` lagi di masa depan, ingat ini yang menyebabkan versi lama lambat dimuat untuk guru dengan banyak penugasan.

**8.10. Rapor itu lintas-mapel per siswa — bukan skop guru-mapel.** `nilai-sts-hub.html` dkk skopnya per guru (cuma mapel yang diampu), tapi Rapor butuh SEMUA mapel sekaligus untuk satu siswa — yang punya pandangan itu cuma wali kelas. Karena itu **Rapor STS ditaruh di `wali-hub.html`, bukan di `nilai-sts-hub.html`**, walau secara nama fitur terasa lebih dekat ke STS. Kalau menambah "Rapor SAS" nanti, ikuti pola yang sama — masuk `wali-hub.html`, bukan `nilai-sas-hub.html`.

**8.11. Mekanisme cetak: pola v1 (jendela baru + `@page`), BUKAN pola `@media print` `cetak-laporan.html`.** Ada dua pola cetak berbeda di repo ini — jangan disamaratakan:
- **Pola lama** (`cetak-laporan.html` Tahsin-Tahfizh): toggle `display` lewat `@media print` DI HALAMAN YANG SAMA (`#reportOutput`/`.no-print` di `assets/style.css`). Tidak dapat running footer otomatis per halaman, tidak dapat nomor halaman, dan berbagi dokumen dengan CSS `phone-shell`/`app-header` yang berisiko ikut ke hasil cetak.
- **Pola baru** (`rapor-sts-cetak.html`, diadopsi dari `rapor/preview.html` aplikasi v1): tombol Cetak membangun HTML rapor sebagai string, buka `window.open('', '_blank', ...)`, `w.document.write(fullHTML)` — dokumen BARU yang sepenuhnya independen dari app shell, dengan `<style>` sendiri termasuk:
  ```css
  @page{
    size: A4; margin: 1.5cm;
    @bottom-left{ content: "Kelas X | Nama | NISN"; ... }
    @bottom-right{ content: "Halaman " counter(page) " dari " counter(pages); ... }
  }
  tr{page-break-inside:avoid}
  thead{display:table-header-group}
  .rpr-ttd-wrap{page-break-inside:avoid}
  ```
  Ini yang membuat tabel tidak terpotong sembarangan dan footer+nomor halaman muncul otomatis di SETIAP halaman fisik tanpa kita perlu tahu di muka jadi berapa halaman. **Pakai pola ini (bukan pola lama) untuk setiap halaman cetak/rapor baru** — termasuk nanti Rapor SAS dan rapor resmi akhir semester. Fungsi pembangun HTML isi rapor (`buildBodyPrint()`) sengaja dipakai dua kali (pratinjau di layar DAN sumber cetak sungguhan) supaya pratinjau tidak pernah beda dari hasil cetak asli.

**8.12. Skema NISN — field baru terpisah dari NIS, sengaja pakai `updateDoc` bukan `batch.set()`.** Koleksi `siswa` (dipakai bareng Tahsin-Tahfizh) sebelumnya cuma punya `nis` (nomor lokal sekolah). Rapor formal wajib mencantumkan **NISN** (Nomor Induk Siswa Nasional, 10 digit, berbeda dari NIS) — field baru `nisn`, diisi lewat `kelola-nisn.html` (`saveNisnBatch()` di `firestore-data-akademik.js`). **PENTING**: fungsi ini pakai `batch.update()` per siswa (cuma menyentuh field `nisn`), BUKAN `batch.set()` seperti `seed-siswa.html` — `seed-siswa.html` men-*overwrite* seluruh dokumen dari array hardcode-nya, jadi TIDAK BOLEH dipakai ulang untuk mengisi NISN (berisiko menimpa field lain yang sudah berubah sejak seed awal, termasuk field yang dipakai Tahsin-Tahfizh). NISN semua siswa existing (403 siswa) **masih kosong** per 2026-09-04 — tidak ada sumber data yang bisa dipakai mengisi otomatis, harus diisi manual oleh admin per kelas.

**8.13. Keterbatasan nama Wali Kelas di tanda tangan rapor.** Tidak ada struktur data "daftar nama wali kelas per kelas" yang terpisah dari akun login — nama yang tercetak di kolom tanda tangan "Wali Kelas" pada `rapor-sts-cetak.html` diambil dari `session.nama` (akun yang sedang login saat mencetak). Ini benar selama yang mencetak memang wali kelas ybs sendiri, tapi keliru kalau admin mencetak atas nama wali kelas lain — untuk kasus itu, nama perlu diedit manual di hasil cetak sebelum ditandatangani. Kalau nanti dibutuhkan pencetakan massal lintas-akun (misal admin mencetak rapor semua kelas sekaligus), pertimbangkan menambah field `namaWali`/`nbmWali` ke struktur data kelas (belum ada tempatnya sekarang) alih-alih terus mengandalkan `session.nama`.

**8.14. Pola impor file Excel: SheetJS via `import()` dinamis, validasi NISN defensif thd leading-zero.** `import-nisn.html` adalah halaman PERTAMA di repo yang membaca file Excel dari sisi klien (bukan cuma menulis, seperti `seed-mapel.html`/`seed-siswa.html` yang isinya hardcode array). Dua hal penting kalau membuat halaman serupa di masa depan (mis. impor data lain dari Dapodik):
- **Library**: SheetJS dimuat lewat `import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')` di dalam handler event (bukan `<script src>` global di `<head>`) — konsisten dengan pola `firebase.js` yang juga pakai `import()` dinamis dari CDN gstatic, bukan tag script biasa. Jangan tambah `<script>` tag CDN kalau bisa pakai `import()` dinamis, supaya tidak menambah beban muat halaman lain yang tidak butuh library itu.
- **Parsing sel**: `sheet_to_json(sheet, {header:1, raw:false, defval:''})` — `raw:false` WAJIB dipakai untuk kolom berisi ID panjang (NISN/NIK/NIS) supaya SheetJS mengambil TEKS TERFORMAT apa adanya, bukan nilai numerik mentah yang berisiko dibulatkan/notasi-ilmiah kalau kolomnya kebetulan tersimpan sebagai angka di file sumber.
- **Validasi NISN 3-tingkat** (fungsi `validasiNisn()`): persis 10 digit → `ok`; kurang dari 10 digit tapi semua karakter angka → `dipad` (di-`padStart('0')` otomatis KARENA kemungkinan besar 0 di depan hilang, TAPI tetap ditandai visual kuning di UI, tidak didiamkan begitu saja); lebih dari 10 digit atau ada karakter non-digit → `invalid`, dikeluarkan dari proses simpan otomatis, wajib ditinjau manual. Prinsip ini ("auto-fix yang paling mungkin benar, TAPI selalu tampak & bisa dibatalkan admin sebelum commit ke database") berlaku umum untuk impor data massal apa pun di masa depan — jangan auto-fix secara diam-diam tanpa jejak visual.
- **Pencocokan baris file ke dokumen Firestore**: berdasarkan `nama` (dinormalisasi trim+uppercase+collapse-spasi) DAN `kelas` sekaligus (bukan nama saja — berisiko App kalau ada nama yang sama di kelas berbeda), diambil LIVE lewat `getSiswaByKelas()` per kelas yang benar-benar muncul di file (bukan query semua 15 kelas kalau file cuma sebagian). Baris yang tidak ketemu pasangannya WAJIB tampil sebagai "tidak ditemukan" dan default TIDAK tercentang — jangan pernah default-checked untuk baris yang pencocokannya tidak pasti.

