---
contract: plan-v1
title: "Changelog entries become fragments assembled at release, and the land door regenerates the generated skill surfaces"
status: running
lead: head:lead-forgent-261126-2324-change-786c2
priority: P1
blockedBy: []
base: f9a90776d43af441688e7fd852542281ed6fe800
footprint:
  - plans/261126-2324-changelog-fragments-and-skill-surface-regeneration/**
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/tests/land.rs
  - core/config-schema/land.schema.yaml
  - scripts/prepare-release.mjs
  - test/scripts/prepare-release.test.mjs
  - changelog.d/**
  - .fgos/config.yaml
source:
  - plans/discussions/ds-yf3vnbidi6-plan-footprint-overlap/DISCUSSION.md
  - p-os3gedpq4x
created: 2026-11-26
---

# Changelog fragments and skill-surface regeneration at land

## Outcome

The two hot shared files that made plans with overlapping footprints conflict at land stop conflicting (discussion
`ds-yf3vnbidi6` D1, §6 "Changelog" and "At land"):

- `CHANGELOG.md`: a change adds one file under `changelog.d/` instead of editing it. The release step
  (`npm run release:prepare`, `scripts/prepare-release.mjs`) assembles every fragment into the new version section
  after the lines already under `## [Unreleased]`, and deletes the fragments.
- The generated skill surfaces (`.agents/skills/**`, `.claude/skills/**`, `plugins/fgOS/skills/**`): they join
  `land.regenerate`, so a conflict on them is rebuilt in the candidate from `core/skills` and `domains/*/skills`, as
  the mutation census is today. For that, `land.regenerate.files` accepts globs.

This plan is the land-side half of D1. The other half (the contract check and the admission hold become warnings,
and the rules and docs for both halves: `AGENTS.md`, `plan-contract.md`, the supervision spec) is plan
`261126-2318-plan-footprint-overlap-warns`. It was split because those files sit in the footprints of the running
plans `261122-0056-orchestration-skeleton` and `261125-2041-gather-fgos-rules-to-one-owner`, and today's contract
check refuses `ready` on that overlap. This half overlaps no active plan, so it starts now (product priority 2:
a wait on one part must not hold a part that can go ahead).

### Facts (prior art, reused and missing)

- **Land regeneration.** `packages/supervision/rust/src/land.rs:1215-1246` exempts a conflicted path only when
  `regen.files.contains(path)`, and `regenerate` (`:1491-1540`) compares each declared file by exact path. Neither
  takes a glob; the schema says "Repo-relative files" (`core/config-schema/land.schema.yaml`). Reused: the
  regenerate-then-prepare-again loop (PS-4), the footprint exemption rule, `fgos_write_scope::matches`. Missing:
  glob entries.
- **The project's land config** is `.fgos/config.yaml` `land.regenerate` (run: command selectors then the census;
  three files; `when` without `domains/**`). It is read from the trusted main checkout, is skip-worktree in a linked
  worktree, `fgos config set` refuses there (`config-project-file-stripped`), and land restores `.fgos` from the
  target. So the config edit is made in the main checkout and landed with `land --paths` (phase 3).
- **Changelog.** `updateChangelogText` (`scripts/prepare-release.mjs:156-180`) moves the `## [Unreleased]` body
  under the new version heading and refuses an empty body. No fragment prior art (`git log -S'changelog.d'` empty).
  Measured: 91 commits touched `CHANGELOG.md` since 2026-11-17, and 2 of 38 land conflicts were on it (discussion §3
  rows 3 and 9). The pre-commit root guard checks only files with no `/`, so `changelog.d/<name>.md` needs no
  allowlist change.

### Decisions this plan takes (inside D1; the discussion left them to the planner)

- **Fragment name:** `changelog.d/<yymmdd-hhmm>-<slug>.md`, minute stamp from the change's own clock, slug in
  kebab-case. The stamp sorts fragments in the order they were written; the slug keeps two parallel changes apart.
  An identical name on two branches is an add/add conflict at land, which is the honest answer.
- **Fragment body:** one or more Keep a Changelog bullets exactly as they appear in the release section, each
  starting `- Added:`, `- Changed:`, `- Deprecated:`, `- Removed:`, `- Fixed:` or `- Security:` (the flat style
  `CHANGELOG.md` already uses). `changelog.d/README.md` states the scheme and is never assembled.
- **Where assembly runs:** in `prepareRelease`, the step that already writes the version section. The release
  section is the current `## [Unreleased]` body followed by the fragments in file-name order; the deletions are in
  the same update set, so `--dry-run` deletes nothing. An empty Unreleased body is no longer an error when at least
  one fragment exists.
- **Regeneration command:** `npm run build:skills` runs before the command selectors and the census, so the census
  sees the rebuilt tree; which files it rewrites is measured in phase 1 before the config names them.

## Acceptance criteria

1. `cargo test -p fgos-supervision --test land` passes, with a case where two branches both change a file under a
   declared glob, land one after the other, and the second lands regenerated with no `land-conflict-aborted`; a
   conflict outside every declared entry still refuses. `fgos config get land.regenerate --json` on main lists the
   three skill-surface globs, runs `npm run build:skills`, and has `domains/**` in `when`.
2. `node scripts/run-tests.mjs test/scripts/prepare-release.test.mjs` passes, with one test owning the assembly:
   fragments land in the new version section after the existing Unreleased lines, in name order, `README.md` is
   skipped, the fragments are deleted, `--dry-run` writes and deletes nothing, and a malformed fragment refuses by
   name.
3. `changelog.d/README.md` states the scheme, and `changelog.d/` holds this plan's own entry.
4. `npm test` and `cargo test --workspace` are green on the combined tree (phase 3,
   `reports/integration.md`).

## Non-goals

- The contract check and the admission hold (plan `261126-2318-plan-footprint-overlap-warns`), and the rule text in
  `AGENTS.md`, `core/skills/_shared/plan-contract.md` and `docs/platform/supervision/spec.md`, which that plan
  writes for both halves.
- Regenerating declared files during a lead's refresh merge of main into its branch (`p-avjhx3gxas`).
- Rewriting released sections of `CHANGELOG.md`, or refusing a direct edit of `## [Unreleased]`: such lines are
  still released with the next version.
- Declaring `AGENTS.md` as regenerated: it is hand-written outside its generated block.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Glob entries in `land.regenerate.files` | `supervision`, `write-scope` | extends the landing use case's existing key; matching through `fgos_write_scope::matches`, no new key or door |
| `changelog.d/` fragments assembled by the release step | `packaging-distribution` | the release-preparation script already owns the CHANGELOG version move; a repository file convention, no new contract or verb |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Land regenerates declared globs](phase-01-land-regenerates-globs.md) | - | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs, core/config-schema/land.schema.yaml | 1 | done |
| 2 | [Changelog fragments assembled at release](phase-02-changelog-fragments.md) | - | scripts/prepare-release.mjs, test/scripts/prepare-release.test.mjs, changelog.d/** | 1 | done |
| 3 | [Land config and integration](phase-03-land-config-and-integration.md) | 1, 2 | .fgos/config.yaml, plans/261126-2324-changelog-fragments-and-skill-surface-regeneration/reports/** | 2 | ready |

Phases 1 and 2 own disjoint files and run at once. Phase 3 runs from the main checkout and needs an activated
release that carries phase 1. Phase 1 is `code:implement`, phase 2 is `code:implement`, phase 3 is `code:test`;
each is reviewed (`code:review`) before it lands.

Checked: `node scripts/plan-contract-check.mjs --plan` on this directory, and `fgos resource-check --plan` (waves
1: 1, 2; 2: 3; no collisions). No active plan overlaps this footprint.

## Owner questions

None.

## Risks and rollback

- **`npm run build:skills` writes more than the skill globs** (it also renders the managed `AGENTS.md` block,
  `.fgos/instructions/effective/rules.json` and the projection ledger). An undeclared file left changed in the
  candidate would break the clean publish. Proof point in phase 1: run it twice on a clean checkout and list what
  changes; phase 3 declares every pure-output file it rewrites, or narrows the command, and never declares
  `AGENTS.md`.
- **The candidate checkout cannot run `build:skills`** (it stages the native addon first). Phase 3 sees it in the
  first regeneration log; the fallback is to keep the skill globs out of `land.regenerate` and report it, not to add
  a switch.
- **An old release reads glob entries.** A glob is then a literal path that never exists, so nothing is exempted
  and nothing breaks; phase 3 still waits for a release with phase 1 before writing the config.
- **The main checkout's `.fgos/config.yaml` is dirty** with an uncommitted `release:` block (seen 2026-11-26).
  Phase 3 never lands a foreign edit: it asks the owner in the five-part form first.
- **Rollback:** revert phase 3's config land with `fgos config set` to the old value, then revert phases 1 and 2.
  Reverting phase 2 moves any fragment's bullets back under `## [Unreleased]` in the same revert.
