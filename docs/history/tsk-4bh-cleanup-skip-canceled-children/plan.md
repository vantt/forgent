# plan: tsk-4bh — checkMergeStillResolves skips canceled/wontfix children

Mode: standard

Flag count/lane: 1 explicit flag (existing covered behavior —
`test/state/cleanup-harness.test.mjs` and `frontier.test.mjs` both carry
extensive real suites for the exact functions touched). No hard-gate flag —
item's own `tier`/`risk` (`standard`/`standard`) match the report's
"severity: medium". Standard lane.

Direct-entry fallback: entered `planning` straight from a `clear` discovery
verdict — no `CONTEXT.md`/exploring round exists. `RESEARCH.md` round 1
stands in for it.

## Impact-analysis posture

Same as every sibling item this session: gitnexus `present` but 172 commits
behind HEAD — **degraded**. Not leaned on for this item: `isResolvedStatus`'s
own real callers were confirmed by direct `grep`/read
(`claim-port.mjs:167-175`, plus GitNexus's own call-graph flow listing —
`countStageEntry`, `claimWork`, `checkWorkClassificationVocabulary` — cross-
checked and consistent, no discrepancy this round), and the refactor's
byte-identical-behavior claim was verified empirically (full existing
`frontier.test.mjs` suite reruns unchanged), not via blast-radius tooling.

## Approach

**The report's own "Suggested direction" needed a correction to implement
safely** (RESEARCH.md round 1): "reuse `isResolvedStatus`'s canceled
branch" does NOT mean calling `isResolvedStatus` wholesale — that function
returns true for BOTH a successfully-resolved status (`done`/`delivered`/
etc, which this check must still verify) AND a canceled one (which it must
skip) — conflating them would silently stop checking legitimately-merged
children too, defeating the diagnostic's whole purpose. The correct reading
is the canceled HALF of that function's own two-part logic.

**The fix, two small pieces:**

1. `src/state/frontier.mjs`: extract `isCanceledStatus(item)` as its own
   exported function — the canceled-only branch of `isResolvedStatus`'s
   existing logic (never true for a tail-resolved status). Refactor
   `isResolvedStatus` to call it: `TAIL_RESOLVED_STATUSES.has(status) ||
   isCanceledStatus(item)`. Byte-identical external behavior, confirmed by
   rerunning the full existing suite unchanged.

2. `src/state/cleanup-harness.mjs`: `checkMergeStillResolves`'s
   children-collection filter (`Object.entries(view.work ?? {}).filter(...)`)
   now also excludes `isCanceledStatus(item)` children, BEFORE either the
   `children.length > 0` branch or `checkChildrenResolve` ever sees them —
   a canceled child is never even passed to the recursive check, not
   filtered out inside it.

**Edge case named, not fixed (out of this item's scope):** a decomposed
root whose children are ALL canceled falls through to the same leaf-shaped
ancestry check on its own recorded sha a genuinely childless decomposed
item already gets — a pre-existing, separate limitation (`checkMergeStillResolves`'s
own DECOMPOSED-PARENT FALLBACK doc: a decomposed item's own sha is
"structurally never a valid signal"), not something this fix worsens or is
asked to close. Finding 5's own reported scenario is mixed (some children
resolve, one is canceled) — closed exactly as described.

## Risk map

| Component | How risky | Proof point |
|---|---|---: |
| `isCanceledStatus` extraction + `isResolvedStatus` refactor | Medium — `isResolvedStatus` has real callers beyond this item's own scope (`claim-port.mjs`, `countStageEntry`, `checkWorkClassificationVocabulary`, GitNexus-confirmed) — must stay byte-identical | Full existing `frontier.test.mjs` suite (75 tests, including the `statusCategory`-wins-over-literal-status precedence tests) reruns unchanged against the refactor |
| The new children-filter in `checkMergeStillResolves` | Medium — must skip ONLY canceled children, never a legitimately-resolved one, and must not weaken the existing "one genuinely unresolved child still fails" guard | Two new tests reproducing Finding 5's exact scenario (one wontfix child, legacy status string AND modern `statusCategory: 'canceled'` shape) — `ok:true`, the real merged child still named in the detail, the canceled child never named. Existing "genuinely unresolved child still fails" test (tsk-psb regression guard) reruns unchanged, proving the fix didn't loosen the real check |
| Every other existing decomposed-parent/root test (multi-level recursion, root's-own-branch check) | Low — must stay byte-identical | Full existing `cleanup-harness.test.mjs` suite (43 tests) reruns unchanged |

## Shape

Single piece, no split — two small, tightly-related changes (one helper
extraction, one filter), already implemented and verified.

Verify (already synced onto the item at discovery, real and runnable):
```
node --test test/state/cleanup-harness.test.mjs test/state/frontier.test.mjs
```

## Outstanding questions

None
