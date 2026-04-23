import { streamGemini } from "../config.js";
import { handleCaptcha } from "./captcha.js";
import { solveDragDrop, isDragDrop } from "./drag.js";
// ================= UTILS =================
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ================= SPINNER =================
function startSpinner(text = "🧠 AI berpikir") {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;

  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[i++ % frames.length]} ${text}...`);
  }, 100);

  return () => {
    clearInterval(interval);
    process.stdout.write("\r");
  };
}
// ================= AMBIL LIST SOAL =================
async function getQuestionList(page) {
  return await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll(".exam-indicator-questions__item"),
    ).map((el) => ({
      number: parseInt(el.innerText.trim(), 10),
      url: el.href,
    }));
  });
}

// ================= PINDAH SOAL =================
async function goToQuestion(page, url) {
  console.log("🌐 Buka soal:", url);

  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  await delay(2000);
}

// ================= AMBIL SOAL + OPSI =================
async function getQuestionAndOptions(page) {
  return await page.evaluate(() => {
    const form = document.querySelector("#form-answering-exam-question");
    if (!form) return null;

    let questionText = "";
    const q =
      document.querySelector(".dcd-multiple-choice__question") ||
      form.previousElementSibling;

    if (q) questionText = q.innerText.trim();

    const options = [];
    const inputs = form.querySelectorAll("input[name='answer_ids[]']");

    inputs.forEach((input, index) => {
      const label = form.querySelector(`label[for="${input.id}"]`);

      const text = label?.innerText?.trim() || "";
      const img = label?.querySelector("img")?.src || null;

      options.push({
        index,
        text,
        img,
      });
    });

    return { question: questionText, options };
  });
}
async function waitUntilCaptchaGone(page) {
  console.log("\n🛑 CAPTCHA terdeteksi → STOP proses");

  for (let i = 0; i < 120; i++) {
    await delay(2000);

    const verify = await page.$("#amzn-captcha-verify-button");
    const grid = await page.$("canvas button");

    if (!verify && !grid) {
      console.log("✅ CAPTCHA selesai → lanjut proses\n");
      return true;
    }
  }

  console.log("❌ CAPTCHA tidak diselesaikan (timeout)");
  return false;
}
// ================= PRINT KE CLI =================
function printQuestionCLI(data) {
  console.log("\n📖 SOAL:");
  console.log(data.question || "(tidak ada teks)");

  console.log("\n📌 PILIHAN:");
  data.options.forEach((opt, i) => {
    if (opt.img) {
      console.log(`${i + 1}. [GAMBAR] ${opt.img}`);
    } else {
      console.log(`${i + 1}. ${opt.text}`);
    }
  });
  console.log("");
}

// ================= AI =================
async function askAI(data) {
  const { question, options } = data;

  const optionsText = options
    .map((opt, i) => `${i + 1}. ${opt.text}`)
    .join("\n");

  const prompt = `
Jawab soal berikut.

Jika soal meminta lebih dari satu jawaban (misal: pilih dua),
maka jawab dengan format: 1,3

Jika satu jawaban: cukup satu angka.

Soal:
${question}

Pilihan:
${optionsText}
`;

  let full = "";
  const stopSpinner = startSpinner();

  for await (const chunk of streamGemini(prompt)) {
    full += chunk;
  }

  stopSpinner();
  console.log("✅ AI selesai");

  // 🔥 ambil semua angka
  const matches = full.match(/\d+/g);

  if (!matches) return [0];

  return matches.map((n) => parseInt(n) - 1);
}

// ================= KLIK =================
async function clickByIndex(page, index) {
  return await page.evaluate((index) => {
    const inputs = Array.from(
      document.querySelectorAll("input[name='answer_ids[]']"),
    );

    if (!inputs[index]) return false;

    inputs[index].click();
    return true;
  }, index);
}
async function clickMultiple(page, indexes) {
  return await page.evaluate((indexes) => {
    const inputs = Array.from(
      document.querySelectorAll("input[name='answer_ids[]']"),
    );

    indexes.forEach((i) => {
      const input = inputs[i];
      if (!input) return;

      const label = document.querySelector(`label[for="${input.id}"]`);

      if (label) {
        label.click();
      } else {
        input.click();
      }

      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    return true;
  }, indexes);
}
// ================= SOLVE 1 =================
export async function solveOne(page) {
  // cek captcha dulu
  const verify = await page.$("#amzn-captcha-verify-button");
  const grid = await page.$("canvas button");

  if (verify || grid) {
    await waitUntilCaptchaGone(page);
  }
  if (await isDragDrop(page)) {
    return await solveDragDrop(page);
  }
  const data = await getQuestionAndOptions(page);

  if (!data || data.options.length === 0) {
    console.log("❌ Soal tidak ditemukan");
    return false;
  }

  // 🔥 tampilkan soal di CLI
  printQuestionCLI(data);

  const indexes = await askAI(data);

  console.log("🤖 Jawaban dipilih:", indexes.map((i) => i + 1).join(", "));

  let success = await clickMultiple(page, indexes);

  if (!success) {
    console.log("⚠️ fallback klik opsi 1");
    await clickMultiple(page, [0]);
  }

  await delay(1500);
  return true;
}

// ================= END EXAM =================
export async function endExam(page) {
  try {
    console.log("\n🏁 Menyelesaikan ujian...");

    // ================= 1. KLIK SELESAIKAN =================
    const finishBtn = await page.$("button[data-target='exam.endExamBtn']");

    if (!finishBtn) {
      console.log("❌ Tombol Selesaikan tidak ditemukan");
      return false;
    }

    await finishBtn.click();
    console.log("✅ Klik Selesaikan");

    // ================= 2. TUNGGU MODAL =================
    await page
      .waitForSelector("button[type='submit']", {
        timeout: 5000,
      })
      .catch(() => {});

    await delay(1000);

    // ================= 3. KLIK AKHIRI UJIAN =================
    const endBtn = await page.evaluateHandle(() => {
      return [...document.querySelectorAll("button[type='submit']")].find(
        (el) =>
          el.innerText.toLowerCase().includes("akhiri") ||
          el.innerText.toLowerCase().includes("ujian"),
      );
    });

    if (endBtn) {
      console.log("📨 Klik Akhiri Ujian...");

      await Promise.all([
        endBtn.click(),
        page
          .waitForNavigation({
            waitUntil: "domcontentloaded",
            timeout: 15000,
          })
          .catch(() => {}),
      ]);
    } else {
      console.log("⚠️ Tombol Akhiri tidak ditemukan");
    }

    // ================= 4. TUNGGU HASIL =================
    await delay(3000);

    // ================= 5. KLIK CLOSE RESULT =================
    const closeBtn = await page.$("#close-exam-result");

    if (closeBtn) {
      await closeBtn.click();
      console.log("❎ Tutup hasil ujian");
    } else {
      console.log("⚠️ Tombol close tidak ditemukan");
    }

    console.log("🎉 Flow ujian selesai total!");
    return true;
  } catch (err) {
    console.log("❌ ERROR endExam:", err.message);
    return false;
  }
}

// ================= MAIN =================
export async function solveAllQuestions(page) {
  console.log("\n📋 Ambil daftar soal...\n");

  const list = await getQuestionList(page);

  console.log("📊 Total soal:", list.length);

  for (const item of list) {
    // 🔥 STOP kalau captcha
    const verify = await page.$("#amzn-captcha-verify-button");
    const grid = await page.$("canvas button");

    if (verify || grid) {
      await waitUntilCaptchaGone(page);
    }
    console.log(`\n📘 Soal ${item.number}`);

    await goToQuestion(page, item.url);

    const solved = await solveOne(page);

    if (!solved) {
      console.log("⚠️ skip soal");
    }

    await delay(2000);
  }

  console.log("\n🟢 Semua soal selesai");

  await endExam(page);
}
