/* ============================================================================
   BitsServer IT Lab — site interactivity.
   Everything here is progressive enhancement: if this script fails entirely,
   the page is still complete — all text visible, mobile menu works via the
   pure-CSS checkbox toggle already in the HTML/CSS, all links work.
   ============================================================================ */
// Run once the DOM is ready. NOTE: this file is loaded dynamically by
// js/include.js (via its "data-then" attribute) *after* header.html and
// footer.html have already been fetched and spliced in — which itself only
// happens after the page's own "DOMContentLoaded" event has already fired.
// A plain `document.addEventListener('DOMContentLoaded', fn)` at that point
// would register for an event that will never fire again, so everything
// below would silently never run. This small helper checks readyState and
// runs immediately when the document is already past the loading phase,
// while still behaving like a normal DOMContentLoaded listener if this file
// is ever loaded the conventional way (e.g. a future page includes it
// directly via a static <script> tag before the document has finished
// parsing).
function bsReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

// ---- Theme system (light / dark / system) ----
// Kept outside bsReady() and run immediately: the header/footer theme
// controls are already in the DOM by the time this file executes (include.js
// only loads main.js after both includes have been spliced in), and running
// this first means the toggle/selector reflect the correct state as soon as
// they appear rather than for one frame showing stale markup.
(function () {
  try {
    var THEME_KEY = 'bitsserver-theme';
    var root = document.documentElement;
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

    function getStored() {
      try { return localStorage.getItem(THEME_KEY); } catch (err) { return null; }
    }
    function setStored(value) {
      try { localStorage.setItem(THEME_KEY, value); } catch (err) { /* localStorage unavailable — theme still works for this page view */ }
    }
    function systemIsLight() {
      return !!(mql && mql.matches);
    }
    function resolvedTheme(pref) {
      if (pref === 'light' || pref === 'dark') return pref;
      return systemIsLight() ? 'light' : 'dark';
    }
    function updateControls(pref) {
      var active = resolvedTheme(pref);
      var toggles = document.querySelectorAll('[data-theme-toggle]');
      for (var i = 0; i < toggles.length; i++) {
        var label = pref === 'system' ? 'Theme: System (currently ' + active + ')' : 'Theme: ' + active;
        toggles[i].setAttribute('aria-label', label + '. Click to change.');
        toggles[i].setAttribute('title', label + ' — click to change');
      }
      var options = document.querySelectorAll('[data-theme-option]');
      for (var j = 0; j < options.length; j++) {
        var isActive = options[j].getAttribute('data-theme-option') === pref;
        options[j].classList.toggle('is-active', isActive);
        options[j].setAttribute('aria-pressed', isActive ? 'true' : 'false');
      }
    }
    function applyTheme(pref) {
      if (pref === 'light' || pref === 'dark') {
        root.setAttribute('data-theme', pref);
      } else {
        // "system": remove the override so CSS's prefers-color-scheme
        // media query takes back over automatically.
        root.removeAttribute('data-theme');
      }
      updateControls(pref);
    }

    var stored = getStored();
    if (stored !== 'light' && stored !== 'dark' && stored !== 'system') {
      stored = 'system';
    }
    applyTheme(stored);

    // Live-update while in "system" mode if the OS/browser theme changes.
    function handleSystemChange() {
      if ((getStored() || 'system') === 'system') applyTheme('system');
    }
    if (mql) {
      if (mql.addEventListener) mql.addEventListener('change', handleSystemChange);
      else if (mql.addListener) mql.addListener(handleSystemChange); // older Safari
    }

    // Header control: compact toggle, cycles System -> Light -> Dark -> System.
    var cycleOrder = ['system', 'light', 'dark'];
    document.addEventListener('click', function (e) {
      var toggle = e.target.closest ? e.target.closest('[data-theme-toggle]') : null;
      if (toggle) {
        var now = getStored() || 'system';
        var next = cycleOrder[(cycleOrder.indexOf(now) + 1) % cycleOrder.length];
        setStored(next);
        applyTheme(next);
        return;
      }
      // Footer control: explicit System / Light / Dark buttons.
      var option = e.target.closest ? e.target.closest('[data-theme-option]') : null;
      if (option) {
        var val = option.getAttribute('data-theme-option');
        setStored(val);
        applyTheme(val);
      }
    });
  } catch (err) { /* theme system is a progressive enhancement — the page still renders via CSS defaults */ }
})();

bsReady(function () {

  // ---- Scroll progress bar + header shrink + back-to-top visibility ----
  try {
    var progressBar = document.getElementById('scroll-progress');
    var header = document.getElementById('site-header');
    var backToTop = document.getElementById('back-to-top');
    window.addEventListener('scroll', function () {
      try {
        var h = document.documentElement;
        var scrolled = h.scrollTop || document.body.scrollTop;
        var height = h.scrollHeight - h.clientHeight;
        if (progressBar) progressBar.style.width = (height > 0 ? (scrolled / height) * 100 : 0) + '%';
        if (header) { if (window.scrollY > 40) header.classList.add('scrolled'); else header.classList.remove('scrolled'); }
        if (backToTop) { if (window.scrollY > 500) backToTop.classList.add('show'); else backToTop.classList.remove('show'); }
      } catch (err) {}
    }, { passive: true });
    if (backToTop) backToTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  } catch (err) {}

  // ---- Cursor glow (desktop only, CSS already hides it under 900px) ----
  try {
    var cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('mousemove', function (e) {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
      });
    }
  } catch (err) {}

  // ---- Close mobile menu when a link is tapped ----
  try {
    var navCheck = document.getElementById('nav-check');
    document.querySelectorAll('#main-nav a').forEach(function (link) {
      link.addEventListener('click', function () { if (navCheck) navCheck.checked = false; });
    });
  } catch (err) {}

  // ---- Highlight active nav link on scroll ----
  try {
    var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('#main-nav a[href^="#"]'));
    if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) { l.classList.remove('active'); });
            var match = navLinks.filter(function (l) { return l.getAttribute('href') === '#' + entry.target.id; })[0];
            if (match) match.classList.add('active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(function (s) { observer.observe(s); });
    }
  } catch (err) {}

  // ---- Reveal-on-scroll for elements with .reveal (adds .anim treatment) ----
  try {
    var revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length && 'IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('anim');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('anim', 'no-js'); });
    }
  } catch (err) {}

  // ---- Stat counters: HTML already shows the final number as a fallback ----
  try {
    var statsAnimated = false;
    function animateStats() {
      try {
        if (statsAnimated) return;
        var statsSection = document.getElementById('stats');
        if (!statsSection) return;
        var rect = statsSection.getBoundingClientRect();
        if (rect.top > window.innerHeight || rect.bottom < 0) return;
        statsAnimated = true;
        document.querySelectorAll('.stat-num').forEach(function (el) {
          var target = parseInt(el.getAttribute('data-target'), 10) || 0;
          var suffix = el.getAttribute('data-suffix') || '';
          var current = 0;
          var duration = 1400;
          var stepTime = Math.max(Math.floor(duration / Math.max(target, 1)), 10);
          var timer = setInterval(function () {
            current += Math.ceil(target / (duration / stepTime));
            if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = current + suffix;
          }, stepTime);
        });
      } catch (err) {}
    }
    window.addEventListener('scroll', animateStats, { passive: true });
    animateStats();
  } catch (err) {}

  // ---- Contact form: client-side handling (see form's data-endpoint note in HTML) ----
  try {
    var form = document.getElementById('contact-form');
    var formStatus = document.getElementById('form-status');
    if (form) {
      form.addEventListener('submit', function (e) {
        var endpoint = form.getAttribute('action');
        var isPlaceholder = !endpoint || endpoint.indexOf('REPLACE_WITH') !== -1;
        if (isPlaceholder) {
          e.preventDefault();
          if (formStatus) {
            formStatus.textContent = 'Form endpoint not connected yet — see the note in the page source for setup steps.';
            formStatus.style.color = '#ff8a8a';
          }
        }
        // If a real endpoint is configured, the form submits normally (e.g. to
        // Cloudflare Pages Forms, Formspree, or a Worker — see HTML comment).
      });
    }
  } catch (err) {}
  // ---- Contact form(s): submit via WhatsApp instead of email/endpoint ----
  try {
    var waForms = document.querySelectorAll('.whatsapp-contact-form');
    waForms.forEach(function (form) {
      var statusEl = form.querySelector('.form-note') || form.querySelector('[id$="form-status"]');
      var waNumber = (form.getAttribute('data-whatsapp') || '971507155863').replace(/[^0-9]/g, '');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameField = form.querySelector('[name="name"]');
        var emailField = form.querySelector('[name="email"]');
        var subjectField = form.querySelector('[name="subject"]');
        var messageField = form.querySelector('[name="message"]');
        var name = nameField ? nameField.value.trim() : '';
        var email = emailField ? emailField.value.trim() : '';
        var subject = subjectField ? subjectField.value.trim() : '';
        var message = messageField ? messageField.value.trim() : '';
        var lines = [
          'New inquiry from bitsserver.com',
          'Name: ' + name,
          'Email: ' + email
        ];
        if (subject) lines.push('Subject: ' + subject);
        lines.push('Message: ' + message);
        var text = encodeURIComponent(lines.join('\n'));
        var waUrl = 'https://wa.me/' + waNumber + '?text=' + text;
        if (statusEl) {
          statusEl.textContent = 'Opening WhatsApp…';
          statusEl.style.color = '';
        }
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      });
    });
  } catch (err) {}

  // ---- Footer year ----
  try {
    var yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  } catch (err) {}

});
