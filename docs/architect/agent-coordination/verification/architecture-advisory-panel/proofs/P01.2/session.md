# Session Status Board — P01.2 (mdview, clear case)

Case: thin-client vs local-ownership decision for mdview's native desktop shell.
Phase 1-5 complete. All 3 shapers converge on "fix the 4 real launcher bugs"
as a necessary step; 2 of 3 (system shaper, constraint advocate) recommend
staying thin; alternative shaper's primary is to delete the shell entirely,
with "stay thin + fix launcher" as its own stated smaller path. Genuine,
isolated divergence — not manufactured.
Next action: Phase 6 critic dispatched (agy-bwrap) against all 3 proposals
together. Then Phase 7 synthesizer.

Roster: see intake.md's Roster Resolved At Intake table.

Gaps recorded: `dispatch.mjs decide/execute` does not actually validate or
invoke the P00.1 bwrap mechanism for unregistered names (see intake.md) —
direct `bwrap` invocation used instead, by design, for this cell. Kongming's
verified scratch-bind design (--tmpfs /tmp before re-pinning PROJECT_ROOT/
EVIDENCE_DIR) is now in use for claude-bwrap/agy-bwrap dispatches.
