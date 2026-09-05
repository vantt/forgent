# Session Status Board — P01.2 (mdview, clear case)

Case: thin-client vs local-ownership decision for mdview's native desktop shell.
Phase: 3 (Understand the Problem) complete — real scout report in hand,
falsifies the initial hypothesis with strong evidence (see scout-report.md).
Phase 2 (Understand the Person) dispatched, awaiting result.
Next action: once Phase 2 lands, do Phase 4 (ask-reluctantly check — the
scout report surfaced a genuine "local ownership scope" ambiguity and a
stale-PRD-decision tension, both noted in scout-report.md's Coordinator
note), then Phase 5 (dispatch 3 shapers, isolated).

Roster: see intake.md's Roster Resolved At Intake table.

Gaps recorded: `dispatch.mjs decide/execute` does not actually validate or
invoke the P00.1 bwrap mechanism for unregistered names (see intake.md) —
direct `bwrap` invocation used instead, by design, for this cell. Kongming's
verified scratch-bind design (--tmpfs /tmp before re-pinning PROJECT_ROOT/
EVIDENCE_DIR) is now in use for claude-bwrap/agy-bwrap dispatches.
