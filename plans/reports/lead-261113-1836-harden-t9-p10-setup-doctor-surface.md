# HARDEN T9 P10 — setup, doctor and wire-agents surface

Branch `harden/t9-p10` (rebased on origin/main, pushed, not landed: main is frozen until rc.8). All requirements met; gates green.

## What changed
- **Preflight retired.** Arm, registry entry, route, `test/cli/fgos-preflight.test.mjs` removed; vectors regenerated; the verb answers "unknown verb" (exit 4, one case in `fgos-post-merge-2`). `npm run check:before-merge` chains the three checks. Explanation page marked retired.
- **Doctor speed.** `isShimRunnable` memoizes each distinct probe through the run's `once` door (five hook rows now share the dispatch and delete-guard probes); the three `claude` calls of `claude-plugin-marketplace` run together (async check). Row ids unchanged: 110 rows, identical id hash before and after.
- **Timer.** Names the project shim or the host of the activated release only (`resolveWorkspaceInstallationBin`), never checkout script, `node_modules/.bin` or PATH. `%`, newline and control characters in project root, bin or remote are refused (doctor shows a warning, `--fix` skips).
- **Version leaf.** `src/cli/version.mjs` moved to `src/setup/version-info.mjs` and no longer knows verbs (the native `version` verb owns them); the setup layer imports nothing from `src/cli`, the architecture exception list is empty.
- **AU-07.** `run-attempts-stuck` shows the adopt probe answer (`adoptScan` probe-only; envelope parsing left Node); `confinement-orphaned-resources-reaped` and its fix call `judgeConfinementOrphans` / `removeConfinementOrphans`; `identity-shared-directory` already read the crate's judgement.
- **AU-02.** One activation reader (`readActivationFile`); `hostBinFromActivation`, the doctor release resolver, the drift row and the pin row use it. Steps 3-5 of the resolver stay as the dev door's cases.
- **Use cases.** `setupUseCase` (`src/setup/setup-use-case.mjs`) and `wireAgentsUseCase`; arms hold flags, one call, print.

## Tests
Retired: `fgos-preflight.test.mjs` (behaviour removed; checks owned by the mirror test, the citation test and the script); three doctor orphan cases (loose root, empty shell, attempt home) and the intent half of the legacy stuck case, owned by `dispatch-confinement-reaper-fence.test.mjs` and the run-supervisor adopt tests. Added: in-process setup cases, probe-once, parallel claude calls, timer refusals and host-only naming, activation reader, host-cannot-answer row, unknown preflight, wire-agents plan.

## Gates
Full `npm test`: 8858 tests, 0 fail, no ERROR lines. architecture, doc-health, citation drift green; census scan 0 undeclared; fmt, clippy, msvc and aarch64-apple-darwin check on `fgos-distribution` (comment-only Rust change).

## Doctor speed (measured)
Same machine, load average 1.1 to 1.3, `runDoctor` in process against the main checkout, three runs each, interleaved (a spawned `npm run fgos:dev -- doctor --json` is 55 s of host start-up around it and hides the row cost, so the rows were timed directly). origin/main: 2123, 2026, 2052 ms, median **2052 ms**. This branch: 1450, 1483, 1371 ms, median **1450 ms** (-29%). Rows 110 in both.
Shim probes, on a scratch project with all five hook files and a shim: origin/main **14**, this branch **6** (each distinct probe once: dispatch, delete guard, and the mailbox probe per CLI). `claude` calls per run: 3 in both, in series on main, together on this branch. Counted by wrapping `child_process` spawn calls for the shim path and `claude`.

## Setup test move
Five spawned-CLI cases became in-process cases in `test/setup/setup-use-case.test.mjs`, each owned there: core.hooksPath wired absolute (was checks-setup-config), no `.git` (checks-setup-hookspath), custom hooksPath untouched (checks-setup-hookspath), rc line written once with no declined reason (checks-setup-idempotent, now also proves a second run adds nothing), every registered fix runs (fgos-setup). The three emptied files are deleted. Kept as CLI wiring proofs: envelope shape, `--pretty`, the non-checkout copy declining the rc write, and setup inside a linked worktree (it proves the arm's `--dir` resolution, not the use case). Test files: -3, spawned setup cases: -5 +0.

## Not done
MAIL (timer) and DOC (explanation page) are not yet told; HARDEN does it at landing.

## Authority
Nothing held in two layers found beyond the three AU-07 rows and AU-02, now moved.

## Lessons
- A phase whose predecessors already switched half its rows (identity row, doctor loop) needs a first-hour re-read of the plan against main; two requirements were already done.
- The census guard refuses commits in worktrees until `--write-census` is run after any setup-file edit; run it before every commit.
- Shell snippets containing the word "build" trip the scout-block hook; use the Edit tool for such strings.

Status: DONE_WITH_CONCERNS
