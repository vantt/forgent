# CLI rejects unknown flags

## Prior art

- `parseArgs` in `bin/fgos.mjs` arrived with the first CLI door and has never validated flag names; `git log -S"unknown flag"` over `bin/fgos.mjs`, `src/cli`, `apps/fgos` finds nothing. Strict parsing was never there and never removed.
- The only existing rejection was `fgos --help`'s own `unknown option` (`refuseHelp`, exit 4), and each Rust native parser rejects its own unknown options.
- `test/cli/subcommand-flag-drift.test.mjs` already keeps sub-verb schemas equal to what handlers (and, for native verbs, the Rust sources) read. This work reuses that registry quality bar for the non-sub-verb verbs.

## Mechanism (one list, two enforcement points)

- `src/cli/flag-check.mjs` (kernel layer): `acceptedFlags(entry, positional)` = global `dir|json|help` + the verb's registry `parameters.properties` (for sub-verb verbs: the first positional's own schema) + `retiredFlags`. `unknownFlagMessage` builds the error.
- `bin/fgos.mjs` `main()`: one block between help handling and `dataDir()` (6 lines + import). Throws `StoreError('validation', ...)`, which is the same path as a missing required flag, so exit 4. `faultClass: 'unknown-flag'` goes to the invocation fault log. Skips `nativeOnly` verbs, `hook` (raw argv), and a missing/unknown sub-verb (the handler's own or retired-door message wins, e.g. `dispatch execute` removal pointer).
- Message: `unknown flag "--x" for "fgos <verb> [sub]". Valid flags: ... --dir, --json. See "fgos <verb> --help".`
- Rust host: `scripts/export-command-selectors.mjs` projects the same `acceptedFlags` into `command-routes.json` for native routes (`accepted_flags`, or `subcommand_flags` per sub-verb). `apps/fgos/src/main.rs` `unknown_native_flag` checks `--` tokens (name stops at `=`, bare `--` ends flags) before the native provider runs, exit 4, same message shape.
- `retiredFlags: ['tier']` on `add|submit|discover|edit`: accepted by the check so the handlers' existing "`--tier` is retired, use --size/--rigor" hint still shows.
- Known limits: nested modes inside one sub-verb (`dispatch reconcile plan|apply`) share the sub-verb's schema; a flag value that itself starts with `--` is read as a flag (same as the old parser); `--name=value` is refused by legacy-node verbs with a hint (the old parser stored it under the key `name=value`, i.e. ignored it).

## Inventory

Static scan of `runVerb` case bodies (following `flags` into `bin/fgos.mjs` helpers and `src/verbs/state/edit.mjs`) plus a repo-wide `flags.<x>` scan, compared with the registry. Flags read but undeclared, now ADDED to the registry (not rejected):

- add: step, domain-fields. submit: unattended, refs, parent, footprint, targets, urgent, goal-tier. discover/plan: worktree. move: override-reason.
- edit: role, duplicates, domain-fields, goal-tier, superseded-by, verify-from-children, verify-from-targets. resolve-park-reason: role.
- ask: source. answer: rationale, alternatives, source. handoff: open-sync-depth. decision: kind. list: id, fields. ready: phase. schedule: candidates. run: stance-options. pick: via.
- return: no-new-commits-ok, worker-verified-sha, no-timeout. approve: trust-dir, no-timeout. sync-root: trust-dir, github, pr, acknowledge-drift, no-timeout. promote-to-component: trust-dir. catchup: no-timeout.
- topic: entities, into, sources, topic-id, purpose-slug, purpose-title, new-purpose-slug, new-purpose-title, new-topics, target-topic. doc: role, framework, mode, lifecycle, aliases, topic-id, doc-path, doc-id, source-captures, new-path, superseded-by. knowledge: doc-path, capture-id.
- version (Rust-read): runtime-json.
- Global (every verb): `--dir` (the shell integration appends it), `--json`, `--help`.
- Callers: scanned core/, scripts/, .githooks/, docs/how-to, domains/, src/, bin/, examples/, README, install.sh for `fgos <verb> ... --flag`. After the registry additions the only undeclared hit was `version --runtime-json` (scripts/ci-external-consumer.sh), now declared; everything else was prose/message text. One caller used a silently ignored flag: `test/cli/dispatch-reconcile.test.mjs` passed `--assignment` to `dispatch reconcile plan` (the flag a prior change dropped); removed. Generated surfaces were not touched (no skill text changed).

## Tests

- `test/cli/unknown-flag-rejection.test.mjs` (registry driven, 150 cases): per verb (every sub-verb) accepts all declared flags + globals; real `node bin/fgos.mjs <verb> [sub] --no-such-flag-xyz` exits 4 naming the flag; `--dir` accepted everywhere; `--name=value` hint; native route projection equals the registry; Rust host rejects an unknown flag on every native verb/sub-verb and accepts `--dir` (runs when `FGOS_HOST_BIN` is set).
- Updated: `test/cli/fgos-manifest.test.mjs` (allows `retiredFlags` key), `docs/architecture-manifest.json` (new kernel file), `dispatch-reconcile.test.mjs` (dropped ignored flag).

## Full suite

`npm test` with `FGOS_HOST_BIN` = fresh release build of this worktree (own CARGO_TARGET_DIR, `target` symlinked so fgctl is found), session env unset: 7961 tests, 7874 pass, 1 fail, 11 skipped (final run). The one failure, `real concurrency: two independent ready items dispatched in ONE runOnce overlap in wall time` (`test/runner/loop.test.mjs`), is a wall-clock overlap check: it passes alone (`--test-name-pattern`) and failed only while another suite run shared the machine. First run had 87 failures: ~75 were fgctl tests missing `target/release/fgctl` (environment), the rest were real and fixed (architecture manifest row, registry key set, `dispatch execute`/`tool register` retired-door messages pre-empted by the flag check -> unknown sub-verb now skips the check, reconcile test flag).

## Risks

- Any external script passing a flag the handler reads only through a path the static scan missed would now fail with exit 4; the message names the flag and lists valid ones, and the fix is one registry line.
- `bin/fgos.mjs` edit is the import line plus one block before `dataDir()`; trivial to rebase over the lock phase's edits.
- Invocation-fault records from rejected calls land in the store the cwd resolves to (gitignored).
