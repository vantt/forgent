# HARDEN T9 P02 - invocation-root door

Branch `harden/t9-p02-root-door` from `origin/main` `5ec8addad`. Status: see the end.

## What changed

- `src/runner/paths.mjs`: `resolveInvocationRoot({ cwd, dir, policy, home, facts })` returns `{ root, fgosDir, found }` or a validation refusal.
  - `caller-tree` (default): nearest `.fgos` above cwd, never above the Git top level, never `<home>/.fgos`. No store: `found: false`, `root` = where one would be created.
  - `main-checkout`: trusted main root (or the project `--dir` names).
  - `main-checkout-only`: same, and a `--dir` must be that main root. Used by `main-checkout-reset` only.
  - `strict-cwd`: cwd itself, refused inside a repository unless cwd is its top level. Used by `init` only.
  - A repository Git refuses to trust (forged `gitdir`, F12; OPC confirmed Git Inspect already errors `untrusted-worktree`) is refused under every policy, never read as cwd.
- One Git read: `readRepoFacts` in `src/git/inspect.mjs`; the door, `resolveRepoRoot`, `resolveMainCheckoutRoot` (optional `facts`), `resolveGitRoots` and `scripts/lib/git-ports.mjs` `mainCheckoutRoot` call it. `strict` mode and `resolveFgosDir` deleted.
- `bin/fgos.mjs`: `dataDir` and its strict-cwd body gone; five hand-written root lines plus six more `resolveMainCheckoutRoot(x) ?? x` lines (worktree, discover, plan, return, verify timeout) now go through `mainCheckoutRootOf`/`mainCheckoutRootAt`; `lock-status` arm is one call. The `unclaim` arm line (Work arm) is one such edit: WORK to be told. `discover`, `plan`, `return` lines are also Work-adjacent one-liners.
- `src/util/host-bin.mjs`: `resolveHostBin` is one call into `resolveActiveHostBin`; the cross-checkout loop and `packageRoot`/`FGOS_PACKAGE_ROOT` are gone. `fanout-batch` resolves the host for the `root` it is given and refuses (no file fallback to `bin/fgos.mjs`).
- `src/runner/lock-status.mjs`: beacon age/active arithmetic moved into `collectLockStatus` (`beacon` field).
- Root table: `test/rust-host/fixtures/invocation-root-table.json`, read by the Node door (`test/rust-host/invocation-root-table.test.mjs`), the host walk (`apps/fgos/src/cli_projector.rs` test) and the identity main root (`packages/identity/rust/tests/project.rs`).
- CHANGELOG line; spec fact in `docs/platform/host-invocation-routing/spec.md`.

## Authority

- Decision: "which project, which `.fgos`". Held before in seven places (audit AU-01). Now: Node `resolveInvocationRoot` over the one `readRepoFacts`; Rust host walk and identity `main_root` stay as the Rust readers, proven equal on the table (main root, subdirectory, linked worktree, `$HOME`, no repository, store without repository).
- Not unified: the host walk is not bounded by the Git top level (a store above a nested repository is found by the host, not by the Node door). Left as is: a Git read on the native route is the cost the plan rejected. Belongs to a single Rust project locator (AU-01 contract `project-locator`), not built here (RUL104).
- Shutdown fallbacks `resolveMainCheckoutRoot(root) ?? root` in `session.mjs`, `gateway-control.mjs`, `loop.mjs` stay for P04 (their files are not mine).
- Activation read: `host-bin.mjs` no longer reads `activation.json`; `resolveActiveHostBin` is the one Node reader (P10 moves the doctor onto it).

## Strict-cwd verbs

Only `init` keeps `strict-cwd` (it creates the store; evidence: refusal naming the top level, wiring test). Every other verb walks up.

## Red evidence

Against the old `bin/src/scripts` (checked out from `756d96e60`), `test/cli/fgos-disconnected-worktree-guard.test.mjs` fails exactly the three new cases: list from `docs/` (read a phantom store), `init` from `docs/` (not refused), `main-checkout-reset --dir <other repo>` (not refused). Door unit cases, beacon unit case and the fan-out host case are new behaviour with no old equivalent.

## Retired tests

- `paths.test.mjs`: `resolveRepoRoot strict mode ...` (two) and `resolveFgosDir(cwd, { strict: true }) ...`: strict mode removed; the `strict-cwd` policy case owns cwd-as-root.
- `host-bin.test.mjs`: the `packageRoot`/`FGOS_PACKAGE_ROOT` hermetic cases re-fixtured as "no activation returns null" and "own active release resolves"; behaviour (cross-checkout fallback) removed.

## Gate (what I ran)

- Focused: paths, root table (Node), host-bin, host-bin-path, lock-status, fanout-batch-runner-commit, disconnected-worktree guard, `test/setup/active-release-drift-check`, `runner-config-conversion`: green. `test/architecture.test.mjs`, doc-health, decision-citation-drift, run-doors doctrine: green.
- `cargo test -p fgos-identity --test project`, `cargo test -p fgos --bin fgos root_`: green. `cargo fmt --all --check`, `cargo clippy -p fgos -p fgos-identity --all-targets -D warnings`: clean. aarch64-apple-darwin `cargo check` clean; msvc `--bins`/identity `--all-targets` clean (msvc `fgos --all-targets` fails in `apps/fgos/tests/cli_tests.rs` on `std::os::unix`, not touched by this phase).
- Census: regenerated; site count unchanged (line moves, digests).
- Git calls per invocation: the door adds one read to a legacy invocation; the three reads in one call chain share `facts`. Not measured by a spawn counter (Inspect is the addon, no child process): proven by the `facts`-passed unit case.

## Size (HARDEN lines vs origin/main)

bin -57 (+44/-101), src -2 net (+138/-117 over paths, host-bin, fanout, lock-status, run, inspect), scripts 0, Rust +68 (tests only), tests +230 net (+282/-52). Estimate was bin -90, src +5, tests +40: bin short by about 30 (the lock-status beacon block moved 20, `main-checkout-reset` kept its guard), tests over because each policy and the three-reader table have their own proof.

## Lessons

- A `--dir` validation under `main-checkout` broke tests and real flows (`setup --dir <project>` from elsewhere); a destructive verb needs its own policy. Run the wide `test/cli test/setup` sets before deciding a guard's breadth.
- `run-tests.mjs` takes files, not directories; pass `test/cli/*.test.mjs`.
- A `git commit` fails on census drift after every source edit; squash the WIP commits before rebasing, otherwise the census conflicts at each commit.
- Plain `node --test` cannot load the Git addon; use `run-tests.mjs` for anything touching Inspect.
