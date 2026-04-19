/**
 * api.js — NeuroStudy Hub frontend API client
 * - Real AI via OpenRouter (Mistral-7B) backend
 * - JWT auth with localStorage
 * - Guest mode with localStorage fallback
 * - Signup nudge after guest tool use
 */

// Auto-detect: use the current hostname so it works on both PC and mobile
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : `http://${window.location.hostname}:5000/api`;

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('nsh_token'),
  setToken: (t) => localStorage.setItem('nsh_token', t),

  getUser: () => {
    try { return JSON.parse(localStorage.getItem('nsh_user')); } catch { return null; }
  },
  setUser: (u) => localStorage.setItem('nsh_user', JSON.stringify(u)),

  isLoggedIn: () => !!localStorage.getItem('nsh_token'),

  logout: () => {
    localStorage.removeItem('nsh_token');
    localStorage.removeItem('nsh_user');
    window.location.href = 'login.html';
  },

  // Refresh user data from backend and update localStorage
  async refresh() {
    const data = await apiFetch('/auth/me').catch(() => null);
    if (data?.user) {
      Auth.setUser(data.user);
      UI.populateSidebar();
    }
  },
};

// ─── Guest session ────────────────────────────────────────────────────────────
const GuestSession = {
  _key: 'nsh_guest_runs',
  getCount: () => parseInt(localStorage.getItem(GuestSession._key) || '0', 10),
  increment() {
    const n = this.getCount() + 1;
    localStorage.setItem(this._key, String(n));
    return n;
  },
  reset: () => localStorage.removeItem(GuestSession._key),

  async mergeIntoAccount() {
    const history = LocalHistory.getAll().filter(e => e._id.startsWith('local_'));
    for (const entry of history) {
      await apiFetch('/tools/history', {
        method: 'POST',
        body: JSON.stringify({
          toolName: entry.toolName,
          toolIcon: entry.toolIcon,
          input: entry.input,
          output: entry.output,
        }),
      }).catch(() => {});
    }
    this.reset();
  },
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Only auto-logout on 401 if we're NOT on an auth endpoint
      // (prevents redirect loop when login credentials are wrong)
      if (res.status === 401 && !path.startsWith('/auth/')) {
        Auth.logout();
        return;
      }
      // DB not connected — return null so callers use offline fallback
      if (res.status === 503 && data.error === 'db_not_connected') {
        return null;
      }
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    if (
      err instanceof TypeError ||
      err.message.includes('Failed to fetch') ||
      err.message.includes('NetworkError') ||
      err.message.includes('fetch')
    ) {
      return null; // backend offline
    }
    throw err;
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
const AuthAPI = {
  async register(name, email, password) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data?.token) {
      Auth.setToken(data.token);
      Auth.setUser(data.user);
      await GuestSession.mergeIntoAccount();
    }
    return data;
  },

  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.token) {
      Auth.setToken(data.token);
      Auth.setUser(data.user);
      await GuestSession.mergeIntoAccount();
    }
    return data;
  },

  async me() {
    const data = await apiFetch('/auth/me');
    if (data?.user) Auth.setUser(data.user);
    return data;
  },

  async forgotPassword(email) {
    return apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token, password) {
    return apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  async verifyEmail(token) {
    return apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  },

  async resendVerification(email) {
    return apiFetch('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

// ─── User API ─────────────────────────────────────────────────────────────────
const UserAPI = {
  async updateProfile(fields) {
    const data = await apiFetch('/user/update', {
      method: 'PUT',
      body: JSON.stringify(fields),
    });
    if (data?.user) Auth.setUser(data.user);
    return data;
  },

  async changePassword(currentPassword, newPassword) {
    return apiFetch('/user/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async updatePreferences(prefs) {
    const data = await apiFetch('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    });
    if (data?.user) Auth.setUser(data.user);
    return data;
  },
};

// ─── Notes API ────────────────────────────────────────────────────────────────
const NotesAPI = {
  async getAll() {
    if (!Auth.isLoggedIn()) return { notes: LocalNotes.getAll() };
    const data = await apiFetch('/notes');
    return data || { notes: LocalNotes.getAll() };
  },

  async create(title, content, tags = []) {
    if (!Auth.isLoggedIn()) return { note: LocalNotes.create(title, content, tags) };
    const data = await apiFetch('/notes', {
      method: 'POST',
      body: JSON.stringify({ title, content, tags }),
    });
    return data || { note: LocalNotes.create(title, content, tags) };
  },

  async update(id, fields) {
    if (!Auth.isLoggedIn() || id.startsWith('local_')) {
      return { note: LocalNotes.update(id, fields) };
    }
    const data = await apiFetch(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fields),
    });
    return data || { note: LocalNotes.update(id, fields) };
  },

  async delete(id) {
    if (!Auth.isLoggedIn() || id.startsWith('local_')) {
      LocalNotes.delete(id);
      return { message: 'Note deleted.' };
    }
    const data = await apiFetch(`/notes/${id}`, { method: 'DELETE' });
    if (!data) LocalNotes.delete(id);
    return data || { message: 'Note deleted.' };
  },
};

// ─── Tools API ────────────────────────────────────────────────────────────────
const ToolsAPI = {
  /**
   * Run an AI tool.
   * @param {string} toolName
   * @param {string} toolIcon
   * @param {string} input
   * @param {string} outputLength  'short' | 'medium' | 'detailed'
   * @param {string} format        'paragraph' | 'bullet'
   */
  async run(toolName, toolIcon, input, outputLength = 'medium', format = 'paragraph') {
    // Try backend (works for both guests and logged-in users)
    const data = await apiFetch('/tools/run', {
      method: 'POST',
      body: JSON.stringify({ toolName, toolIcon, input, outputLength, format }),
    });

    if (data) {
      // Backend responded — save to local history too for offline access
      LocalHistory.add(toolName, toolIcon, input, data.output);

      // Guest nudge
      if (!Auth.isLoggedIn()) {
        const count = GuestSession.increment();
        if (count >= 2) setTimeout(() => SignupNudge.show(), 800);
      }
      return data;
    }

    // Backend offline — use local fallback
    const offlineOutput = _offlineOutput(toolName, input);
    LocalHistory.add(toolName, toolIcon, input, offlineOutput);
    if (!Auth.isLoggedIn()) {
      const count = GuestSession.increment();
      if (count >= 2) setTimeout(() => SignupNudge.show(), 800);
    }
    return { output: offlineOutput };
  },

  async getHistory() {
    if (!Auth.isLoggedIn()) return { history: LocalHistory.getAll() };
    const data = await apiFetch('/tools/history');
    return data || { history: LocalHistory.getAll() };
  },

  async deleteHistoryEntry(id) {
    if (!Auth.isLoggedIn() || id.startsWith('local_')) {
      LocalHistory.delete(id);
      return { message: 'Deleted.' };
    }
    const data = await apiFetch(`/tools/history/${id}`, { method: 'DELETE' });
    if (!data) LocalHistory.delete(id);
    return data || { message: 'Deleted.' };
  },

  async clearHistory() {
    if (!Auth.isLoggedIn()) { LocalHistory.clear(); return { message: 'Cleared.' }; }
    const data = await apiFetch('/tools/history', { method: 'DELETE' });
    if (!data) LocalHistory.clear();
    return data || { message: 'Cleared.' };
  },
};

// Offline fallback output (shown when backend is unreachable)
function _offlineOutput(toolName, input) {
  const words = input.trim().split(/\s+/).length;
  return `⚠️ Backend Offline\n\nCould not reach the AI server at http://localhost:5000.\n\nTo get real AI output:\n1. Open a terminal and run:\n   cd Sample/backend\n   npm install\n   npm run dev\n\n2. Copy .env.example to .env and add:\n   OPENROUTER_API_KEY=sk-or-v1-...\n   (Free key at https://openrouter.ai)\n\nInput received: ${words} words.`;
}

// ─── LocalStorage fallbacks ───────────────────────────────────────────────────
const LocalNotes = {
  _key: 'nsh_notes',
  getAll() { try { return JSON.parse(localStorage.getItem(this._key)) || []; } catch { return []; } },
  save(notes) { localStorage.setItem(this._key, JSON.stringify(notes)); },
  create(title, content, tags) {
    const notes = this.getAll();
    const note = { _id: 'local_' + Date.now(), title, content, tags, pinned: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    notes.unshift(note);
    this.save(notes);
    return note;
  },
  update(id, fields) {
    const notes = this.getAll();
    const idx = notes.findIndex(n => n._id === id);
    if (idx === -1) return null;
    notes[idx] = { ...notes[idx], ...fields, updatedAt: new Date().toISOString() };
    this.save(notes);
    return notes[idx];
  },
  delete(id) { this.save(this.getAll().filter(n => n._id !== id)); },
};

const LocalHistory = {
  _key: 'nsh_history',
  getAll() { try { return JSON.parse(localStorage.getItem(this._key)) || []; } catch { return []; } },
  save(h) { localStorage.setItem(this._key, JSON.stringify(h)); },
  add(toolName, toolIcon, input, output) {
    const h = this.getAll();
    h.unshift({ _id: 'local_' + Date.now(), toolName, toolIcon, input, output, createdAt: new Date().toISOString() });
    if (h.length > 50) h.pop();
    this.save(h);
  },
  delete(id) { this.save(this.getAll().filter(e => e._id !== id)); },
  clear() { localStorage.removeItem(this._key); },
};

// ─── Signup Nudge ─────────────────────────────────────────────────────────────
const SignupNudge = {
  _shown: false,
  show() {
    if (this._shown || Auth.isLoggedIn()) return;
    if (localStorage.getItem('nsh_nudge_dismissed')) return;
    this._shown = true;

    const el = document.createElement('div');
    el.id = 'signupNudge';
    el.className = 'signup-nudge';
    el.innerHTML = `
      <div class="nudge-box">
        <button class="nudge-close" id="nudgeClose" aria-label="Dismiss">✕</button>
        <div class="nudge-icon">🚀</div>
        <h3>Save your progress</h3>
        <p>Sign up free to save your AI results, create notes, and sync across devices.</p>
        <div class="nudge-actions">
          <a href="login.html" class="btn btn-primary">Create Free Account</a>
          <button class="btn btn-ghost" id="nudgeDismiss">Maybe later</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('open'));
    el.querySelector('#nudgeClose').addEventListener('click', () => SignupNudge.dismiss());
    el.querySelector('#nudgeDismiss').addEventListener('click', () => SignupNudge.dismiss());
    el.addEventListener('click', (e) => { if (e.target === el) SignupNudge.dismiss(); });
  },
  dismiss() {
    const el = document.getElementById('signupNudge');
    if (el) { el.classList.remove('open'); setTimeout(() => el.remove(), 300); }
    localStorage.setItem('nsh_nudge_dismissed', '1');
    setTimeout(() => localStorage.removeItem('nsh_nudge_dismissed'), 3600000);
  },
};

// ─── UI helpers ───────────────────────────────────────────────────────────────
const UI = {
  toast(message, type = 'success') {
    const existing = document.getElementById('nsh-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'nsh-toast';
    toast.className = `nsh-toast nsh-toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
  },

  setLoading(btn, loading, loadingText) {
    if (loading) {
      btn.disabled = true;
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = `<span class="btn-spinner"></span> ${loadingText || 'Loading...'}`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.original || 'Submit';
    }
  },

  populateSidebar() {
    const user = Auth.getUser();
    if (!user) {
      document.querySelectorAll('.user-name').forEach(el => el.textContent = 'Guest');
      document.querySelectorAll('.user-avatar, .user-avatar-btn').forEach(el => el.textContent = '?');
      return;
    }
    const initials = user.name
      ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      : '?';
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name || '');
    document.querySelectorAll('.user-avatar, .user-avatar-btn').forEach(el => el.textContent = initials);
  },
};

// ─── requireAuth — only for protected pages ───────────────────────────────────
function requireAuth() {
  if (!Auth.isLoggedIn()) window.location.href = 'login.html';
}

// ─── On every page: populate sidebar + refresh user from backend ──────────────
document.addEventListener('DOMContentLoaded', () => {
  UI.populateSidebar();
  // Silently refresh user data from backend if logged in
  if (Auth.isLoggedIn()) {
    Auth.refresh().catch(() => {});
  }
});
