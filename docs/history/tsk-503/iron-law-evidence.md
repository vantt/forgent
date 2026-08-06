# Iron Law evidence — tsk-503

`classifyIronLaw` (`src/evolve/iron-law.mjs`) on this item's own changed
file set (`changedFiles`, `src/runner/merge.mjs`, computed against the
committed branch diff — this branch's own diff against trunk also carries
earlier, already-committed doc work from before this item's own change,
per the branch's own history):

```json
{"required":true,"matchedFlags":["auth","schema"],"matchedModules":[]}
```

`matchedModules` is empty — this item touches only Markdown (the shared
capacity-dispatch fragment and its `.agents/` mirror), none of
`classifyIronLaw`'s `MODULE_RULES` paths. `matchedFlags` is the same kind
of known false-positive shape recorded for `tsk-2k1`
(`docs/history/tsk-2k1/iron-law-evidence.md`): the item's own description
contains "không chạm auth/data/contract công khai" (*does NOT touch
auth/data/public contract*) and references `work.tier`'s schema meaning —
the word-boundary keyword matcher has no negation awareness. Documented
here per `review-audit-self-decision.md`'s "document non-issues briefly";
`required: true` is honored mechanically regardless (D13: over-reporting
is the safe direction), so this item's own verify still gets a real
failing-before/passing-after proof below.

Verify command (this item's own, narrowed via `fgos edit` once Path B was
locked — see the item's own answer/decision history):

```
grep -q 'Provider/tier judgment for an ad-hoc dispatch' .claude/skills/_shared/capacity-dispatch-fallback.md && grep -q 'appendWorkerLog' .claude/skills/_shared/capacity-dispatch-fallback.md && node --test test/skills/fgos-mirror.test.mjs
```

## Failing before (fragment reverted to the pre-tsk-503 commit, both `.claude`/`.agents` copies)

```
grep -q 'Provider/tier judgment for an ad-hoc dispatch' .claude/skills/_shared/capacity-dispatch-fallback.md
# → no match, exit 1 (section absent)
grep -q 'appendWorkerLog' .claude/skills/_shared/capacity-dispatch-fallback.md
# → no match, exit 1 (never reached — short-circuited by the grep above anyway)
```

Both grep checks miss (exit 1) — this item's own new section and its
`appendWorkerLog` reference are genuinely absent before the change, so the
`&&`-chained verify command fails at the first clause.

## Passing after (this item's real change restored)

```
grep -q 'Provider/tier judgment for an ad-hoc dispatch' .claude/skills/_shared/capacity-dispatch-fallback.md
# → match, exit 0
grep -q 'appendWorkerLog' .claude/skills/_shared/capacity-dispatch-fallback.md
# → match, exit 0
node --test test/skills/fgos-mirror.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

All three clauses pass; `.claude/skills/_shared/` and
`.agents/skills/_shared/` stay byte-identical mirrors of each other.
