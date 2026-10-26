/* Apply a saved palette before the stylesheet paints. */
(function () {
  var allowed = ['academic', 'github', 'teal-gold', 'slate-blue', 'ivory-navy', 'graphite-lilac'];
  var theme;
  try { theme = window.localStorage.getItem('academic-site-theme'); } catch (error) {}
  if (allowed.indexOf(theme) === -1) {
    theme = document.documentElement.getAttribute('data-default-theme');
    if (allowed.indexOf(theme) === -1) theme = 'github';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
