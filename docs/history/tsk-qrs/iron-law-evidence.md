# Iron Law evidence: tsk-qrs

`classifyIronLaw` on this item's real diff (`main...fgw/tsk-qrs`, computed the
same way `bin/fgos.mjs`'s `approve` verb computes it):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/claim-port.mjs",
    "src/runner/loop.mjs"
  ]
}
```

`matchedFlags` is empty — checked against `HEAVY_KEYWORDS` directly, not
assumed. All three matched modules are this item's own work, none inherited:
`loop.mjs` carries the wave trim and the discovery-sweep gate, and
`claim-port.mjs`/`bin/fgos.mjs` were touched by the later config-hardening
fix below. `MODULE_RULES` covers the whole `src/runner/` prefix and
`bin/fgos.mjs` exactly.

## Scope note: this item grew after its first return

The item was returned green at `4c22d470`, and an independent engine-side
review then found two more defects — one of them caused by this batch's own
earlier fix. They were fixed on the same item rather than deferred, so the
recorded `branchHeadAtReturn` predates the final tree. `approve` re-runs the
verify against the merged tree, so the gate still sees the real final state;
the numbers below are from the final tree, not the returned one.

Footprint grew beyond the declared list, named here rather than buried:
`src/state/cleanup-harness.mjs`, `src/config/shared-config-file.mjs`,
`bin/fgos.mjs`, `src/setup/registrations.mjs`, `test/state/cleanup-harness.
test.mjs` and `test/runner/loop.test.mjs`. Each is where the two later
defects actually live; none is scope creep.

## The defect this batch introduced, and closed

`checkRetrospectiveContent` accepted ANY decision record as evidence a
retrospective had run. Wiring `fgos-coding-driving` to record a closing
report at every stop (this batch's own earlier fix, `tsk-1oz`) turned a rare
false pass into a universal one: every driven item carried a decision before
retrospective started, so the `cleanup -> done` content gate was permanently
green. Recorded plainly because it is the one place this work made something
worse before making it better.

## What was genuinely proven red-before-green

Two of the three new tests were run against the pre-fix tree and observed
FAILING, by restoring `src/runner/loop.mjs` from `HEAD~1` and re-running the
suite before restoring the fixed file:

```
--- reverted loop.mjs to pre-fix; running the 3 new tests ---
✖ the discovery sweep obeys the shared ceiling too: a full lane spawns no research worker
✔ the discovery sweep still runs normally when the lane has room
✖ an idle run says WHY it was idle: an empty frontier and a full lane are not the same answer
ℹ tests 67
ℹ pass 65
ℹ fail 2
```

Both reds are the defect itself, not a broken fixture:

- **the ungated research spawn** — the pre-fix sweep stood a real worker up
  while the lane was full, so `countRuns(counterFile)` read 1 where the test
  requires 0. This is the hole the fix closes: that process never claims, so
  it never occupied a slot and the ceiling could not see it.
- **the indistinguishable idle** — `result.reason` did not exist, so a caller
  could not tell "nothing to do" from "work waiting behind a full lane". The
  pre-fix run returned the same envelope for both.

The third test (`still runs normally when the lane has room`) passes on BOTH
sides deliberately. It is a regression guard proving the new gate does not
change behavior when there is room — it is not a feature test, and this file
does not claim it as one.

The two later fixes were proven the same way, by restoring
`src/state/cleanup-harness.mjs` and `src/runner/claim-port.mjs` from `HEAD`
and re-running before restoring the fixed files:

```
--- pre-fix: expect the 3 new tests RED ---
✖ checkRetrospectiveContent: NOT ok when the only decision is an engine record such as a driver report
✖ a shared config that is not valid JSON leaves claiming alive: no ceiling, no crash
ℹ tests 66
ℹ pass 64
ℹ fail 2
```

Both reds are the defects themselves: a driver report satisfying the
retrospective gate, and an unparseable config throwing an uncategorized error
straight out of `claimWork`. The companion test (`ok when a real (non-engine)
decision sits alongside engine records`) passes on both sides on purpose — it
guards against over-narrowing the gate, which would have been the obvious way
to break real items while fixing this one.

The tree was restored from a byte copy and confirmed identical to `HEAD`
(`git diff --stat src/runner/loop.mjs` empty) before the final run.

## Honest gap: the other two fixes were not failing-test-first

- **The whole-batch retirement (D8 supersede)** was implemented first, then
  its test updated. What DID happen is weaker but real: the existing test
  asserting the old rule (`granted === 5`) failed immediately on the change
  (`actual: 1, expected: 5`), which is what surfaced that the retirement had
  to be recorded as a supersede rather than slipped in. The replacement test
  (`a batch trimmed to granted is exactly what the claim door actually
  admits`) was written after the implementation, not before it.
- **The fan-out prose fixes** (trim instead of fire-whole; the refusal branch
  gaining a loop-back, a wait, a bound and a give-up rule) are covered only
  by the item's own `grep`-based verify, per
  `docs/how-to/write-verify-for-a-skill-prose-change.md`. Prose behavior is
  not executed by any test, and this file does not pretend otherwise.

## What was actually proven

Full suite, from this branch, clean tree, immediately before this file was
written:

```
$ npm test
ℹ tests 3051
ℹ suites 0
ℹ pass 3046
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

(The 5 skips pre-date this item.) The pre-change baseline on this same branch
was 3045 tests / 3040 pass — so +6 tests, none removed and none weakened.

The item's own verify also passed at `fgos return`, which re-ran it
independently of any claim made here (`passed: true`, `from: doing`,
`to: awaiting-approval`).

## Provenance of the change itself

The four defects were found by a read-only review agent auditing the runner
and fan-out half after `tsk-2sj` merged, then independently re-verified by
reading the real code before any of them were accepted:

- the whole-batch grant was confirmed dead by reading `claim-port.mjs:197-200`
  — `claimWork` calls `hasWorkerSlotRoom` without `batchSize`, so every claim
  is judged alone against `free`, and a whole-batch grant has nothing to bind
  it;
- the ungated spawn was confirmed by reading `loop.mjs`'s discovery sweep and
  grepping every `spawnWorker(` call site (two: one behind the claim, one
  not), plus confirming the block contains no `claimWork`/`moveWork`/`'doing'`
  at all.

GitNexus was not used as evidence for either: its index is stale on this
branch and it has a proven false negative on exactly this file
(`impact({target: 'runOnce'})` returning `impactedCount: 0, risk: LOW` while
`rg` finds the real production caller in `bin/fgos-runner.mjs`).

Retiring D8 was a user decision, taken after the conflict between the locked
rule and the implementation was surfaced with both options priced; it is
recorded as a supersede in the event log (seq 14983), with the original
decision left untouched per `AGENTS.md`.
