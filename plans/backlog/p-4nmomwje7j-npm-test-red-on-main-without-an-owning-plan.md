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

## Update 2026-11-27 (lead:SUPERVISOR, fg-server2)

An unconfined `npm test` on a clean worktree of main at `1657a5b31c` (log `.fgos/runtime/tmp/keeper-final-gate/npm-test.log` on fg-server2) failed 15 tests in 5 files. This row now blocks every release on fg-server2 (owner question q-apqmci34ry): release check `npm test` fails, so changelog-fragments phase 3 and the plans behind it wait.

- `test/run-supervisor/terminal-cutover.test.mjs` (8) and `test/run-supervisor/terminal-crash-matrix.test.mjs` (1): 60 s timeouts (pane agent trust prompt, provider limit screen, invocations[] executor, codex writer id, brief result path). Already red at `535ba499d8` on 2026-11-26 21:20.
- `test/runner/provider-per-cli-credential-sources.test.mjs` (2): store provisioning per CLI. Red at `535ba499d8` too.
- `test/workflow/guide-schema.test.mjs` (2): the `playbook` vs `guide` mismatch named above, still red.
- `test/skills/fgos-supervisor-idle-lead.test.mjs` (2): fixed by Keeper `5be73f9289` after this run.

The coloured exit code, domain-registry, terminal-groups, convention and case-close failures above did not appear in this run.
