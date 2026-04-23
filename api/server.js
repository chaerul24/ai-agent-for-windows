import express from "express";
import path from "path";
import fs from "fs/promises";
import { runAgent } from "../core/runner.js";

const app = express();
app.use(express.json());

const BASE_DIR = path.resolve("./workspace");
const MEMORY_PATH = path.resolve("./memory/memory.json");
const PUBLIC_DIR = path.resolve("./public");

// ===== STATIC WEB =====
app.use(express.static(PUBLIC_DIR));

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// ===== MEMORY =====
async function loadMemory() {
  try {
    const raw = await fs.readFile(MEMORY_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveMemory(mem) {
  await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
  await fs.writeFile(MEMORY_PATH, JSON.stringify(mem, null, 2));
}

// ===== API =====
app.post("/agent", async (req, res) => {
  const { input, cwd } = req.body;

  if (!input) {
    return res.status(400).json({ error: "input required" });
  }

  const memory = await loadMemory();

  try {
    const result = await runAgent(
      input,
      cwd || BASE_DIR,
      memory
    );

    await saveMemory(result);

    res.json({
      success: true,
      message: result.lastMessage || "done",
      memory: result
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
});