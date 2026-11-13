# Unit Run Result Contract — Execution to Workflow

```txt
Document type: Contract
Audience: Maintainer, implementer, agent that has only `fgos run --json`
Purpose: Fix what the Execution layer hands up when a Unit run ends, so the Workflow layer and any caller read facts instead of re-deriving them
Design status: Approved by the owner on 2026-11-12 (sections 3 and 5 first, then the rest the same day). Parts of the work already landed (the custody door and the verify door in `src/runner/execution/custody-door.mjs`, seat transcript keeping, `accountPin`); the rest is not implemented
Implementation: Partial, see Design status. The "Today" column of each table says what exists now
Provenance: Owner direction 2026-11-09 (three layers; lower layer must stand alone; one authority per decision, in the lowest layer that can know it), a four-seat advisory run through `fgos run` only, HARDEN review of every "Today" cell against origin/main, HARDEN's cross-layer authority audit (plans/reports/audit-261109-1736-harden-authority-layers.md) and the retired-engine entity map (plans/reports/researcher-report-261109-1647-retired-engine-entity-map.md)
Writer type: Agent draft writer (COOK), reviewed by HARDEN
Canonical for: The result shape of one Unit run at the Execution to Workflow boundary, once approved
Use this when: Writing or reading a caller of `fgos run --json`, or moving a derivation out of `src/workflow` into Execution
Do not use this for: Proof that any field exists today; the Assignment to Run contract (see Related)
Last reviewed: 2026-11-13
Related:
- docs/platform/runner/spec.md (Execution Core and Dispatch section)
- docs/platform/agent-coordination/contracts/assignment-run-runresult.md (the Assignment, Run and RunResult contract this one builds on)
- src/runner/dispatch/run-result.mjs (RunResult version 3 writer and readers)
- src/runner/execution/unit.mjs (Unit input contract)
- src/runner/execution/unit-summary.mjs (the persisted Unit-level record, version 3)
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
2. **Unit shape.** What one Unit run ends with. Two forms exist and stay two: the `data` object of `fgos run --json` (the return value of `runUnit`: `unitRunId`, `outcome`, `rounds`, `results`, `findings`, never persisted whole) and the persisted record `unit-summary`, which already carries `contract: { id, version }`. `data` gains the Unit-level facts of section 3 as additive fields and carries no contract id of its own. Version 3 of `unit-summary` stores three of those facts (`infrastructure`, `infrastructureReason`, `refused`; section 3); its Rust reader accepts versions 2 and 3, so a v2 file already on disk stays readable.
3. **Port shape.** What the case admission port hands Workflow when a reservation settles. Today it is an untyped object of raw seat results that Workflow filters for `pass` and `findings`. It carries the Unit shape of section 3, including `evaluations[]`, so the port is covered by this contract and not only `fgos run --json`.

Every versioned block uses one shape, `contract: { id, version }`, and `binding` moves from `contractVersion: "v1alpha1"` to it in the same change as its readers. Today the blocks use three (`{id, version}` on RunResult and unit-summary, `contractVersion: "v1alpha1"` inside `binding`, none on the Unit input or the case ledger).

## 3. Unit shape fields

| Field | Meaning | Set by | Today |
|---|---|---|---|
| `unitRunId` | Run identity of the Unit | Execution | present |
| `outcome` | One value of the closed outcome table (section 5), **final**: the scope rule, the verify round and the refund are already applied | Execution | present but not final. Workflow rewrites it after Execution has settled: an out-of-scope `pass` becomes `findings` and a check that cannot run becomes `execution-failure` (`foldUnitOutcome`, `src/workflow/unit-handoff.mjs`), so the case ledger says `pass` and the workflow ledger says `findings` for one run. `fgos run --case` never applies the scope rule |
| `outOfScope[]`, `outOfScopeOnBranch[]` | Paths the Unit wrote outside its declared writes, and paths its branch carries outside them since its base | Execution | partial: Execution reports `commit.outOfScope` (`run.mjs`); the branch-level check is Workflow's (`outOfScopeWrites`) and reads Execution's private `unit.json`. Execution takes the base Unit's `outOfScopeOnBranch` as an input instead |
| `evaluations[]` | One entry per evaluator result: `{ kind: "verify" or "verdict", seat, round, passed }`. Workflow binds them to milestones and digests, which is the receipt | Execution | absent; `receiptsFromResults` (`src/workflow/case-projection.mjs`) decides which results are verdicts |
| `started` | `{ value, reason }`; `value` false when no seat was given its brief, with a named reason. It implies the launch slot was handed back; that return is Execution's internal accounting through the admission port and is not a separate fact | Execution | absent; today the settle record handed to the case takes the outcome `not-started` (`run.mjs`, `settleAdmission`) while `data.outcome` is not overwritten |
| `infrastructure` | true when the Unit ended on infrastructure: its outcome is `execution-failure` or `not-started`, no path was written outside the declared scope, no seat was refused (`refused` is a policy decision a rerun meets again), and no seat reached a verdict. A verify that times out or could not run counts as infrastructure, so resume reruns it (owner decision, 2026-11-09). The one fact Workflow needs to decide a rerun | Execution | absent; Workflow derives it in `isRerunnable` (`src/workflow/store.mjs`). It is computable where Execution settles only after the scope rule above moves into Execution |
| `infrastructureReason` | Why the Unit ended on infrastructure; null when `infrastructure` is false. The first that applies: `not-started` (no brief delivered); `scope-check-failed` (the write check could not run); for the first attempt that ended on infrastructure, `verify-timeout` or `verify-not-run`, `commit-failed:<commit reason>`, else the attempt's run-result outcome reason (for example `infra-exec-failed`), else `execution-failure`; `run-error` when the run threw before it produced a result. One function in `src/runner/execution/run.mjs` (`infrastructureReasonOf`) holds the list | Execution | stored in `unit.json` `settlement` and in `unit-summary` v3 |
| `refused[]` | `{ seat, round, reason, detail }` for each seat a policy decision refused; `[]` when none. A refused seat has no run directory, so the summary cannot find it on disk | Execution | stored in `unit.json` `settlement` and in `unit-summary` v3 |
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
| `binding.family` | The provider family bind computed for the seat. Workflow reads it and no longer guesses it from the model string (`src/workflow/seat-providers.mjs`) | present: `bind` writes it on the binding (`family`, spelled by `familyOf`) and the attempt's `binding` carries it; Workflow reads it (a result written before it existed keeps the family its run policy named, through `legacyFamilyOf`) |
| provenance labels | Where each value came from. The labels are the vocabulary `binding.provenance` already uses (seen on 2026-11-09: `cliOverride`, `unit-prefer`, `registeredExecutor`, `assignment`, `governance`, `default`); the contract does not invent a second list. It states the rule: `bind` is the one authority that writes them, and a label is true only when that source supplied the value | **new rule**, not a new list. Two authorities write labels today: `run.mjs` hands bind's own model and tier to Dispatch as `cliOverride`, so Dispatch relabels them (the `claude` seat of the 2026-11-09 run read `cliOverride` for `model` and `tier` although only `--effort` was passed) |
| `executorRedirected` | true when fallback moved the seat to another executor | present |
| `durationMs`, `usage` | Wall time and token counts. An unknown value is `null`; the gap to close is filling them | `durationMs` present: Execution measures the dispatch of each attempt with a monotonic clock, keeps it on the attempt record of `unit.json` and writes it as `runResult.durationMs` (whole milliseconds; `null` for a seat that never ran and for a record written before it was kept). `usage` is still `null` |
| `refused` | `{ reason, detail, paths? }`, present exactly when the seat was refused before it ran (its outcome is `policy-refusal`, nothing started). `reason` is a stable code, `detail` the text a person reads. A refused seat is never infrastructure, so a rerun decision reads `infrastructure` and never this field; Workflow reads it only to word the failure | Execution | present on the seat result (`refusedSeat`, `run.mjs`) but not named by the contract, and Workflow also keeps `refused` as its own acceptance value in `store.mjs`, which is a second meaning of the same word |
| `activity` | `{ turns, toolUses, transcriptPath }`; `turns` and `toolUses` are `null` where the CLI gives no count. Execution keeps the seat's session transcript in the run directory (`protected/session/`, mode 0600) before it removes the attempt's private home, and `transcriptPath` points to it. It is `null` only when the CLI wrote no session, and for confined claude seats until they get their own credential store (owner decision 86). The kept path is recorded run-relative as `detail.transcriptPath` in `steps/finalize-home.json`. Only the `sessions/` part is kept, never the login copies in the home (owner decision, 2026-11-09: a seat's work must stay auditable after the run) | **new mechanism**. Today `finalize-home` removes the private home without copying anything (`authority.mjs`, `removeAttemptHome`), so a seat run in a pane leaves only about 4 KB of launcher text and the screen as it was when the seat exited; only a headless seat has its transcript, in `stdout.log`. The exact folder inside the home is inferred, not yet observed on a live run |
| `output` | `{ report: { path, bytes, sha256 } or null, claim, complete, incompleteReason }`, see below | **new mechanism** for `output.complete` and `incompleteReason`. A digest helper of `{ ref, sha256, bytes }` exists in `src/workflow/ref-digests.mjs`; it moves down to Execution and the Workflow copy is deleted |

### Output

`output.report.path` is an absolute path chosen by Execution. A caller reads that path and never infers the run directory layout. Seats with a pane write their report under `producer/1/runs/01/outbox`; headless seats without a pane (for example `pi-cli-bwrap`) write under `worker-output/outbox`, a split made on purpose on 2026-11-08. That difference stays an adapter detail behind `output.report.path`.

`output.complete` is **declared**, never detected afterwards, and never null: `true` only when Dispatch settlement found a substantive report the seat wrote itself and the seat ended on its own (its claim was read, no timeout and no kill); otherwise `false`, so `false` means "not declared complete". `incompleteReason` is then one of `no-report` (the seat wrote no substantive report) or `seat-did-not-finish` (it timed out or was killed), and is null when `complete` is true. Both cli-spawn and herdr-spawn seats write `report-N.md` themselves and settlement reads it; no adapter takes a report from a seat's final message today, so no such reason exists. If one ever does, its reason is added here in the same change. The full answer of a headless seat may still sit only in `stdout.log`, as a seat observed on 2026-11-09 left it.

## 5. Outcome table, unknown values and old records

- One module in Execution owns the closed outcome table. Today a seat outcome is one of six values: `pass`, `findings`, `execution-failure`, `policy-refusal`, `provider-limit`, `blocked`. `not-started` is not a seat outcome (no seat ran). It is the Unit-level outcome of a run none of whose seats got its brief, the value the case reservation settles with, and it reaches a reader as `data.outcome: not-started` together with `started: { value: false }` and a reason. It exits with the same code as `execution-failure` (11) and counts as infrastructure. `unit-summary` adds `undetermined`. The table names every value a reader can meet, with its category, and a never-started run reaches a reader as `started: { value: false }` with a reason. The five identical copies of `VALID_OUTCOMES` in `src/runner/execution/loops/` become imports of it. The same-named set in `src/runner/dispatch/confinement/attestation-store.mjs` is a different domain and stays apart. The same module names the two predicates that two layers hold today with different lists, `rebindsOnResume(seatOutcome)` and `infrastructure(unitResult)`.
- A reader that meets an outcome it does not know, or none, treats the run as **no verdict**, never as a pass.
- A reader refuses an unknown major `contract.version` with a named error and accepts unknown extra fields.
- A record written before the new fields exist, with no `infrastructure` or no `outOfScope`, reads as **not known**, never as a pass; a `unit.json` settled before the infrastructure facts were stored yields a v3 summary with `infrastructure: null`, `infrastructureReason: null`, `refused: []`. One legacy module applies today's derivation to such records and is deleted one release later; there is no dual-read window between machines, because all machines upgrade together. Old records on disk keep a reader.
- Workflow reads `infrastructure`; it no longer holds its own list of infrastructure outcomes.
- `bind` skips an executor whose CLI is not on PATH and refuses with `agent-cli-missing` before a unit run exists, so a missing CLI never reaches a reader as a run outcome.

## 6. Unit input

No new input. The ceiling reaches Execution only through the case admission port (`seatLaunchCeiling`), so a Unit input for it would be a second door. The Unit input gains `contract: { id: "unit", version }` and keeps the existing refusal of `executor`, `provider`, `model`, `tier`, `invocation`, `actors` and `overrides`, so the caller never pins who runs. The account-pin mode (`accountPin: strict | where-served`, absent means `strict`) is an option of `runUnit` beside `overrides` and `workflowId`, never a Unit field and never an override key.

## 7. What each layer must do

- **Execution** writes every field above, keeps one outcome module and one classifier, applies the scope rule and the verify round before it settles, owns worktree custody (a door "run a command under worktree custody" that the case gate calls instead of taking the lease itself) and one door "run a verify under custody and classify it" that answers `{ verdict: pass or findings }` or `{ infrastructure: timeout or not-run }`, which the Unit verify and the case gate both call, keeps each seat's session transcript before its private home is removed, and runs the same read-only Unit through every executor family with the same result shape as a conformance test.
- **Workflow** reads the fields this contract names (section 3 lists the existing ones it also reads) and nothing it does not name. It drops five re-derivations: the infrastructure list, `reachedVerdict` and `isRerunnable` (`store.mjs`), `foldUnitOutcome` (`unit-handoff.mjs`), the verdict test in `receiptsFromResults` (`case-projection.mjs`), the `pass`/`findings` test in the admission port, and the gate's own exit-code classifier (`case-gate.mjs`), which the verify door replaces. An architecture rule forbids `src/workflow` from importing the custody parts of `src/run-supervisor/cwd-lock.mjs` (admit and handoff); `case-lock.mjs` keeps its own holder-lock.
- **A caller with only `fgos run --json`** needs nothing outside this contract to run several seats, check their independence, tell an infrastructure failure from a result, find each answer and read what each seat cost.

## 8. Acceptance proof

One scenario, in two shapes. (a) Three separate `fgos run --json` calls started in parallel on three different executor families. (b) One `fgos run --pattern panel --params <three seats> --json` call, where the seats are `results[]` items. In both, one seat is forced into an infrastructure failure by a fixture executor registered in the conformance test's own config, never by a product flag or an environment switch. A script reads only fields named in this contract and must (1) report which executor and account ran each seat, (2) mark the failed seat as infrastructure and not as a vote, (3) find all answers by `output.report.path`, and (4) report duration and usage, or that they are `null`. If the script needs anything else, the contract is incomplete.

Fixtures: one golden file per outcome in [`packages/run-result/contracts/fixtures/`](../../../../packages/run-result/contracts/fixtures/README.md), read by both the Node and the Rust tests, as `packages/yaml-doc/contracts/fixtures/parse.v1.json` already is. Workflow tests take their results from these fixtures instead of building results by hand.

## 9. Order of work (approved)

1. Contract text and the fixtures.
2. One outcome module; the five copies removed.
3. Execution writes the new Unit and attempt fields. This step includes moving the scope rule and the verify round into Execution before `settleAdmission`, because `infrastructure` and a final `outcome` cannot be computed without it.
4. Workflow switches to the new fields, and the five re-derivations of section 7 are deleted in the same change; every caller moves in that change.
5. The per-executor-family conformance test, then the acceptance scenario.

Independent of the order above, landable on its own at any point: the custody door, the case gate moved onto it, and the import rule in `test/architecture.test.mjs`.

Keeping the seat transcript is its own step, landable on its own: copy `sessions/` of the attempt home to `protected/session/` inside `finalizeAttemptHome` before `removeAttemptHome`, declare the session folder per executor next to `credentialStore` in `runner.yaml` and its schema, update the run-supervisor spec, and give the owning test of `finalizeAttemptHome` a case. Pi and omp sessions can weigh several megabytes and may hold sensitive text, so the copy stays mode 0600 and follows the run directory's retention. First observe one live pane seat to confirm where each CLI writes its session. Agent CLIs change often, so the observation is kept as a helper, not a one-off: a read-only diagnostic, `fgos dispatch probe-session <executorId>`, beside `probe-account` (both are dispatch reads about one executor), that runs a tiny seat for that executor and reports where that CLI wrote its session, whether Execution kept it and where `transcriptPath` points, so a CLI upgrade can be checked in seconds for each executor. Doctor may carry one read-only pointer row for it and never repairs.

Separately landable, unrelated to the contract: dead code of the retired engine in Dispatch (`fgos coordination recover` hints in `runtime-inspection.mjs`, `FORBIDDEN_SESSION_FIELDS` and `fanOutPayload` in `execution-contract.mjs`, the `coordination-session` hint in `reconciliation-planner.mjs`).

## 10. Lessons from the retired coordination engine that shape this contract

The engine owned execution and orchestration in one block, grew a phase at a time with no version for the extensions, and published fields before any writer or test existed. This contract therefore lists a "Today" column, carries one version shape, and names no field without a writer. Details and evidence: the entity map report listed in Provenance.

## 11. Not decided

- Whether a case wall-time or concurrency ceiling is added to the case frame; outside this contract.
- Close by quorum for a council step; outside this contract.
- Decided 2026-11-12 (owner approved the recommendation): the Unit-level facts are only printed in `data`, so `unit-summary` stays at version 2. Store them later, with the Rust reader first, if a reader needs it.
- Decided 2026-11-13 (owner chose the bump, account health review): a reader needs them (a unit that failed on a commit shows a passing seat and nothing on the summary says why), so `unit-summary` is version 3 with `infrastructure`, `infrastructureReason` and `refused`, the Rust reader taking 2 and 3.
