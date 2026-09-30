Role: Architecture Critic
Author: agy-bwrap / gemini / gemini-3.1-pro-high / critical
Dispatch: prompts/architecture-critic.md -> runs/asgn_..._op_009/01
Revision: v1
Written: 2026-09-11 (Run settled; transcribed by coordinator 2026-09-12)

Full advisor output (primary record):
`.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_009/runs/01/agent-report.md`

## 1. Attack on system-shaper (Claim C1: "one launch path, not two")

Decision-impact: High. **Result: attack failed — C1 holds.** Directly
checked `runExecutorAttempt` in `session-engine.mjs` (system-shaper's own
F1 criterion): it does not allocate the attempt directory itself, it calls
`executeAssignment` directly. Also checked for other callers of
`executeExecutorCli`/`runHerdrRound` (F5 criterion): none call them with
an Assignment-shaped `runDir`. C1 is a **verified finding**, not an open
assumption dressed as a correction.

## 2. Attack on alternative-shaper (falsification criterion 1)

Decision-impact: Medium. **Attack landed.** "Herdr's internal architecture
doesn't store/index workId" is falsification theatre — Herdr is an
external dependency invoked via CLI; its internal architecture/schema
cannot actually be checked from this session.

## 3. Attack on system-shaper (F1/F3/F6 occurability)

Decision-impact: Medium. **Landed on F3, failed on F1.** F1: real and
checkable, checked (see Attack 1), did not occur. F3 ("live probe shows
herdr agent start reuses/replaces"): cannot be evaluated through static
code reading — needs a live probe, theatrical for this session's context.
F6 ("coordination run vocabulary cannot address an already-admitted,
un-settled Assignment"): real and checkable via static analysis of
`store.mjs`/`session-engine.mjs` (not itself checked this pass).

## 4. Attack on specialist-long-horizon ("FOURTH independent source")

Decision-impact: High (reduces perceived consensus strength). **Attack
landed.** This is a citation cascade, not independent re-derivation — the
specialist, system-shaper, and constraint-advocate all had
`scout-report.md` in their reading list. They agree with the scout report;
they did not each independently find the defect. **Coordinator note: this
attack corrected this session's own framing — see the updated note at the
end of `proposals/specialist-long-horizon.md`.**

## 5. Attack on constraint-advocate-phase5 (finding 3 calibration)

Decision-impact: Medium. **Attack landed.** Finding 3 ("MEDIUM,
conditionally IRREVERSIBLE") is undercalibrated: if a recovery attempt
misinterprets a legacy locator/directory as a v2 admission, it could
discard recovery evidence or corrupt state — an irreversible data-loss
risk during migration, deserving HIGH severity equal to finding 2.

## Shared unexamined assumption (both shapers)

Both system-shaper and alternative-shaper assume `workId`/`assignmentId`
uniquely identifies "the one legitimate attempt." Neither addresses
legitimate concurrent speculative attempts for one Assignment. In
system-shaper, locking at `executeAssignment` would squash legitimate
parallel speculative execution if it existed. In alternative-shaper,
gateway fencing on `workId` alone would cause Herdr to treat legitimate
speculative attempts as conflicts (Herdr has no knowledge of attempt
IDs/`runId`s). A real gap in both.
