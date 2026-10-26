/* Progressive enhancement only: the pages and their links work without JS. */
(function () {
  'use strict';

  var THEME_KEY = 'academic-site-theme';
  var THEMES = {
    'academic': 'Academic',
    'github': 'GitHub',
    'teal-gold': 'Teal & Gold',
    'slate-blue': 'Slate Blue',
    'ivory-navy': 'Ivory & Navy',
    'graphite-lilac': 'Graphite & Lilac'
  };

  function isTheme(value) {
    return Object.prototype.hasOwnProperty.call(THEMES, value);
  }

  function defaultTheme() {
    var configured = document.documentElement.getAttribute('data-default-theme');
    return isTheme(configured) ? configured : 'github';
  }

  function readTheme() {
    try {
      var saved = window.localStorage.getItem(THEME_KEY);
      if (isTheme(saved)) return saved;
    } catch (error) {
      // Private browsing and storage policies may make persistence unavailable.
    }
    var current = document.documentElement.getAttribute('data-theme');
    return isTheme(current) ? current : defaultTheme();
  }

  function initThemes() {
    var select = document.getElementById('color-theme');
    var buttons = Array.from(document.querySelectorAll('.palette-apply[data-theme-value]'));
    var status = document.getElementById('theme-status');

    function applyTheme(value, persist) {
      var theme = isTheme(value) ? value : defaultTheme();
      document.documentElement.setAttribute('data-theme', theme);
      if (persist) {
        try { window.localStorage.setItem(THEME_KEY, theme); } catch (error) {}
      }
      if (select) select.value = theme;
      buttons.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-theme-value') === theme));
      });
      if (status) {
        status.textContent = /^zh\b/i.test(document.documentElement.lang || '')
          ? '当前配色：' + THEMES[theme] + '。'
          : 'Current color theme: ' + THEMES[theme] + '.';
      }
    }

    if (select) select.addEventListener('change', function () {
      applyTheme(select.value, true);
    });
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        applyTheme(button.getAttribute('data-theme-value'), true);
      });
    });
    window.addEventListener('storage', function (event) {
      if (event.key === THEME_KEY) applyTheme(isTheme(event.newValue) ? event.newValue : defaultTheme(), false);
      else if (event.key === null) applyTheme(defaultTheme(), false);
    });
    window.addEventListener('pageshow', function () {
      applyTheme(readTheme(), false);
    });
    applyTheme(readTheme(), false);
    document.documentElement.classList.add('theme-ready');
  }

  function initNavigation() {
    var header = document.querySelector('.site-header');
    var toggle = header && header.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!header || !toggle || !nav) return;

    var mobile = window.matchMedia('(max-width: 800px)');

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open, restoreFocus) {
      toggle.setAttribute('aria-expanded', String(open));
      header.classList.toggle('nav-open', open);
      if (!open && restoreFocus) toggle.focus();
    }

    toggle.setAttribute('aria-controls', nav.id);
    toggle.addEventListener('click', function () {
      setOpen(!isOpen(), false);
    });

    nav.addEventListener('click', function (event) {
      if (mobile.matches && event.target.closest('a[href]')) {
        setOpen(false, false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && mobile.matches && isOpen()) {
        event.preventDefault();
        setOpen(false, true);
      }
    });

    document.addEventListener('click', function (event) {
      if (!mobile.matches || !isOpen() || header.contains(event.target)) return;
      // Keep a clicked form control's focus, but do not leave focus in hidden nav.
      setOpen(false, nav.contains(document.activeElement));
    });

    header.addEventListener('focusout', function (event) {
      if (mobile.matches && isOpen() && event.relatedTarget && !header.contains(event.relatedTarget)) {
        setOpen(false, false);
      }
    });

    function onViewportChange() {
      var focusInNav = nav.contains(document.activeElement);
      setOpen(false, mobile.matches && focusInNav);
    }

    if (mobile.addEventListener) mobile.addEventListener('change', onViewportChange);
    else if (mobile.addListener) mobile.addListener(onViewportChange);

    // Register every handler before CSS is allowed to collapse the navigation.
    setOpen(false, false);
    document.documentElement.classList.add('js');
  }

  function initBanner() {
    var banner = document.querySelector('.home-banner[data-banner-mode]');
    if (!banner) return;
    var slides = Array.from(banner.querySelectorAll('.banner-slide'));
    var mode = banner.getAttribute('data-banner-mode') === 'carousel' ? 'carousel' : 'fixed';
    if (slides.length < 2 || mode === 'fixed') return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var interval = parseInt(banner.getAttribute('data-interval'), 10);
    if (!(interval >= 3000)) interval = 6000;
    var index = slides.findIndex(function (slide) { return !slide.hidden; });
    if (index < 0) index = 0;
    var timer = null;
    var hovered = false;
    var focused = banner.contains(document.activeElement);
    var suspended = false;

    function stop() {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    }

    function canRotate() {
      return !reduced.matches && !document.hidden && !hovered && !focused && !suspended;
    }

    function render() {
      slides.forEach(function (slide, number) {
        slide.hidden = number !== index;
        slide.setAttribute('aria-hidden', String(number !== index));
      });
    }

    function schedule() {
      stop();
      render();
      if (!canRotate()) return;
      timer = window.setTimeout(function () {
        timer = null;
        if (!canRotate()) return;
        index = (index + 1) % slides.length;
        schedule();
      }, interval);
    }

    banner.addEventListener('mouseenter', function () { hovered = true; schedule(); });
    banner.addEventListener('mouseleave', function () { hovered = false; schedule(); });
    banner.addEventListener('focusin', function () { focused = true; schedule(); });
    banner.addEventListener('focusout', function (event) {
      if (!banner.contains(event.relatedTarget)) { focused = false; schedule(); }
    });
    document.addEventListener('visibilitychange', schedule);
    if (reduced.addEventListener) reduced.addEventListener('change', schedule);
    else if (reduced.addListener) reduced.addListener(schedule);
    window.addEventListener('pagehide', function () { suspended = true; stop(); });
    window.addEventListener('pageshow', function () { suspended = false; schedule(); });

    schedule();
  }

  function normalize(value) {
    var text = String(value || '').toLowerCase();
    if (text.normalize) text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return text.replace(/\s+/g, ' ').trim();
  }

  function initPublicationFilters() {
    var search = document.getElementById('publication-search');
    var year = document.getElementById('publication-year');
    if (!search && !year) return;

    var groups = Array.from(document.querySelectorAll('.publication-group[data-year]'));
    var count = document.getElementById('publication-count');
    var empty = document.getElementById('publication-empty');
    var publications = groups.map(function (group) {
      return {
        element: group,
        year: group.getAttribute('data-year'),
        items: Array.from(group.querySelectorAll('.publication-item')).map(function (item) {
          return {
            element: item,
            search: normalize((item.getAttribute('data-search') || '') + ' ' + item.textContent)
          };
        })
      };
    });

    if (count) {
      count.setAttribute('role', 'status');
      count.setAttribute('aria-live', 'polite');
      count.setAttribute('aria-atomic', 'true');
    }

    function filter() {
      var words = normalize(search && search.value).split(' ').filter(Boolean);
      var selectedYear = year ? year.value : '';
      var visible = 0;

      publications.forEach(function (group) {
        var yearMatches = !selectedYear || selectedYear === 'all' || selectedYear === group.year;
        var groupVisible = 0;
        group.items.forEach(function (item) {
          var matches = yearMatches && words.every(function (word) {
            return item.search.indexOf(word) !== -1;
          });
          item.element.hidden = !matches;
          if (matches) groupVisible += 1;
        });
        group.element.hidden = groupVisible === 0;
        visible += groupVisible;
      });

      if (count) {
        var message = visible + ' publication' + (visible === 1 ? '' : 's');
        if (words.length || (selectedYear && selectedYear !== 'all')) message += ' found';
        if (count.textContent !== message) count.textContent = message;
      }
      if (empty) empty.hidden = visible !== 0;
    }

    if (search) search.addEventListener('input', filter);
    if (year) year.addEventListener('change', filter);
    // Preserve browser-restored form values when returning to the list.
    window.addEventListener('pageshow', filter);
    filter();
    // Do not expose controls that cannot filter when scripting is unavailable.
    document.documentElement.classList.add('publication-filters-ready');
  }

  function init() {
    initThemes();
    initNavigation();
    initBanner();
    initPublicationFilters();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
