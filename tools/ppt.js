import { exec } from "child_process";

// ===== CONFIG =====
const MAX_TITLE_LENGTH = 60;
const MAX_POINT_LENGTH = 90;
const MAX_POINTS = 5;

// ===== CLEAN TEXT =====
function cleanText(text, maxLength) {
  if (!text) return "";

  text = String(text).trim();

  if (text.length > maxLength) {
    return text.slice(0, maxLength - 3) + "...";
  }

  return text;
}

// ===== NORMALIZE IMAGE QUERY (UNSPLASH STYLE) =====
function normalizeImageQuery(title, fallback) {
  const base = title || fallback || "presentation";

  // ambil kata penting
  const keywords = base
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(" ")
    .filter(w => w.length > 3)
    .slice(0, 3)
    .join(" ");

  return `${keywords} minimal background`;
}

// ===== VALIDATION (PRE-CHECK 1) =====
function validateStructure(data) {
  if (!data || !Array.isArray(data.slides)) {
    throw new Error("Format slides tidak valid");
  }

  if (data.slides.length < 5) {
    throw new Error("Slide minimal 5");
  }

  return data;
}

// ===== VALIDATION (PRE-CHECK 2 - CLEAN CONTENT) =====
function sanitizeSlides(data) {
  data.title = cleanText(data.title || "Presentation", MAX_TITLE_LENGTH);

  data.slides = data.slides.map((slide, i) => {
    // ===== TITLE =====
    slide.title = cleanText(
      slide.title || `Slide ${i + 1}`,
      MAX_TITLE_LENGTH
    );

    // ===== POINTS =====
    if (!Array.isArray(slide.points)) {
      slide.points = [];
    }

    slide.points = slide.points
      .slice(0, MAX_POINTS)
      .map(p => cleanText(p, MAX_POINT_LENGTH));

    // fallback kalau kosong
    if (slide.points.length === 0 && slide.layout !== "title") {
      slide.points = ["Konten tidak tersedia"];
    }

    // ===== IMAGE =====
    slide.image = normalizeImageQuery(
      slide.image,
      slide.title || data.title
    );

    return slide;
  });

  return data;
}

// ===== MAIN FUNCTION =====
export async function createAdvancedPPT(data) {
  try {
    // 🔥 CHECK 1: struktur
    data = validateStructure(data);

    // 🔥 CHECK 2: konten
    data = sanitizeSlides(data);

    return new Promise((resolve, reject) => {
      // escape JSON biar aman
      const json = JSON.stringify(data)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');

      const command = `python3 scripts/generate.py "${json}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Python Error:", error.message);
          return reject(error);
        }

        if (stderr) {
          console.warn("⚠️ Python Warning:", stderr);
        }

        console.log("✅ PPT berhasil dibuat (rapih & tervalidasi)");
        resolve();
      });
    });

  } catch (err) {
    console.error("❌ Validasi gagal:", err.message);
    throw err;
  }
}