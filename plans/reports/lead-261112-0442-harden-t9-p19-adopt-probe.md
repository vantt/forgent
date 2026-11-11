# HARDEN T9 P19 - the adopt probe answers "stuck, adoptable, why"

## Result

The existing read-only mode of the adopt route, `fgos internal adopt --probe-only` (not `--probe`: that one only reports the host's containment driver), now carries the judgement the doctor row `run-attempts-stuck` made by parsing `envelope.json`. No new verb, flag or route.

Answer, one JSON line per attempt directory:

- stuck = `state: "needs-adopt"` (lock free, domain empty, no `closed.json`); `running`, `being-adopted`, `closed`, `legacy-run` are not stuck.
- `adoptable: true|false`, present on `needs-adopt` lines only.
- `gone: [paths]` when `adoptable` is false: the envelope's `hostBin` and/or `<payloadRoot>/src/run-supervisor/attempt-step.mjs` that no longer exist. Same two conditions the doctor's `releaseGoneReason` checked; the doctor composes its own message text from `gone`.
- `reason` is unchanged (`no-envelope`, `start-refused:<code>`), so existing readers and tests keep passing.

## Route for P10 (doctor)

`adoptScan({ assignmentsRoot, probeOnly: true })` and `adoptRun(dir, { probeOnly: true })` in `src/run-supervisor/client.mjs` (already existed; they return the lines unmodified). P10 replaces `releaseGoneReason`, `attemptLockState` and the `envelope.json` parse in `checkRunAttemptsStuck` with: scan, keep `state === "needs-adopt"`, split on `adoptable`. Note: the scan costs one route process; the old row used a cheap lock stat. P10 should call it once per doctor run.

## Files

- `packages/run-supervisor/rust/src/adopt.rs` (+`release_gone`, `Verdict.adoptable/gone`, line output), `attempt_step.rs` (`ENTRY` made crate-visible so the entry path has one definition).
- Tests: three new cases in `rust/tests/adopt_matrix.rs` (adoptable, host gone / payload entry gone, lock held during probe answers nothing about adoption and takes no lock); helpers in `tests/support/adopt_fixture.rs`.
- Docs: `docs/platform/run-supervisor/spec.md` adopt section, route contract JSON (two new stdout fields), `client.mjs` doc comment. Census regenerated.

## Verification

- `cargo test -p fgos-run-supervisor`: all green (adopt_matrix 21). Build examples first (`cargo build -p fgos-run-supervisor --examples`): the harness binary is an example.
- `cargo fmt --check`, clippy `-D warnings`, `cargo check --all-targets` for x86_64-pc-windows-msvc and aarch64-apple-darwin: clean.
- Node: adopt-client, contracts, sweep, architecture, doc-health, decision-citation-drift: 103 pass, 0 ERROR lines. One-door scan: 0 undeclared sites.
- Full `npm test` not run: change is additive Rust output in the run-supervisor crate plus doc text; no Node caller reads the new fields yet. State this as a weaker proof.
- Not done: smoke on a built host against a staged stuck attempt; the crate's real-lock tests cover it (the route runs as the host runs it).

## Judgement notes

- Release-gone is judged from `envelope.json` only, as the doctor did. A not-started attempt (intent, no envelope) reads `adoptable: true` even if the intent's step host is gone; adopt would publish the envelope from that intent and its steps would then fail. Booked as a follow-up inside the adopt door if the owner wants it widened (a behaviour change, not a move).
- Existing fixtures use `payloadRoot: "/"` (no entry), so they now probe `adoptable: false`; their assertions never read it.
- No change to adopt itself (requirement 3). `packages/process` untouched; no OPC review needed.

## Authority

"Can adopt close this attempt, and why not" moved from doctor (Node, `run-supervisor-checks.mjs`) to the run-supervisor adopt route (Rust). Doctor's old judgement still exists until P10 switches the row and deletes `releaseGoneReason`; two copies live until then, by plan.

## Lessons

- The plan named `--probe`; the real read-only mode is `--probe-only`. Step 1 reading both routes saved a wrong design.
- Fixtures sharing a fake `payloadRoot: "/"` made a state change (new `needs-adopt` variant) impossible without touching a dozen tests; an additive field avoided it. Fixtures that name real paths would let the route's judgement be tested everywhere.
- `fgos convention path` only works from the main checkout, not a linked worktree.
- Rust support binaries in `tests/` are examples: a bare `cargo test --test` fails with ENOENT until `--examples` is built.
