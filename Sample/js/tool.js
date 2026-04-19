// Tool page — text input only, real AI via OpenRouter

// ─── URL params ───────────────────────────────────────────────────────────────
const params   = new URLSearchParams(window.location.search);
const toolName = params.get('tool') || 'Summarizer';
const toolIcon = decodeURIComponent(params.get('icon') || '📄');

// ─── Tool metadata ────────────────────────────────────────────────────────────
const TOOL_META = {
  'Summarizer':          { desc: 'Condense lengthy documents into clear, concise summaries.',       tags: ['Research', 'Productivity'] },
  'Essay Writer':        { desc: 'Generate well-structured essays on any topic.',                   tags: ['Writing', 'Academic'] },
  'Flashcard Generator': { desc: 'Automatically generate study flashcards from any content.',       tags: ['Study', 'Memory'] },
  'Code Assistant':      { desc: 'Write, debug, and explain code in any language.',                 tags: ['Coding', 'Dev'] },
  'Translator':          { desc: 'Convert hard English into easy Hinglish — the way people actually speak in India.',  tags: ['Language', 'Hinglish'] },
  'Math Solver':         { desc: 'Solve equations step-by-step.',                                   tags: ['Math', 'Academic'] },
  'Research Assistant':  { desc: 'Analyze and synthesize information on any topic.',                tags: ['Research'] },
  'Grammar Checker':     { desc: 'Fix grammar, spelling, and punctuation errors.',                  tags: ['Writing'] },
  'Blog Post Generator': { desc: 'Create SEO-optimized blog content instantly.',                    tags: ['Writing', 'Marketing'] },
  'Email Composer':      { desc: 'Write professional emails in seconds.',                           tags: ['Writing', 'Productivity'] },
  'Paraphraser':         { desc: 'Rephrase text while preserving meaning.',                         tags: ['Writing'] },
  'Citation Generator':  { desc: 'Auto-generate APA, MLA, and Chicago citations.',                 tags: ['Research', 'Academic'] },
  'Abstract Writer':     { desc: 'Write concise academic abstracts.',                               tags: ['Research', 'Academic'] },
  'Study Planner':       { desc: 'Create a personalized study schedule.',                           tags: ['Productivity'] },
  'Vocabulary Builder':  { desc: 'Extract and explain key vocabulary from any text.',               tags: ['Language', 'Study'] },
  'Cover Letter Writer': { desc: 'Craft personalized cover letters for job applications.',          tags: ['Writing', 'Career'] },
  'Bug Detector':        { desc: 'Identify and fix bugs in your code.',                             tags: ['Coding'] },
  'Code Explainer':      { desc: 'Get plain-English explanations of complex code.',                 tags: ['Coding'] },
  'Science Explainer':   { desc: 'Explain complex scientific concepts simply.',                     tags: ['Science'] },
  'Idea Generator':      { desc: 'Brainstorm creative ideas on any topic.',                         tags: ['Creative', 'Productivity'] },
};

const meta = TOOL_META[toolName] || { desc: `AI-powered ${toolName.toLowerCase()} tool.`, tags: ['AI'] };

// ─── Populate header ──────────────────────────────────────────────────────────
document.title = `${toolName} — NeuroStudy Hub`;
document.querySelectorAll('#toolPageTitle').forEach(el => el.textContent = toolName);
const iconEl = document.getElementById('toolPageIcon');
if (iconEl) iconEl.textContent = toolIcon;
const descEl = document.getElementById('toolPageDesc');
if (descEl) descEl.textContent = meta.desc;
const tagsEl = document.getElementById('toolPageTags');
if (tagsEl) tagsEl.innerHTML = meta.tags.map(t => `<span class="tag">${t}</span>`).join('');

// ─── Init after DOM ready ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Auth button
  const authBtn = document.getElementById('authBtn');
  if (authBtn && Auth.isLoggedIn()) {
    authBtn.textContent = 'Sign Out';
    authBtn.removeAttribute('href');
    authBtn.addEventListener('click', () => { if (confirm('Sign out?')) Auth.logout(); });
  }

  // Wire mic button — Voice is guaranteed loaded by this point
  Voice.attachMic('inputText', 'toolMicBtn');
});

// ─── Option pills ─────────────────────────────────────────────────────────────
document.querySelectorAll('.option-pills').forEach(group => {
  group.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });
});

function getSelectedPill(labelText) {
  for (const group of document.querySelectorAll('.option-group')) {
    const lbl = group.querySelector('label')?.textContent?.trim().toLowerCase() || '';
    if (lbl.includes(labelText.toLowerCase())) {
      const active = group.querySelector('.pill.active');
      return active ? active.textContent.trim().toLowerCase() : null;
    }
  }
  return null;
}

// ─── RUN ──────────────────────────────────────────────────────────────────────
const runBtn = document.getElementById('runBtn');
if (runBtn) runBtn.addEventListener('click', runTool);

async function runTool() {
  const inputEl = document.getElementById('inputText');
  const input   = inputEl.value.trim();

  if (!input) {
    inputEl.classList.add('input-error');
    inputEl.placeholder = 'Please enter some text first…';
    inputEl.focus();
    setTimeout(() => {
      inputEl.classList.remove('input-error');
      inputEl.placeholder = 'Type or paste your text here…';
    }, 2500);
    return;
  }

  const outputLength = getSelectedPill('length') || getSelectedPill('output') || 'medium';
  const format       = getSelectedPill('format') || 'paragraph';

  showLoading();
  UI.setLoading(runBtn, true, 'Running AI…');

  try {
    const data = await ToolsAPI.run(toolName, toolIcon, input, outputLength, format);
    showResult(data.output || 'No output returned.');
  } catch (err) {
    showIdle();
    UI.toast(err.message || 'Tool run failed. Please try again.', 'error');
  } finally {
    UI.setLoading(runBtn, false);
  }
}

// ─── Loading / idle / result states ──────────────────────────────────────────
let _stepInterval = null;

function showLoading() {
  clearInterval(_stepInterval);
  document.getElementById('outputIdle').style.display    = 'none';
  document.getElementById('outputResult').style.display  = 'none';
  document.getElementById('outputLoading').style.display = 'flex';
  document.getElementById('outputActions').style.display = 'none';

  const steps = [
    { id: 'step1', label: 'Reading input' },
    { id: 'step2', label: 'Sending to AI' },
    { id: 'step3', label: 'Generating output' },
  ];
  steps.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) { el.className = 'load-step'; el.textContent = s.label; }
  });

  let idx = 0;
  _stepInterval = setInterval(() => {
    if (idx > 0) {
      const prev = document.getElementById(steps[idx - 1]?.id);
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); prev.textContent = '✓ ' + steps[idx - 1].label; }
    }
    if (idx < steps.length) {
      document.getElementById(steps[idx].id)?.classList.add('active');
      idx++;
    } else {
      clearInterval(_stepInterval);
    }
  }, 900);
}

function showIdle() {
  clearInterval(_stepInterval);
  document.getElementById('outputLoading').style.display = 'none';
  document.getElementById('outputIdle').style.display    = 'flex';
}

function showResult(output) {
  clearInterval(_stepInterval);
  document.getElementById('outputLoading').style.display = 'none';
  document.getElementById('outputResult').style.display  = 'flex';
  document.getElementById('outputActions').style.display = 'flex';

  const resultText = document.getElementById('resultText');
  document.getElementById('wordCount').textContent = `${output.trim().split(/\s+/).length} words`;

  resultText.innerHTML = output
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

// ─── Copy ─────────────────────────────────────────────────────────────────────
document.getElementById('copyBtn')?.addEventListener('click', async () => {
  const text = document.getElementById('resultText').innerText;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const btn  = document.getElementById('copyBtn');
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    UI.toast('Copied!', 'success');
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  } catch {
    UI.toast('Copy failed — select text manually.', 'error');
  }
});

// ─── Speak ────────────────────────────────────────────────────────────────────
document.getElementById('speakBtn')?.addEventListener('click', () => {
  const text = document.getElementById('resultText').innerText;
  if (text) Voice.speak(text, 'speakBtn');
});

// ─── Download ─────────────────────────────────────────────────────────────────
document.getElementById('downloadBtn')?.addEventListener('click', () => {
  const text = document.getElementById('resultText').innerText;
  if (!text) return;
  const a = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob([text], { type: 'text/plain' })),
    download: `${toolName.replace(/\s+/g, '_')}_output.txt`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
  UI.toast('Downloaded!', 'success');
});
