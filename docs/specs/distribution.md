---
area: distribution
updated: 2026-07-23
sources: [distribution-packaging, str76-runner-bootstrap, str77-79-doc-gap-fixes, str87-fgos-install-ux, str88-fgos-pnpm-lifecycle, str87-fgos-setup-doctor]
decisions: [12aedbc8, 469f4c79, 5d669ff6, 38f7e0b8, ea8b9a8d, cbb4736a, 862ac01f, b799cbaa, 563db0a9, e52cc667, e8852403, 4cb11e46, 589eb4b0, 175cfc08, 1005dae0, 4206a0a6, 7d982955, ef531b22]
coverage: full
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
- `fgos setup` (run anywhere) → wires the shell helper's source line into
  every shell profile the caller actually has, and brings the local config
  file up to date with the current defaults.
- `fgos doctor` (run anywhere) → reports whether the environment is set up
  correctly (Node/git present, shell helper sourced, config up to date).

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |
| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |
| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `README.md`, `LICENSE`, plus the end-user documentation subset: the how-to guides directory, the design-rationale (explanation) directory, and the read-by-tag documentation index file | yes | — |
| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |
| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: ~35 CLI-wrapper skills (`cook`, `discover`, `plan`, `pick`, `submit`, ...) that always shipped here, plus (tsk-32b) the 14 coding-domain dev-skills (`fgos-coding-driving`, `fgos-routing`, `fgos-clarifying`, ...) those wrappers dispatch into via the `Skill` tool — before tsk-32b, the dev-skills existed only in this repo's own `.claude/skills/`, so a session in a repo that installed fgOS only as a plugin (no forgent checkout anywhere) got "Unknown skill" the first time a wrapper skill tried to dispatch into one, even though the `fgos` CLI itself was fully reachable (`plugin-skill-cli-reachable` only checks the CLI, never the dev-skill files). The 14 dev-skill copies must stay byte-identical to `.claude/skills/fgos-*` (`test/skills/fgos-mirror.test.mjs`, extended to a third leg alongside the pre-existing `.claude/skills`<->`.agents/skills` mirror) — a maintainer edits `.claude/skills/fgos-*` and copies forward, never edits the plugin copy independently; `plugin-dev-skills-packaged` (doctor check, row 7 below) catches a forgotten copy before release | 14 dev-skills + ~35 CLI-wrapper skills | yes (the wrapper skills; the dev-skill copies exist specifically so a plugin-only consumer's `/fgOS:cook`/`/fgOS:discover`/`/fgOS:plan`/`/fgOS:pick` work end to end) | — |
| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |
| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |
| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |
| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-stage-vocabulary` (tsk-64h), `domain-workflow-skillmap-coverage` (tsk-ogx), `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `events-jsonl-contiguous` (tsk-3wq), `config-awareness`, `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12), `dispatch-decide-hook-wired` (tsk-60f), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `agy-permissions-configured` (tsk-1xm), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |
| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `events-jsonl-contiguous` (tsk-3wq), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a). Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |
| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |

## Behaviors & Operations

### Install

- **Blocked when:** the installer's machine cannot reach GitHub over the
  network, or does not have Node.js 18+ available.
- **What changes:** the installer's package manager (npm, pnpm, or yarn)
  resolves the forgent GitHub repository, packages it according to the
  distribution file allowlist, and installs both CLI entry points — `fgos`
  and `fgos-runner` — into the caller's chosen install location (global or
  project-local, per the installer's own install flags), both immediately
  executable. The install resolves against whatever ref the installer's own
  command names: a tagged release commit when the command names a tag
  (`README.md`'s recommended path, `docs/how-to/cut-a-fgos-release-tag.md`),
  or the source repository's default branch when it doesn't (the
  bleeding-edge path README also documents) — tag-cutting itself stays a
  manual, repo-owner-judgment act (per tsk-jtb), never CI-automated. The
  install runs
  no lifecycle script of its own — there is nothing for a package manager's
  build-script policy (e.g. pnpm's `allowBuilds`) to approve or block, so the
  install succeeds the same way regardless of which of the three package
  managers runs it (per str88-fgos-pnpm-lifecycle).
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
  automatically by any package manager's install step (per str88-fgos-pnpm-lifecycle)
  — a contributor runs it once, by hand, after cloning.
- **Side effects:** none beyond the local git config change; nothing is
  installed and no network access happens.
- **Afterwards:** the contributor's local clone has the pre-commit hook
  wired up, identically to what used to happen automatically. Someone who
  never runs this command simply does not get the local hook — this is a
  one-time manual step for contributors, not a requirement for installing
  or running `fgos` itself.

### Setup

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

### Doctor

- **Blocked when:** never — `fgos doctor` always runs every check and
  reports the result; it never fails the invocation itself, only reports
  individual checks as passing or not.
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

## Actors & Access

| Capability | Developer installing fgos elsewhere | forgent maintainer / contributor |
|---|---|---|
| Run the install command | ✓ | ✓ |
| Receive the distribution file allowlist content | ✓ | — (stays in the source repo) |
| Receive the source repo's own internal data (event log, dogfood runner config, tests) | never | n/a — never leaves the source repo |
| Source the dev checkout shell helper file | n/a (nothing to source outside a checkout) | ✓ (opt-in, from their own shell profile) |
| Run `fgos setup` (writes shell profile + config) | ✓ | ✓ |
| Run `fgos doctor` (read-only diagnostic) | ✓ | ✓ |

## Business Rules

- **RUL1 (distributed package never includes the source repo's own runtime data).** The distributed package never includes the source repository's own
  runtime data directory or its own dogfood runner configuration — install
  content is always limited to the distribution file allowlist.
- **RUL2 (distribution is a GitHub install, not an npm registry publish).** Distribution happens by installing directly from the GitHub
  repository, not by publishing to the public npm registry — no package
  rename and no registry publish credentials are involved.
- **RUL3 (install never changes init/doctrine/marker-detection behavior).** Installing fgos does not change init/doctrine/marker-detection
  behavior in any way — that behavior belongs entirely to the coexistence
  area and is unchanged by installation.
- **RUL4 (every README Documentation link resolves to a shipped file).** Every link in the README's Documentation section resolves to a
  file that is actually present in the distribution file allowlist — a link
  to content that isn't shipped is a defect, not an acceptable pointer to
  "clone the repo for more" (per str77-79-doc-gap-fixes / ea8b9a8d).
  Contributor/maintainer-only documentation (decision records, area specs,
  the product backlog, platform foundations) is intentionally excluded from
  both the allowlist and that section — it is out of scope for an installed
  end user, not an oversight.
- **RUL5 (dev checkout shell helper is never sourced automatically).** The dev checkout shell helper file is never sourced automatically
  by any install step or other mechanism in this repository — a contributor
  adding it to their own shell profile is always their own explicit,
  separate action.
- **RUL6 (install never runs a lifecycle script).** Installing (from any of npm, pnpm, or yarn) never runs a lifecycle
  script of its own — the contributor hooks setup is always a separate,
  manually-invoked command, never an automatic `prepare`/`postinstall` step
  (per str88-fgos-pnpm-lifecycle). This is what lets every package
  manager's own build-script approval policy stay out of the way entirely,
  rather than needing to be satisfied.
- **RUL7 (setup/doctor cover both bash and zsh).** `fgos setup` and `fgos doctor` both cover bash and zsh — neither
  shell is treated as a lesser case.
- **RUL8 (setup's config update never overwrites a customized setting).** `fgos setup`'s config update never overwrites a setting the
  caller already customized, at any nesting depth; array-valued settings
  are never partially merged, only added wholesale when entirely missing.
- **RUL9 (doctor's default path never writes anything).** `fgos doctor`'s default (no `--fix`) path never writes
  anything, under any circumstance, including when a check would
  otherwise need to create a file to check it — a missing config file is
  reported as missing, never created as a side effect of checking.
  `--fix` is the deliberate exception: it runs every registered fix
  (Data Dictionary #7b) before re-reporting checks — reversed from the
  original no-exceptions wording per `tsk-2qz`, which reverses this
  rule and RUL11 (doctor --fix exists and is real, runs every registered fix) together (`docs/history/doctor-fix-gate-bypass/
  CONTEXT.md`).
- **RUL10 (setup never asks for confirmation, acts then reports).** `fgos setup` never asks for confirmation before writing to a
  shell profile or the config file — it acts and then reports exactly what
  it changed. Every other verb, and both of these two without
  `--pretty`, still produce the same enveloped-JSON result shape as before
  this feature — `--pretty` only changes how that same result is displayed,
  never what it contains.
- **RUL11 (doctor --fix exists and is real, runs every registered fix).** `fgos doctor --fix` exists and is real: it runs every fix
  registered via `registerFix` (Data Dictionary #7b) against the current
  cwd before re-reporting checks, then returns the same checks shape as
  the no-flag path plus a `fixed` array. The fix list is a registry, not
  a fixed set — a module can register a new one the same way a check or
  config-default is registered, independent of either (per tsk-2cs). This
  supersedes the original v1 "does not exist yet, Deferred Idea" wording
  — `tsk-2qz` reverses that decision deliberately, per
  `docs/distribution-vision.md` §3's trụ cột 3.
- **RUL12 (setup also runs every registered fix, unconditionally).** `fgos setup` also runs every registered fix (the same
  `runFixes()` `doctor --fix` calls per RUL11 (doctor --fix exists and is real, runs every registered fix)), unconditionally and with no
  confirmation — consistent with RUL10 (setup never asks for confirmation, acts then reports)'s own act-then-report contract for
  this verb, not an exception to it. `setup`'s result gains a `fixed` array,
  the same per-entry `{id, changed, message}` shape RUL11 (doctor --fix exists and is real, runs every registered fix) already describes
  for `doctor --fix`'s own (per `tsk-5hi`,
  `docs/history/setup-runs-registered-fixes/CONTEXT.md`).

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
  as-is for this mechanism, not treated as a defect.
- A package manager whose own policy blocks lifecycle scripts for
  git-hosted dependencies (e.g. pnpm 10+'s `allowBuilds`) never blocks
  installing this package, because this package's install never declares a
  lifecycle script in the first place (per str88-fgos-pnpm-lifecycle) —
  there is nothing for that policy to approve or refuse.
- `fgos setup` run a second time with nothing new to do reports that
  plainly rather than silently repeating (or silently no-oping without
  saying so).
- `fgos doctor`'s `config-not-stale` check on a machine where `fgos setup`
  was never run reports "not configured yet", not an error and not a
  silently-created file.

## Open Gaps

(none — coverage is full for the mechanisms this feature adds. `fgos doctor
--fix` now exists for real, per RUL11 (doctor --fix exists and is real, runs every registered fix) above — its own further extension
(which checks eventually get a registered fix) is ordinary registry growth,
tracked per-module, not a gap in this spec.)

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
- `repo/src/setup/ansi.mjs` — hand-rolled ANSI color helpers behind
  `--pretty`, zero dependency.
- `repo/src/setup/config-merge.mjs` — `mergeConfigDefaults`, the
  general-purpose deep-merge-fill-missing-only utility (arrays treated as
  leaves); `repo/src/runner/dispatch.mjs`'s `ensureRunnerConfig` calls it
  when a config file already exists.
- `repo/src/setup/shell-rc.mjs` — bash/zsh rc-file detection and idempotent
  source-line insertion.
- `repo/src/setup/checks.mjs` — `fgos doctor`'s check registry (Data
  Dictionary #7).
- `repo/bin/fgos.mjs` — `setup`/`doctor` verb dispatch, `--pretty` rendering
  gated to only these two verbs (CTR001 unchanged for every other verb).
- `repo/src/cli/command-registry.mjs` — `setup`/`doctor` verb manifest
  entries.
- `repo/docs/architecture-manifest.json` — layer registration for the four
  `src/setup/*.mjs` files.
- `repo/test/setup/*.test.mjs` — unit and real-CLI proof for all of the
  above.
