# Phase 11: the Node-twin debt the deletion left

Phase 11 landed on main as `26cc65790` (land ticket `c-29917-1795615440729`). The land gates passed (the gate
test set plus `capability-config`, `packaged-definitions` and `domain-registry-compiled`, `cargo fmt --all --check`,
the git one-door scan, the command-selector check and the plan contract check). Branch commits: `c3374bde7`,
`2f19ab930`, `891e5c1be`, `22f25feb9`, `0a298260e`, `34d96866e`, `bb24f671f`, `3e109cadf`.

## Door rows

| Row | What was removed | What stays, and who retires it |
|---|---|---|
| `decide a dispatch` | Nothing; phase 8 had already emptied it | Nothing |
| `tool lookup by capability` | Nothing; phase 8 had already emptied it | Nothing |
| `the footprint and write-scope overlap rule` | `src/runner/dispatch/write-scope.mjs` (last at `74b608ad8`), `test/runner/write-scope.test.mjs` (`cb0469244`), `test/git/write-scope-parity.test.mjs` (`9e166f430`); the row left `NAMED_DOOR_DEBT` | No twin. `retiredBy` names S7 for the Node callers in `allowed` |
| `derive executor facts` | `src/runner/agent-listing.mjs` (`55029e981`) with its test, `scripts/agents-vectors.mjs`, `test/helpers/agents-vectors.helper.mjs`; `capabilityConfinementOf` of `src/runner/capability-config.mjs` | `provider-adapter.mjs`, `provider-capacity.mjs`, `llm-accounts.mjs` are live (frozen mailbox harness, session-head start). The row stays on `NAMED_DOOR_DEBT`; `retiredBy` names the mailbox lane re-measure and S7. Acceptance criterion 7 was corrected to say so |
| `list run directories (twin)` | The Node-only `openAttempts` rows of `test/rust-host/fixtures/run-dirs-vectors.json`, and `test/helpers/run-dirs-fixture.mjs` (no importer left) | `packages/run-result/rust/src/lib.rs` and `packages/run-supervisor/rust/src/controller/adopt_scan.rs`; `retiredBy` names backlog row `p-uojivokdqy` |
| `global fgOS directory` | Nothing | `llm-accounts.mjs` (mailbox lane, S7); `holder-lock/rust/src/state_root.rs` (`p-n22bigucgp`) |

## Test ownership

- `test/runner/write-scope.test.mjs` and the parity test: their cases live in `packages/write-scope/src/lib.rs`
  (eight new golden tests, plus the `a/../b` refusal). The addon's `collidingPairs` wiring is owned by
  `test/state/graph-adapter.test.mjs`. An independent review checked the mapping case by case.
- `test/runner/agent-listing.test.mjs`: `packages/execution/rust/tests/golden_agents.rs` over `agents.v1.json`.
- Release-tier judgement in `test/setup/packaged-definitions.test.mjs`: now asserted through `fgos agents list --json`.
- `capabilityConfinementOf`: the executor-model vectors replayed on `executor_model.rs`.

## Also fixed on the branch

- Docs naming the deleted files got the provenance pin, link syntax only, under the owner answer to `q-5roz2uy3sa`
  (runner subcomponent specs, `git/spec.md`, `document-identity/spec.md`; the supervisor widened the footprint).
- `test/state/domain-registry-compiled.test.mjs`: its copy list is again the real import closure of
  `domain-registry.mjs` (`src/native/door.mjs`, `src/util/payload-root.mjs`, `src/util/host-bin-path.mjs` added).
- The authority views (`component-boundary.md`, `README.md`, `architecture-map.md`) were regenerated with
  `fgos authority render`; they had been stale since phase 8, which broke `apps/fgos/tests/authority.rs`. That test is now 6 of 6.

## Left open

- `test/suite-baseline.json` was edited by hand, not measured; phase 10 measures it.
- Outside the footprint, not blocking: a comment naming `listAgents` at `src/setup/registrations.mjs:572`, and a
  now-redundant `node_lister_rows` override in `apps/fgos/src/wiring/run_dirs.rs`.
- Tooling: `fgos run` cuts its commit subjects at about 100 characters and writes no body; and a unit's commit skips
  a path that was already dirty when the unit started.
