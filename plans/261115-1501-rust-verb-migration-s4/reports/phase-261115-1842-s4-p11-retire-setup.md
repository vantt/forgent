# Phase 11 report: retire `setup` (S4 packaging)

Branch `rust-verb-migration-program/s4-p11`, rebased on `origin/rust-verb-migration-program/s4` `8043a263f`.
Worktree `/home/vantt/projects/forgent-worktrees/rvm-s4-p11`. V1 as corrected in the plan Decision log (18:00): this phase wires no
hooks path; the hook row's text now names `npm run setup:hooks` (04 owns the row's applicability).

## What changed

- `setup` leaves the registry, the arm, `renderPretty`, the `ansi.mjs` import; routes, manifest and the envelope vector regenerated
  (`setup` has no route; `fgos setup`, `fgos setup --pretty`, `fgos setup --help` answer unknown verb, exit 4, stdout empty; one new
  `cli_tests.rs` case owns it).
- Deleted: `src/setup/{setup-use-case,runner-config-conversion,ansi}.mjs`; `materializeSkillsIntoProject` and its `keptCopy`;
  the `keep` plumbing of `generateAllSkillWrappers`/`copyDirRecursive`/`pruneExtras` (its only caller was materialize);
  `insertSourceLine`, `deadSourceLines`, `probeShellIntegrationInvocation`; the row `shell-integration-sourced` (body,
  registration, `describeNonGitShellIntegration`, registry entry, spec and contract lists).
- Kept on purpose: `detectRcFiles` (session-start hook, D18), `hasSourceLine` (uninstall until 09), `createProjectSkillGuard`
  (uninstall-project, 09 deletes), `integrationScriptPath`. `retiredJsonAdvice` moved next to the `runner-patterns-config` body.
- Texts that named `fgos setup` now name the current door (registry descriptions, mailbox standard and schema, capability catalog
  plus `build:skills`, the five Rust refusal texts of F15 (`fgos doctor --fix`), comments in worker-slots, tier.rs, limits.rs,
  repository_config.rs, mailbox_body.rs, the shell script, `scripts/install-git-hooks.mjs`, `scripts/git-one-door-scan.mjs`).
- Registry (109 rows) and the exact-set expectations (Rust `mod.rs`, `registrations.test.mjs`): S4 label gone from the split,
  `(8, 31, 6, 8)`; `doors`: stale entries removed (`global fgOS directory` debt, config-file door allow, `writer and session id
  environment` allow for `registrations.mjs`); `shell rc fgOS lines` debt reason reworded (uninstall, not setup).

## Retired test -> owner now

| Retired | Owner now |
|---|---|
| `setup-use-case.test.mjs`, `checks-setup-envelope`, `checks-setup-rc-line`, `ansi.test.mjs`, `runner-config-conversion.test.mjs` | behaviours removed (shell-rc line writing, runner-config conversion, ANSI render of setup, setup envelope) |
| `fgos-setup.test.mjs` "setup in a .fgos-less worktree" | removed with the verb; the unknown-verb answer is owned by `cli_tests.rs::a_retired_verb_answers_unknown_verb_for_a_call_and_for_its_help` |
| `fgos-manifest.test.mjs` "setup is marked deprecated" | replaced by "a retired verb has no registry entry" |
| `dir-resolution` setup case | behaviour removed; doctor and uninstall worktree cases stay (preconditions use `init`, `installGitHooks`) |
| `claude-code-hooks` two CLI setup cases | removed; fill-only behaviour is owned by the unit cases of the same file |
| `agent-wiring` `setup` leg | the init and doctor --fix legs of the same case |
| `skill-wrappers` materialize cases (8) + setup halves of 3 | removed; render keeps the foreign-skill, same-name refusal and earlier-forms cases, now driven through `renderSkillSurfaces` |
| `checks-doctor-config` 8 `shell-integration-sourced` cases, `shell-rc` insert and dead-line cases | row and writer removed |
| help.rs two `setup` cases | same rules asserted on `compound` |

Uninstall tests that used setup or materialize as fixture setup (`uninstall-project`, `uninstall-wiring-2/3`) now build their wiring
directly (a local render helper, `installGitHooks`, `installClaudeCodeHook`).

## Gates

fmt ok; clippy `-D warnings` fgos, fgctl, event-store, identity, git, distribution ok; `cargo test -p fgos -p fgctl` ok; msvc and
darwin `cargo check` (fgos, event-store, identity, git) ok; census regenerated, 0 undeclared; `export-command-selectors --check` ok.
Node: `test/setup/*` (741), `test/cli/*` + `test/verbs/*` (832), `test/rust-host/*`, `test/scripts/*`, `test/skills/*`,
`install-packaging`, `architecture`, `worker-slots`, `init-config-files` ran. After rebase, architecture, registrations, manifest,
routes, help-routes, dir-resolution, doc-health re-run green.
Red on the integration head already, not from this phase: `verb-parity.test.mjs` (needs `FGOS_TEST_PARITY_BASE`),
`check-decision-citation-drift` (spec.md:797 RUL109 gloss), `mailbox-behaviour-v7n.test.mjs` (frozen module change; fails in the
`rvm-s4-p09` worktree at the s4 head too, passes at main). `mailbox-live-confined` "two heads" failed once under load, green alone.
Could be affected beyond the focused set: the full `npm test` (the series gate).

## Proposed `## [Unreleased]` line

"`fgos setup` is retired and answers \"unknown verb\" like any other unknown verb. Onboard a project with `fgctl init`; repair it
with `fgos doctor --fix`. It no longer adds a shell-rc source line (existing lines keep working and `fgos uninstall` names them), no
longer copies the release's skills into a project, no longer converts retired runner config keys, and no longer sets
`core.hooksPath` (the fgOS source checkout uses `npm run setup:hooks`); the doctor row `shell-integration-sourced` is gone. Error
texts that told you to run setup now name `fgos doctor --fix`."

## Differences from the phase text

- `test/cli/fgos-setup.test.mjs` is mostly init/rebuild cases: only its one setup case went; the file stays (10 owns the rest).
- `apps/fgctl/src/help.rs` never named `fgos setup`: no change. `createProjectSkillGuard` could not go (uninstall-project imports it).
- `bridge:S4` stays in the step vocabulary of `test/helpers/doctor-bridge-labels.mjs` and `architecture.test.mjs` messages; no row
  uses it now: 12 drops it.
- Comment-only edits outside the Modify list: `scripts/install-git-hooks.mjs`, `scripts/git-one-door-scan.mjs`,
  `docs/platform/{config/spec.md,packaging-distribution/spec.md,.../contracts/setup-doctor-registry.md}` (dead path and row-list fixes
  that doc-health and the row-list test require).
- Left for their owners (comments naming `fgos setup`): `src/setup/uninstall-project.mjs:3` (09), `bin-discovery.mjs` (07),
  `agent-wiring.mjs:2` (07/08); frozen `limits.v1.json`; data files `registry-defaults.v1.json`, `doctor-base-release.json` golden,
  `check-decision-codes.baseline.json`. After 09 lands, `hasSourceLine` and `createProjectSkillGuard` have no caller: 09 or 12 deletes.
- No `pub` item added in any OPC-reviewed crate (text-only edits in event-store, identity, git, mailbox-store, seat-binding).
- Baseline rows of already-absent files (`checks-setup-config`, `-hookspath`, `-idempotent`) not edited; for the TEST lane.

Status: DONE_WITH_CONCERNS
