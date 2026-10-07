# Main integration — single-door hygiene

## Result and provenance

Owner subsequently authorized landing the completed execution branch on main. Merge commit **`a004bb59802016d3ddd63f6b8e430fdfa599d60e`** integrates `feat/single-door-execution` (`e5dbfed343c7437893305dd80698ee6c0848146f`) into main after `9882561826b38aa15a9166e7bc0e881cc5b5ec04`.

Main's newer fixture cleanup, full-suite runner/watchdog/serial-lane, provider-capacity lock and council-parity planning commits were retained. Only `CHANGELOG.md` conflicted; both additive sides were retained. No rebase, force update, remote push, installed-release restage/upgrade, global activation or advisory implementation was performed.

Recovery/proof refs:
- `pre-single-door-main-integration`: main before merge.
- `pre-root-junk-cleanup`: annotated pre-deletion source preservation, unchanged.
- `single-door-main-integration-verified`: annotated exact merged-source verification snapshot `d065d5688c997430d51ad0c6c0fd56f5bbde1a76`, tree `3b759fe04bec43bd0e30d1cd34fdd94df81e1817`.

Before committing, the staged delta from the tested snapshot contained **only four integration evidence files**, with no unstaged tracked changes. No implementation or test source changed after that snapshot's full-suite proof. Subsequent handoff updates are documentation only.

## Acceptance evidence

| Surface | Observed result |
|---|---|
| Exact merged-source `env -u CLAUDE_CODE_SESSION_ID npm test` | Exit 0; 6,952 total, **6,879 pass, 0 fail**, 0 cancelled, 8 skipped, 65 existing TODO; 22 suites; 367.573s wall. Default queue/watchdog and store guard intact. |
| Actual main serialized Cargo suites | **176 pass, 0 fail**, all four commands exit 0: fgos34, fgctl0, fgos-host-runtime84, fgos-distribution58. fgctl's zero tests are not coverage proof. |
| Actual main `npm run fgos:dev -- list` | Exit 0; real `fgos.v1` envelope, 301 work items. Fresh per-invocation native digest matched `target/debug/fgos` and manifest. Wrapper removed its own run directory. |
| Actual main configured pre-commit hook | Refused an unapproved root addition with exit 1 after merge. A disposable alternate Git index exercised the real hook; normal index and HEAD remained unchanged, and no working-tree probe file was created. |
| Skill assembly | `npm run build:skills` exit 0; generated projections had zero difference from the staged merged projections. |
| Integration review | Correct; zero findings. Reviewed newer main interactions with fixture cleanup, runner, provider lock, ownership, dev/drift/root behavior and canonical/generated source. |
| Main ancestry/source barrier | Feature is an ancestor of main; permanent `test/e2e/root-file-guard-hook.test.mjs` exists at main HEAD. Doctrine and canonical Phase01 cleanup are integrated. |
| Root cleanup preservation | 14 tracked root files; case study bytes equal `pre-root-junk-cleanup:tsk-1op-case-study-note.md`. |

Full verification details, commands, failures, native hashes and cleanup: [main-integration-tests.md](main-integration-tests.md). Exact isolated-source raw output: [main-integration-test-isolated.log](main-integration-test-isolated.log).

The configured main hook returned:

```text
commit refused: new root files outside .githooks/pre-commit's allowlist (main-integration-root-guard-probe.txt). Move scratch files to .fgos/runtime/tmp/ (or /tmp/fgos-work/); place durable files under their owning directory. Legitimate root additions require an allowlist change landed separately on main first.
```

## Two real-main isolation failures — retained, not bypassed

Both real-main full-suite attempts had the same 6,879 passing assertions and zero failures, but **actual command exit 1**. They are not called successful full-suite runs:

1. Initial run: store guard detected modifications to `.fgos/cache/state.json` and `.fgos/runtime/events-jsonl.truncation-guard.json`. Parent concurrently ran actual doctor. Existing doctor checks persist these derived files (registrations.mjs:1842 and rebuild calls around3594; state store writeView and truncation-guard persistence). Exclusive attribution to doctor remains **[INFERENCE]** without PID-level write tracing. No cache restoration, guard exemption or source change.
2. Second, serialized parent-smoke run: guard detected72 added files under one Unit and Workflow. Their actual records identify live **Delphi** run `wf-run-1791339702144-c85539a6`, started `2026-10-07T02:21:42.159Z`, with Unit `propose-round-1` asking about panel dissent/agreement gates. That request is absent from test fixtures. These live-user artifacts were preserved; no Workflow was stopped or deleted.

The final gate therefore used an isolated checkout/store of the **exact frozen merged source tree**, not an easier/narrowed suite, retry loop, modified guard or fake activation. The complete authoritative suite passed there. Rust/dev proof on actual main remained valid and was not rerun.

Raw failing outcomes remain in [main-integration-test.log](main-integration-test.log) and [main-integration-test-serialized.log](main-integration-test-serialized.log). The newly captured3.2MB live-store `list` payload was omitted from committed evidence to avoid duplicating user business data; validated envelope/stream hashes, byte counts, collection counts, native manifests and exit/cleanup proof replace only that payload. Test output and isolation errors are retained unmodified.

## Runtime readiness and tooling limits

- Actual full `node bin/fgos.mjs doctor --dir /home/vantt/projects/forgentX` timed out after120s with stdin ignored. It was not retried; full environment readiness is **not established** by this integration.
- Direct invocation of the actual registered new drift check completed: **changed123, missing17, extra0**, against activated artifact `sha256:a1ba0d0682a7c00598a9873cd13dbe9bb9500b0a7f6b8260a776a5de0e407c4c`, activated `2026-10-04T08:31:40.901Z`. This is expected stale activated Node-payload diagnosis, not a Rust freshness claim. Existing activation was deliberately not changed.
- The actual hook-wiring check passed; `core.hooksPath` points to `/home/vantt/projects/forgentX/.githooks`.
- GitNexus staged detection ran before commits: source merge214files/102symbols, low reported risk, zero reported processes. Existing stale index incorrectly attributes five symbols to unchanged `domains/coding/AGENTS.md`; reported as a tool issue. Graph process/risk counts are degraded evidence, not proof of no consumers. Current-source review and runtime proof are authoritative here.
- Literal credential scan found no matches in the complete new integration evidence files. Live-store output omission is separate from this limited literal scan; it does not assert a comprehensive privacy/security audit.

## Preservation and cleanup

All11 initially untracked user backup/event/report files remained byte-identical to the captured SHA-256 baseline. Both `.fgos/distribution.json` and `.fgos/installation/activation.json` remained byte-identical. No broad clean/stash/reset or user source staging. Derived caches were not restored to stale content merely to make a guard pass.

Verification agent observed no owned process/group, queue-lock, fixture-root or dev-run leftovers. Parent removed only its owned isolated verification worktree with ordinary `git worktree remove` (no force); its source snapshot remains reproducible through the annotated verification tag. Original planning and execution worktrees, branches, valuable reports, main user runtime and live Delphi artifacts remain intact.

## Cross-plan handoff

The earlier branch-only report's **main-integration barrier is now satisfied**: doctrine, canonical skill cleanup, generated-header implementation and root behavior test are actually on main, with the configured root hook exercised after merge. This satisfies the named hygiene prerequisite for Plan B/convention and advisory Phase03; it does not implement or approve either plan's remaining work.

Advisory capability completion remains pending, with its own Phase01 contract and Phase02 live early-ACCEPT gate. A subsequent advisory branch should start from current main, retain source/writer/build ownership and use the current dev door when exercising working-tree code. No advisory cognition, confinement, recovery or installed-entry acceptance is claimed by this merge.

Final documentation-only staged detection also returned `No changes detected`
despite the three staged handoff/plan files. This separate tool inconsistency
was reported; the explicit documentation ownership list, not that response,
defines the final evidence commit's scope.

## Subsequent owner-requested post-merge cleanup

Removed the clean, fully merged execution worktree
`/home/vantt/projects/worktrees/forgentX-single-door-execution`
and local branch `feat/single-door-execution` with ordinary
`git worktree remove` and `git branch -d`, without force.
No process had its cwd inside that checkout. Directory, branch and worktree
registry absence were verified; main HEAD was unchanged by those operations.

Kept the original planning worktree and `feat/single-door-mechanisms`:
its18 modified/untracked planning files remain byte-identical to the cleanup
baseline. Main's11 user-owned files, activation, shared Cargo target and all
three preservation/verification tags remain intact. Other worktrees and
live Workflow state were not cleaned. Local dependency files in the removed
checkout were removed with it; its target symlink did not delete main's target.
