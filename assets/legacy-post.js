'use strict';
(function () {
  var routes = {"am-sc-literature": "/blog/am-sc-literature.html", "vim-iterm-setting": "/blog/vim-iterm-setting.html", "instructions-to-server-usage": "/blog/instructions-to-server-usage.html", "add-disorder-by-kwant": "/blog/add-disorder-by-kwant.html", "bdg-equation-different-spaces": "/blog/bdg-equation-different-spaces.html", "bdg-equation-tight-binding": "/blog/bdg-equation-tight-binding.html", "bdg-basic-knowledge": "/blog/bdg-basic-knowledge.html", "physics-article-updates": "/blog/physics-article-updates.html", "pyx-publication-ready": "/blog/pyx-publication-ready.html"};
  var slug = new URLSearchParams(window.location.search).get('p');
  if (Object.prototype.hasOwnProperty.call(routes, slug)) window.location.replace(routes[slug]);
})();
