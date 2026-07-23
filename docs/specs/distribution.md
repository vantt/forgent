---
area: distribution
updated: 2026-07-23
sources: [distribution-packaging, str76-runner-bootstrap, str77-79-doc-gap-fixes, str87-fgos-install-ux, str88-fgos-pnpm-lifecycle]
decisions: [12aedbc8, 469f4c79, 5d669ff6, 38f7e0b8, ea8b9a8d, cbb4736a, 862ac01f, b799cbaa, 563db0a9, e52cc667]
coverage: partial
---

# Spec: Distribution

How a developer gets the `fgos` and `fgos-runner` commands running — either
onto their own machine and into their own project from outside the forgent
source repository, or directly from inside a checkout of the source
repository itself, without a separate install. Used by: a developer who
wants to run `fgos` in a project that is not this repo, and a forgent
contributor working inside this repo's own checkout (or a linked worktree
of it).

## Entry Points & Triggers

- `npm install -g github:vantt/forgent` (run anywhere) → resolves and installs
  the `fgos` command globally from the forgent GitHub repository.
- After install, `fgos init` (run inside the target project) → the existing
  init/doctrine/marker-detection behavior, unchanged and owned by the
  coexistence area — see `docs/coexistence.md`.
- Sourcing the dev checkout's shell helper file from a contributor's own
  shell profile → makes `fgos` and `fgos-runner` available directly from any
  location inside a checkout of the forgent source repository itself
  (including a linked git worktree of it), with no separate install step.

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |
| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |
| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `README.md`, `LICENSE`, plus the end-user documentation subset: the how-to guides directory, the design-rationale (explanation) directory, and the read-by-tag documentation index file | yes | — |
| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |
| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |

## Behaviors & Operations

### Install

- **Blocked when:** the installer's machine cannot reach GitHub over the
  network, or does not have Node.js 18+ available.
- **What changes:** the installer's package manager (npm, pnpm, or yarn)
  resolves the forgent GitHub repository, packages it according to the
  distribution file allowlist, and installs both CLI entry points — `fgos`
  and `fgos-runner` — into the caller's chosen install location (global or
  project-local, per the installer's own install flags), both immediately
  executable. The install always resolves against the source repository's
  default branch — no tagged or pinned release exists yet. The install runs
  no lifecycle script of its own — there is nothing for a package manager's
  build-script policy (e.g. pnpm's `allowBuilds`) to approve or block, so the
  install succeeds the same way regardless of which of the three package
  managers runs it (per D1/D2 str88-fgos-pnpm-lifecycle).
- **Side effects:** none beyond the local install; no registry account is
  created or touched, and nothing is published to the public npm registry.
- **Afterwards:** the installer has a working `fgos` command. The content
  they received is limited to the distribution file allowlist — the source
  repository's own internal data (its live event log, its own dogfood
  runner configuration, its test suite) is never part of what they receive.
  The installer also receives the end-user documentation subset (how-to
  guides, design-rationale docs, and the read-by-tag index) — every link the
  README's Documentation section points to resolves to a file that is
  actually present in what they installed; contributor/maintainer-only docs
  (decision records, area specs, the product backlog, platform foundations)
  are not part of the install and are not linked from that section — a
  reader who wants those clones the source repository instead.

### Dev checkout shell helpers

- **Blocked when:** the current location is not inside any git repository —
  sourcing the helper file still succeeds (it only defines functions), but
  calling `fgos` or `fgos-runner` then fails immediately with a clear error
  and a non-zero exit, before anything is invoked.
- **What changes:** once sourced, `fgos` and `fgos-runner` become available
  as ordinary shell commands. Each resolves the checkout's own root the
  moment it is called — using the current location, not where the file was
  sourced from — then runs that checkout's `fgos`/`fgos-runner` entry point
  with whatever arguments were passed.
- **Side effects:** none — nothing is installed, no file outside the current
  shell session is touched, and no other install mechanism (npm or
  otherwise) is affected.
- **Afterwards:** a contributor working anywhere inside a checkout of this
  repository — the main checkout or a linked git worktree of it — has both
  commands available without a separate install, and without needing to
  remember or type the checkout's own path. Sourcing the file is always the
  contributor's own explicit action; nothing in this repository sources it
  for them.

### Contributor hooks setup

- **Blocked when:** never — this is an explicit command a contributor runs
  themselves; it always runs when invoked.
- **What changes:** running the setup command wires up this repository's
  pre-commit hook for the person who just cloned it. It is never triggered
  automatically by any package manager's install step (per str88-fgos-pnpm-lifecycle
  D1) — a contributor runs it once, by hand, after cloning.
- **Side effects:** none beyond the local git config change; nothing is
  installed and no network access happens.
- **Afterwards:** the contributor's local clone has the pre-commit hook
  wired up, identically to what used to happen automatically. Someone who
  never runs this command simply does not get the local hook — this is a
  one-time manual step for contributors, not a requirement for installing
  or running `fgos` itself.

## Actors & Access

| Capability | Developer installing fgos elsewhere | forgent maintainer / contributor |
|---|---|---|
| Run the install command | ✓ | ✓ |
| Receive the distribution file allowlist content | ✓ | — (stays in the source repo) |
| Receive the source repo's own internal data (event log, dogfood runner config, tests) | never | n/a — never leaves the source repo |
| Source the dev checkout shell helper file | n/a (nothing to source outside a checkout) | ✓ (opt-in, from their own shell profile) |

## Business Rules

- **RUL1.** The distributed package never includes the source repository's own
  runtime data directory or its own dogfood runner configuration — install
  content is always limited to the distribution file allowlist (per D2).
- **RUL2.** Distribution happens by installing directly from the GitHub
  repository, not by publishing to the public npm registry — no package
  rename and no registry publish credentials are involved (per D1).
- **RUL3.** Installing fgos does not change init/doctrine/marker-detection
  behavior in any way — that behavior belongs entirely to the coexistence
  area and is unchanged by installation (per D3).
- **RUL4.** Every link in the README's Documentation section resolves to a
  file that is actually present in the distribution file allowlist — a link
  to content that isn't shipped is a defect, not an acceptable pointer to
  "clone the repo for more" (per D1/D2 str77-79-doc-gap-fixes / ea8b9a8d).
  Contributor/maintainer-only documentation (decision records, area specs,
  the product backlog, platform foundations) is intentionally excluded from
  both the allowlist and that section — it is out of scope for an installed
  end user, not an oversight.
- **RUL5.** The dev checkout shell helper file is never sourced automatically
  by any install step or other mechanism in this repository — a contributor
  adding it to their own shell profile is always their own explicit,
  separate action (per D3/D4).
- **RUL6.** Installing (from any of npm, pnpm, or yarn) never runs a lifecycle
  script of its own — the contributor hooks setup is always a separate,
  manually-invoked command, never an automatic `prepare`/`postinstall` step
  (per str88-fgos-pnpm-lifecycle D1). This is what lets every package
  manager's own build-script approval policy stay out of the way entirely,
  rather than needing to be satisfied.

## Edge Cases Settled

- A package marked as not intended for public registry publication can still
  be installed directly from its GitHub repository — that restriction only
  blocks publishing to a public registry, not this installation path.
- Both CLI entry points (`fgos` and `fgos-runner`) are installed identically,
  executable immediately after install — a fresh install does not require
  the installer to separately locate or make executable the autonomous-loop
  runner command.
- Calling `fgos`/`fgos-runner` (via the dev checkout shell helper) from
  inside a linked git worktree of this repository always runs the MAIN
  checkout's entry point, never that worktree's own local copy — accepted
  as-is for this mechanism (per D1/D2), not treated as a defect.
- A package manager whose own policy blocks lifecycle scripts for
  git-hosted dependencies (e.g. pnpm 10+'s `allowBuilds`) never blocks
  installing this package, because this package's install never declares a
  lifecycle script in the first place (per str88-fgos-pnpm-lifecycle D1) —
  there is nothing for that policy to approve or refuse.

## Open Gaps

- The dev checkout shell helper only covers bash today; zsh support, merging
  new default settings into a contributor's existing settings, and a
  `doctor` self-diagnostic command are open questions still to be decided
  (tracked as STR87's remaining scope, `docs/backlog.md`) — not yet
  reflected here.

## Visuals

Not applicable — no screen; this is a command-line install flow.

## Pointers (implementation)

- `repo/package.json` — `version`, `files`, `bin.fgos`, `bin.fgos-runner`
  fields define the installable surface.
- `repo/README.md` — `## Install` section states the exact command for users.
- `repo/test/install-packaging.test.mjs` — real end-to-end proof: packs the
  package, installs it into a scratch location, and verifies both the
  content allowlist and that running the installed binary from a fresh
  external project creates its own data directory there, not in the source
  repo.
- `docs/coexistence.md` — what happens after install, at `fgos init` time.
- `repo/scripts/fgos-shell-integration.sh` — the dev checkout shell helper;
  defines the `fgos`/`fgos-runner` shell functions, resolving the checkout
  root via `git rev-parse --path-format=absolute --git-common-dir` (never
  `--show-toplevel`, which resolves wrong inside a linked worktree).
- `repo/test/scripts/fgos-shell-integration.test.mjs` — real-git-checkout
  proof: repo-root resolution, linked-worktree resolution, and the
  no-git-repo error path, for both functions.
- `repo/README.md` — "Dev shell helpers" note under `## Install` links the
  helper file with one-line sourcing instructions; the "Contributing" note
  documents the manual `npm run setup:hooks` command.
- `repo/package.json` — `scripts["setup:hooks"]` runs the same command the
  automatic `prepare` script used to run; `scripts.prepare` no longer
  exists.
- `repo/scripts/install-git-hooks.mjs` — the contributor hooks setup logic
  itself, unchanged; only its trigger moved from automatic to manual.
- `repo/test/scripts/install-git-hooks.test.mjs` — includes the regression
  case asserting `package.json` has no `prepare` key and does have
  `setup:hooks`.
