import { streamGemini } from "./config.js";

export async function detectIntent(text) {
  const prompt = `
Klasifikasikan input berikut:

"${text}"

Kategori:
- CHAT → ngobrol, tanya, diskusi
- COMMAND → melakukan aksi di komputer

Balas JSON VALID:
{
  "type": "CHAT" atau "COMMAND",
  "confidence": 0 sampai 1
}
`;

  let raw = "";

  for await (const chunk of streamGemini(prompt)) {
    raw += chunk;
  }

  try {
    const json = JSON.parse(raw);

    if (!json.type) return "CHAT";

    // guard biar aman
    if (json.confidence < 0.6) return "CHAT";

    return json.type;
  } catch {
    return "CHAT";
  }
}