let allRepos=[],pinned=JSON.parse(localStorage.getItem('abPinned2')||'[]'),activeLang='all';
const ICONS={javascript:'🟨',typescript:'🔷',python:'🐍',html:'🌐',css:'🎨',java:'☕','c++':'⚙️',go:'🐹',ruby:'💎',php:'🐘',shell:'💻',swift:'🦅',kotlin:'🎯',default:'📦'};
const LCLASS={javascript:'ljs',typescript:'lts',python:'lpy',html:'lht',css:'lcs',java:'lja',go:'lgo',shell:'lsh',php:'lph',kotlin:'lkt',ruby:'lrb',swift:'lsw','c++':'lcpp'};
function ico(l){return ICONS[(l||'').toLowerCase()]||ICONS.default;}
function lc(l){return LCLASS[(l||'').toLowerCase()]||'';}
function isPin(id){return pinned.some(p=>p.id===id);}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2400);}

async function fetchRepos(){
  const u=document.getElementById('ghUser').value.trim()||'abhinav23055';
  const btn=document.getElementById('fetchBtn');
  btn.disabled=true;btn.textContent='…';
  document.getElementById('pgrid').innerHTML='<div class="pgrid-msg"><span class="spin"></span>Fetching from GitHub…</div>';
  document.getElementById('ftabs').innerHTML='<button class="ftab on" onclick="filterLang(\'all\')">All</button>';

  // Try direct GitHub API first, then fall back to a CORS proxy
  const endpoints = [
    `https://api.github.com/users/${u}/repos?per_page=100&sort=updated`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`)}`,
    `https://corsproxy.io/?${encodeURIComponent(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`)}`
  ];

  let data = null;
  let lastErr = '';

  for(const url of endpoints){
    try{
      const res = await fetch(url, {headers:{'Accept':'application/vnd.github.v3+json'}});
      if(!res.ok){ lastErr = res.status===404?`GitHub user "${u}" not found`:`HTTP ${res.status}`; continue; }
      const json = await res.json();
      if(Array.isArray(json)){ data = json; break; }
    }catch(e){ lastErr = e.message; }
  }

  if(data){
    allRepos = data.filter(r=>!r.fork);
    document.getElementById('s-repos').textContent = allRepos.length;
    buildTabs(); renderRepos(allRepos);
    toast(`✓ ${allRepos.length} repositories loaded`);
  } else {
    document.getElementById('pgrid').innerHTML=`
      <div class="pgrid-msg errm" style="grid-column:1/-1">
        <div style="margin-bottom:.8rem">⚠ Could not reach GitHub API</div>
        <div style="font-size:.72rem;color:var(--dim);line-height:1.8">
          This preview sandbox blocks external requests.<br>
          <strong style="color:var(--teal)">Download the file and open it locally</strong> — GitHub will load perfectly.<br>
          <span style="opacity:.6">Error: ${lastErr}</span>
        </div>
      </div>`;
  }
  btn.disabled=false;btn.textContent='Fetch';
}

function buildTabs(){
  const langs=[...new Set(allRepos.map(r=>r.language).filter(Boolean))];
  const c=document.getElementById('ftabs');
  c.innerHTML=`<button class="ftab on" onclick="filterLang('all')">All (${allRepos.length})</button>`;
  langs.forEach(l=>{
    const cnt=allRepos.filter(r=>r.language===l).length;
    const b=document.createElement('button');b.className='ftab';
    b.textContent=`${l} (${cnt})`;b.onclick=()=>filterLang(l);c.appendChild(b);
  });
}

function filterLang(l){
  activeLang=l;
  document.querySelectorAll('.ftab').forEach(t=>t.classList.toggle('on',t.textContent.startsWith(l==='all'?'All':l)));
  const q=document.getElementById('srch').value.toLowerCase();
  const base=l==='all'?allRepos:allRepos.filter(r=>r.language===l);
  renderRepos(q?base.filter(r=>r.name.toLowerCase().includes(q)||(r.description||'').toLowerCase().includes(q)):base);
}

document.getElementById('srch').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase();
  const base=activeLang==='all'?allRepos:allRepos.filter(r=>r.language===activeLang);
  renderRepos(q?base.filter(r=>r.name.toLowerCase().includes(q)||(r.description||'').toLowerCase().includes(q)):base);
});

function cardHTML(r,sc){
  const pin=isPin(r.id);
  return `<div class="pcard${sc?' gold-card':''}" id="card-${r.id}">
    <div class="pcard-top">
      <div><div class="pcard-name">${r.name.replace(/-/g,' ').toUpperCase()}</div></div>
      <div class="pcard-ico">${ico(r.language)}</div>
    </div>
    <p class="pcard-desc">${r.description||'No description provided.'}</p>
    <div class="pcard-foot">
      <div class="pcard-lang ${lc(r.language)}"><span class="ldot"></span>${r.language||'Unknown'}</div>
      <div class="pcard-stats"><span>★ ${r.stargazers_count}</span><span>⑂ ${r.forks_count}</span></div>
    </div>
    <div class="pcard-links">
      <a href="${r.html_url}" target="_blank" class="plnk">GitHub ↗</a>
      ${r.homepage?`<a href="${r.homepage}" target="_blank" class="plnk">Live ↗</a>`:''}
      ${sc
        ?`<button class="plnk fbtn" style="color:#ff5555;border-color:rgba(255,85,85,.3)" onclick="unpin(${r.id})">✕ Remove</button>`
        :`<button class="plnk ${pin?'fon':'fbtn'}" onclick="togglePin(${r.id})" id="pb-${r.id}">${pin?'★ Featured':'+ Feature'}</button>`
      }
    </div>
  </div>`;
}

function renderRepos(repos){
  const g=document.getElementById('pgrid');
  if(!repos.length){g.innerHTML='<div class="pgrid-msg">No repos match.</div>';g.style.background='transparent';return;}
  g.style.background='var(--border)';
  g.innerHTML=repos.map(r=>cardHTML(r,false)).join('');
}

function togglePin(id){
  const r=allRepos.find(x=>x.id===id);if(!r)return;
  if(isPin(id)){pinned=pinned.filter(p=>p.id!==id);toast('Removed from showcase');}
  else{if(pinned.length>=6){toast('⚠ Max 6 featured');return;}pinned.push(r);toast('★ Added to showcase!');}
  localStorage.setItem('abPinned2',JSON.stringify(pinned));
  renderPinned();
  const btn=document.getElementById(`pb-${id}`);
  if(btn){const on=isPin(id);btn.textContent=on?'★ Featured':'+ Feature';btn.className=`plnk ${on?'fon':'fbtn'}`;}
}

function unpin(id){
  pinned=pinned.filter(p=>p.id!==id);
  localStorage.setItem('abPinned2',JSON.stringify(pinned));
  renderPinned();toast('Removed');
  const btn=document.getElementById(`pb-${id}`);
  if(btn){btn.textContent='+ Feature';btn.className='plnk fbtn';}
}

function renderPinned(){
  const g=document.getElementById('scgrid');
  if(!pinned.length){
    g.style.background='transparent';
    g.innerHTML='<div class="sc-empty" id="scEmpty">&#10022; No featured projects yet &mdash; add them from above &#10022;</div>';
    return;
  }
  g.style.background='var(--border)';
  g.innerHTML=pinned.map(r=>cardHTML(r,true)).join('');
}

renderPinned();
fetchRepos();