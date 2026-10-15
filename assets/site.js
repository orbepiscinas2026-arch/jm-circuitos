/* JM Circuitos Elétricos: motor da página */
(() => {
  'use strict';
  document.documentElement.classList.remove('no-js');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const smoothstep = (p, e0, e1) => { const t = seg(p, e0, e1); return t * t * (3 - 2 * t); };
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- WhatsApp ---------- */
  // Número com DDI e DDD, só dígitos: (12) 99664-0756
  const WA_NUMBER = '5512996640756';
  const waUrl = msg => 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  $$('[data-wa]').forEach(a => {
    a.href = waUrl(a.dataset.wa);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- divisão do texto do hero ---------- */
  function rng(seed) {
    let s = seed >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  }
  function splitText(el, seed, fx, spread) {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    const em = (el.dataset.em || '').split(',').filter(Boolean);
    const r = rng(seed);
    const words = text.split(' ');
    const total = text.replace(/ /g, '').length;
    el.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    const vis = document.createElement('span');
    vis.className = 'vis';
    vis.setAttribute('aria-hidden', 'true');
    let ci = 0;
    words.forEach((word, wi) => {
      const w = document.createElement('span');
      w.className = 'w' + (em.includes(word) ? ' em' : '');
      w.style.setProperty('--th', (wi / words.length * 0.5).toFixed(3));
      if (fx === 'grid') {
        for (const ch of word) {
          const c = document.createElement('span');
          c.className = 'c';
          c.textContent = ch;
          c.style.setProperty('--th', (ci / total * spread + r() * 0.06).toFixed(3));
          c.style.setProperty('--jx', (-(16 + r() * 22)).toFixed(1) + 'px');
          w.appendChild(c);
          ci++;
        }
      } else {
        w.textContent = word;
      }
      vis.appendChild(w);
      if (wi < words.length - 1) vis.appendChild(document.createTextNode(' '));
    });
    el.append(sr, vis);
  }

  /* ---------- hero: faixas e planta ---------- */
  const hero = $('.hero');
  const plan = $('#plan');
  const cue = $('.cue');

  const bands = $$('.band').map((el, i) => {
    const t = $('.split', el);
    if (t) splitText(t, 101 + i * 17, el.dataset.fx, parseFloat(el.dataset.spread || '0.45'));
    return {
      el, a: +el.dataset.a, b: +el.dataset.b,
      ramp: el.dataset.ramp ? +el.dataset.ramp : 0,
      op: -1, k: -1, first: i === 0, last: false
    };
  });
  bands[bands.length - 1].last = true;

  const byId = id => document.getElementById(id);
  const wires = {
    entry: byId('w-entry'), trunk: byId('w-trunk'), trunkl: byId('w-trunkl'), out: byId('w-out'),
    br: [0, 1, 2, 3, 4, 5, 6, 7].map(i => byId('w-b' + i))
  };
  const roomGlows = $$('.rg', plan);
  const roomFx = $$('.room-fx .fx', plan);
  const qdc = $('.qdc-on', plan);
  const outside = $('.outside-on', plan);
  const callout = $('.callout', plan);
  const leds = $$('.co-led', plan);

  const cache = new Map();
  function setDash(el, t) {
    const v = Math.round((1 - t) * 1000) / 1000;
    if (cache.get(el) === v) return;
    cache.set(el, v);
    el.style.strokeDashoffset = v;
  }
  function setOp(el, o) {
    const v = Math.round(o * 1000) / 1000;
    if (cache.get(el) === v) return;
    cache.set(el, v);
    el.setAttribute('opacity', v);
  }

  // câmera: pontos de parada em progresso de scroll (x e y do centro, largura do viewBox)
  const ASPECT = 1000 / 700;
  const CAM = [
    { p: 0.00, x: 250, y: 300, w: 560 },
    { p: 0.06, x: 250, y: 300, w: 560 },
    { p: 0.38, x: 500, y: 362, w: 1050 },
    { p: 0.50, x: 500, y: 362, w: 1050 },
    { p: 0.60, x: 236, y: 252, w: 600 },
    { p: 0.72, x: 236, y: 252, w: 600 },
    { p: 0.88, x: 500, y: 379, w: 1100 },
    { p: 1.00, x: 500, y: 379, w: 1100 }
  ];
  let lastVB = '';
  function camera(p) {
    let i = 0;
    while (i < CAM.length - 2 && p > CAM[i + 1].p) i++;
    const A = CAM[i], B = CAM[i + 1];
    const t = smoothstep(p, A.p, B.p);
    const w = A.w * Math.pow(B.w / A.w, t);
    const h = w / ASPECT;
    const cx = lerp(A.x, B.x, t), cy = lerp(A.y, B.y, t);
    const vb = (cx - w / 2).toFixed(1) + ' ' + (cy - h / 2).toFixed(1) + ' ' + w.toFixed(1) + ' ' + h.toFixed(1);
    if (vb !== lastVB) { lastVB = vb; plan.setAttribute('viewBox', vb); }
  }

  function renderPlan(p) {
    setDash(wires.entry, seg(p, 0.03, 0.15));
    setOp(qdc, smoothstep(p, 0.13, 0.18));
    setDash(wires.trunk, seg(p, 0.17, 0.30));
    setDash(wires.trunkl, seg(p, 0.17, 0.23));
    for (let i = 0; i < 8; i++) {
      const s = 0.25 + i * 0.03;
      setDash(wires.br[i], seg(p, s, s + 0.05));
      const lit = smoothstep(p, s + 0.04, s + 0.08);
      setOp(roomGlows[i], lit);
      setOp(roomFx[i], lit);
    }
    setOp(callout, smoothstep(p, 0.53, 0.58));
    for (let i = 0; i < leds.length; i++) setOp(leds[i], smoothstep(p, 0.58 + i * 0.022, 0.6 + i * 0.022));
    setDash(wires.out, seg(p, 0.77, 0.86));
    setOp(outside, smoothstep(p, 0.84, 0.92));
    camera(p);
  }

  /* ---------- loop do hero: suaviza na direção do scroll e descansa ---------- */
  const M = {};
  let target = 0, shown = 0, rafId = null, lastTick = 0;
  let heroOn = true, scrubOn = false, loadK = 0, loadStart = 0, cueGone = null;

  function heroProgress() {
    return M.heroRange > 0 ? clamp((scrollY - M.heroTop) / M.heroRange, 0, 1) : 0;
  }

  function renderBands(p) {
    for (const b of bands) {
      const f = Math.min(0.02, (b.b - b.a) / 3);
      let op = b.first ? 1 : smoothstep(p, b.a, b.a + f);
      if (!b.last) op *= 1 - smoothstep(p, b.b - f, b.b);
      const ramp = b.ramp || Math.min(0.04, (b.b - b.a) * 0.35);
      let k = clamp((p - b.a) / ramp, 0, 1);
      if (b.first) k = Math.max(k, easeOut(loadK));
      const o = Math.round(op * 1000) / 1000;
      if (o !== b.op) {
        b.op = o;
        b.el.style.opacity = o;
        b.el.style.visibility = o === 0 ? 'hidden' : 'visible';
        b.el.classList.toggle('is-on', o > 0.5);
      }
      if (Math.abs(k - b.k) >= 0.008 || (k === 1 && b.k !== 1) || (k === 0 && b.k !== 0)) {
        b.k = k;
        b.el.style.setProperty('--k', k.toFixed(3));
      }
    }
    const gone = p > 0.02;
    if (gone !== cueGone) { cueGone = gone; cue.classList.toggle('gone', gone); }
  }

  function tick(now) {
    const dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    const k = 0.16;
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
    let busy = true;
    if (Math.abs(target - shown) < 0.0005) { shown = target; busy = false; }
    if (loadK < 1) {
      if (!loadStart) loadStart = now;
      loadK = clamp((now - loadStart) / 1400, 0, 1);
      busy = true;
    }
    renderPlan(shown);
    renderBands(shown);
    if (busy) rafId = requestAnimationFrame(tick);
    else { rafId = null; lastTick = 0; }
  }
  function kick() { if (rafId === null) rafId = requestAnimationFrame(tick); }
  function onScroll() {
    target = heroProgress();
    if (heroOn) kick();
  }

  /* ---------- abaixo da dobra: o fio, os passos, a navegação ---------- */
  const nav = $('#nav');
  const circuit = $('#circuit');
  const rail = $('.wire-rail');
  const fill = $('.wire-fill');
  const head = $('.wire-head');
  const nodes = $$('.node', circuit);
  const steps = $('#steps');
  const stepEls = $$('.step', steps);
  const floatWa = $('#float-wa');

  function measure() {
    const sy = scrollY;
    M.vh = innerHeight;
    M.heroTop = hero.getBoundingClientRect().top + sy;
    M.heroRange = hero.offsetHeight - M.vh;
    const cr = circuit.getBoundingClientRect();
    M.circTop = cr.top + sy;
    M.nodeY = nodes.map(n => {
      const r = n.getBoundingClientRect();
      return r.top + sy + r.height / 2 - M.circTop;
    });
    M.railTop = M.nodeY[0] || 0;
    M.railLen = Math.max(1, (M.nodeY[M.nodeY.length - 1] || cr.height) - M.railTop);
    rail.style.top = M.railTop + 'px';
    rail.style.height = M.railLen + 'px';
    const sr = steps.getBoundingClientRect();
    M.stepsTop = sr.top + sy;
    M.stepsH = sr.height;
  }

  let belowQueued = false, wireCache = -1, stepsCache = -1, navSolid = null, closed = null, pinned = false;
  const litNodes = nodes.map(() => null);

  function updateBelow() {
    belowQueued = false;
    const sy = scrollY;
    const solid = sy > 30;
    if (solid !== navSolid) { navSolid = solid; nav.classList.toggle('solid', solid); }
    if (pinned) return;

    const probe = sy + M.vh * 0.55 - M.circTop - M.railTop;
    const fpx = clamp(probe, 0, M.railLen);
    const fr = Math.round(fpx / M.railLen * 1000) / 1000;
    if (fr !== wireCache) {
      wireCache = fr;
      fill.style.transform = 'scaleY(' + fr + ')';
      head.style.transform = 'translateY(' + fpx.toFixed(1) + 'px)';
      head.style.opacity = fr > 0 && fr < 1 ? '1' : '0';
    }
    nodes.forEach((n, i) => {
      const lit = probe >= M.nodeY[i] - M.railTop - 1;
      if (lit !== litNodes[i]) { litNodes[i] = lit; n.classList.toggle('lit', lit); }
    });
    const isClosed = fr >= 0.999;
    if (isClosed !== closed) { closed = isClosed; circuit.classList.toggle('closed', isClosed); }

    const sp = clamp((sy + M.vh * 0.72 - M.stepsTop) / (M.stepsH * 0.8), 0, 1);
    const sq = Math.round(sp * 200) / 200;
    if (sq !== stepsCache) {
      stepsCache = sq;
      steps.style.setProperty('--sp', sq);
      const n = stepEls.length - 1;
      stepEls.forEach((s, i) => s.classList.toggle('lit', sq >= (i / n) * 0.96 + 0.02));
    }
  }
  function queueBelow() {
    if (!belowQueued) { belowQueued = true; requestAnimationFrame(updateBelow); }
  }

  /* ---------- o disjuntor (momento interativo) ---------- */
  const brk = $('#breaker');
  const entrega = $('.sec-entrega');
  const brkLabel = $('.brk-label', brk);
  let charge = 0, holding = false, brkRaf = null, brkLast = 0, brkDone = false, brkPinned = false, chargeCache = -1;

  function setCharge(c) {
    const q = Math.round(c * 100) / 100;
    if (q !== chargeCache) { chargeCache = q; brk.style.setProperty('--charge', q); }
  }
  function switchOn() {
    brkDone = true;
    holding = false;
    brk.classList.add('on');
    entrega.classList.add('done');
    brk.setAttribute('aria-pressed', 'true');
    brkLabel.textContent = 'Disjuntor ligado.';
  }
  function switchOff() {
    brkDone = false;
    charge = 0;
    setCharge(0);
    brk.classList.remove('on');
    entrega.classList.remove('done');
    brk.setAttribute('aria-pressed', 'false');
    brkLabel.textContent = 'Disjuntor desligado. Segure para ligar.';
  }
  function brkLoop(now) {
    const dt = Math.min(64, now - (brkLast || now));
    brkLast = now;
    charge = holding ? Math.min(1, charge + dt / 1100) : Math.max(0, charge - dt / 650);
    setCharge(charge);
    if (charge >= 1 && !brkDone) switchOn();
    if (!brkDone && (holding ? charge < 1 : charge > 0)) brkRaf = requestAnimationFrame(brkLoop);
    else { brkRaf = null; brkLast = 0; }
  }
  function press(e) {
    if (brkDone) return;
    if (e && e.pointerId !== undefined) { try { brk.setPointerCapture(e.pointerId); } catch (_) {} }
    if (mqRM.matches) { charge = 1; setCharge(1); switchOn(); return; }
    holding = true;
    if (brkRaf === null) brkRaf = requestAnimationFrame(brkLoop);
  }
  function release() {
    if (!holding) return;
    holding = false;
    if (!brkDone && brkRaf === null) brkRaf = requestAnimationFrame(brkLoop);
  }
  brk.addEventListener('pointerdown', e => { if (e.button > 0) return; e.preventDefault(); press(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => brk.addEventListener(t, release));
  brk.addEventListener('keydown', e => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(); }
  });
  brk.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release(); } });
  brk.addEventListener('blur', release);
  brk.addEventListener('click', e => e.preventDefault());
  brk.addEventListener('contextmenu', e => e.preventDefault());

  /* ---------- estados finais (movimento reduzido) ---------- */
  function pinFinalStates() {
    pinned = true;
    fill.style.transform = 'scaleY(1)';
    head.style.opacity = '0';
    nodes.forEach(n => n.classList.add('lit'));
    circuit.classList.add('closed');
    steps.style.setProperty('--sp', 1);
    stepEls.forEach(s => s.classList.add('lit'));
    $$('.reveal').forEach(el => el.classList.add('in', 'settled'));
    if (!brkDone) { brkPinned = true; switchOn(); setCharge(1); }
  }
  function unpinFinalStates() {
    if (!pinned) return;
    pinned = false;
    wireCache = -1; stepsCache = -1; closed = null;
    litNodes.fill(null);
    if (brkPinned) { brkPinned = false; switchOff(); }
    queueBelow();
  }

  /* ---------- portão do hero: só o movimento reduzido recebe o hero estático ---------- */
  const RM = '(prefers-reduced-motion: reduce)';
  const mqRM = matchMedia(RM);

  function enableScrub() {
    if (scrubOn) return;
    scrubOn = true;
    hero.classList.remove('is-static');
    measure();
    bands.forEach(b => { b.op = -1; b.k = -1; });
    cache.clear();
    lastVB = '';
    cueGone = null;
    unpinFinalStates();
    addEventListener('scroll', onScroll, { passive: true });
    target = shown = heroProgress();
    kick();
  }
  function disableScrub() {
    scrubOn = false;
    removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; lastTick = 0; }
    hero.classList.add('is-static');
    loadK = 1;
    cache.clear();
    lastVB = '';
    renderPlan(1);
    pinFinalStates();
    measure();
  }
  function applyHeroMode() {
    if (mqRM.matches) disableScrub();
    else enableScrub();
  }
  mqRM.addEventListener('change', applyHeroMode);

  /* ---------- observadores ---------- */
  let heroVisible = true, ctaVisible = false;
  const updFloat = () => floatWa.classList.toggle('show', !heroVisible && !ctaVisible);
  new IntersectionObserver(([en]) => {
    heroOn = en.isIntersecting;
    heroVisible = en.isIntersecting;
    updFloat();
    if (heroOn && scrubOn) onScroll();
  }).observe(hero);
  new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.target.id === 'orcamento') ctaVisible = en.isIntersecting; });
    updFloat();
  }, { rootMargin: '0px 0px -20% 0px' }).observe(byId('orcamento'));

  const revObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      revObs.unobserve(el);
      const n = $$('.r-item', el).length;
      const extra = el.querySelector('.strike') ? 1600 : 0;
      setTimeout(() => el.classList.add('settled'), 1000 + n * 90 + extra);
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach(el => {
    $$('.r-item', el).forEach((it, i) => it.style.setProperty('--i', i));
    revObs.observe(el);
  });

  const liveObs = new IntersectionObserver(entries => {
    entries.forEach(en => en.target.classList.toggle('live', en.isIntersecting));
  }, { rootMargin: '10% 0px' });
  $$('.sec').forEach(s => liveObs.observe(s));

  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('paused', document.hidden);
  });

  /* ---------- formulário: monta a mensagem e abre o WhatsApp ---------- */
  const form = byId('form');
  const nome = form.elements.nome;
  const fNome = nome.closest('.field');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const n = nome.value.trim();
    if (!n) {
      fNome.classList.add('bad');
      nome.setAttribute('aria-invalid', 'true');
      nome.setAttribute('aria-describedby', 'e-nome');
      nome.focus();
      return;
    }
    fNome.classList.remove('bad');
    nome.removeAttribute('aria-invalid');
    const tipo = form.elements.tipo.value;
    const onde = form.elements.onde.value.trim();
    const msg = form.elements.msg.value.trim();
    let text = 'Olá, JM! Meu nome é ' + n + '.\nServiço: ' + tipo + '.';
    if (onde) text += '\nLocal: ' + onde + '.';
    if (msg) text += '\n' + msg;
    const url = waUrl(text);
    byId('f-ok-link').href = url;
    form.classList.add('sent');
    window.open(url, '_blank', 'noopener');
  });
  nome.addEventListener('input', () => {
    if (nome.value.trim()) { fNome.classList.remove('bad'); nome.removeAttribute('aria-invalid'); }
  });

  /* ---------- medidas e início ---------- */
  let rq = false;
  function remeasure() {
    rq = false;
    measure();
    if (scrubOn) onScroll();
    queueBelow();
  }
  const queueMeasure = () => { if (!rq) { rq = true; requestAnimationFrame(remeasure); } };
  new ResizeObserver(queueMeasure).observe(document.body);
  addEventListener('resize', queueMeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueMeasure);
  addEventListener('scroll', queueBelow, { passive: true });

  measure();
  applyHeroMode();
  updateBelow();
})();
