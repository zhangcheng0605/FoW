/* ============================================================
   FoW · studio-sales — THE FLOOR
   Jonas Lindqvist, Enterprise Sales · a trading-floor scoreboard.
   Hero: the pipeline river — five flush lanes, deal tickets,
   the OPP-4821 spotlight board and the quota thermometer.
   Chapters: 01 The truth · 02 Momentum · 03 Commit · 04 The week
   ============================================================ */

function renderStudio_sales(p, cv) {
  clearCharts();
  clearInterval(STUDIO.timer);
  cv.textContent = "";

  let secI = 0;
  const sect = cls => { const s = el("section", "st-sec " + (cls || "")); s.style.setProperty("--i", secI++); cv.appendChild(s); return s; };
  const hourNow = new Date().getHours();
  const greet = hourNow < 12 ? "Good morning" : hourNow < 18 ? "Good afternoon" : "Good evening";
  const taskById = id => (p.tasks || []).find(t => t.id === id);
  const SIGN_BY = new Date(2026, 7, 21, 17, 0, 0); /* OPP-4821 · sign by Aug 21 */
  const daysLeft = Math.max(0, Math.ceil((SIGN_BY - Date.now()) / 864e5));

  /* =============== HERO — the masthead =============== */
  const hero = sect("flr-hero");
  const mast = el("div", "flr-mast");
  const kick = el("div", "flr-kicker");
  kick.appendChild(el("span", "flr-live"));
  kick.appendChild(el("span", "", "THE FLOOR — EMEA DESK · Q3 FY26 · WEEK 32"));
  mast.appendChild(kick);
  mast.appendChild(el("div", "flr-greet", greet + ", " + p.user.name.split(" ")[0] + " — Friday, August 8 · " + p.user.location));
  const title = el("h2", "flr-title");
  title.appendChild(el("span", "", "Nine deals. "));
  title.appendChild(el("b", "", "$3.4M."));
  title.appendChild(el("span", "", " One signature."));
  mast.appendChild(title);
  mast.appendChild(el("div", "flr-lede", p.focus.headline));
  mast.appendChild(el("div", "flr-sub", p.focus.sub));
  const acts = el("div", "flr-acts");
  const runBtn = el("button", "lb-enter", "▶ Close the Caldera loop");
  runBtn.addEventListener("click", () => { if (p.chains && p.chains[0]) { addUserMsg("Run cross-app workflow: " + p.chains[0].name); runChain(p.chains[0]); } });
  const recapBtn = el("button", "hstat primary flr-recap", "✦ Draft my end-of-week recap");
  recapBtn.addEventListener("click", () => sendMessage("Draft my end-of-week recap"));
  const askBtn = el("button", "lb-play", "Brief me for the 10:00");
  askBtn.addEventListener("click", () => sendMessage("Brief me for the 10:00 Nordvik redline call"));
  acts.append(runBtn, recapBtn, askBtn);
  mast.appendChild(acts);
  hero.appendChild(mast);

  /* ---- the board floating above the river: spotlight + thermometer ---- */
  const board = el("div", "flr-board");

  const spot = el("div", "flr-spot");
  const stag = el("div", "flr-spot-tag");
  stag.appendChild(el("span", "flr-live"));
  stag.appendChild(el("span", "", "SPOTLIGHT · OPP-4821 · CONTRACTING"));
  spot.appendChild(stag);
  const srow = el("div", "flr-spot-row");
  const sname = el("div", "flr-spot-name");
  sname.appendChild(el("b", "", "Nordvik Energy"));
  sname.appendChild(el("span", "", "multi-year MSA · close Aug 21"));
  srow.appendChild(sname);
  const samt = el("div", "flr-spot-amt");
  countUp(samt, "$1.2M");
  srow.appendChild(samt);
  spot.appendChild(srow);
  spot.appendChild(el("div", "flr-spot-note", "in Legal on the liability cap — round-2 redlines landed 07:58"));
  const cdBox = el("div", "flr-cd-box");
  cdBox.appendChild(el("div", "flr-cd-l", "SIGN BY THU AUG 21 —"));
  const cdWrap = el("div", "flr-cd");
  const segs = {};
  [["dd", "DAYS"], ["hh", "HRS"], ["mm", "MIN"], ["ss", "SEC"]].forEach(([k, lab], i) => {
    if (i) cdWrap.appendChild(el("span", "flr-cd-c", ":"));
    const sg = el("span", "flr-cd-seg" + (k === "ss" ? " sec" : ""));
    segs[k] = el("b", "", "––");
    sg.appendChild(segs[k]);
    sg.appendChild(el("span", "", lab));
    cdWrap.appendChild(sg);
  });
  cdBox.appendChild(cdWrap);
  spot.appendChild(cdBox);
  const own = el("div", "flr-own");
  const oc1 = el("span", "flr-owner");
  oc1.appendChild(el("b", "", "JL"));
  oc1.appendChild(el("span", "", "Jonas Lindqvist · owner"));
  const oc2 = el("span", "flr-owner dim");
  oc2.appendChild(el("b", "", "AD"));
  oc2.appendChild(el("span", "", "Amara Diallo · redlines"));
  const go = el("button", "flr-spot-go", "Brief me →");
  go.addEventListener("click", e => { e.stopPropagation(); sendMessage("Brief me for the 10:00 Nordvik redline call"); });
  own.append(oc1, oc2, go);
  spot.appendChild(own);
  makeDraggable(spot, { type: "task", label: "OPP-4821 · Nordvik Energy $1.2M — sign by Aug 21", data: taskById("OPP-4821") || { id: "OPP-4821" } });
  board.appendChild(spot);

  const th = el("div", "flr-thermo");
  const thh = el("div", "flr-th-head");
  thh.appendChild(el("span", "flr-th-l", "Q3 QUOTA — TEAM"));
  const thv = el("b", "flr-th-v");
  countUp(thv, "48.2%");
  thh.appendChild(thv);
  th.appendChild(thh);
  const track = el("div", "flr-th-track");
  const fill = el("i", "flr-th-fill");
  const ghost = el("i", "flr-th-ghost");
  ghost.title = "OPP-4821 alone lifts Q3 to 66%";
  const mark = el("i", "flr-th-mark");
  track.append(fill, ghost, mark);
  th.appendChild(track);
  requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = "48.2%"; ghost.style.width = "17.8%"; }));
  const thf = el("div", "flr-th-foot");
  thf.appendChild(el("span", "", "$3.28M closed"));
  thf.appendChild(el("span", "flr-th-nord", "+ Nordvik → 66%"));
  thf.appendChild(el("span", "", "$6.8M quota"));
  th.appendChild(thf);
  th.appendChild(el("div", "flr-th-note", "9 deals land in August · $3.4M commit — hold it and Q3 closes at 98% before September opens"));
  makeDraggable(th, { type: "kpi", label: "Q3 quota attainment · 48.2%", data: p.kpis[0] });
  board.appendChild(th);
  hero.appendChild(board);

  /* ---- the pipeline river — five flush lanes, widths ∝ value ---- */
  const cap = el("div", "flr-river-cap");
  cap.appendChild(el("span", "flr-cap-l", "THE PIPELINE RIVER"));
  cap.appendChild(el("span", "flr-cap-r", "$18.6M OPEN · FLOWS →"));
  hero.appendChild(cap);

  const river = el("div", "flr-river");
  const LANE_CHIPS = {
    "Discovery": [
      { id: "BLITZ · AUG 18", amt: "+$1.4M", name: "new-pipe target", cls: "new", chip: { type: "kpi", label: "Pipeline coverage 3.1x — $1.4M new pipe needed by Sep 1", data: p.kpis[1] } },
    ],
    "Evaluation": [
      { id: "OPP-4712", amt: "$840K", name: "Aventra Health", cls: "warn", task: "OPP-4712" },
    ],
    "Proposal": [
      { id: "OPP-4956", amt: "$460K", name: "Kessler Automotive", cls: "", task: "OPP-4956" },
      { id: "OPP-4765", amt: "$180K", name: "Helios Mfg", cls: "warn" },
    ],
    "Negotiation": [
      { id: "OPP-4903", amt: "$520K", name: "Trellis Financial", cls: "risk", appr: "a1" },
      { id: "OPP-4880", amt: "$310K", name: "Bluewater Logistics", cls: "warn", task: "OPP-4880" },
    ],
    "Contracting": [
      { id: "OPP-4821", amt: "$1.2M", name: "Nordvik Energy", cls: "hot", task: "OPP-4821" },
      { id: "OPP-4738", amt: "$290K", name: "Caldera · signed 07:12", cls: "done" },
    ],
  };
  const totalPipe = p.donut.segments.reduce((a, s) => a + s.value, 0);
  p.donut.segments.forEach(sg => {
    const lane = el("div", "flr-lane");
    lane.style.flexGrow = String(Math.round(sg.value * 100));
    const lh = el("div", "flr-lane-h");
    lh.appendChild(el("span", "flr-lane-stage", sg.label));
    lh.appendChild(el("span", "flr-lane-share", Math.round((sg.value / totalPipe) * 100) + "%"));
    lane.appendChild(lh);
    const v = el("div", "flr-lane-amt");
    countUp(v, "$" + sg.value.toFixed(1) + "M");
    lane.appendChild(v);
    lane.appendChild(el("i", "flr-lane-flow"));
    const chips = el("div", "flr-chips");
    (LANE_CHIPS[sg.label] || []).forEach(c => {
      const pill = el("div", "flr-chip" + (c.cls ? " " + c.cls : ""));
      pill.appendChild(el("b", "", c.id));
      pill.appendChild(el("span", "", c.amt + " · " + c.name));
      const t = c.task && taskById(c.task);
      const a = c.appr && (p.approvals || []).find(x => x.id === c.appr);
      const chip = c.chip
        || (t ? { type: "task", label: t.id + " " + t.title, data: t }
          : a ? { type: "approval", label: a.type + ": " + a.title, data: a }
            : { type: "task", label: c.id + " · " + c.amt + " " + c.name, data: { id: c.id } });
      makeDraggable(pill, chip);
      pill.title = c.id + " · " + c.amt + " — " + c.name;
      pill.addEventListener("click", () => { attachChip(chip); sendMessage("What's the status here?"); });
      chips.appendChild(pill);
    });
    lane.appendChild(chips);
    river.appendChild(lane);
  });
  hero.appendChild(river);

  /* =============== the naked stat strip =============== */
  const strip = sect("st-strip flr-strip");
  p.kpis.forEach(k => {
    const s = el("article", "card kpi st-stat");
    const lb = el("div", "kpi-label");
    lb.appendChild(srvGlyph(k.source, 15));
    lb.appendChild(el("span", "", k.label));
    s.appendChild(lb);
    const row = el("div", "kpi-row");
    const val = el("span", "kpi-value");
    countUp(val, k.value);
    row.appendChild(val);
    row.appendChild(el("span", "kpi-delta " + (k.deltaGood ? "good" : "bad"), (k.deltaDir === "up" ? "▲ " : "▼ ") + k.delta));
    s.appendChild(row);
    const sp = el("div", "kpi-spark");
    s.appendChild(sp);
    registerChart(sp, () => renderSpark(sp, k.spark));
    makeDraggable(s, { type: "kpi", label: k.label + " · " + k.value, data: k });
    strip.appendChild(s);
  });

  /* =============== 01 · The truth =============== */
  if (p.joined) {
    const s1 = sect("joined-card flr-truth");
    stHead(s1, "01", "The truth", p.joined.subtitle);
    const body = el("div", "joined-body");
    const ch = el("div", "joined-chart");
    const aside = el("aside", "joined-aside");
    aside.appendChild(buildInsight(p.joined.insight));
    body.append(ch, aside);
    s1.appendChild(body);
    registerChart(ch, () => renderJoined(ch, p.joined));
  }

  /* =============== 02 · Momentum =============== */
  const s2 = sect("flr-mo");
  stHead(s2, "02", "Momentum", "keep the floor moving — one-click plays, and runners working the phones for you");
  const grid2 = el("div", "flr-2col");
  const chnCol = el("div", "chn-card flr-col");
  chnCol.appendChild(el("div", "flr-colhead", "Plays — cross-app workflows"));
  (p.chains || []).forEach(c => {
    const it = el("div", "chn-item flr-play");
    const top = el("div", "chn-top");
    const bd = el("div"); bd.style.cssText = "flex:1;min-width:0";
    bd.appendChild(el("div", "chn-name", c.name));
    bd.appendChild(el("div", "chn-desc", c.desc));
    top.appendChild(bd);
    const run = el("button", "dg-btn", "▶ Run");
    run.addEventListener("click", () => { addUserMsg("Run cross-app workflow: " + c.name); runChain(c); });
    top.appendChild(run);
    it.appendChild(top);
    const path = el("div", "chn-path");
    c.steps.forEach((st, i) => { if (i) path.appendChild(el("span", "hop", "➜")); path.appendChild(srvGlyph(st.server, 20)); });
    it.appendChild(path);
    makeDraggable(it, { type: "chain", label: "Workflow: " + c.name, data: c });
    chnCol.appendChild(it);
  });
  grid2.appendChild(chnCol);
  const dgCol = el("div", "dg-card flr-col");
  dgCol.appendChild(el("div", "flr-colhead", "Runners — delegated to askMElah"));
  (p.delegations || []).forEach(d => {
    const doneAlready = (state.delegated[state.personaId] || {})[d.id];
    const it = el("div", "dg-item flr-run");
    const orb = askmeAv(26); orb.classList.add("dg-orb");
    it.appendChild(orb);
    const bd = el("div", "dg-body");
    bd.appendChild(el("div", "dg-label", d.label));
    const sub = el("div", "dg-sub", doneAlready ? d.result : d.detail);
    bd.appendChild(sub);
    const prog = el("div", "dg-prog"); prog.hidden = true;
    const fillEl = el("i"); prog.appendChild(fillEl);
    bd.appendChild(prog);
    it.appendChild(bd);
    const stateBox = el("span", "dg-state");
    if (doneAlready) stateBox.appendChild(el("span", "dg-pill done", "done"));
    else {
      const btn = el("button", "dg-btn", "▶ Delegate");
      btn.addEventListener("click", () => runDelegation(d, { orb, sub, prog, fill: fillEl, stateBox, btn, bd }));
      stateBox.appendChild(btn);
    }
    it.appendChild(stateBox);
    dgCol.appendChild(it);
  });
  grid2.appendChild(dgCol);
  s2.appendChild(grid2);

  /* =============== 03 · Commit — the deal desk =============== */
  const s3 = sect("ap-card flr-commit");
  const h3 = stHead(s3, "03", "Commit", "the deal desk — askMElah pre-reads every line; clear it, or send it back with questions");
  const auto = el("button", "autopilot" + (state.autopilot[state.personaId] ? " on" : ""));
  auto.title = "When on, askMElah auto-clears low-risk approvals within policy";
  auto.append(el("span", "", "Autopilot"), el("span", "sw"));
  h3.appendChild(auto);

  const desk = el("div", "flr-desk");
  const stakes = { a2: ["$1.2M", "deal at stake"], a3: ["5 days", "Aug 24–28"] };
  const money = s => parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;
  const deskCnt = el("span", "flr-desk-cnt");
  const deskTot = el("b", "flr-desk-amt");
  function refreshDesk() {
    const pend = FOW.pendingApprovals();
    const sum = pend.reduce((a, x) => a + money(x.amount), 0);
    deskTot.textContent = "$" + sum.toLocaleString("en-US");
    deskCnt.textContent = pend.length ? pend.length + " line" + (pend.length > 1 ? "s" : "") + " open" : "desk clear ✦";
  }
  function stampRow(cell) { cell.textContent = ""; cell.appendChild(el("span", "flr-stamp", "CLEARED")); }

  p.approvals.forEach(a => {
    const done = (state.approved[state.personaId] || new Set()).has(a.id);
    const row = el("div", "flr-row" + (done ? " done" : ""));
    row.dataset.approval = a.id;
    const amtCell = el("div", "flr-amt-c");
    const [amt, amtSub] = a.amount ? [a.amount, a.type.toLowerCase()] : (stakes[a.id] || ["—", a.type.toLowerCase()]);
    amtCell.appendChild(el("b", "flr-amt", amt));
    amtCell.appendChild(el("span", "flr-amt-s", amtSub));
    row.appendChild(amtCell);
    row.appendChild(el("span", "flr-urg " + a.urgency));
    const bd = el("div", "flr-row-bd");
    const t1 = el("div", "flr-row-t");
    t1.appendChild(el("span", "flr-type", a.type));
    t1.appendChild(el("span", "flr-row-title", a.title));
    bd.appendChild(t1);
    bd.appendChild(el("div", "flr-row-meta", a.meta));
    row.appendChild(bd);
    const req = el("div", "flr-req");
    req.appendChild(el("b", "", a.requester));
    req.appendChild(el("span", "", SERVERS[a.source] ? "via " + SERVERS[a.source].name : ""));
    row.appendChild(req);
    const actCell = el("span", "flr-act");
    if (done) stampRow(actCell);
    else {
      const btns = el("span", "ap-acts flr-btns");
      const ok = el("button", "flr-clear", "Clear ✓");
      ok.addEventListener("click", e => {
        e.stopPropagation();
        sparkleAt(e.clientX, e.clientY, { n: 10, d: 34 });
        stampRow(actCell);
        FOW.approve(a.id, true);
        toast("Cleared — " + a.requester + " notified");
        refreshDesk();
      });
      const ask = el("button", "flr-askb", "?");
      ask.title = "Ask askMElah first";
      ask.addEventListener("click", e => {
        e.stopPropagation();
        attachChip({ type: "approval", label: a.type + ": " + a.title, data: a });
        sendMessage("Should I approve this?");
      });
      btns.append(ok, ask);
      actCell.appendChild(btns);
    }
    row.appendChild(actCell);
    makeDraggable(row, { type: "approval", label: a.type + ": " + a.title, data: a });
    desk.appendChild(row);
  });
  const totalRow = el("div", "flr-desk-total");
  totalRow.appendChild(el("span", "flr-desk-l", "ON THE DESK"));
  totalRow.appendChild(deskCnt);
  totalRow.appendChild(deskTot);
  desk.appendChild(totalRow);
  refreshDesk();
  s3.appendChild(desk);

  auto.addEventListener("click", () => {
    const on = !state.autopilot[state.personaId];
    state.autopilot[state.personaId] = on;
    auto.classList.toggle("on", on);
    if (!on) { toast("Autopilot off — every line waits for you again", "info"); return; }
    const low = FOW.pendingApprovals().filter(a => a.urgency === "low");
    if (!low.length) { toast("Autopilot on — nothing low-risk on the desk right now", "info"); return; }
    low.forEach((a, i) => setTimeout(() => {
      const row = $('[data-approval="' + a.id + '"]');
      if (row) { const cell = $(".flr-act", row); if (cell) stampRow(cell); }
      FOW.approve(a.id, i === low.length - 1);
      refreshDesk();
      if (i === low.length - 1) toast("Autopilot cleared " + low.length + " low-risk line" + (low.length > 1 ? "s" : "") + " — requesters notified");
    }, 700 + i * 450));
    toast("Autopilot clearing " + low.length + " low-risk line" + (low.length > 1 ? "s" : ""), "info");
  });

  /* =============== 04 · The week =============== */
  const s4 = sect("wk-card flr-week");
  stHead(s4, "04", "The week", "what the calendar cost, and what's still open on the book");
  const grid4 = el("div", "flr-2col");
  const wkCol = el("div", "flr-col");
  wkCol.appendChild(el("div", "flr-colhead", "The week in numbers"));
  const wk = p.week;
  if (wk) {
    const tiles = el("div", "wk-stats");
    [["Meeting hours", wk.meetingHours + "h"], ["Focus hours", wk.focusHours + "h"], ["Meeting cost", wk.meetingCost], ["Deep blocks", String(wk.deepBlocks)]].forEach(([l, v]) => {
      const t = el("div", "wk");
      t.appendChild(el("div", "l", l));
      const vd = el("div", "v"); countUp(vd, v);
      t.appendChild(vd);
      tiles.appendChild(t);
    });
    wkCol.appendChild(tiles);
    const chw = el("div");
    wkCol.appendChild(chw);
    registerChart(chw, () => renderBars(chw, { title: "wk", unit: "h", categories: wk.days, series: [{ name: "Meetings", values: wk.meetings }, { name: "Focus", values: wk.focus }] }, { mini: true, h: 118 }));
    wkCol.appendChild(el("div", "flr-memo", "floor note — " + wk.insight));
  }
  grid4.appendChild(wkCol);
  const tCol = el("div", "flr-col");
  tCol.appendChild(el("div", "flr-colhead", "The book — open positions"));
  p.tasks.forEach(t => {
    const it = el("div", "flr-task");
    it.appendChild(el("span", "flr-task-key", t.id));
    it.appendChild(el("span", "flr-task-title", t.title));
    it.appendChild(el("span", "flr-task-due", t.due));
    it.appendChild(el("span", "task-status " + t.status, t.status === "inprogress" ? "in progress" : t.status));
    makeDraggable(it, { type: "task", label: t.id + " " + t.title, data: t });
    tCol.appendChild(it);
  });
  grid4.appendChild(tCol);
  s4.appendChild(grid4);

  /* =============== wired into =============== */
  const foot = sect("flr-wired");
  const fr = el("div", "flr-wired-row");
  fr.appendChild(el("span", "flr-wired-l", "wired into"));
  (p.connections || []).forEach(cid => fr.appendChild(srvGlyph(cid, 26)));
  const more = el("button", "rail-more flr-mcp", "MCP console →");
  more.addEventListener("click", () => mcpOpen());
  fr.appendChild(more);
  foot.appendChild(fr);
  foot.appendChild(el("div", "flr-eod", "THE FLOOR · EMEA DESK — Nordvik signature window: " + daysLeft + " days · desk closes 18:00 CET"));

  /* =============== the live countdown =============== */
  const tick = () => {
    if (!document.contains(spot)) { clearInterval(STUDIO.timer); return; }
    const diff = SIGN_BY - new Date();
    const P = x => String(x).padStart(2, "0");
    if (diff <= 0) {
      segs.dd.textContent = "00"; segs.hh.textContent = "00"; segs.mm.textContent = "00"; segs.ss.textContent = "00";
      cdBox.classList.add("due");
      return;
    }
    segs.dd.textContent = P(Math.floor(diff / 864e5));
    segs.hh.textContent = P(Math.floor((diff % 864e5) / 36e5));
    segs.mm.textContent = P(Math.floor((diff % 36e5) / 6e4));
    segs.ss.textContent = P(Math.floor((diff % 6e4) / 1000));
  };
  tick();
  STUDIO.timer = setInterval(tick, 1000);

  updateBadges();
}
