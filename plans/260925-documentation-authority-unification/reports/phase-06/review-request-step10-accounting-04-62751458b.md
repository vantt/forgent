# Bounded re-review: accounting 4

Author session: `codex-session:unit-run-1792114313040-56132651@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **4**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
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

## Entry accounting-050

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/3/after",
  "historicalSnapshot": {
    "claimId": "claim_57f11d837272b3f9781b376ef1665c81",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-5",
    "sourceUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-10",
    "reviewNote": "deep: docs/io-contract.md#unheaded-block-5 (L24-34) to docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-10 (L83-93): the unit equals its source except one link destination (platform/session-identity/spec.md becomes ../../session-identity/spec.md), a disclosed relative-link rebase, no word changed; the rationale boilerplate fits this row; mandatory unequal row, digests recomputed, anchors pass, target ancestry equals the shard",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8aa8491435b1bd76c915faca0aaf324c77472f53839ef536c00d9cd1a7b9a2be",
    "targetAncestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Writer Source Trust Levels"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "relatedClaimId": "claim_57f11d837272b3f9781b376ef1665c81",
  "after": {
    "claimId": "claim_57f11d837272b3f9781b376ef1665c81",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-5",
    "sourceUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/io-contract.md:24-34#unheaded-block-5 (current lines); unit SHA256 d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:83-93#unheaded-block-10 (current lines); unit SHA256 8aa8491435b1bd76c915faca0aaf324c77472f53839ef536c00d9cd1a7b9a2be.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8aa8491435b1bd76c915faca0aaf324c77472f53839ef536c00d9cd1a7b9a2be at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec Session Identity\" (platform/session-identity/spec.md) → \"spec Session Identity\" (../../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/io-contract.md#unheaded-block-5 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-10; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều vào — verb + danh tính\", target context \"CLI I/O Contract / 2. Input Direction Verb And Identity / Writer Source Trust Levels\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-10",
    "reviewNote": "deep: supersede io-contract.md:24-34#unheaded-block-5@pin -> cli-io-contract.md:83-93#unheaded-block-10; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 1/1/1/0/0/0 recomputed independently and equal; 0 correction line(s) checked (after-text in target); the difference is fully explained by the listed link respellings, heading depth and corrections; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-10-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8aa8491435b1bd76c915faca0aaf324c77472f53839ef536c00d9cd1a7b9a2be",
    "targetAncestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Writer Source Trust Levels"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-10",
    "githubAnchor": "unheaded-block-10",
    "stableAnchor": "unheaded-block-10",
    "title": "Unheaded block 10",
    "startLine": 83,
    "endLine": 93,
    "textDigest": "8aa8491435b1bd76c915faca0aaf324c77472f53839ef536c00d9cd1a7b9a2be",
    "sample": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: ",
    "identityFingerprint": "b45243cbc3aa642918126e02620b2d2fe4b33f96e860cc2345ffa67cd090dc0a",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Writer Source Trust Levels"
    ],
    "text": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·\n  `env` (biến môi trường, ai cũng set được) · `pid` (tổ tiên cao nhất còn\n  terminal, không có thì session id của tiến trình gọi; best-effort) ·\n  `unresolved` (không nguồn nào xác nhận được — `id` vẫn là\n  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn\n  `source` nói giá trị chưa kiểm chứng được). Luật đầy đủ (thứ tự biến env,\n  giới hạn đã biết) chỉ nằm ở [spec Session Identity](../../session-identity/spec.md);\n  nguồn duy nhất là crate Rust `fgos-session-identity`."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "b45243cbc3aa642918126e02620b2d2fe4b33f96e860cc2345ffa67cd090dc0a",
    "identityFingerprint": "b45243cbc3aa642918126e02620b2d2fe4b33f96e860cc2345ffa67cd090dc0a",
    "claimId": "claim_a5eb3c9d9a017ed2c0697dd9aa7581be",
    "sourceAnchor": "unheaded-block-10",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "8aa8491435b1bd76c915faca0aaf324c77472f53839ef536c00d9cd1a7b9a2be",
    "claimKind": "contract",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_57f11d837272b3f9781b376ef1665c81",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-5",
    "sourceUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/io-contract.md:24-34#unheaded-block-5 (current lines); unit SHA256 d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:83-93#unheaded-block-10 (current lines); unit SHA256 8aa8491435b1bd76c915faca0aaf324c77472f53839ef536c00d9cd1a7b9a2be.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8aa8491435b1bd76c915faca0aaf324c77472f53839ef536c00d9cd1a7b9a2be at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec Session Identity\" (platform/session-identity/spec.md) → \"spec Session Identity\" (../../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/io-contract.md#unheaded-block-5 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-10; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều vào — verb + danh tính\", target context \"CLI I/O Contract / 2. Input Direction Verb And Identity / Writer Source Trust Levels\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-10",
    "reviewNote": "deep: supersede io-contract.md:24-34#unheaded-block-5@pin -> cli-io-contract.md:83-93#unheaded-block-10; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 1/1/1/0/0/0 recomputed independently and equal; 0 correction line(s) checked (after-text in target); the difference is fully explained by the listed link respellings, heading depth and corrections; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-10-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8aa8491435b1bd76c915faca0aaf324c77472f53839ef536c00d9cd1a7b9a2be",
    "targetAncestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Writer Source Trust Levels"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-050"
}
```

## Entry accounting-051

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/4/after",
  "historicalSnapshot": {
    "claimId": "claim_a14f9308d3f04e10e670c6f178d4ee33",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-7",
    "sourceUnitDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-13",
    "reviewNote": "deep: docs/io-contract.md#unheaded-block-7 (L44-49) to docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-13 (L116-121): section text byte-identical (6 lines), digests equal and recomputed, anchors pass, ancestry matches the shard; rationale fits",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "targetAncestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Caller Role"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json",
  "collection": "claims",
  "relatedClaimId": "claim_a14f9308d3f04e10e670c6f178d4ee33",
  "after": {
    "claimId": "claim_a14f9308d3f04e10e670c6f178d4ee33",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-7",
    "sourceUnitDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/io-contract.md:44-49#unheaded-block-7 (current lines); unit SHA256 b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:116-121#unheaded-block-13 (current lines); unit SHA256 b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/io-contract.md#unheaded-block-7 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-13; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều vào — verb + danh tính\", target context \"CLI I/O Contract / 2. Input Direction Verb And Identity / Caller Role\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-13",
    "reviewNote": "mechanical: move io-contract.md:44-49#unheaded-block-7 -> cli-io-contract.md:116-121#unheaded-block-13; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-10-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "targetAncestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Caller Role"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-13",
    "githubAnchor": "unheaded-block-13",
    "stableAnchor": "unheaded-block-13",
    "title": "Unheaded block 13",
    "startLine": 116,
    "endLine": 121,
    "textDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "sample": "Khác với \"chưa xác danh\", **lỗi cài đặt** thì chặn: khi không có binary host\nRust nào trả lời được identity (`host-missing`, `host-version-mismatch`,\n`timeout`, `host-error`, `bad-",
    "identityFingerprint": "364e81e85037c5701c597a7036c723d620a39c75e5137bb197651b57c9865746",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Caller Role"
    ],
    "text": "Khác với \"chưa xác danh\", **lỗi cài đặt** thì chặn: khi không có binary host\nRust nào trả lời được identity (`host-missing`, `host-version-mismatch`,\n`timeout`, `host-error`, `bad-output`), verb ghi dừng với lỗi `precondition`\n(exit 2) trước khi ghi gì, không bao giờ đoán id. Kênh `node bin/fgos.mjs` và\n`bin.fgos` của npm global vì vậy chỉ ghi được trong project đã activate, hoặc\nkhi `FGOS_HOST_BIN` trỏ tới một binary host."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "364e81e85037c5701c597a7036c723d620a39c75e5137bb197651b57c9865746",
    "identityFingerprint": "364e81e85037c5701c597a7036c723d620a39c75e5137bb197651b57c9865746",
    "claimId": "claim_ebead1511c99c215b7ef32469cdc3831",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "claimKind": "contract",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a14f9308d3f04e10e670c6f178d4ee33",
    "sourcePath": "docs/io-contract.md",
    "sourceAnchor": "unheaded-block-7",
    "sourceUnitDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/io-contract.md:44-49#unheaded-block-7 (current lines); unit SHA256 b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79.\nTarget: docs/platform/work-state/contracts/cli-io-contract.md:116-121#unheaded-block-13 (current lines); unit SHA256 b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/io-contract.md#unheaded-block-7 under docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-13; source context \"Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner` / Chiều vào — verb + danh tính\", target context \"CLI I/O Contract / 2. Input Direction Verb And Identity / Caller Role\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
    "targetAnchor": "unheaded-block-13",
    "reviewNote": "mechanical: move io-contract.md:44-49#unheaded-block-7 -> cli-io-contract.md:116-121#unheaded-block-13; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-10-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "targetAncestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Caller Role"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-051"
}
```

## Entry accounting-053

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/6/after",
  "historicalSnapshot": {
    "claimId": "claim_d9185072d68925b4c020b13ba6c4d74f",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "unheaded-block-5",
    "sourceUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-85",
    "reviewNote": "deep: docs/specs/distribution.md#unheaded-block-5 to docs/platform/packaging-distribution/spec.md#unheaded-block-85: the 17-line table is byte-identical, digests equal and hand-recomputed, anchors pass; it is the carrier of the partial-carry successor of claim_26f62a1a",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-main-recarry.json",
  "collection": "claims",
  "relatedClaimId": "claim_d9185072d68925b4c020b13ba6c4d74f",
  "after": {
    "claimId": "claim_d9185072d68925b4c020b13ba6c4d74f",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "unheaded-block-5",
    "sourceUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nTarget: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/distribution.md#unheaded-block-5 under docs/platform/packaging-distribution/spec.md#unheaded-block-85; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-85",
    "reviewNote": "deep: A36 draw (seed 2026101609); move distribution.md:57-73#unheaded-block-5 -> spec.md:517-533#unheaded-block-85, source and target text opened and identical (starts: / # / Element / Meaning / Values / Required /); classed Weak-exact (ancestor headings differ; document exact share below one half); target context Spec: Distribution / Data Dictionary equals the real heading chain; links 0/0/0/0/0/0; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-11-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-85",
    "githubAnchor": "unheaded-block-85",
    "stableAnchor": "unheaded-block-85",
    "title": "Unheaded block 85",
    "startLine": 517,
    "endLine": 533,
    "textDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "sample": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based i",
    "identityFingerprint": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "ancestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "text": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `writer-identity-resolvable` (the writer identity resolves through the Rust host for both the running host and the workspace activation a plain git commit hook uses; each binary is asked directly, so an older activated release shows as a version mismatch), `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |"
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/packaging-distribution/spec.md",
    "unitDigest": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "identityFingerprint": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "claimId": "claim_2c510f453909b3c7e8a107811003b21e",
    "sourceAnchor": "unheaded-block-85",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "claimKind": "specification",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d9185072d68925b4c020b13ba6c4d74f",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "unheaded-block-5",
    "sourceUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:57-73#unheaded-block-5 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nTarget: docs/platform/packaging-distribution/spec.md:517-533#unheaded-block-85 (current lines); unit SHA256 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/distribution.md#unheaded-block-5 under docs/platform/packaging-distribution/spec.md#unheaded-block-85; source context \"Spec: Distribution / Data Dictionary\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution / Data Dictionary\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-85",
    "reviewNote": "deep: A36 draw (seed 2026101609); move distribution.md:57-73#unheaded-block-5 -> spec.md:517-533#unheaded-block-85, source and target text opened and identical (starts: / # / Element / Meaning / Values / Required /); classed Weak-exact (ancestor headings differ; document exact share below one half); target context Spec: Distribution / Data Dictionary equals the real heading chain; links 0/0/0/0/0/0; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-11-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-053"
}
```

## Entry accounting-056

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/9/after",
  "historicalSnapshot": {
    "claimId": "claim_03ef50e87178220032a3eebe5c5d89d9",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceAnchor": "file-block",
    "sourceUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
    "targetOwner": "docs/platform/contracts/architecture-manifest.json",
    "targetAnchor": "file-block",
    "reviewNote": "deep: docs/architecture-manifest.json to docs/platform/contracts/architecture-manifest.json: cmp shows the two files byte-identical, file-block digests equal (2d55be82) and recomputed by python, so move is accurate; the boilerplate rationale fits a pure carry; the target anchor is the non-markdown file-block so the anchor CLI is not applicable",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": [],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-main-recarry.json",
  "collection": "claims",
  "relatedClaimId": "claim_03ef50e87178220032a3eebe5c5d89d9",
  "after": {
    "claimId": "claim_03ef50e87178220032a3eebe5c5d89d9",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceAnchor": "file-block",
    "sourceUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/contracts/architecture-manifest.json",
    "targetAnchor": "file-block",
    "reviewNote": "mechanical: move architecture-manifest.json:1-269#file-block -> architecture-manifest.json:1-269#file-block; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Unit-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-11-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": [],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "currentTarget": {
    "unitKind": "file-block",
    "anchor": "file-block",
    "githubAnchor": "file-block",
    "stableAnchor": "file-block",
    "title": "architecture-manifest.json",
    "startLine": 1,
    "endLine": 269,
    "textDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "identityFingerprint": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "sample": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": ",
    "ancestry": [],
    "text": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": [\n    \"one-directional-layer\",\n    \"domain-siloing\"\n  ],\n  \"components\": [\n    \"packaging-distribution\"\n  ],\n  \"domains\": [\n    \"coding\",\n    \"marketing\"\n  ],\n  \"files\": {\n    \"bin/fgos.mjs\": \"entry\",\n    \"bin/fgos-runner.mjs\": \"entry\",\n    \"src/runner/loop.mjs\": \"use-case\",\n    \"src/runner/paths.mjs\": \"infra\",\n    \"src/runner/dispatch.mjs\": \"infra\",\n    \"src/runner/operation-capability.mjs\": \"domain\",\n    \"src/runner/rigor.mjs\": \"kernel\",\n    \"src/runner/fanout-batch.mjs\": \"use-case\",\n    \"src/runner/work-compat.mjs\": \"infra\",\n    \"src/runner/dispatch/adapters.mjs\": \"infra\",\n    \"src/runner/dispatch/config.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/policies.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/bypass-pairing.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/backend-registry.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/authority.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/request.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/resources.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/cleanup.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/attestation-store.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/drivers/bwrap.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/probes/harness.mjs\": \"infra\",\n    \"src/runner/dispatch/resolve.mjs\": \"infra\",\n    \"src/runner/dispatch/mechanism.mjs\": \"infra\",\n    \"src/runner/dispatch/plan.mjs\": \"infra\",\n    \"src/runner/dispatch/transport.mjs\": \"infra\",\n    \"src/runner/dispatch/prepare.mjs\": \"infra\",\n    \"src/runner/dispatch/result-ladder.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-layout.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-normalizer.mjs\": \"infra\",\n    \"src/runner/dispatch/execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/effective-execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/agent-result-claim-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/evidence-attribution.mjs\": \"infra\",\n    \"src/runner/dispatch/write-scope.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-timeout.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-result.mjs\": \"infra\",\n    \"src/runner/dispatch/usage-parsers.mjs\": \"infra\",\n    \"src/runner/dispatch/runtime-inspection.mjs\": \"infra\",\n    \"src/runner/dispatch/reconciliation-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-policy.mjs\": \"infra\",\n    \"src/runner/dispatch/operation-prompt-templates.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-adapter.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-capacity.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-auth-failure.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-account-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-renewal.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-runner.mjs\": \"infra\",\n    \"src/runner/dispatch/settlement.mjs\": \"infra\",\n    \"src/runner/dispatch/reconcile-cli-spawn.mjs\": \"infra\",\n    \"src/runner/dispatch/cli.mjs\": \"infra\",\n    \"src/runner/dispatch/detached-run-supervisor.mjs\": \"infra\",\n    \"src/runner/prompt-templates.mjs\": \"infra\",\n    \"src/runner/worker-log.mjs\": \"infra\",\n    \"src/runner/agent-roster.mjs\": \"infra\",\n    \"src/runner/agent-definitions.mjs\": \"infra\",\n    \"src/runner/agent-listing.mjs\": \"infra\",\n    \"src/runner/worktree.mjs\": \"infra\",\n    \"src/runner/promote-preflight.mjs\": \"infra\",\n    \"src/runner/promote-engine.mjs\": \"infra\",\n    \"src/runner/session.mjs\": \"infra\",\n    \"src/runner/gateway-control.mjs\": \"infra\",\n    \"src/runner/goal-check.mjs\": \"infra\",\n    \"src/runner/iron-law-gate.mjs\": \"infra\",\n    \"src/runner/frozen-judge.mjs\": \"domain\",\n    \"src/runner/merge.mjs\": \"infra\",\n    \"src/runner/main-checkout-lock.mjs\": \"infra\",\n    \"src/runner/main-checkout-activity.mjs\": \"infra\",\n    \"src/runner/main-checkout-reset-guard.mjs\": \"infra\",\n    \"src/runner/github-adapter.mjs\": \"infra\",\n    \"src/state/drift-status.mjs\": \"infra\",\n    \"src/state/postland-drift.mjs\": \"infra\",\n    \"src/state/store.mjs\": \"infra\",\n    \"src/state/gate-bypass.mjs\": \"infra\",\n    \"src/state/cursor.mjs\": \"use-case\",\n    \"src/state/porting-store.mjs\": \"infra\",\n    \"src/state/tool-registry.mjs\": \"domain\",\n    \"src/install/coexist.mjs\": \"infra\",\n    \"src/runner/recovery.mjs\": \"domain\",\n    \"src/runner/anti-loop.mjs\": \"domain\",\n    \"src/runner/attestation-guard.mjs\": \"domain\",\n    \"src/runner/claim-port.mjs\": \"infra\",\n    \"src/runner/claim-liveness.mjs\": \"infra\",\n    \"src/runner/lock-wait.mjs\": \"infra\",\n    \"src/runner/write-queue.mjs\": \"domain\",\n    \"src/runner/root-affinity.mjs\": \"domain\",\n    \"src/state/status-fsm.mjs\": \"domain\",\n    \"src/state/decision-question.mjs\": \"domain\",\n    \"src/state/handoff.mjs\": \"domain\",\n    \"src/state/porting.mjs\": \"domain\",\n    \"src/state/frontier.mjs\": \"domain\",\n    \"src/state/impact.mjs\": \"domain\",\n    \"src/state/priority-formula.mjs\": \"domain\",\n    \"src/state/replay.mjs\": \"domain\",\n    \"src/state/events-compaction.mjs\": \"domain\",\n    \"src/state/dep-graph.mjs\": \"domain\",\n    \"src/state/graph-harness.mjs\": \"domain\",\n    \"src/state/graph-metrics.mjs\": \"domain\",\n    \"src/state/awaiting-context.mjs\": \"domain\",\n    \"src/state/cleanup-harness.mjs\": \"domain\",\n    \"src/state/cleanup-pool.mjs\": \"domain\",\n    \"src/state/discover-pool.mjs\": \"domain\",\n    \"src/state/plan-pool.mjs\": \"domain\",\n    \"src/state/retro-pool.mjs\": \"domain\",\n    \"src/state/retrospective-doors.mjs\": \"domain\",\n    \"src/state/worker-slots.mjs\": \"domain\",\n    \"src/intake/discovery.mjs\": \"use-case\",\n    \"src/intake/plan.mjs\": \"use-case\",\n    \"src/intake/plan-verdict-from-plan-md.mjs\": \"use-case\",\n    \"src/intake/verify-pattern-check.mjs\": \"kernel\",\n    \"src/cli/command-registry.mjs\": \"kernel\",\n    \"src/cli/deprecation.mjs\": \"kernel\",\n    \"src/cli/version.mjs\": \"kernel\",\n    \"src/cli/invocation-fault-log.mjs\": \"infra\",\n    \"src/cli/approve-fault-log.mjs\": \"infra\",\n    \"src/report/enduser-index.mjs\": \"domain\",\n    \"src/report/enduser-index-generate.mjs\": \"infra\",\n    \"src/report/decision-index.mjs\": \"infra\",\n    \"src/report/capability-plan-lint.mjs\": \"infra\",\n    \"src/report/context-render.mjs\": \"domain\",\n    \"src/report/frontmatter.mjs\": \"domain\",\n    \"src/report/authoritative-match.mjs\": \"domain\",\n    \"src/evolve/iron-law.mjs\": \"domain\",\n    \"src/state/events.mjs\": \"kernel\",\n    \"src/state/events-jsonl-truncation-guard.mjs\": \"kernel\",\n    \"src/state/main-checkout-guard-warnings.mjs\": \"kernel\",\n    \"src/state/work.mjs\": \"kernel\",\n    \"src/state/envelope.mjs\": \"kernel\",\n    \"src/intake/risk-keywords.mjs\": \"kernel\",\n    \"src/verbs/merge/merge.mjs\": \"use-case\",\n    \"src/verbs/merge/iron-law-level.mjs\": \"use-case\",\n    \"src/verbs/merge/approve.mjs\": \"use-case\",\n    \"src/verbs/merge/review.mjs\": \"use-case\",\n    \"src/verbs/merge/sync-root.mjs\": \"use-case\",\n    \"src/verbs/merge/catchup.mjs\": \"use-case\",\n    \"src/verbs/merge/reject.mjs\": \"use-case\",\n    \"src/verbs/merge/promote-to-component.mjs\": \"use-case\",\n    \"src/verbs/state/edit.mjs\": \"use-case\",\n    \"src/verbs/state/move.mjs\": \"use-case\",\n    \"src/verbs/state/read.mjs\": \"use-case\",\n    \"src/verbs/dispatch/show-run.mjs\": \"use-case\",\n    \"src/verbs/dispatch/inspect.mjs\": \"use-case\",\n    \"src/verbs/dispatch/reconcile.mjs\": \"use-case\",\n    \"src/verbs/dispatch/watch.mjs\": \"use-case\",\n    \"src/verbs/dispatch/recover.mjs\": \"use-case\",\n    \"src/report/item-trace.mjs\": \"domain\",\n    \"src/util/format-bytes.mjs\": \"kernel\",\n    \"src/util/format-duration.mjs\": \"kernel\",\n    \"src/util/normalize-path.mjs\": \"kernel\",\n    \"src/util/git-paths.mjs\": \"kernel\",\n    \"src/util/release-binary-path.mjs\": \"kernel\",\n    \"src/util/release-targets.mjs\": \"kernel\",\n    \"src/util/session-identity.mjs\": \"kernel\",\n    \"src/util/host-bin-path.mjs\": \"kernel\",\n    \"src/util/unique-tmp-tag.mjs\": \"kernel\",\n    \"src/util/host-bin.mjs\": \"infra\",\n    \"src/convention/convention-client.mjs\": \"infra\",\n    \"src/observe/friction-client.mjs\": \"infra\",\n    \"src/intake/classify.mjs\": \"use-case\",\n    \"src/setup/ansi.mjs\": \"domain\",\n    \"src/setup/config-merge.mjs\": \"domain\",\n    \"src/setup/shell-rc.mjs\": \"infra\",\n    \"src/setup/project-launcher.mjs\": \"infra\",\n    \"src/setup/bin-discovery.mjs\": \"infra\",\n    \"src/setup/skill-wrappers.mjs\": \"infra\",\n    \"src/setup/instruction-registry.mjs\": \"infra\",\n    \"src/setup/git-hooks.mjs\": \"infra\",\n    \"src/setup/claude-code-hooks.mjs\": \"infra\",\n    \"src/setup/agent-hooks.mjs\": \"infra\",\n    \"src/setup/agy-permissions.mjs\": \"infra\",\n    \"src/setup/agent-cli-trust.mjs\": \"infra\",\n    \"src/setup/blind-steps-proven-pools.mjs\": \"use-case\",\n    \"src/setup/workflow-pool-independence.mjs\": \"use-case\",\n    \"src/setup/checks.mjs\": \"use-case\",\n    \"src/setup/executor-profile-warnings.mjs\": \"infra\",\n    \"src/config/global-config.mjs\": \"infra\",\n    \"src/setup/registrations.mjs\": \"use-case\",\n    \"src/setup/executor-posture-coverage.mjs\": \"use-case\",\n    \"src/config/shared-config-file.mjs\": \"domain\",\n    \"src/state/knowledge-registry.mjs\": \"domain\",\n    \"src/report/knowledge-resolver.mjs\": \"domain\",\n    \"src/report/knowledge-projection.mjs\": \"domain\",\n    \"src/state/fgos-file-registry.mjs\": \"kernel\",\n    \"src/state/runtime-coordination.mjs\": \"infra\",\n    \"src/runner/dispatch/brief.mjs\": \"infra\",\n    \"src/runner/dispatch/dispatch-error.mjs\": \"infra\",\n    \"src/runner/dispatch/proof-helpers.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-agent.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-diagnosis.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-round.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-reconcile.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-artifacts.mjs\": \"infra\",\n    \"src/runner/dispatch/liveness.mjs\": \"infra\",\n    \"src/runner/dispatch/visibility-session.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/run-lock.mjs\": \"infra\",\n    \"src/runner/dispatch/process-identity.mjs\": \"infra\",\n    \"src/runner/dispatch/trust-store.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-home.mjs\": \"infra\",\n    \"src/runner/dispatch/stop-processes-inside.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session-boot.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery.mjs\": \"infra\",\n    \"src/setup/instruction-composition.mjs\": \"infra\",\n    \"src/setup/instruction-projections.mjs\": \"infra\",\n    \"src/runner/execution/unit.mjs\": \"infra\",\n    \"src/runner/execution/bind.mjs\": \"infra\",\n    \"src/runner/execution/account-pin.mjs\": \"infra\",\n    \"src/runner/execution/account-rotation.mjs\": \"infra\",\n    \"src/runner/execution/dry-bind.mjs\": \"infra\",\n    \"src/runner/execution/role-ledger.mjs\": \"infra\",\n    \"src/runner/execution/commit-unit-work.mjs\": \"infra\",\n    \"src/runner/execution/partial-writes.mjs\": \"infra\",\n    \"src/runner/execution/unit-sync.mjs\": \"infra\",\n    \"src/runner/execution/handoff-refs.mjs\": \"infra\",\n    \"src/runner/execution/unit-run-history.mjs\": \"infra\",\n    \"src/runner/execution/unit-summary.mjs\": \"infra\",\n    \"src/runner/execution/run.mjs\": \"use-case\",\n    \"src/runner/execution/patterns/index.mjs\": \"domain\",\n    \"src/runner/execution/patterns/panel.mjs\": \"domain\",\n    \"src/runner/execution/patterns/presets.mjs\": \"domain\",\n    \"src/runner/execution/patterns/reviewed.mjs\": \"domain\",\n    \"src/runner/execution/patterns/role-tasks.mjs\": \"domain\",\n    \"src/runner/execution/patterns/solo.mjs\": \"domain\",\n    \"src/workflow/definition.mjs\": \"kernel\",\n    \"src/workflow/dir-guard.mjs\": \"infra\",\n    \"src/workflow/loader.mjs\": \"infra\",\n    \"src/workflow/store.mjs\": \"infra\",\n    \"src/workflow/integrate.mjs\": \"infra\",\n    \"src/workflow/plan-source.mjs\": \"infra\",\n    \"src/workflow/units-source.mjs\": \"infra\",\n    \"src/workflow/runner.mjs\": \"use-case\",\n    \"src/workflow/index.mjs\": \"use-case\",\n    \"src/workflow/checked.mjs\": \"infra\",\n    \"src/workflow/ref-digests.mjs\": \"infra\",\n    \"src/workflow/seat-providers.mjs\": \"infra\",\n    \"src/workflow/seats.mjs\": \"infra\",\n    \"src/workflow/steps.mjs\": \"kernel\",\n    \"src/state/domain-registry.mjs\": \"kernel\",\n    \"src/state/step-fsm.mjs\": \"domain\",\n    \"src/verbs/state/step.mjs\": \"use-case\",\n    \"src/runner/operation-choice.mjs\": \"use-case\",\n    \"src/runner/work-dispatch.mjs\": \"use-case\"\n  }\n}"
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/contracts/architecture-manifest.json",
    "unitDigest": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "identityFingerprint": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "claimId": "claim_95bccfdc53e0c3efcfa29e694d26d5a3",
    "sourceAnchor": "file-block",
    "unitKind": "file-block",
    "sourceUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "claimKind": "contract",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "currentDecision": {
    "claimId": "claim_03ef50e87178220032a3eebe5c5d89d9",
    "sourcePath": "docs/architecture-manifest.json",
    "sourceAnchor": "file-block",
    "sourceUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nTarget: docs/platform/contracts/architecture-manifest.json:1-269#file-block (current lines); unit SHA256 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architecture-manifest.json#file-block under docs/platform/contracts/architecture-manifest.json#file-block; source context \"file-block\", target context \"file-block\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/contracts/architecture-manifest.json",
    "targetAnchor": "file-block",
    "reviewNote": "mechanical: move architecture-manifest.json:1-269#file-block -> architecture-manifest.json:1-269#file-block; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Unit-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-11-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "targetAncestry": [],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "entryId": "accounting-056"
}
```

