/* Water ripples behind the home-page hero.
   A damped 2D wave equation on a coarse grid, drawn as thin horizontal lines with
   sunset-orange glints on the crests. The pointer drags through the water like a stick.
   Respects "reduce motion" (shows a still frame) and pauses when off-screen. */
(function () {
  var band = document.querySelector('.hero-band[data-animation="water"]');
  if (!band) return;
  var cv = band.querySelector('.hero-canvas');
  var ctx = cv.getContext('2d');
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var touchOnly = window.matchMedia('(hover: none)');

  var CELL = 6, LINE_EVERY = 3, DAMP = 0.991, C2 = 0.16, GAIN = 0.75, GLINT = 2.4;
  var cols = 0, rows = 0, a, b, w = 0, h = 0;
  var running = false, onScreen = true, energy = 0, ptr = null, last = null, dropTimer = 0;
  var col = {};

  function readColors() {
    var s = getComputedStyle(root);
    col.wave = s.getPropertyValue('--lake').trim();
    col.sun = s.getPropertyValue('--sun').trim();
    col.waveA = parseFloat(s.getPropertyValue('--wave-alpha')) || 0.3;
    col.glintA = parseFloat(s.getPropertyValue('--glint-alpha')) || 0.6;
  }

  function resize() {
    var r = band.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL) + 2; rows = Math.ceil(h / CELL) + 2;
    a = new Float32Array(cols * rows); b = new Float32Array(cols * rows);
    if (reduce.matches) stillFrame(); else draw();
  }

  function disturb(x, y, s, rad) {
    var cx = Math.round(x / CELL), cy = Math.round(y / CELL);
    for (var j = -rad; j <= rad; j++) for (var i = -rad; i <= rad; i++) {
      var X = cx + i, Y = cy + j;
      if (X < 1 || Y < 1 || X >= cols - 1 || Y >= rows - 1) continue;
      var d = Math.sqrt(i * i + j * j) / (rad + 0.5);
      if (d < 1) { var k = s * 0.5 * (1 + Math.cos(Math.PI * d)); a[Y * cols + X] += k; b[Y * cols + X] += k; }
    }
  }

  function step() {
    var e = 0;
    for (var y = 1; y < rows - 1; y++) {
      var o = y * cols;
      for (var x = 1; x < cols - 1; x++) {
        var i = o + x;
        var v = (2 * a[i] - b[i] + C2 * (a[i - 1] + a[i + 1] + a[i - cols] + a[i + cols] - 4 * a[i])) * DAMP;
        b[i] = v; e += v < 0 ? -v : v;
      }
    }
    var t = a; a = b; b = t;
    energy = e / (cols * rows);
  }

  function lift(v) { return Math.max(-12, Math.min(12, v * GAIN)); }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1; ctx.strokeStyle = col.wave; ctx.globalAlpha = col.waveA;
    ctx.beginPath();
    for (var y = LINE_EVERY; y < rows - 1; y += LINE_EVERY) {
      var o = y * cols;
      for (var x = 0; x < cols; x++) {
        var px = (x - 1) * CELL, py = (y - 1) * CELL + lift(a[o + x]);
        if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.lineWidth = 1.4; ctx.strokeStyle = col.sun; ctx.globalAlpha = col.glintA;
    ctx.beginPath();
    for (var y2 = LINE_EVERY; y2 < rows - 1; y2 += LINE_EVERY) {
      var o2 = y2 * cols;
      for (var x2 = 1; x2 < cols; x2++) {
        if (a[o2 + x2] > GLINT && a[o2 + x2 - 1] > GLINT) {
          ctx.moveTo((x2 - 2) * CELL, (y2 - 1) * CELL + lift(a[o2 + x2 - 1]));
          ctx.lineTo((x2 - 1) * CELL, (y2 - 1) * CELL + lift(a[o2 + x2]));
        }
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function stillFrame() {
    a.fill(0); b.fill(0);
    disturb(w * 0.72, h * 0.55, 26, 6);
    for (var i = 0; i < 160; i++) step();
    draw();
  }

  function scheduleDrop() {
    // Without a mouse, a gentle drop now and then keeps the water alive.
    if (!touchOnly.matches || reduce.matches) return;
    clearTimeout(dropTimer);
    dropTimer = setTimeout(function () { disturb(Math.random() * w, Math.random() * h, 16, 6); kick(); }, 5000);
  }

  function frame() {
    if (!onScreen || document.hidden || reduce.matches) { running = false; return; }
    if (ptr) {
      var p = ptr; ptr = null;
      if (last) {
        var dx = p.x - last.x, dy = p.y - last.y, dist = Math.sqrt(dx * dx + dy * dy);
        var n = Math.max(1, Math.ceil(dist / CELL)), s = Math.min(16, 3 + dist * 0.3);
        for (var k = 1; k <= n; k++) disturb(last.x + dx * k / n, last.y + dy * k / n, -s / n * 2, 4);
      }
      last = p;
    }
    step(); draw();
    if (energy < 0.004 && !ptr) { running = false; scheduleDrop(); return; }
    requestAnimationFrame(frame);
  }
  function kick() { if (!running && onScreen && !document.hidden && !reduce.matches) { running = true; requestAnimationFrame(frame); } }

  function local(e) { var r = band.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  band.addEventListener('pointermove', function (e) { ptr = local(e); kick(); });
  band.addEventListener('pointerleave', function () { last = null; });
  band.addEventListener('pointerdown', function (e) { var p = local(e); disturb(p.x, p.y, 18, 6); kick(); });

  new ResizeObserver(resize).observe(band);
  new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; kick(); }).observe(band);
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('themechange', function () { readColors(); draw(); });
  reduce.addEventListener('change', function () { if (reduce.matches) stillFrame(); else kick(); });

  readColors(); resize();
  if (!reduce.matches) setTimeout(function () { disturb(w * 0.72, h * 0.55, 22, 6); kick(); }, 700);
})();
