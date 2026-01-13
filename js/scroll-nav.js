/*
  Smooth-scroll navigation override for the original pt-page template.
  We keep your existing markup/classes, but make the nav behave like a normal
  in-page anchor menu now that sections flow vertically.
*/
(function(){
  function onNavClick(e){
    var a = e.currentTarget;
    var href = a.getAttribute('href') || '';
    if(href.charAt(0) !== '#') return;

    // Prevent template page-transition handlers
    e.preventDefault();
    e.stopImmediatePropagation();

    var target = document.querySelector(href);
    if(!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update active state
    document.querySelectorAll('.nav-menu a.pt-link').forEach(function(el){
      el.classList.remove('active');
    });
    a.classList.add('active');

    // Close mobile menu if open
    var headerContent = document.querySelector('header .header-content');
    if(headerContent && headerContent.classList.contains('on')){
      headerContent.classList.remove('on');
    }
  }

  function bind(){
    document.querySelectorAll('.nav-menu a.pt-link').forEach(function(a){
      // Capture phase to beat other listeners
      a.addEventListener('click', onNavClick, true);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bind);
  }else{
    bind();
  }
})();
