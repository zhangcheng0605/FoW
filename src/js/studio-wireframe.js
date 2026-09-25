/* ============================================================
   FoW · studio-wireframe — THE WIREFRAME
   Same engine, none of the chrome: black lines on white.
   Charts, drag-to-ask, delegation, approvals, workflows —
   every interaction of the full build, in low-fi.
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

function wfSection(cv, label) {
  const h = el("div", "wf-sect", label);
  h.dataset.span = "12";
  cv.appendChild(h);
}

function renderStudio_wireframe(p, cv) {
  clearCharts();
  state.cardIndex = 0;
  cv.textContent = "";
  cv.className = "wf-grid"; /* plain 12-column grid, not the studio flow */

  /* ---- header: who, what matters, jump-offs ---- */
  const head = el("section", "wf-head");
  head.dataset.span = "12";
  head.appendChild(el("div", "wf-hi", greeting() + ", " + p.user.name.split(" ")[0] + " · Friday, August 8 · " + p.user.location));
  head.appendChild(el("h1", "wf-title", p.focus.headline));
  head.appendChild(el("div", "wf-sub", p.focus.sub));
  const acts = el("div", "wf-acts");
  const stat = (n, label, ask) => {
    const b = el("button", "wf-stat");
    b.appendChild(el("b", "", String(n)));
    b.appendChild(el("span", "", label));
    b.addEventListener("click", () => sendMessage(ask));
    acts.appendChild(b);
    return b;
  };
  stat(p.meetings.length, "meetings", "What's on my calendar today?");
  const apStat = stat(FOW.pendingApprovals().length, "approvals", "What's pending my approval?");
  apStat.classList.add("wf-ap-stat");
  stat(p.inbox.filter(i => i.unread).length, "unread", "Triage my inbox");
  stat(p.tasks.length, "tasks", "Show my open tasks");
  const recap = el("button", "wf-btn solid", "Draft my week recap");
  recap.addEventListener("click", () => sendMessage("Draft my end-of-week recap"));
  acts.appendChild(recap);
  head.appendChild(acts);
  makeDraggable(head, { type: "hero", label: p.focus.headline, data: {} });
  cv.appendChild(head);

  /* ---- numbers ---- */
  p.kpis.forEach(k => {
    cv.appendChild(card(3, {
      cls: "kpi",
      chip: { type: "kpi", label: k.label + " · " + k.value, data: k },
      body: b => {
        b.appendChild(el("div", "kpi-label", k.label));
        const row = el("div", "kpi-row");
        const val = el("span", "kpi-value");
        countUp(val, k.value);
        row.appendChild(val);
        row.appendChild(el("span", "kpi-delta", (k.deltaDir === "up" ? "▲ " : "▼ ") + k.delta));
        b.appendChild(row);
        const sp = el("div", "kpi-spark");
        b.appendChild(sp);
        registerChart(sp, () => renderSpark(sp, k.spark));
      },
    }));
  });

  /* ---- charts ---- */
  const chartCard = (span, kind, icon, sub) => {
    const d = p[kind];
    cv.appendChild(card(span, {
      icon, title: d.title, sub,
      chip: { type: kind, label: d.title, data: { title: d.title } },
      table: { kind, data: d },
      body: b => registerChart(b, () => {
        if (b.dataset.mode === "table") return;
        if (kind === "trend") renderTrend(b, d);
        else if (kind === "donut") renderDonut(b, d);
        else renderBars(b, d);
      }),
      foot: d.insight,
    }));
  };
  chartCard(8, "trend", "chart", p.trend.subtitle);
  chartCard(4, "donut", "donut", "share of total");
  chartCard(6, "bars", "bars", p.bars.unit);

  /* ---- delegate to agents ---- */
  cv.appendChild(card(6, {
    cls: "dg-card",
    icon: "robot", title: "Delegate to askMElah", sub: "the agent runs it in the background and reports back",
    body: b => {
      (p.delegations || []).forEach(d => {
        const doneAlready = (state.delegated[state.personaId] || {})[d.id];
        const it = el("div", "dg-item");
        const orb = askmeAv(26); orb.classList.add("dg-orb");
        it.appendChild(orb);
        const bd = el("div", "dg-body");
        bd.appendChild(el("div", "dg-label", d.label));
        const sub = el("div", "dg-sub", doneAlready ? d.result : d.detail);
        bd.appendChild(sub);
        const prog = el("div", "dg-prog"); prog.hidden = true;
        const fill = el("i"); prog.appendChild(fill);
        bd.appendChild(prog);
        if (doneAlready && d.artifact) {
          const a = el("span", "dg-artifact");
          a.appendChild(ico("file")); a.appendChild(el("span", "", d.artifact));
          bd.appendChild(a);
        }
        it.appendChild(bd);
        const stateBox = el("span", "dg-state");
        if (doneAlready) stateBox.appendChild(el("span", "dg-pill done", "done"));
        else {
          const btn = el("button", "dg-btn", "Delegate");
          btn.addEventListener("click", () => runDelegation(d, { orb, sub, prog, fill, stateBox, btn, bd }));
          stateBox.appendChild(btn);
        }
        it.appendChild(stateBox);
        makeDraggable(it, { type: "task", label: d.label, data: { id: d.id, title: d.label, due: "today", status: doneAlready ? "done" : "todo", priority: "P1", source: (d.steps[0] || {}).server } });
        b.appendChild(it);
      });
    },
  }));

  wfSection(cv, "Today");

  /* ---- approvals + autopilot ---- */
  const apCard = card(4, {
    cls: "ap-card",
    icon: "check", title: "Approvals", sub: FOW.pendingApprovals().length + " pending",
    body: b => {
      p.approvals.forEach(a => {
        const done = (state.approved[state.personaId] || new Set()).has(a.id);
        const it = el("div", "ap-item" + (done ? " done" : ""));
        it.dataset.approval = a.id;
        it.appendChild(el("span", "ap-urg " + a.urgency));
        const bd = el("div", "ap-body");
        bd.appendChild(el("div", "ap-title", a.type + " — " + a.title));
        bd.appendChild(el("div", "ap-meta", a.requester + (a.amount ? " · " + a.amount : "")));
        it.appendChild(bd);
        if (!done) {
          const act = el("span", "ap-acts");
          const ok = el("button", "ap-ok"); ok.title = "Approve"; ok.appendChild(ico("check"));
          ok.addEventListener("click", e => { e.stopPropagation(); FOW.approve(a.id, true); toast("Approved — " + a.requester + " notified"); });
          const no = el("button", "ap-no"); no.title = "Ask askMElah first"; no.appendChild(ico("ask"));
          no.addEventListener("click", e => { e.stopPropagation(); attachChip({ type: "approval", label: a.type + ": " + a.title, data: a }); sendMessage("Should I approve this?"); });
          act.append(ok, no);
          it.appendChild(act);
        }
        makeDraggable(it, { type: "approval", label: a.type + ": " + a.title, data: a });
        b.appendChild(it);
      });
    },
  });
  const auto = el("button", "autopilot" + (state.autopilot[state.personaId] ? " on" : ""));
  auto.title = "When on, askMElah clears low-risk approvals within policy";
  auto.append(el("span", "", "Autopilot"), el("span", "sw"));
  auto.addEventListener("click", () => {
    const on = !state.autopilot[state.personaId];
    state.autopilot[state.personaId] = on;
    auto.classList.toggle("on", on);
    if (!on) { toast("Autopilot off — everything waits for you again", "info"); return; }
    const low = FOW.pendingApprovals().filter(a => a.urgency === "low");
    if (!low.length) { toast("Autopilot on — nothing low-risk in the queue", "info"); return; }
    low.forEach((a, i) => setTimeout(() => {
      FOW.approve(a.id, i === low.length - 1);
      if (i === low.length - 1) toast("Autopilot cleared " + low.length + " low-risk approval" + (low.length > 1 ? "s" : ""));
    }, 700 + i * 450));
    agentReply({ thinkMs: 400, text: "**Autopilot is on.** I'll clear approvals that are within policy and under your limit, and leave anything unusual for you. Clearing **" + low.length + " low-risk item" + (low.length > 1 ? "s" : "") + "** now." });
  });
  const apHead = $(".card-h", apCard);
  apHead.insertBefore(auto, $(".ch-acts", apHead));
  cv.appendChild(apCard);

  /* ---- inbox ---- */
  cv.appendChild(card(4, {
    icon: "mail", title: "Needs your attention", sub: "double-click to draft a reply",
    body: b => {
      p.inbox.forEach(msg => {
        const it = el("div", "inb-item" + (msg.unread ? " unread" : ""));
        const bd = el("div", "inb-body");
        const top = el("div", "inb-top");
        top.appendChild(el("span", "inb-from", msg.from));
        top.appendChild(el("span", "inb-time", msg.time));
        bd.appendChild(top);
        const subj = el("div", "inb-subj", msg.subject);
        if (msg.urgent) subj.appendChild(el("span", "inb-urgent", "URGENT"));
        bd.appendChild(subj);
        it.appendChild(bd);
        it.addEventListener("dblclick", () => { attachChip({ type: "mail", label: msg.from + ": " + msg.subject, data: msg }); sendMessage("Summarize this and draft a reply"); });
        makeDraggable(it, { type: "mail", label: msg.from + ": " + msg.subject, data: msg });
        b.appendChild(it);
      });
    },
  }));

  /* ---- schedule ---- */
  cv.appendChild(card(4, {
    icon: "cal", title: "Schedule", sub: "Friday, August 8",
    body: b => {
      const ag = el("div", "agenda");
      p.meetings.forEach(mt => {
        const it = el("div", "ag-item");
        it.appendChild(el("span", "ag-time", mt.time));
        it.appendChild(el("span", "ag-line"));
        const bd = el("div", "ag-body");
        bd.appendChild(el("div", "ag-title", mt.title));
        bd.appendChild(el("div", "ag-meta", mt.dur + " · " + mt.attendees.length + " people"));
        it.appendChild(bd);
        const prep = el("button", "ag-join", "prep");
        prep.addEventListener("click", e => { e.stopPropagation(); attachChip({ type: "meeting", label: mt.time + " · " + mt.title, data: mt }); sendMessage("Prep me for this meeting"); });
        it.appendChild(prep);
        makeDraggable(it, { type: "meeting", label: mt.time + " · " + mt.title, data: mt });
        ag.appendChild(it);
      });
      b.appendChild(ag);
    },
  }));

  /* ---- cross-app workflows ---- */
  if (p.chains && p.chains.length) {
    cv.appendChild(card(12, {
      cls: "chn-card",
      icon: "bolt", title: "Workflows", sub: "one click, several systems — each step is an MCP call",
      body: b => {
        p.chains.forEach(c => {
          const it = el("div", "chn-item wf-chain");
          const bd = el("div", "wf-chain-bd");
          bd.appendChild(el("div", "chn-name", c.name));
          const path = el("div", "chn-path");
          c.steps.forEach((s, i) => {
            if (i) path.appendChild(el("span", "hop", "→"));
            path.appendChild(el("span", "wf-hop", SERVERS[s.server] ? SERVERS[s.server].name : s.server));
          });
          bd.appendChild(path);
          it.appendChild(bd);
          const run = el("button", "dg-btn", "Run");
          run.addEventListener("click", () => { addUserMsg("Run cross-app workflow: " + c.name); runChain(c); });
          it.appendChild(run);
          makeDraggable(it, { type: "chain", label: "Workflow: " + c.name, data: c });
          b.appendChild(it);
        });
      },
    }));
  }

  updateBadges();
}
window.renderStudio_wireframe = renderStudio_wireframe;
