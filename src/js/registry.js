/* ============================================================
   FoW · registry — MCP server catalog, personas, icons, utils
   ============================================================ */
"use strict";

const SERVERS = {
  outlook:    { name: "Outlook",         color: "#2f7de1", glyph: "O",  tools: ["search_messages", "send_message", "get_calendar", "create_event"] },
  teams:      { name: "Microsoft Teams", color: "#7b83eb", glyph: "T",  tools: ["list_channels", "post_message", "get_meeting_notes", "schedule_meeting"] },
  sharepoint: { name: "SharePoint",      color: "#038387", glyph: "S",  tools: ["search_sites", "get_document", "list_updates"] },
  excel:      { name: "Excel",           color: "#1d824f", glyph: "X",  tools: ["read_workbook", "run_query", "refresh_model"] },
  gmail:      { name: "Gmail",           color: "#ea4335", glyph: "G",  tools: ["search_threads", "create_draft", "get_message"] },
  gcal:       { name: "Google Calendar", color: "#4285f4", glyph: "C",  tools: ["list_events", "find_slot", "create_event"] },
  gdrive:     { name: "Google Drive",    color: "#34a853", glyph: "D",  tools: ["search_files", "get_file", "share_file"] },
  slack:      { name: "Slack",           color: "#e01e5a", glyph: "#",  tools: ["search_messages", "post_message", "channel_summary"] },
  jira:       { name: "Jira",            color: "#2684ff", glyph: "J",  tools: ["search_issues", "create_issue", "transition_issue", "get_sprint"] },
  confluence: { name: "Confluence",      color: "#0052cc", glyph: "C",  tools: ["search_pages", "get_page", "create_page"] },
  salesforce: { name: "Salesforce",      color: "#00a1e0", glyph: "SF", tools: ["query_pipeline", "get_account", "update_opportunity", "log_activity"] },
  workday:    { name: "Workday",         color: "#f68d2e", glyph: "W",  tools: ["get_worker", "list_requests", "approve_request", "run_report"] },
  servicenow: { name: "ServiceNow",      color: "#63d297", glyph: "N",  tools: ["search_incidents", "create_ticket", "update_incident", "get_cmdb"] },
  ariba:      { name: "SAP Ariba",       color: "#f29111", glyph: "A",  tools: ["search_pos", "vendor_scorecard", "create_requisition"] },
  sap:        { name: "SAP S/4HANA",     color: "#3496d8", glyph: "SP", tools: ["get_cost_centers", "run_variance_report", "post_journal"] },
  netsuite:   { name: "NetSuite",        color: "#4e9fbf", glyph: "NS", tools: ["run_saved_search", "get_budget", "list_transactions"] },
  docusign:   { name: "DocuSign",        color: "#ffc820", glyph: "DS", tools: ["list_envelopes", "get_status", "send_envelope"] },
  github:     { name: "GitHub",          color: "#8b949e", glyph: "GH", tools: ["list_prs", "get_actions_status", "search_code"] },
  zoom:       { name: "Zoom",            color: "#2d8cff", glyph: "Z",  tools: ["list_recordings", "get_transcript", "schedule_meeting"] },
  greenhouse: { name: "Greenhouse",      color: "#3ab549", glyph: "GR", tools: ["list_candidates", "pipeline_report", "schedule_interview"] },
};

const PERSONAS = [
  { id: "hr",          name: "Maya Chen",       role: "HR Business Partner",   dept: "People & Culture", tag: "People, engagement & talent",    accent: "#d6336c", initials: "MC", loc: "Singapore" },
  { id: "finance",     name: "Daniel Okafor",   role: "FP&A Manager",          dept: "Finance",          tag: "Plan, spend & forecast",         accent: "#0e9f6e", initials: "DO", loc: "London" },
  { id: "procurement", name: "Priya Nair",      role: "Procurement Lead",      dept: "Procurement",      tag: "Vendors, POs & savings",         accent: "#d97706", initials: "PN", loc: "Austin" },
  { id: "it",          name: "Marcus Webb",     role: "IT Operations Manager", dept: "IT",               tag: "Incidents, uptime & access",     accent: "#0891b2", initials: "MW", loc: "Singapore" },
  { id: "legal",       name: "Sofia Reyes",     role: "Senior Legal Counsel",  dept: "Legal",            tag: "Contracts, matters & risk",      accent: "#7c3aed", initials: "SR", loc: "New York" },
  { id: "sales",       name: "Jonas Lindqvist", role: "Enterprise Sales Mgr",  dept: "Sales",            tag: "Pipeline, quota & accounts",     accent: "#2563eb", initials: "JL", loc: "Stockholm" },
];

/* Mediacorp mark — folded-ribbon M, approximated inline (POC) */
const LOGO_M =
  '<svg viewBox="0 0 100 64" aria-label="Mediacorp">' +
  '<defs>' +
  '<linearGradient id="mcg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ec008c"/><stop offset="1" stop-color="#5f2d91"/></linearGradient>' +
  '<linearGradient id="mcg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9a11b"/><stop offset="1" stop-color="#e63b23"/></linearGradient>' +
  '<linearGradient id="mcg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8dc63f"/><stop offset="1" stop-color="#00854a"/></linearGradient>' +
  '<linearGradient id="mcg4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fc0c4"/><stop offset="1" stop-color="#1b75bc"/></linearGradient>' +
  '</defs>' +
  '<polygon points="10,58 24,10 36,10 22,58" fill="url(#mcg1)"/>' +
  '<polygon points="24,10 36,10 56,42 44,42" fill="url(#mcg2)"/>' +
  '<polygon points="44,42 64,10 76,10 56,42" fill="url(#mcg3)"/>' +
  '<polygon points="64,10 76,10 90,58 78,58" fill="url(#mcg4)"/>' +
  '</svg>';

/* askMElah mark — gradient ME chat tile, enhanced from the supplied logo */
const LOGO_ASKME =
  '<svg viewBox="0 0 48 48" aria-label="askMElah">' +
  '<defs>' +
  '<linearGradient id="amg" x1="0.15" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#8b30c9"/><stop offset="0.55" stop-color="#c9247f"/><stop offset="1" stop-color="#ee2278"/></linearGradient>' +
  '<linearGradient id="amh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.32"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/></linearGradient>' +
  '</defs>' +
  '<path d="M9 42.5 5.2 47l10-2.6Z" fill="#ee2278"/>' +
  '<rect x="3.5" y="3.5" width="41" height="41" rx="12.5" fill="url(#amg)"/>' +
  '<rect x="3.5" y="3.5" width="41" height="20.5" rx="12.5" fill="url(#amh)"/>' +
  '<text x="24" y="31" text-anchor="middle" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-weight="800" font-size="17.5" fill="#ffffff" letter-spacing="-0.5">ME</text>' +
  '</svg>';
function askmeAv(sz) {
  const s = el("span", "askme-av");
  s.innerHTML = LOGO_ASKME;
  if (sz) { s.style.width = sz + "px"; s.style.height = sz + "px"; }
  return s;
}

/* live MCP call log — seeded per persona, appended by real tool runs */
const MCPLOG = [];
function mcpLog(server, tool, ms) {
  MCPLOG.unshift({ server, tool, ms: ms || 400, t: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) });
  if (MCPLOG.length > 30) MCPLOG.pop();
}

/* theme + chart tokens — both palettes CVD-validated on their surfaces */
const THEME = { dark: false };
const VIZ_LIGHT = {
  surface: "#ffffff",
  series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"],
  neg: "#e34948",
  grid: "#eef0f4", zero: "#d3d8e2", cross: "rgba(27,37,64,0.3)",
  sparkDim: "#a9bbd6", sparkEnd: "#2a78d6", ink: "#1b2540",
  /* sequential blue, low -> high = light -> dark on a light surface */
  heat: [[236, 244, 253], [196, 219, 247], [158, 197, 244], [109, 167, 236], [57, 135, 229], [28, 92, 171], [13, 54, 107]],
};
const VIZ_DARK = {
  surface: "#10141f",
  series: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"],
  neg: "#e66767",
  grid: "rgba(255,255,255,0.055)", zero: "rgba(255,255,255,0.14)", cross: "rgba(255,255,255,0.22)",
  sparkDim: "#3e577e", sparkEnd: "#3987e5", ink: "#eef2fa",
  /* on a dark surface the ramp inverts: low -> high = dim -> bright */
  heat: [[16, 27, 48], [16, 60, 112], [28, 92, 171], [57, 135, 229], [134, 182, 239], [205, 226, 251]],
};
function VIZ() { return THEME.dark ? VIZ_DARK : VIZ_LIGHT; }
const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

/* tiny inline icon set (stroke = currentColor) */
const ICONS = {
  spark:    '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M8 1.5 9.6 6l4.5 1.6L9.6 9.6 8 14 6.4 9.6 1.9 7.6 6.4 6Z" fill="currentColor"/></svg>',
  chart:    '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M2 13.5h12M3.5 10.5 6.5 7l2.5 2 3.5-4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  donut:    '<svg viewBox="0 0 16 16" width="13" height="13"><circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" stroke-width="2.4" opacity=".35"/><path d="M8 2.8a5.2 5.2 0 0 1 5.2 5.2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  bars:     '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M3 13V8.5M8 13V3.5M13 13V6.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  heat:     '<svg viewBox="0 0 16 16" width="13" height="13"><rect x="2" y="2" width="5.2" height="5.2" rx="1.4" fill="currentColor" opacity=".9"/><rect x="8.8" y="2" width="5.2" height="5.2" rx="1.4" fill="currentColor" opacity=".4"/><rect x="2" y="8.8" width="5.2" height="5.2" rx="1.4" fill="currentColor" opacity=".55"/><rect x="8.8" y="8.8" width="5.2" height="5.2" rx="1.4" fill="currentColor" opacity=".75"/></svg>',
  goal:     '<svg viewBox="0 0 16 16" width="13" height="13"><circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg>',
  cal:      '<svg viewBox="0 0 16 16" width="13" height="13"><rect x="2" y="3" width="12" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 6.5h12M5.5 1.8v2.4M10.5 1.8v2.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  mail:     '<svg viewBox="0 0 16 16" width="13" height="13"><rect x="1.8" y="3.2" width="12.4" height="9.6" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m2.5 4.5 5.5 4.4 5.5-4.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  check:    '<svg viewBox="0 0 16 16" width="13" height="13"><path d="m2.8 8.4 3.3 3.4 7-7.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x:        '<svg viewBox="0 0 16 16" width="12" height="12"><path d="m3.5 3.5 9 9m0-9-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  task:     '<svg viewBox="0 0 16 16" width="13" height="13"><rect x="2.2" y="2.2" width="11.6" height="11.6" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m5.2 8.2 2 2.1 3.8-4.3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bolt:     '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M8.8 1.6 3.2 9h3.6l-.9 5.4L11.6 7H8Z" fill="currentColor"/></svg>',
  plug:     '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M5.5 2v3.4M10.5 2v3.4M4 5.4h8v2.2a4 4 0 0 1-8 0Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 11.6V14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  ask:      '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M8 1.5 9.6 6l4.5 1.6L9.6 9.6 8 14 6.4 9.6 1.9 7.6 6.4 6Z" fill="currentColor"/></svg>',
  table:    '<svg viewBox="0 0 16 16" width="13" height="13"><rect x="2" y="2.5" width="12" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2 6h12M2 9.7h12M6.4 6v7.5" stroke="currentColor" stroke-width="1.4"/></svg>',
  grip:     '<svg viewBox="0 0 16 16" width="12" height="12"><circle cx="5.5" cy="4" r="1.2" fill="currentColor"/><circle cx="10.5" cy="4" r="1.2" fill="currentColor"/><circle cx="5.5" cy="8" r="1.2" fill="currentColor"/><circle cx="10.5" cy="8" r="1.2" fill="currentColor"/><circle cx="5.5" cy="12" r="1.2" fill="currentColor"/><circle cx="10.5" cy="12" r="1.2" fill="currentColor"/></svg>',
  clockIco: '<svg viewBox="0 0 16 16" width="13" height="13"><circle cx="8" cy="8" r="5.8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.8V8l2.3 1.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  person:   '<svg viewBox="0 0 16 16" width="13" height="13"><circle cx="8" cy="5.2" r="2.7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.8 13.6a5.4 5.4 0 0 1 10.4 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  file:     '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M4 1.8h5.2L12.8 5.4V14a.8.8 0 0 1-.8.8H4a.8.8 0 0 1-.8-.8V2.6a.8.8 0 0 1 .8-.8Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 2v3.6h3.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  sun:      '<svg viewBox="0 0 16 16" width="15" height="15"><circle cx="8" cy="8" r="3.1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.4v1.8M8 12.8v1.8M1.4 8h1.8M12.8 8h1.8M3.3 3.3l1.3 1.3M11.4 11.4l1.3 1.3M12.7 3.3l-1.3 1.3M4.6 11.4l-1.3 1.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  moon:     '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M13.4 9.6A5.8 5.8 0 0 1 6.4 2.6a5.8 5.8 0 1 0 7 7Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  robot:    '<svg viewBox="0 0 16 16" width="13" height="13"><rect x="2.6" y="5" width="10.8" height="8" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 5V2.6M6.6 2.6h2.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="5.8" cy="8.6" r="1" fill="currentColor"/><circle cx="10.2" cy="8.6" r="1" fill="currentColor"/><path d="M6 11h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
};

/* ---------- DOM helpers ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function svgNode(tag, attrs) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}
/* icon/glyph injection — trusted static strings from ICONS only */
function ico(name) {
  const span = el("span");
  span.innerHTML = ICONS[name] || ICONS.spark;
  return span;
}
function srvGlyph(id, sz) {
  const s = SERVERS[id] || { name: id, color: "#5d6880", glyph: "?" };
  const g = el("span", "srv-glyph", s.glyph);
  g.style.background = s.color;
  if (s.color === "#ffc820" || s.color === "#f29111") g.style.color = "#1a1408";
  g.title = s.name;
  if (sz) { g.style.width = sz + "px"; g.style.height = sz + "px"; g.style.fontSize = Math.round(sz * 0.38) + "px"; }
  return g;
}
function fmtNum(v, unit) {
  const u = unit || "";
  if (u.indexOf("$") > -1) {
    const isK = /K/i.test(u);
    const n = isK ? v * 1000 : v;
    if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
    if (Math.abs(n) >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
    return "$" + Math.round(n).toLocaleString("en-US");
  }
  if (u.indexOf("%") > -1) return v.toFixed(Math.abs(v) < 10 ? 1 : 0) + "%";
  return Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("en-US") : String(Math.round(v * 10) / 10);
}
function niceTicks(min, max, count) {
  if (min === max) { max = min + 1; }
  const span = max - min;
  const step0 = span / (count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  let step = mag;
  for (const m of [1, 2, 2.5, 5, 10]) { if (mag * m >= step0) { step = mag * m; break; } }
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out = [];
  for (let v = lo; v <= hi + step * 0.001; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}
