# Phase 00: Facts (prior art, what exists, what is missing, what is reused, enumerated readers)

Status: facts gathered 2026-10-23 by the planner; the executor re-verifies each line with `rg` / `git log -S` before relying on it (scout summaries go stale). No code. Suggested executor: haiku for the re-run, sonnet for the enumerations.

## Context

AGENTS.md asks a plan's facts phase to answer: what existed before, which change removed it, and was that intended.

## Prior art

| Question | Finding | Evidence |
|---|---|---|
| Was there ever a private directory, an accounts file or a migration mechanism? | No. `git log -S'.fgos/private'` and `-S'accounts.yaml'` hit only the Config spec (`6db41fad6`, `3c4930691`), the Slice B plan and the lock-registry row (`541251f93`). Config migrations so far were ad hoc: `.fgos/runtime/config-backup-261022-1038/` (SEAT), `~/.fgos/config.json.bak-20261021-llmaccounts` (owner machine). | commands run 2026-10-23 |
| Who introduced the gateway token and its doctor row, and was keeping it in config intended? | `e980eb2bb` (2026-08-14, tsk-4r1): "register gateway.token/port in the setup/doctor gate". Config was the only place a per-machine value could live then. The move is intended (spec section 8, owner 2026-10-22, backlog p-a189ff31). | `git log -S'fixGatewayTokenConfigured'` |
| Who introduced `hostRead: blind` and the hidden-root mechanism, and why only run state? | `0486c9647` (peer run state) and `8301d83ca` (blind inputs as copies). The list names run-state directories only because tracked files live under `.fgos` (spec 9.2 reason 1). A home-directory token was never needed until now. | `git log -S'BLIND_HIDDEN_ROOTS'`; spec 9.2 |
| Account inventory history | `bc57e8550` added `runner.llmAccounts` beside `runner.providers.<p>.accounts`; both are global-only today by reader rule (`provider-capacity.mjs:54-60`, `llm-accounts.mjs:60`). | `git log -S'llmAccounts'` |
| Was a main-checkout resolver in Rust already written? | Yes: `RepoHandle::trusted_main_root` used by `packages/identity/rust/src/project.rs:144-160`. Reuse (D22); do not write a second one. | `rg trusted_main_root` |
| Was the tombstone idea tried? | No older mechanism. The text constant exists in the crate: `packages/config/rust/src/files.rs:12` (`TOMBSTONE`), already recognised as "no source" by `select_source` (`files.rs:113`). | `rg TOMBSTONE` |

## What exists vs what is missing

| Item | Exists | Missing |
|---|---|---|
| Crate (Slice B, 2,372 source lines, 2,679 test lines) | `snapshot` (`snapshot.rs:369`, reads project, trusted project, global, accounts when `Unconfined`), `commit_observed` (`write.rs:141`, targets Project/Global/Accounts, refuses legacy JSON via `current()` `write.rs:101-125`), grammar (`grammar.rs`: `doc_lines`, `parse_block`, `Reason::suggested`), `files.rs` (`select_source`, `read_beneath`, `check_mode`, `TOMBSTONE`, mode constants), `redact.rs` (`render_for_display`), `locks.rs` | No token file, no private-dir ensure, no accounts-only read, no move, no migrate, no doc scan or refresh, no findings engine, no verbs, no door, no `session_class` |
| Durable File | `install_once_with_mode`, `replace_durably_with_mode`, `open_beneath`, `ensure_dir_beneath` (`packages/durable-file/rust/src/{lib,beneath}.rs`) | nothing needed |
| Standard and schemas | `core/config-schema/*.schema.yaml` (16 files), `core/config-standard/*.yaml` (15 files), `gateway.token` marked `x-fgos-file: token`, `runner.llmAccounts` and `providers.*.accounts` marked `x-fgos-file: accounts` (authoring_equivalence test cases) | nothing needed (executor verifies the annotation names with `rg 'x-fgos-file' core/config-schema`) |
| Confinement | `BLIND_HIDDEN_ROOTS` (`resources.mjs:26`), `requestIsBlind` (`:35`), `resolveBlindHiddenRoots` (`:197`), masks only in the blind branch (`drivers/bwrap.mjs:574-589`), `hidden-root` resources reach `attestation.hiddenRoots` (`authority.mjs:97-98`), probe 9 `probePeerRunHidden` (blind only, `probes/harness.mjs`), built-in policies `host-write-denied`, `workspace-write` both `hostRead: allow` (`policies.mjs:27-66`) | machine-private list, always-on mask, probe for it, a session marker |
| Native door | addon modules `packages/git/node-addon/src/{session_identity,durable_file,canonical_json}.rs` (44, 46, 13 lines), `versions()` (`lib.rs:24`) and the ABI check in `src/native/door.mjs` (the `v.sessionIdentity` line), `installOnce` export (`door.mjs:89`) | namespace `config` |
| Native verbs | convention and identity verbs as the pattern: catalog descriptors (`packages/host-runtime/rust/src/catalog.rs`), projector (`apps/fgos/src/cli_projector.rs`, 698 lines), provider with a crate feature (`packages/identity/rust/Cargo.toml` `[features]`, `src/provider.rs` 389 lines), route annotation (`command-route-annotations.json`) and registry entry (`src/cli/command-registry.mjs`), generated `command-routes.json` (`scripts/export-command-selectors.mjs`) | no `config` selector (`python3` over `command-routes.json`: absent) |
| Doctor | `registerCheck`/`registerFix` (`src/setup/registrations.mjs:177,223`), per-area modules (`seat-binding-checks.mjs`, `identity-checks.mjs`), `checks.mjs` is a 25-line shim, setup runs `runFixes(repoRoot)` (`bin/fgos.mjs:4072`) and seeds `ensureSharedConfigDefaults(os.homedir(), {layer:'global'})` (`bin/fgos.mjs:4051`) | `config-*` rows, `config.check` caller |
| Token today | `checkGatewayTokenConfigured`/`fixGatewayTokenConfigured` (`registrations.mjs:2932,2948`), default `{port, token: null}` (`:2970`), gateway read `apps/fgos-gateway/src/gateway.rs:136-173` (reads `~/.fgos/config.json`, `section.token`) | token file |
| Accounts today | readers take a `runnerConfig` parameter; sources: `loadRunnerConfig` assembly (`src/runner/dispatch/config.mjs:402`, `:458`), direct global reads `src/verbs/dispatch/inspect.mjs:34`, `reconcile.mjs:33,72`, `src/setup/registrations.mjs:2101,4284,4536`, `src/setup/model-pool-checks.mjs:175`; consumers `llm-accounts.mjs`, `provider-capacity.mjs`, `bind.mjs`, `explain.mjs`, `account-pin.mjs`, `account-rotation.mjs`, `case-start.mjs`, `provider-credential-renewal.mjs`, `provider-account-probe.mjs`, `run.mjs:168`. A writer round-trips the global file: `src/setup/bin-discovery.mjs:110-121` | accounts file readers |

## Reuse (say it in each commit)

`fgos-yaml-doc` (parse, `Document` edits, comment blocks, `merge`), `fgos-config` as landed (snapshot `build`, `commit_observed`'s `edit` and `validate` extracted, grammar, files, redact, locks), `fgos-durable-file` (create-only and replace installs, open and ensure beneath), `fgos-holder-lock` (`project-config`, `global-config`), `fgos-canonical-json::canonical_json` (migration equivalence), `fgos-git` `trusted_main_root`, `fgos-identity` `WriterIdentity`/`resolve_current`, the identity provider and projector patterns, `installOnce` in the Node door, the confinement `hidden-root` resource, `--tmpfs` and `--remount-ro`, the probe harness and its falsifier pattern.

## Not reused, with reason

`src/config/*` and `mergeConfigDefaults` (Node, deleted by Slice C; this slice adds one function beside them, `withMachineAccounts`, and removes no JavaScript merge); `fgos-secrets` `FileSource` (its format is `NAME=value` lines, the token file is one bare line); a spawned `fgos` from Node (owner decision: door only).

## Steps for the executor

1. Re-run every `rg`/`git log -S` above; replace stale line numbers; record results for `rg -n "readSharedConfig" src bin --glob '*.mjs' | wc -l` (the reader count G-D1 quotes).
2. **Enumerate, do not hand-wave (account readers):** list every Node site that reads an account inventory or `gateway.token`: `rg -n "llmAccounts|providers\??\.\[?\w*\]?\??\.accounts|\.accounts\b|gateway\??\.token" src bin apps --glob '!target' --glob '*.{mjs,rs}'`. For each site record: file:line, whether it reads the merged runner config or the raw global file, whether it also writes. The phase 13 edit list is exactly this list.
3. List every registered config default that seeds a `global-only` or `x-fgos-file != config` key: read `assembleRegistryDefaults` (`registrations.mjs` at `:256`) and each `registerConfigDefault` (14 calls: lines 2359, 2671, 2693, 2725, 2784, 2790, 2832, 2898, 2970, 3368, 3406, 3695, 4490, 6351 as of planning) against the schemas' `x-fgos-scope`. `ensureSharedConfigDefaults` seeds every default into both the project and the global file (the `layer` option changes only the runner section, `:279`). The `gateway` default is the known case; any other goes to Ideas I6, and is retired in phase 12 only if it carries a moved key.
4. List the confinement tests that pin argv or probe counts: `rg -n "tmpfs|--remount-ro|unshare-pid|hiddenRoots|8 falsification|runAllConfinementProbes" test --glob '*.mjs' -l` and the docs that say "8 probes" or "ninth probe" (`docs/specs/confinement-authority.md:1239`, `:1351`). That list is phase 02's pin list.
5. Measure D5: `cargo tree -p fgos-config -e normal --jobs 4 | wc -l` and `cargo tree --manifest-path apps/fgos-gateway/Cargo.toml -e normal | wc -l`, and the gateway's `cargo build --release` wall time (record, do not optimize). Verify `RepoHandle::trusted_main_root` is `pub` and reachable from `apps/fgos` and the addon; verify `rustix` features available to read `/dev/urandom`-class randomness or choose `std::fs` on `/dev/urandom` (Unix) for the token (Windows unsupported, G4).
6. Run `fgos tool query --capability impact-analysis --status present`; record `full | degraded | inactive`. `free -g`; record available memory. Create the linked worktree and branch `cfg/slice-d`; merge `origin/main`; run `node "$(find . -path '*/node_modules' -prune -o -path '*/.git' -prune -o -path '*/backups' -prune -o -name set-active-plan.cjs -print 2>/dev/null | head -1)" plans/261023-1627-yaml-config-slice-d-migrate-and-machine-files`.
7. Read the board's "File chung dễ va" rows for: `src/setup/registrations.mjs`, `packages/host-runtime/contracts/command-route*.json`, `apps/fgos/src/main.rs`, `docs/platform/*/spec.md`, `CHANGELOG.md`; confirm `src/runner/dispatch/confinement/**` has no lane holding it (`git log -5 -- src/runner/dispatch/confinement` names MP-B2 and OPC, both done). Post the start line at the top of `plans/261017-1313-fgos-platform-program-board/log.md` (lane CFG, Slice D, shared files named, confinement files named, G6 first).
8. Run the read-only sweep that phase 08 and the risk table promise: with the Slice B crate (a throwaway example or test in scratch, not committed), parse and `check` every config file the owner's machines hold (this repository's project and global file, the three other workspaces named in the board: forgentX, mdview, mcp-skill-hub); record per file: parse ok, schema findings (path and keyword only, never a value). Keep the output for phase 08's decision on row severities.

## Validation

All lines re-verified; stale ones corrected; the reader list, the confinement pin list, the D5 numbers and the sweep recorded. No tests.

## Risk / rollback

No risk (documents only). Rollback: delete the edits to this file and the board line.
