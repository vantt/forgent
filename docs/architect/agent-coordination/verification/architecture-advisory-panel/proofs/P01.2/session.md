# Session Status Board — P01.2 (mdview, clear case)

Case: thin-client vs local-ownership decision for mdview's native desktop shell.
Phase: 1 (Intake and Framing) — complete.
Next action: dispatch context investigator (Phase 3) against PROJECT_ROOT via
`codex-readonly`, once the bwrap scratch-bind design for the other two pairs
is confirmed safe (consulting `kongming` first, per standing instruction for
unfamiliar infra design).

Roster: see intake.md's Roster Resolved At Intake table.

Gaps recorded: `dispatch.mjs decide/execute` does not actually validate or
invoke the P00.1 bwrap mechanism for unregistered names (see intake.md) —
direct `bwrap` invocation used instead, by design, for this cell.
