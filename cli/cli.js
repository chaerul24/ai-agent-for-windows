import readline from "readline";
import chalk from "chalk";
import path from "path";
import fs from "fs/promises";
import { runAgent } from "../core/runner.js";

class MemoryManager {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {};
  }

  async load() {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      this.data = JSON.parse(raw);
    } catch {
      this.data = {};
    }
  }

  async save() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
  }

  reset() {
    this.data = {};
  }
}

class CLI {
  constructor() {
    this.BASE_DIR = path.resolve("./workspace");
    this.currentDir = this.BASE_DIR;

    this.memory = new MemoryManager(
      path.resolve("./memory/memory.json")
    );

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async init() {
    await this.memory.load();

    console.log(chalk.green("AI Dev Assistant"));
    console.log(chalk.gray("Ketik perintah (exit untuk keluar)\n"));

    this.loop();
  }

  getPromptLabel() {
    let relative = path.relative(this.BASE_DIR, this.currentDir);
    if (!relative) return "/sandbox";
    return `/sandbox/${relative.replace(/\\/g, "/")}`;
  }

  async handleCommand(input) {
    const [cmd, ...args] = input.trim().split(" ");

    if (cmd === "/open") return this.openFolder(args[0]);
    if (cmd === "/back") return this.goBack();

    if (cmd === "/pwd") {
      console.log(chalk.cyan(this.currentDir));
      return;
    }

    if (cmd === "/reset") {
      this.memory.reset();
      await this.memory.save();
      console.log(chalk.yellow("Memory direset"));
      return;
    }

    const result = await runAgent(input, this.currentDir, this.memory.data);

    this.memory.data = result;
    await this.memory.save();

    if (result.lastMessage) {
      console.log(result.lastMessage);
    }
  }

  async openFolder(folder) {
    const target = path.resolve(this.BASE_DIR, folder || "");

    if (!target.startsWith(this.BASE_DIR)) {
      console.log("Path tidak valid");
      return;
    }

    try {
      await fs.access(target);
      this.currentDir = target;
      console.log("Masuk:", target);
    } catch {
      console.log("Folder tidak ditemukan");
    }
  }

  goBack() {
    if (this.currentDir === this.BASE_DIR) return;

    this.currentDir = path.dirname(this.currentDir);
    console.log("Kembali:", this.currentDir);
  }

  loop() {
    this.rl.question(
      chalk.cyan(`[${this.getPromptLabel()}] > `),
      async (input) => {
        if (input === "exit") {
          console.log("Bye!");
          this.rl.close();
          return;
        }

        try {
          await this.handleCommand(input);
        } catch (err) {
          console.log("ERROR:", err.message);
        }

        this.loop();
      }
    );
  }
}

new CLI().init();