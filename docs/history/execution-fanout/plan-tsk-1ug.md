# plan — tsk-1ug: `fgos rollup` hiểu `targets`, không chỉ `parent`

Mode: **standard**

Flag count: **2** of the mode-gate list — **public contracts** (`fgos
rollup`'s JSON envelope is consumed by `plugins/fgOS/skills/rollup/SKILL.md`
and documented field-by-field in `docs/how-to/check-rollup-progress.md`) and
**existing covered behavior** (`test/cli/fgos.test.mjs:2413-2482`, five
tests asserting the exact current shape). No hard-gate flag applies. A
`small` lane would not honestly cover it: the change alters the meaning of
two already-published fields (`doneCount`/`totalCount`) for one class of
item, which is a contract change, not a few-file no-gray-area edit.

`impact-analysis: degraded` — `fgos tool query --capability impact-analysis
--status present` reports gitnexus `status: present`, but
`impact({target: "collectRollupData"})` came back `Target not found /
risk: UNKNOWN` while `grep` finds the symbol defined at `bin/fgos.mjs:728`
and called at `:1944`. The index is behind HEAD; blast radius below is
grep-verified, not graph-verified.

## Decisions this plan honors

- `CONTEXT.md` **D4** (seq 8919) — case 2 (cụm epic, con merge riêng) uses
  the existing `goalTier` + `targets`; `targets` does not go through
  `resolveRoot`, so each target keeps its own root and merges independently
  onto `main`. This plan adds no new field and no new edge model.
- `CONTEXT.md` scope row 25 — this item's whole job is "`fgos rollup` hiểu
  `targets`".
- `docs/how-to/close-out-a-goaltier-milestone-after-all-targets-are-done.md`
  — states the gap in its own words ("`fgos rollup` does not read the
  `targets` field at all, so a goalTier item never closes itself just
  because its targets finished") and states that a milestone's `targets`
  are a **different relationship** from a decomposed root's `children`
  (different merge topology). The two stay separate in the output shape
  below for exactly that reason.
- `docs/history/rollup-parent-auto-close/DISCUSSION.md` row 10 — the
  `parent`-tree scan and the `targets`-array read are two genuinely
  different mechanisms; the conclusion there was to keep them apart, not
  merge them into one.

## Approach

Single piece of work in one function. `fgos graph --json` puts `tsk-1ug` on
neither `criticalPath` (depth 10, `tsk-4vo` → `tsk-19y-1`) nor `topUnblock`,
so nothing else in the backlog constrains its ordering.

### Chosen shape

`collectRollupData(view, id)` (`bin/fgos.mjs:728-743`) gains a second
member source:

| Field | Today | After |
|---|---|---|
| `children` | items with `parent === id` | **unchanged**, byte-identical |
| `doneCount` / `totalCount` | over `children` only | **unchanged** — still children-only, same numbers for every existing item |
| `targets` | absent | new array, same `{id, title, status}` row shape, resolved from `item.targets` in its declared order |
| `targetDoneCount` / `targetTotalCount` | absent | new pair, over `targets` only |

Chosen at the plan gate by the person, over the union alternative below:
the two relationships keep two separate counts, so nothing already
published changes meaning and a reader can always tell which number came
from which mechanism. The cost, accepted explicitly at the gate: a
milestone still reads `0/0` in the top-level `doneCount`/`totalCount` pair
— its real progress lives in the `target*` pair beside it.

A dangling target (an id in `targets` with no matching `view.work` entry —
possible by design: `work.mjs:567-577` says `targets` deliberately skips
`validateDeps`, so it may point at ids that do not exist) appears as a row
with `title: null, status: null`. It counts toward `totalCount` and never
toward `doneCount`. Surfacing it beats silently dropping it: a milestone
whose target id was typo'd would otherwise read as legitimately complete.

### Alternatives rejected

- **Merge `targets` into `children`.** Rejected — the how-to and
  `rollup-parent-auto-close` DISCUSSION row 10 both say these are different
  relationships with different merge topology; collapsing them would hide
  which items merge into `fgw/<root>` and which merge straight onto `main`.
- **Fold `targets` into `doneCount`/`totalCount` as a deduped union with
  `children`.** Rejected at the plan gate by the person. It would give a
  milestone one single progress number, but at the cost of changing the
  meaning of two already-published fields for one class of item, and of
  making a reader unable to tell which mechanism a given count came from.
  The accepted trade-off is recorded in the shape table above.
- **Recurse through `targets` transitively** (an MVP's targets are
  milestones, whose targets are work items). Rejected as YAGNI, matching
  `childrenOf`'s own existing single-level rationale at `bin/fgos.mjs:718-723`.
  `graph-metrics.mjs`'s `targetsClosure` (`:204`) already exists for the
  transitive job; `rollup` stays a one-level progress read.

## Risk map

| Component | Risk | What would prove it |
|---|---|---|
| Additive fields on a published envelope | Low, after the gate's separate-counts choice — no existing field changes meaning | Test: the five existing tests at `test/cli/fgos.test.mjs:2413-2482` pass **unmodified**, and an item with no `targets` still reports `doneCount`/`totalCount` from children alone |
| `children` array regression | Low — `childrenOf` is shared with `list`'s progress badge (`bin/fgos.mjs:1676`, tsk-4fg) | `childrenOf` is not modified at all; existing `list` badge tests cover it |
| Dangling target id | Low | Test: `targets: ['no-such-id']` yields one row with `status: null`, `targetTotalCount: 1`, `targetDoneCount: 0`, exit 0, no throw |
| An item carrying both `children` and `targets` | Low — the two counts are now independent, so no dedup is needed at all | Test: such an item reports both pairs separately, neither contaminating the other |

Blast radius (grep-verified, per the degraded note above): `collectRollupData`
has exactly one caller, `case 'rollup'` at `bin/fgos.mjs:1944`. `childrenOf`
has two callers — `collectRollupData` and `list`'s progress badge at `:1676`
— and this plan does not touch it.

## Files

- `bin/fgos.mjs` — `collectRollupData` only (~728-743); `childrenOf`
  untouched
- `src/cli/command-registry.mjs` — `rollup`'s one-line `description`, which
  today says "direct children" and would become wrong
- `test/cli/fgos.test.mjs` — new cases beside the existing rollup block
  (~2413-2482); existing five stay unmodified
- `docs/how-to/check-rollup-progress.md` — gains a short note that `targets`
  are now reported too. **Constraint:** its "Scope: one level only" section
  (`:78-92`) quotes the `childrenOf` source comment (`bin/fgos.mjs:718-723`)
  **verbatim** and says so. That comment must stay byte-identical, or the
  doc's own verbatim claim silently becomes false — so the new `targets`
  logic gets its own comment rather than editing that one.
- `docs/how-to/close-out-a-goaltier-milestone-after-all-targets-are-done.md`
  — its opening asserts "`fgos rollup` does not read the `targets` field at
  all", which becomes false

Order: `bin/fgos.mjs` → tests → docs. Nothing depends on the docs, and the
tests are what prove the contract claim above.

## Assumptions

- **A1** — no consumer outside this repo parses `rollup`'s envelope. Grounded
  in `touchesState: false` / the verb being read-only and consumed only via
  `plugins/fgOS/skills/rollup/SKILL.md`, which prints the JSON rather than
  computing on it.
- **A2** — an item carrying both `children` and `targets` is not a real
  configuration today. With separate counts it needs no dedup at all, so
  this assumption is no longer load-bearing; the test above covers the case
  either way.

## Split

None. One function, one contract, one test block — splitting would create
children that could not be verified independently.

## Verify

```
node --test test/cli/fgos.test.mjs && npm test
```

The item's own stored `verify`, unchanged. No skill-prose path is touched,
so `docs/how-to/write-verify-for-a-skill-prose-change.md` does not apply.
