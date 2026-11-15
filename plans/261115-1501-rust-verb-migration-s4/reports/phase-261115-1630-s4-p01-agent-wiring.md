# S4 phase 01: agent wiring modules in Rust

Branch `rust-verb-migration-program/s4-p01` (worktree `rvm-s4-p01`). Nothing flips here; 07, 08 and 09 switch to
these modules and delete the Node ones.

## What landed

- `packages/distribution/rust/src/agent_hooks.rs`: the hook table for five CLIs (render, check, install, reversal),
  the generated omp/pi extension, the delete-guard prefilter renderer, the mailbox opt-in reader
  (`mailbox_opt_in`, via `fgos_config::machine::project_snapshot`) and hook timeout, the shim probe with a
  `ProcessRunner` seam (default `BoundedRunner` over `fgos_process::spawn::run_bounded`) and a per-run `ProbeMemo`.
- `packages/distribution/rust/src/agent_config.rs`: readers behind `claude-plugin-marketplace`,
  `agy-permissions-configured`, `agy-sub-homes-configured`, `mailbox-claude-accept`, and the `wire-agents` plan
  (`agents`, `absent`, `files`, `permissions`). Messages copied from Node. `claude` is started through the runner
  seam with `resolve_program` (PATHEXT) so Windows runs `claude.cmd`.
- `packages/distribution/rust/src/launcher.rs` (+ `launcher.sh`, `launcher-cmd.txt` data, `tests/goldens/launcher-digests.json`):
  launcher writer, checker, row verdict and fix text, `source_checkout(legacy_node_root)`.
- `packages/distribution/rust/src/shim.rs`: `project_shim_path`, `PROJECT_SHIM_RELATIVE` (one spelling of the shim path for
  hook text and the launcher).
- Contracts: `packages/distribution/contracts/agent-hooks.v1.json` (64 recorded cases: install, second install, check
  with and without the shim, reversal, per CLI; plus the rows table, `attemptIdPrefix`, hook timeout),
  `packages/distribution/contracts/delete-guard-prefilter.v1.json` (list as data, derived forms and matches recorded from Node).
- Node: `agent-hooks.mjs` reads the prefilter list from data (literal list deleted); guard test reads the data file;
  `agent-hooks.test.mjs` replays every vector through the Node module and pins `attemptIdPrefix` to the minted prefix.
- `mailbox.enabled` reader is now `agent-hooks` in `limits.v1.json` (meaning text rewritten, no `setup`) and in
  `limits_contract.rs`.
- Doors rows: new "agent hook table" and "person's agent config writes" (with `retiredBy`, debt and a negative case in
  `test/architecture.test.mjs`); `launcher.sh` joins "installation shim and activation record location"; `agent_hooks.rs`
  joins "writer and session id environment" (same reason as the Node module).

## Bytes equal to Node

Vectors were generated once from the Node module (scratch generator, not committed). Rust reproduces all 64 cases
byte for byte (files, results, check messages, reversal results), including a project path with a space and a quote,
the omp/pi extension in both mailbox forms, earlier forms replaced in place, user hooks kept, malformed and wrong-shape
files. Launcher bodies are pinned by sha256 of Node's output.

## Gates

- `cargo fmt --all --check`: ok. `cargo clippy -p fgos-distribution -p fgos-mailbox-core --all-targets -- -D warnings`: ok.
- `cargo test -p fgos-distribution`: 136 lib tests + integration tests green (3 runs, no flake). `cargo test -p fgos-mailbox-core --test limits_contract`: green.
- `cargo check -p fgos-distribution --all-targets` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: ok (includes the
  windows-only cmd launcher test and the `.cmd` resolution unit case).
- Census regenerated: 0 undeclared sites.
- `node scripts/run-tests.mjs` over: `test/setup/agent-hooks.test.mjs`, `test/git/main-checkout-delete-guard.test.mjs`,
  `test/setup/claude-code-hooks.test.mjs`, `test/architecture.test.mjs`, `test/setup/git-mutation-census.test.mjs`,
  `test/githooks/census-drift.test.mjs`, `test/setup/checks-setup-rc-line.test.mjs`, `test/install-packaging.test.mjs`
  (143 pass), and earlier `registrations`, `uninstall-project`, `git/one-door`, `distribution/source-payload`,
  `scripts/prepare-release`, `scripts/mailbox-behaviour-*` (all), `project-launcher`, `agent-wiring`, `agy-permissions`,
  `mailbox-claude-accept`, `plugin-marketplace-doctor-check`: green.
- Not run (series gate): `test/rust-host/release-tree.test.mjs` (the payload `files` list gained one contract),
  `npm test`, `cargo test --workspace`.

## Retired test -> owner now

No test is retired here (the Node modules stay until 07/08/09). Owners established for those deletions:

| Node test (retires with) | Owner after |
|---|---|
| `test/setup/agent-hooks.test.mjs` install/check/uninstall/legacy/prefilter cases (07, 09) | `agent_hooks.rs` tests over `agent-hooks.v1.json` and `delete-guard-prefilter.v1.json` |
| `test/setup/project-launcher.test.mjs` (07) | `launcher.rs` tests (states, fix texts, script behaviour via `/bin/sh`, cmd launcher on Windows, bodies pinned by digest) |
| `agy-permissions.test.mjs`, `mailbox-claude-accept.test.mjs`, `plugin-marketplace-doctor-check.test.mjs`, plan part of `agent-wiring.test.mjs` (07, 08) | `agent_config.rs` tests (fake HOME, fake `claude` on PATH) |
| the extension runtime cases in `agent-hooks.test.mjs` (load in Node, inert for runner, owner/mode refusal, hook timeout, subdirectory search) | NOT moved: they run the generated JavaScript in Node and call the Node generator. 07 must point them at the extension text in `agent-hooks.v1.json` before deleting the Node module |

## Accepted changes

- A hook file whose JSON root is not an object (array, `null`, number) is "malformed" for install and check (Node threw or
  rewrote it); a reversal still treats an array root as holding nothing of ours.
- Writes replace the file by rename through Durable File, keeping the existing mode and following a symlink in its place
  (Node wrote in place).
- Shim probe: a timeout, a signal or an unstartable shim all read `exit-null`, as Node's `spawnSync` result did.
- `mailbox_opt_in` canonicalises the project root and reads with the root as its own trusted root
  (`project_snapshot`); Node resolved the main checkout first. Differs only for `command` values of a linked worktree, which no mailbox key uses.

## Proposed `## [Unreleased]` line

None (internal modules; nothing user-visible changes until 07-09 flip).

## Concerns and handoffs

1. **`Cargo.lock` (authorized by the step lead, own commit `build: fgos-distribution depends on fgos-config`):** if p02 already carries the same lock line when this rebases onto s4, drop that commit. Original note: under `fgos-distribution` add `"fgos-config",` before `"fgos-durable-file",`
   (D15 edge, added to `packages/distribution/rust/Cargo.toml`). I left `Cargo.lock` unstaged, so `--locked` builds of this branch fail until it lands.
   The `fgos-process` edge and lock line come from the cherry-picked p02 commits (`abc80cef5`, `cf78c3189`), which drop out when p02 lands.
2. **F11 not done, by agreement with the step lead:** `scripts/lib/mailbox-live-confined.mjs` still imports the Node table
   (debt entry in the hook-table row says so). 07 switches it with a scrubbed HOME and PATH once the Rust fixes own the hook rows.
3. **Files outside the phase's Modify list that I had to touch:** `package.json` (`files` gains
   `delete-guard-prefilter.v1.json`, or the payload's `agent-hooks.mjs` would fail on import in a release),
   `test/setup/checks-setup-rc-line.test.mjs` (its hand-built payload copy lists contracts), `test/architecture.test.mjs` (negative cases for the new rows).
4. **Plan text vs reality:** the hook-table row cannot list the two contracts as allowed (the door walk reads only
   source files, an entry would be stale); the launcher row allows `launcher.sh`, the body file, not `launcher.rs`, which
   spells no shim text. The row's `allowed` for `wire_agents.rs` is added by 08.
5. **Config helper twin risk:** `agent_config.rs` and `agent_hooks.rs` read config through `project_snapshot` (one door). No new `pub` item
   in `fgos-git`, `fgos-process` or another OPC-reviewed crate. `fgos-distribution` uses `GitDriver::topology_at` (existing pub).
6. Windows: `mailbox_opt_in` and the readers run wherever `project_snapshot` runs (the config crate decides); the cmd launcher
   and `claude.cmd` resolution have msvc-checked tests that only run on Windows (the `.cmd` resolution case runs everywhere).
7. `test/live/*.live.mjs` import `agent-hooks.mjs` (unchanged); 07 owns them with the module's deletion.

Status: DONE_WITH_CONCERNS

## Named items

- **For phase 07 (could not move):** the extension runtime cases of `test/setup/agent-hooks.test.mjs` (handlers load in Node,
  inert for a runner worker, frame appended after real output, shim owner/mode refusal, hook timeout, shim search from a
  subdirectory, `loadedHandlers`/`recordingShim` users). They run the generated JavaScript and call the Node generator; 07 must
  feed them the extension text from `agent-hooks.v1.json` (the `omp-*`/`pi-*` cases) before deleting `agent-hooks.mjs`.
- **For the series gate:** `test/rust-host/release-tree.test.mjs` (not run here; the payload `files` list gained
  `packages/distribution/contracts/delete-guard-prefilter.v1.json`), plus `npm test` and `cargo test --workspace`.

## Review fixes (OPC verdict CHANGES)

- Attempt prefix: `packages/identity/rust/tests/attempt_writer_id.rs` now asserts `agent-hooks.v1.json` `attemptIdPrefix == ATTEMPT_PREFIX`
  by path (no crate edge); the self-referential agent_hooks test is removed.
- The contract is small (prefix, shim path, timeout, rows; 6 KB). The 64 replay cases moved to the test-only
  `packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`; the Node test reads that file. `attempt_prefix()` and
  `Prefilter::bundled` use `expect`/panic on a missing or empty key instead of a fallback.
- Accepted change (stricter than Node): an install refuses a hook file whose path resolves outside the canonical project root
  (a link, or a linked parent such as `.claude -> /elsewhere`), a dangling link included; it answers `wired: false,
  skippedExisting: "outside-project"` and writes nothing. A link that stays inside the project is followed as before.
- A new hook file takes `0666 & ~umask` (learned from a probe file), not a fixed `0644`.
- Door rows: new "delete-guard keyword list" (allowed `agent_hooks.rs`, debt `agent-hooks.mjs`, the guard test's own matcher copy
  named in the reason, negative cases in `architecture.test.mjs`); hook-table row gains the `hooks.json` pattern and allowed entries
  for `scripts/lib/mailbox-behaviour-run.mjs` and `scripts/lib/mailbox-behaviour-v7f.mjs` (harness-owned).
- Phase 07's file lists the deferrals (live harness import, extension runtime cases, launcher digest test, debt entries).
- `test/setup/project-launcher.test.mjs` pins the Node launcher bodies to `launcher-digests.json`; spec text for the `mailbox.enabled` reader
  fixed in `docs/platform/agent-mailbox/spec.md`; redundant `set_permissions` removed from `launcher.rs`.
- Spawn: the branch carries p02's three corrected commits in order (`4cab0cb29` spawn, `a6cb41064` fgos-process lock line, `ea4c968a8` process group and bounded collection; resolved onto this base, they drop out when p02 lands). The `fgos-config` lock line is folded into the commit that adds the Cargo.toml edge, so every commit builds with `--locked`; drop it if p02 lands the same line first. Callers needed no change.

## Correction: frozen files restored (MAIL)

`src/setup/agent-hooks.mjs` and `packages/mailbox/contracts/limits.v1.json` are measurement inputs of MAIL's frozen experiments;
the earlier edits to them (and the changes that depended on them) are reverted to `origin/main` bytes. Superseded statements above:
the `mailbox.enabled` reader stays `setup` in `limits.v1.json`/`limits_contract.rs` (no rename, no meaning-text change, spec text
restored); `package.json` and `checks-setup-rc-line.test.mjs` no longer carry the prefilter data file (Node does not read it).
The Node module keeps its literal keyword list as a named twin of `delete-guard-prefilter.v1.json`: the "delete-guard keyword list"
door row carries it as debt with `retiredBy` naming MAIL's re-measure, and `test/setup/agent-hooks.test.mjs` pins the literal list
(read from the module source) equal to the data file and to its derived forms. The Rust code reads neither file's `reader` value.
