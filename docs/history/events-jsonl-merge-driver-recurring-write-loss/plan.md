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

`impact-analysis: full` — GitNexus is registered and `present`
(`fgos tool query --capability impact-analysis --status present`,
checked at exploring time). Blast-radius evidence below leans on it.

## Approach

Chosen path (CONTEXT.md D1): a `.gitattributes`-routed custom git merge
driver for `.fgos/events.jsonl` that folds two divergent event-log
histories append-log-aware, instead of relying on git's line-based
textual 3-way merge. Rejected alternatives (already argued in CONTEXT.md
D1): stop-committing entirely (bigger behavior change, no backup story
yet) and guard-only (only detects after the fact, doesn't prevent loss —
the exact gap that let this recur three times since tsk-n4i).

Three components, all in this one item per CONTEXT.md D2/D3 (no split):

1. **Merge driver (D1's core fix).** A dedicated script
   (`scripts/merge-events-jsonl.mjs`, mirroring this repo's existing
   `scripts/migrate-*.mjs` shape) implementing git's merge-driver contract
   (`%O %A %B` ancestor/ours/theirs paths, writes the result to `%A`,
   exit 0). Algorithm: parse all three as JSONL via `readEvents`-equivalent
   logic (reuse `src/state/events.mjs`'s own line-parsing, not a
   reimplementation); take the union of ours' and theirs' events not
   already in the ancestor (dedup by full-content equality, since `seq` is
   exactly the field the two histories cannot be trusted to agree on —
   CONTEXT.md's own pinned term); order the union by original `ts`
   (falls back to ancestor order, then ours, then theirs, for any tie);
   renumber `seq` 1..N contiguously over the result. Wire it via:
   - `.gitattributes` (new file — none exists in this repo today, checked):
     `.fgos/events.jsonl merge=fgos-events`
   - a `[merge "fgos-events"]` config block, which `.gitattributes` alone
     cannot carry (git limitation: the driver command itself always lives
     in local git config, never in a versioned file) — registered the same
     way `main-checkout-hook-wired` already wires `core.hooksPath`
     (`src/setup/registrations.mjs:395-399`, `checkMainCheckoutHookWired`):
     a new `registerCheck({id: 'events-jsonl-merge-driver-wired', ...})` +
     a matching `registerFix` in `src/setup/registrations.mjs`, so `fgos
     setup` wires it on a fresh checkout and `fgos doctor` catches a
     checkout where it's missing — this is a new infra dependency per
     AGENTS.md's install/setup/doctor gate (a `.git/config` entry every
     checkout needs), not optional polish.
2. **`repairTruncatedLastLine` lock fix (D2).** Wrap its read-modify-write
   in the same `withEventsLock` scope `store.mjs`'s own mutators already
   use for a precondition-read-then-append critical section
   (`src/state/store.mjs:30, 248, 363`) — `src/state/events.mjs:141-184`
   becomes a locked read → validate → backup → write, one critical
   section, closing the exact gap its own docstring already names.
3. **Contiguity audit (D3).** A small reusable script
   (`scripts/check-events-jsonl-contiguity.mjs`) that walks every line of
   a given `events.jsonl` path and reports any seq break/duplicate — the
   same check already run ad hoc during exploring (RESEARCH.md Round 1:
   12119 lines, seq 1-12119, 0 breaks/dups at that time) turned into a
   committed, rerunnable tool. Run it against the live
   `.fgos/events.jsonl` as part of this item's own verify; if it finds a
   break, repair it the same way tsk-n4i's D4 did (sequential renumber
   from the first break, in-place, under ADR-0019's pre-release exemption)
   before returning.

**Order:** (1) the audit script first — cheapest, and its clean-pass result
is already partially proven from exploring, so it either confirms nothing
to repair or surfaces the repair work up front instead of discovering it
mid-implementation; (2) the merge driver next — the core fix, the
highest-effort and highest-value piece; (3) the `repairTruncatedLastLine`
lock fix last — smallest, fully independent of the other two, no reason to
block on it.

## Risk map

| Component | How risky | Proof point (for `fgos-validating`) |
|---|---|---|
| Merge driver correctness | High — a merge driver that gets the union/reseq wrong is worse than no driver (could silently fabricate or duplicate events across a real merge) | A live/simulated repro: create two divergent branches each appending real events to `.fgos/events.jsonl` since a common ancestor, merge one into the other with the driver wired, assert the result contains every event from both sides exactly once with contiguous reseq'd `seq` — same "actual repro, not just a unit test" bar `tsk-18a` D2 already set for this class of bug |
| Merge driver registration (setup/doctor) | Medium — a driver that exists but isn't wired on some checkouts silently falls back to git's default (broken) merge behavior, no error | `fgos setup` on a fresh checkout, then `git config --get merge.fgos-events.driver` returns the expected command; `fgos doctor` flags it red when the config is deliberately unset |
| `repairTruncatedLastLine` lock fix | Low — small, isolated function, existing tests already cover the happy path | A test that starts a concurrent `appendEvent` mid-`repairTruncatedLastLine` (or mocks the timing) and asserts the append is never silently dropped |
| Contiguity audit script | Low — read-only until a break is found | Run against the live log (already proven clean) plus a synthetic corrupted fixture, asserting the script detects the injected break |
| Regression on existing `events.mjs`/`store.mjs`/`merge.mjs` tests | Medium (existing covered behavior flag) | `node --test test/state/events.test.mjs test/state/store.test.mjs test/runner/merge.test.mjs` stays green |

## Files touched

- `scripts/merge-events-jsonl.mjs` (new)
- `.gitattributes` (new)
- `src/setup/registrations.mjs` (new check + fix registration)
- `src/state/events.mjs` (`repairTruncatedLastLine`, lock fix)
- `scripts/check-events-jsonl-contiguity.mjs` (new)
- `test/state/events.test.mjs`, `test/setup/checks.test.mjs` (new/updated
  cases for the above)
- `docs/specs/runner.md` and/or a new `docs/how-to/` doc, if the merge
  driver introduces a procedure a future contributor needs to know about
  (e.g. what to do if the driver itself ever reports a conflict it can't
  resolve) — left for execution to size once the driver's actual failure
  modes are known, not guessed here.

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
- The contiguity audit script against a synthetic file with an injected
  duplicate-seq and an injected gap — both must be reported.

## Outstanding questions

None
