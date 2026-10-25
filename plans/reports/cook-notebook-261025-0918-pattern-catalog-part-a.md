# fgos-cook notebook: pattern catalog Part A

- Plan: `plans/261024-2008-pattern-catalog-part-a/plan.md` (12 phases). This run: phases up to and including 01.
- caseId: `wf-run-1792894823697-d06fe2f7` (guide `coding/feature`)
- Branch: `cook/pattern-catalog-part-a`; worktree `/home/vantt/projects/forgent-worktrees/cook-part-a`
- Base: origin/main `811d6dc84` (worktree create started at local main c312902df, 45 commits behind; fast-forwarded with `git merge --ff-only origin/main` before any dispatch)
- Approved frame (COOK lead): `dispatches=30, mutatingDispatches=22, rigorFloor=standard`, seatLaunchesPerDispatch left at guide default. (The plan's own suggestion was 45/36/12; the lead set the smaller frame.)
- Raw outputs: `/home/vantt/projects/forgent/.fgos/runtime/tmp/cook-part-a/`

## Pre-dispatch check of phase 01 against code at HEAD 811d6dc84

Phase 01 matches the code, with these gaps (all added to `--writes`):
- Callers of `patterns/{index,reviewed,panel,history-outcome,...}` the phase did not list: `test/runner/execution/run-case-admission.test.mjs:13` (reviewed.mjs), `test/runner/execution/unit-summary.test.mjs:10` (index.mjs). `test/runner/execution/patterns/presets.test.mjs:5` imports `role-tasks.mjs` (moves) so it needs an import-path edit although it stays.
- `src/runner/execution/{legacy-seat-read,seat-resolver}.mjs` and `test/workflow/core-workflow-seats.test.mjs` import only `patterns/presets.mjs`, which stays: no edit.
- Doc-only mentions (`CHANGELOG.md`, `docs/distillery/*`, `archive/*`, skills naming `presets.mjs`) are history or name `presets.mjs` which stays; area specs and skill text are phase 11/12 scope. Not touched.
- `loops/index.mjs` imports `./presets.mjs` -> `../patterns/presets.mjs` (presets.mjs has no imports of its own, so no cycle).

## Dispatch table

| # | Start-end | Activity | Route | Capability | Rigor | Pattern | unitRunId | Executor/model | Outcome | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 09:20-09:22 | judge-ambiguity | should | code:review | standard | solo | unit-run-1792894838874-39e5d7e9 | claude/sonnet (decide said openai, run bound claude) | execution-failure (verdict-inconclusive, no outbox) | known claude read-only failure; no milestone; counted against frame |
| 2 | 09:22-09:25 | judge-ambiguity | should | code:implement | standard | solo | unit-run-1792894956751-ab60bd42 | gemini/gemini-3.8-flash-high | pass | verdict UNCLEAR only for phase 01 write gap (3 test files), decisions LOCKED; `decisions-locked` achieved (self-check passed) |
| 3 | 09:26-09:52 | validate-plan | should | code:implement | standard | reviewed | unit-run-1792895174721-4ec717db | producer gemini, reviewer deepseek-v4-pro, red-team xai grok-4.5, 2 rounds | findings | `plan-validated` achieved; 26 min |
| 4 | 09:52-10:11 | implement-item (phase 01) | should | code:implement | standard | reviewed | unit-run-1792896772888-e2f92641 | producer gemini-3.8-flash-high, reviewer deepseek-v4-pro, red-team xai grok-4.5, 1 round | execution-failure | producer pass and committed b8a9cc92e; runner verify pass; red-team pass; reviewer seat lost its carrier (exit 1, stderr `carrier-lost`), so no pass receipt: `child-verified` unreached |
| 5 | 16:44-17:14 | implement-item resume (phase 01) | should | code:implement | standard | reviewed | unit-run-1792896772888-e2f92641 (--resume, reviewer run 02) | producer/red-team results reused; reviewer deepseek/deepseek-v4-pro, pool openrouter (account openrouter), pane w4:pCC | execution-failure | resume accepted (not refused) but the reviewer bound the OLD model, not the thehive v4.1-flash cell; OpenRouter 402 again; pane hung idle at the pi error until I closed it at 17:14:16; frame not charged by the resume |
| 6 | 17:15-17:19 | implement-item fresh (phase 01, told the move is already in b8a9cc92e, change nothing) | should | code:implement | standard | reviewed | unit-run-1792923337708-b83e932c | producer gemini-3.8-flash-high (pane w4:pCD); reviewer and red-team NEVER launched | execution-failure (producer verdict-inconclusive, confidence no-evidence) | producer verified b8a9cc92e and claimed done with no edits, no changedFiles, no tests in evidence; the round ended inconclusive before any checker seat or the verify step ran. Reviewer model/pool: not bound this run |
| 7 | 19:02-19:47 | implement-item fresh after owner-approved branch reset to 811d6dc84 | should | code:implement | standard | reviewed | unit-run-1792929779142-b3e30a1e | producer gemini-3.8-flash-high (pane w4:pCM); reviewer deepseek, model thehive/deepseek-ai/deepseek-v4.1-flash-1017, pool thehive (pane w4:pCQ); red-team xai grok-4.5 (pane w4:pCR) | execution-failure | producer pass, committed 2973f9177; runner verify pass; red-team pass; reviewer `execution-timeout` (35 min) so no pass receipt; `child-verified` unreached |
| 8 | 20:21:36-20:21:47 | implement-item (phase 02) | should | code:implement | standard | reviewed | unit-run-1792934496758-64c8924a | producer gemini (omp, pane w4:pD3); reviewer/red-team never launched | execution-failure (producer nonzero-process-exit, provider family) | omp exited 1 eleven seconds after launch, right after showing 'Working...', back at the shell prompt; no outbox, no edits, tree clean. Phase 01 accepted by the lead as known gap (child-verified unreached); implement-item was NOT refused (entry plan-validated) |
| 9 | 20:22:20-20:22:21 | resume of row 8 | should | code:implement | standard | reviewed | unit-run-1792934496758-64c8924a (--resume) | none launched | execution-failure (replayed) | resume returned in 1 s with the stored settled result of producer run 01 (settledAt 13:21:46Z, no runs/02, no herdr-spawn line); frame not charged |
| 10 | 20:23-21:24 | implement-item fresh (phase 02) after the pane before-picture | should | code:implement | standard | reviewed (2 rounds) | unit-run-1792934580316-dfac0e8a | round 1: producer gemini-3.8-flash-high (w4:pD4), reviewer deepseek thehive/deepseek-ai/deepseek-v4.1-flash-1017 pool thehive (w4:pD5), red-team xai grok-4.5 (w4:pD6); round 2: producer gemini, reviewer deepseek same model (w4:pD8), red-team xai (w4:pD9) | execution-failure | commits 8b0e37ff9 (feat) and 88f4f0941 (test fix of reviewer findings F1,F2); both runner verifies pass; red-team pass both rounds; reviewer round 1 findings (3 minor), reviewer round 2 execution-timeout (no report; token counter in its pane static 314k from 21:11 to 21:24) |
| 11 | 21:48-21:54 | implement-item phase 03 slice 3a (data files + Rust goldens) | should | code:implement | high | reviewed | unit-run-1792939693154-f369b20a | producer gemini-3.8-flash-high (omp-herdr, pane w4:pDA); reviewer and red-team NOT launched (xai binding for reviewer therefore unconfirmed) | execution-failure | producer pass (classification verified, 5 files changed, all in writes); commit door refused: `commit.status failed, reason git-error, error commit-header-invalid` (packages/git/rust/src/scoped_commit.rs:122/162, parsing the `git show --raw -z` observation); no commit, 5 files left dirty in the worktree; verify and checkers never ran. Not a seat crash and not foreground-not-agent |
| 12 | 22:00-22:06 | implement-item phase 03 slice 3a again (census added to writes and a mandatory last step) | should | code:implement | high | reviewed | unit-run-1792940234112-94edf6a5 | producer gemini-3.8-flash-high (pane w4:pDB); reviewer/red-team NOT launched, so the xai reviewer binding is unconfirmed | execution-failure | producer pass; commit door refused again with `resource-recovery-required` (packages/git/rust/src/refs.rs:156 admission: a pending operation chain from the earlier failed commit still holds the resource; scoped_commit.rs:579); 6 files dirty (5 + census) |

## Milestones

After dispatch 4: request-received, decisions-locked, plan-validated achieved; child-verified unreached; integrated/approved/merged unreached. frameRemaining: dispatches 26 of 30, mutatingDispatches 21 of 22 (4 dispatches charged for the claude failure, judge, validate, phase 01; the mutating count is 1).

## Seat launch failures

- 09:20 (row 1): not a pane failure; claude/sonnet bound for code:review settled verdict-inconclusive with no outbox (run unit-run-1792894838874-39e5d7e9). `fgos dispatch decide --for code:review` had said openai, the run bound claude (provenance scope cliOverride). HARDEN evidence.
- (corrected by the lead at 16:5x: the 10:11 failure was an OpenRouter 402, out of credit, not carrier loss.) 10:11 (row 4): reviewer seat deepseek pane w4:pAF, run `run_unit-run-1792896772888-e2f92641/reviewer/1_01`, exit 1, stderr `carrier-lost`, settled execution-failure (nonzero-process-exit). The other two seats completed in the same round. HARDEN evidence (pane carrier lost mid-run, no fallback seat launched).
- Token usage came back null (source unsupported for gemini; transcript-null for claude): p-mvc3d54cda.
- `timeout fgos ...` fails with 127 (fgos is not an executable on PATH for timeout, shell function/alias); use plain fgos in the background instead.

- 17:14 (row 5): resume reviewer run `run_unit-run-1792896772888-e2f92641/reviewer/1_02` bound executor deepseek, model deepseek/deepseek-v4-pro, provider-capacity pool `openrouter` (accountId openrouter), via herdr pane w4:pCC (pi). Pane showed 402 "requires more credits ... can only afford ~10-24k of 384000 max_tokens" (many previous_errors) and then sat idle for 29 minutes; the executor timeout is 35 min. I closed the pane (my own run's pane) with `herdr pane close w4:pCC`; the run then settled nonzero-process-exit. Findings for HARDEN: (a) resume kept the stored model/pool instead of the new config cell (thehive v4.1-flash); not verified whether a fresh dispatch would bind the new cell; (b) a seat that errors with 402 in pi never exits, so the run waits for the full timeout; (c) the request asks for max_tokens 384000.

- 17:19 (row 6): no seat launch failure. A writing producer that makes no change gives the reviewed loop no evidence (result.json classification: verdict inconclusive, confidence no-evidence, evidence.changedFiles empty), so the loop stops at round 1 without launching checkers or verify. Consequence: a slice cannot be re-run to merely re-review work that is already committed; a review-only receipt for committed work needs another door (review-item needs child-verified as entry, so also not available). HARDEN/design evidence. Phase 01 stopped here BLOCKED by the lead's bound (this was the last allowed dispatch).

- 19:47 (row 7): reviewer bound correctly (thehive v4.1-flash, not v4-pro, no 402). It acked 19:12:37, then spent the round re-running test/architecture.test.mjs and baselines in /tmp trying to explain an A4 failure (`git-addon-not-shipped`, an env limit of its sandbox, also seen by the first-move red-team), wrote no report; token counters in its pane froze at 323k from 19:32 to 19:46 (>14 min, past the 10-minute hang rule); I did not resume or retry and did not close the pane; the run settled itself at the 35 min executor timeout. HARDEN evidence: the reviewer is not told which tests are unrunnable in its sandbox, and nothing bounds its investigation short of the executor timeout.

- 20:21 (row 8): producer seat pane w4:pD3, run `run_unit-run-1792934496758-64c8924a/producer/1_01`, omp exit 1 after 11 s with no outbox and no stderr text. Looks like the seat-process crash/cancel family (p-4bkfiw7d3j); not a 402 or provider-limit message. Per the lead's latest hang rule (no resume, no unchanged retry) I stopped; the old standing instruction was one `--resume` for this failure kind, which the lead has not re-authorised for phase 02. Frame charged 1 dispatch + 1 mutating.

- 20:22 (row 9): the row 8 failure's own runnerNote says `the agent was stopped: terminal:foreground-not-agent` (the pane's shell was in the foreground, the known p-4bkfiw7d3j gate, never bypassed). `fgos run --resume` did not relaunch the seat: it replayed the settled result. So for this failure kind, resume of a settled unit is a no-op; the designed remedy did not work here. Stopped per the lead (no fresh dispatch on this outcome). HARDEN evidence.

- 21:24 (row 10): no foreground-not-agent this time; the new panes launched fine. Reviewer seat again ran past the 15 minute bound in round 2 (acked 20:49:12, no report by 21:24, settled execution-timeout), the same pattern as phase 01 row 7. The reviewer bound did let round 1 finish in 3 minutes of useful work (it drove the code outside the broken harness instead of investigating the addon failure). HARDEN evidence: a round-2 reviewer re-reviews from scratch and does not stop by itself.

- 21:54 (row 11): no seat failure; the failure is the Git commit door on the scoped commit of the producer's work: `commit-header-invalid` from scoped_commit.rs (split_observation / raw_entries refuse an observation shape), result commit {status: failed, reason: git-error}. The reviewed loop stops there, so no checker seat launched, no verify. HARDEN/GIT evidence. Dispatch charged: 1 dispatch + 1 mutating. Worktree is DIRTY with the 5 modified paths; the runner will not commit paths dirty at launch, so any next dispatch for 3a must start from a clean tree or the lead decides how the 5 files get committed.

- 22:06 (row 12): second commit-door refusal in a row. `resource-recovery-required` is raised by refs::admission when an earlier operation chain on the same resource set has no outcome: the failed commit of row 11 left its WAL chain pending in the Git door, so every later scoped commit on this checkout/branch refuses until that chain is recovered or abandoned. Recovery is a Git-door action, not mine. Evidence for the Git owner together with the commit-header-invalid combined-diff defect. Dispatch charged 1+1.

## Own verification of phase 03a, second producer take (row 12, uncommitted tree)
- Producer content is NOT identical to the first take saved in p03a-producer-uncommitted.patch: schema +150 (first +167), standard +78 (first +120), authoring-source.config.json +96 (first +11), repo-differences +2 (first +42), golden_migrate.rs 2/2 lines; plus census 4 lines. Same five files. Different producer rounds, so the two takes need a content review against spec 5.4 (no reviewer has read either).
- `cargo test -p fgos-config --no-fail-fast` run directly by me: exit 0, 95 passed, 0 failed (p03a2-cargo.log). I also ran `node scripts/git-one-door-scan.mjs --write-census` once (a generated file, in writes), the dirty set stayed the same 6 files.

## Own verification of phase 03a (row 11, uncommitted tree)
- `cargo test -p fgos-config --no-fail-fast` (env vars unset, CARGO_BUILD_JOBS=4, run directly by me): exit 0, 95 passed, 0 failed (log p03a-cargo.log).
- Changed files (all inside the writes): runner.schema.yaml (+167/-?; `$id` bumped v1 to v2), runner.yaml (loops, eight patterns solo reviewed panel debate code-change consult rfc research-fan-out, seatBinding schema 2), authoring-source.config.json, repo-differences.v1.json, golden_migrate.rs (count). Node side untouched, as briefed.
- Not yet checked by me: content of the eight entries against spec 5.4, no `defaultRule`, no `research-fan-out-gated` (needs a read of the diff; no reviewer report exists).

## Own verification of phase 02 (row 10, HEAD 88f4f0941)
- Diff ec07e53a0..HEAD: 3 files, 104 insertions, 4 deletions: case-admission-port.mjs +20 (only the added export, createCaseAdmissionPort untouched), test file +84/-?, census 4 lines. Nothing outside the declared writes; worktree clean.
- Verify re-run with the three session env vars unset: exit 0, 49 tests pass, 0 fail (log p02b-verify-rerun.log).
- Read reviewer round 1 report (matrix of requirements 1-4 and steps 1-3 all PASS; 3 minor findings F1-F3 in its write scope, F1/F2 fixed in commit 88f4f0941, F3 not stated in the claim summary) and the red-team claims of both rounds (pass). Round 2 reviewer: no report.
- Dispositions: F1 (test title wording) accepted and fixed; F2 (whitespace-only pattern case) accepted and fixed; F3 (playbook shape `{step, units}` re-encoded at case-admission-port.mjs:65, produced at guide-schema.mjs:165; suggests one shared predicate) DEFERRED: it touches guide-schema.mjs outside the declared writes; fold into phase 08 or a small item, not required by phase 02. Observations for later phases: (a) `caseId` is joined into the path unchecked (path traversal, pre-existing and shared with openCaseFacts/isChildOf, separate item); (b) the returned `pattern` is untrimmed while unit.mjs:262-267 trims, relevant for phases 06/08.

## Own verification of phase 01 (row 7, commit 2973f9177)
- 22 files, 40/40 lines, identical file set to the first move; `git diff refs/cook/phase01-first-move HEAD --stat` is empty (identical trees). No path outside declared writes. Worktree clean.
- Verify re-run with the three session env vars unset: exit 0, 52 pass, 0 fail. Greps: no stray `patterns/`; only presets.mjs references remain.
- Checker report read: red-team pass (pure moves R100/R092, tests pass); reviewer none.

## Own verification of phase 01 (row 4)

- Commit b8a9cc92e `refactor(runner): move loop engines and tests to loops/` on the case branch; 22 files, 40 insertions, 40 deletions: seven src renames (content unchanged), seven test renames (import/path lines only), run.mjs/dry-bind.mjs/unit-summary.mjs 2+1+2 import lines, run-case-admission and unit-summary tests, presets.test.mjs, manifest 14 lines, census 22 lines. Diff matches declared writes; nothing outside them; worktree clean (git status empty).
- Re-ran the phase verify with CLAUDE_CODE_SESSION_ID, CODEX_THREAD_ID, FGOS_SESSION_ID unset: exit 0, 52 tests pass, 0 fail (log under tmp dir p01-verify-rerun.log). The red-team's "1 architecture fail, env noise" did not reproduce.
- `git grep -n "patterns/" -- src test | grep -v presets`: empty (rc 1). `git grep execution/patterns -- src test scripts docs/architecture-manifest.json` lists only presets.mjs references (manifest:306, presets.test.mjs:4, core-workflow-seats.test.mjs:16). patterns/ holds only presets.mjs, test patterns/ only presets.test.mjs.
- Checker reports read: red-team pass (75/75 loops+presets+census tests, engine blobs unchanged); reviewer has no report (carrier lost).

## Dispositions

validate-plan (unit-run-1792895174721-4ec717db), all seats agreed, four defects, all write-scope omissions in plan text:
- Phase 01 omits test/runner/execution/{run-case-admission,unit-summary}.test.mjs and patterns/presets.test.mjs import edits: ACCEPTED, fixed up front in phase 01's `--writes` (no fix slice needed).
- Phase 04 omits test callers of the changed `resolveSeats`/`seatLaunchesOf` signature (run.test.mjs, core-workflow-seats.test.mjs, run-case-admission verify mismatch): ACCEPTED for the phase 04 conductor, expand writes by grep at slice time.
- Phase 06 deletes presets.mjs but test/workflow/core-workflow-seats.test.mjs imports it: ACCEPTED for phase 06 (add to writes).
- Phase 10 dependency header inconsistent with 07/08 headers; phase 11 depends mismatch (minor): DEFERRED to the conductor at those phases (serial order 01..12 is executable regardless).

## Parked questions

none. Open item for the lead (the one resume was used and failed; per the lead's rule I stopped; a new dispatch needs the lead's decision): phase 01 content is committed and verified, but `child-verified` needs a passing reviewed round. Next step (held at the lead's request): `fgos run --resume unit-run-1792896772888-e2f92641 </dev/null` once, without --timeout.

## Deferred items

none yet

## Log

## Herdr pane list before the fresh phase 02 dispatch (20:22:54)

```
9
w2:p1	-	unknown	vantt@fg-server:~	/home/vantt
w3:p2	-	unknown	vantt@fg-server:~/projects	/home/vantt/projects
w4:pG	claude	done	Handoff quản lý rule 261021-1446	/home/vantt/projects/forgent
w4:pK	claude	done	Handoff điều phối data-platform	/home/vantt/app/fg-dataware-house
w4:pM	claude	done	Data platform execution handoff	/home/vantt/app/fg-dataware-house
w4:p1V	claude	done	Plan về mailbox	/home/vantt/projects/forgent
w4:p36	claude	working	Cấu hình agent và model tiết kiệm	/home/vantt/projects/forgent
w6:p1	claude	done	Chức năng proxy cho gdrive	/home/vantt/projects/workshop-ecosystem
w7:p1	-	unknown	vantt@fg-server:~/app/fg-dataware-house	/home/vantt/app/fg-dataware-house
```

## Herdr pane list before phase 03a dispatch (21:47:40)

```
8
w2:p1	-	unknown	vantt@fg-server:~
w3:p2	-	unknown	vantt@fg-server:~/projects
w4:pG	claude	idle	Handoff quản lý rule 261021-1446
w4:pK	claude	idle	Handoff điều phối data-platform
w4:pM	claude	idle	Data platform execution handoff
w4:p36	claude	working	Cấu hình agent và model tiết kiệm
w6:p1	claude	done	Chức năng proxy cho gdrive
w7:p1	-	unknown	vantt@fg-server:~/app/fg-dataware-house
```
