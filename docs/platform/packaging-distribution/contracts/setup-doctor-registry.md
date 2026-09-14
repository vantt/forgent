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
```

## 1. Purpose

The doctor/fix registry is the extension point for environment readiness. Modules register checks, fixes, and config defaults instead of adding one-off repair logic.

Target architecture has no separate `fgos setup` verb. `fgctl init` is the one-command onboarding orchestrator; after activation it invokes active local `fgos init`, `fgos doctor --fix`, and `fgos doctor`.

Current Node `fgos setup` remains implemented as legacy compatibility and consumes the same registry while it exists.

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

`fgos doctor --fix`:

- runs every registered fix;
- reports fix results;
- then reports checks.

## 4. Legacy Setup Compatibility

Current legacy `fgos setup`:

- wires known local support such as shell integration and hooks where applicable;
- ensures shared config defaults are present;
- runs every registered fix unconditionally;
- reports changes;
- preserves idempotency when run repeatedly.

This is implemented behavior, not the target architecture. New distribution design should route onboarding through `fgctl init` plus local `fgos init`/`doctor --fix`/`doctor`, not add new semantic obligations to `fgos setup`.

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
| Legacy setup runs registered fixes | `bin/fgos.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md` |
| Project config overrides global config | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` |

## 8. Open Follow-Up

The exact list of registered checks/fixes changes over time. This contract should avoid carrying a stale giant list; generated registry reports or verification docs should carry snapshots when needed.
