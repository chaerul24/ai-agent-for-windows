import { execSync } from "child_process";
import path from "path";

export function runCommand(cmd, project = null) {
  const base = path.resolve("./sandbox");
  const cwd = project ? path.join(base, project) : base;

  try {
    return execSync(cmd, {
      encoding: "utf-8",
      cwd
    });
  } catch (e) {
    return e.message;
  }
}