import puppeteer from "puppeteer";

// ================= UTILS =================
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ================= GLOBAL BROWSER =================
let browserInstance = null;

// ================= GET BROWSER =================
async function getBrowser() {
  if (browserInstance) return browserInstance;

  try {
    browserInstance = await puppeteer.connect({
      browserURL: "http://127.0.0.1:9222",
      defaultViewport: null,
    });

    console.log("🔗 Pakai Chrome existing");
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
      ],
    });
  }

  return browserInstance;
}

// ================= WAIT READY =================
async function waitReady(page) {
  await page.waitForFunction(() => document.readyState === "complete");
  await delay(2000);
}

// ================= CLICK TAMBAH AKUN =================
async function clickAddAccount(page) {
  return await page.evaluate(() => {
    const divs = [...document.querySelectorAll("div")];

    const btn = divs.find((d) =>
      d.innerText.toLowerCase().includes("tambahkan akun")
    );

    if (btn) {
      btn.click();
      return true;
    }

    return false;
  });
}

// ================= MAIN =================
export async function createGoogleAccount() {
  console.log("🧠 CREATE GOOGLE ACCOUNT");

  const browser = await getBrowser();
  const page = await browser.newPage();

  // buka google
  await page.goto("https://www.google.com", {
    waitUntil: "networkidle2",
  });

  await waitReady(page);

  // klik avatar dulu (kalau perlu)
  await page.evaluate(() => {
    const btn = document.querySelector("a[aria-label*='Akun Google']");
    if (btn) btn.click();
  });

  await delay(2000);

  // klik "Tambahkan akun"
  const clicked = await clickAddAccount(page);

  if (!clicked) {
    console.log("❌ Tombol 'Tambahkan akun' tidak ditemukan");
    return;
  }

  console.log("✅ Klik Tambahkan akun");

  // tunggu redirect ke halaman login google
  await page.waitForNavigation({ timeout: 60000 });

  console.log("➡️ Masuk halaman login");

  // klik "Buat akun"
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("span")]
      .find((s) => s.innerText.includes("Buat akun"));

    btn?.click();
  });

  await delay(2000);

  // pilih "Untuk diri sendiri"
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("span")]
      .find((s) => s.innerText.includes("Untuk diri sendiri"));

    btn?.click();
  });

  console.log("➡️ Form registrasi");

  // isi form dasar
  await page.type('input[name="firstName"]', "Chaerul");
  await page.type('input[name="lastName"]', "AI");

  await page.click("#collectNameNext");

  await delay(3000);

  console.log("✏️ Isi data lanjut...");

  // ⚠️ bagian ini tergantung UI (bisa berubah)
  // contoh isi username & password
  try {
    await page.type('input[name="Username"]', "chaerulbot123");
    await page.type('input[name="Passwd"]', "Password123!");
    await page.type('input[name="ConfirmPasswd"]', "Password123!");

    await page.click("#createpasswordNext");
  } catch {
    console.log("⚠️ Form berubah / belum siap");
  }

  console.log("\n🛑 STOP: lanjutkan manual (verifikasi nomor / captcha)");
}