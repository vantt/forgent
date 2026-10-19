# Review a38 step-02i mapping part 87

- Reviewer: reviewer:sonnet-session:aab0189f7e2b3d4db@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree HEAD 74e3ecf1eb9a2bc1429f50a25bb7017e240ef798)
- Part: 87 (seeded-semantic-edge-sample), 60 entries, source table step-02i-census-maps-portals-prose.json
- Method: every entry read in its committed consumer context; patch targets resolved against the committed tree (all 44 patch targets exist except one false negative that resolves correctly as relative form); promoted targets inspected for section locators and exact-file counterparts.

## Totals

ok 44, rework 13, needs-Lead-judgment 3 (rework 21.7%)

Rework: maps-i-00926, maps-i-00934, maps-i-00946, maps-i-01115, maps-i-01176, maps-i-01190, maps-i-01210, maps-i-01218, maps-i-01220, maps-i-01221, maps-i-01225, maps-i-01226, maps-i-01255

Needs-Lead-judgment: maps-i-00998, maps-i-01012, maps-i-01056

## Defect classes (rework)

- D1 locator does not resolve in new target: 4, 6 (maps-i-00926, maps-i-00934)
- D2 area spec/exact file mapped to README portal: 9, 50, 52 (maps-i-00946, 01176, 01210) (also 88 entry maps-i-01510)
- D3 label/target mismatch, carriage-only target should park: maps-i-01115
- D4 historical text patched (past-tense recount, retired decision-record body): maps-i-01190, 01218, 01220, 01221, 01225, 01226
- D7 hand-maintained backlog.md classed generated: maps-i-01255

Judgment: pair-collapse on reading-map pair (maps-i-00998, 01012); legacy-tree statement mirror-patched (maps-i-01056).

## Entries

| # | edge | consumer line | role/action | verdict | note |
|---|---|---|---|---|---|
| 1 | maps-i-00916 | docs/architect/host-invocation-routing/host-invocation-provider-routing.md L242 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 2 | maps-i-00917 | docs/architect/host-invocation-routing/host-invocation-provider-routing.md L246 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 3 | maps-i-00922 | docs/architect/host-invocation-routing/host-invocation-provider-routing.md L251 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 4 | maps-i-00924 | docs/architect/host-invocation-routing/legacy-cli-transition.md L44 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 5 | maps-i-00926 | docs/architect/host-invocation-routing/legacy-cli-transition.md L46 | reader/cutover-patch-only | rework | [D1]  Link patch is fine, but the trailing "§5" (release manifest) does not resolve in the promoted target: its section 5 is "Stable Command Surface" and the carriage has no heading 5. Re-anchor to contracts/release-manifest.md or park. |
| 6 | maps-i-00929 | docs/architect/host-invocation-routing/legacy-cli-transition.md L97 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 7 | maps-i-00934 | docs/architect/host-invocation-routing/node-to-rust-component-migration.md L191 | reader/cutover-patch-only | rework | [D1]  "§11–§13" follows the link. Promoted target has no §12/§13 (Command Authority Matrix, fgctl form are not carried) and its own §11 only exists inside carriage. Locator cannot resolve; re-anchor or park for Step 3. |
| 8 | maps-i-00940 | docs/architect/host-invocation-routing/node-to-rust-component-migration.md L426 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 9 | maps-i-00943 | docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md L10 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 10 | maps-i-00946 | docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md L90 | reader/cutover-patch-only | rework | [D2]  Statement is about docs/specs/distribution.md as a spec ("regenerated from it"). Exact promoted spec docs/platform/packaging-distribution/spec.md exists; patch points at the area README (L12-22: area spec maps to spec.md, not README). |
| 11 | maps-i-00947 | docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md L116 | reader/preserve-pending-target | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 12 | maps-i-00948 | docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md L147 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 13 | maps-i-00958 | docs/architect/knowledge-registry-redesign.md L743 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 14 | maps-i-00962 | docs/architect/packaging-distribution/README.md L61 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 15 | maps-i-00967 | docs/architect/packaging-distribution/history/distribution-baseline.md L57 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 16 | maps-i-00974 | docs/architect/packaging-distribution/history/distribution-baseline.md L64 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 17 | maps-i-00981 | docs/architect/packaging-distribution/migration-map.md L69 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 18 | maps-i-00997 | docs/architect/packaging-distribution/migration-map.md L139 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 19 | maps-i-00998 | docs/architect/packaging-distribution/migration-map.md L139 | reader/cutover-patch-only | needs-Lead-judgment | [D6]  Frozen reading-map rule applies, but the patch yields "docs/reading-map.md and legacy docs/reading-map.md agree" (pair collapses to one file). Lead to decide: preserve as migration-plan narrative or Step 3 sentence rewrite. |
| 20 | maps-i-01000 | docs/architect/packaging-distribution/rewrite-plan.md L30 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 21 | maps-i-01007 | docs/architect/packaging-distribution/rewrite-plan.md L37 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 22 | maps-i-01012 | docs/architect/packaging-distribution/rewrite-plan.md L193 | reader/cutover-patch-only | needs-Lead-judgment | [D6]  Same pair-collapse: "update docs/reading-map.md and legacy docs/specs/reading-map.md" would read as the same file twice. |
| 23 | maps-i-01017 | docs/architect/packaging-distribution/runtime-identity-and-activation.md L42 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 24 | maps-i-01021 | docs/architect/packaging-distribution/scope-map.md L41 | reader/cutover-patch-only | ok |  Patch uses repo-root form where old was relative; adjacent cells of the same column use repo-root form, so acceptable (note only). |
| 25 | maps-i-01022 | docs/architect/packaging-distribution/scope-map.md L44 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 26 | maps-i-01027 | docs/architect/packaging-distribution/scope-map.md L90 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 27 | maps-i-01030 | docs/architect/packaging-distribution/workspace-runtime-model.md L26 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 28 | maps-i-01031 | docs/architect/packaging-distribution/workspace-runtime-model.md L31 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 29 | maps-i-01032 | docs/architect/proposals/README.md L18 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 30 | maps-i-01044 | docs/architect/proposals/component-authority-boundary-map.md L8 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 31 | maps-i-01048 | docs/architect/proposals/component-authority-boundary-map.md L8 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 32 | maps-i-01050 | docs/architect/proposals/component-authority-boundary-map.md L8 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 33 | maps-i-01052 | docs/architect/proposals/component-authority-boundary-map.md L192 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 34 | maps-i-01056 | docs/architect/proposals/component-authority-boundary-map.md L603 | reader/cutover-patch-only | needs-Lead-judgment | [D5]  Sentence states how the legacy docs/architect/agent-coordination/ tree is organised (section on organisation pressure). Directory-mirror substitution makes the claim about the promoted tree; L12-24 treats statements about the legacy tree as park-for-Step-3. Lead to rule whether sub-root mirror rule overrides. |
| 35 | maps-i-01064 | docs/architect/proposals/coordination-capability-envelope.md L24 | reader/preserve-pending-target | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 36 | maps-i-01065 | docs/architect/proposals/coordination-capability-envelope.md L25 | reader/preserve-pending-target | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 37 | maps-i-01083 | docs/architect/proposals/coordination-envelope-progress.md L40 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 38 | maps-i-01091 | docs/architect/proposals/coordination-envelope-progress.md L143 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 39 | maps-i-01099 | docs/architect/proposals/coordination-worker-provider-boundary.md L13 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 40 | maps-i-01110 | docs/architect/proposals/group-thinking-plan-loop.md L108 | reader/preserve-pending-target | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 41 | maps-i-01115 | docs/architect/proposals/step-09-group-thinking-substrate.md L34 | reader/cutover-patch-only | rework | [D3]  Label "Agent Coordination Intent Preservation Ledger" points to area README. The only promoted copy of the ledger lives in history/retired-engine carriage, so the right action is park (like sibling rows 34/35, 41), not a README patch with a mismatched label. |
| 42 | maps-i-01117 | docs/architect/proposals/step-09-group-thinking-substrate.md L36 | reader/preserve-pending-target | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 43 | maps-i-01122 | docs/architect/proposals/step-09-group-thinking-substrate.md L41 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 44 | maps-i-01123 | docs/architect/proposals/step-09-group-thinking-substrate.md L42 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 45 | maps-i-01137 | docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md L42 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 46 | maps-i-01156 | docs/architect/proposals/step-10-a0-coding-domain-boundary-facade-plan.md L293 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 47 | maps-i-01163 | docs/architect/proposals/step-10-coding-domain-adoption.md L18 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 48 | maps-i-01166 | docs/architect/proposals/step-10-coding-domain-adoption.md L21 | reader/preserve-pending-target | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 49 | maps-i-01169 | docs/architect/proposals/step-10-coding-domain-adoption.md L25 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 50 | maps-i-01173 | docs/architect/proposals/step-10-coding-domain-adoption.md L326 | reader/cutover-patch-only | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 51 | maps-i-01176 | docs/architect/proposals/step-10-coding-domain-adoption.md L654 | reader/cutover-patch-only | rework | [D2]  Promoted exact file exists (architecture/node-to-rust-migration.md, "Promoted from ...node-to-rust-component-migration.md"). Patch targets the area README; should be the exact file (name-drift successor). |
| 52 | maps-i-01190 | docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md L516 | reader/cutover-patch-only | rework | [D4]  Recounts a completed dated action ("đã làm 2026-09-06") on docs/specs/runner.md RUL40 = historical preserve. Patch also targets runner README, which does not hold RUL40. |
| 53 | maps-i-01210 | docs/architecture-map.md L372 | reader/cutover-patch-only | rework | [D2]  "spec `docs/specs/confinement-authority.md`" is a spec reference; docs/platform/agent-confinement/spec.md exists but patch targets README. |
| 54 | maps-i-01218 | docs/architecture-map.md L599 | reader/cutover-patch-only | rework | [D4]  Line sits in the retired decision record 0010 (heading "Lịch sử quyết định retired", L585+) and recounts how the document was written (past tense). Historical preserve; patch is wrong. |
| 55 | maps-i-01220 | docs/architecture-map.md L622 | reader/cutover-patch-only | rework | [D4]  Inside decision record 0010 outcome list; decision-record text is historical preserve. |
| 56 | maps-i-01221 | docs/architecture-map.md L638 | reader/cutover-patch-only | rework | [D4]  Inside decision record 0015 "Bối cảnh"; historical preserve, not a cutover patch. |
| 57 | maps-i-01222 | docs/architecture-map.md L667 | reader/preserve | ok |  Consumer passage read in context; role, action, target and patch (if any) consistent. |
| 58 | maps-i-01225 | docs/architecture-map.md L717 | reader/cutover-patch-only | rework | [D4]  Inside decision record 0017 consequences; historical preserve. |
| 59 | maps-i-01226 | docs/architecture-map.md L717 | reader/cutover-patch-only | rework | [D4]  Same decision record 0017 passage, self-reference to the consumer file; historical preserve. |
| 60 | maps-i-01255 | docs/backlog.md L111 | generator/preserve-pending-behavioral-proof | rework | [D7]  docs/backlog.md is a hand-maintained retained file (Lead ruling), but the row is classed generated and parked on a Step 5 generator proof. Needs ordinary classification (decided-at citation of a moved doc). |
