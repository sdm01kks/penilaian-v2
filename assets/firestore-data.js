/**
 * firestore-data.js — Lapisan akses data untuk modul Tahsin-Tahfizh
 * SD Muhammadiyah 01 Kukusan
 *
 * Semua fungsi di sini otomatis pakai data tiruan (DEMO_MODE) selama
 * Firebase belum tersambung, dan otomatis pakai Firestore sungguhan
 * begitu firebase.js terisi config asli. Halaman yang memanggil fungsi
 * di sini tidak perlu tahu bedanya.
 */

import { DEMO_MODE } from './firebase.js';

/* ==========================================================================
   KKTP — konfigurasi aspek & bobot penilaian
   ========================================================================== */

// Dipakai sebagai fallback DEMO_MODE, dan juga sumber untuk seed-kktp.html.
export const KKTP_DEFAULT = {
  iqro: { jenjang: 'iqro', aspek: [
    { nama:'Pengenalan Huruf', bobot:30, desc:[
      'Belum mampu membedakan huruf hijaiyah yang mirip secara visual maupun bunyi',
      'Mengenali sebagian huruf; banyak yang masih tertukar meski sudah diingatkan',
      'Sebagian besar huruf dikenali dengan benar; beberapa huruf mirip masih tertukar',
      'Hampir semua huruf dikenali dengan benar; kekeliruan sangat jarang terjadi',
      'Semua huruf hijaiyah dikenali tanpa ragu, termasuk huruf yang mirip secara visual',
    ]},
    { nama:'Ketepatan Harakat', bobot:30, desc:[
      'Belum mengenal harakat fathah, kasrah, dhammah, dan turunannya',
      'Mengenal harakat dasar namun penerapannya belum konsisten',
      'Sebagian besar harakat dibaca tepat; beberapa masih perlu diingatkan',
      'Hampir semua harakat tepat termasuk tanwin dan sukun; kesalahan sangat jarang',
      'Semua harakat dibaca tepat dan cepat; termasuk harakat yang kompleks',
    ]},
    { nama:'Kelancaran Membaca', bobot:25, desc:[
      'Sangat lambat, mengeja setiap huruf; banyak kesalahan yang menghambat pemahaman',
      'Terbata-bata; perlu banyak bimbingan guru untuk melanjutkan bacaan',
      'Cukup lancar; beberapa kali tersendat di kata-kata atau kombinasi tertentu',
      'Lancar dengan jeda yang wajar; tidak tersendat secara signifikan',
      'Membaca halus tanpa mengeja; ritme stabil dan tidak tersendat',
    ]},
    { nama:'Progress Iqro', bobot:15, desc:[
      'Belum mencapai setengah dari target halaman semester ini',
      'Mencapai 50–69% dari target halaman semester ini',
      'Mencapai 70–84% dari target halaman semester ini',
      'Mencapai 85–99% dari target halaman semester ini',
      'Mencapai atau melampaui 100% dari target halaman semester ini',
    ]},
  ]},
  quran: { jenjang: 'quran', aspek: [
    { nama:'Makharijul Huruf', bobot:30, desc:[
      'Belum mampu membedakan bunyi huruf yang memiliki makhraj berdekatan',
      'Beberapa makhraj sudah tepat; banyak huruf masih tertukar bunyinya',
      'Sebagian besar makhraj tepat; beberapa huruf mirip masih perlu diingatkan',
      'Hampir semua makhraj tepat; kekeliruan sangat jarang terjadi',
      'Semua huruf keluar dari makhraj yang tepat; tidak ada kekeliruan',
    ]},
    { nama:'Penerapan Tajwid', bobot:35, desc:[
      'Belum mengenal atau menerapkan hukum bacaan tajwid sama sekali',
      'Mengenal beberapa hukum bacaan namun penerapannya belum konsisten',
      'Sebagian besar hukum bacaan diterapkan; 3–5 kesalahan per halaman',
      'Hukum bacaan diterapkan dengan baik; hanya 1–2 kesalahan minor',
      'Semua hukum bacaan diterapkan dengan benar dan mandiri tanpa diingatkan',
    ]},
    { nama:'Tartil & Kelancaran', bobot:20, desc:[
      'Sangat lambat dan banyak kesalahan; tidak menunjukkan tartil sama sekali',
      'Terbata-bata; perlu bimbingan; ritme tidak stabil',
      'Cukup lancar; beberapa kali tersendat; ritme cukup stabil',
      'Lancar dan tartil; jeda antar ayat wajar; ritme stabil',
      'Mengalir lancar dengan tartil sempurna; ritme sangat stabil dan indah',
    ]},
    { nama:'Sifatul Huruf', bobot:15, desc:[
      'Belum menunjukkan penerapan sifat huruf (tebal-tipis, dengung, qalqalah)',
      'Belum konsisten; perlu banyak contoh dan bimbingan dari guru',
      'Beberapa aspek sifat huruf sudah muncul; belum konsisten',
      'Sebagian besar sifat huruf diterapkan; sesekali perlu diingatkan',
      'Tebal-tipis, dengung, dan qalqalah diterapkan dengan tepat dan konsisten',
    ]},
  ]},
};

export const LEVELS = [
  { label:'Dhaif',         min:0,  max:59,  color:'#c0392b' },
  { label:'Maqbul',        min:60, max:69,  color:'#f39c12' },
  { label:'Jayyid',        min:70, max:79,  color:'#2980b9' },
  { label:'Jayyid Jiddan', min:80, max:89,  color:'#2d7055' },
  { label:'Mumtaz',        min:90, max:100, color:'#1e4d3b' },
];

export function levelDariNilai(nilai) {
  return LEVELS.find(l => nilai >= l.min && nilai <= l.max) || LEVELS[0];
}

export async function getKktpConfig(jenjang) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    return KKTP_DEFAULT[jenjang];
  }
  const { db, fsMod } = window.__fb;
  const snap = await fsMod.getDoc(fsMod.doc(db, 'kktp_tahsin_tahfizh', jenjang));
  return snap.exists() ? snap.data() : KKTP_DEFAULT[jenjang];
}

/* ==========================================================================
   Siswa
   ========================================================================== */

const DEMO_SISWA = [
  { id:'s1', nama:'Keysa Mufida Faried',      nis:'24257021', kelas:'3B', jenjang:'quran' },
  { id:'s2', nama:'Rheina Haura Bilqis',      nis:'24257042', kelas:'3B', jenjang:'quran' },
  { id:'s3', nama:'Muhammad Idlal Al Matin',  nis:'24257018', kelas:'4A', jenjang:'quran' },
  { id:'s4', nama:'Zein Zaenal Muttaqin',     nis:'24257033', kelas:'2A', jenjang:'iqro'  },
  { id:'s5', nama:'Muhammad Fathir Alfath',   nis:'24257009', kelas:'1A', jenjang:'iqro'  },
  { id:'s6', nama:'Muhammad Bilal Nur Ihsan', nis:'24257051', kelas:'1B', jenjang:'iqro'  },
];

/** Ambil daftar siswa. Bisa difilter per kelas (opsional). */
// Semua kode kelas yang ada di sekolah — dipakai sebagai batas filter query
// untuk admin (supaya query tetap "terbukti aman" di mata Firestore Rules,
// lihat catatan panjang di bawah).
export const SEMUA_KELAS = ['1A','1B','1C','2A','2B','3A','3B','3C','4A','4B','5A','5B','5C','6A','6B'];

/**
 * PENTING soal `scope` di fungsi-fungsi bawah ini:
 * Firestore MENOLAK TOTAL query yang mengembalikan banyak dokumen (list/query,
 * bukan get satu dokumen) kalau security rule-nya butuh baca dokumen lain
 * (di sini: profil guru di koleksi `users`, untuk cek kelasAmpu) TANPA ada
 * filter query yang cocok dengan itu — bukan menyaring hasil diam-diam,
 * tapi menolak seluruh permintaan. Makanya setiap query siswa/setoran/menulis
 * di bawah ini WAJIB diberi filter `kelas` yang eksplisit (`where('kelas', ...)`)
 * berdasarkan kelasAmpu pengguna yang sedang login (`scope`), supaya
 * Firestore bisa "membuktikan" query itu aman tanpa perlu buka setiap
 * dokumen satu-satu.
 *
 * `scope` = { role: 'admin'|'guru_tahsin_tahfizh', kelasAmpu: string[] }
 * — ambil dari session hasil onAuthChange() di firebase.js.
 */

export async function getSiswaList(kelasFilter, scope) {
  const sortByNama = (list) => [...list].sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 250));
    const list = kelasFilter ? DEMO_SISWA.filter(s => s.kelas === kelasFilter) : DEMO_SISWA;
    return sortByNama(list);
  }

  const allowedKelas = kelasFilter
    ? [kelasFilter]
    : (scope?.role === 'admin' ? SEMUA_KELAS : (scope?.kelasAmpu || []));
  if (!allowedKelas.length) return [];

  const { db, fsMod } = window.__fb;
  const col = fsMod.collection(db, 'siswa');
  const q = fsMod.query(col, fsMod.where('kelas', 'in', allowedKelas), fsMod.where('aktif', '==', true));
  const snap = await fsMod.getDocs(q);
  return sortByNama(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

/** Ambil satu siswa langsung dari ID (NIS)-nya. Dipakai oleh halaman
 *  orang tua (tidak perlu/boleh list, cukup get dokumen yang sudah diketahui). */
export async function getSiswaById(id) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 150));
    return DEMO_SISWA.find(s => s.id === id) || null;
  }
  const { db, fsMod } = window.__fb;
  const snap = await fsMod.getDoc(fsMod.doc(db, 'siswa', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* ==========================================================================
   Akun Orang Tua — pendaftaran mandiri, disetujui admin
   ========================================================================== */

const DEMO_USERS_LOCAL_KEY = 'tt_demo_users';

/** [Admin] Daftar semua permintaan akun orang tua yang masih pending. */
export async function getPermintaanOrangtuaPending() {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    const users = JSON.parse(localStorage.getItem(DEMO_USERS_LOCAL_KEY) || '[]');
    return users
      .filter(u => u.role === 'orangtua' && u.status === 'pending')
      .map(u => ({ uid: u.email, ...u })); // pakai email sebagai id sementara di mode demo
  }
  const { db, fsMod } = window.__fb;
  const q = fsMod.query(
    fsMod.collection(db, 'users'),
    fsMod.where('role', '==', 'orangtua'),
    fsMod.where('status', '==', 'pending')
  );
  const snap = await fsMod.getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

/** [Admin] Setujui atau tolak permintaan akun orang tua. `anakIds` opsional
 *  kalau admin perlu mengoreksi daftar anak sebelum menyetujui. */
export async function putuskanOrangtua(uid, disetujui, anakIds) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 250));
    const users = JSON.parse(localStorage.getItem(DEMO_USERS_LOCAL_KEY) || '[]');
    const idx = users.findIndex(u => u.email === uid);
    if (idx >= 0) {
      users[idx].status = disetujui ? 'approved' : 'ditolak';
      if (anakIds) users[idx].anakIds = anakIds;
      localStorage.setItem(DEMO_USERS_LOCAL_KEY, JSON.stringify(users));
    }
    return;
  }
  const { db, fsMod } = window.__fb;
  const data = { status: disetujui ? 'approved' : 'ditolak' };
  if (anakIds) data.anakIds = anakIds;
  await fsMod.updateDoc(fsMod.doc(db, 'users', uid), data);
}

/* ==========================================================================
   Setoran
   ========================================================================== */

const DEMO_SETORAN_KEY = 'tt_demo_setoran';

/**
 * Simpan satu sesi setoran.
 * @param {object} payload lihat bentuknya di input-setoran.html (buildPayload)
 */
export async function saveSetoran(payload) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 400));
    const list = JSON.parse(localStorage.getItem(DEMO_SETORAN_KEY) || '[]');
    const record = { id: 'demo-' + Date.now(), ...payload, createdAt: new Date().toISOString() };
    list.unshift(record);
    localStorage.setItem(DEMO_SETORAN_KEY, JSON.stringify(list));
    return record;
  }
  const { db, fsMod, auth } = window.__fb;
  const docRef = await fsMod.addDoc(fsMod.collection(db, 'setoran'), {
    ...payload,
    createdBy: auth.currentUser?.uid || null,
    createdAt: fsMod.serverTimestamp(),
  });
  return { id: docRef.id, ...payload };
}

/** Riwayat setoran seorang siswa, terbaru dulu. */
/** Riwayat setoran seorang siswa, terbaru dulu. `kelas` wajib diisi (lihat
 *  catatan di atas soal kenapa list query butuh filter kelas eksplisit). */
export async function getRiwayatSetoran(siswaId, kelas) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 250));
    const list = JSON.parse(localStorage.getItem(DEMO_SETORAN_KEY) || '[]');
    return list.filter(s => s.siswaId === siswaId);
  }
  const { db, fsMod } = window.__fb;
  const q = fsMod.query(
    fsMod.collection(db, 'setoran'),
    fsMod.where('siswaId', '==', siswaId),
    fsMod.where('kelas', '==', kelas),
    fsMod.orderBy('createdAt', 'desc')
  );
  const snap = await fsMod.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Tandai siswa (jenjang Iqro) sudah tamat Iqro — mulai membaca Al-Qur'an
 *  langsung (tetap sesi membaca/Tahsin, bukan hafalan, selama masih kelas 1-2). */
export async function updateTamatIqro(siswaId, value) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    const idx = DEMO_SISWA.findIndex(s => s.id === siswaId);
    if (idx >= 0) DEMO_SISWA[idx].tamatIqro = value;
    return;
  }
  const { db, fsMod } = window.__fb;
  await fsMod.updateDoc(fsMod.doc(db, 'siswa', siswaId), { tamatIqro: value });
}

/* ==========================================================================
   Target Hafalan — target per kelas per semester (Quran: daftar surah,
   Iqro: jilid & halaman target). Dipakai untuk menghitung capaian vs
   target di Riwayat Siswa & Cetak Laporan.
   ========================================================================== */

const DEMO_TARGET_KEY = 'tt_demo_target_hafalan';

export async function getTargetHafalan(kelas) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 150));
    const all = JSON.parse(localStorage.getItem(DEMO_TARGET_KEY) || '{}');
    return all[kelas] || null;
  }
  const { db, fsMod } = window.__fb;
  const snap = await fsMod.getDoc(fsMod.doc(db, 'target_hafalan', kelas));
  return snap.exists() ? snap.data() : null;
}

export async function saveTargetHafalan(kelas, data) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 250));
    const all = JSON.parse(localStorage.getItem(DEMO_TARGET_KEY) || '{}');
    all[kelas] = { ...data, kelas };
    localStorage.setItem(DEMO_TARGET_KEY, JSON.stringify(all));
    return;
  }
  const { db, fsMod, auth } = window.__fb;
  await fsMod.setDoc(fsMod.doc(db, 'target_hafalan', kelas), {
    ...data,
    kelas,
    updatedBy: auth.currentUser?.uid || null,
    updatedAt: fsMod.serverTimestamp(),
  });
}

/** Hitung progres satu siswa terhadap target kelasnya (khusus jenjang Quran). */
export function hitungProgresSurah(targetSurah, riwayatSetoran) {
  return (targetSurah || []).map(surahNo => {
    const entriesSurahIni = riwayatSetoran.filter(r =>
      r.jenis === 'ziyadah' && r.statusHafalan === 'lulus' &&
      r.materi?.tipe === 'quran' &&
      r.materi?.surahAwal === surahNo && r.materi?.surahAkhir === surahNo
    );
    const maxAyatAkhir = entriesSurahIni.reduce((max, r) => Math.max(max, r.materi.ayatAkhir || 0), 0);
    return { surahNo, maxAyatAkhir };
  });
}

export async function deleteSetoran(id) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 250));
    const list = JSON.parse(localStorage.getItem(DEMO_SETORAN_KEY) || '[]');
    localStorage.setItem(DEMO_SETORAN_KEY, JSON.stringify(list.filter(s => s.id !== id)));
    return;
  }
  const { db, fsMod } = window.__fb;
  await fsMod.deleteDoc(fsMod.doc(db, 'setoran', id));
}

/** Ubah field-field sederhana dari satu entri setoran (jenis, status
 *  hafalan, catatan) — TIDAK termasuk materi/Baca & Tandai, itu sengaja
 *  tidak dibuka untuk diedit supaya guru hapus & input ulang kalau
 *  materinya sendiri yang salah (menjaga histori tetap konsisten). */
export async function updateSetoran(id, patch) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 300));
    const list = JSON.parse(localStorage.getItem(DEMO_SETORAN_KEY) || '[]');
    const idx = list.findIndex(s => s.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch };
      localStorage.setItem(DEMO_SETORAN_KEY, JSON.stringify(list));
    }
    return;
  }
  const { db, fsMod } = window.__fb;
  await fsMod.updateDoc(fsMod.doc(db, 'setoran', id), patch);
}

/* ==========================================================================
   Menulis — log progres menyalin Al-Qur'an (pemeriksaan berkala,
   bukan per-sesi antrean). Fase awal: sekadar tercatat rutin,
   belum menilai kualitas tulisan.
   ========================================================================== */

const DEMO_MENULIS_KEY = 'tt_demo_menulis';

export async function saveMenulisLog(payload) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 350));
    const list = JSON.parse(localStorage.getItem(DEMO_MENULIS_KEY) || '[]');
    const record = { id: 'demo-' + Date.now(), ...payload, createdAt: new Date().toISOString() };
    list.unshift(record);
    localStorage.setItem(DEMO_MENULIS_KEY, JSON.stringify(list));
    return record;
  }
  const { db, fsMod, auth } = window.__fb;
  const docRef = await fsMod.addDoc(fsMod.collection(db, 'menulis_log'), {
    ...payload,
    createdBy: auth.currentUser?.uid || null,
    createdAt: fsMod.serverTimestamp(),
  });
  return { id: docRef.id, ...payload };
}

/** Riwayat catatan menulis seorang siswa, terbaru dulu. */
/** Riwayat catatan menulis seorang siswa, terbaru dulu. `kelas` wajib diisi. */
export async function getMenulisLog(siswaId, kelas) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 200));
    const list = JSON.parse(localStorage.getItem(DEMO_MENULIS_KEY) || '[]');
    return list.filter(s => s.siswaId === siswaId);
  }
  const { db, fsMod } = window.__fb;
  const q = fsMod.query(
    fsMod.collection(db, 'menulis_log'),
    fsMod.where('siswaId', '==', siswaId),
    fsMod.where('kelas', '==', kelas),
    fsMod.orderBy('createdAt', 'desc')
  );
  const snap = await fsMod.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Hapus satu catatan menulis (hanya bisa oleh pembuatnya). */
export async function deleteMenulisLog(id) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 250));
    const list = JSON.parse(localStorage.getItem(DEMO_MENULIS_KEY) || '[]');
    localStorage.setItem(DEMO_MENULIS_KEY, JSON.stringify(list.filter(s => s.id !== id)));
    return;
  }
  const { db, fsMod } = window.__fb;
  await fsMod.deleteDoc(fsMod.doc(db, 'menulis_log', id));
}

/** Ubah field-field entri menulis (tanggal, halaman, jilid, catatan). */
export async function updateMenulisLog(id, patch) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 300));
    const list = JSON.parse(localStorage.getItem(DEMO_MENULIS_KEY) || '[]');
    const idx = list.findIndex(s => s.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch };
      localStorage.setItem(DEMO_MENULIS_KEY, JSON.stringify(list));
    }
    return;
  }
  const { db, fsMod } = window.__fb;
  await fsMod.updateDoc(fsMod.doc(db, 'menulis_log', id), patch);
}
