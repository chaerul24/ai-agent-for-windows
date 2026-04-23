export class AIParser {

  static clean(text) {
    if (!text) return "";

    return text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
  }

  static safeParse(text) {
    if (!text) return null;

    const cleaned = this.clean(text);

    // 1. direct parse
    try {
      return JSON.parse(cleaned);
    } catch {}

    // 2. extract JSON object / array
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }

    // 3. 🔥 AUTO FIX (IMPORTANT)
    return {
      type: "message",
      message: cleaned
    };
  }

  static normalize(res) {
    if (!res) return [];

    // 🔥 kalau string langsung jadi message
    if (typeof res === "string") {
      return [{
        type: "message",
        message: res
      }];
    }

    // 🔥 kalau bukan array
    if (!Array.isArray(res)) {
      return [this.ensureShape(res)];
    }

    return res.map(r => this.ensureShape(r));
  }

  static ensureShape(obj) {
    if (!obj || typeof obj !== "object") {
      return {
        type: "message",
        message: String(obj)
      };
    }

    // 🔥 kalau tidak ada type → anggap message
    if (!obj.type) {
      return {
        type: "message",
        message: obj.message || JSON.stringify(obj)
      };
    }

    return obj;
  }
}