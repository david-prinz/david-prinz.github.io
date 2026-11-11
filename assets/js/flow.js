/* Gradient flow beside the AIL2026 proposal.
   A loss landscape with five singular minima, one per headline level: AI-0 at the top to AI-4 at
   the bottom. Near each minimum the loss looks like (w1 w2)^2, the textbook example of singular
   learning theory: its minimum is not a point but a cross, and the flow settles along its arms.
   The ten labels of an example paper are streams of particles that run by gradient flow into the
   minimum of their depth: the research labels (Idea, Method, Result, Proof) from the left, the
   supporting labels from the right. Labels at depth 0 are left out of a tag, so they send no stream
   and their names stand in brackets. The minimum of the headline level is marked in violet.
   The example tags come from the page's front matter (flow_examples); scrolling down the page steps
   through them, from AI-0 at the top to AI-4 at the bottom. Moving over the diagram starts a flow
   from the pointer. Respects "reduce motion" (then the streams are drawn as still flow lines) and
   pauses while the tab is hidden. */
(function () {
  var page = document.querySelector('.ail-page');
  if (!page) return;
  var aside = page.querySelector('.flow'), cv = aside && aside.querySelector('canvas'), dataEl = page.querySelector('.flow-data');
  if (!cv || !dataEl) return;
  var raw;
  try { raw = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var tagEl = aside.querySelector('.flow-tag');
  var ctx = cv.getContext('2d'), root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Example tags, written in the AIL notation ---------- */
  var RESEARCH = ['Idea', 'Method', 'Result', 'Proof'], SUPPORT = ['Text', 'Lit', 'Code', 'Data', 'Figs', 'Check'];
  function parseTag(s) {                              // "AI-2: Idea1 Method2" -> level 2, depths
    var m = String(s).match(/AI-(\d)\s*:?\s*(.*)/);
    if (!m) return null;
    var depth = {}, re = /([A-Za-z]+)(\d)/g, t;
    while ((t = re.exec(m[2]))) depth[t[1]] = Math.min(4, +t[2]);
    return { level: Math.min(4, +m[1]), depth: depth, text: String(s).trim() };
  }
  var examples = (raw || []).map(parseTag).filter(Boolean);
  if (!examples.length) return;
  aside.hidden = false;

  /* ---------- The landscape, in units of the diagram's width ---------- */
  var A = 1.84, CX = 0.56, Y0 = 0.21, GAP = (A - 0.16 - Y0) / 4;   // room above the top minimum for its name
  var A0 = 0.125, A1 = 0.18, EPS2 = 2.2e-5, R0 = 0.12, R1 = 0.21, DEEP = 1, WELL = 0.35, KX = 0.6, C45 = Math.SQRT1_2;
  function plateau(r, a, b) { return r < a ? 1 : r > b ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * (r - a) / (b - a)); }
  function yMin(k) { return Y0 + k * GAP; }
  function loss(x, y) {
    var dx = x - CX, v = KX * dx * dx;
    for (var k = 0; k < 5; k++) {
      var dy = y - yMin(k), r2 = dx * dx + dy * dy;
      if (r2 > R1 * R1) continue;
      var r = Math.sqrt(r2), u = (dx + dy) * C45, w = (dy - dx) * C45, uw = u * w;
      // the singular valley: (u w)^2 near the minimum, flat along the arms of the cross on the diagonals
      v -= DEEP * plateau(r, A0, A1) * Math.exp(-uw * uw / EPS2);
      // a wider basin around it, flat in the middle, so every stream finds its minimum
      v -= WELL * plateau(r, R0, R1);
    }
    return v;
  }
  function grad(x, y) {
    var h = 1e-4;
    return [(loss(x + h, y) - loss(x - h, y)) / (2 * h), (loss(x, y + h) - loss(x, y - h)) / (2 * h)];
  }

  /* ---------- Streams ---------- */
  var streams = RESEARCH.map(function (name, i) {
    return { name: name, research: true, x: 0.03, off: (i - 1.5) * 0.05 };
  }).concat(SUPPORT.map(function (name, i) {
    return { name: name, research: false, x: 0.97, off: (i - 2.5) * 0.04 };
  }));
  streams.forEach(function (s) { s.y = yMin(0) + s.off; s.t = 0; });
  var current = -1;
  function setExample(i) {
    if (i === current) return;
    var first = current < 0;
    current = i;
    var ex = examples[i];
    streams.forEach(function (s) {
      s.depth = ex.depth[s.name] || 0; s.goal = yMin(s.depth) + s.off;
      if (first) s.y = s.goal;                        // on load the sources start in place
    });
    if (tagEl) tagEl.textContent = ex.text;
    paintStatic();
    if (reduce.matches) still();
  }

  /* ---------- Drawing ---------- */
  var W = 0, dpr = 1, col = {}, base = document.createElement('canvas'), bctx = base.getContext('2d');
  function css(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
  function readColors() {
    col = { bg: css('--bg'), fg: css('--fg'), muted: css('--muted'), rule: css('--rule'), lake: css('--lake'),
      sun: css('--sun'), sunText: css('--sun-text'), event: css('--event') };
  }
  function resize() {
    var w = cv.clientWidth;
    if (!w) return;
    W = w; dpr = Math.min(window.devicePixelRatio || 1, 2);
    [cv, base].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(W * A * dpr); });
    [ctx, bctx].forEach(function (c) { c.setTransform(dpr * W, 0, 0, dpr * W, 0, 0); });
    paintStatic();
    if (reduce.matches) still();
  }
  // contour lines of the loss (marching squares), the singular crosses and the level names
  function paintStatic() {
    if (!W) return;
    var c = bctx, px = 1 / W;
    c.clearRect(0, 0, 1, A);
    var n = Math.round(W / 1.6), m = Math.round(n * A), hs = 1 / n, F = new Float32Array((n + 1) * (m + 1));
    for (var j = 0; j <= m; j++) for (var i = 0; i <= n; i++) F[j * (n + 1) + i] = loss(i * hs, j * hs);
    c.beginPath();
    [-1.25, -0.95, -0.7, -0.45, -0.3, -0.12, 0.02, 0.07, 0.12].forEach(function (lv) {
      for (var j = 0; j < m; j++) for (var i = 0; i < n; i++) {
        var a = F[j * (n + 1) + i] - lv, b = F[j * (n + 1) + i + 1] - lv, d = F[(j + 1) * (n + 1) + i] - lv, e = F[(j + 1) * (n + 1) + i + 1] - lv;
        var pts = [], x = i * hs, y = j * hs;
        if ((a < 0) !== (b < 0)) pts.push([x + hs * a / (a - b), y]);
        if ((b < 0) !== (e < 0)) pts.push([x + hs, y + hs * b / (b - e)]);
        if ((d < 0) !== (e < 0)) pts.push([x + hs * d / (d - e), y + hs]);
        if ((a < 0) !== (d < 0)) pts.push([x, y + hs * a / (a - d)]);
        if (pts.length >= 2) { c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); }
        if (pts.length === 4) { c.moveTo(pts[2][0], pts[2][1]); c.lineTo(pts[3][0], pts[3][1]); }
      }
    });
    c.strokeStyle = col.rule; c.lineWidth = px; c.stroke();
    var level = current >= 0 ? examples[current].level : 0, big = W >= 150;
    for (var k = 0; k < 5; k++) {
      var on = k === level, y0 = yMin(k), L = 0.11;
      c.beginPath();
      c.moveTo(CX - L, y0 - L); c.lineTo(CX + L, y0 + L); c.moveTo(CX + L, y0 - L); c.lineTo(CX - L, y0 + L);
      c.strokeStyle = on ? col.event : col.muted; c.globalAlpha = on ? 0.9 : 0.35; c.lineWidth = (on ? 1.6 : 1) * px; c.stroke();
      c.globalAlpha = 1;
      text(c, 'AI-' + k, CX, y0 - L - 0.03, 'center', on ? col.event : col.muted, (on ? '600 ' : '') + (big ? 10 : 8) + 'px');
    }
  }
  // text is drawn in pixels: canvas fonts below one unit render badly
  function text(c, s, x, y, align, color, size) {
    c.save();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.font = size + ' "IBM Plex Mono", ui-monospace, monospace';
    c.textAlign = align; c.fillStyle = color;
    c.fillText(s, x * W, y * W);
    c.restore();
  }
  function paintNames() {                             // label names at the stream sources
    if (W < 150) return;
    streams.forEach(function (s) {
      ctx.globalAlpha = s.depth ? 1 : 0.5;          // depth 0 is omitted from the tag: name in brackets
      text(ctx, s.depth ? s.name + s.depth : '(' + s.name + ')', s.research ? 0.005 : 0.995, s.y - 0.014, s.research ? 'left' : 'right', s.research ? col.lake : col.sunText, '9px');
    });
    ctx.globalAlpha = 1;
  }

  /* ---------- Particles under gradient flow ---------- */
  var moving = [], resting = [], MOB = 0.3, VMAX = 0.45, REST = 5;
  var TAIL = 16;                                      // trail length in frames
  function spawn(x, y, color) { moving.push({ x: x, y: y, c: color, age: 0, slow: 0, h: [x, y] }); }
  function advance(p, dt) {
    var g = grad(p.x, p.y), vx = -MOB * g[0], vy = -MOB * g[1], sp = Math.hypot(vx, vy);
    if (sp > VMAX) { vx *= VMAX / sp; vy *= VMAX / sp; }
    p.x += vx * dt; p.y += vy * dt;
    return sp;
  }
  var last = 0, running = false, ptr = null, ptrT = 0;
  function frame(now) {
    if (document.hidden || reduce.matches) { running = false; return; }
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    // sources glide to their new heights, and each one emits a particle now and then
    streams.forEach(function (s) {
      s.y += (s.goal - s.y) * Math.min(1, dt * 3);
      s.t += dt;
      if (s.t > 0.14 && s.depth) { s.t = 0; spawn(s.x + (s.research ? 0.14 : -0.14), s.y + (Math.random() - 0.5) * 0.008, s.research ? col.lake : col.sun); }
    });
    if (ptr && now - ptrT > 50) { ptrT = now; spawn(ptr.x, ptr.y, col.event); }
    ctx.clearRect(0, 0, 1, A);
    ctx.drawImage(base, 0, 0, 1, A);
    // move every particle a few small steps and draw its recent path, fainter towards the tail
    ctx.lineWidth = 1.2 / W; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var i = moving.length - 1; i >= 0; i--) {
      var p = moving[i], sp = 0;
      for (var k = 0; k < 3; k++) sp = advance(p, dt / 3);
      p.age += dt;
      p.h.push(p.x, p.y);
      if (p.h.length > 2 * TAIL) p.h.splice(0, 2);
      var n = p.h.length / 2, mid = Math.floor(n / 2);
      ctx.strokeStyle = p.c;
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.moveTo(p.h[0], p.h[1]);
      for (var a = 1; a <= mid; a++) ctx.lineTo(p.h[2 * a], p.h[2 * a + 1]);
      ctx.stroke();
      ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(p.h[2 * mid], p.h[2 * mid + 1]);
      for (a = mid + 1; a < n; a++) ctx.lineTo(p.h[2 * a], p.h[2 * a + 1]);
      ctx.stroke();
      p.slow = sp < 0.03 ? p.slow + dt : 0;
      if (p.slow > 0.25 || p.age > 12) { moving.splice(i, 1); p.age = 0; resting.push(p); }
    }
    // settled particles stay on the singular set for a while
    for (var j = resting.length - 1; j >= 0; j--) {
      var q = resting[j];
      q.age += dt;
      if (q.age > REST) { resting.splice(j, 1); continue; }
      ctx.globalAlpha = 0.8 * (1 - q.age / REST);
      ctx.fillStyle = q.c;
      ctx.beginPath(); ctx.arc(q.x, q.y, 1.3 / W, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.globalAlpha = 1;
    paintNames();
    requestAnimationFrame(frame);
  }
  function kick() { if (!running && !document.hidden && !reduce.matches && W) { running = true; last = 0; requestAnimationFrame(frame); } }

  // with reduced motion: one still flow line per stream
  function still() {
    if (!W) return;
    ctx.clearRect(0, 0, 1, A);
    ctx.drawImage(base, 0, 0, 1, A);
    ctx.lineWidth = 1.2 / W;
    streams.forEach(function (s) {
      s.y = s.goal;
      if (!s.depth) return;
      var p = { x: s.x + (s.research ? 0.14 : -0.14), y: s.y };
      ctx.strokeStyle = ctx.fillStyle = s.research ? col.lake : col.sun;
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      for (var i = 0; i < 1500; i++) { if (advance(p, 1 / 60) < 0.03) break; ctx.lineTo(p.x, p.y); }
      ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 / W, 0, 2 * Math.PI); ctx.fill();
    });
    paintNames();
  }

  /* ---------- Scrolling picks the example: AI-0 at the top of the page, AI-4 at the bottom ---------- */
  var autoTimer = 0;
  function fromScroll() {
    var span = document.documentElement.scrollHeight - window.innerHeight;
    if (span < 40) {                                  // nothing to scroll: step through the examples by itself
      if (!autoTimer && !reduce.matches) autoTimer = setInterval(function () { setExample((current + 1) % examples.length); }, 4000);
      return;
    }
    if (autoTimer) { clearInterval(autoTimer); autoTimer = 0; }
    var f = Math.max(0, Math.min(1, window.scrollY / span));
    setExample(Math.min(examples.length - 1, Math.floor(f * examples.length)));
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; fromScroll(); });
  }, { passive: true });

  function toModel(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.width }; }
  cv.addEventListener('pointermove', function (e) { ptr = toModel(e); });
  cv.addEventListener('pointerdown', function (e) { ptr = toModel(e); });
  cv.addEventListener('pointerleave', function () { ptr = null; });

  readColors();
  setExample(0);
  resize();
  fromScroll();
  window.addEventListener('resize', function () { resize(); fromScroll(); });
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('themechange', function () { readColors(); paintStatic(); if (reduce.matches) still(); });
  reduce.addEventListener('change', function () { if (reduce.matches) still(); else kick(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { paintStatic(); if (reduce.matches) still(); });
  kick();
})();
