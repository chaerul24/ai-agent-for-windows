import fetch from "node-fetch";
import { streamGemini } from "./config.js";

// ================= FETCH PAGE =================
export async function fetchPageText(url) {
  console.log("🌐 Mengambil konten:", url);

  try {
    const res = await fetch(url);
    const html = await res.text();

    // bersihkan HTML
    const clean = html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return clean.slice(0, 10000); // limit biar ga berat
  } catch (err) {
    console.log("❌ Gagal fetch halaman:", err.message);
    return "";
  }
}

// ================= SOLVE QUESTION =================
export async function solveQuestionFromText(text) {
  console.log("🧠 AI menganalisis soal...\n");

  const prompt = `
Kamu adalah AI ahli mengerjakan soal.

Teks:
${text}

Tugas:
1. Identifikasi soal utama
2. Identifikasi pilihan jawaban (A, B, C, D, dll jika ada)
3. Pilih jawaban yang paling benar
4. Berikan alasan singkat

Format output:
Jawaban: ...
Alasan: ...
`;

  let result = "";

  for await (const chunk of streamGemini(prompt)) {
    process.stdout.write(chunk);
    result += chunk;
  }

  console.log("\n");

  return result.trim();
}

// ================= MAIN FUNCTION =================
export async function solveFromLink(url) {
  const text = await fetchPageText(url);

  if (!text) {
    console.log("❌ Tidak bisa membaca halaman");
    return;
  }

  return await solveQuestionFromText(text);
}