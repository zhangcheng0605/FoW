/* ============================================================
   FoW · studio-procurement — THE CONTROL TOWER
   Priya Nair, Procurement · the day as a renewal radar console.
   Hero: the RENEWAL RADAR (next 90 days as a semicircle sweep)
   beside the AWS EA priority contact. Chapters:
   01 Leverage · 02 The chase · 03 Clear the queue · 04 The week
   ============================================================ */

function renderStudio_procurement(p, cv) {
  clearCharts();
  clearInterval(STUDIO.timer);
  cv.textContent = "";

  let secI = 0;
  const sect = cls => { const s = el("section", "st-sec " + (cls || "")); s.style.setProperty("--i", secI++); cv.appendChild(s); return s; };
  const money = s => parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;
  const hourNow = new Date().getHours();
  const greet = hourNow < 12 ? "Good morning" : hourNow < 18 ? "Good afternoon" : "Good evening";

  /* =============== HERO — the tower =============== */
  const hero = sect("twr-hero");

  /* console header band */
  const band = el("div", "twr-band");
  const bandL = el("div", "twr-band-l");
  bandL.appendChild(el("span", "twr-kicker", "Control Tower · Renewal Radar"));
  bandL.appendChild(el("span", "twr-band-sep"));
  bandL.appendChild(el("span", "twr-band-greet", greet + ", " + p.user.name.split(" ")[0]));
  band.appendChild(bandL);
  const bandR = el("div", "twr-band-r");
  const clock = el("span", "twr-clock");
  const clockV = el("b", "", "--:--:--");
  clock.appendChild(clockV);
  clock.appendChild(el("i", "", "LOCAL"));
  bandR.appendChild(clock);
  bandR.appendChild(el("span", "twr-band-date", "FRI AUG 8 · " + p.user.location.toUpperCase()));
  band.appendChild(bandR);
  hero.appendChild(band);

  hero.appendChild(el("h2", "twr-title", p.focus.headline));
  hero.appendChild(el("div", "twr-sub", p.focus.sub));

  const acts = el("div", "twr-acts");
  const runBtn = el("button", "lb-enter", "▶ Run: unblock the Dell invoice");
  runBtn.addEventListener("click", () => { if (p.chains && p.chains[0]) { addUserMsg("Run cross-app workflow: " + p.chains[0].name); runChain(p.chains[0]); } });
  const recapBtn = el("button", "hstat primary twr-recap", "✦ Draft my end-of-week recap");
  recapBtn.addEventListener("click", () => sendMessage("Draft my end-of-week recap"));
  const askBtn = el("button", "lb-play", "Scan the window");
  askBtn.addEventListener("click", () => sendMessage("Which contract renewals land in the next 90 days?"));
  acts.append(runBtn, recapBtn, askBtn);
  hero.appendChild(acts);

  /* the scope: radar + priority contact */
  const scope = el("div", "twr-scope");

  /* ---- the radar ---- */
  const radarWrap = el("div", "twr-radar-wrap");
  const radar = el("div", "twr-radar");
  const W = 460, H = 252, CX = 230, CY = 224, R = 196;
  const arc = r => "M " + (CX - r) + " " + CY + " A " + r + " " + r + " 0 0 1 " + (CX + r) + " " + CY;
  const polar = (deg, r) => {
    const a = deg * Math.PI / 180;
    return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
  };
  let spokes = "";
  [30, 60, 120, 150].forEach(deg => {
    const [x, y] = polar(deg, R);
    spokes += '<line class="twr-spoke" x1="' + CX + '" y1="' + CY + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>';
  });
  radar.innerHTML =
    '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMax meet">' +
    '<defs><linearGradient id="twrSweepGrad" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0" style="stop-color:var(--acc);stop-opacity:.20"/>' +
    '<stop offset="1" style="stop-color:var(--acc);stop-opacity:0"/>' +
    "</linearGradient></defs>" +
    '<path class="twr-ring" d="' + arc(R * 30 / 90) + '"/>' +
    '<path class="twr-ring" d="' + arc(R * 60 / 90) + '"/>' +
    '<path class="twr-ring outer" d="' + arc(R) + '"/>' +
    spokes +
    '<line class="twr-horizon" x1="' + (CX - R - 6) + '" y1="' + CY + '" x2="' + (CX + R + 6) + '" y2="' + CY + '"/>' +
    '<g class="twr-sweep"><path d="M ' + CX + " " + CY + " L " + CX + " " + (CY - R) + " A " + R + " " + R + ' 0 0 1 290.6 37.6 Z" fill="url(#twrSweepGrad)"/>' +
    '<line class="twr-sweep-line" x1="' + CX + '" y1="' + CY + '" x2="' + CX + '" y2="' + (CY - R) + '"/></g>' +
    '<text class="twr-tick" x="' + (CX - R * 30 / 90) + '" y="' + (CY + 15) + '" text-anchor="middle">30</text>' +
    '<text class="twr-tick" x="' + (CX - R * 60 / 90) + '" y="' + (CY + 15) + '" text-anchor="middle">60</text>' +
    '<text class="twr-tick" x="' + (CX - R) + '" y="' + (CY + 15) + '" text-anchor="middle">90d</text>' +
    '<text class="twr-tick" x="' + (CX + R * 30 / 90) + '" y="' + (CY + 15) + '" text-anchor="middle">30</text>' +
    '<text class="twr-tick" x="' + (CX + R * 60 / 90) + '" y="' + (CY + 15) + '" text-anchor="middle">60</text>' +
    '<text class="twr-tick" x="' + (CX + R) + '" y="' + (CY + 15) + '" text-anchor="middle">90d</text>' +
    '<text class="twr-twr" x="' + CX + '" y="' + (CY + 16) + '" text-anchor="middle">▲ TODAY</text>' +
    "</svg>";

  /* contacts on the scope — renewals from the 90-day pipeline (DocuSign) */
  const contacts = [
    { code: "AW", name: "AWS EA", value: "$12.0M", renews: "Sep 30", days: 53, owner: "Mei-Ling Chen", deg: 87, cls: "hot", note: "counter due Mon" },
    { code: "AD", name: "Adobe CC", value: "$82,080", renews: "Aug 31", days: 23, owner: "Anna Kowalski", deg: 127, cls: "urgent", note: "in redline" },
    { code: "OK", name: "Okta SSO", value: "$310,000", renews: "Oct 15", days: 68, owner: "Mei-Ling Chen", deg: 52, cls: "watch", note: "9.2% over budget" },
    { code: "CB", name: "CBRE", value: "$1.4M", renews: "Oct 31", days: 84, owner: "Oluwaseun Adebayo", deg: 148, cls: "", note: "" },
    { code: "ZM", name: "Zoom", value: "$188,000", renews: "Nov 1", days: 85, owner: "Diego Ramírez", deg: 32, cls: "", note: "" },
  ];
  const contactAsk = {
    "AWS EA": "Draft the AWS EA counter-proposal brief for Marcus",
    "Okta SSO": "Should we accept Okta's renewal quote?",
  };
  contacts.forEach(v => {
    const [x, y] = polar(v.deg, R * v.days / 90);
    const b = el("button", "twr-blip " + v.cls);
    b.style.left = (x / W * 100).toFixed(2) + "%";
    b.style.top = (y / H * 100).toFixed(2) + "%";
    b.title = v.name + " · " + v.value + " · renews " + v.renews + " (" + v.days + " days) · " + v.owner + (v.note ? " · " + v.note : "");
    const dot = el("span", "twr-blip-dot");
    dot.appendChild(el("b", "", v.code));
    b.appendChild(dot);
    const tag = el("span", "twr-blip-tag");
    tag.appendChild(el("b", "", v.name));
    tag.appendChild(el("i", "", v.days + "d · " + v.value));
    b.appendChild(tag);
    const chip = { type: "renewal", label: v.name + " renewal · " + v.value + " · " + v.renews, data: v };
    b.addEventListener("click", () => { attachChip(chip); sendMessage(contactAsk[v.name] || "Which contract renewals land in the next 90 days?"); });
    makeDraggable(b, chip);
    radar.appendChild(b);
  });
  radarWrap.appendChild(radar);

  const radarCap = el("div", "twr-radar-cap");
  const capA = el("span", "twr-cap-line");
  capA.appendChild(srvGlyph("docusign", 14));
  capA.appendChild(el("span", "", "23 contracts in the window · $18.9M TCV · 9 in negotiation · 5 not started"));
  radarCap.appendChild(capA);
  const capB = el("span", "twr-cap-clear");
  capB.appendChild(el("b", "", "✓ DL"));
  capB.appendChild(el("span", "", "Dell off the radar — MPA Amendment 3 signed, Latitude pricing locked through FY27"));
  radarCap.appendChild(capB);
  radarWrap.appendChild(radarCap);
  scope.appendChild(radarWrap);

  /* ---- the priority contact: AWS EA ---- */
  const prot = el("aside", "twr-prot");
  const ph = el("div", "twr-prot-kick");
  ph.appendChild(el("span", "twr-prot-dot"));
  ph.appendChild(el("span", "", "Priority contact"));
  prot.appendChild(ph);
  prot.appendChild(el("div", "twr-prot-name", "AWS Enterprise Agreement"));
  const pv = el("div", "twr-prot-val");
  pv.appendChild(el("b", "", "$12.0M"));
  pv.appendChild(el("span", "", "commit / yr · renews Sep 30"));
  prot.appendChild(pv);
  const cdBox = el("div", "twr-count");
  cdBox.appendChild(el("span", "twr-count-l", "Counter-proposal due Monday"));
  const cdV = el("b", "", "–d ––:––:––");
  cdBox.appendChild(cdV);
  cdBox.appendChild(el("span", "twr-count-s", "Marcus Webb needs your number before the CFO"));
  prot.appendChild(cdBox);
  const pos = el("div", "twr-pos");
  [
    ["ASK", "3-yr at 14% discount (now 9%) + $150K/yr Graviton credits"],
    ["WALK-AWAY", "1-yr at 12% — no 3-yr deal below 13%"],
    ["LEVERAGE", "$128,500 Databricks workload + Azure proposal on the table"],
  ].forEach(([k, v]) => {
    const r = el("div", "twr-pos-row");
    r.appendChild(el("b", "", k));
    r.appendChild(el("span", "", v));
    pos.appendChild(r);
  });
  prot.appendChild(pos);
  const pActs = el("div", "twr-prot-acts");
  const draftBtn = el("button", "lb-enter", "✦ Draft the counter-brief");
  draftBtn.addEventListener("click", () => sendMessage("Draft the AWS EA counter-proposal brief for Marcus"));
  const pRun = el("button", "lb-play", "▶ Run first chain");
  pRun.addEventListener("click", () => { if (p.chains && p.chains[0]) { addUserMsg("Run cross-app workflow: " + p.chains[0].name); runChain(p.chains[0]); } });
  pActs.append(draftBtn, pRun);
  prot.appendChild(pActs);
  makeDraggable(prot, { type: "renewal", label: "AWS EA · $12.0M commit · renews Sep 30", data: { name: "AWS EA", value: "$12.0M", renews: "Sep 30" } });
  scope.appendChild(prot);
  hero.appendChild(scope);

  /* =============== the naked stat strip =============== */
  const strip = sect("st-strip twr-strip");
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

  /* =============== 01 · Leverage =============== */
  if (p.joined) {
    const s1 = sect("joined-card twr-leverage");
    stHead(s1, "01", "Leverage", p.joined.subtitle);
    const body = el("div", "joined-body");
    const ch = el("div", "joined-chart");
    const aside = el("aside", "joined-aside");
    aside.appendChild(buildInsight(p.joined.insight));
    body.append(ch, aside);
    s1.appendChild(body);
    registerChart(ch, () => renderJoined(ch, p.joined));
  }

  /* =============== 02 · The chase =============== */
  const s2 = sect("twr-chase");
  stHead(s2, "02", "The chase", "cross-app pursuits — fly them yourself, or hand them to askMElah");
  const grid2 = el("div", "twr-2col");
  const chnCol = el("div", "chn-card twr-col");
  chnCol.appendChild(el("div", "twr-colhead", "Cross-app runs"));
  (p.chains || []).forEach(c => {
    const it = el("div", "chn-item twr-run");
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
  const dgCol = el("div", "dg-card twr-col");
  dgCol.appendChild(el("div", "twr-colhead", "Delegated to askMElah"));
  (p.delegations || []).forEach(d => {
    const doneAlready = (state.delegated[state.personaId] || {})[d.id];
    const it = el("div", "dg-item twr-run");
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

  /* =============== 03 · Clear the queue =============== */
  const s3 = sect("ap-card twr-queue");
  const h3 = stHead(s3, "03", "Clear the queue", "18 POs sit in Ariba worth $486,300 — these need you, each pre-read by askMElah");
  const auto = el("button", "autopilot" + (state.autopilot[state.personaId] ? " on" : ""));
  auto.title = "When on, askMElah auto-clears low-risk approvals within policy";
  auto.append(el("span", "", "Autopilot"), el("span", "sw"));
  h3.appendChild(auto);

  const board = el("div", "twr-strips");
  const totalVal = el("b", "twr-total-v");
  const totalCnt = el("span", "twr-total-c");
  function refreshTotal() {
    const pend = FOW.pendingApprovals();
    const sum = pend.reduce((a, x) => a + money(x.amount), 0);
    totalVal.textContent = "$" + sum.toLocaleString("en-US");
    totalCnt.textContent = pend.length ? pend.length + " strip" + (pend.length > 1 ? "s" : "") + " on the board" : "board clear ✦";
  }
  function stamp(cell) { cell.appendChild(el("span", "twr-stamp", "CLEARED")); }

  p.approvals.forEach(a => {
    const done = (state.approved[state.personaId] || new Set()).has(a.id);
    const row = el("div", "twr-strip-row" + (done ? " done" : ""));
    row.dataset.approval = a.id;
    row.appendChild(el("span", "ap-urg " + a.urgency));
    const code = el("span", "twr-code");
    code.appendChild(el("b", "", a.type.toUpperCase()));
    code.appendChild(el("i", "", a.urgency === "high" ? "priority" : a.urgency === "med" ? "standard" : "routine"));
    row.appendChild(code);
    const item = el("div", "twr-item");
    item.appendChild(el("div", "twr-item-t", a.title));
    item.appendChild(el("div", "twr-item-m", a.requester + " · " + a.meta));
    row.appendChild(item);
    const amt = el("span", "twr-amt", a.amount || "—");
    row.appendChild(amt);
    const actCell = el("span", "twr-act");
    if (done) stamp(actCell);
    else {
      const btns = el("span", "ap-acts twr-btns");
      const ok = el("button", "twr-ok", "Clear ✓");
      ok.addEventListener("click", e => {
        e.stopPropagation();
        sparkleAt(e.clientX, e.clientY, { n: 10, d: 34 });
        stamp(actCell);
        FOW.approve(a.id, true);
        toast("Cleared — " + a.requester + " notified");
        refreshTotal();
      });
      const ask = el("button", "twr-ask", "?");
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
    board.appendChild(row);
  });
  const totalRow = el("div", "twr-total");
  totalRow.appendChild(el("span", "twr-total-l", "Awaiting clearance"));
  totalRow.appendChild(totalCnt);
  totalRow.appendChild(totalVal);
  board.appendChild(totalRow);
  refreshTotal();
  s3.appendChild(board);

  auto.addEventListener("click", () => {
    const on = !state.autopilot[state.personaId];
    state.autopilot[state.personaId] = on;
    auto.classList.toggle("on", on);
    if (!on) { toast("Autopilot off — every strip waits for you again", "info"); return; }
    const low = FOW.pendingApprovals().filter(a => a.urgency === "low");
    if (!low.length) { toast("Autopilot on — nothing routine on the board right now", "info"); return; }
    low.forEach((a, i) => setTimeout(() => {
      const row = $('[data-approval="' + a.id + '"]');
      if (row) { const cell = $(".twr-act", row); if (cell) stamp(cell); }
      FOW.approve(a.id, i === low.length - 1);
      refreshTotal();
      if (i === low.length - 1) toast("Autopilot cleared " + low.length + " routine strip" + (low.length > 1 ? "s" : "") + " — requesters notified");
    }, 700 + i * 450));
    toast("Autopilot clearing " + low.length + " routine strip" + (low.length > 1 ? "s" : ""), "info");
  });

  /* =============== 04 · The week =============== */
  const s4 = sect("wk-card twr-week");
  stHead(s4, "04", "The week", "what the tower cost you — and the work orders still open");
  const grid4 = el("div", "twr-2col");
  const wkCol = el("div", "twr-col");
  wkCol.appendChild(el("div", "twr-colhead", "Tower hours"));
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
    wkCol.appendChild(el("div", "twr-memo", "tower log — " + wk.insight));
  }
  grid4.appendChild(wkCol);
  const tCol = el("div", "twr-col");
  tCol.appendChild(el("div", "twr-colhead", "Open work orders"));
  p.tasks.forEach(t => {
    const it = el("div", "task-item twr-task");
    it.appendChild(el("span", "task-key", t.id));
    it.appendChild(el("span", "task-title", t.title));
    it.appendChild(el("span", "task-due", t.due));
    it.appendChild(el("span", "task-status " + t.status, t.status === "inprogress" ? "in progress" : t.status));
    makeDraggable(it, { type: "task", label: t.id + " " + t.title, data: t });
    tCol.appendChild(it);
  });
  grid4.appendChild(tCol);
  s4.appendChild(grid4);

  /* =============== ground systems =============== */
  const foot = sect("twr-wired");
  const fr = el("div", "twr-wired-row");
  fr.appendChild(el("span", "twr-wired-l", "Ground systems"));
  (p.connections || []).forEach(cid => fr.appendChild(srvGlyph(cid, 26)));
  const more = el("button", "rail-more twr-mcp", "MCP console →");
  more.addEventListener("click", () => mcpOpen());
  fr.appendChild(more);
  foot.appendChild(fr);
  foot.appendChild(el("div", "twr-eof", "RNWL RDR · 90-day scope · sweep 8s · all systems answering"));

  /* =============== the live tower clock =============== */
  const P2 = x => String(x).padStart(2, "0");
  const tick = () => {
    if (!document.contains(cdV)) { clearInterval(STUDIO.timer); return; }
    const now = new Date();
    clockV.textContent = P2(now.getHours()) + ":" + P2(now.getMinutes()) + ":" + P2(now.getSeconds());
    /* counter-proposal deadline: Monday 09:00 */
    const t = new Date(now);
    t.setDate(now.getDate() + ((1 - now.getDay()) + 7) % 7);
    t.setHours(9, 0, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 7);
    const diff = t - now;
    const dd = Math.floor(diff / 864e5);
    const hh = Math.floor((diff % 864e5) / 36e5);
    const mm = Math.floor((diff % 36e5) / 6e4);
    const ss = Math.floor((diff % 6e4) / 1000);
    cdV.textContent = dd + "d " + P2(hh) + ":" + P2(mm) + ":" + P2(ss);
  };
  tick();
  STUDIO.timer = setInterval(tick, 1000);
}
