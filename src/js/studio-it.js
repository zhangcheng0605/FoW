/* ============================================================
   FoW · studio-it — THE BRIDGE
   Marcus Webb's network-operations console: a status board of
   service lamps, an uptime dial, a patch-deadline countdown —
   then four chapters: Correlate / Automate / Triage / Capacity.
   ============================================================ */

function renderStudio_it(p, cv) {
  clearCharts();
  clearInterval(STUDIO.timer);
  state.cardIndex = 0;
  cv.textContent = "";
  let sec = 0;
  const sect = cls => { const s = el("section", "st-sec " + (cls || "")); s.style.setProperty("--i", sec++); cv.appendChild(s); return s; };
  const z = n => String(n).padStart(2, "0");

  /* ================= HERO — THE STATUS BOARD ================= */
  const board = sect("it-board");

  /* topline: live badge · console name · on-call · clock */
  const topline = el("div", "it-topline");
  const live = el("span", "it-live");
  live.appendChild(el("i"));
  live.appendChild(el("span", "", "LIVE"));
  topline.appendChild(live);
  topline.appendChild(el("span", "it-topname", "OPS BRIDGE // " + p.user.dept + " OPERATIONS · " + p.user.location.toUpperCase()));
  const topR = el("span", "it-topright");
  const oncall = el("span", "it-oncall");
  oncall.appendChild(el("i"));
  oncall.appendChild(el("span", "", "ON CALL · LENA PARK · APAC"));
  const clockEl = el("span", "it-clock", "--:--:--");
  topR.append(oncall, clockEl);
  topline.appendChild(topR);
  board.appendChild(topline);

  /* hero body: briefing (left) + dial & countdown (right) */
  const hero = el("div", "it-hero");
  const hL = el("div", "it-hero-l");
  const hr = new Date().getHours();
  const greet = hr < 12 ? "GOOD MORNING" : hr < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
  hL.appendChild(el("div", "it-kicker", greet + ", " + p.user.name.split(" ")[0].toUpperCase() + " · FRI AUG 8 2026 · 3,120 ENDPOINTS · 5 SITES"));
  hL.appendChild(el("div", "it-headline", p.focus.headline));
  hL.appendChild(el("div", "it-subline", p.focus.sub));
  const acts = el("div", "it-acts");
  const runBtn = el("button", "lb-enter", "▶ Run: clear CVE exposure");
  runBtn.addEventListener("click", () => { if (p.chains && p.chains[0]) { addUserMsg("Run cross-app workflow: " + p.chains[0].name); runChain(p.chains[0]); } });
  const recapBtn = el("button", "hstat primary it-recap", "✦ Draft my end-of-week recap");
  recapBtn.addEventListener("click", () => sendMessage("Draft my end-of-week recap"));
  const askBtn = el("button", "lb-play", "Trace the exposure");
  askBtn.addEventListener("click", () => {
    attachChip({ type: "kpi", label: "Patch compliance · 96.8%", data: p.kpis[2] });
    sendMessage("Which endpoints still need the CVE-2026-31842 patch?");
  });
  acts.append(runBtn, recapBtn, askBtn);
  hL.appendChild(acts);
  hero.appendChild(hL);

  const hR = el("div", "it-hero-r");
  /* uptime dial — SVG arc gauge */
  const upK = p.kpis.find(k => /uptime/i.test(k.label)) || p.kpis[1];
  const upVal = parseFloat(upK.value) || 99.9;
  const LO = 99.0, HI = 100.0;
  const frac = Math.max(0, Math.min(1, (upVal - LO) / (HI - LO)));
  const CX = 66, CY = 66, R = 48;
  const pt = (a, r) => { const rad = a * Math.PI / 180; return (CX + r * Math.sin(rad)).toFixed(2) + " " + (CY - r * Math.cos(rad)).toFixed(2); };
  const arc = f => { const a0 = -120, a1 = -120 + 240 * f; return "M " + pt(a0, R) + " A " + R + " " + R + " 0 " + ((a1 - a0) > 180 ? 1 : 0) + " 1 " + pt(a1, R); };
  const sloA = -120 + 240 * ((99.9 - LO) / (HI - LO));
  const dial = el("div", "it-dial");
  dial.innerHTML =
    '<svg viewBox="0 0 132 112">' +
    '<path d="' + arc(1) + '" fill="none" stroke="var(--hairline)" stroke-width="8" stroke-linecap="round"/>' +
    '<path class="it-dial-arc" d="' + arc(frac) + '" fill="none" stroke="var(--good-ink)" stroke-width="8" stroke-linecap="round"/>' +
    '<line x1="' + pt(sloA, R - 8).split(" ")[0] + '" y1="' + pt(sloA, R - 8).split(" ")[1] + '" x2="' + pt(sloA, R + 8).split(" ")[0] + '" y2="' + pt(sloA, R + 8).split(" ")[1] + '" stroke="var(--crit)" stroke-width="1.6" opacity="0.85"/>' +
    "</svg>";
  const dialIn = el("div", "it-dial-in");
  const dialV = el("b", "", upK.value);
  dialIn.appendChild(dialV);
  dialIn.appendChild(el("span", "", "UPTIME · CORE"));
  dial.appendChild(dialIn);
  const dialWrap = el("div", "it-dial-wrap");
  dialWrap.appendChild(dial);
  dialWrap.appendChild(el("div", "it-dial-cap", "SLO 99.90 · JUL LOW 99.71 · " + upK.delta.toUpperCase() + " " + upK.vs.toUpperCase()));
  hR.appendChild(dialWrap);

  /* CVE patch-deadline countdown */
  const cd = el("div", "it-cd");
  const cdTag = el("span", "it-cd-tag");
  cdTag.appendChild(el("i", "", "▲"));
  cdTag.appendChild(el("span", "", "CVE-2026-31842"));
  cd.appendChild(cdTag);
  const cdV = el("b", "", "--:--:--");
  cd.appendChild(cdV);
  cd.appendChild(el("span", "it-cd-sub", "PATCH DEADLINE · TUE 09:00"));
  cd.appendChild(el("span", "it-cd-sub dim", "214 ENDPOINTS STILL EXPOSED"));
  hR.appendChild(cd);
  hero.appendChild(hR);
  board.appendChild(hero);

  /* service lamps — from p.bars */
  const lampBar = el("div", "it-lamps");
  const vals = p.bars.series[0].values;
  const hot = vals.indexOf(Math.max.apply(null, vals));
  p.bars.categories.forEach((name, i) => {
    const amber = i === hot;
    const lamp = el("button", "it-lamp" + (amber ? " amber" : ""));
    lamp.appendChild(el("i"));
    const t = el("span", "it-lamp-t");
    t.appendChild(el("b", "", name.toUpperCase()));
    t.appendChild(el("em", "", vals[i] + " INC · 30D · " + (amber ? "WATCH" : "NOM")));
    lamp.appendChild(t);
    lamp.title = name + " — " + vals[i] + " incidents in the last 30 days";
    lamp.addEventListener("click", () => {
      attachChip({ type: "service", label: name + " · " + vals[i] + " incidents / 30d", data: { name: name, incidents: vals[i] } });
      sendMessage("What's driving incidents on " + name + "?");
    });
    makeDraggable(lamp, { type: "service", label: name + " · " + vals[i] + " incidents / 30d", data: { name: name, incidents: vals[i] } });
    lampBar.appendChild(lamp);
  });
  board.appendChild(lampBar);

  /* live tick: clock + countdown */
  function nextTue9(from) {
    const d = new Date(from);
    d.setHours(9, 0, 0, 0);
    let add = (2 - d.getDay() + 7) % 7;
    if (add === 0 && from >= d) add = 7;
    d.setDate(d.getDate() + add);
    return d;
  }
  const tickFn = () => {
    if (!document.contains(clockEl)) { clearInterval(STUDIO.timer); return; }
    const now = new Date();
    clockEl.textContent = z(now.getHours()) + ":" + z(now.getMinutes()) + ":" + z(now.getSeconds()) + " SGT";
    const diff = Math.max(0, nextTue9(now) - now);
    const dd = Math.floor(diff / 864e5), hh = Math.floor(diff / 36e5) % 24, mm = Math.floor(diff / 6e4) % 60, ss = Math.floor(diff / 1e3) % 60;
    cdV.textContent = (dd > 0 ? dd + "D " : "") + z(hh) + ":" + z(mm) + ":" + z(ss);
  };
  tickFn();
  STUDIO.timer = setInterval(tickFn, 1000);

  /* ================= NAKED STAT STRIP ================= */
  const strip = sect("st-strip it-strip");
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

  /* ================= 01 · CORRELATE ================= */
  if (p.joined) {
    const s1 = sect("joined-card st-join it-join");
    stHead(s1, "01", "Correlate", p.joined.subtitle);
    const body = el("div", "joined-body");
    const ch = el("div", "joined-chart");
    const aside = el("aside", "joined-aside");
    aside.appendChild(buildInsight(p.joined.insight));
    body.append(ch, aside);
    s1.appendChild(body);
    registerChart(ch, () => renderJoined(ch, p.joined));
  }

  /* ================= 02 · AUTOMATE ================= */
  const s2 = sect("it-make");
  stHead(s2, "02", "Automate", "runbooks and dispatches — askMElah executes end to end, every hop logged");
  const makeGrid = el("div", "it-cols even");
  const chainsCol = el("div", "chn-card it-col");
  chainsCol.appendChild(el("div", "it-colcap", "RUNBOOKS // CROSS-APP CHAINS"));
  (p.chains || []).forEach(c => {
    const it = el("div", "chn-item it-chain");
    const top = el("div", "chn-top");
    const bd = el("div");
    bd.style.cssText = "flex:1;min-width:0";
    bd.appendChild(el("div", "chn-name", c.name));
    bd.appendChild(el("div", "chn-desc", c.desc));
    top.appendChild(bd);
    top.appendChild(el("span", "it-hops", c.steps.length + " HOPS"));
    const run = el("button", "dg-btn", "▶ Run");
    run.addEventListener("click", () => { addUserMsg("Run cross-app workflow: " + c.name); runChain(c); });
    top.appendChild(run);
    it.appendChild(top);
    const path = el("div", "chn-path");
    c.steps.forEach((st, i) => { if (i) path.appendChild(el("span", "hop", "➜")); path.appendChild(srvGlyph(st.server, 20)); });
    it.appendChild(path);
    makeDraggable(it, { type: "chain", label: "Workflow: " + c.name, data: c });
    chainsCol.appendChild(it);
  });
  makeGrid.appendChild(chainsCol);
  const dgCol = el("div", "dg-card it-col");
  dgCol.appendChild(el("div", "it-colcap", "DISPATCH // DELEGATED TO ASKMELAH"));
  (p.delegations || []).forEach(d => {
    const doneAlready = (state.delegated[state.personaId] || {})[d.id];
    const it = el("div", "dg-item");
    const orb = askmeAv(26);
    orb.classList.add("dg-orb");
    it.appendChild(orb);
    const bd = el("div", "dg-body");
    bd.appendChild(el("div", "dg-label", d.label));
    const sub = el("div", "dg-sub", doneAlready ? d.result : d.detail);
    bd.appendChild(sub);
    const prog = el("div", "dg-prog");
    prog.hidden = true;
    const fill = el("i");
    prog.appendChild(fill);
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
  makeGrid.appendChild(dgCol);
  s2.appendChild(makeGrid);

  /* ================= 03 · TRIAGE ================= */
  const s3 = sect("ap-card it-triage");
  const h3 = stHead(s3, "03", "Triage", "approvals routed like incidents — pre-read by askMElah, cleared by you");
  const auto = el("button", "autopilot" + (state.autopilot[state.personaId] ? " on" : ""));
  auto.title = "When on, askMElah auto-clears low-risk approvals within policy";
  auto.append(el("span", "", "Autopilot"), el("span", "sw"));
  auto.addEventListener("click", () => {
    const on = !state.autopilot[state.personaId];
    state.autopilot[state.personaId] = on;
    auto.classList.toggle("on", on);
    if (!on) { toast("Autopilot off — everything waits for you again", "info"); return; }
    const low = FOW.pendingApprovals().filter(a => a.urgency === "low");
    low.forEach((a, i) => setTimeout(() => { FOW.approve(a.id, i === low.length - 1); }, 600 + i * 450));
    toast(low.length ? "Autopilot clearing " + low.length + " low-risk item" + (low.length > 1 ? "s" : "") : "Autopilot on — nothing low-risk right now", "info");
  });
  h3.appendChild(auto);

  const triCols = el("div", "it-cols triage");
  const qCol = el("div", "it-col");
  const doneSet = state.approved[state.personaId] || new Set();
  const qHead = el("div", "it-qcap");
  qHead.appendChild(el("span", "", "TRIAGE QUEUE // " + p.approvals.length + " ITEMS NEED YOUR SIGN-OFF"));
  qHead.appendChild(el("span", "it-qcap-r", "SLA WATCH · RITM-8841 BREACHES 15:00"));
  qCol.appendChild(qHead);
  const queue = el("div", "it-queue");
  p.approvals.forEach(a => {
    const isDone = doneSet.has(a.id);
    const row = el("div", "it-q " + a.urgency + (isDone ? " done" : ""));
    row.dataset.approval = a.id;
    row.appendChild(el("span", "it-q-lamp " + a.urgency));
    row.appendChild(el("span", "it-q-pri " + a.urgency, a.urgency === "high" ? "P1" : a.urgency === "med" ? "P2" : "P3"));
    const ref = (a.meta.match(/[A-Z]{2,}-\d+/) || [a.source.toUpperCase()])[0];
    row.appendChild(el("span", "it-q-ref", ref));
    const bd = el("div", "it-q-bd");
    bd.appendChild(el("div", "it-q-title", a.title + (a.amount ? " · " + a.amount : "")));
    bd.appendChild(el("div", "it-q-meta", a.requester + " · " + a.meta));
    row.appendChild(bd);
    if (!isDone) {
      const rActs = el("span", "ap-acts it-q-acts");
      const ok = el("button", "it-q-ok", "CLEAR ✓");
      ok.addEventListener("click", e => {
        sparkleAt(e.clientX, e.clientY, { n: 8, d: 30 });
        FOW.approve(a.id, true);
        toast("Approved — " + a.requester + " notified");
      });
      const ask = el("button", "it-q-ask", "ASK");
      ask.addEventListener("click", () => { attachChip({ type: "approval", label: a.type + ": " + a.title, data: a }); sendMessage("Should I approve this?"); });
      rActs.append(ok, ask);
      row.appendChild(rActs);
    }
    makeDraggable(row, { type: "approval", label: a.type + ": " + a.title, data: a });
    queue.appendChild(row);
  });
  qCol.appendChild(queue);
  triCols.appendChild(qCol);

  /* cross-system signals from the chains */
  const sigCol = el("div", "it-col");
  sigCol.appendChild(el("div", "it-colcap", "SIGNALS // ONLY VISIBLE IN THE JOIN"));
  (p.chains || []).filter(c => c.insight).forEach((c, i) => {
    const ins = c.insight;
    const panel = el("button", "it-sig");
    const top = el("div", "it-sig-top");
    (ins.sources || []).forEach((sv, j) => { if (j) top.appendChild(el("span", "it-plus", "+")); top.appendChild(srvGlyph(sv, 16)); });
    top.appendChild(el("span", "it-sig-tag", "⚡ SIGNAL"));
    panel.appendChild(top);
    panel.appendChild(el("div", "it-sig-h", ins.headline));
    panel.appendChild(el("div", "it-sig-act", "▶ " + ins.action));
    panel.addEventListener("click", () => {
      if (i === 0) {
        attachChip({ type: "insight", label: ins.headline, data: ins });
        sendMessage("Which endpoints still need the CVE-2026-31842 patch?");
      } else {
        addUserMsg("Act on this signal: " + ins.action);
        runChain(c);
      }
    });
    makeDraggable(panel, { type: "insight", label: ins.headline, data: ins });
    sigCol.appendChild(panel);
  });
  triCols.appendChild(sigCol);
  s3.appendChild(triCols);

  /* ================= 04 · CAPACITY ================= */
  const s4 = sect("wk-card it-cap");
  stHead(s4, "04", "Capacity", "the human node — this week's load vs the change queue");
  const capCols = el("div", "it-cols cap");
  if (p.week) {
    const wk = p.week;
    const wkCol = el("div", "it-col");
    wkCol.appendChild(el("div", "it-colcap", "LOAD // MEETINGS VS FOCUS"));
    const grid = el("div", "wk-stats");
    [["MEETING HOURS", wk.meetingHours + "h"], ["FOCUS HOURS", wk.focusHours + "h"], ["DEEP BLOCKS", String(wk.deepBlocks)], ["CONTEXT SWITCHES", String(wk.contextSwitches)]].forEach(([l, v]) => {
      const t = el("div", "wk");
      t.appendChild(el("div", "l", l));
      const vd = el("div", "v");
      countUp(vd, v);
      t.appendChild(vd);
      grid.appendChild(t);
    });
    wkCol.appendChild(grid);
    const chw = el("div");
    wkCol.appendChild(chw);
    registerChart(chw, () => renderBars(chw, { title: "wk", unit: "h", categories: wk.days, series: [{ name: "Meetings", values: wk.meetings }, { name: "Focus", values: wk.focus }] }, { mini: true, h: 118 }));
    wkCol.appendChild(el("div", "it-mono-note", "MEETING COST · " + wk.meetingCost.toUpperCase()));
    const adv = el("div", "it-adv");
    adv.appendChild(el("b", "", "ADVISORY"));
    adv.appendChild(el("span", "", wk.insight));
    wkCol.appendChild(adv);
    capCols.appendChild(wkCol);
  }
  const tCol = el("div", "it-col");
  tCol.appendChild(el("div", "it-colcap", "CHANGE QUEUE // OPEN WORK"));
  p.tasks.forEach(t => {
    const it = el("div", "task-item it-task");
    it.appendChild(el("span", "it-t-pri " + t.priority.toLowerCase(), t.priority));
    it.appendChild(el("span", "task-key", t.id));
    const bd = el("span", "it-t-bd");
    bd.appendChild(el("span", "task-title", t.title));
    bd.appendChild(el("span", "it-t-due", "DUE " + t.due.toUpperCase()));
    it.appendChild(bd);
    it.appendChild(el("span", "task-status " + t.status, t.status === "inprogress" ? "in progress" : t.status));
    makeDraggable(it, { type: "task", label: t.id + " " + t.title, data: t });
    tCol.appendChild(it);
  });
  capCols.appendChild(tCol);
  s4.appendChild(capCols);

  /* ================= UPLINKS ================= */
  const foot = sect("st-wired it-wired");
  const fl = el("div", "st-wired-row");
  fl.appendChild(el("span", "it-upl", "UPLINKS //"));
  (p.connections || []).forEach(cid => fl.appendChild(srvGlyph(cid, 26)));
  fl.appendChild(el("span", "it-upl-ok", (p.connections || []).length + "/" + (p.connections || []).length + " NOMINAL"));
  const more = el("button", "rail-more it-mcp", "MCP CONSOLE →");
  more.style.width = "auto";
  more.addEventListener("click", mcpOpen);
  fl.appendChild(more);
  foot.appendChild(fl);
}
