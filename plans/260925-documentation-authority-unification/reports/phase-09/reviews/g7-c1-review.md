# G7 review — batch g7-c1 (retired-engine/**), commit 8a9385eca

Verdicts: 73 specs, 73 APPROVE, 0 REWORK. Machine file: g7-g7-c1-review.json.

## Checks (reviewer's own run; author roundtrip not used)
- Hash: 73/73 target files at 8a9385eca == beforeSha256 == currentSha256.
- Forward/rollback: 73/73 `patch --batch --fuzz=0 -p1` in /tmp/fgos-work/g7-g7-c1/<n>/: forward == expectedAfterSha256, rollback == beforeSha256, no .orig/.rej.
- Join: each spec has exactly one step-03 record; spec diff is byte-identical to the record diff; record digest == beforeSha256.
- Semantic: every spec is the same single-line edit at L17 (`@@ -14,7 +14,7 @@`): the wrapper `Related:` entry `- docs/specs/runner.md` becomes `- docs/platform/runner/spec.md`. The target exists, is the whole-file holder and is not the file itself. It appears in no `Related` list (0 duplicates), as L12-34(4) requires. No claim is dropped and no other line is changed.

## Not in G7 scope (informational)
- In every file, L19 `Superseded by: ... docs/specs/runner.md` and the L23 framing pointer to the `docs/specs/runner.md` section **CoordinationSession (Lịch sử ...)** stay as they are. They are deliberate `preserve` edges under L12-35(3)/L12-26(8). After cutover they name a deleted path. Their successor notes point to docs/platform/runner/spec.md and docs/platform/runner/decisions/h-aabefc85f0c9.md, and that decision file does carry the section. Whether the deleted-path text is acceptable after the flip is a question for G6 or the phase owner, not a defect in these specs.
- L9 `Provenance: docs/architect/... at <sha>` in the legacy/* files (and some others) stays as provenance under L12-34(4).
