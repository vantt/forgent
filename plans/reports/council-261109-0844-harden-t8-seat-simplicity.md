# HARDEN T8 council: SIMPLICITY seat (one door, dead code, size)

Read-only review of layer T8 Skill/Domain at `origin/main` `02a461f55` (fg-server2, 2026-11-09, Asia/Saigon). Inputs: the [T8 baseline](research-261109-0654-harden-t8-baseline.md), the format of the [T6 simplicity seat](council-261108-0900-harden-t6-seat-simplicity.md), and AGENTS.md (RUL104 "better, not bigger", RUL11 "tum lum, not heavy", design principles 1 one door, 2 bottom-up layering, 6 KISS/DRY, 7 one source of truth, 8 one proof per behaviour). Nothing was run beyond `git log -S`, `git grep`, `node --check` on a trimmed scratch copy of `skill-wrappers.mjs`, and a line-range count of the test file. No test suite was run.

## Verdict on the baseline's four dead-code claims

| Claim | Verified? | Correction |
|---|---|---|
| Gemini generator and adapter classifiers, about 300 to 400 of 1 362 lines | Confirmed, and **larger**: about **590 lines** | Dead ranges: 354-627 (adapter targets, classifiers, intent-to-trigger mapping, 274 lines), 912-1166 (Gemini reference rewriting plus `generateGeminiSkillPackage`, 255 lines), and about 60 lines inside `discoverCanonicalSkills` that compute intent ids and host triggers for hosts nothing emits. A scratch copy with the first two ranges cut passes `node --check` (833 lines left; about 770 after the third cut). No production code reads `userInvocable`, `intentId`, `triggers` or `authority` from `discoverCanonicalSkills` (`git grep` over src, scripts, bin) |
| `skill-wrappers.test.mjs`, 2 216 lines modelling three deleted skills | Confirmed, and **larger once Gemini is counted**: 86 of 128 tests, about **3 000 of 3 735 lines**, are deletable; 42 tests, about 740 lines, stay | Reference models start at line 1514 (2 222 lines, 61 tests). Retired-skill tests before it: 445-516 and 539-605 (139 lines). Gemini/adapter/intent tests: 696-1154, 1238-1255, 1320-1513 (671 lines) |
| Three unreferenced shared fragments | **Two of three.** `catchup-self-recovery.md` is **live** | `plugins/fgOS/skills/approve/SKILL.md:163,221`, `merge-loop/SKILL.md:86,139` and `merge-next/SKILL.md:70,76` read `../_shared/catchup-self-recovery.md`; the plugin commands are hand-authored, so a search of `core/` and `domains/` alone misses them. Dead: `domains/coding/skills/_shared/coding-cell-policy.md` (110) and `core/skills/_shared/private-cell-worktree.md` (90, whose only reader is `coding-cell-policy`). Every other `_shared` fragment has at least 2 readers (`ak-cook-worker-contract` is read by `fgos-cook/references/case-and-doors.md:108`) |
| 14 `readdirSync(domains...)` loops in 8 files | **16 loops in 10 files**; the baseline missed two scripts | `scripts/build-domain-registry.mjs:49`, `scripts/project-agents.mjs:122` were not counted. Two of the five in `skill-wrappers.mjs` (426, 454) die with the classifiers, leaving 14 live loops in 9 files |

Prior art per claim (`git log -S`, all intended removals, nothing to resurrect):

- **Gemini package.** Added 2026-09-14 in 11 commits (`5769cb9e7` to `dcb97a9aa`), the same day `fgos setup` was deprecated (`command-registry.mjs:2233`, "since 2026-09-14"). `git log --all -S generateGeminiSkillPackage -- bin scripts src/cli src/setup/registrations.mjs` returns nothing: **it never had a caller**, only tests. The contract (`skill-package-distribution.md:64,75,111`) still lists it "partial / planned". Deleting a planned target is a user call (see Part B, B2).
- **Reference-model tests.** Written 2026-09-14 to 09-28 for `fgos-code-panel` / `fgos-code-change` (`e859e71d6`, `8eff54d0f`). The three skills were deleted in `6527596eb` (2026-10-01, with the CHANGELOG entry). The tests survived because they are test-local functions that import nothing, so no deletion broke them. `test/runner/dead-vocabulary-guard.test.mjs:314-316,353-355` already bans the three names, so a regrowth of the retired vocabulary has an owning proof.
- **Two fragments.** `coding-cell-policy` was last read by the `fgos-code-change` facade and plan-loop stubs (`83381c5bf`, `8eff54d0f`); both went in `6527596eb`. `private-cell-worktree` last had a skill reader in `8eff54d0f` (2026-09-28). Neither was cleaned up by the 2026-10-01 retirement; `f053de033` (2026-10-06) only re-rendered them.
- **Domain loops.** Written one by one from `c99fd42a4` and `f18c9e87f` (2026-08-20, domainization). No door was ever made.
- **Found beyond the baseline:** `scripts/measure-coordination-baseline.mjs` (464 lines) imports `../src/runner/coordination/replay.mjs`, which was deleted in `2180b4e72` (2026-10-02, "L4 coordination engine retired"); it also reads `domains/coding/skills/fgos-code-change/SKILL.md`. It has no `package.json` entry and no caller outside archived plans, and it cannot run. Two exception rows for it remain in `test/runner/assignment-enumerator-guard.test.mjs:114-115`.

Two baseline facts already moved: H1 landed as `27b2c580c` (2026-11-09, both drift guards now filter by `ownedFileSet`), so the two reds are fixed on `origin/main`. What remains of H1 is a comment and a root (B6 below).

## Part A. Target shapes

Plain statement: T8 is not bloated by its mechanism (assemble, wrap, mirror is three short passes). It is bloated by a **prototype for a host nobody ships (Gemini)**, **tests of a mechanism deleted five weeks ago**, **one script whose engine is gone**, and **derived copies of text**. After the cut the render module is one file of about 700 lines with no function over 130.

### One door per job

| Job | The one door (after) | Today's second way, to delete or fold |
|---|---|---|
| Source skill to `.agents/skills` | `assembleSkills` (`skill-wrappers.mjs`), returning the set of names it owns | `checkDuplicates` / `checkCollisions` options that no production caller passes (and `checkCollisions` is already a no-op, line 1224) |
| `.agents` to `.claude/skills` wrapper | `generateAllSkillWrappers(agents, claude, { owned })` taking the owned-name set from the assemble step | walks every directory of `.agents/skills`, so an installed kit's skills are rewritten (baseline K4) |
| Plugin mirror | `mirrorDevSkillsIntoPlugin`, unchanged | none |
| Entry | `scripts/build-skill-wrappers.mjs`, plus `ensureAddonForScript()` like its two siblings (baseline K2) | none |
| "What do skill sources look like" (core and per-domain skill dirs, core and per-domain `_shared`) | one `skillSourceRoots(projectRoot)` yielding `{ root, authority, domain }`, read by `discoverCanonicalSkills` and `discoverSharedFragments` | two near-identical core-then-domains loops in each (675, 893) |
| "Which domains exist" | one leaf `src/util/domain-dirs.mjs` exporting `listDomainDirs(root)` (sorted, directories only, dot names skipped). `src/util` is already the leaf layer (design principle 2) | 16 independent loops in 10 files |
| Is a surface current | `ownedFileSet` (already the door, `scripts/lib/git-ports.mjs`); both guards use it. One proof of "committed `.agents/skills` equals the render" (the drift test), one of "mirror equals `.agents`" (`fgos-mirror.test.mjs`) | `WIDE_SWEEP_ROOTS` still lists `.agents/skills`, a byte render of two roots already swept |
| Compiled domain matches YAML | `domain-registry-compiled.test.mjs` | doctor row and `build-domain-registry --check` are two more readers; keep one (WORK's file, see below) |

Nothing moves to Rust: no decision logic of weight lives here (agree with the baseline).

### Modules to merge or delete

- Delete: the adapter/Gemini/intent code of `skill-wrappers.mjs` (about 590 lines), `scripts/measure-coordination-baseline.mjs`, two dead fragments, 86 tests.
- Merge: the duplicate core/domain loops into `skillSourceRoots`; domain loops into `listDomainDirs` for the files T8 owns.
- Keep as they are: `fgos-mirror.test.mjs`, `instruction-projections.test.mjs`, `source-payload.test.mjs`, `domain-registry-compiled.test.mjs`.
- Do not create: a `fgos skills check` verb, a skills spec split, or any new layer (these are ideas, listed at the end).

### Net size targets

| Area | Today | After | Delta | What gives it |
|---|---|---|---|---|
| `src/setup/skill-wrappers.mjs` | 1 362 | about 700 | **-660** | B2 (-590), B4-style loop merge (-50), B7 flags (-12) |
| `test/setup/skill-wrappers.test.mjs` | 3 735 (128 tests) | about 740 (42 tests) | **-3 000** | B1, B2 |
| `scripts/` | 511 + 464 + 79 + 42 | 511 + 79 + 42 + a few lines | **-464** | B3 |
| New door `src/util/domain-dirs.mjs` | 0 | about 20 | +20 | B5 |
| Other T8-owned domain loops | 3 loops of about 4 lines | 3 calls | about -5 | B5 |
| Source skill text | `core/skills/_shared` 1 360 + coding `_shared` 110 | minus 200 | **-200** | B4 |
| Generated copies | 20 359 lines in 170 files | about 19 760 in 164 files | **-600** | B4 (two fragments times three trees) |
| Git census | 132 skill hashes | 128 | -4 | B4 |
| Node total (T8-owned) | about 2 000 | about 1 000 | about **-1 100** | |
| Tests (T8-owned) | 9 476 lines | about 6 000 | about **-3 000 to -3 500** | |

Conditional, not counted above, both owner decisions with costs in B8 and B9: `.claude/skills` reference copies (-3 054 generated lines, up to -25 Node lines) and not committing derived trees.

## Part B. Ranked deletions and merges

Ranking is value per risk. Every row names the proof that owns the behaviour afterward (design principle 8) or says the behaviour was removed. Stable names only: no plan ids or finding codes in code, tests or commits.

### B1. Retire the reference-model tests and the retired-skill tests (High, -2 360 lines, 67 tests)

- Evidence: `test/setup/skill-wrappers.test.mjs:1514-3735` (61 tests; header at 1514-1521 says "no runtime production code calls this"), plus 445-516 and 539-605 (6 tests about `fgos-code-panel`, `fgos-code-change`, `fgos-plan-loop`, whose directories do not exist: `ls core/skills domains/coding/skills`). Nine of them are neutered with `return; // retired ...` (lines 540, 560, 574, 2041, 2051, 2149, 2169, 2315-2323, 2900).
- Behaviour owner after: **behaviour removed** (the three skills were deleted in `6527596eb`). The one live idea, "retired names do not come back", is `test/runner/dead-vocabulary-guard.test.mjs:314-355` (already green). The wrapper, assemble and mirror behaviours stay with the 42 surviving tests (lines 45-444, 517-538, 606-695, 1155-1237, 1256-1319).
- Size: -2 360 test lines. Risk: none for production (the removed tests import nothing from `src`). Needs TEST told (their label "mirrors / contract-prose").

### B2. Delete the Gemini package generator, adapter classifiers and intent-trigger mapping (High, -590 src, -671 tests; owner decision)

- Evidence: `skill-wrappers.mjs:354-627` (`SKILL_ADAPTER_TARGETS` 359, `isGeneratedAdapterTarget` 527, `isCanonicalSkillSource` 557, `deriveSkillIntentId` 571, `mapSkillIntentToHostTriggers` 605 and helpers), `912-1166` (`generateGeminiSkillPackage` 1038 and its path-rewrite helpers, used only inside it: `toPosixRelativePath` 913, `canonicalSharedRoots` 923, `rewritePackaged*` 981-1037), and in `discoverCanonicalSkills` the `intentId`/`triggers` fields (657-658, 697-698) and the duplicate-intent, command-path and trigger loops (726-768). `git grep` finds the generator only in its own file, its tests and two doc lines. Never wired (prior art above). No `.gemini` directory exists, and no executor consumes a Gemini extension package.
- What stays: `assertPortableGeneratedSkillNames*` (names must be portable on Windows; used by assemble at 715 and 780), `windowsPathCollisionKey` and the reserved-name helpers (used by `discoverSharedFragments` too).
- Behaviour owner after: the 42 kept tests, in particular 1171-1237 (shared-fragment Windows and Unicode collisions) and 1256-1319 (portable skill names); the Gemini behaviours are **removed**, with the intent that the contract row goes too.
- Reason this needs the owner, not a silent cut: `skill-package-distribution.md` lists Gemini as a planned adapter ("partial; release/doctor wiring planned"). Options: (a) delete now, restorable from `5769cb9e7..dcb97a9aa`, and rewrite the contract rows 64, 75, 111, 139 and `implementation-alignment.md` (recommended; no consumer in 8 weeks); (b) keep, but then it needs a caller, a doctor row and a spec home, which is a feature; (c) keep without a caller, which this seat rejects (RUL11: it is exactly the loose end that makes the layer heavy). Docs change goes through DOC.
- Size: -590 / -671. Risk: low once the contract rows move in the same change.

### B3. Delete `scripts/measure-coordination-baseline.mjs` (Medium, -464 lines)

- Evidence: line 11 imports `../src/runner/coordination/replay.mjs` (directory gone since `2180b4e72`, 2026-10-02); line 19 names `domains/coding/skills/fgos-code-change/SKILL.md` (gone); `git grep measure-coordination-baseline` outside `CHANGELOG.md`/`archive/` finds only two exception rows in `test/runner/assignment-enumerator-guard.test.mjs:114-115`. Verify first: `node scripts/measure-coordination-baseline.mjs` should die on the import.
- Behaviour owner after: behaviour removed (the engine it measured is retired). Remove the two exception rows in the same change. That test file is T5's: tell the lane, change only those two lines.
- Size: -464 src, -2 test lines. Risk: none.

### B4. Delete the two dead shared fragments (Medium, -200 source, -600 with renders)

- Evidence: `domains/coding/skills/_shared/coding-cell-policy.md` and `core/skills/_shared/private-cell-worktree.md`: no reader in `core`, `domains`, `plugins/fgOS/skills`, `src`, `bin`, `scripts`; the second is read only by the first. Keep `catchup-self-recovery.md` (three live plugin readers, above).
- Do together: `npm run build:skills` after the delete removes the `.agents/skills/_shared` and `plugins/fgOS/skills/_shared` copies (prune removes only generated files, `carriesAssembledHeader`); regenerate `packages/git/contracts/mutation-census.v1.json` (4 hashes); the comment at `skill-wrappers.test.mjs:464` goes with B1.
- Behaviour owner after: behaviour removed. The existing mirror and drift tests still prove the renders. A "no unreferenced shared fragment" lint would be a new test; it is on the idea list, not in this cut.
- Risk: low; the build and census steps are mechanical. Do not run `build:skills` from a worktree before the addon staging fix (baseline K2, K3).

### B5. One door for "which domains exist" and one source walker (Low value, small net; principle 1)

- Evidence (16 loops, 10 files): `scripts/build-domain-registry.mjs:49`, `scripts/project-agents.mjs:122`, `src/runner/agent-definitions.mjs:45`, `agent-roster.mjs:48`, `src/runner/dispatch/operation-prompt-templates.mjs:212,289`, `src/setup/instruction-registry.mjs:679`, `src/setup/registrations.mjs:835,1368`, `src/setup/skill-wrappers.mjs:426,454` (die with B2), `675,893,931` (931 dies with B2), `src/state/domain-registry.mjs:72`, `src/workflow/loader.mjs:30`.
- Shape: `src/util/domain-dirs.mjs` (`listDomainDirs`), plus `skillSourceRoots` inside `skill-wrappers.mjs` so `discoverCanonicalSkills` and `discoverSharedFragments` stop repeating the core-then-domains walk (about -50 lines).
- Convert only T8-owned callers in this lane: `skill-wrappers.mjs`, `instruction-registry.mjs`, `build-domain-registry.mjs`, `project-agents.mjs`. The others are other owners' files (see below): hand them over as items; nothing breaks if they convert later (the door is additive until the last caller moves, but L10 says move every caller in the same change, so file the items the same turn).
- Behaviour owner after: one new test for the door (empty, missing, dot-dir and sorted-order cases, 4 short cases); callers keep their existing tests. Net: about -35 lines in T8 files, about +20 for the door and its test. Honest note: this is a one-door fix, not a size win; do it last and only if B1 to B4 land first.

### B6. Stale root and comment in the citation guard (Low, about -1 root, -5 baseline entries, -12 comment lines)

- Evidence: `scripts/check-decision-citation-drift.mjs:307-321` still calls `.agents/skills` "the canonical dev-skill source" (it stopped being canonical in `dece88760`, 2026-08-20) and lists it in `WIDE_SWEEP_ROOTS`. It is a byte render of `core/skills` and `domains`, both already swept, and the render is proven byte-equal by the drift test. The baseline file has 5 entries under `.agents/skills` that duplicate `core/` findings (baseline Q7: confirm none is unique before dropping).
- Behaviour owner after: the drift test (render equals source) plus the citation scan of `core/skills` and `domains`. Risk: a finding that exists only in a generated file cannot exist, because the render is byte-equal.

### B7. Remove the two no-op options of `assembleSkills` (Low, -12 src, 4 test mentions)

- Evidence: `checkDuplicates` and `checkCollisions` (`skill-wrappers.mjs:630,634,717,837,839,900,1223-1229,1242-1247`); the only callers that pass `false` are tests (`git grep checkCollisions checkDuplicates -- src bin scripts` finds none outside the file). `checkCollisions` is documented "legacy compatibility; collisions are always rejected".
- Behaviour owner after: the existing tests at 1155 and 1272, with the `false` argument removed (they then say "duplicates are always rejected", which is the behaviour).

### B8. `.claude/skills` reference copies (Medium, conditional: -3 054 generated lines, up to -25 Node lines; **test before choosing**)

- Evidence: `generateAllSkillWrappers` (168-217) copies every non-`SKILL.md` file beside each 16-line wrapper (28 files, 3 054 lines). The wrapper's own body says "Read `../../../.agents/skills/<name>/SKILL.md`"; that file resolves its `references/...` links relative to itself, where they exist. The copy was added deliberately on 2026-08-19 (`b91488318`, fanout out-of-process dispatch), so it may serve a worker that resolves from the wrapper.
- Precondition for cutting: one live probe (a seat that follows the wrapper to a `references/` file). Without it, keep. Baseline H7 agrees; this seat adds that the intent is recorded, so it is a decision, not a leftover.

### B9. Do not commit derived trees (owner decision, listed for completeness; this seat does not recommend now)

- `.agents/skills` (9 329 lines) and the plugin mirror (7 286) are byte renders. Not committing them would be the cleanest one-source-of-truth shape (principle 7), but hosts read them from a checkout and the release payload takes `.agents/` as source (`scripts/build-rust-distribution.mjs:100`). It needs a materialise step in setup/worktree provisioning and a release-channel decision (baseline Q6). Cost of waiting: 2.2 times the text and two census hashes per edit. A cheaper middle step, for the Git reviewer: skip generated `.agents/skills/**` in `git-one-door-scan` (`scripts/git-one-door-scan.mjs:111` classes every skill `.md`), which drops 66 of the 132 skill hashes without touching any copy; the source twin is still scanned.

## Carried from the baseline, not mine to cut

- H2 (`build:skills` stages the addon; wrapper step takes the owned-name set) is a fix that also deletes the "treat every directory as ours" behaviour; keep it in the lane plan. It does not conflict with B2; do it in the same module in one change.
- H3 and H4 of the baseline are B1/B4 and B2 here, with the corrected sizes above.
- H5 is B5. H6 (home spec) is docs; put the "one door per job" table above in it.
- K3 (skip-worktree refusal) is the Git owner's call.

## WORK-owned or other-owner files (no change planned here)

- WORK: `src/state/domain-registry.mjs` (its loop at line 72 stays; 28 importers), `domains/coding/compiled.json`, `domains/coding/workflows/feature.yaml` `steps:`, `test/state/domain-registry*.test.mjs`, `test/cli/fgos-stage.test.mjs`, `test/state/knowledge-registry.test.mjs`, `domains/coding/skills/fgos-coding-*` text. `fgos-coding-*` skill text is not touched by any item above.
- Other lanes (hand over as items for B5, no edit): `src/runner/agent-definitions.mjs`, `agent-roster.mjs`, `src/runner/dispatch/operation-prompt-templates.mjs` (T5), `src/workflow/loader.mjs` (T6), `src/setup/registrations.mjs` (shared).
- B3 touches two rows of a T5 test file; B4 and B2 regenerate a Git-owned file (`mutation-census.v1.json`), so the OPC Git review applies.

## Feature ideas (separate list, owner picks; none is in the size figures)

1. A read-only `fgos skills check` verb as the single proof "committed surfaces equal a render of the source", replacing the guard test, the mirror test and the build step's own check. Reason: three readers of one rule (baseline 3.2). Benefit: one proof.
2. A lint that rejects references to retired skill names and unreferenced `_shared` fragments across all source skills. Reason: B1 and B4 are what the absence of that lint cost. Benefit: deletes per-skill prose tests.
3. A doctor row for foreign skills in fgOS-owned roots. Reason: `ak-*` collisions (baseline K1/K4). Must name the row it replaces.
4. Reflink or hardlink for worktree provisioning, or copy only the `ak-cook` skill into worktrees (baseline H8, 92 MB and 10 688 files per worktree).
5. When `fgos setup` retires (deprecated since 2026-09-14), `materializeSkillsIntoProject`, `createProjectSkillGuard` and their six tests (about 130 src lines) go with it. Not planned here; it depends on the packaging lane.

## Unresolved questions

1. B2: may the Gemini target leave the distribution contract (a planned item, no caller since 2026-09-14)?
2. B3: is `scripts/measure-coordination-baseline.mjs` wanted by anyone as history? `git log` keeps it either way.
3. B8: is there a worker that resolves `references/` from the wrapper directory (the 2026-08-19 fanout case)? One probe settles it.
4. B6: does any of the 5 baseline entries under `.agents/skills` describe text that exists only there (baseline Q7)?
5. B1: does TEST want the 67 tests listed in its "mirrors / contract-prose" labels before the cut?
