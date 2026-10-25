# Mailbox V5 closing report: the native hook door

Branch `mailbox/v1-v3`, not merged into main. Plan: `plans/261023-0013-mailbox-v5-native-hook-door/`. Spec: `docs/platform/agent-mailbox/spec.md` (§4.1, §6.1, §6.2, §6.4, §7.1, §7.5, §11, §12, §14, §16, §17).

## What V5 delivers

- **The product hook door.** `fgos hook mailbox --cli <claude|codex> --event <stop|post-tool-use>` runs natively in the Rust host, before the composition root. The route table declares this split: the `hook` selector carries `native_kinds: ["mailbox"]`. Every other hook kind still reaches legacy-node unchanged. The legacy payload answers `mailbox` quietly (exit 0).
- **The product verbs.** `fgos mailbox send`, `inbox` and `inbox --claim` are native operations with contract text, a `--json` envelope, and exits 0/1/4. `send` reports the recipient's CLI version (the untested-version and version-unknown clauses).
- **A correct entry in a real hook environment.**
  - The record root is the main checkout's `.fgos`, found from `CLAUDE_PROJECT_DIR` or the cwd by the disk-only `fgos_git::main_checkout_root`.
  - The per-CLI caller check uses measured facts (`hookFacts`).
  - The Codex head is accepted by its executable, and its writer key comes from the payload.
  - Runner heads stay quiet.
  - A `PostToolUse` drain claims only what fits each CLI's measured bound (8,192 bytes), plus a pointer line for anything held back.
  - Further: a limits loader over the contract and the project config; a circuit breaker; the entry is quiet when `HOME` is unset; the record is opened only after the caller check.
- **Install and setup.** `src/setup/agent-hooks.mjs` is one table. It holds the mailbox rows for Claude Code (guarded, never `exec`) and Codex (plain shim form), ownership by exact command, and a doctor probe of the mailbox kind. The `mailbox.*` keys register into `fgos setup` from the limits contract.
- **Live proof through the product door.**
  - L1 and L2 (Claude Code) passed every check.
  - C1 (Codex) passed every check, the Stop gate included, on its authorized re-run.
  - The no-mail hook p95 inside each CLI is 26.5 ms (Claude Code) and 38.1 ms (Codex), against the 50 ms target, with the builtins-only shim.
- **Retired:** the V4 test-only entry `examples/mailbox-test-hook.rs` and its process test `tests/test_hook_entry.rs`, and the V4 live cases and demos.

## Commits per phase

| Phase | Commits |
|---|---|
| 1 Sync and preconditions | merge `811e545a7` (notes in the phase file) |
| 2 Measurements | `ecdb84f3d` (recorder modes), `1966d3574` (report), `39e2552ea` (bound raised to 8,192 after the re-run), `484d40352` (census) |
| 3 Contracts and core | `e7cdb847b`, `eedbb3935` |
| 4 Store: loader, breaker, runner heads, claim | `c2d26b518`, `bc4abcfee` |
| 5 Store: ancestry, caller check, head finders | `58aaaafa2`, `5ed25bf20`, `c91d29ede` |
| 6 Host: native kind and verbs | `bd9b6343f` (Git), `3f853e4eb`, `4cde1feee`, `8cbe26710`, `35c0ca241` (notes), `20f2c93aa` (version vector) |
| 7 Install table, config, doctor probe | `fd473def5`, `4bc78a9d2`, `cc30b2c63`, `4242de8b7`, `e39781c0e` (notes) |
| 8 Live suite and hook cost | `83e9f04c1`, `dc8e92240` and `72042d720` (shim, for DIST), `ed6fa1cb9`, `a9ccbecf1` (report), `5d664f0ff` (re-run authorization), `c8b91e93b` (re-run results) |
| 9 Docs, gates, closing | `30c247443` (docs), `4d01de59d` (recorder stub moved out of shipped scripts), `17359341b` (formatting), `ced3cf78e` (gate fixes), this report and the journal |

Mutants: 92 hand mutants killed in total, and 2 equivalent survivors (named in the phase files):

| Phase | Killed | Equivalent |
|---|---|---|
| 3 | 26 | 0 |
| 4 | 29 | 1 |
| 5 | 11 | 0 |
| 6 (Git) | 3 | 0 |
| 6 (host) | 9 | 1 |
| 7 | 10 | 0 |
| 8 (shim) | 4 | 0 |

## Tests per file (owners)

| File | Tests | Owns |
|---|---|---|
| `apps/fgos/tests/mailbox_routes.rs` (new) | 10 | the native kind spawns no Node child; other kinds reach legacy; usage errors, no repository and `HOME` unset exit 0 with empty stdout; the record root from a linked worktree, a subdirectory and `CLAUDE_PROJECT_DIR`; the verbs as processes |
| `packages/git/rust/tests/inspect.rs` (extended) | 7 | `main_checkout_root`, no spawn, no write |
| `packages/mailbox/rust/store/tests/ancestry.rs` (new) | 2 | the ancestry reader |
| `packages/mailbox/rust/store/tests/limits_loader.rs` (new) | 7 | the loader; drift against the shared config fixture |
| `packages/mailbox/rust/store/tests/hook_shell.rs` (extended) | 22 | breaker, bounded step claim, runner head, lazy record open, panic and budget exits (taken over from `test_hook_entry.rs`) |
| `packages/mailbox/rust/store/tests/head.rs`, `head_finder.rs` (extended) | 6, 10 | caller check from `hookFacts`, Codex head by executable, the shared config-directory resolver |
| `packages/mailbox/rust/store/tests/verbs.rs` (extended) | 8 | `inbox --claim`, the version reader |
| `packages/mailbox/rust/core/tests/delivery.rs`, `report.rs` (extended) | 20, 10 | bounded claim, pointer line, version clauses |
| `test/rust-host/command-routes.test.mjs` (extended) | 16 | only `hook` carries `native_kinds`, exactly `mailbox` |
| `test/setup/agent-hooks.test.mjs` (extended) | 20 | the table, the mailbox rows, ownership, wrong shape, probe |
| `test/setup/registrations.test.mjs` (extended) | — | the config registration from the contract |
| `test/cli/dispatch-retired-doors.test.mjs` (extended) | 1 new | the legacy payload answers `hook mailbox` quietly |
| `packages/distribution/rust/src/shim.rs` (extended) | 2 new | the builtins-only shim |
| Retired: `packages/mailbox/rust/store/tests/test_hook_entry.rs`, `examples/mailbox-test-hook.rs` | — | now owned by `hook_shell.rs` (the shell) and `mailbox_routes.rs` (the entry as a process) |

## Gates

Fresh main `a7d508e8a` was merged as `be86b9695`. Each gate ran alone, with memory checked before it.

| Gate | Result |
|---|---|
| `cargo test --locked -p fgos-mailbox -p fgos-mailbox-core -p fgos -p fgos-identity -p fgos-observe -p fgos-host-runtime -p fgos-git -p fgos-distribution -- --test-threads=4` | exit 0; 934 passed, 0 failed, 10 ignored |
| `cargo test --locked --workspace --no-fail-fast -- --test-threads=4` | exit 0; 1625 passed, 0 failed, 12 ignored |
| `cargo clippy --locked --workspace --all-targets -- -D warnings` | exit 0 |
| `cargo fmt -p fgos-mailbox -p fgos-mailbox-core -- --check` | exit 0 after `17359341b`. `fgos`, `fgos-git` and `fgos-distribution` have the same unformatted hunks as clean main (127 / 376 / 22 on main); the branch's own extra hunks were formatted. |
| `npm test -- --test-concurrency=4` (branch, at `17359341b`) | 8733 tests: 8611 passed, 24 failed |
| `npm test -- --test-concurrency=4` (clean `a7d508e8a`, sibling worktree) | 8712 tests: 8596 passed, 18 failed |
| Failures on the branch only, all fixed or explained | (1) Two architecture tests: `src/setup/mailbox-limits.mjs` had no manifest row. Fixed in `ced3cf78e` (row `infra`). (2) `assignment-enumerator-guard`: the recorder's own run-directory listings were not allow-listed. Fixed in `ced3cf78e` (allow-listed with a reason). (3) `install-packaging` e2e: EISDIR, caused by three symlinks in this worktree's gitignored live evidence copy under `.fgos/runtime/tmp`, not by code. The links were removed and their targets logged; the file then passes 5 of 5. (4) Two `provider-capacity` account-lock tests: they pass alone (39 of 39 in that run), so they are load flakes. The three fixed files pass through the repository test door (48 of 48). |
| Failures on both, not fixed here | 18 titles: the `fgctl` init, upgrade, repair and download cases and the holder-lock gate case (`untrusted-driver-directory … mode 0775` under this machine's group-writable umask), and the codex model-placeholder case in `test/runner/dispatch.test.mjs`. `active-release-drift-check` now passes on the branch, after HARDEN's `4003c00a4`. |
| `node scripts/git-one-door-scan.mjs --check` | exit 1 on both the branch and clean main, with the same 5 `unresolved-binary` sites in `bin/fgos.mjs`, `src/runner/merge.mjs` and `src/runner/worktree.mjs`. The 3 sites the branch had added in the recorder were removed in `4d01de59d`. |
| `node scripts/export-command-selectors.mjs --check` | exit 0 |
| `fgos convention check` on the rung's new files | 0 violations (main checkout's host) |

## Live invocations: 15 CLI processes

| Run | Spawn marker (UTC) | What it settled |
|---|---|---|
| Phase 2: P1–P5 | 2026-10-22 19:00:06Z to 19:02:28Z | Hook and tool process facts, the hook cwd, the first ladders |
| Phase 2: P3b, P5b | 19:46:46Z, 19:47:15Z | Per-hook, not summed, context threshold |
| Phase 8: L1 | 20:27:16Z | Claude Code, every check passed |
| Phase 8: L2 | 20:27:40Z | Claude Code, every check passed |
| Phase 8: C1 | 20:27:55Z | Codex; Stop check not observed |
| Phase 8: T1 | 20:28:33Z | Claude Code p95 68.4 ms, old shim |
| Phase 8: T2 | 20:31:21Z | Codex p95 78.1 ms, old shim |
| Re-run, authorized (ceiling 15): C1 | 21:00:10Z | Every check passed, Stop gate included |
| Re-run, authorized: T1 | 21:00:46Z | Claude Code p95 26.5 ms |
| Re-run, authorized: T2 | 21:03:10Z | Codex p95 38.1 ms |

Every run used benign content and had a dry run first. There were no retries. The Codex login guard passed before and after every Codex run. Every Claude Code case removed its `~/.claude/projects` directory. No shared activation, `~/.fgos`, `fgctl`, or shim of a real workspace was touched.

## What happened, in plain words

The mailbox now has a real front door. A Claude Code or Codex session calls `fgos hook mailbox` after each tool and when it stops. The Rust host answers that call itself, without starting Node, and hands every other hook kind to the old path.

The first measurement said each hook call cost 68–78 ms. Two thirds of that was the small shell script every workspace uses to find its release: it started four helper programs per call. Rewriting that script to use only shell built-ins brought the cost to 26.5 ms in Claude Code and 38.1 ms in Codex, inside the 50 ms target. The host itself (about 17 ms) is now the largest part.

The Codex Stop check first failed for a timing reason in the harness. With the harness fixed, it passed.

## Hook cost against 50 ms

| CLI | Old shim, steady p95 | Builtins-only shim, steady p95 (N) | Largest remaining part (p50 / p95) |
|---|---|---|---|
| Claude Code 2.1.308 | 68.4 ms | **26.5 ms (99)**, met | host 17.4 / 24.0 ms |
| Codex 0.161.0 | 78.1 ms | **38.1 ms (99)**, met | host 17.4 / 25.6 ms; then the user's `zsh -c` 3.6 / 9.9 ms |

All figures were taken under strace, with one run per CLI and shim.

## The shim change: a distribution-component change

`dc8e92240` and `72042d720` change `packages/distribution/rust/src/shim.rs`, which belongs to the distribution component. **They need DIST review before any merge.** The change rewrites the workspace shim's `sh` body to use shell builtins only.

Behaviour stays the same with one exception: a line in `activation.json` that ends in a carriage return now matches, where before it never did. Everything else is kept:

- the first matching line wins;
- spaces and trailing commas are accepted;
- a `\r` inside a value is dropped;
- backslashes become slashes and repeated slashes collapse;
- the four refusal messages and exit 3 are unchanged.

A workspace whose shim an older `fgctl` wrote will be reported as different by `check_workspace_shims` until `fgctl repair` rewrites it. That applies only once a release carrying this change is activated. No real workspace's shim was touched on this machine.

## For OPC `forgent-35`: the Git diff

- `bd9b6343f`:
  - `packages/git/rust/src/driver.rs`: the free function `pub fn main_checkout_root(start: &Path) -> Result<Option<PathBuf>>` is cut out of `resolve_topology`. It canonicalizes, walks up to `.git` or a bare layout, and validates gitfile → admin dir → `commondir` → back-link, refusing a broken back-link as `untrusted-worktree`. `resolve_topology` now calls it.
  - `packages/git/rust/src/lib.rs`: the export.
  - `packages/git/rust/tests/inspect.rs`: one new test.
  - The function has no subprocess, no lock and no write.
- `17359341b`: `rustfmt` of that one test function only.
- `packages/git/contracts/mutation-census.v1.json`: regenerated in several commits; the last is `4d01de59d`.
- Spec line: `docs/platform/git/spec.md` §3 (2026-10-23 paragraph).

## V6 precondition (review H2), verbatim

"V6 must not run adversarial or untrusted peer content until the live harness runs the CLI confined (bwrap with the case directory writable and `~/.claude` limited to what the CLI needs) or without permission bypass, and cleans `~/.claude/projects/<case>` after each case (review H2)."

## Open items

- **V6:** behavioural measurements through the real hook (the stop rule), after the H2 precondition.
- **V7:**
  - the Codex and agy adapters as supported;
  - `list` and `status`;
  - the minimal doctor check;
  - the `CHANGELOG.md` line;
  - item 8 for `list`.
- **Idle wake:** no rung owns it yet (owner question 1).
- **`tsk-43x4`:** the Git component's state root becomes relative to the cwd when both `HOME` and `XDG_STATE_HOME` are unset. Owned by the Git lane, not fixed here. The mailbox hook is quiet when `HOME` is unset.
- **Two residuals stated in the spec:** (1) a user whose `$SHELL` is `/bin/sh` weakens the Claude Code caller check to a topology guard; (2) a model that `cd`s outside the repository gets `[record.error]` from the verbs.
- **Main-side gate failures:** the 18 titles above, and the 5 one-door scan sites.

## Owner questions still open (spec §16, items 22–24)

1. Which rung builds the wake channel. Default (a): V7.
2. Whether to install the mailbox hook by default once the lane merges. Default (a): at merge, after every machine has a release with the native kind.
3. The 50 ms target. Met after default (a) was applied; the owner only needs to confirm the shim change, which DIST reviews.

## Evidence

- Measurement report: `plans/reports/research-261023-0148-mailbox-v5-measurements.md`.
- Live suite report: `plans/reports/research-261023-0345-mailbox-v5-live-suite-and-hook-cost.md`.
- Raw evidence (gitignored, this machine): `.fgos/runtime/tmp/mailbox-v5/evidence/{p2,p2b,p8,p8b}/`.
- Gate logs: kept in the session scratchpad, not committed.
- Journal: `plans/journals/journal-261023-0353-mailbox-v5-native-hook-door.md`.
