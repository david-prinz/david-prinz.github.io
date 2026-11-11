/* Updates: the universe, rewound as you scroll.
   The news on this page run backwards in time, and so does the figure beside them: today's galaxies
   at the top, the cosmic microwave background halfway down and the Big Bang at the bottom. Scrolling
   sets the temperature T of the universe. Cosmic time t and redshift z follow from flat ΛCDM with the
   Planck 2018 parameters, and in the hot early universe from t = 2.42 s g*^(-1/2) (kT / MeV)^(-2).
   The box is comoving, so the galaxies stay in place while their history runs backwards: they spin
   back, split into their progenitors, shrink and fade into the first stars, whose ionized bubbles close
   up in the neutral hydrogen of the dark ages. All structure comes from one Gaussian random field: its
   zero set is the cosmic web of today, and before recombination its modes ring as sound waves,
   cos(k c_s τ), which freeze into the spots of the cosmic microwave background. Further back, helium
   comes apart into protons and neutrons, these into quarks and gluons, and inflation shrinks it all
   into a point. Respects "reduce motion" (then only scrolling changes the picture) and pauses while
   the tab is hidden. */
(function () {
  var page = document.querySelector('.updates-page');
  if (!page) return;
  var aside = page.querySelector('.cosmos'), cv = aside && aside.querySelector('canvas');
  if (!cv || !cv.getContext) return;
  var stageEl = aside.querySelector('.cosmos-stage'), numEl = aside.querySelector('.cosmos-num');
  var ctx = cv.getContext('2d'), root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  aside.hidden = false;

  var PI = Math.PI, TAU = 2 * PI, A = 1.25;          // height of the box in units of its width
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function seeded(s) {
    return function () {
      s = s + 0x6D2B79F5 | 0;
      var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- Colours ---------- */
  var col = {}, texKey = '';
  function hex(s) {
    s = s.replace('#', '');
    if (s.length === 3) s = s.replace(/./g, '$&$&');
    var n = parseInt(s, 16);
    return isNaN(n) ? [128, 128, 128] : [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgba(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }
  function readColors() {
    var cs = getComputedStyle(root);
    ['bg', 'surface', 'fg', 'muted', 'lake', 'sun', 'event'].forEach(function (n) { col[n] = hex(cs.getPropertyValue('--' + n).trim()); });
    col.dark = col.bg[0] * 0.3 + col.bg[1] * 0.59 + col.bg[2] * 0.11 < 100;
    col.space = col.dark ? mix(col.bg, [0, 0, 0], 0.35) : col.surface;
    col.core = col.dark ? col.fg : mix(col.sun, col.fg, 0.35);
    col.star = col.dark ? mix(col.fg, col.lake, 0.3) : col.lake;
    col.haze = col.dark ? mix(col.muted, col.bg, 0.3) : col.muted;
    col.proton = col.dark ? col.sun : mix(col.sun, col.fg, 0.3);
    col.neutron = col.dark ? mix(col.fg, col.muted, 0.4) : mix(col.muted, col.fg, 0.3);
    texKey = '';                                      // the textures have their colours baked in
  }

  /* ---------- Cosmology: flat ΛCDM, Planck 2018 ---------- */
  var T0 = 2.7255, YR = 3.15576e7, GYR = 1e9 * YR;
  var H0 = 67.66 / 3.08568e19, OM = 0.3111, OR = 9.14e-5, OL = 1 - OM - OR;
  var LNA = Math.log(1e-9), NT = 800, tTab = [];
  (function () {                                      // t(a) = ∫ d ln a / H, tabulated in ln a
    function f(l) { var a = Math.exp(l); return 1 / (H0 * Math.sqrt(OR / (a * a * a * a) + OM / (a * a * a) + OL)); }
    var a0 = Math.exp(LNA), t = a0 * a0 / (2 * H0 * Math.sqrt(OR)), h = -LNA / NT;
    tTab.push(t);
    for (var i = 0; i < NT; i++) { var l = LNA + i * h; t += h / 6 * (f(l) + 4 * f(l + h / 2) + f(l + h)); tTab.push(t); }
  })();
  var TNOW = tTab[NT];
  function tOfA(a) {
    var x = (Math.log(a) - LNA) / -LNA * NT;
    if (x <= 0) return a * a / (2 * H0 * Math.sqrt(OR));
    var i = Math.min(NT - 1, Math.floor(x)), f = x - i;
    return tTab[i] * (1 - f) + tTab[i + 1] * f;
  }
  // relativistic degrees of freedom g*(kT), in log10(kT / MeV)
  var GS = [[-1.3, 3.36], [-0.2, 10.75], [1.7, 10.75], [2.0, 14.25], [2.2, 17.25], [2.4, 61.75], [4.0, 86.25], [5.3, 106.75]];
  function gstar(lE) {
    if (lE <= GS[0][0]) return GS[0][1];
    for (var i = 1; i < GS.length; i++) if (lE < GS[i][0]) return GS[i - 1][1] + (GS[i][1] - GS[i - 1][1]) * (lE - GS[i - 1][0]) / (GS[i][0] - GS[i - 1][0]);
    return GS[GS.length - 1][1];
  }
  function tOfT(T) {
    if (T < 1e8) return tOfA(T0 / T);
    var E = T / 1.16045e10;                            // kT in MeV
    return 2.42 / Math.sqrt(gstar(Math.log10(E))) / (E * E);
  }

  /* ---------- Scroll position -> epoch, as log10 of the temperature ---------- */
  function Lz(z) { return Math.log10(T0 * (1 + z)); }
  var KEYS = [[0, Lz(0)], [0.14, Lz(1)], [0.30, Lz(5)], [0.40, Lz(12)], [0.47, Lz(30)], [0.57, Lz(920)], [0.62, Lz(1300)],
    [0.70, 6], [0.745, 8.5], [0.785, 9.5], [0.83, 12.3], [0.88, 15.2], [0.925, 25.75]];
  var E_INF = 0.925, E_PL = 0.975;                     // reheating (t ≈ 1e-32 s); start of inflation
  function epoch(e) {
    var s = { e: e, inf: 0, planck: e >= E_PL };
    if (e >= E_INF) { s.L = KEYS[KEYS.length - 1][1]; s.inf = clamp((e - E_INF) / (E_PL - E_INF), 0, 1); }
    else {
      for (var i = 1; i < KEYS.length - 1; i++) if (e <= KEYS[i][0]) break;
      var k0 = KEYS[i - 1], k1 = KEYS[i];
      s.L = k0[1] + (k1[1] - k0[1]) * clamp((e - k0[0]) / (k1[0] - k0[0]), 0, 1);
    }
    s.T = Math.pow(10, s.L); s.a = T0 / s.T; s.z = Math.max(0, s.T / T0 - 1); s.t = tOfT(s.T);
    return s;
  }

  /* ---------- One Gaussian random field for all structure ---------- */
  var NM = 44, MODES = [], KPK = TAU * 4.2;           // KPK: the first acoustic peak
  (function () {
    var r = seeded(1913), norm = 0;
    for (var i = 0; i < NM; i++) {
      var k = TAU * (1.3 + 6.4 * Math.pow(r(), 1.25)), ang = r() * TAU;
      var amp = Math.sqrt(-2 * Math.log(1 - 0.98 * r())) * Math.pow(k / KPK, -0.35);
      MODES.push({ kx: k * Math.cos(ang), ky: k * Math.sin(ang), k: k, ph: r() * TAU, amp: amp });
      norm += amp * amp / 2;
    }
    norm = Math.sqrt(norm);
    var nw = 0;                                       // the web grows from the large scales only
    MODES.forEach(function (m) { m.amp /= norm; m.aw = m.amp * Math.exp(-Math.pow(m.k / (TAU * 3), 2)); nw += m.aw * m.aw / 2; });
    nw = Math.sqrt(nw);
    MODES.forEach(function (m) { m.aw /= nw; });
  })();
  function web(x, y) {
    var s = 0;
    for (var i = 0; i < NM; i++) { var m = MODES[i]; s += m.aw * Math.cos(m.kx * x + m.ky * y + m.ph); }
    return s;
  }

  /* ---------- Galaxies on the web, their progenitors and the first stars ---------- */
  var GAL = [], DOTS = [], SITES = [], NUC = [];
  (function () {
    var r = seeded(42), tries = 0;
    while (GAL.length < 22 && tries++ < 20000) {
      var x = 0.07 + 0.86 * r(), y = 0.07 + (A - 0.14) * r(), f = web(x, y);
      if (r() > Math.exp(-f * f / 0.03)) continue;    // galaxies sit on the web, the zero set of the field
      if (GAL.some(function (g) { return Math.hypot(g.x - x, g.y - y) < 0.12; })) continue;
      var u = r(), type = u < 0.58 ? 'S' : u < 0.88 ? 'E' : 'I';
      var g = {
        x: x, y: y, type: type, r: (GAL.length < 2 ? 0.085 : 0.034) + 0.04 * Math.pow(r(), 1.6), pa: r() * PI,
        ci: type === 'E' ? 0.55 + 0.4 * r() : 0.32 + 0.68 * r(), spin: r() < 0.5 ? -1 : 1, b: 0.24 + 0.1 * r(),
        psi: r() * TAU, zf: 7 + 4 * r(), zm: Infinity, mdir: r() * TAU, jit: [], clumps: [], jet: r() * PI
      };
      if (type === 'E') g.zm = 0.5 + 2 * r(); else if (r() < 0.45) g.zm = 1 + 2.5 * r();
      g.qso = g.zm > 1.2 && g.zm < 3.6 && r() < 0.6;  // mergers feed quasars
      for (var j = 0; j < 36; j++) g.jit.push([(r() - 0.5) * 0.16, (r() - 0.5) * 0.3]);
      for (j = 0; j < 4; j++) g.clumps.push([0.15 + 0.55 * r(), r() * TAU, 0.16 + 0.12 * r()]);
      GAL.push(g);
    }
    for (var i = 0; i < 46; i++) DOTS.push([r(), r() * A, 0.35 + 0.6 * r(), 0.3 + 0.6 * r()]);
    GAL.forEach(function (g) {                         // first-star sites where the progenitors will be
      var pos = g.zm < Infinity ? [[0.42, 0.8], [-0.58, 0.62]] : [[0, 1]];
      pos.forEach(function (p) {
        var sep = g.r * 2.8, ang = g.mdir + 1.1 * g.spin * 6;
        var st = { x: g.x + p[0] * Math.cos(ang) * sep, y: g.y + p[0] * Math.sin(ang) * sep, zf: g.zf, zs: 20 + 6 * r(),
          zb: 13 + 7 * r(), R: 0.16 + 0.14 * r() * p[1], stars: [] };
        var n = 3 + Math.floor(r() * 3);
        for (var k = 0; k < n; k++) st.stars.push([(r() - 0.5) * 0.045, (r() - 0.5) * 0.045, 0.6 + 0.8 * r(), r() * TAU, 1 + 2 * r()]);
        SITES.push(st);
      });
    });
    // nucleons: three helium-4 nuclei and free protons; above ~1e9 K the helium comes apart
    for (i = 0; i < 30; i++) {
      var he = i < 12, c = Math.floor(i / 4), m = i % 4;
      var n = { he: he, p: he ? m % 2 === 0 : i < 28, fx: 0.1 + 0.8 * r(), fy: 0.1 + (A - 0.2) * r(),
        ph: r() * TAU, p1: r() * TAU, p2: r() * TAU, w: 0.7 + 0.6 * r(), q0: r() * TAU, qs: r() < 0.5 ? -1 : 1, qw: [] };
      if (he) {
        if (m === 0) NUC.cx = [0.15 + 0.7 * r(), 0.15 + (A - 0.3) * r()];
        n.cx = NUC.cx[0]; n.cy = NUC.cx[1]; n.ox = [0.6, 0, -0.6, 0][m]; n.oy = [0, 0.6, 0, -0.6][m];
      }
      for (j = 0; j < 3; j++) n.qw.push([r() * TAU, r() * TAU, 0.6 + 0.8 * r()]);
      NUC.push(n);
    }
  })();

  /* ---------- Canvas, textures and the haze ---------- */
  var W = 0, H = 0, dpr = 1, cell = 3, GX = 0, GY = 0, NG = 0, basis, Fg, acc, img;
  var tex = document.createElement('canvas'), tctx = tex.getContext('2d');
  var hz = document.createElement('canvas'), hctx = hz.getContext('2d');
  function resize() {
    var w = cv.clientWidth, d = Math.min(window.devicePixelRatio || 1, 2);
    if (!w) return false;
    if (w === W && d === dpr && cv.width) return true;
    W = w; H = Math.round(W * A); dpr = d;
    cv.width = hz.width = Math.round(W * dpr); cv.height = hz.height = Math.round(H * dpr);
    cell = Math.max(1.5, W / 76); GX = Math.ceil(W / cell) + 2; GY = Math.ceil(H / cell) + 2; NG = GX * GY;
    basis = new Float32Array(NM * NG); Fg = new Float32Array(NG); acc = new Float32Array(NG);
    for (var j = 0; j < GY; j++) for (var i = 0; i < GX; i++) {
      var x = i * cell / W, y = j * cell / W, p = j * GX + i, s = 0;
      for (var m = 0; m < NM; m++) { var c = Math.cos(MODES[m].kx * x + MODES[m].ky * y + MODES[m].ph); basis[m * NG + p] = c; s += MODES[m].aw * c; }
      Fg[p] = s;
    }
    tex.width = GX; tex.height = GY; img = tctx.createImageData(GX, GY); texKey = '';
    return true;
  }
  function drawTex(alpha) {
    if (alpha <= 0.003) return;
    ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tex, -cell / 2, -cell / 2, GX * cell, GY * cell);
    ctx.globalAlpha = 1;
  }
  function renderWeb(w) {                             // the cosmic web: where the field is close to zero
    var c = col.lake, d = img.data, inv = 1 / (w * w);
    for (var p = 0, q = 0; p < NG; p++, q += 4) { var f = Fg[p]; d[q] = c[0]; d[q + 1] = c[1]; d[q + 2] = c[2]; d[q + 3] = 255 * Math.exp(-f * f * inv); }
    tctx.putImageData(img, 0, 0);
  }
  var AREC = 1 / 1091, AEQ = 1 / 3400, wts = new Float32Array(NM);
  function tau(a) { return Math.sqrt(a + AEQ) - Math.sqrt(AEQ); }      // conformal time, radiation + matter
  var TREC = tau(AREC);
  function renderCMB(s, ring) {
    // each mode is a standing sound wave, cos(k c_s τ), damped by photon diffusion (Silk damping)
    var a = Math.max(s.a, AREC), x = tau(a) / TREC, kd = TAU * 6.2 * Math.pow(AREC / a, 0.75), s2 = 0, m, p;
    var key = 'c' + Math.round(x * 500) + (ring ? ':' + Math.round(time * 24) : '');
    if (key === texKey) return;
    texKey = key;
    for (m = 0; m < NM; m++) {
      var M = MODES[m], th = PI * M.k / KPK * x + (ring ? 0.55 * ring * Math.sin(time * (0.7 + 1.1 * M.k / KPK) + M.ph) : 0);
      wts[m] = M.amp * Math.exp(-(M.k / kd) * (M.k / kd)) * Math.cos(th);
      s2 += wts[m] * wts[m] / 2;
    }
    var inv = 1 / Math.sqrt(s2 || 1);
    acc.fill(0);
    for (m = 0; m < NM; m++) { var wm = wts[m] * inv, off = m * NG; for (p = 0; p < NG; p++) acc[p] += wm * basis[off + p]; }
    var d = img.data, hot = col.sun, cold = col.lake;
    for (p = 0; p < NG; p++) {
      var v = acc[p], c = v > 0 ? hot : cold, q = p * 4;
      d[q] = c[0]; d[q + 1] = c[1]; d[q + 2] = c[2]; d[q + 3] = 255 * Math.pow(Math.min(1, Math.abs(v) / 2), 0.85);
    }
    tctx.putImageData(img, 0, 0);
  }

  /* ---------- Drawing helpers ---------- */
  function dot(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function glow(x, y, r, c1, a1, c0, a0) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(c0, a0)); g.addColorStop(0.28, rgba(c1, a1)); g.addColorStop(1, rgba(c1, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  /* ---------- The late universe: galaxies, quasars, first stars, neutral hydrogen ---------- */
  function components(g, z) {
    var sz = Math.pow(1 + z, -0.45), fade = 1 - smooth(g.zf - 2.5, g.zf, z), out = [];
    if (fade <= 0) return out;
    var m = g.zm < Infinity ? smooth(g.zm - 0.12, g.zm + 0.18, z) : 0;   // 0: merged, 1: two progenitors
    if (m < 1) out.push({ x: g.x, y: g.y, r: g.r * sz, type: g.type, al: fade * (1 - m), sub: 0 });
    if (m > 0) {
      var sep = g.r * (0.5 + 2.3 * smooth(g.zm, g.zm + 1.6, z)), ang = g.mdir + 1.1 * g.spin * Math.min(z - g.zm, 6);
      var dx = Math.cos(ang) * sep, dy = Math.sin(ang) * sep;
      out.push({ x: g.x + 0.42 * dx, y: g.y + 0.42 * dy, r: g.r * sz * 0.8, type: 'S', al: fade * m, sub: 1 });
      out.push({ x: g.x - 0.58 * dx, y: g.y - 0.58 * dy, r: g.r * sz * 0.62, type: 'S', al: fade * m, sub: 2 });
    }
    return out;
  }
  function drawGalaxy(g, c, psi, z) {
    var x = c.x * W, y = c.y * W, r = c.r * W, al = c.al;
    if (r < 0.6 || al < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(g.pa + c.sub * 1.3);
    if (c.type === 'E') {
      ctx.scale(1, g.ci);
      glow(0, 0, r, col.sun, 0.42 * al, col.core, 0.85 * al);
      ctx.restore(); return;
    }
    ctx.scale(1, g.ci);
    var arms = c.type === 'S' ? 1 - smooth(1.3, 3.2, z) : 0, clumps = c.type === 'S' ? smooth(1.0, 3.0, z) : 1, i;
    glow(0, 0, r, col.lake, 0.22 * al, col.lake, 0.3 * al);
    if (arms > 0.02) {                                // two trailing logarithmic arms, as dotted star clouds
      var N = r > 9 ? 18 : 11;
      ctx.fillStyle = rgba(col.lake, 1);
      for (var a = 0; a < 2; a++) for (i = 0; i < N; i++) {
        var f = i / (N - 1), rr = r * (0.2 + 0.8 * f), j = g.jit[(a * 18 + i) % 36];
        var phi = psi + c.sub + a * PI - g.spin * Math.log(rr / (0.2 * r)) / g.b + j[1];
        ctx.globalAlpha = arms * al * (0.9 - 0.55 * f);
        dot(Math.cos(phi) * rr * (1 + j[0]), Math.sin(phi) * rr * (1 + j[0]), Math.max(0.45, r * (0.075 - 0.045 * f)));
      }
      ctx.globalAlpha = 1;
    }
    if (clumps > 0.02) {                              // young galaxies are clumpy
      for (i = 0; i < 4; i++) {
        var k = g.clumps[i], cr = k[0] * r, ca = k[1] + 0.3 * psi;
        glow(Math.cos(ca) * cr, Math.sin(ca) * cr, Math.max(1, k[2] * r * 1.6), col.lake, 0.55 * clumps * al, col.star, 0.9 * clumps * al);
      }
    }
    glow(0, 0, r * 0.34, col.sun, 0.5 * al * (1 - 0.6 * clumps), col.core, 0.8 * al * (1 - 0.5 * clumps));
    ctx.restore();
  }
  function quasar(g, z) {
    var q = Math.exp(-Math.pow((z - g.zm) / 0.6, 2)) * (1 - smooth(g.zf - 2.5, g.zf, z));
    if (q < 0.02) return;
    var x = g.x * W, y = g.y * W, len = W * (0.06 + 0.05 * q), ux = Math.cos(g.jet) * len, uy = Math.sin(g.jet) * len;
    ctx.lineCap = 'round';
    for (var sgn = -1; sgn <= 1; sgn += 2) {
      var lg = ctx.createLinearGradient(x, y, x + sgn * ux, y + sgn * uy);
      lg.addColorStop(0, rgba(col.event, 0.85 * q)); lg.addColorStop(1, rgba(col.event, 0));
      ctx.strokeStyle = lg; ctx.lineWidth = Math.max(0.8, W / 230);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sgn * ux, y + sgn * uy); ctx.stroke();
    }
    glow(x, y, W * 0.045, col.event, 0.45 * q, col.core, q);
  }
  function firstStars(z) {
    var u = Math.max(0.6, W / 230);
    SITES.forEach(function (st) {
      var a = smooth(st.zf - 3.5, st.zf - 1, z) * (1 - smooth(st.zs - 4, st.zs, z));
      if (a < 0.02) return;
      st.stars.forEach(function (p, i) {
        var x = (st.x + p[0]) * W, y = (st.y + p[1]) * W, tw = 0.65 + 0.35 * Math.sin(time * p[4] + p[3]);
        ctx.fillStyle = rgba(col.star, a * tw); dot(x, y, p[2] * u);
        if (i === 0) {                                // a sparkle on the brightest star of each site
          ctx.strokeStyle = rgba(col.star, 0.6 * a * tw); ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(x - 3.2 * u, y); ctx.lineTo(x + 3.2 * u, y); ctx.moveTo(x, y - 3.2 * u); ctx.lineTo(x, y + 3.2 * u); ctx.stroke();
        }
      });
    });
  }
  function haze(z) {                                  // neutral hydrogen, with the ionized bubbles of the first stars
    var ah = 0.26 * smooth(5.5, 8.5, z) * (1 - smooth(850, 1150, z));
    if (ah < 0.004) return;
    hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hctx.globalCompositeOperation = 'source-over'; hctx.clearRect(0, 0, W, H);
    hctx.fillStyle = rgba(col.haze, ah); hctx.fillRect(0, 0, W, H);
    hctx.globalCompositeOperation = 'destination-out';
    SITES.forEach(function (st) {
      var R = W * st.R * Math.pow(1 - smooth(6, st.zb, z), 0.8);
      if (R < 0.5) return;
      var x = st.x * W, y = st.y * W, g = hctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.7, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      hctx.fillStyle = g; hctx.beginPath(); hctx.arc(x, y, R, 0, TAU); hctx.fill();
    });
    ctx.drawImage(hz, 0, 0, W, H);
  }
  function late(s) {
    var z = s.z, lb = (TNOW - s.t) / GYR;            // look-back time: the galaxies spin back
    var aw = 0.2 / Math.sqrt(1 + z) * (1 - smooth(800, 1100, z));
    if (aw > 0.004) {
      var w = 0.11 * Math.pow(1 + z, 0.35), key = 'w' + Math.round(Math.log(w) * 60);
      if (key !== texKey) { renderWeb(w); texKey = key; }
      drawTex(aw);
    }
    var ag = 0.42 * Math.pow(smooth(500, 2973, s.T), 1.6); // the background light, warming up towards recombination
    if (ag > 0.003) { ctx.fillStyle = rgba(col.sun, ag); ctx.fillRect(0, 0, W, H); }
    haze(z);
    if (z > 26) return;
    var ad = 0.55 * (1 - smooth(2.5, 6, z));
    if (ad > 0.01) {
      ctx.fillStyle = rgba(col.muted, 1);
      DOTS.forEach(function (d) { ctx.globalAlpha = ad * d[3]; dot(d[0] * W, d[1] * W, d[2] * Math.max(0.7, W / 230)); });
      ctx.globalAlpha = 1;
    }
    GAL.forEach(function (g) {
      var psi = g.psi + g.spin * (0.06 * time + 0.8 * lb);
      components(g, z).forEach(function (c) { drawGalaxy(g, c, psi, z); });
      if (g.qso) quasar(g, z);
    });
    firstStars(z);
  }

  /* ---------- The early universe: plasma, nuclei, quarks and gluons, inflation ---------- */
  function plasmaColor(L) {
    var mid = mix(col.sun, col.event, 0.5);
    if (L < 8.5) return mix(col.sun, mid, smooth(3.5, 8.5, L));
    return mix(mid, col.event, smooth(8.5, 12.3, L));
  }
  function nucleonAt(n, L) {
    var sp = n.ph + clk * n.w, ff = n.he ? smooth(8.9, 9.35, L) : 1;
    var wx = n.fx + 0.07 * Math.sin(sp + n.p1), wy = n.fy + 0.07 * Math.cos(0.83 * sp + n.p2);
    if (ff >= 1) return [wx, wy];
    var rn = 0.022, bx = n.cx + 0.03 * Math.sin(0.4 * sp + n.p1) + n.ox * rn, by = n.cy + 0.03 * Math.cos(0.33 * sp + n.p1) + n.oy * rn;
    return [bx + (wx - bx) * ff, by + (wy - by) * ff];
  }
  function gluon(x1, y1, x2, y2) {                    // a curly line, as in a Feynman graph
    var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    if (len < 2) return;
    var n = Math.max(2, Math.round(len / 4)), c = 1.25 * len / (TAU * n) + 0.5, ux = dx / len, uy = dy / len, steps = n * 8;
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, ph = TAU * n * t, along = len * t - c * Math.sin(ph), side = c * (1 - Math.cos(ph)) * 0.8 * Math.sin(PI * t) ;
      var px = x1 + ux * along - uy * side, py = y1 + uy * along + ux * side;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  function particles(s) {
    var L = s.L, vn = smooth(7.3, 8.2, L) * (1 - smooth(12.1, 12.5, L)), vq = smooth(12.1, 12.5, L) * (1 - smooth(24.5, 25.75, L));
    if (vn < 0.01 && vq < 0.01) return;
    var count = W < 150 ? 16 : NUC.length, rn = Math.max(1.3, 0.016 * W), pos = [], i, j;
    for (i = 0; i < count; i++) pos.push(nucleonAt(NUC[i], L));
    if (vn > 0.01) {
      ctx.lineWidth = 0.8; ctx.strokeStyle = rgba(col.space, vn);
      for (i = 0; i < count; i++) {
        ctx.fillStyle = rgba(NUC[i].p ? col.proton : col.neutron, vn);
        ctx.beginPath(); ctx.arc(pos[i][0] * W, pos[i][1] * W, rn, 0, TAU); ctx.fill(); ctx.stroke();
      }
    }
    if (vq > 0.01) {
      var g = smooth(12.1, 12.9, L), heat = 1 + 0.6 * smooth(12.3, 25, L), qs = [], qcol = [col.sun, col.lake, col.event];
      for (i = 0; i < count; i++) {
        var n = NUC[i];
        for (j = 0; j < 3; j++) {
          var w = n.qw[j], ang = n.q0 + j * TAU / 3 + 0.8 * n.qs * clk, rq = (0.011 + 0.045 * g) * W;
          qs.push({ x: pos[i][0] * W + Math.cos(ang) * rq + g * heat * 0.05 * W * Math.sin(clk * w[2] + w[0]),
            y: pos[i][1] * W + Math.sin(ang) * rq + g * heat * 0.05 * W * Math.cos(0.9 * clk * w[2] + w[1]), c: qcol[j], n: i });
        }
      }
      ctx.strokeStyle = rgba(col.muted, 0.75 * vq); ctx.lineWidth = 0.7;
      var dmax = 0.085 * W;
      for (i = 0; i < qs.length; i++) for (j = i + 1; j < qs.length; j++) {
        var a = qs[i], b = qs[j], same = a.n === b.n, d = Math.hypot(a.x - b.x, a.y - b.y);
        if (same ? g < 0.98 : d < dmax && (i + j) % 2 === 0) {
          if (W < 150) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } else gluon(a.x, a.y, b.x, b.y);
        }
      }
      var rq2 = Math.max(1, 0.011 * W);
      qs.forEach(function (q) { ctx.fillStyle = rgba(q.c, vq); dot(q.x, q.y, rq2); });
    }
  }
  function early(s) {
    var L = s.L, u = s.inf, op = smooth(3.42, 3.5, L);
    if (op <= 0 || s.planck) return;
    var cx = W / 2, cy = H / 2;
    ctx.save();
    if (u > 0) {                                      // inflation, rewound: the patch shrinks into a point
      var S = Math.pow(10, -3.6 * Math.pow(u, 1.2)), k = smooth(0, 0.15, u);
      ctx.beginPath(); ctx.arc(cx, cy, S * 0.5 * (Math.hypot(W, H) * (1 - k) + W * k), 0, TAU); ctx.clip();
      ctx.translate(cx, cy); ctx.scale(S, S); ctx.translate(-cx, -cy);
    }
    ctx.fillStyle = rgba(plasmaColor(L), (0.42 + 0.12 * smooth(3.5, 9, L) + 0.08 * smooth(12, 16, L)) * op);
    ctx.fillRect(-W, -H, 3 * W, 3 * H);
    var ring = reduce.matches ? 0 : smooth(3.48, 3.65, L) * (1 - smooth(8, 9.5, L));
    renderCMB(s, ring);
    var ac = op * (0.9 - 0.6 * smooth(4.5, 8.5, L));
    if (u > 0) ac += (0.6 - ac) * smooth(0, 0.3, u);
    drawTex(ac);
    particles(s);
    ctx.restore();
  }
  function bigBang(s) {
    var I = s.planck ? 1 : smooth(0.35, 1, s.inf);
    if (I < 0.01) return;
    var fl = reduce.matches ? 1 : 1 + 0.12 * Math.sin(time * 5.3) * Math.sin(time * 2.1);
    var cx = W / 2, cy = H / 2, R = W * (s.planck ? 0.15 : 0.11) * fl;
    glow(cx, cy, R, col.event, 0.4 * I, col.core, 0.95 * I);
    ctx.fillStyle = rgba(col.core, I); dot(cx, cy, Math.max(1.2, W / 150));
    if (s.planck && !reduce.matches) {                // spacetime foam
      var r = seeded(Math.floor(time * 9));
      ctx.strokeStyle = rgba(col.event, 0.55); ctx.lineWidth = 0.7;
      for (var i = 0; i < 7; i++) {
        var a = r() * TAU, d = R * 0.9 * Math.sqrt(r());
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.8 + 2.4 * r() * W / 230, 0, TAU); ctx.stroke();
      }
    }
  }

  /* ---------- Readout ---------- */
  function sup(n) { return '10<sup>' + String(n).replace('-', '−') + '</sup>'; }
  function two(x) {                                   // two significant digits
    if (x < 10) return x.toFixed(1).replace(/\.0$/, '');
    var p = Math.pow(10, Math.floor(Math.log10(x)) - 1);
    return String(Math.round(x / p) * p);
  }
  function sci(x) {
    var n = Math.floor(Math.log10(x) + 1e-9), m = Math.round(x / Math.pow(10, n));
    if (m >= 10) { m = 1; n++; }
    return (m === 1 ? '' : m + ' × ') + sup(n);
  }
  var TU = [[GYR, 'Gyr'], [1e6 * YR, 'Myr'], [1e3 * YR, 'kyr'], [YR, 'yr'], [86400, 'd'], [3600, 'h'], [60, 'min'], [1, 's'], [1e-3, 'ms'], [1e-6, 'µs'], [1e-9, 'ns']];
  function fmtTime(t) {
    for (var i = 0; i < TU.length; i++) if (t >= TU[i][0] * 0.9995) return (i ? two(t / TU[i][0]) : (t / GYR).toFixed(1)) + ' ' + TU[i][1];
    return sci(t) + ' s';
  }
  function fmtTemp(T) { return (T < 1e4 ? two(T) : sci(T)) + ' K'; }
  function fmtZ(z) { return z < 0.005 ? '= 0' : '≈ ' + (z < 10 ? z.toFixed(1) : z < 100 ? Math.round(z) : two(z)); }
  function stage(s) {
    var T = s.T, z = s.z;
    if (T > 1.6e15) return 'Electroweak epoch';
    if (T > 2e12) return 'Quark–gluon plasma';
    if (T > 3e9) return 'Protons and neutrons';
    if (T > 3e8) return 'First nuclei';
    if (z > 1300) return 'Photon–baryon plasma';
    if (z > 900) return 'Cosmic microwave background';
    if (z > 30) return 'Dark ages';
    if (z > 12) return 'Cosmic dawn: first stars';
    if (z > 5.5) return 'Reionization';
    if (z > 1.5) return 'Young galaxies, quasars';
    return 'Galaxies';
  }
  var shown = '';
  function readout(s) {
    if (!stageEl || !numEl) return;
    var st, l1, l2 = '';
    if (s.e >= 0.995) { st = 'Big Bang'; l1 = 't → 0'; }
    else if (s.planck) { st = 'Planck epoch: quantum gravity'; l1 = 't &lt; ' + sup(-43) + ' s'; }
    else if (s.inf > 0) { st = 'Inflation'; l1 = 't ≈ ' + sup(-Math.round(32 + 4 * s.inf)) + ' s'; l2 = 'space grows by e<sup>60</sup>'; }
    else { st = stage(s); l1 = 't ≈ ' + fmtTime(s.t); l2 = 'T ≈ ' + fmtTemp(s.T) + (s.z < 1e4 ? ' · z ' + fmtZ(s.z) : ''); }
    var html = l1 + (l2 ? '<br>' + l2 : '');
    if (st + html === shown) return;
    shown = st + html;
    stageEl.textContent = st; numEl.innerHTML = html;
  }

  /* ---------- Frame ---------- */
  var e = 0, target = 0, time = 0, clk = 0, last = 0, drawn = 0, running = false;
  function draw() {
    if (!W && !resize()) return;
    var s = epoch(e);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = rgba(col.space, 1); ctx.fillRect(0, 0, W, H);
    if (s.L < 3.55) late(s);
    early(s);
    if (s.inf > 0) bigBang(s);
    readout(s);
  }
  function frame(now) {
    if (document.hidden || reduce.matches) { running = false; return; }
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now; time += dt;
    var s = epoch(e);
    clk += dt * (0.25 + 0.1 * Math.max(0, Math.min(s.L, 25) - 7));   // hotter is faster
    e += (target - e) * (1 - Math.exp(-5 * dt));
    if (Math.abs(target - e) < 1e-5) e = target;
    if (now - drawn > 28) { drawn = now; draw(); }
    requestAnimationFrame(frame);
  }
  function kick() { if (!running && !document.hidden && !reduce.matches && W) { running = true; last = 0; requestAnimationFrame(frame); } }
  function fromScroll(jump) {
    var span = document.documentElement.scrollHeight - window.innerHeight;
    target = span > 40 ? clamp(window.scrollY / span, 0, 1) : 0;
    if (jump || reduce.matches) { e = target; draw(); }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; fromScroll(false); });
  }, { passive: true });
  window.addEventListener('resize', function () { if (resize()) { fromScroll(false); draw(); } });
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('themechange', function () { readColors(); draw(); });
  reduce.addEventListener('change', function () { if (reduce.matches) fromScroll(true); else kick(); });
  readColors();
  if (resize()) { fromScroll(true); kick(); }
})();
