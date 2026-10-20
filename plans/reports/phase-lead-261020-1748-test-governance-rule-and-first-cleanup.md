# Phase lead report: test-governance rule pieces, mechanism, phases 0-1

Date: 2026-10-20 (Asia/Saigon). Worktree `chore/test-governance` from `fb8c6e4ae`. Inputs: [counsel](counsel-261020-1658-test-suite-growth-rule.md), owner answers DQ1 (c), DQ2 (a), DQ3 (b).

## Suite totals

- Before: 572 files, 8,039 `test()` calls (static scan of `fb8c6e4ae`).
- After: 572 files, 8,041 `test()` calls. One clone retired, three new tests for the new mechanism.
- `npm test` will print: `suite: 572 files, 8041 test() calls, <s> s wall (baseline 572 / 8041 / ? s at fb8c6e4ae)`. The baseline wall time is empty until the host fills it (below).

## 1. Doctrine pieces

- **Review checklist:** no standalone review skill exists in `core/` (the reviewer role text lives in `src/runner/execution/patterns/role-tasks.mjs` and the coding reviewer skill is `domains/coding/skills/fgos-coding-validating`, both outside this unit's write scope). The four lines of counsel §3.3 went into `core/skills/fgos-run/SKILL.md` §4 "Reviewing a Change That Touches Tests", the skill of the driver that reads producer reports and reviewer findings. Renders regenerated with `npm run build:skills` (only the `fgos-run` renders changed). Follow-up item, not done: have the `reviewer` role text in `role-tasks.mjs` point at that section.
- **`docs/specs/reading-map.md:61`:** the stale "2970 test" count is replaced by a pointer to the printed `suite:` line, the baseline file and the two CLI flags.
- AGENTS.md, design principle 8, Git spec §15 and decision 0072 were already on main; not touched.

## 2. Mechanism

All in `scripts/test-proof-inventory.mjs` (the counsel's suggested home; reused its admission rules and `addedLinesFromGitDiff`, no new tool):

- `scanTestCalls` / `closingParen`: static scan of every line-start `test(` / `it(` call. It returns the title and the body with all whitespace removed. It skips parens inside strings, templates, comments and regex literals. It found 8,041 calls; one call it cannot close still counts. This is a static count: node's JUnit reporter counted 8,656 cases, because loops generate tests.
- `findCloneGroups`: bodies byte-identical across two or more files.
- `suiteReport`: called by `scripts/run-tests.mjs` after the run, so `npm test` prints:
  - the size line against `test/suite-baseline.json`;
  - **ERROR and exit 1** for a clone the baseline does not list;
  - a warning line for baselined clones still present, and a note when baselined clones are gone (so the ratchet can shrink);
  - a warning count of titles shared across files (70 today);
  - warnings for the two existing admission rules (`new-fixture-only-init-without-reason`, `new-real-provider-network-without-marker`), checked on lines added since the merge-base with `origin/main` (or `main`). A checkout git cannot diff gets one "admission rules not checked" line instead of a crash.
- `test/suite-baseline.json`: `sha`, `files`, `tests`, `wallSeconds`, and `knownClones` (the 59 `test/setup` clones, by body hash). Refresh it with `node scripts/test-proof-inventory.mjs --write-baseline [--wall-seconds <s>]`, in the same commit as a deliberate size change. `--duplicates` lists clones and shared titles.
- The clone check fails on new clones now, not only after the existing ones are removed: the existing ones are baselined, so failing only on unlisted clones is the "after phase 1" state for everything outside the Git 07 set.
- `runSelectedTests` now also returns `wallSeconds`, the time of the `node --test` spawn only (not the queue wait or the cargo build). Its five callers (`rg`) ignore unknown fields. Impact analysis: inactive (0 providers registered).
- Cost: about 0.4 s on the real tree.

Two defects in my own first version were found by running the real door and fixed:
1. A top-level `await import()` deadlocked, because `test-proof-inventory.mjs` imported `run-tests.mjs` back. The inventory now computes its own repo root, and its CLI loads `discoverTestFiles` lazily.
2. The admission diff threw in a repository without a commit. It is now caught as a warning.

Limitation: the admission diff sees tracked changes only. A brand-new untracked test file is checked once it is committed (which the runner does before the host's `npm test`).

## 3. Phase 0: re-profile (measured now, in the sandbox)

Method: each of the 572 files run alone under `node --test` with the suite's env, the git-config guard, `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1`, and a host binary plus addon built from this tree. 12 files ran at a time on a 24-core machine at load about 2. Results: 702 s elapsed, 3,063 s summed. **109 files fail in the sandbox** (bwrap or confinement, a read-only `/var/tmp` and state root, terminals or herdr, release staging), mostly in under a second, so their times are not measurements. Two of them (`test/setup/terminal-control-checks.test.mjs`, `test/terminal-control/client-route.test.mjs`) hung until the 600 s kill. September's slowest files (`fgctl-init*`, `fgctl-upgrade`, `loop`) are among the failing ones. The top 20 below therefore covers the 463 passing files only (1,219 s summed). The host profile below is authoritative.

| # | File (passing in sandbox) | Wall s | Cases | Git 07 set |
|---|---|---:|---:|---|
| 1 | `test/rust-host/help-routes.test.mjs` | 96.8 | 5 |  |
| 2 | `test/skills/terminal-pane-ownership.test.mjs` | 60.3 | 4 |  |
| 3 | `test/rust-host/dev-host.test.mjs` | 53.1 | 10 |  |
| 4 | `test/event-store/migrate.test.mjs` | 52.7 | 9 |  |
| 5 | `test/cli/fgos-return.test.mjs` | 34.4 | 58 |  |
| 6 | `test/cli/fgos-merge.test.mjs` | 33.5 | 62 | yes |
| 7 | `test/event-store/store-hardening.test.mjs` | 23.5 | 10 |  |
| 8 | `test/setup/event-store-checks.test.mjs` | 23.0 | 12 | yes |
| 9 | `test/git/land.test.mjs` | 20.4 | 20 | yes |
| 10 | `test/cli/fgos-setup.test.mjs` | 20.2 | 17 |  |
| 11 | `test/event-store/export-legacy-parity.test.mjs` | 19.5 | 7 |  |
| 12 | `test/cli/fgos-verb-help-json.test.mjs` | 17.0 | 12 |  |
| 13 | `test/event-store/verbs.test.mjs` | 16.9 | 7 |  |
| 14 | `test/event-store/door.test.mjs` | 15.1 | 7 |  |
| 15 | `test/cli/unknown-flag-rejection.test.mjs` | 13.7 | 148 |  |
| 16 | `test/cli/fgos-post-merge-3.test.mjs` | 13.4 | 14 |  |
| 17 | `test/cli/fgos-post-merge-4.test.mjs` | 13.2 | 14 |  |
| 18 | `test/cli/fgos-claim.test.mjs` | 13.0 | 31 |  |
| 19 | `test/git/worktree.test.mjs` | 12.6 | 16 | yes |
| 20 | `test/git/scoped-commit.test.mjs` | 12.3 | 26 | yes |

## 4. Phase 1: byte-identical clones

The scan found 60 cross-file groups, each a pair.

**Deleted (1):**

| Deleted test | Twin that still proves the behaviour |
|---|---|
| `test/state/working-tree-clean-unified.test.mjs` "isWorkingTreeClean scope:'whole-repo' (the default, unchanged) still blocks on the SAME dirty file outside the subtree …" | `test/runner/merge.test.mjs:297` "isWorkingTreeClean(repoRoot) still scans the WHOLE repo when repoRoot is a subdirectory …". Same body, same `initRepo` helper text. |

Note for Git 07: if that twin is retired there, its E6 row must name a new owner.

**Not deleted, in the Git 07 set (59), for the next unit after Git 07 lands.** Every pair has an identical title and body, and the helpers they call are identical (the shared `test/setup/helpers/setup-checks-harness.mjs`; `declareExecutor` has the same bytes in both files). The counsel's "55" is 59 by this scan. Recommendation: delete them from `test/setup/checks.test.mjs`. The 2026-08-23 split (`c6f40b05b`) meant to move them into `checks-doctor-config.test.mjs`, which is their topical home. Then run `--write-baseline` so `knownClones` drops to 0.

| `checks.test.mjs` line (delete) | `checks-doctor-config.test.mjs` line (twin) | Title |
|---:|---:|---|
| 891 | 86 | tool-registry-configured passes when no tool-capable executor is declared at all (inactive — a clean skip, nev |
| 901 | 96 | tool-registry-configured passes when every declared tool is checked present (full) |
| 914 | 109 | tsk-3oa2: tool-registry-configured FAILS when a declared tool is missing or never checked (degraded) -- no lon |
| 928 | 123 | node-version-and-git passes under the current process (real Node, real git) |
| 934 | 129 | shell-integration-sourced passes trivially when no rc files exist |
| 943 | 138 | shell-integration-sourced fails when a detected rc file is missing the source line |
| 954 | 149 | shell-integration-sourced passes when every detected rc file already has the source line, and the sourced func |
| 982 | 177 | shell-integration-sourced fails when the source line is present but the sourced function itself is dead (tsk-2 |
| 1026 | 221 | config-not-stale reports failed/not-configured when the shared file is absent |
| 1067 | 262 | config-not-stale fails when the shared file is complete except gateBypass |
| 1077 | 272 | config-not-stale fails when the existing config is missing a default key |
| 1103 | 298 | invariant-checks-configured fails when the section is missing entirely |
| 1111 | 306 | invariant-checks-configured fails when the section is present but yields no runnable command |
| 1123 | 318 | invariant-checks-configured passes and names the configured commands |
| 1137 | 371 | worker-slots-ceiling-usable fails when the section is missing entirely |
| 1149 | 383 | worker-slots-ceiling-usable fails on a ceiling that silently enforces nothing |
| 1164 | 398 | worker-slots-ceiling-usable passes on the unarmed null fgos setup writes, and says so |
| 1175 | 409 | worker-slots-ceiling-usable passes and names a real armed ceiling |
| 1191 | 425 | advise-execute-capabilities-configured fails when runner.capabilities is missing entirely |
| 1199 | 433 | advise-execute-capabilities-configured fails when a slot is missing or malformed |
| 1218 | 452 | advise-execute-capabilities-configured passes when both slots are declared |
| 1302 | 537 | gate-bypass-configured check fails when the shared file has no gateBypass key at all |
| 1310 | 545 | gate-bypass-configured check fails when gateBypass.level is present but not a recognized level |
| 1320 | 555 | gate-bypass-configured check passes when gateBypass.level is a recognized level |
| 1330 | 565 | gate-bypass-configured fix writes a default level when the shared file has no gateBypass key, preserving other |
| 1343 | 578 | gate-bypass-configured fix repairs a malformed level back to the default |
| 1354 | 589 | gate-bypass-configured fix is idempotent: reports unchanged and never rewrites when level is already valid |
| 1367 | 602 | fgos doctor --fix (CLI e2e) actually bootstraps gateBypass.level via the real fix |
| 1387 | 622 | fgos doctor --fix --pretty (CLI e2e) renders a fix line green even when the fix found nothing to change |
| 1411 | 646 | herdr-launcher-configured check fails when the shared file has no herdrOrchestrator key at all |
| 1419 | 654 | herdr-launcher-configured check fails when a toggle is present but not a boolean |
| 1432 | 667 | herdr-launcher-configured check passes when every toggle is a boolean |
| 1452 | 687 | herdr-web-dashboard-configured check fails when the shared file has no herdrWebDashboard key at all |
| 1460 | 695 | herdr-web-dashboard-configured check fails when staticServing is present but not a boolean |
| 1473 | 708 | herdr-web-dashboard-configured check passes when staticServing is a boolean |
| 1486 | 721 | config-awareness is registered on DOCTOR_CHECKS and always passes |
| 1492 | 727 | config-awareness reports "none" when neither project nor global config exists |
| 1504 | 739 | config-awareness reports project active with global not present, when only project config exists |
| 1519 | 754 | config-awareness reports project active with global also present, when both exist |
| 1536 | 771 | config-awareness falls back to global active with project not present, when only global config exists |
| 1605 | 792 | mainCheckoutHookWired is false in a cwd with no .git at all, and never throws |
| 1611 | 798 | mainCheckoutHookWired is false in a real git repo whose core.hooksPath is unset |
| 1618 | 805 | mainCheckoutHookWired is false when core.hooksPath points somewhere other than .githooks |
| 1626 | 813 | mainCheckoutHookWired is true once core.hooksPath is set to .githooks |
| 1634 | 821 | mainCheckoutHookWired is true when core.hooksPath is an absolute path resolving to repoRoot/.githooks |
| 1642 | 829 | mainCheckoutHookWired is true from inside a linked worktree when the main checkout has an absolute core.hooksP |
| 1679 | 863 | fgos doctor (no flags) produces valid wrapEnvelope-shaped JSON on stdout |
| 1692 | 876 | fgos doctor --pretty prints colored ANSI text, not JSON |
| 1703 | 887 | fgos doctor against a fresh cwd with no runner config never creates the shared config file (read-only proof) |
| 1718 | 902 | resolveMainCheckout from inside a linked worktree resolves the main checkout, not the worktree |
| 1736 | 920 | resolveMainCheckout returns null outside a git checkout entirely |
| 1742 | 926 | integrationScriptPath returns a path that actually exists on disk |
| 1748 | 932 | integrationScriptPath names the main checkout even when this copy runs from a linked worktree |
| 1758 | 942 | shell-integration-sourced fails on a dead fgos source line even when the live line is present |
| 1774 | 958 | shell-integration-sourced counts dead lines per rc file across both bash and zsh |
| 1790 | 974 | shell-integration-sourced still passes when every rc file has only the live line |
| 1813 | 997 | shell-integration-sourced samples dead paths instead of printing all of them |
| 1835 | 1019 | no-stuck-merge-abort check passes and fix reports nothing to fix on a clean repo with no MERGE_HEAD |
| 1850 | 1034 | no-stuck-merge-abort check fails and fix reports manual command when MERGE_HEAD exists |

## 5. Plan for phases 2-3

[plans/261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md): per-port inventory with mutation spot-checks (event-store, run-supervisor and terminal-control now; git and holder-lock after Git 07), then use-case extraction slowest first. Every phase carries the Git 07 excluded-files constraint.

## 6. Observations (not changed, outside scope)

- `scripts/check-decision-codes.mjs` reports 375 findings against its baseline on today's tree. Nothing runs it: its test file runs only fixtures, and `docs/specs/reading-map.md:18` wrongly says `npm test` runs it. This needs a separate item: refresh the baseline and wire it like the clone check.

## 7. What the host must run

1. `npm test`. Expect green (the same suite plus three new tests, minus one clone) and a final line `suite: 572 files, 8041 test() calls, <S> s wall (baseline 572 / 8041 / ? s at fb8c6e4ae)` with no `suite: ERROR`.
2. `node scripts/test-proof-inventory.mjs --write-baseline --wall-seconds <S>`, then commit `test/suite-baseline.json` (this also stamps the landed sha).
3. The authoritative phase 0 profile: `node scripts/test-timing.mjs profile --top 50 --log-dir .fgos/runtime/tmp/test-profile-261020`. Replace the top 20 above when the 109 sandbox-failing files rank differently.
4. `cargo test --workspace` for DoD completeness (no Rust changed).

Focused tests run here: `test/scripts/test-proof-inventory.test.mjs` 28/28, `test/state/working-tree-clean-unified.test.mjs` 5/5, `test/architecture.test.mjs` 29/29, `test/setup/skill-wrappers.test.mjs` 127/127, `test/setup/checks.test.mjs` 110/110, `test/cli/fgos-preflight.test.mjs` and `test/scripts/prepare-release.test.mjs` green. `test/scripts/run-tests.test.mjs` is 47/48; the one failure (fixture root) needs a writable `/var/tmp`, which the sandbox lacks. The door was also run end to end on a scratch mirror with two test files: it printed the line, failed on an unlisted clone, and printed the admission warning.

Status: DONE_WITH_CONCERNS
Summary: Review checklist, reading-map fix, `npm test` suite line with baseline, clone ratchet and wired admission rules have landed. One clone outside the Git 07 set is retired; 59 `test/setup` clones are listed for after Git 07; the phase 2-3 plan is written.
Concerns/Blockers: The phase 0 profile was taken in the sandbox, where 109 files fail, so the host must re-run it; the baseline wall time is empty until the host's `npm test`; the reviewer role text in `src/` does not yet point at the new checklist.
