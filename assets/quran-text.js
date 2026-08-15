/**
 * quran-text.js — Ambil teks Arab per-ayat dari API publik equran.id,
 * dengan cache di sessionStorage supaya surah yang sama tidak diunduh
 * berulang kali dalam satu sesi guru menilai banyak siswa.
 *
 * Dipakai oleh fitur "Baca & Tandai" di input-setoran.html.
 */

const API_BASE = 'https://equran.id/api/v2/surat';
const CACHE_PREFIX = 'tt_quran_text_';

/**
 * @param {number} nomorSurah 1-114
 * @returns {Promise<{nomorAyat:number, teksArab:string}[]>}
 */
export async function fetchSurahText(nomorSurah) {
  const cacheKey = CACHE_PREFIX + nomorSurah;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch { /* lanjut fetch ulang */ }
  }

  const res = await fetch(`${API_BASE}/${nomorSurah}`);
  if (!res.ok) throw new Error(`Gagal mengambil teks surah (HTTP ${res.status})`);
  const json = await res.json();

  const ayatList = json?.data?.ayat;
  if (!Array.isArray(ayatList)) throw new Error('Format respons API tidak dikenali.');

  const simplified = ayatList.map(a => ({
    nomorAyat: a.nomorAyat,
    teksArab: a.teksArab,
  }));

  try { sessionStorage.setItem(cacheKey, JSON.stringify(simplified)); } catch { /* penuh, abaikan */ }
  return simplified;
}
