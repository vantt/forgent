# plan.md: checkMergeStillResolves never checks a decomposed root's own branch against main

Mode: small

**Why small, not tiny:** touches three files (source + a new regression
test + the accumulated explanation doc), so more than "a couple of files,
one direct task" — but every gray area is already resolved in `CONTEXT.md`
(D1-D3), so it stays "a few files, no gray areas" rather than `standard`.

**Lane derivation (fgos-routing's Mode gate, applied directly — this
session went straight from `fgos-coding-exploring` into this skill without
`fgos-routing`'s own Orient step ever running, so no lane was handed off
in prose; `plan.md` did not exist yet either, so neither direct-entry
fallback branch had an answer to read):**

- auth — no
- authorization — no
- data model — no (a diagnostic/reporting function, no schema/shape change)
- audit/security — no
- external systems — no
- public contracts — no (single internal caller, confirmed below)
- cross-platform — no
- existing covered behavior — **yes**: `checkMergeStillResolves` already
  has 8 tests in `test/state/cleanup-harness.test.mjs`; this change must
  not regress any of them (see Approach below — confirmed none need to).
- weak proof around the area — no (strong existing coverage, and
  `CONTEXT.md`'s Scout evidence already traced every relevant test)
- multi-domain — no

1 flag → 0-1 range → tiny or small; picked small over tiny for file count
(3, not "a couple").

## Approach

**Chosen path** (honors CONTEXT.md D1/D2): in `checkMergeStillResolves`
(`src/state/cleanup-harness.mjs:133-151`), when `children.length > 0`,
run the existing `checkChildrenResolve` as today, and — only when `id`
resolves to itself as the root (`resolveRoot(view, id) === id`, D1) —
additionally run the existing root-branch-vs-`HEAD` ancestry path (the
same `refExists`/`checkAncestry` pair already used at
`cleanup-harness.mjs:144-150` for a childless item) against `fgw/<id>`.
Combine both results with AND (D2): `ok: true` only when children resolve
AND (not-root, or the root's own branch resolves too).

**Alternatives rejected:**
- *Content/diff-based check instead of ancestry* — rejected the same way
  `tsk-577`'s own fix rejected it (see `docs/explanation/why-
  checkmergestillresolves-can-false-positive-after-a-root-branch-
  prune.md`): higher compute cost, no confirmed case needing it, stays
  out of scope per that established precedent.
- *Checking every decomposed node's own branch, not only the root's* —
  rejected per D1: a non-root node's branch is structurally never merged
  forward (children fork from and merge into the ROOT's branch tip
  directly), so checking it would report a false failure on branches that
  were never supposed to merge in the first place.

**Risk map:**

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| `checkMergeStillResolves`'s new root-branch check | Light — additive, reuses existing tested helpers (`refExists`/`checkAncestry`), same function that already runs this exact ancestry check for a childless item today | New test: root-with-children whose own branch never merged → `ok:false`; root-with-children whose own branch DID merge → `ok:true` alongside a passing children check |
| Existing children-recursion tests (`test/state/cleanup-harness.test.mjs:173-281`) | None expected — CONTEXT.md's Scout evidence confirms all three call the function with a **non-root** `id`, so the new root-gated check never fires for them | Run `npm test` unchanged; all three must still pass with zero edits |
| `assessCleanupReadiness`'s one real caller (confirmed via `rg` and GitNexus `impact()` — see CONTEXT.md `## Impact analysis`) | Light — no signature or call-site change, only the internal branch of `checkMergeStillResolves` | `npm test` covers `assessCleanupReadiness`'s own existing test suite too |

Impact-analysis posture (CLAUDE.md gate, `fgos tool query --capability
impact-analysis --status present`): **full** — GitNexus registered and
`present`; its `impact()` query already confirmed the single real caller
independently of the `rg` scout (see CONTEXT.md). No degraded/inactive
caveat to carry forward.

**Files touched, in order:**

1. `src/state/cleanup-harness.mjs` — the fix itself (`checkMergeStillResolves`).
2. `test/state/cleanup-harness.test.mjs` — new regression test(s) for the
   root-with-children case (both the `ok:false` failure shape and the
   `ok:true` pass shape), placed alongside the existing tsk-psb tests this
   function already has.
3. `docs/explanation/why-checkmergestillresolves-can-false-positive-after-
   a-root-branch-prune.md` — append a "fifth case" section (matching the
   doc's own existing structure for cases one through four) documenting
   this gap and its fix, since this changes user-visible behavior of a
   function that doc already exists specifically to explain
   (documentation-management: this counts as user-visible behavior of a
   diagnostic the doc's own stated purpose is to keep current).

No ordering dependency between files 1-3 beyond the natural
write-code-then-test-then-document sequence; `fgos graph --json` for
`tsk-5j0` confirms it sits in an isolated single-item component with no
`criticalPath`/`topUnblock` relevance (it has no `deps`, no parent, no
children) — there is no cross-item sequencing question here.

## Shape

One honest piece of work — no split (see `## Split` below). Concrete
cases to prove at `fgos-coding-validating`/execution:

- **Root with children, own branch never merged into `main`** — must now
  report `ok:false` naming the root's own branch as the failing detail
  (the exact gap `tsk-4b2` reportedly hit).
- **Root with children, own branch DID merge into `main`, all children
  also resolve** — must report `ok:true` (no false-positive introduced).
- **Root with children, own branch merged, but one child's branch did
  NOT resolve** — must still report `ok:false` via the existing
  children-check path (regression guard: the new root check must not
  mask an already-caught children failure, nor short-circuit before it).
- **Non-root decomposed node with children (mid-tree), own branch never
  merged anywhere** — must still report `ok:true` via children alone,
  unchanged from today (D1 — the three existing tests already cover this
  shape; confirm they still pass with zero edits, do not just assume it).
- **Childless item (existing, unaffected code path)** — must be
  byte-identical to current behavior; this path is untouched by the fix.

**Verify:** `npm test` — the item's own existing verify field, already a
real, runnable command covering the full suite including the new tests
added here.

## Split

Not split. One coherent change to one function, a same-file regression
test, and one doc update — small enough as a single piece per the Mode
derivation above; no independent sub-pieces that would benefit from
separate verify/ownership.

## Outstanding questions

None
