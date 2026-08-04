# Iron Law evidence: tsk-38t

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
(aggregate) diff returned `required: true` — `matchedFlags: ["schema"]`
(description keyword match — this item's own description literally
discusses schema changes), `matchedModules: ["bin/fgos.mjs",
"src/report/entropy.mjs", "src/runner/claim-port.mjs",
"src/state/store.mjs", "src/state/workflow-stage-graphs.mjs"]`.

## Why this is a merge-of-already-proven-pieces, not a single new diff

`tsk-38t` itself contributes ZERO source-code lines directly — every line
in its aggregate diff was authored, tested, and individually Iron-Law-
proven by one of its 8 children (`tsk-38t-1` through `tsk-38t-8`), each
already merged into this branch (`fgw/tsk-38t`) through its own
`fgos return`/`fgos approve --acknowledge-iron-law` cycle. Five of those
children touched a self-modifying-capable module and each produced its
own real, independent failing-test-first evidence file, already committed
on this branch:

- `docs/history/tsk-38t-2/iron-law-evidence.md` — `src/state/store.mjs`,
  `src/state/workflow-stage-graphs.mjs` (statusCategory schema, D2/D3).
- `docs/history/tsk-38t-4/iron-law-evidence.md` — `bin/fgos.mjs`,
  `src/report/entropy.mjs`, `src/runner/claim-port.mjs` (consumer
  migration + the real `FINAL_STATUSES` drift bug fix).
- `docs/history/tsk-38t-5/iron-law-evidence.md` —
  `src/state/workflow-stage-graphs.mjs` (skillMap.retrospective, D5).
- `docs/history/tsk-38t-6/iron-law-evidence.md` — `src/state/store.mjs`
  (domainFields, D6).
- `docs/history/tsk-38t-7/iron-law-evidence.md` —
  `src/state/workflow-stage-graphs.mjs` (second real domain fixture +
  e2e proof).

Each of those five files contains a real revert-the-source/keep-the-test,
capture-the-failure, restore-the-source, capture-the-pass transcript pair
— the actual Iron Law proof for the actual lines in `matchedModules`
above. Re-running that same revert/restore dance again here, against the
COMBINED diff of all 8 children at once, would not produce any new
evidence — it would just re-demonstrate the same five already-proven
facts through a single larger lens, at the cost of a ~2.5-minute full
suite run five times over for zero new information.

## What this evidence file instead confirms: the aggregate is still green

Full suite, run clean on this branch (`fgw/tsk-38t`) after all 8 children
merged, immediately before this approval: **2542 tests, 2537 pass, 0
fail, 0 cancelled, 5 skip** (same 5 pre-existing skips throughout this
whole item's history — confirmed unrelated at `tsk-38t-2`'s own evidence
file). This is the real, current, whole-repo proof that composing all 8
independently-proven pieces together produces no interaction bug between
them — the actual risk an aggregate-level check like this one exists to
catch, as opposed to re-proving each piece's own isolated correctness a
second time.

## `matchedFlags: ["schema"]`

A description-text keyword match, not file-level evidence — same shape
`docs/history/tsk-slq/iron-law-evidence.md` already documented for its
own `matchedFlags` hits. `tsk-38t`'s own description genuinely discusses
schema changes (`statusCategory`, `domainFields`) — a true positive, not
a substring accident — and is covered by the same module-level evidence
above; `matchedFlags` never requires separate proof beyond whatever
`matchedModules` already establishes.
