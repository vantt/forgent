# A50 mapping-level review, step-02c, logical part 29

- Reviewer: reviewer:sonnet-session:af117678215c7a0c3@2026-10-19
- Pinned HEAD: 2854c92ff813a9247c3864bc5f2506db7f793cec (read-only worktree /home/vantt/projects/forgentX-s8-review); author commit e064f8bd5, accounting 2854c92ff
- Part: 29 (population preserve-pending-target, 15 entries, sourceTable step-02c-census-maps-portals-prose.json)
- Overlays: no entry of this part is in the slice-1, slice-2 or wrapped-rescan overlays; original table rows are effective.
- Scope: every entry deep-read (consumer span, context, effective target, twin rows, successor search in docs/platform, plan.md, switchboard, slice-1 precedents; behavioral rows traced to scripts/check-decision-citation-drift.mjs).
- L12-7: all pending rows carry no `new`/patch; cutover-patch-only consumers in docs/specs/** or docs/architect/** need no edit. L12-10 not engaged. L12-20: live refs to retiring paths without an exact patch are flagged rework.

## Totals

ok 13 / rework 2 / needs-Lead-judgment 0 (of 15)

## Rows

| Entry | Consumer | Reference | Verdict | Rationale |
|---|---|---|---|---|
| maps-05335 | docs/transitional-switchboard.md:58 | `docs/architect/agent-coordination/**` | ok | Glob docs/architect/agent-coordination/** in a switchboard route table row (retained/subordinate and role columns); glob has no single owner; the switchboard itself keeps exact contracts there until superseded. Parked right. |
| maps-05337 | docs/transitional-switchboard.md:58 | `docs/architect/agent-coordination/**` | ok | Glob docs/architect/agent-coordination/** in a switchboard route table row (retained/subordinate and role columns); glob has no single owner; the switchboard itself keeps exact contracts there until superseded. Parked right. |
| maps-05343 | docs/transitional-switchboard.md:62 | `docs/specs/enduser-docs-authoring.md` | ok | Route cell naming docs/specs/enduser-docs-*.md; no docs/platform successor exists (grep docs/platform, plan.md, ledger) and switchboard routes this corpus only to those specs. Genuinely unsettled; parked right. |
| maps-05344 | docs/transitional-switchboard.md:62 | `docs/specs/enduser-docs-index.md` | ok | Route cell naming docs/specs/enduser-docs-*.md; no docs/platform successor exists (grep docs/platform, plan.md, ledger) and switchboard routes this corpus only to those specs. Genuinely unsettled; parked right. |
| maps-05350 | docs/transitional-switchboard.md:67 | `docs/ui-spec/**` | ok | Glob docs/ui-spec/** in the route cell. docs/ui-spec/00-overview.md alone is mapped (mapping-0985 -> docs/platform/ui-spec/spec.md) but the glob covers generator-owned content (spec.config.yaml, schema/, screens/, generated/) with no settled whole-tree owner. Parked right. |
| maps-05356 | docs/transitional-switchboard.md:77 | `docs/backlog.md` | ok | Live doc that stays (docs/reading-map.md / docs/backlog.md) listed in the switchboard itself; the switchboard retires to docs/platform/documentation/switchboard.md whose carrier rows are preserved. Parking harmless. |
| maps-05360 | docs/transitional-switchboard.md:81 | `docs/doc-registry.md` | ok | docs/doc-registry.md is a generated live projection that stays; harmless. |
| maps-05365 | docs/transitional-switchboard.md:86 | `docs/reading-map.md` | ok | Live doc that stays (docs/reading-map.md / docs/backlog.md) listed in the switchboard itself; the switchboard retires to docs/platform/documentation/switchboard.md whose carrier rows are preserved. Parking harmless. |
| maps-05368 | docs/transitional-switchboard.md:99 | `docs/specs/` | ok | Generic algorithm prose ('typically docs/specs/<area>.md or root doc'); directory prose, no concrete target. |
| maps-05369 | docs/transitional-switchboard.md:108 | `docs/specs` | ok | Prose naming the legacy roots (docs/specs, docs/architect) as roots requiring a ratchet exception; globless directory prose, no single owner; dies with the switchboard. |
| maps-05370 | docs/transitional-switchboard.md:108 | `docs/architect` | ok | Prose naming the legacy roots (docs/specs, docs/architect) as roots requiring a ratchet exception; globless directory prose, no single owner; dies with the switchboard. |
| maps-05371 | docs/transitional-switchboard.md:114 | `docs/reading-map.md` | rework | Link-text twin of maps-05372 (same line, destination reading-map.md). normalizedReference 'docs/[docs/reading-map.md' is garbled (mapping-0003, nonexistent path). Real target docs/reading-map.md stays: should be preserve with key docs/reading-map.md. |
| maps-05372 | docs/transitional-switchboard.md:114 | `reading-map.md` | ok | Correct destination row; target docs/reading-map.md stays. |
| maps-05373 | docs/transitional-switchboard.md:116 | `docs/doc-governance.md` | rework | Link-text twin of maps-05374 (same line 116, destination doc-governance.md) which has cutover-patch-only desiredOwner docs/platform/governance.md (mapping-0467, 80 edges). Garbled key 'docs/[docs/doc-governance.md' lost that owner; visible link text docs/doc-governance.md needs an exact Phase-9 patch matching 05374 or the display text stays stale. Fix key and inherit owner. |
| maps-05376 | docs/ui-spec/00-overview.md:45 | `docs/ui-spec/` | ok | Fenced directory tree of docs/ui-spec/ (self description in 00-overview); whole-tree, generator-owned content; no settled successor for the tree label. Parked right. |
