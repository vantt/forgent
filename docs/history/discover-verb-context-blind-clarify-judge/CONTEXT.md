# CONTEXT — `fgos discover` re-judges blind past a locked CONTEXT.md at stage `clarify`

Item: tsk-ozl

## Feature boundary

Fixes `resolveDiscovery`/`judgeDiscovery` (`src/intake/discovery.mjs`), the
engine behind stage `clarify`, so it stops calling the model unconditionally
every time `fgos discover <id>` runs, when the item already carries a
committed, non-empty `CONTEXT.md` under its `docsRef`. Does not touch
`resolveDecompose`/`judgeDecompose` (stage `decompose`) — scouted and found
already context-aware (see Scout evidence below).

## Problem (confirmed by reading the code, 2026-07-31)

`resolveDiscovery` (discovery.mjs:231-273) calls `judgeDiscovery`
unconditionally on every invocation — both the sync `fgos discover <id>`
verb (role `session`, called by a live session right after `fgos-coding-exploring`
locks decisions) and the runner's RUL19 safety-net sweep (role `runner`,
scans every `stage:clarify && status:todo` item each loop, specifically to
catch items no live session ever touched).

`buildDiscoveryPrompt` (discovery.mjs:77-151) builds the model prompt from:
title, kind, risk, refs, deps, graph/impact context, `work.description`,
the latest gate ask/answer, and prior `judgeDiscovery` verdicts. It never
reads `work.docsRef` or `CONTEXT.md` at all — so even when `fgos-coding-exploring`
has already locked every decision and written them to `CONTEXT.md`, the
next `fgos discover` call is blind to that artifact and can re-derive a
fresh, possibly contradictory judgment, including asking a brand-new
question and parking the item in `awaiting-human` right after a person
just finished exploring it.

RUL19 (`docs/specs/work-state.md:1054`) is a legitimate, separate purpose
for the same function: an automatic sweep that must judge items nobody has
touched, with no CONTEXT.md to trust. The bug is that both situations
—(a) sweep judging an untouched item, and (b) a session bumping an item it
just finished locking—share one function with no way to tell them apart.

## Scout evidence

- `src/intake/discovery.mjs:77-151` (`buildDiscoveryPrompt`) — confirmed:
  no `docsRef`/`CONTEXT.md` read anywhere in the prompt-building function.
- `src/intake/discovery.mjs:231-273` (`resolveDiscovery`) — confirmed:
  calls `judgeDiscovery` unconditionally, no docsRef/CONTEXT.md check
  before the model call.
- `src/intake/plan.mjs:36-50` (`readLockedContext`) — the sibling
  stage's engine already has exactly this pattern: best-effort read of
  `<docsRef>/CONTEXT.md` and `<docsRef>/plan.md`, folded into
  `buildDecomposePrompt` (decompose.mjs:116-118), with the prompt
  instructing the model the locked content is authoritative and must not
  be contradicted.
- `src/intake/plan.mjs:96-99` (`buildDecomposePrompt`'s gate section)
  — also already consults `view.gates[id]` so a human's prior answer
  changes the next verdict instead of being re-asked identical questions.
  Comment at decompose.mjs:90-95 names the exact prior bug this fixed
  (`tsk-3w8` follow-up, `str87-decompose-gate-consult`) — the same shape
  of bug this item's clarify-stage counterpart still has today.
- `bin/fgos.mjs:871-884` (`case 'discover'`) — confirmed: the CLI verb
  dispatches to `resolveDecompose` when `stage === 'decompose'`, else
  `resolveDiscovery` — a single verb name covering both engines.
- `docs/specs/work-state.md:1054` (RUL19) — confirmed legitimate purpose:
  runner sweep judges every `stage:clarify && status:todo` item each loop,
  regardless of `mode`, specifically so a dead session or an unresponsive
  submitter never leaves an item invisibly stuck.
- `.claude/skills/fgos-coding-exploring/SKILL.md` "Gate" section — confirmed: on
  the auto-approve path a `fgos decision` call logs
  `"auto-approved: CONTEXT.md (gate-bypass level <level>)"`; on the
  human-approval path (the `false` branch, asking "Decisions locked.
  Approve CONTEXT.md before planning?"), no equivalent log call exists
  today — a human "yes" leaves no separate durable trace beyond the
  committed `CONTEXT.md` file itself.
- Prior `view.discovery["tsk-ozl"]` and `view.decisions["tsk-ozl"]`:
  both empty — item had no exploration or locked decisions before this
  session.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope stays clarify-stage only — `resolveDiscovery`/`judgeDiscovery` (discovery.mjs). `resolveDecompose`/`judgeDecompose` is out of scope: it already reads `docsRef`/`CONTEXT.md`+`plan.md` and already consults gate answers (decompose.mjs:36-50, 96-99); scouting found no matching symptom there. |
| D2 | The trust signal that lets `resolveDiscovery` skip re-judging and just advance the stage is content-based: `work.docsRef` is set AND `<docsRef>/CONTEXT.md` exists on disk and is non-empty. No new approval-logging is required — this reuses `decompose.mjs`'s existing `readLockedContext` read pattern rather than inventing a second one. The gap named in scout evidence (a human "yes" leaves no separate durable trace) is accepted as-is for this item; not closed here. |
| D3 | The skip-and-advance behavior applies to BOTH callers of `resolveDiscovery` — the sync `fgos discover` verb (role `session`) and the runner's RUL19 sweep (role `runner`) — keyed on the D2 content signal, not on role. A sweep that finds a real committed `CONTEXT.md` on an item nobody is actively working also trusts it and advances, which also helps the crashed-mid-explore-session case RUL19 exists to catch. |

## Pinned terms

- **"trust signal"** — the D2 content check (`docsRef` set + non-empty
  `CONTEXT.md` file present) that determines whether `resolveDiscovery`
  may skip calling `judgeDiscovery`'s model and advance the item directly.
- **"skip-and-advance"** — the new behavior gated by the trust signal:
  moving the item from `clarify` to `decompose` without a model call,
  as opposed to the existing "clear"/"unclear" model-judged outcomes.

## Deferred to planning (implementer's job, not locked here)

- Exact code shape of the D2/D3 check inside `resolveDiscovery` (e.g.
  reusing/extracting `readLockedContext` from `decompose.mjs` verbatim vs.
  a clarify-local equivalent).
- What `verify` value a skip-and-advance transition carries into
  `decompose` (today a clear model verdict supplies one, or
  `FALLBACK_VERIFY` when it doesn't — a skipped call needs the same kind
  of fallback source; likely `FALLBACK_VERIFY` directly, but this is an
  implementation choice, not a product decision).
- Whether/how to log the skip-and-advance outcome (mirroring
  `logDecomposeVerdict`'s audit-trail pattern in decompose.mjs) so
  `view.decisions`/`fgos list` readers can tell "skipped, trusted
  CONTEXT.md" apart from "model judged clear".
- Test coverage shape (unit test on `resolveDiscovery` directly vs.
  e2e through the `discover` CLI verb and/or the runner sweep).

## Outstanding questions

None — all three material decisions were locked with the user in this
session (recommended options accepted on all three).

## Canonical references

- `src/intake/discovery.mjs` — engine being fixed.
- `src/intake/plan.mjs` — sibling engine whose existing
  `readLockedContext`/gate-consult pattern is the model to mirror.
- `bin/fgos.mjs:861-884` — CLI verb dispatch (`discover`).
- `docs/specs/work-state.md:1054` (RUL19) — sweep's legitimate purpose,
  must remain intact for items with no trust signal.
- `.claude/skills/fgos-coding-exploring/SKILL.md` — "Gate" section, approval
  logging asymmetry noted in scout evidence.
