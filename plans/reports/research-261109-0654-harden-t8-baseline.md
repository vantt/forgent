# HARDEN T8 baseline: Skill/Domain (skills, render surfaces, domain doctrine and registry)

Main SHA `b7c7c372c` (`b7c7c372ca7293ba594521dadfa958ac53c184ad`, 2026-11-09 06:55 +07). `origin/main` later moved to `ff691f40c` (three docs-only commits; no file of this layer changed, checked with `git diff --stat`). Measured 2026-11-09 06:55 to 07:15 (Asia/Saigon) on fg-server2 in two linked worktrees made from `origin/main`. Load was **not** steady: 3 to 5 for the first minutes, 28 to 41 for about eight minutes in the middle (other lanes), 3.4 to 4.6 for the repeat pass. Every timing says its load; the test loop was run twice and the low-load pass is the one quoted.

Read-only research by a subagent for lead:HARDEN. Inputs: [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) per-layer loop step 1 and owner decision 75 (2026-11-09 06:54, "T8 Skill/Domain ... làm T8 luôn", through the same loop, T7 stays WORK's), structure of the [T6 baseline](research-261108-0831-harden-t6-baseline.md) and the [T5 baseline](research-261104-1755-harden-t5-baseline.md). No code, config or doc outside this file changed. The program board was not read (this report neither starts, finishes, blocks nor lands a lane).

## Summary

| Item | Value |
|---|---|
| Rust | **none.** No crate owns skills or domains. Rust only reads: `packages/config` (`supports.skills` shape), `packages/seat-binding` (`required_skills`), `packages/distribution` (`skills_digest` field of the release manifest) |
| Source skills | 66 files, 9 266 lines: `core/skills` 13 dirs (39 files, 5 675) and `domains/coding/skills` 8 skills + `_shared` (27 files, 3 591) |
| Generated copies of those skills | 170 files, **20 359 lines (2.2 times the source)**: `.agents/skills` 66 files 9 329, `.claude/skills` generated part 49 files 3 744, `plugins/fgOS/skills` mirror part 55 files 7 286. Hand-authored beside them: plugin commands 39 files 3 710, `.claude/skills/ui-spec` 43 files 6 334 |
| Node, render and guard code | `src/setup/skill-wrappers.mjs` 1 362 lines (73 functions, none over 300; 2 over 100), `scripts/build-skill-wrappers.mjs` 42, `src/state/domain-registry.mjs` 292, `scripts/build-domain-registry.mjs` 79, `scripts/check-decision-citation-drift.mjs` 511, `domains/coding/harness` 163 |
| Domain doctrine and data | `domains/coding` 49 files 5 276 lines, `domains/marketing` 10 files 191; `domains/*/AGENTS.md` 89 + 25 |
| Tests of the layer | 22 files, 418 tests, **416 pass, 2 fail**, 9 476 test lines; **39.6 s** test time and 57.8 s wall summed file by file at load 3.4 to 4.6 |
| `npm run build:skills` | **exit 1 in a plain checkout** after it has already written the skill surfaces (0.35 to 0.40 s); with the addon staged it exits 0 in 1.0 s warm and leaves the tree clean (no tracked drift) |
| Doctor rows | 7 rows touch the layer, all pass on the activated release; `doctor --json` is now 111 rows, 2 fail (neither is Skill/Domain) |
| Open backlog rows | 5 touch the layer (1 already fixed in code but still `proposed`) |

Facts that matter most for the council:

1. **The two reds are one cause with two readers, and the cause is a copy, not AgentKit.** The tracked project config `.fgos/config.yaml` has `worktreeSetup.commands[0]`, which `fgos worktree create` runs and which copies every `ak-*` skill dir from the main checkout into five skill roots of each new worktree. The AgentKit v3 reinstall of 2026-11-08 (owner decision 74) put 104 `ak-*` dirs (1 813 files) into `.agents/skills`, the directory both guards enumerate. Section 4 has the mechanism and ranked options.
2. **`npm run build:skills` is not safe to run as written.** It fails after writing in a checkout (no addon staging, unlike its sibling scripts), and when it succeeds it rewrites all 104 AgentKit `.claude/skills/ak-*/SKILL.md` into fgOS thin wrappers and writes `.fgos/instructions/effective/repo.json`, a skip-worktree tracked path, which makes `fgos worktree remove` refuse the worktree afterwards (section 4, K3 and K4). I hit that refusal myself.
3. **Part of the render module and more than half of its test file have no production caller.** The Gemini adapter generator and the adapter-target classifiers are about 300 to 400 of the 1 362 lines of `skill-wrappers.mjs`, used only by tests, and 2 216 lines (57 tests) of `skill-wrappers.test.mjs` are test-local "reference models" of three skills deleted on 2026-10-01. Section 7.
4. **There is no area spec.** Skill distribution is a Draft/Partial contract under Packaging-Distribution (last reviewed 2026-09-18), domains are a carriage-only architecture note, the plugin spec is carriage-only. Part A needs a home spec before it can write a settled shape.
5. **Domain discovery has no door:** 14 independent `readdirSync(domains...)` loops in 8 files, five of them in `skill-wrappers.mjs` alone.

## 1. Component inventory

Ownership today: skill body belongs to the owning component or domain; rendering, wrappers, mirrors and stale checks belong to Packaging-Distribution ([skill-package-distribution contract](../../docs/platform/packaging-distribution/contracts/skill-package-distribution.md), section 2); domains are "Domain Components And Extension Layer" in [component-boundary.md](../../docs/platform/component-boundary.md) row 77 with [domainization](../../docs/platform/domainization/architecture/domainization.md). No document names T8's components. The grouping below is this baseline's, not a settled shape (Part A produces that).

| Component (grouping) | Decides | Files (lines) | Tests / guards |
|---|---|---|---|
| **Source skills** | what a skill says; one canonical dir per skill name | `core/skills` 39 files 5 675 (largest: `distill` 7 files 1 276, `instruction-audit` 4 files 759, `fgos-cook` 4 files 421, `fgos-fanout` 415, `fgos-advise` 317, `fgos-routing` 239); `domains/coding/skills` 27 files 3 591 (largest: `fgos-coding-driving` 655, `-planning` 624, `-exploring` 591, `-validating` 546, `-implement` 510); shared fragments: `core/skills/_shared` 12 files 1 360, `domains/coding/skills/_shared` 1 file 110 | `test/skills/*` (4 files), the skill-text tests inside `skill-wrappers.test.mjs` |
| **Render pipeline** | assemble source into `.agents/skills`, wrap into `.claude/skills`, mirror dev skills into the plugin, regenerate instruction projections | `scripts/build-skill-wrappers.mjs` 42 (entry), `src/setup/skill-wrappers.mjs` 1 362; one caller outside the script: `fgos setup` (`bin/fgos.mjs:4032,4100`, a command the registry marks deprecated) through `materializeSkillsIntoProject` | `test/setup/skill-wrappers.test.mjs` 3 730 lines, 128 tests |
| **Render surfaces (committed)** | what hosts read | `.agents/skills` 66 files 9 329 (source plus one generated header line per Markdown file); `.claude/skills` generated part 49 files 3 744 (21 wrappers 690 lines plus 28 copied reference files 3 054); `plugins/fgOS/skills` 95 files, of which 55 are mirrors 7 286 and 39 are hand-authored commands 3 710; `plugins/fgOS/.claude-plugin/plugin.json` | `test/skills/fgos-mirror.test.mjs` 13 tests; the drift guard in `skill-wrappers.test.mjs` |
| **Domain data and doctrine** | stage vocabulary, step graph, role graph, task specs, slice kinds, domain doctrine | `domains/coding`: `registry.yaml` 98, `compiled.json` 598, `slice-kinds.yaml` 109, `workflows/feature.yaml` 176, `task-specs` 13 files 419, `instructions` 2 files 33, `harness/enrich-and-validate-contract.mjs` 163, `AGENTS.md` 89; `domains/marketing`: 10 files 191 (4 agents, 3 templates, 1 workflow, `AGENTS.md` 25) | `test/state/domain-registry*.test.mjs`, `domain-fields`, `knowledge-registry`, `test/runner/enrich-and-validate-contract.test.mjs` |
| **Domain registry (Node)** | load `compiled.json`, answer step, skill, operations, role graph, status questions | `src/state/domain-registry.mjs` 292 (19 exports), `scripts/build-domain-registry.mjs` 79; **28 importers** (Work and state code) | `domain-registry.test.mjs` 31 tests, `domain-registry-compiled.test.mjs` 7 |
| **Guards over the layer's text** | decision-citation drift over docs, specs and skill text | `scripts/check-decision-citation-drift.mjs` 511 plus `.baseline.json` 811; `scripts/project-agents.mjs` 258 (agent personas into `.claude/agents`) | `test/scripts/check-decision-citation-drift.test.mjs` 32 tests, `project-agents.test.mjs` 14 |
| **Adjacent, council to place** | instruction composition and projection (`core/instructions` 4 files 114 + `src/setup/instruction-{registry,composition,projections}.mjs` 1 641 lines, 3 test files, 73 tests); persona agents (`core/agents` 10 files 206, `src/runner/agent-{roster,definitions,listing}.mjs` 519); prompt templates (`core/prompt-templates` 17 files 591, `operation-prompt-templates.mjs` 568); `core/task-specs` 7 files 201, `core/workflows` 7 files 553 | not counted in the totals above except the instruction trio's tests in section 3 | the instruction projection guard `test/setup/instruction-projections.test.mjs` is part of the build:skills output |

Decision citations used here, glossed: RUL104 (decision 0062, "better, not bigger": every change makes what exists better, adds no feature, layer or mechanism; ideas go to a separate list).

## 2. Contracts and seams

### 2.1 How a skill becomes a surface

```
core/skills/<s>/ , domains/<d>/skills/<s>/        (canonical, one dir per name; _shared flattened)
  | assembleSkills (adds one "Generated by fgOS skill assembly" line to every .md, prunes only its own orphans)
  v
.agents/skills/<s>/                               (Codex/OpenAI and portable; committed; also shipped in npm "files")
  | generateAllSkillWrappers: SKILL.md becomes a 16-20 line wrapper, every other file is copied beside it
  v
.claude/skills/<s>/                               (Claude Code; committed except ak-*)
  | mirrorDevSkillsIntoPlugin (fgos-*, distill, instruction-audit, _shared; byte copy)
  v
plugins/fgOS/skills/<s>/                          (plugin-only consumers; 35 hand-authored commands live beside the mirrors)
```

then `materializeInstructionProjection` (AGENTS.md managed block, `.fgos/instructions/effective/repo.json`, projection ledger). `generateAllSkillWrappers` walks every directory of `.agents/skills` that has a `SKILL.md`; there is no "owned names" set (K4).

`.gitignore` tracks only `fgos-*`, `distill`, `instruction-audit` and `_shared` under `.agents/skills` and `.claude/skills` (plus `ui-spec` for Claude); everything else, `ak-*` included, is ignored.

### 2.2 Who reads the surfaces

| Reader | Reads | Where |
|---|---|---|
| Claude Code | `.claude/skills`, `plugins/fgOS` (marketplace) | host; doctor `claude-plugin-marketplace` (+fix) |
| Codex and other agent CLIs | `.agents/skills`, `.omp/skills`, `.pi/skills`, `.grok/skills` | `CLI_SKILL_DIRS` in `src/setup/model-pool-checks.mjs:46` |
| Executor binding | `executors.<id>.supports.skills` (all 6 agent executors declare `ak:cook`); `bind()` binds a Unit that names skills only to executors whose list covers them | `src/runner/execution/bind.mjs:143`, `unit.mjs:112`; Rust: `packages/seat-binding` `required_skills`, `packages/config` schema |
| Doctor `executor-skills-installed` | `<root>/<cli dir>/<skill with ':' as '-'>/SKILL.md` **in the main checkout**; a worktree is covered only by the copy step | `model-pool-checks.mjs:56-84`, registered `registrations.mjs:1311`; T5 row |
| Worker prompt | `.claude/skills/<skillForStep>/SKILL.md` as the pointer in the brief | `src/runner/work-compat.mjs:160` |
| Release payload | `.agents/`, `core/`, `domains/` as "immutable workshop source"; npm `files` lists `.agents/skills` as a whole directory | `scripts/build-rust-distribution.mjs:100`; Git-ignored files are excluded when Git is present, and included when it is not (`test/distribution/source-payload.test.mjs`) |
| Domain data | `compiled.json` read at import by `domain-registry.mjs`; task specs by `operation-choice.mjs`, `assignment.mjs`, `runner/paths.mjs`; workflows by `src/workflow/loader.mjs`; slice kinds by `propose-classify.mjs`; agents by `agent-roster.mjs`, `agent-listing.mjs`; instructions by `instruction-registry.mjs` | see section 7 K10 |
| Git one-door census | hashes 133 skill files (`.agents/skills` 66, `core/skills` 39, `domains/coding` 28) in `packages/git/contracts/mutation-census.v1.json` | every skill text edit changes two hashes in a Git-owned contract, rewritten by `npm test` |
| Domain doctrine | `domains/coding/AGENTS.md` read by `fgos-routing` prose; no Node reader found by grep | skill text |

### 2.3 Drift guards

| Guard | Judges | Reads | State here |
|---|---|---|---|
| `skill-wrappers.test.mjs` "assembleSkills output matches the committed .agents/skills byte-for-byte" | source renders to exactly the committed set | **whole directory** `.agents/skills` | **red** (K1) |
| `check-decision-citation-drift.test.mjs` "CLI run against the real repo root" | no new decision-citation finding vs the checked-in baseline | `WIDE_SWEEP_ROOTS` = `docs, src, plugins, core/skills, domains, .agents/skills`, whole directories | **red** (K1) |
| `fgos-mirror.test.mjs` (13 tests) | `.claude/skills` and plugin mirror are byte-derived from `.agents/skills`; `user-invocable: false` on dev skills | only names starting `fgos-`, `distill`, `_shared` | green; immune to `ak-*` |
| `domain-registry-compiled.test.mjs` + doctor `domain-registry-compiled` | `compiled.json` equals its YAML | `domains/*` | green |
| `instruction-projections.test.mjs` "tracked instruction projections are current" | AGENTS.md block and effective set are current | tracked files; ledger only if it exists | green |
| `source-payload.test.mjs` | payload excludes ignored output | Git port | green |
| Doctor `plugin-dev-skills-packaged` | removed 2026-11-06 (`ff6947580`), its byte-drift proof is `fgos-mirror`; `instruction-projections-stale` removed 2026-11-08 (`35d7745d1`) into the projection test | | |

Real-tree guards over the layer: 17 tests (13 + 1 + 1 + 1 + 1). Two of them read whole skill directories and break; the rest already filter by name or by Git.

### 2.4 Specs and docs that own the layer

| Doc | Status line | Gap |
|---|---|---|
| `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` (212 lines) | Draft, Implementation: Partial, last reviewed 2026-09-18 | still describes the Gemini target, trigger vocabulary and `fgos-code-panel` ownership move as design; section 9 doctor obligations name rows that were removed |
| `docs/platform/domainization/architecture/domainization.md` (305) | "Source snapshot retained; current implementation truth not certified" | no component spec |
| `docs/platform/claude-plugin/spec.md` (191) | "Carriage only" | implementation truth not certified (the reading map's count of 35 commands in 55 skill dirs matches the tree) |
| `component-boundary.md` row 77 | one row for the whole "Domain Components And Extension Layer" | no budget, no size target, no Node owner list |

## 3. Tests (measured)

Method: each file alone through `node scripts/run-tests.mjs <file>` with `HERDR*` and `CLAUDE*` unset, in a fresh linked worktree (so the runner staged its own addon), one file at a time, sequential. First pass at load 6 to 40, repeat at load 3.4 to 4.6; the repeat is quoted. Runner startup adds about 0.8 s of wall to every file.

Test set (22 files): `test/setup/skill-wrappers`, `test/skills/` (4), `test/state/{domain-registry,domain-registry-compiled,domain-fields,knowledge-registry}`, `test/runner/{enrich-and-validate-contract,agent-listing}`, `test/scripts/{check-decision-citation-drift,project-agents}`, `test/setup/{instruction-registry,instruction-composition,instruction-projections,capability-catalog-doctrine}`, `test/docs/{run-doors-doctrine,agents-doctrine-anchors}`, `test/plugins/terminal-skill-attach`, `test/distribution/source-payload`, `test/cli/fgos-stage`. By grep another 30 test files name `core/skills`, `domains/` or the render roots (architecture, dispatch, workflow, one-door and others); they are not in the loop.

| File | Tests | Test time | Lines |
|---|---|---|---|
| `cli/fgos-stage.test.mjs` | 8 | 12.5 s | 303 |
| `state/knowledge-registry.test.mjs` | 31 | 6.7 s | 888 |
| `skills/knowledge-canary.test.mjs` | 2 | 4.9 s | 55 |
| `state/domain-registry-compiled.test.mjs` | 7 | 3.5 s | 106 |
| `skills/fgos-coding-knowledge.test.mjs` | 1 | 2.5 s | 57 |
| `setup/instruction-registry.test.mjs` | 41 | 1.7 s | 1 002 |
| `plugins/terminal-skill-attach.test.mjs` | 9 | 1.7 s | 198 |
| `setup/skill-wrappers.test.mjs` | 128 (1 fail) | 0.6 s | 3 730 |
| the other 14 files | 188 (1 fail) | 0.2 to 1.1 s each | 3 137 |

Totals: **418 tests, 416 pass, 2 fail, 39.6 s test time, 57.8 s wall, 9 476 test lines.** At load 28 to 41 the same loop gave 98.8 s test time (`knowledge-registry` 37.7 s, `fgos-stage` 28.4 s), so the heavy ones are load-sensitive process launches, not skill checks. `fgos-stage.test.mjs` and `knowledge-registry.test.mjs` were selected by name or text; they probably belong to Work (T7) and the council should confirm. The skill-render tests themselves are fast: `skill-wrappers.test.mjs` runs 128 tests in 0.6 s.

The 2 failures are the two reds of section 4. No `ERROR: test suite leaked` line appeared in either pass (0 of 44 runs).

### 3.1 Shape of `skill-wrappers.test.mjs` (3 730 lines, 128 tests)

| Lines | Tests | Content |
|---|---|---|
| 1 to 509 | 30 | wrappers, assembly, materialize, drift guard, prune; real behaviour of the render pipeline |
| 510 to 1 514 | 41 | source-of-truth rules, deprecated stubs, **Gemini package generator (19 tests, about 1 070 test lines)**, path-alias hardening, adapter classification |
| 1 515 to 3 730 | **57** | "reference models": test-local functions (`classifyModeRequest`, `hasLiveCoordinationSession`, a discriminator, `composeLegacyPlanTestOverlay`, proof-staleness rules) that mirror the prose of `fgos-code-panel` and `fgos-code-change`. The file says of them "no runtime production code calls this". Three skills they model (`fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop`) were deleted in `6527596eb` (2026-10-01); 9 tests are neutered with an early `return; // retired ...`. 2 216 lines, 59 percent of the file |

### 3.2 Behaviours proven more than once (labels, not verdicts)

| Behaviour | Proofs | Note |
|---|---|---|
| `.claude/skills` wrapper is exactly what the generator makes | `fgos-mirror` (tests 78 to 105) and the wrapper cases of `skill-wrappers.test.mjs` | the first reads the committed tree, the second a temp dir |
| Source renders to `.agents/skills` | drift guard (committed tree) and `assembleSkills` cases (temp dir) | fine as owning proof plus one tree proof |
| Compiled domain matches YAML | `domain-registry-compiled` real-tree test, the doctor row, `build-domain-registry --check` | three readers of one rule |
| Projection current | `instruction-projections` real-tree test and the (removed) doctor row | the doctor side was already cut |

## 4. The two red tests in a fresh worktree

Both are red on clean `origin/main` in any worktree made by `fgos worktree create`, and the main checkout carries the same 104 `ak-*` dirs in `.agents/skills` (`ls`; the two tests were not run there). Reproduced here in a fresh worktree: `skill-wrappers.test.mjs` 127 of 128, `check-decision-citation-drift.test.mjs` 31 of 32.

**Mechanism, step by step (all verified):**

1. `.fgos/config.yaml` (tracked, shows as `project:config.yaml` line 230 in `fgos config show`) carries `worktreeSetup.commands[0]`: for each of `.claude/skills .agents/skills .omp/skills .pi/skills .grok/skills` that exists in the main checkout, `cp -R` every `ak-*` dir into the new worktree. Added by `9fa8a08f0` (2026-10-20, "declare ak:cook on claude, copy ak skills into worktrees, add skills doctor check"), moved to YAML by `6c041c302`. Reason: executors declare `supports.skills: ["ak:cook"]`, workers run in worktrees, and the worktree has only tracked files.
2. `fgos worktree create` runs `provisionWorktree` (`src/runner/worktree.mjs:223`), which runs `worktreeSetup.commands` with `FGOS_REPO_ROOT` set to the main checkout and records what it placed. The provisioning record of this run lists **10 688 paths**; the ak dirs landed 1 to 2 s after checkout. Roughly 18 to 19 MB per skill root in the main checkout, so about 92 MB per worktree (estimate from `du`, not measured per worktree); `forgent-worktrees` is 41 dirs and 28 GB. `fgos worktree create` took 5.1 s and `remove` 2.4 s at load 20.
3. `.gitignore` ignores every `ak-*` dir, so `git status` is clean and no commit ever shows them.
4. Until 2026-11-08 the guards were green with the copy step in place, so `.agents/skills` held no `ak-*` before that date (inferred from the green runs, not from the old install). The AgentKit v3 project reinstall (owner decision 74, 2026-11-08 21:00) wrote 104 `ak-*` skills into `.agents/skills` (dir mtime 22:28, 1 813 files, 19 MB).
5. **Guard 1** (`skill-wrappers.test.mjs:318`) lists `.agents/skills` recursively and requires set equality with what `assembleSkills` renders into a temp dir; the diff is 1 713 extra files, all `ak-*`.
6. **Guard 2** (`check-decision-citation-drift.mjs:317`, `WIDE_SWEEP_ROOTS` includes `.agents/skills`) reads every Markdown file under the directory; 39 findings, all in `.agents/skills/ak-*` vendor text that uses "D1", "D7" as ordinary words: `ak-devops` 20, `ak-goal-warmup` 10, `ak-cti-expert` 6, `ak-deploy` 1, `ak-page-builder` 1, `ak-remotion` 1.
7. The other guards (`fgos-mirror`, plugin mirror) are immune because they filter by name.

**Options, ranked:**

| # | Option | Fixes | Cost / risk | Verdict |
|---|---|---|---|---|
| 1 | **Guard 2: drop `.agents/skills` from `WIDE_SWEEP_ROOTS`.** It is a byte render of `core/skills` and `domains`, both already swept; the comment justifying it says `.agents/skills` is "the canonical dev-skill source", which stopped being true when `core/skills` became canonical. The baseline file holds 5 entries that are duplicates of core findings | guard 2 in every checkout, main included | net negative lines; the claim "never a missed detection" holds because the mirror is byte-tested | **do** |
| 2 | **Guard 1: judge the committed set, not the directory.** Compare the render against `git ls-files .agents/skills` through the existing Git port (`scripts/lib/git-ports.mjs inspectRepo`, already used by `listLegacyNodeSourceFiles`) and assert content for those files only | guard 1 everywhere; same rule as `source-payload` and `fgos-mirror` (judge what fgOS owns) | the test needs a Git checkout (it already runs in one); about +15 lines | **do** |
| 3 | Name filter `ak-*` in both guards | both | hard-codes a vendor prefix in a third and fourth place (`.gitignore`, `worktreeSetup`, then the guards); breaks on the next vendor (`omp`, `pi` kits) | reject |
| 4 | Stop copying `ak-*` into worktrees | worktrees only; main stays red; breaks the `ak:cook` worker contract | | reject |
| 5 | Stop AgentKit writing into `.agents/skills` | all | outside fgOS's control (backlog row `p-7eb9e65b`) | not available |

Options 1 and 2 together need no new mechanism and delete one root. They also make section 7 K4 matter less, but do not replace it.

## 5. Routes and verbs

T8 owns no fgos verb. The doors that touch it: `fgos setup` (deprecated; copies skills into a project through `materializeSkillsIntoProject`), `fgos doctor` (rows below), `npm run build:skills`, `npm run build:domains`, and the plugin commands in `plugins/fgOS/skills` (35 hand-authored `SKILL.md` files that shell out to `fgos` verbs; the host surface, T9 side).

| Command | Result | Time |
|---|---|---|
| `npm run build:skills` (plain checkout, 3 runs) | **exit 1**, `git-addon-unavailable` from the instruction-projection step (YAML parse goes through the native door); 22 skills assembled, 125 wrappers and 20 plugin files written before it dies | 0.34 to 0.40 s, load 5 |
| same script with the addon staged first (scratch wrapper calling `ensureAddonForScript`, then the unchanged script; 3 runs) | exit 0, tree clean | 1.35 s first, 0.98 and 0.99 s warm, load 11 |
| `npm run build:domains` | exit 0, `compiled.json` unchanged | 1.20 s (no-op cargo build included) |
| `fgos worktree create` / `remove` (with the ak copy) | | 5.1 s / 2.4 s at load 20 |

`build-domain-registry.mjs` and `project-agents.mjs` call `ensureAddonForScript()`; `build-skill-wrappers.mjs` does not.

## 6. Doctor rows and setup steps

Activated release, main checkout, `fgos doctor --json`: 111 rows, 2 fail (`tool-registry-configured` degraded, `work-step-vocabulary` for open item `tsk-5db`; neither is Skill/Domain). Per-row time is not in the output.

| Row | Status | Checks | Owner today |
|---|---|---|---|
| `executor-skills-installed` | pass, 7 declared skills installed | every `supports.skills` entry exists in each invoked CLI's skill dir **of the main checkout** | T5 row (doctor plan: "T5 handles") |
| `domain-registry-compiled` | pass, 1 domain | `compiled.json` parses and matches YAML | shared with Work (T6 listed it) |
| `domain-workflow-operations-coverage` | pass | every step operation resolves to task specs, roles, skills, role-graph edges | T6 row |
| `agent-claims-resolve`, `agent-type-names-unique` | pass | task-spec skill claims resolve; persona names unique per tier | agents, adjacent |
| `operation-prompt-templates-valid` | pass, 17 templates | prompt templates parse | T5 side, adjacent |
| `claude-plugin-marketplace` (+fix) | pass | plugin marketplace registered and enabled | plugin, T9/Packaging |

Removed already, so not to be re-added: `plugin-dev-skills-packaged` (2026-11-06) and `instruction-projections-stale` (2026-11-08). Setup steps: no skill-only config default; the one skill-related config value is the repo's own `worktreeSetup.commands[0]`.

## 7. Known problems, noise, duplicate and dead paths

| # | Item | Evidence | One line |
|---|---|---|---|
| K1 | Two red guards in any worktree and in main | section 4 | judge what fgOS owns, not the directory |
| K2 | `build:skills` exits 1 in a checkout, after writing | `build-skill-wrappers.mjs` has no `ensureAddonForScript` (siblings do); section 5 | the script is unusable from a checkout as written |
| K3 | A successful `build:skills` in a worktree makes the worktree unremovable | it writes `.fgos/instructions/effective/repo.json`, a tracked path with the skip-worktree flag (13 `.fgos` paths carry it in every new worktree); `fgos worktree remove --discard-ignored` then refuses with `worktree-worker-state-preserved` (`packages/git/rust/src/worktree.rs:368-374`) although the file is byte-identical to HEAD. I did not clear the flag or delete the file; the scratch worktree `harden-t8-measure` is still there | writer and guard disagree; one of them has to change |
| K4 | `generateAllSkillWrappers` treats every directory of `.agents/skills` as fgOS's | after a staged run, 104 of 105 `.claude/skills/ak-*/SKILL.md` differ from the AgentKit originals (16-line fgOS wrapper, "generated thin wrapper (tsk-1qi) -- do not edit", against 102 lines); only `.claude/skills/ak-*` is ignored so git never shows it | the assemble step prunes only names it owns, the wrapper step does not; same defect class as K1 |
| K5 | Dead Gemini package path | 11 of the 15 exports of `skill-wrappers.mjs` have no caller outside the file and its tests. `generateGeminiSkillPackage` (129 lines, 1038 to 1166), `SKILL_ADAPTER_TARGETS`, `isGeneratedAdapterTarget` (the only `isGeneratedAdapterTarget` hit inside the file is a comment) and `isCanonicalSkillSource` are used by tests only; the adapter classification block is lines 394 to 570 (177 lines). `deriveSkillIntentId` and `mapSkillIntentToHostTriggers` (571 to 633) are called only from the duplicate-trigger checks inside `discoverCanonicalSkills`, which validate triggers for hosts nothing emits. About 300 to 400 lines in all. No `.gemini` dir exists. Added 2026-09-14 in 11 commits (`5769cb9e7` to `dcb97a9aa`); the contract calls it "partial (prototype generator only; release/doctor wiring planned)". `createProjectSkillGuard` is exported with 0 test files naming it and 2 internal uses | 4 of the 15 exports have a production caller |
| K6 | Dead test sections | section 3.1: 57 tests / 2 216 lines of reference models for skills deleted 2026-10-01; 9 early-`return` tests; helpers named `CODE_CHANGE_CAPABILITY_CATALOG` and similar | tests of a mechanism that was deleted; overlaps TEST's "mirrors / contract-prose" labels |
| K7 | Dead shared fragments | `core/skills/_shared/catchup-self-recovery.md` 84, `domains/coding/skills/_shared/coding-cell-policy.md` 110, `core/skills/_shared/private-cell-worktree.md` 90: no skill in `core/` or `domains/` references them (references only from archive plans, docs, census hashes and the K6 tests; `private-cell-worktree` is referenced by `coding-cell-policy` only). 284 source lines, times 3 copies (source, `.agents`, plugin `_shared` mirror) plus census hashes | vocabulary "cell" and "plan-loop" left with the 2026-10-01 retirement |
| K8 | Three stale statements | backlog row `p-wheblpunzi` ("`fgos setup` overwrites a newer tracked skill", owner: HARDEN owns it) is `proposed`, but `16743ab25` (2026-10-25) landed the guard (`createProjectSkillGuard`, 2 tests) and `8106ce8e4` fixed the symlinked-path case; the comment above `WIDE_SWEEP_ROOTS` still calls `.agents/skills` canonical; the distribution contract's section 9 names doctor rows that no longer exist | close or rewrite |
| K9 | Stale doctrine named by T6 | `core/skills/_shared/coordination-driver.md` (114 lines) is still read by `fgos-advise`, `fgos-cook`, `fgos-cook/references/case-and-doors.md`; T6 baseline D10 says the spec wants it rewritten to the Shape C rule | content is T6's call, file is T8's |
| K10 | No door for "list the domains" | 14 `readdirSync(domains...)` loops in 8 files: `skill-wrappers.mjs` 5 (lines 426, 454, 675, 893, 931), `registrations.mjs` 2, `operation-prompt-templates.mjs` 2, and one each in `instruction-registry`, `domain-registry`, `workflow/loader`, `agent-roster`, `agent-definitions` | design principle 1 (one door); several of those files belong to T5, T6 or Work |
| K11 | Skill text exists four times in git | 9 266 source lines become 20 359 generated lines in 170 files; 28 of the `.claude/skills` files are full copies of reference files, not pointers; census hashes 133 of them; every text edit touches two hashes in Git's contract and re-renders three trees | the cost of every skill edit, and the guards it needs |
| K12 | Worktree copy cost | section 4 step 2 | about 92 MB and 10 688 files per worktree for skills no test of that worktree reads |
| K13 | Open rows touching the layer | `p-7eb9e65b` (fgOS and AgentKit overwrite each other's registrations; K1 and K4 are two more instances), `p-4b7dd2ed` (exploring skill vs `.gitignore`; the row text says fixed, verify before keeping it open), `p-58f890f3` (Case A guidance for children in a worktree), `p-odyt6s44em` (skill text and tests still name a retired mechanism; `rg mutatingMinRigor` still matches 2 test files, `let the config rule apply` no longer appears), `wf-coding-cutover` (domain `feature.yaml` lifecycle) | |

Prior art, per the AGENTS.md rule: `.agents/skills` was canonical from `ab7a5fe8d` (2026-08-13), then `core/skills` and `domains/*/skills` became canonical with assembly in `dece88760` (2026-08-20), which is why the guards' comments are stale. `fgos-code-change`, `fgos-code-panel`, `fgos-plan-loop` were deleted in `6527596eb` (2026-10-01). `generateGeminiSkillPackage` and `materializeSkillsIntoProject` were added by the packaging P2 track (`5769cb9e7`, 2026-09-14). `plugin-dev-skills-packaged` was removed in `ff6947580`, `instruction-projections-stale` in `35d7745d1`. The `ak-*` copy step is `9fa8a08f0`. Nothing found that a candidate below would re-create.

## 8. Dependencies

**Below (T5, T6):**
- T5: `executor-skills-installed` and `CLI_SKILL_DIRS` (`src/setup/model-pool-checks.mjs`, a T5 row); `supports.skills` in the executor config, `bind.mjs`, `unit.mjs`, `assignment.mjs`; seat-binding `required_skills` (Rust); `operation-prompt-templates.mjs`; `worktreeSetup` and `provisionWorktree` (`src/runner/worktree.mjs`, T5/Work shared); the one-door census (Git).
- T6: `domains/*/workflows/*.yaml` and `slice-kinds.yaml` live in T8's tree but are read, validated and executed by T6 (`loader.mjs`, `definition.mjs`, `propose-classify.mjs`); `fgos-cook` and `_shared/coordination-driver.md` are T6 doctrine in `core/skills`; doctor rows `domain-workflow-operations-coverage`, `workflow-capabilities-configured`.
- T0 to T3: the native YAML door (`parseYaml`) and the Git port (`inspectRepo`) that K2 and the guard fix would use.

**Above (T9):** `bin/fgos.mjs` `setup` case (`:4032`, `:4100`) and `command-registry.mjs` (slice kinds, setup deprecation); `plugins/fgOS` commands and `.claude-plugin`; `fgctl` install paths; the packaging spec's skill section. `apps/fgos-gateway` does not read skills.

**WORK-owned files (T7 is WORK's; do not edit without WORK):** `src/state/domain-registry.mjs` (292 lines, 28 importers: `store`, `work`, `step-fsm`, `replay`, `frontier`, `handoff`, `plan-pool`, `discover-pool`, `impact`, `graph-*`, `cleanup-harness`), `domains/coding/compiled.json` (the form Work reads), `domains/coding/workflows/feature.yaml` `steps:` list (the Work step FSM; `wf-coding-cutover` deletes its lifecycle part), `src/runner/{loop,claim-port,work-compat,work-dispatch,operation-choice,prompt-templates,fanout-batch}.mjs`, `src/intake/*`, `src/verbs/state/{read,step}.mjs`, `test/state/domain-registry*.test.mjs`, `test/cli/fgos-stage.test.mjs`. `domains/coding/skills/fgos-coding-*` are Work stage skills (`skillForStep` maps a Work step to one) and their text is Work-adjacent. Ownership taken from the T6 baseline and the plan; confirm with WORK before Part A.

**Shared files likely to collide:** `packages/git/contracts/mutation-census.v1.json` (133 skill hashes), `test/suite-baseline.json`, `src/setup/registrations.mjs` (rows), `bin/fgos.mjs`, `docs/platform/component-boundary.md`, `docs/platform/packaging-distribution/*` (DOC), `.fgos/config.yaml` (the ak copy line; the config component and the owner machine), `CHANGELOG.md`.

## 9. Candidate hardening targets (RUL104: better, not bigger)

Ranked by value over risk. Each says what gets deleted or simplified; Δ lines are rough counts from section 7, labelled estimates.

| # | Target | Better how | Δ estimate | Notes |
|---|---|---|---|---|
| H1 | Fix the two reds with options 1 and 2 of section 4 | guards judge what fgOS owns; one fewer sweep root | Node about -10, tests about +10 | do first; unblocks every worktree and the main checkout |
| H2 | `build:skills`: stage the addon like its siblings; make the wrapper step touch only names `assembleSkills` produced (the set `discoverCanonicalSkills` already returns); settle K3 (the writer of a skip-worktree path versus the removal guard; the guard may be right, then the projection step must not write there from a worktree) | the script works from a checkout, stops rewriting vendor files, stops stranding worktrees | Node about +10 | K3's owner is a Git-area decision (OPC reviews Git diffs); council decides which side moves |
| H3 | Retire the 57 reference-model tests and 9 neutered tests of K6 and the 3 dead fragments of K7 | removes tests and prose of deleted skills | tests about -2 200, skill text about -284 source (-850 with copies) | each retired test names its owner or "behaviour removed"; coordinate with TEST (labels) and regenerate the census in the same change |
| H4 | Remove the Gemini generator, adapter-target classifier and the trigger mapping that only feeds it (K5) and their 19+ tests, or the owner keeps it as a stated product intent | smaller module, one fewer undocumented target | Node about -300 to -400, tests about -1 070 | **owner decision**: the contract lists Gemini as planned; reversing a planned target is a user call |
| H5 | One domain-discovery door (K10), at the lowest layer that needs it | one rule for "which domains exist", fewer readdir loops | Node about -60 net | touches T5, T6 and Work files; do the T8-owned five in `skill-wrappers.mjs` and `instruction-registry.mjs` first, offer the rest as items |
| H6 | Give the layer a home spec and a budget: one `spec.md` for skill and domain (source, render, readers, guards, doctor rows), fix K8 and the contract's section 9, settle where instruction projection and personas sit | Part A has something to write into; L5 question 2 | docs only | needs DOC told before it merges |
| H7 | Decide whether `.claude/skills` keeps copying reference files (K11) or the wrapper's own redirect is enough | up to 3 054 fewer generated lines and one guard class | Node about -20, generated -3 054 | not verified that Claude resolves the source file's relative references through the redirect; test before choosing |
| H8 | Shrink the worktree copy (K12): copy only the skills an executor declares (`ak-cook`), not all 104 | 92 MB to a few MB per worktree | config only | project config and the config component; lowest risk after H1 |

Not recommended now: moving any of this to Rust (no decision logic of weight lives here; the one real decision, "which names does fgOS own", is a set the render step already computes); rewriting `domain-registry.mjs` (WORK's).

**Feature ideas, kept apart (owner picks):**
- A read-only `fgos skills check` verb that is the single proof of "committed surfaces equal a render of the source", used by the guard test and doctor instead of three readers.
- A doctor row for foreign skills in fgOS-owned roots (`ak-*` collisions), naming the row it would replace.
- A skill lint that rejects references to retired skill names across all source skills, replacing the per-skill prose tests.
- Reflink or hardlink for worktree provisioning.

## 10. Things to know

- **Nothing was dispatched.** No workflow, agent, seat, pane or daemon. Tests ran their own fakes under the runner.
- **Side effects, all untracked or ignored:** two linked worktrees under `/home/vantt/projects/forgent-worktrees/` (`harden-t8-baseline` for this report, `harden-t8-measure` for runs), a third (`harden-t8-timing`) that was created and removed cleanly, scratch files in the session scratchpad. Running `build:skills` and the addon staging in `harden-t8-measure` created `.fgos/installation/`, `.fgos/runtime/` and `target/`. **`harden-t8-measure` could not be removed** (K3); it is clean against HEAD and holds no work. Nothing was hand-deleted. Main checkout untouched; `fgos doctor --json` on the activated release wrote nothing tracked.
- **Not measured:** per-doctor-row time; the 30 outside test files; the full suite; the two reds in the main checkout itself; whether the old (pre-v3) AgentKit install put anything into `.agents/skills`; the real cost of `provisionWorktree` apart from the ak copy; `fgos setup` end to end; Rust (no tests own the layer).
- **Test-selection caveat:** the 22 files were chosen by name and by text; a skill or domain test under another name could be missing. `fgos-stage` and `knowledge-registry` are probably Work's.
- The timing of the middle pass is inflated by load 28 to 41 and is quoted only to show sensitivity.

## Unresolved questions

1. K3: should `fgos worktree remove` refuse a skip-worktree tracked path that is byte-identical to HEAD, or should the projection step avoid writing it from a worktree? Which side is the Git owner's choice, and who removes `harden-t8-measure`?
2. H4: is the Gemini target a product intent to keep (contract says "planned"), or may it go?
3. Where do instruction projection (1 641 lines) and personas (519 lines) sit: T8, Packaging-Distribution, or Work/T5?
4. Are `fgos-stage.test.mjs` and `knowledge-registry.test.mjs` Work's tests, as the names suggest?
5. Does Claude Code resolve a skill's relative reference files through the thin wrapper's redirect (H7), or is the copy load-bearing?
6. Should the 28 `.claude/skills` reference-file copies and the plugin mirror stay committed, or be built into the release only? That is a Packaging-Distribution decision with a release-channel cost.
7. Do the 5 baseline entries under `.agents/skills` in `check-decision-citation-drift.baseline.json` disappear with H1, and is any of them a finding that exists only there?
