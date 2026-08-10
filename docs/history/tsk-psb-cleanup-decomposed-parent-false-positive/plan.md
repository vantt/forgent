# tsk-psb — plan

No `CONTEXT.md` for this feature: the item's own description (clarify
stage, verdict `clear`) already carries a verified root cause, a concrete
repro with real commit shas, and a fix direction — the exact content a
`CONTEXT.md` D-ID would otherwise hold. Every "decision" cited below traces
to that description, quoted where the citation matters, since no separate
exploring pass ever ran (the `clarify -> decompose` direct edge, legal for
an item whose intent is already unambiguous per `fgos-clarifying`'s own
verdict).

## Mode gate

**Lane: standard** (2 flags, same counting rule `fgos-routing`'s Orient
step uses): **existing covered behavior** — `checkMergeStillResolves`
already has 8 passing tests (`test/state/cleanup-harness.test.mjs`) this
change must not regress; **weak proof around the area** — every existing
fixture checks a *leaf-with-no-children* against its resolved root; none
exercises the case where the item BEING checked itself has children (the
exact gap this bug lives in). Not `high-risk`: no auth/authorization/
data-loss/audit/external-provider flag applies, and this is additive
(a new fallback path), never a validation removal. Not `spike`: the fix
shape is already given by the item's own description, no open feasibility
question remains.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
registered and `present`. **Degraded**, not full: `impact(checkMergeStillResolves,
upstream)` returned `impactedCount: 0`, but a direct `grep -rn
"checkMergeStillResolves(" src` shows a real caller
(`assessCleanupReadiness`, `cleanup-harness.mjs:245`) — the index is stale
for this symbol. Treating grep as the trustworthy source per the repo's own
capability gate ("a suspicious zero-result... is worth a quick grep/rg
cross-check before being trusted"). Further grep for
`assessCleanupReadiness` across `bin/`, `src/`, `test/` confirms exactly
one real call site outside its own test/doc-comment mentions:
`bin/fgos.mjs:1303` (the `cleanup` verb). Blast radius: small, one hop,
contained — consistent with tsk-577's own prior finding for the same
function.

## Approach

**Root cause (from the item's own description, verified against real
commits — d893da2f / 42a8e1c / f077b67):** `checkMergeStillResolves`
already resolves the correct target ref for a decomposed item via
`resolveRoot` (tsk-1p9's root-aware ref, tsk-577's ref-missing fallback —
both already landed and unaffected by this fix) — that part is NOT the
bug. The bug is which **sha** gets checked against that ref. Today the
function always reads `work.branchHeadAtReturn` (or its fallbacks) for
`id` itself. For a normal leaf, that sha is a real merge commit that
landed leaf-content into the target ref. For a **decomposed** item (one
that gained children instead of executing directly), `work
.branchHeadAtReturn` is whatever `fgw/<id>` happened to record last — per
the description, "it only does a merge main back into itself to sync,
which is the wrong direction for this ancestry check" — a commit that by
construction never becomes an ancestor of anything downstream, because
`fgw/<id>` itself is never the thing that gets merged forward once an item
decomposes; its children's own branches (`fgw/<childId>`) are merged
directly into the SAME resolved root ref instead. So `id`'s own sha is
structurally the wrong thing to check whenever `id` has children — no
matter what target ref you check it against.

**Fix:** when `checkMergeStillResolves` is asked about an item that has
real children (`view.work` contains at least one entry with `parent ===
id`), do not trust `id`'s own recorded sha for the ancestry check at all.
Instead, recurse: check every direct child's own ancestry (each child
resolves the SAME target ref via the existing `resolveRoot` walk, since
`resolveRoot` already walks the full parent chain regardless of how many
decompose levels sit in between — this is why a genuine leaf-of-a-leaf
already passes correctly today with zero code change, per the existing
`leaf-child`/`leaf-root` two-level fixtures). `id`'s own check reports
`ok:true` only when **every** child's own check (recursively) reports
`ok:true`; the first failing child's detail is surfaced, so the failure
message still names a real, checkable reason (never an inferred
content-match — matches the item's own stated constraint: "never
auto-unblock from an inferred content match, just stop misreporting
decomposed parents as blocked").

This mirrors the shape of tsk-577's own missing-ref fallback (try the
direct check first; when the direct signal is structurally wrong for this
item shape, fall back to a second, still-ancestry-based check) without
touching any of tsk-577's logic — that fix operates on which **ref** to
check against; this one operates on which **sha** to check, and the two
compose (a grandchild three decompose-levels deep still resolves through
both fallbacks independently, since each recursive call to
`checkMergeStillResolves` re-derives its own target ref and re-applies the
ref-missing fallback on its own terms).

**Why children, not `work.status`/`stage`:** the item's own description
frames this as "any parent task that went through decompose-into-
children" — `view.work` already carries the ground truth of whether `id`
has children (`parent === id`), which is simpler and more direct than
inferring "was decomposed" from a status/stage value that was never
designed to encode it.

**Why always check children first (not gated behind the direct check
failing):** two reasons discussed and rejected against a "try own sha
first, only fall back on failure" shape (matching tsk-577's ref-fallback
precedent structurally): (1) a decomposed item's own sha is *never* a
valid signal once it has children — unlike the ref-missing case (where the
direct check is sometimes right, sometimes not, depending on prune
timing), so there is no case where trusting it first is correct; (2) it
keeps the function's own behavior simpler to state and test ("has
children -> children decide, full stop") rather than a two-branch
try/fallback that both need their own fixture. Recorded here as a real
alternative considered, not left implicit.

### Order

One file, one function, no ordering dependency. Test file changes land in
the same commit as the source change (no code/test split).

## Files touched

| File | Change |
|---|---|
| `src/state/cleanup-harness.mjs` | `checkMergeStillResolves`: when `id` has children in `view.work`, recurse into each child's own check instead of trusting `id`'s own sha |
| `test/state/cleanup-harness.test.mjs` | new fixtures: a decomposed parent whose own sha is NOT an ancestor but whose children's shas ARE → `ok:true`; a decomposed parent where a child's sha genuinely is NOT an ancestor → `ok:false`, detail names the failing child |

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| children-recursion fallback | medium — wrong recursion could mask a genuine loss for one specific child while others pass | new fixture: one child ok, one child genuinely unreachable → overall `ok:false`, detail identifies the specific failing child (not a generic message) |
| interaction with existing leaf/ref-missing fallbacks | medium — three fallback layers (root-ref resolution, missing-ref->HEAD, now children-recursion) composing incorrectly for a multi-level decompose tree | new fixture: grandchild (child-of-a-decomposed-child) still resolves correctly through all three layers combined, no regression to the existing 2-level `leaf-child`/`leaf-root` fixtures (unchanged, must still pass byte-identical) |
| existing single-level checks (no children) | low — must stay byte-identical | full existing 8-test suite in `cleanup-harness.test.mjs` unchanged and still green |

## Shape

One honest piece of work, not split: single function, single file, the fix
is a bounded addition (one new early-return branch) with no independent
parallel track. `fgos graph --what-if` not run — nothing to compare
against, this is not a multi-piece candidate.

Concrete cases to prove against:
- **The reported bug itself** — a parent with two children whose own shas
  are ancestors of the resolved root, parent's own sha is not → `ok:true`.
- **Regression guard — genuine child-side loss** — same shape, but one
  child's sha genuinely isn't an ancestor → `ok:false`, detail names that
  child specifically (never a generic "may have been force-pushed" for
  the wrong id).
- **Regression guard — no children (existing behavior)** — every existing
  fixture in the file, unchanged, still passes.
- **Multi-level** — a decomposed child that itself has children (grandchild
  case), proving the recursion composes with the existing root-ref
  resolution instead of only ever handling exactly one decompose level.

## Verify

Locked at clarify stage: `node --test test/state/cleanup-harness.test.mjs`
— already scoped to exactly the one file this plan touches. Not broadened
(no second file needed, unlike tsk-577's two-file fix).

## Assumptions

- By the time a decomposed item reaches its own `cleanup` stage, every
  child recorded in `view.work` with `parent === id` is real (came from a
  genuine `fgos add --parent` decompose split), so "does `id` have
  children" is a safe, direct signal — no separate "was this item actually
  decomposed vs. just happens to have a stray `parent`-pointing record"
  distinction is needed. Matches how `fgos-coding-driving`'s own anchor
  check already reads `parent === id` directly with no extra gate.
- A child with NO recorded commit at all (never itself went through a real
  git-verifiable merge) is treated the same as `checkMergeStillResolves`
  already treats that case today for any item — "nothing to check",
  `ok:true` — consistent with the function's own existing precedent
  (`if (!sha) return {ok:true, ...}`), not a new rule invented for this
  fix.

## Outstanding questions

None
