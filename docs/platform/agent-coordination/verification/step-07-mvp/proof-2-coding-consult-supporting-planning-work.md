# Proof 2 — Coding Consult Supporting A Planning Work (R5)

Real, out-of-process live proof that an agent-proposed inline contract
attached to a real Work at a declared Stage (a) fires the coding domain's
harness seam (ADR-007 §1/P03.1), (b) is genuinely enriched by it, (c)
settles as ordinary evidence without ever driving the Work's own
Stage/status, and (d) is ignored by the driver's own next-operation
choice (ADR-007 §3 non-driving rule, P03.1-closed logic — this proof
confirms it holds for a real run, not re-testing the unit logic).

## Throwaway Work item

- id: `tsk-44e`
- title: "Guard --work <id> lookup against JS prototype property names
  (__proto__/constructor)"
- domain: `coding`, kind: `chore`, risk: `light`, created directly at
  `stage: planning` via `fgos add --stage planning` (mirrors Step 06 Cell
  6.3's own "created directly at stage: planning, satisfies the Required
  starting state without a separate discover step" precedent).
- verify: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
  test/runner/assignment-dispatch.test.mjs`
- docsRef: `docs/history/p03-3-proof2-work-lookup-proto-guard/`
- The underlying planning scenario is a REAL, already-logged gap, not an
  invented one: `docs/architect/agent-coordination/verification/step-07-mvp/index.md`'s
  own Follow-Ups list and P03.2's own Red-Team LOW finding both already
  name this exact gap (`--work __proto__`/`constructor` silently resolving
  instead of erroring, at both `cli.mjs:621` and the `--contract --work`
  branch) as deferred, cross-cutting, real future work. `CONTEXT.md` locks
  three decisions (root cause, fix approach, regression-coverage plan);
  `plan.md`'s steps implement those decisions. Both committed at git
  `72fffc65`.
- This Work item itself is throwaway — created only to give the advisor
  contract something real and coherent to consult against, per R5. It was
  never intended as the vehicle that actually lands the fix (no source
  change was made in this cell, per Non-Goals); it is parked `wontfix`
  after the proof (see Cleanup below), same as Step 06 Cell 6.3's own
  `tsk-5ka`.

## Command transcript

1. `git add docs/history/p03-3-proof2-work-lookup-proto-guard/CONTEXT.md
   docs/history/p03-3-proof2-work-lookup-proto-guard/plan.md && git
   commit` — committed the throwaway CONTEXT.md/plan.md pair (`72fffc65`).
2. `node bin/fgos.mjs add --title ... --kind chore --risk light --verify
   ... --stage planning --domain coding --docs-ref
   docs/history/p03-3-proof2-work-lookup-proto-guard/ --description ...`
   — created `tsk-44e` directly at `stage: planning`.
3. `node src/runner/dispatch.mjs decide --work tsk-44e` (BEFORE the proof
   run, baseline) → `{"mechanism":"out-of-process","configured":false,"executorId":"fgos-coding-planning"}`.
4. Authored
   `docs/architect/agent-coordination/verification/step-07-mvp/proofs/P03.3/proof-2/contract.json`
   — `role: "advisor"`, `supports: "shape-plan"` (confirmed a legal
   `operationsForStage(coding, planning)` entry via `fgos workflow
   operations --stage planning`, `role: implementer` by its own default
   declaration — the inline contract's own `role: "advisor"` is an
   independent hint, not required to match the operation's declared
   role), `objective: "are plan.md's steps consistent with the locked
   decisions in CONTEXT.md"` (verbatim per R5/the phase file), `mutation:
   "read-only"`, `evidence: { required: "reported" }`, `budget: {
   timeoutMs: 900000, maxRuns: 1 }`. `contextRefs`/`constraints` left
   empty in the authored file deliberately, to let the harness's own
   append-only behavior be the thing that populates them (see Harness
   evidence below) — `expectedOutputs` was still supplied non-empty by
   hand (`["agent-report.md (advisor findings on plan.md/CONTEXT.md
   consistency)"]`), since `execution-contract.mjs`'s generic validator
   requires a non-empty `expectedOutputs` array and runs strictly BEFORE
   the domain harness gets a chance to append its own entry.
5. `node src/runner/dispatch.mjs execute --contract <contract.json>
   --work tsk-44e` — a REAL executor spawn (`claude-reviewer`, real
   subprocess, ~168s wall-clock). Full transcript:
   `docs/architect/agent-coordination/verification/step-07-mvp/proofs/P03.3/proof-2/command-stdout.txt`.
6. `node src/runner/dispatch.mjs decide --work tsk-44e` (AFTER the run) →
   identical output to step 3's baseline.
7. `node bin/fgos.mjs show tsk-44e` (AFTER the run) → `stage: "planning",
   status: "todo"` — unchanged from creation.
8. `node bin/fgos.mjs move tsk-44e --to wontfix` — parked the throwaway
   item through the normal engine verb (no direct state edit), same
   cleanup convention Step 06 Cell 6.3 used.
9. Regression battery: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
   'test/**/*.test.mjs'` — 4643 tests, 4630 pass, 8 fail, all 8 matching
   `index.md`'s recorded baseline exactly by test name (G2 x4, G4 x2, G7
   x1, herdr-spawn LIVE x1) — zero new failures.

## Harness seam fired (R5's explicit requirement)

`assignment.json`'s `provenance.validators` is
`["execution-contract-schema", "domain-harness-seam"]` — the second entry
proves the coding domain harness (`domains/coding/harness/enrich-and-validate-contract.mjs`,
P03.1) actually ran against this real Assignment, not just the generic
foundation validator alone (contrast with Proof 1's `validators`, which
has only the first entry).

Harness-added evidence visible on the persisted `assignment.json`:

- `contextRefs` grew from the empty array I authored to three entries:
  `docs/history/p03-3-proof2-work-lookup-proto-guard/`,
  `.../plan.md`, `.../CONTEXT.md` — exactly the harness's own
  `work.docsRef`-derived append behavior
  (`enrich-and-validate-contract.mjs:127-132`).
- `provenance.inline.contract.constraints` grew from `[]` to
  `["scope: repository (read-only)"]` — the harness's own repository
  read-only-scope constraint (`enrich-and-validate-contract.mjs:137-140`).
- `expectedOutputs` grew from my one hand-authored entry to two: my own,
  plus the harness's `"agent-report.md (reviewer findings and
  evaluation)"` (`enrich-and-validate-contract.mjs:146-149`) — append, not
  replace, exactly as ADR-007 §1 requires.

## Non-driving proof (R5's other explicit requirement)

- **Work stage/status unchanged**: `fgos show tsk-44e` immediately after
  the run reports `stage: "planning"`, `status: "todo"` — identical to
  the values at creation, before this cell ever ran. No Work-lifecycle
  verb was called by the inline Assignment itself (confirmed by reading:
  the `--contract` branch's only Work-state interaction anywhere in
  `cli.mjs` is the `listWork(fgosDir)` read used to resolve `--work`; the
  later `wontfix` move in step 8 above happened afterward, separately,
  through the normal engine verb).
- **Driver's next-operation choice ignored the inline result**:
  `node src/runner/dispatch.mjs decide --work tsk-44e` produced the byte-identical
  JSON both before (`step 3`) and after (`step 6`) the real run —
  `{"mechanism":"out-of-process","configured":false,"executorId":"fgos-coding-planning"}`
  in both cases, despite the inline Assignment settling `status: "done"`,
  `confidence: "reported"` in between. A driving RunResult would have
  changed this decision (e.g. toward `validate-plan`'s own gate outcome);
  it did not move at all. This is the live-run confirmation
  current-cell.md asks for of P03.1's already-closed unit-level filter
  (`operation-choice.mjs`'s `findLatestAssignmentRunResult` skipping
  `provenance.kind === 'inline'` Assignments) — not a re-test of that
  logic, a confirmation it holds under a real dispatch.

## Outcome (evidence quality)

- `result.json`: `status: "done"`, `confidence: "reported"`,
  `executorId: "claude-reviewer"`, `executorRedirected: true` (same
  read-only-role redirect as Proof 1, confirmed again here).
- `agent-result.json`: `verdict: "consistent"` — a genuine, itemized
  cross-check of plan.md's steps against every one of CONTEXT.md's three
  locked decisions (D1/D2/D3), citing real line numbers it verified live
  against the current source, plus one honest non-blocking observation
  (plan.md's "already covered by
  test/runner/assignment-dispatch.test.mjs" framing is precise for the
  `--contract --work` call site but slightly optimistic for `decide
  --work`, since no pre-existing test drives an unknown id through that
  specific path today) — real reasoning, not a rubber-stamp.
- `evidence.json`/`result.json.evidence`: `gitBefore === gitAfter`,
  `changedFiles: []` — no repo mutation, as required for a read-only
  contract, despite the consult's objective concerning a real code-change
  plan.

## Cleanup

`tsk-44e` moved to `wontfix` (step 8 above). `docs/history/p03-3-proof2-work-lookup-proto-guard/`'s
CONTEXT.md/plan.md are left committed (git `72fffc65`) as the durable
record of what this proof consulted against, same as Step 06 Cell 6.3
left its own throwaway `plan.md` committed under `docs/history/`.

## Artifacts

All under
`docs/architect/agent-coordination/verification/step-07-mvp/proofs/P03.3/proof-2/`:

- `contract.json` — the authored execution contract
- `command-stdout.txt` — full command transcript
- `assignment.json`
- `non-driving-check.txt` — the before/after `decide --work` output and
  the post-run `stage`/`status` read
- `runs-01/run.json`, `runs-01/dispatch-plan.json`, `runs-01/result.json`
- `runs-01/agent-result.json`, `runs-01/agent-report.md`
- `runs-01/exit.json`
