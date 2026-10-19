# Review a38 step-02j map part 18

- Reviewer: reviewer:sonnet-session:a0ab036d5de033b59@2026-10-19
- Commits: reviewed tree `6235d0151` (accounting), author `9650bdee6`; read-only worktree `/home/vantt/projects/forgentX-s8-review` verified detached at `6235d01516e5`
- Part: 18 (seeded-semantic-edge-sample, 60 entries, `step-02j-census-maps-portals-prose.json`)
- Rule set: L12-26 classes 1-10, L12-7, L12-10, L12-19..L12-27; Lead rulings applied (doc-registry lookup data preserved; desiredOwner on preserved rows non-actionable; non-doc relative command paths not edges)

## Totals

- ok 54 / rework 5 / needs-Lead-judgment 1 of 60
- rework rate: 8.3% (limit 3%); rework + judgment: 10.0%
- rework ids: maps-j-06823, maps-j-06826, maps-j-06890, maps-j-06921, maps-j-07192
- needs-Lead-judgment ids: maps-j-07211

## Rows

| # | edge | consumer:line | action / status | verdict | defect class | rationale |
|---|---|---|---|---|---|---|
| 1 | maps-j-06807 | `documentation/history/proposals-redesigns/documentation-system-discussion.md:1649` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 2 | maps-j-06813 | `documentation/history/templates/contract.md:18` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 3 | maps-j-06821 | `documentation/operations/portals/docs-portal.md:48` | phase9-row-flip / row-flip-pending | ok |  | Migration-state/status cell correctly routed to Phase 9 row flip. |
| 4 | maps-j-06823 | `documentation/operations/portals/docs-portal.md:58` | cutover-patch-only / proposed-only | rework | class 7 (not fully fixed) | Patch label becomes `[../../../../reading-map.md]`, a form neither the old label (`specs/reading-map.md`, pathTextLabel=false) nor a basename; sibling line 56 already uses `[reading-map.md](../../../../reading-map.md)`. Label must follow destination in its original form (`reading-map.md`). Target/anchor correct per frozen reading-map decision. |
| 5 | maps-j-06826 | `documentation/switchboard.md:33` | preserve-pending-target / blocked | rework | class 6 (not fully fixed) | Line 33 is switchboard header principle 2 ("All other platform areas remain `legacy-current` under `docs/specs/**` or root documents") which class 6 names as a Phase 9 row flip; row is parked `preserve-pending-target` "No unique exact mapping" instead. |
| 6 | maps-j-06829 | `documentation/switchboard.md:49` | phase9-row-flip / row-flip-pending | ok |  | Migration-state/status cell correctly routed to Phase 9 row flip. |
| 7 | maps-j-06836 | `documentation/switchboard.md:51` | phase9-row-flip / row-flip-pending | ok |  | Migration-state/status cell correctly routed to Phase 9 row flip. |
| 8 | maps-j-06838 | `documentation/switchboard.md:52` | phase9-row-flip / row-flip-pending | ok |  | Migration-state/status cell correctly routed to Phase 9 row flip. |
| 9 | maps-j-06844 | `documentation/switchboard.md:53` | phase9-row-flip / row-flip-pending | ok |  | Migration-state/status cell correctly routed to Phase 9 row flip. |
| 10 | maps-j-06852 | `documentation/switchboard.md:56` | phase9-row-flip / row-flip-pending | ok |  | Migration-state/status cell correctly routed to Phase 9 row flip. |
| 11 | maps-j-06857 | `documentation/switchboard.md:58` | phase9-row-flip / row-flip-pending | ok |  | Migration-state/status cell correctly routed to Phase 9 row flip. |
| 12 | maps-j-06858 | `documentation/switchboard.md:59` | phase9-row-flip / row-flip-pending | ok |  | Migration-state/status cell correctly routed to Phase 9 row flip. |
| 13 | maps-j-06859 | `documentation/switchboard.md:60` | phase9-row-flip / row-flip-pending | ok |  | Migration-state/status cell correctly routed to Phase 9 row flip. |
| 14 | maps-j-06866 | `documentation/switchboard.md:63` | phase9-row-flip / row-flip-pending | ok |  | Migration-state/status cell correctly routed to Phase 9 row flip. |
| 15 | maps-j-06874 | `documentation/switchboard.md:74` | phase9-row-flip / row-flip-pending | ok |  | Migration-state/status cell correctly routed to Phase 9 row flip. |
| 16 | maps-j-06890 | `documentation/switchboard.md:107` | preserve / preserved | rework | class 3 misapplied to a retiring root / class 6 | Line 107 (switchboard rule 6 "For authors during migration ... Edits under legacy roots (`docs/specs`, `docs/architect`) require a reviewed exception") is migration-state text. `docs/architect` is a retiring root (class 3 excludes docs/specs/** and docs/architect/**), so "committed retained file; no retirement alias" preserve is wrong; row flip or park for Step 3. |
| 17 | maps-j-06912 | `governance.md:499` | preserve / preserved | ok |  | Preserve (self/lineage/provenance) correct. |
| 18 | maps-j-06914 | `herdr-web-dashboard/README.md:17` | cutover-patch-only / proposed-only | ok |  | Patch target/anchor and form verified against committed tree; consumer is live wrapper/navigation. |
| 19 | maps-j-06919 | `herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml:54` | preserve-pending-behavioral-proof / blocked | ok |  | Parked with explicit blocked status; reason fits (behavioral Step 5 / target pending). |
| 20 | maps-j-06921 | `herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml:205` | preserve-pending-target / blocked | rework | class 5 / class 2 (not fully fixed) | YAML comment (prose, class 4) "Confirmed via a real `fgos show` run (docs/history/tsk-4id-task-detail-screen/RESEARCH.md)" is a dated evidence citation; target is deleted (verified missing). Expected `preserve` with deleted-target note like the sibling deleted-history rows, not blocked/parked. |
| 21 | maps-j-06930 | `herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml:739` | preserve-pending-behavioral-proof / blocked | ok |  | Parked with explicit blocked status; reason fits (behavioral Step 5 / target pending). |
| 22 | maps-j-06936 | `herdr-web-dashboard/spec.md:17` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 23 | maps-j-06942 | `herdr-web-dashboard/spec.md:41` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 24 | maps-j-06950 | `herdr-web-dashboard/spec.md:337` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 25 | maps-j-06951 | `herdr-web-dashboard/spec.md:340` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 26 | maps-j-06962 | `host-invocation-routing/architecture/README.md:48` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 27 | maps-j-06963 | `host-invocation-routing/architecture/external-provider-protocol.md:16` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 28 | maps-j-06968 | `host-invocation-routing/architecture/external-provider-protocol.md:52` | preserve / preserved | ok |  | Preserve (self/lineage/provenance) correct. |
| 29 | maps-j-06980 | `host-invocation-routing/architecture/invocation-kernel.md:52` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 30 | maps-j-06983 | `host-invocation-routing/architecture/legacy-cli-transition.md:16` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 31 | maps-j-06988 | `host-invocation-routing/architecture/legacy-cli-transition.md:52` | preserve / preserved | ok |  | Preserve (self/lineage/provenance) correct. |
| 32 | maps-j-06989 | `host-invocation-routing/architecture/legacy-cli-transition.md:56` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 33 | maps-j-07010 | `host-invocation-routing/architecture/node-to-rust-migration.md:411` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 34 | maps-j-07034 | `host-invocation-routing/contracts/component-protocol.md:144` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 35 | maps-j-07042 | `host-invocation-routing/contracts/external-provider-manifest.md:43` | preserve-pending-target / blocked | ok |  | Parked with explicit blocked status; reason fits (behavioral Step 5 / target pending). |
| 36 | maps-j-07043 | `host-invocation-routing/contracts/legacy-payload.md:16` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 37 | maps-j-07061 | `host-invocation-routing/history/source-inventory.md:25` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 38 | maps-j-07072 | `host-invocation-routing/intent-preservation-ledger.md:63` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 39 | maps-j-07073 | `host-invocation-routing/intent-preservation-ledger.md:64` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 40 | maps-j-07074 | `host-invocation-routing/intent-preservation-ledger.md:65` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 41 | maps-j-07077 | `host-invocation-routing/intent-preservation-ledger.md:67` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 42 | maps-j-07083 | `host-invocation-routing/intent-preservation-ledger.md:72` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 43 | maps-j-07109 | `host-invocation-routing/intent-preservation-ledger.md:91` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 44 | maps-j-07116 | `host-invocation-routing/intent-preservation-ledger.md:96` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 45 | maps-j-07126 | `host-invocation-routing/roadmap.md:955` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 46 | maps-j-07139 | `host-invocation-routing/verification/r2-external-process-proof.md:46` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 47 | maps-j-07147 | `host-invocation-routing/verification/source-preservation-audit.md:39` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 48 | maps-j-07154 | `host-invocation-routing/verification/source-preservation-audit.md:41` | preserve / preserved | ok |  | Target exists outside retiring roots (or live platform file); preserve correct. |
| 49 | maps-j-07158 | `host-invocation-routing/verification/source-preservation-audit.md:43` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 50 | maps-j-07173 | `intent-preservation-ledger.md:72` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 51 | maps-j-07176 | `intent-preservation-ledger.md:77` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 52 | maps-j-07192 | `migration-authoring-rules.md:55` | preserve / preserved | rework | class 3 misapplied to a retiring root / class 6 | Line 55 in migration-authoring-rules.md: "under `docs/specs` or `docs/architect` ... fails the ratchet" is a rule about the legacy trees/ratchet (ratchet retires with them). Preserved as "retained file" although `docs/architect` is retiring; must be row flip/park. |
| 53 | maps-j-07208 | `packaging-distribution/README.md:11` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 54 | maps-j-07211 | `packaging-distribution/README.md:157` | cutover-patch-only / proposed-only | needs-Lead-judgment | class 6 vs class 8 duplicate | Line 157 table cell "Current detailed source" names the legacy advisory; migration-state-style cell (class 6 row flip) and the patch would duplicate the preceding "Boundary anchor | docs/platform/component-boundary.md" row. Patch target itself is valid. |
| 55 | maps-j-07215 | `packaging-distribution/README.md:208` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 56 | maps-j-07235 | `packaging-distribution/code-panel-rollout-plan.md:339` | preserve-pending-target / blocked | ok |  | Parked with explicit blocked status; reason fits (behavioral Step 5 / target pending). |
| 57 | maps-j-07236 | `packaging-distribution/contracts/activation-binding.md:151` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 58 | maps-j-07237 | `packaging-distribution/contracts/distribution-pin.md:86` | cutover-patch-only / proposed-only | ok |  | Patch target/anchor and form verified against committed tree; consumer is live wrapper/navigation. |
| 59 | maps-j-07238 | `packaging-distribution/contracts/distribution-pin.md:93` | preserve / preserved | ok |  | Historical/provenance/carriage text preserved; region verified. |
| 60 | maps-j-07245 | `packaging-distribution/contracts/repository-runtime-layout.md:19` | cutover-patch-only / proposed-only | ok |  | Patch target/anchor and form verified against committed tree; consumer is live wrapper/navigation. |
