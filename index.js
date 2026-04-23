import "dotenv/config";
import readline from "readline";
import chalk from "chalk";
import path from "path";
import fs from "fs/promises";
function getTime() {
  const now = new Date();

  return now.toLocaleTimeString("id-ID", {
    hour12: false,
  });
}

// override console
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  originalLog(`[${getTime()}]`, ...args);
};

console.error = (...args) => {
  originalError(`[${getTime()}]`, ...args);
};

console.warn = (...args) => {
  originalWarn(`[${getTime()}]`, ...args);
};
import { Agent } from "./core/agent.js";
import { startVoiceLoop } from "./core/voiceInput.js";

const BASE_DIR = path.resolve("./workspace");
const MEMORY_PATH = path.resolve("./memory/memory.json");

let currentDir = BASE_DIR;
let memory = await loadMemory();

const aiAgent = new Agent(currentDir);

// ===== MEMORY =====
async function loadMemory() {
  try {
    const data = await fs.readFile(MEMORY_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveMemory(mem) {
  await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
  await fs.writeFile(MEMORY_PATH, JSON.stringify(mem, null, 2));
}

async function addMemory(entry) {
  memory.push({
    time: new Date().toISOString(),
    ...entry,
  });

  if (memory.length > 100) {
    memory = memory.slice(-100);
  }

  await saveMemory(memory);
}

// ===== CLI =====
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(chalk.green("AI Dev Assistant"));
console.log(chalk.gray("Ketik perintah atau tekan 'v' untuk voice mode\n"));

function getPromptLabel() {
  let relative = path.relative(BASE_DIR, currentDir);
  if (!relative) return "/sandbox";
  return `/sandbox/${relative.replace(/\\/g, "/")}`;
}

// ===== COMMAND HANDLER =====
async function handleCommand(input) {
  const [cmd, ...args] = input.trim().split(" ");

  // ===== NAVIGATION =====
  if (cmd === "/open") {
    if (!args[0]) {
      console.log(chalk.yellow("[WARN] Gunakan: /open nama_folder"));
      return;
    }

    const target = path.resolve(BASE_DIR, args[0]);

    if (!target.startsWith(BASE_DIR)) {
      console.log(chalk.red("[ERROR] Path tidak valid"));
      return;
    }

    try {
      await fs.access(target);
    } catch {
      console.log(chalk.red("[ERROR] Folder tidak ditemukan"));
      return;
    }

    currentDir = target;
    console.log(chalk.green("[INFO] Masuk folder:"));
    console.log(chalk.cyan(currentDir));
    return;
  }

  if (cmd === "/back") {
    if (currentDir === BASE_DIR) {
      console.log(chalk.yellow("[WARN] Sudah di root"));
      return;
    }

    currentDir = path.dirname(currentDir);
    console.log(chalk.green("[INFO] Kembali ke:"));
    console.log(chalk.cyan(currentDir));
    return;
  }

  if (cmd === "/pwd") {
    console.log(chalk.green("[INFO] Lokasi:"));
    console.log(chalk.cyan(currentDir));
    return;
  }

  if (cmd === "/reset") {
    memory = [];
    await saveMemory(memory);
    console.log(chalk.yellow("[INFO] Memory direset"));
    return;
  }

  // ===== EXECUTE AI =====
  try {
    aiAgent.cwd = currentDir;

    await addMemory({ role: "user", content: input });

    await aiAgent.run(input);

    await addMemory({ role: "system", content: `run: ${input}` });
  } catch (err) {
    console.log(chalk.red("[AI ERROR]"), err.message);
  }
}

// ===== LOOP CLI =====
function ask() {
  rl.question(
    chalk.cyan(`[${getPromptLabel()}] > `),
    async (input) => {
      if (input.toLowerCase() === "exit") {
        console.log(chalk.yellow("Bye!"));
        process.exit();
      }

      await handleCommand(input);
      ask();
    }
  );
}

ask();

// ================= VOICE MODE =================

let voiceMode = false;
let stopVoice = null;

// aktifkan raw mode hanya jika TTY
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.on("data", (key) => {
  // toggle voice mode
  if (key === "v") {
    voiceMode = !voiceMode;

    if (voiceMode) {
      console.log("\n🎙️ VOICE MODE ON\n");

      stopVoice = startVoiceLoop(async (text) => {
        console.log("\n🧠 Kamu:", chalk.yellow(text));

        try {
          aiAgent.cwd = currentDir;

          await addMemory({ role: "user", content: text });

          await aiAgent.run(text);

          await addMemory({ role: "system", content: `voice: ${text}` });

        } catch (err) {
          console.log(chalk.red("❌ AI error:"), err.message);
        }

        process.stdout.write(`\n[${getPromptLabel()}] > `);
      });

    } else {
      console.log("\n🔇 Voice mode OFF\n");

      if (stopVoice) stopVoice();
    }
  }

  // CTRL + C
  if (key === "\u0003") {
    console.log("\nBye!");
    process.exit();
  }
});