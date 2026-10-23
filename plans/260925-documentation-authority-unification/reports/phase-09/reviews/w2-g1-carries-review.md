# w2-g1-carries review: G1 (L12-96, families 14/15/16/18), D1 commit f534aeaea, checked at cffe725b9

Verdicts: 69 APPROVE, 5 REWORK out of 74 items. The items are the 44 claims, the 24 pointer patches and 6 aggregate or finding items. Every item was checked; nothing was sampled. Machine verdicts are in `w2-g1-carries-review.json`.

## What I recomputed myself
- **Claim set.** The 44 claim ids, families and source files match the register families 14/15/16/18 exactly. Every `sourceOccurrence` equals its step-05 record.
- **Bindings.** I recomputed all 1,287 bindings: claims, the s11 shard, 1,009 unitCarries and 121 refresh rows. Each used the declared recipe (sha256 of compact sorted 4-key JSON plus LF), the extractor `textDigest`, an ancestry computed in Python, full content, and the previous/next anchor and digest. There were 0 mismatches.
- **Refresh rows.** For all 121 rows, `before` equals the f534aeaea^ shard row and `after` equals the live row. No row changed without being listed, and no review fields carried over.
- **Unit coverage.** Every changed unit in the 16 docs has a carry row. No ledger row binds a vanished unit. The 57 register `changedBindings` rows that D1 made stale all have refreshed ledger rows; refreshing the register copy is G0fix's job.
- **Pointer patches.** All 24 replay with GNU `patch --fuzz=0`: the before hash, the after hash, rollback and reverse all match. Each generated surface's delta equals its canonical delta. The patched rul11/rul104/decisions-corpus tests pass (5+2+7) on a scratch copy with `docs/specs/{platform-foundations,work-state,runner}.md` deleted.
- **Verbatim carries.**
  - Foundations: legacy L62-EOF equals candidate L385-880.
  - Work-state retired section: legacy L1364-EOF equals retired-decision-history.md L23-EOF.
  - Knowledge-registry: every carried section body matches docs/architect/knowledge-registry-redesign.md exactly.
  - Release manifest: legacy §5 is a byte-identical substring of release-manifest.md.
  - Distribution: the 5b row and the js-yaml decision are byte-identical.
- **Protected text.** D-ADR0035/0054/0062, RUL11/RUL104, both 0032 topics and the locked L1-L10 body are unchanged. No identity file was touched, and every change is inside the writable list.

## REWORK
1. **Retired-history links** (`retired-decision-history.md`). Restoring the legacy layout broke links pointing into this file:
   - 6 inbound fragments now fail: `architecture-map.md:100,102,126,140` and `work-state/contracts/cli-io-contract.md:31,397`. cli-io-contract.md is in D1's writable set; architecture-map.md needs a patch spec.
   - Line 30's working in-page link to 0012 became the legacy dead link `0012-typed-edge-model-…md`.
   - The clickable Related Files section was dropped.
2. **reference-002295** (`activation-binding.md:573`). The authored text claims `workspace.rs` runs `git rev-parse --git-common-dir`. It actually resolves through the Git component (`fgos_git::GitDriver::open_at`). The legacy rule (distribution.md:433-436) is about `scripts/fgos-shell-integration.sh`.
3. **reference-000232** (`conserved-dispatch-doctrine.md:15`). It cites `test/cli/fgos-return-worktree-guard.test.mjs`, which does not exist. The quoted sentence's real origin is `docs/history/tsk-ikd-return-main-worktree-guard/RESEARCH.md:26`.
4. **reference-003709** (`conserved-dispatch-doctrine.md:55`). It cites `docs/platform/seat-binding/spec.md`, which does not exist; the only copy is `docs/specs/seat-binding.md`.
5. **Release manifest** (`release-manifest.md:393`). The verbatim §5 copy duplicates the `components.legacyNode` paragraph already at L254. The copy carries a relative link that points nowhere from the new location.

## Low / handoff
- Skill and `mechanism.mjs` pointers use the extractor fragment `#0026-native-…`, while the holder's markdown link uses the GitHub form `#0026--native-…`. Both are in backticks, so they are not clickable.
- In gateway-readiness, the wording "old R5 client contract" overstates: R5 never stated the baseUrl rule.
- Outside D1's scope: `runner/decisions/h-36d872fbb0e5.md` lags legacy runner.md (0048/0049 supersession notes, `withStateTx`). The runner area needs the same re-sync that packaging got.
- The receipt says the register has "no bindingHashEncoding field". That is true only at the top level; the L12-130 rows declare it per row.
