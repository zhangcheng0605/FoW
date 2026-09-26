/* ============================================================
   FoW · Emmi — the ZAC Studios M, alive
   The folded-ribbon logo morphed into a corner companion:
   it breathes, blinks, tracks your cursor, hops, celebrates
   your wins, gets sleepy in dark mode, and welcomes you back
   from leave (with the SAP receipt to prove it).
   ============================================================ */
"use strict";

const PET = { el: null, pupils: [], bubbleTimer: null, quipIdx: 0, lastHop: 0 };

/* per-persona leave notes — "pulled" from SAP on sign-in */
const PET_LEAVE = {
  sales:  { kind: "back", line: "Welcome back, Jonas! 🌴 Leave Aug 3–7 closed out in SAP — I kept your pipeline warm while you were gone.", call: "sap.get_absences(me) ✓ 3 records" },
  legal:  { kind: "soon", line: "Sofia, SAP says you haven't taken leave since March. Q4 is long — shall I find a quiet week? 🏝", call: "sap.get_leave_balance(me) ✓ 14.0 days" },
  hr:     { kind: "bal",  line: "12 leave days left this year, Maya — and SAP says your team's averaging only 6. Lead by example? 😌", call: "sap.get_leave_balance(me) ✓ 12.0 days" },
  it:     { kind: "bal",  line: "9 leave days left, Marcus. The on-call rota is green next week — SAP and I both think it's a sign. 🏖", call: "sap.get_leave_balance(me) ✓ 9.0 days" },
  finance:{ kind: "soon", line: "Daniel — month-end closes Tuesday, and SAP says you have 11 leave days left. Wednesday looks lovely. ✈️", call: "sap.get_leave_balance(me) ✓ 11.0 days" },
  procurement: { kind: "bal", line: "10.5 leave days in the bank, Priya — after the AWS EA signs, take a bow (and a break). 🌺", call: "sap.get_leave_balance(me) ✓ 10.5 days" },
  marketing:   { kind: "bal", line: "Chloe, 8 leave days left — and the content calendar has a quiet patch after National Day. Just saying. 🎨", call: "sap.get_leave_balance(me) ✓ 8.0 days" },
};

const PET_QUIPS = [
  p => "Psst — " + FOW.pendingApprovals().length + " approvals are waiting. Clear them and I'll do a backflip. 🤸",
  p => { const m = p.meetings[0]; return "Your " + m.time + " — **" + m.title + "** — is the one to be sharp for today."; },
  p => "Drag any card into the chat, lah. askZAC loves homework.",
  p => "You've been scrolling a while — 20-20-20 rule: look at something 20 feet away for 20 seconds. 👀",
  p => "Hydration check! Last coffee doesn't count. 💧",
  p => "Try ⌘K and type three letters of anything. It's faster than you think.",
  p => "Fun fact: my body is the ZAC Studios logo. My soul is pure corporate enthusiasm.",
  p => { const t = p.tasks.find(x => x.status === "blocked"); return t ? "`" + t.id + "` is still blocked — want askZAC to chase it?" : "Nothing's blocked right now. Savour it. ✨"; },
];

function petBuild() {
  const pet = el("div");
  pet.id = "pet";
  pet.title = "Emmi — your workspace buddy";
  pet.innerHTML =
    '<svg viewBox="0 0 100 78" aria-label="Emmi">' +
    '<g id="petBody">' +
    /* feet */
    '<ellipse cx="17" cy="60" rx="8" ry="3.4" fill="#5f2d91"/>' +
    '<ellipse cx="83" cy="60" rx="8" ry="3.4" fill="#1b75bc"/>' +
    /* the Z (same facets as the brand mark) */
    '<polygon points="14,8 86,8 86,19 14,19" fill="#5b5bd6"/><polygon points="70,19 86,19 30,45 14,45" fill="#9333ea"/><polygon points="14,45 86,45 86,56 14,56" fill="#0e9bb5"/>' +
    /* cheeks */
    '<circle cx="20" cy="14" r="2.4" fill="#ff9ec4" opacity="0.55"/>' +
    '<circle cx="80" cy="14" r="2.4" fill="#7fd8e8" opacity="0.5"/>' +
    /* eyes on the two peaks */
    '<g class="pet-eye"><ellipse cx="36" cy="13.5" rx="5" ry="5.2" fill="#fff"/><circle class="pet-pupil" cx="37" cy="14" r="2.4" fill="#1b2540"/></g>' +
    '<g class="pet-eye"><ellipse cx="64" cy="13.5" rx="5" ry="5.2" fill="#fff"/><circle class="pet-pupil" cx="65" cy="14" r="2.4" fill="#1b2540"/></g>' +
    /* sleepy lids (shown in dark mode) */
    '<rect class="pet-lid" x="30" y="8" width="12" height="0" rx="3" fill="#5f2d91"/>' +
    '<rect class="pet-lid" x="58" y="8" width="12" height="0" rx="3" fill="#1b75bc"/>' +
    '<text class="pet-zzz" x="88" y="14" font-size="9" fill="#8a93a8" opacity="0">z</text>' +
    '</g></svg>' +
    '<div class="pet-bubble" id="petBubble" hidden><div class="pb-text" id="petText"></div><div class="pb-call mono" id="petCall" hidden></div></div>';
  document.body.appendChild(pet);
  PET.el = pet;
  PET.pupils = $$(".pet-pupil", pet);

  /* cursor tracking (rAF-throttled) */
  let mx = innerWidth / 2, my = innerHeight / 2, raf = null;
  document.addEventListener("mousemove", e => {
    mx = e.clientX; my = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => {
      raf = null;
      const r = pet.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height * 0.3;
      const a = Math.atan2(my - cy, mx - cx);
      const d = Math.min(2.6, Math.hypot(mx - cx, my - cy) / 90);
      PET.pupils.forEach(pp => { pp.style.transform = `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`; });
    });
  });

  /* blink loop */
  (function blink() {
    setTimeout(() => {
      pet.classList.add("blink");
      setTimeout(() => pet.classList.remove("blink"), 160);
      blink();
    }, 2800 + Math.random() * 3200);
  })();

  /* occasional idle hop */
  (function idleHop() {
    setTimeout(() => {
      if (!document.hidden && !THEME.dark) petHop();
      idleHop();
    }, 24000 + Math.random() * 26000);
  })();

  pet.addEventListener("click", () => {
    const p = FOW.data();
    if (!p) return;
    petHop();
    const quip = PET_QUIPS[PET.quipIdx++ % PET_QUIPS.length](p);
    petSay(quip);
  });
}

function petHop() {
  if (!PET.el) return;
  PET.el.classList.remove("hop");
  void PET.el.offsetWidth;
  PET.el.classList.add("hop");
}
function petSay(text, call, ms) {
  if (!PET.el) return;
  const bubble = $("#petBubble"), txt = $("#petText"), c = $("#petCall");
  txt.textContent = "";
  /* tiny inline bold support for **…** */
  String(text).split(/(\*\*[^*]+\*\*)/g).forEach(part => {
    if (part.startsWith("**") && part.endsWith("**")) txt.appendChild(el("b", "", part.slice(2, -2)));
    else if (part) txt.appendChild(document.createTextNode(part));
  });
  if (call) { c.hidden = false; c.textContent = call; } else c.hidden = true;
  bubble.hidden = false;
  bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop");
  clearTimeout(PET.bubbleTimer);
  PET.bubbleTimer = setTimeout(() => { bubble.hidden = true; }, ms || 7000);
}
function petHearts() {
  if (!PET.el) return;
  for (let i = 0; i < 3; i++) {
    const h = el("span", "pet-heart", ["💛", "✨", "💚"][i]);
    h.style.left = (18 + i * 20) + "px";
    h.style.animationDelay = (i * 120) + "ms";
    PET.el.appendChild(h);
    setTimeout(() => h.remove(), 1400 + i * 120);
  }
}
function petReact(kind) {
  if (!PET.el) return;
  if (kind === "approve") { petHop(); petHearts(); }
  else if (kind === "delegate") { petHop(); petSay("askZAC finished a job for you. We make a good team. 🎉", null, 5000); }
  else if (kind === "recap") { petHop(); petSay("Week recap, one click. Friday-you thanks Monday-you. 👏", null, 5000); }
  else if (kind === "tired") { petSay("Running low? Protect a break — I'll guard the calendar. ☕", null, 6000); }
  else if (kind === "sleep") { PET.el.classList.add("sleepy"); petSay("Night shift mode. I'll keep one eye open… barely. 🌙", null, 4500); }
  else if (kind === "wake") { PET.el.classList.remove("sleepy"); }
}
function petWelcome(personaId) {
  const info = PET_LEAVE[personaId];
  if (!info) return;
  setTimeout(() => { petHop(); petSay(info.line, info.call, 9500); }, 2600);
}
