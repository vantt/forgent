# Bounded re-review: rationales 4

Author session: `codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **31**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
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

## Entry rationale-094

```json
{
  "entryId": "rationale-094",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_0544be1eb82e576df7f734a738b995f1",
  "before": {
    "claimId": "claim_0544be1eb82e576df7f734a738b995f1",
    "sourceUnitDigest": "4649f66df0fec76762933bc00c376aad6df29b4f3a3156d94cd5a60992e667a2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/coordination-operating-harness.md:464-468#unheaded-block-69 (current lines); unit SHA256 4649f66df0fec76762933bc00c376aad6df29b4f3a3156d94cd5a60992e667a2.\nTarget: docs/platform/agent-coordination/playbooks/coordination-operating-harness.md:459-459#13-tests-and-checks (current lines); unit SHA256 7ab6f86fa25e56830c81d424911c6257e8876588146fb3bda9f254c8251a5125.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7ab6f86fa25e56830c81d424911c6257e8876588146fb3bda9f254c8251a5125 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 69\" → \"13. Tests And Checks\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/coordination-operating-harness.md#unheaded-block-69 under docs/platform/agent-coordination/playbooks/coordination-operating-harness.md#13-tests-and-checks; source context \"Coordination Operating Harness / 13. Tests And Checks\", target context \"Coordination Operating Harness\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/coordination-operating-harness.md",
    "targetAnchor": "13-tests-and-checks",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block ('''bash test -s docs/architect/agent-coordination/verif...) against target section '13. Tests And Checks' (h2); 2 of 5 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7ab6f86fa25e56830c81d424911c6257e8876588146fb3bda9f254c8251a5125",
    "targetAncestry": [
      "Coordination Operating Harness"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_0544be1eb82e576df7f734a738b995f1",
    "sourceUnitDigest": "4649f66df0fec76762933bc00c376aad6df29b4f3a3156d94cd5a60992e667a2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/coordination-operating-harness.md:464-468#unheaded-block-69 (current lines); unit SHA256 4649f66df0fec76762933bc00c376aad6df29b4f3a3156d94cd5a60992e667a2.\nTarget: docs/platform/agent-coordination/playbooks/coordination-operating-harness.md:459-459#13-tests-and-checks (current lines); unit SHA256 7ab6f86fa25e56830c81d424911c6257e8876588146fb3bda9f254c8251a5125.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7ab6f86fa25e56830c81d424911c6257e8876588146fb3bda9f254c8251a5125 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 69\" → \"13. Tests And Checks\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 11 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/coordination-operating-harness.md#unheaded-block-69 under docs/platform/agent-coordination/playbooks/coordination-operating-harness.md#13-tests-and-checks; source context \"Coordination Operating Harness / 13. Tests And Checks\", target context \"Coordination Operating Harness\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/coordination-operating-harness.md",
    "targetAnchor": "13-tests-and-checks",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "7ab6f86fa25e56830c81d424911c6257e8876588146fb3bda9f254c8251a5125",
    "targetAncestry": [
      "Coordination Operating Harness"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 93,
  "factsSHA256": "771fb4d9ee726030d7f50253f225fe9f310e3db471ecef5cc4c45b50f5ef0dab",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-69",
    "githubAnchor": "unheaded-block-69",
    "stableAnchor": "unheaded-block-69",
    "title": "Unheaded block 69",
    "startLine": 464,
    "endLine": 468,
    "textDigest": "4649f66df0fec76762933bc00c376aad6df29b4f3a3156d94cd5a60992e667a2",
    "sample": "```bash\ntest -s docs/architect/agent-coordination/verification/team-dispatch-v1/index.md\ntest -s docs/architect/agent-coordination/verification/team-dispatch-v1/current-cell.md\nrg ",
    "identityFingerprint": "64db1c7ed2db06be257134f15ef126a42d150c00ee69736826e23f0d47ba22b5",
    "ancestry": [
      "Coordination Operating Harness",
      "13. Tests And Checks"
    ],
    "path": "docs/architect/agent-coordination/playbooks/coordination-operating-harness.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "13. Tests And Checks",
    "anchor": "13-tests-and-checks",
    "githubAnchor": "13-tests-and-checks",
    "stableAnchor": "h-8f00e6555985",
    "startLine": 459,
    "endLine": 459,
    "textDigest": "7ab6f86fa25e56830c81d424911c6257e8876588146fb3bda9f254c8251a5125",
    "sample": "13. Tests And Checks",
    "sectionPayloadDigest": "628db170df402d219fa440871c77565ee6930eba8d342d793aaa52d3601c61cd",
    "followingBlockDigest": "b30c7e78ac6637aa07ff6323eeba7542773dbeb0de5695a3305064e3bb06f6db",
    "identityFingerprint": "af2df0dcf9b0e0573ee2cc7a7c725313d6807ecf105e942952a9aebbe9784961",
    "ancestry": [
      "Coordination Operating Harness"
    ],
    "path": "docs/platform/agent-coordination/playbooks/coordination-operating-harness.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0544be1eb82e576df7f734a738b995f1",
    "sourceUnitDigest": "4649f66df0fec76762933bc00c376aad6df29b4f3a3156d94cd5a60992e667a2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/coordination-operating-harness.md:464-468#unheaded-block-69 (current lines); unit SHA256 4649f66df0fec76762933bc00c376aad6df29b4f3a3156d94cd5a60992e667a2.\nTarget: docs/platform/agent-coordination/playbooks/coordination-operating-harness.md:459-459#13-tests-and-checks (current lines); unit SHA256 7ab6f86fa25e56830c81d424911c6257e8876588146fb3bda9f254c8251a5125.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7ab6f86fa25e56830c81d424911c6257e8876588146fb3bda9f254c8251a5125 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 69\" → \"13. Tests And Checks\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 11 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/coordination-operating-harness.md#unheaded-block-69 under docs/platform/agent-coordination/playbooks/coordination-operating-harness.md#13-tests-and-checks; source context \"Coordination Operating Harness / 13. Tests And Checks\", target context \"Coordination Operating Harness\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/coordination-operating-harness.md",
    "targetAnchor": "13-tests-and-checks",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "7ab6f86fa25e56830c81d424911c6257e8876588146fb3bda9f254c8251a5125",
    "targetAncestry": [
      "Coordination Operating Harness"
    ]
  }
}
```

## Entry rationale-095

```json
{
  "entryId": "rationale-095",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_90fbeda9e2de642bde1f61e75eb4cb4b",
  "before": {
    "claimId": "claim_90fbeda9e2de642bde1f61e75eb4cb4b",
    "sourceUnitDigest": "93476c66ea637559d29695b574d2e77a1bfb8addcba151a34b2ff01ada40ed4e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/coordination-operating-harness.md:484-486#unheaded-block-72 (current lines); unit SHA256 93476c66ea637559d29695b574d2e77a1bfb8addcba151a34b2ff01ada40ed4e.\nTarget: docs/platform/agent-coordination/playbooks/coordination-operating-harness.md:490-490#15-rollback (current lines); unit SHA256 5da5931b8a43b3b69e9113b5f7ad824ca1652d5df0dc29bbe566711881548271.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5da5931b8a43b3b69e9113b5f7ad824ca1652d5df0dc29bbe566711881548271 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 72\" → \"15. Rollback\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/coordination-operating-harness.md#unheaded-block-72 under docs/platform/agent-coordination/playbooks/coordination-operating-harness.md#15-rollback; source context \"Coordination Operating Harness / 15. Rollback\", target context \"Coordination Operating Harness\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/coordination-operating-harness.md",
    "targetAnchor": "15-rollback",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (Rollback is simple: remove trace harness docs/templates...) against target section '15. Rollback' (h2); 0 of 3 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "5da5931b8a43b3b69e9113b5f7ad824ca1652d5df0dc29bbe566711881548271",
    "targetAncestry": [
      "Coordination Operating Harness"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_90fbeda9e2de642bde1f61e75eb4cb4b",
    "sourceUnitDigest": "93476c66ea637559d29695b574d2e77a1bfb8addcba151a34b2ff01ada40ed4e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/coordination-operating-harness.md:484-486#unheaded-block-72 (current lines); unit SHA256 93476c66ea637559d29695b574d2e77a1bfb8addcba151a34b2ff01ada40ed4e.\nTarget: docs/platform/agent-coordination/playbooks/coordination-operating-harness.md:490-490#15-rollback (current lines); unit SHA256 5da5931b8a43b3b69e9113b5f7ad824ca1652d5df0dc29bbe566711881548271.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5da5931b8a43b3b69e9113b5f7ad824ca1652d5df0dc29bbe566711881548271 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 72\" → \"15. Rollback\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/coordination-operating-harness.md#unheaded-block-72 under docs/platform/agent-coordination/playbooks/coordination-operating-harness.md#15-rollback; source context \"Coordination Operating Harness / 15. Rollback\", target context \"Coordination Operating Harness\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/coordination-operating-harness.md",
    "targetAnchor": "15-rollback",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "5da5931b8a43b3b69e9113b5f7ad824ca1652d5df0dc29bbe566711881548271",
    "targetAncestry": [
      "Coordination Operating Harness"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 94,
  "factsSHA256": "acdc4fbd3f67ee7a911731837a482286151b62dff9c1ac7e664a24c3133732a7",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-72",
    "githubAnchor": "unheaded-block-72",
    "stableAnchor": "unheaded-block-72",
    "title": "Unheaded block 72",
    "startLine": 484,
    "endLine": 486,
    "textDigest": "93476c66ea637559d29695b574d2e77a1bfb8addcba151a34b2ff01ada40ed4e",
    "sample": "Rollback is simple: remove trace harness docs/templates. Do not remove runtime\nimplementation or numbered architecture plans. The harness improves\ncoordination discipline; it is no",
    "identityFingerprint": "6611e3aa83abe4f4a66649a3a3f1e79f02a08e38110b72c01a13c5cac8a37b66",
    "ancestry": [
      "Coordination Operating Harness",
      "15. Rollback"
    ],
    "path": "docs/architect/agent-coordination/playbooks/coordination-operating-harness.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "15. Rollback",
    "anchor": "15-rollback",
    "githubAnchor": "15-rollback",
    "stableAnchor": "h-dc067e4066a7",
    "startLine": 490,
    "endLine": 490,
    "textDigest": "5da5931b8a43b3b69e9113b5f7ad824ca1652d5df0dc29bbe566711881548271",
    "sample": "15. Rollback",
    "sectionPayloadDigest": "a8fc3d53c1cda6dac51d231c037a89cf7604c8ff4e4d25c5a309a20cff826be1",
    "followingBlockDigest": "a8fc3d53c1cda6dac51d231c037a89cf7604c8ff4e4d25c5a309a20cff826be1",
    "identityFingerprint": "7acdda0939f48c56588c606ad6ae22596c4954a48c81270f12e63bd33d76dc98",
    "ancestry": [
      "Coordination Operating Harness"
    ],
    "path": "docs/platform/agent-coordination/playbooks/coordination-operating-harness.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_90fbeda9e2de642bde1f61e75eb4cb4b",
    "sourceUnitDigest": "93476c66ea637559d29695b574d2e77a1bfb8addcba151a34b2ff01ada40ed4e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/coordination-operating-harness.md:484-486#unheaded-block-72 (current lines); unit SHA256 93476c66ea637559d29695b574d2e77a1bfb8addcba151a34b2ff01ada40ed4e.\nTarget: docs/platform/agent-coordination/playbooks/coordination-operating-harness.md:490-490#15-rollback (current lines); unit SHA256 5da5931b8a43b3b69e9113b5f7ad824ca1652d5df0dc29bbe566711881548271.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5da5931b8a43b3b69e9113b5f7ad824ca1652d5df0dc29bbe566711881548271 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 72\" → \"15. Rollback\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/coordination-operating-harness.md#unheaded-block-72 under docs/platform/agent-coordination/playbooks/coordination-operating-harness.md#15-rollback; source context \"Coordination Operating Harness / 15. Rollback\", target context \"Coordination Operating Harness\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/coordination-operating-harness.md",
    "targetAnchor": "15-rollback",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "5da5931b8a43b3b69e9113b5f7ad824ca1652d5df0dc29bbe566711881548271",
    "targetAncestry": [
      "Coordination Operating Harness"
    ]
  }
}
```

## Entry rationale-096

```json
{
  "entryId": "rationale-096",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_4935c2957b1a543bc51aca655db9ace8",
  "before": {
    "claimId": "claim_4935c2957b1a543bc51aca655db9ace8",
    "sourceUnitDigest": "4a5c768c8b9438de017920bbfff4fadf07117ea8b0ecf377e758c84a37f34aee",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:15-17#unheaded-block-3 (current lines); unit SHA256 4a5c768c8b9438de017920bbfff4fadf07117ea8b0ecf377e758c84a37f34aee.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:25-25#runtime-boundary (current lines); unit SHA256 f8385ed2cb5de50edcb94ffe904d7588554cb2649566206114fc835d4f9f2f7a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f8385ed2cb5de50edcb94ffe904d7588554cb2649566206114fc835d4f9f2f7a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Runtime Boundary\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-3 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#runtime-boundary; source context \"Master Multi-Agent Implementation Coordinator Prompt / Runtime Boundary\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "runtime-boundary",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (This is an engineering bootstrap and manual fallback pr...) against target section 'Runtime Boundary' (h2); 0 of 3 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f8385ed2cb5de50edcb94ffe904d7588554cb2649566206114fc835d4f9f2f7a",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_4935c2957b1a543bc51aca655db9ace8",
    "sourceUnitDigest": "4a5c768c8b9438de017920bbfff4fadf07117ea8b0ecf377e758c84a37f34aee",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:15-17#unheaded-block-3 (current lines); unit SHA256 4a5c768c8b9438de017920bbfff4fadf07117ea8b0ecf377e758c84a37f34aee.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:25-25#runtime-boundary (current lines); unit SHA256 f8385ed2cb5de50edcb94ffe904d7588554cb2649566206114fc835d4f9f2f7a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f8385ed2cb5de50edcb94ffe904d7588554cb2649566206114fc835d4f9f2f7a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Runtime Boundary\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 4 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-3 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#runtime-boundary; source context \"Master Multi-Agent Implementation Coordinator Prompt / Runtime Boundary\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "runtime-boundary",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "f8385ed2cb5de50edcb94ffe904d7588554cb2649566206114fc835d4f9f2f7a",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 95,
  "factsSHA256": "2a4b60b1eb61e3f74ff259834dfc7fda98882dfdac93b2b681d7354cb2ea6869",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 15,
    "endLine": 17,
    "textDigest": "4a5c768c8b9438de017920bbfff4fadf07117ea8b0ecf377e758c84a37f34aee",
    "sample": "This is an engineering bootstrap and manual fallback prompt. It is not loaded by\nagent-coordination runtime. Production coordination prose belongs in runtime\nSkills, TaskSpecs, and",
    "identityFingerprint": "d013f198cff6b545276f88ea4d5cf5cfe3d8749ba3f2b467bfab3ba7a0a09cfd",
    "ancestry": [
      "Master Multi-Agent Implementation Coordinator Prompt",
      "Runtime Boundary"
    ],
    "path": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Runtime Boundary",
    "anchor": "runtime-boundary",
    "githubAnchor": "runtime-boundary",
    "stableAnchor": "h-953209b5ed10",
    "startLine": 25,
    "endLine": 25,
    "textDigest": "f8385ed2cb5de50edcb94ffe904d7588554cb2649566206114fc835d4f9f2f7a",
    "sample": "Runtime Boundary",
    "sectionPayloadDigest": "55e7d15b35bcdb16c3441ca4bea594380b1649c55fbf3454c403d872c3487d33",
    "followingBlockDigest": "55e7d15b35bcdb16c3441ca4bea594380b1649c55fbf3454c403d872c3487d33",
    "identityFingerprint": "d090c66d6ccad6d3875f5cf7cda2395acb7ffda73a9ad457a752d0acea2642c9",
    "ancestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ],
    "path": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4935c2957b1a543bc51aca655db9ace8",
    "sourceUnitDigest": "4a5c768c8b9438de017920bbfff4fadf07117ea8b0ecf377e758c84a37f34aee",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:15-17#unheaded-block-3 (current lines); unit SHA256 4a5c768c8b9438de017920bbfff4fadf07117ea8b0ecf377e758c84a37f34aee.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:25-25#runtime-boundary (current lines); unit SHA256 f8385ed2cb5de50edcb94ffe904d7588554cb2649566206114fc835d4f9f2f7a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f8385ed2cb5de50edcb94ffe904d7588554cb2649566206114fc835d4f9f2f7a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Runtime Boundary\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 4 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-3 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#runtime-boundary; source context \"Master Multi-Agent Implementation Coordinator Prompt / Runtime Boundary\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "runtime-boundary",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "f8385ed2cb5de50edcb94ffe904d7588554cb2649566206114fc835d4f9f2f7a",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ]
  }
}
```

## Entry rationale-097

```json
{
  "entryId": "rationale-097",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_900031d284de0a2fa3c61714a76a97a4",
  "before": {
    "claimId": "claim_900031d284de0a2fa3c61714a76a97a4",
    "sourceUnitDigest": "25040073f2fdae7e1b9233bc360fb2a3ddb008b03a58988c3af012812f99539e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:547-563#unheaded-block-8 (current lines); unit SHA256 25040073f2fdae7e1b9233bc360fb2a3ddb008b03a58988c3af012812f99539e.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:545-545#what-the-user-pastes (current lines); unit SHA256 3a4aa45189ee5f75389f2c27398eb2050ad09baa7353dda167ebf4bdcc0fe149.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3a4aa45189ee5f75389f2c27398eb2050ad09baa7353dda167ebf4bdcc0fe149 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 8\" → \"What The User Pastes\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-8 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#what-the-user-pastes; source context \"Master Multi-Agent Implementation Coordinator Prompt / What The User Pastes\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "what-the-user-pastes",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block ('''text Read and follow docs/architect/agent-coordinati...) against target section 'What The User Pastes' (h2); 3 of 16 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3a4aa45189ee5f75389f2c27398eb2050ad09baa7353dda167ebf4bdcc0fe149",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_900031d284de0a2fa3c61714a76a97a4",
    "sourceUnitDigest": "25040073f2fdae7e1b9233bc360fb2a3ddb008b03a58988c3af012812f99539e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:547-563#unheaded-block-8 (current lines); unit SHA256 25040073f2fdae7e1b9233bc360fb2a3ddb008b03a58988c3af012812f99539e.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:545-545#what-the-user-pastes (current lines); unit SHA256 3a4aa45189ee5f75389f2c27398eb2050ad09baa7353dda167ebf4bdcc0fe149.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3a4aa45189ee5f75389f2c27398eb2050ad09baa7353dda167ebf4bdcc0fe149 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 8\" → \"What The User Pastes\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 14 removed and 15 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-8 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#what-the-user-pastes; source context \"Master Multi-Agent Implementation Coordinator Prompt / What The User Pastes\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "what-the-user-pastes",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "3a4aa45189ee5f75389f2c27398eb2050ad09baa7353dda167ebf4bdcc0fe149",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 96,
  "factsSHA256": "76ed8a6fd174bd46b5e6808a6af05bc375de44bd37f456fb84ff63b5963e9240",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-8",
    "githubAnchor": "unheaded-block-8",
    "stableAnchor": "unheaded-block-8",
    "title": "Unheaded block 8",
    "startLine": 547,
    "endLine": 563,
    "textDigest": "25040073f2fdae7e1b9233bc360fb2a3ddb008b03a58988c3af012812f99539e",
    "sample": "```text\nRead and follow docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md\n(the \"Master Prompt\" block) as the Master Implementation Coordinator.\n\nREPO_ROOT: ",
    "identityFingerprint": "d181593ea2bf56755a61cba6c3a37456893280c5dd3b9b2da8f9756fb640f507",
    "ancestry": [
      "Master Multi-Agent Implementation Coordinator Prompt",
      "What The User Pastes"
    ],
    "path": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "What The User Pastes",
    "anchor": "what-the-user-pastes",
    "githubAnchor": "what-the-user-pastes",
    "stableAnchor": "h-f717b4e86af1",
    "startLine": 545,
    "endLine": 545,
    "textDigest": "3a4aa45189ee5f75389f2c27398eb2050ad09baa7353dda167ebf4bdcc0fe149",
    "sample": "What The User Pastes",
    "sectionPayloadDigest": "b5da84b2a0f1b2aa6ec153baa6db669b8f5e0546dbedef832ad42d8baa684c7e",
    "followingBlockDigest": "538c1c018852c484702415cfe8ce954a90d03be6d740182234dfb1db0a75b888",
    "identityFingerprint": "0fa617f116fbbe69b95cf24bda42c57e77fc6a164784be4f51183e696ca88b0d",
    "ancestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ],
    "path": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_900031d284de0a2fa3c61714a76a97a4",
    "sourceUnitDigest": "25040073f2fdae7e1b9233bc360fb2a3ddb008b03a58988c3af012812f99539e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:547-563#unheaded-block-8 (current lines); unit SHA256 25040073f2fdae7e1b9233bc360fb2a3ddb008b03a58988c3af012812f99539e.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:545-545#what-the-user-pastes (current lines); unit SHA256 3a4aa45189ee5f75389f2c27398eb2050ad09baa7353dda167ebf4bdcc0fe149.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3a4aa45189ee5f75389f2c27398eb2050ad09baa7353dda167ebf4bdcc0fe149 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 8\" → \"What The User Pastes\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 14 removed and 15 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-8 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#what-the-user-pastes; source context \"Master Multi-Agent Implementation Coordinator Prompt / What The User Pastes\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "what-the-user-pastes",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "3a4aa45189ee5f75389f2c27398eb2050ad09baa7353dda167ebf4bdcc0fe149",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ]
  }
}
```

## Entry rationale-098

```json
{
  "entryId": "rationale-098",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_cba515c212c638d95887d49cb32e62fc",
  "before": {
    "claimId": "claim_cba515c212c638d95887d49cb32e62fc",
    "sourceUnitDigest": "bc786dfac01ce1995fcdd0238d9c8508f67a5fd5a36c6055fcf4333bd3cc4830",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:570-572#unheaded-block-10 (current lines); unit SHA256 bc786dfac01ce1995fcdd0238d9c8508f67a5fd5a36c6055fcf4333bd3cc4830.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:567-567#retirement (current lines); unit SHA256 d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 10\" → \"Retirement\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-10 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#retirement; source context \"Master Multi-Agent Implementation Coordinator Prompt / Retirement\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "retirement",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (When the runtime can natively execute this coordination...) against target section 'Retirement' (h2); 0 of 3 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_cba515c212c638d95887d49cb32e62fc",
    "sourceUnitDigest": "bc786dfac01ce1995fcdd0238d9c8508f67a5fd5a36c6055fcf4333bd3cc4830",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:570-572#unheaded-block-10 (current lines); unit SHA256 bc786dfac01ce1995fcdd0238d9c8508f67a5fd5a36c6055fcf4333bd3cc4830.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:567-567#retirement (current lines); unit SHA256 d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 10\" → \"Retirement\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 8 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-10 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#retirement; source context \"Master Multi-Agent Implementation Coordinator Prompt / Retirement\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "retirement",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 97,
  "factsSHA256": "c1d5c40a2e361e54ffbf5ab5f2d8d8939d3e35dded6901e044bf6a99660c1b24",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-10",
    "githubAnchor": "unheaded-block-10",
    "stableAnchor": "unheaded-block-10",
    "title": "Unheaded block 10",
    "startLine": 570,
    "endLine": 572,
    "textDigest": "bc786dfac01ce1995fcdd0238d9c8508f67a5fd5a36c6055fcf4333bd3cc4830",
    "sample": "When the runtime can natively execute this coordination protocol with validated\nSkills, TaskSpecs, configuration, Assignment, Run, and RunResult, this prompt is\nretained only as ma",
    "identityFingerprint": "c41e176349d2939f52f07d550cef1d0a922e0d76f345a310dbffba7b9c78e603",
    "ancestry": [
      "Master Multi-Agent Implementation Coordinator Prompt",
      "Retirement"
    ],
    "path": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Retirement",
    "anchor": "retirement",
    "githubAnchor": "retirement",
    "stableAnchor": "h-7c15ffbf672b",
    "startLine": 567,
    "endLine": 567,
    "textDigest": "d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242",
    "sample": "Retirement",
    "sectionPayloadDigest": "4c28669fd934f7b1489d66a97f48da6add88a877632344e0dad155ec3162e6b8",
    "followingBlockDigest": "4c28669fd934f7b1489d66a97f48da6add88a877632344e0dad155ec3162e6b8",
    "identityFingerprint": "12efe8572945b7188fdd8528f0762f7eb81538f44075558e56f6a7f06b80d84b",
    "ancestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ],
    "path": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_cba515c212c638d95887d49cb32e62fc",
    "sourceUnitDigest": "bc786dfac01ce1995fcdd0238d9c8508f67a5fd5a36c6055fcf4333bd3cc4830",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:570-572#unheaded-block-10 (current lines); unit SHA256 bc786dfac01ce1995fcdd0238d9c8508f67a5fd5a36c6055fcf4333bd3cc4830.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:567-567#retirement (current lines); unit SHA256 d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 10\" → \"Retirement\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 8 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-10 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#retirement; source context \"Master Multi-Agent Implementation Coordinator Prompt / Retirement\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "retirement",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ]
  }
}
```

## Entry rationale-099

```json
{
  "entryId": "rationale-099",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_2db9fc1b87055453a975a905935dc8fb",
  "before": {
    "claimId": "claim_2db9fc1b87055453a975a905935dc8fb",
    "sourceUnitDigest": "4973c00e0b5107083a7652929ed594952cf165d60c3dcdb48cebbaab477ef57e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:574-576#unheaded-block-11 (current lines); unit SHA256 4973c00e0b5107083a7652929ed594952cf165d60c3dcdb48cebbaab477ef57e.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:567-567#retirement (current lines); unit SHA256 d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 11\" → \"Retirement\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-11 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#retirement; source context \"Master Multi-Agent Implementation Coordinator Prompt / Retirement\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "retirement",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (For a Work-independent track, '.agents/skills/fgos-code...) against target section 'Retirement' (h2); 0 of 3 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_2db9fc1b87055453a975a905935dc8fb",
    "sourceUnitDigest": "4973c00e0b5107083a7652929ed594952cf165d60c3dcdb48cebbaab477ef57e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:574-576#unheaded-block-11 (current lines); unit SHA256 4973c00e0b5107083a7652929ed594952cf165d60c3dcdb48cebbaab477ef57e.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:567-567#retirement (current lines); unit SHA256 d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 11\" → \"Retirement\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 8 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-11 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#retirement; source context \"Master Multi-Agent Implementation Coordinator Prompt / Retirement\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "retirement",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 98,
  "factsSHA256": "d6d1f85bf7c6a4fa9aa9514f1fe158b881daeec1c6e922f8db5bf2f7ff3f0fbb",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-11",
    "githubAnchor": "unheaded-block-11",
    "stableAnchor": "unheaded-block-11",
    "title": "Unheaded block 11",
    "startLine": 574,
    "endLine": 576,
    "textDigest": "4973c00e0b5107083a7652929ed594952cf165d60c3dcdb48cebbaab477ef57e",
    "sample": "For a Work-independent track, `.agents/skills/fgos-code-change/SKILL.md`\n(plan mode, `references/plan-mode.md`) is the intended native path this\nprompt retires into.",
    "identityFingerprint": "d701dc3b2a0d26400b02289e28f95c83c57c6074bca0164ccb8689a7ad59d1f6",
    "ancestry": [
      "Master Multi-Agent Implementation Coordinator Prompt",
      "Retirement"
    ],
    "path": "docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Retirement",
    "anchor": "retirement",
    "githubAnchor": "retirement",
    "stableAnchor": "h-7c15ffbf672b",
    "startLine": 567,
    "endLine": 567,
    "textDigest": "d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242",
    "sample": "Retirement",
    "sectionPayloadDigest": "4c28669fd934f7b1489d66a97f48da6add88a877632344e0dad155ec3162e6b8",
    "followingBlockDigest": "4c28669fd934f7b1489d66a97f48da6add88a877632344e0dad155ec3162e6b8",
    "identityFingerprint": "12efe8572945b7188fdd8528f0762f7eb81538f44075558e56f6a7f06b80d84b",
    "ancestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ],
    "path": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2db9fc1b87055453a975a905935dc8fb",
    "sourceUnitDigest": "4973c00e0b5107083a7652929ed594952cf165d60c3dcdb48cebbaab477ef57e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:574-576#unheaded-block-11 (current lines); unit SHA256 4973c00e0b5107083a7652929ed594952cf165d60c3dcdb48cebbaab477ef57e.\nTarget: docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md:567-567#retirement (current lines); unit SHA256 d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 11\" → \"Retirement\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 8 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md#unheaded-block-11 under docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md#retirement; source context \"Master Multi-Agent Implementation Coordinator Prompt / Retirement\", target context \"Master Multi-Agent Implementation Coordinator Prompt\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/prompts/master-coordinator.md",
    "targetAnchor": "retirement",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "d9161cb44dc77910309258fbd90f976720e2bb2d5504bf783f443d6246ac3242",
    "targetAncestry": [
      "Master Multi-Agent Implementation Coordinator Prompt"
    ]
  }
}
```

## Entry rationale-100

```json
{
  "entryId": "rationale-100",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_ed1213dfe51bfed60c81bdcbe1443d04",
  "before": {
    "claimId": "claim_ed1213dfe51bfed60c81bdcbe1443d04",
    "sourceUnitDigest": "61a34ab58135d42ae1f46db2ad2843e3a047db990928cf7c6f458978468b3fee",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:15-28#unheaded-block-3 (current lines); unit SHA256 61a34ab58135d42ae1f46db2ad2843e3a047db990928cf7c6f458978468b3fee.\nTarget: docs/platform/agent-coordination/playbooks/README.md:32-32#playbooks (current lines); unit SHA256 a065ed396c7c6d949dca10b6b7868ba52a9ea1a3466681cb570e882ed65d47b7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a065ed396c7c6d949dca10b6b7868ba52a9ea1a3466681cb570e882ed65d47b7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 4, target 8; 6 changed spellings/labels, 2 destination changes; 4 added, 0 removed.\nLink 3: \"Step 07 Design Discussion Handoff\" (prompts/step-07-design-discussion-handoff.md) → \"Step 07 Design Discussion Handoff\" (../history/retired-engine/files/playbooks/prompts/step-07-design-discussion-handoff.md#literal-snapshot); resolved docs/architect/agent-coordination/playbooks/prompts/step-07-design-discussion-handoff.md → docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/step-07-design-discussion-handoff.md#literal-snapshot.\nLink 4: \"MVP6+ Dogfood Handoff\" (mvp6-dogfood-handoff.md) → \"MVP6+ Dogfood Handoff\" (../history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md#literal-snapshot); resolved docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md → docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md#literal-snapshot.\nLink 5: \"none\" (none) → \"coordinator companion\" (prompts/architecture-advisory-coordinator.md); resolved none → docs/platform/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md.\nLink 6: \"none\" (none) → \"role doctrine\" (architecture-advisory-role-doctrine.md); resolved none → docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md.\nLink 7: \"none\" (none) → \"artifact templates\" (architecture-advisory-artifact-templates.md); resolved none → docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md.\nLink 8: \"none\" (none) → \"quality rubric\" (architecture-advisory-evaluation-rubric.md); resolved none → docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Playbooks\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-3 under docs/platform/agent-coordination/playbooks/README.md#playbooks; source context \"Agent Coordination Playbooks / Playbooks\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "playbooks",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (- [Coordination Operating Harness](coordination-operati...) against target section 'Playbooks' (h2); 5 of 14 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (4/8) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e. hand-recomputed by independent python.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a065ed396c7c6d949dca10b6b7868ba52a9ea1a3466681cb570e882ed65d47b7",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_ed1213dfe51bfed60c81bdcbe1443d04",
    "sourceUnitDigest": "61a34ab58135d42ae1f46db2ad2843e3a047db990928cf7c6f458978468b3fee",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:15-28#unheaded-block-3 (current lines); unit SHA256 61a34ab58135d42ae1f46db2ad2843e3a047db990928cf7c6f458978468b3fee.\nTarget: docs/platform/agent-coordination/playbooks/README.md:32-32#playbooks (current lines); unit SHA256 a065ed396c7c6d949dca10b6b7868ba52a9ea1a3466681cb570e882ed65d47b7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a065ed396c7c6d949dca10b6b7868ba52a9ea1a3466681cb570e882ed65d47b7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 4, target 8; 6 changed spellings/labels, 2 destination changes; 4 added, 0 removed.\nLink 3: \"Step 07 Design Discussion Handoff\" (prompts/step-07-design-discussion-handoff.md) → \"Step 07 Design Discussion Handoff\" (../history/retired-engine/files/playbooks/prompts/step-07-design-discussion-handoff.md#literal-snapshot); resolved docs/architect/agent-coordination/playbooks/prompts/step-07-design-discussion-handoff.md → docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/step-07-design-discussion-handoff.md#literal-snapshot.\nLink 4: \"MVP6+ Dogfood Handoff\" (mvp6-dogfood-handoff.md) → \"MVP6+ Dogfood Handoff\" (../history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md#literal-snapshot); resolved docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md → docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md#literal-snapshot.\nLink 5: \"none\" (none) → \"coordinator companion\" (prompts/architecture-advisory-coordinator.md); resolved none → docs/platform/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md.\nLink 6: \"none\" (none) → \"role doctrine\" (architecture-advisory-role-doctrine.md); resolved none → docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md.\nLink 7: \"none\" (none) → \"artifact templates\" (architecture-advisory-artifact-templates.md); resolved none → docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md.\nLink 8: \"none\" (none) → \"quality rubric\" (architecture-advisory-evaluation-rubric.md); resolved none → docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Playbooks\".\nWhole direct section differs; depth block → 2; 6 distinct link changes; normalized line order differs; 9 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-3 under docs/platform/agent-coordination/playbooks/README.md#playbooks; source context \"Agent Coordination Playbooks / Playbooks\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "playbooks",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "a065ed396c7c6d949dca10b6b7868ba52a9ea1a3466681cb570e882ed65d47b7",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 99,
  "factsSHA256": "b430e26d9c1374bf3bbacd86c464530f0a6d5469e3c6cdf08b588bb8749c0ae6",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 15,
    "endLine": 28,
    "textDigest": "61a34ab58135d42ae1f46db2ad2843e3a047db990928cf7c6f458978468b3fee",
    "sample": "- [Coordination Operating Harness](coordination-operating-harness.md) defines\n  coordinator/doer/reviewer/red-team roles, current-cell artifacts, token\n  discipline, review gates, ",
    "identityFingerprint": "b13f6af05c8ab01ede5352a9322ab09146bde1ba097b7c49cb1df2a20561903d",
    "ancestry": [
      "Agent Coordination Playbooks",
      "Playbooks"
    ],
    "path": "docs/architect/agent-coordination/playbooks/README.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Playbooks",
    "anchor": "playbooks",
    "githubAnchor": "playbooks",
    "stableAnchor": "h-4071a9bd8302",
    "startLine": 32,
    "endLine": 32,
    "textDigest": "a065ed396c7c6d949dca10b6b7868ba52a9ea1a3466681cb570e882ed65d47b7",
    "sample": "Playbooks",
    "sectionPayloadDigest": "46c4e22810adb0ed33479100d607fed7c3c6a59da8a5172aa73ce95c2b1779ff",
    "followingBlockDigest": "e2a8129827af37fa0cd260764abb289a2f07e2b87fb41e1f80fd17b82bbc894b",
    "identityFingerprint": "fc72a6b1c82c15a93405bc393bc5598106226a4d868ef562768b317150a66b3d",
    "ancestry": [
      "Agent Coordination Playbooks"
    ],
    "path": "docs/platform/agent-coordination/playbooks/README.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ed1213dfe51bfed60c81bdcbe1443d04",
    "sourceUnitDigest": "61a34ab58135d42ae1f46db2ad2843e3a047db990928cf7c6f458978468b3fee",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:15-28#unheaded-block-3 (current lines); unit SHA256 61a34ab58135d42ae1f46db2ad2843e3a047db990928cf7c6f458978468b3fee.\nTarget: docs/platform/agent-coordination/playbooks/README.md:32-32#playbooks (current lines); unit SHA256 a065ed396c7c6d949dca10b6b7868ba52a9ea1a3466681cb570e882ed65d47b7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a065ed396c7c6d949dca10b6b7868ba52a9ea1a3466681cb570e882ed65d47b7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 4, target 8; 6 changed spellings/labels, 2 destination changes; 4 added, 0 removed.\nLink 3: \"Step 07 Design Discussion Handoff\" (prompts/step-07-design-discussion-handoff.md) → \"Step 07 Design Discussion Handoff\" (../history/retired-engine/files/playbooks/prompts/step-07-design-discussion-handoff.md#literal-snapshot); resolved docs/architect/agent-coordination/playbooks/prompts/step-07-design-discussion-handoff.md → docs/platform/agent-coordination/history/retired-engine/files/playbooks/prompts/step-07-design-discussion-handoff.md#literal-snapshot.\nLink 4: \"MVP6+ Dogfood Handoff\" (mvp6-dogfood-handoff.md) → \"MVP6+ Dogfood Handoff\" (../history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md#literal-snapshot); resolved docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md → docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md#literal-snapshot.\nLink 5: \"none\" (none) → \"coordinator companion\" (prompts/architecture-advisory-coordinator.md); resolved none → docs/platform/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md.\nLink 6: \"none\" (none) → \"role doctrine\" (architecture-advisory-role-doctrine.md); resolved none → docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md.\nLink 7: \"none\" (none) → \"artifact templates\" (architecture-advisory-artifact-templates.md); resolved none → docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md.\nLink 8: \"none\" (none) → \"quality rubric\" (architecture-advisory-evaluation-rubric.md); resolved none → docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Playbooks\".\nWhole direct section differs; depth block → 2; 6 distinct link changes; normalized line order differs; 9 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-3 under docs/platform/agent-coordination/playbooks/README.md#playbooks; source context \"Agent Coordination Playbooks / Playbooks\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "playbooks",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "a065ed396c7c6d949dca10b6b7868ba52a9ea1a3466681cb570e882ed65d47b7",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ]
  }
}
```

## Entry rationale-101

```json
{
  "entryId": "rationale-101",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_c98e7b899accefa155d580575c361434",
  "before": {
    "claimId": "claim_c98e7b899accefa155d580575c361434",
    "sourceUnitDigest": "415559d71a826737bfedf0f9c113418373aacb826fffef46be9ef822292c6e21",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:35-37#unheaded-block-5 (current lines); unit SHA256 415559d71a826737bfedf0f9c113418373aacb826fffef46be9ef822292c6e21.\nTarget: docs/platform/agent-coordination/playbooks/README.md:56-56#runtime-boundary (current lines); unit SHA256 e5309dab1d3f602eaa78654cc6ed34200d5fae638d97a0b157cfc8c15f2801e8.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e5309dab1d3f602eaa78654cc6ed34200d5fae638d97a0b157cfc8c15f2801e8 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 5\" → \"Runtime Boundary\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-5 under docs/platform/agent-coordination/playbooks/README.md#runtime-boundary; source context \"Agent Coordination Playbooks / Runtime Boundary\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "runtime-boundary",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (Nothing under this directory is a production dependency...) against target section 'Runtime Boundary' (h2); 0 of 3 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e5309dab1d3f602eaa78654cc6ed34200d5fae638d97a0b157cfc8c15f2801e8",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_c98e7b899accefa155d580575c361434",
    "sourceUnitDigest": "415559d71a826737bfedf0f9c113418373aacb826fffef46be9ef822292c6e21",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:35-37#unheaded-block-5 (current lines); unit SHA256 415559d71a826737bfedf0f9c113418373aacb826fffef46be9ef822292c6e21.\nTarget: docs/platform/agent-coordination/playbooks/README.md:56-56#runtime-boundary (current lines); unit SHA256 e5309dab1d3f602eaa78654cc6ed34200d5fae638d97a0b157cfc8c15f2801e8.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e5309dab1d3f602eaa78654cc6ed34200d5fae638d97a0b157cfc8c15f2801e8 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 5\" → \"Runtime Boundary\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 18 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-5 under docs/platform/agent-coordination/playbooks/README.md#runtime-boundary; source context \"Agent Coordination Playbooks / Runtime Boundary\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "runtime-boundary",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e5309dab1d3f602eaa78654cc6ed34200d5fae638d97a0b157cfc8c15f2801e8",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 100,
  "factsSHA256": "3cd11bd967e056a13f6b52d4bdcd205fc97f29f81ca7c248769d1b3f86ea3f04",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 35,
    "endLine": 37,
    "textDigest": "415559d71a826737bfedf0f9c113418373aacb826fffef46be9ef822292c6e21",
    "sample": "Nothing under this directory is a production dependency of agent coordination.\nRuntime code, workflow/protocol configuration, Skills, and TaskSpecs must not\nload or reference these",
    "identityFingerprint": "403863412cf804494de6ed25251d8446cc61ad1dffed66756755f55d7f176414",
    "ancestry": [
      "Agent Coordination Playbooks",
      "Runtime Boundary"
    ],
    "path": "docs/architect/agent-coordination/playbooks/README.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Runtime Boundary",
    "anchor": "runtime-boundary",
    "githubAnchor": "runtime-boundary",
    "stableAnchor": "h-ba7bda8530c6",
    "startLine": 56,
    "endLine": 56,
    "textDigest": "e5309dab1d3f602eaa78654cc6ed34200d5fae638d97a0b157cfc8c15f2801e8",
    "sample": "Runtime Boundary",
    "sectionPayloadDigest": "cbc8ab3555af2fc42ffa048344d7633062dfbcb41b5fa76bd7ec646ccf718347",
    "followingBlockDigest": "b8060e6b532eb7d328f059d88d7bc2075965b4e7c40886e957fa257c5f529bd9",
    "identityFingerprint": "8d3a8bd883de4905f3c9dea950c2e903cefb6aaa88f43be5cd62da55fd592147",
    "ancestry": [
      "Agent Coordination Playbooks"
    ],
    "path": "docs/platform/agent-coordination/playbooks/README.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c98e7b899accefa155d580575c361434",
    "sourceUnitDigest": "415559d71a826737bfedf0f9c113418373aacb826fffef46be9ef822292c6e21",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:35-37#unheaded-block-5 (current lines); unit SHA256 415559d71a826737bfedf0f9c113418373aacb826fffef46be9ef822292c6e21.\nTarget: docs/platform/agent-coordination/playbooks/README.md:56-56#runtime-boundary (current lines); unit SHA256 e5309dab1d3f602eaa78654cc6ed34200d5fae638d97a0b157cfc8c15f2801e8.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e5309dab1d3f602eaa78654cc6ed34200d5fae638d97a0b157cfc8c15f2801e8 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 5\" → \"Runtime Boundary\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 18 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-5 under docs/platform/agent-coordination/playbooks/README.md#runtime-boundary; source context \"Agent Coordination Playbooks / Runtime Boundary\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "runtime-boundary",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e5309dab1d3f602eaa78654cc6ed34200d5fae638d97a0b157cfc8c15f2801e8",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ]
  }
}
```

## Entry rationale-102

```json
{
  "entryId": "rationale-102",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_991e0c1c88b8462898e78bb01f76db66",
  "before": {
    "claimId": "claim_991e0c1c88b8462898e78bb01f76db66",
    "sourceUnitDigest": "ce790c85d7974d64819747be74e92b24ac78e0ac8ff16038616b7c6fc7682557",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:66-68#unheaded-block-11 (current lines); unit SHA256 ce790c85d7974d64819747be74e92b24ac78e0ac8ff16038616b7c6fc7682557.\nTarget: docs/platform/agent-coordination/playbooks/README.md:79-79#bootstrap-role (current lines); unit SHA256 9766b12cea12d08ac018648885169af8ebf201624919d05283b006db5f25270f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9766b12cea12d08ac018648885169af8ebf201624919d05283b006db5f25270f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 11\" → \"Bootstrap Role\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-11 under docs/platform/agent-coordination/playbooks/README.md#bootstrap-role; source context \"Agent Coordination Playbooks / Bootstrap Role\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "bootstrap-role",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (This is useful while the CoordinationSession/AdhocTask/...) against target section 'Bootstrap Role' (h2); 0 of 3 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9766b12cea12d08ac018648885169af8ebf201624919d05283b006db5f25270f",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_991e0c1c88b8462898e78bb01f76db66",
    "sourceUnitDigest": "ce790c85d7974d64819747be74e92b24ac78e0ac8ff16038616b7c6fc7682557",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:66-68#unheaded-block-11 (current lines); unit SHA256 ce790c85d7974d64819747be74e92b24ac78e0ac8ff16038616b7c6fc7682557.\nTarget: docs/platform/agent-coordination/playbooks/README.md:79-79#bootstrap-role (current lines); unit SHA256 9766b12cea12d08ac018648885169af8ebf201624919d05283b006db5f25270f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9766b12cea12d08ac018648885169af8ebf201624919d05283b006db5f25270f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 11\" → \"Bootstrap Role\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 13 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-11 under docs/platform/agent-coordination/playbooks/README.md#bootstrap-role; source context \"Agent Coordination Playbooks / Bootstrap Role\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "bootstrap-role",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "9766b12cea12d08ac018648885169af8ebf201624919d05283b006db5f25270f",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 101,
  "factsSHA256": "cfc79462b82fbe9be0b741ee57d631a88579c74179245a4100132ad3c7e4f1fc",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-11",
    "githubAnchor": "unheaded-block-11",
    "stableAnchor": "unheaded-block-11",
    "title": "Unheaded block 11",
    "startLine": 66,
    "endLine": 68,
    "textDigest": "ce790c85d7974d64819747be74e92b24ac78e0ac8ff16038616b7c6fc7682557",
    "sample": "This is useful while the CoordinationSession/AdhocTask/protocol runtime is not\ncapable of orchestrating the same process itself. It may also remain useful as\na manual recovery/debu",
    "identityFingerprint": "42cdaefc5f7555f2309829fa4e693653e99a3a41b7985066a3ee0fa45b014d62",
    "ancestry": [
      "Agent Coordination Playbooks",
      "Bootstrap Role"
    ],
    "path": "docs/architect/agent-coordination/playbooks/README.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Bootstrap Role",
    "anchor": "bootstrap-role",
    "githubAnchor": "bootstrap-role",
    "stableAnchor": "h-ee7e12568976",
    "startLine": 79,
    "endLine": 79,
    "textDigest": "9766b12cea12d08ac018648885169af8ebf201624919d05283b006db5f25270f",
    "sample": "Bootstrap Role",
    "sectionPayloadDigest": "0a9b0a77e8c6eab159701fd8806248cd40f6ec8894c08c4a2e793b9a56db107e",
    "followingBlockDigest": "5d3bd4a56d6609337fa851148cdd02f7f1d5cea225ea7acb59d3ba5db20480c3",
    "identityFingerprint": "fbe878b5ef36eef0555d5c83352c99739ba574934484e1cab10cfee6075c9038",
    "ancestry": [
      "Agent Coordination Playbooks"
    ],
    "path": "docs/platform/agent-coordination/playbooks/README.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_991e0c1c88b8462898e78bb01f76db66",
    "sourceUnitDigest": "ce790c85d7974d64819747be74e92b24ac78e0ac8ff16038616b7c6fc7682557",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:66-68#unheaded-block-11 (current lines); unit SHA256 ce790c85d7974d64819747be74e92b24ac78e0ac8ff16038616b7c6fc7682557.\nTarget: docs/platform/agent-coordination/playbooks/README.md:79-79#bootstrap-role (current lines); unit SHA256 9766b12cea12d08ac018648885169af8ebf201624919d05283b006db5f25270f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9766b12cea12d08ac018648885169af8ebf201624919d05283b006db5f25270f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 11\" → \"Bootstrap Role\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 13 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-11 under docs/platform/agent-coordination/playbooks/README.md#bootstrap-role; source context \"Agent Coordination Playbooks / Bootstrap Role\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "bootstrap-role",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "9766b12cea12d08ac018648885169af8ebf201624919d05283b006db5f25270f",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ]
  }
}
```

## Entry rationale-103

```json
{
  "entryId": "rationale-103",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_1f01c1021b0aa8f2a699899c7343b85d",
  "before": {
    "claimId": "claim_1f01c1021b0aa8f2a699899c7343b85d",
    "sourceUnitDigest": "b0c18cfc0ac5e1325d67adb8913a4a941a34c089ac56b06ef5d94d74862ac97f",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:72-72#unheaded-block-12 (current lines); unit SHA256 b0c18cfc0ac5e1325d67adb8913a4a941a34c089ac56b06ef5d94d74862ac97f.\nTarget: docs/platform/agent-coordination/playbooks/README.md:96-96#end-state-lifecycle (current lines); unit SHA256 c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 12\" → \"End-State Lifecycle\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-12 under docs/platform/agent-coordination/playbooks/README.md#end-state-lifecycle; source context \"Agent Coordination Playbooks / End-State Lifecycle\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "end-state-lifecycle",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (After runtime coordination is implemented and verified:...) against target section 'End-State Lifecycle' (h2); 0 of 1 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_1f01c1021b0aa8f2a699899c7343b85d",
    "sourceUnitDigest": "b0c18cfc0ac5e1325d67adb8913a4a941a34c089ac56b06ef5d94d74862ac97f",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:72-72#unheaded-block-12 (current lines); unit SHA256 b0c18cfc0ac5e1325d67adb8913a4a941a34c089ac56b06ef5d94d74862ac97f.\nTarget: docs/platform/agent-coordination/playbooks/README.md:96-96#end-state-lifecycle (current lines); unit SHA256 c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 12\" → \"End-State Lifecycle\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 1 removed and 11 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-12 under docs/platform/agent-coordination/playbooks/README.md#end-state-lifecycle; source context \"Agent Coordination Playbooks / End-State Lifecycle\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "end-state-lifecycle",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 102,
  "factsSHA256": "fbc5cf4c8401beec1ffdb525c464f2d073db1fe1c0f77fca9d5a3d10794f4fd6",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-12",
    "githubAnchor": "unheaded-block-12",
    "stableAnchor": "unheaded-block-12",
    "title": "Unheaded block 12",
    "startLine": 72,
    "endLine": 72,
    "textDigest": "b0c18cfc0ac5e1325d67adb8913a4a941a34c089ac56b06ef5d94d74862ac97f",
    "sample": "After runtime coordination is implemented and verified:",
    "identityFingerprint": "769bf9e23297e68d075a553a1dbe2ae41ce96733be260766ae77394cec1a6929",
    "ancestry": [
      "Agent Coordination Playbooks",
      "End-State Lifecycle"
    ],
    "path": "docs/architect/agent-coordination/playbooks/README.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "End-State Lifecycle",
    "anchor": "end-state-lifecycle",
    "githubAnchor": "end-state-lifecycle",
    "stableAnchor": "h-8030d2034049",
    "startLine": 96,
    "endLine": 96,
    "textDigest": "c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801",
    "sample": "End-State Lifecycle",
    "sectionPayloadDigest": "17b8ed5a0bb371905808564fa85936db6d4c85242f1811f0fd0190ae87167ecc",
    "followingBlockDigest": "b3940e7e61178482c6173086b35e3601d35b66e0009501d5195b027df2b10158",
    "identityFingerprint": "85983754599de3fed17f467946c1fd876ea9ef83420eb1123a8d5f3f4af6b6bd",
    "ancestry": [
      "Agent Coordination Playbooks"
    ],
    "path": "docs/platform/agent-coordination/playbooks/README.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1f01c1021b0aa8f2a699899c7343b85d",
    "sourceUnitDigest": "b0c18cfc0ac5e1325d67adb8913a4a941a34c089ac56b06ef5d94d74862ac97f",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:72-72#unheaded-block-12 (current lines); unit SHA256 b0c18cfc0ac5e1325d67adb8913a4a941a34c089ac56b06ef5d94d74862ac97f.\nTarget: docs/platform/agent-coordination/playbooks/README.md:96-96#end-state-lifecycle (current lines); unit SHA256 c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 12\" → \"End-State Lifecycle\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 1 removed and 11 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-12 under docs/platform/agent-coordination/playbooks/README.md#end-state-lifecycle; source context \"Agent Coordination Playbooks / End-State Lifecycle\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "end-state-lifecycle",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ]
  }
}
```

## Entry rationale-104

```json
{
  "entryId": "rationale-104",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_082a27b78d245b00b72bcb23390423ec",
  "before": {
    "claimId": "claim_082a27b78d245b00b72bcb23390423ec",
    "sourceUnitDigest": "3af67ec32f4ec720cdcf78626c614e6a2004cbec6c6e6e0acfa037fe63429a83",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:74-81#unheaded-block-13 (current lines); unit SHA256 3af67ec32f4ec720cdcf78626c614e6a2004cbec6c6e6e0acfa037fe63429a83.\nTarget: docs/platform/agent-coordination/playbooks/README.md:96-96#end-state-lifecycle (current lines); unit SHA256 c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 13\" → \"End-State Lifecycle\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-13 under docs/platform/agent-coordination/playbooks/README.md#end-state-lifecycle; source context \"Agent Coordination Playbooks / End-State Lifecycle\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "end-state-lifecycle",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (- normal use goes through code, protocol/workflow confi...) against target section 'End-State Lifecycle' (h2); 0 of 8 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_082a27b78d245b00b72bcb23390423ec",
    "sourceUnitDigest": "3af67ec32f4ec720cdcf78626c614e6a2004cbec6c6e6e0acfa037fe63429a83",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:74-81#unheaded-block-13 (current lines); unit SHA256 3af67ec32f4ec720cdcf78626c614e6a2004cbec6c6e6e0acfa037fe63429a83.\nTarget: docs/platform/agent-coordination/playbooks/README.md:96-96#end-state-lifecycle (current lines); unit SHA256 c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 13\" → \"End-State Lifecycle\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 8 removed and 11 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-13 under docs/platform/agent-coordination/playbooks/README.md#end-state-lifecycle; source context \"Agent Coordination Playbooks / End-State Lifecycle\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "end-state-lifecycle",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 103,
  "factsSHA256": "db2572edbc4c1d488bdc94a7d11fac3bf0bde92a5fbf9644d7f7bbb68deeef07",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-13",
    "githubAnchor": "unheaded-block-13",
    "stableAnchor": "unheaded-block-13",
    "title": "Unheaded block 13",
    "startLine": 74,
    "endLine": 81,
    "textDigest": "3af67ec32f4ec720cdcf78626c614e6a2004cbec6c6e6e0acfa037fe63429a83",
    "sample": "- normal use goes through code, protocol/workflow config, Skills, and TaskSpecs;\n- `playbooks/prompts/` is not read during execution;\n- deleting or archiving the playbook must not ",
    "identityFingerprint": "fccd7ba876beb627749f7710bfbcc66a4e60f1e4a326d3c6959c0a1e3c3ac3ee",
    "ancestry": [
      "Agent Coordination Playbooks",
      "End-State Lifecycle"
    ],
    "path": "docs/architect/agent-coordination/playbooks/README.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "End-State Lifecycle",
    "anchor": "end-state-lifecycle",
    "githubAnchor": "end-state-lifecycle",
    "stableAnchor": "h-8030d2034049",
    "startLine": 96,
    "endLine": 96,
    "textDigest": "c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801",
    "sample": "End-State Lifecycle",
    "sectionPayloadDigest": "17b8ed5a0bb371905808564fa85936db6d4c85242f1811f0fd0190ae87167ecc",
    "followingBlockDigest": "b3940e7e61178482c6173086b35e3601d35b66e0009501d5195b027df2b10158",
    "identityFingerprint": "85983754599de3fed17f467946c1fd876ea9ef83420eb1123a8d5f3f4af6b6bd",
    "ancestry": [
      "Agent Coordination Playbooks"
    ],
    "path": "docs/platform/agent-coordination/playbooks/README.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_082a27b78d245b00b72bcb23390423ec",
    "sourceUnitDigest": "3af67ec32f4ec720cdcf78626c614e6a2004cbec6c6e6e0acfa037fe63429a83",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/README.md:74-81#unheaded-block-13 (current lines); unit SHA256 3af67ec32f4ec720cdcf78626c614e6a2004cbec6c6e6e0acfa037fe63429a83.\nTarget: docs/platform/agent-coordination/playbooks/README.md:96-96#end-state-lifecycle (current lines); unit SHA256 c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 13\" → \"End-State Lifecycle\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 8 removed and 11 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/README.md#unheaded-block-13 under docs/platform/agent-coordination/playbooks/README.md#end-state-lifecycle; source context \"Agent Coordination Playbooks / End-State Lifecycle\", target context \"Agent Coordination Playbooks\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/playbooks/README.md",
    "targetAnchor": "end-state-lifecycle",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "c4ebe88030e242db064f1b41149ff58d5e4debfbaab8fdb1379fbfeaea99a801",
    "targetAncestry": [
      "Agent Coordination Playbooks"
    ]
  }
}
```

## Entry rationale-105

```json
{
  "entryId": "rationale-105",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_409096839603c2307eb5ccefb910e75a",
  "before": {
    "claimId": "claim_409096839603c2307eb5ccefb910e75a",
    "sourceUnitDigest": "d64ea076ae7f541e540612bc4825bc8eb6255f01ecbef2746a1e716c163bb547",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:129-136#unheaded-block-30 (current lines); unit SHA256 d64ea076ae7f541e540612bc4825bc8eb6255f01ecbef2746a1e716c163bb547.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:139-139#51-dispatch-roles (current lines); unit SHA256 ab19a37737adf5b31de084500694265eb799c44a04fff201d1d53c3e3facac38.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ab19a37737adf5b31de084500694265eb799c44a04fff201d1d53c3e3facac38 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 30\" → \"5.1 Dispatch Roles\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-30 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#51-dispatch-roles; source context \"Dispatch Control Plane Redesign / 5. Vocabulary / 5.1 Dispatch Roles\", target context \"Dispatch Control Plane Redesign / 5. Vocabulary\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "51-dispatch-roles",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (- 'launcher' - starts a work item or dispatch target an...) against target section '5.1 Dispatch Roles' (h3); 7 of 8 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 947f6169e.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ab19a37737adf5b31de084500694265eb799c44a04fff201d1d53c3e3facac38",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "5. Vocabulary"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_409096839603c2307eb5ccefb910e75a",
    "sourceUnitDigest": "d64ea076ae7f541e540612bc4825bc8eb6255f01ecbef2746a1e716c163bb547",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:129-136#unheaded-block-30 (current lines); unit SHA256 d64ea076ae7f541e540612bc4825bc8eb6255f01ecbef2746a1e716c163bb547.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:139-139#51-dispatch-roles (current lines); unit SHA256 ab19a37737adf5b31de084500694265eb799c44a04fff201d1d53c3e3facac38.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ab19a37737adf5b31de084500694265eb799c44a04fff201d1d53c3e3facac38 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 30\" → \"5.1 Dispatch Roles\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 3 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-30 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#51-dispatch-roles; source context \"Dispatch Control Plane Redesign / 5. Vocabulary / 5.1 Dispatch Roles\", target context \"Dispatch Control Plane Redesign / 5. Vocabulary\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "51-dispatch-roles",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "ab19a37737adf5b31de084500694265eb799c44a04fff201d1d53c3e3facac38",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "5. Vocabulary"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 104,
  "factsSHA256": "a410786e2078588dbb1b3afe45180fbec805aacb3a649e52cde9e2b1be0418ce",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-30",
    "githubAnchor": "unheaded-block-30",
    "stableAnchor": "unheaded-block-30",
    "title": "Unheaded block 30",
    "startLine": 129,
    "endLine": 136,
    "textDigest": "d64ea076ae7f541e540612bc4825bc8eb6255f01ecbef2746a1e716c163bb547",
    "sample": "- `launcher` - starts a work item or dispatch target and may step away.\n- `driver` - stays attached and continues coordinating after activation.\n- `orchestrator` - T0 composition l",
    "identityFingerprint": "95fe3b88b60acd2b3e951c4bc242ca7f48b5ffd0935f9f9644ce48995c323f30",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "5. Vocabulary",
      "5.1 Dispatch Roles"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "5.1 Dispatch Roles",
    "anchor": "51-dispatch-roles",
    "githubAnchor": "51-dispatch-roles",
    "stableAnchor": "h-33ffea79368b",
    "startLine": 139,
    "endLine": 139,
    "textDigest": "ab19a37737adf5b31de084500694265eb799c44a04fff201d1d53c3e3facac38",
    "sample": "5.1 Dispatch Roles",
    "sectionPayloadDigest": "533b8e62531e970b38e034ddf1be8d4bd99a63bd300e1470107d958818f8e508",
    "followingBlockDigest": "2a48dc33bd852834a280a5d5faa748be04281c3bbdb0dd684176182c4eb7a163",
    "identityFingerprint": "0394c2658d4cf8150a96e2ff61562bdd1f26f63c4d15ef6625e806bffecc6fdd",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "5. Vocabulary"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_409096839603c2307eb5ccefb910e75a",
    "sourceUnitDigest": "d64ea076ae7f541e540612bc4825bc8eb6255f01ecbef2746a1e716c163bb547",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:129-136#unheaded-block-30 (current lines); unit SHA256 d64ea076ae7f541e540612bc4825bc8eb6255f01ecbef2746a1e716c163bb547.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:139-139#51-dispatch-roles (current lines); unit SHA256 ab19a37737adf5b31de084500694265eb799c44a04fff201d1d53c3e3facac38.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ab19a37737adf5b31de084500694265eb799c44a04fff201d1d53c3e3facac38 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 30\" → \"5.1 Dispatch Roles\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 3 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-30 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#51-dispatch-roles; source context \"Dispatch Control Plane Redesign / 5. Vocabulary / 5.1 Dispatch Roles\", target context \"Dispatch Control Plane Redesign / 5. Vocabulary\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "51-dispatch-roles",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "ab19a37737adf5b31de084500694265eb799c44a04fff201d1d53c3e3facac38",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "5. Vocabulary"
    ]
  }
}
```

## Entry rationale-106

```json
{
  "entryId": "rationale-106",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_26f70ff6e280d95c6a2de80057d12198",
  "before": {
    "claimId": "claim_26f70ff6e280d95c6a2de80057d12198",
    "sourceUnitDigest": "5bae5d791db2919b0a4fdc54d9f9898c87d35c97618c125cb64d05827ffb1075",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:160-194#unheaded-block-38 (current lines); unit SHA256 5bae5d791db2919b0a4fdc54d9f9898c87d35c97618c125cb64d05827ffb1075.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:170-170#61-shape (current lines); unit SHA256 eccd334eee40b5d3dea247a74c141453af4ff788f6bee3e9d9c8d08bd5000343.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest eccd334eee40b5d3dea247a74c141453af4ff788f6bee3e9d9c8d08bd5000343 at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 38\" → \"6.1 Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-38 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#61-shape; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.1 Shape\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "61-shape",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-38 -> proposals/dispatch-control-plane-redesign.md#61-shape (supersede): Old illustrative JSON (target, handback, execution, egress.allowed) is correctly retired; the replacement field list equals the object returned at plan.mjs:444-461."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "reviewNote": "deep: supersede dispatch-control-plane-redesign.md:160-194#unheaded-block-38@pin -> dispatch-control-plane-redesign.md:170-170#61-shape; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 0/0/0/0/0/0 recomputed independently and equal; 0 correction line(s) checked (after-text in target); 1 residual text hunk(s) beyond links/corrections, which the successor-text sentence discloses; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-10-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "eccd334eee40b5d3dea247a74c141453af4ff788f6bee3e9d9c8d08bd5000343",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_26f70ff6e280d95c6a2de80057d12198",
    "sourceUnitDigest": "5bae5d791db2919b0a4fdc54d9f9898c87d35c97618c125cb64d05827ffb1075",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:160-194#unheaded-block-38 (current lines); unit SHA256 5bae5d791db2919b0a4fdc54d9f9898c87d35c97618c125cb64d05827ffb1075.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:170-170#61-shape (current lines); unit SHA256 eccd334eee40b5d3dea247a74c141453af4ff788f6bee3e9d9c8d08bd5000343.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest eccd334eee40b5d3dea247a74c141453af4ff788f6bee3e9d9c8d08bd5000343 at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 38\" → \"6.1 Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 35 removed and 10 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-38 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#61-shape; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.1 Shape\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "61-shape",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-38 -> proposals/dispatch-control-plane-redesign.md#61-shape (supersede): Old illustrative JSON (target, handback, execution, egress.allowed) is correctly retired; the replacement field list equals the object returned at plan.mjs:444-461."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "targetUnitDigest": "eccd334eee40b5d3dea247a74c141453af4ff788f6bee3e9d9c8d08bd5000343",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 105,
  "factsSHA256": "591da1f5f9ca7b4f1b0464c3f7e1c79673c98d42bf4d3f01f51b2256ffd7e992",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-38",
    "githubAnchor": "unheaded-block-38",
    "stableAnchor": "unheaded-block-38",
    "title": "Unheaded block 38",
    "startLine": 160,
    "endLine": 194,
    "textDigest": "5bae5d791db2919b0a4fdc54d9f9898c87d35c97618c125cb64d05827ffb1075",
    "sample": "```json\n{\n  \"selector\": {\n    \"type\": \"work\",\n    \"value\": \"tsk-123\"\n  },\n  \"target\": {\n    \"capability\": \"fgos-coding-implement\",\n    \"executorId\": \"agy\",\n    \"kind\": \"agent\"\n  },",
    "identityFingerprint": "618cc14d72c69e33692fed3ce41f049ac22369a7e4ed06002c3103fc9c41a888",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan",
      "6.1 Shape"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "6.1 Shape",
    "anchor": "61-shape",
    "githubAnchor": "61-shape",
    "stableAnchor": "h-beae83bbab57",
    "startLine": 170,
    "endLine": 170,
    "textDigest": "eccd334eee40b5d3dea247a74c141453af4ff788f6bee3e9d9c8d08bd5000343",
    "sample": "6.1 Shape",
    "sectionPayloadDigest": "5c8397b1fe23e4b7e96a5eafc04b1f197a96def4421e400a01039806a9bd3e6a",
    "followingBlockDigest": "8bb122f565c4d0f699793e476fde329f81c045340d35c03b49952e2263f052d3",
    "identityFingerprint": "3f1d41b70e223cf6fdcc9a20bff3d000610259c7e2d377b5b684b3f2262556fa",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_26f70ff6e280d95c6a2de80057d12198",
    "sourceUnitDigest": "5bae5d791db2919b0a4fdc54d9f9898c87d35c97618c125cb64d05827ffb1075",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:160-194#unheaded-block-38 (current lines); unit SHA256 5bae5d791db2919b0a4fdc54d9f9898c87d35c97618c125cb64d05827ffb1075.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:170-170#61-shape (current lines); unit SHA256 eccd334eee40b5d3dea247a74c141453af4ff788f6bee3e9d9c8d08bd5000343.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest eccd334eee40b5d3dea247a74c141453af4ff788f6bee3e9d9c8d08bd5000343 at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 38\" → \"6.1 Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 35 removed and 10 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-38 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#61-shape; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.1 Shape\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "61-shape",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-38 -> proposals/dispatch-control-plane-redesign.md#61-shape (supersede): Old illustrative JSON (target, handback, execution, egress.allowed) is correctly retired; the replacement field list equals the object returned at plan.mjs:444-461."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "targetUnitDigest": "eccd334eee40b5d3dea247a74c141453af4ff788f6bee3e9d9c8d08bd5000343",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ]
  }
}
```

## Entry rationale-107

```json
{
  "entryId": "rationale-107",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_28c4a9baff6ea75b287aa8dba3ed8328",
  "before": {
    "claimId": "claim_28c4a9baff6ea75b287aa8dba3ed8328",
    "sourceUnitDigest": "4bd5619af16c5af92c73c6d5a88ff22c8b1dfdde3298ba450703e150d2b83d7f",
    "claimKind": "decision",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-205#unheaded-block-41 (current lines); unit SHA256 4bd5619af16c5af92c73c6d5a88ff22c8b1dfdde3298ba450703e150d2b83d7f.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:183-183#62-selector (current lines); unit SHA256 f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 41\" → \"6.2 Selector\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-41 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.2 Selector\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "62-selector",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (- 'work' - dispatch decision for a lifecycle work item....) against target section '6.2 Selector' (h3); 4 of 4 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 9351a257f.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_28c4a9baff6ea75b287aa8dba3ed8328",
    "sourceUnitDigest": "4bd5619af16c5af92c73c6d5a88ff22c8b1dfdde3298ba450703e150d2b83d7f",
    "claimKind": "decision",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-205#unheaded-block-41 (current lines); unit SHA256 4bd5619af16c5af92c73c6d5a88ff22c8b1dfdde3298ba450703e150d2b83d7f.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:183-183#62-selector (current lines); unit SHA256 f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 41\" → \"6.2 Selector\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 0 removed and 9 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-41 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.2 Selector\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "62-selector",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 106,
  "factsSHA256": "268901cee374b8d977ce4e5db0c729cfdfe2c80ae3e075baea2a786bf41a71a7",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-41",
    "githubAnchor": "unheaded-block-41",
    "stableAnchor": "unheaded-block-41",
    "title": "Unheaded block 41",
    "startLine": 202,
    "endLine": 205,
    "textDigest": "4bd5619af16c5af92c73c6d5a88ff22c8b1dfdde3298ba450703e150d2b83d7f",
    "sample": "- `work` - dispatch decision for a lifecycle work item.\n- `purpose` - dispatch decision for a named capability/purpose.\n- `executor` - dispatch decision for a concrete executor id.",
    "identityFingerprint": "58a2feeca9a47eb11500e5eb2162ad5d635370b62a45b4611bb423db07b4cc9f",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan",
      "6.2 Selector"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "6.2 Selector",
    "anchor": "62-selector",
    "githubAnchor": "62-selector",
    "stableAnchor": "h-b4207c39a9c5",
    "startLine": 183,
    "endLine": 183,
    "textDigest": "f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a",
    "sample": "6.2 Selector",
    "sectionPayloadDigest": "bdbfe7ecb80ebe123d00f67b542127b807c805bb9acce0539afdd8ff58eeb8cd",
    "followingBlockDigest": "c4d02a1a171c508a616fca4a5ece62d9a4c7d26617cb1c4495eaeeed0a4b51cc",
    "identityFingerprint": "62ac6c5d08d112043e68c9046d13baf2de691ebd4126fc05f14500e65a1c247d",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_28c4a9baff6ea75b287aa8dba3ed8328",
    "sourceUnitDigest": "4bd5619af16c5af92c73c6d5a88ff22c8b1dfdde3298ba450703e150d2b83d7f",
    "claimKind": "decision",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-205#unheaded-block-41 (current lines); unit SHA256 4bd5619af16c5af92c73c6d5a88ff22c8b1dfdde3298ba450703e150d2b83d7f.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:183-183#62-selector (current lines); unit SHA256 f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 41\" → \"6.2 Selector\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 0 removed and 9 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-41 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#62-selector; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.2 Selector\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "62-selector",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "f74896a55ec95145a488a4d4f78d23c0498357b944441ca192f35ecb38247d3a",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ]
  }
}
```

## Entry rationale-108

```json
{
  "entryId": "rationale-108",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_7788ed260777142b9452d61228e1d1be",
  "before": {
    "claimId": "claim_7788ed260777142b9452d61228e1d1be",
    "sourceUnitDigest": "064779db227d18f5a360332d5f6d5a3cf1eccb3541b74c35c2f8808f5e6765bd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:222-222#unheaded-block-45 (current lines); unit SHA256 064779db227d18f5a360332d5f6d5a3cf1eccb3541b74c35c2f8808f5e6765bd.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-202#63-mechanism (current lines); unit SHA256 be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 45\" → \"6.3 Mechanism\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-45 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#63-mechanism; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.3 Mechanism\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "63-mechanism",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-45 -> proposals/dispatch-control-plane-redesign.md#63-mechanism (supersede): Old handback sentence retired: plan.mjs returns top-level agentType/mcpTool (lines 453-454) and no handback key."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "reviewNote": "deep: supersede dispatch-control-plane-redesign.md:222-222#unheaded-block-45@pin -> dispatch-control-plane-redesign.md:202-202#63-mechanism; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 0/0/0/0/0/0 recomputed independently and equal; 0 correction line(s) checked (after-text in target); 1 residual text hunk(s) beyond links/corrections, which the successor-text sentence discloses; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-10-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_7788ed260777142b9452d61228e1d1be",
    "sourceUnitDigest": "064779db227d18f5a360332d5f6d5a3cf1eccb3541b74c35c2f8808f5e6765bd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:222-222#unheaded-block-45 (current lines); unit SHA256 064779db227d18f5a360332d5f6d5a3cf1eccb3541b74c35c2f8808f5e6765bd.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-202#63-mechanism (current lines); unit SHA256 be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 45\" → \"6.3 Mechanism\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 9 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-45 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#63-mechanism; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.3 Mechanism\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "63-mechanism",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-45 -> proposals/dispatch-control-plane-redesign.md#63-mechanism (supersede): Old handback sentence retired: plan.mjs returns top-level agentType/mcpTool (lines 453-454) and no handback key."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "targetUnitDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 107,
  "factsSHA256": "0da85d28db3f9bdc8c0f34ebe5214de65c77218db95bc24da849a6ee9889d357",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-45",
    "githubAnchor": "unheaded-block-45",
    "stableAnchor": "unheaded-block-45",
    "title": "Unheaded block 45",
    "startLine": 222,
    "endLine": 222,
    "textDigest": "064779db227d18f5a360332d5f6d5a3cf1eccb3541b74c35c2f8808f5e6765bd",
    "sample": "For in-process dispatch, `handback` carries the concrete native surface:",
    "identityFingerprint": "bb66a8139aee63e1d4df005db9438f4254b3d5156ba1ce08b8eace5afb48f73f",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan",
      "6.3 Mechanism"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "6.3 Mechanism",
    "anchor": "63-mechanism",
    "githubAnchor": "63-mechanism",
    "stableAnchor": "h-55ed7f1dfd5f",
    "startLine": 202,
    "endLine": 202,
    "textDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "sample": "6.3 Mechanism",
    "sectionPayloadDigest": "6422cbd26445627c64b84300d9a4d1e1af3cd296c4d5aedf285f9be206b17849",
    "followingBlockDigest": "ffec517d5e97688875ffbf788a60d2570d8041fd4f68bc640b2924de5cb208a7",
    "identityFingerprint": "08bb5a772ed57bffa2093439f773efff4e3051f345c37cff9a70c3580aaf1154",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7788ed260777142b9452d61228e1d1be",
    "sourceUnitDigest": "064779db227d18f5a360332d5f6d5a3cf1eccb3541b74c35c2f8808f5e6765bd",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:222-222#unheaded-block-45 (current lines); unit SHA256 064779db227d18f5a360332d5f6d5a3cf1eccb3541b74c35c2f8808f5e6765bd.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-202#63-mechanism (current lines); unit SHA256 be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 45\" → \"6.3 Mechanism\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 9 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-45 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#63-mechanism; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.3 Mechanism\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "63-mechanism",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-45 -> proposals/dispatch-control-plane-redesign.md#63-mechanism (supersede): Old handback sentence retired: plan.mjs returns top-level agentType/mcpTool (lines 453-454) and no handback key."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "targetUnitDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ]
  }
}
```

## Entry rationale-109

```json
{
  "entryId": "rationale-109",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_cfd58d692d355e1d05a0babd4fbb2183",
  "before": {
    "claimId": "claim_cfd58d692d355e1d05a0babd4fbb2183",
    "sourceUnitDigest": "54aa679ca4d5d3f3fcb3ce80388c2ca8768fea36739b76d19f349ebcfc3b934e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:224-232#unheaded-block-46 (current lines); unit SHA256 54aa679ca4d5d3f3fcb3ce80388c2ca8768fea36739b76d19f349ebcfc3b934e.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-202#63-mechanism (current lines); unit SHA256 be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 46\" → \"6.3 Mechanism\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-46 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#63-mechanism; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.3 Mechanism\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "63-mechanism",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-46 -> proposals/dispatch-control-plane-redesign.md#63-mechanism (supersede): Old native-task handback JSON is retired in favor of top-level agentType in the returned plan (plan.mjs:453), which the current text states."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "reviewNote": "deep: supersede dispatch-control-plane-redesign.md:224-232#unheaded-block-46@pin -> dispatch-control-plane-redesign.md:202-202#63-mechanism; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 0/0/0/0/0/0 recomputed independently and equal; 0 correction line(s) checked (after-text in target); 1 residual text hunk(s) beyond links/corrections, which the successor-text sentence discloses; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-10-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_cfd58d692d355e1d05a0babd4fbb2183",
    "sourceUnitDigest": "54aa679ca4d5d3f3fcb3ce80388c2ca8768fea36739b76d19f349ebcfc3b934e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:224-232#unheaded-block-46 (current lines); unit SHA256 54aa679ca4d5d3f3fcb3ce80388c2ca8768fea36739b76d19f349ebcfc3b934e.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-202#63-mechanism (current lines); unit SHA256 be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 46\" → \"6.3 Mechanism\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 9 removed and 9 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-46 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#63-mechanism; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.3 Mechanism\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "63-mechanism",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-46 -> proposals/dispatch-control-plane-redesign.md#63-mechanism (supersede): Old native-task handback JSON is retired in favor of top-level agentType in the returned plan (plan.mjs:453), which the current text states."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "targetUnitDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 108,
  "factsSHA256": "f70dbd4ec0662491992c5ec35f61480dae4a69befef94132166d83894f44d3a2",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-46",
    "githubAnchor": "unheaded-block-46",
    "stableAnchor": "unheaded-block-46",
    "title": "Unheaded block 46",
    "startLine": 224,
    "endLine": 232,
    "textDigest": "54aa679ca4d5d3f3fcb3ce80388c2ca8768fea36739b76d19f349ebcfc3b934e",
    "sample": "```json\n{\n  \"mechanism\": \"in-process\",\n  \"handback\": {\n    \"type\": \"native-task\",\n    \"agentType\": \"fgos-coding-implement\"\n  }\n}\n```",
    "identityFingerprint": "73a4901f9eb6e847f3f326eb21547c18919f841d1a7770ad9d2ee1135c7efd77",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan",
      "6.3 Mechanism"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "6.3 Mechanism",
    "anchor": "63-mechanism",
    "githubAnchor": "63-mechanism",
    "stableAnchor": "h-55ed7f1dfd5f",
    "startLine": 202,
    "endLine": 202,
    "textDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "sample": "6.3 Mechanism",
    "sectionPayloadDigest": "6422cbd26445627c64b84300d9a4d1e1af3cd296c4d5aedf285f9be206b17849",
    "followingBlockDigest": "ffec517d5e97688875ffbf788a60d2570d8041fd4f68bc640b2924de5cb208a7",
    "identityFingerprint": "08bb5a772ed57bffa2093439f773efff4e3051f345c37cff9a70c3580aaf1154",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_cfd58d692d355e1d05a0babd4fbb2183",
    "sourceUnitDigest": "54aa679ca4d5d3f3fcb3ce80388c2ca8768fea36739b76d19f349ebcfc3b934e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:224-232#unheaded-block-46 (current lines); unit SHA256 54aa679ca4d5d3f3fcb3ce80388c2ca8768fea36739b76d19f349ebcfc3b934e.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-202#63-mechanism (current lines); unit SHA256 be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 46\" → \"6.3 Mechanism\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 9 removed and 9 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-46 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#63-mechanism; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.3 Mechanism\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "63-mechanism",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-46 -> proposals/dispatch-control-plane-redesign.md#63-mechanism (supersede): Old native-task handback JSON is retired in favor of top-level agentType in the returned plan (plan.mjs:453), which the current text states."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "targetUnitDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ]
  }
}
```

## Entry rationale-110

```json
{
  "entryId": "rationale-110",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_3213e2828273933006676b06c204ef11",
  "before": {
    "claimId": "claim_3213e2828273933006676b06c204ef11",
    "sourceUnitDigest": "9a8358da72c22b6c751b1820b9b0a1fce86275081af0b5d2f6d851ce285c844e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:234-244#unheaded-block-47 (current lines); unit SHA256 9a8358da72c22b6c751b1820b9b0a1fce86275081af0b5d2f6d851ce285c844e.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-202#63-mechanism (current lines); unit SHA256 be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 47\" → \"6.3 Mechanism\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-47 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#63-mechanism; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.3 Mechanism\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "63-mechanism",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-47 -> proposals/dispatch-control-plane-redesign.md#63-mechanism (supersede): Old mcp-tool handback JSON is retired in favor of top-level mcpTool (plan.mjs:454); cli.mjs decide output also reports mcpTool directly."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "reviewNote": "deep: supersede dispatch-control-plane-redesign.md:234-244#unheaded-block-47@pin -> dispatch-control-plane-redesign.md:202-202#63-mechanism; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 0/0/0/0/0/0 recomputed independently and equal; 0 correction line(s) checked (after-text in target); 2 residual text hunk(s) beyond links/corrections, which the successor-text sentence discloses; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-10-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_3213e2828273933006676b06c204ef11",
    "sourceUnitDigest": "9a8358da72c22b6c751b1820b9b0a1fce86275081af0b5d2f6d851ce285c844e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:234-244#unheaded-block-47 (current lines); unit SHA256 9a8358da72c22b6c751b1820b9b0a1fce86275081af0b5d2f6d851ce285c844e.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-202#63-mechanism (current lines); unit SHA256 be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 47\" → \"6.3 Mechanism\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 10 removed and 9 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-47 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#63-mechanism; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.3 Mechanism\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "63-mechanism",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-47 -> proposals/dispatch-control-plane-redesign.md#63-mechanism (supersede): Old mcp-tool handback JSON is retired in favor of top-level mcpTool (plan.mjs:454); cli.mjs decide output also reports mcpTool directly."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "targetUnitDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 109,
  "factsSHA256": "1491ddd1299fd1772a56dabd5285cfdc8b47db40d0985685b1c01fdbe1794843",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-47",
    "githubAnchor": "unheaded-block-47",
    "stableAnchor": "unheaded-block-47",
    "title": "Unheaded block 47",
    "startLine": 234,
    "endLine": 244,
    "textDigest": "9a8358da72c22b6c751b1820b9b0a1fce86275081af0b5d2f6d851ce285c844e",
    "sample": "or:\n\n```json\n{\n  \"mechanism\": \"in-process\",\n  \"handback\": {\n    \"type\": \"mcp-tool\",\n    \"tool\": \"mcp__gitnexus__impact\"\n  }\n}\n```",
    "identityFingerprint": "b345573e42708c50f26c9027b136280222aa266ba1e5761749e394fe8ee0885f",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan",
      "6.3 Mechanism"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "6.3 Mechanism",
    "anchor": "63-mechanism",
    "githubAnchor": "63-mechanism",
    "stableAnchor": "h-55ed7f1dfd5f",
    "startLine": 202,
    "endLine": 202,
    "textDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "sample": "6.3 Mechanism",
    "sectionPayloadDigest": "6422cbd26445627c64b84300d9a4d1e1af3cd296c4d5aedf285f9be206b17849",
    "followingBlockDigest": "ffec517d5e97688875ffbf788a60d2570d8041fd4f68bc640b2924de5cb208a7",
    "identityFingerprint": "08bb5a772ed57bffa2093439f773efff4e3051f345c37cff9a70c3580aaf1154",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_3213e2828273933006676b06c204ef11",
    "sourceUnitDigest": "9a8358da72c22b6c751b1820b9b0a1fce86275081af0b5d2f6d851ce285c844e",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:234-244#unheaded-block-47 (current lines); unit SHA256 9a8358da72c22b6c751b1820b9b0a1fce86275081af0b5d2f6d851ce285c844e.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:202-202#63-mechanism (current lines); unit SHA256 be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba at dfff335d3f620b49403e4e4b2f70cedee5ca0452.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 47\" → \"6.3 Mechanism\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 10 removed and 9 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-47 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#63-mechanism; source context \"Dispatch Control Plane Redesign / 6. DispatchPlan / 6.3 Mechanism\", target context \"Dispatch Control Plane Redesign / 6. DispatchPlan\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "63-mechanism",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "priorReview": {
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
      "reviewedAt": "2026-10-10",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-files.md",
      "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "reviewMode": "ordinary",
      "reviewNote": "LEG:proposals/dispatch-control-plane-redesign.md#unheaded-block-47 -> proposals/dispatch-control-plane-redesign.md#63-mechanism (supersede): Old mcp-tool handback JSON is retired in favor of top-level mcpTool (plan.mjs:454); cli.mjs decide output also reports mcpTool directly."
    },
    "amendedBy": "codex-session:42@2026-10-15",
    "rebindingReason": "A22 consequence of the authorized A19 path/line-number correction; current target bytes or section payload changed.",
    "targetUnitDigest": "be2f8b6fb6fddd1a9fdcbbcaf100e5d07acacec79f314e563786eb6034c4dbba",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "6. DispatchPlan"
    ]
  }
}
```

## Entry rationale-111

```json
{
  "entryId": "rationale-111",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_23a302d963323aa22a6a9e8ff35aad4e",
  "before": {
    "claimId": "claim_23a302d963323aa22a6a9e8ff35aad4e",
    "sourceUnitDigest": "9ef8c86adc6b48a1b019c1597695d4ec0f546ae79f52d4f819025bac1bcd464c",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:338-339#unheaded-block-65 (current lines); unit SHA256 9ef8c86adc6b48a1b019c1597695d4ec0f546ae79f52d4f819025bac1bcd464c.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:252-252#72-policy-resolution-before-dispatchplan (current lines); unit SHA256 1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0 at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 65\" → \"7.2 Policy Resolution Before DispatchPlan\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-65 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan; source context \"Dispatch Control Plane Redesign / 7. Governance And Egress / 7.2 Policy Resolution Before DispatchPlan\", target context \"Dispatch Control Plane Redesign / 7. Governance And Egress\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "72-policy-resolution-before-dispatchplan",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (The resulting 'DispatchPlan.execution' carries the conc...) against target section '7.2 Policy Resolution Before DispatchPlan' (h3); 1 of 2 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 9351a257f.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_23a302d963323aa22a6a9e8ff35aad4e",
    "sourceUnitDigest": "9ef8c86adc6b48a1b019c1597695d4ec0f546ae79f52d4f819025bac1bcd464c",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:338-339#unheaded-block-65 (current lines); unit SHA256 9ef8c86adc6b48a1b019c1597695d4ec0f546ae79f52d4f819025bac1bcd464c.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:252-252#72-policy-resolution-before-dispatchplan (current lines); unit SHA256 1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0 at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 65\" → \"7.2 Policy Resolution Before DispatchPlan\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 46 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-65 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan; source context \"Dispatch Control Plane Redesign / 7. Governance And Egress / 7.2 Policy Resolution Before DispatchPlan\", target context \"Dispatch Control Plane Redesign / 7. Governance And Egress\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "72-policy-resolution-before-dispatchplan",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 110,
  "factsSHA256": "27e935b8203748107b8eecf50f29a738e018fe5a9646c11657d4c8fc783a796b",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-65",
    "githubAnchor": "unheaded-block-65",
    "stableAnchor": "unheaded-block-65",
    "title": "Unheaded block 65",
    "startLine": 338,
    "endLine": 339,
    "textDigest": "9ef8c86adc6b48a1b019c1597695d4ec0f546ae79f52d4f819025bac1bcd464c",
    "sample": "The resulting `DispatchPlan.execution` carries the concrete model and adapter.\nThe workflow does not need to hardcode a provider to prove team coordination.",
    "identityFingerprint": "83b04d9954a997cbfb77e46ffaa2abf1048c73988c2379411821e76b3c9bef04",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress",
      "7.2 Policy Resolution Before DispatchPlan"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "7.2 Policy Resolution Before DispatchPlan",
    "anchor": "72-policy-resolution-before-dispatchplan",
    "githubAnchor": "72-policy-resolution-before-dispatchplan",
    "stableAnchor": "h-52665700ca26",
    "startLine": 252,
    "endLine": 252,
    "textDigest": "1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0",
    "sample": "7.2 Policy Resolution Before DispatchPlan",
    "sectionPayloadDigest": "469f2819b24c6f04875883367fc17cb0d3c0f70bc5f3f194580d4c7d0d1e80cf",
    "followingBlockDigest": "8576ac7ecaa8cf3f0c0d396a4961f20d131dc3de7f793bb9d28d9c26f65b5eef",
    "identityFingerprint": "212c79eb20ca674a150edf4c089be3b96c54486a0fe64aeee45e8b3b23239a06",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_23a302d963323aa22a6a9e8ff35aad4e",
    "sourceUnitDigest": "9ef8c86adc6b48a1b019c1597695d4ec0f546ae79f52d4f819025bac1bcd464c",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:338-339#unheaded-block-65 (current lines); unit SHA256 9ef8c86adc6b48a1b019c1597695d4ec0f546ae79f52d4f819025bac1bcd464c.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:252-252#72-policy-resolution-before-dispatchplan (current lines); unit SHA256 1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0 at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 65\" → \"7.2 Policy Resolution Before DispatchPlan\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 46 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-65 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#72-policy-resolution-before-dispatchplan; source context \"Dispatch Control Plane Redesign / 7. Governance And Egress / 7.2 Policy Resolution Before DispatchPlan\", target context \"Dispatch Control Plane Redesign / 7. Governance And Egress\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "72-policy-resolution-before-dispatchplan",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "1b8bad3a28b92a56bcefee746276e3cabf955f0361653f49b152dd5b720d5dd0",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ]
  }
}
```

## Entry rationale-112

```json
{
  "entryId": "rationale-112",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_03bcf93f2a1eb641d2b4681160a35ce8",
  "before": {
    "claimId": "claim_03bcf93f2a1eb641d2b4681160a35ce8",
    "sourceUnitDigest": "2412915baaeaf954feeedcf5626584850738338e31925686869b456a495cf773",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:346-355#unheaded-block-67 (current lines); unit SHA256 2412915baaeaf954feeedcf5626584850738338e31925686869b456a495cf773.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:310-310#73-recommended-v1-provider-policy-for-coding-feature-flow (current lines); unit SHA256 cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 67\" → \"7.3 Recommended V1 Provider Policy For Coding Feature Flow\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-67 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow; source context \"Dispatch Control Plane Redesign / 7. Governance And Egress / 7.3 Recommended V1 Provider Policy For Coding Feature Flow\", target context \"Dispatch Control Plane Redesign / 7. Governance And Egress\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "73-recommended-v1-provider-policy-for-coding-feature-flow",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (/ Stage / Operation / Preferred execution / Rationale /...) against target section '7.3 Recommended V1 Provider Policy For Coding Feature Flow' (h3); 9 of 10 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 9351a257f.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_03bcf93f2a1eb641d2b4681160a35ce8",
    "sourceUnitDigest": "2412915baaeaf954feeedcf5626584850738338e31925686869b456a495cf773",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:346-355#unheaded-block-67 (current lines); unit SHA256 2412915baaeaf954feeedcf5626584850738338e31925686869b456a495cf773.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:310-310#73-recommended-v1-provider-policy-for-coding-feature-flow (current lines); unit SHA256 cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 67\" → \"7.3 Recommended V1 Provider Policy For Coding Feature Flow\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 14 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-67 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow; source context \"Dispatch Control Plane Redesign / 7. Governance And Egress / 7.3 Recommended V1 Provider Policy For Coding Feature Flow\", target context \"Dispatch Control Plane Redesign / 7. Governance And Egress\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "73-recommended-v1-provider-policy-for-coding-feature-flow",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 111,
  "factsSHA256": "d5999cce60414678946eaa56866cd6c9e565882e07ec15fb7fd8ed9f16638d76",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-67",
    "githubAnchor": "unheaded-block-67",
    "stableAnchor": "unheaded-block-67",
    "title": "Unheaded block 67",
    "startLine": 346,
    "endLine": 355,
    "textDigest": "2412915baaeaf954feeedcf5626584850738338e31925686869b456a495cf773",
    "sample": "| Stage | Operation | Preferred execution | Rationale |\n|---|---|---|---|\n| planning | `shape-plan` | `claude` / Claude `sonnet` | plan synthesis and tradeoff writing are the curre",
    "identityFingerprint": "0e3b0baf91dafdeadf7a24d710feeb30c9ec55ef5b587526a5f83aca0eef0daf",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress",
      "7.3 Recommended V1 Provider Policy For Coding Feature Flow"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "7.3 Recommended V1 Provider Policy For Coding Feature Flow",
    "anchor": "73-recommended-v1-provider-policy-for-coding-feature-flow",
    "githubAnchor": "73-recommended-v1-provider-policy-for-coding-feature-flow",
    "stableAnchor": "h-e02f556943db",
    "startLine": 310,
    "endLine": 310,
    "textDigest": "cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b",
    "sample": "7.3 Recommended V1 Provider Policy For Coding Feature Flow",
    "sectionPayloadDigest": "6b7cb81ee2ed7cc0c417705016d01a6bded54a123cd24718eda7a4ab4ed92647",
    "followingBlockDigest": "b9d570330907b725cdaed2198ceccae6a0fb06b1e3a45da87bf1d19ef134272c",
    "identityFingerprint": "2311c5cbfd719cf088e447343e8a7af4a8e8f9e12e4dd64fe2991f7f705a7dc5",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_03bcf93f2a1eb641d2b4681160a35ce8",
    "sourceUnitDigest": "2412915baaeaf954feeedcf5626584850738338e31925686869b456a495cf773",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:346-355#unheaded-block-67 (current lines); unit SHA256 2412915baaeaf954feeedcf5626584850738338e31925686869b456a495cf773.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:310-310#73-recommended-v1-provider-policy-for-coding-feature-flow (current lines); unit SHA256 cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 67\" → \"7.3 Recommended V1 Provider Policy For Coding Feature Flow\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 14 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-67 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow; source context \"Dispatch Control Plane Redesign / 7. Governance And Egress / 7.3 Recommended V1 Provider Policy For Coding Feature Flow\", target context \"Dispatch Control Plane Redesign / 7. Governance And Egress\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "73-recommended-v1-provider-policy-for-coding-feature-flow",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ]
  }
}
```

## Entry rationale-113

```json
{
  "entryId": "rationale-113",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_74bb68261a023f96104ac9591bdddd6f",
  "before": {
    "claimId": "claim_74bb68261a023f96104ac9591bdddd6f",
    "sourceUnitDigest": "5bf2f51a1882af2dbf452174845056de8d783ab64fa05f66a1511bd59eedb8d2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:357-359#unheaded-block-68 (current lines); unit SHA256 5bf2f51a1882af2dbf452174845056de8d783ab64fa05f66a1511bd59eedb8d2.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:310-310#73-recommended-v1-provider-policy-for-coding-feature-flow (current lines); unit SHA256 cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 68\" → \"7.3 Recommended V1 Provider Policy For Coding Feature Flow\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-68 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow; source context \"Dispatch Control Plane Redesign / 7. Governance And Egress / 7.3 Recommended V1 Provider Policy For Coding Feature Flow\", target context \"Dispatch Control Plane Redesign / 7. Governance And Egress\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "73-recommended-v1-provider-policy-for-coding-feature-flow",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "deep: read full source block (Do not use 'agy-herdr', 'codex-herdr', or other interac...) against target section '7.3 Recommended V1 Provider Policy For Coding Feature Flow' (h3); 0 of 3 source lines appear verbatim in the target section, the rest is rewritten current wording, so supersede with a named successor is truthful and no carried claim is made; Heading depth and Links lines (0/0) verified; digests differ as stated and both recomputed; anchor checked; last-reviewed digest present at 9351a257f.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-05-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_74bb68261a023f96104ac9591bdddd6f",
    "sourceUnitDigest": "5bf2f51a1882af2dbf452174845056de8d783ab64fa05f66a1511bd59eedb8d2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:357-359#unheaded-block-68 (current lines); unit SHA256 5bf2f51a1882af2dbf452174845056de8d783ab64fa05f66a1511bd59eedb8d2.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:310-310#73-recommended-v1-provider-policy-for-coding-feature-flow (current lines); unit SHA256 cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 68\" → \"7.3 Recommended V1 Provider Policy For Coding Feature Flow\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 23 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-68 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow; source context \"Dispatch Control Plane Redesign / 7. Governance And Egress / 7.3 Recommended V1 Provider Policy For Coding Feature Flow\", target context \"Dispatch Control Plane Redesign / 7. Governance And Egress\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "73-recommended-v1-provider-policy-for-coding-feature-flow",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 112,
  "factsSHA256": "0d5d46e5f340390ba5dda61d5c9b9b6aa50be84ef523062d2e6fe29a141a128a",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-68",
    "githubAnchor": "unheaded-block-68",
    "stableAnchor": "unheaded-block-68",
    "title": "Unheaded block 68",
    "startLine": 357,
    "endLine": 359,
    "textDigest": "5bf2f51a1882af2dbf452174845056de8d783ab64fa05f66a1511bd59eedb8d2",
    "sample": "Do not use `agy-herdr`, `codex-herdr`, or other interactive Herdr paths as the\nauthority for the first team proof. They can be tried later as visibility\nadapters after cli-spawn as",
    "identityFingerprint": "dff36081c3a71b5aab3fac0594249de6216e2920ec897c17365331d1093b251e",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress",
      "7.3 Recommended V1 Provider Policy For Coding Feature Flow"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "7.3 Recommended V1 Provider Policy For Coding Feature Flow",
    "anchor": "73-recommended-v1-provider-policy-for-coding-feature-flow",
    "githubAnchor": "73-recommended-v1-provider-policy-for-coding-feature-flow",
    "stableAnchor": "h-e02f556943db",
    "startLine": 310,
    "endLine": 310,
    "textDigest": "cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b",
    "sample": "7.3 Recommended V1 Provider Policy For Coding Feature Flow",
    "sectionPayloadDigest": "6b7cb81ee2ed7cc0c417705016d01a6bded54a123cd24718eda7a4ab4ed92647",
    "followingBlockDigest": "b9d570330907b725cdaed2198ceccae6a0fb06b1e3a45da87bf1d19ef134272c",
    "identityFingerprint": "2311c5cbfd719cf088e447343e8a7af4a8e8f9e12e4dd64fe2991f7f705a7dc5",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_74bb68261a023f96104ac9591bdddd6f",
    "sourceUnitDigest": "5bf2f51a1882af2dbf452174845056de8d783ab64fa05f66a1511bd59eedb8d2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:357-359#unheaded-block-68 (current lines); unit SHA256 5bf2f51a1882af2dbf452174845056de8d783ab64fa05f66a1511bd59eedb8d2.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:310-310#73-recommended-v1-provider-policy-for-coding-feature-flow (current lines); unit SHA256 cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b at 9351a257f718ae8f41545792fda3b477a0616e9e.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 68\" → \"7.3 Recommended V1 Provider Policy For Coding Feature Flow\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 23 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-68 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#73-recommended-v1-provider-policy-for-coding-feature-flow; source context \"Dispatch Control Plane Redesign / 7. Governance And Egress / 7.3 Recommended V1 Provider Policy For Coding Feature Flow\", target context \"Dispatch Control Plane Redesign / 7. Governance And Egress\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "73-recommended-v1-provider-policy-for-coding-feature-flow",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "cdcee4bf1cc904e4d7fc101b37de8008fbe974562c3bcc2ab782690fef29913b",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "7. Governance And Egress"
    ]
  }
}
```

## Entry rationale-114

```json
{
  "entryId": "rationale-114",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_a8648a7aeedf0e3b676449beab92c30f",
  "before": {
    "claimId": "claim_a8648a7aeedf0e3b676449beab92c30f",
    "sourceUnitDigest": "a3ba13ce7a942c40b2a0af30815061c9b60f2f787e589314a17141b7337d6728",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:426-432#unheaded-block-76 (current lines); unit SHA256 a3ba13ce7a942c40b2a0af30815061c9b60f2f787e589314a17141b7337d6728.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:382-382#82-compatibility-mapping (current lines); unit SHA256 ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 76\" → \"8.2 Compatibility Mapping\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-76 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#82-compatibility-mapping; source context \"Dispatch Control Plane Redesign / 8. DispatchAssignment / 8.2 Compatibility Mapping\", target context \"Dispatch Control Plane Redesign / 8. DispatchAssignment\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "82-compatibility-mapping",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-301: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Implementation note: ```txt Only `tsk-*` work ids exist\" and the successor section \"8.2 Compatibility Mapping\" (64 percent of its longer words reappear there); the stale implementation note (only tsk ids exist, asgn/msg/run/trace are design targets) is replaced by section 8.2, which now says Assignment and Run have real writers and msg/trace stay design targets, so supersede with a named successor is true; facts recomputed equal: source unheaded-block-76 L426-432, target 82-compatibility-mapping L382-382, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause ec383764 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "8. DispatchAssignment"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_a8648a7aeedf0e3b676449beab92c30f",
    "sourceUnitDigest": "a3ba13ce7a942c40b2a0af30815061c9b60f2f787e589314a17141b7337d6728",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:426-432#unheaded-block-76 (current lines); unit SHA256 a3ba13ce7a942c40b2a0af30815061c9b60f2f787e589314a17141b7337d6728.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:382-382#82-compatibility-mapping (current lines); unit SHA256 ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 76\" → \"8.2 Compatibility Mapping\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 6 removed and 21 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-76 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#82-compatibility-mapping; source context \"Dispatch Control Plane Redesign / 8. DispatchAssignment / 8.2 Compatibility Mapping\", target context \"Dispatch Control Plane Redesign / 8. DispatchAssignment\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "82-compatibility-mapping",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "8. DispatchAssignment"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 113,
  "factsSHA256": "f0adf47a3ccdc005e9354d5283c4e47247cb668e2c225c7a263db9fd35e5141a",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-76",
    "githubAnchor": "unheaded-block-76",
    "stableAnchor": "unheaded-block-76",
    "title": "Unheaded block 76",
    "startLine": 426,
    "endLine": 432,
    "textDigest": "a3ba13ce7a942c40b2a0af30815061c9b60f2f787e589314a17141b7337d6728",
    "sample": "Implementation note:\n\n```txt\nOnly `tsk-*` work ids exist today as durable lifecycle ids.\n`asgn_*`, `msg_*`, `run_*`, and `trace_*` are design-target namespaces until\nthe assignment",
    "identityFingerprint": "6a0fd94c16a25ee185b6fa3c24528b89ca2c1d8ab1c735dbe3eb45f1fa7b5c04",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "8. DispatchAssignment",
      "8.2 Compatibility Mapping"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "8.2 Compatibility Mapping",
    "anchor": "82-compatibility-mapping",
    "githubAnchor": "82-compatibility-mapping",
    "stableAnchor": "h-2c14e4b02f7e",
    "startLine": 382,
    "endLine": 382,
    "textDigest": "ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d",
    "sample": "8.2 Compatibility Mapping",
    "sectionPayloadDigest": "9419132bc17abfbdced702f5c8b8cfb62166b9a941c71b9b73755253f21b55fe",
    "followingBlockDigest": "b0d809c3779fd34378860c27b2796eb9f986ee7a52db6a75a400bd584ece818a",
    "identityFingerprint": "e486d0a835b931bc635f51d8a8e3c65e826eae20df7121432d7394e7ee134c72",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "8. DispatchAssignment"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_a8648a7aeedf0e3b676449beab92c30f",
    "sourceUnitDigest": "a3ba13ce7a942c40b2a0af30815061c9b60f2f787e589314a17141b7337d6728",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:426-432#unheaded-block-76 (current lines); unit SHA256 a3ba13ce7a942c40b2a0af30815061c9b60f2f787e589314a17141b7337d6728.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:382-382#82-compatibility-mapping (current lines); unit SHA256 ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 76\" → \"8.2 Compatibility Mapping\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 6 removed and 21 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-76 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#82-compatibility-mapping; source context \"Dispatch Control Plane Redesign / 8. DispatchAssignment / 8.2 Compatibility Mapping\", target context \"Dispatch Control Plane Redesign / 8. DispatchAssignment\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "82-compatibility-mapping",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "ec383764a04487a6dd4b57aa7e12d2813ecda979eb2df8c2f4cc4f404a64ff8d",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "8. DispatchAssignment"
    ]
  }
}
```

## Entry rationale-115

```json
{
  "entryId": "rationale-115",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_14669b63c931eebaaeb2664f0ee78959",
  "before": {
    "claimId": "claim_14669b63c931eebaaeb2664f0ee78959",
    "sourceUnitDigest": "729047f18a90eaf057dc977708d0b2c03dd029a26cb667b23cec02c743321bad",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:559-561#unheaded-block-94 (current lines); unit SHA256 729047f18a90eaf057dc977708d0b2c03dd029a26cb667b23cec02c743321bad.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:497-497#10-structured-result-and-confidence-ladder (current lines); unit SHA256 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 94\" → \"10. Structured Result And Confidence Ladder\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-94 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder; source context \"Dispatch Control Plane Redesign / 10. Structured Result And Confidence Ladder\", target context \"Dispatch Control Plane Redesign\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "10-structured-result-and-confidence-ladder",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-302: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Current post-merge status: Assignment RunResult storage\" and the successor section \"10. Structured Result And Confidence Ladder\" (55 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-94 L559-561, target 10-structured-result-and-confidence-ladder L497-497, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 7de03114 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_14669b63c931eebaaeb2664f0ee78959",
    "sourceUnitDigest": "729047f18a90eaf057dc977708d0b2c03dd029a26cb667b23cec02c743321bad",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:559-561#unheaded-block-94 (current lines); unit SHA256 729047f18a90eaf057dc977708d0b2c03dd029a26cb667b23cec02c743321bad.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:497-497#10-structured-result-and-confidence-ladder (current lines); unit SHA256 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 94\" → \"10. Structured Result And Confidence Ladder\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 40 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-94 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder; source context \"Dispatch Control Plane Redesign / 10. Structured Result And Confidence Ladder\", target context \"Dispatch Control Plane Redesign\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "10-structured-result-and-confidence-ladder",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 114,
  "factsSHA256": "d8e392d1dbea76fe9e81320819142b0af7359fb7134e1a223d374c87ae33e4c7",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-94",
    "githubAnchor": "unheaded-block-94",
    "stableAnchor": "unheaded-block-94",
    "title": "Unheaded block 94",
    "startLine": 559,
    "endLine": 561,
    "textDigest": "729047f18a90eaf057dc977708d0b2c03dd029a26cb667b23cec02c743321bad",
    "sample": "Current post-merge status: Assignment RunResult storage now has first-class\n`confidence` labels, but Step 04 must harden the evidence contract before the\ncoding driver treats those",
    "identityFingerprint": "e639d67d04c1e7fcacfebe2725c52d8c0dc10cc6f84c8316d596c06c7f18516c",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "10. Structured Result And Confidence Ladder"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Structured Result And Confidence Ladder",
    "anchor": "10-structured-result-and-confidence-ladder",
    "githubAnchor": "10-structured-result-and-confidence-ladder",
    "stableAnchor": "h-98977b4a0007",
    "startLine": 497,
    "endLine": 497,
    "textDigest": "7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9",
    "sample": "10. Structured Result And Confidence Ladder",
    "sectionPayloadDigest": "ba19f33e54d5c03ac86c55b05a4b390e81a0dba7cf71a28a4334440da3100a61",
    "followingBlockDigest": "438e2b100276c284bcc927d2b21af37de9c9124c66c74a5e2329fe1044237440",
    "identityFingerprint": "123b65869b8bb1f6be142c84dcffb82c3572b7275dc7326d812eb1cf54e01e83",
    "ancestry": [
      "Dispatch Control Plane Redesign"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_14669b63c931eebaaeb2664f0ee78959",
    "sourceUnitDigest": "729047f18a90eaf057dc977708d0b2c03dd029a26cb667b23cec02c743321bad",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:559-561#unheaded-block-94 (current lines); unit SHA256 729047f18a90eaf057dc977708d0b2c03dd029a26cb667b23cec02c743321bad.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:497-497#10-structured-result-and-confidence-ladder (current lines); unit SHA256 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 94\" → \"10. Structured Result And Confidence Ladder\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 40 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-94 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder; source context \"Dispatch Control Plane Redesign / 10. Structured Result And Confidence Ladder\", target context \"Dispatch Control Plane Redesign\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "10-structured-result-and-confidence-ladder",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ]
  }
}
```

## Entry rationale-116

```json
{
  "entryId": "rationale-116",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_aa6d3cfae49d49c243cbb2d85d3138b0",
  "before": {
    "claimId": "claim_aa6d3cfae49d49c243cbb2d85d3138b0",
    "sourceUnitDigest": "2c8858f4745fc75c26be7a9b80c4ff3ad1b8ad2f81158f785b367afc790b51e8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:570-572#unheaded-block-97 (current lines); unit SHA256 2c8858f4745fc75c26be7a9b80c4ff3ad1b8ad2f81158f785b367afc790b51e8.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:497-497#10-structured-result-and-confidence-ladder (current lines); unit SHA256 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 97\" → \"10. Structured Result And Confidence Ladder\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-97 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder; source context \"Dispatch Control Plane Redesign / 10. Structured Result And Confidence Ladder\", target context \"Dispatch Control Plane Redesign\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "10-structured-result-and-confidence-ladder",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-303: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"This is why Step 04 hardens dirty-before/after snapshot\" and the successor section \"10. Structured Result And Confidence Ladder\" (62 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-97 L570-572, target 10-structured-result-and-confidence-ladder L497-497, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 7de03114 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_aa6d3cfae49d49c243cbb2d85d3138b0",
    "sourceUnitDigest": "2c8858f4745fc75c26be7a9b80c4ff3ad1b8ad2f81158f785b367afc790b51e8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:570-572#unheaded-block-97 (current lines); unit SHA256 2c8858f4745fc75c26be7a9b80c4ff3ad1b8ad2f81158f785b367afc790b51e8.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:497-497#10-structured-result-and-confidence-ladder (current lines); unit SHA256 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 97\" → \"10. Structured Result And Confidence Ladder\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 40 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-97 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder; source context \"Dispatch Control Plane Redesign / 10. Structured Result And Confidence Ladder\", target context \"Dispatch Control Plane Redesign\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "10-structured-result-and-confidence-ladder",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 115,
  "factsSHA256": "098eff8b3342e0576f115c8308c74f527f42e3059d5a8cb876867f3628b8c42f",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-97",
    "githubAnchor": "unheaded-block-97",
    "stableAnchor": "unheaded-block-97",
    "title": "Unheaded block 97",
    "startLine": 570,
    "endLine": 572,
    "textDigest": "2c8858f4745fc75c26be7a9b80c4ff3ad1b8ad2f81158f785b367afc790b51e8",
    "sample": "This is why Step 04 hardens dirty-before/after snapshots, structured\n`agent-result.json` validation, and read-only report artifacts before Step 05\nlets the coding driver choose sec",
    "identityFingerprint": "741b17b618b578166f974fce3b770d7fa7d3759eb8f939d7737bd92cb8f2c5d1",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "10. Structured Result And Confidence Ladder"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Structured Result And Confidence Ladder",
    "anchor": "10-structured-result-and-confidence-ladder",
    "githubAnchor": "10-structured-result-and-confidence-ladder",
    "stableAnchor": "h-98977b4a0007",
    "startLine": 497,
    "endLine": 497,
    "textDigest": "7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9",
    "sample": "10. Structured Result And Confidence Ladder",
    "sectionPayloadDigest": "ba19f33e54d5c03ac86c55b05a4b390e81a0dba7cf71a28a4334440da3100a61",
    "followingBlockDigest": "438e2b100276c284bcc927d2b21af37de9c9124c66c74a5e2329fe1044237440",
    "identityFingerprint": "123b65869b8bb1f6be142c84dcffb82c3572b7275dc7326d812eb1cf54e01e83",
    "ancestry": [
      "Dispatch Control Plane Redesign"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_aa6d3cfae49d49c243cbb2d85d3138b0",
    "sourceUnitDigest": "2c8858f4745fc75c26be7a9b80c4ff3ad1b8ad2f81158f785b367afc790b51e8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:570-572#unheaded-block-97 (current lines); unit SHA256 2c8858f4745fc75c26be7a9b80c4ff3ad1b8ad2f81158f785b367afc790b51e8.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:497-497#10-structured-result-and-confidence-ladder (current lines); unit SHA256 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 97\" → \"10. Structured Result And Confidence Ladder\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 3 removed and 40 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-97 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#10-structured-result-and-confidence-ladder; source context \"Dispatch Control Plane Redesign / 10. Structured Result And Confidence Ladder\", target context \"Dispatch Control Plane Redesign\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "10-structured-result-and-confidence-ladder",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "7de031140299c76f14d6edaea7f7ad703809928ca203de49012f1c6995a29ca9",
    "targetAncestry": [
      "Dispatch Control Plane Redesign"
    ]
  }
}
```

## Entry rationale-117

```json
{
  "entryId": "rationale-117",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_0dd2b9c7a6cf201063f60b541137a8b4",
  "before": {
    "claimId": "claim_0dd2b9c7a6cf201063f60b541137a8b4",
    "sourceUnitDigest": "0d16c78522042b7f52488ab73957d4f4263e74ad2e70104da672f86ae9d9c9bb",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:643-655#unheaded-block-113 (current lines); unit SHA256 0d16c78522042b7f52488ab73957d4f4263e74ad2e70104da672f86ae9d9c9bb.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:617-617#121a-herdr-own-rust-vocabulary-is-a-separate-namespace (current lines); unit SHA256 043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 113\" → \"12.1a Herdr Own Rust Vocabulary Is a Separate Namespace\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-113 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#121a-herdr-own-rust-vocabulary-is-a-separate-namespace; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.1a Herdr Own Rust Vocabulary Is a Separate Namespace\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "121a-herdr-own-rust-vocabulary-is-a-separate-namespace",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-304: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Herdr's Rust implementation (`herdr-dashboard/src/`) na\" and the successor section \"12.1a Herdr Own Rust Vocabulary Is a Separate Namespace\" (84 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-113 L643-655, target 121a-herdr-own-rust-vocabulary-is-a-separate-namespace L617-617, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 043499b9 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_0dd2b9c7a6cf201063f60b541137a8b4",
    "sourceUnitDigest": "0d16c78522042b7f52488ab73957d4f4263e74ad2e70104da672f86ae9d9c9bb",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:643-655#unheaded-block-113 (current lines); unit SHA256 0d16c78522042b7f52488ab73957d4f4263e74ad2e70104da672f86ae9d9c9bb.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:617-617#121a-herdr-own-rust-vocabulary-is-a-separate-namespace (current lines); unit SHA256 043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 113\" → \"12.1a Herdr Own Rust Vocabulary Is a Separate Namespace\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 4 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-113 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#121a-herdr-own-rust-vocabulary-is-a-separate-namespace; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.1a Herdr Own Rust Vocabulary Is a Separate Namespace\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "121a-herdr-own-rust-vocabulary-is-a-separate-namespace",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 116,
  "factsSHA256": "3d1b0e9b3f98128fbd9be8d16bcde727bc842d99afad0199b2b169d1f5cdfe3a",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-113",
    "githubAnchor": "unheaded-block-113",
    "stableAnchor": "unheaded-block-113",
    "title": "Unheaded block 113",
    "startLine": 643,
    "endLine": 655,
    "textDigest": "0d16c78522042b7f52488ab73957d4f4263e74ad2e70104da672f86ae9d9c9bb",
    "sample": "Herdr's Rust implementation (`herdr-dashboard/src/`) names several of its own\ntypes with \"orchestrator\" in Rust-identifier casing: the `PaneOrchestrator`\ntrait (`ports.rs`) governi",
    "identityFingerprint": "953a744236100a348a0a85c57764fa465960c8c81a476ee6e35b43195d5039df",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport",
      "12.1a Herdr Own Rust Vocabulary Is a Separate Namespace"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "12.1a Herdr Own Rust Vocabulary Is a Separate Namespace",
    "anchor": "121a-herdr-own-rust-vocabulary-is-a-separate-namespace",
    "githubAnchor": "121a-herdr-own-rust-vocabulary-is-a-separate-namespace",
    "stableAnchor": "h-53118cc0f65c",
    "startLine": 617,
    "endLine": 617,
    "textDigest": "043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae",
    "sample": "12.1a Herdr Own Rust Vocabulary Is a Separate Namespace",
    "sectionPayloadDigest": "669f5ebe000ba02c27c5d0a823869ff52225521d129d840c7eef336ce7cb9714",
    "followingBlockDigest": "669f5ebe000ba02c27c5d0a823869ff52225521d129d840c7eef336ce7cb9714",
    "identityFingerprint": "a75b3a3cea8b893fc5ceb535a84588bd7630d0af155be7f12f86d24f44c79f96",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0dd2b9c7a6cf201063f60b541137a8b4",
    "sourceUnitDigest": "0d16c78522042b7f52488ab73957d4f4263e74ad2e70104da672f86ae9d9c9bb",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:643-655#unheaded-block-113 (current lines); unit SHA256 0d16c78522042b7f52488ab73957d4f4263e74ad2e70104da672f86ae9d9c9bb.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:617-617#121a-herdr-own-rust-vocabulary-is-a-separate-namespace (current lines); unit SHA256 043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 113\" → \"12.1a Herdr Own Rust Vocabulary Is a Separate Namespace\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 4 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-113 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#121a-herdr-own-rust-vocabulary-is-a-separate-namespace; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.1a Herdr Own Rust Vocabulary Is a Separate Namespace\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "121a-herdr-own-rust-vocabulary-is-a-separate-namespace",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "043499b91025f70c20790bfe18521027c12f672d56d9b14c66e8359c1fc131ae",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-118

```json
{
  "entryId": "rationale-118",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_4366f098635c5a8564fcfdb402191b50",
  "before": {
    "claimId": "claim_4366f098635c5a8564fcfdb402191b50",
    "sourceUnitDigest": "36c367e6656004e455ad6c92e44fef017d5d69f4f9abdd3ec887d374232c5b2d",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:659-659#unheaded-block-114 (current lines); unit SHA256 36c367e6656004e455ad6c92e44fef017d5d69f4f9abdd3ec887d374232c5b2d.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 114\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-114 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-305: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"The near-term implementation should use:\" and the successor section \"12.2 Near-Term Herdr Adapter\" (0 percent of its longer words reappear there); low overlap, the binding rests on the section topic, which I read as the matching successor; facts recomputed equal: source unheaded-block-114 L659-659, target 122-near-term-herdr-adapter L633-633, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause e170fcd1 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_4366f098635c5a8564fcfdb402191b50",
    "sourceUnitDigest": "36c367e6656004e455ad6c92e44fef017d5d69f4f9abdd3ec887d374232c5b2d",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:659-659#unheaded-block-114 (current lines); unit SHA256 36c367e6656004e455ad6c92e44fef017d5d69f4f9abdd3ec887d374232c5b2d.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 114\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-114 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 117,
  "factsSHA256": "5badaa35ecf67d0cf1a505af3ff329e81dccbbe42d779bf9dd1e32afc6466485",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-114",
    "githubAnchor": "unheaded-block-114",
    "stableAnchor": "unheaded-block-114",
    "title": "Unheaded block 114",
    "startLine": 659,
    "endLine": 659,
    "textDigest": "36c367e6656004e455ad6c92e44fef017d5d69f4f9abdd3ec887d374232c5b2d",
    "sample": "The near-term implementation should use:",
    "identityFingerprint": "01772df36e31de22e39042f64347a1815a6c0e04191a06c89f2f3708ee654a84",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport",
      "12.2 Near-Term Herdr Adapter"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "12.2 Near-Term Herdr Adapter",
    "anchor": "122-near-term-herdr-adapter",
    "githubAnchor": "122-near-term-herdr-adapter",
    "stableAnchor": "h-5d3306aa5319",
    "startLine": 633,
    "endLine": 633,
    "textDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "sample": "12.2 Near-Term Herdr Adapter",
    "sectionPayloadDigest": "43ac470512b20e691da8980e58d93ccfdddf3b95202d719abdd9005d555827cb",
    "followingBlockDigest": "f3ea3f7469efb8a1d17340e69d5f005ebc28b137a1a8236837abdfd673d27cdd",
    "identityFingerprint": "6c4c38363142616fd75872026f68a097e58130c7917529ffe14f7e194457f567",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4366f098635c5a8564fcfdb402191b50",
    "sourceUnitDigest": "36c367e6656004e455ad6c92e44fef017d5d69f4f9abdd3ec887d374232c5b2d",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:659-659#unheaded-block-114 (current lines); unit SHA256 36c367e6656004e455ad6c92e44fef017d5d69f4f9abdd3ec887d374232c5b2d.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 114\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-114 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-119

```json
{
  "entryId": "rationale-119",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_ca9cfaa38b07d2339b637c7a562476d6",
  "before": {
    "claimId": "claim_ca9cfaa38b07d2339b637c7a562476d6",
    "sourceUnitDigest": "b19f0d898dc192014189c4f66bbf4951e7a968055677387eff39e22f3086e9a6",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:661-664#unheaded-block-115 (current lines); unit SHA256 b19f0d898dc192014189c4f66bbf4951e7a968055677387eff39e22f3086e9a6.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 115\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-115 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-306: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"```txt invocation.via = 'cli' executor.adapter = 'herdr\" and the successor section \"12.2 Near-Term Herdr Adapter\" (80 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-115 L661-664, target 122-near-term-herdr-adapter L633-633, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause e170fcd1 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_ca9cfaa38b07d2339b637c7a562476d6",
    "sourceUnitDigest": "b19f0d898dc192014189c4f66bbf4951e7a968055677387eff39e22f3086e9a6",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:661-664#unheaded-block-115 (current lines); unit SHA256 b19f0d898dc192014189c4f66bbf4951e7a968055677387eff39e22f3086e9a6.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 115\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-115 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 118,
  "factsSHA256": "3b1341f5a247bc149e3d936c805ba7dc1bd9ff6f0961d841c134ef19f6742519",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-115",
    "githubAnchor": "unheaded-block-115",
    "stableAnchor": "unheaded-block-115",
    "title": "Unheaded block 115",
    "startLine": 661,
    "endLine": 664,
    "textDigest": "b19f0d898dc192014189c4f66bbf4951e7a968055677387eff39e22f3086e9a6",
    "sample": "```txt\ninvocation.via = \"cli\"\nexecutor.adapter = \"herdr-spawn\"\n```",
    "identityFingerprint": "44256293b6b26ff84f43f250387770d58fe80208f19f9dd9cdd25769c8f969db",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport",
      "12.2 Near-Term Herdr Adapter"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "12.2 Near-Term Herdr Adapter",
    "anchor": "122-near-term-herdr-adapter",
    "githubAnchor": "122-near-term-herdr-adapter",
    "stableAnchor": "h-5d3306aa5319",
    "startLine": 633,
    "endLine": 633,
    "textDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "sample": "12.2 Near-Term Herdr Adapter",
    "sectionPayloadDigest": "43ac470512b20e691da8980e58d93ccfdddf3b95202d719abdd9005d555827cb",
    "followingBlockDigest": "f3ea3f7469efb8a1d17340e69d5f005ebc28b137a1a8236837abdfd673d27cdd",
    "identityFingerprint": "6c4c38363142616fd75872026f68a097e58130c7917529ffe14f7e194457f567",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ca9cfaa38b07d2339b637c7a562476d6",
    "sourceUnitDigest": "b19f0d898dc192014189c4f66bbf4951e7a968055677387eff39e22f3086e9a6",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:661-664#unheaded-block-115 (current lines); unit SHA256 b19f0d898dc192014189c4f66bbf4951e7a968055677387eff39e22f3086e9a6.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 115\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-115 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-120

```json
{
  "entryId": "rationale-120",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_38e1494401dc8f58be5239308bf07b21",
  "before": {
    "claimId": "claim_38e1494401dc8f58be5239308bf07b21",
    "sourceUnitDigest": "411de9e6e56c468657375c41a2bab8c7d3a2822dacc6d3ed9db7e1df616ab714",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:666-666#unheaded-block-116 (current lines); unit SHA256 411de9e6e56c468657375c41a2bab8c7d3a2822dacc6d3ed9db7e1df616ab714.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 116\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-116 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-307: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"This lets the resolver keep its current CLI-shaped cont\" and the successor section \"12.2 Near-Term Herdr Adapter\" (42 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-116 L666-666, target 122-near-term-herdr-adapter L633-633, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause e170fcd1 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_38e1494401dc8f58be5239308bf07b21",
    "sourceUnitDigest": "411de9e6e56c468657375c41a2bab8c7d3a2822dacc6d3ed9db7e1df616ab714",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:666-666#unheaded-block-116 (current lines); unit SHA256 411de9e6e56c468657375c41a2bab8c7d3a2822dacc6d3ed9db7e1df616ab714.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 116\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-116 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 119,
  "factsSHA256": "8f8736a2719cd231d2914216bad0597b195fdb55a20dc45df2fe6b517e37ef95",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-116",
    "githubAnchor": "unheaded-block-116",
    "stableAnchor": "unheaded-block-116",
    "title": "Unheaded block 116",
    "startLine": 666,
    "endLine": 666,
    "textDigest": "411de9e6e56c468657375c41a2bab8c7d3a2822dacc6d3ed9db7e1df616ab714",
    "sample": "This lets the resolver keep its current CLI-shaped contract while the transport layer launches the worker in Herdr instead of a hidden child process.",
    "identityFingerprint": "1aef8acb59cd0ba6d5f62d245ca84815811ae73c8ec778627daf2a094908a0b9",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport",
      "12.2 Near-Term Herdr Adapter"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "12.2 Near-Term Herdr Adapter",
    "anchor": "122-near-term-herdr-adapter",
    "githubAnchor": "122-near-term-herdr-adapter",
    "stableAnchor": "h-5d3306aa5319",
    "startLine": 633,
    "endLine": 633,
    "textDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "sample": "12.2 Near-Term Herdr Adapter",
    "sectionPayloadDigest": "43ac470512b20e691da8980e58d93ccfdddf3b95202d719abdd9005d555827cb",
    "followingBlockDigest": "f3ea3f7469efb8a1d17340e69d5f005ebc28b137a1a8236837abdfd673d27cdd",
    "identityFingerprint": "6c4c38363142616fd75872026f68a097e58130c7917529ffe14f7e194457f567",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_38e1494401dc8f58be5239308bf07b21",
    "sourceUnitDigest": "411de9e6e56c468657375c41a2bab8c7d3a2822dacc6d3ed9db7e1df616ab714",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:666-666#unheaded-block-116 (current lines); unit SHA256 411de9e6e56c468657375c41a2bab8c7d3a2822dacc6d3ed9db7e1df616ab714.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 116\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-116 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-121

```json
{
  "entryId": "rationale-121",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_8b68b02188ffca625df1c7dcba9cb8a0",
  "before": {
    "claimId": "claim_8b68b02188ffca625df1c7dcba9cb8a0",
    "sourceUnitDigest": "77d8a8d8483eaa6f0d522fcaa89ebf00a4f4a54b28dcfdea4b288ef108437091",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:668-668#unheaded-block-117 (current lines); unit SHA256 77d8a8d8483eaa6f0d522fcaa89ebf00a4f4a54b28dcfdea4b288ef108437091.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 117\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-117 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-308: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"The later design target may add a true `protocol:'herdr\" and the successor section \"12.2 Near-Term Herdr Adapter\" (50 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-117 L668-668, target 122-near-term-herdr-adapter L633-633, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause e170fcd1 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_8b68b02188ffca625df1c7dcba9cb8a0",
    "sourceUnitDigest": "77d8a8d8483eaa6f0d522fcaa89ebf00a4f4a54b28dcfdea4b288ef108437091",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:668-668#unheaded-block-117 (current lines); unit SHA256 77d8a8d8483eaa6f0d522fcaa89ebf00a4f4a54b28dcfdea4b288ef108437091.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 117\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-117 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 120,
  "factsSHA256": "ca6d776d9665c1bc05f342f9c82a99b69d0ce17acddf70e9466915e0f92ee60b",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-117",
    "githubAnchor": "unheaded-block-117",
    "stableAnchor": "unheaded-block-117",
    "title": "Unheaded block 117",
    "startLine": 668,
    "endLine": 668,
    "textDigest": "77d8a8d8483eaa6f0d522fcaa89ebf00a4f4a54b28dcfdea4b288ef108437091",
    "sample": "The later design target may add a true `protocol:\"herdr\"` or mailbox transport, but that should wait until a real AgentMessage consumer exists.",
    "identityFingerprint": "297a6a38385529978fb8575da480269eb9e705dca5f1534d85749690331cb018",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport",
      "12.2 Near-Term Herdr Adapter"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "12.2 Near-Term Herdr Adapter",
    "anchor": "122-near-term-herdr-adapter",
    "githubAnchor": "122-near-term-herdr-adapter",
    "stableAnchor": "h-5d3306aa5319",
    "startLine": 633,
    "endLine": 633,
    "textDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "sample": "12.2 Near-Term Herdr Adapter",
    "sectionPayloadDigest": "43ac470512b20e691da8980e58d93ccfdddf3b95202d719abdd9005d555827cb",
    "followingBlockDigest": "f3ea3f7469efb8a1d17340e69d5f005ebc28b137a1a8236837abdfd673d27cdd",
    "identityFingerprint": "6c4c38363142616fd75872026f68a097e58130c7917529ffe14f7e194457f567",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8b68b02188ffca625df1c7dcba9cb8a0",
    "sourceUnitDigest": "77d8a8d8483eaa6f0d522fcaa89ebf00a4f4a54b28dcfdea4b288ef108437091",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:668-668#unheaded-block-117 (current lines); unit SHA256 77d8a8d8483eaa6f0d522fcaa89ebf00a4f4a54b28dcfdea4b288ef108437091.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 117\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-117 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-122

```json
{
  "entryId": "rationale-122",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_d7e3300a73c40ac50a91d45f47337878",
  "before": {
    "claimId": "claim_d7e3300a73c40ac50a91d45f47337878",
    "sourceUnitDigest": "02777615746fecf61bc5f1e374a44574e278b6380b45450e874f1fe292cf9f6d",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:670-670#unheaded-block-118 (current lines); unit SHA256 02777615746fecf61bc5f1e374a44574e278b6380b45450e874f1fe292cf9f6d.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 118\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-118 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-309: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Implemented adapter contract for the reviewed narrow sl\" and the successor section \"12.2 Near-Term Herdr Adapter\" (33 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-118 L670-670, target 122-near-term-herdr-adapter L633-633, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause e170fcd1 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_d7e3300a73c40ac50a91d45f47337878",
    "sourceUnitDigest": "02777615746fecf61bc5f1e374a44574e278b6380b45450e874f1fe292cf9f6d",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:670-670#unheaded-block-118 (current lines); unit SHA256 02777615746fecf61bc5f1e374a44574e278b6380b45450e874f1fe292cf9f6d.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 118\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-118 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 121,
  "factsSHA256": "6ace043ee067b8085ff5f85f887b32bf61de8c9460699a1ac7731890ab30dec5",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-118",
    "githubAnchor": "unheaded-block-118",
    "stableAnchor": "unheaded-block-118",
    "title": "Unheaded block 118",
    "startLine": 670,
    "endLine": 670,
    "textDigest": "02777615746fecf61bc5f1e374a44574e278b6380b45450e874f1fe292cf9f6d",
    "sample": "Implemented adapter contract for the reviewed narrow slice:",
    "identityFingerprint": "418a7d16984f7f0942088cba0672ace9606a1ed5695a76f98cf2375faaf2c88f",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport",
      "12.2 Near-Term Herdr Adapter"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "12.2 Near-Term Herdr Adapter",
    "anchor": "122-near-term-herdr-adapter",
    "githubAnchor": "122-near-term-herdr-adapter",
    "stableAnchor": "h-5d3306aa5319",
    "startLine": 633,
    "endLine": 633,
    "textDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "sample": "12.2 Near-Term Herdr Adapter",
    "sectionPayloadDigest": "43ac470512b20e691da8980e58d93ccfdddf3b95202d719abdd9005d555827cb",
    "followingBlockDigest": "f3ea3f7469efb8a1d17340e69d5f005ebc28b137a1a8236837abdfd673d27cdd",
    "identityFingerprint": "6c4c38363142616fd75872026f68a097e58130c7917529ffe14f7e194457f567",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d7e3300a73c40ac50a91d45f47337878",
    "sourceUnitDigest": "02777615746fecf61bc5f1e374a44574e278b6380b45450e874f1fe292cf9f6d",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:670-670#unheaded-block-118 (current lines); unit SHA256 02777615746fecf61bc5f1e374a44574e278b6380b45450e874f1fe292cf9f6d.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 118\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-118 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-123

```json
{
  "entryId": "rationale-123",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_efee014e9c923b899c9b2fd74fb60f7a",
  "before": {
    "claimId": "claim_efee014e9c923b899c9b2fd74fb60f7a",
    "sourceUnitDigest": "54c3c398e7407022ad4b17cf6b7c847686724224e67b02e1214f876f9506cd32",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:672-681#unheaded-block-119 (current lines); unit SHA256 54c3c398e7407022ad4b17cf6b7c847686724224e67b02e1214f876f9506cd32.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 119\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-119 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-310: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"- `herdr-spawn` is selected only by the executor adapte\" and the successor section \"12.2 Near-Term Herdr Adapter\" (25 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-119 L672-681, target 122-near-term-herdr-adapter L633-633, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause e170fcd1 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_efee014e9c923b899c9b2fd74fb60f7a",
    "sourceUnitDigest": "54c3c398e7407022ad4b17cf6b7c847686724224e67b02e1214f876f9506cd32",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:672-681#unheaded-block-119 (current lines); unit SHA256 54c3c398e7407022ad4b17cf6b7c847686724224e67b02e1214f876f9506cd32.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 119\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 10 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-119 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 122,
  "factsSHA256": "826883647105499536f47259d0415b45ced2fbf86f9921707a45e6aebb9726ed",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-119",
    "githubAnchor": "unheaded-block-119",
    "stableAnchor": "unheaded-block-119",
    "title": "Unheaded block 119",
    "startLine": 672,
    "endLine": 681,
    "textDigest": "54c3c398e7407022ad4b17cf6b7c847686724224e67b02e1214f876f9506cd32",
    "sample": "- `herdr-spawn` is selected only by the executor adapter field.\n- The adapter always creates a fresh Herdr pane for the dispatched worker; it does not reuse an existing pane.\n- The",
    "identityFingerprint": "022c10835c1624af3d07124dae13fc6688edc0979206f02dd0f53498810c4577",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport",
      "12.2 Near-Term Herdr Adapter"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "12.2 Near-Term Herdr Adapter",
    "anchor": "122-near-term-herdr-adapter",
    "githubAnchor": "122-near-term-herdr-adapter",
    "stableAnchor": "h-5d3306aa5319",
    "startLine": 633,
    "endLine": 633,
    "textDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "sample": "12.2 Near-Term Herdr Adapter",
    "sectionPayloadDigest": "43ac470512b20e691da8980e58d93ccfdddf3b95202d719abdd9005d555827cb",
    "followingBlockDigest": "f3ea3f7469efb8a1d17340e69d5f005ebc28b137a1a8236837abdfd673d27cdd",
    "identityFingerprint": "6c4c38363142616fd75872026f68a097e58130c7917529ffe14f7e194457f567",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_efee014e9c923b899c9b2fd74fb60f7a",
    "sourceUnitDigest": "54c3c398e7407022ad4b17cf6b7c847686724224e67b02e1214f876f9506cd32",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:672-681#unheaded-block-119 (current lines); unit SHA256 54c3c398e7407022ad4b17cf6b7c847686724224e67b02e1214f876f9506cd32.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 119\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 10 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-119 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

## Entry rationale-124

```json
{
  "entryId": "rationale-124",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_b91828db536d2481990bce0b68478735",
  "before": {
    "claimId": "claim_b91828db536d2481990bce0b68478735",
    "sourceUnitDigest": "3c822687dfc4d11ee5740a6d59025b08139101b0eac869b65e08403ac4b7e135",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:685-689#unheaded-block-121 (current lines); unit SHA256 3c822687dfc4d11ee5740a6d59025b08139101b0eac869b65e08403ac4b7e135.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 121\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-121 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-311: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"```txt runner-owned sentinel = proves the pane command \" and the successor section \"12.2 Near-Term Herdr Adapter\" (15 percent of its longer words reappear there); low overlap, the binding rests on the section topic, which I read as the matching successor; facts recomputed equal: source unheaded-block-121 L685-689, target 122-near-term-herdr-adapter L633-633, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause e170fcd1 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_b91828db536d2481990bce0b68478735",
    "sourceUnitDigest": "3c822687dfc4d11ee5740a6d59025b08139101b0eac869b65e08403ac4b7e135",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:685-689#unheaded-block-121 (current lines); unit SHA256 3c822687dfc4d11ee5740a6d59025b08139101b0eac869b65e08403ac4b7e135.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 121\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 5 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-121 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 123,
  "factsSHA256": "b457f416fc10f9696d7aaab13d309e2d9a3117c7d7102ce27a287cd6960d66dc",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-121",
    "githubAnchor": "unheaded-block-121",
    "stableAnchor": "unheaded-block-121",
    "title": "Unheaded block 121",
    "startLine": 685,
    "endLine": 689,
    "textDigest": "3c822687dfc4d11ee5740a6d59025b08139101b0eac869b65e08403ac4b7e135",
    "sample": "```txt\nrunner-owned sentinel = proves the pane command exited and transcript is complete\n[DONE]/[BLOCKED]      = optional legacy semantic signal emitted by the worker\ngit head delt",
    "identityFingerprint": "241b395e927a88811cfcc62063058fc236029fbe6fc632058496b89d96edb105",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport",
      "12.2 Near-Term Herdr Adapter"
    ],
    "path": "docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "12.2 Near-Term Herdr Adapter",
    "anchor": "122-near-term-herdr-adapter",
    "githubAnchor": "122-near-term-herdr-adapter",
    "stableAnchor": "h-5d3306aa5319",
    "startLine": 633,
    "endLine": 633,
    "textDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "sample": "12.2 Near-Term Herdr Adapter",
    "sectionPayloadDigest": "43ac470512b20e691da8980e58d93ccfdddf3b95202d719abdd9005d555827cb",
    "followingBlockDigest": "f3ea3f7469efb8a1d17340e69d5f005ebc28b137a1a8236837abdfd673d27cdd",
    "identityFingerprint": "6c4c38363142616fd75872026f68a097e58130c7917529ffe14f7e194457f567",
    "ancestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ],
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b91828db536d2481990bce0b68478735",
    "sourceUnitDigest": "3c822687dfc4d11ee5740a6d59025b08139101b0eac869b65e08403ac4b7e135",
    "claimKind": "architecture",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:685-689#unheaded-block-121 (current lines); unit SHA256 3c822687dfc4d11ee5740a6d59025b08139101b0eac869b65e08403ac4b7e135.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 121\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 5 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-121 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa",
    "targetAncestry": [
      "Dispatch Control Plane Redesign",
      "12. Transport"
    ]
  }
}
```

