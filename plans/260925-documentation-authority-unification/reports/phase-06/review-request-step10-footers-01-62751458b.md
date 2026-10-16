# Bounded re-review: footers 1

Author session: `codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **8**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
[One request index](review-request-step10-index-62751458b.md).

Committed `currentDecision`/`after` snapshots come from `git show 62751458b22b47e930dc33b8501d07798b91ace3:<shard>` through `reviewEntryFromCommittedRow`. Explicit `packageOverlay` and `packageOverlayAfter` values are fresh pending native/dependent rows and require the runner package commit for ordinary verdict binding. Before prose is historical. No producer seed, draw or verdict.

Exact scratch-only reproduction commands, run sequentially from repository root at the runner package checkout:

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work python3 plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-reproduce.py consistency --output /tmp/fgos-work/review627/consistency.json
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-*.test.mjs test/scripts/check-doc-*.test.mjs test/scripts/generate-doc-inventory.test.mjs test/scripts/list-doc-anchors.test.mjs test/scripts/verify-phase-02.test.mjs test/scripts/next-doc-id.test.mjs
env -u CLAUDE_CODE_SESSION_ID python3 - <<'PY'
import json
from pathlib import Path
p=Path('/tmp/fgos-work/review627'); p.mkdir(parents=True, exist_ok=True)
if p.is_symlink() or not p.resolve().is_relative_to('/tmp/fgos-work') or p.resolve().is_relative_to(Path.cwd().resolve()): raise RuntimeError('unsafe scratch directory')
for name in ['step10-native-inventory.bin','step10-sync627-D-both.json','step10-sync627-D-identity.json','step10-sync627-D-phase02.json','step10-sync627-D-summary.json','step10-sync627-target-ownership.json','step10-sync627-link-replay.json']:
    out=p/name
    if out.is_symlink() or out.exists() and out.stat().st_nlink!=1: raise RuntimeError('unsafe scratch output')
j=json.loads(Path('plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-reproduction.json').read_text())
for name,text in j['readOnlyScripts'].items():
    out=p/name
    if out.is_symlink() or out.exists() and out.stat().st_nlink!=1: raise RuntimeError('unsafe scratch file')
    out.write_text(text)
PY
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --max-old-space-size=4096 --max-semi-space-size=16 /tmp/fgos-work/review627/inventory-readonly.mjs
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --max-old-space-size=4096 --max-semi-space-size=16 /tmp/fgos-work/review627/verify-readonly.mjs
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node /tmp/fgos-work/review627/ownership-readonly.mjs
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node /tmp/fgos-work/review627/audit-ownership-readonly.mjs
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work python3 /tmp/fgos-work/review627/replay-readonly.py
```

The unchanged checker audits **all 12895 rows /92 shards**, including all whole-section and distinct-occurrence rules, **836** selected outputs and the native-dependent refresh. Expected tests: **490** pass. No author `--apply`, carry-forward, registry persistence or repository output occurs in these reviewer commands. Inventory replay reads the sole compact registry; its regenerated inventory and all D/ownership/link outputs stay under `/tmp/fgos-work/review627/`. Reader reproduction needs available scratch space and memory; do the heavy commands sequentially. Historical author mutation scripts in the provenance manifest are evidence only.

A36: every pending submitted claim receives ordinary verdict and digest/anchor/shard equality. Independently seed >=45/296 rationale deep sample plus >=45/298 conservative Weak-exact/Judgment population (one reviewer draw can satisfy both only if coverage proved). Every listed unequal-digest, partial/historical row, all52 whole-section headings, all8 own-occurrence footers, restored L10-2, and marked docs/tool/native corrections are deep. [Exact deep populations](step10-sync627-A36.json). Reviewer records seed/sample IDs; >3% deep rework escalates to whole set. No separate claim verdict on frozen/footer/accounting references when the pending claim is already submitted in rationales/decisions. Existing reviewed approvals remain; evidence/native tuples do not approve current truth or cutover.

## Entry footers-001

```json
{
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "row": {
    "claimId": "claim_97479b13a60800e856813bfd4f0cbb78",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-150",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:1665-1665#unheaded-block-150 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:1665-1665#unheaded-block-150 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-150 under docs/specs/runner.md#unheaded-block-150; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0005 — Runner & cô lập worker / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0005 — Runner & cô lập worker / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 1 of 8; registered anchor unheaded-block-144 shifts +6 to unheaded-block-150, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Hệ quả"
    ]
  },
  "kind": "footer-occurrence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_97479b13a60800e856813bfd4f0cbb78",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-150",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:1665-1665#unheaded-block-150 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:1665-1665#unheaded-block-150 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-150 under docs/specs/runner.md#unheaded-block-150; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0005 — Runner & cô lập worker / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0005 — Runner & cô lập worker / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 1 of 8; registered anchor unheaded-block-144 shifts +6 to unheaded-block-150, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Hệ quả"
    ]
  },
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "relatedClaimId": "claim_97479b13a60800e856813bfd4f0cbb78",
  "deepRequired": true,
  "tags": [
    "L10-30/7+1-footer-rows"
  ],
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-footer-witness.json",
  "reviewScope": "Occurrence accounting only. Pending claim verdict appears in rationales; already reviewed row keeps its approval. Verify own registered anchor, authenticated historical order, current distinct occurrence and +6 shift.",
  "entryId": "footers-001"
}
```

## Entry footers-002

```json
{
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "row": {
    "claimId": "claim_50dca4885019ac5125d941ea5a86f448",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-155",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:1693-1693#unheaded-block-155 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:1693-1693#unheaded-block-155 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-155 under docs/specs/runner.md#unheaded-block-155; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0008 — Routing theo audience của từng interface / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0008 — Routing theo audience của từng interface / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 2 of 8; registered anchor unheaded-block-149 shifts +6 to unheaded-block-155, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Hệ quả"
    ]
  },
  "kind": "footer-occurrence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_50dca4885019ac5125d941ea5a86f448",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-155",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:1693-1693#unheaded-block-155 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:1693-1693#unheaded-block-155 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-155 under docs/specs/runner.md#unheaded-block-155; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0008 — Routing theo audience của từng interface / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0008 — Routing theo audience của từng interface / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 2 of 8; registered anchor unheaded-block-149 shifts +6 to unheaded-block-155, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Hệ quả"
    ]
  },
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "relatedClaimId": "claim_50dca4885019ac5125d941ea5a86f448",
  "deepRequired": true,
  "tags": [
    "L10-30/7+1-footer-rows"
  ],
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-footer-witness.json",
  "reviewScope": "Occurrence accounting only. Pending claim verdict appears in rationales; already reviewed row keeps its approval. Verify own registered anchor, authenticated historical order, current distinct occurrence and +6 shift.",
  "entryId": "footers-002"
}
```

## Entry footers-003

```json
{
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "row": {
    "claimId": "claim_07ae72c4d2c93884a120cf2ca12250a8",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-167",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:1802-1802#unheaded-block-167 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:1802-1802#unheaded-block-167 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-167 under docs/specs/runner.md#unheaded-block-167; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập) / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập) / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 3 of 8; registered anchor unheaded-block-161 shifts +6 to unheaded-block-167, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Hệ quả"
    ]
  },
  "kind": "footer-occurrence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_07ae72c4d2c93884a120cf2ca12250a8",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-167",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:1802-1802#unheaded-block-167 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:1802-1802#unheaded-block-167 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-167 under docs/specs/runner.md#unheaded-block-167; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập) / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập) / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 3 of 8; registered anchor unheaded-block-161 shifts +6 to unheaded-block-167, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Hệ quả"
    ]
  },
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "relatedClaimId": "claim_07ae72c4d2c93884a120cf2ca12250a8",
  "deepRequired": true,
  "tags": [
    "L10-30/7+1-footer-rows"
  ],
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-footer-witness.json",
  "reviewScope": "Occurrence accounting only. Pending claim verdict appears in rationales; already reviewed row keeps its approval. Verify own registered anchor, authenticated historical order, current distinct occurrence and +6 shift.",
  "entryId": "footers-003"
}
```

## Entry footers-004

```json
{
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "row": {
    "claimId": "claim_211f0b98400863f2a0e9b9cdaa2259fe",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-176",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:1886-1886#unheaded-block-176 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:1886-1886#unheaded-block-176 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-176 under docs/specs/runner.md#unheaded-block-176; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 4 of 8; registered anchor unheaded-block-170 shifts +6 to unheaded-block-176, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Hệ quả"
    ]
  },
  "kind": "footer-occurrence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_211f0b98400863f2a0e9b9cdaa2259fe",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-176",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:1886-1886#unheaded-block-176 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:1886-1886#unheaded-block-176 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-176 under docs/specs/runner.md#unheaded-block-176; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 4 of 8; registered anchor unheaded-block-170 shifts +6 to unheaded-block-176, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Hệ quả"
    ]
  },
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "relatedClaimId": "claim_211f0b98400863f2a0e9b9cdaa2259fe",
  "deepRequired": true,
  "tags": [
    "L10-30/7+1-footer-rows"
  ],
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-footer-witness.json",
  "reviewScope": "Occurrence accounting only. Pending claim verdict appears in rationales; already reviewed row keeps its approval. Verify own registered anchor, authenticated historical order, current distinct occurrence and +6 shift.",
  "entryId": "footers-004"
}
```

## Entry footers-005

```json
{
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "row": {
    "claimId": "claim_1d8baa1def0cea7595b62de99846b489",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-241",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:2410-2410#unheaded-block-241 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:2410-2410#unheaded-block-241 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-241 under docs/specs/runner.md#unheaded-block-241; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0028 — Đổi tên pinned term `orchestrator` thành `launcher` / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0028 — Đổi tên pinned term `orchestrator` thành `launcher` / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 5 of 8; registered anchor unheaded-block-235 shifts +6 to unheaded-block-241, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Hệ quả"
    ]
  },
  "kind": "footer-occurrence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1d8baa1def0cea7595b62de99846b489",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-241",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:2410-2410#unheaded-block-241 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:2410-2410#unheaded-block-241 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-241 under docs/specs/runner.md#unheaded-block-241; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0028 — Đổi tên pinned term `orchestrator` thành `launcher` / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0028 — Đổi tên pinned term `orchestrator` thành `launcher` / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 5 of 8; registered anchor unheaded-block-235 shifts +6 to unheaded-block-241, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Hệ quả"
    ]
  },
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "relatedClaimId": "claim_1d8baa1def0cea7595b62de99846b489",
  "deepRequired": true,
  "tags": [
    "L10-30/7+1-footer-rows"
  ],
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-footer-witness.json",
  "reviewScope": "Occurrence accounting only. Pending claim verdict appears in rationales; already reviewed row keeps its approval. Verify own registered anchor, authenticated historical order, current distinct occurrence and +6 shift.",
  "entryId": "footers-005"
}
```

## Entry footers-006

```json
{
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "row": {
    "claimId": "claim_012bfa2639fb107eeb3baee4fb502f54",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-250",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:2499-2499#unheaded-block-250 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:2499-2499#unheaded-block-250 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-250 under docs/specs/runner.md#unheaded-block-250; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 6 of 8; registered anchor unheaded-block-244 shifts +6 to unheaded-block-250, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Hệ quả"
    ]
  },
  "kind": "footer-occurrence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_012bfa2639fb107eeb3baee4fb502f54",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-250",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:2499-2499#unheaded-block-250 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:2499-2499#unheaded-block-250 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-250 under docs/specs/runner.md#unheaded-block-250; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 6 of 8; registered anchor unheaded-block-244 shifts +6 to unheaded-block-250, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Hệ quả"
    ]
  },
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "relatedClaimId": "claim_012bfa2639fb107eeb3baee4fb502f54",
  "deepRequired": true,
  "tags": [
    "L10-30/7+1-footer-rows"
  ],
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-footer-witness.json",
  "reviewScope": "Occurrence accounting only. Pending claim verdict appears in rationales; already reviewed row keeps its approval. Verify own registered anchor, authenticated historical order, current distinct occurrence and +6 shift.",
  "entryId": "footers-006"
}
```

## Entry footers-007

```json
{
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "row": {
    "claimId": "claim_99806d8b21d05eb7a8e8744d765bea00",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-274",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:2680-2680#unheaded-block-274 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:2680-2680#unheaded-block-274 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-274 under docs/specs/runner.md#unheaded-block-274; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 7 of 8; registered anchor unheaded-block-268 shifts +6 to unheaded-block-274, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Hệ quả"
    ]
  },
  "kind": "footer-occurrence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_99806d8b21d05eb7a8e8744d765bea00",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-274",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:2680-2680#unheaded-block-274 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:2680-2680#unheaded-block-274 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-274 under docs/specs/runner.md#unheaded-block-274; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 7 of 8; registered anchor unheaded-block-268 shifts +6 to unheaded-block-274, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Hệ quả"
    ]
  },
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "relatedClaimId": "claim_99806d8b21d05eb7a8e8744d765bea00",
  "deepRequired": true,
  "tags": [
    "L10-30/7+1-footer-rows"
  ],
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-footer-witness.json",
  "reviewScope": "Occurrence accounting only. Pending claim verdict appears in rationales; already reviewed row keeps its approval. Verify own registered anchor, authenticated historical order, current distinct occurrence and +6 shift.",
  "entryId": "footers-007"
}
```

## Entry footers-008

```json
{
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json",
  "collection": "registryGaps",
  "row": {
    "claimId": "claim_a6f43d98b3eebe97802fd01a4ac7863b",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-286",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:2792-2792#unheaded-block-286 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:2792-2792#unheaded-block-286 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-286 under docs/specs/runner.md#unheaded-block-286; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 8 of 8; registered anchor unheaded-block-280 shifts +6 to unheaded-block-286, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Hệ quả"
    ]
  },
  "kind": "footer-occurrence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a6f43d98b3eebe97802fd01a4ac7863b",
    "sourcePath": "docs/specs/runner.md",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "disposition": "supersede",
    "targetOwner": "docs/specs/runner.md",
    "targetAnchor": "unheaded-block-286",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/specs/runner.md:2792-2792#unheaded-block-286 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nTarget: docs/specs/runner.md:2792-2792#unheaded-block-286 (current lines); unit SHA256 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104.\nSource and target unit digests equal.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#unheaded-block-286 under docs/specs/runner.md#unheaded-block-286; source context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người / Hệ quả\", target context \"Spec: Runner (vòng tự hành) / Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) / 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người / Hệ quả\". The complete bound unit is carried with an equal native digest. SOURCE occurrence 8 of 8; registered anchor unheaded-block-280 shifts +6 to unheaded-block-286, with identical text and preserved occurrence order authenticated at 02106766dd6185208187f5fcaca7725cf60da9fe (L10-30).\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetAncestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người",
      "Hệ quả"
    ]
  },
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "relatedClaimId": "claim_a6f43d98b3eebe97802fd01a4ac7863b",
  "deepRequired": true,
  "tags": [
    "L10-30/7+1-footer-rows"
  ],
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-footer-witness.json",
  "reviewScope": "Occurrence accounting only. Pending claim verdict appears in rationales; already reviewed row keeps its approval. Verify own registered anchor, authenticated historical order, current distinct occurrence and +6 shift.",
  "entryId": "footers-008"
}
```

