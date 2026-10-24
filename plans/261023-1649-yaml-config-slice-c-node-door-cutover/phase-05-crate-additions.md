# Phase 05: Crate additions: `init`, the machine view, `PathDetectors`

Depends on 00 and Slice D landed (it edits `write.rs` and `machine.rs` after D's refactors). Suggested executor: sonnet. Caps: `write.rs` delta 80 lines, `detect.rs` delta 80, `machine.rs` delta 50. Impact analysis on `commit_observed`, `place`, `current`, `snapshot`, `read_sources` first (D edits them; re-read the landed shapes). Landing B, branch `cfg/slice-c-door`.

## Context

Three things the door needs that no landed code provides:

1. **`init`** (spec section 6, first row): create a missing file holding the grammar line, a header that points to `fgos config standard`, and nothing else. `commit_observed` cannot: an empty edit list returns before writing (`write.rs:208`).
2. **A machine view**: global + accounts + standard, no project file. The gateway reads only the global file and its `gateway` section is `global-only`, so it must never be handed a project (a project holding `gateway`, as this repository's does today, would fail its start). D's `accounts::read` is "`build` over the accounts source alone plus the standard layer" (landed: `machine::accounts::read`, `machine.rs:134-175`); the machine view is the same builder over {global, accounts}.
3. **`PathDetectors`**: the real `Detectors` (B D1 left only `NoDetectors`, `detect.rs:13`). It serves `runner.executor` (the only `x-fgos-absent: detected` path, `core/config-schema/runner.schema.yaml:11`): candidates `claude`, `codex` in order, template only for `claude` (today's `SUPPORTED_EXECUTOR_TEMPLATES`, `src/runner/dispatch/config.mjs:271`, which equals `DEFAULT_RUNNER_CONFIG.executor`, `:207-218`).

## Files it may touch

`packages/config/rust/src/write.rs` (append `init`, reusing `place`, `dir_identity`, the lock and `install_once_with_mode`; if D split the file, the landed home of those helpers), `src/detect.rs` (append), `src/machine.rs` (append), `packages/config/contracts/detected.v1.json` (new: `{ "candidates": ["claude","codex"], "templates": { "claude": { "command": "claude", "args": ["-p","{prompt}","--model","{model}","--permission-mode","acceptEdits"] } } }`, one source for the template; a test pins it equal to the `runner` standard's executor shape and, until phase 10 deletes it, to `DEFAULT_RUNNER_CONFIG.executor`), `contracts/fixtures/{init,machine-view}.v1.json`, `contracts/failure-codes.v1.json` (append only if a new id is needed), `tests/{golden_init,machine_view,detect_path}.rs`, `src/lib.rs` (only if a module line is needed; D 03 declared the stubs).

## Design

- **`init(ctx, roots, target, writer) -> Result<InitResult, SnapshotError>`**, `InitResult { created: bool, revision }`. Takes the same lock as a write (`project-config` or `global-config`), opens beneath the root without following symlinks, and installs the header-only bytes (`header_lines(1)` plus a blank line, exactly what `edit` writes for a new file, `write.rs` `header`) with `install_once_with_mode` (0644 project, 0600 global): create-only. An existing `config.yaml` **or** `config.json` in that scope returns `created: false` and writes nothing (a legacy JSON file is migrated by D's verb, not shadowed: creating a `config.yaml` beside it would be `config-legacy-shadowed`). A confined class is refused with `config-write-confined`. `target` is Project or Global only.
- **Machine view:** `machine::snapshot(ctx, global_dir, class) -> Result<Snapshot, SnapshotError>`: sources {global, accounts when unconfined}, standard layer, the same validation and scope rules, no project and no `trusted` source. Returns the same `Snapshot` (so `redact::render_for_display` and the door marshal work unchanged).
- **`PathDetectors { path: Option<OsString> }`** (the crate reads no environment: the caller passes `PATH`). `detect(path)` answers only for `runner.executor`: the first candidate found in `PATH` as a regular file with an execute bit (`std::fs::metadata`, `PermissionsExt::mode() & 0o111`; Windows is gate G4 and compiles to "none"); a candidate with a template yields the template as a `Value`, a candidate without one (`codex`) yields none. The contract file is read once with the crate's `contract!` macro (`lib.rs`).
- **A bundled context constructor.** Rust callers (gateway, herdr, work-state, the addon) need `Context { schemas, standard, digest, detectors }` without each parsing the 16 schemas and 15 standard files per call. If D did not already add one (checked: `Schemas::bundled`, `Standard::bundled` exist, no shared context constructor: add it), add `machine::context(detectors) -> Context<'static>` over a process-wide `OnceLock<(Schemas, Standard, String)>` (about 20 lines inside the `machine.rs` cap; the bundle is immutable data, so this is not a value cache that can go stale).
- A snapshot containing a detected value is already never cached (B D21); nothing to add.

## Steps

1. Merge `origin/main`; `impact` on the symbols above; list the callers of `place`, `current` (private, so the crate only).
2. `detect.rs` and the contract first (smallest), then `machine.rs`, then `init`.
3. `tests/golden_init.rs` over `init.v1.json` (pure: bytes of the produced file for project and global, header text, no standard value, mode constants), `tests/detect_path.rs` (real temp dirs as `PATH`: first candidate wins, non-executable skipped, `codex`-only gives no executor, a relative `PATH` entry is ignored, empty `PATH`), `tests/machine_view.rs` (a project file holding `gateway` does not matter because none is read; confined has no accounts; a global value over the standard; provenance names the bundled file for a standard value).
4. A real-filesystem case for `init`: two racing calls, one `created: true`, one `created: false`; an existing legacy `config.json` blocks; a symlinked `.fgos` is `config-path-symlink`.
5. `cargo test -p fgos-config --jobs 4`, `cargo clippy -p fgos-config --jobs 4 -- -D warnings`, `cargo fmt --check`; count lines against the caps.

## Owning proofs

`init`: `golden_init.rs` plus the race case. Detection: `detect_path.rs`. Machine view: `machine_view.rs`. The merge, scope and validation behaviours are B's and D's goldens, not repeated.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| `init` and a legacy file race into `config-legacy-shadowed` | L x M | create-only install under the scope lock; a legacy file makes `init` a no-op; case above |
| `PathDetectors` disagrees with `findExecutableOnPath` on edge cases (PATHEXT, symlinks) | L x L | Unix only here; the JS probe stays for `tool-registry` (Ideas I3); the cases are the old test's (`test/runner/dispatch.test.mjs` `detectAssistantCli` cases) moved |
| The template drifts from the standard | L x M | a test pins the contract file to the runner standard's `executors.claude` argv |

## Rollback

Revert: three additive functions, one contract file; nothing calls them until phase 06.

## Landed (2026-10-24, landing B)

- `write::init(roots, target, lock_root, lock_wait_ms) -> InitResult { created, revision }` (no `ctx` or writer: the file holds no value and no `[actor]`); `machine::snapshot(ctx, global_dir, class)`, `machine::context(detectors)` (process-wide bundle in a `OnceLock`), `detect::PathDetectors { path }`, `contracts/detected.v1.json`. `produce` and `init` share one `header_text()`.
- `snapshot.rs` changed (outside the file list): `read_sources` is now `machine_reads` + `collect`, and `machine_sources` exposes the machine half, +17 net lines. The machine view is the same `build` over those sources, not a project root pointed at a missing directory.
- The proofs are plain Rust cases over real temp directories (`golden_init.rs` 4 tests, `detect_path.rs` 5, `machine_view.rs` 5), not fixture JSON files: nothing in them is data another runner needs. The template pin compares `detected.v1.json` with `runner.executors.claude.invocations[0]` of the bundled standard; the `DEFAULT_RUNNER_CONFIG` half of the pin waits for the JS copy's deletion (phase 10).
- Lines added (net): `write.rs` 72 (cap 80), `detect.rs` 49 (cap 80), `machine.rs` 44 (cap 50), `snapshot.rs` 17.
- The snapshot cache (`cache.rs`) is request-keyed over `read_sources`, so the machine view is not cached by the crate; phase 06 keeps it uncached in the addon too (a machine read is global file, accounts file and the shared bundle: measured in phase 08).
