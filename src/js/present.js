/* ============================================================
   FoW · Present mode — the demo drives itself
   A scripted, self-narrating walkthrough: spotlight, ghost
   cursor, director's captions, and a player bar. Every action
   it performs is the real interaction, not a mockup.
   ============================================================ */
"use strict";

const PRESENT = { on: false, abort: false, paused: false, speed: 1, step: 0, steps: [] };

function prEl() { return $("#present"); }

function prBuild() {
  const root = el("div");
  root.id = "present";
  root.innerHTML = "";
  const spot = el("div", "pr-spot"); spot.id = "prSpot";
  const cursor = el("div", "pr-cursor"); cursor.id = "prCursor";
  cursor.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5.5 3.2 19 11.4l-6.2 1.3-3.1 5.6z" fill="#1b2540" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const cap = el("div", "pr-caption"); cap.id = "prCap";
  const capKicker = el("div", "pr-kicker"); capKicker.id = "prKicker";
  const capTitle = el("div", "pr-title"); capTitle.id = "prTitle";
  const capText = el("div", "pr-text"); capText.id = "prText";
  cap.append(capKicker, capTitle, capText);
  const bar = el("div", "pr-bar");
  const dots = el("div", "pr-dots"); dots.id = "prDots";
  const mkBtn = (id, label, title) => { const b = el("button", "pr-btn", label); b.id = id; b.title = title; return b; };
  const play = mkBtn("prPlay", "⏸", "Pause / resume (space)");
  const next = mkBtn("prNext", "⏭", "Next step (→)");
  const speed = mkBtn("prSpeed", "1×", "Playback speed");
  const exit = mkBtn("prExit", "✕ Exit", "Exit present mode (esc)");
  exit.classList.add("pr-exit");
  bar.append(play, next, speed, dots, exit);
  root.append(spot, cursor, cap, bar);
  document.body.appendChild(root);

  play.addEventListener("click", prTogglePause);
  next.addEventListener("click", () => { PRESENT.skip = true; });
  speed.addEventListener("click", () => {
    PRESENT.speed = PRESENT.speed === 1 ? 1.6 : PRESENT.speed === 1.6 ? 0.7 : 1;
    speed.textContent = PRESENT.speed === 1 ? "1×" : PRESENT.speed === 1.6 ? "1.6×" : "0.7×";
  });
  exit.addEventListener("click", prStop);
  return root;
}
function prTogglePause() {
  PRESENT.paused = !PRESENT.paused;
  const b = $("#prPlay"); if (b) b.textContent = PRESENT.paused ? "▶" : "⏸";
  const cap = $("#prCap"); if (cap) cap.classList.toggle("paused", PRESENT.paused);
}
function prDots() {
  const d = $("#prDots"); if (!d) return;
  d.textContent = "";
  PRESENT.steps.forEach((s, i) => {
    const dot = el("span", "pr-dot" + (i === PRESENT.step ? " cur" : i < PRESENT.step ? " done" : ""));
    d.appendChild(dot);
  });
}

/* sleep in small slices so pause / skip / speed / abort all bite quickly */
async function psleep(ms) {
  let left = ms / PRESENT.speed;
  while (left > 0) {
    if (PRESENT.abort) throw { aborted: true };
    if (PRESENT.skip) return;
    if (!PRESENT.paused) left -= 90;
    await new Promise(r => setTimeout(r, 90));
  }
}
async function pwaitChatIdle(maxMs) {
  let left = maxMs;
  await psleep(500);
  while (left > 0 && chat.busy) {
    if (PRESENT.abort) throw { aborted: true };
    if (PRESENT.skip) return;
    await new Promise(r => setTimeout(r, 150));
    left -= 150;
  }
}

function prCaption(kicker, title, text) {
  $("#prKicker").textContent = kicker;
  $("#prTitle").textContent = title;
  $("#prText").textContent = text;
  const cap = $("#prCap");
  cap.classList.remove("pop");
  void cap.offsetWidth; /* restart the entrance animation */
  cap.classList.add("pop");
}

function prSpotlight(target, pad) {
  const spot = $("#prSpot");
  if (!target) { spot.classList.add("off"); return; }
  const r = target.getBoundingClientRect();
  const p = pad == null ? 10 : pad;
  spot.classList.remove("off");
  spot.style.left = (r.left - p) + "px";
  spot.style.top = (r.top - p) + "px";
  spot.style.width = (r.width + p * 2) + "px";
  spot.style.height = (r.height + p * 2) + "px";
}
async function prScrollTo(target) {
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  await psleep(650);
}
async function prCursorTo(target, dx, dy) {
  const c = $("#prCursor");
  c.classList.add("show");
  const r = target.getBoundingClientRect();
  const x = r.left + (dx == null ? r.width / 2 : dx);
  const y = r.top + (dy == null ? r.height / 2 : dy);
  c.style.transform = `translate(${x}px, ${y}px)`;
  await psleep(700);
  return { x, y };
}
async function prClick(target, dx, dy) {
  await prCursorTo(target, dx, dy);
  const c = $("#prCursor");
  c.classList.add("click");
  const ring = el("span", "pr-ring");
  const t = c.style.transform.match(/translate\(([\d.]+)px, ([\d.]+)px\)/);
  if (t) { ring.style.left = t[1] + "px"; ring.style.top = t[2] + "px"; }
  prEl().appendChild(ring);
  setTimeout(() => ring.remove(), 700);
  await psleep(220);
  c.classList.remove("click");
  target.click();
}
function prCursorHide() { const c = $("#prCursor"); if (c) c.classList.remove("show"); }

/* fly a ghost of a card into the chat dock (the drag, cinematically) */
async function prFlyToChat(card) {
  const ghost = card.cloneNode(true);
  const r = card.getBoundingClientRect();
  const dock = $("#chatdock").getBoundingClientRect();
  ghost.className = "pr-ghost";
  ghost.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;z-index:130;margin:0;pointer-events:none;` +
    "border-radius:16px;background:var(--card);border:1px solid var(--acc-line);box-shadow:var(--shadow-pop);transition:all 900ms cubic-bezier(.4,.1,.2,1);overflow:hidden;max-height:200px";
  document.body.appendChild(ghost);
  $("#chatdock").classList.add("droptarget");
  await new Promise(r2 => requestAnimationFrame(() => requestAnimationFrame(r2)));
  ghost.style.left = (dock.left + dock.width / 2 - 90) + "px";
  ghost.style.top = (dock.top + dock.height * 0.55) + "px";
  ghost.style.width = "180px";
  ghost.style.opacity = "0.25";
  ghost.style.transform = "scale(0.55) rotate(2deg)";
  await psleep(950);
  ghost.remove();
  $("#chatdock").classList.remove("droptarget");
}

function findCard(titleText) {
  return $$(".card").find(c => { const t = $(".ch-title .t", c); return t && t.textContent === titleText; });
}

/* ---------------- the script ---------------- */
function prScript() {
  const S = [];
  const add = (fn) => S.push(fn);

  /* 0 · intro */
  add(async () => {
    prSpotlight(null);
    prCaption("FoW · guided tour", "The future of work, driving itself", "One workspace that knows your job — with an AI copilot wired into every tool. Sit back: everything you're about to see is the real product interacting with itself.");
    await psleep(5200);
  });

  /* 1 · pick / set persona */
  add(async () => {
    const onboardOpen = $("#onboard") && getComputedStyle($("#onboard")).display !== "none" && !$("#onboard").classList.contains("gone");
    prCaption("Step 1", "One workspace per person", "Pick a seat and the whole canvas re-shapes: KPIs, queues, charts, tools — everything follows the role.");
    if (onboardOpen) {
      const target = $$(".ob-card").find(c => c.textContent.includes("Daniel")) || $(".ob-card");
      await prClick(target);
    } else if (state.personaId !== "finance") {
      selectPersona("finance");
    }
    prCursorHide();
    await psleep(3400);
  });

  /* 2 · hero */
  add(async () => {
    const hero = $(".hero");
    await prScrollTo(hero);
    prSpotlight(hero);
    prCaption("The morning brief", "The day opens with what matters", "No dashboard archaeology. The headline is written from live data — the one thing to fix before 10am, and why.");
    await psleep(6000);
  });

  /* 3 · KPIs */
  add(async () => {
    const kpis = $$(".card.kpi");
    if (kpis.length) {
      const first = kpis[0].getBoundingClientRect();
      const last = kpis[kpis.length - 1].getBoundingClientRect();
      const spot = $("#prSpot");
      spot.classList.remove("off");
      spot.style.left = (first.left - 10) + "px";
      spot.style.top = (Math.min(first.top, last.top) - 10) + "px";
      spot.style.width = (last.right - first.left + 20) + "px";
      spot.style.height = (Math.max(first.height, last.height) + 20) + "px";
    }
    prCaption("Business intelligence", "KPIs straight from the source systems", "SAP, NetSuite, Workday, Salesforce — each metric carries its 12-month history, its delta, and the reason behind the move.");
    await psleep(6000);
  });

  /* 4 · trend chart with live crosshair sweep */
  add(async () => {
    const card = $$(".card").find(c => c.dataset.span === "8");
    if (!card) return;
    await prScrollTo(card);
    prSpotlight(card);
    prCaption("Live charts", "Hover any month — flip any chart to a table", "Hand-built SVG, colorblind-safe palettes, crosshair tooltips. Watch the crosshair walk the year.");
    const hit = $('rect[fill="transparent"]', card);
    if (hit) {
      const hr = hit.getBoundingClientRect();
      const c = $("#prCursor"); c.classList.add("show");
      for (let i = 0; i <= 20; i++) {
        if (PRESENT.abort) throw { aborted: true };
        if (PRESENT.skip) break;
        const x = hr.left + (hr.width * i) / 20;
        const y = hr.top + hr.height * 0.45;
        c.style.transform = `translate(${x}px, ${y}px)`;
        hit.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true }));
        await new Promise(r => setTimeout(r, 110 / PRESENT.speed));
      }
      hit.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    }
    prCursorHide();
    await psleep(2200);
  });

  /* 5 · drag a KPI into chat */
  add(async () => {
    const kpi = $(".card.kpi");
    if (!kpi) return;
    await prScrollTo(kpi);
    prSpotlight(null);
    prCaption("The signature move", "Drag anything to Flow, the copilot", "A KPI, an email, an approval, a whole chart. Flow reads the same systems you do — and answers about that thing.");
    await prCursorTo(kpi);
    await prFlyToChat(kpi);
    prCursorHide();
    const k = FOW.data().kpis[0];
    attachChip({ type: "kpi", label: k.label + " · " + k.value, data: k });
    sendMessage("Why is this moving?");
    await psleep(400);
  });

  /* 6 · watch the answer */
  add(async () => {
    prSpotlight($("#chatdock"), 6);
    prCaption("Agentic answers", "It shows its work", "Real tool calls — SAP, Outlook, Jira — each one visible and timed. Then an answer with a chart in it, not a wall of text.");
    await pwaitChatIdle(14000);
    await psleep(2500);
  });

  /* 7 · approvals autopilot */
  add(async () => {
    const apCard = findCard("Approvals");
    if (!apCard) return;
    await prScrollTo(apCard);
    prSpotlight(apCard);
    prCaption("Trust, with a leash", "Approvals on autopilot", "Within policy, clean requester history, under the delegation limit — Flow clears it and notifies people. Anything unusual still waits for a human.");
    const sw = $(".autopilot", apCard);
    if (sw && !sw.classList.contains("on")) await prClick(sw);
    prCursorHide();
    await psleep(5200);
  });

  /* 8 · delegation */
  add(async () => {
    const dgCard = findCard("Delegated to Flow");
    if (!dgCard) return;
    await prScrollTo(dgCard);
    prSpotlight(dgCard);
    prCaption("Delegate real work", "An agent work queue", "Chase the vendor. Compile the bridge. Screen the queue. Flow runs the steps in the background, files the artifact, and reports back.");
    const btn = $(".dg-btn", dgCard);
    if (btn) await prClick(btn);
    prCursorHide();
    await psleep(6500);
    await pwaitChatIdle(8000);
  });

  /* 9 · week in numbers */
  add(async () => {
    const wkCard = findCard("Your week in numbers");
    if (!wkCard) return;
    await prScrollTo(wkCard);
    prSpotlight(wkCard);
    prCaption("Calendar health", "What the week actually cost", "Meeting load vs focus time — priced in people-hours. Flow will defend deep-work blocks if you let it.");
    await psleep(5600);
  });

  /* 10 · week recap */
  add(async () => {
    const btn = $(".hstat.primary");
    if (!btn) return;
    await prScrollTo($(".hero"));
    prSpotlight(null);
    prCaption("Friday, 4:55pm", "One click writes the status report", "Wins, watch-outs, next week — compiled from everything on the canvas, including what just got approved and delegated in this session.");
    await prClick(btn);
    prCursorHide();
    prSpotlight($("#chatdock"), 6);
    await pwaitChatIdle(16000);
    await psleep(2500);
  });

  /* 11 · federated search */
  add(async () => {
    prSpotlight(null);
    prCaption("No more app-hopping", "One search across every tool", "Emails, tickets, meetings, files — one box. Type three letters, land anywhere.");
    ckOpen();
    await psleep(600);
    const inp = $("#ckInput");
    for (const ch of "aws") {
      if (PRESENT.abort) throw { aborted: true };
      inp.value += ch;
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise(r => setTimeout(r, 260 / PRESENT.speed));
    }
    prSpotlight($(".ck-panel"), 8);
    await psleep(3600);
    ckClose();
  });

  /* 12 · persona switch */
  add(async () => {
    prSpotlight(null);
    const nextP = PERSONAS.find(pp => pp.id !== state.personaId) || PERSONAS[0];
    prCaption("Not just one team", "Every function gets its own cockpit", "HR, IT, Legal, Procurement, Sales — same workspace, different world. Watch it re-shape for " + nextP.name.split(" ")[0] + " in " + nextP.dept + ".");
    await psleep(2600);
    selectPersona(nextP.id);
    await psleep(4800);
  });

  /* 13 · dark, for effect */
  add(async () => {
    const btn = $("#themeBtn");
    prCaption("For the late shift", "Light by day, dark by night", "The whole system — charts included — re-tunes its palette. Accessibility-checked in both.");
    await prClick(btn);
    prCursorHide();
    await psleep(3400);
    applyTheme(false);
    await psleep(900);
  });

  /* 14 · finale */
  add(async () => {
    prSpotlight(null);
    prCaption("FoW · proof of concept", "The future of work, one canvas per person", "Every integration here is simulated; every interaction is real. Press Replay to run it again — or Esc and take the wheel yourself.");
    const bar = $("#prPlay");
    if (bar) bar.textContent = "↺";
    await psleep(60000);
  });

  return S;
}

/* ---------------- runner ---------------- */
async function startPresent() {
  if (PRESENT.on) return;
  PRESENT.on = true; PRESENT.abort = false; PRESENT.paused = false; PRESENT.step = 0; PRESENT.skip = false;
  prBuild();
  PRESENT.steps = prScript();
  prDots();
  document.body.classList.add("presenting");
  try {
    for (let i = 0; i < PRESENT.steps.length; i++) {
      PRESENT.step = i; PRESENT.skip = false;
      prDots();
      const isFinale = i === PRESENT.steps.length - 1;
      await PRESENT.steps[i]();
      /* finale timed out untouched -> loop the tour (kiosk mode) */
      if (isFinale && !PRESENT.abort) { i = -1; const b = $("#prPlay"); if (b) b.textContent = "⏸"; }
    }
  } catch (e) {
    if (!e || !e.aborted) console.warn("present step failed", e);
  }
  prStop();
}
function prStop() {
  if (!PRESENT.on) return;
  PRESENT.on = false; PRESENT.abort = true;
  const root = prEl();
  if (root) { root.classList.add("out"); setTimeout(() => root.remove(), 350); }
  document.body.classList.remove("presenting");
}

/* replay from finale: clicking play restarts */
document.addEventListener("click", e => {
  if (PRESENT.on && e.target && e.target.id === "prPlay" && e.target.textContent === "↺") {
    prStop();
    setTimeout(startPresent, 420);
  }
});
document.addEventListener("keydown", e => {
  if (!PRESENT.on) return;
  if (e.key === "Escape") { e.stopPropagation(); prStop(); }
  else if (e.key === " ") { e.preventDefault(); prTogglePause(); }
  else if (e.key === "ArrowRight") { e.preventDefault(); PRESENT.skip = true; }
}, true);
