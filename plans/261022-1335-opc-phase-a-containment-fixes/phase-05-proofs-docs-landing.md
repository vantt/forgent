# Phase 05: proofs, docs and landing

## Requirements

1. **After-measurements.** Repeat phase 00's measurements exactly, on the phase A tip, inside a quiet window:
   - suite wall time;
   - suite contained-git census;
   - the micro rows;
   - the E3 rows.

   Report deltas against the baseline, interleaved where the harness allows. Expected values: about −1.4 ms per contained child; Land ≈ −76 ms; ScopedCommit ≈ −11 ms. The suite delta is the census count × 1.4 ms (an estimate).
2. **E1 rerun:** Publication and ScopedCommit, using the method of `verification-261021-2336-git-e1-publication-and-scoped-commit.md`.
3. **E4:** `test/git/scoped-commit.test.mjs` green on `bwrap-pidns` and on `linux-pgroup`.
4. **Full gates:** `npm test` and `cargo test --workspace` green. Read every run-tests ERROR line.
5. **Docs:**
   - `docs/platform/process/spec.md` §10: the `namespace-unavailable` causes, the probe reason, the conformance suite, and a "Lịch sử quyết định" entry.
   - `docs/platform/git/spec.md` §15 E4: contained children on best-effort drivers are watched (and with what predicate), plus a history line.
   - `CHANGELOG.md` (from phase 02).
6. **Landing.** HARDEN's review verdict and TEST's verdict are recorded. Land on main from the worktree. Update the OPC board row and the log. Record the Phase B trigger (arbitration §4) on the OPC row as the remaining open item.

## Files

- `docs/platform/process/spec.md`, `docs/platform/git/spec.md`, `CHANGELOG.md`;
- the board row and log;
- a verification report, with its path from `fgos convention path --kind report --type verification --slug opc-phase-a`.

## Validation

- Every AC of `plan.md` maps to a line of the verification report that carries evidence: a command plus its output, or a measurement.
- An unmet AC is a decision question to the owner. It is never reworded as met.

## Rollback

Revert the phase A commits in reverse order. The docs revert with them.
