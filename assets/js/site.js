/* Forever Young Performance — shared behaviour */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');

  /* ---------- Mobile menu ---------- */
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    var setOpen = function (open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('open', open);
    };
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
      if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (btn.getAttribute('aria-expanded') === 'true' && !e.target.closest('.site-header')) setOpen(false);
    });
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
  }

  /* ---------- Back to top ---------- */
  var tt = document.querySelector('.totop');
  if (tt) {
    var onScroll = function () { tt.classList.toggle('show', window.scrollY > 600); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Background videos ----------
     No autoplay attribute in the HTML: we start playback here only when the
     visitor hasn't asked for reduced motion, and only while the video is on screen.
     With reduced motion (or no JS) the poster image is shown instead. */
  var videos = [].slice.call(document.querySelectorAll('video.bg-video'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var tryPlay = function (v) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); };
  if (videos.length) {
    var visible = new Set();
    var sync = function () {
      videos.forEach(function (v) {
        if (!reduce.matches && visible.has(v)) tryPlay(v); else v.pause();
      });
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); });
        sync();
      }, { rootMargin: '200px 0px' });
      videos.forEach(function (v) { io.observe(v); });
    } else {
      videos.forEach(function (v) { visible.add(v); });
      sync();
    }
    reduce.addEventListener('change', sync);
  }

  /* ---------- Netlify Forms helper ---------- */
  function encode(form) {
    var data = new FormData(form), grouped = {}, order = [];
    data.forEach(function (val, key) {
      if (!(key in grouped)) { grouped[key] = []; order.push(key); }
      if (val !== '') grouped[key].push(val);
    });
    return order.map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(grouped[k].join(', '));
    }).join('&');
  }
  function submitNetlify(form) {
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'text/html' },
      body: encode(form)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res;
    });
  }

  /* ---------- Blueprints waitlist ---------- */
  [].forEach.call(document.querySelectorAll('form.waitlist'), function (form) {
    var msg = form.querySelector('.form-msg');
    var email = form.querySelector('input[type=email]');
    var submit = form.querySelector('button[type=submit]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.className = 'form-msg';
      if (!email.value.trim() || !email.checkValidity()) {
        msg.textContent = 'Please enter a valid email address.';
        msg.classList.add('err');
        email.setAttribute('aria-invalid', 'true');
        email.focus();
        return;
      }
      email.removeAttribute('aria-invalid');
      submit.disabled = true;
      msg.textContent = 'Sending…';
      submitNetlify(form).then(function () {
        msg.textContent = 'You’re on the list. I’ll email you when Blueprints launch.';
        msg.classList.add('ok');
        form.reset();
      }).catch(function () {
        msg.innerHTML = 'Something went wrong and you weren’t added. Please try again, or email <a href="mailto:igor@forever-young-performance.com?subject=Blueprints%20waitlist">igor@forever-young-performance.com</a>.';
        msg.classList.add('err');
      }).then(function () { submit.disabled = false; });
    });
  });

  /* ---------- Application form ---------- */
  var app = document.getElementById('application');
  if (app) {
    var keys = { pt: 'pt', online: 'online', group: 'group', basketball: 'basketball', blueprints: 'blueprints', consult: 'consult' };
    var fromHash = function () {
      var k = (location.hash || '').slice(1);
      if (keys[k]) {
        var r = document.getElementById('prog-' + k);
        if (r) r.checked = true;
        var f = document.getElementById('form');
        if (f) f.scrollIntoView();
      }
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);

    var errBox = document.getElementById('apply-error');
    var wrap = document.getElementById('apply-form');
    var thanks = document.getElementById('apply-thanks');
    var sendBtn = app.querySelector('.btn-submit');
    var sendLabel = sendBtn.textContent;

    var clearErr = function (el) {
      el.removeAttribute('aria-invalid');
      var id = el.getAttribute('aria-describedby');
      var m = id && document.getElementById(id);
      if (m && m.classList.contains('field-err')) m.hidden = true;
    };
    var showFieldErr = function (el, text) {
      el.setAttribute('aria-invalid', 'true');
      var id = el.getAttribute('aria-describedby');
      var m = id && document.getElementById(id);
      if (m) { m.textContent = text; m.hidden = false; }
    };

    app.addEventListener('input', function (e) { if (e.target.matches('[aria-invalid]')) clearErr(e.target); });
    app.addEventListener('change', function (e) {
      if (e.target.name === 'program') clearErr(document.getElementById('program-set'));
      if (e.target.matches('[aria-invalid]')) clearErr(e.target);
    });

    var validate = function () {
      var firstBad = null;
      var prog = app.querySelector('input[name=program]:checked');
      var pg = document.getElementById('program-set');
      if (!prog) { showFieldErr(pg, 'Please choose a program.'); firstBad = firstBad || app.querySelector('input[name=program]'); }
      else clearErr(pg);
      [].forEach.call(app.querySelectorAll('[required]:not([name=program])'), function (el) {
        var ok = el.type === 'checkbox' ? el.checked : (el.value.trim() !== '' && el.checkValidity());
        if (!ok) {
          var t = el.type === 'email' && el.value.trim() ? 'Please enter a valid email address.'
                : el.type === 'checkbox' ? 'Please tick the box to give your consent.'
                : 'This field is required.';
          showFieldErr(el, t);
          firstBad = firstBad || el;
        } else clearErr(el);
      });
      return firstBad;
    };

    app.setAttribute('novalidate', '');
    app.addEventListener('submit', function (e) {
      e.preventDefault();
      errBox.hidden = true;
      var bad = validate();
      if (bad) { bad.focus(); return; }
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending…';
      submitNetlify(app).then(function () {
        wrap.hidden = true;
        thanks.hidden = false;
        thanks.focus();
        thanks.scrollIntoView();
        app.reset();
      }).catch(function () {
        errBox.hidden = false;
        errBox.focus();
      }).then(function () {
        sendBtn.disabled = false;
        sendBtn.textContent = sendLabel;
      });
    });

    var back = document.getElementById('back-btn');
    if (back) back.addEventListener('click', function () {
      thanks.hidden = true; wrap.hidden = false;
      var f = document.getElementById('form'); if (f) f.scrollIntoView();
    });
  }
})();
