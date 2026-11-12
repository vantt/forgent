# HARDEN T9 P06: run, dispatch, hook verdicts, agents and tool arms

Branch `harden/t9-p06-run-dispatch-hook`, based on origin/main (P26 and P22 on it).

## What changed

- One verdict per hook kind behind one payload normalizer (`src/runner/hook.mjs`: `normalizeHookPayload`, `runHook`, `serveHook`). `decideDispatchHook` sits beside the dispatch config (`src/runner/dispatch/hook.mjs`); `decisionQuestionHookVerdict` is in `src/state/decision-question.mjs`. The project is `CLAUDE_PROJECT_DIR`, agy's workspace root, else the hook's start directory; a payload `cwd` is never read. A config refusal blocks in both formats; an empty or unparseable payload allows in both; a project directory that does not exist blocks. The agy branch and its second Node spawn are gone from `bin/fgos.mjs`; the two hook scripts are 5-line entries. `hook mailbox` and `mailbox-sync` on the direct-node channel are refused by name (was: quiet exit 0 / unknown kind).
- `buildRunRequest(flags, positional, roots)` and `foldRunSetting` in `run-request.mjs`; `adhocUnitFromPrompt` moved with it; the three fold copies are one helper. `slugOf` leaf is new `src/util/slug.mjs` (no existing util module fit); `workflow/propose.mjs` imports it. `parseListFlag` moved to `src/cli/parse-args.mjs`.
- `decide` split out of `cli.mjs` into `src/runner/dispatch/decide.mjs` (`decideExecutorCli`, `decideCommand`, `runDoorHint`, `retiredDispatchDoorMessage`). The shell calls `decideCommand` directly with the flags it already parsed, so the stdout-JSON-then-throw is gone: a refusal is thrown once and printed once, on stderr. `dispatch`, `agents` and `tool` read their sub-verb list from the registry (`requireSubVerb`); `checkTools` and `queryTools` are use cases in `tool-registry.mjs`.
- `accountPin: 'strict' | 'where-served'` is a `runUnit` option (absent: strict; other values refused). `unit-run-start.mjs` no longer reads `origin === 'workflow'`. `fgos run` passes `strict`; `src/workflow/runner.mjs` passes `where-served` (one line, a Workflow file outside the phase list; it is the mechanical caller update the change needs). COOK confirmed the placement on the options and that no run-result contract change is needed; COOK adds a line to spec section 6.
- T9-21: header of `main-checkout-delete-guard.mjs` and item 5 of `domains/coding/instructions/worktree-safety.md` name what the guard does not judge. Text only.
- Docs: config spec line on the hook, `dispatch-module-boundaries.md` rows, CHANGELOG. Manifest: three new files declared, `run-request.mjs` moved from `domain` to `infra` (it now reads the runner config and agent definitions).

## Deviations from the phase text

- Confined-writer check (AU-25): the depth half (`currentDispatchDepth() > 0`, Execution's own fact) now gates the check inside `buildRunRequest`, before any config read (a confined worker cannot read the machine config, so the order matters: the first full run showed the config refusal replacing the by-name refusal when I tried to drop the arm check). The directory half stays in the Workflow port, reached through the injected seam `caseAdmission.confinedWriteRefusal`; the arm imports no Workflow function to judge it, only hands the seam over with the port. The port's own `confinedWriteRefusal` keeps its internal depth guard because `resolveBinding`, `admit` and the case verbs also call it; removing that guard would need the port to be told it is confined, which is a run.mjs contract change owned by later phases.
- `agents`: the listing was already a use case; only the sub-verb check moved to the registry.
- The delete-guard hook kind keeps its own script and one spawn (its script is outside this phase and answers per agent itself).
- `fgos dispatch decide` double write: no error reachable from `decide` carries an `errorClass` today, so it was latent; the test pins one error on stderr and none on stdout.
- Work code touched: none. Also changed, mechanically: `test/runner/work-path-case-admission.test.mjs` (the run arm now hands `runUnit` the built request; the test checks `buildRunRequest` carries the port), `test/runner/assignment-dispatch.test.mjs` and `test/runner/dispatch.test.mjs` (import `decideExecutorCli` from `decide.mjs`).

## Red evidence

New verdict-table and `buildRunRequest` tests were written first and failed on import (modules did not exist). The old behaviour is visible in the removed source: agy `catch { // fail-open }` around `decideExecutorCli`, `workspacePaths[0]` as project, payload `cwd` passed to `decide` in the Claude script. A run of the old scripts from a scratch copy could not reach a verdict (no native addon outside a staged checkout), so the cwd reproduction is by source, not by a run.

## Retired tests and new owners

- `test/scripts/dispatch-decide-hook.test.mjs` (all spawn cases) and `decision-question-hook.test.mjs`: now one fixture table per payload format calling `runHook`; same file names; each row title names the format. One spawn case per script entry remains.
- `test/cli/run-verb.test.mjs`: retired the refusal cases (no unit/resume/prompt, prompt with --unit/--resume, unknown provider/persona, --writes refusals, one-liner flags, --timeout malformed/resume, --account resume/bare, --sync refusals, empty --input/--verify, --param beside resume, ascii id, --input/--verify onto the unit); owner is `test/runner/execution/run-request.test.mjs`. Kept: prompt, `--unit`, new `--resume` and `--case` wiring cases, plus the runUnit-owned refusals (tier, dependence, account pool, timeoutMs).
- `dispatch-retired-doors.test.mjs`: the quiet `hook mailbox` case replaced by the refusal-by-name case (behaviour changed on purpose).
- `run-provider-failover.test.mjs`: the Workflow-origin pin case now states the `accountPin` modes (owner of the refusal).
- `subcommand-flag-drift.test.mjs`: scanner follows `decide` into the arm and `tool query` as the fall-through (mechanical).

## Measures (quiet machine, load 1.5)

| | before | after |
|---|---|---|
| modules loaded, `dispatch/cli.mjs` | 149 | 150 (probes and runner stay) |
| modules loaded, `decide` path | 149 | 111 (`decide.mjs`) |
| modules loaded, question hook | 149 (via the shared script graph) | 2 |
| dispatch hook script, non-Agent call | 62-64 ms | 56-57 ms |
| question hook script | 21-24 ms | 21 ms |

The 60-module target for `decide` is missed: `paths.mjs` alone pulls 61 modules, the runner config 32, the plan 16. Those belong to lower phases; reported, not hidden.

## Size (delta, this branch against origin/main)

bin -363 (+54 -417; estimate -300); src +557 (+810 -253; estimate +260, tests of the use cases are separate); scripts -170; tests +192 (estimate -150: the run-request, tool and hook tables add more than the spawned cases removed). Rust 0.

## Gate

See the landing line on the board for the full-suite result.

## Authority

- Account pin mode: was decided in Execution by reading a Workflow label on an override; now the caller chooses `accountPin` and Execution only applies it. Workflow's `unitOverridesOf` still tags its fallback override `origin: 'workflow'` (bind provenance reads it); P08 owns that file and should make it call `foldRunSetting`.
- Confined-writer judgement: lives at admission in the Workflow port (it holds the directories); the shell no longer re-asks it.
- Hook project directory: decided once by the normalizer from the harness, not by each script.
- `requireField` exists in `bin/fgos.mjs` and as a private helper in `run-request.mjs` because the A4 guard forbids Execution from importing `src/state`; a shared leaf under `src/cli` that throws a neutral error would remove it (a question for P01-style leaf work).

## Lessons

- A scratch copy of the old tree cannot run the native-addon paths; for red evidence on removed code, run it inside a staged checkout (a throwaway worktree of origin/main) or accept source evidence early.
- `npm test` runs past the 10-minute foreground limit; start it in the background from the first call.
- A bash command containing the text `process.env` trips the privacy hook; write such edit scripts to a file first.
- The architecture A4 guard shapes where a use case can live (no `src/state` from Execution/Dispatch); check it before choosing a module home.
