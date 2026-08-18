# Plan: piece 2 — chan approve leaf vao root da resolved

Item: tsk-4s0 (parent: tsk-4qu).
Mode: **standard**

## Lane — how it was counted

No lane was handed off (this item reached `fgos-coding-planning` through
`/fgOS:pick` → `fgos-coding-driving` → `fgos-clarifying` →
`fgos-researching` → `fgos-coding-exploring`, none of which run `fgos-routing`'s
Orient step) and no `Mode:` line existed yet in this file. Applying
`fgos-routing`'s own Mode-gate table directly
(`.claude/skills/fgos-routing/SKILL.md` §"Mode gate"), same table
tsk-4qu's own plan.md already applied to this feature:

| Flag | Applies? | Why |
|---|---|---|
| auth / authorization | No | — |
| data model | No | no schema change; reads fields that already exist |
| audit/security | No | — |
| external systems | No | — |
| public contracts | **Yes** | `mergeReadiness()`'s `ready`/`blockedOnSync` id lists are consumed outside this repo's JS — `herdr-plugin/src/fgos.rs` deserializes both `ready: Vec<String>` and `blocked_on_sync` (`#[serde(rename = "blockedOnSync")]`) by name. `mergeTier` itself is NOT deserialized by herdr-plugin (`fgos.rs`'s own comment: "serde silently ignores them ... this struct only names what it uses") — re-verified from source during this planning pass, correcting an assumption `CONTEXT.md`'s scout evidence carried over too loosely from tsk-4qu's plan. |
| cross-platform | No | — |
| existing covered behavior | **Yes** | `test/state/graph-harness.test.mjs:325-336` already pins `mergeTier`'s current (buggy) parent-only rule; `test/cli/fgos.test.mjs` already covers `approve` |
| weak proof around the area | **Yes** | same defect class already caused two real silent-stranding incidents (tsk-4ns, tsk-53n), and this piece extends the exact function (`approve`) named the widest blast radius in the repo |
| multi-domain | No | — |

3 flags, no hard-gate flag → **standard**. Not `high-risk`: nothing here
touches auth, data loss, audit, or an external provider — the change ADDS
a refusal where one is currently silently missing. Not `small`: `approve`
is explicitly named the highest blast-radius path in the repo and needs
its own reality check, not a quick patch.

## Decisions this plan is built on

`CONTEXT.md` D2 (`docs/history/leaf-merge-into-resolved-root/CONTEXT.md`):
resolved-root check uses `isResolvedStatus` (wontfix included), confirmed
with the user directly in this session before locking.

Re-verified against source during planning (not taken on `CONTEXT.md`'s
scout notes alone):

- `bin/fgos.mjs:2710` (`case 'approve'`) never reads `mergeTier` — the
  actual merge target is `resolveRoot(view, id)` (imported `n` from
  `src/runner/root-affinity.mjs`), used identically for the real git merge
  target (line ~2939), the Iron Law diff base (line 2837), and the
  `item.targets` drift check (line 2795). `resolveRoot` walks `item.parent`
  to the TOP-level ancestor, not one hop — confirmed by its own inline
  comment ("`resolveRoot` walks `item.parent` up to the top"). This
  corrects `CONTEXT.md`'s original "root" pinned term, which is now fixed
  there too (see that file's own note).
- `src/state/graph-harness.mjs:117-126` (`mergeReadiness`, current code) —
  the EXACT blind spot: `const root = resolveRoot(view, item.id); if
  (drift[root]?.needsSync) blockedOnSync.push(...) else syncClear.push(...)`.
  Since `driftStatus`'s `needsSync` is deliberately `false` for a resolved
  root, a leaf whose root is closed out falls into `syncClear` and then
  `ready` — reported as plainly mergeable when it is about to be refused
  by the new `approve` check below. Proven directly in code, not inferred.
- `herdr-plugin/src/fgos.rs` — `MergeListData`/`MergeListSummary` only
  deserialize `ready`, `waiting`, `blocked_on_sync`, `tree`; `mergeTier` is
  named explicitly as unused by that struct. So a `ready`/`blocked_on_sync`
  CONTENTS change is the real public-contract surface here, not
  `mergeTier`'s shape.

### Correction to `CONTEXT.md`'s original scope note

`CONTEXT.md` originally described scope as "`approve`'s own gate plus
`mergeTier`'s classification," implying `mergeTier` itself needed to
change value. It does not — the mergeTier bug (parent-only reading) is
real, but `approve` never reads `mergeTier` so fixing it wouldn't fix
`approve`'s behavior at all. What actually needs to change is (1)
`approve`'s own gate (new refusal) and (2) `mergeReadiness`'s `ready`/
`blockedOnSync` split (so the report doesn't contradict what `approve`
will do). `CONTEXT.md` has been corrected to match.

## Approach

Two changes, same footprint the item already carries
(`bin/fgos.mjs`, `src/state/graph-harness.mjs`,
`test/cli/fgos.test.mjs`, `test/state/graph-harness.test.mjs`) — one
piece of work, not split further (`fgos graph --json` reports
`topUnblock: []` and this item is absent from `criticalPath` (depth 10),
same as tsk-4qu's own plan found for this feature — no cross-item
leverage argument for splitting or reordering; the item's own internal
shape decides order, and there is no dependency between the two changes
below beyond "both touch the same bug").

**Decision: option (b) — refuse `approve` outright**, not option (a)
(reroute `mergeTier` to merge straight into main). The item's own text
left this choice to planning ("Hai huong de xuat, quyet luc plan"). Reasons:

1. **Direct precedent already exists in the exact function.** `approve`
   already has a near-identical refusal for a related hazard — the
   `item.targets` drift check (`bin/fgos.mjs:2790-2811`): when a target's
   resolved root `needsSync`, it throws a `StoreError` naming the drifted
   root and `fgos sync-root`, with an `--acknowledge-drift` override flag
   to proceed anyway. The new check is the same shape, one field over
   (`item.parent`'s resolved root instead of `item.targets`' roots) —
   reusing an established pattern beats inventing a silent reroute.
2. **Option (a)'s own named risk is real and unverified.** The item's own
   text flags that merging straight to main might skip an ordering
   constraint `approve` normally enforces for a leaf-to-root merge.
   Tracing the code confirms `approve`'s leaf-vs-root split
   (`rootId !== id` branch, `bin/fgos.mjs:2937+`) does materially different
   work for a leaf than for a root-to-main item — ephemeral-worktree
   merge onto the resolved root's branch, not main directly. Silently
   rerouting a leaf into the root-to-main code path would skip whatever
   that branch point exists for, without a proof point this plan can name
   — a live risk, not a settled one.
3. **A silent reroute changes acceptance semantics no one asked for.**
   Option (a) would make the leaf's own work land on `main` under a
   DIFFERENT item's identity path than the one it was ever `approve`d
   against, with no human decision point. Option (b) keeps the existing
   human-in-the-loop shape (`fgos sync-root` already how the two real
   incidents were actually resolved) — safer default, matching the item's
   own text calling (b) "an toan hon" (safer).

### Change 1 — `approve`'s new refusal (`bin/fgos.mjs`)

Hoist the check to the SAME point as the existing Iron Law gate — before
the `--github` branch, not only inside the local-merge (`source ===
'runner'`) branch. This mirrors the exact bug class the Iron Law gate's
own history already found and fixed once (review-20260718-self-improve-loop
finding f01: a check that lived only in the local-merge branch let
`approve --github` bypass it entirely — "a complete, structural bypass of
the loop's own hard gate"). Repeating that mistake here for a NEW check
would be a foreseeable regression of the exact class already named in this
file's own comments.

Logic: `const rootId = resolveRoot(view, id); if (rootId !== id &&
isResolvedStatus(view.work[rootId])) { throw new StoreError('validation',
...) }` — message names the root id, its status, and `fgos sync-root
<rootId>`, plus an override flag mirroring `--acknowledge-drift`'s
existing shape (exact flag name — reuse `--acknowledge-drift` itself, or a
new one — is an implementation-depth choice for `fgos-coding-implement`;
either is consistent with this plan, `fgos-coding-validating`'s reality check can
weigh in on which reads clearer). Runs after the worktree-identity guards
already there, before the Iron Law gate.

### Change 2 — `mergeReadiness`'s reporting (`src/state/graph-harness.mjs`)

At the exact `syncClear`/`blockedOnSync` split (lines 117-126): a leaf
whose `resolveRoot(view, item.id)` root is `isResolvedStatus` (not just
`drift[root]?.needsSync`) must not land in plain `syncClear` → `ready`,
since `approve` will now refuse it. Do NOT fold this into `blockedOnSync`
— that bucket's existing meaning is "root branch itself needs syncing,"
a different concept herdr-plugin already renders with its own copy; a
public-contract field should not silently absorb an unrelated meaning.
Add the id to a distinctly-named new field instead (backward-compatible:
herdr-plugin's `MergeListData` has no `deny_unknown_fields`, so an unknown
field is silently ignored by existing herdr-plugin builds — confirmed from
`fgos.rs`'s own struct definitions). Exact field name is implementation
depth for `fgos-coding-implement`; this plan fixes the REQUIREMENT (must not
silently disappear, must not overload `blockedOnSync`), not the literal
key.

## Risk map

| Component | Risk | What proves it |
|---|---|---|
| `approve` refusal (Change 1) | high — `approve` is the widest-reach path in the repo | `fgos-coding-validating`'s own reality check; a new test in `test/cli/fgos.test.mjs` exercising a resolved-root leaf hitting the refusal, and a wontfix-root leaf hitting it too (D2) |
| hoisting before `--github` | medium — same bug class the Iron Law gate's own f01 finding already fixed once; easy to silently regress by placing the new check inside the local-merge branch only | a test asserting the refusal is reached before the `source === 'runner'` branch splits (i.e. covers both transports), or an explicit unit test on the gate logic isolated from a live GitHub call |
| `mergeReadiness` reporting change (Change 2) | medium — `ready`/`blocked_on_sync` CONTENTS are a real cross-language contract (`herdr-plugin/src/fgos.rs` deserializes both) | existing `test/state/graph-harness.test.mjs` regression stays green for every untouched case; new test pins the new bucket's shape explicitly; confirm no `deny_unknown_fields` in `fgos.rs` (already checked above) so an unrecognized new field never breaks an existing herdr-plugin build |
| `wontfix` inclusion (D2) | low-medium — a genuine behavior widening beyond D1's original text | new test: a leaf whose root is `wontfix` also gets refused and also excluded from `ready` |
| existing `mergeTier` (parent-only, unfixed by this item) | low — deliberately left as-is | regression: `test/state/graph-harness.test.mjs:325-336`'s existing assertions stay green unchanged — this item does not touch `mergeTier` itself |

**Impact-analysis posture: degraded** (unchanged from `CONTEXT.md`'s own
finding — GitNexus `present` but 418 commits behind HEAD;
`impact({target:"mergeReadiness"})` returned a provably wrong
`impactedCount: 0`, cross-checked and corrected by grep). Every call site
named in this plan (`approve`, `mergeReadiness`, `herdr-plugin/src/fgos.rs`)
was found by direct grep/read, not GitNexus.

## Shape

One piece (this item, no split):

- `bin/fgos.mjs` — Change 1: new resolved-root refusal in `approve`,
  hoisted before the `--github` branch.
- `src/state/graph-harness.mjs` — Change 2: `mergeReadiness`'s
  `syncClear`/`ready` split gains the resolved-root exclusion, reported
  through a new distinctly-named field (not `blockedOnSync`).
- `test/cli/fgos.test.mjs` — new coverage: `approve` refuses a leaf whose
  resolveRoot'd root is `delivered`/`retrospective`/`cleanup`/`done`/
  `wontfix`; still approves normally when the root is open; refusal is
  reachable for both transports (not just local merge); override flag
  proceeds when supplied.
- `test/state/graph-harness.test.mjs` — new coverage: a leaf whose
  resolved root is closed out (any of the 5 statuses) is excluded from
  `ready` and reported via the new field, not `blockedOnSync`; existing
  `mergeTier` assertions (lines 325-336) stay green unchanged.

Verify (whole item): `npm test`.

## Concrete cases to prove against

- **Empty/boundary**: a leaf whose resolved root has zero commit
  difference from its own target — still refused; the refusal is driven
  by root STATUS, not by drift/commit count.
- **Existing behavior that must not regress**: a leaf whose root is open
  (not resolved) still approves and merges leaf-to-root exactly as today;
  a root-to-main item (no parent) is entirely unaffected (`rootId === id`
  short-circuits the new check).
- **The real case**: leaf `awaiting-approval`, `resolveRoot`'d root status
  in `{delivered, retrospective, cleanup, done, wontfix}` → `approve`
  refuses (both transports), naming the root and `fgos sync-root
  <rootId>`; `merge list`/`mergeReadiness` reports it via the new field,
  not `ready`.
- **Multi-level chain**: leaf under a mid-level item under a resolved
  top-level root — refusal still fires, because it checks
  `resolveRoot(view, id)` (walk-to-top), not `item.parent` directly.
- **Override path**: the acknowledge flag lets a human force the merge
  through anyway, landing on the SAME `resolveRoot`'d branch as before
  (never a silent reroute to main — that would be option (a), rejected
  above).
- **Concurrent**: no new mutation beyond the refusal check itself; reads
  `view`/`drift` fresh the same way `approve`'s other guards already do.

## Outstanding questions

None
