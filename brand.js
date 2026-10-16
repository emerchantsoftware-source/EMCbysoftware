/*!
 * E-Merchant brand component  (logo แบบ C: ลูกบาศก์ 3D หมุน)
 * ----------------------------------------------------------
 * แก้โลโก้ที่ไฟล์นี้ไฟล์เดียว ทุกหน้าจะเปลี่ยนตามอัตโนมัติ
 *
 * วิธีใช้ในแต่ละหน้า:
 *   1) <head>:   <script src="brand.js" defer></script>
 *   2) header:   <a href="index.html" class="brand" data-brand></a>
 *
 * ปรับแต่งได้ที่ตัวแปร CONFIG ด้านล่าง
 */
(function () {
  'use strict';

  var CONFIG = {
    name: 'E-Merchant',
    sub: 'by Software',
    size: 44,          // ขนาดโลโก้ใน header (px)
    spinSeconds: 14,   // เวลาหมุนครบ 1 รอบ
    showSub: true      // false = ซ่อนคำว่า "by Software"
  };

  var GREEN = '#2FBE73', LIME = '#9AD84B', INK = '#0E211A';

  var css = [
    'a.brand[data-brand]{display:inline-flex;align-items:center;gap:14px;text-decoration:none;color:var(--ink);font-size:inherit}',
    'a.brand[data-brand]:focus-visible{outline:2px solid var(--green);outline-offset:4px;border-radius:8px}',
    '.bm-logo{display:block;position:relative;flex-shrink:0;perspective:420px}',
    '.bm-cwrap{position:absolute;left:0;top:0;width:64px;height:64px;transform-style:preserve-3d;transform-origin:0 0}',
    '.bm-cube{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(-18deg) rotateY(-30deg);animation:bm-spin var(--bm-spin,14s) linear infinite}',
    'a.brand[data-brand]:hover .bm-cube{animation-play-state:paused}',
    '@keyframes bm-spin{from{transform:rotateX(-18deg) rotateY(-30deg)}to{transform:rotateX(-18deg) rotateY(330deg)}}',
    '.bm-face{position:absolute;inset:0;border-radius:6px;backface-visibility:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}',
    '.bm-face i{position:absolute;display:block;border-radius:3.5px}',
    'a.brand[data-brand] .bm-word{display:flex;flex-direction:column;line-height:1.05;font-family:\'IBM Plex Sans Thai\',sans-serif;color:var(--ink)}',
    '.bm-word b{font-size:21px;font-weight:700;letter-spacing:-.01em;color:var(--ink);',
    '  text-shadow:0 1px 0 #9aa89f,0 2px 0 #7f8f85,0 3px 0 #66766c,0 6px 8px rgba(0,0,0,.18)}',
    ':root[data-theme="dark"] .bm-word b{text-shadow:0 1px 0 #2a7a52,0 2px 0 #1f5f40,0 3px 0 #164a31,0 4px 0 #0e3624,0 8px 10px rgba(0,0,0,.55)}',
    '.bm-word small{font-size:11px;font-weight:500;color:var(--muted);margin-top:6px;letter-spacing:0}',
    '@media (max-width:420px){.bm-word small{display:none}}'
  ].join('\n');

  function flatE(c1, c2) {
    var bars = [[20, 16, 7, 32, c1], [20, 16, 26, 7, c1], [20, 28.5, 19, 7, c2], [20, 41, 26, 7, c1]];
    return bars.map(function (a) {
      return '<i style="left:' + a[0] + 'px;top:' + a[1] + 'px;width:' + a[2] + 'px;height:' + a[3] + 'px;background:' + a[4] + '"></i>';
    }).join('');
  }

  function face(transform, bg, c1, c2) {
    return '<div class="bm-face" style="background:linear-gradient(150deg,' + bg + ',rgba(0,0,0,.25)),' + bg +
      ';transform:' + transform + ' translateZ(32px)">' + (c1 ? flatE(c1, c2) : '') + '</div>';
  }

  function cube() {
    return face('rotateY(0deg)', INK, GREEN, LIME) +
           face('rotateY(90deg)', GREEN, INK, INK) +
           face('rotateY(180deg)', INK, GREEN, LIME) +
           face('rotateY(-90deg)', LIME, INK, INK) +
           face('rotateX(90deg)', '#1d4436') +
           face('rotateX(-90deg)', '#07140F');
  }

  function markup() {
    var s = CONFIG.size, k = s / 64;
    return '<span class="bm-logo" style="width:' + s + 'px;height:' + s + 'px">' +
             '<span class="bm-cwrap" style="transform:scale(' + k + ')"><span class="bm-cube" style="--bm-spin:' + CONFIG.spinSeconds + 's">' + cube() + '</span></span>' +
           '</span>' +
           '<span class="bm-word"><b>' + CONFIG.name + '</b>' + (CONFIG.showSub ? '<small>' + CONFIG.sub + '</small>' : '') + '</span>';
  }

  function mount() {
    if (!document.getElementById('bm-style')) {
      var st = document.createElement('style');
      st.id = 'bm-style';
      st.textContent = css;
      document.head.appendChild(st);
    }
    var html = markup();
    var hosts = document.querySelectorAll('[data-brand]');
    for (var i = 0; i < hosts.length; i++) {
      hosts[i].innerHTML = html;
      hosts[i].setAttribute('aria-label', CONFIG.name + ' ' + CONFIG.sub);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
