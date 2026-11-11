# HARDEN T9 P26 - Keep seat transcripts (owner decision 84)

Lane `harden/t9-p26-keep-seat-transcripts`, lead on fg-server2, 2026-11-12. Land commit range is on the board line.

## What landed

- **Keep.** `finalize-home` copies the executor's declared session folder of the attempt home into
  `<runDir>/protected/session/` (files 0600, dirs 0700) before `removeAttemptHome`. Only that folder is read; a
  symbolic link anywhere on the path or under it is refused (`refuseSymlink`); a file already there is never
  overwritten; a failed copy removes what it created, becomes a structured warning (`session-copy-failed`) and
  never keeps the home or the login back. Helpers `keepSessionTranscript` and `describeAttemptHome` sit beside
  `removeAttemptHome` in `confinement/cleanup.mjs`; `finalizeAttemptHome` returns `transcriptPath` (relative to the
  run directory, `null` when nothing was kept), `homeLayout` (names, counts and sizes of what the home held, never
  content) and `warnings`; the step records them in `steps/finalize-home.json`.
- **Declaration.** New optional key `credentialStore.sessionDir` (relative, no `..`): `core/config-schema/runner.schema.yaml`,
  `core/config-standard/runner.yaml` (`sessions` on the nine pi and omp stores), `credentialStoreProblem`
  (`provider-capacity.mjs`), and the finalization descriptor resource carries it from the launch request.
- **Probe verb.** `fgos dispatch probe-session <executorId> [--invocation <id>]` (`provider-session-probe.mjs`, case in
  `dispatch/cli.mjs`, registry entry `externalEffect: true`). It runs one read-only unit through `runUnit` (the one
  execution door, handed in by `bin/fgos.mjs` because Dispatch never imports Execution), pinned to the executor, the
  invocation and the weakest tier (`nano`, so the cheapest model of the family: haiku, flash-low, flash, grok-4.3), then reads the
  finalize-home record. Report: `{executorId, invocationId, model, outcome, category, kept, declaredSessionDir,
  observedSessionPaths[], transcriptPath, files, sizeBytes, fix, warnings[], runDir}`. Categories: `kept`,
  `run-failed`, `no-private-home`, `dir-undeclared`, `dir-mismatch` (with the `runner.yaml` line to change),
  `no-session-written`, `copy-failed`. Exit 0 only when `kept`; otherwise exit 1 and the category is in the JSON.
  A kept session wins over the seat's own outcome (a seat that hit a provider limit still wrote a session). It
  prints paths, counts and sizes only.
- **Doctor.** One read-only pointer row `session-keep-declared` (`src/setup/session-keep-declared.mjs`): warns, never
  fails, never runs the probe; it names the confined invocations with no `sessionDir` and the verb. On this machine:
  `claude/claude-cli-bwrap`, `claude/claude-herdr-bwrap`, `openai/codex-cli-bwrap`, `openai/codex-herdr`.
- **Docs.** Run-supervisor spec (layout row, finalize-home step row, decision-history line with size and sensitivity),
  RUL105 text of the runner spec and the confinement spec key list, doctor registry inventory and pointer table,
  CHANGELOG line.

## Observed session locations (real seats, dev host running this tree, 2026-11-12)

| CLI | Executor / invocation | Where it wrote (in the attempt home) | Files / size | Kept |
|---|---|---|---|---|
| pi | deepseek / pi-cli-bwrap (headless), flash model | `sessions/--home-vantt-projects-forgent--/<ts>_<id>.jsonl` | 1 / 138 559 B | yes |
| pi | deepseek / pi-herdr (pane), flash model | same | 1 / 137 449 B | yes |
| omp | xai / omp-herdr (pane), grok-4.3 | `sessions/-projects-forgent/<ts>_<id>.jsonl` (also `terminal-sessions/pts-N`, 202 B, a pane pointer; not kept) | 1 / 32 297 B | yes |
| omp | gemini / omp-cli-bwrap (headless), flash-low | `sessions/-projects-forgent/<ts>_<id>.jsonl` | 1 / 4 432 B (seat hit a 429 quota error; session still written and kept) | yes |
| omp | gemini / omp-herdr (pane), flash-low | same; a cancelled attempt (the account's quota was exhausted and the pane waited) also kept its session | n/a | yes |
| claude | claude / claude-cli-bwrap (headless), haiku | nothing: the home holds no entry and the sandbox mounts `~/.claude` read-only | 0 | no |
| claude | claude / claude-herdr-bwrap (pane), haiku | same | 0 | no |

Declared `sessions` matches pi and omp, so no `runner.yaml` path changed. A pane seat's session is the CLI's own
file, so one tiny pane seat holds a few KB to ~140 KB; long seats weigh several MB. Modes verified on a real kept copy: files 600, dirs 700.

## Finding for claude (needs an owner decision, not done here)

A confined claude seat persists no transcript anywhere: `claude-*-bwrap` has no `credentialStore`, so its private home is
unused (no `CLAUDE_CONFIG_DIR` points into it) and `~/.claude` is read-only under `--ro-bind / /`. Keeping a claude
transcript needs claude to get its own login store (`CLAUDE_CONFIG_DIR` plus a login copy and a lease), which is a
confinement and credential change, not a path fix. The probe reports it as `dir-undeclared` with an empty
`observedSessionPaths`, and the doctor row names it. Proposed as its own item; not started.

## Authority

None moved. Execution (confinement finalize) is the one keeper of the transcript; `activity.transcriptPath` is its one
pointer. `finalizeAttemptHome` and the step record already carry `transcriptPath`; the RunResult `activity` writer does
not exist on main yet (COOK's v3 field is only specified), so nothing writes `activity` here. COOK's writer should read
`steps/finalize-home.json` `detail.transcriptPath` (relative to the run directory) and may want a repo-relative form
like `runtime.stdoutLog`. The probe went through `runUnit` instead of `executeAssignment` so that bind names the account
and lease (the door refuses a launch that names none); this keeps `dispatch/cli.mjs` at one `executeAssignment` site.

## Verification

- `test/run-supervisor/attempt-steps.test.mjs` (owns finalize): keeps at 0600/0700 and never a login file; layout when the
  folder is missing; undeclared; symlink inside and as the folder itself refused with no partial copy, home removed and
  login still staged.
- `test/runner/dispatch/provider-session-probe.test.mjs` (10 cases, real home, descriptor and finalize step under a fake
  door): kept, mismatch with fix line, undeclared, nothing written, no private home, kept despite a failed seat, failed
  run, invocation choice, weakest tier, missing door.
- `test/cli/dispatch-operability.test.mjs` (one wiring case), `test/cli/subcommand-flag-drift.test.mjs` (the new case is
  checked against the registry), `test/setup/session-keep-declared.test.mjs` (doctor, two cases).
- Fixtures that followed the standard: policy baseline snapshot (`sessionDir`), config authoring record
  (`repo-differences.v1.json`: five `invocations` differences), architecture manifest, doctor check list, census.
- `cargo test -p fgos-config` and `cargo test -p fgos` green. `fgos config check` ok on the dev host; `fgos doctor --json`
  shows the new row as a warning. Full `npm test` (twice, 8712 tests): only the known V7n addendum red; no ERROR lines. The first run also caught the runUnit admission-port rule, fixed by injecting the port in bin.

Net size against the estimate (+110 Node src, +50 tests): src and bin +386, tests +341 (the probe needs the layout reader,
the verb body and a probe module of 151 lines; the estimate undercounted them).

## Lessons

- The phase text said "through the normal run door" but the account probe's door (`executeAssignment`) cannot name an
  account; the lease is bind's decision. Read `leaseAccountForAttempt` before choosing the door.
- A pane seat on an account with no quota sits at its prompt until timeout and blocks the probe; pick a provider with
  quota first, and give the probe a deadline of its own (not added: `--timeout-ms` was dropped when the door changed).
- Adding a key to the standard needs the config authoring record (`repo-differences.v1.json`), the policy baseline fixture
  and the census regenerated together; `cargo test -p fgos-config` caught the first, the Node focused set the others.
- A one-door import rule (`no provider module reaches into confinement`) caught a marker-name import in the probe; the
  layout reader already drops the marker, so the import was never needed.
