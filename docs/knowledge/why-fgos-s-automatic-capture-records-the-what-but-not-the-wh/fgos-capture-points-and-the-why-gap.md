---
framework: diataxis
mode: explanation
---
# Why fgOS's automatic capture records the what, but not the why

Source: `plans/reports/capture-recording-points-audit-260729-1745-report.md`
(tsk-ma4). This document distills that audit's findings for a reader who
wants to understand fgOS's capture design without re-deriving it.

## The question this answers

fgOS automatically records a lot about a work item's lifecycle without
needing a person: outcomes, settlements, friction, gate text. Given all
that, does fgOS actually preserve *why* a decision landed where it did —
what was considered, what got rejected, and what tradeoff was accepted? Or
does it only preserve the mechanical fact that something happened?

## What fgOS captures automatically, and what each capture actually holds

Six mechanisms fire without a person, each confirmed against the live
source (2026-07-29):

- **RUL13 outcome** (`src/runner/claim-port.mjs:150-160` predicted;
  `src/runner/loop.mjs:712-722` + `bin/fgos.mjs:1448`/`1493` actual) — a
  pass/fail fact: `{outcome, passed, attempts, errorClass, aheadCount}`.
  Twice per item (a prediction at claim, a real result at close), merged by
  id, never overwritten.
- **RUL20 settlement** — which of three FSM edges fired (clarify-pass,
  answer, close). Also just a fact, not a reason.
- **RUL21 close-time learning** (`composeLearning`, `src/state/store.mjs:268`) —
  one mechanical, best-effort learning record, generated automatically on
  every `→done`, never blocking the close.
- **RUL32 reason** — the single latest rejection/gate-break reason string,
  latest-wins (the one place fgOS deliberately does *not* keep history,
  because a worker retrying only needs the newest reason).
- **Blocked friction** (`src/state/store.mjs:674-681`) — one occurrence per
  block, appended, never merged.
- **`gates[id]`** (`src/state/replay.mjs:166-172`) — only `ask` / `answer` /
  `parentSnapshotAtAsk` / `statusAtAsk`. Confirmed live: no actor or role
  field is present in this projection.

A seventh mechanism, found while auditing beyond the six above:
**`view.discovery`** (`src/state/discovery.mjs:239`) records
`{clear, question?, verify?}` at `clarify` — the closest thing to a "why"
fgOS has today, but only a single open question string, never a chosen
option or a rejected alternative.

## The gap that matters most: `decompose` captures less than `clarify` does

Tracing `judgeDecompose` directly (`src/intake/plan.mjs:290-360`) shows
its common outcomes — `pass-through` and `decompose`-with-children — leave
**no trace of their own reasoning at all**. This was confirmed live during
the very audit that produced this document: `tsk-ma4`'s own
`decompose`→`executing` transition hit the `pass-through` branch and wrote
nothing but a stage move. Even splitting an item into children records the
children's `title`/`kind`/`deps`/`verify` as new items, never *why* the
split was drawn that way. This is a deeper gap than `clarify`'s already-thin
`view.discovery` record — the later judgment is captured less than the
earlier one, not equally.

## The one mechanism that does capture the why — and why it's not enough

`docs/history/<feature>/CONTEXT.md`, written by the `fgos-coding-exploring` and
`fgos-coding-planning` skills during `clarify`/`decompose`, is a real structured
why/tradeoff record — the same shape bee's own `CONTEXT.md` takes (written
at exploring/qualifying, "always — locked decisions, source of truth," per
`scan-260728-1233-bee-doc-types-lifecycle-report.md`). fgOS already
replicates this pattern; the audit that produced this document is itself an
example (`docs/history/recording-points-audit/CONTEXT.md`, written before
any code — there was none here — was touched).

The gap is not the mechanism — it's that nothing in fgOS's engine requires
or checks that a session actually writes one. Measured live from a raw fold
of `.fgos/events.jsonl` (immune to a separate, out-of-scope anomaly found in
`fgos list --json`'s live output during the same audit): of 109 items ever
created, only 25 (23%) ever got a `docsRef`, and only 18 (16.5%)
`docs/history/*/` directories carry a `CONTEXT.md` at all. Roughly three in
four items never get one.

## A third gap the original hypothesis didn't name

The Socratic back-and-forth between a session and a person during
`clarify`/`decompose` — the same kind of exchange that produced this very
document's own locked decisions — happens outside `fgos ask`/`fgos answer`
entirely, in direct conversation. Nothing in fgOS's event log captures that
exchange; its only trace is whatever prose a session chooses to write into
`CONTEXT.md` afterward. No existing backlog line (STR69a, STR69b, STR70a,
STR70b, STR71) targets this case — they are all scoped to the async
`awaiting-human` gate, not to synchronous in-session dialogue.

### Status (re-checked 2026-08-02, tsk-42i): still open, one narrow slice now covered

Tracked as fgOS work item `tsk-42i`. Confirmed still unaddressed in general:
`fgos-coding-planning-context-gap-handback` (done) now gives `fgos-coding-planning` a
documented path to invoke `fgos-coding-exploring`'s Socratic-lock flow directly,
mid-session, when it finds `CONTEXT.md` silent on something material —
that exchange gets appended as a new D-ID decision. This closes exactly
**one** case (planning discovers a gap) — the general case (any
synchronous back-and-forth during `clarify`/`decompose`) is unchanged: no
capture, no home for the raw exchange.

The real fix shares its blocking question with STR70b's Q1 (same doc gate,
different scope: STR70b is gate-`ask`/`answer` raw backstop; this is
general in-session dialogue). Three homes for raw material, same as
STR70b's own analysis: O1 (core log) is impossible — append-only, no
redact/prune (L3). O2 (a secondary store inside core) is blocked by L1
(all durable data must be a log or state — raw fits neither) until L1 is
reopened. **O3 (a daemon-consumer, per decision `0014`)** is the
architecturally correct home and violates no locked law, but the layer
does not exist yet — it needs STR46's own foundation (`p-09351985`, "core
verb-logic as a linkable lib," itself still `proposed`) plus STR48
(attention/push channel) built first. That is a real subsystem, not a
quick add — building it just for this capture would be scope far beyond
what this gap alone justifies.

**Reactivation trigger (shared with STR70b, not invented new):** re-open
this once real evidence justifies committing to O2 or O3 — the same
measurement STR70b is already waiting on (how often the distilled/summary
record turns out to be insufficient and the raw exchange was needed).
Once that measurement lands and O2/O3 is actually chosen and built, extend
whatever raw-store it produces to also cover general synchronous
`clarify`/`decompose` dialogue, not just the gate-`ask`/`answer` case —
same home, wider capture scope, one build.

## Update: the `decompose` gap above is now closed (tsk-6b6)

The gap named two sections up — `judgeDecompose`'s `pass-through` and
`decompose`-with-children branches leaving "no trace of their own
reasoning at all" — is closed. `resolveDecompose`'s four outcome branches
(`invalid`/`need-human`/`pass-through`/`decompose`) each now call
`addDecision` (`src/intake/plan.mjs`), folding into
`view.decisionsById[id]` — the same per-item, append-only shape
`view.discovery[id]` already had, so a decompose-stage judgment can no
longer move or park an item while leaving zero trace behind.

The model prompt changed too, not just the storage: `buildDecomposePrompt`
now asks for a top-level `"reason"` on every branch, not only
`need-human`. `pass-through`'s reason is optional (a fixed fallback
rationale is logged if the model doesn't answer); `decompose`'s reason is
**required** — a decompose verdict with a blank or missing top-level
reason normalizes the whole verdict to `invalid`, the same rule
`normalizeChild` already applied to a child missing `verify`.

**How the fix was actually shaped, closing a second gap along the way:**
tsk-6b6's own locked decision record (`docs/history/decompose-verdict-capture/CONTEXT.md`,
D1) originally chose to build this recording mechanism itself — reusing
`addDecision` by extending its schema with `rationale`/`alternatives`/`source`
and an optional `id`. Partway through execution, a *different* item
(`tsk-63c`) landed that exact extension first, with a different concrete
shape than CONTEXT.md had guessed (`rationale` required unconditionally,
not scoped to `id`-present; a dual fold — `view.decisions` unconditionally,
`view.decisionsById[id]` additionally — never the either/or branch
originally planned). Rather than build on a stale assumption, CONTEXT.md
and `plan.md` were revised in place (marked `REVISED`/`SUPERSEDED`, citing
the new evidence) to match what actually shipped, shrinking tsk-6b6's own
scope down to just `decompose.mjs` — the schema/CLI/replay work it
originally planned to own was already done. This is itself evidence for
this document's own recurring theme: a locked `CONTEXT.md` is worth
revising the moment new evidence contradicts it, and worth citing when it
does, rather than either freezing the plan or silently ignoring the
mismatch.

## What this means for `gates[id]` specifically (STR70a's target)

STR70a proposes folding an actor/role stamp into `gates[id]`. Confirmed
live: `role` already exists as a raw payload field on the `answer` edge
(`bin/fgos.mjs`'s `answer` case already passes `role: 'human'`), but
`putInAwaiting`/`ask` stamps no role at all, and neither ever reaches
`gates[id]`'s fold in `replay.mjs:166-172`. The field was once called
`actor` and was renamed to `role` by an already-executed migration
(`scripts/migrate-actor-to-role.mjs`, STR46) — the gap STR70a describes is
unchanged by that rename, just under a new name. Closing it is small: one
parameter added to `putInAwaiting`, one CLI-case edit for `ask`, and one
more spread line in the `gates[id]` fold — the same shape the other three
fields there already use, not a new capture mechanism.
