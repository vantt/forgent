# Integration gate (phase 7)

## Host run (authoritative)

lead:SUPERVISOR ran both suites on the host, main `0044018d1`, in the main checkout (autostash):
`forgent-worktrees/main-npm-test-0044018d1.log`, `main-cargo-test-0044018d1.log`, failing titles in
`main-npm-fails-0044018d1.txt`.

- `cargo test --workspace --no-fail-fast`: 3 reds, the `apps/fgos` run-peer `cli_tests` (S6A's, already sent to them).
- `npm test`: 8096 tests, 17 failed, classified below. No red is owned by this plan once branch
  `red-tests-and-backlog-sweep/p01r` (634fd7121) lands.

| Test | Cause from the log | Class | Owner |
|---|---|---|---|
| `test/runner/dispatch-confinement-backend-p03.test.mjs:1279` secretary shape | `ENOENT mkdir …/docs/sub`: phase 1 removed the line that created `docs/` | **owned by phase 1**, reopened | fixed in 634fd7121; passed on the host in its land gate (`.fgos/runtime/land/land-2559638-1795320755476330147-1.log:401`); land blocked by the two main reds below |
| `test/scripts/convention-conformance.test.mjs:200` | 240 pre-cutoff, 1 post-cutoff: the post-cutoff one is `plans/reports/secretary-handoff-261118-2330.md`, untracked in the main checkout and outside every template (the host ran in the dirty checkout) | environmental: dirty main checkout | the secretary (rename it through `fgos convention path` or remove it); green on a clean tree, as in phase 2's land gate |
| `test/scripts/check-decision-citation-drift.test.mjs:485` real-repo CLI | 48 `cites ADR00xx with no gloss` findings in `platform-foundations.md`, `runner/decisions/h-36d872fbb0e5.md`, `git/spec.md`, `event-store/spec.md` | new | the decisions commits 68420ee14, bddb4fe0d, edd3e4486 (10:18-10:38); needs a backlog row or their author's fix. It is in the land door's fixed gate list, so it blocks every land |
| `test/docs/decisions-corpus-retired.test.mjs:67`, `:80` | `### <id>` headings and the Iron Law 0032 record no longer found | new | bddb4fe0d (decision headings now lead with the D-ADR id), same owner as above |
| `test/docs/rul11-anchor-phrase.test.mjs:42` | `### 0036 — Khoá RUL11…` heading not found | new | bddb4fe0d, same owner |
| `test/cli/subcommand-flag-drift.test.mjs:195`, `:427` | positional sub-verbs list; `migrate` missing | handed | S6a (plan.md "Handed to other plans") |
| `test/workflow/guide-schema.test.mjs:39`, `:48` | ten registered workflows; `coding/bugfix` playbook | handed | S6a |
| `test/run-supervisor/terminal-groups.test.mjs:310` reviewer brief | label `tsk-1lvx: fix terminal layout` vs expected `·` | handed | S6a |
| `test/session-host/head-start.test.mjs:84` | persona text | handed | heads-stable-and-able (0118) |
| `test/git/one-door.test.mjs:58` | `inspect-cursor-stale` | environmental code cause (phase 6 § 1) | needs a backlog row (secretary) |
| `test/install-packaging.test.mjs:71` | `EISDIR` on the live `.fgos` directory symlinks | code cause (phase 6 § 2) | S6a |
| `test/runner/spawn-worker.test.mjs:300` idle budget | idle budget did not fire before the 20 s hard cap | new, not bisected | secretary: needs a backlog row; test file unchanged since b5d40d6ce (11-17), green at ce1ef4d36 this morning |
| `test/scripts/mailbox-live-confined.test.mjs:294` orphan sweep | orphan pid still alive after the sweep | new, not bisected | secretary: needs a backlog row; test file unchanged since fed3427ec (11-14), green at ce1ef4d36 |
| `test/workflow/case-close.test.mjs:263` concurrent prunes | deep-equal mismatch on pruned directories | new, not bisected | secretary: needs a backlog row; green at ce1ef4d36 |

The three unbisected reds sit in timing- and process-sensitive tests and the host was shared with other sessions'
lands during the run. The lead cannot run tests from its confinement, so it could not bisect them.

Also red on main and in the land door's fixed gate list (seen in the p01r land gate, not in the 0044018d1 run):
`test/setup/git-mutation-census.test.mjs` "mutation census was not built from this payload: bin/fgos.mjs,
core/skills/_shared/executor-dispatch-fallback.md, scripts/check-decision-citation-drift.mjs, …". The census was not
regenerated after those files changed; owner of the latest change to them.

## Acceptance

- Criterion 7: met for this plan's own scope once 634fd7121 lands. Every other red above has a named owner or a
  backlog-row request.
- Criterion 5: `rg -n 'docs/backlog\.md|docs/discussions' --glob '!plans/**' --glob '!archive/**' --glob '!CHANGELOG.md' -l`
  lists 77 files and `reports/kept-legacy-references.md` has exactly those 77 rows (checked file for file).
  `dispatch-confinement-backend-p03.test.mjs` keeps its read-only `docs/backlog.md` pointer probe on purpose;
  `docs/history/**` counts as a recorded artifact like the corpora.

## Earlier sandbox runs (superseded)

Two unit runs on `7180cca94` inside the unit sandbox gave cargo 72 failed and npm 296 failed in 57 files; the host run
shows those were sandbox reds (read-only host state root, PID namespace, no bwrap, no git identity). Unit
`unit-run-1795315185036-8659fb96`; logs in the p07 worktree's `.fgos/runtime/tmp/`. The unit's draft report claimed a
pass and listed reds that had not failed; the lead rewrote it.
