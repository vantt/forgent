---
phase: 0
title: "Facts, baselines and the first-tier door rows"
status: pending
effort: 1.5d
wave: "A (part A), B (part B)"
blockedBy: []
partBBlockedBy: [1]
---

# Phase 00: Facts, baselines and the first-tier door rows

Two parts, one lead, one branch:
- **Part A (wave A, read-only):** answers the prior-art questions and open facts the other F0 phases rely on,
  and records the numbers F0's exit criteria compare against. Its report must reach the F0 lead before wave B starts.
- **Part B (wave B, starts when phase 01 has landed):** lands the census's first-tier `doors` rows (kernel lock
  primitive, process control, process facts `/proc`, canonical JSON bytes) with their debt lists, and turns the three
  existing one-door guards into rows of the same table, retiring their old checks in the same change (L10). After
  this part there is one guard mechanism for one-door rules besides the Git scan, not four.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p00 /home/vantt/projects/forgent-worktrees/rvm-f0-p00 origin/rust-verb-migration-program/f0`
  (the F0 lead creates the integration branch `rust-verb-migration-program/f0` from `origin/main` first). Assert the path is in `git worktree list`. Part B rebases onto the integration head after phase 01 lands.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p00-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`. Also run every test that imports or reads a file you change.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`.
- Report: `fgos convention path --kind report --type phase --slug f0-p00-facts-rows --plan 261114-2051-rust-verb-migration-program --json` (run from the main checkout). End with `Status / Summary / Concerns`.

## Context

- Research report: `git show origin/research/rust-verb-migration:plans/reports/research-261114-1142-rust-verb-migration-assessment.md`.
- Door census: `git show origin/research/one-door-census:plans/reports/research-261114-2201-one-door-census-existing-doors.md`
  (sections 3, 4.1, 4.2, 4.3, 4.6, 6, 7). Line numbers there are from `781537524`; re-run its patterns before landing a row.
- Host: `apps/fgos/src/main.rs` (route table embed line 38, help to legacy 341-350, native kinds 73-80 and 282-287).
- Generator: `scripts/export-command-selectors.mjs`; registry `src/cli/command-registry.mjs` (`declared` line 101, `HELP_SELECTORS` line 80).
- Node doors in `bin/fgos.mjs` `main()` (4193-4321): `resolveInvocationRoot`, `admitStoreAccess` (`src/runner/worktree.mjs:547`),
  `runWithEventStoreLifecycle` (`src/event-store/maintenance.mjs`), `recordInvocationFault` (`src/observe/invocation-fault-log.mjs:89`).
- Existing guards (census section 3): `test/process/one-door.test.mjs` (88 lines: `process.kill(` and `/proc/` under `src/`
  and `bin/`, allowlists with reasons and a staleness test); the YAML rule in `test/architecture.test.mjs:1278-1332`
  (`findYamlParserLoads`, `hasYamlBundleSignature`, the "vendored parser is gone" check); the source scan inside
  `test/holder-lock/driver-unavailable.test.mjs:110-140` (only the facade calls `holderLock.take(`; the runtime half of that
  test, a second `take()` refused, stays).

## Part A tasks (read-only)

1. **Prior art** (commit, date, intent for each):
   - `git log -S'native_kinds' --oneline` (expect `4cde1feee`, the mailbox hook lane).
   - `git log -S'HELP_SELECTORS'` and `3a479738c` (help sent to the legacy-node payload on purpose, 2026-10-14).
   - `git log -S"mutatesStore: (positional"` and `-S'nativeOnly'`: when predicates and `nativeOnly` came in, and why.
   - `git log -S'admitStoreAccess'`, `-S'maintainEventStore'`, `-S'recordInvocationFault'` (tsk-5z0), `-S'resolve_target_root'`, `-S'parseArgs'`, `-S'resolve_workspace_root'`.
   - Any earlier Rust help renderer, store admission or lifecycle code: `git log --all -G'render_help|admit_store|seal_if_due\(' -- apps packages`.
   - Say for each: what existed, which change removed or moved it, intended or not.
2. **Open facts** (each answered with `file:line`):
   - U1: does any native Rust writer append Work events that need the Node seal coalescer (`src/event-store/seal-coalescing.mjs`) hand-off, or does Rust seal inline?
   - U2: what `prepareStore` (`src/event-store/native.mjs`) does beyond the addon, and which `fgos_event_store` calls give the same `maintenance` facts, `seal_if_due`, `seal_all` from `(cwd, trusted_main)`.
   - U3: the signal behind `currentDispatchDepth()` (`src/runner/dispatch/adapters.mjs:81, 95-99`, `FGOS_DISPATCH_DEPTH`): confirm no other reader.
   - U4: an existing Rust capped-JSONL append (0600, drop oldest half past 1 MiB, as `src/util/capped-jsonl-log.mjs`): search `packages/*/rust/src` (durable-file, observe `shard.rs`). Name it or say none.
   - U5: the exact way to run one harness case set node-vs-host through `scripts/run-tests.mjs` (it filters env to `TEST_ENV_KEYS`, so `FGOS_HARNESS_ENTRY_*` does not pass).
   - U6: does `fgos_config` expose `eventStore.seal.intervalSec`, `eventStore.sync.intervalSec` and the remote the way `src/event-store/config.mjs` `readEventStoreConfig` reads them? Does the addon `config` namespace expose the global directory, or only take it as input (`src/config/facade.mjs:36`)?
   - U7: a store-free legacy invocation that still spawns Node, to replace `add --help` in `apps/fgos/tests/cli_tests.rs` (272, 513, 2355) once help is native (`workflow list` is the harness's choice).
   - U8: the root policies of `resolveInvocationRoot` (`src/runner/paths.mjs:145-182`: `caller-tree`, `main-checkout`,
     `main-checkout-only`, `strict-cwd`, `found`, the Git ceiling, the home `.fgos` exclusion) against the host walk
     `cli_projector::resolve_target_root` (`apps/fgos/src/cli_projector.rs:17-58`) and the work-state walk
     `resolve_workspace_root` (`packages/work-state/rust/src/lib.rs:55-66`, caller at 118): list every difference.
   - Also: does `scripts/explain-command-route.mjs` read the help selectors or `native_kinds`?
   - Also: every product and test file that runs `bin/fgos.mjs` (or `FGOS` from the CLI harness) with a help token:
     `rg -n "bin/fgos\.mjs|\bFGOS\b" test scripts src | rg -- "--help|'-h'"` plus the files phase 09 already names. List them with `file:line`; phase 09 moves each.
   - Also: the host's sync-due rule and detached child for the mailbox (`apps/fgos/src/wiring/mailbox_hook.rs:186-224`,
     `mailbox_sync.rs:179-198`, stamp file) against Node's `syncDue` (`src/event-store/maintenance.mjs:12-15`): same job or not, with evidence.
3. **Baselines** (numbers, commands, machine load at the time):
   - `node scripts/git-one-door-scan.mjs --root .` summary count.
   - Route counts from `packages/host-runtime/contracts/command-routes.json` (82 total, 74 legacy, 8 native, 2 help).
   - Median of 15 runs through the staged host: `fgos --help --json`, `fgos add --help`, `fgos config show --json`.
   - `cargo check -p fgos -p fgos-git -p fgos-observe -p fgos-event-store -p fgos-config -p fgos-host-runtime -p fgos-node-addon --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`: green or the existing failures.
   - SHA-256 of `node bin/fgos.mjs --help --json` stdout (phase 01 compares the generated manifest with it).

## Part B requirements (after phase 01 landed)

1. Re-run each census pattern (census 4.1, 4.3, 4.6) on the current integration head with phase 01's real check (comment
   lines and `#[cfg(test)] mod` blocks dropped) and land these rows in `docs/architecture-manifest.json` `doors`, all
   `kind: "door"`, with `allowed` and `debt` as the check finds them (start from the census lists; a file that matched only
   inside a test module or a comment leaves the row; every `scripts/` entry gets a reason):

| Job | Patterns (census) | Owner (`allowed` core) | Debt at landing (census, to re-verify) |
|---|---|---|---|
| kernel lock primitive | `libc::flock`, `LockFileEx`, `F_OFD_SETLK`, `F_SETLK`, `CreateMutexW`, `File::lock\(`, `\.try_lock_(?:shared\|exclusive)\(` | `packages/holder-lock/rust/src/**` files that hold the primitive, `packages/run-supervisor/rust/src/adopt.rs`, `supervise.rs`, `src/holder-lock/driver.mjs`, `src/holder-lock/hold-transport.mjs` | `packages/git/node-addon/src/single_load.rs` |
| take a holder lock from Node | `holderLock\.take\(` | `src/holder-lock/index.mjs` | none (replaces the scan in `driver-unavailable.test.mjs`) |
| process control: signal a process or group | `process\.kill\(`, `libc::kill(?:pg)?\(`, `\bkillpg\(`, `GenerateConsoleCtrlEvent`, `\bTerminateProcess\(`, `Command::new\("(?:kill\|taskkill\|pkill)"\)` | `packages/process/rust/src/**`, `packages/run-supervisor/rust/src/gate/*.rs`, `steps.rs`, `packages/holder-lock/rust/src/driver/flock.rs`, `port.rs`, `src/holder-lock/index.mjs`, `src/runner/dispatch/provider-credential-probe.mjs` (each with the reason the old allowlist or the census gives) | `scripts/run-tests.mjs`, `scripts/lib/test-file-watchdog.mjs`, `scripts/lib/mailbox-live-confined.mjs` |
| process facts: read `/proc` | `/proc/(?:self\|sys\|net\|\{\|\$\|\d\|loadavg\|meminfo)`, `["']/proc["']` | `packages/process/rust/src/platform/linux.rs`, `containment/linux.rs`, `src/run-supervisor/runtime-dir.mjs`, the two bwrap argument files, `packages/git/rust/src/wal.rs`, `packages/holder-lock/rust/src/driver/flock.rs`, the mailbox example, `scripts/ci-setup-bwrap.sh` | `packages/holder-lock/rust/src/route.rs`, `origin.rs`, `packages/git/rust/src/worktree.rs`, `packages/git/node-addon/src/single_load.rs`, `packages/terminal-control/rust/src/driver/herdr.rs`, and the `scripts/` readers the census lists |
| canonical JSON bytes | `(?:function\|fn)\s+(?:canonicalJson\|stableStringify\|sortedJson\|canonical_json\|to_canonical_json)\b` | `packages/canonical-json/rust/src/lib.rs`, `packages/git/node-addon/src/canonical_json.rs`, `src/native/door.mjs`, and the exceptions the component-boundary row names (census 4.6) | `src/runner/execution/seat-policy.mjs` |
| YAML parser loads | JS import, `import()`, `require()` or `createRequire` of `yaml`/`js-yaml`/`third-party/js-yaml` (the specifier rule of `findYamlParserLoads`, as a pattern), `\bfunction\s+loadAll\s*\(` (the bundle signature that survives comment dropping), `saphyr_parser::`, `serde_yaml::`, `yaml_rust::` | `packages/yaml-doc/rust/src/backend.rs` | the frontmatter helper and its callers only if they match these patterns (the parser-and-writer leak, census rank 1, gets its own row with its fix, not here) |

2. Retire the old checks in the same commit, each naming its new owner (the row's job):
   - `test/process/one-door.test.mjs`: delete the file (its three tests are the two process rows and the stale-entry check of the table).
   - `test/architecture.test.mjs:1278-1332`: delete the YAML rule, `findYamlParserLoads`, `hasYamlBundleSignature` and their own
     cases if nothing else imports them (`rg -l "findYamlParserLoads|hasYamlBundleSignature"`); the "vendored parser is gone"
     file check is covered by the `loadAll` signature pattern.
   - `test/holder-lock/driver-unavailable.test.mjs`: delete only the source-scan part (around 127-140); keep the runtime proof that a second `take()` is refused.
3. No product code changes in this part. A debt entry is a recorded leak, not a fix.

## Files

- Create: the report.
- Modify (part B): `docs/platform/component-boundary.md` (the lines that name the retired guard tests point at the `doors` rows), `docs/architecture-manifest.json` (`doors` rows), `test/architecture.test.mjs` (YAML rule out),
  `test/holder-lock/driver-unavailable.test.mjs` (scan part out, around 127-140), `test/suite-baseline.json` (row 188).
- Delete (part B): `test/process/one-door.test.mjs`.
- Tests retired: the three old guards above; new owner: the `doors` check in `test/architecture.test.mjs` with the rows named.
- Net size: about -150 test lines, +90 manifest lines.

## Acceptance

- Part A: the report lists every prior-art answer and U1-U8 with `file:line`, plus the baseline numbers; any fact that
  contradicts a later phase's design reaches the F0 lead before wave B starts, with the phase and line it changes.
- Part B: the six rows pass on the integration head; the old checks are gone; `rg -l "process/one-door.test.mjs|findYamlParserLoads" test scripts docs`
  shows only history records.

## Gates (part B)

- `node scripts/run-tests.mjs test/architecture.test.mjs test/holder-lock/driver-unavailable.test.mjs test/setup/git-mutation-census.test.mjs test/scripts/doc-health.test.mjs test/scripts/test-proof-inventory.test.mjs`
- `test/suite-baseline.json:188` names `test/process/one-door.test.mjs`: remove the row; check `test/scripts/test-proof-inventory.test.mjs` for others.
- One-door scan count not above baseline.

## Risk and rollback

- A census pattern over- or under-matches on today's head (M x M): part B re-runs every pattern with the real check and records the final lists.
- Rollback: revert part B (the old guards return); part A has nothing to roll back.
