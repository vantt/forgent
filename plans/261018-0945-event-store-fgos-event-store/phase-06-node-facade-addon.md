# Phase 06: Node facade in the combined addon

- **Depends on:** phases 02-05 merged; Git E3 verdict recorded (it waits for the owner's `e3-budgets.md` commit, Git Q4); **Git 01 lane B merged** (crate `fgos-node-addon` at `packages/git/node-addon/` with the empty `event_store.rs` slot, single-load marker, resolver in `src/run-supervisor/payload-root.mjs`, `scripts/run-tests.mjs` addon build). The addon module may start after phase 02 on Git lane B's branch head.
- **Branch / worktree:** `es/p06-facade`, `.claude/worktrees/es-p06`.
- **Model / effort:** sonnet (advanced) with opus review, rigor high; 22h.
- **Blocks:** phase 07.

## Context

- Spec §4 (facade refusal `event-store-seal-under-state`), §8 (resolution once per process, `GIT_*` scrubbed), §13 (no walk, git call or spawn inside the gate), §17 (one combined addon, no per-call host facade, part (a) of the budget), §22 (platforms).
- Git D2-D4: one addon crate owned by Git; Event Store adds one module and one dependency line; one ABI row (`git-component-compatible`); the addon resolver is `payload-root.mjs`; no new env variable.
- Exec guard: any `child_process` call inside a hot critical section throws `exec-under-hot-lock` (`src/state/hot-lock.mjs`, `hotLockDepth` at `:58`); a Rust spawn is invisible to it, so the facade must never reach a spawning Rust path inside the gate.

## Requirements

1. **Addon module** `packages/git/node-addon/src/event_store.rs`: this phase owns the whole export list and its signatures: `openStore(resolvedRoot, machineId, registryFiles)`, `append`, `readInGate`, `read`, `seal`, `sealIfDue`, `sealAll`, `sync`, `status`, `exportJsonl`, `exportLegacyLayout`, `importLegacy`, `readLegacyFromHead`, `unpublishedSummary`. Each export maps to one crate function; no policy. Phase 08 fills crate bodies in files it owns and does not edit this module. The in-gate exports (`append`, `readInGate`) take only resolved paths and spawn nothing; a debug assertion in the crate refuses any port call on those paths.
2. **Facade** `src/event-store/index.mjs` (public API) and `src/event-store/native.mjs` (the only importer of the addon's event-store exports; rule in `test/architecture.test.mjs`): typed wrappers, no decisions.
3. **Resolution outside the gate (D4).** `prepareStore(cwd)` resolves the common dir through Git `resolve_repo` (scrubbed `GIT_*`), the machine id (git config `fgos.machineId` through Git's config read, then `<stateRoot>/machine-id`), loads registered stream contracts, and caches per process; `prefetched.eventStore` is passed into `withStateTx` like `mainFgosDir`. Not a repository: `event-store-no-repository`.
4. **Gate rules.** `seal`/`sealAll`/`sealIfDue`/`sync`/`read` (full) take the caller's held ranks as a required argument; they refuse `event-store-seal-under-state` when `hotLockDepth() > 0` and `lock-order-violation` when a held rank is ≥ 58 (D3). `append`/`readInGate` are the only calls allowed under `state` or `porting-events`.
5. **Consumer registry** `src/event-store/consumers.mjs`: one static data manifest `packages/event-store/contracts/consumers.v1.json` lists `{id, contractFile, cachePath, rebuildModule}`; streams come from each contract file only (one source). Every process loads the same manifest, so `status`, `export` and `rebuild` see every consumer regardless of imports; the facade imports a consumer's rebuild module only through the path the manifest names, from the CLI layer.
6. **Platforms (D15).** On any platform but Linux every export refuses with `event-store-unsupported-platform` before touching disk.
7. **Architecture manifest.** Rows for `src/event-store/*` below `src/state/*` (Work may import the facade; the facade imports neither `src/state` nor `src/runner`).

## Files

| Action | File |
|---|---|
| edit | `packages/git/node-addon/src/event_store.rs` (Git's slot), `packages/git/node-addon/Cargo.toml` (dependency `fgos-event-store`), `Cargo.lock` |
| create | `src/event-store/index.mjs`, `src/event-store/native.mjs`, `src/event-store/consumers.mjs` |
| create | `test/event-store/facade.test.mjs`, `test/event-store/no-spawn-in-gate.test.mjs`, `test/event-store/platform-refusal.test.mjs` |
| edit | `docs/architecture-manifest.json`, `test/architecture.test.mjs` (importer rule for `native.mjs`), `package.json` `files` (add `packages/event-store/contracts` and the consumer contract files, so the npm channel and legacy-node payload carry them) |
| create | `packages/event-store/contracts/consumers.v1.json` |

## Steps

1. Addon module and dependency line; build through `scripts/run-tests.mjs` unchanged.
2. Facade, prefetch and gate refusals.
3. Consumer registry; platform refusal; manifest rows.
4. No-spawn test: run `append` and `readInGate` inside `withStateTx` under `strace -f -e trace=process` and assert zero `clone`/`execve` children in the gate window; run the same under the exec guard.
5. Opus review; merge (dormant: no production caller).

## Validation

```bash
cargo test --locked -p fgos-node-addon -p fgos-event-store
cargo clippy -p fgos-node-addon --all-targets -- -D warnings
node --test test/event-store/facade.test.mjs test/event-store/no-spawn-in-gate.test.mjs test/event-store/platform-refusal.test.mjs test/architecture.test.mjs test/git/native-load.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p06 build> npm test
```

Vectors: a seal called while the caller holds `sessions` (80) refuses `lock-order-violation`; second separate load of the addon from another path fails closed (Git's `git-addon-second-load`); a worker thread load is allowed; seal under `withStateTx` refuses by name; seal with a Node scope holding `main-checkout` 50 is allowed and with rank 58 or more refused; 0 spawns in the gate window.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Addon build or ABI breaks on CI | Medium × Medium | Git owns the addon CI; the module adds no new target. A red Git addon build blocks this phase's merge. |
| A future change routes a spawning call into the gate | Medium × High | Crate assertion on in-gate paths, `strace` test in `npm test`, exec guard. |
| Combined addon fails Git E3 budgets and Q1 reopens | Low × High | Git measures E3 after Git 01; this phase waits for that verdict before merge. |

## Rollback

Dormant: revert the merge; Git's addon slot returns to empty.
