import { streamGemini } from "../config.js";

// ================= UTILS =================
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ================= SPINNER =================
function startSpinner(text = "🧠 AI berpikir") {
  const frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
  let i = 0;

  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[i++ % frames.length]} ${text}...`);
  }, 100);

  return () => {
    clearInterval(interval);
    process.stdout.write("\r");
  };
}

// ================= DETECT =================
export async function isDragDrop(page) {
  return await page.$(".dcd-dragndrop-into-text__question");
}

// ================= GET DATA =================
export async function getDragDropData(page) {
  return await page.evaluate(() => {
    const questionEl = document.querySelector(
      ".dcd-dragndrop-into-text__question"
    );

    const question = questionEl?.innerText || "";

    const choices = Array.from(
      document.querySelectorAll(
        ".dcd-dragndrop-into-text__answer-draggable-content"
      )
    ).map(el => ({
      id: el.dataset.answerId,
      text: el.innerText.trim(),
    }));

    const slots = Array.from(
      document.querySelectorAll(".dcd-dragndrop-into-text__answer-box")
    ).map((_, i) => i);

    return { question, choices, slots };
  });
}

// ================= PRINT =================
export function printDragQuestion(data) {
  console.log("\n🧩 DRAG & DROP SOAL:");
  console.log(data.question);

  console.log("\n📌 PILIHAN:");
  data.choices.forEach((c, i) => {
    console.log(`${i + 1}. ${c.text}`);
  });

  console.log("");
}

// ================= AI =================
export async function askAIDragDrop(data) {
  const { question, choices } = data;

  const choiceText = choices
    .map((c, i) => `${i + 1}. ${c.text}`)
    .join("\n");

  const prompt = `
Jawab soal berikut.

WAJIB format:
1=?
2=?

Contoh:
1=1
2=2

Soal:
${question}

Pilihan:
${choiceText}
`;

  let full = "";
  const stopSpinner = startSpinner();

  for await (const chunk of streamGemini(prompt)) {
    full += chunk;
  }

  stopSpinner();
  console.log("🧠 RAW AI:", full);

  // ===== PARSE =====
  const matches = [...full.matchAll(/(\d+)\s*=\s*(\d+)/g)];

  let mapping = matches
    .map(m => ({
      slot: parseInt(m[1]) - 1,
      choice: parseInt(m[2]) - 1,
    }))
    .filter(m => m.choice >= 0 && m.choice < choices.length);

  // fallback kalau kosong
  if (mapping.length === 0) {
    console.log("⚠️ Parsing gagal → fallback default");
    mapping = choices.map((_, i) => ({
      slot: i,
      choice: i,
    }));
  }

  return mapping;
}

// ================= HARDCORE DRAG =================
async function realDragAndDrop(page, mapping) {
  const draggables = await page.$$(
    ".dcd-dragndrop-into-text__answer-draggable-content"
  );

  const slots = await page.$$(
    ".dcd-dragndrop-into-text__answer-box"
  );

  for (const { slot, choice } of mapping) {
    const source = draggables[choice];
    const target = slots[slot];

    if (!source || !target) continue;

    await source.evaluate(el => el.scrollIntoView());
    await target.evaluate(el => el.scrollIntoView());

    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();

    if (!sourceBox || !targetBox) continue;

    const startX = sourceBox.x + sourceBox.width / 2;
    const startY = sourceBox.y + sourceBox.height / 2;

    const endX = targetBox.x + targetBox.width / 2;
    const endY = targetBox.y + targetBox.height / 2;

    console.log(`🖱 Drag ${choice} → slot ${slot}`);

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 25 });
    await page.mouse.up();

    await delay(700);
  }
}

// ================= FALLBACK =================
async function fallbackApply(page, mapping) {
  console.log("⚠️ Fallback: set value langsung");

  await page.evaluate((mapping) => {
    const draggables = Array.from(
      document.querySelectorAll(
        ".dcd-dragndrop-into-text__answer-draggable-content"
      )
    );

    const inputs = document.querySelectorAll(
      "input[name='answer_ids[]']"
    );

    const boxes = document.querySelectorAll(
      ".dcd-dragndrop-into-text__answer-box"
    );

    mapping.forEach(({ slot, choice }) => {
      const el = draggables[choice];
      if (!el || !inputs[slot]) return;

      inputs[slot].value = el.dataset.answerId;

      if (boxes[slot]) {
        boxes[slot].innerText = el.innerText;
      }

      inputs[slot].dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, mapping);
}

// ================= MAIN =================
export async function solveDragDrop(page) {
  console.log("🧩 Detected: Drag & Drop");

  const data = await getDragDropData(page);

  if (!data || data.choices.length === 0) {
    console.log("❌ Data tidak valid");
    return false;
  }

  printDragQuestion(data);

  const mapping = await askAIDragDrop(data);

  console.log("🤖 Mapping:", mapping);

  // ================= TRY HARDCORE =================
  try {
    await realDragAndDrop(page, mapping);

    // cek apakah berhasil
    await delay(1000);

    const stillEmpty = await page.$(
      ".dcd-dragndrop-into-text__answer-box:empty"
    );

    if (stillEmpty) {
      throw new Error("Drag gagal");
    }

    console.log("✅ Drag berhasil");
  } catch (err) {
    console.log("⚠️ Drag gagal → fallback");
    await fallbackApply(page, mapping);
  }

  await delay(1500);
  return true;
}