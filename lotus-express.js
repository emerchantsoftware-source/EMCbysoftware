/* Lotus's Express — store directory interactions
   Expects: global DATA = [[storeNo, storeName, node, hours, range], ...] */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const PAGE = 100;
  const state = { q: '', node: '', range: '', openOnly: false, sortCol: -1, sortDir: 1, shown: PAGE };
  const nodes = [...new Set(DATA.map(r => r[2]).filter(Boolean))].sort();

  /* ---------- helpers ---------- */
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function hl(t, q) {
    if (!q) return esc(t);
    const lt = t.toLowerCase(); let out = '', i = 0, j;
    while ((j = lt.indexOf(q, i)) > -1) { out += esc(t.slice(i, j)) + '<mark>' + esc(t.slice(j, j + q.length)) + '</mark>'; i = j + q.length; }
    return out + esc(t.slice(i));
  }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  /* ---------- open-now (Bangkok time) ---------- */
  function bkkMinutes() {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    return (+p.find(x => x.type === 'hour').value % 24) * 60 + +p.find(x => x.type === 'minute').value;
  }
  let nowMin = bkkMinutes();
  function isOpen(r) {
    if (r[4] === '24 Hours' || r[3] === '24 Hours') return true;
    const m = /(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/.exec(r[3]);
    if (!m) return null;
    const a = +m[1] * 60 + +m[2], b = +m[3] * 60 + +m[4];
    return b > a ? nowMin >= a && nowMin < b : nowMin >= a || nowMin < b;
  }

  /* ---------- filter / sort / render ---------- */
  function filtered() {
    const { q, node, range, openOnly } = state;
    let list = DATA.filter(r =>
      (!node || r[2] === node) && (!range || r[4] === range) &&
      (!openOnly || isOpen(r) === true) && (!q || r.join(' ').toLowerCase().includes(q)));
    if (state.sortCol > -1) {
      const c = state.sortCol, d = state.sortDir;
      list = list.slice().sort((x, y) => (c === 0
        ? (parseInt(x[0], 10) - parseInt(y[0], 10)) || x[0].localeCompare(y[0])
        : x[c].localeCompare(y[c], 'th', { numeric: true })) * d);
    }
    return list;
  }
  function render() {
    const list = filtered(), rows = list.slice(0, state.shown), q = state.q;
    $('tb').innerHTML = rows.map(r => {
      const o = isOpen(r);
      const dot = o === null ? '' : `<span class="dot ${o ? 'on' : ''}" title="${o ? 'เปิดอยู่ตอนนี้' : 'ปิดอยู่ตอนนี้'}"></span>`;
      return `<tr><td class="no mono"><button class="copy" data-copy="${esc(r[0])}" title="คัดลอกรหัสสาขา">${hl(r[0], q)}</button></td>
        <td>${hl(r[1], q)}</td>
        <td>${r[2] ? `<button class="chipnode" data-node="${esc(r[2])}" title="กรองเฉพาะ Node นี้">${hl(r[2], q)}</button>` : '-'}</td>
        <td class="hrs mono">${dot}${hl(r[3], q) || '-'}</td>
        <td>${r[4] ? `<span class="tag ${r[4] === '24 Hours' ? 'h24' : ''}">${esc(r[4])}</span>` : '-'}</td></tr>`;
    }).join('');
    $('empty').style.display = list.length ? 'none' : 'block';
    $('count').textContent = `แสดง ${rows.length.toLocaleString()} จาก ${list.length.toLocaleString()} สาขา`;
    const left = list.length - rows.length, b = $('more');
    b.style.display = left > 0 ? 'block' : 'none';
    b.textContent = `แสดงเพิ่ม (เหลืออีก ${left.toLocaleString()} สาขา)`;
    $('openOnly').setAttribute('aria-pressed', state.openOnly);
    $('reset').style.display = (state.q || state.node || state.range || state.openOnly || state.sortCol > -1) ? '' : 'none';
    document.querySelectorAll('th[data-col]').forEach(th => {
      const on = +th.dataset.col === state.sortCol;
      th.setAttribute('aria-sort', on ? (state.sortDir > 0 ? 'ascending' : 'descending') : 'none');
    });
    $('tb').classList.remove('swap'); void $('tb').offsetWidth; $('tb').classList.add('swap');
  }
  function update(resetPage = true) { if (resetPage) state.shown = PAGE; render(); }

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
  }

  /* ---------- setup ---------- */
  $('node').insertAdjacentHTML('beforeend', nodes.map(n => `<option>${esc(n)}</option>`).join(''));

  // count-up stats
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(el, to) {
    if (reduce) { el.textContent = to.toLocaleString(); return; }
    const t0 = performance.now(), dur = 1100;
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  countUp($('s-total'), DATA.length);
  countUp($('s-24'), DATA.filter(r => r[4] === '24 Hours').length);
  countUp($('s-node'), nodes.length);
  const openCount = DATA.filter(r => isOpen(r) === true).length;
  $('s-open').dataset.v = openCount; countUp($('s-open'), openCount);

  // inputs
  $('q').addEventListener('input', debounce(e => { state.q = e.target.value.trim().toLowerCase(); update(); }, 120));
  $('node').addEventListener('change', e => { state.node = e.target.value; update(); });
  $('range').addEventListener('change', e => { state.range = e.target.value; update(); });
  $('openOnly').addEventListener('click', () => { state.openOnly = !state.openOnly; update(); });
  $('more').addEventListener('click', () => { state.shown += PAGE * 2; render(); });
  $('reset').addEventListener('click', () => {
    Object.assign(state, { q: '', node: '', range: '', openOnly: false, sortCol: -1, sortDir: 1 });
    $('q').value = ''; $('node').value = ''; $('range').value = ''; update();
  });

  // sortable headers
  document.querySelectorAll('th[data-col]').forEach(th => {
    th.tabIndex = 0;
    const go = () => {
      const c = +th.dataset.col;
      if (state.sortCol === c) { if (state.sortDir === 1) state.sortDir = -1; else { state.sortCol = -1; state.sortDir = 1; } }
      else { state.sortCol = c; state.sortDir = 1; }
      update();
    };
    th.addEventListener('click', go);
    th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  // click a store no. → copy; click a node → filter
  $('tb').addEventListener('click', e => {
    const cp = e.target.closest('.copy'), nd = e.target.closest('.chipnode');
    if (cp) {
      const v = cp.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(
        () => toast(`คัดลอกรหัสสาขา ${v} แล้ว`), () => toast('คัดลอกไม่สำเร็จ'));
    } else if (nd) {
      state.node = nd.dataset.node; $('node').value = state.node; update();
      toast(`กรอง Node: ${state.node}`);
    }
  });

  // export CSV (filtered + sorted result, BOM for Thai in Excel)
  $('export').addEventListener('click', () => {
    const list = filtered();
    const cell = v => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = '\ufeff' + [['Store No.', 'Store Name', 'Node', 'Operating Hours', 'Range'], ...list].map(r => r.map(cell).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'lotus-express-stores.csv'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`ส่งออก ${list.length.toLocaleString()} สาขาแล้ว`);
  });

  // keyboard: "/" focus search, Esc clear
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (e.key === '/' && !typing) { e.preventDefault(); $('q').focus(); $('q').select(); }
    else if (e.key === 'Escape' && document.activeElement === $('q')) {
      $('q').value = ''; state.q = ''; update(); $('q').blur();
    }
  });

  // keep open/closed status fresh
  setInterval(() => {
    const n = bkkMinutes();
    if (n !== nowMin) { nowMin = n; render(); countUp($('s-open'), DATA.filter(r => isOpen(r) === true).length); }
  }, 60000);

  render();
})();
