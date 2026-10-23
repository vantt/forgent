# G7 batch g7-c6 review (commit 8a9385eca)

- Specs: 30. APPROVE 30, REWORK 0.
- Mechanical: 30/30 hash == beforeSha256 at review commit; forward `patch --batch --fuzz=0 -p1` == expectedAfterSha256; rollback == beforeSha256 (scratch /tmp/fgos-work/g7-g7-c6/<n>/).
- Links: every new path exists; every new anchor passes `scripts/list-doc-anchors.mjs --check`.
- Semantic: all hunks are path/anchor-only successor swaps; cited herdr-web-dashboard sections byte-identical to legacy (Business Rules R5 differs upstream, not restated here); RUL75 present at runner subcomponent target.

Non-blocking notes:
- coexistence/spec.md L43: repo-convention anchor; GitHub slug would be `approval-gate--reviewapprovereject` (already noted by earlier A38 review).
- M03-add-edit-item.md L40: `#behaviors-operations` parent anchor; `#add-a-work-item` / `#edit-a-work-item` exist.
- architecture-intent.md and system-overview/spec.md keep legacy refs that are owned parks (readiness parkOwners), so G7 park closure must still cover them.
