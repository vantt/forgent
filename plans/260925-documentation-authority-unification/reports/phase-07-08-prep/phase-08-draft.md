---
phase: 8
title: "Eliminate switchboard bypasses and prepare consumers"
status: pending
priority: P1
effort: ""
dependencies: [7]
---

# Phase 8: Eliminate switchboard bypasses and prepare consumers

> Legacy numbering: this was **Phase 07** in the original plan. Git tags, branch names, assignment ids and the historical artifacts under `reports/` keep the legacy number.

> DRAFT (2026-10-07), written while Phase 6 is still running and before any Phase 7 result. Group counts below come from the survey `consumer-survey.md` (inventory commit `57f3e7fe7`, before Phase 6 changes the platform corpus) and are re-measured in Step 2; the corpus-dependent numbers (group G1b, link queues, retiring roots) are placeholders. Items marked UNPROVEN must be checked before this file is promoted to `phase-08-*.md`.

## Overview

**Status:** `not-started`, `not-authorized`. Blocked by Phase 7 (closed by the owner). Harness per `plan.md` 7.2: code slice plus document review. Cutover itself (Phase 9) also needs a separate cutover approval and the cross-plan order of `plan.md` 7.5.
**Mode:** two worktrees, one executor session at a time in each: OpenAI Codex run by the owner, repo access, no chat history, every step inline and in order, no subagents, no dispatch, no skills.
- **Plan worktree** (`/home/vantt/projects/forgentX-phase00-documentation-authority-unification`, branch `plan/260925-documentation-authority-unification`): consumer census, rewrite manifest, tools, queues, evidence and alias preparation, rehearsals. Changes **no document that a reader reads today**.
- **Lease worktree** (recommended `/home/vantt/projects/forgentX-doc-cutover-lease`, branch `feat/doc-cutover-lease`, created from main by the owner, or by the executor with `git worktree add -b feat/doc-cutover-lease <path> main` run from `W` after the owner confirms the path): the documentation-cutover write lease. It is separate because `core.hooksPath` is the absolute path `/home/vantt/projects/forgentX/.githooks`: every worktree runs the main checkout's checked-out hook, so a commit guard that exists only on the plan branch protects nobody. The lease code has to be on main before it is acquired (plan 5 item 9 allows early-harvest controls as separately reviewed changes). Merging it to main is the owner's act.
**Review model:** as in Phase 6. The executor stops at "ready for review" and resumes when a verdict is committed. Five review points: R1 tools, R2 census plus manifest plus queues, R3 evidence and alias preparation, R4 lease (code review and acceptance run), R5 rehearsal and hostile pass. Reviewer sessions and owner-started reader sessions are not the author.
**Purpose:** Make the cutover change behavior, not only files, and make it mechanical. After this phase: every consumer of a retiring documentation path is classified, every reference that must change has a reviewed, digest-bound replacement prepared, the cutover can apply them in one commit under a real write lease, and a full rehearsal on a throwaway clone has shown that nothing else breaks.

**Definitions used in this phase.** A *bypass* is a consumer that decides which document owns a claim, or which directory to read, by a hard-coded legacy path instead of going through the routing the plan provides (switchboard row or alias resolver). Prose links are bypasses too, but harmless until the path disappears; *behavioral readers* (tests, scripts, tools that open or walk a legacy path) fail at the cutover and are the dangerous kind. The plan's earlier sentence "generic consumers should already use the switchboard" turned out to be mostly untrue: only the gate scripts read the switchboard; agents, skills, tests and docs name paths directly (survey section 4, section 6). So this phase does not wire consumers to the switchboard; it prepares each one for a mechanical change and removes the ones that cannot be changed mechanically.

### Read first (in this order)

1. [plan.md](plan.md) sections 1, 3, 5, 6, 7.3 to 7.7, 9 and 10 (10 is the cutover acceptance).
2. This file, completely, before any command.
3. [cutover-write-lease-design.md](cutover-write-lease-design.md) (all, including section 6 decisions of 2026-10-06 and section 7), [evidence-payload-relocation-policy.md](evidence-payload-relocation-policy.md) (all), [alias-table-and-resolver-contract.md](alias-table-and-resolver-contract.md), [shipped-path-conventions-inventory.md](shipped-path-conventions-inventory.md) sections 1 to 2, [minimum-constitution.md](minimum-constitution.md) `retirementGate`.
4. [phase-09-atomic-platform-authority-cutover.md](phase-09-atomic-platform-authority-cutover.md) (what this phase must make possible) and `docs/transitional-switchboard.md`.
5. The Phase 6 and 7 closes (see the table below), `reports/phase-05/pilot-b-link-judgment-queue.json` and `pilot-b-link-rewrite-preview.md` (the format of a link queue), `reports/phase-06/review-brief.md`.
6. `AGENTS.md` (install/setup/doctor gate, dispatch rules) and `CLAUDE.md` (impact-analysis capability gate).

### Terms

| Term | Meaning |
|---|---|
| `W`, `P`, `S` | `W` = the plan worktree path; `P` = `plans/260925-documentation-authority-unification`; `S` = `/tmp/phase08` (scratch outside the tree). `L` = the lease worktree path. |
| `B0`, `SYNC` | Step 0 baseline commit of `W`; the merge commit of the latest `git merge main` in `W`; both in `reports/phase-08/progress.md`. `LB0` = baseline of the lease branch. |
| Census | The list of every consumer edge to a retiring path, grouped (survey section 4, groups A to H), produced by `scripts/consumer-rewrites.mjs --census` from the scratch inventory. |
| Reference edge | A consumer edge of kind other than `glob`. Glob edges are pattern matches with no text to rewrite; they are counted and reported but need no entry unless a consumer line is itself a pattern that must change. |
| Retiring path set | Every file under `docs/specs/`, `docs/architect/`, `docs/ui-spec/`, plus `docs/io-contract.md` and the root documents the Phase 6 area maps retire (`ledger/area-map-*.md`). The provisional list of the survey is not authoritative. |
| Manifest | `P/consumer-rewrites/manifest.json`, shape in `P/consumer-rewrites/consumer-rewrites.schema.json`: one entry per reference edge in scope (below). Applied by the cutover under the lease with `scripts/consumer-rewrites.mjs --apply`; never applied earlier except by the early-harvest rule of Q8-2. |
| Entry class | `rewrite` (replace text at a line), `regenerate` (render or generated file, produced by its generator), `retire-with-source` (consumer is itself retired or deleted at cutover), `exempt-history` (immutable; alias only), `exempt-provenance` (a document that names a legacy path on purpose as evidence, labelled), `exempt-synthetic` (test data for a gate tool), `exempt-tool-data` (data of a gate that retires), `judgment` (owner or reviewer decision pending; must be 0 at the end). Every `exempt-*` entry carries a written reason. |
| Behavioral reader | A consumer that opens, walks or asserts the content of a retiring path. Listed in survey section 6; each gets a prepared patch (entry kind `patch`, file under `P/consumer-rewrites/patches/`). |
| Rehearsal | Apply manifest, switch routes, delete retired files, regenerate renders and run the full suite plus the gates in a throwaway clone under `S` (made with `git clone --local`, never `git worktree add` from `W`). |
| Early harvest | A change that is safe before the cutover and may merge to main as a separately reviewed change (plan 5 item 9). Phase 8 proposes two: the lease (always) and behavioral-reader fixes (only if Q8-2 says yes). |
| `authoredBy`, `reviewedBy` | As in Phase 6. |

### Inputs that do not exist yet (verify each in Step 0; a missing one is `NEEDS_CONTEXT`)

| Input | Producer | Expected path | Used by |
|---|---|---|---|
| Phase 7 closed, handover | owner, Phase 7 | `plan.md` 7.1 row 7 `completed`; `reports/phase-07/handover-to-phase-08.md` | start condition; retiring-root list as used |
| Frozen area maps and retiring-root list | Phase 6 Step 1 | `ledger/area-map-*.md` | the retiring path set |
| Link queues for all sources | Phase 6 Step 10 item 2b | per-source queue files in `reports/phase-06/` (names not fixed in the Phase 6 file: UNPROVEN) | Step 4 |
| Merged alias draft | Phase 6 Step 10 item 7 | `ledger/alias-drafts/` (merged file name UNPROVEN) | Step 7 |
| Dry-run ledger snapshot and destination README | Phase 6 Step 10 item 8 | `docs/platform/history/documentation-authority-unification/` | Step 6 (manifest home), Phase 9 |
| Last promotion rehearsal | Phase 6 Step 10 item 5 | `reports/phase-06/rehearsal-step-10.md` | Step 10 baseline |
| Link-rewrite preview tool | nobody committed one (`git ls-files scripts` has none; the Phase 5 preview was an uncommitted script) | none | Step 1 builds `scripts/consumer-rewrites.mjs` unless Phase 6 delivered an equivalent (check `scripts/propose-doc-decisions.mjs --help`) |
| Strict-input decision | owner (Phase 6 owner queue `strict-registry-input`) | `reports/phase-06/owner-queue.md` | the form of gate commands D and E |
| State of Plans A, B, C | main checkout, read only | `plans/261006-1415-*`, `plans/261006-1445-*` | Step 0 and Step 8; Plan A is on main (`a004bb598`), B pending, C draft at the time of drafting |

### Preconditions (Step 0 stops if any is missing)

- `reports/phase-08/owner-answers.md` committed with every field answered and authorization `yes` (template below). The executor never guesses an answer.
- Clean tree in `W`; every input of the table exists.

**Template of `reports/phase-08/owner-answers.md`** (`*` marks the recommendation; full options in `open-questions.md`):

```text
# Phase 8 owner answers
Date: <YYYY-MM-DD>        Recorded by: <owner>
Phase 8 authorized: yes | no
Q8-1 how consumers change: manifest applied in the cutover commit, prose and comments never earlier* | edit on the branch now
Q8-2 early harvest of behavioral-reader fixes to main before the cutover: lease only* | lease and reader fixes
Q8-3 where the lease spec entry lives: row in docs/specs/distribution.md with a ratchet exception and a decision row* | other (name it)
Q8-4 gates that survive the cutover: ratchet, retirement check, inventory generator, alias resolver kept until Phase 10 decides; verify-phase-0x deleted* | other
Q8-5 shipped skill and help text: repoint to the new path like any other consumer* | remove the repository-local doc link from shipped text
Q8-6 live work items that name a retiring path: amend through the supported write door by their owner session before the lease; zero at acquire* | accept and list
Q8-7 if Plan B is not scheduled when Phase 8 closes: Phase 9 waits (plan 7.5 as written)* | proceed without Plan B like Plan C
Q8-8 lease branch and worktree: feat/doc-cutover-lease at the recommended path, owner merges to main* | other
Q8-9 docs/ui-spec toolchain (spec.config.yaml, schema, generated files, tools in .claude/skills/ui-spec): the area map decides the new home; tool defaults follow it* | keep the directory outside the retirement
Q8-10 gitignored .claude/rules and the owner's ~/.claude: out of scope, recorded in the handover* | pull into the repository
Q8-11 core/workflows rule in scripts/generate-shipped-path-inventory.mjs (the file is inside the frozen extractor closure): allowed if the doc inventory is identical before and after* | skip, leave the known gap
Impact analysis: executor has / has not access to the GitNexus tools
Review sessions: started by the owner
```

## Requirements

Deliverables (D numbers are used in steps and criteria; names are fixed here so the next phase can find them):

| D | Deliverable | Path |
|---|---|---|
| D1 | Consumer census (JSON and Markdown), regenerable | `P/reports/phase-08/consumer-census.{json,md}` |
| D2 | Rewrite manifest, schema, patches | `P/consumer-rewrites/manifest.json`, `consumer-rewrites.schema.json`, `patches/` |
| D3 | Resolved link queue (the 47-edge Pilot B queue plus every Phase 6 queue; each entry has a target) | `P/consumer-rewrites/link-queue.json` |
| D4 | Tool `consumer-rewrites` (census, propose, verify-manifest, apply, remnants) with tests | `scripts/consumer-rewrites.mjs`, `test/scripts/consumer-rewrites.test.mjs` |
| D5 | Retirement-check evaluators: `consumers-rewritten` reads the manifest; `evidence-digests` and `write-lease` stop being "planned" once D7 and D10 exist | `scripts/check-doc-retirement.mjs`, its test |
| D6 | Behavioral-reader patches (survey section 6) prepared and tested | `P/consumer-rewrites/patches/` (and, if Q8-2 yes, early-harvest commits in `L`) |
| D7 | Evidence relocation manifest generator and verifier (`--generate`, `--before`, `--after`), tests, refreshed consumer table | `scripts/check-evidence-relocation.mjs`, `test/scripts/check-evidence-relocation.test.mjs`, `P/reports/phase-08/evidence-relocation-manifest.json`, `evidence-consumers.md` |
| D8 | Alias coverage report on the merged draft (not activated) | `P/reports/phase-08/alias-coverage.md` |
| D9 | Shipped-path inventory regenerated, with the `core/workflows` rule | `P/shipped-path-conventions-inventory.{json,md}`, `scripts/generate-shipped-path-inventory.mjs` and test (the generator change is authorized only for the `core/workflows` classification, and only if Q8-11 says yes) |
| D10 | Documentation-cutover lease (module, door, commit and reference guards, merge and dispatch seams, doctor check), acceptance run, spec row, changelog | in `L` (paths under Allowed paths) |
| D11 | Rehearsal reports (two rounds at most) | `P/reports/phase-08/rehearsal-1.md`, `rehearsal-2.md` |
| D12 | List of live work items naming a retiring path, with owner action | `P/reports/phase-08/live-work-items.md` |
| D13 | Handover to Phase 9: ordered cutover command list with expected outputs, expected counts, what remains blocked and why | `P/reports/phase-08/handover-to-phase-09.md` |

Rules:

- No retirement of a path happens here; no alias is activated (`P/alias-table.json` stays as it is); no authority route changes; `AGENTS.md` and `CLAUDE.md` are not edited (Plan B is their next writer; the replacement text is prepared in the manifest).
- Render targets (`.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/<fgos-*>`) are never edited by hand and never get manifest `rewrite` entries: their entries are `regenerate`, produced by `npm run build:skills` after the source entry applies.
- Evidence payload bytes are never edited (policy rule 3); legacy-path text inside payloads is covered by aliases.
- Immutable history (`archive/`, `.fgos/` logs, `docs/history/`, `plans/`, `CHANGELOG.md` past entries) is never rewritten.
- A consumer file edited on main after the manifest pin is `drift`; the entry is re-proposed and re-reviewed, never applied blind.
- Code changes in `L` follow the repository rules: tests first, narrowest test then the full suite, conventional commits without AI references, no secrets, setup/doctor registration for every new dependency, a `CHANGELOG.md` `## [Unreleased]` line for anything a user of fgOS would see. Before editing any function in `L`: run `fgos tool query --capability impact-analysis --status present` (`CLAUDE.md` gate); when full, run `impact` on each symbol and report it; before each commit run `detect_changes`; an executor without those tools records that and the reviewer runs them before the verdict.

**Allowed paths in `W`** (check A enforces; list in `reports/phase-08/allowed-paths.json`; `P` as above):

| Path | Limit |
|---|---|
| `P/consumer-rewrites/**`, `P/reports/phase-08/**` | everything the phase writes |
| `scripts/consumer-rewrites.mjs`, `scripts/check-evidence-relocation.mjs`, `test/scripts/consumer-rewrites.test.mjs`, `test/scripts/check-evidence-relocation.test.mjs` | new, tests first |
| `scripts/check-doc-retirement.mjs`, `test/scripts/check-doc-retirement.test.mjs` | the evaluators `consumers-rewritten`, `evidence-digests`, `write-lease` only |
| `scripts/generate-shipped-path-inventory.mjs`, `test/scripts/generate-shipped-path-inventory.test.mjs`, `P/shipped-path-conventions-inventory.{json,md}` | `core/workflows` classification and regeneration only |
| `P/plan.md` | `7.1` row 8 and the answers record in `7.5b` |
| `scripts/check-legacy-docs-ratchet.exceptions.json` | sync accounting |

**Never modified in `W`:** `docs/**` (any document), `AGENTS.md`, `CLAUDE.md`, `core/**`, `domains/**`, `.agents/**`, `plugins/**`, `src/**`, `bin/**`, `test/**` other than the files above, the extractor closure (`scripts/generate-doc-inventory.mjs`, `scripts/doc-inventory-artifact.mjs`, `scripts/generate-shipped-path-inventory.mjs` except as listed, `scripts/check-legacy-docs-ratchet.mjs`, `scripts/lib/is-main-module.mjs`), the rule text of the constitution and vocabulary, `P/alias-table.json`.

**Allowed paths in `L`:** a new lease module under `src/runner/` (name chosen in Step 8, recorded), `bin/fgos.mjs` and `src/cli/command-registry.mjs` (the door; a new verb needs its `externalEffect` flag and manifest entry like the other verbs), `.githooks/pre-commit` (commit guard), a new `.githooks/reference-transaction` (ref-movement guard, design decision 8), `src/runner/merge.mjs` (merge gate), the out-of-process dispatch seams named in the design (`fgos dispatch execute`, the assignment runner, `bind()` callers), `src/setup/registrations.mjs` (doctor checks), `docs/specs/distribution.md` (one data-dictionary row, per Q8-3, with its ratchet exception in `W` at the next sync), `CHANGELOG.md`, new tests under `test/`.

## Architecture

### Consumer groups (survey numbers, pre-Phase-6; re-measured in Step 2)

Reference edges to the core set, distinct files, class and method:

| Group | Files | Ref edges | Class | Method | When |
|---|---:|---:|---|---|---|
| A always-loaded: `AGENTS.md` (about 21 hand-written lines, 10 more in the generated block), `core/instructions/platform-laws.md` | 1 | 8 (plus 28 to root authorities) | `rewrite` source lines, then regenerate the projected block | prepared replacement text, owner-reviewed | cutover, after Plan B |
| B1 skill sources, B2 other core | 12 | 21 | `rewrite` | exact text at line | cutover |
| C generated renders | 19 | 35 | `regenerate` | `npm run build:skills` | cutover, after B |
| D1 gate scripts and data | 6 | 1,026 (1,020 ratchet data) | `exempt-tool-data` / `retire-with-source` / a few `rewrite` | retirement list per Q8-4 | cutover |
| D2 other scripts (`check-decision-citation-drift`) | 1 | 2 | `patch` (default scan root) | behavioral reader | cutover (or early, Q8-2) |
| E tests, fixtures | 35 | 215 | 136 `exempt-synthetic`, 43 `exempt-history` (recorded fixtures), 3 real-file readers `patch`, rest `rewrite` | per file | cutover |
| F src, bin, apps, packages, `.github` | 31 | 48 | 49 of 50 non-glob edges are comments: `rewrite`; help strings: `patch` | per file | cutover |
| G1a evidence payloads | 128 | 539 | `exempt-history` (never rewritten) | verifier | cutover step 6 |
| G1b platform documents | 86 | 754 | `exempt-provenance` (history, ledgers, verification) and `rewrite` (live links, promoted portals) | after Phase 6 | cutover |
| G2 end-user docs | 66 | 160 | `rewrite` | registry rules for knowledge documents | cutover |
| G3 other docs (root documents, generated indexes) | 20 | 96 | `rewrite` / `regenerate` | per file | cutover |
| H1, H2 history and plans | 747 | 5,334 | `exempt-history` | alias table | cutover |

Not in git or not visible to the extractor: live work items (D12), `.claude/rules/**` (gitignored), `~/.claude/**`, wrapped-line paths, `path.join('docs','specs')` constructions, directory-only mentions; the `--remnants` mode of the tool scans for the git-tracked ones.

### Approach and why

Prose, comments, help text and test paths are applied by a digest-bound manifest in the cutover commit (Q8-1, recommended), not edited on the long-lived branch: nothing a reader reads changes before the cutover (checks C and I stay green for the whole phase), no hundreds of edits wait on a branch while main moves, and the same manifest is rehearsed twice before the real run. Where text cannot be replaced mechanically (a test that walks a directory, a tool default, a document whose structure moves), the manifest holds a prepared patch, tested in the rehearsal. The lease is the only code that must land on main early.

### Manifest entry shape

```text
entryId            stable, derived from consumerPath + line + referenceAsWritten + target
consumerPath, line, referenceAsWritten, legacyTarget
group              A..H as above
kind               link | code-span | code-literal | comment | help-text | data | patch
class              rewrite | regenerate | retire-with-source | exempt-* | judgment
replacement        { text, newTarget (docs/platform path), anchor | null }   (rewrite)
patchFile          path under patches/                                       (patch)
reason             required for exempt-* and judgment
consumerBlobId     git blob id of the consumer at the pin (drift check)
authoredBy, reviewedBy, reviewStatus (pending | reviewed | hold)
```

`--apply` replaces `referenceAsWritten` with `replacement.text` only in the recorded line when `consumerBlobId` equals the current blob; otherwise it reports `drift` and writes nothing for that file; it never touches render targets, payloads, history or paths outside the manifest.

## Related Code Files

- Read: `scripts/check-doc-retirement.mjs`, `scripts/check-doc-inventory-gates.mjs`, `scripts/doc-alias-resolver.mjs`, `scripts/generate-shipped-path-inventory.mjs`, `src/runner/main-checkout-lock.mjs`, `src/runner/merge.mjs`, `src/runner/execution/bind.mjs`, `src/runner/dispatch/cli.mjs`, `scripts/dispatch-decide-hook.mjs`, `src/setup/registrations.mjs` (`registerCheck`, `main-checkout-hook-wired`), `src/setup/git-hooks.mjs`, `.githooks/pre-commit`, `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`.
- Create and modify: the paths of the Allowed lists.

## Implementation Steps

### Shared rules (apply to every step)

Session, commit, test, counting and scratch rules are those of the Phase 6 file (`phase-06-transform-all-platform-areas-as-candidate-material.md`, "Shared rules"), restated: work only in `W` (or only in `L` for Steps 8 and 9, never both in one command sequence; run `pwd` and `git branch --show-current` before any git command); never write in `/home/vantt/projects/forgentX`; merge main with `git merge main`, never rebase, never force-push, never push; commit explicit paths only with conventional messages without phase, step or finding labels; tests with `env -u CLAUDE_CODE_SESSION_ID node --test <file>` first, then `node --test test/scripts/*.test.mjs`, then the full suite `env -u CLAUDE_CODE_SESSION_ID npm test` when shared code changed; count with node scripts; report to the owner in Vietnamese (em, anh), short, evidence-based. A worktree made for a rehearsal or test needs `node_modules` and `target` symlinked from `W` before any `node --test` run, or mass failures follow.

Scratch: `S=/tmp/phase08`; `cp $P/reports/identity-registry.json $S/`; `node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry $S/identity-registry.json --json-out $S/doc-inventory.json --md-out $S/doc-inventory.md` (about 18 s, 2.3 GB, one run at a time).

Resume protocol: start of session: read `reports/phase-08/progress.md`; `git status --porcelain` empty (else list and stop); `HEAD` descends from the last green commit; rebuild scratch; rerun checks A to I once. End of session: update `progress.md` (step, state, last green commits in `W` and `L`, `B0`, `LB0`, `SYNC`, manifest counts by class and review status, pending review requests, owner-queue items open, next action) and commit. States: `building`, `ready-for-review`, `in-review`, `rework`, `rehearsal`, `closed`.

Owner questions: `reports/phase-08/owner-queue.md` (id, question, options with recommendation, step blocked, dates, answer); released once per review point.

**Checks** (variables as above; commands from `W` unless named):

```bash
# A  own commits inside Allowed paths (first-parent, no merges); exit 0, no output (Phase 6 one-liner, reports/phase-08/allowed-paths.json)
# B  extractor closure unchanged; empty output. The shipped-path generator is on the Phase 6 closure list and Step 9 may change it (Q8-11): it is excluded here and checked by the identical-inventory test of Step 9 instead
for f in scripts/generate-doc-inventory.mjs scripts/doc-inventory-artifact.mjs scripts/check-legacy-docs-ratchet.mjs scripts/lib/is-main-module.mjs; do echo "$f $(git rev-parse HEAD:$f)"; done | diff - <(grep -v generate-shipped-path-inventory $P/reports/phase-06/extractor-blobs.txt)
# C  no area status changed since SYNC; prints [] (Phase 6 check C one-liner)
# D  gate non-strict: node scripts/check-doc-inventory-gates.mjs --inventory $S/doc-inventory.json --identity-registry $S/identity-registry.json --decisions $P/pilot/decisions --decisions $P/ledger/decisions --json ; exit 0 (previous-registry form per Phase 6 owner answer)
# E  scoped strict over all sources equals the Phase 6 final hold list (Phase 6 check E)
# F  node scripts/check-legacy-docs-ratchet.mjs ; node scripts/check-doc-constitution.mjs --no-ledger --check-placement --promotion ; both exit 0, 0 headerless, 0 missing
# G  no lost claim id, no self-review (Phase 6 check G one-liner)
# H  node scripts/check-doc-candidate-status.mjs --json : 0 findings
# I  reader links equal reports/phase-06/reader-links-baseline.txt (Phase 6 check I): no reader document changed
# K  manifest: node scripts/consumer-rewrites.mjs --verify-manifest --inventory $S/doc-inventory.json --manifest $P/consumer-rewrites/manifest.json ; exit 0 = every in-scope reference edge has exactly one entry, no judgment entry, no stale blob id, every exempt entry has a reason
# L  evidence: node scripts/check-evidence-relocation.mjs --manifest $P/reports/phase-08/evidence-relocation-manifest.json --before ; exit 0
# M  retirement dry run, for the record: node scripts/check-doc-retirement.mjs --inventory $S/doc-inventory.json --identity-registry $S/identity-registry.json --consumer-manifest $P/consumer-rewrites/manifest.json --cutover --json  (exit 1 expected; blocked list must shrink as D4 to D10 land)
```

(`--consumer-manifest` and the flags of K and L are the intended contract of the new tools; they do not exist yet. Step 1 fixes the final flag names; this table is then edited to match.)

When each runs: A, B, H, I after every commit; A to I after each tool commit and at the end of each step; K after every manifest commit; L after D7; M at every review point.

**Stop conditions** (stop, report to the owner, decide nothing; each has its measure)

| # | Condition | Measure |
|---|---|---|
| 1 | A constitution or vocabulary rule, or the extractor unit definition, would have to change | the needed edit is not additive 2.x, or check B differs |
| 2 | A gate script needs a change beyond the Allowed list | the diff touches a function the Allowed table does not name |
| 3 | A claim id is lost | check G fails or a refresh reports a missing id |
| 4 | Consumer drift | manifest entries whose `consumerBlobId` differs from the blob at `SYNC`, divided by all entries, above 10% (below: re-propose and re-review those entries only) |
| 5 | Census method defective | the first rehearsal shows more than 20 breakages that no manifest entry or exemption names, or any unlisted breakage in the second rehearsal (chosen thresholds, not measurements) |
| 6 | A merge conflict touches `docs/platform/**` content or 10 or more files | `git diff --name-only --diff-filter=U` after the merge |
| 7 | Isolation broken | check A, B, C or I fails, or a document a reader reads changed |
| 8 | Lease acceptance fails twice, or a refusal cannot be implemented as designed | the same acceptance case red after one fix, or a gate in design section 3.3 has no reachable seam (record the seam) |
| 9 | Another plan writes a shared hot file during the lease build | `git log main --no-merges --format=%h <LB0>..main -- .githooks src/setup/registrations.mjs src/runner/merge.mjs src/cli/command-registry.mjs bin/fgos.mjs` non-empty: serialize, merge main into `L`, redo the affected tests |
| 10 | Early-harvest change breaks main's suite | full suite red in `L` after one fix (baseline failures excluded; record the baseline first) |
| 11 | A precondition fails | input missing, `owner-answers.md` missing or unsupported, tree dirty at a session start |
| 12 | Review rate | reviewer verdict `rework` on more than 3% of reviewed manifest entries in the second review round |
| 13 | Effort ceiling | manifest entries decided per review round fall below two thirds of the first round's, or total review rounds pass 12 without Step 6 done: replan with the owner |
| 14 | A re-run fails twice | the same check red after one fix attempt |

### Step 0. Authorization, pin and inputs

1. Preconditions; `pwd`; branch; clean tree; `git merge main`; record `git rev-parse main`; account main-side legacy edits as ratchet exceptions.
2. Verify the inputs table; read the state of Plans A, B, C (`git log main --format='%h %s' -- plans/261006-1415-fgos-single-door-mechanisms plans/261006-1415-fgos-convention-component plans/261006-1445-fgctl-dev-activation` and each `plan.md` status); record in `baseline.md`.
3. Scratch inventory; checks D, F, H, I and M (record the blocked list; at drafting time 15 blocked, 4 pass, 1 owed to review). Read `git config core.hooksPath` (expected: the main checkout's `.githooks`), and `ls .githooks`.
4. Write `reports/phase-08/baseline.md`, `allowed-paths.json`, `progress.md`, `owner-queue.md`, `review-brief.md` (reviewer checks for tools, manifest rows, evidence, lease, rehearsal; a hostile section: find consumers the census missed, exemptions that hide a live reader, apply steps that can write outside the manifest, lease gates a registered writer or `--no-verify` can walk around). Record the owner answers in `plan.md` 7.5b as one bullet.
5. Commit `docs(unification): record the consumer preparation baseline`; record it as `B0`. Done: baseline committed; D exit 0; F exit 0; M's blocked list recorded.

### Step 1. Tool `consumer-rewrites` and the retirement evaluator (R1)

1. Tests first (red), then code (green), separate commits: (a) `--census` groups every consumer edge of the inventory by the group table (rule table in the tool, one test per group), counts reference and glob edges, writes D1; (b) `--propose` writes one manifest entry per reference edge: class by the rules of the group table, replacement from the area maps and the alias drafts (document level when only the document is known, anchor when the old anchor maps to an alias entry with an anchor, `judgment` otherwise with the quoted reason), `consumerBlobId` from `git ls-tree` at the pin; (c) `--verify-manifest` (every in-scope reference edge has exactly one entry; no duplicate `entryId`; no `judgment`; every `exempt-*` has a reason; blob ids current; no entry targets a render target as `rewrite`); (d) `--apply` with `--dry-run` and `--write`, drift refusal, never writes outside the manifest, writes nothing when any entry of a file drifts; (e) `--remnants`: read-only scan of tracked files for the blind spots of the survey (paths wrapped across two comment lines, `'docs', 'specs'` path segments, directory-only mentions of a retiring root, `docs/ui-spec/` references), printing `path:line` and the reason; (f) `--assert-clean` for Phase 9 step 9: no reference edge from an authority consumer to a retiring path outside the exempt classes.
2. `scripts/check-doc-retirement.mjs`: `consumers-rewritten` counts only reference edges whose manifest entry is not exempt and not yet applied, and fails when an edge has no entry; `evidence-digests` evaluates the verifier result once D7 exists; `write-lease` evaluates the lease doctor check once D10 exists (a missing tool still reports `blocked`, never `pass`). Tests per evaluator (blocked on missing entry, pass on applied, blocked on an exemption without reason).
3. Structural mutation run on `--verify-manifest` and `--apply` (copies of one manifest with one seeded defect each: missing entry, duplicate entry, stale blob, exempt without reason, rewrite on a render target, apply on a drifted file, apply that would touch a payload, entry for a path outside scope): every defect reported, 0 findings on the clean copy.
4. Done: tests red then green; `node --test test/scripts/*.test.mjs` green; D on the baseline inventory gives the same JSON as the baseline; the mutation record in `reports/phase-08/tooling.md`; a reviewer session (not the author) read the diff once and wrote `reports/phase-08/review-tooling.md` (review point R1). Final flag names written into the checks table above.

### Step 2. Census and classification

1. Merge main, refresh, run `--census` and `--propose` (class `judgment` allowed at this point). Write D1; compare group totals with the survey (`consumer-survey.md` section 4) and explain every group whose reference-edge count moved by more than 10% (Phase 6 changed the corpus).
2. Exemption ledger inside the manifest: every `exempt-*` entry has a written reason that names the class rule (history: immutable; synthetic: the test exercises a gate tool with legacy paths as data; tool-data: data of a gate that retires; provenance: the document is labelled evidence). The reviewer reads 100% of exemption reasons and 100% of exempt entries in groups A, B, C, F (a live reader hidden behind `exempt-*` is the main defect risk).
3. Run `--remnants`; each hit becomes a manifest entry or a recorded non-issue.
4. Done: D1, D2 first full commit, K passes except `judgment` entries; counts by class and group in `step-2-report.md`.

### Step 3. Behavioral readers (D6) and bypass list

1. For each behavioral reader of survey section 6 (re-measured), write a patch file and, tests first, a test or a changed assertion that passes on the patched tree in the rehearsal clone: `test/docs/rul11-anchor-phrase.test.mjs` (repoint to the single owner of the law text: decide among the three `platform-foundations.md` with the area maps, record the choice), `test/docs/decisions-corpus-retired.test.mjs` (assertions rewritten against the new decision documents: owner reads the diff), `test/runner/dead-vocabulary-guard.test.mjs` (read what `collectFiles` does on a missing directory first), `scripts/check-decision-citation-drift.mjs` default root and its baseline, the CLI help strings (`src/cli/command-registry.mjs` lines naming `docs/specs/<area>.md` and `docs/specs/distribution.md`, `bin/fgos.mjs` help), `.claude/skills/ui-spec/tools/*` and `SKILL.md` defaults (per Q8-9), `src/setup/instruction-registry.mjs` default manifest path (only if the area maps move `docs/architecture-manifest.json`), the gate scripts' root constants (ratchet `DEFAULT_ROOTS`, retirement `LEGACY_ROOTS`; retire or rebaseline per Q8-4).
2. If Q8-2 says yes, the readers that can pass on both the current and the new tree (for example a default root made configurable with the current value kept) become separate early-harvest commits in `L`, reviewed, owner-merged; the rest stay patches.
3. Done: every behavioral reader has a patch or an exemption with reason; the list is complete against `--remnants`; reviewer reads every patch.

### Step 4. Link queues (the 47-edge prerequisite)

1. Union of the Pilot B queue (`reports/phase-05/pilot-b-link-judgment-queue.json`, 47 edges, targets `docs/specs/work-state.md` 44 and `docs/io-contract.md` 3, some already resolved by Phase 6 area maps) and every Phase 6 per-source queue into `P/consumer-rewrites/link-queue.json`. Re-run `--propose` so each queue entry meets the area maps and alias drafts again.
2. For each entry, the executor proposes the target (`path#anchor` when the old text names a heading or a rule id, else the document; line citations like `work-state.md:1045` resolve through `node scripts/doc-alias-resolver.mjs --table <merged draft> --resolve <path:line> --exact`, accepting `line-to-section` as approximate) with the quoted reasoning; the reviewer reads 100%; only entries the reviewer marks ambiguous go to the owner list, one table, with the proposal and the alternative.
3. Done: 0 `judgment` entries; D3 committed; owner list answered or parked (a parked answer blocks only its entries; list them in the handover).

### Step 5. Prepared text for the always-loaded and shipped consumers (R2)

1. Group A: the exact replacement of each `AGENTS.md` hand-written line and of `core/instructions/platform-laws.md` (and the instruction that regenerates the projected block: read `src/setup/instruction-projections.mjs` for the command and record it), including `docs/specs/reading-map.md` to `docs/reading-map.md` and the Q5 rulings of Phase 6; the diff shown to the owner (always-loaded doctrine). `AGENTS.md` is not edited here (Plan B is the next writer).
2. Groups B and C: replacements for skill sources; record that `npm run build:skills` regenerates all renders (Plan A made renders carry a generated header and added a doctor drift check; the cutover must commit regenerated output unmodified).
3. Q8-5 applies to every shipped text; a shipped link to a repository-local document stays a repository-local path (the shipped-path inventory classifies each as `repository-local-contract`).
4. Done: `reports/phase-08/always-loaded-diff.md` (before and after of each line); review request `review-request-2.md` (census, manifest counts by class, exemption list, patches, queue, always-loaded diff, owner list) written, committed; STOP at `ready-for-review`. After the verdict: rework once; K passes with 0 `judgment` and every entry `reviewed`.

### Step 6. Evidence relocation (D7)

1. Tests first, then `scripts/check-evidence-relocation.mjs` per policy section 4 to 5: `--generate` writes the manifest (sorted by `before`, fields `collection`, `before`, `after`, `sha256`, `bytes`, `mode`, `gitBlob`, `relation`, `sourceCommit`), `--before` (legacy and platform copies both exist and hash equal; no platform payload file missing from the manifest), `--after` (no legacy payload remains, platform hashes and modes equal, no maintained text outside history, archive and the alias table names a legacy payload path). Hashes recomputed from the working tree, never from the manifest.
2. Generate the manifest from the current base into `reports/phase-08/evidence-relocation-manifest.json` (the sealed copy under `docs/platform/history/documentation-authority-unification/` is Phase 9's job); run `--before`: expected 867 of 867 pairs (re-check the count: Phase 6 may add or remove payload documents), 12 executable-mode files kept.
3. Refresh the consumer table of the policy (section 3 method; node scan instead of `grep | wc`) into `evidence-consumers.md`; record the count of files naming the legacy payload path outside the two payload trees (the policy measured 197 on 2026-10-06); each one maps to a manifest entry class (history: alias; promoted-area proof-root links: `rewrite`; skill copies: source `rewrite` plus regenerate).
4. Ratchet: the ratchet baseline lists the 867 payload paths and the platform copy has no guard; per policy decision 8 the verifier is the only guard; add a standing run of `--before` to the suite only if the owner asks (not in scope here).
5. Done: tests green; L exit 0; `evidence-consumers.md`; M shows `evidence-digests` computed from the verifier.

### Step 7. Alias coverage (D8)

1. Validate the merged alias draft: `node scripts/doc-alias-resolver.mjs --table <merged draft> --constitution P/minimum-constitution.json --repo-root . ` (flags per `--help`; exit 0). Recompute the legacy paths read by path from immutable history (consumer edges whose consumer is under `archive/`, `plans/`, `docs/history/`, `.fgos/`, `CHANGELOG.md`; the 973 figure of Phase 6 is the comparison, expect a different number: Phases 6 to 8 add plan files) and list each as covered by a bare-path alias or `no-alias` with a written reason or a `retired-with-evidence` entry.
2. Resolve the paths found in the manifest's `exempt-history` entries through the resolver with `--exact`; the approximate (`line-to-section`) forms are listed.
3. Done: `alias-coverage.md` with counts and method lines; no alias activated; the alias table file untouched.

### Step 8. Documentation-cutover lease (D10, R4)

Work in `L` only. Design decisions are settled (design section 6, owner 2026-10-06): no TTL and fail closed; refuse all non-holder out-of-process dispatch; refuse merges whose changed files intersect scope; the lock primitive of `src/runner/main-checkout-lock.mjs` behind a thin wrapper that owns the lock file name `documentation-cutover.lock` and never exposes `ttlMs`; rehearsal before the cutover; `reference-transaction` guard; random holder token kept outside the environment; committed "held" sidecar checked by doctor and the commit hook. Scope: `docs/**`, `AGENTS.md`, `CLAUDE.md`, `docs/transitional-switchboard.md`, `plans/260925-documentation-authority-unification/transitional-switchboard.json`, `core/skills`, `.agents/skills`, `plugins/fgOS/skills`.

1. Create `L` (owner confirms path and branch name, Q8-8); record `LB0`; run the baseline full suite in `L` and save the failures (stop condition 10 compares against them). Run the impact-analysis capability query; run `impact` for every function to be edited (at least `acquireMainCheckoutLock`, `mergeRunnerItem` and `mergeRunnerItemLocked`, `bind`, the `registerCheck` users, the pre-commit entry) and write the result into `reports/phase-08/lease-impact.md` (committed in `W`), or a note that the tools were unavailable to this executor.
2. Spec first (AGENTS.md gate): the data-dictionary row of design section 5 per Q8-3 in `docs/specs/distribution.md` in `L`, with its ratchet exception recorded in `W` at the next sync; plus the doctor registration entry (id, what it reports) written before code.
3. Tests first, then code, one seam per commit: (a) wrapper module and door (acquire, inspect, release, abandon; verbs registered in `src/cli/command-registry.mjs` with `externalEffect` flags and manifest entry, doc strings written, `fgos --help` shows them); (b) acquire preconditions of design 3.4 (cutover worktree on the plan branch; every worktree clean in scope; no unmerged branch touching scope; digests of the scope roots equal to the inventory's; ratchet, gates and evidence verifier pass; hook wired) with the lock taken first and the preconditions verified under it; (c) `.githooks/pre-commit` guard, not gated by the home-checkout test, reading the main checkout's `.fgos/documentation-cutover.lock` from any worktree; (d) `.githooks/reference-transaction` guard on the target branch refs, cheap and fail-open when no lease exists; (e) merge gate in `src/runner/merge.mjs` (refuse when the item's `changedFiles` intersect scope; code-only merges pass); (f) dispatch seams (`fgos dispatch execute`, the assignment runner, `bind()` callers refuse with reason `documentation-cutover-lease`; `decide` reports `unavailable` with that reason); (g) registered doc writers call one shared check (the confirmed list of writers from the design's node scan: confirm each file by reading it, drop the ones that do not write in scope); (h) release in two phases (before ref movement: re-enumerate worktrees and compare target-branch scope tree ids with the acquire-time ids; after verification: record final ids and remove the lock); (i) abandon (refuses a live numeric holder, writes the record, requires the owner confirmation flag and a reason); (j) doctor check (held lease with age and holder fails; sidecar says held and lock absent fails) registered in `src/setup/registrations.mjs`; (k) `CHANGELOG.md` `[Unreleased]` line; (l) the committed evidence sidecar writer.
4. Acceptance run (design decision 6) in a throwaway clone with two linked worktrees, scripted and saved as `reports/phase-08/lease-acceptance.md`: acquire refused for each failed precondition (dirty in-scope file in the second worktree, an unmerged branch touching scope, hook not wired); acquire succeeds; a three-minute-old record is still held; holder commit allowed, non-holder commit with a staged scope path refused from the second worktree; non-holder out-of-process dispatch refused; scope-touching merge refused and code-only merge allowed; `--no-verify` commit and a fast-forward `git merge` that change scope are caught by the `reference-transaction` guard or by the release-time tree comparison (record which); vanished lock detected by doctor and the hook; release refused on drift and after a red verification; abandon path including the refusal for a live holder; rerun of acquire after abandon repeats every precondition.
5. Known limits to record, not hide: a raw edit in another worktree that is never committed; in-session inline agent work that is only stopped at commit; identity is a convention (the token narrows it); `.claude/rules` and `~/.claude` are outside git.
6. Done: suite green against the baseline; acceptance run all cases; independent code review (a session that did not write it; it runs `impact` and `detect_changes` if the executor could not) in `reports/phase-08/review-lease.md` (review point R4); stop here: the owner merges `L` to main. Phase 9 cannot start before that merge; in `W`, `git merge main` brings it in.

### Step 9. Shipped-path inventory and non-git consumers

1. Regenerate the inventory: `node scripts/generate-shipped-path-inventory.mjs --commit HEAD --json-out P/shipped-path-conventions-inventory.json --md-out P/shipped-path-conventions-inventory.md` (flags per `--help`); first add the missing rule for `core/workflows/` (5 YAML files and the directory are `mixed-or-unclassified` today), tests first, fixture repository as in `test/scripts/generate-shipped-path-inventory.test.mjs`. The generator is imported by the document inventory generator, so prove it is harmless: regenerate the document inventory before and after the change into scratch and require identical item list, claim rows, unit digests and consumer edges (compare the loaded JSON with a node script; any difference is stop condition 1). Compare consumer-project contract rows with the committed version (69 consumer-project, 107 repository-local, 7 mixed, 0 unclassified at 2026-09-25): equal, or each difference explained. `scripts/verify-phase-01.mjs` stays frozen and is not run.
2. Live work items (D12): read main's live work-state read-only (the `fgos list --all` read verb pointed at the main checkout's data directory, or the file `/home/vantt/projects/forgentX/.fgos/state.json` opened read-only; the `--dir` flag and the output shape are UNPROVEN, read `--help` first; `W` holds only the branch snapshot; no state-mutating verb), list every item not in a terminal status whose `verify`, `footprint`, `refs`, `acceptance`, `action` or `description` names a retiring path (12 at the branch snapshot; UNPROVEN for main), with the item id, field, text, and the supported write door for its owner session (Q8-6). The count must be 0 at lease acquire (Phase 9 precondition) or each accepted by the owner.
3. Untracked consumers: `.claude/rules/**` and `~/.claude/**` named in the handover as outside git and outside the lease (Q8-10); content scanned read-only for retiring paths (the survey found none in `.claude/rules`).
4. Done: D9 committed; D12 committed.

### Step 10. Rehearsal (D11, R5)

1. Throwaway clone: `git clone --local W $S/clone`; symlink `node_modules` and `target` from `W`; record the base suite result on the untouched clone first (`env -u CLAUDE_CODE_SESSION_ID npm test`, run in the background, output saved; duration UNPROVEN, memory heavy: no other suite at the same time; baseline failures are the comparison).
2. In the clone: apply the manifest (`--apply --write`); `npm run build:skills`; regenerate generated indexes with their generators; apply the cutover mechanics as Phase 9 states them (switchboard statuses to promoted for the new routes and retired for the legacy roots per `docs/transitional-switchboard.md`, delete the maintained files of the legacy roots after `--before`, `--after` on evidence); run: `--remnants`, `--assert-clean`, K, L (`--after`), the full suite, checks D to H, `check-doc-retirement.mjs --cutover` with the manifest.
3. Every test or gate that fails only in the clone is a consumer the census missed: add it to the manifest (entry or patch), review it, repeat once (rehearsal 2). Stop condition 5 measures the rounds. The clone is removed after each round; reports contain commands, exits, counts.
4. Expected remaining blocked checks in `--cutover`: only those Phase 9 owns (`write-lease` acquired at the real cutover, `aliases-cover-immutable-refs` until activation, claims gates owed to the final reviews); each named with its reason.
5. Done: `rehearsal-1.md` (and `rehearsal-2.md` if needed) with: manifest applied count, drift 0, failures before/after, unlisted breakages by group, the blocked list.

### Step 11. Hostile pass, handover and close

1. One hostile review pass (prompt in `review-brief.md`) over the whole phase: census blind spots, exemptions hiding live readers, apply writing outside the manifest, lease gates that can be walked around, rehearsal that did not exercise a path. `reports/phase-08/red-team-1.md`; 0 open Critical or High findings or owner acceptance.
2. Sync main in `W`; refresh; checks A to M; counts into `step-report.md`.
3. Write D13 `handover-to-phase-09.md`: the ordered command list the cutover runs (lease acquire, inventory rerun and drift detection, manifest apply, route promotion, evidence `--before` then deletion then `--after`, alias activation, regeneration, `--assert-clean`, full verification), the expected counts and exit codes from the rehearsal, open owner items, the order constraint with Plan A phase 06 and Plan B phase 06 (`plan.md` 7.5), the AGENTS.md prepared diff, and the list of parked answers.
4. Set `plan.md` 7.1 row 8 to "awaiting owner review". Closing is the owner's act; no tag.

## Success Criteria

Every item has its measure; "recorded" means in `reports/phase-08/`.

- [ ] census regenerated at the closing commit; every in-scope reference edge has exactly one manifest entry (K exit 0: 0 missing, 0 duplicate, 0 `judgment`, 0 stale blob ids, every exemption has a reason); entries by class and group recorded;
- [ ] reviewer read 100% of exemption reasons and 100% of exempt entries in groups A, B, C, F; `rework` rate at most 3% of reviewed entries in the second round;
- [ ] link queue: 47 of 47 Pilot B entries and every Phase 6 queue entry resolved to a target; ambiguous ones decided by the owner;
- [ ] behavioral readers: each of the list (survey section 6, re-measured) has a tested patch or a reasoned exemption; `--remnants` hits all accounted;
- [ ] rehearsal: manifest applied with 0 drift and 0 refused entries; render regeneration leaves no diff; full suite failures in the clone equal the baseline failures; `--assert-clean` exit 0; `consumers-rewritten` passes in the clone; unlisted breakages 0 in the last round;
- [ ] evidence: verifier tests pass; `--before` exit 0 on the plan HEAD, `--after` exit 0 in the clone; payload bytes and modes unchanged; consumer table refreshed;
- [ ] alias: merged draft validates (exit 0); every history-read legacy path is covered or `no-alias` with a reason; the alias table file is unchanged;
- [ ] shipped-path inventory regenerated; consumer-project contract rows equal the 2026-09-25 inventory or each difference is explained; `core/workflows` classified;
- [ ] lease: every acceptance case of Step 8 item 4 passes; independent review verdict committed; doctor check registered; spec row, changelog line and ratchet exception recorded; code ready for the owner to merge to main (the merge itself is a Phase 9 precondition);
- [ ] live work-item list committed; Phase 9 precondition "0 at acquire" stated;
- [ ] no document a reader reads changed (checks A, C, I green all along); no authority flip; extractor closure unchanged; no claim id lost; suite green;
- [ ] the retirement dry run's blocked list names only Phase 9-owned checks.

Verdicts: PASS, PASS-WITH-AMENDMENTS (additive tool fixes only), METHOD-MUST-CHANGE (stop and report).

## Risk Assessment

Program-level risks and countermeasures: `plan.md` section 11. Phase-specific:

| Risk | Detection | Response |
|---|---|---|
| A reader hides behind an exemption and breaks at the cutover | reviewer reads exempt entries of groups A, B, C, F; rehearsal suite; `--remnants` | reclassify, patch |
| The census misses a consumer (wrapped path, path segments, work-state, untracked) | rehearsal breakages; `--remnants`; D12 | add entry, repeat once, else stop 5 |
| A legacy-root document is edited after Phase 6 (lease spec row, help text, main-side changes) and its reviewed rows go stale | `decision-digest-stale`, check E | decision row for the new unit before the next review; re-decide changed rows through the Phase 6 loop |
| Manifest drifts while main moves | blob id check at every sync | re-propose only drifted entries; stop 4 above 10% |
| Lease gate bypassed (`--no-verify`, ff-merge, raw edit, identity spoof) | acceptance run; release-time tree comparison; hostile pass | document the limit; keep release-time comparison; do not claim a freeze the gates cannot enforce |
| Lease guard lives only on a branch | `git config core.hooksPath` is the main checkout's `.githooks` | lease merged to main first (owner act); acquire refuses when the main checkout's hook lacks the guard |
| Two plans write `.githooks/pre-commit` and `src/setup/registrations.mjs` (lease, Plan B phase 05) | stop 9 | serialize on main: land one, merge main into the other |
| Early-harvest code change breaks main | baseline vs post suite in `L` | revert the commit; stop 10 |
| `npm test` inside an agent session is not hermetic (session id leaks into CLI spawns) | seq tests fail only in-session | always `env -u CLAUDE_CODE_SESSION_ID`; compare with the baseline suite, not with zero |
| Worktree or clone without `node_modules` or `target` shows mass failures | first-run baseline | symlink before any test |
| Q8-5 repoints shipped text to paths that do not exist in consumer projects | shipped-path inventory classifies them `repository-local-contract` | no regression (already dead there); the alternative is Q8-5 option 2 |
| Promoted-area proof-root links (8 links in the verification README, 23 table rows in proof-preservation) are a deliberate migration state | evidence policy section 3 | manifest entries applied at cutover only |

Rollback: the work in `W` is additive (new files and new tools): per review point `git revert` the phase's own commits (listed in `progress.md`; merges of main excluded); whole phase on the owner's say: save the tip (`git branch backup/phase-08-<date>`), `git reset --hard $B0`, redo `git merge main`, checks D, F, I green. `L`: before the owner's merge, delete the branch; after the merge, `git revert` the lease commits on main (the door, guards and checks are migration-specific and are removed after the cutover anyway, with the removal recorded in the spec row and changelog).

## Owner questions (bundled; recommendations marked `*`; full text in `open-questions.md`)

Q8-1 to Q8-11 are in the template of `owner-answers.md` above.
