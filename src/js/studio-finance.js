/* ============================================================
   FoW · studio-finance — THE LEDGER
   Daniel Okafor, FP&A · the day framed as a reconciliation.
   Chapters: 01 Reconcile · 02 Move money · 03 Sign · 04 Close
   ============================================================ */

function renderStudio_finance(p, cv) {
  clearCharts();
  clearInterval(STUDIO.timer);
  cv.textContent = "";

  let secI = 0;
  const sect = cls => { const s = el("section", "st-sec " + (cls || "")); s.style.setProperty("--i", secI++); cv.appendChild(s); return s; };
  const svgEl = (tag, attrs) => { const n = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const k in attrs || {}) n.setAttribute(k, attrs[k]); return n; };
  const money = s => parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;
  const hourNow = new Date().getHours();
  const greet = hourNow < 12 ? "Good morning" : hourNow < 18 ? "Good afternoon" : "Good evening";

  /* =============== HERO — "July, reconciled" =============== */
  const hero = sect("ldg-hero");
  const main = el("div", "ldg-main");
  main.appendChild(el("div", "ldg-kicker", "The Ledger · Period 07 · FY26"));
  main.appendChild(el("div", "ldg-greet", greet + ", " + p.user.name.split(" ")[0] + " — Friday, August 8 · " + p.user.location));
  main.appendChild(el("h2", "ldg-title", "July, reconciled."));
  main.appendChild(el("div", "ldg-lede", p.focus.headline));
  main.appendChild(el("div", "ldg-subl", p.focus.sub));
  const acts = el("div", "ldg-acts");
  const runBtn = el("button", "lb-enter", "▶ Post the variance bridge");
  runBtn.addEventListener("click", () => { if (p.chains && p.chains[0]) { addUserMsg("Run cross-app workflow: " + p.chains[0].name); runChain(p.chains[0]); } });
  const recapBtn = el("button", "hstat primary ldg-recap", "✦ Draft my end-of-week recap");
  recapBtn.addEventListener("click", () => sendMessage("Draft my end-of-week recap"));
  const askBtn = el("button", "lb-play", "Ask about the close");
  askBtn.addEventListener("click", () => sendMessage("Summarize July close status for Priya"));
  acts.append(runBtn, recapBtn, askBtn);
  main.appendChild(acts);
  hero.appendChild(main);

  /* right rail — the clock and the sign-off chain */
  const rail = el("aside", "ldg-rail");
  const cd = el("div", "ldg-count");
  cd.appendChild(el("div", "ldg-count-l", "month-end closes in"));
  const cdV = el("b", "", "–– ––:––:––");
  cd.appendChild(cdV);
  cd.appendChild(el("span", "ldg-count-s", "period 07 hard-close · Tuesday 09:00"));
  rail.appendChild(cd);
  const sg = el("div", "ldg-signers");
  sg.appendChild(el("div", "ldg-rail-h", "sign-off chain"));
  [
    ["Marcus Webb", "variance bridge", true],
    ["James Whitfield", "AWS true-up", true],
    ["Priya Raghavan", "QBR prep · 14:00", false],
  ].forEach(([name, step, done]) => {
    const r = el("div", "ldg-signer" + (done ? " done" : " wait"));
    r.appendChild(el("b", "", name.split(" ").map(x => x[0]).join("")));
    const t = el("span", "ldg-signer-t");
    t.appendChild(el("i", "", name));
    t.appendChild(el("em", "", step));
    r.appendChild(t);
    r.appendChild(el("span", "ldg-tick" + (done ? " ok" : ""), done ? "✓" : "…"));
    sg.appendChild(r);
  });
  rail.appendChild(sg);
  hero.appendChild(rail);

  /* the variance waterfall — Budget bridged to Actual, step by step */
  const wf = el("div", "ldg-wf");
  const wfh = el("div", "ldg-wf-head");
  wfh.appendChild(el("span", "ldg-wf-t", "July opex — budget bridged to actual, by department · $K"));
  const wfsrc = el("span", "ldg-wf-src");
  wfsrc.appendChild(srvGlyph("sap", 15));
  wfsrc.appendChild(srvGlyph("netsuite", 15));
  wfsrc.appendChild(el("span", "", "reconciles ✓"));
  wfh.appendChild(wfsrc);
  wf.appendChild(wfh);
  const wfc = el("div", "ldg-wf-chart");
  wf.appendChild(wfc);
  hero.appendChild(wf);
  makeDraggable(wf, { type: "bars", label: p.bars.title, data: { title: p.bars.title } });

  function waterfall(box) {
    box.textContent = "";
    const cats = p.bars.categories;
    const vals = p.bars.series[0].values;
    const JUL = 10; /* Sep-indexed fiscal months → Jul */
    const budget = p.trend.series[1].points[JUL]; /* 19,900 $K */
    const actual = p.trend.series[0].points[JUL]; /* 21,340 $K */
    const total = actual - budget;                /* +1,440 $K */
    const abbr = { "Engineering": "ENG", "IT": "IT", "Marketing": "MKTG", "Sales": "SALES", "G&A": "G&A", "Product": "PROD", "Cust Success": "CS" };
    const notes = { "Engineering": "AWS true-up", "IT": "Salesforce renewal" };
    /* the two biggest absolute steps get their annotation */
    const bigTwo = vals.map((v, i) => [Math.abs(v), i]).sort((a, b) => b[0] - a[0]).slice(0, 2).map(x => x[1]);

    const w = Math.max(560, box.clientWidth || 920), h = 268;
    const mL = 10, mR = 136, mT = 40, mB = 34;
    const xB = w - mR + 48; /* the closing bracket's spine */
    const cums = [budget];
    vals.forEach(v => cums.push(cums[cums.length - 1] + v));
    const peak = Math.max(...cums), dip = Math.min(...cums);
    const hi = peak + (peak - budget) * 0.10;
    const lo = Math.min(dip, budget) - (peak - budget) * 0.55;
    const Y = v => mT + (1 - (v - lo) / (hi - lo)) * (h - mT - mB);
    const n = cats.length + 2;
    const band = (w - mL - mR) / n;
    const barW = Math.min(58, band * 0.58);
    const bx = i => mL + band * i + (band - barW) / 2;
    const base = h - mB;

    const svg = svgEl("svg", { class: "viz ldg-viz", width: w, height: h, viewBox: "0 0 " + w + " " + h });

    /* budget guideline, carried across the page like a ruled line */
    const gl = svgEl("line", { x1: mL + 2, x2: xB, y1: Y(budget), y2: Y(budget), "stroke-dasharray": "5 4" });
    gl.style.stroke = "var(--ink-3)"; gl.style.opacity = "0.45";
    svg.appendChild(gl);

    const col = (x, catLabel, delay) => {
      const g = svgEl("g");
      svg.appendChild(g);
      const cl = svgEl("text", { x: x + barW / 2, y: base + 16, "text-anchor": "middle", class: "ldg-cat" });
      cl.textContent = catLabel;
      svg.appendChild(cl);
      g.style.opacity = "0"; g.style.transform = "translateY(10px)";
      g.style.transition = "opacity .5s ease " + delay + "ms, transform .55s cubic-bezier(.2,.8,.3,1) " + delay + "ms";
      requestAnimationFrame(() => requestAnimationFrame(() => { g.style.opacity = "1"; g.style.transform = "none"; }));
      return g;
    };

    /* anchors — Budget and Actual, footed on the ledger rule */
    const anchor = (i, v, label, accent) => {
      const x = bx(i), g = col(x, label, i * 70);
      const r = svgEl("rect", { x, y: Y(v), width: barW, height: base - Y(v), rx: 2 });
      r.style.fill = accent ? "var(--acc-soft)" : "var(--soft)";
      r.style.stroke = accent ? "var(--acc-line)" : "var(--hairline)";
      g.appendChild(r);
      const cap = svgEl("line", { x1: x, x2: x + barW, y1: Y(v), y2: Y(v), "stroke-width": 2.5 });
      cap.style.stroke = accent ? "var(--acc)" : "var(--ink-2)";
      g.appendChild(cap);
      const t = svgEl("text", { x: x + barW / 2, y: Y(v) - 8, "text-anchor": "middle", class: "ldg-anchor-v" });
      t.textContent = "$" + (v / 1000).toFixed(2) + "M";
      g.appendChild(t);
      return g;
    };
    anchor(0, budget, "BUDGET", false);

    /* floating steps — each department's over/under */
    vals.forEach((v, i) => {
      const x = bx(i + 1), from = cums[i], to = cums[i + 1];
      const g = col(x, (abbr[cats[i]] || cats[i]).toUpperCase(), (i + 1) * 70);
      const top = Y(Math.max(from, to)), bh = Math.max(3, Math.abs(Y(from) - Y(to)));
      const r = svgEl("rect", { x, y: top, width: barW, height: bh, rx: 2 });
      r.style.fill = v >= 0 ? "var(--bad-ink)" : "var(--good-ink)";
      r.style.opacity = bigTwo.includes(i) ? "0.92" : "0.72";
      g.appendChild(r);
      const t = svgEl("text", { x: x + barW / 2, y: v >= 0 ? top - 7 : top + bh + 15, "text-anchor": "middle", class: "ldg-step-v" });
      t.textContent = (v >= 0 ? "+$" : "−$") + Math.abs(v) + "K";
      t.style.fill = v >= 0 ? "var(--bad-ink)" : "var(--good-ink)";
      g.appendChild(t);
      if (notes[cats[i]] && bigTwo.includes(i)) {
        const a = svgEl("text", { x: x + barW / 2, y: top - 20, "text-anchor": "middle", class: "ldg-note-v" });
        a.textContent = notes[cats[i]];
        g.appendChild(a);
      }
      /* connector from the previous column at the new running level */
      const c = svgEl("line", { x1: bx(i) + barW, x2: x, y1: Y(from), y2: Y(from), "stroke-dasharray": "2 3" });
      c.style.stroke = "var(--ink-3)"; c.style.opacity = "0.55";
      g.appendChild(c);
    });

    /* connector into Actual, then the Actual anchor */
    const cLast = svgEl("line", { x1: bx(n - 2) + barW, x2: bx(n - 1), y1: Y(actual), y2: Y(actual), "stroke-dasharray": "2 3" });
    cLast.style.stroke = "var(--ink-3)"; cLast.style.opacity = "0.55";
    svg.appendChild(cLast);
    anchor(n - 1, actual, "ACTUAL", true);

    /* the closing figure — bracket from budget to actual */
    const brk = svgEl("g");
    [[xB, xB, Y(actual), Y(budget)], [xB - 5, xB, Y(actual), Y(actual)], [xB - 5, xB, Y(budget), Y(budget)]].forEach(([x1, x2, y1, y2]) => {
      const ln = svgEl("line", { x1, x2, y1, y2, "stroke-width": 1.5 });
      ln.style.stroke = "var(--bad-ink)";
      brk.appendChild(ln);
    });
    const bl = svgEl("text", { x: xB + 8, y: (Y(actual) + Y(budget)) / 2 - 2, class: "ldg-total-fig" });
    bl.textContent = "+$" + total.toLocaleString("en-US") + "K";
    brk.appendChild(bl);
    const bp = svgEl("text", { x: xB + 8, y: (Y(actual) + Y(budget)) / 2 + 12, class: "ldg-total-pct" });
    bp.textContent = "+" + (total / budget * 100).toFixed(1) + "% vs budget";
    brk.appendChild(bp);
    brk.style.opacity = "0";
    brk.style.transition = "opacity .6s ease " + (n * 70 + 250) + "ms";
    requestAnimationFrame(() => requestAnimationFrame(() => { brk.style.opacity = "1"; }));
    svg.appendChild(brk);

    /* the ledger rule — a hairline double rule under the figures */
    [0, 3].forEach(dy => {
      const ln = svgEl("line", { x1: mL, x2: xB, y1: base + 0.5 + dy, y2: base + 0.5 + dy });
      ln.style.stroke = "var(--ink-3)"; ln.style.opacity = "0.6";
      svg.appendChild(ln);
    });

    box.appendChild(svg);
  }
  registerChart(wfc, () => waterfall(wfc));

  /* =============== the naked stat strip =============== */
  const strip = sect("st-strip ldg-strip");
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

  /* =============== 01 · Reconcile =============== */
  if (p.joined) {
    const s1 = sect("joined-card ldg-join");
    stHead(s1, "01", "Reconcile", p.joined.subtitle);
    const body = el("div", "joined-body");
    const ch = el("div", "joined-chart");
    const aside = el("aside", "joined-aside");
    aside.appendChild(buildInsight(p.joined.insight));
    body.append(ch, aside);
    s1.appendChild(body);
    registerChart(ch, () => renderJoined(ch, p.joined));
  }

  /* =============== 02 · Move money =============== */
  const s2 = sect("ldg-move");
  stHead(s2, "02", "Move money", "post the work — cross-app entries, and delegations that run in the background");
  const grid2 = el("div", "ldg-2col");
  const chnCol = el("div", "chn-card ldg-col");
  chnCol.appendChild(el("div", "ldg-colhead", "Cross-app workflows"));
  (p.chains || []).forEach(c => {
    const it = el("div", "chn-item ldg-entry");
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
  const dgCol = el("div", "dg-card ldg-col");
  dgCol.appendChild(el("div", "ldg-colhead", "Delegated to askMElah"));
  (p.delegations || []).forEach(d => {
    const doneAlready = (state.delegated[state.personaId] || {})[d.id];
    const it = el("div", "dg-item ldg-entry");
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

  /* =============== 03 · Sign — approvals as ledger lines =============== */
  const s3 = sect("ap-card ldg-sign");
  const h3 = stHead(s3, "03", "Sign", "each line pre-read by askMElah — stamp it, or send it back with questions");
  const auto = el("button", "autopilot" + (state.autopilot[state.personaId] ? " on" : ""));
  auto.title = "When on, askMElah auto-clears low-risk approvals within policy";
  auto.append(el("span", "", "Autopilot"), el("span", "sw"));
  h3.appendChild(auto);

  const ledger = el("div", "ldg-lines");
  const lh = el("div", "ldg-lhead");
  ["", "item", "requested by", "amount", ""].forEach(t => lh.appendChild(el("span", "", t)));
  ledger.appendChild(lh);

  const totalVal = el("b", "ldg-total-v");
  const totalCnt = el("span", "ldg-total-c");
  function refreshTotal() {
    const pend = FOW.pendingApprovals();
    const sum = pend.reduce((a, x) => a + money(x.amount), 0);
    totalVal.textContent = "$" + sum.toLocaleString("en-US");
    totalCnt.textContent = pend.length
      ? pend.length + " line" + (pend.length > 1 ? "s" : "") + " open"
      : "all lines signed";
  }
  function stamp(cell) { cell.appendChild(el("span", "ldg-stamp", "APPROVED")); }

  p.approvals.forEach(a => {
    const done = (state.approved[state.personaId] || new Set()).has(a.id);
    const row = el("div", "ldg-line" + (done ? " done" : ""));
    row.dataset.approval = a.id;
    row.appendChild(el("span", "ap-urg " + a.urgency));
    const item = el("div", "ldg-li");
    const t1 = el("div", "ldg-li-t");
    t1.appendChild(el("span", "ldg-type", a.type));
    t1.appendChild(el("span", "ldg-li-title", a.title));
    item.appendChild(t1);
    item.appendChild(el("div", "ldg-li-meta", a.meta));
    row.appendChild(item);
    const req = el("div", "ldg-req");
    req.appendChild(el("b", "", a.requester));
    req.appendChild(el("span", "", SERVERS[a.source] ? "via " + SERVERS[a.source].name : ""));
    row.appendChild(req);
    row.appendChild(el("span", "ldg-amt", a.amount || "—"));
    const actCell = el("span", "ldg-act");
    if (done) stamp(actCell);
    else {
      const btns = el("span", "ap-acts ldg-btns");
      const ok = el("button", "ldg-ok", "✓ Approve");
      ok.addEventListener("click", e => {
        e.stopPropagation();
        sparkleAt(e.clientX, e.clientY, { n: 10, d: 34 });
        stamp(actCell);
        FOW.approve(a.id, true);
        toast("Approved — " + a.requester + " notified");
        refreshTotal();
      });
      const ask = el("button", "ldg-ask", "?");
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
    ledger.appendChild(row);
  });
  const totalRow = el("div", "ldg-total");
  totalRow.appendChild(el("span", "ldg-total-l", "Total awaiting signature"));
  totalRow.appendChild(totalCnt);
  totalRow.appendChild(totalVal);
  ledger.appendChild(totalRow);
  refreshTotal();
  s3.appendChild(ledger);

  auto.addEventListener("click", () => {
    const on = !state.autopilot[state.personaId];
    state.autopilot[state.personaId] = on;
    auto.classList.toggle("on", on);
    if (!on) { toast("Autopilot off — every line waits for your signature again", "info"); return; }
    const low = FOW.pendingApprovals().filter(a => a.urgency === "low");
    if (!low.length) { toast("Autopilot on — nothing low-risk on the ledger right now", "info"); return; }
    low.forEach((a, i) => setTimeout(() => {
      const row = $('[data-approval="' + a.id + '"]');
      if (row) { const cell = $(".ldg-act", row); if (cell) stamp(cell); }
      FOW.approve(a.id, i === low.length - 1);
      refreshTotal();
      if (i === low.length - 1) toast("Autopilot signed " + low.length + " low-risk line" + (low.length > 1 ? "s" : "") + " — requesters notified");
    }, 700 + i * 450));
    toast("Autopilot clearing " + low.length + " low-risk line" + (low.length > 1 ? "s" : ""), "info");
  });

  /* =============== 04 · Close =============== */
  const s4 = sect("wk-card ldg-closebook");
  stHead(s4, "04", "Close", "what the week cost, and what's still open before the books shut");
  const grid4 = el("div", "ldg-2col");
  const wkCol = el("div", "ldg-col");
  wkCol.appendChild(el("div", "ldg-colhead", "The week in numbers"));
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
    wkCol.appendChild(el("div", "ldg-memo", "memo — " + wk.insight));
  }
  grid4.appendChild(wkCol);
  const tCol = el("div", "ldg-col");
  tCol.appendChild(el("div", "ldg-colhead", "Close checklist — open items"));
  p.tasks.forEach(t => {
    const it = el("div", "task-item ldg-task");
    it.appendChild(el("span", "task-key", t.id));
    it.appendChild(el("span", "task-title", t.title));
    it.appendChild(el("span", "ldg-due", t.due));
    it.appendChild(el("span", "task-status " + t.status, t.status === "inprogress" ? "in progress" : t.status));
    makeDraggable(it, { type: "task", label: t.id + " " + t.title, data: t });
    tCol.appendChild(it);
  });
  grid4.appendChild(tCol);
  s4.appendChild(grid4);

  /* =============== carried forward — wired into =============== */
  const foot = sect("ldg-wired");
  const fr = el("div", "ldg-wired-row");
  fr.appendChild(el("span", "ldg-wired-l", "wired into"));
  (p.connections || []).forEach(cid => fr.appendChild(srvGlyph(cid, 26)));
  const more = el("button", "rail-more ldg-mcp", "MCP console →");
  more.addEventListener("click", () => mcpOpen());
  fr.appendChild(more);
  foot.appendChild(fr);
  foot.appendChild(el("div", "ldg-eoe", "Period 07 · FY26 — bridge reconciles to +$1,440K · E&OE"));

  /* =============== the live clock =============== */
  const tick = () => {
    if (!document.contains(cdV)) { clearInterval(STUDIO.timer); return; }
    const now = new Date();
    const t = new Date(now);
    t.setDate(now.getDate() + ((2 - now.getDay()) + 7) % 7);
    t.setHours(9, 0, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 7);
    const diff = t - now;
    const dd = Math.floor(diff / 864e5);
    const hh = Math.floor((diff % 864e5) / 36e5);
    const mm = Math.floor((diff % 36e5) / 6e4);
    const ss = Math.floor((diff % 6e4) / 1000);
    const P = x => String(x).padStart(2, "0");
    cdV.textContent = (dd ? dd + "d " : "") + P(hh) + ":" + P(mm) + ":" + P(ss);
  };
  tick();
  STUDIO.timer = setInterval(tick, 1000);
}
