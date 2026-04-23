# 🤖 WhatsApp AI Agent + Dicoding Auto Solver

Automation tool berbasis **Node.js + Puppeteer + AI (Gemini)** untuk:

* 💬 Auto reply WhatsApp (AI agent)
* 🎓 Auto solve Dicoding (materi, quiz, coding)
* 🧠 Multi-mode AI (chat, coding, dataset)

---

# 🚀 Fitur Utama

## 📱 WhatsApp AI Agent

* Auto reply pesan masuk
* Gaya natural (Gen Z, santai, kontekstual)
* Mode otomatis:

  * 💖 Romantic (detect: sayang, syng, ayang)
  * 💼 Client (harga, jasa, deal)
  * 🧠 Smart reply (context-aware)
* Memory chat (history per user)
* CLI warna (chalk + spinner)

---

## 🎓 Dicoding Auto Solver

### 🧠 AI Smart Solver

* Membaca konteks soal otomatis
* Generate jawaban & kode
* Auto retry jika error
* Bisa adaptasi dari hasil sebelumnya

---

### 💻 Code Runner Automation

* Detect halaman coding (CodeMirror)
* Isi textarea otomatis (multi-file support)
* Klik:

  * ▶️ Jalankan
  * 📨 Submit
* Baca output & retry jika gagal

---

### 📝 Quiz Solver

* Support:

  * Pilihan ganda
  * Checkbox
  * Drag & Drop
* Tidak skip soal
* Jawaban berbasis AI

---

### 📝 Textarea Solver (Essay)

* Detect textarea otomatis
* AI generate jawaban
* Typing seperti manusia (anti detect)

---

### 🔗 Smart Page Detection

Auto detect halaman:

* Exam
* Code Runner
* Quiz
* Tutorial biasa

Flow berjalan otomatis tanpa konflik

---

### 🔐 CAPTCHA Handling

* Detect CAPTCHA otomatis
* Pause & tunggu user solve manual

---

# 🧠 Cara Kerja

```text
1. Buka halaman Dicoding
2. Deteksi jenis halaman:
   → Exam
   → Code Runner
   → Soal
   → Textarea
3. Jalankan AI solver
4. Jika gagal:
   → AI perbaiki
   → Retry
5. Submit
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

## 📱 WhatsApp Bot

```bash
node whatsapp.js
```

Scan QR → bot aktif.

---

## 🎓 Dicoding Solver

```bash
node sandbox.js https://www.dicoding.com/academies/xxx/tutorials/xxx
```

---

# 📁 Struktur Project

```bash
core/
 ├── config.js              # AI Gemini
 │
 ├── whatsapp/
 │    ├── chat.js           # AI auto reply
 │    ├── inbox.js
 │    ├── memory.js
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
sandbox.js                  # Runner Dicoding
whatsapp.js                 # Runner WhatsApp
```

---

# ⚙️ Teknologi

* Node.js
* Puppeteer (Chromium automation)
* whatsapp-web.js
* Gemini API (AI streaming)
* Chalk (CLI color)
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

❌ Jangan digunakan untuk abuse / spam

---

# 💡 Tips

* Gunakan Chrome profile (biar tidak login ulang)
* Hindari headless mode
* Gunakan delay (sudah otomatis)
* Jangan terlalu cepat (anti detect)

---

# 🔥 Roadmap

* [ ] Auto retry sampai 100% benar
* [ ] AI belajar dari soal sebelumnya
* [ ] Dataset AI analyzer lebih canggih
* [ ] Anti-detection system upgrade
* [ ] Formatter kode otomatis

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

# 🚀 Enjoy Automation + AI Agent
