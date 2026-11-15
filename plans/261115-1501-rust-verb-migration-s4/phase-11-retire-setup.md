---
phase: 11
title: "Retire `setup`"
status: pending
effort: 1d
wave: B
blockedBy: [0]
q3: "answered (a)"
---

# Phase 11: Retire `setup`

`fgos setup` goes, with what only it did (D7). The contract's condition, the 30-day preview fallback window
(`setup-doctor-registry.md:143`), ended on 2026-10-18 (`docs/platform/packaging-distribution/spec.md:57`); the
owner-approved program puts the retirement in S4. The answer afterwards is "unknown verb", as for `preflight`
(`987d6918b`).

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p11`. Report slug `s4-p11-retire-setup`.

## Context

- Registry `command-registry.mjs:2319-2335` (`deprecated` 2334); arm `bin/fgos.mjs:3500-3515`; renders 3702-3720 and
  `--pretty` 3912; static import `bin/fgos.mjs:114` (`ansi.mjs`, also the doctor's until 03) and its `ARM_STATIC_IMPORTS`
  line (`test/architecture.test.mjs:1697`).
- `setupUseCase` (`src/setup/setup-use-case.mjs:15-92`): rc source line (only writer), retired runner-config
  conversion (`runner-config-conversion.mjs`, only runner), git hooks path (also `scripts/install-git-hooks.mjs`,
  `npm run setup:hooks`; `installGitHooks` wires only where `<main>/.githooks` exists, `git-hooks.mjs:23-33`),
  the Claude Code dispatch-decide hook (also the `dispatch-decide-hook-wired` fix), every registered fix (also
  `doctor --fix`), and the copy of the release's skills into the project (`materializeSkillsIntoProject`, only
  caller). `fgctl init` never runs `setup` (`init.rs:846-887`).
- Help: the "Compatibility" section and its tests `apps/fgos/src/help.rs:558, 980-996`; `test/rust-host/vectors/envelope/version.json`
  lists the verb set; `test/cli/fgos-manifest.test.mjs:172` pins a deprecated `setup` entry.

## Requirements

1. Delete the registry entry, the arm and its renders, `setup-use-case.mjs`, `shell-rc.mjs`'s insertion
   (`detectRcFiles` stays for `scripts/fgos-session-start-hook.mjs`, D18), the `claude-code-hooks.mjs` import of
   `setup` (the file goes in 07 with its row),
   `runner-config-conversion.mjs` (its `retiredJsonAdvice`, read by the bridged `runner-patterns-config` row,
   `registrations.mjs:107`, moves next to that row: F14), `materializeSkillsIntoProject` and `createProjectSkillGuard`
   (`skill-wrappers.mjs:285, 696`), `ansi.mjs` and its `ARM_STATIC_IMPORTS` line once no arm imports it, the row
   `shell-integration-sourced` (`registrations.mjs:999`) and its body and registry entry (`p-bkmh4egqlv`).
2. Regenerate the route files (`setup` leaves the table; exit criterion 1) and the envelope vector. The help's
   "Compatibility" section stays, because `compound` is also deprecated (`command-registry.mjs:696`); the two help
   tests that name `setup` (`apps/fgos/src/help.rs:556-560, 980-996`) assert the same rules on `compound`. `fgos setup`
   and `fgos --help setup` answer like any unknown verb (did-you-mean when one is near).
3. Every text that tells a user to run `fgos setup` (00 F15) names the current door instead: registry descriptions
   (`command-registry.mjs:1098, 1320, 2339`, regenerate the manifest); the hooks-path row message
   (`registrations.mjs:954`) if 04 has not moved it yet; the five Rust refusal texts that name `setup`
   (`refspec.rs`, `legacy_import.rs`, event-store `identity.rs` and `identity/machine.rs`; 00 F15 lists them); `apps/fgctl/src/help.rs`; config standard and schema texts
   (`core/config-standard/mailbox.yaml:93`, `core/config-schema/mailbox.schema.yaml:288`); skills text
   (`core/skills/_shared/capability-catalog.md:136`, then `npm run build:skills`); code comments that describe current
   behaviour (`src/state/worker-slots.mjs:54-69`, `packages/seat-binding/rust/src/tier.rs:2`,
   `packages/mailbox/rust/store/src/limits.rs:108`, `scripts/fgos-shell-integration.sh:21`). The mailbox contract's
   `mailbox.enabled` reader (`packages/mailbox/contracts/limits.v1.json:34`, `"reader": "setup"`) is renamed by 01,
   which moves that reader. Dated knowledge docs stay as history; docs proper wait for 12.
4. Tests: delete `test/setup/setup-use-case.test.mjs`, `test/cli/fgos-setup.test.mjs`,
   `test/setup/checks-setup-envelope.test.mjs`, `checks-setup-rc-line.test.mjs`, the setup cases of
   `dir-resolution.test.mjs`, `claude-code-hooks.test.mjs:104, 122` and `agent-wiring.test.mjs:132`; their behaviours
   are removed (named per test in the report). Baseline rows of deleted files go; baseline rows of files already
   absent (`checks-setup-config`, `checks-setup-hookspath`, `checks-setup-idempotent`, `self-uninstall-spike`) are
   reported to the TEST lane, not edited here.
5. `doors`: the `global fgOS directory` row's debt entry `src/setup/setup-use-case.mjs` leaves (stale check); the
   "locate and read a project config file" row's `src/setup/runner-config-conversion.mjs` entry leaves (or follows the
   advice to its new file, F14).
6. CHANGELOG line (for the step lead): "`fgos setup` is retired and answers \"unknown verb\" like any other unknown
   verb. Onboard a project with `fgctl init`; repair it with `fgos doctor --fix`. It no longer adds a shell-rc
   source line (existing lines keep working and `fgos uninstall` names them), no longer copies the release's skills
   into a project, no longer converts retired runner config keys, and no longer sets `core.hooksPath` (the fgOS source
   checkout uses `npm run setup:hooks`); the doctor row `shell-integration-sourced` is gone." (plan.md V1-V4; reported to the owner 2026-11-15 and not vetoed, so V1-V4 stand)

## Files

- Modify: `src/cli/command-registry.mjs`, generated routes, `bin/fgos.mjs`, `apps/fgos/src/help.rs`,
  `apps/fgctl/src/help.rs`, `src/setup/{registrations,skill-wrappers,shell-rc}.mjs`,
  the texts of requirement 3, `test/architecture.test.mjs`, `test/cli/fgos-manifest.test.mjs`,
  `test/rust-host/vectors/envelope/version.json`, the registry contract (row out), baseline, manifest, census.
- Delete: as requirements 1 and 4.

## Gates

- fmt; clippy `-D warnings` on `fgos`, `fgctl`; `cargo test -p fgos -p fgctl`; msvc and darwin.
- `node scripts/run-tests.mjs test/cli/fgos-manifest.test.mjs test/rust-host/help-routes.test.mjs test/rust-host/command-routes.test.mjs test/setup/skill-wrappers.test.mjs test/setup/dir-resolution.test.mjs test/architecture.test.mjs test/skills/fgos-mirror.test.mjs`
  and `rg -n "fgos setup" core domains plugins src apps packages scripts .githooks` shows only history and the retired-verb test.

## Risk and rollback

- A user or agent still runs `fgos setup` (M x L): "unknown verb" with a did-you-mean; CHANGELOG names the doors.
- Rollback: revert the phase; the verb returns as it was.
