Mode: small

## Discovery grounding

Discovery verdict was `clear` (no `exploring`/CONTEXT.md round exists for
this item). Confirmed directly against the real code before this plan was
written:

- `src/verbs/merge/approve.mjs` calls
  `moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval',
  reason, role: 'system' })` at exactly 18 call sites (confirmed by grep
  sweep during validating: `grep -c "to: 'blocked', expectedStatus:
  'awaiting-approval'" src/verbs/merge/approve.mjs` → 18) — every
  failure-to-block path the item's own description names (attestation
  refusal, catchup conflict/merge-refused/verify-fail, --github failure,
  plus more further down the file), all unguarded. Every one of the 18
  follows the identical 3-step shape `moveWork(...); addFriction(...);
  return {...};` (spot-checked at lines 371, 418, 512-651, 744, 787-840,
  896 — every site fits this shape, no outlier found).
- `src/state/status-fsm.mjs:257-259` — `transitionWork`'s CAS check throws
  `FsmError('conflict', 'transitionWork: expected status "<expected>" ...
  but found "<actual>" ...')` when the item's real status no longer
  matches `expectedStatus`. `FsmError` carries only `category` + message
  (no structured expected/actual fields on the error object itself).
- `src/state/store.mjs:88` (`categoryOf(err)`) is this module's own
  documented convention for classifying a thrown error by its `.category`
  property, already used at at least one other conflict-catching call site
  (`src/runner/claim-port.mjs:279`, `err instanceof FsmError &&
  err.category === 'conflict'`) — this plan follows the `categoryOf`
  helper instead, per store.mjs's own doc comment ("read the property
  directly rather than an instanceof-chain").
- `listWork(dir).work[id]` (`src/state/store.mjs:1903-1905`) is the
  existing read shape for a fresh single-item status re-read, already used
  the same way at `src/verbs/merge/reject.mjs:14`
  (`listWork(dir).work[id]`) and `src/state/store.mjs:2015`
  (`view.work[id].status`) — this plan's `actual` field reuses this exact
  precedent, not a new read path.
- `moveDeliveredOrRecordFault` (`approve.mjs:76-109`) is the file's own
  existing precedent for wrapping one `moveWork` call, catching one error
  class, and returning a structured non-throwing result instead of a raw
  propagate — same shape this plan follows for the failure-to-block side,
  not a new pattern invented from nothing.
- Only two callers of `approveUseCase` exist in the whole repo:
  `src/verbs/merge/merge.mjs` and `bin/fgos.mjs` (both internal CLI
  wiring) — confirmed by grep since GitNexus's nearest indexed target
  (`/home/vantt/projects/forgentX`, main checkout) is 2276 commits behind
  HEAD and its `impact` lookup for `approveUseCase`/`approve` returned "not
  found" against that stale index (this item's own worktree isn't indexed
  at all). `impact-analysis: degraded` — blast radius not confirmed by the
  tool; cross-checked via direct grep per the repo's own capability-gate
  instructions instead. Narrow, internal blast radius: no external
  consumer of `approveUseCase`'s return/throw shape exists outside this
  repo's own CLI dispatch.

## Approach

**Chosen path.** Add one small helper, `moveBlockedOrConflict(dir, { id,
reason, role })`, next to the existing `moveDeliveredOrRecordFault`
helper in `approve.mjs`. It wraps exactly the `moveWork(...to:
'blocked'...)` call:

- On success: returns `null` — the call site proceeds exactly as it does
  today (its own `addFriction` + `return {...}`).
- On a caught conflict (`categoryOf(err) === 'conflict'`): re-reads the
  item's real current status via the store's own `listWork(dir)` (never
  parses the thrown error's message string — the message is prose, not a
  data contract) and returns the structured envelope from the item's own
  acceptance criteria: `{ outcome: 'blocked', reason:
  'state-changed-concurrently', expected: 'awaiting-approval', actual:
  <real status just read> }`. The call site returns this envelope
  immediately in place of its own normal return, skipping its own
  `addFriction` call (a friction record describing THIS write's own
  reason/detail would be describing a write that never landed — the state
  already changed out from under it for a different, real reason that
  belongs to whatever DID land it, not to this one).
- Any other error class re-throws unchanged (a `StoreError` from a
  genuine precondition failure, an `EventLogError` from the write itself
  — neither is this helper's concern, same boundary
  `moveDeliveredOrRecordFault` already draws for its own one error class).

**Alternatives rejected.**
- *Catch at one outer boundary in `approveUseCase` instead of wrapping
  each call site* — rejected: the ~15 call sites return ~15 different
  payload shapes today (different `mode`/`target`/`conflictedFiles`/etc.
  fields); a single outer try/catch cannot tell which in-flight call's
  `moveWork` threw without unwinding the whole function, and would still
  need per-site changes to distinguish "my own conflict" from a sibling
  call's error bubbling through the same catch.
- *Parse `expected`/`actual` out of the FsmError message string with a
  regex* — rejected: the message is documented prose
  (`status-fsm.mjs:258`), not a data contract; a future wording change
  would silently break the regex. `expected` is already known at the call
  site (it is always the literal `'awaiting-approval'` this file passes
  in); `actual` is read fresh from the real store instead.
- *Widen `FsmError` itself to carry structured `expected`/`actual`
  fields* — rejected as out of this item's scope: `FsmError` is a
  cross-cutting type used well beyond this one failure path
  (`transitionStage`, every other `moveWork` caller in the repo); changing
  its shape is a bigger, separate change than this item's own narrow
  acceptance criteria ask for.

**Files touched, in order:**
1. `src/verbs/merge/approve.mjs` — add `categoryOf` to the existing
   `store.mjs` import; add `moveBlockedOrConflict` helper near
   `moveDeliveredOrRecordFault`; replace each of the 18
   `moveWork(...to:'blocked', expectedStatus:'awaiting-approval'...)`
   call sites with a call to the helper + an `if (conflict) return
   conflict;` guard ahead of that site's own `addFriction`/`return`.
2. `test/cli/fgos-approve-2.test.mjs` — this file already covers the
   catchup-conflict/verify-fail-post-merge blocking paths thematically;
   the two new cases (AC4/AC5) belong here rather than a new file.

**Risk map.**

| Component | Risk | Proof point (owned by validating) |
|---|---|---|
| Helper catches the RIGHT error class only (`conflict`, not `precondition`/`unexpected`) | standard | AC4 test: simulate the race, assert structured result, exit 0 (not exit 3/raw throw) |
| Success paths (merge landed, `moveDeliveredOrRecordFault`) stay untouched | standard | Existing approve test suite (this file is shared; a broken success path would show as regressions across fgos-approve*.test.mjs) |
| Every one of the 18 call sites gets the same guard, none skipped | light — mechanical, but easy to miss one in a 927-line file | Full-file grep sweep (`grep -c "to: 'blocked', expectedStatus: 'awaiting-approval'"` before edit is 18; after edit that count must be 0 and the helper-call form's count must be 18) as part of implementing, plus `npm test` regression on the whole approve suite |
| `actual` read reflects reality, not a stale in-memory copy | standard | AC5 test: simulate event-regression replay leaving a stale `actual`, assert the read is fresh |

`impact-analysis: degraded` (see Discovery grounding above) — the proof
above leans on direct test coverage rather than a fresh blast-radius
read, since GitNexus's nearest indexed target is over 2000 commits stale
for this repo.

## Shape

Single pass-through item, no split (Step 4: one honest piece — a
mechanical wrap-and-guard applied uniformly across one file's existing
failure-to-block call sites, plus two new test cases). Concrete cases to
prove, matching this item's own AC4/AC5:

1. **AC4 — CAS conflict on a local merge-conflict/catchup path.** Approve
   reads the item as `awaiting-approval`; simulate a concurrent actor
   moving it to `blocked` (a different reason) between that read and this
   call's own `moveWork(...to:'blocked'...)` write (e.g. drive the item to
   `blocked` via a second `moveWork` call inside the test, immediately
   before invoking the code path under test, or monkey-patch/stub
   `moveWork` for that one call to throw the real `FsmError('conflict',
   ...)` shape `transitionWork` throws) — assert `approveUseCase` returns
   the structured `{ outcome: 'blocked', reason:
   'state-changed-concurrently', expected: 'awaiting-approval', actual:
   'blocked' }` result (exit 0 from the CLI's own perspective — a
   returned value, not a thrown error), never a raw exit 3/uncaught
   throw.
2. **AC5 — stale `actual` from an event-regression replay.** Same shape,
   but the "real" status the helper re-reads after the catch differs from
   the status the CAS error's own message names (simulating a replay
   regression) — assert the structured result's `actual` field reflects
   what `listWork` reads fresh at catch time, not a value parsed out of
   the error message.
3. **Regression: an ordinary (non-conflicting) block still works
   unchanged.** Already covered by the existing `fgos-approve-2.test.mjs`
   cases (merge-conflict, verify-fail-post-merge) — these must keep
   passing unmodified, proving the helper's `null`-return / fall-through
   path is byte-identical to today's direct `moveWork` call on the
   non-conflict case.

## Feasibility matrix (fgos-coding-validating)

Reality gate (all six dimensions, each with a concrete citation):

- **Mode fit** — PASS. `small` matches a single-file mechanical wrap
  applied uniformly, no gray areas — neither `tiny` (18 call sites across
  a 927-line file is more than "a couple of files, one direct task") nor
  `standard`/`high-risk` (no auth/data-model/audit/external-system/
  public-contract/cross-platform/multi-domain flag applies; the one flag
  that does — existing covered behavior — is exactly what `small`'s "a few
  files, no gray areas" already covers for a single already-tested file).
- **Repo fit** — PASS. Every file/function/pattern this plan leans on was
  read directly, not assumed: `approve.mjs`'s 18 call sites (grep-counted
  above), `status-fsm.mjs:257-259`'s exact `FsmError('conflict', ...)`
  shape, `store.mjs:88`'s `categoryOf`, `store.mjs:1903-1905`'s
  `listWork`, and the `moveDeliveredOrRecordFault` precedent
  (`approve.mjs:76-109`, 3 call sites: lines 688, 862, 914).
- **Assumptions** — PASS, see feasibility matrix rows below (all three
  medium-or-higher rows carry accepted evidence).
- **Smaller path** — PASS. Wrapping only the 4 explicitly-named call sites
  from the item's own description instead of all 18 was considered and
  rejected: AC1 says "approve must catch CAS mismatch from failure-to-block
  transitions" (unscoped to a named subset), and a partial fix would leave
  the remaining 14 sites still raw-throwing on the exact same race —
  defeating the item's own purpose. One shared helper applied uniformly is
  the smaller path, not a larger one.
- **Proof surface** — PASS. `verify` field synced to `node --test
  test/cli/fgos-approve-2.test.mjs` (real, runnable, not a placeholder).
- **Impact-analysis posture** — PASS (degraded, named plainly, not
  silently dropped). Re-checked at validating time
  (`fgos tool query --capability impact-analysis --status present`):
  identical result to the planning-time check — gitnexus `present` but its
  nearest indexed target is 2276 commits behind HEAD and its own `impact`
  lookup for `approveUseCase`/`approve` returned "not found" against that
  stale index; this item's worktree isn't indexed at all. Per the
  Discovery-grounding section above, cross-checked via direct grep instead
  (only `merge.mjs`/`bin/fgos.mjs` call `approveUseCase`).

Feasibility matrix (rows for every risk-map item flagged `standard` or
higher — the `light` mechanical-sweep row is below that threshold and
carries its own proof plan already: a grep-count sweep plus full
regression, both named in the risk map above):

| Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| The helper catches only `categoryOf(err) === 'conflict'`, letting every other error class (`precondition`, `unexpected`, `EventLogError`) propagate unchanged | standard | Confirm `transitionWork`'s only CAS-mismatch category is `'conflict'`, and that `moveWork` re-throws it verbatim rather than wrapping it | Read `status-fsm.mjs:247-259`: the precondition guards throw `FsmError('precondition', ...)`; the CAS check (line 257) throws `FsmError('conflict', ...)` — the only two categories reachable before the transition-table lookup. Read `store.mjs:675-690` (`moveWork`): calls `transitionWork` directly with no surrounding try/catch — nothing wraps or reclassifies its throw before it reaches `approve.mjs`. | PASS |
| Success paths (`moveDeliveredOrRecordFault` and its 3 `to:'delivered'` call sites) are structurally untouched by this change | standard | Confirm the delivered-path helper and its call sites share no code with the 18 blocked-path sites this plan touches | Read `approve.mjs:76-109` (`moveDeliveredOrRecordFault`) and grepped its 3 call sites (688, 862, 914) plus the separate direct `to:'delivered'` call in the `--github` merged branch (line 363) — none call or are called by the new `moveBlockedOrConflict` helper; disjoint code paths. | PASS |
| `listWork(dir).work[id].status`, read immediately after the caught conflict, reflects the item's real current status rather than stale in-memory data | standard | An existing precedent in this same module reads the store the same synchronous way, with no caching layer in front of it | `store.mjs:1903-1905`: `listWork(dir)` calls `currentEffectiveView(dir)` directly — rebuilds from the event log fresh, every call, no cache. Same read shape already used for a fresh single-item status check at `reject.mjs:14` and `store.mjs:2015`. | PASS |

**Decide: READY.** Every reality-gate dimension passed with a concrete
citation; every medium-or-higher risk-map row carries accepted evidence,
no unproven row. Not `READY WITH CONSTRAINTS` — no accepted-but-caveated
row exists; not `NOT READY` — no FAIL anywhere.

**Gate Step 1 (tier A/B).** No trigger fired: T1 (competing options) does
not apply — the Approach section above already compared and rejected the
two real alternatives (outer-boundary catch, message-string parsing) with
concrete reasons, nothing is still standing; T2 (CONTEXT.md conflict)
does not apply — no CONTEXT.md exists for this item (discovery verdict
was `clear`, skipping `exploring`); T3 (unwritable child spec) does not
apply — this is a pass-through item, no children. Cost verdict:
**REVERSIBLE**.

## Outstanding questions

None
