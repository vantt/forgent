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
false`/`requiresExistingStore: false`/`externalEffect: false` — corrected
round 2: `graph`/`triage` both actually set `requiresExistingStore:
false`, direct read `command-registry.mjs:1064` — consistent with this
reader's own `missing`-by-default degradation, so a missing/empty store
should read as empty rather than refuse). Its handler
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
`.fgos/logs/<id>.log` (written by `src/runner/worker-log.mjs`'s
`appendWorkerLog`/`appendWorkerLogChunk`, the one source with enough raw
material to re-run the ladder classification after the fact). The
separate `addOutcome`/`fgos check` predicted-vs-actual mechanism
(goal-check pass/fail) is a different signal with its own existing
reader — out of scope here, not reused, not duplicated.

**Reality-gate correction (round 2, repo-fit FAIL on round 1's own
Approach — direct reads of `src/runner/worker-log.mjs:1-104` and
`.gitignore:17`):** `worker-log.mjs` exports only write functions
(`appendWorkerLog`, `appendWorkerLogChunk`) — no reader of its own to
build on. `.fgos/logs/<id>.log` is not structured data; it is free-text,
human-tail-oriented blocks (`=== <timestamp> | work <id> | attempt N |
... === \nmessage: ...\n--- STDOUT ---\n<raw>\n--- STDERR ---\n<raw>`),
so the new module must itself regex-split on the `=== ... ===` markers
and extract the `--- STDOUT ---` section before it can hand text to
tsk-2tr's token-scan helper. More materially: `.fgos/logs/` is listed in
`.gitignore` — explicitly local-only, per-machine, git-ignored
observability the module's own docstring calls "never load-bearing."
This means classification is **best-effort and machine-scoped by
construction**, not a durable cross-session record: `legacy-signal`/
`inferred` are only reachable for a dispatch whose log file still exists
on THIS machine (not rotated/cleaned, not run elsewhere) — `missing` is
therefore the honest DEFAULT outcome for most historical dispatches, not
a rare edge case. The reader's own `--description` (command-registry.mjs)
and any docs must say this plainly — "best-effort, this-machine-only,
degrades to `missing`" — rather than imply a durable production record
that does not exist today. This does not change the chosen path (still
worth building — it is real signal when the log survives, and a
`missing` majority is itself useful information about how thin today's
durable record is), only its honestly-stated scope.

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
| Parsing the free-text `.fgos/logs/<id>.log` format (round 2 correction above) | light — a fixed, small format the writer itself controls (`formatEntry` in `worker-log.mjs`); a malformed/absent file must degrade to `missing`, never throw | test asserts a missing/corrupt log file classifies `missing` rather than erroring |

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
token present in its local `.fgos/logs/<id>.log` classifies correctly;
(b) a dispatch with a local log but no token, only a head delta,
classifies `inferred`; (c) a dispatch with a durable `executor.dispatch`
event but no local log file at all (rotated away, run on another
machine, or never captured) classifies `missing`, never silently dropped
or mis-classified as `inferred` — this is expected to be the majority
case in real usage, not an edge case; (d) a present-but-malformed local
log file (round 2 correction) degrades to `missing` rather than throwing;
(e) an id with zero dispatch history at all is reported plainly, not as
an error.

## Outstanding questions

None
