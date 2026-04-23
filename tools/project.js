import { writeFile } from "./file.js";

export function createProject(name) {
  writeFile(`${name}/package.json`, JSON.stringify({
    name,
    version: "1.0.0"
  }, null, 2));

  writeFile(`${name}/index.js`, `
console.log("Hello from AI 🚀");
  `);

  return `🚀 Project ${name} dibuat`;
}