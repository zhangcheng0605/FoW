/* ============================================================
   FoW · the Crew — choreography engine
   Seven agent mascots (askMElah's children) in a shared office:
   they idle in character, walk to each other, huddle at the hub,
   pass real payloads hand to hand, and report back to their
   human at the desk. Delegations and chains dispatch missions
   here automatically.
   ============================================================ */
"use strict";

const CW = {
  root: null, open: false, busy: false,
  queue: Promise.resolve(),
  ambientTimer: null, blinkTimer: null, banterTimer: null,
  agents: {}, chip: null, huddle: null, hub: null, desk: null, log: null,
};

/* station layout (percent of stage) */
const CW_STATIONS = {
  hr: [9, 62], finance: [22, 70], procurement: [36, 62], it: [50, 70],
  legal: [64, 62], sales: [78, 70], marketing: [91, 62],
};
const CW_HUB = [50, 26];
const CW_DESK = [50, 88];

function cwMeta(id) {
  const fallbackNames = { hr: "Mei", finance: "Tally", procurement: "Hawk", it: "Patch", legal: "Clause", sales: "Bolt", marketing: "Neon" };
  let m = null;
  try { m = CREW_META.agents[id]; } catch (_) { }
  return m || { name: fallbackNames[id] || "Agent", idle: "bob", hello: "On it!", done: "Done —", motto: "askMElah crew" };
}
function cwDomainOf(server) {
  try { return CREW_META.domain[server] || null; } catch (_) { return null; }
}
function cwSprite(id) {
  const wrap = el("span", "cw-sprite idle-" + cwMeta(id).idle);
  let svg = null;
  try { svg = CREW_SVGS[id]; } catch (_) { }
  wrap.innerHTML = svg || LOGO_ASKME;
  return wrap;
}

/* which crewmates a set of steps pulls in (excluding the owner) */
function crewCollab(steps) {
  const owner = state.personaId;
  const ids = [];
  (steps || []).forEach(s => {
    const d = cwDomainOf(s.server);
    if (d && d !== owner && !ids.includes(d)) ids.push(d);
  });
  return ids.slice(0, 3).map(i => cwMeta(i).name).join(" + ") || null;
}

/* ---------------- scene construction ---------------- */
function crewBuild() {
  if (CW.root) return;
  const root = el("div");
  root.id = "crew";
  root.hidden = true;
  const back = el("div", "cw-back");
  back.addEventListener("click", crewClose);
  const panel = el("div", "cw-panel");

  const head = el("div", "cw-head");
  const hIco = el("span", "ch-ico");
  hIco.appendChild(ico("person"));
  const hT = el("div", "ch-title");
  hT.appendChild(el("div", "t", "The Crew"));
  hT.appendChild(el("div", "s", "seven agents, one office — they work across each other's systems while you watch"));
  const count = el("span", "cw-count", "7 agents · idle");
  const close = el("button", "ch-act", "✕");
  close.id = "crewClose";
  close.addEventListener("click", crewClose);
  head.append(hIco, hT, count, close);
  CW.count = count;

  const body = el("div", "cw-body");
  const stage = el("div", "cw-stage");

  const hub = el("div", "cw-hub");
  hub.innerHTML = LOGO_ASKME;
  hub.title = "askMElah — the mother agent";
  stage.appendChild(hub);
  CW.hub = hub;

  const desk = el("div", "cw-desk");
  stage.appendChild(desk);
  CW.desk = desk;

  PERSONAS.forEach(p => {
    const a = el("div", "cw-agent");
    a.dataset.agent = p.id;
    const [l, t] = CW_STATIONS[p.id] || [50, 65];
    a.style.left = l + "%"; a.style.top = t + "%";
    a.appendChild(cwSprite(p.id));
    const meta = cwMeta(p.id);
    a.appendChild(el("span", "cw-name", meta.name + " · " + p.name.split(" ")[0]));
    const bubble = el("span", "cw-bubble");
    bubble.hidden = true;
    a.appendChild(bubble);
    a.title = meta.motto;
    a.addEventListener("click", () => cwSay(p.id, meta.motto, 2600));
    stage.appendChild(a);
    CW.agents[p.id] = a;
  });

  const chip = el("span", "cw-chip");
  chip.hidden = true;
  stage.appendChild(chip);
  CW.chip = chip;

  const huddle = el("span", "cw-huddle");
  huddle.hidden = true;
  huddle.append(el("i"), el("i"), el("i"));
  const [hx, hy] = CW_HUB;
  huddle.style.left = hx + "%"; huddle.style.top = (hy + 13) + "%";
  stage.appendChild(huddle);
  CW.huddle = huddle;

  const log = el("aside", "cw-log");
  log.appendChild(el("div", "dw-sect", "crew log · live"));
  const items = el("div");
  log.appendChild(items);
  CW.log = items;

  body.append(stage, log);
  panel.append(head, body);
  root.append(back, panel);
  document.body.appendChild(root);
  CW.root = root;

  document.addEventListener("keydown", e => { if (e.key === "Escape" && !root.hidden) crewClose(); });
}

/* ---------------- primitives ---------------- */
const cwWait = ms => new Promise(r => setTimeout(r, ms));
const cwRM = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (_) { return false; } };
const cwMs = ms => cwRM() ? Math.min(ms, 200) : ms;

function cwRefreshDesk() {
  if (!CW.desk) return;
  CW.desk.textContent = "";
  const id = state.personaId || "finance";
  CW.desk.appendChild(avatarEl(id, 56));
  const meta = PERSONAS.find(x => x.id === id);
  CW.desk.appendChild(el("span", "cw-desk-name", meta ? meta.name.split(" ")[0] : "you"));
}
function cwAgentPos(id) {
  const a = CW.agents[id];
  return [parseFloat(a.style.left), parseFloat(a.style.top)];
}
async function cwWalk(id, l, t, ms) {
  const a = CW.agents[id];
  if (!a) return;
  ms = cwMs(ms || 1000);
  const [cl] = cwAgentPos(id);
  a.classList.toggle("flip", l < cl);
  const spr = $(".cw-sprite", a);
  spr.classList.add("walking");
  a.style.transitionDuration = ms + "ms";
  a.style.left = l + "%"; a.style.top = t + "%";
  await cwWait(ms + 60);
  spr.classList.remove("walking");
  a.classList.remove("flip");
}
function cwHome(id, ms) {
  const [l, t] = CW_STATIONS[id];
  return cwWalk(id, l, t, ms || 900);
}
function cwSay(id, text, ms) {
  const a = CW.agents[id];
  if (!a || !text) return;
  const b = $(".cw-bubble", a);
  b.textContent = text;
  b.hidden = false;
  b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
  clearTimeout(b._t);
  b._t = setTimeout(() => { b.hidden = true; }, ms || 3200);
}
function cwWork(id, on) {
  const a = CW.agents[id];
  if (a) $(".cw-sprite", a).classList.toggle("working", !!on);
}
function cwCheer(id) {
  const a = CW.agents[id];
  if (!a) return;
  const spr = $(".cw-sprite", a);
  spr.classList.add("cheer");
  setTimeout(() => spr.classList.remove("cheer"), 1400);
}
function cwChipTo(l, t, label, ms) {
  const c = CW.chip;
  ms = cwMs(ms || 700);
  c.hidden = false;
  if (label) c.textContent = label.length > 26 ? label.slice(0, 25) + "…" : label;
  c.classList.remove("hop");
  if (ms >= 400) { void c.offsetWidth; c.classList.add("hop"); }
  c.style.transitionDuration = ms + "ms";
  c.style.left = l + "%"; c.style.top = (t - 9) + "%";
  return cwWait(ms + 40);
}
function cwLog(fromId, toId, text) {
  if (!CW.log) return;
  const it = el("div", "cw-log-item pop");
  const dots = el("span", "cw-log-dots");
  const mk = pid => { const d = el("i"); d.style.background = (PERSONAS.find(x => x.id === pid) || {}).accent || "var(--acc)"; return d; };
  dots.append(mk(fromId), mk(toId || fromId));
  it.appendChild(dots);
  it.appendChild(el("span", "", text));
  CW.log.insertBefore(it, CW.log.firstChild);
  while (CW.log.children.length > 22) CW.log.lastChild.remove();
}

/* ---------------- open / close / ambient ---------------- */
function crewOpen() {
  crewBuild();
  cwRefreshDesk();
  CW.root.hidden = false;
  CW.open = true;
  if (!CW.blinkTimer) CW.blinkTimer = setInterval(() => {
    const ids = Object.keys(CW.agents);
    const a = CW.agents[ids[Math.floor(Math.random() * ids.length)]];
    if (!a) return;
    const spr = $(".cw-sprite", a);
    spr.classList.add("blink");
    setTimeout(() => spr.classList.remove("blink"), 180);
  }, 1400);
  cwScheduleAmbient(2200);
  if (!CW.banterTimer) CW.banterTimer = setInterval(() => {
    if (!CW.open || CW.busy) return;
    try {
      const b = CREW_META.banter[Math.floor(Math.random() * CREW_META.banter.length)];
      if (b) cwSay(b.who, b.say, 2600);
    } catch (_) { }
  }, 12000);
}
function crewClose() {
  if (!CW.root) return;
  CW.root.hidden = true;
  CW.open = false;
  clearTimeout(CW.ambientTimer);
}
function cwScheduleAmbient(delay) {
  clearTimeout(CW.ambientTimer);
  CW.ambientTimer = setTimeout(cwAmbient, delay || (4800 + Math.random() * 3600));
}
async function cwAmbient() {
  if (!CW.open || CW.busy) { cwScheduleAmbient(); return; }
  let ex = null;
  try { ex = CREW_META.ambient[Math.floor(Math.random() * CREW_META.ambient.length)]; } catch (_) { }
  if (!ex || !CW.agents[ex.from] || !CW.agents[ex.to]) { cwScheduleAmbient(); return; }
  const [tl, tt] = cwAgentPos(ex.to);
  const [fl, ft] = cwAgentPos(ex.from);
  const meetL = tl + (fl < tl ? -7 : 7);
  await cwWalk(ex.from, meetL, tt, 1200);
  cwWork(ex.from, true); cwWork(ex.to, true);
  await cwChipTo(fl > tl ? meetL - 2 : meetL + 2, tt, ex.payload, 60);
  await cwWait(250);
  await cwChipTo(tl, tt, ex.payload, 600);
  cwLog(ex.from, ex.to, ex.line);
  await cwWait(700);
  CW.chip.hidden = true;
  cwWork(ex.from, false); cwWork(ex.to, false);
  cwSay(ex.to, "got it ✓", 1500);
  await cwHome(ex.from, 1100);
  cwScheduleAmbient();
}

/* ---------------- missions: delegations & chains ---------------- */
function crewMission(m) {
  /* guided tours stage their own crew moment — ignore stray auto-opens mid-tour */
  try { if (typeof PRESENT !== "undefined" && PRESENT.on && !PRESENT.allowCrew) return Promise.resolve(); } catch (_) { }
  crewBuild();
  if (!CW.open) crewOpen();
  CW.queue = CW.queue.then(() => cwRunMission(m)).catch(() => { });
  return CW.queue;
}
async function cwRunMission(m) {
  CW.busy = true;
  clearTimeout(CW.ambientTimer);
  const owner = m.owner && CW.agents[m.owner] ? m.owner : (state.personaId || "finance");
  const meta = cwMeta(owner);
  cwRefreshDesk();
  CW.hub.classList.add("busy");
  CW.count.textContent = "mission · " + (m.label || "delegated task");

  /* collaborators from the steps' systems */
  const collabs = [];
  (m.steps || []).forEach(s => {
    const d = cwDomainOf(s.server);
    if (d && d !== owner && CW.agents[d] && !collabs.includes(d)) collabs.push(d);
  });
  const crew = collabs.slice(0, 3);

  cwSay(owner, meta.hello, 2400);
  cwLog(owner, owner, meta.name + " takes: " + (m.label || "a task"));
  await cwWait(600);

  /* owner to the hub */
  const [hx, hy] = CW_HUB;
  await cwWalk(owner, hx - 9, hy + 12, 1100);

  /* crew walks in around the hub */
  const spots = [[hx + 9, hy + 12], [hx - 18, hy + 16], [hx + 18, hy + 16]];
  await Promise.all(crew.map((id, i) => cwWalk(id, spots[i][0], spots[i][1], 1200 + i * 150)));
  if (crew.length) CW.huddle.hidden = false;

  /* pass the payload along the steps */
  let at = owner;
  const hops = (m.steps || []).slice(0, 4);
  let [al, atop] = cwAgentPos(owner);
  await cwChipTo(al, atop, hops[0] ? (hops[0].carry || hops[0].tool) : (m.label || "payload"), 60);
  for (const s of hops) {
    const d = cwDomainOf(s.server);
    const target = d && crew.includes(d) ? d : owner;
    const [tl, tt] = cwAgentPos(target);
    cwWork(at, true);
    await cwWait(420);
    cwWork(at, false);
    if (target === at) {
      /* own-domain step: the tool call rides up to askMElah, the result comes back */
      await cwChipTo(hx, hy + 8, s.server + " · " + s.tool, 650);
      await cwWait(220);
      await cwChipTo(tl, tt, s.carry || s.result || s.tool, 650);
      cwLog(at, target, cwMeta(at).name + " ⇄ askMElah: " + (s.result || s.tool));
    } else {
      await cwChipTo(tl, tt, s.carry || s.result || s.tool, 750);
      cwLog(at, target, cwMeta(at).name + " → " + cwMeta(target).name + ": " + (s.result || s.tool));
    }
    cwWork(target, true);
    try { const r = CW.agents[target].getBoundingClientRect(); sparkleAt(r.left + r.width / 2, r.top + 10, { n: 4, d: 18, ring: false }); } catch (_) { }
    await cwWait(500);
    cwWork(target, false);
    at = target;
  }
  CW.huddle.hidden = true;

  /* crew heads home with a nod */
  crew.forEach((id, i) => { cwSay(id, "✓ " + cwMeta(id).name + " done", 1600); setTimeout(() => cwHome(id, 1100), i * 180); });

  /* the report: walk to the human's desk */
  const [dl, dt] = CW_DESK;
  await cwChipTo(dl, dt, "report", 900);
  await cwWalk(owner, dl - 8, dt - 10, 1000);
  CW.desk.classList.add("receiving");
  const lastHop = hops.length ? hops[hops.length - 1] : null;
  const result = (m.result || (lastHop && lastHop.result) || "done.").split(";")[0];
  cwSay(owner, meta.done + " " + (result.length > 64 ? result.slice(0, 63) + "…" : result), 5200);
  cwCheer(owner);
  cwLog(owner, state.personaId, meta.name + " reports to " + ((PERSONAS.find(x => x.id === state.personaId) || {}).name || "you").split(" ")[0]);
  try { petHop(); } catch (_) { }
  await cwWait(2600);
  CW.desk.classList.remove("receiving");
  CW.chip.hidden = true;

  /* home */
  await cwHome(owner, 1100);
  CW.hub.classList.remove("busy");
  CW.count.textContent = "7 agents · idle";
  CW.busy = false;
  cwScheduleAmbient(5000);
}
