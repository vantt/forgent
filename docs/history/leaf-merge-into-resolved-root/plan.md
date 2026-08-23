# Plan: công đã delivered bị kẹt ngoài main khi root đã resolved

Item: tsk-4qu.
Mode: standard

## Lane — how it was counted

No lane was handed off: this item reached `fgos-coding-planning` through
`/fgOS:pick` → `fgos-coding-driving` → `fgos-clarifying`, none of which
runs `fgos-routing`'s Orient step. Applying `fgos-routing`'s own Mode-gate
table directly (`.claude/skills/fgos-routing/SKILL.md` §"Mode gate"):

| Flag | Applies? | Why |
|---|---|---|
| auth / authorization | No | — |
| data model | No | no schema change; reads fields that already exist |
| audit/security | No | — |
| external systems | No | — |
| public contracts | **Yes** | `mergeReadiness()`'s bucket shape is consumed outside this repo's JS — `herdr-plugin/src/fgos.rs:143` deserializes `blockedOnSync` by name; `bin/fgos.mjs`'s `merge list`/`merge next` and the merge skills read the same buckets |
| cross-platform | No | — |
| existing covered behavior | **Yes** | `test/state/graph-harness.test.mjs` and `test/state/drift-status.test.mjs` both already cover these functions |
| weak proof around the area | **Yes** | the defect survived at least two real occurrences (tsk-53n, tsk-4ns) with no test catching it |
| multi-domain | No | — |

3 flags, no hard-gate flag → **standard**. Not `small`: a public contract
two other surfaces deserialize is in scope, and the item's own evidence is
a silent-failure class, which needs the concrete-cases sketch a `small`
lane would skip. Not `high-risk`: nothing here touches auth, data loss,
audit, an external provider, or removes a validation — the change ADDS a
report where one was suppressed.

## Decisions this plan is built on

No `CONTEXT.md` exists: `fgos-clarifying` verdicted the item's own
description understood without a gray area, so `clarify -> exploring`
never ran. The item's own description is the locked source, the same shape
`tsk-5wz`'s plan used.

Re-verified against source during planning (not taken on the description's
word):

- `src/state/graph-harness.mjs:209` — `mergeTier[item.id] = item.parent ?
  'leaf-to-root' : 'root-to-main'`. Confirmed: derived from `item.parent`
  alone, no read of the root's status.
- `src/state/drift-status.mjs:93` — `needsSync: aheadOfTarget > 0 &&
  !isResolvedStatus(rootItem)`. Confirmed.
- `src/state/drift-status.mjs:25-31` — `findRootIds` = every id that is
  some item's `parent`. **A resolved root IS still iterated**, so
  `driftStatus` does compute and return its real `aheadOfTarget`; only the
  `needsSync` flag is suppressed. This corrects the item's own framing:
  the data is present and correct, it is the *surfacing* that is missing.
- `src/setup/registrations.mjs:384-403` — `checkRootDrift`, an
  ALREADY-REGISTERED doctor check whose failure message is literally
  `drifted root branch(es) need syncing: ... — run fgos sync-root
  <root-id>`. It filters on `status.needsSync`, so for a resolved root it
  reports `no root branch is drifted ahead of its target` while that
  branch sits N commits ahead. This is the single most important finding
  of this planning pass: **the right surface already exists and already
  prints the right instruction — it is just filtered out.**

### Correction to the item's own verify wording

The item's discovery verify says a stranded leaf "phải xuất hiện ở MỘT
bucket nào đó" of `mergeReadiness`. That framing is wrong and this plan
does not implement it. By the time the work is stranded the leaf is
`delivered`, so it is legitimately outside `mergeReadiness`'s `proposed`
set (`graph-harness.mjs:97` filters `status === 'awaiting-approval'`) —
`merge list` reporting nothing is correct by its own contract, not a bug.
The real gap is one level down: a *branch* carries commits its target
lacks and no surface says so. Acceptance below is restated accordingly.

## Approach

Two independent defects, fixed in two pieces, detection before prevention.

**Piece 1 — surface it (the actual bug).** Make the existing
`checkRootDrift` doctor check report a root branch that is ahead of its
target *regardless of whether the root item is resolved*, since a resolved
root with unsynced commits is precisely the case nothing else reports.
`driftStatus` already returns `aheadOfTarget` for these roots, so this is a
filter change plus a distinct message, not new measurement.

Where the resolved/unresolved distinction lives is a real design choice,
recorded here rather than decided silently:

- **Chosen:** keep `needsSync`'s meaning exactly as-is (it is deserialized
  and branched on by `merge next`'s auto-sync path, `bin/fgos.mjs:2007`,
  and documented in `docs/explanation/why-merge-next-auto-syncs-
  blockedonsync-roots.md` D1/D2) and have `checkRootDrift` read
  `aheadOfTarget > 0` directly, splitting its report into "needs sync" and
  "resolved but unsynced". Rationale: `merge next` auto-*merges* on
  `needsSync`; widening that flag would make it auto-merge branches whose
  item is already closed out — a behavior change nobody asked for, on the
  riskiest path in the repo.
- **Rejected:** widen `needsSync` itself. Cheaper to write, but it silently
  changes what `merge next`/`merge-loop` will act on unattended, and
  `blockedOnSync` is a name `herdr-plugin` deserializes.

**Piece 2 — prevent it.** Refuse (or re-route) a leaf `approve` whose root
is already resolved, so work stops landing on a dead-end branch in the
first place. Deliberately sequenced second: piece 1 is what makes existing
strandings visible, and it cannot itself create a new one. Piece 2 touches
`approve`, the path with the widest blast radius in the repo, so it earns
its own reality check rather than riding along.

**Order**: `fgos graph --json` reports `topUnblock: []` and this item is
absent from `criticalPath` (depth 10, none of whose ids relate here), so
ordering is decided by the item's own internal shape, not cross-item
leverage: detection first, prevention second.

## Risk map

| Component | Risk | What proves it |
|---|---|---|
| `checkRootDrift` filter change | medium — a doctor check flipping to `passed: false` on real repos; today's own scan says 1 root would newly report (`fgw/tsk-4n7`, whose diff is empty) | new test on the pure path with a resolved root at `aheadOfTarget > 0`; plus running `fgos doctor` against this real repo and reading what it now says |
| `needsSync` left untouched | low — deliberate no-op | regression test: a resolved root still yields `needsSync: false`, so `merge next` behavior is byte-identical |
| `mergeReadiness` bucket shape | low for piece 1 — unchanged | regression: existing `graph-harness.test.mjs` stays green with no bucket-membership change |
| leaf `approve` refusal (piece 2) | high — `approve` is the widest-reach path here | its own proof point at `fgos-coding-validating`; not landed in piece 1 |

Impact-analysis posture: **degraded**. `fgos tool query --capability
impact-analysis --status present` reports GitNexus `present`, but its index
is stale (`4ce7a96`) and it returned a provably wrong `impactedCount: 0`
for `validateWorkShape` during tsk-5wz earlier today, contradicted by grep.
Call sites in this plan were established by grep, and the same discipline
applies at implement time — blast-radius claims from GitNexus alone are not
to be trusted here without a grep cross-check.

## Shape

**Piece 1** (this item):
- `src/setup/registrations.mjs` — `checkRootDrift` reports both classes,
  with distinct messages; the resolved-but-unsynced one names
  `fgos sync-root <root-id>` the same way the existing message does.
- `test/setup/checks.test.mjs` — new coverage for the resolved-root case.
- `test/state/drift-status.test.mjs` — pin that `aheadOfTarget` is real for
  a resolved root while `needsSync` stays `false` (the invariant piece 1
  depends on, and the thing that would silently break piece 1 if someone
  later "simplified" `driftStatus` to skip resolved roots entirely).

**Piece 2** — split into its own item at implement time, carrying
`--parent tsk-4qu` and `--footprint "bin/fgos.mjs,src/state/graph-harness.mjs,test/cli/fgos.test.mjs"`.
Not created yet: piece 1's own implementation may change what the right
refusal looks like (e.g. if `checkRootDrift`'s new report turns out to be
sufficient in practice, piece 2 may honestly shrink to a warning).

## Concrete cases to prove against

- **Empty/boundary**: a resolved root whose branch is exactly 0 ahead —
  must stay silent, not report.
- **Existing behavior that must not regress**: an UNresolved root ahead of
  its target still reports exactly as today, and still lands in
  `blockedOnSync` so `merge next` still auto-syncs it.
- **The real case**: root `retrospective`/`cleanup`/`delivered`/`done`,
  branch N>0 ahead of target → reported, naming the branch, the count, the
  target, and `fgos sync-root`.
- **Partial failure**: a root whose branch ref no longer exists —
  `driftStatus` already `continue`s past it (`drift-status.mjs:62`); the
  check must not crash or invent an entry.
- **Concurrent**: another session syncing mid-read — the check reports a
  snapshot; it must never write or mutate anything.

## Assumptions

1. `wontfix` roots are deliberately excluded from "stranded" — an abandoned
   branch is *supposed* to sit outside its target. Not material to
   acceptance (it only narrows what the check reports), pinned here rather
   than asked. Evidence: today's scan surfaced 4 `wontfix` branches that
   are all legitimately unmerged.
2. `fgw/tsk-4n7` reporting as ahead-of-`fgw/tsk-19y` while its `main` diff
   is empty is acceptable noise for piece 1 — the check reports against the
   recorded target, not against main. If this proves noisy in practice it is
   a follow-up, not a blocker.

## Outstanding questions

None
