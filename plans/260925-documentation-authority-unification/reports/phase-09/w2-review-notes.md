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
## G6 preserve (w2-g6-preserve-review, 68/50) -> D4b
- Negative probes don't exercise historical_evidence(); probes 1==3. Write real probes (live pointer + unrelated "e.g." far away must NOT confirm; nav row in file titled "Bee" must NOT confirm).
- "example/external framing" marker searched whole-file, not passage (416/447 outside passage): 29 fgOS-owned live pointers falsely confirmed history (AGENTS.md:13,:60 -> docs/routing-handoff-contract.md; gateway .rs/Cargo.toml -> docs/contracts/fgos-gateway-api-v1.yaml; TaskDetail.tsx/Taskboard.tsx -> docs/ui-spec; io-contract.md, coexistence.md, distribution-vision.md) -> park/repoint.
- 5 rows "reachability unchanged" but source file deleted by move (f00515, f00521, f00525, f01225, f08411: docs/README.md, docs/doc-governance.md, docs/transitional-switchboard.md).
- Dated-note uniform per L12-35(3): 10 wrappers missed (f05646-f05742 nine rows; f06391 live playbook); f06167 labelled inside literal carriage but is before "## Literal Snapshot" -> check position.
- f07526 "Canonical architecture moved to: docs/architect/..." navigation line becomes false -> repoint.
- Stale pin: 90 rows in files changed 3e2d05af8..cffe725b9; 18 no longer bind -> refresh at final pin F (and add --pin).
- 152 history-wrapper proposals sound (preserve-with-dated-note).
## G0 delta (w2-g0-delta-review, 10/2) -> G0-fix2 (after D7, ledger serialization)
- claim_af89c4e6 (s3-host-invocation-boundary-gaps registryGaps[2]) stale again: e5af4c501 (D6) rewrote component-boundary Workflow/Seat Binding rows -> rebind (17b94e60 -> badfb72a); verify scripts must check HEAD not the authoring pin.
- Ancestry convention: 52 rows include heading's own title in targetAncestry, 2 rows (claim_4ff3a128 s2 claims[404]; claim_b2a51d5d s8-observe claims[4]) parents-only; verify.py:186 accepts both -> declare self-inclusive in bindingHashEncoding, recompute 2 rows, tighten verifier.
- Lead decision: group rows (s9-runner-01 registryGaps[2],[4]-[18], 16 null-anchor rows share hash over targetOwner only) -> add a member-digest key (sorted member unit digests) to the recipe for group rows so approvals bind content.
- s12-late-areas nativeIdentityGaps rows store hash without digest/ancestry inputs -> store inputs.
- residual row 14 outOfScopeProposalOnly=true now live -> fix flag.
- pilot/decisions/b-io-contract.json write was authorized by the Lead in the continuation prompt of turn 662 (record in L13-5).
## G8 archive (w2-g8-archive-review, 6/6) -> D5b
- 313 retirement specs name the deleted file itself as owningProof -> name the real owning proof or state "behaviour retired"; 10 are current Phase 9 gate replayers (census-join/join.py, composition/*, preserve-premise/*, carries/*): conditional retirement, but tip measure assumes gone -> mark them retire-at-final-pin and measure tip both ways.
- Rehearsal never reaches check A (frozen ownership tests fail at audit-ownership first); removal commit would trip check A with 375 moved paths outside allowed-paths.json -> design must name pair accounting for the removal commit.
- 1.27 GB: 491 MB live readers (identity registries 170 MB, phase-02 inventory parts 195 MB, ledger shards, rationale inputs); 540 MB / 5,663 small files kept only by the 1 MB threshold, no reader reason -> move the small-record tranche too unless a reader needs it (Lead decides: move it); design.md:30 misstates cause; live product inputs labelled "small record" (alias-table.json, claim-and-disposition-vocabulary.json, shipped-path-conventions-inventory.json, dropped-claims-register.json, plan.md) need real reasons.
- Real-disk worktree add median 21.0 s (control full pin 99.3 s) — under 60 s.
- Low: rehearse.py hardcodes "tmpfs" label; main manifest 2.7 MB (2.4 MB retained-audit rows) + archive/** 14 MB on tip -> slim.
## Late areas (w2-late-areas-review, 20/2)
- scan-legacy-drift.mjs:78 used u.textDigest (undefined) -> removedOrReplaced listed every unit; Lead fixed to sourceUnitDigest (commit after ae9b9a6ef); regenerate legacy-drift.json right before D7 (after D1b). missingCarriage counts were already right.
- changedBindings[19] (claim_af89c4e6) join to D6 overlay broken by e70742232 hash add -> G0-fix2: join on shard+index+anchor+digest, not hash.
- component-boundary.md still has 5 ../specs/workflow.md links (Work Lifecycle, Execution Core, Holder-lock rows, nav row 122) + two end-user spec links -> D7 fix.
- New specs keep legacy front matter (coverage: full-target) above candidate header; knowledge-registry has "Document type" twice -> D7 tidy.
- candidateSuccessor switchboard field unread by any script (label only).
- Check D6 worker checkout (forgentX-p9-w1-d2) for build leftovers: .fgos/runtime/git-addon/, target/.
## G4 code (w2-g4-code-review, 17/2) -> D3c
- HIGH: scripts/verify-phase-01.mjs:448-455, verify-phase-02.mjs:341-348: temp worktree made with createDetached, npm install/ci leaves node_modules (ignored), guarded removeWorktree refuses worktree-ignored-bytes-preserved -> every run leaks a registered worktree + node_modules. Fix: remove what the verifier installed itself (or record via existing provisioning record) before removeWorktree; correct CHANGELOG/exemption wording ("occasional").
- MEDIUM: scripts/lib/doc-git-reads.mjs:76 raw cat-file --batch branch only for maxSize>31MiB, used only by test -> drop branch + its exemption row.
- Note: verifiers list changed paths without rename detection (stricter; counts can differ from historical receipts).
- 26 census sites all covered by exemption proposal (1 pre-commit, 5 configured commands, 10 missing-capability, 10 pinned tooling).
## G2/G6 delta (w3-g2g6-delta-review, 103/1) -> final-pin D-turn
- Low REWORK: G6 example-framing check matches only span text (bare path in 726/783 rows) -> confirms nothing; genuine same-line examples now park (f00167, f08807, f07822, f08072, f08073); fix: match bound line / unit_at(); control span = path only.
- f07697, f08033, f08047 propose their own file as successor (L12-35(7) forbids self-link) -> fix.
- --pin covers sources only; register/records read from working tree (registerSha256 differs at 6d275ad81).
- At F: 15 docs changed after pin by 7be0cbc52/6d275ad81 -> 186 G6 rows + 86 wrapper successor digests (runner/spec.md) to refresh. G2 unaffected.
## D1b review (w3-d1b-resync-review, 61/6) -> D1c (after D7, with G0-fix2)
- release-manifest.md:258 kept the broken link ../../host-invocation-routing/legacy-cli-transition.md -> docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md (relative from contracts/).
- packaging-distribution/spec.md:549 row 7 misses the 8 loop-registered Git checks (src/setup/registrations.mjs:6354-6366, git-worktree-recovery .. git-durability-capability); code has 143 checks; fix receipt claim + adjudication 44. Row 7b exact.
- activation-binding.md:488: scripts/fgos-shell-integration.sh does NOT run git rev-parse --git-common-dir (reads layout from disk, lines 27-29, 57-90) -> correct sentence.
- runner/spec.md:56,63-64: fenced "Historical source section 552ef3d6" (verbatim legacy) was edited (rows 1/1b) -> restore verbatim legacy in the fenced block; current truth lives only in runner/subcomponents/h-02842f76ffd2/spec.md; align adjudication 17.
- Pre-existing: duplicates (work-state outcome record in non-transitioning-records.md and spec.md), 69 stale ledger rows pointing at knowledge-registry.md, runner RUL104 number clash with platform RUL104 (legacy origin) -> note for G9; legacy distribution.md row 7 + git-common-dir sentence stale on main (tell main lane).
## D7 review (w3-d7-resync-review, 21/3) -> D7b (after ledger-fix)
- resync-b /unitCarries/125, /132, /247: banners added 9818f25a8 (2026-09-19) BEFORE retirement 2180b4e72 (2026-10-02) -> kind candidate-metadata-adaptation like rows 36/66/89/319, fix reason (not carried stays).
- component-boundary.md still has 8 ../specs/ links: lines 69,70,72 runner.md; 73,74 herdr-web-dashboard.md; 75 confinement-authority.md; 81 observe.md; 281 reading-map.md -> repoint to live successors.
- /bindingRefresh/475 mislabelled "Full unit content preserved" (links changed) -> relabel.
- docs/reading-map.md:125 cites a plan report path in live text (moves at archive) -> fix; platform-foundations.md:416 verbatim carry names old docs/platform-foundations.md path (check intended).
- Launch-note authorization for seat-binding/workflow/knowledge-registry edits came from the Lead's D7 prompt addendum -> record in L13-5.
