# Bounded re-review: frozen 4

Author session: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
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

## Entry frozen-096

```json
{
  "kind": "frozen-reviewed-rationale-confirmation",
  "entryId": "frozen-096",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-round3-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_d342cec565707124f0b4e7860db2193c",
  "frozenRecord": {
    "claimId": "claim_d342cec565707124f0b4e7860db2193c",
    "sourceUnitDigest": "d02d7891949ca1a0284d509b5c8828e1631138f4d32c20830d5491efb75836c8",
    "targetOwner": "docs/platform/host-invocation-routing/vision.md",
    "targetAnchor": "unheaded-block-11",
    "targetUnitDigest": "ae9e5973a1589865f79a8daee8e14aa245ce6a8b7a0f7af3978006e63771ebb2",
    "disposition": "supersede",
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "witnessCommit": "9b0526380",
    "reason": "Deliberately authored rationale independently reviewed; preserve at unchanged binding (L10-29).",
    "sourcePath": "docs/platform/host-invocation-routing/vision.md",
    "targetAncestry": [
      "Host Invocation Vision",
      "5. Design Direction"
    ]
  },
  "existingApprovalPreserved": true,
  "mechanicalRequired": true,
  "deepRequired": false,
  "tags": [],
  "reviewScope": "Confirm frozen list and complete binding/rationale. Reviewed rows keep approval; pending L10-2 verdict is submitted once in rationales. L10-2 must equal original 5035fed52 rationale, full identities/digests/residual and superseded A34 note.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d342cec565707124f0b4e7860db2193c",
    "sourcePath": "docs/platform/host-invocation-routing/vision.md",
    "sourceUnitDigest": "d02d7891949ca1a0284d509b5c8828e1631138f4d32c20830d5491efb75836c8",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/host-invocation-routing/vision.md",
    "targetAnchor": "unheaded-block-11",
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
    "reviewNote": "deep: vision.md unheaded-block-11 L61-67 (Design Direction table): word diff of the 345f15d95 unit against the current unit is exactly the three Preserved from destinations (spec.md, architecture/external-provider-protocol.md, architecture/node-to-rust-migration.md to the three ../../architect/host-invocation-routing/ files), i.e. the legacy destination restoration of L10-23; the unit digest recorded as source reproduces at 345f15d95 and the target digest equals the current unit at the same anchor, so the claim that the Complete immutable before and after text is recorded in step10-sync287-predecessor-reconciliation.json is true (texts equal my recomputation); the registry record moved from units to identityGaps with identityStatus identity-gap and the new successor unit exists, row equals the committed shard row, pending, no approval; rationale is generic but not false: one sentence shared by all four rows names every possible cause (legacy destination restoration or scaffold or refuseHelp citation correction) instead of the one that applies; claimKind specification is a vocabulary difference from the registry kind, as accepted before.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-accounting-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ae9e5973a1589865f79a8daee8e14aa245ce6a8b7a0f7af3978006e63771ebb2",
    "targetAncestry": [
      "Host Invocation Vision",
      "5. Design Direction"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  }
}
```

## Entry frozen-097

```json
{
  "kind": "frozen-reviewed-rationale-confirmation",
  "entryId": "frozen-097",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-round3-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_a4ed6ca5cfd26790037b35d1c99373b2",
  "frozenRecord": {
    "claimId": "claim_a4ed6ca5cfd26790037b35d1c99373b2",
    "sourceUnitDigest": "9aefc76daebb502839626d20f26342d459be16ca0412bed1a7d4d3af5dd4ea9c",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-75",
    "targetUnitDigest": "19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a",
    "disposition": "supersede",
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "witnessCommit": "9b0526380",
    "reason": "Deliberately authored rationale independently reviewed; preserve at unchanged binding (L10-29).",
    "sourcePath": "docs/platform/packaging-distribution/spec.md",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail",
      "Workspace Runtime Model"
    ]
  },
  "existingApprovalPreserved": true,
  "mechanicalRequired": true,
  "deepRequired": false,
  "tags": [],
  "reviewScope": "Confirm frozen list and complete binding/rationale. Reviewed rows keep approval; pending L10-2 verdict is submitted once in rationales. L10-2 must equal original 5035fed52 rationale, full identities/digests/residual and superseded A34 note.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a4ed6ca5cfd26790037b35d1c99373b2",
    "sourcePath": "docs/platform/packaging-distribution/spec.md",
    "sourceUnitDigest": "9aefc76daebb502839626d20f26342d459be16ca0412bed1a7d4d3af5dd4ea9c",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-75",
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
    "reviewNote": "deep: packaging-distribution spec.md unheaded-block-75 L438-442: the only delta is the destination ../system-architecture/architecture/workspace-topology.md to ../../architect/workspace-topology.md under the unchanged label (L10-26); the unit digest recorded as source reproduces at 345f15d95 and the target digest equals the current unit at the same anchor, so the claim that the Complete immutable before and after text is recorded in step10-sync287-predecessor-reconciliation.json is true (texts equal my recomputation); the registry record moved from units to identityGaps with identityStatus identity-gap and the new successor unit exists, row equals the committed shard row, pending, no approval; rationale is generic but not false: one sentence shared by all four rows names every possible cause (legacy destination restoration or scaffold or refuseHelp citation correction) instead of the one that applies; claimKind specification is a vocabulary difference from the registry kind, as accepted before.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-accounting-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail",
      "Workspace Runtime Model"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  }
}
```

## Entry frozen-098

```json
{
  "kind": "frozen-reviewed-rationale-confirmation",
  "entryId": "frozen-098",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-round3-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_c0f157804addf46fdb20b9c61882794b",
  "frozenRecord": {
    "claimId": "claim_c0f157804addf46fdb20b9c61882794b",
    "sourceUnitDigest": "0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-26",
    "targetUnitDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "disposition": "supersede",
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "witnessCommit": "9b0526380",
    "reason": "Deliberately authored rationale independently reviewed; preserve at unchanged binding (L10-29).",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ]
  },
  "existingApprovalPreserved": true,
  "mechanicalRequired": true,
  "deepRequired": false,
  "tags": [],
  "reviewScope": "Confirm frozen list and complete binding/rationale. Reviewed rows keep approval; pending L10-2 verdict is submitted once in rationales. L10-2 must equal original 5035fed52 rationale, full identities/digests/residual and superseded A34 note.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c0f157804addf46fdb20b9c61882794b",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "sourceUnitDigest": "0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-26",
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
    "reviewNote": "deep: h-51f5cd7279fd.md unheaded-block-26 L456-467: the only delta is bin/fgos.mjs:4415,4461 to 4415,4503 (L10-24 refuseHelp); the unit digest recorded as source reproduces at 345f15d95 and the target digest equals the current unit at the same anchor, so the claim that the Complete immutable before and after text is recorded in step10-sync287-predecessor-reconciliation.json is true (texts equal my recomputation); the registry record moved from units to identityGaps with identityStatus identity-gap and the new successor unit exists, row equals the committed shard row, pending, no approval; rationale is generic but not false: one sentence shared by all four rows names every possible cause (legacy destination restoration or scaffold or refuseHelp citation correction) instead of the one that applies; claimKind specification is a vocabulary difference from the registry kind, as accepted before.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-accounting-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  }
}
```

## Entry frozen-099

```json
{
  "kind": "frozen-reviewed-rationale-confirmation",
  "entryId": "frozen-099",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-round3-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_647a9d5f06216a5e9d6fa267e77cbf03",
  "frozenRecord": {
    "claimId": "claim_647a9d5f06216a5e9d6fa267e77cbf03",
    "sourceUnitDigest": "35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-2",
    "targetUnitDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
    "disposition": "supersede",
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "witnessCommit": "9b0526380",
    "reason": "Deliberately authored rationale independently reviewed; preserve at unchanged binding (L10-29).",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ]
  },
  "existingApprovalPreserved": true,
  "mechanicalRequired": true,
  "deepRequired": false,
  "tags": [],
  "reviewScope": "Confirm frozen list and complete binding/rationale. Reviewed rows keep approval; pending L10-2 verdict is submitted once in rationales. L10-2 must equal original 5035fed52 rationale, full identities/digests/residual and superseded A34 note.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "currentDecision": {
    "claimId": "claim_647a9d5f06216a5e9d6fa267e77cbf03",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "sourceUnitDigest": "35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-2",
    "rationale": "A22/A31/L10-23–L10-27: native predecessor from 345f15d95 is superseded by the current same-section unit after authorized legacy destination restoration or scaffold/refuseHelp code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync287-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
    "reviewNote": "deep: h-f34e0d170d89/spec.md unheaded-block-2 L23: the only delta is the inverted pointer pair 4640-4643; 4415-4380 to 4414-4417 (L10-24 scaffold); the unit digest recorded as source reproduces at 345f15d95 and the target digest equals the current unit at the same anchor, so the claim that the Complete immutable before and after text is recorded in step10-sync287-predecessor-reconciliation.json is true (texts equal my recomputation); the registry record moved from units to identityGaps with identityStatus identity-gap and the new successor unit exists, row equals the committed shard row, pending, no approval; rationale is generic but not false: one sentence shared by all four rows names every possible cause (legacy destination restoration or scaffold or refuseHelp citation correction) instead of the one that applies; claimKind specification is a vocabulary difference from the registry kind, as accepted before.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-accounting-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  }
}
```

