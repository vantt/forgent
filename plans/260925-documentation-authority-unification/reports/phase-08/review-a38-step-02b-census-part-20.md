# Review a38 step-02b census part 20

- Reviewer: reviewer:sonnet-session:a3807b06e035b7e1e@2026-10-19
- Request: step-02b-census-0689b862e (input HEAD 0689b862e8468014f0a08c8b5749ab5aabfc3421)
- Author commit 8606433d6, accounting commit c801778ac (worktree detached at c801778ac48e78dae45b67a58b7484e87bfcd4a5, read-only, nothing written)
- Part: `step-02b-review-part-20.json`, sha256 `30165cac523d228e4a3138e2a2b674aa3313d47184b6eb4a9d9975d7fe5a0c4b` (matches review index; author portable replay PASS re-run unchanged)
- Entries: 60 (classes: {'inventory-reconciliation': 60})

## Findings and deep-read notes
- Mechanical (all 60): same checks as part 19, plus dynamic rows: `rawTarget` text is at the stated line of the current file, a census edge lies within 3 lines of it, and all 34 joined distill census edges belong to the same file.
- Distill rows (23-59): `.agents`, `.claude` and `core` distill.mjs are byte-identical (cmp); source is core. Read source lines 60-75, 118-176, 240-262, 288-294, 374-380, 405-470, 504-592: root from `--root` or upward `docs/distillery` discovery, `docs/distillery` sources/taxonomy/porting-log/state and clone dirs (`meta.local` or `upstreams/<name>`) are project learning contracts, never authority aliases; pre and cutover action preserve is right (L12-10 external-project conventions unchanged).
- Observation (not rework): every distill path-construction edge carries the same blanket writeDestination even when the site is a read (`.git` existence check, readdir). The accessRole stays neutral (`path-construction`) and the real writer site is separately a `file-write` edge (skills-331), so no action depends on it.
- Glob rows 8, 17-22 (`docs/specs/*.md`): join is right. Cross-part finding F2 applies to the referenced census edges 009/078/126, not to these join rows (see part 19 and the summary).

Cross-part finding F2 (for Lead, not counted against parts 19-22 rows): census edges skills-009, skills-078, skills-126 (citation-format.md line 96/97 `docs/specs/*.md`) carry an executable-looking cutoverPatch `new: docs/platform/**/spec.md` (a glob, not a concrete owner) without the `blocked` status used for the other unresolved patches, while their own parkedReason says no universal substitution is approved and `scripts/check-decision-citation-drift.mjs` (lines 3, 29-34) still scans docs/specs/*.md by default. Recommend `blocked` + candidateSuggestion, as for the shaping rows.

## Rows
| # | entry id | description | verdict | read | note |
|---|---|---|---|---|---|
| 0 | `consumer_13225ab4df178d8a0689732c` | shipped-contract core/skills/fgos-clarifying/SKILL.md:None -> docs/specs/runner.md | ok | deep |  |
| 1 | `consumer_e1a9ade670556049f3fdc974` | literal core/skills/fgos-clarifying/SKILL.md:90 -> docs/specs/runner.md | ok | deep |  |
| 2 | `consumer_29d6b1ee871ed0d92e51920a` | shipped-contract core/skills/fgos-researching/SKILL.md:None -> docs/specs/runner.md | ok | mech |  |
| 3 | `consumer_4c3308b8b8ffb8c2920dfe9f` | literal core/skills/fgos-researching/SKILL.md:90 -> docs/specs/runner.md | ok | mech |  |
| 4 | `consumer_404b226c716423c23aaa9c1e` | shipped-contract domains/coding/skills/fgos-coding-discovering/SKILL.md:None -> docs/specs/runner.md | ok | deep |  |
| 5 | `consumer_04b773b221586f7c639ea0d1` | literal domains/coding/skills/fgos-coding-discovering/SKILL.md:80 -> docs/specs/runner.md | ok | mech |  |
| 6 | `consumer_6de5b44f7531d2c493bbd7aa` | shipped-contract domains/coding/skills/fgos-coding-shaping/SKILL.md:None -> docs/specs/runner.md | ok | deep |  |
| 7 | `consumer_e66349566e51c63ede991327` | literal domains/coding/skills/fgos-coding-shaping/SKILL.md:73 -> docs/specs/runner.md | ok | mech |  |
| 8 | `consumer_43fb26972165100c5a213b48` | glob plugins/fgOS/skills/_shared/citation-format.md:97 -> docs/specs/runner.md | ok | deep | glob join; F2 on referenced edges |
| 9 | `consumer_dbc085c489d785b1ae697e05` | shipped-contract plugins/fgOS/skills/fgos-clarifying/SKILL.md:None -> docs/specs/runner.md | ok | mech |  |
| 10 | `consumer_7e266fd36423390780aa5243` | literal plugins/fgOS/skills/fgos-clarifying/SKILL.md:91 -> docs/specs/runner.md | ok | mech |  |
| 11 | `consumer_38729954ce35fe20a95a46d1` | shipped-contract plugins/fgOS/skills/fgos-coding-discovering/SKILL.md:None -> docs/specs/runner.md | ok | mech |  |
| 12 | `consumer_fe4bb985d074fccbc9d739ab` | literal plugins/fgOS/skills/fgos-coding-discovering/SKILL.md:81 -> docs/specs/runner.md | ok | mech |  |
| 13 | `consumer_baab33aedb6fd033fdc2898b` | shipped-contract plugins/fgOS/skills/fgos-coding-shaping/SKILL.md:None -> docs/specs/runner.md | ok | mech |  |
| 14 | `consumer_65ec65593fa8a9143f79275e` | literal plugins/fgOS/skills/fgos-coding-shaping/SKILL.md:74 -> docs/specs/runner.md | ok | mech |  |
| 15 | `consumer_f7746da0a9f15ab1f7036eef` | shipped-contract plugins/fgOS/skills/fgos-researching/SKILL.md:None -> docs/specs/runner.md | ok | mech |  |
| 16 | `consumer_86f07eb91d1cc86e1f094678` | literal plugins/fgOS/skills/fgos-researching/SKILL.md:91 -> docs/specs/runner.md | ok | mech |  |
| 17 | `consumer_a3b664d8a2dca49d859ccac0` | glob .agents/skills/_shared/citation-format.md:97 -> docs/specs/system-overview.md | ok | deep | glob join; F2 on referenced edges |
| 18 | `consumer_7036fe90479303764d2ef3c9` | glob core/skills/_shared/citation-format.md:96 -> docs/specs/system-overview.md | ok | deep | glob join; F2 on referenced edges |
| 19 | `consumer_1d3f23d0265bb2137a93c4b8` | glob plugins/fgOS/skills/_shared/citation-format.md:97 -> docs/specs/system-overview.md | ok | mech | glob join; F2 on referenced edges |
| 20 | `consumer_3816eb292891488741a7a989` | glob .agents/skills/_shared/citation-format.md:97 -> docs/specs/work-state.md | ok | mech | glob join; F2 on referenced edges |
| 21 | `consumer_3e45f024194d0137d63c7ce3` | glob core/skills/_shared/citation-format.md:96 -> docs/specs/work-state.md | ok | mech | glob join; F2 on referenced edges |
| 22 | `consumer_7ac9945bfb3c16056abede64` | glob plugins/fgOS/skills/_shared/citation-format.md:97 -> docs/specs/work-state.md | ok | mech | glob join; F2 on referenced edges |
| 23 | `consumer_unresolved_ef4807119dbe6fad689eda28` | dynamic .agents/skills/distill/scripts/distill.mjs:122 -> **/sources/** | ok | deep |  |
| 24 | `consumer_unresolved_af934f6e58fc0f60a2ccd263` | dynamic .agents/skills/distill/scripts/distill.mjs:128 -> **/sources | ok | deep |  |
| 25 | `consumer_unresolved_13cccdbf3ee4e9ac5f8bd5e8` | dynamic .agents/skills/distill/scripts/distill.mjs:129 -> **/sources | ok | mech |  |
| 26 | `consumer_unresolved_7ae3a51d6b4a2d98cf2af19f` | dynamic .agents/skills/distill/scripts/distill.mjs:141 -> **/taxonomy.txt | ok | deep |  |
| 27 | `consumer_unresolved_143ef0cfff6da1a4a5333958` | dynamic .agents/skills/distill/scripts/distill.mjs:148 -> ** | ok | deep |  |
| 28 | `consumer_unresolved_0b65e509abb6b2fb4ca85c02` | dynamic .agents/skills/distill/scripts/distill.mjs:148 -> ** | ok | mech |  |
| 29 | `consumer_unresolved_d5755771f2fa78222e911494` | dynamic .agents/skills/distill/scripts/distill.mjs:156 -> **/sources | ok | mech |  |
| 30 | `consumer_unresolved_26f58b11462a4c4b0397744a` | dynamic .agents/skills/distill/scripts/distill.mjs:169 -> **/deep-dives | ok | mech |  |
| 31 | `consumer_unresolved_9cf79142d27e6aec36c75157` | dynamic .agents/skills/distill/scripts/distill.mjs:173 -> ** | ok | mech |  |
| 32 | `consumer_unresolved_3ea9f27204177ce241c6b64e` | dynamic .agents/skills/distill/scripts/distill.mjs:244 -> ** | ok | mech |  |
| 33 | `consumer_unresolved_e6ba0001900bfd8e7b2a16b0` | dynamic .agents/skills/distill/scripts/distill.mjs:245 -> ** | ok | mech |  |
| 34 | `consumer_unresolved_0873d891e4b25727216b81ff` | dynamic .agents/skills/distill/scripts/distill.mjs:247 -> **/sources | ok | mech |  |
| 35 | `consumer_unresolved_38ad2e8aa060d06c02a49203` | dynamic .agents/skills/distill/scripts/distill.mjs:247 -> ** | ok | mech |  |
| 36 | `consumer_unresolved_98f00fe07e32322400ca6b39` | dynamic .agents/skills/distill/scripts/distill.mjs:250 -> **/taxonomy.txt | ok | mech |  |
| 37 | `consumer_unresolved_3628b066d3f0d2fc9682daa4` | dynamic .agents/skills/distill/scripts/distill.mjs:251 -> **/intake.md | ok | mech |  |
| 38 | `consumer_unresolved_f140713a76dcf7b37ef4677c` | dynamic .agents/skills/distill/scripts/distill.mjs:252 -> **/comparison-matrix.md | ok | mech |  |
| 39 | `consumer_unresolved_4dbb5d2f6b6cbecc8b7a38bf` | dynamic .agents/skills/distill/scripts/distill.mjs:253 -> **/porting-log.md | ok | mech |  |
| 40 | `consumer_unresolved_a7467e70777a5401f25becaf` | dynamic .agents/skills/distill/scripts/distill.mjs:258 -> **/.gitignore | ok | mech |  |
| 41 | `consumer_unresolved_14ba267715fe2e6d96cf3bd5` | dynamic .agents/skills/distill/scripts/distill.mjs:292 -> **/.git | ok | mech |  |
| 42 | `consumer_unresolved_956045b4afb0a72e4e11b432` | dynamic .agents/skills/distill/scripts/distill.mjs:377 -> **/.git | ok | mech |  |
| 43 | `consumer_unresolved_7ad4f7d4576a83e0511d0d33` | dynamic .agents/skills/distill/scripts/distill.mjs:587 -> **/state | ok | mech |  |
| 44 | `consumer_unresolved_5cdff980d1d0b4d6af491352` | dynamic .agents/skills/distill/scripts/distill.mjs:588 -> **/porting-log.md | ok | mech |  |
| 45 | `consumer_unresolved_2499074f6264ed525ed90fc5` | dynamic .agents/skills/distill/scripts/distill.mjs:68 -> ** | ok | mech |  |
| 46 | `consumer_unresolved_37d691b740fae0ccb09a7358` | dynamic .agents/skills/distill/scripts/distill.mjs:71 -> ** | ok | mech |  |
| 47 | `consumer_unresolved_87e00fe4f69db28b7ea40277` | dynamic .claude/skills/distill/scripts/distill.mjs:122 -> **/sources/** | ok | deep |  |
| 48 | `consumer_unresolved_4a03636faaac25ae112f13c4` | dynamic .claude/skills/distill/scripts/distill.mjs:128 -> **/sources | ok | deep |  |
| 49 | `consumer_unresolved_1234c26a3a381755fbdc862f` | dynamic .claude/skills/distill/scripts/distill.mjs:129 -> **/sources | ok | mech |  |
| 50 | `consumer_unresolved_c44775c33d928f41706a1f23` | dynamic .claude/skills/distill/scripts/distill.mjs:141 -> **/taxonomy.txt | ok | mech |  |
| 51 | `consumer_unresolved_f222df6c396a00826160a423` | dynamic .claude/skills/distill/scripts/distill.mjs:148 -> ** | ok | mech |  |
| 52 | `consumer_unresolved_e08db3603a9d051e76a2d625` | dynamic .claude/skills/distill/scripts/distill.mjs:148 -> ** | ok | mech |  |
| 53 | `consumer_unresolved_65778d69be02c60a7a9b3e81` | dynamic .claude/skills/distill/scripts/distill.mjs:156 -> **/sources | ok | mech |  |
| 54 | `consumer_unresolved_e5718d77154fb39b02eaf00f` | dynamic .claude/skills/distill/scripts/distill.mjs:169 -> **/deep-dives | ok | mech |  |
| 55 | `consumer_unresolved_34a18a9362296836b5ceb542` | dynamic .claude/skills/distill/scripts/distill.mjs:173 -> ** | ok | mech |  |
| 56 | `consumer_unresolved_740609c40ce6b63aed311d2c` | dynamic .claude/skills/distill/scripts/distill.mjs:244 -> ** | ok | mech |  |
| 57 | `consumer_unresolved_6be27a9725082be82eeb37c0` | dynamic .claude/skills/distill/scripts/distill.mjs:245 -> ** | ok | mech |  |
| 58 | `consumer_unresolved_c7f64fbf95d1bc2b0cccc897` | dynamic .claude/skills/distill/scripts/distill.mjs:247 -> **/sources | ok | mech |  |
| 59 | `consumer_unresolved_0f3752b1e52f85e1731b5e74` | dynamic .claude/skills/distill/scripts/distill.mjs:247 -> ** | ok | mech |  |

## Deep-read list
Row indices read against source/target passages: [0, 1, 4, 6, 8, 17, 18, 23, 24, 26, 27, 47, 48] (13 rows; minimum ten plus all mandatory IO/dynamic/historical/writer rows in this part).

## Totals
ok 60, rework 0, needs-Lead-judgment 0 of 60.
