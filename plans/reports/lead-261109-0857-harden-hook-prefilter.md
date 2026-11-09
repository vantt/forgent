# HARDEN lead: delete guard prefilter for every CLI

Landed f43ef374d..5b8439c74 on main (OPC MERGE on e12fd9d48, answers: /bin/sh wrapper ok, quiet exit 0 on missing shim ok).

## What changed
- `src/setup/agent-hooks.mjs`: one `deleteGuardPrefilter` (substrings xargs, clean, -delete, eval, bash, zsh, dash, ksh; word-start keywords rm, sh). Renders: Claude `case` over the payload; Codex and agy `/bin/sh -c '<script>' sh '<shim>'` (agy prints `{"decision":"allow"}` for a skipped call and a missing shim); omp and pi regex inside the generated extension before `spawnSync`. All CLIs can carry it; none left unchanged.
- Rows carry `ownedPattern`: earlier Claude list, plain Codex/agy form, and wrapped commands of another shim path are replaced in place, never duplicated.
- The tracked `.claude/settings.json` was re-rendered by `installClaudeHook` (one line), not edited by hand.
- Superset fix: the earlier Claude list skipped `eval "$X"`, `bash -c "$X"`, `echo x | sh`, `'rm' -rf` which the guard refuses. `rm` and `sh` match only at a word start (they sit inside `permission_mode` and `Bash`). Known miss: quote-split names `r''m`, `r\m`.
- Pin: `judge` in test/git/main-checkout-delete-guard.test.mjs asserts every refusal matches the prefilter; new refusal cases added there. test/setup/agent-hooks.test.mjs: per-CLI shell behaviour (skip, start, exit 2 passthrough, missing shim, agy allow), omp/pi source, migration of earlier forms.
- Docs: packaging-distribution spec (section on guard hooks + decision-history row), CHANGELOG, census regenerated.

## Cost per non-matching `ls` call (30 runs, p50, machine load avg 15-30 so absolute values inflated; shim itself 570-1020 ms vs 170 nominal)
| CLI path | before | after |
|---|---|---|
| codex (`zsh -c`) | 914 ms | 17 ms |
| agy (`sh -c`) | 900 ms | 9.7 ms |
| omp/pi (spawnSync shim -> regex) | 1019 ms | 0.00002 ms |
| claude (`sh -c`, already filtered) | 20 ms | 10.7 ms |

## Gate
Focused 137 green (agent-hooks, guard, guard hook, architecture, doc-health, citation drift) after rebase; full `npm test` 8671 tests, 1 fail = known V7n addendum, no ERROR lines; one-door scan 0 undeclared, census regenerated. No Rust touched.

## Pick up the change on each machine
After a release that contains it: `fgos doctor --fix` (re-renders .claude/settings.json, .codex/hooks.json, .agents/hooks.json, omp/pi extensions). `fgos doctor` reports the old forms as non-canonical until then. Windows: Codex/agy wrapper assumes `/bin/sh` like the existing shim quoting does.
