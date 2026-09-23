(function () {
  // Background parallax: the grid + spheres shift slightly opposite the
  // pointer for a layered depth effect (see .bg-grid / .bg-spheres in theme.css).
  window.addEventListener('pointermove', function (e) {
    var nx = (e.clientX / window.innerWidth - 0.5) * 2;
    var ny = (e.clientY / window.innerHeight - 0.5) * 2;
    document.documentElement.style.setProperty('--px', nx.toFixed(3));
    document.documentElement.style.setProperty('--py', ny.toFixed(3));
  }, { passive: true });

  // Cursor trail: small constellation-style particles (dots + connecting
  // lines, like a classic particle field) spawn at random as the pointer
  // moves, and fade out quickly.
  var canvas = document.getElementById('particles');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W, H;

  function resize() {
    W = canvas.width = window.innerWidth * DPR;
    H = canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  var trail = [];
  var last = { x: null, y: null };
  var linkDist = 110 * DPR;

  window.addEventListener('pointermove', function (e) {
    var x = e.clientX * DPR, y = e.clientY * DPR;
    var moved = last.x === null ? Infinity : Math.hypot(x - last.x, y - last.y);
    if (moved < 9 * DPR) return;
    last.x = x; last.y = y;

    // Random, sparse spawning -- not a solid line along the cursor path.
    if (Math.random() < 0.5) return;
    var n = Math.random() < 0.12 ? 2 : 1;
    for (var i = 0; i < n; i++) {
      trail.push({
        x: x + (Math.random() - 0.5) * 28 * DPR,
        y: y + (Math.random() - 0.5) * 28 * DPR,
        r: (Math.random() * 1.3 + 0.6) * DPR,
        vx: (Math.random() - 0.5) * 0.06 * DPR,
        vy: (Math.random() - 0.5) * 0.06 * DPR,
        life: 1,
        lifeMs: 480 + Math.random() * 420
      });
    }
    if (trail.length > 140) trail.splice(0, trail.length - 140);
  }, { passive: true });

  var lastT = null;
  function step(t) {
    if (lastT === null) lastT = t;
    var dt = t - lastT;
    lastT = t;

    ctx.clearRect(0, 0, W, H);

    for (var i = trail.length - 1; i >= 0; i--) {
      var p = trail[i];
      p.life -= dt / p.lifeMs;
      if (p.life <= 0) { trail.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    for (var a = 0; a < trail.length; a++) {
      for (var b = a + 1; b < trail.length; b++) {
        var pa = trail[a], pb = trail[b];
        var ddx = pa.x - pb.x, ddy = pa.y - pb.y;
        var dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < linkDist) {
          var lineAlpha = 0.10 * (1 - dist / linkDist) * Math.min(pa.life, pb.life);
          ctx.strokeStyle = 'rgba(160, 190, 255,' + lineAlpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }
      var p2 = trail[a];
      ctx.fillStyle = 'rgba(224, 230, 255,' + (0.55 * p2.life) + ')';
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, p2.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();
