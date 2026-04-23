// ================= CAPTCHA HANDLER =================
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function handleCaptcha(page) {
  try {
    const captchaBtn = await page.$("#amzn-captcha-verify-button");

    if (!captchaBtn) return false;

    console.log("🛡 CAPTCHA terdeteksi!");
    console.log("🤖 Mencoba klik verifikasi...");

    await captchaBtn.click();
    await delay(3000);

    // cek masih ada captcha atau tidak
    const stillCaptcha = await page.$("#amzn-captcha-verify-button");

    if (stillCaptcha) {
      console.log("⚠️ CAPTCHA belum selesai");
      console.log("👉 Silakan selesaikan manual di browser...");

      // tunggu user manual solve
      for (let i = 0; i < 60; i++) {
        await delay(2000);

        const check = await page.$("#amzn-captcha-verify-button");
        if (!check) {
          console.log("✅ CAPTCHA selesai");
          return true;
        }
      }

      console.log("❌ CAPTCHA timeout");
      return false;
    }

    console.log("✅ CAPTCHA dilewati otomatis");
    return true;

  } catch (err) {
    console.log("❌ CAPTCHA error:", err.message);
    return false;
  }
}