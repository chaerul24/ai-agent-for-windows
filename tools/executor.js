import fs from "fs";
import path from "path";
import { exec } from "child_process";
import fetch from "node-fetch";

// ===== CONFIG =====
const BASE_DIR = path.resolve("./workspace");

// command yang diizinkan
const ALLOWED_COMMANDS = [
  "npm",
  "node",
  "composer",
  "php",
  "git",
  "mkdir",
  "touch",
  "npx"
];

// ===== SAFE PATH =====
function safePath(p = "") {
  const full = path.resolve(BASE_DIR, p);

  if (!full.startsWith(BASE_DIR)) {
    throw new Error("❌ Akses ditolak (sandbox)");
  }

  return full;
}

// ===== SAFE COMMAND =====
function isSafeCommand(cmd) {
  return ALLOWED_COMMANDS.some(c => cmd.trim().startsWith(c));
}

// ===== RUN SHELL =====
function runShell(command) {
  return new Promise((resolve, reject) => {
    if (!isSafeCommand(command)) {
      return reject("❌ Command tidak diizinkan");
    }

    exec(command, { cwd: BASE_DIR }, (err, stdout, stderr) => {
      if (err) return reject(err.message);

      resolve(stdout || stderr || "Done");
    });
  });
}

// ===== MAIN EXECUTOR =====
export async function executeCommand(cmd) {
  const { action, path: p, content, command, url } = cmd;

  try {
    switch (action) {
      // ===== FILE SYSTEM =====
      case "read": {
        const file = safePath(p);
        return fs.readFileSync(file, "utf-8");
      }

      case "write": {
        const file = safePath(p);
        fs.writeFileSync(file, content || "");
        return `File dibuat: ${p}`;
      }

      case "delete": {
        const file = safePath(p);
        fs.rmSync(file, { recursive: true, force: true });
        return `Dihapus: ${p}`;
      }

      case "list": {
        const dir = safePath(p || ".");
        return fs.readdirSync(dir);
      }

      case "mkdir": {
        const dir = safePath(p);
        fs.mkdirSync(dir, { recursive: true });
        return `Folder dibuat: ${p}`;
      }

      // ===== SHELL COMMAND =====
      case "exec":
        return await runShell(command);

      // ===== NETWORK ACCESS =====
      case "fetch": {
        const res = await fetch(url);
        const text = await res.text();
        return text.slice(0, 1000); // batasi output
      }

      default:
        return "❓ Action tidak dikenali";
    }

  } catch (err) {
    throw new Error(err.message);
  }
}