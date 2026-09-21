# Independent recheck 3 — Units 0D, 1A, 1B

Date: 2026-09-21  
Reviewer: independent `code:review` (no source/test/config edits except this report)  
Scope: claimed discharge of Round 2 findings in `units-0d-1b-recheck-discharge.md`  
Prior independent: `units-0d-1b-independent-recheck.md` (round 2, REQUEST CHANGES)  
**Final verdict: REQUEST CHANGES**

Current source and executable tests are authority. The implementer discharge
report is not.

---

## 1. Current HEAD / dirty state / fingerprint

| Field | Value |
|---|---|
| Branch | `main` |
| HEAD | `a74a265ab0e06983e2beb565edbce4318e8537d7` |
| Staged | none |
| Tracked dirty | 29 paths (`git diff --stat`: 1288 insertions, 1160 deletions) |
| Untracked | plan tree, Units 0C–1B modules/tests, debug scripts, `.fgos` artifacts |
| Porcelain+diff+untracked sha256 | `c047dbdd0bde33f1fd4de8018d67f2221d9621888457f3087c5fbbad6fab6f6a` |
| Tracked binary diff sha256 | `bfd3d3d55a6b57b674b8add9889801be7629aa3756c78df87eea1ed9126a8ed1` |
| `.fgos/main-checkout.lock` | session token `51f1216a-94bd-4207-b36b-d5a339eb7945`; PID not live |

Repair fingerprints (stable through focused + full suite):

| File | sha256-16 |
|---|---|
| `src/runner/coordination/legality-facts.mjs` | `fd204a9424af5ba4` |
| `src/runner/coordination/actions-projector.mjs` | `22cc3afb83d1278a` |
| `src/runner/coordination/action-precondition.mjs` | `eb7ed9060bf5d991` |
| `src/verbs/coordination/actions.mjs` | `5e47b8bb62033a0b` |

Repair is distinguishable from unrelated dirt (debug `*.cjs`, dispatch plans,
instruction projection, `AGENTS.md`). No writer process observed. Not BLOCKED.

---

## 2. Files reviewed

Doctrine/plan: `AGENTS.md`, reading map, coordination README/spec, session
contract, track plan, Phase 00/02, readiness audit, unit reports, prior
independent recheck, `units-0d-1b-recheck-discharge.md`.

Source authority:

- `src/runner/coordination/legality-facts.mjs`
- `src/runner/coordination/actions-projector.mjs`
- `src/runner/coordination/action-precondition.mjs`
- `src/runner/coordination/session-engine.mjs` (thin disk adapters + `closeSessionByQuorumLocked`)
- `src/runner/coordination/store.mjs` (`*Locked` mutators, `withSessionLock`)
- `src/verbs/coordination/{actions,close,run,schema,show}.mjs`
- `test/runner/coordination-{legality-facts,actions-v1,stale-action-proof}.test.mjs`

---

## 3. Impact / blast radius and index freshness

Repository: **forgent** (`/home/vantt/projects/forgentX`)  
Worktree: same  
Local `gitnexus status`: indexed commit `a74a265`, claims up-to-date with HEAD  
Indexed: 2026-09-21 11:14  

**Working-tree impact is still partial.** Repair files are untracked or dirty
after that index. Do not treat empty or inflated caller sets as exact.

`detect_changes --scope compare --base-ref main --repo .`:

- 29 files, 79 symbols, 6 processes
- Risk: **HIGH**
- Affected flows named: `CloseCoordinationUseCase` (validate/close)

CLI `impact --direction upstream` returned **CRITICAL** with hundreds of
callers for almost every listed symbol, including unrelated `check` /
`discoverUseCase`. That scale is not credible as d=1 production reach; treat
as **unresolved/over-expanded**, not as a waiver. Text-confirmed production
reach:

- `executeCoordinationActionUseCase` → new write door
- `closeCoordinationUseCase` → keyed close seam
- `runCoordinationUseCase` → still **not** on the seam (`run.mjs` has no
  `actionKey` / `executeUnderActionPrecondition` references)
- `validateCoordinationRequest` → raw `run --file` only; the new action
  executor does not call it

HIGH/CRITICAL warning stands for coordination close and the new executor.
Index inflation is recorded; it does not authorize Phase 2.

---

## 4. Unit-by-unit verdict

| Unit | Implementer claim | Independent verdict |
|---|---|---|
| 0D Shared legality facts | passed | **passed** |
| 1A `coordination-actions.v1` | passed | **repairing** |
| 1B Stale-action atomicity | passed | **blocked** |

### 0D — passed

Kernel locals are thin adapters over `legality-facts.mjs` pures
(`pureResolveBindingOutcome`, `pureClassifySessionQuorum`, etc.).
`deriveVisibilityWindowState` still delegates. `evaluateVisibilityWindows`
no longer has a `Set<operationId>` algorithm. `classifySessionQuorum` is
shared. `matchAssignmentsToRequiredBindings` pass 2 requires
`assignmentServesOperation`. Close prerequisites now surface definition
drift / missing definition / no-actors.

Residual (non-blocking for 0D one-source, still relevant to close view):
`evaluateClosePrerequisites` always requires a consensus aggregation when
the protocol declares aggregation; `closeSessionByQuorumLocked` only consults
aggregation when `aggregationId` is passed. Production `close` use case
still injects the latest aggregation, so the public close door stays
aligned; a direct kernel call without `aggregationId` can still accept
while the action view blocks (F-R05).

### 1A — repairing

Human-turn requiredInputs now match `validateHumanTurnStep`. Contribution
types are intersected with the MVP8 enum. `fanOut:` field is gone.
Descriptors for dispatch/authorize include `expectedOutputs`. Close still
requires `authorizedBy`. Projector remains pure.

Fan-out is still wrong:

- Any required binding on a protocol with
  `cohort.independence === 'isolated-until-fan-in'` is treated as fan-out.
- Emission is **per required binding**, so a two-actor `op-fan` can emit
  two `fan-out` actions.
- `executeCoordinationActionUseCase` fan-out does not call
  `dispatchResearchFanOut` and does not stamp `protocol-operation:`.

Compose tests still hand-build request JSON around the descriptor; they
do not prove the kernel would accept the executor’s store-level write.

### 1B — blocked

Progress: `.action-keys.json` still gone; keyed close uses
`closeSessionByQuorumLocked` under the seam; missing `provenanceRoot.writerId`
is refused; non-close `authorizedBy` is refused at the seam; several families
call `executeCoordinationActionUseCase`; two OS processes can race.

Still not the charter seam:

- Mutation is `createSessionAssignmentLocked` /
  `authorizeOperationLocked` / `recordHumanTurnLocked` / etc., **not**
  `dispatchDeclaredOperation` / `dispatchResearchFanOut` /
  `runCoordinationUseCase`.
- `validateCoordinationRequest` is skipped.
- `dispatch-operation` creates an Assignment and does not execute it.
- Human-turn plants
  `revision: 'sha256:' + '0'*64` instead of hashing artifact bytes
  (`run.mjs` forbids caller revision).
- Close synthesizes `{ type: 'human', id: writerId }` when `authorizedBy`
  is omitted.
- Close identity still accepts `writerId` as a fallback channel.
- Unkeyed `closeCoordinationUseCase` still bypasses the seam.
- `run.mjs` is unchanged (mtime 09:44 2026-09-20).
- Two-OS-process test races **different** action kinds, not same-key
  two-writers on one production door.
- Several tests still pass arbitrary `mutationFn` into
  `executeUnderActionPrecondition`.
- No fan-out production-door test. No crash-after-commit-before-response
  on dispatch/authorize/contribution/human-turn.

Charter: do not approve if composers/precondition call store mutators
directly, if only close is on the real mutation path, or if two-writer
proof uses a stand-in.

---

## 5. Finding matrix

### F-R01

ID: F-R01  
Severity: **CRITICAL**  
Category: second mutation engine / not existing mutation path  
Affected unit: 1B  
Affected contract: Phase 2 composer → `validateCoordinationRequest` →
`runCoordinationUseCase` / `closeCoordinationUseCase`; “no direct store
mutator”  
Source evidence: `src/verbs/coordination/actions.mjs`
`executeCoordinationActionUseCase` switch calls
`createSessionAssignmentLocked`, `authorizeOperationLocked`,
`recordHumanTurnLocked`, `recordContributionLinkLocked`,
`recordDriverDispositionLocked`, `closeSessionByQuorumLocked`. Zero calls
to `dispatchDeclaredOperation`, `dispatchResearchFanOut`, or
`runCoordinationUseCase`. `run.mjs` has no seam import.  
Test evidence: “production mutator integration” tests assert
`status: 'dispatched'` after assignment create only; they never prove an
executor ran or that `validateCoordinationRequest` ran.  
Why current proof is insufficient: a green store write is not the current
kernel dispatch/legality path (role, specialist slot, visibility, mutation
posture, result linking). Phase 2 composers must not grow on this door.  
Required fix: under the held lock, compose the **existing** request shape,
validate it, and invoke lock-aware `run`/`close` kernel doors
(`dispatchDeclaredOperationLocked` / `dispatchResearchFanOut` /
`recordHumanTurn` as `run.mjs` does / `closeSessionByQuorumLocked`). Delete
the parallel assignment factory.  
Blocks Phase 2 implementation: **yes**

### F-R02

ID: F-R02  
Severity: **HIGH**  
Category: fan-out invention / unsafe backing  
Affected unit: 1A / 1B  
Affected contract: `coordination-actions.v1`; `dispatchResearchFanOut`  
Source evidence: projector `isFanOut =
definition.spec.profile.cohort.independence === 'isolated-until-fan-in'`
inside **every** unassigned required binding. Executor fan-out loops
`createSessionAssignmentLocked` with `taskKey: research-branch:${actorId}`
and empty constraints (no protocol stamp).  
Test evidence: actions-v1 plants cohort independence and asserts one
fan-out via `.find`; does not assert uniqueness; research-fan-out suite
exercises the **old** kernel door, not this executor.  
Why current proof is insufficient: cohort independence is not a per-op
fan-out declaration. Duplicate actions and unstamped assignments are not
kernel fan-out.  
Required fix: emit at most one fan-out, only for the operation
`dispatchResearchFanOut` actually runs, with the exact actor cohort that
door accepts; otherwise emit nothing. Executor must call that door.  
Blocks Phase 2 implementation: **yes**

### F-R03

ID: F-R03  
Severity: **HIGH**  
Category: human-turn provenance bypass  
Affected unit: 1B  
Affected contract: `validateHumanTurnStep` / `run.mjs` revision-from-bytes  
Source evidence: `executeCoordinationActionUseCase` `record-human-turn`
sets `revision: inputPayload.revision ?? 'sha256:' + 64 zeros`. Raw run
path forbids caller `revision` and hashes the file.  
Test evidence: production human-turn test never checks revision against
file bytes. Existing CLI tests still prove the real `run` door hashes
bytes.  
Why current proof is insufficient: semantic door records unverified
provenance the kernel’s request path refuses.  
Required fix: compute revision from real bytes exactly as `run.mjs`; never
accept or default a hash.  
Blocks Phase 2 implementation: **yes**

### F-R04

ID: F-R04  
Severity: **HIGH**  
Category: driver identity / bypass  
Affected unit: 1B  
Affected contract: single channel matching `provenanceRoot.writerId`  
Source evidence: close identity
`currentPayload.authorizedBy ?? precondition.authorizedBy ??
currentPayload.writerId ?? precondition.writerId`. Executor close:
`authorizedBy ?? { type: 'human', id: effectiveWriterId }`. Unkeyed close
path still in `close.mjs`.  
Test evidence: driver test covers seam missing/mismatch and non-close
`authorizedBy` rejection; does not cover synthesized close identity or
unkeyed close.  
Why current proof is insufficient: close can still ride `writerId`;
unkeyed production close omits the seam.  
Required fix: close accepts only `authorizedBy.id`; refuse missing;
remove unkeyed mutation for semantic/Phase-2 callers (compat raw close
must stay explicit but still driver-checked).  
Blocks Phase 2 implementation: **yes**

### F-R05

ID: F-R05  
Severity: **HIGH**  
Category: close view vs kernel aggregation  
Affected unit: 0D / 1A  
Affected contract: explicit close  
Source evidence: `evaluateClosePrerequisites` blocks whenever aggregation
is declared and missing/non-consensus. `closeSessionByQuorumLocked` only
narrows when `aggregationId` is provided.  
Test evidence: legality “parity” still feeds aggregations into
`evaluateClosePrerequisites`; does not call `closeSessionByQuorumLocked`
without `aggregationId`.  
Why current proof is insufficient: view-block / kernel-accept remains
possible on the kernel function. Public close use case currently injects
aggregation, so CLI may match; Phase 2 must not assume the functions are
identical.  
Required fix: make close-readiness a projection of the **same** predicate
`closeSessionByQuorumLocked` uses, including optional `aggregationId`.  
Blocks Phase 2 implementation: **yes**

### F-R06

ID: F-R06  
Severity: **MEDIUM**  
Category: concurrency / recovery proof quality  
Affected unit: 1B  
Affected contract: two-OS-process production doors; crash-before-response  
Source evidence/tests: two-process race uses human-turn vs
dispatch-operation (different keys). Same-key two-writer and schema
compat tests still use `mutationFn`. No fan-out executor test. No
crash-after-authoritative-mutation-before-response except close
idempotent retry.  
Why current proof is insufficient: charter requires same-key two-process
proof **through production use cases** for every write family.  
Required fix: same-key races + crash/retry on
`executeCoordinationActionUseCase` **after** F-R01 rewires it to kernel
doors.  
Blocks Phase 2 implementation: **yes** (until F-R01’s real doors are
proven)

### F-R07

ID: F-R07  
Severity: **LOW**  
Category: report/source drift  
Affected unit: 0D–1B  
Affected contract: implementer closeout  
Source evidence: `units-0d-1b-recheck-discharge.md` claims all R2 findings
discharged and Phase 2 unblocked. Source still exhibits F-R01–F-R06.  
Blocks Phase 2 implementation: **no** independently

### Closed vs prior independent findings

| Prior | Status now |
|---|---|
| Duplicate kernel legality functions | **closed** (thin adapters) |
| Visibility `Set` algorithm | **closed** |
| Actor-only assignment matching | **closed** (stamp required) |
| `.action-keys.json` | **still absent** |
| Human-turn requiredInputs vs schema | **closed** on the projector |
| `opDef.fanOut` field | **closed**; replaced by weaker cohort heuristic (F-R02) |
| Missing driver when `writerId` absent on seam | **improved**; close fallback remains (F-R04) |

---

## 6. Tests run and exact results

Focused + repair-specific:

```text
node --test \
  test/cli/coordination.test.mjs \
  test/verbs/coordination-chain.test.mjs \
  test/runner/coordination-baseline-measurement.test.mjs \
  test/runner/coordination-legality-facts.test.mjs \
  test/runner/coordination-actions-v1.test.mjs \
  test/runner/coordination-stale-action-proof.test.mjs \
  test/architecture.test.mjs \
  test/skills/fgos-mirror.test.mjs
```

**135 pass, 0 fail.** ~13.3s.

Full suite: `npm test` — **7155 pass, 0 fail, 9 skipped** (7164 tests, 27
suites). ~391s.

`git diff --check`: exit 0.

Nothing staged or committed.

Green tests do not close F-R01–F-R06. Several repair tests encode the
defective executor (assignment-create as “dispatch”, fake human-turn
revision unasserted, two-process different keys).

---

## 7. Evidence quality assessment

Real progress since round 2: one-source pures for visibility/quorum
classification; projector schema fields for human-turn/contribution;
keyed close on `closeSessionByQuorumLocked`; sidecar still gone; some
families go through `executeCoordinationActionUseCase`.

The discharge report overclaims. The new “production door” is a store
shortcut, not the existing run/close engine. That is the Phase 2 gate.

---

## 8. Phase 2 design ready

**yes** — unchanged. Design already forbids a second engine and direct
store mutators.

---

## 9. Phase 2 implementation ready

**no**

---

## 10. Exact remaining gate

1. Replace `executeCoordinationActionUseCase` store shortcuts with
   validated existing run/close kernel paths under one non-reentrant lock
   (F-R01, F-R03).
2. Fan-out only from real `dispatchResearchFanOut` facts; one action; no
   extra actors (F-R02).
3. Single close identity channel; no unkeyed semantic bypass (F-R04).
4. Close readiness ≡ `closeSessionByQuorumLocked` predicate (F-R05).
5. Same-key two-process + crash/retry proofs on those kernel doors
   (F-R06).
6. Refresh GitNexus after the edits; do not start Units 2A+.

Keep G7: raw `run --file`, public `close --file`, schema 1/2/3 replay,
explicit close only.

---

## 11. Recommended next action

Stay on Units 0D–1B / `2G0`. Do not implement semantic CLI composers on
`executeCoordinationActionUseCase` as it exists. Wire the seam to the
same doors `run.mjs` already uses, lock-held. Then independent recheck.

Do not clean the mixed dirty tree.

---

## 12. Final verdict

**REQUEST CHANGES**

0D one-source legality is largely real. 1A still mis-projects fan-out.
1B invented a parallel write engine. HIGH/CRITICAL findings remain.
Phase 2 design ready: **yes**. Phase 2 implementation ready: **no**.
