# Bounded re-review: rationales 10

Author session: `codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **20**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
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

## Entry rationale-255

```json
{
  "entryId": "rationale-255",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-mapped-conservation.json",
  "collection": "claims",
  "claimId": "claim_e5cc66ff5930f04b7ebd9a8acbc52942",
  "before": {
    "claimId": "claim_e5cc66ff5930f04b7ebd9a8acbc52942",
    "sourceUnitDigest": "b6e2d59f4375e48f5ac79aa9807e336f672b11db5beb8b6b786512b62a782ef3",
    "targetOwner": "docs/platform/documentation/switchboard.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/transitional-switchboard.md:112-119#unheaded-block-7 (current lines); unit SHA256 b6e2d59f4375e48f5ac79aa9807e336f672b11db5beb8b6b786512b62a782ef3.\nTarget: docs/platform/documentation/switchboard.md:111-118#unheaded-block-7 (current lines); unit SHA256 9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 6, target 6; 6 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"docs/reading-map.md\" (reading-map.md) → \"docs/reading-map.md\" (../../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 2: \"docs/platform/README.md\" (platform/README.md) → \"docs/platform/README.md\" (../README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 3: \"docs/doc-governance.md\" (doc-governance.md) → \"docs/platform/governance.md\" (../governance.md); resolved docs/doc-governance.md → docs/platform/governance.md.\nLink 4: \"docs/platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"docs/platform/migration-authoring-rules.md\" (../migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\" (../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) → \"plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\" (../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md); resolved plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md → plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md.\nLink 6: \"plans/260925-documentation-authority-unification/plan.md\" (../plans/260925-documentation-authority-unification/plan.md) → \"plans/260925-documentation-authority-unification/plan.md\" (../../../plans/260925-documentation-authority-unification/plan.md); resolved plans/260925-documentation-authority-unification/plan.md → plans/260925-documentation-authority-unification/plan.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/transitional-switchboard.md#unheaded-block-7 under docs/platform/documentation/switchboard.md#unheaded-block-7; source context \"Transitional Documentation Authority Switchboard / 5. Related Files\", target context \"Transitional Documentation Authority Switchboard / 5. Related Files\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "deep: supersede transitional-switchboard.md:112-119#unheaded-block-7@pin -> switchboard.md:111-118#unheaded-block-7; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 6/6/6/1/0/0 recomputed independently and equal; 0 correction line(s) checked (after-text in target); 1 residual text hunk(s) beyond links/corrections, which the successor-text sentence discloses; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-11-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "targetAncestry": [
      "Transitional Documentation Authority Switchboard",
      "5. Related Files"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_e5cc66ff5930f04b7ebd9a8acbc52942",
    "sourceUnitDigest": "b6e2d59f4375e48f5ac79aa9807e336f672b11db5beb8b6b786512b62a782ef3",
    "targetOwner": "docs/platform/documentation/switchboard.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/transitional-switchboard.md:112-119#unheaded-block-7 (current lines); unit SHA256 b6e2d59f4375e48f5ac79aa9807e336f672b11db5beb8b6b786512b62a782ef3.\nTarget: docs/platform/documentation/switchboard.md:111-118#unheaded-block-7 (current lines); unit SHA256 9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 6, target 6; 7 changed spellings/labels, 0 destination changes; 1 added, 1 removed.\nLink 1: \"docs/reading-map.md\" (reading-map.md) → \"docs/reading-map.md\" (../../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 2: \"docs/platform/README.md\" (platform/README.md) → \"docs/platform/README.md\" (../README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 3: \"docs/doc-governance.md\" (doc-governance.md) → \"none\" (none); resolved docs/doc-governance.md → none.\nLink 3: \"none\" (none) → \"docs/platform/governance.md\" (../governance.md); resolved none → docs/platform/governance.md.\nLink 4: \"docs/platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"docs/platform/migration-authoring-rules.md\" (../migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\" (../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) → \"plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\" (../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md); resolved plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md → plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md.\nLink 6: \"plans/260925-documentation-authority-unification/plan.md\" (../plans/260925-documentation-authority-unification/plan.md) → \"plans/260925-documentation-authority-unification/plan.md\" (../../../plans/260925-documentation-authority-unification/plan.md); resolved plans/260925-documentation-authority-unification/plan.md → plans/260925-documentation-authority-unification/plan.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/transitional-switchboard.md#unheaded-block-7 under docs/platform/documentation/switchboard.md#unheaded-block-7; source context \"Transitional Documentation Authority Switchboard / 5. Related Files\", target context \"Transitional Documentation Authority Switchboard / 5. Related Files\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "targetAncestry": [
      "Transitional Documentation Authority Switchboard",
      "5. Related Files"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 254,
  "factsSHA256": "65235626e1c3beb457c0817872825f350c9235d00ca9554674a466978c357c7b",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-7",
    "githubAnchor": "unheaded-block-7",
    "stableAnchor": "unheaded-block-7",
    "title": "Unheaded block 7",
    "startLine": 112,
    "endLine": 119,
    "textDigest": "b6e2d59f4375e48f5ac79aa9807e336f672b11db5beb8b6b786512b62a782ef3",
    "sample": "| Relationship | File |\n|---|---|\n| reader orientation | [docs/reading-map.md](reading-map.md) |\n| platform portal | [docs/platform/README.md](platform/README.md) |\n| documentation",
    "identityFingerprint": "b1fce99fcce6164a0cf4acc28f81c98a67f7fd50a27ec8239acc1d557a9272b5",
    "ancestry": [
      "Transitional Documentation Authority Switchboard",
      "5. Related Files"
    ],
    "path": "docs/transitional-switchboard.md"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-7",
    "githubAnchor": "unheaded-block-7",
    "stableAnchor": "unheaded-block-7",
    "title": "Unheaded block 7",
    "startLine": 111,
    "endLine": 118,
    "textDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "sample": "| Relationship | File |\n|---|---|\n| reader orientation | [docs/reading-map.md](../../reading-map.md) |\n| platform portal | [docs/platform/README.md](../README.md) |\n| documentation",
    "identityFingerprint": "9fcc7b2d1b7e3d57658c3da119865bacbb599e64f7fc47b2b3d04cd2fac6469f",
    "ancestry": [
      "Transitional Documentation Authority Switchboard",
      "5. Related Files"
    ],
    "path": "docs/platform/documentation/switchboard.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e5cc66ff5930f04b7ebd9a8acbc52942",
    "sourceUnitDigest": "b6e2d59f4375e48f5ac79aa9807e336f672b11db5beb8b6b786512b62a782ef3",
    "targetOwner": "docs/platform/documentation/switchboard.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/transitional-switchboard.md:112-119#unheaded-block-7 (current lines); unit SHA256 b6e2d59f4375e48f5ac79aa9807e336f672b11db5beb8b6b786512b62a782ef3.\nTarget: docs/platform/documentation/switchboard.md:111-118#unheaded-block-7 (current lines); unit SHA256 9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 6, target 6; 7 changed spellings/labels, 0 destination changes; 1 added, 1 removed.\nLink 1: \"docs/reading-map.md\" (reading-map.md) → \"docs/reading-map.md\" (../../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 2: \"docs/platform/README.md\" (platform/README.md) → \"docs/platform/README.md\" (../README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 3: \"docs/doc-governance.md\" (doc-governance.md) → \"none\" (none); resolved docs/doc-governance.md → none.\nLink 3: \"none\" (none) → \"docs/platform/governance.md\" (../governance.md); resolved none → docs/platform/governance.md.\nLink 4: \"docs/platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"docs/platform/migration-authoring-rules.md\" (../migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\" (../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) → \"plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md\" (../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md); resolved plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md → plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md.\nLink 6: \"plans/260925-documentation-authority-unification/plan.md\" (../plans/260925-documentation-authority-unification/plan.md) → \"plans/260925-documentation-authority-unification/plan.md\" (../../../plans/260925-documentation-authority-unification/plan.md); resolved plans/260925-documentation-authority-unification/plan.md → plans/260925-documentation-authority-unification/plan.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/transitional-switchboard.md#unheaded-block-7 under docs/platform/documentation/switchboard.md#unheaded-block-7; source context \"Transitional Documentation Authority Switchboard / 5. Related Files\", target context \"Transitional Documentation Authority Switchboard / 5. Related Files\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "targetAncestry": [
      "Transitional Documentation Authority Switchboard",
      "5. Related Files"
    ]
  }
}
```

## Entry rationale-256

```json
{
  "entryId": "rationale-256",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-source-native-successors.json",
  "collection": "registryGaps",
  "claimId": "claim_8ffb36c0af7a1f88517179b8b1adb0a4",
  "before": {
    "claimId": "claim_8ffb36c0af7a1f88517179b8b1adb0a4",
    "sourcePath": "docs/platform/work-state/spec.md",
    "sourceAnchor": "unheaded-block-93",
    "sourceUnitDigest": "5c61302d66e78a5c872334e3a00927d6a8230642fd670dc0af923cad3e83f3b8",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-93",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "rationale": "Source: docs/platform/work-state/spec.md:1032-1085#unheaded-block-93 (historical witness at 55ec1e0c40410b70b1e4024232a233d4e3d96b3d); unit SHA256 5c61302d66e78a5c872334e3a00927d6a8230642fd670dc0af923cad3e83f3b8.\nTarget: docs/platform/work-state/spec.md:1041-1094#unheaded-block-93 (current lines); unit SHA256 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nU26 RUL10: \"`addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`)\" → \"`addWork`/`editWork`/`moveWork`/`moveStep` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStep`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1430-1465.\nU26 RUL15: \"(dep chỉ mở khi thật `done`)\" → \"(dep mở ở `delivered`/`retrospective`/`cleanup`/`done` hoặc khi bị hủy)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/frontier.mjs:240-273.\nU26 RUL16 classification: \"Phân loại tier/kind/risk của `submit`\" → \"Phân loại size/kind/risk cơ học của `submit` (rigor là cờ tùy chọn)\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1066-1088.\nU26 RUL16 heavy: \"bộ từ khóa rủi-ro-nặng quyết định tier `heavy`\" → \"bộ từ khóa rủi-ro-nặng quyết định size `heavy` và risk `heavy`\"; evidence root-authorities-truth-corrections-turn21.json; src/intake/classify.mjs:1-137.\nU26 RUL18 add entry: \"qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing`\" → \"qua `add` cũng mặc định step đầu chuỗi qua `entryStepFor` (`discovery` với `coding`); chỉ bản ghi cũ không mang step mới được đọc lazy là `executing`\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:970-985; src/state/replay.mjs:45-58.\nU26 RUL19 discovery worker: \"Lượt quét cơ học này KHÔNG tự phán hộ verdict: không có verdict do người gọi cung cấp thì nó để item nguyên tại chỗ, chờ một phiên sống.\" → \"Lượt quét dispatch worker `fgos-researching`; verdict thật của worker đi qua `resolveDiscovery`, có thể chuyển item sang `planning` hoặc `exploring` mà không cần một phiên sống ngồi chờ.\"; evidence root-authorities-truth-corrections-turn21.json; src/runner/loop.mjs:1446-1500; src/runner/loop.mjs:1530-1587.\nU26 RUL26 plan gate: \"item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`.\" → \"item đậu `awaiting-human` mang đề xuất chia khi phán báo cần người, khi cổng từ khóa rủi ro đòi duyệt, khi blast-radius gate đòi duyệt, khi lần kiểm thứ hai tranh chấp verify của con, hoặc khi footprint con overlap mà chưa được phân thứ tự bằng deps.\"; evidence root-authorities-truth-corrections-turn21.json; src/intake/plan.mjs:745-819; src/intake/plan.mjs:884-898.\nU26 RUL30 settlement: \"lên CÙNG sự kiện `doing→awaiting-approval`\" → \"lên CÙNG sự kiện settle về `awaiting-approval` (claim mới: `todo→awaiting-approval` hoặc `blocked→awaiting-approval`; không ghi bền vào `doing`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/status-fsm.mjs:120-139; src/state/store.mjs:1180-1207.\nU26 RUL33 take: \"với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, có tính)\" → \"với người chọn cầm việc qua cửa pull để tự làm-lại tay (claim overlay đọc effective status `doing`, không ghi cạnh bền `blocked→doing`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/status-fsm.mjs:120-139; src/runner/claim-port.mjs:210-234.\nU26 RUL34 markers: \"`branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên cạnh `blocked→doing`, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên cạnh `doing→awaiting-approval`\" → \"`branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên claim record, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên settlement/lastAttempt khi về `awaiting-approval`\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1213-1245; src/runner/claim-port.mjs:210-234.\nU26 RUL53 doc path: \"KHÔNG kiểm hình dạng (đường dẫn tự do)\" → \"`compound` (đã deprecated, khuyến nghị `fgos doc`) đòi đường dẫn đã commit ở HEAD của main checkout; khi bật `docRegistry.enforce`, đường dẫn phải là currentPath đã đăng ký, không ambiguous hay alias\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1640-1655; bin/fgos.mjs:1677-1710.\nU26 RUL60 retired tier (composed with U26 RUL60 wrapper ordering): \"- **RUL60 (`submit` — ba cờ ghi-đè `--tier`/`--kind`/`--risk`, độc lập từng trường; `risk` KHÔNG mirror `tier` khi có cờ).** Xem \\\"Nộp vấn đề tự do (submit)\\\" trên: mặc định cả ba trường vẫn suy cơ học từ mô tả (đếm từ khóa) như trước; ba cờ tùy chọn ghi đè TỪNG TRƯỜNG một cách độc lập — có `--tier` không bắt buộc phải có `--kind`/`--risk`, và ngược lại. Khi CHỈ `--tier` có mặt (không `--risk`), `risk` VẪN suy cơ học như trước — tức `risk` khi đó mirror `tier` CƠ HỌC (giá trị suy ra, không phải giá trị vừa ghi đè qua cờ) — một điểm dễ hiểu lầm: `submit \\\"...\\\" --tier heavy` (không `--risk`) có thể cho ra item `risk` KHÁC `heavy` nếu suy luận cơ học trên mô tả đó tự ra một bậc khác. Cờ vắng mặt không đổi hành vi cũ một byte (cùng khuôn optional-additive như `--domain`/`--deps`/`--acceptance` — RUL nền). Trường `domain` KHÔNG nằm trong phạm vi ba cờ này và không bị đụng tới (giữ nguyên hành vi cũ hoàn toàn). BÊN SẢN XUẤT giá trị cho ba cờ này từng là kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify), gọi trực tiếp khi có một mô tả tự do cần nộp trước cả khi `submit` chạy; skill đó đã RÚT (tsk-6ar) vì việc nó làm bị `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`, tsk-5wz) làm lại — trên bản mô tả SẠCH hơn (sau clarify, không phải trước) — cho bất kỳ phiên sống nào gọi cửa thường, không cần gọi riêng một skill nữa. Đường sản xuất còn sống hiện nay KHÔNG còn đi qua ba cờ `--tier`/`--kind`/`--risk` của chính verb `submit` mô tả ở trên — ba cờ ấy vẫn hoạt động y nguyên cho bất kỳ bên gọi nào (người, script, agent khác) muốn ghi đè trực tiếp lúc nộp, chỉ là không còn một skill đứng sẵn để tự suy luận và điền hộ chúng. **Cập nhật (cờ phân loại của `discover`):** chỗ phán lại chính thức nay là verb `discover` ở stage `discovery` — nó nhận cùng ba cờ và áp qua chốt chặn dùng chung với đường headless (xem \\\"Chạy context-discovery (discover)\\\" trên). `fgos edit` vẫn là cửa ghi hợp lệ cho một chỉnh tay lẻ, nhưng nó không còn là đường sản xuất được mô tả ở đây: phân loại thuộc về `discovery`, sau research, chứ không thuộc về một bước 6b nối sau `submit`.\" → \"- **RUL60 (`submit` — cờ phân loại hiện hành).** `--tier` đã retired và bị từ chối với hướng dẫn dùng `--size` hoặc `--rigor`; `--size`/`--rigor`/`--kind`/`--risk` là các cờ ghi đè độc lập hiện hành. Khi không ghi đè, `submit` dùng phân loại cơ học; risk không được lấy từ size do bên gọi ghi đè. `domain` là trường riêng. Kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã RÚT (tsk-6ar); Trong phiên tương tác sống, `/fgOS:submit` bước 4 gọi `fgos-clarifying` trên raw text trước khi item tồn tại: helper chỉ phân loại `domain`, có thể trả title/description đã viết lại hoặc câu hỏi làm rõ; không phán lại size/kind/risk. Bước 5 gọi `submit` với text/domain đã chốt; bước 6 chỉ báo kết quả. Chỗ phán lại chính thức là `discover` ở discovery, sau research; phần mô tả cờ tier cũ không phải hợp đồng CLI còn sống.\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1066-1088; bin/fgos.mjs:806-840; core/skills/fgos-clarifying/SKILL.md:1-65.\nU26 RUL61 writer event: \"Ba cửa ghi `work.move`/`work.edit`/`work.stage`\" → \"Ba cửa ghi `work.move`/`work.edit`/`work.step`\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1432-1455; src/state/replay.mjs:447-456.\nU26 RUL60 wrapper ordering: \"`/fgOS:submit` bước 6 làm clarify/classify trong phiên sống trên mô tả sau clarify.\" → \"Trong phiên tương tác sống, `/fgOS:submit` bước 4 gọi `fgos-clarifying` trên raw text trước khi item tồn tại: helper chỉ phân loại `domain`, có thể trả title/description đã viết lại hoặc câu hỏi làm rõ; không phán lại size/kind/risk. Bước 5 gọi `submit` với text/domain đã chốt; bước 6 chỉ báo kết quả.\"; evidence root-source-truth-fragments-turn22.json; plugins/fgOS/skills/submit/SKILL.md:24-45; plugins/fgOS/skills/submit/SKILL.md:125-163; plugins/fgOS/skills/submit/SKILL.md:188-197.\nDisposition supersede: Account for docs/platform/work-state/spec.md#unheaded-block-93 under docs/platform/work-state/spec.md#unheaded-block-93; source context \"Work State Specification / 11. Business Rules\", target context \"Work State Specification / 11. Business Rules\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "deep: supersede spec.md:1032-1085#unheaded-block-93@55ec1e0c4 -> spec.md:1041-1094#unheaded-block-93; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 0/0/0/0/0/0 recomputed independently and equal; 14 correction line(s) checked (after-text in target); 2 residual text hunk(s) beyond links/corrections, which the successor-text sentence discloses; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-13-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3",
    "targetAncestry": [
      "Work State Specification",
      "11. Business Rules"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_8ffb36c0af7a1f88517179b8b1adb0a4",
    "sourcePath": "docs/platform/work-state/spec.md",
    "sourceAnchor": "unheaded-block-93",
    "sourceUnitDigest": "5c61302d66e78a5c872334e3a00927d6a8230642fd670dc0af923cad3e83f3b8",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-93",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/platform/work-state/spec.md:1032-1085#unheaded-block-93 (historical witness at 55ec1e0c40410b70b1e4024232a233d4e3d96b3d); unit SHA256 5c61302d66e78a5c872334e3a00927d6a8230642fd670dc0af923cad3e83f3b8.\nTarget: docs/platform/work-state/spec.md:1041-1094#unheaded-block-93 (current lines); unit SHA256 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nU26 RUL60 wrapper ordering: \"`/fgOS:submit` bước 6 làm clarify/classify trong phiên sống trên mô tả sau clarify.\" → \"Trong phiên tương tác sống, `/fgOS:submit` bước 4 gọi `fgos-clarifying` trên raw text trước khi item tồn tại: helper chỉ phân loại `domain`, có thể trả title/description đã viết lại hoặc câu hỏi làm rõ; không phán lại size/kind/risk. Bước 5 gọi `submit` với text/domain đã chốt; bước 6 chỉ báo kết quả.\"; evidence root-source-truth-fragments-turn22.json; plugins/fgOS/skills/submit/SKILL.md:24-45 (evidence commit f0efa3330a14d117ad89feba91bdb9b61d768339) (pinned blob 41a02e4aa78e88182ec91cd141543197487d4e17); plugins/fgOS/skills/submit/SKILL.md:125-163 (evidence commit f0efa3330a14d117ad89feba91bdb9b61d768339) (pinned blob 41a02e4aa78e88182ec91cd141543197487d4e17); plugins/fgOS/skills/submit/SKILL.md:188-197 (evidence commit f0efa3330a14d117ad89feba91bdb9b61d768339) (pinned blob 41a02e4aa78e88182ec91cd141543197487d4e17).\nDisposition supersede: Account for docs/platform/work-state/spec.md#unheaded-block-93 under docs/platform/work-state/spec.md#unheaded-block-93; source context \"Work State Specification / 11. Business Rules\", target context \"Work State Specification / 11. Business Rules\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3",
    "targetAncestry": [
      "Work State Specification",
      "11. Business Rules"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 255,
  "factsSHA256": "505c1ae319f1f35975481edb0ce503d73e25a0326d5c56ee8bb5f20cae8d37a9",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-93",
    "githubAnchor": "unheaded-block-93",
    "stableAnchor": "unheaded-block-93",
    "title": "Unheaded block 93",
    "startLine": 1032,
    "endLine": 1085,
    "textDigest": "5c61302d66e78a5c872334e3a00927d6a8230642fd670dc0af923cad3e83f3b8",
    "sample": "- **RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất).** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lạ",
    "identityFingerprint": "787b3dda1264a67650390615cbfeb013a45aa1ff68e0e609b474910067c6723e",
    "ancestry": [
      "Work State Specification",
      "11. Business Rules"
    ],
    "path": "docs/platform/work-state/spec.md",
    "commit": "55ec1e0c40410b70b1e4024232a233d4e3d96b3d"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-93",
    "githubAnchor": "unheaded-block-93",
    "stableAnchor": "unheaded-block-93",
    "title": "Unheaded block 93",
    "startLine": 1041,
    "endLine": 1094,
    "textDigest": "9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3",
    "sample": "- **RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất).** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lạ",
    "identityFingerprint": "0ab29b6aee96cdd4765d5a1b54e298edc16900f31f7771143e57c75fdbc28225",
    "ancestry": [
      "Work State Specification",
      "11. Business Rules"
    ],
    "path": "docs/platform/work-state/spec.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8ffb36c0af7a1f88517179b8b1adb0a4",
    "sourcePath": "docs/platform/work-state/spec.md",
    "sourceAnchor": "unheaded-block-93",
    "sourceUnitDigest": "5c61302d66e78a5c872334e3a00927d6a8230642fd670dc0af923cad3e83f3b8",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-93",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/platform/work-state/spec.md:1032-1085#unheaded-block-93 (historical witness at 55ec1e0c40410b70b1e4024232a233d4e3d96b3d); unit SHA256 5c61302d66e78a5c872334e3a00927d6a8230642fd670dc0af923cad3e83f3b8.\nTarget: docs/platform/work-state/spec.md:1041-1094#unheaded-block-93 (current lines); unit SHA256 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nU26 RUL60 wrapper ordering: \"`/fgOS:submit` bước 6 làm clarify/classify trong phiên sống trên mô tả sau clarify.\" → \"Trong phiên tương tác sống, `/fgOS:submit` bước 4 gọi `fgos-clarifying` trên raw text trước khi item tồn tại: helper chỉ phân loại `domain`, có thể trả title/description đã viết lại hoặc câu hỏi làm rõ; không phán lại size/kind/risk. Bước 5 gọi `submit` với text/domain đã chốt; bước 6 chỉ báo kết quả.\"; evidence root-source-truth-fragments-turn22.json; plugins/fgOS/skills/submit/SKILL.md:24-45 (evidence commit f0efa3330a14d117ad89feba91bdb9b61d768339) (pinned blob 41a02e4aa78e88182ec91cd141543197487d4e17); plugins/fgOS/skills/submit/SKILL.md:125-163 (evidence commit f0efa3330a14d117ad89feba91bdb9b61d768339) (pinned blob 41a02e4aa78e88182ec91cd141543197487d4e17); plugins/fgOS/skills/submit/SKILL.md:188-197 (evidence commit f0efa3330a14d117ad89feba91bdb9b61d768339) (pinned blob 41a02e4aa78e88182ec91cd141543197487d4e17).\nDisposition supersede: Account for docs/platform/work-state/spec.md#unheaded-block-93 under docs/platform/work-state/spec.md#unheaded-block-93; source context \"Work State Specification / 11. Business Rules\", target context \"Work State Specification / 11. Business Rules\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3",
    "targetAncestry": [
      "Work State Specification",
      "11. Business Rules"
    ]
  }
}
```

## Entry rationale-257

```json
{
  "entryId": "rationale-257",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-truth-successors.json",
  "collection": "registryGaps",
  "claimId": "claim_8d273e8328dac53565eb0286c6a91d65",
  "before": {
    "claimId": "claim_8d273e8328dac53565eb0286c6a91d65",
    "sourcePath": "docs/platform/work-state/spec.md",
    "sourceAnchor": "unheaded-block-93",
    "sourceUnitDigest": "19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-93",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "rationale": "Source: docs/platform/work-state/spec.md:1032-1085#unheaded-block-93 (historical witness at c18698bbeb77c8d0dbb615cfe83273e4b49baeb0); unit SHA256 19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d.\nTarget: docs/platform/work-state/spec.md:1041-1094#unheaded-block-93 (current lines); unit SHA256 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nU26 RUL10: \"`addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`)\" → \"`addWork`/`editWork`/`moveWork`/`moveStep` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStep`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1430-1465.\nU26 RUL15: \"(dep chỉ mở khi thật `done`)\" → \"(dep mở ở `delivered`/`retrospective`/`cleanup`/`done` hoặc khi bị hủy)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/frontier.mjs:240-273.\nU26 RUL16 classification: \"Phân loại tier/kind/risk của `submit`\" → \"Phân loại size/kind/risk cơ học của `submit` (rigor là cờ tùy chọn)\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1066-1088.\nU26 RUL16 heavy: \"bộ từ khóa rủi-ro-nặng quyết định tier `heavy`\" → \"bộ từ khóa rủi-ro-nặng quyết định size `heavy` và risk `heavy`\"; evidence root-authorities-truth-corrections-turn21.json; src/intake/classify.mjs:1-137.\nU26 RUL18 add entry: \"qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing`\" → \"qua `add` cũng mặc định step đầu chuỗi qua `entryStepFor` (`discovery` với `coding`); chỉ bản ghi cũ không mang step mới được đọc lazy là `executing`\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:970-985; src/state/replay.mjs:45-58.\nU26 RUL19 discovery worker: \"Lượt quét cơ học này KHÔNG tự phán hộ verdict: không có verdict do người gọi cung cấp thì nó để item nguyên tại chỗ, chờ một phiên sống.\" → \"Lượt quét dispatch worker `fgos-researching`; verdict thật của worker đi qua `resolveDiscovery`, có thể chuyển item sang `planning` hoặc `exploring` mà không cần một phiên sống ngồi chờ.\"; evidence root-authorities-truth-corrections-turn21.json; src/runner/loop.mjs:1446-1500; src/runner/loop.mjs:1530-1587.\nU26 RUL26 plan gate: \"item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`.\" → \"item đậu `awaiting-human` mang đề xuất chia khi phán báo cần người, khi cổng từ khóa rủi ro đòi duyệt, khi blast-radius gate đòi duyệt, khi lần kiểm thứ hai tranh chấp verify của con, hoặc khi footprint con overlap mà chưa được phân thứ tự bằng deps.\"; evidence root-authorities-truth-corrections-turn21.json; src/intake/plan.mjs:745-819; src/intake/plan.mjs:884-898.\nU26 RUL30 settlement: \"lên CÙNG sự kiện `doing→awaiting-approval`\" → \"lên CÙNG sự kiện settle về `awaiting-approval` (claim mới: `todo→awaiting-approval` hoặc `blocked→awaiting-approval`; không ghi bền vào `doing`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/status-fsm.mjs:120-139; src/state/store.mjs:1180-1207.\nU26 RUL33 take: \"với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, có tính)\" → \"với người chọn cầm việc qua cửa pull để tự làm-lại tay (claim overlay đọc effective status `doing`, không ghi cạnh bền `blocked→doing`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/status-fsm.mjs:120-139; src/runner/claim-port.mjs:210-234.\nU26 RUL34 markers: \"`branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên cạnh `blocked→doing`, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên cạnh `doing→awaiting-approval`\" → \"`branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên claim record, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên settlement/lastAttempt khi về `awaiting-approval`\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1213-1245; src/runner/claim-port.mjs:210-234.\nU26 RUL53 doc path: \"KHÔNG kiểm hình dạng (đường dẫn tự do)\" → \"`compound` (đã deprecated, khuyến nghị `fgos doc`) đòi đường dẫn đã commit ở HEAD của main checkout; khi bật `docRegistry.enforce`, đường dẫn phải là currentPath đã đăng ký, không ambiguous hay alias\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1640-1655; bin/fgos.mjs:1677-1710.\nU26 RUL60 retired tier (composed with U26 RUL60 wrapper ordering): \"- **RUL60 (`submit` — ba cờ ghi-đè `--tier`/`--kind`/`--risk`, độc lập từng trường; `risk` KHÔNG mirror `tier` khi có cờ).** Xem \\\"Nộp vấn đề tự do (submit)\\\" trên: mặc định cả ba trường vẫn suy cơ học từ mô tả (đếm từ khóa) như trước; ba cờ tùy chọn ghi đè TỪNG TRƯỜNG một cách độc lập — có `--tier` không bắt buộc phải có `--kind`/`--risk`, và ngược lại. Khi CHỈ `--tier` có mặt (không `--risk`), `risk` VẪN suy cơ học như trước — tức `risk` khi đó mirror `tier` CƠ HỌC (giá trị suy ra, không phải giá trị vừa ghi đè qua cờ) — một điểm dễ hiểu lầm: `submit \\\"...\\\" --tier heavy` (không `--risk`) có thể cho ra item `risk` KHÁC `heavy` nếu suy luận cơ học trên mô tả đó tự ra một bậc khác. Cờ vắng mặt không đổi hành vi cũ một byte (cùng khuôn optional-additive như `--domain`/`--deps`/`--acceptance` — RUL nền). Trường `domain` KHÔNG nằm trong phạm vi ba cờ này và không bị đụng tới (giữ nguyên hành vi cũ hoàn toàn). BÊN SẢN XUẤT giá trị cho ba cờ này từng là kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify), gọi trực tiếp khi có một mô tả tự do cần nộp trước cả khi `submit` chạy; skill đó đã RÚT (tsk-6ar) vì việc nó làm bị `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`, tsk-5wz) làm lại — trên bản mô tả SẠCH hơn (sau clarify, không phải trước) — cho bất kỳ phiên sống nào gọi cửa thường, không cần gọi riêng một skill nữa. Đường sản xuất còn sống hiện nay KHÔNG còn đi qua ba cờ `--tier`/`--kind`/`--risk` của chính verb `submit` mô tả ở trên — ba cờ ấy vẫn hoạt động y nguyên cho bất kỳ bên gọi nào (người, script, agent khác) muốn ghi đè trực tiếp lúc nộp, chỉ là không còn một skill đứng sẵn để tự suy luận và điền hộ chúng. **Cập nhật (cờ phân loại của `discover`):** chỗ phán lại chính thức nay là verb `discover` ở stage `discovery` — nó nhận cùng ba cờ và áp qua chốt chặn dùng chung với đường headless (xem \\\"Chạy context-discovery (discover)\\\" trên). `fgos edit` vẫn là cửa ghi hợp lệ cho một chỉnh tay lẻ, nhưng nó không còn là đường sản xuất được mô tả ở đây: phân loại thuộc về `discovery`, sau research, chứ không thuộc về một bước 6b nối sau `submit`.\" → \"- **RUL60 (`submit` — cờ phân loại hiện hành).** `--tier` đã retired và bị từ chối với hướng dẫn dùng `--size` hoặc `--rigor`; `--size`/`--rigor`/`--kind`/`--risk` là các cờ ghi đè độc lập hiện hành. Khi không ghi đè, `submit` dùng phân loại cơ học; risk không được lấy từ size do bên gọi ghi đè. `domain` là trường riêng. Kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã RÚT (tsk-6ar); Trong phiên tương tác sống, `/fgOS:submit` bước 4 gọi `fgos-clarifying` trên raw text trước khi item tồn tại: helper chỉ phân loại `domain`, có thể trả title/description đã viết lại hoặc câu hỏi làm rõ; không phán lại size/kind/risk. Bước 5 gọi `submit` với text/domain đã chốt; bước 6 chỉ báo kết quả. Chỗ phán lại chính thức là `discover` ở discovery, sau research; phần mô tả cờ tier cũ không phải hợp đồng CLI còn sống.\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1066-1088; bin/fgos.mjs:806-840; core/skills/fgos-clarifying/SKILL.md:1-65.\nU26 RUL61 writer event: \"Ba cửa ghi `work.move`/`work.edit`/`work.stage`\" → \"Ba cửa ghi `work.move`/`work.edit`/`work.step`\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1432-1455; src/state/replay.mjs:447-456.\nU26 RUL60 wrapper ordering: \"`/fgOS:submit` bước 6 làm clarify/classify trong phiên sống trên mô tả sau clarify.\" → \"Trong phiên tương tác sống, `/fgOS:submit` bước 4 gọi `fgos-clarifying` trên raw text trước khi item tồn tại: helper chỉ phân loại `domain`, có thể trả title/description đã viết lại hoặc câu hỏi làm rõ; không phán lại size/kind/risk. Bước 5 gọi `submit` với text/domain đã chốt; bước 6 chỉ báo kết quả.\"; evidence root-source-truth-fragments-turn22.json; plugins/fgOS/skills/submit/SKILL.md:24-45; plugins/fgOS/skills/submit/SKILL.md:125-163; plugins/fgOS/skills/submit/SKILL.md:188-197.\nDisposition supersede: Account for docs/platform/work-state/spec.md#unheaded-block-93 under docs/platform/work-state/spec.md#unheaded-block-93; source context \"Work State Specification / 11. Business Rules\", target context \"Work State Specification / 11. Business Rules\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "deep: supersede spec.md:1032-1085#unheaded-block-93@c18698bbe -> spec.md:1041-1094#unheaded-block-93; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 0/0/0/0/0/0 recomputed independently and equal; 14 correction line(s) checked (after-text in target); 2 residual text hunk(s) beyond links/corrections, which the successor-text sentence discloses; last-reviewed digest backed by a committed ok verdict. hand-recomputed both digests (seed 2026101608).",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-13-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3",
    "targetAncestry": [
      "Work State Specification",
      "11. Business Rules"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_8d273e8328dac53565eb0286c6a91d65",
    "sourcePath": "docs/platform/work-state/spec.md",
    "sourceAnchor": "unheaded-block-93",
    "sourceUnitDigest": "19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-93",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/platform/work-state/spec.md:1032-1085#unheaded-block-93 (historical witness at c18698bbeb77c8d0dbb615cfe83273e4b49baeb0); unit SHA256 19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d.\nTarget: docs/platform/work-state/spec.md:1041-1094#unheaded-block-93 (current lines); unit SHA256 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nU26 RUL10: \"`addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`)\" → \"`addWork`/`editWork`/`moveWork`/`moveStep` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStep`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1430-1465 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 418f3d688929b78bae26607a8eb624737e0ead25).\nU26 RUL15: \"(dep chỉ mở khi thật `done`)\" → \"(dep mở ở `delivered`/`retrospective`/`cleanup`/`done` hoặc khi bị hủy)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/frontier.mjs:240-273 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 07bb8d9e5ec8439cc0af6541c878f9f0ae3fa764).\nU26 RUL16 classification: \"Phân loại tier/kind/risk của `submit`\" → \"Phân loại size/kind/risk cơ học của `submit` (rigor là cờ tùy chọn)\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1066-1088 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705).\nU26 RUL16 heavy: \"bộ từ khóa rủi-ro-nặng quyết định tier `heavy`\" → \"bộ từ khóa rủi-ro-nặng quyết định size `heavy` và risk `heavy`\"; evidence root-authorities-truth-corrections-turn21.json; src/intake/classify.mjs:1-137 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 35a3d03da7317a42574aa7bda3818adfb5a19c63).\nU26 RUL18 add entry: \"qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing`\" → \"qua `add` cũng mặc định step đầu chuỗi qua `entryStepFor` (`discovery` với `coding`); chỉ bản ghi cũ không mang step mới được đọc lazy là `executing`\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:970-985 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705); src/state/replay.mjs:45-58 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 905e0d26ba2789e1b7ad4b9ad89a46632bd5d48a).\nU26 RUL19 discovery worker: \"Lượt quét cơ học này KHÔNG tự phán hộ verdict: không có verdict do người gọi cung cấp thì nó để item nguyên tại chỗ, chờ một phiên sống.\" → \"Lượt quét dispatch worker `fgos-researching`; verdict thật của worker đi qua `resolveDiscovery`, có thể chuyển item sang `planning` hoặc `exploring` mà không cần một phiên sống ngồi chờ.\"; evidence root-authorities-truth-corrections-turn21.json; src/runner/loop.mjs:1446-1500 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 13364c84cdad619b5aa671d700847f2d5e3a02ae); src/runner/loop.mjs:1530-1587 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 13364c84cdad619b5aa671d700847f2d5e3a02ae).\nU26 RUL26 plan gate: \"item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`.\" → \"item đậu `awaiting-human` mang đề xuất chia khi phán báo cần người, khi cổng từ khóa rủi ro đòi duyệt, khi blast-radius gate đòi duyệt, khi lần kiểm thứ hai tranh chấp verify của con, hoặc khi footprint con overlap mà chưa được phân thứ tự bằng deps.\"; evidence root-authorities-truth-corrections-turn21.json; src/intake/plan.mjs:745-819 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob ea2bad13189ba75f59b9d4c45a3ba0a6f28013ad); src/intake/plan.mjs:884-898 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob ea2bad13189ba75f59b9d4c45a3ba0a6f28013ad).\nU26 RUL30 settlement: \"lên CÙNG sự kiện `doing→awaiting-approval`\" → \"lên CÙNG sự kiện settle về `awaiting-approval` (claim mới: `todo→awaiting-approval` hoặc `blocked→awaiting-approval`; không ghi bền vào `doing`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/status-fsm.mjs:120-139 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 6eede4ce0c28fe8bc5488ffa209a35e94180c26c); src/state/store.mjs:1180-1207 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 418f3d688929b78bae26607a8eb624737e0ead25).\nU26 RUL33 take: \"với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, có tính)\" → \"với người chọn cầm việc qua cửa pull để tự làm-lại tay (claim overlay đọc effective status `doing`, không ghi cạnh bền `blocked→doing`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/status-fsm.mjs:120-139 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 6eede4ce0c28fe8bc5488ffa209a35e94180c26c); src/runner/claim-port.mjs:210-234 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob ed742a7d151ff914e80f0ce5b640391e3d391388).\nU26 RUL34 markers: \"`branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên cạnh `blocked→doing`, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên cạnh `doing→awaiting-approval`\" → \"`branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên claim record, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên settlement/lastAttempt khi về `awaiting-approval`\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1213-1245 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 418f3d688929b78bae26607a8eb624737e0ead25); src/runner/claim-port.mjs:210-234 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob ed742a7d151ff914e80f0ce5b640391e3d391388).\nU26 RUL53 doc path: \"KHÔNG kiểm hình dạng (đường dẫn tự do)\" → \"`compound` (đã deprecated, khuyến nghị `fgos doc`) đòi đường dẫn đã commit ở HEAD của main checkout; khi bật `docRegistry.enforce`, đường dẫn phải là currentPath đã đăng ký, không ambiguous hay alias\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1640-1655 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705); bin/fgos.mjs:1677-1710 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705).\nU26 RUL60 retired tier (composed with U26 RUL60 wrapper ordering): \"- **RUL60 (`submit` — ba cờ ghi-đè `--tier`/`--kind`/`--risk`, độc lập từng trường; `risk` KHÔNG mirror `tier` khi có cờ).** Xem \\\"Nộp vấn đề tự do (submit)\\\" trên: mặc định cả ba trường vẫn suy cơ học từ mô tả (đếm từ khóa) như trước; ba cờ tùy chọn ghi đè TỪNG TRƯỜNG một cách độc lập — có `--tier` không bắt buộc phải có `--kind`/`--risk`, và ngược lại. Khi CHỈ `--tier` có mặt (không `--risk`), `risk` VẪN suy cơ học như trước — tức `risk` khi đó mirror `tier` CƠ HỌC (giá trị suy ra, không phải giá trị vừa ghi đè qua cờ) — một điểm dễ hiểu lầm: `submit \\\"...\\\" --tier heavy` (không `--risk`) có thể cho ra item `risk` KHÁC `heavy` nếu suy luận cơ học trên mô tả đó tự ra một bậc khác. Cờ vắng mặt không đổi hành vi cũ một byte (cùng khuôn optional-additive như `--domain`/`--deps`/`--acceptance` — RUL nền). Trường `domain` KHÔNG nằm trong phạm vi ba cờ này và không bị đụng tới (giữ nguyên hành vi cũ hoàn toàn). BÊN SẢN XUẤT giá trị cho ba cờ này từng là kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify), gọi trực tiếp khi có một mô tả tự do cần nộp trước cả khi `submit` chạy; skill đó đã RÚT (tsk-6ar) vì việc nó làm bị `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`, tsk-5wz) làm lại — trên bản mô tả SẠCH hơn (sau clarify, không phải trước) — cho bất kỳ phiên sống nào gọi cửa thường, không cần gọi riêng một skill nữa. Đường sản xuất còn sống hiện nay KHÔNG còn đi qua ba cờ `--tier`/`--kind`/`--risk` của chính verb `submit` mô tả ở trên — ba cờ ấy vẫn hoạt động y nguyên cho bất kỳ bên gọi nào (người, script, agent khác) muốn ghi đè trực tiếp lúc nộp, chỉ là không còn một skill đứng sẵn để tự suy luận và điền hộ chúng. **Cập nhật (cờ phân loại của `discover`):** chỗ phán lại chính thức nay là verb `discover` ở stage `discovery` — nó nhận cùng ba cờ và áp qua chốt chặn dùng chung với đường headless (xem \\\"Chạy context-discovery (discover)\\\" trên). `fgos edit` vẫn là cửa ghi hợp lệ cho một chỉnh tay lẻ, nhưng nó không còn là đường sản xuất được mô tả ở đây: phân loại thuộc về `discovery`, sau research, chứ không thuộc về một bước 6b nối sau `submit`.\" → \"- **RUL60 (`submit` — cờ phân loại hiện hành).** `--tier` đã retired và bị từ chối với hướng dẫn dùng `--size` hoặc `--rigor`; `--size`/`--rigor`/`--kind`/`--risk` là các cờ ghi đè độc lập hiện hành. Khi không ghi đè, `submit` dùng phân loại cơ học; risk không được lấy từ size do bên gọi ghi đè. `domain` là trường riêng. Kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã RÚT (tsk-6ar); Trong phiên tương tác sống, `/fgOS:submit` bước 4 gọi `fgos-clarifying` trên raw text trước khi item tồn tại: helper chỉ phân loại `domain`, có thể trả title/description đã viết lại hoặc câu hỏi làm rõ; không phán lại size/kind/risk. Bước 5 gọi `submit` với text/domain đã chốt; bước 6 chỉ báo kết quả. Chỗ phán lại chính thức là `discover` ở discovery, sau research; phần mô tả cờ tier cũ không phải hợp đồng CLI còn sống.\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1066-1088 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705); bin/fgos.mjs:806-840 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705); core/skills/fgos-clarifying/SKILL.md:1-65 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 38d80a088108662906cc81f1c9488a5ab2bd6183).\nU26 RUL61 writer event: \"Ba cửa ghi `work.move`/`work.edit`/`work.stage`\" → \"Ba cửa ghi `work.move`/`work.edit`/`work.step`\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1432-1455 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 418f3d688929b78bae26607a8eb624737e0ead25); src/state/replay.mjs:447-456 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 905e0d26ba2789e1b7ad4b9ad89a46632bd5d48a).\nDisposition supersede: Account for docs/platform/work-state/spec.md#unheaded-block-93 under docs/platform/work-state/spec.md#unheaded-block-93; source context \"Work State Specification / 11. Business Rules\", target context \"Work State Specification / 11. Business Rules\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3",
    "targetAncestry": [
      "Work State Specification",
      "11. Business Rules"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 256,
  "factsSHA256": "c67e28f62ed35b5fcd6a2ae982f8cdf863e72b530f577a6f14c689b2a749b77d",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-93",
    "githubAnchor": "unheaded-block-93",
    "stableAnchor": "unheaded-block-93",
    "title": "Unheaded block 93",
    "startLine": 1032,
    "endLine": 1085,
    "textDigest": "19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d",
    "sample": "- **RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất).** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lạ",
    "identityFingerprint": "e25e00fdc50d69f0abf8c0e8b2789a90407c66b9abb866c817059b20e3f03581",
    "ancestry": [
      "Work State Specification",
      "11. Business Rules"
    ],
    "path": "docs/platform/work-state/spec.md",
    "commit": "c18698bbeb77c8d0dbb615cfe83273e4b49baeb0"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-93",
    "githubAnchor": "unheaded-block-93",
    "stableAnchor": "unheaded-block-93",
    "title": "Unheaded block 93",
    "startLine": 1041,
    "endLine": 1094,
    "textDigest": "9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3",
    "sample": "- **RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất).** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lạ",
    "identityFingerprint": "0ab29b6aee96cdd4765d5a1b54e298edc16900f31f7771143e57c75fdbc28225",
    "ancestry": [
      "Work State Specification",
      "11. Business Rules"
    ],
    "path": "docs/platform/work-state/spec.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8d273e8328dac53565eb0286c6a91d65",
    "sourcePath": "docs/platform/work-state/spec.md",
    "sourceAnchor": "unheaded-block-93",
    "sourceUnitDigest": "19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d",
    "disposition": "supersede",
    "targetOwner": "docs/platform/work-state/spec.md",
    "targetAnchor": "unheaded-block-93",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "rationale": "Source: docs/platform/work-state/spec.md:1032-1085#unheaded-block-93 (historical witness at c18698bbeb77c8d0dbb615cfe83273e4b49baeb0); unit SHA256 19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d.\nTarget: docs/platform/work-state/spec.md:1041-1094#unheaded-block-93 (current lines); unit SHA256 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nU26 RUL10: \"`addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`)\" → \"`addWork`/`editWork`/`moveWork`/`moveStep` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStep`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1430-1465 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 418f3d688929b78bae26607a8eb624737e0ead25).\nU26 RUL15: \"(dep chỉ mở khi thật `done`)\" → \"(dep mở ở `delivered`/`retrospective`/`cleanup`/`done` hoặc khi bị hủy)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/frontier.mjs:240-273 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 07bb8d9e5ec8439cc0af6541c878f9f0ae3fa764).\nU26 RUL16 classification: \"Phân loại tier/kind/risk của `submit`\" → \"Phân loại size/kind/risk cơ học của `submit` (rigor là cờ tùy chọn)\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1066-1088 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705).\nU26 RUL16 heavy: \"bộ từ khóa rủi-ro-nặng quyết định tier `heavy`\" → \"bộ từ khóa rủi-ro-nặng quyết định size `heavy` và risk `heavy`\"; evidence root-authorities-truth-corrections-turn21.json; src/intake/classify.mjs:1-137 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 35a3d03da7317a42574aa7bda3818adfb5a19c63).\nU26 RUL18 add entry: \"qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing`\" → \"qua `add` cũng mặc định step đầu chuỗi qua `entryStepFor` (`discovery` với `coding`); chỉ bản ghi cũ không mang step mới được đọc lazy là `executing`\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:970-985 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705); src/state/replay.mjs:45-58 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 905e0d26ba2789e1b7ad4b9ad89a46632bd5d48a).\nU26 RUL19 discovery worker: \"Lượt quét cơ học này KHÔNG tự phán hộ verdict: không có verdict do người gọi cung cấp thì nó để item nguyên tại chỗ, chờ một phiên sống.\" → \"Lượt quét dispatch worker `fgos-researching`; verdict thật của worker đi qua `resolveDiscovery`, có thể chuyển item sang `planning` hoặc `exploring` mà không cần một phiên sống ngồi chờ.\"; evidence root-authorities-truth-corrections-turn21.json; src/runner/loop.mjs:1446-1500 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 13364c84cdad619b5aa671d700847f2d5e3a02ae); src/runner/loop.mjs:1530-1587 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 13364c84cdad619b5aa671d700847f2d5e3a02ae).\nU26 RUL26 plan gate: \"item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`.\" → \"item đậu `awaiting-human` mang đề xuất chia khi phán báo cần người, khi cổng từ khóa rủi ro đòi duyệt, khi blast-radius gate đòi duyệt, khi lần kiểm thứ hai tranh chấp verify của con, hoặc khi footprint con overlap mà chưa được phân thứ tự bằng deps.\"; evidence root-authorities-truth-corrections-turn21.json; src/intake/plan.mjs:745-819 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob ea2bad13189ba75f59b9d4c45a3ba0a6f28013ad); src/intake/plan.mjs:884-898 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob ea2bad13189ba75f59b9d4c45a3ba0a6f28013ad).\nU26 RUL30 settlement: \"lên CÙNG sự kiện `doing→awaiting-approval`\" → \"lên CÙNG sự kiện settle về `awaiting-approval` (claim mới: `todo→awaiting-approval` hoặc `blocked→awaiting-approval`; không ghi bền vào `doing`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/status-fsm.mjs:120-139 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 6eede4ce0c28fe8bc5488ffa209a35e94180c26c); src/state/store.mjs:1180-1207 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 418f3d688929b78bae26607a8eb624737e0ead25).\nU26 RUL33 take: \"với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, có tính)\" → \"với người chọn cầm việc qua cửa pull để tự làm-lại tay (claim overlay đọc effective status `doing`, không ghi cạnh bền `blocked→doing`)\"; evidence root-authorities-truth-corrections-turn21.json; src/state/status-fsm.mjs:120-139 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 6eede4ce0c28fe8bc5488ffa209a35e94180c26c); src/runner/claim-port.mjs:210-234 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob ed742a7d151ff914e80f0ce5b640391e3d391388).\nU26 RUL34 markers: \"`branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên cạnh `blocked→doing`, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên cạnh `doing→awaiting-approval`\" → \"`branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên claim record, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên settlement/lastAttempt khi về `awaiting-approval`\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1213-1245 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 418f3d688929b78bae26607a8eb624737e0ead25); src/runner/claim-port.mjs:210-234 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob ed742a7d151ff914e80f0ce5b640391e3d391388).\nU26 RUL53 doc path: \"KHÔNG kiểm hình dạng (đường dẫn tự do)\" → \"`compound` (đã deprecated, khuyến nghị `fgos doc`) đòi đường dẫn đã commit ở HEAD của main checkout; khi bật `docRegistry.enforce`, đường dẫn phải là currentPath đã đăng ký, không ambiguous hay alias\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1640-1655 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705); bin/fgos.mjs:1677-1710 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705).\nU26 RUL60 retired tier (composed with U26 RUL60 wrapper ordering): \"- **RUL60 (`submit` — ba cờ ghi-đè `--tier`/`--kind`/`--risk`, độc lập từng trường; `risk` KHÔNG mirror `tier` khi có cờ).** Xem \\\"Nộp vấn đề tự do (submit)\\\" trên: mặc định cả ba trường vẫn suy cơ học từ mô tả (đếm từ khóa) như trước; ba cờ tùy chọn ghi đè TỪNG TRƯỜNG một cách độc lập — có `--tier` không bắt buộc phải có `--kind`/`--risk`, và ngược lại. Khi CHỈ `--tier` có mặt (không `--risk`), `risk` VẪN suy cơ học như trước — tức `risk` khi đó mirror `tier` CƠ HỌC (giá trị suy ra, không phải giá trị vừa ghi đè qua cờ) — một điểm dễ hiểu lầm: `submit \\\"...\\\" --tier heavy` (không `--risk`) có thể cho ra item `risk` KHÁC `heavy` nếu suy luận cơ học trên mô tả đó tự ra một bậc khác. Cờ vắng mặt không đổi hành vi cũ một byte (cùng khuôn optional-additive như `--domain`/`--deps`/`--acceptance` — RUL nền). Trường `domain` KHÔNG nằm trong phạm vi ba cờ này và không bị đụng tới (giữ nguyên hành vi cũ hoàn toàn). BÊN SẢN XUẤT giá trị cho ba cờ này từng là kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify), gọi trực tiếp khi có một mô tả tự do cần nộp trước cả khi `submit` chạy; skill đó đã RÚT (tsk-6ar) vì việc nó làm bị `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`, tsk-5wz) làm lại — trên bản mô tả SẠCH hơn (sau clarify, không phải trước) — cho bất kỳ phiên sống nào gọi cửa thường, không cần gọi riêng một skill nữa. Đường sản xuất còn sống hiện nay KHÔNG còn đi qua ba cờ `--tier`/`--kind`/`--risk` của chính verb `submit` mô tả ở trên — ba cờ ấy vẫn hoạt động y nguyên cho bất kỳ bên gọi nào (người, script, agent khác) muốn ghi đè trực tiếp lúc nộp, chỉ là không còn một skill đứng sẵn để tự suy luận và điền hộ chúng. **Cập nhật (cờ phân loại của `discover`):** chỗ phán lại chính thức nay là verb `discover` ở stage `discovery` — nó nhận cùng ba cờ và áp qua chốt chặn dùng chung với đường headless (xem \\\"Chạy context-discovery (discover)\\\" trên). `fgos edit` vẫn là cửa ghi hợp lệ cho một chỉnh tay lẻ, nhưng nó không còn là đường sản xuất được mô tả ở đây: phân loại thuộc về `discovery`, sau research, chứ không thuộc về một bước 6b nối sau `submit`.\" → \"- **RUL60 (`submit` — cờ phân loại hiện hành).** `--tier` đã retired và bị từ chối với hướng dẫn dùng `--size` hoặc `--rigor`; `--size`/`--rigor`/`--kind`/`--risk` là các cờ ghi đè độc lập hiện hành. Khi không ghi đè, `submit` dùng phân loại cơ học; risk không được lấy từ size do bên gọi ghi đè. `domain` là trường riêng. Kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã RÚT (tsk-6ar); Trong phiên tương tác sống, `/fgOS:submit` bước 4 gọi `fgos-clarifying` trên raw text trước khi item tồn tại: helper chỉ phân loại `domain`, có thể trả title/description đã viết lại hoặc câu hỏi làm rõ; không phán lại size/kind/risk. Bước 5 gọi `submit` với text/domain đã chốt; bước 6 chỉ báo kết quả. Chỗ phán lại chính thức là `discover` ở discovery, sau research; phần mô tả cờ tier cũ không phải hợp đồng CLI còn sống.\"; evidence root-authorities-truth-corrections-turn21.json; bin/fgos.mjs:1066-1088 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705); bin/fgos.mjs:806-840 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 99d801a92839b2a7b7202bb9c07bb8fd2277f705); core/skills/fgos-clarifying/SKILL.md:1-65 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 38d80a088108662906cc81f1c9488a5ab2bd6183).\nU26 RUL61 writer event: \"Ba cửa ghi `work.move`/`work.edit`/`work.stage`\" → \"Ba cửa ghi `work.move`/`work.edit`/`work.step`\"; evidence root-authorities-truth-corrections-turn21.json; src/state/store.mjs:1432-1455 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 418f3d688929b78bae26607a8eb624737e0ead25); src/state/replay.mjs:447-456 (evidence commit 9bb7e6edb45f46297d79b419d5cb79db6cebe82d) (pinned blob 905e0d26ba2789e1b7ad4b9ad89a46632bd5d48a).\nDisposition supersede: Account for docs/platform/work-state/spec.md#unheaded-block-93 under docs/platform/work-state/spec.md#unheaded-block-93; source context \"Work State Specification / 11. Business Rules\", target context \"Work State Specification / 11. Business Rules\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9098a0e9ed02a324a16abe3c1016fad73ad261bfc4459aed889be5baeb1515b3",
    "targetAncestry": [
      "Work State Specification",
      "11. Business Rules"
    ]
  }
}
```

## Entry rationale-258

```json
{
  "entryId": "rationale-258",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-component-boundary-advisory.json",
  "collection": "claims",
  "claimId": "claim_239931ca8e26fd3b19bf970e30e2ae4b",
  "before": {
    "claimId": "claim_239931ca8e26fd3b19bf970e30e2ae4b",
    "sourceUnitDigest": "4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73",
    "targetOwner": "docs/platform/component-boundary.md",
    "targetAnchor": "7-contract-authority-matrix",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/component-boundary/component-boundary-advisory.md:277-277#7-contract-authority-matrix (current lines); unit SHA256 4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73.\nTarget: docs/platform/component-boundary.md:381-381#7-contract-authority-matrix (current lines); unit SHA256 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 11, target 11; 11 changed spellings/labels, 11 destination changes; 0 added, 0 removed.\nLink 1: \"Workflow Stage Operation Contract\" (../agent-coordination/contracts/workflow-stage-operation.md) → \"Workflow Stage Operation Contract\" (agent-coordination/contracts/workflow-stage-operation.md); resolved docs/architect/agent-coordination/contracts/workflow-stage-operation.md → docs/platform/agent-coordination/contracts/workflow-stage-operation.md.\nLink 2: \"FlowDefinition Contract\" (../agent-coordination/contracts/flow-definition.md) → \"FlowDefinition Contract\" (agent-coordination/history/retired-engine/files/contracts/flow-definition.md); resolved docs/architect/agent-coordination/contracts/flow-definition.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md.\nLink 3: \"CoordinationSession Contract\" (../agent-coordination/contracts/coordination-session.md) → \"CoordinationSession Contract\" (agent-coordination/history/retired-engine/files/contracts/coordination-session.md); resolved docs/architect/agent-coordination/contracts/coordination-session.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md.\nLink 4: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 5: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 6: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 7: \"Dispatch Control Plane\" (../agent-coordination/architecture/dispatch-control-plane.md) → \"Dispatch Control Plane\" (agent-coordination/architecture/dispatch-control-plane.md); resolved docs/architect/agent-coordination/architecture/dispatch-control-plane.md → docs/platform/agent-coordination/architecture/dispatch-control-plane.md.\nLink 8: \"Evidence And Result Architecture\" (../agent-coordination/architecture/evidence-and-results.md) → \"Evidence And Result Architecture\" (agent-coordination/architecture/evidence-and-results.md); resolved docs/architect/agent-coordination/architecture/evidence-and-results.md → docs/platform/agent-coordination/architecture/evidence-and-results.md.\nLink 9: \"Work Integration Boundaries\" (../agent-coordination/architecture/work-integration.md) → \"Work Integration Boundaries\" (agent-coordination/architecture/work-integration.md); resolved docs/architect/agent-coordination/architecture/work-integration.md → docs/platform/agent-coordination/architecture/work-integration.md.\nLink 10: \"Visibility And Herdr\" (../agent-coordination/architecture/visibility-and-herdr.md) → \"Visibility And Herdr\" (agent-coordination/architecture/visibility-and-herdr.md); resolved docs/architect/agent-coordination/architecture/visibility-and-herdr.md → docs/platform/agent-coordination/architecture/visibility-and-herdr.md.\nLink 11: \"ADR-007 Domain Harness Seam\" (../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) → \"ADR-007 Domain Harness Seam\" (agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nHeading depth: 2 → 4; title \"7. Contract Authority Matrix\" → \"7. Contract Authority Matrix\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/component-boundary/component-boundary-advisory.md#7-contract-authority-matrix under docs/platform/component-boundary.md#7-contract-authority-matrix; source context \"fgOS Component Boundary Advisory\", target context \"Component Boundary / Added in candidate: component-boundary-advisory source carriage / fgOS Component Boundary Advisory\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c",
    "targetAncestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ]
  },
  "after": {
    "claimId": "claim_239931ca8e26fd3b19bf970e30e2ae4b",
    "sourceUnitDigest": "4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73",
    "targetOwner": "docs/platform/component-boundary.md",
    "targetAnchor": "7-contract-authority-matrix",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/component-boundary/component-boundary-advisory.md:277-277#7-contract-authority-matrix (current lines); unit SHA256 4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73.\nTarget: docs/platform/component-boundary.md:381-381#7-contract-authority-matrix (current lines); unit SHA256 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 11, target 11; 9 changed spellings/labels, 9 destination changes; 0 added, 0 removed.\nLink 1: \"Workflow Stage Operation Contract\" (../agent-coordination/contracts/workflow-stage-operation.md) → \"Workflow Stage Operation Contract\" (agent-coordination/contracts/workflow-stage-operation.md); resolved docs/architect/agent-coordination/contracts/workflow-stage-operation.md → docs/platform/agent-coordination/contracts/workflow-stage-operation.md.\nLink 2: \"FlowDefinition Contract\" (../agent-coordination/contracts/flow-definition.md) → \"FlowDefinition Contract\" (agent-coordination/history/retired-engine/files/contracts/flow-definition.md); resolved docs/architect/agent-coordination/contracts/flow-definition.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md.\nLink 3: \"CoordinationSession Contract\" (../agent-coordination/contracts/coordination-session.md) → \"CoordinationSession Contract\" (agent-coordination/history/retired-engine/files/contracts/coordination-session.md); resolved docs/architect/agent-coordination/contracts/coordination-session.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md.\nLink 4: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 7: \"Dispatch Control Plane\" (../agent-coordination/architecture/dispatch-control-plane.md) → \"Dispatch Control Plane\" (agent-coordination/architecture/dispatch-control-plane.md); resolved docs/architect/agent-coordination/architecture/dispatch-control-plane.md → docs/platform/agent-coordination/architecture/dispatch-control-plane.md.\nLink 8: \"Evidence And Result Architecture\" (../agent-coordination/architecture/evidence-and-results.md) → \"Evidence And Result Architecture\" (agent-coordination/architecture/evidence-and-results.md); resolved docs/architect/agent-coordination/architecture/evidence-and-results.md → docs/platform/agent-coordination/architecture/evidence-and-results.md.\nLink 9: \"Work Integration Boundaries\" (../agent-coordination/architecture/work-integration.md) → \"Work Integration Boundaries\" (agent-coordination/architecture/work-integration.md); resolved docs/architect/agent-coordination/architecture/work-integration.md → docs/platform/agent-coordination/architecture/work-integration.md.\nLink 10: \"Visibility And Herdr\" (../agent-coordination/architecture/visibility-and-herdr.md) → \"Visibility And Herdr\" (agent-coordination/architecture/visibility-and-herdr.md); resolved docs/architect/agent-coordination/architecture/visibility-and-herdr.md → docs/platform/agent-coordination/architecture/visibility-and-herdr.md.\nLink 11: \"ADR-007 Domain Harness Seam\" (../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) → \"ADR-007 Domain Harness Seam\" (agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nHeading depth: 2 → 4; title \"7. Contract Authority Matrix\" → \"7. Contract Authority Matrix\".\nWhole direct section differs; depth 2 → 4; 9 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"7. Contract Authority Matrix\" → \"7. Contract Authority Matrix\"; 9 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-component-boundary-advisory.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/component-boundary/component-boundary-advisory.md#7-contract-authority-matrix under docs/platform/component-boundary.md#7-contract-authority-matrix; source context \"fgOS Component Boundary Advisory\", target context \"Component Boundary / Added in candidate: component-boundary-advisory source carriage / fgOS Component Boundary Advisory\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c",
    "targetAncestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 257,
  "factsSHA256": "aada1810ecbf7387f8ce5e4209a5bc9e36277b1ef77d183d7a9c4a1bbcf56677",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "7. Contract Authority Matrix",
    "anchor": "7-contract-authority-matrix",
    "githubAnchor": "7-contract-authority-matrix",
    "stableAnchor": "h-fe1bfd2a3e25",
    "startLine": 277,
    "endLine": 277,
    "textDigest": "4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73",
    "sample": "7. Contract Authority Matrix",
    "sectionPayloadDigest": "0d8cfb91b182fc5d7d2b7646db9378d7dc83f01178139676d2630ccd665db50b",
    "followingBlockDigest": "624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f",
    "identityFingerprint": "533a07a1fa0c1ea97058df997a0b1ed6cba7e7ad1bbe3579d6e927d4b9b67271",
    "ancestry": [
      "fgOS Component Boundary Advisory"
    ],
    "path": "docs/architect/component-boundary/component-boundary-advisory.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "7. Contract Authority Matrix",
    "anchor": "7-contract-authority-matrix",
    "githubAnchor": "7-contract-authority-matrix",
    "stableAnchor": "h-07ffc80a3f93",
    "startLine": 381,
    "endLine": 381,
    "textDigest": "1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c",
    "sample": "7. Contract Authority Matrix",
    "sectionPayloadDigest": "79fa3ff145b22bc40113febe7e716cb940d792e1155830ca3192a4dec4ce4e71",
    "followingBlockDigest": "624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f",
    "identityFingerprint": "2bfc54facfd117c1072a54083b1d382820bbd59b390d3a0d26e2ca5c3927487a",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ],
    "path": "docs/platform/component-boundary.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"7. Contract Authority Matrix\" → \"7. Contract Authority Matrix\"; 9 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-component-boundary-advisory.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/257/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_239931ca8e26fd3b19bf970e30e2ae4b",
    "sourceUnitDigest": "4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73",
    "targetOwner": "docs/platform/component-boundary.md",
    "targetAnchor": "7-contract-authority-matrix",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/component-boundary/component-boundary-advisory.md:277-277#7-contract-authority-matrix (current lines); unit SHA256 4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73.\nTarget: docs/platform/component-boundary.md:381-381#7-contract-authority-matrix (current lines); unit SHA256 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 11, target 11; 9 changed spellings/labels, 9 destination changes; 0 added, 0 removed.\nLink 1: \"Workflow Stage Operation Contract\" (../agent-coordination/contracts/workflow-stage-operation.md) → \"Workflow Stage Operation Contract\" (agent-coordination/contracts/workflow-stage-operation.md); resolved docs/architect/agent-coordination/contracts/workflow-stage-operation.md → docs/platform/agent-coordination/contracts/workflow-stage-operation.md.\nLink 2: \"FlowDefinition Contract\" (../agent-coordination/contracts/flow-definition.md) → \"FlowDefinition Contract\" (agent-coordination/history/retired-engine/files/contracts/flow-definition.md); resolved docs/architect/agent-coordination/contracts/flow-definition.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md.\nLink 3: \"CoordinationSession Contract\" (../agent-coordination/contracts/coordination-session.md) → \"CoordinationSession Contract\" (agent-coordination/history/retired-engine/files/contracts/coordination-session.md); resolved docs/architect/agent-coordination/contracts/coordination-session.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md.\nLink 4: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 7: \"Dispatch Control Plane\" (../agent-coordination/architecture/dispatch-control-plane.md) → \"Dispatch Control Plane\" (agent-coordination/architecture/dispatch-control-plane.md); resolved docs/architect/agent-coordination/architecture/dispatch-control-plane.md → docs/platform/agent-coordination/architecture/dispatch-control-plane.md.\nLink 8: \"Evidence And Result Architecture\" (../agent-coordination/architecture/evidence-and-results.md) → \"Evidence And Result Architecture\" (agent-coordination/architecture/evidence-and-results.md); resolved docs/architect/agent-coordination/architecture/evidence-and-results.md → docs/platform/agent-coordination/architecture/evidence-and-results.md.\nLink 9: \"Work Integration Boundaries\" (../agent-coordination/architecture/work-integration.md) → \"Work Integration Boundaries\" (agent-coordination/architecture/work-integration.md); resolved docs/architect/agent-coordination/architecture/work-integration.md → docs/platform/agent-coordination/architecture/work-integration.md.\nLink 10: \"Visibility And Herdr\" (../agent-coordination/architecture/visibility-and-herdr.md) → \"Visibility And Herdr\" (agent-coordination/architecture/visibility-and-herdr.md); resolved docs/architect/agent-coordination/architecture/visibility-and-herdr.md → docs/platform/agent-coordination/architecture/visibility-and-herdr.md.\nLink 11: \"ADR-007 Domain Harness Seam\" (../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) → \"ADR-007 Domain Harness Seam\" (agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nHeading depth: 2 → 4; title \"7. Contract Authority Matrix\" → \"7. Contract Authority Matrix\".\nWhole direct section differs; depth 2 → 4; 9 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"7. Contract Authority Matrix\" → \"7. Contract Authority Matrix\"; 9 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-component-boundary-advisory.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/component-boundary/component-boundary-advisory.md#7-contract-authority-matrix under docs/platform/component-boundary.md#7-contract-authority-matrix; source context \"fgOS Component Boundary Advisory\", target context \"Component Boundary / Added in candidate: component-boundary-advisory source carriage / fgOS Component Boundary Advisory\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c",
    "targetAncestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ]
  }
}
```

## Entry rationale-259

```json
{
  "entryId": "rationale-259",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-component-boundary-advisory.json",
  "collection": "claims",
  "claimId": "claim_ae47f4ebf4390cd7a05bc5455deb37ed",
  "before": {
    "claimId": "claim_ae47f4ebf4390cd7a05bc5455deb37ed",
    "sourceUnitDigest": "f405dbc2b05c03968fce119fa06406015478ce173b757879a8544bcec0952c39",
    "targetOwner": "docs/platform/component-boundary.md",
    "targetAnchor": "unheaded-block-56",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/component-boundary/component-boundary-advisory.md:288-303#unheaded-block-42 (current lines); unit SHA256 f405dbc2b05c03968fce119fa06406015478ce173b757879a8544bcec0952c39.\nTarget: docs/platform/component-boundary.md:392-407#unheaded-block-56 (current lines); unit SHA256 71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 11, target 11; 11 changed spellings/labels, 11 destination changes; 0 added, 0 removed.\nLink 1: \"Workflow Stage Operation Contract\" (../agent-coordination/contracts/workflow-stage-operation.md) → \"Workflow Stage Operation Contract\" (agent-coordination/contracts/workflow-stage-operation.md); resolved docs/architect/agent-coordination/contracts/workflow-stage-operation.md → docs/platform/agent-coordination/contracts/workflow-stage-operation.md.\nLink 2: \"FlowDefinition Contract\" (../agent-coordination/contracts/flow-definition.md) → \"FlowDefinition Contract\" (agent-coordination/history/retired-engine/files/contracts/flow-definition.md); resolved docs/architect/agent-coordination/contracts/flow-definition.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md.\nLink 3: \"CoordinationSession Contract\" (../agent-coordination/contracts/coordination-session.md) → \"CoordinationSession Contract\" (agent-coordination/history/retired-engine/files/contracts/coordination-session.md); resolved docs/architect/agent-coordination/contracts/coordination-session.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md.\nLink 4: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 5: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 6: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 7: \"Dispatch Control Plane\" (../agent-coordination/architecture/dispatch-control-plane.md) → \"Dispatch Control Plane\" (agent-coordination/architecture/dispatch-control-plane.md); resolved docs/architect/agent-coordination/architecture/dispatch-control-plane.md → docs/platform/agent-coordination/architecture/dispatch-control-plane.md.\nLink 8: \"Evidence And Result Architecture\" (../agent-coordination/architecture/evidence-and-results.md) → \"Evidence And Result Architecture\" (agent-coordination/architecture/evidence-and-results.md); resolved docs/architect/agent-coordination/architecture/evidence-and-results.md → docs/platform/agent-coordination/architecture/evidence-and-results.md.\nLink 9: \"Work Integration Boundaries\" (../agent-coordination/architecture/work-integration.md) → \"Work Integration Boundaries\" (agent-coordination/architecture/work-integration.md); resolved docs/architect/agent-coordination/architecture/work-integration.md → docs/platform/agent-coordination/architecture/work-integration.md.\nLink 10: \"Visibility And Herdr\" (../agent-coordination/architecture/visibility-and-herdr.md) → \"Visibility And Herdr\" (agent-coordination/architecture/visibility-and-herdr.md); resolved docs/architect/agent-coordination/architecture/visibility-and-herdr.md → docs/platform/agent-coordination/architecture/visibility-and-herdr.md.\nLink 11: \"ADR-007 Domain Harness Seam\" (../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) → \"ADR-007 Domain Harness Seam\" (agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-42 under docs/platform/component-boundary.md#unheaded-block-56; source context \"fgOS Component Boundary Advisory / 7. Contract Authority Matrix\", target context \"Component Boundary / Added in candidate: component-boundary-advisory source carriage / fgOS Component Boundary Advisory / 7. Contract Authority Matrix\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "deep: move component-boundary-advisory.md:288-303#unheaded-block-42@pin -> component-boundary.md:392-407#unheaded-block-56; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 11/11/11/11/0/0 recomputed independently and equal; 0 correction line(s) checked (after-text in target); the difference is fully explained by the listed link respellings, heading depth and corrections; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e",
    "targetAncestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory",
      "7. Contract Authority Matrix"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_ae47f4ebf4390cd7a05bc5455deb37ed",
    "sourceUnitDigest": "f405dbc2b05c03968fce119fa06406015478ce173b757879a8544bcec0952c39",
    "targetOwner": "docs/platform/component-boundary.md",
    "targetAnchor": "unheaded-block-56",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/component-boundary/component-boundary-advisory.md:288-303#unheaded-block-42 (current lines); unit SHA256 f405dbc2b05c03968fce119fa06406015478ce173b757879a8544bcec0952c39.\nTarget: docs/platform/component-boundary.md:392-407#unheaded-block-56 (current lines); unit SHA256 71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 11, target 11; 9 changed spellings/labels, 9 destination changes; 0 added, 0 removed.\nLink 1: \"Workflow Stage Operation Contract\" (../agent-coordination/contracts/workflow-stage-operation.md) → \"Workflow Stage Operation Contract\" (agent-coordination/contracts/workflow-stage-operation.md); resolved docs/architect/agent-coordination/contracts/workflow-stage-operation.md → docs/platform/agent-coordination/contracts/workflow-stage-operation.md.\nLink 2: \"FlowDefinition Contract\" (../agent-coordination/contracts/flow-definition.md) → \"FlowDefinition Contract\" (agent-coordination/history/retired-engine/files/contracts/flow-definition.md); resolved docs/architect/agent-coordination/contracts/flow-definition.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md.\nLink 3: \"CoordinationSession Contract\" (../agent-coordination/contracts/coordination-session.md) → \"CoordinationSession Contract\" (agent-coordination/history/retired-engine/files/contracts/coordination-session.md); resolved docs/architect/agent-coordination/contracts/coordination-session.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md.\nLink 4: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 7: \"Dispatch Control Plane\" (../agent-coordination/architecture/dispatch-control-plane.md) → \"Dispatch Control Plane\" (agent-coordination/architecture/dispatch-control-plane.md); resolved docs/architect/agent-coordination/architecture/dispatch-control-plane.md → docs/platform/agent-coordination/architecture/dispatch-control-plane.md.\nLink 8: \"Evidence And Result Architecture\" (../agent-coordination/architecture/evidence-and-results.md) → \"Evidence And Result Architecture\" (agent-coordination/architecture/evidence-and-results.md); resolved docs/architect/agent-coordination/architecture/evidence-and-results.md → docs/platform/agent-coordination/architecture/evidence-and-results.md.\nLink 9: \"Work Integration Boundaries\" (../agent-coordination/architecture/work-integration.md) → \"Work Integration Boundaries\" (agent-coordination/architecture/work-integration.md); resolved docs/architect/agent-coordination/architecture/work-integration.md → docs/platform/agent-coordination/architecture/work-integration.md.\nLink 10: \"Visibility And Herdr\" (../agent-coordination/architecture/visibility-and-herdr.md) → \"Visibility And Herdr\" (agent-coordination/architecture/visibility-and-herdr.md); resolved docs/architect/agent-coordination/architecture/visibility-and-herdr.md → docs/platform/agent-coordination/architecture/visibility-and-herdr.md.\nLink 11: \"ADR-007 Domain Harness Seam\" (../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) → \"ADR-007 Domain Harness Seam\" (agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-42 under docs/platform/component-boundary.md#unheaded-block-56; source context \"fgOS Component Boundary Advisory / 7. Contract Authority Matrix\", target context \"Component Boundary / Added in candidate: component-boundary-advisory source carriage / fgOS Component Boundary Advisory / 7. Contract Authority Matrix\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e",
    "targetAncestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory",
      "7. Contract Authority Matrix"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 258,
  "factsSHA256": "72d2faf497a661accf8cc09b36a815b56e16d1e9fd2dd955ff1e28f6ee70a3ec",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-42",
    "githubAnchor": "unheaded-block-42",
    "stableAnchor": "unheaded-block-42",
    "title": "Unheaded block 42",
    "startLine": 288,
    "endLine": 303,
    "textDigest": "f405dbc2b05c03968fce119fa06406015478ce173b757879a8544bcec0952c39",
    "sample": "| Existing contract or rule | Primary owner | Important consumers | Ownership note |\n|---|---|---|---|\n| [Workflow Stage Operation Contract](../agent-coordination/contracts/workflo",
    "identityFingerprint": "242fde304843f793474a91ecd0f85e3ba1b214c511d4634d09ab559beda82236",
    "ancestry": [
      "fgOS Component Boundary Advisory",
      "7. Contract Authority Matrix"
    ],
    "path": "docs/architect/component-boundary/component-boundary-advisory.md"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-56",
    "githubAnchor": "unheaded-block-56",
    "stableAnchor": "unheaded-block-56",
    "title": "Unheaded block 56",
    "startLine": 392,
    "endLine": 407,
    "textDigest": "71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e",
    "sample": "| Existing contract or rule | Primary owner | Important consumers | Ownership note |\n|---|---|---|---|\n| [Workflow Stage Operation Contract](agent-coordination/contracts/workflow-s",
    "identityFingerprint": "5edb6b00c25fed741ebe22952d1fda831f238d4eb7d402536b9faa0491e4ff4c",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory",
      "7. Contract Authority Matrix"
    ],
    "path": "docs/platform/component-boundary.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ae47f4ebf4390cd7a05bc5455deb37ed",
    "sourceUnitDigest": "f405dbc2b05c03968fce119fa06406015478ce173b757879a8544bcec0952c39",
    "targetOwner": "docs/platform/component-boundary.md",
    "targetAnchor": "unheaded-block-56",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/component-boundary/component-boundary-advisory.md:288-303#unheaded-block-42 (current lines); unit SHA256 f405dbc2b05c03968fce119fa06406015478ce173b757879a8544bcec0952c39.\nTarget: docs/platform/component-boundary.md:392-407#unheaded-block-56 (current lines); unit SHA256 71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 11, target 11; 9 changed spellings/labels, 9 destination changes; 0 added, 0 removed.\nLink 1: \"Workflow Stage Operation Contract\" (../agent-coordination/contracts/workflow-stage-operation.md) → \"Workflow Stage Operation Contract\" (agent-coordination/contracts/workflow-stage-operation.md); resolved docs/architect/agent-coordination/contracts/workflow-stage-operation.md → docs/platform/agent-coordination/contracts/workflow-stage-operation.md.\nLink 2: \"FlowDefinition Contract\" (../agent-coordination/contracts/flow-definition.md) → \"FlowDefinition Contract\" (agent-coordination/history/retired-engine/files/contracts/flow-definition.md); resolved docs/architect/agent-coordination/contracts/flow-definition.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md.\nLink 3: \"CoordinationSession Contract\" (../agent-coordination/contracts/coordination-session.md) → \"CoordinationSession Contract\" (agent-coordination/history/retired-engine/files/contracts/coordination-session.md); resolved docs/architect/agent-coordination/contracts/coordination-session.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md.\nLink 4: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 7: \"Dispatch Control Plane\" (../agent-coordination/architecture/dispatch-control-plane.md) → \"Dispatch Control Plane\" (agent-coordination/architecture/dispatch-control-plane.md); resolved docs/architect/agent-coordination/architecture/dispatch-control-plane.md → docs/platform/agent-coordination/architecture/dispatch-control-plane.md.\nLink 8: \"Evidence And Result Architecture\" (../agent-coordination/architecture/evidence-and-results.md) → \"Evidence And Result Architecture\" (agent-coordination/architecture/evidence-and-results.md); resolved docs/architect/agent-coordination/architecture/evidence-and-results.md → docs/platform/agent-coordination/architecture/evidence-and-results.md.\nLink 9: \"Work Integration Boundaries\" (../agent-coordination/architecture/work-integration.md) → \"Work Integration Boundaries\" (agent-coordination/architecture/work-integration.md); resolved docs/architect/agent-coordination/architecture/work-integration.md → docs/platform/agent-coordination/architecture/work-integration.md.\nLink 10: \"Visibility And Herdr\" (../agent-coordination/architecture/visibility-and-herdr.md) → \"Visibility And Herdr\" (agent-coordination/architecture/visibility-and-herdr.md); resolved docs/architect/agent-coordination/architecture/visibility-and-herdr.md → docs/platform/agent-coordination/architecture/visibility-and-herdr.md.\nLink 11: \"ADR-007 Domain Harness Seam\" (../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) → \"ADR-007 Domain Harness Seam\" (agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/component-boundary/component-boundary-advisory.md#unheaded-block-42 under docs/platform/component-boundary.md#unheaded-block-56; source context \"fgOS Component Boundary Advisory / 7. Contract Authority Matrix\", target context \"Component Boundary / Added in candidate: component-boundary-advisory source carriage / fgOS Component Boundary Advisory / 7. Contract Authority Matrix\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e",
    "targetAncestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory",
      "7. Contract Authority Matrix"
    ]
  }
}
```

## Entry rationale-260

```json
{
  "entryId": "rationale-260",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-08-component-authority-boundary-map.json",
  "collection": "claims",
  "claimId": "claim_c1741ef08c45e88d276f75b668de7452",
  "before": {
    "claimId": "claim_c1741ef08c45e88d276f75b668de7452",
    "sourceUnitDigest": "2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872",
    "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
    "targetAnchor": "component-authority-boundary-map",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872.\nTarget: docs/platform/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 9, target 10; 10 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"original source\" (../../architect/proposals/component-authority-boundary-map.md); resolved none → docs/architect/proposals/component-authority-boundary-map.md.\nLink 2: \"Step 09 Group Thinking Substrate\" (step-09-group-thinking-substrate.md) → \"Step 09 Group Thinking Substrate\" (../../architect/proposals/step-09-group-thinking-substrate.md); resolved docs/architect/proposals/step-09-group-thinking-substrate.md → docs/architect/proposals/step-09-group-thinking-substrate.md.\nLink 3: \"Step 10 Coding Domain Adoption\" (step-10-coding-domain-adoption.md) → \"Step 10 Coding Domain Adoption\" (../../architect/proposals/step-10-coding-domain-adoption.md); resolved docs/architect/proposals/step-10-coding-domain-adoption.md → docs/architect/proposals/step-10-coding-domain-adoption.md.\nLink 4: \"Agent Coordination Vision\" (../agent-coordination/vision.md) → \"Agent Coordination Vision\" (../../architect/agent-coordination/vision.md); resolved docs/architect/agent-coordination/vision.md → docs/architect/agent-coordination/vision.md.\nLink 5: \"Intent Preservation Ledger\" (../agent-coordination/intent-preservation-ledger.md) → \"Intent Preservation Ledger\" (../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md); resolved docs/architect/agent-coordination/intent-preservation-ledger.md → docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md.\nLink 6: \"Architecture Intent\" (../architecture-intent.md) → \"Architecture Intent\" (../../architect/architecture-intent.md); resolved docs/architect/architecture-intent.md → docs/architect/architecture-intent.md.\nLink 7: \"Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"Component Boundary Advisory\" (../../architect/component-boundary/component-boundary-advisory.md); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/architect/component-boundary/component-boundary-advisory.md.\nLink 8: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nLink 9: \"Host Invocation And Provider Routing\" (../host-invocation-routing/host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../../architect/host-invocation-routing/host-invocation-provider-routing.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/architect/host-invocation-routing/host-invocation-provider-routing.md.\nLink 10: \"Node To Rust Component Migration\" (../host-invocation-routing/node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (../../architect/host-invocation-routing/node-to-rust-component-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/architect/host-invocation-routing/node-to-rust-component-migration.md.\nHeading depth: 1 → 1; title \"Component Authority Boundary Map\" → \"Component Authority Boundary Map\".\nApplicable labelled corrections: none in this bound unit.\nRelated binding evidence docs/platform/component-boundary.md:14: \"- docs/architect/proposals/component-authority-boundary-map.md\".\nRelated binding evidence docs/platform/component-boundary.md:46: \"| [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |\".\nRelated binding evidence docs/platform/component-boundary.md:97: \"| draft authority map | [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) |\".\nRelated binding evidence docs/platform/component-boundary.md:518: \"                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);\".\nDisposition supersede: Account for docs/architect/proposals/component-authority-boundary-map.md#component-authority-boundary-map under docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map; source context \"component-authority-boundary-map\", target context \"component-authority-boundary-map\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e",
    "targetAncestry": []
  },
  "after": {
    "claimId": "claim_c1741ef08c45e88d276f75b668de7452",
    "sourceUnitDigest": "2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872",
    "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
    "targetAnchor": "component-authority-boundary-map",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872.\nTarget: docs/platform/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 9, target 10; 10 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"original source\" (../../architect/proposals/component-authority-boundary-map.md); resolved none → docs/architect/proposals/component-authority-boundary-map.md.\nLink 2: \"Step 09 Group Thinking Substrate\" (step-09-group-thinking-substrate.md) → \"Step 09 Group Thinking Substrate\" (../../architect/proposals/step-09-group-thinking-substrate.md); resolved docs/architect/proposals/step-09-group-thinking-substrate.md → docs/architect/proposals/step-09-group-thinking-substrate.md.\nLink 3: \"Step 10 Coding Domain Adoption\" (step-10-coding-domain-adoption.md) → \"Step 10 Coding Domain Adoption\" (../../architect/proposals/step-10-coding-domain-adoption.md); resolved docs/architect/proposals/step-10-coding-domain-adoption.md → docs/architect/proposals/step-10-coding-domain-adoption.md.\nLink 4: \"Agent Coordination Vision\" (../agent-coordination/vision.md) → \"Agent Coordination Vision\" (../../architect/agent-coordination/vision.md); resolved docs/architect/agent-coordination/vision.md → docs/architect/agent-coordination/vision.md.\nLink 5: \"Intent Preservation Ledger\" (../agent-coordination/intent-preservation-ledger.md) → \"Intent Preservation Ledger\" (../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md); resolved docs/architect/agent-coordination/intent-preservation-ledger.md → docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md.\nLink 6: \"Architecture Intent\" (../architecture-intent.md) → \"Architecture Intent\" (../../architect/architecture-intent.md); resolved docs/architect/architecture-intent.md → docs/architect/architecture-intent.md.\nLink 7: \"Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"Component Boundary Advisory\" (../../architect/component-boundary/component-boundary-advisory.md); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/architect/component-boundary/component-boundary-advisory.md.\nLink 8: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nLink 9: \"Host Invocation And Provider Routing\" (../host-invocation-routing/host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../../architect/host-invocation-routing/host-invocation-provider-routing.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/architect/host-invocation-routing/host-invocation-provider-routing.md.\nLink 10: \"Node To Rust Component Migration\" (../host-invocation-routing/node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (../../architect/host-invocation-routing/node-to-rust-component-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/architect/host-invocation-routing/node-to-rust-component-migration.md.\nHeading depth: 1 → 1; title \"Component Authority Boundary Map\" → \"Component Authority Boundary Map\".\nWhole direct section differs; depth 1 → 1; 10 distinct link changes; normalized line order differs; 0 removed and 20 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 1 → 1, title \"Component Authority Boundary Map\" → \"Component Authority Boundary Map\"; 10 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Candidate additions/corrections are explicitly labelled in the direct section: [\"```txt\",\"Document type: Proposal\",\"Audience: Human reviewer, architect, maintainer, agent\",\"Purpose: Preserve mapped source text for independent conservation review\",\"Design status: Candidate\",\"Implementation: Source snapshot retained; current implementation truth not certified\",\"Provenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\",\"Writer type: Agent draft writer\",\"Canonical: No\",\"Canonical for: Nothing; non-canonical candidate conservation carrier\",\"Use this when: Reviewing source carriage, placement, intent and provenance\",\"Do not use this for: Current authority, implementation proof or cutover approval\",\"Last reviewed: Pending independent review\",\"Related:\",\"- docs/architect/proposals/component-authority-boundary-map.md\",\"Supersedes: None; legacy source remains intact\",\"Superseded by: None\",\"```\",\"Added in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\",\"Source relationship: <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map, docs/architect/proposals/component-authority-boundary-map.md#2-organizing-formula. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-08-component-authority-boundary-map.json; exact section delta: removed []; added [\"```txt\",\"Document type: Proposal\",\"Audience: Human reviewer, architect, maintainer, agent\",\"Purpose: Preserve mapped source text for independent conservation review\",\"Design status: Candidate\",\"Implementation: Source snapshot retained; current implementation truth not certified\",\"Provenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\",\"Writer type: Agent draft writer\",\"Canonical: No\",\"Canonical for: Nothing; non-canonical candidate conservation carrier\",\"Use this when: Reviewing source carriage, placement, intent and provenance\",\"Do not use this for: Current authority, implementation proof or cutover approval\",\"Last reviewed: Pending independent review\",\"Related:\",\"- docs/architect/proposals/component-authority-boundary-map.md\",\"Supersedes: None; legacy source remains intact\",\"Superseded by: None\",\"```\",\"Added in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\",\"Source relationship: <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nRelated binding evidence docs/platform/component-boundary.md:14: \"- docs/architect/proposals/component-authority-boundary-map.md\".\nRelated binding evidence docs/platform/component-boundary.md:46: \"| [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |\".\nRelated binding evidence docs/platform/component-boundary.md:97: \"| draft authority map | [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) |\".\nRelated binding evidence docs/platform/component-boundary.md:518: \"                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);\".\nDisposition supersede: Account for docs/architect/proposals/component-authority-boundary-map.md#component-authority-boundary-map under docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map; source context \"component-authority-boundary-map\", target context \"component-authority-boundary-map\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e",
    "targetAncestry": []
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 259,
  "factsSHA256": "4662aad3446da36a81187abec3509b29288b27ba050d6075849ba289d6e1abfd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Authority Boundary Map",
    "anchor": "component-authority-boundary-map",
    "githubAnchor": "component-authority-boundary-map",
    "stableAnchor": "h-b63ba0b08ef7",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872",
    "sample": "Component Authority Boundary Map",
    "sectionPayloadDigest": "f803e72921b475b1a1c7d6e813238314618a3f97d8e7e975223cd9674ab5f37c",
    "followingBlockDigest": "f803e72921b475b1a1c7d6e813238314618a3f97d8e7e975223cd9674ab5f37c",
    "identityFingerprint": "f29334ed0acf79f63084db3bc67c773f422bd096b7fe475b53b77b314ea41cd9",
    "ancestry": [],
    "path": "docs/architect/proposals/component-authority-boundary-map.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Authority Boundary Map",
    "anchor": "component-authority-boundary-map",
    "githubAnchor": "component-authority-boundary-map",
    "stableAnchor": "h-b63ba0b08ef7",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e",
    "sample": "Component Authority Boundary Map",
    "sectionPayloadDigest": "1e682efe2674d579f94aceb916276b3134cd7e0754a16ab2e92f8c76cba971bf",
    "followingBlockDigest": "44af44d95a1b9708d2ce46e0d0b0b294c7063a53456ac8c2fcee7e2377ecb155",
    "identityFingerprint": "6b5699e28981b986877da4ddd61f07b5829ac5ee7cd26287a9b468aca231006d",
    "ancestry": [],
    "path": "docs/platform/proposals/component-authority-boundary-map.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 1 → 1, title \"Component Authority Boundary Map\" → \"Component Authority Boundary Map\"; 10 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Candidate additions/corrections are explicitly labelled in the direct section: [\"```txt\",\"Document type: Proposal\",\"Audience: Human reviewer, architect, maintainer, agent\",\"Purpose: Preserve mapped source text for independent conservation review\",\"Design status: Candidate\",\"Implementation: Source snapshot retained; current implementation truth not certified\",\"Provenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\",\"Writer type: Agent draft writer\",\"Canonical: No\",\"Canonical for: Nothing; non-canonical candidate conservation carrier\",\"Use this when: Reviewing source carriage, placement, intent and provenance\",\"Do not use this for: Current authority, implementation proof or cutover approval\",\"Last reviewed: Pending independent review\",\"Related:\",\"- docs/architect/proposals/component-authority-boundary-map.md\",\"Supersedes: None; legacy source remains intact\",\"Superseded by: None\",\"```\",\"Added in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\",\"Source relationship: <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map, docs/architect/proposals/component-authority-boundary-map.md#2-organizing-formula. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-08-component-authority-boundary-map.json; exact section delta: removed []; added [\"```txt\",\"Document type: Proposal\",\"Audience: Human reviewer, architect, maintainer, agent\",\"Purpose: Preserve mapped source text for independent conservation review\",\"Design status: Candidate\",\"Implementation: Source snapshot retained; current implementation truth not certified\",\"Provenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\",\"Writer type: Agent draft writer\",\"Canonical: No\",\"Canonical for: Nothing; non-canonical candidate conservation carrier\",\"Use this when: Reviewing source carriage, placement, intent and provenance\",\"Do not use this for: Current authority, implementation proof or cutover approval\",\"Last reviewed: Pending independent review\",\"Related:\",\"- docs/architect/proposals/component-authority-boundary-map.md\",\"Supersedes: None; legacy source remains intact\",\"Superseded by: None\",\"```\",\"Added in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\",\"Source relationship: <link>.\"]. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/259/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c1741ef08c45e88d276f75b668de7452",
    "sourceUnitDigest": "2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872",
    "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
    "targetAnchor": "component-authority-boundary-map",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872.\nTarget: docs/platform/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 9, target 10; 10 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"original source\" (../../architect/proposals/component-authority-boundary-map.md); resolved none → docs/architect/proposals/component-authority-boundary-map.md.\nLink 2: \"Step 09 Group Thinking Substrate\" (step-09-group-thinking-substrate.md) → \"Step 09 Group Thinking Substrate\" (../../architect/proposals/step-09-group-thinking-substrate.md); resolved docs/architect/proposals/step-09-group-thinking-substrate.md → docs/architect/proposals/step-09-group-thinking-substrate.md.\nLink 3: \"Step 10 Coding Domain Adoption\" (step-10-coding-domain-adoption.md) → \"Step 10 Coding Domain Adoption\" (../../architect/proposals/step-10-coding-domain-adoption.md); resolved docs/architect/proposals/step-10-coding-domain-adoption.md → docs/architect/proposals/step-10-coding-domain-adoption.md.\nLink 4: \"Agent Coordination Vision\" (../agent-coordination/vision.md) → \"Agent Coordination Vision\" (../../architect/agent-coordination/vision.md); resolved docs/architect/agent-coordination/vision.md → docs/architect/agent-coordination/vision.md.\nLink 5: \"Intent Preservation Ledger\" (../agent-coordination/intent-preservation-ledger.md) → \"Intent Preservation Ledger\" (../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md); resolved docs/architect/agent-coordination/intent-preservation-ledger.md → docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md.\nLink 6: \"Architecture Intent\" (../architecture-intent.md) → \"Architecture Intent\" (../../architect/architecture-intent.md); resolved docs/architect/architecture-intent.md → docs/architect/architecture-intent.md.\nLink 7: \"Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"Component Boundary Advisory\" (../../architect/component-boundary/component-boundary-advisory.md); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/architect/component-boundary/component-boundary-advisory.md.\nLink 8: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nLink 9: \"Host Invocation And Provider Routing\" (../host-invocation-routing/host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../../architect/host-invocation-routing/host-invocation-provider-routing.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/architect/host-invocation-routing/host-invocation-provider-routing.md.\nLink 10: \"Node To Rust Component Migration\" (../host-invocation-routing/node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (../../architect/host-invocation-routing/node-to-rust-component-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/architect/host-invocation-routing/node-to-rust-component-migration.md.\nHeading depth: 1 → 1; title \"Component Authority Boundary Map\" → \"Component Authority Boundary Map\".\nWhole direct section differs; depth 1 → 1; 10 distinct link changes; normalized line order differs; 0 removed and 20 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 1 → 1, title \"Component Authority Boundary Map\" → \"Component Authority Boundary Map\"; 10 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Candidate additions/corrections are explicitly labelled in the direct section: [\"```txt\",\"Document type: Proposal\",\"Audience: Human reviewer, architect, maintainer, agent\",\"Purpose: Preserve mapped source text for independent conservation review\",\"Design status: Candidate\",\"Implementation: Source snapshot retained; current implementation truth not certified\",\"Provenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\",\"Writer type: Agent draft writer\",\"Canonical: No\",\"Canonical for: Nothing; non-canonical candidate conservation carrier\",\"Use this when: Reviewing source carriage, placement, intent and provenance\",\"Do not use this for: Current authority, implementation proof or cutover approval\",\"Last reviewed: Pending independent review\",\"Related:\",\"- docs/architect/proposals/component-authority-boundary-map.md\",\"Supersedes: None; legacy source remains intact\",\"Superseded by: None\",\"```\",\"Added in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\",\"Source relationship: <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map, docs/architect/proposals/component-authority-boundary-map.md#2-organizing-formula. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-08-component-authority-boundary-map.json; exact section delta: removed []; added [\"```txt\",\"Document type: Proposal\",\"Audience: Human reviewer, architect, maintainer, agent\",\"Purpose: Preserve mapped source text for independent conservation review\",\"Design status: Candidate\",\"Implementation: Source snapshot retained; current implementation truth not certified\",\"Provenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\",\"Writer type: Agent draft writer\",\"Canonical: No\",\"Canonical for: Nothing; non-canonical candidate conservation carrier\",\"Use this when: Reviewing source carriage, placement, intent and provenance\",\"Do not use this for: Current authority, implementation proof or cutover approval\",\"Last reviewed: Pending independent review\",\"Related:\",\"- docs/architect/proposals/component-authority-boundary-map.md\",\"Supersedes: None; legacy source remains intact\",\"Superseded by: None\",\"```\",\"Added in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\",\"Source relationship: <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nRelated binding evidence docs/platform/component-boundary.md:14: \"- docs/architect/proposals/component-authority-boundary-map.md\".\nRelated binding evidence docs/platform/component-boundary.md:46: \"| [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |\".\nRelated binding evidence docs/platform/component-boundary.md:97: \"| draft authority map | [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) |\".\nRelated binding evidence docs/platform/component-boundary.md:518: \"                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);\".\nDisposition supersede: Account for docs/architect/proposals/component-authority-boundary-map.md#component-authority-boundary-map under docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map; source context \"component-authority-boundary-map\", target context \"component-authority-boundary-map\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e",
    "targetAncestry": []
  }
}
```

## Entry rationale-261

```json
{
  "entryId": "rationale-261",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_cd345b6c8a7da2451c2acf04ba8c5292",
  "before": {
    "claimId": "claim_cd345b6c8a7da2451c2acf04ba8c5292",
    "sourceUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "87-bảng-tình-huống-chuẩn",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1122-1122#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nTarget: docs/platform/agent-confinement/spec.md:388-388#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"8.7 Bảng tình huống chuẩn\" → \"8.7 Bảng tình huống chuẩn\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#87-bảng-tình-huống-chuẩn under docs/platform/agent-confinement/spec.md#87-bảng-tình-huống-chuẩn; source context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\", target context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "deep: A36 draw (seed 2026101609); move confinement-authority.md:1122-1122#87-bảng-tình-huống-chuẩn -> spec.md:388-388#87-bảng-tình-huống-chuẩn, source and target text opened and identical (starts: ### 8.7 Bảng tình huống chuẩn  / Tình huống /); classed Weak-exact (source unit shorter than 40 characters; document exact share below one half); target context Spec: Agent Confinement Authority / 8. Policy resolution và edge cases equals the real heading chain; links 0/0/0/0/0/0; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_cd345b6c8a7da2451c2acf04ba8c5292",
    "sourceUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "87-bảng-tình-huống-chuẩn",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1122-1122#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nTarget: docs/platform/agent-confinement/spec.md:388-388#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"8.7 Bảng tình huống chuẩn\" → \"8.7 Bảng tình huống chuẩn\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"8.7 Bảng tình huống chuẩn\" → \"8.7 Bảng tình huống chuẩn\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#87-bảng-tình-huống-chuẩn under docs/platform/agent-confinement/spec.md#87-bảng-tình-huống-chuẩn; source context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\", target context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 260,
  "factsSHA256": "449d20764376bad15fbedbf8ed1f84c571c79c428709fad4b46cc7a738b2921b",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "8.7 Bảng tình huống chuẩn",
    "anchor": "87-bảng-tình-huống-chuẩn",
    "githubAnchor": "87-bảng-tình-huống-chuẩn",
    "stableAnchor": "h-f2fbabe764f6",
    "startLine": 1122,
    "endLine": 1122,
    "textDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "sample": "8.7 Bảng tình huống chuẩn",
    "sectionPayloadDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "followingBlockDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "identityFingerprint": "b55911020c4482a87485361aa15523e898ae2eb3f77f8a61a6938dce6b8d6bd0",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "8.7 Bảng tình huống chuẩn",
    "anchor": "87-bảng-tình-huống-chuẩn",
    "githubAnchor": "87-bảng-tình-huống-chuẩn",
    "stableAnchor": "h-2639919a78c0",
    "startLine": 388,
    "endLine": 388,
    "textDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "sample": "8.7 Bảng tình huống chuẩn",
    "sectionPayloadDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "followingBlockDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "identityFingerprint": "b55911020c4482a87485361aa15523e898ae2eb3f77f8a61a6938dce6b8d6bd0",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 3 → 3, title \"8.7 Bảng tình huống chuẩn\" → \"8.7 Bảng tình huống chuẩn\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/260/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_cd345b6c8a7da2451c2acf04ba8c5292",
    "sourceUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "87-bảng-tình-huống-chuẩn",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1122-1122#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nTarget: docs/platform/agent-confinement/spec.md:388-388#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"8.7 Bảng tình huống chuẩn\" → \"8.7 Bảng tình huống chuẩn\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"8.7 Bảng tình huống chuẩn\" → \"8.7 Bảng tình huống chuẩn\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#87-bảng-tình-huống-chuẩn under docs/platform/agent-confinement/spec.md#87-bảng-tình-huống-chuẩn; source context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\", target context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ]
  }
}
```

## Entry rationale-262

```json
{
  "entryId": "rationale-262",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_9a1cd05f74418890fbca8955aa76b378",
  "before": {
    "claimId": "claim_9a1cd05f74418890fbca8955aa76b378",
    "sourceUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "9-default-implementation-đầu-tiên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1136-1136#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nTarget: docs/platform/agent-confinement/spec.md:402-402#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"9. Default implementation đầu tiên\" → \"9. Default implementation đầu tiên\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#9-default-implementation-đầu-tiên under docs/platform/agent-confinement/spec.md#9-default-implementation-đầu-tiên; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "mechanical: move confinement-authority.md:1136-1136#9-default-implementation-đầu-tiên -> spec.md:402-402#9-default-implementation-đầu-tiên; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_9a1cd05f74418890fbca8955aa76b378",
    "sourceUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "9-default-implementation-đầu-tiên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1136-1136#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nTarget: docs/platform/agent-confinement/spec.md:402-402#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"9. Default implementation đầu tiên\" → \"9. Default implementation đầu tiên\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"9. Default implementation đầu tiên\" → \"9. Default implementation đầu tiên\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#9-default-implementation-đầu-tiên under docs/platform/agent-confinement/spec.md#9-default-implementation-đầu-tiên; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 261,
  "factsSHA256": "ad9a16dd7a27184f59dccf5cc6e745845a9eabed9285bb7a1cfd7b9b2d8d8d58",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "9. Default implementation đầu tiên",
    "anchor": "9-default-implementation-đầu-tiên",
    "githubAnchor": "9-default-implementation-đầu-tiên",
    "stableAnchor": "h-21e1e90de204",
    "startLine": 1136,
    "endLine": 1136,
    "textDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "sample": "9. Default implementation đầu tiên",
    "sectionPayloadDigest": "49471d5985582ee18e2f411316b9a6c1d1af355e47e358552c873f94c98d71d9",
    "followingBlockDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
    "identityFingerprint": "768d935e7d93a151a0f2197a91015d239e9449206b53b0e43ce2720c1d81156a",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "9. Default implementation đầu tiên",
    "anchor": "9-default-implementation-đầu-tiên",
    "githubAnchor": "9-default-implementation-đầu-tiên",
    "stableAnchor": "h-e592dd069194",
    "startLine": 402,
    "endLine": 402,
    "textDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "sample": "9. Default implementation đầu tiên",
    "sectionPayloadDigest": "49471d5985582ee18e2f411316b9a6c1d1af355e47e358552c873f94c98d71d9",
    "followingBlockDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
    "identityFingerprint": "768d935e7d93a151a0f2197a91015d239e9449206b53b0e43ce2720c1d81156a",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 2, title \"9. Default implementation đầu tiên\" → \"9. Default implementation đầu tiên\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/261/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9a1cd05f74418890fbca8955aa76b378",
    "sourceUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "9-default-implementation-đầu-tiên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1136-1136#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nTarget: docs/platform/agent-confinement/spec.md:402-402#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"9. Default implementation đầu tiên\" → \"9. Default implementation đầu tiên\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"9. Default implementation đầu tiên\" → \"9. Default implementation đầu tiên\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#9-default-implementation-đầu-tiên under docs/platform/agent-confinement/spec.md#9-default-implementation-đầu-tiên; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  }
}
```

## Entry rationale-263

```json
{
  "entryId": "rationale-263",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_2c080a72c195a28a1ca8efb0e1187f11",
  "before": {
    "claimId": "claim_2c080a72c195a28a1ca8efb0e1187f11",
    "sourceUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "91-support-matrix-của-default",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1169-1169#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nTarget: docs/platform/agent-confinement/spec.md:435-435#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.1 Support matrix của default\" → \"9.1 Support matrix của default\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#91-support-matrix-của-default under docs/platform/agent-confinement/spec.md#91-support-matrix-của-default; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "mechanical: move confinement-authority.md:1169-1169#91-support-matrix-của-default -> spec.md:435-435#91-support-matrix-của-default; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact. hand-recomputed both digests (seed 2026101608).",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_2c080a72c195a28a1ca8efb0e1187f11",
    "sourceUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "91-support-matrix-của-default",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1169-1169#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nTarget: docs/platform/agent-confinement/spec.md:435-435#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.1 Support matrix của default\" → \"9.1 Support matrix của default\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"9.1 Support matrix của default\" → \"9.1 Support matrix của default\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#91-support-matrix-của-default under docs/platform/agent-confinement/spec.md#91-support-matrix-của-default; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 262,
  "factsSHA256": "01f48fd345e8ce42f46b8a382cc466982a54e85ebd9dd65528046fa2a3e13023",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "9.1 Support matrix của default",
    "anchor": "91-support-matrix-của-default",
    "githubAnchor": "91-support-matrix-của-default",
    "stableAnchor": "h-d117a31698fd",
    "startLine": 1169,
    "endLine": 1169,
    "textDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "sample": "9.1 Support matrix của default",
    "sectionPayloadDigest": "522737e3c33717161eec1d3f662c623ea3eff73ad6688417c97ffd4930f7776c",
    "followingBlockDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
    "identityFingerprint": "a917c64b1156e5ae25343a255692b39c9f3217e14aa5af7dca047b7181375bcd",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "9.1 Support matrix của default",
    "anchor": "91-support-matrix-của-default",
    "githubAnchor": "91-support-matrix-của-default",
    "stableAnchor": "h-2172005193b6",
    "startLine": 435,
    "endLine": 435,
    "textDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "sample": "9.1 Support matrix của default",
    "sectionPayloadDigest": "522737e3c33717161eec1d3f662c623ea3eff73ad6688417c97ffd4930f7776c",
    "followingBlockDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
    "identityFingerprint": "a917c64b1156e5ae25343a255692b39c9f3217e14aa5af7dca047b7181375bcd",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 3 → 3, title \"9.1 Support matrix của default\" → \"9.1 Support matrix của default\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/262/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2c080a72c195a28a1ca8efb0e1187f11",
    "sourceUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "91-support-matrix-của-default",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1169-1169#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nTarget: docs/platform/agent-confinement/spec.md:435-435#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.1 Support matrix của default\" → \"9.1 Support matrix của default\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"9.1 Support matrix của default\" → \"9.1 Support matrix của default\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#91-support-matrix-của-default under docs/platform/agent-confinement/spec.md#91-support-matrix-của-default; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  }
}
```

## Entry rationale-264

```json
{
  "entryId": "rationale-264",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_3770d5a0b897fbd8c1393a38c48c3333",
  "before": {
    "claimId": "claim_3770d5a0b897fbd8c1393a38c48c3333",
    "sourceUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1188-1188#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nTarget: docs/platform/agent-confinement/spec.md:454-454#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.2 `hostRead: blind` — worker mù trước run state của peer\" → \"9.2 `hostRead: blind` — worker mù trước run state của peer\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#92-hostread-blind-worker-mù-trước-run-state-của-peer under docs/platform/agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "mechanical: move confinement-authority.md:1188-1188#92-hostread-blind-worker-mù-trước-run-state-của-peer -> spec.md:454-454#92-hostread-blind-worker-mù-trước-run-state-của-peer; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_3770d5a0b897fbd8c1393a38c48c3333",
    "sourceUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1188-1188#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nTarget: docs/platform/agent-confinement/spec.md:454-454#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.2 `hostRead: blind` — worker mù trước run state của peer\" → \"9.2 `hostRead: blind` — worker mù trước run state của peer\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"9.2 `hostRead: blind` — worker mù trước run state của peer\" → \"9.2 `hostRead: blind` — worker mù trước run state của peer\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#92-hostread-blind-worker-mù-trước-run-state-của-peer under docs/platform/agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 263,
  "factsSHA256": "91e7bd906d44a5b00904261bd528e30460ccab4fdd0dae40b2183ec6adee075e",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "9.2 `hostRead: blind` — worker mù trước run state của peer",
    "anchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "githubAnchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "stableAnchor": "h-718be95031d8",
    "startLine": 1188,
    "endLine": 1188,
    "textDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "sample": "9.2 `hostRead: blind` — worker mù trước run state của peer",
    "sectionPayloadDigest": "f1f713ee056bd762d76159d50cb77c58624579c4ffce1a813b6cb3dbba6cedc6",
    "followingBlockDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
    "identityFingerprint": "c4753e3644d5a98f7a223469f8633ac752e8079e94c1c75d71af4948a1efd476",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "9.2 `hostRead: blind` — worker mù trước run state của peer",
    "anchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "githubAnchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "stableAnchor": "h-9405ab59bf3e",
    "startLine": 454,
    "endLine": 454,
    "textDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "sample": "9.2 `hostRead: blind` — worker mù trước run state của peer",
    "sectionPayloadDigest": "f1f713ee056bd762d76159d50cb77c58624579c4ffce1a813b6cb3dbba6cedc6",
    "followingBlockDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
    "identityFingerprint": "c4753e3644d5a98f7a223469f8633ac752e8079e94c1c75d71af4948a1efd476",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 3 → 3, title \"9.2 `hostRead: blind` — worker mù trước run state của peer\" → \"9.2 `hostRead: blind` — worker mù trước run state của peer\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/263/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3770d5a0b897fbd8c1393a38c48c3333",
    "sourceUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1188-1188#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nTarget: docs/platform/agent-confinement/spec.md:454-454#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.2 `hostRead: blind` — worker mù trước run state của peer\" → \"9.2 `hostRead: blind` — worker mù trước run state của peer\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"9.2 `hostRead: blind` — worker mù trước run state của peer\" → \"9.2 `hostRead: blind` — worker mù trước run state của peer\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#92-hostread-blind-worker-mù-trước-run-state-của-peer under docs/platform/agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  }
}
```

## Entry rationale-265

```json
{
  "entryId": "rationale-265",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_96b54d15ac01f69e7df991151c2268be",
  "before": {
    "claimId": "claim_96b54d15ac01f69e7df991151c2268be",
    "sourceUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1247-1247#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:24-24#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"10. Lộ trình rollout và trạng thái hoàn thành\" → \"10. Lộ trình rollout và trạng thái hoàn thành\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "mechanical: move confinement-authority.md:1247-1247#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành -> rollout-and-settled-facts.md:24-24#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_96b54d15ac01f69e7df991151c2268be",
    "sourceUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1247-1247#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:24-24#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"10. Lộ trình rollout và trạng thái hoàn thành\" → \"10. Lộ trình rollout và trạng thái hoàn thành\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"10. Lộ trình rollout và trạng thái hoàn thành\" → \"10. Lộ trình rollout và trạng thái hoàn thành\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 264,
  "factsSHA256": "a93b23373e4385e8de574bace8331709106b9197320aa19ff630231e74af5d50",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Lộ trình rollout và trạng thái hoàn thành",
    "anchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "githubAnchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "stableAnchor": "h-c24e0504508a",
    "startLine": 1247,
    "endLine": 1247,
    "textDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "sample": "10. Lộ trình rollout và trạng thái hoàn thành",
    "sectionPayloadDigest": "e5f374eb677f77523ea34429fff31c02985f4dcb251a96544022cba1dfc382d9",
    "followingBlockDigest": "5036517c45b86b22554b3c8c1b11e63cc453d4a66722bbd0c820af5ec68cc56f",
    "identityFingerprint": "e1ed42da3cac164486f2df052a7c9435e31d4a1519cc5ac187706c26fdab831e",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Lộ trình rollout và trạng thái hoàn thành",
    "anchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "githubAnchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "stableAnchor": "h-544863937a88",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "sample": "10. Lộ trình rollout và trạng thái hoàn thành",
    "sectionPayloadDigest": "e5f374eb677f77523ea34429fff31c02985f4dcb251a96544022cba1dfc382d9",
    "followingBlockDigest": "5036517c45b86b22554b3c8c1b11e63cc453d4a66722bbd0c820af5ec68cc56f",
    "identityFingerprint": "e1ed42da3cac164486f2df052a7c9435e31d4a1519cc5ac187706c26fdab831e",
    "ancestry": [
      "Added in candidate: rollout and settled facts"
    ],
    "path": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 2, title \"10. Lộ trình rollout và trạng thái hoàn thành\" → \"10. Lộ trình rollout và trạng thái hoàn thành\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/264/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_96b54d15ac01f69e7df991151c2268be",
    "sourceUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1247-1247#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:24-24#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"10. Lộ trình rollout và trạng thái hoàn thành\" → \"10. Lộ trình rollout và trạng thái hoàn thành\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"10. Lộ trình rollout và trạng thái hoàn thành\" → \"10. Lộ trình rollout và trạng thái hoàn thành\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ]
  }
}
```

## Entry rationale-266

```json
{
  "entryId": "rationale-266",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_1ef2bc00c79bc7a40787b62a4943f0df",
  "before": {
    "claimId": "claim_1ef2bc00c79bc7a40787b62a4943f0df",
    "sourceUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "11-proof-và-definition-of-done",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1262-1262#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nTarget: docs/platform/agent-confinement/spec.md:513-513#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"11. Proof và Definition of Done\" → \"11. Proof và Definition of Done\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#11-proof-và-definition-of-done under docs/platform/agent-confinement/spec.md#11-proof-và-definition-of-done; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "deep: A36 draw (seed 2026101609); move confinement-authority.md:1262-1262#11-proof-và-definition-of-done -> spec.md:513-513#11-proof-và-definition-of-done, source and target text opened and identical (starts: ## 11. Proof và Definition of Done); classed Weak-exact (source unit shorter than 40 characters; document exact share below one half); target context Spec: Agent Confinement Authority equals the real heading chain; links 0/0/0/0/0/0; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_1ef2bc00c79bc7a40787b62a4943f0df",
    "sourceUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "11-proof-và-definition-of-done",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1262-1262#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nTarget: docs/platform/agent-confinement/spec.md:513-513#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"11. Proof và Definition of Done\" → \"11. Proof và Definition of Done\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"11. Proof và Definition of Done\" → \"11. Proof và Definition of Done\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#11-proof-và-definition-of-done under docs/platform/agent-confinement/spec.md#11-proof-và-definition-of-done; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 265,
  "factsSHA256": "bd199a3862d463db150796c968b0d9552c9196c22df0dccfae1f6185bc76055e",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "11. Proof và Definition of Done",
    "anchor": "11-proof-và-definition-of-done",
    "githubAnchor": "11-proof-và-definition-of-done",
    "stableAnchor": "h-c50fc674d42d",
    "startLine": 1262,
    "endLine": 1262,
    "textDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "sample": "11. Proof và Definition of Done",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "cdb0096afe72b116e5bcd3d167f7c63e4154d6801f4d84ece0a20765b049c280",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "11. Proof và Definition of Done",
    "anchor": "11-proof-và-definition-of-done",
    "githubAnchor": "11-proof-và-definition-of-done",
    "stableAnchor": "h-c9d406bb62ec",
    "startLine": 513,
    "endLine": 513,
    "textDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "sample": "11. Proof và Definition of Done",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "cdb0096afe72b116e5bcd3d167f7c63e4154d6801f4d84ece0a20765b049c280",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 2, title \"11. Proof và Definition of Done\" → \"11. Proof và Definition of Done\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/265/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1ef2bc00c79bc7a40787b62a4943f0df",
    "sourceUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "11-proof-và-definition-of-done",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1262-1262#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nTarget: docs/platform/agent-confinement/spec.md:513-513#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"11. Proof và Definition of Done\" → \"11. Proof và Definition of Done\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"11. Proof và Definition of Done\" → \"11. Proof và Definition of Done\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#11-proof-và-definition-of-done under docs/platform/agent-confinement/spec.md#11-proof-và-definition-of-done; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  }
}
```

## Entry rationale-267

```json
{
  "entryId": "rationale-267",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_7aacf43ab14386fce6c4a5a8a0519402",
  "before": {
    "claimId": "claim_7aacf43ab14386fce6c4a5a8a0519402",
    "sourceUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "111-contract-tests",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1264-1264#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nTarget: docs/platform/agent-confinement/spec.md:515-515#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.1 Contract tests\" → \"11.1 Contract tests\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#111-contract-tests under docs/platform/agent-confinement/spec.md#111-contract-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "mechanical: move confinement-authority.md:1264-1264#111-contract-tests -> spec.md:515-515#111-contract-tests; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_7aacf43ab14386fce6c4a5a8a0519402",
    "sourceUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "111-contract-tests",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1264-1264#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nTarget: docs/platform/agent-confinement/spec.md:515-515#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.1 Contract tests\" → \"11.1 Contract tests\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.1 Contract tests\" → \"11.1 Contract tests\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#111-contract-tests under docs/platform/agent-confinement/spec.md#111-contract-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 266,
  "factsSHA256": "1caa0d6dc5689cdc894d6f152a714dd33cb604749857c76a812814fb2c72e781",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.1 Contract tests",
    "anchor": "111-contract-tests",
    "githubAnchor": "111-contract-tests",
    "stableAnchor": "h-0ecd8a0b825c",
    "startLine": 1264,
    "endLine": 1264,
    "textDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "sample": "11.1 Contract tests",
    "sectionPayloadDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "followingBlockDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "identityFingerprint": "82af35f92031a6c0270bce069b5b40fe9a518a24c48cf9c19dfd4620df7a8167",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.1 Contract tests",
    "anchor": "111-contract-tests",
    "githubAnchor": "111-contract-tests",
    "stableAnchor": "h-60f2d630d8bd",
    "startLine": 515,
    "endLine": 515,
    "textDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "sample": "11.1 Contract tests",
    "sectionPayloadDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "followingBlockDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "identityFingerprint": "82af35f92031a6c0270bce069b5b40fe9a518a24c48cf9c19dfd4620df7a8167",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.1 Contract tests\" → \"11.1 Contract tests\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/266/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7aacf43ab14386fce6c4a5a8a0519402",
    "sourceUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "111-contract-tests",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1264-1264#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nTarget: docs/platform/agent-confinement/spec.md:515-515#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.1 Contract tests\" → \"11.1 Contract tests\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.1 Contract tests\" → \"11.1 Contract tests\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#111-contract-tests under docs/platform/agent-confinement/spec.md#111-contract-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  }
}
```

## Entry rationale-268

```json
{
  "entryId": "rationale-268",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_9168d8af609c58932a87918d4a49b8aa",
  "before": {
    "claimId": "claim_9168d8af609c58932a87918d4a49b8aa",
    "sourceUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "112-one-door-tests",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1276-1276#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nTarget: docs/platform/agent-confinement/spec.md:527-527#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.2 One-door tests\" → \"11.2 One-door tests\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#112-one-door-tests under docs/platform/agent-confinement/spec.md#112-one-door-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "mechanical: move confinement-authority.md:1276-1276#112-one-door-tests -> spec.md:527-527#112-one-door-tests; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_9168d8af609c58932a87918d4a49b8aa",
    "sourceUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "112-one-door-tests",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1276-1276#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nTarget: docs/platform/agent-confinement/spec.md:527-527#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.2 One-door tests\" → \"11.2 One-door tests\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.2 One-door tests\" → \"11.2 One-door tests\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#112-one-door-tests under docs/platform/agent-confinement/spec.md#112-one-door-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 267,
  "factsSHA256": "1499d27b0f3e20fa39b0d5c2d1bb77b89b99f932a3ce7cdc58211a61b0dceb57",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.2 One-door tests",
    "anchor": "112-one-door-tests",
    "githubAnchor": "112-one-door-tests",
    "stableAnchor": "h-886b988eecbd",
    "startLine": 1276,
    "endLine": 1276,
    "textDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "sample": "11.2 One-door tests",
    "sectionPayloadDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "followingBlockDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "identityFingerprint": "b2e82e3f7befe0b07ad09334df78f223468288b139a707aa687919ceff6bd2b1",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.2 One-door tests",
    "anchor": "112-one-door-tests",
    "githubAnchor": "112-one-door-tests",
    "stableAnchor": "h-fb363aa95795",
    "startLine": 527,
    "endLine": 527,
    "textDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "sample": "11.2 One-door tests",
    "sectionPayloadDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "followingBlockDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "identityFingerprint": "b2e82e3f7befe0b07ad09334df78f223468288b139a707aa687919ceff6bd2b1",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.2 One-door tests\" → \"11.2 One-door tests\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/267/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9168d8af609c58932a87918d4a49b8aa",
    "sourceUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "112-one-door-tests",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1276-1276#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nTarget: docs/platform/agent-confinement/spec.md:527-527#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.2 One-door tests\" → \"11.2 One-door tests\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.2 One-door tests\" → \"11.2 One-door tests\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#112-one-door-tests under docs/platform/agent-confinement/spec.md#112-one-door-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  }
}
```

## Entry rationale-269

```json
{
  "entryId": "rationale-269",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_78563a2491b11f7a0b412c5b900a7414",
  "before": {
    "claimId": "claim_78563a2491b11f7a0b412c5b900a7414",
    "sourceUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "113-behavior-probes",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1289-1289#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nTarget: docs/platform/agent-confinement/spec.md:540-540#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.3 Behavior probes\" → \"11.3 Behavior probes\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#113-behavior-probes under docs/platform/agent-confinement/spec.md#113-behavior-probes; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "mechanical: move confinement-authority.md:1289-1289#113-behavior-probes -> spec.md:540-540#113-behavior-probes; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_78563a2491b11f7a0b412c5b900a7414",
    "sourceUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "113-behavior-probes",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1289-1289#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nTarget: docs/platform/agent-confinement/spec.md:540-540#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.3 Behavior probes\" → \"11.3 Behavior probes\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.3 Behavior probes\" → \"11.3 Behavior probes\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#113-behavior-probes under docs/platform/agent-confinement/spec.md#113-behavior-probes; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 268,
  "factsSHA256": "99e696037d486aca8e4a117e3baf6234326bde2550b9148dbfa18641a97ef977",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.3 Behavior probes",
    "anchor": "113-behavior-probes",
    "githubAnchor": "113-behavior-probes",
    "stableAnchor": "h-866855bcc874",
    "startLine": 1289,
    "endLine": 1289,
    "textDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "sample": "11.3 Behavior probes",
    "sectionPayloadDigest": "25795daf33ab63c17682f94969b0e8f456a1ce9d6742558eaef42524b19d492b",
    "followingBlockDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
    "identityFingerprint": "6fb2d37e90d0e1f61144bf73d34b74f73eb3a1dbcd714f61687ad16ce61459ad",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.3 Behavior probes",
    "anchor": "113-behavior-probes",
    "githubAnchor": "113-behavior-probes",
    "stableAnchor": "h-179220e5521a",
    "startLine": 540,
    "endLine": 540,
    "textDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "sample": "11.3 Behavior probes",
    "sectionPayloadDigest": "25795daf33ab63c17682f94969b0e8f456a1ce9d6742558eaef42524b19d492b",
    "followingBlockDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
    "identityFingerprint": "6fb2d37e90d0e1f61144bf73d34b74f73eb3a1dbcd714f61687ad16ce61459ad",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.3 Behavior probes\" → \"11.3 Behavior probes\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/268/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_78563a2491b11f7a0b412c5b900a7414",
    "sourceUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "113-behavior-probes",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1289-1289#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nTarget: docs/platform/agent-confinement/spec.md:540-540#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.3 Behavior probes\" → \"11.3 Behavior probes\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.3 Behavior probes\" → \"11.3 Behavior probes\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#113-behavior-probes under docs/platform/agent-confinement/spec.md#113-behavior-probes; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  }
}
```

## Entry rationale-270

```json
{
  "entryId": "rationale-270",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_dc8b5bc2507201dd705fcd64deba8224",
  "before": {
    "claimId": "claim_dc8b5bc2507201dd705fcd64deba8224",
    "sourceUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "114-observability",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1308-1308#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nTarget: docs/platform/agent-confinement/spec.md:559-559#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.4 Observability\" → \"11.4 Observability\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#114-observability under docs/platform/agent-confinement/spec.md#114-observability; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "mechanical: move confinement-authority.md:1308-1308#114-observability -> spec.md:559-559#114-observability; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_dc8b5bc2507201dd705fcd64deba8224",
    "sourceUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "114-observability",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1308-1308#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nTarget: docs/platform/agent-confinement/spec.md:559-559#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.4 Observability\" → \"11.4 Observability\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.4 Observability\" → \"11.4 Observability\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#114-observability under docs/platform/agent-confinement/spec.md#114-observability; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 269,
  "factsSHA256": "12ba8b8bce1f0225a55e331f57a184f265729750b3de0a07b6707ee2dfda0f51",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.4 Observability",
    "anchor": "114-observability",
    "githubAnchor": "114-observability",
    "stableAnchor": "h-dcc49dd9f79f",
    "startLine": 1308,
    "endLine": 1308,
    "textDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "sample": "11.4 Observability",
    "sectionPayloadDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "followingBlockDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "identityFingerprint": "1e29090251eca1008282da4897323dc42aef6b3d44b173e61dcc7b56ca99350f",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.4 Observability",
    "anchor": "114-observability",
    "githubAnchor": "114-observability",
    "stableAnchor": "h-0cf582736c01",
    "startLine": 559,
    "endLine": 559,
    "textDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "sample": "11.4 Observability",
    "sectionPayloadDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "followingBlockDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "identityFingerprint": "1e29090251eca1008282da4897323dc42aef6b3d44b173e61dcc7b56ca99350f",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.4 Observability\" → \"11.4 Observability\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/269/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_dc8b5bc2507201dd705fcd64deba8224",
    "sourceUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "114-observability",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1308-1308#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nTarget: docs/platform/agent-confinement/spec.md:559-559#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.4 Observability\" → \"11.4 Observability\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.4 Observability\" → \"11.4 Observability\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#114-observability under docs/platform/agent-confinement/spec.md#114-observability; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  }
}
```

## Entry rationale-271

```json
{
  "entryId": "rationale-271",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_b532b9a9eb7f76d041c343e2d45bf859",
  "before": {
    "claimId": "claim_b532b9a9eb7f76d041c343e2d45bf859",
    "sourceUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "115-doctorsetup",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1316-1316#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nTarget: docs/platform/agent-confinement/spec.md:567-567#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.5 Doctor/setup\" → \"11.5 Doctor/setup\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#115-doctorsetup under docs/platform/agent-confinement/spec.md#115-doctorsetup; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "mechanical: move confinement-authority.md:1316-1316#115-doctorsetup -> spec.md:567-567#115-doctorsetup; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_b532b9a9eb7f76d041c343e2d45bf859",
    "sourceUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "115-doctorsetup",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1316-1316#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nTarget: docs/platform/agent-confinement/spec.md:567-567#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.5 Doctor/setup\" → \"11.5 Doctor/setup\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.5 Doctor/setup\" → \"11.5 Doctor/setup\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#115-doctorsetup under docs/platform/agent-confinement/spec.md#115-doctorsetup; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 270,
  "factsSHA256": "714108f737380c01f5ff3def3bf595c401bbc5a3d6d8747a5af424cbf63eb521",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.5 Doctor/setup",
    "anchor": "115-doctorsetup",
    "githubAnchor": "115-doctorsetup",
    "stableAnchor": "h-f12088d9faea",
    "startLine": 1316,
    "endLine": 1316,
    "textDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "sample": "11.5 Doctor/setup",
    "sectionPayloadDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "followingBlockDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "identityFingerprint": "63db4a6c6040e594a90a3ba706fe7bb20be7e02a99702a61a51928b0815ede37",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.5 Doctor/setup",
    "anchor": "115-doctorsetup",
    "githubAnchor": "115-doctorsetup",
    "stableAnchor": "h-59852c0a93a4",
    "startLine": 567,
    "endLine": 567,
    "textDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "sample": "11.5 Doctor/setup",
    "sectionPayloadDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "followingBlockDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "identityFingerprint": "63db4a6c6040e594a90a3ba706fe7bb20be7e02a99702a61a51928b0815ede37",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.5 Doctor/setup\" → \"11.5 Doctor/setup\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/270/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b532b9a9eb7f76d041c343e2d45bf859",
    "sourceUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "115-doctorsetup",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1316-1316#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nTarget: docs/platform/agent-confinement/spec.md:567-567#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.5 Doctor/setup\" → \"11.5 Doctor/setup\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.5 Doctor/setup\" → \"11.5 Doctor/setup\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#115-doctorsetup under docs/platform/agent-confinement/spec.md#115-doctorsetup; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  }
}
```

## Entry rationale-272

```json
{
  "entryId": "rationale-272",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_e793bd095f4a872b0bc08757c827359f",
  "before": {
    "claimId": "claim_e793bd095f4a872b0bc08757c827359f",
    "sourceUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
    "targetAnchor": "12-quyết-định-của-proposal",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1326-1326#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nTarget: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md:24-24#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"12. Quyết định của proposal\" → \"12. Quyết định của proposal\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#12-quyết-định-của-proposal under docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#12-quyết-định-của-proposal; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: confinement authority decisions\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "mechanical: move confinement-authority.md:1326-1326#12-quyết-định-của-proposal -> confinement-authority-decisions.md:24-24#12-quyết-định-của-proposal; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetAncestry": [
      "Added in candidate: confinement authority decisions"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_e793bd095f4a872b0bc08757c827359f",
    "sourceUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
    "targetAnchor": "12-quyết-định-của-proposal",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1326-1326#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nTarget: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md:24-24#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"12. Quyết định của proposal\" → \"12. Quyết định của proposal\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"12. Quyết định của proposal\" → \"12. Quyết định của proposal\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#12-quyết-định-của-proposal under docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#12-quyết-định-của-proposal; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: confinement authority decisions\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetAncestry": [
      "Added in candidate: confinement authority decisions"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 271,
  "factsSHA256": "dd5d1e118569c3ed81dad844cd395aa03516d6b9192c7ae0c0677f19d4d15746",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "12. Quyết định của proposal",
    "anchor": "12-quyết-định-của-proposal",
    "githubAnchor": "12-quyết-định-của-proposal",
    "stableAnchor": "h-ff16de6cd157",
    "startLine": 1326,
    "endLine": 1326,
    "textDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "sample": "12. Quyết định của proposal",
    "sectionPayloadDigest": "92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1",
    "followingBlockDigest": "92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1",
    "identityFingerprint": "c87149d70c4b0ea8ad97bd1a4cc43a66d1f2cbea61ed8522610331905d35ceaa",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "12. Quyết định của proposal",
    "anchor": "12-quyết-định-của-proposal",
    "githubAnchor": "12-quyết-định-của-proposal",
    "stableAnchor": "h-80f48075fc23",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "sample": "12. Quyết định của proposal",
    "sectionPayloadDigest": "92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1",
    "followingBlockDigest": "92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1",
    "identityFingerprint": "c87149d70c4b0ea8ad97bd1a4cc43a66d1f2cbea61ed8522610331905d35ceaa",
    "ancestry": [
      "Added in candidate: confinement authority decisions"
    ],
    "path": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 2, title \"12. Quyết định của proposal\" → \"12. Quyết định của proposal\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/271/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e793bd095f4a872b0bc08757c827359f",
    "sourceUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
    "targetAnchor": "12-quyết-định-của-proposal",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1326-1326#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nTarget: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md:24-24#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"12. Quyết định của proposal\" → \"12. Quyết định của proposal\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"12. Quyết định của proposal\" → \"12. Quyết định của proposal\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#12-quyết-định-của-proposal under docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#12-quyết-định-của-proposal; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: confinement authority decisions\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetAncestry": [
      "Added in candidate: confinement authority decisions"
    ]
  }
}
```

## Entry rationale-273

```json
{
  "entryId": "rationale-273",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_7aede254166851de375089f4b0160ca6",
  "before": {
    "claimId": "claim_7aede254166851de375089f4b0160ca6",
    "sourceUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1343-1343#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:39-39#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\" → \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "mechanical: move confinement-authority.md:1343-1343#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items -> rollout-and-settled-facts.md:39-39#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items; both digests recomputed by script and equal; lines equal real spans; anchor ok; ancestry equals real chain; links 0/0/0/0/0/0; row equals shard at the pin; last-reviewed digest backed by a committed ok verdict; class Weak-exact. hand-recomputed both digests (seed 2026101608).",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_7aede254166851de375089f4b0160ca6",
    "sourceUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1343-1343#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:39-39#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\" → \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\" → \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 272,
  "factsSHA256": "88bf8a240ee992440ba2f2ef116d1ddf43d7dcbe286773d4a08af3ed08f1737a",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "anchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "githubAnchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "stableAnchor": "h-c9b02be6aabd",
    "startLine": 1343,
    "endLine": 1343,
    "textDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "sample": "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "sectionPayloadDigest": "1fc0d4cbbe5a263e67f29f17230401aa211d9042d09712af5ff20cd53c33e91f",
    "followingBlockDigest": "a7fc9ce0823faab5b809042244aae5280d335cab7d03343c7e3ba2fe7e1e20ea",
    "identityFingerprint": "a038bbeda50426ee1b97b96f990dc8ffcf1bc80a86fd1141ca6d75984a87bd76",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "anchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "githubAnchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "stableAnchor": "h-c462f8b8b037",
    "startLine": 39,
    "endLine": 39,
    "textDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "sample": "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "sectionPayloadDigest": "1fc0d4cbbe5a263e67f29f17230401aa211d9042d09712af5ff20cd53c33e91f",
    "followingBlockDigest": "a7fc9ce0823faab5b809042244aae5280d335cab7d03343c7e3ba2fe7e1e20ea",
    "identityFingerprint": "a038bbeda50426ee1b97b96f990dc8ffcf1bc80a86fd1141ca6d75984a87bd76",
    "ancestry": [
      "Added in candidate: rollout and settled facts"
    ],
    "path": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 2, title \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\" → \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/272/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7aede254166851de375089f4b0160ca6",
    "sourceUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1343-1343#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:39-39#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\" → \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\" → \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ]
  }
}
```

## Entry rationale-274

```json
{
  "entryId": "rationale-274",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_39c40cef341e227d936ea768b12ba435",
  "before": {
    "claimId": "claim_39c40cef341e227d936ea768b12ba435",
    "sourceUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1355-1355#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:51-51#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\" → \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Added in candidate: rollout and settled facts / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "deep: A36 draw (seed 2026101609); move confinement-authority.md:1355-1355#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên -> rollout-and-settled-facts.md:51-51#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên, source and target text opened and identical (starts: ### 13.1 Pane herdr bị confine cho agent khôn); classed Weak-exact (ancestor headings differ; document exact share below one half); target context Added in candidate: rollout and settled facts / 13. Kết quả giải quyết equals the real heading chain; links 0/0/0/0/0/0; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-12-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_39c40cef341e227d936ea768b12ba435",
    "sourceUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1355-1355#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:51-51#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\" → \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\" → \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Added in candidate: rollout and settled facts / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 273,
  "factsSHA256": "8226be7513f00b31ec6430735297ba4db4d66b1e573c69a6d3fd50c07358b0ad",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên",
    "anchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "githubAnchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "stableAnchor": "h-e0e1a7595b41",
    "startLine": 1355,
    "endLine": 1355,
    "textDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "sample": "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên",
    "sectionPayloadDigest": "0c8410017c94755acd170973be6e4c78eb54aea4bd0cdb3a1350d3524c95c391",
    "followingBlockDigest": "09081a2c1a3eb4536192eed72162efca188fdf9b084170519b57415f216c32c3",
    "identityFingerprint": "942a121dc08a85b84a6973f1551e50da26e990fac1ed773c9ba34f31d4879838",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên",
    "anchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "githubAnchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "stableAnchor": "h-8c2cd16a1cdd",
    "startLine": 51,
    "endLine": 51,
    "textDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "sample": "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên",
    "sectionPayloadDigest": "0c8410017c94755acd170973be6e4c78eb54aea4bd0cdb3a1350d3524c95c391",
    "followingBlockDigest": "09081a2c1a3eb4536192eed72162efca188fdf9b084170519b57415f216c32c3",
    "identityFingerprint": "942a121dc08a85b84a6973f1551e50da26e990fac1ed773c9ba34f31d4879838",
    "ancestry": [
      "Added in candidate: rollout and settled facts",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ],
    "path": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 3 → 3, title \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\" → \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/273/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_39c40cef341e227d936ea768b12ba435",
    "sourceUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1355-1355#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:51-51#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\" → \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\" → \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Added in candidate: rollout and settled facts / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ]
  }
}
```

