# HARDEN T8 guards phase lead report

Landed on main as 7bd1b5998..818ffd7aa (docs follow-up 6f109a89f).

## Delta
- Node: scripts -13 net lines (+15/-28); baseline JSON -69 lines; `.gitignore` +1.
- Tests: mirror file +73/-8, citation drift file +27/-78, decision-relation +11/-10. Estimate was tests +10; measured net about +15.
- Test cost: one new test (allowlist agreement), no new spawn site; the drift file's CLI cases now run in process and one real process run stays.
- No test retired. Changed meaning: the decision-relation sweep case now asserts `.agents/skills` is not reached (twins under plugins/fgOS/skills verified byte-identical with cmp, baseline entries identical per file).

## Red evidence
- Allowlist test failed on the missing `.claude/skills/instruction-audit/` line; sweep case failed with `.agents/skills/sample-skill/SKILL.md` returned.
- Mutating one frontmatter line of the `.agents/skills/distill` source failed two mirror tests (distill was not compared before); reverted.

## Timing
Citation drift test file: 7.2 s before, 3.5 s after (load about 40 both).

## Gate
Focused set 165 pass. Full npm test: 8597 tests, 1 fail (known V7n addendum), no ERROR lines; census 0 undeclared sites.

## Not done here
The "every owned skill has a tracked render in both trees" assertion belongs to the render phase, as the plan says; until then the wrapper checks compare only renders that exist.
