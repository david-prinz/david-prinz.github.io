/* A mountain above the Personal page.
   A stick figure hikes along the ridge and climbs the steep summit block, cheers at the summit cross,
   and then skis down the face in turns through deep snow. Its tracks stay on the face and slowly drift
   over, so every run adds a new line, as on a real powder slope. The ridge is drawn from a fixed seed,
   so the mountain looks the same on every visit. By day a pale sun with eight light rays stands in a
   light turquoise sky; by night a pale crescent moon and a few stars, with a faint violet afterglow
   above the ranges.
   Respects "reduce motion" (then the figure stands at the summit beside two old tracks) and pauses
   while the tab is hidden. */
(function () {
  var band = document.querySelector('.mountain-band');
  if (!band) return;
  var cv = band.querySelector('canvas'), ctx = cv.getContext('2d'), root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  band.hidden = false;

  /* ---------- The ridges, in units of the band (x: width, y: height) ---------- */
  function seeded(s) {                                // a small fixed-seed random generator (mulberry32)
    return function () {
      s = s + 0x6D2B79F5 | 0;
      var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  // rocky detail by midpoint displacement; x stays ordered, so a ridge is a function of x
  function detail(pts, seed, rough) {
    var r = seeded(seed), out = pts;
    for (var it = 0; it < 4; it++) {
      var nx = [out[0]];
      for (var i = 1; i < out.length; i++) {
        var a = out[i - 1], b = out[i], dx = b[0] - a[0];
        nx.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (r() - 0.5) * dx * rough * 4], b);
      }
      out = nx;
    }
    return out;
  }
  var FRONT = detail([[-0.02, 0.97], [0.06, 0.88], [0.12, 0.85], [0.18, 0.73], [0.22, 0.75], [0.28, 0.62], [0.32, 0.64],
    [0.37, 0.52], [0.41, 0.48], [0.44, 0.40], [0.462, 0.37], [0.475, 0.25], [0.487, 0.21], [0.497, 0.13], [0.505, 0.11],
    [0.52, 0.15], [0.55, 0.22], [0.59, 0.29], [0.63, 0.33], [0.67, 0.41], [0.72, 0.46], [0.77, 0.55], [0.82, 0.59],
    [0.87, 0.69], [0.93, 0.75], [1.02, 0.85]], 7, 0.55);
  var BACK = detail([[-0.02, 0.6], [0.07, 0.45], [0.12, 0.5], [0.19, 0.33], [0.25, 0.41], [0.3, 0.29], [0.36, 0.39],
    [0.42, 0.34], [0.5, 0.48], [0.6, 0.4], [0.66, 0.24], [0.71, 0.32], [0.76, 0.2], [0.81, 0.29], [0.87, 0.18],
    [0.92, 0.3], [0.97, 0.26], [1.02, 0.38]], 3, 0.45);
  // lower both ranges a little, to leave sky for the sun or the moon
  [FRONT, BACK].forEach(function (r) { r.forEach(function (p) { p[1] = 0.15 + 0.85 * p[1]; }); });
  var top = 0;                                        // the summit: the highest point of the front ridge
  FRONT.forEach(function (p, i) { if (p[1] < FRONT[top][1]) top = i; });
  var SUMMIT = FRONT[top], START = 0.3;
  function ridge(x) {                                 // height of the front ridge at x (band units)
    var lo = 0, hi = FRONT.length - 1;
    if (x <= FRONT[0][0]) return FRONT[0][1];
    if (x >= FRONT[hi][0]) return FRONT[hi][1];
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (FRONT[m][0] <= x) lo = m; else hi = m; }
    var a = FRONT[lo], b = FRONT[hi];
    return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
  }

  /* ---------- Drawing ---------- */
  var W = 0, H = 0, dpr = 1, u = 1, col = {}, base = document.createElement('canvas'), bctx = base.getContext('2d');
  function css(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
  function readColors() {
    col = { bg: css('--bg'), surface: css('--surface'), fg: css('--fg'), muted: css('--muted'), rule: css('--rule'),
      sun: css('--sun'), lake: css('--lake') };
  }
  function trace(c, pts, close) {
    c.beginPath();
    c.moveTo(pts[0][0] * W, pts[0][1] * H);
    for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0] * W, pts[i][1] * H);
    if (close) { c.lineTo(W + 10, H + 10); c.lineTo(-10, H + 10); c.closePath(); }
  }
  // the still part: both ranges, some rock on the summit block and the summit cross
  // a pale sun by day and a pale crescent moon with a few stars by night, on the right, behind the ranges
  function night() {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(col.bg);
    return m ? (parseInt(m[1], 16) * 0.3 + parseInt(m[2], 16) * 0.59 + parseInt(m[3], 16) * 0.11) < 100 : false;
  }
  function sky(c) {
    var x = (W < 600 ? 0.8 : 0.82) * W, y = 0.2 * H, r = (W < 600 ? 13 : 17) * u;
    if (!night()) {
      var sk = c.createLinearGradient(0, 0, 0, 0.75 * H);             // a light turquoise sky, fading towards the ranges
      sk.addColorStop(0, 'rgba(92, 196, 191, 0.24)'); sk.addColorStop(1, 'rgba(92, 196, 191, 0)');
      c.fillStyle = sk; c.fillRect(0, 0, W, H);
      var g = c.createRadialGradient(x, y, r * 0.8, x, y, r * 2.6);
      g.addColorStop(0, col.sun); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = 0.12; c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.6, 0, 2 * Math.PI); c.fill();
      c.globalAlpha = 0.36; c.fillStyle = col.sun; c.beginPath(); c.arc(x, y, r, 0, 2 * Math.PI); c.fill();
      c.globalAlpha = 0.18; c.strokeStyle = col.sun; c.lineCap = 'round';      // eight light rays
      c.lineWidth = Math.max(2.5, 0.24 * r); c.beginPath();
      for (var k = 0; k < 8; k++) {
        var ca = Math.cos(k * Math.PI / 4), sa = Math.sin(k * Math.PI / 4);
        c.moveTo(x + 1.45 * r * ca, y + 1.45 * r * sa); c.lineTo(x + 2.05 * r * ca, y + 2.05 * r * sa);
      }
      c.stroke();
      c.globalAlpha = 1;
      return;
    }
    var st = seeded(5);
    c.fillStyle = col.lake;
    for (var i = 0; i < 18; i++) {
      c.globalAlpha = 0.2 + st() * 0.35;
      c.beginPath(); c.arc(st() * W, st() * 0.45 * H, (0.5 + st() * 0.7) * u, 0, 2 * Math.PI); c.fill();
    }
    c.globalAlpha = 0.5; c.beginPath(); c.arc(x, y, r, 0, 2 * Math.PI); c.fill();
    c.globalAlpha = 1; c.globalCompositeOperation = 'destination-out';           // the crescent: cut the moon with a second disc
    c.beginPath(); c.arc(x + r * 0.45, y - r * 0.2, r * 0.9, 0, 2 * Math.PI); c.fill();
    c.globalCompositeOperation = 'source-over';
    var gl = c.createLinearGradient(0, 0.05 * H, 0, 0.7 * H);       // a faint violet afterglow above the ranges
    gl.addColorStop(0, 'rgba(180, 151, 230, 0)'); gl.addColorStop(1, 'rgba(180, 151, 230, 0.16)');
    c.fillStyle = gl; c.fillRect(0, 0, W, H);
  }
  function paintBase() {
    if (!W) return;
    var c = bctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    sky(c);
    c.lineJoin = 'round'; c.lineCap = 'round';
    trace(c, BACK, true); c.fillStyle = col.bg; c.fill();
    c.strokeStyle = col.muted; c.globalAlpha = 0.35; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1;
    trace(c, FRONT, true); c.fillStyle = col.surface; c.fill();
    c.strokeStyle = col.muted; c.lineWidth = 1.3; c.stroke();
    // rock: short strokes under the ridge on the climbing side
    var r = seeded(11);
    c.beginPath();
    for (var i = 0; i < 26; i++) {
      var x = 0.36 + r() * (SUMMIT[0] - 0.37), y = ridge(x) + (0.05 + r() * 0.2), L = (0.006 + r() * 0.012);
      c.moveTo(x * W, y * H); c.lineTo((x + L) * W, (y - L * 1.6 * W / H * 0.25) * H);
    }
    c.strokeStyle = col.muted; c.globalAlpha = 0.3; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1;
    // the summit cross
    var sx = SUMMIT[0] * W + 1 * u, sy = ridge(SUMMIT[0] + 1 * u / W) * H;
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy - 11 * u); c.moveTo(sx - 3 * u, sy - 8 * u); c.lineTo(sx + 3 * u, sy - 8 * u);
    c.strokeStyle = col.fg; c.lineWidth = 1.2 * u; c.stroke();
  }
  function resize() {
    W = band.clientWidth;
    if (!W) return;
    H = W < 600 ? 150 : 205;
    u = H / 205;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.style.height = H + 'px';
    [cv, base].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    route();
    paintBase();
    draw();
  }

  /* ---------- The climb: along the ridge from the saddle to the summit ---------- */
  var path = [], len = [];
  function route() {
    path = []; len = [0];
    var x0 = START * W, x1 = SUMMIT[0] * W - 9 * u;
    for (var x = x0; x <= x1; x += 1) path.push([x, ridge(x / W) * H]);
    for (var i = 1; i < path.length; i++) len.push(len[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  }
  function along(d) {                                 // point and steepness at distance d along the climb
    var i = 0, n = len.length - 1;
    while (i < n - 1 && len[i + 1] < d) i++;
    var a = path[i], b = path[Math.min(n, i + 1)];
    return { x: a[0], y: a[1], steep: Math.abs(b[1] - a[1]) / Math.max(1e-6, b[0] - a[0]) };
  }

  /* ---------- Ski runs: turns down the face, kept as tracks ---------- */
  var tracks = [];
  function newRun() {
    var pts = [], xs = SUMMIT[0] + 2 / Math.max(W, 1), ys = SUMMIT[1] + 0.03;
    var drift = 0.03 + Math.random() * 0.17;           // always down the snow face, right of the rock
    var turns = 3 + Math.floor(Math.random() * 3), ph = Math.random() < 0.5 ? 0 : Math.PI, amp = 34 * u / Math.max(W, 1);
    for (var i = 0; i <= 400; i++) {
      var s = i / 400, y = ys + (1.08 - ys) * s;
      var x = xs + drift * s + amp * (0.12 + s) * Math.sin(2 * Math.PI * turns * s + ph);
      y = Math.max(y, ridge(x) + 0.04);
      pts.push([x, y]);
    }
    return { pts: pts, n: 1, done: 0 };
  }
  function drawTracks(now) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    tracks.forEach(function (t) {
      var age = t.done ? (now - t.done) / 1000 : 0, a = Math.max(0, 1 - age / 120);
      if (!a || t.n < 2) return;
      ctx.beginPath();
      ctx.moveTo(t.pts[0][0] * W, t.pts[0][1] * H);
      for (var i = 1; i < t.n; i++) ctx.lineTo(t.pts[i][0] * W, t.pts[i][1] * H);
      ctx.strokeStyle = col.muted;
      ctx.globalAlpha = 0.16 * a; ctx.lineWidth = 3 * u; ctx.stroke();
      ctx.globalAlpha = 0.55 * a; ctx.lineWidth = 0.9 * u; ctx.stroke();
    });
    ctx.globalAlpha = 1;
    tracks = tracks.filter(function (t) { return !t.done || now - t.done < 120000; });
  }

  /* ---------- The figure, seen from the side ---------- */
  function seg(a, b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
  function on(x, y) { return [x, Math.min(y, ridge(x / W) * H)]; }   // a point pushed onto the rock if it is inside
  function ground(x) { return [x, ridge(x / W) * H]; }
  function bend(a, b, out) {                         // the knee or elbow between a and b, pushed sideways by out
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [mx - dy / l * out, my + dx / l * out];
  }
  // body: hip, neck, two legs [foot, knee bend], two arms [hand, elbow bend], facing f (+1 right, -1 left)
  function figure(hip, neck, legs, arms, f, extra) {
    var hx = neck[0] - hip[0], hy = neck[1] - hip[1], hl = Math.hypot(hx, hy);
    var head = [neck[0] + hx / hl * 2.6 * u + f * 0.5 * u, neck[1] + hy / hl * 2.6 * u];
    // backpack on the back
    var bx = -hy / hl * f, by = hx / hl * f;            // unit vector pointing to the back
    var p1 = [hip[0] + hx * 0.25 - bx * 0.2 * u, hip[1] + hy * 0.25 - by * 0.2 * u], p2 = [hip[0] + hx * 0.9, hip[1] + hy * 0.9];
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p2[0] - bx * 2.4 * u, p2[1] - by * 2.4 * u); ctx.lineTo(p1[0] - bx * 2.4 * u, p1[1] - by * 2.4 * u); ctx.closePath();
    ctx.fillStyle = col.lake; ctx.fill();
    ctx.beginPath(); ctx.strokeStyle = col.fg; ctx.lineWidth = 1.35 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (extra) extra();
    legs.forEach(function (l) { var k = l[1].length ? l[1] : bend(hip, l[0], l[1] * f); seg(hip, k); seg(k, l[0]); });
    seg(hip, neck);
    var sh = [hip[0] + hx * 0.88, hip[1] + hy * 0.88];
    arms.forEach(function (a) { var e = bend(sh, a[0], a[1] * f); seg(sh, e); seg(e, a[0]); });
    ctx.stroke();
    ctx.beginPath(); ctx.arc(head[0], head[1], 2.2 * u, 0, 2 * Math.PI);
    ctx.fillStyle = col.sun; ctx.fill(); ctx.lineWidth = 1 * u; ctx.stroke();
  }
  // hiking up the ridge, to the right
  function hiker(x, phase, slope) {
    var s = Math.sin(phase), c = Math.cos(phase), lean = 0.14 + Math.min(0.3, slope * 0.2);
    var f1 = ground(x + 2.6 * u * s), f2 = ground(x - 2.6 * u * s), y = Math.max(f1[1], f2[1]);
    var hip = [x, y - 7 * u - 0.5 * u * Math.abs(c)], neck = [hip[0] + Math.sin(lean) * 6 * u, hip[1] - Math.cos(lean) * 6 * u];
    figure(hip, neck, [[f1, -1.1 * u], [f2, -1.1 * u]],
      [[[neck[0] - 3.2 * u * s + 0.4 * u, neck[1] + 4.6 * u], 0.9 * u], [[neck[0] + 3.2 * u * s + 0.4 * u, neck[1] + 4.6 * u], 0.9 * u]], 1);
  }
  // climbing the summit block: feet on the rock, hands reaching up to it
  function climber(x, phase) {
    var s = Math.sin(phase), lean = 0.42;
    var f1 = ground(x - 0.6 * u), f2 = ground(x + (1.6 + 1.0 * s) * u);
    var hip = [x - 1.4 * u, f1[1] - 5.6 * u], neck = [hip[0] + Math.sin(lean) * 6 * u, hip[1] - Math.cos(lean) * 6 * u];
    var h1 = on(neck[0] + (4.2 + 0.8 * s) * u, neck[1] - (3 + 2.2 * s) * u), h2 = on(neck[0] + (4.4 - 0.8 * s) * u, neck[1] - (3 - 2.2 * s) * u);
    figure(hip, neck, [[f1, 2 * u], [f2, 2.2 * u]], [[h1, 1.4 * u], [h2, 1.4 * u]], 1);
  }
  // at the summit: arms up
  function cheer(x, t) {
    var y = ground(x)[1] - Math.abs(Math.sin(t * 7)) * (t < 1.2 ? 2.2 * u : 0);
    var hip = [x, y - 7 * u], neck = [x + 0.4 * u, hip[1] - 6 * u];
    figure(hip, neck, [[[x - 1.4 * u, ground(x - 1.4 * u)[1]], 0.3 * u], [[x + 1.4 * u, ground(x + 1.4 * u)[1]], 0.3 * u]],
      [[[neck[0] - 3 * u, neck[1] - 4.6 * u], 0.4 * u], [[neck[0] + 3.4 * u, neck[1] - 4.4 * u], -0.4 * u]], 1);
  }
  // skiing, in profile towards where it is going, leaning into the turn
  function skier(x, y, vx, vy, lean) {
    var f = vx < 0 ? -1 : 1, v = Math.hypot(vx, vy) || 1, dx = vx / v, dy = vy / v;
    var tx = f * Math.max(0.55, Math.abs(dx)), ty = dy * 0.45, tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
    var ca = Math.cos(lean), sa = Math.sin(lean);
    function P(px, py) { return [x + px * ca - py * sa, y + px * sa + py * ca]; }   // body coordinates, rotated by the lean
    var hip = P(-1.2 * u * f, -6.2 * u), neck = P(1.8 * u * f, -11 * u);
    var legs = [[P(0.4 * u * f, -0.6 * u), P(2.4 * u * f, -3.6 * u)], [P(-0.8 * u * f, -0.5 * u), P(1.4 * u * f, -3.3 * u)]];
    var hand1 = P(4.8 * u * f, -7.4 * u), hand2 = P(3.8 * u * f, -6.8 * u);
    figure(hip, neck, legs, [[hand1, 0.5 * u], [hand2, 0.5 * u]], f, function () {
      // skis along the way it goes, with the tips turned up, and the poles trailing behind
      var a = [x - tx * 6 * u, y - ty * 6 * u], b = [x + tx * 6.5 * u, y + ty * 6.5 * u];
      seg(a, b); seg(b, [b[0] + tx * 1.4 * u, b[1] + ty * 1.4 * u - 1.1 * u]);
      seg(hand1, [hand1[0] - f * 7.5 * u, hand1[1] + 5.6 * u]); seg(hand2, [hand2[0] - f * 7 * u, hand2[1] + 6 * u]);
    });
  }
  var spray = [];
  function puff(x, y, dir) {
    for (var i = 0; i < 12; i++) {
      spray.push({ x: x, y: y, vx: (dir * (20 + Math.random() * 40) + (Math.random() - 0.5) * 20) * u, vy: -(15 + Math.random() * 30) * u, t: 0 });
    }
  }
  function drawSpray(dt) {
    ctx.fillStyle = col.muted;
    for (var i = spray.length - 1; i >= 0; i--) {
      var p = spray[i];
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 70 * u * dt; p.vx *= 1 - 2 * dt;
      if (p.t > 0.9) { spray.splice(i, 1); continue; }
      ctx.globalAlpha = 0.5 * (1 - p.t / 0.9);
      ctx.beginPath(); ctx.arc(p.x, p.y, 0.9 * u, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- One round: climb, cheer, ski, rest ---------- */
  var state = 'climb', d = 0, timer = 0, run = null, last = 0, running = false, phase = 0, prevDx = 0;
  function step(now, dt) {
    if (state === 'climb') {
      var p = along(d), speed = 34 * u / (1 + 1.6 * p.steep);
      d += speed * dt; phase += dt * (p.steep > 1.1 ? 3.2 : 6);
      if (d >= len[len.length - 1]) { state = 'top'; timer = 0; }
    } else if (state === 'top') {
      timer += dt;
      if (timer > 2.4) { state = 'ski'; timer = 0; prevDx = 0; run = newRun(); tracks.push(run); }
    } else if (state === 'ski') {
      timer += dt;
      var T = 9, f = Math.min(1, Math.pow(timer / T, 1.2)), n = Math.max(2, Math.round(f * (run.pts.length - 1)));
      run.n = n;
      if (f >= 1) { run.done = now; state = 'rest'; timer = 0; }
    } else {
      timer += dt;
      if (timer > 1.6) { state = 'climb'; d = 0; }
    }
  }
  function draw(now, dt) {
    if (!W) return;
    now = now || performance.now(); dt = dt || 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawTracks(now);
    if (state === 'climb') {
      var p = along(d);
      ctx.globalAlpha = Math.min(1, d / (12 * u));
      if (p.steep > 1.1) climber(p.x, phase); else hiker(p.x, phase, p.steep);
      ctx.globalAlpha = 1;
    } else if (state === 'top') {
      cheer(along(len[len.length - 1]).x, timer);
    } else if (state === 'ski') {
      var i = run.n - 1, a = run.pts[Math.max(0, i - 3)], b = run.pts[i];
      var vx = (b[0] - a[0]) * W, vy = (b[1] - a[1]) * H, k = Math.max(0, i - 12), c = run.pts[k];
      var turn = ((b[0] - c[0]) * W - vx) / (3 * u);
      if (prevDx && vx && (vx > 0) !== (prevDx > 0)) puff(b[0] * W, b[1] * H, vx > 0 ? -1 : 1);
      prevDx = vx;
      skier(b[0] * W, b[1] * H, vx, vy, Math.max(-0.35, Math.min(0.35, turn * 0.03)));
    }
    drawSpray(dt);
  }
  function frame(now) {
    if (document.hidden || reduce.matches) { running = false; return; }
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    step(now, dt);
    draw(now, dt);
    requestAnimationFrame(frame);
  }
  function kick() { if (!running && !document.hidden && !reduce.matches) { running = true; last = 0; requestAnimationFrame(frame); } }

  // two older runs are already on the face, and the figure is on its way up
  function setup() {
    var now = performance.now();
    tracks = [];
    [70, 35].forEach(function (age) { var t = newRun(); t.n = t.pts.length; t.done = now - age * 1000; tracks.push(t); });
    state = 'climb'; d = 0.25 * len[len.length - 1];
  }
  function still() { setup(); state = 'top'; timer = 2; draw(); }

  readColors();
  resize();
  setup();
  if (reduce.matches) still();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('themechange', function () { readColors(); paintBase(); draw(); });
  reduce.addEventListener('change', function () { if (reduce.matches) still(); else kick(); });
  kick();
})();
