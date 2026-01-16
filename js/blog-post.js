(function(){
  function escapeHtml(s){
    return (s || '').replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);
    });
  }

  function parseFrontMatter(md){
    var fm = { meta: {}, body: md };
    if(!md.startsWith('---\n')) return fm;
    var end = md.indexOf('\n---\n', 4);
    if(end === -1) return fm;

    var raw = md.slice(4, end).trim().split(/\n/);
    var meta = {};
    raw.forEach(function(line){
      var m = line.match(/^([^:]+):\s*(.*)$/);
      if(!m) return;
      meta[m[1].trim()] = m[2].trim();
    });
    fm.meta = meta;
    fm.body = md.slice(end + 5);
    return fm;
  }

  function getSlug(){
    var params = new URLSearchParams(location.search);
    return (params.get('p') || '').trim();
  }

  function setText(id, text){
    var el = document.getElementById(id);
    if(el) el.textContent = text;
  }

  function setHtml(id, html){
    var el = document.getElementById(id);
    if(el) el.innerHTML = html;
  }

  function init(){
    var slug = getSlug();
    if(!slug){
      setText('post-title', 'No post specified');
      setHtml('post-body', '<p>Please open a post from <a href="blog/index.html">the Blog index</a>.</p>');
      return;
    }

    if(window.location.protocol === 'file:'){
      var note = document.getElementById('post-local-note');
      if(note) note.style.display = 'block';
      setText('post-title', slug);
      setHtml('post-body', '<p>Local file preview blocks loading Markdown via <code>fetch()</code>. Run a local server or open from GitHub Pages.</p>');
      return;
    }

    var postBase = 'blog/posts/';

    var url = postBase + encodeURIComponent(slug) + '.md';

    fetch(url, { cache: 'no-cache' })
      .then(function(resp){
        if(!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.text();
      })
      .then(function(md){
        var fm = parseFrontMatter(md);
        var meta = fm.meta || {};
        var body = fm.body || '';

        var title = meta.title || slug;
        setText('post-title', title);

        var metaParts = [];
        if(meta.date) metaParts.push(escapeHtml(meta.date));
        if(meta.tags) metaParts.push(escapeHtml(meta.tags));
        if(meta.source) metaParts.push('<a href="' + escapeHtml(meta.source) + '" target="_blank" rel="noopener">source</a>');
        setHtml('post-meta', metaParts.join(' · '));
        // Render markdown to HTML
        var html = null;
        if (window.MarkdownLite && typeof window.MarkdownLite.parse === 'function') {
          html = window.MarkdownLite.parse(body);
        } else if (window.renderMarkdown) {
          html = window.renderMarkdown(body);
        } else {
          html = '<pre>' + escapeHtml(body) + '</pre>';
        }

        setHtml('post-body', html);

        // Fix relative links/images inside the post (so images in blog/posts/... work)
        var container = document.getElementById('post-body');
        if (container) {
          var isRelative = function(u){
            if(!u) return false;
            // ignore anchors and absolute URLs
            return !(/^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/|#|\/)/.test(u));
          };

          container.querySelectorAll('img[src]').forEach(function(img){
            var src = img.getAttribute('src');
            if (isRelative(src)) img.setAttribute('src', postBase + src);
          });

          container.querySelectorAll('a[href]').forEach(function(a){
            var href = a.getAttribute('href');
            if (isRelative(href)) a.setAttribute('href', postBase + href);
          });
        }
      })
      .catch(function(err){
        setText('post-title', 'Failed to load post');
        setHtml('post-body', '<p>Could not load <code>' + escapeHtml(url) + '</code>.</p>');
        console.error(err);
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();