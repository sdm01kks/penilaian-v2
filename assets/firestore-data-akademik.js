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
  { id: 'Matematika',       nama: 'Matematika',       kelompok: 'wajib', urutan: 1, bobotSlm: 60, bobotSas: 40 },
  { id: 'Bahasa Indonesia', nama: 'Bahasa Indonesia', kelompok: 'wajib', urutan: 2, bobotSlm: 60, bobotSas: 40 },
  { id: 'IPAS',             nama: 'IPAS',             kelompok: 'wajib', urutan: 3, bobotSlm: 60, bobotSas: 40 },
  { id: 'PJOK',             nama: 'PJOK',              kelompok: 'wajib', urutan: 4, bobotSlm: 60, bobotSas: 40 },
];
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
    return readDemoMapel().find(m => m.nama === nama) || { id: nama, nama, bobotSlm: 60, bobotSas: 40 };
  }
  const { db, fsMod } = window.__fb;
  const snap = await fsMod.getDoc(fsMod.doc(db, 'mapel', nama));
  return snap.exists() ? { id: snap.id, ...snap.data() } : { id: nama, nama, bobotSlm: 60, bobotSas: 40 };
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
