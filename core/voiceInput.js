import mic from "mic";
import fs from "fs";
import { transcribeAudio } from "./googleSTT.js";

const FILE = "input.wav";

export function startVoiceLoop(onText) {
  let active = true;
  let micInstance = null;

  async function recordCycle() {
    if (!active) return;

    micInstance = mic({
      rate: "16000",
      channels: "1",
      debug: false,
      exitOnSilence: 0
    });

    const stream = micInstance.getAudioStream();
    const fileStream = fs.createWriteStream(FILE);

    stream.pipe(fileStream);

    stream.on("error", (err) => {
      console.log("🎤 Mic error:", err.message);
    });

    micInstance.start();

    console.log("🎤 Recording (2s)...");

    setTimeout(async () => {
      try {
        micInstance.stop();
      } catch {}

      console.log("⏹️ Processing...");

      try {
        const text = await transcribeAudio(FILE);

        if (text && text.trim()) {
          await onText(text.trim());
        } else {
          console.log("⚠️ Tidak ada suara");
        }

      } catch (err) {
        console.log("❌ STT error:", err.message);
      }

      // 🔁 loop lagi
      if (active) recordCycle();

    }, 2000);
  }

  recordCycle();

  // 🔴 STOP FUNCTION
  return () => {
    active = false;

    try {
      if (micInstance) micInstance.stop();
    } catch {}

    console.log("🛑 Voice stopped");
  };
}