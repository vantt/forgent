# Verification: Packaging Checklist

```txt
Document type: Verification
Audience: Release engineer, maintainer, implementation agent
Purpose: The packaging standard (skill cs-packaging-distribution) filled in for fgOS, with the status of every MUST after the packaging hardening
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Platform documentation
Source type: Code/test/live-run scan
Last reviewed: 2026-11-12
Related:
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/verification/install-and-release-proof.md
- plans/reports/audit-261109-1533-fgos-packaging-distribution.md
- plans/reports/closing-261112-1817-harden-packaging-distribution.md
Implementation: Rows cite the code, tests and live scratch-HOME runs that prove them
Provenance: The audit of 2026-11-09 (42 MUST fail, 31 partial) re-run on the tree after the packaging phases landed
Writer type: Human + agent coauthor
Canonical for: Which packaging-standard rules fgOS meets, and which it does not on purpose
Use this when: Deciding what packaging work is still open, or whether a rule was met by design
Do not use this for: Product behaviour (see spec.md) or proof commands (see install-and-release-proof.md)
Supersedes: No authority transition
Superseded by: None recorded
```

Skill: cs-packaging-distribution. Priority: UX (first contact, command syntax, agent-native, ease), then safety, then correctness, then fast and light.
Archetype: **B, manager plus runtime** (`fgctl` plus a per-project pinned `fgos` release; per-project runtime identity and a Node payload make a single binary impractical). Started from: forgent itself.

Reading-map check: `docs/reading-map.md` routes packaging questions to `docs/platform/packaging-distribution/README.md`; this file is the smallest owning surface for the rule-by-rule status, beside `implementation-alignment.md` (claim-by-claim) and `install-and-release-proof.md` (proof paths).

Status words: `done` met and proven; `partial` met in part, the residual is named; `gap` open, with the owner choice or idea that would close it; `deviation` a rule not followed on purpose, with the reason. Counts and the history of how each MUST moved are in `plans/reports/closing-261112-1817-harden-packaging-distribution.md`.

## Decisions (UX first)

| Decision | Choice | Why |
|---|---|---|
| Tagline (user pain/gain, one sentence) | "The Foundation for Generative Agents." | Unchanged. It is about the technology, not the user's pain or gain (ONB-01 stays partial); the owner has not asked for a rewrite. |
| Quick-start promise | "From nothing to your first agent run in about 3 minutes. You need Node >= 18, git, curl and one agent CLI (claude, codex, omp or pi)." | `README.md` first screen. The agent CLI list is the one `agent-cli-missing` prints, so the promise and the error agree. |
| Verbs (fgctl) | `init`, `upgrade`, `repair`, `verify`, `status`, `uninstall`, `stage`, `version`, `help` | `uninstall` and `version` are new. There is no `fgctl update`: `upgrade` is the project-scoped update. |
| Verbs (fgos) | `init`, `doctor [--fix] [--strict]`, `config`, `uninstall`, `version`, `run`, and the rest of the 81 | `setup` is deprecated and listed once under "Compatibility". `fgos update` does not exist (UX-04 partial). |
| Agent-native: does `init --yes` alone give a working setup? | `fgctl init` alone does, and never prompts, so it takes no `--yes` (`--yes` is a usage error, exit 2). `fgos doctor --json` then gives `ok` and `next[]`. | Deviation from the Verify row that types `init --yes --json`; see CMD-03 and the closing report. |
| Install one-liner(s) | `curl -fsSL https://github.com/vantt/forgent/releases/latest/download/install.sh \| sh` and `irm .../install.ps1 \| iex` | A pre-release is installed by naming its tag (`--version <tag>`). |
| Dependency budget | `sh`, `curl` or `wget`, `tar`, a SHA-256 tool (`sha256sum`, `shasum` or `openssl`); at run time Node >= 18, git, curl | README says so up front (UX-07). |
| Config format, generated file, edit flow | YAML; `~/.fgos/config.yaml` and `.fgos/config.yaml`, header-only until edited; `fgos config standard / show / explain / set / unset / patch` | `config set` refuses an unknown key with the nearest keys; there is no `config edit` (UX-14 gap). |
| Version source of truth, targets, asset naming | `package.json` equals the Cargo workspace equals every plugin manifest, checked by test; `x86_64-unknown-linux-gnu` (glibc 2.35 ceiling) and `x86_64-pc-windows-msvc`; `<kind>-<tag>-<triple>.tar.gz` | No arm64 or macOS build (owner decision: only when a real machine needs one). |
| PATH policy, signing level, agent hosts | A (print the export line); checksums only, no signatures; Claude Code, Codex, agy, omp, pi | fgOS writes a person's own agent config only through the opt-in `fgos wire-agents`. |

## Rules: MUST plus adopted SHOULD

### First contact and command surface (tier 1)

| Rule | Level | Status | Evidence, residual or deviation |
|---|---|---|---|
| ONB-01 | MUST | partial | Name and tagline first; the backlog badge row still comes before the tagline and the tagline is not about the user. |
| ONB-04 | MUST | partial | Install and quick start first, npm and `setup` sections gone; the pre-release, mirror and precedence detail still sits in the README instead of an installation page. |
| ONB-06 | MUST | done | The promise line above (`README.md`, pinned by `test/cli/first-run-guide.test.mjs`). |
| ONB-07 | MUST | done | One-liner with one sentence per step. A pre-release names its tag twice, because a pre-release is never "latest". |
| ONB-08 | MUST | done | Three commands: `install.sh`, `fgctl init`, `fgos run "<prompt>"`; live run in the closing report. |
| ONB-09 | MUST | gap | No CI extraction of README code blocks. `first-run-guide.test.mjs` pins the three commands only. Owner idea: README extraction plus an agent-native CI run. |
| ONB-10 | MUST | done | `fgctl init` ends on `Ready:` or a numbered list (`packages/distribution/rust/src/init.rs` `closing_block`; `test/rust-host/closing-block.test.mjs`). |
| ONB-12 | MUST | done | Installer, README, `fgctl --help` and `fgos` print the same three steps; one test pins them. The three texts are still three copies. |
| ONB-14 | MUST | done | `fgos run` with no agent CLI exits 4 with `agent-cli-missing`, the CLIs looked for and the fix (`src/runner/execution/unit-run-start.mjs`; `test/cli/run-verb.test.mjs`). |
| ONB-16 | SHOULD | gap | Internal task ids left the rows P02 touched; no lint over user-facing strings (owner idea). |
| CMD-01 | MUST | partial | The header-only config files moved from `setup` to `fgos init`; `setup` still wires the git hooks path and the shell line, which no registered fix repairs. |
| CMD-02 | MUST | done | Doctor is read-only by default. |
| CMD-03 | MUST | done with deviation | `init`, `upgrade`, `repair` end on `Ready` or `nothing to do` and re-run in about 4 s (`init.rs` `doctor_is_clean`; `closing-block.test.mjs`). Deviation: `init` takes no `--yes` because it never prompts; `fgctl init --yes` exits 2 with a usage message. |
| CMD-04 | MUST | done | `setup` is collapsed into one "Compatibility" line of `fgos --help` (`test/cli/fgos-help.test.mjs`). |
| CMD-05 | SHOULD | gap | No fast `status` with one next command; `fgctl status` prints `version: none` for a release whose tag the store did not record. |
| CMD-06 | MUST | done | `fgctl --version`, `fgctl version [--json]`, `fgos --version`, `fgos version`. `fgctl` carries the commit only when the build exports `FGOS_BUILD_COMMIT` or `GITHUB_SHA`; the commit time needs `SOURCE_DATE_EPOCH`, which the release workflow does not export yet (`unknown commit` in a local build). |
| CMD-07 | MUST | gap | `--json` is a no-op on some verbs; no `--dry-run`, `-q`, `-v` on every verb. ANSI is off a TTY and `NO_COLOR` is honoured (`src/setup/ansi.mjs`). Owner idea: global flag parity. |
| CMD-08 | MUST | deviation | `fgctl` usage errors exit 2 (`apps/fgctl/tests/cli_surface.rs`). `fgos` keeps 4 because 2 is `precondition` in the one exit-code map (owner choice Q-A, default). Doctor exits 0 whatever the checks say (Q-B). |
| CMD-09 | MUST | done | No ANSI on a non-TTY; `fgctl upgrade`'s refresh lines go to stderr. |
| CMD-10 | MUST | done | The git row decodes its error and skips with a fix when there is no remote; `config set` names `--reason`; the digest-only pin error lists three ways out. |
| CMD-11 | MUST | partial | One `fgos.v1` envelope; only doctor carries `ok` and `next`. `fgctl version --json` is a bare object and its other verbs print text. |
| CMD-12 | SHOULD | done | Did-you-mean for verbs and native flags (`fgos-distribution::suggest`); the Node unknown-flag message lists valid flags but does not suggest. |
| CMD-15 | MUST | done | `fgctl` and `fgos` with no arguments print "Get started" and an agent line, exit 0. |
| CMD-16 | MUST | done | Every `fgctl` verb and the five guided `fgos` verbs (`init`, `doctor`, `config`, `run`, `uninstall`) carry changes, prerequisites, options with defaults, examples, exit codes and next step. `fgctl --help` lists exit codes 0, 1, 2 (usage error or not ready) and 4 (unreadable pin). |
| CMD-17 | MUST | done | Nothing prompts without a terminal; `fgctl uninstall` asks only at a terminal. |
| CMD-18 | MUST | done | Doctor rows carry `status` and, on a failing row, `fix`; `next[]` lists the commands once each (`runDoctor`, `src/setup/registrations.mjs`). |
| CMD-19 | SHOULD | done | "Agents / automation" line in `fgos` and `fgctl` with no arguments. |
| CMD-22 | MUST | done | Settings change through `fgos config set/unset/patch`. |
| UX-01 | MUST | gap | Two targets. Owner decision 80 Q5: no arm64 or macOS build until a real machine needs one. An unsupported target gets a source-build pointer (`fetch.rs`, `install.sh`). |
| UX-02 | MUST | done | 0.1 s from a mirror, no questions. |
| UX-03 | MUST | done | The installer prints the PATH line and `fgctl --version` works. |
| UX-04 | MUST | partial | `fgctl upgrade` per project and refreshes `fgctl`; `fgos update` does not exist. |
| UX-07 | MUST | done | The prerequisites are in the README's first lines; `init` and doctor check Node and git. |
| UX-08 | MUST | partial | `install.sh` names a missing SHA-256 tool and falls back to `openssl`; `fgctl` downloads need `curl` (no `wget`). |
| UX-10 | MUST | done | Release defaults route only to agent CLIs on PATH (`isCommandAvailable`, `bind.mjs`); the six `thehive` cells left the standard. |
| UX-11 | MUST | partial | The generated config is still a header plus `see: fgos config standard`. |
| UX-14 | MUST | gap | `fgos config edit` does not exist (owner idea). |
| UX-15 | MUST | done | `config set` and `patch` refuse an unknown key with the nearest keys (`write::refuse_unknown_keys`). |

### Install scripts, update, config, doctor, agents (tier 1)

| Rule | Level | Status | Evidence, residual or deviation |
|---|---|---|---|
| INS-01 | MUST | done | README and spec use release URLs. |
| INS-02 | MUST | done | `install.sh` is functions, `set -eu`, `main "$@"` last (`test/install/install-sh.test.mjs`). |
| INS-03 | MUST | done | Allow-listed targets; an unsupported one gets the source-build pointer. |
| INS-04 | MUST | partial | `install.sh`: `--help`, `--version` with or without `v`, tag validated, `FGCTL_ASSET_BASE_URL` is the asset directory only. `fgctl` and `install.ps1` still read it as a repository for "latest" (backlog `p-g3erqtmmib`). |
| INS-05 | MUST | done | Redirect-based latest. |
| INS-06 | MUST | done | The candidate runs `fgctl --version` before it replaces anything. |
| INS-07, INS-08 | SHOULD | gap | No ownership marker and no `.rollback` beside the installed binary. |
| INS-09, INS-10 | MUST | done | `~/.local/bin`, `%LOCALAPPDATA%\fgos\bin`; root refused; policy A. |
| INS-12 | MUST | partial | No `paths --json` (owner idea). |
| INS-13 | MUST | done | Next steps use the absolute `fgctl` path when its directory is off PATH. |
| INS-15 | MUST | gap | No `install.sh --uninstall`; `fgctl uninstall` names the binary and the launcher and leaves removal to the person. |
| INS-17 | MUST | done | TLS 1.2, `Get-FileHash`, System32 `tar` in `install.ps1`. |
| UPD-01 | MUST | gap | The `fgctl` refresh replaces any `fgctl` outside the store with no ownership marker (owner idea: refresh marker). |
| UPD-02 | MUST | done | The refresh re-hashes the manifest and checks the `fgctl` digest twice. |
| UPD-03 | MUST | partial | `DEFAULT_RELEASE_REPO_URL` is hard-coded; the environment override exists. |
| UPD-04 | MUST | partial | A project held on an older release can still downgrade the machine `fgctl` with an explicit `upgrade --from <older>` (documented). |
| UPD-05 | MUST | done | Real release format. |
| UPD-06 | MUST | partial | `.prev` backup, durable rename and restore; the refresh does not run `<staged> --version` before the swap (the installer does). |
| UPD-10 | MAY | done | Exact-digest pin, `repair`, `verify`; drift is now shown (see PRN-02 below). |
| CFG-01 | MUST | gap | Config stays in `~/.fgos` (owner idea: move to `$XDG_CONFIG_HOME` with an alias window). |
| CFG-02 | MUST | partial | `FGOS_STATE_ROOT` and `FGOS_STATE_HOME` both name the root (owner idea: merge). |
| CFG-03 | MUST | gap | No `paths --json` (owner idea). |
| CFG-04, 05, 07, 08, 12, 13 | MUST | done | Precedence documented; `config standard` from the binary; gateway token 0600; malformed config refused; wrong-file check; generated token. A JSON-era config is moved by `fgos init` (`settle-legacy-config.mjs`) with the token kept. |
| CFG-06 | MUST | partial | The agy permission writer is no longer reached by `init` or `doctor --fix`; `fgos wire-agents` copies the file first. Atomic write not re-measured. |
| DOC-01 | MUST | done | `status` per row, `fix` on a failing row (JSON key `fixCommand` on the row itself). |
| DOC-02 | MUST | gap | Doctor exits 0 whatever the checks say; `--strict` exits 1; `ok` and `next[]` carry the verdict (owner choice Q-B, default kept). |
| DOC-03 | MUST | done | Read-only by default. |
| DOC-04 | SHOULD | done | `registerCheck` and `registerFix`. |
| DOC-05 | SHOULD | done | Row `activation-matches-pin` reports an activation that differs from the pin; a warning, never a failure. |
| AGT-01 | MUST | done | `init`, `setup` and `doctor --fix` write no global agent config; `fgos wire-agents` is opt-in and only for agents on PATH. |
| AGT-02, AGT-04 | MUST | done | One hook table; hooks call the project shim. |
| AGT-03 | MUST | partial | The Claude settings writer keeps other keys; the agy writer is reached only by the opt-in verb. |
| AGT-07 | SHOULD | done | Skills rendered from one source with generated stamps. |
| AGT-08 | SHOULD | partial | The Claude Code `dispatch-decide` and `decision-question` hooks are guarded (`[ -x "$S" ] \|\| exit 0`); the Codex and agy registrations are not (backlog `p-ato5756utm`). |

### Safety (tier 2)

| Rule | Level | Status | Evidence, residual or deviation |
|---|---|---|---|
| PRN-02 | SHOULD | done | `fgctl status`, `fgctl verify` and doctor print `active <d12> != pin <d12> (override: <reason or none>)`; an unreadable pin refuses `init` (`pin_drift`, `tests/pin_drift.rs`, `test/setup/pin-drift-check.test.mjs`). |
| PRN-03 | MUST | done | No global agent write without the opt-in verb; no host written whose CLI is absent. |
| PRN-04 | MUST | partial | The global-write half is closed. The machine `fgctl` swap in `upgrade` still has no plan, dry run or confirm. |
| PRN-05, PRN-06 | MUST | done | Lock, re-read under lock, atomic publish, previous digest, repair; manifest digest checked, quarantine. |
| SEC-01 | MUST | done | Exactly one `SHA256SUMS` entry required; `openssl` fallback; installers listed in `SHA256SUMS`. |
| SEC-02, SEC-03 | SHOULD | gap | No cosign, provenance or SBOM. |
| SEC-04 | MUST | done | `http://` refused except loopback, also after a redirect; byte caps (`fetch.rs` `check_transport`; `install.sh`; `install.ps1`). |
| SEC-05 | MUST | done | The archive is listed before extraction; only `fgctl` is extracted; links, `..` and absolute names refused. |
| SEC-06 | SHOULD | done | `cargo deny` job. |
| UNI-01 | MUST | done | `fgctl uninstall` reverses the project wiring and removes the activation. |
| UNI-02 | MUST | done | Hook entries, generated skill directories, git hooks, mailbox timer and `.fgos/installation` go; config, data and the pin stay (`uninstall-project.mjs`, `uninstall.rs`; live run in the closing report). The binary, launcher and a shell-rc line are named, not removed. |
| UNI-03 | MUST | done | `--dry-run`, and the plan prints before anything changes. |
| UNI-04 | MUST | done | Fill-only reversal; a foreign hook or skill is kept and named. |
| UNI-05 | MUST | done | `--purge` removes the store entries and says where data lives; identity and locks stay. |

### Correctness (tier 3) and speed (tier 4)

| Rule | Level | Status | Evidence, residual or deviation |
|---|---|---|---|
| VER-01, VER-02 | MUST | done | `package.json` equals the Cargo workspace; `check-version`. |
| VER-03, POLY-02, CH-PLUGIN-01 | MUST | done | `prepare-release.mjs` sets every plugin manifest version; a test pins agreement with the product and the newest changelog heading. Both manifests are 0.2.0, below the installed 1.2.0 (owner choice Q-C, default: reinstall the plugin once). |
| VER-04 | SHOULD | partial | `fgctl version --json` has the commit when the build states it; `fgos version --json` has `gitCommit: null` in a release. |
| VER-05, VER-08 | SHOULD | done | `prepare-release.mjs`; Keep-a-Changelog. |
| REL-01 | MUST | partial | Explicit matrix and glibc ceiling; the README says macOS and Windows on ARM are unsupported, Linux arm64 is not named. |
| REL-02 | MUST | done | One `assetName`. |
| REL-03 | MUST | done | `release.yml` job `suite` calls `ci.yml` with `release-gate`; `publish` needs it. First real run is its proof. |
| REL-04, REL-05 | MUST | done | The release workflow is reused on PRs. |
| REL-06 | MUST | done | `SHA256SUMS` lists both installers; the final job refuses duplicate names. |
| REL-07, REL-08, REL-10 | SHOULD | gap | Direct publish (no draft and smoke), installers copied unchanged, actions pinned by tag. |
| REL-13 | SHOULD | partial | The release how-to has a pin-bump step (`FGCTL_VERSION=<tag> fgctl upgrade`, commit the pin); no rollback or yank runbook. |
| TST-01 | MUST | done | Consumer proof under `sh` (run live on Linux) and PowerShell. `scripts/ci-external-consumer.ps1` and `install.ps1` match the `sh` shape; `install.ps1`'s tests ran under PowerShell 7.4, the consumer script and 5.1 have not run (the first CI run on Windows is their proof). |
| TST-02 | MUST | done | Install, init, doctor `ok`, version, upgrade, repair, verify, uninstall dry run and `--yes`. |
| TST-03 | MUST | done | The proof upgrades from the previous published release (`scripts/previous-release-tag.mjs`), config byte-identical, no failing `config-*` row. Proven live on Linux; the Windows leg is unrun. |
| TST-04 | MUST | gap | No agent-native loop test (a fresh agent installs from `--help` and `--json` alone). Not run at close; owner idea. |
| RS-01 | MUST | partial | Workspace version yes; repository URL hard-coded. |
| RS-03 | MUST | deviation | `strip = "symbols"` only. `lto = "thin"` with `codegen-units = 1` was measured: build 2.35 times slower, start-up unchanged, addon 12 percent smaller, so it was not taken. |
| RS-04 | MUST | partial | Gnu target with a glibc ceiling (the Node addon); no aarch64-apple-darwin release (decision 80 Q5). |
| RS-05 | SHOULD | done | `rust-toolchain.toml` pins 1.99.0; the workspace declares `rust-version = "1.99"`. |
| NODE-01, 03, 04 | MUST | done | No postinstall; `engines.node >=18`; doctor check. |
| NODE-02 | MUST | done | The npm channel is retired and removed from the README (spec 3.2). |
| CH-PLUGIN-02 | MUST | partial | The marketplace still installs from the repository's default branch, not from the activated release. |
| CH-PLUGIN-06 | SHOULD | gap | `dogfood-fixture` is listed in the public marketplace. |

Not applicable: 85-service-daemon beyond the opt-in mailbox timer that `fgctl uninstall` removes (no daemon in the install path); AGT-05 and AGT-09 (the MCP surface is not in scope); CMD-24 was not verified in the audit and was not re-verified.

## Plan (tier-1 gaps first)

1. Owner decides two exit-code questions left by the close: `fgctl`'s exit 2 means both a usage error and "not ready" (backlog `p-xagoeec2i4`), and whether `fgctl` should activate a release that predates the Git addon (`p-yfpixqfmdq`).
2. Owner picks from the ideas table in the closing report: `config edit` (UX-14), `paths --json` (CFG-03, INS-12), README extraction and an agent-native CI run (ONB-09, TST-04), doctor exit code (DOC-02), the `fgctl` refresh marker (UPD-01, PRN-04).
3. Export `SOURCE_DATE_EPOCH` in the release workflow so `fgctl --version` carries the commit time (CMD-06 residual).
4. Regenerate the how-to's doctor-check tables from `fgos doctor --json` (backlog row, documentation lane).

## Open questions

- Q-A (`fgos` usage errors exit 4 or 2), Q-B (doctor exit code) and Q-C (plugin version below the installed one) are decided by default; the owner may overturn any of them.
