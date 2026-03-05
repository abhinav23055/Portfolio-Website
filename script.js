/* ─── Cursor ─── */
const cur=document.getElementById('cur'),ring=document.getElementById('cur-ring');
let cx=0,cy=0,rx=0,ry=0;
addEventListener('mousemove',e=>{cx=e.clientX;cy=e.clientY;});
(function loop(){
  cur.style.left=cx+'px';cur.style.top=cy+'px';
  rx+=(cx-rx)*.1;ry+=(cy-ry)*.1;
  ring.style.left=rx+'px';ring.style.top=ry+'px';
  requestAnimationFrame(loop);
})();

/* ─── Horizontal scroll ─── */
const track=document.getElementById('track');
const panels=[...document.querySelectorAll('.panel')];
let current=0,scrolling=false;

function scrollToPanel(i,smooth=true){
  i=Math.max(0,Math.min(panels.length-1,i));
  current=i;
  const x=panels.slice(0,i).reduce((a,p)=>a+p.offsetWidth,0);
  track.style.transition=smooth?'transform .85s cubic-bezier(.77,0,.175,1)':'none';
  track.style.transform=`translateX(-${x}px)`;
  updateProgress();
  revealPanel(panels[i]);
  // hide hint after first scroll
  if(i>0) document.getElementById('scroll-hint').style.opacity='0';
}

function updateProgress(){
  const total=track.scrollWidth-window.innerWidth;
  const x=panels.slice(0,current).reduce((a,p)=>a+p.offsetWidth,0);
  document.getElementById('prog-fill').style.width=(x/total*100)+'%';
}

// wheel → horizontal panels
let wheelLock=false;
addEventListener('wheel',e=>{
  e.preventDefault();
  if(wheelLock)return;
  wheelLock=true;
  setTimeout(()=>wheelLock=false,900);
  scrollToPanel(current+(e.deltaY>0?1:-1));
},{passive:false});

// arrow keys
addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key==='ArrowDown') scrollToPanel(current+1);
  if(e.key==='ArrowLeft'||e.key==='ArrowUp')   scrollToPanel(current-1);
});

// touch swipe
let tx0=0;
addEventListener('touchstart',e=>{tx0=e.touches[0].clientX;},{passive:true});
addEventListener('touchend',e=>{
  const dx=tx0-e.changedTouches[0].clientX;
  if(Math.abs(dx)>50) scrollToPanel(current+(dx>0?1:-1));
},{passive:true});

// resize
addEventListener('resize',()=>scrollToPanel(current,false));

/* ─── Panel reveal ─── */
function revealPanel(panel){
  panel.querySelectorAll('.fade-up').forEach(el=>el.classList.add('in'));
}
// reveal hero on load
revealPanel(panels[0]);

/* ─── Skills ─── */
const SKILLS=[
  {name:'HTML / CSS',     pct:92},
  {name:'JavaScript',     pct:88},
  {name:'React.js',       pct:80},
  {name:'Node.js',        pct:78},
  {name:'MongoDB',        pct:72},
  {name:'Python',         pct:68},
  {name:'MySQL',          pct:65},
  {name:'Git & GitHub',   pct:75},
];
const sl=document.getElementById('skill-list');
sl.innerHTML=SKILLS.map((s,i)=>`
  <div class="skill-row">
    <div class="skill-name">${s.name}</div>
    <div class="skill-bar-track">
      <div class="skill-bar-fill" data-pct="${s.pct}" style="transition-delay:${i*.08}s"></div>
    </div>
    <div class="skill-pct">${s.pct}%</div>
  </div>`).join('');

// animate bars when skills panel comes into view
function animateBars(){
  document.querySelectorAll('.skill-bar-fill').forEach(b=>{
    b.style.width=b.dataset.pct+'%';
  });
}

/* override scrollToPanel to trigger bars */
const _sp=scrollToPanel;
scrollToPanel=function(i,smooth=true){
  _sp(i,smooth);
  if(panels[i]&&panels[i].id==='p-skills') setTimeout(animateBars,300);
};

/* ─── Toast ─── */
function toast(m){
  const t=document.getElementById('toast');
  t.textContent=m;t.classList.add('on');
  setTimeout(()=>t.classList.remove('on'),2400);
}

/* ─── GitHub ─── */
let repos=[],pinned=JSON.parse(localStorage.getItem('abPv5')||'[]'),lang='all';
const ICON={javascript:'●',typescript:'◆',python:'▲',html:'■',css:'◀',java:'◉',go:'◈',default:'◇'};
const LC={javascript:'ljs',typescript:'lts',python:'lpy',html:'lht',css:'lcs',java:'lja',go:'lgo',shell:'lsh',php:'lph'};
const gi=l=>ICON[(l||'').toLowerCase()]||ICON.default;
const gc=l=>LC[(l||'').toLowerCase()]||'';
const ip=id=>pinned.some(p=>p.id===id);

async function fetchRepos(){
  const u=document.getElementById('ghUser').value.trim()||'abhinav23055';
  const btn=document.getElementById('fetchBtn');
  btn.disabled=true;btn.textContent='···';
  document.getElementById('pgrid').innerHTML='<div class="pgrid-msg"><span class="spin"></span>Fetching from GitHub…</div>';
  document.getElementById('ltabs').innerHTML='<button class="ltab on" onclick="filterLang(\'all\')">All</button>';
  const eps=[
    `https://api.github.com/users/${u}/repos?per_page=100&sort=updated`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`)}`,
    `https://corsproxy.io/?${encodeURIComponent(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`)}`
  ];
  let data=null,err='';
  for(const url of eps){
    try{
      const r=await fetch(url,{headers:{'Accept':'application/vnd.github.v3+json'}});
      if(!r.ok){err=r.status===404?`User "${u}" not found`:`HTTP ${r.status}`;continue;}
      const j=await r.json();if(Array.isArray(j)){data=j;break;}
    }catch(e){err=e.message;}
  }
  if(data){
    repos=data.filter(r=>!r.fork);
    buildTabs();renderRepos(repos);
    toast('✓ '+repos.length+' repos loaded');
  } else {
    document.getElementById('pgrid').innerHTML=`<div class="pgrid-msg">⚠ ${err||'Cannot reach GitHub. Open locally for full functionality.'}</div>`;
  }
  btn.disabled=false;btn.textContent='Fetch';
}

function buildTabs(){
  const ls=[...new Set(repos.map(r=>r.language).filter(Boolean))];
  const c=document.getElementById('ltabs');
  c.innerHTML=`<button class="ltab on" onclick="filterLang('all')">All (${repos.length})</button>`;
  ls.forEach(l=>{
    const n=repos.filter(r=>r.language===l).length;
    const b=document.createElement('button');
    b.className='ltab';b.textContent=`${l} (${n})`;b.onclick=()=>filterLang(l);c.appendChild(b);
  });
}

function filterLang(l){
  lang=l;
  document.querySelectorAll('.ltab').forEach(t=>t.classList.toggle('on',t.textContent.startsWith(l==='all'?'All':l)));
  const q=document.getElementById('srch').value.toLowerCase();
  const base=l==='all'?repos:repos.filter(r=>r.language===l);
  renderRepos(q?base.filter(r=>r.name.toLowerCase().includes(q)||(r.description||'').toLowerCase().includes(q)):base);
}

document.getElementById('srch').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase();
  const base=lang==='all'?repos:repos.filter(r=>r.language===lang);
  renderRepos(q?base.filter(r=>r.name.toLowerCase().includes(q)||(r.description||'').toLowerCase().includes(q)):base);
});

function card(r,n){
  const p=ip(r.id);
  return `<div class="pcard" data-num="${String(n).padStart(2,'0')}">
    <div class="pc-name">${r.name.replace(/-/g,' ')}</div>
    <p class="pc-desc">${r.description||'No description provided.'}</p>
    <div class="pc-footer">
      <div class="pc-lang ${gc(r.language)}"><span class="ldot"></span>${r.language||'—'}</div>
      <div class="pc-stats"><span>★ ${r.stargazers_count}</span><span>⑂ ${r.forks_count}</span></div>
    </div>
    <div class="pc-links">
      <a href="${r.html_url}" target="_blank" class="plnk">GitHub ↗</a>
      ${r.homepage?`<a href="${r.homepage}" target="_blank" class="plnk">Live ↗</a>`:''}
      <button class="pfbtn${p?' on':''}" id="pb-${r.id}" onclick="togglePin(${r.id})">${p?'★ Pinned':'+ Pin'}</button>
    </div>
  </div>`;
}

function renderRepos(rs){
  const g=document.getElementById('pgrid');
  if(!rs.length){g.innerHTML='<div class="pgrid-msg">No repos found.</div>';return;}
  g.innerHTML=rs.map((r,i)=>card(r,i+1)).join('');
}

function togglePin(id){
  const r=repos.find(x=>x.id===id);if(!r)return;
  if(ip(id)){pinned=pinned.filter(p=>p.id!==id);toast('Unpinned');}
  else{if(pinned.length>=6){toast('Max 6 pins');return;}pinned.push(r);toast('★ Pinned!');}
  localStorage.setItem('abPv5',JSON.stringify(pinned));
  const b=document.getElementById('pb-'+id);
  if(b){const on=ip(id);b.textContent=on?'★ Pinned':'+ Pin';b.className='pfbtn'+(on?' on':'');}
}

fetchRepos();