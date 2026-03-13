/* ── Mobile menu ── */
const ham = document.getElementById('ham');
const drawer = document.getElementById('drawer');
ham.addEventListener('click', () => {
  ham.classList.toggle('open');
  drawer.classList.toggle('open');
});
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  ham.classList.remove('open');
  drawer.classList.remove('open');
}));

/* ── Reveal ── */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.1 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

/* ── Skills ── */
const SKILLS = [
  { name: 'HTML / CSS',   pct: 92 },
  { name: 'JavaScript',   pct: 88 },
  { name: 'React.js',     pct: 80 },
  { name: 'Node.js',      pct: 78 },
  { name: 'Git & GitHub', pct: 75 },
  { name: 'MongoDB',      pct: 72 },
  { name: 'Python',       pct: 68 },
  { name: 'MySQL',        pct: 65 },
];

document.getElementById('skillList').innerHTML = SKILLS.map(s => `
  <div class="skill-row">
    <span class="sk-name">${s.name}</span>
    <div class="sk-track"><div class="sk-fill" data-pct="${s.pct}"></div></div>
    <span class="sk-pct">${s.pct}</span>
  </div>
`).join('');

let barsGone = false;
new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !barsGone) {
    barsGone = true;
    document.querySelectorAll('.sk-fill').forEach(f => f.style.width = f.dataset.pct + '%');
  }
}, { threshold: 0.25 }).observe(document.getElementById('skills'));

/* ── Toast ── */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2200);
}

/* ── GitHub ── */
let repos = [], activeLang = 'all';
const LC = { javascript:'ljs',typescript:'lts',python:'lpy',html:'lhtml',css:'lcss',java:'ljava',go:'lgo',shell:'lsh' };
const lc = l => LC[(l||'').toLowerCase()] || '';

async function fetchRepos() {
  const u = document.getElementById('ghUser').value.trim() || 'abhinav23055';
  const btn = document.getElementById('fetchBtn');
  btn.disabled = true; btn.textContent = '···';
  document.getElementById('repoList').innerHTML = '<div class="repo-msg"><span class="spin"></span>Fetching…</div>';
  document.getElementById('ltabs').innerHTML = '<button class="ltab on" onclick="filterLang(\'all\')">All</button>';

  const urls = [
    `https://api.github.com/users/${u}/repos?per_page=100&sort=updated`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`)}`,
    `https://corsproxy.io/?${encodeURIComponent(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`)}`
  ];

  let data = null, err = '';
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
      if (!r.ok) { err = r.status === 404 ? `User "${u}" not found` : `HTTP ${r.status}`; continue; }
      const j = await r.json();
      if (Array.isArray(j)) { data = j; break; }
    } catch(e) { err = e.message; }
  }

  if (data) {
    repos = data.filter(r => !r.fork);
    buildTabs(); renderRepos(repos);
    toast(`${repos.length} repos loaded`);
  } else {
    document.getElementById('repoList').innerHTML = `<div class="repo-msg">⚠ ${err || 'Could not reach GitHub.'}</div>`;
  }
  btn.disabled = false; btn.textContent = 'Fetch repos';
}

function buildTabs() {
  const langs = [...new Set(repos.map(r => r.language).filter(Boolean))];
  const c = document.getElementById('ltabs');
  c.innerHTML = `<button class="ltab on" onclick="filterLang('all')">All (${repos.length})</button>`;
  langs.forEach(l => {
    const n = repos.filter(r => r.language === l).length;
    const b = document.createElement('button');
    b.className = 'ltab'; b.textContent = `${l} (${n})`; b.onclick = () => filterLang(l);
    c.appendChild(b);
  });
}

function filterLang(l) {
  activeLang = l;
  document.querySelectorAll('.ltab').forEach(t =>
    t.classList.toggle('on', t.textContent.startsWith(l === 'all' ? 'All' : l))
  );
  applyFilter();
}

document.getElementById('srch').addEventListener('input', applyFilter);

function applyFilter() {
  const q = document.getElementById('srch').value.toLowerCase();
  const base = activeLang === 'all' ? repos : repos.filter(r => r.language === activeLang);
  renderRepos(q ? base.filter(r =>
    r.name.toLowerCase().includes(q) || (r.description||'').toLowerCase().includes(q)
  ) : base);
}

function renderRepos(rs) {
  const el = document.getElementById('repoList');
  if (!rs.length) { el.innerHTML = '<div class="repo-msg">No repos found.</div>'; return; }
  el.innerHTML = rs.map(r => `
    <div class="repo-item">
      <div class="repo-body">
        <div class="repo-name">${r.name}</div>
        <div class="repo-desc">${r.description || 'No description.'}</div>
        <div class="repo-meta">
          <span class="repo-lang ${lc(r.language)}">
            <span class="lang-dot"></span>${r.language || '—'}
          </span>
          <span class="repo-stars">★ ${r.stargazers_count}</span>
        </div>
      </div>
      <div class="repo-actions">
        <a href="${r.html_url}" target="_blank" class="repo-lnk">GitHub ↗</a>
        ${r.homepage ? `<a href="${r.homepage}" target="_blank" class="repo-lnk live">Live ↗</a>` : ''}
      </div>
    </div>
  `).join('');
}

fetchRepos();