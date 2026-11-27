---
id: p-yrhsr6wf7v
title: "Render the fixed part of each agent start context to a digest-named file and inject it at start; long situational rules load by path (context engine, priority P1; source: owner via Miu, 2026-11-27 23:2x)"
status: proposed
priority: P1
area: context-engine
created: 2026-11-27
---

# Why

Each head start composes its opening again with `fgos internal start-context compose` and prints it into the session (about 14 to 15 KB). Rules used rarely (dispatch, capability routing, run door, driver discipline, gateway, domain doctrine) ride in every opening. The owner asked whether to render per-context text to files first and either inject it or only point to it by path. Miu's view, on reasoning only and not measured: render the fixed part once per (persona, context, digest of `.fgos/instructions/effective/rules.json`), inject it, and load long situational rules by path.

# Options to decide in the discussion

- **Inject a rendered file:** the fixed opening is read from a file named by its digest; the per-session part (handoff, name, question) is appended at start. Gain: a stable prompt prefix (provider prompt cache), a snapshot that can be checked before a session runs, and the `fgos.start.context` record pointing at the exact file.
- **Load by path:** long rules used only for one kind of work stay out of the opening, which carries one line with the path and when to read it. Risk: the agent may not read it, and each read costs a tool call, so authority, safety and role-boundary rules must stay inline.
- **Keep as is.**

# Done when

- The discussion measured first: start time of a compose, token and cache-hit rate of a start before and after on a live head, and per rule how often agents of that persona needed it (see `p-oisgk74z6a`).
- The chosen option: rendered files are generated from `core/instructions/` and the other sources, never edited by hand, named by digest, and checked against the sources by `fgos internal context-engine check`; one source of truth (L10).
- Rules that must always be present stay inline; a test shows a rule marked inline is never moved behind a path.

# Notes

Related: `p-oisgk74z6a` (measures the effect after release), plan `261122-1946-agent-start-context` (the composer and its token table). Needs a shaper before a planner because it changes how context is composed.
