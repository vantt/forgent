# HARDEN T8 arbitration: Skill/Domain (skills, render surfaces, domain doctrine and registry)

- **Big lead:** lead:HARDEN, 2026-11-09 10:05 (Asia/Saigon), fg-server2, `origin/main` `b009e5b4f`. Read-only arbitration; this file is the only one written. Every claim on which two seats or a seat and the baseline disagree was re-checked on `b009e5b4f` (file:line or command named in the row).
- **Inputs:** [baseline](research-261109-0654-harden-t8-baseline.md) (measured at `b7c7c372c`); seats [correctness](council-261109-0844-harden-t8-seat-correctness.md), [red-team](council-261109-0844-harden-t8-seat-redteam.md), [speed](council-261109-0844-harden-t8-seat-speed.md), [simplicity](council-261109-0844-harden-t8-seat-simplicity.md); format of the [T6 arbitration](council-261108-0914-harden-t6-arbitration.md); [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) per-layer loop step 3, size rule, owner decisions 74, 75, 76; [CFG confinement review](review-261109-0928-harden-cfg-confinement-project-settable.md) section 2 (`ownWorktree`).
- **Citations (glossed once):** RUL104 (D-ADR0062, "better, not bigger": hardening makes what exists better, adds no feature, layer or mechanism; a contract change moves every caller and deletes the old path; ideas go to a separate list for the owner); RUL11 (D-ADR0054, "tùm lum, not heavy": gather the mess inside the current scope until it is gone, mess outside becomes its own item, building a new tool to gather is a decision question); L10 (platform law: extend through the door, never beside it); design principles 1 (one door), 2 (bottom-up layering), 6 (KISS/DRY, no file you do not need), 7 (one source of truth), 8 (one owning proof per behaviour, at the lowest layer that can observe it); D-ADR0035 mission boundary (fgOS exists for other projects first, so a defect that hits a project using fgOS outranks one that hits only this repo).
- **Status:** arbitration done; owner ask 1 in section 4 has **7 forks** plus the Part A / landing-slot confirm.

## Already landed or decided since the baseline

| Item | State | Evidence |
|---|---|---|
| Baseline K1 / H1: both drift guards red in every worktree | **Done** on main by `27b2c580c` (2026-11-09 07:20): `skill-wrappers.test.mjs` drift guard and `loadSourceFiles` of the citation check judge `ownedFileSet` (`scripts/lib/git-ports.mjs`). Speed seat ran all 22 files green in a fresh worktree with 104 `ak-*` present (419 tests, 0 fail) | `git log origin/main` |
| Residual of K1 (correctness F5b, simplicity B6) | **Open:** `collectWideSourceFiles` (`scripts/check-decision-citation-drift.mjs:340`) still sweeps `WIDE_SWEEP_ROOTS` with `.agents/skills` (`:321`) and no owned filter; it serves `fgos decision --relation` (`bin/fgos.mjs:1993`, `retrospective-doors.mjs:109`). The comment above it (`:307-320`) still calls `.agents/skills` "the canonical dev-skill source" | finding T8-08 |
| Baseline K3: skip-worktree `.fgos` path written back strands a worktree | **Approved, not landed.** Branch `harden/skip-worktree-writer` `fc9675c4e` (2026-11-09 09:32, `worktree.rs` +59, `test/git/worktree.test.mjs` +31, census, spec, CHANGELOG) makes `worktree remove` accept a skip-worktree regular file whose mode and unfiltered oid equal the index; OPC MERGE 09:31 "census regen required before landing". `git branch -r --contains fc9675c4e` is empty and `origin/main` has no such commit. The guard side moved on new evidence (Git's own checkout/rebase writes the path back too), so the correctness seat's "writer side, the guard is deliberate" is overtaken; a writer-side residual stays (T8-10) | `git log origin/main..harden/skip-worktree-writer`, board line `ee9766c7d` |

## Verdict in one paragraph

The layer stays Node: no seat found decision logic of weight here, and the speed seat measured that no `fgos` verb, doctor row or hook reads skill text on a hot path (0 skill reads; the domain registry import is 5 to 9 ms). The mechanism (assemble, wrap, mirror) is three short passes and is right in outline; what is wrong is that **two of its steps do not know which names fgOS owns** (the wrapper step rewrites every `ak-*` in this repo and, through `fgos setup`, in any project that uses fgOS; the build script dies after writing), the render is **not a fixed point** (deleted files stay), its copy leaf **follows symlinks**, ownership is a **substring test**, and the layer carries a **prototype for a host nobody ships** (Gemini, about 590 lines with never a production caller), **tests of skills deleted on 2026-10-01** (63 tests, about 2 360 lines), **one script whose engine is gone** (464 lines) and a **dead skill name in machine-read contracts** that the doctor judges against itself. Every accepted fix reuses a door that exists (`discoverCanonicalSkills`, `ownedFileSet`, `ensureAddonForScript`, `replaceDurably`). Net with the recommended answers: Node about −1 040, Rust 0, tests about −2 830, generated text about −4 300 (section 6).

## 1. Part A: target shapes (for owner approval)

Rust/Node boundary for every component: **Node, no move** (all four seats; speed seat: every measured cost is bytes copied or the native YAML door's cold start, which is T0 to T3's). No new Rust. No new spec file: the settled shapes go into the two docs that already own the layer, `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` (render, surfaces, guards, provisioning) and `docs/platform/domainization/architecture/domainization.md` (domain data and doctrine), DOC told before merge (design principle 6; baseline H6 asked for a home, not necessarily a new file).

**One door per job (summary):**

| Job | The one door after | Second ways deleted |
|---|---|---|
| Which skill names fgOS owns | `discoverCanonicalSkills(root)` (plus `_shared`) | `readdirSync(.agents/skills)` in the wrapper step; `fgos-` prefix filters in `fgos-mirror.test.mjs:48`; "has `SKILL.md`" as ownership |
| Render source into the three trees | `renderSkillSurfaces(root)` in `src/setup/skill-wrappers.mjs` (the script body moved in; `materializeSkillsIntoProject` calls the same steps with the target root) | the script's own sequence; the second orphan rule for `.claude` |
| Copy a skill file | one copy leaf that `lstat`s and refuses a link by name | `copyDirRecursive`, `copyAssembledFile`, `carriesAssembledHeader` each following links |
| Is this generated file ours | one anchored stamp check (marker on the first body line) | `includes(marker)` in `isGeneratedWrapper` (`:146-153`) and `carriesAssembledHeader` (`:1198-1204`) |
| Surface equals render | drift test (`.agents`) and `fgos-mirror.test.mjs` (`.claude`, plugin), both over `ownedFileSet` × owned names | `.agents/skills` in `WIDE_SWEEP_ROOTS` |
| Which domains exist | `listDomainDirs(root)` in a `src/util` leaf | 16 `readdirSync(domains…)` loops in 10 files (arbiter count, below) |
| Does a skill name exist | the owned-name set of `discoverCanonicalSkills` | `checkAgentClaimsResolve` matching a claim against agent files only |
| Compiled domain matches YAML, no orphans | one function in `scripts/build-domain-registry.mjs` used by `--check`, the doctor row and the test | the row's own walk over `registry.yaml` dirs only |

### 1.1 Render pipeline (`src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`)

- **Authority:** which names fgOS owns in a skill root, and what a render of them looks like. Touches nothing else.
- **Contract and ports:** `renderSkillSurfaces(root)`: compute the owned set and the instruction projection first (any refusal leaves the tree untouched), then assemble, wrap, mirror, project. Per owned skill directory the target ends equal to the source (copy, then remove files the source lacks); the mirror removes `fgos-*` dirs absent from `.agents`. The script is `ensureAddonForScript()` plus one call. A link anywhere in a source or target path is refused by name.
- **Delete:** with Q1 (a) the Gemini generator and adapter classifier (`:354-633`, `:912-1166`, intent/trigger fields and loops inside `discoverCanonicalSkills`, about 590 lines; simplicity seat's count, confirmed by the arbiter's export scan: `generateGeminiSkillPackage`, `SKILL_ADAPTER_TARGETS`, `isGeneratedAdapterTarget`, `isCanonicalSkillSource`, `discoverCanonicalSkills`, `discoverSharedFragments` are named outside the module only by `test/setup/skill-wrappers.test.mjs`); the no-op options `checkDuplicates`/`checkCollisions`; the duplicated core-then-domains walks (one `skillSourceRoots`).
- **Doctor rows:** none of its own.
- **Node budget:** `skill-wrappers.mjs` ≤ 780 lines with Q1 (a) (from 1 362), ≤ 1 380 with Q1 (b); no function over 130. `build-skill-wrappers.mjs` ≤ 20 (from 42). Warm `build:skills` ≤ 1.5 s (speed seat: 1.1 to 1.3 s today with staging, of which staging 0.82 to 0.90 s).

### 1.2 Source skills and shared fragments (`core/skills`, `domains/*/skills`, `_shared`)

- **Authority:** what a skill says; one directory per name; no skill grants itself host authority (no `allowed-tools`, `hooks:` or bang line exists today, red-team grep).
- **Contract:** every skill name and `_shared/*.md` named in skill text resolves.
- **Delete:** `domains/coding/skills/_shared/coding-cell-policy.md` (110) and `core/skills/_shared/private-cell-worktree.md` (90). **Not** `catchup-self-recovery.md`: the arbiter confirmed 7 live readers in hand-authored plugin commands (`plugins/fgOS/skills/approve/SKILL.md:163,221`, `merge-loop/SKILL.md:86,139`, `merge-next/SKILL.md:70,76`, `merge-loop/references/blocked-pick-decision-tree.md:66`); the baseline, correctness and red-team searched only `core/` and `domains/`. The dead name `fgos-coding-compounding` leaves every machine-read contract and skill text (T8-06).
- **Size:** source −200 lines.

### 1.3 Generated surfaces (`.agents/skills`, `.claude/skills`, `plugins/fgOS/skills` mirror part)

- **Authority:** none; pure functions of the source. A tracked file there that the render did not produce is drift; an owned skill without a tracked render is drift too.
- **Contract:** `.gitignore` keeps its per-name allowlist (it cannot compute a set), and one test proves it agrees with `discoverCanonicalSkills` (T8-07). `.claude/skills/instruction-audit` becomes tracked like every other owned skill (lead decision L-4).
- **Delete:** with Q2 (a) after the probe, the reference-file copies beside each `.claude` wrapper (28 to 31 files, about 3 000 to 3 400 lines; arbiter count of tracked non-`SKILL.md` files under `.claude/skills` except `ui-spec`: 3 393 lines).
- **Size:** tracked generated text 24 069 lines today (including the 39 hand-authored plugin commands, 3 710); target about 20 000 with Q2 (a), about 23 500 with Q2 (b).

### 1.4 Domain registry and doctrine (`domains/*`, `scripts/build-domain-registry.mjs`; `src/state/domain-registry.mjs` is WORK's)

- **Authority:** stage vocabulary, step graph, roles, task specs (data); per-domain standing doctrine (`domains/<d>/AGENTS.md`).
- **Contract:** `compiled.json` stays the form Work reads. `--check`, doctor row `domain-registry-compiled` and its test judge one set: every `compiled.json` has a `registry.yaml` and equals its compile; a duplicate workflow key (`x.yaml` and `x.yml`) is refused. Doctrine is read from the payload the running `fgos` belongs to, never from the project cwd, unless Q4 opens a named extension path.
- **Delete:** the GitNexus managed block of `domains/coding/AGENTS.md:46-89` (44 lines, committed 2026-08-20, "19129 symbols", says "MUST run impact analysis" while the root capability gate says "0 providers: inactive"; arbiter read the file) and the prose of `:9-44` that duplicates `domains/coding/instructions/worktree-safety.md` (already projected into the AGENTS.md managed block; the phase diff-checks each rule before deleting).
- **Doctor rows kept:** `domain-registry-compiled` (also orphans), `domain-workflow-operations-coverage` (T6/doctor plan P08, unchanged).
- **Node budget:** `build-domain-registry.mjs` ≤ 95 (from 79).

### 1.5 Routing (how a skill name reaches a worker)

- **Authority:** executor `supports.skills` and `bind()` (T5, unchanged); `skillForStep` (WORK, unchanged); `requires-skill` claims of task specs; `fgos-routing` doctrine read.
- **Contract:** `agent-claims-resolve` accepts a claim only when an agent provides it **and** the name is an owned skill (T8-06). `executor-skills-installed` (T5 row) accepts a project-level or user-level skill dir of the CLI, refuses an empty `SKILL.md`, and says in its message that a worktree gets skills only from provisioning (T8-17).
- **Delete:** nothing; `workerContract`/`workerContractFor` is flagged to WORK only (correctness F13 said "no caller"; the arbiter found a test caller, `test/state/handoff.test.mjs:15-17`, so it is test-only, not dead).
- **Doctor rows:** no new row; two rows judge more.

### 1.6 Persona projection (`scripts/project-agents.mjs`)

- **Authority:** projecting `core/agents/*.yaml` personas into `.claude/agents/<stem>.md`.
- **Not dead (lead decision L-5).** It is the only producer of the four tracked generated agents `council-assumptions`, `council-feedback-loops`, `council-ship-maintain`, `fgos-placeholder` (each carries its "Generated by `scripts/project-agents.mjs`" line; the council agent types of this very session come from them). It has no package script and no caller, so it runs by hand.
- **Contract:** the output name is the source file stem, checked against the loader's name rule; a scalar with a newline is refused; an existing target without the generated stamp is refused by name. Today six tracked `.claude/agents/*.md` are AgentKit files with persona names (`code-reviewer`, `debugger`, `docs-manager`, `fullstack-developer`, `planner`, `researcher`; arbiter: 16 tracked foreign, 4 generated), so one manual run would overwrite them.
- **Node budget:** ≤ 275 (from 258).

### 1.7 Worktree skill provisioning (`worktreeSetup.commands[0]` in `.fgos/config.yaml:230`)

- **Authority:** give a worker in a worktree the vendor skills it can invoke. Config only; no Node change; config component and owner machine own the file.
- **Contract (Q5):** copies a named list, idempotent (`cp -RT` into a cleared target; today `cp -R` would nest `ak-x/ak-x` on a rerun, correctness F11).
- **Size:** 8 759 files and 89 MB per worktree today (speed, measured), to 730 files and 6.5 MB with Q5 (a) (computed from `du`/`find`), or `ak-cook` alone with Q5 (b) (55 files and 1 MB per root, its copy measured at 0.05 s).

**Whole layer:** Node (T8-owned) about −1 040 with the recommended answers (about −450 with Q1 (b)); 0 Rust; tests about −2 830; T8-owned test time at quiet load about 13 s (speed seat), budget ≤ 13 s after (the cuts are a size and honesty win, not a speed win: the 128-test file runs in 0.6 s).

## 2. Part B: findings, merged

Arbiter re-checks on `b009e5b4f` (disagreements settled): Gemini block size (export and helper scan: helpers `resolveProjectRoot`, `hasCanonicalOrAssembledSkill`, `canonicalSharedRoots`, `toPosixRelativePath`, `normalizeGeminiCommandVerb` are used only inside the dead ranges; `windowsPathCollisionKey` stays, used at `:793,820,875`) → simplicity's 590 is right, the baseline's 300 to 400 low; test sections (`awk` over `test/setup/skill-wrappers.test.mjs`: 128 tests, 57 from line 1514, 6 in 445-516/539-605, 24 in the Gemini ranges, 9 `return; // retired`) → 87 deletable with Q1 (a), 63 without; dead fragments → 2, not 3 (above); domain loops (`git grep readdirSync(...domain`) → 16 domain loops in 10 files plus one skill-dir loop at `skill-wrappers.mjs:681`, so simplicity's count holds; `createProjectSkillGuard` → no test names it, two tests reach it through `materializeSkillsIntoProject` (red-team and baseline both partly right); citation baseline entries under `.agents/skills` (baseline Q7) → 5 files, 59 entries, **0 unique**: each has its byte twin under `plugins/fgOS/skills` (node script over the baseline JSON); `fgos-coding-compounding` → 10 places, one more than correctness listed (`core/agents/fgos-placeholder.yaml:23`); `measure-coordination-baseline.mjs:11` imports `src/runner/coordination/replay.mjs`, which does not exist (`ls`); `ak-cook` text names exactly nine other `ak-*` skills (`grep` over `.agents/skills/ak-cook/`).

Severity after merging (25 accepted): **High 2** (both reproduced), **Medium 16** (two of them Low/Medium), **Low 7**; rejected 11; routed 6. **Highs unreproduced: none.**

### 2.1 Accepted (ranked by value over risk)

| Id | Seats | Sev | Repro | Evidence | Fix (door reused) | Size | Owning proof after | File owner |
|---|---|---|---|---|---|---|---|---|
| T8-01 | correctness F1, red-team R-2 (K2), speed F-2 | High | yes (exit 1 `git-addon-unavailable` after 125 `wrote` lines; baseline and red-team) | `scripts/build-skill-wrappers.mjs:21-41` writes three trees, then `materializeInstructionProjection` parses YAML through the native door; no `ensureAddonForScript` (siblings: `build-domain-registry.mjs:62`, `project-agents.mjs:256`) | Script = `ensureAddonForScript()` + `renderSkillSurfaces(root)`, which computes the owned set and `computeInstructionProjection` before the first write | Node −20 (script body moves into the module), test +25 | `skill-wrappers.test.mjs`: "a projection refusal leaves every skill surface untouched" | T8 |
| T8-02 | correctness F2, red-team R-2, simplicity door table (K4) | High | yes (`ak-cook/SKILL.md` 74 → 18-line wrapper; scratch `foreign-clobber`) | `generateAllSkillWrappers` `skill-wrappers.mjs:168-216` walks `readdirSync(.agents/skills)`; ownership is tested only by the orphan prune (`:206-213`). External: `materializeSkillsIntoProject` (`:1328-1362`) runs it in a user project; `createProjectSkillGuard` keeps only tracked-dirty or newer-version targets, and AgentKit dirs are ignored so never dirty (D-ADR0035 mission #1) | Wrapper, mirror and prune take the owned-name set from the assemble step; collision rule for a same-named foreign dir per **Q3** | Node +8/−4 (+15 with Q3 (b)), test +30 | `skill-wrappers.test.mjs`: "a foreign skill dir in `.agents/skills` and `.claude/skills` is left byte-identical" and one `materializeSkillsIntoProject` case with a foreign `ak-*` in the target | T8 |
| T8-03 | simplicity B1, baseline K6/H3 | Med (size High) | measured | `test/setup/skill-wrappers.test.mjs:1514-3735` (57 reference-model tests; header "no runtime production code calls this"), `:445-516`, `:539-605` (6 tests of `fgos-code-panel`/`-change`/`plan-loop`, deleted `6527596eb` 2026-10-01); 9 neutered | Retire all 63 | test −2 360 | Behaviour removed; "retired names do not return" stays owned by `test/runner/dead-vocabulary-guard.test.mjs:314-355` | T8 (TEST told: "mirrors / contract-prose" labels) |
| T8-04 | correctness F3 | Med | yes (scratch `stale.mjs`: deleted reference stays in all three trees; deleted skill's plugin dir stays) | `copyDirRecursive` `:309-322` only overwrites; `mirrorDevSkillsIntoPlugin` `:339-351` never removes | Per owned dir, remove files the source lacks; mirror removes `fgos-*` dirs absent from `.agents` | Node +18, test +20 | `skill-wrappers.test.mjs`: "a second render after a source deletion is a fixed point" | T8 |
| T8-05 | red-team R-3 | Med | yes (`symlink-file` copied `TOPSECRET` into a tracked tree; `symlink-target` wrote outside; dangling link aborts the prune half done) | `copyDirRecursive` `:309-321` (`isDirectory` false for a link, falls to `copyFileSync`), `copyAssembledFile` `:1177-1193`, `carriesAssembledHeader` `:1198-1204` | One copy leaf that `lstat`s and refuses a link by name, used by all three. Reusing the release collector's predicate (`scripts/build-rust-distribution.mjs` `collectSourceFiles`) only if it can be a `src/` leaf without `src` importing `scripts` (principle 2); otherwise an item for Packaging | Node +10, test +10 | existing copy cases in `skill-wrappers.test.mjs` gain "a link in a skill source is refused by name" | T8 |
| T8-06 | correctness F4 (+ arbiter's 10th place) | Med | read (doctor row green with a dead name on both sides) | `fgos-coding-compounding` in `domains/coding/task-specs/compound-learn.md:3` (`requires-skill`), `core/agents/docs-manager.yaml:20`, `core/agents/fgos-placeholder.yaml:23`, `core/task-specs/fgos-indexing.md:16`, `core/skills/fgos-indexing/SKILL.md:7,16,18,32,77`, `core/skills/fgos-routing/SKILL.md:149`, `domains/coding/skills/fgos-coding-implement/SKILL.md:168`, `plugins/fgOS/skills/retro-next/SKILL.md:111`; `checkAgentClaimsResolve` `registrations.mjs:837` compares name to name | Rename to `fgos-coding-knowledge` (`feature.yaml:122-125` already uses it); the row also requires the name in the owned-skill set | text ±0, Node +4, test +10 | `test/setup/checks.test.mjs` agent-claims case with a dead name | T8 + WORK told (`fgos-coding-implement`, `fgos-routing` text) |
| T8-07 | correctness F5a, F9; red-team R-6 | Med | yes by listing (`.claude/skills/instruction-audit` absent in this worktree; `.gitignore:68-71` omits it, `:77` has it for `.agents`) | `fgos-mirror.test.mjs:48` `startsWith('fgos-')`; `distill` wrapper and 29 copied reference files compared by nothing (0 drift today) | `fgos-mirror` iterates owned names over `ownedFileSet`; one test "every owned skill has a tracked `.agents/skills/<n>` and `.claude/skills/<n>/SKILL.md`"; add the one `.gitignore` line (L-4). Reference-file compare only if Q2 keeps the copies | test +20 (+10 with Q2 (b)), `.gitignore` +1 | `test/skills/fgos-mirror.test.mjs` | T8 |
| T8-08 | correctness F5b/d, simplicity B6, residual of `27b2c580c` | Med | read | `check-decision-citation-drift.mjs:321` `.agents/skills` in `WIDE_SWEEP_ROOTS`; `collectWideSourceFiles` `:340` unfiltered (reads 104 vendor dirs, 19 MB, per `fgos decision --relation`); stale comment `:307-320` | Delete the root, the comment's false claim and the 59 baseline entries under `.agents/skills` (0 unique, twins under the plugin mirror) | Node −12, baseline JSON −65 | `test/scripts/check-decision-citation-drift.test.mjs` (existing real-repo case) | T8 |
| T8-09 | red-team R-1 | Med | read + listing (6 foreign tracked agents with persona names) | `scripts/project-agents.mjs:247-250` `name = def?.name ?? file.name` → `writeFileSync(TARGET_DIR/${name}.md)`; description spliced raw (`:113`) | Name = file stem and the loader's rule; newline in a scalar refused; a target without the stamp refused by name | Node +12, test +30 | `test/scripts/project-agents.test.mjs` three cases | T8 |
| T8-10 | correctness F6 residual (K3 writer side) | Med | reasoned | `instruction-projections.mjs:341-343` writes `.fgos/instructions/effective/repo.json`, skip-worktree in every worktree, so a lane's regenerated effective set is never staged and main goes stale (removal side fixed by the branch above) | After T8-01's compute-first order: when the effective-set path is skip-worktree in this checkout and its content would change, refuse by name ("regenerate in the main checkout") before any write. Uses the Git port if it already reports the flag; if no port verb answers it, file an item instead of adding one (RUL104) | Node +6, test +10 | `test/setup/instruction-projections.test.mjs` | T8; OPC told |
| T8-11 | red-team R-5 (lead part) | Med | read | `domains/coding/AGENTS.md:46-89` foreign GitNexus block; `:9-44` duplicate of `worktree-safety.md` | Delete both (rule-by-rule diff first); check that `gitnexus analyze` does not rewrite a subdirectory AGENTS.md before deleting, else exclude the path in its config | doctrine −80 | none (doctrine text); the AGENTS.md projection test stays green | T8 |
| T8-12 | simplicity B3 | Med | read (`replay.mjs` missing) | `scripts/measure-coordination-baseline.mjs:11,19`; only references: `test/runner/assignment-enumerator-guard.test.mjs:114-115`, `packages/git/contracts/mutation-census.v1.json:875` | Delete the script, the two exception rows, the census line | Node −464, test −2 | behaviour removed | T8 + T5 test rows (HARDEN owns closed T5) + census (OPC) |
| T8-13 | simplicity B4, baseline K7 (corrected) | Med | read | two fragments, no reader outside each other and `skill-wrappers.test.mjs:464` (retired with T8-03) | Delete 2 fragments; re-render; census −4 hashes | source −200, generated −600 | behaviour removed | T8 |
| T8-14 | correctness F8 | Med | reasoned | `build-domain-registry.mjs:47-54` and `checkDomainRegistryCompiled` `registrations.mjs:1124` walk `registry.yaml` dirs; `loadDomainsFromDisk` (WORK) loads every `compiled.json` | One `checkCompiledDomains` in the script (also orphans), imported by the row | Node +8, test +10 | one case in `test/state/domain-registry-compiled.test.mjs` (WORK file: WORK told; if WORK refuses, the case goes in a new `test/scripts/build-domain-registry.test.mjs`) | T8 + WORK test file |
| T8-15 | red-team R-4 | Low/Med | yes (`marker-quote`: a foreign `.claude` skill quoting the marker is deleted by the prune) | `:146-153`, `:1203` `includes` | Anchored check: marker is the first body line after frontmatter; header is the first line of an assembled `.md` | Node +4, test +10 | prune cases in `skill-wrappers.test.mjs` | T8 |
| T8-16 | correctness F10 | Med (latent) | read | `discoverCanonicalSkills` calls `mapSkillIntentToHostTriggers` → `normalizeGeminiCommandVerb` (`:582-595`) for every skill; throws on `ui_spec`; `foo` and `fgos-foo` collide | Falls out of Q1: (a) deleted; (b) run the Gemini checks only when a Gemini output is requested | (a) in T8's −590; (b) Node +4 | (a) removed; (b) one case | T8 |
| T8-17 | correctness F7 | Med | read | `model-pool-checks.mjs:60-84` existence only, main checkout only, project level only, `':'→'-'` only | Accept project or user-level dir of the CLI; refuse empty; message names worktree provisioning (install-gate rule: never assume one install level) | Node +10, test +15 | `test/setup/model-pool-checks.test.mjs` | T5 file (HARDEN owns closed T5) |
| T8-18 | red-team R-8 | Low/Med | read | `instruction-projections.mjs:339-345` `writeFileSync` on `AGENTS.md` in place | Write through the durable door `replaceDurably` (`src/native/door.mjs:105`), not a new helper | Node +3 | `instruction-projections.test.mjs` existing write case | T8 |
| T8-19 | simplicity B7 | Low | read | `checkDuplicates`, `checkCollisions` (`:634, 839, 1223-1229`), only tests pass `false` | Remove both options | Node −12 | existing duplicate tests at `:1155`, `:1272` | T8 |
| T8-20 | simplicity B5, baseline K10, speed F-5 | Low | read | 16 loops, 10 files (list above) | `src/util/domain-dirs.mjs` `listDomainDirs`; convert T8 callers (`skill-wrappers`, `instruction-registry`, `build-domain-registry`, `project-agents`) in the same commit; the other six (`agent-definitions`, `agent-roster`, `operation-prompt-templates` ×2, `registrations` ×2, `loader`, `domain-registry`) filed as items the same turn (L10). No speed claim (speed seat: sub-millisecond) | Node about −15 net, test +25 | new `test/util/domain-dirs.test.mjs` (new module, so a new file is allowed by principle 8) | T8; items to T5, T6, WORK |
| T8-21 | red-team R-7 | Low | yes (name `../../../escaped` wrote outside) | `core/skills/distill/scripts/distill.mjs:123-125`, `:287` | Name `^[a-z0-9][a-z0-9-]*$`; printed line `git clone -- <url> <dir>`; `add` refuses a URL that is not `https://`, `ssh://` or `git@` | +8 | distill has no test file; the refusal is proven by one scratch run recorded in the phase report (no new test file for a skill script) | T8 |
| T8-22 | speed F-3 | Low | measured (12 CLI spawns, about 1 s each at load 40) | `test/scripts/check-decision-citation-drift.test.mjs` | Non-contract cases call the module in process; one CLI wiring proof stays (principle 8). Estimate −3 to −4 s quiet, not measured after | test −30 to +10 | same file | T8 |
| T8-23 | correctness F14, F15 | Low | read | `build-domain-registry.mjs:41` keys by basename; `fgos-coding-shaping/SKILL.md:20` names plugin command `fgos-discover` as if a skill | Throw on duplicate key; reword the line | +2 | domain build case of T8-14 | T8 (shaping text: WORK told) |
| T8-24 | correctness F11 | Low | read | `.fgos/config.yaml:230` `cp -R` nests on rerun | Folded into Q5's config line (`cp -RT` into a cleared dir) | config 1 line | none (config) | config component |
| T8-25 | correctness F5c | Low | read | drift-guard failure text always says "run `npm run build:skills`" | Name the `.gitignore` cause when the missing file is ignored | test +2 | drift guard in `skill-wrappers.test.mjs` | T8 |

### 2.2 Rejected (with source)

- **Baseline/correctness/red-team: `catchup-self-recovery.md` is dead.** Seven readers in hand-authored plugin commands (arbiter `git grep`, listed in 1.2). Kept.
- **Correctness F6 "writer side, the removal guard is deliberate"** as the fix for the stranded worktree: OPC reversed the guard on new evidence (Git checkout/rebase writes the path back too, not only `build:skills`), `fc9675c4e`. Review rule "reverse only on new evidence": the evidence is new. Only the staging residual stays (T8-10).
- **Correctness F13 "`workerContractFor` has no caller":** `test/state/handoff.test.mjs:15-17` calls it. Test-only, WORK's files; flagged, not changed.
- **Red-team: drop the `.gitignore` per-name allowlists once a test exists.** `.gitignore` cannot compute the owned set; dropping the allowlist tracks `ak-*`. The allowlist stays and T8-07's test proves it agrees.
- **Baseline option 3 (`ak-*` name filter in guards):** hard-codes a vendor prefix in a fourth place; superseded by `27b2c580c` and T8-02.
- **Correctness Part A: a new `skillExists(root, name)` function (+12):** the owned-name set `discoverCanonicalSkills` already returns is the door; T8-06 reads it directly.
- **Correctness F5a reference-file compare (+10) unconditionally:** only if Q2 keeps the copies.
- **Speed: skip-if-unchanged cache for `build:skills`:** saves under 0.9 s on a 1 s script and adds a mechanism; the seat itself rejects it.
- **Simplicity B9 (stop committing derived trees):** the seat does not recommend it now; hosts read checkouts and the release takes `.agents/` as source (`build-rust-distribution.mjs:100`). Its middle step (skip generated `.agents/skills/**` in `git-one-door-scan`) is a Git-owned census change: routed to OPC as an idea, not a T8 phase.
- **Red-team R-9 (`npm pack` ships 1 747 `ak-*` files):** package is `"private": true`; the release path excludes ignored bytes (`source-payload` test). Latent; routed to Packaging (T9) so the name list is not copied a fifth time.
- **Simplicity "do not create `renderSkillSurfaces`" was not said**, but the arbiter checked principle 6: the function replaces the script's sequence and the setup sequence (two callers, one door), so it is not a file or layer added only to move lines.
- **Speed F-4, F-5, F-6 and the baseline's "move to Rust":** measured too small or not T8's; no action.

### 2.3 Routed (not T8 files)

| Item | To | Why |
|---|---|---|
| Speed F-7: 254 KB doctrine chain reachable from `fgos-advise`/`-architecture-panel` | T6/COOK (agent-coordination playbooks) | the bytes are T6 doctrine docs; needs one observed run first |
| Red-team cross-layer: `worktreeSetup.commands` from a pulled project's tracked config runs on every create | CFG (T4/T5 config trust) | same threat as `p-8da4b370`; not T8 |
| Red-team: `--acknowledge-iron-law` plain boolean; `$ARGUMENTS` unquoted in plugin commands | T9 (merge/plugin) | no data-driven injection found; noted |
| R-9 `npm pack` files list | Packaging (T9) | above |
| Simplicity idea 5: `materializeSkillsIntoProject`, `createProjectSkillGuard` go when `fgos setup` retires | Packaging (T9) | depends on the setup retirement |
| Correctness F12: `skillPath` can be `.claude/skills/null/SKILL.md` (`work-compat.mjs:159-160`) | WORK | WORK file; latent |

## 3. Lead decisions (inside RUL104, no owner answer needed)

| # | Decision | Reason |
|---|---|---|
| L-1 | T8-01 and T8-02 start first, in one lane, before any owner answer (the T8-02 name set does not depend on Q3; Q3 only adds the collision rule) | Two reproduced Highs; T8-02 rewrites other tools' files in projects that use fgOS (mission #1). Both are missing checks inside an existing mechanism |
| L-2 | No new spec file; Part A is written into `skill-package-distribution.md` and `domainization.md`, and the contract's stale section 9 doctor rows and the Gemini rows follow Q1 | principle 6; the owning docs exist |
| L-3 | T8-03 (63 reference-model and retired-skill tests) retired without waiting for TEST's labels; TEST told with the list | behaviour removed in `6527596eb`; `dead-vocabulary-guard` owns the one live idea; TEST is closed (decision 69 precedent) |
| L-4 | `instruction-audit` (expected fork "how it is tracked") is **decided**: track `.claude/skills/instruction-audit` with one `.gitignore` line, like every other owned skill; T8-07's test then keeps every owned name tracked in both trees | its text is a generic repo-audit skill for any project (`core/skills/instruction-audit/SKILL.md:1-12`); `24f4e2a8a` (2026-10-25) tracked only the `.agents` render "so a fresh checkout passes the render guards", which covered the guard's need, not the intent; Codex already gets it in every clone, Claude does not. Nothing points to "maintainer only" |
| L-5 | `scripts/project-agents.mjs` (expected fork "is it dead") is **decided: not dead**; keep it as a manual script, apply T8-09 | it is the only producer of 4 tracked generated agents (`council-*`, `fgos-placeholder`), which this session's agent catalog lists; deleting it would leave them unrenderable. Folding it into `build:skills` would start projecting the 4 marketing personas into tracked files, a behaviour change, so not now |
| L-6 | T8-12 deletes `measure-coordination-baseline.mjs` | it cannot run (`replay.mjs` gone since `2180b4e72`); `git log` keeps it as history (simplicity Q2) |
| L-7 | The two delete-only text edits in Work-adjacent skills (`fgos-coding-implement:168`, `fgos-coding-shaping:20`) and `fgos-routing:149` are made by T8 with WORK told before merge, not waited on | text-only renames of a dead name; the T6 baseline rule "Work-adjacent: tell WORK" |
| L-8 | One render-and-census step per wave (P10 below), never per lane | every source edit re-renders three trees and two census hashes per file (`mutation-census.v1.json`, 133 skill hashes); parallel lanes would collide on generated files (orchestration rule) |
| L-9 | No `build:skills` run in a linked worktree until `harden/skip-worktree-writer` is on main | until then the run strands the worktree (K3) |
| L-10 | T8-17 (`executor-skills-installed`) and T8-12's two T5 test rows are done by HARDEN | T5 is closed and HARDEN-owned; drift fixes inside RUL104 (decision 48 rule) |

## 4. Owner ask 1 (gửi anh)

Em gom 7 câu thật sự cần anh chọn, cộng câu 8 duyệt hình dạng và giờ land; anh trả lời một lần, ví dụ "1a 2a 3b 4a 5a 6a 7a 8a". **Không hỏi, em đã quyết** (mục 3): hai lỗi High (`build:skills` chết sau khi đã ghi; bước wrapper ghi đè `ak-*` của kit khác) em bắt đầu ngay vì chỉ là thêm kiểm tra còn thiếu; `instruction-audit` sẽ được track bản `.claude` như mọi skill khác (L-4); `scripts/project-agents.mjs` không chết, nó sinh 4 agent `council-*`/`fgos-placeholder` đang dùng (L-5). Bản sửa skip-worktree đã được OPC duyệt, chờ regen census rồi land.

**Q1. Xoá bộ sinh gói Gemini.**
- **Chuyện gì đang xảy ra:** `src/setup/skill-wrappers.mjs` có khoảng 590 dòng sinh gói extension cho Gemini CLI và phân loại "adapter target", cùng 24 test (khoảng 670 dòng). Không có `.gemini` nào, không executor nào dùng. Phần kiểm tra intent của nó còn chạy cho mọi skill và sẽ ném lỗi với tên hợp lệ như `ui_spec`.
- **Nguyên nhân:** em đã quét export: `generateGeminiSkillPackage`, `SKILL_ADAPTER_TARGETS`, `isGeneratedAdapterTarget`, `isCanonicalSkillSource` chỉ được test gọi; `git log -S` cho thấy từ khi thêm (2026-09-14, `5769cb9e7..dcb97a9aa`) chưa bao giờ có caller. Nhưng contract `skill-package-distribution.md:64,75,111` ghi Gemini là "partial / planned", nên xoá là đảo một ý định sản phẩm.
- **Các lựa chọn:** (a) xoá ngay, sửa các dòng contract và `implementation-alignment.md`; Node −590, test −670; khôi phục được từ git. (b) giữ, chỉ chạy kiểm tra Gemini khi thật sự sinh gói Gemini; Node +4; nhưng muốn có giá trị thì sau này phải thêm caller, doctor row, chỗ trong spec (là một tính năng). (c) để nguyên; 0 dòng, lỗi tên vẫn tiềm ẩn.
- **Khuyến nghị:** (a): 8 tuần không ai dùng, là mảnh lỏng làm layer nặng (RUL11); khi cần Gemini thật thì làm lại qua cửa render chung.
- **Phạm vi:** "có (a)" cho phép xoá trong `skill-wrappers.mjs` và test của nó, sửa contract Packaging (báo DOC), một dòng CHANGELOG; không đụng tới `.agents`/`.claude`/plugin.

**Q2. Bỏ bản sao reference file trong `.claude/skills`.**
- **Chuyện gì đang xảy ra:** mỗi wrapper `.claude/skills/<skill>/SKILL.md` (16-20 dòng, trỏ sang `.agents/skills/<skill>/SKILL.md`) kèm bản sao toàn bộ file `references/` bên cạnh: khoảng 31 file, 3 393 dòng được commit, không test nào so chúng.
- **Nguyên nhân:** em đã mở `b91488318` (2026-08-19, "enable out-of-process dispatch for fgos-fanout"): bản sao được thêm có chủ ý, có thể vì một worker đọc reference theo đường dẫn tương đối từ thư mục wrapper. Chưa ai kiểm tra Claude Code có đọc theo đường của file nguồn sau khi theo lời trỏ hay không.
- **Các lựa chọn:** (a) chạy một probe thật trước (một seat Claude qua `fgos run`, nạp wrapper `fgos-fanout`, phải đọc một file `references/`; xem nó mở đường nào); probe qua thì xoá bản sao (generated −3 393, Node −20, test −10); probe trượt thì làm (b). Tốn khoảng một lần chạy seat. (b) giữ bản sao, thêm so sánh byte vào `fgos-mirror` (test +10). (c) xoá luôn không probe; rủi ro gãy worker của fanout.
- **Khuyến nghị:** (a): ý định 08-19 được tôn trọng bằng bằng chứng, không đoán.
- **Phạm vi:** "có (a)" cho phép chạy một probe (một seat, chỉ đọc) và, nếu qua, xoá bước copy trong `generateAllSkillWrappers` cùng các file bản sao; nếu trượt thì tự chuyển sang (b) không hỏi lại.

**Q3. `build:skills`/`fgos setup` gặp thư mục cùng tên của kit khác.**
- **Chuyện gì đang xảy ra:** sau sửa T8-02 (đã quyết), fgOS chỉ ghi các tên nó sở hữu, nên không còn đụng `ak-*`. Còn một trường hợp: project có sẵn một thư mục trùng tên một skill fgOS (ví dụ kit khác hoặc người dùng tự đặt `fgos-cook`) mà không phải do fgOS sinh.
- **Nguyên nhân:** em đã đọc `createProjectSkillGuard` (`skill-wrappers.mjs:261-305`): nó chỉ giữ file được track và đang sửa, hoặc có `version` mới hơn; thư mục bị ignore thì không bao giờ "dirty", nên vẫn bị ghi đè.
- **Các lựa chọn:** (a) chỉ dùng tập tên sở hữu; thư mục trùng tên vẫn bị ghi như hôm nay; Node +8/−4. (b) tập tên sở hữu cộng dấu sinh neo (dòng đầu thân file, cùng sửa T8-15): chỉ ghi vào thư mục chưa có hoặc mang dấu của fgOS, thư mục trùng tên không có dấu thì từ chối có tên và báo cách xử lý; Node +15, test +10.
- **Khuyến nghị:** (b): fgOS chạy trong project người khác (sứ mệnh #1) không được ghi đè thứ nó không viết; chi phí nhỏ vì dấu neo đã làm cho T8-15.
- **Phạm vi:** "có (b)" cho phép đổi `generateAllSkillWrappers`, `materializeSkillsIntoProject`, `assembleSkills` và test, một dòng CHANGELOG ("setup từ chối thư mục skill trùng tên không do fgOS sinh"); không đổi `createProjectSkillGuard`.

**Q4. Project có được mở rộng doctrine domain đi kèm fgOS không.**
- **Chuyện gì đang xảy ra:** skill `fgos-routing` bảo agent đọc `domains/<domain>/AGENTS.md` theo đường tương đối, nên trong một project khác nó đọc file của chính project (nếu có) như "doctrine chuẩn", còn doctrine fgOS ship thì không bao giờ tới (setup không copy `domains/`).
- **Nguyên nhân:** em đã đọc `core/skills/fgos-routing/SKILL.md:180-181,232` và `materializeSkillsIntoProject`; `domain` của item đã được kiểm (`store.mjs:173-178`), chỉ có gốc đường dẫn là sai.
- **Các lựa chọn:** (a) không: doctrine chỉ đọc từ payload đang chạy; skill nói rõ đường (lấy từ một verb có sẵn nếu có, nếu không thì thành idea F-2 ở mục 5); text −/+10. (b) có: đọc doctrine payload trước, rồi file của project như phần mở rộng có tên, với một câu nói rõ mức tin cậy; text +15, cần một chỗ trong spec domainization. (c) giữ nguyên.
- **Khuyến nghị:** (a): một nguồn sự thật (nguyên tắc 7); khi có nhu cầu mở rộng thật thì thiết kế đường mở rộng có tên sau.
- **Phạm vi:** "có (a)" cho phép sửa text `fgos-routing` (báo WORK) và spec domainization; không thêm verb mới (verb là idea riêng, anh chọn ở mục 5).

**Q5. Worktree nhận những skill nào.**
- **Chuyện gì đang xảy ra:** mỗi `fgos worktree create` copy toàn bộ `ak-*` từ năm thư mục skill: 8 759 file, 89 MB, 3,7 đến 4,4 s (đo ở load 41 và 98). Executor chỉ khai `ak:cook`.
- **Nguyên nhân:** dòng `worktreeSetup.commands[0]` (`.fgos/config.yaml:230`, `9fa8a08f0`) dùng glob `ak-*`. Em đã grep `ak-cook`: nó gọi tên đúng chín skill khác (`ak-scout`, `ak-fix`, `ak-brainstorm`, `ak-preview`, `ak-plan`, `ak-journal`, `ak-issue-to-plan`, `ak-docs`, `ak-test`).
- **Các lựa chọn:** (a) `ak-cook` cộng chín skill nó gọi: 730 file, 6,5 MB (tính từ `du`, chưa chạy), ước tính dưới 0,3 s; worker theo chuỗi của `ak-cook` không gãy. (b) chỉ `ak-cook`: 55 file, 1 MB mỗi gốc (seat speed đo bản copy 0,05 s); worker gọi skill con sẽ không tìm thấy. (c) giữ glob. Cả ba đều là sửa một dòng config, kèm `cp -RT` vào thư mục đã dọn để chạy lại không lồng.
- **Khuyến nghị:** (a): giảm 92% file mà không làm gãy hợp đồng `ak:cook`.
- **Phạm vi:** "có (a)" cho phép em sửa một dòng `.fgos/config.yaml` (board line cho config component, máy anh áp theo guide); không đổi code `provisionWorktree` (tự suy ra từ `supports.skills` là idea riêng).

**Q6. `launchConfinement.ownWorktree` có thành global-only không (từ review CFG).**
- **Chuyện gì đang xảy ra:** `privateHome` và `isolatedSession` là global-only, còn `ownWorktree` thì không; một file `.fgos/config.*` của project (ai commit cũng được, kể cả repo clone về) đặt `ownWorktree: false` đè lên `true` của global, tắt guard `own-worktree-unavailable` cho executor không bypass.
- **Nguyên nhân:** em đã mở `core/config-schema/runner.schema.yaml:589-599`: hai cờ kia có `x-fgos-scope: global-only`, `ownWorktree` không có; review CFG không tìm thấy lý do ghi lại cho việc để ngoài danh sách của quyết định 64 (`git log -S` chưa vét hết). `controls` có cùng lỗ và review đã đề nghị global-only cho nó.
- **Các lựa chọn:** (a) thêm `x-fgos-scope: global-only` cho `ownWorktree` cùng đợt với `controls`: schema 1 dòng, spec mục 4 quy tắc 4 thêm 1 dòng, một case fixture `scope.v1.json` (khoảng 12 dòng); project mất quyền tắt own-worktree. (b) giữ project-settable vì quyết định 64 cố ý để ngoài; ghi lý do vào spec; 3 dòng docs.
- **Khuyến nghị:** (a): cùng một sự thật với `controls.workspace`, mà spec đã nói project không được nới confinement.
- **Phạm vi:** "có (a)" cho phép sửa schema, spec config và fixture Rust golden (proof chính), báo CFG; không thuộc sub-plan T8, đi chung bản sửa `controls` của review CFG.

**Q7. Thứ tự giữa T8 và việc gom domain-dirs vào file của lane khác.**
- **Chuyện gì đang xảy ra:** cửa mới `listDomainDirs` (T8-20) thay 16 vòng `readdirSync(domains…)` trong 10 file; 4 file của T8, 6 file của T5, T6, WORK.
- **Nguyên nhân:** L10 bảo chuyển mọi caller cùng đợt; nhưng `domain-registry.mjs` và `loader.mjs` thuộc WORK/T6, WORK đang giữ ("foundation first, Work later").
- **Các lựa chọn:** (a) T8 chuyển 4 file của mình và các file T5/T6 (HARDEN đã đóng, tự sửa được), mở item cho phần WORK (`domain-registry.mjs`); Node khoảng −25. (b) chỉ chuyển 4 file T8, mở item cho 6 file kia; Node khoảng −15. (c) bỏ cửa này (chỉ là gọn gàng, không nhanh hơn).
- **Khuyến nghị:** (a): HARDEN sở hữu T5 và T6 đã đóng, chỉ còn một vòng của WORK nằm ngoài.
- **Phạm vi:** "có (a)" cho phép sửa một dòng import/gọi trong `agent-definitions`, `agent-roster`, `operation-prompt-templates`, `registrations`, `loader`; WORK được báo và nhận item.

**Q8. Duyệt hình dạng mục 1 và giờ land.**
- **Chuyện gì đang xảy ra:** bốn seat đồng ý cả layer ở lại Node; mỗi thành phần có một cửa và ngân sách (mục 1); không thêm doctor row nào, hai row xét chặt hơn.
- **Nguyên nhân:** số dòng lấy từ baseline, seat simplicity và đếm lại của em; bảng doctor: `agent-claims-resolve` thêm "tên phải là skill có thật", `executor-skills-installed` thêm thư mục cấp user và từ chối file rỗng, `domain-registry-compiled` thêm orphan; không điều kiện nào bị mất.
- **Các lựa chọn:** (a) duyệt mục 1 như viết; fg-server2 tự land từng phase khi gate qua, trong khung yên đã báo trên board; máy anh và fg-server theo guide tiếng Việt. (b) duyệt nhưng chờ anh đặt giờ từng lần land. (c) sửa mục 1 ở điểm anh chỉ.
- **Khuyến nghị:** (a), như T6 (quyết định 59 6a, 61 5a).
- **Phạm vi:** chỉ T8; T8 không đổi schema `~/.fgos/config.json` nên không cần kích hoạt đồng loạt; Q6 đi theo nhịp land của CFG.

## 5. Feature ideas (RUL104: not accepted, owner picks; none counted in section 6)

| # | Idea | Seats | Problem and evidence | Benefit | Cost |
|---|---|---|---|---|---|
| F-1 | Read-only `fgos skills check`: "owned surfaces equal a render" | all four | three readers of one rule (drift test, `fgos-mirror`, citation `ownedFileSet`); guard message names the wrong cause (T8-25) | one proof for tests and doctor; a link, a foreign clobber and an untracked wrapper become one named finding | new verb, about +80 Node; would replace two test loops |
| F-2 | `fgos domain doctrine <domain>` prints the shipped doctrine path | red-team | Q4 (a) needs a payload path an agent can read | external projects get the shipped doctrine | small verb, about +30; only with Q4 (a) and no existing verb |
| F-3 | Skill-text lint: every skill name and `_shared` fragment named in skill text resolves; unreferenced fragments refused | correctness 1, simplicity 2, baseline | T8-06 (10 dangling places), T8-13 (dead fragments) found by hand | replaces per-skill prose tests | one test, about +60 |
| F-4 | Doctor row "foreign skill in an fgOS-owned root" | all four | `ak-*` collisions found by red tests, not a check | owner sees a collision before a build | +1 row; after T8-02 and Q3 (b) a collision cannot happen silently, so low value |
| F-5 | Lint refusing `allowed-tools`, `hooks:`, bang lines in source skills | red-team | none exist; only review keeps it so | a skill cannot grant itself authority | one test, about +30 |
| F-6 | `provisionWorktree` derives the copied skills from `supports.skills` | speed | the config line and the declarations drift (104 dirs for 1 declared skill) | Q5 cannot regress | new mechanism in `src/runner/worktree.mjs` |
| F-7 | Doctor row: provisioned worktree size against a budget | speed | 89 MB per worktree unnoticed for three weeks; 28 GB in 41 worktrees | early warning | +1 row |
| F-8 | Hardlink provisioning (reflink is unavailable: ext4, speed `df -T`) | baseline, correctness, simplicity | 89 MB per create | seconds per lane start | needs a rule for skills a worker edits; Q5 (a) makes it unnecessary |
| F-9 | Skip generated `.agents/skills/**` in `git-one-door-scan` | simplicity B9 | 66 of 133 skill census hashes are renders of scanned sources | half the census churn per skill edit | Git-owned; OPC decides |

## 6. Net size and proposed sub-plan phase split

### 6.1 Net size (HARDEN commits, estimate)

| | Node | Rust | Tests | Generated / text |
|---|---|---|---|---|
| T8-01, -02, -04, -05, -15, -19, -25 render core | about +5 | 0 | +95 | 0 |
| T8-03 retire reference-model and retired-skill tests | 0 | 0 | −2 360 | 0 |
| T8-12 dead script; T8-13 dead fragments | −464 | 0 | −2 | source −200, generated −600 |
| T8-06, -07, -08, -09, -10, -14, -17, -18, -20, -21, -22, -23 | about +25 | 0 | about +110 | baseline JSON −65, doctrine −80 |
| **Accepted total (without forks)** | **about −435** | **0** | **about −2 160** | **about −945** |
| Q1 (a) / (b) / (c) | −590 / +4 / 0 | 0 | −670 / +5 / 0 | 0 |
| Q2 (a) probe passes / (b) | −20 / 0 | 0 | −10 / +10 | −3 393 / 0; instruction-audit tracked +18 (a) or +760 (b) |
| Q3 (a) / (b) | 0 / +7 | 0 | 0 / +10 | 0 |
| Q5 any | 0 | 0 | 0 | config 1 line |
| Q6 (a) | 0 | 0 (schema 1, fixture +12) | 0 | spec +1 |
| Q7 (a) / (b) | −10 / 0 | 0 | 0 | 0 |
| **With recommended answers (1a 2a 3b 4a 5a 6a 7a)** | **about −1 040** | **0 (fixture +12)** | **about −2 830** | **about −4 300** |

Layer total ≤ 0 in every combination (worst: Q1 (b), Q2 (b), Q3 (b): Node about −425, tests about −2 135).

### 6.2 Phases (lanes own files, not findings; every lane in a wave is file-disjoint; L10: a new door lands with its callers)

- **P00 (outside the sub-plan, landing):** `harden/skip-worktree-writer` with the census regen OPC asked for. Gate for every phase that runs `build:skills` in a worktree (L-9).
- **P01 Render core (start now, L-1; serial inside):** `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs`. Order: T8-03 retirement first (shrinks the file every later commit touches) → T8-01 + T8-02 → T8-04, -05, -15 (one copy leaf) → T8-19, -25, `skillSourceRoots` → Q1 → Q3 → Q2 (after the probe).
- **Wave 1, parallel with P01 (file-disjoint):**
  - **P02 Guards:** `test/skills/fgos-mirror.test.mjs`, `scripts/check-decision-citation-drift.mjs`, its `.baseline.json` and test, `.gitignore`. T8-07, T8-08, T8-22, L-4's `.gitignore` line (its render lands in P10).
  - **P03 Source text and doctrine:** `core/skills/**` text (not `distill/scripts`), `domains/coding/skills/**` text, the two `_shared` deletions, `core/agents/*.yaml`, `core/task-specs/fgos-indexing.md`, `domains/coding/task-specs/compound-learn.md`, `domains/coding/AGENTS.md`, hand-authored `plugins/fgOS/skills/retro-next/SKILL.md`. T8-06 text, T8-11, T8-13, T8-23 text, Q4. Source only; no render (L-8). WORK told before merge.
  - **P04 Doctor rows:** `src/setup/registrations.mjs` (`checkAgentClaimsResolve` only), `src/setup/model-pool-checks.mjs`, `test/setup/checks.test.mjs`, `test/setup/model-pool-checks.test.mjs`. T8-06 row half, T8-17. Collides with the doctor readiness plan on `registrations.mjs`: board line, rebase on whatever doctor landed; no registration change.
  - **P05 Persona projection:** `scripts/project-agents.mjs`, `test/scripts/project-agents.test.mjs`. T8-09.
  - **P06 Domain build:** `scripts/build-domain-registry.mjs`, the row body `checkDomainRegistryCompiled` (one import; coordinate with P04 on `registrations.mjs` by landing P04 first), one case in `test/state/domain-registry-compiled.test.mjs` (WORK file, WORK told). T8-14, T8-23 code.
  - **P07 Small scripts:** delete `scripts/measure-coordination-baseline.mjs`; `test/runner/assignment-enumerator-guard.test.mjs:114-115`; `core/skills/distill/scripts/distill.mjs`; `src/setup/instruction-projections.mjs` and its test. T8-12, T8-21, T8-18, T8-10 (after P01's compute-first order is on the branch).
  - **P08 Provisioning config:** `.fgos/config.yaml:230` per Q5 (+ T8-24). Board line for the config component; owner-machine guide line.
- **Wave 2, serial:**
  - **P09 Domain-dirs door:** new `src/util/domain-dirs.mjs` + `test/util/domain-dirs.test.mjs`; callers per Q7 (`skill-wrappers`, `instruction-registry`, `build-domain-registry`, `project-agents`, and with Q7 (a) `agent-definitions`, `agent-roster`, `operation-prompt-templates`, `registrations`, `loader`); `docs/architecture-manifest.json` for the leaf. After P01, P04, P05, P06.
  - **P10 Render and census:** one `npm run build:skills` with the staged addon after P00, P01, P02, P03, P07 are on the branch; regenerate `packages/git/contracts/mutation-census.v1.json` (OPC review). Checks the fixed point: a second run writes nothing.
  - **P11 Close:** Part A into `skill-package-distribution.md` and `domainization.md` (contract section 9 rows, Gemini rows per Q1), CHANGELOG (T8-02 "setup no longer rewrites other kits' skills", Q1, Q3, Q5), DOC told, re-measure on the activated release (same 22 test files at quiet load, `build:skills` warm, `worktree create`), closing report.

**Q6** is not a T8 phase: it rides with the CFG `controls` fix (`core/config-schema/runner.schema.yaml`, `docs/platform/config/spec.md`, `packages/config/contracts/fixtures/scope.v1.json`).

### 6.3 WORK-owned files left untouched by every phase

`src/state/domain-registry.mjs` (including `loadDomainsFromDisk` and `workerContractFor`; with Q7 (a) its loop becomes a WORK item, not a T8 edit), `domains/coding/compiled.json`, `domains/coding/registry.yaml` (`workerContract` field, F13 flag only), `domains/coding/workflows/feature.yaml` (`steps:` and `statusSkills`), `src/runner/{loop,claim-port,work-compat,work-dispatch,operation-choice,prompt-templates,fanout-batch}.mjs` (F12 flag only), `src/intake/*`, `src/verbs/state/{read,step}.mjs`, `test/state/domain-registry.test.mjs`, `test/state/handoff.test.mjs`, `test/state/knowledge-registry.test.mjs`, `test/cli/fgos-stage.test.mjs`, `test/skills/knowledge-canary.test.mjs`, `test/skills/fgos-coding-knowledge.test.mjs`. Touched only with WORK told: `test/state/domain-registry-compiled.test.mjs` (one case, P06), the text lines of `fgos-coding-implement`, `fgos-coding-shaping` and `fgos-routing` (P03).

## Unresolved questions

1. T8-10: does the Git port already report the skip-worktree flag? If not, the residual becomes an item for OPC rather than a new port verb.
2. T8-11: does `gitnexus analyze` write into `domains/coding/AGENTS.md`? Checked in P03 before the delete.
3. Q2's probe result decides between deleting about 3 400 generated lines and guarding them.
