---
title: "Workflow case ledger and admission (D-ADR0070 cutover, lane AGENT-WF)"
description: "Implement docs/specs/workflow.md: guide schema, hardened case ledger, Playbook proposer on admission (Shape C), AdmissionPort at every runUnit writer, N1 authority context at both doors"
status: in-progress
priority: P1
effort: 76h
branch: main
tags: [workflow, admission, ledger, execution-core, agent-wf]
created: 2026-10-19
---

# Workflow case ledger and admission

## Source of truth

- Spec: [docs/specs/workflow.md](../../docs/specs/workflow.md) (Settled, D-ADR0070). Rule ids `RUL-WF-n`, battery §11.1 (scenarios 1–26), proof obligations §11.2, keep/change/retire §12, rework size §9.
- Owner feature choice (§15): F1–F7, F9, F11, F12 in this plan. F13 (physical rename) after core lands, separate L10 step. F8, F14, F15, F16 deferred; F10 not in this cutover.
- Record: [docs/specs/runner.md](../../docs/specs/runner.md) D-ADR0070; [component-boundary.md](../../docs/platform/component-boundary.md) rows Workflow / Execution Core / Work Lifecycle / Holder-lock (already updated with the spec).
- Reviews: [review-261019-0930](../reports/review-261019-0930-agent-workflow-model-ba-spec.md), [review-261019-1220](../reports/review-261019-1220-agent-workflow-model-ba-spec-revision.md) (B1′–B3′, S1′–S4′ all folded into the spec).
- AGENTS.md: RUL104, L10 (move every caller, delete old path same change), Design Principles 1/2/7, install/setup/doctor gate, prior art.

## Phases

| # | Phase | Touches the `fgos run` door? | Effort | Status |
|---|---|---|---|---|
| 00 | [Facts and prior art](phase-00-facts-and-prior-art.md) (read-only) | no | 3h | done (main `78b0921d2`) |
| 01 | [Playbook order regression guard](phase-01-playbook-order-regression-guard.md) | no | 3h | done (main `78b0921d2`) |
| 02 | [Harden the JSONL ledger in place](phase-02-harden-jsonl-ledger.md) (F11) | no | 4h | done (main `78b0921d2`) |
| 03 | [Retire `--plan` and dead `feature.yaml` runner fields](phase-03-retire-plan-source-and-dead-runner-fields.md) (F9) | no | 5h | pending |
| 04 | [Guide schema](phase-04-guide-schema.md) (F5, part of F1) | no | 8h | pending |
| 05 | [Case model: events, projection, bindings, admission predicate](phase-05-case-model-bindings-admission-predicate.md) (F1, F2 counters, F4, F7 predicate) | no | 12h | pending |
| 06 | [Playbook proposer on admission, Shape C, case verbs](phase-06-playbook-proposer-shape-c-case-verbs.md) (F6, F12) | no (Workflow door only) | 12h | pending |
| 07 | [AdmissionPort at every `runUnit` writer](phase-07-admission-port-every-rununit-writer.md) (F2 ceiling, F3 port, B3′) | yes | 12h | pending |
| 08 | [N1 authority context at both doors, conductor case](phase-08-n1-authority-context-conductor-case.md) (F3, F7) | yes | 12h | pending |
| 09 | [Doctrine, docs, closeout](phase-09-doctrine-docs-closeout.md) (`coordination-driver.md` rewrite) | no | 5h | pending |

Order follows the lead's constraint: 00–06 never touch the `fgos run` door (`bin/fgos.mjs` run verb, `src/runner/execution/run.mjs`); 07–08 add the port and N1 at the doors and every `runUnit` caller with writes; 09 moves doctrine. Coding cutover (Work step FSM → ledger, Units of Work naming case/activity, frame at `validateApprove`) is **out of scope** (spec R2, N12): after this plan the Work paths carry the real port and get `unbound`, nothing more.

## Dependencies

```text
00 -> 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09
```

Strictly sequential: consecutive phases share files (`src/workflow/runner.mjs`, `store.mjs`, `feature.yaml`, `run.mjs`), and the plan forbids two parallel phases on one file. Each phase lands on main on its own, green.

External: COOK P5 (`fgos-cook`) waits for 08 + 09 (conductor case + doctrine). Git 03/G4 will later move `settleUnitWorktrees` git calls (`src/workflow/runner.mjs:329`); this plan only splits the file, it does not change those calls.

## Acceptance (spec battery §11.1 mapped to phases)

| Scenario | Phase(s) proving it |
|---|---|
| 1 two writers collide at reservation | 05 (predicate), 08 (door) |
| 2 worker self-claims approval | 05 |
| 3 test passed on old tree; integration is a new subject | 05 |
| 4 approved artifact changed | 05 (predicate), 06 (proposer), 07 (write gate recheck) |
| 5 fallback exhausts allowance; unknown remainder refuses | 05 (counters), 07 (ceiling), 08 (nested wave) |
| 6 unlisted route violating MUST | 05 |
| 7 gate parks one branch of a conductor case | 08 |
| 8 findings without delivery | 06 |
| 9 restart without chat (both case kinds) | 06 (playbook), 08 (conductor) |
| 10 guide changes mid-run | 06 |
| 11 context stripping | 08 |
| 12 no playbook regression | 01 (guard, every phase), 06, 07 (4 × fallback ceiling) |
| 13 seat launch exhausted | 07 |
| 14 one proposer | 06 |
| 15 `feature.yaml` two parts | 03, 04 |
| 16 two cases bind one worktree (two spellings) | 05 |
| 17 crash between binding steps | 05 |
| 18 nested case cannot open → parent frame refunded | 08 |
| 19 nested write from confined worker | 08 |
| 20 conflicting signals / closed case | 08 |
| 21 corrupt ledger mid-file | 02 |
| 22 proposer killed while worker lives | 06 |
| 23 naming a live playbook case from inside its Unit | 08 |
| 24 Work path with port → `unbound`; without port → refused | 07 |
| 25 proposer calls `runUnit` while holding `advance` | 06 (in-process), 07 (through port) |
| 26 binding is one file; never-bound worktree is `unbound` without a ledger scan | 05 |

Proof obligations §11.2: A4 (`test/architecture.test.mjs:846`) green every phase; writes without port refused and standalone only on affirmative `unbound` (07); port observed at the write gate incl. nested dispatch (07, 08); every `runUnit` writer injects the real port (07); case env never reaches a worker the door did not admit (08); playbook order unchanged on every stored run (01 guard, every phase); fsync before `advance` release (02).

## Verification protocol (every phase)

Implemented by a Sonnet lead in its own worktree; the big lead verifies: every test file that imports a touched module (`rg -l '<module basename>' test/`), then full `npm test` with `CLAUDE_CODE_SESSION_ID` unset; `npm run build:skills` / `npm run build:domains` when their sources change, and the regenerated output diffed before staging. Phase 01's guard and the discussion-playbook suites (`test/workflow/*.test.mjs`) must pass unchanged in every phase. Impact analysis per `fgos tool query --capability impact-analysis --status present` posture (GitNexus `impact` on each symbol edited; `bin/fgos.mjs` is known zero-symbol, cross-check with `rg`).

## Shared-file collisions (program board)

| File | Phase | Other lanes |
|---|---|---|
| `bin/fgos.mjs` | 03, 06, 07, 08 | 4.3-R, 6.2, COOK |
| `docs/specs/runner.md`, `CHANGELOG.md`, `src/setup/registrations.mjs` | 05, 09 | 4.4a, 4.3-R, 6.5, MP-A, 6.2 |
| `src/runner/execution/run.mjs` | 07 | GIT (custody landed; later G-phases) |
| `src/runner/dispatch/adapters.mjs`, `assignment-runner.mjs` | 08 | MP-B2, 6.x |
| `core/skills/_shared/coordination-driver.md` | 09 | COOK (owner deferred its rewrite to this spec) |
| `domains/coding/workflows/feature.yaml`, `domains/coding/compiled.json` | 03, 04 | none running |

Landing after another lane rebases/merges main and resolves; no edit to another lane's file outside this plan's scope.

## Decisions taken by this plan (spec leaves them open)

- Code names avoid the existing Run Supervisor "admission" (attempt admission ledger, `run.mjs:230-253`): `caseAdmission` option, `src/workflow/case-admission.mjs`, port contract `src/runner/execution/case-admission-port.mjs`.
- Binding records live under `.fgos/workflow-runs/.bindings/` so blind seats see them masked with the runs (`BLIND_HIDDEN_ROOTS`, `src/runner/dispatch/confinement/resources.mjs:26`) with no confinement change; a host-written sentinel distinguishes a masked view from "no binding" (phase 05).
- Playbook YAML keeps its `steps` form; the loader normalises steps into the one guide model (step → activity, `dependsOn` → entry milestones). One internal model, no YAML rewrite of the 7 playbooks (spec §9 "không đổi ngữ nghĩa; thêm phần đầu").
- `fgos workflow operations --step` stays: it is the Work-step vocabulary read (`docs/specs/work-state.md:262`, doctor `work-step-vocabulary`), retired with the coding cutover (L10 at that cutover). Phase 09 stops the doctrine from using it on a run (spec §8 row: case runs read `status`).
- Settle that finds `advance` held leaves a settle-pending runtime file drained by the next `advance` holder before anything else (same shape as the gate-answer file), so a try-once settle never loses a receipt.

## Follow-ups (not in this plan)

- Coding cutover (R2): Work Units name case/activity, frame at `validateApprove`, delete Work step FSM + `feature.yaml` lifecycle part + `workflow operations` in one change.
- F13 physical rename (`fgos-runner`, `src/runner/**`) as its own L10 step.
- COOK P5 `fgos-cook` on the conductor case (unblocked by 08 + 09).
