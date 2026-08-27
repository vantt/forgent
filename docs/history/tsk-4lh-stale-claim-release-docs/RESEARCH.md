# Research — tsk-4lh

## Round 1 — 2026-08-27

**Asked:** does `fgos-coding-validating/SKILL.md` still document the retired
`releaseClaimOnExecuting` behavior as current fact, is `src/intake/plan.mjs`
really a no-op stub confirming tsk-40m D5, and does
`fgos-coding-implement/SKILL.md` (or anything it points at) make the same
stale assumption?

**Checked:**
- `.agents/skills/fgos-coding-validating/SKILL.md:192-201` (repo read)
- `src/intake/plan.mjs:520-537` (repo read)
- `.agents/skills/fgos-coding-implement/SKILL.md` (repo read, `grep -n -i
  "claim"`)
- `.agents/skills/fgos-coding-implement/references/worker-contract-and-orient.md`
  (repo read, `grep -n -i "release.*claim"`)
- `src/runner/worktree.mjs:1045-1067` (repo read) — the doc-comment the
  item's description already points at as the correct, up-to-date model

**Found:**
- `fgos-coding-validating/SKILL.md:192-201` still reads exactly as the item
  describes: "The `fgos plan` call also releases the item's claim back to
  `todo` the moment the item reaches `executing` — this is expected and
  correct", and tells a hand-driving session it "must re-read the item's
  live status itself and re-claim before calling `fgos-coding-implement`
  directly." Confirmed stale as of this read.
- `src/intake/plan.mjs:534-537`: `releaseClaimOnExecuting` is `() => {}`,
  with a comment citing tsk-40m D5 explicitly ("Items at stage planning no
  longer hold durable status doing, so the planning->executing edge no
  longer needs to release a durable doing status back to todo."). Confirms
  the item's claim (D5 retirement) is real and current.
- `fgos-coding-implement/SKILL.md` itself (the top-level file) does NOT
  carry the stale assumption — Step 1/Orient text there is neutral ("Re-check
  live claim status if this session did not arrive via
  `fgos-coding-driving`").
- **New finding beyond the item's own scope:** the stale assumption
  actually lives in `fgos-coding-implement/references/worker-contract-and-
  orient.md:12-23` ("Re-check claim status on a non-driven entry"), not in
  `SKILL.md` itself. That reference file repeats the same retired claim:
  "the `planning`→`executing` edge releases the claim back to `todo`, so the
  claim may already be released... If `status` reads `todo`, re-claim
  (`fgos pick <id>`) before Implementing." This needs the same D5 update as
  `fgos-coding-validating/SKILL.md`.
- `src/runner/worktree.mjs:1054-1060` is confirmed as the correct model:
  states both the pre-tsk-40m behavior and the D5 retirement in one place —
  the pattern the two stale docs should be updated to match.

**Still open:** none — both stale locations identified, both confirmed
against live source, correct replacement wording available as a template
(`src/runner/worktree.mjs:1054-1060`).
