# 🧠 NeuroStudy Hub

> **One Platform. 100+ AI Tools. Unlimited Productivity.**

NeuroStudy Hub is a full-stack AI-powered learning and productivity platform built for students, researchers, writers, and developers. It brings together 100+ intelligent tools — from essay writing and text summarization to code assistance, Hinglish translation, and smart notes — all in one clean, dark-themed workspace.

Whether you're a student trying to understand a complex topic, a developer debugging code, or someone who just wants to convert hard English into easy Hinglish — NeuroStudy Hub has a tool for you.

---

## ✨ What Makes It Special

- **100+ AI Tools** — Summarizer, Essay Writer, Flashcard Generator, Code Assistant, Translator (Hinglish), Math Solver, Grammar Checker, and many more
- **Real AI Output** — Powered by OpenRouter (free tier) using top models like DeepSeek V3, Llama 4, Qwen 3
- **Voice Input** — Speak your text directly into any tool using the built-in mic button
- **Text-to-Speech** — Listen to AI output read aloud with one click
- **Smart Notes** — Create, edit, pin, and organize notes with auto-save
- **Hinglish Translator** — Converts hard English into natural Hinglish (Roman script)
- **Guest Mode** — Use tools without signing up; sign up later to save history
- **Mobile Friendly** — Fully responsive, works on phones and tablets
- **Welcome Email** — New users receive a styled welcome email with their account details

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas or local) |
| AI | OpenRouter API (free tier — DeepSeek, Llama, Qwen) |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Email | Nodemailer + Gmail SMTP |
| Voice | Web Speech API (built into browser) |

---

## 📁 Project Structure

```
NeuroStudy Hub/
│
├── Sample/                        ← Frontend (HTML/CSS/JS)
│   ├── index.html                 ← Landing page
│   ├── login.html                 ← Sign in / Sign up / Forgot password
│   ├── dashboard.html             ← Main dashboard
│   ├── marketplace.html           ← 100+ AI tools marketplace
│   ├── tool.html                  ← Individual tool page (reusable)
│   ├── notes.html                 ← Smart Notes
│   ├── profile.html               ← User profile & settings
│   ├── reset-password.html        ← Password reset page
│   ├── verify-email.html          ← Email verification page
│   │
│   ├── css/
│   │   ├── style.css              ← Global styles, sidebar, layout
│   │   ├── auth.css               ← Login/register page styles
│   │   ├── dashboard.css          ← Dashboard-specific styles
│   │   ├── marketplace.css        ← Marketplace grid & filters
│   │   ├── tool.css               ← Tool workspace styles
│   │   ├── notes.css              ← Notes editor styles
│   │   ├── profile.css            ← Profile page styles
│   │   └── landing.css            ← Landing page styles
│   │
│   └── js/
│       ├── api.js                 ← Central API client (all fetch calls)
│       ├── auth.js                ← Login/register/forgot password logic
│       ├── dashboard.js           ← Dashboard data loading
│       ├── marketplace.js         ← Tool listing, search, filter
│       ├── tool.js                ← Tool run logic, output display
│       ├── notes.js               ← Notes CRUD logic
│       ├── profile.js             ← Profile edit, preferences, history
│       ├── voice.js               ← Voice input (STT) + output (TTS)
│       └── main.js                ← Sidebar toggle, AI panel, animations
│
└── Sample/backend/                ← Backend (Node.js + Express)
    ├── server.js                  ← Entry point, middleware, routes
    ├── .env                       ← Your environment variables (private)
    ├── .env.example               ← Template for .env
    │
    ├── routes/
    │   ├── auth.js                ← Register, login, forgot/reset password
    │   ├── user.js                ← Profile update, password change
    │   ├── notes.js               ← Notes CRUD
    │   └── tools.js               ← AI tool run + history
    │
    ├── models/
    │   ├── User.js                ← User schema (name, email, password, prefs)
    │   ├── Note.js                ← Note schema
    │   └── ToolHistory.js         ← Tool usage history schema
    │
    ├── services/
    │   ├── openrouter.js          ← AI prompt builder + model fallback chain
    │   └── email.js               ← Welcome + reset email templates
    │
    └── middleware/
        └── auth.js                ← JWT verification middleware
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:
- [Node.js](https://nodejs.org) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) (local) **or** a free [MongoDB Atlas](https://cloud.mongodb.com) account
- A modern browser (Chrome or Edge recommended for voice features)

---

### Step 1 — Clone / Download the project

```bash
# If using git
git clone <your-repo-url>

# Or just download and extract the ZIP
```

---

### Step 2 — Set up the backend

```bash
cd Sample/backend
npm install
```

Copy the environment file:
```bash
cp .env.example .env
```

Then open `.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/neurostudyhub
JWT_SECRET=your_long_random_secret_here
OPENROUTER_API_KEY=sk-or-v1-your_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
FRONTEND_URL=http://localhost:5500
```

---

### Step 3 — Get your free OpenRouter API key

1. Go to **https://openrouter.ai** and create a free account (no credit card needed)
2. Dashboard → API Keys → **Create Key**
3. Copy the key and paste it into `.env` as `OPENROUTER_API_KEY`

The app uses a **10-model fallback chain** — if one model is rate-limited, it automatically tries the next one. You always get output.

---

### Step 4 — Set up Gmail for emails (optional)

Emails are optional — the app works without them. To enable welcome emails and password reset:

1. Enable **2-Step Verification** on your Google account
2. Go to **https://myaccount.google.com/apppasswords**
3. Create an App Password → select **Mail**
4. Copy the 16-character password (no spaces) into `.env` as `EMAIL_PASS`

---

### Step 5 — Start the backend

```bash
npm run dev
```

You should see:
```
✅ NeuroStudy Hub backend running
   Local:   http://localhost:5000
   Network: http://192.168.x.x:5000
   OpenRouter AI : ✅
   Email         : ✅ configured
   MongoDB       : ✅ connected
```

---

### Step 6 — Open the frontend

Open `Sample/index.html` in your browser.

**Recommended:** Use [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) — right-click `index.html` → **Open with Live Server**. This serves the frontend on `http://localhost:5500`.

---

## 📱 Accessing from Mobile

Your phone and PC must be on the **same WiFi network**.

1. Find your PC's local IP (shown in the backend startup log, e.g. `192.168.1.53`)
2. Open your phone browser and go to: `http://192.168.1.53:5500`
3. Update `FRONTEND_URL` in `.env` to match: `http://192.168.1.53:5500`

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Backend port (default: 5000) |
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT tokens (make it long and random) |
| `JWT_EXPIRES_IN` | — | Token expiry (default: `7d`) |
| `OPENROUTER_API_KEY` | ✅ | Free AI key from openrouter.ai |
| `EMAIL_USER` | Optional | Your Gmail address |
| `EMAIL_PASS` | Optional | Gmail App Password (16 chars) |
| `EMAIL_FROM` | Optional | Display name for emails |
| `FRONTEND_URL` | Optional | Used in email links (default: localhost:5500) |

---

## 🛠️ API Reference

### Authentication

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{name, email, password}` | Create account + send welcome email |
| `POST` | `/api/auth/login` | `{email, password}` | Login → returns `{token, user}` |
| `GET`  | `/api/auth/me` | — | Get current user (requires token) |
| `POST` | `/api/auth/forgot-password` | `{email}` | Send password reset link |
| `POST` | `/api/auth/reset-password` | `{token, password}` | Set new password |

### AI Tools

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/tools/run` | Optional | Run any AI tool |
| `GET`  | `/api/tools/history` | Required | Get tool usage history |
| `DELETE` | `/api/tools/history/:id` | Required | Delete one history entry |
| `DELETE` | `/api/tools/history` | Required | Clear all history |

**Run a tool — request body:**
```json
{
  "toolName": "Summarizer",
  "toolIcon": "📄",
  "input": "Your text here...",
  "outputLength": "medium",
  "format": "paragraph"
}
```

| Field | Options |
|---|---|
| `outputLength` | `"short"` · `"medium"` · `"detailed"` |
| `format` | `"paragraph"` · `"bullet"` |

### Notes

| Method | Endpoint | Description |
|---|---|---|
| `GET`    | `/api/notes` | Get all notes |
| `POST`   | `/api/notes` | Create note `{title, content, tags}` |
| `PUT`    | `/api/notes/:id` | Update note |
| `DELETE` | `/api/notes/:id` | Delete note |

### User Profile

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/profile` | Get profile |
| `PUT` | `/api/user/update` | Update name, email, location, field |
| `PUT` | `/api/user/password` | Change password |
| `PUT` | `/api/user/preferences` | Update app preferences |

---

## 🎯 Key Features Explained

### Guest Mode
Users can use all AI tools without creating an account. Tool history is saved locally in the browser. After 2 tool uses, a signup nudge appears. When the user signs up, their local history is merged into their account.

### AI Model Fallback Chain
The backend tries 10 free AI models in order. If a model is rate-limited (429), it's skipped for 60 seconds and the next model is tried. If all models are unavailable, a smart local fallback generates real structured output from the input text — so users always get something useful.

### Voice Input (STT)
Click the mic button in any tool. The browser shows a microphone permission dialog on first use. Speech is transcribed in real time — interim words appear as you speak, and finalized words are permanently committed. Previous words are never erased when you speak new ones.

### Text-to-Speech (TTS)
Click the speaker button after getting AI output. The output is read aloud using the browser's built-in speech synthesis. Click again to stop.

### Hinglish Translator
The Translator tool converts hard English into natural Hinglish — the way people actually speak in India. Output is in Roman script (not Devanagari), mixing Hindi and English naturally.

---

## 🔧 Health Check

```
GET http://localhost:5000/api/health
```

Response:
```json
{
  "status": "ok",
  "db": true,
  "ai": true,
  "email": true
}
```

---

## 📦 Dependencies

### Backend
| Package | Purpose |
|---|---|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT auth |
| `bcryptjs` | Password hashing |
| `nodemailer` | Email sending |
| `node-fetch` | HTTP calls to OpenRouter |
| `express-validator` | Input validation |
| `express-rate-limit` | Rate limiting |
| `dotenv` | Environment variables |
| `nodemon` | Dev auto-restart |

---

## 🐛 Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot reach the server` | Start the backend: `cd Sample/backend && npm run dev` |
| `MongoDB connection error` | Check your `MONGO_URI` in `.env` — make sure the password is correct |
| `AI processing failed` | Check `OPENROUTER_API_KEY` in `.env` — get a free key at openrouter.ai |
| `Email not sending` | Set `EMAIL_USER` and `EMAIL_PASS` (Gmail App Password) in `.env` |
| Voice not working | Use Chrome or Edge — Firefox doesn't support Web Speech API |
| Port 5000 in use | Change `PORT=5001` in `.env` and update `API_BASE` in `js/api.js` |
| Mobile can't connect | Make sure phone and PC are on the same WiFi — use the Network IP shown at startup |

---

## 👨‍💻 Built By

**Krish Soni** — Full Stack Developer

- Email: skrishsoni346@gmail.com
- Platform: NeuroStudy Hub v3.0

---

*NeuroStudy Hub — Study smarter, not harder.* 🚀
