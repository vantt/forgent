---
type: explanation
title: How fgOS isolates concurrent sessions, and why the event log's write door blocks instead of backing off
tags: [multi-session, concurrency, worktree, crash-recovery]
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: [tsk-1jp, tsk-3wn, tsk-597]
---

# How fgOS isolates concurrent sessions, and why the event log's write door blocks instead of backing off

fgOS supports multiple concurrent sessions against the same checkout by
isolating each one into its own git worktree. Two design facts fall directly
out of that choice, and a third is a general safety property any code
manipulating a worktree needs.

## `.fgos/events.jsonl` is git-tracked, on purpose

By convention, fgOS's own event log file is committed into the repository,
not left untracked. That single fact has real consequences for anything that
creates, checks out, or tears down a session's worktree: `git worktree add`
checks tracked content out into the new worktree exactly as HEAD has it, and
`git worktree remove` behaves differently depending on whether the paths it
touches are tracked or not at that moment. Code that manages session
worktrees has to be tested against fixtures that mirror this exact
tracked-vs-untracked layout for the paths it actually manipulates — a test
passing against a generic, freshly initialized git repo with no tracked state
at those paths is not evidence it will behave correctly against a real fgOS
checkout, because the tracked state is exactly what changes `worktree add`/
`remove`/`checkout`'s behavior.

## The event log's single write door has to block, not back off

Every mutating verb in fgOS funnels through one function that appends to the
event log. That gives it a reliability requirement stricter than most other
locks in the system: it must eventually succeed, because silently skipping a
write would mean an action the user thinks happened never reached the log at
all. That's a materially different failure semantics than, say, a top-level
dispatch loop's own lock, which can safely back off and simply skip a turn if
it can't acquire it immediately.

This distinction matters specifically when reusing an existing lock/retry
primitive by name. The underlying mechanism — atomic-create plus stale-owner
reclaim — is safe to reuse across call sites. The *policy* wrapped around it
(blocking versus non-blocking, how long to wait, whether the caller retries at
all) is not something to copy from a superficially similar-looking sibling by
name; it has to be re-derived from the new caller's own failure semantics
every time. Naming a precedent by its function name, without reading what
specific property makes it correct for its own original call site, is exactly
how a non-blocking lock ends up copied onto a caller that actually needed a
blocking one.

## A crash mid-operation needs a real kill test, not just a fixture

Any code path that touches git/filesystem bookkeeping for a worktree or
session and that can be interrupted partway through — not just fail cleanly at
a defined boundary — needs at least one test that sends a real kill signal to
a real process mid-operation. A fixture that only feeds in already-partial
data can prove the classification logic is correct, but it can't reproduce
what an actual crash does to git and filesystem state at the moment of
interruption. A bug in orphaned-checkout handling shipped through both a
review pass and unit-test coverage and surfaced only once an actual
kill-mid-operation rehearsal was run — the gap between "logic looks right on a
constructed fixture" and "survives a real interruption" is exactly the kind a
synthetic fixture can't close.

## A two-syscall lock create (open, then write the identity) has an empty-file window an atomic-looking primitive doesn't close

`events.lock`'s create step looked atomic — `fs.openSync(lockPath, 'wx')`
uses the same O_CREAT|O_EXCL exclusivity as its sibling locks
(`runner.lock`, `sessions.lock`, `main-checkout.lock`) — but it wrote the
holder's identity in a *separate* `fs.writeSync` call right after. Between
those two syscalls, the lock file exists but is still empty. A competitor
that loses the create race and reads the file in that exact window sees
unparseable (NaN) content, which the stale-holder-reclaim logic — correctly
designed to treat a dead/garbage holder as reclaimable — can't tell apart
from an actually-stale lock. It unlinks a lock a live process still holds,
and both processes go on to believe they hold it: the identical
duplicate-seq corruption the lock exists to prevent in the first place,
just reopened through a different door.

This reproduced empirically at the same scale that made it worth building
this lineage of locks safe in the first place: 0/5 failures at 6 concurrent
processes, 3/5 failures at 20. Low natural concurrency can make a real,
reproducible race window look like it isn't there — proving a lock correct
against today's typical concurrency is not the same claim as proving it
correct at the concurrency the system is actually meant to support.

The fix generalizes past this one call site: write the holder's identity to
a per-attempt temp file first, then `fs.linkSync` it onto the lock path
instead of `open('wx')` + a separate write. `link()` only ever exposes the
destination fully-written or not-yet-existing — there is no intermediate
state for a competitor to observe, so the empty-file misread is closed
structurally rather than patched with a retry or a wider timeout. Any
future lock in this same create-then-write-identity shape should default
to the write-then-link pattern rather than the separate open-then-write one,
even though the older shape reads as "atomic" at a glance — the atomicity
of the *create* was never the missing piece; the gap was between create and
content being fully present.

## The same empty-file TOCTOU window, confirmed in `session.mjs`'s sibling lock too

`events.mjs:29-33`'s own comment (added when the `linkSync`-based fix
above landed) named `session.mjs`'s `acquireSessionsLock` as one of two
untouched siblings still carrying the vulnerable `openSync('wx')` +
separate `writeSync` pattern. A later flake investigation (`tsk-1u7`,
`test/runner/session.test.mjs:207`'s "concurrent createSession from real
separate OS processes never loses a registry entry" failing once during a
2427-test full-suite run, but passing 15/15 in isolation — the same
signature `tsk-3ld` originally diagnosed) confirmed that comment was still
literally true by direct read: `session.mjs:137-145`'s `tryAcquireOnce`
still does the create-then-separate-write two-syscall sequence, unfixed.

The investigation itself is worth noting for how it corrected course
mid-stream: its first-pass conclusion (confirm the lock design is sound by
construction; the flake trigger is the lock's 10-second acquire timeout
under full-suite CPU/disk contention, not a real race) was reversed once
`fgos-coding-validating`'s reality check re-read the code and found it had only
checked the *stale-holder-reclaim* branch's TOCTOU guard (which is sound)
and missed the *earlier*, different window — the fast-path create itself.
Once found, the match to the already-fixed `events.mjs` bug was exact:

> "D3... `session.mjs`'s `tryAcquireOnce`... still carries the exact
> pre-fix vulnerable pattern `events.mjs` had... This is the SAME bug
> `tsk-3ld` already found and fixed in `events.mjs`... `session.test.mjs`'s
> own test only spawns 5 processes — below that reproduction threshold —
> which exactly matches the 'isolated pass, full-suite flake' signature
> this item started from. Real, confirmed-by-precedent bug — not test
> oversensitivity, not lock-contention-timeout."

The fix locked (implementation left to planning/executing, out of this
investigation's own scope): port `events.mjs`'s write-then-`linkSync`
technique into `session.mjs`'s `tryAcquireOnce` unchanged — same
mechanism as the "write-then-link pattern" described above — rather than
excluding the flaky test from the default suite (an earlier, since-
reversed draft decision). `loop.mjs`'s `acquireRunnerLock`, the *third*
sibling `events.mjs:29-33` names as sharing the original pattern, was
explicitly left out of this item's scope — confirmed still open, a
separate item's job if the same class of bug is ever suspected there too.

The general lesson this confirms a second time: a comment naming "sibling
call sites that still need this fix" is a live TODO list, not historical
trivia — it named exactly where the next real bug in this lineage was
eventually found, in the same shape, under the same load-dependent
reproduction signature (low concurrency hides it; a full-suite's real
contention surfaces it).

## Deleting a worktree's tracked copy closes a stale-read hazard, but opens a new-write one

ADR0020 closed the hazard this doc's first section describes — a session
worktree checking out `.fgos/events.jsonl` frozen at its branch's fork
point — by deleting that checked-out copy outright right after `git
worktree add` (`createWorktree`, `src/runner/worktree.mjs`), plus a
merge-time backstop in `merge.mjs` that refuses any diff touching a
`.fgos/` path. Both are real, both are correct, and both were already
implemented before this finding.

What they don't close: `bin/fgos.mjs`'s state-write door
(`appendEventCore`, `src/state/events.mjs`) creates its target directory
unconditionally — `fs.mkdirSync(path.dirname(logPath), { recursive: true
})` — before appending, with no check that the directory was ever meant to
exist yet. Combine that with ADR0020's own deletion step and a worktree's
`.fgos/` is now *always* absent by design, so any write verb invoked from
inside one (`fgos decision`, `ask`, `answer`, `discover`, ...) silently
creates a brand-new, empty `.fgos/` right there and reports success — a
normal-looking `{seq: N}` response, no error, no warning. The event never
reaches the real store. Because the file was never `git add`ed, the
merge-time backstop never sees it either: it only inspects staged paths.
The write simply vanishes the moment the worktree is removed.

This is the same *lesson*, not a coincidence: closing a hazard by removing
the ambiguous state (no copy to read stale) doesn't automatically close the
hazard on the write side (nothing there to notice you just wrote into a
phantom). The fix needed a second, independent check: every state-write
verb but `init` now refuses outright when `.fgos/` doesn't already exist,
instead of silently vivifying it — reusing the *shape* of the pull door's
own precondition checks (`return`'s `headAtTake` advance check, `take`'s
main-checkout-lock), never inventing a new refusal mechanism. `init`
itself keeps the opposite check — refuse when `cwd` is a linked worktree
(`isMainWorktree`, `src/runner/merge.mjs`) — since it is the one verb
whose entire job is creating `.fgos/`, and the one remaining path that
could recreate a live one inside a worktree despite ADR0020.

A session-role claim (`fgos take --role session`) does not, on its own,
stop the runner's own dispatch loop from independently picking up and
completing the same item in parallel — this finding's own item
(`tsk-4fu-2`) was claimed, planned, and implemented by one session while an
independent commit implementing the same guard landed directly on `main`
from elsewhere, twice, before that session's own code ever got committed.
Neither commit came through a `fgw/<id>` branch merge; both landed as
direct commits on `main`. The session's real, durable contribution ended up
being the state-side close (`return`, `compound`) and this doc, not the
code — the two implementations converged on the same design independently,
which is the outcome an evidence-checked plan (CONTEXT.md/plan.md, reality
gate) is supposed to produce, but the race itself is an open gap, not a
feature: nothing yet makes a live session-role claim visible to the
runner's own frontier/dispatch selection the way a main-checkout-lock
holder already is.

**Correction (`tsk-49a`, 2026-07-30):** the paragraph above does not hold up
against the real event log and is kept here only as the historical belief
that motivated `tsk-49a`'s filing, not as an accurate description of
today's behavior. A full scan of `.fgos/events.jsonl` (565 `work.move`
events, every one of them, not a sample) found **zero** genuine
runner-vs-session double-claims anywhere in the log — including on
`tsk-4fu-2` itself, whose actual event trail (`work.move` seq 775 take →
seq 798 return, both `writer.id: e5001984-…`, `passed: true`) shows a
single actor completing an ordinary take → implement → return → done
cycle, not two competing actors. The "independent commit… landed directly
on `main`" observation above is explained by `fgos take`'s own documented
semantics, not a race: `take` (`isolate: false`, no `fgw/<id>` branch yet)
deliberately works directly against the main checkout's current HEAD
(`src/runner/claim-port.mjs`'s `useBranchSource` is `false` in this case;
only `pick` isolates into a worktree/branch) — a mid-task commit by the
*same* claiming session lands on `main` by design, and is easy to mistake
for a foreign actor's parallel work if found before that session has run
its own `return`. `claim-port.mjs`'s single choke point (`take`/`pick`/the
runner's own `claimItem` all funnel through the same `claimWork`, CAS-
guarded via `moveWork`'s `expectedStatus`) already rejects a second
claimant once the first has flipped an item to `doing` — confirmed both by
reading that code and by a live repro (session claims, then a runner claim
on the same id throws `FsmError`, `category: 'conflict'`, with the
session's own claim left completely untouched) — and this guarantee is now
additionally locked in by a regression test
(`test/runner/claim-port.test.mjs`, "claimWork rejects a runner claim on an
item already claimed (doing) by a live session claim…"). See
`docs/history/tsk-49a-runner-claim-race/CONTEXT.md` for the full scout
evidence trail.

## A comment claiming lock parity with `addWork` didn't match the code (`tsk-1jp`)

`src/state/porting-store.mjs`'s `addPorting`/`movePorting` each do a
read (`rebuildViewFromLog`), check a precondition against that read
(existence for `addPorting`, expected-status CAS for `movePorting`),
then call bare `appendEvent` — three separate steps, with no lock
spanning all three; `appendEvent` itself only locks its own single
append. A comment right above `addPorting`'s check claimed parity with
`store.mjs`'s own `addWork` dup-id guard — but `store.mjs`'s
`addWork`/`moveWork` wrap the *entire* read-check-append in one
`withEventsLock` scope, using `appendEventLocked` (not `appendEvent`)
specifically to avoid re-acquiring the lock partway through:

> "The comment's claim of parity is false: two concurrent `addPorting`
> calls on the same id can both pass the existence check before either
> writes."
> — real `docs/history/tsk-1jp-porting-store-cas-inside-lock/CONTEXT.md`

The fix mirrors `store.mjs`'s own structure exactly — wrap
`addPorting`/`movePorting`'s read-check-append in `withEventsLock`, using
`appendEventLocked` inside that scope. `refreshView(dir)` stays *outside*
the lock in both, matching where `store.mjs` already calls it (a plain
`fs` read+write with no locking of its own — the derived-cache refresh
is a separate concern from the raw-log CAS this fix closes). The comment
itself was corrected to state what's actually true after the fix, rather
than deleted — its *intent* ("mirror `addWork`'s guard") was correct
all along; only the implementation hadn't caught up to it.

Proof reused this doc's own established technique rather than a new one:
`store.test.mjs`'s `raceAcrossProcesses` helper — real, separate OS
child processes racing the same call, the only way to actually observe
this class of bug (in-process `Promise.all` concurrency is serialized by
one event loop and can never expose it) — mirrored onto
`addPorting`/`movePorting`.

The lesson this confirms again, in a third module this time (after
`events.mjs`'s and `session.mjs`'s lock-primitive TOCTOU windows above):
a comment asserting "mirrors X's guarantee" is a claim to verify against
the actual code shape, not evidence the guarantee holds — `porting-
store.mjs` predates being checked against `store.mjs`'s real locking
scope, and nothing caught the drift until a targeted audit read both
side by side.

## The lock-contention regression test itself became a flake, and blamed unrelated items for it (`tsk-3wn`)

`test/state/events.test.mjs`'s own regression test — "appendEvent under
concurrent OS processes yields unique, gapless, strictly-increasing
seqs" — forks 20 processes that each call `appendEvent` 40 times
(800 total lock acquisitions, serialized because the lock is a mutex),
each acquisition drawing from its own fixed `EVENTS_LOCK_TIMEOUT_MS =
2000`ms budget. The unluckiest process in that 800-deep queue has to
wait for nearly all of them; under a quiet machine that finishes well
inside 2000ms, but under real load it doesn't.

This surfaced as two live incidents, and both blamed the wrong thing:
`tsk-4qu` and `tsk-104` — an unrelated docs-only prose fix — each got
pushed to `blocked` with `reason: verify-fail-post-merge` when `approve`/
`merge next` ran `npm test` on the shared main checkout at the exact
moment 2746+ other tests were also running (`approve`/`sync-root`
verify on the *main checkout*, competing directly with node's own
test-runner parallelism across files):

> "✖ appendEvent under concurrent OS processes ... (5195.869803ms)
> AssertionError: every child must exit 0 - a non-zero exit means an
> append threw (e.g. a lock-timeout under contention)
> EventLogError: appendEvent: timed out acquiring events.lock after
> 2000ms (held by pid 838346)"
> — real test failure, `tsk-104`'s own verify run

Isolated proof this was load, not a regression: `node --test
test/state/events.test.mjs` alone passed 17/17 clean; the same file
inside the full `npm test` run failed exactly once (2743 pass, 1 fail) —
because node's test runner executes test *files* in parallel
(concurrency = CPU count), so while this file's own 20-process fork was
running, every other test file was competing for the same CPUs at once.
A second real-world data point confirmed the trend rather than a fluke:
the same test's observed runtime went from 5195ms to 9431ms across two
separate contended runs — the queue got slower as load increased, while
each acquisition's own 2000ms budget stayed fixed and increasingly
irrelevant to the real size of the 800-deep queue it was meant to bound.

**Why this is worse than an ordinary flaky test**: `approve`/`sync-root`
run their verify step on the shared main checkout, at exactly the moment
the whole suite (2746+ tests) plus any other concurrent fgOS sessions are
also active — the maximum-contention condition this flake needs to fire.
The consequence lands on a completely unrelated item: the merge rolls
back, the item moves to `blocked` with a reason that reads as "this item
is broken," and rescuing it needs a manual `move --to doing` then
`return` — which just re-runs the full suite and can hit the same flake
again (`tsk-104`'s own second rescue attempt did exactly that, this time
timing out at 9431ms instead of 5195ms).

**Fix, scoped to the test only, not production**: lower `N_PROC`/
`N_APPEND` in `test/state/events.test.mjs` to a scale that still
reproduces the original real bug (two OS processes racing the same
`seq`, confirmed once by spike per the fgos-multi-session-checkout epic)
without queueing 800 acquisitions against a flat per-acquisition
timeout, plus a comment tying the chosen numbers to the `2000`ms budget
directly. Two adjacent options were explicitly rejected: adding a
`timeoutMs` param to `appendEvent` just to accommodate the test (widening
a production API for a test-only need), and raising production's own
`EVENTS_LOCK_TIMEOUT_MS` "just to make the test pass" (fixing the wrong
layer — the blocking-not-backing-off policy this doc's own second
section establishes is a real production requirement, not something to
loosen because one test's own scale outgrew it). The regression's actual
job — still catching a real duplicate/gap bug — must not weaken: the
fix only changes how many processes/appends the test throws at the lock,
never what it asserts about the result.

**Left open, named rather than resolved**: should a verify failure at
merge time distinguish "this item's own change is broken" from "the
infrastructure/a flaky dependency broke"? Today both produce the
identical `blocked` / `verify-fail-post-merge` outcome, so a reader
looking at a blocked item after the fact cannot tell which happened
without re-deriving it by hand — the same ambiguity that made `tsk-4qu`
and `tsk-104` both look like real regressions when neither one's own
diff touched `events.lock` at all.

## The same load-flake, a third time — and the fix converged on an existing mechanism (`tsk-597`)

`test/state/porting-store.test.mjs`'s own regression test for the CAS fix
above — "`addPorting` under concurrent OS processes racing the SAME id:
exactly one succeeds, the rest see already exists" — hit the identical
failure shape `tsk-3wn` already diagnosed for `events.test.mjs`: `tsk-31lz`,
an unrelated item whose diff only touched `src/state/replay.mjs`/
`src/intake/discovery.mjs`, got pushed to `blocked` with
`verify-fail-post-merge` because this one test timed out under real
machine load (162s run vs. the ~47s normal case; the same file alone on
`main` passed in 344ms; a retry passed immediately).

Confirmed load, not regression, by the same evidence shape as `tsk-3wn`
above: diffstat against `main` showed zero overlap with porting-store, the
five intervening commits were docs/herdr-only, and the isolated single-file
run was clean. The product-side race this test guards against was already
fixed and merged (`tsk-1jp`, the CAS-inside-lock fix documented above) —
`tsk-597`'s own scope was explicitly *not* to touch that fix again, only
to make the *test itself* tolerate load.

**The fix converged on an existing mechanism instead of inventing a new
one.** The original plan was a bespoke lock-timeout-retry wrapper, mirroring
`tsk-3wn`'s N_PROC/N_APPEND-shrinking approach. During implementation,
`raceAcrossProcesses`'s helper turned out to already have a `batchSize`
option — added the same day by a concurrent session's `tsk-4fx`, fixing
the identical underlying issue on sibling tests. `tsk-597` reused that
existing mechanism rather than shipping a second, parallel fix for the
same problem. Proof that batching actually helps under contention: since
real load couldn't safely be induced on the shared, actively-used
development machine, the lock timeout was temporarily shrunk instead
(mirroring `tsk-3wn`'s own methodology) — 2/2 unbatched runs failed, 3/3
batched runs passed clean.

This is the third module hitting the same load-flake pattern
(`events.test.mjs` via `tsk-3wn`, a sibling test via `tsk-4fx`, and
`porting-store.test.mjs` via this item) — the same open question `tsk-3wn`
already named still applies unresolved: a verify failure at merge time
still can't mechanically distinguish "this item's own change is broken"
from "the infrastructure/a flaky dependency broke."

---

**Source:** `docs/history/learnings/critical-patterns.md` —
[20260717] "A test fixture for git-worktree/checkout-touching code must
mirror the TARGET repo's real tracked-vs-gitignored layout" (feature
fgos-multi-session-checkout);
[20260717] "'Mirror X' reuses the mechanism, never the policy" (feature
fgos-multi-session-checkout);
condensed entry "Đường crash-recovery phải có test giết-thật" (feature
phase-2-routing, 2026-07-14);
`docs/history/events-lock-concurrency-race/plan.md` — real race confirmed
and fixed at `962eb6b` (feature tsk-3ld, 2026-07-29);
`docs/history/fgos-worktree-state-write-guard/CONTEXT.md` and `plan.md` —
`requiresExistingStore` guard locked, planned, and reality-gated (feature
tsk-4fu-2, 2026-07-29);
`docs/history/tsk-49a-runner-claim-race/CONTEXT.md` and `plan.md` — the
runner-vs-session claim-race premise checked against the full event log
and found not to hold; regression test locks the real guarantee in
instead (feature tsk-49a, 2026-07-30).
