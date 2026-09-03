# Proof 1 — Standalone Inline Read-Only (R4)

Real, out-of-process live proof that an agent-proposed inline execution
contract with no `--work` attachment builds and executes through the
`--contract` door (P03.2), using the foundation's generic validator alone
— no domain, no Stage, no TaskSpec. This is the empirical evidence ADR-007
§2 ("standalone uses the generic validator only") requires.

## Contract authored

`docs/architect/agent-coordination/verification/step-07-mvp/proofs/P03.3/proof-1/contract.json`
— `role: "reviewer"`, a bounded, real design question checking whether
`domains/coding/harness/enrich-and-validate-contract.mjs`'s actual code
matches every guarantee ADR-007's Decision section makes for the seam
(purity, no executor/tier/Work-lifecycle touch, fail-closed `supports`
rejection, append-only context/constraint/expectedOutputs), `mutation:
"read-only"`, `evidence: { required: "reported" }`, `budget: { timeoutMs:
900000, maxRuns: 1 }`. No `policy`/`preferExecutor` field was written into
the contract JSON — that field does not exist in
`execution-contract.mjs`'s `ACCEPTED_CONTRACT_FIELDS` and would have been
rejected as unknown. The `claude-reviewer` executor resolution current-cell.md
describes happens automatically at dispatch time
(`assignment-runner.mjs`'s `resolvedExecutorId` gate, keyed off
`isReadOnlyAssignment(effectiveAssignment)` — true here because
`role: "reviewer"` is in `READ_ONLY_ROLES`), never from a contract field.

**`caller.writerId` left absent** (not supplied in the file) — this
exercises P03.2's auto-resolve path (`resolveWriterIdentity(fgosDir)`),
the same path P03.2's own "no `--work`... auto-resolve path" test covers.
The other Doer choice (a file-supplied `caller.writerId`) is exercised
instead by Proof 2 implicitly via the same mechanism — see that record.

## Command

```
node src/runner/dispatch.mjs execute --contract <contract.json>
```

Run from the real repo root, against the real `.fgos/config.json` (no
fake executor override) — the real `claude-reviewer` executor
(`.fgos/config.json`'s `runner.executors.claude-reviewer`, `cli-spawn`,
sonnet-tier) spawned a genuine `claude -p ... --model sonnet
--permission-mode acceptEdits` subprocess and produced a real answer.

Full command transcript:
`docs/architect/agent-coordination/verification/step-07-mvp/proofs/P03.3/proof-1/command-stdout.txt`.

## Outcome

- `dispatch-plan.json`: `mechanism: "out-of-process"`, `executorId:
  "claude"` (declared preference before redirect), `adapter: "cli-spawn"`.
- `run.json`/`result.json`: `executorId: "claude-reviewer"` (the redirect
  fired — real proof the read-only-role executor scoping from Step 06
  Cell 6.3 Fix Round 1/2 applies to this door too), `executorRedirected:
  true`.
- `exit.json`: `exitCode: 0`, `timedOut: false`, `durationMs: 110422`
  (~110s) — a genuine subprocess wall-clock cost, not an instantaneous
  fake.
- `evidence.json`/`result.json.evidence`: `gitBefore === gitAfter`,
  `changedFiles: []` — no repo mutation, as required for a read-only
  contract.
- `agent-result.json`: the executor genuinely read both cited files and
  produced a structured, correct point-by-point verdict (`(a)`-`(d)` all
  `"confirmed"`, `mismatchesFound: false`) — real reasoning against real
  source, not a canned response.
- **Settled `status`/`confidence`: `"failed"`** (`agentClaim.summary:
  "agent-result.json was present but failed schema validation"`). See
  "Genuine finding" below — this is real evidence of a real gap, not a
  proof-authoring mistake, and does not affect this proof's acceptance
  criteria (neither R4 nor current-cell.md's Acceptance section requires
  `status: "done"` for Proof 1 — only that it "actually ran through a
  real, configured executor" and carries zero coding-stage/TaskSpec
  references, both true here).

## Standalone assertion (R4's explicit requirement)

Read `assignment.json`
(`docs/architect/agent-coordination/verification/step-07-mvp/proofs/P03.3/proof-1/assignment.json`)
in full and grepped it for the exact field names `"stage"`, `"domain"`,
`"taskSpec"`, `"operation"` — **zero matches** (see Commands below for the
exact grep run and its no-match exit code). `workId: null`. The word
"coding" appears exactly twice in the file — both inside my own free-text
`objective`/`contextRefs` strings, because the design question I chose is
*about* `domains/coding/harness/enrich-and-validate-contract.mjs` as a
doc-under-review, not because the Assignment itself declares a coding
Stage or Operation. `provenance.validators` is `["execution-contract-schema"]`
only — no `"domain-harness-seam"` entry, confirming the domain harness
never ran for this standalone request.

## Commands

```
grep -inE '"(stage|domain|taskSpec|operation)"' assignment.json result.json run.json
# exit 1 (no match)

grep -in "coding" assignment.json result.json run.json
# 2 matches, both inside free-text objective/contextRefs strings referring
# to domains/coding/harness/enrich-and-validate-contract.mjs as the doc
# under review -- not an Assignment-level stage/domain field.
```

## Genuine finding (not a Non-Goals violation, no source touched)

Read `renderAssignmentPrompt` (`src/runner/dispatch/assignment.mjs:612-670`)
to understand why the settled result was `"failed"` despite genuinely good
underlying work. The rendered prompt only ever says `Write structured JSON
to <runDir>/agent-result.json` — it never states the exact required shape.
`validateAgentResultClaim` (`assignment.mjs:723-767`) requires a top-level
`{status: <one of ALLOWED_AGENT_CLAIM_STATUSES>, summary: <non-empty
string>}` object at minimum. For a **declared** operation with a coding
TaskSpec (e.g. `validate-plan.md`), that exact schema is documented in the
TaskSpec markdown the executor reads. For a **standalone inline** contract
with no TaskSpec at all (this proof's own shape, by design — R4 forbids
inventing one), nothing in the prompt or contract tells the executor what
shape `agent-result.json` must take. The executor here reasonably wrote
its own sensible application-specific JSON (`verdict`, `findings: [...]`)
instead of the foundation's actual required `{status, summary}` minimum,
and the generic evidence classifier correctly, honestly reported
`"failed"` for the schema mismatch — this is not a false success (Bug
Taxonomy's first category): the classifier caught a real gap between what
was written and what was required, it did not paper over one.

This is a genuine, live-proof-only finding (fake-executor unit tests could
not have surfaced it, since fake executors write handcrafted
`agent-result.json` fixtures already shaped to pass validation) — the same
category of discovery Step 06 Cell 6.3's own live run produced (see
`docs/architect/agent-coordination/verification/team-dispatch-v1/step-06-cell-3-validate-plan-live-smoke.md`'s
Red-Team MEDIUM finding). Per this cell's Non-Goals, no source change was
made to fix it — logged as a Follow-Up in `P03.3.md`'s Gaps section and
`index.md`'s Follow-Ups for a future cell to consider (e.g. rendering the
`{status, summary}` minimum shape directly into
`renderAssignmentPrompt`'s "Result artifact" block for every Assignment,
declared or inline).

## Artifacts

All under
`docs/architect/agent-coordination/verification/step-07-mvp/proofs/P03.3/proof-1/`:

- `contract.json` — the authored execution contract
- `command-stdout.txt` — full command transcript (stdout, including the
  executor's live text output before the final JSON line)
- `assignment.json`
- `runs-01/run.json`, `runs-01/dispatch-plan.json`, `runs-01/result.json`
- `runs-01/agent-result.json`, `runs-01/agent-report.md`
- `runs-01/exit.json`
