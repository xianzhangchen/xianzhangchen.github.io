(function(){
  const STORAGE_KEY = 'site_theme';
  // Change this to 'yellow' if you want the original look by default.
  const DEFAULT_THEME = 'academic';

  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  function setActive(theme){
    qsa('[data-set-theme]').forEach(btn => {
      const t = btn.getAttribute('data-set-theme');
      btn.classList.toggle('is-active', t === theme);
    });
  }

  function applyTheme(theme){
    const link = qs('#theme-color');
    if(!link) return;

    const yellow = link.getAttribute('data-theme-yellow') || link.href;
    const academic = link.getAttribute('data-theme-academic') || link.href;

    let href;
    if(theme === 'academic') href = academic;
    else href = yellow;

    link.setAttribute('href', href);
    document.documentElement.setAttribute('data-theme', theme);
    try{ localStorage.setItem(STORAGE_KEY, theme); }catch(e){}
    setActive(theme);
  }

  function init(){
    let theme = DEFAULT_THEME;
    try{ theme = localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME; }catch(e){}
    if(theme !== 'academic' && theme !== 'yellow') theme = DEFAULT_THEME;

    applyTheme(theme);

    // No UI is required. If you want to switch theme without exposing buttons:
    //   open browser console and run: setSiteTheme('yellow') or setSiteTheme('academic')
    window.setSiteTheme = function(t){ applyTheme(t); };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
