# Unit Run Result Contract — Execution to Workflow

```txt
Document type: Contract
Audience: Maintainer, implementer, agent that has only `fgos run --json`
Purpose: Fix what the Execution layer hands up when a Unit run ends, so the Workflow layer and any caller read facts instead of re-deriving them
Design status: Proposed. The owner has not approved it; nothing below is implemented yet
Implementation: None. The "Today" column of each table says what exists now
Provenance: Owner direction 2026-11-09 (three layers; lower layer must stand alone), a four-seat advisory run through `fgos run` only, HARDEN answers on the same day, and the retired-engine entity map in plans/reports/researcher-report-261109-1647-retired-engine-entity-map.md
Writer type: Agent draft writer (COOK), reviewed in discussion with HARDEN
Canonical for: The result shape of one Unit run at the Execution to Workflow boundary, once approved
Use this when: Writing or reading a caller of `fgos run --json`, or moving a derivation out of `src/workflow` into Execution
Do not use this for: Proof that any field exists today; the Assignment to Run contract (see Related)
Last reviewed: 2026-11-09
Related:
- docs/platform/runner/spec.md (Execution Core and Dispatch section)
- docs/platform/agent-coordination/contracts/assignment-run-runresult.md (the Assignment, Run and RunResult contract this one builds on)
- src/runner/dispatch/run-result.mjs (RunResult version 3 writer and readers)
- src/runner/execution/unit.mjs (Unit input contract)
Supersedes: None
Superseded by: None
```

## 1. Layers and who decides what

Three layers, named after their directories: **Execution** (`fgos run` and below: seat binding, Unit runs, Dispatch, RunResult), **Workflow** (`src/workflow`: steps, cases, resume, gate, the case budget frame) and **Domain** (workflow definitions, slice kinds, evidence rules under `domains/` and `core/workflows`). Names are not changed by this contract.

- The upper layer governs: what to run, how much it may spend, what counts as done, when to ask a person.
- The lower layer executes and reports facts truthfully: whether a run started, who ran it, whether it ended on infrastructure rather than reaching a verdict, what it spent.
- A lower layer enforces a limit it is given and never chooses it. With no upper layer the limit is `null`, meaning none, and the lower layer still runs. That is the standalone property: an agent holding only `fgos run --json` can drive several seats and read every fact it needs from this contract.

## 2. The two shapes

1. **Attempt shape.** One supervised attempt of one seat: the existing `RunResult`, moving from version 3 to **version 4** additively. A version 3 reader stays for old records. Facts about one attempt live here.
2. **Unit shape.** What one Unit run ends with: the `data` object of `fgos run --json` (`unitRunId`, `outcome`, `rounds`, `results`, `findings`). Facts about the whole Unit live here. Each item of `results` carries its attempt's `runResult` and `binding`.

Both carry `contract: { id, version }`, the one version shape for every block of the boundary. Today the blocks use three shapes (`{id, version}` on RunResult and unit-summary, `contractVersion: "v1alpha1"` inside `binding`, none on the Unit input or the case ledger).

## 3. Unit shape fields

| Field | Meaning | Set by | Today |
|---|---|---|---|
| `contract` | `{ id: "unit-run-result", version }` | Execution | absent on the Unit level |
| `unitRunId` | Run identity of the Unit | Execution | present |
| `outcome` | One value of the closed outcome table (section 5) | Execution | present, table declared in five files |
| `started` | `{ value, reason }`; `value` false when no seat was given its brief, with a named reason | Execution | absent; implied by `not-started` |
| `infrastructure` | true when no seat reached a verdict because infrastructure failed; the only fact Workflow needs to decide a rerun | Execution | absent; Workflow derives it (`INFRASTRUCTURE_OUTCOMES`, `isRerunnable` in `src/workflow/store.mjs`) |
| `refunded` | true when the reservation was handed back; `outcome` keeps its real value | Execution | absent; the outcome is overwritten with `not-started` |
| `settled` | true when the unit record was settled; false with `settleError` when settling failed | Execution | absent; a failed settle is only a `console.warn` |
| `retry` | `{ ceiling, used, ceilingHit }`; `ceiling` is an input from above, `null` when none; `left` is not a field because it is derived | Execution counts and enforces; the caller sets `ceiling` | partial: the ceiling reaches Execution through the admission port and is enforced (`hasLaunchRoom` in `run.mjs`), and `seatLaunchesUsed` and `ceilingHit` go into the case settle record; whether `fgos run --json` shows them was not checked |
| `results[]` | One item per attempt, in order: `seat`, `role`, `round`, `posture`, `outcome`, `runResult`, `binding`, `output` | Execution | present except `output` |
| `warnings[]` | `{ code, message, source }`, structured; stderr is not part of the contract | Execution | absent; warnings reach stderr only |

The lost-brief relaunch (a seat whose brief never reached its agent is launched once more) is not part of `retry`; it is recorded as an attempt with its own `outcome` in `results[]`.

## 4. Attempt shape fields (RunResult version 4, additive)

| Field | Meaning | Today |
|---|---|---|
| `binding.executor`, `binding.model`, `binding.tier`, `binding.invocation`, `binding.leaseAccount` | Who actually ran, and on which account; a caller checks seat diversity from these | present inside `binding`, which carries its own version shape |
| `binding.family` | The provider family of the executor, so independence is observable without a lookup | absent |
| `binding.provenance.*` | Where each value came from: one of `cli`, `unit`, `policy`, `default`, `fallback`. A label is correct only when that source supplied the value | present; the `claude` seat of the 2026-11-09 run read `cliOverride` for `model` and `tier` although only `--effort` was passed, not yet explained |
| `executorRedirected` | true when fallback moved the seat to another executor | present |
| `durationMs` | Wall time of the attempt | present; `null` in the claude, gemini and glm results checked on 2026-11-09 |
| `usage` | Token counts | present; every count `null` in the claude result checked; other executors not checked |
| `output` | `{ report: { path, bytes, sha256 } or null, claim, complete, incompleteReason }`, see below | absent |

A field that cannot be filled is `null` together with a `reason` code (for example `adapter-reports-no-usage`), never a bare `null`.

### Output

`output.report.path` is an absolute path chosen by Execution. A caller reads that path and never infers the run directory layout. Seats with a pane write their report under `producer/1/runs/01/outbox`; seats without a pane (for example `pi-cli-bwrap`) write under `worker-output/outbox`. That difference stays an adapter detail behind `output.report.path`.

`output.complete` is false, with `incompleteReason`, when the report is shorter than the answer: the headless adapter writes the report from the final message, and a seat observed on 2026-11-09 left only a summary in the report while the full advice sat in `stdout.log`.

## 5. Outcome table and unknown values

- One module in Execution owns the closed outcome table. The five identical copies of `VALID_OUTCOMES` in `src/runner/execution/loops/` become imports of it. The same-named set in `src/runner/dispatch/confinement/attestation-store.mjs` is a different domain and stays apart.
- A reader that meets an outcome it does not know, or none, treats the run as **no verdict**, never as a pass.
- A reader refuses an unknown major `contract.version` with a named error and accepts unknown extra fields.
- Workflow reads `infrastructure`; it no longer holds its own list of infrastructure outcomes.

## 6. Unit input

The Unit input carries `contract: { id: "unit", version }`. It keeps the existing refusal of `executor`, `provider`, `model`, `tier`, `invocation`, `actors` and `overrides`, so the caller never pins who runs. It gains the optional input `retryCeiling`, default `null`.

## 7. What each layer must do

- **Execution** writes every field above, keeps one outcome table and one classifier, owns worktree custody (a door "run a command under worktree custody" that the case gate calls instead of taking the lease itself), and runs the same read-only Unit through every executor family with the same result shape as a conformance test.
- **Workflow** reads these fields and nothing the contract does not name. A rule about the fact that a run reached a verdict lives once, in Execution. An architecture rule forbids `src/workflow` from importing `src/holder-lock` and `src/run-supervisor/cwd-lock.mjs`.
- **A caller with only `fgos run --json`** needs nothing outside this contract to run several seats, check their independence, tell an infrastructure failure from a result, find each answer and read what each seat cost.

## 8. Acceptance proof

One scenario: three seats started in parallel with `fgos run --json` only, on three different executor families, with one seat forced into an infrastructure failure. A script reads only fields named in this contract and must (1) report which executor and account ran each seat, (2) mark the failed seat as infrastructure and not as a vote, (3) find all answers by `output.report.path`, and (4) report duration and usage or the reason they are missing. If the script needs anything else, the contract is incomplete.

## 9. Order of work (proposed)

1. Contract text and one fixture per outcome.
2. One outcome module; the five copies removed.
3. Additive fields on RunResult version 4 and the Unit shape; Workflow reads `infrastructure` and the old derivation is deleted in the same change.
4. The custody door, the case gate moved onto it, and the import rule in `test/architecture.test.mjs`.
5. The per-executor-family conformance test, then the acceptance scenario.
6. Dead code of the retired engine in Dispatch, in the same batch: `fgos coordination recover` hints in `runtime-inspection.mjs`, `FORBIDDEN_SESSION_FIELDS` and `fanOutPayload` in `execution-contract.mjs`, and the `coordination-session` hint in `reconciliation-planner.mjs`.

## 10. Lessons from the retired coordination engine that shape this contract

The engine owned execution and orchestration in one block, grew a phase at a time with no version for the extensions, and published fields before any writer or test existed. This contract therefore lists a "Today" column, carries one version shape, and names no field without a writer. Details and evidence: the entity map report listed in Provenance.

## 11. Not decided

- Whether the Unit level `data` carries its own `contract.id` (as written here) or only the attempt level carries one; HARDEN prefers no wrapper block.
- Whether a case wall-time or concurrency ceiling is added to the case frame; outside this contract.
- Close by quorum for a council step; outside this contract.
- Why the `claude` seat's `model` and `tier` read `cliOverride`; to be checked as part of the provenance labels.
