// Redirect if already logged in
if (Auth.isLoggedIn()) window.location.href = 'dashboard.html';

// ─── Card switching ───────────────────────────────────────────────────────────
function showCard(id) {
  ['loginCard', 'registerCard', 'forgotCard'].forEach(c => {
    const el = document.getElementById(c);
    if (el) el.style.display = c === id ? 'block' : 'none';
  });
}

document.getElementById('showRegister')?.addEventListener('click', () => showCard('registerCard'));
document.getElementById('showLogin')?.addEventListener('click',    () => showCard('loginCard'));
document.getElementById('showForgot')?.addEventListener('click',   () => showCard('forgotCard'));
document.getElementById('backToLogin')?.addEventListener('click',  () => showCard('loginCard'));

// ─── Password visibility toggles ─────────────────────────────────────────────
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
}
function clearErrors(...ids) { ids.forEach(id => showFieldError(id, '')); }

function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `form-alert form-alert-${type}`;
  el.style.display = msg ? 'flex' : 'none';
}

// ─── Create a local session (offline / no-DB mode) ────────────────────────────
function localLogin(name, email) {
  const user = {
    _id: 'local_' + Date.now(),
    name: name || email.split('@')[0],
    email,
    isVerified: true,
    location: '',
    field: '',
    preferences: {
      darkMode: true,
      emailNotifications: true,
      autoSaveNotes: true,
      aiSuggestions: false,
      soundEffects: false,
    },
  };
  Auth.setToken('local_token_' + Date.now());
  Auth.setUser(user);
  window.location.href = 'dashboard.html';
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors('loginEmailErr', 'loginPasswordErr');
  showAlert('loginError', '');

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');

  // Client-side validation
  let valid = true;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    showFieldError('loginEmailErr', 'Enter a valid email address');
    valid = false;
  }
  if (!password) {
    showFieldError('loginPasswordErr', 'Password is required');
    valid = false;
  }
  if (!valid) return;

  UI.setLoading(btn, true, 'Signing in...');
  let redirecting = false;

  try {
    const data = await AuthAPI.login(email, password);

    if (!data) {
      // Backend offline — use local session so app is still usable
      redirecting = true;
      showAlert('loginError',
        '⚠️ Server offline — using local mode. AI tools still work.',
        'error'
      );
      setTimeout(() => localLogin(null, email), 1000);
      return;
    }

    // Success — redirect (don't re-enable button, avoids flicker)
    redirecting = true;
    window.location.href = 'dashboard.html';

  } catch (err) {
    showAlert('loginError', err.message);
  } finally {
    // Only reset button if we're NOT redirecting
    if (!redirecting) UI.setLoading(btn, false);
  }
});

// ─── REGISTER ─────────────────────────────────────────────────────────────────
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors('regNameErr', 'regEmailErr', 'regPasswordErr');
  showAlert('registerError', '');

  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const btn      = document.getElementById('registerBtn');

  let valid = true;
  if (!name || name.length < 2)                 { showFieldError('regNameErr',     'Name must be at least 2 characters'); valid = false; }
  if (!email || !/^\S+@\S+\.\S+$/.test(email))  { showFieldError('regEmailErr',    'Enter a valid email address');        valid = false; }
  if (!password || password.length < 6)          { showFieldError('regPasswordErr', 'Password must be at least 6 characters'); valid = false; }
  if (!valid) return;

  UI.setLoading(btn, true, 'Creating account...');
  let redirecting = false;

  try {
    const data = await AuthAPI.register(name, email, password);

    if (!data) {
      // Backend offline — create local account
      redirecting = true;
      showAlert('registerError',
        '⚠️ Server offline — account saved locally. Start the backend to persist data.',
        'error'
      );
      setTimeout(() => localLogin(name, email), 1000);
      return;
    }

    // Success
    redirecting = true;
    showAlert('registerError', '✓ Account created! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);

  } catch (err) {
    showAlert('registerError', err.message);
  } finally {
    if (!redirecting) UI.setLoading(btn, false);
  }
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
document.getElementById('forgotForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  showAlert('forgotError', '');

  const email = document.getElementById('forgotEmail').value.trim();
  const btn   = document.getElementById('forgotBtn');

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    showAlert('forgotError', 'Enter a valid email address.');
    return;
  }

  UI.setLoading(btn, true, 'Sending...');
  try {
    const data = await AuthAPI.forgotPassword(email);

    if (!data) {
      showAlert('forgotError', 'Server is offline. Start the backend to use password reset.', 'error');
      return;
    }

    // Email configured — normal success
    if (!data.resetLink) {
      showAlert('forgotError', data.message || 'Reset link sent! Check your email.', 'success');
      return;
    }

    // Email NOT configured on server — show the reset link directly in the UI
    const alertEl = document.getElementById('forgotError');
    alertEl.className = 'form-alert form-alert-success';
    alertEl.style.display = 'flex';
    alertEl.innerHTML = `
      <div style="width:100%">
        <p style="margin:0 0 8px;font-weight:600;color:#6ee7b7;">⚠️ Email not configured on server.</p>
        <p style="margin:0 0 10px;font-size:13px;color:#94a3b8;">Use this link to reset your password (valid 10 min):</p>
        <a href="${escHtml(data.resetLink)}"
           style="display:block;word-break:break-all;color:#60a5fa;font-size:12px;margin-bottom:12px;text-decoration:underline;"
           target="_blank">${escHtml(data.resetLink)}</a>
        <a href="${escHtml(data.resetLink)}" target="_blank"
           style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">
          Open Reset Page →
        </a>
      </div>`;

  } catch (err) {
    showAlert('forgotError', err.message, 'error');
  } finally {
    UI.setLoading(btn, false);
  }
});

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
