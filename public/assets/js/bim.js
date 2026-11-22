/* ENGISOFT BIM engine.
   A dependency-free canvas renderer for a small federated building model:
   architecture, structure and MEP, a real AABB clash test, LOD filtering and a
   point-cloud-to-model sequence. Mount with <canvas data-bim="viewer|lod|scan">. */
(() => {
  const RGB = { mass: [242, 239, 233], arch: [242, 239, 233], glass: [242, 239, 233], struct: [168, 162, 154], duct: [229, 113, 38], pipe: [240, 138, 69], tray: [251, 189, 2], fire: [255, 92, 72], clash: [255, 61, 61] };
  const DISC = { mass: 'arch', arch: 'arch', glass: 'arch', struct: 'struct', duct: 'mep', pipe: 'mep', tray: 'mep', fire: 'mep' };
  const GX = [0, 7, 14, 21], GY = [0, 6, 12], LV = 4, H = 3.6, CX = 10.5, CY = 6, CZ = LV * H / 2, SY = -7;

  /* the model, in metres. lod = lowest LOD at which an element appears */
  function model() {
    const P = [], box = (a, b, k, lod, tag) => P.push({ a, b, k, lod, tag: tag || k });
    box([0, 0, 0], [21, 12, LV * H], 'mass', 100);
    for (let l = 0; l <= LV; l++) box([-0.3, -0.3, l * H - 0.25], [21.3, 12.3, l * H], 'struct', 200, 'slab');
    for (let l = 0; l < LV; l++) {
      const z0 = l * H, top = (l + 1) * H - 0.25, hi = l % 2 === 1;
      GX.forEach(x => GY.forEach(y => box([x - 0.25, y - 0.25, z0], [x + 0.25, y + 0.25, top], 'struct', 200, 'column')));
      GY.forEach(y => { for (let i = 0; i < 3; i++) box([GX[i] + 0.25, y - 0.2, top - 0.55], [GX[i + 1] - 0.25, y + 0.2, top], 'struct', 300, 'beam'); });
      GX.forEach(x => { for (let j = 0; j < 2; j++) box([x - 0.2, GY[j] + 0.25, top - 0.55], [x + 0.2, GY[j + 1] - 0.25, top], 'struct', 300, 'beam'); });
      box([7.6, 4.2, z0], [10.4, 7.8, top], 'arch', 200, 'core');
      for (let i = 0; i < 3; i++) { box([GX[i] + 0.25, -0.05, z0], [GX[i + 1] - 0.25, 0.05, top], 'glass', 300); box([GX[i] + 0.25, 11.95, z0], [GX[i + 1] - 0.25, 12.05, top], 'glass', 300); }
      for (let j = 0; j < 2; j++) { box([-0.05, GY[j] + 0.25, z0], [0.05, GY[j + 1] - 0.25, top], 'glass', 300); box([20.95, GY[j] + 0.25, z0], [21.05, GY[j + 1] - 0.25, top], 'glass', 300); }
      // services: on levels 2 and 4 the main duct runs high, and on level 3 the cable tray does too
      const dz = hi ? [top - 0.75, top - 0.3] : [top - 1.25, top - 0.8];
      box([1, 8.6, dz[0]], [20, 9.4, dz[1]], 'duct', 300);
      box([1, 10.3, top - 1.0], [20, 10.5, top - 0.8], 'pipe', 300);
      const tz = l === 2 ? [top - 0.45, top - 0.35] : [top - 1.05, top - 0.95];
      box([1, 3.0, tz[0]], [20, 3.5, tz[1]], 'tray', 300);
      box([1, 6.9, top - 0.7], [20, 7.05, top - 0.58], 'fire', 300);
      for (let x = 2; x < 20; x += 3) box([x - 0.15, 9.4, dz[0] + 0.1], [x + 0.15, 11.5, dz[0] + 0.35], 'duct', 400, 'branch');
      for (let x = 1.5; x < 20; x += 2.5) box([x - 0.03, 6.94, top - 0.95], [x + 0.03, 7.0, top - 0.7], 'fire', 400, 'drop');
      for (let i = 0; i < 3; i++) for (const f of [1 / 3, 2 / 3]) { const x = GX[i] + 0.25 + (GX[i + 1] - GX[i] - 0.5) * f; box([x - 0.04, -0.09, z0], [x + 0.04, 0.09, top], 'glass', 400, 'mullion'); box([x - 0.04, 11.91, z0], [x + 0.04, 12.09, top], 'glass', 400, 'mullion'); }
    }
    box([8, 7.2, 0], [8.4, 7.6, LV * H], 'pipe', 300, 'riser');
    box([9.2, 4.4, 0], [10, 5.0, LV * H], 'duct', 300, 'riser');
    return P;
  }

  const overlap = (p, q) => p.a[0] < q.b[0] && p.b[0] > q.a[0] && p.a[1] < q.b[1] && p.b[1] > q.a[1] && p.a[2] < q.b[2] && p.b[2] > q.a[2];
  function clashes(P, lod) {
    const mep = P.filter(p => DISC[p.k] === 'mep' && p.lod <= lod && p.tag !== 'riser');
    const st = P.filter(p => p.k === 'struct' && p.lod <= lod && p.lod >= 200);
    const out = [];
    mep.forEach(m => st.forEach(s => { if (overlap(m, s)) { out.push({ m, s, c: [0, 1, 2].map(i => (Math.max(m.a[i], s.a[i]) + Math.min(m.b[i], s.b[i])) / 2) }); } }));
    return out;
  }

  /* points sampled on the surfaces of architecture and structure, for the scan sequence */
  function cloud(P, n) {
    const src = P.filter(p => p.k !== 'mass' && DISC[p.k] !== 'mep' && p.lod <= 300), faces = [];
    src.forEach(p => {
      const [x0, y0, z0] = p.a, [x1, y1, z1] = p.b, dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
      faces.push([dx * dy, q => [x0 + q[0] * dx, y0 + q[1] * dy, z1]], [dx * dz, q => [x0 + q[0] * dx, y0, z0 + q[1] * dz]], [dx * dz, q => [x0 + q[0] * dx, y1, z0 + q[1] * dz]], [dy * dz, q => [x0, y0 + q[0] * dy, z0 + q[1] * dz]], [dy * dz, q => [x1, y0 + q[0] * dy, z0 + q[1] * dz]]);
    });
    const tot = faces.reduce((s, f) => s + f[0], 0), pts = [];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) {
      let r = rnd() * tot, f = faces[0];
      for (const x of faces) { r -= x[0]; if (r <= 0) { f = x; break; } }
      const t = f[1]([rnd(), rnd()]), g = () => (rnd() + rnd() + rnd() - 1.5) * 1.1;
      pts.push({ t, n: [g(), g(), g() * 0.6], raw: Math.atan2(t[1] - SY, t[0] - CX), h: t[2] / (LV * H) });
    }
    // sweep order: normalise the scanner's view angle to 0..1 so the reveal uses the whole timeline
    const lo = Math.min(...pts.map(p => p.raw)), hi = Math.max(...pts.map(p => p.raw));
    pts.forEach(p => { p.ang = (p.raw - lo) / (hi - lo); });
    pts.lo = lo; pts.hi = hi;
    return pts;
  }

  const EDGES = [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const FACES = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);

  function mount(cv, opts) {
    const ctx = cv.getContext('2d'), P = model(), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const o = Object.assign({ disc: { arch: true, struct: true, mep: true }, lod: 400, clash: false, scan: false, cloud: 0, spin: !reduce, yaw: -0.75, pitch: 0.42 }, opts);
    let W = 0, Ht = 0, dpr = 1, yaw = o.yaw, pitch = o.pitch, visible = false, raf = 0, last = 0, t0 = performance.now(), drag = null, CL = [], PTS = null, cur = 0;
    const recompute = () => { CL = clashes(P, o.lod); };
    recompute();

    function size() {
      const r = cv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; Ht = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(Ht * dpr); draw();
    }
    function proj(p) {
      const x = p[0] - CX, y = p[1] - CY, z = p[2] - CZ, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const x1 = x * cy - y * sy, y1 = x * sy + y * cy, d = y1 * cp - z * sp, Y = z * cp + y1 * sp;
      const dist = 52, f = Math.min(W * 0.74, Ht * 1.02) * dist / 26, s = f / (dist + d);
      return [W / 2 + x1 * s, Ht * 0.53 - Y * s, d, s];
    }
    const corners = p => { const [x0, y0, z0] = p.a, [x1, y1, z1] = p.b; return [[x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0], [x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1]].map(proj); };

    function draw(now) {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Ht);
      const time = (now || performance.now()) - t0, hot = new Set();
      if (o.clash) CL.forEach(c => { hot.add(c.m); hot.add(c.s); });
      // scan sequence: 0..1 progress on a 10 s loop, or a fixed value
      let sp = o.cloud, edgeA = 1;
      if (o.scan) { sp = reduce ? 1 : (time / 10000) % 1; edgeA = ease((sp - 0.62) / 0.25) * (1 - ease((sp - 0.94) / 0.06)); }
      cur = sp;
      const show = p => o.disc[DISC[p.k]] && (o.lod === 100 ? p.k === 'mass' : p.k !== 'mass' && p.lod <= o.lod);
      const list = [];
      P.forEach(p => {
        if (!show(p)) return;
        if (o.scan && DISC[p.k] === 'mep') return;
        const C = corners(p), mep = DISC[p.k] === 'mep', isHot = hot.has(p);
        let fa = p.k === 'mass' ? 0.12 : p.k === 'glass' ? (p.tag === 'mullion' ? 0.5 : 0.045) : p.k === 'struct' ? (p.tag === 'slab' ? 0.07 : 0.16) : p.k === 'arch' ? 0.08 : 0.62;
        let ea = mep ? 0.95 : p.k === 'struct' ? 0.5 : 0.4;
        if (o.clash && !isHot) { fa *= 0.3; ea *= 0.3; }
        if (o.scan) { fa *= edgeA; ea *= edgeA; }
        if (ea < 0.01) return;
        const col = isHot ? RGB.clash : RGB[p.k];
        FACES.forEach(F => list.push({ d: (C[F[0]][2] + C[F[1]][2] + C[F[2]][2] + C[F[3]][2]) / 4, pts: F.map(i => C[i]), col, fa: isHot ? 0.7 : fa, ea: isHot ? 1 : ea }));
      });
      list.sort((a, b) => b.d - a.d);
      ctx.lineJoin = 'round';
      for (const f of list) {
        ctx.beginPath(); ctx.moveTo(f.pts[0][0], f.pts[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(f.pts[i][0], f.pts[i][1]); ctx.closePath();
        const [r, g, b] = f.col; ctx.fillStyle = `rgba(${r},${g},${b},${f.fa})`; ctx.fill();
        ctx.strokeStyle = `rgba(${r},${g},${b},${f.ea})`; ctx.lineWidth = 0.7; ctx.stroke();
      }
      // point cloud
      if (o.scan || sp > 0) {
        if (!PTS) PTS = cloud(P, W < 600 ? 2200 : 3600);
        const reveal = o.scan ? Math.min(1, sp / 0.38) : 1, settle = o.scan ? ease((sp - 0.4) / 0.26) : 1, out = o.scan ? 1 - ease((sp - 0.94) / 0.06) : 1, fade = (o.scan ? 1 - 0.6 * edgeA : 0.55) * out;
        const sz = W < 600 ? 1.3 : 1.6;
        for (const q of PTS) {
          if (q.ang > reveal) continue;
          const k = 1 - settle, p = proj([q.t[0] + q.n[0] * k, q.t[1] + q.n[1] * k, q.t[2] + q.n[2] * k]);
          const r = 229 + (251 - 229) * q.h, g = 113 + (189 - 113) * q.h, b = 38 - 36 * q.h;
          ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${0.85 * fade})`; ctx.fillRect(p[0], p[1], sz, sz);
        }
        if (o.scan && sp < 0.42) { // scanner station and its sweep
          const s = proj([CX, SY, 1.6]), a = PTS.lo + reveal * (PTS.hi - PTS.lo);
          ctx.fillStyle = 'rgba(251,189,2,1)'; ctx.beginPath(); ctx.arc(s[0], s[1], 5, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(251,189,2,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(s[0], s[1], 10 + (time / 40) % 24, 0, 7); ctx.stroke();
          const e = proj([CX + Math.cos(a) * 30, SY + Math.sin(a) * 30, 1.6]);
          const gr = ctx.createLinearGradient(s[0], s[1], e[0], e[1]); gr.addColorStop(0, 'rgba(251,189,2,.55)'); gr.addColorStop(1, 'rgba(251,189,2,0)');
          ctx.strokeStyle = gr; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
        }
      }
      // clash markers
      if (o.clash) CL.forEach((c, i) => {
        const p = proj(c.c), pulse = reduce ? 0 : (time / 900 + i * 0.17) % 1;
        ctx.strokeStyle = `rgba(255,61,61,${1 - pulse})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p[0], p[1], 6 + pulse * 16, 0, 7); ctx.stroke();
        ctx.fillStyle = '#FF3D3D'; ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 7); ctx.fill();
        ctx.font = '600 10px "JetBrains Mono", monospace'; ctx.fillStyle = '#fff'; ctx.fillText('C' + String(i + 1).padStart(2, '0'), p[0] + 9, p[1] - 8);
      });
    }

    function loop(now) {
      raf = 0; if (!visible) return;
      const dt = Math.min(64, now - (last || now)); last = now;
      if (o.spin && !drag) yaw += dt * 0.00011;
      draw(now);
      if (o.spin || o.scan || o.clash) raf = requestAnimationFrame(loop);
    }
    const kick = () => { if (!raf && visible) { last = 0; raf = requestAnimationFrame(loop); } };

    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; cv.setPointerCapture(e.pointerId); cv.classList.add('grab'); });
    cv.addEventListener('pointermove', e => { if (!drag) return; yaw = drag.yaw + (e.clientX - drag.x) * 0.008; pitch = Math.max(0.05, Math.min(1.2, drag.pitch + (e.clientY - drag.y) * 0.005)); draw(); });
    const up = () => { drag = null; cv.classList.remove('grab'); kick(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    new ResizeObserver(size).observe(cv);
    let seen = false;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !seen) { seen = true; t0 = performance.now(); } if (visible) kick(); }, { rootMargin: '100px' }).observe(cv);
    size();
    return {
      set(n) { Object.assign(o, n); if ('lod' in n) recompute(); draw(); kick(); },
      get clashes() { return CL; },
      get progress() { return cur; },
      opts: o
    };
  }

  window.BIM = { mount };
})();
