/* ============================================================
   FoW · studio-wireframe — THE WIREFRAME
   The whole idea on one screen, keynote-simple:
   See (three charts) · Act (three things that need you) ·
   Hand off (three jobs for the agent) · Ask (the chat).
   Anything can be dragged into the chat.
   ============================================================ */
"use strict";

/* line-art placeholder face: circle head, shoulders, nothing else */
if (typeof AVATARS !== "undefined") {
  AVATARS.wireframe =
    '<svg viewBox="0 0 120 120" aria-label="Wireframe">' +
    '<rect x="1" y="1" width="118" height="118" rx="59" fill="#fff" stroke="#111" stroke-width="2"/>' +
    '<circle cx="60" cy="48" r="17" fill="none" stroke="#111" stroke-width="2.5"/>' +
    '<path d="M27 100c4-19 17-29 33-29s29 10 33 29" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>' +
    '</svg>';
}

const WFK = { demoed: false };

/* ---------- three charts, drawn as plainly as a chart can be ---------- */
function wfkLine(points) {
  const w = 200, h = 64, pad = 5;
  const lo = Math.min(...points), hi = Math.max(...points), span = hi - lo || 1;
  const X = i => pad + (i / (points.length - 1)) * (w - pad * 2);
  const Y = v => h - pad - ((v - lo) / span) * (h - pad * 2);
  const d = points.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
  const n = points.length - 1;
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="' + d + '" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
    '</svg><i class="wfk-dot" style="left:' + (X(n) / w * 100) + '%;top:' + (Y(points[n]) / h * 100) + '%"></i>';
}
function wfkBars(values) {
  const w = 200, h = 64, gap = 10;
  const hi = Math.max(0, ...values), lo = Math.min(0, ...values), span = hi - lo || 1;
  const bw = (w - gap * (values.length - 1)) / values.length;
  const zero = (hi / span) * h;
  let out = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">';
  values.forEach((v, i) => {
    const bh = Math.abs(v) / span * h;
    out += '<rect x="' + (i * (bw + gap)).toFixed(1) + '" y="' + (v >= 0 ? zero - bh : zero).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, bh).toFixed(1) + '" fill="' + (v >= 0 ? "#111" : "#c4c4c4") + '"/>';
  });
  return out + '<line x1="0" x2="' + w + '" y1="' + zero.toFixed(1) + '" y2="' + zero.toFixed(1) + '" stroke="#111" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>';
}
function wfkDonut(segments) {
  const r = 26, C = 2 * Math.PI * r, tones = ["#111", "#8c8c8c", "#c4c4c4", "#e6e6e6"];
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let off = 0, out = '<svg viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(-90 32 32)">';
  segments.forEach((s, i) => {
    const len = s.value / total * C;
    out += '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + tones[i % tones.length] + '" stroke-width="10" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"/>';
    off += len;
  });
  return out + '</g></svg>';
}

/* ---------- one tile: a word, a number, a picture ---------- */
function wfkTile(o) {
  const t = el("article", "wfk-tile" + (o.cls ? " " + o.cls : ""));
  t.tabIndex = 0;
  t.appendChild(el("div", "wfk-label", o.label));
  if (o.big) t.appendChild(el("div", "wfk-big", o.big));
  if (o.line) t.appendChild(el("div", "wfk-line", o.line));
  if (o.pic) { const pic = el("div", "wfk-pic" + (o.picCls ? " " + o.picCls : "")); pic.innerHTML = o.pic; t.appendChild(pic); }
  const ask = () => { attachChip(o.chip); sendMessage(o.ask); };
  t.addEventListener("click", e => { if (!e.target.closest("button")) ask(); });
  t.addEventListener("keydown", e => { if (e.key === "Enter") ask(); });
  t.title = "Click to ask, or drag into the chat";
  makeDraggable(t, o.chip);
  return t;
}
function wfkRow(cv, verb, hint) {
  const sec = el("section", "wfk-row");
  const h = el("div", "wfk-verb");
  h.appendChild(el("b", "", verb));
  if (hint) h.appendChild(el("span", "", hint));
  sec.appendChild(h);
  const grid = el("div", "wfk-grid");
  sec.appendChild(grid);
  cv.appendChild(sec);
  return grid;
}

function renderStudio_wireframe(p, cv) {
  clearCharts();
  state.cardIndex = 0;
  cv.textContent = "";
  cv.className = "wfk";

  /* ---- the one sentence ---- */
  const pending = FOW.pendingApprovals();
  const hero = el("header", "wfk-hero");
  hero.appendChild(el("h1", "", greeting() + ", " + p.user.name.split(" ")[0] + "."));
  hero.appendChild(el("p", "", "Three things need you. For everything else, just ask."));
  const hint = el("div", "wfk-hint");
  hint.appendChild(el("span", "wfk-hint-box"));
  hint.appendChild(el("span", "", "Drag anything into the chat to ask about it"));
  hint.appendChild(el("span", "wfk-hint-arrow", "→"));
  hero.appendChild(hint);
  cv.appendChild(hero);

  /* ---- See ---- */
  const see = wfkRow(cv, "See", "your numbers, at a glance");
  const rev = p.kpis[0], cost = p.kpis[1];
  see.appendChild(wfkTile({
    label: rev.label, big: rev.value, line: rev.delta + " " + (rev.vs || ""),
    pic: wfkLine(p.trend.series[0].points), picCls: "is-line",
    chip: { type: "trend", label: p.trend.title, data: { title: p.trend.title } },
    ask: "What's driving this?",
  }));
  see.appendChild(wfkTile({
    label: "Cost vs plan", big: cost.delta, line: "by team, July",
    pic: wfkBars(p.bars.series[0].values),
    chip: { type: "bars", label: p.bars.title, data: { title: p.bars.title } },
    ask: "Why is operating cost over plan?",
  }));
  const top = p.donut.segments[0];
  see.appendChild(wfkTile({
    label: "Where it goes", big: top.value + "%", line: top.label.toLowerCase(),
    pic: wfkDonut(p.donut.segments), picCls: "is-donut",
    chip: { type: "donut", label: p.donut.title, data: { title: p.donut.title } },
    ask: "Break this down for me",
  }));

  /* ---- Act ---- */
  const act = wfkRow(cv, "Act", "only what needs you today");
  const mt = p.meetings.slice().sort((a, b) => b.attendees.length - a.attendees.length)[0];
  act.appendChild(wfkTile({
    cls: "is-thing", label: "Meeting", big: mt.time, line: mt.title,
    chip: { type: "meeting", label: mt.time + " · " + mt.title, data: mt },
    ask: "Prep me for this meeting",
  }));
  const msg = p.inbox.find(i => i.urgent) || p.inbox[0];
  act.appendChild(wfkTile({
    cls: "is-thing", label: "Message", big: msg.from.split(" ")[0], line: msg.subject,
    chip: { type: "mail", label: msg.from + ": " + msg.subject, data: msg },
    ask: "Summarize this and draft a reply",
  }));
  const ap = pending.find(a => a.urgency === "high") || pending[0] || p.approvals[0];
  const apTile = wfkTile({
    cls: "is-thing", label: "Approval", big: ap.amount ? ap.amount.replace(/,000$/, "K") : ap.type, line: ap.title,
    chip: { type: "approval", label: ap.type + ": " + ap.title, data: ap },
    ask: "Should I approve this?",
  });
  apTile.dataset.approval = ap.id;
  const done = (state.approved[state.personaId] || new Set()).has(ap.id);
  const ok = el("button", "wfk-btn", done ? "Approved ✓" : "Approve");
  ok.disabled = done;
  ok.addEventListener("click", () => {
    FOW.approve(ap.id, true);
    ok.textContent = "Approved ✓"; ok.disabled = true;
    toast("Approved — " + ap.requester + " notified");
  });
  apTile.appendChild(ok);
  act.appendChild(apTile);

  /* ---- Hand off ---- */
  const off = wfkRow(cv, "Hand off", "the agent does it, then reports back");
  off.classList.add("wfk-list");
  (p.delegations || []).forEach(d => {
    const doneAlready = (state.delegated[state.personaId] || {})[d.id];
    const it = el("div", "dg-item wfk-job");
    const orb = askmeAv(26); orb.classList.add("dg-orb");
    it.appendChild(orb);
    const bd = el("div", "dg-body");
    bd.appendChild(el("div", "dg-label", d.label));
    const sub = el("div", "dg-sub", doneAlready ? d.result : "");
    bd.appendChild(sub);
    const prog = el("div", "dg-prog"); prog.hidden = true;
    const fill = el("i"); prog.appendChild(fill);
    bd.appendChild(prog);
    it.appendChild(bd);
    const stateBox = el("span", "dg-state");
    if (doneAlready) stateBox.appendChild(el("span", "dg-pill done", "done"));
    else {
      const btn = el("button", "wfk-btn", "Hand off");
      btn.addEventListener("click", () => runDelegation(d, { orb, sub, prog, fill, stateBox, btn, bd }));
      stateBox.appendChild(btn);
    }
    it.appendChild(stateBox);
    off.appendChild(it);
  });

  updateBadges();
  wfkDemo();
}

/* ---------- show, don't tell: one tile glides into the chat, once ---------- */
function wfkDemo() {
  if (WFK.demoed) return;
  WFK.demoed = true;
  if (FX.reduced || (typeof PRESENT !== "undefined" && PRESENT.on)) return;
  setTimeout(() => {
    const tile = $(".wfk-tile"), target = $(".cd-composer");
    if (!tile || !target || !wfOn() || $("#frame").classList.contains("chat-hidden")) return;
    const a = tile.getBoundingClientRect(), b = target.getBoundingClientRect();
    const g = el("div", "drag-ghost fly");
    const icon = ico("chart"); icon.className = "ck-ico";
    g.appendChild(icon);
    g.appendChild(el("span", "", "Revenue — what's driving this?"));
    g.style.left = (a.left + a.width / 2) + "px"; g.style.top = (a.top + a.height / 2) + "px";
    fxLayer().appendChild(g);
    tile.classList.add("wfk-lift");
    const dx = b.left + 120 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    g.animate([
      { transform: "translate(-50%,-50%) scale(0.9)", opacity: 0 },
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: 0.15 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 50}px))`, opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.85)`, opacity: 0 },
    ], { duration: 1900, easing: "cubic-bezier(.4,.1,.3,1)" }).onfinish = () => {
      g.remove();
      tile.classList.remove("wfk-lift");
      const dock = $("#chatdock");
      dock.classList.add("wfk-invite");
      sparkleAt(b.left + 120, b.top + b.height / 2, { n: 6, d: 22 });
      setTimeout(() => dock.classList.remove("wfk-invite"), 900);
    };
  }, 1400);
}
window.renderStudio_wireframe = renderStudio_wireframe;
