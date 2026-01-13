(function(){
  function loadRightbar(){
    var container = document.getElementById('rightbar-content');
    if(!container) return;

    var src = container.getAttribute('data-rightbar-src') || 'data/right_sidebar.html';

    fetch(src, { cache: 'no-cache' })
      .then(function(resp){
        if(!resp.ok) throw new Error('Failed to load right sidebar: ' + resp.status);
        return resp.text();
      })
      .then(function(html){
        container.innerHTML = html;
      })
      .catch(function(err){
        // Fail silently (sidebar is optional)
        console && console.warn && console.warn(err);
      });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadRightbar);
  }else{
    loadRightbar();
  }
})();
