/**
 * firestore-data-akademik.js — Lapisan akses data untuk modul Akademik & Rapor
 * SD Muhammadiyah 01 Kukusan
 *
 * Sama seperti firestore-data.js milik Tahsin-Tahfizh: otomatis pakai data
 * tiruan selama DEMO_MODE aktif, otomatis pakai Firestore sungguhan begitu
 * firebase.js terisi config asli. Dipisah dari file Tahsin-Tahfizh karena
 * modul ini punya bentuk data & aturan akses sendiri.
 *
 * KONSEP INTI (dipelajari dari aplikasi lama, dikoreksi sesuai arahan
 * pemilik sistem — lihat catatan di setiap fungsi):
 *  - Tiap mapel punya beberapa Tujuan Pembelajaran (TP).
 *  - Tiap TP: tipe 'pengetahuan' atau 'kinerja', dan 4 level KKTP
 *    (rentang nilai + deskripsi capaian, ditulis sendiri oleh guru mapel).
 *  - TP didefinisikan per TINGKATAN (angka kelas, mis. "4"), BUKAN per
 *    kelas paralel spesifik (4A/4B) — karena kurikulumnya sama untuk
 *    semua kelas paralel di tingkatan yang sama.
 *  - Bobot SLM/SAS adalah milik MAPEL (bukan per TP) — SAS dihitung
 *    SEKALI per semester untuk mapel itu, bukan diulang tiap TP.
 */

import { DEMO_MODE } from './firebase.js';

/* ==========================================================================
   Label level KKTP — TETAP (tidak bisa diedit guru), hanya deskripsinya
   yang custom per TP.
   ========================================================================== */

export const LEVEL_LABEL = {
  pengetahuan: ['Perlu Bimbingan', 'Cukup', 'Baik', 'Sangat Baik'],
  kinerja:     ['Mulai Berkembang', 'Layak', 'Cakap', 'Mahir'],
};

/**
 * Skala predikat KHUSUS Kokurikuler/DPL — "Skala Predikat Tunggal Sekolah"
 * dari panduan penilaian proyek STEM. TETAP untuk semua DPL, tidak seperti
 * LEVEL_LABEL di atas yang beda-beda per tipe TP. Sengaja TIDAK dipakai
 * untuk TP non-STEM biasa — itu tetap pakai LEVEL_LABEL.pengetahuan/kinerja
 * seperti sebelumnya (dikonfirmasi eksplisit, bukan diseragamkan).
 */
export const DPL_LEVEL_LABEL = ['Belum Terlihat', 'Mulai Terlihat', 'Berkembang Sesuai Harapan', 'Sangat Berkembang'];

/** Rentang nilai bawaan saat TP baru dibuat — guru boleh ubah. */
export const LEVEL_RANGE_DEFAULT = [
  { min: 0,  maks: 60  },
  { min: 61, maks: 75  },
  { min: 76, maks: 85  },
  { min: 86, maks: 100 },
];

/** Fase Kurikulum Merdeka SD, diturunkan otomatis dari tingkatan. */
export function faseDariTingkatan(tingkatan) {
  const t = parseInt(tingkatan, 10);
  if (t <= 2) return 'A';
  if (t <= 4) return 'B';
  return 'C';
}

/** "4A" / "4" → "4" (angka tingkatan saja, tanpa huruf paralel). */
export function tingkatanDariKelas(kelas) {
  return String(kelas || '').replace(/[^0-9]/g, '');
}

/* ==========================================================================
   Mapel — data referensi (dikelola manual lewat Firebase Console untuk
   saat ini, sama seperti users/{uid}.penugasan). ID dokumen = nama mapel
   persis, supaya cocok langsung dengan users/{uid}.penugasan[].mapel
   tanpa perlu tabel terjemahan id↔nama.
   ========================================================================== */

const DEMO_MAPEL_SEED = [
  { id: 'Al-Islam',              nama: 'Al-Islam',              kelompok: 'ismuba', urutan: 1,  bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['1','2','3','4','5','6'] },
  { id: 'Pendidikan Pancasila',  nama: 'Pendidikan Pancasila',  kelompok: 'wajib',  urutan: 2,  bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['1','2','3','4','5','6'] },
  { id: 'Bahasa Indonesia',      nama: 'Bahasa Indonesia',      kelompok: 'wajib',  urutan: 3,  bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['1','2','3','4','5','6'] },
  { id: 'Matematika',            nama: 'Matematika',            kelompok: 'wajib',  urutan: 4,  bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['1','2','3','4','5','6'] },
  { id: 'IPAS',                  nama: 'IPAS',                  kelompok: 'wajib',  urutan: 5,  bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['3','4','5','6'] },
  { id: 'Seni Budaya',           nama: 'Seni Budaya',           kelompok: 'wajib',  urutan: 6,  bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['1','2','3','4','5','6'] },
  { id: 'PJOK',                  nama: 'PJOK',                  kelompok: 'wajib',  urutan: 7,  bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['1','2','3','4','5','6'] },
  { id: 'Bahasa Inggris',        nama: 'Bahasa Inggris',        kelompok: 'wajib',  urutan: 8,  bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['1','2','3','4','5','6'] },
  { id: 'Informatika',           nama: 'Informatika',           kelompok: 'wajib',  urutan: 9,  bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['4','5','6'] },
  { id: 'Bahasa Sunda',          nama: 'Bahasa Sunda',          kelompok: 'mulok',  urutan: 10, bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['1','2','3','4','5','6'] },
  { id: 'Bahasa Arab',           nama: 'Bahasa Arab',           kelompok: 'ismuba', urutan: 11, bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['3','4','5','6'] },
  { id: 'Kemuhammadiyahan',      nama: 'Kemuhammadiyahan',      kelompok: 'ismuba', urutan: 12, bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: ['3','4','5','6'] },
];
// Sumber: Master_Jadwal_Pelajaran_2026-2027_v6.xlsx (sheet "Data Mapel" +
// silang-cek 182 baris "Penugasan Guru 2026-2027", cocok persis). Tahsin
// & Tahfizh SENGAJA tidak dimasukkan — sudah dikelola modul Tahsin-Tahfizh
// sendiri, bukan lewat sistem mapel/TP ini.
const DEMO_MAPEL_KEY = 'akd_demo_mapel';

function readDemoMapel() {
  const raw = localStorage.getItem(DEMO_MAPEL_KEY);
  if (!raw) {
    localStorage.setItem(DEMO_MAPEL_KEY, JSON.stringify(DEMO_MAPEL_SEED));
    return DEMO_MAPEL_SEED;
  }
  return JSON.parse(raw);
}

/** Ambil semua mapel, terurut. */
export async function getMapelList() {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    return [...readDemoMapel()].sort((a, b) => a.urutan - b.urutan);
  }
  const { db, fsMod } = window.__fb;
  const snap = await fsMod.getDocs(fsMod.collection(db, 'mapel'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.urutan||0) - (b.urutan||0));
}

/** Ambil satu mapel berdasarkan nama (= id dokumen). */
export async function getMapelByNama(nama) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 120));
    return readDemoMapel().find(m => m.nama === nama) || { id: nama, nama, bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: [] };
  }
  const { db, fsMod } = window.__fb;
  const snap = await fsMod.getDoc(fsMod.doc(db, 'mapel', nama));
  return snap.exists() ? { id: snap.id, ...snap.data() } : { id: nama, nama, bobotSlm: 60, bobotSas: 40, tingkatanBerlaku: [] };
}

/**
 * Apakah mapel ini berlaku (diajarkan) di tingkatan tsb? Kalau field
 * tingkatanBerlaku belum diisi sama sekali di dokumennya (data lama,
 * sebelum fitur ini ada), dianggap berlaku semua tingkatan — supaya
 * data yang sudah kadung dibuat sebelum kolom ini ada tidak mendadak
 * hilang/terkunci.
 */
export function mapelBerlakuDiTingkatan(mapel, tingkatan) {
  if (!mapel || !Array.isArray(mapel.tingkatanBerlaku) || !mapel.tingkatanBerlaku.length) return true;
  return mapel.tingkatanBerlaku.includes(String(tingkatan));
}

/* ==========================================================================
   TP & KKTP
   ========================================================================== */

const DEMO_TP_KEY = 'akd_demo_tp_kktp';

function demoTpSeed() {
  return [
    {
      id: 'demo-tp-1', mapel: 'Matematika', tingkatan: '4', fase: 'B',
      nomorTp: 1, namaTp: 'Mengurutkan dan membandingkan pecahan sederhana',
      cp: 'Peserta didik dapat menunjukkan pemahaman tentang pecahan sederhana dan hubungan antar pecahan.',
      tipe: 'pengetahuan',
      levels: [
        { min: 0,  maks: 60,  deskripsi: 'belum mampu mengurutkan pecahan sederhana' },
        { min: 61, maks: 75,  deskripsi: 'mulai mampu mengurutkan pecahan sederhana dengan bimbingan' },
        { min: 76, maks: 85,  deskripsi: 'mampu mengurutkan dan membandingkan pecahan sederhana dengan cukup baik' },
        { min: 86, maks: 100, deskripsi: 'mampu mengurutkan dan membandingkan pecahan sederhana dengan sangat baik dan mandiri' },
      ],
    },
  ];
}

function readDemoTp() {
  const raw = localStorage.getItem(DEMO_TP_KEY);
  if (!raw) {
    const seed = demoTpSeed();
    localStorage.setItem(DEMO_TP_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}
function writeDemoTp(list) {
  localStorage.setItem(DEMO_TP_KEY, JSON.stringify(list));
}

/** Ambil daftar TP untuk satu mapel + tingkatan, terurut nomor TP. */
export async function getTPList({ mapel, tingkatan }) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 220));
    return readDemoTp()
      .filter(tp => tp.mapel === mapel && tp.tingkatan === String(tingkatan))
      .sort((a, b) => (a.nomorTp||0) - (b.nomorTp||0));
  }
  const { db, fsMod } = window.__fb;
  const q = fsMod.query(
    fsMod.collection(db, 'tp_kktp'),
    fsMod.where('mapel', '==', mapel),
    fsMod.where('tingkatan', '==', String(tingkatan))
  );
  const snap = await fsMod.getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.nomorTp||0) - (b.nomorTp||0));
}

/** Simpan TP (upsert). Jika payload.id ada → update, kalau tidak → buat baru. */
export async function saveTP(payload) {
  const data = {
    mapel:     payload.mapel,
    tingkatan: String(payload.tingkatan),
    fase:      faseDariTingkatan(payload.tingkatan),
    nomorTp:   payload.nomorTp,
    namaTp:    payload.namaTp,
    cp:        payload.cp || '',
    tipe:      payload.tipe === 'kinerja' ? 'kinerja' : 'pengetahuan',
    bobotSlm:  payload.bobotSlm ?? 60,
    bobotSas:  payload.bobotSas ?? 40,
    // Bobot TP ini TERHADAP NILAI AKHIR MAPEL (rapor) — beda dari bobotSlm/
    // bobotSas di atas (itu bobot SLM vs SAS DI DALAM satu TP). Angka bebas
    // (bukan wajib 0-100/total 100) — supaya tambah/hapus TP di tengah
    // semester tidak memaksa guru merapikan ulang bobot TP lain. TP tanpa
    // field ini (dibuat sebelum fitur ini ada) dianggap bobot 1 (rata
    // dengan TP lain) saat dihitung — lihat hitungNilaiAkhirMapel().
    bobotMapel: payload.bobotMapel ?? 1,
    levels:    payload.levels,
  };

  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 300));
    const list = readDemoTp();
    if (payload.id) {
      const idx = list.findIndex(tp => tp.id === payload.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...data };
    } else {
      list.push({ id: 'demo-tp-' + Date.now(), ...data });
    }
    writeDemoTp(list);
    return;
  }

  const { db, fsMod, auth } = window.__fb;
  if (payload.id) {
    await fsMod.updateDoc(fsMod.doc(db, 'tp_kktp', payload.id), {
      ...data,
      updatedAt: fsMod.serverTimestamp(),
      updatedBy: auth.currentUser?.uid || null,
    });
  } else {
    await fsMod.addDoc(fsMod.collection(db, 'tp_kktp'), {
      ...data,
      createdAt: fsMod.serverTimestamp(),
      createdBy: auth.currentUser?.uid || null,
    });
  }
}

/** Hapus satu TP. */
export async function deleteTP(id) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    writeDemoTp(readDemoTp().filter(tp => tp.id !== id));
    return;
  }
  const { db, fsMod } = window.__fb;
  await fsMod.deleteDoc(fsMod.doc(db, 'tp_kktp', id));
}

/* ==========================================================================
   Kalkulasi — dipakai halaman Input Nilai Mapel.
   MODEL YANG BENAR (dikoreksi ulang oleh pemilik sistem, menggantikan
   asumsi sebelumnya bahwa SAS itu sekali per mapel per semester):
   - SLM **dan** SAS dua-duanya diisi PER TP.
   - Tidak semua TP diujikan saat SAS — TP yang SAS-nya kosong itu wajar,
     bukan data yang belum lengkap.
   - Nilai akhir PER TP = SLM saja (kalau SAS kosong), atau
     (SLM×bobotSlm% + SAS×bobotSas%) kalau SAS ada — bobot ditentukan
     guru PER TP (tersimpan di tp_kktp.bobotSlm/bobotSas), bukan per mapel.
   - Level KKTP & deskripsi ditentukan dari nilai akhir PER TP itu
     (setelah dicampur SAS-nya kalau ada), bukan dari SLM mentah — supaya
     kalau ada TP yang sudah diujikan SAS-nya, levelnya mencerminkan hasil
     akhir TP itu, bukan cuma proses SLM-nya saja.
   - Nilai rapor (nilai akhir mapel) = rata-rata nilai akhir dari SEMUA TP.
   ========================================================================== */

/**
 * Nilai akhir satu TP = campuran efektifSLM+SAS sesuai bobot TP itu, atau
 * efektifSLM saja kalau SAS kosong.
 *
 * efektifSLM = SLM asli, KECUALI ada nilai STS untuk TP ini DAN nilai STS
 * itu lebih tinggi dari SLM — dalam hal itu STS dianggap MENGGANTIKAN SLM
 * (bukan dirata-rata/dicampur). Ini yang membuat STS "dianggap menggantikan
 * nilai SLM" seperti disepakati: STS sendiri TIDAK dipakai kalau lebih
 * rendah/sama dengan SLM, dan tidak pernah muncul terpisah di rapor resmi.
 *
 * @param {number|string|null} nilaiSlm
 * @param {number|string|null} nilaiSas
 * @param {object} tp - dokumen TP (butuh bobotSlm/bobotSas)
 * @param {number|string|null} [nilaiSts] - opsional, null/undefined kalau
 *   TP ini tidak termasuk cakupan STS atau STS belum diinput.
 */
export function hitungNilaiAkhirTP(nilaiSlm, nilaiSas, tp, nilaiSts = null) {
  if (nilaiSlm === '' || nilaiSlm === null || nilaiSlm === undefined) return null;
  const slm = parseFloat(nilaiSlm);
  const sts = (nilaiSts === '' || nilaiSts === null || nilaiSts === undefined) ? null : parseFloat(nilaiSts);
  const efektifSlm = (sts !== null && sts > slm) ? sts : slm;
  if (nilaiSas === '' || nilaiSas === null || nilaiSas === undefined) {
    return Math.round(efektifSlm);
  }
  const bobotSlm = (tp?.bobotSlm ?? 60) / 100;
  const bobotSas = (tp?.bobotSas ?? 40) / 100;
  return Math.round(efektifSlm * bobotSlm + parseFloat(nilaiSas) * bobotSas);
}

/** Tentukan level KKTP dari NILAI AKHIR TP (hasil hitungNilaiAkhirTP), mengikuti rentang TP tsb. */
export function tentukanLevel(nilaiAkhirTP, tp) {
  if (nilaiAkhirTP === '' || nilaiAkhirTP === null || nilaiAkhirTP === undefined) return null;
  const n = parseFloat(nilaiAkhirTP);
  const labels = LEVEL_LABEL[tp.tipe] || LEVEL_LABEL.pengetahuan;
  const levels = tp.levels || [];
  for (let i = 0; i < levels.length; i++) {
    if (n >= levels[i].min && n <= levels[i].maks) {
      return { index: i, label: labels[i], deskripsi: levels[i].deskripsi || '' };
    }
  }
  const last = levels.length - 1;
  return { index: last, label: labels[last], deskripsi: levels[last]?.deskripsi || '' };
}

/**
 * Nilai akhir mapel (nilai rapor) = RATA-RATA TERTIMBANG nilai akhir semua
 * TP, sesuai bobotMapel masing-masing TP (lihat saveTP). TP dengan
 * bobotMapel kosong/tidak diketahui dianggap bobot 1 (rata dengan TP lain)
 * — supaya TP lama (dibuat sebelum fitur bobot ini ada) tidak tiba-tiba
 * mengubah nilai akhir mapel begitu fitur ini dipasang.
 *
 * @param {Array<{nilai:number|string|null, bobot?:number}>} entriesPerTP
 *   Tiap entri = { nilai: hasil hitungNilaiAkhirTP() untuk satu TP,
 *   bobot: tp.bobotMapel milik TP itu }.
 */
export function hitungNilaiAkhirMapel(entriesPerTP) {
  const valid = (entriesPerTP || [])
    .map(e => ({ nilai: e?.nilai, bobot: (e?.bobot ?? 1) }))
    .filter(e => e.nilai !== null && e.nilai !== undefined && e.nilai !== '' && e.bobot > 0);
  if (!valid.length) return null;
  const totalBobot = valid.reduce((a, e) => a + e.bobot, 0);
  const totalNilai = valid.reduce((a, e) => a + parseFloat(e.nilai) * e.bobot, 0);
  return Math.round(totalNilai / totalBobot);
}

/* ==========================================================================
   Siswa — baca-saja dari sisi Akademik. Koleksi `siswa` dipakai bersama
   dengan Tahsin-Tahfizh, tapi fungsi baca ini sengaja berdiri sendiri di
   sini (bukan import dari firestore-data.js) supaya kedua modul tetap
   tidak saling bergantung secara kode, walau datanya sama-sama dibaca
   dari koleksi `siswa`.
   ========================================================================== */

const DEMO_SISWA = [
  { id: 'ak-s1', nama: 'Muhammad Idlal Al Matin',  nis: '24257018', kelas: '4A', aktif: true },
  { id: 'ak-s2', nama: 'Zahra Aulia Ramadhani',    nis: '24257022', kelas: '4A', aktif: true },
  { id: 'ak-s3', nama: 'Rizky Ananda Pratama',     nis: '24257027', kelas: '4A', aktif: true },
  { id: 'ak-s4', nama: 'Nadia Putri Salsabila',    nis: '24257031', kelas: '4B', aktif: true },
  { id: 'ak-s5', nama: 'Fahri Ramadhan Setiawan',  nis: '24257035', kelas: '4B', aktif: true },
];

/** Ambil siswa aktif satu kelas, terurut nama. */
export async function getSiswaByKelas(kelas) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    return DEMO_SISWA.filter(s => s.kelas === kelas).sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }
  const { db, fsMod } = window.__fb;
  const q = fsMod.query(
    fsMod.collection(db, 'siswa'),
    fsMod.where('kelas', '==', kelas),
    fsMod.where('aktif', '==', true)
  );
  const snap = await fsMod.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
}

/**
 * Simpan NISN satu kelas sekaligus. Sengaja pakai updateDoc per siswa
 * (bukan batch.set/overwrite penuh seperti seed-siswa.html) — HANYA
 * menyentuh field `nisn`, field lain di dokumen siswa (nama, nis, kelas,
 * jenjang, aktif, dst — termasuk yang dipakai modul Tahsin-Tahfizh) tidak
 * ikut tertimpa. Entries dengan nisn kosong dilewati (tidak menghapus
 * nisn yang sudah ada dengan string kosong secara tidak sengaja).
 * @param {Array<{siswaId:string, nisn:string}>} entries
 */
export async function saveNisnBatch(entries) {
  const valid = entries.filter(e => e.nisn && e.nisn.trim());
  if (!valid.length) return;

  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 300));
    valid.forEach(e => {
      const s = DEMO_SISWA.find(x => x.id === e.siswaId);
      if (s) s.nisn = e.nisn.trim();
    });
    return;
  }
  const { db, fsMod } = window.__fb;
  const batch = fsMod.writeBatch(db);
  valid.forEach(e => {
    batch.update(fsMod.doc(db, 'siswa', e.siswaId), { nisn: e.nisn.trim() });
  });
  await batch.commit();
}

/* ==========================================================================
   Config — semester & tahun ajaran aktif, satu dokumen untuk sekolah.
   ========================================================================== */

const DEMO_CONFIG_KEY = 'akd_demo_config';

/** @returns {Promise<{semesterAktif:string, tahunAjaran:string}>} */
export async function getConfigAkademik() {
  const fallback = { semesterAktif: '1', tahunAjaran: '2026/2027' };
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 120));
    const raw = localStorage.getItem(DEMO_CONFIG_KEY);
    return raw ? JSON.parse(raw) : fallback;
  }
  const { db, fsMod } = window.__fb;
  const snap = await fsMod.getDoc(fsMod.doc(db, 'config', 'akademik'));
  return snap.exists() ? { ...fallback, ...snap.data() } : fallback;
}

/**
 * Simpan profil sekolah (dipakai kop & tanda tangan rapor cetak) ke
 * config/akademik — dokumen SAMA dengan semesterAktif/tahunAjaran, cuma
 * field-nya berbeda (merge, bukan overwrite) supaya tidak menimpa
 * semesterAktif/tahunAjaran yang selama ini diisi manual lewat Firebase
 * Console. Field: namaSekolah, alamatSekolah, namaKepsek, nbmKepsek,
 * kotaRapor.
 */
export async function saveProfilSekolah(payload) {
  const data = {
    namaSekolah:   payload.namaSekolah   || '',
    alamatSekolah: payload.alamatSekolah || '',
    namaKepsek:    payload.namaKepsek    || '',
    nbmKepsek:     payload.nbmKepsek     || '',
    kotaRapor:     payload.kotaRapor     || '',
  };
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 250));
    const existing = JSON.parse(localStorage.getItem(DEMO_CONFIG_KEY) || '{}');
    localStorage.setItem(DEMO_CONFIG_KEY, JSON.stringify({ ...existing, ...data }));
    return;
  }
  const { db, fsMod } = window.__fb;
  await fsMod.setDoc(fsMod.doc(db, 'config', 'akademik'), data, { merge: true });
}

/* ==========================================================================
   Nilai TP — SATU dokumen per (siswa × TP × semester × tahun ajaran),
   berisi SLM dan SAS sekaligus. Digabung dari yang tadinya dua koleksi
   terpisah (nilai_slm, nilai_sas) — dikoreksi ulang oleh pemilik sistem:
   SAS itu per TP juga (tidak semua TP diujikan saat SAS, itu wajar), jadi
   keduanya wajar tersimpan bersebelahan di dokumen yang sama.
   ========================================================================== */

const DEMO_NILAI_TP_KEY = 'akd_demo_nilai_tp';

function readDemoNilaiTP() {
  return JSON.parse(localStorage.getItem(DEMO_NILAI_TP_KEY) || '[]');
}
function writeDemoNilaiTP(list) {
  localStorage.setItem(DEMO_NILAI_TP_KEY, JSON.stringify(list));
}

/**
 * Ambil semua nilai (SLM+SAS) untuk satu TP pada satu semester/tahun ajaran
 * (lintas siswa sekelas), dipakai untuk mengisi grid saat dibuka.
 *
 * PENTING: mapel & kelas WAJIB disertakan sebagai filter query di sini,
 * bukan cuma tpId — karena aturan Firestore untuk nilai_tp memeriksa
 * resource.data.mapel/resource.data.kelas (bolehMapelKelas). Firestore
 * menolak seluruh permintaan baca (bukan per dokumen) kalau bentuk query
 * tidak secara eksplisit menyertakan field yang sama dengan yang
 * diperiksa aturan keamanannya — walau secara logis tpId sudah cukup
 * unik menentukan mapel+kelas yang benar.
 * @returns {Promise<Object<string,{id:string, slm:number, sas:number|null}>>} siswaId -> {id, slm, sas}
 */
export async function getNilaiTPUntukTP({ tpId, mapel, kelas, semester, tahunAjaran }) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    const list = readDemoNilaiTP().filter(n => n.tpId === tpId && n.semester === semester && n.tahunAjaran === tahunAjaran);
    const map = {};
    list.forEach(n => { map[n.siswaId] = { id: n.id, slm: n.slm, sas: n.sas ?? null }; });
    return map;
  }
  const { db, fsMod } = window.__fb;
  const q = fsMod.query(
    fsMod.collection(db, 'nilai_tp'),
    fsMod.where('tpId', '==', tpId),
    fsMod.where('mapel', '==', mapel),
    fsMod.where('kelas', '==', kelas),
    fsMod.where('semester', '==', semester),
    fsMod.where('tahunAjaran', '==', tahunAjaran)
  );
  const snap = await fsMod.getDocs(q);
  const map = {};
  snap.forEach(d => { map[d.data().siswaId] = { id: d.id, slm: d.data().slm, sas: d.data().sas ?? null }; });
  return map;
}

/**
 * Ambil semua nilai TP untuk satu mapel+kelas SEKALIGUS (lintas TP),
 * dikelompokkan per tpId — dipakai beranda.html untuk hitung status
 * tanpa query berulang per TP.
 * @returns {Promise<Object<string, Array<{slm:number, sas:number|null}>>>} tpId -> daftar nilai
 */
export async function getNilaiTPSummary({ mapel, kelas, semester, tahunAjaran }) {
  let list;
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 150));
    list = readDemoNilaiTP().filter(n => n.mapel === mapel && n.kelas === kelas && n.semester === semester && n.tahunAjaran === tahunAjaran);
  } else {
    const { db, fsMod } = window.__fb;
    const q = fsMod.query(
      fsMod.collection(db, 'nilai_tp'),
      fsMod.where('mapel', '==', mapel),
      fsMod.where('kelas', '==', kelas),
      fsMod.where('semester', '==', semester),
      fsMod.where('tahunAjaran', '==', tahunAjaran)
    );
    const snap = await fsMod.getDocs(q);
    list = snap.docs.map(d => d.data());
  }
  const perTp = {};
  list.forEach(n => {
    if (!perTp[n.tpId]) perTp[n.tpId] = [];
    perTp[n.tpId].push({ slm: n.slm, sas: n.sas ?? null });
  });
  return perTp;
}

/**
 * Simpan nilai (SLM+SAS) untuk satu TP, banyak siswa sekaligus (upsert per
 * siswa). `existing` = hasil getNilaiTPUntukTP sebelumnya.
 * @param {{tpId, mapel, kelas, tingkatan, semester, tahunAjaran}} ctx
 * @param {Array<{siswaId:string, slm:number, sas:number|null}>} entries
 * @param {Object} existing peta siswaId -> {id, slm, sas} dari getNilaiTPUntukTP
 */
export async function saveNilaiTPBatch(ctx, entries, existing) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 300));
    const list = readDemoNilaiTP();
    entries.forEach(({ siswaId, slm, sas }) => {
      const found = existing[siswaId];
      const data = { tpId: ctx.tpId, siswaId, mapel: ctx.mapel, kelas: ctx.kelas, tingkatan: String(ctx.tingkatan), semester: ctx.semester, tahunAjaran: ctx.tahunAjaran, slm, sas: sas ?? null };
      if (found) {
        const idx = list.findIndex(n => n.id === found.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...data };
      } else {
        list.push({ id: 'demo-tp-nilai-' + Date.now() + '-' + siswaId, ...data });
      }
    });
    writeDemoNilaiTP(list);
    return;
  }

  const { db, fsMod, auth } = window.__fb;
  for (const { siswaId, slm, sas } of entries) {
    const found = existing[siswaId];
    const data = {
      tpId: ctx.tpId, siswaId, mapel: ctx.mapel, kelas: ctx.kelas,
      tingkatan: String(ctx.tingkatan), semester: ctx.semester, tahunAjaran: ctx.tahunAjaran,
      slm, sas: sas ?? null,
    };
    if (found) {
      await fsMod.updateDoc(fsMod.doc(db, 'nilai_tp', found.id), { ...data, updatedAt: fsMod.serverTimestamp(), updatedBy: auth.currentUser?.uid || null });
    } else {
      await fsMod.addDoc(fsMod.collection(db, 'nilai_tp'), { ...data, createdAt: fsMod.serverTimestamp(), createdBy: auth.currentUser?.uid || null });
    }
  }
}

/* ==========================================================================
   Cakupan TP untuk STS & SAS — SEBELUM guru bisa input nilai STS atau SAS
   untuk suatu mapel+kelas, guru wajib memilih dulu TP mana yang diikutkan
   asesmen itu ("Setup Cakupan"). Cakupan STS dan cakupan SAS untuk mapel+
   kelas yang sama SENGAJA disimpan terpisah (tpIds bisa beda total) —
   tidak otomatis sama, sesuai arahan pemilik sistem. Satu dokumen per
   (mapel, kelas, semester, tahunAjaran, jenis).
   ========================================================================== */

const DEMO_CAKUPAN_KEY = 'akd_demo_asesmen_cakupan';

function readDemoCakupan() {
  return JSON.parse(localStorage.getItem(DEMO_CAKUPAN_KEY) || '[]');
}
function writeDemoCakupan(list) {
  localStorage.setItem(DEMO_CAKUPAN_KEY, JSON.stringify(list));
}
function cakupanDemoId({ mapel, kelas, semester, tahunAjaran, jenis }) {
  return `${mapel}__${kelas}__${semester}__${tahunAjaran}__${jenis}`;
}

/**
 * Ambil cakupan TP (daftar tpId yang diikutkan) untuk satu mapel+kelas,
 * jenis 'sts' atau 'sas'. @returns {Promise<{id:string, tpIds:string[]}|null>}
 */
export async function getCakupanTP({ mapel, kelas, semester, tahunAjaran, jenis }) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 150));
    const found = readDemoCakupan().find(c =>
      c.mapel === mapel && c.kelas === kelas && c.semester === semester &&
      c.tahunAjaran === tahunAjaran && c.jenis === jenis);
    return found ? { id: found.id, tpIds: found.tpIds || [] } : null;
  }
  const { db, fsMod } = window.__fb;
  const q = fsMod.query(
    fsMod.collection(db, 'asesmen_cakupan'),
    fsMod.where('mapel', '==', mapel),
    fsMod.where('kelas', '==', kelas),
    fsMod.where('semester', '==', semester),
    fsMod.where('tahunAjaran', '==', tahunAjaran),
    fsMod.where('jenis', '==', jenis)
  );
  const snap = await fsMod.getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, tpIds: d.data().tpIds || [] };
}

/** Simpan (upsert) cakupan TP untuk STS/SAS satu mapel+kelas. */
export async function saveCakupanTP(payload, existingId) {
  const data = {
    mapel: payload.mapel, kelas: payload.kelas, tingkatan: String(payload.tingkatan),
    semester: payload.semester, tahunAjaran: payload.tahunAjaran, jenis: payload.jenis,
    tpIds: payload.tpIds || [],
  };
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 250));
    const list = readDemoCakupan();
    const id = existingId || cakupanDemoId(payload);
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...data };
    else list.push({ id, ...data });
    writeDemoCakupan(list);
    return;
  }
  const { db, fsMod, auth } = window.__fb;
  if (existingId) {
    await fsMod.updateDoc(fsMod.doc(db, 'asesmen_cakupan', existingId), { ...data, updatedAt: fsMod.serverTimestamp(), updatedBy: auth.currentUser?.uid || null });
  } else {
    await fsMod.addDoc(fsMod.collection(db, 'asesmen_cakupan'), { ...data, createdAt: fsMod.serverTimestamp(), createdBy: auth.currentUser?.uid || null });
  }
}

/* ==========================================================================
   Nilai STS & SAS — murni per TP per siswa, TERPISAH dari nilai_tp (yang
   sekarang khusus SLM). Kedua jenis pakai fungsi yang sama lewat parameter
   `jenis` ('sts'|'sas') supaya tidak duplikasi logika baca/tulis — jenis
   menentukan nama koleksi Firestore (`nilai_sts`/`nilai_sas`) dan key
   localStorage demo. Nilai SAS di sini menggantikan peran field `sas` lama
   di nilai_tp (field lama itu dibiarkan menggantung, tidak dihapus/dibaca
   lagi, demi kompatibilitas mundur dokumen nilai_tp yang sudah ada).
   ========================================================================== */

const DEMO_NILAI_ASESMEN_KEY = { sts: 'akd_demo_nilai_sts', sas: 'akd_demo_nilai_sas' };
const KOLEKSI_NILAI_ASESMEN  = { sts: 'nilai_sts',          sas: 'nilai_sas' };

function readDemoNilaiAsesmen(jenis) {
  return JSON.parse(localStorage.getItem(DEMO_NILAI_ASESMEN_KEY[jenis]) || '[]');
}
function writeDemoNilaiAsesmen(jenis, list) {
  localStorage.setItem(DEMO_NILAI_ASESMEN_KEY[jenis], JSON.stringify(list));
}

/**
 * Ambil nilai STS/SAS satu TP, lintas siswa sekelas. Bentuk return sama
 * dengan getNilaiTPUntukTP supaya halaman input bisa pakai pola yang sama.
 * @returns {Promise<Object<string,{id:string, nilai:number}>>} siswaId -> {id, nilai}
 */
export async function getNilaiAsesmenUntukTP({ jenis, tpId, mapel, kelas, semester, tahunAjaran }) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    const list = readDemoNilaiAsesmen(jenis).filter(n => n.tpId === tpId && n.semester === semester && n.tahunAjaran === tahunAjaran);
    const map = {};
    list.forEach(n => { map[n.siswaId] = { id: n.id, nilai: n.nilai }; });
    return map;
  }
  const { db, fsMod } = window.__fb;
  const q = fsMod.query(
    fsMod.collection(db, KOLEKSI_NILAI_ASESMEN[jenis]),
    fsMod.where('tpId', '==', tpId),
    fsMod.where('mapel', '==', mapel),
    fsMod.where('kelas', '==', kelas),
    fsMod.where('semester', '==', semester),
    fsMod.where('tahunAjaran', '==', tahunAjaran)
  );
  const snap = await fsMod.getDocs(q);
  const map = {};
  snap.forEach(d => { map[d.data().siswaId] = { id: d.id, nilai: d.data().nilai }; });
  return map;
}

/**
 * Sama seperti getNilaiTPSummary tapi untuk STS/SAS — dipakai hub utk
 * hitung status "X/Y TP terisi" tanpa query berulang per TP.
 * @returns {Promise<Object<string, Array<{nilai:number}>>>} tpId -> daftar nilai
 */
export async function getNilaiAsesmenSummary({ jenis, mapel, kelas, semester, tahunAjaran }) {
  let list;
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 150));
    list = readDemoNilaiAsesmen(jenis).filter(n => n.mapel === mapel && n.kelas === kelas && n.semester === semester && n.tahunAjaran === tahunAjaran);
  } else {
    const { db, fsMod } = window.__fb;
    const q = fsMod.query(
      fsMod.collection(db, KOLEKSI_NILAI_ASESMEN[jenis]),
      fsMod.where('mapel', '==', mapel),
      fsMod.where('kelas', '==', kelas),
      fsMod.where('semester', '==', semester),
      fsMod.where('tahunAjaran', '==', tahunAjaran)
    );
    const snap = await fsMod.getDocs(q);
    list = snap.docs.map(d => d.data());
  }
  const perTp = {};
  list.forEach(n => {
    if (!perTp[n.tpId]) perTp[n.tpId] = [];
    perTp[n.tpId].push({ nilai: n.nilai });
  });
  return perTp;
}

/** Simpan nilai STS/SAS satu TP, banyak siswa sekaligus (upsert per siswa). */
export async function saveNilaiAsesmenBatch(ctx, entries, existing) {
  const jenis = ctx.jenis;
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 300));
    const list = readDemoNilaiAsesmen(jenis);
    entries.forEach(({ siswaId, nilai }) => {
      const found = existing[siswaId];
      const data = { tpId: ctx.tpId, siswaId, mapel: ctx.mapel, kelas: ctx.kelas, tingkatan: String(ctx.tingkatan), semester: ctx.semester, tahunAjaran: ctx.tahunAjaran, nilai };
      if (found) {
        const idx = list.findIndex(n => n.id === found.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...data };
      } else {
        list.push({ id: `demo-${jenis}-` + Date.now() + '-' + siswaId, ...data });
      }
    });
    writeDemoNilaiAsesmen(jenis, list);
    return;
  }

  const { db, fsMod, auth } = window.__fb;
  for (const { siswaId, nilai } of entries) {
    const found = existing[siswaId];
    const data = {
      tpId: ctx.tpId, siswaId, mapel: ctx.mapel, kelas: ctx.kelas,
      tingkatan: String(ctx.tingkatan), semester: ctx.semester, tahunAjaran: ctx.tahunAjaran, nilai,
    };
    if (found) {
      await fsMod.updateDoc(fsMod.doc(db, KOLEKSI_NILAI_ASESMEN[jenis], found.id), { ...data, updatedAt: fsMod.serverTimestamp(), updatedBy: auth.currentUser?.uid || null });
    } else {
      await fsMod.addDoc(fsMod.collection(db, KOLEKSI_NILAI_ASESMEN[jenis]), { ...data, createdAt: fsMod.serverTimestamp(), createdBy: auth.currentUser?.uid || null });
    }
  }
}

/**
 * Agregasi nilai STS lintas-mapel untuk SATU siswa — dasar "rapor
 * bayangan" STS. Untuk tiap mapel yang berlaku di tingkatan siswa ini:
 * ambil TP yang masuk cakupan STS mapel itu, ambil nilai STS siswa untuk
 * TP-TP tsb, lalu hitung rata-rata TERTIMBANG bobotMapel (fungsi yang
 * SAMA dengan hitungNilaiAkhirMapel() di rapor resmi — supaya tidak ada
 * dua rumus rata-rata tertimbang yang bisa beda hasil).
 *
 * SENGAJA independen dari SLM/SAS — angka yang keluar di sini murni STS,
 * beda dari efektifSLM yang dipakai nilai akhir rapor resmi.
 *
 * Mapel tanpa cakupan STS sama sekali (atau nilai belum diisi) tetap
 * masuk hasil dengan `nilaiAkhir: null` — halaman pemanggil yang
 * memutuskan cara menampilkannya (mis. "—" / "Belum ada nilai").
 *
 * @returns {Promise<Array<{mapel:string, kelompok:string, urutan:number, nilaiAkhir:number|null}>>}
 */
export async function getRaporSTSSiswa({ siswaId, kelas, tingkatan, semester, tahunAjaran }) {
  const mapelList = (await getMapelList())
    .filter(m => mapelBerlakuDiTingkatan(m, tingkatan))
    .sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));

  return Promise.all(mapelList.map(async (m) => {
    const [tpList, cakupan] = await Promise.all([
      getTPList({ mapel: m.nama, tingkatan }),
      getCakupanTP({ mapel: m.nama, kelas, semester, tahunAjaran, jenis: 'sts' }),
    ]);
    const tpIds = cakupan?.tpIds || [];
    const tpCakupan = tpList.filter(tp => tpIds.includes(tp.id));

    let nilaiAkhir = null;
    if (tpCakupan.length) {
      const entries = await Promise.all(tpCakupan.map(async (tp) => {
        const nilaiMap = await getNilaiAsesmenUntukTP({ jenis: 'sts', tpId: tp.id, mapel: m.nama, kelas, semester, tahunAjaran });
        return { nilai: nilaiMap[siswaId]?.nilai ?? null, bobot: tp.bobotMapel ?? 1 };
      }));
      nilaiAkhir = hitungNilaiAkhirMapel(entries);
    }
    return { mapel: m.nama, kelompok: m.kelompok || 'wajib', urutan: m.urutan ?? 0, nilaiAkhir };
  }));
}

/* ==========================================================================
   Absensi & Keputusan Naik Kelas — KHUSUS wali kelas. Satu dokumen per
   (siswa × semester × tahun ajaran): rekap sakit/izin/tanpa keterangan,
   catatan wali, dan keputusan naik/tinggal kelas.
   ========================================================================== */

export const KEPUTUSAN_OPSI = ['Belum diputuskan', 'Naik Kelas', 'Tinggal Kelas'];

const DEMO_ABSENSI_KEY = 'akd_demo_absensi';

function readDemoAbsensi() {
  return JSON.parse(localStorage.getItem(DEMO_ABSENSI_KEY) || '[]');
}
function writeDemoAbsensi(list) {
  localStorage.setItem(DEMO_ABSENSI_KEY, JSON.stringify(list));
}

/** @returns {Promise<Object<string, object>>} siswaId -> record absensi (termasuk `id`) */
export async function getAbsensiRaporByKelas(kelas, semester, tahunAjaran) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    const list = readDemoAbsensi().filter(a => a.kelas === kelas && a.semester === semester && a.tahunAjaran === tahunAjaran);
    const map = {};
    list.forEach(a => { map[a.siswaId] = a; });
    return map;
  }
  const { db, fsMod } = window.__fb;
  const q = fsMod.query(
    fsMod.collection(db, 'absensi_rapor'),
    fsMod.where('kelas', '==', kelas),
    fsMod.where('semester', '==', semester),
    fsMod.where('tahunAjaran', '==', tahunAjaran)
  );
  const snap = await fsMod.getDocs(q);
  const map = {};
  snap.forEach(d => { map[d.data().siswaId] = { id: d.id, ...d.data() }; });
  return map;
}

/**
 * Simpan satu record absensi+keputusan (upsert). `existingId` diisi kalau
 * ini update dari record yang sudah ada (dari getAbsensiRaporByKelas).
 */
export async function saveAbsensiRapor(payload, existingId) {
  const data = {
    siswaId: payload.siswaId, kelas: payload.kelas, tingkatan: String(payload.tingkatan),
    semester: payload.semester, tahunAjaran: payload.tahunAjaran,
    sakit: payload.sakit || 0, izin: payload.izin || 0, tanpaKeterangan: payload.tanpaKeterangan || 0,
    catatanWali: payload.catatanWali || '', keputusan: payload.keputusan || 'Belum diputuskan',
  };

  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 300));
    const list = readDemoAbsensi();
    if (existingId) {
      const idx = list.findIndex(a => a.id === existingId);
      if (idx >= 0) list[idx] = { ...list[idx], ...data };
    } else {
      list.push({ id: 'demo-abs-' + Date.now() + '-' + payload.siswaId, ...data });
    }
    writeDemoAbsensi(list);
    return;
  }

  const { db, fsMod, auth } = window.__fb;
  if (existingId) {
    await fsMod.updateDoc(fsMod.doc(db, 'absensi_rapor', existingId), { ...data, updatedAt: fsMod.serverTimestamp(), updatedBy: auth.currentUser?.uid || null });
  } else {
    await fsMod.addDoc(fsMod.collection(db, 'absensi_rapor'), { ...data, createdAt: fsMod.serverTimestamp(), createdBy: auth.currentUser?.uid || null });
  }
}

/* ==========================================================================
   DPL (Dimensi Profil Lulusan) — SEKARANG milik masing-masing WALI KELAS,
   bukan daftar global admin lagi. Tiap kelas punya set DPL-nya sendiri
   (nama 8 dimensi resmi sama, tapi deskripsi tiap level & status aktif
   ditentukan sendiri oleh wali kelasnya, karena wajar beda kebutuhan
   antara kelas 1 dan kelas 6). Hasil setup ini otomatis jadi pilihan DPL
   di Proyek STEM kelas yang sama.
   ========================================================================== */

const DEMO_DPL_KEY = 'akd_demo_dpl';

function readDemoDpl() {
  return JSON.parse(localStorage.getItem(DEMO_DPL_KEY) || '[]');
}

/** Ambil semua DPL milik satu kelas, terurut. Pakai {hanyaAktif:true} untuk filter yang aktif saja. */
export async function getDPLListByKelas(kelas, { hanyaAktif = false } = {}) {
  let list;
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 150));
    list = readDemoDpl().filter(d => d.kelas === kelas);
  } else {
    const { db, fsMod } = window.__fb;
    const q = fsMod.query(fsMod.collection(db, 'dpl'), fsMod.where('kelas', '==', kelas));
    const snap = await fsMod.getDocs(q);
    list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
  return hanyaAktif ? list.filter(d => d.aktif) : list;
}

/** Simpan satu DPL milik satu kelas (upsert berdasar id kalau ada). */
export async function saveDPL(payload) {
  const data = {
    kelas: payload.kelas, tingkatan: String(payload.tingkatan),
    nama: payload.nama, urutan: payload.urutan, aktif: !!payload.aktif,
    levelDeskripsi: payload.levelDeskripsi,
  };
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 250));
    const list = readDemoDpl();
    if (payload.id) {
      const idx = list.findIndex(d => d.id === payload.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...data };
    } else {
      list.push({ id: 'demo-dpl-' + Date.now(), ...data });
    }
    localStorage.setItem(DEMO_DPL_KEY, JSON.stringify(list));
    return;
  }
  const { db, fsMod, auth } = window.__fb;
  if (payload.id) {
    await fsMod.updateDoc(fsMod.doc(db, 'dpl', payload.id), { ...data, updatedAt: fsMod.serverTimestamp(), updatedBy: auth.currentUser?.uid || null });
  } else {
    await fsMod.addDoc(fsMod.collection(db, 'dpl'), { ...data, createdAt: fsMod.serverTimestamp(), createdBy: auth.currentUser?.uid || null });
  }
}

/** Hapus satu DPL. */
export async function deleteDPL(id) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 150));
    localStorage.setItem(DEMO_DPL_KEY, JSON.stringify(readDemoDpl().filter(d => d.id !== id)));
    return;
  }
  const { db, fsMod } = window.__fb;
  await fsMod.deleteDoc(fsMod.doc(db, 'dpl', id));
}

/* ==========================================================================
   Kokurikuler — nilai (level 1-4, skala BT/MT/BSH/SB) per siswa per DPL,
   TERIKAT ke satu Proyek STEM tertentu (bukan lagi lepas per semester) —
   sesuai panduan penilaian STEM: observasi DPL terjadi selama proyek
   berjalan, bukan floating tanpa konteks. Khusus wali kelas.
   ========================================================================== */

const DEMO_KOKURIKULER_KEY = 'akd_demo_kokurikuler';

function readDemoKokurikuler() {
  return JSON.parse(localStorage.getItem(DEMO_KOKURIKULER_KEY) || '[]');
}
function writeDemoKokurikuler(list) {
  localStorage.setItem(DEMO_KOKURIKULER_KEY, JSON.stringify(list));
}

/** @returns {Promise<Object<string,object>>} siswaId -> { dplId: {id, level, deskripsi} } */
export async function getKokurikulerByProyek(proyekStemId, kelas) {
  let list;
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    list = readDemoKokurikuler().filter(k => k.proyekStemId === proyekStemId);
  } else {
    const { db, fsMod } = window.__fb;
    const q = fsMod.query(
      fsMod.collection(db, 'kokurikuler'),
      fsMod.where('proyekStemId', '==', proyekStemId),
      fsMod.where('kelas', '==', kelas)
    );
    const snap = await fsMod.getDocs(q);
    list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  const map = {};
  list.forEach(k => {
    if (!map[k.siswaId]) map[k.siswaId] = {};
    map[k.siswaId][k.dplId] = { id: k.id, level: k.level, deskripsi: k.deskripsi };
  });
  return map;
}

/** Simpan satu nilai kokurikuler (upsert). `existingId` dari getKokurikulerByProyek kalau ada. */
export async function saveKokurikuler(payload, existingId) {
  const data = {
    siswaId: payload.siswaId, dplId: payload.dplId, kelas: payload.kelas,
    tingkatan: String(payload.tingkatan), semester: payload.semester, tahunAjaran: payload.tahunAjaran,
    proyekStemId: payload.proyekStemId,
    level: payload.level, deskripsi: payload.deskripsi || '',
  };
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 250));
    const list = readDemoKokurikuler();
    if (existingId) {
      const idx = list.findIndex(k => k.id === existingId);
      if (idx >= 0) list[idx] = { ...list[idx], ...data };
    } else {
      list.push({ id: 'demo-kok-' + Date.now() + '-' + payload.siswaId + '-' + payload.dplId, ...data });
    }
    writeDemoKokurikuler(list);
    return;
  }
  const { db, fsMod, auth } = window.__fb;
  if (existingId) {
    await fsMod.updateDoc(fsMod.doc(db, 'kokurikuler', existingId), { ...data, updatedAt: fsMod.serverTimestamp(), updatedBy: auth.currentUser?.uid || null });
  } else {
    await fsMod.addDoc(fsMod.collection(db, 'kokurikuler'), { ...data, createdAt: fsMod.serverTimestamp(), createdBy: auth.currentUser?.uid || null });
  }
}

/* ==========================================================================
   Proyek STEM — kokurikuler tahun ini HANYA lewat proyek STEM, wajib
   melibatkan ≥2 mata pelajaran (validasi jumlah mapel dilakukan di sisi
   tampilan, bukan di sini — supaya pesan errornya bisa langsung jelas ke
   guru sebelum sempat mencoba simpan). Nilai DPL per siswa untuk proyek
   ini BELUM dibangun — menyusul setelah mekanismenya disepakati.
   ========================================================================== */

const DEMO_PROYEK_STEM_KEY = 'akd_demo_proyek_stem';

function readDemoProyekStem() {
  return JSON.parse(localStorage.getItem(DEMO_PROYEK_STEM_KEY) || '[]');
}
function writeDemoProyekStem(list) {
  localStorage.setItem(DEMO_PROYEK_STEM_KEY, JSON.stringify(list));
}

/** Ambil semua proyek STEM satu kelas pada semester/tahun ajaran tertentu, terbaru dulu. */
export async function getProyekStemByKelas(kelas, semester, tahunAjaran) {
  let list;
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    list = readDemoProyekStem().filter(p => p.kelas === kelas && p.semester === semester && p.tahunAjaran === tahunAjaran);
  } else {
    const { db, fsMod } = window.__fb;
    const q = fsMod.query(
      fsMod.collection(db, 'proyek_stem'),
      fsMod.where('kelas', '==', kelas),
      fsMod.where('semester', '==', semester),
      fsMod.where('tahunAjaran', '==', tahunAjaran)
    );
    const snap = await fsMod.getDocs(q);
    list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return list.sort((a, b) => (b.tanggalMulai || '').localeCompare(a.tanggalMulai || ''));
}

/** Simpan satu proyek STEM (upsert kalau payload.id ada). */
export async function saveProyekStem(payload) {
  const data = {
    kelas: payload.kelas, tingkatan: String(payload.tingkatan),
    semester: payload.semester, tahunAjaran: payload.tahunAjaran,
    judul: payload.judul,
    mapelTerlibat: payload.mapelTerlibat,
    dplId: payload.dplId,
    tanggalMulai: payload.tanggalMulai,
    tanggalSelesai: payload.tanggalSelesai,
    jumlahPertemuan: payload.jumlahPertemuan,
  };

  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 250));
    const list = readDemoProyekStem();
    if (payload.id) {
      const idx = list.findIndex(p => p.id === payload.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...data };
    } else {
      list.push({ id: 'demo-stem-' + Date.now(), ...data });
    }
    writeDemoProyekStem(list);
    return;
  }

  const { db, fsMod, auth } = window.__fb;
  if (payload.id) {
    await fsMod.updateDoc(fsMod.doc(db, 'proyek_stem', payload.id), { ...data, updatedAt: fsMod.serverTimestamp(), updatedBy: auth.currentUser?.uid || null });
  } else {
    await fsMod.addDoc(fsMod.collection(db, 'proyek_stem'), { ...data, createdAt: fsMod.serverTimestamp(), createdBy: auth.currentUser?.uid || null });
  }
}

/** Hapus satu proyek STEM. */
export async function deleteProyekStem(id) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 150));
    writeDemoProyekStem(readDemoProyekStem().filter(p => p.id !== id));
    return;
  }
  const { db, fsMod } = window.__fb;
  await fsMod.deleteDoc(fsMod.doc(db, 'proyek_stem', id));
}

