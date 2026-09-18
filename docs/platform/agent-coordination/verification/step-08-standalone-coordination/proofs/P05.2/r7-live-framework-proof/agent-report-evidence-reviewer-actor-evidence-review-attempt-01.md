# Evidence review — asgn_p05_2_r7_proof_driver_op_007

Auditing the critic report at `asgn_p05_2_r7_proof_driver_op_006` against the frozen mdview case brief (embedded verbatim in `op_006/assignment.json`) and the raw working-directory evidence.

## Result: 18 grounded, 4 unsupported/speculative

### The one consequential finding

**PROC-2 is unsupported and contradicted by evidence.** The critic claimed the inline-editing constraint "has no independent enforcement point" and is "enforced only at the critic stage," so any upstream failure "silently disables the constraint check entirely." The critic itself says it deliberately did not read `op_002`/`op_003`/`op_004` (§5, scope discipline). I read them. All three explorer assignments embed the identical verbatim paragraph the critic itself was given: *"Any candidate answer that proposes inline editing on the existing view screen has NOT answered the locked objective and must be flagged as such, never silently accepted..."* The constraint is delivered to every stage, not introduced downstream. The critic turned an intentional evidence gap into a definitive negative claim about the pipeline's design.

### Other unsupported items

- **PROC-3's recurrence prediction** ("will most likely reproduce the same exit code") — reasonable, but nothing in the working directory shows whether other stages share the same provider/quota, or whether the failed run's quota is per-key vs. shared.
- **Write-back safety risk** (atomic replace, CRLF/encoding) and **path-traversal-on-write risk** — legitimate general engineering concerns, but not traceable to any line in the frozen PRD brief. They're imported domain knowledge, not context-grounded findings.

### What's solid

- The entire evidence table (op_005 run.json/stderr/stdout/missing reports) — directly verified, matches.
- PROC-1 (critic dispatched over a failed producer) and PROC-4 (R3 minority-preservation now unverifiable) — both trace cleanly to real files (`op_005/assignment.json`'s own "R3 requirement" wording, `op_005`'s failed run).
- The entire pre-registered checklist's PRD citations (§3.2 non-goals, §7.1 daemon/port, §7.2 routes/WebSocket, §7.4 ports/comrak, §7.5 desktop read-only) — every quote checked against the frozen brief verbatim and matches exactly. The risk syntheses built from combining two real cited facts (e.g., notify watcher + WebSocket → race condition; comrak + round-tripping → reformatting) are valid derivations, not fabrications.
- The inline-editing "not-evaluable" verdict itself, and the refusal to treat it as a clean pass — a correct, non-speculative reading of "zero candidate answers reached this stage."

## Unresolved question

Does explorer-level exposure to the constraint text count as "enforcement," or is critic-stage flagging the only enforcement that counts by design? PROC-2's underlying worry (single point of failure) may still be legitimate even after correcting its factual overclaim — that's a design question for the maintainer, not something this audit can settle from the files alone.

Full per-claim ledger: `agent-result.json` in this run directory.
