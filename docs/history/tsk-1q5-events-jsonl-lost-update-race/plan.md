# tsk-1q5 — .fgos state lost-update race — plan

Mode: **high-risk** (hard-gated: audit/security — `.fgos/events.jsonl` is
the system's own audit trail — plus data loss; confirmed by GitNexus:
`withEventsLock` blast radius is CRITICAL, 40 impacted symbols / 21
execution flows, every mutating verb funnels through it).

No `CONTEXT.md` exists for this item — it reached `decompose` via the
direct `clarify -> decompose` edge (a live session's own caller-supplied
discovery verdict, tsk-27y D2), which is the normal path when intent is
already fully specified in the item's own description, as it is here.
There is no product-scope decision to lock; this plan proceeds straight
from the item's own text plus the investigation below.

## Correction to the item's own hypothesis

The item suspects `withEventsLock`/`appendEvent` (`src/state/events.mjs`)
is a fake in-process JS mutex, useless across separate node processes.
Reading the code disproves this: `acquireEventsLock`/
`tryAcquireEventsLockOnce` (events.mjs:203-292) is a real cross-process OS
lock — write-to-tempfile + `fs.linkSync` (atomic create, no partial-write
window) with stale-pid-reclaim, the same primitive already proven for
`loop.mjs`'s `acquireRunnerLock` and `session.mjs`'s `acquireSessionsLock`.
`docs/history/events-lock-concurrency-race/CONTEXT.md` already used a
fork-based ablation test to prove this lock genuinely serializes the
append itself (closes a *different*, already-fixed race: duplicate/
out-of-order `seq`). That prior finding stands; it is not what tsk-1q5 is
chasing.

## Two real candidate causes found instead

**A. `refreshView`/`writeView` run OUTSIDE `withEventsLock` in every
mutation function.** Every write door in `src/state/store.mjs`
(`addWork`, `editWork`, `moveWork`, `moveStage`, `setFocus`,
`addDiscovery`, `addDecision`, `addOutcome`, `addFriction`,
`registerTool`, `removeTool`, `recordGateApprove` — ~14 call sites,
confirmed by grep) follows the same shape:

```js
const event = withEventsLock(logPath, () => { ... appendEventLocked(...) ... });
const view = refreshView(dir);   // <-- outside the lock
```

`refreshView` (store.mjs:107) rebuilds `state.json` by replaying the
*whole* `events.jsonl` fresh, then `writeView` does a whole-file
`fs.writeFileSync` of `state.json`. Because this replay-and-overwrite runs
unlocked, two processes finishing their own (correctly-locked) appends
close together can race: whichever process's `refreshView` call happens to
*finish writing* last wins, even if its own read of the log was captured
before the other process's append landed. The loser's fresher write is
silently overwritten by a staler one — a classic lost-update, but at the
derived-cache layer (`state.json`), not the log. `src/state/
porting-store.mjs` has its own sibling `refreshView` with the same shape
(GitNexus: 4 impacted, LOW — smaller blast radius, same defect).

- Proof point: a fork-based reproduction test (same technique
  `test/state/events.test.mjs:218-287` already uses for the append race)
  — N concurrent processes each calling a distinct mutation (e.g.
  `editWork` on different ids), then asserting the final `state.json`
  equals a fresh `rebuildView(logPath)` of the log after all processes
  exit. Today this assertion should fail intermittently under load; after
  the fix it must not.
- Risk: MEDIUM/CRITICAL by blast radius (GitNexus), LOW by fix complexity
  — moving the existing `refreshView(dir)` call inside the same
  `withEventsLock` scope its append already uses closes the window
  structurally, mirroring the precondition-read-plus-append discipline
  `withEventsLock`'s own doc comment already states as its purpose.

**B. `.fgos/events.jsonl` is git-tracked in the one shared main checkout.**
Confirmed: `git ls-files .fgos/` lists `events.jsonl`; it is not in
`.gitignore` (unlike `state.json`, which is gitignored — root cause A
above never touches git at all). This session's own start-of-conversation
git status showed `.fgos/events.jsonl` as `M` (modified, uncommitted).
Many Claude Code sessions run concurrently against the same main
checkout (per `AGENTS.md`'s own documented hazard, tsk-3au/tsk-4hk). A
`git checkout`, `git reset --hard`, or merge touching the whole working
tree from *any other* session sharing that checkout can silently discard
whatever uncommitted appends are sitting in `events.jsonl` at that moment,
reverting it to the last committed content — this matches the item's own
sharper piece of evidence directly (`grep tsk-2x9k .fgos/events.jsonl`
showing only 3 of the many lines that should exist, i.e. the *raw log
itself* lost lines, not just a derived cache) far better than candidate A
does on its own.

- Proof point: this is a git-operational hazard, not a pure code bug — it
  cannot be proven by a unit test the way A can. Two options, to be
  decided at `fgos-coding-validating`: (1) correlate the incident window against
  `git reflog`/`git log -g` on the main checkout for a checkout/reset/
  merge event overlapping the observed loss, if that history is still
  available; or (2) treat it as already-sufficient evidence (root cause B
  is the same class of danger `AGENTS.md` already names as real and
  unresolved for the tree generally) and scope the fix as prevention
  rather than forensic proof of this one incident.
- Risk: HIGH (data loss, no proof-by-test available; matches an already
  hard-gated flag on its own). Fix shape is genuinely different from A
  (process/tooling hardening around the main checkout, not a code-level
  lock), which is why this plan keeps it a named, separately-tracked
  finding rather than folding it silently into A's fix.

## Files likely touched

- `src/state/store.mjs` — widen each mutation function's `withEventsLock`
  scope to include its own `refreshView(dir)` call (root cause A).
- `src/state/porting-store.mjs` — same shape, same fix (root cause A).
- `test/state/store.test.mjs`, `test/state/porting-store.test.mjs`,
  `test/state/events.test.mjs` — new fork-based concurrent-mutation
  reproduction test(s), same technique as the existing append-race test.
- Root cause B has no code file to touch yet — its own proof/scope
  decision happens at `fgos-coding-validating`, per the Outstanding question
  below.

## Order

Root cause A first: mechanical, fully testable, matches the item's own
original suspicion location (the write path), and is a self-contained
code fix with a clear proof point. Root cause B second: needs
`fgos-coding-validating`'s reality check to decide whether it is provable now or
becomes a follow-up item — spending investigation time on it before A is
proven would risk the whole item stalling on the harder, less-provable
half.

## Impact-analysis capability gate

`fgos tool query --capability impact-analysis --status present` →
GitNexus registered and `present`. Used live during this planning pass
(`impact` on `withEventsLock` and `refreshView` above returned real,
current blast-radius data) — posture: **full**.

## Addendum — tsk-2xt evidence (post-validating)

A third live instance surfaced after this plan's gates were already
approved: while redoing bookkeeping for tsk-2xt, two distinct event
types were confirmed missing from `.fgos/events.jsonl` for the same item
— (a) the entire post-`planApprove` transition chain (`validateApprove`,
`decompose`→`executing`, `delivered`) vanished from the log though the
real code stayed intact on git; (b) a `work.edit` that set `verify` to a
real test command was also lost, so `verify` reverted to the placeholder
string, which a later `return` then tried to execute as a shell command
(`/bin/sh: chưa: not found`). Both are concrete, timestamped/seq-numbered
instances of *raw log lines going missing*, not a derived-cache staleness
— this strengthens root cause B (events.jsonl git-tracked in the shared
main checkout, clobbered by another session's git operation) as the more
likely dominant cause relative to root cause A alone. Scope stays as
decided at `fgos-coding-validating` (A only, this item; B logged as a decision on
`tsk-3wq`) — recorded here so a future reader sees the full evidence
trail without re-deriving it.

## Outstanding questions

- Root cause B (git-tracked `events.jsonl` in the shared main checkout)
  has no test-provable fix the way A does. `fgos-coding-validating` should decide
  whether this item's scope covers a concrete hardening step (e.g.
  auto-commit `events.jsonl` more aggressively, or protect it the same way
  `fgos main-checkout-reset` already protects the wider tree) or whether B
  is better spun into its own follow-up item once A is proven and merged.
