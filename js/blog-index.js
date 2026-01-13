(function(){
  function esc(s){
    return (s||'').replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);
    });
  }

  function getBaseUrl(){
    // Make relative URLs work for:
    //   /blog/            (trailing slash)
    //   /blog             (no slash)
    //   /blog/index.html
    var href = window.location.href;
    var path = window.location.pathname || '';
    var looksLikeFile = /\.[a-zA-Z0-9]+$/.test(path);

    if(!looksLikeFile && !href.endsWith('/')) href += '/';
    if(looksLikeFile) href = href.replace(/[^\/]*$/, '');

    return href;
  }

  function render(items){
    var mount = document.getElementById('blog-list');
    if(!mount) return;

    if(!items || !items.length){
      mount.innerHTML = '<div class="alert alert-warning">No posts found. Add entries to <code>blog/posts/index.json</code>.</div>';
      return;
    }

    mount.innerHTML = items.map(function(item){
      var slug = esc(item.slug || '');
      var title = esc(item.title || slug || 'Untitled');
      var date = item.date ? esc(item.date) : '';
      var tags = Array.isArray(item.tags) ? item.tags.map(esc).join(', ') : '';
      var excerpt = esc(item.excerpt || '');

      var meta = [];
      if(date) meta.push(date);
      if(tags) meta.push(tags);

      return (
        '<div class="blog-card">' +
          '<h4><a href="../blog-post.html?p=' + encodeURIComponent(slug) + '">' + title + '</a></h4>' +
          (meta.length ? '<div class="meta">' + meta.join(' · ') + '</div>' : '') +
          (excerpt ? '<p>' + excerpt + '</p>' : '') +
        '</div>'
      );
    }).join('');
  }

  function init(){
    var mount = document.getElementById('blog-list');
    if(!mount) return;

    // If previewing locally, do not show a scary error banner.
    if(window.location.protocol === 'file:'){
      var note = document.getElementById('blog-local-note');
      if(note) note.style.display = 'block';
      render([]); // will show "No posts" warning? better show nothing
      mount.innerHTML = '';
      return;
    }

    var url = new URL('posts/index.json', getBaseUrl()).toString();

    fetch(url, { cache: 'no-cache' })
      .then(function(resp){
        if(!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(function(items){
        if(!Array.isArray(items)) items = [];
        render(items);
      })
      .catch(function(err){
        // Show a compact message (no giant red stack) while still informative.
        mount.innerHTML = '<div class="alert alert-danger">Failed to load <code>blog/posts/index.json</code>. Please check the file path and JSON syntax.</div>';
        console.error(err);
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();