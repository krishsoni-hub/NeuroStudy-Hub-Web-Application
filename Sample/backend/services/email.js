/**
 * email.js — Nodemailer + Gmail SMTP
 * Welcome email includes: name, email, password, platform intro.
 * Verification email is DISABLED — not sent on register.
 */
const nodemailer = require('nodemailer');

function isConfigured() {
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';
  return (
    user.includes('@') &&
    !user.includes('your_gmail') &&
    pass.length >= 16 &&
    pass !== 'PASTE_YOUR_16_CHAR_APP_PASSWORD_HERE' &&
    !pass.includes('your_app_password')
  );
}

let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, ''),
    },
    tls: { rejectUnauthorized: false },
  });
  return _transporter;
}

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5500';

function wrap(bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;color:#f1f5f9}
  .wrap{max-width:560px;margin:24px auto;background:#1e293b;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)}
  .hdr{background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:28px 32px;text-align:center}
  .hdr h1{margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px}
  .hdr p{margin:5px 0 0;font-size:13px;color:rgba(255,255,255,0.8)}
  .bdy{padding:28px 32px}
  h2{font-size:18px;font-weight:700;margin:0 0 12px;color:#f1f5f9}
  p{font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 14px}
  .info-box{background:#263348;border-radius:10px;padding:16px 20px;margin:16px 0}
  .info-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px}
  .info-row:last-child{border-bottom:none}
  .info-label{color:#64748b;font-weight:500}
  .info-value{color:#f1f5f9;font-weight:600;word-break:break-all}
  .btn{display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin:8px 0}
  .features{margin:16px 0;padding:0;list-style:none}
  .features li{padding:6px 0;font-size:14px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.05)}
  .features li:last-child{border-bottom:none}
  .features li::before{content:"✓ ";color:#3b82f6;font-weight:700}
  .note{font-size:12px;color:#64748b;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)}
  .ftr{padding:16px 32px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;font-size:11px;color:#64748b}
</style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1>NeuroStudy Hub</h1>
      <p>AI-Powered Learning Platform</p>
    </div>
    <div class="bdy">${bodyHtml}</div>
    <div class="ftr">© ${new Date().getFullYear()} NeuroStudy Hub. All rights reserved.</div>
  </div>
</body>
</html>`;
}

async function send({ to, subject, html }) {
  if (!isConfigured()) {
    console.warn(`[Email] Skipping — credentials not configured in .env`);
    return false;
  }
  const from = process.env.EMAIL_FROM || `"NeuroStudy Hub" <${process.env.EMAIL_USER}>`;
  try {
    await getTransporter().sendMail({ from, to, subject, html });
    console.log(`[Email] ✅ "${subject}" → ${to}`);
    return true;
  } catch (err) {
    _transporter = null;
    console.error(`[Email] ❌ "${subject}" → ${to}: ${err.message}`);
    throw err;
  }
}

// ─── Welcome email — includes name, email, password ───────────────────────────
async function sendWelcome({ name, email, password }) {
  const html = wrap(`
    <h2>Welcome to NeuroStudy Hub, ${name}! 🎉</h2>
    <p>Your account has been created successfully. Here are your login details — save them somewhere safe.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Full Name</span>
        <span class="info-value">${name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value">${email}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Password</span>
        <span class="info-value">${password}</span>
      </div>
    </div>

    <p>With NeuroStudy Hub you get access to:</p>
    <ul class="features">
      <li>100+ AI-powered study and productivity tools</li>
      <li>Summarizer, Essay Writer, Flashcard Generator</li>
      <li>Code Assistant, Math Solver, Translator</li>
      <li>Smart Notes with auto-save</li>
      <li>Voice input and text-to-speech on all tools</li>
    </ul>

    <a href="${FRONTEND}/dashboard.html" class="btn">Go to Dashboard →</a>

    <p class="note">Keep this email safe — it contains your password. If you didn't create this account, contact us immediately.</p>
  `);
  return send({ to: email, subject: 'Welcome to NeuroStudy Hub 🚀 — Your Account Details', html });
}

// ─── Password reset ───────────────────────────────────────────────────────────
async function sendPasswordReset({ name, email, token }) {
  const link = `${FRONTEND}/reset-password.html?token=${token}`;
  const html = wrap(`
    <h2>Reset your password</h2>
    <p>Hi ${name}, we received a request to reset your NeuroStudy Hub password. Click the button below to set a new password.</p>
    <a href="${link}" class="btn">Reset Password</a>
    <p class="note">This link expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email — your password won't change.</p>
  `);
  return send({ to: email, subject: 'Reset your NeuroStudy Hub password', html });
}

// sendVerification kept for manual use only — NOT called on register
async function sendVerification({ name, email, token }) {
  const link = `${FRONTEND}/verify-email.html?token=${token}`;
  const html = wrap(`
    <h2>Verify your email</h2>
    <p>Hi ${name}, click the button below to verify your email address.</p>
    <a href="${link}" class="btn">Verify Email Address</a>
    <p class="note">This link expires in 24 hours.</p>
  `);
  return send({ to: email, subject: 'Verify your NeuroStudy Hub email', html });
}

module.exports = { sendWelcome, sendVerification, sendPasswordReset, isConfigured };
