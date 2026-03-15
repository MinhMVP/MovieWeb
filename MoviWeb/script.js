/* ═══════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════ */
const BASE = 'https://vsmov.com/api';

/* ═══════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════ */
let heroMovie = null;
let curMovie = null;
let curEpisodes = [];
let activeSrv = 0;
let activeEpSlug = null;
let trendingList = [];
let allList = [];
let cartoonList = [];
let wl = JSON.parse(localStorage.getItem('lum-wl') || '[]');
let searchTimer = null;

/* ═══════════════════════════════════════════════════
   API & UTILS
═══════════════════════════════════════════════════ */
async function api(ep) {
  try {
    const r = await fetch(BASE + ep, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } catch(e) { console.warn('[API]', ep, e.message); return null; }
}

function getItems(data) {
  if (!data) return [];
  return data?.data?.items || data?.items || data?.movies || data?.data || [];
}

function imgUrl(p) {
  if (!p || typeof p !== 'string') return '';
  return p.startsWith('http') ? p : 'https://vsmov.com' + p;
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function prog(p, msg) {
  document.getElementById('lb').style.width = p + '%';
  if (msg) document.getElementById('lst').textContent = msg;
}
function hideLs() { setTimeout(() => document.getElementById('ls').classList.add('hide'), 500); }

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

/* ═══════════════════════════════════════════════════
   NAV & KEYBOARD
═══════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
});
function setActive(el) {
  document.querySelectorAll('.nls a').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}
function goSection(id) {
  showHome();
  setTimeout(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 60);
}
// Bấm ESC sẽ thoát Rạp phim -> Modal -> Tìm kiếm
document.addEventListener('keydown', e => { 
  if (e.key === 'Escape') { 
    if(typeof closeTheater === 'function') closeTheater(); 
    closeModal(); 
    closeSearch(); 
  } 
});

/* ═══════════════════════════════════════════════════
   PAGES
═══════════════════════════════════════════════════ */
function showHome() {
  document.getElementById('home').style.display = 'block';
  document.getElementById('wlpage').classList.remove('show');
}
function showWL() {
  document.getElementById('home').style.display = 'none';
  document.getElementById('wlpage').classList.add('show');
  renderWL(); window.scrollTo(0, 0);
}

/* ═══════════════════════════════════════════════════
   WATCHLIST
═══════════════════════════════════════════════════ */
function saveWL() { localStorage.setItem('lum-wl', JSON.stringify(wl)); }
function inWL(slug) { return wl.some(m => (m.slug || m._id) === slug); }
function addToWL(movie) {
  const slug = movie.slug || movie._id || '';
  if (inWL(slug)) return;
  wl.push(movie); saveWL(); updateBadge();
  toast(`"${movie.name || 'Phim'}" đã thêm vào danh sách`);
  refreshCardStates();
}
function removeFromWL(slug) {
  wl = wl.filter(m => (m.slug || m._id) !== slug);
  saveWL(); updateBadge(); toast('Đã xóa khỏi danh sách');
  refreshCardStates(); renderWL();
}
function updateBadge() {
  document.getElementById('wlbadge').textContent = wl.length ? `(${wl.length})` : '';
}
function refreshCardStates() {
  document.querySelectorAll('.mc').forEach(card => {
    const btn = card.querySelector('.cab');
    if (!btn) return;
    const fn = card.getAttribute('onclick') || '';
    const m = fn.match(/openModal\('([^']+)'\)/);
    if (!m) return;
    const slug = m[1]; const inw = inWL(slug);
    btn.textContent = inw ? '✓' : '+';
    btn.classList.toggle('wl', inw);
  });
}

function renderWL() {
  const grid = document.getElementById('wlgrid');
  const empty = document.getElementById('wlempty');
  document.getElementById('wlct').textContent = `${wl.length} phim đã lưu`;
  updateBadge();
  if (!wl.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  grid.innerHTML = wl.map(m => {
    const slug = m.slug || m._id || '';
    const p = imgUrl(m.poster_url || m.thumb_url || '');
    return `<div class="wlc" onclick="openModal('${slug}')">
      ${p ? `<img src="${p}" alt="${esc(m.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
      <div class="wlcf" style="${p?'display:none':''}">🎬</div>
      <div class="wlch">
        <button class="wlab" onclick="event.stopPropagation();openModal('${slug}')">ℹ</button>
        <button class="wlab" onclick="event.stopPropagation();removeFromWL('${slug}')">✕</button>
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════
   MOVIE CARD
═══════════════════════════════════════════════════ */
function card(m, badge) {
  const slug = m.slug || m._id || '';
  const title = m.name || m.title || '';
  const year = m.year || '';
  const p = imgUrl(m.poster_url || m.thumb_url || '');
  const rating = m.tmdb?.vote_average ? parseFloat(m.tmdb.vote_average).toFixed(1) : '';
  const inw = inWL(slug);
  const mj = JSON.stringify(JSON.stringify(m));
  return `<div class="mc" onclick="openModal('${slug}')">
    ${p ? `<img class="cp" src="${p}" alt="${esc(title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
    <div class="cpf" style="${p?'display:none':''}">🎬</div>
    ${badge ? '<div class="cbadge">Mới</div>' : ''}
    <button class="cab ${inw?'wl':''}" onclick="event.stopPropagation();toggleCardWL(${mj})">${inw?'✓':'+'}</button>
    <div class="co"></div>
    <div class="ci">
      <div class="ct">${esc(title)}</div>
      <div class="cmr"><span class="cy">${year}</span>${rating?`<span class="cr">★ ${rating}</span>`:''}</div>
    </div>
  </div>`;
}

function toggleCardWL(ms) {
  try {
    const m = JSON.parse(ms);
    const slug = m.slug || m._id || '';
    if (inWL(slug)) removeFromWL(slug); else addToWL(m);
  } catch(e) {}
}

function renderRow(id, movies, badge) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!movies?.length) { el.innerHTML = '<p style="color:var(--muted);font-size:.82rem;padding:1rem 0">Không tìm thấy phim</p>'; return; }
  el.innerHTML = movies.map((m, i) => card(m, badge && i < 4)).join('');
}

function renderFeatured(movies) {
  const el = document.getElementById('row-featured');
  if (!el || !movies?.length) return;
  const [big, ...smalls] = movies.slice(0, 5);
  const bp = imgUrl(big.poster_url || big.thumb_url || '');
  const cats = (big.category || []).map(c => c.name || c).join(' · ');
  let h = `<div class="fl" onclick="openModal('${big.slug||big._id}')">
    ${bp ? `<img class="fi" src="${bp}" alt="${esc(big.name)}" onerror="this.style.display='none'">` : '<div class="fi" style="background:linear-gradient(135deg,#1a0a2e,#0d1a2e);display:flex;align-items:center;justify-content:center;height:100%;font-size:5rem">🎬</div>'}
    <div class="fgrad"></div>
    <div class="fcon"><div class="ftitle">${esc(big.name||'—')}</div><div class="fsub">${big.year||''} ${cats?'· '+cats:''}</div></div>
  </div>`;
  smalls.forEach(m => {
    const p = imgUrl(m.poster_url || m.thumb_url || '');
    h += `<div class="fsm" onclick="openModal('${m.slug||m._id}')">
      ${p ? `<img class="fi" src="${p}" alt="${esc(m.name)}" onerror="this.style.display='none'">` : '<div class="fi" style="background:linear-gradient(135deg,#1a1a2e,#0d0a1a);display:flex;align-items:center;justify-content:center;height:100%;font-size:2.5rem">🎬</div>'}
      <div class="fgrad"></div>
      <div class="fcon"><div class="ftitle">${esc(m.name||'—')}</div><div class="fsub">${m.year||''}</div></div>
    </div>`;
  });
  el.innerHTML = h;
}

/* ═══════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════ */
function setHero(m) {
  if (!m) return; heroMovie = m;
  document.getElementById('htitle').textContent = m.name || '';
  document.getElementById('hdesc').textContent = m.content || m.description || m.overview || 'Khám phá những bộ phim hấp dẫn nhất.';
  const parts = [m.year, m.quality, m.lang, m.episode_current].filter(Boolean);
  document.getElementById('hmeta').innerHTML = parts.map((p, i) =>
    i > 0 ? `<span class="dot"></span><span>${p}</span>` : `<span>${p}</span>`).join('');
  const bg = imgUrl(m.thumb_url || m.poster_url || '');
  if (bg) document.getElementById('hbg').innerHTML = `<img src="${bg}" alt="${esc(m.name)}" onerror="this.style.display='none'">`;
}
function watchHero() { if (heroMovie) openModal(heroMovie.slug || heroMovie._id); }
function addHeroWL() { if (heroMovie) addToWL(heroMovie); }
function openHeroModal() { if (heroMovie) openModal(heroMovie.slug || heroMovie._id); }

/* ═══════════════════════════════════════════════════
   ▶ THEATER PLAYER (Full Tab Mode)
═══════════════════════════════════════════════════ */
function loadEpisodes(episodes) {
  curEpisodes = episodes || [];
  activeSrv = 0; activeEpSlug = null;
  closePlayer();

  const epSec = document.getElementById('ep-section');
  const wpEl = document.getElementById('wp');

  if (!curEpisodes.length) { epSec.style.display = 'none'; wpEl.style.display = 'none'; return; }

  // Server tabs
  document.getElementById('stabs').innerHTML = curEpisodes.map((sv, i) =>
    `<button class="stab ${i===0?'active':''}" onclick="selectServer(${i},this)">${sv.server_name || 'Server '+(i+1)}</button>`
  ).join('');

  renderEpButtons(0);
  epSec.style.display = 'block';
  wpEl.style.display = 'block';
}

function renderEpButtons(si) {
  const sv = curEpisodes[si];
  if (!sv) return;
  document.getElementById('epgrid').innerHTML = (sv.server_data || []).map(ep =>
    `<button class="epb ${ep.slug===activeEpSlug?'active':''}"
      onclick="playEp('${ep.link_embed||''}','${esc(ep.name||ep.slug)}','${ep.slug}',this)">
      ${esc(ep.name || ep.slug)}
    </button>`
  ).join('');
}

function selectServer(i, btn) {
  activeSrv = i; activeEpSlug = null;
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderEpButtons(i); closePlayer();
}

function playEp(embedUrl, epName, epSlug, btn) {
  if (!embedUrl) { toast('Không có link phát cho tập này'); return; }
  activeEpSlug = epSlug;

  // Đổi màu nút chọn tập
  document.querySelectorAll('.epb').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Mở Rạp Chiếu Phim (Theater Mode)
  const theater = document.getElementById('theater-mode');
  const frame = document.getElementById('theater-frame');
  const title = document.getElementById('theater-title');
  
  const filmName = document.getElementById('mtitle').textContent;
  title.textContent = `${filmName} - ${epName || 'Full'}`;
  
  frame.src = embedUrl;
  theater.classList.add('open');
  
  const wp = document.getElementById('wp');
  if (wp) wp.style.display = 'none';
}

function closeTheater() {
  const theater = document.getElementById('theater-mode');
  const frame = document.getElementById('theater-frame');
  if(theater) theater.classList.remove('open');
  if(frame) frame.src = ''; // Tắt video để dừng tiếng
}

function closePlayer() {
  activeEpSlug = null;
  document.querySelectorAll('.epb').forEach(b => b.classList.remove('active'));
  const wp = document.getElementById('wp');
  if (wp) wp.style.display = curEpisodes.length ? 'block' : 'none';
}

function playFirst() {
  if (!curEpisodes.length) { toast('Không có tập phim'); return; }
  const sv = curEpisodes[activeSrv] || curEpisodes[0];
  const first = (sv.server_data || [])[0];
  if (!first) { toast('Không có link phát'); return; }
  const btn = document.querySelector('.epb');
  playEp(first.link_embed || '', first.name || first.slug, first.slug, btn);
}

/* ═══════════════════════════════════════════════════
   MOVIE MODAL
═══════════════════════════════════════════════════ */
async function openModal(slug) {
  if (!slug) return;
  document.getElementById('mo').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Reset
  document.getElementById('mtitle').textContent = 'Đang tải...';
  document.getElementById('mdesc').textContent = '';
  document.getElementById('mgen').innerHTML = '';
  document.getElementById('mstat').innerHTML = '';
  document.getElementById('castw').style.display = 'none';
  document.getElementById('ep-section').style.display = 'none';
  document.getElementById('wp').style.display = 'none';
  document.getElementById('mbimg').className = 'mbp'; document.getElementById('mbimg').innerHTML = '🎬';
  document.getElementById('mposter').className = 'mpp'; document.getElementById('mposter').innerHTML = '🎬';

  // GET /phim/[slug]
  const data = await api('/phim/' + slug);
  if (!data) { document.getElementById('mtitle').textContent = 'Không tải được dữ liệu'; return; }

  const m = data?.movie || data?.data?.item || data?.data || data;
  const episodes = data?.episodes || m?.episodes || [];
  curMovie = { ...m, _eps: episodes };

  const title = m.name || m.title || '—';
  const desc = m.content || m.description || m.overview || 'Chưa có mô tả.';
  const year = m.year || '';
  const time = m.time ? m.time + ' phút' : '';
  const quality = m.quality || '';
  const lang = m.lang || '';
  const epCur = m.episode_current || '';
  const cats = (m.category || []).map(c => c.name || c).filter(Boolean);
  const countries = (m.country || []).map(c => c.name || c).filter(Boolean);
  const actors = m.actor || [];
  const slug2 = m.slug || m._id || '';

  // Backdrop
  const bdUrl = imgUrl(m.thumb_url || m.poster_url || '');
  if (bdUrl) {
    const bd = document.getElementById('mbimg');
    bd.className = '';
    bd.innerHTML = `<img src="${bdUrl}" style="width:100%;aspect-ratio:16/7;object-fit:cover;display:block" onerror="this.parentElement.className='mbp';this.parentElement.innerHTML='🎬'">`;
  }
  // Poster
  const poUrl = imgUrl(m.poster_url || m.thumb_url || '');
  if (poUrl) {
    const po = document.getElementById('mposter');
    po.className = '';
    po.innerHTML = `<img src="${poUrl}" style="width:100%;display:block;aspect-ratio:2/3;object-fit:cover" onerror="this.parentElement.className='mpp';this.parentElement.innerHTML='🎬'">`;
  }

  document.getElementById('mtitle').textContent = title;
  document.getElementById('mdesc').textContent = desc;
  document.getElementById('mgen').innerHTML = [...cats, ...countries].slice(0, 6).map(g => `<span class="gt">${esc(g)}</span>`).join('');
  document.getElementById('mstat').innerHTML = [year, time, quality, lang, epCur].filter(Boolean).map(s => `<span><strong>${esc(s)}</strong></span>`).join('');
  document.getElementById('mwlbtn').textContent = inWL(slug2) ? '✓ Đã Lưu' : '＋ Danh Sách';

  if (actors.length) {
    document.getElementById('castw').style.display = 'block';
    document.getElementById('castrow').innerHTML = actors.slice(0, 12).map(n =>
      `<div class="castc"><div class="castav">🧑</div><div class="castn">${esc(n)}</div></div>`
    ).join('');
  }

  // Load episodes into player
  loadEpisodes(episodes);
}

function closeModal() {
  document.getElementById('mo').classList.remove('open');
  document.body.style.overflow = ''; 
  closeTheater(); 
  closePlayer(); 
  curMovie = null;
}
function closeModalBg(e) { if (e.target === document.getElementById('mo')) closeModal(); }
function toggleCurWL() {
  if (!curMovie) return;
  const slug = curMovie.slug || curMovie._id || '';
  if (inWL(slug)) removeFromWL(slug); else addToWL(curMovie);
  document.getElementById('mwlbtn').textContent = inWL(slug) ? '✓ Đã Lưu' : '＋ Danh Sách';
}
function shareFilm() {
  try { navigator.share({ title: curMovie?.name || '', url: window.location.href }).catch(() => {}); }
  catch { toast('Đã sao chép đường dẫn!'); }
}

/* ═══════════════════════════════════════════════════
   SEARCH
═══════════════════════════════════════════════════ */
function openSearch() {
  document.getElementById('so').classList.add('open');
  document.getElementById('si').focus();
  document.body.style.overflow = 'hidden';
}
function closeSearch() {
  document.getElementById('so').classList.remove('open');
  document.getElementById('si').value = '';
  document.getElementById('sres').innerHTML = '';
  document.body.style.overflow = '';
}
async function doSearch(q) {
  clearTimeout(searchTimer);
  const el = document.getElementById('sres');
  if (!q.trim()) { el.innerHTML = ''; return; }
  el.innerHTML = '<p style="color:var(--muted);font-size:.82rem;width:100%;text-align:center">Đang tìm...</p>';
  searchTimer = setTimeout(async () => {
    const data = await api('/tim-kiem?keyword=' + encodeURIComponent(q));
    const results = getItems(data);
    if (!results.length) { el.innerHTML = `<p style="color:var(--muted);font-size:.82rem;width:100%;text-align:center">Không tìm thấy "${esc(q)}"</p>`; return; }
    el.innerHTML = results.slice(0, 8).map(m => {
      const p = imgUrl(m.poster_url || m.thumb_url || '');
      const slug = m.slug || m._id || '';
      return `<div class="src" onclick="closeSearch();openModal('${slug}')">
        ${p ? `<img src="${p}" alt="${esc(m.name||'')}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
        <div class="srcf" style="${p?'display:none':''}">🎬</div>
        <div class="srct">${esc(m.name||'')}</div>
      </div>`;
    }).join('');
  }, 380);
}
document.getElementById('so').addEventListener('click', e => { if (e.target === document.getElementById('so')) closeSearch(); });

/* ═══════════════════════════════════════════════════
   GENRE / COUNTRY FILTERS
═══════════════════════════════════════════════════ */
async function filterGenre(slug, btn) {
  document.querySelectorAll('#cat-tabs .ctb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const el = document.getElementById('row-cat');
  el.innerHTML = '<div class="sk"></div>'.repeat(5);
  if (slug === 'all') { renderRow('row-cat', allList.slice(0, 20)); return; }
  const data = await api('/the-loai/' + slug);
  renderRow('row-cat', getItems(data).slice(0, 20));
}
async function filterCountry(slug, btn) {
  document.querySelectorAll('#country-tabs .ctb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const el = document.getElementById('row-country');
  el.innerHTML = '<div class="sk"></div>'.repeat(5);
  const data = await api('/quoc-gia/' + slug);
  renderRow('row-country', getItems(data).slice(0, 20));
}

// Cập nhật lấy theo đúng Slug con của API
async function filterCartoon(slug, btn) {
  document.querySelectorAll('#cartoon-tabs .ctb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const el = document.getElementById('row-cartoon');
  el.innerHTML = '<div class="sk"></div>'.repeat(6);
  
  if (slug === 'phim-hoat-hinh') {
    renderRow('row-cartoon', cartoonList.slice(0, 20));
    return;
  }
  
  // Lấy phim theo đúng Thể loại con
  const data = await api('/the-loai/' + slug + '?page=1');
  const movies = getItems(data);
  renderRow('row-cartoon', movies.slice(0, 20));
}

async function loadMoreCartoon() {
  toast('Đang tải thêm hoạt hình...');
  const data = await api('/the-loai/phim-hoat-hinh?page=2');
  const more = getItems(data);
  if (more.length) {
    cartoonList = [...cartoonList, ...more];
    renderRow('row-cartoon', cartoonList.slice(0, 40));
    toast(`Đã tải thêm ${more.length} phim hoạt hình`);
  } else {
    toast('Không có thêm phim hoạt hình');
  }
}
async function loadMore() {
  toast('Đang tải thêm...');
  const data = await api('/danh-sach/phim-moi-cap-nhat?page=2');
  const more = getItems(data);
  if (more.length) {
    trendingList = [...trendingList, ...more];
    renderRow('row-trending', trendingList.slice(0, 24), true);
  } else toast('Không có thêm phim mới');
}

/* ═══════════════════════════════════════════════════
   MAIN INIT
═══════════════════════════════════════════════════ */
async function init() {
  prog(8, 'Kết nối API...');

  // 1. New movies
  const trendData = await api('/danh-sach/phim-moi-cap-nhat?page=1');
  trendingList = getItems(trendData);
  prog(28, 'Đang tải phim mới...');

  // 2. All movies
  const allData = await api('/danh-sach?page=1');
  allList = getItems(allData);
  if (!allList.length) allList = trendingList;
  prog(48, 'Đang xây dựng giao diện...');

  // 3. Hero
  const pool = trendingList.length ? trendingList : allList;
  if (pool.length) setHero(pool[Math.floor(Math.random() * Math.min(6, pool.length))]);

  // 4. Render rows
  renderRow('row-trending', trendingList.slice(0, 16), true);
  renderFeatured((trendingList.length ? trendingList : allList).slice(0, 5));
  renderRow('row-cat', allList.slice(0, 20));
  renderRow('row-all', allList.slice(0, 20));

  // 5. Stats
  document.getElementById('stotal').innerHTML = `${allList.length || '—'}<span class="r">+</span>`;

  prog(65, 'Đang tải thể loại...');

  // 6. Genres — GET /the-loai
  const genData = await api('/the-loai');
  const genres = genData?.data || genData?.items || genData || [];
  if (Array.isArray(genres) && genres.length) {
    const tabs = genres.slice(0, 16).map(g =>
      `<button class="ctb" onclick="filterGenre('${g.slug||g._id}',this)">${esc(g.name)}</button>`
    ).join('');
    document.getElementById('cat-tabs').innerHTML =
      `<button class="ctb active" onclick="filterGenre('all',this)">Tất Cả</button>${tabs}`;
    document.getElementById('sgenres').innerHTML = `${genres.length}<span class="r">+</span>`;
  }

  prog(82, 'Đang tải quốc gia...');

  // 7. Countries — GET /quoc-gia
  const ctryData = await api('/quoc-gia');
  const countries = ctryData?.data || ctryData?.items || ctryData || [];
  if (Array.isArray(countries) && countries.length) {
    document.getElementById('country-tabs').innerHTML = countries.slice(0, 12).map((c, i) =>
      `<button class="ctb ${i===0?'active':''}" onclick="filterCountry('${c.slug||c._id}',this)">${esc(c.name)}</button>`
    ).join('');
    if (countries[0]) filterCountry(countries[0].slug || countries[0]._id, document.querySelector('#country-tabs .ctb'));
  }

  // 8. Cartoons — GET /the-loai/phim-hoat-hinh
  const cartoonData = await api('/the-loai/phim-hoat-hinh?page=1');
  cartoonList = getItems(cartoonData);
  renderRow('row-cartoon', cartoonList.slice(0, 20));

  prog(100, 'Sẵn sàng!');
  updateBadge();
  hideLs();
}

init().catch(e => { console.error(e); hideLs(); });