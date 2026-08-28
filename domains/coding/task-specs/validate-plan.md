# task-spec: validate-plan

domain: coding | role: reviewer | reason: review | requires-skill: fgos-coding-validating

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
| A precondition the reality gate needs cannot be resolved from context in hand (tier A's `fgos-researching` dispatch) | consult (sync) | researcher | consult | finding |
| No trigger matches | — write verdict artifacts (`agent-result.json` & `agent-report.md`) to runDir — | | | |

**No `advise` call from this task, even when a trigger (T1/T2/T3) fires.**
The Gate's own "ask a person" branch has no `fgos ask`/`fgos answer`
anywhere in it — every question is live, in-session, resolved the same
turn via `fgos gate-approve --actor human`, never a real async park.
`role: reviewer` is the roleGraph reviewer role for this operation in stage `planning`, dispatched via Assignment.
When dispatched as a reviewer Assignment, the reviewer MUST ONLY write verdict artifacts (`agent-result.json` and `agent-report.md`) to `<runDir>/`. The reviewer MUST NOT call `fgos plan` or fire Work lifecycle edges directly; the driver evaluates the verdict artifacts and executes the lifecycle movement. When executing via the direct compatibility mode (non-Assignment path), the skill fires the planning→executing engine verb directly.
