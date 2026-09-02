# HANDOFF — Sistem Penilaian v2
**SD Muhammadiyah 01 Kukusan**

Catatan kontinuitas sesi singkat: status terkini, apa yang sedang dikerjakan, dan langkah lanjutan yang sudah disepakati. Untuk detail teknis lengkap, lihat `changelog.md` (kronologis) dan `antiregresi.md` (aturan & jebakan). Dokumen ini **belum pernah ada sebelumnya di repo** — dibuat pertama kali di akhir sesi 2026-09-02.

---

## Status per 2026-09-02

**Belum dikirim/dideploy.** Seluruh pekerjaan sesi ini (lihat `changelog.md` entri 2026-09-02) baru diserahkan sebagai arsip file ke pemilik proyek — belum ditimpa ke repo lokal, belum di-commit, belum di-push. Jangan asumsikan perubahan ini sudah "live" sampai dikonfirmasi eksplisit.

**Yang baru selesai:** dekomposisi total fitur Nilai (SLM/STS/SAS terpisah, masing-masing punya alur sendiri) dan restrukturisasi navigasi Akademik & Rapor dari 1 halaman beranda yang berat jadi hierarki hub kartu-terpisah (`beranda.html` → `nilai-hub.html`/`wali-hub.html`/`admin-hub.html` → halaman aksi masing-masing). Peta lengkap ada di `antiregresi.md` §8.3.

**Modul Tahsin-Tahfizh** tidak tersentuh sesi ini — statusnya tetap seperti entri changelog 2026-08-25 (substansial selesai, fitur Menulis dengan rubrik skor belum dikonfirmasi dites end-to-end untuk jenjang Al-Qur'an).

---

## Langkah lanjutan yang sudah disepakati (belum dikerjakan)

Urutan sesuai kesepakatan terakhir dengan pemilik proyek:

1. **STS "rapor bayangan"** — laporan terpisah berbasis `nilai_sts` + `asesmen_cakupan` (jenis `sts`). Fondasi datanya sudah ada, laporannya sendiri belum dirancang sama sekali (bentuk, tata letak, apa yang ditampilkan selain nilai — belum dibahas).
2. **7KAIH** (7 Kebiasaan Anak Indonesia Hebat) — fitur baru total, penilaian DPL lewat kebiasaan harian. Baru kartu placeholder "Segera" di `kokurikuler-hub.html`. Pemilik proyek menyatakan akan menjelaskan detail penilaiannya di sesi mendatang — **jangan mulai merancang skema data sebelum itu**.
3. **Ekstrakurikuler** — fitur baru total, kegiatan di luar jam pelajaran (pramuka, olahraga, dst). Baru kartu placeholder "Segera" di `wali-hub.html`. Belum ada detail sama sekali (jenis kegiatan, siapa yang menilai, bagaimana skemanya) — perlu digali dari pemilik proyek sebelum mulai.
4. **Presensi Harian** — fitur baru, rencana awal "nanti otomatis menjumlah ke Absensi & Keputusan". Baru kartu placeholder "Segera" di `wali-hub.html`. Belum dibahas detail teknisnya (siapa yang input, per jam pelajaran atau per hari, dsb.).

Item 2-4 semuanya masih level "kartu placeholder", tidak ada keputusan arsitektur yang mengikat — sesi berikutnya bebas mengusulkan pendekatan dari nol setelah requirement digali dari pemilik proyek.

---

## Kalau melanjutkan sesi ini (checklist orientasi cepat)

1. Baca `antiregresi.md` §8 dulu — peta navigasi lengkap, skema Firestore baru, dan formula nilai akhir ada di sana, supaya tidak menghitung ulang atau menebak dari nol.
2. Minta **zip seluruh repo terbaru** ke pemilik proyek sebelum mengubah file bersama (`firestore.rules`, `assets/firebase.js`, `assets/style.css`, `assets/firestore-data.js`) — lihat `antiregresi.md` §2, ada kejadian nyata file bersama pernah tertimpa versi lama.
3. Kalau menyalin halaman existing sebagai basis halaman baru (pola `sed`/copy-paste yang dipakai membangun STS→SAS dan STS→Kokurikuler sesi ini): baca `antiregresi.md` §8.8 — ada 2 bug nyata yang sempat lolos dari sed sebelum ketahuan lewat audit grep manual.
4. Update `changelog.md` (entri baru di atas) dan `antiregresi.md` (§8, tambah aturan/nomor baru kalau ada jebakan baru ditemukan) di akhir sesi, sebelum menyerahkan file ke pemilik proyek — bukan sesudahnya.
