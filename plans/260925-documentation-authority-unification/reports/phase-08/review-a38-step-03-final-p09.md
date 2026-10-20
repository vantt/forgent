# Review a38 step-03 final, part p09

Pin ae141550c, worktree d75e10774. Record: batch-115.jsonl. Resolve script not needed. No checker or probe run.

## docs/platform/runner/subcomponents/h-6979005beaf7/spec.md

- Set: batch-115, targeted (named A/B record-text / coverage correction). Stratum: targeted.
- Verdict: **ok**
- Edges reviewed: 17 of 17 (16 inventory edges plus the author-added L23C302). Source read in full: 201 lines, 181 KB, with every edge line read whole (L10, 18, 23, 46, 59, 67, 68, 72, 94, 99, 110, 166). The full diff was recomputed at character level. It contains exactly 4 replacements, matching the 4 patch edges, and nothing else changes.

### Per-edge
| edge | line | disposition | verdict |
|---|---|---|---|
| 07718 | 10 | preserve (Provenance line) | ok (L12-47) |
| 07719 | 18 | patch, Phase 9, `docs/platform/runner/spec.md` | ok. Live wrapper Related list; the file has no carriage H1 (L12-52(2)); the target exists at the pin and is not a self-pointer. |
| 07720 | 46 | preserve | ok. The citation reads "xem forgent workshop `docs/history/str63-.../CONTEXT.md`", an external-repo provenance citation. The path never existed (L12-51(1)). See record-text note 1. |
| 07721 | 59 | preserve (retained root, exists) | ok |
| 07722 | 67 | preserve (retained root, exists) | ok |
| 07723 | 67 | preserve (`docs/history/<id>/...` illustrative pattern) | ok |
| 07724 | 67 | patch to knowledge holder, anchor `why-evidence-only-not-gather-evidence-and-if-it-looks-good-merge` | ok. The slug matches the heading at target L33. The cited claim (a second independent party actually looks at the evidence) is stated in target L45-48. The diff appends the anchor correctly. |
| 07725 | 68 | parked, description-rewrite | ok. RUL64 says the `gateBypass` floor is "never touching Iron Law". The renamed holder (`why-gate-bypass-is-shaped-the-way-it-is/gate-bypass-design.md` L72-98) only says the floor reuses `HEAVY_KEYWORDS`, which Iron Law also uses, and that the floor never bends. It does not state the `ironLaw.level`-vs-`gateBypass` prohibition (L12-32(3)). |
| 07726 | 68 | preserve (retained root, exists) | ok |
| 07727 | 72 | preserve (`docs/operator-runbook-herdr-cockpit.md`, retained, exists) | ok |
| 07728 | 72 | patch to `docs/platform/agent-coordination/decisions/ADR-011-...md` | ok. The target exists. It states the result file as receipt, herdr as transport, `unknown` never becoming `absent`, and the seven outcome names. The diff keeps the trailing period. |
| 07729 | 72 | preserve (re-scope rationale and evidence, dated 2026-09-06) | ok (L12-35(3), L12-40, L12-51(1)); the successor note is present. |
| 07730 | 94 | preserve (retained root, exists) | ok |
| 07731 | 99 | parked, step5-parity | ok. The citation is a present-tense navigation pointer to old confinement-authority §13.1 (credential provisioning). That content moved to history, so no citation-only redirect applies (L12-26 class 1). |
| 07732 | 110 | patch, anchor `the-curated-runnercapabilities-catalog-d4d14-tsk-in1-3` | ok. The slug matches the heading at target L48. The catalog section defines `runner.capabilities`, aliases, and shared validation of `capability` and `for`. |
| 07733 | 166 | preserve ("already said", past tense, with successor note `confinement-authority-v1.md`) | ok (L12-53) |
| author-wave5g-...-L23C302 | 23 | preserve (`runner.md:<line>` locator inside the "Added in candidate" framing) | ok. This is the added coverage edge. The scan shows exactly one candidate and it is accounted for. |

### OUTCOME defects
None.

### Missed-reference check
- I grepped the source for every docs/, plans/, core/, src/ and bare `*.md` path token. Every legacy-root path (`docs/specs`, `docs/architect`, `docs/explanation`, `docs/reference`, `docs/history`, `docs/operator-runbook`) has an edge.
- The remaining non-edge tokens are not legacy-root references. They are `plans/260916-account-rotator/design.md` (L133), the plans/ council and phase paths (L177), `docs/platform/holder-lock/spec.md` (L196), and code paths.
- Pathless "spec Work-State ..." locators and "Data Dictionary #n" go to the Phase 9 remnant search (L12-53 carried note). Bare "ADR0013" and "ADR-007" ids are not edges (L12-49).

### Record-text notes (not rework)
1. The 07720 reason cites "illustrative source convention" and "never existed in author-pin ancestry". The actual passage is an explicit external "forgent workshop" provenance citation (L12-51(1)). The outcome is correct; the wording could say so.
2. 07733 keeps the "tree retires at Phase 9" suffix. That is correct because `docs/specs/**` retires.

### Lead-judgment questions
None.

## Counts
- batch-115, targeted stratum: 1 file reviewed, 0 rework; 17 edges reviewed (16 inventory edges plus 1 added), 0 outcome defects.
- Dispositions: 4 patch, 11 preserve, 2 parked, 0 row-flip.

Status: DONE
Summary: The single p09 file (batch-115 h-6979005beaf7/spec.md) is ok. All 17 edges and the 4-replacement diff check out against the source, targets, anchors and L12-26..L12-54, with no outcome defects.
