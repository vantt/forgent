# P10-KERNEL-FIX — Red-Team Review

Status: REQUEST CHANGES | Reviewer: adversarial Red-Team (independent) | Date: 2026-09-04

Target: the uncommitted kernel fix to `classifySessionQuorum`
(`src/runner/coordination/session-engine.mjs`) claimed DONE in
`P10-KERNEL-FIX.md`. Worktree:
`/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9`.

## Verdict

**REQUEST CHANGES — do not land as-is.**

Six of the eight attack vectors produced confirmed defects, four of them
genuine **new regressions** with clean pre-fix/post-fix deltas from executable
probes. The core rule (`required` OR `driver-authorized`+`visibilityWindowRef`
gates) is defensible; the *implementation* introduces a new hard dependency
from a hot read path onto the protocol registry, and the *evidence* in
`P10-KERNEL-FIX.md` is materially incomplete.

Findings: **4 HIGH, 3 MEDIUM, 1 LOW, 1 INFO.**

## Method

I built a pre-fix baseline (`git show HEAD:src/runner/coordination/session-engine.mjs`
extracted into an isolated tree, with the core protocols converted to JSON so
the tree resolves without `node_modules`) and ran identical probes against both
trees. Every claim below labelled POST-FIX / PRE-FIX is real recorded output,
not reasoning.

Probe sources (disposable, outside the repo):

```
/tmp/claude-1000/-home-vantt-projects-forgentX/c0828946-6a3e-4606-bc76-a0900fea1753/scratchpad/
  probe.mjs                  (probes 1-5)
  probe-liveness.mjs         (probes 6-7)
  probe-deadlock.mjs         (probe 8)
  probe-removed-protocol.mjs
  prefix/                    (pre-fix baseline tree)
```

---

## HIGH-1 — Quorum read+close now hard-fails when protocol resolution fails, and the thrown type is not caught by any caller

**Where:** `src/runner/coordination/session-engine.mjs:3202`;
`src/runner/definitions/protocol-loader.mjs:269`;
`src/verbs/coordination/run.mjs:522`; `src/verbs/coordination/show.mjs:176`.

`classifySessionQuorum` now calls `loadCoordinationProtocol` unconditionally
whenever `manifest.definitionRef` is set:

```js
const definition = manifest.definitionRef
  ? loadCoordinationProtocol(manifest.definitionRef.id, { cwd: opts.cwd, packageRoot: opts.packageRoot })
  : null;
```

That function performs a **full fail-closed discovery** of the
project/domain/core tiers and throws `FlowDefinitionError` on *not-found, parse
error, schema violation, duplicate id within a tier, path escape, or a
non-`CoordinationProtocol` document found anywhere in the scanned directories*.
Pre-fix, `classifySessionQuorum` read only `manifest` + `events` + `fgosDir` and
touched no protocol file at all.

`FlowDefinitionError` is **not** a `CoordinationError`, so:

- `run.mjs:522` (`quorumBeforeClose = evaluateSessionQuorum(...)`) sits
  **outside** the try block — the whole `runCoordinationUseCase` throws, *after*
  real Assignments have already been dispatched and events written.
- `run.mjs:524-533`'s catch is `err instanceof CoordinationError` only, so it
  re-throws.
- `show.mjs:176` has no guard at all — and the comment 10 lines below it states
  the design invariant this violates verbatim: *"the manifest/quorum/phase view
  above already worked before this cell and must keep working"*.

**Repro A — an unrelated, half-written file in `<cwd>/.fgos/coordination-protocols/`:**

```
POST-FIX: evaluateSessionQuorum THREW -> [FlowDefinitionError/validation]
          flow-definition: spec must be a non-null object (source: .../zz-work-in-progress.json)
          instanceof CoordinationError? false
PRE-FIX:  evaluateSessionQuorum still works: []
```

The session under evaluation does not use that file. One malformed protocol
bricks quorum evaluation for *every* session in the project.

**Repro B — protocol file removed/renamed/moved after the session was opened:**

```
POST-FIX: quorum after removal : THREW [FlowDefinitionError]
          flow-definition: no CoordinationProtocol definition found for id "test.coordination-protocol.rm"
PRE-FIX:  quorum after removal : [{"actorId":"w-actor"}]
```

`fgos coordination show` — the command a user reaches for when a session is
stuck — is now the command that fails.

A third variant exists on the same path: `protocol-loader.mjs`'s documented
`yaml`-module-unavailable fallback silently skips every `.yaml`/`.yml`
definition, which turns every core-protocol session's quorum evaluation into a
`not-found` throw in a `node_modules`-less environment.

**Recommended fix:** wrap the load in a try/catch and fall back to the
pre-existing path (`definition = null`) on any resolution failure; or convert to
a named `CoordinationError` and make `show.mjs` / `run.mjs:522` degrade rather
than throw.

---

## HIGH-2 — Version drift silently flips a completed actor to `missing`; the session becomes permanently unclosable

**Where:** `session-engine.mjs:159` (`protocolOperationStamp`), `:1454`
(`assignmentServesOperation`), `:3202` (the load).

`protocolOperationStamp` embeds the version:

```js
return `${PROTOCOL_OPERATION_STAMP_PREFIX}${definition.metadata.id}@${definition.metadata.version}#${operationId}`;
```

`resolveBindingOutcome` → `assignmentServesOperation` matches on that exact
string. `classifySessionQuorum:3202` loads by **id only**, ignoring
`manifest.definitionRef.version`. After an in-place version bump, *every*
already-settled, correctly-stamped Assignment stops matching.

This is materially worse than the report's §5 framing ("unverified either way,
named for a future cell"). It is not a wrong-graph-shape risk — it is total
mis-resolution:

```
POST-FIX
  BEFORE drift  completed= [ 'worker-actor' ] missing= []
  AFTER  drift  completed= []                 missing= [ 'worker-actor' ]
  closeSessionByQuorum: REFUSED -> [CoordinationError/validation] closeSessionByQuorum: session
    "coord_redteam_drift" is missing required actor(s) [worker-actor] and declares no
    partialPolicy -- default completion requires every required SessionActor (R1)

PRE-FIX (same probe)
  AFTER  drift  completed= [ 'worker-actor' ] missing= []
  closeSessionByQuorum: SUCCEEDED
```

The refusal message names the wrong cause. Every sibling door
(`authorizeDeclaredOperation`, `dispatchDeclaredOperation`,
`validateSessionAggregation`, and `run.mjs:237`'s `aggregationCloseParams`)
raises an explicit *"refusing to close against a drifted definition"*. This one
silently lies.

Partial mitigation the report does not claim: on the `run` verb path only,
`aggregationCloseParams` (`run.mjs:236-242`) happens to catch drift first. But
`evaluateSessionQuorum` at `run.mjs:522` already ran and produced the wrong
answer, and `show.mjs:176` plus any direct engine caller has no guard whatsoever.

**Recommended fix:** pass/compare `manifest.definitionRef.version`, matching
every sibling door in the same file.

---

## HIGH-3 — The report's central "byte-for-byte unchanged" claim is false

**Where:** `P10-KERNEL-FIX.md` §1.3; the shipped code comment at
`session-engine.mjs:1350-1359`.

Both assert single-op-per-actor fixtures stay *"byte-identical to pre-fix
behavior"* because *"a single-op actor's one binding is always either the whole
gating set or the whole fallback, never both."*

The premise is true; the conclusion does not follow. Gating-set semantics are
not fallback semantics. The fallback accepts **any** `assignment-created` event
for the actor. The gating path demands an **operation-stamped, settled**
Assignment. An actor with exactly one `required` binding lands in the gating
set, so its behavior *does* change:

```
PROBE 4 — single-REQUIRED-op actor, Assignment created via store.mjs's createSessionAssignment
POST-FIX: completed= []                    missing= [ 'requester-actor' ]  -> close REFUSED
PRE-FIX:  completed= [ 'requester-actor' ] missing= []                     -> CLOSED to "completed"
```

`createSessionAssignment` is a public `store.mjs` export used directly by this
repo's own quorum test suite. `dispatchPrimaryTask` and `proposeConsult` are
likewise non-stamping — `assertNoReservedOperationStamp`
(`session-engine.mjs:162`) actively *forbids* a caller-supplied stamp — so any
Assignment from those doors can never satisfy a gating binding. Any
declared-protocol session whose work arrives through a non-declared door is now
permanently unclosable.

I did not find a `runCoordinationUseCase` path that reaches this today (the
`agent-led` branch uses `openStandaloneSession`, which has no `definitionRef`),
so this is currently latent rather than live. But the claim is wrong and should
not stand as a reviewed-and-accepted assertion in either the report or the
shipped comment.

---

## HIGH-4 — Fixture cross-check missed 5 of 8 affected protocols, and the green suite is structurally blind to them

**Where:** `P10-KERNEL-FIX.md` §1.3, §4, §5.

§4 claims the investigation covered *"every real `core/coordination-protocols/*.yaml`
fixture."* I recomputed the gating set for every actor in every shipped
protocol. The rule changes behavior in **eight** protocols; the report names
three.

Never mentioned, and newly gating:

| Protocol | Actor | Newly-gating binding |
|---|---|---|
| `independent-research-fan-out-fan-in-gated.yaml` | `coordinator-actor` | `synthesize-findings` — **driver-authorized + `post-independent-pass` window** |
| `deliberation-nominal-group-chain.yaml` | `facilitator-actor` | `clarify` — **driver-authorized + `reveal` window** (its *only* binding) |
| `deliberation-delphi-chain.yaml` | `panelist-a`, `panelist-b` | `propose-round1` + `propose-round2` |
| `deliberation-nominal-group-chain.yaml` | `participant-a`, `participant-b` | `private-propose` + `private-rank` |
| `deliberation-rfc-chain.yaml` | `proposer-actor` | `propose` + `respond` |

The first two directly contradict §1.3's evidence base, which asserts the only
`driver-authorized` + `visibilityWindowRef` bindings in the repo are
RFC-Review-Lite's `respond` and Nominal-Group-Lite's `share`/`clarify`. There
are two more.

`independent-research-fan-out-fan-in-gated.yaml` is the sharpest case. Its own
file header states it exists as a *separate opt-in file* precisely so
`synthesize-findings` could become `driver-authorized` — the archetype of a
driver's-choice fan-in. Under the new rule it gates, so a driver who reviews
the branch results and declines to synthesize can no longer close the session
at all.

`deliberation-nominal-group-chain.yaml`'s `facilitator-actor` is a
single-binding actor whose sole binding is a gating `driver-authorized` one —
i.e. exactly the shape HIGH-3 shows is *not* byte-identical to the fallback.

Worse, the "zero regression / 755 green" evidence cannot detect any of this:

```
$ grep -c "closeSessionByQuorum\|evaluateSessionQuorum" \
    test/runner/coordination-visibility-window-fixture.test.mjs \
    test/runner/coordination-deliberation-method-chains.test.mjs
0
0
```

Neither fixture's test suite ever calls a quorum entry point. Those tests pass
identically whether the fix is correct or catastrophic for those five
protocols. The green suite is not evidence here.

---

## MEDIUM-5 — The aggregation exclusion is keyed on operation-id alone, and is unconditional on an aggregation actually existing

**Where:** `session-engine.mjs:1384`.

```js
if (ref.ref === aggregationOutputOperationRef) continue;
```

No actor check. Any actor bound to `outputOperationRef` — for any reason,
aggregation-related or not — has that binding silently dropped from its gating
set. And the exclusion applies whether or not the session ever produced an
`aggregation-validated` event; the substitute gate
(`closeSessionByQuorum`'s `aggregationId`) is an **optional** parameter.

**Repro (probe 3):** protocol declares
`completion.aggregation.outputOperationRef: 'synthesize'`; `coordinator-actor`
*and* `analyst-actor` are both bound to `synthesize` as `required`.

```
completed= [ 'coordinator-actor', 'analyst-actor' ] missing= [] late= []
closeSessionByQuorum: CLOSED to "completed" with synthesize never performed by ANY actor
  and NO aggregation validated
```

Not a regression (pre-fix behaves the same), but the fix *codifies* the bypass
as an intentional kernel rule, while §1.4 justifies it with reasoning — "its
completion is represented by the validated `aggregation-validated` event" —
that only holds when the caller opts in. Key it on `actor + operation` at
minimum, and ideally require a validated aggregation to exist.

---

## MEDIUM-6 — Same operation id at two graph nodes is deduped: the original bug survives for the "repeated operation across rounds" shape

**Where:** `session-engine.mjs:1387`.

```js
if (gates && !operationIds.includes(ref.ref)) operationIds.push(ref.ref);
```

One settled Assignment satisfies every node that binds that op id to that
actor.

```
PROBE 5 — `rank` bound to worker-actor at BOTH round-1 and round-2
after ROUND-1 only: completed= [ 'worker-actor' ] missing= []
closeSessionByQuorum: CLOSED to "completed" -- round-2 "rank" never performed
```

Identical pre-fix and post-fix — this is precisely the premature-close bug the
cell exists to eliminate, still live for this shape. No shipped protocol uses
it today (Delphi correctly uses distinct `propose-round1`/`propose-round2`
ids), but it is a natural authoring shape, and the explicit dedupe makes it
*silently* wrong rather than merely unsupported. Belongs in Gaps at minimum;
the report does not mention it.

---

## MEDIUM-7 — Uncached full-registry discovery added to a per-request hot path

Measured in this repo (11 core protocols, YAML parse + full schema validation,
no caching anywhere in `protocol-loader.mjs`):

```
20x loadCoordinationProtocol -> 12.29 ms per call
```

A single `runCoordinationUseCase` now performs **three** additional discoveries
(`run.mjs:522` `quorumBeforeClose`, `:526` `closeSessionByQuorum`, `:535`
`finalQuorum`) ≈ **+37 ms per request**, one of them *inside* `withSessionLock`,
extending lock hold time. On top of that, `resolveBindingOutcome` re-reads
`assignment.json` from disk once per (gating operation × candidate assignment),
where the fallback path did zero such reads.

Not correctness-critical; worth memoizing the load per call.

---

## LOW-8 — Liveness: a gated driver-authorized binding behind an unopenable window is a hard deadlock

This was attack vector 1 (does the fix turn "wrongly closes early" into
"wrongly never closes"?). Established in two verified halves:

1. The Doer's own new test in
   `test/runner/coordination-recovery-and-quorum.test.mjs` asserts a gated
   `driver-authorized` binding keeps its actor `missing` until it settles.
2. The window gate hard-refuses to let the driver unblock it:

```
authorizeDeclaredOperation: REFUSED -> authorizeDeclaredOperation: operation "late-op" at node
  "n2" for actor "worker-actor" requires visibility window "never-opens" to be open before any
  context may be granted, and it is not open yet -- refusing to authorize
close: REFUSED -> ... is missing required actor(s) [worker-actor] and declares no partialPolicy
```

So a structurally-unopenable window — the exact shape
`group-thinking-rfc-review-lite.yaml`'s own header documents as impossible,
citing P08.3 — converts "wrongly closes early" into "can never close",
escapable only via `cancelSession` or a declared `partialPolicy`. No shipped
protocol has an unopenable window, so this is a protocol-authoring footgun
rather than a live bug; it deserves a Gaps line, not a blocker.

**Confidence caveat, stated honestly:** my two attempts to isolate this as a
single pre/post delta probe were inconclusive — the fake executor yields
`no-evidence` → `failed` for any protocol declaring `visibilityWindows`, in
*both* pre- and post-fix runs, so the delta was masked. The two halves above
are each independently verified; the conjunction is inference, not a single
recorded run.

---

## INFO-9 — Scope discipline on `test/verbs/coordination-aggregation-surface.test.mjs`

This was attack vector 8 (was expanding scope beyond current-cell.md's
May-Touch list the right call?).

The change itself is minimal and correct in shape: a new
`dispatchRequestNoAggregation` builder used by the two `withAggregation: false`
tests; no assertion weakened, no test deleted, `dispatchRequest` untouched.
Touching the file was genuinely unavoidable — **given the chosen fix shape**.

But a narrower alternative was available: drop the aggregation exclusion
entirely (MEDIUM-5's source) and have the `withAggregation: true` tests dispatch
`synthesize` too, exactly as the Doer already did for the `false` variant. That
is *less* kernel surface, the same out-of-scope file touched, and no
cross-actor bypass. The Doer added a third kernel special-case to minimize test
churn. Given that the special-case carries a real bypass, that was the wrong
trade — though a defensible one to have made, and it was named plainly in §1.4
rather than hidden.

Assessment: the scope expansion itself was the right call; the fix shape that
forced it was not the minimal one.

---

## What the report gets right

- The naive "count every `required` binding, ignore every `driver-authorized`
  one" fix genuinely is insufficient — verified: RFC-Review-Lite's `respond`
  and Nominal-Group-Lite's `share`/`clarify` are all `driver-authorized`.
- The opposite naive fix ("wait for every declared binding") genuinely would
  regress `standalone-master-coordination-loop.yaml` — verified:
  `reviewer`/`red-team`'s recheck bindings are ungated driver-authorized and
  correctly stay non-gating under the new rule.
- §5's named residual (an actor with 2+ ungated driver-authorized bindings and
  zero required bindings) **is** genuinely inert today — I recomputed every
  actor in every shipped protocol and none has that shape. Note, though, that
  HIGH-3 shows the fallback's real looseness is a strict superset of that
  residual, so the residual as written understates the fallback's exposure.
- The `git status` file list in §3 matches the actual diff;
  `current-cell.md`/`index.md` were not touched by the Doer.

---

## Recommended actions, in order

1. **HIGH-1** — guard the `loadCoordinationProtocol` call; fall back to
   `definition = null` on any resolution failure. Restores `show.mjs`'s stated
   invariant and removes the uncaught-throw path at `run.mjs:522`.
2. **HIGH-2** — compare `manifest.definitionRef.version`, matching every sibling
   door in the file.
3. **HIGH-4** — extend the fixture cross-check to all 8 affected protocols;
   explicitly decide whether `independent-research-fan-out-fan-in-gated.yaml`'s
   `synthesize-findings` and `deliberation-nominal-group-chain.yaml`'s `clarify`
   are meant to gate, and add at least one quorum-level test for each (they have
   none today).
4. **HIGH-3** — correct the "byte-identical" claim in both `P10-KERNEL-FIX.md`
   §1.3 and the code comment at `session-engine.mjs:1350-1359`.
5. **MEDIUM-5** — key the aggregation exclusion on `actor + operation`, or remove
   it per INFO-9.
6. **MEDIUM-6 / LOW-8 / MEDIUM-7** — add to Gaps; memoize the protocol load.

---

## Files referenced (absolute)

- `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9/src/runner/coordination/session-engine.mjs`
  — `:159` stamp, `:162` `assertNoReservedOperationStamp`, `:1361`
  `actorGatingOperationIds`, `:1378` aggregation ref read, `:1384` exclusion,
  `:1386` gating rule, `:1387` dedupe, `:1454` `assignmentServesOperation`,
  `:1493` `resolveBindingOutcome`, `:3199-3258` `classifySessionQuorum`,
  `:3385` close call site
- `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9/src/runner/definitions/protocol-loader.mjs:269`
  — `loadCoordinationProtocol` (fail-closed full discovery)
- `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9/src/verbs/coordination/run.mjs`
  — `:236-242`, `:522`, `:524-533`, `:535`
- `/home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9/src/verbs/coordination/show.mjs:176`
- Probe sources (mine, disposable):
  `/tmp/claude-1000/-home-vantt-projects-forgentX/c0828946-6a3e-4606-bc76-a0900fea1753/scratchpad/`
  — `probe.mjs`, `probe-liveness.mjs`, `probe-deadlock.mjs`,
  `probe-removed-protocol.mjs`, and the pre-fix baseline tree `prefix/`

---

## Unresolved questions for the Coordinator

1. Is `independent-research-fan-out-fan-in-gated.yaml`'s `synthesize-findings`
   intended to be genuinely optional (driver's choice) or mandatory? If
   optional, the `driver-authorized + visibilityWindowRef = gates` signal is a
   coincidence that holds for two fixtures and breaks a third, and the rule
   needs a different discriminator.
2. Same question for `deliberation-nominal-group-chain.yaml`'s `clarify`.
3. Should a declared-protocol session tolerate a missing/unresolvable protocol
   definition at close time (degrade), or is hard failure the intended posture?
   HIGH-1's fix shape depends on the answer.

---

Status: DONE
Summary: REQUEST CHANGES — the quorum rule itself is sound, but wiring
`loadCoordinationProtocol` into `classifySessionQuorum` introduced two confirmed
new regressions (uncaught `FlowDefinitionError` breaking `show`/`run`, and
silent version-drift deadlock), the report's central "byte-identical fallback"
claim is empirically false, and the fixture cross-check missed 5 of 8 affected
protocols — all 5 having zero quorum test coverage, so the "755 green" evidence
cannot detect a break in them.
Concerns/Blockers: HIGH-1 and HIGH-2 are small, well-scoped fixes. HIGH-4 is the
expensive one — it may reveal that `independent-research-fan-out-fan-in-gated.yaml`'s
driver-authorized fan-in was intentionally optional, which would mean the
`driver-authorized + visibilityWindowRef = gates` signal is a coincidence that
holds for 2 fixtures and breaks a 3rd, and the rule needs a different
discriminator.
