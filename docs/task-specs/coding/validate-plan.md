# task-spec: validate-plan

domain: coding | position: reviewer | reason: review

## Input
- `plan.md`, already shaped and its own gate-free.
- The real repo — every file/pattern/function the plan leans on gets read
  for real, never taken on faith.

## Output
- A reality-gate score (Mode fit / Repo fit / Assumptions / Smaller path /
  Proof surface / Impact-analysis posture), each PASS/FAIL with a
  concrete citation.
- A feasibility matrix for every medium+ risk the plan's own risk map
  named, each row backed by a file actually read, a command actually run,
  or an accepted official-doc confirmation — never "should work".
- A verdict: `READY` / `READY WITH CONSTRAINTS` / `NOT READY — RETURN TO
  PLANNING`.

## Gates
- `validateApprove` — the single gate in stage `planning`. Auto-approves
  per gate-bypass level when the hard-keyword floor is clear, the tier is
  covered, `plan.md` has no open items, and this task's own cost verdict
  is `REVERSIBLE`; otherwise asks once, presenting the stuck point, the
  attempt already made, and the specific missing input.

## Verify-template
- Every child spec's own `verify` (if the plan calls for a split) is
  proven runnable, per `normalizeChild`'s own rejection rule — never
  designed fresh here.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| A precondition the reality gate needs cannot be resolved from context in hand | consult (sync) | researcher | consult | finding |
| A trigger (T1: real option comparison, T2: locked-decision conflict, T3: unwritable spec) fires after tier A is exhausted | advise (async) | human-advisor | advise | answer, folded into plan.md |
| No trigger matches | — decide and fire the planning→executing edge — | | | |
