import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { spawn } from "child_process";

puppeteer.use(StealthPlugin());

let browserInstance = null;

const CHROME_PATH =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const DEBUG_PORT = 9222;
const DEBUG_URL = `http://127.0.0.1:${DEBUG_PORT}`;

// ================= UTILS =================
function delay(min = 300, max = 1000) {
  return new Promise((res) =>
    setTimeout(res, Math.random() * (max - min) + min),
  );
}

// ================= START CHROME =================
function startChrome() {
  console.log("🚀 Start Chrome (PROFILE ASLI)...");

  spawn(
    CHROME_PATH,
    [
      "--remote-debugging-port=9222",

      // 🔥 pakai profile asli
      "--user-data-dir=C:\\Users\\chaer\\AppData\\Local\\Google\\Chrome\\User Data",
      "--profile-directory=Profile 1",

      "--start-maximized",
    ],
    {
      detached: true,
      stdio: "ignore",
    }
  ).unref();
}

// ================= WAIT CHROME =================
async function waitForChrome(retries = 15) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${DEBUG_URL}/json/version`);
      if (res.ok) {
        console.log("✅ Chrome debug ready");
        return true;
      }
    } catch {}

    console.log(`⏳ Menunggu Chrome... (${i + 1}/${retries})`);
    await delay(800, 1500);
  }

  throw new Error("Chrome tidak bisa dihubungkan");
}

// ================= PATCH BROWSER =================
async function patchBrowser(browser) {
  const pages = await browser.pages();

  for (const page of pages) {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });

      window.chrome = { runtime: {} };

      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3],
      });
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    );
  }
}

// ================= GET BROWSER =================
export async function getBrowser() {
  if (browserInstance) return browserInstance;

  // 1. coba connect dulu
  try {
   browserInstance = await puppeteer.launch({
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: false,
      userDataDir: "./chrome-profile",
      defaultViewport: null,

      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,

      args: [
        "--remote-debugging-port=9222", // 🔥 penting untuk reuse
        "--profile-directory=Profile 1",
        "--start-maximized",
        "--no-sandbox",
        "--disable-gpu",
      ],
    });
  
    console.log("🔗 Connected ke Chrome existing");
    await patchBrowser(browserInstance);
    return browserInstance;
  } catch {
    console.log("⚠️ Chrome belum jalan");
  }

  // 2. start chrome
  startChrome();

  // 3. tunggu sampai ready
  await waitForChrome();

  // 4. connect ulang
  browserInstance = await puppeteer.connect({
    browserURL: DEBUG_URL,
    defaultViewport: null,
  });

  console.log("🔗 Connected ke Chrome (auto start)");

  await patchBrowser(browserInstance);

  return browserInstance;
}

// ================= GET PAGE =================
export async function getPage() {
  const browser = await getBrowser();

  const pages = await browser.pages();
  const page = pages.length ? pages[0] : await browser.newPage();

  await delay();

  return page;
}
