# HARDEN T9 P32: provenance has one writer, Seat Binding

Branch `harden/t9-p32-provenance-single-writer`, based on origin/main `b2fc5cf80`.

## What changed

Scan of `src/runner/dispatch`, `src/runner/execution`, `src/workflow` for writes after bind. Findings:

- **Launch facts written into provenance** (`withLaunchProvenance`, `settlement.mjs`): `reasoningEffort.rendered` and `modelDrift` were added to `policy.provenance`. They are what a launch did, not a binding decision. Now `policy.launch { effortRendered, modelDrift }` (`withLaunchFacts`), owned by Dispatch settlement.
- **Relabels in `effectiveDispatchPolicy`** (`plan.mjs`): for a bound seat the executor source lost bind's id (`{scope:'seat-binding'}`), the persona was re-derived from `opPolicy` / role default with a Dispatch label, and an unset effort said `default`. All three now copy bind's `{value, source}` (`bindingSource`); persona none is bind's answer (`source: none`), no reviewer default for a bound seat.
- **No write found, so none changed:** `assignment-runner.mjs` (reads of `binding`, fallback attempts `<round>-fb<n>`), `run.mjs` `runAttempt` / `dispatchBound` (persist and return `bound` as is), `attemptProviderCapacityFallback` and account rotation (call `bind()` with `walk`; `fallbackFrom` and the account-pin `skipped` note are written inside `bind.mjs`, `explainSeat`). The write gate and doctor `mutating-assignment-binding-snapshot` replay read `bindingInput` and the config digest only, so no field written after bind feeds them; nothing needed `walkStateOf`.
- Remaining non-bind provenance writers, named: the `fgos dispatch probe-account` path (`cliOverride`, no binding) and Work-hint assignments without a binding (`bindWorkSeat`, then `cliOverride.model` label in `plan.mjs`). Both have no seat binding to copy.

Docs: runner subcomponent spec line (`h-02842f76ffd2`), CHANGELOG line, phase file and sub-plan row.

## Proofs

- Owning: `run-provider-failover.test.mjs` "every attempt of a fallback walk and of a skipped account pin records the provenance bind returned, unchanged": rotation `1` to `1-fb1` with a skipped pin on another pool; per attempt, executor, tier, model, effort, persona in the recorded policy equal bind's value and source and carry no extra key; no `modelDrift` in provenance; the result's binding equals unit.json's. Red on executor source id, then effort, then persona before the fix.
- Wiring: `run-verb.test.mjs` "--json hands the user each attempt's binding with the provenance Seat Binding recorded, unchanged".
- Moved assertions: `dispatch-execute-effort.test.mjs` reads `policy.launch.*` (same cases); `dispatch-plan-policy.test.mjs` persona assertion now the bound label (behaviour changed, not removed).

## Real run

`fgos run "<ok>" --provider openai --override '{"tier":"nano"}' --json`, dev host, read-only, pass. Provenance sources: executor `unit-prefer`, invocation `unit-prefer`, pool and model `modelPolicies.openai.nano`, tier `override`, effort `cell`, persona `none`.

## Gate

Focused runner, workflow, run-verb sets green (one `loop.test.mjs` timeout at 604s under load, 99 pass alone). Architecture, doc-health green; citation drift only the known document-identity red. One-door scan 0 undeclared. Rust untouched. Full `npm test`: 8825 tests, 5 fail: V7n addendum and document-identity drift (known), `mailbox-live-confined` (load flake, 19/19 on three reruns, also with baseline), `fgctl-init-preflight-tail` and `workflow-runner-lock-status` (pass alone). No ERROR lines.

## Authority

- Provenance labels: written by Seat Binding only for a bound seat; Dispatch copies. Launch facts (effort flag rendered, model drift) belong to Dispatch settlement under `policy.launch`.
- Still two places label without a binding: probe-account and Work-hint assignments. Belongs in bind if either gains a seat; not moved (Work code out of scope).
- `provider` provenance (`registeredExecutor`) is a Dispatch registry fact, not a bind field; left.

## Lessons

- A scan for writes should include shape-extending spreads (`{ ...policy.provenance, x }`), not only assignments: the launch writer was a spread.
- A "copy unchanged" proof must compare key sets, not only values, or an extra field passes.
- Full suite waits on a machine-wide queue; start it early and read the whole fail list before rerunning.
