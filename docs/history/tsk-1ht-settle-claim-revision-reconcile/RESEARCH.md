# Research — tsk-1ht: settleClaim revision-CAS has no reconcile path

## Round 1 — 2026-08-26 (discovery stage)

**Asked:** Verify the bug report's root-cause claims (settleClaim's
unconditional CAS refuse, getItemDurableRevision hashing the whole item
JSON) and find whether the codebase already has a mechanism to distinguish
"same claim-holder's own legitimate mid-lifecycle write" from "a genuinely
different actor's conflicting write", since that distinction is what an
"explicit reconcile" branch would need.

**Checked (repo, direct read — all in this checkout):**

1. `src/state/store.mjs:1001-1124` (`settleClaim`) — full body read.
   - Line 1062-1066 and 1086-1088: settleClaim already DOES check writer
     identity, but only for *who is calling settle* (`currentWriterId` vs
     `claim.writerId`) — not for who caused the revision drift.
   - Line 1101-1105: the revision check is exactly as reported —
     unconditional `throw new StoreError('conflict', ...)` on any
     `curRev !== freshClaim.preClaimRevision`, zero reconcile branch, no
     use of writer identity at all here. **Confirmed as reported.**

2. `src/state/runtime-coordination.mjs:49-53` (`getItemDurableRevision`) —
   confirmed: `crypto.createHash('sha256').update(JSON.stringify(item))...`
   — hashes the item's entire JSON. **Confirmed as reported.**

3. Searched `writerId` usage repo-wide
   (`rg -n "writerId" src/state/store.mjs`) — no per-mutating-function
   check exists anywhere else that gates writes by claim ownership. Any
   caller (any writerId) can call `editWork`/`moveWork` etc. on a claimed
   item; only `settleClaim` itself checks writer identity, and only
   against its OWN caller, not against whoever produced the intervening
   edits.

4. **Key finding — the reconcile primitive already exists, just unused
   here.** Every mutating event door in `store.mjs` unconditionally stamps
   `payload.writer = resolveWriterIdentity(dir)` before appending (seen at
   lines ~468 `work.edit`, ~502 `work.resolve-park-reason`, ~712, ~1401,
   ~1496, ~1533 — same pattern each time). `src/state/events.mjs:451` does
   the analogous stamp (`src`) at the raw-event layer. So every event in
   `events.jsonl` already carries who wrote it. `getItemDurableRevision`
   only hashes the CURRENT snapshot and throws away this provenance — a
   reconcile branch could instead replay/scan the events for `id` since
   the claim's `acquiredAt`/`preClaimRevision` snapshot and check whether
   every one of them was written by `claim.writerId` (the same session
   that's now settling). If yes, the drift is self-caused and
   reconcilable; if any event in that window has a different writer, it's
   a genuine conflict and settleClaim should keep refusing exactly as
   today.

5. `test/state/runtime-coordination.test.mjs`:
   - Line 444-460: "CAS/revision conflict leaves the claim untouched" —
     constructs the conflict by acquiring a claim with a
     `preClaimRevision` that will never match (`'a-revision-that-will-
     never-match'`), no writer-identity distinction involved at all.
   - Line 503-523: "a durable content change with the SAME status is not
     flagged stale... but settleClaim still catches it via
     preClaimRevision" — this is the test whose comment claims to
     simulate "a real edit by a different actor, not this claim's own
     doing" (line 510), but the test body calls `editWork(dir, {...})`
     directly in the same process with NO distinct writer identity setup
     at all (no writerId override, no separate session). **The existing
     test suite has no test that actually constructs two DIFFERENT
     writerIds racing on the same claimed item** — the "different actor"
     framing in that comment is aspirational, not mechanically enforced
     by the test. This means today's tests would not distinguish a
     same-writer-reconcile fix from a regression, as long as the fix
     still refuses when `editWork` is called with a genuinely different
     `resolveWriterIdentity(dir).id` than the claim's `writerId`.

6. `docs/architect/doing-coordination-redesign.md`:
   - §16.3 (line 807-812) literal text: "Settlement after durable revision
     drift fails or goes through explicit reconcile." — quote in the item
     matches verbatim.
   - §9.2 (line 472-489), the "Successful Return For Approval" spec,
     already lists as an input precondition: "durable item still matches
     preClaimRevision **or accepted reconcile rule**" (line 477) — the doc
     anticipated needing a reconcile rule back when this section was
     written, but never specified what that rule is. No existing
     precedent/pattern for a reconcile step exists anywhere else in the
     codebase today (grep found none).

**Verdict: clear.**

Root cause is fully confirmed with line citations, no ambiguity is left
about whether the bug is real. The one open design question (what exactly
"legitimate self-drift" means) is answerable directly from evidence already
gathered here, not a product decision needing a person: reconcile when
every `events.jsonl` entry for `id` since the claim's own
`preClaimRevision` snapshot was written by `claim.writerId`; keep refusing
otherwise. This is planning's job to shape into an actual diff — nothing
further here is unclear enough to need `exploring`.

**Verify (handed to discover's `--verify`):** Reproduce tsk-1sl's own
sequence end to end (`fgos pick` → `fgos edit`/`fgos discover`/`fgos gate-
approve`/`fgos plan`, all as the SAME writer → `fgos return`) and confirm
`return` now succeeds; then run `test/state/runtime-coordination.test.mjs`
to confirm the existing CAS-conflict-must-refuse tests still pass
unchanged, plus a NEW test that constructs two distinct `writerId`s writing
to the same claimed item (a case the current suite does not cover) and
confirms settleClaim still refuses in that case.

## Round 2 — 2026-08-26 (live confirmation during this item's own planning->executing edge)

While driving THIS item through `fgos-coding-validating`'s own Gate, the
`fgos plan tsk-1ht --verdict pass-through` call itself hit the exact bug
being fixed, live, expanding the confirmed blast radius beyond `fgos
return`:

**What happened:** this item's own `risk` field is `heavy` (correctly
classified at discovery, per RESEARCH.md round 1 and the plan's own risk
map). `src/intake/plan.mjs`'s `resolvePlan` (lines 766-816) has an
INDEPENDENT engine-level floor: `keywordRiskGate = work.risk ===
HEAVY_RISK && !heavyRiskAlreadyConfirmed && !citesRealEvidence` — true
here (no CONTEXT.md/locked decision exists, since discovery's own verdict
was `clear` and skipped `exploring`). This forces `putInAwaiting` (line
814) regardless of the caller's own `--verdict pass-through`, exactly as
`fgos plan --help`'s own text warns ("downstream safety gates ...  still
apply unconditionally").

`putInAwaiting` (`src/state/store.mjs:1306-1320`) delegates straight to
`settleClaim` when a claim is active (line 1309) — and THIS call hit the
CAS refuse, live:

```
StoreError: settleClaim: item "tsk-1ht" durable revision changed from "c0ae0a2d0d7819c2" to "6290017cc469f02b".
    at file:///.../src/state/store.mjs:1104:17
    at withClaimsLock (file:///.../src/state/runtime-coordination.mjs:103:12)
    at file:///.../src/state/store.mjs:1069:27
    at withEventsLockAndRefresh (file:///.../src/state/store.mjs:212:17)
    at settleClaim (file:///.../src/state/store.mjs:1068:17)
    at putInAwaiting (file:///.../src/state/store.mjs:1309:12)
    at resolvePlan (file:///.../src/intake/plan.mjs:814:5)
```

**Why this matters:** the original report (tsk-1sl repro) only showed
`fgos return` refusing. This live hit proves the SAME bug also blocks the
engine's own heavy-risk ask-gate (`putInAwaiting`) — meaning a heavy-risk
coding item that picks up ANY same-writer edit after claim (the ordinary,
expected `fgos-coding-planning`/`fgos-coding-discovering` pattern) can get
fully stuck: unable to `return`, and unable to even be parked to ask a
person. This is a genuinely worse failure mode than originally scoped —
recorded here as additional evidence, not a scope change to the fix
itself (the SAME reconcile branch in `settleClaim` fixes both call paths,
since both go through the identical CAS check at store.mjs:1101-1105).

This also confirms `putInAwaiting` belongs in this item's blast-radius
list (already-listed in plan.md's risk map as "store.mjs's own internal
delegate", now identified precisely).

## Round 3 — 2026-08-26 (implementation: two real bugs caught by the new tests, before they ever shipped)

Implementing `revisionDriftIsSelfCaused` in `src/state/store.mjs` and
running the new regression tests (see plan.md's Shape) caught two real
defects in the FIRST version of the reconcile logic — both fixed before
this change was considered done, neither found by inspection alone:

1. **ts-format bug (silently disabled the entire refuse path).** The first
   version compared `event.ts` directly against a NUMBER
   (`new Date(claim.acquiredAt).getTime()`), based on this plan's own
   earlier (wrong) Repo-fit finding that `event.ts` was a numeric
   `Date.now()`. The REAL append path (`src/state/events.mjs`'s
   `appendEventCore`) always stamps `ts: new Date().toISOString()` — an ISO
   STRING — overriding whatever the caller passed. Comparing a string to a
   number via `>` silently coerces to `NaN`, always false, which made
   EVERY event look like it was outside the drift window regardless of
   writer — the reconcile fired unconditionally, for ANY writer. Caught
   immediately: the "still refuses a GENUINELY DIFFERENT writer" test
   failed to throw on the very first run. Fixed by converting both sides
   via `new Date(...).getTime()`.
2. **Vacuous-truth bug (reconciled drift that no event explained at all).**
   `events.every(predicate)` on the empty set (no events in the drift
   window) trivially returns `true` — after fixing bug 1, this made TWO
   pre-existing tests fail (`settleClaim CAS validation failure`,
   `settleClaim on a CAS/revision conflict leaves the claim untouched`),
   both of which construct a bogus/fabricated `preClaimRevision` with ZERO
   real events since claim time. The fix requires POSITIVE evidence — at
   least one same-writer event actually explaining the drift — never
   reconciling a mismatch nothing in the log accounts for.

Both fixes are in the shipped `revisionDriftIsSelfCaused`
(`src/state/store.mjs`). Full suite: 24/24 pass in
`test/state/runtime-coordination.test.mjs`, including both fixed
pre-existing tests, the new same-writer/different-writer/unstamped-event
tests, and a corrected version of "a durable content change with the SAME
status..." (its own comment always claimed a different actor; the
implementation now actually constructs one via `FGOS_SESSION_ID`, matching
what it always said it tested).

## Round 4 — 2026-08-26 (a real live bug found only by retrying against the real repo, plus a third bug caught by an intermittent test flake)

**Bug 3 (blast-radius gap): decision/gate-approve events treated as
drift-relevant.** Retrying `fgos plan tsk-1ht` against the REAL repo (not
a synthetic test fixture) after round 3's fixes STILL refused. Live
inspection of the actual `.fgos/` event log for `tsk-1ht`
(`readRawEvents` against the real store) showed `decision` and
`work.gate-approve` events with `payload.writer: undefined` sitting inside
the drift window — exactly the routine `fgos decision`/`fgos gate-approve`
calls `fgos-coding-planning`/`fgos-coding-validating` make by design. The
original design scanned EVERY event referencing the item's id regardless
of type, so these unstamped-but-harmless events made the reconcile fail
closed on every real coding-domain item — the synthetic unit tests never
caught this because none of them called `addDecision`/`recordGateApprove`
mid-window. Confirmed via `replay.mjs`'s fold switch that `decision` →
`view.decisions`/`decisionsById`, `work.gate-approve` → `view.gates`,
`work.discovery` → `view.discovery`, `work.outcome` → `view.outcomes`,
`work.friction` → `view.frictions`, `work.call-summary` → `view.callThreads`
— all side-log structures `getItemDurableRevision` never hashes (it only
hashes `view.work[id]`). Fixed by adding `SIDE_LOG_ONLY_EVENT_TYPES`, a
DENYLIST (not allowlist, so an unrecognized future type defaults to the
safe/conservative "still scanned" path) of these six types, skipped by the
scan regardless of writer. A new regression test
("...even when unstamped side-log events (decision, gate-approve) also
happened mid-claim") locks this in.

**Bug 4 (real intermittent flake, ~20% of full-suite runs): strict `>`
timestamp comparison.** Adding bug 3's regression test surfaced a
genuinely intermittent failure — passed standalone and paired every time,
but failed roughly 1 in 5 full-suite runs. Root cause: `ts`/`acquiredAt`
both have millisecond resolution, and the very FIRST event appended right
after `acquireClaim` (e.g. the test's own first `editWork` call) can
legitimately land in the SAME millisecond as `claim.acquiredAt` on a fast
machine — `eventTsMs > acquiredAtMs` is then false, silently excluding
that edit from the scan and leaving `sawSelfCausedEvent` false (no
qualifying event seen at all), so the whole check failed CLOSED
non-deterministically. Fixed by using `>=` instead of `>` — an event from
strictly BEFORE the claim (e.g. the item's own `work.add`) has a
genuinely earlier, non-colliding timestamp in practice, so this loses no
real exclusion. Confirmed fixed: 7/7 clean full-suite runs after the
change (the pre-fix rate was roughly 4/5 clean, 1/5 failing).

Both of these were caught by actually retrying the fix against the real
repo and by the test suite's own intermittent behavior — neither would
have been caught by code review alone.

