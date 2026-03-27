/* CONFIG */
const BASE='https://vsmov.com/api';
let heroM=null,curWatchM=null,curEps=[],activeSrv=0,activeEpSlug=null;
let tList=[],aList=[],cList=[];
let wl=JSON.parse(localStorage.getItem('lum-wl4')||'[]');
let sTimer=null;

/* API */
async function api(ep){
  try{const r=await fetch(BASE+ep,{headers:{accept:'application/json'}});if(!r.ok)throw Error(r.status);return await r.json();}
  catch(e){console.warn('[API]',ep,e.message);return null;}
}
function items(d){if(!d)return[];return d?.data?.items||d?.items||d?.movies||d?.data||[];}
function imgUrl(p){if(!p||typeof p!=='string')return'';return p.startsWith('http')?p:'https://vsmov.com'+p;}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

/* LOADING & TOAST */
function prog(p,t){document.getElementById('lb').style.width=p+'%';if(t)document.getElementById('ltxt').textContent=t;}
function hideLs(){setTimeout(()=>document.getElementById('ls').classList.add('hide'),400);}
function toast(m){const el=document.getElementById('toast');el.textContent=m;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2400);}

/* NAV & VIEW MANAGER */
window.addEventListener('scroll',()=>{});
function setAct(el){document.querySelectorAll('.nlinks a').forEach(a=>a.classList.remove('act'));el.classList.add('act');}
function goSec(id){showHome();setTimeout(()=>{const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth'});},60);}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();}});

function switchView(viewId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('show-page'));
  document.getElementById(viewId).classList.add('show-page');
  window.scrollTo(0,0);
  // Dừng video nếu rời khỏi trang xem
  if(viewId !== 'watch-pg') {
    document.getElementById('vframe').src = '';
  }
}

function showHome() { switchView('home-pg'); }
function showWL() { switchView('wl-pg'); renderWL(); }

/* WATCHLIST */
function saveWL(){localStorage.setItem('lum-wl4',JSON.stringify(wl));}
function inWL(slug){return wl.some(m=>(m.slug||m._id)===slug);}
function addWL(movie){const slug=movie.slug||movie._id||'';if(inWL(slug))return;wl.push(movie);saveWL();updBadge();toast(`Đã thêm vào danh sách`);refreshCards();}
function rmWL(slug){wl=wl.filter(m=>(m.slug||m._id)!==slug);saveWL();updBadge();toast('Đã xóa khỏi danh sách');refreshCards();if(document.getElementById('wl-pg').classList.contains('show-page')) renderWL();}
function updBadge(){document.getElementById('wlbadge').textContent=wl.length?`(${wl.length})`:'';} 
function refreshCards(){
  document.querySelectorAll('.mc').forEach(c=>{
    const btn=c.querySelector('.mc-add');if(!btn)return;
    const fn=c.getAttribute('onclick')||'';
    const m=fn.match(/openWatch\('([^']+)'\)/);if(!m)return;
    const inw=inWL(m[1]);btn.textContent=inw?'✓':'+';btn.classList.toggle('wl',inw);
  });
  if(curWatchM) {
    const slug=curWatchM.slug||curWatchM._id||'';
    const wbtn=document.getElementById('w-wlbtn');
    if(wbtn) wbtn.innerHTML=inWL(slug)?'✓ Đã Lưu':'♥ Lưu Danh Sách';
  }
}
function renderWL(){
  const g=document.getElementById('wlg'),em=document.getElementById('wlem');
  document.getElementById('wlsub').textContent=`${wl.length} phim đã lưu`;updBadge();
  if(!wl.length){g.innerHTML='';em.style.display='block';return;}
  em.style.display='none';
  g.innerHTML=wl.map(m=>{
    const slug=m.slug||m._id||'';
    const p=imgUrl(m.poster_url||m.thumb_url||'');
    return`<div class="wlc" onclick="openWatch('${slug}')">
      ${p?`<img src="${p}" alt="${esc(m.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}
      <div class="wlcfb" style="${p?'display:none':''}">🎬</div>
      <button class="wlrm" onclick="event.stopPropagation();rmWL('${slug}')" title="Xóa">✕</button>
      <div class="wlci"><div class="wlct">${esc(m.name||'')}</div><div class="wlcy">${m.year||''}</div></div>
    </div>`;
  }).join('');
}

/* CARD */
function card(m,badge){
  const slug=m.slug||m._id||'';
  const title=m.name||m.title||'';
  const year=m.year||'';
  const p=imgUrl(m.poster_url||m.thumb_url||'');
  const inw=inWL(slug);
  const ep=m.episode_current||'';
  const qual=m.quality||'HD';
  const mj=JSON.stringify(JSON.stringify(m));
  return`<div class="mc" onclick="openWatch('${slug}')">
    <div class="mc-iw">
      ${p?`<img class="mc-img" src="${p}" alt="${esc(title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}
      <div class="mc-fb" style="${p?'display:none':''}">🎬</div>
      <div class="mc-hd">${esc(qual)}</div>
      ${ep&&ep!=='Full'?`<div class="mc-ep">${esc(ep)}</div>`:''}
      <div class="mc-ov"><button class="mc-play">▶</button></div>
      <button class="mc-add ${inw?'wl':''}" onclick="event.stopPropagation();cardWL(${mj})">${inw?'✓':'+'}</button>
    </div>
    <div class="mc-info"><div class="mc-title">${esc(title)}</div><div class="mc-yr">${year}</div></div>
  </div>`;
}
function cardWL(ms){try{const m=JSON.parse(ms);const slug=m.slug||m._id||'';if(inWL(slug))rmWL(slug);else addWL(m);}catch(e){}}

function sk(){return`<div class="sk"><div class="ski"></div><div class="skl1"></div><div class="skl2"></div></div>`;}
function sks(n){return Array(n).fill(sk()).join('');}

function renderRow(id,movies){
  const el=document.getElementById(id);if(!el)return;
  if(!movies?.length){el.innerHTML='<p style="color:var(--muted);font-size:.78rem;padding:.5rem 0">Không có phim</p>';return;}
  el.innerHTML=movies.map(m=>card(m)).join('');
}

/* HERO */
function setHero(m){
  if(!m)return;heroM=m;
  document.getElementById('htitle').textContent=m.name||'';
  document.getElementById('hdesc').textContent=m.content||m.description||'';
  document.getElementById('hyr').textContent=m.year||'';
  const epEl=document.getElementById('hep');
  if(m.episode_current){epEl.textContent=m.episode_current;epEl.style.display='inline';}
  const parts=[m.quality,m.lang,m.time?m.time+' phút':''].filter(Boolean);
  document.getElementById('hmeta').innerHTML=parts.map((p,i)=>i>0?`<span class="hmdot"></span><span class="hmi">${p}</span>`:`<span class="hmi">${p}</span>`).join('');
  const bg=imgUrl(m.thumb_url||m.poster_url||'');
  if(bg)document.getElementById('hbg').innerHTML=`<img src="${bg}" alt="${esc(m.name)}" onerror="this.style.display='none'">`;
}
function watchHero(){if(heroM)openWatch(heroM.slug||heroM._id);}

/* =========================================
   WATCH PAGE LOGIC
   ========================================= */
async function openWatch(slug){
  if(!slug)return;
  switchView('watch-pg'); // Chuyển sang View Xem Phim
  
  // Reset Text
  document.getElementById('w-title').textContent='Đang tải...';
  ['w-origin','w-desc','w-tags','w-stats','w-cast'].forEach(id=>document.getElementById(id).innerHTML='');
  document.getElementById('w-cast-wrap').style.display='none';
  document.getElementById('vframe').src='';
  document.getElementById('w-noplayer').style.display='flex';
  document.getElementById('w-notxt').textContent='Đang tải dữ liệu...';
  document.getElementById('w-epnow').textContent='—';
  
  // Random "Có thể bạn sẽ thích" cho đẹp
  let relatedPool = [...tList, ...aList].sort(()=> 0.5 - Math.random()).slice(0, 10);
  renderRow('row-related', relatedPool);

  const data=await api('/phim/'+slug);
  if(!data){document.getElementById('w-title').textContent='Không tìm thấy phim';return;}
  
  const m=data?.movie||data?.data?.item||data?.data||data;
  const episodes=data?.episodes||m?.episodes||[];
  curWatchM={...m,_eps:episodes};
  const slug2=m.slug||m._id||'';

  document.getElementById('w-title').textContent=m.name||'—';
  document.getElementById('w-origin').textContent=m.origin_name||'';
  document.getElementById('w-desc').textContent=m.content||m.description||'Chưa có mô tả.';
  
  const cats=(m.category||[]).map(c=>c.name||c).filter(Boolean);
  const countries=(m.country||[]).map(c=>c.name||c).filter(Boolean);
  document.getElementById('w-tags').innerHTML=[...cats,...countries].slice(0,6).map(g=>`<span>${esc(g)}</span>`).join('');
  document.getElementById('w-stats').innerHTML=[m.year,m.time?m.time+' phút':'',m.quality,m.lang,m.episode_current].filter(Boolean).map(s=>`<span><strong>${esc(s)}</strong></span>`).join('');
  
  const wbtn=document.getElementById('w-wlbtn');
  if(wbtn) wbtn.innerHTML=inWL(slug2)?'✓ Đã Lưu':'♥ Lưu Danh Sách';

  if(m.actor && m.actor.length){
    document.getElementById('w-cast-wrap').style.display='block';
    document.getElementById('w-cast').innerHTML=m.actor.slice(0,10).map(n=>`<span>${esc(n)}</span>`).join('');
  }

  loadWatchEps(episodes, m.status);
}

function loadWatchEps(episodes,status){
  curEps=episodes||[];activeSrv=0;activeEpSlug=null;
  const tabs=document.getElementById('w-stabs');
  const grid=document.getElementById('w-epgrid');
  const np=document.getElementById('w-noplayer');
  
  if(!curEps.length){
    tabs.innerHTML='';grid.innerHTML='';
    np.style.display='flex';
    document.getElementById('w-notxt').textContent=(status==='trailer')?'Phim sắp ra mắt - Chưa có bản phát.':'Phim đang cập nhật, vui lòng quay lại sau!';
    return;
  }
  
  tabs.innerHTML=curEps.map((sv,i)=>
    `<button class="epst ${i===0?'act':''}" onclick="selWatchSrv(${i},this)">${esc(sv.server_name||'Server '+(i+1))}</button>`
  ).join('');
  
  renderWatchEpBtns(0);
  
  // Tự động phát tập đầu tiên
  const first=(curEps[0]?.server_data||[])[0];
  if(first) playWatchEp(first.link_embed||'', first.name||first.slug, first.slug, null);
}

function renderWatchEpBtns(si){
  const sv=curEps[si];if(!sv)return;
  document.getElementById('w-epgrid').innerHTML=(sv.server_data||[]).map(ep=>
    `<button class="epb ${ep.slug===activeEpSlug?'act':''}" onclick="playWatchEp('${esc(ep.link_embed||'')}','${esc(ep.name||ep.slug)}','${ep.slug}',this)">${esc(ep.name||ep.slug)}</button>`
  ).join('');
}

function selWatchSrv(i,btn){
  activeSrv=i;
  document.querySelectorAll('#w-stabs .epst').forEach(b=>b.classList.remove('act'));btn.classList.add('act');
  renderWatchEpBtns(i);
}

function playWatchEp(url,name,slug,btn){
  if(!url){toast('Không có link phát');return;}
  activeEpSlug=slug;
  
  // Update Buttons
  document.querySelectorAll('#w-epgrid .epb').forEach(b=>b.classList.remove('act'));
  if(btn) btn.classList.add('act');
  else {
    // If auto-playing first ep, find the button and add class
    const firstBtn = document.querySelector('#w-epgrid .epb');
    if(firstBtn) firstBtn.classList.add('act');
  }
  
  document.getElementById('w-noplayer').style.display='none';
  document.getElementById('vframe').src=url;
  document.getElementById('w-epnow').textContent=name||'Full';
  document.getElementById('w-svname').textContent=curEps[activeSrv]?.server_name||'';
  
  // Cuộn nhẹ lên Player
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function toggleWatchWL(){
  if(!curWatchM)return;const slug=curWatchM.slug||curWatchM._id||'';
  if(inWL(slug))rmWL(slug);else addWL(curWatchM);
  document.getElementById('w-wlbtn').innerHTML=inWL(slug)?'✓ Đã Lưu':'♥ Lưu Danh Sách';
}
function shareFilm(){
  try{navigator.share({title:curWatchM?.name||'',url:window.location.href}).catch(()=>{});}
  catch{toast('Đã copy đường dẫn!');}
}

/* SEARCH */
function openSearch(){document.getElementById('sov').classList.add('open');setTimeout(()=>document.getElementById('sinp').focus(),50);document.body.style.overflow='hidden';}
function closeSearch(){document.getElementById('sov').classList.remove('open');document.getElementById('sinp').value='';document.getElementById('sres').innerHTML='';document.body.style.overflow='';}
async function doSearch(q){
  clearTimeout(sTimer);const el=document.getElementById('sres');
  if(!q.trim()){el.innerHTML='';return;}
  el.innerHTML='<p style="color:var(--muted);font-size:.78rem;width:100%;text-align:center">Đang tìm...</p>';
  sTimer=setTimeout(async()=>{
    const data=await api('/tim-kiem?keyword='+encodeURIComponent(q));
    const results=items(data);
    if(!results.length){el.innerHTML=`<p style="color:var(--muted);font-size:.78rem;width:100%;text-align:center">Không tìm thấy "${esc(q)}"</p>`;return;}
    el.innerHTML=results.slice(0,9).map(m=>{
      const p=imgUrl(m.poster_url||m.thumb_url||'');const slug=m.slug||m._id||'';
      return`<div class="sov-c" onclick="closeSearch();openWatch('${slug}')">
        ${p?`<img src="${p}" alt="${esc(m.name||'')}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:''}
        <div class="sov-cf" style="${p?'display:none':''}">🎬</div>
        <div class="sov-ct">${esc(m.name||'')}</div>
      </div>`;
    }).join('');
  },350);
}
document.getElementById('sov').addEventListener('click',e=>{if(e.target===document.getElementById('sov'))closeSearch();});

/* FILTERS */
async function filterG(slug,btn){
  document.querySelectorAll('#gtabs .gt').forEach(b=>b.classList.remove('act'));btn.classList.add('act');
  document.getElementById('row-g').innerHTML=sks(5);
  if(slug==='all'){renderRow('row-g',aList.slice(0,20));return;}
  const d=await api('/the-loai/'+slug);renderRow('row-g',items(d).slice(0,20));
}
async function filterC(slug,btn){
  document.querySelectorAll('#ctabs .gt').forEach(b=>b.classList.remove('act'));btn.classList.add('act');
  document.getElementById('row-c').innerHTML=sks(6);
  if(slug==='phim-hoat-hinh'){renderRow('row-c',cList.slice(0,20));return;}
  const d=await api('/the-loai/'+slug);
  const mv=items(d).filter(m=>m.type==='animation'||(m.category||[]).some(c=>c.slug==='phim-hoat-hinh'));
  renderRow('row-c',mv.slice(0,20));
}
async function filterQG(slug,btn){
  document.querySelectorAll('#qgtabs .gt').forEach(b=>b.classList.remove('act'));btn.classList.add('act');
  document.getElementById('row-qg').innerHTML=sks(5);
  const d=await api('/quoc-gia/'+slug);renderRow('row-qg',items(d).slice(0,20));
}
async function loadMoreT(){
  toast('Đang tải thêm...');
  const d=await api('/danh-sach/phim-moi-cap-nhat?page=2');const more=items(d);
  if(more.length){tList=[...tList,...more];renderRow('row-t',tList.slice(0,24));}else toast('Không có thêm');
}
async function loadMoreC(){
  toast('Đang tải thêm hoạt hình...');
  const d=await api('/the-loai/phim-hoat-hinh?page=2');const more=items(d);
  if(more.length){cList=[...cList,...more];renderRow('row-c',cList.slice(0,40));toast('Đã tải thêm '+more.length+' phim');}else toast('Không có thêm');
}

/* INIT */
async function init(){
  prog(8,'Kết nối API...');
  const td=await api('/danh-sach/phim-moi-cap-nhat?page=1');tList=items(td);
  prog(22,'Đang tải phim mới...');
  const ad=await api('/danh-sach?page=1');aList=items(ad);if(!aList.length)aList=tList;
  prog(38,'Đang xây dựng...');
  
  const pool=tList.length?tList:aList;
  if(pool.length)setHero(pool[Math.floor(Math.random()*Math.min(6,pool.length))]);
  
  renderRow('row-t',tList.slice(0,20));renderRow('row-g',aList.slice(0,20));
  const series=aList.filter(m=>m.type==='series'||(m.episode_total&&parseInt(m.episode_total)>1));
  renderRow('row-s',series.length?series.slice(0,20):aList.slice(5,25));
  prog(55,'Đang tải hoạt hình...');
  
  const cd=await api('/the-loai/phim-hoat-hinh?page=1');cList=items(cd);renderRow('row-c',cList.slice(0,20));
  prog(68,'Đang tải thể loại...');
  
  const hd=await api('/the-loai/phim-kinh-di');renderRow('row-h',items(hd).slice(0,20));
  
  const gd=await api('/the-loai');const genres=gd?.data||gd?.items||gd||[];
  if(Array.isArray(genres)&&genres.length){
    document.getElementById('gtabs').innerHTML=
      `<button class="gt act" onclick="filterG('all',this)">Tất Cả</button>`+
      genres.slice(0,14).map(g=>`<button class="gt" onclick="filterG('${g.slug||g._id}',this)">${esc(g.name)}</button>`).join('');
  }
  prog(85,'Đang tải quốc gia...');
  
  const ctd=await api('/quoc-gia');const countries=ctd?.data||ctd?.items||ctd||[];
  if(Array.isArray(countries)&&countries.length){
    document.getElementById('qgtabs').innerHTML=countries.slice(0,12).map((c,i)=>
      `<button class="gt ${i===0?'act':''}" onclick="filterQG('${c.slug||c._id}',this)">${esc(c.name)}</button>`
    ).join('');
    if(countries[0])filterQG(countries[0].slug||countries[0]._id,document.querySelector('#qgtabs .gt'));
  }
  prog(100,'Sẵn sàng!');updBadge();hideLs();
}
init().catch(e=>{console.error(e);hideLs();});