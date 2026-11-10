/* Light/dark switch. The choice is saved in this browser only (localStorage), never sent anywhere. */
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('.theme-toggle');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (!btn) return;

  function isDark() { return root.dataset.theme ? root.dataset.theme === 'dark' : mq.matches; }
  function label() {
    btn.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
  }
  function changed() {
    label();
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  btn.addEventListener('click', function () {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    changed();
  });
  mq.addEventListener('change', changed);
  label();
})();

/* Spam-protected e-mail links (see _includes/email.html): build the address only here, in the browser. */
(function () {
  var links = document.querySelectorAll('a.mail[data-u][data-d]');
  for (var i = 0; i < links.length; i++) {
    var a = links[i], addr = a.getAttribute('data-u') + '@' + a.getAttribute('data-d');
    a.href = 'mailto:' + addr;
    if (!a.hasAttribute('data-keep-text')) a.textContent = addr;
  }
})();
