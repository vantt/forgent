# hello-world-vanilla-js — locked decisions

Item: `tsk-64s` — "viêt một hello world app bằng vanila js"

## Feature boundary

A minimal, standalone vanilla-JS hello-world demo, unrelated to fgOS's own
product surface (the CLI platform itself). Scope is exactly: one HTML page
+ one JS file that display "Hello, World!" in the browser DOM. Nothing else
(no build step, no framework, no styling requirements were asked for or
implied).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | App lives at `examples/hello-world/` — a new top-level directory, separate from CLI source (`src/`, `bin/`) and from `dogfood-fixture/` (an existing Node-package dogfood target, not a browser app — mixing the two would blur what each directory is for). |
| D2 | App shape is `index.html` + `script.js`. `script.js` sets the DOM text to `Hello, World!`; opening `index.html` in a browser is the run path. |
| D3 | Verify is a mechanical script (no browser required): assert the string `Hello, World!` appears in `examples/hello-world/index.html` and/or `examples/hello-world/script.js`. |

## Pinned terms

- "Hello world app" = a real browser-runnable page (D2), not a Node console
  script — the more literal reading of "vanilla JS app."

## Scout evidence

- `rg` across the repo for "hello world" / "vanilla" precedent: zero hits.
  No existing web/browser-app pattern anywhere in this repo — it is a
  Node CLI platform (`bin/`, `src/`) plus one Node-package dogfood fixture
  (`dogfood-fixture/`, e.g. `src/calculator.mjs`). This app introduces the
  repo's first browser-facing artifact, hence the dedicated new directory
  (D1) rather than folding it into either existing convention.

## Canonical references

- None — no existing code/docs pattern applies; this is a fresh, isolated
  artifact per D1.

## Outstanding questions deferred to planning

- None. All three decisions above (location, shape, verify) fully bound the
  implementation — nothing implementation-specific (styling, additional
  files, etc.) was asked for, so there is nothing left to hand to
  `fgos-coding-planning` beyond confirming this is simple enough to skip a split.
