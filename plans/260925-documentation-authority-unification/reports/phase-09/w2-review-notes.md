# W2 review findings for follow-up turns
## G2 census (w2-g2-census-review, 231/33) -> D4b
- High: post-pin rescan only re-lists literals; 132 new DYNAMIC sites since census pin unlisted (112 in packages/config, packages/yaml-doc; 13 read-like: bin/fgos.mjs:3869-3890, packages/config/rust/src/files.rs:122-128, src/runner/dispatch/config.mjs:365, src/setup/tier-ladder-comment.mjs:14). List: reviews/w2-g2-dyn-delta.json.
- Medium: artifacts computed at 3e2d05af8 but landed after 5fe778624; 38 rows wrong line/hash (worktree.mjs +2, check-evidence-relocation.test.mjs +4); join.py has no --pin -> add --pin, rerun at landed commit.
- Medium: 27 residue rows: source files deleted by 5a33989fa (seat-binding conversion removal) but reason says shared fixture/helper -> name deleting commit.
- Low: pc-d-0185/0186 owning proof is #[ignore] recovery_matrix_child -> name parent recovery_matrix_all_payload_kinds; 116 residue rows claim joined custody with empty proof list; Rust locator regex points at blank line before #[test] (37 rows); yaml golden join hard-coded line 185; 13 post-pin judgment rows lack per-row reason.
## G3 + packaging (w2-g3-packaging-review, 27/5) -> D1b
- Blocking: contracts/release-manifest.md:316-453 new "Canonical Release Tree Rules" = 135-line verbatim copy of retained §5 (180-315) + broken link line 393 ../host-invocation-routing/legacy-cli-transition.md -> one holder, fix link.
- Blocking: spec.md:579-580 Data Dictionary rows 7/7b: lists removed model-policy-tier-coverage; misses checks documentation-cutover-lease, git-land-recovery, git-mutation-one-door, identity-ids-unique, seat-binding-config, seat-binding-route, workflow-case-binding-sentinel, workflow-case-bindings; misses fixes git-driver-directories, git-land-recovery, git-publication-refspecs, git-wal-dir, workflow-case-bindings (legacy distribution.md has same drift -> also tell main lane).
- Blocking: contracts/activation-binding.md:482-570 copies 6 blocks of architecture/runtime-identity-and-activation.md:267-342 -> one holder, point init.rs at it.
- Blocking: spec.md:211-243 "Legacy Setup Scenario" duplicates setup-doctor-registry.md#unheaded-block-30, unbound -> remove or bind with reason.
- Low: carries/receipt.md wrongly says register lacks bindingHashEncoding.
- Notes: topology links mixed (docs/architect vs system-architecture copy) -> decide; 114 stale packaging digests in step-08-preflip-gates.json + 57 in review-batches.json need successor rows (G9); "two lock directories" omits <stateRoot>/terminal; work-state/decisions/retired-decision-history.md:30 link unresolved.
## D2b (blocked-partial, 11/15) -> Lead holder decisions needed
- Missing accepted live holders: enduser-docs-authoring.md + enduser-docs-index.md full write/read-side contracts (system-overview f07928/f07929; switchboard rows f08382-f08384 and documentation/switchboard f06749-f06751 depend on it); architecture-intent.md 8 Related/evidence rows (system vision, Step 09/10, component authority map, intent ledger, coordination-session/flow-definition); area-holder table also lacks seat-binding, workflow.
- GAP-05 placement proposal (move two source-carriage sections into literal history) awaits Lead approval.
## G1 carries (w2-g1-carries-review, 69/5) -> D1b
- work-state/decisions/retired-decision-history.md: 0032 layout restore broke 6 incoming links (architecture-map.md:100,102,126,140; work-state/contracts/cli-io-contract.md:31,397), line 30 in-page 0012 link now dead legacy link, clickable Related Files section dropped -> fix links / keep anchors.
- activation-binding.md:573 (reference-002295): says workspace.rs runs git rev-parse --git-common-dir; real: fgos_git::GitDriver::open_at; legacy rule is about scripts/fgos-shell-integration.sh -> correct.
- runner/contracts/conserved-dispatch-doctrine.md:15 (reference-000232) cites nonexistent test/cli/fgos-return-worktree-guard.test.mjs; source is docs/history/tsk-ikd-return-main-worktree-guard/RESEARCH.md:26.
- same file :55 (reference-003709) cites nonexistent docs/platform/seat-binding/spec.md (only docs/specs/seat-binding.md) -> seat-binding has no platform holder (same gap as D2b).
- release-manifest.md:393 duplicate legacyNode paragraph (also line 254) with dead relative link (same as G3 #1).
- SYSTEMIC: runner area drifted too: docs/platform/runner/decisions/h-36d872fbb0e5.md missing 0048/0049 supersession notes, still names withStateTx vs legacy docs/specs/runner.md -> runner re-sync like packaging (G9/D1b).
