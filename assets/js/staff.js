/* A staff above the Music page, in 13/8, written by the visitor's pointer.
   New notes form at the pen just right of the treble clef and the time signature, and the whole line
   drifts slowly to the right, so the newest note stands on the left and the line reads as a retrograde.
   The height of the pointer in the window sets the pitch (C4 at the bottom to A5 at the top). While the
   pointer stays at one height the note grows, from an eighth to a quarter, a dotted quarter, a half and
   on, tied over the bar lines. A click gives a staccato eighth, and while the pointer is away from the
   page the staff rests. The eighths of a bar are beamed in groups of 3+3+3+2+2.
   With "reduce motion" the staff shows one still bar instead. Pauses while the tab is hidden.
   Glyph outlines: Bravura music font, (c) Steinberg Media Technologies GmbH,
   SIL Open Font License 1.1 (https://openfontlicense.org). */
(function () {
  var band = document.querySelector('.staff-band');
  if (!band || typeof Path2D === 'undefined') return;
  var cv = band.querySelector('canvas');
  var ctx = cv.getContext('2d'), root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  band.hidden = false;

  /* ---------- Glyphs, in staff spaces, origin as in SMuFL ---------- */
  var G = {
    gClef: 'M1.456 1.008C1.547 1.008 1.653 1 1.733 .983C1.775 .975 1.783 .972 1.792 1.019C1.839 1.289 1.9 1.636 1.9 1.825C1.9 2.417 1.5 2.489 1.264 2.489C1.047 2.489 .944 2.425 .944 2.372C.944 2.344 .981 2.333 1.072 2.303C1.197 2.267 1.339 2.161 1.339 1.928C1.339 1.708 1.2 1.519 .956 1.519C.689 1.519 .528 1.733 .528 1.981C.528 2.239 .683 2.633 1.289 2.633C1.556 2.633 2.075 2.511 2.075 1.833C2.075 1.603 2.003 1.225 1.961 .975C1.953 .928 1.956 .933 2.011 .908C2.417 .747 2.683 .408 2.683 -.044C2.683 -.556 2.308 -1.008 1.719 -1.008C1.617 -1.008 1.617 -1.008 1.603 -1.081L1.503 -1.661C1.497 -1.708 1.503 -1.711 1.528 -1.736C1.961 -2.139 2.289 -2.647 2.289 -3.261C2.289 -3.608 2.192 -3.953 2.028 -4.192C1.967 -4.281 1.864 -4.392 1.819 -4.392C1.764 -4.392 1.639 -4.289 1.561 -4.2C1.264 -3.872 1.167 -3.372 1.167 -2.956C1.167 -2.725 1.197 -2.464 1.225 -2.3C1.233 -2.253 1.236 -2.244 1.189 -2.203C.611 -1.728 0 -1.156 0 -.347C0 .347 .475 1.008 1.456 1.008ZM.319 -.081C.319 -.317 .361 -.633 .692 -1.008C.933 -1.275 1.117 -1.425 1.303 -1.575C1.344 -1.608 1.353 -1.603 1.361 -1.561L1.444 -1.047C1.456 -.972 1.456 -.975 1.383 -.953C1.033 -.833 .803 -.517 .803 -.175C.803 .183 .992 .439 1.264 .533C1.297 .544 1.344 .556 1.372 .556C1.403 .556 1.419 .536 1.419 .511C1.419 .483 1.389 .472 1.361 .461C1.192 .389 1.072 .217 1.072 .033C1.072 -.197 1.228 -.367 1.472 -.436C1.536 -.453 1.544 -.447 1.553 -.403L1.753 .789C1.761 .833 1.756 .833 1.697 .844C1.633 .856 1.553 .864 1.472 .864C.772 .864 .319 .475 .319 -.081ZM1.881 -3.772C2.011 -3.772 2.119 -3.664 2.119 -3.444C2.119 -3 1.739 -2.639 1.425 -2.364C1.397 -2.339 1.381 -2.344 1.372 -2.397C1.356 -2.5 1.347 -2.636 1.347 -2.764C1.347 -3.389 1.636 -3.772 1.881 -3.772ZM1.764 -.467C2.089 -.439 2.356 -.167 2.356 .183C2.356 .436 2.203 .639 1.981 .753C1.933 .775 1.925 .775 1.917 .728L1.719 -.411C1.711 -.461 1.717 -.472 1.764 -.467Z',
    noteheadBlack: 'M0 .167C0 .375 .172 .5 .389 .5C.744 .5 1.181 .172 1.181 -.167C1.181 -.372 1.019 -.5 .792 -.5C.353 -.5 0 -.175 0 .167Z',
    noteheadHalf: 'M.389 .5C1.047 .5 1.181 -.036 1.181 -.167C1.181 -.372 1.017 -.5 .783 -.5C.189 -.5 0 -.039 0 .167C0 .381 .167 .5 .389 .5ZM.117 .175C.117 -.019 .697 -.336 .883 -.336C.961 -.336 1.003 -.3 1.033 -.253C1.044 -.228 1.056 -.203 1.056 -.175C1.056 -.003 .492 .347 .3 .347C.217 .347 .167 .303 .139 .256C.128 .233 .117 .203 .117 .175Z',
    noteheadWhole: 'M0 -.008C0 .261 .228 .5 .825 .5C1.481 .5 1.689 .272 1.689 -.008C1.689 -.292 1.236 -.5 .864 -.5C.333 -.5 0 -.281 0 -.008ZM.433 -.156C.433 -.189 .436 -.219 .444 -.253C.489 -.392 .636 -.411 .761 -.411C1.036 -.411 1.256 -.117 1.256 .125C1.256 .247 1.203 .361 1.072 .392C1.033 .403 .989 .408 .947 .408C.803 .408 .656 .311 .572 .2C.492 .108 .433 -.028 .433 -.156Z',
    flag8thUp: 'M.789 1.911C.847 2.047 .883 2.275 .883 2.511C.883 2.692 .856 2.881 .789 3.061C.781 3.083 .775 3.103 .775 3.119C.775 3.183 .817 3.219 .839 3.236C.864 3.253 .933 3.228 .953 3.161C.953 3.161 1.056 2.781 1.056 2.467C1.056 1.967 .847 1.497 .597 1.097C.392 .781 .225 .436 .161 .053C.147 -.011 .117 -.036 .039 -.036C.017 -.036 0 -.025 0 .025L0 .981C.264 1.028 .644 1.572 .789 1.911Z',
    flag8thDown: 'M.044 .056C.119 .056 .153 .033 .161 -.033C.228 -.411 .525 -.761 .728 -1.075C.981 -1.472 1.225 -1.947 1.225 -2.447C1.225 -2.761 1.144 -3.044 1.111 -3.172C1.1 -3.217 1.075 -3.233 1.047 -3.233C.989 -3.233 .919 -3.156 .961 -3.039C1.017 -2.872 1.044 -2.672 1.044 -2.492C1.044 -2.256 .944 -1.919 .883 -1.783C.736 -1.447 .536 -1.125 0 -.944L0 -.003C0 .044 .019 .056 .044 .056Z',
    restWhole: 'M.103 .539L1.025 .539C1.081 .539 1.128 .492 1.128 .436L1.128 .067C1.128 .008 1.081 -.036 1.025 -.036L.103 -.036C.044 -.036 0 .008 0 .067L0 .436C0 .492 .044 .539 .103 .539Z',
    restHalf: 'M.103 .008L1.025 .008C1.081 .008 1.128 -.039 1.128 -.097L1.128 -.464C1.128 -.525 1.081 -.567 1.025 -.567L.103 -.567C.044 -.567 0 -.525 0 -.464L0 -.097C0 -.039 .044 .008 .103 .008Z',
    restQuarter: 'M.467 1.464C.5 1.489 .539 1.5 .572 1.5C.6 1.5 .628 1.492 .633 1.475C.636 1.464 .639 1.456 .639 1.447C.639 1.411 .608 1.381 .575 1.353C.525 1.353 .481 1.244 .472 1.208C.461 1.175 .456 1.139 .456 1.103C.456 .939 .539 .811 .708 .811C.825 .811 .956 .856 1.019 .881C1.025 .881 1.028 .883 1.033 .883C1.044 .889 1.053 .889 1.061 .889C1.072 .889 1.081 .883 1.081 .872C1.081 .825 .975 .692 .933 .644C.781 .461 .656 .311 .656 .089C.656 .072 .661 .053 .661 .036C.675 -.197 .819 -.389 .925 -.553C.936 -.572 .939 -.592 .939 -.611C.939 -.653 .925 -.689 .925 -.689C.925 -.689 .333 -1.392 .264 -1.461C.244 -1.481 .217 -1.492 .192 -1.492C.153 -1.492 .111 -1.464 .111 -1.408C.111 -1.389 .117 -1.367 .128 -1.344C.144 -1.3 .372 -1.097 .372 -.808C.372 -.661 .311 -.489 .133 -.3C.092 -.261 .075 -.217 .075 -.183C.075 -.128 .117 -.089 .117 -.089L.311 .153C.375 .233 .433 .308 .483 .392C.492 .408 .508 .439 .508 .447C.508 .453 .508 .461 .503 .464C.497 .481 .481 .483 .461 .483C.444 .483 .411 .475 .397 .472C.375 .472 .353 .461 .333 .461C.161 .461 .003 .633 .003 .844C.003 1.044 .175 1.239 .467 1.464Z',
    rest8th: 'M.108 -.225C.172 -.181 .247 -.156 .325 -.156C.381 -.156 .436 -.167 .481 -.183C.536 -.2 .572 -.217 .625 -.244C.633 -.247 .639 -.247 .644 -.247C.661 -.247 .664 -.233 .664 -.211C.664 -.2 .664 -.183 .661 -.167C.647 -.108 .361 .689 .289 .953C.289 1 .381 1.003 .403 1.003C.447 1.003 .503 .997 .544 .964C.556 .956 .947 -.447 .947 -.447C.964 -.519 .983 -.583 .989 -.603C.989 -.644 .947 -.664 .939 -.667C.933 -.667 .919 -.667 .897 -.653C.867 -.628 .667 -.389 .536 -.389L.536 -.428C.536 -.575 .417 -.697 .267 -.697C.119 -.697 0 -.575 0 -.428C0 -.344 .047 -.272 .108 -.225Z',
    timeSig1: 'M.081 0C.081 .019 .092 .044 .125 .056C.139 .061 .156 .064 .161 .064C.2 .064 .217 .028 .217 .028C.217 .028 .389 -.247 .433 -.325C.447 -.353 .464 -.364 .472 -.364C.489 -.364 .497 -.333 .497 -.308L.497 .725C.497 .817 .403 .875 .319 .875C.292 .875 .253 .889 .253 .936C.253 .981 .289 1 .339 1L1.192 1C1.256 1 1.256 .936 1.256 .936C1.256 .936 1.256 .875 1.197 .875C1.139 .875 1.067 .803 1.067 .736L1.067 -.911C1.067 -.975 1.044 -1 .989 -1.003C.933 -1.003 .833 -.989 .781 -.989C.703 -.989 .633 -.992 .572 -1C.564 -1 .556 -1.003 .553 -1.003C.511 -1.003 .497 -.964 .481 -.928L.097 -.053C.097 -.053 .081 -.028 .081 0Z',
    timeSig3: 'M.081 .564C.089 .875 .372 .997 .764 1.003L.8 1.003C1.197 1.003 1.603 .8 1.603 .447L1.603 .419C1.597 .303 1.567 .228 1.492 .139C1.467 .108 1.436 .081 1.397 .056L1.311 .008L1.181 -.028C1.161 -.033 1.147 -.033 1.139 -.047C1.136 -.056 1.136 -.061 1.136 -.067C1.136 -.083 1.139 -.1 1.153 -.103C1.197 -.117 1.239 -.119 1.275 -.139C1.436 -.217 1.519 -.319 1.519 -.503C1.519 -.872 1.019 -.981 .853 -.992C.833 -.992 .811 -.997 .792 -.997C.447 -.997 .103 -.767 .103 -.556C.103 -.425 .181 -.247 .428 -.233L.447 -.233C.625 -.233 .711 -.361 .711 -.492L.711 -.525C.7 -.672 .6 -.681 .581 -.689C.561 -.697 .5 -.689 .5 -.744L.5 -.761C.508 -.828 .633 -.861 .667 -.861C1.008 -.861 1.039 -.647 1.039 -.553L1.039 -.525C1.039 -.228 .803 -.111 .553 -.1C.511 -.097 .456 -.075 .456 -.033C.456 .017 .525 .017 .556 .017C1.017 .017 1.053 .328 1.053 .381C1.053 .803 .836 .853 .747 .853C.733 .853 .717 .847 .711 .847C.681 .844 .603 .844 .6 .783L.6 .764C.6 .675 .689 .617 .692 .5C.692 .333 .575 .211 .403 .211C.389 .211 .375 .211 .361 .217C.292 .228 .217 .267 .167 .319C.1 .381 .081 .475 .081 .564Z',
    timeSig8: 'M.081 .528C.081 .875 .439 1.036 .836 1.036C1.236 1.036 1.664 .864 1.664 .325C1.664 .083 1.525 -.047 1.336 -.144C1.481 -.236 1.575 -.367 1.575 -.567C1.575 -.975 .989 -1.036 .881 -1.036C.417 -1.036 .1 -.825 .1 -.489C.1 -.211 .256 -.064 .447 .044C.239 .144 .081 .275 .081 .528ZM.308 .508C.308 .347 .447 .2 .625 .133C.917 .261 1.211 .344 1.211 .608C1.211 .767 1.089 .903 .819 .903C.553 .903 .308 .767 .308 .508ZM.872 -.919C1 -.919 1.339 -.856 1.339 -.575C1.339 -.417 1.261 -.311 1.128 -.236C.808 -.347 .467 -.417 .467 -.667C.467 -.836 .697 -.919 .872 -.919Z'
  }, P = {};
  for (var k in G) P[k] = new Path2D(G[k]);

  /* ---------- Metre: 13/8, eighths grouped 3+3+3+2+2 ---------- */
  var BAR = 13, GROUPS = [3, 6, 9, 11, 13], T8 = 0.5;          // seconds per eighth
  function group(slot) {
    var bar = Math.floor(slot / BAR), o = slot - bar * BAR, g = 0;
    while (o >= GROUPS[g]) g++;
    return bar * 8 + g;
  }

  /* ---------- What has been written: events of whole eighths ---------- */
  // {rest, s: staff step (0 = bottom line E4, 2 = G4, 4 = B4, ... 10 = A5), st: staccato, a: first slot, n: slots}
  var events, clock;
  function silence() {                                 // start with bars of rest, the line moves on from slot 0
    events = [{ rest: true, s: 4, st: false, a: -8 * BAR, n: 8 * BAR }];
    clock = 0;
  }
  function same(e, w) { return e.rest === w.rest && (e.rest || (e.s === w.s && !e.st && !w.st)); }
  // the current slot k gets what the pointer does now; earlier slots stay as they were written
  function write(k, w) {
    var e = events[events.length - 1];
    if (e.a + e.n - 1 === k) {
      if (e.a === k) {                                 // a note or rest of this slot only: rewrite it
        e.rest = w.rest; e.s = w.s; e.st = w.st;
        var d = events[events.length - 2];
        if (d && d.a + d.n === k && same(d, w)) { d.n++; events.pop(); }
        return;
      }
      if (same(e, w)) return;
      e.n--;                                           // the pointer changed: the old note ends before this slot
    } else if (e.a + e.n === k && same(e, w)) { e.n++; return; }
    events.push({ rest: w.rest, s: w.s, st: w.st, a: k, n: 1 });
  }

  /* ---------- The pointer ---------- */
  var ptr = { on: false, s: 4 }, click = { slot: -1, s: 4 };
  function step(y) { return Math.max(-2, Math.min(10, 10 - Math.floor(y / window.innerHeight * 13))); }
  function wanted(k) {
    if (click.slot === k) return { rest: false, s: click.s, st: true };
    return ptr.on ? { rest: false, s: ptr.s, st: false } : { rest: true, s: 4, st: false };
  }
  function move(e) { ptr.on = true; ptr.s = step(e.clientY); }
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', move, { passive: true });
  window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') ptr.on = false; }, { passive: true });
  window.addEventListener('pointercancel', function () { ptr.on = false; }, { passive: true });
  document.addEventListener('pointerout', function (e) { if (!e.relatedTarget) ptr.on = false; });
  window.addEventListener('blur', function () { ptr.on = false; });
  window.addEventListener('click', function (e) {
    if (!e.detail || reduce.matches) return;           // keyboard "clicks" carry no position
    click.slot = Math.floor(clock); click.s = step(e.clientY);
  });

  /* ---------- Geometry ---------- */
  var W = 0, H = 0, sp = 10, dpr = 1, yB = 0, w = 20, gap = 12, clefX = 0, tsX = 0, pen = 0, col = {};
  function Y(s) { return yB - s * sp / 2; }
  // centre of an eighth slot; a new note is born at the pen. Every bar line between the slot and the pen
  // adds a little space, which opens while the last eighth of its bar is being written.
  function X(slot) {
    var bc = Math.floor(clock / BAR), n = Math.max(0, bc - Math.floor(slot / BAR));
    n += Math.max(0, Math.min(1, clock + 1 - (bc + 1) * BAR));
    return pen + (clock - slot) * w + n * gap;
  }
  function css(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
  function readColors() {
    col = { fg: css('--fg'), muted: css('--muted'), lake: css('--lake'), sun: css('--sun'), event: css('--event') };
  }
  function resize() {
    W = band.clientWidth;
    if (!W) return;
    sp = W < 600 ? 8 : 10;
    H = Math.round(14 * sp);          // room for long stems and beams above and below the staff
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.style.height = H + 'px';
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    yB = 8.75 * sp;
    w = 2 * sp; gap = 1.2 * sp;
    var page = document.querySelector('main .page'), left = 20;      // the clef lines up with the text
    if (page) left = page.getBoundingClientRect().left - band.getBoundingClientRect().left + parseFloat(getComputedStyle(page).paddingLeft);
    clefX = left;
    tsX = clefX + 3.3 * sp;
    pen = tsX + 2.9 * sp + 1.7 * sp;
    draw();
  }

  /* ---------- Engraving ---------- */
  var NOTE = [8, 6, 4, 3, 2, 1], REST = [6, 4, 3, 2, 1];
  // split an event at the bar lines and into single glyphs, in time order
  function pieces(e) {
    var out = [], a = e.a, end = e.a + e.n;
    while (a < end) {
      var b = Math.min(end, (Math.floor(a / BAR) + 1) * BAR), L = b - a;
      if (e.rest && L === BAR) { out.push({ a: a, n: BAR, whole: true }); a = b; continue; }
      var lens = e.rest ? REST : NOTE;
      while (L > 0) {
        for (var i = 0; lens[i] > L; i++);
        out.push({ a: a, n: lens[i] }); a += lens[i]; L -= lens[i];
      }
    }
    return out;
  }
  function glyph(name, x, y, c) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sp, sp); ctx.fillStyle = c; ctx.fill(P[name]); ctx.restore();
  }
  function dot(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r * sp, 0, 2 * Math.PI); ctx.fill(); }
  function bar(x, y, wd, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, wd, h); }
  function stemX(p) { return p.up ? p.x + 0.59 * sp - 0.06 * sp : p.x - 0.59 * sp + 0.06 * sp; }

  function draw() {
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var kNow = Math.floor(clock), lt = Math.max(1, 0.13 * sp);

    // staff and bar lines
    ctx.globalAlpha = 0.5;
    for (var l = 0; l <= 8; l += 2) bar(clefX - 0.6 * sp, Y(l) - lt / 2, W, lt, col.muted);
    ctx.globalAlpha = 0.75;
    for (var b = Math.floor(kNow / BAR) * BAR; ; b -= BAR) {
      var xb = (X(b) + X(b - 1)) / 2;
      if (xb > W + w) break;
      bar(xb - 0.08 * sp, Y(8) - lt / 2, 0.16 * sp, 4 * sp + lt, col.muted);
    }
    ctx.globalAlpha = 0.9;
    glyph('gClef', clefX, Y(2), col.fg);
    glyph('timeSig1', tsX, Y(6), col.fg);
    glyph('timeSig3', tsX + 1.4 * sp, Y(6), col.fg);
    glyph('timeSig8', tsX + 0.7 * sp, Y(2), col.fg);
    ctx.globalAlpha = 1;

    // everything written, as glyphs
    var parts = [], lo = -3 * w, hi = W + 14 * w;
    events.forEach(function (e, i) {
      var cur = i === events.length - 1 && e.a + e.n > kNow;
      var ps = pieces(e);
      ps.forEach(function (p, j) {
        p.rest = e.rest; p.s = e.s; p.st = e.st; p.cur = cur; p.tie = !e.rest && ps[j + 1];
        p.x = X(p.a); p.up = p.s < 4;
        parts.push(p);
      });
    });

    // beams: consecutive eighths inside one group of the bar
    var groups = [], g = null;
    parts.forEach(function (p) {
      if (p.rest || p.n !== 1) { g = null; return; }
      if (g && g[g.length - 1].a === p.a - 1 && group(p.a) === group(g[0].a)) g.push(p);
      else { g = [p]; groups.push(g); }
    });
    groups.forEach(function (g) {
      if (g.length < 2) return;
      var top = -9, bot = 99;
      g.forEach(function (p) { top = Math.max(top, p.s); bot = Math.min(bot, p.s); });
      var up = top - 4 < 4 - bot;                       // the note farthest from the middle line decides
      g.forEach(function (p) { p.up = up; p.beam = g; p.sx = stemX(p); });
      var f = g[0], z = g[g.length - 1], dx = z.sx - f.sx;
      var rise = Math.max(-sp, Math.min(sp, (Y(z.s) - Y(f.s)) / 2)), m = rise / dx, c = up ? 1e9 : -1e9;
      g.forEach(function (p) {
        var v = Y(p.s) + (up ? -3 : 3) * sp - m * (p.sx - f.sx);
        c = up ? Math.min(c, v) : Math.max(c, v);
      });
      g.forEach(function (p) { p.end = c + m * (p.sx - f.sx); });
      g.m = m; g.c = c; g.up = up;
    });

    parts.forEach(function (p) {
      if (p.x < lo || p.x > hi) return;
      if (p.rest) {
        if (p.whole) { glyph('restWhole', X(p.a + 6) - 0.565 * sp, Y(6), col.muted); return; }
        var name = p.n === 1 ? 'rest8th' : p.n < 4 ? 'restQuarter' : 'restHalf', gw = p.n === 1 ? 0.99 : p.n < 4 ? 1.08 : 1.13;
        glyph(name, p.x - gw / 2 * sp, Y(4), col.muted);
        if (p.n === 3 || p.n === 6) dot(p.x + gw / 2 * sp + 0.35 * sp, Y(5), 0.2, col.muted);
        return;
      }
      var c = p.cur ? col.event : col.lake, y = Y(p.s), lw = 0.16 * sp;
      // ledger lines
      for (var l = -2; l >= p.s; l -= 2) bar(p.x - 1.0 * sp, Y(l) - lw / 2, 2.0 * sp, lw, c);
      for (l = 10; l <= p.s; l += 2) bar(p.x - 1.0 * sp, Y(l) - lw / 2, 2.0 * sp, lw, c);
      // head, stem and flag
      if (p.n === 8) glyph('noteheadWhole', p.x - 0.845 * sp, y, c);
      else {
        glyph(p.n >= 4 ? 'noteheadHalf' : 'noteheadBlack', p.x - 0.59 * sp, y, c);
        var sx = stemX(p), y0 = y + (p.up ? -0.17 : 0.17) * sp, y1 = p.beam ? p.end : y + (p.up ? -3.5 : 3.5) * sp;
        bar(sx - 0.06 * sp, Math.min(y0, y1), 0.12 * sp, Math.abs(y1 - y0), c);
        if (p.n === 1 && !p.beam) glyph(p.up ? 'flag8thUp' : 'flag8thDown', sx - 0.06 * sp, y1, c);
      }
      // augmentation dot, in the space above a note on a line
      if (p.n === 3 || p.n === 6) dot(p.x + 0.99 * sp, Y(p.s % 2 ? p.s : p.s + 1), 0.2, c);
      // staccato: opposite the stem, in a space
      if (p.st) {
        var off = (p.s % 2 ? 2 : 3) * (p.up ? -1 : 1);
        dot(p.x, Y(p.s + off), 0.21, col.sun);
      }
      // tie to the next piece of the same note (it is later in time, so it stands to the left)
      if (p.tie) {
        var q = p.tie.x, dir = p.up ? 1 : -1, yt = y + dir * 0.55 * sp;
        var x1 = q + 0.75 * sp, x2 = p.x - 0.75 * sp, h = Math.min(0.9 * sp, (x2 - x1) * 0.2) * dir, t = 0.16 * sp * dir;
        ctx.fillStyle = c; ctx.beginPath();
        ctx.moveTo(x1, yt); ctx.quadraticCurveTo((x1 + x2) / 2, yt + 2 * h, x2, yt);
        ctx.quadraticCurveTo((x1 + x2) / 2, yt + 2 * h - 2 * t, x1, yt); ctx.fill();
      }
    });
    groups.forEach(function (g) {
      if (g.length < 2) return;
      var f = g[0], z = g[g.length - 1], T = (g.up ? 0.5 : -0.5) * sp, e = 0.06 * sp * (z.sx > f.sx ? 1 : -1);
      ctx.fillStyle = col.lake; ctx.beginPath();
      ctx.moveTo(f.sx - e, g.c - g.m * e); ctx.lineTo(z.sx + e, z.end + g.m * e);
      ctx.lineTo(z.sx + e, z.end + g.m * e + T); ctx.lineTo(f.sx - e, g.c - g.m * e + T); ctx.fill();
    });

    // the line fades out on the right
    var fw = Math.min(140, W * 0.15), gr = ctx.createLinearGradient(W - fw, 0, W, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = gr; ctx.fillRect(W - fw, 0, fw, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- Running ---------- */
  var running = false, last = 0;
  function prune() {
    while (events.length > 1 && X(events[0].a + events[0].n - 1) > W + 3 * w) events.shift();
  }
  function frame(now) {
    if (document.hidden || reduce.matches) { running = false; return; }
    var dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    clock += dt / T8;
    var k = Math.floor(clock);
    write(k, wanted(k));
    prune();
    draw();
    requestAnimationFrame(frame);
  }
  function kick() { if (!running && !document.hidden && !reduce.matches) { running = true; last = 0; requestAnimationFrame(frame); } }

  // with reduced motion: one still bar, 3+3+3+2+2
  function still() {
    silence();
    var tune = [[7, 1], [6, 1], [4, 1], [5, 2], [3, 1, 1], [2, 1], [3, 1], [4, 1], [6, 2], [9, 1, 1], [-1, 1]];
    events[0].n = 8 * BAR;
    var a = 0;
    tune.forEach(function (t) {
      events.push({ rest: t[0] < 0, s: t[0] < 0 ? 4 : t[0], st: !!t[2], a: a, n: t[1] }); a += t[1];
    });
    clock = BAR + 1;
    draw();
  }

  readColors();
  silence();
  resize();
  if (reduce.matches) still();
  window.addEventListener('resize', function () { resize(); });
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('themechange', function () { readColors(); draw(); });
  reduce.addEventListener('change', function () { if (reduce.matches) still(); else { silence(); kick(); } });
  kick();
})();
