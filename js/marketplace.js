// Marketplace is open to guests — no requireAuth()
// Each tool has: icon, name, desc, cat, link (external URL)

const TOOLS = [
  // ── Writing ──────────────────────────────────────────────────────────────
  { icon: '✍️', name: 'Essay Writer',          desc: 'Generate well-structured essays on any topic',          cat: 'writing',      link: 'https://www.jasper.ai' },
  { icon: '📝', name: 'Blog Post Generator',   desc: 'Create SEO-optimized blog content instantly',           cat: 'writing',      link: 'https://www.copy.ai' },
  { icon: '📧', name: 'Email Composer',         desc: 'Write professional emails in seconds',                  cat: 'writing',      link: 'https://www.lavender.ai' },
  { icon: '📖', name: 'Story Generator',        desc: 'Create compelling short stories and narratives',        cat: 'writing',      link: 'https://www.sudowrite.com' },
  { icon: '🗞️', name: 'Article Rewriter',      desc: 'Rewrite content while preserving meaning',              cat: 'writing',      link: 'https://quillbot.com' },
  { icon: '✒️', name: 'Cover Letter Writer',   desc: 'Craft personalized cover letters for jobs',             cat: 'writing',      link: 'https://www.kickresume.com' },
  { icon: '📜', name: 'Resume Builder',         desc: 'Build ATS-friendly resumes with AI',                   cat: 'writing',      link: 'https://www.resumeai.io' },
  { icon: '💬', name: 'Paraphraser',            desc: 'Rephrase text in different styles and tones',           cat: 'writing',      link: 'https://quillbot.com/paraphrasing-tool' },
  { icon: '🔤', name: 'Grammar Checker',        desc: 'Fix grammar, spelling, and punctuation errors',         cat: 'writing',      link: 'https://www.grammarly.com' },
  { icon: '📋', name: 'Report Writer',          desc: 'Generate structured academic and business reports',     cat: 'writing',      link: 'https://www.notion.so/ai' },
  { icon: '🎭', name: 'Tone Changer',           desc: 'Adjust writing tone from formal to casual',             cat: 'writing',      link: 'https://quillbot.com' },
  { icon: '📰', name: 'Press Release Writer',   desc: 'Create professional press releases instantly',          cat: 'writing',      link: 'https://www.copy.ai/tools/press-release-generator' },

  // ── Research ─────────────────────────────────────────────────────────────
  { icon: '📄', name: 'Summarizer',             desc: 'Condense long documents into key insights',             cat: 'research',     link: 'https://www.chatpdf.com' },
  { icon: '🔍', name: 'Research Assistant',     desc: 'Find and synthesize information on any topic',          cat: 'research',     link: 'https://www.perplexity.ai' },
  { icon: '📚', name: 'Literature Review',      desc: 'Generate comprehensive literature reviews',             cat: 'research',     link: 'https://www.elicit.com' },
  { icon: '🗂️', name: 'Citation Generator',    desc: 'Auto-generate APA, MLA, Chicago citations',            cat: 'research',     link: 'https://www.citationmachine.net' },
  { icon: '🧾', name: 'Abstract Writer',        desc: 'Write concise academic abstracts',                      cat: 'research',     link: 'https://www.scholarcy.com' },
  { icon: '🔬', name: 'Hypothesis Generator',   desc: 'Generate testable research hypotheses',                 cat: 'research',     link: 'https://www.researchrabbit.ai' },
  { icon: '📊', name: 'Data Summarizer',        desc: 'Summarize datasets and research findings',              cat: 'research',     link: 'https://julius.ai' },
  { icon: '🗺️', name: 'Mind Map Creator',      desc: 'Visualize concepts and research connections',           cat: 'research',     link: 'https://www.mindmeister.com' },
  { icon: '📑', name: 'Annotator',              desc: 'Annotate and highlight key points in documents',        cat: 'research',     link: 'https://hypothes.is' },
  { icon: '🔗', name: 'Source Finder',          desc: 'Discover credible sources for any topic',               cat: 'research',     link: 'https://www.semanticscholar.org' },

  // ── Coding ───────────────────────────────────────────────────────────────
  { icon: '💻', name: 'Code Assistant',         desc: 'Write, debug, and explain code in any language',        cat: 'coding',       link: 'https://github.com/features/copilot' },
  { icon: '🐛', name: 'Bug Detector',           desc: 'Identify and fix bugs in your code',                    cat: 'coding',       link: 'https://www.cursor.so' },
  { icon: '📖', name: 'Code Explainer',         desc: 'Get plain-English explanations of complex code',        cat: 'coding',       link: 'https://www.phind.com' },
  { icon: '🔄', name: 'Code Converter',         desc: 'Convert code between programming languages',            cat: 'coding',       link: 'https://aicodeconvert.com' },
  { icon: '⚡', name: 'Code Optimizer',         desc: 'Improve code performance and efficiency',               cat: 'coding',       link: 'https://www.tabnine.com' },
  { icon: '🧪', name: 'Test Generator',         desc: 'Auto-generate unit tests for your functions',           cat: 'coding',       link: 'https://www.codium.ai' },
  { icon: '📝', name: 'Docstring Writer',       desc: 'Generate documentation for your code',                  cat: 'coding',       link: 'https://mintlify.com' },
  { icon: '🏗️', name: 'Architecture Planner',  desc: 'Design software architecture and systems',              cat: 'coding',       link: 'https://www.eraser.io' },
  { icon: '🔐', name: 'Security Auditor',       desc: 'Identify security vulnerabilities in code',             cat: 'coding',       link: 'https://snyk.io' },
  { icon: '🎨', name: 'CSS Generator',          desc: 'Generate CSS styles from descriptions',                 cat: 'coding',       link: 'https://www.uiverse.io' },
  { icon: '🌐', name: 'API Designer',           desc: 'Design RESTful APIs with documentation',                cat: 'coding',       link: 'https://hoppscotch.io' },
  { icon: '🗄️', name: 'SQL Helper',            desc: 'Write and optimize SQL queries',                        cat: 'coding',       link: 'https://www.text2sql.ai' },

  // ── Math ─────────────────────────────────────────────────────────────────
  { icon: '🧮', name: 'Math Solver',            desc: 'Solve equations and math problems step-by-step',        cat: 'math',         link: 'https://www.wolframalpha.com' },
  { icon: '📐', name: 'Geometry Helper',        desc: 'Solve geometry problems with visual explanations',      cat: 'math',         link: 'https://www.geogebra.org' },
  { icon: '∫',  name: 'Calculus Tutor',         desc: 'Derivatives, integrals, and limits explained',          cat: 'math',         link: 'https://www.symbolab.com' },
  { icon: '📈', name: 'Statistics Analyzer',    desc: 'Analyze data and compute statistics',                   cat: 'math',         link: 'https://www.statcrunch.com' },
  { icon: '🔢', name: 'Algebra Solver',         desc: 'Solve algebraic equations and systems',                 cat: 'math',         link: 'https://www.mathway.com' },
  { icon: '🎲', name: 'Probability Calculator', desc: 'Calculate probabilities and distributions',             cat: 'math',         link: 'https://stattrek.com/online-calculator/probability-calculator' },
  { icon: '📉', name: 'Graph Plotter',          desc: 'Plot mathematical functions and data',                  cat: 'math',         link: 'https://www.desmos.com' },
  { icon: '🔣', name: 'Formula Explainer',      desc: 'Explain mathematical formulas in plain English',        cat: 'math',         link: 'https://www.wolframalpha.com' },

  // ── Language ─────────────────────────────────────────────────────────────
  { icon: '🌐', name: 'Translator',             desc: 'Convert hard English into easy Hinglish — the way people speak in India',          cat: 'language',     link: 'https://www.deepl.com' },
  { icon: '🗣️', name: 'Language Tutor',        desc: 'Practice conversation in any language',                 cat: 'language',     link: 'https://www.duolingo.com' },
  { icon: '📚', name: 'Vocabulary Builder',     desc: 'Expand your vocabulary with AI flashcards',             cat: 'language',     link: 'https://www.vocabulary.com' },
  { icon: '✏️', name: 'Grammar Tutor',         desc: 'Learn grammar rules with interactive exercises',        cat: 'language',     link: 'https://www.grammarly.com' },
  { icon: '🎙️', name: 'Pronunciation Guide',   desc: 'Get phonetic guides for any word or phrase',            cat: 'language',     link: 'https://forvo.com' },
  { icon: '📝', name: 'Language Exercises',     desc: 'Practice reading, writing, and comprehension',          cat: 'language',     link: 'https://www.babbel.com' },
  { icon: '🌍', name: 'Cultural Context',       desc: 'Understand cultural nuances in language',               cat: 'language',     link: 'https://www.italki.com' },
  { icon: '💬', name: 'Idiom Explainer',        desc: 'Decode idioms and expressions in any language',         cat: 'language',     link: 'https://www.idioms.online' },

  // ── Productivity ─────────────────────────────────────────────────────────
  { icon: '📅', name: 'Study Planner',          desc: 'Create personalized study schedules',                   cat: 'productivity', link: 'https://www.notion.so' },
  { icon: '⏱️', name: 'Pomodoro Timer',         desc: 'AI-optimized focus sessions and breaks',                cat: 'productivity', link: 'https://pomofocus.io' },
  { icon: '✅', name: 'Task Prioritizer',        desc: 'Rank and organize tasks by importance',                 cat: 'productivity', link: 'https://todoist.com' },
  { icon: '🎯', name: 'Goal Tracker',           desc: 'Set and track academic and personal goals',             cat: 'productivity', link: 'https://www.habitica.com' },
  { icon: '📊', name: 'Progress Analyzer',      desc: 'Analyze your study progress and habits',                cat: 'productivity', link: 'https://www.rescuetime.com' },
  { icon: '🧠', name: 'Flashcard Generator',    desc: 'Create smart flashcards from any content',              cat: 'productivity', link: 'https://ankiweb.net' },
  { icon: '📌', name: 'Note Organizer',         desc: 'Organize and link your notes intelligently',            cat: 'productivity', link: 'https://obsidian.md' },
  { icon: '🔔', name: 'Reminder System',        desc: 'Smart reminders based on your study patterns',          cat: 'productivity', link: 'https://www.any.do' },
  { icon: '📋', name: 'Meeting Summarizer',     desc: 'Summarize lectures and meeting recordings',             cat: 'productivity', link: 'https://otter.ai' },
  { icon: '🗓️', name: 'Deadline Manager',      desc: 'Track and manage assignment deadlines',                 cat: 'productivity', link: 'https://www.trello.com' },

  // ── Creative ─────────────────────────────────────────────────────────────
  { icon: '🎨', name: 'Image Prompt Writer',    desc: 'Write prompts for AI image generation',                 cat: 'creative',     link: 'https://www.midjourney.com' },
  { icon: '🎵', name: 'Lyrics Generator',       desc: 'Create song lyrics in any style or genre',              cat: 'creative',     link: 'https://www.suno.ai' },
  { icon: '🎬', name: 'Script Writer',          desc: 'Write scripts for videos, plays, and podcasts',         cat: 'creative',     link: 'https://www.arc.dev/tools/script-writer' },
  { icon: '🖼️', name: 'Art Describer',         desc: 'Analyze and describe artworks in detail',               cat: 'creative',     link: 'https://www.google.com/arts/culture' },
  { icon: '📸', name: 'Photo Caption Writer',   desc: 'Generate captions for images and photos',               cat: 'creative',     link: 'https://www.adobe.com/express' },
  { icon: '🎭', name: 'Character Creator',      desc: 'Design detailed fictional characters',                  cat: 'creative',     link: 'https://character.ai' },
  { icon: '🌍', name: 'World Builder',          desc: 'Create fictional worlds and settings',                  cat: 'creative',     link: 'https://www.worldanvil.com' },
  { icon: '🃏', name: 'Joke Generator',         desc: 'Generate jokes and humorous content',                   cat: 'creative',     link: 'https://www.humorbot.ai' },
  { icon: '🎪', name: 'Presentation Designer',  desc: 'Create compelling presentation outlines',               cat: 'creative',     link: 'https://www.beautiful.ai' },
  { icon: '📱', name: 'Social Media Writer',    desc: 'Write engaging posts for any platform',                 cat: 'creative',     link: 'https://www.buffer.com/ai-assistant' },

  // ── Science ──────────────────────────────────────────────────────────────
  { icon: '🔬', name: 'Science Explainer',      desc: 'Explain complex scientific concepts simply',            cat: 'science',      link: 'https://www.khanacademy.org' },
  { icon: '⚗️', name: 'Chemistry Helper',       desc: 'Balance equations and explain reactions',               cat: 'science',      link: 'https://www.chemspider.com' },
  { icon: '🧬', name: 'Biology Tutor',          desc: 'Learn biology concepts with AI explanations',           cat: 'science',      link: 'https://www.khanacademy.org/science/biology' },
  { icon: '⚛️', name: 'Physics Solver',         desc: 'Solve physics problems with step-by-step solutions',    cat: 'science',      link: 'https://www.physicsclassroom.com' },
  { icon: '🌱', name: 'Ecology Analyzer',       desc: 'Analyze ecosystems and environmental data',             cat: 'science',      link: 'https://www.gbif.org' },
  { icon: '🌌', name: 'Astronomy Guide',        desc: 'Explore space and astronomical phenomena',              cat: 'science',      link: 'https://stellarium-web.org' },
  { icon: '🧪', name: 'Lab Report Writer',      desc: 'Structure and write scientific lab reports',            cat: 'science',      link: 'https://www.labarchives.com' },
  { icon: '🦠', name: 'Microbiology Helper',    desc: 'Understand microorganisms and processes',               cat: 'science',      link: 'https://www.microbiologyonline.org' },
  { icon: '🌊', name: 'Earth Science Tutor',    desc: 'Learn geology, meteorology, and oceanography',          cat: 'science',      link: 'https://www.usgs.gov/educational-resources' },

  // ── Business ─────────────────────────────────────────────────────────────
  { icon: '💼', name: 'Business Plan Writer',   desc: 'Create comprehensive business plans',                   cat: 'business',     link: 'https://www.bizplan.com' },
  { icon: '📊', name: 'Market Analyzer',        desc: 'Analyze market trends and opportunities',               cat: 'business',     link: 'https://www.statista.com' },
  { icon: '💰', name: 'Financial Planner',      desc: 'Plan budgets and financial strategies',                 cat: 'business',     link: 'https://www.mint.com' },
  { icon: '🤝', name: 'Negotiation Coach',      desc: 'Practice and improve negotiation skills',               cat: 'business',     link: 'https://www.coursera.org/learn/negotiation' },
  { icon: '📣', name: 'Marketing Copy Writer',  desc: 'Write persuasive marketing materials',                  cat: 'business',     link: 'https://www.copy.ai' },
  { icon: '🎯', name: 'SWOT Analyzer',          desc: 'Conduct SWOT analysis for any business',                cat: 'business',     link: 'https://www.mindtools.com/pages/article/newTMC_05.htm' },
  { icon: '📈', name: 'Pitch Deck Creator',     desc: 'Build compelling investor pitch decks',                 cat: 'business',     link: 'https://www.beautiful.ai' },
  { icon: '🔍', name: 'Competitor Analyzer',    desc: 'Research and analyze competitors',                      cat: 'business',     link: 'https://www.similarweb.com' },
  { icon: '📋', name: 'Project Planner',        desc: 'Plan and manage projects with AI assistance',           cat: 'business',     link: 'https://www.asana.com' },
  { icon: '💡', name: 'Idea Generator',         desc: 'Brainstorm business ideas and innovations',             cat: 'business',     link: 'https://www.ideasai.net' },
];

// ─── State ────────────────────────────────────────────────────────────────────
let currentPage = 1;
let currentCat = 'all';
let searchQuery = '';
const TOOLS_PER_PAGE = 20;

// ─── Filter ───────────────────────────────────────────────────────────────────
function getFiltered() {
  return TOOLS.filter(t => {
    const matchCat = currentCat === 'all' || t.cat === currentCat;
    const q = searchQuery;
    const matchSearch = !q ||
      t.name.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.cat.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderTools() {
  const filtered = getFiltered();
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / TOOLS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * TOOLS_PER_PAGE;
  const paginated = filtered.slice(start, start + TOOLS_PER_PAGE);

  const grid = document.getElementById('toolsGrid');
  const countEl = document.getElementById('toolCount');
  if (countEl) countEl.textContent = total;

  if (!paginated.length) {
    grid.innerHTML = '<div class="tools-empty">No tools found. Try a different search or category.</div>';
    renderPagination(0);
    return;
  }

  // Each card opens the external link in a new tab
  grid.innerHTML = paginated.map(t => `
    <div class="tool-card" role="button" tabindex="0"
         data-link="${escAttr(t.link)}"
         title="Open ${escAttr(t.name)} — ${escAttr(t.link)}">
      <div class="tc-icon">${t.icon}</div>
      <div class="tc-name">${escHtml(t.name)}</div>
      <div class="tc-desc">${escHtml(t.desc)}</div>
      <div class="tc-footer">
        <span class="tc-cat">${t.cat}</span>
        <span class="tc-ext-icon" aria-hidden="true">↗</span>
      </div>
    </div>
  `).join('');

  // Click + keyboard open external link
  grid.querySelectorAll('.tool-card').forEach((card, i) => {
    const link = card.dataset.link;

    const open = () => window.open(link, '_blank', 'noopener,noreferrer');
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    // Stagger entrance animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(14px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.28s ease, transform 0.28s ease, border-color 0.2s, box-shadow 0.2s';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 25);
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageNumbers = document.getElementById('pageNumbers');

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages || totalPages === 0;

  // Show up to 5 page numbers, centered around current page
  const range = [];
  const delta = 2;
  for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
    range.push(i);
  }

  pageNumbers.innerHTML = range.map(p => `
    <button class="page-num ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>
  `).join('');

  pageNumbers.querySelectorAll('.page-num').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page, 10);
      renderTools();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// ─── Events ───────────────────────────────────────────────────────────────────
document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentPage > 1) { currentPage--; renderTools(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
});
document.getElementById('nextBtn').addEventListener('click', () => {
  currentPage++; renderTools(); window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
    currentPage = 1;
    renderTools();
  });
});

const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    currentPage = 1;
    renderTools();
  });
}

// ─── Init — handle ?q= param from dashboard search ───────────────────────────
const urlParams = new URLSearchParams(window.location.search);
const preSearch = urlParams.get('q');
if (preSearch && searchInput) {
  searchQuery = preSearch.toLowerCase().trim();
  searchInput.value = preSearch;
}

renderTools();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(s) {
  return String(s || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
