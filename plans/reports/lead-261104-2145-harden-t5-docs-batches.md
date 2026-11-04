# HARDEN T5 docs for the credential, batch A/B/C fixes

Branch `harden/t5-docs-batches` (worktree `forgent-worktrees/harden-t5-docs`, one docs-only commit on origin/main a1beb1569). Evidence class: source read at each commit; the tests named below pass.

## Credential write-back (0f6843fc6, a56d56541)
- docs/platform/agent-confinement/spec.md:749 (13.2) and history/rollout-and-settled-facts.md (same bullet): target lives in the attempt's finalization descriptor, never in the home or its marker; the only write-back is finalize-home (`finalizeAttemptHome`); a dispatch home outside the assignment door is removed without write-back; marker and login files read through the agent-file door; held homes never settled automatically (refresh-ahead and `doctor --fix` do not touch them), recovered by hand; doctor names how, no account. Made true by a56d56541 (descriptor, door) and 0f6843fc6 (settle removed).
- docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:170 (RUL75 item 4) same facts; :175 (RUL80) "write-back marker" becomes target, the `--fix` settle of scan-only roots is gone.
- docs/platform/agent-confinement/decisions/confinement-authority-decisions.md:43 dated row.

## Batch B (8dabc57d1 door deleted, 6f2ccb617 dead modules, 91b50c2f9)
- agent-confinement/spec.md:32,51,217,251 (+ sequence diagram rewritten: Authority prepares, the run supervisor runs the agent), the "Authority gọi adapter" statements, F-a row, 1.1, 5.1/5.2 rules 3-4, 8.5, section 14 pointer; history/rollout-and-settled-facts.md S1 row and one-door call graph; contracts/confinement-authority-v1.md step 7; decisions row at :42 (also states the lost completed-phase attestation).
- docs/reading-map.md:152, docs/platform/architecture-map.md:456 (CTR011), docs/reference/dispatch-module-boundaries.md (confinement row, transport row, `prepare.mjs` row removed), docs/how-to/configure-and-operate-agent-confinement.md:10, runner decisions h-36d872fbb0e5.md heading note.
- agent-coordination/architecture/executor-health-and-fallback.md:32 (`recovery.mjs assess` no longer "live subset").
- holder-lock/spec.md:383 dated entry: `withLockRetry` and lock-wait module deleted (6c5c6d979); `--wait` never reached the claim door.
- secrets/spec.md:24,67: `resolveEnvPatch` went with the provider adapter classes (847913570); one expander (`resolveExecutorEnv`) remains. seat-binding/spec.md:423 stale line coordinates; runner/contracts/h-b3eb60fb4d2b.md:69 "shadow-mode module" parenthetical; git/spec.md:675 `cliSpawnAdapter` spawn site noted as deleted.

## Batch C (847913570 shadow binder, a6251673a)
- how-to/install-fgos-in-a-project-and-use-doctor.md: `shadow-binder-divergence` row removed; packaging-distribution/spec.md:551 same check removed from the list.
- docs/backlog.md: `tsk-p7-shadow-binders` moved to the Done / Declined list as `- [id] ... — done` (header of that section); :56 cross-reference reworded. Both binders are gone: the placement one with the single tier-model resolver (0f25b973a), the argv one in 847913570.
- agent-confinement/spec.md:738 area (13.1 item 3) and history: `.mcp.json` / `.codex/hooks.json` read bounded, no link followed; symlinked `.codex/hooks.json` refused (c75da9a47).

## Checked, no change
- agent-confinement §9.3 already names abstract-namespace sockets and localhost TCP as reachable (a6251673a changes no threat list).
- Batch A lines for result classification, provider-capacity assignment age and generation-unreadable: no doc states the old behaviour (owned by fixtures/tests), so nothing stale; not added. "Settle requires a declared adapter" has no doc mention.
- Left as dated history: runner decisions 1731, h-6979 RUL66/RUL90 narratives, docs/platform/agent-coordination/verification/**, distribution-baseline.md.

## Checks
doc-health + registrations + architecture: 103 pass, 0 fail. `convention check` on the 19 changed files: no violations.
