# Plan: tsk-2xg — close the manual-merge `.fgos/*` deadlock via `merge=union`

Mode: high-risk

Flags counted (`fgos-routing`'s Mode gate, applied directly — item entered
this session via `/fgOS:pick` → `fgos-coding-driving`, no prior lane
handed off): **audit/security** (append-only `.fgos/*` diagnostic logs, one
already has a documented real data-loss precedent —
`docs/history/live-events-seq-corruption/CONTEXT.md`, tsk-n4i), **data
loss** (hard-gate on its own — a wrong fix here risks silently dropping
real fault/warning records, the same class of incident tsk-n4i already
caused once), **existing covered behavior** (`test/runner/merge.test.mjs`,
`test/cli/fgos-approve.test.mjs` already assert `fgos-write-rejected`'s
one-sided-drift-is-safe behavior — tsk-2f6's own 3 reproductions — this
change must not regress that), **weak proof around the area** (no existing
test constructs the two-sided-drift-after-forced-restore scenario this item
fixes — `RESEARCH.md` point 7). 4 flags plus 2 hard-gate flags on their own
→ **high-risk**, regardless of count.

## Approach

**Chosen path:** add `.gitattributes merge=union` for the three remaining
append-only `.fgos/*.jsonl` diagnostic logs that do not already have it —
`.fgos/approve-post-success-faults.jsonl`, `.fgos/invocation-faults.jsonl`,
`.fgos/main-checkout-guard-warnings.jsonl` — the exact same fix
`.fgos/events.jsonl` already got via `.gitattributes merge=union` (tsk-3wq).
No code change to `src/runner/merge.mjs`, `.githooks/pre-commit`, or any
`fgos` verb.

**Why this closes the deadlock (traced in `RESEARCH.md` point 5):** the
pre-commit hook's zero-tolerance rule on `fgw/*` branches
(`stagedFgosChangesOnWorkerBranch`) is correct and stays unconditional — a
worker branch restoring `.fgos/*` back to its own pre-merge value before
committing is the intended behavior (ADR0020: workers never own `.fgos/*`
content), not the bug. The bug is downstream: that restoration is, from
git's point of view, a *revert* relative to the merge-base main snapshot the
worker's manual merge captured. When main grows this file further before
`approve` runs, `mergeRunnerItemLocked`'s merge-into-main sees BOTH sides
diverge from that base (main: appended; worker: reverted) — for a plain
line-based 3-way merge (no driver) on an append-only log, this either
conflicts outright or resolves to something that is not byte-identical to
main's current `HEAD`, and `fgos-write-rejected` fires on the staged diff
either way. A `merge=union` driver resolves this class of divergence by
keeping lines from BOTH sides instead of applying either side's deletion —
for a real append-only log, "keep everything from both sides" is the
*correct* semantic answer (nothing was legitimately deleted; the worker's
side never intended to remove anything, it only carried a stale snapshot),
and the result equals main's own current superset — so the staged diff
against `HEAD` after `approve`'s merge is empty for that path, and
`fgos-write-rejected` never fires. This is exactly `events.jsonl`'s already-
proven mechanism (tsk-3wq), applied to the three logs that are missing it.

**Alternative rejected — programmatic `git checkout --ours` for every
`.fgos/*` path immediately after every `git merge --no-commit` in
`performCatchUp`/`mergeRunnerItemLocked`, before the staged-diff check:**
would need new logic in the one place `src/runner/merge.mjs`'s own comments
(line 674-690, tsk-1lv review-fix F12) already flag as previously
over-corrected on a wrong assumption — touching the shared write-door
mechanism itself is exactly the higher-blast-radius move that comment warns
against making without direct proof of necessity. It would also only patch
the two *automated* call sites, not the actual failure mode observed on
`fgw/tsk-3ve` (a human/agent running `git merge main` manually, outside any
`fgos` verb, specifically because `performCatchUp` already gave up
all-or-nothing on the real, non-`.fgos` conflict) — so it does not even
reach the code path where the real incident happened. `merge=union` is
config-only, has zero blast radius on `merge.mjs`/the pre-commit hook, and
already has one proven, shipped precedent in this exact codebase.

**Files touched:** `.gitattributes` (3 new lines, same shape as the
existing `events.jsonl` line, each documenting why per that line's own
comment style) — this is the only source file this fix touches. A
regression test is added to prove the mechanism, see Shape below.

**Order:** single change, no sequencing needed — `fgos graph tsk-2xg
--json` (source: this session) reports `deps: []`, no dependents; this item
is not on any other item's critical path today.

**Impact-analysis posture:** `full` (GitNexus `present` per `fgos tool
query --capability impact-analysis --status present`, this session).
Cross-checked directly against a `grep` per CLAUDE.md's standing advice
rather than trusting only the graph tool (matching `tsk-2f6`'s own
precedent): `stagedFgosChangesOnWorkerBranch` (the pre-commit hook wall,
untouched by this fix) has exactly one call site
(`.githooks/pre-commit:337`); the three target basenames
(`approve-post-success-faults.jsonl`, `invocation-faults.jsonl`,
`main-checkout-guard-warnings.jsonl`) are each defined in exactly one
module (`src/cli/approve-fault-log.mjs`, `src/cli/invocation-fault-log.mjs`,
`src/state/main-checkout-guard-warnings.mjs`) and are all pure
`fs.appendFileSync` write logs with no `seq`/positional-identity contract
like `events.jsonl` has — `main-checkout-guard-warnings.mjs`'s own
`readMainCheckoutGuardWarnings` (the only reader among the three, line 42)
parses each line independently into a self-describing record (its own
`ts` field), never assumes file order — so `merge=union`'s line-reordering
is safe for all three, unlike `events.jsonl`, which needed a companion
contiguity-fixer (`scripts/events-jsonl-contiguity.mjs`) precisely because
its identity WAS positional (`seq`) at the time tsk-3wq shipped. Blast
radius for this change is self-contained: `.gitattributes` plus the new
test.

## Shape

Concrete cases to prove (high-risk lane, per Shape's own guidance):

1. **The exact real-incident shape (boundary case, existing behavior must
   not regress differently than it already does):** simulate `fgw/tsk-3ve`'s
   own sequence in a disposable sandbox repo — branch from a commit where
   `.fgos/approve-post-success-faults.jsonl` has content X, append more
   lines to it on `main` (simulating other approves), do a manual `git
   merge main` on the worker branch (simulating the forced fallback),
   restore `.fgos/*` back to the worker's own pre-merge value (simulating
   the pre-commit-hook-forced restore), commit, then run `approve`'s real
   merge-into-main path (`mergeRunnerItemLocked`) against a main that has
   grown the file even further since the worker's manual merge. Before this
   fix: reproduces `fgos-write-rejected`. After this fix (with
   `.gitattributes merge=union` in place): merges cleanly, and the merged
   file on main contains every line both sides ever added (no data loss —
   the two-sided-append case the `merge=union` driver is explicit about
   handling correctly, same guarantee `events.jsonl` already relies on).
2. **Existing one-sided-drift case must still pass (regression guard):**
   `tsk-2f6`'s own 3 reproductions (single drift, double drift, new-file
   drift) — `test/runner/merge.test.mjs`/`test/cli/fgos-approve.test.mjs` —
   must still pass unchanged; `merge=union` does not change behavior for a
   file only one side touched.
3. **Concurrent-writer duplicate-line safety (partial-failure sketch):** if
   both the worker's pre-merge value and main's later growth happen to
   contain an IDENTICAL line (should not normally occur — each record
   carries its own `ts`, collision would require two writes in the same
   millisecond from genuinely different processes), confirm the union
   result is still valid JSONL (one JSON object per line, parseable) even
   if it contains a byte-identical duplicate line — `readMainCheckoutGuardWarnings`
   and any future reader of the other two logs tolerate duplicate,
   independently-parseable records (each is a standalone diagnostic entry,
   not a state machine input) — so a rare duplicate is a harmless
   redundant record, not corruption. No dedup step is needed for these
   three files (unlike `events.jsonl`'s `seq`-collision problem, which
   these files structurally cannot have — see Approach's impact-analysis
   note).

Assumption pinned (not material — implementation-only, does not change
scope/behavior/acceptance criteria): the `git config` needed for the
`union` merge driver to actually run (`git config merge.union.driver true`
or equivalent) is either already set repo-wide from `events.jsonl`'s own
tsk-3wq setup, or `union` is one of git's built-in named strategies needing
no config at all (`.gitattributes`'s own comment on the `events.jsonl` line
says exactly this: "`union` is git's own built-in merge driver (no local
config needed)") — validating's reality check confirms this holds for a
fresh clone/worktree, not assumed here.

## Outstanding questions

None
