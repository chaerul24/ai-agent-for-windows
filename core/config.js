import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";

const MODEL = "models/gemini-2.5-flash-lite";

let currentKey = null;
let waitingForChange = false;

// ================= LOAD ENV =================
function loadKey() {
  dotenv.config({ override: true });
  return process.env.GOOGLE_API_KEY;
}

// ================= WAIT ENV CHANGE =================
function waitForEnvChange() {
  return new Promise((resolve) => {
    console.log("⏸ Menunggu perubahan .env (ganti API key)...");

    const watcher = fs.watch(".env", () => {
      console.log("🔄 .env berubah, reload key...");
      watcher.close();
      resolve();
    });
  });
}

// ================= MAIN =================
export async function* streamGemini(prompt) {
  let attempt = 0;
  const maxRetry = 10;

  while (attempt < maxRetry) {
    const API_KEY = loadKey();

    if (!API_KEY) {
      throw new Error("❌ GOOGLE_API_KEY belum diset");
    }

    const url = `https://generativelanguage.googleapis.com/v1/${MODEL}:generateContent?key=${API_KEY}`;

    let res;

    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });
    } catch (err) {
      console.log("🌐 Network error");
      attempt++;
      continue;
    }

    // ================= ERROR =================
    if (!res.ok) {
      let errData = null;

      try {
        errData = await res.json();
      } catch {}

      console.error("🚨 Gemini Error:", JSON.stringify(errData, null, 2));

      // 🔥 kalau kena limit → tunggu .env berubah
      if (res.status === 429) {
        await waitForEnvChange();
        continue;
      }

      attempt++;
      continue;
    }

    // ================= SUCCESS =================
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("❌ Gagal parsing JSON");
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join("") || "";

    if (!text) {
      throw new Error("⚠️ Response kosong");
    }

    // ================= STREAM =================
    const chunks = text.match(/.{1,20}/g) || [];

    for (const chunk of chunks) {
      yield chunk;
    }

    return;
  }

  throw new Error("❌ Gagal setelah retry");
}