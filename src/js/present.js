/* ============================================================
   FoW · Present mode — per-persona highlight reels
   Click ▶ on any person: their use case plays itself with a
   spotlight, ghost cursor and captions authored per persona
   (src/data/tour-<id>.json). Pausable, skippable, stoppable.
   ============================================================ */
"use strict";

const PRESENT = { on: false, abort: false, paused: false, speed: 1, step: 0, steps: [], pid: null, skip: false };

const KICKERS = {
  intro: "FoW · guided highlights", hero: "The morning brief", kpis: "Business intelligence",
  chart: "Live charts", ask: "The signature move", answer: "Agentic answers",
  delegate: "Delegate real work", autopilot: "Trust, with a leash", mcp: "The MCP layer",
  chains: "No more swivel-chair", insights: "What silos can't see",
  recap: "Friday, 4:55pm", outro: "FoW · Mediacorp",
};
const FALLBACK_BEATS = {
  intro: { title: "One workspace per person", text: "The canvas shapes itself around this role — KPIs, queues, charts and tools all follow the job." },
  hero: { title: "The day opens with what matters", text: "No dashboard archaeology — the headline is written from live data, not a template." },
  kpis: { title: "KPIs straight from the source systems", text: "Each metric carries 12 months of history, its delta, and the reason behind the move." },
  chart: { title: "Hover any month, flip to a table", text: "Hand-built SVG, colorblind-safe palettes, crosshair tooltips. Watch the crosshair walk the year." },
  ask: { title: "Drag anything to askMElah", text: "A KPI, an email, an approval. The copilot reads the same systems you do — and answers about that thing." },
  answer: { title: "It shows its work", text: "Real tool calls — visible and timed — then an answer with a chart in it, not a wall of text." },
  chains: { title: "Apps, chained via MCP", text: "Watch data hop between systems by itself — retrieved from one, filed in the next, everyone notified. No copy-paste, no swivel-chair." },
  insights: { title: "Insights no silo could produce", text: "With every system feeding one brain, askMElah joins what each tool sees alone — and finds what none of them could." },
  delegate: { title: "An agent work queue", text: "askMElah runs the steps in the background, files the artifact, and reports back in chat." },
  autopilot: { title: "Approvals on autopilot", text: "Within policy and clean history, it clears the queue itself. Anything unusual still waits for a human." },
  mcp: { title: "Every tool, one console", text: "The MCP console shows what this seat is wired into — servers, tools, and the live call log." },
  recap: { title: "One click writes the status report", text: "Wins, watch-outs, next week — compiled from everything on this canvas, including this session." },
  outro: { title: "The future of work, per person", text: "Every integration simulated, every interaction real. Replay to run it again — or Esc and take the wheel." },
};

function prEl() { return $("#present"); }

function prBuild() {
  const root = el("div");
  root.id = "present";
  const spot = el("div", "pr-spot"); spot.id = "prSpot";
  const cursor = el("div", "pr-cursor"); cursor.id = "prCursor";
  cursor.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5.5 3.2 19 11.4l-6.2 1.3-3.1 5.6z" fill="#1b2540" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const cap = el("div", "pr-caption"); cap.id = "prCap";
  cap.append(el("div", "pr-kicker"), el("div", "pr-title"), el("div", "pr-text"));
  $(".pr-kicker", cap).id = "prKicker"; $(".pr-title", cap).id = "prTitle"; $(".pr-text", cap).id = "prText";
  const bar = el("div", "pr-bar");
  const dots = el("div", "pr-dots"); dots.id = "prDots";
  const mkBtn = (id, label, title) => { const b = el("button", "pr-btn", label); b.id = id; b.title = title; return b; };
  const play = mkBtn("prPlay", "⏸", "Pause / resume (space)");
  const next = mkBtn("prNext", "⏭", "Next step (→)");
  const speed = mkBtn("prSpeed", "1×", "Playback speed");
  const exit = mkBtn("prExit", "✕ Stop", "Stop the tour (esc)");
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
    d.appendChild(el("span", "pr-dot" + (i === PRESENT.step ? " cur" : i < PRESENT.step ? " done" : "")));
  });
}

/* sleep in slices so pause / skip / speed / abort all bite quickly */
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
  void cap.offsetWidth;
  cap.classList.add("pop");
}
function showBeat(key) {
  const p = FOW.data();
  const authored = p && p.tour && p.tour.beats && p.tour.beats[key];
  const f = FALLBACK_BEATS[key] || {};
  prCaption(KICKERS[key] || "FoW", (authored && authored.title) || f.title || "", (authored && authored.text) || f.text || "");
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

/* ---------------- the per-persona script ---------------- */
function prScript() {
  const S = [];
  const add = fn => S.push(fn);

  /* 0 · land in the persona's seat */
  add(async () => {
    prSpotlight(null);
    const meta = PERSONAS.find(x => x.id === PRESENT.pid) || PERSONAS[0];
    const onboardEl = $("#onboard");
    const onboardOpen = onboardEl && getComputedStyle(onboardEl).display !== "none" && !onboardEl.classList.contains("gone");
    if (onboardOpen) {
      if (typeof lobbyFocus === "function" && $("#lbEnter")) {
        lobbyFocus(PRESENT.pid, true);
        LOBBY.touched = true;
        await psleep(800);
        await prClick($("#lbEnter"));
      } else { onboardEl.classList.add("gone"); setTimeout(() => { onboardEl.style.display = "none"; }, 400); selectPersona(PRESENT.pid, true); }
    } else if (state.personaId !== PRESENT.pid) {
      selectPersona(PRESENT.pid);
    }
    prCursorHide();
    await psleep(1200);
    showBeat("intro");
    await psleep(4600);
  });

  /* 1 · hero */
  add(async () => {
    const hero = $(".hero");
    await prScrollTo(hero);
    prSpotlight(hero);
    showBeat("hero");
    await psleep(5800);
  });

  /* 2 · KPI row */
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
    showBeat("kpis");
    await psleep(5800);
  });

  /* 3 · trend chart + crosshair sweep */
  add(async () => {
    const card = $$(".card").find(c => c.dataset.span === "8");
    if (!card) return;
    await prScrollTo(card);
    prSpotlight(card);
    showBeat("chart");
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
    await psleep(2000);
  });

  /* 4 · drag a KPI to askMElah + ask the signature question */
  add(async () => {
    const kpi = $(".card.kpi");
    if (!kpi) return;
    await prScrollTo(kpi);
    prSpotlight(null);
    showBeat("ask");
    await prCursorTo(kpi);
    await prFlyToChat(kpi);
    prCursorHide();
    const p = FOW.data();
    const k = p.kpis[0];
    attachChip({ type: "kpi", label: k.label + " · " + k.value, data: k });
    const q = (p.tour && p.tour.question) || (p.suggestions && p.suggestions[0]) || "Why is this moving?";
    sendMessage(q);
    await psleep(400);
  });

  /* 5 · watch the answer stream */
  add(async () => {
    prSpotlight($("#chatdock"), 6);
    const f = FALLBACK_BEATS.answer;
    prCaption(KICKERS.answer, f.title, f.text);
    await pwaitChatIdle(15000);
    await psleep(2200);
  });

  /* 6 · cross-app chain */
  add(async () => {
    const chnCard = $(".chn-card");
    if (!chnCard) return;
    await prScrollTo(chnCard);
    prSpotlight(chnCard);
    showBeat("chains");
    const btn = $(".dg-btn", chnCard);
    if (btn) {
      await prClick(btn);
      prCursorHide();
      prSpotlight($("#chatdock"), 6);
      await psleep(3500);
      await pwaitChatIdle(16000);
    } else await psleep(3000);
  });

  /* 7 · the cross-silo insight it just surfaced */
  add(async () => {
    if (!$(".insight")) return;
    prSpotlight($("#chatdock"), 6);
    showBeat("insights");
    await psleep(6200);
  });

  /* 8 · delegation */
  add(async () => {
    const dgCard = $(".dg-card");
    if (!dgCard) return;
    const btn = $(".dg-btn", dgCard);
    await prScrollTo(dgCard);
    prSpotlight(dgCard);
    showBeat("delegate");
    if (btn) { await prClick(btn); prCursorHide(); await psleep(6300); await pwaitChatIdle(8000); }
    else await psleep(3000);
  });

  /* 7 · approvals autopilot */
  add(async () => {
    const apCard = $(".ap-card");
    if (!apCard) return;
    await prScrollTo(apCard);
    prSpotlight(apCard);
    showBeat("autopilot");
    const sw = $(".autopilot", apCard);
    if (sw && !sw.classList.contains("on")) { await prClick(sw); prCursorHide(); }
    await psleep(5200);
  });

  /* 8 · MCP console */
  add(async () => {
    prSpotlight(null);
    showBeat("mcp");
    await psleep(1000);
    mcpOpen();
    await psleep(300);
    prSpotlight($(".mcp-panel"), 6);
    await psleep(6200);
    mcpClose();
    prSpotlight(null);
  });

  /* 9 · week recap */
  add(async () => {
    const btn = $(".hstat.primary");
    if (!btn) return;
    await prScrollTo($(".hero"));
    prSpotlight(null);
    showBeat("recap");
    await prClick(btn);
    prCursorHide();
    prSpotlight($("#chatdock"), 6);
    await pwaitChatIdle(16000);
    await psleep(2200);
  });

  /* 10 · outro (loops until stopped) */
  add(async () => {
    prSpotlight(null);
    showBeat("outro");
    const b = $("#prPlay");
    if (b) b.textContent = "↺";
    await psleep(60000);
  });

  return S;
}

/* ---------------- runner ---------------- */
async function startPresent(personaId) {
  if (PRESENT.on) return;
  PRESENT.on = true; PRESENT.abort = false; PRESENT.paused = false; PRESENT.step = 0; PRESENT.skip = false;
  PRESENT.pid = personaId || state.personaId || "finance";
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
      /* finale timed out untouched -> loop this persona's reel (kiosk mode) */
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

document.addEventListener("click", e => {
  if (PRESENT.on && e.target && e.target.id === "prPlay" && e.target.textContent === "↺") {
    const pid = PRESENT.pid;
    prStop();
    setTimeout(() => startPresent(pid), 420);
  }
});
document.addEventListener("keydown", e => {
  if (!PRESENT.on) return;
  if (e.key === "Escape") { e.stopPropagation(); prStop(); }
  else if (e.key === " ") { e.preventDefault(); prTogglePause(); }
  else if (e.key === "ArrowRight") { e.preventDefault(); PRESENT.skip = true; }
}, true);
