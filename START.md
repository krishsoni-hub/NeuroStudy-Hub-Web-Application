# How to Start NeuroStudy Hub

## The error you're seeing

> "Cannot reach the server. Make sure the backend is running on port 5000."

This means the backend Node.js server is not running. Follow the steps below.

---

## Step 1 — Install Node.js (if not installed)

Download from: https://nodejs.org (choose the LTS version)

Verify it works by opening a terminal and running:
```
node --version
npm --version
```
Both should print a version number.

---

## Step 2 — Install MongoDB (if not installed)

Option A — MongoDB Community (local):
Download from: https://www.mongodb.com/try/download/community

Option B — MongoDB Atlas (free cloud, no install):
1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Get your connection string and paste it into `.env` as `MONGO_URI`

---

## Step 3 — Start the backend

Open a terminal (Command Prompt or PowerShell) and run these commands **one by one**:

```
cd "C:\Users\krish\OneDrive\Desktop\Ai study helper\Sample\backend"
npm install
npm run dev
```

You should see:
```
✅ MongoDB connected
✅ Server running on http://localhost:5000
```

**Leave this terminal open.** The server must keep running.

---

## Step 4 — Open the frontend

Open `Sample/index.html` in your browser, or use VS Code Live Server (port 5500).

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Cannot reach the server` | Backend is not running — do Step 3 |
| `MongoDB connection error` | MongoDB is not running — start it or use Atlas |
| `OPENROUTER_API_KEY not set` | Add your key to `Sample/backend/.env` |
| `npm: command not found` | Install Node.js from nodejs.org |
| Port 5000 already in use | Change `PORT=5001` in `.env` and `API_BASE` in `js/api.js` |

---

## Your .env file is at:
```
Sample/backend/.env
```
It already has the OpenRouter API key filled in. You only need to update `MONGO_URI` if using Atlas.
