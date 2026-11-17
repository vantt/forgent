# Lead report: yaml-write-door p09 (doors row and close)

Branch `yaml-write-door/p09`, base integration head `1ec57277a`. Not landed; awaiting OPC MERGE.

## Done
- Red-first `7cf0e7e2e`: one test in `test/architecture.test.mjs`, "door row for a YAML frontmatter fence catches each literal way to open a block and ignores other dashes" (6 caught, 7 passed, plus the `.rs` case). Failed with actual 0 / expected 1 (no row), pushed before the row.
- `1772ec30e`: doors row "write a YAML frontmatter fence" (no debt) in `docs/architecture-manifest.json`, appended last (no S4 row on the base to place after; origin/main did not touch the manifest). Backlog: `p-eqhfqpz3gy` done with the integration head; new rows `p-bazzipipk5` (stale `.claude/agents`, Q1 not answered, recommendation (b)) and `p-4vjneux6wv` (distill url newline). Ids minted from the main checkout.

## Patterns (`new RegExp(source)`)
- `/(['"`])---(?:\\r)?\\n/`
- ``/`---$/``
- `/(['"`])---\1\s*[,\];]/`
- `/\.push\(\s*(['"`])---\1\s*\)/`

Final `allowed`: `src/util/yaml.mjs`, `core/skills/distill/scripts/distill.mjs` (reason: standalone shipped skill script; runs in user projects without the fgOS addon). `debt: []`.

## Live check
`architecture.test.mjs` 61/61 green incl. "every door row holds" (no outside hit, no stale allowed entry). A PCRE grep of the four patterns over src, scripts, bin, core, packages, apps finds only `src/util/yaml.mjs:123` and `core/skills/distill/scripts/distill.mjs:245` outside vendored saphyr test fixtures (pruned by the walk): the five former writers are gone.

## Gates
architecture, doc-health (8), git-mutation-census, check-decision-citation-drift (33): green. `git-one-door-scan`: 0 undeclared sites; no census change needed (no judged file touched).

## Not done / for the plan lead
- Plan status: `plans/261115-1731-yaml-write-door/plan.md` is not on this branch (it lives on `origin/plan/yaml-write-door`), so I did not touch it. Mark it done there with `ak plan` (`close`/`update`) from a plan-branch checkout after landing.
- CHANGELOG candidate (not edited): "YAML written by fgOS escapes invisible bidi and zero-width characters instead of writing them raw."
- Backlog rows were inserted right after `p-eqhfqpz3gy`, not at the top, to limit conflicts with S4 rows that main adds at the top; the big lead landing on main may still see a textual overlap in `docs/backlog.md`.

## Lessons
- A backreference pattern cannot be checked with plain `rg`; use `rg -P` for a quick independent hit list.
- Placing new backlog rows next to the row being closed avoids the top-of-table collision with concurrent plans.
