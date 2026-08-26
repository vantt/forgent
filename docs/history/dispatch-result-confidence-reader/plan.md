# Plan — dispatch-result-confidence-reader (tsk-1g6)

Mode: small

No CONTEXT.md exists — discovery verdict was `clear` (skipped `exploring`),
per `RESEARCH.md` round 1. This item never went through a Socratic gate;
the decisions below are grounded directly in that research and in the
item's own submitted acceptance criteria, cited inline.

## Approach

**Chosen path.** Add a new read-only top-level CLI verb, `fgos
dispatch-report [id]`, registered in `src/cli/command-registry.mjs`
following the exact metadata shape `graph`/`triage` already use there
(`name`/`invoke`/`description`/`parameters`/`examples`/`touchesState:
false`/`requiresExistingStore: true`/`externalEffect: false`). Its handler
(new module, `src/report/dispatch-confidence.mjs`) classifies each real
dispatch it finds as one of `reported | legacy-signal | inferred |
missing`:

- **`reported`** — the adapter's own structured result already carried a
  real, non-heuristic outcome (whatever `...result` on `executeExecutorCli`'s
  `base` object already provides beyond the token/git-delta ladder,
  `src/runner/dispatch/cli.mjs:513`).
- **`legacy-signal`** — classified from the `[DONE]`/`[BLOCKED]` token in
  the worker's own raw stdout (the same detection tsk-2tr is extracting
  into a reusable helper — this reader calls that helper, never
  re-implements the regex/token-scan itself, per RESEARCH.md round 1's own
  finding that duplicating it is exactly what tsk-2tr exists to prevent).
- **`inferred`** — no token found; classified from the git-head-delta
  fallback (`headBefore`/`headAfter`/`verifiedSha`), same source.
- **`missing`** — no worker-log entry at all for this dispatch (a
  durable `executor.dispatch` event exists per `loop.mjs:924`, since that
  event carries no outcome field of its own per RESEARCH.md round 1 —
  this case is expected to be common for real production dispatches
  today, not a bug).

**Data sources read** (RESEARCH.md round 1, all citations there):
`executor.dispatch` events (`.fgos/events*` — id/executorId/provider/
command/model/baseCommit/headRef/governance, no outcome) joined against
`appendWorkerLog`'s per-attempt raw log (`.fgos/logs/<id>.log` via
`src/runner/worker-log.mjs` — carries `stdout`/`status`/`signal`, the one
source with enough raw material to re-run the ladder classification
after the fact). The separate `addOutcome`/`fgos check` predicted-vs-
actual mechanism (goal-check pass/fail) is a different signal with its
own existing reader — out of scope here, not reused, not duplicated.

**Alternatives rejected.**
- *Extend `fgos show`/`fgos list` instead of a new verb* (the item's own
  text offered this as an equally acceptable option) — rejected because
  `show`/`list` are per-item detail/listing surfaces; confidence
  classification is a cross-cutting query over event+log history for one
  or many items, closer in shape to `graph`/`triage` (both already
  read-only, both already fold multiple state sources) than to `show`.
  A new verb also gets its own `examples`/`description` in the CLI's own
  self-documenting registry, vs. a bolted-on flag on an existing verb
  whose description would then need to explain two unrelated concerns.
- *Add the `confidence` field to the durable `executor.dispatch` event
  now, then read that field* — rejected: this is exactly the "write-only
  telemetry" both this item's and tsk-2tr's own acceptance criteria
  explicitly forbid before a reader exists. Building the reader first,
  against data already on disk, is the whole point of this item's
  ordering relative to tsk-2tr.

**Risk map.**
| Component | Risk | What would prove it |
|---|---|---|
| Depending on tsk-2tr's not-yet-merged helper | medium — tsk-2tr is `doing`/`clarify` today, not `done` | `fgos-coding-validating`'s reality check must confirm tsk-2tr's status before this item enters `executing`; if still open, that is a real block to report, not a guess to route around (deps are declared but not yet engine-enforced as a hard claim gate — confirmed live during this item's own `fgos pick`, which succeeded despite the open dep) |
| Reading two independent on-disk sources (events + worker-log) and joining by id | light — pure read, no state mutation | `node --test test/runner/dispatch.test.mjs` exercises the join against fixture event/log data |

Impact-analysis posture: **full** — `fgos tool query --capability
impact-analysis --status present` returned GitNexus `present`
(`mcp:gitnexus`), freshly checked this session. Blast radius is inherently
small regardless: every touched file is either new (`report.mjs`, its
test) or an additive registration line (`command-registry.mjs`) — no
existing behavior changes.

**Files touched, in order:**
1. `src/report/dispatch-confidence.mjs` (new) — the classification reader,
   importing tsk-2tr's extracted ladder helper once that lands.
2. `src/cli/command-registry.mjs` — register the `dispatch-report` verb.
3. `test/runner/dispatch.test.mjs` (extended) — new test cases for the
   reader, per the item's own Verify field.
4. `docs/history/dispatch-result-confidence-reader/plan.md` (this file).

## Shape

A `small`-lane item: one new module plus one new CLI registration, no
phased rollout needed.

Cases worth proving in the new tests: (a) a dispatch with a `legacy-signal`
token present classifies correctly; (b) a dispatch with no token but a
head delta classifies `inferred`; (c) a dispatch with a durable
`executor.dispatch` event but no matching worker-log entry classifies
`missing`, never silently dropped or mis-classified as `inferred`; (d) an
id with zero dispatch history at all is reported plainly, not as an
error.

## Outstanding questions

None
