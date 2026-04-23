import chalk from "chalk";
import ora from "ora";
import symbols from "log-symbols";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";

import { streamGemini } from "./config.js";
import { AIParser } from "./aiparser.js";

import { FileManager } from "./filemanager.js";
import { getSystemInfo } from "./systeminfo.js";
import { confirm } from "./confirm.js";
import { Tools } from "./tools.js";
import { solveFromLink } from "./solver.js";
import { solveDicoding } from "./browserSolver.js";
import { solveMikrotikBrowser } from "./browserSolverMikrotik.js";
import { solveMikrotik } from "./mikrotik/mikrotik.js";
import { solveIBM } from "./browserSolverIBM.js";
import { solveGoogle } from "./browserSolverGoogle.js";
import { getBrowser } from "./browserChrome.js";
// ================= SHELL =================
class Shell {
  static exec(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, { ...options, shell: true }, (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message);
        resolve(stdout?.toString().trim());
      });
    });
  }
}

// ================= MEMORY =================
class Memory {
  constructor() {
    this.logs = [];
  }

  add(entry) {
    this.logs.push(entry);
    if (this.logs.length > 40) this.logs.shift();
  }

  get() {
    return this.logs.join("\n");
  }
}

// ================= RULES =================
class Rules {
  static async load(cwd) {
    try {
      return await fs.readFile(path.join(cwd, "aturan.txt"), "utf-8");
    } catch {
      return "No rules";
    }
  }
}

// ================= EXECUTOR =================
class Executor {
  async exec(command, cwd) {
    const spinner = ora(command).start();
    try {
      const out = await Shell.exec(command, { cwd });
      spinner.succeed("done");
      return out || "ok";
    } catch (err) {
      spinner.fail("failed");
      return err.toString();
    }
  }
}

// ================= INTENT DETECTOR =================
function detectIntent(text) {
  text = text.toLowerCase();

  // 🔥 PRIORITAS PALING ATAS
  if (/mikrotik/.test(text) && /https?:\/\//.test(text)) {
    return "SOLVE_MIKROTIK";
  }
  if (/google/.test(text) && /akun|account|login/.test(text)) {
    return "SOLVE_GOOGLE";
  }
  if (/mikrotik/.test(text)) return "SOLVE_MIKROTIK";

  // 🔥 JANGAN tangkap semua URL sembarangan
  if (/dicoding/.test(text)) return "SOLVE_LINK";

  if (/https?:\/\//.test(text)) return "SOLVE_LINK";

  if (/rekomendasi|suggest|saran/.test(text)) return "RECOMMEND";
  if (/putar|play/.test(text)) return "PLAY";
  if (/cari|search/.test(text)) return "SEARCH";
  if (/buka|open/.test(text)) return "OPEN";

  return "CHAT";
}

// ================= AGENT =================
export class Agent {
  constructor(cwd) {
    this.cwd = cwd;
    this.memory = new Memory();
    this.executor = new Executor();
    this.maxSteps = 6;
  }

  // ===== HANDLE STEP =====
  async handleStep(step) {
    switch (step.type) {
      case "message":
        console.log("💬", step.message);
        this.memory.add("AI: " + step.message);
        return step.message;

      case "solve_from_link":
        await solveFromLink(step.url);
        return "__DONE__";

      case "solve_google":
        await solveGoogle();
        return "__DONE__";

      case "solve_dicoding":
        await solveDicoding(step.url);
        return "__DONE__";
      case "solve_ibm":
        await solveIBM(step.url);
        return "__DONE__";

      case "solve_mikrotik":
        const page = await solveMikrotikBrowser(step.url);

        if (page) {
          await solveMikrotik(page);
        }
        return "__DONE__";

      case "play_song":
        console.log("🎵 Memutar:", step.query);
        await Tools.playSong(step.query);
        return "__DONE__";

      case "recommend_song":
        await Tools.recommendSongs(step.query);
        return "__DONE__";

      case "open_url":
        await Tools.openURL(step.url);
        return "__DONE__";

      case "done":
        return "__DONE__";

      default:
        return "unknown";
    }
  }

  // ===== CHAT MODE =====
  async chat(text) {
    const memory = this.memory.get();

    const prompt = `
Kamu adalah AI assistant.

Riwayat:
${memory}

User:
${text}

Jawab natural.
`;

    for await (const chunk of streamGemini(prompt)) {
      process.stdout.write(chunk);
    }

    console.log("\n");
  }

  // ===== THINK =====
  async think(goal) {
    const rules = await Rules.load(this.cwd);
    const memory = this.memory.get();

    const prompt = `
Kamu adalah AI Agent komputer.

RULES:
${rules}

MEMORY:
${memory}

GOAL:
${goal}

WAJIB:
- Output JSON VALID
- Tanpa teks lain

TOOLS:
- message
- play_song
- search_song
- recommend_song
- open_app
- done

Jika rekomendasi lagu:
[
  { "type": "recommend_song", "query": "..." },
  { "type": "done" }
]

Jika user memberikan link soal:
WAJIB gunakan:
{ "type": "solve_from_link", "url": "..." }

Jika link berasal dari dicoding:
gunakan:
{ "type": "solve_dicoding", "url": "..." }
`;

    let full = "";

    for await (const chunk of streamGemini(prompt)) {
      full += chunk;
    }

    return full.trim();
  }

  // ===== RUN =====
  async run(goal) {
    await getBrowser();

    const text = goal.toLowerCase();
    const intent = detectIntent(goal);

    // ===== DETECT URL (🔥 PALING PENTING) =====
    const url = goal.match(/https?:\/\/\S+/)?.[0];
    if (/chrome debug/.test(text)) {
      console.log("🧠 Mode Chrome Debug");

      await this.handleStep({
        type: "solve_chrome",
      });

      console.log("✔ Done");
      return;
    }
    if (url) {
      if (/ibm/.test(url)) {
        console.log("🧠 Mode IBM Solver");

        await this.handleStep({
          type: "solve_ibm",
          url,
        });

        console.log("✔ Done");
        return;
      } else if (/google/.test(url)) {
        console.log("🧠 Mode Google Solver");

        await this.handleStep({
          type: "solve_google",
          url,
        });

        console.log("✔ Done");
        return;
      } else if (/mikrotik/.test(url)) {
        console.log("🧠 Mode Mikrotik Solver");

        await this.handleStep({
          type: "solve_mikrotik",
          url,
        });
      } else if (/dicoding/.test(url)) {
        console.log("🧠 Mode Dicoding Solver");

        await this.handleStep({
          type: "solve_dicoding",
          url,
        });
      } else {
        console.log("🌐 Mode Solve Link");

        await this.handleStep({
          type: "solve_from_link",
          url,
        });
      }

      console.log("✔ Done");
      return;
    }

    // ===== SMART ROUTING =====
    if (intent === "CHAT") {
      process.stdout.write("AI => ");
      await this.chat(goal);
      return;
    }

    if (intent === "SOLVE_GOOGLE") {
      await this.handleStep({
        type: "solve_google",
      });
      console.log("✔ Done");
      return;
    }

    if (intent === "RECOMMEND") {
      await this.handleStep({
        type: "recommend_song",
        query: goal,
      });
      console.log("✔ Done");
      return;
    }

    if (intent === "PLAY") {
      await this.handleStep({
        type: "play_song",
        query: goal,
      });
      console.log("✔ Done");
      return;
    }

    // ===== AGENT MODE =====
    console.log(symbols.info, chalk.green("GOAL:"), goal);

    let lastAction = null;
    let repeatCount = 0;

    for (let i = 0; i < this.maxSteps; i++) {
      console.log(chalk.yellow(`\n--- STEP ${i + 1} ---`));

      const output = await this.think(goal);

      const cleaned = AIParser.clean(output);
      const parsed = AIParser.safeParse(cleaned);

      const validTypes = [
        "message",
        "play_song",
        "search_song",
        "recommend_song",
        "open_app",
        "solve_from_link",
        "solve_dicoding",
        "solve_google",
        "done",
      ];

      const steps = AIParser.normalize(parsed).filter(
        (s) => s && validTypes.includes(s.type),
      );

      if (!steps.length) {
        console.log("⚠️ JSON invalid, retry...");
        continue;
      }

      for (const step of steps) {
        const actionKey = JSON.stringify(step);

        if (actionKey === lastAction) repeatCount++;
        else repeatCount = 0;

        lastAction = actionKey;

        if (repeatCount >= 2) {
          console.log("⚠️ Loop terdeteksi, stop");
          return;
        }

        const result = await this.handleStep(step);

        if (result === "__DONE__") {
          console.log("✔ Done");
          return;
        }
      }
    }

    console.log("⛔ Gagal menyelesaikan goal");
  }
}
