import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

const data = readFileSync(resolve(__dirname, 'ca-data.json'), 'utf8')
const outPath = process.argv[2] || resolve(__dirname, 'ca-viewer.html')

const html = `<title>Setu AI — Character Architecture</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --surface2: #1c2128;
  --border: #30363d;
  --border2: #21262d;
  --text: #e6edf3;
  --text2: #8b949e;
  --text3: #6e7681;
  --accent: #388bfd;
  --accent-bg: #1f3460;
  --tag-opinion: #1a3a2a;
  --tag-opinion-border: #2d6a4f;
  --tag-opinion-text: #6fcf97;
  --tag-nn: #3a1a1a;
  --tag-nn-border: #6a2d2d;
  --tag-nn-text: #eb5757;
  --tag-case: #1a2a3a;
  --tag-case-border: #2d4a6a;
  --tag-case-text: #56b6c2;
  --tag-watch: #2a1f0a;
  --tag-watch-border: #6a4f0a;
  --tag-watch-text: #e6a817;
  --tag-kpi: #1a1a3a;
  --tag-kpi-border: #2d2d6a;
  --tag-kpi-text: #9d7ee8;
  --sidebar-w: 264px;
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg: #f6f8fa;
    --surface: #ffffff;
    --surface2: #f0f2f5;
    --border: #d0d7de;
    --border2: #e5e8eb;
    --text: #1f2328;
    --text2: #636c76;
    --text3: #9198a1;
    --accent: #0969da;
    --accent-bg: #dbeafe;
    --tag-opinion: #e6f4ee;
    --tag-opinion-border: #a8d5ba;
    --tag-opinion-text: #1a7f4b;
    --tag-nn: #fde8e8;
    --tag-nn-border: #f5a0a0;
    --tag-nn-text: #b91c1c;
    --tag-case: #e8f2fd;
    --tag-case-border: #93c5fd;
    --tag-case-text: #1d6fa4;
    --tag-watch: #fef3cd;
    --tag-watch-border: #fbbf24;
    --tag-watch-text: #92400e;
    --tag-kpi: #f0edfd;
    --tag-kpi-border: #c4b5fd;
    --tag-kpi-text: #6d28d9;
    --sidebar-w: 264px;
  }
}
:root[data-theme="dark"] {
  --bg: #0d1117; --surface: #161b22; --surface2: #1c2128; --border: #30363d; --border2: #21262d;
  --text: #e6edf3; --text2: #8b949e; --text3: #6e7681; --accent: #388bfd; --accent-bg: #1f3460;
  --tag-opinion: #1a3a2a; --tag-opinion-border: #2d6a4f; --tag-opinion-text: #6fcf97;
  --tag-nn: #3a1a1a; --tag-nn-border: #6a2d2d; --tag-nn-text: #eb5757;
  --tag-case: #1a2a3a; --tag-case-border: #2d4a6a; --tag-case-text: #56b6c2;
  --tag-watch: #2a1f0a; --tag-watch-border: #6a4f0a; --tag-watch-text: #e6a817;
  --tag-kpi: #1a1a3a; --tag-kpi-border: #2d2d6a; --tag-kpi-text: #9d7ee8;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body { background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; font-size: 13px; display: flex; flex-direction: column; }

/* Top bar */
.topbar {
  height: 48px; min-height: 48px;
  background: var(--surface); border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; gap: 12px; z-index: 10;
}
.topbar-left { display: flex; align-items: center; gap: 10px; }
.topbar-logo { font-weight: 700; font-size: 14px; letter-spacing: -0.3px; color: var(--text); }
.topbar-logo span { color: var(--accent); }
.topbar-badge {
  font-size: 11px; font-family: 'JetBrains Mono', monospace;
  background: var(--accent-bg); color: var(--accent);
  border: 1px solid var(--accent); border-radius: 4px;
  padding: 2px 7px; font-weight: 500;
}
.topbar-right { display: flex; align-items: center; gap: 8px; color: var(--text2); font-size: 12px; }
.theme-btn {
  background: var(--surface2); border: 1px solid var(--border); border-radius: 6px;
  color: var(--text2); cursor: pointer; padding: 4px 8px; font-size: 12px;
  transition: color .15s, border-color .15s;
}
.theme-btn:hover { color: var(--text); border-color: var(--accent); }

/* Layout */
.layout { display: flex; flex: 1; overflow: hidden; }

/* Sidebar */
.sidebar {
  width: var(--sidebar-w); min-width: var(--sidebar-w);
  background: var(--surface); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow: hidden;
}
.sidebar-search {
  padding: 10px 10px 8px;
  border-bottom: 1px solid var(--border2);
}
.search-input {
  width: 100%; background: var(--surface2);
  border: 1px solid var(--border); border-radius: 6px;
  color: var(--text); font-family: inherit; font-size: 12px;
  padding: 6px 10px; outline: none;
  transition: border-color .15s;
}
.search-input::placeholder { color: var(--text3); }
.search-input:focus { border-color: var(--accent); }
.sidebar-count { font-size: 11px; color: var(--text3); padding: 4px 10px 0; font-family: 'JetBrains Mono', monospace; }
.sidebar-list { overflow-y: auto; flex: 1; padding: 4px 0; }
.emp-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 12px; cursor: pointer;
  border-left: 2px solid transparent;
  transition: background .1s, border-color .1s;
}
.emp-item:hover { background: var(--surface2); }
.emp-item.active { background: var(--accent-bg); border-left-color: var(--accent); }
.emp-item.active .emp-name { color: var(--accent); }
.emp-item.hidden { display: none; }
.emp-avatar {
  width: 26px; height: 26px; border-radius: 50%; min-width: 26px;
  background: var(--accent-bg); color: var(--accent);
  font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;
  text-transform: uppercase; letter-spacing: 0;
}
.emp-name { font-size: 12px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.emp-slug { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Detail panel */
.detail { flex: 1; overflow-y: auto; padding: 0; }
.detail-empty {
  display: flex; align-items: center; justify-content: center;
  height: 100%; flex-direction: column; gap: 8px;
  color: var(--text3);
}
.detail-empty .icon { font-size: 32px; }
.detail-empty p { font-size: 13px; }

/* Employee header */
.emp-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: sticky; top: 0; z-index: 5;
}
.emp-header-top { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.emp-avatar-lg {
  width: 40px; height: 40px; border-radius: 50%; min-width: 40px;
  background: var(--accent-bg); color: var(--accent);
  font-size: 16px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.emp-header-name { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
.emp-header-slug { font-size: 11px; color: var(--text3); font-family: 'JetBrains Mono', monospace; margin-top: 1px; }
.emp-modes-bar { display: flex; gap: 6px; flex-wrap: wrap; }
.mode-chip {
  font-size: 11px; padding: 3px 9px; border-radius: 12px; font-weight: 600;
  background: var(--surface2); border: 1px solid var(--border); color: var(--text2);
}

/* Sections */
.sections { padding: 16px 24px 40px; display: flex; flex-direction: column; gap: 20px; }

.section { }
.section-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  cursor: pointer; user-select: none;
}
.section-label {
  font-size: 11px; font-weight: 700; letter-spacing: 0.6px;
  text-transform: uppercase; color: var(--text2);
}
.section-count {
  font-size: 10px; font-family: 'JetBrains Mono', monospace;
  color: var(--text3); background: var(--surface2);
  border: 1px solid var(--border2); border-radius: 3px; padding: 1px 5px;
}
.chevron { font-size: 10px; color: var(--text3); transition: transform .2s; margin-left: auto; }
.section.collapsed .chevron { transform: rotate(-90deg); }
.section.collapsed .section-body { display: none; }

/* Opinions */
.opinions-grid { display: flex; flex-direction: column; gap: 8px; }
.opinion-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;
  border-left: 3px solid var(--tag-opinion-border);
}
.belief-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--tag-opinion-text); font-weight: 700; }
.belief-text { font-size: 12px; color: var(--text2); font-style: italic; line-height: 1.5; }
.reality-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text3); font-weight: 700; margin-top: 2px; }
.reality-text { font-size: 12px; color: var(--text); line-height: 1.6; }

/* Non-negotiables */
.nn-list { display: flex; flex-direction: column; gap: 6px; }
.nn-item {
  display: flex; gap: 8px; align-items: flex-start;
  background: var(--tag-nn); border: 1px solid var(--tag-nn-border);
  border-radius: 7px; padding: 9px 12px;
}
.nn-dot { color: var(--tag-nn-text); font-size: 14px; line-height: 1.4; min-width: 14px; }
.nn-text { font-size: 12px; line-height: 1.6; color: var(--text); }

/* Cases */
.cases-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
@media (max-width: 900px) { .cases-grid { grid-template-columns: 1fr; } }
.case-card {
  background: var(--tag-case); border: 1px solid var(--tag-case-border);
  border-radius: 8px; padding: 10px 12px;
}
.case-title { font-size: 11px; font-weight: 700; color: var(--tag-case-text); margin-bottom: 5px; }
.case-summary { font-size: 12px; line-height: 1.6; color: var(--text); }

/* Watch patterns */
.watch-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
@media (max-width: 900px) { .watch-grid { grid-template-columns: 1fr; } }
.watch-item {
  display: flex; gap: 7px; align-items: flex-start;
  background: var(--tag-watch); border: 1px solid var(--tag-watch-border);
  border-radius: 7px; padding: 8px 10px;
}
.watch-icon { color: var(--tag-watch-text); font-size: 11px; line-height: 1.6; min-width: 12px; }
.watch-text { font-size: 12px; line-height: 1.5; color: var(--text); font-family: 'JetBrains Mono', monospace; font-size: 11px; }

/* KPIs */
.kpi-grid { display: flex; flex-direction: column; gap: 5px; }
.kpi-item {
  display: flex; align-items: flex-start; gap: 8px;
  background: var(--tag-kpi); border: 1px solid var(--tag-kpi-border);
  border-radius: 7px; padding: 8px 12px;
}
.kpi-num {
  font-size: 10px; font-family: 'JetBrains Mono', monospace;
  color: var(--tag-kpi-text); font-weight: 700; min-width: 18px;
  margin-top: 1px;
}
.kpi-text { font-size: 12px; line-height: 1.5; color: var(--text); }

/* Autonomy modes */
.autonomy-grid { display: flex; flex-direction: column; gap: 8px; }
.autonomy-tier {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
}
.autonomy-tier-header {
  padding: 8px 12px; display: flex; align-items: center; gap: 8px;
  border-bottom: 1px solid var(--border2);
}
.tier-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px;
  letter-spacing: 0.3px; white-space: nowrap;
}
.tier-0 .tier-badge { background: var(--surface2); color: var(--text2); border: 1px solid var(--border); }
.tier-1 .tier-badge { background: #1a2a1a; color: #4caf50; border: 1px solid #2d6a2d; }
.tier-2 .tier-badge { background: #1a2a3a; color: #64b5f6; border: 1px solid #2d4a6a; }
.tier-3 .tier-badge { background: #2a1a3a; color: #ce93d8; border: 1px solid #4a2d6a; }
:root:not([data-theme="dark"]) .tier-1 .tier-badge { background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7; }
:root:not([data-theme="dark"]) .tier-2 .tier-badge { background: #e3f2fd; color: #1565c0; border-color: #90caf9; }
:root:not([data-theme="dark"]) .tier-3 .tier-badge { background: #f3e5f5; color: #6a1b9a; border-color: #ce93d8; }
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) .tier-1 .tier-badge { background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7; }
  :root:not([data-theme="dark"]) .tier-2 .tier-badge { background: #e3f2fd; color: #1565c0; border-color: #90caf9; }
  :root:not([data-theme="dark"]) .tier-3 .tier-badge { background: #f3e5f5; color: #6a1b9a; border-color: #ce93d8; }
}
:root[data-theme="light"] .tier-1 .tier-badge { background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7; }
:root[data-theme="light"] .tier-2 .tier-badge { background: #e3f2fd; color: #1565c0; border-color: #90caf9; }
:root[data-theme="light"] .tier-3 .tier-badge { background: #f3e5f5; color: #6a1b9a; border-color: #ce93d8; }
.autonomy-tasks { padding: 8px 12px; display: flex; flex-wrap: wrap; gap: 5px; }
.autonomy-task {
  font-size: 11px; background: var(--surface2); border: 1px solid var(--border2);
  border-radius: 4px; padding: 3px 8px; color: var(--text2); line-height: 1.4;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text3); }

/* No results */
.no-results { padding: 20px 12px; text-align: center; color: var(--text3); font-size: 12px; }
</style>

<div class="topbar">
  <div class="topbar-left">
    <div class="topbar-logo">Setu <span>AI</span></div>
    <div class="topbar-badge">Character Architecture</div>
  </div>
  <div class="topbar-right">
    <span id="selectedLabel" style="font-family:'JetBrains Mono',monospace;"></span>
    <button class="theme-btn" id="themeBtn" onclick="toggleTheme()">☀ Light</button>
  </div>
</div>

<div class="layout">
  <div class="sidebar">
    <div class="sidebar-search">
      <input class="search-input" id="searchInput" placeholder="Search employees…" oninput="filterList(this.value)" autocomplete="off">
    </div>
    <div class="sidebar-count" id="sidebarCount"></div>
    <div class="sidebar-list" id="sidebarList"></div>
  </div>
  <div class="detail" id="detail">
    <div class="detail-empty">
      <div class="icon">⬡</div>
      <p>Select an employee to view their Character Architecture</p>
    </div>
  </div>
</div>

<script>
const EMPLOYEES = ${data};
let currentSlug = null;
let darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

function toggleTheme() {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  document.getElementById('themeBtn').textContent = darkMode ? '☀ Light' : '☾ Dark';
}

function initTheme() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  document.getElementById('themeBtn').textContent = darkMode ? '☀ Light' : '☾ Dark';
}

function avatarInitials(name, slug) {
  if (name && name !== slug) return name.slice(0,2).toUpperCase();
  const parts = slug.split('-');
  return (parts[0][0] + (parts[1]?.[0] || parts[0][1] || '')).toUpperCase();
}

function buildSidebar() {
  const list = document.getElementById('sidebarList');
  list.innerHTML = '';
  EMPLOYEES.forEach(emp => {
    const item = document.createElement('div');
    item.className = 'emp-item';
    item.id = 'item-' + emp.slug;
    item.setAttribute('data-name', (emp.name + ' ' + emp.slug).toLowerCase());
    item.onclick = () => selectEmployee(emp.slug);
    item.innerHTML = \`
      <div class="emp-avatar">\${avatarInitials(emp.name, emp.slug)}</div>
      <div style="min-width:0">
        <div class="emp-name">\${emp.name}</div>
        <div class="emp-slug">\${emp.slug}</div>
      </div>
    \`;
    list.appendChild(item);
  });
  updateCount(EMPLOYEES.length);
}

function filterList(q) {
  const query = q.toLowerCase().trim();
  let visible = 0;
  EMPLOYEES.forEach(emp => {
    const item = document.getElementById('item-' + emp.slug);
    const match = !query || (emp.name + ' ' + emp.slug).toLowerCase().includes(query);
    item.classList.toggle('hidden', !match);
    if (match) visible++;
  });
  updateCount(visible);
  const noRes = document.getElementById('noResults');
  if (noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
}

function updateCount(n) {
  document.getElementById('sidebarCount').textContent = n + ' employee' + (n !== 1 ? 's' : '');
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function selectEmployee(slug) {
  if (currentSlug) {
    const old = document.getElementById('item-' + currentSlug);
    if (old) old.classList.remove('active');
  }
  currentSlug = slug;
  const item = document.getElementById('item-' + slug);
  if (item) { item.classList.add('active'); item.scrollIntoView({ block: 'nearest' }); }

  const emp = EMPLOYEES.find(e => e.slug === slug);
  if (!emp) return;

  document.getElementById('selectedLabel').textContent = emp.slug;

  const cc = emp.characterCore;
  const wp = emp.watchPatterns;
  const kp = emp.kpis;
  const am = emp.autonomyModes;

  const tierClasses = ['tier-0','tier-1','tier-2','tier-3'];
  const modeNames = am.map(m => m.mode);

  document.getElementById('detail').innerHTML = \`
    <div class="emp-header">
      <div class="emp-header-top">
        <div class="emp-avatar-lg">\${avatarInitials(emp.name, emp.slug)}</div>
        <div>
          <div class="emp-header-name">\${esc(emp.name)}</div>
          <div class="emp-header-slug">\${esc(emp.slug)}</div>
        </div>
      </div>
      <div class="emp-modes-bar">
        \${cc.modes.map(m => \`<div class="mode-chip">\${esc(m.name)}</div>\`).join('')}
      </div>
    </div>

    <div class="sections">

      <!-- CHARACTER CORE -->
      <div class="section" id="sec-core">
        <div class="section-header" onclick="toggleSection('sec-core')">
          <div class="section-label">Character Core</div>
          <div class="section-count">3 opinions · 3 non-negotiables · 5 cases</div>
          <div class="chevron">▾</div>
        </div>
        <div class="section-body">

          <div style="margin-bottom:10px">
            <div style="font-size:11px;font-weight:600;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px">Opinions — What \${esc(emp.name)} Challenges</div>
            <div class="opinions-grid">
              \${cc.opinions.map(op => \`
                <div class="opinion-card">
                  <div class="belief-label">Common Myth</div>
                  <div class="belief-text">\${esc(op.belief)}</div>
                  <div class="reality-label">Reality</div>
                  <div class="reality-text">\${esc(op.reality)}</div>
                </div>
              \`).join('')}
            </div>
          </div>

          <div style="margin-bottom:10px">
            <div style="font-size:11px;font-weight:600;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px">Non-Negotiables</div>
            <div class="nn-list">
              \${cc.nonNegotiables.map(nn => \`
                <div class="nn-item">
                  <div class="nn-dot">✕</div>
                  <div class="nn-text">\${esc(nn)}</div>
                </div>
              \`).join('')}
            </div>
          </div>

          <div>
            <div style="font-size:11px;font-weight:600;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px">Formative Cases</div>
            <div class="cases-grid">
              \${cc.cases.map(c => \`
                <div class="case-card">
                  <div class="case-title">\${esc(c.title)}</div>
                  <div class="case-summary">\${esc(c.summary)}</div>
                </div>
              \`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- WATCH PATTERNS -->
      <div class="section" id="sec-watch">
        <div class="section-header" onclick="toggleSection('sec-watch')">
          <div class="section-label">Watch Patterns</div>
          <div class="section-count">\${wp.length} triggers</div>
          <div class="chevron">▾</div>
        </div>
        <div class="section-body">
          <div class="watch-grid">
            \${wp.map(w => \`
              <div class="watch-item">
                <div class="watch-icon">⚑</div>
                <div class="watch-text">\${esc(w)}</div>
              </div>
            \`).join('')}
          </div>
        </div>
      </div>

      <!-- KPIs -->
      <div class="section" id="sec-kpis">
        <div class="section-header" onclick="toggleSection('sec-kpis')">
          <div class="section-label">KPIs</div>
          <div class="section-count">\${kp.length} metrics</div>
          <div class="chevron">▾</div>
        </div>
        <div class="section-body">
          <div class="kpi-grid">
            \${kp.map((k,i) => \`
              <div class="kpi-item">
                <div class="kpi-num">K\${String(i+1).padStart(2,'0')}</div>
                <div class="kpi-text">\${esc(k)}</div>
              </div>
            \`).join('')}
          </div>
        </div>
      </div>

      <!-- AUTONOMY MODES -->
      <div class="section" id="sec-auto">
        <div class="section-header" onclick="toggleSection('sec-auto')">
          <div class="section-label">Autonomy Modes</div>
          <div class="section-count">4 levels</div>
          <div class="chevron">▾</div>
        </div>
        <div class="section-body">
          <div class="autonomy-grid">
            \${am.map((tier, i) => \`
              <div class="autonomy-tier \${tierClasses[i]}">
                <div class="autonomy-tier-header">
                  <div class="tier-badge">\${esc(tier.mode)}</div>
                </div>
                <div class="autonomy-tasks">
                  \${tier.tasks.map(t => \`<div class="autonomy-task">\${esc(t)}</div>\`).join('')}
                </div>
              </div>
            \`).join('')}
          </div>
        </div>
      </div>

    </div>
  \`;
}

function toggleSection(id) {
  document.getElementById(id)?.classList.toggle('collapsed');
}

initTheme();
buildSidebar();

// Select first employee by default
if (EMPLOYEES.length > 0) selectEmployee(EMPLOYEES[0].slug);
</script>
`

writeFileSync(outPath, html, 'utf8')
console.log(`Built → ${outPath} (${Math.round(html.length / 1024)}KB)`)
