# Report: project shim path and activation record through host-bin-path

## What changed

- `src/util/host-bin-path.mjs` now owns `projectShimPath(root)` and `PROJECT_SHIM_RELATIVE` (`.fgos/installation/bin/fgos`, derived from the one spelling in `projectShimPath`).
- `src/setup/agent-hooks.mjs`: `getProjectShimPath` removed (one door; its only other user was its own test, moved to `projectShimPath`). The Claude shim variable form, the shim-prefix and guard-pattern regexes, the reversal mention, and the generated extension text (mailbox walk-up with its owner/mode check, and the tool-call shim) are all built from `PROJECT_SHIM_RELATIVE`. The generated extension bytes are unchanged.
- `src/setup/managed-timer.mjs`: shim from `projectShimPath`, keeps its fallback to the resolved release path.
- Route clients (`holder-lock/driver.mjs`, `seat-binding/client.mjs`, `terminal-control/client.mjs`, `run-supervisor/client.mjs`, `util/session-identity.mjs`): untouched. They share `resolveActiveHostBin` and differ in protocol, version rule and error code on purpose; the census rank 10 item is closed as legitimate.
- `doors` row "installation shim and activation record location" added.
- `packages/git/contracts/mutation-census.v1.json` regenerated with `--write-census` (payload digests of the three changed files; no site added).

## Doors row, final lists (re-run with the real check)

- allowed: `src/util/host-bin-path.mjs`; `packages/distribution/rust/src/{init,lib,shim,uninstall,fgctl_refresh}.rs`; `apps/fgctl/src/help.rs`; `src/setup/project-launcher.mjs`; with reasons: `bin/fgos.mjs` (error text names the shim, never builds or reads it), `scripts/check-hook-registrations-guarded.mjs`, `scripts/ci-external-consumer.{sh,ps1}`, `scripts/fgos-shell-integration.sh`, `scripts/lib/mailbox-behaviour-run.mjs`, `scripts/lib/mailbox-live-confined.mjs`, `scripts/record-mailbox-hook-fixtures.mjs`.
- debt: `src/setup/registrations.mjs` (doctor rows read activation.json; moves after the capability plan rewrites the file); `packages/herdr-fgos-common/rust/src/fgos.rs` (builds the shim path itself; moving it needs a dependency on the distribution crate, which changes Cargo.lock, so it moves with the Rust shim-path owner in the host foundations step).
- Patterns also catch the Node `'.fgos', 'installation'` spelling and the Rust `.join("installation")` form. The markdown copy in `core/skills/_shared/fgos-cli-fallback.md` is named in the row reason.
- Not in the row: `apps/fgos/src/legacy_exec.rs` (matches only in comments/test code, so listing it was stale) and `src/setup/bin-discovery.mjs` (already reads through `hostBinFromActivation`; only a comment names the file, so its planned debt entry was stale).
- `agent-hooks.mjs` and `managed-timer.mjs` do not match.

## Gates (logs in /dev/shm/odd-p12-gate*.log)

- All `*.test.mjs` importing host-bin-path, agent-hooks, managed-timer or project-launcher: 217 tests, 0 fail.
- `test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`, `test/setup/git-mutation-census.test.mjs`, `test/git/one-door.test.mjs`: pass.
- `check-decision-citation-drift`: no new findings. `git-one-door-scan`: 0 undeclared sites.
- No Rust touched.

## CHANGELOG

No user-visible change; no line.

## Lessons

- The one-door scan resolves a spawned binary by evaluating its path expression; a spread over a split constant (`...X.split('/')`) made it report an unresolved binary. Keep the literal path parts in the function the scan follows and derive the relative string from it.
- A door row's planned debt entry can be stale on arrival: check each entry against the real check before writing it.
- In zsh an unquoted `$files` is one argument; use `${=files}` or the runner silently runs one file.

## Authority

None added.

Status: DONE
Summary: shim path and activation record location are known once in Node; doors row lands with one debt entry.
