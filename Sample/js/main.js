// ===== SIDEBAR TOGGLE (mobile-friendly with overlay) =====
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

// Inject overlay element once
let sidebarOverlay = document.getElementById('sidebarOverlay');
if (!sidebarOverlay && sidebar) {
  sidebarOverlay = document.createElement('div');
  sidebarOverlay.id        = 'sidebarOverlay';
  sidebarOverlay.className = 'sidebar-overlay';
  document.body.appendChild(sidebarOverlay);
  sidebarOverlay.addEventListener('click', closeSidebar);
}

function openSidebar() {
  sidebar?.classList.add('open');
  sidebarOverlay?.classList.add('active');
  document.body.style.overflow = 'hidden'; // prevent scroll behind sidebar
}
function closeSidebar() {
  sidebar?.classList.remove('open');
  sidebarOverlay?.classList.remove('active');
  document.body.style.overflow = '';
}

if (sidebarToggle) {
  sidebarToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
  });
}

// Close sidebar on nav item click (mobile UX)
sidebar?.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 768) closeSidebar();
  });
});

// ===== AI FAB + PANEL =====
const aiFab       = document.getElementById('aiFab');
const aiPanel     = document.getElementById('aiPanel');
const panelClose  = document.getElementById('panelClose');
const panelOverlay = document.getElementById('panelOverlay');

if (aiFab && aiPanel) {
  aiFab.addEventListener('click', () => {
    aiPanel.classList.toggle('open');
    panelOverlay?.classList.toggle('active');
  });
  panelClose?.addEventListener('click', closePanel);
  panelOverlay?.addEventListener('click', closePanel);
}

function closePanel() {
  aiPanel?.classList.remove('open');
  panelOverlay?.classList.remove('active');
}

// ===== NAV SCROLL =====
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20));
}

// ===== SCROLL ANIMATIONS =====
if (document.querySelector('.feature-card, .stat-card, .dash-card, .profile-card')) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.feature-card, .stat-card, .dash-card, .profile-card').forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease, border-color 0.2s ease, box-shadow 0.2s ease';
    observer.observe(el);
  });
}
