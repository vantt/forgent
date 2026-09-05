# Fixer Report — Cell P01.1 (Mutation Unlock), HIGH-Finding Fix Round 1

Worktree/branch: `worktree-agent-ab7ff2ac5eda7a106`
Commit: `8883e0c9` (on top of Doer's `8b24c8a2`)

## Finding fixed

Red-Team HIGH (accepted, `docs/architect/agent-coordination/verification/group-thinking-plan-loop/P01.1.md`
"## Red-Team" + "## Coordinator Disposition (P01.1)"): a caller that
imports the exported `PROTOCOL_OPERATION_STAMP_PREFIX`
(`execution-contract.mjs`) and calls `buildAssignment` +
`executeAssignment` directly — bypassing `session-engine.mjs`'s
`dispatchDeclaredOperation`/`assertMutatingDispatchAllowed` entirely — could
self-forge the "engine-reserved" stamp (a bare `string.startsWith()` check,
never a capability) and reach a real mutating write, with R1/R2/R3 never
having run.

## Fix

Not the rejected fix (un-exporting the constant) — real re-verification at
the point of consequence:

- `src/runner/dispatch/execution-contract.mjs`: added 3 new exported, shared
  helpers — `extractProtocolOperationStamp` (parses the ONE
  `protocol-operation:<definitionId>@<version>#<operationId>` entry out of a
  contract's `constraints`, `null` on anything missing/ambiguous/malformed),
  `operationDeclaresWorkProduct` (R2 predicate), `resolveMutatingCwdPosture`
  (R3 predicate, wraps `resolveMainCheckoutRoot`/`resolveRepoRoot` from
  `../paths.mjs`, never throws itself). Module header updated to honestly
  note the new read-only git-inspection import (a narrow exception to the
  "no fs" claim).
- `src/runner/dispatch/assignment-runner.mjs`: new
  `assertInlineMutatingAssignmentAuthorized(asgn, opts)`, called from
  `validateAssignmentLegality` (i.e. inside `executeAssignment`, before any
  run directory or subprocess exists). Scoped to
  `asgn.mutation === 'mutating' && asgn.provenance?.kind === 'inline'` only
  — the exact new attack surface this cell introduced (declared-shape
  mutation is the pre-existing, unrelated, untouched
  `classifyDeclaredMutation` mechanism). Re-derives the claimed operation
  from the stamp against the REAL on-disk CoordinationProtocol
  (`loadCoordinationProtocol`, `../definitions/protocol-loader.mjs`) and
  refuses (`RunnerConfigError`) on: missing/malformed/ambiguous stamp,
  unresolvable definition id, version mismatch, unknown operation id,
  `result.kind !== 'work-product'`, or a failed `resolveMutatingCwdPosture`
  check (main-checkout / outside-git / unresolvable).
- `src/runner/coordination/session-engine.mjs`: `assertMutatingDispatchAllowed`
  refactored to call the SAME `operationDeclaresWorkProduct`/
  `resolveMutatingCwdPosture` predicates instead of re-implementing the
  logic inline — byte-identical `CoordinationError` types/messages preserved
  (verified: every pre-existing R2/R3 test, which asserts on
  `instanceof CoordinationError` + message regex, still passes unchanged).
  Removed the now-unused `resolveMainCheckoutRoot`/`resolveRepoRoot` import
  from `../paths.mjs`. The Reviewer's LOW finding (dead `try/catch` around
  `resolveMainCheckoutRoot`, which never throws) is closed as a natural side
  effect — the shared predicate has no such wrapper.
- `CHANGELOG.md`: corrected the pre-existing "a caller-forged one is still
  rejected" claim (which was NOT true before this fix) to describe the real,
  now-true dispatch-layer re-verification.
- `docs/architect/agent-coordination/verification/group-thinking-plan-loop/P01.1.md`:
  updated ONLY Proof Matrix (new row), Commands (updated regression counts
  660→665 / 659→664, new Fix Round 1 command block), and Gaps (new bullet
  documenting the fix, evidence, and scope) — Review/Red-Team/Disposition
  sections untouched (confirmed via grep before/after).

## Tests

5 new regression tests in `test/runner/coordination-mutation-unlock.test.mjs`
("Fix round: ..." / "Fix round R2: ..." / "Fix round R3: ..."), all calling
`buildAssignment` + `executeAssignment` directly (never
`dispatchDeclaredOperation`), reproducing the Red-Team's own attack shape:

1. Forged stamp naming a nonexistent definition → refused, no canary file.
2. R3-isolated: forged stamp naming a REAL definition + REAL work-product
   operation, `cwd` = main checkout → refused naming "main checkout", no
   canary.
3. R2-isolated: forged stamp naming a REAL definition but an operation
   declaring `result.kind: 'advisory'`, real linked-worktree `cwd` →
   refused naming `does not declare result.kind "work-product"`, no canary.
4. Positive control: genuinely well-formed stamp + real worktree, called
   directly (bypassing `dispatchDeclaredOperation`) → still dispatches,
   real output file written (proves the gate is not over-broad).
5. Legitimate path (`dispatchDeclaredOperation`, real `definitionRef`, real
   linked worktree) → unaffected, grades `verified`.

## Commands (real output)

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/coordination-mutation-unlock.test.mjs
ℹ tests 17
ℹ pass 17
ℹ fail 0
```

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/runner/dispatch-*.test.mjs' 'test/runner/assignment-dispatch.test.mjs' 'test/architecture.test.mjs'
ℹ tests 665
ℹ pass 664
ℹ fail 1
```
(665 = original 660 + 5 new. The 1 failure is the SAME pre-existing
`test/runner/coordination-static.test.mjs` worktree-checkout-path false
positive as before this fix — confirmed by inspecting the failure output:
every listed import path contains the literal substring `worktrees`
(`.claude/worktrees/agent-<id>/...`), unrelated to this fix's files.)

```
$ node src/runner/dispatch.mjs decide --for smoke --needs-soul --has-live-task-access
{"mechanism":"in-process","configured":false}
```

`node --check` passed clean on all 4 touched/created source files.

## Files modified

- `src/runner/dispatch/execution-contract.mjs` (+~90 lines: 3 new exports, header update)
- `src/runner/dispatch/assignment-runner.mjs` (+~75 lines: new gate function + 2 new imports + 1 call site)
- `src/runner/coordination/session-engine.mjs` (refactor `assertMutatingDispatchAllowed`, import changes, net smaller)
- `test/runner/coordination-mutation-unlock.test.mjs` (+~120 lines: 4 new imports, 1 helper, 5 new tests)
- `CHANGELOG.md` (1 line reworded for accuracy)
- `docs/architect/agent-coordination/verification/group-thinking-plan-loop/P01.1.md` (Proof Matrix row, Commands update, Gaps bullet — only these 3 sections)

## Not done (optional, per instructions)

Reviewer's LOW finding was closed as a side effect of the refactor (see
above) — no separate action needed.

## Unresolved questions

None. Both required regression commands (focused sweep, R9 smoke) pass at
the same/improved counts, and the fix directly closes the accepted HIGH
finding with reproducing tests.

Status: DONE
Summary: Re-verified R2/R3 at the dispatch layer (assignment-runner.mjs) via shared predicates in execution-contract.mjs, closing the stamp-forgery bypass; session-engine.mjs's pre-check now shares the same logic (no drift) and its LOW dead-catch is gone.
Commit: 8883e0c9
