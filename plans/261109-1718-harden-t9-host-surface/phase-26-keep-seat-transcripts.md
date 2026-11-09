---
phase: 26
title: "Keep seat transcripts: finalize-home copies the attempt home's sessions/ into the run directory before it removes the home"
status: pending
depends_on: ["owner decision 84", "COOK's unit-run-result text (branch cook/unit-run-result, §4 `activity`, §9)"]
parallel: "starts now, beside P12-P15 and the layer chain; shares files only with P22 (confinement/authority.mjs, cleanup.mjs), P06 and P21 (dispatch/cli.mjs), P10 (command-routes.json, registrations.mjs pointer row): this phase lands first and they rebase on it"
effort: ~1.25d
net_size: "Node about +40 (keep) + about +70 (probe verb, registry entry, doctor pointer row); YAML about +10; Rust 0 unless the host route table needs a line; tests about +50 (estimate)"
---

# Phase 26 - Keep seat transcripts (owner decision 84) - Execution (T4/T5)

**Authority moved:** none moved; Execution (confinement finalize, run by the run-supervisor's `finalize-home` step) becomes the one keeper of a seat's transcript, and `activity.transcriptPath` is its one pointer. "Where does this executor's CLI write its session today" is answered by Dispatch's probe verb (a read about one executor, beside `probe-account`), not by a doctor row or a one-time note.

**New verb (owner decision 84 addendum; lead decision recorded there):** `fgos dispatch probe-session <executorId>`. It is the one new verb of T9; the sub-plan's "no new verb" non-goal yields to this owner request.

## Context

Owner decision 84: every seat's transcript must be kept, so what a seat did can be checked after a run. Today `finalizeAttemptHome` (`src/runner/dispatch/confinement/authority.mjs:939`, called by `src/run-supervisor/steps/finalize-home.mjs` and `src/runner/dispatch/assignment-runner.mjs:513`) removes the attempt's private home through `removeAttemptHome` (`src/runner/dispatch/confinement/cleanup.mjs:258`) without copying anything. A pane seat leaves only about 4 KB of launcher text and the last screen; only a headless seat has its transcript, in `stdout.log`. Where each CLI writes its session inside the home is inferred, not observed (COOK's report `plans/reports/researcher-261109-1830-pane-seat-transcripts.md`). The contract text is COOK's (`docs/platform/runner/contracts/unit-run-result.md` on branch `cook/unit-run-result`, §4 `activity`, §9 last paragraph).

## Requirements

1. Before `removeAttemptHome`, finalize copies the attempt home's `sessions/` directory (the executor's declared session dir) into the run directory's `protected/session/`, files mode 0600, directories 0700. It copies only that directory: never login or credential copies; a symbolic link is refused (the symlink-refusal leaf, P15, if landed; else the existing `lstatPlain` rule) so a copy cannot pull a file from outside the home.
2. `activity.transcriptPath` in the RunResult (v3 optional field, decision 83 i) points to that copy; it is `null` only when the CLI wrote no session.
3. Each executor declares its session directory in `core/config-standard/runner.yaml` next to `credentialStore`, with the key in `core/config-schema/runner.schema.yaml` (AGENTS.md install gate). An executor with no declared dir keeps nothing and says so in `transcriptPath: null` plus a structured warning.
4. The copy follows the run directory's retention (it is removed with the run; decision 73 e and P23 own retention). A failed copy never blocks the home removal or the credential hand-back: it is recorded as a warning and the home is removed as today.
5. Size and sensitivity: pi and omp sessions weigh a few MB each and may hold sensitive text (prompts, tool output, file contents). Mode 0600, kept inside `.fgos/assignments/<unitRunId>/` only, never copied to a report, mailbox or event; the run-supervisor spec states both facts.

6. **Probe verb `fgos dispatch probe-session <executorId>`**, in the `fgos dispatch` family beside `probe-account` (`src/runner/dispatch/cli.mjs` `case 'probe-account'`, registry entry in `src/cli/command-registry.mjs` `dispatch` subcommands). It runs one small read-only seat of that executor through the normal run door (no `--writes`, a fixed short prompt), then reports `{ executorId, declaredSessionDir, observedSessionPaths[], kept, transcriptPath, sizeBytes, warnings[] }`: where the CLI actually wrote its session in the attempt home (listed before finalize removes the home), whether finalize kept it, and where `transcriptPath` points. It changes no config and repairs nothing; a mismatch between the declared and the observed dir is reported with the `runner.yaml` line to change. Registry entry marked `externalEffect: true` like `probe-account` (it spawns a provider CLI). `--json` output; exit 0 when kept, a named non-zero category when not.
7. **Doctor:** at most one read-only pointer row (rules of `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` §3): it names `fgos dispatch probe-session <executorId>` for executors whose session dir is undeclared; it warns, never repairs, and never runs the probe itself (the probe spawns a seat; doctor must not).

## Files

**Modify:** `src/runner/dispatch/cli.mjs` (the `probe-session` case beside `probe-account`; the probe body in a module beside `provider-account-probe.mjs` if it outgrows a case), `src/cli/command-registry.mjs` (sub-verb entry), `packages/host-runtime/contracts/command-routes.json` (regenerated by `scripts/export-command-selectors.mjs`), `src/setup/registrations.mjs` (one pointer row; board chain, before P21), `src/runner/dispatch/confinement/authority.mjs` (`finalizeAttemptHome`) and/or `cleanup.mjs` (one copy helper beside `removeAttemptHome`; step 2 picks one home), the RunResult writer of `activity` (`rg -n "activity" src/runner/dispatch/run-result.mjs`), `core/config-standard/runner.yaml`, `core/config-schema/runner.schema.yaml`, `docs/platform/run-supervisor/spec.md` (finalize-home section; DOC told), the owning tests of `finalizeAttemptHome` (`test/runner/dispatch-confinement-reaper-fence.test.mjs`, `test/run-supervisor/sweep.test.mjs`, `test/runner/provider-credential-renewal.test.mjs`, `test/runner/cli-spawn-reconciliation.test.mjs`: the one that owns finalize gets the cases, the others stay green), `CHANGELOG.md` (one line: a seat's session transcript is kept in the run directory).

**Delete:** nothing.

**Tests to retire:** none. **Tests added:** the probe's owning tests in `test/runner/dispatch/` beside the `probe-account` tests (a fixture executor registered in the test's own config that writes a session to a known dir; declared vs observed mismatch; no session); one wiring proof for the verb in `test/cli/` (usage and `--json` shape); the doctor pointer row's one case.

## Steps

1. **Probe verb first.** Build `fgos dispatch probe-session <executorId>` (Requirement 6) with its owning tests, then run it for pi, omp and claude on a built host and record where each CLI writes its session, the file count and the size. COOK's report (`plans/reports/researcher-261109-1830-pane-seat-transcripts.md`) only infers the paths; a CLI whose observed path differs gets it in `runner.yaml`. The table goes in the phase report; the verb stays, so the check is repeatable when a CLI changes.
2. Red: finalize of a staged home with `sessions/` and a credential copy keeps the session under `protected/session/` at 0600, never the credential, and sets `transcriptPath`; a home with no session gives `null`; a symlink inside `sessions/` is refused; a failed copy still removes the home and returns the credential.
3. Copy helper, `transcriptPath`, config keys, spec text; doctor pointer row; rerun the probe for the three CLIs and confirm `kept: true`.
4. Smoke: a pane seat run on a built host; `transcriptPath` opens and holds the session.

## Validation (focused)

FR the probe tests, the verb's wiring case, the doctor pointer case, the four `finalizeAttemptHome` test files and the run-result tests; `fgos dispatch probe-session` for pi, omp and claude on a built host; `fgos config check` on a built host. Land gate. COOK reviews against §4/§9; lead:ES not involved; MAIL not involved.

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| A credential or login copy leaks into the kept copy | L x H | only the declared session dir is copied; red case with a credential file beside it; symlinks refused |
| Disk growth from MB-sized sessions on long-lived run dirs | M x M | follows run retention (decision 73 e); size reported per CLI in step 1 |
| A copy failure turns into a stuck attempt | L x H | copy failure is a warning; removal and credential hand-back proceed |

Rollback: revert the merge commit; new runs keep no transcript again, copies already kept stay until their run is pruned.
