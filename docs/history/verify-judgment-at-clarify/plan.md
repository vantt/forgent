# Plan: tsk-4m4 (narrowed) — check `planApproveVerify` before it reaches `executing`

Mode: **standard** (direct-entry fallback, no `fgos-routing` Orient
hand-off). Flags: "existing covered behavior" (`resolvePlan` has heavy
existing test coverage) + "weak proof around the area" (event-sourced
stage-move logic, same class of subtlety as tsk-14a/tsk-280's own fixes
in this file/`bin/fgos.mjs`) → 2 flags → standard.

`CONTEXT.md` locked D1 (`docs/history/verify-judgment-at-clarify/
CONTEXT.md`): scope is narrowed to the "known adjacent hole" only.

## Approach

**Confirmed (this session's own direct reading of `src/intake/plan.mjs`,
current on `fgw/tsk-4m4`, branched from the same `main` tsk-14a's own fix
has not yet merged into).** `planApproveVerify` (`plan.mjs:543`) is
computed once and reused, unchecked, at **four** separate `moveStage`
call sites — not the one the item's original description named:

1. `plan.mjs:545` — the `hasChildren` crash-recovery re-entrancy branch
   (children already exist from an interrupted prior call; only the
   root's own stage-move remains).
2. `plan.mjs:603` — the tiny/small skip-and-advance trust signal (no
   `callerVerdict`, `plan.md` declares `Mode: tiny|small`).
3. `plan.mjs:734` — the explicit `--verdict pass-through` branch (the one
   the original CONTEXT.md's "known adjacent hole" paragraph named).
4. `plan.mjs:878` — the real `--verdict decompose` (split) success path:
   even when children ARE created with their own forced-real verify
   (`normalizeChild`), the ROOT's own move to `executing` still carries
   the same unchecked `planApproveVerify`.

All four are gated by the identical value, computed once — so the
correct, minimal fix is **one check, run once, immediately after
`planApproveVerify` is computed**, before any of the four branches below
it execute. This mirrors `resolveDiscovery`'s own dispute-handling shape
(`discovery.mjs:402-451`) and this same file's own existing per-child
check (`plan.mjs:748-777`, the `disputedChild` pattern for the
`decompose` verdict's own children) — same mechanical
`judgeVerifySemanticCorrectness` (`verify-pattern-check.mjs`, already
imported in `plan.mjs:30`), same park-on-disagreement via `putInAwaiting`,
same `callerVerdict?.force === true` override (already threaded into
`resolvePlan`'s own signature) except when the disagreement is mechanical
(`secondPass.mechanical === true`, `tsk-12t D6`'s own carve-out, already
precedented at `plan.mjs:769`).

**Why this is safe to place before ALL four branches, including the
crash-recovery one.** The `hasChildren` branch existing today means an
item can already be mid-flight with real children — parking it now on a
verify dispute it was never checked against before is strictly safer
than the current silent pass-through, and costs nothing extra: a person
resuming a crash-recovered item is exactly the audience this check exists
to reach.

**Proof point.** `impact-analysis: full` (per `CONTEXT.md`'s own
Environment note — `gitnexus` `present`, index staleness noted and
cross-checked directly against source per this session's own reads
above, not trusted blind). `impact({target: "resolvePlan", direction:
"upstream"})` required before editing — deferred to Implement.

**Smaller path considered:** checking only the one call site (734) the
original CONTEXT.md named, leaving the other three unchecked. Rejected:
all four share the identical unchecked value: fixing one and leaving
three open would be an incomplete, misleading fix under the same title
("check planApproveVerify") — the four-line, single-check placement
costs nothing extra over a one-site fix and closes the hole completely.

## Shape

One piece, pass-through (no split — this is one cohesive check added at
one point in one function). File touched: `src/intake/plan.mjs`.

```js
// after: const planApproveVerify = view.gates?.[id]?.planApprove?.verify ?? work.verify;
const planVerifyDispute = judgeVerifySemanticCorrectness(planApproveVerify);
if (!planVerifyDispute.agrees) {
  if (callerVerdict?.force === true && planVerifyDispute.mechanical !== true) {
    addDecision(dir, {
      id,
      text: `plan --force overrode a disputed planApproveVerify: "${planApproveVerify}"`,
      source: 'resolvePlan',
      kind: 'engine',
      rationale: `second pass disagreed: ${planVerifyDispute.reason}`,
    });
  } else {
    if (work.status === 'awaiting-human') {
      throw new StoreError(
        'validation',
        `plan --force: work "${id}" is already "awaiting-human" -- run "fgos answer ${id} --text ..." to resume it before retrying --force.`,
      );
    }
    const ask =
      `Verify hiện tại của item (sẽ được stamp lúc sang executing) bị nghi ngờ ở vòng kiểm tra thứ hai: ${planVerifyDispute.reason}\n` +
      `Verify: ${planApproveVerify}`;
    putInAwaiting(dir, { id, ask, statusAtAsk: work.status });
    return { outcome: 'verify-disputed', id, secondPass: planVerifyDispute };
  }
}
```

### Cases this needs to hold for

- A pass-through item whose `planApproveVerify` is a real, undisputed
  command — unaffected, all four branches proceed exactly as before.
- A pass-through item whose `planApproveVerify` matches the one
  documented mechanical trap (`verify-pattern-check.mjs`'s Node
  `--test`/TAP-reporter grep pattern) — parks in `awaiting-human`,
  `outcome: 'verify-disputed'`, same as `resolveDiscovery`'s own
  equivalent case.
- The same dispute with `--force` (and `secondPass.mechanical` false) —
  proceeds, logs the override decision. With `secondPass.mechanical ===
  true` — `--force` does NOT override (T3/D6 precedent already
  established at `plan.mjs:769` for the child-dispute case).
- The `hasChildren` crash-recovery branch on a disputed value — now also
  parks, where it previously silently proceeded (the actual gap this
  item closes).
- The real `decompose` (split) success path (case 4) — the check runs
  before children are ever created, so a disputed `planApproveVerify`
  parks the WHOLE verdict (no children written), same fail-safe stance
  the existing heavy-risk gate and `disputedChild` check already take for
  this same edge.
- An item already `awaiting-human` when `--force` is retried — refuses
  with the same wording the existing child-dispute `--force` guard uses
  (`plan.mjs:769-774`), pointing at `fgos answer`.

## Verify

```bash
npm test
```

Regression floor plus new unit coverage (`test/intake/plan.test.mjs` or
wherever `resolvePlan`'s own existing tests live — located at Implement)
for: dispute parks with `outcome: 'verify-disputed'`; `--force` overrides
a non-mechanical dispute; `--force` does NOT override a mechanical one;
an undisputed verify is unaffected on all four branches.

## Assumptions

None beyond what this session's own direct file reads already confirmed
with line citations above.

## Outstanding questions

None
