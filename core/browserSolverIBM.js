import puppeteer from "puppeteer";

// ================= UTILS =================
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ================= GLOBAL BROWSER =================
let browserInstance = null;

// ================= GET / REUSE BROWSER =================
async function getBrowser() {
  if (browserInstance) return browserInstance;

  try {
    browserInstance = await puppeteer.connect({
      browserURL: "http://127.0.0.1:9222",
      defaultViewport: null,
    });

    console.log("🔗 Menggunakan Chrome yang sudah terbuka");
  } catch {
    console.log("🚀 Launch Chrome baru...");

    browserInstance = await puppeteer.launch({
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

  browserInstance.on("disconnected", () => {
    console.log("⚠️ Browser disconnect");
    browserInstance = null;
  });

  return browserInstance;
}

// ================= WAIT PAGE READY =================
async function waitPageReady(page) {
  await page.waitForFunction(() => document.readyState === "complete");
  await delay(2000); // buffer React render
}

// ================= FIND & CLICK BUTTON =================
async function clickContinue(page) {
  // ==== MAIN PAGE ====
  let clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")]
      .find(b => b.innerText.toLowerCase().includes("checked it out"));

    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (clicked) return true;

  // ==== IFRAME CHECK ====
  const frames = page.frames();

  for (const frame of frames) {
    try {
      clicked = await frame.evaluate(() => {
        const btn = [...document.querySelectorAll("button")]
          .find(b => b.innerText.toLowerCase().includes("checked it out"));

        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });

      if (clicked) return true;
    } catch {
      // ignore cross-origin frame
    }
  }

  return false;
}
async function waitFullyLoaded(page) {
  console.log("⏳ Menunggu halaman benar-benar siap...");

  // 1. Tunggu network idle (sudah kamu pakai)
  await page.waitForFunction(() => document.readyState === "complete");

  // 2. Tunggu body benar-benar ada
  await page.waitForSelector("body");

  // 3. Tunggu React render (penting untuk IBM)
  await page.waitForFunction(() => {
    return document.querySelectorAll("button").length > 0;
  }, { timeout: 100000 });

  // 4. Extra buffer (UI animation / lazy load)
  await delay(3000);

  console.log("✅ Halaman siap");
}
// ================= MAIN SOLVER =================
export async function solveIBM(url) {
  console.log("🧠 IBM SOLVER START");
  console.log("🌐 URL:", url);

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    console.log("🌐 Membuka halaman...");

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await waitFullyLoaded(page);

    console.log("📍 Current URL:", page.url());

    console.log("\n🚀 Mulai automation...\n");

    let step = 1;

    while (true) {
      console.log(`➡️ Step ${step}: menunggu tombol...`);

      // tunggu tombol muncul (maks 30 detik)
      try {
        await page.waitForFunction(() => {
          return [...document.querySelectorAll("button")]
            .some(b => b.innerText.toLowerCase().includes("checked it out"));
        }, { timeout: 15000  });
      } catch {
        // bisa jadi di iframe → lanjut cek manual
      }

      const clicked = await clickContinue(page);

      if (!clicked) {
        console.log("✅ Tidak ada tombol lagi, selesai");
        break;
      }

      console.log("🖱️ Klik 'I've checked it out!'");

      step++;

      // tunggu page update
      await waitPageReady(page);
    }

    console.log("\n🟢 IBM flow selesai");
  } catch (err) {
    console.log("❌ ERROR:", err.message);
  }
}