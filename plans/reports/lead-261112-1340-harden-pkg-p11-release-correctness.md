# Packaging P11: release correctness

Branch `harden/pkg-p11-release-correctness` (rebased on P06, `d9324ff13`). State: landed after P06 and the legacy-config migration fix (owner option 1), so the proof is green.

## 1. What changed

- **Plugin version follows the product.** `scripts/prepare-release.mjs` rewrites every `plugins/*/.claude-plugin/plugin.json` `version` with the release base version (and lists them in the `git add` line). Both manifests are `0.2.0` now (were `1.2.0`, `1.0.0`). Q-C default taken: CHANGELOG line says reinstall the plugin once.
- **A release needs the whole suite.** `ci.yml` gains `workflow_call` with a boolean `release-gate`; `release.yml` has a `suite` job (`needs: check-version`, calls `ci.yml` with `release-gate: true`) and `publish` is `needs: [assets, suite]`. Graph: `check-version -> {assets, suite} -> publish`. With the gate the selector-plan, related and compare jobs are skipped (they tune PR feedback; compare writes issues). `suite` carries `issues: write` because a called workflow's static permission check counts `compare`'s grant even when it is skipped.
- **Consumer proof, both scripts** (`scripts/ci-external-consumer.sh`, `.ps1`): after init `fgos doctor --json` must report `data.ok: true` (fgctl on PATH as the installer says); a new upgrade step; a final `fgctl uninstall --dry-run` (changes nothing) then `--yes` (installation gone, `.fgos/distribution.json` and config kept, `uninstall-backup-*/activation.json` exists). `GH_TOKEN` is set on the proof steps in `release-assets.yml` and `ci.yml`.
- **Previous-tag resolution** (`scripts/previous-release-tag.mjs`, new, 93 lines, reuses `parseReleaseVersion`): newest published release (`gh release list`) that parses as a release version and is not the candidate, by semver precedence. The proof logs `Upgrade proof: previous release <tag> -> candidate <tag>`, refuses a previous equal to the candidate, refuses a previous whose manifest digest equals the candidate's, checks the downloaded assets against the previous `SHA256SUMS`, and asserts the project's activation sits on the previous artifact before upgrading. Exit 3 = no earlier release (the proof skips with a message); a `gh` failure is exit 1 and fails the proof. Only a machine with no `gh` and no `CI` skips.
- **Upgrade assertions:** `fgctl upgrade` exits 0; activation `artifactDigest` equals the candidate manifest digest and differs from before; `previousArtifactDigest` equals the old digest; the project's own config file (`config.yaml` or `config.json`, whichever the previous init wrote) is byte-identical; `fgctl verify` passes; no failing `config-*` doctor row afterwards (owner option 1). The digests are read from `activation.json`, the record `fgctl status` prints from; I did not parse `status` text because P06 edits that arm.
- **Two doctor rows fixed** (owner approved): `trust-store-readable` and `agent-cli-project-trusted` were `fail` on a machine with no claude, codex or agy, so `ok` could never be true on a clean runner. They now `skip` when the guarded CLI is not installed (`isCommandAvailable`, the lookup P01 rows use); a present CLI without a trust entry still fails. CHANGELOG names both rows.

## 2. Proof

- **Red then green:** `prepare-release.test.mjs` "product version, newest CHANGELOG release heading and every plugin manifest version agree" failed on the old tree (`1.0.0`/`1.2.0` vs `0.2.0`), and the fixture test "prepareRelease moves every plugin manifest" failed (`1.2.0` kept). Green after the change (13 tests). Doctor-row tests (2) red against the old source, green after.
- **Previous tag proven:** `previous-release-tag.test.mjs` (5 tests): the repo's real tag list (`archive/*`, `documentation-authority-phase-*`, `pre-tsk-3ce`, `v0.1.0`, rc.1-5) with candidates `v0.2.0-assets-check`, `v0.2.0`, `v0.2.0-rc.6` all give `v0.2.0-rc.5`; semver order (`rc.10` above `rc.9`, a release above its prereleases); the command with a stub `gh` (list, none, failing). Live: `node scripts/previous-release-tag.mjs --candidate v0.2.0-assets-check` printed `v0.2.0-rc.5` against the real repo.
- **`release-assets-check` (local):** the workflow cannot run here as a whole. Ran its pieces on this tree: `cargo build --locked --release --workspace` green; `package-release-assets.mjs --version v0.2.0-assets-check` green; the workflow's focused Node test list (+ architecture, doc-health, decision-citation, setup, release tests): 336 tests, 335 pass, 1 fail = the known document-identity citation drift. **Not runnable locally:** the glibc ceiling check (`check-glibc-ceiling.sh` fails here: this machine builds against GLIBC_2.39, the workflow builds on ubuntu-22.04 for 2.35), `cargo deny` (not installed), every Windows job, the nested `ci.yml` call (needs Actions). The workflow needs a PR run for those.
- **Consumer proof, Linux, real run** (clean PATH without agent CLIs, scratch HOME, real `gh` download of rc.5, logs `/dev/shm/pkg-p11-proof3-*.log`): install, init, version, ready, **doctor `ok: true`**, no-op upgrade, repair, verify pass; previous release resolved to `v0.2.0-rc.5`, installed with its own `install.sh`, `init --from` its fgos asset passed. **The upgrade step is RED today** (below). With the upgrade skipped in a scratch copy, the uninstall step passed (dry run changes nothing; `.fgos/installation` gone; `distribution.json` kept; backup record present): `/dev/shm/pkg-p11-proof4-*.log`.
- **Windows script not run** (no PowerShell here). Written to the same shape, reviewed by eye; the first PR run is its first proof. Its doctor smoke on a Windows runner is unmeasured.
- Full `npm test` is not run yet; it runs after the rebase onto P06 and the migration fix, before landing.

## 3. The red upgrade: reproduction for the migration lead

```sh
mkdir -p /dev/shm/rc5/{home,dl} && cd /dev/shm/rc5
gh release download v0.2.0-rc.5 --repo vantt/forgent --dir dl --pattern 'fgos-*linux-gnu.tar.gz' --pattern 'fgctl-*linux-gnu.tar.gz'
tar -xzf dl/fgctl-*.tar.gz -C dl && git init -q proj && chmod 700 .
export HOME=/dev/shm/rc5/home FGOS_STATE_HOME=/dev/shm/rc5/state FGCTL_ALLOW_ROOT=1 PATH=/usr/bin:/bin:$NODEDIR
cd proj && ../dl/fgctl init --from ../dl/fgos-*.tar.gz        # rc.5 writes $HOME/.fgos/config.json (gateway.token) and .fgos/config.json
CAND=<dir with the candidate fgctl and fgos asset, from: node scripts/package-release-assets.mjs --version v0.2.0-assets-check --out <dir>>
$CAND/fgctl upgrade --from $CAND/fgos-*.tar.gz; echo $?
```
Result: activation moves to the candidate, then `fgos: event-store-config: config-key-in-wrong-file global:config.json:4:5 gateway.token` / `Error: tail command 'init' failed with status 1`, exit 1. `fgos doctor --fix` clears it; afterwards doctor fails `config-format-legacy-json` for the project `.fgos/config.json` rc.5 wrote until `fgos config migrate`. After the rebase onto P06 (`d9324ff13`) the same step still ends in exit 1 but the tail message is `fgos: event-store-config: config-legacy-shadowed .fgos/config.json` (log `/dev/shm/pkg-p11-proof5.log`); the doctor smoke before it passes. The proof asserts exit 0 and no failing `config-*` row, so it is red until the migration lead lands. Note the `FGOS_STATE_HOME` directory needs mode 700 or the git driver refuses it.

## 4. Net lines (measured, `git diff --numstat origin/main...HEAD`, census and CHANGELOG excluded)

| Part | Estimate | Measured |
|---|---|---|
| Node production (`prepare-release.mjs` +23, `previous-release-tag.mjs` +93) | about +20 | +116 |
| Node production for the two doctor rows (`agent-cli-trust.mjs`, `registrations.mjs`) | not in the phase | +23 -10 |
| YAML (`ci.yml`, `release.yml`, `release-assets.yml`) | about +10 | +31 -2 |
| Shell and PowerShell (`.sh` +202 -7, `.ps1` +116 -3) | about +90 | +318 |
| Tests (`prepare-release` +35, `previous-release-tag` +78, `release-packaging` +12, doctor rows +41) | about +25 | +166 |

The estimate was low. The previous-release resolver needs a real semver compare (shell `sort -V` ranks `rc.5` above the release), which is most of the Node growth; the proof's assertions (digest of both sides, checksums, config byte check, doctor, uninstall) are most of the script growth, doubled across two shells. The two doctor rows were unplanned.

## 5. Notes for the big lead

- Landing order: P06, the migration fix, then this branch. When P06 gives "activated but not ready" exit code 2, the scripts should test that code: they do not match that text today, so there is nothing to change unless a proof step reads it.
- Needs OPC review before landing (release and install surface).
- `plans/.../phase-11` says shell and PowerShell "about +90"; reality above.

## 6. One agent CLI is enough (added after P07's finding)

- `seat-binding-dry-bind` (`src/setup/seat-binding-checks.mjs`): a seat refused with `cli-missing` (every candidate runs an absent CLI, e.g. the red-team seat with only claude installed) is no longer a policy failure; the row passes with a message starting `warning:` that counts the seats and names the CLI to install (read from bind's own refusal detail, no new probe). Test red first on the committed config with a PATH holding only claude (11 seats refused), green after; it also pins the warning text.
- `fgos --version` (`apps/fgos/src/main.rs`) prints `fgos <version>`; `fgos version` keeps the envelope. The Rust test that asserted "flag equals verb" is replaced by one asserting the one line equals `fgos <data.packageVersion>` of the verb. `cargo fmt`, clippy `-D warnings`, `cargo test -p fgos --test cli_tests` (50), msvc and aarch64-apple-darwin `cargo check` are green; first-run-guide and help tests (28) pass.
- **Acceptance, scratch HOME with a stub `claude` and the claude account block from the P27 guide** (dedicated `claude-login` with a stub `.credentials.json`, `accounts.yaml` as in the guide): `fgctl init --from <candidate fgos>` printed `Ready: fgOS active (...)`, exit 0; `fgos doctor --json` `ok: true` with warnings only (including the new seat-binding warning naming `pi`). Two things the stub exposed, not bugs of this change: with a stub that cannot answer `claude plugin marketplace list --json`, `claude-plugin-marketplace` fails ("failed to run or parse"), and `trust-store-readable` fails with ENOENT when claude is installed but `~/.claude.json` does not exist yet (claude creates it at first login). A real claude answers the first and has made the second file before an account exists. If a machine with claude installed and never run should also pass, `trust-store-readable` should skip on an absent file; not changed, say if wanted.

## 7. Final verification (after the migration fix, main `ba1569a92`)

- **Live proof, Linux, real `gh` download of rc.5, clean PATH, scratch HOME:** the whole consumer proof exits 0 (`/dev/shm/pkg-p11-proof7.log`): doctor `ok: true`; previous release `v0.2.0-rc.5`; rc.5 installed with its own installer; the candidate `fgctl upgrade` exits 0 and activates the candidate; `gateBypass.level: light` and `ironLaw.level` read back equal through `fgos config show --json`; no failing `config-*` doctor row (so no `config-key-in-wrong-file`, no `config-legacy-shadowed`); `fgctl verify`; uninstall dry run and `--yes`. By hand on the same pair: the migration printed `Note: ~/.fgos/config.json moved; projects on an older release refuse until `fgctl upgrade``; the gateway token in rc.5's JSON equals `~/.fgos/private/gateway-token` afterwards (read from the `config-migrate` backup), so it is not regenerated; the global and project JSON are tombstones pointing at `config.yaml`.
- **One more proof fix found by that run:** the upgrade section shared HOME and state with the candidate flow above it, so rc.5's global `config.json` met the candidate's `config.yaml` (`config-legacy-shadowed`). A consumer upgrading has only the old release's home; the upgrade section now runs in its own HOME and state in both scripts, and calls `fgctl upgrade` with fgctl on PATH. On this machine the proof needs `umask 022` (a 0775 state directory is refused by the git driver); GitHub runners use 022.
- **Full `npm test`** (`/dev/shm/pkg-p11-full-174335.log`): 8858 tests, 8825 pass, **2 fail**, no run-tests ERROR line: the V7n addendum (known) and `check-decision-citation-drift` "CLI run against the real repo root, with the checked-in baseline, exits 0".
- **That citation drift is on main, not from this branch.** This branch changes no file under `docs/` and none of the checker or its baseline (`git diff origin/main --stat -- docs scripts/check-decision-citation-drift.*` is empty). The 5 findings are all in `docs/platform/documentation/subcomponents/document-identity/spec.md`: ADR0035 (line 52), ADR0055 (206), RUL84 (207, 550 twice), cited without a gloss. They come from the identity spec's own commits of 2026-11-12 (`22b5219a9` 11:21 worked locate examples, `3a02fd712` 11:47 three tiers, `3a04159b6` 17:23 measured design), which add citations and no baseline entries. It was already red before this work started (it was red in my first focused run at `9d17cfee5` too). Fix belongs to the documentation lane: add a one-line gloss to each citation, or rebase the checker baseline.
- Rust gates on the rebased tree: `cargo fmt --all --check`, clippy `-D warnings` on `fgos`, `cargo check -p fgos` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: green. Net diff `origin/main...HEAD`: 24 files, no unexpected deletions (census regenerated by its script).

## Authority

- **"Is this CLI installed on this machine" for a doctor row** belongs to `src/runner/paths.mjs` (`isCommandAvailable`); the rows now call it; two rows still decided from config alone before this. The check modules (`registrations.mjs`, `agent-cli-trust.mjs`) should each ask it per executor command; `trust-store-readable` asks for the literal name `claude` because the row has no executor in hand.
- **Which tag is the previous release** has one owner now, `scripts/previous-release-tag.mjs`, used by both consumer scripts. Release version syntax stays in `prepare-release.mjs` (`parseReleaseVersion`); the resolver imports it.
- **The plugin version** is a second copy of the product version; its owner is `prepare-release.mjs`, guarded by the agreement test. The longer-term owner is the version in `package.json`.
- **Where a legacy config is migrated on upgrade** has no owner today: rc.5 wrote files the candidate refuses, and the upgrade tail exits 1. It belongs to the Config component through the upgrade path (the migration lead).

## Lessons

- I wrote the doctor-row source before its tests and proved red by stashing the source. Writing the test first costs the same.
- The first live run of the proof found three real things in an hour (two doctor rows, the upgrade break). A proof that has never run against the previous tag proves nothing; run it live before writing the second shell's copy.
- `HOME` override does not fully isolate fgOS on this machine (a doctor message named the real `~/.local/bin`); I checked mtimes under the real home after each run. A scratch-home helper that also fails on any write outside it would remove that worry.
- A pre-commit census refusal fires on every touched file that holds a `git` string, including shell scripts and `prepare-release.mjs`: regenerate with `--write-census` before the first commit of a script change.
- The Bash privacy hook blocks a command whose text mentions an optional-chain `env` property; use the Edit tool for those edits.
