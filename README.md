# 🤖 Dicoding Auto Solver (AI Agent)

Automation tool berbasis **Node.js + Puppeteer + AI (Gemini)** untuk membantu menyelesaikan:

* 📘 Materi Dicoding
* 💻 Code Runner (coding exercise)
* 🧠 Quiz / pilihan ganda
* 📝 Textarea (essay)
* 🔐 CAPTCHA (manual handling)

---

# 🚀 Fitur Utama

## 🧠 AI Smart Solver

* Membaca konteks soal otomatis
* Generate jawaban & kode
* Support multi-file (contoh: `main.mjs`, `utils.mjs`)
* Auto retry & auto fix jika error
* Adaptif (berdasarkan output sebelumnya)

---

## 💻 Code Runner Automation

* Detect halaman coding (CodeMirror)
* Isi textarea otomatis
* Jalankan:

  * ▶️ Run
  * 📨 Submit
* Baca output
* Auto retry jika gagal

---

## 📝 Quiz Solver

* Support:

  * Pilihan ganda
  * Checkbox
  * Drag & Drop
* Tidak skip soal
* Jawaban berbasis AI

---

## 📝 Textarea Solver

* Detect textarea otomatis
* AI generate jawaban
* Typing seperti manusia (anti detect)

---

## 🔗 Smart Page Detection

Auto detect halaman:

* Exam
* Code Runner
* Quiz
* Tutorial biasa

Flow berjalan otomatis tanpa konflik

---

## 🔐 CAPTCHA Handling

* Detect CAPTCHA otomatis
* Pause dan tunggu user solve manual

---

# 🧠 Cara Kerja

```text
1. Buka halaman Dicoding
2. Deteksi jenis halaman:
   → Exam
   → Code Runner
   → Quiz
   → Textarea
3. Jalankan AI solver
4. Jika gagal:
   → AI memperbaiki
   → Retry otomatis
5. Submit jawaban
6. Klik Next
7. Ulang sampai selesai
```

---

# 📦 Instalasi

```bash
npm install
```

---

# 🔑 Setup API Key

Buat file `.env`:

```env
GEMINI_API_KEY=YOUR_API_KEY
```

---

# ▶️ Cara Menjalankan

```bash
node sandbox.js https://www.dicoding.com/academies/xxx/tutorials/xxx
```

---

# 📁 Struktur Project

```bash
core/
 ├── config.js              # AI Gemini
 │
 ├── dicoding/
 │    ├── dicoding.js       # Flow utama
 │    ├── soal.js           # Solver logic
 │    ├── drag.js           # Drag & drop
 │    ├── warning.js
 │    ├── captcha.js
 │
 ├── textarea.js            # AI coding multi-file
 ├── browserChrome.js       # Chrome launcher
 ├── browserSolver.js       # Entry browser
 │
sandbox.js                  # Runner utama
```

---

# ⚙️ Teknologi

* Node.js
* Puppeteer (Chromium automation)
* Gemini API (AI streaming)
* Chalk (CLI styling)
* Ora (spinner)

---

# 🧪 Contoh Output

```text
🧠 AI Smart Solver start...
📄 Context length: 1200
📁 Total file: 2

📖 Generate AI...

📄 FILE: main.mjs
---------------------------
import ...

📄 FILE: utils.mjs
---------------------------
export ...

🚀 Attempt 1
📤 Submit...
▶️ Run...
📊 Status: success
✅ LULUS 🎉
```

---

# ⚠️ Catatan Penting

* CAPTCHA harus diselesaikan manual
* AI tidak selalu 100% benar
* Gunakan untuk:

  * belajar
  * eksperimen
  * automation pribadi

---

# 💡 Tips

* Gunakan Chrome profile untuk menghindari login ulang
* Hindari headless mode
* Gunakan delay agar tidak terdeteksi bot

---

# 🔥 Roadmap

* [ ] Auto retry sampai 100% benar
* [ ] AI belajar dari soal sebelumnya
* [ ] Analisis hasil ujian
* [ ] Anti-detection system upgrade
* [ ] Code formatter (Prettier integration)

---

# 👨‍💻 Author

Chaerul Wahyu Iman Syah

---

# ⭐ Support

Kalau project ini membantu:

* ⭐ Star repo
* 🔥 Share ke teman
* 💬 Request fitur

---

# 🚀 Enjoy AI Automation
