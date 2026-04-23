import { handleCaptcha } from "./captcha.js";
import { solveAllQuestions } from "./soal.js";
import { handleCodeRunnerAndNext } from "./warning.js";

// ================= UTILS =================
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ================= CAPTCHA SAFE WAIT =================
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

          if (!stillVerify && !stillGrid) return true;
        }
      })(),
    ]);

    console.log("✅ CAPTCHA selesai");

    await page.waitForSelector("body", { timeout: 10000 });
    await delay(2000);

    return true;
  } catch (err) {
    console.log("❌ CAPTCHA timeout:", err.message);
    return false;
  }
}

// ================= CAPTCHA GUARD =================
async function captchaGuard(page) {
  try {
    const verifyBtn = await page.$("#amzn-captcha-verify-button");
    const gridBtn = await page.$("canvas button");

    if (verifyBtn || gridBtn) {
      console.log("\n🛑 CAPTCHA!");
      console.log("👉 Selesaikan manual...");
      await waitCaptchaSolved(page);
    }
  } catch {
    await delay(3000);
  }
}

// ================= NEXT =================
export async function clickNextTutorial(page) {
  await captchaGuard(page);

  const btn = await page.$(".js-btn-next-tutorial");
  if (!btn) return false;

  try {
    await Promise.all([
      btn.click(),
      page
        .waitForNavigation({
          waitUntil: "domcontentloaded",
          timeout: 5000,
        })
        .catch(() => {}),
    ]);
  } catch {}

  return true;
}

// ================= HANDLE START EXAM =================
export async function handleStartExam(page) {
  await captchaGuard(page);

  const startBtn = await page.$("#button-start-exam");
  if (!startBtn) return false;

  const disabled = await page
    .$eval("#button-start-exam", (el) => el.disabled)
    .catch(() => true);

  if (disabled) return false;

  console.log("🚀 Mulai exam");

  await startBtn.click();

  await page
    .waitForSelector("button[type='submit']", { timeout: 5000 })
    .catch(() => {});

  await delay(1000);

  const lanjutBtn = await page.evaluateHandle(() => {
    return [...document.querySelectorAll("button[type='submit']")].find((el) =>
      el.innerText.toLowerCase().includes("lanjut")
    );
  });

  if (lanjutBtn) {
    console.log("> Klik lanjut exam");

    await Promise.all([
      lanjutBtn.click(),
      page
        .waitForNavigation({
          waitUntil: "domcontentloaded",
          timeout: 5000,
        })
        .catch(() => {}),
    ]);
  }

  return true;
}

// ================= NAVIGATE (FINAL FIXED) =================
export async function navigateDicoding(page, max = 30) {
  for (let i = 0; i < max; i++) {
    await captchaGuard(page);

    console.log(`\n🔄 LOOP ${i + 1}`);

    // ================= 1. PRIORITAS: EXAM =================
    console.log("🔍 cek exam...");
    const started = await handleStartExam(page);

    if (started) {
      console.log("🧠 Mode exam");

      await delay(2000);

      console.log("🔥 solveAllQuestions dipanggil");
      await solveAllQuestions(page);

      console.log("🏁 Exam selesai");

      await delay(3000);
      continue;
    }

    // ================= 2. CODERUNNER =================
    console.log("🔍 cek coderunner...");

    // 🔥 VALIDASI: harus ada textarea
    const hasTextarea = await page.$("textarea");

    if (hasTextarea) {
      const handled = await handleCodeRunnerAndNext(page, async () => {
        await clickNextTutorial(page);
      });

      if (handled) {
        console.log("💻 Coderunner selesai → lanjut loop\n");
        await delay(2000);
        continue;
      }
    } else {
      console.log("⚠️ Bukan coderunner");
    }

    // ================= 3. NEXT =================
    const exists = await page.$(".js-btn-next-tutorial");

    if (!exists) {
      console.log("✅ Tidak ada next lagi");
      return "DONE";
    }

    console.log(`➡️ Klik next (${i + 1})`);

    await clickNextTutorial(page);
    await delay(2500);
  }

  console.log("⚠️ Limit tercapai");
  return "LIMIT";
}

// ================= SOLVE =================
export async function solveDicodingPage(page) {
  console.log("\n🧠 Mulai auto solve...\n");

  await captchaGuard(page);

  console.log("🔥 solveAllQuestions dipanggil");
  await solveAllQuestions(page);

  console.log("\n🟢 Semua soal selesai");
}