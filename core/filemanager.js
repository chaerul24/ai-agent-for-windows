export class FileManager {
  static async read(cwd, filePath) {
    const full = resolveSafePath(cwd, filePath);
    return await fs.readFile(full, "utf-8");
  }

  static async write(cwd, filePath, content) {
    const full = resolveSafePath(cwd, filePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content);
  }

  static async delete(cwd, filePath) {
    const full = resolveSafePath(cwd, filePath);
    await fs.rm(full, { recursive: true, force: true });
  }
}