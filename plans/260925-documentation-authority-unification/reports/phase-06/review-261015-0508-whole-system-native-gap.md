# Review: whole-system historical native gap (system-overview unheaded-block-3)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:38@2026-10-15
Review mode: ordinary
Request commit: ffb7b73c8
Content commit: a8a10abc1a24218518a14764f68c8d86f4810f91

## Scope and method

One entry: the historical native gap `claim_0cc5fd490ce0087ed51f38bca9d8c96e` (docs/specs/system-overview.md#unheaded-block-3 at immutable blob be00c90cf0f3bae695a65069897a926d4a699bca). Read-only review at worktree HEAD ffb7b73c8. The request is not a sensitivity pack; this is an ordinary review and no sensitivity result is produced (Step 6 checkpoint sensitivity is separate).

Checks run: (1) extracted the old blob with `git cat-file blob be00c90cf` and ran `extractMarkdownConservationUnits` on it: unheaded-block-3 is lines 14-23, textDigest 543e5632daf001e968418bbeae1311abb85e2a5e966ce473669e6ad635b74a1e, identityFingerprint feef04a85f8f7f39556142b1d8a4cf60330d8d5cbf6655e5aa15becb8f102fbb, both equal to the request. (2) Searched `reports/identity-registry.json` and `reports/phase-02-identity-registry.json`: both carry claim_0cc5fd49 as a current unit with exactly those digests; `reports/phase-06/working-identity-registry.json` carries it only under identityGaps (status identity-gap, same ID, same digests) and carries a different ID, claim_49dc8dc05b31bcfc5cfd0d7c44c8395e, for the current unit (sourceUnitDigest b5b8e930c4f4411020e3a8559798e1703e8b6e984487ef0d83b318c3c9a7f781, own fingerprint fb137794...). (3) Extracted the current source (blob c24c5561) and compared: the first 10 lines of the current unit are byte-identical to the historical unit (`cmp` clean); the current unit has one extra final line, the convention entry. (4) Traced that line to main commit 209824610 (docs(convention): record implemented Convention contracts, ancestor of main) via `git log -S`; the diff of the source between be00c90c and c24c5561 is exactly that one inserted line, so it is a main-side edit and not a plan move. (5) Compared the current target unit (docs/platform/system-overview/spec.md#unheaded-block-6, lines 42-52 at a8a10abc1) with the current source unit: equal digest b5b8e930...; pack 16 row claim_49dc8dc05b31bcfc5cfd0d7c44c8395e binds them. (6) git status in the worktree is clean.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_0cc5fd490ce0087ed51f38bca9d8c96e | ok | deep: predecessor ID and its native digest 543e5632 are preserved unchanged in both prior registries and as an identity gap in the working registry, with no re-use of the ID for the changed unit; the real successor is the separately allocated claim_49dc8dc05b31bcfc5cfd0d7c44c8395e, whose current source unit is the historical unit plus main's one convention line and is carried verbatim to target unheaded-block-6; all ten historical lines are carried, nothing lost and nothing grafted, so the gap may be closed by an authorized writer with a supersede decision naming claim_49dc8dc0 (anchor equality alone is not the basis, the byte-prefix and main-commit trace are) | 543e5632daf001e968418bbeae1311abb85e2a5e966ce473669e6ad635b74a1e | b5b8e930c4f4411020e3a8559798e1703e8b6e984487ef0d83b318c3c9a7f781 |

## Notes

- The pack's multiple-owner context (two identical-unit groups) is reviewed by ownership, not waived. Group 6a940230...: the txt block `Outside hard / Inside soft` appears in docs/architect/architecture-intent.md and docs/architect/system-vision-trong-mem-ngoai-cung.md and is owned by two different target documents; each row is positional and each source document is retained, so I see no conservation loss, but a contextual exception record is still required before strict E can close. Group 95a357e2...: the closing sentence "Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ." occurs twice in docs/architecture-map.md (target docs/platform/architecture-map.md) and twice in docs/specs/system-overview.md (target docs/platform/system-overview/spec.md at lines 132 and 198, matching source lines 104 and 170 at a constant +28 offset). The pairing is positional and correct, so no ownership defect; the multiple-owner finding remains open for an exception decision by the owner or Lead and I do not approve it here.
- This review supplies no gap decision. The accepted gap decision must still be written by an authorized writer; I recommend disposition supersede with the real successor named, and the decision must not reuse or overwrite the predecessor ID.
- Before any application, note that the working registry D result still has the two explicit blockers the author reported (stale old manifest binding for claim_0416642260519cf992931a4968e80c03 and the runner ratchet digest); neither belongs to this row.

Unresolved: none for this row. Contextual-exception decision for the two identical-unit groups remains with the owner or Lead.
