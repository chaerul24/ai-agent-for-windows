import {
  generateSmartAI,
  parseMultiFileOutput,
  fillAllFiles,
  getQuizContext,
  getAllCodeFiles,
  fixCodeAI,
  cleanCode,     // ✅ sekarang valid
  formatCode     // ✅ sekarang valid
} from "./textarea.js";

let isRunning = false;

// ================= UTILS =================
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ================= RESULT =================
async function getResultStatus(page) {
  return await page.evaluate(() => {
    const err = document.querySelector(".alert.alert-danger");
    const ok = document.querySelector(".alert.alert-success");

    if (err) {
      return {
        status: "error",
        message: err.innerText.trim(),
      };
    }

    if (ok) {
      return {
        status: "success",
        message: ok.innerText.trim(),
      };
    }

    return { status: "unknown", message: "" };
  });
}

// ================= CLICK =================
async function clickRunner(page) {
  await page.evaluate(() => {
    document.querySelector("#run1-submit")?.click();
    document.querySelector("#run1-play")?.click();
  });
}

// ================= MAIN =================
export async function handleCodeRunnerAndNext(page, clickNext) {
  if (isRunning) return false;
  isRunning = true;

  try {
    console.log("🧠 AI Smart Solver start...");

    if (!page) throw new Error("page undefined ❌");

    const context = await getQuizContext(page);
    let files = await getAllCodeFiles(page);

    console.log("📄 Context length:", context.length);
    console.log("📁 Total file:", files.length);

    // ===== GENERATE AWAL =====
    let aiText = await generateSmartAI(page);

    // ✅ format hasil AI
    aiText = formatCode(cleanCode(aiText));

    // 🔥 SHOW RAW AI
    console.log("\n🧠 AI RESULT (RAW):");
    console.log("=================================");
    console.log(aiText);
    console.log("=================================\n");

    let filesMap = parseMultiFileOutput(aiText);

    // 🔥 fallback parsing
    if (!Object.keys(filesMap).length) {
      console.log("⚠️ Parse gagal, fallback ke raw AI");
      filesMap = {};
      files.forEach((f) => {
        filesMap[f.filename] = aiText;
      });
    }

    // 🔥 SHOW PARSED
    console.log("📁 AI RESULT (PARSED):");

    for (const [filename, code] of Object.entries(filesMap)) {
      console.log(`\n📄 FILE: ${filename}`);
      console.log("---------------------------------");
      console.log(code.slice(0, 300)); // biar tidak terlalu panjang
    }

    const maxRetry = 3;

    for (let attempt = 1; attempt <= maxRetry; attempt++) {
      console.log(`\n🚀 Attempt ${attempt}`);

      await fillAllFiles(page, filesMap);

      await delay(1000);

      console.log("📤 Submit...");
      await clickRunner(page);

      await delay(2500);

      console.log("▶️ Run...");
      await clickRunner(page);

      await delay(3000);

      const result = await getResultStatus(page);

      console.log("📊 Status:", result.status);

      // ================= SUCCESS =================
      if (result.status === "success") {
        console.log("✅ LULUS 🎉");
        break;
      }

      // ================= UNKNOWN =================
      if (result.status === "unknown") {
        console.log("⚠️ Status unknown (mungkin belum render)");

        if (attempt === 1) {
          console.log("🔁 Retry tanpa fix...");
          continue;
        }

        console.log("🧠 Paksa AI refine...");
      }

      // ================= ERROR =================
      if (result.status === "error") {
        console.log("❌ Error:");
        console.log(result.message);
      }

      if (attempt === maxRetry) {
        console.log("⛔ Mentok, lanjut next...");
        break;
      }

      // ================= FIX =================
      console.log("🧠 AI memperbaiki...");

      files = await getAllCodeFiles(page);

      const fixed = await fixCodeAI(
        context,
        files,
        result.message || "unknown error",
      );

      // 🔥 SHOW FIX RESULT
      console.log("\n🧠 AI FIX RESULT:");
      console.log("=================================");
      console.log(fixed);
      console.log("=================================\n");

      const parsed = parseMultiFileOutput(fixed);

      if (Object.keys(parsed).length) {
        filesMap = parsed;
      } else {
        console.log("⚠️ Fix parse gagal, pakai raw");
        filesMap = {};
        files.forEach((f) => {
          filesMap[f.filename] = fixed;
        });
      }
    }

    console.log("➡️ Next...");
    await clickNext();

    return true;
  } catch (err) {
    console.log("❌ ERROR:", err.message);
    return false;
  } finally {
    isRunning = false;
  }
}

// ================= OPTIONAL =================
export async function logWarning(page) {
  const exists = await page.$(".alert.alert-warning");
  if (!exists) return;

  const text = await page.evaluate(() => {
    return document.querySelector(".alert.alert-warning")?.innerText;
  });

  console.log("⚠️ WARNING:", text);
}
