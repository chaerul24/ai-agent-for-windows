class Rules {
  static async load(cwd) {
    try {
      return await fs.readFile(path.join(cwd, "aturan.txt"), "utf-8");
    } catch {
      return "No rules";
    }
  }
}