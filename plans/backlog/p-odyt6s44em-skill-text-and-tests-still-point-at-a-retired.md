---
id: p-odyt6s44em
title: "Skill text and tests still point at a retired mechanism: `route-table-pending.md` says \"let the config rule apply\", and tests or fixtures may still name `mutatingMinRigor`"
status: done
priority: P2
area: collaboration-degree-part-b
created: 2026-10-24
---

# Why

Correct the skill text and remove every leftover. The config key itself (`runner.patterns.defaultRule`) is retired by Part A's config conversion (spec-draft.md 13.1-13.2), which owns it. Review finding: packet F6. Source: plans/261023-1619-collaboration-degree-spec/part-b-evidence-hardening.md B10; owner 2026-10-24 18:09 opened item by item. Dependencies: none; independent of the other nine items and may ship with Part A.

# Done when

`rg mutatingMinRigor` finds no match in source, tests, fixtures or skills, and `core/skills/fgos-cook/references/route-table-pending.md` no longer says "let the config rule apply"; the generated renders are rebuilt with `npm run build:skills`

# Notes

Migrated from the legacy backlog table. Original status: done (main `946d7f1cc`, recorded on the program board in `f2cd3c210`: `route-table-pending.md` is deleted and the slice-kind table in `domains/coding/slice-kinds.yaml` with `fgos workflow propose` replaces it, so the skill no longer says "let the config rule apply"; the generated renders are rebuilt; `runner.patterns.defaultRule` is retired by the config conversion. `mutatingMinRigor` stays in `test/setup/runner-config-conversion.test.mjs` and `test/runner/dispatch-config-patterns.test.mjs` on purpose: it is the body of the retired `defaultRule` key those tests feed in to prove it is refused and converted).
