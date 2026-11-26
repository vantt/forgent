---
contract: plan-v1
title: "Plans that share a path both run; the overlap is a warning, changelog entries are fragments, skill surfaces regenerate at land"
status: draft
priority: P1
blockedBy: []
base: 43460a291440cc08dea2d814a5aeeb146b9f7e24
footprint:
  - plans/261126-2318-plan-footprint-overlap-warns/**
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - packages/supervision/rust/src/portfolio.rs
  - packages/supervision/rust/src/supervisor.rs
  - packages/supervision/rust/src/wake.rs
  - packages/supervision/rust/tests/portfolio.rs
  - packages/supervision/rust/tests/wake.rs
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/tests/land.rs
  - core/config-schema/land.schema.yaml
  - scripts/prepare-release.mjs
  - test/scripts/prepare-release.test.mjs
  - changelog.d/**
  - AGENTS.md
  - core/skills/_shared/plan-contract.md
  - core/skills/fgos-supervisor/SKILL.md
  - docs/platform/supervision/spec.md
  - .agents/skills/**
  - .claude/skills/**
  - plugins/fgOS/skills/**
  - .fgos/instructions/effective/rules.json
  - .fgos/config.yaml
source:
  - plans/discussions/ds-yf3vnbidi6-plan-footprint-overlap/DISCUSSION.md
  - p-os3gedpq4x
created: 2026-11-26
---

# Plans that share a path both run; the overlap is a warning

## Outcome

Two plans whose footprints overlap are both admitted and run on their own branches. The overlap is reported as a
warning that names the other plan and the shared paths, at `ready` (the plan contract check) and at admission (the
supervisor's read view); it is never a refusal. Conflicts are met once, at land, where the land door already merges
and gates the combined tree (discussion D1, §6).

Two hot shared files stop conflicting at land:

- `CHANGELOG.md`: a change no longer edits it. Each change adds one file under `changelog.d/`, and the release step
  (`npm run release:prepare`, `scripts/prepare-release.mjs`) assembles every fragment into the new version section
  and deletes them. The lines already under `## [Unreleased]` are released with the next version.
- The generated skill surfaces (`.agents/skills/**`, `.claude/skills/**`, `plugins/fgOS/skills/**`): they join
  `land.regenerate`, so a conflict on them is rebuilt from `core/skills` and `domains/*/skills` in the candidate,
  as the mutation census is today. For that, `land.regenerate.files` accepts globs.

Unchanged: two unfinished phases of one plan that share a path still cannot share a wave; the footprint still bounds
what a unit may write and what a branch may land (`write-outside-footprint`, `land-outside-footprint`, PS-24).

### Facts (prior art, reused and missing)

- **Where the blocks are.** The contract check (`scripts/plan-contract-check.mjs:358-368`) turns a cross-plan
  overlap into an error for `ready` and a warning for `running`; `--all` prints `ERROR active plans A and B have
  overlapping footprints` (`:383`). It came in with `ab8ebdfd54` (2026-11-17) and was split by status in
  `d39e3b6a0a` (2026-11-22); no commit or spec cites an incident (discussion §3 row 1). The admission hold
  `held-footprint-overlap` is `admission_hold` (`packages/supervision/rust/src/portfolio.rs:282-296`), shared by
  `admissible` (the read view, `supervisor.rs:106`) and the wake door (`wake.rs:526-530`), landed `5d01f9a79f`.
  Both are retired together (L10); no switch keeps the old path.
- **Reused for the advice.** The overlap and its shared entries come from the `write-scope` package only:
  `colliding_pairs` returns `Pair { a, b, shared }` (`packages/write-scope/src/lib.rs:215-262`), and the Node check
  already reads the same answer through the native door (`collisions`, `plan-contract-check.mjs:62`, returns
  `shared`). No new overlap rule is written (door `footprint-write-scope-overlap-rule`).
- **Same-plan rule exists.** `plan-contract-check.mjs:157-167` (phases sharing a wave) stays; its test stays.
- **Land regeneration.** `land.rs:1215-1246` exempts a conflicted path only when `regen.files.contains(path)`, and
  `regenerate` (`:1491-1540`) compares each declared file by exact path. Neither takes a glob, and the schema says
  "Repo-relative files" (`core/config-schema/land.schema.yaml`). Missing: glob entries. Path matching reuses
  `fgos_write_scope::matches`.
- **The project's land config** is `.fgos/config.yaml` `land.regenerate` (run: command selectors and the census;
  three files; `when` without `domains/**`). It is read from the trusted main checkout and is skip-worktree in a
  linked worktree, and `fgos config set` refuses there (`config-project-file-stripped`); land restores `.fgos` from
  the target. So the config edit is made in the main checkout and landed with `land --paths` (phase 6).
- **Changelog.** `updateChangelogText` (`scripts/prepare-release.mjs:156-180`) moves the `## [Unreleased]` body
  under the new version heading and refuses an empty body. No fragment prior art (`git log -S'changelog.d'` empty).
  The pre-commit root guard checks only files with no `/`, so `changelog.d/<name>.md` needs no allowlist change.
- **Who still tells agents to edit `CHANGELOG.md`:** `AGENTS.md` (install/setup/doctor gate, last bullet) and
  `core/skills/_shared/plan-contract.md` §2 (footprint example) and §4 (hot files). The discussion's other
  surfaces: §5 of the same file and `docs/platform/supervision/spec.md`.

### Decisions this plan takes (inside D1)

- **Fragment name:** `changelog.d/<yymmdd-hhmm>-<slug>.md`, minute stamp from the change's own clock, slug in
  kebab-case from the change. The stamp sorts fragments in the order they were written; the slug keeps two
  parallel changes apart. An identical name on two branches is an add/add conflict at land, which is the honest
  answer.
- **Fragment body:** one or more Keep a Changelog bullets exactly as they appear in the release section, each
  starting `- Added:`, `- Changed:`, `- Deprecated:`, `- Removed:`, `- Fixed:` or `- Security:` (the style
  `CHANGELOG.md` already uses). `changelog.d/README.md` states the scheme and is never assembled.
- **Where assembly runs:** inside `updateChangelogText`'s caller in `prepareRelease`, the step that already writes
  the version section. The release section is the current `## [Unreleased]` body followed by the fragments in
  file-name order; the fragments are deleted in the same write set (so `--dry-run` deletes nothing). An empty
  Unreleased body is no longer an error when at least one fragment exists.
- **Admission advice shape:** each `supervisor plans --json` row of a `ready` plan carries
  `overlaps: [{ "plan": "<running plan dir>", "paths": ["<shared entry>", ...] }]`, omitted when empty. Only
  `running` plans are compared, as the hold compared them.
- **Contract-check warning text:** `footprint overlaps another active plan <other> on <path>, <path>` (shared
  entries of the checked plan), printed `WARN`, exit 0; `--all` prints one `WARN active plans A and B share <paths>`
  line per pair.

## Acceptance criteria

1. Two `ready` plans whose footprints overlap both pass: `node scripts/plan-contract-check.mjs --plan <each>` exits
   0 and prints a `WARN` naming the other plan and the shared paths; `--all` exits 0 with one `WARN` per pair.
   Owning proof: `test/scripts/plan-contract-check.test.mjs` (the cross-plan test, rewritten).
2. A `ready` plan whose footprint overlaps a `running` plan is admitted by the wake door, and `supervisor plans`
   lists the overlap under `overlaps`. `rg -n "held-footprint-overlap" packages apps src scripts core docs/platform`
   finds nothing. Owning proofs: `cargo test -p fgos-supervision --test portfolio --test wake`.
3. Two unfinished phases of one plan that share a path in one wave are still refused: the existing
   `phases of one wave with overlapping footprints are an error` test passes unchanged.
4. `node scripts/run-tests.mjs test/scripts/prepare-release.test.mjs` passes, with one test owning the fragment
   assembly: fragments land in the new version section after the existing Unreleased lines, in name order,
   `README.md` is skipped, the fragments are deleted, and `--dry-run` writes and deletes nothing.
5. `cargo test -p fgos-supervision --test land` passes, with a case where two branches both change a file under a
   declared glob, land one after the other, and the second lands regenerated with no `land-conflict-aborted`; a
   conflict outside every declared entry still refuses. `.fgos/config.yaml` on main declares the three skill
   surface globs and runs `npm run build:skills` in `land.regenerate`, with `domains/**` in its `when`.
6. `AGENTS.md`, `core/skills/_shared/plan-contract.md` §2, §4 and §5, and `docs/platform/supervision/spec.md`
   state the new rules; the supervision spec's "Lịch sử quyết định" records the change with D1; the
   `fgos-supervisor` skill names the `overlaps` field. `changelog.d/` holds this plan's entry.
7. `npm test` and `cargo test --workspace` are green on the combined tree (phase 6).

## Non-goals

- Regenerating declared files during a lead's refresh merge of main into its branch (`p-avjhx3gxas`).
- Automatic ordering of overlapping plans (`ds-mzyircswox` D2, `p-5iq6tnsjdl`); `blockedBy` stays for an ordering
  a planner or the owner wants.
- The widening door (`p-lfsc4czpgh`); nothing here depends on it.
- Rewriting released sections of `CHANGELOG.md`, or refusing a direct edit of `## [Unreleased]`.
- Plans `261125-2041` and `261125-1631`: not touched.
- Footprint overlap among the children of one work item (`src/intake/plan.mjs`), which is the same-plan rule at
  another layer and stays.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Cross-plan overlap reported as a warning by the plan contract check | `supervision`, `footprint-write-scope-overlap-rule` | changes an existing rule of the plan contract the supervision area reads; overlap answered by the write-scope package, no new rule |
| `overlaps` advice on a `supervisor plans` row; admission no longer holds on overlap | `supervision`, `write-scope` | `colliding_pairs` gives the shared entries; survivor: supervision; retired: the `held-footprint-overlap` branch of `admission_hold` in packages/supervision/rust/src/portfolio.rs |
| Glob entries in `land.regenerate.files` | `supervision`, `write-scope` | extends the landing use case's existing key; matching through `fgos_write_scope::matches`, no new key |
| `changelog.d/` fragments assembled by the release step | `packaging-distribution` | the release-preparation script already owns the CHANGELOG version move; a repo-file convention, no new contract or verb |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Contract check warns on cross-plan overlap](phase-01-contract-check-warns.md) | - | scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs | 1 | draft |
| 2 | [Admission no longer holds on overlap](phase-02-admission-advises-overlap.md) | - | packages/supervision/rust/src/portfolio.rs, packages/supervision/rust/src/supervisor.rs, packages/supervision/rust/src/wake.rs, packages/supervision/rust/tests/portfolio.rs, packages/supervision/rust/tests/wake.rs | 1 | draft |
| 3 | [Land regenerates declared globs](phase-03-land-regenerates-globs.md) | - | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs, core/config-schema/land.schema.yaml | 1 | draft |
| 4 | [Changelog fragments assembled at release](phase-04-changelog-fragments.md) | - | scripts/prepare-release.mjs, test/scripts/prepare-release.test.mjs, changelog.d/README.md | 1 | draft |
| 5 | [Rules and docs](phase-05-rules-and-docs.md) | 1, 2, 3, 4 | AGENTS.md, core/skills/_shared/plan-contract.md, core/skills/fgos-supervisor/SKILL.md, docs/platform/supervision/spec.md, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/**, .fgos/instructions/effective/rules.json, changelog.d/261126-2318-plans-that-share-a-path-both-run.md | 2 | draft |
| 6 | [Land config and integration](phase-06-land-config-and-integration.md) | 1, 2, 3, 4, 5 | .fgos/config.yaml, plans/261126-2318-plan-footprint-overlap-warns/reports/** | 3 | draft |

Phases 1 to 4 own disjoint files and run at once. Phase 5 writes the rules after the behaviour exists, so no rule
lands ahead of its code. Phase 6 runs from the main checkout (the land config cannot be written in a worktree) and
needs an activated release that carries phase 3.

Checked: `node scripts/plan-contract-check.mjs --plan plans/261126-2318-plan-footprint-overlap-warns` and
`fgos resource-check --plan plans/261126-2318-plan-footprint-overlap-warns`; result recorded in the land message.

Each phase is `code:implement`, with its review by `code:review` before land; phase 6 is `code:test`.

## Owner questions

None.

## Risks and rollback

- **The `build:skills` run writes more than the declared globs** (it also renders the managed `AGENTS.md` block,
  `.fgos/instructions/effective/rules.json` and the projection ledger). An undeclared file left changed in the
  candidate would break the clean publish. Proof point in phase 3/6: run the regeneration command twice on a clean
  merge and list what changed; declare every file it rewrites that is pure output, or narrow the command. Never
  declare `AGENTS.md` (hand-written outside its block).
- **Old release reads glob entries.** Until a release with phase 3 is activated, a glob in `files` is a literal
  path that never exists, so nothing is exempted and nothing breaks; phase 6 still waits for that release before
  writing the config.
- **The main checkout's `.fgos/config.yaml` is dirty** with an uncommitted `release:` block (seen 2026-11-26). Phase
  6 never lands a foreign edit: if the file is still dirty it asks the owner in the five-part form before landing.
- **A semantic conflict between two admitted plans merges cleanly.** Covered at land: the land door gates the
  merged candidate, and each plan's integration phase re-runs the full gate on the combined tree (discussion §3
  row 7).
- **Rollback:** revert the phase commits in reverse order (6, 5, then 1 to 4 in any order). Reverting 2 restores
  `held-footprint-overlap`; reverting 4 leaves fragments on disk that a reverted release step would not read, so
  move their bullets back under `## [Unreleased]` in the same revert.
