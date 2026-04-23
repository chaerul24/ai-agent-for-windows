import fs from "fs";
import { exec } from "child_process";
import ora from "ora";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-preview-tts"
});

export async function speak(text) {
  if (!text) return;

  const spinner = ora("🔊 Generating voice...").start();

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text }]
        }
      ],
      generationConfig: {
        responseModalities: ["AUDIO"]
      }
    });

    const parts = result.response.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find(p => p.inlineData);

    if (!audioPart) {
      spinner.fail("❌ No audio returned");
      return;
    }

    // 🔥 FIX: convert base64 → PCM → WAV
    const pcm = Buffer.from(audioPart.inlineData.data, "base64");

    function toWav(pcmData) {
      const header = Buffer.alloc(44);

      const sampleRate = 24000;
      const channels = 1;
      const bitsPerSample = 16;

      const byteRate = sampleRate * channels * bitsPerSample / 8;
      const blockAlign = channels * bitsPerSample / 8;

      header.write("RIFF", 0);
      header.writeUInt32LE(36 + pcmData.length, 4);
      header.write("WAVE", 8);
      header.write("fmt ", 12);
      header.writeUInt32LE(16, 16);
      header.writeUInt16LE(1, 20);
      header.writeUInt16LE(channels, 22);
      header.writeUInt32LE(sampleRate, 24);
      header.writeUInt32LE(byteRate, 28);
      header.writeUInt16LE(blockAlign, 32);
      header.writeUInt16LE(bitsPerSample, 34);
      header.write("data", 36);
      header.writeUInt32LE(pcmData.length, 40);

      return Buffer.concat([header, pcmData]);
    }

    const wav = toWav(pcm);

    const file = "voice.wav";
    fs.writeFileSync(file, wav); // ✅ FIX

    spinner.succeed("🔊 Playing...");

    exec(`powershell -c (New-Object Media.SoundPlayer '${file}').PlaySync();`);

  } catch (err) {
    spinner.fail("❌ Voice failed");
    console.log("🔊 TTS error:", err.message);
  }
}