# Reality gate — tsk-4gr (fgos-coding-validating)

## Reality gate (Step 2)

| Dimension | Result | Citation |
|---|---|---|
| Mode fit | PASS | `high-risk` lane (audit/security hard-gate flag) matches plan.md's fuller risk-map/proof-point shape; not over-built (single file, no split) or under-built (proof points, bounded-risk analysis present). |
| Repo fit | PASS | Direct read confirms every path plan.md leans on: `src/state/gate-bypass.mjs:147-155` (`canAutoApprove`), `:184-202` (`mergedGateHaystack`), `test/state/gate-bypass.test.mjs` exists (`find test -iname "*gate-bypass*"`). |
| Assumptions | PASS | See Feasibility matrix below for the one medium-risk assumption; all others (module boundaries, no split needed) are proven by the same direct reads. |
| Smaller path | PASS | Alternatives considered and rejected in plan.md's Approach (second keyword list, negation-awareness, fixing inside `matchesKeyword`) are all *larger*, not smaller, than the chosen private-helper-in-gate-bypass.mjs path — no smaller honest path found. |
| Proof surface | PASS | Single piece, real runnable verify already synced onto the item: `npm test && node --test test/state/gate-bypass.test.mjs`. |
| Impact-analysis posture | PASS | Re-queried fresh (`fgos tool query --capability impact-analysis --status present`): GitNexus `present` at repo level, still no indexed entry for this exact worktree (`list_repos` unchanged since planning). Matches plan.md's recorded `degraded` posture — no drift. |

## Feasibility matrix (Step 3)

| Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| Gaming the citation exemption in `canAutoApprove` (e.g. a fake `payment.mjs`-shaped token) is bounded to skipping one non-final approval step, because `canAutoApproveMergedGate`'s structured axis can't be faked the same way | medium | Read `mergedGateHaystack`'s structured inputs and confirm they are not free-text-derived | Direct read, `src/state/gate-bypass.mjs:184-202`: `footprint` comes from `item.footprint` (real changed-file paths recorded on the item, not authored prose); child `title`/`verify`/`action` come from plan.md's own materialized child specs, which THIS SAME Gate validates separately before creating them via `--verdict decompose`. Neither is a string an author can casually dress up as a "citation" the way a description sentence can. | PASS — evidence supports plan.md's bounded-risk claim, not plausibility language |

## Decide (Step 4)

**READY WITH CONSTRAINTS.**

Constraint: this is a change to the security-relevant hard-gate floor
itself (audit/security flag, per the Mode gate) — the bounded-risk
argument above is grounded in a direct code read, not a live blast-radius
tool run (impact-analysis posture is `degraded` for this worktree).
`fgos-coding-implement` must (a) add the code comment plan.md's Shape
section already requires, documenting point (2)/negation-blindness as
permanent, deliberate limitations, and (b) re-run `rg -- "title.*description\|description.*title"
src/state/gate-bypass.mjs` (or equivalent) immediately before landing, to
confirm no third call site of the raw title+description haystack pattern
was missed by this session's two independent scout passes.
