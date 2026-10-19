# Git phase 02, unit 4: re-check fixes

Branch `git/p02-scope-refs`. No staging or commit. `impact-analysis: inactive` (zero registered providers). The report path was obtained through `fgos convention path` with the brief’s timestamp. Reused the existing config parser, hardened driver, WAL digest/chain reader, Publication recovery and doctor registry. History identifies the transfer-target regression in `ac848d750`; credential-helper suppression predates it (`694ac49f9`, extended by `9c8308897`).

- **H-A:** Both transfer kinds omit empty `targets`, preserving historical hashes. Replaced the serde-only test with real historical-shape WAL bytes and old canonical digests: one-record Intent and two-record Intent/Prepared chains for fetch and push inspect and scan clean, then abandon under the same authority. Attempted historical transfers recover as Unknown without resending, retain terminal replay, and never become superseded/config-approved. Existing rule 4/4a/4b/4c vectors remain in the required suite. Negative control: temporarily removing the omission reproduces `Corrupt("version/hash/chain")`; the fix was restored before validation.
- **M-A:** Trust comes from Git’s `--show-scope`, never origin paths. Only system/global/command are trusted; every other scope refuses. The same read-only Rust query serves admission and doctor. Real vectors cover a linked handle with main `config.worktree`, a symlinked checkout spelling, and a symlinked local config file; no remote ref changes.
- **M-B:** Registered `git-transport-config` diagnoses refusing keys without values, with actions/checkout `persist-credentials: false` and trusted-global credential guidance. Local helpers still refuse. To make the chosen remedy real, trusted global helpers pass preflight and transfers no longer clear them; the private-HOME regression proves global compatibility and a real Remote inspection while local helpers still fail. Inherited `GIT_*` overrides remain scrubbed. Updated CHANGELOG, Git spec and canonical doctor inventory; no new config default, dependency, bypass or target-directory script.
- **L-A/C/D:** Spec records the extra push advertisement, Publication target tuple’s local resource key/remote-old/local-next meaning, terminal rejection without atomic fallback, and continued fetch installs after a failed CAS.
- **L-B:** A Remote WAL inspect error now returns typed RecoveryRequired instead of Refused.

Validation: all required commands passed:

```sh
cargo test -p fgos-holder-lock -p fgos-git -p fgos-node-addon -p fgos-event-store
cargo clippy -p fgos-holder-lock -p fgos-git -p fgos-node-addon -p fgos-event-store --all-targets -- -D warnings
node --test test/git/*.test.mjs test/setup/*git*.test.mjs test/architecture.test.mjs
node --test test/setup/registrations.test.mjs
git diff --check
```

Node required suite: **50 passed, 1 Windows skip**. Doctor registry: **58 passed**. Rust and clippy exit 0; standalone addon harness warnings about unavailable Node-API symbols are expected outside Node, with real addon behavior covered by the passing Node suite. Logs: `/tmp/fgos-u4-cargo-test.log`, `/tmp/fgos-u4-clippy.log`, `/tmp/fgos-u4-node-test.log`, `/tmp/fgos-u4-registrations.log`.

`npm test` cannot start: EROFS opening `/home/vantt/.local/state/fgos/locks/full-suite.lock`; no gate was bypassed. MDView preview failed because its database is read-only. Host/platform durability and non-Linux behavior are not certified here.

Out-of-scope edits: none. The required program-board lane update is outside the write scope and remains for the coordinator: `plans/261017-1313-fgos-platform-program-board/plan.md`.

Status: DONE_WITH_CONCERNS
Summary: Fixed the re-check findings with historical WAL recovery, scope-based transport trust and actionable CI diagnostics.
Concerns/Blockers: Full npm verification needs a writable host; coordinator owns the excluded program-board update.
Context refs:
- (none)
