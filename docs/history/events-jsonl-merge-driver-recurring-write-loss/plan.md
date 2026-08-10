# events-jsonl-merge-driver-recurring-write-loss — plan

Mode: high-risk

**Why high-risk, not standard:** hits two hard-gate flags on its own —
this touches the shared audit/state log's data integrity (a "data loss"
class change: the whole point is preventing silent event loss) and the
event log doubles as the platform's own audit trail (audit/security
flag). It also lands on `existing covered behavior` (`events.mjs`,
`store.mjs`, `merge.mjs` all carry existing tests that must not regress)
and `weak proof around the area` (a concurrent-branch-merge race is hard
to prove deterministically — same shape `tsk-18a`'s own D2 already named
for a sibling merge-race bug: "proof of done requires an actual live/
simulated concurrent-race reproduction attempt, not a code-fix-only unit
test"). 4 flags plus 2 hard-gate flags — well past the `standard`
threshold (`fgos-routing`'s Mode-gate: 4+ flags or any hard-gate flag →
high-risk).

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

Chosen path (CONTEXT.md D1): route `.fgos/events.jsonl` through a
merge strategy that folds two divergent event-log histories append-log-
aware, instead of relying on git's plain line-based textual 3-way merge.
Rejected alternatives (already argued in CONTEXT.md D1): stop-committing
entirely (bigger behavior change, no backup story yet) and guard-only
(only detects after the fact, doesn't prevent loss — the exact gap that
let this recur three times since tsk-n4i).

**Revised at `fgos-validating` time (Smaller path check, still honoring
D1 — same "merge driver folds histories union+reseq" concept, cheaper
realization):** the first plan draft called for a from-scratch script
parsing git's `%O`/`%A`/`%B` merge-driver contract. Reality-gate evidence
found a smaller path: git ships a documented built-in `union` merge
driver (`git help attributes` → "Built-in merge drivers" → `union`: "Run
3-way file level merge for text files, but take lines from both versions,
instead of leaving conflict markers... tends to leave the added lines...
in random order and the user should verify the result") that needs only a
`.gitattributes` line — no local git config, no per-machine registration,
no `fgos setup`/`fgos doctor` wiring, since it's a plain versioned file
every checkout already reads. `events.jsonl` is provably append-only
(`src/state/events.mjs`'s own header: "this module only appends"), so the
`union` driver's line-combination is exactly the right primitive for the
union half of D1 — it just doesn't renumber `seq` or guarantee order
("random order... verify the result", per the doc above), which is
exactly the gap this item's own custom code still needs to close.

Three components, all in this one item per CONTEXT.md D2/D3 (no split):

1. **Merge driver (D1's core fix), git-builtin + a thin fixup (revised).**
   - `.gitattributes` (new file — none exists in this repo today, checked):
     `.fgos/events.jsonl merge=union`. No `[merge "..."]` config block and
     no `fgos setup`/`doctor` registration needed — `union` is git-native,
     resolved straight from the versioned `.gitattributes` line on every
     checkout, unlike a custom-named driver.
   - One new script, `scripts/events-jsonl-contiguity.mjs`, with two
     modes, unifying what would otherwise be two near-duplicate scripts
     (this component's fixup and component 3's audit — a second, smaller
     "smaller path" finding from the same reality-gate pass):
     - `--check <path>`: read-only, reports any `seq` break/duplicate,
       non-zero exit if found. This alone satisfies D3.
     - `--fix <path>`: dedupes exact-duplicate lines (guards the `union`
       driver's own rare identical-line-kept-twice case) and renumbers
       `seq` 1..N contiguously over the remaining lines, in original
       relative order — reuses `src/state/events.mjs`'s own line-parsing
       (`readEvents`), not a reimplementation.
   - Wiring point for `--fix`, chosen to avoid an unverifiable assumption:
     NOT a `post-merge` git hook (whether that hook fires under
     `git merge --no-commit --no-ff` — the exact mode `merge.mjs` uses —
     could not be verified in this session; sandbox policy blocks any
     `.git`-path probe, so this was correctly left unasserted rather than
     guessed). Instead, `src/runner/merge.mjs`'s own already-documented,
     already-cited flow (`docs/history/.../RESEARCH.md`, `merge.mjs:15-26`
     header comment): immediately after `git merge --no-commit --no-ff`
     stages cleanly (still uncommitted) and BEFORE `runGoalCheck` verifies
     the staged tree, run `--fix` against the staged
     `.fgos/events.jsonl` (idempotent no-op when the file wasn't touched
     or is already contiguous) and `git add .fgos/events.jsonl` to
     re-stage it. This is a narrow, explicitly-scoped exception to
     `merge.mjs`'s own "never writes to `.fgos/`" comment (`merge.mjs:28-
     31`) — that comment is about STATE-LOGIC writes going through
     `store.mjs`'s single write door (`proposed -> done` etc.), not a
     mechanical post-union content fixup of a file git's own merge step
     already touched moments earlier in the same flow; worth this note in
     `plan.md` so a future reader doesn't mistake it for a violation.
2. **`repairTruncatedLastLine` lock fix (D2), unchanged.** Wrap its
   read-modify-write in the same `withEventsLock` scope `store.mjs`'s own
   mutators already use for a precondition-read-then-append critical
   section (`src/state/store.mjs:30, 248, 363`) — `src/state/
   events.mjs:141-184` becomes a locked read → validate → backup → write,
   one critical section, closing the exact gap its own docstring already
   names.
3. **Contiguity audit (D3), now folded into component 1's script.** Run
   `events-jsonl-contiguity.mjs --check .fgos/events.jsonl` against the
   live log as part of this item's own verify — the same check already
   run ad hoc during exploring (RESEARCH.md Round 1: 12119 lines, seq
   1-12119, 0 breaks/dups) turned into a committed, rerunnable tool. If it
   finds a break, repair with `--fix` the same way tsk-n4i's D4 did
   (sequential renumber, in-place, under ADR-0019's pre-release exemption)
   before returning.

**Order:** (1) `events-jsonl-contiguity.mjs` (`--check`/`--fix`) first —
it is the shared primitive components 1 and 3 both need, and its
`--check` mode against the live log is already partially proven from
exploring; (2) `.gitattributes` + the `merge.mjs` wiring next — the core
fix, depends on the script from (1) existing; (3) the
`repairTruncatedLastLine` lock fix last — smallest, fully independent of
the other two, no reason to block on it.

## Risk map

| Component | How risky | Proof point (for `fgos-validating`) |
|---|---|---|
| `union` driver + `--fix` reseq/dedup correctness | Medium (down from the first draft's High — the union half is now git's own battle-tested code; only dedup+reseq is custom) — getting dedup/reseq wrong is still worse than no fix (could silently fabricate seq or drop a genuine duplicate check) | A live/simulated repro: create two divergent branches each appending real events to `.fgos/events.jsonl` since a common ancestor, merge one into the other with `.gitattributes` wired, assert the result contains every event from both sides exactly once with contiguous reseq'd `seq` — same "actual repro, not just a unit test" bar `tsk-18a` D2 already set for this class of bug |
| `merge.mjs`'s new `--fix` call site | Medium — a narrow, explicitly-scoped exception to its own "never writes to `.fgos/`" comment; must not fire when the merge conflicted or when `.fgos/events.jsonl` wasn't touched | Existing `test/runner/merge.test.mjs` suite stays green, plus a new case: a merge that touches `.fgos/events.jsonl` triggers the fixup and re-stages it before verify runs; a merge that never touches it is a no-op |
| `repairTruncatedLastLine` lock fix | Low — small, isolated function, existing tests already cover the happy path | A test that starts a concurrent `appendEvent` mid-`repairTruncatedLastLine` (or mocks the timing) and asserts the append is never silently dropped |
| `events-jsonl-contiguity.mjs --check` | Low — read-only until a break is found | Run against the live log (already proven clean) plus a synthetic corrupted fixture, asserting `--check` detects an injected duplicate-seq and an injected gap |
| Regression on existing `events.mjs`/`store.mjs`/`merge.mjs` tests | Medium (existing covered behavior flag) | `node --test test/state/events.test.mjs test/state/store.test.mjs test/runner/merge.test.mjs` stays green |

## Files touched

- `.gitattributes` (new)
- `scripts/events-jsonl-contiguity.mjs` (new, `--check`/`--fix`)
- `src/runner/merge.mjs` (new `--fix` call between the staged merge and
  `runGoalCheck`, re-staging `.fgos/events.jsonl` when touched)
- `src/state/events.mjs` (`repairTruncatedLastLine`, lock fix)
- `test/state/events.test.mjs`, `test/runner/merge.test.mjs` (new/updated
  cases for the above), `test/scripts/events-jsonl-contiguity.test.mjs`
  (new, mirrors `test/scripts/migrate-actor-to-role.test.mjs`'s shape)
- `docs/specs/runner.md` and/or a new `docs/how-to/` doc, if the union
  driver ever needs a documented procedure for a genuinely unresolvable
  case — left for execution to size once real failure modes are known,
  not guessed here.

## Concrete cases to prove against

- Two branches both append real, non-overlapping events since a common
  ancestor — merge must contain the union, contiguous seq, no loss.
- Two branches both append the SAME event content (a duplicate scenario) —
  merge must not double-count it.
- One branch's `.fgos/events.jsonl` is byte-identical to the ancestor (no
  local changes) — merge must degrade to trivially taking the other side,
  never mis-renumber a side that didn't change.
- `repairTruncatedLastLine` racing a real concurrent `appendEvent` — the
  append must survive.
- `events-jsonl-contiguity.mjs --check` against a synthetic file with an
  injected duplicate-seq and an injected gap — both must be reported;
  `--fix` on the same fixture must resolve both.
- A merge that touches `.fgos/events.jsonl` on both sides runs `--fix`
  automatically inside `merge.mjs`'s flow before verify; a merge that
  never touches it is a byte-identical no-op (regression guard for the
  new call site itself).

## Verify

The item's own top-level proof, recorded on `tsk-3wq`'s `verify` field:

```
node scripts/events-jsonl-contiguity.mjs --check .fgos/events.jsonl && node --test test/state/events.test.mjs test/state/store.test.mjs test/runner/merge.test.mjs
```

Covers the audit script (component 3) against the live log, plus every
existing test file touched by components 1-2. The union-driver/`--fix`
correctness and repair-lock-fix proof points in the risk map above (a
live/simulated concurrent-merge repro, a concurrent-append-vs-repair
repro) are additional proof `fgos-validating`/execution must produce and
record — they are scenario repros, not single assertions this one command
alone captures, so they're named in the risk map rather than folded into
this one-line verify.

## Outstanding questions

None
