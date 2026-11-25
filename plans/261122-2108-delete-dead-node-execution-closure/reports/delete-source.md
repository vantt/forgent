# Delete source report

## Dead set recomputed on this tree

Graph method (phase 1): live roots = every tracked `*.mjs|js|cjs` outside `test/` and outside the three directories; BFS through static/dynamic relative imports and `new URL(..., import.meta.url)`.

| | closure.md (phase 1) | this tree |
|---|---|---|
| Total in three dirs | 89 | 89 |
| Live | 26 | 23 |
| Dead | 63 | **65** (+ `write-scope.mjs` kept for later retire, not counted dead-deleted) |

### Difference from `reports/closure.md`

Three files moved live → dead (no product/mailbox importer remains):

1. `src/runner/dispatch/config.mjs` — `head-start` now loads runner config through `src/native/execution-door.mjs`
2. `src/runner/execution/unit-run-record.mjs` — `head-request` reads unit-run facts through the door
3. `src/runner/execution/unit-summary.mjs` — same

No file moved dead → live. Frozen mailbox harness reach is unchanged (23 live files kept).

`src/runner/dispatch/write-scope.mjs` stays on tree for phase 11 (parity tests and door debt still pin it); it is not in the deleted set.

## Deleted files (65)

### `src/run-supervisor/` (10)

- `client.mjs`, `cwd-lock.mjs`, `direct-launch.mjs`, `dispatch-error.mjs`, `gate-kill-grace.mjs`, `protocol.mjs`, `run-lock.mjs`, `steps/cleanup-trust.mjs`, `trust-store.mjs`, `worker-artifacts.mjs`

### `src/runner/dispatch/` (35)

- `adapters.mjs`, `agent-result-claim-contract.mjs`, `assignment-layout-twin.mjs`, `assignment-normalizer.mjs`, `assignment-runner.mjs`, `assignment.mjs`, `brief.mjs`, `cli.mjs`, `config-twin.mjs`, `config.mjs`, `confinement/authority-twin.mjs`, `confinement/backend-registry.mjs`, `confinement/bypass-pairing.mjs`, `confinement/policies.mjs`, `confinement/probes/harness.mjs`, `confinement/request.mjs`, `effective-execution-contract.mjs`, `evidence-attribution.mjs`, `execution-contract.mjs`, `executor-governance.mjs`, `herdr-round.mjs`, `mechanism.mjs`, `operation-prompt-templates.mjs`, `plan.mjs`, `resolve.mjs`, `run-admission.mjs`, `run-result.mjs`, `session-attempt.mjs`, `settlement.mjs`, `shipped-catalog.mjs`, `tool-providers.mjs`, `transport.mjs`, `visibility-session.mjs`, `work-item-input.mjs`, `worker-home.mjs`

### `src/runner/execution/` (20)

- `account-rotation.mjs`, `custody-door.mjs`, `loops/debate.mjs`, `loops/history-outcome.mjs`, `loops/index.mjs`, `loops/panel.mjs`, `loops/reviewed.mjs`, `loops/role-tasks.mjs`, `loops/solo.mjs`, `loops/verify.mjs`, `patterns/retired-keys.mjs`, `seat-ledger.mjs`, `seat-resolver.mjs`, `unit-control.mjs`, `unit-run-history.mjs`, `unit-run-record.mjs`, `unit-state.mjs`, `unit-summary-twin.mjs`, `unit-summary.mjs`, `unit.mjs`

## Kept live (23) + write-scope (phase 11)

Mailbox lane re-measure: `runtime-dir.mjs`, confinement driver stack (`bwrap`, `resources`, `cleanup`, `attestation-store`, `workspace-paths`), `llm-accounts`, `provider-adapter`, `provider-capacity`, `provider-credential-probe`, `provider-credential-renewal`, `terminal-slot`, `tier-cell`, `worker-session`, `worker-session-boot`.

S6b: `run-timeout.mjs`, `runner-config-error.mjs`, `legacy-seat-read.mjs`, `outcome.mjs`.

S7 / session-host tail: `cancel-registry.mjs`, `assignment-layout.mjs`, `confinement/authority.mjs`, `provider-capacity.mjs` (also mailbox), `bind.mjs`.

Kept for phase 11 (not deleted here): `src/runner/dispatch/write-scope.mjs` — still debt on the footprint/write-scope overlap door; `test/runner/write-scope.test.mjs` and `test/git/write-scope-parity.test.mjs` still read it.

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
- `agent-hook-table.yaml`, `canonical-json-bytes.yaml`, `choose-an-executor-…yaml`, `locate-and-read-a-project-config-file.yaml`, `global-fgos-directory.yaml`, `record-a-malformed-call.yaml` — deleted-path entries/notes cleaned.
- `footprint-write-scope-overlap-rule.yaml` — keeps the `src/runner/dispatch/write-scope.mjs` debt entry and phase-11 `retiredBy` (restored; phase 11 retires it).
- `components.yaml` — removed empty `src/run-supervisor/steps/` exception; kept `write-scope.mjs` kernel exception; `collaboration-patterns` paths cleared and `status: retired`.
- `test/architecture.test.mjs` — `NAMED_DOOR_DEBT` drops decide/tool-lookup; keeps `the footprint and write-scope overlap rule`; seeded cases and R8/pattern guards updated for deleted modules; A4 domain-literal scan stays sync (no test-only addon staging).
- No `p-24xw2cwdvo` remains under `packages/component-authority/model/` or `test/architecture.test.mjs`.

### Contract notes

- `packages/holder-lock/contracts/lock-registry.v1.json` — notes for reconcile / trust-store / live twins rewritten (Rust owner or “v1 source (retired Node module …)”; live mailbox twins still named).
- `packages/run-supervisor/contracts/recover-actions.v1.json` — description names Rust `adopt.rs`; retired Node recovery-planner noted as v1 source.

### Census

- `packages/git/contracts/mutation-census.v1.json` lists `src/runner/dispatch/write-scope.mjs` again (digest `03d78f9de5475f92177906c29c7aba66c339550f8171ed216a2dfe9df143bf06`). Full `node scripts/git-one-door-scan.mjs --write-census` could not finish in this confined sandbox (`git-floor-probe-failed: git-driver-io: Read-only file system`); the write-scope file row and payloadDigest were restored against the on-disk file bytes. Decision-citation baseline had no keys for deleted paths; not regenerated.

## Verify

| Command | Result |
|---|---|
| `timeout 600 node --test test/runner/write-scope.test.mjs test/git/write-scope-parity.test.mjs test/setup/git-mutation-census.test.mjs` | **pass** |
| `timeout 600 node --test test/architecture.test.mjs` (no host) | **fail at load**: `host-unavailable` in confined sandbox; not worked around |
| same suite with existing `FGOS_HOST_BIN=$PWD/target/debug/fgos` only (no addon staging) | **150 pass / 1 fail**: A4 domain-literal scan hits `git-addon-unavailable` / `git-addon-not-shipped` via `parseYaml`. Test left sync as on main; no `ensureGitAddon` workaround. |
| Live import dangle check over remaining three-dir files | **0 dangling imports** |
| `git grep p-24xw2cwdvo -- packages/component-authority/model test/architecture.test.mjs` | **empty** |

`npm test` full suite not run here (phase brief: run alone after this pair); lead owns that outside this unit.
