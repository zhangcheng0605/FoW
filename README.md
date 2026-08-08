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
3. **Delegate to Flow** — the agent work queue: hand a task to Flow and watch it
   run tool calls in the background, produce an artifact, and report back in chat.
4. **Approvals autopilot** — flip the switch and Flow clears low-risk approvals
   within policy on its own (and says exactly what it will and won't touch).
5. **Draft my week recap** — the green button in the hero: Flow compiles wins,
   watch-outs and next week from live canvas data; copy it or "send" it onward.
6. **Your week in numbers** — meeting load vs focus time, meeting cost, and
   deep-work blocks, with a day-by-day chart (drag it into chat for advice).
7. **⌘K / Ctrl-K** — command palette with federated search: emails, tickets,
   meetings and files from every connected tool in one box, plus ask-anything.
8. **Click the suggestion chips** — each persona has scripted "hero" questions
   with rich answers: tables, callouts, and live charts embedded in chat.
9. **BI everywhere** — trend lines with crosshair tooltips, donut, bar and
   heatmap charts, sparklines, goal meters — every chart has a table-view twin
   (the ⊞ button) and full hover tooltips.
10. **Double-click** an inbox thread (Flow drafts the reply) or a skill (Flow
    runs it). Log an energy check-in in the hero. Toggle light/dark (moon icon).

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

- Light-first, professional: cool off-white ground, white cards, hairline
  borders, soft elevation, one deep accent per role. Dark mode stays one
  click away (topbar moon/sun) for late shifts and dim rooms.
- Chart colors are CVD-validated categorical palettes — one set per theme,
  checked against each theme's card surface; status colors are reserved and
  never reused as series. The heatmap ramp inverts per theme so "more" always
  reads as "more".
- Charts follow quiet-chart rules: 2px lines, ≤24px bars with rounded data-ends,
  surface gaps between marks, hairline grids, selective direct labels, legends
  for ≥2 series, crosshair + shared tooltips, and a table twin for every chart.
