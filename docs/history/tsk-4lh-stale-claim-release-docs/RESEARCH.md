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

## Round 2 — 2026-08-27 (post-implement recovery)

**Asked:** the out-of-process worker's first implement pass (`fgw/tsk-4lh`
commit `502532e`) wrote the two replacement paragraphs citing `(tsk-40m
D5)` / `Under tsk-40m D5, ...`. `fgos return`'s own full-suite verify run
(the real `npm test`, 4180 tests — much larger than the worker's own
scoped local run of 37) failed one test that neither Round 1 nor the
worker's own local check surfaced: is this a real regression, and what is
the correct fix?

**Checked:**
- `test/scripts/check-decision-citation-drift.test.mjs:758` failure
  output (captured from the `fgos return` background run): flagged all
  four real copies of the two edited files (`.agents/skills/...`,
  `plugins/fgOS/skills/...` — `domains/coding/skills/...` is not scanned
  by this test, confirmed by reading the test file's own `--skills-dir`
  args at line 767-768) for citing a bare `D5` token outside a
  `CONTEXT.md`.
- `scripts/check-decision-citation-drift.mjs:42-160` (repo read): the
  `CITATION_RE` regex `\b(ADR|RUL|D)(\d{1,4})\b` matches ANY bare
  `D<digits>` token regardless of prefix text on the same line —
  `(tsk-40m D5)` still matches on `D5` alone. `findCitationFormatFindings`
  flags every such match outside a file whose path ends `/CONTEXT.md`,
  message: "decision 0017 -- inline the content, delete the id". This is
  a real, pre-existing repo-wide lint this item's own plan/verify never
  accounted for — not a false positive.

**Found:** the fix decision 0017 itself names is exactly right for this
case: the D5 fact was already fully inlined in prose (both paragraphs
already explain the tsk-40m retirement in plain English); the bare `D5`
citation was redundant on top of that inlining, not load-bearing. Fix:
drop the literal `D5` token, keep the item id `tsk-40m` (not itself a
bare `D<digits>` token, so it doesn't trip the regex) as plain
attribution. Re-ran `node scripts/check-decision-citation-drift.mjs
--skills-dir .agents/skills --skills-dir plugins/fgOS/skills` directly
after the fix (commit `ca107ac3`): `no new findings (225 baselined)`.
Also updated the item's own `verify` field (`grep -q 'tsk-40m D5'` →
`grep -q 'tsk-40m'`, plus an added `! rg ... '\b(ADR|RUL|D)[0-9]{1,4}\b'`
regression guard on the four real mirror files) so this exact class of
break re-triggers verify red if it recurs, rather than only surfacing at
`fgos return`'s own full-suite run.

**Still open:** none.
