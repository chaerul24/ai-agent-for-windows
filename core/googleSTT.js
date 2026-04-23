import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function transcribeAudio(filePath) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
  });

  const audioData = fs.readFileSync(filePath);

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "audio/wav",
        data: audioData.toString("base64")
      }
    },
    "Transcribe this audio to text. Only return the text."
  ]);

  const text = result.response.text();
  return text.trim();
}