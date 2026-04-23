import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const ACCESS_KEY = process.env.UNSPLASH_KEY;

export async function getImageFile(query) {
  const url = `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`
    }
  });

  const data = await res.json();

  if (!data.urls) return null;

  const imgUrl = data.urls.regular;
  const imgRes = await fetch(imgUrl);

  const filePath = path.resolve(`./temp/${Date.now()}.jpg`);
  const buffer = await imgRes.arrayBuffer();

  fs.writeFileSync(filePath, Buffer.from(buffer));

  return filePath;
}