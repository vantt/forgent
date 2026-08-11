# tsk-5e97 — plan

## Mode

**small** — a few files, no gray areas left after `fgos-coding-exploring`.

Flag count: 1 of 10 (`existing covered behavior` — `resolveDecompose` is the
core decompose engine path, covered by 1210 lines of tests in
`test/intake/plan.test.mjs`, including two existing gates
(`keywordRiskGate`/`blastRadiusGate`) this change must not disturb). No auth,
authorization, data-model, audit/security, external-system, public-contract,
cross-platform, weak-proof, or multi-domain flag applies. 1 flag stays under
the 2–3 threshold for `standard`, but the item is not a single trivial edit
either (new gate branch + new tests mirroring two existing gate's worth of
coverage) — `tiny` would undersell that, so `small`.

No split: this is one honest, self-contained change to one function in one
file, plus its matching tests. No child items.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → 1 provider,
`gitnexus`, `status: present` → **full**. Ran `impact(resolveDecompose,
upstream, summaryOnly)`: `impactedCount: 0`, `risk: LOW`, `epistemic: exact`
(no indexed non-test callers beyond the CLI/runner dispatch paths already
known from reading the source — `includeTests` defaults false, so the 1210
lines of decompose tests that exercise it aren't counted here). This is the
proof point for the one risk-map row below.

## Approach

Implements D1 (`docs/history/tsk-5e97-decompose-footprint-overlap-gate/CONTEXT.md`):
gate to `awaiting-human` on footprint overlap among tentative children,
mirroring `keywordRiskGate`/`blastRadiusGate`, never auto-adjusting.

**Insertion point**: inside `resolveDecompose`'s `verdict.kind === 'decompose'`
branch (`src/intake/plan.mjs:477-504`), right after `childIds` is
computed (`:482`) and before the `verdict.children.forEach` / `addWork` loop
(`:484`). This is the earliest point where tentative children have real ids
(`childIds[index]`) to pass as `footprintOverlapAmong`'s candidate `.id`, and
the latest point before any state-changing write for this verdict happens.

**Check**:
```js
const footprintCandidates = verdict.children.map((child, index) => ({ id: childIds[index], footprint: child.footprint }));
const footprintConflicts = footprintOverlapAmong(footprintCandidates);
```
`footprintOverlapAmong` already handles the "no footprint declared" case (an
item with no footprint never conflicts) — no extra guard needed for children
the model left `footprint` empty on.

**On conflict** (`footprintConflicts.length > 0`): build a reason string
listing each conflicting pair, their shared paths, and the suggestions
(`sequence`/`hoist`/`re-slice`) `footprintOverlapAmong` already returns per
conflict — then reuse the existing `formatProposalAsk(verdict, reason)`
(`:316-325`) exactly as the `need-human`/heavy-risk/blast-radius paths
already do (it already special-cases `verdict.kind === 'decompose'` to list
children + reason). `logDecomposeVerdict(dir, id, 'need-human', reason)` +
`putInAwaiting(...)`, `return { outcome: 'need-human', id, verdict }` — same
shape as the existing `risksGate` branch (`:457-468`), just triggered from
inside the `decompose` branch instead of before it (since it needs
`childIds`, which don't exist yet at `:442-455` where `risksGate` is
checked).

**No bypass-detection constant needed** (unlike `keywordRiskGate`/
`blastRadiusGate`'s `gate.ask.includes(DEFAULT_..._REASON)` pattern,
`:436-444`/`:451-452`): those two gate on a **static** property of the root
item (`work.risk`, a `blastRadius` the model re-reports from `plan.md` every
call) that doesn't change between judge calls, so without a bypass a human's
`fgos answer` would re-park on the identical reason forever. Footprint
overlap is re-derived from the **fresh model verdict** every call — if a
human's answer leads the next `judgeDecompose` call to propose
non-overlapping children (or fewer children), the check naturally passes on
its own; if the model still proposes the same overlap, re-parking with the
same evidence is correct, not a bug. Adding a bypass here would be dead
complexity with no failure mode it prevents — rejected per YAGNI, no
`CONTEXT.md` decision needed for this since it's an implementation shape
call, not a product one.

**Ordering relative to `risksGate`** (`:442-468`): unchanged, left exactly
where it is — it fires before `verdict.kind` is even branched on, covers both
`pass-through` and `decompose` verdicts, and already returns before reaching
the `decompose` branch when it fires. The new footprint-overlap check sits
strictly after it, only inside the `decompose` branch, so the two never
race — `risksGate` firing first (same as today) preempts the footprint
check from ever running that pass.

## Files touched

- `src/intake/plan.mjs` — import `footprintOverlapAmong` from
  `../state/graph-metrics.mjs`; add the check + gate branch described above,
  inside the existing `decompose` branch.
- `test/intake/plan.test.mjs` — new tests mirroring the existing
  `risksGate` test shape (`:747-955`):
  1. Two tentative children with overlapping `footprint` → `resolveDecompose`
     returns `outcome: 'need-human'`, writes zero children (assert no
     `work[childId]` exists after the call), item lands in `awaiting-human`
     carrying the conflict in its `ask` text.
  2. Two children with disjoint (or one/both empty) `footprint` → normal
     `decompose` outcome, both children created, unaffected by this change.
  3. A verdict already forced to `need-human` by `keywordRiskGate` with
     overlapping child footprints → outcome is `need-human` via the
     existing heavy-risk path (ordering proof: `risksGate` still preempts,
     asserted the same way the existing heavy-risk tests already assert
     `DEFAULT_RISK_GATE_REASON` in the ask text, not the footprint reason).
  4. `logDecomposeVerdict`/`addDecision` entry recorded on the
     footprint-overlap `need-human` outcome (mirrors
     `:1044`'s existing decision-log assertion for `need-human`).
  5. Re-running `resolveDecompose` after a human `fgos answer` where the
     next judge call proposes non-overlapping children → children created
     normally, proving no bypass constant is needed (the "no bypass" design
     choice above, made empirical).

## Proof surface

Item `verify` (set at `fgos-coding-validating`, was a placeholder before this):
`node --test test/intake/plan.test.mjs`. Confirmed real and runnable
today — pre-implementation baseline: 59/59 passing. Post-implementation this
same command must still pass, now including the 5 new tests listed above.

**Post-implementation verify drift (fgos-coding-implement)**: the `fgos discover`
call that moved this item from `clarify` to `decompose` (run at the top of
`fgos-coding-implement`, since the earlier `fgos-coding-exploring` pass had locked
`CONTEXT.md`/`plan.md` but never actually fired the stage-move verb)
recorded its own model-guessed `verify: "npm test"` on the item, silently
overwriting the narrower command set above. The first `fgos return` re-ran
that broad command and failed on 2 pre-existing, unrelated tests (a manifest
completeness check and a `.claude/skills`↔`.agents/skills` mirror-drift
check — both fail identically on the unmodified branch tip, confirmed via
`git stash`), moving the item to `blocked`. `node --test
test/intake/plan.test.mjs` (64/64, including the 5 new tests) was
restored via `fgos edit --verify`, matching what this section had already
locked — the drift was an unrelated engine overwrite, not a scope change.

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| `resolveDecompose`'s `decompose` branch | Low — `impactedCount: 0`/LOW/exact from GitNexus (posture: full, see above); the branch is already heavily tested, and this change is additive (a new early-return before existing writes), not a rewrite of existing logic. | Tests 1–2 above show unaffected behavior when no conflict exists; existing 1210-line suite re-run green proves no regression to `pass-through`/other `decompose` paths. |
| Interaction with `keywordRiskGate`/`blastRadiusGate` | Low-medium — two gates now share the same outcome shape (`need-human`) but different reasons; a wrong ordering could silently swallow one gate's evidence. | Test 3 above proves `risksGate` still preempts, and its own reason text (not the footprint one) is what a human sees when both would fire. |

## Assumptions

- `footprintOverlapAmong`'s existing contract (pairwise, `i < j` order,
  `{a, b, shared, suggestions}` shape) is stable and untouched by this item
  — confirmed by scout in `CONTEXT.md` (no changes proposed to
  `graph-metrics.mjs`).
- The model-proposed `footprint` field is at declared-file-path granularity
  (`normalizeChild`, `:194-196`) — no path normalization (e.g. relative vs.
  absolute) needed beyond what `footprintOverlapAmong` already assumes,
  since existing callers (`footprintOverlap`, `mergeReadiness`) already rely
  on that same assumption today.
