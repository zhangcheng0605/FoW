# FoW — Future of Work

A proof-of-concept **employee daily driver**: one canvas that shows each person the
work that matters to them, plus **Flow**, an embedded AI copilot they can talk to —
or literally drag their work into.

> Demo only. All data, MCP servers, tool calls and agent responses are simulated —
> no real integrations, no network calls, no accounts.

## Run it

Open `index.html` in any modern browser. That's it — the whole app is one
self-contained file (no server, no build step needed to run).

## What to demo

1. **Pick a seat** — the role picker re-shapes the entire workspace: HR, Finance,
   Procurement, IT, Legal or Sales each get their own KPIs, charts, queues,
   skills and MCP connections (and their own accent color).
2. **Drag anything into the chat** — a KPI tile, a chart, a meeting, an email, an
   approval, a Jira task, even an MCP server. Flow analyzes it in place, showing
   the (simulated) MCP tool calls it makes along the way.
3. **Click the suggestion chips** — each persona has scripted "hero" questions
   with rich answers: tables, callouts, and live charts embedded in chat.
4. **Approve things** — from the Approvals card or from chat. The ✕ button asks
   Flow for a recommendation first; approving fires confetti.
5. **⌘K / Ctrl-K** — command palette: ask anything, switch persona, jump to a
   widget, inspect an MCP server.
6. **BI everywhere** — trend lines with crosshair tooltips, donut, bar and
   heatmap charts, sparklines, goal meters — every chart has a table-view twin
   (the ⊞ button) and full hover tooltips.
7. **Double-click** an inbox thread (Flow drafts the reply) or a skill (Flow runs it).

## Project layout

```
index.html          built, self-contained app — the demo artifact
build.py            inlines src/* + data into index.html (and dist/artifact.html)
src/
  body.html         DOM skeleton
  style.css         design system (dark "aurora cockpit", persona accents)
  js/registry.js    MCP server catalog, personas, icons, helpers
  js/charts.js      hand-rolled SVG chart engine (trend/donut/bars/heatmap/spark)
  js/chat.js        Flow: intent router, chip responders, streamed answers
  js/app.js         canvas renderer, drag-and-drop, ⌘K palette, fx
  data/<role>.json  per-persona demo data packs (6 roles)
```

To rebuild after editing anything under `src/`:

```
python3 build.py
```

## Design notes

- Dark-committed "mission control" look: persona-tinted aurora over deep navy,
  glass cards, one accent per role.
- Chart colors are a CVD-validated categorical palette (checked against the
  card surface `#10141f`); status colors are reserved and never reused as series.
- Charts follow quiet-chart rules: 2px lines, ≤24px bars with rounded data-ends,
  surface gaps between marks, hairline grids, selective direct labels, legends
  for ≥2 series, crosshair + shared tooltips, and a table twin for every chart.
