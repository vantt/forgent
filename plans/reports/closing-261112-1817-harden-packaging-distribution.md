# HARDEN packaging and distribution: closing report

Date 2026-11-12 (Asia/Saigon). Sub-plan `plans/261109-1617-harden-packaging-distribution/plan.md`, owner decision 80. Phases P01 to P12 landed on main between 2026-11-09 and 2026-11-12; this report closes P13. Measured on the final tree: main `e182dec72` (it includes the three `fgctl` fixes of `plans/reports/lead-261112-1830-harden-pkg-fgctl-fixes.md`, main fix `1db1d44c9`), release assets built from it with `package-release-assets.mjs` (tag `v0.2.0-p13final`), on fg-server2, in a scratch HOME (HOME, every `XDG_*` and `TMPDIR` redirected, `PATH` without the real `~/.local/bin`, scratch on ext4 and not under `/dev/shm`, see Findings 2). The real `~/.local/bin`, `~/.claude/settings.json`, `~/.fgos` and the release store were only read (mtimes compared before and after).

## Outcome against the acceptance criteria

| Criterion (sub-plan) | Result | Evidence |
|---|---|---|
| Install to first value in 3 commands | Met. `install.sh`, `fgctl init`, `fgos run "<prompt>"`; `init` ends `Ready:` and `Next: fgos run "<prompt>"`. | Timing table steps 2, 5; acceptance section. |
| `init` ends `ok: true` with `Ready` and one runnable next step | Met on a clean machine with no agent CLI (doctor `ok: true`, 110 rows, 0 fail, 7 warn). | Step 5, 6. |
| `fgos run` with no agent CLI exits with `agent-cli-missing` and a fix | Met: exit 4, names claude, codex, omp, pi and `fgos doctor`. | Step 10. |
| No-op `init`, `repair`, `upgrade` about one doctor run, at most 4.5 s, saying `nothing to do` | Met in kind, not reliably in seconds. `init` and `upgrade` say `nothing to do`; the tail is one doctor run plus about 0.5 s. Over three runs on this machine a no-op took 3.6 to 5.6 s while the doctor alone took 3.1 to 5.0 s, so the 4.5 s target held in the two quieter runs and was missed by about 1 s in the last. `repair` prints `Ready` because it re-publishes (by design). | Steps 11, 12, 13. |
| `--version`, `--help` exit 0 with the CMD-16 fields, on both binaries | Met. `fgctl --help` now lists `0 ok, 1 failed, 2 usage error or not ready, 4 unreadable pin`. | Verify table rows 3 to 5. |
| `fgctl uninstall --yes` leaves no hook, skill, activation; config and data stay; `--purge` removes the store | Met on the scratch project: hooks, activation gone, `config.yaml` and `distribution.json` kept, backups written. `--purge` proven by the phase's live run and unit tests, not re-run here. | Step 15; P08 report. |
| `http://` (non-loopback) refused by `install.sh`, `install.ps1`, `fgctl`; installers in `SHA256SUMS` | Met (tests). `install.ps1` ran under PowerShell 7.4 only. | P09 report. |
| Plugin version equals product version (test); release needs the suite; consumer proof upgrades from the previous tag | Met; upgrade proof ran live on Linux (rc.5 to candidate, exit 0). The workflow itself and the Windows leg have not run. | P11 report. |
| Each phase reports measured net lines | Done; table below. | Phase reports. |

## Before and after: the audit's 15-step run

Audit 2026-11-09 on `eca97c5fe` (a `file://` mirror, no network) against three runs on the final tree and its predecessor (a `file://` mirror of assets built from the tree, no network, so step 5 does not include a real download). Same machine, same method; the load average was 1 to 30 across the runs, so read the seconds to about 1 s and the "now" column as a range.

| Step | Command | Audit (before) | Now (after) |
|---|---|---|---|
| 1 | `install.sh --help` | 0.03 s, help ignored, raw `curl: (37)`, exit 37 | 0.01 s, usage, exit 0 |
| 2 | `install.sh` | 0.10 s; bare `fgctl init` printed | 0.16 s; prints `fgctl init` then `fgos run "<prompt>"` |
| 3 | `FGCTL_VERSION` without `v` | failed | works, 0.18 s |
| 4 | `fgctl --version` | usage, exit 1 | `fgctl 0.2.0 (unknown commit)`, exit 0; `version --json` |
| 5 | `fgctl init` | 15.4 s, stdout empty, exit 0, 5 failing checks | 9.7 to 13.9 s (first activation, `file://` mirror), `Ready: fgOS <tag> active (<d12>)` and `Next:`, exit 0 |
| 6 | `fgos doctor` | 3.7 s, 109 rows, 5 fail, exit 0 | 3.1 to 5.0 s, 110 rows, 0 fail, 7 warn, `ok: true`, `next: []` |
| 7 | `fgos setup` | README step 3; wrote two files | no longer a step; moved into `fgos init` |
| 8 | `fgos doctor --fix` | 3.9 s, same 5 fail | 3.5 to 4.6 s, `ok: true` |
| 9 | `fgos doctor --strict` | 3.6 s, exit 1 | 5.0 s, exit 0 |
| 10 | `fgos run "Say hello in one word"` | 2.0 s, exit 11, cause only in `stderr.log` | 0.25 s, exit 4, `agent-cli-missing` with the CLIs and the fix (no agent CLI on PATH) |
| 11 | `fgctl init` again | 8.9 s, silent | 4.1 to 5.6 s, `nothing to do: fgOS <tag> already active, doctor ok` |
| 12 | `fgctl repair` / `verify` | 9.3 s silent / 0.07 s | 5.0 to 5.7 s `Ready` / 0.08 s `verified <d12>` |
| 13 | `fgctl upgrade`, same release | 9.7 s, silent | 3.6 to 5.4 s, `nothing to do`, then `fgctl: up to date with the release (<d12>)` (the active release's digest since the fix) |
| 14 | teammate clone, digest-only pin | 0.01 s, no way out named | 0.02 s, three ways out named, exit 1 |
| 15 | `fgctl uninstall --yes` | `fgos uninstall --yes` removed nothing a release install made | 0.4 s: reverses the wiring in five agent surfaces, removes the activation, keeps config and pin, names the rest |

## Verify table (SKILL.md, 12 rows) on the final tree

| # | Rule | Result | Evidence |
|---|---|---|---|
| 1 | ONB-01/04/06 | partial | Promise line and quick start first (pass for 04 and 06); the tagline is still about the technology and a badge row precedes it (ONB-01 gap). |
| 2 | INS-02/04 | pass | `tail -1 install.sh` is `main "$@"`; `set -eu` on line 9; `sh -n` clean; `--help` exits 0. |
| 3 | CMD-06 | pass | `fgctl --version`, `fgctl version --json` (`{"name","version","commit","commitTime"}`), `fgos --version` (`fgos 0.2.0`). Commit is null in a build that exports neither `FGOS_BUILD_COMMIT` nor `GITHUB_SHA`; the commit time needs `SOURCE_DATE_EPOCH`, which the release workflow does not export. |
| 4 | CMD-15/19 | pass | Both binaries print "Get started" (3 steps) and an agents line, exit 0. |
| 5 | CMD-16 | pass | `fgctl init|upgrade|repair|stage|status|verify|uninstall --help` and `fgos init|doctor|uninstall --help` carry changes, prerequisites, options with defaults, examples, exit codes, next; `init` and `upgrade` name exit 2 for both a usage error and "not ready" and exit 4 for an unreadable pin. `fgos update` does not exist. |
| 6 | CMD-08/12 | deviation | `fgctl --bogus` exit 2 with a hint; `fgos --bogus` exit 4, `fgos doctr` exit 4 with `did you mean fgos doctor?`. `fgos` keeps 4 (owner choice Q-A). |
| 7 | CMD-03/09/11/17 | gap | `fgctl init --yes` exits 2 and `fgos init --yes --json` exits 4: `init` never prompts, so it has no `--yes`. `fgctl init` prints text, not an envelope; `fgos` JSON is the `fgos.v1` envelope without `ok`/`error`/`next` (doctor carries `ok` and `next`). |
| 8 | CMD-02, DOC-02 | partial | `fgos doctor --json` read-only, rows carry `status` and `fix`, `next[]` runnable; exit 0 whatever the checks say, 1 with `--strict` (Q-B kept). |
| 9 | CMD-03, PRN-05 | pass | Second `fgctl init`: `nothing to do`, 4.1 s. |
| 10 | CMD §1 | pass | `fgctl --version` and `fgctl upgrade --help` work (archetype B). |
| 11 | REL-06/10, VER-02 | partial | `release.yml`: `publish` needs `assets` and the `suite` job; installers are in `SHA256SUMS`; the tag-equals-version gate exists. Actions are pinned by tag, not SHA (REL-10 gap). |
| 12 | TST-04 | not run | Needs a fresh agent with no README access; no agent seat was spent on it. TST-04 stays open (owner idea). |

## MUST recount

The audit counted 42 MUST fails and 31 partials. On the final tree (full table in `docs/platform/packaging-distribution/verification/packaging-checklist.md`):

| | Audit | Now |
|---|---|---|
| MUST fail | 42 | **14** open (28 closed) |
| MUST partial | 31 | **18** still partial (13 closed) |

The plan expected 29 closed by phases, 3 by the two earlier items and 10 left for the owner (42 total). Four moved from "closed by a phase" to "open or partial" when the phase measured or found the residual: RS-03 (LTO measured and not taken), CMD-08 (the `fgos` half is a recorded deviation), INS-04 (`FGCTL_ASSET_BASE_URL` still means a repository in `fgctl` and `install.ps1`) and PRN-04 (the machine `fgctl` swap still has no plan or confirm). TST-04 stayed open as planned.

Still open, each with what would close it:

| MUST | Why open | Closes with |
|---|---|---|
| UX-01 | two targets only | owner decision 80 Q5: only when a real machine needs arm64 or macOS (the source-build pointer is in) |
| CMD-08 (`fgos`) | usage errors exit 4, not 2 | owner choice Q-A |
| DOC-02 | doctor exits 0 whatever the checks say | owner choice Q-B; `ok`, `next` and `--strict` exist |
| CMD-07 | no `--dry-run`, `-q`, `-v` everywhere; `--json` is a no-op on some verbs | owner idea: global flag parity |
| UX-14 | no `config edit` | owner idea |
| CFG-01, CFG-03 | config in `~/.fgos`; no `paths --json` | owner ideas (`paths --json`; move config to XDG with an alias window) |
| UPD-01, PRN-04 (residual) | the `fgctl` refresh has no ownership marker, no plan or confirm | owner idea: fgctl refresh marker |
| INS-15 | no `install.sh --uninstall` | owner idea |
| INS-04 (residual) | base URL meaning in `fgctl` and `install.ps1` | backlog `p-g3erqtmmib` |
| ONB-09, TST-04 | no README extraction in CI; no agent-native CI run | owner idea |
| RS-03 | no LTO | measured: build 2.35 times slower, start-up unchanged; a thin-LTO-only trial is the next measurement |

## Net lines against estimates

Sums of the lead reports' own `git diff --numstat` figures (added minus deleted, rounded; census, CHANGELOG and generated files excluded where the report said so). They were not re-measured with one command because other lanes landed in the same range.

| Phase | Estimate | Measured |
|---|---|---|
| P01 neutral defaults | YAML -50 to -150, Node +60, Rust 0, tests +60 | YAML -6, Node +70, Rust +9, tests +167, fixtures +81 |
| P02 doctor shape | Node +90, tests +60 | Node +110, tests +105, docs +7 |
| P03 fgctl surface | Rust +130, tests +60 | Rust +290, tests +152 |
| P04 fgos surface | Node +40, Rust +70, tests +60, prose -10 | Node +122, Rust +54, tests +190 |
| P05 config door | Rust +60, tests +40 | Rust +199, contract JSON +22, tests and fixtures +241 |
| P06 init closing block | Rust +90, tests +50 | Rust +238, Node +11, scripts +13, tests +255 (-57 retired in it) |
| P07 first-contact docs | docs about -5, Node +2 | docs +179 / -192 (README -65), Node +2 |
| P08 uninstall | Rust +200, Node +70 (-100 moved, -60 deleted), tests +120 | Rust +694, Node +254 net (+343, -89 in the arm), tests +625 net (+747, -122 deleted spike) |
| P09 download safety | shell +100, PS +15, Rust +30, Node +3, tests +100 | shell +209, PS +46, Rust +271, Node +17, tests +456 |
| P10 pin drift | Rust +40, Node +30, docs +15, tests +50 | Rust +66, Node +40, docs +31, tests +223 |
| P11 release correctness | Node +20, YAML +10, shell and PS +90, tests +25 | Node +129 (incl. two unplanned doctor rows), YAML +29, shell and PS +318, tests +166 |
| P12 speed | Rust +30, shell +3, toml +2, tests +25 | Rust about +60, shell +4, no toml change, tests +54 |
| **Total** | **+700 to +900 code and tests** | **code about +3,270 (Rust 1,880, Node 755, shell and PS 590, YAML and JSON 45), tests about +2,630: about +5,900** |

The plan said this work adds first-contact surface the standard requires and that the HARDEN "net at most 0" close rule would not be met by construction; the sum is six to seven times the estimate. What paid for it:

- **Uninstall (P08), about 1,570 lines with tests (27 percent).** The root guard, link refusal in every parent component, the store scan by name shape and the Node hook reversal are new code the phase file treated as a call to an existing table. It is the largest single hot spot; if the owner wants to trade safety checks for size, `uninstall.rs` is where.
- **Download safety and installers (P09), about 1,000 lines (17 percent).** `install.sh` is functions plus usage (about 90 lines of comments), the transport gate in two shells and `fetch.rs`, the archive listing, the single checksum entry.
- **First-contact surface (P03, P04, P06), about 1,300 lines (22 percent).** Per-verb help text is data (about 250 lines for `fgctl`, about 60 for `fgos`); the closing block and the facts it reads.
- **Tests, 45 percent of the total.** Fixtures that now state their installed agent CLIs (about 25 files, P01), canned-doctor wiring (P06), golden tables (P10), the consumer proof's assertions twice over (P11).
- Deleted or moved out: the README npm and `setup` sections (-65 lines), the inline uninstall arm (-89), the npm removal verb and its spike test (-122), `apps/fgctl` did-you-mean copy (-45), the `setup` description prose, the `thehive` cells.

Estimates were low for the same reason in every phase: they sized the code that closes a rule and not the proof that it holds. The next sub-plan should size tests at 1.5 to 2 times the code for a phase that adds a verb or a gate.

## Manual acceptance on fg-server2

Release assets built from `e182dec72` (`cargo build --locked --release --workspace`, `package-release-assets.mjs --version v0.2.0-p13final`), installed through `install.sh` from a `file://` mirror into a scratch HOME on ext4, an empty git project. Logs are in `/dev/shm/p13-final-*.log`.

| Step | Result |
|---|---|
| `install.sh` then `fgctl init` (no agent CLI on `PATH`) | `Ready: fgOS v0.2.0-p13final active (ba3342e2ecbb)`, `Next: fgos run "<prompt>"`, exit 0. `fgctl init` has no `--yes`; none was used. |
| `fgos doctor --json` | `ok: true`, 110 rows, 0 fail, 7 warn, `next: []`; `--strict` exits 0. |
| `fgos run "Reply with exactly the word OK" --json </dev/null` with no agent CLI | exit 4, `agent-cli-missing` with the CLIs and the fix. |
| Same run with a real agent CLI, cheapest tier (`nano`) | **Not completed in the scratch; the product path to the launch is proven, the answer is not.** Details below. |

What the real runs showed, and why no run ended `pass` in the scratch:

1. `fgos run ... --provider deepseek --override '{"tier":"nano"}'` with the machine's `pi` and its OpenRouter key copied into the scratch (copied, never linked): it bound `deepseek`, `nano`, `deepseek/deepseek-v4.1-flash`, launched the confined pi seat, reached the provider and got `402 This request requires more credits` from OpenRouter, so it ended `execution-failure` (exit 11). The OpenRouter account has no credit: an account matter, not a product defect.
2. `--provider gemini` at `nano` (`gemini-3.8-flash-low` through `omp`, the owner's default route) with `omp`, its natives and one gemini login profile copied: the seat does not start in a scratch HOME. `omp` resolves from the real HOME layout (`~/.local/bin`, `~/.omp/natives`) and writes its runtime directory to `PI_CONFIG_DIR: "../../tmp/fgos-omp-config"` (`core/config-standard/runner.yaml`), a path relative to HOME that only reaches a writable `/tmp` when HOME is two levels below `/`. In scratch HOMEs at other depths it failed with `EROFS` or `agent omp did not start`; I stopped there rather than run against the real HOME or the real login stores (a copied OAuth login that renews can invalidate the owner's real one).
3. With real CLIs on `PATH` a clean scratch cannot reach `ok: true` from `fgctl init` alone, which is expected: the README names the remaining steps (a claude seat login, a codex project trust entry). With only `omp` installed, `seat-binding-dry-bind` still fails and `confined-pane-accounts` fails for the `xai` executor (also served by `omp`) when only a gemini account exists. P11 relaxed the first only for a claude-only machine, so "one agent CLI is enough" holds for claude and not yet for omp.

For the owner: the first real answer is the post-activation `fgos run "Reply with exactly the word OK" --json` in the guide, run on a machine whose agent accounts are already set up (fg-server2's own smoke runs through gemini). That is the one acceptance step this close could not run.

## Rollback rehearsal

Scratch HOME, the final release, `/dev/shm/p13-final-rc5.log` and `/dev/shm/p13-final-prev.log`.

**To `v0.2.0-rc.5` (the release the owner's machines run before this upgrade).**

| Step | Result |
|---|---|
| rc.5's `install.sh` (tag `v0.2.0-rc.5`), `fgctl init --from <rc.5 asset>` | rc.5 active, config is JSON (`~/.fgos/config.json` with the gateway token, project `.fgos/config.json`). |
| New `install.sh`, `fgctl upgrade --from <final asset>` | exit 0, `Ready`, `Note: ~/.fgos/config.json moved; projects on an older release refuse until `fgctl upgrade``, `fgctl verify` ok, `fgos --version` `fgos 0.2.0`. |
| New `fgctl repair`, and `fgctl init --override-pin <reason> --from <rc.5 asset>` | **refused**: `git-addon-missing: linux-x64 requires components.nativeAddon with git-wal-v1`. The new `fgctl` will not activate a release that predates the Git addon. |
| rc.5's `install.sh` again (rc.5's own `fgctl`), restore the moved config from the `config-migrate` backups (global backup with `gateway.token` to `~/.fgos/config.json`, mode 600; project backup to `.fgos/config.json`; the two `config.yaml` files the migration wrote set aside), `fgctl repair` | exit 0, rc.5 active (`fgctl verify`: `verified active release sha256:51fee8e8...`). |
| rc.5 `fgos version` and `fgos doctor` | both run. rc.5 has no `--version` flag, so `fgos version` is the command. Doctor: 107 rows, 12 failing, **the same 12 rows as rc.5 on a fresh project before the upgrade** (checked with a second scratch), so the rollback restored rc.5's own baseline. |
| New `install.sh`, `fgctl upgrade --from <final asset>` | exit 0, `Ready`, config moved again, `fgctl verify` ok, `fgos --version` ok, doctor `ok: true`. Going forward works. |

Without setting the two `config.yaml` files aside, the forward step fails (`config-legacy-shadowed`, both files in one scope); the guide's steps set them aside.

**To the previous main build** (the release fg-server2 runs, `ed51feeafded`, staged into the scratch store by `fgctl init --from <its release directory>`, read only): upgrade to the final release, then `fgctl repair`. `repair` reactivates the previous release, `fgctl verify` prints `verified ed51feeafded`, `fgos version` runs, forward `fgctl upgrade` returns to the final release with doctor `ok: true`. The old build's own doctor then lists four failing rows (skills, trust store, accounts, codex trust) because it predates the "skip a CLI that is not installed" rule and the scratch has none of those; that is the old build's baseline, not a rollback defect.

## Backlog rows opened by this close

- `p-pvs4go2qei`: regenerate the how-to's doctor-check tables from `fgos doctor --json` (Documentation lane).
- `p-yfpixqfmdq`: what `fgctl` does with a release that predates `git-wal-v1` (refuse with a next step that names rc.5's installer, allow with a flag, or document).
- `p-xagoeec2i4`: `fgctl`'s exit 2 means both a usage error and "not ready", while the exit-code table gives usage errors 4; moving it changes a code scripts pin, so it is left for the owner after the release.

## Deviations from the plan

| Where | Plan | Landed | Reason |
|---|---|---|---|
| P01 | Rust 0 | `cli-missing` as a distinct rejection reason (+9 lines in the seat-binding crate) | a distinct reason beat labelling the skip `governance` |
| P01 | YAML -50 to -150 | -6 | after the cook move only six cells were owner routing; `prefer` chains list every CLI and the filter decides |
| P02 | `fix` per row | row key is `fixCommand`; the envelope's `next[]` is the rolled-up list | the one-door scanner follows the property name `fix` |
| P03 | no test asserts the old usage | one rust-host test did, retired; owner `cli_surface.rs` | found by reading |
| P04 | CMD-08 exit 2 | `fgos` keeps 4 | Q-A default: 2 is `precondition` |
| P06 | `init --yes` | none: `init` never prompts | no `--yes` flag exists to add |
| P06 | the two header-only files stay in `setup` | moved into `fgos init` | the config spec names init as their door |
| P08 | `--purge` removes the store | removes store entries by name shape; identity, locks and machine id stay | the state root holds more than release data |
| P08 | undo the wiring in global agent config | listed, never undone | `wire-agents` keeps no ledger (decision 80 Q2 (a) holds) |
| P10 | one new doctor row | one new row, no row replaced | the shared comparator does not exist (the digests are compared, not payload trees) |
| P11 | plan: 3 pieces | plus two doctor rows that skipped a CLI that is not installed, and a seat-binding row that warns | `ok` could never be true on a clean runner (found by the first live run) |
| P12 | skip `fgos init` on a no-op | `fgos init` always runs; a clean doctor ends the tail | OPC: `repair` after a crash needs init, no doctor fix covers it |
| P12 | LTO | measured and not taken | build 2.35 times slower, no start-up gain |
| outside the plan | none | upgrade from a JSON-era release migrates its config; Rust 1.99.0 pinned | the first red live proof of P11; owner request |

## Owner ideas still pending (nothing built unless the owner picks it)

From the plan's table, unchanged except the last three rows (one from the P01 report, two added by this close):

| Idea | MUST it closes |
|---|---|
| `fgos paths --json` | CFG-03, INS-12 |
| Move user config to `$XDG_CONFIG_HOME/fgos` with an alias window | CFG-01 |
| `config edit` | UX-14 |
| `fgctl` refresh never downgrades, runs `<staged> --version`, `.fgctl-managed` marker | UPD-01, UPD-04, UPD-06, PRN-04 |
| `install.sh --uninstall`, `--dry-run` | INS-15 |
| Global flag parity, `--json` on every verb | CMD-07 |
| Doctor exits non-zero on failure | DOC-02 |
| CI extraction of README blocks; an agent-native CI run | ONB-09, TST-04 |
| linux-arm64 and macOS-arm64 targets | UX-01 |
| Lint over user-facing strings | ONB-16 |
| Marketplace pinned to the release; dev-only fixture marketplace; draft, smoke, publish; actions pinned by SHA; rollback and yank runbook | CH-PLUGIN-02/06, REL-07/10/13 |
| `fgctl status` shows the release tag | CMD-05 |
| Merge `FGOS_STATE_ROOT` and `FGOS_STATE_HOME` | CFG-02 |
| Export `SOURCE_DATE_EPOCH` in the release workflow (about 2 lines) | CMD-06 residual |
| Accept and ignore `--yes` on `init` for agent loops | CMD-03 residual |
| Reorder the shipped `prefer` chains claude-first (they are gemini-first, the owner's cost taste; about 40 chains and pinned tests) | neutral defaults |

## Open items for T9

T9 inherits the four arms the sub-plan promised thin, with their owning tests below the arm:

| Arm | State |
|---|---|
| `doctor` | one call to `runDoctor` (`src/setup/registrations.mjs`); `--strict` reads `!data.ok` |
| `uninstall` | a call into `src/setup/uninstall-project.mjs`; about 90 lines left the arm |
| `setup` | collapsed to the git hooks path and the shell-rc line (the config files moved to `fgos init`); deprecated, listed once under "Compatibility" |
| `version` | the host answers `--version` natively; the Node `version` arm and its registry entry are untouched. T9 may delete it once the dev door needs no Node `version` (the registry/dispatch parity test and the `fgos-verb-help-json` fixtures call it) |

Authority items for T9 (what, where now, where it belongs):

- Exit-code table: the host's literal `exit(4)` sits in `refuse_unknown_verb` and four other places; read the category table instead (P04). The `run` guide lists exit codes as text; generate it from `OUTCOME_EXIT_CODES`.
- First-run text: three copies (`apps/fgos/src/main.rs`, `apps/fgctl/src/help.rs`, `README.md`) pinned by one test; belongs in one source.
- Help rendering (`renderGuide`, `renderFlagLines`, about 40 lines) sits in `bin/fgos.mjs`; belongs in a `src/cli/` module.
- Did-you-mean: a third copy in `packages/config/rust/src/schema.rs` (backlog `p-xtawpgzvjy`).
- "Is this CLI installed": `isCommandAvailable` (`src/runner/paths.mjs`) is the one for rows and bind; `findExecutableOnPath` exists twice and four more PATH walkers remain (P01, P11).
- Store layout: `uninstall.rs` restates the names of `releases/`, `quarantine/` and `installs/`; a `store.rs` helper (`is_store_entry_name`) should own them; the machine "release store root" is the whole state root and its name hides that.
- Global agent wiring has no reverse: `agent-wiring.mjs` would need a ledger next to its backups (decision 80 Q2 (a): not added).
- The pin comparison exists once per language tied by one golden (`pin_drift`, `checkActivationMatchesPin`); if doctor ever calls `fgctl status`, the Node reader goes.
- The doctor row catalog is held twice: the code and the how-to tables (backlog `p-pvs4go2qei`, Documentation lane).
- Open backlog rows on the launcher, shim and mailbox timer (`p-wn7ss4iyab`, `p-ls4tuvflrd`, `p-qqcf5lqqtn`) are outside this sub-plan.

## Known red on main (not from this work)

- The V7n addendum test (frozen, known).
- `check-decision-citation-drift`: five findings in `docs/platform/documentation/subcomponents/document-identity/spec.md` (ADR0035 line 52, ADR0055 line 206, RUL84 lines 207 and 550) cited without a gloss; they come from the documentation lane's commits of 2026-11-12 (`22b5219a9`, `3a02fd712`, `3a04159b6`). The documentation lane owns the fix; this close does not touch it.
- The how-to's doctor-check tables lag the live doctor by about 40 rows; one backlog row (`p-pvs4go2qei`) asks the Documentation lane to regenerate them from `fgos doctor --json`.

## Findings made while closing

1. **The new `fgctl` refuses to activate `v0.2.0-rc.5`.** `fgctl repair` and `fgctl init --override-pin` both stop with `git-addon-missing: linux-x64 requires components.nativeAddon with git-wal-v1`: rc.5 predates the Git addon the activation gate requires. The way back to rc.5 is rc.5's own installer and `fgctl` plus a restore of the config files the upgrade moved (rehearsed, above, and written into the guide); a rollback to a release that has the addon is one `fgctl repair`. The refusal text lives in the distribution crate, outside this phase's files, so it was not changed; `p-yfpixqfmdq` asks the owner whether the refusal should name the rc.5 installer, an override should exist, or the guide alone is enough.
2. **A `TMPDIR` under `/dev/shm` fails doctor `confinement-probe-freshness`** (the sandbox's private `/dev` hides the probe's host-side file); a project on ext4 with `TMPDIR` in `/dev/shm` fails the same way, while `TMPDIR` unset (`/tmp`, a tmpfs here) and `TMPDIR` on ext4 pass. Only a path under `/dev` is affected, which is not a common `TMPDIR`, so no backlog row was opened.
3. `fgctl status` prints `version: none` for a release whose tag the store did not record (CMD-05, SHOULD).
4. The standard `omp` invocations set `PI_CONFIG_DIR: "../../tmp/fgos-omp-config"`, relative to HOME, which resolves to a writable `/tmp` only when HOME is two levels below `/` (the owner's layout). Layout-dependent; found only because the acceptance ran the gemini seat in a scratch HOME. Not filed: the owner's machines are not affected, and a clean user HOME such as `/home/<name>` matches.
5. `fgctl --version` carries the commit only through `FGOS_BUILD_COMMIT` or `GITHUB_SHA` and never the commit time; `release.yml` exports neither `SOURCE_DATE_EPOCH` nor `FGOS_BUILD_COMMIT` (CI sets `GITHUB_SHA` itself).

## Lessons

- Estimates counted the code that closes a rule and not its proof; every phase landed at two to four times its test estimate. Size tests separately.
- The audit's own method (a scratch HOME on a tmpfs) is not safe for the sandbox: pick ext4 for scratch homes that run doctor.
- A rollback claim in a guide must be rehearsed on the real previous release: rc.5 is a valid target only through rc.5's own installer, and only with its config restored; the new `fgctl` refuses it. Rehearse both the refusal and the way around it.
- A real agent run in a scratch HOME depends on the real HOME layout (binaries, natives, a HOME-relative config path) and on login stores that renew; plan the acceptance run on a machine whose accounts are already set up instead of copying logins.
- `pkill -f` with a pattern that also matches the calling shell ends the shell; match a pid.
- The packaging standard's Verify table has rows (`init --yes --json`) that describe a different archetype; record the deviation instead of adding a flag that does nothing.
