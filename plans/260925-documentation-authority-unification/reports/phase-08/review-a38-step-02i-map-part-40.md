# Review a38 step-02i mapping part 40

- Reviewer: reviewer:sonnet-session:aac0f94517d48e145@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree detached at 74e3ecf1eb9a2bc1429f50a25bb7017e240ef798, read-only)
- Part: 40 (writers-and-writer-triage), 60 entries, sourceTable step-02i-census-maps-portals-prose.json
- Method: every entry deep-read (source line and context, role/action variants, mechanicalTargetCheck, successorNote, writerBlock); anchors checked with `node scripts/list-doc-anchors.mjs --check`; for every patch the `old` text was matched against the source line and the `new` relative path resolved from the consumer directory against the HEAD tree (all pass); successor/alias candidates checked in the live platform tree, carriage files and switchboard.

## Totals

- ok: 59
- rework: 0
- needs-Lead-judgment: 1 (maps-i-00995)
- rework rate: 0/60

## Findings

- 59 entries ok. The population is the writer-triage set: 7 true writer/check rows (00458, 00460, 00461-00463, 00487, 00493) parked Step 5 with no executable new; the rest are readers whose consumer block contains a writer-looking verb (to-do lists, provenance tables, link rows) and are correctly NOT writers (L12-24 Settled).
- needs-Lead-judgment: maps-i-00995 only (source-locator "Rewrite spec.md from docs/specs/distribution.md" patched to the portal README; recommend preserve as provenance).
- No rework: all patches mechanically valid; no patch targets carriage or the consumer itself.
- Observation (wording only): maps-i-00802/00808 successorNote says "deleted" for an existing glob target (see part 39).

## Entries

| Entry | Consumer:line | Rule / action | Verdict | Evidence and rationale |
|---|---|---|---|---|
| maps-i-00027 | d/a/agent-coordination/README.md:15 | navigation / cutover-patch-only | ok | Dated transition note citing decision 0062 "in docs/specs/runner.md"; area-README navigation patch is the settled runner.md class mapping (runner split, README is the portal). ok. |
| maps-i-00138 | d/a/agent-coordination/architecture/run-handle.md:100 | navigation / cutover-patch-only | ok | Reference resolves at HEAD; patch `old` matches the source span, `new` resolves from the consumer dir to an existing target and anchor ok. Class: navigation. ok. |
| maps-i-00167 | d/a/agent-coordination/contracts/README.md:14 | operative-read / cutover-patch-only | ok | Operative read ("Read the Vision first") maps to the exact retained file docs/platform/agent-coordination/vision.md (L12-21 operative reads). Patch relative path verified. ok. |
| maps-i-00176 | d/a/agent-coordination/contracts/assignment-run-runresult.md:138 | navigation / cutover-patch-only | ok | Reference resolves at HEAD; patch `old` matches the source span, `new` resolves from the consumer dir to an existing target. Class: navigation. ok. |
| maps-i-00181 | d/a/agent-coordination/contracts/coordination-session.md:33 | navigation / preserve-pending-target | ok | Platform playbooks dir has no mvp6-dogfood-handoff.md; only the retired-engine carriage exists, so no executable patch into carriage (L12-21/24); parked for Step 3 to pick a retained passage. ok. |
| maps-i-00183 | d/a/agent-coordination/contracts/coordination-session.md:76 | navigation / cutover-patch-only | ok | Prose pointer to a verification index; same-path mirror docs/platform/.../step-09-mvp6-to-mvp9/index.md exists (L12-22). ok. |
| maps-i-00326 | d/a/agent-coordination/documentation-standardization-plan.md:159 | provenance / preserve | ok | Row in migration-plan §4.4 file list; source-locator/provenance, target is the carriage copy; preserve (L12-21.4, L12-25.4). ok. |
| maps-i-00327 | d/a/agent-coordination/documentation-standardization-plan.md:160 | provenance / preserve | ok | Same class as 00326 (ADR-010 carriage). ok. |
| maps-i-00328 | d/a/agent-coordination/documentation-standardization-plan.md:161 | provenance / preserve | ok | Same class as 00326; ADR-011 lives in live platform decisions, owner exists; preserve as provenance. ok. |
| maps-i-00455 | d/a/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1554 | navigation / cutover-patch-only | ok | Evidence link to verification P00.1.md; same-path mirror exists (L12-22). ok. |
| maps-i-00458 | d/a/agent-coordination/playbooks/coordination-operating-harness.md:121 | live-evidence-writer / preserve-pending-behavioral-proof | ok | Target failure is a placeholder (`<track>`) path, not a missing file; the mirror dir `docs/platform/agent-coordination/verification/` exists with the real tracks. Trace-layout writer block (heading 5). Writer row for Step 5, destination and checks together, no executable new (L12-22.1, L12-19 evidence-181). ok. |
| maps-i-00460 | d/a/agent-coordination/playbooks/coordination-operating-harness.md:413 | live-evidence-writer / preserve-pending-behavioral-proof | ok | Placeholder path (`<track>/proofs/<cell-id>/`), live proof-capture write destination in the harness playbook. Behavioral Step 5, parked. ok. |
| maps-i-00461 | d/a/agent-coordination/playbooks/coordination-operating-harness.md:465 | live-evidence-writer / preserve-pending-behavioral-proof | ok | `test -s` check on verification index in playbook section 13 "Tests And Checks": behavioral check that must move with the evidence payload (L12-19 evidence-181 treatment). Step 5. ok. |
| maps-i-00462 | d/a/agent-coordination/playbooks/coordination-operating-harness.md:466 | live-evidence-writer / preserve-pending-behavioral-proof | ok | Same as 00461 (current-cell.md check line 466). ok. |
| maps-i-00463 | d/a/agent-coordination/playbooks/coordination-operating-harness.md:467 | live-evidence-writer / preserve-pending-behavioral-proof | ok | Same as 00461 (rg check, line 467). ok. |
| maps-i-00487 | d/a/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md:776 | live-evidence-writer / preserve-pending-behavioral-proof | ok | `EVIDENCE_DIR:` example value in the paste block: writer row (L12-22.1); the sibling ROSTER_SOURCE line is covered separately as maps-i-00488 (operative-read patch). ok. |
| maps-i-00493 | d/a/agent-coordination/playbooks/prompts/master-coordinator.md:158 | live-evidence-writer / preserve-pending-behavioral-proof | ok | Placeholder `<TRACK>`; `<REPO_ROOT>/` prefix leaves a leading `/` in the matched token but patch is null so no byte effect. Master prompt write destination, behavioral Step 5 (L12-19 evidence-182). ok. |
| maps-i-00546 | d/a/agent-coordination/proposals/dispatch-control-plane-redesign.md:892 | retained-history / preserve | ok | Citation of a docs/history plan; docs/history is retained (L12-22); file exists at HEAD. preserve. ok. |
| maps-i-00792 | d/a/documentation-system-design.md:657 | navigation / cutover-patch-only | ok | Design-doc next-steps list ("Promote ... into"): planning narrative / navigation, not a writer (L12-24 Settled). Patch resolves to docs/platform/governance.md. ok. |
| maps-i-00793 | d/a/documentation-system-design.md:658 | navigation / cutover-patch-only | ok | Same narrative class ("Create or update docs/README.md"); docs/README.md is a legacy-current switchboard row (L74) mapped to the docs portal, consistent with 9 other navigation rows. ok. |
| maps-i-00794 | d/a/documentation-system-design.md:658 | retained-reference / preserve | ok | docs/reading-map.md is a retained root file, preserved as its own target (L12-23). ok. |
| maps-i-00801 | d/a/documentation-system-discussion.md:53 | retained-reference / preserve | ok | docs/doc-registry.md retained generated file; preserve. ok. |
| maps-i-00802 | d/a/documentation-system-discussion.md:57 | ui-spec-self-reference / preserve | ok | Glob of retained docs/ui-spec/generated (exists); preserve (L12-24.5). Same wording observation as part 39 (successorNote says "deleted"). ok. |
| maps-i-00807 | d/a/documentation-system-discussion.md:159 | retained-reference / preserve | ok | Retained generated registry mention in generator table; preserve. ok. |
| maps-i-00808 | d/a/documentation-system-discussion.md:160 | ui-spec-self-reference / preserve | ok | Same as 00802. ok. |
| maps-i-00880 | d/a/host-invocation-routing/documentation-standardization-plan.md:88 | provenance / preserve | ok | Source-locator table in the host-invocation documentation-standardization plan; provenance, preserved; target file exists in live platform architecture. ok. |
| maps-i-00881 | d/a/host-invocation-routing/documentation-standardization-plan.md:89 | provenance / preserve | ok | Same as 00880. ok. |
| maps-i-00882 | d/a/host-invocation-routing/documentation-standardization-plan.md:90 | provenance / preserve | ok | Same provenance class; source file still exists at HEAD, split doc so the area README as lookup owner is acceptable; no patch. ok. |
| maps-i-00883 | d/a/host-invocation-routing/documentation-standardization-plan.md:91 | provenance / preserve | ok | Same as 00882. ok. |
| maps-i-00913 | d/a/host-invocation-routing/host-invocation-provider-routing.md:111 | navigation / cutover-patch-only | ok | Prose link; exact retained file architecture/legacy-cli-transition.md exists; patch relative path verified. ok. |
| maps-i-00954 | d/a/knowledge-registry-redesign.md:626 | navigation / preserve-pending-target | ok | Cited legacy spec has no platform destination: switchboard row 61 classes enduser specs as non-authority, no successor; parking for Step 3 with no owner is right. ok. |
| maps-i-00955 | d/a/knowledge-registry-redesign.md:627 | navigation / preserve-pending-target | ok | Same as 00954. ok. |
| maps-i-00959 | d/a/packaging-distribution/README.md:41 | navigation / cutover-patch-only | ok | Link to workspace-topology.md; live successor docs/platform/system-architecture/architecture/workspace-topology.md exists; patch verified. ok. |
| maps-i-00966 | d/a/packaging-distribution/history/distribution-baseline.md:56 | provenance / preserve | ok | "Source" column of distribution-baseline (provenance table); docs/specs/platform-foundations.md is a non-authority projection with no destination (switchboard row 49). Preserve. ok. |
| maps-i-00967 | d/a/packaging-distribution/history/distribution-baseline.md:57 | provenance / preserve | ok | Same as 00966. ok. |
| maps-i-00968 | d/a/packaging-distribution/history/distribution-baseline.md:58 | provenance / preserve | ok | Same as 00966. ok. |
| maps-i-00969 | d/a/packaging-distribution/history/distribution-baseline.md:59 | provenance / preserve | ok | Provenance Source column; preserve. ok. |
| maps-i-00970 | d/a/packaging-distribution/history/distribution-baseline.md:60 | provenance / preserve | ok | Provenance Source column; reading-map follows frozen decision to docs/reading-map.md. preserve. ok. |
| maps-i-00971 | d/a/packaging-distribution/history/distribution-baseline.md:61 | provenance / preserve | ok | Provenance Source column; preserve. ok. |
| maps-i-00972 | d/a/packaging-distribution/history/distribution-baseline.md:62 | provenance / preserve | ok | Provenance Source column; herdr-web-dashboard spec mapped to platform spec. preserve. ok. |
| maps-i-00973 | d/a/packaging-distribution/history/distribution-baseline.md:63 | provenance / preserve | ok | Provenance Source column; preserve. ok. |
| maps-i-00974 | d/a/packaging-distribution/history/distribution-baseline.md:64 | provenance / preserve | ok | Provenance Source column; preserve. ok. |
| maps-i-00988 | d/a/packaging-distribution/migration-map.md:100 | navigation / cutover-patch-only | ok | "Evidence" cell in the alignment seed pointing at a real architect file; successor exists under platform/packaging-distribution/architecture; patch verified. ok. |
| maps-i-00989 | d/a/packaging-distribution/migration-map.md:104 | navigation / cutover-patch-only | ok | Evidence cell citing docs/specs/distribution.md; distribution spec is split so the portal README is the class mapping (58 rows). ok (class mapping is lookup-grade). |
| maps-i-00990 | d/a/packaging-distribution/migration-map.md:105 | navigation / cutover-patch-only | ok | Same as 00989. ok. |
| maps-i-00995 | d/a/packaging-distribution/migration-map.md:114 | navigation / cutover-patch-only | needs-Lead-judgment | Work-order step 3: "Rewrite `spec.md` from `docs/specs/distribution.md` and `README.md`" in a migration plan (migration-map.md section 7). The `from` token is a source locator of this very migration (L12-23: source references of a migration plan are provenance). The patch would read "Rewrite spec.md from docs/platform/packaging-distribution/README.md and README.md", which is semantically wrong (the new portal is not the rewrite input). Class rule is ambiguous between navigation to-do list (L12-24) and source locator (L12-23/25.4). Lead decides: recommend preserve as provenance (action cutover-patch-only -> preserve). Sibling 00989/00990 (Evidence column) are fine. |
| maps-i-01022 | d/a/packaging-distribution/scope-map.md:44 | navigation / cutover-patch-only | ok | Scope-map table cell; docs/architect/component-boundary/README.md mapped to promoted anchor docs/platform/component-boundary.md (its own Provenance header says promoted anchor for that dir). Patch verified. ok. |
| maps-i-01024 | d/a/packaging-distribution/scope-map.md:53 | navigation / cutover-patch-only | ok | Same as 01022. ok. |
| maps-i-01052 | d/a/proposals/component-authority-boundary-map.md:192 | navigation / cutover-patch-only | ok | Table cell link to live platform dispatch-control-plane.md; patch verified. ok. |
| maps-i-01054 | d/a/proposals/component-authority-boundary-map.md:497 | navigation / cutover-patch-only | ok | Anchor `9-hexagonal-architecture-view` resolves at HEAD (heading L475 "9. Hexagonal Architecture View"); advisory content promoted into component-boundary.md. ok. |
| maps-i-01055 | d/a/proposals/component-authority-boundary-map.md:497 | navigation / cutover-patch-only | ok | Second link in the same table row as 01054; patch verified. ok. |
| maps-i-01084 | d/a/proposals/coordination-envelope-progress.md:42 | navigation / cutover-patch-only | ok | Link to verification result report; same-path mirror exists. ok. |
| maps-i-01085 | d/a/proposals/coordination-envelope-progress.md:45 | navigation / cutover-patch-only | ok | Link to proposals sibling; platform copy exists; relative patch ../../platform/proposals verified. ok. |
| maps-i-01185 | d/a/proposals/visibility-and-interactive-contact-herdr-spawn.md:113 | navigation / cutover-patch-only | ok | Prose citation of RUL40 in runner.md; README portal is the class mapping; RUL40 lives in a runner subcomponent spec so exact-file mapping is not unique. ok. |
| maps-i-01187 | d/a/proposals/visibility-and-interactive-contact-herdr-spawn.md:493 | navigation / cutover-patch-only | ok | Evidence link under visibility-herdr proofs; mirror exists. ok. |
| maps-i-01188 | d/a/proposals/visibility-and-interactive-contact-herdr-spawn.md:500 | navigation / preserve-pending-target | ok | Brace list expanded into two edges over one span; Step 3 chooses whole-unit list rewrite, no executable new (L12-21 brace lists). Both files verified in platform mirror. ok. |
| maps-i-01189 | d/a/proposals/visibility-and-interactive-contact-herdr-spawn.md:500 | navigation / preserve-pending-target | ok | Second half of the brace expansion in 01188. ok. |
| maps-i-01190 | d/a/proposals/visibility-and-interactive-contact-herdr-spawn.md:516 | navigation / cutover-patch-only | ok | Statement about RUL40 re-scope already done (2026-09-06) citing runner.md; class mapping to README. ok. |
| maps-i-01191 | d/a/proposals/visibility-and-interactive-contact-herdr-spawn.md:516 | retained-reference / preserve | ok | `docs/backlog.md:84` is a retained generated root file with a line locator; preserve whole, never patched (L12-24.1, L12-25.8). ok. |
| maps-i-01196 | d/a/roadmap.md:252 | legacy-tree-semantic / preserve-pending-target | ok | Whole-root mention of `docs/architect/`: legacy-tree-semantic, Step 3 rewrites the sentence, never path substitution (L12-24.2). ok. |
