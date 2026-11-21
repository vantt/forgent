---
id: p-vnsigyw6h7
title: "Two tests are red on main: head-start's role-launch case and guide-schema's workflow count (tests, priority high; source: lead:S6A, 2026-11-22 02:50)"
status: proposed
priority: P1
area: tests
created: 2026-11-22
---

# Why

lead:S6A reported both reds at c5dfce61c, before and after its phase 20 part 2 land (a87add7a9), and confirmed they fail with main's own code:

- `test/session-host/head-start.test.mjs`, case "the session launches with its role…": the `display.title` probe expects a different name than the `ds-…-probe` it gets. The likely cause is the portfolio move (a1022572a, 0fea6eae3), which renamed discussions to `ds-<id>-<topic>`.
- `test/workflow/guide-schema.test.mjs:40`, 2 cases: `REGISTERED.length` is 10, not 9. Commit d44b2fb19 (2026-11-21 13:33) added `domains/coding/workflows/bugfix.yaml` and did not update this test, and the coding/bugfix playbook case fails with it.

Every lead's gate now carries these two reds, so a real new red is harder to see.

# Done when

Each test asserts the behaviour that landed (the new discussion name; ten workflows including bugfix, with its playbook). Both files are green under `npm test`. No assertion is weakened.

# Notes
