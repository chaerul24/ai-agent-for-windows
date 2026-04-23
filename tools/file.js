import fs from "fs";
import path from "path";

const BASE = "./sandbox";

export function writeFile(file, content) {
  const full = path.join(BASE, file);

  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);

  return full;
}