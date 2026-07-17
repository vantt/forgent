---
area: distribution
updated: 2026-07-17
sources: [distribution-packaging]
decisions: [12aedbc8, 469f4c79, 5d669ff6]
coverage: full
---

# Spec: Distribution

How a developer gets the `fgos` command line tool onto their own machine and
into their own project, from outside the forgent source repository. Used by:
a developer who wants to run `fgos` in a project that is not this repo.

## Entry Points & Triggers

- `npm install -g github:vantt/forgent` (run anywhere) → resolves and installs
  the `fgos` command globally from the forgent GitHub repository.
- After install, `fgos init` (run inside the target project) → the existing
  init/doctrine/marker-detection behavior, unchanged and owned by the
  coexistence area — see `docs/coexistence.md`.

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |
| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |
| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `README.md`, `LICENSE` | yes | — |
| 4 | CLI entry point | The command exposed once installed | `fgos` → runs `bin/fgos.mjs` | yes | — |

## Behaviors & Operations

### Install

- **Blocked when:** the installer's machine cannot reach GitHub over the
  network, or does not have Node.js 18+ available.
- **What changes:** npm resolves the forgent GitHub repository, packages it
  according to the distribution file allowlist, and installs the `fgos`
  command into the caller's chosen npm location (global or project-local,
  per the installer's own `npm install` flags). The install always resolves
  against the source repository's default branch — no tagged or pinned
  release exists yet.
- **Side effects:** none beyond the local npm install; no registry account is
  created or touched, and nothing is published to the public npm registry.
- **Afterwards:** the installer has a working `fgos` command. The content
  they received is limited to the distribution file allowlist — the source
  repository's own internal data (its live event log, its own dogfood
  runner configuration, its test suite) is never part of what they receive.

## Actors & Access

| Capability | Developer installing fgos elsewhere | forgent maintainer |
|---|---|---|
| Run the install command | ✓ | ✓ |
| Receive the distribution file allowlist content | ✓ | — (stays in the source repo) |
| Receive the source repo's own internal data (event log, dogfood runner config, tests) | never | n/a — never leaves the source repo |

## Business Rules

- **R1.** The distributed package never includes the source repository's own
  runtime data directory or its own dogfood runner configuration — install
  content is always limited to the distribution file allowlist (per D2).
- **R2.** Distribution happens by installing directly from the GitHub
  repository, not by publishing to the public npm registry — no package
  rename and no registry publish credentials are involved (per D1).
- **R3.** Installing fgos does not change init/doctrine/marker-detection
  behavior in any way — that behavior belongs entirely to the coexistence
  area and is unchanged by installation (per D3).

## Edge Cases Settled

- A package marked as not intended for public registry publication can still
  be installed directly from its GitHub repository — that restriction only
  blocks publishing to a public registry, not this installation path.

## Open Gaps

(none — coverage is full for the current installation mechanism)

## Visuals

Not applicable — no screen; this is a command-line install flow.

## Pointers (implementation)

- `repo/package.json` — `version`, `files`, `bin.fgos` fields define the
  installable surface.
- `repo/README.md` — `## Install` section states the exact command for users.
- `repo/test/install-packaging.test.mjs` — real end-to-end proof: packs the
  package, installs it into a scratch location, and verifies both the
  content allowlist and that running the installed binary from a fresh
  external project creates its own data directory there, not in the source
  repo.
- `docs/coexistence.md` — what happens after install, at `fgos init` time.
