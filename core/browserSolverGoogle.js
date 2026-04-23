import puppeteer from "puppeteer";
import { spawn } from "child_process";
function delay(min = 300, max = 800) {
  return new Promise((res) =>
    setTimeout(res, Math.random() * (max - min) + min)
  );
}
const CHROME_PATH =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
let browserInstance = null;

const USER_DATA_DIR =
  "C:\\Users\\chaer\\AppData\\Local\\Google\\Chrome\\User Data";
startChromeDebug();
async function waitChromeReady() {
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9222/json/version");
      if (res.ok) return true;
    } catch {}

    console.log(`⏳ Tunggu Chrome... (${i + 1})`);
    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error("Chrome debug tidak ready");
}
function startChromeDebug() {
  console.log("🚀 Menjalankan Chrome debug mode...");

  spawn(CHROME_PATH, [
    "--remote-debugging-port=9222",
    `--user-data-dir=${USER_DATA_DIR}`,
    "--profile-directory=Profile 1",
    "--start-maximized",
  ], {
    detached: true,
    stdio: "ignore",
  }).unref();
}

async function waitForChrome(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const browser = await puppeteer.connect({
        browserURL: "http://127.0.0.1:9222",
        defaultViewport: null,
      });

      return browser;
    } catch {
      console.log(`⏳ Menunggu Chrome... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  throw new Error("Chrome tidak bisa dihubungkan");
}

// ===== GET BROWSER =====
async function getBrowser() {
  if (browserInstance) return browserInstance;

  // 1. coba connect dulu
  try {
    await waitChromeReady();
    browserInstance = await puppeteer.connect({
      browserURL: "http://127.0.0.1:9222",
      defaultViewport: null,
    });

    console.log("🔗 Connected ke Chrome existing");
    return browserInstance;
  } catch {
    console.log("⚠️ Chrome debug belum jalan");
  }

  // 2. start chrome
  startChromeDebug();

  // 3. tunggu sampai ready (retry)
  browserInstance = await waitForChrome();

  console.log("✅ Chrome siap & terhubung");

  return browserInstance;
}

export { getBrowser };

// ================= WAIT READY =================
async function waitReady(page) {
  await page.waitForFunction(() => document.readyState === "complete");
  await page.waitForSelector("body");
  await delay(2000);
}

// ================= CLICK BUTTON =================
async function clickButtonByText(page, text) {
  for (let i = 0; i < 5; i++) {
    const clicked = await page.evaluate((t) => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.innerText.toLowerCase().includes(t.toLowerCase()),
      );

      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, text);

    if (clicked) {
      console.log(`🖱️ Klik button: ${text}`);
      return true;
    }

    await await humanDelay(300, 800); // penting
  }

  console.log(`❌ Gagal klik button: ${text}`);
  return false;
}

// ================= CLICK MENU =================
async function clickMenuByText(page, text) {
  for (let i = 0; i < 5; i++) {
    const clicked = await page.evaluate((t) => {
      const items = [...document.querySelectorAll("li")];

      const target = items.find((el) =>
        el.innerText.toLowerCase().includes(t.toLowerCase()),
      );

      if (target) {
        target.click();
        return true;
      }

      return false;
    }, text);

    if (clicked) {
      console.log(`🖱️ Klik menu: ${text}`);
      return true;
    }

    await await humanDelay(300, 800); // penting
  }

  console.log(`❌ Gagal klik menu: ${text}`);
  return false;
}

// ================= CLICK TAMBAH AKUN (FIXED) =================
async function clickAddAccount(page) {
  console.log("🔍 Mencari 'Tambahkan akun'...");

  try {
    await page.waitForFunction(
      () => {
        return [...document.querySelectorAll("div")].some((el) =>
          el.innerText.toLowerCase().includes("tambahkan akun"),
        );
      },
      { timeout: 30000 },
    );
  } catch {}

  // ===== MAIN PAGE =====
  let clicked = await page.evaluate(() => {
    const items = [...document.querySelectorAll("div.Rd7ond")];

    const target = items.find((el) =>
      el.innerText.toLowerCase().includes("tambahkan akun"),
    );

    if (target) {
      target.click();
      return true;
    }

    return false;
  });

  if (clicked) {
    console.log("🖱️ Klik 'Tambahkan akun'");
    return true;
  }

  // ===== IFRAME FALLBACK =====
  const frames = page.frames();

  for (const frame of frames) {
    try {
      clicked = await frame.evaluate(() => {
        const items = [...document.querySelectorAll("div.Rd7ond")];

        const target = items.find((el) =>
          el.innerText.toLowerCase().includes("tambahkan akun"),
        );

        if (target) {
          target.click();
          return true;
        }

        return false;
      });

      if (clicked) {
        console.log("🖱️ Klik 'Tambahkan akun' (iframe)");
        return true;
      }
    } catch {}
  }

  console.log("❌ Tidak menemukan 'Tambahkan akun'");
  return false;
}
const Human = {
  delay(min = 100, max = 400) {
    return new Promise((r) => setTimeout(r, Math.random() * (max - min) + min));
  },

  async moveMouse(page) {
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    await page.mouse.move(x, y, { steps: 5 });
  },

  async scroll(page) {
    await page.evaluate(() => {
      window.scrollBy(0, Math.random() * 300);
    });
  },

  async click(page, selector) {
    const el = await page.$(selector);
    if (!el) return false;

    const box = await el.boundingBox();

    if (box) {
      await page.mouse.move(
        box.x + box.width / 2 + Math.random() * 5,
        box.y + box.height / 2 + Math.random() * 5,
        { steps: 10 },
      );

      await this.delay(100, 300);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }

    return true;
  },
};
async function humanType(page, selector, text) {
  await page.focus(selector);

  for (const char of text) {
    await page.keyboard.type(char);
    await Human.delay(30, 120);
  }
}
async function randomBehavior(page) {
  const actions = [
    () => Human.moveMouse(page),
    () => Human.scroll(page),
    () => Human.delay(100, 500),
  ];

  const action = actions[Math.floor(Math.random() * actions.length)];
  await action();
}
async function clickNextHuman(page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some((b) =>
      b.innerText.toLowerCase().includes("berikutnya"),
    ),
  );

  await Human.delay(200, 500);

  const btn = await page.evaluateHandle(() => {
    return [...document.querySelectorAll("button")].find((b) =>
      b.innerText.toLowerCase().includes("berikutnya"),
    );
  });

  const box = await btn.asElement().boundingBox();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 8,
  });

  await Human.delay(100, 300);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
async function fillDOB(page) {
  console.log("🧠 Isi tanggal lahir + gender...");

  // ===== RANDOM GENERATOR =====
  const randomDay = Math.floor(Math.random() * 28) + 1;
  const randomMonth = Math.floor(Math.random() * 12) + 1;
  const randomYear = Math.floor(Math.random() * (2003 - 1987 + 1)) + 1987;

  const genderText = Math.random() > 0.5 ? "pria" : "wanita";

  console.log(`📅 DOB: ${randomDay}-${randomMonth}-${randomYear}`);
  console.log(`🚻 Gender: ${genderText}`);

  // ===== INPUT DAY =====
  await page.type('input[name="day"]', String(randomDay), { delay: 50 });

  // ===== SELECT MONTH =====
  await page.click('#month [role="combobox"]');
  await await humanDelay(300, 800); // penting

  await page.evaluate((month) => {
    const options = [...document.querySelectorAll('li[role="option"]')];
    const target = options.find((o) => o.getAttribute("data-value") == month);

    if (target) target.click();
  }, randomMonth);

  await await humanDelay(300, 800); // penting

  // ===== INPUT YEAR =====
  await page.type('input[name="year"]', String(randomYear), { delay: 50 });

  await await humanDelay(300, 800); // penting

  // ===== SELECT GENDER =====
  await page.click('#gender [role="combobox"]');
  await await humanDelay(300, 800); // penting

  await page.evaluate((gender) => {
    const options = [...document.querySelectorAll('li[role="option"]')];

    const target = options.find((o) =>
      o.innerText.toLowerCase().includes(gender),
    );

    if (target) target.click();
  }, genderText);

  await delay(500);

  console.log("✅ DOB & Gender terisi");
}
async function clickNext(page) {
  for (let i = 0; i < 5; i++) {
    const clicked = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        b.innerText.toLowerCase().includes("berikutnya"),
      );

      if (btn) {
        btn.click();
        return true;
      }

      return false;
    });

    if (clicked) {
      console.log("➡️ Klik 'Berikutnya'");
      return true;
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log("❌ Gagal klik 'Berikutnya'");
  return false;
}

const firstNames = [
  "Andi",
  "Budi",
  "Rizky",
  "Fajar",
  "Dimas",
  "Aulia",
  "Putra",
  "Reza",
  "Yoga",
  "Ardi",
  "Ilham",
  "Rafi",
  "Bagas",
  "Farhan",
  "Iqbal",
];

const lastNames = [
  "Saputra",
  "Pratama",
  "Wijaya",
  "Santoso",
  "Nugroho",
  "Permana",
  "Setiawan",
  "Hidayat",
  "Ramadhan",
  "Kurniawan",
  "Firmansyah",
  "Maulana",
  "Syahputra",
  "Anugrah",
  "Alfian",
];
function getRandomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];

  return { first, last };
}
function generateUsername(first, last) {
  const num = Math.floor(Math.random() * 9000) + 100;
  const styles = [
    (f, l, n) => `${f}${l}${n}`,
    (f, l, n) => `${f}.${l}${n}`,
    (f, l, n) => `${f}_${l}${n}`,
    (f, l, n) => `${f}${n}${l}`,
    (f, l, n) => `${l}${f}${n}`,
  ];

  const style = styles[Math.floor(Math.random() * styles.length)];

  return style(first.toLowerCase(), last.toLowerCase(), num);
}
function humanDelay(min = 100, max = 400) {
  return new Promise((r) => setTimeout(r, Math.random() * (max - min) + min));
}
async function waitForGmailPage(page) {
  console.log("⏳ Menunggu halaman Gmail / Username...");

  try {
    const result = await page.waitForFunction(
      () => {
        const text = document.body.innerText.toLowerCase();

        if (text.includes("buat alamat gmail")) {
          return "gmail";
        }

        if (document.querySelector('input[name="Username"]')) {
          return "input";
        }

        if (document.querySelector('input[type="radio"]')) {
          return "radio";
        }

        return null;
      },
      { timeout: 30000 },
    );

    const type = await result.jsonValue();

    if (type === "gmail") {
      console.log("📍 PAGE: Gmail");
      console.log("👉 Buat alamat Gmail untuk login ke Akun Google Anda");
    }

    if (type === "input") {
      console.log("📍 PAGE: Username Input");
    }

    if (type === "radio") {
      console.log("📍 PAGE: Username Radio Selection");
    }

    return type;
  } catch {
    console.log("❌ Gagal detect halaman");
    return null;
  }
}
async function handleUsernameStep(page) {
  console.log("⏳ Handle username (adaptive)...");

  await page.waitForFunction(
    () => {
      return (
        document.querySelector('input[name="Username"]') ||
        document.querySelector('input[type="radio"]')
      );
    },
    { timeout: 30000 },
  );

  const hasRadio = await page.$('input[type="radio"]');
  const hasInput = await page.$('input[name="Username"]');

  // ===== PRIORITAS RADIO =====
  if (hasRadio) {
    console.log("📻 Mode radio username");

    const result = await page.evaluate(() => {
      const radios = [...document.querySelectorAll('input[type="radio"]')];

      // cari opsi custom
      const custom = radios.find((r) => r.value === "custom");

      if (custom) {
        custom.click();
        return "custom";
      }

      // kalau tidak ada custom → pilih pertama
      radios[0]?.click();
      return "auto";
    });

    await new Promise((r) => setTimeout(r, 3000));

    // ===== JIKA CUSTOM → ISI INPUT =====
    if (result === "custom") {
      console.log("✏️ Mode custom username");

      const { first, last } = getRandomName();
      const username = generateUsername(first, last);

      await page.waitForSelector('input[name="Username"]');

      await setInputValue(page, 'input[name="Username"]', username);

      console.log(`📧 Username custom: ${username}`);
    }

    return "radio";
  }

  // ===== INPUT LANGSUNG =====
  if (hasInput) {
    console.log("📝 Mode input username");

    const { first, last } = getRandomName();
    const username = generateUsername(first, last);

    await page.type('input[name="Username"]', username, { delay: 50 });

    console.log(`📧 Username: ${username}`);

    return "input";
  }

  console.log("❌ Tidak menemukan username step");
  return null;
}
async function setInputValue(page, selector, value) {
  await page.evaluate(
    (sel, val) => {
      const input = document.querySelector(sel);

      if (!input) return;

      input.focus();

      input.value = val;

      // 🔥 trigger event biar Google detect
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    selector,
    value,
  );
}
function generateStrongPassword(length = 12) {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+{}[]<>?";

  const all = lower + upper + numbers + symbols;

  let password = "";

  // wajib minimal 1 dari tiap kategori
  password += lower[Math.floor(Math.random() * lower.length)];
  password += upper[Math.floor(Math.random() * upper.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // shuffle
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// ================= HANDLE PASSWORD PAGE =================
async function handlePasswordPage(page) {
  console.log("⏳ Tunggu halaman password...");

  try {
    await page.waitForSelector('input[name="Passwd"]', {
      timeout: 5000,
    });

    console.log("🔐 Halaman password terdeteksi");

    // 🔥 pakai generator
    const password = generateStrongPassword(12);

    console.log(`🔐 Password: ${password}`);

    // ===== ISI PASSWORD =====
    await page.type('input[name="Passwd"]', password, { delay: 50 });

    await page.type('input[name="PasswdAgain"]', password, { delay: 50 });

    console.log("✅ Password terisi");

    await await humanDelay(300, 800); // penting

    // ===== CHECKBOX =====
    const checked = await page.evaluate(() => {
      const checkbox = document.querySelector('input[type="checkbox"]');

      if (checkbox && !checkbox.checked) {
        checkbox.click();
        return true;
      }

      return false;
    });

    if (checked) {
      console.log("☑️ Checkbox dicentang");
    }

    await await humanDelay(300, 800); // penting

    // ===== NEXT =====
    const nextClicked = await clickNextHuman(page);

    if (nextClicked) {
      console.log("➡️ Klik 'Berikutnya' (password)");
    } else {
      console.log("❌ Gagal klik Next (password)");
    }

    // 🔥 return password biar bisa disimpan nanti
    return password;
  } catch (err) {
    console.log("❌ Gagal handle password page:", err.message);
    return null;
  }
}
// ================= MAIN =================
export async function solveGoogle() {
  console.log("🧠 GOOGLE SOLVER START");

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    // ===== OPEN GOOGLE =====
    await page.goto("https://www.google.com", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await waitReady(page);

    console.log("🌐 Google siap");

    // ===== CLICK AVATAR =====
    await page.evaluate(() => {
      const btn = document.querySelector("a[aria-label*='Akun Google']");
      if (btn) btn.click();
    });

    await await humanDelay(300, 800); // penting // 🔥 penting

    // ===== TAMBAHKAN AKUN =====
    const add = await clickAddAccount(page);
    if (!add) return;

    await page.waitForNavigation({ timeout: 60000 });
    await waitReady(page);

    console.log("➡️ Halaman login");

    // ===== BUAT AKUN =====
    const buat = await clickButtonByText(page, "Buat akun");
    if (!buat) return;

    await delay(2000);

    // ===== PILIH PRIBADI =====
    await page.waitForFunction(
      () => {
        return [...document.querySelectorAll("li")].some((el) =>
          el.innerText.toLowerCase().includes("pribadi"),
        );
      },
      { timeout: 30000 },
    );

    const pribadi = await clickMenuByText(page, "pribadi");
    if (!pribadi) return;

    await await humanDelay(300, 800); // penting

    console.log("➡️ Form registrasi");

    // ===== STEP 1: NAMA =====
    try {
      console.log("⏳ Tunggu halaman nama...");

      await page.waitForSelector('input[name="firstName"]', {
        timeout: 30000,
      });

      const { first, last } = getRandomName();

      console.log(`👤 Nama: ${first} ${last}`);

      await humanType(page, 'input[name="firstName"]', first);
      await humanType(page, 'input[name="lastName"]', last);

      await clickNextHuman(page);
      await delay(1000);
    } catch {
      console.log("❌ Gagal isi nama");
      return;
    }

    // ===== STEP 2: DOB =====
    await fillDOB(page);

    await clickNextHuman(page);
    await delay(2000);

    // ===== STEP 3: USERNAME (ADAPTIVE) =====
    console.log("⏳ Handle username step...");

    const pageType = await waitForGmailPage(page);

    if (pageType === "input" || pageType === "radio") {
      await handleUsernameStep(page);

      await await humanDelay(300, 800); // penting

      await clickNextHuman(page);
      await delay(2000);
    } else if (pageType === "gmail") {
      console.log("📍 Gmail page terdeteksi (input username)");

      // 🔥 tetap handle username (karena ini halaman input)
      await handleUsernameStep(page);

      await delay(500);

      await clickNextHuman(page);

      await delay(1500);
    } else {
      console.log("❌ Tidak tahu halaman apa");
      return;
    }

    // ===== STEP 4: PASSWORD =====
    const password = await handlePasswordPage(page);

    if (!password) {
      console.log("❌ Gagal handle password");
      return;
    }

    await delay(2000);

    console.log("🎉 FLOW SELESAI SAMPAI PASSWORD");
    console.log("\n🛑 STOP: lanjut manual (captcha / verifikasi nomor)");
  } catch (err) {
    console.log("❌ ERROR:", err.message);
    console.log(err);
  }
}
