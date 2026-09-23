(function () {
  // Background parallax: the spheres shift slightly opposite the pointer
  // for a layered depth effect (see .bg-spheres in theme.css).
  window.addEventListener('pointermove', function (e) {
    var nx = (e.clientX / window.innerWidth - 0.5) * 2;
    var ny = (e.clientY / window.innerHeight - 0.5) * 2;
    document.documentElement.style.setProperty('--px', nx.toFixed(3));
    document.documentElement.style.setProperty('--py', ny.toFixed(3));
  }, { passive: true });

  // Particle field: an ambient constellation of dots drifts across the
  // whole background, gently parting around the cursor, while extra dots
  // spawn at random in a short-lived trail as the cursor moves. Everything
  // shares one array so connecting lines link ambient and trail particles
  // alike.
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

  var particles = [];
  var ambientCount = Math.min(70, Math.floor((window.innerWidth * window.innerHeight) / 22000));
  for (var i = 0; i < ambientCount; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: (Math.random() * 1.3 + 0.6) * DPR,
      vx: (Math.random() - 0.5) * 0.18 * DPR,
      vy: (Math.random() - 0.5) * 0.18 * DPR,
      ambient: true,
      life: 1,
      lifeMs: Infinity
    });
  }

  var mouse = { x: -9999, y: -9999 };
  var repelDist = 100 * DPR;
  window.addEventListener('pointermove', function (e) {
    mouse.x = e.clientX * DPR;
    mouse.y = e.clientY * DPR;
  }, { passive: true });
  window.addEventListener('pointerleave', function () {
    mouse.x = -9999; mouse.y = -9999;
  });

  var last = { x: null, y: null };
  window.addEventListener('pointermove', function (e) {
    var x = e.clientX * DPR, y = e.clientY * DPR;
    var moved = last.x === null ? Infinity : Math.hypot(x - last.x, y - last.y);
    if (moved < 9 * DPR) return;
    last.x = x; last.y = y;

    // Random, sparse spawning -- not a solid line along the cursor path.
    if (Math.random() < 0.5) return;
    var n = Math.random() < 0.12 ? 2 : 1;
    for (var j = 0; j < n; j++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 28 * DPR,
        y: y + (Math.random() - 0.5) * 28 * DPR,
        r: (Math.random() * 1.3 + 0.6) * DPR,
        vx: (Math.random() - 0.5) * 0.06 * DPR,
        vy: (Math.random() - 0.5) * 0.06 * DPR,
        ambient: false,
        life: 1,
        lifeMs: 480 + Math.random() * 420
      });
    }
  }, { passive: true });

  var linkDist = 110 * DPR;
  var lastT = null;
  function step(t) {
    if (lastT === null) lastT = t;
    var dt = t - lastT;
    lastT = t;

    ctx.clearRect(0, 0, W, H);

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= dt / p.lifeMs;
      if (p.life <= 0) { particles.splice(i, 1); continue; }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.ambient) {
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < repelDist && d > 0.01) {
          var f = (repelDist - d) / repelDist * 0.6;
          p.x += (dx / d) * f * DPR;
          p.y += (dy / d) * f * DPR;
        }
      }
    }

    for (var a = 0; a < particles.length; a++) {
      for (var b = a + 1; b < particles.length; b++) {
        var pa = particles[a], pb = particles[b];
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
      var p2 = particles[a];
      ctx.fillStyle = 'rgba(224, 230, 255,' + (0.55 * p2.life) + ')';
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, p2.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();
