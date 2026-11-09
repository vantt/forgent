# Audit: fgOS packaging and distribution against cs-packaging-distribution

Date: 2026-11-09 (Asia/Saigon). Code audited: `origin/main` at `eca97c5fe` (it includes the `fgctl` self-refresh `74d794cee..a6be2ec8b`). The main checkout was 30 commits behind, so it was not used.
Standard: skillstation hub `skills/default/cs-packaging-distribution` (SKILL.md, common/00..90, languages/rust, node, polyglot, channels/agent-host-plugin, references.md, templates/project-checklist.md).
Scope: install.sh/install.ps1, the release pipeline, `fgctl`, the pin, `fgos setup/doctor/config/uninstall`, the npm channel, the Claude plugin marketplace, agent-CLI hooks and skills, multi-machine use, the recovery how-to, `--help`/`--json`, and error messages. No code was changed and no test suite was run.

## How the live check ran

- Scratch folder: `/home/vantt/projects/forgent-worktrees/pkg-audit-261109-1535/`, removed at the end with one guarded `rm -rf`. `HOME`, every `XDG_*`, `TMPDIR` and `DBUS_SESSION_BUS_ADDRESS` pointed into it, and `PATH` excluded the real `~/.local/bin`. Afterwards the real `~/.local/bin/{fgctl,fgos}`, `~/.claude/settings.json`, `~/.gemini/antigravity-cli/settings.json` and the release store all had their earlier mtimes, so nothing outside the scratch folder changed.
- Hard-coded paths outside `HOME`: none on the install path. One hazard: `src/setup/mailbox-sync-timer.mjs` calls `systemctl --user` and `launchctl`, but only when cross-machine mail is enabled. The fake DBus address blocked it anyway.
- No network. A `file://` mirror served the real `install.sh` from the audited tree, a tarball of this machine's `fgctl`, and the staged release `sha256:cbae6142…` repackaged as `fgos-v0.0.0-audit-x86_64-unknown-linux-gnu.tar.gz` (17 MB compressed, 47 MB unpacked), with a `SHA256SUMS`. The release store was only read.
- Timings:

| Step | Command | Time | Result |
|---|---|---|---|
| 1 | `install.sh --help` | 0.03 s | Help is ignored; it starts installing and dies with a raw `curl: (37)`, exit 37 |
| 2 | `cat install.sh \| FGCTL_VERSION=… FGCTL_ASSET_BASE_URL=file://… sh` | 0.10 s | Installed; next step printed as bare `fgctl init` |
| 3 | `FGCTL_VERSION=0.0.0-audit` (no `v`) | — | 404-style failure: no `v` normalisation |
| 4 | `fgctl --version` | — | Prints usage, exit 1. fgctl has no version |
| 5 | `fgctl init` (download + checksum + stage + tail) | 15.4 s | Exit 0, **stdout empty**: no "Ready", no next step |
| 6 | `fgos doctor` | 3.7 s | 50 KB JSON, 109 checks, **5 fail**, exit 0 |
| 7 | `fgos setup` (README step 3) | 0.5 s | Writes two header-only config files; reports the 5 hosts as "wired" again |
| 8 | `fgos doctor --fix` | 3.9 s | The same 5 checks still fail, exit 0 |
| 9 | `fgos doctor --strict` | 3.6 s | Exit 1 |
| 10 | `fgos run "Say hello in one word"` (read-only) | 2.0 s | Exit 11, `execution-failure`; the only cause is in `.fgos/assignments/…/stderr.log`: `agent omp did not start` |
| 11 | `fgctl init` again | 8.9 s | Silent; re-runs the whole tail |
| 12 | `fgctl repair` / `fgctl verify` | 9.3 s / 0.07 s | repair silent; verify prints one line |
| 13 | `fgctl upgrade` (same release) | 9.7 s | Silent: no "already up to date" |
| 14 | Teammate clone with this repo's committed digest-only pin | 0.01 s | `pinned release … is not staged … and no --from source was provided` |
| 15 | `fgos uninstall --yes` | <1 s | Removes nothing that the release install created |

Friction recorded on the way: a 4-command README path after install, an undocumented Node prerequisite, a silent `init`, a doctor that is red right after `init` while `init` reports success, a `run` failure without a fix, global agent config written without being asked (F10), and nothing to uninstall.

## 1. Verdict per tier

| Tier | Verdict | Why |
|---|---|---|
| 1 User experience | **Fail** | Installing `fgctl` is fast (0.1 s) and checksummed. Install to first value is not closed: README needs 4 commands plus an unstated Node ≥18; `fgctl init` ends silent with 5 failing checks; the first `fgos run` fails with no fix; the release defaults route to the owner's CLIs and accounts. The command surface is not agent-native: no `--version` (fgos or fgctl), usage errors exit 4 or 1, per-verb help is one paragraph, doctor JSON has no `fix`/`ok`/`next`, `fgctl <verb> --help` is "Unknown option". |
| 2 Safety | **Fail, strong core** | Inside `fgctl` the integrity model is good: a content digest, manifest re-hash, quarantine, an activation lock, atomic publish with a previous digest, and a verified `fgctl` refresh. But `fgctl init` silently writes global agent configs for hosts that are not installed, including `toolPermission: always-proceed` for agy. Release downloads accept `http://`, where the same-origin checksum then proves nothing. No uninstall reverses a release install. |
| 3 Correctness | **Partial** | One version for npm and Cargo, a tag==version gate, a cargo-deny gate, consumer proof under sh, PowerShell 5.1 and 7, and an independent addon digest comparison. Against that: the plugin is 1.2.0 while the product is 0.2.0 (the standard's own "Avoid" example), the release does not need the test suite, there is no upgrade-from-previous-tag test, installers are outside `SHA256SUMS`, and drift between the pin and the activation is reported nowhere. |
| 4 Fast and light | **Pass with notes** | Install 0.1 s, doctor 3.7 s. Re-runs with nothing to do still take about 9 s (`init`, `repair`, `upgrade` re-run the tail). The release is 17 MB compressed against a 120 s wall-clock `curl --max-time`, so a link under about 1.2 Mbit/s cannot finish the download. The release profile has `strip` but no LTO or `codegen-units=1`. |

## 2. Checklist (templates/project-checklist.md, filled)

# Packaging checklist — fgOS (forgent)

Skill: cs-packaging-distribution. Priority: UX → safety → correctness → fast and light.
Archetype: **B, manager + runtime** (`fgctl` + per-project pinned `fgos` release; per-project runtime identity and a Node payload make A impractical). Started from: forgent itself (it is the reference for archetype B).

### Decisions (UX first)

| Decision | Current choice | Assessment |
|---|---|---|
| Tagline | "The Foundation for Generative Agents." | About the technology, not the user's pain or gain (ONB-01). |
| Quick-start promise | None | No "from nothing to X in N min, you need Node ≥18 + git" (ONB-06). |
| Verbs | fgctl: stage/status/init/upgrade/repair/verify. fgos: setup (deprecated), doctor [--fix/--strict], config, uninstall, version, 80 verbs in all | Missing: `--version` on both, `fgctl self-update`, `fgos update` forwarding, `config edit`, `paths`, `status` fast summary. `setup` is still a documented step. |
| `init --yes` alone yields a working setup? | No | `fgctl init` then `fgos setup` then `fgos doctor`; doctor stays red. |
| Install one-liner | `curl -fsSL …/releases/download/<tag>/install.sh \| FGCTL_VERSION=<tag> sh` | The tag is typed twice because installers are not stamped (REL-08). |
| Dependency budget | sh, curl/wget, tar, sha256sum/shasum; runtime: **Node ≥18, git, curl** | README says "Nothing needs a clone, npm or a Rust toolchain" and never mentions Node. |
| Config format | YAML, header-only files, `fgos config standard/show/explain/set` | No `config edit`; `set` needs `--reason`; typos accepted. |
| Version source · targets · naming | package.json = Cargo workspace; linux-gnu x64 (glibc 2.35 ceiling), windows-msvc x64; `<kind>-<tag>-<triple>.tar.gz` | No linux arm64, no macOS. |
| PATH policy · signing · agent hosts | A (print export) · checksums only, no signatures · Claude Code, Codex, agy, omp, pi | Hosts are wired whether or not they are installed. |

### Rules: MUST plus adopted SHOULD (pass / partial / fail)

Tier 1, first contact (03)

| Rule | Lvl | Status | Evidence |
|---|---|---|---|
| ONB-01 | MUST | partial | README.md:1-9: name and tagline present; a 5-badge backlog row comes before the tagline; no link to the quick start; the tagline is not about the user |
| ONB-04 | MUST | partial | Order is Install → Setup → Doctor → Config → Uninstall; no Why/features; env precedence and npm/legacy detail sit in README instead of docs/installation.md (README.md:72-122) |
| ONB-06 | MUST | **fail** | No promise line; Node ≥18 required by the release manifest (`requires.node`, scripts/build-rust-distribution.mjs:472) and by init's node check (packages/distribution/rust/src/init.rs:371), never stated in the README |
| ONB-07 | MUST | partial | README.md:22-29 one-liner present; the tag appears twice; steps have no "what it achieves" lines |
| ONB-08 | MUST | **fail** | 4 commands after install (README.md:25-28); the live run reached no first value (step 10 failed) |
| ONB-09 | MUST | **fail** | No CI extraction of README blocks; README.md:114-122 tells npm users to run `fgos init`, which on that channel is not the onboarding verb |
| ONB-10 | MUST | **fail** | `fgctl init` stdout empty (live step 5); run_tail captures output and prints only on failure (init.rs:565-596) |
| ONB-12 | MUST | **fail** | Installer says `fgctl init` (install.sh:204-206), README says 4 steps, init says nothing |
| ONB-14 | MUST | **fail** | run failure only in a log file; `git-publication-refspecs` message is a byte array; `config-comment-reason-required` gives no fix |
| ONB-16 | SHOULD | gap | Doctor text carries `tsk-2ej`, `tsk-1xm`, `tsk-1dj`; Vietnamese strings reach users (`fgos: "config" chỉ có ở Rust host`, tier definitions in `dispatch explain`) |

Tier 1, command surface (07)

| Rule | Lvl | Status | Evidence |
|---|---|---|---|
| CMD-01 | MUST | partial | `fgos setup` still writes config files outside the doctor registry; hooks already go through registered fixes |
| CMD-02 | MUST | pass | doctor is read-only by default (RUL109, live: no writes seen in plain doctor runs) |
| CMD-03 | MUST | **fail** | init exits 0 while 5 checks fail; no "Ready"; re-run is silent and takes 8.9 s |
| CMD-04 | MUST | **fail** | `fgos setup` is visible in help and a required README step (README.md:27) |
| CMD-05 | SHOULD | gap | No fast `status` with one next command |
| CMD-06 | MUST | **fail** | `fgos --version` → `unknown verb`, exit 4; `fgctl --version` → usage, exit 1; `fgos version --json` has `gitCommit: null` and no release digest |
| CMD-07 | MUST | **fail** | `--pretty` instead of a TTY default; `--json` is a no-op on many verbs; no `--dry-run` on uninstall; `NO_COLOR=1` ignored (live) |
| CMD-08 | MUST | **fail** | Usage error = 4 (bin/fgos.mjs:4608) or 1 (fgctl main.rs:31); doctor exits 0 with failures; `fgctl` with no args exits 1 |
| CMD-09 | MUST | partial | ANSI codes are written to a non-TTY stdout; fgctl upgrade's refresh lines go to stdout, other fgctl progress to stderr |
| CMD-10 | MUST | **fail** | Errors without a fix: `not a git repository`, digest-only pin (live step 14), `config-comment-reason-required`, refspec byte array (src/setup/git-checks.mjs:101) |
| CMD-11 | MUST | partial | One envelope `{contract, generated_at, data_hash, data}` everywhere in fgos, but no `ok/error/next`; fgctl `--json` is a bare object; fgctl errors are plain text |
| CMD-12 | SHOULD | gap | No "did you mean" (`fgos doctr` → unknown verb) |
| CMD-15 | MUST | **fail** | `fgos` with no args → `unknown verb ""`; `fgos --help` is 513 lines, not task-ordered |
| CMD-16 | MUST | **fail** | `fgos doctor/init/uninstall --help` are 4 lines each: no flags with defaults, examples or exit codes; `fgctl upgrade --help` → `Unknown option: --help` |
| CMD-17 | MUST | pass | Nothing prompts; uninstall requires `--yes` |
| CMD-18 | MUST | **fail** | Doctor JSON has no fix per check; after `--fix`, 5 checks remain with no machine-readable next step |
| CMD-19 | SHOULD | gap | No "Agents / automation" section |
| CMD-22 | MUST | pass | Settings change through `fgos config set/unset/patch` |
| CMD-24 | MUST | not verified | — |

Tier 1, ease (05)

| Rule | Lvl | Status | Evidence |
|---|---|---|---|
| UX-01 | MUST | **fail** | Targets: x86_64 linux-gnu and windows-msvc only (.github/workflows/release-assets.yml:37-42) |
| UX-02 | MUST | pass | 0.10 s from the mirror, no questions |
| UX-03 | MUST | partial | PATH line printed (install.sh:196-201); `fgctl --version` does not work |
| UX-04 | MUST | partial | `fgctl upgrade` per project, and it now refreshes fgctl; `fgos update` does not exist and does not forward |
| UX-06 | SHOULD | gap | No update hint |
| UX-07 | MUST | partial | Node is unavoidable; init and doctor check it (`node-version-and-git`), but the user is not told up front |
| UX-08 | MUST | partial | No `openssl` fallback (install.sh:143-148), and a missing hash tool is reported as "checksum verification failed"; fgctl downloads need `curl` (no wget) |
| UX-10 | MUST | **fail** | Release standard routes `execute` to gemini via `omp` (`dispatch explain`), declares `ak:cook` skills and `z-ai@thehive` pools; on a clean machine doctor fails and run fails |
| UX-11 | MUST | partial | The generated file is a header plus `see: fgos config standard`; no commonly changed keys |
| UX-14 | MUST | **fail** | `fgos config edit` → unknown subcommand |
| UX-15 | MUST | **fail** | `config set dispatch.cancelWaitM …` writes the typo; `config check` warns `unknown` with `fix: null`; no suggestion |

Tier 1, install scripts (30)

| Rule | Lvl | Status | Evidence |
|---|---|---|---|
| INS-01 | MUST | partial | README uses release URLs (good); spec.md:62 still shows `raw.githubusercontent.com/…/main/install.sh`; not version-stamped |
| INS-02 | MUST | **fail** | install.sh is top-level code, no functions; last line is `echo "  fgctl init"` (install.sh:206). install.ps1 is correct (function + try) |
| INS-03 | MUST | partial | Allow-list plus MSYS → ps1 redirect; an unsupported target gets no source-build pointer |
| INS-04 | MUST | **fail** | Env vars only, no flags, no `--help`, `0.2.0` not accepted, `FGCTL_ASSET_BASE_URL` means a repo root for "latest" (install.sh:75) and an asset directory for downloads (install.sh:103); tag not validated (ps1 validates, install.ps1:89) |
| INS-05 | MUST | pass | Redirect-based latest (install.sh:81) |
| INS-06 | MUST | **fail** | No `candidate --version` before `mv -f` (install.sh:182-185); fgctl has no version to check |
| INS-07/08 | SHOULD | gap | No ownership marker, no `.rollback` |
| INS-09 | MUST | pass | `~/.local/bin`, `%LOCALAPPDATA%\fgos\bin`; root refused (install.sh:5) |
| INS-10 | MUST | pass | Policy A, prints the export / SetEnvironmentVariable line |
| INS-12 | MUST | partial | No `paths --json`; the launcher dir is found by bin discovery |
| INS-13 | MUST | partial | Small, but prints a bare `fgctl init` even when the dir is not on PATH |
| INS-15 | MUST | **fail** | No `--uninstall` |
| INS-17 | MUST | pass | TLS 1.2, Get-FileHash, System32 tar (install.ps1:34,118,126) |

Tier 1, self-update, config, doctor, agents (40/50/60/80)

| Rule | Lvl | Status | Evidence |
|---|---|---|---|
| UPD-01 | MUST | **fail** | The refresh replaces any running fgctl outside the store; no marker (fgctl_refresh.rs:80-190) |
| UPD-02 | MUST | pass | Refresh re-hashes the manifest and checks the fgctl digest twice (fgctl_refresh.rs:88-120) |
| UPD-03 | MUST | partial | `DEFAULT_RELEASE_REPO_URL` hard-coded (fetch.rs:17), not from `CARGO_PKG_REPOSITORY`; env override exists |
| UPD-04 | MUST | partial | The refresh compares digests only, so a project on an older release downgrades the machine fgctl |
| UPD-05 | MUST | pass | Real release format |
| UPD-06 | MUST | partial | `.prev` backup, durable rename and restore exist; no `staged --version == target` step |
| UPD-10 | MAY | done | Exact-digest pin, repair and verify |
| CFG-01 | MUST | **fail** | Config in `~/.fgos/` (not `$XDG_CONFIG_HOME`); state in XDG_STATE; Windows store under `%USERPROFILE%\.local\state` (holder-lock state_root.rs:84); a relative `XDG_STATE_HOME` is accepted |
| CFG-02 | MUST | partial | Two variables for one root: `FGOS_STATE_ROOT` and `FGOS_STATE_HOME` (state_root.rs:72-77) |
| CFG-03 | MUST | **fail** | No `paths --json` |
| CFG-04/05/07/08/12/13 | MUST | pass | Precedence documented; `config standard` from the binary; gateway token 0600 under `~/.fgos/private`; malformed refuses; wrong-file check; generated token |
| CFG-06 | MUST | partial | agy settings written with a plain `writeFileSync` (src/setup/agy-permissions.mjs:142) |
| DOC-01 | MUST | **fail** | Checks carry `id, description, passed, message, detail`; no `status` (warnings are text inside passing checks), `critical`, `fix` or `creates` |
| DOC-02 | MUST | **fail** | `doctor --fix` exit 0 with 5 failing checks; README.md:157 documents "exits 0 whatever the checks say" |
| DOC-03 | MUST | pass | Read-only by default |
| DOC-04 | SHOULD | done | `registerCheck`/`registerFix` registry |
| DOC-05 | SHOULD | partial | Hooks are executed with harmless input ("verified runnable"); no check for pin ≠ active, update available, or leftovers like `fgctl.prev` |
| AGT-01 | MUST | **fail** | All 5 hosts wired, plus `~/.gemini/antigravity-cli/settings.json` and `~/.claude/settings.json` written, with none of claude/codex/agy/omp/pi on PATH (live) |
| AGT-02 | MUST | pass | One table in src/setup/agent-hooks.mjs, described in spec §6 |
| AGT-03 | MUST | partial | The Claude settings writer keeps other keys and refuses an unreadable file; the agy writer has no backup, no compare-and-swap, not atomic |
| AGT-04 | MUST | pass | Hooks call `${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos` |
| AGT-07 | SHOULD | done | Skills rendered from one source with generated stamps; unstamped same-name dirs refused (f00e9de5e) |
| AGT-08 | SHOULD | partial | Hooks are project-local and verified; `dispatch-decide` and `decision-question` lack the `[ -x "$S" ] \|\| exit 0` guard the other hooks have |

Tier 2, safety (00/25/70/85)

| Rule | Lvl | Status | Evidence |
|---|---|---|---|
| PRN-03 | MUST | **fail** | Global agy and Claude settings written for hosts not installed; the Claude plugin marketplace is added from GitHub `vantt/forgent` (registrations.mjs:2033,2117) |
| PRN-04 | MUST | **fail** | Outside-project writes (global agent configs, the machine fgctl swap) have no plan, dry run or confirm |
| PRN-05 | MUST | pass | Activation: lock, re-read under lock, atomic publish, previous digest, repair |
| PRN-06 | MUST | pass | Manifest digest mismatch refused; quarantine on stage |
| PRN-07/08 | SHOULD | gap | Silent global edits; agy `always-proceed` widens permissions |
| SEC-01 | MUST | partial | Exact filename match (install.sh:129, fetch.rs `find_checksum`); no openssl fallback; the first match wins instead of requiring exactly one |
| SEC-02/03 | SHOULD | gap | No cosign, provenance or SBOM |
| SEC-04 | MUST | **fail** | `http://` accepted (fetch.rs:136; install.sh via `FGCTL_ASSET_BASE_URL`; install.ps1:14); no per-asset byte cap |
| SEC-05 | MUST | partial | fgctl's extract.rs refuses absolute, `..` and link entries; install.sh uses plain `tar -xzf` and a `find … \| head -1` fallback that picks any `fgctl` in the archive (install.sh:158-172) |
| SEC-06 | SHOULD | done | `cargo deny` job in release-assets.yml |
| SEC-07 | MAY | done | Content-addressed `artifactDigest` |
| UNI-01 | MUST | **fail** | `fgos uninstall` only reverses legacy setup (core.hooksPath, rc lines); no `fgctl uninstall`, no `install.sh --uninstall` |
| UNI-02 | MUST | **fail** | After `fgos uninstall --yes`: `.claude/.codex/.agents/.omp/.pi` hooks and 21 skills ×2, `.fgos/installation`, `~/.local/bin/{fgos,fgctl}`, global agent settings and the release store all remain |
| UNI-03 | MUST | **fail** | `--dry-run` is an unknown flag |
| UNI-04 | MUST | pass | Fill-only for what it does touch |
| UNI-05 | MUST | partial | Says it never touches `.fgos`; no `--purge`, no list of where data lives |
| SVC-* | — | n/a mostly | No daemon in the install path; the gateway runs through `fgos gateway start`; the mailbox timer is a doctor fix only when cross-machine mail is on (not audited further) |

Tier 3, correctness (10/20/90, overlays, channel)

| Rule | Lvl | Status | Evidence |
|---|---|---|---|
| VER-01/02 | MUST | pass | package.json 0.2.0 = Cargo `[workspace.package]` 0.2.0; release.yml `check-version` |
| VER-03 · POLY-02 · CH-PLUGIN-01 | MUST | **fail** | plugins/fgOS/.claude-plugin/plugin.json `1.2.0`; scripts/prepare-release.mjs never touches it; no drift test |
| VER-04 | SHOULD | gap | `version --json`: `gitCommit: null` in a release, no digest |
| VER-05/08 | SHOULD | done | prepare-release.mjs; Keep-a-Changelog |
| REL-01 | MUST | partial | Explicit matrix and glibc ceiling (scripts/check-glibc-ceiling.sh); linux arm64 not listed as unsupported; no fallback |
| REL-02 | MUST | pass | `assetName` in package-release-assets.mjs, re-spelled in install.sh, install.ps1 and fetch.rs, and covered by the consumer proof |
| REL-03 | MUST | **fail** | release.yml jobs `check-version → assets → publish`; the test suite (ci.yml `test`) is not required |
| REL-04/05 | MUST | pass | release-assets.yml reused by ci.yml:333 and release-assets-check.yml on PRs; one packaging script |
| REL-06 | MUST | partial | Final job assembles, re-verifies and asserts per-triple assets; installers are not in `SHA256SUMS` (package-release-assets.mjs:106) |
| REL-07/08/10 | SHOULD | gap | Publishes directly (no draft and smoke); installers copied unchanged; actions pinned by tag (`actions/checkout@v4`) |
| REL-13 | SHOULD | partial | docs/knowledge/how-to-cut-a-fgos-release-tag has no rollback or yank |
| TST-01 | MUST | pass | ci-external-consumer.sh and ci-external-consumer.ps1 under PowerShell 5.1 and 7 |
| TST-02 | MUST | partial | Consumer proof: install, init, version, ready, upgrade no-op; no `doctor --strict`, no uninstall |
| TST-03 | MUST | **fail** | Upgrade is only tested as a no-op to the same asset |
| TST-04 | MUST | **fail** | No agent-native loop test. The surface above would not let it pass. A fresh-agent run was not attempted because CMD-15/16/18 already fail mechanically |
| RS-01 | MUST | partial | Workspace version yes; repo URL hard-coded |
| RS-03 | MUST | **fail** | Cargo.toml:44-45 `strip = "symbols"` only |
| RS-04 | MUST | partial | Gnu target with a glibc ceiling (justified by the Node addon); no aarch64-apple-darwin |
| RS-05 | SHOULD | gap | No rust-toolchain.toml |
| NODE-01/03/04 | MUST | pass | No postinstall; `engines.node >=18` plus a doctor check |
| NODE-02 | MUST | partial | Native release is the primary channel, but README.md:102-122 still advertises `npm install -g github:vantt/forgent` (and `#main`) after its window ended on 2026-10-18 (spec §3) |
| CH-PLUGIN-02 | MUST | partial | Plugin skills are generated (good), but the marketplace is installed from GitHub `main`, not from the activated release |
| CH-PLUGIN-06 | SHOULD | gap | `dogfood-fixture` is listed in the public `.claude-plugin/marketplace.json` |

Not applicable: 85-service-daemon, beyond the note above (no install-path daemon); AGT-05/09 (MCP surface not in scope).

**Totals: 42 MUST rules fail and 31 MUST rules are partial.**

## 3. Ranked findings (MUST failures first, tier order, then impact)

**F1. Install reaches no first value, and `fgctl init` neither says "Ready" nor fails** (ONB-06/08/10/12/14, CMD-03). Area: Packaging/T9 (init) + Runner (run error).
- Evidence: live steps 5-10; init.rs:565-596 (the tail's output is swallowed unless a command exits non-zero, and doctor exits 0 with failures).
- Failure scenario: a new user runs the README's 4 commands, gets exit 0 everywhere, then a 109-line doctor with 5 ✗, then `fgos run` exits 11 in 2 s. The cause, `agent omp did not start`, is only in `.fgos/assignments/<id>/producer/1/runs/01/stderr.log`.
- Fix: init prints one closing block on stdout: `✓ fgOS <tag> active (<digest12>)`, `N checks need you: <ids>`, and `Next: fgos run "<prompt>" --provider <first detected CLI>` (~40 lines Rust in `run_tail`, which reads doctor `--json`). `fgos run` puts a launch failure into the envelope as `error {code: agent-cli-missing, why, fix}` (~30 lines). README gains a promise line naming Node ≥18 + git (~4 lines).

**F2. Release defaults assume the owner's machine** (UX-10, ONB-08). Area: Config + Runner.
- Evidence: on a clean HOME, `dispatch explain --for execute` picks gemini via `omp-cli-bwrap`. Doctor fails `executor-skills-installed` (ak:cook ×7) and `confined-pane-accounts`, and warns about pools `z-ai.*@thehive/openrouter`.
- Failure scenario: every first `fgos run` on a machine without omp fails, and `doctor --fix` cannot repair it.
- Fix: see Q1. The smallest change keeps the standard neutral: `execute.prefer` comes from the CLIs detected at init, and skills and pools move to the owner's global config (~50-150 lines of YAML, ~30 lines of detection).

**F3. The command surface is not agent-native** (CMD-06/07/08/10/11/15/16/18, CMD-12/19). Area: CLI surface (apps/fgos/src/main.rs, bin/fgos.mjs) + Packaging (fgctl main.rs).
- Evidence: the CMD rows above.
- Failure scenario: an agent told "install fgOS using --help and --json" cannot learn fgctl's version, reads `fgctl upgrade --help` as an error (exit 1), gets exit 4 for usage mistakes, and loops on `doctor --fix` with no `fix` field.
- Fix:
  - `--version` → `version` on fgos (~5 lines); `fgctl --version | version [--json]` printing `CARGO_PKG_VERSION`, commit and the active digest (~30 lines);
  - `fgctl --help` / `<verb> --help` exit 0 (~15 lines); fgctl `status/upgrade/init` print one result line on success ("already up to date") (~20 lines);
  - no-args fgos prints 3-step "Get started" plus "Agents: fgctl init → fgos doctor --json → run each fix" (~30 lines);
  - usage errors exit 2 with a did-you-mean over the verb table (~25 lines);
  - honour `NO_COLOR` and use no ANSI when not a TTY (~5 lines);
  - the doctor envelope gains `ok`, `next[]` and a per-check `fix` command (~60 lines).
- The exit-code change touches every caller of `doctor`. Move them in the same change (fgctl `run_tail` reads JSON instead of the exit code).

**F4. Doctor cannot converge, and one fix's error is unreadable** (DOC-01/02, CMD-18, CMD-10). Area: Setup registry + Git.
- Evidence: a repo with no `origin` fails `git-repository-config` with "run fgos doctor --fix (git-publication-refspecs)". That fix fails with `stderr:[101,114,114,111,114,…]` ("error: No such remote 'origin'") (src/setup/git-checks.mjs:101).
- Failure scenario: every local-only project, including every first try, is permanently red, and an agent loop never ends.
- Fix: decode the stderr bytes; with no remote, make the check `skip` with `fix: git remote add origin <url> && fgos doctor --fix` (~15 lines). Add `status: ok|warn|fail|skip` and `fix` to check results instead of "warning:" text inside passing checks (~40 lines plus a registry pass).

**F5. install.sh is not the hardened shape** (INS-02/04/06/15, SEC-01, UX-08). Area: Packaging/T9.
- Evidence: install.sh:1-206.
- Failure scenarios:
  - a truncated `curl | sh` executes the lines it got;
  - `--help` starts an install and dies with a raw `curl: (37)`;
  - `FGCTL_VERSION=0.2.0` fails;
  - on a box with no sha256sum or shasum, it says "checksum verification failed" instead of naming the missing tool;
  - a corrupt binary is activated without being run.
- Fix:
  - wrap the script in functions and make `main "$@"` the last line (~30 lines changed);
  - add `--help`, `--version`, `--dry-run`, `--uninstall` and the matching `FGCTL_*` env (~60 lines);
  - normalise `v` and validate the tag as install.ps1 does (~6 lines);
  - add an openssl fallback (~5 lines);
  - run `"$candidate" --version` before `mv` (~5 lines, needs F3's fgctl version);
  - split `FGCTL_ASSET_BASE_URL` into `FGCTL_RELEASE_BASE` (repo) and the asset directory, or document one meaning (~10 lines in install.sh, install.ps1 and fetch.rs).

**F6. Missing platforms** (UX-01, REL-01, RS-04). Area: Packaging/release.
- Evidence: release-assets.yml:37-42 has two rows; there is no linux arm64 or macOS arm64, although fgOS is supposed to keep macOS building.
- Failure scenario: an Apple-silicon or ARM-server user hits "target … is not supported" with no source-build pointer.
- Fix: see Q5. A source-build pointer in the unsupported-target error is ~5 lines either way.

**F7. Config door ergonomics** (UX-14, UX-15, CMD-10). Area: Config.
- Evidence:
  - `config edit` is missing;
  - `config set` with a typo writes the typo (`cancelWaitM`);
  - `config set` without `--reason` fails with `[config-comment-reason-required]` and no fix;
  - `config explain dispatch.cancelWaitMs` → `described: false` for a key doctor reports with a default.
- Fix:
  - refuse an unknown key with a did-you-mean from the schema, `--force-unknown` to keep one (~30 lines);
  - make the reason error name `--reason "<why>"` (~2 lines);
  - add `config edit` ($VISUAL/$EDITOR, validate on save, re-open) (~60 lines);
  - make explain resolve runtime keys or say which schema owns them (~20 lines).

**F8. The fgctl self-refresh can downgrade and has no ownership marker** (UPD-01/04/06). Area: Packaging/T9 (HARDEN lane, landed in 74d794cee).
- Evidence: fgctl_refresh.rs compares digests only and replaces any running fgctl outside the store.
- Failure scenario: on one machine, project A upgrades to vN+1 (fgctl vN+1 installed). Project B, held on vN, runs `fgctl upgrade --from <vN>`, and the machine fgctl drops to vN. Project A's next `fgctl verify`/`upgrade` then runs a manager older than its manifest. Separately, a developer running `target/release/fgctl upgrade` overwrites their own build output.
- Fix: refresh only when the release's fgctl is newer by embedded version and commit time (needs F3's version), only when a `.fgctl-managed` marker written by the installers sits beside it, and run `<staged> --version` before the rename (~60 lines plus ~6 in each installer).

**F9. No paths door; config outside XDG** (CFG-01, CFG-03, CFG-02). Area: Config + Packaging.
- Evidence: `~/.fgos/config.yaml`, state under XDG_STATE, Windows under `%USERPROFILE%\.local\state`, two env names for one root.
- Failure scenario: an uninstaller or a doc cannot find where data lives on Windows or macOS; F11 needs this.
- Fix: `fgos paths --json` printing config, state, store, launcher and fgctl paths from the resolvers already in place (~40 lines). Moving `~/.fgos` is a migration and is left out (feature idea 5).

**F10. `fgctl init` silently widens global agent permissions for hosts that are not installed** (PRN-03, PRN-04, AGT-01; PRN-07/08). Area: Runner (agy executor) + Setup registry. This is the most serious safety finding.
- Evidence: in a clean HOME with no agent CLI on PATH, `fgctl init` created `~/.gemini/antigravity-cli/settings.json` with `"toolPermission": "always-proceed"` plus 7 deny regexes, and `~/.claude/settings.json` with `crossSessionInbound: accept`. `fixAgyPermissionsConfigured` writes with `writeFileSync`, no backup (agy-permissions.mjs:134-143). When `claude` exists, `doctor --fix` also runs `claude plugin marketplace add vantt/forgent` and `claude plugin install` (registrations.mjs:2108-2135). Nothing is printed by init.
- Failure scenario: a user installs agy later for their own work. Every interactive agy session now runs any command not matching those 7 regexes without review (`rm -r -f x`, `python -c …`, `bash script.sh`, `git push origin +main`). The user never agreed to this and nothing told them.
- Fix: skip every host whose CLI is not on PATH (~10 lines in the registry's host table). Write agy permissions only into the sub-HOMEs fgOS launches agy with, since `agy-sub-homes-configured` already exists, not into the user's own `~/.gemini` (~30 lines). Report every global file changed (~10 lines). Q2 asks the owner which scope to keep.

**F11. No uninstall for the release install** (UNI-01/02/03/05, INS-15). Area: Packaging/T9.
- Evidence: live step 15.
- Failure scenario: a user removes `.fgos/installation` by hand. Claude Code's `dispatch-decide` and `decision-question` PreToolUse hooks (unguarded, AGT-08) then fail on every Agent/Task call, the agy setting stays global, and 47 MB per release stays in `~/.local/state/fgos/releases`.
- Fix: one uninstall that reverses exactly what init and `doctor --fix` wrote: hook entries by fill-only reversal, stamped skill dirs, `.fgos/installation`, the launcher, fgctl when the marker is present, global agent keys fgOS added. Default `--dry-run` plan; `--yes` without a TTY; `--purge` for the store and `.fgos` data; print where data lives (~200 lines). Where it lives is Q3. Add the `[ -x "$S" ] || exit 0` guard to the two unguarded hooks (~4 lines).

**F12. Plain HTTP accepted, no size cap** (SEC-04). Area: Packaging/T9.
- Evidence: fetch.rs:136 allows `http://`; install.sh and install.ps1 accept an `http://` `FGCTL_ASSET_BASE_URL`; no `--max-filesize`.
- Failure scenario: a mirror set to `http://` lets an on-path attacker replace both the tarball and `SHA256SUMS`, because they come from the same origin, and `fgctl` activates attacker code.
- Fix: refuse `http://` except loopback or with `FGCTL_ALLOW_INSECURE=1`, and add `--max-filesize` to curl and a size check in ps1 (~15 lines in the three places).

**F13. The plugin version drifts and the plugin follows `main`** (VER-03, POLY-02, CH-PLUGIN-01/02/06). Area: Packaging/release.
- Evidence: plugin.json 1.2.0 vs 0.2.0; the marketplace source is the GitHub repo default branch, not the activated release; `dogfood-fixture` is public.
- Failure scenario: a project pinned to release X gets slash commands from today's `main` that call verbs or flags X does not have.
- Fix: prepare-release.mjs also rewrites `plugins/*/.claude-plugin/plugin.json`, with a drift test in test/scripts/prepare-release.test.mjs (~20 lines). Point the marketplace at the activated release's `plugins/` directory, or a tag ref equal to the pin (~15 lines). Move `dogfood-fixture` to a dev-only marketplace (~10 lines).

**F14. The release pipeline lacks gates** (REL-03, REL-06, TST-02/03, RS-03; REL-07/08/10, SEC-02). Area: Packaging/release.
- Evidence: release.yml has no test dependency; `SHA256SUMS` excludes installers; actions are pinned `@v4`; there is no draft step; Cargo.toml:44-45.
- Failure scenario: a tag pushed from a red main publishes; a swapped `install.sh` on the release has no checksum entry to catch it.
- Fix:
  - release.yml `uses: ./.github/workflows/ci.yml` and `publish` needs it (~6 lines);
  - add install.sh and install.ps1 to `checksumLines` (~3 lines);
  - add an upgrade-from-previous-tag step to the consumer proof (~40 lines sh plus ps1);
  - add `doctor --strict` and uninstall to the smoke (~10 lines);
  - add `lto = "thin"` and `codegen-units = 1` (~2 lines; measure build time);
  - pin actions by SHA (~10 lines);
  - publish `--draft` → smoke → `gh release edit --draft=false` (~15 lines).

**F15. One shared exact-digest pin does not fit three machines with their own releases, and the drift is silent** (PRN-02, CMD-10, DOC-05). Area: Packaging/T9 + governance.
- Evidence: this repo's committed `.fgos/distribution.json` pins `sha256:df7a1a…` (856e26b1c, 2026-10-17). This machine runs `cbae6142…`, its activation's `pinSnapshot` shows `cbae6142`, and there is no `pinOverrideReason`. `fgctl status`, `fgctl verify` and `fgos doctor` never mention the mismatch (live: after `--override-pin`, nothing in status, verify or doctor shows it). The recovery how-to requires `--override-pin` precisely because the pin is stale. A clone with a digest-only pin gets `no --from source was provided`, which names neither `--override-pin` nor `FGCTL_VERSION`.
- Failure scenario: an operator cannot tell from any tool which machines run the pinned release, and a teammate's first `fgctl init` dead-ends.
- Fix: `fgctl status`/`verify` and a doctor row print `active <digest> ≠ pin <digest> (override: <reason> | none)` (~30 lines). The digest-only-pin error lists the three ways out (~5 lines). Q4 covers the model itself.

**F16. The npm channel is still documented but broken** (NODE-02, ONB-09). Area: Packaging docs.
- Evidence: README.md:102-122. In the live check, the Node CLI without a release answered `fgos: "config" chỉ có ở Rust host` and doctor reported `git not available: git-addon-unavailable`. RUL108 has no JS fallback, and spec §3's window ended on 2026-10-18.
- Fix: delete the README npm and bleeding-edge sections (−20 lines), or make `bin/fgos.mjs` outside a release print the install.sh one-liner (~10 lines).

**F17. Docs disagree with the code** (PRN-02, INS-01). Area: Packaging docs.
- Evidence:
  - spec.md:62 recommends the raw `main` install.sh;
  - README.md:27,98-100 and the `setup` deprecation text say doctor --fix does not wire hooks, but the live `fgctl init` tail wired all 5 hosts, so setup only added two header-only config files;
  - README.md:157 promises exit 0 "whatever the checks say".
- Fix: ~15 lines of docs after F1 and F4 settle the behaviour.

SHOULD-level and other findings:

- **F18. Recovery how-to** (docs/how-to/recover-main-checkout-after-ignored-files-wipe.md).
  - It needs 6 manual sections, and it mixes product recovery (steps 1, 2, 5, 6) with fgOS self-development (cargo build, AgentKit reinstall).
  - It documents a known bug as a manual step ("setup can drop the codex entry" → `git checkout -- .fgos/coexistence.json`) instead of fixing it.
  - It depends on `--override-pin` because of F15.
  - Fix: split it into the product recovery, which is `fgctl repair`-shaped, and an fgOS-contributor page; file the coexistence bug as an item (~docs only plus one item).
- **F19. `fgctl status` shows `version: none`** for a release downloaded as tag `v0.0.0-audit`. The pin records the tag but the store entry does not (CMD-05). Fix: record the tag in the store entry at stage time (~15 lines).
- **F20. Internal ids and Vietnamese text reach users** (ONB-16): `tsk-*` in doctor descriptions, Vietnamese tier definitions and error strings. Fix: a lint over user-facing strings (~30 lines), then a text sweep.
- **F21. Slow idempotent re-runs** (tier 4): `init`, `repair` and `upgrade` take about 9 s with nothing to do, because the full tail re-runs. Fix: skip `fgos init` and `doctor --fix` when the activation is unchanged and doctor is green, and say "nothing to do" (~25 lines).
- **F22. Download wall-clock cap**: `curl --max-time 120` against a 17 MB asset (fetch.rs:47) fails on links under about 1.2 Mbit/s. Fix: use `--speed-limit/--speed-time` for stalls and keep a generous total cap (~3 lines).

## 4. What already works well

- **Integrity core of `fgctl`.** Content-addressed `artifactDigest`; the manifest is re-hashed on every arm; a corrupt store entry is refused; staging quarantines bad releases; an activation lock with a re-read under the lock; atomic publish with `previousArtifactDigest`; `repair` and `verify`. `verify` takes 0.07 s.
- **The new fgctl refresh verifies before writing.** It checks the activated digest, the manifest file door and a second byte hash, never writes into the store, keeps `.prev`, restores on failure, and handles a Windows running exe.
- **Installers.** Exact-filename checksum match, symlink refusal, root refusal, a temp file plus `mv -f`, and a wall-clock timeout backstop for wget. install.ps1 is the better-shaped of the two: function plus try, tag validation, TLS 1.2, System32 tar.
- **Release pipeline foundations.** One packaging script, reused on PRs; a glibc ceiling check; cargo-deny; a tag==version gate; an independent rebuild comparing addon digests; consumer proof under sh, PowerShell 5.1 and PowerShell 7.
- **The project launcher.** One `fgos` on PATH runs each project's activated release, and outside a project it gives a clear fix: `run 'fgctl init' in the project`.
- **Skill render.** It is stamped and refuses foreign same-name dirs. Hooks go through one table and doctor runs each hook with harmless input.
- **Secrets.** The gateway token is generated, 0600, under `~/.fgos/private`. Config has a binary-owned standard, header-only user files and a wrong-file check.

## 5. Feature ideas (RUL104: nothing is built without the owner's choice)

1. **`fgos status` fast summary with exactly one next command** (CMD-05).
   - Reason: doctor is 109 checks and 3.7 s, which is too heavy for "is this OK?".
   - Benefit: a 0.2 s answer for people and agents. It reuses the registry's fast checks.
2. **`fgctl self-update` separate from `fgctl upgrade`.**
   - Reason: today fgctl changes as a side effect of one project's upgrade (F8).
   - Benefit: the manager's version is a deliberate, machine-level act, and the project upgrade stays project-scoped.
3. **Signed releases** (cosign keyless plus `attest-build-provenance`, SEC-02/03).
   - Reason: `SHA256SUMS` from the same origin proves integrity only.
   - Benefit: authenticity for teams that mirror releases; it stays optional for the installer.
4. **Shell completions and a man page generated from the command table** (CMD-20).
   - Reason: there are 80 verbs and help is 513 lines.
   - Benefit: discoverability without reading help.
5. **Move user config to `$XDG_CONFIG_HOME/fgos` (and Application Support or %APPDATA%), with a migration** (CFG-01).
   - Reason: `~/.fgos` mixes config, private secrets and runtime cache.
   - Benefit: OS conventions, and backup and uninstall become clean. It needs an alias window.
6. **A daily update hint** (UX-06).
   - Reason: three machines drift silently today (F15).
   - Benefit: each machine learns that its release is behind the pin or the latest tag.
7. **A copy-paste "install with your agent" prompt in the README, plus a CI agent-native run** (ONB-13, TST-04).
   - Reason: fgOS is an agent tool.
   - Benefit: it proves an agent can install and repair it from `--help`/`--json` alone. It depends on F3.

## 6. Owner questions (real forks only)

### Q1. Should the release's standard config carry your executor routing?

**What is happening:** On a clean machine the release routes `execute` to gemini via `omp` and declares `ak:cook` skills and `z-ai@thehive/openrouter` pools. Doctor stays red and the first `fgos run` fails (F2).

**Cause:** Checked in a scratch HOME with no agent CLIs: `fgos dispatch explain --for execute`, doctor rows `executor-skills-installed` and `confined-pane-accounts`, and the run's stderr.log.

**Options:**
- A. Neutral standard. Executors stay declared, but `prefer` is chosen from the CLIs detected at `fgctl init`; owner pools and skills move to your global config. Gain: works on any machine. Harm: your machines need a one-time global config. Cost: ~50-150 YAML lines plus ~30 lines of detection; Config and Runner.
- B. Keep the standard; `fgctl init` writes a project override for the detected CLI. Gain: no change to your machines. Harm: two places decide routing. Cost: ~40 lines.
- C. Keep as is and document "install omp" as a prerequisite. Gain: no code. Harm: an external user's first run fails.

**Recommendation:** A. The standard is what every external project inherits (mission #1).

**Scope of the answer:** A yes authorizes changing the shipped standard and adding detection. It does not change your existing global configs.

### Q2. May fgOS write agent permissions into the user's own global agent config?

**What is happening:** `fgctl init` writes `toolPermission: always-proceed` into `~/.gemini/antigravity-cli/settings.json`, and `crossSessionInbound: accept` into `~/.claude/settings.json`, even when those CLIs are not installed (F10).

**Cause:** Live scratch run: both files were created, and none of claude, agy or codex was on PATH. Code: agy-permissions.mjs:134-143 and mailbox-claude-accept.mjs.

**Options:**
- A. Write agy permissions only into the agy sub-HOMEs fgOS launches workers with. Write the Claude key only when `claude` is installed, and report it. Gain: the user's own agy sessions keep review prompts. Harm: a person's interactive agy session no longer has the denylist. Cost: ~40 lines; Runner and Setup.
- B. Keep the global write, but only when the CLI is installed, after `--yes`, and listed in init's output. Gain: one config. Harm: still widens the user's own sessions. Cost: ~25 lines.
- C. Keep as is.

**Recommendation:** A. A worker setting should not change the person's own tool.

**Scope of the answer:** A yes authorizes moving where these two keys are written and skipping hosts that are not installed. It does not change which deny rules exist.

### Q3. Where does uninstall live?

**What is happening:** Nothing reverses a release install (F11). `fgos uninstall` only undoes legacy setup.

**Cause:** Live run after `fgos uninstall --yes`: hooks, skills, `.fgos/installation`, the launcher, fgctl, global agent keys and the store all remained.

**Options:**
- A. `fgctl uninstall [--project|--machine] [--purge] [--dry-run] [--yes]` owns it; `fgos uninstall` becomes its project part. Gain: matches archetype B (the manager installs, the manager removes). Cost: ~200 lines Rust plus ~60 Node; Packaging/T9.
- B. Extend `fgos uninstall` and add `install.sh --uninstall` for fgctl and the store. Gain: the verb users already know. Harm: two scripts know the paths, so `paths --json` is needed first. Cost: ~180 lines.
- C. Document manual removal only. Harm: fails UNI-01/02, a MUST.

**Recommendation:** A.

**Scope of the answer:** A yes authorizes one uninstall that reverses exactly what init and doctor --fix wrote, defaulting to a dry-run plan. It does not authorize deleting `.fgos` data without `--purge`.

### Q4. What pin model fits three machines that each run their own release?

**What is happening:** The committed exact-digest pin (`df7a1a…`, 2026-10-17) matches no machine. This machine runs `cbae6142…`, and recovery requires `--override-pin` (F15).

**Cause:** Checked `git log -- .fgos/distribution.json`, `activation.json` (`pinSnapshot`), `fgctl status`, and the recovery how-to.

**Options:**
- A. The pin names a released tag (`releaseVersion` plus digest). Machines build locally only for development and use `--override-pin` for that, with drift shown by status and doctor. Gain: one truth that clones can download. Harm: dogfooding needs a tag cut per pin move. Cost: ~30 lines (drift display) plus process.
- B. A per-machine pin in an untracked file, with the committed pin as a floor (minimum version). Gain: no override churn. Harm: the "same bits for the whole team" property is gone. Cost: ~120 lines; a new contract.
- C. Keep the exact digest and make every pin move a commit from the machine that built it. Harm: the other two machines always run overridden.

**Recommendation:** A. For this repo only, if you want to keep local builds, use A with the drift display.

**Scope of the answer:** A yes authorizes the drift display and the error-message change now, and records the policy in the packaging spec's decision history. Moving the committed pin itself remains a separate change.

### Q5. Should releases cover linux arm64 and macOS arm64?

**What is happening:** Only x86_64 Linux (glibc) and Windows are published. UX-01 lists linux arm64 and macOS arm64 as MUST (F6).

**Cause:** release-assets.yml matrix; README "macOS … not supported in this alpha". The Node addon needs a per-target build.

**Options:**
- A. Add both (ubuntu-22.04-arm and macos-14 rows, addon and glibc checks per target). Cost: ~40 workflow lines, three more CI legs, about 2× release time.
- B. Add macOS arm64 only, since owner machines and users are more likely there. Cost: ~20 lines.
- C. Stay on two targets, list the others as unsupported, and add a source-build pointer. Cost: ~10 lines.

**Recommendation:** B now, A when an ARM server user appears.

**Scope of the answer:** A yes authorizes new matrix rows and target-table entries. It does not authorize release-time budgets beyond about 2× current.

---

Status: DONE_WITH_CONCERNS
Summary: 42 MUST rules fail and 31 are partial. The most serious is F10: `fgctl init` widens global agy permissions (`always-proceed`) for hosts that are not installed. Report: plans/reports/audit-261109-1533-fgos-packaging-distribution.md
