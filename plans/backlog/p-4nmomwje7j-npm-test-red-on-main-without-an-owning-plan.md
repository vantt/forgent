---
id: p-4nmomwje7j
title: "npm test red on main with no owning plan: coloured exit code, workflow guide schema, no-deps domain registry, terminal group title, convention conformance, case-close prune (tests, priority P1; source: owner's unconfined run at 5a5dde6e0, 2026-11-23 23:33)"
status: proposed
priority: P1
area: tests
created: 2026-11-23
---

# Why

The owner's unconfined `npm test` on main at `5a5dde6e0` failed 18 of 7895 tests. Eleven are attributed to running plans (component-authority-doors, heads-stable-and-able) and were routed to their leads. These seven have no owning plan (attribution from `git log`, not a proven cause):

- `test/distribution/native-addon.test.mjs:32` and `test/git/native-load.test.mjs:72`: exit code arrives coloured (`'\x1B[33m8\x1B[39m'`), likely the run's environment.
- `test/workflow/guide-schema.test.mjs:39,48`: 10 registered workflows where 9 are expected; `guide` where `playbook` is expected for `coding/bugfix`.
- `test/state/domain-registry-compiled.test.mjs:27`: `src/workflow/definition.mjs` now imports `src/native/door.mjs`, missing from the no-deps copy.
- `test/run-supervisor/terminal-groups.test.mjs:310`: title separator `:` where `·` is expected.
- `test/scripts/convention-conformance.test.mjs:200`: one post-cutoff naming violation.
- `test/workflow/case-close.test.mjs:263`: `unreadable` once, possibly flaky under load.

Evidence: `plans/261123-0828-head-stop-rotation-bad-measure/reports/lead-261123-2333-head-stop-rotation-bad-measure-verify.md`, groups 3 to 8.

# Done when

Each failure's cause is proven and fixed in production code or its fixture (never by weakening the test), and an unconfined `npm test` on main has none of them. This unblocks `p-vbv57yc4d5` (head-stop rotation bad-measure).


# Notes

Note section added by head:supervisor-forgent on 2026-11-24 so the backlog index check passes; no content change.
