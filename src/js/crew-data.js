/* the Crew — identities, voices, and how they work together */
var CREW_META = {
  agents: {
    hr: {
      name: "Mei",
      vibe: "warm & unhurried",
      idle: "bob",
      hello: "On it, dear — leave it with me ah.",
      done: "All settled, no drama:",
      motto: "People first, paperwork second — but both done."
    },
    finance: {
      name: "Tally",
      vibe: "precise, dry wit",
      idle: "tick",
      hello: "Numbers don't lie. Give me a minute.",
      done: "Reconciled to the cent:",
      motto: "Every cent accounted for. Yes, that one too."
    },
    procurement: {
      name: "Hawk",
      vibe: "always scanning",
      idle: "scan",
      hello: "Eyes on it. Nothing slips past me.",
      done: "Spotted, priced, sorted:",
      motto: "Vendors behave when they know Hawk is watching."
    },
    it: {
      name: "Patch",
      vibe: "twitchy, caffeinated",
      idle: "jitter",
      hello: "Okok on it — already halfway done lah!",
      done: "Fixed. Also fixed two other things:",
      motto: "Have you tried letting me handle it?"
    },
    legal: {
      name: "Clause",
      vibe: "formal, exact",
      idle: "bow",
      hello: "Duly noted. I shall review the terms.",
      done: "Reviewed and executed, per policy:",
      motto: "Read the fine print, so you never have to."
    },
    sales: {
      name: "Bolt",
      vibe: "high energy",
      idle: "bounce",
      hello: "Let's go, let's go — deal incoming!",
      done: "Boom, another one closed:",
      motto: "Always be closing. Politely. But always."
    },
    marketing: {
      name: "Neon",
      vibe: "playful, artistic",
      idle: "spin",
      hello: "Ooh fun one — gimme a sec, inspiration loading!",
      done: "Ta-da, fresh off the canvas:",
      motto: "Make it pop, make it land, make it Mediacorp."
    }
  },
  domain: {
    sap: "finance",
    netsuite: "finance",
    excel: "finance",
    servicenow: "it",
    jira: "it",
    github: "it",
    workday: "hr",
    greenhouse: "hr",
    docusign: "legal",
    confluence: "legal",
    ariba: "procurement",
    salesforce: "sales",
    gcal: "sales",
    gmail: "sales",
    monday: "marketing",
    higgsfield: "marketing",
    adobe: "marketing",
    cna: "marketing",
    outlook: null,
    teams: null,
    sharepoint: null,
    gdrive: null,
    slack: null,
    zoom: null
  },
  ambient: [
    { from: "finance", to: "procurement", payload: "PO-77812 · $214,380", line: "Tally → Hawk: Dell invoice matched to PO-77812" },
    { from: "procurement", to: "finance", payload: "$8,790 overcharge", line: "Hawk → Tally: Dell overcharge proven, credit due Aug 15" },
    { from: "it", to: "procurement", payload: "REQ0048213", line: "Patch → Hawk: hardware order REQ0048213 beats the cutoff" },
    { from: "hr", to: "it", payload: "WD-PH-20260914 · 12", line: "Mei → Patch: 12 new starts need day-one access" },
    { from: "legal", to: "sales", payload: "ENV-88214 · $290,000", line: "Clause → Bolt: ENV-88214 fully executed at 07:12" },
    { from: "sales", to: "finance", payload: "OPP-4738 Closed Won", line: "Bolt → Tally: OPP-4738 booked, Q3 attainment 52.5%" },
    { from: "marketing", to: "sales", payload: "8.6M reach · 96%", line: "Neon → Bolt: EPL reach 8.6M, 96% of target" },
    { from: "marketing", to: "finance", payload: "S$26K top-up", line: "Neon → Tally: recommend S$26K top-up, not S$48K" },
    { from: "procurement", to: "legal", payload: "SOW S$126,500", line: "Hawk → Clause: Wunderfolk SOW slipped, remedy clause please" },
    { from: "legal", to: "procurement", payload: "DS-5203 · PO-78240", line: "Clause → Hawk: envelope DS-5203 signed, PO-78240 cleared" },
    { from: "hr", to: "legal", payload: "ENV-58217", line: "Mei → Clause: offer ENV-58217 expires Monday 18:00" },
    { from: "finance", to: "it", payload: "CC 4210 · +$862K", line: "Tally → Patch: AWS true-up $862K needs bridge note" }
  ],
  banter: [
    { who: "it", say: "Run #413 queued. I'm bored already." },
    { who: "finance", say: "Off by one cent. Unacceptable." },
    { who: "procurement", say: "Three vendors renewing. Watching all three." },
    { who: "marketing", say: "Batch #1293 still slaps, honestly." },
    { who: "sales", say: "52.5% attainment and it's only August!" },
    { who: "legal", say: "Per my previous bubble." },
    { who: "hr", say: "Twelve new joiners, twelve buddy matches." },
    { who: "it", say: "214 endpoints patched. You're welcome." }
  ]
};
