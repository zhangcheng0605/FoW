/* ============================================================
   FoW · Flow — the chat copilot
   Simulated agent: intent router over persona chat-flows,
   context-chip responders, animated MCP tool calls, streamed
   mini-markdown answers with embedded live charts.
   ============================================================ */
"use strict";

const chat = {
  chips: [],       /* attached context chips {type,label,data} */
  busy: false,
  queue: Promise.resolve(),
  history: [],
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const msgsEl = () => $("#cdMsgs");
function scrollChat() { const m = msgsEl(); m.scrollTop = m.scrollHeight; }

/* ---------------- mini-markdown ---------------- */
function renderInline(target, s) {
  /* **bold** and `code`, everything through text nodes */
  const parts = String(s).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  parts.forEach(p => {
    if (!p) return;
    if (p.startsWith("**") && p.endsWith("**")) target.appendChild(el("b", "", p.slice(2, -2)));
    else if (p.startsWith("`") && p.endsWith("`")) target.appendChild(el("code", "", p.slice(1, -1)));
    else target.appendChild(document.createTextNode(p));
  });
}
function parseBlocks(text) {
  const lines = String(text).replace(/\r/g, "").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    const t = ln.trim();
    if (!t) { i++; continue; }
    const emb = t.match(/^\{\{(chart:(trend|donut|bars|heatmap)|kpis|spark:([\w-]+))\}\}$/);
    if (emb) { blocks.push({ t: "embed", kind: emb[2] || (emb[1] === "kpis" ? "kpis" : "spark"), id: emb[3] }); i++; continue; }
    if (t === "---") { blocks.push({ t: "hr" }); i++; continue; }
    if (t.startsWith("## ")) { blocks.push({ t: "h", s: t.slice(3) }); i++; continue; }
    if (t.startsWith("> ")) { blocks.push({ t: "co", s: t.slice(2) }); i++; continue; }
    if (t.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
        if (!cells.every(c => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      blocks.push({ t: "table", rows }); continue;
    }
    if (/^- /.test(t) || /^\d+\. /.test(t)) {
      const ordered = /^\d+\. /.test(t);
      const items = [];
      while (i < lines.length && (ordered ? /^\d+\. /.test(lines[i].trim()) : /^- /.test(lines[i].trim()))) {
        items.push(lines[i].trim().replace(/^(- |\d+\. )/, "")); i++;
      }
      blocks.push({ t: ordered ? "ol" : "ul", items }); continue;
    }
    blocks.push({ t: "p", s: t }); i++;
  }
  return blocks;
}
function buildEmbed(kind, id) {
  const p = FOW.data();
  const box = el("div", "m-embed");
  if (kind === "kpis") {
    const grid = el("div", "m-kpis");
    p.kpis.forEach(k => {
      const c = el("div", "mk");
      c.appendChild(el("div", "l", k.label));
      c.appendChild(el("div", "v", k.value));
      c.appendChild(el("div", "d " + (k.deltaGood ? "good" : "bad"), k.delta + " " + (k.vs || "")));
      grid.appendChild(c);
    });
    return grid;
  }
  if (kind === "spark") {
    const k = p.kpis.find(x => x.id === id) || p.kpis[0];
    box.appendChild(el("div", "em-t", k.label + " — last 12 months"));
    const body = el("div");
    box.appendChild(body);
    requestAnimationFrame(() => registerChart(body, () => renderTrend(body, { title: k.label, unit: "", series: [{ name: k.label, points: k.spark }] }, { mini: true, h: 120 })));
    return box;
  }
  const data = p[kind];
  if (!data) return null;
  box.appendChild(el("div", "em-t", data.title));
  const body = el("div");
  box.appendChild(body);
  requestAnimationFrame(() => registerChart(body, () => {
    if (kind === "trend") renderTrend(body, data, { mini: true });
    else if (kind === "donut") renderDonut(body, data, { mini: true });
    else if (kind === "bars") renderBars(body, data, { mini: true });
    else renderHeatmap(body, data, { mini: true });
  }));
  return box;
}
function renderBlock(b) {
  if (b.t === "h") { const h = el("h4"); renderInline(h, b.s); return h; }
  if (b.t === "hr") return el("hr");
  if (b.t === "co") { const d = el("div", "co"); renderInline(d, b.s); return d; }
  if (b.t === "ul" || b.t === "ol") {
    const l = el(b.t);
    b.items.forEach(it => { const li = el("li"); renderInline(li, it); l.appendChild(li); });
    return l;
  }
  if (b.t === "table") {
    const tb = el("table"), thead = el("thead"), tbody = el("tbody");
    b.rows.forEach((r, ri) => {
      const tr = el("tr");
      r.forEach(c => { const cell = el(ri ? "td" : "th"); renderInline(cell, c); tr.appendChild(cell); });
      (ri ? tbody : thead).appendChild(tr);
    });
    tb.append(thead, tbody); return tb;
  }
  if (b.t === "embed") return buildEmbed(b.kind, b.id);
  const p = el("p"); renderInline(p, b.s); return p;
}
async function streamRich(container, text) {
  const rich = el("div", "rich");
  container.appendChild(rich);
  const blocks = parseBlocks(text);
  const totalWords = blocks.reduce((a, b) => a + (b.s ? b.s.split(" ").length : 6), 0);
  const wps = totalWords > 90 ? 5 : 3; /* words per tick — faster for long answers */
  for (const b of blocks) {
    if (b.t === "p" || b.t === "co" || b.t === "h") {
      const node = b.t === "p" ? el("p") : b.t === "co" ? el("div", "co") : el("h4");
      const caret = el("span", "stream-caret");
      rich.appendChild(node);
      const words = b.s.split(" ");
      let shown = "";
      for (let i = 0; i < words.length; i += wps) {
        shown = words.slice(0, i + wps).join(" ");
        node.textContent = "";
        renderInline(node, shown);
        node.appendChild(caret);
        scrollChat();
        await sleep(26);
      }
      node.textContent = "";
      renderInline(node, b.s);
    } else {
      const node = renderBlock(b);
      if (node) {
        node.style.opacity = "0"; node.style.transition = "opacity 300ms ease";
        rich.appendChild(node);
        requestAnimationFrame(() => { node.style.opacity = "1"; });
        await sleep(190);
      }
    }
    scrollChat();
  }
}

/* ---------------- message primitives ---------------- */
function addUserMsg(text, chips) {
  const m = el("div", "msg user");
  const b = el("div", "bubble");
  if (chips && chips.length) {
    const cw = el("div", "b-chips");
    chips.forEach(c => {
      const chip = el("span", "chip");
      const icon = ico(chipIcon(c.type)); icon.className = "ck-ico";
      chip.appendChild(icon);
      chip.appendChild(el("span", "cl", c.label));
      cw.appendChild(chip);
    });
    b.appendChild(cw);
  }
  if (text) { const p = el("div"); p.textContent = text; b.appendChild(p); }
  m.appendChild(b);
  msgsEl().appendChild(m);
  scrollChat();
}
function addAgentShell() {
  const m = el("div", "msg agent");
  const orb = askmeAv(26);
  const body = el("div", "m-body");
  m.append(orb, body);
  msgsEl().appendChild(m);
  scrollChat();
  return body;
}
const THINK_VERBS = ["reading context…", "checking sources…", "pulling fresh data…", "reasoning…", "cross-referencing…", "drafting…"];
function addTyping(body) {
  const t = el("div", "typing");
  const verb = el("span", "t-verb", THINK_VERBS[0]);
  t.appendChild(verb);
  let i = 0;
  const iv = setInterval(() => { verb.textContent = THINK_VERBS[++i % THINK_VERBS.length]; }, 900);
  body.appendChild(t);
  $("#orb").classList.add("think");
  scrollChat();
  return () => { clearInterval(iv); t.remove(); $("#orb").classList.remove("think"); };
}

/* ---------------- tool-call animation ---------------- */
async function runTools(body, calls) {
  if (!calls || !calls.length) return;
  const block = el("div", "toolblock open");
  const hdr = el("div", "tb-hdr");
  hdr.appendChild(ico("plug"));
  const hn = el("span", "n", "Working across " + calls.length + " tool" + (calls.length > 1 ? "s" : ""));
  hdr.appendChild(hn);
  const caret = el("span", "tb-caret", "›");
  hdr.appendChild(caret);
  hdr.addEventListener("click", () => block.classList.toggle("open"));
  const steps = el("div", "tb-steps");
  block.append(hdr, steps);
  body.appendChild(block);
  scrollChat();
  let totalMs = 0;
  for (const c of calls) {
    const step = el("div", "tb-step");
    step.appendChild(srvGlyph(c.server, 18));
    const cmd = el("span", "tb-cmd");
    cmd.appendChild(document.createTextNode((SERVERS[c.server] ? SERVERS[c.server].name.toLowerCase().replace(/[^a-z0-9]+/g, "_") : c.server) + "." + c.tool));
    const arg = el("span", "arg", "(" + (c.args || "") + ")");
    cmd.appendChild(arg);
    const out = el("span", "tb-out");
    out.appendChild(el("span", "tb-spin"));
    step.append(cmd, out);
    steps.appendChild(step);
    scrollChat();
    const ms = c.ms || 500;
    totalMs += ms;
    await sleep(Math.min(ms, 1200) * 0.85);
    out.textContent = "";
    const chk = el("span", "tb-check", "✓");
    out.appendChild(chk);
    out.appendChild(el("span", "", (c.result || "done") + " · " + (ms / 1000).toFixed(1) + "s"));
  }
  hn.textContent = "Used " + calls.length + " tool" + (calls.length > 1 ? "s" : "") + " · " + (totalMs / 1000).toFixed(1) + "s";
}

/* ---------------- actions ---------------- */
function addActions(body, actions) {
  if (!actions || !actions.length) return;
  const row = el("div", "m-actions");
  actions.forEach(a => {
    const btn = el("button", "m-act", a.label);
    btn.addEventListener("click", () => {
      if (a.run) { a.run(btn); return; }
      btn.classList.add("done");
      btn.textContent = "✓ " + a.label;
      toast(a.toast || "Done", "ok");
    });
    row.appendChild(btn);
  });
  body.appendChild(row);
  scrollChat();
}

/* ---------------- reply pipeline ---------------- */
function agentReply(spec) {
  chat.queue = chat.queue.then(async () => {
    chat.busy = true;
    const body = addAgentShell();
    const stopTyping = addTyping(body);
    await sleep(spec.thinkMs || 650);
    stopTyping();
    if (spec.tools) await runTools(body, spec.tools);
    if (spec.text) await streamRich(body, spec.text);
    addActions(body, spec.actions);
    chat.busy = false;
    scrollChat();
  });
  return chat.queue;
}

/* ---------------- intent routing ---------------- */
function scoreFlow(flow, msg) {
  const m = msg.toLowerCase();
  let score = 0;
  (flow.triggers || []).forEach(t => { if (m.includes(t.toLowerCase())) score += t.length > 6 ? 3 : 2; });
  if (flow.label && m.includes(flow.label.toLowerCase())) score += 4;
  return score;
}
function wireFlowActions(actions) {
  return (actions || []).map(a => ({ label: a.label, toast: a.toast }));
}
const FALLBACK_OPENERS = [
  "That one I can't reach in this demo…",
  "Outside my demo data, lah —",
  "I don't have live data for that one —",
];
let fallbackCount = 0;
function routeMessage(text, chips) {
  const p = FOW.data();
  const m = (text || "").toLowerCase();

  /* 0 — the recap button must always win */
  if (/(end.of.week|week recap|weekly recap|eod report|end of day recap|weekly report|status report)/.test(m)) return recapFlow();

  /* 1 — persona-authored flows */
  let best = null, bestScore = 2;
  (p.chatFlows || []).forEach(f => {
    const s = scoreFlow(f, m);
    if (s > bestScore) { best = f; bestScore = s; }
  });
  if (best && text) {
    return { thinkMs: 700, tools: best.toolCalls, text: best.response, actions: wireFlowActions(best.actions) };
  }

  /* 2 — built-in universal intents */
  if (/\b(brief|my day|today|morning|start)\b/.test(m) && /\b(brief|day|today|catch|start)\b/.test(m)) return briefFlow();
  if (/\b(calendar|meeting|schedule|agenda)\b/.test(m) && !chips.length) return calendarFlow();
  if (/\b(approv|pending|sign.?off)\b/.test(m) && !chips.length) return approvalsFlow();
  if (/\b(inbox|email|unread|mail|message)\b/.test(m) && !chips.length) return inboxFlow();
  if (/\b(task|ticket|to.?do|assigned)\b/.test(m) && !chips.length) return tasksFlow();
  if (/\b(what can you|help|capabilit|tools|connected|skills)\b/.test(m)) return capabilitiesFlow();
  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(m)) return {
    thinkMs: 380,
    text: "Hey " + p.user.name.split(" ")[0] + " — ready when you are.\n\nDrag any card from your canvas into this chat and I'll dig into it, or start with one of the suggestions below.",
  };
  if (/\b(thank|great|nice|awesome|perfect)\b/.test(m)) return { thinkMs: 320, text: "Anytime. I'll keep watching your queues — ping me when something needs a second brain. ✦" };

  /* 2.5 — easter-egg intents */
  if (/\b(time now|what.*time|current time)\b/.test(m)) {
    const now = new Date();
    const hhmm = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const curMin = now.getHours() * 60 + now.getMinutes();
    const upcoming = (p.meetings || []).find(mt => {
      const parts = String(mt.time).split(":");
      return (Number(parts[0]) * 60 + Number(parts[1])) > curMin;
    });
    const mt = upcoming || (p.meetings || [])[0];
    return {
      thinkMs: 350,
      text: "It's **" + hhmm + "** in " + p.user.location + ", lah. Your next meeting — **" + (mt ? mt.title : "nothing on the books") + "** — starts at " + (mt ? (upcoming ? mt.time : mt.time + ", first thing Monday") : "…never, actually") + ".",
    };
  }
  if (/\b(llm|language model|which model|what model|gpt|claude|real ai|are you ai|hooked.*model)\b/.test(m)) {
    return {
      thinkMs: 500,
      text: "Honest answer? There's **no LLM** behind this seat — I'm a scripted demo brain: keyword routing over curated flows, running entirely in this page with **zero network calls**.\n" +
        "> In a production build, this seat gets wired to a real model through the MCP layer — same choreography, real reasoning.\n" +
        "For today, everything you see is choreography, lah. ✦",
    };
  }
  if (/\b(who are you|your name|what are you)\b/.test(m)) {
    const conns = (p.connections || []).slice(0, 2).map(c => "**" + (SERVERS[c] ? SERVERS[c].name : c) + "**");
    return {
      thinkMs: 400,
      text: "I'm **askMElah** — Mediacorp's FoW copilot for " + p.user.dept + ". I'm wired into " + conns.join(" and ") + ", among others.\nDrag any card from your canvas into this chat and I'll show you what I can do with it.",
    };
  }

  /* 3 — chip-context responders */
  if (chips.length) return chipFlow(chips, text);

  /* 4 — graceful fallback */
  const opener = FALLBACK_OPENERS[fallbackCount++ % FALLBACK_OPENERS.length];
  return {
    thinkMs: 520,
    text: opener + " But here's what I *can* dig into for you right now:\n" +
      (p.suggestions || []).slice(0, 3).map(s => "- " + s).join("\n") +
      "\n\nOr drag any card on your canvas into the chat and I'll take it from there.",
  };
}

/* ---------------- built-in universal flows ---------------- */
function srvPick(p, wanted, fallback) {
  return (p.connections || []).find(c => wanted.includes(c)) || fallback;
}
function briefFlow() {
  const p = FOW.data();
  const cal = srvPick(p, ["outlook", "gcal"], "gcal");
  const mail = srvPick(p, ["outlook", "gmail"], "gmail");
  const appr = srvPick(p, ["workday", "servicenow", "ariba", "docusign", "salesforce"], "workday");
  const urgent = p.inbox.filter(i => i.urgent);
  const unread = p.inbox.filter(i => i.unread).length;
  const pending = FOW.pendingApprovals();
  const high = pending.filter(a => a.urgency === "high");
  const next = p.meetings[0];
  const rows = p.meetings.slice(0, 4).map(mt => "|" + mt.time + "|" + mt.title + "|" + mt.dur + "|").join("\n");
  return {
    thinkMs: 800,
    tools: [
      { server: cal, tool: SERVERS[cal].tools[0], args: "date=2026-08-08", result: p.meetings.length + " meetings", ms: 420 },
      { server: mail, tool: SERVERS[mail].tools[0], args: "filter=unread", result: unread + " unread · " + urgent.length + " urgent", ms: 560 },
      { server: appr, tool: "list_requests", args: "assignee=me", result: pending.length + " pending approvals", ms: 380 },
    ],
    text:
      "## Your day at a glance\n" +
      "**" + p.focus.headline + "** " + p.focus.sub + "\n" +
      "|Time|Meeting|Len|\n" + rows + "\n" +
      (urgent.length ? "> Urgent: **" + urgent[0].from + "** — " + urgent[0].subject + "\n" : "") +
      "You have **" + pending.length + " approvals** waiting" + (high.length ? " (" + high.length + " marked high)" : "") + " and **" + unread + " unread** that matter.\n" +
      "{{kpis}}\n" +
      "My take: clear the approvals before **" + (next ? next.time : "09:30") + "**, then protect an hour for deep work — I can hold the slot.",
    actions: [
      { label: "Hold 10:00–11:00 for deep work", toast: "Focus block added to your calendar" },
      { label: "Review approvals", run: btn => { btn.classList.add("done"); btn.textContent = "✓ Opening approvals"; agentReply(approvalsFlow()); } },
    ],
  };
}
function calendarFlow() {
  const p = FOW.data();
  const cal = srvPick(p, ["outlook", "gcal"], "gcal");
  const rows = p.meetings.map(mt => "|" + mt.time + "|" + mt.title + "|" + mt.attendees.slice(0, 2).join(", ") + (mt.attendees.length > 2 ? " +" + (mt.attendees.length - 2) : "") + "|").join("\n");
  const gapNote = "Your longest free stretch is **11:00–13:00** — good window for focus work.";
  return {
    thinkMs: 600,
    tools: [{ server: cal, tool: SERVERS[cal].tools[0], args: "date=2026-08-08", result: p.meetings.length + " events", ms: 430 }],
    text: "## Today · Friday, Aug 8\n|Time|Meeting|With|\n" + rows + "\n" + gapNote,
    actions: [
      { label: "Prep me for the next meeting", run: btn => { btn.classList.add("done"); btn.textContent = "✓ Prepping"; agentReply(chipFlow([{ type: "meeting", label: p.meetings[0].title, data: p.meetings[0] }], "prep")); } },
      { label: "Decline low-priority conflicts", toast: "No conflicts found — you're clean today" },
    ],
  };
}
function approvalsFlow() {
  const p = FOW.data();
  const pending = FOW.pendingApprovals();
  if (!pending.length) return { thinkMs: 420, text: "Your approval queue is **empty** — everything's been cleared. I'll ping you when something new lands. ✦" };
  const appr = srvPick(p, ["workday", "servicenow", "ariba", "docusign", "salesforce"], "workday");
  const rows = pending.map(a => "|" + a.type + "|" + a.title + "|" + (a.amount || "—") + "|" + a.urgency + "|").join("\n");
  const low = pending.filter(a => a.urgency === "low");
  return {
    thinkMs: 650,
    tools: [{ server: appr, tool: "list_requests", args: "assignee=me&status=pending", result: pending.length + " pending", ms: 420 }],
    text: "## Pending your sign-off\n|Type|Item|Amount|Urgency|\n" + rows + "\n" +
      (low.length ? "The **" + low.length + " low-risk** item" + (low.length > 1 ? "s" : "") + " look routine — within policy, familiar requesters. I can clear those for you and leave the rest for your call." : "These all warrant a look — nothing I'd rubber-stamp."),
    actions: low.length ? [{
      label: "Approve the " + low.length + " low-risk item" + (low.length > 1 ? "s" : ""),
      run: btn => {
        btn.classList.add("done"); btn.textContent = "✓ Approved";
        low.forEach(a => FOW.approve(a.id, true));
        toast(low.length + " approval" + (low.length > 1 ? "s" : "") + " cleared — requesters notified", "ok");
      },
    }] : [],
  };
}
function inboxFlow() {
  const p = FOW.data();
  const mail = srvPick(p, ["outlook", "gmail"], "gmail");
  const urgent = p.inbox.filter(i => i.urgent);
  const items = p.inbox.slice(0, 4).map(i => "- **" + i.from + "** · " + i.subject + " — " + i.time).join("\n");
  return {
    thinkMs: 700,
    tools: [
      { server: mail, tool: SERVERS[mail].tools[0], args: "folder=inbox&limit=50", result: p.inbox.length + " recent · " + p.inbox.filter(i => i.unread).length + " unread", ms: 520 },
      { server: srvPick(p, ["slack", "teams"], "slack"), tool: "search_messages", args: "mentions=@me", result: "3 mentions", ms: 360 },
    ],
    text: "## Inbox triage\n" + items + "\n" +
      (urgent.length ? "> Handle first: **" + urgent[0].subject + "** from " + urgent[0].from + " — it's blocking them today.\n" : "") +
      "The rest can wait for your 16:00 email block. Want me to draft replies for the top two?",
    actions: [
      { label: "Draft replies to the top 2", toast: "2 drafts created — waiting in your outbox" },
      { label: "Snooze the rest to 16:00", toast: "6 threads snoozed to 4:00 PM" },
    ],
  };
}
function tasksFlow() {
  const p = FOW.data();
  const src = (p.tasks[0] || {}).source || "jira";
  const rows = p.tasks.map(t => "|`" + t.id + "`|" + t.title + "|" + t.due + "|" + t.status + "|").join("\n");
  const blocked = p.tasks.filter(t => t.status === "blocked");
  return {
    thinkMs: 620,
    tools: [{ server: src, tool: "search_issues", args: "assignee=me&sprint=current", result: p.tasks.length + " open items", ms: 470 }],
    text: "## Your open items\n|Key|Task|Due|Status|\n" + rows + "\n" +
      (blocked.length ? "> **" + blocked[0].id + "** is blocked — I'd chase that first; it has the nearest downstream dependency." : "Nothing blocked. The P1 due soonest is where I'd start."),
    actions: [{ label: "Nudge the blocker's owner", toast: "Nudge sent with context attached" }],
  };
}
function recapFlow() {
  const p = FOW.data();
  const cal = srvPick(p, ["outlook", "gcal"], "gcal");
  const mail = srvPick(p, ["outlook", "gmail"], "gmail");
  const wins = p.kpis.filter(k => k.deltaGood).map(k => "- **" + k.label + "**: " + k.value + " (" + k.delta + " " + (k.vs || "") + ")");
  const risks = p.kpis.filter(k => !k.deltaGood).map(k => "- **" + k.label + "**: " + k.value + " (" + k.delta + ") — " + k.note);
  const blocked = p.tasks.filter(t => t.status === "blocked");
  const delDone = Object.keys(state.delegated[state.personaId] || {}).length;
  const cleared = (state.approved[state.personaId] || new Set()).size;
  const goal = (p.goals || []).slice().sort((a, b) => a.pct - b.pct)[0];
  const text =
    "## Week recap — w/e Friday, Aug 8\n" +
    p.focus.headline + "\n" +
    "## Wins\n" + (wins.join("\n") || "- Steady week — no fires") + "\n" +
    (delDone || cleared ? "- Cleared **" + cleared + " approval" + (cleared === 1 ? "" : "s") + "**" + (delDone ? " and delegated **" + delDone + " task" + (delDone > 1 ? "s" : "") + "** to askMElah" : "") + "\n" : "") +
    "## Watch-outs\n" + (risks.join("\n") || "- Nothing red this week") + "\n" +
    (blocked.length ? "- **" + blocked[0].id + "** still blocked — escalation is out\n" : "") +
    "## Next week\n" +
    (goal ? "- Push **" + goal.label + "** (" + goal.pct + "% — " + goal.detail + ")\n" : "") +
    "- " + (p.week ? "Rebalance the calendar: " + p.week.insight : "Protect two deep-work blocks early in the week.") + "\n" +
    "> Formatted and ready — send it as-is or tell me what to reframe.";
  return {
    thinkMs: 900,
    tools: [
      { server: cal, tool: "get_calendar", args: "range=Aug 3–8", result: (p.week ? p.week.meetingHours + "h of meetings" : p.meetings.length + " meetings"), ms: 430 },
      { server: p.trend.source || "excel", tool: "run_query", args: "period=week 32", result: "KPIs refreshed", ms: 520 },
      { server: mail, tool: SERVERS[mail].tools[0], args: "sent=this week", result: "threads handled: 38", ms: 390 },
    ],
    text,
    actions: [
      {
        label: "Copy recap",
        run: btn => {
          const plain = text.replace(/[#*>{}]/g, "").replace(/\n{2,}/g, "\n");
          const done = () => { btn.classList.add("done"); btn.textContent = "✓ Copied"; toast("Recap copied to clipboard"); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(plain).then(done, done); else done();
        },
      },
      { label: "Email it to my manager", toast: "Draft addressed to your manager — in your outbox" },
      { label: "Post to my team channel", toast: "Posted to your team channel with a thread for questions" },
    ],
  };
}
function capabilitiesFlow() {
  const p = FOW.data();
  const conns = (p.connections || []).map(c => "- **" + (SERVERS[c] ? SERVERS[c].name : c) + "** — `" + (SERVERS[c] ? SERVERS[c].tools.slice(0, 2).join("` `") : "") + "`").join("\n");
  const skills = (p.skills || []).map(s => "- " + s.icon + " **" + s.name + "** — " + s.desc).join("\n");
  return {
    thinkMs: 550,
    text: "## What I'm wired into\n" + conns + "\n---\n## Skills I can run\n" + skills +
      "\n\nAsk me anything against these — or **drag any card** from your canvas into the chat and I'll analyze it in place.",
  };
}

/* ---------------- chip responders ---------------- */
function chipIcon(type) {
  return { kpi: "chart", trend: "chart", donut: "donut", bars: "bars", heatmap: "heat", goals: "goal", meeting: "cal", mail: "mail", approval: "check", task: "task", skill: "spark", automation: "bolt", server: "plug", hero: "person", week: "clockIco", file: "file" }[type] || "spark";
}
function chipFlow(chips, text) {
  const p = FOW.data();
  const c = chips[0];
  const d = c.data || {};
  const m = (text || "").toLowerCase();
  switch (c.type) {
    case "kpi":
      return {
        thinkMs: 750,
        tools: [{ server: d.source || "excel", tool: "run_query", args: "metric=" + (d.id || "kpi"), result: "12 months of history", ms: 480 }],
        text: "**" + d.label + "** sits at **" + d.value + "** — " + d.delta + " " + (d.vs || "") + ", which is " + (d.deltaGood ? "the right direction" : "worth attention") + ".\n" +
          d.note + "\n{{spark:" + d.id + "}}\n" +
          (d.deltaGood ? "I'd bank this: mention it in your weekly update while the trend is fresh." : "I'd flag this in your weekly update and set a watch — I can alert you if it moves another 2%."),
        actions: [
          { label: "Add to my weekly update", toast: "Pinned to Friday's update draft" },
          { label: "Watch this metric", toast: "Watching — I'll ping you on a ±2% move" },
        ],
      };
    case "trend": case "donut": case "bars": case "heatmap": {
      const chart = p[c.type];
      return {
        thinkMs: 700,
        tools: [{ server: chart.source || "excel", tool: "run_query", args: "view=" + c.type, result: "refreshed 4 min ago", ms: 430 }],
        text: "Here's **" + chart.title + "**, refreshed:\n{{chart:" + c.type + "}}\n" + chart.insight + "\n\nWant me to break it down further, or package this view for a deck?",
        actions: [
          { label: "Add slide to my deck", toast: "Slide added to 'Weekly review.pptx'" },
          { label: "Export underlying data", toast: "CSV exported to your Drive" },
        ],
      };
    }
    case "meeting": {
      const rel = p.inbox.find(i => i.subject.toLowerCase().split(" ").some(w => w.length > 5 && d.title.toLowerCase().includes(w)));
      return {
        thinkMs: 850,
        tools: [
          { server: srvPick(p, ["outlook", "gcal"], "gcal"), tool: "get_calendar", args: "event=" + d.time, result: (d.attendees || []).length + " attendees confirmed", ms: 380 },
          { server: srvPick(p, ["teams", "zoom"], "zoom"), tool: "get_transcript", args: "last_occurrence", result: "notes from last session", ms: 610 },
        ],
        text: "## Prep: " + d.title + " · " + d.time + "\n" +
          "**Who:** " + (d.attendees || []).join(", ") + "\n**Agenda:** " + (d.agenda || "not set") + "\n" +
          "- Last session ended with two open action items — one is still unresolved\n" +
          "- " + (rel ? "Related thread in your inbox: **" + rel.subject + "** from " + rel.from : "No related threads in your inbox — you're walking in clean") + "\n" +
          "> Suggested opener: close the outstanding action item first — it unblocks the rest of the agenda.",
        actions: [
          { label: "Draft talking points", toast: "Talking points saved to your notes" },
          { label: "Message attendees", toast: "Pre-read sent to " + (d.attendees || []).length + " attendees" },
        ],
      };
    }
    case "mail":
      return {
        thinkMs: 800,
        tools: [{ server: d.source || "gmail", tool: "get_message", args: "id=" + (d.id || "msg"), result: "full thread · 3 messages", ms: 460 }],
        text: "From **" + d.from + "**, " + d.time + (d.urgent ? " — flagged urgent" : "") + ":\n> " + d.subject + " — " + d.preview + "\n" +
          "Reading the thread, they need a decision from you, not more analysis. Here's a reply that unblocks them:\n" +
          "> \"Thanks " + String(d.from).split(" ")[0] + " — go ahead with the option you outlined. Flag anything above the threshold to me directly. Can you send a one-line status by Friday?\"",
        actions: [
          { label: "Send this reply", toast: "Reply sent via " + (SERVERS[d.source] ? SERVERS[d.source].name : "email") },
          { label: "Edit before sending", toast: "Draft opened for editing" },
          { label: "Snooze to 16:00", toast: "Thread snoozed to 4:00 PM" },
        ],
      };
    case "approval": {
      const risky = d.urgency === "high";
      return {
        thinkMs: 780,
        tools: [
          { server: d.source || "workday", tool: "list_requests", args: "id=" + (d.id || "req"), result: "request details + history", ms: 390 },
          { server: d.source || "workday", tool: "run_report", args: "requester=" + encodeURIComponent(d.requester || ""), result: "requester history: clean", ms: 520 },
        ],
        text: "**" + d.type + "** from **" + d.requester + "** — " + d.title + (d.amount ? " (**" + d.amount + "**)" : "") + ".\n" + d.meta + "\n" +
          (risky
            ? "> My read: this one deserves your eyes — it's outside the routine pattern. I'd ask one clarifying question before approving."
            : "> My read: routine. Within policy, requester history is clean, and it matches " + (d.type === "PTO" ? "team coverage" : "the approved budget line") + ". Safe to approve."),
        actions: [
          { label: risky ? "Approve anyway" : "Approve it", run: btn => { btn.classList.add("done"); btn.textContent = "✓ Approved"; FOW.approve(d.id, true); toast("Approved — " + d.requester + " has been notified", "ok"); } },
          { label: "Ask a clarifying question", toast: "Question sent to " + d.requester },
        ],
      };
    }
    case "task":
      return {
        thinkMs: 680,
        tools: [{ server: d.source || "jira", tool: "search_issues", args: "key=" + d.id, result: "issue + 4 linked items", ms: 440 }],
        text: "`" + d.id + "` — **" + d.title + "** · due " + d.due + " · " + d.status + " · " + d.priority + ".\n" +
          (d.status === "blocked"
            ? "It's blocked on an upstream dependency. The fastest unblock: escalate to the owner with a specific ask and a deadline — I can send that now."
            : "It's on track for " + d.due + ". Nearest risk is calendar pressure on your end — want me to block focus time for it?"),
        actions: [
          d.status === "blocked" ? { label: "Escalate the blocker", toast: "Escalation sent with full context" } : { label: "Block 90 min focus time", toast: "Focus block held Mon 09:00" },
          { label: "Move to next sprint", toast: d.id + " moved to Sprint 18" },
        ],
      };
    case "skill":
      return {
        thinkMs: 600,
        text: d.icon + " **" + d.name + "** — " + d.desc + "\nIt has run **" + d.runs + "×**, last " + String(d.lastRun).toLowerCase() + ". Want a fresh run against today's data?",
        actions: [{
          label: "Run " + d.name + " now",
          run: btn => {
            btn.classList.add("done"); btn.textContent = "✓ Running";
            agentReply({
              thinkMs: 500,
              tools: (FOW.data().connections || []).slice(0, 2).map((s, i) => ({ server: s, tool: SERVERS[s].tools[0], args: "scope=today", result: i ? "merged into run" : "fresh data pulled", ms: 480 + i * 260 })),
              text: "**" + d.name + " finished.** Output summary:\n- Ran against today's snapshot — no anomalies vs the last run\n- 2 items were auto-handled, 1 needs your judgement (it's in your approvals)\n> Full output saved to your workspace log.",
            });
          },
        }],
      };
    case "automation":
      return {
        thinkMs: 550,
        text: "**" + d.name + "** runs **" + d.schedule + "** — " + d.desc + "\nLast result: " + d.lastResult + ". It's healthy; no failed runs in 30 days.",
        actions: [
          { label: "Run it now", toast: d.name + " triggered — output will land shortly" },
          { label: "Pause schedule", toast: d.name + " paused — resume anytime" },
        ],
      };
    case "week": {
      const rows = d.days.map((day, i) => "|" + day + "|" + d.meetings[i] + "h|" + d.focus[i] + "h|").join("\n");
      return {
        thinkMs: 720,
        tools: [{ server: srvPick(p, ["outlook", "gcal"], "gcal"), tool: "list_events", args: "range=this week", result: d.meetingHours + "h across meetings", ms: 480 }],
        text: "Your week: **" + d.meetingHours + "h in meetings** against **" + d.focusHours + "h of focus** — that meeting load cost roughly **" + d.meetingCost + "** in people-time.\n" +
          "|Day|Meetings|Focus|\n" + rows + "\n" + d.insight +
          "\n> Rule of thumb: under 40% meeting load keeps a maker's week productive. Want me to defend some blocks?",
        actions: [
          { label: "Protect 2 focus blocks next week", toast: "Two 90-min blocks held Tue + Thu mornings" },
          { label: "Flag low-value recurring meetings", toast: "3 candidates flagged — review them in chat anytime" },
        ],
      };
    }
    case "file": {
      const kindName = { doc: "document", sheet: "spreadsheet", deck: "deck", pdf: "PDF" }[d.kind] || "file";
      return {
        thinkMs: 700,
        tools: [{ server: d.source || "gdrive", tool: "get_file", args: "name=" + d.name, result: "parsed " + kindName, ms: 540 }],
        text: "**" + d.name + "** — " + kindName + ", updated " + String(d.modified).toLowerCase() + " by **" + d.by + "**.\n" +
          "- The numbers align with what's on your canvas — no surprises vs the " + (p.trend ? p.trend.title.toLowerCase() : "latest data") + "\n" +
          "- One section is waiting on input from you; " + String(d.by).split(" ")[0] + " left a comment there yesterday\n" +
          "> Suggested: send " + String(d.by).split(" ")[0] + " your two comments before EOD so it ships Monday.",
        actions: [
          { label: "Open in " + (SERVERS[d.source] ? SERVERS[d.source].name : "source"), toast: "Opening " + d.name },
          { label: "Draft my comments", toast: "Two comments drafted — review before they post" },
        ],
      };
    }
    case "server": {
      const s = SERVERS[d.id] || {};
      return {
        thinkMs: 600,
        tools: [{ server: d.id, tool: "health_check", args: "", result: "latency 84ms · auth OK", ms: 320 }],
        text: "**" + s.name + "** MCP server — connected and healthy.\nTools I can call:\n" + (s.tools || []).map(t => "- `" + t + "`").join("\n") + "\n\nAsk me anything that needs " + s.name + " and I'll use these under the hood.",
      };
    }
    default:
      if (m) return routeMessage(m, []);
      return { thinkMs: 480, text: "I've got **" + c.label + "** loaded. What would you like to know about it?" };
  }
}

/* ---------------- composer ---------------- */
function attachChip(chip) {
  if (chat.chips.some(c => c.label === chip.label)) return;
  chat.chips.push(chip);
  renderChips();
  $("#cdInput").focus();
}
function renderChips() {
  const box = $("#cdChips");
  box.textContent = "";
  chat.chips.forEach((c, i) => {
    const chip = el("span", "chip");
    const icon = ico(chipIcon(c.type)); icon.className = "ck-ico";
    chip.appendChild(icon);
    chip.appendChild(el("span", "cl", c.label));
    const x = el("span", "x", "×");
    x.title = "Remove";
    x.addEventListener("click", () => { chat.chips.splice(i, 1); renderChips(); });
    chip.appendChild(x);
    box.appendChild(chip);
  });
}
function sendMessage(raw) {
  const text = (raw != null ? raw : $("#cdInput").value).trim();
  const chips = chat.chips.slice();
  if (!text && !chips.length) return;
  $("#cdInput").value = "";
  $("#cdInput").style.height = "auto";
  chat.chips = [];
  renderChips();
  addUserMsg(text, chips);
  const spec = routeMessage(text, chips);
  agentReply(spec);
  refreshSuggestions();
}

/* ---------------- suggestions ---------------- */
let suggPool = [];
function refreshSuggestions() {
  const p = FOW.data();
  if (!suggPool.length) suggPool = (p.suggestions || []).slice();
  const box = $("#cdSugg");
  box.textContent = "";
  suggPool.slice(0, 3).forEach(s => {
    const b = el("button", "sg", s);
    b.addEventListener("click", () => { suggPool = suggPool.filter(x => x !== s).concat(s); sendMessage(s); });
    box.appendChild(b);
  });
}
function chatWelcome() {
  const p = FOW.data();
  msgsEl().textContent = "";
  chat.chips = []; renderChips();
  suggPool = (p.suggestions || []).slice();
  refreshSuggestions();
  const pending = FOW.pendingApprovals().length;
  const urgent = p.inbox.filter(i => i.unread).length;
  agentReply({
    thinkMs: 500,
    text: greeting() + ", **" + p.user.name.split(" ")[0] + "** ✦ While you were out I synced " +
      (p.connections || []).slice(0, 3).map(c => SERVERS[c] ? SERVERS[c].name : c).join(", ") +
      " and " + ((p.connections || []).length - 3) + " more.\n" +
      "**" + p.meetings.length + " meetings**, **" + pending + " approvals**, and **" + urgent + " unread** are on your plate. Want the full picture?",
    actions: [
      { label: "Brief me on my day", run: btn => { btn.classList.add("done"); btn.textContent = "✓ On it"; agentReply(briefFlow()); } },
    ],
  });
}
