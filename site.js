/* Ryan mc — the few things the pages do: copy buttons, the live server state,
   the moving name, entrances and the drifting prints. Every one of them leaves
   the page readable when it does not run. */
(function () {
  var root = document.documentElement;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- the clip of the world holds still for people who asked for less motion ---- */
  if (still) document.querySelectorAll('video[autoplay]').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });

  /* ---- copy buttons ---- */
  document.querySelectorAll('.copy').forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.dataset.target);
      if (!el) return;
      var text = el.textContent.trim();
      var done = function () {
        btn.textContent = '已複製';
        btn.dataset.copied = 'yes';
        setTimeout(function () { btn.textContent = label; delete btn.dataset.copied; }, 1600);
      };
      var fallback = function () {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* the text stays selected for a manual copy */ }
        document.body.removeChild(ta);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    });
  });

  /* ---- is the PC on right now? ----
     mcstatus.io follows the SRV record and pings the server the way a player's
     client does, so "up" here means players can really get in. The answer lights
     the dots in the moving name and fills the status line. */
  var statusText = document.getElementById('status-text');
  if (statusText) {
    var url = 'https://api.mcstatus.io/v2/status/java/mc.ryanchiu623.dpdns.org';
    var check = function () {
      fetch(url, { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) {
          if (d.online) {
            var p = d.players || {};
            var names = (p.list || []).map(function (x) { return x.name_clean; }).filter(Boolean);
            root.dataset.server = 'up';
            statusText.textContent = p.online
              ? '現在開著，' + p.online + ' 人在線' + (names.length ? '：' + names.slice(0, 5).join('、') + (names.length > 5 ? ' 等' : '') : '')
              : '現在開著，還沒有人在線';
          } else {
            root.dataset.server = 'down';
            statusText.textContent = '現在沒開，電腦大概關著';
          }
        })
        .catch(function () {
          root.dataset.server = 'unknown';
          statusText.textContent = '暫時查不到伺服器狀態';
        });
    };
    check();
    setInterval(check, 60000);
  }

  /* ---- the moving name: a steady 40px a second whatever the screen ---- */
  var tracks = document.querySelectorAll('.track');
  var pace = function () {
    tracks.forEach(function (t) {
      var half = t.scrollWidth / 2;
      if (still) {
        // one copy of the name centred, both ends cropped
        var first = t.firstElementChild;
        var shift = window.innerWidth / 2 - (first.offsetLeft + first.offsetWidth / 2);
        t.style.transform = 'translateX(' + shift + 'px)';
      } else {
        t.style.setProperty('--slide', (half / 40).toFixed(1) + 's');
      }
    });
  };
  if (tracks.length) {
    pace();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(pace);
    window.addEventListener('resize', pace);
  }

  /* ---- entrances: each part of a section in turn, once ---- */
  var groups = document.querySelectorAll('[data-reveal]');
  groups.forEach(function (g) {
    // a long rule section has dozens of parts; only the first few wait their turn
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 5)); });
  });
  if ('IntersectionObserver' in window && !still) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    groups.forEach(function (g) { io.observe(g); });
  } else {
    groups.forEach(function (g) { g.classList.add('in'); });
  }

  /* ---- the prints drift a little against the scroll ---- */
  var prints = document.querySelectorAll('.print');
  if (prints.length && !still) {
    var ticking = false;
    var drift = function () {
      ticking = false;
      prints.forEach(function (p, i) {
        var r = p.closest('section').getBoundingClientRect();
        var t = (window.innerHeight - r.top) / (window.innerHeight + r.height); // 0 → 1 across the section
        var amp = [36, -28, 20][i % 3];
        p.style.setProperty('--float', ((t - 0.5) * amp).toFixed(1) + 'px');
      });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }
})();
