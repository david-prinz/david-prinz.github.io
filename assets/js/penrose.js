/* Penrose diagram beside the CV.
   Minkowski spacetime (r >= 0) in compactified coordinates
   T = atan(t + r) + atan(t - r),  R = atan(t + r) - atan(t - r).
   A timelike worldline runs from i- to i+ and passes through every dated CV entry (read from the page,
   so the diagram follows the CV text). Scrolling to an entry, pointing at it or focusing one of its links
   marks its event and shades its past and future light cones; a period of employment is drawn as a segment.
   Moving over the diagram shows your own light cone and a trail coloured by its causal character.
   Respects "reduce motion" (no drawing-in, no fading trail). */
(function () {
  var aside = document.querySelector('.cv-page .penrose');
  var prose = document.querySelector('.cv-page .prose');
  if (!aside || !prose) return;
  var svg = aside.querySelector('svg');
  var NS = 'http://www.w3.org/2000/svg';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Dated entries ---------- */
  var today = new Date();
  var NOW = today.getFullYear() + today.getMonth() / 12 + 0.5 / 12;
  var DASH = '(?:–|—|-{1,2})';
  var RANGE = new RegExp('(\\d{1,2})/(\\d{4})\\s*' + DASH + '\\s*(\\d{1,2})/(\\d{4})');
  var SINCE = /since\s+(\d{1,2})\/(\d{4})/i;
  var MONTH = /(\d{1,2})\/(\d{4})/;
  var YEAR = /,\s((?:19|20)\d{2})(?=\s*(?:,|:|$))/;
  // Terms: winter term Y = 10/Y to 03/Y+1, spring (or summer) term Y = 04/Y to 09/Y.
  // Seasons, used for rough time frames: spring = 01-03, summer = 07-09, autumn = 10-12.
  var TERM = '(winter|spring|summer)\\s+term\\s+((?:19|20)\\d{2})';
  var TERMS = new RegExp(TERM + '\\s*(?:' + DASH + '|to)\\s*' + TERM, 'i');
  var ONETERM = new RegExp(TERM, 'i');
  var SEASON = /\b(spring|summer|autumn|fall)\s+((?:19|20)\d{2})\b/i;
  var SEASONS = new RegExp('\\b(spring|summer|autumn|fall)\\s+((?:19|20)\\d{2})\\s*(?:' + DASH + '|to)\\s*(spring|summer|autumn|fall)\\s+((?:19|20)\\d{2})', 'i');
  function term(kind, y) {
    y = +y;
    return /winter/i.test(kind) ? [y + 9 / 12, y + 1 + 3 / 12] : [y + 3 / 12, y + 9 / 12];
  }
  function season(kind, y) {
    var start = { spring: 0, summer: 6, autumn: 9, fall: 9 }[kind.toLowerCase()];
    return [+y + start / 12, +y + (start + 3) / 12];
  }
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1).toLowerCase(); }
  function ym(m, y) { return +y + (+m - 1) / 12; }
  function parse(text) {
    var m;
    if ((m = text.match(RANGE))) return { a: ym(m[1], m[2]), b: ym(m[3], m[4]) + 1 / 12, label: m[1] + '/' + m[2] + '–' + m[3] + '/' + m[4] };
    if ((m = text.match(SINCE))) return { a: ym(m[1], m[2]), b: NOW, label: 'since ' + m[1] + '/' + m[2] };
    if ((m = text.match(TERMS))) {
      var t1 = term(m[1], m[2]), t2 = term(m[3], m[4]);
      return { a: t1[0], b: t2[1], label: lower(m[1]) + ' term ' + m[2] + ' \u2013\n' + lower(m[3]) + ' term ' + m[4] };
    }
    if ((m = text.match(ONETERM))) { var t = term(m[1], m[2]); return { a: t[0], b: t[1], label: lower(m[1]) + ' term ' + m[2] }; }
    if ((m = text.match(SEASONS))) {
      var s1 = season(m[1], m[2]), s2 = season(m[3], m[4]);
      return { a: s1[0], b: s2[1], label: lower(m[1]) + ' ' + m[2] + ' \u2013\n' + lower(m[3]) + ' ' + m[4] };
    }
    if ((m = text.match(SEASON))) { var z = season(m[1], m[2]); return { a: z[0], b: z[1], label: lower(m[1]) + ' ' + m[2] }; }
    if ((m = text.match(MONTH))) { var a = ym(m[1], m[2]) + 0.5 / 12; return { a: a, b: a, label: m[1] + '/' + m[2] }; }
    if ((m = text.match(YEAR))) return { a: +m[1] + 0.5, b: +m[1] + 0.5, label: m[1] };
    return null;
  }
  var items = [];
  var lis = prose.querySelectorAll('li');
  for (var i = 0; i < lis.length; i++) {
    var d = parse(lis[i].textContent.replace(/\s+/g, ' ').trim());
    if (d) { d.li = lis[i]; items.push(d); }
  }
  if (!items.length) return;
  aside.hidden = false;

  /* ---------- Geometry ---------- */
  var W = 200, X0 = 24, Y0 = 24, MID = Y0 + W;       // corners: i+ (X0,Y0), i- (X0,Y0+2W), i0 (X0+W,MID)
  function map(t, r) {
    var u = Math.atan(t + r), v = Math.atan(t - r);
    return [X0 + (u - v) / Math.PI * W, MID - (u + v) / Math.PI * W];
  }
  function tOf(year) { return (year - 2021) / 3; }   // calendar years -> Minkowski time
  function rOf(t) { return 0.8 + 0.3 * Math.sin(0.9 * t + 0.6); }   // |dr/dt| <= 0.27: timelike
  function at(year) { var t = tOf(year); return map(t, rOf(t)); }
  function pathOf(pts) {
    var s = '';
    for (var k = 0; k < pts.length; k++) s += (k ? 'L' : 'M') + pts[k][0].toFixed(1) + ' ' + pts[k][1].toFixed(1);
    return s;
  }
  function curve(y0, y1) {
    var pts = [], n = Math.max(2, Math.ceil((y1 - y0) * 12));
    for (var k = 0; k <= n; k++) pts.push(at(y0 + (y1 - y0) * k / n));
    return pts;
  }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(n);
    return n;
  }

  var first = Infinity;
  items.forEach(function (it) { first = Math.min(first, it.a); });
  first = Math.min(first, NOW) - 0.5;

  var TRI = X0 + ',' + Y0 + ' ' + (X0 + W) + ',' + MID + ' ' + X0 + ',' + (Y0 + 2 * W);
  var clip = el('clipPath', { id: 'penrose-clip' }, el('defs', {}));
  el('polygon', { points: TRI }, clip);

  var grid = el('g', { fill: 'none', 'stroke-width': 0.6 });
  [-4, -2, -1, -0.5, 0, 0.5, 1, 2, 4].forEach(function (t) {
    var pts = []; for (var p = 0; p < 1.5707; p += 0.02) pts.push(map(t, Math.tan(p)));
    el('path', { d: pathOf(pts) }, grid);
  });
  [0.3, 0.7, 1.4, 3, 7].forEach(function (r) {
    var pts = []; for (var p = -1.5707; p < 1.5707; p += 0.02) pts.push(map(Math.tan(p), r));
    el('path', { d: pathOf(pts) }, grid);
  });
  var frame = el('polygon', { points: TRI, fill: 'none', 'stroke-width': 1 });

  var labels = el('g', { 'font-family': 'IBM Plex Mono, ui-monospace, monospace', 'font-size': 12 });
  function lab(x, y, s, anchor) {
    var t = el('text', { x: x, y: y, 'text-anchor': anchor || 'start' }, labels);
    t.textContent = s; return t;
  }
  lab(X0 - 4, Y0 - 8, 'i⁺'); lab(X0 - 4, Y0 + 2 * W + 20, 'i⁻'); lab(X0 + W + 6, MID + 4, 'i⁰');
  lab(X0 + W / 2 + 10, Y0 + W / 2 - 4, 'ℐ⁺'); lab(X0 + W / 2 + 10, Y0 + 1.5 * W + 14, 'ℐ⁻');
  lab(X0 - 9, MID, 'r = 0', 'middle').setAttribute('transform', 'rotate(-90 ' + (X0 - 9) + ' ' + MID + ')');

  var world = el('g', { 'clip-path': 'url(#penrose-clip)' });
  var pastCone = el('path', { 'stroke-width': 0.8, 'stroke-dasharray': '3 3' }, world);
  var ownCone = el('path', { 'stroke-width': 0 }, world);
  var ownRays = el('path', { fill: 'none', 'stroke-width': 0.8, 'stroke-dasharray': '3 3' }, world);
  var trailG = el('g', { fill: 'none', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, world);

  var ghost = el('path', {
    d: pathOf(curve(1900, first)) + pathOf(curve(NOW, 2200)),
    fill: 'none', 'stroke-width': 1, 'stroke-dasharray': '2 4'
  });
  var line = el('path', { d: pathOf(curve(first, NOW)), fill: 'none', 'stroke-width': 2, 'stroke-linecap': 'round' });
  var spans = items.map(function (it) {
    return it.b > it.a ? el('path', { d: pathOf(curve(it.a, it.b)), fill: 'none', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 }) : null;
  });
  var dots = items.map(function (it) { var p = at(it.a); return el('circle', { cx: p[0], cy: p[1], r: 2.6, 'stroke-width': 1.2 }); });
  var tag = el('text', { 'font-family': 'IBM Plex Mono, ui-monospace, monospace', 'font-size': 11, 'stroke-width': 3, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });

  /* ---------- Colours ---------- */
  var col = {};
  function css(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function paint() {
    col = { bg: css('--bg'), muted: css('--muted'), rule: css('--rule'), lake: css('--lake'), sun: css('--sun'), event: css('--event') || css('--sun-text') };
    grid.setAttribute('stroke', col.rule);
    frame.setAttribute('stroke', col.muted);
    labels.setAttribute('fill', col.muted);
    ghost.setAttribute('stroke', col.muted);
    line.setAttribute('stroke', col.lake);
    pastCone.setAttribute('fill', col.event); pastCone.setAttribute('fill-opacity', 0.1); pastCone.setAttribute('stroke', col.event);
    ownCone.setAttribute('fill', col.lake); ownCone.setAttribute('fill-opacity', 0.1);
    ownRays.setAttribute('stroke', col.muted);
    tag.setAttribute('fill', col.event); tag.setAttribute('stroke', col.bg);
    spans.forEach(function (s) { if (s) s.setAttribute('stroke', col.event); });
    show(active, true);
  }

  /* ---------- Active entry ---------- */
  var active = -2, hovered = -1;
  function show(k, force) {
    if (k === active && !force) return;
    active = k;
    items.forEach(function (it, j) {
      var on = j === k;
      it.li.classList.toggle('is-active', on);
      dots[j].setAttribute('r', on ? 4.5 : 2.6);
      dots[j].setAttribute('fill', on ? col.event : col.bg);
      dots[j].setAttribute('stroke', on ? col.event : col.lake);
      if (spans[j]) spans[j].setAttribute('opacity', on ? 0.9 : 0);
    });
    if (k < 0) { pastCone.setAttribute('d', ''); tag.textContent = ''; return; }
    var it = items[k], p = at(it.a), L = 2 * W;
    // past cone below the event, future cone above it (null rays at 45 degrees)
    pastCone.setAttribute('d',
      'M' + p[0] + ' ' + p[1] + 'L' + (p[0] - L) + ' ' + (p[1] + L) + 'L' + (p[0] + L) + ' ' + (p[1] + L) + 'Z' +
      'M' + p[0] + ' ' + p[1] + 'L' + (p[0] - L) + ' ' + (p[1] - L) + 'L' + (p[0] + L) + ' ' + (p[1] - L) + 'Z');
    var tx = (p[0] + 10).toFixed(1);
    tag.setAttribute('y', (p[1] + 4).toFixed(1));
    while (tag.firstChild) tag.removeChild(tag.firstChild);
    it.label.split('\n').forEach(function (line, n) {
      el('tspan', { x: tx, dy: n ? 13 : 0 }, tag).textContent = line;
    });
    // keep the active point and its label above the other dots
    svg.appendChild(dots[k]); svg.appendChild(tag);
  }

  // While scrolling: the entry closest to 40% of the window height.
  function fromScroll() {
    if (hovered >= 0) return;
    var vh = window.innerHeight, anchor = vh * 0.4, best = -1, dist = Infinity;
    items.forEach(function (it, j) {
      var r = it.li.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var dd = Math.abs((r.top + r.bottom) / 2 - anchor);
      if (dd < dist) { dist = dd; best = j; }
    });
    show(best);
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; fromScroll(); });
  }, { passive: true });
  window.addEventListener('resize', fromScroll);
  items.forEach(function (it, j) {
    it.li.addEventListener('pointerenter', function () { hovered = j; show(j); });
    it.li.addEventListener('pointerleave', function () { hovered = -1; fromScroll(); });
    it.li.addEventListener('focusin', function () { hovered = j; show(j); });
    it.li.addEventListener('focusout', function () { hovered = -1; fromScroll(); });
  });

  /* ---------- Your own light cone ---------- */
  var trail = [], prev = null, raf = 0, FADE = 1600;
  function toSvg(e) {
    var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function drawCone(p) {
    var L = 2 * W;
    ownCone.setAttribute('d', 'M' + p.x + ' ' + p.y + 'L' + (p.x - L) + ' ' + (p.y - L) + 'L' + (p.x + L) + ' ' + (p.y - L) + 'Z');
    ownRays.setAttribute('d', 'M' + (p.x - L) + ' ' + (p.y - L) + 'L' + (p.x + L) + ' ' + (p.y + L) + 'M' + (p.x + L) + ' ' + (p.y - L) + 'L' + (p.x - L) + ' ' + (p.y + L));
  }
  function drawTrail() {
    var now = performance.now();
    trail = trail.filter(function (s) { return now - s.t < FADE; });
    while (trailG.firstChild) trailG.removeChild(trailG.firstChild);
    trail.forEach(function (s) {
      el('line', {
        x1: s.a.x, y1: s.a.y, x2: s.b.x, y2: s.b.y,
        stroke: s.timelike ? col.lake : col.sun, 'stroke-opacity': (1 - (now - s.t) / FADE).toFixed(2)
      }, trailG);
    });
    raf = trail.length && !reduce.matches ? requestAnimationFrame(drawTrail) : 0;
  }
  svg.addEventListener('pointermove', function (e) {
    var p = toSvg(e); drawCone(p);
    if (prev && Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y) > 3) {
      if (!reduce.matches) {
        trail.push({ a: prev, b: p, t: performance.now(), timelike: Math.abs(p.y - prev.y) > Math.abs(p.x - prev.x) });
        if (!raf) raf = requestAnimationFrame(drawTrail);
      }
      prev = p;
    } else if (!prev) prev = p;
  });
  svg.addEventListener('pointerdown', function (e) { var p = toSvg(e); drawCone(p); prev = p; });
  svg.addEventListener('pointerleave', function () { ownCone.setAttribute('d', ''); ownRays.setAttribute('d', ''); prev = null; });

  /* ---------- Start ---------- */
  document.addEventListener('themechange', paint);
  paint();
  fromScroll();
  if (!reduce.matches && line.getTotalLength) {
    // Draw the worldline in from the past once, when the page opens.
    var len = line.getTotalLength();
    line.style.strokeDasharray = len + ' ' + len;
    line.style.strokeDashoffset = len;
    line.getBoundingClientRect();
    line.style.transition = 'stroke-dashoffset 1.4s ease-out';
    line.style.strokeDashoffset = 0;
    setTimeout(function () { line.style.strokeDasharray = ''; line.style.transition = ''; }, 1600);
  }
})();
