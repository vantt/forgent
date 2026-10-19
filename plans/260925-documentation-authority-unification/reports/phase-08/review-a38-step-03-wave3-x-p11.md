# Wave 3 expansion review, Part 11 (batch-065, stratum full-set-expansion)

Pin: ae141550c2e022310de7a0efea757580c0b2479f (consumers and targets read with `git show` at the pin; worktree at 5a4ca0621, read-only). No checker or probe was run. Each record was loaded with python3 and every edge field, the diff, the legacy-scan candidates and authorAddedEdgeIds were printed. Every file was read whole (all under 7 KB).

## Per-file verdicts

| File | Edges reviewed | Verdict |
|---|---:|---|
| docs/explanation/iron-law-classification-recipe-path.md | 1 | ok |
| docs/explanation/list-id-callthreads-leak-fix.md | 0 | ok |
| docs/explanation/list-id-fields-flag-lightweight-projection.md | 1 | ok |
| docs/explanation/lock-wait-self-vs-other-holder-identity.md | 1 | ok |

### Edges
- **maps-j-03897**, source L54 `[tsk-3ys](worker-prompt-iron-law-evidence-timing.md)`: preserve, no diff. The sibling `docs/explanation/worker-prompt-iron-law-evidence-timing.md` exists at the pin. It is a Related bullet in a dated explanation, a retained history file class. The doc-registry has only a topic entry for it, with no move or alias, and the alias table is empty. Preserving is correct and the adjacent description is unaffected.
- **maps-j-03898**, source L17 `[tsk-5dnt](list-id-callthreads-leak-fix.md)`: preserve. The sibling exists at the pin, there is no registry move and no alias. Correct.
- **maps-j-03899**, source L87 `[tsk-2qp](approve-lock-lost-mid-merge-guard.md)`: preserve. The sibling exists at the pin. Correct.
- `list-id-callthreads-leak-fix.md`: 0 edges and an empty diff are correct. The file has no link to docs/specs, docs/architect, `specs/<x>.md` or `architect/<x>.md`, and no Markdown link at all. Its `bin/fgos.mjs`, `.agents/skills`, `src/...` and `SKILL.md` mentions are code or skill coordinates, which L12-38(5) exempts.

### Missed-reference check
I grepped all four sources for `docs/specs`, `docs/architect`, `specs/*.md`, `architect/` and any `.md` mention. The only `.md` hits are the three preserved sibling links, `domains/coding/skills/.../verify-commit-and-iron-law.md` (L8 and L50 of the iron-law file, a code-tree skill reference, not a retiring doc tree) and `fgos-coding-discovering/SKILL.md` (a skill coordinate). The bare "ADR0020" in the iron-law file has no path and is not an edge (L12-38(7)). The checker-computed legacy scan shows 0 candidates for all four files, matching my grep. No missed references.

## Outcome defects
None.

## Record-text notes (not rework)
- The preserve reason cites "L12-26(3,5), L12-31, L12-37". Those are broader than needed for a plain retained sibling link, but the stated facts (path exists at the pin, retained path stays literal) are true.
- The unitId prefix differs between files (`item-L54`, `item-L17`, `line-L87`). The cause is the list-item versus plain-line unit shape, which is advisory only.

## Lead-judgment questions
None.

## Counts
- Set batch-065, stratum full-set-expansion, Part 11: reviewed 4 files / 3 edges, rework 0.
- No batch-037, 038, 041 or 061 files are in this part.
- Overlap with other strata: none from this part.
- This part adds 4 reviewed files to the batch-065 reviewed denominator; its rework numerator contribution is 0.
- No repair, no checker run, no acceptance claimed.
