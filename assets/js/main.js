/* 自立塾 — UI scripts (dependency-free) */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: compact on scroll + mobile CTA bar ---------- */
  var header = document.querySelector('.header');
  var mobilebar = document.querySelector('.mobilebar');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-compact', y > 120);
    if (mobilebar) mobilebar.classList.toggle('is-visible', y > 320);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Drawer (mobile nav) ---------- */
  var burger = document.querySelector('.burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      drawer.classList.toggle('is-open', !open);
      document.body.style.overflow = !open ? 'hidden' : '';
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        burger.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) burger.click();
    });
  }

  /* ---------- Tabs ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[role="tablist"]'), function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next); next.focus(); }
      });
    });
  });

  /* ---------- YouTube facade (load only on click) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.video[data-youtube]'), function (box) {
    box.addEventListener('click', function () {
      var id = box.getAttribute('data-youtube');
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
      frame.title = box.getAttribute('data-title') || '講演会動画';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      frame.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(frame);
    });
  });

  /* ---------- Map facade ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-map]'), function (box) {
    box.addEventListener('click', function () {
      var q = box.getAttribute('data-map');
      var frame = document.createElement('iframe');
      frame.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
      frame.title = q + ' の地図';
      frame.loading = 'lazy';
      frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0';
      box.innerHTML = '';
      box.appendChild(frame);
    });
  });

  /* ---------- Reveal on scroll (content is visible at rest) ---------- */
  var targets = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* ---------- Contact form (local demo: no server) ---------- */
  var form = document.getElementById('contact-form-el');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('form-result');
      if (msg) {
        msg.hidden = false;
        msg.focus();
        msg.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      }
    });
  }
})();

/* ---------- PC ⇄ スマホ 表示切替 ---------- */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var inFrame = params.get('sp') === '1';
  var toggle = document.getElementById('viewtoggle');
  var frame = document.getElementById('viewframe');
  var iframe = document.getElementById('viewframe-iframe');
  var closeBtn = document.getElementById('viewframe-close');
  if (!toggle) return;

  // プレビュー内ではボタンと固定バーを隠す
  if (inFrame) {
    toggle.remove();
    if (frame) frame.remove();
    return;
  }

  var viewport = document.querySelector('meta[name="viewport"]');
  var SP = 'width=device-width, initial-scale=1';
  var PC = 'width=1280';
  var label = toggle.querySelector('.viewtoggle__label');
  // 端末で判定する（読み込み時の幅では判定しない）
  var isTouch = window.matchMedia('(pointer: coarse)').matches
              || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  function setPcView(on) {
    viewport.setAttribute('content', on ? PC : SP);
    toggle.classList.toggle('is-pc', on);
    toggle.setAttribute('aria-pressed', String(on));
    label.textContent = on ? 'スマホ表示' : 'PC表示';
    try { localStorage.setItem('jj-view', on ? 'pc' : 'sp'); } catch (e) {}
  }

  function openPreview() {
    var url = location.pathname + (location.search ? location.search + '&' : '?') + 'sp=1';
    iframe.src = url;
    frame.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closePreview() {
    frame.hidden = true;
    iframe.src = 'about:blank';
    document.body.style.overflow = '';
    toggle.focus();
  }

  if (isTouch) {
    // スマホ：ボタンでPCレイアウトに切り替える（設定は記憶する）
    var saved = null;
    try { saved = localStorage.getItem('jj-view'); } catch (e) {}
    if (saved === 'pc') setPcView(true); else setPcView(false);
    toggle.addEventListener('click', function () {
      setPcView(!toggle.classList.contains('is-pc'));
    });
  } else {
    // PC：ボタンでスマホ表示のプレビューを開く
    label.textContent = 'スマホ表示';
    toggle.addEventListener('click', openPreview);
    closeBtn.addEventListener('click', closePreview);
    frame.addEventListener('click', function (e) { if (e.target === frame) closePreview(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !frame.hidden) closePreview();
    });
  }
})();
