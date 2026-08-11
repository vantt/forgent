# Plan: decision-schema-rationale-alternatives-source (tsk-63c)

## Status

- Stage: `decompose` (shaping)
- Decisions: `CONTEXT.md` (D1-D3, approved)
- Mode: **standard**

## Mode gate

Flags counted: **data model** (schema extension to `addDecision` payload
and the `gates[id]`/`view.decisions` view shape) YES; **public contracts**
(new required `--rationale` CLI flag is a breaking change to `fgos
decision`) YES; **existing covered behavior** (`test/cli/fgos.test.mjs:698,709`,
`test/state/replay.test.mjs`, `test/state/awaiting.test.mjs` all assert
today's decision/gates shape) YES. Auth, authorization, audit/security
(beyond the decision log's own normal role), external systems,
cross-platform, weak proof, and multi-domain do not apply. 3 flags, no
hard-gate flag → **standard**: a phased plan, not a spike or a direct
one-file note.

## Approach

Single cohesive schema change across three tightly-coupled surfaces
(`addDecision`'s validation, the `gates[id]` fold, the CLI). Not split
into separate work items (see "Split" below) — the pieces have no
independent shippable value apart from each other.

`fgos graph --json` (`criticalPath`: `tsk-4fu → tsk-56t → tsk-1an → ...`,
does not include `tsk-63c`) confirms this item is not on the critical
path but is a `topUnblock` entry (`unblocks: 1, newlyUnblocks: 2`) — it
unblocks `tsk-6b6`, which is already blocked waiting on this item's
`id`-optional shape (per `tsk-6b6`'s own acceptance clause 3). No other
ready item competes for the same files, so no ordering conflict to
resolve against the graph.

Rejected alternative: keep the STR70a-era plan (add only a `role` field
to `gates[id]`/`putInAwaiting`) and treat the broader
rationale/alternatives/source/id schema as a separate future item. Not
viable — `CONTEXT.md` D1 already locked the broad scope specifically to
unblock `tsk-6b6`, which needs `addDecision`'s `id`-optional shape now,
not later.

### Files touched

| File | Change | Honors |
|---|---|---|
| `src/state/store.mjs` | `addDecision(dir, payload)` (line 603): validate non-empty `rationale` (throw `StoreError('validation', ...)` same shape as the existing `text` check), accept optional `alternatives`/`source`/`id`. `putInAwaiting` (line 527): accept optional `rationale`/`alternatives`/`source`, thread to `moveWork`. `answerAwaiting` (line 543): accept the same three, thread to `moveWork` (it already threads `role`). | D1, D2, D3, seq 1206 (renumbered by tsk-n4i-1; was 1190) |
| `src/state/replay.mjs` | `gates[id]` fold (lines 162-173): add `rationale`/`alternatives`/`source` to the same guarded spread pattern already used for `parentSnapshotAtAsk`/`statusAtAsk` (only stamped when present, override-on-refresh semantics). Decision fold (line 255, currently `view.decisions.push({ ...event.payload, ts: event.ts })`): when `event.payload.id` is present, additionally fold into a new `view.decisionsById[id]` accumulating array (mirrors `view.discovery`/`view.frictions`'s lazy-key-plus-append pattern); the existing global `view.decisions.push(...)` stays unconditional and unchanged either way, so id-less decisions and every pre-existing reader of the flat array are untouched. | D1, D3, seq 1206 (renumbered by tsk-n4i-1; was 1190) |
| `bin/fgos.mjs` | `decision` case (line ~1023): add required `--rationale` flag (throws the same `requireField` shape as `--text` when missing/blank), optional `--alternatives`/`--source`/`--id`, pass all to `addDecision`. `ask` case (line ~985): optional `--rationale`/`--alternatives`/`--source` flags, threaded to `putInAwaiting`. `answer` case (line ~1015): same three optional flags, threaded to `answerAwaiting` alongside the existing `role: 'human'`. | D1, D2, D3 |
| `test/cli/fgos.test.mjs` | Update the two existing `run(cwd, ['decision', '--text', ...])` calls (lines 698, 709) to also pass `--rationale`; add a case asserting `decision` without `--rationale` now fails with the new validation error. | D2 |
| `test/e2e/rebuild-determinism.test.mjs` | Update the `run(cwd, ['decision', '--text', 'locked D3: ...'])` call (line 94) to also pass `--rationale` — found by a full-repo grep at `fgos-coding-validating` time, missed by the original single-caller check (that check only covered `addDecision`'s direct code caller, not every test invoking the CLI command). | D2 |
| `src/cli/command-registry.mjs` | Update the `decision --help` example string (line 271, `'fgos decision --text "Use envelope wrapping..."'`) to include `--rationale`, so the example stays valid once the flag is required. | D2 |
| `test/state/replay.test.mjs` | Add: a decision event carrying `id` folds into `view.decisionsById[id]` as an accumulating array while the global `view.decisions` array keeps receiving every decision (id-bearing or not) exactly as today. | D1, seq 1206 (renumbered by tsk-n4i-1; was 1190) |
| `test/state/awaiting.test.mjs` | Add: `rationale`/`alternatives`/`source` passed to `ask`/`answer` appear in `view.gates[id]` after each, mirroring the existing `statusAtAsk`/`parentSnapshotAtAsk` fold tests already in this file. | D1, D3 |

### Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `rationale` required on `addDecision` | low-medium — one real code caller today (`bin/fgos.mjs:1025`, grep-confirmed), and (per `fgos-coding-validating`'s full-repo grep, first pass missed this) two real test callers of the CLI command itself (`test/cli/fgos.test.mjs:698,709`, `test/e2e/rebuild-determinism.test.mjs:94`) — all three updated in the same change | full suite green, especially the three updated call sites above and `backward-compat.test.mjs` (pre-existing logs with no `rationale` on old `decision` events must still replay unchanged — the required check lives in the write path, `addDecision`, never in `replay.mjs`'s fold, which stays freeform per its own doc comment) |
| `view.decisionsById[id]` new key | low — purely additive | `replay.test.mjs`'s existing flat-array assertions (`view.decisions` with no `id`) stay byte-identical when `id` is absent |
| `gates[id]` `rationale`/`alternatives`/`source` fold | low — same guarded-spread pattern the file already uses three times over | new `awaiting.test.mjs` case, mirroring the existing `statusAtAsk` fold test's shape |
| `--rationale`/`--alternatives`/`--source`/`--id` CLI flags | medium — public CLI contract change | grep for other callers stays at one (already checked); updated test asserts the new required-flag error message |

## Split

No split. `tsk-63c` is one coherent schema change — the store validation,
the CLI flags, and the `gates[id]`/`decisions` fold all depend on the same
shape decision (`CONTEXT.md` D1-D3) and have no standalone value apart
from each other. `tsk-6b6` (already filed, already `deps: [tsk-63c]`)
is the correctly-separated next consumer of this item's `id`-optional
shape — it does not need to be re-created here.

## Verify

`npm test` (state + cli + runner + e2e suite) green, including the new
cases named above.
