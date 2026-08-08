/* ============================================================
   FoW · studio-legal — THE DOCKET
   Sofia Reyes, Senior Legal Counsel · the workspace as a case
   docket: pleading caption, rubber stamps, numbered entries.
   Chapters: 01 Exhibits · 02 Filings · 03 For signature ·
   04 Calendar call — certified by askMElah, clerk.
   ============================================================ */

function renderStudio_legal(p, cv) {
  clearCharts();
  clearInterval(STUDIO.timer);
  state.cardIndex = 0;
  cv.textContent = "";

  let secI = 0;
  const sect = cls => { const s = el("section", "st-sec " + (cls || "")); s.style.setProperty("--i", secI++); cv.appendChild(s); return s; };
  const P2 = n => String(n).padStart(2, "0");
  const money = s => parseInt(String(s || "").replace(/[^0-9]/g, ""), 10) || 0;
  const hourNow = new Date().getHours();
  const greet = hourNow < 12 ? "Good morning" : hourNow < 18 ? "Good afternoon" : "Good evening";

  const orion = p.approvals.find(a => /orion/i.test(a.title)) || p.approvals[0];
  const orionChain = (p.chains || []).find(c => /orion/i.test(c.name)) || (p.chains || [])[0];
  const call1030 = p.meetings.find(m => m.time === "10:30") || p.meetings[1];

  /* ================= HERO — THE DOCKET HEADER ================= */
  const hero = sect("dk-hero");

  /* topline: court-style running head */
  const top = el("div", "dk-topline");
  top.appendChild(el("span", "dk-top-l", "LEGAL DEPARTMENT DOCKET · MEDIACORP"));
  const topR = el("span", "dk-top-r");
  topR.appendChild(el("span", "", "FRI AUG 8 2026 · " + p.user.location.toUpperCase()));
  const clockEl = el("span", "dk-clock", "--:--:--");
  topR.appendChild(clockEl);
  top.appendChild(topR);
  hero.appendChild(top);

  hero.appendChild(el("div", "dk-greet", greet + ", " + p.user.name.split(" ")[0] + " — " + p.focus.sub));

  /* pleading caption: parties ) docket meta */
  const cap = el("div", "dk-caption");
  const capL = el("div", "dk-cap-l");
  capL.appendChild(el("div", "dk-cap-kicker", "In re:"));
  capL.appendChild(el("h2", "dk-cap-title", "Orion Systems MSA"));
  capL.appendChild(el("div", "dk-cap-sub", "3-year renewal · " + orion.amount + " · liability cap countered at 2× fees"));
  capL.appendChild(el("div", "dk-cap-lede", p.focus.headline));
  cap.appendChild(capL);
  cap.appendChild(el("div", "dk-cap-sep", ")\n)\n)\n)\n)\n)"));
  const capR = el("div", "dk-cap-r");
  [
    ["Docket No.", "LGL-1041"],
    ["Filed", "Fri Aug 8, 2026 · " + p.user.location],
    ["Counsel", p.user.name + ", " + p.user.role],
    ["Presented by", orion.requester + " — Sales"],
    ["Exception", "EXC-2026-118 → P. Raghavan (GC)"],
  ].forEach(([l, v]) => {
    const r = el("div", "dk-meta-row");
    r.appendChild(el("span", "dk-meta-l", l));
    r.appendChild(el("span", "dk-meta-v", v));
    capR.appendChild(r);
  });
  cap.appendChild(capR);
  hero.appendChild(cap);

  /* the rubber stamp — pending until the cap exception is signed */
  const stampBox = el("div", "dk-stamp-box");
  hero.appendChild(stampBox);
  function heroStamp(animate) {
    stampBox.textContent = "";
    const signed = (state.approved[state.personaId] || new Set()).has(orion.id);
    const st = el("div", "dk-stamp" + (signed ? " ok" : "") + (animate ? " thud" : ""));
    st.appendChild(el("b", "", signed ? "Approved" : "Pending sign-off"));
    st.appendChild(el("span", "", signed ? "2× cap · EXC-2026-118 · in hand" : "GC approval req'd · EXC-2026-118"));
    stampBox.appendChild(st);
  }
  heroStamp(false);

  /* protagonist row: the cap counter · the value · the clock */
  const pro = el("div", "dk-protag");
  const b1 = el("div", "dk-pro-block");
  b1.appendChild(el("div", "dk-pro-l", "The liability-cap counter"));
  const fig = el("div", "dk-pro-fig");
  fig.appendChild(el("s", "", "1×"));
  fig.appendChild(el("i", "", "→"));
  fig.appendChild(el("b", "", "2×"));
  fig.appendChild(el("em", "", "fees"));
  b1.appendChild(fig);
  b1.appendChild(el("div", "dk-pro-s", "playbook standard 1× — 2× permitted with GC sign-off · Commercial playbook v3.2"));
  pro.appendChild(b1);
  const b2 = el("div", "dk-pro-block");
  b2.appendChild(el("div", "dk-pro-l", "At stake"));
  const amt = el("div", "dk-pro-amt");
  countUp(amt, orion.amount);
  b2.appendChild(amt);
  b2.appendChild(el("div", "dk-pro-s", "largest Q3 renewal · " + orion.meta));
  pro.appendChild(b2);
  const b3 = el("div", "dk-pro-block dk-pro-clock");
  b3.appendChild(el("div", "dk-pro-l", "Calendar call — 10:30"));
  const cdV = el("div", "dk-cd", "--:--:--");
  b3.appendChild(cdV);
  const cdS = el("div", "dk-pro-s", "to the Orion redline call · Zoom · " + call1030.attendees.join(", "));
  b3.appendChild(cdS);
  pro.appendChild(b3);
  hero.appendChild(pro);
  makeDraggable(pro, { type: "approval", label: orion.type + ": " + orion.title, data: orion });

  /* motions — hero actions */
  const acts = el("div", "dk-acts");
  const runBtn = el("button", "lb-enter", "▶ Route the cap exception");
  runBtn.addEventListener("click", () => { if (orionChain) { addUserMsg("Run cross-app workflow: " + orionChain.name); runChain(orionChain); } });
  const recapBtn = el("button", "hstat primary dk-recap", "✦ Draft my end-of-week recap");
  recapBtn.addEventListener("click", () => sendMessage("Draft my end-of-week recap"));
  const askBtn = el("button", "lb-play", "Ask about the redlines");
  askBtn.addEventListener("click", () => {
    attachChip({ type: "approval", label: orion.type + ": " + orion.title, data: orion });
    sendMessage("Summarize the Orion Systems MSA redlines");
  });
  acts.append(runBtn, recapBtn, askBtn);
  hero.appendChild(acts);

  /* ================= THE RECORD — naked stat strip ================= */
  const strip = sect("st-strip dk-strip");
  const striphead = el("div", "dk-striphead");
  striphead.appendChild(el("span", "", "The record — key figures"));
  striphead.appendChild(el("span", "dk-striphead-r", "Q3 FY26 · certified from source systems"));
  strip.appendChild(striphead);
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

  /* ================= No. 01 · EXHIBITS ================= */
  if (p.joined) {
    const s1 = sect("joined-card dk-exhibits");
    stHead(s1, "No. 01", "Exhibits", p.joined.subtitle);
    const body = el("div", "joined-body");
    const chWrap = el("div", "joined-chart dk-exh");
    chWrap.appendChild(el("div", "dk-exh-tag", "Exhibit A — the joined record"));
    const ch = el("div", "dk-exh-chart");
    chWrap.appendChild(ch);
    const aside = el("aside", "joined-aside dk-exh-aside");
    aside.appendChild(el("div", "dk-exh-tag", "Exhibit B — finding of fact"));
    aside.appendChild(buildInsight(p.joined.insight));
    body.append(chWrap, aside);
    s1.appendChild(body);
    registerChart(ch, () => renderJoined(ch, p.joined));
  }

  /* ================= No. 02 · FILINGS ================= */
  const s2 = sect("dk-filings");
  stHead(s2, "No. 02", "Filings", "instruments in motion — cross-app workflows, and matters handed to the clerk");
  const grid2 = el("div", "dk-2col");
  const chnCol = el("div", "chn-card dk-col");
  chnCol.appendChild(el("div", "dk-colhead", "Cross-app filings"));
  (p.chains || []).forEach((c, i) => {
    const it = el("div", "chn-item dk-entry");
    const top2 = el("div", "chn-top");
    const bd = el("div"); bd.style.cssText = "flex:1;min-width:0";
    const nm = el("div", "chn-name");
    nm.appendChild(el("span", "dk-fno", "02-" + P2(i + 1)));
    nm.appendChild(el("span", "", c.name));
    bd.appendChild(nm);
    bd.appendChild(el("div", "chn-desc", c.desc));
    top2.appendChild(bd);
    const run = el("button", "dg-btn", "▶ Run");
    run.addEventListener("click", () => { addUserMsg("Run cross-app workflow: " + c.name); runChain(c); });
    top2.appendChild(run);
    it.appendChild(top2);
    const path = el("div", "chn-path");
    c.steps.forEach((st, j) => { if (j) path.appendChild(el("span", "hop", "➜")); path.appendChild(srvGlyph(st.server, 20)); });
    it.appendChild(path);
    makeDraggable(it, { type: "chain", label: "Workflow: " + c.name, data: c });
    chnCol.appendChild(it);
  });
  grid2.appendChild(chnCol);
  const dgCol = el("div", "dg-card dk-col");
  dgCol.appendChild(el("div", "dk-colhead", "Clerk's office — delegated to askMElah"));
  (p.delegations || []).forEach(d => {
    const doneAlready = (state.delegated[state.personaId] || {})[d.id];
    const it = el("div", "dg-item dk-entry");
    const orb = askmeAv(26); orb.classList.add("dg-orb");
    it.appendChild(orb);
    const bd = el("div", "dg-body");
    bd.appendChild(el("div", "dg-label", d.label));
    const sub = el("div", "dg-sub", doneAlready ? d.result : d.detail);
    bd.appendChild(sub);
    const prog = el("div", "dg-prog"); prog.hidden = true;
    const fill = el("i"); prog.appendChild(fill);
    bd.appendChild(prog);
    it.appendChild(bd);
    const stateBox = el("span", "dg-state");
    if (doneAlready) stateBox.appendChild(el("span", "dg-pill done", "done"));
    else {
      const btn = el("button", "dg-btn", "▶ Delegate");
      btn.addEventListener("click", () => runDelegation(d, { orb, sub, prog, fill, stateBox, btn, bd }));
      stateBox.appendChild(btn);
    }
    it.appendChild(stateBox);
    dgCol.appendChild(it);
  });
  grid2.appendChild(dgCol);
  s2.appendChild(grid2);

  /* ================= No. 03 · FOR SIGNATURE ================= */
  const s3 = sect("ap-card dk-sign");
  const h3 = stHead(s3, "No. 03", "For signature", "askMElah pre-reads each instrument — ink it, or send it back with questions");
  const auto = el("button", "autopilot" + (state.autopilot[state.personaId] ? " on" : ""));
  auto.title = "When on, askMElah auto-clears low-risk approvals within policy";
  auto.append(el("span", "", "Autopilot"), el("span", "sw"));
  h3.appendChild(auto);

  const docket = el("div", "dk-lines");
  const lhead = el("div", "dk-lhead");
  ["", "No.", "Instrument", "Presented by", "Value", "Disposition"].forEach(t => lhead.appendChild(el("span", "", t)));
  docket.appendChild(lhead);

  function inkStamp(cell, animate) {
    cell.textContent = "";
    cell.appendChild(el("span", "dk-inked" + (animate ? " thud" : ""), "APPROVED"));
  }
  const footCnt = el("span", "dk-foot-c");
  const footAmt = el("b", "dk-foot-v");
  function refreshFoot() {
    const pend = FOW.pendingApprovals();
    const sum = pend.reduce((a, x) => a + money(x.amount), 0);
    footCnt.textContent = pend.length
      ? pend.length + " instrument" + (pend.length > 1 ? "s" : "") + " await" + (pend.length > 1 ? "" : "s") + " your signature"
      : "the docket is clear — every instrument signed";
    footAmt.textContent = sum ? "$" + sum.toLocaleString("en-US") + " under pen" : "✦";
  }

  p.approvals.forEach((a, i) => {
    const done = (state.approved[state.personaId] || new Set()).has(a.id);
    const row = el("div", "dk-line" + (done ? " done" : ""));
    row.dataset.approval = a.id;
    row.appendChild(el("span", "ap-urg " + a.urgency));
    row.appendChild(el("span", "dk-lno", "03-" + P2(i + 1)));
    const item = el("div", "dk-li");
    const t1 = el("div", "dk-li-t");
    t1.appendChild(el("span", "dk-type", a.type));
    t1.appendChild(el("span", "dk-li-title", a.title));
    item.appendChild(t1);
    item.appendChild(el("div", "dk-li-meta", a.meta));
    row.appendChild(item);
    const req = el("div", "dk-req");
    req.appendChild(el("b", "", a.requester));
    req.appendChild(el("span", "", SERVERS[a.source] ? "via " + SERVERS[a.source].name : ""));
    row.appendChild(req);
    row.appendChild(el("span", "dk-amt", a.amount || "—"));
    const disp = el("span", "dk-disp");
    if (done) inkStamp(disp, false);
    else {
      const btns = el("span", "ap-acts dk-btns");
      const ok = el("button", "dk-ok", "✎ Sign");
      ok.addEventListener("click", e => {
        e.stopPropagation();
        sparkleAt(e.clientX, e.clientY, { n: 10, d: 36 });
        inkStamp(disp, true);
        FOW.approve(a.id, true);
        toast("Signed — " + a.requester + " notified");
        refreshFoot();
        if (a.id === orion.id) heroStamp(true);
      });
      const ask = el("button", "dk-ask", "?");
      ask.title = "Ask askMElah first";
      ask.addEventListener("click", e => {
        e.stopPropagation();
        attachChip({ type: "approval", label: a.type + ": " + a.title, data: a });
        sendMessage("Should I approve this?");
      });
      btns.append(ok, ask);
      disp.appendChild(btns);
    }
    row.appendChild(disp);
    makeDraggable(row, { type: "approval", label: a.type + ": " + a.title, data: a });
    docket.appendChild(row);
  });
  const foot3 = el("div", "dk-lfoot");
  foot3.appendChild(el("span", "dk-foot-l", "Awaiting signature"));
  foot3.appendChild(footCnt);
  foot3.appendChild(footAmt);
  docket.appendChild(foot3);
  refreshFoot();
  s3.appendChild(docket);

  auto.addEventListener("click", () => {
    const on = !state.autopilot[state.personaId];
    state.autopilot[state.personaId] = on;
    auto.classList.toggle("on", on);
    if (!on) { toast("Autopilot off — every instrument waits for your ink again", "info"); return; }
    const low = FOW.pendingApprovals().filter(a => a.urgency === "low");
    if (!low.length) { toast("Autopilot on — nothing low-risk on the docket right now", "info"); return; }
    low.forEach((a, i) => setTimeout(() => {
      const row = $('[data-approval="' + a.id + '"]');
      if (row) { const cell = $(".dk-disp", row); if (cell) inkStamp(cell, true); }
      FOW.approve(a.id, i === low.length - 1);
      refreshFoot();
      if (i === low.length - 1) toast("Autopilot signed " + low.length + " low-risk instrument" + (low.length > 1 ? "s" : "") + " — requesters notified");
    }, 700 + i * 450));
    toast("Autopilot clearing " + low.length + " low-risk instrument" + (low.length > 1 ? "s" : ""), "info");
  });

  /* ================= No. 04 · CALENDAR CALL ================= */
  const s4 = sect("wk-card dk-cal");
  stHead(s4, "No. 04", "Calendar call", "today's list · what the week cost · open motions on the matter list");
  const grid4 = el("div", "dk-3col");

  /* today's call list */
  const callCol = el("div", "dk-col");
  callCol.appendChild(el("div", "dk-colhead", "Today's call list — Fri Aug 8"));
  const nowMin0 = new Date().getHours() * 60 + new Date().getMinutes();
  const callRows = [];
  p.meetings.forEach(mt => {
    const [hh, mm] = mt.time.split(":").map(Number);
    const start = hh * 60 + mm;
    const durMin = /h/.test(mt.dur) ? 60 : parseInt(mt.dur, 10) || 30;
    const it = el("div", "dk-call" + (mt === call1030 ? " main" : ""));
    it.appendChild(el("span", "dk-call-t", mt.time));
    const bd = el("div", "dk-call-b");
    const t = el("div", "dk-call-title");
    t.appendChild(el("span", "", mt.title));
    if (mt === call1030) t.appendChild(el("span", "dk-call-flag", "◆ the main event"));
    bd.appendChild(t);
    bd.appendChild(el("div", "dk-call-meta", mt.dur + " · " + mt.attendees.slice(0, 2).join(", ") + (mt.attendees.length > 2 ? " +" + (mt.attendees.length - 2) : "")));
    it.appendChild(bd);
    const prep = el("button", "dk-prep", "prep");
    prep.addEventListener("click", e => { e.stopPropagation(); attachChip({ type: "meeting", label: mt.time + " · " + mt.title, data: mt }); sendMessage("Prep me for this meeting"); });
    it.appendChild(prep);
    if (start + durMin < nowMin0) it.classList.add("past");
    makeDraggable(it, { type: "meeting", label: mt.time + " · " + mt.title, data: mt });
    callRows.push({ it, start, end: start + durMin });
    callCol.appendChild(it);
  });
  grid4.appendChild(callCol);

  /* the week, taxed */
  const wkCol = el("div", "dk-col");
  wkCol.appendChild(el("div", "dk-colhead", "The week, taxed — costs on the record"));
  const wk = p.week;
  if (wk) {
    const tiles = el("div", "wk-stats");
    [["Meeting hours", wk.meetingHours + "h"], ["Focus hours", wk.focusHours + "h"], ["Meeting cost", wk.meetingCost.split(" ")[0]], ["Deep blocks", String(wk.deepBlocks)]].forEach(([l, v]) => {
      const t = el("div", "wk");
      t.appendChild(el("div", "l", l));
      const vd = el("div", "v"); countUp(vd, v);
      t.appendChild(vd);
      tiles.appendChild(t);
    });
    wkCol.appendChild(tiles);
    const chw = el("div");
    wkCol.appendChild(chw);
    registerChart(chw, () => renderBars(chw, { title: "wk", unit: "h", categories: wk.days, series: [{ name: "Meetings", values: wk.meetings }, { name: "Focus", values: wk.focus }] }, { mini: true, h: 116 }));
    wkCol.appendChild(el("div", "dk-memo", "Clerk's note — " + wk.insight));
  }
  grid4.appendChild(wkCol);

  /* open motions */
  const tCol = el("div", "dk-col");
  tCol.appendChild(el("div", "dk-colhead", "Open motions — matter list"));
  p.tasks.forEach(t => {
    const it = el("div", "task-item dk-task");
    it.appendChild(el("span", "task-key", t.id));
    it.appendChild(el("span", "task-title", t.title));
    it.appendChild(el("span", "dk-due", t.due));
    it.appendChild(el("span", "task-status " + t.status, t.status === "inprogress" ? "in progress" : t.status));
    makeDraggable(it, { type: "task", label: t.id + " " + t.title, data: t });
    tCol.appendChild(it);
  });
  grid4.appendChild(tCol);
  s4.appendChild(grid4);

  /* ================= OF RECORD — wired into ================= */
  const foot = sect("dk-wired");
  const fr = el("div", "dk-wired-row");
  fr.appendChild(el("span", "dk-wired-l", "of record — wired into"));
  (p.connections || []).forEach(cid => fr.appendChild(srvGlyph(cid, 26)));
  const more = el("button", "rail-more dk-mcp", "MCP console →");
  more.addEventListener("click", () => mcpOpen());
  fr.appendChild(more);
  foot.appendChild(fr);
  foot.appendChild(el("div", "dk-cert", "— Certified a true and complete copy of the docket · askMElah, clerk of record · E&OE —"));

  /* ================= the live clock ================= */
  const tick = () => {
    if (!document.contains(cdV)) { clearInterval(STUDIO.timer); return; }
    const now = new Date();
    clockEl.textContent = P2(now.getHours()) + ":" + P2(now.getMinutes()) + ":" + P2(now.getSeconds());
    const target = new Date(now); target.setHours(10, 30, 0, 0);
    const endCall = new Date(now); endCall.setHours(11, 15, 0, 0);
    if (now < target) {
      const diff = target - now;
      cdV.textContent = "T−" + P2(Math.floor(diff / 3.6e6)) + ":" + P2(Math.floor((diff % 3.6e6) / 6e4)) + ":" + P2(Math.floor((diff % 6e4) / 1000));
      cdV.classList.remove("live");
    } else if (now < endCall) {
      cdV.textContent = "IN SESSION";
      cdV.classList.add("live");
      cdS.textContent = "Orion redline call under way · Zoom · " + call1030.attendees.join(", ");
    } else {
      cdV.textContent = "ADJOURNED";
      cdV.classList.remove("live");
      cdS.textContent = "10:30 call concluded · next: land EXC-2026-118 sign-off";
    }
    const nowMin = now.getHours() * 60 + now.getMinutes();
    callRows.forEach(r => r.it.classList.toggle("now", nowMin >= r.start && nowMin < r.end));
  };
  tick();
  STUDIO.timer = setInterval(tick, 1000);
}
