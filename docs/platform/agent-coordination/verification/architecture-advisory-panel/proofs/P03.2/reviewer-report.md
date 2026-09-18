# Cell P03.2 — Independent Reviewer Report

Scope: `core/coordination-protocols/architecture-advisory-panel-v1.yaml`,
`core/protocol-packs/group-thinking.json`,
`test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`,
`test/verbs/coordination-group-thinking-pack-registration.test.mjs`
(commits `faff2fc1`, `2a3ba803`, `df563359`; whole slice `13e691ae..df563359`).

Method: read `phase-03-minimal-hard-shell-and-protocol.md`, `P02.1.md`, the
FlowDefinition in full alongside `standalone-master-coordination-loop.yaml`
and `group-thinking-nominal-group-lite.yaml`, and the conformance suite in
full. Verified every load-bearing claim against `session-engine.mjs`,
`src/verbs/coordination/schema.mjs`, and `src/runner/definitions/schema.mjs`
directly, plus live probes against the real request validator. Formed the
findings below before reading `doer-report.md`, then compared.

## Verdict

The protocol is sound and the cell's central design correction is real. Eight
findings, none of them a runtime safety defect: **0 high, 3 medium, 3 low, 2
informational.** The mediums are one stale operator instruction in the shipped
YAML, one declared capability with no test at all, and two under-specified
test predicates.

## The seven checks

### 1. Minimum graph discipline — PASS

No advisory heuristic is encoded anywhere. There is no `empathy`,
`materiality`, `reframing-quality`, `alternative-credibility`, or
explanation-style field, no enum expressing one, and no transition that turns
on a judgment call. Every `contributions.allowedTypes` entry reuses the
existing closed MVP8 enum (`proposal` / `objection` / `response`) — no new
contribution type is introduced. Role doctrine and task prose are genuinely
left to Phase 04: the operations carry only an id, a role, a `policy.minTier`,
an opaque `contractTemplate` id, and a `result.kind`. The graph encodes
exactly legality and posture — who may act when, what must settle before a
window opens, what needs driver authorization, and what is bounded.

### 2. Portability — PASS

`policy.minTier` is the only literal lever in the file. There is no
`preferExecutor`, no `capabilities[]`, no `cohort`, and no provider or model
string anywhere — confirmed by reading all 527 lines, not by grep alone.
Concrete executor/tier/persona binding stays in the request's own `actors[]`,
which the heterogeneous-actor conformance case exercises for real.

### 3. No status-enum widening — PASS, structurally

`git diff --stat 13e691ae..df563359` touches zero files under `src/`. The
change is confined to `core/`, `test/`, and `docs/`, so no core session-status
enum could have been widened. No `needs-user-input` / `decided` /
`decision-deferred` value appears anywhere in the diff.

### 4. The `close-dialogue` design — claim VERIFIED independently

The Doer's claim is correct, and I confirmed the mechanism from source before
reading their report.

`actorGatingOperationIds` (session-engine.mjs:1342-1407, and the predicate at
:1468) gates an actor's quorum completion on a binding only when the binding
is `required`, **or** when it is `driver-authorized` **and** also declares
`contextAccess.visibilityWindowRef`. A `driver-authorized` binding with no
window is deliberately excluded as a "free-standing driver's-choice branch".

`revise-synthesis` and `revise-explanation` declare no window, so they gate
nothing. Without `close-dialogue`, `lead-advisor-actor`'s gating set would be
`{interpret-request, explain-recommendation}` — both settled the moment the
explanation lands. `classifySessionQuorum` (:3411-3542) evaluates every actor
in `manifest.actors`, and with lead-advisor complete, all actors would be
complete. `closeSessionByQuorum` then closes the session inside that same
call, and a closed session refuses `human-turn` and `authorize` outright. So
yes: an unwindowed revise-only reopen design really would auto-close before a
genuinely later human turn could arrive. The bug was real.

`close-dialogue`'s bounding is implemented correctly, and I could not find a
non-driver path to satisfy it. Satisfying it needs an operation-stamped,
settled Assignment (`resolveBindingOutcome`), which only
`dispatchDeclaredOperation` produces; that path requires a prior
`authorizeDeclaredOperation`, which runs `assertDriverIdentity` against the
session's own `provenanceRoot.writerId`. The non-stamping public doors
(`createSessionAssignment` / `dispatchPrimaryTask` / `proposeConsult`) are
actively blocked from supplying a stamp by `assertNoReservedOperationStamp`,
so none of them can satisfy the binding by accident.

The guarantee is also genuinely test-proven in the negative direction, which
is what I checked hardest for: conformance test lines 313-319 assert
`call5.closed === false` after the explanation settles, and independently
assert `replaySession(...).manifest.status === 'active'`. Remove
`close-dialogue`'s gating and that assertion fails. This is not a phantom.

### 5. The two disclosed gaps — BOTH VERIFIED; gap 1 is understated by the YAML

**Charset gap.** Confirmed, and broader than the YAML admits.
`SAFE_ID_RE = /^[A-Za-z0-9_-]+$/` (schema.mjs:29) admits no colon, and
`assertSafeRefOrId` applies it to `grantedContextRefs` (:337), disposition
`targetRef` (:363), and disposition `evidenceRefs` (:374). Live probe against
the real validator, declared-protocol request bound to this protocol:

```
ACCEPTED :: disposition, evidenceRefs=['a1']              (control)
REFUSED  :: disposition, evidenceRefs=['human-turn:t1']   -> charset
REFUSED  :: disposition, targetRef='human-turn:t1'        -> charset
REFUSED  :: disposition, evidenceRefs=['contribution:c1'] -> charset
REFUSED  :: authorize,  grantedContextRefs=['human-turn:t1'] -> charset
```

Both reserved namespaces, every ref field, every protocol — exactly as claimed
and then some. This surfaced finding **R1**: the YAML's own header still
prescribes the pre-discovery sequence, telling a driver to use a `disposition`
step citing `human-turn:<turnId>` as step (1). The conformance test (lines
328-339) and `doer-report.md` both state the corrected fact; only the YAML —
the artifact Phase 04 will read — is stale.

**Specialist step-type gap.** Confirmed exactly. The step dispatcher
(schema.mjs:569-575) admits precisely six types: `operation`, `fan-out`,
`authorize`, `disposition`, `contribution`, `human-turn`. No
`specialist-authorize` exists in `src/`. Neither claim is overstated.

### 6. Test quality — strong overall; one real hole, two weak predicates

The suite is well above phantom level. Nearly every refusal test pins a
specific error message, asserts that zero new events were written, and pairs
the refusal with a positive control proving the identical request shape
succeeds once the precondition is genuinely met (premature reveal, :405-434,
is the model case). Crash/replay and park/resume are proven for real by
reconstructing the whole seven-call chain from `replaySession` alone.

The **heterogeneous actor bindings** test meets the strict bar phase-03 sets,
and does not settle for the weaker proof. It asserts two genuinely different
registered executors and provider families for the two shapers, then — the
part that counts — reads the real RunResult file's
`policy.provenance.model.value` for `system-shaper` and `synthesizer`, both
bound to the **same** executor `exec-family-a`, and asserts
`model-a-analytical` vs `model-a-critical`. That is a real distinct model
resolved from a tier difference on one executor, not two executor names.

Two problems:

- **R2**, the one genuine phantom-shaped gap: `revise-explanation` has zero
  test coverage. `grep -rn "revise-explanation" test/` returns nothing. It is
  provably deletable with no test failure — being an ungated
  `driver-authorized` binding, it does not gate quorum, appears in no window,
  and is inert to every other derivation. Half of the "bounded dialogue
  reopen" capability, including its own `maxInvocations: 2` cap, is unproven.
- **R3**: two rejection predicates assert only `err instanceof
  CoordinationError` with no message check (:566, :857) — the only two in a
  file that otherwise pins every message. The specialist one is the weaker:
  its negative arm supplies neither the slot authorization nor the operation
  authorization, so it cannot isolate the guarantee its own name claims. It
  does currently refuse for the right reason (the unbound-slot check at
  session-engine.mjs:1040-1044 fires during actor resolution, ahead of the
  authorization gate), so this is lost test power rather than a live defect.

Two checklist items from phase-03's Tests First list map onto weaker proofs
than their names suggest: "stale refs" is not covered at all (**R4** — only
the foreign half is), and "wrong recheck revision" is proven as an
immutability property rather than a refusal (**R5**).

### 7. Test run — 756/756, no regressions

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' \
  'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' \
  'test/architecture.test.mjs'

ℹ tests 756
ℹ suites 0
ℹ pass 756
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 14566.287886
[exited with code 0]
```

Exit code captured from an un-piped run, not inferred from a pipeline tail.
Confirms the claimed count exactly (756, up from P02.1's 680 baseline).

Pre-existing conformance suites re-run individually, all green:

```
coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs : pass 3  fail 0
coordination-group-thinking-delphi-feedback-lite-pack-conformance.test.mjs : pass 8  fail 0
coordination-group-thinking-pack-registration.test.mjs               : pass 8  fail 0
coordination-architecture-advisory-panel-conformance.test.mjs        : pass 12 fail 0
```

Nominal-Group-Lite and the master-loop live-proof ran inside the full suite
above (`one live 'fgos coordination run' drives the whole Master Coordination
loop through the shipped fixture` ✔). Pack registration's exact-membership
assertions were correctly tightened to five members rather than loosened —
both `assert.deepEqual` on the full id set and both `members.length` checks
were updated, so a forgotten sixth entry would still fail.

## Findings

| id | severity | summary |
|----|----------|---------|
| R1 | medium | YAML header prescribes a `disposition`-step sequence the request door charset-refuses; also mis-attributes the `grantedContextRefs` avoidance to "unchecked" |
| R2 | medium | `revise-explanation` has zero test coverage and is provably deletable with no test failure |
| R3 | medium | Two rejection predicates assert error class only; the specialist one does not isolate its named guarantee |
| R4 | low | "stale refs" from the Tests First list is not covered — only the foreign half |
| R5 | low | "wrong recheck revision" is proven as immutability, not as a refusal |
| R6 | low | Phase-03 item 2's artifact envelope reduces to inert `contractTemplate` strings (P02.1 selected no registry) |
| R7 | info | `framing-shaping-open`'s `permits` names the shapers themselves; inert today, precedented, latent if `permits` is ever enforced |
| R8 | info | Missing `specialist-authorize` step type means "specialists" ships graph-declared but not operable through the documented door |

Full detail, evidence, and recommendations: `reviewer-findings.json`.

## Comparison with the Doer's report (read after forming the above)

`doer-report.md` discloses both gaps accurately and does not overstate either.
The close-dialogue correction is described honestly as found during test
construction rather than designed up front, and my independent reading of the
quorum logic confirms it. I found no claim in that report contradicted by the
code. R1 exists precisely because the report and the test were updated after
the discovery and the shipped YAML was not.

## Unresolved questions

1. Is lead-advisor reopen (`revise-explanation`) actually wanted in V1? If
   yes it needs a test (R2); if it was added for symmetry with
   `revise-synthesis`, dropping it is cleaner than shipping it unproven.
2. R1 and R8 both block the same door for every protocol, not just this one.
   Do they go onto a blocker list owned by `run.mjs` / the request schema, or
   are they carried forward inside this track's own index?
