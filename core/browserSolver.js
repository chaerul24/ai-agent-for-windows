
import {
  navigateDicoding,
  solveDicodingPage
} from "./dicoding/dicoding.js";

import { getPage } from "./browserChrome.js"; // 🔥 ini kunci

// ================= UTILS =================
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ================= CAPTCHA DETECT =================
async function detectCaptcha(page) {
  try {
    const verifyBtn = await page.$("#amzn-captcha-verify-button");
    const gridBtn = await page.$("canvas button");

    if (verifyBtn || gridBtn) {
      console.log("\n🛑 ===============================");
      console.log("⚠️  Web perlu CAPTCHA!");
      console.log("👉 Selesaikan manual di browser");
      console.log("🛑 ===============================\n");
      return true;
    }

    return false;
  } catch {
    return true; // kalau context hilang, anggap masih loading/captcha
  }
}

// ================= WAIT CAPTCHA =================
async function waitCaptchaSolved(page) {
  console.log("⏳ Menunggu CAPTCHA selesai...");

  try {
    await Promise.race([
      page.waitForNavigation({
        waitUntil: "domcontentloaded",
        timeout: 120000,
      }),

      (async () => {
        for (let i = 0; i < 120; i++) {
          await delay(2000);

          const stillVerify = await page.$("#amzn-captcha-verify-button");
          const stillGrid = await page.$("canvas button");

          if (!stillVerify && !stillGrid) {
            return true;
          }
        }
      })(),
    ]);

    console.log("✅ CAPTCHA selesai / halaman berubah");

    await page.waitForSelector("body", { timeout: 10000 });
    await delay(2000);

    return true;
  } catch (err) {
    console.log("❌ CAPTCHA timeout:", err.message);
    return false;
  }
}

// ===== HANDLE CTRL+C =====
process.on("SIGINT", () => {
  console.log("\n⛔ Script dihentikan (CTRL+C)");
  console.log("🌐 Browser tetap terbuka...");
});

// ================= MAIN =================
export async function solveDicoding(url) {
  console.log("🧠 START SOLVER");
  console.log("🌐 URL:", url);

  try {
    const page = await getPage();

    console.log("🌐 Membuka halaman...");
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    await delay(4000);

    console.log("📍 Current URL:", page.url());

    // ===== CAPTCHA CHECK =====
    if (await detectCaptcha(page)) {
      await waitCaptchaSolved(page);
    }

    // ===== LOGIN CHECK =====
    const isLoginPage = await page.evaluate(() => {
      return !!document.querySelector(".v3-login-cta");
    });

    if (isLoginPage) {
      console.log("🔒 Belum login Dicoding!");
      console.log("👉 Silakan login manual di browser...");
      return;
    }

    // ===== NAVIGASI =====
    console.log("\n🚀 Navigasi materi...");
    const navResult = await navigateDicoding(page);

    console.log("📌 Status navigasi:", navResult);

    // ===== CAPTCHA CHECK =====
    if (await detectCaptcha(page)) {
      await waitCaptchaSolved(page);
    }

    // ===== PROGRESS =====
    await showProgress(page);

    // ===== CAPTCHA CHECK =====
    if (await detectCaptcha(page)) {
      await waitCaptchaSolved(page);
    }

    // ===== SOLVE =====
    console.log("\n🧠 Mulai solve soal...");
    await solveDicodingPage(page);

    console.log("\n🟢 Selesai, browser tetap aktif...");
  } catch (err) {
    console.log("❌ ERROR:", err.message);
  }
}