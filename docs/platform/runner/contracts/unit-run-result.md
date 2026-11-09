# Unit Run Result Contract — Execution to Workflow

```txt
Document type: Contract
Audience: Maintainer, implementer, agent that has only `fgos run --json`
Purpose: Fix what the Execution layer hands up when a Unit run ends, so the Workflow layer and any caller read facts instead of re-deriving them
Design status: Proposed. The owner has not approved it; nothing below is implemented yet
Implementation: None. The "Today" column of each table says what exists now
Provenance: Owner direction 2026-11-09 (three layers; lower layer must stand alone; one authority per decision, in the lowest layer that can know it), a four-seat advisory run through `fgos run` only, HARDEN review of every "Today" cell against origin/main, HARDEN's cross-layer authority audit (plans/reports/audit-261109-1736-harden-authority-layers.md) and the retired-engine entity map (plans/reports/researcher-report-261109-1647-retired-engine-entity-map.md)
Writer type: Agent draft writer (COOK), reviewed by HARDEN
Canonical for: The result shape of one Unit run at the Execution to Workflow boundary, once approved
Use this when: Writing or reading a caller of `fgos run --json`, or moving a derivation out of `src/workflow` into Execution
Do not use this for: Proof that any field exists today; the Assignment to Run contract (see Related)
Last reviewed: 2026-11-09
Related:
- docs/platform/runner/spec.md (Execution Core and Dispatch section)
- docs/platform/agent-coordination/contracts/assignment-run-runresult.md (the Assignment, Run and RunResult contract this one builds on)
- src/runner/dispatch/run-result.mjs (RunResult version 3 writer and readers)
- src/runner/execution/unit.mjs (Unit input contract)
- src/runner/execution/unit-summary.mjs (the persisted Unit-level record, version 2)
Supersedes: None
Superseded by: None
```

## 1. Layers and who decides what

Three layers, named after their directories: **Execution** (`fgos run` and below: seat binding, Unit runs, Dispatch, RunResult), **Workflow** (`src/workflow`: steps, cases, resume, gate, the case budget frame) and **Domain** (workflow definitions, slice kinds, evidence rules under `domains/` and `core/workflows`). Names are not changed by this contract.

- The upper layer governs: what to run, how much it may spend, what counts as done, when to ask a person.
- The lower layer executes and reports facts truthfully: whether a run started, who ran it, whether it ended on infrastructure rather than reaching a verdict, what it spent.
- A lower layer enforces a limit it is given and never chooses it. With no upper layer the limit is `null`, meaning none, and the lower layer still runs. That is the standalone property: an agent holding only `fgos run --json` can drive several seats and read every fact it needs from this contract.

### Who owns the verdict

| Decision | Owner | Reads it from |
|---|---|---|
| Whether a seat reached a verdict; the Unit's final outcome; the verify result; the rule "writing outside the declared writes is not a pass"; whether a failure was infrastructure | **Execution**, through one outcome module | — |
| Whether a step passed, a milestone was achieved, a gate is parked | **Workflow**, as an acceptance decision on the facts above | `outcome`, `infrastructure`, `outOfScope[]`, `evaluations[]` of this contract |
| The rules that decision applies (`acceptOutcomes`, `produces`, closure, delivery milestones) | **Domain**, declared as data | — |

Workflow never tests which outcomes count as a verdict, never rewrites an outcome Execution settled, and never reads a Unit's private `unit.json`.

## 2. The shapes

1. **Attempt shape.** One supervised attempt of one seat: the existing `RunResult`, which **stays at version 3** with optional new fields (section 4). Version gating rides on `results[].runResult.contract`.
2. **Unit shape.** What one Unit run ends with. Two forms exist and stay two: the `data` object of `fgos run --json` (the return value of `runUnit`: `unitRunId`, `outcome`, `rounds`, `results`, `findings`, never persisted whole) and the persisted record `unit-summary`, which already carries `contract: { id, version }`. `data` gains the Unit-level facts of section 3 as additive fields and carries no contract id of its own. A stored form of those facts bumps `unit-summary` to version 3, with its Rust reader first.
3. **Port shape.** What the case admission port hands Workflow when a reservation settles. Today it is an untyped object of raw seat results that Workflow filters for `pass` and `findings`. It carries the Unit shape of section 3, including `evaluations[]`, so the port is covered by this contract and not only `fgos run --json`.

Every versioned block uses one shape, `contract: { id, version }`, and `binding` moves from `contractVersion: "v1alpha1"` to it in the same change as its readers. Today the blocks use three (`{id, version}` on RunResult and unit-summary, `contractVersion: "v1alpha1"` inside `binding`, none on the Unit input or the case ledger).

## 3. Unit shape fields

| Field | Meaning | Set by | Today |
|---|---|---|---|
| `unitRunId` | Run identity of the Unit | Execution | present |
| `outcome` | One value of the closed outcome table (section 5), **final**: the scope rule, the verify round and the refund are already applied | Execution | present but not final. Workflow rewrites it after Execution has settled: an out-of-scope `pass` becomes `findings` and a check that cannot run becomes `execution-failure` (`foldUnitOutcome`, `src/workflow/unit-handoff.mjs`), so the case ledger says `pass` and the workflow ledger says `findings` for one run. `fgos run --case` never applies the scope rule |
| `outOfScope[]`, `outOfScopeOnBranch[]` | Paths the Unit wrote outside its declared writes, and paths its branch carries outside them since its base | Execution | partial: Execution reports `commit.outOfScope` (`run.mjs`); the branch-level check is Workflow's (`outOfScopeWrites`) and reads Execution's private `unit.json`. Execution takes the base Unit's `outOfScopeOnBranch` as an input instead |
| `evaluations[]` | One entry per evaluator result: `{ kind: "verify" or "verdict", seat, round, passed }`. Workflow binds them to milestones and digests, which is the receipt | Execution | absent; `receiptsFromResults` (`src/workflow/case-projection.mjs`) decides which results are verdicts |
| `started` | `{ value, reason }`; `value` false when no seat was given its brief, with a named reason | Execution | absent; only implied by a settle record of `not-started` |
| `infrastructure` | true when the Unit ended on infrastructure: its outcome is `execution-failure` or `not-started`, no path was written outside the declared scope, and no seat reached a verdict. The one fact Workflow needs to decide a rerun | Execution | absent; Workflow derives it in `isRerunnable` (`src/workflow/store.mjs`). It is computable where Execution settles only after the scope rule above moves into Execution |
| `refunded` | true when the case reservation was handed back because no seat was given its brief | Execution | absent as a field; today only the settle record handed to the case takes the outcome `not-started` (`run.mjs`, `settleAdmission`), while `data.outcome` is not overwritten |
| `settled` | One flag per record settled: the case reservation and the unit record. False with `settleError` when a settle failed | Execution | absent; both settles report a failure with `console.warn` only (`run.mjs`) |
| `launches` | `{ ceiling, used, ceilingHit }`: seat launches, not retries. `ceiling` is given to Execution through the case admission port and is `null` when there is no case; `left` is not a field because it is derived | Execution counts and enforces; the upper layer sets the ceiling | not printed by `fgos run --json`. The ceiling sits in `unit.json` as `seatLaunchCeiling`; `seatLaunchesUsed` and `frameExhausted` go to `admission.port.settle` and from there into the case ledger |
| `results[]` | One item per attempt, in order: `seat`, `role`, `round`, `posture`, `outcome`, `infrastructure`, `runResult`, `binding`, `output`. The per-attempt `infrastructure` is what lets a council reader tell a seat that crashed from a seat that dissented; the Unit-level `infrastructure` is derived from the attempts | Execution | present except `infrastructure` and `output` |
| `rounds`, `findings`, `sync`, `verify`, `commit` | The other fields `data` already returns and Workflow reads (`commit.files`, `commit.outOfScope`, `error`, `sync`, `verify`, `findings`); they stay and are named here so section 7 can say what Workflow reads | Execution | present |
| `warnings[]` | `{ code, message }`, structured; stderr is not part of the contract | Execution | absent; warnings reach stderr only |

The lost-brief relaunch (a seat whose brief never reached its agent is launched once more) is not part of `launches` as a ceiling; it is an attempt with its own `outcome` in `results[]`, and the case rule that no new automatic retry exists is unchanged.

## 4. Attempt shape fields (RunResult version 3, optional fields)

The new fields are optional and change no field's meaning, so every reader of version 3 keeps working and no Rust reader changes. A bump is reserved for a change of meaning, and then the number is **5**: version 4 was already used, from 073c8b6fc (2026-10-01) to d40d74ea1 (2026-11-06), and must not be reused.

| Field | Meaning | Today |
|---|---|---|
| `binding.executor`, `binding.model`, `binding.tier`, `binding.invocation`, `binding.leaseAccount` | Who actually ran, and on which account; a caller checks seat diversity from these | present inside `binding`, which carries its own version shape |
| `binding.family` | The provider family bind computed for the seat. Workflow reads it and no longer guesses it from the model string (`src/workflow/seat-providers.mjs`) | **new mechanism**: bind computes it (`bind.mjs`) but does not hand it up |
| provenance labels | Where each value came from. The labels are the vocabulary `binding.provenance` already uses (seen on 2026-11-09: `cliOverride`, `unit-prefer`, `registeredExecutor`, `assignment`, `governance`, `default`); the contract does not invent a second list. It states the rule: `bind` is the one authority that writes them, and a label is true only when that source supplied the value | **new rule**, not a new list. Two authorities write labels today: `run.mjs` hands bind's own model and tier to Dispatch as `cliOverride`, so Dispatch relabels them (the `claude` seat of the 2026-11-09 run read `cliOverride` for `model` and `tier` although only `--effort` was passed) |
| `executorRedirected` | true when fallback moved the seat to another executor | present |
| `durationMs`, `usage` | Wall time and token counts. An unknown value is `null`; the gap to close is filling them | present, only `?? null` in `run-result.mjs`; `null` in the results checked on 2026-11-09 |
| `output` | `{ report: { path, bytes, sha256 } or null, claim, complete, incompleteReason }`, see below | **new mechanism** for `output.complete` and `incompleteReason`. A digest helper of `{ ref, sha256, bytes }` exists in `src/workflow/ref-digests.mjs`; it moves down to Execution and the Workflow copy is deleted |

### Output

`output.report.path` is an absolute path chosen by Execution. A caller reads that path and never infers the run directory layout. Seats with a pane write their report under `producer/1/runs/01/outbox`; headless seats without a pane (for example `pi-cli-bwrap`) write under `worker-output/outbox`, a split made on purpose on 2026-11-08. That difference stays an adapter detail behind `output.report.path`.

`output.complete` is **declared** by the adapter that wrote the report, never detected afterwards. A headless report taken from the final message is `complete: false` with the reason `from-final-message`; the full answer may then sit only in `stdout.log`, as a seat observed on 2026-11-09 left it.

## 5. Outcome table, unknown values and old records

- One module in Execution owns the closed outcome table. Today a seat outcome is one of six values: `pass`, `findings`, `execution-failure`, `policy-refusal`, `provider-limit`, `blocked`. `not-started` is not among them: it exists only as the outcome a case reservation settles with, and `unit-summary` adds `undetermined`. The table names every value a reader can meet, with its category, and a never-started run reaches a reader as `started: { value: false }` with a reason. The five identical copies of `VALID_OUTCOMES` in `src/runner/execution/loops/` become imports of it. The same-named set in `src/runner/dispatch/confinement/attestation-store.mjs` is a different domain and stays apart. The same module names the two predicates that two layers hold today with different lists, `rebindsOnResume(seatOutcome)` and `infrastructure(unitResult)`.
- A reader that meets an outcome it does not know, or none, treats the run as **no verdict**, never as a pass.
- A reader refuses an unknown major `contract.version` with a named error and accepts unknown extra fields.
- A record written before the new fields exist, with no `infrastructure` or no `outOfScope`, reads as **not known**, never as a pass. One legacy module applies today's derivation to such records and is deleted one release later; there is no dual-read window between machines, because all machines upgrade together. Old records on disk keep a reader.
- Workflow reads `infrastructure`; it no longer holds its own list of infrastructure outcomes.

## 6. Unit input

No new input. The ceiling reaches Execution only through the case admission port (`seatLaunchCeiling`), so a Unit input for it would be a second door. The Unit input gains `contract: { id: "unit", version }` and keeps the existing refusal of `executor`, `provider`, `model`, `tier`, `invocation`, `actors` and `overrides`, so the caller never pins who runs.

## 7. What each layer must do

- **Execution** writes every field above, keeps one outcome module and one classifier, applies the scope rule and the verify round before it settles, owns worktree custody (a door "run a command under worktree custody" that the case gate calls instead of taking the lease itself), and runs the same read-only Unit through every executor family with the same result shape as a conformance test.
- **Workflow** reads the fields this contract names (section 3 lists the existing ones it also reads) and nothing it does not name. It drops five re-derivations: the infrastructure list, `reachedVerdict` and `isRerunnable` (`store.mjs`), `foldUnitOutcome` (`unit-handoff.mjs`), the verdict test in `receiptsFromResults` (`case-projection.mjs`), the `pass`/`findings` test in the admission port, and the gate's exit-code classifier (`case-gate.mjs`). An architecture rule forbids `src/workflow` from importing the custody parts of `src/run-supervisor/cwd-lock.mjs` (admit and handoff); `case-lock.mjs` keeps its own holder-lock.
- **A caller with only `fgos run --json`** needs nothing outside this contract to run several seats, check their independence, tell an infrastructure failure from a result, find each answer and read what each seat cost.

## 8. Acceptance proof

One scenario, in two shapes. (a) Three separate `fgos run --json` calls started in parallel on three different executor families. (b) One `fgos run --pattern panel --params <three seats> --json` call, where the seats are `results[]` items. In both, one seat is forced into an infrastructure failure by a fixture executor registered in the conformance test's own config, never by a product flag or an environment switch. A script reads only fields named in this contract and must (1) report which executor and account ran each seat, (2) mark the failed seat as infrastructure and not as a vote, (3) find all answers by `output.report.path`, and (4) report duration and usage, or that they are `null`. If the script needs anything else, the contract is incomplete.

Fixtures: one golden file per outcome under `packages/run-result/contracts/fixtures/`, read by both the Node and the Rust tests, as `packages/yaml-doc/contracts/fixtures/parse.v1.json` already is. Workflow tests take their results from these fixtures instead of building results by hand.

## 9. Order of work (proposed; the code split awaits the owner)

1. Contract text and the fixtures.
2. One outcome module; the five copies removed.
3. Execution writes the new Unit and attempt fields. This step includes moving the scope rule and the verify round into Execution before `settleAdmission`, because `infrastructure` and a final `outcome` cannot be computed without it.
4. Workflow switches to the new fields, and the five re-derivations of section 7 are deleted in the same change; every caller moves in that change.
5. The per-executor-family conformance test, then the acceptance scenario.

Independent of the order above, landable on its own at any point: the custody door, the case gate moved onto it, and the import rule in `test/architecture.test.mjs`.

Separately landable, unrelated to the contract: dead code of the retired engine in Dispatch (`fgos coordination recover` hints in `runtime-inspection.mjs`, `FORBIDDEN_SESSION_FIELDS` and `fanOutPayload` in `execution-contract.mjs`, the `coordination-session` hint in `reconciliation-planner.mjs`).

## 10. Lessons from the retired coordination engine that shape this contract

The engine owned execution and orchestration in one block, grew a phase at a time with no version for the extensions, and published fields before any writer or test existed. This contract therefore lists a "Today" column, carries one version shape, and names no field without a writer. Details and evidence: the entity map report listed in Provenance.

## 11. Not decided

- Whether a verify that times out or cannot run counts as infrastructure, so that resume reruns it; an owner question put through HARDEN.
- Whether a case wall-time or concurrency ceiling is added to the case frame; outside this contract.
- Close by quorum for a council step; outside this contract.
- Whether the Unit-level facts are also stored (which bumps `unit-summary` to version 3) or only printed in `data`.
- Whether `refunded` stays. A council seat argued it is redundant with `started: { value: false }` and leaks a case concept into Execution; HARDEN asked to keep it because the settle record is overwritten with `not-started` today. `settled` is already one flag per record.
- Whether `binding.family` stays. Two council seats called it derivable; HARDEN keeps it because `seat-providers.mjs` guesses the family from the model string while `bind.mjs` already computes the real one.
- Whether `output.complete` stays. Two council seats called it a judgment with no ground truth; it is now declared by the adapter, not detected, which is the answer to that objection and is not yet agreed.
- Whether the import ban and the custody door are landable on their own: one council seat found them a multi-file change, another endorsed them as independent.
