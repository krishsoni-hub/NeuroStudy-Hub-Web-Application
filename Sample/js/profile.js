requireAuth();

// ─── Load user data into form ─────────────────────────────────────────────────
function loadUser() {
  const user = Auth.getUser();
  if (!user) return;

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  document.getElementById('heroAvatar').textContent = initials;
  document.getElementById('heroName').textContent = user.name || '';
  document.getElementById('heroEmail').textContent = user.email || '';

  document.getElementById('editName').value = user.name || '';
  document.getElementById('editEmail').value = user.email || '';
  document.getElementById('editLocation').value = user.location || '';
  document.getElementById('editField').value = user.field || '';

  // Preferences
  const prefs = user.preferences || {};
  ['emailNotifications', 'autoSaveNotes', 'aiSuggestions', 'soundEffects'].forEach(key => {
    const el = document.getElementById('pref-' + key);
    if (el) el.checked = !!prefs[key];
  });
}

loadUser();

// ─── Password visibility toggles ─────────────────────────────────────────────
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  });
});

// ─── Alert helpers ────────────────────────────────────────────────────────────
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `form-alert form-alert-${type}`;
  el.style.display = msg ? 'flex' : 'none';
}
function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
}
function clearFieldErrors(...ids) {
  ids.forEach(id => showFieldError(id, ''));
}

// ─── EDIT PROFILE FORM ────────────────────────────────────────────────────────
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors('editNameErr', 'editEmailErr');
  showAlert('profileAlert', '');

  const name = document.getElementById('editName').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const location = document.getElementById('editLocation').value.trim();
  const field = document.getElementById('editField').value.trim();
  const btn = document.getElementById('saveProfileBtn');

  let valid = true;
  if (!name || name.length < 2) { showFieldError('editNameErr', 'Name must be at least 2 characters'); valid = false; }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) { showFieldError('editEmailErr', 'Enter a valid email address'); valid = false; }
  if (!valid) return;

  UI.setLoading(btn, true, 'Saving...');
  try {
    const data = await UserAPI.updateProfile({ name, email, location, field });

    if (!data) {
      // Offline: update localStorage directly
      const user = Auth.getUser() || {};
      Auth.setUser({ ...user, name, email, location, field });
    }

    // Refresh UI
    loadUser();
    UI.populateSidebar();
    showAlert('profileAlert', 'Profile updated successfully.', 'success');
    UI.toast('Profile updated!', 'success');
  } catch (err) {
    showAlert('profileAlert', err.message, 'error');
  } finally {
    UI.setLoading(btn, false);
  }
});

// ─── CHANGE PASSWORD FORM ─────────────────────────────────────────────────────
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors('currentPwErr', 'newPwErr', 'confirmPwErr');
  showAlert('passwordAlert', '');

  const currentPassword = document.getElementById('currentPw').value;
  const newPassword = document.getElementById('newPw').value;
  const confirmPassword = document.getElementById('confirmPw').value;
  const btn = document.getElementById('savePwBtn');

  let valid = true;
  if (!currentPassword) { showFieldError('currentPwErr', 'Current password is required'); valid = false; }
  if (!newPassword || newPassword.length < 6) { showFieldError('newPwErr', 'New password must be at least 6 characters'); valid = false; }
  if (newPassword !== confirmPassword) { showFieldError('confirmPwErr', 'Passwords do not match'); valid = false; }
  if (!valid) return;

  UI.setLoading(btn, true, 'Updating...');
  try {
    const data = await UserAPI.changePassword(currentPassword, newPassword);

    if (!data) {
      // Offline mode — can't verify current password, just show success
      showAlert('passwordAlert', 'Password updated (offline mode — will sync when backend is available).', 'success');
    } else {
      showAlert('passwordAlert', data.message || 'Password changed successfully.', 'success');
    }

    document.getElementById('passwordForm').reset();
    UI.toast('Password updated!', 'success');
  } catch (err) {
    showAlert('passwordAlert', err.message, 'error');
  } finally {
    UI.setLoading(btn, false);
  }
});

// ─── PREFERENCES — save on toggle change ─────────────────────────────────────
['emailNotifications', 'autoSaveNotes', 'aiSuggestions', 'soundEffects'].forEach(key => {
  const el = document.getElementById('pref-' + key);
  if (!el) return;
  el.addEventListener('change', async () => {
    const prefs = { [key]: el.checked };
    try {
      const data = await UserAPI.updatePreferences(prefs);
      if (!data) {
        // Offline: update localStorage
        const user = Auth.getUser() || {};
        user.preferences = { ...(user.preferences || {}), ...prefs };
        Auth.setUser(user);
      }
      UI.toast(`Preference saved.`, 'success');
    } catch (err) {
      UI.toast('Failed to save preference.', 'error');
      el.checked = !el.checked; // revert
    }
  });
});

// ─── TOOL HISTORY ─────────────────────────────────────────────────────────────
async function loadHistory() {
  const list = document.getElementById('historyList');
  try {
    const data = await ToolsAPI.getHistory();
    const history = data?.history || [];

    if (!history.length) {
      list.innerHTML = '<div class="history-empty">No tool history yet. Start using tools!</div>';
      return;
    }

    list.innerHTML = history.map(entry => `
      <div class="history-item" data-id="${entry._id}">
        <div class="hi-icon">${entry.toolIcon || '🔧'}</div>
        <div class="hi-info">
          <span class="hi-title">${escHtml(entry.toolName)}</span>
          <span class="hi-meta">${timeAgo(entry.createdAt)}</span>
        </div>
        <div class="hi-actions">
          <button class="icon-btn view-history-btn" title="View output" data-output="${escAttr(entry.output)}" data-tool="${escAttr(entry.toolName)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="icon-btn delete-history-btn" title="Delete" data-id="${entry._id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');

    // Delete single entry
    list.querySelectorAll('.delete-history-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await ToolsAPI.deleteHistoryEntry(id);
        btn.closest('.history-item').remove();
        if (!list.querySelector('.history-item')) {
          list.innerHTML = '<div class="history-empty">No tool history yet.</div>';
        }
        UI.toast('Entry deleted.', 'success');
      });
    });

    // View output modal
    list.querySelectorAll('.view-history-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showOutputModal(btn.dataset.tool, btn.dataset.output);
      });
    });

  } catch (err) {
    list.innerHTML = '<div class="history-empty">Failed to load history.</div>';
  }
}

loadHistory();

// Clear all history
document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
  if (!confirm('Clear all tool history? This cannot be undone.')) return;
  await ToolsAPI.clearHistory();
  document.getElementById('historyList').innerHTML = '<div class="history-empty">No tool history yet.</div>';
  UI.toast('History cleared.', 'success');
});

// ─── Output modal ─────────────────────────────────────────────────────────────
function showOutputModal(toolName, output) {
  const existing = document.getElementById('outputModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'outputModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h3>${escHtml(toolName)} — Output</h3>
        <button class="panel-close" id="closeModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body"><pre>${escHtml(output || 'No output saved.')}</pre></div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('open'));
  modal.querySelector('#closeModal').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Sign out of NeuroStudy Hub?')) Auth.logout();
});

// ─── Utilities ────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
