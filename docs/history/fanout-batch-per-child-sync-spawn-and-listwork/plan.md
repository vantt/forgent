# Plan — fanout-batch per-child sync spawn and listWork reread (tsk-2ewi)

**Revised after a validating-stage reality-gate FAIL** (`fgos decision`
seq 11) — the original round's sub-fix 2 (non-blocking git attestation)
is dropped from this item's approach; see "2. Non-blocking git
attestation — considered and rejected" below for why.

Mode: standard (2 flags: existing covered behavior —
`fanoutBatchExecutorCli` is already exercised by
`test/runner/dispatch.test.mjs`, e.g. the `slotsFull`/trimming tests
around line 4774; weak proof around the area — no existing test proves
per-child dispatch stays correct once the `listWork` read is collapsed,
RESEARCH.md round 1's "Still open" section). No hard-gate flag applies
(no auth/data-loss/audit/external-provider/validation-removal). Applied
via `fgos-routing`'s own Mode-gate subsection directly, per this skill's
direct-entry fallback — this session entered through `/fgOS:pick` →
`fgos-coding-driving`, never through `fgos-routing` itself.

## Locked decisions this plan honors

No `CONTEXT.md` exists — discovery's own `clear` verdict skipped
`exploring` (same shape as this item's own sibling tsk-5v3, whose plan.md
records the identical situation). Source of truth: this item's own
`RESEARCH.md` (`docs/history/fanout-batch-per-child-sync-spawn-and-listwork/RESEARCH.md`,
round 1), which independently confirmed all three of the item's own
sub-claims against current `main` (post-tsk-5v3 merge) with exact line
citations.

## No split

Three sub-fixes below are independently scoped, but none has a
CONTEXT.md "Locked decisions" table to cite a decision id from (per
`references/split-and-child-specs.md`'s mandatory `action` field for a
split child) — same constraint tsk-5v3 hit and resolved the same way.
Landing all three under one item, ordered by risk, keeps the honest
option open (this skill's own "No split" default) instead of inventing a
citation to satisfy the split shape.

## Approach

**Chosen path:** one low-risk mechanical change inside
`src/runner/dispatch/cli.mjs` (sub-fix 1), plus one still-open
follow-up proof point (sub-fix 3). Sub-fix 2 was investigated and
rejected this round — see below.

### 1. Collapse the per-child `listWork` reread (low risk)

`fanoutBatchExecutorCli` (`cli.mjs:744`) already reads
`const slotsView = listWork(fgosDir)` once, for the worker-slot room
check, before `batchToRun`/`deferred` are sliced (`:752-753`) and before
any child's closure starts. The per-child closure then re-reads
`listWork(fgosDir).work[candidateId]` again at `:761`, INSIDE
`Promise.allSettled(batchToRun.map(async (candidateId) => {...`.

Traced this round: because `execFileSync` (the `pick` call at `:787`) is
a blocking call with no `await` before it, each child's async closure
body runs synchronously up to its own `pick` call before the NEXT
child's closure body starts running at all — the closures are not truly
interleaved until each one's first real `await`
(`executeExecutorCli`, `:797`). This means candidate `N`'s own record in
`slotsView` (captured before ANY child ran) can only be stale if
candidate `N`'s OWN prior `pick`/`return` already mutated ITS OWN
`work[N]` entry between `:744` and `:761` — which cannot happen, since
that mutation only happens via that SAME candidate's OWN `pick` call,
which runs strictly AFTER its own `:761` lookup (`:761` before `:787` in
source order, same closure). A prior sibling candidate's `pick`/`return`
mutates only THAT sibling's own record, never candidate `N`'s. So
reusing `slotsView.work[candidateId]` in place of the `:761` re-read is
behavior-preserving for this specific per-candidate field access — no
staleness window opens that the current code does not already tolerate.

**Change:** replace `const workItem = listWork(fgosDir).work[candidateId];`
(`:761`) with `const workItem = slotsView.work[candidateId];`, closing
over the `slotsView` already in scope from `:744`. No signature change,
no new parameter.

**Proof point:** `node --test test/runner/dispatch.test.mjs` (this
item's own synced `verify`) — the existing `fanoutBatchExecutorCli` tests
already assert on `workItem`-derived fields (`executorId`, dispatch
outcome), so a wrong collapse fails loud there.

### 2. Non-blocking git attestation — considered and rejected

`captureDispatchAttestation` (`transport.mjs:113`) runs two
`execFileSync('git', ...)` calls (`rev-parse HEAD`,
`symbolic-ref --short -q HEAD`), synchronous and blocking, inside
`resolveExecutorCommand` (`transport.mjs:135`), itself synchronous. The
original round of this plan proposed making `resolveExecutorCommand`
`async` (via `execFile`) to unblock these two calls, contingent on
picking a caller-conversion path for `resolveExecutorCommand`'s other
real caller, `spawnWorker` (`cli.mjs:194`).

**Rejected at validating, with direct evidence (`fgos decision` seq
11):** `resolveExecutorCommand` is also where `RunnerConfigError` gets
thrown for a malformed tier/config — `cli.mjs:195-200`'s own comment
states this is deliberate: "Setup stays synchronous and OUTSIDE the
adapter call on purpose... a malformed tier/config... must still throw
synchronously, before any process is spawned." `test/runner/
dispatch.test.mjs:2867-2871` pins exactly this:
`spawnWorker throws a RunnerConfigError (not DispatchError) for an
unconfigured tier, before any spawn`, asserted with `assert.throws(() =>
spawnWorker(...), RunnerConfigError)` — a synchronous-throw assertion
that a rejected Promise does not satisfy. Making `resolveExecutorCommand`
`async` converts EVERY error thrown inside it, not just the two git
calls, into a rejected Promise — this breaks the pinned contract
regardless of which of the original (a)/(b)/(c) caller-conversion paths
is chosen; the choice of caller was never the actual constraint.

Separately, proportionality: the item's own description cites the real
bottleneck as cold Node process starts for `pick`/`return`
(~100-300ms+ each, sub-fix 3's own subject); two `git` subprocess calls
are typically single-digit-to-low-double-digit ms on a warm filesystem
cache — a fraction of that cost. Restructuring a synchronous-throw
contract two production call sites depend on, to shave a small fraction
of the item's own cited bottleneck, fails the Reality Gate's "smaller
path" dimension on its own even setting the broken-contract finding
aside.

**No change made for this sub-fix.** Left as a rejected alternative here
for the record, not carried into `## Files likely touched` or this
item's own `footprint`/`action`.

### 3. In-process `pick`/`return` (highest risk — NOT decided this round, named as an open proof point)

Per the item's own framing ("Đây là design-check chứ không phải fix cơ
học thuần tuý... cần xác nhận pick/return không dựa vào process isolation
trước khi đổi") and RESEARCH.md round 1 finding 5: `pick`'s own top-level
handler (`bin/fgos.mjs:3001-3058`) is confirmed clean — it derives
`repoRoot` from the explicit `--dir` flag, never `process.cwd()`
(a deliberate tsk-k8u fix). `return`'s own handler and its full call
graph (verify execution in particular) were **not traced this round** —
this codebase's own documented invariant (`worktree.mjs:403-418`,
attached to an `approve`-side guard) that `process.cwd()` is trusted as
"the real, live cwd of whatever process invoked it" is a genuine hazard
IF anything in `return`'s call graph relies on it, since converting to
in-process calls collapses N independent subprocess `cwd`s into one
shared `process.cwd()` for the whole batch.

**No change proposed here.** This sub-fix stays a named risk-map entry
with its own proof point, not an approach this plan commits to:

**Proof point (for `fgos-coding-validating`):** trace `return`'s full
call graph (`bin/fgos.mjs`, `case 'return':` at line 3069 onward, plus
whatever `verify`-execution helper it calls) for any `process.cwd()`
read that is not routed through an explicit path parameter — using
GitNexus (`impact-analysis: full`, already confirmed present this
session) to enumerate `return`'s callees rather than a manual grep sweep.
If the trace comes back clean (no reliance), the in-process conversion
becomes a real, separately-scoped follow-up item (its own footprint,
its own verify) — not folded into this item's own footprint, since a
"convert both pick and return to in-process calls" change is its own
unit of risk distinct from the two mechanical fixes above. If the trace
finds a reliance, that reliance itself becomes the write-up (a `fgos
learning`/friction note, not a fix forced through anyway).

## Files likely touched

- `src/runner/dispatch/cli.mjs` — sub-fix 1 (`:761`) only.
- `test/runner/dispatch.test.mjs` — existing `fanoutBatchExecutorCli`
  tests already assert on `workItem`-derived fields, exercised as
  regression for sub-fix 1; no new test file needed.
- `docs/history/fanout-batch-per-child-sync-spawn-and-listwork/plan.md`
  (this file) and `RESEARCH.md`.

`fgos graph --json` was read this round (`componentCount: 588`,
`topUnblock` skipped by the engine for this graph size) — this item sits
in a small, low-fan-out component of the work graph (only tsk-5v3 as a
dependency, no items declare tsk-2ewi as their own dependency yet), so
nothing else in the graph is waiting on this item's completion order.

## Outstanding questions

None
