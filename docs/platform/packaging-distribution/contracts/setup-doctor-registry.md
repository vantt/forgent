# Contract: Setup Doctor Registry

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Define the doctor/fix registry contract and legacy setup compatibility used by packaging-distribution
Design status: Draft
Implementation status: Implemented
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md and src/setup/**
Last reviewed: 2026-09-13
Related:
- src/setup/checks.mjs
- src/setup/registrations.mjs
- bin/fgos.mjs
- test/setup/registrations.test.mjs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```

## 1. Purpose

The doctor/fix registry is the extension point for environment readiness. Modules register checks, fixes, and config defaults instead of adding one-off repair logic.

Target architecture has no separate `fgos setup` verb for workspace onboarding. `fgctl init` is the one-command workspace onboarding orchestrator; after activation it invokes active local `fgos init`, `fgos doctor --fix`, and `fgos doctor`. Legacy shell/global integration remains compatibility behavior under the explicit deprecated fallback window: 30 calendar days after preview release publication, unless a later release decision replaces that policy.

Current Node `fgos setup` remains implemented as deprecated legacy compatibility and consumes the same registry while it exists.

## 2. Registry Types

| Registry | Function | Meaning |
| --- | --- | --- |
| Check | `registerCheck` | A named diagnostic reported by `fgos doctor`. |
| Fix | `registerFix` | A named repair run by `fgos doctor --fix`; current legacy `fgos setup` also runs fixes while it remains implemented. |
| Config default | `registerConfigDefault` | A default config shape merged into shared config without overwriting user values. |

The registries are independent. A module may register only a check, only a fix, only a config default, or any combination.

## 3. Doctor Contract

`fgos doctor`:

- runs registered checks;
- reports individual pass/fail status;
- does not write files by default;
- should tell the user what command or fix path applies when a check fails.

Run coverage is checked by `observe-run-coverage`: the host's `metrics coverage`
must report layout rule `v2` and valid observed/skipped accounting. Doctor
independently compares both eligible unique results and candidate-directory/
barrier counts against the Node production admission projection and layout scan.
Both read the main checkout store, including from a worktree. A candidate run
directory changed in the last 60 seconds permits a bounded transient difference,
even before a result exists; future mtimes are recent for clock skew. The host's
`recentRuns` remains result-file based. Diagnostic paths are sample candidates,
not verified host omissions. An unknown coverage subcommand or a response
without `layoutRule` identifies an old host positively and reports
passed-but-degraded with an upgrade instruction; other host errors fail.
This check is read-only, introduces no config default, and never rewrites runs.

`convention-conformance` checks the packaged naming and placement rules only
inside an fgOS source checkout. Violations on paths already present at the
rule cutoff pass with counts and up to three examples; a violation on a path
introduced after that cutoff fails the check, even while the rule posture is
`warn`. A missing or old host pass-skips with the reason because doctor never
reimplements the native rules. The check is read-only and has no registered
fix or config default.


`active-release-matches-checkout` compares a source checkout's Node payload
working-tree bytes with its own activated manifest, using the release builder's
source enumeration. It reports changed, missing and extra source files, excludes
staged production dependencies, and does not certify Rust host freshness.
Outside source checkouts, without activation, with a same-checkout development
manifest, or in a linked worktree whose activation belongs to main, it reports
a reasoned skip. Unsafe paths and unreadable inputs fail this check rather than
throwing out the whole doctor run. It is read-only, with no registered fix:
`npm run fgos:dev -- <verb>` runs working-tree code; build/stage/upgrade updates
plain `fgos`. Diagnosis never changes the activation implicitly.


`fgos doctor --fix`:

- runs every registered fix;
- reports fix results;
- then reports checks.

## 4. Legacy Setup Compatibility

Current legacy `fgos setup` is deprecated but still reachable:

- wires known local support such as shell integration and hooks where applicable;
- ensures shared config defaults are present;
- runs every registered fix unconditionally;
- reports changes;
- preserves idempotency when run repeatedly.

The command registry and setup result payload expose the deprecation and workspace-onboarding path. This is implemented behavior, not the target architecture. New distribution design should route workspace onboarding through `fgctl init` plus local `fgos init`/`doctor --fix`/`doctor`, while preserving `fgos setup` as the legacy shell/global integration path through the 30-day preview fallback window unless a later release decision replaces that behavior. Removing the command entirely remains gated by that release-policy window, not by implementation-side inference.

## 5. Config Merge Contract

Config merge is fill-missing-only:

- customized values are not overwritten;
- nested object defaults fill missing keys;
- arrays are added wholesale only when missing;
- project config wins over global config for matching keys;
- missing global config is not an error.

## 6. Ownership Boundary

Doctor/fix paths may repair environment readiness. They must not silently select a different runtime identity when a workspace activation is present. Runtime selection belongs to `fgctl` and workspace activation records.

## 7. Implementation Evidence

| Claim | Evidence |
| --- | --- |
| Checks/fixes/defaults are registered through open registries | `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `test/setup/registrations.test.mjs` |
| Doctor default path is read-only | `bin/fgos.mjs`, `test/setup/*.test.mjs` |
| Doctor fix runs registered fixes | `src/setup/registrations.mjs`, `bin/fgos.mjs`, `test/setup/*.test.mjs` |
| Legacy setup runs registered fixes and declares its deprecation path | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md`, `test/cli/fgos-manifest.test.mjs`, `test/setup/checks-setup-rc-line.test.mjs` |
| Project config overrides global config | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` |

## 8. Open Follow-Up

The exact list of registered checks/fixes changes over time. This contract should avoid carrying a stale giant list; generated registry reports or verification docs should carry snapshots when needed.

## Retained Distribution Source Detail

Added in candidate — complete source units from `docs/specs/distribution.md` at blob `13d2e172de35a570d148022d4c859cac05223acb`, after the boundary main sync. Dated decisions, implementation rules and recorded gaps are retained; current assertions remain subject to the independent truth sample.

##### Contributor hooks setup

- **Blocked when:** never — this is an explicit command a contributor runs
  themselves; it always runs when invoked.
- **What changes:** running the setup command wires up this repository's
  pre-commit hook for the person who just cloned it. It is never triggered
  automatically by any package manager's install step (per str88-fgos-pnpm-lifecycle)
  — a contributor runs it once, by hand, after cloning.
- **Side effects:** none beyond the local git config change; nothing is
  installed and no network access happens.
- **Afterwards:** the contributor's local clone has the pre-commit hook
  wired up, identically to what used to happen automatically. Someone who
  never runs this command simply does not get the local hook — this is a
  one-time manual step for contributors, not a requirement for installing
  or running `fgos` itself.
- In fgOS source checkouts, the hook refuses newly staged root files outside
  its own allowlist, including linked worktrees and `fgw/*` branches. Existing
  root modifications/deletions remain permitted. Allowlist changes must land
  separately on main before root additions use them; the index cannot authorize
  itself. Merge commits skip only this root guard, never existing data-loss
  guards. `main-checkout-hook-wired` diagnoses wiring using the existing check.
- In fgOS source checkouts, the hook sends newly staged, copied, or renamed
  Markdown files directly under `plans/reports/` and `plans/journals/` to the
  native Convention checker. Violations and unavailable, old, or failed hosts
  emit warnings only; the hook never blocks the commit for Convention results.
  Nested evidence and per-plan `reports/` directories are outside this scope.

##### Setup

- **Blocked when:** never — running `fgos setup` always attempts its work;
  a shell profile that does not exist is simply skipped rather than
  refused.
- **What changes:** for every shell profile the caller actually has (bash's
  and/or zsh's, whichever exist), the shell helper's source line is added
  if not already present — never duplicated on a repeat run. The local
  project config file is also brought up to date: any setting present in
  the current default schema but missing from the caller's file is added,
  without ever changing a setting the caller already customized; a config
  file that already has every current default is left untouched. The same
  fill-missing-only treatment is applied to the **global** config file
  (`~/.fgos/config.json`, tsk-1ri) — `fgos setup` initializes it with the
  same default schema the project-local file gets, or fills in any missing
  key, every time it runs, regardless of which project it's run from;
  a value the caller already customized at the global level is never
  overwritten.
- **Side effects:** the caller's own shell profile file(s), local project
  config file, and global config file (`~/.fgos/config.json`) may be
  modified; nothing outside the caller's own environment is touched, and
  no network access happens.
- **Afterwards:** the caller sees exactly what changed — which profile
  file(s) gained the source line (or already had it), which project config
  settings were newly added (or that none were needed), and which global
  config settings were newly added (or that none were needed, or that the
  global file was just created). Nothing is done silently; running `fgos
  setup` again when everything is already current reports that plainly,
  without repeating any change.

##### Doctor

- **Blocked when:** never — `fgos doctor` always runs every check and
  reports the result; it never fails the invocation itself, only reports
  individual checks as passing or not. Exit stays 0 because `fgctl
  init|upgrade|repair` run it as their tail and mark the install degraded on
  a non-zero exit; `--strict` is the opt-in that exits 1 when any check fails.
- **What changes:** nothing — this is a read-only diagnostic. It never
  writes a config file, never modifies a shell profile, and never installs
  anything, even when a check reports a problem (`config-not-stale`
  failing on a missing config file reports that plainly rather than
  creating one).
- **Side effects:** none.
- **Afterwards:** the caller sees each named check (Data Dictionary #7) and
  whether it passed, including enough detail to know what to do next (e.g.
  which config settings are missing, or that `fgos setup` has not been run
  yet).
