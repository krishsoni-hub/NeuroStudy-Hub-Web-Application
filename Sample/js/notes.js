requireAuth();

let allNotes = [];
let activeNoteId = null;
let autoSaveTimer = null;

// ─── Load all notes ───────────────────────────────────────────────────────────
async function loadNotes() {
  const list = document.getElementById('notesList');
  try {
    const data = await NotesAPI.getAll();
    allNotes = data?.notes || [];
    renderNotesList(allNotes);
  } catch (err) {
    list.innerHTML = '<div class="notes-loading">Failed to load notes.</div>';
  }
}

function renderNotesList(notes) {
  const list = document.getElementById('notesList');
  if (!notes.length) {
    list.innerHTML = '<div class="notes-empty">No notes yet. Create your first note!</div>';
    return;
  }
  list.innerHTML = notes.map(note => `
    <div class="note-item ${note._id === activeNoteId ? 'active' : ''} ${note.pinned ? 'pinned' : ''}" data-id="${note._id}">
      <div class="note-item-header">
        <span class="note-item-title">${escHtml(note.title || 'Untitled')}</span>
        ${note.pinned ? '<span class="pin-badge">📌</span>' : ''}
      </div>
      <p class="note-item-preview">${escHtml((note.content || '').slice(0, 80))}${(note.content || '').length > 80 ? '...' : ''}</p>
      <span class="note-item-date">${timeAgo(note.updatedAt)}</span>
    </div>
  `).join('');

  list.querySelectorAll('.note-item').forEach(item => {
    item.addEventListener('click', () => openNote(item.dataset.id));
  });
}

// ─── Open note in editor ──────────────────────────────────────────────────────
function openNote(id) {
  const note = allNotes.find(n => n._id === id);
  if (!note) return;

  activeNoteId = id;
  document.getElementById('editorEmpty').style.display = 'none';
  document.getElementById('editorActive').style.display = 'flex';

  document.getElementById('noteTitle').value = note.title || '';
  document.getElementById('noteContent').value = note.content || '';
  document.getElementById('noteTags').value = (note.tags || []).join(', ');

  const pinBtn = document.getElementById('pinNoteBtn');
  pinBtn.innerHTML = note.pinned
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Unpin'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Pin';

  // Highlight active in list
  document.querySelectorAll('.note-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });

  setEditorStatus('');
}

// ─── New note ─────────────────────────────────────────────────────────────────
function createNewNote() {
  activeNoteId = null;
  document.getElementById('editorEmpty').style.display = 'none';
  document.getElementById('editorActive').style.display = 'flex';
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteContent').value = '';
  document.getElementById('noteTags').value = '';
  document.getElementById('noteTitle').focus();
  setEditorStatus('');
  document.querySelectorAll('.note-item').forEach(el => el.classList.remove('active'));
}

document.getElementById('newNoteBtn').addEventListener('click', createNewNote);
document.getElementById('newNoteBtn2').addEventListener('click', createNewNote);

// ─── Save note ────────────────────────────────────────────────────────────────
async function saveNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value;
  const tagsRaw = document.getElementById('noteTags').value;
  const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
  const btn = document.getElementById('saveNoteBtn');

  if (!title) {
    setEditorStatus('Title is required.', 'error');
    document.getElementById('noteTitle').focus();
    return;
  }

  UI.setLoading(btn, true, 'Saving...');
  try {
    if (activeNoteId) {
      const data = await NotesAPI.update(activeNoteId, { title, content, tags });
      const idx = allNotes.findIndex(n => n._id === activeNoteId);
      if (idx !== -1) allNotes[idx] = data.note;
    } else {
      const data = await NotesAPI.create(title, content, tags);
      allNotes.unshift(data.note);
      activeNoteId = data.note._id;
    }

    renderNotesList(allNotes);
    // Re-highlight active
    document.querySelectorAll('.note-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === activeNoteId);
    });
    setEditorStatus('Saved ✓', 'success');
    UI.toast('Note saved!', 'success');
  } catch (err) {
    setEditorStatus(err.message, 'error');
  } finally {
    UI.setLoading(btn, false);
  }
}

document.getElementById('saveNoteBtn').addEventListener('click', saveNote);

// ─── Auto-save on typing ──────────────────────────────────────────────────────
const user = Auth.getUser();
const autoSave = user?.preferences?.autoSaveNotes !== false;

['noteTitle', 'noteContent', 'noteTags'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    if (!autoSave) return;
    setEditorStatus('Unsaved changes...', 'info');
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      if (activeNoteId) saveNote();
    }, 2000);
  });
});

// ─── Pin / Unpin ──────────────────────────────────────────────────────────────
document.getElementById('pinNoteBtn').addEventListener('click', async () => {
  if (!activeNoteId) return;
  const note = allNotes.find(n => n._id === activeNoteId);
  if (!note) return;

  try {
    const data = await NotesAPI.update(activeNoteId, { pinned: !note.pinned });
    const idx = allNotes.findIndex(n => n._id === activeNoteId);
    if (idx !== -1) allNotes[idx] = data.note;
    // Re-sort: pinned first
    allNotes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    renderNotesList(allNotes);
    openNote(activeNoteId);
    UI.toast(data.note.pinned ? 'Note pinned.' : 'Note unpinned.', 'success');
  } catch (err) {
    UI.toast('Failed to update pin.', 'error');
  }
});

// ─── Delete note ──────────────────────────────────────────────────────────────
document.getElementById('deleteNoteBtn').addEventListener('click', async () => {
  if (!activeNoteId) return;
  if (!confirm('Delete this note? This cannot be undone.')) return;

  try {
    await NotesAPI.delete(activeNoteId);
    allNotes = allNotes.filter(n => n._id !== activeNoteId);
    activeNoteId = null;
    renderNotesList(allNotes);
    document.getElementById('editorActive').style.display = 'none';
    document.getElementById('editorEmpty').style.display = 'flex';
    UI.toast('Note deleted.', 'success');
  } catch (err) {
    UI.toast('Failed to delete note.', 'error');
  }
});

// ─── Search notes ─────────────────────────────────────────────────────────────
document.getElementById('notesSearch').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) { renderNotesList(allNotes); return; }
  const filtered = allNotes.filter(n =>
    (n.title || '').toLowerCase().includes(q) ||
    (n.content || '').toLowerCase().includes(q) ||
    (n.tags || []).some(t => t.toLowerCase().includes(q))
  );
  renderNotesList(filtered);
});

// ─── Keyboard shortcut: Ctrl+S to save ───────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (document.getElementById('editorActive').style.display !== 'none') {
      saveNote();
    }
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setEditorStatus(msg, type = '') {
  const el = document.getElementById('editorStatus');
  el.textContent = msg;
  el.className = 'editor-status' + (type ? ` status-${type}` : '');
}

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
loadNotes();
