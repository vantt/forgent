# Phase 01: Rust gate crate, level reader and native `gate-check`

Owner decision 55 (3a): this is the first phase. It is a language move with no policy change, so it can be proven against the existing cases. Drop A; it may land alone.

## Context

- Two readers of the bypass level exist: Node `readGateBypassLevel` (`src/state/gate-bypass.mjs:58-93`) and Rust `read_gate_bypass_level` (`packages/work-state/rust/src/lib.rs:66-114`). `fgos gate-bypass` is native (`packages/host-runtime/contracts/command-routes.json:410-423`); `fgos gate-check` is `legacy-node` (`:424-432`), served by `gateCheckUseCase` (`src/verbs/state/read.mjs:28-41`), the only production caller of `canAutoApprove` and `canAutoApproveMergedGate` (`src/state/gate-bypass.mjs:159,255`).
- `bin/fgos.mjs:2261-2263` (`case 'gate-bypass'`) is a dead twin: the host never routes the verb to Node.
- The only importers of `src/state/gate-bypass.mjs` are `bin/fgos.mjs:53` and `src/verbs/state/read.mjs:3` (checked with `rg`), so the whole file goes.
- Why move the keyword floor to Rust when phase 04 deletes it: a pure move keeps the existing 479-line case set as the proof. Mixing the move with the policy change would leave neither provable. Cost: about 50 Rust lines that phase 04 deletes.

## Requirements

1. New crate `packages/gate/rust` (`fgos-gate`), a workspace member, below Work and Workflow, above Config and Identity. It depends on `fgos-config` and `fgos-host-runtime` only.
2. `level(root)`: the moved `read_gate_bypass_level`, unchanged behaviour (fail closed to `off`; legacy file per Q1: dropped if Q1(a), kept if Q1(b)).
3. `decide_v0(subject, level)`: the moved `canAutoApprove` and `canAutoApproveMergedGate` as one function over one subject (kind `context` or `plan`; haystack per kind exactly as today, `src/state/gate-bypass.mjs:144-263`; open-items check `:132`; `costVerdict` monotone toward asking). Output `{decision: auto|ask, reasons[]}`.
4. Native routes: `gate-bypass` -> operation `gate.level.show`; `gate-check` -> operation `gate.check`, same flags (`--gate`, `--artifact`, `--plan`, `--children`, `--cost`, `--json`), same envelope field `data.canAutoApprove` plus `data.decision` and `data.reasons`. The work item is read through the existing Rust reader of the Work view, `WorkSource::read_state_json` (`packages/work-state/rust/src/work_source.rs:88`), never through Node. That cache is written before the Work gate is released on every Work append (`docs/platform/event-store/spec.md:335`), so it holds the item's own last write; an item missing from it is refused by name (`work-item-unknown`), as `gateCheckUseCase` refuses today.
5. Delete every Node path in the same change (L10).

## Files

- **Create:** `packages/gate/rust/Cargo.toml`, `packages/gate/rust/src/lib.rs`, `src/level.rs`, `src/decide.rs`, `src/provider.rs` (two providers); `packages/gate/rust/tests/decide.rs`, `tests/level.rs`; `packages/gate/contracts/` request/outcome contracts for `gate.level.show` and `gate.check`; `docs/platform/gate/spec.md` sections 1-3 (purpose, authority, ports) before code (L5 question 2).
- **Modify:** root `Cargo.toml` (member); `apps/fgos/Cargo.toml`, `apps/fgos/src/main.rs`, `apps/fgos/src/cli_projector.rs:27-28,725-733` and `apps/fgos/src/cli_presenter.rs` (wire the two operations); `packages/host-runtime/rust/src/catalog.rs:30-33,207`; `packages/host-runtime/contracts/command-routes.json:410-432`; `apps/fgos-gateway/src/remote_invocation.rs:251`; `packages/work-state/rust/src/lib.rs` (remove the reader and provider), `packages/work-state/rust/Cargo.toml`; `src/cli/command-registry.mjs:988-992,1195-1213` (descriptions: stale ".fgos/gate-bypass.json" text at `:990` corrected); `docs/architecture-manifest.json:109` (drop the file entry); `test/rust-host/command-routes.test.mjs:79-84,332-362`; `apps/fgos/tests/cli_tests.rs:324-415` (operation id).
- **Delete:** `src/state/gate-bypass.mjs` (whole file); `gateCheckUseCase` and its import in `src/verbs/state/read.mjs:3,28-41`; `bin/fgos.mjs:53` import, `:2257-2275` comments and `case 'gate-bypass'`, `:2379-2394` `case 'gate-check'` and the `gateCheckUseCase` import at `:103`.

## Tests to retire, and the test that now owns the behaviour

| Retired | Now owned by |
|---|---|
| `test/state/gate-bypass.test.mjs` (whole file, 479 lines): level read, size coverage, open items, keyword floor, merged-gate haystack, cost axis | `packages/gate/rust/tests/decide.rs` and `tests/level.rs`; one Rust test per behaviour, cases carried over as table rows, not copied per assertion |
| Rust tests in `packages/work-state/rust/src/lib.rs` (`test_gate_bypass_level_fails_closed`, `..._falls_back_to_the_legacy_file...`, `test_descriptor_matches_catalog`, `test_provider_invoke_completed`) | moved to `packages/gate/rust/tests/level.rs` and the gate provider test |
| none else | `apps/fgos/tests/cli_tests.rs:324,360` stay as the one wiring proof per route (operation id updated); `test/rust-host/command-routes.test.mjs` stays the route-table proof |

Add one wiring proof for `gate-check` in `apps/fgos/tests/cli_tests.rs` (native, zero Node child process), because no test proves the native `gate-check` route today.

## Steps

1. Write `docs/platform/gate/spec.md` sections 1-3 and the component row in `docs/platform/component-boundary.md` (phase 08 completes them).
2. Create the crate; move `read_gate_bypass_level` and its tests by `git mv`-equivalent cut and paste, then apply Q1.
3. Port `decide_v0` from `src/state/gate-bypass.mjs`; port the 479-line case set as tables in `tests/decide.rs`; run them before deleting the Node file.
4. Wire providers and routes; update catalog, projector, presenter, route table, gateway remote list.
5. Delete the Node file, the use case, the bin cases, imports and the manifest entry; correct the registry descriptions.
6. `npm run build:skills` is not needed (skill text unchanged: the verb name and output field stay).

## Validation

- `cargo test -p fgos-gate`, `cargo test -p fgos-work-state`, `cargo test -p fgos --test cli_tests gate`
- `cargo clippy -p fgos-gate -- -D warnings`
- Focused Node via the lane's focused runner (`fr.mjs`; never `scripts/run-tests.mjs <file>`, it ignores file arguments): `test/rust-host/command-routes.test.mjs`, `test/cli/command-registry.test.mjs`, `test/architecture.test.mjs`
- `npm run fgos:dev -- gate-bypass --json` and `npm run fgos:dev -- gate-check <id> --gate contextApprove --artifact <file> --json` on a scratch project: same answers as the activated release for the same inputs.
- `rg -n "readGateBypassLevel|canAutoApprove|gateCheckUseCase|gate-bypass.mjs" src bin test` returns nothing.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Unicode word-boundary match differs between JS `\p{L}` regex and the Rust port | M x M | Port with `regex` crate `\p{L}\p{N}_` look-around emulation; the Vietnamese cases of the old test are table rows |
| Work item read from Rust differs from the Node view (fields used: title, description, size, footprint) | L x M | Read through `work_source.rs`; one test with a real event log fixture |
| A skill parses an output field that changes | L x M | `data.canAutoApprove` kept; new fields additive |

## Rollback

Revert the merge commit and re-activate the previous release. No on-disk format change.

## Net size (estimate)

Node `src/` and `bin/`: about -330. Rust `packages/`, `apps/`: about +330 new, -120 removed from work-state, net +210. Tests: -479 Node, +260 Rust, about -220 net. Docs: +80 (spec sections). Phase net code and tests: about -340.
