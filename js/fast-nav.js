(function(){
  function isInternalLink(a){
    if(!a || !a.href) return false;
    const url = new URL(a.href, window.location.href);
    if(url.origin !== window.location.origin) return false;
    if(a.hasAttribute('data-no-fade')) return false;
    // Ignore hash-only jumps
    if(url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return false;
    return true;
  }

  function onClick(e){
    const a = e.target.closest && e.target.closest('a');
    if(!a) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if(a.target && a.target !== '_self') return;
    if(!isInternalLink(a)) return;
    e.preventDefault();
    document.body.classList.add('page-leave');
    const href = a.href;
    setTimeout(()=>{ window.location.href = href; }, 80);
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Ensure we don't start hidden if something injected a class
    document.body.classList.remove('page-leave');
    document.addEventListener('click', onClick);
  });
})();