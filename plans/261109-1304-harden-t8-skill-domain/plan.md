---
title: "HARDEN T8 sub-plan: Skill/Domain (skills, render surfaces, domain doctrine and registry)"
description: "Step 4 of the HARDEN per-layer loop for T8: the 25 accepted findings of the T8 arbitration and owner decision 79 (Q1 a, Q2 probe, Q3 b, Q4 a, Q5 kit-agnostic, Q7 a, Q8 a) split into twelve phases plus a close, one writer per hot file, seven leads in the widest group, net size below zero in every language, self-landing on fg-server2 and a Vietnamese owner-machine guide."
status: pending
priority: P1
effort: ~9.5d of lead work; ~4.5d critical path (P01 -> P02 -> P03 edit -> P11 -> P12 -> P13); widest group 7 leads
branch: main (plan only; each phase runs on its own track branch `harden/t8-pNN-<slug>` in its own linked worktree from origin/main)
tags: [harden, skill, domain, render, wrappers, doctrine, registry, worktree-provisioning, tests]
blockedBy: []
blocks: [261021-1118-harden-low-layers-bottom-up]
created: 2026-11-09
---

# HARDEN T8 sub-plan: Skill/Domain

`origin/main` `87e4d1e6f` (2026-11-09, fg-server2). Every `file:line` below was re-read on that commit; where the arbitration's line moved it is given at its current place (`src/setup/skill-wrappers.mjs` is 1 410 lines now, 1 362 when measured). Inputs: [arbitration](../reports/council-261109-1000-harden-t8-arbitration.md) (authority: §1 shapes, §2.1 accepted, §3 lead decisions L-1..L-10, §6.2 phase sketch), owner decision 79 in the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) (`^79\. `), the four seats and the [baseline](../reports/research-261109-0654-harden-t8-baseline.md) it merges, the [T6 sub-plan](../261108-0934-harden-t6-workflow/plan.md) for format. Where a seat and the arbitration differ, the arbitration wins; where owner decision 79 differs from the arbitration's recommendation, decision 79 wins (Q5 and Q6 below). This plan reopens no owner decision.

Citations, glossed once: **RUL104** (D-ADR0062, "better, not bigger": hardening adds no feature, layer or mechanism; a contract change moves every caller and deletes the old path); **RUL11** (D-ADR0054, "tum lum, not heavy": gather the mess inside the scope until it is gone; mess outside becomes its own item); **L10** (platform law: extend through the door, never beside it); design principles 1 (one door), 2 (bottom-up layering), 6 (KISS/DRY), 7 (one source of truth), 8 (one owning proof per behaviour); **D-ADR0035** (fgOS exists for other projects first, so a defect that hits a project using fgOS outranks one that hits only this repo).

## Outcome

When T8 closes: `npm run build:skills` either completes or refuses before its first write, and a second run writes nothing (the render is a fixed point: a deleted source file leaves no copy behind); the render, `fgos setup` and the plugin mirror write only skill names fgOS owns, only into a directory that is absent or carries fgOS's generated marker, refuse a same-name directory by name, and never follow a link; the Gemini prototype (about 590 lines, never a production caller) and the 87 tests of it and of skills deleted on 2026-10-01 are gone; one door answers "which skill names does fgOS own" (`ownedSkillNames`), one "which domains exist" (`listDomainDirs`), one "is this generated file ours" (an anchored stamp), one "copy a skill file" (a leaf that refuses a link); the two guards that judged `ak-*` vendor dirs judge only owned names; the reference copies beside each `.claude` wrapper are dropped when a live probe shows the host does not need them, otherwise a byte test keeps them honest; a worktree receives every foreign (git-ignored, not fgOS-owned) skill dir of the main checkout, with no kit name anywhere in fgOS; domain doctrine is read only from the payload of the running fgOS; the doctrine file of the coding domain carries no foreign managed block; the compiled domain registry, its doctor row and its test judge one set; the dead script, the dead fragments and the dead skill name `fgos-coding-compounding` are gone from every machine-read contract. All Node and text; no Rust; no change to `~/.fgos/config.json` schema.

**Limit stated, not closed:** the render and setup mirrors can only refuse what is provable (a marker, a link, an owned name). A foreign skill dir that carries fgOS's own marker is treated as fgOS's; the T9 setup retirement (arbitration §2.3) removes that surface later. The spec says so (P13).

## Target shapes (approved, decision 79 Q8 a)

Not copied. Read [arbitration §1](../reports/council-261109-1000-harden-t8-arbitration.md#1-part-a-target-shapes-for-owner-approval). Rust/Node boundary: **Node, no move**; no new spec file (settled shapes go into `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` and `docs/platform/domainization/architecture/domainization.md`, written in P13, DOC told first). Budgets (re-based on the lines now):

| Component | File(s) | Arbitration baseline | Now | Budget | Function budgets |
|---|---|---|---|---|---|
| Render pipeline | `src/setup/skill-wrappers.mjs` | 1 362 | 1 410 | ≤ 780 (Q1 a) | none over 130 |
| Render script | `scripts/build-skill-wrappers.mjs` | 42 | 30 | ≤ 30 (already `ensureAddonForScript` + one call) | - |
| Domain build | `scripts/build-domain-registry.mjs` | 79 | 79 | ≤ 95 | - |
| Persona projection | `scripts/project-agents.mjs` | 258 | 258 | ≤ 275 | - |
| Citation guard | `scripts/check-decision-citation-drift.mjs` | 515 | 515 | ≤ 503 | - |
| Dead script | `scripts/measure-coordination-baseline.mjs` | 464 | 464 | deleted | - |
| Domain-dirs door | `src/util/domain-dirs.mjs` | - | - | new, ≤ 25 | - |
| Skill source | `core/skills/_shared`, `domains/coding/skills/_shared` | - | 12 + 1 fragments | -2 fragments (-200 lines) | - |
| Domain doctrine | `domains/coding/AGENTS.md` | 89 | 89 | ≤ 9 (managed block and the duplicate prose gone; the phase diff-checks each rule first) | - |

Honest note on the `skill-wrappers.mjs` budget: it was set on 1 362 lines; the real start is 1 410 and the sum of the phase estimates reaches about 830. The budget binds. P02 continues the cut (helpers only the deleted code used, the duplicated core-then-domains walks into one `skillSourceRoots`) until it holds, or reports `DONE_WITH_CONCERNS` with the gap measured.

## Already landed (excluded from the phases)

| Item | State | Evidence |
|---|---|---|
| Baseline K1: both drift guards judged `ak-*` vendor dirs, red in every worktree | **done** `27b2c580c` (2026-11-09 07:20) | guards judge `ownedFileSet` (`scripts/lib/git-ports.mjs`) |
| T8-01 + T8-02 (the two Highs): `build:skills` staged the addon only after writing; the wrapper step rewrote every `ak-*` | **done** `6f98ce04a` on main, board/report `e169da457` | `ownedSkillNames(...roots)` (`skill-wrappers.mjs:163`), `ownedSkillDirs` (`:177`), `renderSkillSurfaces(root)` (`:1401`: owned set and instruction projection computed before the first write), `ensureAddonForScript` in the script. Tests: foreign `ak-x` under all three roots survives a render; setup leaves a foreign target byte-identical and never copies a package `ak-x`; a projection refusal leaves the tree untouched; the script with no staged addon completes or exits before its first write. Report `plans/reports/lead-261109-1057-harden-t8-wrappers-owned-names.md` |
| P00 of the arbitration: skip-worktree write-back removal (gate for any `build:skills` run in a linked worktree, L-9) | **done** `115128df2` on main, board `a00e14c38` | `fgos worktree remove` accepts a skip-worktree regular file equal to the index. The gate is satisfied; P12 may run `build:skills` in its worktree. The staging half (T8-10) stays open in P09 |

Open from that lead report, now in the plan: the orphan prune of `.claude` wrappers still tests the marker with `includes` (a foreign skill that quotes the marker is pruned) = T8-15 in P02; `materializeSkillsIntoProject` takes its copy filter from `ownedSkillNames(packageRoot, targetRoot)` (`skill-wrappers.mjs:1357`, the union of both roots) = OPC's note, in P02.

## Where each item goes

| Item (arbitration id) | Phase |
|---|---|
| T8-03 retire the 63 reference-model and retired-skill tests; Q1 (a) delete the Gemini generator, adapter classifier and their 24 tests, fix the Packaging contract rows; T8-16 (falls out of Q1); T8-19 remove `checkDuplicates`/`checkCollisions` | [P01](phase-01-render-core-deletions.md) |
| T8-04 render is a fixed point; T8-05 one copy leaf that refuses a link; T8-15 anchored stamp; Q3 (b) same-name dir without the marker refused by name; OPC note: `materializeSkillsIntoProject` copy filter from the package root alone; T8-25 drift-guard message; one `skillSourceRoots` | [P02](phase-02-render-core-correctness.md) |
| Q2: live probe, then drop the `.claude` reference copies (pass) or keep them with a byte compare (fail) | [P03](phase-03-claude-reference-copies.md) |
| T8-07 mirror guard over owned names and `instruction-audit` tracked (L-4); T8-08 citation guard stops sweeping `.agents/skills`; T8-22 in-process cases | [P04](phase-04-guards.md) |
| T8-06 text, T8-11, T8-13, T8-23 text, Q4 (a) doctrine from the payload only | [P05](phase-05-source-text-and-doctrine.md) |
| T8-06 doctor row half, T8-17 `executor-skills-installed` | [P06](phase-06-doctor-rows.md) |
| T8-09 persona projection refusals (L-5: the script stays) | [P07](phase-07-persona-projection.md) |
| T8-14 one compiled-domain check, T8-23 duplicate key | [P08](phase-08-domain-build.md) |
| T8-12 dead script, T8-21 distill name rule, T8-18 durable write, T8-10 effective-set staging refusal | [P09](phase-09-small-scripts.md) |
| Q5 (owner correction): worktree gets every foreign skill dir, kit-agnostic; T8-24 idempotent | [P10](phase-10-worktree-skill-provisioning.md) |
| T8-20 / Q7 (a): `listDomainDirs`, T8, T5 and T6 callers, item for WORK | [P11](phase-11-domain-dirs-door.md) |
| L-8: one render and census step | [P12](phase-12-render-and-census.md) |
| Spec Part A, contract rows, CHANGELOG, re-measure, Vietnamese guide, closing report | [P13](phase-13-spec-measure-close.md) |

**Not in T8:** Q6 (`launchConfinement.ownWorktree` becomes `x-fgos-merge: tighten`) is a separate config item that rides with the CFG `controls` fix; decision 79's leftovers (i) the two load-sensitive TEST reds, (ii) the `t2-verify` worktree check, (iii) `fgctl` in the release payload are separate items; none is a phase here. Settled without a phase: the arbitration §2.2 rejections (`catchup-self-recovery.md` stays, `workerContractFor` is flagged to WORK only, `.gitignore` allowlist stays, no `ak-*` name filter in any guard, no skip-if-unchanged cache), §2.3 routed items, §5 ideas F-1..F-9 (not taken; F-8 hardlink is revisited inside P10 as a probe because decision 79 Q5 asks for it).

## Facts this plan rests on (verified on `87e4d1e6f`)

1. **Ownership is read from sources.** `ownedSkillNames` (`skill-wrappers.mjs:163`) calls `discoverCanonicalSkills` per root (`:659`), which is the function the Gemini intent loop lives inside (T8-16): deleting Gemini and keeping the owned-name door are the same edit in one file, so P01 owns the whole of it.
2. **Four copy leaves follow links.** `copyDirRecursive` (`:336`, `isDirectory` false for a link falls to the file copy), `atomicCopyFileSync` (`:78`), `copyAssembledFile` (`:1202`), `carriesAssembledHeader` (`:1223`, `statSync`). Call sites of `copyDirRecursive`: `:226`, `:372`, `:1113`, `:1295`, `:1378`.
3. **The stamp tests are substring tests.** `isGeneratedWrapper` (`:147-153`) uses `includes(GENERATED_WRAPPER_MARKER)`; the marker is the first non-blank line after the frontmatter in `generateWrapperContent` (`:125-140`); `carriesAssembledHeader` uses `includes(ASSEMBLED_HEADER_PREFIX)` (`:1230`) while `withGeneratedHeader` (`:1194`) puts the header on the first line after the frontmatter.
4. **The setup copy takes the union.** `materializeSkillsIntoProject` (`:1353`) computes `owned = ownedSkillNames(packageRoot, targetRoot)` and copies `ownedSkillDirs(sourceAgentsSkills, owned)` (`:1377`): a package skill whose name equals the target's own core skill is copied over it. The one caller outside tests is `bin/fgos.mjs:4032`.
5. **The domain walk is repeated 13 times in 9 files**, not counting WORK's: `src/workflow/loader.mjs:30`, `src/setup/instruction-registry.mjs:679`, `src/runner/agent-roster.mjs:48`, `src/runner/dispatch/operation-prompt-templates.mjs:223,300`, `src/runner/agent-definitions.mjs:45`, `src/setup/registrations.mjs:782,1129`, `scripts/project-agents.mjs:122`, `scripts/build-domain-registry.mjs:49`, `src/setup/skill-wrappers.mjs:451,479,700,918,956` (the first two and `:956` are inside code Q1 deletes), plus `src/state/domain-registry.mjs:72` (WORK's, not edited). After P01 the skill-wrappers loops left are the ones `assembleSkills` reaches.
6. **The doctrine path is project-relative today.** `core/skills/fgos-routing/SKILL.md:180-181,232` tell an agent to read `domains/<domain>/AGENTS.md` by a relative path; `materializeSkillsIntoProject` copies no `domains/`. Whether an existing verb reports the payload root is checked in P05 (arbitration idea F-2 only if none does).
7. **`fgos-coding-compounding` is still named in 12 files** (`grep -rln` over `core domains plugins`): `core/skills/fgos-routing/SKILL.md`, `core/skills/fgos-indexing/SKILL.md`, `core/task-specs/fgos-indexing.md`, `core/agents/fgos-placeholder.yaml`, `core/agents/docs-manager.yaml`, `domains/coding/task-specs/compound-learn.md`, `domains/coding/skills/fgos-coding-implement/SKILL.md`, and in `plugins/fgOS/skills/`: `retro-next`, `retro-loop` (hand-authored) plus the generated mirrors of `fgos-coding-implement`, `fgos-routing`, `fgos-indexing` (re-rendered in P12). The arbitration listed `retro-next` only; `retro-loop/SKILL.md` is added here.
8. **The two guards.** `scripts/check-decision-citation-drift.mjs:321` `WIDE_SWEEP_ROOTS` still contains `.agents/skills`; `collectWideSourceFiles` (`:340`) has no owned filter. `test/skills/fgos-mirror.test.mjs:48` filters by `startsWith('fgos-')`.
9. **Skills are tracked or ignored by an allowlist.** `.gitignore:68-79` ignores `/.claude/skills/*` and `/.agents/skills/*` and re-includes `fgos-*`, `distill`, `_shared` (both) and `instruction-audit` (`.agents` only). So "git-ignored dir under a skill root" is exactly "not fgOS-owned" once P04 adds the `.claude` line, and a shell test on it needs no kit name (P10).
10. **Provisioning keeps a record.** `provisionWorktree` (`src/runner/worktree.mjs:224`) records every new untracked or ignored path (a file by digest) so `fgos worktree remove` takes back exactly those bytes (`setProvisionedAside`, `:269`); `runWorktreeSetupCommands` (`:143`) reads `worktreeSetup.commands` from the main checkout's config and runs each through a shell with `FGOS_REPO_ROOT` set. The line today (`.fgos/config.yaml:257`) is `cp -R "$FGOS_REPO_ROOT/$d"/ak-*` over five roots. The config key has no kit semantics (`core/config-schema/worktreeSetup.schema.yaml`, default `[]`).
11. **Impact analysis is degraded** (same as T6 fact 14: provider not `present`). Every lead lists callers with `rg` and names the gap ("GitNexus registered but not present on this machine; blast radius by rg").
12. **Machine load.** The arbitration's full suite ran at load 28 to 40 (`loop.test.mjs` over its 600 s limit alone). Seven leads at once is the plan's width, not a load budget: start the high-value phases first (order in "Parallel groups") and read the board HOLD lines before any suite.

## Phases

| # | Phase | Depends on | Group | Hot files written | Δ Node / Rust / tests (estimate) |
|---|---|---|---|---|---|
| 01 | [Render core: deletions](phase-01-render-core-deletions.md) | none | A (chain head) | `skill-wrappers.mjs`, `skill-wrappers.test.mjs`, contract `skill-package-distribution.md` | -620 / 0 / -3 030 |
| 02 | [Render core: correctness](phase-02-render-core-correctness.md) | 01 | B (chain) | `skill-wrappers.mjs`, `skill-wrappers.test.mjs`, `build-skill-wrappers.mjs` (only if needed) | +50 / 0 / +60 **landed** |
| 03 | [`.claude` reference copies](phase-03-claude-reference-copies.md) | probe: none; edit: 02 (and 04 on the fail branch) | A (probe), C (edit) | `skill-wrappers.mjs`, `skill-wrappers.test.mjs`, `fgos-mirror.test.mjs` (fail branch) | pass -20 / 0 / -10; fail 0 / 0 / +10 **landed** |
| 04 | [Guards](phase-04-guards.md) | none | A | `fgos-mirror.test.mjs`, `check-decision-citation-drift.*`, `.gitignore` | -13 / 0 / +22 **landed** |
| 05 | [Source text and doctrine](phase-05-source-text-and-doctrine.md) | none | A | `core/skills/**` text, `domains/**` text, `core/agents/*.yaml`, `domains/coding/AGENTS.md` | 0 / 0 / 0 (text -280) |
| 06 | [Doctor rows](phase-06-doctor-rows.md) | none | A | `registrations.mjs` (`checkAgentClaimsResolve`), `model-pool-checks.mjs` | +14 / 0 / +25 **landed** |
| 07 | [Persona projection](phase-07-persona-projection.md) | none | A | `project-agents.mjs` | +12 / 0 / +30 **landed** |
| 08 | [Domain build](phase-08-domain-build.md) | 06 for the `registrations.mjs` line only | B | `build-domain-registry.mjs`, `registrations.mjs` (`checkDomainRegistryCompiled`) | +10 / 0 / +10 |
| 09 | [Small scripts](phase-09-small-scripts.md) | none | A | `measure-coordination-baseline.mjs` (deleted), `distill.mjs`, `instruction-projections.mjs` | -447 / 0 / +8 |
| 10 | [Worktree skill provisioning](phase-10-worktree-skill-provisioning.md) | none | A | `worktree.mjs`, `agent-skill-dirs.mjs`, `.fgos/config.yaml` (line removed) | +43 / 0 / +36 **landed** |
| 11 | [Domain-dirs door](phase-11-domain-dirs-door.md) | 03, 06, 07, 08 landed | D (alone) | one import line per caller, new leaf | -25 / 0 / +25 |
| 12 | [Render and census](phase-12-render-and-census.md) | 01-05, 09, 11 | E (alone) | all generated surfaces, census | 0 / 0 / 0 (generated about -4 300 with Q2 pass) |
| 13 | [Spec, measure, close](phase-13-spec-measure-close.md) | 01-12 | close | spec, contract, guide, report | 0 / 0 / 0 |

Sum of the Node column: about -1 040 (arbitration estimate -1 040); tests about -2 870 (estimate -2 830); Rust 0; generated text about -4 300 with the Q2 pass branch (about -900 on the fail branch). Layer total at or below zero in every language and on both Q2 branches.

```
group A (start together, file-disjoint):
         P01 (chain head)  ∥  P03 probe step (no file written)  ∥  P04  ∥  P05  ∥  P06  ∥  P07  ∥  P09  ∥  P10
         start order if load is high: P01, P06, P09, P05 first (value: the chain head, the doctor row, the dead script), then P04, P07, P10, P03 probe
group B: P02 after P01;  P08 after P06 (its registrations.mjs line)
group C: P03 edit step after P02 (and after P04 on the fail branch, which appends to fgos-mirror.test.mjs)
group D: P11 alone, after P03, P06, P07, P08 (and P01, P02 for skill-wrappers.mjs): one import per caller file
group E: P12 alone, after P01-P05, P09, P11 on the branch (one render, one census regen)
close:   P13
critical path: P01 -> P02 -> P03 edit -> P11 -> P12 -> P13
```

**First batch to start now:** P01, P05, P06, P09, P04, P07, P10, and the P03 probe. P02 starts the moment P01 lands.

## Hot-file chains (one writer at a time)

| Hot file | Writers, in order |
|---|---|
| `src/setup/skill-wrappers.mjs` | P01 -> P02 -> P03 (edit) -> P11 (import lines) |
| `test/setup/skill-wrappers.test.mjs` | P01 -> P02 -> P03 (edit); P09 does not touch it |
| `src/setup/registrations.mjs` | P06 (`checkAgentClaimsResolve`) -> P08 (`checkDomainRegistryCompiled`, one import) -> P11 (two domain loops, `:782`, `:1129`) |
| `test/skills/fgos-mirror.test.mjs` | P04 -> P03 (fail branch only) -> P12 (one assertion: every owned name has a tracked render in both trees) |
| `scripts/build-domain-registry.mjs` | P08 -> P11 |
| `scripts/project-agents.mjs` | P07 -> P11 |
| `.fgos/config.yaml` | P10 (the `worktreeSetup` line only; the config component owns the file, a board line announces it) |
| generated surfaces (`.agents/skills`, `.claude/skills`, `plugins/fgOS/skills` mirror part) | P12 only |

## File ownership (no two phases of one group share a source file)

Rebase-only (never a reason to serialize; regenerate or re-apply on rebase): `CHANGELOG.md`, `packages/git/contracts/mutation-census.v1.json` (`node scripts/git-one-door-scan.mjs --write-census`), `docs/architecture-manifest.json` (the phase that adds, moves or deletes a file), `plans/reports/guide-*-owner-machine-harden-t8-skill-domain.md` (each phase appends its own section). `test/suite-baseline.json` is TEST's: report retired files, never hand-edit. A one-line import change in another lane's file is allowed in the commit that moves the symbol and is named under "Cross-lane one-liners" in its phase.

| File(s) | Phases, in order |
|---|---|
| `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` | 01 -> 02 -> 03 -> 11 (source only) |
| `scripts/build-skill-wrappers.mjs` | 02 (only if the render door needs it; it is already at budget) |
| `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` (Gemini rows only), `docs/platform/packaging-distribution/verification/implementation-alignment.md` (Gemini row) | 01 (the rows the deletion makes false); 13 (everything else) |
| `test/skills/fgos-mirror.test.mjs` | 04 -> 03 (fail branch) |
| `scripts/check-decision-citation-drift.mjs`, its `.baseline.json`, `test/scripts/check-decision-citation-drift.test.mjs` | 04 |
| `.gitignore` | 04 |
| `core/skills/**` text (not `core/skills/distill/scripts`), `domains/*/skills/**` text, the two `_shared` deletions, `core/agents/*.yaml`, `core/task-specs/fgos-indexing.md`, `domains/coding/task-specs/compound-learn.md`, `domains/coding/AGENTS.md`, `plugins/fgOS/skills/retro-next/SKILL.md`, `plugins/fgOS/skills/retro-loop/SKILL.md` | 05 (source only, no render) |
| `src/setup/registrations.mjs` | 06 -> 08 -> 11 |
| `src/setup/model-pool-checks.mjs`, `test/setup/model-pool-checks.test.mjs`, `test/setup/checks.test.mjs` | 06 |
| `scripts/project-agents.mjs`, `test/scripts/project-agents.test.mjs` | 07 -> 11 |
| `scripts/build-domain-registry.mjs`, new `test/scripts/build-domain-registry.test.mjs` (or one case in WORK's `test/state/domain-registry-compiled.test.mjs`, WORK told) | 08 -> 11 (script import only) |
| `scripts/measure-coordination-baseline.mjs` (deleted), `test/runner/assignment-enumerator-guard.test.mjs` (two rows), census line | 09 |
| `core/skills/distill/scripts/distill.mjs` | 09 |
| `src/setup/instruction-projections.mjs`, `test/setup/instruction-projections.test.mjs` | 09 |
| `.fgos/config.yaml` (worktreeSetup line only) | 10 |
| new `src/util/domain-dirs.mjs`, new `test/util/domain-dirs.test.mjs`, `docs/architecture-manifest.json` row | 11 |
| callers of `listDomainDirs` (one import and call each): `src/setup/instruction-registry.mjs`, `src/runner/agent-roster.mjs`, `src/runner/dispatch/operation-prompt-templates.mjs`, `src/runner/agent-definitions.mjs`, `src/workflow/loader.mjs` | 11 (single writer; no other phase edits them) |
| generated surfaces, `plugins/fgOS/skills/<mirror>`, census, one test in `test/skills/fgos-mirror.test.mjs` | 12 |
| `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` (rest), `docs/platform/domainization/architecture/domainization.md`, `docs/backlog.md`, the HARDEN plan T8 row, board `log.md` line, closing report, guide | 13 |

### WORK-owned files no phase touches

`src/state/domain-registry.mjs` (including `loadDomainsFromDisk`, `:72`, and `workerContractFor`; its domain loop becomes a WORK item filed in P11, not a T8 edit), `domains/coding/compiled.json`, `domains/coding/registry.yaml` (the `workerContract` field is a flag only), `domains/coding/workflows/feature.yaml` (`steps:` and `statusSkills`), `src/runner/{loop,claim-port,work-compat,work-dispatch,operation-choice,prompt-templates,fanout-batch}.mjs` (`work-compat.mjs:159-160` `skillPath` can be `.claude/skills/null/SKILL.md`: flag only), `src/intake/*`, `src/verbs/state/{read,step}.mjs`, `test/state/domain-registry.test.mjs`, `test/state/handoff.test.mjs`, `test/state/knowledge-registry.test.mjs`, `test/cli/fgos-stage.test.mjs`, `test/skills/knowledge-canary.test.mjs`, `test/skills/fgos-coding-knowledge.test.mjs`. Touched only with WORK told before merge: `test/state/domain-registry-compiled.test.mjs` (at most one case, P08); the text lines naming the dead skill in `domains/coding/skills/fgos-coding-implement/SKILL.md`, the `fgos-discover` wording in `domains/coding/skills/fgos-coding-shaping/SKILL.md:20`, and the doctrine-path lines of `core/skills/fgos-routing/SKILL.md` (P05).

## On-disk and behaviour changes this plan makes

| Format or behaviour | Phase | Previous release reads it? |
|---|---|---|
| `fgos setup` refuses (names, does not overwrite) a skill dir in a target project that has the same name as an owned skill but carries no fgOS marker; refuses a link in a skill source or target | 02 | n/a (refusal at write time); an older release still overwrites |
| render deletes files the source lacks inside owned skill dirs and `fgos-*` plugin dirs absent from `.agents` | 02 | yes (same trees, fewer files) |
| no Gemini package generator; no `checkDuplicates`/`checkCollisions` options | 01 | n/a (never had a production caller) |
| `.claude/skills/<skill>/references/*` copies removed (pass) or byte-checked (fail) | 03, 12 | yes: wrappers point at `.agents/skills`; an older release regenerates the copies |
| `.claude/skills/instruction-audit` tracked | 04, 12 | yes |
| worktree create copies every foreign skill dir (git-ignored, not fgOS-owned) of the main checkout instead of `ak-*` | 10 | yes (config line; the owner machine applies it by the guide) |
| `agent-claims-resolve`, `executor-skills-installed`, `domain-registry-compiled` judge more; ids and count unchanged | 06, 08 | yes |
| `domains/coding/AGENTS.md` loses the GitNexus managed block | 05 | yes |

No `~/.fgos/config.json` schema change in any phase, so no all-machines-together activation. The one config-file line (P10) is the project's own `.fgos/config.yaml` and reaches the owner machine and fg-server by `git pull` plus the guide.

## Acceptance criteria (layer)

1. Every row of "Where each item goes" is done; every Medium/Low not reproduced at arbitration (T8-04, -05, -15, -09, -14, -17, -18, -21, -23) has a red test, or for a structure-only finding a recorded red scan, in its phase report before its fix.
2. Budgets of the Target shapes table met, printed by `wc -l` and the function-length scan in P13; `skill-wrappers.mjs` ≤ 780 or the gap named.
3. Doors, scanned (each returns the stated count): `rg -n "generateGeminiSkillPackage|SKILL_ADAPTER_TARGETS|isGeneratedAdapterTarget|isCanonicalSkillSource|checkDuplicates|checkCollisions" src scripts test bin` nothing; `rg -n "readdirSync\(.*domains" src scripts bin` only `src/state/domain-registry.mjs` (WORK's, filed) and `src/util/domain-dirs.mjs`; `rg -n "includes\(GENERATED_WRAPPER_MARKER\)|includes\(ASSEMBLED_HEADER_PREFIX\)" src` nothing; `rg -n "\bak-[a-z]|ak-\*" src scripts bin` nothing (today one comment, `src/setup/model-pool-checks.mjs:58`, which P06 rewrites) and `git show origin/main:.fgos/config.yaml | rg "\bak-"` nothing (the file is skip-worktree in linked worktrees, so it is read from the ref); a kit name in fgOS code or config is a defect; `rg -c "fgos-coding-compounding" core domains plugins` nothing.
4. Behaviour, each by its owning test: a link in a skill source or target is refused by name; a second render writes nothing; a render after a source deletion leaves no stale copy; a foreign skill dir is left byte-identical in all three trees; a same-name dir without the marker is refused by name by render and setup; a package skill never overwrites a target's own core skill; a foreign skill that quotes the marker is not pruned; a projection refusal leaves the tree untouched (landed); both drift guards and `fgos-mirror` judge owned names only and every owned name has a tracked `.agents` and `.claude` render; `agent-claims-resolve` refuses a claim whose skill name is not owned; `executor-skills-installed` accepts a user-level skill dir and refuses an empty `SKILL.md`; `domain-registry-compiled` flags a compiled domain with no `registry.yaml` and a duplicate workflow key is refused; `project-agents` refuses an unstamped target and a newline in a scalar; and, by the recorded smoke of P10 (the config file is skip-worktree where tests run, so no test can read the line), a worktree created from a main checkout with three foreign skill dirs holds all three, a rerun does not nest, and no owned dir is copied over its checkout.
5. Measured in P13 on the activated release (same machine and load class as the baseline): the T8-owned test files (the same 22) at quiet load ≤ 13 s; warm `npm run build:skills` ≤ 1.5 s and a second run writes nothing; `fgos worktree create` time and bytes recorded (the real copy keeps every foreign dir: the arbitration's 8 759 files and 89 MB per worktree stay unless P10's probe shows the hardlink is safe); tracked generated text 24 069 lines now, about 20 000 with the Q2 pass.
6. Every retired test names the test that now owns its behaviour (or says the behaviour was removed): P01 writes the retired-title -> owner table **before** deleting (the big lead reviews it) and the commit body carries it; P09 and P12 name theirs.
7. Land gate green at each land; doctor row ids and count unchanged (three rows judge more, none added or lost); no condition of the arbitration §1 doctor table lost.
8. Net size of HARDEN T8 commits ≤ 0 per language, measured in P13: Node about -1 040, Rust 0, tests about -2 870 (estimate sums above; the landed `6f98ce04a` is counted in the baseline, not here).

## Land gate (every phase, run by the lead on a host built from the tree, then re-run by the big lead)

- Read the board head for HOLD lines before any full suite.
- Full `npm test` through `node scripts/run-tests.mjs` (it takes the machine-wide full-suite queue), every `HERDR_*` and `CLAUDE*` variable unset, private `CARGO_TARGET_DIR` under `/home/vantt/projects/forgent-worktrees/<branch>-target` (never `/tmp`, never tmpfs); read both the ERROR lines and the fail count. Known pre-existing red: the V7n frozen addendum test (MAIL); the load-sensitive reds named in decision 79 leftover (i) until they land; `loop.test.mjs` can exceed its 600 s limit at load over 28 (the lead report shows it fails alone with no skill reference): name them, do not weaken them.
- One-door census: `node scripts/git-one-door-scan.mjs --root .` reports 0 undeclared (every edit to a hashed file regenerates the census in the same commit).
- Rust is not touched: no `cargo` gate.
- On any docs change or `src/` deletion: `test/scripts/doc-health.test.mjs` and `test/scripts/check-decision-citation-drift.test.mjs`.
- `test/architecture.test.mjs` on any `src/` file add, move or delete (P11 adds `src/util/domain-dirs.mjs`; its manifest row goes in the same commit).
- `test/setup/skill-wrappers.test.mjs`, `test/skills/fgos-mirror.test.mjs` on any phase that edits a skill source or a render.
- `build:skills` is run **only by P12**, never by another phase and never in a worktree before P12 (L-8, L-9: the skip-worktree guard half has landed, `115128df2`, but one render per wave stays the rule because every render rewrites three trees and two census hashes per file).

## Lead rules (every brief carries these)

- One Sonnet lead per phase, own linked worktree from `origin/main` (never local main), own ext4 `CARGO_TARGET_DIR` under `/home/vantt/projects/forgent-worktrees/<name>-target`, deleted when the phase lands; stop every process you started. Guard `cd` before any cleanup: assert the worktree path first.
- **Find the owning test before writing a new one** (design principle 8); a retired test names its new owner in the phase report and the commit body; never weaken an assertion of a behaviour that still exists; a deleted mechanism retires its tests in the same change.
- **Red first:** each fix whose finding was not reproduced starts with a failing test committed on the branch; a structure-only finding starts with a recorded failing scan (`rg -c`, the function-length scan).
- Focused Node tests only through the FR one-liner (never `npm test` or `scripts/run-tests.mjs <file>`), with `FGOS_HOST_BIN` naming a host built from the worktree:
  `node --input-type=module -e "import { runSelectedTests, buildTestEnv } from './scripts/run-tests.mjs'; import { ensureGitAddon } from './scripts/lib/git-addon-stage.mjs'; const env = buildTestEnv(process.env); ensureGitAddon(env); process.exitCode = runSelectedTests(process.argv.slice(1), { env }).status;" -- <test files>` (FR). No focused run in a worktree while a full suite runs there. Never SIGKILL a test run; message the big lead before any heavy run.
- Callers by `rg` before editing any exported symbol (fact 11); name the gap in the report.
- `git diff --cached --stat` before every commit; explain any large deletion or empty file; stage explicit paths.
- User-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md`.
- RUL104 and L10: change a contract -> move every caller and delete the old path in the same change; no new mechanism beyond the phase's approved item; no env switch, flag or test-only branch to make a test pass; no new compatibility fence (owner decision 1).
- No plan ids, phase numbers, finding codes or `ak-*`/kit names in code, tests, config or commit messages; trim existing ones in code the phase touches.
- Report: delta lines per language next to the phase estimate, test-cost line (tests added/retired, new spawns and why), red evidence per fix; name from `fgos convention name --kind report --type phase-lead --slug harden-t8-pNN-<slug> --json`; only what you ran yourself; end with `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`.

## Landing (decision 79, Q8 a)

- **Landing unit.** `skill-wrappers.test.mjs`'s drift guard compares skill sources with their renders, so a phase that edits a skill source cannot land alone. P05 (text and fragment deletions), the `distill.mjs` commit of P09, and P12 (the render) are pushed together as one fast-forward of consecutive commits with the gate run on the tip, in one announced window, and skill sources are on a board HOLD for the window. Every other phase lands on its own when its gate passes.
- **fg-server2 self-lands each phase** when its land gate passes, in a quiet window announced on the board (one `log.md` line with window and branch): rebase on `origin/main`, gate, `git log origin/main..HEAD` before push; build, stage, activate the release on fg-server2; `fgos doctor` and the phase's smoke. WORK, TEST, ES, COOK told before the window for the phases that touch their files (P05, P08, P11). OPC reviews P09 (`instruction-projections.mjs` staging refusal and the census line), P12 (census) and P11's `docs/architecture-manifest.json` row.
- **Owner machine and fg-server:** one Vietnamese guide, name from `fgos convention name --kind report --type guide --slug owner-machine-harden-t8-skill-domain --json` at the first landing, linked from the board; one section per landed phase: main commit, what changes for the user, commands (pull, build/stage/activate on forgentX and on `~/projects/forgent` on fg-server, doctor, smoke), expected doctor rows, rollback. P10's section carries the new `worktreeSetup` line and says which machine applies it. P13 finishes it.
- **Rollback per phase:** revert the phase's merge commit on `main`, re-activate the previous release on both machines (prior release id recorded in the guide), record the revert SHA on the board. Once a later phase has merged on top, roll forward with a fix.

## Cross-lane steps (explicit, each owned by a phase)

| What | Other side | Step | Phase |
|---|---|---|---|
| Retired tests list ("mirrors / contract-prose" labels, 63 + 24) | TEST (closed; decision 69 precedent) | board line with the list the day P01 lands; no wait | P01 |
| Packaging contract rows for Gemini, `skill-package-distribution.md:64,75,111`, and the verification alignment row | DOC | message the DOC lead with the paths before P01 merges; DOC owns wording of the rest in P13 | P01, P13 |
| Text edits in Work-adjacent skills (`fgos-coding-implement`, `fgos-coding-shaping:20`, `fgos-routing`) | WORK | message before P05 merges; edits are delete-only renames of a dead name and the doctrine path | P05 |
| One case in `test/state/domain-registry-compiled.test.mjs` | WORK | WORK told; if WORK refuses, the case goes in new `test/scripts/build-domain-registry.test.mjs` | P08 |
| `src/state/domain-registry.mjs:72` loops over `domains/` by hand | WORK | backlog row (`fgos identity mint backlog`) and board line in P11; no edit | P11 |
| `.fgos/config.yaml` `worktreeSetup` line | config component and owner machine | board line before the edit; owner machine applies by the guide | P10 |
| `packages/git/contracts/mutation-census.v1.json`, `git-one-door-scan` exception rows | OPC (Git reviewer) | regenerate in the commit; OPC glances at P09, P12 | P09, P12 |
| T8-10: does the Git port report a skip-worktree flag | OPC | question in P09 item 4; no port verb is added (RUL104): if none answers, an item for OPC | P09 |
| Items to file the turn they are found | T9/Packaging (setup retirement, `npm pack` list, hardened `fgctl`), OPC (idea F-9) | one backlog row each, ids from `fgos identity mint backlog` | P13 |

## Red-team of this plan (planner, against code)

| Id | Risk | Sev | Disposition |
|---|---|---|---|
| RT-1 | The marker refusal (Q3 b) would break a project whose `.claude/skills/<owned-name>` was generated by an older fgOS release with a different marker text | High | P02 step 1 greps `git log -S"This is a generated thin wrapper"` and `-S"Generated by fgOS skill assembly"` for earlier forms; the check accepts every form a release ever wrote, proven by a fixture per form. Unknown form -> refused by name with the one-line remedy (remove the dir), never overwritten |
| RT-2 | The fixed-point delete removes a file a project edited inside an owned skill dir | Med | Only files inside owned dirs are removed, and only inside dirs that already carry the marker or are absent (Q3 b); `createProjectSkillGuard` still keeps a tracked, dirty or newer-version file first. Test: a user-added file in a marked owned dir under `fgos setup` is removed only when the guard does not keep it, with the case stated |
| RT-3 | The link refusal turns an existing symlinked skill source into a failed render | Med | `rg` over `core/skills` and `domains/*/skills` for links before the red test (`find ... -type l`); none expected. If one exists, it is converted to a file in P02 and named |
| RT-4 | The probe (P03) passes because the worker reached the file through the wrapper's own redirect line, not the host's relative resolution, hiding a gap for hosts that resolve relatively | Med | The probe step records which path the seat opened (tool call log) and the wrapper text it followed; the pass condition is "opened `.agents/skills/<skill>/references/<file>` after following the wrapper". A relative-path attempt that failed and then recovered is a fail branch (keep copies) |
| RT-5 | Dropping `.agents/skills` from the citation sweep (P04) hides a real citation | Low | The 59 baseline entries have 0 unique (each has its byte twin under `plugins/fgOS/skills`, arbitration §2); P04 re-runs that comparison before deleting |
| RT-6 | `listDomainDirs` (P11) changes ordering for a caller that sorted and one that did not | Med | The leaf sorts (the majority form: `agent-roster.mjs:48`, `loader.mjs:30`, `registrations.mjs:782,1129`, `project-agents.mjs:122`); P11 lists the callers that did not sort and the test proves none depended on directory order |
| RT-7 | P12 renders after seven phases landed in quick succession and a late rebase changes a source | Med | P12 starts only after the last of its dependencies is on `origin/main`, runs `build:skills` twice (second writes nothing) and compares against `git status`; any diff outside the expected set is explained or reverted |
| RT-8 | The worktree line copies a git-ignored directory that holds secrets (an ignored `.claude/skills/<x>` with a config file) into every worktree | Med | Same exposure class as today's `cp -R` of five roots; the worktree is the same user's, same repo. The rule copies only dirs directly under the five skill roots; stated in the guide. No broader glob |

## Unresolved questions (for the big lead)

1. **P10, where the Q5 rule lives.** Decision: the `worktreeSetup.commands` line, no code (it can express it: five roots, `git check-ignore` as the "not fgOS-owned" test, copy-if-absent). Cost of that choice: it serves projects that carry such a line, not every project using fgOS by default. The code alternative is a default step in `provisionWorktree` (`src/runner/worktree.mjs:224`), which is a new default behaviour for every project and therefore a new mechanism by RUL104. Say if the owner wants the code form.
2. **P10, hardlink.** Expected result of the probe: not safe (an in-place write through a hardlink changes the main checkout's file and every other worktree's), so the line copies for real and the 8 759 files / 89 MB per worktree (3.7 to 4.4 s) stay. The arbitration's 92 percent cut came from naming nine skills and is gone with decision 79's correction. Idea F-6 (derive from `supports.skills`) and F-8 remain unaccepted ideas.
3. **P05, Q4 (a).** If no existing verb prints the payload root, the skill can only say where the doctrine is, not give a path an agent can open; that makes idea F-2 (a small verb) the real fix, which is the owner's to pick.
4. **`core/skills/_shared/ak-cook-worker-contract.md`** names an `ak-` skill in a core fgOS file name. Decision 79 Q5 forbids kit names in provisioning; this file is a worker contract for an executor id, outside T8. Flag to COOK/T6, no edit here.
5. **P10, how the config line is committed.** `.fgos/config.yaml` is tracked but `skip-worktree` in every linked worktree (`git ls-files -v` prints `S`; the file is absent there), and the main checkout carries 27 uncommitted local lines in it (`git status` at plan time). The commit must hold only the `worktreeSetup` hunk. P10 step 1 names the route (the config door `fgos config set`/`patch` on a clean copy, or a temporary index) and has the big lead confirm it before the commit; the owner's local lines never enter it.
6. P09 T8-10: whether the Git port reports the skip-worktree flag (if not, an item for OPC).
7. P05 T8-11: whether `gitnexus analyze` writes into `domains/coding/AGENTS.md` (checked before the delete; else its config excludes the path).
