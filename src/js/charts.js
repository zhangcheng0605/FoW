/* ============================================================
   FoW · chart engine — hand-rolled SVG, theme-aware via VIZ()
   Specs: 2px lines, r>=4 markers with 2px surface rings, 10%
   area washes, <=24px bars with 4px rounded data-ends + 2px
   surface gaps, hairline solid grid, crosshair + shared
   tooltip, legends for >=2 series, table-view twins.
   ============================================================ */
"use strict";

const vizTip = () => $("#viztip");
let liveCharts = []; /* re-render closures, re-run on resize + theme change */

/* ---------- draw-in animation (first render per container only) ---------- */
const FX_DRAWN = new WeakSet();
function canAnim(container) {
  if (FX_DRAWN.has(container)) return false;
  FX_DRAWN.add(container);
  try { if (FX.reduced) return false; } catch (_) { }
  return true;
}
function drawLine(path, delay) {
  const len = path.getTotalLength ? path.getTotalLength() : 0;
  if (!len) return;
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  path.getBoundingClientRect();
  path.style.transition = "stroke-dashoffset 850ms cubic-bezier(.3,.6,.2,1) " + (delay || 0) + "ms";
  requestAnimationFrame(() => { path.style.strokeDashoffset = "0"; });
  setTimeout(() => { path.style.strokeDasharray = ""; path.style.strokeDashoffset = ""; path.style.transition = ""; }, 1150 + (delay || 0));
}
function fadeIn(node, delay, restore) {
  node.style.opacity = "0";
  node.style.transition = "opacity 420ms ease " + (delay || 0) + "ms";
  requestAnimationFrame(() => { node.style.opacity = "1"; });
  setTimeout(() => { node.style.transition = restore || ""; }, 520 + (delay || 0));
}
function riseIn(path, delay, restore) {
  path.style.transformBox = "fill-box";
  path.style.transformOrigin = "center bottom";
  path.style.transform = "scaleY(0.02)";
  path.style.transition = "transform 560ms cubic-bezier(.2,.8,.3,1.12) " + (delay || 0) + "ms";
  requestAnimationFrame(() => { path.style.transform = "scaleY(1)"; });
  setTimeout(() => { path.style.transition = restore || ""; }, 700 + (delay || 0));
}

function registerChart(container, fn) {
  fn();
  liveCharts.push({ container, fn });
}
function clearCharts() { liveCharts = []; }
function rerenderCharts() { liveCharts = liveCharts.filter(c => document.contains(c.container)); liveCharts.forEach(c => c.fn()); }
window.addEventListener("resize", (() => {
  let t;
  return () => { clearTimeout(t); t = setTimeout(rerenderCharts, 160); };
})());

function tipShow(x, y, title, rows) {
  const tip = vizTip();
  tip.textContent = "";
  if (title) tip.appendChild(el("div", "vt-t", title));
  rows.forEach(r => {
    const row = el("div", "vt-row");
    if (r.color) { const k = el("i", "vt-key"); k.style.borderColor = r.color; row.appendChild(k); }
    row.appendChild(el("span", "vt-name", r.name));
    row.appendChild(el("b", "vt-val", r.value));
    tip.appendChild(row);
  });
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let px = x + 14, py = y + 12;
  if (px + w > innerWidth - 8) px = x - w - 14;
  if (py + h > innerHeight - 8) py = y - h - 12;
  tip.style.left = px + "px"; tip.style.top = py + "px";
}
function tipHide() { vizTip().hidden = true; }

function legendRow(series, kind) {
  const lg = el("div", "legend");
  series.forEach((s, i) => {
    const item = el("span", "lg-item");
    const key = el("i", kind === "rect" ? "lg-rect" : "lg-line");
    const col = s.color || VIZ().series[i];
    if (kind === "rect") key.style.background = col; else key.style.borderColor = col;
    item.appendChild(key);
    item.appendChild(document.createTextNode(s.name));
    lg.appendChild(item);
  });
  return lg;
}

/* ---------- sparkline (stat tile) ---------- */
function renderSpark(container, points, color, opts) {
  container.textContent = "";
  const V = VIZ();
  const col = color || V.sparkDim;
  const w = container.clientWidth || 200, h = (opts && opts.h) || 34;
  const svg = svgNode("svg", { class: "viz", width: w, height: h, viewBox: `0 0 ${w} ${h}` });
  const min = Math.min(...points), max = Math.max(...points);
  const pad = 4;
  const X = i => pad + (i / (points.length - 1)) * (w - pad * 2);
  const Y = v => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  const line = points.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
  const area = line + ` L${X(points.length - 1).toFixed(1)} ${h - 1} L${X(0).toFixed(1)} ${h - 1} Z`;
  svg.appendChild(svgNode("path", { d: area, fill: col, opacity: 0.1 }));
  svg.appendChild(svgNode("path", { d: line, fill: "none", stroke: col, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }));
  svg.appendChild(svgNode("circle", { cx: X(points.length - 1), cy: Y(points[points.length - 1]), r: 4, fill: (opts && opts.end) || V.sparkEnd, stroke: V.surface, "stroke-width": 2 }));
  container.appendChild(svg);
}

/* ---------- trend: multi-series line/area + crosshair ---------- */
function renderTrend(container, trend, opts) {
  const o = opts || {};
  container.textContent = "";
  const V = VIZ();
  const w = container.clientWidth || 560;
  const h = o.h || (o.mini ? 150 : 208);
  const mL = 42, mR = 14, mT = 10, mB = 22;
  const svg = svgNode("svg", { class: "viz", width: w, height: h, viewBox: `0 0 ${w} ${h}` });
  const pts = trend.series.flatMap(s => s.points);
  let min = Math.min(...pts), max = Math.max(...pts);
  const padV = (max - min || Math.abs(max) || 1) * 0.12;
  min = Math.min(min - padV, min >= 0 && min < max * 0.35 ? 0 : min - padV); max += padV;
  const ticks = niceTicks(min, max, o.mini ? 3 : 4);
  min = ticks[0]; max = ticks[ticks.length - 1];
  const n = trend.series[0].points.length;
  const X = i => mL + (i / (n - 1)) * (w - mL - mR);
  const Y = v => mT + (1 - (v - min) / (max - min || 1)) * (h - mT - mB);

  ticks.forEach(t => {
    svg.appendChild(svgNode("line", { x1: mL, x2: w - mR, y1: Y(t), y2: Y(t), stroke: V.grid, "stroke-width": 1 }));
    const tx = svgNode("text", { x: mL - 7, y: Y(t) + 3, "text-anchor": "end" });
    tx.textContent = fmtNum(t, trend.unit);
    svg.appendChild(tx);
  });
  const xStep = o.mini ? 3 : (w < 460 ? 2 : 1);
  MONTHS.slice(0, n).forEach((m, i) => {
    if (i % xStep) return;
    const tx = svgNode("text", { x: X(i), y: h - 6, "text-anchor": "middle" });
    tx.textContent = m;
    svg.appendChild(tx);
  });

  /* endpoint label slots — nudge apart when series converge at the right edge */
  const endYs = trend.series.map(s => Y(s.points[n - 1]) - 9);
  for (let a = 0; a < endYs.length; a++)
    for (let b = a + 1; b < endYs.length; b++)
      if (Math.abs(endYs[a] - endYs[b]) < 13) { if (endYs[b] > endYs[a]) endYs[b] = endYs[a] + 13; else endYs[b] = endYs[a] - 13; }

  const anim = canAnim(container);
  trend.series.forEach((s, si) => {
    const col = V.series[si];
    const d = s.points.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
    if (si === 0) {
      const base = Y(Math.max(min, 0));
      const area = svgNode("path", { d: d + ` L${X(n - 1).toFixed(1)} ${base} L${X(0).toFixed(1)} ${base} Z`, fill: col, opacity: 0.1 });
      svg.appendChild(area);
      if (anim) fadeIn(area, 350);
    }
    const line = svgNode("path", { d, fill: "none", stroke: col, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" });
    svg.appendChild(line);
    if (anim) drawLine(line, si * 160);
    const last = s.points[n - 1];
    const dot = svgNode("circle", { cx: X(n - 1), cy: Y(last), r: 4, fill: col, stroke: V.surface, "stroke-width": 2 });
    svg.appendChild(dot);
    if (anim) fadeIn(dot, 700 + si * 160);
    if (!o.mini) {
      const lb = svgNode("text", { x: X(n - 1) - 6, y: endYs[si], "text-anchor": "end", class: "lbl" });
      lb.textContent = fmtNum(last, trend.unit);
      svg.appendChild(lb);
      if (anim) fadeIn(lb, 780 + si * 160);
    }
  });

  const cross = svgNode("line", { y1: mT, y2: h - mB, stroke: V.cross, "stroke-width": 1, visibility: "hidden" });
  svg.appendChild(cross);
  const dots = trend.series.map((s, si) => {
    const c = svgNode("circle", { r: 4.5, fill: V.series[si], stroke: V.surface, "stroke-width": 2, visibility: "hidden" });
    svg.appendChild(c); return c;
  });
  const hit = svgNode("rect", { x: mL, y: 0, width: Math.max(1, w - mL - mR), height: h, fill: "transparent" });
  hit.style.cursor = "crosshair";
  hit.addEventListener("pointermove", e => {
    const r = svg.getBoundingClientRect();
    const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) - mL) / ((w - mL - mR) / (n - 1)))));
    cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i));
    cross.setAttribute("visibility", "visible");
    dots.forEach((d, si) => { d.setAttribute("cx", X(i)); d.setAttribute("cy", Y(trend.series[si].points[i])); d.setAttribute("visibility", "visible"); });
    tipShow(e.clientX, e.clientY, MONTHS[i] + (i < 4 ? " 2025" : " 2026"),
      trend.series.map((s, si) => ({ color: V.series[si], name: s.name, value: fmtNum(s.points[i], trend.unit) })));
  });
  hit.addEventListener("pointerleave", () => {
    cross.setAttribute("visibility", "hidden");
    dots.forEach(d => d.setAttribute("visibility", "hidden"));
    tipHide();
  });
  svg.appendChild(hit);
  container.appendChild(svg);
  if (trend.series.length > 1) container.appendChild(legendRow(trend.series.map((s, i) => ({ name: s.name, color: V.series[i] })), "line"));
}

/* ---------- donut ---------- */
function renderDonut(container, donut, opts) {
  const o = opts || {};
  container.textContent = "";
  const V = VIZ();
  const wrap = el("div");
  wrap.style.cssText = "display:flex;align-items:center;gap:14px;min-width:0";
  const sz = o.mini ? 128 : 158, R = sz / 2, r0 = R - (o.mini ? 15 : 19), cx = R, cy = R;
  const svg = svgNode("svg", { class: "viz", width: sz, height: sz, viewBox: `0 0 ${sz} ${sz}`, style: "flex:none;width:" + sz + "px" });
  const total = donut.segments.reduce((a, s) => a + s.value, 0);
  let a0 = -Math.PI / 2;
  const arcs = [];
  const anim = canAnim(container);
  donut.segments.forEach((seg, i) => {
    const frac = seg.value / total;
    const a1 = a0 + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const p0 = [cx + R * Math.cos(a0), cy + R * Math.sin(a0)];
    const p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)];
    const q1 = [cx + r0 * Math.cos(a1), cy + r0 * Math.sin(a1)];
    const q0 = [cx + r0 * Math.cos(a0), cy + r0 * Math.sin(a0)];
    const d = `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)} A${R} ${R} 0 ${large} 1 ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} L${q1[0].toFixed(2)} ${q1[1].toFixed(2)} A${r0} ${r0} 0 ${large} 0 ${q0[0].toFixed(2)} ${q0[1].toFixed(2)} Z`;
    /* 2px surface gap between segments via surface-colored stroke */
    const path = svgNode("path", { d, fill: V.series[i % V.series.length], stroke: V.surface, "stroke-width": 2, "stroke-linejoin": "round" });
    path.style.transition = "opacity 140ms ease, transform 140ms ease";
    path.style.transformOrigin = cx + "px " + cy + "px";
    const mid = (a0 + a1) / 2;
    path.addEventListener("pointermove", e => {
      arcs.forEach(a => a.style.opacity = a === path ? 1 : 0.42);
      path.style.transform = `translate(${Math.cos(mid) * 2.5}px,${Math.sin(mid) * 2.5}px)`;
      tipShow(e.clientX, e.clientY, donut.title, [{ color: V.series[i % V.series.length], name: seg.label, value: fmtNum(seg.value, donut.unit) + " · " + Math.round(frac * 100) + "%" }]);
    });
    path.addEventListener("pointerleave", () => {
      arcs.forEach(a => a.style.opacity = 1); path.style.transform = "none"; tipHide();
    });
    svg.appendChild(path); arcs.push(path);
    if (anim) fadeIn(path, i * 75, "opacity 140ms ease, transform 140ms ease");
    a0 = a1;
  });
  const ct = svgNode("text", { x: cx, y: cy - 2, "text-anchor": "middle", class: "lbl-strong" });
  ct.textContent = /%/.test(donut.unit || "") ? "100%" : fmtNum(total, donut.unit);
  const cs = svgNode("text", { x: cx, y: cy + 14, "text-anchor": "middle" });
  cs.textContent = "total";
  svg.appendChild(ct); svg.appendChild(cs);
  wrap.appendChild(svg);

  const lg = el("div");
  lg.style.cssText = "display:flex;flex-direction:column;gap:5px;min-width:0;flex:1";
  donut.segments.forEach((seg, i) => {
    const row = el("div", "lg-item");
    row.style.cssText = "display:flex;align-items:center;gap:7px;font-size:11.5px;min-width:0";
    const k = el("i", "lg-rect"); k.style.background = V.series[i % V.series.length]; k.style.flex = "none";
    const name = el("span", "", seg.label);
    name.style.cssText = "color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0";
    const val = el("b", "", fmtNum(seg.value, donut.unit));
    val.style.cssText = "margin-left:auto;font-variant-numeric:tabular-nums;padding-left:8px";
    row.append(k, name, val);
    lg.appendChild(row);
  });
  wrap.appendChild(lg);
  container.appendChild(wrap);
}

/* ---------- bars: grouped columns, negatives = polarity ---------- */
function renderBars(container, bars, opts) {
  const o = opts || {};
  container.textContent = "";
  const V = VIZ();
  const w = container.clientWidth || 420;
  const h = o.h || (o.mini ? 150 : 196);
  const mL = 42, mR = 8, mT = 12, mB = 40;
  const svg = svgNode("svg", { class: "viz", width: w, height: h, viewBox: `0 0 ${w} ${h}` });
  const all = bars.series.flatMap(s => s.values);
  const hasNeg = Math.min(...all) < 0;
  let min = Math.min(0, ...all), max = Math.max(0, ...all);
  const ticks = niceTicks(min, max * 1.08 || 1, o.mini ? 3 : 4);
  min = ticks[0]; max = ticks[ticks.length - 1];
  const Y = v => mT + (1 - (v - min) / (max - min || 1)) * (h - mT - mB);
  const nCat = bars.categories.length, nSer = bars.series.length;
  const band = (w - mL - mR) / nCat;
  const barW = Math.min(24, (band * 0.62) / nSer);
  const gap = 2; /* surface gap between touching bars in a group */

  ticks.forEach(t => {
    svg.appendChild(svgNode("line", { x1: mL, x2: w - mR, y1: Y(t), y2: Y(t), stroke: t === 0 ? V.zero : V.grid, "stroke-width": 1 }));
    const tx = svgNode("text", { x: mL - 7, y: Y(t) + 3, "text-anchor": "end" });
    tx.textContent = fmtNum(t, bars.unit);
    svg.appendChild(tx);
  });

  let extIdx = 0; all.forEach((v, i) => { if (Math.abs(v) > Math.abs(all[extIdx])) extIdx = i; });

  const anim = canAnim(container);
  bars.categories.forEach((cat, ci) => {
    const groupW = nSer * barW + (nSer - 1) * gap;
    const gx = mL + band * ci + (band - groupW) / 2;
    bars.series.forEach((s, si) => {
      const v = s.values[ci];
      const col = hasNeg && nSer === 1 ? (v >= 0 ? V.series[0] : V.neg) : V.series[si];
      const x = gx + si * (barW + gap);
      const y0 = Y(0), y1 = Y(v);
      const top = Math.min(y0, y1), bh = Math.max(2, Math.abs(y0 - y1));
      const rad = Math.min(4, bh / 2);
      /* rounded at the data end, square at the baseline */
      let d;
      if (v >= 0) d = `M${x} ${top + bh} V${top + rad} Q${x} ${top} ${x + rad} ${top} H${x + barW - rad} Q${x + barW} ${top} ${x + barW} ${top + rad} V${top + bh} Z`;
      else d = `M${x} ${top} V${top + bh - rad} Q${x} ${top + bh} ${x + rad} ${top + bh} H${x + barW - rad} Q${x + barW} ${top + bh} ${x + barW} ${top + bh - rad} V${top} Z`;
      const p = svgNode("path", { d, fill: col });
      p.style.transition = "opacity 120ms ease";
      const idx = si * nCat + ci;
      p.addEventListener("pointermove", e => {
        $$("path", svg).forEach(q => { if (q.__bar) q.style.opacity = q === p ? 1 : 0.45; });
        tipShow(e.clientX, e.clientY, cat, bars.series.map((ss, ssi) => ({
          color: hasNeg && nSer === 1 ? (ss.values[ci] >= 0 ? V.series[0] : V.neg) : V.series[ssi],
          name: ss.name, value: fmtNum(ss.values[ci], bars.unit),
        })));
      });
      p.addEventListener("pointerleave", () => { $$("path", svg).forEach(q => { if (q.__bar) q.style.opacity = 1; }); tipHide(); });
      p.__bar = true;
      svg.appendChild(p);
      if (anim) riseIn(p, ci * 32 + si * 16, "opacity 120ms ease");
      if (!o.mini && si * nCat + ci === extIdx && Math.abs(all[idx]) === Math.abs(all[extIdx])) {
        const lb = svgNode("text", { x: x + barW / 2, y: v >= 0 ? top - 5 : top + bh + 11, "text-anchor": "middle", class: "lbl" });
        lb.textContent = fmtNum(v, bars.unit);
        svg.appendChild(lb);
      }
    });
    const short = cat.length > Math.max(6, band / 6.4) ? cat.slice(0, Math.max(5, band / 6.4 - 1)) + "…" : cat;
    const tx = svgNode("text", { x: mL + band * ci + band / 2, y: h - 22, "text-anchor": "middle" });
    tx.textContent = short;
    svg.appendChild(tx);
  });
  container.appendChild(svg);
  if (nSer > 1) container.appendChild(legendRow(bars.series.map((s, i) => ({ name: s.name, color: V.series[i] })), "rect"));
  else if (hasNeg) container.appendChild(legendRow([{ name: "above plan", color: V.series[0] }, { name: "below plan", color: V.neg }], "rect"));
}

/* ---------- heatmap: single-hue sequential, theme-aware ramp ---------- */
function heatColor(t) {
  const stops = VIZ().heat;
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x)), f = x - i;
  const c = stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function renderHeatmap(container, hm, opts) {
  const o = opts || {};
  container.textContent = "";
  const w = container.clientWidth || 520;
  const rows = hm.rows.length, cols = hm.cols.length;
  const mL = 54, mT = 4, mB = 20, mR = 4;
  const cellH = o.mini ? 16 : 21;
  const h = mT + rows * cellH + mB;
  const svg = svgNode("svg", { class: "viz", width: w, height: h, viewBox: `0 0 ${w} ${h}` });
  const cellW = (w - mL - mR) / cols;
  const flat = hm.values.flat();
  const vMin = Math.min(...flat), vMax = Math.max(...flat);
  const anim = canAnim(container);
  hm.rows.forEach((rl, ri) => {
    const tx = svgNode("text", { x: mL - 8, y: mT + ri * cellH + cellH / 2 + 3, "text-anchor": "end" });
    tx.textContent = rl.length > 8 ? rl.slice(0, 7) + "…" : rl;
    svg.appendChild(tx);
    hm.cols.forEach((cl, ci) => {
      const v = hm.values[ri][ci];
      const t = (v - vMin) / (vMax - vMin || 1);
      const rect = svgNode("rect", {
        x: mL + ci * cellW + 1, y: mT + ri * cellH + 1,
        width: Math.max(1, cellW - 2), height: cellH - 2,
        rx: 4, fill: heatColor(t),
      });
      rect.style.transition = "opacity 120ms";
      rect.addEventListener("pointermove", e => {
        $$("rect", svg).forEach(q => q.style.opacity = q === rect ? 1 : 0.55);
        tipShow(e.clientX, e.clientY, rl + " · " + cl, [{ name: hm.unit || "value", value: fmtNum(v, ""), color: heatColor(t) }]);
      });
      rect.addEventListener("pointerleave", () => { $$("rect", svg).forEach(q => q.style.opacity = 1); tipHide(); });
      svg.appendChild(rect);
      if (anim) fadeIn(rect, Math.min(560, (ri + ci) * 26), "opacity 120ms");
    });
  });
  const colStep = Math.ceil(cols / Math.max(4, Math.floor((w - mL) / 52)));
  hm.cols.forEach((cl, ci) => {
    if (ci % colStep) return;
    const tx = svgNode("text", { x: mL + ci * cellW + cellW / 2, y: h - 6, "text-anchor": "middle" });
    tx.textContent = cl;
    svg.appendChild(tx);
  });
  container.appendChild(svg);
}

/* ---------- joined chart: series from different MCP servers on one indexed axis ---------- */
function renderJoined(container, joined, opts) {
  const o = opts || {};
  container.textContent = "";
  const V = VIZ();
  const w = container.clientWidth || 640;
  const h = o.h || (o.mini ? 158 : 238);
  const mL = 46, mR = 14, mT = 24, mB = 22;
  const svg = svgNode("svg", { class: "viz", width: w, height: h, viewBox: `0 0 ${w} ${h}` });
  const n = 12;
  /* index every series to 100 at Sep — one honest axis across different units */
  const idx = joined.series.map(s => {
    const base = s.points[0] || s.points.find(v => v !== 0) || 1;
    return s.points.map(v => (v / base) * 100);
  });
  const flat = idx.flat();
  let min = Math.min(...flat), max = Math.max(...flat);
  const pad = (max - min || 10) * 0.14;
  min -= pad; max += pad;
  const ticks = niceTicks(min, max, o.mini ? 3 : 4);
  min = ticks[0]; max = ticks[ticks.length - 1];
  const X = i => mL + (i / (n - 1)) * (w - mL - mR);
  const Y = v => mT + (1 - (v - min) / (max - min || 1)) * (h - mT - mB);

  /* annotation band — the divergence window, behind everything */
  const an = joined.annotation;
  if (an && !o.mini) {
    const x0 = X(Math.max(0, an.from)), x1 = X(Math.min(11, an.to));
    const band = svgNode("rect", { x: x0, y: mT, width: Math.max(4, x1 - x0), height: h - mT - mB, rx: 6 });
    band.style.fill = "var(--acc)"; band.style.opacity = "0.07";
    svg.appendChild(band);
    const edge = svgNode("line", { x1: x0, x2: x0, y1: mT, y2: h - mB, "stroke-width": 1 });
    edge.style.stroke = "var(--acc)"; edge.style.opacity = "0.35";
    svg.appendChild(edge);
    const flag = svgNode("text", { x: x0 + 6, y: mT - 8, class: "lbl" });
    flag.textContent = "⚡ " + an.label;
    flag.style.fill = "var(--acc-ink)";
    svg.appendChild(flag);
  }

  ticks.forEach(t => {
    svg.appendChild(svgNode("line", { x1: mL, x2: w - mR, y1: Y(t), y2: Y(t), stroke: V.grid, "stroke-width": 1 }));
    const tx = svgNode("text", { x: mL - 7, y: Y(t) + 3, "text-anchor": "end" });
    tx.textContent = String(Math.round(t));
    svg.appendChild(tx);
  });
  MONTHS.forEach((m, i) => {
    if (o.mini && i % 3) return;
    if (!o.mini && w < 520 && i % 2) return;
    const tx = svgNode("text", { x: X(i), y: h - 6, "text-anchor": "middle" });
    tx.textContent = m;
    svg.appendChild(tx);
  });

  /* endpoint label slots with collision nudge */
  const endYs = idx.map(s => Y(s[n - 1]) - 9);
  for (let a = 0; a < endYs.length; a++)
    for (let b = a + 1; b < endYs.length; b++)
      if (Math.abs(endYs[a] - endYs[b]) < 13) { if (endYs[b] > endYs[a]) endYs[b] = endYs[a] + 13; else endYs[b] = endYs[a] - 13; }

  const anim = canAnim(container);
  joined.series.forEach((s, si) => {
    const col = V.series[si];
    const d = idx[si].map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
    const line = svgNode("path", { d, fill: "none", stroke: col, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" });
    svg.appendChild(line);
    if (anim) drawLine(line, si * 200);
    const dot = svgNode("circle", { cx: X(n - 1), cy: Y(idx[si][n - 1]), r: 4, fill: col, stroke: V.surface, "stroke-width": 2 });
    svg.appendChild(dot);
    if (anim) fadeIn(dot, 800 + si * 200);
    if (!o.mini) {
      const lb = svgNode("text", { x: X(n - 1) - 6, y: endYs[si], "text-anchor": "end", class: "lbl" });
      lb.textContent = fmtNum(s.points[n - 1], s.unit);
      svg.appendChild(lb);
      if (anim) fadeIn(lb, 880 + si * 200);
    }
  });

  const cross = svgNode("line", { y1: mT, y2: h - mB, stroke: V.cross, "stroke-width": 1, visibility: "hidden" });
  svg.appendChild(cross);
  const dots = joined.series.map((s, si) => {
    const c = svgNode("circle", { r: 4.5, fill: V.series[si], stroke: V.surface, "stroke-width": 2, visibility: "hidden" });
    svg.appendChild(c); return c;
  });
  const hit = svgNode("rect", { x: mL, y: 0, width: Math.max(1, w - mL - mR), height: h, fill: "transparent" });
  hit.style.cursor = "crosshair";
  hit.addEventListener("pointermove", e => {
    const r = svg.getBoundingClientRect();
    const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) - mL) / ((w - mL - mR) / (n - 1)))));
    cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i));
    cross.setAttribute("visibility", "visible");
    dots.forEach((d, si) => { d.setAttribute("cx", X(i)); d.setAttribute("cy", Y(idx[si][i])); d.setAttribute("visibility", "visible"); });
    tipShow(e.clientX, e.clientY, MONTHS[i] + (i < 4 ? " 2025" : " 2026"),
      joined.series.map((s, si) => ({ color: V.series[si], name: s.name, value: fmtNum(s.points[i], s.unit) + " · " + Math.round(idx[si][i]) })));
  });
  hit.addEventListener("pointerleave", () => {
    cross.setAttribute("visibility", "hidden");
    dots.forEach(d => d.setAttribute("visibility", "hidden"));
    tipHide();
  });
  svg.appendChild(hit);
  container.appendChild(svg);

  /* legend: color key + source-server glyph per series — the point of the chart */
  const lg = el("div", "legend jlg");
  joined.series.forEach((s, si) => {
    const item = el("span", "lg-item");
    const key = el("i", "lg-line"); key.style.borderColor = V.series[si];
    item.appendChild(key);
    item.appendChild(srvGlyph(s.server, 15));
    item.appendChild(document.createTextNode(s.name));
    item.appendChild(el("span", "jlg-via", "via " + (SERVERS[s.server] ? SERVERS[s.server].name : s.server) + " · " + s.unit));
    lg.appendChild(item);
  });
  lg.appendChild(el("span", "jlg-idx", "one axis · indexed, Sep = 100"));
  container.appendChild(lg);
}

/* ---------- goals: meters ---------- */
function renderGoals(container, goals) {
  container.textContent = "";
  goals.forEach(g => {
    const d = el("div", "goal");
    const top = el("div", "goal-top");
    top.appendChild(el("b", "", g.label));
    top.appendChild(el("span", "goal-pct", g.pct + "%"));
    const track = el("div", "goal-track");
    const fill = el("div", "goal-fill");
    fill.style.width = "0%";
    track.appendChild(fill);
    d.append(top, track, el("div", "goal-detail", g.detail));
    container.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = Math.min(100, g.pct) + "%"; }));
  });
}

/* ---------- table-view twins ---------- */
function buildTable(kind, data) {
  const wrap = el("div", "dtable-wrap");
  const tb = el("table", "dtable");
  const thead = el("thead"); const hr = el("tr");
  const tbody = el("tbody");
  const addRow = (cells, head) => {
    const tr = el("tr");
    cells.forEach(c => tr.appendChild(el(head ? "th" : "td", "", c)));
    (head ? thead : tbody).appendChild(tr);
    return tr;
  };
  if (kind === "trend") {
    hr.append(el("th", "", "Month"), ...data.series.map(s => el("th", "", s.name)));
    thead.appendChild(hr);
    MONTHS.forEach((m, i) => addRow([m, ...data.series.map(s => fmtNum(s.points[i], data.unit))]));
  } else if (kind === "bars") {
    hr.append(el("th", "", "Category"), ...data.series.map(s => el("th", "", s.name)));
    thead.appendChild(hr);
    data.categories.forEach((c, i) => addRow([c, ...data.series.map(s => fmtNum(s.values[i], data.unit))]));
  } else if (kind === "donut") {
    const total = data.segments.reduce((a, s) => a + s.value, 0);
    hr.append(el("th", "", "Segment"), el("th", "", "Value"), el("th", "", "Share"));
    thead.appendChild(hr);
    data.segments.forEach(s => addRow([s.label, fmtNum(s.value, data.unit), Math.round(s.value / total * 100) + "%"]));
  } else if (kind === "heatmap") {
    hr.append(el("th", "", ""), ...data.cols.map(c => el("th", "", c)));
    thead.appendChild(hr);
    data.rows.forEach((r, ri) => addRow([r, ...data.values[ri].map(v => String(v))]));
  } else if (kind === "joined") {
    hr.append(el("th", "", "Month"), ...data.series.map(s => el("th", "", s.name + " (" + s.unit + ")")));
    thead.appendChild(hr);
    MONTHS.forEach((m, i) => addRow([m, ...data.series.map(s => fmtNum(s.points[i], s.unit))]));
  }
  tb.append(thead, tbody);
  wrap.appendChild(tb);
  return wrap;
}
