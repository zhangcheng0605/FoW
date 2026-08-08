/* ============================================================
   FoW · fx — the motion identity
   Everything responds to touch; important moments celebrate.
   Click sparkles, drag-and-snap physics, cursor-tracked card
   glow, paper-plane sends. All honor prefers-reduced-motion.
   ============================================================ */
"use strict";

const FX = {
  layer: null,
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
};

function fxLayer() {
  if (!FX.layer) {
    FX.layer = el("div");
    FX.layer.id = "fxlayer";
    document.body.appendChild(FX.layer);
  }
  return FX.layer;
}

/* ---------------- sparkles & rings ---------------- */
function sparkleAt(x, y, opts) {
  if (FX.reduced) return;
  const o = opts || {};
  const n = o.n || 5;
  const layer = fxLayer();
  const acc = getComputedStyle(document.body).getPropertyValue("--acc").trim() || "#2563eb";
  const palette = o.colors || [acc, "#8b5cf6", "#f59e0b", "#10b981"];
  for (let i = 0; i < n; i++) {
    const star = i % 2 === 0;
    const s = el("span", "fx-p", star ? "✦" : "");
    if (!star) { s.classList.add("dot"); s.style.background = palette[i % palette.length]; }
    else s.style.color = palette[i % palette.length];
    s.style.left = x + "px"; s.style.top = y + "px";
    s.style.fontSize = (7 + Math.random() * 6) + "px";
    layer.appendChild(s);
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.9;
    const d = (o.d || 26) + Math.random() * (o.d || 26);
    s.animate([
      { transform: "translate(-50%,-50%) scale(0.4) rotate(0deg)", opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 8}px)) scale(1.1) rotate(${90 + Math.random() * 180}deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.5}px), calc(-50% + ${Math.sin(a) * d * 1.5 + 6}px)) scale(0.2) rotate(200deg)`, opacity: 0 },
    ], { duration: 520 + Math.random() * 260, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => s.remove();
  }
  if (o.ring !== false) {
    const r = el("span", "fx-ring");
    r.style.left = x + "px"; r.style.top = y + "px";
    layer.appendChild(r);
    r.animate([
      { transform: "translate(-50%,-50%) scale(0.3)", opacity: 0.55 },
      { transform: "translate(-50%,-50%) scale(2.6)", opacity: 0 },
    ], { duration: 480, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => r.remove();
  }
}

/* global press feedback — small for any button, a burst for primary actions */
document.addEventListener("pointerdown", e => {
  const big = e.target.closest(".cd-send, .ap-ok, .dg-btn, .hstat.primary, .ob-play, .m-act, .ins-panel");
  const small = big || e.target.closest("button, .hstat, .sg, .ob-card, .rail-item, .chn-item");
  if (!small) return;
  sparkleAt(e.clientX, e.clientY, big ? { n: 9, d: 34 } : { n: 3, d: 18, ring: false });
}, { passive: true });

/* ---------------- drag: ghost, invitation, snap-in ---------------- */
function fxDragGhost(chip) {
  const g = el("div", "drag-ghost");
  const icon = ico(chipIcon(chip.type)); icon.className = "ck-ico";
  g.appendChild(icon);
  g.appendChild(el("span", "", chip.label.length > 34 ? chip.label.slice(0, 33) + "…" : chip.label));
  g.style.position = "fixed"; g.style.top = "-200px"; g.style.left = "-200px";
  document.body.appendChild(g);
  setTimeout(() => g.remove(), 60);
  return g;
}
function fxDragBegin() {
  document.body.classList.add("dragging-chip");
  if (PET.el) PET.el.classList.add("excited");
}
function fxDragEnd() {
  document.body.classList.remove("dragging-chip");
  if (PET.el) PET.el.classList.remove("excited");
}
/* the snap: a chip flies from the drop point into the composer, lands with a pop */
function fxSnapChip(chip, fromX, fromY, onLand) {
  const target = $("#cdChips") || $(".cd-composer");
  if (FX.reduced || !target) { onLand(); return; }
  const tr = target.getBoundingClientRect();
  const tx = tr.left + 26, ty = tr.top + (tr.height ? tr.height / 2 : 8);
  const flier = el("div", "drag-ghost fly");
  const icon = ico(chipIcon(chip.type)); icon.className = "ck-ico";
  flier.appendChild(icon);
  flier.appendChild(el("span", "", chip.label.length > 30 ? chip.label.slice(0, 29) + "…" : chip.label));
  flier.style.left = fromX + "px"; flier.style.top = fromY + "px";
  fxLayer().appendChild(flier);
  const dx = tx - fromX, dy = ty - fromY;
  flier.animate([
    { transform: "translate(-50%,-50%) scale(1.05) rotate(0deg)", opacity: 1 },
    { transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.45 - 40}px)) scale(0.95) rotate(-3deg)`, opacity: 1, offset: 0.55 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6)`, opacity: 0.9 },
  ], { duration: 460, easing: "cubic-bezier(.3,.8,.3,1)" }).onfinish = () => {
    flier.remove();
    onLand();
    sparkleAt(tx, ty, { n: 6, d: 22 });
    const comp = $(".cd-composer");
    if (comp) { comp.classList.remove("flash"); void comp.offsetWidth; comp.classList.add("flash"); setTimeout(() => comp.classList.remove("flash"), 700); }
    petHop();
  };
}

/* ---------------- cursor-tracked card glow ---------------- */
(function cardGlow() {
  let raf = null;
  document.addEventListener("pointermove", e => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const c = e.target.closest ? e.target.closest(".card") : null;
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  }, { passive: true });
})();

/* ---------------- KPI count-up ---------------- */
function countUp(elm, str, ms) {
  const m = String(str).match(/^([^0-9\-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!m || FX.reduced) { elm.textContent = str; return; }
  const prefix = m[1], suffix = m[3];
  const target = parseFloat(m[2].replace(/,/g, ""));
  const decimals = (m[2].split(".")[1] || "").length;
  const hasComma = m[2].includes(",");
  const t0 = performance.now(), dur = ms || 750;
  const fmt = v => {
    let s2 = v.toFixed(decimals);
    if (hasComma) { const parts = s2.split("."); parts[0] = Number(parts[0]).toLocaleString("en-US"); s2 = parts.join("."); }
    return prefix + s2 + suffix;
  };
  const tick = now => {
    const t = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - t, 3);
    elm.textContent = fmt(target * e);
    if (t < 1) requestAnimationFrame(tick);
    else elm.textContent = str;
  };
  requestAnimationFrame(tick);
}

/* ---------------- send: paper plane launch ---------------- */
function fxSend() {
  const btn = $("#cdSend");
  if (!btn || FX.reduced) return;
  btn.classList.remove("fly"); void btn.offsetWidth; btn.classList.add("fly");
  setTimeout(() => btn.classList.remove("fly"), 620);
  const r = btn.getBoundingClientRect();
  sparkleAt(r.left + r.width / 2, r.top + r.height / 2, { n: 4, d: 20, ring: false });
}
