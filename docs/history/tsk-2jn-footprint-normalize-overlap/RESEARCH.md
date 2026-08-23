# Research: tsk-2jn — footprintOverlapAmong skips normalizePath

## Round 1 — 2026-08-14 (discovery stage)

**Asked:** Does the current code still match Finding 6's description
(`footprintOverlapAmong` compares raw declared paths, no `normalizePath`,
unlike `buildOwnFileSet`/`frozenJudgeHits`)? Is the suggested direction
("normalize both footprints... a single choke-point all callers inherit")
directly implementable, or does it need scoping (per Finding 6's own note
distinguishing it from tsk-11v/tsk-4so)?

**Checked:**
- `src/state/graph-metrics.mjs:598-612` (`footprintOverlapAmong`),
  `:614-624` (`footprintOverlap`, a thin wrapper) — read directly. Confirmed:
  plain `Array.filter`/`Set.has` on the raw declared `footprint` strings, no
  normalization anywhere.
- `src/runner/frozen-judge.mjs:42-44` (`normalizePath`) — read directly:
  `String(p).replace(/\\/g, '/').replace(/^\.\//, '').trim()`. Zero-dep
  module (`grep -n "^import" frozen-judge.mjs` — no hits), so importing it
  into `graph-metrics.mjs` (`src/state/`) carries no circular-import risk.
- `src/runner/frozen-judge.mjs:57-61` (`frozenJudgeHits`) — read directly:
  already normalizes both the declared footprint (`.map(normalizePath)`)
  and each changed file (`normalizePath(raw)`) before comparing. Its own
  doc comment claims "the same semantics `footprintOverlap` already uses" —
  confirmed this specific claim is currently FALSE (the whole reason this
  finding exists); it becomes true again once this fix lands.
- `test/state/graph-metrics.test.mjs` — grepped for `footprintOverlapAmong`/
  `footprintOverlap`: existing tests call the wrapper `footprintOverlap(view)`,
  never the raw function directly; `shared` is asserted to contain the
  FIRST item's own as-declared spelling (`assert.deepEqual(out[0].shared,
  ['b.mjs', 'a.mjs'])`, the FIFO-order test) — confirms the report's own
  distinction between "compare normalized" and "report as declared" is the
  right shape to preserve.

**Found:** the report's own suggested direction is directly implementable
as stated, no correction needed this time (unlike tsk-ikd). The scope note
("Distinct from tsk-11v (deps edges) and tsk-4so (step scoping)") confirms
this item is path-normalization only — no change to which candidates are
compared or how deps/step-scoping affect the frontier, both explicitly
out of scope and left untouched.

**Decided:** normalize both sides of the membership check through
`normalizePath` inside `footprintOverlapAmong` — the comparison SIDE only.
`shared` continues to report item A's own original, as-declared path
string (never the normalized form) — a detector, not a rewriter, and the
raw string is what a person resolving the conflict actually typed into
`footprint`. Matches `frozenJudgeHits`'s own precedent exactly (declared
side normalized for comparison, changed-file side normalized too — the
one asymmetry here, "report A's raw spelling," is deliberate: unlike
`frozenJudgeHits` there is no single "real" changed-file list to prefer
reporting, both sides are equally hand-declared).

**Remaining open:** none.

**Verify (real, runnable):**
```
node --test test/state/graph-metrics.test.mjs
```
(existing suite covering `footprintOverlap`/`computeSchedule`; two new
cases added reproducing Finding 6's exact scenario — a `./`-prefixed path
and a backslash-spelled path, each now correctly flagged as conflicting
with its plain-spelled counterpart.)
