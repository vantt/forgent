---
title: "HARDEN packaging and distribution sub-plan: first contact, safe install and uninstall, correct releases, fast re-runs"
description: "Closes the audit's remaining MUST fails under owner decision 80 (Q1 a, Q3 a, Q4/5 a): thirteen phases in the skill's order (UX, safety, correctness, speed), one writer per hot file, T9-aware."
status: pending
priority: P1
effort: ~12d of lead work (12 phases plus a close); ~6d critical path; widest group 3 leads
branch: main (plan only; each phase runs on its own track branch `harden/pkg-pNN-<slug>` in its own linked worktree from origin/main)
tags: [harden, packaging, distribution, fgctl, install, doctor, uninstall, first-contact, release]
blockedBy: []
blocks: [261021-1118-harden-low-layers-bottom-up]
created: 2026-11-09
---

# HARDEN packaging and distribution sub-plan

Baseline: `origin/main` `a945bc03a` (2026-11-09 16:1x). Every `file:line` below was re-read on it; a line carried from the audit (written on `eca97c5fe`) and not re-read is tagged `[AUDIT]`, a claim I could not trace is tagged `[UNVERIFIED]` and its phase has a facts step that settles it first.

Inputs: [audit](../reports/audit-261109-1533-fgos-packaging-distribution.md) (42 MUST fail, 31 partial, 22 findings F1-F22, owner questions Q1-Q5); owner decision 80 in the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) (line 263); the skill `cs-packaging-distribution` (SKILL.md priority order, `common/*.md`, `templates/project-checklist.md`); [vision](../../docs/platform/packaging-distribution/vision.md) and [spec](../../docs/platform/packaging-distribution/spec.md).

Citations, glossed once: **RUL104** (better, not bigger: no feature, layer or mechanism unless the owner chose it; a contract change moves every caller and deletes the old path); **RUL11** (gather the mess inside the scope; mess outside becomes its own item); **L10** (extend through the door, not beside it); **one proof** (design principle 8: one owning test per behaviour). Rule ids (`CMD-03`, `SEC-04`...) are the skill's, from `common/*.md`.

## Outcome

On a clean machine with the supported prerequisites (Node >= 18, git, curl), a new user reaches first value with: `curl ... | sh`, `fgctl init`, `fgos run "<prompt>"`. `fgctl init` ends on `Ready` or on a numbered list of what still needs the user, each with a runnable fix. Release defaults never name an agent CLI the machine lacks; with none installed, `fgos run` says so and names the fix. Every tool answers `--version` and a useful `--help`. Downloads refuse `http://` (loopback aside), installers sit in `SHA256SUMS`, and `fgctl uninstall` reverses what fgOS wrote in the project while keeping user config and data (`--purge` also drops the release store). A release cannot publish from a red main; the plugin version cannot drift; an upgrade from the previous tag is proven in CI. A no-op `init`, `repair` or `upgrade` costs one doctor run (about 4 s, down from about 9 s) and says `nothing to do`.

**Non-goals (decision 80 and RUL104):** no linux-arm64 or macOS build (Q5: only when a real machine needs one); no change to the committed pin's value (Q4 changes only how drift is shown and when the pin moves); no new verb, flag or mechanism beyond what decision 80 names. Those go to [Owner ideas](#owner-ideas-not-phases).

## Excluded: two items already in flight with their own leads

Both worktrees (`forgent-worktrees/harden-t9-shim-root`, `harden-global-agent-wiring`) were clean and at `a945bc03a` on 2026-11-09 16:2x, so the file lists below come from decision 80 and audit F10 plus a read of the code, **not** from a diff. Each phase lead re-reads both branches (`git diff --name-only origin/main...<branch>`) before its first edit.

| In flight | Decision 80 text | Files it will touch (predicted) |
|---|---|---|
| (1) Shim and root walk | the `~/.local/bin/fgos` shim execs only a `.fgos/installation/bin/fgos` verified against the machine release store; the root walk never takes `$HOME`'s `~/.fgos` as a project store | `packages/distribution/rust/src/shim.rs` (733 lines, the shim); `apps/fgos/src/main.rs:123-143` (the host's own `.fgos` ancestor walk, H17); their tests |
| (2) No global agent writes + opt-in wiring (Q2) | `fgctl init`, `fgos setup`, `doctor --fix` never write a user's global agent config; a named opt-in command wires only agents present, prints and backs up first, never sets `always-proceed` | `src/setup/registrations.mjs` (host table, `fixAgyPermissionsConfigured`, the Claude plugin fixes at ~2108-2135 `[AUDIT]`), `src/setup/agent-hooks.mjs`, `src/setup/agy-permissions.mjs:142`, `src/setup/mailbox-claude-accept.mjs`, the new verb's registration (`src/cli/command-registry.mjs`, `bin/fgos.mjs` or `packages/host-runtime/contracts/command-routes.json`), `packages/distribution/rust/src/init.rs` only if the tail changes |

**Item (2) landed 2026-11-09 17:18**, main `d1356df76..ed38755fd` ([report](../reports/lead-261109-1634-harden-global-agent-wiring.md)): opt-in verb `fgos wire-agents`, `src/setup/agent-wiring.mjs`. Agent presence is not a registry table: `planAgentWiring` checks `claude --version` and `firstOnPath('agy')` and lists the absent agents; phase 01 reuses that function. No reverse command exists for phase 08 (report section 4).

Also in flight, not ours: T8 phase 11 (`harden-t8-p11-domain-dirs`, uncommitted) edits `src/setup/registrations.mjs`, `docs/architecture-manifest.json` and four runner files. Registrations edits below queue behind it.

What this plan takes from them: item (2) makes "which agent CLIs are on this machine" a table lookup in the registry. Phase 01 reuses that lookup (and `findExecutableOnPath`, `src/runner/paths.mjs:150`); it must not add a sixth PATH search. Item (2)'s opt-in command has a removal path or none; phase 08 prints whichever it is.

## Phases

Order follows the skill: tier 1 UX, tier 2 safety, tier 3 correctness, tier 4 speed. Tier 2 and 3 items that cost a tier-1 user nothing run beside tier 1 where files allow.

| # | Phase | Tier | Depends on | Hot files it writes | Effort |
|---|---|---|---|---|---|
| 01 | [Neutral release defaults, detected agent CLIs only, clear no-agent error (Q1 a)](phase-01-neutral-release-defaults.md) | 1 | (2) landed for its two doctor rows; guide before land | `core/config-standard/runner.yaml`, `registrations.mjs` (2 rows), `model-pool-checks.mjs` | 1.5d |
| 02 | [Doctor result shape: status, fix, ok, next; git row converges](phase-02-doctor-result-shape.md) | 1 | (2) and T8-P11 landed | `registrations.mjs`, `git-checks.mjs`, `bin/fgos.mjs` (doctor arm) | 1d |
| 03 | [fgctl command surface](phase-03-fgctl-command-surface.md) | 1 | none | `apps/fgctl/src/main.rs` | 0.75d |
| 04 | [fgos command surface](phase-04-fgos-command-surface.md) | 1 | (1) landed; (2) landed; 02 on `bin/fgos.mjs` | `bin/fgos.mjs`, `apps/fgos/src/main.rs`, `src/cli/command-registry.mjs` | 1d |
| 05 | [Config door ergonomics](phase-05-config-door-ergonomics.md) | 1 | none | `packages/config/rust/src/*` | 0.5d |
| 06 | [`fgctl init` closing block and result lines](phase-06-init-closing-block.md) | 1 | 02; P09 if a consumer-script line changes; 01 for the clean-HOME acceptance run | `packages/distribution/rust/src/init.rs` | 0.75d |
| 07 | [First-contact docs and the npm channel retirement (H14)](phase-07-first-contact-docs-npm-retire.md) | 1 | 04, 06, 08, 10 (text must match output) | `README.md`, docs, `bin/fgos.mjs` (one message) | 0.5d |
| 08 | [`fgctl uninstall` (Q3 a)](phase-08-fgctl-uninstall.md) | 2 | 03; 04 on `bin/fgos.mjs`; (2) for the global-wiring line | `apps/fgctl/src/main.rs`, `uninstall.rs` (new), `bin/fgos.mjs` (uninstall arm) | 2d |
| 09 | [Download safety and installer shape](phase-09-download-safety-installers.md) | 2 | P03 for its last step only (candidate `--version`) | `install.sh`, `scripts/install.ps1`, `fetch.rs`, `scripts/package-release-assets.mjs` | 1.25d |
| 10 | [Activation-vs-pin drift row and the pin bump step (Q4/5 a)](phase-10-pin-drift.md) | 3 | 02, 06 | `registrations.mjs` (1 row), `init.rs`, release how-to | 0.75d |
| 11 | [Release correctness: plugin version, test gate, upgrade-from-tag](phase-11-release-correctness.md) | 3 | 09 (consumer scripts); 08 for the uninstall smoke step | `release.yml`, `prepare-release.mjs`, `ci-external-consumer.*` | 1d |
| 12 | [Speed: no-op re-runs, download cap, release profile](phase-12-speed.md) | 4 | 10 (`init.rs`), 09 (`install.sh`, `fetch.rs`) | `init.rs`, `fetch.rs`, `install.sh`, `Cargo.toml` | 0.75d |
| 13 | [Close: checklist re-run, Vietnamese guide, closing report](phase-13-close.md) | - | 01-12 | spec, verification doc, reports | 0.5d |

Status of every row: pending, except P02, P03, P05 and P09 (completed, 2026-11-09).

## Coverage: the 42 MUST fails

Counted from the audit's checklist tables (a rule row listing several ids counts each id). Phase 13 recounts on the final tree.

| Where it goes | MUST fails | Count |
|---|---|---|
| In flight (2), excluded | AGT-01, PRN-03, PRN-04 (the global-write half) | 3 |
| P01 | UX-10, ONB-14 (run error), ONB-08 (with P06, P07) | 3 |
| P02 | DOC-01, CMD-18, CMD-10 (git row) | 3 |
| P03 | CMD-06, CMD-08, CMD-15, CMD-16 (fgctl side) | 4 |
| P04 | CMD-04, CMD-06, CMD-15, CMD-16 (fgos side); CMD-08 for fgos only after owner choice Q-A | 4 |
| P05 | UX-15, CMD-10 (config reason) | 2 |
| P06 | ONB-10, ONB-12, CMD-03 | 3 |
| P07 | ONB-06 | 1 |
| P08 | UNI-01, UNI-02, UNI-03 | 3 |
| P09 | SEC-04, INS-02, INS-04 (tag, help, one meaning per variable), INS-06 | 4 |
| P11 | VER-03, POLY-02, CH-PLUGIN-01, REL-03, TST-03 | 5 |
| P12 | RS-03 | 1 |
| Left open for the owner (see Owner ideas) | UX-01 (decision 80 Q5), UX-14, UPD-01, CFG-01, CFG-03, DOC-02, ONB-09, INS-15, TST-04, CMD-07 | 10 |

Rows above sum above 42 because ONB-08, CMD-10 and the CMD-06/15/16 pairs are closed by two phases each; the unique count is 29 closed by phases + 3 in flight + 10 left open = 42. The 31 partials are closed where a phase touches them (named in each phase's "Closes" line); Phase 13 reports how many remain.

## File ownership (one writer per file; "chain" = serial order on a hot file)

Parallel groups are file-disjoint inside a group. A phase may start its non-hot work before its chain turn; only the hot-file edit waits.

| Group | Phases (parallel inside) | Start condition |
|---|---|---|
| G1 | P03, P05, P09 | now (P09's candidate-check step after P03 merges) |
| G2 | P02, P01 (everything but its two doctor rows) | (2) and T8-P11 landed for `registrations.mjs`; P01's YAML, run-error and guide start now |
| G3 | P04, P06 | P04 after (1), (2), P02 on `bin/fgos.mjs`; P06 after P02 and P09 |
| G4 | P08, P10, P11 | P08 after P03, P04; P10 after P02, P06; P11 after P09 (its uninstall smoke step after P08) |
| G5 | P07, P12 | P07 after P04, P06, P08, P10; P12 after P10 and P09 |
| G6 | P13 | all landed |

| Hot file | Chain (one writer at a time) | Why it is hot |
|---|---|---|
| `src/setup/registrations.mjs` (3 961 lines, 91 `registerCheck` calls) | (2), T8-P11, P02, P01 (2 rows), P10 (1 row) | the doctor registry; every lane edits it |
| `bin/fgos.mjs` (5 379 lines) | P02 (doctor arm `:4241`), P04 (version `:1001`, help/usage `~:4600`), P08 (uninstall arm `:4128-4240`), P07 (one message `:5216`) | T9 later moves logic out of its arms |
| `packages/distribution/rust/src/init.rs` (2 393 lines) | P06, P10, P12 | `run_tail :559`, status `:1914`, init/upgrade/repair entry points |
| `apps/fgctl/src/main.rs` (311 lines) | P03, P08 | verb table `:76-308` |
| `install.sh` (206 lines) | P09, P12 | one script |
| `packages/distribution/rust/src/fetch.rs` (568 lines) | P09, P12 | `CURL_ARGS :47`, `is_url :135` |
| `scripts/ci-external-consumer.{sh,ps1}` | P09 (env variable meaning only), P06 (at most two lines, only if the proof asserts init's old silent exit 0), P11 | consumer proof |
| `core/config-standard/runner.yaml` | P01 only (including its Vietnamese doc lines `:705-709`) | shipped standard |
| `apps/fgos/src/main.rs` | (1), P04 | host; owned by T9 later |
| `CHANGELOG.md` | append-only: each phase adds one line under `## [Unreleased]`; the later merger keeps both | not a chain |

`apps/fgctl`, `install.sh` and `scripts/install.ps1` are Packaging, not T9. `bin/fgos.mjs` and `apps/fgos/src/main.rs` are T9's host.

## Coordination with T9 (decision 77)

T9 moves logic out of `bin/fgos.mjs` arms into the owning layer's use case, bottom-up, and opens after T8 passes council. Packaging phases that touch the shell:

| Phase | `bin/fgos.mjs` | `apps/fgctl` | `install.sh` | Other T9 surface |
|---|---|---|---|---|
| P02 | doctor arm `:4241` (a call, not logic) | - | - | - |
| P03 | - | yes | - | - |
| P04 | version `:1001`, help/usage `:4600-4612` | - | - | `apps/fgos/src/main.rs`, `src/cli/command-registry.mjs` |
| P06 | - | no (`packages/distribution/rust/src/init.rs`) | - | - |
| P07 | message `:5216` | - | - | - |
| P08 | uninstall arm `:4128-4240` | yes | - | - |
| P09 | - | - | yes | `scripts/install.ps1` |
| P12 | - | - | yes (cap) | - |

Proposed order: packaging phases P02, P04, P08, P07 land **before T9 opens the `doctor`, `setup`, `uninstall` and `version` arms**. Rule for every packaging lead: logic goes down (doctor envelope into `src/setup`, uninstall into `src/setup/uninstall-project.mjs`, version and usage into the Rust host), and the arm keeps at most a call plus its flag parse. T9 then inherits four arms already thin, with their owning tests below the arm. If T9 opens first, it skips those four arms until this sub-plan closes, and the T9 lead gets the list above on the board. Packaging does not wait for T9: tier 1 is the owner's first priority.

## Test matrix

| Layer | What | Where | Notes |
|---|---|---|---|
| Unit | pure policies: did-you-mean, exit-code mapping, drift comparison, uninstall plan builder, URL scheme gate, checksum single-entry match | beside the owner: `packages/distribution/rust/src/*` `#[cfg(test)]`, `test/setup/*.test.mjs`, `packages/config/rust` tests | lowest layer that observes it |
| Integration | CLI surfaces as a child process in a temp `HOME` (every `XDG_*` and `TMPDIR` redirected, `PATH` without the real `~/.local/bin`) | `apps/fgctl/tests/cli_surface.rs` (new, P03/P06/P08), `apps/fgos/tests/cli_tests.rs`, `test/install/install-sh.test.mjs` | TST-08 |
| End to end | consumer proof: install, init, doctor `--strict`, run-error, upgrade from the previous tag, uninstall | `scripts/ci-external-consumer.{sh,ps1}` | one wiring proof per boundary |
| Live | the audit's scratch-HOME run, repeated on the final tree | P13 | numbers go in the closing report |

Every phase lists "Red tests first" (written, run, seen failing, then code). Each new test names its behaviour and why no existing test proves it; a retired test names its new owner.

## Risks across phases

| Risk | L x I | Mitigation |
|---|---|---|
| Registry edits collide with T8-P11 and item (2) | High x Med | chain above; non-hot work starts early; leads rebase on the landed predecessor, never on a branch |
| `init` exits non-zero on a not-ok doctor and breaks callers (consumer proofs, scripts) | Med x High | P06 acceptance is "clean-HOME `init --yes` ends `ok: true`"; callers moved in the same change (P06 for Rust, P11 for the consumer scripts) |
| Plugin version aligns to the product (0.2.x < 1.2.0): installed plugins may not see the update | Med x Med | owner choice Q-C; default: accept and say "reinstall the plugin once" in the release note |
| `fgos` usage exit 4 -> 2 collides with `EXIT_CODES.precondition = 2` (`src/state/store.mjs:53`) | High x Med | owner choice Q-A; default: keep 4 for `fgos`, record the deviation; fgctl moves to 2 |
| LTO lengthens release builds | Low x Low | measured in P12; keep only if the delta is within ~2x of today |
| Owner's machines lose their routing when the standard goes neutral | Med x High | P01 guide first, and a before/after `fgos dispatch explain` on his machines before the release is activated |

## Rollback

Each phase is one track branch merged as a unit; revert is `git revert` of its merge commit. Behaviour that ships in a release (P01 standard, P06 exit code, P08 verb) reverts by activating the previous release (`fgctl repair` / `fgctl init --override-pin`), which the pin model already supports. P01 additionally keeps the owner's old routing in his global config (guide), so a revert needs no config edit.

## Owner choices that block a MUST (not new mechanisms; contracts the owner set)

| Id | Question | Default if unanswered | Closes |
|---|---|---|---|
| Q-A | `fgos` usage errors: exit 2 as the skill says, or keep 4 (validation) because 2 is already `precondition` in the one exit-code map and 80 verbs plus tests rely on 4? | keep 4, record the deviation; fgctl moves to 2 | CMD-08 (fgos half) |
| Q-B | `fgos doctor` exit code: README and spec say exit 0 whatever the checks say (`README.md:157`); the skill wants non-zero when a check fails | keep; P02 adds `ok` and `next[]` so agents do not need the exit code; `--strict` stays | DOC-02 |
| Q-C | Plugin version follows the product (0.2.x), which sorts below the installed 1.2.0 | accept; one-line reinstall note | VER-03, CH-PLUGIN-01 |

## Owner ideas (not phases)

Each is a new mechanism, flag or verb not covered by decision 80. Nothing here is built unless the owner picks it (RUL104). Each row says the MUST it would close.

| Idea | Reason (evidence) | Benefit | MUST closed |
|---|---|---|---|
| `fgos paths --json` | no door states where config, state, store, launcher and fgctl live; Windows store under `%USERPROFILE%\.local\state` (`state_root.rs:84` `[AUDIT]`) | uninstall and docs stop guessing; ~40 lines from existing resolvers | CFG-03, INS-12 |
| Move user config to `$XDG_CONFIG_HOME/fgos` with an alias window | `~/.fgos` mixes config, secrets, cache | OS conventions; clean backup/uninstall; a migration | CFG-01 |
| `config edit` | `fgos config edit` is an unknown subcommand | edit with validate-on-save; ~60 lines | UX-14 |
| fgctl refresh: never downgrade, run `<staged> --version` before the swap, `.fgctl-managed` marker (`fgctl self-update` if wanted) | project B held on vN drops the machine fgctl from vN+1 (`fgctl_refresh.rs:80-190` `[AUDIT]`); a dev's `target/release/fgctl` can be overwritten | manager version is deliberate; ~60 lines Rust plus a line per installer. Smallest useful slice, if only one: the version comparison (~20 lines, no marker) | UPD-01, UPD-04, UPD-06, INS-07/08 |
| `install.sh --uninstall`, `--dry-run`, `--version` parity with env, `FGCTL_*` flags | install.sh has env only; INS-15 wants `--uninstall` | one-liner removal of the binary; P08's `fgctl uninstall` covers project and store, not the launcher | INS-15, INS-04 (rest) |
| Global flag parity: `--dry-run`, `-q`, `-v`, `--no-color`, `-c`; `--json` on every verb | `--json` is a no-op on many verbs; `--pretty` replaces TTY detection | one surface for agents | CMD-07 |
| Doctor exits non-zero on failure | see Q-B | agents can trust the exit code | DOC-02 |
| CI extraction of README code blocks, and an agent-native CI run (`init --yes --json`, doctor loop) | README steps drifted from the product unnoticed | the quick start cannot rot; proves an agent can install from `--help` alone | ONB-09, TST-04 |
| linux-arm64 and macOS-arm64 targets | decision 80 Q5: only when a real machine needs one; the unsupported-target pointer is in P09 | wider reach; ~2x release time | UX-01 |
| Lint over user-facing strings (internal ids, non-English) | `tsk-*` and Vietnamese reach users (F20); P01/P02/P07 clean what they touch | the sweep stays done; ~30 lines | ONB-16 (SHOULD) |
| Marketplace pinned to the activated release or tag; `dogfood-fixture` in a dev-only marketplace; draft, smoke, publish; actions pinned by SHA; rollback and yank runbook | audit F13/F14 SHOULD-level parts | release hygiene | CH-PLUGIN-02/06, REL-07/10/13 |
| `fgctl status` shows the release tag; recovery how-to split into product recovery and contributor page | F18, F19 | docs and status honest after P10 | CMD-05 (SHOULD) |
| Merge `FGOS_STATE_ROOT` and `FGOS_STATE_HOME` | two names for one root (`state_root.rs:72-77` `[AUDIT]`) | one door (L10); a contract change with an alias window | CFG-02 |

**Mess outside this scope, filed as items, not fixed here (RUL11):** five PATH-search helpers exist (`src/runner/paths.mjs:150`, `src/setup/project-launcher.mjs:78`, `src/runner/dispatch/provider-credential-probe.mjs:34`, `src/runner/dispatch/confinement/policies.mjs:669`, `src/runner/dispatch/confinement/resources.mjs:116`); the unguarded `dispatch-decide` and `decision-question` hook registrations are in P08 because uninstall depends on them being safe to leave behind.

## Acceptance criteria (sub-plan)

- A scratch-HOME run of the audit's 15 steps (`plans/reports/audit-261109-1533-fgos-packaging-distribution.md`, "How the live check ran") ends with: install to first value in 3 commands; `init --yes` ends `ok: true` and prints `Ready` plus one runnable next step; `fgos run` with no agent CLI exits with `agent-cli-missing` and a fix; no-op `init`, `repair`, `upgrade` each about one doctor run (<= 4.5 s, from about 9 s) and printing `nothing to do`.
- `fgctl --version`, `fgos --version`, `fgctl <verb> --help`, `fgos <verb> --help` all exit 0 and carry the CMD-16 fields.
- `fgctl uninstall --yes` in that scratch project leaves no hook entry, generated skill, `.fgos/installation` or activation; user config and data stay; `--purge` removes the store.
- `http://` non-loopback downloads are refused by `install.sh`, `install.ps1` and `fgctl`; `SHA256SUMS` lists both installers.
- Plugin manifest version equals the product version, enforced by a test; `release.yml` publish needs the full suite; the consumer proof upgrades from the previous tag.
- Each phase reports measured net lines (Node, Rust, YAML, tests) next to its estimate. This plan **adds** first-contact surface the standard requires, so the HARDEN "net <= 0" close rule is **not** met by construction; every addition names the MUST it closes and every deletion is listed. Expected net: roughly +700 to +900 lines code and tests combined, of which ~260 are `fgctl uninstall`; deletions: README npm sections (~-20), owner pools and skill claims in `runner.yaml` (~-50 to -150), the inline uninstall arm body (~-100 in `bin/fgos.mjs`, moved), and the retired text in `setup`'s deprecation prose.

## Docs and decisions

Phase 13 writes decision 80's narrative into the spec's decision history (`docs/platform/packaging-distribution/spec.md:752` "Lịch sử quyết định"), updates `verification/implementation-alignment.md` (vision section 7 requires it for every new claim), writes the filled checklist beside it, and adds the CHANGELOG lines. Spec section 3 (install channels), section 6 (doctor, fix, legacy setup) and `README.md` change in P07, not earlier.

## Landing

Self-land on fg-server2 when each phase's gate passes (npm test and `cargo test --workspace` green, `convention check`, architecture test). Owner machines by the Vietnamese guide in P13; P01's guide goes first and gates P01's landing (decision 80 Q1). Tell the T9 lead and the DOC lead (spec and README paths) before each merge.

## Unresolved questions

1. P01 detection timing: probe at bind time (stateless, recommended) or persist at `init` (decision 80 says "`init` detects")? Default: probe at bind and at `init`/doctor with one shared function; nothing persisted, so a CLI installed later just works.
2. Q-A, Q-B, Q-C above.
3. The new doctor row in P10 is authorised by decision 80 but the HARDEN size rule says a new row names the row it replaces. None is replaced; P10 checks whether `active-release-matches-checkout` (`registrations.mjs:2884`) can share its comparator and reports. Owner OK to add a row?
4. Does `fgctl init` stay the only door that writes the two header-only config files that `fgos setup` writes today (P06 step 1 decides after reading the `setup` arm `bin/fgos.mjs:4022`)?
