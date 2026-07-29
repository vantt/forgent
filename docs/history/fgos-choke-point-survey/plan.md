# Plan: fgOS choke-point survey (tsk-1ab)

## Mode

**standard** (2 flags).

| Flag | Applies? | Why |
|---|---|---|
| auth | no | |
| authorization | no | |
| data model | no | reads `.fgos/state.json` structure, does not change it |
| audit/security | no | |
| external systems | no | |
| public contracts | no | no CLI/skill contract changes — read-only survey |
| cross-platform | no | |
| existing covered behavior | no | no code changed, nothing to regress |
| weak proof around the area | **yes** | deliverable is a judgment-based audit (code reading + reasoning), not something a test suite already exercises — the eventual `verify` command can only check the artifact's *shape*, not the *correctness* of each claimed duplication |
| multi-domain | **yes** | spans `bin/fgos.mjs` (CLI verbs), `src/runner/*.mjs` (loop/claim-port/worktree/merge), `src/intake/*.mjs` (discovery/classify), and `plugins/fgOS/skills/*/SKILL.md` (skill-side call sites) |

2 flags, no hard-gate flag (auth/data-loss/audit-security/external-provider/
removing-a-validation), not a single yes/no spike question → **standard**,
not high-risk: nothing here writes state or changes running behavior: it
only reads and documents.

`fgos graph --what-if tsk-1ab --json` → `unblocksTransitive: 0`, no
`newlyReady` items. Confirms this is a standalone leaf — no ordering
dependency against other open work, no split forced by the graph.

## Approach

Chosen path: one session walks the four seed candidates from
`CONTEXT.md`'s feature boundary (D3: non-exhaustive) plus actively greps
for more, confirms each by reading every call site (not just its
signature), then writes one `docs/decisions/` record per D1/D4 shape
(single flat ranked table, risk DESC then call-frequency DESC).

Rejected alternative: reuse tsk-53f's existing
`plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md`
verbatim for the worktree candidate and only investigate the other three.
Rejected per **D2** (locked in `CONTEXT.md`) — the survey re-verifies
worktree fresh, consistent with treating every candidate the same way.

### Candidates to confirm (starting set, per D3 — not a ceiling)

| Candidate | Where the divergence is suspected | Call sites to read |
|---|---|---|
| Claim + worktree isolation | `take`/`pick` (CLI) vs runner `claimItem`/dispatch | `bin/fgos.mjs` (`take`, `pick`), `src/runner/claim-port.mjs`, `src/runner/loop.mjs` |
| `createWorktree` invocation | baseRef selection, ephemeral vs persistent, cleanup-on-error | `src/runner/claim-port.mjs:170`, `src/runner/loop.mjs:398,679,681`, `bin/fgos.mjs` (pick/approve/review) |
| Lock acquisition per verb | which verbs take `main-checkout-lock.mjs`, which don't | `src/runner/main-checkout-lock.mjs` (defined), grep its two exports across `bin/fgos.mjs` + `src/runner/*.mjs` |
| Verify run + timeout | how each caller shells out to the item's `verify` command and enforces a timeout | `bin/fgos.mjs` (`return`, `approve`), `src/runner/loop.mjs` (auto-verify path) |
| `docType`/`docsRef` validation | whether format/existence checks are duplicated per caller (`edit`, `discover`, `compound`) | `bin/fgos.mjs` (`edit`, `add`, `compound`), `src/intake/*.mjs` |
| Working-tree cleanliness check | tsk-63j D1 already found 2 independent implementations (`return`'s `isWorkingTreeClean` vs `approve`'s `isMainTreeClean`) — confirm as a 6th candidate, cite tsk-63j rather than re-deriving | `bin/fgos.mjs:1382`, `bin/fgos.mjs:1668`/`src/runner/merge.mjs` |
| *(open)* | anything else surfaced by the active search this item's D3 requires | grep sweep over `src/runner/*.mjs`, `src/intake/*.mjs`, `bin/fgos.mjs` for repeated shapes: multiple functions doing the same shell-out, the same field-presence check, or the same error-classification switch |

### Risk map

| Component | How risky | What proves it |
|---|---|---|
| False-positive duplication (looks similar, isn't) | medium — inflates the ranked list with non-issues | per-candidate confirmation reads every call site's actual logic, not just its name/shape (per item description's own requirement (2)) — cite the specific lines that diverge, or mark "not a real duplicate" and drop it |
| Missed candidate (real duplication not found) | medium — survey undercounts | D3's active-search step is not scoped to the 6 seeds above; the artifact must show evidence of a repo-wide sweep (grep sweep row above), not just the seed list confirmed |
| Ranking criteria disagreement after the fact | low — D4 already locks single flat table, risk-then-frequency | cite D4 in the artifact; no new criteria introduced silently |

## Shape (standard — phased)

1. **Confirm seeds.** For each of the 6 candidates above, read every listed
   call site and record: does it actually reimplement the same decision
   logic (not just superficially resemble it), and where the divergence
   is (file:line pairs, not paraphrase).
2. **Active sweep.** Beyond the seeds, grep `src/runner/*.mjs`,
   `src/intake/*.mjs`, `bin/fgos.mjs` for other repeated shapes (same
   shell-out pattern, same field-presence check, same error-classification
   switch) that aren't already one of the 6. Add any that pass the same
   confirmation bar as step 1.
3. **Rank.** Build the single flat table (D4): risk-of-behavior-divergence
   DESC, call-frequency DESC tiebreak. Risk = does divergence produce
   silently wrong state (e.g. two sessions claiming the same item) vs.
   cosmetic; frequency = how many call sites/how often each path runs.
4. **Write the artifact.** `docs/decisions/NNNN-fgos-choke-point-survey.md`
   (next free decision number) — the candidates table, per-candidate
   confirmation evidence, the ranked table, and an explicit "no fixes
   applied here" statement per the item's own description (4).
5. **Verify.** A mechanical check (node script or grep) asserting the
   decision doc exists and contains the required sections: a candidates
   table, per-candidate call-site citations, and the single ranked table
   — proving the artifact's shape without claiming to prove each
   duplication judgment call, which per the risk map stays a human-read
   check.

## Split decision

No split. `fgos graph --what-if tsk-1ab --json` shows no downstream item
depends on this one (`unblocksTransitive: 0`), and the item's own
description already draws the line: this item produces the list +
ranking only; each fix becomes its own item **later**, the same way
tsk-53f's finding did — that future submission is out of scope for this
item's own execution, not a child to create now. One honest piece of
work, proceeds as itself.

## Execution

Per the locked convention, Execute and `return`'s own re-verify already
have a working mechanical path — this plan only names the one verify
command for `executing` to run:

```
node scripts/verify-decision-doc.mjs docs/decisions/NNNN-fgos-choke-point-survey.md
```

(exact decision-doc number and verify script path finalized at
`executing` time, once the doc is written and the next free decision
number is known — named here as the shape, not a placeholder for the
plan's own gate).
