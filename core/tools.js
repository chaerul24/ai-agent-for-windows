import { exec } from "child_process";
import fetch from "node-fetch";
import { streamGemini } from "./config.js";

// ================= SHELL =================
function run(command) {
  return new Promise((resolve, reject) => {
    exec(command, { shell: true }, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout?.toString().trim());
    });
  });
}

// ================= HELPERS =================
function openCommand(target) {
  if (process.platform === "win32") return `start "" "${target}"`;
  if (process.platform === "darwin") return `open "${target}"`;
  return `xdg-open "${target}"`;
}

// ================= TOOLS =================
export class Tools {
  // ===== OPEN APP =====
  static async openApp(name) {
    console.log("🚀 Membuka aplikasi:", name);
    return run(openCommand(name));
  }

  // ===== OPEN URL =====
  static async openURL(url) {
    console.log("🌐 Membuka:", url);
    return run(openCommand(url));
  }

  // ===== GET YOUTUBE RESULTS (STABLE PARSE) =====
  static async getYoutubeResults(query) {
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const html = await res.text();

      const ids = [
        ...new Set([...html.matchAll(/"videoId":"(.*?)"/g)].map((m) => m[1])),
      ].slice(0, 5);

      const titles = [
        ...html.matchAll(/"title":{"runs":\[\{"text":"(.*?)"\}\]/g),
      ]
        .map((m) => m[1])
        .filter((t) => t.length < 100)
        .slice(0, 5);

      return ids.map((id, i) => ({
        title: titles[i] || "Unknown",
        url: `https://www.youtube.com/watch?v=${id}`,
      }));
    } catch (err) {
      console.log("⚠️ Gagal ambil YouTube:", err.message);
      return [];
    }
  }

  // ===== AI RECOMMENDATION =====
  static async recommendSongs(query) {
    console.log("🎧 AI mencari rekomendasi untuk:", query);

   const prompt = `
Kamu adalah AI music recommender.

User:
"${query}"

=====================================
TUGAS
=====================================
Berikan TEPAT 10 lagu sesuai query.

=====================================
FORMAT WAJIB
=====================================
- 1 lagu = 1 baris
- Format: Artist - Title
- TANPA nomor
- TANPA bullet
- TANPA penjelasan
- TANPA paragraf
- TANPA teks tambahan

=====================================
CONTOH BENAR
=====================================
Hindia - Secukupnya
Kunto Aji - Rehat
Nadin Amizah - Bertaut

=====================================
ATURAN KERAS
=====================================
- Harus 10 baris (tidak kurang, tidak lebih)
- Setiap lagu HARUS di baris baru
- Dilarang menggabungkan lagu dalam 1 baris
- Dilarang menambahkan teks lain

Jika format salah, output dianggap gagal.

=====================================
OUTPUT
=====================================
`;

    let full = "";

    for await (const chunk of streamGemini(prompt)) {
      full += chunk;
    }

    const songs = full
      .split(/\n|(?=[A-Z][a-z]+ - )/g) // 🔥 magic split
      .map((s) => s.trim())
      .filter((s) => s.includes("-") && s.length < 80)
      .slice(0, 10);

    console.log("\n🎵 Rekomendasi:");
    songs.forEach((s, i) => {
      console.log(`${i + 1}. ${s}`);
    });

    return songs;
  }

  // ===== SEARCH SONG =====
  static async searchSong(query) {
    console.log("🔎 Mencari lagu:", query);

    const results = await this.getYoutubeResults(query);

    if (!results.length) {
      console.log("❌ Tidak ada hasil");
      return [];
    }

    console.log("\n🎵 Hasil:");
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.title}`);
      console.log(`   ${r.url}`);
    });

    return results;
  }

  // ===== PLAY SONG =====
  static async playSong(query) {
    console.log("🎵 Mencari & memutar:", query);

    const results = await this.getYoutubeResults(query);

    if (!results.length) {
      console.log("❌ Lagu tidak ditemukan");
      return;
    }

    // 🔥 filter biar lebih relevan
    const best =
      results.find((r) => /official|audio|mv|video/i.test(r.title)) ||
      results[0];

    console.log("\n▶ Memutar:");
    console.log(best.title);
    console.log(best.url);

    await this.openURL(best.url);

    return best;
  }

  // ===== RECOMMEND + AUTO PLAY =====
  static async recommendAndPlay(query) {
    const songs = await this.recommendSongs(query);

    if (!songs.length) return;

    console.log("\n▶ Memutar rekomendasi pertama...");
    await this.playSong(songs[0]);
  }
}
