# Retrospective research: middle growth era, how the docs drifted (2026-08-01 to 2026-09-25)

Scope: read-only research. Window ends at the trigger commit `2085d88fe` (2026-09-26, plan created). All times are as git prints them (+0700). "Unverified" marks anything I did not prove from a commit, file or dated report.

## 1. Timeline

| Date | Commit | Event | Source |
|---|---|---|---|
| 2026-07-14 | `e9ff70db7` | Root `docs/platform-foundations.md` born (laws). Same day, a second copy appears under `docs/specs/platform-foundations.md`. | `git log --diff-filter=A` |
| 2026-07-14 | `ad65f59fd` | `docs/specs/` born with `reading-map.md`, `system-overview.md`, `platform-foundations.md`, `backlog.md` ("close feature" commit). Specs become the state layer. | same |
| 2026-07-14 | `06df4970f` | `docs/routing-handoff-contract.md` born at docs root (a contract outside `specs/`). | same |
| 2026-07-16 | `2d60303ef` | `docs/architecture-map.md` born at docs root (third root-level authority). | same |
| 2026-08-01 | `6e0e3c017` | Baseline sample: 365 files under `docs/`, 26 ADRs in `docs/decisions/`, 11 in `docs/specs/`. | `git ls-tree` sample |
| 2026-08-07 | `7e6da77c9` | Design discussion for a multi-audience artifact registry opens (tsk-28x), response to the end-user doc explosion. | git log `--grep tsk-28x` |
| 2026-08-12 | `9f26cf2c5` | `docs/history/spec-docs-lifecycle-realignment` shaped: first attempt to realign spec docs lifecycle. | `git log -- docs/history/spec-docs-lifecycle-realignment` |
| 2026-08-08..15 | (many) | `docs/history/` grows 535 -> 1115 files in one week; `docs/` 816 -> 1500. Per-work-item evidence folders. | sample, section 2 |
| 2026-08-17 | `4722361ae` | tsk-1lv-4 retires the `docs/decisions/*.md` corpus (34 ADRs) into "Lich su quyet dinh retired" sections of `docs/specs/<area>.md`. Decision narrative now lives in specs, `docs/decisions/index.md` is generated, short records go to `.fgos` events. | `git show 4722361ae` |
| 2026-08-17 | `4270c0c0d` | Review fixes after retirement: "dead write-time sweep for --scope decisions", citation-drift baseline needed. Dead references appear immediately after the move. | `git show -s 4270c0c0d` |
| 2026-08-20 | `07c4a5205` | tsk-397-13 splits doctrine core/domain; `domains/coding/AGENTS.md` born; `plugins/fgOS/skills/fgos-routing/SKILL.md` edited by hand in same commit as the source. Core/domain/render trees multiply. | `git show --stat 07c4a5205` |
| 2026-08-22 | `bbff3baf3` sample | `.agents/skills` 22 -> 45 files and `plugins` 59 -> 83 within one week (render copies). Cause unverified (tsk-397 series on 08-20 is the likely trigger). | sample |
| 2026-08-25 | n/a | Report names the doc explosion: 268 end-user docs, +50 per 7 days, 28% of file names touch 2+ entities. | `plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md` |
| 2026-08-26 | `ccf8ed091` | `docs/doc-registry.md` born (generated registry projection). | git log `--diff-filter=A` |
| 2026-08-27 | `6cce97ab3` | `docRegistry.enforce` enabled (tsk-1uj). | `git log -1 6cce97ab3` |
| 2026-08-27 | `7dc95a26c`, `c30261fac` and 330 siblings | tsk-5mh migrates end-user docs into `docs/knowledge/` (332 files). One commit per doc. Legacy quadrant roots are not removed. | `git log --grep tsk-5mh` |
| 2026-08-31 | `ba7b62ace` | "organize agent coordination architecture": `docs/architect/agent-coordination/` gets sub-structure (architecture/, contracts/). Architect tree grows as a parallel doc tree. | `git show --stat ba7b62ace` |
| 2026-09-03 | `b52e0165d`, `a7d32f082` | AGENTS.md edited for step-09 split and index stats. AGENTS.md still routes to `docs/specs/*` (never to a switchboard). | `git log -- AGENTS.md` |
| 2026-09-05..12 | (many) | `docs/architect/agent-coordination` 14 -> 473 -> 905 files (raw requests, results, proofs). | sample |
| 2026-09-10 | `263d2fe94` | `docs/architect/` first appears in `--diff-filter=A` history (earlier renames hide the true birth). | git log |
| 2026-09-14 | `679585957` | First commit under `docs/platform/` (packaging-distribution R1 freeze). Target topology starts while old trees stay. | `git log -- docs/platform` |
| 2026-09-15 | `23fb220e3` | One chore commit "preserve main worktree before packaging merge" adds `docs/README.md`, `docs/doc-governance.md`, `docs/reading-map.md`, `docs/platform/README.md`, `docs/platform/platform-foundations.md`, `docs/platform/component-boundary.md`, and the whole `docs/architect/documentation-system-*` design. Governance is "Accepted", implementation "Partial". | `git show --stat 23fb220e3`, `git show 23fb220e3:docs/doc-governance.md` |
| 2026-09-18 | `e1307d33f` | Commit titled `fix(dispatch): widen TRUST_STORE_KINDS ...; docs(agent-coordination): migrate to docs/platform/ target structure` adds 943 files under `docs/platform/agent-coordination/`, 0 renames, 0 deletions of the originals. | `git show --name-status -M e1307d33f` (943 A, 4 M) |
| 2026-09-19 | `9818f25a8` | Another coordination commit touches 945 files under platform and architect trees. | `git log --shortstat` |
| 2026-09-21 | `ca854f443` | Long-horizon proposal `docs/platform/proposals/documentation-system-unification.md` born inside a commit titled "refactor coordination action legality and test fixtures". | git log `--diff-filter=A` |
| 2026-09-25 | n/a | Truth-reset map records state at snapshot `ac19f6d1e` (see section 3, link 8). | `git show archive/doc-260925-lineage:plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md` |
| 2026-09-26 | `2085d88fe` | Plan created; independent frontier review and re-review included. | `git show --stat 2085d88fe` |

## 2. Doc-count growth samples

Method: last commit on `main` at or before 23:59 of the date, then `git ls-tree -r --name-only <sha> docs | wc -l` (and per subtree).

| Date | Sha | files in `docs/` | `.md` | `docs/specs` | `docs/decisions` | `docs/platform` | `.agents/skills` | `plugins` |
|---|---|---|---|---|---|---|---|---|
| 08-01 | `6e0e3c017` | 365 | 360 | 11 | 26 | 0 | 16 | 31 |
| 08-08 | `681ae1933` | 816 | 810 | 11 | 28 | 0 | 22 | 39 |
| 08-15 | `36e0602fd` | 1500 | 1487 | 12 | 33 | 0 | 22 | 59 |
| 08-22 | `bbff3baf3` | 1790 | 1764 | 12 | 1 | 0 | 45 | 83 |
| 08-29 | `9235bbe19` | 2116 | 2086 | 12 | 1 | 0 | 45 | 83 |
| 09-05 | `284b95733` | 2759 | 2447 | 12 | 1 | 0 | 48 | 86 |
| 09-12 | `814711731` | 3239 | 2631 | 13 | 1 | 0 | 54 | 92 |
| 09-19 | `81437ffff` | 4297 | 3121 | 13 | 1 | 1004 | 54 | 92 |
| 09-25 | `cfdaf4bc9` | 4301 | 3124 | 13 | 1 | 1005 | 54 | 92 |

Where the growth sat (top subtrees, same samples):

- 08-08: `history` 535, `explanation` 105, `how-to` 67, `distillery` 34, `decisions` 28, `specs` 11.
- 08-15: `history` 1115, `explanation` 161, `how-to` 84, `distillery` 34, `decisions` 33, `ui-spec` 21, `specs` 12.
- 09-05: `architect/agent-coordination` 473 (was 14 a week earlier).
- 09-12: `architect/agent-coordination` 905, plus `architect/proposals` 14.
- 09-19: `platform/agent-coordination` 945 next to `architect/agent-coordination` 937, `platform/host-invocation-routing` 33, `platform/packaging-distribution` 20.

Net: `docs/` grew 12x in 8 weeks (365 -> 4301). `specs/` stayed at 11-13 files. The growth was evidence and history, not maintained specs, but everything sat in the same tree with no marker saying which was authority.

Measured duplication at 09-19 (`81437ffff`): 935 relative paths exist in both `docs/platform/agent-coordination/` and `docs/architect/agent-coordination/`; 868 have identical blobs and 67 differ (divergent copies). Divergent examples: `architecture/README.md`, `architecture/protocol-model.md`, `architecture/runtime-model.md`, `architecture/dispatch-control-plane.md`. Method: blob hashes from `git ls-tree -r` joined on relative path.

Triple copy of the platform laws at 09-25 (`cfdaf4bc9`, sizes from `git cat-file -s`): `docs/platform-foundations.md` 16398 B, `docs/specs/platform-foundations.md` 33845 B, `docs/platform/platform-foundations.md` 3341 B (a summary that names both others as sources).

Two reading maps at 09-25: `docs/reading-map.md` 2993 B (new, "Accepted") and `docs/specs/reading-map.md` 29870 B (detailed, still the one AGENTS.md uses).

## 3. Causal chain

1. **Specs were created per feature, with root-level siblings from day one (July).** `docs/specs/` was born at `ad65f59fd` (2026-07-14) containing a copy of the laws, while the same laws existed at `docs/platform-foundations.md` (`e9ff70db7`, same day). A contract (`06df4970f`) and the architecture map (`2d60303ef`, 07-16) were put at docs root, not in `specs/`. Result: from the start, at least three places could own a claim (root, specs, history). Evidence: birth commits above; 09-25 map lists `docs/platform-foundations.md` as "complete locked-law source" and `docs/specs/platform-foundations.md` as "curated/spec projection".

2. **Every work item wrote evidence into the same docs tree, and the retrospective skill auto-generated more.** `docs/history/<item>/` per item plus Diataxis quadrant docs from the retrospective skill. `docs/` went 365 -> 1500 in two weeks (08-01 to 08-15) with `history` alone 535 -> 1115 in one week. The 08-25 report measured +50 end-user docs per 7 days and said the cause is mechanical: "write new vs append" was decided only by `fs.existsSync` on a freely named path, so it almost always created a new doc. Evidence: samples in section 2; `plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md`.

3. **The decision corpus was retired into specs, and dead references followed (08-17).** `4722361ae` moved 34 ADRs from `docs/decisions/` into `docs/specs/<area>.md` and left a generated `docs/decisions/index.md`. `4270c0c0d` (five hours later) had to fix a "dead write-time sweep" and a citation-drift baseline; the commit message of `4722361ae` itself lists `AGENTS.md` pointers that had cited a deleted file. Authority for a decision is now split across spec narrative, `.fgos` event records and the generated index. A later review still found `.fgos` decision records pointing at paths that would die (`advice` and frontier review, section "Dead" lines 201 and 206 of the 09-25 review). Evidence: `git show 4722361ae`, `git show -s 4270c0c0d`, `docs/specs/decision-citation-drift.md` (the guard added to catch this).

4. **Two registries for end-user docs started in one week (08-25 to 08-27).** A registry (`docs/doc-registry.md`, `ccf8ed091`) and a new corpus `docs/knowledge/` (332 files, one commit per doc, `7dc95a26c`..`c30261fac`) were created, with `docRegistry.enforce` flipped on at `6cce97ab3`. The legacy quadrant roots were not removed: at 09-25 the review counted 137 `explanation`, 20 `how-to`, 6 `reference` still live next to `docs/knowledge/` and a 1-file `docs/user/`. The review also found every doc was `provisional` and topic count equalled doc count (332 = 332), i.e. no folding happened. Evidence: `git log --grep tsk-5mh`; `plans/260825-1841-knowledge-registry/` plan; `independent-frontier-review-2026-09-25.md` (M1, M6).

5. **Architecture and coordination evidence grew a parallel tree at the highest rate (08-31 to 09-19).** `ba7b62ace` (08-31) organised `docs/architect/agent-coordination/`; by 09-12 it held 905 files (raw requests, results, proofs, not just design). The 09-25 map counts 566 non-Markdown payload files below `docs/architect/**` and states that consumers of these payloads are unmapped. Evidence: samples; current-authority-map section 6.

6. **A new target tree was introduced by copying, not moving.** `docs/platform/` started 2026-09-14 (`679585957`). On 09-15, one chore commit (`23fb220e3`, "preserve main worktree before packaging merge") added governance, reading-map, platform portal and the documentation-system design, mixed with `.fgos` event-log state. On 09-18, `e1307d33f` added 943 files to `docs/platform/agent-coordination/` with no renames and no deletes of the originals, inside a commit titled as a dispatch fix. Result: 937 + 945 files, 868 identical, 67 divergent (section 2). The governance doc names the placement target but says "Implementation: Partial", and the portal table lists "Current source during migration" in the old trees. Evidence: `git show --stat 23fb220e3`, `git show --name-status -M e1307d33f`, `git show 23fb220e3:docs/platform/README.md`.

7. **Migration was declared area by area, so authority split three ways, not two.** Only three area portals existed at 09-25 (packaging-distribution, host-invocation-routing, agent-coordination); every other area (runner, work-state, confinement, plugin surface, herdr dashboard, distillery, UI spec, coexistence) was `legacy-current` under `docs/specs/**` or a root file. Even promoted portals delegated exact contracts back to `docs/architect/**`. A second intent ledger for the same area appeared (`docs/platform/agent-coordination/intent-preservation-ledger.md` next to the architect ledger), and a ledger row pointed at a non-existent `docs/platform/host-invocation/...` path. Evidence: current-authority-map section 2; frontier review M3.

8. **Always-loaded consumers never moved to the switchboard (the bypass).** At 09-25 `AGENTS.md` lines 8-10, 38, 46 route to `docs/specs/system-overview.md`, `docs/specs/reading-map.md` and `docs/platform-foundations.md`, not to the new `docs/reading-map.md`. `core/instructions/platform-laws.md` and its generated projection bind all law anchors to the root `docs/platform-foundations.md`. 25 `docs/specs/` references sit in 22 files under `core/`, `domains/`, `plugins/`, `.agents/skills` (my `git grep -c` count at `cfdaf4bc9`); the authority map separately counts 167 references to specs/architect/platform paths in the checked skill Markdown set. `CLAUDE.md` also duplicates the GitNexus/MDView blocks it imports (frontier review L3). Evidence: `git show cfdaf4bc9:AGENTS.md`; current-authority-map section 4; frontier review H6.

9. **Skill and instruction copies multiplied through render targets.** Canonical skills live in `core/skills` and `domains/*/skills` (27 + 47 files), then render into `.agents/skills` (54), `.claude/skills` (89) and `plugins/fgOS` (86) (file counts at `cfdaf4bc9`). A skill source move on 09-14 (`e859e71d6`) had to keep "generated and compatibility projections" in three places and verify "no duplicate canonical skill id". Hand edits to a render copy happened in the same commit as source (`07c4a5205` edits `plugins/fgOS/skills/fgos-routing/SKILL.md`). The platform portal even lists `.agents/skills` and `plugins/fgOS/skills` as "current source" for the `skills` area. Dead skill reference: `docs/specs/reading-map.md:26,29` still names `fgos-coding-compounding` (frontier review M1). Evidence: commits above; portal text in `23fb220e3:docs/platform/README.md`.

10. **Net state at the trigger.** The 09-25 map records: 3 promoted portals, 3 `candidate` (laws, vision, architecture), 12 `legacy-current`, and says "No unresolved `conflicted` row remained after the routing correction in this Phase 00 change", so conflicts existed and were fixed only by an explicit routing rule written that day. The routing rule it adopted ("use explicit declarations, not path, date, prose quality") is itself evidence that no mechanical rule existed. Evidence: map sections 1-3.

Why each early choice led to the problem (summary):
- Specs + root + history in one tree (1) with no authority marker -> split authority.
- Auto-generated docs per work item (2, 4) -> volume, divergent near-duplicates, two knowledge systems.
- Move without a link/reference guard (3) -> dead links, citation drift guard added afterwards.
- Target tree created by copy under a "Partial" governance (6, 7) -> divergent copies and parallel trees.
- Consumers pointed at paths, not at a switchboard (8, 9) -> bypasses, stale projections.

## 4. Open questions

1. Why did `.agents/skills` and `plugins` jump 22 -> 45 and 59 -> 83 between 08-15 and 08-22? I have only the tsk-397 commit series (08-20) as a likely cause; not verified.
2. Did the 67 divergent copies diverge before the 09-18 copy (the originals edited later) or after (copies edited)? I compared one snapshot; a per-file history check was not done.
3. `docs/history` jumped 535 -> 1115 between 08-08 and 08-15. Which commits added it? I did not isolate them (the `--shortstat` filter returned nothing for that window).
4. Dead-link count was never measured in this window. The only counted evidence is the 09-25 doctor note (`doc-current-path-missing`, `doc-source-conservation` failing) and named dead references. A link scan at a few sampled commits would give a real series.
5. The map says the 332 `docs/knowledge/` docs were all `provisional`; it is unknown whether any promotion path was ever run (frontier review says no).
6. Which author or session decided to copy rather than move in `e1307d33f`? Commit message mixes a code fix with a 943-file docs copy; intent unverified.
7. `docs/architect` true birth date is hidden by renames (`--diff-filter=A` shows 09-10); a `--follow`-style trace of a stable file would fix the date.
8. The `AGENTS.md` pointer set changed in the window (08-17 `4722361ae`, 08-20 `07c4a5205`); I did not diff the full line history to say when each stale pointer became stale.
