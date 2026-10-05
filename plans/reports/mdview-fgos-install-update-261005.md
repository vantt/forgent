# mdview fgOS install update, 2026-10-05

Project: `/home/vantt/projects/mdview`. Doctor was always run as `env -u CLAUDE_CODE_SESSION_ID node /home/vantt/projects/forgentX/bin/fgos.mjs doctor` from inside mdview.

## 1. Result

Doctor total is 96 checks. Failing went from 12 (the 13 in the brief minus `agent-cli-project-trusted`, already passing, and `confinement-orphaned-resources-reaped`, already passing) to 10. Two fixes were applied by official commands: `fgos tool check` (moved tool-registry from "2 never checked" to "1/2 present, 1 missing", still degraded because gitnexus is not installed) and `fgos friction migrate` (fixed `observe-friction-migrated`). No registered `doctor --fix` entry covers any remaining failure, so `--fix` was deliberately not run (it runs every registered fix, including machine-level ones such as gateway token, plugin marketplace and confinement backend registry, which can write outside mdview).

## 2. The checks

Categories: (a) fixable by an official command, safe in mdview; (b) forgentX-side bug or check not applicable to mdview; (c) owner decision or machine-level.

| # | Check | Before | Cat | Action | After |
|---|-------|--------|-----|--------|-------|
| 1 | shell-integration-sourced | source line present, but `fgos --help` fails after stripping `_fgos_tier2_bin` (harness shell-function snapshot) | c (machine-level) | none: shell rc is machine-level, setup would write outside mdview | fail |
| 2 | model-policy-tier-coverage | project `xai` lacks tier nano; global `openai` lacks standard, flagship, frontier | c | none: owner's model-policy values, must not be edited | fail |
| 3 | task-specs-resolve | 22 task-spec files "not found" under mdview `domains/` and `core/` | b | none (see bug B1) | fail |
| 4 | tool-registry-configured | degraded, 0/2 present, 2 never checked | a | `fgos tool check` | degraded, 1/2 present (herdr present, gitnexus missing: not on this machine's PATH). Still counted as failing; remaining step is installing gitnexus, an owner decision |
| 5 | domain-workflow-operations-coverage | 15 operations "taskSpec not found" | b | none (same root cause as 3, bug B1) | fail |
| 6 | provider-capacity-state | quarantine present `mucdong:quota-limit:until=2026-10-04T11:29:45Z` | c | none: runtime state, doctor never auto-clears; the until-time is already in the past, so the owner can run `fgos dispatch reconcile provider-capacity clear-quarantine` after confirming the account is fixed | fail |
| 7 | doc-source-conservation | 17 outcome source captures unresolvable | c | none: mdview `docs/doc-registry.json` is empty (`topics: []`, `docs: []`) while 17 outcomes in `.fgos/events.jsonl` carry docPaths; fixing it is a knowledge-registry migration with content decisions, not a safe one-liner | fail |
| 8 | executor-profile-warnings | 9 legacy executor-profile warnings (policy-shaped flags in claude, glm, openai, gemini, xai, deepseek, claude-herdr, glm-herdr, pi) | c | none: informational, the check itself says "not blocking"; fixing means rewriting the owner's executor config | fail (informational) |
| 9 | confined-pane-accounts | executor `glm-herdr`, invocation `pi-herdr-openrouter` has no `runner.providers.z-ai.accounts` in the global config | c | none: global config plus a credential, owner action (the glm to z-ai/glm-5.3 hand edit probably moved the provider id to `z-ai`) | fail |
| 10 | agent-cli-project-trusted | was failing in the brief | n/a | none | pass (mdview trusted in codex-fgovn, agy mucdong and agy tetnu homes) |
| 11 | confinement-orphaned-resources-reaped | was failing in the brief | n/a | none | pass (nothing under /tmp/fgos-confinement) |
| 12 | coordination-sessions-closed | 5 sessions "active" past 7 days, oldest `coord_mtjpv51p_pi8y7a` (33d) | c | none: doctor states "no auto-fix"; closing a session means choosing completed/partial/failed/cancelled | fail |
| 13 | observe-friction-migrated | `.fgos/observe/friction` missing while legacy work.friction records exist | a | `fgos friction migrate` (via the release Rust host) | pass, "all 2 legacy work.friction record(s) migrated" |

## 3. Commands run (all from inside mdview)

1. `git status --short` (before): untracked only `.agents/`, `.claude/settings.json`, `.claude/skills/`, `docs/decisions/`, `docs/doc-registry.json`, `docs/doc-registry.md`, `docs/enduser-docs-index.json`.
2. `fgos.mjs doctor` (read-only) saved to `/tmp/mdv-doc0.json`, again to `/tmp/mdv-doc1.json` after the fixes.
3. `fgos.mjs doctor --help`, `fgos.mjs setup --help`, `fgos.mjs tool --help`, `fgos.mjs friction ...` (help and discovery only; `setup` was never executed).
4. Backup to `/home/vantt/.claude/jobs/a019f72e/tmp/mdview-backup-261005/`: `.fgos/config.json`, `.fgos/observe/` (empty then), `git-status-before.txt`.
5. `fgos.mjs tool check`: probes declared tools, writes only `.fgos/runtime/tool-status.local.json` (local, git-ignored).
6. `<release>/bin/fgos friction migrate` (the Rust host, release `sha256:79494e7c...`): migrated 2 records into `.fgos/observe/friction/pid-2037840.jsonl` (797 bytes). The Node entry cannot run it: `fgos.mjs friction` answers "only exists in the Rust host".
7. `fgos.mjs observe --help` was a wrong guess (no such verb); it appended one line to `.fgos/logs/invocation-faults.jsonl` in mdview (git-ignored, harmless).

Not run: `fgos doctor --fix`, `fgos setup`, `fgctl upgrade`, any submit/pick/move/approve, anything that clears quarantine or closes sessions. Nothing was committed in mdview. `.fgos/config.json` was not modified by me (its mtime 14:18 predates this run; the backup is of that state).

## 4. mdview git status

Before and after are identical: seven untracked paths (the five in the brief plus `docs/doc-registry.md` and `docs/enduser-docs-index.json`, which already existed before this run, so the brief's list was incomplete). No tracked file changed. Changed outside git tracking only: `.fgos/observe/friction/`, `.fgos/runtime/tool-status.local.json`, `.fgos/cache/`, `.fgos/logs/invocation-faults.jsonl` (all git-ignored).

## 5. Owner actions still needed

- Provider account for z-ai (check 9): add `runner.providers.z-ai.accounts` with credential files to the global config, or point `pi-herdr-openrouter` at the account that exists.
- Model policies (check 2): add missing tiers for xai (nano) and openai (standard, flagship, frontier), or confirm those providers are intentionally partial.
- Quarantine (check 6): after confirming the mucdong quota issue is resolved, `fgos dispatch reconcile provider-capacity clear-quarantine` (until-time is already past).
- Coordination sessions (check 12): review the 5 stale active sessions and close or cancel them.
- doc registry (check 7): decide whether to run a knowledge/doc-registry migration for mdview's 17 outcome captures, or accept the failure.
- gitnexus (check 4): install it if mdview should have impact analysis, otherwise leave degraded.
- Shell integration (check 1) is machine-level; the failing part is the stripped-helper probe, so rerun doctor from a plain login shell before concluding anything.
- Executor warnings (check 8): migrate legacy flags when the ProviderAdapter migration is scheduled; informational.

## 6. forgentX-side bugs found

B1. `task-specs-resolve` and `domain-workflow-operations-coverage` resolve task-spec files against the project cwd (`resolveTaskSpecPath(domain, spec, cwd)`, `src/setup/registrations.mjs` around lines 766-800), but a release-tree install runs the domain registry from the payload. Evidence: the active release ships `libexec/legacy-node/domains/coding/task-specs/` and `core/task-specs/` (all 7 core specs and the coding specs exist there), while mdview has no `domains/` or `core/`, so 22 plus 15 "not found" findings are false positives for every target project. Sibling check `domain-registry-compiled` already skips with "no domains/ directory here"; `command-routes-drift` skips as "release tree install". These two should resolve against the release root (or skip) the same way. Fix target: forgentX.

B2. `shell-integration-sourced` fails inside an agent harness because it strips `_fgos_tier2_bin` to simulate a snapshotted shell function and the function then breaks. The message itself admits a harness snapshot can drop that helper; running it inside agent sessions yields a failure that is not a property of the machine. Needs either a harness-aware skip or a helper that survives the strip. Evidence: doc message, reproduced twice.

B3. `observe-friction-migrated` reports failure and names no fix, and the only fix is `friction migrate`, reachable only through the Rust host binary (`fgos.mjs friction` says Rust host only). The check message should name the exact command; and since the check is a doctor check, a registered doctor fix calling the host would let `doctor --fix` repair it. Evidence: `src/setup/registrations.mjs` lines 5657 and 5691 messages; `packages/observe/rust/src/friction_cli.rs` `"migrate"` arm.

B4. Doctor's `tool-registry-configured` counts a never-checked tool and a present tool the same way after `tool check` leaves any tool missing, so a project can never reach full without installing every declared tool, including machine-optional ones like gitnexus. Minor; consider an optional flag per declared tool.
