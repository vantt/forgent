# hello-world-vanilla-js — plan

Item: `tsk-64s`. Decisions: `CONTEXT.md` (D1 location, D2 shape, D3 verify).

## Mode

Flags counted (auth / authorization / data model / audit-security /
external systems / public contracts / cross-platform / existing covered
behavior / weak proof / multi-domain): **0**.

Mode: **tiny** — a couple of files, one direct task, no gray areas left
after `CONTEXT.md`.

## Approach

`fgos graph --json`: `tsk-64s` is its own component (size 1, no deps, no
blockers) — nothing else in the backlog orders around it.

Direct path, no alternative considered (nothing else honestly fits a
static two-file demo):

1. Create `examples/hello-world/index.html` (D1, D2) — a minimal HTML page
   that loads `script.js` and has an element for it to fill.
2. Create `examples/hello-world/script.js` (D2) — sets that element's text
   to `Hello, World!` on load.
3. Verify (D3): `grep -q "Hello, World!" examples/hello-world/index.html examples/hello-world/script.js` — mechanical, no browser needed. The item's own `verify` field will be updated to this exact command (the model's `discover` verdict proposed a browser-only check, which D3 already overrode).

Risk map: none — no component here rises above "cite D1–D3 and write the
two files."

## Split decision

One honest piece of work — no split. Proceeds as itself (`tsk-64s`), no
children.

## Execution

Per the locked convention, `execute`/`return` already have a working
mechanical path (goal-check + `return`'s own re-verify) — this plan does
not redesign that. It only names the one command that proves this piece
done (above).
