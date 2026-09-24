(function () {
  // The demos run on machines at our booth (Tailscale / local IPs), so they
  // are only reachable from nearby. Before opening one, probe it briefly; if
  // it doesn't answer, tell the visitor where to find us instead of leaving
  // them on a browser error page.
  var TIMEOUT_MS = 3000;

  function probe(url) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    return fetch(url, { mode: 'no-cors', cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function () { clearTimeout(timer); return true; })
      .catch(function () { clearTimeout(timer); return false; });
  }

  function showNotice(what, url) {
    var overlay = document.createElement('div');
    overlay.className = 'booth-overlay';
    overlay.innerHTML =
      '<div class="booth-modal" role="dialog" aria-modal="true" aria-labelledby="booth-title">' +
        '<div class="booth-icon" aria-hidden="true">📍</div>' +
        '<h3 id="booth-title">Έλα να μας βρεις!</h3>' +
        '<p>Μπορείς να δοκιμάσεις ' + what + ' μόνο από κοντά, στο περίπτερό μας.</p>' +
        '<p class="booth-number">Θα μας βρεις στο νούμερο <strong>67</strong></p>' +
        '<button type="button" class="booth-close">Εντάξει</button>' +
        '<a class="booth-anyway" href="' + url + '" target="_blank" rel="noopener">Άνοιγμα ούτως ή άλλως</a>' +
      '</div>';

    function close() {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.classList.contains('booth-close') || e.target.classList.contains('booth-anyway')) close();
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    overlay.querySelector('.booth-close').focus();
  }

  document.querySelectorAll('.launch a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      if (link.classList.contains('checking')) return;
      var url = link.href;
      var what = link.getAttribute('data-what') || 'το παιχνίδι';
      var label = link.innerHTML;
      link.classList.add('checking');
      link.innerHTML = 'Σύνδεση…';

      probe(url).then(function (ok) {
        link.classList.remove('checking');
        link.innerHTML = label;
        if (!ok) { showNotice(what, url); return; }
        // No 'noopener' feature here: it makes window.open return null, which
        // would be indistinguishable from a blocked popup.
        var w = window.open(url, '_blank');
        if (w) w.opener = null;
        else window.location.href = url;
      });
    });
  });
})();
