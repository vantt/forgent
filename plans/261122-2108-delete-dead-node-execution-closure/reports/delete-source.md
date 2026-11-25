# Delete source report

## Dead set recomputed on this tree

Graph method (phase 1): live roots = every tracked `*.mjs|js|cjs` outside `test/` and outside the three directories; BFS through static/dynamic relative imports and `new URL(..., import.meta.url)`.

| | closure.md (phase 1) | this tree |
|---|---|---|
| Total in three dirs | 89 | 89 |
| Live | 26 | 23 |
| Dead | 63 | **66** |

### Difference from `reports/closure.md`

Three files moved live → dead (no product/mailbox importer remains):

1. `src/runner/dispatch/config.mjs` — `head-start` now loads runner config through `src/native/execution-door.mjs`
2. `src/runner/execution/unit-run-record.mjs` — `head-request` reads unit-run facts through the door
3. `src/runner/execution/unit-summary.mjs` — same

No file moved dead → live. Frozen mailbox harness reach is unchanged (23 live files kept).

## Deleted files (66)

### `src/run-supervisor/` (10)

- `client.mjs`, `cwd-lock.mjs`, `direct-launch.mjs`, `dispatch-error.mjs`, `gate-kill-grace.mjs`, `protocol.mjs`, `run-lock.mjs`, `steps/cleanup-trust.mjs`, `trust-store.mjs`, `worker-artifacts.mjs`

### `src/runner/dispatch/` (36)

- `adapters.mjs`, `agent-result-claim-contract.mjs`, `assignment-layout-twin.mjs`, `assignment-normalizer.mjs`, `assignment-runner.mjs`, `assignment.mjs`, `brief.mjs`, `cli.mjs`, `config-twin.mjs`, `config.mjs`, `confinement/authority-twin.mjs`, `confinement/backend-registry.mjs`, `confinement/bypass-pairing.mjs`, `confinement/policies.mjs`, `confinement/probes/harness.mjs`, `confinement/request.mjs`, `effective-execution-contract.mjs`, `evidence-attribution.mjs`, `execution-contract.mjs`, `executor-governance.mjs`, `herdr-round.mjs`, `mechanism.mjs`, `operation-prompt-templates.mjs`, `plan.mjs`, `resolve.mjs`, `run-admission.mjs`, `run-result.mjs`, `session-attempt.mjs`, `settlement.mjs`, `shipped-catalog.mjs`, `tool-providers.mjs`, `transport.mjs`, `visibility-session.mjs`, `work-item-input.mjs`, `worker-home.mjs`, `write-scope.mjs`

### `src/runner/execution/` (20)

- `account-rotation.mjs`, `custody-door.mjs`, `loops/debate.mjs`, `loops/history-outcome.mjs`, `loops/index.mjs`, `loops/panel.mjs`, `loops/reviewed.mjs`, `loops/role-tasks.mjs`, `loops/solo.mjs`, `loops/verify.mjs`, `patterns/retired-keys.mjs`, `seat-ledger.mjs`, `seat-resolver.mjs`, `unit-control.mjs`, `unit-run-history.mjs`, `unit-run-record.mjs`, `unit-state.mjs`, `unit-summary-twin.mjs`, `unit-summary.mjs`, `unit.mjs`

## Kept live (23)

Mailbox lane re-measure: `runtime-dir.mjs`, confinement driver stack (`bwrap`, `resources`, `cleanup`, `attestation-store`, `workspace-paths`), `llm-accounts`, `provider-adapter`, `provider-capacity`, `provider-credential-probe`, `provider-credential-renewal`, `terminal-slot`, `tier-cell`, `worker-session`, `worker-session-boot`.

S6b: `run-timeout.mjs`, `runner-config-error.mjs`, `legacy-seat-read.mjs`, `outcome.mjs`.

S7 / session-host tail: `cancel-registry.mjs`, `assignment-layout.mjs`, `confinement/authority.mjs`, `provider-capacity.mjs` (also mailbox), `bind.mjs`.

## Manifest / model rows changed

### Plan 261124-0004 special rows (only deleted-file entries removed)

- `doors/execution-s-node-seam.yaml` — dropped `session-attempt.mjs`, `config.mjs`, `unit-run-record.mjs`, `unit-summary.mjs`; kept live facades; `runner-config-error.mjs` reason → S6b; `retiredBy` no longer names the dead-closure backlog id.
- `doors/the-node-bind-facade-has-only-its-named-callers.yaml` — dropped `plan.mjs`, `assignment-runner.mjs`, `account-rotation.mjs`; kept S7/S6b/doctor callers.
- `doors/node-callers-reach-execution-only-through-its-seam-never-into-the-node-execution-closure.yaml` — mailbox/S6b/S7 reasons; dropped stale `src/runner/execution/**` glob (no remaining match).

### Other door / model clean-up (deleted paths only)

- `decide-a-dispatch.yaml`, `tool-lookup-by-capability.yaml` — Node twin debt cleared; jobs stay with Rust owners.
- `derive-executor-facts.yaml` — dead twins removed; live mailbox/S7 twins kept; `retiredBy` → mailbox lane / S7 / own retire steps.
- `list-run-directories.yaml` — dropped Node listers; Rust twin debt kept.
- `process-facts-proc.yaml` — dropped `probes/harness.mjs`; mailbox debt kept.
- `agent-hook-table.yaml`, `canonical-json-bytes.yaml`, `choose-an-executor-…yaml`, `locate-and-read-a-project-config-file.yaml`, `global-fgos-directory.yaml`, `footprint-write-scope-overlap-rule.yaml`, `record-a-malformed-call.yaml` — deleted-path entries/notes cleaned; dual-language footprint row keeps `retiredBy`.
- `components.yaml` — removed empty `src/run-supervisor/steps/` and deleted `write-scope.mjs` exceptions; `collaboration-patterns` paths cleared and `status: retired`.
- `test/architecture.test.mjs` — `NAMED_DOOR_DEBT` drops decide/tool-lookup/footprint; seeded cases and R8/pattern guards updated for deleted modules; A4 domain-literal scan stages the checkout addon when no activated release is present.
- No `p-24xw2cwdvo` remains under `packages/component-authority/model/` or `test/architecture.test.mjs`.

### Contract notes

- `packages/holder-lock/contracts/lock-registry.v1.json` — notes for reconcile / trust-store / live twins rewritten (Rust owner or “v1 source (retired Node module …)”; live mailbox twins still named).
- `packages/run-supervisor/contracts/recover-actions.v1.json` — description names Rust `adopt.rs`; retired Node recovery-planner noted as v1 source.

### Census

- `node scripts/git-one-door-scan.mjs --write-census` regenerated `packages/git/contracts/mutation-census.v1.json`.
- Decision-citation baseline had no keys for deleted paths; not regenerated.

## Verify

| Command | Result |
|---|---|
| `timeout 600 node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs` (with `FGOS_HOST_BIN` = staged checkout host) | **96 pass / 0 fail** |
| Live import dangle check over remaining three-dir files | **0 dangling imports** |
| `git grep p-24xw2cwdvo -- packages/component-authority/model test/architecture.test.mjs` | **empty** |

`npm test` full suite not run here (phase brief: run alone after this pair); lead owns that outside this unit.
