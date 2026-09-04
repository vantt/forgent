# P10-KERNEL-FIX — Red-Team Recheck of Fix Round 1

Status: REQUEST CHANGES | Reviewer: adversarial Red-Team recheck (independent) | Date: 2026-09-04

Target: `§7 Fix Round 1`'s claim that all nine findings in `§6` are addressed.
Worktree: `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9`
(uncommitted diff to `src/runner/coordination/session-engine.mjs` + 7 test files).

## Verdict

**REQUEST CHANGES.** Two new HIGH findings, one MEDIUM, one LOW.

Fix Round 1 is mostly real and mostly well-evidenced — six of the nine
dispositions verified clean under adversarial probing, and the Fixer's one
self-declared deviation from `§6` is honestly reported and its stated
justification is **factually true** (I reproduced both breakages myself). But:

- the deviation's *chosen resolution* leaves the exact defect `§6` named
  ("not a silent `missing`") live on the read path, as a **new regression
  against pre-fix HEAD** — and `§7.2` mischaracterizes it as pre-existing;
- MEDIUM-5's fix is correct in the code but its new regression test **cannot
  fail** — reverting the fix leaves the suite green while the red-team's own
  probe reproduces the original bug exactly.

Both have small, verified fixes. Details and repros below.

## Method

Every claim labelled POST-FIX / PRE-FIX / MUTATED below is recorded output from
a real run, not reasoning.

- Re-ran the predecessor's probes (`probe.mjs`, `probe-removed-protocol.mjs`)
  verbatim against the current code and against their `prefix/` pre-fix
  baseline tree.
- Built new probes: `recheck-drift-show.mjs` (real `fgos coordination show`
  CLI under drift), `recheck-high1-shapes.mjs` (10 resolution-failure shapes),
  `recheck-corrupt-assignment.mjs`, `recheck-agg-coowned.mjs`.
- Built a **mutation-testing harness**: a throwaway copy of the tree at
  `.claude/worktrees/_redteam-recheck-scratch` (git-ignored; **deleted after
  use**, worktree left byte-identical), in which I deliberately broke the
  gating logic and re-ran the new tests. The real
  `session-engine.mjs` was never edited.

All probe sources:
`/tmp/claude-1000/-home-vantt-projects-forgentX/c0828946-6a3e-4606-bc76-a0900fea1753/scratchpad/`

---

## NEW-HIGH-A — Version drift now makes `fgos coordination show` silently report a completed actor as `missing`. This is a regression against pre-fix HEAD, not pre-existing laxness.

**Where:** `session-engine.mjs`'s `classifySessionQuorum` — the
`opts.enforceDefinitionVersion` gate; `src/verbs/coordination/show.mjs:176`.

`§6` disposed HIGH-2 as: *"compare `manifest.definitionRef.version`, raise the
same explicit, correctly-attributed drift error the sibling doors raise **(not
a silent `missing`)**."* The Fixer scoped the refusal to `closeSessionByQuorum`
only. The close path is now correct. The **read** path still produces exactly
the silent `missing` `§6` named — and does so where pre-fix it produced the
truth.

**Repro — the real CLI, not the engine** (`recheck-drift-show.mjs`; the actor
genuinely completed both of its declared operations before the author bumped
the protocol version in place):

```
POST-FIX (current worktree)
  BEFORE drift exit=0 boundVersion=1.0.0 completed=["worker-actor"] missing=[]           failed=[] late=[] stderrWarning=(none)
  AFTER  drift exit=0 boundVersion=1.0.0 completed=[]              missing=["worker-actor"] failed=[] late=[] stderrWarning=(none)
```

`exit=0`. No warning on stderr. No drift field anywhere in the payload — the
JSON even still reports `definitionRef.version: "1.0.0"` while the on-disk
protocol is `1.0.1`. A user whose session looks stuck runs the one command
built for that, and is told *nobody has done any work* — the exact opposite of
the truth under the version the session is actually bound to.

**This is new.** Pre-fix, `classifySessionQuorum` never opened the protocol at
all, so drift could not reach a read (`probe.mjs drift`, `PROBE_ROOT=prefix/`):

```
PRE-FIX (HEAD baseline tree)
  BEFORE drift  completed= [ 'worker-actor' ] missing= []
  AFTER  drift  completed= [ 'worker-actor' ] missing= []
  closeSessionByQuorum: SUCCEEDED
```

`§7.2` describes the post-fix `AFTER drift` line as *"the pre-existing,
unrelated laxness of the read path ... same as before this whole fix"*. That
sentence is **false**, and it is the sentence carrying the deviation's weight.
The close-path half of `§7.2` is a genuine improvement over pre-fix
(`SUCCEEDED` → honest refusal); the read-path half is a genuine regression, and
the report presents the pair as if only the first happened.

**The Fixer's stated justification is TRUE — I verified it, don't reverse it on
that basis.** I reproduced both claimed breakages by removing the
`opts.enforceDefinitionVersion` gate in my scratch copy:

```
MUTATED (drift check unconditional) — Fixer's claim 1: probe.mjs Probe 1
  BEFORE drift  completed= [ 'worker-actor' ] missing= []
  CoordinationError: classifySessionQuorum: session "coord_redteam_drift" ...
    at classifySessionQuorum (...session-engine.mjs:3268:13)
    at evaluateSessionQuorum (...session-engine.mjs:3211:10)
    at Object.probeVersionDrift ...        <- crashed, never reached the refusal

MUTATED — Fixer's claim 2: coordination-aggregation-surface.test.mjs
  ℹ tests 13  ℹ pass 12  ℹ fail 1
  ✖ editing the bound protocol in place to drop completion.aggregation does NOT bypass the gate
    Error [CoordinationError]: ... refusing to close against a drifted definition
      at classifySessionQuorum (...:3268:13)
      at evaluateSessionQuorum (...:3211:10)
      at runCoordinationUseCase (...run.mjs:522:29)     <- uncaught, outside run.mjs's try
```

Both exactly as `§7.2` describes. No fabrication.

**The problem is the false dichotomy, not the evidence.** `§7.2` treats the
choice as *throw on reads* vs *classify against the drifted definition*. There
is a third option, and it is the shape the Fixer already used for HIGH-1 one
paragraph earlier: on a **read**, treat drift like any other resolution
failure and degrade `definition = null`, falling back to the pre-existing rule.
I implemented and ran it:

```
PROPOSED (close throws on drift; READ degrades to definition=null)
  BEFORE drift  completed= [ 'worker-actor' ] missing= []
  AFTER  drift  completed= [ 'worker-actor' ] missing= []          <- pre-fix truth restored
  closeSessionByQuorum: REFUSED -> [CoordinationError/validation] classifySessionQuorum: session
    "coord_redteam_drift" was opened against definition "...@1.0.0", but the resolved definition
    is now version "1.0.1" -- refusing to close against a drifted definition
```

All three goals at once: reads don't throw (the Fixer's constraint), reads
aren't silently wrong (`§6`'s constraint), close refuses honestly (`§6`'s
disposition). Regression delta versus the unmodified code, over every test my
scratch environment can run:

```
             tests  pass  fail
pristine      117    90    27      (the 27 are environmental — see note)
proposed      117    90    27      identical; all 3 drift/MEDIUM-5 tests ✔ in both
```

*(The 27 are an artifact of my /tmp scratch environment only — the `yaml`
module is unresolvable there, so every YAML-fixture protocol fails to load.
Identical in both arms, so the delta is sound. Incidentally this independently
confirms the predecessor's third HIGH-1 variant, the `yaml`-unavailable one.)*

**Trade-off, stated honestly:** under the degrade, a drifted read falls back to
the loose "any `assignment-created` event" rule (HIGH-3's known looseness). I
judge that acceptable — it is precisely the pre-fix answer, drift is an
abnormal state in which close is refused anyway, and "loose but right" beats
"strict and inverted." The alternative worth considering instead is to keep the
current classification but add an explicit drift field to `show`'s output, so
the answer is at least not *silent*. Either satisfies `§6`. The current code
satisfies neither.

**Fix:** two lines, verified above.

---

## NEW-HIGH-B — MEDIUM-5's new regression test is a phantom: reverting the fix it is named for leaves it green

**Where:** `test/verbs/coordination-aggregation-surface.test.mjs:363`.

`§7.5` presents this test as the proof of MEDIUM-5's fix. It is not. I reverted
the fix in my scratch copy — a one-token change back to the pre-Fix-Round-1
operation-id-only exclusion — and ran both the test and the predecessor's Probe
3 against that same build:

```
MUTATED (MEDIUM-5 fix reverted: `ref.ref === aggregationOutputOperationRef` only)

  $ node --test test/verbs/coordination-aggregation-surface.test.mjs
  ✔ P10-KERNEL-FIX MEDIUM-5: a DIFFERENT actor bound to the same outputOperationRef
    operation, for an unrelated reason, is NOT silently excluded -- only the
    aggregation's own designated actor (coordinator-actor) is (353.667779ms)
  ℹ tests 13   ℹ pass 13   ℹ fail 0          <- fully green

  $ node probe.mjs agg           # SAME build
  completed= [ 'coordinator-actor', 'analyst-actor' ] missing= [] late= []
  closeSessionByQuorum: CLOSED to "completed" with synthesize never performed by ANY actor
    and NO aggregation validated                <- the original MEDIUM-5 bug, fully alive
```

The bug the test is named for is reproducible in the very build the test calls
green.

**Why it can't fail.** `protocolDocCrossActorSynthesize` gives `analyst-actor`
exactly one binding — `synthesize`. Under the reverted, actor-blind exclusion,
that single binding is dropped, `actorGatingOperationIds` returns `[]`, and the
actor falls through to the **fallback** ("first `assignment-created` event for
this actor, anywhere"). `analyst-actor` has no such event, so the fallback also
reports it `missing`. The test's assertion
`missing == ['analyst-actor']` holds under both arms, for two completely
different reasons. It asserts an outcome that the fallback happens to
reproduce.

The predecessor's Probe 3 is discriminating precisely where this test is not:
its `analyst-actor` has a **second**, ordinary binding (`analyse`) that really
settles, so the fallback finds an event and reports `completed` — making the
two arms diverge.

**Fix:** one fixture line — give `analyst-actor` a second, ordinary declared
binding that settles, exactly as Probe 3 does, so the fallback can no longer
mask the exclusion. Then re-run the revert-mutation to confirm the test now
fails.

**Note on the other four new tests:** I applied the same falsifiability check
to HIGH-4's coverage and it **passes**. Two deliberate mutations, both caught:

```
MUTATED M1: gate ONLY on `required` (drop the driver-authorized+window clause)
  ℹ tests 42  ℹ pass 41  ℹ fail 1
  ✖ P10-KERNEL-FIX quorum: coordinator-actor stays incomplete ...

MUTATED M3: gate on only the FIRST gating binding per actor
  ℹ tests 42  ℹ pass 38  ℹ fail 4
  ✖ RFC chain P10-KERNEL-FIX quorum: proposer-actor ...
  ✖ Nominal-Group chain P10-KERNEL-FIX quorum: participant-a/participant-b ...
  ✖ Delphi chain P10-KERNEL-FIX quorum: panelist-a/panelist-b ...
  ✖ P10-KERNEL-FIX quorum: coordinator-actor stays incomplete ...
```

HIGH-4's tests are real. Only MEDIUM-5's is not.

---

## NEW-MEDIUM-C — MEDIUM-5's fix designates the aggregation actor by graph array order, with no check that the choice is unambiguous

**Where:** `session-engine.mjs:1403-1412` (`findActor:` loop, `break findActor`
on the first match) and `:1418`.

The fix picks *the first binding of `outputOperationRef` found while scanning
`spec.graph.nodes`* as "the" designated aggregation actor. Nothing validates
that exactly one exists. Two consequences, both live-reproduced
(`recheck-agg-coowned.mjs`; in both runs the aggregation **is** validated
first, isolating this from the separate aggregation gate):

**(a) Two actors legitimately co-owning the output ⇒ permanent deadlock.**

```
RECHECK 6a — two actors CO-OWN outputOperationRef; coordinator-actor listed first
graph-order first binding of "synthesize" = coordinator-actor;  aggregation validated -> outcome=consensus
completed= [ 'coordinator-actor' ] missing= [ 'analyst-actor' ]
closeSessionByQuorum: REFUSED -> ... is missing required actor(s) [analyst-actor] ...
```

`validateSessionAggregation` never materializes an Assignment for its output
operation (the code comment at `:1379-1392` says so explicitly, and that is the
whole reason the exclusion exists). So the non-designated co-owner's binding
can *never* be satisfied by any door. For this shape, MEDIUM-5's fix converts a
false-close into a false-deadlock — the exact failure the exclusion was written
to prevent, just relocated to the second actor.

**(b) Which actor deadlocks is decided by YAML array order.**

```
RECHECK 6b — SAME protocol, the two sibling entries in one node's operations[] swapped
graph-order first binding of "synthesize" = analyst-actor;  aggregation validated -> outcome=consensus
completed= [ 'analyst-actor' ] missing= [ 'coordinator-actor' ]
closeSessionByQuorum: REFUSED -> ... is missing required actor(s) [coordinator-actor] ...
```

Reordering two sibling entries in a single node's `operations[]` is a semantic
no-op everywhere else in this system. Here it silently swaps who is excused and
who is permanently blocked.

**Currently latent, and I checked rather than assumed:** `grep -rn
outputOperationRef core src domains plugins .agents` returns only engine and
schema code — **no shipped protocol declares `completion.aggregation` at all**.
The schema (`schema.mjs:1143`) requires only that `outputOperationRef` name a
declared operation id; it does not constrain how many graph bindings it has. So
this is a protocol-authoring footgun in a kernel rule, not a live break.

**Fix options:** reject at schema/load time when `outputOperationRef` has more
than one graph binding (turns a silent deadlock into an authoring error); or
exclude *every* actor bound to it but only when an `aggregation-validated`
event exists (see NEW-LOW-D). At minimum this belongs in `§5` Gaps, where it
currently is not.

---

## NEW-LOW-D — the second half of the predecessor's MEDIUM-5 was dropped by `§6` and is not recorded in Gaps

The original MEDIUM-5 had two parts: key on `actor + operation` (fixed), *and*
*"ideally require a validated aggregation to exist"* — the exclusion applies
whether or not the session ever produced an `aggregation-validated` event.
`§6` dispositioned only the first part and did not name the second as an
accepted residual; `§7.6`'s Gaps list does not carry it either.

Still live in the current code (`probe.mjs agg`, unmodified worktree):

```
completed= [ 'coordinator-actor' ] missing= [ 'analyst-actor' ] late= []
closeSessionByQuorum: REFUSED -> ... missing required actor(s) [analyst-actor] ...
```

`coordinator-actor` is reported **completed** with `synthesize` never performed
and no aggregation validated. On the `run.mjs` path `aggregationCloseParams`
covers this separately, so it is not exploitable there; a direct
`closeSessionByQuorum` call without `aggregationId` is not covered.

Low severity, and dropping it may well have been deliberate. But a residual
that a prior round named and a disposition silently dropped should be a Gaps
line, not an omission — the same standard `§6` itself applied to MEDIUM-6 and
LOW-8.

---

## What I attacked and found clean

Reported plainly rather than converted into low-severity findings.

**HIGH-1's `catch {}` is genuinely complete.** I constructed ten
resolution-failure shapes, eight of them beyond the two the Fixer tested
(`recheck-high1-shapes.mjs`). All ten degrade correctly:

```
OK  protocol directory deleted entirely
OK  .fgos/coordination-protocols unreadable (chmod 000)
OK  empty .yaml file dropped in
OK  empty .json file dropped in
OK  valid YAML, wrong kind (not a FlowDefinition)
OK  duplicate id in same tier
OK  protocol file is a DIRECTORY, not a file
OK  protocol file is a dangling symlink
OK  schema-valid FlowDefinition but graph.nodes empty
OK  schema-valid but completion.aggregation names an operation absent from the graph
```

**A suspected second HIGH-1-shaped hole — refuted by my own probe.** The new
gating path reads `assignment.json` per binding (`assignmentServesOperation`),
which throws `CoordinationError('corrupt-log')` **outside** the Fixer's
try/catch. I expected a new `show` break. It is not new
(`recheck-corrupt-assignment.mjs`):

```
POST-FIX  corrupt  `fgos coordination show` FAILED exit=5 :: assignment.json for "asgn_..." ...
PRE-FIX   corrupt  engine evaluateSessionQuorum THREW [CoordinationError/corrupt-log] ... (identical)
```

Pre-fix throws the same error from a different, pre-existing reader. Not a
regression.

**`missing`/`late`/`failed` vocabulary is closed.** The gating path's
`else → failed` branch cannot mislabel: `classifyOperationAssignment`
(`:1496`) returns only `late`, `failed`, or satisfied.

**Regression numbers reproduce exactly.** I re-ran `§7.8`'s focused set myself:

```
ℹ tests 760   ℹ pass 759   ℹ fail 1
✖ src/runner/coordination/** imports no Work lifecycle, merge, worktree, ... module
```

760/759/1 as claimed. I verified the single failure rather than accepting the
label: every reported violation resolves through a path containing the literal
substring `worktree` (e.g. `.../step-09-mvp6-to-mvp9/src/runner/dispatch/config.mjs`
"matches forbidden `worktree`") — the documented environmental false-fail.

**No weakened assertions in the touched tests.** I diffed every removed
`assert` across all 7 test files. The removals are the old
`assert.equal(first.closed, true, 'FINDING: the session auto-closes ...')`
assertions that encoded the bug, correctly inverted. The non-bug assertions
that were removed (`firstGrant.appended`, the idempotent-read-back deepEqual,
the authorization-count and zero-new-events checks) are all **re-added** in the
new, strictly stronger cross-call scenario in
`coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs`. Net
strengthening.

**HIGH-3's correction landed correctly and is properly narrowed.** `§1.3`'s
correction paragraph is present with the original claim left in place and
marked; `actorGatingOperationIds`'s doc comment states the real, narrower
guarantee. The remaining "byte-identical" at `§1.3` line 210 is scoped to the
empty-gating-list case, where it is genuinely true.

---

## Recommended actions, in order

1. **NEW-HIGH-A** — on drift, degrade `definition = null` for reads (keep the
   throw for `enforceDefinitionVersion`), or add an explicit drift field to
   `show`'s output. Verified two-line change; zero test delta. Correct `§7.2`'s
   "pre-existing laxness" sentence — it is the load-bearing claim behind the
   deviation and it is false.
2. **NEW-HIGH-B** — give `analyst-actor` a second ordinary settled binding in
   `protocolDocCrossActorSynthesize`, then confirm by reverting the MEDIUM-5
   fix that the test now fails.
3. **NEW-MEDIUM-C** — reject a multiply-bound `outputOperationRef` at load
   time, or gate the exclusion on a validated aggregation; failing either, add
   both the co-owner deadlock and the graph-order fragility to `§5` Gaps.
4. **NEW-LOW-D** — add the dropped "unconditional on an aggregation existing"
   residual to `§5` Gaps.

## Unresolved questions for the Coordinator

1. For NEW-HIGH-A, which posture does this track want for a *drifted* read —
   pre-fix truth via fallback (my recommendation, verified), or current
   classification plus an explicit drift indicator in `show`? Both satisfy
   `§6`; the first is smaller, the second is more informative.
2. Is a protocol binding two actors to one `outputOperationRef` (NEW-MEDIUM-C)
   meant to be legal at all? If not, the cheapest correct fix is a schema
   rejection, not a kernel heuristic.
