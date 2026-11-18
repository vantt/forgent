# S6a planning scan: facts and design calls

Read on `0981437d2` (2026-11-18, worktree of the planner). Every number below is re-read by phase 00 after S5
phases 11 and 12 land; this report is the planner's evidence, not the census of record.

## 1. Size

| Path | Files | Lines |
|---|---|---|
| `src/runner/execution/**` | 36 | 6 980 |
| `src/runner/dispatch/**` | 59 | 23 380 |
| `src/run-supervisor/**` | 19 | 2 698 |
| `src/verbs/worktree/**` | 3 | 82 |
| `src/verbs/dispatch/**` | 5 | 817 |
| `src/runner/worktree.mjs` | 1 | 1 437 (lifecycle part is S6a's, D5) |
| Node tests: `test/runner/execution` 43 files 12 748 lines; `test/run-supervisor` 21 files 3 749; `test/runner/{dispatch,assignment,confinement,provider,herdr,run-result,...}*.test.mjs` about 31 700 | | |

## 2. Node importers above tier 5 (the seam)

`rg -n "from ['\"][./]*.*(runner/execution|runner/dispatch|run-supervisor|verbs/worktree|verbs/dispatch)/" src bin scripts --glob '*.mjs'`
minus hits inside those directories: 53 files. Groups:

- Workflow (S6b, 27 files under `src/workflow/`): `runUnit` (`src/workflow/runner.mjs:37,177,189`) with an in-memory
  case-admission port (`runner.mjs:77`, `src/workflow/case-admission-port.mjs:246`); `runUnderCustody`, `runVerify`
  (`case-gate.mjs:17`); pure helpers (`validateUnit`, `canonicalizeWrites`, `globsMeet`, `writeScopesOverlap`,
  `runDirOf`/`runsRoot`/`isCaseId`, `isVerdict`, `NOT_STARTED_OUTCOME`, `loopOf`, `resolveCollaboration`, seat-resolver
  checks, `seatKeyOf`, handoff refs, `RunnerConfigError`, `loadRunnerConfigForDir`, `currentDispatchDepth`).
- Work (S7): `src/runner/loop.mjs:104` `sweepAttempts`; `src/runner/work-dispatch.mjs:21` `DispatchError`;
  `src/verbs/state/read.mjs:5` visibility-session readers; `bin/fgos-runner.mjs:25` `loadRunnerConfigForDir`.
- Surface: `bin/fgos.mjs:51-91` (config loader, cancel opt-in, five dispatch sub use cases); `src/cli/verb-exit.mjs:4`;
  `src/portfolio/open-questions.mjs:9`; `src/report/capability-plan-lint.mjs:5-8`.
- Setup (doctor rows): `src/setup/{registrations,run-supervisor-checks,model-pool-checks,executor-profile-warnings,
  session-keep-declared,agent-cli-trust,terminal-control-checks,seat-binding-checks,blind-steps-proven-pools}.mjs`.
- Lower layers: `src/native/door.mjs:7`, `src/event-store/consumers.mjs:5`, `src/seat-binding/client.mjs:21` (all
  `payload-root.mjs`); `src/session-rotation/rotate.mjs:27` `requestCancel`.
- Scripts: `scripts/run-tests.mjs:31`, `scripts/lib/test-file-watchdog.mjs:28`, `scripts/run-rust-dev-host.mjs:9`
  (`stop-processes-inside.mjs`); `scripts/lib/mailbox-live-confined.mjs:36-38` (bwrap, resources, credential expiry);
  `scripts/backfill-unit-summaries.mjs:13-16`.

## 3. Checkout lifecycle (D5)

`src/runner/worktree.mjs`: provisioning `115-402` (`provisionDependencies:115`, `runWorktreeSetupCommands:147`,
`provisionSkillRoots:185`, `provisioningStateRoot:219`, `provisionWorktree:268`, `removeProvisioned:370`); orphan
reclaim `607-782`; create `812-997` (`createWorktree:852`); resync `998-1212`; `createClaimWorktree:1213`,
`createVerifyCheckout:1330`, `createDispatchWorktree:1366`, `removeDispatchWorktree:1371`, `removeWorktree:1392`,
`listLeftovers:1429`. All synchronous (`export function`), so a synchronous addon call keeps their contract.

Callers outside the file: `createWorktree` (`src/runner/loop.mjs`, `scripts/project-agents.mjs`, `bin/fgos.mjs`),
`createClaimWorktree` (`src/runner/claim-port.mjs`), `createDispatchWorktree`/`removeDispatchWorktree` (`loop.mjs`),
`createVerifyCheckout` (`merge.mjs`, `scripts/test-select-mutate.mjs`, `bin/fgos.mjs`), `removeWorktree`
(`src/workflow/unit-handoff.mjs`, `merge.mjs`, `loop.mjs`, `scripts/test-select-mutate.mjs`, `bin/fgos.mjs`),
`provisionWorktree` (`src/verbs/worktree/create.mjs:14`), `removeProvisioned` (`src/verbs/worktree/remove.mjs`),
`provisionDependencies`/`runWorktreeSetupCommands` (`merge.mjs`), `resyncWorktree` (`bin/fgos.mjs:3540`),
`listLeftovers` (`loop.mjs`, `src/runner/dispatch/provider-credential-renewal.mjs`), `reclaimOrphanedCheckout`
(`merge.mjs`, `bin/fgos.mjs`).

Rust Git port: `packages/git/rust/src/worktree.rs` `create_worktree:689`, `create_detached_worktree:705`,
`remove_worktree:983`, `relocate_worktree:1173`, `inspect_worktree_orphans:1315`, `prune_worktree:1522`,
`repair_worktree_registration:1642`.

Git spec rules (`docs/platform/git/spec.md`): `:81` Git never imports a consumer, spawns only `git`, Execution
provisions after create outside every Git lock; `:122` port row; `:177` the verb and its argv; `:551` provisioning
record and set-aside on remove; `:553` `--discard-ignored`; G-032, G-033, G-100, G-195 (overrides).

Verb argv today (`src/cli/command-registry.mjs:125`): `fgos worktree create <path> [--branch <name> | --detach]
[--base <ref>] | fgos worktree remove <path> --delivered-to <ref> [--discard-ignored]`; `resync-worktree`
(`:2557`) with `--dir`, `--path`, `--branch` (`bin/fgos.mjs:3537-3540`). Routes: `worktree`, `resync-worktree`,
`run`, `dispatch` are `legacy-cli` (`packages/host-runtime/contracts/command-routes.json`); `dispatch.native_subcommands`
= `decide`, `explain`.

## 4. payload-root

`src/run-supervisor/payload-root.mjs` (52 lines, tier 0 in `docs/architecture-manifest.json:55`). Importers:
`src/native/door.mjs`, `src/event-store/consumers.mjs`, `src/seat-binding/client.mjs`, `src/workflow/loader.mjs`,
`src/run-supervisor/{direct-launch,attempt-step}.mjs`, `src/runner/execution/unit-run-record.mjs`. Lowest shared
layer: tier 0 `src/util/` (beside `src/util/host-bin-path.mjs`, which resolves the activated host the same way).
`OWN_PAYLOAD_ROOT` is `../..` from the file, unchanged at `src/util/`. No prior move (`git log --follow`: first in
`8339c7259`, trimmed in `ad929af93`).

## 5. Doctor rows

`packages/distribution/contracts/doctor-registry.v1.json`: 30 rows `owner: bridge:S6a` (4 also in `fixes`).
`seat-binding-route` is `bridge:S5` today; S5 D15 makes it `bridge:S6a` at S5 phase 11.

- Confinement (9): `confinement-policies-declared`, `confinement-backend-registry-readable`,
  `confinement-orphaned-resources-reaped`, `credential-copies-retained`, `confinement-bwrap-platform`,
  `confinement-probe-freshness`, `confinement-blind-read`, `confinement-strict-readiness`, `confinement-herdr-maturity`.
- Executor and accounts (12): `executor-family-unique`, `executor-skills-installed`, `tier-fallback`,
  `model-policy-pools`, `llm-accounts-shape`, `agent-type-names-unique`, `provider-capacity-state`,
  `executor-profile-warnings`, `session-keep-declared`, `confined-pane-accounts`, `operation-prompt-templates-valid`,
  `herdr-executor-kinds`.
- Run supervisor, trust, terminal (9): `run-supervisor-route`, `runtime-socket-dir`, `run-attempts-stuck`,
  `run-supervisor-config`, `terminal-control`, `terminal-allocations`, `trust-store-readable`,
  `non-claude-trust-stores-readable`, `agent-cli-project-trusted`.

Parity runner: `test/rust-host/verb-parity.test.mjs` is on the tree (S5 restored it); the doctor table was deleted in
`9772db47d` (restore `9772db47d^:test/rust-host/parity-cases/doctor.cases.mjs`); S5 kept its tables off main
(`0c9153b98`). If S5's close deletes the runner, restore it from that commit's parent.

## 6. Doors rows naming S6a (`docs/architecture-manifest.json`)

| Row | retiredBy today | How S6a closes it |
|---|---|---|
| person's agent config writes | S5 and S6a: agy sub-HOME and agent CLI trust rows leave Node | `agent-cli-project-trusted`, `trust-store-readable`, `non-claude-trust-stores-readable` move (phase 17); debt removed |
| per-session checkout registry | S6a: module moves into the Execution crate if one exists then | D1 gave `session.rs` and `sessions.json` to plan 0947: the row is deleted by 0947 phase 3 if landed first, else phase 22 rewrites `retiredBy` to plan 0947 |
| agent definition tier directories | S6a: `agent-type-names-unique` moves to Rust, Node listing deleted | phase 17 |
| packaging doctor judgments | S6a: confinement rows call the Rust smoke test | phase 15 removes the `checkBwrapAvailable` debt |
| S5 twins (D7, rows added by S5 phase 12) | S6a | phases 13-21 delete the twins; phase 22 closes the rows |

Other rows with tier-5 debt: "resolve the invocation root" debt `src/runner/worktree.mjs` (stays: helper part is S7);
"global fgOS directory" debt `llm-accounts.mjs`, `confinement/probes/harness.mjs` (go with their modules); "process
facts: read /proc" retiredBy run-supervisor and confinement probes moving to Rust; "list run directories (twin)"
retiredBy "the runner's layouts move to Rust"; "run a bounded child" debt run-supervisor Rust files.

## 7. Prior art

- `fgos worktree` verb: `902c97d58` (resync-worktree, tsk-1d7); Git spec `:177` (2026-10-18 owner Q2); session
  checkout door `37f76c49c`, `1410ac770`.
- No earlier Rust provisioning (`git log -S'provision_worktree'`: none; `-S'worktreeSetup' -- apps packages`: config
  schema only) and no Rust unit runner (`-S'fn run_unit'`: none).
- S5 pattern reused: integration branch, phase-lead rules, parity tables off main, D2 host route `fgos internal
  seat-binding --protocol 2` for Node callers, D7 declared twins with `retiredBy`.

## 8. Design calls (counsel taken from kongming, decided by the planner)

- Checkout engine: new crate `fgos-checkout` at `packages/execution/checkout` (Execution-owned, layer 2 like
  `src/runner/worktree.mjs` today): depends on `fgos-git`, `fgos-process`, `fgos-config`, `fgos-durable-file`; linked
  by the host and the addon. Not `fgos-git` (spec `:81`, G-032); not `fgos-execution` (S5 D1 keeps it pure, and the
  addon must link checkout without linking the run engine).
- Run engine: new crate `fgos-execution-engine` at `packages/execution/engine` for effectful loops and adapters;
  `fgos-execution` stays pure (units, patterns, outcome, settlement math, port traits); `fgos-run-supervisor` keeps
  the per-attempt layer and gains the Node controller half. The addon never links the engine.
- Node seam: long operations through the host (`fgos run --unit <file> --json` with a case-admission peer on a
  dedicated fd, JSON lines; `fgos internal execution <op> --protocol 1` for custody, verify, sweep, cancel); pure
  helpers the engine needs go through an addon `execution` namespace over `fgos-execution`; helpers only Node
  callers use move (`git mv`) into their one consuming layer, a single copy, ported by S6b/S7.
- Case admission port: four operations (`resolveBinding`, `admit`, `recheckEffect`, `settle`;
  `src/runner/execution/case-admission-port.mjs:6-13`), one mid-run; the workflow holds `advance` in process
  (`runner.mjs:77`). A Rust twin over the ledger would fight its parent for the lock and duplicate Workflow's
  authority (component-boundary row "Workflow": "imports flow Workflow -> Execution Core only"); pre-reserve and
  post-settle cannot serve `recheckEffect`. So: peer protocol, retired by S6b.
