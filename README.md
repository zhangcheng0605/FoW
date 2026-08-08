# FoW — Future of Work

A proof-of-concept **employee daily driver** for **Mediacorp**: one canvas that
shows each person the work that matters to them, plus **askMElah** (Singlish:
"ask me lah"), an embedded AI copilot they can talk to — or literally drag their
work into.

> Demo only. All data, MCP servers, tool calls and agent responses are simulated —
> no real integrations, no network calls, no accounts. The Mediacorp branding
> (logo recreated as inline SVG) is for this POC only. And to be fully honest:
> there is **no LLM anywhere** — askMElah is a deterministic scripted router
> (keyword-matched flows + data-templated responders), all client-side, zero
> network calls. A production build would connect a real model through the MCP
> layer this demo already mocks.

## Run it

Open `index.html` in any modern browser. That's it — the whole app is one
self-contained file (no server, no build step needed to run).

## What to demo

0. **Present mode** — don't demo it, let it demo itself. Present mode is now
   **per persona**: every sign-in card has its own ▶ "play story" button, and
   the topbar ▶ (or ⌘K → "Start present mode") runs the *current* persona's
   highlights. Captions are authored per persona — grounded in that role's
   actual data — and each tour ends by asking that persona's signature
   question. A spotlight, a ghost cursor and director's captions do the
   driving: real interactions, ~2 minutes. Space pauses, speed is adjustable,
   Esc (or the exit button) hands you the wheel at any moment.
1. **Pick a seat** — the role picker re-shapes the entire workspace: HR, Finance,
   Procurement, IT, Legal, Sales or Creative & Marketing each get their own KPIs,
   charts, queues, skills and MCP connections (and their own accent color). The
   marketing seat (Chloe Tan) plans on Monday.com and generates creative on
   Higgsfield — ask her workspace to render campaign concepts.
1b. **Cross-app workflows** — the marquee demo. Each persona has two runnable
   chains that hop data between systems via MCP (e.g. a blocked Dell invoice:
   SAP → DocuSign → Excel → Outlook → Teams; a campaign brief: Monday.com →
   Higgsfield → Adobe → Slack). A pipeline visual shows each hop live, the
   payload passing between servers, and every chain ends with a
   **cross-system insight** — a finding only possible because the silos are
   joined. Ask askMElah "what insights can you see across my systems?" for
   the standalone version.
2. **Drag anything into the chat** — a KPI tile, a chart, a meeting, an email, an
   approval, a Jira task, even an MCP server. askMElah analyzes it in place,
   showing the (simulated) MCP tool calls it makes along the way.
3. **MCP Console** — the plug icon in the topbar, "Open the MCP console" in the
   connections card, or ⌘K: the full catalog of 20 MCP servers with per-role
   connection status, tool lists, latency/call metrics, and a live tool-call
   feed populated by your session's actual (simulated) calls.
4. **Delegate to askMElah** — the agent work queue: hand a task over and watch
   it run tool calls in the background, produce an artifact, and report back.
5. **Approvals autopilot** — flip the switch and askMElah clears low-risk
   approvals within policy on its own (and says exactly what it won't touch).
6. **Draft my week recap** — the green button in the hero: askMElah compiles
   wins, watch-outs and next week from live canvas data; copy or "send" it.
7. **Your week in numbers** — meeting load vs focus time, meeting cost, and
   deep-work blocks, with a day-by-day chart (drag it into chat for advice).
8. **⌘K / Ctrl-K** — command palette with federated search: emails, tickets,
   meetings and files from every connected tool in one box, plus ask-anything.
9. **Click the suggestion chips** — each persona has scripted "hero" questions
   with rich answers: tables, callouts, and live charts embedded in chat.
10. **BI everywhere** — trend lines with crosshair tooltips, donut, bar and
    heatmap charts, sparklines, goal meters — every chart has a table-view twin
    (the ⊞ button) and full hover tooltips.
11. **Double-click** an inbox thread (askMElah drafts the reply) or a skill (it
    runs). Log an energy check-in in the hero. Toggle light/dark (moon icon).
12. **Meet Emmi** — the Mediacorp logo, alive in the bottom-left corner. It
    breathes, blinks, follows your cursor, hops when you clear approvals,
    gets sleepy in dark mode, and greets you on sign-in with your leave
    status pulled (simulated) from SAP — "welcome back from leave" included.
    Click it for context-aware nudges.
13. **Morning scan** — a CNA newsroom card (demo headlines) on every canvas;
    drag a story to askMElah for the 20-second version.

## Project layout

```
index.html            built, self-contained app — the demo artifact
build.py              inlines src/* + data into index.html (and dist/artifact.html)
src/
  body.html           DOM skeleton
  style.css           design system (persona accents, Mediacorp theming)
  js/registry.js      MCP server catalog, personas, icons, helpers
  js/charts.js        hand-rolled SVG chart engine (trend/donut/bars/heatmap/spark)
  js/chat.js          askMElah: intent router, chip responders, streamed answers
  js/app.js           canvas renderer, drag-and-drop, ⌘K palette, MCP console, fx
  js/present.js       present mode: per-persona spotlight tours + player bar
  data/<role>.json    per-persona demo data packs (6 roles)
  data/extras-<role>.json   extra per-persona content (inbox, palette, chips)
  data/tour-<role>.json     per-persona tour narration (agent-authored, grounded
                            in that persona's data)
  data/chains-<role>.json   per-persona cross-app workflow chains + the
                            cross-system insights they surface
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
