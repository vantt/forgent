# Bounded re-review: accounting 2

Author session: `codex-session:unit-run-1792093168554-f28af963@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **11**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
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

## Entry accounting-047

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/0/after",
  "historicalSnapshot": {
    "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "legacy-node-cli-ownership-boundary",
    "sourceUnitDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#legacy-node-cli-ownership-boundary, source unit SHA256 fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "relatedClaimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
  "after": {
    "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "legacy-node-cli-ownership-boundary",
    "sourceUnitDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#legacy-node-cli-ownership-boundary, source unit SHA256 fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place heading row with no target; AGENTS.md sha256 47f3a4e5 equals the file hash quoted in the rationale, the quoted unit digest fed79e2e recomputes equal, the section \"Legacy-Node CLI Ownership Boundary\" is at line 83; nothing carried, nothing added; the rationale sentence \"Pending independent review\" is stale on a reviewed row but is the repo-wide convention (452 rows). Digests also hand-recomputed with an independent script: equal.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "legacy-node-cli-ownership-boundary",
    "sourceUnitDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#legacy-node-cli-ownership-boundary, source unit SHA256 fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place heading row with no target; AGENTS.md sha256 47f3a4e5 equals the file hash quoted in the rationale, the quoted unit digest fed79e2e recomputes equal, the section \"Legacy-Node CLI Ownership Boundary\" is at line 83; nothing carried, nothing added; the rationale sentence \"Pending independent review\" is stale on a reviewed row but is the repo-wide convention (452 rows). Digests also hand-recomputed with an independent script: equal.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-047"
}
```

## Entry accounting-048

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/1/after",
  "historicalSnapshot": {
    "claimId": "claim_c328f1aab4c53a87e5564dab101facf2",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-14",
    "sourceUnitDigest": "e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#unheaded-block-14, source unit SHA256 e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "relatedClaimId": "claim_c328f1aab4c53a87e5564dab101facf2",
  "after": {
    "claimId": "claim_c328f1aab4c53a87e5564dab101facf2",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-14",
    "sourceUnitDigest": "e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#unheaded-block-14, source unit SHA256 e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "mechanical: retain-in-place block (lines 85-94 of AGENTS.md), no target; file sha256 47f3a4e5 and unit digest e3c0146e both equal the values quoted in the rationale; source file unchanged since the pin; shard equals pack; cited report row ok; I did not re-read the paragraph.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c328f1aab4c53a87e5564dab101facf2",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-14",
    "sourceUnitDigest": "e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#unheaded-block-14, source unit SHA256 e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "mechanical: retain-in-place block (lines 85-94 of AGENTS.md), no target; file sha256 47f3a4e5 and unit digest e3c0146e both equal the values quoted in the rationale; source file unchanged since the pin; shard equals pack; cited report row ok; I did not re-read the paragraph.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-048"
}
```

## Entry accounting-049

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/2/after",
  "historicalSnapshot": {
    "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "chiều-vào-verb-danh-tính",
    "sourceUnitDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Heading translated and renumbered: “Chiều vào — verb + danh tính” becomes “2. Input Direction Verb And Identity”. Its forty-line direct source body is carried under new H3 subsections, each body unit has its own decision row. Heading and section digests differ because of translation, numbering and structural relocation, in addition to the disclosed Session Identity relative link rebase. Native identity resolved at 19ca8de23; no provisional identity, source retirement, authority flip or truth approval.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "2-input-direction-verb-and-identity",
    "targetUnitDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "targetAncestry": [
      "CLI I/O Contract"
    ]
  },
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "relatedClaimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
  "after": {
    "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "chiều-vào-verb-danh-tính",
    "sourceUnitDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Heading translated and renumbered: “Chiều vào — verb + danh tính” becomes “2. Input Direction Verb And Identity”. Its forty-line direct source body is carried under new H3 subsections, each body unit has its own decision row. Heading and section digests differ because of translation, numbering and structural relocation, in addition to the disclosed Session Identity relative link rebase. Native identity resolved at 19ca8de23; no provisional identity, source retirement, authority flip or truth approval.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "2-input-direction-verb-and-identity",
    "reviewNote": "deep: supersede of the \"Chiều vào\" heading; the heading text is translated and renumbered, its 2218-char source section payload is not under the target heading (39 chars) but every body unit of that section (blocks 3 to 8 of docs/io-contract.md) has its own decision row to cli-io-contract.md blocks 4,7,10,8,13,14, so nothing is stranded; the rationale also discloses the Session Identity link rebase; anchor ok.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "targetAncestry": [
      "CLI I/O Contract"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Input Direction Verb And Identity",
    "anchor": "2-input-direction-verb-and-identity",
    "githubAnchor": "2-input-direction-verb-and-identity",
    "stableAnchor": "h-ecfbdae30c4d",
    "startLine": 42,
    "endLine": 42,
    "textDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "sample": "2. Input Direction Verb And Identity",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "2f4a6c0d72dcf5460bcafe1057270dd45e876bc10eae33fb3d773fe3d1809645",
    "ancestry": [
      "CLI I/O Contract"
    ],
    "text": "## 2. Input Direction Verb And Identity",
    "sectionText": "## 2. Input Direction Verb And Identity"
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "dbde016fc25e17cebcebf0d2a7cb05d0c5ebfc6fafe9f10f0a1e4e1c39d40d3f",
    "identityFingerprint": "2f4a6c0d72dcf5460bcafe1057270dd45e876bc10eae33fb3d773fe3d1809645",
    "claimId": "claim_6775ef657a484c69481b14064d50b8f9",
    "sourceAnchor": "2-input-direction-verb-and-identity",
    "unitKind": "heading",
    "sourceUnitDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "claimKind": "contract",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "chiều-vào-verb-danh-tính",
    "sourceUnitDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Heading translated and renumbered: “Chiều vào — verb + danh tính” becomes “2. Input Direction Verb And Identity”. Its forty-line direct source body is carried under new H3 subsections, each body unit has its own decision row. Heading and section digests differ because of translation, numbering and structural relocation, in addition to the disclosed Session Identity relative link rebase. Native identity resolved at 19ca8de23; no provisional identity, source retirement, authority flip or truth approval.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "2-input-direction-verb-and-identity",
    "reviewNote": "deep: supersede of the \"Chiều vào\" heading; the heading text is translated and renumbered, its 2218-char source section payload is not under the target heading (39 chars) but every body unit of that section (blocks 3 to 8 of docs/io-contract.md) has its own decision row to cli-io-contract.md blocks 4,7,10,8,13,14, so nothing is stranded; the rationale also discloses the Session Identity link rebase; anchor ok.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "targetAncestry": [
      "CLI I/O Contract"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-049"
}
```

## Entry accounting-057

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/10/after",
  "historicalSnapshot": {
    "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "reading-map-sản-phẩm",
    "sourceUnitDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#reading-map-sản-phẩm, source unit SHA256 19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "claims",
  "relatedClaimId": "claim_8e290abbe8f1344bf8f19c997da11921",
  "after": {
    "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "reading-map-sản-phẩm",
    "sourceUnitDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#reading-map-sản-phẩm, source unit SHA256 19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "mechanical: retain-in-place H1 of docs/specs/reading-map.md; file sha256 22606348 equals the pin and the rationale, unit digest 19c2ff24 recomputes equal; the rationale claim of seven labelled truth corrections plus the Session Identity entry in docs/reading-map.md was counted true (see 306); no target. Digests also hand-recomputed with an independent script: equal.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "reading-map-sản-phẩm",
    "sourceUnitDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#reading-map-sản-phẩm, source unit SHA256 19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "mechanical: retain-in-place H1 of docs/specs/reading-map.md; file sha256 22606348 equals the pin and the rationale, unit digest 19c2ff24 recomputes equal; the rationale claim of seven labelled truth corrections plus the Session Identity entry in docs/reading-map.md was counted true (see 306); no target. Digests also hand-recomputed with an independent script: equal.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-057"
}
```

## Entry accounting-058

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/11/after",
  "historicalSnapshot": {
    "claimId": "claim_690e83ad4f79a1bbac8eafc9acb1d4ea",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "unheaded-block-2",
    "sourceUnitDigest": "1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#unheaded-block-2, source unit SHA256 1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "claims",
  "relatedClaimId": "claim_690e83ad4f79a1bbac8eafc9acb1d4ea",
  "after": {
    "claimId": "claim_690e83ad4f79a1bbac8eafc9acb1d4ea",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "unheaded-block-2",
    "sourceUnitDigest": "1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#unheaded-block-2, source unit SHA256 1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place block of docs/specs/reading-map.md (lines 11-64, the 53-entry list); file sha256 22606348 equals pin, unit digest 1c7bbf9e equal; no target claimed; the phrase \"root instruction/navigation file\" is loose for a docs/specs file but not false.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_690e83ad4f79a1bbac8eafc9acb1d4ea",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "unheaded-block-2",
    "sourceUnitDigest": "1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#unheaded-block-2, source unit SHA256 1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place block of docs/specs/reading-map.md (lines 11-64, the 53-entry list); file sha256 22606348 equals pin, unit digest 1c7bbf9e equal; no target claimed; the phrase \"root instruction/navigation file\" is loose for a docs/specs file but not false.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-058"
}
```

## Entry accounting-059

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/12/after",
  "historicalSnapshot": {
    "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "5-detailed-product-and-source-map",
    "sourceUnitDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#5-detailed-product-and-source-map, source unit SHA256 01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "claims",
  "relatedClaimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
  "after": {
    "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "5-detailed-product-and-source-map",
    "sourceUnitDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#5-detailed-product-and-source-map, source unit SHA256 01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place heading of docs/reading-map.md section 5; file sha256 f4fce875 equals the pin, unit digest 01204e28 equal; counted seven Truth correction labels plus the Session Identity entry in section 5 as the rationale says; no target, no carry.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "5-detailed-product-and-source-map",
    "sourceUnitDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#5-detailed-product-and-source-map, source unit SHA256 01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place heading of docs/reading-map.md section 5; file sha256 f4fce875 equals the pin, unit digest 01204e28 equal; counted seven Truth correction labels plus the Session Identity entry in section 5 as the rationale says; no target, no carry.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-059"
}
```

## Entry accounting-060

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/13/after",
  "historicalSnapshot": {
    "claimId": "claim_42444c5f44c4076300c2b9c56516c429",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "unheaded-block-16",
    "sourceUnitDigest": "607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#unheaded-block-16, source unit SHA256 607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "claims",
  "relatedClaimId": "claim_42444c5f44c4076300c2b9c56516c429",
  "after": {
    "claimId": "claim_42444c5f44c4076300c2b9c56516c429",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "unheaded-block-16",
    "sourceUnitDigest": "607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#unheaded-block-16, source unit SHA256 607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place block of docs/reading-map.md (lines 131-184); file sha256 f4fce875 equals pin, unit digest 607cd88b equal; the list is the 53 retained entries plus the labelled corrections, rationale count of seven corrections is true; no target.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_42444c5f44c4076300c2b9c56516c429",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "unheaded-block-16",
    "sourceUnitDigest": "607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#unheaded-block-16, source unit SHA256 607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place block of docs/reading-map.md (lines 131-184); file sha256 f4fce875 equals pin, unit digest 607cd88b equal; the list is the 53 retained entries plus the labelled corrections, rationale count of seven corrections is true; no target.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-060"
}
```

## Entry accounting-061

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/0/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "chiều-vào-verb-danh-tính",
    "sourceUnitDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Heading translated and renumbered: “Chiều vào — verb + danh tính” becomes “2. Input Direction Verb And Identity”. Its forty-line direct source body is carried under new H3 subsections, each body unit has its own decision row. Heading and section digests differ because of translation, numbering and structural relocation, in addition to the disclosed Session Identity relative link rebase. Native identity resolved at 19ca8de23; no provisional identity, source retirement, authority flip or truth approval.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "2-input-direction-verb-and-identity",
    "targetUnitDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "targetAncestry": [
      "CLI I/O Contract"
    ]
  },
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "relatedClaimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
  "after": {
    "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "chiều-vào-verb-danh-tính",
    "sourceUnitDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Heading translated and renumbered: “Chiều vào — verb + danh tính” becomes “2. Input Direction Verb And Identity”. Its forty-line direct source body is carried under new H3 subsections, each body unit has its own decision row. Heading and section digests differ because of translation, numbering and structural relocation, in addition to the disclosed Session Identity relative link rebase. Native identity resolved at 19ca8de23; no provisional identity, source retirement, authority flip or truth approval.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "2-input-direction-verb-and-identity",
    "reviewNote": "deep: supersede of the \"Chiều vào\" heading; the heading text is translated and renumbered, its 2218-char source section payload is not under the target heading (39 chars) but every body unit of that section (blocks 3 to 8 of docs/io-contract.md) has its own decision row to cli-io-contract.md blocks 4,7,10,8,13,14, so nothing is stranded; the rationale also discloses the Session Identity link rebase; anchor ok.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "targetAncestry": [
      "CLI I/O Contract"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Input Direction Verb And Identity",
    "anchor": "2-input-direction-verb-and-identity",
    "githubAnchor": "2-input-direction-verb-and-identity",
    "stableAnchor": "h-ecfbdae30c4d",
    "startLine": 42,
    "endLine": 42,
    "textDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "sample": "2. Input Direction Verb And Identity",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "2f4a6c0d72dcf5460bcafe1057270dd45e876bc10eae33fb3d773fe3d1809645",
    "ancestry": [
      "CLI I/O Contract"
    ],
    "text": "## 2. Input Direction Verb And Identity",
    "sectionText": "## 2. Input Direction Verb And Identity"
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "dbde016fc25e17cebcebf0d2a7cb05d0c5ebfc6fafe9f10f0a1e4e1c39d40d3f",
    "identityFingerprint": "2f4a6c0d72dcf5460bcafe1057270dd45e876bc10eae33fb3d773fe3d1809645",
    "claimId": "claim_6775ef657a484c69481b14064d50b8f9",
    "sourceAnchor": "2-input-direction-verb-and-identity",
    "unitKind": "heading",
    "sourceUnitDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "claimKind": "contract",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "chiều-vào-verb-danh-tính",
    "sourceUnitDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Heading translated and renumbered: “Chiều vào — verb + danh tính” becomes “2. Input Direction Verb And Identity”. Its forty-line direct source body is carried under new H3 subsections, each body unit has its own decision row. Heading and section digests differ because of translation, numbering and structural relocation, in addition to the disclosed Session Identity relative link rebase. Native identity resolved at 19ca8de23; no provisional identity, source retirement, authority flip or truth approval.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "2-input-direction-verb-and-identity",
    "reviewNote": "deep: supersede of the \"Chiều vào\" heading; the heading text is translated and renumbered, its 2218-char source section payload is not under the target heading (39 chars) but every body unit of that section (blocks 3 to 8 of docs/io-contract.md) has its own decision row to cli-io-contract.md blocks 4,7,10,8,13,14, so nothing is stranded; the rationale also discloses the Session Identity link rebase; anchor ok.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7c4e0214ec4c8c108c24c1b00a560516fbc5de0bc1a26d70a082eca5ccafb23c",
    "targetAncestry": [
      "CLI I/O Contract"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-061"
}
```

## Entry accounting-063

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/2/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "legacy-node-cli-ownership-boundary",
    "sourceUnitDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#legacy-node-cli-ownership-boundary, source unit SHA256 fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "claims",
  "relatedClaimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
  "after": {
    "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "legacy-node-cli-ownership-boundary",
    "sourceUnitDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#legacy-node-cli-ownership-boundary, source unit SHA256 fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place heading row with no target; AGENTS.md sha256 47f3a4e5 equals the file hash quoted in the rationale, the quoted unit digest fed79e2e recomputes equal, the section \"Legacy-Node CLI Ownership Boundary\" is at line 83; nothing carried, nothing added; the rationale sentence \"Pending independent review\" is stale on a reviewed row but is the repo-wide convention (452 rows). Digests also hand-recomputed with an independent script: equal.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "legacy-node-cli-ownership-boundary",
    "sourceUnitDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: AGENTS.md#legacy-node-cli-ownership-boundary, source unit SHA256 fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817, source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place heading row with no target; AGENTS.md sha256 47f3a4e5 equals the file hash quoted in the rationale, the quoted unit digest fed79e2e recomputes equal, the section \"Legacy-Node CLI Ownership Boundary\" is at line 83; nothing carried, nothing added; the rationale sentence \"Pending independent review\" is stale on a reviewed row but is the repo-wide convention (452 rows). Digests also hand-recomputed with an independent script: equal.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-063"
}
```

## Entry accounting-069

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/8/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "reading-map-sản-phẩm",
    "sourceUnitDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#reading-map-sản-phẩm, source unit SHA256 19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "claims",
  "relatedClaimId": "claim_8e290abbe8f1344bf8f19c997da11921",
  "after": {
    "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "reading-map-sản-phẩm",
    "sourceUnitDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#reading-map-sản-phẩm, source unit SHA256 19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "mechanical: retain-in-place H1 of docs/specs/reading-map.md; file sha256 22606348 equals the pin and the rationale, unit digest 19c2ff24 recomputes equal; the rationale claim of seven labelled truth corrections plus the Session Identity entry in docs/reading-map.md was counted true (see 306); no target. Digests also hand-recomputed with an independent script: equal.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
    "sourcePath": "docs/specs/reading-map.md",
    "sourceAnchor": "reading-map-sản-phẩm",
    "sourceUnitDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/specs/reading-map.md#reading-map-sản-phẩm, source unit SHA256 19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a, source file SHA256 22606348608523b94c6a25f1540007aec5512d340278efea1f835713a7e67250 at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "mechanical: retain-in-place H1 of docs/specs/reading-map.md; file sha256 22606348 equals the pin and the rationale, unit digest 19c2ff24 recomputes equal; the rationale claim of seven labelled truth corrections plus the Session Identity entry in docs/reading-map.md was counted true (see 306); no target. Digests also hand-recomputed with an independent script: equal.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-069"
}
```

## Entry accounting-070

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/9/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "5-detailed-product-and-source-map",
    "sourceUnitDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#5-detailed-product-and-source-map, source unit SHA256 01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-retained-navigation-proposal.json",
  "collection": "claims",
  "relatedClaimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
  "after": {
    "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "5-detailed-product-and-source-map",
    "sourceUnitDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#5-detailed-product-and-source-map, source unit SHA256 01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place heading of docs/reading-map.md section 5; file sha256 f4fce875 equals the pin, unit digest 01204e28 equal; counted seven Truth correction labels plus the Session Identity entry in section 5 as the rationale says; no target, no carry.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": null,
  "currentNativeSuccessor": null,
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
    "sourcePath": "docs/reading-map.md",
    "sourceAnchor": "5-detailed-product-and-source-map",
    "sourceUnitDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91",
    "claimKind": "navigation",
    "disposition": "reclassify-out-of-platform-scope",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792093168554-f28af963@2026-10-16",
    "rationale": "Retain in place outside platform documentation authority: docs/reading-map.md#5-detailed-product-and-source-map, source unit SHA256 01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91, source file SHA256 f4fce87549f728da23d13a9ff8c8c85efc397956bfacf5c5cf83badf13dc5abb at 19ca8de23. The root instruction/navigation file remains its existing owner. No mapped platform target or platform copy is claimed. Native identity resolved at 19ca8de23; historical predecessors remain separately accounted. docs/reading-map.md section 5 contains seven labelled truth corrections plus the Session Identity entry; retained legacy docs/specs/reading-map.md is untouched. Pending independent review; no authority flip or truth certificate.",
    "reviewNote": "deep: retain-in-place heading of docs/reading-map.md section 5; file sha256 f4fce875 equals the pin, unit digest 01204e28 equal; counted seven Truth correction labels plus the Session Identity entry in section 5 as the rationale says; no target, no carry.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-09-287a22d33.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-070"
}
```

