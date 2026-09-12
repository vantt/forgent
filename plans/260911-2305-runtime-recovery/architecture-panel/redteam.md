Role: Independent Red-Team
Author: codex-bwrap / openai-codex / gpt-5.6-sol / critical
Dispatch: prompts/red-team.md -> runs/asgn_..._op_012/04 (attempts 01-03
killed by host OOM before settlement, void, never reused — see session.md)
Revision: v1
Written: 2026-09-12 (Run settled; transcribed by coordinator same day)

Full advisor output (primary record):
`.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_012/runs/04/agent-report.md`

## Verdict: REVISE

The panel process is substantially real: primary run artifacts exist,
Phase 5 isolation holds, the coordinator exposed its dispatch mistakes and
corrected its inflated independence claim, and principal source citations
are accurate. Revision required because **synthesis §4 branch 6
manufactures uncertainty around a fact stated explicitly in the person's
own locked baseline decisions** — the panel had enough evidence to resolve
it and did not.

## Findings

### 1. Phase 5 isolation: passes

Direct check of `phase5-shaping.json` + the protocol's own graph confirms
each of the three shapers got only its own objective. Searched all three
primary reports for sibling references: none found. Shared observations
trace to the shared scout report, not sibling leakage.

### 2. Primary artifacts and transcription fidelity: real, but curated

System-shaper's curated `proposals/system-shaper.md` is a shortened
editorial transcription of the real primary report, not byte-identical —
it preserves operative claims but removes detail including the primary
report's explicit caveat about not reading `session-engine.mjs` at the
load-bearing symbol. Labeled as curated, not fabrication. Alternative-
shaper's 41-line report is verified genuine (not the known agy one-line-
wrapper failure) — its `stdout.log` is 7 lines pointing only to the
report/result, and the report itself is coherent and complete. Critic's
primary report/stdout also verified to exist and faithfully carry its
findings.

### 3. Citation spot checks: pass

Independently re-checked against live source: `assignment-runner.mjs:
810-827` (unlocked attempt allocation, accurate); `herdr-round.mjs:654`
(timestamp name, `runId` unused, accurate); `herdr-round.mjs:55-61`
(blocked/paused-limit -> worker-timeout, accurate); `events.mjs:279-353,
404-465` (lock mechanics, accurate). **Independently re-verified the
critic's C1/F1 claim**: `session-engine.mjs:311-313` confirms
`runExecutorAttempt` calls `executeAssignment` directly, no attempt-
directory allocation. Also found the Herdr transport call at
`transport.mjs:653`; no contradictory Assignment-shaped launch path
established. No fabricated file:line citation found.

### 4. Authority and coordinator corrections: mostly pass

The two Phase 1 process failures are stated plainly in session.md, cause
identified as the coordinator's own writes during live dispatch — visible,
not minimized. The inflated "4 independent sources" framing is explicitly
retracted with corrected "citation cascade" wording, and synthesis repeats
the corrected weighting — **honest and visible correction, verified**.

The specialist mapping for the third alternative is a real, available
mechanism (`specialist-answer-slot`), not a fabricated role or authority
breach — but it was **not strictly necessary**: a shaper brief could have
required more than one candidate, and the specialist operation lives in
Phase 6, not Phase 5. Somewhat over-engineered; makes "three Phase 5
alternatives" technically inaccurate (it is 2 Phase-5 + 1 Phase-6
specialist).

### 5. Confidence: C1 supported; F7 honestly unchecked

C1's high confidence is independently supported (source re-checked
directly). "F7 unchecked" is itself verified as an accurate ledger
statement, not false confidence — the critic's report checks F1/F5, calls
F3 non-static, mentions F6 but never F7.

### 6. Synthesis branch 6: FAILS — manufactured uncertainty (the finding that changes the packet)

Synthesis says the ledger does not establish whether `generation`/
`incarnation` are among the 15 locked decisions, and escalates this
conditionally as an unresolved branch. **The original case answers this
verbatim**: `design-panel-prompt.md`'s own baseline decision 4 locks that
"`generation` dùng để fencing control ownership; `incarnation` phân biệt
worker resource sau gateway restart." System-shaper's own proposal
explicitly drops `generation` from S1 and moves `incarnation` to S2.

**Therefore the condition in branch 6 is already true, not hypothetical.**
This is a real packet/process integrity defect, and its root cause is
named plainly: the synthesizer's own reading list (built by this
coordinator) never included `intake.md`/`design-panel-prompt.md` — only
`interpretation.md`'s paraphrase. When a load-bearing question exceeded
its granted ledger, the coordinator did not check the person's own source
brief before preserving it as uncertainty.

## Required revision

Revise synthesis §§3.5, 4 branch 6, 6, and Unresolved to state that
baseline decision 4 explicitly covers `generation`/`incarnation`;
characterize system-shaper's S1' as a **baseline-departure request
requiring the person's decision** (retain the locked fields, or accept
the departure on system-shaper's evidence). Preserve the existing C1/F7
findings and the corrected citation-cascade wording — those hold.

## Verified vs. unverifiable in this session

**Verified:** all twelve required packet artifacts opened; Phase 5
request/graph isolation; three Phase 5 primary reports; transcription
fidelity for system/alternative/critic; `runExecutorAttempt` source
content; five source-citation groups; the protocol's specialist slot;
both coordinator correction records; synthesis C1/F7 characterizations;
baseline decision 4 against synthesis branch 6.

**Not verified:** hidden model context beyond persisted requests/prompts;
Herdr's external internal schema or live duplicate-name behavior; whether
F7 actually falsifies (only that nobody checked it); the critic's exact
F5 search procedure beyond its report and a fresh repository search;
claims inside the prohibited prior design-review reports; the
coordinator's OOM diagnosis for attempts 01-03 (accepted as stated, not
independently re-verified by the red-team).
