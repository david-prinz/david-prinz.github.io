/* Seminar: knots and their Jones polynomials.
   Chern–Simons theory computes the Jones polynomial of a knot as the expectation value of a Wilson
   loop (Witten 1989), and it does not care how the knot lies in space: it is a topological invariant.
   The figure shows one knot of the knot table at a time, scrolling down the page steps through them.
   The knot is a chain of beads with springs and a hard core, so it can be pulled and turned with the
   pointer but its strands can never pass through each other. The Jones polynomial underneath is
   computed live from the crossings of the picture you see, by Kauffman's state sum
   <K> = Σ_s A^(a(s) − b(s)) d^(|s| − 1), d = −A² − A⁻², and V(t) = (−A³)^(−w) <K> at t = A⁻⁴:
   the crossings come and go, the polynomial stays. Respects "reduce motion" (then the knot only
   moves while you drag it) and pauses while the tab is hidden. */
(function () {
  var page = document.querySelector('.knots-page');
  if (!page) return;
  var aside = page.querySelector('.knots'), cv = aside && aside.querySelector('canvas');
  if (!cv || !cv.getContext) return;
  var nameEl = aside.querySelector('.knot-name'), polyEl = aside.querySelector('.knot-poly'), crossEl = aside.querySelector('.knot-cross');
  var ctx = cv.getContext('2d'), root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  aside.hidden = false;

  var PI = Math.PI, TAU = 2 * PI;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  /* ---------- The knot table ---------- */
  function torus(p, q) {                              // mirrored, so that the polynomials have positive powers
    return function (t) { var r = 2 + Math.cos(q * t); return [r * Math.cos(p * t), r * Math.sin(p * t), -Math.sin(q * t)]; };
  }
  function fourier(co) {                              // relaxed into a round shape, then written as Fourier series
    return function (t) {
      return co.map(function (ab) {
        var v = 0;
        for (var k = 0; k < ab[0].length; k++) v += ab[0][k] * Math.cos(k * t) + (k ? ab[1][k - 1] * Math.sin(k * t) : 0);
        return v;
      });
    };
  }
  var KNOTS = [
    { name: 'Unknot', id: '0<sub>1</sub>', c: 0, f: function (t) { return [Math.cos(t), Math.sin(t), 0.35 * Math.sin(2 * t)]; } },
    { name: 'Trefoil', id: '3<sub>1</sub>', c: 3, f: function (t) { return [Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t), Math.sin(3 * t)]; } },
    { name: 'Figure-eight knot', id: '4<sub>1</sub>', c: 4, f: function (t) { var r = 2 + Math.cos(2 * t); return [r * Math.cos(3 * t), r * Math.sin(3 * t), Math.sin(4 * t)]; } },
    { name: 'Cinquefoil', id: '5<sub>1</sub>', c: 5, f: torus(2, 5) },
    { name: 'Three-twist knot', id: '5<sub>2</sub>', c: 5, f: fourier([
      [[0, 0, 9.583, 0, -0.038, 0, 1.273, 0, -0.326, 0, 0.614], [0, -0.53, 0, 1.257, 0, 0.146, 0, -0.052, 0, 0.532]],
      [[0, -0.939, 0, 6.533, 0, 0.529, 0, 0.138, 0, -0.379, 0], [-1.385, 0, -6.439, 0, 0.472, 0, 0.053, 0, -0.854, 0]],
      [[0, 2.195, 0, 2.632, 0, 0.741, 0, -5.096, 0, 0.27, 0], [2.83, 0, 1.606, 0, 0.045, 0, -0.885, 0, 0.506, 0]]]) },
    { name: 'Stevedore knot', id: '6<sub>1</sub>', c: 6, f: fourier([
      [[0, 0, 8.428, 0, 1.162, 0, 0.604, 0, -0.615, 0, -0.31], [0, -2.928, 0, 1.28, 0, -1.248, 0, -0.117, 0, -0.337]],
      [[0, 0.178, 0, 1.348, 0, 0.141, 0, -0.694, 0, -0.417, 0], [-1.242, 0, -8.288, 0, 0.375, 0, -0.086, 0, 0.303, 0]],
      [[0, -1.328, 0, 1.533, 0, -5.572, 0, -0.749, 0, 0.172, 0], [4.088, 0, -0.434, 0, -0.281, 0, -0.343, 0, 0.154, 0]]]) },
    { name: 'Septafoil', id: '7<sub>1</sub>', c: 7, f: torus(2, 7) },
    { name: 'Torus knot T(3,4)', id: '8<sub>19</sub>', c: 8, f: torus(3, 4) }
  ];
  var ELL = 0.04, DMIN = 0.09, SKIP = 3, MAXSTEP = 0.3 * ELL;   // bead spacing, hard core, in units of the knot's radius
  function build(k) {                                 // beads at equal arc length, scaled to radius 1
    var f = k.f, M = 3000, P = [], cum = [0], m = 0, i;
    for (i = 0; i <= M; i++) { var p = f(i / M * TAU); P.push(p); m = Math.max(m, Math.hypot(p[0], p[1])); }
    for (i = 1; i <= M; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]) / m);
    var L = cum[M], N = Math.round(L / ELL), home = new Float64Array(3 * N), j = 0;
    for (i = 0; i < N; i++) {
      var s = i / N * L;
      while (cum[j + 1] < s) j++;
      var u = (s - cum[j]) / (cum[j + 1] - cum[j]);
      for (var d = 0; d < 3; d++) home[3 * i + d] = (P[j][d] + u * (P[j + 1][d] - P[j][d])) / m;
    }
    var rest = new Float64Array(N);
    for (i = 0; i < N; i++) { var a = 3 * i, b = 3 * ((i + 1) % N); rest[i] = Math.hypot(home[b] - home[a], home[b + 1] - home[a + 1], home[b + 2] - home[a + 2]); }
    k.N = N; k.home = home; k.rest = rest;
  }

  /* ---------- Beads: springs, a smooth deformation, and a hard core ---------- */
  var knot = null, N = 0, pos = null, dev = null, cur = -1, settled = true;
  function use(i) {
    var k = KNOTS[i];
    if (!k.home) build(k);
    knot = k; N = k.N; pos = new Float64Array(k.home); dev = new Float64Array(3 * N); cur = i; settled = true;
    sig = null; crossN = 0; poly = '';
  }
  var grid = new Map();
  function cellKey(x, y, z) { return (Math.floor(x / DMIN) + 512) * 1048576 + (Math.floor(y / DMIN) + 512) * 1024 + (Math.floor(z / DMIN) + 512); }
  function hardCore() {                               // non-neighbouring beads stay DMIN apart, so no strand passes another
    grid.clear();
    var i, a, closest = Infinity;
    for (i = 0; i < N; i++) {
      a = 3 * i;
      var key = cellKey(pos[a], pos[a + 1], pos[a + 2]), list = grid.get(key);
      if (list) list.push(i); else grid.set(key, [i]);
    }
    for (i = 0; i < N; i++) {
      a = 3 * i;
      var cx = Math.floor(pos[a] / DMIN), cy = Math.floor(pos[a + 1] / DMIN), cz = Math.floor(pos[a + 2] / DMIN);
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) for (var dz = -1; dz <= 1; dz++) {
        var lst = grid.get((cx + dx + 512) * 1048576 + (cy + dy + 512) * 1024 + (cz + dz + 512));
        if (!lst) continue;
        for (var n = 0; n < lst.length; n++) {
          var j = lst[n];
          if (j <= i) continue;
          var gap = j - i; if (gap > N / 2) gap = N - gap;
          if (gap <= SKIP) continue;
          var b = 3 * j, ex = pos[b] - pos[a], ey = pos[b + 1] - pos[a + 1], ez = pos[b + 2] - pos[a + 2], d2 = ex * ex + ey * ey + ez * ez;
          if (d2 >= DMIN * DMIN) continue;
          var d = Math.sqrt(d2) || 1e-6, push = (DMIN - d) / (2 * d) + 1e-4;
          if (d < closest) closest = d;
          pos[a] -= ex * push; pos[a + 1] -= ey * push; pos[a + 2] -= ez * push;
          pos[b] += ex * push; pos[b + 1] += ey * push; pos[b + 2] += ez * push;
        }
      }
    }
    return closest;
  }
  function springs() {
    for (var i = 0; i < N; i++) {
      var a = 3 * i, b = 3 * ((i + 1) % N), ex = pos[b] - pos[a], ey = pos[b + 1] - pos[a + 1], ez = pos[b + 2] - pos[a + 2];
      var d = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1e-6, f = 0.25 * (d - knot.rest[i]) / d;
      pos[a] += ex * f; pos[a + 1] += ey * f; pos[a + 2] += ez * f;
      pos[b] -= ex * f; pos[b + 1] -= ey * f; pos[b + 2] -= ez * f;
    }
  }
  var prev = null;
  function step() {
    var i, a, d, home = knot.home, moved = 0;
    if (!prev || prev.length !== pos.length) prev = new Float64Array(pos.length);
    prev.set(pos);
    if (grab >= 0) {                                  // the grabbed bead and its neighbours follow the pointer
      var g = 3 * grab, ex = target[0] - pos[g], ey = target[1] - pos[g + 1], ez = target[2] - pos[g + 2];
      var len = Math.sqrt(ex * ex + ey * ey + ez * ez), sc = len > MAXSTEP ? MAXSTEP / len : 1;
      for (var k = -9; k <= 9; k++) {
        var w = Math.exp(-k * k / 18) * sc;
        a = 3 * ((grab + k + N) % N);
        pos[a] += ex * w; pos[a + 1] += ey * w; pos[a + 2] += ez * w;
      }
    } else {                                          // let go: slowly back to the knot's own shape
      for (i = 0; i < 3 * N; i++) {
        d = home[i] - pos[i];
        var mv = clamp(0.03 * d, -0.25 * MAXSTEP, 0.25 * MAXSTEP);
        pos[i] += mv; moved = Math.max(moved, Math.abs(d));
      }
    }
    for (i = 0; i < 3 * N; i++) dev[i] = pos[i] - home[i];      // smooth the deformation, not the knot
    for (i = 0; i < N; i++) {
      a = 3 * i; var p = 3 * ((i - 1 + N) % N), n = 3 * ((i + 1) % N);
      for (d = 0; d < 3; d++) pos[a + d] += 0.12 * (dev[p + d] + dev[n + d] - 2 * dev[a + d]);
    }
    springs(); hardCore(); springs(); hardCore(); springs();
    // safety: a step that brings two strands too close, stretches a link or jumps too far is taken back,
    // so that no strand can slip through another between two beads
    var ok = hardCore() >= 0.8 * DMIN;
    for (i = 0; ok && i < N; i++) {
      a = 3 * i; var b = 3 * ((i + 1) % N);
      if (Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]) > 1.5 * knot.rest[i]) ok = false;
      if (Math.hypot(pos[a] - prev[a], pos[a + 1] - prev[a + 1], pos[a + 2] - prev[a + 2]) > 0.5 * ELL) ok = false;
    }
    if (!ok) pos.set(prev);
    return moved;
  }

  /* ---------- The view ---------- */
  var W = 0, dpr = 1, S = 1, th0 = 0, ph0 = 0, th = 0, ph = 0, R = [1, 0, 0, 0, 1, 0, 0, 0, 1], view = null;
  function setView() {
    var c = Math.cos(th), s = Math.sin(th), cp = Math.cos(ph), sp = Math.sin(ph);
    // x' = x c + z s;  z1 = -x s + z c;  y' = y cp - z1 sp;  z' = y sp + z1 cp
    R = [c, 0, s, s * sp, cp, -c * sp, -s * cp, sp, c * cp];
  }
  function project() {
    if (!view || view.length !== 3 * N) view = new Float64Array(3 * N);
    for (var i = 0; i < N; i++) {
      var a = 3 * i, x = pos[a], y = pos[a + 1], z = pos[a + 2];
      view[a] = R[0] * x + R[1] * y + R[2] * z; view[a + 1] = R[3] * x + R[4] * y + R[5] * z; view[a + 2] = R[6] * x + R[7] * y + R[8] * z;
    }
  }

  /* ---------- Crossings of the picture and the Jones polynomial ---------- */
  var sig = '', crossN = 0, poly = '', cache = {};
  function crossings() {
    var cells = new Map(), cs = 0.08, i, j, out = [];
    for (i = 0; i < N; i++) {
      var a = 3 * i, b = 3 * ((i + 1) % N);
      var x0 = Math.floor(Math.min(view[a], view[b]) / cs), x1 = Math.floor(Math.max(view[a], view[b]) / cs);
      var y0 = Math.floor(Math.min(view[a + 1], view[b + 1]) / cs), y1 = Math.floor(Math.max(view[a + 1], view[b + 1]) / cs);
      for (var gx = x0; gx <= x1; gx++) for (var gy = y0; gy <= y1; gy++) {
        var key = (gx + 1000) * 4000 + gy + 1000, l = cells.get(key);
        if (l) l.push(i); else cells.set(key, [i]);
      }
    }
    var seen = new Set();
    cells.forEach(function (l) {
      for (var m = 0; m < l.length; m++) for (var n = m + 1; n < l.length; n++) {
        i = Math.min(l[m], l[n]); j = Math.max(l[m], l[n]);
        if (j - i < 2 || (i === 0 && j === N - 1)) continue;
        var id = i * N + j;
        if (seen.has(id)) continue;
        seen.add(id);
        var A = 3 * i, B = 3 * ((i + 1) % N), C = 3 * j, D = 3 * ((j + 1) % N);
        var rx = view[B] - view[A], ry = view[B + 1] - view[A + 1], sx = view[D] - view[C], sy = view[D + 1] - view[C + 1];
        var den = rx * sy - ry * sx;
        if (Math.abs(den) < 1e-14) continue;
        var qx = view[C] - view[A], qy = view[C + 1] - view[A + 1], t = (qx * sy - qy * sx) / den, u = (qx * ry - qy * rx) / den;
        if (t < 0 || t >= 1 || u < 0 || u >= 1) continue;
        var za = view[A + 2] + t * (view[B + 2] - view[A + 2]), zc = view[C + 2] + u * (view[D + 2] - view[C + 2]), iOver = za > zc;
        var ox = iOver ? rx : sx, oy = iOver ? ry : sy, ux = iOver ? sx : rx, uy = iOver ? sy : ry;
        out.push({ over: iOver ? i + t : j + u, under: iOver ? j + u : i + t, sign: ox * uy - oy * ux > 0 ? 1 : -1,
          x: view[A] + t * rx, y: view[A + 1] + t * ry });
      }
    });
    return out;
  }
  function addTo(P, e, c) { P[e] = (P[e] || 0) + c; }
  function jones(cr) {
    // Gauss code: events along the knot; edge k runs from event k to event k + 1
    var n = cr.length, ev = [], k, E = 2 * n;
    if (!n) return { 0: 1 };
    cr.forEach(function (c, i) { ev.push([c.over, i, 1]); ev.push([c.under, i, 0]); });
    ev.sort(function (a, b) { return a[0] - b[0]; });
    var o = [], u = [];
    ev.forEach(function (e, idx) { if (e[2]) o[e[1]] = idx; else u[e[1]] = idx; });
    // the A-smoothing joins the regions swept by turning the over-strand anticlockwise
    var A1 = new Int32Array(n), A2 = new Int32Array(n), B1 = new Int32Array(n), B2 = new Int32Array(n);
    var C1 = new Int32Array(n), C2 = new Int32Array(n), D1 = new Int32Array(n), D2 = new Int32Array(n);
    for (k = 0; k < n; k++) {
      var oi = (o[k] - 1 + E) % E, oo = o[k], ui = (u[k] - 1 + E) % E, uo = u[k];   // an edge stands for both of its ends
      if (cr[k].sign > 0) { A1[k] = uo; A2[k] = oi; B1[k] = ui; B2[k] = oo; C1[k] = oo; C2[k] = uo; D1[k] = oi; D2[k] = ui; }
      else { A1[k] = ui; A2[k] = oi; B1[k] = uo; B2[k] = oo; C1[k] = oo; C2[k] = ui; D1[k] = oi; D2[k] = uo; }
    }
    var par = new Int32Array(E), cnt = {};
    function find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }
    for (var s = 0; s < (1 << n); s++) {
      for (k = 0; k < E; k++) par[k] = k;
      var comps = E, a = 0, p, q;
      for (k = 0; k < n; k++) {
        if ((s >> k) & 1) { a++; p = find(A1[k]); q = find(A2[k]); if (p !== q) { par[p] = q; comps--; } p = find(B1[k]); q = find(B2[k]); if (p !== q) { par[p] = q; comps--; } }
        else { p = find(C1[k]); q = find(C2[k]); if (p !== q) { par[p] = q; comps--; } p = find(D1[k]); q = find(D2[k]); if (p !== q) { par[p] = q; comps--; } }
      }
      var key = (2 * a - n) + ',' + comps;
      cnt[key] = (cnt[key] || 0) + 1;
    }
    var br = {}, w = 0, V = {};
    for (var key2 in cnt) {
      var parts = key2.split(','), P = {};
      P[+parts[0]] = cnt[key2];
      for (var l = 1; l < +parts[1]; l++) { var nx = {}; for (var e in P) { addTo(nx, +e + 2, -P[e]); addTo(nx, +e - 2, -P[e]); } P = nx; }
      for (var e2 in P) addTo(br, +e2, P[e2]);
    }
    cr.forEach(function (c) { w += c.sign; });
    for (var e3 in br) if (br[e3]) addTo(V, -(+e3 - 3 * w) / 4, br[e3] * (w % 2 ? -1 : 1));
    return V;
  }
  function signature(cr) {
    var ev = [];
    cr.forEach(function (c, i) { ev.push([c.over, i, 'o' + (c.sign > 0 ? '+' : '-')]); ev.push([c.under, i, 'u']); });
    ev.sort(function (a, b) { return a[0] - b[0]; });
    var label = {}, next = 0;
    return ev.map(function (e) { if (!(e[1] in label)) label[e[1]] = next++; return e[2] + label[e[1]]; }).join(' ');
  }
  function fmtPoly(V) {
    var es = Object.keys(V).map(Number).filter(function (e) { return V[e]; }).sort(function (a, b) { return a - b; });
    if (!es.length) return '0';
    return es.map(function (e, i) {
      var c = V[e], ac = Math.abs(c), mono = e === 0 ? '' : 't' + (e === 1 ? '' : '<sup>' + String(e).replace('-', '−') + '</sup>');
      var body = (ac === 1 && e !== 0 ? '' : ac) + mono;
      return (i ? (c < 0 ? ' − ' : ' + ') : (c < 0 ? '−' : '')) + body;
    }).join('');
  }
  var lastCr = [];
  function analyse() {
    var cr = crossings(), s = signature(cr);
    lastCr = cr;
    if (s === sig) return;
    sig = s; crossN = cr.length;
    if (!(s in cache)) cache[s] = cr.length <= 16 ? fmtPoly(jones(cr)) : null;
    if (cache[s] !== null) poly = cache[s];
    readout();
  }
  var shown = '';
  function readout() {
    if (!nameEl) return;
    var html = [knot.name + ' ' + knot.id, 'V(t) = ' + poly, crossN + (crossN === 1 ? ' crossing' : ' crossings') + ' in this picture (at least ' + knot.c + ')'];
    var key = html.join('|');
    if (key === shown) return;
    shown = key;
    nameEl.innerHTML = html[0]; polyEl.innerHTML = html[1]; crossEl.textContent = html[2];
  }

  /* ---------- Drawing ---------- */
  var col = {};
  function hex(s) { s = s.replace('#', ''); if (s.length === 3) s = s.replace(/./g, '$&$&'); var n = parseInt(s, 16); return isNaN(n) ? [128, 128, 128] : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function readColors() {
    var cs = getComputedStyle(root);
    ['bg', 'fg', 'lake', 'event'].forEach(function (n) { col[n] = hex(cs.getPropertyValue('--' + n).trim()); });
    col.dark = col.bg[0] * 0.3 + col.bg[1] * 0.59 + col.bg[2] * 0.11 < 100;
    col.near = col.lake; col.far = mix(col.lake, col.bg, 0.55);
    col.halo = rgb(col.bg);
  }
  function resize() {
    var w = cv.clientWidth, d = Math.min(window.devicePixelRatio || 1, 2);
    if (!w) return false;
    if (w === W && d === dpr && cv.width) return true;
    W = w; dpr = d; S = 0.4 * W;
    cv.width = Math.round(W * dpr); cv.height = Math.round(W * dpr);
    return true;
  }
  var order = [];
  function draw() {
    if (!W && !resize()) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, W);
    if (!knot) return;
    var cx = W / 2, cy = W / 2, tube = Math.max(2, 0.065 * S), i;
    if (order.length !== N) { order = []; for (i = 0; i < N; i++) order.push(i); }
    order.sort(function (a, b) { return view[3 * a + 2] + view[3 * ((a + 1) % N) + 2] - view[3 * b + 2] - view[3 * ((b + 1) % N) + 2]; });
    ctx.globalAlpha = fade;
    for (var m = 0; m < N; m++) {                     // far segments first; each one with a gap around it, so crossings read
      i = order[m];
      var a = 3 * i, b = 3 * ((i + 1) % N), x0 = cx + S * view[a], y0 = cy - S * view[a + 1], x1 = cx + S * view[b], y1 = cy - S * view[b + 1];
      var depth = clamp(0.5 + 0.5 * (view[a + 2] + view[b + 2]) / 2, 0, 1);
      ctx.lineCap = 'butt'; ctx.strokeStyle = col.halo; ctx.lineWidth = tube + Math.max(2, 0.03 * S);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.lineCap = 'round'; ctx.strokeStyle = rgb(mix(col.far, col.near, depth)); ctx.lineWidth = tube;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    if (grab >= 0) {                                  // the bead in hand
      var g = 3 * grab;
      ctx.fillStyle = rgb(col.event); ctx.beginPath(); ctx.arc(cx + S * view[g], cy - S * view[g + 1], tube * 0.75, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Pointer: drag a strand, or turn the knot ---------- */
  var grab = -1, target = [0, 0, 0], turning = null, pid = null;
  function local(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left - W / 2) / S, -(e.clientY - r.top - W / 2) / S]; }
  function nearest(p) {                               // the front-most bead under the pointer
    var best = -1, top = -Infinity, r2 = Math.pow((W < 150 ? 10 : 14) / S, 2);
    for (var i = 0; i < N; i++) {
      var a = 3 * i, dx = view[a] - p[0], dy = view[a + 1] - p[1], d = dx * dx + dy * dy;
      if (d < r2 && view[a + 2] - Math.sqrt(d) > top) { top = view[a + 2] - Math.sqrt(d); best = i; }
    }
    return best;
  }
  function toModel(p, depth) {                        // a point of the picture at a given depth, back in the knot's frame
    return [R[0] * p[0] + R[3] * p[1] + R[6] * depth, R[1] * p[0] + R[4] * p[1] + R[7] * depth, R[2] * p[0] + R[5] * p[1] + R[8] * depth];
  }
  cv.addEventListener('pointerdown', function (e) {
    if (!knot || pid !== null) return;
    var p = local(e), i = nearest(p);
    pid = e.pointerId;
    try { cv.setPointerCapture(pid); } catch (err) {}
    if (i >= 0) { grab = i; target = toModel(p, view[3 * i + 2]); settled = false; cv.classList.add('is-dragging'); }
    else turning = { p: p, th: th0, ph: ph0 };
    kick();
  });
  cv.addEventListener('pointermove', function (e) {
    if (e.pointerId !== pid) return;
    var p = local(e);
    if (grab >= 0) target = toModel(p, view[3 * grab + 2]);
    else if (turning) { th0 = turning.th + 1.6 * (p[0] - turning.p[0]); ph0 = clamp(turning.ph - 1.6 * (p[1] - turning.p[1]), -1.2, 1.2); }
    kick();
  });
  function release(e) {
    if (e.pointerId !== pid) return;
    pid = null; grab = -1; turning = null; cv.classList.remove('is-dragging');
    kick();
  }
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', release);

  /* ---------- Scroll, frame ---------- */
  var want = 0, fade = 1, time = 0, last = 0, running = false;
  function fromScroll() {
    var span = document.documentElement.scrollHeight - window.innerHeight;
    var f = span > 40 ? clamp(window.scrollY / span, 0, 1) : 0;
    want = Math.min(KNOTS.length - 1, Math.floor(f * KNOTS.length));
    if (want !== cur && (reduce.matches || !knot)) { use(want); fade = 1; frameOnce(); }
    else kick();
  }
  function frameOnce() {
    th = th0; ph = ph0; setView(); project(); analyse(); draw();
  }
  function frame(now) {
    if (document.hidden) { running = false; return; }
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    var still = reduce.matches;
    if (!still) time += dt;
    if (want !== cur) {                               // the next knot of the table: fade out, swap, fade in
      fade -= dt / 0.25;
      if (fade <= 0) { fade = 0; grab = -1; use(want); }
    } else if (fade < 1) fade = Math.min(1, fade + dt / 0.35);
    if (knot && (!settled || grab >= 0)) {
      var moved = 0;
      for (var k = 0; k < 4; k++) moved = Math.max(moved, step());
      if (grab < 0 && moved < 1e-3) settled = true;
    }
    th = th0 + (still ? 0 : 0.35 * Math.sin(0.21 * time)); ph = ph0 + (still ? 0 : 0.16 * Math.sin(0.13 * time + 1));
    setView(); project(); analyse(); draw();
    if (still && settled && grab < 0 && want === cur && fade >= 1 && !turning) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function kick() { if (!running && !document.hidden && W) { running = true; last = 0; requestAnimationFrame(frame); } }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; fromScroll(); });
  }, { passive: true });
  window.addEventListener('resize', function () { if (resize()) { draw(); fromScroll(); } });
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('themechange', function () { readColors(); draw(); });
  reduce.addEventListener('change', kick);
  readColors();
  if (resize()) { fromScroll(); kick(); }
})();
