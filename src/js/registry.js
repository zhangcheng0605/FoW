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
  { id: "hr",          name: "Maya Chen",       role: "HR Business Partner",   dept: "People & Culture", tag: "People, engagement & talent",    accent: "#f472a6", initials: "MC", loc: "Singapore" },
  { id: "finance",     name: "Daniel Okafor",   role: "FP&A Manager",          dept: "Finance",          tag: "Plan, spend & forecast",         accent: "#34d399", initials: "DO", loc: "London" },
  { id: "procurement", name: "Priya Nair",      role: "Procurement Lead",      dept: "Procurement",      tag: "Vendors, POs & savings",         accent: "#f6a623", initials: "PN", loc: "Austin" },
  { id: "it",          name: "Marcus Webb",     role: "IT Operations Manager", dept: "IT",               tag: "Incidents, uptime & access",     accent: "#2fc8ea", initials: "MW", loc: "Singapore" },
  { id: "legal",       name: "Sofia Reyes",     role: "Senior Legal Counsel",  dept: "Legal",            tag: "Contracts, matters & risk",      accent: "#a685fa", initials: "SR", loc: "New York" },
  { id: "sales",       name: "Jonas Lindqvist", role: "Enterprise Sales Mgr",  dept: "Sales",            tag: "Pipeline, quota & accounts",     accent: "#5aa2f7", initials: "JL", loc: "Stockholm" },
];

/* chart series colors — validated (dark surface #10141f) */
const SERIES = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];
const NEG = "#e66767";
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
