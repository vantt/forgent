# Why `fgos approve` refuses a leaf merging into an already-resolved root

Every decomposed item merges into `fgw/<root>` first (`leaf-to-root`),
and only the root itself ever merges into `main` (`root-to-main`) —
`mergeTier(item)` in `src/state/graph-harness.mjs` decides this purely
from `item.parent`: `item.parent ? 'leaf-to-root' : 'root-to-main'`. That
computation never checked whether the root had *already* been resolved
(`delivered`/`retrospective`/`cleanup`/`done`/`wontfix`).

## The bug this closes (tsk-4s0, piece 2 of tsk-4qu)

If a leaf gets approved *after* its own root has already gone
`delivered`/`retrospective`/`cleanup`/`done`, the old code still routed
it into `fgw/<root>` — a branch nothing will ever sync to `main` again.
`driftStatus` deliberately reports `needsSync: false` for a resolved
root (`drift-status.mjs`), so the leaf's landing on that branch never
enters the `blockedOnSync` bucket, the *only* thing `fgos merge next`
auto-syncs. The leaf silently strands.

This happened for real, twice: `tsk-4ns` merged into `fgw/tsk-5wz` after
`tsk-5wz` had already moved to `retrospective` — `fgos merge list`
reported every bucket empty while a branch carrying 3 delivered commits
sat unreachable from `main`. `tsk-53n` merged into `fgw/tsk-1o7` while
`tsk-1o7` was itself already at `cleanup` — a leaf landing into a root
that was itself mid-closeout. Both cases only resolved via a manually
invoked `fgos sync-root`.

`tsk-4qu` (piece 1) already made this situation *visible*:
`checkRootDrift` (`src/setup/registrations.mjs`) now reports this exact
class — a closed-out root with branch commits outside the merged target
— with "nothing will sync these automatically" and a `sync-root`
pointer. Visible, but still happening. This item (piece 2) closes it at
the source instead of just reporting it after the fact.

## The fix: refuse the approve, don't just report it after landing

```js
const ownRootId = resolveRoot(view, id);
if (ownRootId !== id) {
  const ownRoot = view.work[ownRootId];
  if (isResolvedStatus(ownRoot) && flags['acknowledge-drift'] !== true) {
    throw new StoreError(
      'validation',
      `approve: "${id}"'s root "${ownRootId}" is already "${ownRoot?.status}" — merging into "${branchNameFor(ownRootId)}" would strand this work on a branch nothing else will sync to main. `
        + `Run "fgos sync-root ${ownRootId}" first, or re-run with --acknowledge-drift to merge anyway.`,
    );
  }
}
```

Hoisted ahead of the `--github` branch, mirroring where the Iron Law gate
was hoisted for the same reason (`f01`: a check that only lived in the
local-merge branch let `--github` bypass it entirely — both transports
now share this guard). `--acknowledge-drift` is reused as the override
flag rather than adding a new one: this is the same hazard class as the
existing `item.targets` drift guard — an unsynced/closed-out root
branch — just keyed on the leaf's own parent chain instead of
`item.targets`.

## What resolved means here, and why `wontfix` counts

Initial framing (D1) reused `checkRootDrift`'s narrower
`COMPLETED_ROOT_STATUSES` set (`delivered`/`retrospective`/`cleanup`/
`done`, excluding `wontfix`) — but that set only justified piece 1's
*reporting* exemption, not piece 2's *prevention* gate. Corrected (D2)
to `isResolvedStatus` (`frontier.mjs`), the same broader check every
other closed-out gate in `mergeReadiness` already uses
(`deps`/`mergeAfter`/`supersededOut`, `graph-harness.mjs:107,109,155):
a `wontfix` root's branch is just as unwatched as a `delivered` one, so
the same stranding risk applies to it too.

## `mergeReadiness`'s new bucket, and why it's not folded into `blockedOnSync`

`mergeReadiness` gains `strandedByResolvedRoot`: ids of otherwise-ready
items whose resolved root is already resolved — pulled out of `ready` so
`fgos merge list` stops reporting a leaf that `approve` will now refuse
as plainly mergeable. Kept as its own bucket rather than folded into
`blockedOnSync`, because it's a genuinely different hazard:
`blockedOnSync` means "the root branch itself needs syncing" (something
`merge next` *will* auto-fix); `strandedByResolvedRoot` means "the root
is closed out and nothing will ever sync it automatically" (something a
person must resolve, via `sync-root` or `--acknowledge-drift`). Keeping
them separate also protects `blockedOnSync`'s own existing name — it's a
cross-language public contract (`herdr-plugin/src/fgos.rs` deserializes
it by name).

`mergeTree` gets a matching `stranded-resolved-root` status so a
`strandedByResolvedRoot` id still gets a node in the tree view (never
silently absent — the same "every id in any bucket gets a node" rule the
tree already enforces for `blockedOnSync`), and its container-node
ranking now passes `{ includeDone: true }` so a resolved root can still
host and display an open leaf underneath it in the tree.

## What must never change

- A leaf whose root is *not yet* resolved still merges leaf-to-root
  exactly as before — this is the normal path, never blocked.
- `driftStatus`'s `needsSync` computation itself was never touched to
  "solve" this problem — `merge next` acts on `needsSync: true` by
  actually running `sync-root`, unattended; silently widening what counts
  as needing sync would change behavior on the riskiest path in the repo
  (`tsk-4qu` already locked this boundary, with its own pinned test).
