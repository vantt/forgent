# COOK's three seat defects: causes (HARDEN R10–R12)

Read-only diagnosis made 2026-10-25 19:07 on fg-server2. Source: COOK's board line "2026-10-25 19:05 (COOK forgent-76". All three causes are located in source. COOK's unit-run records are not on fg-server2: the newest `.fgos/assignments/` run there is from 10-23. So none of these findings is checked against COOK's own attempts. `822a9f14f` changes only `.fgos/config.yaml`, where the deepseek advanced cell now tries thehive first and OpenRouter second. It touches no code.

## R10: `--resume` ignores a config change

**Cause**
- `src/runner/execution/run.mjs:700` takes the config snapshot once, when the unit first launches, and `:775` stores it as `unitRecord.configSnapshot`.
- A resume reads that record and never takes a new snapshot. Every later bind and dispatch reads the old one (`:884`, `:1027`, `:1398`, `:1437`).
- At `:1057-1067`, a seat/round that already has recorded bindings reuses the last binding and never calls `bind()`.
- Comments at `:777` and `:868-871` state this on purpose. The intent rests only on those comments: we found no RUL or D-ADR in `docs/specs/runner.md` or the seat-binding spec that chooses it.
- History: `073c8b6fc` (10-01) and `eb8898f95` (10-02).
- The runner's own RUL104 ("resume never starts a second supervisor for an attempt that already has a binding or a receipt") protects against running an agent twice. It says nothing about config freshness.

**Possible fix.** In `run.mjs` only: take a new snapshot on resume, and reuse a recorded binding only for an attempt that passed or whose commit or adopt result is still pending. Delete the two comments in the same change. The owning proof would go in `test/runner/execution/run-resume-order.test.mjs`.

**Owner decision needed.** This reverses stated intent and widens what `--resume` means. The alternative that needs no code: after changing config, start a new unit run. That is what COOK did.

## R11: a producer that changes nothing is never reviewed

**Cause.** The proof is a chain through four files:
1. `src/runner/dispatch/settlement.mjs:353-359`: a writing seat that claims `done` but changed no files gets `no-evidence`/`inconclusive`.
2. `src/runner/dispatch/run-result.mjs:1227-1230` turns that into `verdict-inconclusive`.
3. `src/runner/execution/unit-run-history.mjs:18-32` counts that verdict as `execution-failure`.
4. `src/runner/execution/patterns/reviewed.mjs:19-24` and `:243` treat that as an error and stop before the reviewer step.

No RUL chooses this. RUL83 (`runner.md:1110`) only attributes writes.

**Possible fix.** In `reviewed.mjs`, a writing producer's `no-evidence`/`inconclusive` result no longer stops the round. The checkers and verify seat run, and their verdict becomes the evidence. The proof goes in `test/runner/execution/patterns/reviewed.test.mjs`.

We rejected changing `settlement.mjs` to accept a bare `done` claim instead: that would lower the evidence floor for every pattern, including `solo`.

**Owner decision needed (light).** This changes what "producer done" means for a writing seat. A producer that does nothing and claims done is still judged by the reviewer and verify.

## R12: a pi seat on OpenRouter 402 hangs to the 2100 s timeout

**Cause (in source).**
- `src/run-supervisor/steps/settle-attempt.mjs:102-118` recognises a provider stop from the pane, but its patterns contain no OpenRouter 402 wording.
- The shared list is `src/runner/dispatch/provider-auth-failure.mjs:49-54`, and its quota part is codex-only. The rule at `:38-48` admits only wordings seen from a real CLI.
- The screen is read only after an early `terminal:*` stop (`settle-attempt.mjs:125-129`).
- On a deadline the outcome is `timeout`. `settlement.mjs:243-251` and `:633-647` then make `provider-limit` impossible.

**Cause (inferred, not proven).** Why the 300 s idle watch (`herdr-round.mjs:57`) did not end the pane: probably the Rust watch (`supervise/terminal.rs:440-448`) resets on every screen change, and a pi pane that retries keeps redrawing. COOK's pane record would confirm this.

**Fix.**
1. Capture one real pi 402 pane or stderr from COOK.
2. Add the measured wording to the shared list. The proof goes in `test/runner/provider-auth-failure.test.mjs`.
3. If the supervisor still does not stop early, `rawResultOf` reads the screen on a `timeout` too, so the deadline settles `provider-limit` and the fallback walk goes on. One wiring proof goes in the run-supervisor settle tests.

An early stop in Rust changes the supervisor contract. That one needs the owner, and only if the capture shows it is needed.

**No owner decision** for steps 1–3.

## Order

R12 first: it removes the hang for every provider, but it needs COOK's capture. Then R11 and R10, after the owner answers.

## Unresolved

- The real pi 402 wording and COOK's attempt directories. Asked of COOK on the board.
- `docs/platform/run-supervisor/spec.md` was searched by symbol only, not read in full.
