# Review A38 - Step 4 wave 1 part 17 (step04-014)

File: src/install/coexist.mjs. Set step04-014, unpatched stratum. Verdict: ok (one Lead-judgment question). Slots reviewed: 1 of 1 (class6-l-000228, source line 3).
Pin digest matches (099cfd22d3f8...). Whole file read (the file has 82 or more lines; every path-like token checked).

- class6-l-000228: preserve, no target. Source lines 3-4: `(docs/history/install-coexistence/CONTEXT.md D2/D4/D6)`. The slot matches exactly. The preserve follows the same L12-10/38/40 treatment the records use for the other 205 `docs/history/` citations.

Missed references: none. `AGENTS.md` mentions (lines 8, 13, 29, 42-47, 65-80) are about the host project's own AGENTS.md, not a doc path of this repo.

Record-text note: the recorded reason says "preserve the external-project artifact convention or named historical implementation/decision evidence". That is accurate as a class label, but it does not say the cited path is absent.

Lead-judgment question: `docs/history/install-coexistence/CONTEXT.md` does not exist at the pin. `git ls-tree` finds nothing under `docs/history/install-coexistence/`, and `git log` on the path returns nothing. The only live mentions of that directory are `docs/coexistence.md:100` and `docs/platform/coexistence/spec.md:112`, which cite `.../reports/canary-run.md` (also absent). The wave 1 rule says a live "see X" pointer to a nonexistent path parks as a dead link. Line 3 is a decision-provenance citation (D2/D4/D6), not a "see" pointer, and the records treat all `docs/history/` citations as preserve. I treat preserve as acceptable. If the Lead wants dead-path citations parked, this edge is the case to apply it to. Not rework.

Counts: step04-014 unpatched stratum reviewed 1, rework 0.

Status: DONE
