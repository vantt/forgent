# Audit: one authority per decision, across layers T0–T8

Date: 2026-11-09 (Asia/Saigon). Code audited: `origin/main` at `308c314a0`, read in a linked worktree (the main checkout was 21 commits behind). COOK's contract read from `origin/cook/unit-run-result` at `b1ea83bda` (`docs/platform/runner/contracts/unit-run-result.md`). T9 sub-plan `plans/261109-1718-harden-t9-host-surface/` and packaging sub-plan `plans/261109-1617-harden-packaging-distribution/` read as they stand on `308c314a0`.
Trigger: owner decision 82 (HARDEN plan, top of the decisions). Every decision and every fact has exactly one authority, in the lowest layer that can know it (design principle 7). Upper layers read it through an explicit, versioned contract and never re-derive it. A task in the wrong layer moves to its owning layer, with its callers and its owning test (L10).
Read-only: no code changed and no tests run. Each finding's origin comes from `git log -S` (oldest commit that added the symbol).

Layers used: T0 process facts / durable file / canonical JSON; T1 identity, holder-lock, account lock; T2 git and worktree; T3 event store, mailbox, config; T4 run-supervisor and terminal control; T5 **Execution** (`fgos run`, dispatch, bind, confinement, seat binding, run result); T6 **Workflow** (`src/workflow`); T7 Work (listed only, decision 78); T8 skills and **Domain**; T9 host and surface.

Severity: **High** means two authorities can disagree today and cause wrong behaviour. **Medium** means drift risk. **Low** means style.

## 0. Summary

- 27 findings: **4 High, 20 Medium, 3 Low**. Two of the Medium findings are Work items (AU-26, AU-27), listed and not planned (decision 78).
- The four High findings:
  - **AU-10.** Workflow rewrites Execution's outcome after Execution has already settled the case (`pass` becomes `findings` for writes outside the scope). `fgos run --case` never applies that rule at all.
  - **AU-15.** Dispatch relabels bind's provenance as `cliOverride`, which put a wrong record in the 2026-11-09 run.
  - **AU-01.** Three answers exist for "which project store": the Rust `.fgos` walk, the Node strict cwd, and the Node Git main root.
  - **AU-21.** Doctor and the runtime load workflow definitions with opposite precedence, so doctor checks a different definition from the one that runs.
- **The verdict question** (section 1): Execution owns every verdict fact. Workflow owns only the acceptance decision taken on those facts. Domain supplies the acceptance rules as data. Today Workflow re-derives verdict facts in five places and changes one of them.
- **Must-know for COOK's `unit-run-result`**:
  1. Its `infrastructure` flag cannot be computed where Execution settles until the scope rule of AU-10 moves into Execution. T9 P07 as written would compute it without `outOfScope`.
  2. RunResult **version 4 already existed**, from `073c8b6fc` (2026-10-01) until `d40d74ea1` (2026-11-06). Reusing the number needs an owner decision or a check of every machine's records (AU-20).
  3. The settle payload of the case admission port is untyped. It should carry the contract's Unit shape plus `evaluations[]` (AU-09).
- **Must-know for T9**:
  1. P01 moves `OUTCOME_EXIT_CODES` into a new `src/state/store-error.mjs`, which is still the Work directory. The outcome-to-exit map belongs with Execution's outcome table (AU-19).
  2. P05/P11 forbid `src/workflow` from importing `holder-lock` wholesale. `case-lock.mjs` is Workflow's own advance lock on its own ledger, over the T1 door, which is correct layering. The rule should forbid the custody mechanisms (`cwd-lock`, the scopes `unit-custody` and `workflow-worktree`), not the T1 door (AU-06).
  3. P02's equivalence test must include the Rust host walk and the identity crate's `main_root`, not only the Node resolvers (AU-01).

## 1. The verdict, answered

**Who owns "this seat reached a verdict"?** **Execution (T5)** owns it, through one outcome module. The Rust `run-result::derive_outcome` (`packages/run-result/rust/src/lib.rs:24`) already decides a run's category. Node `outcomeOfRunResult` (`src/runner/execution/unit-run-history.mjs:18-34`) maps that category to a seat outcome. The seat's posture (`posture.verdict`, from the seat resolver) says whether the seat is a checker. "Reached a verdict" is a pure function of those three facts, and all three live in Execution. Execution also owns:

- the **unit outcome**: loop aggregation in `src/runner/execution/loops/*`, the receipt-mismatch refusal and commit failure (`run.mjs:696-713`), and the not-started refund (`run.mjs:198-206`);
- the **verify round**;
- the **"wrote outside its scope" rule**: Execution makes the commit and already reports `commit.outOfScope`, `run.mjs:628,701`.

**Who owns "this step passed"?** **Workflow (T6)** owns it as an acceptance decision. The step template's `acceptOutcomes` (`src/workflow/runner.mjs:291`), the gate answer, and the milestone and receipt acceptance (`case-projection.mjs:130-140`) are Workflow decisions. The data they apply (`acceptOutcomes`, `produces`, `closure`, delivery milestones) is Domain's, declared in workflow and guide definitions.

**What Workflow should read instead of re-deriving.** From the versioned Unit shape of `unit-run-result`:

- `outcome`, already final: scope rule applied, verify applied, refund applied;
- `infrastructure`;
- `outOfScope[]` and `outOfScopeOnBranch[]`;
- `evaluations[]`, one per evaluator result: `{ kind: 'verify' | 'verdict', seat, round, passed }`. That is what `receiptsFromResults` builds today.

Workflow then binds `evaluations[]` to milestones and subject digests, which is the receipt. It never tests `['pass','findings'].includes(...)`, never calls `isVerdictResult`, never rewrites an outcome, and never reads `unit.json`.

Today's re-derivations Workflow must drop (each listed under AU-09, AU-10 and AU-11):

- `src/workflow/store.mjs:262-264` (`INFRASTRUCTURE_OUTCOMES`, `reachedVerdict`, `isRerunnable`);
- `src/workflow/unit-handoff.mjs:343-357` (`foldUnitOutcome` rewrites `pass` to `findings` or `execution-failure`);
- `src/workflow/case-projection.mjs:290-303` (`receiptsFromResults` decides which results are verdicts);
- `src/workflow/case-admission-port.mjs:71` (achievements only on `pass`/`findings`);
- `src/workflow/case-gate.mjs:114-115` (the gate's exit code becomes `pass`/`findings`, a second verify classifier).

## 2. Findings

Each finding gives: the decision; where it is decided today, with its layer; the authority; the contract; the fix; who takes it; and severity. Sizes are honest rough figures in Node or Rust lines and tests.

### AU-01 — Which directory is the project, and which `.fgos` store is used (High)

- **Decided today** (seven places, four layers):

  | Place | Layer | How it decides |
  |---|---|---|
  | `bin/fgos.mjs:145-156` `dataDir` | T9 | strict cwd |
  | `src/runner/paths.mjs:33` `resolveRepoRoot` | T2 | Git worktree root |
  | `src/runner/paths.mjs:74` `resolveMainCheckoutRoot` | T2 | Git `trustedMainRoot` |
  | `src/runner/execution/run.mjs:63` `resolveGitRoots` | T5 | its own Git read |
  | `scripts/lib/git-ports.mjs:45` `mainCheckoutRoot` | repo scripts | Git `trustedMainRoot` |
  | `apps/fgos/src/cli_projector.rs:17` `resolve_target_root` | T9 | walks up to `.fgos`, stops at `$HOME` |
  | `packages/identity/rust/src/project.rs:158` `main_root` | T1 | Git `trustedMainRoot` |

  Callers that pass their own fallback: `src/runner/session.mjs:417` and `src/runner/gateway-control.mjs:359` (`resolveMainCheckoutRoot(root) ?? root`), and six hand-written copies in `bin/fgos.mjs` (T9 P02 lists them).
- **Disagreement.** From a subdirectory of the main checkout:
  - Node legacy routes read `docs/.fgos` (T9-02, reproduced);
  - the Rust walk finds the real root;
  - from a linked worktree, which has no `.fgos` (ADR0020), the Rust walk finds nothing, while the Node Git readers resolve the main checkout.
- **Authority:** one Rust project locator in the lowest layer that has both facts. It combines the Git repo facts (T2 `resolveRepo`) with the `.fgos` rule, and it should live beside the identity crate's `main_root` or in `host-runtime`. Node reaches it through the addon.
- **Contract:** missing. It should be a `project-locator` answer `{ projectRoot, worktreeRoot, isLinked, source }`, versioned and shared by the host and the addon.
- **Fix:** T9 P02 builds the Node door. Extend it so that the Node door and the Rust walk are the same function, with one equivalence test over {main root, subdirectory, linked worktree, `$HOME`, no repository}. `resolveGitRoots` and `scripts/lib` become callers. About −60 Node, +30 Rust, +1 test file.
- **Takes it:** T9 P02 (add the Rust walk, identity `main_root`, and the session and gateway fallbacks to its scope).
- **Origin:** `resolveGitRoots` `073c8b6fc` (2026-10-01); `dataDir` strict mode from tsk-56t era.

### AU-02 — Which release is active (Medium)

- **Decided today:**
  - `src/setup/registrations.mjs:2505-2580` (`resolveActiveReleaseForDoctor`, a five-step order of its own: env, activation, staged manifest, dev manifest, source checkout);
  - `registrations.mjs:2721-2729` (`doctorDriftActivation`);
  - `src/util/host-bin-path.mjs:69` (`resolveActiveHostBin`);
  - `src/util/host-bin.mjs:44-67` (falls back to another checkout's host, T9 P02);
  - Rust `packages/distribution/rust/src/lib.rs:217-230` (activation read, R10);
  - `fgctl_refresh.rs:211`.

  Layers: T8 doctor, T0 util, packaging Rust.
- **Authority:** packaging (`packages/distribution`), the writer of `activation.json`.
- **Contract:** `activation.json` exists but its read has no versioned answer shape. A missing contract: `activation.read → { releasePath, manifest, hostBin, source }`.
- **Fix:** doctor and `host-bin*` call one read. The doctor-only steps 3–5 survive only as the dev-door case that `fgos:dev` already names. About −80 Node.
- **Takes it:** T9 P02 (host-bin leaf) with P12, and packaging P10 (pin drift row reads the same answer).
- **Origin:** `531215b9c` (2026-09-11).

### AU-03 — Config defaults with a second copy in code (Medium)

- **Decided today:**
  - `dispatch.gateKillGraceMs` and `dispatch.cancelWaitMs`:
    - T3: `packages/config/contracts/runtime-keys.v1.json:6-17`, landed today (`31734bc61`) with default `10000` and `gateKillGraceMs + 5000`;
    - T4: `src/run-supervisor/gate-kill-grace.mjs:14,42,67,80`, with the same numbers as code.
  - Kill wait: `DEFAULT_KILL_WAIT_MS = 2000` in T1 Node `src/holder-lock/protocol.mjs:18`, used by `index.mjs:198`, `run-supervisor/direct-launch.mjs:272` and `setup/holder-lock-checks.mjs:118`, and also in T1 Rust (`packages/holder-lock/rust/src/port`, used by `route.rs:413`).
  - `maxRounds`:
    - T3 data: `core/config-standard/runner.yaml:812`;
    - T5: `src/runner/execution/loops/reviewed.mjs:28`.
  - Work, listed only: the worker slot "recommended 8" in `src/state/worker-slots.mjs:81`, against the config default `null` (`core/config-standard/workerSlots.yaml:6`).
- **Authority:** the config door (T3) for every value a person may set. For a fixed constant (the kill wait, decision 12), the one crate that enforces it.
- **Contract:** the config door's section schema with `default`. `runtime-keys.v1.json` is a stop-gap list that duplicates the default as text.
- **Fixes:**
  - give `dispatch` a section schema with the defaults in `core/config-standard`, and have `gate-kill-grace.mjs` read the value only;
  - Node reads the kill wait from the addon's constant;
  - `reviewed.mjs` reads `maxRounds` from the config and throws when it is missing.

  Size: about −25 Node, +15 YAML.
- **Takes it:** a new T3/T4 fix phase (dispatch schema), a T1 fix (kill wait), a T5 fix (maxRounds). The worker slot item is Work later.

### AU-04 — Verb facts (store needed, mutating, Event Store lifecycle) outside the registry (Medium)

- **Decided today** (T9):
  - `bin/fgos.mjs:4865` `STORE_MISSING_WARNING_VERBS`;
  - `:4872` `EVENT_STORE_LIFECYCLE_VERBS`;
  - `:4983` `MUTATING_ONLY_VERBS` plus the per-verb predicates `:4990-5015`;
  - `:5021` `ALLOWED_HOOK_KINDS`.

  These sit beside `COMMAND_REGISTRY.requiresExistingStore` (`src/cli/command-registry.mjs`, 84 entries). `packages/host-runtime/contracts/command-routes.json` is generated from the registry (`scripts/export-command-selectors.mjs`), so it is a projection, not a third authority.
- **Authority:** `COMMAND_REGISTRY` (kernel leaf), the one table of verb facts.
- **Contract:** the registry entry shape. It exists but is unversioned. Name a version when P01 adds `store`/`landsWork`.
- **Fix:** as T9 P01 writes it (−45 lines of sets).
- **Takes it:** T9 P01.
- **Origin:** `2ed09ca1a` (2026-07-29).

### AU-05 — Event Store lifecycle split across five doors (Medium)

- **Decided today:**
  - T9: `bin/fgos.mjs:4872-4897` (`landsWork`, `handSealsToChild`, `isEventStoreChild`, `opensEventStore`), and the start and end triggers at `:5309` and `:5379` (the start trigger drops its error);
  - T3: `src/event-store/maintenance.mjs:36` (the one maintenance door);
  - shutdown callers each with their own root fallback: `src/runner/session.mjs:417`, `src/runner/gateway-control.mjs:359`, `src/runner/loop.mjs:1790`.
- **Authority:** T3 event-store use case: when to open, maintain, seal and hand off. It reads verb facts from the registry (AU-04) and the root from AU-01.
- **Contract:** missing. It should be `eventStoreLifecycle({ verbFacts, phase }) → actions`.
- **Fix:** as T9 P04, plus the three shutdown callers take the root from the AU-01 locator.
- **Takes it:** T9 P04.

### AU-06 — Worktree custody taken by Workflow directly (Medium)

- **Decided today:** T4 custody is taken from T6 in:
  - `src/workflow/case-gate.mjs:18-19,85,106` (`admitSuccessor(createLockScope('unit-custody'))`, `recordCustodyHandoff`);
  - `case-close.mjs:20,190`, `case-runtime.mjs:13,73`, `case-bindings.mjs:17,19,54,149` (`dispatchCwdHolder`, `cwdDevIno`);
  - `unit-handoff.mjs:15,406` (`createLockScope('workflow-worktree')`).

  The authority is `src/run-supervisor/cwd-lock.mjs` (T4).
- **Authority:** T4 run-supervisor custody. Workflow asks "run this under custody" and "is this worktree quiet", and never names the lease.
- **Contract:** proposed in T9 P05: one door to run a command under worktree custody, plus a read-only `custodyHolder(worktree)`.
- **Correction to P05/P11:** `src/workflow/case-lock.mjs:9,28-59` takes Workflow's own `advance` lock on Workflow's own ledger through the T1 holder-lock door. That is a correct downward dependency. An import rule that forbids `src/holder-lock` wholesale would force the advance lock into a run-supervisor door it does not belong to. Forbid `src/run-supervisor/cwd-lock.mjs` and the custody scopes (`unit-custody`, `workflow-worktree`). Allow `createLockScope('advance')`.
- **Fix:** as P05. Size as P05 (0 / 0 / +25), with the narrower rule in P11.
- **Takes it:** T9 P05 and P11.
- **Origin:** `e11c4299f` (2026-10-18).

### AU-07 — Doctor rows that judge another component's state (Medium)

- **Decided today** (T8/T9 doctor deciding for T1, T4 and T5):

  | Row (file:line) | What it judges itself | Owning component and the verb it should call |
  |---|---|---|
  | `identity-shared-directory`, `src/setup/identity-checks.mjs:158-180` | reads the identity crate's private cache file and judges dropped, foreign and renamed entries | T1 identity: `fgos identity directory --json` returns the judgement |
  | `run-attempts-stuck`, `src/setup/run-supervisor-checks.mjs:188-221` | parses `envelope.json` to judge whether adopt can close an attempt (`releaseGoneReason`) and combines it with lock state | T4: the adopt route answers "stuck / not adoptable, why" with `--probe` |
  | `confinement-orphaned-resources-reaped`, `src/setup/registrations.mjs:3045-3120` | decides that a home is orphaned (marker pid liveness) and, under `--fix`, deletes it; the comment calls `--fix` "the one place that judges it" | T5 confinement: `src/runner/dispatch/confinement/cleanup.mjs` owns orphan judgement and removal; doctor calls it |

  The workflow definition rows are a High of their own (AU-21).
- **Authority:** each component, through its own verb or door. Doctor only shows the answer (decision 77: arms are thin adapters).
- **Contract:** packaging P02's doctor result shape on the doctor side. On the component side each needs a verb answer; all three are missing.
- **Fix:** three moves of about 40–100 lines each. The owning test moves into the component's tests, and doctor keeps one wiring proof.
- **Takes it:** T9 P10 (doctor surface), with small T1, T4 and T5 fix phases for the verbs.
- **Origin:** identity `cc5b5d72f` (2026-10-24), run-supervisor `52b1633de` (2026-10-18), confinement `056dac663` (2026-10-18).

### AU-08 — The closed outcome table (Medium)

- **Decided today** (all T5):
  - `VALID_OUTCOMES` five times: `src/runner/execution/loops/{solo:9, reviewed:11, debate:20, panel:11, index:55}.mjs`;
  - `ERROR_OUTCOMES` four times: `debate:29`, `panel:20`, `reviewed:21` (exported, imported by `run.mjs:22`), `history-outcome:11`;
  - `unit-summary.mjs:8,131` validates against the copy in `panel.mjs`;
  - outcomes outside the table: `not-started` (`run.mjs:203-206`), `undetermined` (`unit-summary.mjs:19`), `unknown` (`unit-summary.mjs:139`), `refused` (Workflow `runner.mjs:214`), and `partial-writes` (the exit table only, AU-19).

  A same-named, unrelated set lives in `src/runner/dispatch/confinement/attestation-store.mjs:29` (AU-24).
- **Authority:** one Execution module (for example `src/runner/execution/outcome.mjs`). It holds the closed list, the classes (verdict: `pass`, `findings`; infrastructure: `execution-failure`, `not-started`; provider: `provider-limit`; policy: `policy-refusal`; `blocked`), the predicates (`isVerdict`, `isInfrastructure`, `rebindsOnResume`), and the exit code (AU-19). The Rust `derive_outcome` stays the category authority beneath it.
- **Contract:** COOK `unit-run-result` §5 (proposed).
- **Fix:** COOK order step 2, about −40 Node; the loop tests keep their cases.
- **Takes it:** COOK contract plus T9 P07.
- **Origin:** the loop copies from the seat work; `ERROR_OUTCOMES` in `run.mjs` from `9fa4277c5` (2026-10-25).

### AU-09 — "Reached a verdict" and which results are verdicts, re-derived by Workflow (Medium)

- **Decided today:**
  - T5, the one rule: `src/runner/execution/legacy-seat-read.mjs:19-22` (`isVerdictResult`).
  - T6, which composes it with its own outcome tests:
    - `src/workflow/store.mjs:263` (`reachedVerdict`: `refused`, or verdict seat and `pass`/`findings`);
    - `case-projection.mjs:290-303` (`receiptsFromResults`: verify `pass` gives a verify receipt; a verdict seat with `pass`/`findings` gives a verdict receipt);
    - `case-admission-port.mjs:70-90` (`proposedAchievements`: only `pass`/`findings` produce);
    - `definition.mjs:97` (only `pass`/`findings` may be accepted).
  - The case admission port's `settle(reservationId, result)` takes `result: object` untyped and unversioned (`src/runner/execution/case-admission-port.mjs:34-38`).
- **Disagreement today:** none observed, because both read the same results. The drift risk is direct: a new checker posture or outcome changes Execution's meaning and Workflow's four copies do not follow.
- **Authority:** Execution (section 1).
- **Contract:** COOK `unit-run-result` Unit shape, with additions:
  - `evaluations[]` (`kind`, `seat`, `round`, `passed`);
  - the settle call of the case admission port carries that versioned Unit shape instead of raw `results`.
- **Fix:** Execution emits `evaluations[]` where it settles (`run.mjs:198-221`). `receiptsFromResults` becomes a map from evaluations to receipts. `reachedVerdict` and the three `['pass','findings']` tests go. The receipt test stays in `test/workflow/case-*` and is fed from the contract fixtures. About −30 Node in Workflow, +20 in Execution.
- **Takes it:** COOK contract (add `evaluations[]` and the port settle shape) plus T9 P07 and P09.
- **Origin:** `c8c9335c0` (2026-10-19), `5b2b91044` (2026-10-19).

### AU-10 — Workflow rewrites Execution's outcome after Execution settled the case (High)

- **Decided today:**
  - T5: Execution commits only paths inside the scope and reports the rest in `commit.outOfScope` (`src/runner/execution/run.mjs:628,701-712`). It keeps the outcome `pass`, and settles the case reservation with that outcome in `settleAdmission` (`run.mjs:198-221`, called from the `finally` of the run, `:188`).
  - T6: afterwards the Playbook runner (`src/workflow/runner.mjs:276`) calls `foldUnitOutcome` (`src/workflow/unit-handoff.mjs:343-357`). That function:
    - re-reads Execution's private `unit.json` for the write scope (`:283`);
    - diffs the branch through Git (`outOfScopeWrites`, `:280-292`);
    - rewrites `pass` to `findings` when a path lies outside the scope;
    - rewrites `pass` to `execution-failure` when the check cannot run.
- **Disagreement:**
  1. For a Playbook case, the case ledger's `settle` says `pass` while the workflow ledger's `unit.complete` says `findings` for the same Unit run.
  2. `fgos run --case` (a guide activity) never runs `foldUnitOutcome`. A unit whose branch carries paths outside its scope (a producer's own commit, or one inherited from its base) settles as `pass` and can achieve the activity's milestones (`case-admission-port.mjs:71-90`). The Playbook runner would refuse the same unit.

  One rule, "writing outside the scope is not a pass", is enforced at one of two doors and against one of two ledgers.
- **Authority:** Execution (T5). It makes the commit, knows the recorded scope, and settles. The branch-level check (paths the branch carries since its base, `outOfScopeOnBranch`) belongs beside the existing resume check in `unit-run-start.mjs:51-58`.
- **Contract:** COOK `unit-run-result`. Add `outOfScope[]` and `outOfScopeOnBranch[]` to the Unit shape, and state that `outcome` is final: the scope rule is already applied. The contract's `infrastructure` clause ("no path written outside the declared scope") is only computable in Execution after this move.
- **Fix:**
  - Move `outOfScopeWrites` and the rewrite into Execution before `settleAdmission`, so the case settle and `data.outcome` carry the folded outcome.
  - The Playbook runner keeps only the inherited part from the step it builds on (`unit-handoff.mjs:353`). Better still, Execution receives the base unit's `outOfScopeOnBranch` as an input.
  - `foldUnitOutcome` goes.
  - The owning test moves from `test/workflow/*` to `test/runner/execution/*`. Workflow keeps one wiring proof.

  About +40 Execution, −45 Workflow, tests moved and not grown.
- **Takes it:** COOK contract (fields and "final outcome" rule), then T9 P07 (must include this move: as written, P07 "computes the retry flag where the outcome is settled", which is impossible without it), then P09.
- **Origin:** `6f458389e` (2026-11-08, T6 sub-plan).

### AU-11 — Retryable and rerunnable, classified twice with different lists (Medium)

- **Decided today:**
  - T5: `src/runner/execution/run.mjs:345-361` (`seatStateOf`). A resume binds again every seat whose last attempt has an outcome in `ERROR_OUTCOMES` (`execution-failure`, `policy-refusal`, `provider-limit`, `blocked`).
  - T6: `src/workflow/store.mjs:262-264` (`isRerunnable`). Only `execution-failure` and `not-started`, and only with no out-of-scope path and no seat that reached a verdict.

  These answer two questions (re-bind a seat inside a resumed Unit run, and reopen a failed step's Unit) with two lists of the same vocabulary held in two layers.
- **Authority:** Execution's outcome module (AU-08). It names both predicates, `rebindsOnResume(seatOutcome)` and `infrastructure(unitResult)`. Workflow reads `infrastructure`.
- **Contract:** COOK `unit-run-result` `infrastructure`. Old ledger entries without the field need one legacy reader (decision 1: one read path for old data, for one release). The contract is silent on this, and T9 P09 step 1 would stop on it. Suggested rule: an entry with no `infrastructure` field is read by today's derivation in a legacy module, deleted one release later.
- **Fix:** as T9 P09, after AU-10 (−10 Workflow).
- **Takes it:** COOK (add the old-record rule) plus T9 P07 and P09.
- **Origin:** `9fa4277c5` (2026-10-25), `6f458389e` (2026-11-08).

### AU-12 — Running the verify command and turning its exit into a verdict, twice (Medium)

- **Decided today:**
  - T5: `src/runner/execution/run.mjs:381-394` (`verifyUnit`);
  - T6: `src/workflow/case-gate.mjs:85-131` (`runCaseGate`).

  Both resolve the command through `verifyCommandOf`, run `runCommand` (`src/runner/goal-check.mjs:51`) under custody, and map a timeout or "could not run" to `findings`. So an infrastructure failure of the verify becomes a verdict and is never rerunnable. That contradicts the contract's own `infrastructure` notion. The gate also builds its own `outputDigest` (`:125`).
- **Authority:** Execution: one "run a verify under custody and classify it" door, with an answer of `{ verdict: pass | findings } | { infrastructure: timeout | not-run }`.
- **Contract:** T9 P05's custody door, extended to return a classified result.
- **Fix:** `case-gate.mjs` keeps admission and settle and calls the door. `verifyUnit` calls the same door. About −35 Node.
- **Behaviour change** (owner question): should a verify timeout or a failure to run become `infrastructure`, so `resume` reruns it? Recommendation: yes, it matches decision 71 (4a). Inside the approved frame the move itself is a refactor; only the classification change needs the ask.
- **Takes it:** T9 P05 (extend), with the owner question in the next HARDEN ask.
- **Origin:** `3a36d4790` (2026-11-01).

### AU-13 — Unit-run liveness, settledness, resumability and removal judged by Workflow from Execution's private files (Medium)

- **Decided today** (T6 reading T5's on-disk layout):
  - `src/workflow/unit-handoff.mjs:283` (write scope from `unit.json`);
  - `:478-489` (`canResumeUnitRun` reads `unit.json`);
  - `src/workflow/case-runtime.mjs:73-89`: `reservationDead` reads `unit.json` `execution.status` and `unitControllerHeld`, then `releaseDeadReservations` writes a `not-started` settle itself, which makes it a second writer of a reservation's settle beside Execution's `settleAdmission`;
  - `src/workflow/case-close.mjs:181-211`: `KEEP_REASONS` judge `unit-record-missing`, `controller-held`, `custody-held` and `unsettled`, and prune then deletes the directories under `.fgos/assignments`, which Execution owns.

  Decision 73 (e), plain `fgos run` retention, needs the same judgement for runs that no case names.
- **Authority:** Execution owns a Unit run's lifecycle and record. Workflow owns only "does a case still name this run".
- **Contract:** missing. It should be a Unit-run record port: `unitRunFacts(unitRunId) → { exists, settled, controllerHeld, worktree, writeScope, resumable }` and `removeUnitRun(unitRunId, { unless: 'named' | 'held' | 'unsettled' })`. The dead-reservation release asks `unitRunFacts` and settles through the same `settle` shape as AU-09.
- **Fix:** about +60 Execution, −70 Workflow. The keep-reasons table moves with its test into `test/runner/execution/*`. Workflow's prune test keeps the "whole case goes" rule.
- **Takes it:** a new T5/T6 fix phase after COOK's contract lands. Plain-run retention (decision 73 e) builds on it.
- **Origin:** `c8c9335c0` (2026-10-19), `c9aecc8e5` (2026-11-08).

### AU-14 — Report digests computed by both layers (Medium)

- **Decided today:**
  - T5: settlement records `settleReports[0].sha256`, and the hand-off resolver checks it (`src/runner/execution/handoff-refs.mjs:36-72`, refusing `report-changed-after-settle`).
  - T6: `src/workflow/ref-digests.mjs` re-hashes:
    - `digestUnitRunReports` (`:117-131`, the current bytes with `accept: 'any'`, by design so an approval binds to edited content);
    - `digestContextRefs` (`:22-35`);
    - `digestSubject` (`:84-111`);
    - a third `sha256` helper.
  - `case-gate.mjs:125` hashes gate output.

  The report path is also inferred twice, through `unit-run:` refs and the seat-directory layout.
- **Authority:**
  - Execution for a report's identity, path and settled digest;
  - Workflow for subject and approval digests over artifacts (a Workflow concept), reading report bytes only through an Execution call.
- **Contract:** COOK `unit-run-result` §4 `output.report { path, bytes, sha256 }`. Add a read "report digest now" (`reportDigest(unitRunId, seat)`) so Workflow's approval binding does not walk the run layout.
- **Fix:** move the hashing helper into a T0 leaf (`canonical-json`/`durable-file` side) used by both. `digestUnitRunReports` calls Execution's report read. About −20 Node.
- **Takes it:** COOK contract plus T9 P07. Note that the contract says "the Workflow copy is deleted". Only the report part can go: `digestSubject` and `digestContextRefs` are Workflow's own facts and stay.
- **Origin:** `5b2b91044` (2026-10-19), `02106766d` (2026-10-12).

### AU-15 — Provenance of model, tier and executor written by bind and relabelled by Dispatch (High)

- **Decided today:**
  - T5 bind: `src/runner/execution/bind.mjs:36,433` writes provenance.
  - Then `dispatchBound` (`src/runner/execution/run.mjs:841-847`) hands bind's own choices to Dispatch as `cliOverride`.
  - Dispatch's `effectiveDispatchPolicy` (`src/runner/dispatch/plan.mjs:55-168`) labels them `{ scope: 'cliOverride' }` (`:95,109,117,139-143,168`).
  - `assignment-runner.mjs:342,605,639-644,877,1246` re-reads `cliOverride` for executor, pool, account, model and invocation.
- **Disagreement:** observed. The 2026-11-09 four-seat run recorded `cliOverride` as the source of `model` and `tier` for the `claude` seat, although only `--effort` was passed (COOK contract §4). A reader judging seat independence or a user override from provenance gets a wrong record.
- **Authority:** bind / Seat Binding (T5), the one writer of provenance labels. Dispatch executes a binding and never labels it.
- **Contract:** COOK `unit-run-result` provenance closed list (`cli`, `unit`, `policy`, `default`, `fallback`), carried in `binding` (`contractVersion: v1alpha1` today, AU-23 note on version shapes).
- **Fix:**
  - `dispatchBound` passes `binding: bound` (with its provenance).
  - `effectiveDispatchPolicy` takes a bound input and copies provenance unchanged.
  - `cliOverride` remains only for the `fgos dispatch` path (`dispatch/cli.mjs:433`) or is removed if that path is retired.

  About −30 Node. The owning test is `test/runner/dispatch/plan*` plus one Execution wiring proof.
- **Takes it:** COOK contract plus T9 P06 (run and dispatch arms).
- **Origin:** `1f98d9655` (2026-09-09).

### AU-16 — Provider family: two functions, two answers (Medium)

- **Decided today** (all T5 and T8):
  - `src/runner/dispatch/resolve.mjs:148` `deriveProviderFamily` returns the declared value as is (`openai`).
  - `src/runner/dispatch/provider-adapter.mjs:77` `normalizeProviderFamily` maps `openai`, `openai-codex` and `codex` to `openai-codex`.
  - bind uses the unnormalised one (`bind.mjs:47-51`, `getProviderFamily`, which feeds Seat Binding's independence and peer families, `:105,278,283,368`).
  - Leasing and capacity use the normalised one: `assignment-runner.mjs:606-608`, `provider-capacity.mjs:73`, `llm-accounts.mjs:44-47,146,213`, `provider-account-probe.mjs:59-91`.
  - `executor-governance.mjs:45`, `explain.mjs:67,111`, `setup/model-pool-checks.mjs:33,121` and `setup/registrations.mjs:2155` each pick one of the two.

  With `runner.yaml:86` `providerModel: openai`, bind's family is `openai` and the lease's is `openai-codex`. A project executor that declares `codex` would count as a different family for independence but the same for accounts.
- **Authority:** Seat Binding's launch view (T5): one `familyOf(executor)` that returns the normalised key.
- **Contract:** COOK `binding.family` (new field). It must be this one value.
- **Fix:** one function; the other becomes its caller; every caller listed above moves. About −20 Node.
- **Takes it:** a new T5 fix phase, with COOK's `binding.family`.
- **Origin:** `1de852877` (2026-10-11).

### AU-17 — Run-level overrides folded twice; account-pin behaviour switched by caller identity (Medium)

- **Decided today:**
  - T9: `bin/fgos.mjs:2826-2862` (three copies of "push an unscoped override, fill where unset" for `--effort`, `--timeout`, `--account`).
  - T6: `src/workflow/unit-handoff.mjs:193-226` (`unitOverridesOf`, the same fill rule plus seat-scoped persona entries, marks `origin: 'workflow'`).
  - T5: `src/runner/execution/unit-run-start.mjs:193` changes behaviour by caller: a pin that no seat takes is refused for `fgos run` and silently dropped when `origin === 'workflow'`.

  A lower layer branching on which upper layer called it is the inversion design principle 2 forbids.
- **Authority:** Execution `run-request.mjs` for the rule "a run-level setting becomes overrides". Workflow adds only its seat-scoped persona entries (T9 decision L-3 keeps those apart, rightly).
- **Contract:** the Unit/override input. Replace `origin: 'workflow'` with an explicit field the caller chooses, for example `accountPin: 'strict' | 'where-served'` (decisions 71 3a and 72 already define both behaviours). The Unit input gains its `contract: { id: 'unit', version }` per COOK §6.
- **Fix:** about −25 bin, −10 Workflow, +15 Execution.
- **Takes it:** T9 P06 (run arm, `run-request.mjs`) and P08 (workflow arm). The field name goes into COOK §6.
- **Origin:** `2465e26c8` (2026-11-08).

### AU-18 — Account usability judged three times (Low)

- **Decided today:**
  - T5 Rust: `packages/seat-binding/rust/src/rank.rs:893-916` (from the view built in `bind.mjs:167-200`, `readAccountStates`);
  - T5 Node: `src/runner/execution/account-pin.mjs:44-56` (`assertPinnedAccountsUsable`, from `inspectProviderCapacity(...).healthy`);
  - the lease refuses again at dispatch.

  The two pre-checks use different predicates over the same state. They agree today: a manual quarantine maps to `MAX_SAFE_INTEGER`, `provider-capacity.mjs:600`. The lease refusal is a legitimate time-of-use guard.
- **Authority:** Seat Binding (its refusal), with the lease as the time-of-use guard.
- **Contract:** the existing binding refusal codes.
- **Fix:** `assertPinnedAccountsUsable` reads the seat refusal from the `simulateUnitBindings` result that `unit-run-start.mjs:177` already computes. About −15 Node.
- **Takes it:** a new T5 fix phase.

### AU-19 — Exit codes of Execution outcomes defined in the Work layer (Medium)

- **Decided today:**
  - T7 directory: `src/state/store.mjs:52-95` defines both `EXIT_CODES` (error categories) and `OUTCOME_EXIT_CODES` with `exitCodeForOutcome` (Execution outcomes).
  - The shell reads them at `bin/fgos.mjs:5325-5350`.
  - `bin/fgos-runner.mjs:154` and `src/runner/loop.mjs:1255,1732` read the category map.
  - The Rust host hardcodes `validation = 4` (`apps/fgos/src/main.rs:218`).
  - The mailbox verbs keep their own 0/1/4 (`apps/fgos/src/wiring/mailbox_verbs.rs:267-269`).
  - `partial-writes: 12` has no producer of that outcome: `run.mjs:777,781` produce it as a `fallbackExhausted.reason`, not as an outcome.
  - `not-started`, `undetermined` and `refused` fall to exit 1 unnamed.
- **Authority:**
  - the outcome-to-exit map belongs with Execution's outcome table (AU-08);
  - the error-category map belongs in one kernel leaf shared with the Rust host as a JSON contract.
- **Contract:** missing. It should be an exit-code table `{ categories, outcomes }`, versioned and read by the Node shell and the Rust host.
- **Correction to T9 P01:** P01 moves both maps into a new `src/state/store-error.mjs`, which is still Work's directory, so Execution keeps depending on Work for its own outcome codes. Put `OUTCOME_EXIT_CODES` in the Execution outcome module, and the category map in a `src/cli/` (kernel) leaf.
- **Fix:** about ±0 lines moved; decide whether `partial-writes` stays (and who emits it) or goes.
- **Takes it:** T9 P01 (correct its target), with the outcome half landing with AU-08.
- **Origin:** `242bf705a` (2026-10-15).

### AU-20 — RunResult version 4 is not a free number (Medium)

- **Facts:** `RUN_RESULT_CONTRACT_V4` (`{ id: 'assignment-run-result', version: 4 }`, with provenance `native-v4`) was added in `073c8b6fc` (2026-10-01, "RunResult v4") and deleted in `d40d74ea1` (2026-11-06, T5: "derive a run's outcome once, in Rust"). Between those dates a writer could produce version 4 records. On this machine `.fgos/assignments` holds only versions 2 and 3, but its old runs were pruned. The owner machine and fg-server were not checked. COOK §2 proposes "RunResult version 4, additive", with a reader that "refuses an unknown major version".
- **Risk:** an old v4 record would be read under the new v4 meaning.
- **Authority:** T5 Run Result (Rust `packages/run-result` and Node `src/runner/dispatch/run-result.mjs`).
- **Fix** (pick one, for the owner):
  - (a) number the new shape version 5 (cheapest, nothing to check);
  - (b) keep 4 after a `grep` over every machine's `.fgos/assignments` shows no v4 record.

  Recommendation: (a).
- **Takes it:** COOK contract text.

### AU-21 — Which workflow definition an id names: doctor and runtime use opposite precedence (High)

- **Decided today:**
  - T6 runtime: `src/workflow/loader.mjs:121-136` (`loadWorkflowWithSource`) uses the project's definitions first and falls back to the running payload's (`f16e2e983`, 2026-11-08).
  - T8 setup: `src/setup/workflow-definition-files.mjs:60-79` (`workflowRoots`, `loadWorkflowDefinitions`) puts the package root first and the project second, with "the first definition of an id wins", so the payload wins.
  - The doctor rows pass different "package" roots: `registrations.mjs:582` uses the main checkout root, while `:1875` and `seat-binding-checks.mjs:99` use the payload (`blind-steps-proven-pools.mjs:101` likewise).
- **Disagreement:** when a project defines a workflow id the payload also ships, `fgos workflow start <id>` runs the project's definition, but the dry-bind, pool-coverage, blind-step and capability rows check the payload's. Doctor can pass on a definition that never runs.
- **Authority:** Workflow loader (T6): one `workflowCatalog({ projectRoot })` with one precedence. Domain doctrine is read only from the payload (decision 79 Q4). Whether a project may add workflows is the loader's single answer.
- **Contract:** missing. It should be the catalog answer `{ id → { workflow, source: { root: 'project' | 'payload', path } } }`.
- **Fix:** setup calls the loader's catalog; `workflowRoots` and the setup reader go. About −60 Node. The owning test is `test/workflow/loader*`; doctor keeps one wiring proof.
- **Takes it:** a new T6 fix phase (or T8, since setup is T8; one phase, not both).
- **Origin:** `43db63081` (2026-10-16) for setup; `f16e2e983` (2026-11-08) for the runtime.

### AU-22 — Which domains exist: one walker, six roots (Medium)

- **Decided today:** `src/util/domain-dirs.mjs:10` `listDomainDirs` is the one walker (decision 79 Q7). Its callers each pick the root:
  - `src/runner/dispatch/operation-prompt-templates.mjs:221,290`: payload;
  - `src/setup/skill-wrappers.mjs:405`: project root;
  - `src/setup/registrations.mjs:706,779,1123`: cwd;
  - `src/runner/agent-roster.mjs:47`: cwd;
  - `src/runner/agent-definitions.mjs:41-45`: the project when it has `domains/`, else the install root;
  - `src/workflow/loader.mjs:29`: the caller's root.

  Separately, `src/state/domain-registry.mjs:67-89` (Work) does its own `readdirSync` of `repoRoot/domains/*/compiled.json`.

  Decision 79 Q4 says domain doctrine is read only from the running payload. The cwd- and project-rooted callers contradict that for any project that has a `domains/` directory.
- **Authority:** T8 Domain: one `domainCatalog()` that resolves the payload root (Q4) and returns each domain's directories and compiled registry.
- **Contract:** missing. It should be the domain catalog. `compiled.json` has no version field; give it one.
- **Fix:** callers take the catalog. Each caller's own root goes. About −30 Node. `domain-registry.mjs` is a Work item.
- **Takes it:** a T8 fix phase. Work later for `domain-registry.mjs` (already an item from decision 79 Q7).

### AU-23 — No machine-readable map of layers T0–T9 (Medium)

- **Fact:** `docs/architecture-manifest.json` classes 358 files by hexagonal role (`entry`, `use-case`, `infra`, `domain`, `kernel`) and checks `one-directional-layer` and `domain-siloing`. Nothing records which file belongs to which tier or product layer (Execution, Workflow, Domain). So "Workflow must not decide X" and "Execution must not branch on Workflow" (AU-17) cannot be checked. Each rule is added one at a time (T9 P11 adds one).
- **Versioned blocks use three shapes:** `contract: { id, version }` on RunResult and unit-summary, `contractVersion: 'v1alpha1'` on bind, and none on the Unit input, case ledger, case admission port and domain `compiled.json`.
- **Authority:** the architecture manifest (design principle 2's checker).
- **Contract:** add `tier` per file or directory and one rule "a file of tier N imports only tiers ≤ N, except named ports". Adopt COOK's single `contract: { id, version }` shape for every cross-layer block.
- **Fix:** about +360 manifest lines (one field per row) and one test.
- **Takes it:** T9 P11 (extend from one rule to the tier field).

### AU-24 — Confinement requirement default and attestation outcome naming (Low)

- **Decided today** (T5):
  - `request.requirement?.mode ?? 'unconfined'` in `src/runner/dispatch/confinement/authority.mjs:233,437` and `drivers/bwrap.mjs:283`, while `request.mjs:24,245` validates the mode. A missing requirement is defaulted to the least safe value in three places.
  - `attestation-store.mjs:29` exports `VALID_OUTCOMES` with the same name as the loop outcome table but a different domain.
- **Authority:** `confinement/request.mjs` (the one constructor).
- **Fix:** the constructor always sets the mode; the three fallbacks go; rename to `ATTESTATION_OUTCOMES`. About −5 Node.
- **Takes it:** a T5 fix phase.
- **Origin:** `1ee3cc43f` (2026-09-10).

### AU-25 — "Am I a confined writer" lives in a Workflow module and is called by the `fgos run` arm (Low)

- **Decided today:** `src/workflow/case-admission-port.mjs:123-130` (`confinedWriteRefusal`: dispatch depth plus writability of the case and bindings directories), called by `bin/fgos.mjs:2865-2870` before `fgos run --writes`.
- **Authority:** split. Dispatch depth is Execution's (`currentDispatchDepth`). The two directories are Workflow's. The arm should ask one Execution question and let the port check its own directories at admission.
- **Fix:** move the depth check into Execution's run request; the port keeps its directory check. About ±0.
- **Takes it:** T9 P06.

### AU-26 — Gate-bypass level read by two implementations (Medium, Work later)

- **Decided today:**
  - T7 Node: `src/state/gate-bypass.mjs:58+`;
  - T7 Rust: `packages/work-state/rust/src/lib.rs:89-121`.

  Both keep the legacy `.fgos/gate-bypass.json` fallback that decision 56 Q1 deletes.
- **Authority:** the Rust gate door of decision 55.
- **Takes it:** Work later (decisions 54, 55, 78). No plan here.

### AU-27 — Status and stage vocabularies of Work, Workflow and domains (Medium, Work later)

- **Decided today:**
  - Work statuses: `src/state/work.mjs:99-118` (`STATUSES`, `FINAL_STATUSES`) and the Rust copy `packages/work-state/rust/src/work_source.rs:19-22`.
  - The tail set `delivered/retrospective/cleanup/done`, written three more times: `src/setup/registrations.mjs:1327`, `src/state/frontier.mjs:242`, `src/state/drift-status.mjs:122`.
  - The domain's `statusLabels` and `parkReason` (`domains/coding/registry.yaml:68-80`).
  - Coding stage names hardcoded in platform code: `src/runner/operation-choice.mjs:794,932,952`, `src/state/decision-question.mjs:25`, `src/runner/loop.mjs:1343-1361`.
  - The Workflow fold's own step and unit statuses (`src/workflow/store.mjs`).
- **Authority:** the Work core schema (statuses, categories). Each domain's registry for its stages, read through the domain catalog (AU-22).
- **Takes it:** Work later (decision 78, owner's frame: per-domain flows on one core). Listed for the T7 council baseline.

## 3. Authority map (reference going forward)

| Decision or fact | Single owner (layer, module) | Read by others through |
|---|---|---|
| Process identity, liveness | T0 `packages/process` | addon `native/process-identity.mjs` |
| Durable write, canonical JSON, sha256 of bytes | T0 `durable-file`, `canonical-json` | addon `native/door.mjs` |
| Lock acquire, borrow, kill wait | T1 `packages/holder-lock` | `src/holder-lock` thin client |
| Machine, session and project identity | T1 `packages/identity` | `fgos identity … --json` |
| Repo facts (main root, worktree root, linked) | T2 `packages/git` Inspect | Git port |
| Project root / which `.fgos` store | one Rust project locator (T1/T2, beside identity `main_root`) | addon plus host (AU-01, missing) |
| Active release, activation | packaging `packages/distribution` | activation read (AU-02, missing) |
| Config values and their defaults | T3 `packages/config` (standard plus section schemas) | config facade, `config explain` |
| Event Store open, maintain, seal | T3 `src/event-store` use case | lifecycle use case (AU-05) |
| Worktree custody and quiet | T4 `src/run-supervisor/cwd-lock.mjs` | custody door (T9 P05) |
| Attempt adoptability, stuck | T4 run-supervisor (Rust adopt) | adopt `--probe` answer (AU-07) |
| Run category (infra, verdict, policy, blocked, corrupt) | T5 Rust `run-result::derive_outcome` | addon |
| Seat outcome, unit outcome, outcome classes, exit code of an outcome | T5 one Execution outcome module | `unit-run-result` (COOK) |
| Seat reached a verdict; evaluations (verify, reviewer) | T5 Execution | `unit-run-result.evaluations[]` |
| Wrote outside scope; outcome after scope rule | T5 Execution (commit and settle) | `unit-run-result.outOfScope[]`, final `outcome` |
| Infrastructure / rerunnable | T5 Execution | `unit-run-result.infrastructure` |
| Verify command run and classification | T5 Execution (custody door plus verify) | classified result |
| Executor, model, tier, account choice and provenance | T5 bind / Seat Binding | `binding` (versioned) |
| Provider family | T5 Seat Binding launch view | `binding.family` |
| Account usable now | T5 Seat Binding (plan), lease (time of use) | binding refusal codes |
| Confinement mode and attestation | T5 `confinement/request.mjs`, `authority.mjs` | attestation record |
| Unit-run record, liveness, removability | T5 Execution | Unit-run record port (AU-13, missing) |
| Report path and settled digest | T5 Execution | `unit-run-result.output.report` |
| Step passed, milestone achieved, case closable | T6 Workflow (acceptance over Execution facts) | case and workflow projections |
| Rerun a failed step | T6 Workflow, reading `infrastructure` | — |
| Case admission, frame, budget | T6 Workflow (implements Execution's port) | case admission port (version it) |
| Which workflow definition an id names | T6 Workflow loader | workflow catalog (AU-21) |
| Acceptance rules (`acceptOutcomes`, milestones, delivery) | Domain definitions (data) | Workflow loader |
| Which domains exist, their directories | T8 Domain catalog (payload root) | domain catalog (AU-22) |
| Verb facts (store, mutating, lifecycle) | `COMMAND_REGISTRY` (kernel) | registry entry shape |
| Error category to exit code | kernel exit-code leaf, shared with Rust host | exit-code table (AU-19) |
| Work status, categories, gate-bypass level | T7 Work core (later) | — |

## 4. Missing or implicit contracts

| Between | Contract | State today | Where it should come from |
|---|---|---|---|
| Execution → Workflow and any `fgos run --json` caller | `unit-run-result` Unit shape (plus `outOfScope[]`, `evaluations[]`, old-record rule, final-outcome rule) | proposed (COOK), unimplemented | COOK; T9 P07, P09 |
| Execution ↔ Workflow | case admission port `settle` payload | untyped `result: object`, unversioned (`case-admission-port.mjs:34-38`) | COOK: carry the Unit shape |
| Execution → Workflow | Unit-run record port (facts, removal) | implicit: Workflow reads `unit.json` and the `assignments/` layout | new T5/T6 phase (AU-13) |
| Execution (T4) → Workflow | custody door (run under custody, holder query) | proposed (T9 P05) | T9 P05 |
| Execution → Workflow | verify run and classify | implicit, two copies | T9 P05 extension (AU-12) |
| Caller → Execution | Unit input `contract: { id: 'unit', version }`; override `accountPin` mode | unversioned; behaviour keyed on `origin: 'workflow'` | COOK §6; T9 P06 |
| Seat Binding → Dispatch | `binding` with provenance and `family` | `contractVersion: v1alpha1`; Dispatch relabels | COOK §4; T5 fix |
| Node → Seat Binding (Rust) | account view and launch view | implicit object built in `bind.mjs:167-200` | name and version it in the binding contract |
| Run Result | RunResult next version | version 4 previously used | COOK (AU-20) |
| T1/T2 → everyone | project locator | seven resolvers | T9 P02 (AU-01) |
| Packaging → doctor, host-bin | activation read | file read in four places | T9 P02, P12; packaging P10 |
| T3 → T4, T5 | config section schemas with defaults for `dispatch.*` | `runtime-keys.v1.json` stop-gap plus code defaults | T3/T4 fix |
| T3 → shell | Event Store lifecycle use case | five doors | T9 P04 |
| Components → doctor | each component's verb answer (identity directory, adopt probe, confinement orphans) | doctor reads private files | T9 P10 plus fix phases |
| Workflow → setup | workflow catalog | two readers, opposite precedence | T6/T8 fix (AU-21) |
| Domain → all | domain catalog; `compiled.json` version | six roots, no version | T8 fix (AU-22) |
| Shell ↔ Rust host | exit-code table | Node map in `src/state`, Rust literals | T9 P01 corrected (AU-19) |
| Repository | tier map in `architecture-manifest.json` | absent | T9 P11 extended (AU-23) |

## 5. Hand-off by in-flight work

- **COOK `unit-run-result`:**
  - AU-08 (outcome module);
  - AU-09 (`evaluations[]`, settle shape);
  - AU-10 (scope fields, final outcome);
  - AU-11 (old-record rule);
  - AU-14 (report read);
  - AU-15 (provenance);
  - AU-16 (`binding.family` single value);
  - AU-17 (`accountPin` field in §6);
  - AU-20 (version number).
- **T9 sub-plan:**
  - P01: AU-04, AU-19 (target corrected);
  - P02: AU-01 (scope widened to Rust), AU-02;
  - P04: AU-05;
  - P05: AU-06 (rule narrowed), AU-12;
  - P06: AU-15, AU-17, AU-25;
  - P07: AU-08, AU-09, AU-10 (P07 must include the scope move), AU-14;
  - P08: AU-17;
  - P09: AU-11;
  - P10: AU-07;
  - P11: AU-23;
  - P12: AU-02.
- **Packaging sub-plan:** P10 reads the activation answer of AU-02.
- **New fix phases for closed layers:**
  - T1: kill wait (AU-03), identity directory verb (AU-07);
  - T3/T4: `dispatch` schema defaults (AU-03), adopt probe (AU-07);
  - T5: provider family (AU-16), account usability (AU-18), confinement defaults (AU-24), orphan judgement (AU-07), `maxRounds` (AU-03);
  - T5/T6 after COOK: Unit-run record port (AU-13);
  - T6 (or T8): workflow catalog (AU-21);
  - T8: domain catalog (AU-22).
- **Work later:** AU-26, AU-27, the worker-slot default (AU-03), and `domain-registry.mjs` (AU-22).

## 6. Open questions for the owner

1. **AU-12:** should a verify that times out or cannot run count as an infrastructure failure, so that `resume` reruns it, instead of `findings`? Recommendation: yes. It is decision 71 (4a)'s rule applied to verify.
2. **AU-20:** number the next RunResult version 5, or keep 4 after a record check on every machine? Recommendation: 5.
3. **AU-06:** narrow T9 P11's import rule to custody (`cwd-lock` plus the `unit-custody` and `workflow-worktree` scopes), so `case-lock.mjs` keeps its T1 advance lock? Recommendation: yes.
4. **AU-21:** may a project define its own workflow ids that shadow the payload's (today's runtime), or are workflows payload-only like domain doctrine (decision 79 Q4)? The two doctor and runtime readers become one either way; only the precedence needs the owner.
