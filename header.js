/* =====================================================================
   header.js  —  Shared site header (HTML + CSS + behaviour) in ONE file
   ---------------------------------------------------------------------
   USE: on every page, put this exactly where the header should appear
   (right after <body>, after the login gate if the page has one):

       <script src="header.js"></script>

   Do NOT wrap it in a <div> — the header is position:sticky and would
   stop sticking if it sat inside a short wrapper.

   EDIT: change the menu / buttons in HEADER_HTML, the styling in
   HEADER_CSS. Every page picks up the change automatically.

   Menu highlight: automatic by file name, or <body data-nav="customers"> to force one.
   Language hook (optional): window.__onLangChange = function(lang){ ... }

   Needs (from each page's own CSS): the :root colour variables
   (--ink, --paper, --green, --line, --header-bg, --ink-fixed, --paper-fixed)
   and brand.js (fills the <a data-brand> logo, same as before).
   ===================================================================== */
(function () {
  'use strict';

  var HEADER_CSS = `
  header .brand{font-weight:700; font-size:20px; letter-spacing:-0.01em; text-decoration:none; color:var(--ink); display:flex; align-items:center; gap:12px;}
  header .brand span{color:var(--green); font-family:'IBM Plex Mono','IBM Plex Sans Thai', monospace;}
  header{
    position:sticky; top:0; z-index:50;
    background:var(--header-bg);
    backdrop-filter:blur(10px);
    transition:background .3s ease;
    border-bottom:1px solid var(--line);
    padding:18px 6vw;
    display:flex; justify-content:space-between; align-items:center;
  }
  nav{display:flex; gap:28px; align-items:center;}
  .nav-links{display:flex; align-items:center; gap:28px;}
  .nav-utils{display:flex; align-items:center; gap:14px;}
  .util-row{display:flex; align-items:center; gap:14px;}
  .nav-toggle{
    display:none; background:none; border:none; padding:6px; color:var(--ink);
    cursor:pointer; align-items:center; justify-content:center; border-radius:8px;
  }
  .nav-toggle:hover{color:var(--green);}

  @media (max-width:820px){
    header{position:sticky;}
    .nav-toggle{display:flex;}
    #site-nav{
      position:absolute; top:100%; left:0; right:0;
      background:var(--paper); border-bottom:1px solid var(--line);
      flex-direction:column; align-items:stretch; gap:0;
      max-height:0; overflow:hidden; transition:max-height .3s ease;
      box-shadow:0 16px 30px rgba(0,0,0,0.1);
    }
    #site-nav.open{max-height:600px;}
    .nav-links{flex-direction:column; align-items:stretch; gap:0;}
    .nav-links a{padding:16px 6vw; border-bottom:1px solid var(--line); opacity:1;}
    .nav-utils{flex-direction:column; align-items:stretch; gap:12px; padding:16px 6vw;}
    .nav-utils .nav-cta{width:100%; text-align:center; border-radius:8px; padding:14px;}
  }
  nav a{color:var(--ink); text-decoration:none; font-size:14px; font-weight:500; opacity:0.75; transition:opacity .2s;}
  nav a:hover, nav a.active{opacity:1;}
  .nav-cta{
    background:var(--ink-fixed); color:var(--paper-fixed) !important; opacity:1 !important;
    padding:9px 18px; border-radius:999px; font-size:13px !important; font-weight:600 !important;
    transition:transform .2s ease, background .2s ease !important;
  }
  .nav-cta:hover{background:var(--green); transform:translateY(-2px);}
  .theme-toggle{
    width:36px; height:36px; border-radius:999px; border:1px solid var(--line);
    background:transparent; color:var(--ink); display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:border-color .2s ease, color .2s ease, transform .2s ease;
  }
  .theme-toggle:hover{border-color:var(--green); color:var(--green); transform:translateY(-2px);}
  .lang-toggle{
    width:36px; height:36px; border-radius:999px; border:1px solid var(--line);
    background:transparent; color:var(--ink); display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:border-color .2s ease, color .2s ease, transform .2s ease;
    font-family:'IBM Plex Mono','IBM Plex Sans Thai', monospace; font-size:11px; font-weight:600;
  }
  .lang-toggle:hover{border-color:var(--green); color:var(--green); transform:translateY(-2px);}
`;

  var HEADER_HTML = `
<header>
  <a href="index.html" class="brand" data-brand></a>
  <button id="nav-toggle" class="nav-toggle" aria-label="Menu" aria-expanded="false"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
  <nav id="site-nav">
    <div class="nav-links">
      <a href="dashboard.html" data-nav="dashboard">Dashboard</a>
      <a href="equipment.html" data-nav="equipment" data-th="อุปกรณ์" data-en="Equipment">อุปกรณ์</a>
      <a href="index.html#customers" data-nav="customers" data-th="ลูกค้า" data-en="Customers">ลูกค้า</a>
      <a href="index.html#teams" data-nav="teams" data-th="ทีมงาน" data-en="Team">ทีมงาน</a>
    </div>
    <div class="nav-utils">
      <div class="util-row">
        <button id="lang-toggle" class="lang-toggle" aria-label="Switch language" title="EN / TH">EN</button>
        <button id="theme-toggle" class="theme-toggle" aria-label="สลับโหมดมืด/สว่าง" title="สลับโหมดมืด/สว่าง"><svg id="theme-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></svg></button>
        <button id="logout-btn" class="theme-toggle" aria-label="Logout" title="ออกจากระบบ / Logout"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>
      </div>
      <a href="index.html#contact" class="nav-cta" data-th="ติดต่อทีม" data-en="Contact Us">ติดต่อทีม</a>
    </div>
  </nav>
</header>
`;

  // ---------- 1) Inject CSS + HTML (synchronously, right where the <script> tag is) ----------
  var style = document.createElement('style');
  style.id = 'site-header-css';
  style.textContent = HEADER_CSS;
  document.head.appendChild(style);

  var anchor = document.currentScript;
  anchor.insertAdjacentHTML('beforebegin', HEADER_HTML);

  // ---------- 2) Highlight the current menu item ----------
  // Automatic from the file name (dashboard.html -> Dashboard, equipment*.html -> Equipment).
  // Any page can force one with:  <body data-nav="customers">   (dashboard | equipment | customers | teams)
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var current = (document.body && document.body.getAttribute('data-nav')) ||
                (here.indexOf('dashboard') === 0 ? 'dashboard' : here.indexOf('equipment') === 0 ? 'equipment' : '');
  if (current) {
    var cur = document.querySelector('#site-nav .nav-links a[data-nav="' + current + '"]');
    if (cur) cur.classList.add('active');
  }

  // "Contact Us": scroll to this page's own #contact footer if it has one, otherwise go to index.html#contact
  document.addEventListener('DOMContentLoaded', function () {
    var cta = document.querySelector('#site-nav .nav-cta');
    if (cta && document.getElementById('contact')) cta.setAttribute('href', '#contact');
  });

  // ---------- 3) Dark / light toggle ----------
  (function () {
    var root = document.documentElement;
    var btn = document.getElementById('theme-toggle');
    var icon = document.getElementById('theme-icon');
    var moon = '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"></path>';
    var sun  = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>';
    function render() {
      if (icon) icon.innerHTML = root.getAttribute('data-theme') === 'dark' ? sun : moon;
    }
    render();
    if (btn) btn.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') === 'dark';
      if (dark) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', 'dark');
      try { localStorage.setItem('theme', dark ? 'light' : 'dark'); } catch (e) {}
      render();
    });
  })();

  // ---------- 4) Language toggle TH / EN (translates the WHOLE page: every [data-th][data-en]) ----------
  (function () {
    var btn = document.getElementById('lang-toggle');
    function applyLang(lang) {
      document.querySelectorAll('[data-th]').forEach(function (el) {
        var val = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-th');
        if (val === null) return;
        if (el.hasAttribute('data-i18n-placeholder')) el.setAttribute('placeholder', val);
        else el.innerHTML = val;
      });
      document.documentElement.lang = lang === 'en' ? 'en' : 'th';
      if (btn) btn.textContent = lang === 'en' ? 'TH' : 'EN';
      try { localStorage.setItem('lang', lang); } catch (e) {}
      // optional hook: a page can define  window.__onLangChange = function(lang){ ... }  to re-render its own dynamic content
      if (typeof window.__onLangChange === 'function') window.__onLangChange(lang);
    }
    window.applyLang = applyLang;           // pages can call this after adding content dynamically
    var lang = 'th';
    try { lang = localStorage.getItem('lang') || 'th'; } catch (e) {}
    document.documentElement.lang = lang === 'en' ? 'en' : 'th';   // correct <html lang> from the very first script on the page
    // wait until the rest of the page exists, then translate everything
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { applyLang(lang); });
    else applyLang(lang);
    if (btn) btn.addEventListener('click', function () {
      lang = (btn.textContent === 'EN') ? 'en' : 'th';
      applyLang(lang);
    });
  })();

  // ---------- 5) Mobile hamburger ----------
  (function () {
    var toggle = document.getElementById('nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;
    function close() { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    toggle.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', nav.classList.toggle('open') ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
    window.addEventListener('resize', function () { if (window.innerWidth > 820) close(); });
  })();

  // ---------- 6) Logout ----------
  (function () {
    var btn = document.getElementById('logout-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      try { sessionStorage.removeItem('authed'); localStorage.removeItem('authed'); } catch (e) {}
      document.documentElement.classList.remove('authed');
      // pages without a login gate -> go back to index.html where the gate lives
      if (!document.getElementById('login-gate')) location.href = 'index.html';
    });
  })();
})();
