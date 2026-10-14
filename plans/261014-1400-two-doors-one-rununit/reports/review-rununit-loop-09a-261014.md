# Review: rununit-loop 09a (`workUnitFor` + `workRigorFor`)

Branch `feat/rununit-loop`, `git diff main...HEAD` = 7950b5696. Read-only review, 2026-10-14.

## Scope
- `src/runner/work-dispatch.mjs`: +156/-3. The three deleted lines are import lines. `spawnWorker` and `workDispatchContext` are unchanged.
- `test/runner/work-unit-for.test.mjs`: new, 16 tests. All 16 pass (`env -u CLAUDE_CODE_SESSION_ID node --test`).
- Checked against: R3 §3, §4, §6, §9; `assignment-policy.mjs:225-251`; `assignment.mjs:395-406`; `unit.mjs` `validateUnit`/`isValidInput`.
- I ran edge-case probes with a throwaway script in the session scratchpad, not in the repo. The results are quoted below.

## Verdict
The rigor fold matches the policy. Inputs order matches `buildAssignment`. Unit shape passes `validateUnit`. Transport and session stay out of the helper, which matches §9.

There are no High findings. Two Medium findings are about the trust boundary on `work.refs` and `docsRef`, because those strings come from editable item fields. Phase 09 should close both before the loop calls this helper.

## High
None.

## Medium

### M1. `work.refs` entries with the `unit-run:` or `gate-answer:` prefix get past the ref filter
Where: `src/runner/work-dispatch.mjs:356-359` (`isSafeRepoRelative`) and `:416-422` (`addInput`).

`isSafeRepoRelative` is a copy of `unit.mjs` `isValidRepoRelativePath`, but it misses the prefix handling in `isValidInput`. Two failures follow:
- **A malformed prefix breaks the whole Unit.** Probe: `refs: ['unit-run:abc']` passes the filter with no warning. `validateUnit` then throws `RunnerConfigError ... got: "unit-run:abc"`. R3 §4 says a bad ref is skipped with a warning and must not break the Unit.
- **A well-formed prefix is silently promoted to a cross-run read.** Probe: `refs: ['gate-answer:run1/step1']` becomes a Unit input with no warning. `resolveUnitInputs` (`handoff-refs.mjs:233-238`) then resolves it to another run's report or gate answer. `work.refs` is an editable free-text item field (`store.mjs:353`), so anyone who can edit an item can make the worker read another run's output. `buildAssignment` used to treat refs as inert context strings.

Fix: export one predicate from `unit.mjs`, so the copy goes away (DRY). Have `workUnitFor` warn and skip any ref that starts with `unit-run:` or `gate-answer:`, unless the design decides on purpose that Work refs may name runs. Add tests for both prefixes.

### M2. An unsafe `docsRef` is warned about for inputs but still used for `pinInputs`, `contentRoot` and the default `worktree`
Where: `src/runner/work-dispatch.mjs:423-429` and `:433-439`.

`docsRef` has no path validation at the state door: `work.mjs:616-618` only checks that it is a non-empty string. The probe used `docsRef: '../<outside-dir>'` with a `plan.md` present there:
- the three inputs are skipped with warnings, which is correct;
- `pinInputs` is still `['/tmp/fgos-probe-out-…/plan.md']`, a file outside the repo;
- `resolveContentRoot` → `readLockedContext` reads `CONTEXT.md` and `plan.md` outside every candidate root (`paths.mjs:138-145`).

R3 §2 has phase 10's dispatch reject pins outside the allowed roots by `realpath`, but that guard is not built yet. The helper already knows `docsRef` is unsafe and goes on using it.

Fix: check `docsRef` once with the same predicate. If it fails, push one warning, treat it as `null` (no inputs, no pin, `contentRoot = stateRoot`), and test it.

## Low

### L1. `rigor: null` throws where today's loop falls back
Where: `src/runner/work-dispatch.mjs:340`.

`workRigorFor` tests `work.rigor !== undefined`, so `null` throws `invalid work rigor "null"`. Today `loop.mjs:1695` and `spawnWorker` (`work-dispatch.mjs:103`) use `??`, so `null` falls back to the risk rule or `standard`. The new behaviour does match `assignment-policy.mjs:235-240`. `work.mjs:390` also rejects `null` on write, so only legacy rows are exposed.

Record this as a deliberate tightening in the 09 cutover notes, or treat `null` like `undefined`.

### L2. `declared.workflow` can name a different workflow from the one `operations` came from
Where: `src/runner/work-dispatch.mjs:463-465` against `domain-registry.mjs:202-206`.

`declared.workflow` prefers `item.workflow`. `operationsForStep` resolves the workflow through `resolveWorkflow(domain, kind)`, which ignores `item.workflow` and falls back to the default when the name is unknown. An item with `workflow: 'bugfix'` and a kind mapped to `feature` gets `operations` from `feature` but `declared.workflow: 'bugfix'`.

This mismatch exists today too (`buildAssignment:333`, `operation-choice.mjs:2282`), so it is not a regression. Still, `declared` gets persisted into `unit.json`, so derive both from one source.

### L3. `expectedFiles` are not checked before they become `writes`
Where: `src/runner/work-dispatch.mjs:444`.

An absolute or `..` entry only fails later, in `validateUnit` (probe: `"/etc/x"` throws). The failure is fail-closed, so this is acceptable. Nothing tests the boundary.

### L4. The Unit id can collide or hide a missing item id
Where: `src/runner/work-dispatch.mjs:448`.

`tsk-a.b` and `tsk-a_b` map to the same id. A missing `item.id` gives `work-undefined-executing`. Ids are not the run key, so the impact is cosmetic. Throwing on a missing `item.id` would be cheap.

### L5. Dedupe is by exact string
`docsRef: 'docs/a/'` plus `refs: ['docs/a']` yields both `docs/a/` and `docs/a`. Cosmetic.

### L6. R3 §4 wording does not match the code
R3 §4 says "`docsRef/CONTEXT.md` (khi refs trống)". In `assignment.mjs:396` that condition is about the caller's `contextRefs`, not `work.refs`. The implementation always adds the triple, which matches the code. The test at `work-unit-for.test.mjs` "read-only operation Unit…" locks that reading. No code change is needed; say so in the cutover notes.

## Missing test cases
- `risk: heavy` on an operation Unit raises `validate-plan` from `standard` to `high`. The raise-over-opPolicy branch is untested.
- An invalid `opPolicy.rigor` is refused.
- The capability of an operation Unit:
  - `validate-plan` gives `review`, or `coding:review` when that is configured;
  - a work-product operation (`implement-item`) falls back to the step capability. This is a deliberate choice that nothing locks.
- An operation Unit without `stateRoot` throws (`:434`).
- An operation Unit with empty or whitespace feedback gives exactly `Execute planning.validate-plan operation`, with no trailing section.
- A `docsRef` with no `refs` gives exactly three inputs.
- M1 and M2, as described above.

## Checked and correct
- **Rigor order** (`:338-342`) against `assignment-policy.mjs:236-251`. The operation rigor comes first. `work.rigor` only raises it. `risk: heavy` applies only when `work.rigor` is absent. Neither the capability floor nor the CLI rigor is folded in, as R3 §3 requires. A `low` result is later floored to `standard` by bind, which matches the R3 spec delta.
- **Mutation stamp** uses `stampDeclaredAssignment`, which defaults `role` to `implementer` the same way R3 §1 does.
- **Capability derivation** passes `{...matchedOp, result}`, the same shape `assignment-policy.mjs:257-261` builds.
- **Step-Unit stage threading:**
  - The objective uses `buildPrompt(item, feedback, opts.stage)`, which is byte-identical to `spawnWorker`.
  - When `opts.stage` is unset, `buildPrompt`, `executorIdForWork` and `workCapabilityHints` all fall back to `effectiveStep`, so they agree with the Unit id.
- **Read-only operation Unit** defaults `worktree` to `contentRoot` (R3 §2). A mutating Unit with no worktree is refused.
- **Transport and session** are not decided here (R3 §9).
- **Lint and tests:** I did not run the full `npm test`, per the instructions. The focused file passes 16/16.

Status: DONE_WITH_CONCERNS
Summary: The helper matches R3 §3, §4, §6 and §9 on rigor, inputs, return shape and transport neutrality, and spawnWorker/loop are unchanged. Two Medium trust-boundary gaps should be fixed before 09 wires the loop to this helper: `unit-run:`/`gate-answer:` prefixes in `work.refs` are passed through or crash the Unit (M1), and an unsafe `docsRef` still drives `pinInputs`/`contentRoot` (M2).
