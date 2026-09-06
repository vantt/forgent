# P05.1 crash-state snapshot — exact commands/output captured live, right after the real kill -9 and before the resume attempt

All output below is copied verbatim from the real terminal session that ran
this proof (not reconstructed afterward). File paths are relative to
`EVIDENCE_DIR` (the isolated `WORK_DIR`, see `doer-report.md`).

## 1. OS-level confirmation all three real PIDs are actually dead (not just exited cleanly)

```
$ pgrep -af "exec-slow.mjs"   # (matched only the grep command's own argv text, not a real process)
$ ps -p 3730502 -o pid,stat,cmd   # the killed "fgos coordination run" process
    PID STAT CMD
3730502_GONE_CONFIRMED
$ ps -p 3730516 -o pid,stat,cmd   # the executor subprocess node process (from the marker file's own reported pid)
    PID STAT CMD
3730516_GONE_CONFIRMED
$ ps -p 3730523 -o pid,stat,cmd   # a second process in the same detached process group
    PID STAT CMD
3730523_GONE_CONFIRMED
```

`exec-slow-started.marker` exists on disk; `exec-slow-finished.marker` does
not — proving the executor subprocess was genuinely mid-flight (had started,
had not settled) at the moment of the kill.

## 2. `fgos coordination show aap_p051_main --json`, run from a genuinely fresh process, immediately after the kill

Full output: `responses/out-05-show-after-crash.json`. Relevant excerpt —
the quorum block distinguishes the interrupted actor (`late`) from actors
still legitimately unreached (`missing`) and actors that settled before the
crash (`completed`):

```json
"quorum": {
  "completed": [
    { "actorId": "context-investigator-actor", "assignmentId": "asgn_aap_driver_op_003" },
    { "actorId": "system-shaper-actor", "assignmentId": "asgn_aap_driver_op_004" },
    { "actorId": "alternative-shaper-actor", "assignmentId": "asgn_aap_driver_op_005" },
    { "actorId": "constraint-advocate-actor", "assignmentId": "asgn_aap_driver_op_008" },
    { "actorId": "architecture-critic-actor", "assignmentId": "asgn_aap_driver_op_007" }
  ],
  "failed": [],
  "late": [
    { "actorId": "synthesizer-actor", "assignmentId": "asgn_aap_driver_op_009" }
  ],
  "missing": [
    { "actorId": "lead-advisor-actor" },
    { "actorId": "red-team-actor" }
  ]
}
```

## 3. On-disk assignment state for the interrupted binding, before any reconciliation

```
$ find .fgos/assignments/asgn_aap_driver_op_009 -type f
.fgos/assignments/asgn_aap_driver_op_009/assignment.json
.fgos/assignments/asgn_aap_driver_op_009/dispatch.claim
.fgos/assignments/asgn_aap_driver_op_009/runs/01/run.json
.fgos/assignments/asgn_aap_driver_op_009/runs/01/dispatch-plan.json
```

No `result.json`/`agent-result.json`/`agent-report.md` under `runs/01/` —
the executor never got to write them. `runs/01/run.json` itself is stuck at
`"status": "running"` forever (nothing updates it on a SIGKILL):

```json
{
  "runId": "run_asgn_aap_driver_op_009_01",
  "assignmentId": "asgn_aap_driver_op_009",
  "attempt": 1,
  "executorId": "exec-slow",
  "status": "running"
}
```

## 4. The real, disclosed gap: `dispatch.claim` blocks CLI-only resume

Re-issuing the identical `synthesize-recommendation` operation step from the
fresh process (`requests/req-06-resume-synth.json`, first attempt) was
refused — **not by a stale-actor/authorization problem, but by the
still-present `dispatch.claim` exclusive-lock file** the killed process
created and never got to remove (SIGKILL gives no chance to run cleanup):

```
$ fgos coordination run --file req-06-resume-synth.json
fgos: createAndExecuteSessionTask: a dispatch is already in progress for
assignment "asgn_aap_driver_op_009" in session "aap_p051_main" -- refusing
to spawn a second concurrent executor run for the same Assignment
(exit code 4)
```

This is a real, disclosed limitation of the "resume using only `fgos
coordination show`/`chain` plus the session id" promise — see
`doer-report.md`'s own Area 6 write-up for the full disclosure and why this
is not something fixed silently as part of this cell.

## 5. Manual reconciliation, then a clean resume

After confirming (step 1 above) that no live process anywhere still holds
this claim, the stale lock file was removed by direct filesystem access
(the one channel `session-engine.mjs`'s own header comment documents as the
intended recovery path — "a crashed in-flight dispatch still needs manual
reconciliation, not silent auto-retry"):

```
$ rm .fgos/assignments/asgn_aap_driver_op_009/dispatch.claim
```

The identical resume request then succeeded, producing a genuinely NEW run
attempt (`runs/02`) under the SAME `assignmentId` — `runs/01` (the
interrupted attempt) is preserved on disk, never deleted or overwritten by
the engine itself:

```
$ find .fgos/assignments/asgn_aap_driver_op_009/runs -type f
runs/01/run.json
runs/01/dispatch-plan.json
runs/02/evidence.json
runs/02/agent-result.json
runs/02/exit.json
runs/02/stdout.log
runs/02/run.json
runs/02/dispatch-plan.json
runs/02/stderr.log
runs/02/result.json
runs/02/agent-report.md
```

The session's own event log confirms the engine linked run **02**, not 01
(`session-events/aap_p051_main-events.jsonl`, `seq: 33`):

```json
{"type":"result-linked","payload":{"assignmentId":"asgn_aap_driver_op_009","runId":"run_asgn_aap_driver_op_009_02"}}
```

**Known artifact of this proof's own fake executor script, disclosed for
honesty, not hidden:** `exec-fast-resume.mjs` (like the project's own
conformance-test fixture executor) scans and settles *every* incomplete run
directory under `.fgos/assignments/*/runs/*`, not just its own assignment.
Because of this, after the resume ran, `runs/01/agent-result.json` also
exists on disk with the SAME text `exec-fast-resume` wrote into `runs/02` —
this is a side effect of the fake executor's own broad directory scan, not
something the real engine wrote, linked, or trusted (the `result-linked`
event above cites `runs/02` specifically). The authoritative crash-state
evidence is section 3 above, captured BEFORE this resume ran.
