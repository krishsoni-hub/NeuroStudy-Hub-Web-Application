// Dashboard is open to guests — no requireAuth()
// Guests see tools and history; sign-in CTA shown in topbar

// ─── Greeting ─────────────────────────────────────────────────────────────────
const user = Auth.getUser();
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
const firstName = user?.name ? user.name.split(' ')[0] : null;
document.getElementById('greetingText').textContent = firstName
  ? `${greeting}, ${firstName} 👋`
  : `${greeting} 👋`;

// ─── Topbar: show Sign In / Sign Out depending on auth state ──────────────────
const authBtn = document.getElementById('authBtn');
if (authBtn) {
  if (Auth.isLoggedIn()) {
    authBtn.textContent = 'Sign Out';
    authBtn.addEventListener('click', () => {
      if (confirm('Sign out of NeuroStudy Hub?')) Auth.logout();
    });
  } else {
    authBtn.textContent = 'Sign In';
    authBtn.href = 'login.html';
    authBtn.tagName === 'BUTTON'
      ? authBtn.addEventListener('click', () => window.location.href = 'login.html')
      : null;
  }
}

// ─── Dashboard search → redirect to marketplace ───────────────────────────────
const dashSearch = document.getElementById('dashSearch');
if (dashSearch) {
  dashSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) window.location.href = `marketplace.html?q=${encodeURIComponent(q)}`;
    }
  });
}

// ─── Recent tool history ──────────────────────────────────────────────────────
async function loadRecentHistory() {
  const container = document.getElementById('recentHistory');
  if (!container) return;
  try {
    const data = await ToolsAPI.getHistory();
    const history = (data?.history || []).slice(0, 6);

    if (!history.length) {
      container.innerHTML = `<div class="tli-empty">No tool history yet. <a href="marketplace.html">Try a tool!</a></div>`;
      return;
    }

    container.innerHTML = history.map(entry => `
      <div class="tool-list-item">
        <div class="tli-icon blue">${entry.toolIcon || '🔧'}</div>
        <div class="tli-info">
          <span class="tli-name">${escHtml(entry.toolName)}</span>
          <span class="tli-time">${timeAgo(entry.createdAt)}</span>
        </div>
        <a href="marketplace.html" class="tli-action" title="Find similar tools">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<div class="tli-empty">Failed to load history.</div>';
  }
}

// ─── Recent notes (only for logged-in users) ──────────────────────────────────
async function loadRecentNotes() {
  const container = document.getElementById('recentNotes');
  if (!container) return;

  if (!Auth.isLoggedIn()) {
    container.innerHTML = `<div class="tli-empty"><a href="login.html">Sign in</a> to access Smart Notes.</div>`;
    return;
  }

  try {
    const data = await NotesAPI.getAll();
    const notes = (data?.notes || []).slice(0, 4);

    if (!notes.length) {
      container.innerHTML = `<div class="tli-empty">No notes yet. <a href="notes.html">Create one!</a></div>`;
      return;
    }

    container.innerHTML = notes.map(note => `
      <a href="notes.html" class="tool-list-item">
        <div class="tli-icon purple">📝</div>
        <div class="tli-info">
          <span class="tli-name">${escHtml(note.title || 'Untitled')}</span>
          <span class="tli-time">${timeAgo(note.updatedAt)}</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    `).join('');
  } catch {
    container.innerHTML = '<div class="tli-empty">Failed to load notes.</div>';
  }
}

// ─── Guest banner ─────────────────────────────────────────────────────────────
function showGuestBanner() {
  if (Auth.isLoggedIn()) return;
  const banner = document.getElementById('guestBanner');
  if (banner) banner.style.display = 'flex';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
showGuestBanner();
loadRecentHistory();
loadRecentNotes();
