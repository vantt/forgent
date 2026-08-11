# events-jsonl-merge-driver-recurring-write-loss — plan

Mode: high-risk

**Why high-risk, not standard:** hits two hard-gate flags on its own —
this touches the shared audit/state log's data integrity (a "data loss"
class change: the whole point is preventing silent event loss) and the
event log doubles as the platform's own audit trail (audit/security
flag). It also lands on `existing covered behavior` (`events.mjs`,
`store.mjs` both carry existing tests that must not regress) and `weak
proof around the area` (a concurrent-branch-merge race is hard to prove
deterministically — same shape `tsk-18a`'s own D2 already named for a
sibling merge-race bug: "proof of done requires an actual live/simulated
concurrent-race reproduction attempt, not a code-fix-only unit test"). 4
flags plus 2 hard-gate flags — well past the `standard` threshold
(`fgos-routing`'s Mode-gate: 4+ flags or any hard-gate flag → high-risk).

`impact-analysis: degraded` (corrected at validating time, tsk-j7y: a
`present` status only ever means installed, never fresh) — `fgos tool
query --capability impact-analysis --status present` still reports
`present`, but GitNexus's own index is 334 commits behind current HEAD
(last indexed `4ce7a96`). No feasibility-matrix row below actually leans
on GitNexus blast-radius evidence for its proof (each row's evidence is a
file read, an existing test result, or a live/simulated repro instead), so
this gap does not block validating — named plainly per the degraded
posture's own requirement, not silently dropped.

## Approach

Chosen path (CONTEXT.md D1): route `.fgos/events.jsonl` through a merge
strategy that folds two divergent event-log histories append-log-aware,
instead of relying on git's plain line-based textual 3-way merge.
Rejected alternatives (already argued in CONTEXT.md D1): stop-committing
entirely (bigger behavior change, no backup story yet) and guard-only
(only detects after the fact, doesn't prevent loss — the exact gap that
let this recur three times since tsk-n4i).

**Revised twice at `fgos-coding-validating` time (Smaller-path / Repo-fit
checks, still honoring D1's underlying decision — never reopened, only
its technical realization corrected against reality):**

- **Revision 1 (smaller primitive):** the first draft called for a
  from-scratch script parsing git's `%O`/`%A`/`%B` merge-driver contract.
  Reality-gate evidence found a smaller path: git ships a documented
  built-in `union` merge driver (`git help attributes` → "Built-in merge
  drivers" → `union`: "Run 3-way file level merge for text files, but take
  lines from both versions, instead of leaving conflict markers... tends
  to leave the added lines... in random order and the user should verify
  the result") that needs only a `.gitattributes` line — no local git
  config, no per-machine registration, no `fgos setup` wiring, since it's
  a plain versioned file every checkout already reads. `events.jsonl` is
  provably append-only (`src/state/events.mjs`'s own header: "this module
  only appends"), so `union`'s line-combination is exactly the right
  primitive for the union half of D1 — it just doesn't renumber `seq` or
  guarantee order ("random order... verify the result"), which is exactly
  the gap this item's own small script still needs to close.
- **Revision 2 (wrong wiring point, found before locking it):** the
  second draft proposed a fixup call inside `src/runner/merge.mjs`'s
  `mergeRunnerItemLocked`, between the staged `git merge --no-commit
  --no-ff` and `runGoalCheck`. Re-reading that function
  (`src/runner/merge.mjs:877-891`) found it ALREADY aborts the merge
  outright and returns `outcome: 'fgos-write-rejected'` the moment ANY
  `.fgos/` path shows up in `git diff --name-only --cached` — a fixup call
  placed after that check would never run; placed before it would require
  also loosening or reordering an existing, deliberate guard, a bigger and
  separate design question CONTEXT.md's decisions never asked for.
  `git log -S "fgos-write-rejected"` dates that guard to `59551886`
  (2026-07-28 19:58), a few hours AFTER tsk-n4i's two corrupting merge
  commits — almost certainly added in direct response to that incident.
  Yet the three NEW repros this item reports (tsk-4vo/tsk-5td/tsk-2x9k,
  2026-08-09/10) all happened roughly two weeks AFTER that guard already
  existed, and `grep -rn "'merge'\]" src bin scripts` finds `merge.mjs` is
  the ONLY place fgOS's own code ever runs `git merge` — so the new
  repros cannot be coming through `fgos merge`'s own (already-guarded)
  path at all. The live, still-unguarded vector is a raw `git merge`/
  hand-resolution run directly by a session outside any fgOS verb (exactly
  tsk-n4i's own original D1 finding, and matching this repo's own visible
  "catch-up: merge main into fgw/<id>" commit pattern). This is WHY
  `.gitattributes: merge=union` is the right fix and no `merge.mjs` change
  is: a `.gitattributes` entry is git-level and path-scoped, so it applies
  uniformly to every `git merge` regardless of who invokes it, unlike
  anything wired into one function. Full evidence trail:
  `docs/history/events-jsonl-merge-driver-recurring-write-loss/
  RESEARCH.md` Round 2.

Three components, all in this one item per CONTEXT.md D2/D3 (no split):

1. **Merge driver (D1's core fix), git-builtin only.** `.gitattributes`
   (new file — none exists in this repo today, checked):
   `.fgos/events.jsonl merge=union`. No `[merge "..."]` config block, no
   `fgos setup`/`doctor` registration, and no `merge.mjs` change — `union`
   is git-native, resolved straight from the versioned `.gitattributes`
   line on every checkout and every `git merge` invocation, including ad
   hoc ones a session runs directly (the actual, confirmed vector — see
   Revision 2 above).
2. **`repairTruncatedLastLine` lock fix (D2), unchanged.** Wrap its
   read-modify-write in the same `withEventsLock` scope `store.mjs`'s own
   mutators already use for a precondition-read-then-append critical
   section (`src/state/store.mjs:30, 248, 363`) — `src/state/
   events.mjs:141-184` becomes a locked read → validate → backup → write,
   one critical section, closing the exact gap its own docstring already
   names.
3. **Contiguity audit + repair (D3), a new `fgos doctor` check.** One new
   script, `scripts/events-jsonl-contiguity.mjs`, with two modes (reused
   both directly and via the doctor registration below):
   - `--check <path>`: read-only, reports any `seq` break/duplicate,
     non-zero exit if found.
   - `--fix <path>`: dedupes exact-duplicate lines (guards the `union`
     driver's own documented "random order" / possible-duplicate
     behavior) and renumbers `seq` 1..N contiguously over the remaining
     lines, in original relative order — reuses `src/state/events.mjs`'s
     own line-parsing (`readEvents`), not a reimplementation.

   Registered into `fgos doctor`'s existing check registry
   (`src/setup/registrations.mjs`, `registerCheck({id:
   'events-jsonl-contiguous', ...})` calling `--check` against the live
   `.fgos/events.jsonl`, `registerFix` calling `--fix`) — precedent
   confirmed at validating time: `checkRootDrift`
   (`src/setup/registrations.mjs:441-...`, tsk-5m7) already shows the
   registry holds repo/data-health checks, not only local-machine-config
   ones, so this is the right home, not a stretch. This is what turns
   `union`'s own documented order-scrambling/possible-duplicate residue
   into something `fgos doctor` catches proactively — regardless of which
   git operation (any ad hoc merge, not just `fgos merge`) produced it —
   rather than only being discovered when a migrate script trips over it,
   which is exactly how tsk-n4i's own historical corruption was first
   found.

**Order:** (1) `events-jsonl-contiguity.mjs` (`--check`/`--fix`) first —
needed by the doctor registration and independently useful (its `--check`
mode against the live log is already partially proven from exploring);
(2) the doctor check/fix registration next, depends on (1); (3)
`.gitattributes` (independent of 1-2, can happen anytime, listed here for
narrative order); (4) the `repairTruncatedLastLine` lock fix last —
smallest, fully independent of the other three, no reason to block on it.

## Risk map

| Component | How risky | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `union` driver correctness (D1's core fix) | Medium (down from the first draft's High — this is now git's own battle-tested built-in, not custom parsing code; the only real unknown is whether it behaves as documented for THIS repo's real branch-divergence shapes) | A live/simulated repro: create two divergent branches each appending real events to `.fgos/events.jsonl` since a common ancestor, run an ad hoc `git merge` (not through `fgos merge`) with `.gitattributes` wired, assert the merge completes with no conflict and the result contains every event from both sides (order/seq not yet fixed at this point — that's component 3's job) — same "actual repro, not just a unit test" bar `tsk-18a` D2 already set for this class of bug |
| `--check`/`--fix` correctness | Medium — getting dedup/reseq wrong is worse than leaving it alone (could silently fabricate a seq or drop a genuine duplicate) | Run `--check`/`--fix` against a synthetic fixture with an injected duplicate-seq and an injected gap; also run `--fix` on the output of the live repro above and assert the result is fully contiguous with no event lost |
| `repairTruncatedLastLine` lock fix | Low — small, isolated function, existing tests already cover the happy path | A test that starts a concurrent `appendEvent` mid-`repairTruncatedLastLine` (or mocks the timing) and asserts the append is never silently dropped |
| Doctor check/fix registration | Low — mirrors an existing, tested pattern (`checkRootDrift`, `checkMainCheckoutHookWired`) | `test/setup/checks.test.mjs`-style case: `fgos doctor` reports the new check red against a corrupted fixture, green against the live log; the registered fix resolves it |
| Regression on existing `events.mjs`/`store.mjs` tests | Medium (existing covered behavior flag) | `node --test test/state/events.test.mjs test/state/store.test.mjs` stays green |

`src/runner/merge.mjs` is explicitly NOT touched by this item (Revision 2
above) — no risk-map row for it; its existing `fgos-write-rejected` guard
is unchanged and unaffected either way (`union` still leaves
`.fgos/events.jsonl` a staged, changed path from `fgos merge`'s own
narrower perspective, so that guard still fires there exactly as before).

## Files touched

- `.gitattributes` (new)
- `scripts/events-jsonl-contiguity.mjs` (new, `--check`/`--fix`)
- `src/setup/registrations.mjs` (new `registerCheck`/`registerFix` pair)
- `src/state/events.mjs` (`repairTruncatedLastLine`, lock fix)
- `test/state/events.test.mjs` (new/updated cases for the lock fix),
  `test/setup/checks.test.mjs` (new cases for the doctor registration),
  `test/scripts/events-jsonl-contiguity.test.mjs` (new, mirrors
  `test/scripts/migrate-actor-to-role.test.mjs`'s shape)
- `CHANGELOG.md` `## [Unreleased]` — a new doctor check is user-visible
  per AGENTS.md's install/setup/doctor gate ("Does this change something a
  user of fgOS would see?").

## Concrete cases to prove against

- Two branches both append real, non-overlapping events since a common
  ancestor — an ad hoc `git merge` between them must complete with no
  conflict (the `union` driver doing its job), containing every event
  from both sides.
- Two branches both append the SAME event content (a duplicate scenario)
  — `--fix` must not double-count it.
- One branch's `.fgos/events.jsonl` is byte-identical to the ancestor (no
  local changes) — merge must degrade to trivially taking the other side.
- `repairTruncatedLastLine` racing a real concurrent `appendEvent` — the
  append must survive.
- `events-jsonl-contiguity.mjs --check` against a synthetic file with an
  injected duplicate-seq and an injected gap — both must be reported;
  `--fix` on the same fixture must resolve both.
- `fgos doctor` surfaces the new check red on a corrupted fixture and
  green on the live (already-healthy) log.

## Verify

The item's own top-level proof, recorded on `tsk-3wq`'s `verify` field —
**corrected during Implement (tsk-56t-class bug, found and fixed
directly per `fgos-coding-implement`'s "blocking issue in the path" rule):
the original draft (`node scripts/events-jsonl-contiguity.mjs --check
.fgos/events.jsonl && ...`) is not portable — a worktree-backed item's
`fgos return` runs verify from inside its own worktree, which never
carries its own `.fgos/` at all (ADR0020), so the relative path never
resolves. Dropped the direct live-log invocation; the test suite below
already exercises the exact same check/fix functions against portable
temp-dir fixtures, which is the correct place for that proof — live-log
health going forward is `fgos doctor`'s ongoing job, not a one-time
item-verify concern:**

```
node --test test/state/events.test.mjs test/state/store.test.mjs test/setup/checks.test.mjs test/scripts/events-jsonl-contiguity.test.mjs
```

Covers the audit script (component 3, both its pure-core logic and its
doctor-check/fix wiring) plus every existing test file touched by
components 2-3, including the concurrent-repair-vs-repair regression
(`test/state/events.test.mjs`, mirroring the existing concurrent-append
fork-based harness) that proves D2's lock fix. The `union`-driver
correctness proof point in the risk map above (a live/simulated ad hoc
merge repro) is additional proof produced separately below (see
`docs/history/events-jsonl-merge-driver-recurring-write-loss/
repro-notes.md`) — a scenario repro, not a single assertion this command
alone captures.

## Outstanding questions

None
