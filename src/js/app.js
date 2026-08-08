/* ============================================================
   FoW · app — canvas, personas, drag-and-drop, palette, fx
   ============================================================ */
"use strict";

const state = {
  personaId: null,
  approved: {},        /* personaId -> Set of approval ids */
  delegated: {},       /* personaId -> { delegationId: "done" } */
  autopilot: {},       /* personaId -> bool */
  cardIndex: 0,
};

const FOW = {
  data() { return (window.FOW_DATA || {})[state.personaId] || null; },
  pendingApprovals() {
    const p = FOW.data(); if (!p) return [];
    const done = state.approved[state.personaId] || new Set();
    return p.approvals.filter(a => !done.has(a.id));
  },
  approve(id, celebrate) {
    const set = state.approved[state.personaId] || (state.approved[state.personaId] = new Set());
    set.add(id);
    const row = $('[data-approval="' + id + '"]');
    if (row) {
      row.classList.add("done");
      const acts = $(".ap-acts", row); if (acts) acts.remove();
    }
    updateBadges();
    if (celebrate) confetti();
  },
};
window.FOW = FOW;

/* ---------------- toasts ---------------- */
function toast(msg, kind) {
  const t = el("div", "toast" + (kind === "info" ? " info" : ""));
  t.appendChild(el("span", "t-ico", kind === "info" ? "✦" : "✓"));
  t.appendChild(el("span", "", msg));
  $("#toasts").appendChild(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 320); }, 3400);
}

/* ---------------- confetti ---------------- */
function confetti() {
  const cv = $("#fx"), ctx = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight;
  const acc = getComputedStyle(document.body).getPropertyValue("--acc").trim() || "#38bdf8";
  const cols = [acc, "#3987e5", "#199e70", "#c98500", "#d55181", "#ffffff"];
  const parts = [];
  for (let i = 0; i < 90; i++) {
    parts.push({
      x: innerWidth * (0.3 + Math.random() * 0.4), y: innerHeight * 0.65,
      vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 10,
      s: 3 + Math.random() * 4, c: cols[i % cols.length],
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, life: 1,
    });
  }
  let frame;
  const tick = () => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    let alive = 0;
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.vx *= 0.99; p.r += p.vr; p.life -= 0.011;
      if (p.life <= 0) return;
      alive++;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
      ctx.restore();
    });
    if (alive) frame = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, cv.width, cv.height);
  };
  cancelAnimationFrame(frame);
  tick();
}

/* ---------------- drag & drop ---------------- */
function makeDraggable(node, chip) {
  node.draggable = true;
  node.classList.add("draggy");
  node.addEventListener("dragstart", e => {
    node.classList.add("dragging");
    e.dataTransfer.setData("text/fow-chip", JSON.stringify(chip));
    e.dataTransfer.effectAllowed = "copy";
  });
  node.addEventListener("dragend", () => node.classList.remove("dragging"));
}
function wireDropzone() {
  const dock = $("#chatdock");
  let depth = 0;
  dock.addEventListener("dragenter", e => { if (hasChip(e)) { depth++; dock.classList.add("droptarget"); } });
  dock.addEventListener("dragleave", () => { if (--depth <= 0) { depth = 0; dock.classList.remove("droptarget"); } });
  dock.addEventListener("dragover", e => { if (hasChip(e)) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } });
  dock.addEventListener("drop", e => {
    e.preventDefault(); depth = 0; dock.classList.remove("droptarget");
    try {
      const chip = JSON.parse(e.dataTransfer.getData("text/fow-chip"));
      if (chip && chip.label) { attachChip(chip); toast("Added to chat — ask Flow about it", "info"); }
    } catch (_) { /* not ours */ }
  });
  function hasChip(e) { return Array.from(e.dataTransfer.types || []).includes("text/fow-chip"); }
}

/* ---------------- card factory ---------------- */
function card(span, o) {
  const c = el("article", "card" + (o.cls ? " " + o.cls : ""));
  c.dataset.span = span;
  c.style.setProperty("--i", state.cardIndex++);
  if (o.title) {
    const h = el("div", "card-h");
    const icon = el("span", "ch-ico"); icon.appendChild(ico(o.icon || "spark"));
    const tt = el("div", "ch-title");
    const tEl = el("div", "t", o.title);
    tEl.title = o.title;
    tt.appendChild(tEl);
    if (o.sub) tt.appendChild(el("div", "s", o.sub));
    h.append(icon, tt);
    if (o.badge && SERVERS[o.badge]) {
      const b = el("span", "ch-badge");
      b.appendChild(srvGlyph(o.badge, 13));
      b.appendChild(el("span", "", "via " + SERVERS[o.badge].name));
      h.appendChild(b);
    }
    const acts = el("span", "ch-acts");
    if (o.table) {
      const tbtn = el("button", "ch-act"); tbtn.title = "View as table"; tbtn.appendChild(ico("table"));
      tbtn.addEventListener("click", () => {
        const body = $(".card-b", c);
        if (body.dataset.mode === "table") { body.dataset.mode = "chart"; o.body(body); }
        else { body.dataset.mode = "table"; body.textContent = ""; body.appendChild(buildTable(o.table.kind, o.table.data)); }
      });
      acts.appendChild(tbtn);
    }
    if (o.chip) {
      const ask = el("button", "ch-act"); ask.title = "Ask Flow about this"; ask.appendChild(ico("ask"));
      ask.addEventListener("click", () => { attachChip(o.chip); toast("Added to chat — ask away", "info"); });
      acts.appendChild(ask);
      const grip = el("span", "ch-act"); grip.style.cursor = "grab"; grip.title = "Drag into chat"; grip.appendChild(ico("grip"));
      acts.appendChild(grip);
    }
    h.appendChild(acts);
    c.appendChild(h);
  }
  const body = el("div", "card-b");
  c.appendChild(body);
  if (o.body) o.body(body);
  if (o.foot) c.appendChild(el("div", "card-f", o.foot));
  if (o.chip) makeDraggable(c, o.chip);
  return c;
}

/* ---------------- canvas ---------------- */
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
function renderCanvas() {
  const p = FOW.data();
  const cv = $("#canvas");
  clearCharts();
  state.cardIndex = 0;
  cv.textContent = "";
  if (!p) {
    const none = el("div", "card"); none.dataset.span = "12";
    none.style.padding = "40px"; none.textContent = "No data pack found for this persona — run build.py after generating src/data/*.json.";
    cv.appendChild(none);
    return;
  }

  /* hero */
  const hero = el("article", "card hero"); hero.dataset.span = "12"; hero.style.setProperty("--i", state.cardIndex++);
  hero.appendChild(el("i", "hero-glow"));
  const hi = el("div", "hero-hi");
  hi.appendChild(el("span", "dot"));
  hi.appendChild(el("span", "", greeting() + ", " + p.user.name.split(" ")[0] + " — Friday, August 8"));
  hi.appendChild(el("span", "", "· " + p.user.location));
  hero.appendChild(hi);
  hero.appendChild(el("div", "hero-head", p.focus.headline));
  hero.appendChild(el("div", "hero-sub", p.focus.sub));
  const stats = el("div", "hero-stats");
  const mkStat = (icon, num, label, onclick, chip) => {
    const s = el("button", "hstat");
    const ic = el("span", "hs-ico"); ic.appendChild(ico(icon));
    s.appendChild(ic);
    s.appendChild(el("b", "", String(num)));
    s.appendChild(el("span", "", label));
    s.addEventListener("click", onclick);
    if (chip) makeDraggable(s, chip);
    stats.appendChild(s);
  };
  mkStat("cal", p.meetings.length, "meetings today", () => sendMessage("What's on my calendar today?"));
  mkStat("check", FOW.pendingApprovals().length, "approvals waiting", () => sendMessage("What's pending my approval?"));
  mkStat("mail", p.inbox.filter(i => i.unread).length, "unread that matter", () => sendMessage("Triage my inbox"));
  mkStat("task", p.tasks.length, "open tasks", () => sendMessage("Show my open tasks"));
  const recap = el("button", "hstat primary");
  const rIco = el("span", "hs-ico"); rIco.appendChild(ico("spark"));
  recap.append(rIco, el("span", "", "Draft my week recap"));
  recap.addEventListener("click", () => sendMessage("Draft my end-of-week recap"));
  stats.appendChild(recap);
  /* pulse check-in */
  const pulse = el("div", "pulse-row");
  pulse.appendChild(el("span", "", "Energy check:"));
  [["😄", "great"], ["🙂", "good"], ["😐", "flat"], ["😴", "running low"]].forEach(([emo, mood]) => {
    const b = el("button", "", emo);
    b.title = "Log: feeling " + mood;
    b.addEventListener("click", () => {
      $$("button", pulse).forEach(x => x.classList.remove("picked"));
      b.classList.add("picked");
      toast("Energy logged — visible only to you", "info");
      agentReply({
        thinkMs: 350,
        text: mood === "running low" || mood === "flat"
          ? "Noted. You have **" + p.meetings.length + " meetings** today — want me to find 45 minutes to decline or shorten? Protecting one block usually pays for itself."
          : "Love it. I'll queue the harder work — like **" + (p.tasks[0] || {}).id + "** — while the energy's there.",
      });
    });
    pulse.appendChild(b);
  });
  stats.appendChild(pulse);
  hero.appendChild(stats);
  cv.appendChild(hero);

  /* KPI tiles */
  p.kpis.forEach(k => {
    cv.appendChild(card(3, {
      cls: "kpi",
      chip: { type: "kpi", label: k.label + " · " + k.value, data: k },
      body: b => {
        const lb = el("div", "kpi-label");
        lb.appendChild(srvGlyph(k.source, 15));
        lb.appendChild(el("span", "", k.label));
        b.appendChild(lb);
        const row = el("div", "kpi-row");
        row.appendChild(el("span", "kpi-value", k.value));
        row.appendChild(el("span", "kpi-delta " + (k.deltaGood ? "good" : "bad"), (k.deltaDir === "up" ? "▲ " : "▼ ") + k.delta));
        b.appendChild(row);
        const sp = el("div", "kpi-spark");
        b.appendChild(sp);
        /* de-emphasis hue for the path, series accent on the current period */
        registerChart(sp, () => renderSpark(sp, k.spark));
        b.appendChild(el("div", "kpi-note", k.note));
      },
    }));
  });

  /* main charts */
  cv.appendChild(card(8, {
    icon: "chart", title: p.trend.title, sub: p.trend.subtitle, badge: p.trend.source,
    chip: { type: "trend", label: p.trend.title, data: { title: p.trend.title } },
    table: { kind: "trend", data: p.trend },
    body: b => registerChart(b, () => { if (b.dataset.mode !== "table") renderTrend(b, p.trend); }),
    foot: p.trend.insight,
  }));
  cv.appendChild(card(4, {
    icon: "donut", title: p.donut.title, sub: "share of total", badge: p.donut.source,
    chip: { type: "donut", label: p.donut.title, data: { title: p.donut.title } },
    table: { kind: "donut", data: p.donut },
    body: b => registerChart(b, () => { if (b.dataset.mode !== "table") renderDonut(b, p.donut); }),
    foot: p.donut.insight,
  }));
  cv.appendChild(card(4, {
    icon: "bars", title: p.bars.title, sub: p.bars.unit, badge: p.bars.source,
    chip: { type: "bars", label: p.bars.title, data: { title: p.bars.title } },
    table: { kind: "bars", data: p.bars },
    body: b => registerChart(b, () => { if (b.dataset.mode !== "table") renderBars(b, p.bars); }),
    foot: p.bars.insight,
  }));
  cv.appendChild(card(5, {
    icon: "heat", title: p.heatmap.title, sub: p.heatmap.unit, badge: p.heatmap.source,
    chip: { type: "heatmap", label: p.heatmap.title, data: { title: p.heatmap.title } },
    table: { kind: "heatmap", data: p.heatmap },
    body: b => registerChart(b, () => { if (b.dataset.mode !== "table") renderHeatmap(b, p.heatmap); }),
    foot: p.heatmap.insight,
  }));
  cv.appendChild(card(3, {
    icon: "goal", title: "Quarter goals", sub: "Q3 FY26",
    chip: { type: "goals", label: "Q3 goals", data: {} },
    body: b => renderGoals(b, p.goals),
  }));

  /* schedule */
  cv.appendChild(card(4, {
    icon: "cal", title: "Today", sub: "Friday, August 8", badge: srvFor(p, ["outlook", "gcal"]),
    body: b => {
      const ag = el("div", "agenda");
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      p.meetings.forEach(mt => {
        const it = el("div", "ag-item");
        const [hh, mm] = mt.time.split(":").map(Number);
        const start = hh * 60 + mm;
        if (start + 45 < nowMin) it.classList.add("past");
        else if (start <= nowMin) it.classList.add("now");
        it.appendChild(el("span", "ag-time", mt.time));
        it.appendChild(el("span", "ag-line"));
        const bd = el("div", "ag-body");
        bd.appendChild(el("div", "ag-title", mt.title));
        bd.appendChild(el("div", "ag-meta", mt.dur + " · " + platformName(mt.platform) + " · " + mt.attendees.slice(0, 2).join(", ") + (mt.attendees.length > 2 ? " +" + (mt.attendees.length - 2) : "")));
        it.appendChild(bd);
        const join = el("button", "ag-join", "prep");
        join.addEventListener("click", e => { e.stopPropagation(); attachChip({ type: "meeting", label: mt.time + " · " + mt.title, data: mt }); sendMessage("Prep me for this meeting"); });
        it.appendChild(join);
        makeDraggable(it, { type: "meeting", label: mt.time + " · " + mt.title, data: mt });
        ag.appendChild(it);
      });
      b.appendChild(ag);
    },
  }));

  /* inbox */
  cv.appendChild(card(4, {
    icon: "mail", title: "Needs your attention", sub: "across email, chat & tickets",
    body: b => {
      p.inbox.forEach(msg => {
        const it = el("div", "inb-item" + (msg.unread ? " unread" : ""));
        const bd = el("div", "inb-body");
        const top = el("div", "inb-top");
        const from = el("span", "inb-from");
        from.appendChild(srvGlyph(msg.source, 14));
        from.appendChild(document.createTextNode(" " + msg.from));
        top.appendChild(from);
        top.appendChild(el("span", "inb-time", msg.time));
        bd.appendChild(top);
        const subj = el("div", "inb-subj");
        subj.appendChild(document.createTextNode(msg.subject));
        if (msg.urgent) subj.appendChild(el("span", "inb-urgent", "URGENT"));
        bd.appendChild(subj);
        bd.appendChild(el("div", "inb-prev", msg.preview));
        it.appendChild(bd);
        it.addEventListener("dblclick", () => { attachChip({ type: "mail", label: msg.from + ": " + msg.subject, data: msg }); sendMessage("Summarize this and draft a reply"); });
        makeDraggable(it, { type: "mail", label: msg.from + ": " + msg.subject, data: msg });
        b.appendChild(it);
      });
    },
    foot: "double-click a thread to have Flow draft the reply",
  }));

  /* approvals */
  const apCard = card(4, {
    icon: "check", title: "Approvals", sub: FOW.pendingApprovals().length + " pending",
    body: b => {
      p.approvals.forEach(a => {
        const done = (state.approved[state.personaId] || new Set()).has(a.id);
        const it = el("div", "ap-item" + (done ? " done" : ""));
        it.dataset.approval = a.id;
        it.appendChild(el("span", "ap-urg " + a.urgency));
        const bd = el("div", "ap-body");
        bd.appendChild(el("div", "ap-title", a.type + " — " + a.title));
        bd.appendChild(el("div", "ap-meta", a.requester + " · " + a.meta));
        it.appendChild(bd);
        if (a.amount) it.appendChild(el("span", "ap-amount", a.amount));
        if (!done) {
          const acts = el("span", "ap-acts");
          const ok = el("button", "ap-ok"); ok.title = "Approve"; ok.appendChild(ico("check"));
          ok.addEventListener("click", e => { e.stopPropagation(); FOW.approve(a.id, true); toast("Approved — " + a.requester + " notified", "ok"); });
          const no = el("button", "ap-no"); no.title = "Ask Flow first"; no.appendChild(ico("x"));
          no.addEventListener("click", e => { e.stopPropagation(); attachChip({ type: "approval", label: a.type + ": " + a.title, data: a }); sendMessage("Should I approve this?"); });
          acts.append(ok, no);
          it.appendChild(acts);
        }
        makeDraggable(it, { type: "approval", label: a.type + ": " + a.title, data: a });
        b.appendChild(it);
      });
    },
    foot: "✕ sends it to Flow for a recommendation first",
  });
  /* autopilot: Flow clears low-risk approvals on its own */
  const auto = el("button", "autopilot" + (state.autopilot[state.personaId] ? " on" : ""));
  auto.title = "When on, Flow auto-clears low-risk approvals within policy";
  auto.append(el("span", "", "Autopilot"), el("span", "sw"));
  auto.addEventListener("click", () => {
    const on = !state.autopilot[state.personaId];
    state.autopilot[state.personaId] = on;
    auto.classList.toggle("on", on);
    if (!on) { toast("Autopilot off — everything waits for you again", "info"); return; }
    const low = FOW.pendingApprovals().filter(a => a.urgency === "low");
    if (!low.length) { toast("Autopilot on — nothing low-risk in the queue right now", "info"); return; }
    low.forEach((a, i) => setTimeout(() => {
      FOW.approve(a.id, i === low.length - 1);
      if (i === low.length - 1) toast("Autopilot cleared " + low.length + " low-risk approval" + (low.length > 1 ? "s" : "") + " — requesters notified");
    }, 700 + i * 450));
    agentReply({
      thinkMs: 400,
      text: "**Autopilot is on.** I'll clear approvals that are within policy, from requesters with clean history, under your delegation limit — and leave anything unusual for you. Starting with **" + low.length + " low-risk item" + (low.length > 1 ? "s" : "") + "** in the queue now.",
    });
  });
  const apHead = $(".card-h", apCard);
  apHead.insertBefore(auto, $(".ch-acts", apHead));
  cv.appendChild(apCard);

  /* delegations — hand work to Flow, watch it run */
  if (p.delegations && p.delegations.length) {
    cv.appendChild(card(6, {
      icon: "robot", title: "Delegated to Flow", sub: "agent work queue · runs in the background",
      body: b => {
        p.delegations.forEach(d => {
          const doneAlready = (state.delegated[state.personaId] || {})[d.id];
          const it = el("div", "dg-item");
          const orb = el("span", "orb mini dg-orb"); orb.appendChild(el("i"));
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
            const btn = el("button", "dg-btn", "▶ Delegate");
            btn.addEventListener("click", () => runDelegation(d, { orb, sub, prog, fill, stateBox, btn, bd }));
            stateBox.appendChild(btn);
          }
          it.appendChild(stateBox);
          b.appendChild(it);
        });
      },
      foot: "Flow works these while you do something better with your time",
    }));
  }

  /* week in numbers */
  if (p.week) {
    const wk = p.week;
    cv.appendChild(card(6, {
      icon: "clockIco", title: "Your week in numbers", sub: "meetings vs focus · w/e Aug 8", badge: srvFor(p, ["outlook", "gcal"]),
      chip: { type: "week", label: "My week in numbers", data: wk },
      body: b => {
        const grid = el("div", "wk-stats");
        [["Meeting hours", wk.meetingHours + "h"], ["Focus hours", wk.focusHours + "h"], ["Meeting cost", wk.meetingCost], ["Deep-work blocks", String(wk.deepBlocks)]].forEach(([l, v]) => {
          const t = el("div", "wk");
          t.appendChild(el("div", "l", l));
          t.appendChild(el("div", "v", v));
          grid.appendChild(t);
        });
        b.appendChild(grid);
        const ch = el("div");
        b.appendChild(ch);
        registerChart(ch, () => renderBars(ch, {
          title: "Meetings vs focus", unit: "h", categories: wk.days,
          series: [{ name: "Meetings", values: wk.meetings }, { name: "Focus", values: wk.focus }],
        }, { mini: true, h: 132 }));
      },
      foot: wk.insight,
    }));
  }

  /* tasks */
  cv.appendChild(card(6, {
    icon: "task", title: "My open items", sub: "sprint & queue", badge: (p.tasks[0] || {}).source,
    body: b => {
      p.tasks.forEach(t => {
        const it = el("div", "task-item");
        it.appendChild(el("span", "task-key", t.id));
        it.appendChild(el("span", "task-title", t.title));
        it.appendChild(el("span", "task-status " + t.status, t.status === "inprogress" ? "in progress" : t.status));
        it.appendChild(el("span", "task-due", t.due));
        makeDraggable(it, { type: "task", label: t.id + " " + t.title, data: t });
        b.appendChild(it);
      });
    },
  }));

  /* skills + automations + connections */
  cv.appendChild(card(6, {
    icon: "spark", title: "Agent skills", sub: "what Flow can run for you",
    body: b => {
      p.skills.forEach(s => {
        const it = el("div", "rail-item");
        it.appendChild(el("span", "sk-ico", s.icon));
        const bd = el("div", "rail-body");
        bd.appendChild(el("div", "rail-name", s.name));
        bd.appendChild(el("div", "rail-desc", s.desc));
        it.appendChild(bd);
        const side = el("div", "rail-side");
        side.appendChild(el("div", "", s.runs + " runs"));
        side.appendChild(el("div", "", s.lastRun));
        it.appendChild(side);
        makeDraggable(it, { type: "skill", label: "Skill: " + s.name, data: s });
        it.addEventListener("dblclick", () => { attachChip({ type: "skill", label: "Skill: " + s.name, data: s }); sendMessage("Run this skill"); });
        b.appendChild(it);
      });
    },
  }));
  cv.appendChild(card(6, {
    icon: "bolt", title: "Automations", sub: "running on schedule",
    body: b => {
      p.automations.forEach(a => {
        const it = el("div", "rail-item");
        const icoBox = el("span", "sk-ico"); icoBox.appendChild(ico("bolt")); icoBox.style.color = "var(--acc)";
        it.appendChild(icoBox);
        const bd = el("div", "rail-body");
        bd.appendChild(el("div", "rail-name", a.name));
        bd.appendChild(el("div", "rail-desc", a.desc));
        it.appendChild(bd);
        const side = el("div", "rail-side");
        side.appendChild(el("div", "on", "● " + a.schedule));
        side.appendChild(el("div", "", a.lastResult.split("·")[0].trim()));
        it.appendChild(side);
        makeDraggable(it, { type: "automation", label: "Automation: " + a.name, data: a });
        b.appendChild(it);
      });
    },
  }));
  cv.appendChild(card(6, {
    icon: "plug", title: "Connected via MCP", sub: (p.connections || []).length + " servers · demo",
    body: b => {
      (p.connections || []).forEach((cid, i) => {
        const s = SERVERS[cid]; if (!s) return;
        const it = el("div", "rail-item");
        it.appendChild(srvGlyph(cid));
        const bd = el("div", "rail-body");
        bd.appendChild(el("div", "rail-name", s.name));
        bd.appendChild(el("div", "rail-desc", s.tools.slice(0, 3).join(" · ")));
        it.appendChild(bd);
        const st = el("span", "cn-status");
        st.appendChild(el("span", "cn-dot" + (i === 2 ? " sync" : "")));
        st.appendChild(el("span", "", i === 2 ? "syncing" : "connected"));
        it.appendChild(st);
        makeDraggable(it, { type: "server", label: s.name + " (MCP)", data: { id: cid } });
        b.appendChild(it);
      });
    },
    foot: "drag a server into chat to see its tools",
  }));

  updateBadges();
}
function srvFor(p, wanted) { return (p.connections || []).find(c => wanted.includes(c)) || wanted[0]; }

/* ---------------- delegation runner ---------------- */
const wait = ms => new Promise(r => setTimeout(r, ms));
async function runDelegation(d, ui) {
  const set = state.delegated[state.personaId] || (state.delegated[state.personaId] = {});
  ui.btn.remove();
  const pill = el("span", "dg-pill queued", "queued");
  ui.stateBox.appendChild(pill);
  ui.orb.classList.add("think");
  await wait(550);
  pill.className = "dg-pill working"; pill.textContent = "working";
  ui.prog.hidden = false;
  for (let i = 0; i < d.steps.length; i++) {
    const s = d.steps[i];
    ui.sub.textContent = "";
    const stepSpan = el("span", "step",
      (SERVERS[s.server] ? SERVERS[s.server].name.toLowerCase().replace(/[^a-z0-9]+/g, "_") : s.server) + "." + s.tool + "(" + (s.args || "") + ")");
    ui.sub.appendChild(stepSpan);
    await wait(Math.min(s.ms || 800, 1600) * 0.8);
    ui.fill.style.width = Math.round(((i + 1) / d.steps.length) * 100) + "%";
    ui.sub.textContent = s.result;
    await wait(260);
  }
  pill.className = "dg-pill done"; pill.textContent = "done";
  ui.orb.classList.remove("think");
  ui.prog.hidden = true;
  ui.sub.textContent = d.result;
  if (d.artifact) {
    const a = el("span", "dg-artifact");
    a.appendChild(ico("file")); a.appendChild(el("span", "", d.artifact));
    ui.bd.appendChild(a);
  }
  set[d.id] = "done";
  toast("Flow finished: " + d.label);
  agentReply({
    thinkMs: 250,
    text: "**" + d.label + "** — done. " + d.result + (d.artifact ? "\n> Saved as **" + d.artifact + "**" : ""),
    actions: [{
      label: "Show me the steps",
      run: btn => {
        btn.classList.add("done"); btn.textContent = "✓ Shown";
        agentReply({ thinkMs: 300, tools: d.steps, text: "That's the full trail — every call is logged to your workspace audit log." });
      },
    }],
  });
}

/* ---------------- theme ---------------- */
function applyTheme(dark) {
  THEME.dark = dark;
  if (dark) document.body.dataset.theme = "dark"; else delete document.body.dataset.theme;
  const t = $("#themeIco");
  t.textContent = "";
  t.appendChild(ico(dark ? "sun" : "moon"));
  rerenderCharts();
}
function platformName(x) { return { teams: "Teams", zoom: "Zoom", meet: "Meet" }[x] || x; }
function updateBadges() {
  const p = FOW.data(); if (!p) return;
  const n = FOW.pendingApprovals().length + p.inbox.filter(i => i.urgent).length;
  const badge = $("#bellBadge");
  badge.hidden = n === 0;
  badge.textContent = n;
  const apCard = $$(".card").find(c => { const t = $(".ch-title .t", c); return t && t.textContent === "Approvals"; });
  if (apCard) $(".ch-title .s", apCard).textContent = FOW.pendingApprovals().length + " pending";
}

/* ---------------- persona switching ---------------- */
function selectPersona(id, first) {
  state.personaId = id;
  const meta = PERSONAS.find(x => x.id === id);
  document.body.dataset.persona = id;
  $("#ppAvatar").textContent = meta.initials;
  $("#ppName").textContent = meta.name;
  $("#ppRole").textContent = meta.role + " · " + meta.dept;
  $("#tbAvatar").textContent = meta.initials;
  $("#cdStatus").textContent = "online · " + ((FOW.data() || {}).connections || []).length + " tools connected · " + (((FOW.data() || {}).skills) || []).length + " skills";
  renderCanvas();
  renderTicker();
  renderDrawer();
  chatWelcome();
  $("#canvas").scrollTop = 0;
  if (!first) toast("Workspace re-shaped for " + meta.name + " — " + meta.dept, "info");
}

/* ---------------- onboarding ---------------- */
function renderOnboarding() {
  const grid = $("#obGrid");
  PERSONAS.forEach((p, i) => {
    const b = el("button", "ob-card");
    b.style.setProperty("--i", i);
    b.style.setProperty("--pa", p.accent);
    const ava = el("span", "ob-ava", p.initials);
    b.appendChild(ava);
    b.appendChild(el("div", "ob-name", p.name));
    b.appendChild(el("div", "ob-role", p.role + " · " + p.dept));
    b.appendChild(el("div", "ob-tag", p.tag));
    b.appendChild(el("span", "ob-enter", "enter ↵"));
    b.addEventListener("click", () => {
      $("#onboard").classList.add("gone");
      setTimeout(() => { $("#onboard").style.display = "none"; }, 520);
      selectPersona(p.id, true);
    });
    grid.appendChild(b);
  });
}
function renderPersonaMenu() {
  const menu = $("#personaMenu");
  menu.textContent = "";
  PERSONAS.forEach(p => {
    const it = el("button", "pm-item" + (p.id === state.personaId ? " cur" : ""));
    const ava = el("span", "ob-ava", p.initials);
    ava.style.setProperty("--pa", p.accent);
    it.appendChild(ava);
    const bd = el("div");
    bd.appendChild(el("div", "pm-name", p.name));
    bd.appendChild(el("div", "pm-role", p.role + " · " + p.dept));
    it.appendChild(bd);
    it.addEventListener("click", () => { menu.hidden = true; if (p.id !== state.personaId) selectPersona(p.id); });
    menu.appendChild(it);
  });
}

/* ---------------- drawer (tools & skills) ---------------- */
function renderDrawer() {
  const d = $("#cdDrawer");
  const p = FOW.data(); if (!p) return;
  d.textContent = "";
  d.appendChild(el("div", "dw-sect", "MCP servers"));
  (p.connections || []).forEach(cid => {
    const s = SERVERS[cid]; if (!s) return;
    const it = el("div", "dw-item");
    it.appendChild(srvGlyph(cid, 20));
    it.appendChild(el("span", "", s.name));
    it.appendChild(el("span", "dw-tools", s.tools.length + " tools"));
    makeDraggable(it, { type: "server", label: s.name + " (MCP)", data: { id: cid } });
    d.appendChild(it);
  });
  d.appendChild(el("div", "dw-sect", "Skills"));
  (p.skills || []).forEach(s => {
    const it = el("div", "dw-item");
    it.appendChild(el("span", "", s.icon));
    it.appendChild(el("span", "", s.name));
    it.appendChild(el("span", "dw-tools", s.runs + " runs"));
    makeDraggable(it, { type: "skill", label: "Skill: " + s.name, data: s });
    d.appendChild(it);
  });
}

/* ---------------- ticker + clock ---------------- */
function renderTicker() {
  const p = FOW.data(); if (!p) return;
  const tape = $("#tkTape");
  tape.textContent = "";
  const items = (p.activity || []).concat(p.activity || []); /* doubled for seamless loop */
  items.forEach(a => {
    const parts = String(a).split("·");
    const it = el("span", "tk-item");
    it.appendChild(el("b", "", parts[0].trim() + (parts.length > 1 ? " · " : "")));
    if (parts.length > 1) it.appendChild(document.createTextNode(parts.slice(1).join("·").trim()));
    tape.appendChild(it);
  });
}
function startClock() {
  const set = () => {
    const d = new Date();
    $("#tkClock").textContent = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    $("#tbDate").textContent = "Friday, August 8, 2026 · Q3 FY26 · week 32";
  };
  set(); setInterval(set, 1000);
}

/* ---------------- command palette ---------------- */
const ckState = { open: false, sel: 0, items: [] };
function ckBuild(query) {
  const q = (query || "").toLowerCase();
  const p = FOW.data();
  const items = [];
  if (p) (p.suggestions || []).forEach(s => items.push({ sect: "Ask Flow", label: s, icon: "✦", sub: "chat", run: () => sendMessage(s) }));
  PERSONAS.forEach(pp => { if (pp.id !== state.personaId) items.push({ sect: "Switch persona", label: pp.name + " — " + pp.role, icon: pp.initials, sub: pp.dept, run: () => selectPersona(pp.id) }); });
  if (p) {
    [["trend", p.trend.title], ["donut", p.donut.title], ["bars", p.bars.title], ["heatmap", p.heatmap.title]].forEach(([k, t]) =>
      items.push({ sect: "Jump to", label: t, icon: "▦", sub: "widget", run: () => flashCard(t) }));
    (p.connections || []).forEach(cid => { const s = SERVERS[cid]; if (s) items.push({ sect: "MCP servers", label: s.name, icon: s.glyph, sub: s.tools.length + " tools", run: () => { attachChip({ type: "server", label: s.name + " (MCP)", data: { id: cid } }); sendMessage("What can you do with this?"); } }); });
  }
  let filtered = q ? items.filter(i => i.label.toLowerCase().includes(q) || i.sect.toLowerCase().includes(q)) : items;
  /* federated search across the (simulated) connected tools */
  if (q && q.length > 1 && p) {
    const hits = [];
    p.inbox.filter(m => (m.from + " " + m.subject).toLowerCase().includes(q)).slice(0, 3).forEach(m =>
      hits.push({ sect: "Emails & messages", label: m.from + " — " + m.subject, icon: "✉", sub: SERVERS[m.source] ? SERVERS[m.source].name : m.source, run: () => { attachChip({ type: "mail", label: m.from + ": " + m.subject, data: m }); sendMessage("Summarize this and draft a reply"); } }));
    p.tasks.filter(t => (t.id + " " + t.title).toLowerCase().includes(q)).slice(0, 3).forEach(t =>
      hits.push({ sect: "Tasks & tickets", label: t.id + " · " + t.title, icon: "☑", sub: t.status, run: () => { attachChip({ type: "task", label: t.id + " " + t.title, data: t }); sendMessage("What's the status here?"); } }));
    p.meetings.filter(m => m.title.toLowerCase().includes(q)).slice(0, 2).forEach(m =>
      hits.push({ sect: "Meetings", label: m.time + " · " + m.title, icon: "▦", sub: m.dur, run: () => { attachChip({ type: "meeting", label: m.time + " · " + m.title, data: m }); sendMessage("Prep me for this meeting"); } }));
    (p.files || []).filter(f => (f.name + " " + f.by).toLowerCase().includes(q)).slice(0, 3).forEach(f =>
      hits.push({ sect: "Files", label: f.name, icon: "▤", sub: f.by + " · " + f.modified, run: () => { attachChip({ type: "file", label: f.name, data: f }); sendMessage("Summarize this document for me"); } }));
    filtered = filtered.concat(hits);
  }
  if (q && !filtered.some(i => i.sect === "Ask Flow")) filtered.unshift({ sect: "Ask Flow", label: "Ask: “" + query + "”", icon: "✦", sub: "send to chat", run: () => sendMessage(query) });
  return filtered.slice(0, 16);
}
function ckRender() {
  const list = $("#ckList");
  list.textContent = "";
  let lastSect = null;
  ckState.items.forEach((it, i) => {
    if (it.sect !== lastSect) { list.appendChild(el("div", "ck-sect", it.sect)); lastSect = it.sect; }
    const b = el("button", "ck-item" + (i === ckState.sel ? " sel" : ""));
    b.appendChild(el("span", "ck-ico", it.icon));
    b.appendChild(el("span", "ck-lab", it.label));
    b.appendChild(el("span", "ck-sub", it.sub));
    b.addEventListener("click", () => { ckClose(); it.run(); });
    list.appendChild(b);
  });
}
function ckOpen() {
  ckState.open = true; ckState.sel = 0;
  $("#cmdk").hidden = false;
  const inp = $("#ckInput");
  inp.value = ""; inp.focus();
  ckState.items = ckBuild("");
  ckRender();
}
function ckClose() { ckState.open = false; $("#cmdk").hidden = true; }
function flashCard(title) {
  const target = $$(".card").find(c => { const t = $(".ch-title .t", c); return t && t.textContent === title; });
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.style.boxShadow = "0 0 0 2px var(--acc), 0 0 44px -10px var(--acc)";
  setTimeout(() => { target.style.boxShadow = ""; }, 1600);
}

/* ---------------- wiring ---------------- */
function init() {
  renderOnboarding();
  wireDropzone();
  startClock();
  applyTheme(false);
  $("#themeBtn").addEventListener("click", () => {
    applyTheme(!THEME.dark);
    toast(THEME.dark ? "Dark mode — for the late shift" : "Light mode — bright and crisp", "info");
  });

  $("#personaPill").addEventListener("click", e => {
    e.stopPropagation();
    const m = $("#personaMenu");
    if (m.hidden) { renderPersonaMenu(); m.hidden = false; } else m.hidden = true;
  });
  document.addEventListener("click", e => {
    const m = $("#personaMenu");
    if (!m.hidden && !m.contains(e.target)) m.hidden = true;
  });

  const input = $("#cdInput");
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(120, input.scrollHeight) + "px";
  });
  $("#cdSend").addEventListener("click", () => sendMessage());
  $("#cdToolsBtn").addEventListener("click", () => { $("#cdDrawer").hidden = !$("#cdDrawer").hidden; });
  $("#cdCollapse").addEventListener("click", () => { $("#frame").classList.add("chat-hidden"); $("#chatFab").hidden = false; });
  $("#chatFab").addEventListener("click", () => { $("#frame").classList.remove("chat-hidden"); $("#chatFab").hidden = true; });
  $("#bellBtn").addEventListener("click", () => sendMessage("What needs my attention right now?"));
  $("#brandBtn").addEventListener("click", () => { $("#canvas").scrollTop = 0; });

  $("#cmdkBtn").addEventListener("click", ckOpen);
  $(".ck-back").addEventListener("click", ckClose);
  $("#ckInput").addEventListener("input", e => { ckState.sel = 0; ckState.items = ckBuild(e.target.value); ckRender(); });
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); ckState.open ? ckClose() : ckOpen(); return; }
    if (!ckState.open) return;
    if (e.key === "Escape") ckClose();
    else if (e.key === "ArrowDown") { e.preventDefault(); ckState.sel = Math.min(ckState.items.length - 1, ckState.sel + 1); ckRender(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); ckState.sel = Math.max(0, ckState.sel - 1); ckRender(); }
    else if (e.key === "Enter") { e.preventDefault(); const it = ckState.items[ckState.sel]; if (it) { ckClose(); it.run(); } }
  });

  $("#cdDrawer").hidden = true;
}
document.addEventListener("DOMContentLoaded", init);
