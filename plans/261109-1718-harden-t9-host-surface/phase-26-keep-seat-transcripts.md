---
phase: 26
title: "Keep seat transcripts: finalize-home copies the attempt home's sessions/ into the run directory before it removes the home"
status: pending
depends_on: ["owner decision 84", "COOK's unit-run-result text (branch cook/unit-run-result, §4 `activity`, §9)"]
parallel: "starts now, beside P12-P15 and the layer chain; file-disjoint from every phase except P22 (confinement/authority.mjs, cleanup.mjs): this phase lands first and P22 rebases on it"
effort: ~0.75d
net_size: "Node about +40; YAML about +10 (one session-dir key per executor plus its schema); Rust 0; tests about +30 (estimate)"
---

# Phase 26 - Keep seat transcripts (owner decision 84) - Execution (T4/T5)

**Authority moved:** none moved; Execution (confinement finalize, run by the run-supervisor's `finalize-home` step) becomes the one keeper of a seat's transcript, and `activity.transcriptPath` is its one pointer.

## Context

Owner decision 84: every seat's transcript must be kept, so what a seat did can be checked after a run. Today `finalizeAttemptHome` (`src/runner/dispatch/confinement/authority.mjs:939`, called by `src/run-supervisor/steps/finalize-home.mjs` and `src/runner/dispatch/assignment-runner.mjs:513`) removes the attempt's private home through `removeAttemptHome` (`src/runner/dispatch/confinement/cleanup.mjs:258`) without copying anything. A pane seat leaves only about 4 KB of launcher text and the last screen; only a headless seat has its transcript, in `stdout.log`. Where each CLI writes its session inside the home is inferred, not observed (COOK's report `plans/reports/researcher-261109-1830-pane-seat-transcripts.md`). The contract text is COOK's (`docs/platform/runner/contracts/unit-run-result.md` on branch `cook/unit-run-result`, §4 `activity`, §9 last paragraph).

## Requirements

1. Before `removeAttemptHome`, finalize copies the attempt home's `sessions/` directory (the executor's declared session dir) into the run directory's `protected/session/`, files mode 0600, directories 0700. It copies only that directory: never login or credential copies; a symbolic link is refused (the symlink-refusal leaf, P15, if landed; else the existing `lstatPlain` rule) so a copy cannot pull a file from outside the home.
2. `activity.transcriptPath` in the RunResult (v3 optional field, decision 83 i) points to that copy; it is `null` only when the CLI wrote no session.
3. Each executor declares its session directory in `core/config-standard/runner.yaml` next to `credentialStore`, with the key in `core/config-schema/runner.schema.yaml` (AGENTS.md install gate). An executor with no declared dir keeps nothing and says so in `transcriptPath: null` plus a structured warning.
4. The copy follows the run directory's retention (it is removed with the run; decision 73 e and P23 own retention). A failed copy never blocks the home removal or the credential hand-back: it is recorded as a warning and the home is removed as today.
5. Size and sensitivity: pi and omp sessions weigh a few MB each and may hold sensitive text (prompts, tool output, file contents). Mode 0600, kept inside `.fgos/assignments/<unitRunId>/` only, never copied to a report, mailbox or event; the run-supervisor spec states both facts.

## Files

**Modify:** `src/runner/dispatch/confinement/authority.mjs` (`finalizeAttemptHome`) and/or `cleanup.mjs` (one copy helper beside `removeAttemptHome`; step 2 picks one home), the RunResult writer of `activity` (`rg -n "activity" src/runner/dispatch/run-result.mjs`), `core/config-standard/runner.yaml`, `core/config-schema/runner.schema.yaml`, `docs/platform/run-supervisor/spec.md` (finalize-home section; DOC told), the owning tests of `finalizeAttemptHome` (`test/runner/dispatch-confinement-reaper-fence.test.mjs`, `test/run-supervisor/sweep.test.mjs`, `test/runner/provider-credential-renewal.test.mjs`, `test/runner/cli-spawn-reconciliation.test.mjs`: the one that owns finalize gets the cases, the others stay green), `CHANGELOG.md` (one line: a seat's session transcript is kept in the run directory).

**Delete:** nothing.

**Tests to retire:** none.

## Steps

1. **Observe first.** Run one live pane seat each for pi, omp and claude (read-only `fgos run`, private home kept by stopping before finalize, or inspected while the seat runs) and record where each CLI writes its session inside the home, the file count and the size. COOK's report only infers it; a CLI whose path differs from the inference gets its observed path in `runner.yaml`. Record the table in the phase report.
2. Red: finalize of a staged home with `sessions/` and a credential copy keeps the session under `protected/session/` at 0600, never the credential, and sets `transcriptPath`; a home with no session gives `null`; a symlink inside `sessions/` is refused; a failed copy still removes the home and returns the credential.
3. Copy helper, `transcriptPath`, config keys, spec text.
4. Smoke: a pane seat run on a built host; `transcriptPath` opens and holds the session.

## Validation (focused)

FR the four `finalizeAttemptHome` test files and the run-result tests; `fgos config check` on a built host. Land gate. COOK reviews against §4/§9; lead:ES not involved; MAIL not involved.

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| A credential or login copy leaks into the kept copy | L x H | only the declared session dir is copied; red case with a credential file beside it; symlinks refused |
| Disk growth from MB-sized sessions on long-lived run dirs | M x M | follows run retention (decision 73 e); size reported per CLI in step 1 |
| A copy failure turns into a stuck attempt | L x H | copy failure is a warning; removal and credential hand-back proceed |

Rollback: revert the merge commit; new runs keep no transcript again, copies already kept stay until their run is pruned.
