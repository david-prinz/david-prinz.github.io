/* Feynman graph beside the publications.
   Every paper on the page is drawn by the section it is listed under: a preprint is a vertex,
   a journal article a one-loop graph, the dissertation a two-loop graph. Time runs upwards.
   The lines are the citations between the papers (_data/citations.yml):
   - two papers that cite each other share an unoriented boson,
   - when only one cites the other, an oriented line runs from the cited paper to the citing one.
   The particle follows the topics at both ends: gravitons and graviton ghosts between gravity papers,
   gluon ghosts between gauge theory papers, gluons and fermions where gravity and gauge theory meet,
   photons and scalars for everything else.
   Scrolling to a paper, pointing at it or at its vertex marks it: a vertex lights up, and a loop
   contracts to its counterterm. Respects "reduce motion". */
(function () {
  var page = document.querySelector('.pub-page');
  if (!page) return;
  var aside = page.querySelector('.feyn'), prose = page.querySelector('.prose'), dataEl = page.querySelector('.feyn-data');
  if (!aside || !prose || !dataEl) return;
  var data;
  try { data = JSON.parse(dataEl.textContent) || {}; } catch (e) { return; }
  var svg = aside.querySelector('svg'), caption = aside.querySelector('.feyn-caption'), legend = aside.querySelector('.feyn-legend');
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------- Papers, read from the page ---------- */
  var papers = [], kind = 'journal', kids = Array.prototype.slice.call(prose.children);
  kids.forEach(function (n, i) {
    if (n.tagName === 'H2') {
      var h = n.textContent;
      kind = /dissertation|thesis/i.test(h) ? 'thesis' : /preprint/i.test(h) ? 'preprint' : 'journal';
      return;
    }
    if (n.tagName !== 'H3') return;
    // the title and everything up to the next title become one entry
    var box = document.createElement('div');
    box.className = 'pub';
    prose.insertBefore(box, n);
    box.appendChild(n);
    for (var k = i + 1; k < kids.length && !/^(H2|H3|HR)$/.test(kids[k].tagName); k++) box.appendChild(kids[k]);
    var a = box.querySelector('a[href*="arxiv.org/abs/"]');
    var m = a && a.getAttribute('href').match(/arxiv\.org\/abs\/(\d{2})(\d{2})\.(\d{4,5})/);
    if (!m) return;
    var id = m[1] + m[2] + '.' + m[3], info = data[id] || {};
    papers.push({
      el: box, id: id, kind: kind, title: n.textContent.trim(), topic: info.topic || 'other', cites: info.cites || [],
      date: 2000 + +m[1] + (+m[2] - 1) / 12 + +m[3] / 1e7, deg: 0, k: 0, edges: []
    });
  });
  if (papers.length < 2) return;
  aside.hidden = false;
  papers.sort(function (p, q) { return p.date - q.date; });
  var byId = {};
  papers.forEach(function (p, i) { p.i = i; byId[p.id] = p; });

  /* ---------- Citations ---------- */
  function particle(a, b, mutual) {
    var grav = (a.topic === 'gravity') + (b.topic === 'gravity'), gauge = (a.topic === 'gauge') + (b.topic === 'gauge');
    if (mutual) return grav === 2 ? 'graviton' : gauge ? 'gluon' : 'photon';
    return grav === 2 ? 'graviton-ghost' : gauge === 2 ? 'gluon-ghost' : grav && gauge ? 'fermion' : 'scalar';
  }
  var edges = [];
  papers.forEach(function (p) {
    p.cites.forEach(function (id) {
      var q = byId[id];
      if (!q || q === p) return;
      var mutual = q.cites.indexOf(p.id) >= 0;
      if (mutual && q.i > p.i) return;               // draw a mutual pair once
      var e = { a: q, b: p, mutual: mutual, type: particle(q, p, mutual) };   // from cited (or older) to citing
      edges.push(e); p.edges.push(e); q.edges.push(e); p.deg++; q.deg++;
    });
  });

  /* ---------- Layout: time upwards; across, spread by the golden ratio ---------- */
  // Each paper sits a golden-ratio step to the side of the one before it, so papers close in time
  // (which often cite each other) are far apart sideways, and the older papers keep their places
  // when a new one is added on top.
  var VW = 240, S = 30, TOP = 22, BOT = 18, VH = TOP + BOT + (papers.length - 1) * S, XL = 46, XR = VW - 16;
  svg.setAttribute('viewBox', '0 0 ' + VW + ' ' + VH);
  papers.forEach(function (p) {
    var f = (0.5 + p.i * 0.6180339887) % 1;
    p.x = XL + (XR - XL) * f;
    p.y = VH - BOT - p.i * S;
  });
  var R = { preprint: 3.4, journal: 7.5, thesis: 7.5 * Math.SQRT2 }, CT = 5.2;   // the two-loop graph has twice the area
  function reach(p) {                                 // where lines end, as the loop contracts
    if (p.kind === 'preprint') return R.preprint + 1.2 + 1.4 * p.k;
    return R[p.kind] + (CT + 1 - R[p.kind]) * p.k;
  }

  /* ---------- Particle lines ---------- */
  function track(pts) {
    var cum = [0];
    for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return {
      len: cum[cum.length - 1],
      at: function (s) {
        var i = 1;
        while (i < cum.length - 1 && cum[i] < s) i++;
        var seg = cum[i] - cum[i - 1] || 1, f = Math.max(0, Math.min(1, (s - cum[i - 1]) / seg));
        var p0 = pts[i - 1], p1 = pts[i], tx = (p1[0] - p0[0]) / seg, ty = (p1[1] - p0[1]) / seg;
        return { x: p0[0] + (p1[0] - p0[0]) * f, y: p0[1] + (p1[1] - p0[1]) * f, tx: tx, ty: ty };
      }
    };
  }
  function fmt(x, y) { return x.toFixed(1) + ' ' + y.toFixed(1); }
  // a line beside the track at a fixed offset, optionally waving (photon, graviton)
  function along(tr, s0, s1, off, amp, waveLen) {
    var len = s1 - s0, n = waveLen ? Math.max(1, Math.round(len / waveLen)) : 0, d = '';
    for (var s = s0, first = true; ; s += 0.7) {
      if (s > s1) s = s1;
      var q = tr.at(s), o = off + (n ? amp * Math.sin(2 * Math.PI * n * (s - s0) / len) : 0);
      d += (first ? 'M' : 'L') + fmt(q.x - q.ty * o, q.y + q.tx * o);
      first = false;
      if (s === s1) break;
    }
    return d;
  }
  // a coiled line (gluon)
  function coil(tr, s0, s1, r) {
    var len = s1 - s0, n = Math.max(2, Math.round(len / 5)), d = '';
    for (var th = 0; ; th += 0.3) {
      if (th > 2 * Math.PI * n) th = 2 * Math.PI * n;
      var q = tr.at(s0 + len * th / (2 * Math.PI * n)), u = r * Math.sin(th), v = -r * (1 - Math.cos(th));
      d += (th ? 'L' : 'M') + fmt(q.x - q.ty * u + q.tx * v, q.y + q.tx * u + q.ty * v);
      if (th === 2 * Math.PI * n) break;
    }
    return d;
  }
  function arrow(tr, s) {
    var q = tr.at(s);
    return 'M' + fmt(q.x + q.tx * 3, q.y + q.ty * 3) +
      'L' + fmt(q.x - q.tx * 2 - q.ty * 2.4, q.y - q.ty * 2 + q.tx * 2.4) +
      'L' + fmt(q.x - q.tx * 2 + q.ty * 2.4, q.y - q.ty * 2 - q.tx * 2.4) + 'Z';
  }
  // draw one particle type along a track into a group (also used for the legend)
  function drawParticle(g, type, tr, s0, s1) {
    while (g.firstChild) g.removeChild(g.firstChild);
    var dots = { 'stroke-dasharray': '0.1 2.6', 'stroke-linecap': 'round', 'stroke-width': 1.3 };
    if (type === 'photon') el('path', { d: along(tr, s0, s1, 0, 2, 6) }, g);
    else if (type === 'graviton') { el('path', { d: along(tr, s0, s1, -1, 2, 6.5) }, g); el('path', { d: along(tr, s0, s1, 1, 2, 6.5) }, g); }
    else if (type === 'gluon') el('path', { d: coil(tr, s0, s1, 2.4) }, g);
    else if (type === 'fermion') el('path', { d: along(tr, s0, s1, 0) }, g);
    else if (type === 'scalar') el('path', { d: along(tr, s0, s1, 0), 'stroke-dasharray': '3.5 2.5' }, g);
    else if (type === 'gluon-ghost') el('path', Object.assign({ d: along(tr, s0, s1, 0) }, dots), g);
    else if (type === 'graviton-ghost') {
      el('path', Object.assign({ d: along(tr, s0, s1, -1.2) }, dots), g);
      el('path', Object.assign({ d: along(tr, s0, s1, 1.2) }, dots), g);
    }
    if (/fermion|scalar|ghost/.test(type)) el('path', { class: 'arrow', d: arrow(tr, (s0 + s1) / 2) }, g);
  }

  var edgeLayer = el('g', {}, svg), nodeLayer = el('g', {}, svg);
  edges.forEach(function (e, n) {
    e.g = el('g', { class: 'edge' }, edgeLayer);
    var a = e.a, b = e.b, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    // bend each line a little (alternating, or outwards for nearly vertical lines), so lines rarely overlap
    var side = Math.abs(dx) < 24 ? ((a.x + b.x) / 2 < (XL + XR) / 2 ? -1 : 1) : (n % 2 ? 1 : -1);   // near-vertical: bend outwards
    var bend = side * Math.max(5, Math.min(24, L * 0.1)) * (dy < 0 ? 1 : -1);
    var cx = (a.x + b.x) / 2 - dy / L * bend, cy = (a.y + b.y) / 2 + dx / L * bend, pts = [];
    for (var i = 0; i <= 48; i++) {
      var t = i / 48, u = 1 - t;
      pts.push([u * u * a.x + 2 * u * t * cx + t * t * b.x, u * u * a.y + 2 * u * t * cy + t * t * b.y]);
    }
    e.tr = track(pts);
  });
  function drawEdge(e) { drawParticle(e.g, e.type, e.tr, reach(e.a), e.tr.len - reach(e.b)); }
  edges.forEach(drawEdge);

  /* ---------- Vertices and loops ---------- */
  var years = el('g', { class: 'years' }, nodeLayer), lastYear = '';
  papers.forEach(function (p) {
    var y = String(Math.floor(p.date));
    if (y !== lastYear) { el('text', { x: 0, y: p.y + 3 }, years).textContent = y; lastYear = y; }
  });
  function ct(g) {                                    // counterterm: a crossed circle
    var c = el('g', { class: 'ct', opacity: 0 }, g);
    el('circle', { cx: 0, cy: 0, r: CT }, c);
    var d = CT * 0.7;
    el('path', { d: 'M' + -d + ' ' + -d + 'L' + d + ' ' + d + 'M' + d + ' ' + -d + 'L' + -d + ' ' + d }, c);
    return c;
  }
  papers.forEach(function (p) {
    var g = p.g = el('g', { class: 'node' }, nodeLayer);
    if (p.kind === 'preprint') {
      if (!p.deg) {                                   // no lines: a vacuum bubble, the figure eight
        el('circle', { class: 'bubble', cx: p.x - 5.5, cy: p.y, r: 5.5 }, g);
        el('circle', { class: 'bubble', cx: p.x + 5.5, cy: p.y, r: 5.5 }, g);
      }
      p.dot = el('circle', { class: 'dot', cx: p.x, cy: p.y, r: R.preprint }, g);
    } else {
      p.loop = el('g', {}, g);
      el('circle', { class: 'ring', cx: 0, cy: 0, r: R[p.kind] }, p.loop);
      if (p.kind === 'thesis') el('path', { class: 'ring', d: 'M' + -R.thesis + ' 0H' + R.thesis }, p.loop);
      p.ct = ct(g);
    }
    p.hit = el('circle', { class: 'hit', cx: p.x, cy: p.y, r: 13 }, g);
    place(p);
  });
  function place(p) {
    if (p.dot) { p.dot.setAttribute('r', (R.preprint + 1.4 * p.k).toFixed(2)); return; }
    var s = Math.max(0.001, 1 - p.k);
    p.loop.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') scale(' + s.toFixed(3) + ')');
    p.ct.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') scale(' + Math.max(0.001, p.k).toFixed(3) + ')');
    p.ct.setAttribute('opacity', Math.min(1, p.k * 1.5).toFixed(2));
  }

  /* ---------- Legend ---------- */
  if (legend) {
    ['graviton', 'gluon', 'photon', 'fermion', 'scalar', 'gluon-ghost', 'graviton-ghost'].forEach(function (type) {
      var used = edges.some(function (e) { return e.type === type; });
      if (!used) return;
      var key = document.createElement('span'), s = el('svg', { width: 24, height: 10, viewBox: '0 -5 24 10', 'aria-hidden': 'true' });
      key.className = 'feyn-key';
      drawParticle(el('g', {}, s), type, track([[0, 0], [24, 0]]), 0, 24);
      key.appendChild(s);
      key.appendChild(document.createTextNode(type.replace('-', ' ')));
      legend.appendChild(key);
    });
  }

  /* ---------- Active paper ---------- */
  var active = -2, hovered = -1, raf = 0, last = 0;
  function show(i) {
    if (i === active) return;
    active = i;
    svg.classList.toggle('has-active', i >= 0);
    papers.forEach(function (p) {
      var on = p.i === i;
      p.el.classList.toggle('is-active', on);
      p.g.classList.toggle('is-active', on);
    });
    edges.forEach(function (e) { e.g.classList.toggle('is-hot', e.a.i === i || e.b.i === i); });
    if (caption) caption.textContent = i >= 0 ? papers[i].title : '';
    if (reduce.matches) { papers.forEach(function (p) { p.k = p.i === i ? 1 : 0; place(p); }); edges.forEach(drawEdge); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
  }
  // contract the active loop to its counterterm (and let the previous one grow back)
  function step(now) {
    var dt = Math.min(64, now - last), moving = false, changed = [];
    last = now;
    papers.forEach(function (p) {
      var target = p.i === active ? 1 : 0;
      if (p.k === target) return;
      p.k = target > p.k ? Math.min(1, p.k + dt / 260) : Math.max(0, p.k - dt / 260);
      place(p); changed.push(p);
      if (p.k !== target) moving = true;
    });
    changed.forEach(function (p) { p.edges.forEach(drawEdge); });
    raf = moving ? requestAnimationFrame(step) : 0;
  }

  // While scrolling: the paper closest to 40% of the window height.
  function fromScroll() {
    if (hovered >= 0) return;
    var vh = window.innerHeight, anchor = vh * 0.4, best = -1, dist = Infinity;
    papers.forEach(function (p) {
      var r = p.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var d = Math.abs((r.top + r.bottom) / 2 - anchor);
      if (d < dist) { dist = d; best = p.i; }
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
  papers.forEach(function (p) {
    function enter() { hovered = p.i; show(p.i); }
    function leave() { hovered = -1; fromScroll(); }
    p.el.addEventListener('pointerenter', enter);
    p.el.addEventListener('pointerleave', leave);
    p.el.addEventListener('focusin', enter);
    p.el.addEventListener('focusout', leave);
    p.hit.addEventListener('pointerenter', enter);
    p.hit.addEventListener('pointerleave', leave);
    p.hit.addEventListener('click', function () {      // bring the paper into view
      p.el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' });
    });
  });
  fromScroll();
})();
