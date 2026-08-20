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
   Kalkulasi — dipakai lagi nanti di halaman Input Nilai Mapel.
   PENTING (koreksi dari aplikasi lama, per arahan pemilik sistem):
   SAS bukan per-TP. Nilai akhir mapel = rata-rata SLM semua TP (dengan
   level KKTP tiap TP ditentukan dari nilai SLM TP itu sendiri) dikombinasi
   dengan SATU nilai SAS per mapel per semester.
   ========================================================================== */

/** Tentukan level KKTP dari satu nilai SLM, mengikuti rentang TP tsb. */
export function tentukanLevel(nilaiSlm, tp) {
  if (nilaiSlm === '' || nilaiSlm === null || nilaiSlm === undefined) return null;
  const n = parseFloat(nilaiSlm);
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
 * Nilai akhir mapel = (rata-rata semua nilai SLM per TP × bobotSlm%)
 *                     + (nilai SAS × bobotSas%).
 * Kalau SAS belum diisi, nilai akhir sementara = rata-rata SLM saja.
 */
export function hitungNilaiAkhirMapel(nilaiSlmPerTP, nilaiSas, mapel) {
  const nilaiValid = nilaiSlmPerTP.filter(n => n !== null && n !== undefined && n !== '');
  if (!nilaiValid.length) return null;

  const rataSlm = nilaiValid.reduce((a, b) => a + parseFloat(b), 0) / nilaiValid.length;
  if (nilaiSas === null || nilaiSas === undefined || nilaiSas === '') {
    return Math.round(rataSlm);
  }
  const bobotSlm = (mapel?.bobotSlm ?? 60) / 100;
  const bobotSas = (mapel?.bobotSas ?? 40) / 100;
  return Math.round(rataSlm * bobotSlm + parseFloat(nilaiSas) * bobotSas);
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

/* ==========================================================================
   Nilai SLM — satu dokumen per (siswa × TP × semester × tahun ajaran).
   ========================================================================== */

const DEMO_NILAI_SLM_KEY = 'akd_demo_nilai_slm';

function readDemoNilaiSlm() {
  return JSON.parse(localStorage.getItem(DEMO_NILAI_SLM_KEY) || '[]');
}
function writeDemoNilaiSlm(list) {
  localStorage.setItem(DEMO_NILAI_SLM_KEY, JSON.stringify(list));
}

/**
 * Ambil semua nilai SLM untuk satu TP pada satu semester/tahun ajaran
 * (lintas siswa sekelas), dipakai untuk mengisi grid saat dibuka.
 * @returns {Promise<Object<string,{id:string, nilai:number}>>} siswaId -> {id, nilai}
 */
export async function getNilaiSlmUntukTP({ tpId, semester, tahunAjaran }) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    const list = readDemoNilaiSlm().filter(n => n.tpId === tpId && n.semester === semester && n.tahunAjaran === tahunAjaran);
    const map = {};
    list.forEach(n => { map[n.siswaId] = { id: n.id, nilai: n.nilai }; });
    return map;
  }
  const { db, fsMod } = window.__fb;
  const q = fsMod.query(
    fsMod.collection(db, 'nilai_slm'),
    fsMod.where('tpId', '==', tpId),
    fsMod.where('semester', '==', semester),
    fsMod.where('tahunAjaran', '==', tahunAjaran)
  );
  const snap = await fsMod.getDocs(q);
  const map = {};
  snap.forEach(d => { map[d.data().siswaId] = { id: d.id, nilai: d.data().nilai }; });
  return map;
}

/**
 * Simpan nilai SLM untuk satu TP, banyak siswa sekaligus (upsert per
 * siswa). `existing` = hasil getNilaiSlmUntukTP sebelumnya, dipakai untuk
 * tahu mana yang perlu update vs create.
 * @param {{tpId, mapel, kelas, tingkatan, semester, tahunAjaran}} ctx
 * @param {Array<{siswaId:string, nilai:number}>} entries
 * @param {Object} existing peta siswaId -> {id, nilai} dari getNilaiSlmUntukTP
 */
export async function saveNilaiSlmBatch(ctx, entries, existing) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 300));
    const list = readDemoNilaiSlm();
    entries.forEach(({ siswaId, nilai }) => {
      const found = existing[siswaId];
      const data = { tpId: ctx.tpId, siswaId, mapel: ctx.mapel, kelas: ctx.kelas, tingkatan: String(ctx.tingkatan), semester: ctx.semester, tahunAjaran: ctx.tahunAjaran, nilai };
      if (found) {
        const idx = list.findIndex(n => n.id === found.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...data };
      } else {
        list.push({ id: 'demo-slm-' + Date.now() + '-' + siswaId, ...data });
      }
    });
    writeDemoNilaiSlm(list);
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
      await fsMod.updateDoc(fsMod.doc(db, 'nilai_slm', found.id), { ...data, updatedAt: fsMod.serverTimestamp(), updatedBy: auth.currentUser?.uid || null });
    } else {
      await fsMod.addDoc(fsMod.collection(db, 'nilai_slm'), { ...data, createdAt: fsMod.serverTimestamp(), createdBy: auth.currentUser?.uid || null });
    }
  }
}

/* ==========================================================================
   Nilai SAS — SATU dokumen per (siswa × mapel × semester × tahun ajaran).
   BUKAN per TP — koreksi dari aplikasi lama, lihat README.
   ========================================================================== */

const DEMO_NILAI_SAS_KEY = 'akd_demo_nilai_sas';

function readDemoNilaiSas() {
  return JSON.parse(localStorage.getItem(DEMO_NILAI_SAS_KEY) || '[]');
}
function writeDemoNilaiSas(list) {
  localStorage.setItem(DEMO_NILAI_SAS_KEY, JSON.stringify(list));
}

/** @returns {Promise<Object<string,{id:string, nilai:number}>>} siswaId -> {id, nilai} */
export async function getNilaiSasUntukMapel({ mapel, kelas, semester, tahunAjaran }) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    const list = readDemoNilaiSas().filter(n => n.mapel === mapel && n.kelas === kelas && n.semester === semester && n.tahunAjaran === tahunAjaran);
    const map = {};
    list.forEach(n => { map[n.siswaId] = { id: n.id, nilai: n.nilai }; });
    return map;
  }
  const { db, fsMod } = window.__fb;
  const q = fsMod.query(
    fsMod.collection(db, 'nilai_sas'),
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

/** Simpan nilai SAS banyak siswa sekaligus (upsert per siswa). */
export async function saveNilaiSasBatch(ctx, entries, existing) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 300));
    const list = readDemoNilaiSas();
    entries.forEach(({ siswaId, nilai }) => {
      const found = existing[siswaId];
      const data = { mapel: ctx.mapel, kelas: ctx.kelas, tingkatan: String(ctx.tingkatan), semester: ctx.semester, tahunAjaran: ctx.tahunAjaran, nilai };
      if (found) {
        const idx = list.findIndex(n => n.id === found.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...data };
      } else {
        list.push({ id: 'demo-sas-' + Date.now() + '-' + siswaId, siswaId, ...data });
      }
    });
    writeDemoNilaiSas(list);
    return;
  }

  const { db, fsMod, auth } = window.__fb;
  for (const { siswaId, nilai } of entries) {
    const found = existing[siswaId];
    const data = {
      siswaId, mapel: ctx.mapel, kelas: ctx.kelas,
      tingkatan: String(ctx.tingkatan), semester: ctx.semester, tahunAjaran: ctx.tahunAjaran, nilai,
    };
    if (found) {
      await fsMod.updateDoc(fsMod.doc(db, 'nilai_sas', found.id), { ...data, updatedAt: fsMod.serverTimestamp(), updatedBy: auth.currentUser?.uid || null });
    } else {
      await fsMod.addDoc(fsMod.collection(db, 'nilai_sas'), { ...data, createdAt: fsMod.serverTimestamp(), createdBy: auth.currentUser?.uid || null });
    }
  }
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
