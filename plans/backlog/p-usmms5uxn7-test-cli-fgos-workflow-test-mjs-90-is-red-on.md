---
id: p-usmms5uxn7
title: "`test/cli/fgos-workflow.test.mjs:90` is red on main: it expects `workflow start --plan` to be an unknown flag, but OPS-METRICS landed `--plan <dir>` (tests, priority high; source: HARDEN closing report section 2)"
status: done
priority: P1
area: tests
created: 2026-11-21
---

# Why

`test/cli/fgos-workflow.test.mjs:90` is red on main: it expects `workflow start --plan` to be an unknown flag, but OPS-METRICS landed `--plan <dir>` (tests, priority high; source: HARDEN closing report section 2)

# Done when

The stale test is updated to the landed behaviour by the lane that owns it; `npm test` shows it green; one owning proof, no copy. Done 2026-11-19: already landed by commit 0a3f46ac5 (on origin/main), `test/cli/fgos-workflow.test.mjs` 9/9 green; `--plan` is owned by `test/runner/execution/run-request.test.mjs:356/366` and `test/workflow/units-runner.test.mjs:532`.

# Notes

Migrated from the legacy backlog table. Original status: done.
