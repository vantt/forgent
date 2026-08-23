# Iron Law evidence: tsk-1lv round-2 review-fix (B2/B3/H1/H2/M1/L1) + re-merge

A second independent review round found 3 blocking regressions in the
round-1 fixes themselves (B2, B3, and a re-drift against `main`, B1) plus
2 high-severity gaps (H1, H2) and a judgment call (M1), all fixed in commit
`cc91029a`, followed by re-merging `main` (`ce99bc26`, resolving B1).

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against `cc91029a`'s own
diff:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs"
  ]
}
```

## Which matched module is this commit's own diff

`bin/fgos.mjs` carries B2's real fix (`context-render`'s row-detection
regex, anchored on the actual `|---|` separator row instead of a
positional `slice(2)`) and M1's real fix (`quadrantExists` on
`authoritative-match`'s response). Confirmed via
`git diff cc91029a~1..cc91029a -- bin/fgos.mjs`.

## Verify command

```
node --test test/report/context-render.test.mjs test/report/authoritative-match.test.mjs
```

## Failing-before / passing-after transcript

**Before** (real transcript: checked out `91fdceb6`'s `bin/fgos.mjs` — the
last commit of round 1, immediately preceding this round's fix commit —
with this round's own new/changed regression tests already present):

```
$ git checkout 91fdceb6 -- bin/fgos.mjs
$ node --test test/report/context-render.test.mjs test/report/authoritative-match.test.mjs

ℹ tests 45
ℹ pass 42
ℹ fail 3

✖ failing tests:
✖ CLI: authoritative-match on a quadrant dir that does not exist yet returns match:null, quadrantExists:false, never an error -- M1 tsk-1lv round-2: ...
✖ CLI: authoritative-match reports quadrantExists:true when the quadrant dir is real, even with zero matching docs
✖ CLI: context-render on an item with ZERO logged decisions is idempotent across repeated calls -- B2 tsk-1lv round-2 regression: ...
```

**After** (real transcript, current file restored):

```
$ git checkout HEAD -- bin/fgos.mjs
$ node --test test/report/context-render.test.mjs test/report/authoritative-match.test.mjs

ℹ tests 45
ℹ pass 45
ℹ fail 0
```

## B3/H2 (`src/setup/registrations.mjs`) — not Iron-Law-matched, real transcript anyway

`src/setup/registrations.mjs` is not on `MODULE_RULES`' watch list, so it
does not gate the merge, but both fixes are proven for real:

```
$ node --test test/setup/checks.test.mjs
ℹ tests 107
ℹ pass 107
ℹ fail 0
```

Two of those 107 are this round's new regression tests (`decision-index-
stale check FAILS when the index is missing but state.decisions has real
rows...` for H2, and `decision-index-stale fix reports a graceful skip...`
for B3) — both directly reproduce the failure mode round 2 described
(false "nothing to check" on real drift; an uncaught throw aborting
`doctor --fix`) and assert the fixed behavior.

## B1 — re-merged `main`, verified clean

`main` had drifted 22 commits ahead again since the previous merge
(`c377b2fe`), including a real semantics change to
`findNewFindings` (membership check → per-occurrence count consumption,
`tsk-6at`) and a skill-wrapper D-local-citation cleanup (`tsk-352f`) that
overlapped this branch's own `.agents/skills/*/SKILL.md` edits. Re-merged
(`ce99bc26`'s parent merge commit) with **zero conflicts** this time
(`git merge main --no-edit` — "Auto-merging" only, no `CONFLICT` lines).

Verified, not assumed:
- `node --test test/scripts/check-decision-citation-drift.test.mjs` — 2
  findings surfaced from `docs/specs/distribution.md`'s lines 48/49 (the
  same lines round-1's L1 fix had already baselined once, invalidated
  again because L1's own round-2 edit changed their content a second
  time) — regenerated the baseline (`ce99bc26`), re-ran: 30/30 pass.
- `npm run build:skills` produces **no diff** against the merged tree —
  the wrapper regeneration main's `tsk-352f` needed is already
  byte-identical to what's committed.
- `node --test test/skills/fgos-mirror.test.mjs test/setup/skill-wrappers.test.mjs`
  — 27/27 + wrapper tests all pass.

## Full suite

```
$ npm test
ℹ tests 3623
ℹ pass 3618
ℹ fail 0
ℹ skipped 5
```

Clean — the 5 skips are the pre-existing bee-coexistence canaries that
only run in the main checkout (per round-2's own caveat); this evidence
was produced from a linked worktree, consistent with every prior sibling
in this feature.
