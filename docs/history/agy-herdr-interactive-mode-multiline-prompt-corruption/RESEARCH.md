# agy-herdr-interactive-mode-multiline-prompt-corruption — RESEARCH

## Round 1 — 2026-08-26 (tsk-5cr discovery, live root-cause + fix verification)

**Asked:** tsk-5cr reports `agy-herdr` dispatch (provider `agy`, adapter
`herdr-spawn`, `interactiveMode`) returns `outcome:unsignaled`,
`headBefore==headAfter`, and a banner-only pane after `execute
fgos-coding-implement`. The item's own hypothesis: "likely a completion-
detection timing bug ... reads the pane's initial idle-shell state as
'done' before the agy process has actually started/finished its task."
Goal: confirm or replace that hypothesis with real evidence, then fix or
document.

**Already mitigated, found on arrival:** `.fgos/config.json`'s
`runner.capabilities.fgos-coding-implement.prefer` is already `agy-cli`
(not `agy-herdr`), landed in commit `21966be3` ("revert fgos-coding-
implement default from agy-herdr to agy-cli") — already on `main` before
this item's own discovery started. The capability's own inline
description already records an independent live confirmation of this
exact symptom and the revert decision, but did not explain the mechanism
and was never written up in `docs/history/`.

**Live root-cause investigation (real `herdr`/`agy` binaries, disposable
repo, per the item's own verify text) — the original "completion-
detection timing" hypothesis is WRONG. The real mechanism is upstream of
completion detection entirely:**

Built the exact command `herdrSpawnInteractiveAdapter`
(`src/runner/dispatch/transport.mjs:538-704`) constructs — `agy -i
'<prompt>' --mode 'accept-edits' --new-project --model
'gemini-3.6-flash-medium'`, quoted via that same function's own
`posixShellQuote`, typed into a real herdr pane via `herdr pane run
<paneId> <quotedCmd>` — and ran it twice, controlling only one variable:

- **Single-line prompt** ("Single line test prompt, reply OK and stop.")
  — worked exactly as designed. `herdr pane read` showed the real agy
  banner (email, model, cwd), the prompt delivered and answered ("OK"),
  and a clean transition into `accept-edits` mode.
- **Multi-line prompt** (3 real lines, the same shape `buildPrompt`
  produces for every real dispatch — markdown headers, multiple
  sections) — `herdr pane read` showed agy landing in a completely
  different, broken state: `"Welcome to the Antigravity CLI. You are
  currently not signed in." / "Signing in..."` — no model, no email, no
  project context. `herdr pane get`'s own `terminal_title` for this
  attempt was `"'agy' '-i'  '--mode' 'accept-edits' '--new-project'
  '--model' "` — **the prompt argument AND the trailing `--model` value
  are both empty**, confirmed reproducible on a second, independent
  attempt with a fresh pane.

**Root cause: `herdr pane run` types the whole command line into the
pane's pty as literal keystrokes, and an embedded literal newline
character inside a single-quoted shell argument breaks that typing —
not the shell's own quote-continuation (which handles a literal newline
inside `'...'` correctly at a real interactive prompt), but something in
how the newline lands when typed/submitted through the pane, corrupting
the argv `agy` actually receives** (dropping the prompt and, by
knock-on effect, the argument(s) after it). This is a real, provable
mechanism — not a plausibility guess — reproduced twice with a controlled
single-variable (line count) comparison against real binaries.

**Why `fgos-coding-implement`'s own real dispatches never hit this
directly in this session:** every real prompt this domain's own
`buildPrompt` produces (footprint, directive, five framing sections) is
always multi-line — so `agy-herdr` would trip this on effectively every
real dispatch, not intermittently. This matches the item's own "Confirmed
twice independently" framing and explains why the config's own revert
was unconditional (not a narrower workaround) rather than a targeted
fix — nothing about a specific prompt's content was special; ANY real
multi-line prompt triggers it.

**A real fix exists but needs its own separate live-verification pass,
not guessed here:** `herdr pane --help` lists `send-text` ("Send literal
text to a pane" — explicitly NOT the same path as `run`, whose own help
text says `next: herdr pane run <PANE_ID> <COMMAND> sends text and Enter
in one call`) and `send-keys` as separate primitives. The likely correct
shape: `pane run` to launch bare `agy -i --mode accept-edits
--new-project --model <model>` (no prompt in the command line at all,
single-line, safe per the control test above), wait for agy's own input
box to be ready, then `pane send-text` the real multi-line prompt
(untested whether `send-text` itself preserves embedded newlines
correctly into agy's own TUI input box, or whether agy's own input box
treats a bulk multi-line paste as "add newline" vs "submit each line" —
a second, DIFFERENT possible failure surface this investigation did not
reach), then submit via `send-keys`. Confirming this shape works
end-to-end (including with a REAL multi-line prompt reaching a REAL
`accept-edits`-mode task, not just an "OK" reply) is materially more
verification work than this item's own discovery-stage research budget
covers responsibly in one pass.

## Verdict

`clear`, scoped down from "fix agy-herdr" to "root-cause, confirm the
mitigation, and document — defer the send-text/send-keys redesign":

1. The operational risk is CLOSED — `fgos-coding-implement`'s default
   already avoids `agy-herdr` (commit `21966be3`, already on `main`).
2. This item's own real, valuable contribution is the concrete root
   cause (multi-line prompt corrupts `pane run`'s typed command line),
   which nothing in the repo had written down before this — only a bare
   inline config comment with the symptom, no mechanism.
3. Redesigning `herdrSpawnInteractiveAdapter` to use `send-text`/
   `send-keys` instead of embedding the prompt in `pane run`'s command
   line is real, follow-up work — deferred, not implemented here, because
   it needs its own live verification of a DIFFERENT untested surface
   (does agy's own TUI input box handle a bulk multi-line paste
   correctly) that this discovery round did not reach and should not
   guess past.

**Verify:** no code change in this item's own footprint — this is a
documentation-only item (`docs/history/agy-herdr-interactive-mode-
multiline-prompt-corruption/`). `.fgos/config.json` itself is
intentionally NOT touched from this (or any) worker branch — ADR0020
blocks any `.fgos/` commit from a worker branch or main, so the existing
inline capability description there is left as-is; this write-up is the
durable, citable record a future session (or a human editing
`config.json` directly from the main checkout, outside any branch) can
point `fgos-coding-implement`'s own description at. Verify is: the doc
exists and cites real file:line evidence — `test -f docs/history/
agy-herdr-interactive-mode-multiline-prompt-corruption/RESEARCH.md`.
