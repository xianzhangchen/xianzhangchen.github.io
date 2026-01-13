(function(){
  async function load(){
    const mount = document.getElementById('pub-full-list');
    if(!mount) return;

    const url = 'data/publications_full_list.html';
    try{
      const res = await fetch(url, { cache: 'no-cache' });
      if(!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();
      mount.innerHTML = html;
    }catch(err){
      console.error(err);
      mount.innerHTML = '<div class="pub-loading" style="border:1px solid #eee; padding:12px; border-radius:10px;">Failed to load publication list. Please check <code>' + url + '</code> exists in your repo.</div>';
    }
  }
  document.addEventListener('DOMContentLoaded', load);
})();
