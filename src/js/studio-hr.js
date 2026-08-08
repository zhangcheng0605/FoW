/* ============================================================
   FoW · studio-hr — PEOPLE VIEW (Maya Chen, HRBP)
   The day organized by PERSON, never by task. Who needs you,
   who's waiting, who decides. Soft, warm, generous whitespace.
   Chapters: 01 The signal · 02 In motion · 03 People waiting ·
   04 The pulse
   ============================================================ */

function renderStudio_hr(p, cv) {
  clearCharts();
  clearInterval(STUDIO.timer);
  state.cardIndex = 0;
  cv.textContent = "";

  let secI = 0;
  const sect = cls => { const s = el("section", "st-sec " + (cls || "")); s.style.setProperty("--i", secI++); cv.appendChild(s); return s; };
  const NS = "http://www.w3.org/2000/svg";
  const hourNow = new Date().getHours();
  const greet = hourNow < 12 ? "Good morning" : hourNow < 18 ? "Good afternoon" : "Good evening";
  const initialsOf = n => { const w = n.trim().split(/\s+/); return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); };
  const firstOf = n => n.split(" ")[0];
  const approvedSet = () => state.approved[state.personaId] || new Set();

  /* person avatar — initials circle on an urgency halo */
  function ava(name, urg, sz) {
    const a = el("span", "hr-ava " + (urg || "go"));
    if (sz) a.style.setProperty("--sz", sz + "px");
    a.appendChild(el("b", "", initialsOf(name)));
    return a;
  }

  /* the protagonist: the one decision that can't slip */
  const prot = p.approvals.find(a => a.urgency === "high") || p.approvals[0];
  const protMeeting = p.meetings.find(m => m.time === "15:00") || p.meetings[p.meetings.length - 1];

  /* who needs Maya — membership derived from approvals + meeting attendees */
  const CHIP_META = {
    "Priya Nair":      { urg: "crit", why: "13:00 deep-dive — wants stay-interview stats in the pre-read", ask: "Why is attrition down to 11.4% and will it hold?" },
    "Daniel Okafor":   { urg: "warn", why: "10:30 hiring sync — and wants the $284K context before 15:00", ask: "Brief me for the 10:30 Engineering hiring sync" },
    "James Whitfield": { urg: "warn", why: "Finance sign-off at the 15:00 — CFO note attached", ask: "Should I approve the $284K Staff SWE band exception?" },
    "Rahul Menon":     { urg: "warn", why: "PTO Aug 17–28 — overlaps Sprint 42, coverage confirmed", ask: "Who's pending in my PTO queue and what's at risk?" },
    "Ingrid Larsson":  { urg: "go",   why: "Short 4 panel interviewers for the 6 Stockholm reqs", ask: "How is the hiring pipeline converting this quarter?" },
    "Sofia Marchetti": { urg: "go",   why: "Sep 14 cohort — laptops must be ordered by Aug 22", ask: "What's left before the September 14 onboarding cohort lands?" },
    "Lucia Fernandez": { urg: "go",   why: "16:30 — Support eNPS action plan, +6 heads in Sep", ask: "Which teams are lowest on eNPS this quarter?" },
    "Wei Lin Tan":     { urg: "dim",  why: "Waiting on Greenhouse admin access for offer letters", ask: "Should I approve Wei Lin Tan's Greenhouse admin access?" },
  };
  const seen = new Set([prot.requester]);
  const chipNames = [];
  p.approvals.forEach(a => { if (!seen.has(a.requester)) { seen.add(a.requester); chipNames.push(a.requester); } });
  p.meetings.forEach(m => (m.attendees || []).forEach(n => { if (!seen.has(n)) { seen.add(n); chipNames.push(n); } }));
  const URG_RANK = { crit: 0, warn: 1, go: 2, dim: 3 };
  const chips = chipNames.filter(n => CHIP_META[n]).sort((a, b) => URG_RANK[CHIP_META[a].urg] - URG_RANK[CHIP_META[b].urg]);

  /* =============== HERO — who needs you today =============== */
  const hero = sect("hr-hero");
  const greetRow = el("div", "hr-greet");
  greetRow.appendChild(el("i", "hr-dot"));
  greetRow.appendChild(el("span", "", greet + ", " + firstOf(p.user.name) + " — Friday, August 8 · " + p.user.location));
  hero.appendChild(greetRow);
  hero.appendChild(el("div", "hr-kicker", "people view · who needs you today"));
  const NUMWORD = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  const nPeople = chips.length + 1;
  hero.appendChild(el("h2", "hr-title", (NUMWORD[nPeople] || nPeople) + " people need a piece of your Friday — one decision can't wait past 15:00."));
  hero.appendChild(el("div", "hr-lede", p.focus.headline));
  const acts = el("div", "hr-acts");
  const recapBtn = el("button", "hstat primary hr-recap", "✦ Draft my end-of-week recap");
  recapBtn.addEventListener("click", () => sendMessage("Draft my end-of-week recap"));
  const queueBtn = el("button", "lb-play", "Who's waiting on me?");
  queueBtn.addEventListener("click", () => sendMessage("What's pending my approval?"));
  acts.append(recapBtn, queueBtn);
  hero.appendChild(acts);

  /* the people row — protagonist card first, then the chips */
  const row = el("div", "hr-people");
  hero.appendChild(row);

  const pc = el("article", "hr-prot");
  const pcL = el("div", "hr-prot-l");
  pcL.appendChild(ava(prot.requester, "crit", 60));
  pc.appendChild(pcL);
  const pcB = el("div", "hr-prot-b");
  pcB.appendChild(el("div", "hr-prot-kick", "the one decision · " + protMeeting.time));
  pcB.appendChild(el("div", "hr-prot-name", prot.requester));
  pcB.appendChild(el("div", "hr-prot-ask", prot.title));
  pcB.appendChild(el("div", "hr-prot-meta", prot.meta));
  const srcRow = el("div", "hr-prot-src");
  srcRow.appendChild(srvGlyph(prot.source, 15));
  srcRow.appendChild(srvGlyph("workday", 15));
  srcRow.appendChild(el("span", "", "pre-read by askMElah — recommendation ready"));
  pcB.appendChild(srcRow);
  const pcActs = el("div", "hr-prot-acts");
  const askBtn = el("button", "lb-enter", "✦ Ask askMElah");
  askBtn.addEventListener("click", () => {
    attachChip({ type: "approval", label: prot.type + ": " + prot.title, data: prot });
    sendMessage("Should I approve the $284K Staff SWE band exception?");
  });
  const okBtn = el("button", "lb-play", "Approve now ✓");
  okBtn.addEventListener("click", e => {
    sparkleAt(e.clientX, e.clientY, { n: 12, d: 38 });
    FOW.approve(prot.id, true);
    toast("Approved — " + firstOf(prot.requester) + " can call the candidate today ✨");
    syncProt();
  });
  pcActs.append(askBtn, okBtn);
  pcB.appendChild(pcActs);
  pc.appendChild(pcB);
  const pcR = el("div", "hr-prot-r");
  const cdV = el("b", "hr-cd-v", "–:––:––");
  const cdS = el("span", "hr-cd-s", "until the " + protMeeting.time + " with " + protMeeting.attendees.map(firstOf).join(" & "));
  pcR.append(cdV, cdS);
  pc.appendChild(pcR);
  makeDraggable(pc, { type: "approval", label: prot.type + ": " + prot.title, data: prot });
  row.appendChild(pc);

  function syncProt() {
    const done = approvedSet().has(prot.id);
    pc.classList.toggle("done", done);
    if (done) { const a2 = $(".hr-prot-acts", pc); if (a2) a2.remove(); }
  }

  chips.forEach(name => {
    const m = CHIP_META[name];
    const c = el("button", "hr-chip");
    c.appendChild(ava(name, m.urg, 46));
    c.appendChild(el("span", "hr-chip-name", name));
    c.appendChild(el("span", "hr-chip-why", m.why));
    c.addEventListener("click", () => {
      attachChip({ type: "person", label: name + " — " + m.why, data: { name, why: m.why } });
      sendMessage(m.ask);
    });
    makeDraggable(c, { type: "person", label: name + " — " + m.why, data: { name, why: m.why } });
    row.appendChild(c);
  });

  /* team pulse — her eNPS heatmap as a row of small faces */
  const pulse = el("div", "hr-pulse");
  const ph = el("div", "hr-pulse-head");
  ph.appendChild(el("span", "hr-pulse-t", "team pulse"));
  ph.appendChild(srvGlyph(p.heatmap.source, 14));
  ph.appendChild(el("span", "hr-pulse-s", "eNPS · August · tap a face for the story"));
  pulse.appendChild(ph);
  const pr = el("div", "hr-pulse-row");
  const flat = p.heatmap.values.flat();
  const vMin = Math.min.apply(null, flat), vMax = Math.max.apply(null, flat);
  const RAMP = [[224, 49, 49], [240, 140, 0], [255, 212, 59]];
  const rampColor = t => {
    const x = Math.max(0, Math.min(1, t)) * (RAMP.length - 1);
    const i = Math.min(RAMP.length - 2, Math.floor(x)), f = x - i;
    const c = RAMP[i].map((v, k) => Math.round(v + (RAMP[i + 1][k] - v) * f));
    return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
  };
  function faceSvg(t) {
    const sv = document.createElementNS(NS, "svg");
    sv.setAttribute("viewBox", "0 0 36 36");
    sv.setAttribute("class", "hr-face-svg");
    const face = document.createElementNS(NS, "circle");
    face.setAttribute("cx", "18"); face.setAttribute("cy", "18"); face.setAttribute("r", "16");
    face.setAttribute("fill", rampColor(t));
    sv.appendChild(face);
    const INKF = "rgba(59,26,5,0.82)";
    [12.6, 23.4].forEach(cx => {
      const e = document.createElementNS(NS, "circle");
      e.setAttribute("cx", cx); e.setAttribute("cy", "14.6"); e.setAttribute("r", "2.1");
      e.setAttribute("fill", INKF);
      sv.appendChild(e);
    });
    const k = (t - 0.45) * 10; /* frown → smile as eNPS warms */
    const mouth = document.createElementNS(NS, "path");
    mouth.setAttribute("d", "M11.6 23 Q18 " + (23 + k).toFixed(1) + " 24.4 23");
    mouth.setAttribute("fill", "none");
    mouth.setAttribute("stroke", INKF);
    mouth.setAttribute("stroke-width", "2.2");
    mouth.setAttribute("stroke-linecap", "round");
    sv.appendChild(mouth);
    return sv;
  }
  const lastCol = p.heatmap.cols.length - 1;
  p.heatmap.rows.forEach((team, ri) => {
    const v = p.heatmap.values[ri][lastCol];
    const d = v - p.heatmap.values[ri][0];
    const t = (v - vMin) / (vMax - vMin || 1);
    const f = el("button", "hr-face");
    f.appendChild(faceSvg(t));
    f.appendChild(el("span", "hr-face-name", team));
    const val = el("span", "hr-face-val");
    val.appendChild(el("b", "", String(v)));
    val.appendChild(el("i", "", (d >= 0 ? "+" + d : String(d)) + " since Jan"));
    f.appendChild(val);
    f.title = team + " · eNPS " + v + " in Aug (" + (d >= 0 ? "+" + d : d) + " since Jan)";
    f.addEventListener("click", () => {
      attachChip({ type: "heatmap", label: p.heatmap.title + " — " + team + " " + v, data: { title: p.heatmap.title } });
      sendMessage("Which teams are lowest on eNPS this quarter?");
    });
    makeDraggable(f, { type: "heatmap", label: "eNPS · " + team + " " + v + " (Aug)", data: { title: p.heatmap.title } });
    pr.appendChild(f);
  });
  pulse.appendChild(pr);
  hero.appendChild(pulse);

  /* =============== the naked stat strip =============== */
  const strip = sect("st-strip hr-strip");
  p.kpis.forEach(k => {
    const s = el("article", "card kpi st-stat");
    const lb = el("div", "kpi-label");
    lb.appendChild(srvGlyph(k.source, 15));
    lb.appendChild(el("span", "", k.label));
    s.appendChild(lb);
    const kr = el("div", "kpi-row");
    const val = el("span", "kpi-value");
    countUp(val, k.value);
    kr.appendChild(val);
    kr.appendChild(el("span", "kpi-delta " + (k.deltaGood ? "good" : "bad"), (k.deltaDir === "up" ? "▲ " : "▼ ") + k.delta));
    s.appendChild(kr);
    const sp = el("div", "kpi-spark");
    s.appendChild(sp);
    registerChart(sp, () => renderSpark(sp, k.spark));
    makeDraggable(s, { type: "kpi", label: k.label + " · " + k.value, data: k });
    strip.appendChild(s);
  });

  /* =============== 01 · The signal =============== */
  if (p.joined) {
    const s1 = sect("joined-card hr-join");
    stHead(s1, "01", "The signal", p.joined.subtitle);
    const body = el("div", "joined-body");
    const ch = el("div", "joined-chart");
    const aside = el("aside", "joined-aside");
    aside.appendChild(buildInsight(p.joined.insight));
    body.append(ch, aside);
    s1.appendChild(body);
    registerChart(ch, () => renderJoined(ch, p.joined));
  }

  /* =============== 02 · In motion =============== */
  const s2 = sect("hr-motion");
  stHead(s2, "02", "In motion", "askMElah working on people's behalf — cross-app workflows and background delegations");
  const grid2 = el("div", "st-2col");
  const CHAIN_FOR = { c1: "Tomas Rivera", c2: "Sofia Marchetti" };
  const DG_FOR = { d1: "Priya Nair · James Whitfield", d2: "Lucia Fernandez", d3: "Priya Nair" };

  const chnCol = el("div", "chn-card hr-col");
  chnCol.appendChild(el("div", "hr-colhead", "Cross-app workflows"));
  (p.chains || []).forEach(c => {
    const it = el("div", "chn-item hr-chn");
    if (CHAIN_FOR[c.id]) {
      const fr = el("div", "hr-for");
      fr.appendChild(ava(CHAIN_FOR[c.id].split(" · ")[0], "go", 18));
      fr.appendChild(el("span", "", "for " + CHAIN_FOR[c.id]));
      it.appendChild(fr);
    }
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

  const dgCol = el("div", "dg-card hr-col");
  dgCol.appendChild(el("div", "hr-colhead", "Delegated to askMElah"));
  (p.delegations || []).forEach(d => {
    const doneAlready = (state.delegated[state.personaId] || {})[d.id];
    const it = el("div", "dg-item hr-dg");
    const orb = askmeAv(26); orb.classList.add("dg-orb");
    it.appendChild(orb);
    const bd = el("div", "dg-body");
    if (DG_FOR[d.id]) bd.appendChild(el("div", "hr-for-mini", "for " + DG_FOR[d.id]));
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
    dgCol.appendChild(it);
  });
  grid2.appendChild(dgCol);
  s2.appendChild(grid2);

  /* =============== 03 · People waiting =============== */
  const s3 = sect("ap-card hr-wait");
  const h3 = stHead(s3, "03", "People waiting", "person first, paperwork second — askMElah pre-read every ask");
  const auto = el("button", "autopilot" + (state.autopilot[state.personaId] ? " on" : ""));
  auto.title = "When on, askMElah auto-clears low-risk approvals within policy";
  auto.append(el("span", "", "Autopilot"), el("span", "sw"));
  auto.addEventListener("click", () => {
    const on = !state.autopilot[state.personaId];
    state.autopilot[state.personaId] = on;
    auto.classList.toggle("on", on);
    if (!on) { toast("Autopilot off — everyone waits for you again", "info"); return; }
    const low = FOW.pendingApprovals().filter(a => a.urgency === "low");
    if (!low.length) { toast("Autopilot on — nothing low-risk is waiting right now", "info"); return; }
    low.forEach((a, i) => setTimeout(() => {
      FOW.approve(a.id, i === low.length - 1);
      if (i === low.length - 1) toast("Autopilot unblocked " + low.length + " " + (low.length > 1 ? "people" : "person") + " — " + low.map(x => firstOf(x.requester)).join(", ") + " notified");
    }, 700 + i * 450));
    toast("Autopilot clearing " + low.length + " low-risk ask" + (low.length > 1 ? "s" : ""), "info");
  });
  h3.appendChild(auto);

  const URG_MAP = { high: "crit", med: "warn", low: "dim" };
  const list = el("div", "hr-waitlist");
  p.approvals.forEach(a => {
    const done = approvedSet().has(a.id);
    const rw = el("div", "hr-wrow" + (done ? " done" : ""));
    rw.dataset.approval = a.id;
    rw.appendChild(ava(a.requester, URG_MAP[a.urgency] || "go", 48));
    const bd = el("div", "hr-wbody");
    bd.appendChild(el("div", "hr-wname", a.requester));
    const askLine = el("div", "hr-wask");
    askLine.appendChild(el("span", "hr-wtype", a.type));
    const cleanTitle = a.title.replace(a.type + ": ", "").replace(a.requester + " — ", "").replace(" — " + a.requester, "");
    askLine.appendChild(el("span", "", cleanTitle));
    bd.appendChild(askLine);
    bd.appendChild(el("div", "hr-wmeta", a.meta));
    rw.appendChild(bd);
    const amt = el("span", "hr-wamt", a.amount || "—");
    rw.appendChild(amt);
    const doneChip = el("span", "hr-wdone", "✓ approved · " + firstOf(a.requester) + " notified");
    rw.appendChild(doneChip);
    if (!done) {
      const actsEl = el("span", "ap-acts hr-wacts");
      const ok = el("button", "hr-ok", "Approve ✓");
      ok.addEventListener("click", e => {
        e.stopPropagation();
        sparkleAt(e.clientX, e.clientY, { n: 10, d: 34 });
        FOW.approve(a.id, true);
        toast("Approved — " + firstOf(a.requester) + " just got the good news ✨");
        if (a.id === prot.id) syncProt();
      });
      const ask = el("button", "hr-askb", "ask first");
      ask.title = "Ask askMElah before deciding";
      ask.addEventListener("click", e => {
        e.stopPropagation();
        attachChip({ type: "approval", label: a.type + ": " + a.title, data: a });
        sendMessage("Should I approve this?");
      });
      actsEl.append(ok, ask);
      rw.appendChild(actsEl);
    }
    makeDraggable(rw, { type: "approval", label: a.type + ": " + a.title, data: a });
    list.appendChild(rw);
  });
  s3.appendChild(list);

  /* =============== 04 · The pulse =============== */
  const s4 = sect("wk-card hr-week");
  stHead(s4, "04", "The pulse", "the week behind the people — hours, cost, and what's still open");
  const grid4 = el("div", "st-2col");
  const wkCol = el("div", "hr-col");
  wkCol.appendChild(el("div", "hr-colhead", "Your week in numbers"));
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
    registerChart(chw, () => renderBars(chw, { title: "wk", unit: "h", categories: wk.days, series: [{ name: "Meetings", values: wk.meetings }, { name: "Focus", values: wk.focus }] }, { mini: true, h: 118 }));
    wkCol.appendChild(el("div", "hr-memo", wk.insight));
  }
  grid4.appendChild(wkCol);
  const tCol = el("div", "hr-col");
  tCol.appendChild(el("div", "hr-colhead", "Still open"));
  p.tasks.forEach(t => {
    const it = el("div", "task-item hr-task");
    it.appendChild(el("span", "task-key", t.id));
    it.appendChild(el("span", "task-title", t.title));
    it.appendChild(el("span", "hr-due", t.due));
    it.appendChild(el("span", "task-status " + t.status, t.status === "inprogress" ? "in progress" : t.status));
    makeDraggable(it, { type: "task", label: t.id + " " + t.title, data: t });
    tCol.appendChild(it);
  });
  grid4.appendChild(tCol);
  s4.appendChild(grid4);

  /* =============== wired into =============== */
  const foot = sect("hr-wired");
  const fr = el("div", "hr-wired-row");
  fr.appendChild(el("span", "hr-wired-l", "wired into"));
  (p.connections || []).forEach(cid => fr.appendChild(srvGlyph(cid, 26)));
  const more = el("button", "rail-more hr-mcp", "MCP console →");
  more.addEventListener("click", () => mcpOpen());
  fr.appendChild(more);
  foot.appendChild(fr);

  /* =============== the live decision clock =============== */
  syncProt();
  const tick = () => {
    if (!document.contains(cdV)) { clearInterval(STUDIO.timer); return; }
    if (approvedSet().has(prot.id)) {
      cdV.textContent = "approved ✓";
      cdS.textContent = firstOf(prot.requester) + " can make the call today";
      return;
    }
    const now = new Date();
    const t = new Date(now); t.setHours(15, 0, 0, 0);
    const diff = t - now;
    if (diff > 0) {
      const hh = Math.floor(diff / 3.6e6), mm = Math.floor((diff % 3.6e6) / 6e4), ss = Math.floor((diff % 6e4) / 1000);
      cdV.textContent = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
    } else {
      cdV.textContent = "15:00 · now";
      cdS.textContent = "the offer sync is live — decision time";
    }
  };
  tick();
  STUDIO.timer = setInterval(tick, 1000);
}
