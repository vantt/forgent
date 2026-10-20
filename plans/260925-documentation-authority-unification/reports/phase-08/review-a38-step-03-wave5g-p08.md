# Review a38, step-03 wave 5g, part p08

File: docs/platform/run-supervisor/spec.md. Set: batch-114. Stratum: patched-seeded. 367 lines. Source, record digest and inventory digest all equal 90d112cb30010365840d3e303fb7e86fcff2a10274a9576ec85ad39fcb42c0c8.

Verdict: **ok**. 6 edges reviewed, 0 outcome defects. The file was read through EOF in two spans: lines 1-40 (header and Related) and 330-367 (sections 16-17). Edge regions and a grep of the whole file for every specs/, `../../` and runner/distribution reference are also covered. The record reviewed has 6 edges and the grep found exactly 6 legacy-root references (lines 21, 22, 342, 351, 359, 363). No reference was missed.

## Edges

| edgeId | line | disposition | result |
|---|---|---|---|
| maps-j-07580 | 21 (header Related, `docs/specs/runner.md`) | patch to docs/platform/runner/spec.md | ok. The target exists (76 KB area spec). The diff hunk matches line 21 exactly. It is a whole-area pointer with no section, count or default asserted. |
| maps-j-07581 | 22 (header Related, `docs/specs/distribution.md`) | patch to docs/platform/packaging-distribution/spec.md | ok. The target exists and is the area owner. The diff matches line 22 exactly. |
| maps-j-07582 | 342 (dated 2026-10-16 entry, "Chi tiết quyết định thay `detached-run-supervisor` ở runner.md") | preserve, timing none | ok. This is a dated Lịch sử quyết định entry in the past-event class. The legacy path exists at the pin, and the record carries a non-executable successor note. The candidate runner decisions (h-36d872fbb0e5.md §0043) hold only the vocabulary decision, which supports preserving rather than redirecting this decision-source citation. |
| maps-j-07583 | 351 (dated 2026-10-18 "Controller chết" entry, "Chi tiết: runner.md") | preserve | ok. Same reasoning as 07582. Source runner.md has RUL104 on resume and adopt at line 1135, so the cited holder was real at the pin. |
| maps-j-07584 | 359 (section 17 row "defines", `packages/run-supervisor/contracts/`) | preserve | ok. This is a retained-root path outside the retiring trees, and it exists at the pin. It stays literal. |
| maps-j-07585 | 363 (section 17 row "runner decision", `../../specs/runner.md`, live navigation) | parked, phase9-carry | ok. The row is live navigation to the runner decision. I verified the candidate collection under docs/platform/runner/decisions: h-36d872fbb0e5.md matches `detached-run-supervisor` only at 0043 (vocabulary), and neither it nor docs/platform/runner/spec.md has the adopt, `awaiting-resume` or "Hai cách khởi động" supervisor decisions. The claim that the full newer decision is not carried is therefore true. Parking is correct, and redirecting to the whole-area spec would lose the decision subject. The category phase9-carry is appropriate. |

Diff: only lines 21-22 change, and the replacement paths exist. The diff makes no false adjacent description, because the Related list is a bare path list. The preserved and parked edges carry no diff, as expected. The record does not claim retiresWithTree (the field is absent). This file is not under docs/specs or docs/architect, so no retire check is needed.

## Outcome defects
None.

## Record-text notes (not rework)
- 07582 and 07583 cite L12-38 and L12-51(3) for dated past-event preservation. That is consistent with the rulings.
- The 07585 `searchWitness` has the full alias-lookup structure. I did not review it in depth because the park rests on the content check above.

## Lead-judgment questions
None. Parking 07585 is the same class as other live-pointer carries, and the supporting content check above verifies it.

## Counts
batch-114 / patched-seeded: 1 file reviewed, 0 rework. 6 edges reviewed: 2 patch, 3 preserve, 1 park.
