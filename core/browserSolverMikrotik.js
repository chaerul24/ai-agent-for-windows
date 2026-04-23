import puppeteer from "puppeteer";

// ================= UTILS =================
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ================= BROWSER =================
async function getBrowser() {
  try {
    const browser = await puppeteer.connect({
      browserURL: "http://127.0.0.1:9222",
      defaultViewport: null,
    });

    console.log("🔗 Pakai Chrome existing");
    return browser;
  } catch {
    console.log("🚀 Launch Chrome baru");

    return await puppeteer.launch({
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: false,
      userDataDir: "./chrome-profile",
      defaultViewport: null,

      args: [
        "--remote-debugging-port=9222",
        "--start-maximized",
        "--no-sandbox",
        "--disable-gpu",
      ],
    });
  }
}

// ================= MAIN =================
export async function openMikrotikBrowser(url) {
  console.log("🌐 OPEN MIKROTIK BROWSER");
  console.log("🔗 URL:", url);

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    console.log("🌐 Membuka halaman...");
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    await delay(3000);

    console.log("📍 URL:", page.url());
    console.log("🟢 Browser siap");

    return page; // 🔥 dipakai di mikrotik.js
  } catch (err) {
    console.log("❌ ERROR:", err.message);
    return null;
  }
}

// ================= COMPATIBILITY EXPORT =================
// biar tidak error kalau file lain pakai nama lama
export const solveMikrotikBrowser = openMikrotikBrowser;