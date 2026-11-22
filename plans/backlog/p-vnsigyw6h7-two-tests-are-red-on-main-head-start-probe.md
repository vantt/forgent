---
id: p-vnsigyw6h7
title: "Tests red on main after the 11-21/22 lands: portfolio move, migrate verb, label separator, config scrub and schema list, bugfix workflow (tests, priority high; source: lead:S6A, 2026-11-22 02:50)"
status: done
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

2026-11-22 07:50, lead:SUPERVISOR full-suite run at ce1ef4d36 (npm 13 fail of 8369; cargo with --no-fail-fast 4 fail). Triage by cause, traced with git log, not re-run alone:
- Portfolio move and migrate verb (plan 261120-0625-work-data-model, closed 07:32 without this run): `test/cli/subcommand-flag-drift.test.mjs:195,427` lack `migrate` (109997fcf); `test/runner/dispatch-confinement-backend-p03.test.mjs:1279` still writes `docs/discussions` (a1022572a); `test/scripts/convention-conformance.test.mjs:103` flags `plans/backlog/*` as pattern-mismatch (a1022572a, 0fea6eae3); head-start above.
- Tab-label separator `·` to `: ` (483193f2a): `test/plugins/terminal-skill-attach.test.mjs:109`, `test/run-supervisor/terminal-groups.test.mjs:310`.
- Config: `core/config-standard/sessionRotation.yaml` line 19 comment trips the scrub needle in `packages/config/rust/tests/authoring_equivalence.rs:281` (5ed9aee58); `core/config-schema/secretary.schema.yaml` is missing from `SCHEMAS` in `packages/config/rust/src/bundle.rs`, so `golden_schema.rs:123` fails (e345b8974).
- Execution door seam (plan s6a, told to lead:S6A): `test/runner/dispatch-reconciliation-import-graph.test.mjs:251,279` (884c2416a, 2bc81a843).
- Likely environmental, unproven: `test/git/one-door.test.mjs:58` (HEAD moved during the scan), `test/install-packaging.test.mjs:71` (EISDIR on directory symlinks left under `.fgos/assignments/*/outbox`), `apps/fgos/tests/cli_tests.rs:3666` and `packages/run-supervisor/rust/tests/supervise_portable.rs:274` (timing under load).
Logs: forgent-worktrees/main-npm-test-ce1ef4d36.log, main-cargo-test-ce1ef4d36.log.
- Missing `docs/backlog.md` to `plans/backlog.md` sweep: the abandoned work-data-model worktree `261120-0625-work-data-model-p05k` (kept, 60 commits behind main) holds an unverified draft of it. Files that still say `docs/backlog.md` on main: `policy.v1.json` (golden-guarded), `resources.v1.json`, the confinement-policy golden recorder, `test/runner/dispatch-confinement-*.test.mjs`, the head-request and head-start tests, and the `land` example in `command-registry.mjs`; `core/agents/planner.yaml` still says `docs/discussions`. Redo the sweep on the current tip; do not copy the patch.
