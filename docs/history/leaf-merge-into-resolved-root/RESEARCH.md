# Research: leaf-merge-into-resolved-root (tsk-4s0, piece 2 of tsk-4qu)

## Round 1 — 2026-08-10 (fgos-researching, stage `discovery`)

**Asked:** Is tsk-4s0's goal (block a leaf `approve` from merging into an
already-resolved root, at the source) grounded enough to proceed to
`exploring`/`decompose`?

**Checked:**
- `src/state/graph-harness.mjs:209` — confirmed verbatim:
  `mergeTier[item.id] = item.parent ? 'leaf-to-root' : 'root-to-main';`.
  No read of the root's own status. Matches the item's VAN DE claim exactly.
- `src/state/drift-status.mjs` — `needsSync: aheadOfTarget > 0 &&
  !isResolvedStatus(rootItem)` (line ~101, item description said line 93 —
  minor drift, same statement). Confirms a resolved root never sets
  `needsSync: true`, so it never lands in `blockedOnSync`.
- `herdr-plugin/src/fgos.rs:190` — `#[serde(rename = "blockedOnSync")]`.
  Confirms `blockedOnSync` is a cross-language public contract, as the
  item's PHAI GIU DUNG section states.
- `bin/fgos.mjs` ~2001-2007 — `merge next` auto-syncs the single top-ranked
  `blockedOnSync` root via `sync-root` (tsk-173). Confirms: a resolved
  root's stranded branch never enters this path, so nothing auto-syncs it
  — matches "chi thoat duoc bang fgos sync-root GOI TAY" (only escapes via
  a manual sync-root).
- `src/setup/registrations.mjs:442` (`checkRootDrift`, current on-disk
  state) — **already implements** the "detection" half: splits drift into
  `needsSync` (unresolved root) and `strandedAfterClose` (resolved root,
  `aheadOfTarget > 0`), with a distinct message naming `fgos sync-root
  <root-id>`. Confirms tsk-4s0's "DA CO GI ROI" claim: tsk-4qu's piece 1
  has landed for real, not just claimed.
- `tsk-4qu` (referenced item) — status `cleanup`, stage `executing`. It has
  gone through its own merge/delivery cycle; consistent with "piece 1
  already landed" and "piece 2 split off at implement time."
- `docs/history/leaf-merge-into-resolved-root/plan.md` (tsk-4qu's own
  plan, referenced by tsk-4s0) — explicitly names piece 2 as a *deliberate*
  follow-up: "Piece 2 — split into its own item at implement time, carrying
  `--parent tsk-4qu` and `--footprint
  bin/fgos.mjs,src/state/graph-harness.mjs,test/cli/fgos.test.mjs`." This
  matches tsk-4s0's own footprint (plus `test/state/graph-harness.test.mjs`,
  a superset). Confirms the item's "duoc tach ra co y" (deliberately split)
  claim — this is not an invented dependency.
- `test/state/graph-harness.test.mjs:325-336` — existing `mergeTier` test
  pins `leaf-to-root`/`root-to-main` purely by `item.parent`, regardless of
  root status. This test will need updating (or a new case added) once
  piece 2 changes the rule for a resolved root — consistent with the plan's
  own note that piece 1's implementation may inform piece 2's exact shape.
- `bin/fgos.mjs:2710` (`case 'approve'`) — confirmed the `approve` verb
  exists at the stated footprint and currently has no check against the
  target root's resolved status before merging — piece 2 is genuinely
  unimplemented, not already done.

**Found:** Every code citation, doc citation, and cross-item reference in
the item's description resolves to real, current repo state. The one
piece already landed (tsk-4qu's detection half) is real and verifiable on
disk. The piece this item asks for (prevention, in `approve`/`mergeTier`)
is confirmed not yet implemented. No contradiction found.

**Open (left to `exploring`/`planning`, not this item's scope to answer):**
- Which of the item's own two proposed directions (a: reroute `mergeTier`
  to `root-to-main` for a resolved-root leaf, vs b: refuse `approve`
  outright with a clear message) — the item's own text already defers this
  to planning ("Hai huong de xuat, quyet luc plan").
- Whether rerouting to `root-to-main` (option a) skips any ordering
  constraint `approve` normally enforces for a leaf-to-root merge — named
  as a risk in the item's own text, unresolved here on purpose.

**Verdict:** clear. `verify: "npm test"` (already the item's own real,
runnable verify command — not a placeholder).
