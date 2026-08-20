/**
 * firebase.js — Inisialisasi Firebase, dipakai bersama oleh seluruh modul
 * (Tahsin-Tahfizh & Akademik & Rapor)
 * SD Muhammadiyah 01 Kukusan
 *
 * PENTING: Ganti firebaseConfig di bawah dengan config asli dari
 * Firebase Console (Project Settings > Your apps > Web app).
 *
 * Selama firebaseConfig masih placeholder, modul ini otomatis berjalan
 * dalam DEMO_MODE: login/simpan data disimulasikan secara lokal supaya
 * tampilan & alur bisa dites tanpa backend nyata. Begitu config asli
 * dipasang, DEMO_MODE otomatis nonaktif dan semua panggilan memakai
 * Firebase Auth + Firestore sungguhan — tidak perlu ubah kode halaman.
 */

// ── GANTI BLOK INI DENGAN CONFIG ASLI DARI FIREBASE CONSOLE ──────────────
const firebaseConfig = {
  apiKey: "AIzaSyA52_m-tU18t2ULV268v7j3X8HDkWVBGi0",
  authDomain: "sdm01-penilaianv2.firebaseapp.com",
  projectId: "sdm01-penilaianv2",
  storageBucket: "sdm01-penilaianv2.firebasestorage.app",
  messagingSenderId: "437694245628",
  appId: "1:437694245628:web:14d0fc8350f59be0364579",
};
// ───────────────────────────────────────────────────────────────────────

export const DEMO_MODE = firebaseConfig.apiKey.startsWith('TODO');

let app = null, auth = null, db = null;

if (!DEMO_MODE) {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
  const authMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  const fsMod   = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

  app  = initializeApp(firebaseConfig);
  auth = authMod.getAuth(app);
  db   = fsMod.getFirestore(app);

  // Re-export fungsi Auth & Firestore yang dipakai halaman-halaman lain
  window.__fb = { app, auth, db, authMod, fsMod };
} else {
  console.warn(
    '%c[Tahsin-Tahfizh v2] DEMO_MODE aktif — firebaseConfig belum diisi.\n' +
    'Login & penyimpanan data disimulasikan secara lokal (localStorage).\n' +
    'Isi assets/firebase.js dengan config Firebase asli untuk mode produksi.',
    'color:#c9882a;font-weight:bold;'
  );
}

export { app, auth, db };

/* ==========================================================================
   Lapisan Auth — dipakai oleh login.html
   Menyediakan antarmuka yang sama baik DEMO_MODE aktif maupun tidak,
   supaya halaman tidak perlu tahu bedanya.
   ========================================================================== */

const DEMO_USERS_KEY = 'tt_demo_users';
const DEMO_SESSION_KEY = 'tt_demo_session';

function _demoSeedUsers() {
  if (localStorage.getItem(DEMO_USERS_KEY)) return;
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify([
    { email: 'guru.tahsin@sdm01kukusan.sch.id', password: 'tahsin123', nama: 'Ustadzah Fitri Handayani', role: 'guru_tahsin_tahfizh', kelasAmpu: ['3A','3B','3C','4A','4B'] },
    { email: 'guru.akademik@sdm01kukusan.sch.id', password: 'akademik123', nama: 'Bapak Rudi Hartono', role: 'guru_akademik', waliKelas: ['4A'], penugasan: [
      { kelas: '4A', mapel: 'Matematika' },
      { kelas: '4B', mapel: 'Matematika' },
      { kelas: '4A', mapel: 'IPAS' },
    ] },
    { email: 'admin@sdm01kukusan.sch.id',       password: 'admin123',  nama: 'Admin Tahsin-Tahfizh',    role: 'admin', kelasAmpu: [] },
    { email: 'ortu@contoh.com',                 password: 'ortu123',   nama: 'Bapak Contoh',            role: 'orangtua', status: 'approved', anakIds: ['s1'] },
  ]));
}

/**
 * Login dengan email + password.
 * @returns {Promise<{uid:string, email:string, nama:string, role:string, kelasAmpu:string[], penugasan:Array<{kelas:string,mapel:string}>}>}
 */
export async function login(email, password, rememberMe) {
  if (DEMO_MODE) {
    _demoSeedUsers();
    await new Promise(r => setTimeout(r, 550)); // simulasi latensi jaringan
    const users = JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]');
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) {
      const err = new Error('demo/invalid-credential');
      err.code = 'demo/invalid-credential';
      throw err;
    }
    const session = { uid: 'demo-' + btoa(found.email), email: found.email, nama: found.nama, role: found.role, kelasAmpu: found.kelasAmpu || [], penugasan: found.penugasan || [], waliKelas: found.waliKelas || [], status: found.status || null, anakIds: found.anakIds || [] };
    const store = rememberMe ? localStorage : sessionStorage;
    store.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
    return session;
  }

  const { authMod, auth } = window.__fb;
  await authMod.setPersistence(
    auth,
    rememberMe ? authMod.browserLocalPersistence : authMod.browserSessionPersistence
  );
  const cred = await authMod.signInWithEmailAndPassword(auth, email, password);

  // Ambil profil (nama, role, kelasAmpu — Tahsin-Tahfizh, penugasan — Akademik)
  // dari koleksi Firestore `users/{uid}`. Satu akun biasanya hanya mengisi
  // salah satu (kelasAmpu ATAU penugasan) sesuai role-nya; keduanya tetap
  // dibawa di sesi supaya halaman modul mana pun tidak perlu tahu bedanya.
  const { db, fsMod } = window.__fb;
  const snap = await fsMod.getDoc(fsMod.doc(db, 'users', cred.user.uid));
  const profile = snap.exists() ? snap.data() : {};

  return {
    uid: cred.user.uid,
    email: cred.user.email,
    nama: profile.nama || cred.user.email,
    role: profile.role || 'guru',
    kelasAmpu: profile.kelasAmpu || [],
    penugasan: profile.penugasan || [],
    waliKelas: profile.waliKelas || [],
    status: profile.status || null,
    anakIds: profile.anakIds || [],
  };
}

/**
 * Daftar mandiri sebagai orang tua. Membuat akun Firebase Auth (self-service,
 * tidak butuh admin) DAN dokumen profil berstatus "pending" — belum bisa
 * lihat data apa pun sampai admin menyetujui lewat halaman Kelola Akun Ortu.
 */
export async function signupOrangtua({ nama, email, password, nomorHp, anakIds }) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 500));
    const users = JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]');
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      const err = new Error('auth/email-already-in-use');
      err.code = 'auth/email-already-in-use';
      throw err;
    }
    users.push({ email, password, nama, role: 'orangtua', status: 'pending', anakIds, nomorHp });
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
    return;
  }
  const { authMod, auth, db, fsMod } = window.__fb;
  const cred = await authMod.createUserWithEmailAndPassword(auth, email, password);
  await fsMod.setDoc(fsMod.doc(db, 'users', cred.user.uid), {
    nama, nomorHp: nomorHp || '', role: 'orangtua', status: 'pending', anakIds,
    createdAt: fsMod.serverTimestamp(),
  });
}

/** Terjemahkan kode error Firebase Auth / demo ke pesan Bahasa Indonesia. */
export function terjemahkanErrorLogin(err) {
  const code = err?.code || '';
  const map = {
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/user-not-found': 'Akun tidak ditemukan. Periksa kembali email Anda.',
    'auth/wrong-password': 'Kata sandi salah. Silakan coba lagi.',
    'auth/invalid-credential': 'Email atau kata sandi salah. Silakan coba lagi.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.',
    'auth/network-request-failed': 'Koneksi bermasalah. Periksa jaringan internet Anda.',
    'demo/invalid-credential': 'Email atau kata sandi salah. Silakan coba lagi.',
  };
  return map[code] || 'Login gagal. Silakan coba lagi.';
}

export function currentSession() {
  if (DEMO_MODE) {
    const raw = localStorage.getItem(DEMO_SESSION_KEY) || sessionStorage.getItem(DEMO_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }
  // Untuk mode produksi, status login sebenarnya dipantau lewat
  // authMod.onAuthStateChanged(auth, ...) di halaman yang membutuhkan.
  return null;
}

/**
 * Pantau status login & dapatkan profil (nama, role) pengguna saat ini.
 * Memanggil `callback(session | null)`. Dipakai di setiap halaman yang
 * mewajibkan login (Input Setoran, Riwayat Siswa, dst).
 */
export function onAuthChange(callback) {
  if (DEMO_MODE) {
    callback(currentSession());
    return () => {};
  }
  const { authMod, auth, db, fsMod } = window.__fb;
  return authMod.onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) { callback(null); return; }
    try {
      const snap = await fsMod.getDoc(fsMod.doc(db, 'users', fbUser.uid));
      const profile = snap.exists() ? snap.data() : {};
      callback({
        uid: fbUser.uid,
        email: fbUser.email,
        nama: profile.nama || fbUser.email,
        role: profile.role || 'guru',
        kelasAmpu: profile.kelasAmpu || [],
        penugasan: profile.penugasan || [],
        waliKelas: profile.waliKelas || [],
        status: profile.status || null,
        anakIds: profile.anakIds || [],
      });
    } catch (err) {
      console.error('Gagal memuat profil pengguna:', err);
      callback({ uid: fbUser.uid, email: fbUser.email, nama: fbUser.email, role: 'guru', kelasAmpu: [], penugasan: [], waliKelas: [], status: null, anakIds: [] });
    }
  });
}

/** Keluar dari sesi (logout). */
export async function logout() {
  if (DEMO_MODE) {
    localStorage.removeItem(DEMO_SESSION_KEY);
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    return;
  }
  const { authMod, auth } = window.__fb;
  await authMod.signOut(auth);
}
