# Debug: confined headless claude cannot write its outbox; gemini pane idle

Date 2026-11-12 (Asia/Saigon). Dev host main ~b2fc5cf80. Evidence is under `.fgos/assignments/`; no credential content was read.

## Verdict (one line each)
1. Claude headless `no-report`: claude's own permission gate refuses the Write to the outbox. **Pre-existing, not P27/P28.** Every `-p` claude seat has failed. **Blocks release** if headless claude must serve read-only/judge capabilities.
2. Gemini pane idle 14 min: provider quota 429 on account `tetcu72`. **Not env, not P27/P28.** Does not block release as a code defect; two small follow-ups below.

## Symptom 1: unit-run-1794465798818-6067daf5 (claude, sonnet, claude-cli-bwrap)
Evidence
- `runs/01/stdout.log`: seat says the permission prompt for `.../worker-output/outbox/result-1.json` and `report-1.md` "was not granted"; Bash fallback blocked by claude's command-safety check. `exit.json` exit 0, `stderr.log` empty. So no EACCES and no read-only bind: it is claude's permission layer, not bwrap. Result: `reportDeclaration.complete=false`, `no-report`.
- `envelope.json` launch args flags: only `-p`, `--model`. No `--permission-mode`, no `--add-dir`.
- Same failure in all 5 headless `-p` claude units: 1794436497629-73936ae0 (2026-11-11 22:34, before P27 at 2026-11-12 10:37 and P28), 1794454214436-c4936aa7, 1794455219007-2f222c76, 1794455747211-15ee20c4, 1794459234713-2e77e6e6 (stdout: both writes "refused because write permission was not granted"). Zero headless claude passes in history.
- The claude "passes" (pane `--add-dir` runs) are session probes; the stdout shows a `printf fgos-ok-` shell check, not an outbox write. They do not prove a claude seat can write its outbox.

Where write permission came from before: nowhere. `claude-cli-bwrap` has never carried a permission flag (`core/config-standard/runner.yaml:33-37`, args `["-p","{prompt}","--model","{model}"]`; P27 commit 617a53cc2 only added `credentialStore`/`env`, args unchanged). Only the unconfined `claude-cli` carries `--permission-mode acceptEdits` (`runner.yaml:32`). The operator's `~/.claude/settings.json` has no `permissions`/`defaultMode` (keys: model, hooks, enabledPlugins, extraKnownMarketplaces, skipDangerousModePermissionPrompt, theme, crossSessionInbound), so the private config dir lost nothing relevant. Missing in the private config dir: nothing that explains this. P28: seat env names (`FGOS_*`, HOME, PATH, ...) are irrelevant to the denial.

Why the outbox needs two grants (reproduced with direct `claude -p --model haiku`, cwd outside the target dir, scratchpad dirs):
- no flags: refused
- `--permission-mode acceptEdits` only: refused (path outside cwd)
- `--add-dir <dir>` only: refused
- `--permission-mode acceptEdits --add-dir <dir>`: file written, "DONE"

The outbox is under the run dir (`.fgos/assignments/...`), outside the seat's cwd worktree. `withRunDirReadAccess` (`src/runner/dispatch/cli.mjs:93-96`) adds `--add-dir` only when `adapter === 'herdr-spawn'` and `interactiveMode.kind === 'claude'`, so cli-spawn claude never gets it.

Smallest correct fix (owning layer: dispatch/config)
- `core/config-standard/runner.yaml:37` claude-cli-bwrap args: add `"--permission-mode", acceptEdits` (same as `claude-cli`). The bwrap filesystem posture still bounds writes to the outbox bind.
- `src/runner/dispatch/cli.mjs:93` `withRunDirReadAccess`: also grant the run dir for `adapter === 'cli-spawn'` when the command is claude (one door, same function; the caller at `assignment-runner.mjs:412` is the pane path, so the cli-spawn caller must pass `runDir` too). Grant only the outbox dir if possible, not the whole run dir.
- Proof: one test that a claude cli-spawn seat's launch args carry `--permission-mode` and `--add-dir <outbox>`; then one real `fgos run ... --provider claude` writing result-1.json.
Not recommended: `--dangerously-skip-permissions` (drops Bash gating too).

## Symptom 2: unit-run-1794464894525-e702b487 (omp pane, gemini-3.8-flash-high, account tetcu72)
Evidence
- Pane capture `runs/01/stdout.log`: the brief printed, then `Error: Cloud Code Assist API error (429) ... RESOURCE_EXHAUSTED`, then `Provider requested 1800000ms wait, exceeds retry.maxDelayMs (300000ms)`. omp gave up and returned to its prompt: idle, no outbox (`outbox/` empty).
- `provider-capacity-selection.json`: selected `tetcu72`, reasonCodes `unknown-or-low-confidence` (no capacity knowledge before launch).
- Launch args `--model ... --tools ... --auto-approve`; env names FGOS_DISPATCH_DEPTH, FGOS_PARENT_WRITER_ID, FGOS_SESSION_ID, HOME, LANG, LOGNAME, PATH, SHELL, USER. The seat started, loaded and read its brief, so no env name is missing (P28 not implicated). Ended by SIGTERM cancel from the controller at 13:42 (14 min), not by the seat.
- Prior evidence: 1794436407348 (11-11) `provider-limit` on gemini too.

Cause: provider quota exhausted on account tetcu72 (30 min reset). Introduced by: neither landing; pre-existing capacity condition.
Fix: rerun on another gemini account or wait. Not a release blocker as a code defect.
Follow-ups (owner choice, not release gating):
- A pane seat whose pane shows a terminal provider error stays "running" until timeout/cancel. Detecting the 429 line in the pane capture and settling `provider-limit` (as headless does) would turn 14 idle minutes into an immediate rotate to the next account (`src/runner/execution/account-rotation.mjs`).
- Capacity selection picked an account with unknown capacity; a failed gemini account probe before launch would avoid it.

## Open questions
- Does a claude PANE seat write its outbox? No evidence either way (pane runs seen were probes). It likely needs the same permission grant (REPL has no human to answer the prompt). Verify with one real pane run after the fix.
- I did not run `npm run fgos:dev -- run` again: unit 6067daf5 is the real reproduction, and the four direct `claude -p` probes isolate the flags.
