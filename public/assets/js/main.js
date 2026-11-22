/* ENGISOFT v5. GSAP + ScrollTrigger + Lenis. Every module checks that its elements exist. */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WP = window.ESWP || null, ASSETS = WP ? WP.assets : 'assets/';
  gsap.registerPlugin(ScrollTrigger);

  /* smooth scroll */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  }

  /* page curtain: always cleared on arrival, including back/forward cache */
  const cur = $('#curtain');
  const clear = () => cur && gsap.set(cur, { visibility: 'hidden', yPercent: 100 });
  clear(); addEventListener('pageshow', clear);
  $$('a[href]').forEach(a => a.addEventListener('click', e => {
    const raw = a.getAttribute('href');
    if (/^(mailto|tel|javascript):/.test(raw) || a.target || a.hasAttribute('download') || a.closest('#wpadminbar') || e.metaKey || e.ctrlKey || e.shiftKey) return;
    let u; try { u = new URL(raw, location.href); } catch (err) { return; }
    if (u.origin !== location.origin) return;
    // same page + anchor: smooth scroll instead of reloading
    if (u.hash && u.pathname === location.pathname && u.search === location.search) { const el = document.getElementById(u.hash.slice(1)); if (!el) return; e.preventDefault(); closeMenu(); lenis ? lenis.scrollTo(el) : el.scrollIntoView(); return; }
    if (/\/wp-(admin|login)|\.(pdf|zip|jpe?g|png|mp4|docx?)$/i.test(u.pathname) || !cur || reduce) return;
    const h = u.href;
    e.preventDefault(); closeMenu();
    gsap.fromTo(cur, { visibility: 'visible', yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'expo.inOut', onComplete: () => { location.href = h; } });
    setTimeout(() => { location.href = h; }, 1200);
  }));

  /* conversion events for GA4 / Tag Manager (window.dataLayer), as listed in the SEO brief */
  const esTrack = (event, data) => { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event }, data || {})); };
  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href]'); if (!a) return; const h = a.getAttribute('href') || ''; if (h.startsWith('tel:')) esTrack('phone_click', { number: h.slice(4) }); else if (/wa\.me|whatsapp/i.test(h)) esTrack('whatsapp_click'); });
if (document.body.classList.contains('single-project')) esTrack('case_study_view', { case_study: document.title });

  /* nav + menu */
  const nav = $('#nav'), burger = $('#burger'), mnav = $('#mnav');
  // header dropdowns: hover/focus on desktop, tap the arrow on touch screens
  document.querySelectorAll('.dd-t').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const dd = b.parentElement, open = !dd.classList.contains('open'); document.querySelectorAll('.dd.open').forEach(x => { x.classList.remove('open'); x.querySelector('.dd-t').setAttribute('aria-expanded', 'false'); }); dd.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open)); }));
  document.addEventListener('click', e => { if (!e.target.closest('.dd')) document.querySelectorAll('.dd.open').forEach(x => { x.classList.remove('open'); x.querySelector('.dd-t').setAttribute('aria-expanded', 'false'); }); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.dd.open').forEach(x => { x.classList.remove('open'); x.querySelector('.dd-t').setAttribute('aria-expanded', 'false'); }); });
  function closeMenu() { if (!mnav || mnav.hidden) return; mnav.hidden = true; burger.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); }
  burger && burger.addEventListener('click', () => { const open = mnav.hidden; mnav.hidden = !open; burger.setAttribute('aria-expanded', String(open)); lenis && (open ? lenis.stop() : lenis.start()); if (open) gsap.from('.mnav > a, .mnav summary', { y: 40, opacity: 0, stagger: 0.05, duration: 0.6, ease: 'power3.out' }); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  const solid = () => nav.classList.toggle('solid', scrollY > 40);
  solid(); ScrollTrigger.create({ start: 0, end: 'max', onUpdate: solid });

  /* 1. hero: 5 clips x 40 frames, cross-faded at the joins */
  const cv = $('#seq');
  if (cv) {
    const SEG = 40, NSEG = 5, FRAMES = SEG * NSEG, ctx = cv.getContext('2d'), imgs = new Array(FRAMES);
    const src = i => `${WP ? WP.seq : ASSETS + 'seq/hero/'}${String(i + 1).padStart(4, '0')}.webp`;
    let last = 0;
    const load = i => imgs[i] || (imgs[i] = Object.assign(new Image(), { decoding: 'async', src: src(i), onload: () => { if (Math.abs(i - last) < 2) paint(last); } }));
    const ok = im => im && im.complete && im.naturalWidth;
    const near = i => { if (ok(load(i))) return imgs[i]; for (let d = 1; d < SEG; d++) { if (ok(imgs[i - d])) return imgs[i - d]; if (ok(imgs[i + d])) return imgs[i + d]; } return null; };
    const blit = (im, a) => { if (!im) return; const W = cv.width, H = cv.height, s = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s; ctx.globalAlpha = a; ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); ctx.globalAlpha = 1; };
    function paint(f) {
      last = f; const i = Math.min(FRAMES - 1, Math.round(f)), seg = Math.floor(i / SEG), loc = i % SEG;
      blit(near(i), 1);
      const fade = SEG * 0.22; // last 22% of each clip dissolves into the next
      if (seg < NSEG - 1 && loc > SEG - fade) blit(near((seg + 1) * SEG), (loc - (SEG - fade)) / fade);
    }
    const size = () => { const r = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(cv.clientWidth * r); cv.height = Math.round(cv.clientHeight * r); ctx.imageSmoothingQuality = 'high'; paint(last); };
    // load chapter starts first, then the rest in order. Small screens and Save-Data
    // get every second frame: half the bytes, and paint() falls back to the nearest frame.
    const lite = innerWidth < 760 || (navigator.connection && navigator.connection.saveData), stepN = lite ? 2 : 1;
    for (let s = 0; s < NSEG; s++) load(s * SEG);
    for (let i = 0; i < FRAMES; i += stepN) setTimeout(() => load(i), 30 + i * 9);
    addEventListener('resize', size); size();

    const chs = $$('.ch'), names = chs.map(c => c.dataset.name || ''), lodv = ['100', '200', '300', '400', 'As-built'];
    const pct = $('#pct'), chName = $('#chName'), hint = $('#hint'), lodN = $('#lodN'), bars = $$('#steps b');
    let on = 0;
    ScrollTrigger.create({
      trigger: '.hero', pin: '#heroPin', start: 'top top', end: () => '+=' + innerHeight * 6, scrub: true,
      onUpdate: s => {
        const p = s.progress; paint(p * (FRAMES - 1));
        pct.textContent = Math.round(p * 100) + '%'; hint.style.opacity = p > 0.02 ? 0 : 1;
        bars.forEach((b, k) => b.style.transform = `scaleX(${Math.max(0, Math.min(1, p * NSEG - k))})`);
        const c = Math.min(NSEG - 1, Math.floor(p * NSEG));
        if (c !== on) { chs[on].classList.remove('is-on'); chs[c].classList.add('is-on'); chName.textContent = names[c]; lodN.textContent = lodv[c]; lodN.classList.toggle('txt', c === NSEG - 1); on = c; }
      }
    });
  }

  /* manifesto: words light up as you read */
  const mani = $('#mani');
  if (mani) {
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) { const f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(w => { if (!w.trim()) f.append(w); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; f.append(s); } }); c.replaceWith(f); }
      else walk(c);
    });
    walk(mani); const ws = $$('#mani .w');
    ScrollTrigger.create({ trigger: mani, start: 'top 80%', end: 'bottom 45%', scrub: true, onUpdate: s => { const n = Math.round(s.progress * ws.length); ws.forEach((w, i) => w.style.opacity = i < n ? 1 : 0.14); } });
  }

  /* 2. handover film */
  if ($('.hand')) {
    gsap.timeline({ scrollTrigger: { trigger: '.hand', pin: '.hand-pin', start: 'top top', end: '+=' + innerHeight * 1.6, scrub: 0.6 } })
      .fromTo('.hand-media', { clipPath: 'inset(18% 26% 18% 26% round 32px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 })
      .from('.hand-copy > *', { yPercent: 50, opacity: 0, stagger: 0.12, duration: 0.5 }, 0.55)
      .from('.card', { y: 60, opacity: 0, stagger: 0.1, duration: 0.5 }, 0.7);
  }

  /* 3. coverflow */
  if ($('.svc')) {
    const cards = $$('.sc'), segs = $$('#segs b'), n = cards.length, num = $('#svcN'); let lp = 0;
    const flow = p => {
      lp = p; const f = p * (n - 1), gap = innerWidth < 700 ? 64 : 29;
      cards.forEach((c, i) => {
        const d = i - f, a = Math.abs(d);
        c.style.transform = `translateX(${d * gap}vw) translateZ(${-a * 240}px) rotateY(${-Math.max(-1, Math.min(1, d)) * 36}deg) scale(${1 - Math.min(a, 2) * 0.05})`;
        c.style.opacity = a > 2.4 ? 0 : 1 - Math.max(0, a - 1.4); c.style.zIndex = 100 - Math.round(a * 10); c.tabIndex = a < 0.5 ? 0 : -1;
        c.style.filter = `brightness(${1 - Math.min(a, 1) * 0.25})`;
      });
      segs.forEach((s, i) => s.style.transform = `scaleX(${Math.max(0, Math.min(1, f - i + 1))})`);
      num.textContent = String(Math.round(f) + 1).padStart(2, '0');
    };
    flow(0);
    ScrollTrigger.create({ trigger: '.svc', pin: '.svc-pin', start: 'top top', end: () => '+=' + innerHeight * (n - 1) * 0.75, scrub: 0.5, onUpdate: s => flow(s.progress) });
    addEventListener('resize', () => flow(lp));
  }

  /* 4. process: horizontal track */
  const track = $('#track');
  if (track) {
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.proc', pin: '.proc-pin', start: 'top top', end: () => '+=' + dist(), scrub: 0.6, invalidateOnRefresh: true, onUpdate: s => $('#pbar').style.transform = `scaleX(${s.progress})` } });
  }

  /* films: every film plays while it is on screen and pauses when it leaves. Checked on every scroll
     frame (not only by IntersectionObserver), so films inside pinned, 3D or horizontally moving
     sections start reliably; lazy films get their source the first time they come into view. */
  const films = $$('video');
  if (films.length) {
    const onScreen = v => {
      const r = v.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < -80 || r.top > innerHeight + 80 || r.right < -80 || r.left > innerWidth + 80) return false;
      const card = v.closest('.sc');
      return !card || parseFloat(getComputedStyle(card).opacity) > 0.05;
    };
    let queued = false;
    const check = () => {
      queued = false;
      films.forEach(v => {
        if (onScreen(v)) {
          if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; v.load(); }
          if (!reduce && v.paused && !v._starting) { v.muted = true; v._starting = true; const pr = v.play(); const done = () => { v._starting = false; }; pr ? pr.then(done, done) : done(); }
        } else if (!v.paused) v.pause();
      });
    };
    let queuedAt = 0;
    // a frame can be skipped (background tab, slow device); never let one lost frame block later checks
    const queue = () => { const now = Date.now(); if (queued && now - queuedAt < 400) return; queued = true; queuedAt = now; requestAnimationFrame(check); };
    addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue);
    lenis && lenis.on('scroll', queue);
    films.forEach(v => { v.muted = true; v.setAttribute('playsinline', ''); v.addEventListener('loadeddata', queue); });
    // phones in low-power mode refuse autoplay until the first touch
    ['touchstart', 'pointerdown', 'keydown'].forEach(e => addEventListener(e, queue, { passive: true }));
    setInterval(queue, 1200); queue();
  }  if (reduce) $$('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });

  /* live federated model: discipline toggles + clash test */
  const vcv = $('#bimViewer');
  if (vcv && window.BIM) {
    const ctl = BIM.mount(vcv, { lod: 300 }), rep = $('#creport'), btn = $('#runClash'), lodBtns = $$('#vLod button');
    const name = { duct: 'Supply duct', pipe: 'CHW pipe', tray: 'Cable tray', fire: 'Fire main' }, lvl = z => 'L' + String(Math.floor(z / 3.6) + 1).padStart(2, '0');
    const report = () => {
      const c = ctl.clashes;
      rep.innerHTML = `<p class="sum">${c.length} hard clashes &middot; MEP vs structure &middot; LOD ${ctl.opts.lod}</p><ul>` + c.map((x, i) => `<li><b>C${String(i + 1).padStart(2, '0')}</b><span>${name[x.m.tag] || (x.m.tag === 'branch' ? 'Branch duct' : name[x.m.k])} &times; beam</span><span>${lvl(x.c[2])}</span></li>`).join('') + '</ul>';
    };
    $$('#vDisc button').forEach(b => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on));
      ctl.set({ disc: Object.assign({}, ctl.opts.disc, { [b.dataset.d]: on }) });
    }));
    lodBtns.forEach(b => b.addEventListener('click', () => { lodBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); ctl.set({ lod: +b.dataset.l }); $('#vLodN').textContent = b.dataset.l; if (ctl.opts.clash) report(); }));
    btn.addEventListener('click', () => {
      const on = !ctl.opts.clash; ctl.set({ clash: on, disc: on ? { arch: false, struct: true, mep: true } : { arch: true, struct: true, mep: true } });
      $$('#vDisc button').forEach(b => b.setAttribute('aria-pressed', String(on ? b.dataset.d !== 'arch' : true)));
      btn.classList.toggle('on', on); btn.firstChild.textContent = on ? 'Clear clash test ' : 'Run clash test ';
      rep.classList.toggle('on', on); if (on) report();
      $('#vState').textContent = on ? 'Clash detective' : 'Federated';
    });
  }

  /* point cloud to model */
  const scv = $('#bimScan');
  if (scv && window.BIM) {
    const ctl = BIM.mount(scv, { scan: true, lod: 300, spin: !reduce, yaw: -0.55 }), ph = $$('#phases li');
    if (ph.length) { const tick = () => { const p = ctl.progress, k = p < 0.4 ? 0 : p < 0.66 ? 1 : 2; ph.forEach((l, i) => l.classList.toggle('on', i === k)); requestAnimationFrame(tick); }; tick(); }
  }

  /* industries */
  $$('.ind button').forEach(b => b.addEventListener('click', () => { const li = b.parentNode, open = !li.classList.contains('open'); li.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open)); setTimeout(() => ScrollTrigger.refresh(), 650); }));

  /* generic reveals, counters, parallax */
  $$('.rv').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  $$('.head .h2, .story .h2').forEach(el => gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('[data-n]').forEach(el => { const o = { v: 0 }; gsap.to(o, { v: +el.dataset.n, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' }, onUpdate: () => el.textContent = Math.round(o.v) }); });
  $$('.where .bg, .foot-cta .bg').forEach(im => gsap.fromTo(im, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: im.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } }));
  $$('.story .ph-frame img').forEach(im => gsap.fromTo(im, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: im.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } }));
  $$('.bt, .gallery figure, .wk-img, .pn a').forEach(el => gsap.from(el, { clipPath: 'inset(12% 6% 12% 6% round 28px)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } }));

  /* inner page hero */
  if ($('.ph')) {
    gsap.from('.ph-a', { y: 60, opacity: 0, stagger: 0.1, duration: 1.3, ease: 'expo.out', delay: 0.1 });
    gsap.to('.ph-media', { yPercent: 14, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.ph', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* LOD explorer: the same model, rendered at each level */
  const rows = $$('.lod-row'), lcv = $('#bimLod');
  if (rows.length && lcv && window.BIM) {
    const ctl = BIM.mount(lcv, { lod: 300, yaw: -0.6 }), cap = $('#lodCap');
    rows.forEach(r => r.addEventListener('click', () => {
      rows.forEach(x => { x.classList.toggle('on', x === r); x.setAttribute('aria-selected', String(x === r)); });
      const l = +r.dataset.l; ctl.set({ lod: l === 500 ? 400 : l, cloud: l === 500 ? 1 : 0 }); cap.textContent = r.dataset.cap;
    }));
  }

  /* portfolio register filter */
  const fb = $$('.filters button');
  fb.forEach(b => b.addEventListener('click', () => {
    fb.forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    let n = 0;
    $$('.reg tbody tr').forEach(w => { const show = b.dataset.f === 'All' || w.dataset.c === b.dataset.f; w.classList.toggle('hide', !show); if (show) { n++; gsap.fromTo(w, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }); } });
    const c = $('#regN'); if (c) c.textContent = `Showing ${n} of ${$$('.reg tbody tr').length} projects`;
    ScrollTrigger.refresh();
  }));

  /* contact form: sent to WordPress (stored + emailed); without WordPress it opens the email app */
  const fm = $('#qform');
  fm && fm.addEventListener('submit', async e => {
    e.preventDefault(); let good = true;
    fm.querySelectorAll('[required]').forEach(i => { const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)); i.classList.toggle('bad', bad); i.setAttribute('aria-invalid', bad); if (bad) good = false; });
    const note = $('#fnote'), btn = fm.querySelector('button[type=submit]');
    note.classList.remove('ok', 'err');
    if (!good) { note.textContent = 'Please add your name, a valid email and a few project details.'; note.classList.add('err'); fm.querySelector('.bad').focus(); return; }
    if (!WP || !WP.ajax) {
      // static HTML version: open the visitor's email app with every field filled in
      const to = (WP && WP.email) || 'enquiry@engisoftengineering.com', skip = /^(action|es_t|website|kind)$/;
      const labels = { name: 'Name', company: 'Company', email: 'Email', phone: 'Phone', service: 'What they need', msg: 'Details', country: 'Country / city', discipline: 'Discipline', quantity: 'Number of professionals', mode: 'Onsite / remote', experience: 'Experience', software: 'Software', duration: 'Duration', timeline: 'Mobilization timeline', position: 'Position', notice: 'Availability', cv: 'CV / portfolio', topic: 'Consultation topic', date: 'Preferred date', time: 'Preferred time', format: 'Meeting format' };
      const body = [...new FormData(fm)].filter(([k, v]) => !skip.test(k) && String(v).trim()).map(([k, v]) => (labels[k] || k) + ': ' + v).join('\n');
      const subj = fm.dataset.kind === 'requirement' ? 'BIM staffing requirement' : fm.dataset.kind === 'consultation' ? 'Consultation request' : fm.dataset.kind === 'application' ? 'Job application: ' + ((fm.querySelector('[name=position]') || {}).value || '') : 'BIM enquiry: ' + (fm.querySelector('[name=service]:checked') || { value: 'General' }).value;
      esTrack(({ requirement: 'request_talent_submit', consultation: 'consultation_request' })[fm.dataset.kind] || 'contact_form_submit', { form: fm.dataset.kind || 'contact', method: 'email' });
      location.href = `mailto:${to}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      note.textContent = `Your email app should open now. If not, write to ${to}.`;
      return;
    }
    btn.disabled = true; const label = btn.firstChild.textContent; btn.firstChild.textContent = 'Sending… ';
    try {
      const r = await fetch(WP.ajax, { method: 'POST', body: new FormData(fm), credentials: 'same-origin' });
      const j = await r.json();
      note.textContent = j.message; note.classList.add(j.ok ? 'ok' : 'err');
      (j.errors || []).forEach(n => { const f = fm.querySelector(`[name="${n}"]`); f && f.classList.add('bad'); });
      if (j.ok) { esTrack(({ requirement: 'request_talent_submit', consultation: 'consultation_request' })[fm.dataset.kind] || 'contact_form_submit', { form: fm.dataset.kind || 'contact' }); fm.reset(); fm.querySelector('input[name=service]') && (fm.querySelector('input[name=service]').checked = true); }
    } catch (err) {
      note.textContent = `Sorry, the enquiry could not be sent. Please email ${WP.email}.`; note.classList.add('err');
    }
    btn.disabled = false; btn.firstChild.textContent = label;
  });

  /* any other model on the page: <canvas data-bim-opts='{"clash":true}'> */
  if (window.BIM) $$('canvas[data-bim-opts]').forEach(c => { let o = {}; try { o = JSON.parse(c.dataset.bimOpts); } catch (err) {} BIM.mount(c, Object.assign({ spin: !reduce }, o)); });
  /* footer */
  if ($('.foot')) {
    gsap.from('#giant', { yPercent: 60, opacity: 0, ease: 'power3.out', scrollTrigger: { trigger: '.foot-grid', start: 'top 85%', end: 'bottom bottom', scrub: 0.8 } });
    gsap.from('.foot-cta .display', { y: 80, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.foot-cta', start: 'top 60%' } });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
