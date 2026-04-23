import { streamGemini } from "../config.js";

// ================= CLEAN =================
export function cleanCode(text) {
  return text
    .replace(/```[\w]*\n?/g, "")
    .replace(/```/g, "")
    .trim();
}

// ================= FORMAT =================
export function formatCode(code) {
  return code
    .replace(/;/g, ";\n")
    .replace(/{/g, "{\n")
    .replace(/}/g, "\n}")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// ================= GET CONTEXT =================
export async function getQuizContext(page) {
  return await page.evaluate(() => {
    const el = document.querySelector("#tutorial-content");
    return el ? el.innerText : "";
  });
}

// ================= GET FILE =================
export async function getAllCodeFiles(page) {
  return await page.evaluate(() => {
    const editors = document.querySelectorAll(".editor");

    return Array.from(editors).map((el, i) => {
      const filename =
        el.getAttribute("data-filename") || `file_${i}.txt`;

      const textarea = el.querySelector("textarea");

      return {
        filename,
        code: textarea ? textarea.value : "",
      };
    });
  });
}

// ================= DETECT LANGUAGE =================
function detectLanguage(context, files) {
  const text = (context || "").toLowerCase();

  if (text.includes("python")) return "python";
  if (text.includes("java")) return "java";
  if (text.includes("c++")) return "cpp";
  if (text.includes("php")) return "php";

  for (const f of files) {
    if (f.filename.endsWith(".py")) return "python";
    if (f.filename.endsWith(".java")) return "java";
    if (f.filename.endsWith(".cpp")) return "cpp";
    if (f.filename.endsWith(".php")) return "php";
  }

  return "javascript";
}

// ================= ANALYZE =================
export async function analyzeQuiz(context) {
  const prompt = `
Analisa soal berikut:

${context}

Balas JSON:
{
  "tujuan": "",
  "task": [],
  "aturan": [],
  "file": []
}
`;

  let full = "";

  for await (const chunk of streamGemini(prompt)) {
    full += chunk;
  }

  try {
    return JSON.parse(full);
  } catch {
    return { raw: full };
  }
}

// ================= DEPENDENCY GRAPH =================
export function buildDependencyGraph(files) {
  const graph = {};

  for (const f of files) {
    const imports = [];
    const exports = [];

    const importRegex = /import\s+.*?from\s+['"](.*?)['"]/g;
    let m;

    while ((m = importRegex.exec(f.code))) {
      imports.push(m[1]);
    }

    const exportRegex = /export\s+(default\s+)?(function|const|class)?\s*([a-zA-Z0-9_]*)/g;

    while ((m = exportRegex.exec(f.code))) {
      exports.push(m[3] || "default");
    }

    graph[f.filename] = { imports, exports };
  }

  return graph;
}

// ================= BUILD PROMPT =================
function buildPrompt(context, files, analysis, lang, graph) {
  return `
Kamu adalah senior programmer ${lang}.

=== DEPENDENCY GRAPH ===
${JSON.stringify(graph, null, 2)}

=== ANALISIS ===
${JSON.stringify(analysis, null, 2)}

=== SOAL ===
${context}

=== FILE ===
${files.map(f => `
FILE: ${f.filename}
${f.code}
`).join("\n")}

=== ATURAN ===
- Perbaiki semua TODO
- Jangan ubah kode yang sudah benar
- Pastikan import/export valid
- Pastikan semua file sinkron
- Jangan ada penjelasan

=== OUTPUT ===
// filename: xxx
<kode>
`;
}

// ================= GENERATE =================
export async function generateSmartAI(page) {
  const context = await getQuizContext(page);
  const files = await getAllCodeFiles(page);

  console.log("📖 Analisa soal...");
  const analysis = await analyzeQuiz(context);

  const lang = detectLanguage(context, files);
  console.log("🌐 Language:", lang);

  const graph = buildDependencyGraph(files);

  const prompt = buildPrompt(context, files, analysis, lang, graph);

  let full = "";

  for await (const chunk of streamGemini(prompt)) {
    full += chunk;
  }

  return cleanCode(full);
}

// ================= FIX =================
export async function fixCodeAI(context, files, errorMsg, testOutput = {}) {
  const prompt = `
Kamu adalah senior programmer.

=== SOAL ===
${context}

=== FILE ===
${files.map(f => `
FILE: ${f.filename}
${f.code}
`).join("\n")}

=== ERROR ===
${errorMsg}

=== OUTPUT ===
${testOutput.output || ""}

=== LOG ===
${testOutput.logs || ""}

TUGAS:
- Analisa kenapa gagal
- Perbaiki logic
- Jangan ubah struktur file

OUTPUT:
// filename: xxx
<kode>
`;

  let full = "";

  for await (const chunk of streamGemini(prompt)) {
    full += chunk;
  }

  return cleanCode(full);
}

// ================= PARSE =================
export function parseMultiFileOutput(text) {
  const files = {};
  const regex = /\/\/ filename:\s*(.+)\n([\s\S]*?)(?=\/\/ filename:|$)/g;

  let match;
  while ((match = regex.exec(text))) {
    files[match[1].trim()] = match[2].trim();
  }

  return files;
}

// ================= FILL =================
export async function fillAllFiles(page, filesMap) {
  await page.evaluate((filesMap) => {
    const editors = document.querySelectorAll(".editor");

    editors.forEach((el) => {
      const filename = el.getAttribute("data-filename");
      const textarea = el.querySelector("textarea");

      if (!filesMap[filename] || !textarea) return;

      const cm = el.querySelector(".CodeMirror");

      if (cm && cm.CodeMirror) {
        cm.CodeMirror.setValue(filesMap[filename]);
      } else {
        textarea.value = filesMap[filename];
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
  }, filesMap);
}