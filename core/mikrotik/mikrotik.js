import { streamGemini } from "../config.js";

// ================= UTILS =================
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ================= DETECT =================
export async function isMikrotikExam(page) {
  return await page.$("#cert_test_form");
}

// ================= GET ALL QUESTIONS =================
export async function getAllQuestions(page) {
  return await page.evaluate(() => {
    const questions = [];

    const qBlocks = document.querySelectorAll("td.question");

    qBlocks.forEach((qEl, index) => {
      const questionText = qEl.innerText.trim();

      const parentRow = qEl.closest("tr");
      const nextRow = parentRow?.nextElementSibling;

      const answers = [];

      // ===== CHECKBOX / RADIO =====
      const inputs = nextRow?.querySelectorAll("input");

      inputs?.forEach((input, i) => {
        const label = nextRow.querySelector(`label[for="${input.id}"]`);
        const text = label?.innerText.trim();

        if (text) {
          answers.push({
            index: i,
            id: input.id,
            name: input.name,
            type: input.type,
            text,
          });
        }
      });

      // ===== SELECT =====
      const select = nextRow?.querySelector("select");
      let selectOptions = [];

      if (select) {
        selectOptions = Array.from(select.options)
          .filter(o => o.value)
          .map((o, i) => ({
            index: i,
            value: o.value,
            text: o.innerText,
          }));
      }

      questions.push({
        index,
        question: questionText,
        answers,
        selectOptions,
      });
    });

    return questions;
  });
}

// ================= PRINT =================
function printQuestion(q) {
  console.log(`\n📘 Soal ${q.index + 1}`);
  console.log(q.question);

  if (q.answers.length) {
    console.log("\n📌 Pilihan:");
    q.answers.forEach((a, i) => {
      console.log(`${i + 1}. ${a.text}`);
    });
  }

  if (q.selectOptions.length) {
    console.log("\n📌 Pilihan (Select):");
    q.selectOptions.forEach((a, i) => {
      console.log(`${i + 1}. ${a.text}`);
    });
  }
}

// ================= AI =================
async function askAI(q) {
  const optionsText = q.answers.length
    ? q.answers.map((a, i) => `${i + 1}. ${a.text}`).join("\n")
    : q.selectOptions.map((a, i) => `${i + 1}. ${a.text}`).join("\n");

  const prompt = `
Jawab soal berikut.

Jika multiple choice → bisa lebih dari satu (pisahkan dengan koma)
Jika single → satu angka saja

Contoh:
1
atau
1,3

Soal:
${q.question}

Pilihan:
${optionsText}
`;

  let full = "";

  for await (const chunk of streamGemini(prompt)) {
    process.stdout.write(chunk);
    full += chunk;
  }

  console.log("\n");

  const matches = full.match(/\d+/g);

  if (!matches) return [0];

  return matches.map(n => parseInt(n) - 1);
}

// ================= APPLY =================
async function applyAnswer(page, qIndex, selectedIndexes) {
  await page.evaluate((qIndex, selectedIndexes) => {
    const qBlocks = document.querySelectorAll("td.question");
    const qEl = qBlocks[qIndex];

    if (!qEl) return;

    const row = qEl.closest("tr");
    const next = row.nextElementSibling;

    // ===== INPUT =====
    const inputs = next.querySelectorAll("input");

    if (inputs.length) {
      selectedIndexes.forEach(i => {
        if (inputs[i]) {
          inputs[i].click();
        }
      });
    }

    // ===== SELECT =====
    const select = next.querySelector("select");

    if (select && selectedIndexes[0] != null) {
      const option = select.options[selectedIndexes[0] + 1]; // skip empty
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }, qIndex, selectedIndexes);
}

// ================= MAIN =================
export async function solveMikrotik(page) {
  console.log("🌐 Detected: MikroTik Exam");

  const questions = await getAllQuestions(page);

  if (!questions.length) {
    console.log("❌ Tidak ada soal");
    return false;
  }

  for (const q of questions) {
    printQuestion(q);

    console.log("\n🧠 AI menjawab...\n");

    const indexes = await askAI(q);

    console.log("🤖 Jawaban:", indexes.map(i => i + 1));

    await applyAnswer(page, q.index, indexes);

    await delay(800);
  }

  console.log("\n✅ Semua soal selesai");

  // klik finish
  const finishBtn = await page.$("#finish_button");
  if (finishBtn) {
    console.log("🏁 Klik Finish...");
    await finishBtn.click();
  }

  return true;
}