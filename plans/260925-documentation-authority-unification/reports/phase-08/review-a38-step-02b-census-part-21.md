# Review a38 step-02b census part 21

- Reviewer: reviewer:sonnet-session:a3807b06e035b7e1e@2026-10-19
- Request: step-02b-census-0689b862e (input HEAD 0689b862e8468014f0a08c8b5749ab5aabfc3421)
- Author commit 8606433d6, accounting commit c801778ac (worktree detached at c801778ac48e78dae45b67a58b7484e87bfcd4a5, read-only, nothing written)
- Part: `step-02b-review-part-21.json`, sha256 `a77998edeb50cba8cd178ead308c9a2819b9aa722980ec0971fa906d99db7e14` (matches review index; author portable replay PASS re-run unchanged)
- Entries: 60 (classes: {'inventory-reconciliation': 60})

## Findings and deep-read notes
- Mechanical (all 60): as parts 19-20; instruction-audit dynamic rows match source (core/skills/instruction-audit/scripts/instruction-audit.mjs lines 36, 64, 81-83, 112-113, 134, 138, 159-161, 171). The script reads host instruction/rule/import/settings roots (including a HOME-relative `@~` import), only prints to stdout; grep found no write/rename/unlink call. Only the core copy of instruction-audit.mjs is tracked, so the single source is correct.
- Row 11 (`.claude/skills/ui-spec/tools/wireframe/html-shell.mjs`, line 17 `new URL("./client/"+filename, import.meta.url)`): the only tracked copy; classified as source, not generated. Module-relative read of client assets, not a docs authority consumer. ok.
- Rows 47-59: historical consumers (code-panel, plan-loop stubs). The 13 inventory edges all reappear exactly once in part 22's historical dispositions (set equality checked); each commit is the real deletion (`git diff-tree` shows D). Metadata retention and "execution route not alias" disposition are right. Concern F1: see part 22.

## Rows
| # | entry id | description | verdict | read | note |
|---|---|---|---|---|---|
| 0 | `consumer_unresolved_8a4560ae9a13c46fe27eaf01` | dynamic .claude/skills/distill/scripts/distill.mjs:250 -> **/taxonomy.txt | ok | deep |  |
| 1 | `consumer_unresolved_ff877475087da735ad5049b4` | dynamic .claude/skills/distill/scripts/distill.mjs:251 -> **/intake.md | ok | mech |  |
| 2 | `consumer_unresolved_44abae710d7d50373c248e7d` | dynamic .claude/skills/distill/scripts/distill.mjs:252 -> **/comparison-matrix.md | ok | mech |  |
| 3 | `consumer_unresolved_70fe619082a822475af0bee5` | dynamic .claude/skills/distill/scripts/distill.mjs:253 -> **/porting-log.md | ok | mech |  |
| 4 | `consumer_unresolved_77b1482c7275fd3539555849` | dynamic .claude/skills/distill/scripts/distill.mjs:258 -> **/.gitignore | ok | mech |  |
| 5 | `consumer_unresolved_6b915bc876d9e44f636fd353` | dynamic .claude/skills/distill/scripts/distill.mjs:292 -> **/.git | ok | mech |  |
| 6 | `consumer_unresolved_c062e5e1874f5db6564913b8` | dynamic .claude/skills/distill/scripts/distill.mjs:377 -> **/.git | ok | mech |  |
| 7 | `consumer_unresolved_2821503bc20251e7e0b85927` | dynamic .claude/skills/distill/scripts/distill.mjs:587 -> **/state | ok | mech |  |
| 8 | `consumer_unresolved_e3cd23b2ba186ca3ea8fe6e6` | dynamic .claude/skills/distill/scripts/distill.mjs:588 -> **/porting-log.md | ok | mech |  |
| 9 | `consumer_unresolved_f4ca79880c624b955df8b20f` | dynamic .claude/skills/distill/scripts/distill.mjs:68 -> ** | ok | mech |  |
| 10 | `consumer_unresolved_a2a7228cff667c66077c0780` | dynamic .claude/skills/distill/scripts/distill.mjs:71 -> ** | ok | mech |  |
| 11 | `consumer_unresolved_5df136fae1ceb4177af9afaa` | dynamic .claude/skills/ui-spec/tools/wireframe/html-shell.mjs:17 -> ** | ok | deep |  |
| 12 | `consumer_unresolved_d895548c2877029b6e21bf11` | dynamic core/skills/distill/scripts/distill.mjs:122 -> **/sources/** | ok | deep |  |
| 13 | `consumer_unresolved_c66facd4f4ce23264c7e7318` | dynamic core/skills/distill/scripts/distill.mjs:128 -> **/sources | ok | mech |  |
| 14 | `consumer_unresolved_59a5372678d25ec0e7fadff3` | dynamic core/skills/distill/scripts/distill.mjs:129 -> **/sources | ok | mech |  |
| 15 | `consumer_unresolved_d98c8f8232cc49d7ff520939` | dynamic core/skills/distill/scripts/distill.mjs:141 -> **/taxonomy.txt | ok | mech |  |
| 16 | `consumer_unresolved_61b47caee00786bb59648e8a` | dynamic core/skills/distill/scripts/distill.mjs:148 -> ** | ok | mech |  |
| 17 | `consumer_unresolved_e3e40d76fa151f2e98765ed0` | dynamic core/skills/distill/scripts/distill.mjs:148 -> ** | ok | mech |  |
| 18 | `consumer_unresolved_ad0a4e0d58002bbe374de73b` | dynamic core/skills/distill/scripts/distill.mjs:156 -> **/sources | ok | mech |  |
| 19 | `consumer_unresolved_7033fe9c0e9d20057cd8d180` | dynamic core/skills/distill/scripts/distill.mjs:169 -> **/deep-dives | ok | mech |  |
| 20 | `consumer_unresolved_59722e01ac913d1a89d8517a` | dynamic core/skills/distill/scripts/distill.mjs:173 -> ** | ok | mech |  |
| 21 | `consumer_unresolved_653446e77b9df592f4c791d3` | dynamic core/skills/distill/scripts/distill.mjs:244 -> ** | ok | mech |  |
| 22 | `consumer_unresolved_8ddf891b95bb1de6ccdfec93` | dynamic core/skills/distill/scripts/distill.mjs:245 -> ** | ok | mech |  |
| 23 | `consumer_unresolved_aa79bfc94faa2a3aaee32e63` | dynamic core/skills/distill/scripts/distill.mjs:247 -> **/sources | ok | mech |  |
| 24 | `consumer_unresolved_7c50e8f64e57204ed25017fa` | dynamic core/skills/distill/scripts/distill.mjs:247 -> ** | ok | mech |  |
| 25 | `consumer_unresolved_7921a2576cf9ffe66c7754a4` | dynamic core/skills/distill/scripts/distill.mjs:250 -> **/taxonomy.txt | ok | mech |  |
| 26 | `consumer_unresolved_4b4b60326995a6897f921ecd` | dynamic core/skills/distill/scripts/distill.mjs:251 -> **/intake.md | ok | mech |  |
| 27 | `consumer_unresolved_87261ad5ce09cc435c338938` | dynamic core/skills/distill/scripts/distill.mjs:252 -> **/comparison-matrix.md | ok | mech |  |
| 28 | `consumer_unresolved_f2c12a8039cb24ee7efb7506` | dynamic core/skills/distill/scripts/distill.mjs:253 -> **/porting-log.md | ok | mech |  |
| 29 | `consumer_unresolved_5e0359f8e0db2887a1d77eda` | dynamic core/skills/distill/scripts/distill.mjs:258 -> **/.gitignore | ok | mech |  |
| 30 | `consumer_unresolved_9013768f01472a890a27b9c5` | dynamic core/skills/distill/scripts/distill.mjs:292 -> **/.git | ok | mech |  |
| 31 | `consumer_unresolved_17ec336eecba714287ad9eda` | dynamic core/skills/distill/scripts/distill.mjs:377 -> **/.git | ok | mech |  |
| 32 | `consumer_unresolved_6de0e1313be290b08ca33dba` | dynamic core/skills/distill/scripts/distill.mjs:587 -> **/state | ok | mech |  |
| 33 | `consumer_unresolved_950d1c4c4bf5e17f82033a8b` | dynamic core/skills/distill/scripts/distill.mjs:588 -> **/porting-log.md | ok | mech |  |
| 34 | `consumer_unresolved_1f43c1be04aba4c05c7a9645` | dynamic core/skills/distill/scripts/distill.mjs:68 -> ** | ok | mech |  |
| 35 | `consumer_unresolved_b2cac78314ecc99cacd0312d` | dynamic core/skills/distill/scripts/distill.mjs:71 -> ** | ok | deep |  |
| 36 | `consumer_unresolved_33a910f6212c5cac7409dc69` | dynamic core/skills/instruction-audit/scripts/instruction-audit.mjs:112 -> ** | ok | deep |  |
| 37 | `consumer_unresolved_3d536fb4d62d12a9ba2c344f` | dynamic core/skills/instruction-audit/scripts/instruction-audit.mjs:113 -> ** | ok | deep |  |
| 38 | `consumer_unresolved_f07ffd68907453e78754d433` | dynamic core/skills/instruction-audit/scripts/instruction-audit.mjs:134 -> ** | ok | deep |  |
| 39 | `consumer_unresolved_b283f4c1dc0d8f4d1c5280c3` | dynamic core/skills/instruction-audit/scripts/instruction-audit.mjs:138 -> **/.claude/rules | ok | deep |  |
| 40 | `consumer_unresolved_fafc8e5c1249adb303586299` | dynamic core/skills/instruction-audit/scripts/instruction-audit.mjs:159 -> ** | ok | deep |  |
| 41 | `consumer_unresolved_e8c805b1bdcccfeae129869d` | dynamic core/skills/instruction-audit/scripts/instruction-audit.mjs:161 -> ** | ok | mech |  |
| 42 | `consumer_unresolved_c36fb48899704afb8d0c55f0` | dynamic core/skills/instruction-audit/scripts/instruction-audit.mjs:171 -> ** | ok | deep |  |
| 43 | `consumer_unresolved_62189f192cbf2223ae0152da` | dynamic core/skills/instruction-audit/scripts/instruction-audit.mjs:36 -> ** | ok | deep |  |
| 44 | `consumer_unresolved_90ceb95cbfdd3dbea2c7edb9` | dynamic core/skills/instruction-audit/scripts/instruction-audit.mjs:64 -> ** | ok | mech |  |
| 45 | `consumer_unresolved_721e2a38e116a0dc4d8072b8` | dynamic core/skills/instruction-audit/scripts/instruction-audit.mjs:81 -> ** | ok | deep |  |
| 46 | `consumer_unresolved_7e8c9380a5185af92fa8fa82` | dynamic core/skills/instruction-audit/scripts/instruction-audit.mjs:83 -> **/.git | ok | deep |  |
| 47 | `consumer_996e427b5b9103f840c31328` | shipped-contract .agents/skills/fgos-code-panel/SKILL.md:None -> docs/architect/agent-coordination/contracts/coordination-session.md | ok | deep | historical consumer; see F1 |
| 48 | `consumer_f80c9f12d2b5a784e88d4e5b` | shipped-contract .agents/skills/fgos-code-panel/SKILL.md:None -> docs/how-to/author-a-plan-loop-track.md | ok | mech | historical consumer; see F1 |
| 49 | `consumer_b390ff76f841fa0af80097ba` | shipped-contract .agents/skills/fgos-code-panel/SKILL.md:None -> docs/platform/packaging-distribution/code-panel-rollout-plan.md | ok | mech | historical consumer; see F1 |
| 50 | `consumer_d5ccbe3e46c417eae9a0dfb5` | shipped-contract .agents/skills/fgos-code-panel/SKILL.md:None -> docs/specs/runner.md | ok | mech | historical consumer; see F1 |
| 51 | `consumer_6f7064fdf156fb99233fedbb` | shipped-contract .agents/skills/fgos-plan-loop/SKILL.md:None -> docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md | ok | deep | historical consumer; see F1 |
| 52 | `consumer_33e5f1f4b33acd00b1002378` | shipped-contract .agents/skills/fgos-plan-loop/SKILL.md:None -> docs/how-to/author-a-plan-loop-track.md | ok | mech | historical consumer; see F1 |
| 53 | `consumer_2a4c2e7b51bda44b8541ca7e` | shipped-contract .agents/skills/fgos-plan-loop/SKILL.md:None -> docs/how-to/run-a-coordination-session.md | ok | mech | historical consumer; see F1 |
| 54 | `consumer_c0fd6bc648918b3f6f694cee` | shipped-contract core/skills/fgos-plan-loop/SKILL.md:None -> docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md | ok | deep | historical consumer; see F1 |
| 55 | `consumer_f4ee8b4b5fa05f67ef84ede6` | shipped-contract core/skills/fgos-plan-loop/SKILL.md:None -> docs/how-to/author-a-plan-loop-track.md | ok | mech | historical consumer; see F1 |
| 56 | `consumer_e817fd457f7422a0da99abe8` | shipped-contract core/skills/fgos-plan-loop/SKILL.md:None -> docs/how-to/run-a-coordination-session.md | ok | mech | historical consumer; see F1 |
| 57 | `consumer_50162d98da99a25670b21270` | shipped-contract domains/coding/skills/fgos-code-panel/SKILL.md:None -> docs/architect/agent-coordination/contracts/coordination-session.md | ok | deep | historical consumer; see F1 |
| 58 | `consumer_405784fc3626a648f2aa6c03` | shipped-contract domains/coding/skills/fgos-code-panel/SKILL.md:None -> docs/how-to/author-a-plan-loop-track.md | ok | mech | historical consumer; see F1 |
| 59 | `consumer_93a3e38e679a2320a0c1410c` | shipped-contract domains/coding/skills/fgos-code-panel/SKILL.md:None -> docs/platform/packaging-distribution/code-panel-rollout-plan.md | ok | mech | historical consumer; see F1 |

## Deep-read list
Row indices read against source/target passages: [0, 11, 12, 35, 36, 37, 38, 39, 40, 42, 43, 45, 46, 47, 51, 54, 57] (17 rows; minimum ten plus all mandatory IO/dynamic/historical/writer rows in this part).

## Totals
ok 60, rework 0, needs-Lead-judgment 0 of 60.
