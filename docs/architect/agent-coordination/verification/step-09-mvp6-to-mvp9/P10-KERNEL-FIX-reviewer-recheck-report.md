# P10-KERNEL-FIX — Fix Round 1 Independent Recheck

Status: APPROVE WITH CONCERNS | Reviewer: independent recheck (not the first-pass
Reviewer or Red-Team) | Date: 2026-09-04

Target: Fix Round 1 (`P10-KERNEL-FIX.md` §7) against the disposition list in §6.
Worktree: `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9`
(uncommitted diff). Everything below labelled POST-FIX / PRE-FIX is real recorded
output from probes I wrote myself, run against the current worktree and against a
pre-fix baseline tree I first verified byte-identical to
`git show HEAD:src/runner/coordination/session-engine.mjs`.

My probe sources (disposable):
`/tmp/claude-1000/-home-vantt-projects-forgentX/c0828946-6a3e-4606-bc76-a0900fea1753/scratchpad/recheck-probe.mjs`,
`recheck-probe-runverb.mjs`, `recheck-probe-nodeops.mjs`.

## Verdict

**APPROVE WITH CONCERNS.** Eight of the nine dispositioned items are genuinely
delivered and independently verified. HIGH-2's declared deviation is real,
correctly reasoned, and I confirmed both halves of its justification by
construction. Every regression number in §7.8 reproduced on my own runs.

But the recheck turned up **one new HIGH and two new MEDIUMs**, all of the same
class the fix round itself accepted as blocking: an undisclosed behavioural
regression, and two claims in the report that my pre/post probes falsify.

New findings: **1 HIGH, 2 MEDIUM, 2 LOW.**

---

## Part 1 — Disposition checklist (§6), item by item

### HIGH-1 — resolution failure degrades to `definition = null` — **VERIFIED (with N1 below)**

`session-engine.mjs:3269-3274` wraps the `loadCoordinationProtocol` call in
`try { ... } catch { definition = null; }`. The version-drift check sits
*outside* that catch, so a `CoordinationError` is never swallowed — correct.

My own probes (not the Fixer's re-run):

```
R1 - unrelated malformed sibling protocol file
  clean, only op-one settled : eval completed=[] missing=["worker-actor"]
  + malformed sibling: eval   completed=["worker-actor"] missing=[]

R2 - bound protocol file REMOVED after open
  before removal: eval completed=[] missing=["worker-actor"]
  after removal : eval completed=["worker-actor"] missing=[]
```

Neither throws. `show.mjs:176`'s stated invariant is restored for the read path.
Confirmed.

### HIGH-2 — version drift — **VERIFIED on (a) and (b); (c) is a real new problem, see N2**

**(a) Is the Fixer's deviation reasoning correct?** Yes, verified two ways:

1. `run.mjs:522` (`quorumBeforeClose = evaluateSessionQuorum(...)`) really is
   outside the `try` that begins at `run.mjs:525`; `run.mjs:529`'s catch is
   `err instanceof CoordinationError` only. An unconditional drift throw from
   `classifySessionQuorum` would therefore propagate uncaught out of
   `runCoordinationUseCase`. Read directly, not inferred.
2. `test/verbs/coordination-aggregation-surface.test.mjs:471-491` ("editing the
   bound protocol in place to drop `completion.aggregation` does NOT bypass the
   gate") calls `rewriteBoundProtocol(tempDir, { withAggregation: false,
   version: '9.9.9' })` — it deliberately bumps the version, so it *does* trip a
   drift check, and it asserts the refusal arrives as `closeRefusalReason`
   (i.e. caught), not as a thrown error. An unconditional throw at `run.mjs:522`
   would break it exactly as §7.2 claims.

The stated deviation is honest and the reasoning holds.

**(b) Does `closeSessionByQuorum` now report drift honestly?** Yes:

```
R3 - version drift
  BEFORE drift: eval completed=["worker-actor"] missing=[]
  AFTER  drift: close REFUSED [CoordinationError/validation] classifySessionQuorum:
    session "coord_r3" was opened against definition
    "test.coordination-protocol.recheck@1.0.0", but the resolved definition is now
    version "1.0.1" -- refusing to close against a drifted definition
```

PRE-FIX, the same probe printed `close CLOSED -> completed`. The wrong-cause
"missing required actor(s)" misattribution is gone. Confirmed.

Note for the record: on the `run` verb path this new engine-door check is
belt-and-braces — `aggregationCloseParams` (`run.mjs:236-242`) already raises its
own drift error inside the try. The new check is what protects any *direct*
engine caller. That is a real improvement, just a narrower one than §7.2 implies.

**(c) Is the read path now silently wrong?** Yes — see N2. This is the one place
the narrowing bought a wrong-but-quiet answer, and the report describes it
incorrectly.

### HIGH-3 — false "byte-identical" claim corrected — **VERIFIED**

Both corrections are really present and really specific, read directly:

- `P10-KERNEL-FIX.md` §1.3 lines 109-140: the original claim is left in place and
  marked corrected, with the real narrower guarantee spelled out (fallback
  accepts any `assignment-created`; gating path demands an operation-stamped,
  settled Assignment) and the concrete non-stamping-door shape named
  (`createSessionAssignment` / `dispatchPrimaryTask` / `proposeConsult`).
- `session-engine.mjs:1360-1375` (the `actorGatingOperationIds` doc comment) now
  says "That fallback is NOT byte-identical behavior for a gating actor, only
  for a NON-gating one", with the same specifics.
- §5 Gaps lines 392-404 carry the latent-risk note with a real scenario, the
  reason it is currently latent (`agent-led` uses `openStandaloneSession`, no
  `definitionRef`), and why no fix was attempted.

The surviving "byte-for-byte unchanged" phrase in the `classifySessionQuorum`
comment is scoped to *an actor with no gating binding at all*, which is the
correct, true claim. Not a residual.

### HIGH-4 — quorum coverage for the 5 dark protocols — **VERIFIED, tests are genuine**

I read all four new tests. Each drives a real session through the real mediated
door (`openProtocolSession` / `dispatchDeclaredOperation` / `dispatchResearchFanOut`
/ `authorizeDeclaredOperation`) and each proves *both* halves with non-tautological
assertions:

- `coordination-visibility-window-fixture.test.mjs` (new test, `:781`) —
  `independent-research-fan-out-fan-in-gated.yaml`. Settles `dispatch-research`
  plus the whole researcher cohort and opens the window, then asserts
  `missing == ['coordinator-actor']` and that `closeSessionByQuorum` throws;
  then authorizes + dispatches `synthesize-findings` and asserts
  `missing == []`, `completed == ['coordinator-actor','researcher-a','researcher-b']`,
  and `closed.status === 'completed'`.
- `coordination-deliberation-method-chains.test.mjs` (three new tests) — RFC
  chain (`proposer-actor`: `propose` + `respond`), Nominal-Group chain
  (`participant-a`/`participant-b`: `private-propose` + `private-rank`, plus a
  positive assertion that single-binding `facilitator-actor` completes on its
  gated `clarify` alone), Delphi chain (`panelist-a`/`panelist-b`:
  `propose-round1` + `propose-round2`). Each asserts the exact `missing` actor
  list before, the throw, then `missing == []` and `status === 'completed'`
  after.

These are real, not shallow. Test-count deltas match §7.4 exactly, checked
against HEAD:

```
coordination-visibility-window-fixture.test.mjs  HEAD=16  NOW=17
coordination-deliberation-method-chains.test.mjs HEAD=9   NOW=12
```

My own runs: `tests 17 / pass 17 / fail 0` and `tests 12 / pass 12 / fail 0`.

### MEDIUM-5 — aggregation exclusion keyed on actor+operation — **VERIFIED**

`session-engine.mjs:1418`:

```js
if (ref.ref === aggregationOutputOperationRef && actorId === aggregationActorId) continue;
```

Falsifiability check done at the engine level rather than by weakening the test —
stronger evidence. My R4 probe, two actors bound to the aggregation's
`outputOperationRef`, `synthesize` never dispatched by anyone:

```
POST-FIX: completed=["coordinator-actor"] missing=["analyst-actor"]  -> close REFUSED
PRE-FIX : completed=["coordinator-actor","analyst-actor"] missing=[] -> close CLOSED
```

The non-designated actor is genuinely no longer excused. The new cross-actor test
in `coordination-aggregation-surface.test.mjs` drives the same thing through the
real `runCoordinationUseCase` surface, isolates the quorum refusal from the
separate "no validated aggregation" gate, and proves the close succeeds once
`analyst-actor` settles. Real. (See N4 for a residual in *how* the designated
actor is picked.)

### MEDIUM-6, LOW-8 — present in §5 Gaps — **VERIFIED**

Both are substantive, not one-liners. MEDIUM-6 (§5 lines 405-420) states the
scenario, the exact guard responsible (`!operationIds.includes(ref.ref)`), the
grep evidence that no shipped protocol has the shape, and what a real fix would
require (`(operationId, nodeId)` pairs through the whole call chain). LOW-8 (§5
lines 421-431) states the deadlock, cites `group-thinking-rfc-review-lite.yaml`'s
own header/P08.3, and names the only two real remedies.

### MEDIUM-7 — contained fix genuinely unreachable — **VERIFIED**

Read `run.mjs` myself. The three quorum entries really are three separate
top-level calls, not nested:

```
run.mjs:522  const quorumBeforeClose = evaluateSessionQuorum(...)
run.mjs:526  closeSessionByQuorum(..., aggregationCloseParams(...), engineOpts)
run.mjs:535  const finalQuorum = closed ? evaluateSessionQuorum(...) : quorumBeforeClose
```

A cache scoped to one `classifySessionQuorum` invocation cannot collapse them.
The claim is true. (Minor: there is also a *fourth* load per request at
`run.mjs:236` inside `aggregationCloseParams`, so the measured overhead is
slightly understated in §5 — not worth a finding.)

### INFO-9 — nothing silently changed — **VERIFIED**

`git diff test/verbs/coordination-aggregation-surface.test.mjs` is +117/-2. The
two deletions are the Doer's own §1.4 `dispatchRequest` →
`dispatchRequestNoAggregation` swaps in the two `withAggregation: false` tests.
Everything else is additive (two helper functions plus the one MEDIUM-5 test).
No assertion weakened, no test deleted, `dispatchRequest` untouched.

---

## Part 2 — New findings

### N1 (HIGH) — HIGH-1's fail-open degradation reintroduces the exact premature-close bug this cell exists to eliminate

**Where:** `src/runner/coordination/session-engine.mjs:3269-3274` (the blanket
`catch { definition = null; }`), reached from `closeSessionByQuorum`
(`session-engine.mjs:3451`).

Degrading to `definition = null` does not merely lose information — it turns the
whole multi-operation gating rule **off**, and the fallback it lands in is the
pre-fix rule that closes a session the instant each actor has *one* assignment.
`closeSessionByQuorum` then writes a **terminal** `completed` status.

My R1/R2 probes, one actor with two `required` operations, only `op-one` settled:

```
R1 - unrelated malformed sibling file dropped into .fgos/coordination-protocols/
  clean, close               : REFUSED [CoordinationError/validation] ... missing required actor(s) [worker-actor]
  + malformed sibling: close : CLOSED -> completed          <-- op-two never performed

R2 - bound protocol file removed after open
  before removal: close : REFUSED ... missing required actor(s) [worker-actor]
  after removal : close : CLOSED -> completed               <-- op-two never performed
```

One unrelated half-written file in a project's `.fgos/coordination-protocols/`
silently disables the kernel fix for **every** session in that project and lets
the session close early and irreversibly. There is no warning, no
`closeRefusalReason`, no event distinguishing it from a legitimate close.

**Why this was missed.** §6's own HIGH-1 disposition justified fail-open with
"this is a read/close-decision path, **not a mutation door**, so
fail-open-to-fallback is the correct posture." That premise is false for
`closeSessionByQuorum`, which is precisely a mutation door — it transitions the
session to terminal. §7.1 repeats the mechanism ("proceeds as if the session had
no bound definition at all") without ever stating this consequence, and it is
not in §5 Gaps.

**The fix round contradicts itself here.** HIGH-2's own resolution establishes
the right principle in this very file: a *read* stays permissive, a *close*
refuses, because a close is a mutation. Version drift (where the definition
resolved and we know exactly what changed) now refuses at close. Total
resolution failure (strictly *less* information) proceeds at close. Same door,
opposite postures, the weaker signal treated more permissively.

**Reachability, stated honestly.** Not reachable through today's `coordination run`
verb: I probed it, and `aggregationCloseParams` (`run.mjs:236`, pre-existing
unguarded `loadCoordinationProtocol`) throws first —

```
after malformed sibling: THREW [FlowDefinitionError] flow-definition: spec must be a non-null object
```

— so the request dies before `closeSessionByQuorum` runs. It is reachable at the
public engine door `closeSessionByQuorum`, which the test suite calls directly and
which any second verb/caller would. That makes N1 **latent in the same sense
HIGH-3 was latent**, and this track accepted HIGH-3 as a HIGH.

**Recommended fix (small, symmetric, no new file touched):** reuse the flag that
already exists. Have `closeSessionByQuorum`'s call site opt into strictness for
resolution failure too, so a close against a declared session whose definition
cannot be resolved refuses with a named `CoordinationError` instead of silently
falling back, while `evaluateSessionQuorum`'s read keeps degrading exactly as it
does now. Roughly four lines inside `classifySessionQuorum`. If the Coordinator
prefers not to change behaviour in this round, N1 must at minimum become a named
§5 Gap **and** the "not a mutation door" reasoning must be struck from the
`classifySessionQuorum` comment, because it will mislead the next change.

### N2 (MEDIUM) — the read path is now silently wrong under version drift, and the report states the opposite

**Where:** `P10-KERNEL-FIX.md` §5 (the version-drift bullet, line ~387) and §7.2
(the paragraph after the Probe 1 output, line ~732).

§5 says the read path "stays exactly as permissive under drift as it was before
this fix." §7.2 says the drifted read shows "the pre-existing, unrelated laxness
of the read path ... **same as before this whole fix**."

Both are false. My R3 probe, one actor, both required ops settled, then an
in-place version bump:

```
POST-FIX  AFTER drift: eval completed=[]                missing=["worker-actor"]
PRE-FIX   AFTER drift: eval completed=["worker-actor"]  missing=[]
```

Pre-fix, `classifySessionQuorum` never loaded the definition, so drift could not
affect it and the read was **right**. Post-fix the read is **wrong**: a fully
completed actor is reported `missing`. `fgos coordination show` — again, the
command a user reaches for when a session looks stuck — will now tell them an
actor that finished everything has done nothing, with no indication that drift is
the reason.

This is not fatal (read-only, no state written, and close correctly refuses), and
narrowing the throw to close was still the right immediate call. But it is a
genuine new read-path regression created by this cell, it is undisclosed, and the
report actively asserts the opposite in two places. That is the same class of
defect as HIGH-3, which this round accepted as blocking.

**Recommended:** correct both sentences, and add a §5 Gap naming the real
residual — a drifted declared-protocol session's quorum *read* misreports settled
actors as `missing`, because the stamps embed the version
(`protocolOperationStamp`, `session-engine.mjs:159`); the honest long-term fix is
to surface drift as a first-class field on the quorum read rather than letting it
masquerade as `missing`.

### N3 (MEDIUM) — HIGH-1 is fixed for `show`, not for `run`; the remaining half is not named

§6 framed HIGH-1 as covering both `run.mjs:522` and `show.mjs:176`. Fix Round 1
fixes the engine function, which fixes `show`. It does not fix `run`: my probe
above shows `runCoordinationUseCase` still dies with an uncaught
`FlowDefinitionError` when an unrelated malformed protocol file exists, thrown
from `run.mjs:236`'s own unguarded `loadCoordinationProtocol` inside
`aggregationCloseParams` and re-thrown by `run.mjs:529`'s
`instanceof CoordinationError` filter.

`run.mjs:236` is pre-existing at HEAD, so this is **not a regression from this
cell**, and §7.1 only ever claims the `show` invariant — no false statement. But
the user-visible symptom §6 set out to remove ("`fgos coordination run` throws
after real Assignments have been dispatched and events written") is still there,
and nothing in §5 or §7 says so. A reader of §7.1 will reasonably believe HIGH-1
is closed.

**Recommended:** name it in §5 Gaps as the surviving half, with the file:line, so
whoever fixes `run.mjs` next knows it is outstanding. No code change needed in
this round.

### N4 (LOW) — which actor gets the aggregation exclusion is decided by graph authoring order

**Where:** `session-engine.mjs:1403-1412`.

`aggregationActorId` is the actor on the **first** binding of
`outputOperationRef` found while walking `spec.graph.nodes` in order. Nothing
authoritative designates it. My R4 probe run twice, identical protocol, only the
order of two bindings at the same node swapped:

```
coordinator-first: completed=["coordinator-actor"] missing=["analyst-actor"]
analyst-first    : completed=["analyst-actor"]     missing=["coordinator-actor"]
```

In the second ordering the exclusion lands on the wrong actor, and the *real*
aggregation actor now needs a dispatched `synthesize` Assignment — which the MVP7
design never produces (that is the whole premise of §1.4). That session becomes
permanently unclosable: a HIGH-3-shaped hang, reached by nothing more than
authoring order.

No shipped protocol binds two actors to `outputOperationRef`, so this is inert
today, and it *is* acknowledged in the code comment and in §7.5 ("the FIRST such
binding found, graph order"). What is missing is the consequence. It belongs in
§5 Gaps next to MEDIUM-6, which is the same category of authoring-shape footgun.

### N5 (LOW) — §7.5's test-count arithmetic is wrong

§7.5 says `coordination-aggregation-surface.test.mjs` was "10 before this round's
three drift/MEDIUM-5-related changes." Checked against HEAD: the file had **12**
tests and now has **13** — this round added exactly one test and changed no
others in that file (the two `dispatchRequestNoAggregation` swaps are the Doer's
pre-round §1.4 change). Trivial, but this track's whole bar is that recorded
numbers are real.

---

## Part 3 — Regression evidence, personally re-run

Every number below is from my own run in this worktree, not copied.

| Run | My result | §7.8 claimed | Match |
|---|---|---|---|
| `coordination-visibility-window-fixture.test.mjs` | 17 / 17 / 0 | 17 / 17 / 0 | yes |
| `coordination-deliberation-method-chains.test.mjs` | 12 / 12 / 0 | 12 / 12 / 0 | yes |
| `coordination-aggregation-surface.test.mjs` | 13 / 13 / 0 | 13 / 13 / 0 | yes |
| `coordination-recovery-and-quorum.test.mjs` | 29 / 29 / 0 | (part of 117) | yes |
| `coordination-aggregation.test.mjs` | 46 / 46 / 0 | (part of 117) | yes |
| Five touched files, combined | **117 / 117 / 0** | 117 / 117 / 0 | yes |
| Master-loop + group-thinking-lite set (10 files) | **170 / 170 / 0** | 170 / 170 / 0 | yes |
| Combined focused regression | **760 / 759 / 1** | 760 / 759 / 1 | yes |
| Full-repo sweep | **5557 / 5549 / 1 fail / 7 skipped** | 5557 / 5548 / 2 | see below |

The single focused-regression failure is the standing environment false-fail,
confirmed by direct inspection rather than assumed:

```
test at test/runner/coordination-static.test.mjs:61:1
✖ src/runner/coordination/** imports no Work lifecycle, merge, worktree,
  transport-spawn, or mission-lite module
```

— the known worktree-path artefact for this whole track.

The single full-sweep failure is the standing baseline
`test/cli/fgos-intake-4.test.mjs:318` (`seq: 3` vs `seq: 2`), unrelated to
`src/runner/coordination/**`. My sweep did **not** reproduce §7.8's second
failure (`test/skills/fgos-mirror.test.mjs`), which independently corroborates
the Fixer's claim that it was a transient temp-file flake from a concurrent
process, not a regression. My pass count is therefore 5549, one higher than §7.8's.

## Part 4 — Adversarial checks that came back clean

Recorded so a later round does not redo them:

- **Lock leak on the new throw path.** The `enforceDefinitionVersion` error is
  thrown from inside `withSessionLock` (`session-engine.mjs:3451`).
  `withSessionLock` → `withEventsLock` (`src/state/events.mjs:404-411`) releases
  in a `finally`. No leaked lock. Clear.
- **Unguarded `node.operations` iteration.** `schema.mjs:933` makes
  `node.operations` optional ("must be an array when provided"), and
  `actorGatingOperationIds` iterates it twice with no guard — including the new
  Fix-Round-1 aggregation-actor lookup. I probed a schema-legal protocol with an
  operation-less node: no crash, identical pre-fix and post-fix. The loader
  normalizes nodes to `operations: []`. Not a defect.
- **`CoordinationError` swallowed by HIGH-1's blanket catch.** No — the drift
  check sits outside the `try`. Clear.
- **MEDIUM-5 test falsifiability.** Verified at the engine level with a pre/post
  probe delta rather than by trusting the test. It would have caught the
  regression.

## Recommended actions, in order

1. **N1 (HIGH)** — make `closeSessionByQuorum` refuse a declared-protocol session
   whose definition failed to resolve, symmetric with the drift refusal it
   already has, leaving reads degrading as they do now. If deferred: strike the
   "not a mutation door" reasoning from the `classifySessionQuorum` comment and
   add N1 to §5 Gaps with the R1/R2 evidence.
2. **N2 (MEDIUM)** — correct the two false sentences in §5 and §7.2, and add the
   drifted-read misreport as a named Gap.
3. **N3 (MEDIUM)** — name `run.mjs:236` as HIGH-1's surviving half in §5 Gaps.
4. **N4 / N5 (LOW)** — add the graph-order dependence to §5 Gaps; fix §7.5's
   count.

None of these require touching a file outside this cell's existing May-Touch list
plus the report.

## Unresolved questions

1. Does the Coordinator want N1 fixed in a second round, or accepted as a Gap on
   the grounds that no production verb reaches it today? The four-line symmetric
   fix looks cheaper than the reasoning debt of leaving a wrong premise in a
   kernel comment, but that is the Coordinator's call, not mine.
2. Is a drifted-definition quorum *read* worth a first-class signal (a `drifted`
   field on the quorum result) rather than letting drift masquerade as `missing`?
   That is a product decision beyond this fix round's scope, but N2 is the second
   time this round has had to reason around it.
