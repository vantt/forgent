# Bounded re-review: rationales 5

Author session: `codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **28**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
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

## Entry rationale-125

```json
{
  "entryId": "rationale-125",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_3d73e4a2d6dae0baf907a974a53444c8",
  "before": {
    "claimId": "claim_3d73e4a2d6dae0baf907a974a53444c8",
    "sourceUnitDigest": "7a06d280f0273c3a445a1a35bbc48598996293971929575047cc5a914123d0ab",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:691-691#unheaded-block-122 (current lines); unit SHA256 7a06d280f0273c3a445a1a35bbc48598996293971929575047cc5a914123d0ab.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 122\" → \"12.2 Near-Term Herdr Adapter\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-122 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "targetAnchor": "122-near-term-herdr-adapter",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-312: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"This keeps Herdr compatible with the current prompt/std\" and the successor section \"12.2 Near-Term Herdr Adapter\" (50 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-122 L691-691, target 122-near-term-herdr-adapter L633-633, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause e170fcd1 at 947f6169e matches the reviewed base row at 5035fed52.",
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
    "claimId": "claim_3d73e4a2d6dae0baf907a974a53444c8",
    "sourceUnitDigest": "7a06d280f0273c3a445a1a35bbc48598996293971929575047cc5a914123d0ab",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:691-691#unheaded-block-122 (current lines); unit SHA256 7a06d280f0273c3a445a1a35bbc48598996293971929575047cc5a914123d0ab.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 122\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-122 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
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
  "evidenceIndex": 124,
  "factsSHA256": "b7e8c2c5734633c1bba2410b37a2d835287f49029cda0cd34a2832614cf771e5",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-122",
    "githubAnchor": "unheaded-block-122",
    "stableAnchor": "unheaded-block-122",
    "title": "Unheaded block 122",
    "startLine": 691,
    "endLine": 691,
    "textDigest": "7a06d280f0273c3a445a1a35bbc48598996293971929575047cc5a914123d0ab",
    "sample": "This keeps Herdr compatible with the current prompt/stdout protocol while avoiding the false conclusion that a terminal token is a full AgentMessage.",
    "identityFingerprint": "45f14b9029ff409175c855378bc4a2b926de01857ee7cef0e986d1c6b0c546fa",
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
    "claimId": "claim_3d73e4a2d6dae0baf907a974a53444c8",
    "sourceUnitDigest": "7a06d280f0273c3a445a1a35bbc48598996293971929575047cc5a914123d0ab",
    "claimKind": "contract",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md:691-691#unheaded-block-122 (current lines); unit SHA256 7a06d280f0273c3a445a1a35bbc48598996293971929575047cc5a914123d0ab.\nTarget: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md:633-633#122-near-term-herdr-adapter (current lines); unit SHA256 e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e170fcd13af631492b5e04b4b8bfea83af06a2f2b0d78a00d94d7e28b3d14dfa at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 122\" → \"12.2 Near-Term Herdr Adapter\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 16 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-122 under docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#122-near-term-herdr-adapter; source context \"Dispatch Control Plane Redesign / 12. Transport / 12.2 Near-Term Herdr Adapter\", target context \"Dispatch Control Plane Redesign / 12. Transport\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
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

## Entry rationale-126

```json
{
  "entryId": "rationale-126",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_749a1bdf0d058ac765a2e54a34c40f36",
  "before": {
    "claimId": "claim_749a1bdf0d058ac765a2e54a34c40f36",
    "sourceUnitDigest": "70ab638e4635de19179bdbf61b9d9c8fea2de03a76f4c9dface84e0e1bd602eb",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md",
    "targetAnchor": "12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md:365-365#unheaded-block-71 (current lines); unit SHA256 70ab638e4635de19179bdbf61b9d9c8fea2de03a76f4c9dface84e0e1bd602eb.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md:343-343#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver (current lines); unit SHA256 bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 71\" → \"12. The Person's Assessment Came First, And The Evaluator Was Not The Driver\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver; source context \"Architecture Advisory Evaluation Rubric / 12. The Person's Assessment Came First, And The Evaluator Was Not The Driver\", target context \"Architecture Advisory Evaluation Rubric\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-313: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"**Where to look.** `rubric.md` Part 1 and Part 2: autho\" and the successor section \"12. The Person's Assessment Came First, And The Evaluator Was Not The\" (100 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-71 L365-365, target 12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver L343-343, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause bf080a9b at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78",
    "targetAncestry": [
      "Architecture Advisory Evaluation Rubric"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_749a1bdf0d058ac765a2e54a34c40f36",
    "sourceUnitDigest": "70ab638e4635de19179bdbf61b9d9c8fea2de03a76f4c9dface84e0e1bd602eb",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md",
    "targetAnchor": "12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md:365-365#unheaded-block-71 (current lines); unit SHA256 70ab638e4635de19179bdbf61b9d9c8fea2de03a76f4c9dface84e0e1bd602eb.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md:343-343#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver (current lines); unit SHA256 bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 71\" → \"12. The Person's Assessment Came First, And The Evaluator Was Not The Driver\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 1 removed and 21 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver; source context \"Architecture Advisory Evaluation Rubric / 12. The Person's Assessment Came First, And The Evaluator Was Not The Driver\", target context \"Architecture Advisory Evaluation Rubric\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78",
    "targetAncestry": [
      "Architecture Advisory Evaluation Rubric"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 125,
  "factsSHA256": "df9baccae90c4c0ed97177d435ba1c66abbd6d5da9b385ff61cd50b225744c8b",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-71",
    "githubAnchor": "unheaded-block-71",
    "stableAnchor": "unheaded-block-71",
    "title": "Unheaded block 71",
    "startLine": 365,
    "endLine": 365,
    "textDigest": "70ab638e4635de19179bdbf61b9d9c8fea2de03a76f4c9dface84e0e1bd602eb",
    "sample": "**Where to look.** `rubric.md` Part 1 and Part 2: authorship, and the timestamps.",
    "identityFingerprint": "8607a83f5d5d60f5e847786b41bfc4fd321353644cfb2d35e46c5cdf065b4770",
    "ancestry": [
      "Architecture Advisory Evaluation Rubric",
      "12. The Person's Assessment Came First, And The Evaluator Was Not The Driver"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "12. The Person's Assessment Came First, And The Evaluator Was Not The Driver",
    "anchor": "12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver",
    "githubAnchor": "12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver",
    "stableAnchor": "h-f64ae3da28c2",
    "startLine": 343,
    "endLine": 343,
    "textDigest": "bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78",
    "sample": "12. The Person's Assessment Came First, And The Evaluator Was Not The Driver",
    "sectionPayloadDigest": "051baba61c3cb9839243beb58142c6f70ab8561cb45ddee1dbb85b1569955156",
    "followingBlockDigest": "49f9c3d1c2ed6d58d35581835be1520814a115ed3073dba35834bd5e66061a4d",
    "identityFingerprint": "d6e0281b0b9c2dd4407dc6cd6ac4f1eb4953e99531f2f76b4ca8b31ec4e16fb0",
    "ancestry": [
      "Architecture Advisory Evaluation Rubric"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_749a1bdf0d058ac765a2e54a34c40f36",
    "sourceUnitDigest": "70ab638e4635de19179bdbf61b9d9c8fea2de03a76f4c9dface84e0e1bd602eb",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md",
    "targetAnchor": "12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md:365-365#unheaded-block-71 (current lines); unit SHA256 70ab638e4635de19179bdbf61b9d9c8fea2de03a76f4c9dface84e0e1bd602eb.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md:343-343#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver (current lines); unit SHA256 bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 71\" → \"12. The Person's Assessment Came First, And The Evaluator Was Not The Driver\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 1 removed and 21 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md#12-the-persons-assessment-came-first-and-the-evaluator-was-not-the-driver; source context \"Architecture Advisory Evaluation Rubric / 12. The Person's Assessment Came First, And The Evaluator Was Not The Driver\", target context \"Architecture Advisory Evaluation Rubric\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bf080a9b94daa08a92b9ecb41360e2ab03d927b0685c26fd9765b0fd07cfcf78",
    "targetAncestry": [
      "Architecture Advisory Evaluation Rubric"
    ]
  }
}
```

## Entry rationale-127

```json
{
  "entryId": "rationale-127",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_b77e786ca1c28b37204b3c2d3af32147",
  "before": {
    "claimId": "claim_b77e786ca1c28b37204b3c2d3af32147",
    "sourceUnitDigest": "df3d64116293e25e83fc34a3f2c8ca54d9331bdf403f9bdbbcfba4bc3f1dc1fe",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:130-147#unheaded-block-14 (current lines); unit SHA256 df3d64116293e25e83fc34a3f2c8ca54d9331bdf403f9bdbbcfba4bc3f1dc1fe.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:129-129#judgment-heuristics (current lines); unit SHA256 6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 14\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-14 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-314: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"- **Mark uncertainty at the level of the individual inf\" and the successor section \"Judgment Heuristics\" (98 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-14 L130-147, target judgment-heuristics L129-129, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 6cc30008 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_b77e786ca1c28b37204b3c2d3af32147",
    "sourceUnitDigest": "df3d64116293e25e83fc34a3f2c8ca54d9331bdf403f9bdbbcfba4bc3f1dc1fe",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:130-147#unheaded-block-14 (current lines); unit SHA256 df3d64116293e25e83fc34a3f2c8ca54d9331bdf403f9bdbbcfba4bc3f1dc1fe.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:129-129#judgment-heuristics (current lines); unit SHA256 6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 14\" → \"Judgment Heuristics\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 2 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-14 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 126,
  "factsSHA256": "60fcef5c7d456c5fc4ae1bd8cf91af648c4484077f09671cbd0d31a8ed0067ba",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-14",
    "githubAnchor": "unheaded-block-14",
    "stableAnchor": "unheaded-block-14",
    "title": "Unheaded block 14",
    "startLine": 130,
    "endLine": 147,
    "textDigest": "df3d64116293e25e83fc34a3f2c8ca54d9331bdf403f9bdbbcfba4bc3f1dc1fe",
    "sample": "- **Mark uncertainty at the level of the individual inference, not the\n  document.** A blanket \"these are provisional inferences\" header buys nothing.\n  \"I am confident about the c",
    "identityFingerprint": "7bc6c79fbb0a8a928c3b0acc5aae20ba27f774f1358fb3bc404fc2737bec4f60",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor",
      "Judgment Heuristics"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Judgment Heuristics",
    "anchor": "judgment-heuristics",
    "githubAnchor": "judgment-heuristics",
    "stableAnchor": "h-1c7d6c5a0566",
    "startLine": 129,
    "endLine": 129,
    "textDigest": "6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9",
    "sample": "Judgment Heuristics",
    "sectionPayloadDigest": "9d23571653130d850f43151eb39cfc0365e2d2ba0f7f2b9c88fb22a888e6460b",
    "followingBlockDigest": "9d23571653130d850f43151eb39cfc0365e2d2ba0f7f2b9c88fb22a888e6460b",
    "identityFingerprint": "8ce8738c3dcaf021e3c0ac8d89d3f5422e23794302b06c8573721393cf46953d",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b77e786ca1c28b37204b3c2d3af32147",
    "sourceUnitDigest": "df3d64116293e25e83fc34a3f2c8ca54d9331bdf403f9bdbbcfba4bc3f1dc1fe",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:130-147#unheaded-block-14 (current lines); unit SHA256 df3d64116293e25e83fc34a3f2c8ca54d9331bdf403f9bdbbcfba4bc3f1dc1fe.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:129-129#judgment-heuristics (current lines); unit SHA256 6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 14\" → \"Judgment Heuristics\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 2 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-14 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6cc30008d4d5f885eb943743e52f6c42493f3cc68d3c281f24af7e999e1ef4b9",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  }
}
```

## Entry rationale-128

```json
{
  "entryId": "rationale-128",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_4d76fa64e1f58b727c2388180d8963e4",
  "before": {
    "claimId": "claim_4d76fa64e1f58b727c2388180d8963e4",
    "sourceUnitDigest": "0553c8ef51aecb229fd94c07b2b48218b9ef66c010e3f57e71512e616a28f7be",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:166-170#unheaded-block-16 (current lines); unit SHA256 0553c8ef51aecb229fd94c07b2b48218b9ef66c010e3f57e71512e616a28f7be.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:165-165#handoff-shape (current lines); unit SHA256 a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 16\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-16 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-315: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Produces `interpretation.md` in Phase 2 and `explanatio\" and the successor section \"Handoff Shape\" (35 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-16 L166-170, target handoff-shape L165-165, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause a54ddeef at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_4d76fa64e1f58b727c2388180d8963e4",
    "sourceUnitDigest": "0553c8ef51aecb229fd94c07b2b48218b9ef66c010e3f57e71512e616a28f7be",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:166-170#unheaded-block-16 (current lines); unit SHA256 0553c8ef51aecb229fd94c07b2b48218b9ef66c010e3f57e71512e616a28f7be.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:165-165#handoff-shape (current lines); unit SHA256 a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 16\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 5 removed and 7 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-16 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 127,
  "factsSHA256": "1b1a3fdb961ed226d16ff474e04568060a9b93952e3e9ec73c5c4d53092bdae3",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-16",
    "githubAnchor": "unheaded-block-16",
    "stableAnchor": "unheaded-block-16",
    "title": "Unheaded block 16",
    "startLine": 166,
    "endLine": 170,
    "textDigest": "0553c8ef51aecb229fd94c07b2b48218b9ef66c010e3f57e71512e616a28f7be",
    "sample": "Produces `interpretation.md` in Phase 2 and `explanation.md` in Phase 8; drafts\n`decision-request.md` in Phase 4 for the driver to authorize, and\n`dialogue/<n>-impact.md` for each ",
    "identityFingerprint": "69a183a0c81b45e517bde3004e4736692b3c0b1c5fde564a66531082c272bdd0",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor",
      "Handoff Shape"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Handoff Shape",
    "anchor": "handoff-shape",
    "githubAnchor": "handoff-shape",
    "stableAnchor": "h-dea54d1e89af",
    "startLine": 165,
    "endLine": 165,
    "textDigest": "a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c",
    "sample": "Handoff Shape",
    "sectionPayloadDigest": "3992d88e9faad44808a09eb107c4dc35d7fcff51064e8dd2b902c9be9f54ee86",
    "followingBlockDigest": "3992d88e9faad44808a09eb107c4dc35d7fcff51064e8dd2b902c9be9f54ee86",
    "identityFingerprint": "ebe7d7c7f043b11cad174461f1b1edd4a389c9b5e96362f7fa7ecf96ade14419",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4d76fa64e1f58b727c2388180d8963e4",
    "sourceUnitDigest": "0553c8ef51aecb229fd94c07b2b48218b9ef66c010e3f57e71512e616a28f7be",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:166-170#unheaded-block-16 (current lines); unit SHA256 0553c8ef51aecb229fd94c07b2b48218b9ef66c010e3f57e71512e616a28f7be.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:165-165#handoff-shape (current lines); unit SHA256 a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 16\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 5 removed and 7 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-16 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a54ddeef04e1a1ceeeb73d40e68fb9a8f978c90c952c1e28b6822f5025d6f85c",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  }
}
```

## Entry rationale-129

```json
{
  "entryId": "rationale-129",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_d971f89754723d8ca8cf7ee3162412df",
  "before": {
    "claimId": "claim_d971f89754723d8ca8cf7ee3162412df",
    "sourceUnitDigest": "336b7e697c194576d513aacd39fef1b986765555db23b9e5db3bc38094294572",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "good-example",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:174-203#unheaded-block-17 (current lines); unit SHA256 336b7e697c194576d513aacd39fef1b986765555db23b9e5db3bc38094294572.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:174-174#good-example (current lines); unit SHA256 bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 17\" → \"Good Example\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-17 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Good Example\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-316: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"> **Interpretation of the vnflow case (lead advisor, pr\" and the successor section \"Good Example\" (98 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-17 L174-203, target good-example L174-174, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause bb899c27 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_d971f89754723d8ca8cf7ee3162412df",
    "sourceUnitDigest": "336b7e697c194576d513aacd39fef1b986765555db23b9e5db3bc38094294572",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "good-example",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:174-203#unheaded-block-17 (current lines); unit SHA256 336b7e697c194576d513aacd39fef1b986765555db23b9e5db3bc38094294572.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:174-174#good-example (current lines); unit SHA256 bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 17\" → \"Good Example\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 6 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-17 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Good Example\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 128,
  "factsSHA256": "0a1ecf2bb261d1c8774aa29fdc8b4ffc496817da8044b75a9e27fd164ad2df0a",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-17",
    "githubAnchor": "unheaded-block-17",
    "stableAnchor": "unheaded-block-17",
    "title": "Unheaded block 17",
    "startLine": 174,
    "endLine": 203,
    "textDigest": "336b7e697c194576d513aacd39fef1b986765555db23b9e5db3bc38094294572",
    "sample": "> **Interpretation of the vnflow case (lead advisor, provisional)**\n>\n> Stated: \"EOD and intraday evolution is becoming difficult.\"\n>\n> My reading, with confidence marked:\n>\n> - *I",
    "identityFingerprint": "7c6ff6823bdd0378067a20a91e02b3c1b566d3832329e0b898cca25e4c70d3c3",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor",
      "Good Example"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Good Example",
    "anchor": "good-example",
    "githubAnchor": "good-example",
    "stableAnchor": "h-44de85b49ce0",
    "startLine": 174,
    "endLine": 174,
    "textDigest": "bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce",
    "sample": "Good Example",
    "sectionPayloadDigest": "6ad7b7a9a883c82fb0b2af120dbf30592bd8c24548bb0dfd317f2d6892aab20d",
    "followingBlockDigest": "0b6d9390e4eafea5369eaa872c7588f0389882c267629fc956138f3689c70880",
    "identityFingerprint": "87fbb683a1579a39fc5a3580b3d7f413a2c27752b6a1feee8c1b4d308daf0dd1",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d971f89754723d8ca8cf7ee3162412df",
    "sourceUnitDigest": "336b7e697c194576d513aacd39fef1b986765555db23b9e5db3bc38094294572",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "good-example",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:174-203#unheaded-block-17 (current lines); unit SHA256 336b7e697c194576d513aacd39fef1b986765555db23b9e5db3bc38094294572.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:174-174#good-example (current lines); unit SHA256 bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 17\" → \"Good Example\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 6 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-17 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Good Example\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bb899c27abbdaaae44f5da3f5e6646a2445cf647528d8296343e36c1f49b1dce",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  }
}
```

## Entry rationale-130

```json
{
  "entryId": "rationale-130",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_1f9c5ac30bab055a8a34acab0d31d91b",
  "before": {
    "claimId": "claim_1f9c5ac30bab055a8a34acab0d31d91b",
    "sourceUnitDigest": "9c7a4c40fb2248f08f9a5c4dcffb2beb3ad3e0ad42fa5a1fed9d7762b56609d2",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "bad-example",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:220-229#unheaded-block-20 (current lines); unit SHA256 9c7a4c40fb2248f08f9a5c4dcffb2beb3ad3e0ad42fa5a1fed9d7762b56609d2.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:212-212#bad-example (current lines); unit SHA256 61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 20\" → \"Bad Example\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-20 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#bad-example; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Bad Example\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-317: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"This is bad in five distinct ways, and it is exactly wh\" and the successor section \"Bad Example\" (93 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-20 L220-229, target bad-example L212-212, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 61bab8bd at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_1f9c5ac30bab055a8a34acab0d31d91b",
    "sourceUnitDigest": "9c7a4c40fb2248f08f9a5c4dcffb2beb3ad3e0ad42fa5a1fed9d7762b56609d2",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "bad-example",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:220-229#unheaded-block-20 (current lines); unit SHA256 9c7a4c40fb2248f08f9a5c4dcffb2beb3ad3e0ad42fa5a1fed9d7762b56609d2.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:212-212#bad-example (current lines); unit SHA256 61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 20\" → \"Bad Example\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 9 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-20 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#bad-example; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Bad Example\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 129,
  "factsSHA256": "f2b71f3dd8b9b3532b53d78a6b854f2008725bceb033ad3bb5f05237f660b031",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-20",
    "githubAnchor": "unheaded-block-20",
    "stableAnchor": "unheaded-block-20",
    "title": "Unheaded block 20",
    "startLine": 220,
    "endLine": 229,
    "textDigest": "9c7a4c40fb2248f08f9a5c4dcffb2beb3ad3e0ad42fa5a1fed9d7762b56609d2",
    "sample": "This is bad in five distinct ways, and it is exactly what a capable model writes\nwhen this role is under-specified. It converts a symptom (\"difficult\") into a\ndiagnosis (\"duplicati",
    "identityFingerprint": "a32dad99bccce58e561725c01241d115d5f9b45952170581c87f053e29356952",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor",
      "Bad Example"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Bad Example",
    "anchor": "bad-example",
    "githubAnchor": "bad-example",
    "stableAnchor": "h-94ba531daa0b",
    "startLine": 212,
    "endLine": 212,
    "textDigest": "61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49",
    "sample": "Bad Example",
    "sectionPayloadDigest": "436d766cf4636208f72b887604a01d7ac06d99561cae3ef0ccddfa873cb9cf79",
    "followingBlockDigest": "689cf64c09b4c21c13c465c447bc0c7894fc4a0f9911bd55267511eba93dd94f",
    "identityFingerprint": "95fc310f0b2ca63acc01b5305006ca236afdbe3e4ff90abc5722a4c1163c89d4",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1f9c5ac30bab055a8a34acab0d31d91b",
    "sourceUnitDigest": "9c7a4c40fb2248f08f9a5c4dcffb2beb3ad3e0ad42fa5a1fed9d7762b56609d2",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "bad-example",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:220-229#unheaded-block-20 (current lines); unit SHA256 9c7a4c40fb2248f08f9a5c4dcffb2beb3ad3e0ad42fa5a1fed9d7762b56609d2.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:212-212#bad-example (current lines); unit SHA256 61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 20\" → \"Bad Example\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 9 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-20 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#bad-example; source context \"Architecture Advisory Role Doctrine / 1. Lead Advisor / Bad Example\", target context \"Architecture Advisory Role Doctrine / 1. Lead Advisor\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "61bab8bdc6623d86c89d909a0608bc9bc2ae318375458653f19b4d13a72a4d49",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "1. Lead Advisor"
    ]
  }
}
```

## Entry rationale-131

```json
{
  "entryId": "rationale-131",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_deb6e0500907da30eb43c8a72e85ede0",
  "before": {
    "claimId": "claim_deb6e0500907da30eb43c8a72e85ede0",
    "sourceUnitDigest": "973d6e00ea99727efbddc2a9073fb53a5ae8e371f37c1297f3afe664ea39288a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-1",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:295-298#unheaded-block-26 (current lines); unit SHA256 973d6e00ea99727efbddc2a9073fb53a5ae8e371f37c1297f3afe664ea39288a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:295-295#handoff-shape-1 (current lines); unit SHA256 4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 26\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-26 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-1; source context \"Architecture Advisory Role Doctrine / 2. Context Investigator / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 2. Context Investigator\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-318: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Produces `scout-report.md`: observations with paths, th\" and the successor section \"Handoff Shape\" (27 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-26 L295-298, target handoff-shape-1 L295-295, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 4295ec7d at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_deb6e0500907da30eb43c8a72e85ede0",
    "sourceUnitDigest": "973d6e00ea99727efbddc2a9073fb53a5ae8e371f37c1297f3afe664ea39288a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-1",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:295-298#unheaded-block-26 (current lines); unit SHA256 973d6e00ea99727efbddc2a9073fb53a5ae8e371f37c1297f3afe664ea39288a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:295-295#handoff-shape-1 (current lines); unit SHA256 4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 26\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-26 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-1; source context \"Architecture Advisory Role Doctrine / 2. Context Investigator / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 2. Context Investigator\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 130,
  "factsSHA256": "d9a67e858944a3702495cb1419823011f82ebe0fc6af4e6b62c04c8e430fde07",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 295,
    "endLine": 298,
    "textDigest": "973d6e00ea99727efbddc2a9073fb53a5ae8e371f37c1297f3afe664ea39288a",
    "sample": "Produces `scout-report.md`: observations with paths, the hypothesis it tried to\nrefute and what happened, magnitudes and trends, what could not be determined\nand what would determi",
    "identityFingerprint": "a6b4156a8f477dfdd68a2e6ff6bb73cbe359be6e887b7ea326fb1116450e7e22",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator",
      "Handoff Shape"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Handoff Shape",
    "anchor": "handoff-shape-1",
    "githubAnchor": "handoff-shape-1",
    "stableAnchor": "h-d330b0492ac8",
    "startLine": 295,
    "endLine": 295,
    "textDigest": "4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848",
    "sample": "Handoff Shape",
    "sectionPayloadDigest": "78c44746be8f55ba0325cefd88c6728ab6b0f5f92594eda5a66fcb8aaeb653be",
    "followingBlockDigest": "78c44746be8f55ba0325cefd88c6728ab6b0f5f92594eda5a66fcb8aaeb653be",
    "identityFingerprint": "f638fe294247d80a432e7c7767473147bf8897602264261f0174ea0875b98603",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_deb6e0500907da30eb43c8a72e85ede0",
    "sourceUnitDigest": "973d6e00ea99727efbddc2a9073fb53a5ae8e371f37c1297f3afe664ea39288a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-1",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:295-298#unheaded-block-26 (current lines); unit SHA256 973d6e00ea99727efbddc2a9073fb53a5ae8e371f37c1297f3afe664ea39288a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:295-295#handoff-shape-1 (current lines); unit SHA256 4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 26\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-26 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-1; source context \"Architecture Advisory Role Doctrine / 2. Context Investigator / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 2. Context Investigator\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "4295ec7d8a317a5cfd79bcc98221162d6ccde4d6f72b151240f9b3c1d1683848",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator"
    ]
  }
}
```

## Entry rationale-132

```json
{
  "entryId": "rationale-132",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_566d5e858feff3f7b42b34e719097dcb",
  "before": {
    "claimId": "claim_566d5e858feff3f7b42b34e719097dcb",
    "sourceUnitDigest": "68e1cf90aa9c5b6980cabd1f29b6caa411cd5bef8998b8d0d90c19c01d075a30",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "good-example-1",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:337-341#unheaded-block-28 (current lines); unit SHA256 68e1cf90aa9c5b6980cabd1f29b6caa411cd5bef8998b8d0d90c19c01d075a30.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:302-302#good-example-1 (current lines); unit SHA256 8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 28\" → \"Good Example\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-28 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example-1; source context \"Architecture Advisory Role Doctrine / 2. Context Investigator / Good Example\", target context \"Architecture Advisory Role Doctrine / 2. Context Investigator\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-319: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"This is good because it leads with disconfirmation, rep\" and the successor section \"Good Example\" (91 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-28 L337-341, target good-example-1 L302-302, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 8f665fcc at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_566d5e858feff3f7b42b34e719097dcb",
    "sourceUnitDigest": "68e1cf90aa9c5b6980cabd1f29b6caa411cd5bef8998b8d0d90c19c01d075a30",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "good-example-1",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:337-341#unheaded-block-28 (current lines); unit SHA256 68e1cf90aa9c5b6980cabd1f29b6caa411cd5bef8998b8d0d90c19c01d075a30.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:302-302#good-example-1 (current lines); unit SHA256 8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 28\" → \"Good Example\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 36 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-28 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example-1; source context \"Architecture Advisory Role Doctrine / 2. Context Investigator / Good Example\", target context \"Architecture Advisory Role Doctrine / 2. Context Investigator\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 131,
  "factsSHA256": "1b273818c9717b007f7762f29cc7714fcc9fc35195e71872791884b7111d49ff",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-28",
    "githubAnchor": "unheaded-block-28",
    "stableAnchor": "unheaded-block-28",
    "title": "Unheaded block 28",
    "startLine": 337,
    "endLine": 341,
    "textDigest": "68e1cf90aa9c5b6980cabd1f29b6caa411cd5bef8998b8d0d90c19c01d075a30",
    "sample": "This is good because it leads with disconfirmation, replaces an adjective with a\ncountable observation, reframes the axis on evidence rather than assertion,\nseparates \"could not de",
    "identityFingerprint": "7d5a28ef3fd6c3a9e4f626889d39b90b5b3609d47f56d97433fce0f8ed65d229",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator",
      "Good Example"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Good Example",
    "anchor": "good-example-1",
    "githubAnchor": "good-example-1",
    "stableAnchor": "h-5aa34845f748",
    "startLine": 302,
    "endLine": 302,
    "textDigest": "8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764",
    "sample": "Good Example",
    "sectionPayloadDigest": "7599f5ff511ad71f493c3791d9a37ea2f3d3da4701cc8b88f26403e62dc9c676",
    "followingBlockDigest": "4aa283b8e9245bbd588f341386e296059dbafd5cf6fc054f1ee8f8b353236712",
    "identityFingerprint": "fe5475b0f9aa14cc7cb8744435de5ec01417a65201a927bec0599864fba22218",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_566d5e858feff3f7b42b34e719097dcb",
    "sourceUnitDigest": "68e1cf90aa9c5b6980cabd1f29b6caa411cd5bef8998b8d0d90c19c01d075a30",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "good-example-1",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:337-341#unheaded-block-28 (current lines); unit SHA256 68e1cf90aa9c5b6980cabd1f29b6caa411cd5bef8998b8d0d90c19c01d075a30.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:302-302#good-example-1 (current lines); unit SHA256 8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 28\" → \"Good Example\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 36 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-28 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#good-example-1; source context \"Architecture Advisory Role Doctrine / 2. Context Investigator / Good Example\", target context \"Architecture Advisory Role Doctrine / 2. Context Investigator\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "8f665fcc4561747ba704e9498d5599b76dcefa4d4f95bfa6943d8b5e54ee3764",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "2. Context Investigator"
    ]
  }
}
```

## Entry rationale-133

```json
{
  "entryId": "rationale-133",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_8dadb9fe6d698e022bd0dc047597595c",
  "before": {
    "claimId": "claim_8dadb9fe6d698e022bd0dc047597595c",
    "sourceUnitDigest": "301210e141d70c324ed5690186e4de3e964e0e4701567a46f10aef50a74134ae",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:395-411#unheaded-block-35 (current lines); unit SHA256 301210e141d70c324ed5690186e4de3e964e0e4701567a46f10aef50a74134ae.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:395-395#judgment-heuristics-2 (current lines); unit SHA256 de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 35\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-35 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-2; source context \"Architecture Advisory Role Doctrine / 3. System Shaper / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 3. System Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-320: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"- **Design for the system that exists.** The proposal m\" and the successor section \"Judgment Heuristics\" (93 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-35 L395-411, target judgment-heuristics-2 L395-395, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause de0112f9 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_8dadb9fe6d698e022bd0dc047597595c",
    "sourceUnitDigest": "301210e141d70c324ed5690186e4de3e964e0e4701567a46f10aef50a74134ae",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:395-411#unheaded-block-35 (current lines); unit SHA256 301210e141d70c324ed5690186e4de3e964e0e4701567a46f10aef50a74134ae.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:395-395#judgment-heuristics-2 (current lines); unit SHA256 de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 35\" → \"Judgment Heuristics\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 2 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-35 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-2; source context \"Architecture Advisory Role Doctrine / 3. System Shaper / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 3. System Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 132,
  "factsSHA256": "3a87af39d43632f766500a483a7ce4d6076ea98fd8d90dd7a896d522955deed5",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-35",
    "githubAnchor": "unheaded-block-35",
    "stableAnchor": "unheaded-block-35",
    "title": "Unheaded block 35",
    "startLine": 395,
    "endLine": 411,
    "textDigest": "301210e141d70c324ed5690186e4de3e964e0e4701567a46f10aef50a74134ae",
    "sample": "- **Design for the system that exists.** The proposal must survive contact with\n  what the investigator actually found, including the awkward parts. A design\n  that only works if `",
    "identityFingerprint": "c0cf0639c2358bec592c4006b316792ecb3453ef1edeee5ad0cf3c991c63ade3",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper",
      "Judgment Heuristics"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Judgment Heuristics",
    "anchor": "judgment-heuristics-2",
    "githubAnchor": "judgment-heuristics-2",
    "stableAnchor": "h-ce5b3f870045",
    "startLine": 395,
    "endLine": 395,
    "textDigest": "de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a",
    "sample": "Judgment Heuristics",
    "sectionPayloadDigest": "598f67bb1cf3887d21ae7423c0a208e0cb2229065f21bd83eca47829e4022d6f",
    "followingBlockDigest": "598f67bb1cf3887d21ae7423c0a208e0cb2229065f21bd83eca47829e4022d6f",
    "identityFingerprint": "f94296871ed3d036b606de752f30989e00fbf2b117ff585eb37a3685cdabedee",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_8dadb9fe6d698e022bd0dc047597595c",
    "sourceUnitDigest": "301210e141d70c324ed5690186e4de3e964e0e4701567a46f10aef50a74134ae",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:395-411#unheaded-block-35 (current lines); unit SHA256 301210e141d70c324ed5690186e4de3e964e0e4701567a46f10aef50a74134ae.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:395-395#judgment-heuristics-2 (current lines); unit SHA256 de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 35\" → \"Judgment Heuristics\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 1 removed and 2 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-35 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-2; source context \"Architecture Advisory Role Doctrine / 3. System Shaper / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 3. System Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "de0112f9c8b4f5cb0173835a16a9164393b289a50974f181f9f34b1bf5626a5a",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper"
    ]
  }
}
```

## Entry rationale-134

```json
{
  "entryId": "rationale-134",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_1ade04bad28dd68fdd1daf91ec49f0ed",
  "before": {
    "claimId": "claim_1ade04bad28dd68fdd1daf91ec49f0ed",
    "sourceUnitDigest": "669e1b88d9feb04c85122c24e2376a0c7755566da2c3ee9e0f792b4fa8f46b90",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:429-432#unheaded-block-37 (current lines); unit SHA256 669e1b88d9feb04c85122c24e2376a0c7755566da2c3ee9e0f792b4fa8f46b90.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:429-429#handoff-shape-2 (current lines); unit SHA256 b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 37\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-37 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-2; source context \"Architecture Advisory Role Doctrine / 3. System Shaper / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 3. System Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-321: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Produces `proposals/system-shaper.md`: the frame it wor\" and the successor section \"Handoff Shape\" (38 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-37 L429-432, target handoff-shape-2 L429-429, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause b41a04b8 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_1ade04bad28dd68fdd1daf91ec49f0ed",
    "sourceUnitDigest": "669e1b88d9feb04c85122c24e2376a0c7755566da2c3ee9e0f792b4fa8f46b90",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:429-432#unheaded-block-37 (current lines); unit SHA256 669e1b88d9feb04c85122c24e2376a0c7755566da2c3ee9e0f792b4fa8f46b90.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:429-429#handoff-shape-2 (current lines); unit SHA256 b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 37\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-37 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-2; source context \"Architecture Advisory Role Doctrine / 3. System Shaper / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 3. System Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 133,
  "factsSHA256": "942a99d6e9df069db61c89232e7765222f73cc1e18eddf121b0e52cc7059299f",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-37",
    "githubAnchor": "unheaded-block-37",
    "stableAnchor": "unheaded-block-37",
    "title": "Unheaded block 37",
    "startLine": 429,
    "endLine": 432,
    "textDigest": "669e1b88d9feb04c85122c24e2376a0c7755566da2c3ee9e0f792b4fa8f46b90",
    "sample": "Produces `proposals/system-shaper.md`: the frame it worked from, the proposal,\nthe load-bearing constraint, what it makes harder, the first reversible step,\nwhich claims rest on sc",
    "identityFingerprint": "88bd3af600c0bc5753c01b8bd2dff9f8d4c2f366297a44814770f4018870fbed",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper",
      "Handoff Shape"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Handoff Shape",
    "anchor": "handoff-shape-2",
    "githubAnchor": "handoff-shape-2",
    "stableAnchor": "h-440fb9bcf343",
    "startLine": 429,
    "endLine": 429,
    "textDigest": "b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66",
    "sample": "Handoff Shape",
    "sectionPayloadDigest": "08e41f264fdaec6720e99c52cacc542ba3ff8c591a11daf30af53583888a737c",
    "followingBlockDigest": "08e41f264fdaec6720e99c52cacc542ba3ff8c591a11daf30af53583888a737c",
    "identityFingerprint": "321fbd39d6b5e6a23eb93b3e324c42d1f0630a867b68c732c1336914dd78c1ad",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_1ade04bad28dd68fdd1daf91ec49f0ed",
    "sourceUnitDigest": "669e1b88d9feb04c85122c24e2376a0c7755566da2c3ee9e0f792b4fa8f46b90",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-2",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:429-432#unheaded-block-37 (current lines); unit SHA256 669e1b88d9feb04c85122c24e2376a0c7755566da2c3ee9e0f792b4fa8f46b90.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:429-429#handoff-shape-2 (current lines); unit SHA256 b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 37\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-37 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-2; source context \"Architecture Advisory Role Doctrine / 3. System Shaper / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 3. System Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "b41a04b80d18785a6f4b551a7b7986b208b30bb6fb1daa0d0ad1addb8bb1dc66",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "3. System Shaper"
    ]
  }
}
```

## Entry rationale-135

```json
{
  "entryId": "rationale-135",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_6911ce65c274d0bbe3fef19915607c69",
  "before": {
    "claimId": "claim_6911ce65c274d0bbe3fef19915607c69",
    "sourceUnitDigest": "f1458231c836854cb281062d28e57ab9b3520a77d1d105593fc16f289881d3b6",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-3",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:578-582#unheaded-block-47 (current lines); unit SHA256 f1458231c836854cb281062d28e57ab9b3520a77d1d105593fc16f289881d3b6.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:578-578#handoff-shape-3 (current lines); unit SHA256 758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 47\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-47 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-3; source context \"Architecture Advisory Role Doctrine / 4. Alternative Shaper / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 4. Alternative Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-322: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Produces `proposals/alternative-shaper.md`: the priors \" and the successor section \"Handoff Shape\" (33 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-47 L578-582, target handoff-shape-3 L578-578, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 758bd9de at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "4. Alternative Shaper"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_6911ce65c274d0bbe3fef19915607c69",
    "sourceUnitDigest": "f1458231c836854cb281062d28e57ab9b3520a77d1d105593fc16f289881d3b6",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-3",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:578-582#unheaded-block-47 (current lines); unit SHA256 f1458231c836854cb281062d28e57ab9b3520a77d1d105593fc16f289881d3b6.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:578-578#handoff-shape-3 (current lines); unit SHA256 758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 47\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 5 removed and 6 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-47 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-3; source context \"Architecture Advisory Role Doctrine / 4. Alternative Shaper / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 4. Alternative Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "4. Alternative Shaper"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 134,
  "factsSHA256": "8ea94a0e9b2fe2bbbea6941997a4ef18ab18984f9c85ae67d2a8cc280e7f266e",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-47",
    "githubAnchor": "unheaded-block-47",
    "stableAnchor": "unheaded-block-47",
    "title": "Unheaded block 47",
    "startLine": 578,
    "endLine": 582,
    "textDigest": "f1458231c836854cb281062d28e57ab9b3520a77d1d105593fc16f289881d3b6",
    "sample": "Produces `proposals/alternative-shaper.md`: the priors it applied and why, the\ncandidate, an explicitly considered no-build or smaller path with concrete\nconsequences, any alternat",
    "identityFingerprint": "1081d37b6bb4e0a043960a154d39403d66d19dfdeac8f728cedc10c659d259e4",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "4. Alternative Shaper",
      "Handoff Shape"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Handoff Shape",
    "anchor": "handoff-shape-3",
    "githubAnchor": "handoff-shape-3",
    "stableAnchor": "h-5e817541347f",
    "startLine": 578,
    "endLine": 578,
    "textDigest": "758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df",
    "sample": "Handoff Shape",
    "sectionPayloadDigest": "4aec014db6a9c743b86ccad7719f811b94b6b06871bd8ac4c617f679463f6ee2",
    "followingBlockDigest": "4aec014db6a9c743b86ccad7719f811b94b6b06871bd8ac4c617f679463f6ee2",
    "identityFingerprint": "416dd5baa890d9a966fc6b021571a9e141b8a5c1e49398c392d9f46e18ced601",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "4. Alternative Shaper"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6911ce65c274d0bbe3fef19915607c69",
    "sourceUnitDigest": "f1458231c836854cb281062d28e57ab9b3520a77d1d105593fc16f289881d3b6",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-3",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:578-582#unheaded-block-47 (current lines); unit SHA256 f1458231c836854cb281062d28e57ab9b3520a77d1d105593fc16f289881d3b6.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:578-578#handoff-shape-3 (current lines); unit SHA256 758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 47\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 5 removed and 6 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-47 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-3; source context \"Architecture Advisory Role Doctrine / 4. Alternative Shaper / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 4. Alternative Shaper\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "758bd9de89e1eb50159df3b3ba35ae583163fb5d5a97c988f9a46757158006df",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "4. Alternative Shaper"
    ]
  }
}
```

## Entry rationale-136

```json
{
  "entryId": "rationale-136",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_72f81fed028e9d9ae2d755816f77139d",
  "before": {
    "claimId": "claim_72f81fed028e9d9ae2d755816f77139d",
    "sourceUnitDigest": "ebf1829c1b01028385e7940aaac1ca6e73b5d73f3b35d61884e6afd643c28576",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-4",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:716-719#unheaded-block-57 (current lines); unit SHA256 ebf1829c1b01028385e7940aaac1ca6e73b5d73f3b35d61884e6afd643c28576.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:716-716#handoff-shape-4 (current lines); unit SHA256 ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 57\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-57 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-4; source context \"Architecture Advisory Role Doctrine / 5. Constraint Advocate / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 5. Constraint Advocate\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-323: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Produces `proposals/constraint-advocate.md` in Phase 5 \" and the successor section \"Handoff Shape\" (69 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-57 L716-719, target handoff-shape-4 L716-716, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause ac7fd4c4 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "5. Constraint Advocate"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_72f81fed028e9d9ae2d755816f77139d",
    "sourceUnitDigest": "ebf1829c1b01028385e7940aaac1ca6e73b5d73f3b35d61884e6afd643c28576",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-4",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:716-719#unheaded-block-57 (current lines); unit SHA256 ebf1829c1b01028385e7940aaac1ca6e73b5d73f3b35d61884e6afd643c28576.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:716-716#handoff-shape-4 (current lines); unit SHA256 ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 57\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 2 removed and 4 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-57 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-4; source context \"Architecture Advisory Role Doctrine / 5. Constraint Advocate / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 5. Constraint Advocate\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "5. Constraint Advocate"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 135,
  "factsSHA256": "f70d436f63d6ce94e4c89519784b42eccd376bb68ae921ad67ad26dcd0c39f71",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-57",
    "githubAnchor": "unheaded-block-57",
    "stableAnchor": "unheaded-block-57",
    "title": "Unheaded block 57",
    "startLine": 716,
    "endLine": 719,
    "textDigest": "ebf1829c1b01028385e7940aaac1ca6e73b5d73f3b35d61884e6afd643c28576",
    "sample": "Produces `proposals/constraint-advocate.md` in Phase 5 (as a candidate shaped by\noperational priors) and constraint findings against every candidate in Phase 6.\nEach finding names ",
    "identityFingerprint": "230c4cf18fb9b116323fe41e25de4598fde36e7f77d3b038b02de331299c405b",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "5. Constraint Advocate",
      "Handoff Shape"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Handoff Shape",
    "anchor": "handoff-shape-4",
    "githubAnchor": "handoff-shape-4",
    "stableAnchor": "h-9003859ff0db",
    "startLine": 716,
    "endLine": 716,
    "textDigest": "ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900",
    "sample": "Handoff Shape",
    "sectionPayloadDigest": "1c40a357226651aa2dddf1d1142da641575f8a35dfcd0fdc561a63b7acb3299e",
    "followingBlockDigest": "1c40a357226651aa2dddf1d1142da641575f8a35dfcd0fdc561a63b7acb3299e",
    "identityFingerprint": "15efb85db9905f40bfdbfa2a50ea56a31d119cc3f7c82552098cc7d94861481a",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "5. Constraint Advocate"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_72f81fed028e9d9ae2d755816f77139d",
    "sourceUnitDigest": "ebf1829c1b01028385e7940aaac1ca6e73b5d73f3b35d61884e6afd643c28576",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-4",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:716-719#unheaded-block-57 (current lines); unit SHA256 ebf1829c1b01028385e7940aaac1ca6e73b5d73f3b35d61884e6afd643c28576.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:716-716#handoff-shape-4 (current lines); unit SHA256 ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 57\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 2 removed and 4 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-57 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-4; source context \"Architecture Advisory Role Doctrine / 5. Constraint Advocate / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 5. Constraint Advocate\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ac7fd4c4dcbe6edf7163fee8b9295870c8b1c907a24b36911c2efd32b34d0900",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "5. Constraint Advocate"
    ]
  }
}
```

## Entry rationale-137

```json
{
  "entryId": "rationale-137",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_bd8fb3923a823856489a3f5eb101e832",
  "before": {
    "claimId": "claim_bd8fb3923a823856489a3f5eb101e832",
    "sourceUnitDigest": "896ba947d467f6209716142f1e95b09bc0d5c84629e53d625cf85d374e2ac17a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-5",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:895-898#unheaded-block-71 (current lines); unit SHA256 896ba947d467f6209716142f1e95b09bc0d5c84629e53d625cf85d374e2ac17a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:896-896#handoff-shape-5 (current lines); unit SHA256 1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 71\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-5; source context \"Architecture Advisory Role Doctrine / 6. Architecture Critic / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 6. Architecture Critic\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-324: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Produces `critiques/architecture-critic.md`: attacks gr\" and the successor section \"Handoff Shape\" (20 percent of its longer words reappear there); low overlap, the binding rests on the section topic, which I read as the matching successor; facts recomputed equal: source unheaded-block-71 L895-898, target handoff-shape-5 L896-896, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 1068ea21 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "6. Architecture Critic"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_bd8fb3923a823856489a3f5eb101e832",
    "sourceUnitDigest": "896ba947d467f6209716142f1e95b09bc0d5c84629e53d625cf85d374e2ac17a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-5",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:895-898#unheaded-block-71 (current lines); unit SHA256 896ba947d467f6209716142f1e95b09bc0d5c84629e53d625cf85d374e2ac17a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:896-896#handoff-shape-5 (current lines); unit SHA256 1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 71\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-5; source context \"Architecture Advisory Role Doctrine / 6. Architecture Critic / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 6. Architecture Critic\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "6. Architecture Critic"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 136,
  "factsSHA256": "279242d769861809284241b1313fa78054d7b919bcaa68783367feed18e9888c",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-71",
    "githubAnchor": "unheaded-block-71",
    "stableAnchor": "unheaded-block-71",
    "title": "Unheaded block 71",
    "startLine": 895,
    "endLine": 898,
    "textDigest": "896ba947d467f6209716142f1e95b09bc0d5c84629e53d625cf85d374e2ac17a",
    "sample": "Produces `critiques/architecture-critic.md`: attacks grouped by target proposal,\neach with the specific claim attacked, why it may be false, what evidence would\nsettle it, and whet",
    "identityFingerprint": "3003a56217adb9e4a1c58ef7f56b1ef565995130564aa125ed469425fddd017f",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "6. Architecture Critic",
      "Handoff Shape"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Handoff Shape",
    "anchor": "handoff-shape-5",
    "githubAnchor": "handoff-shape-5",
    "stableAnchor": "h-8ac95b76e5ba",
    "startLine": 896,
    "endLine": 896,
    "textDigest": "1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df",
    "sample": "Handoff Shape",
    "sectionPayloadDigest": "afd32de21f2eda54842da9d688f070032403c96493dff8f5ea8f4125ad42337a",
    "followingBlockDigest": "afd32de21f2eda54842da9d688f070032403c96493dff8f5ea8f4125ad42337a",
    "identityFingerprint": "37d5a03807bc838f778ae9956ae6b74795c3db8642c4c2bfb7ba8906515b5805",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "6. Architecture Critic"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bd8fb3923a823856489a3f5eb101e832",
    "sourceUnitDigest": "896ba947d467f6209716142f1e95b09bc0d5c84629e53d625cf85d374e2ac17a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-5",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:895-898#unheaded-block-71 (current lines); unit SHA256 896ba947d467f6209716142f1e95b09bc0d5c84629e53d625cf85d374e2ac17a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:896-896#handoff-shape-5 (current lines); unit SHA256 1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 71\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-71 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-5; source context \"Architecture Advisory Role Doctrine / 6. Architecture Critic / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 6. Architecture Critic\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1068ea219aa2e30d1af2251f3bc83ba424491c09a2ce04c16089a142de0c86df",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "6. Architecture Critic"
    ]
  }
}
```

## Entry rationale-138

```json
{
  "entryId": "rationale-138",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_88a852c57e217c461ea57067acb241b0",
  "before": {
    "claimId": "claim_88a852c57e217c461ea57067acb241b0",
    "sourceUnitDigest": "2626c5cc4a83c825b9f737201c9eeabe6c0068d3e19f0c04cfb697db40c85073",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-6",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1007-1022#unheaded-block-79 (current lines); unit SHA256 2626c5cc4a83c825b9f737201c9eeabe6c0068d3e19f0c04cfb697db40c85073.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1008-1008#judgment-heuristics-6 (current lines); unit SHA256 c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 79\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-79 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-6; source context \"Architecture Advisory Role Doctrine / 7. Synthesizer / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 7. Synthesizer\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-325: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"- **Recommend one thing.** Three balanced options is no\" and the successor section \"Judgment Heuristics\" (84 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-79 L1007-1022, target judgment-heuristics-6 L1008-1008, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause c5aadaa5 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_88a852c57e217c461ea57067acb241b0",
    "sourceUnitDigest": "2626c5cc4a83c825b9f737201c9eeabe6c0068d3e19f0c04cfb697db40c85073",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-6",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1007-1022#unheaded-block-79 (current lines); unit SHA256 2626c5cc4a83c825b9f737201c9eeabe6c0068d3e19f0c04cfb697db40c85073.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1008-1008#judgment-heuristics-6 (current lines); unit SHA256 c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 79\" → \"Judgment Heuristics\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 4 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-79 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-6; source context \"Architecture Advisory Role Doctrine / 7. Synthesizer / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 7. Synthesizer\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 137,
  "factsSHA256": "3f933f382d9d0445c37942e1269b30824c1e66ddaa63108d56a53f8a46287625",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-79",
    "githubAnchor": "unheaded-block-79",
    "stableAnchor": "unheaded-block-79",
    "title": "Unheaded block 79",
    "startLine": 1007,
    "endLine": 1022,
    "textDigest": "2626c5cc4a83c825b9f737201c9eeabe6c0068d3e19f0c04cfb697db40c85073",
    "sample": "- **Recommend one thing.** Three balanced options is not synthesis; it is the\n  panel handing the work back. If the evidence genuinely cannot separate two\n  candidates, say *that* ",
    "identityFingerprint": "e6fe2fc8c8a30f53d2624d06d8506325ce528259ce2f66e9095b5c7ceec5819f",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer",
      "Judgment Heuristics"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Judgment Heuristics",
    "anchor": "judgment-heuristics-6",
    "githubAnchor": "judgment-heuristics-6",
    "stableAnchor": "h-700a0176482f",
    "startLine": 1008,
    "endLine": 1008,
    "textDigest": "c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927",
    "sample": "Judgment Heuristics",
    "sectionPayloadDigest": "15dbdebfccbf98bd3baefdccc22e6491aa9f9e6b0c517350ab3e42cc5e79ef5a",
    "followingBlockDigest": "15dbdebfccbf98bd3baefdccc22e6491aa9f9e6b0c517350ab3e42cc5e79ef5a",
    "identityFingerprint": "e2b90926dbdbb46a36b55d81ec00e1ace9f0530435836cd328a3f5e6cc8105b2",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_88a852c57e217c461ea57067acb241b0",
    "sourceUnitDigest": "2626c5cc4a83c825b9f737201c9eeabe6c0068d3e19f0c04cfb697db40c85073",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-6",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1007-1022#unheaded-block-79 (current lines); unit SHA256 2626c5cc4a83c825b9f737201c9eeabe6c0068d3e19f0c04cfb697db40c85073.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1008-1008#judgment-heuristics-6 (current lines); unit SHA256 c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 79\" → \"Judgment Heuristics\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 4 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-79 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-6; source context \"Architecture Advisory Role Doctrine / 7. Synthesizer / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 7. Synthesizer\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "c5aadaa5e66291932c87295d069cc2257389c9b25ee9a1923f9cc7b0d83c1927",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer"
    ]
  }
}
```

## Entry rationale-139

```json
{
  "entryId": "rationale-139",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_0492d45c2c54a256ebdfda12092cba4c",
  "before": {
    "claimId": "claim_0492d45c2c54a256ebdfda12092cba4c",
    "sourceUnitDigest": "6b135e3062617d5a1611d5eec682abd7a8856de21c1c3e85e33365cb869d1aa0",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-6",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1038-1041#unheaded-block-81 (current lines); unit SHA256 6b135e3062617d5a1611d5eec682abd7a8856de21c1c3e85e33365cb869d1aa0.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1039-1039#handoff-shape-6 (current lines); unit SHA256 dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 81\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-81 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-6; source context \"Architecture Advisory Role Doctrine / 7. Synthesizer / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 7. Synthesizer\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-326: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Produces `synthesis.md` — the Decision Packet. Recommen\" and the successor section \"Handoff Shape\" (23 percent of its longer words reappear there); low overlap, the binding rests on the section topic, which I read as the matching successor; facts recomputed equal: source unheaded-block-81 L1038-1041, target handoff-shape-6 L1039-1039, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause dfd84807 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_0492d45c2c54a256ebdfda12092cba4c",
    "sourceUnitDigest": "6b135e3062617d5a1611d5eec682abd7a8856de21c1c3e85e33365cb869d1aa0",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-6",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1038-1041#unheaded-block-81 (current lines); unit SHA256 6b135e3062617d5a1611d5eec682abd7a8856de21c1c3e85e33365cb869d1aa0.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1039-1039#handoff-shape-6 (current lines); unit SHA256 dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 81\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 6 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-81 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-6; source context \"Architecture Advisory Role Doctrine / 7. Synthesizer / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 7. Synthesizer\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 138,
  "factsSHA256": "bf0dd9264da55c7e047874e2a1f5fb178b77748124abf62ae5fb817aa35643bf",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-81",
    "githubAnchor": "unheaded-block-81",
    "stableAnchor": "unheaded-block-81",
    "title": "Unheaded block 81",
    "startLine": 1038,
    "endLine": 1041,
    "textDigest": "6b135e3062617d5a1611d5eec682abd7a8856de21c1c3e85e33365cb869d1aa0",
    "sample": "Produces `synthesis.md` — the Decision Packet. Recommendation, what it rests on,\nper-claim confidence, what it costs, surviving dissent with attribution and\nresolution conditions, ",
    "identityFingerprint": "77fc5ca00d434639990c32fd2b7b1a239fc3627f06c6d5b4ed7d76c1f6fd329d",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer",
      "Handoff Shape"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Handoff Shape",
    "anchor": "handoff-shape-6",
    "githubAnchor": "handoff-shape-6",
    "stableAnchor": "h-724c82b7c9fa",
    "startLine": 1039,
    "endLine": 1039,
    "textDigest": "dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675",
    "sample": "Handoff Shape",
    "sectionPayloadDigest": "547cf78074494f49606fbb72b5025f93823d304005453e79ada57360b3db9ed0",
    "followingBlockDigest": "547cf78074494f49606fbb72b5025f93823d304005453e79ada57360b3db9ed0",
    "identityFingerprint": "1fa9e60f14a766ff6f80d95605f79a37cc8d80bbee57dbc095498fc61d174e5b",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0492d45c2c54a256ebdfda12092cba4c",
    "sourceUnitDigest": "6b135e3062617d5a1611d5eec682abd7a8856de21c1c3e85e33365cb869d1aa0",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-6",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1038-1041#unheaded-block-81 (current lines); unit SHA256 6b135e3062617d5a1611d5eec682abd7a8856de21c1c3e85e33365cb869d1aa0.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1039-1039#handoff-shape-6 (current lines); unit SHA256 dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 81\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 6 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-81 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-6; source context \"Architecture Advisory Role Doctrine / 7. Synthesizer / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 7. Synthesizer\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "dfd84807f3b3cb305fa1f88bb5940de8d63a6154bf0b963010f9a58722ecb675",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "7. Synthesizer"
    ]
  }
}
```

## Entry rationale-140

```json
{
  "entryId": "rationale-140",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_237843f43935cfdd341eb8471d77c3e8",
  "before": {
    "claimId": "claim_237843f43935cfdd341eb8471d77c3e8",
    "sourceUnitDigest": "c06ea01f584d79e85d225e45ebc2ca352a3cdd819f9ef833347ea02847f86ef3",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "what-to-notice-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1172-1186#unheaded-block-88 (current lines); unit SHA256 c06ea01f584d79e85d225e45ebc2ca352a3cdd819f9ef833347ea02847f86ef3.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1174-1174#what-to-notice-7 (current lines); unit SHA256 b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 88\" → \"What To Notice\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-88 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#what-to-notice-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / What To Notice\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-327: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"- Claims in the packet that no advisor made. Synthesis-\" and the successor section \"What To Notice\" (80 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-88 L1172-1186, target what-to-notice-7 L1174-1174, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause b8129cef at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_237843f43935cfdd341eb8471d77c3e8",
    "sourceUnitDigest": "c06ea01f584d79e85d225e45ebc2ca352a3cdd819f9ef833347ea02847f86ef3",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "what-to-notice-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1172-1186#unheaded-block-88 (current lines); unit SHA256 c06ea01f584d79e85d225e45ebc2ca352a3cdd819f9ef833347ea02847f86ef3.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1174-1174#what-to-notice-7 (current lines); unit SHA256 b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 88\" → \"What To Notice\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 5 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-88 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#what-to-notice-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / What To Notice\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 139,
  "factsSHA256": "a310984e223a95a979b2b5be726f5d84e660413c0d5c6c641e8d757b31ebf01f",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-88",
    "githubAnchor": "unheaded-block-88",
    "stableAnchor": "unheaded-block-88",
    "title": "Unheaded block 88",
    "startLine": 1172,
    "endLine": 1186,
    "textDigest": "c06ea01f584d79e85d225e45ebc2ca352a3cdd819f9ef833347ea02847f86ef3",
    "sample": "- Claims in the packet that no advisor made. Synthesis-introduced arguments.\n- Evidence that does not exist. Cited paths that are not there; cited runs with\n  no result file; falsi",
    "identityFingerprint": "46925718ef9b0f80af0d302cc085cb915cb67c7ba7f26aac0f80f1aa732b9712",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team",
      "What To Notice"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "What To Notice",
    "anchor": "what-to-notice-7",
    "githubAnchor": "what-to-notice-7",
    "stableAnchor": "h-301463ebf491",
    "startLine": 1174,
    "endLine": 1174,
    "textDigest": "b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556",
    "sample": "What To Notice",
    "sectionPayloadDigest": "bce3cada17d272d2bcce55c595fea930314335a4bb7959c616f8aade58b4afc8",
    "followingBlockDigest": "bce3cada17d272d2bcce55c595fea930314335a4bb7959c616f8aade58b4afc8",
    "identityFingerprint": "6546ac0526111971fb3585cd300756136dc5e200e371f8a672c2223621a37f05",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_237843f43935cfdd341eb8471d77c3e8",
    "sourceUnitDigest": "c06ea01f584d79e85d225e45ebc2ca352a3cdd819f9ef833347ea02847f86ef3",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "what-to-notice-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1172-1186#unheaded-block-88 (current lines); unit SHA256 c06ea01f584d79e85d225e45ebc2ca352a3cdd819f9ef833347ea02847f86ef3.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1174-1174#what-to-notice-7 (current lines); unit SHA256 b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 88\" → \"What To Notice\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 5 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-88 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#what-to-notice-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / What To Notice\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "b8129cef42f5aaa588bc7c1caa7b28138989933cfa7f84290e133f56a3f8b556",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ]
  }
}
```

## Entry rationale-141

```json
{
  "entryId": "rationale-141",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_bee98ef4ef3d1bbe7f849cf6598667fa",
  "before": {
    "claimId": "claim_bee98ef4ef3d1bbe7f849cf6598667fa",
    "sourceUnitDigest": "6bebda0cc2247a74d1a5ce8cf37daac311177e665e5560dfbba65607f77ef0c2",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1190-1202#unheaded-block-89 (current lines); unit SHA256 6bebda0cc2247a74d1a5ce8cf37daac311177e665e5560dfbba65607f77ef0c2.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1191-1191#judgment-heuristics-7 (current lines); unit SHA256 49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 89\" → \"Judgment Heuristics\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-89 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-328: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"- **Check the artifacts, not the narration.** Open the \" and the successor section \"Judgment Heuristics\" (85 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-89 L1190-1202, target judgment-heuristics-7 L1191-1191, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 49a61ee3 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_bee98ef4ef3d1bbe7f849cf6598667fa",
    "sourceUnitDigest": "6bebda0cc2247a74d1a5ce8cf37daac311177e665e5560dfbba65607f77ef0c2",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1190-1202#unheaded-block-89 (current lines); unit SHA256 6bebda0cc2247a74d1a5ce8cf37daac311177e665e5560dfbba65607f77ef0c2.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1191-1191#judgment-heuristics-7 (current lines); unit SHA256 49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 89\" → \"Judgment Heuristics\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 4 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-89 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 140,
  "factsSHA256": "e78a66cc70ead208feab70444139f56d4b71fbea410f93634d07e5148fb81101",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-89",
    "githubAnchor": "unheaded-block-89",
    "stableAnchor": "unheaded-block-89",
    "title": "Unheaded block 89",
    "startLine": 1190,
    "endLine": 1202,
    "textDigest": "6bebda0cc2247a74d1a5ce8cf37daac311177e665e5560dfbba65607f77ef0c2",
    "sample": "- **Check the artifacts, not the narration.** Open the files. A summary saying\n  three shapers ran independently is not evidence; three prompt files with\n  distinct ordinals and no",
    "identityFingerprint": "2ddefa6b07f5c933c9ea3c9536a38fef7b041ade8eac2feec48e016cada9d7ec",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team",
      "Judgment Heuristics"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Judgment Heuristics",
    "anchor": "judgment-heuristics-7",
    "githubAnchor": "judgment-heuristics-7",
    "stableAnchor": "h-bd30e45c9949",
    "startLine": 1191,
    "endLine": 1191,
    "textDigest": "49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404",
    "sample": "Judgment Heuristics",
    "sectionPayloadDigest": "2434761384ccb2de031148f57853c52535abfe3e5143e433d3b3d631bef78f37",
    "followingBlockDigest": "2434761384ccb2de031148f57853c52535abfe3e5143e433d3b3d631bef78f37",
    "identityFingerprint": "8d427a7e973f75510166dc7fdd79e87e571ccf37a9bfc6aceeddbfd1054304b3",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bee98ef4ef3d1bbe7f849cf6598667fa",
    "sourceUnitDigest": "6bebda0cc2247a74d1a5ce8cf37daac311177e665e5560dfbba65607f77ef0c2",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "judgment-heuristics-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1190-1202#unheaded-block-89 (current lines); unit SHA256 6bebda0cc2247a74d1a5ce8cf37daac311177e665e5560dfbba65607f77ef0c2.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1191-1191#judgment-heuristics-7 (current lines); unit SHA256 49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 89\" → \"Judgment Heuristics\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 4 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-89 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#judgment-heuristics-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / Judgment Heuristics\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "49a61ee3ca395a79116a209a8fb78391226d3f18824b1571703e2eb41578e404",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ]
  }
}
```

## Entry rationale-142

```json
{
  "entryId": "rationale-142",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_0573e67e36361fdac77a24c6fc32b15a",
  "before": {
    "claimId": "claim_0573e67e36361fdac77a24c6fc32b15a",
    "sourceUnitDigest": "4c2aab20db95e027ca27d48633e12cde282be1d1baa35b7b1409ceea2485213b",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1219-1222#unheaded-block-91 (current lines); unit SHA256 4c2aab20db95e027ca27d48633e12cde282be1d1baa35b7b1409ceea2485213b.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1220-1220#handoff-shape-7 (current lines); unit SHA256 bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 91\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-91 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-329: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Produces `redteam.md`: named attacks with what was chec\" and the successor section \"Handoff Shape\" (27 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-91 L1219-1222, target handoff-shape-7 L1220-1220, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause bf048690 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_0573e67e36361fdac77a24c6fc32b15a",
    "sourceUnitDigest": "4c2aab20db95e027ca27d48633e12cde282be1d1baa35b7b1409ceea2485213b",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1219-1222#unheaded-block-91 (current lines); unit SHA256 4c2aab20db95e027ca27d48633e12cde282be1d1baa35b7b1409ceea2485213b.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1220-1220#handoff-shape-7 (current lines); unit SHA256 bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 91\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 6 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-91 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 141,
  "factsSHA256": "b60fec0a17c27c46021375ba5dc0351e0ab7c9f33246a22ae9db92525b4f4e92",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-91",
    "githubAnchor": "unheaded-block-91",
    "stableAnchor": "unheaded-block-91",
    "title": "Unheaded block 91",
    "startLine": 1219,
    "endLine": 1222,
    "textDigest": "4c2aab20db95e027ca27d48633e12cde282be1d1baa35b7b1409ceea2485213b",
    "sample": "Produces `redteam.md`: named attacks with what was checked, what was found, the\nartifact cited, severity, and a verdict of `APPROVE` / `REVISE` /\n`INSUFFICIENT-EVIDENCE`. Never fix",
    "identityFingerprint": "ff830057e1b157c9b8ccd4e8001b4db6659d61eb0955f561d6880f08685280f9",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team",
      "Handoff Shape"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Handoff Shape",
    "anchor": "handoff-shape-7",
    "githubAnchor": "handoff-shape-7",
    "stableAnchor": "h-a154cd86b5fd",
    "startLine": 1220,
    "endLine": 1220,
    "textDigest": "bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc",
    "sample": "Handoff Shape",
    "sectionPayloadDigest": "78b38f2a2eb52e024bdda6008ec32fec664f734429d0bce87dc861a94d7fe7a9",
    "followingBlockDigest": "78b38f2a2eb52e024bdda6008ec32fec664f734429d0bce87dc861a94d7fe7a9",
    "identityFingerprint": "a3bd3721d83b634383cf929abe2c825c71668a9cf47f3bbee1cfc754d2601d11",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_0573e67e36361fdac77a24c6fc32b15a",
    "sourceUnitDigest": "4c2aab20db95e027ca27d48633e12cde282be1d1baa35b7b1409ceea2485213b",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-7",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1219-1222#unheaded-block-91 (current lines); unit SHA256 4c2aab20db95e027ca27d48633e12cde282be1d1baa35b7b1409ceea2485213b.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1220-1220#handoff-shape-7 (current lines); unit SHA256 bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 91\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 6 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-91 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-7; source context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 8. Independent Red-Team\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "bf0486902ed9b2e525a2860eacb27168b3cb51a4c78db9c66ad955d00cd929cc",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "8. Independent Red-Team"
    ]
  }
}
```

## Entry rationale-143

```json
{
  "entryId": "rationale-143",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_6ded96239e6537517b4222fe95101816",
  "before": {
    "claimId": "claim_6ded96239e6537517b4222fe95101816",
    "sourceUnitDigest": "56496b03e29df21363ea7bf1eaa0db74fa622c637736e88d8b65aef3dcdcd0b4",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "posture-8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1318-1320#unheaded-block-97 (current lines); unit SHA256 56496b03e29df21363ea7bf1eaa0db74fa622c637736e88d8b65aef3dcdcd0b4.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1319-1319#posture-8 (current lines); unit SHA256 12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 97\" → \"Posture\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-97 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#posture-8; source context \"Architecture Advisory Role Doctrine / 9. Specialist / Posture\", target context \"Architecture Advisory Role Doctrine / 9. Specialist\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-330: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"It is bound only after driver authorization, because an\" and the successor section \"Posture\" (14 percent of its longer words reappear there); low overlap, the binding rests on the section topic, which I read as the matching successor; facts recomputed equal: source unheaded-block-97 L1318-1320, target posture-8 L1319-1319, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 12a158a8 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_6ded96239e6537517b4222fe95101816",
    "sourceUnitDigest": "56496b03e29df21363ea7bf1eaa0db74fa622c637736e88d8b65aef3dcdcd0b4",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "posture-8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1318-1320#unheaded-block-97 (current lines); unit SHA256 56496b03e29df21363ea7bf1eaa0db74fa622c637736e88d8b65aef3dcdcd0b4.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1319-1319#posture-8 (current lines); unit SHA256 12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 97\" → \"Posture\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 8 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-97 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#posture-8; source context \"Architecture Advisory Role Doctrine / 9. Specialist / Posture\", target context \"Architecture Advisory Role Doctrine / 9. Specialist\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 142,
  "factsSHA256": "857102af71880a19b68bec5deaf7f05ffe23cbd0785adfb2c716c5d6c7f22a4b",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-97",
    "githubAnchor": "unheaded-block-97",
    "stableAnchor": "unheaded-block-97",
    "title": "Unheaded block 97",
    "startLine": 1318,
    "endLine": 1320,
    "textDigest": "56496b03e29df21363ea7bf1eaa0db74fa622c637736e88d8b65aef3dcdcd0b4",
    "sample": "It is bound only after driver authorization, because an unbounded specialist is\njust another advisor with an impressive title and it will expand to opine on the\narchitecture.",
    "identityFingerprint": "caef2bed19dbd06720cf366b2362b779ad3b0ff0f8e94ebfd66f5a104b0002e0",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist",
      "Posture"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Posture",
    "anchor": "posture-8",
    "githubAnchor": "posture-8",
    "stableAnchor": "h-181eaa30227d",
    "startLine": 1319,
    "endLine": 1319,
    "textDigest": "12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce",
    "sample": "Posture",
    "sectionPayloadDigest": "fd333734abb5aec80812aaa18e70cd06ab03d501bdd490edc33d831a7e1a96ae",
    "followingBlockDigest": "aae3e93c248498923d8758a0148ab800b762252181123b6a2272571f4845a395",
    "identityFingerprint": "24a9263dd8ef0bacfdddd91ba9e4f9329f63a436b08a69870fdb1c5421c7de55",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_6ded96239e6537517b4222fe95101816",
    "sourceUnitDigest": "56496b03e29df21363ea7bf1eaa0db74fa622c637736e88d8b65aef3dcdcd0b4",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "posture-8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1318-1320#unheaded-block-97 (current lines); unit SHA256 56496b03e29df21363ea7bf1eaa0db74fa622c637736e88d8b65aef3dcdcd0b4.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1319-1319#posture-8 (current lines); unit SHA256 12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 97\" → \"Posture\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 8 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-97 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#posture-8; source context \"Architecture Advisory Role Doctrine / 9. Specialist / Posture\", target context \"Architecture Advisory Role Doctrine / 9. Specialist\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "12a158a8e0abcc3a45fdd974450f2bb2deaed71d7948389c0d57686d568a12ce",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist"
    ]
  }
}
```

## Entry rationale-144

```json
{
  "entryId": "rationale-144",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_2a6f9a03cf11170e5a4d92f824443ff5",
  "before": {
    "claimId": "claim_2a6f9a03cf11170e5a4d92f824443ff5",
    "sourceUnitDigest": "123c3fbe7d1fd292157346a31074fe66bcba5c7599116e2c37e5857d7627fc63",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1355-1358#unheaded-block-101 (current lines); unit SHA256 123c3fbe7d1fd292157346a31074fe66bcba5c7599116e2c37e5857d7627fc63.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1361-1361#handoff-shape-8 (current lines); unit SHA256 cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 101\" → \"Handoff Shape\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-101 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-8; source context \"Architecture Advisory Role Doctrine / 9. Specialist / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 9. Specialist\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-331: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Produces `proposals/specialist-<topic>.md`: the exact q\" and the successor section \"Handoff Shape\" (31 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-101 L1355-1358, target handoff-shape-8 L1361-1361, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause cbdce16b at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_2a6f9a03cf11170e5a4d92f824443ff5",
    "sourceUnitDigest": "123c3fbe7d1fd292157346a31074fe66bcba5c7599116e2c37e5857d7627fc63",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1355-1358#unheaded-block-101 (current lines); unit SHA256 123c3fbe7d1fd292157346a31074fe66bcba5c7599116e2c37e5857d7627fc63.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1361-1361#handoff-shape-8 (current lines); unit SHA256 cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 101\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-101 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-8; source context \"Architecture Advisory Role Doctrine / 9. Specialist / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 9. Specialist\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 143,
  "factsSHA256": "6314f8fe3a610c16f6cbc4304880930ff7b36ec18d84e2b480edcccf5d20c062",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-101",
    "githubAnchor": "unheaded-block-101",
    "stableAnchor": "unheaded-block-101",
    "title": "Unheaded block 101",
    "startLine": 1355,
    "endLine": 1358,
    "textDigest": "123c3fbe7d1fd292157346a31074fe66bcba5c7599116e2c37e5857d7627fc63",
    "sample": "Produces `proposals/specialist-<topic>.md`: the exact question as authorized, the\nanswer, its confidence and source, whether it changes the panel's options, and an\nexplicit stateme",
    "identityFingerprint": "7d576cd6a5c715a32b6d55f789eda9ba7a7c02c1cfa9745febb3ede785a285e6",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist",
      "Handoff Shape"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Handoff Shape",
    "anchor": "handoff-shape-8",
    "githubAnchor": "handoff-shape-8",
    "stableAnchor": "h-2ac38d169e15",
    "startLine": 1361,
    "endLine": 1361,
    "textDigest": "cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7",
    "sample": "Handoff Shape",
    "sectionPayloadDigest": "d0f8dcbc4a3a96d99bdfbf3215209bb0790b5b5755e959d882a7be436d0070d4",
    "followingBlockDigest": "d0f8dcbc4a3a96d99bdfbf3215209bb0790b5b5755e959d882a7be436d0070d4",
    "identityFingerprint": "857a38bf4130956c91c8e726ce523d79a6320e712e076b6428bf3fa83bf45849",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2a6f9a03cf11170e5a4d92f824443ff5",
    "sourceUnitDigest": "123c3fbe7d1fd292157346a31074fe66bcba5c7599116e2c37e5857d7627fc63",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "handoff-shape-8",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1355-1358#unheaded-block-101 (current lines); unit SHA256 123c3fbe7d1fd292157346a31074fe66bcba5c7599116e2c37e5857d7627fc63.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1361-1361#handoff-shape-8 (current lines); unit SHA256 cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 101\" → \"Handoff Shape\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 5 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-101 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#handoff-shape-8; source context \"Architecture Advisory Role Doctrine / 9. Specialist / Handoff Shape\", target context \"Architecture Advisory Role Doctrine / 9. Specialist\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "cbdce16b55b0e36ed482248556b7110d946371caa41cff6d37f2cd2b4ad054c7",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "9. Specialist"
    ]
  }
}
```

## Entry rationale-145

```json
{
  "entryId": "rationale-145",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_c0dc65d7f7e651cdf170e3080f9ca46b",
  "before": {
    "claimId": "claim_c0dc65d7f7e651cdf170e3080f9ca46b",
    "sourceUnitDigest": "e315a87a274e5daef423ac7c0b9cf16c152189f428d079cd61ac4a34f2ebb11a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "driver-disposition-doctrine",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1419-1422#unheaded-block-105 (current lines); unit SHA256 e315a87a274e5daef423ac7c0b9cf16c152189f428d079cd61ac4a34f2ebb11a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1425-1425#driver-disposition-doctrine (current lines); unit SHA256 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 105\" → \"Driver-Disposition Doctrine\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-105 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-332: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"The external driver — the coordinator — dispositions fi\" and the successor section \"Driver-Disposition Doctrine\" (25 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-105 L1419-1422, target driver-disposition-doctrine L1425-1425, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 9140482a at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_c0dc65d7f7e651cdf170e3080f9ca46b",
    "sourceUnitDigest": "e315a87a274e5daef423ac7c0b9cf16c152189f428d079cd61ac4a34f2ebb11a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "driver-disposition-doctrine",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1419-1422#unheaded-block-105 (current lines); unit SHA256 e315a87a274e5daef423ac7c0b9cf16c152189f428d079cd61ac4a34f2ebb11a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1425-1425#driver-disposition-doctrine (current lines); unit SHA256 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 105\" → \"Driver-Disposition Doctrine\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 4 removed and 10 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-105 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 144,
  "factsSHA256": "836613210d0b64612d9af3805d29646e1c2751ebfa8e440ae8c8703c2519244a",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-105",
    "githubAnchor": "unheaded-block-105",
    "stableAnchor": "unheaded-block-105",
    "title": "Unheaded block 105",
    "startLine": 1419,
    "endLine": 1422,
    "textDigest": "e315a87a274e5daef423ac7c0b9cf16c152189f428d079cd61ac4a34f2ebb11a",
    "sample": "The external driver — the coordinator — dispositions findings, objections, and\nopen points. Disposition is an authority act, not an advisory one. The driver\ndecides what happens to",
    "identityFingerprint": "e8859ef6b32e83984f0a17c8fcb630fbc7132a93e7f2636b00f78d8d1d10642f",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Driver-Disposition Doctrine",
    "anchor": "driver-disposition-doctrine",
    "githubAnchor": "driver-disposition-doctrine",
    "stableAnchor": "h-fb3cfda23e32",
    "startLine": 1425,
    "endLine": 1425,
    "textDigest": "9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f",
    "sample": "Driver-Disposition Doctrine",
    "sectionPayloadDigest": "09b9646f1a570d162db61330feb6d5a5ca13263968ce8cbd79fd3c2765a562a0",
    "followingBlockDigest": "17d6f1a388e1175e32aa41fa006d792904f000307fa7295adf72596ddd8eaab9",
    "identityFingerprint": "4b8234d07b269406a692e7306dd63dd29259d806f96c1e001d01b4e3b14fc17a",
    "ancestry": [
      "Architecture Advisory Role Doctrine"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c0dc65d7f7e651cdf170e3080f9ca46b",
    "sourceUnitDigest": "e315a87a274e5daef423ac7c0b9cf16c152189f428d079cd61ac4a34f2ebb11a",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "driver-disposition-doctrine",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1419-1422#unheaded-block-105 (current lines); unit SHA256 e315a87a274e5daef423ac7c0b9cf16c152189f428d079cd61ac4a34f2ebb11a.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1425-1425#driver-disposition-doctrine (current lines); unit SHA256 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 105\" → \"Driver-Disposition Doctrine\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 4 removed and 10 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-105 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine"
    ]
  }
}
```

## Entry rationale-146

```json
{
  "entryId": "rationale-146",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_d914a73cf88e15ff256bb747a338fecc",
  "before": {
    "claimId": "claim_d914a73cf88e15ff256bb747a338fecc",
    "sourceUnitDigest": "434f98d3ca7c6c8778e57c0d36b738f20ff321a610398f173e77528492963812",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "driver-disposition-doctrine",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1424-1427#unheaded-block-106 (current lines); unit SHA256 434f98d3ca7c6c8778e57c0d36b738f20ff321a610398f173e77528492963812.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1425-1425#driver-disposition-doctrine (current lines); unit SHA256 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 106\" → \"Driver-Disposition Doctrine\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-106 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-333: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"Every disposition is appended to `dispositions.md` with\" and the successor section \"Driver-Disposition Doctrine\" (23 percent of its longer words reappear there); low overlap, the binding rests on the section topic, which I read as the matching successor; facts recomputed equal: source unheaded-block-106 L1424-1427, target driver-disposition-doctrine L1425-1425, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 9140482a at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_d914a73cf88e15ff256bb747a338fecc",
    "sourceUnitDigest": "434f98d3ca7c6c8778e57c0d36b738f20ff321a610398f173e77528492963812",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "driver-disposition-doctrine",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1424-1427#unheaded-block-106 (current lines); unit SHA256 434f98d3ca7c6c8778e57c0d36b738f20ff321a610398f173e77528492963812.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1425-1425#driver-disposition-doctrine (current lines); unit SHA256 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 106\" → \"Driver-Disposition Doctrine\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 4 removed and 10 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-106 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 145,
  "factsSHA256": "3583a229e4d38dcefa02d3c978538a71f0e7dc95efeed07993bc7fdf1fbc92a4",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-106",
    "githubAnchor": "unheaded-block-106",
    "stableAnchor": "unheaded-block-106",
    "title": "Unheaded block 106",
    "startLine": 1424,
    "endLine": 1427,
    "textDigest": "434f98d3ca7c6c8778e57c0d36b738f20ff321a610398f173e77528492963812",
    "sample": "Every disposition is appended to `dispositions.md` with the finding id, the\ndisposition, a rationale, and an evidence reference. Dispositions are never\nedited; a changed mind is a ",
    "identityFingerprint": "0d9f0bcf4141d757e87441c86a9bc0e8e1ed799b4e7ffb54bdba1e37ea6f5f5c",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Driver-Disposition Doctrine",
    "anchor": "driver-disposition-doctrine",
    "githubAnchor": "driver-disposition-doctrine",
    "stableAnchor": "h-fb3cfda23e32",
    "startLine": 1425,
    "endLine": 1425,
    "textDigest": "9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f",
    "sample": "Driver-Disposition Doctrine",
    "sectionPayloadDigest": "09b9646f1a570d162db61330feb6d5a5ca13263968ce8cbd79fd3c2765a562a0",
    "followingBlockDigest": "17d6f1a388e1175e32aa41fa006d792904f000307fa7295adf72596ddd8eaab9",
    "identityFingerprint": "4b8234d07b269406a692e7306dd63dd29259d806f96c1e001d01b4e3b14fc17a",
    "ancestry": [
      "Architecture Advisory Role Doctrine"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d914a73cf88e15ff256bb747a338fecc",
    "sourceUnitDigest": "434f98d3ca7c6c8778e57c0d36b738f20ff321a610398f173e77528492963812",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "driver-disposition-doctrine",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1424-1427#unheaded-block-106 (current lines); unit SHA256 434f98d3ca7c6c8778e57c0d36b738f20ff321a610398f173e77528492963812.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1425-1425#driver-disposition-doctrine (current lines); unit SHA256 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 2; title \"Unheaded block 106\" → \"Driver-Disposition Doctrine\".\nWhole direct section differs; depth block → 2; 0 distinct link changes; normalized line order differs; 4 removed and 10 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-106 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#driver-disposition-doctrine; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9140482a9b73b69b0ce3b45fe052269377e16dbfd1cd970b9bf673758c0b644f",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine"
    ]
  }
}
```

## Entry rationale-147

```json
{
  "entryId": "rationale-147",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_857665a7f9ff1b6866fa898b07684233",
  "before": {
    "claimId": "claim_857665a7f9ff1b6866fa898b07684233",
    "sourceUnitDigest": "85e4da34f1694d6cf43176751973e951bff9a748c9b279ad43e509b0741b6bd5",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "the-six-dispositions",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1445-1448#unheaded-block-110 (current lines); unit SHA256 85e4da34f1694d6cf43176751973e951bff9a748c9b279ad43e509b0741b6bd5.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1438-1438#the-six-dispositions (current lines); unit SHA256 ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 110\" → \"The Six Dispositions\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-110 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#the-six-dispositions; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / The Six Dispositions\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-334: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"**`deferred`** — valid, but outside this decision's sco\" and the successor section \"The Six Dispositions\" (63 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-110 L1445-1448, target the-six-dispositions L1438-1438, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause ae5ad98a at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_857665a7f9ff1b6866fa898b07684233",
    "sourceUnitDigest": "85e4da34f1694d6cf43176751973e951bff9a748c9b279ad43e509b0741b6bd5",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "the-six-dispositions",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1445-1448#unheaded-block-110 (current lines); unit SHA256 85e4da34f1694d6cf43176751973e951bff9a748c9b279ad43e509b0741b6bd5.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1438-1438#the-six-dispositions (current lines); unit SHA256 ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 110\" → \"The Six Dispositions\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 23 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-110 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#the-six-dispositions; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / The Six Dispositions\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 146,
  "factsSHA256": "831707359d743ea2006d7fe5267432facfd43d719e3532839d0074c1ab7f4c18",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-110",
    "githubAnchor": "unheaded-block-110",
    "stableAnchor": "unheaded-block-110",
    "title": "Unheaded block 110",
    "startLine": 1445,
    "endLine": 1448,
    "textDigest": "85e4da34f1694d6cf43176751973e951bff9a748c9b279ad43e509b0741b6bd5",
    "sample": "**`deferred`** — valid, but outside this decision's scope. Requires naming where\nit belongs and what triggers revisiting. Deferral is the one disposition the\ndriver may make entire",
    "identityFingerprint": "2510e403a5aadc07fc2f5aaa17e3b754f8afe70a1b7e7bf9f6dc0885171b9239",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine",
      "The Six Dispositions"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "The Six Dispositions",
    "anchor": "the-six-dispositions",
    "githubAnchor": "the-six-dispositions",
    "stableAnchor": "h-b9b24dfd8751",
    "startLine": 1438,
    "endLine": 1438,
    "textDigest": "ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9",
    "sample": "The Six Dispositions",
    "sectionPayloadDigest": "6308746d8bffe9aca94800da97706cda15caf0362474f646beaf4cbd8905f246",
    "followingBlockDigest": "55b6124a6b5c1487e9f7f5510a974b5a7f3a9b00c5f44943526ffaf29453c55b",
    "identityFingerprint": "669da2829fb8224ed823d40e85d0e26331e1dd33f31922617d3dcf9c654b1dc1",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_857665a7f9ff1b6866fa898b07684233",
    "sourceUnitDigest": "85e4da34f1694d6cf43176751973e951bff9a748c9b279ad43e509b0741b6bd5",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "the-six-dispositions",
    "claimKind": "decision",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1445-1448#unheaded-block-110 (current lines); unit SHA256 85e4da34f1694d6cf43176751973e951bff9a748c9b279ad43e509b0741b6bd5.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1438-1438#the-six-dispositions (current lines); unit SHA256 ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 110\" → \"The Six Dispositions\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 4 removed and 23 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-110 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#the-six-dispositions; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / The Six Dispositions\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ae5ad98a8d9ed7fd9316a2e61dbf8904059bbc39033b6e97f9d09535f45ec8a9",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  }
}
```

## Entry rationale-148

```json
{
  "entryId": "rationale-148",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_fb92651ea85a64c0b6e806926e51a4b2",
  "before": {
    "claimId": "claim_fb92651ea85a64c0b6e806926e51a4b2",
    "sourceUnitDigest": "ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1460-1460#when-the-driver-must-not-disposition-alone (current lines); unit SHA256 ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"When The Driver Must Not Disposition Alone\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#when-the-driver-must-not-disposition-alone under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-335: deep: supersede (heading to heading, depth line recomputed equal), texts differ so the not-an-equal-digest-copy sentence is true; source starts \"### When The Driver Must Not Disposition Alone\" and the successor section \"Evidence And Conduct Boundaries\" (66 percent of its longer words reappear there); facts recomputed equal: source when-the-driver-must-not-disposition-alone L1460-1460, target evidence-and-conduct-boundaries L1468-1468, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 82e4b520 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_fb92651ea85a64c0b6e806926e51a4b2",
    "sourceUnitDigest": "ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1460-1460#when-the-driver-must-not-disposition-alone (current lines); unit SHA256 ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"When The Driver Must Not Disposition Alone\" → \"Evidence And Conduct Boundaries\".\nWhole direct section differs; depth 3 → 3; 0 distinct link changes; normalized line order differs; 18 removed and 14 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"When The Driver Must Not Disposition Alone\" → \"Evidence And Conduct Boundaries\"; 0 distinct link spelling/label changes; 1 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Former driver-specific rules remain as the complete source section in docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-role-doctrine.md#literal-snapshot; current-Workflow evidence/conduct wording is explicitly labelled in the successor. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\",\"about PROJECT_ROOT or the panel's artifacts (`SKILL.md:124-128`):\",\"- **Invalidation:** cite a real observation, not the producer's unsupported\",\"  explanation for why dissent would be inconvenient.\",\"- **Answer:** cite the artifact that answers the concern.\",\"- **Mitigation:** identify the concrete mitigation and remaining risk; do not\",\"  invent advisor evidence or imply a mitigation was run merely because it is\",\"  written down.\",\"- **Conduct/isolation:** do not self-clear a breach as answered or invalidated.\",\"  Preserve it for an independent authority or the owner.\",\"Accepted and deferred findings retain their consequence, scope and trigger.\",\"Neither disposition automatically approves implementation or replaces the\",\"declared Workflow human gate. Manual-driver examples below illustrate these\",\"invariants, not a current runtime actor.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json; exact section delta: removed [\"The driver must obtain another advisor's evidence before dispositioning whenever\",\"the disposition turns on a claim about PROJECT_ROOT or about the panel's own\",\"artifacts. Concretely:\",\"- **`invalidated-by-evidence` always requires an advisor's observation.** The\",\"  driver asserting a fact about the code it has not been shown is opining inside\",\"  an authority role, which is the exact failure the role separation exists to\",\"  prevent — and it is invisible in the final packet unless a red-team catches it.\",\"- **`answered` requires a citation to an existing artifact.** If the driver\",\"  cannot point at the file and section, it has not been answered.\",\"- **`mitigated` requires the mitigation to be authored by an advisor.** The\",\"  driver may authorize a mitigation; it may not design one. Designing one is\",\"  advisory work performed by the authority that will later judge it.\",\"- **A disposition of a finding about the driver's own conduct** — an authority\",\"  violation, an isolation breach, a fabricated turn — must not be self-\",\"  dispositioned as `answered` or `invalidated-by-evidence`. Escalate it to the\",\"  person or to an independent role. Self-clearing is never legitimate here.\",\"The driver may always disposition alone on scope (`deferred`), and on accepting a\",\"finding (`accepted`) — accepting costs nothing that needs guarding.\"]; added [\"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\",\"about PROJECT_ROOT or the panel's artifacts (`SKILL.md:124-128`):\",\"- **Invalidation:** cite a real observation, not the producer's unsupported\",\"  explanation for why dissent would be inconvenient.\",\"- **Answer:** cite the artifact that answers the concern.\",\"- **Mitigation:** identify the concrete mitigation and remaining risk; do not\",\"  invent advisor evidence or imply a mitigation was run merely because it is\",\"  written down.\",\"- **Conduct/isolation:** do not self-clear a breach as answered or invalidated.\",\"  Preserve it for an independent authority or the owner.\",\"Accepted and deferred findings retain their consequence, scope and trigger.\",\"Neither disposition automatically approves implementation or replaces the\",\"declared Workflow human gate. Manual-driver examples below illustrate these\",\"invariants, not a current runtime actor.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections:\nL10-31/explicit-section-correction [intermediate state; witness 9b0526380]: \"Current packet dispositions require actual evidence when they turn on claims\" → \"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#when-the-driver-must-not-disposition-alone under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 147,
  "factsSHA256": "155129a226d2ca233b643d66fc2c754b954e7aa80268a94c6c2823d6e70d5688",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "When The Driver Must Not Disposition Alone",
    "anchor": "when-the-driver-must-not-disposition-alone",
    "githubAnchor": "when-the-driver-must-not-disposition-alone",
    "stableAnchor": "h-ba2d931adb7e",
    "startLine": 1460,
    "endLine": 1460,
    "textDigest": "ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d",
    "sample": "When The Driver Must Not Disposition Alone",
    "sectionPayloadDigest": "cbddfd168546cbee40f2db8933dd5b476a3c1c4b690403d9825d14b7867eea27",
    "followingBlockDigest": "cb45e9a4f84c16ea35ed910d64ca9720bda9194e7a691a453be080ba5d950770",
    "identityFingerprint": "aa068a1341e56dd643e523a953e90829202b31202d4f6bf4140e1c7221bd0157",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Evidence And Conduct Boundaries",
    "anchor": "evidence-and-conduct-boundaries",
    "githubAnchor": "evidence-and-conduct-boundaries",
    "stableAnchor": "h-d5584b2416c9",
    "startLine": 1468,
    "endLine": 1468,
    "textDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "sample": "Evidence And Conduct Boundaries",
    "sectionPayloadDigest": "35be01fe2f7f42d203d6916a558b9bde52f9620cbc72fd3fb27ff8ef50ed1df1",
    "followingBlockDigest": "7486a9e911dc83dd8182817e3d51bccd7b2e95a87b245307e19b3dd1de9fbb34",
    "identityFingerprint": "f39ebd529eeb38692ae7bb1aa2e66a4fa6bd0165843cee2760f379eb75e262e9",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 3 → 3, title \"When The Driver Must Not Disposition Alone\" → \"Evidence And Conduct Boundaries\"; 0 distinct link spelling/label changes; 1 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Former driver-specific rules remain as the complete source section in docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-role-doctrine.md#literal-snapshot; current-Workflow evidence/conduct wording is explicitly labelled in the successor. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\",\"about PROJECT_ROOT or the panel's artifacts (`SKILL.md:124-128`):\",\"- **Invalidation:** cite a real observation, not the producer's unsupported\",\"  explanation for why dissent would be inconvenient.\",\"- **Answer:** cite the artifact that answers the concern.\",\"- **Mitigation:** identify the concrete mitigation and remaining risk; do not\",\"  invent advisor evidence or imply a mitigation was run merely because it is\",\"  written down.\",\"- **Conduct/isolation:** do not self-clear a breach as answered or invalidated.\",\"  Preserve it for an independent authority or the owner.\",\"Accepted and deferred findings retain their consequence, scope and trigger.\",\"Neither disposition automatically approves implementation or replaces the\",\"declared Workflow human gate. Manual-driver examples below illustrate these\",\"invariants, not a current runtime actor.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json; exact section delta: removed [\"The driver must obtain another advisor's evidence before dispositioning whenever\",\"the disposition turns on a claim about PROJECT_ROOT or about the panel's own\",\"artifacts. Concretely:\",\"- **`invalidated-by-evidence` always requires an advisor's observation.** The\",\"  driver asserting a fact about the code it has not been shown is opining inside\",\"  an authority role, which is the exact failure the role separation exists to\",\"  prevent — and it is invisible in the final packet unless a red-team catches it.\",\"- **`answered` requires a citation to an existing artifact.** If the driver\",\"  cannot point at the file and section, it has not been answered.\",\"- **`mitigated` requires the mitigation to be authored by an advisor.** The\",\"  driver may authorize a mitigation; it may not design one. Designing one is\",\"  advisory work performed by the authority that will later judge it.\",\"- **A disposition of a finding about the driver's own conduct** — an authority\",\"  violation, an isolation breach, a fabricated turn — must not be self-\",\"  dispositioned as `answered` or `invalidated-by-evidence`. Escalate it to the\",\"  person or to an independent role. Self-clearing is never legitimate here.\",\"The driver may always disposition alone on scope (`deferred`), and on accepting a\",\"finding (`accepted`) — accepting costs nothing that needs guarding.\"]; added [\"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\",\"about PROJECT_ROOT or the panel's artifacts (`SKILL.md:124-128`):\",\"- **Invalidation:** cite a real observation, not the producer's unsupported\",\"  explanation for why dissent would be inconvenient.\",\"- **Answer:** cite the artifact that answers the concern.\",\"- **Mitigation:** identify the concrete mitigation and remaining risk; do not\",\"  invent advisor evidence or imply a mitigation was run merely because it is\",\"  written down.\",\"- **Conduct/isolation:** do not self-clear a breach as answered or invalidated.\",\"  Preserve it for an independent authority or the owner.\",\"Accepted and deferred findings retain their consequence, scope and trigger.\",\"Neither disposition automatically approves implementation or replaces the\",\"declared Workflow human gate. Manual-driver examples below illustrate these\",\"invariants, not a current runtime actor.\"]. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/147/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample. This row has a pending native-dependent prose overlay; review the packageOverlayAfter at the runner package commit. The content-pin snapshot remains immutable history.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_fb92651ea85a64c0b6e806926e51a4b2",
    "sourceUnitDigest": "ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1460-1460#when-the-driver-must-not-disposition-alone (current lines); unit SHA256 ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"When The Driver Must Not Disposition Alone\" → \"Evidence And Conduct Boundaries\".\nWhole direct section differs; depth 3 → 3; 0 distinct link changes; normalized line order differs; 18 removed and 14 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"When The Driver Must Not Disposition Alone\" → \"Evidence And Conduct Boundaries\"; 0 distinct link spelling/label changes; 1 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Former driver-specific rules remain as the complete source section in docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-role-doctrine.md#literal-snapshot; current-Workflow evidence/conduct wording is explicitly labelled in the successor. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\",\"about PROJECT_ROOT or the panel's artifacts (`SKILL.md:124-128`):\",\"- **Invalidation:** cite a real observation, not the producer's unsupported\",\"  explanation for why dissent would be inconvenient.\",\"- **Answer:** cite the artifact that answers the concern.\",\"- **Mitigation:** identify the concrete mitigation and remaining risk; do not\",\"  invent advisor evidence or imply a mitigation was run merely because it is\",\"  written down.\",\"- **Conduct/isolation:** do not self-clear a breach as answered or invalidated.\",\"  Preserve it for an independent authority or the owner.\",\"Accepted and deferred findings retain their consequence, scope and trigger.\",\"Neither disposition automatically approves implementation or replaces the\",\"declared Workflow human gate. Manual-driver examples below illustrate these\",\"invariants, not a current runtime actor.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json; exact section delta: removed [\"The driver must obtain another advisor's evidence before dispositioning whenever\",\"the disposition turns on a claim about PROJECT_ROOT or about the panel's own\",\"artifacts. Concretely:\",\"- **`invalidated-by-evidence` always requires an advisor's observation.** The\",\"  driver asserting a fact about the code it has not been shown is opining inside\",\"  an authority role, which is the exact failure the role separation exists to\",\"  prevent — and it is invisible in the final packet unless a red-team catches it.\",\"- **`answered` requires a citation to an existing artifact.** If the driver\",\"  cannot point at the file and section, it has not been answered.\",\"- **`mitigated` requires the mitigation to be authored by an advisor.** The\",\"  driver may authorize a mitigation; it may not design one. Designing one is\",\"  advisory work performed by the authority that will later judge it.\",\"- **A disposition of a finding about the driver's own conduct** — an authority\",\"  violation, an isolation breach, a fabricated turn — must not be self-\",\"  dispositioned as `answered` or `invalidated-by-evidence`. Escalate it to the\",\"  person or to an independent role. Self-clearing is never legitimate here.\",\"The driver may always disposition alone on scope (`deferred`), and on accepting a\",\"finding (`accepted`) — accepting costs nothing that needs guarding.\"]; added [\"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\",\"about PROJECT_ROOT or the panel's artifacts (`SKILL.md:124-128`):\",\"- **Invalidation:** cite a real observation, not the producer's unsupported\",\"  explanation for why dissent would be inconvenient.\",\"- **Answer:** cite the artifact that answers the concern.\",\"- **Mitigation:** identify the concrete mitigation and remaining risk; do not\",\"  invent advisor evidence or imply a mitigation was run merely because it is\",\"  written down.\",\"- **Conduct/isolation:** do not self-clear a breach as answered or invalidated.\",\"  Preserve it for an independent authority or the owner.\",\"Accepted and deferred findings retain their consequence, scope and trigger.\",\"Neither disposition automatically approves implementation or replaces the\",\"declared Workflow human gate. Manual-driver examples below illustrate these\",\"invariants, not a current runtime actor.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections:\nL10-31/explicit-section-correction [intermediate state; witness 9b0526380]: \"Current packet dispositions require actual evidence when they turn on claims\" → \"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#when-the-driver-must-not-disposition-alone under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  },
  "packageOverlayAfter": {
    "claimId": "claim_fb92651ea85a64c0b6e806926e51a4b2",
    "sourceUnitDigest": "ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1460-1460#when-the-driver-must-not-disposition-alone (current lines); unit SHA256 ee8907a2f12410887101fab337f085440903f2ece580174b69146302968cec4d.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"When The Driver Must Not Disposition Alone\" → \"Evidence And Conduct Boundaries\".\nWhole direct section differs; depth 3 → 3; 0 distinct link changes; normalized line order differs; 18 removed and 14 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"When The Driver Must Not Disposition Alone\" → \"Evidence And Conduct Boundaries\"; 0 distinct link spelling/label changes; 1 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Former driver-specific rules remain as the complete source section in docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-role-doctrine.md#literal-snapshot; current-Workflow evidence/conduct wording is explicitly labelled in the successor. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\",\"about PROJECT_ROOT or the panel's artifacts (`SKILL.md:124-128`):\",\"- **Invalidation:** cite a real observation, not the producer's unsupported\",\"  explanation for why dissent would be inconvenient.\",\"- **Answer:** cite the artifact that answers the concern.\",\"- **Mitigation:** identify the concrete mitigation and remaining risk; do not\",\"  invent advisor evidence or imply a mitigation was run merely because it is\",\"  written down.\",\"- **Conduct/isolation:** do not self-clear a breach as answered or invalidated.\",\"  Preserve it for an independent authority or the owner.\",\"Accepted and deferred findings retain their consequence, scope and trigger.\",\"Neither disposition automatically approves implementation or replaces the\",\"declared Workflow human gate. Manual-driver examples below illustrate these\",\"invariants, not a current runtime actor.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries, docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-117. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json; exact section delta: removed [\"The driver must obtain another advisor's evidence before dispositioning whenever\",\"the disposition turns on a claim about PROJECT_ROOT or about the panel's own\",\"artifacts. Concretely:\",\"- **`invalidated-by-evidence` always requires an advisor's observation.** The\",\"  driver asserting a fact about the code it has not been shown is opining inside\",\"  an authority role, which is the exact failure the role separation exists to\",\"  prevent — and it is invisible in the final packet unless a red-team catches it.\",\"- **`answered` requires a citation to an existing artifact.** If the driver\",\"  cannot point at the file and section, it has not been answered.\",\"- **`mitigated` requires the mitigation to be authored by an advisor.** The\",\"  driver may authorize a mitigation; it may not design one. Designing one is\",\"  advisory work performed by the authority that will later judge it.\",\"- **A disposition of a finding about the driver's own conduct** — an authority\",\"  violation, an isolation breach, a fabricated turn — must not be self-\",\"  dispositioned as `answered` or `invalidated-by-evidence`. Escalate it to the\",\"  person or to an independent role. Self-clearing is never legitimate here.\",\"The driver may always disposition alone on scope (`deferred`), and on accepting a\",\"finding (`accepted`) — accepting costs nothing that needs guarding.\"]; added [\"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\",\"about PROJECT_ROOT or the panel's artifacts (`SKILL.md:124-128`):\",\"- **Invalidation:** cite a real observation, not the producer's unsupported\",\"  explanation for why dissent would be inconvenient.\",\"- **Answer:** cite the artifact that answers the concern.\",\"- **Mitigation:** identify the concrete mitigation and remaining risk; do not\",\"  invent advisor evidence or imply a mitigation was run merely because it is\",\"  written down.\",\"- **Conduct/isolation:** do not self-clear a breach as answered or invalidated.\",\"  Preserve it for an independent authority or the owner.\",\"Accepted and deferred findings retain their consequence, scope and trigger.\",\"Neither disposition automatically approves implementation or replaces the\",\"declared Workflow human gate. Manual-driver examples below illustrate these\",\"invariants, not a current runtime actor.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections:\nL10-31/explicit-section-correction [intermediate state; witness 9b0526380]: \"Current packet dispositions require actual evidence when they turn on claims\" → \"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#when-the-driver-must-not-disposition-alone under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "reviewNote": "Pending native-dependent section witness refresh; no approval carried."
  },
  "packageOverlayWitness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-native-dependent-refresh.json",
  "packageOverlayAuthorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16"
}
```

## Entry rationale-149

```json
{
  "entryId": "rationale-149",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_7759181bd522af266855f849ecf8143a",
  "before": {
    "claimId": "claim_7759181bd522af266855f849ecf8143a",
    "sourceUnitDigest": "cb45e9a4f84c16ea35ed910d64ca9720bda9194e7a691a453be080ba5d950770",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1462-1464#unheaded-block-113 (current lines); unit SHA256 cb45e9a4f84c16ea35ed910d64ca9720bda9194e7a691a453be080ba5d950770.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 113\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-113 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-336: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"The driver must obtain another advisor's evidence befor\" and the successor section \"Evidence And Conduct Boundaries\" (50 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-113 L1462-1464, target evidence-and-conduct-boundaries L1468-1468, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 82e4b520 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_7759181bd522af266855f849ecf8143a",
    "sourceUnitDigest": "cb45e9a4f84c16ea35ed910d64ca9720bda9194e7a691a453be080ba5d950770",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1462-1464#unheaded-block-113 (current lines); unit SHA256 cb45e9a4f84c16ea35ed910d64ca9720bda9194e7a691a453be080ba5d950770.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 113\" → \"Evidence And Conduct Boundaries\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 15 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections:\nL10-31/explicit-section-correction [intermediate state; witness 9b0526380]: \"Current packet dispositions require actual evidence when they turn on claims\" → \"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-113 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 148,
  "factsSHA256": "02d456822f111b6b90394e87f5e2a5d2606ffd0c4f7daa2ddd0f3a164f1460c9",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-113",
    "githubAnchor": "unheaded-block-113",
    "stableAnchor": "unheaded-block-113",
    "title": "Unheaded block 113",
    "startLine": 1462,
    "endLine": 1464,
    "textDigest": "cb45e9a4f84c16ea35ed910d64ca9720bda9194e7a691a453be080ba5d950770",
    "sample": "The driver must obtain another advisor's evidence before dispositioning whenever\nthe disposition turns on a claim about PROJECT_ROOT or about the panel's own\nartifacts. Concretely:",
    "identityFingerprint": "cc5ac5561e01940ac23a558e3caa77cb2916a593faddf55a712eceaac61efc05",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine",
      "When The Driver Must Not Disposition Alone"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Evidence And Conduct Boundaries",
    "anchor": "evidence-and-conduct-boundaries",
    "githubAnchor": "evidence-and-conduct-boundaries",
    "stableAnchor": "h-d5584b2416c9",
    "startLine": 1468,
    "endLine": 1468,
    "textDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "sample": "Evidence And Conduct Boundaries",
    "sectionPayloadDigest": "35be01fe2f7f42d203d6916a558b9bde52f9620cbc72fd3fb27ff8ef50ed1df1",
    "followingBlockDigest": "7486a9e911dc83dd8182817e3d51bccd7b2e95a87b245307e19b3dd1de9fbb34",
    "identityFingerprint": "f39ebd529eeb38692ae7bb1aa2e66a4fa6bd0165843cee2760f379eb75e262e9",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7759181bd522af266855f849ecf8143a",
    "sourceUnitDigest": "cb45e9a4f84c16ea35ed910d64ca9720bda9194e7a691a453be080ba5d950770",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1462-1464#unheaded-block-113 (current lines); unit SHA256 cb45e9a4f84c16ea35ed910d64ca9720bda9194e7a691a453be080ba5d950770.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 113\" → \"Evidence And Conduct Boundaries\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 3 removed and 15 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections:\nL10-31/explicit-section-correction [intermediate state; witness 9b0526380]: \"Current packet dispositions require actual evidence when they turn on claims\" → \"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-113 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  }
}
```

## Entry rationale-150

```json
{
  "entryId": "rationale-150",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_9568b972846dae2fe0984168520d2cdf",
  "before": {
    "claimId": "claim_9568b972846dae2fe0984168520d2cdf",
    "sourceUnitDigest": "3b07fc5702a3a2ee4dfbe572497935d9c9ebe9f02b57940734913a17b8d95208",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1466-1478#unheaded-block-114 (current lines); unit SHA256 3b07fc5702a3a2ee4dfbe572497935d9c9ebe9f02b57940734913a17b8d95208.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 114\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-114 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-337: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"- **`invalidated-by-evidence` always requires an adviso\" and the successor section \"Evidence And Conduct Boundaries\" (29 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-114 L1466-1478, target evidence-and-conduct-boundaries L1468-1468, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 82e4b520 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_9568b972846dae2fe0984168520d2cdf",
    "sourceUnitDigest": "3b07fc5702a3a2ee4dfbe572497935d9c9ebe9f02b57940734913a17b8d95208",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1466-1478#unheaded-block-114 (current lines); unit SHA256 3b07fc5702a3a2ee4dfbe572497935d9c9ebe9f02b57940734913a17b8d95208.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 114\" → \"Evidence And Conduct Boundaries\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 13 removed and 15 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections:\nL10-31/explicit-section-correction [intermediate state; witness 9b0526380]: \"Current packet dispositions require actual evidence when they turn on claims\" → \"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-114 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 149,
  "factsSHA256": "956dbadb893ad6c1c51674df59aa2d1e10efd08e2d8b8815b8bb23af58b58687",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-114",
    "githubAnchor": "unheaded-block-114",
    "stableAnchor": "unheaded-block-114",
    "title": "Unheaded block 114",
    "startLine": 1466,
    "endLine": 1478,
    "textDigest": "3b07fc5702a3a2ee4dfbe572497935d9c9ebe9f02b57940734913a17b8d95208",
    "sample": "- **`invalidated-by-evidence` always requires an advisor's observation.** The\n  driver asserting a fact about the code it has not been shown is opining inside\n  an authority role, ",
    "identityFingerprint": "9d964ef20adfb86e8e3de9931fd6d625fb22d6ab11ab8520d65c1ed232e14929",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine",
      "When The Driver Must Not Disposition Alone"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Evidence And Conduct Boundaries",
    "anchor": "evidence-and-conduct-boundaries",
    "githubAnchor": "evidence-and-conduct-boundaries",
    "stableAnchor": "h-d5584b2416c9",
    "startLine": 1468,
    "endLine": 1468,
    "textDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "sample": "Evidence And Conduct Boundaries",
    "sectionPayloadDigest": "35be01fe2f7f42d203d6916a558b9bde52f9620cbc72fd3fb27ff8ef50ed1df1",
    "followingBlockDigest": "7486a9e911dc83dd8182817e3d51bccd7b2e95a87b245307e19b3dd1de9fbb34",
    "identityFingerprint": "f39ebd529eeb38692ae7bb1aa2e66a4fa6bd0165843cee2760f379eb75e262e9",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9568b972846dae2fe0984168520d2cdf",
    "sourceUnitDigest": "3b07fc5702a3a2ee4dfbe572497935d9c9ebe9f02b57940734913a17b8d95208",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1466-1478#unheaded-block-114 (current lines); unit SHA256 3b07fc5702a3a2ee4dfbe572497935d9c9ebe9f02b57940734913a17b8d95208.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 114\" → \"Evidence And Conduct Boundaries\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 13 removed and 15 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections:\nL10-31/explicit-section-correction [intermediate state; witness 9b0526380]: \"Current packet dispositions require actual evidence when they turn on claims\" → \"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-114 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  }
}
```

## Entry rationale-151

```json
{
  "entryId": "rationale-151",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_f0516f596a66ef71d4f7e2a318b98e57",
  "before": {
    "claimId": "claim_f0516f596a66ef71d4f7e2a318b98e57",
    "sourceUnitDigest": "42c8ea4fd6902a98827d5a550460f5890ac73cc2f41b86a8c978721474870eb9",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1480-1481#unheaded-block-115 (current lines); unit SHA256 42c8ea4fd6902a98827d5a550460f5890ac73cc2f41b86a8c978721474870eb9.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 115\" → \"Evidence And Conduct Boundaries\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-115 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-338: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"The driver may always disposition alone on scope (`defe\" and the successor section \"Evidence And Conduct Boundaries\" (38 percent of its longer words reappear there); facts recomputed equal: source unheaded-block-115 L1480-1481, target evidence-and-conduct-boundaries L1468-1468, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 82e4b520 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_f0516f596a66ef71d4f7e2a318b98e57",
    "sourceUnitDigest": "42c8ea4fd6902a98827d5a550460f5890ac73cc2f41b86a8c978721474870eb9",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1480-1481#unheaded-block-115 (current lines); unit SHA256 42c8ea4fd6902a98827d5a550460f5890ac73cc2f41b86a8c978721474870eb9.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 115\" → \"Evidence And Conduct Boundaries\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 2 removed and 15 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections:\nL10-31/explicit-section-correction [intermediate state; witness 9b0526380]: \"Current packet dispositions require actual evidence when they turn on claims\" → \"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-115 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 150,
  "factsSHA256": "bd14ded3484d9e56d7e55a1bcd6c895b8715ffff49f6cd96f967d6a3997a28f6",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-115",
    "githubAnchor": "unheaded-block-115",
    "stableAnchor": "unheaded-block-115",
    "title": "Unheaded block 115",
    "startLine": 1480,
    "endLine": 1481,
    "textDigest": "42c8ea4fd6902a98827d5a550460f5890ac73cc2f41b86a8c978721474870eb9",
    "sample": "The driver may always disposition alone on scope (`deferred`), and on accepting a\nfinding (`accepted`) — accepting costs nothing that needs guarding.",
    "identityFingerprint": "b0b12c8340ba943f4e085c9dda1dfe88a564f25ef160b20f069a7513539dee83",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine",
      "When The Driver Must Not Disposition Alone"
    ],
    "path": "docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Evidence And Conduct Boundaries",
    "anchor": "evidence-and-conduct-boundaries",
    "githubAnchor": "evidence-and-conduct-boundaries",
    "stableAnchor": "h-d5584b2416c9",
    "startLine": 1468,
    "endLine": 1468,
    "textDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "sample": "Evidence And Conduct Boundaries",
    "sectionPayloadDigest": "35be01fe2f7f42d203d6916a558b9bde52f9620cbc72fd3fb27ff8ef50ed1df1",
    "followingBlockDigest": "7486a9e911dc83dd8182817e3d51bccd7b2e95a87b245307e19b3dd1de9fbb34",
    "identityFingerprint": "f39ebd529eeb38692ae7bb1aa2e66a4fa6bd0165843cee2760f379eb75e262e9",
    "ancestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ],
    "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f0516f596a66ef71d4f7e2a318b98e57",
    "sourceUnitDigest": "42c8ea4fd6902a98827d5a550460f5890ac73cc2f41b86a8c978721474870eb9",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "evidence-and-conduct-boundaries",
    "claimKind": "architecture",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1480-1481#unheaded-block-115 (current lines); unit SHA256 42c8ea4fd6902a98827d5a550460f5890ac73cc2f41b86a8c978721474870eb9.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1468-1468#evidence-and-conduct-boundaries (current lines); unit SHA256 fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: not a heading → 3; title \"Unheaded block 115\" → \"Evidence And Conduct Boundaries\".\nWhole direct section differs; depth block → 3; 0 distinct link changes; normalized line order differs; 2 removed and 15 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections:\nL10-31/explicit-section-correction [intermediate state; witness 9b0526380]: \"Current packet dispositions require actual evidence when they turn on claims\" → \"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-115 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#evidence-and-conduct-boundaries; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / When The Driver Must Not Disposition Alone\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine"
    ]
  }
}
```

## Entry rationale-152

```json
{
  "entryId": "rationale-152",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json",
  "collection": "claims",
  "claimId": "claim_f7be1d8a794e7f9c867378b67fbc3158",
  "before": {
    "claimId": "claim_f7be1d8a794e7f9c867378b67fbc3158",
    "sourceUnitDigest": "4220e3a9675537c9fe609c9cfbf7324d589f26b484441c45a0ebf1ec2d0fa4dc",
    "claimKind": "decision",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/decisions/README.md:15-16#unheaded-block-3 (current lines); unit SHA256 4220e3a9675537c9fe609c9cfbf7324d589f26b484441c45a0ebf1ec2d0fa4dc.\nTarget: docs/platform/agent-coordination/decisions/README.md:33-33#accepted-decisions (current lines); unit SHA256 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 1, target 13; 13 changed spellings/labels, 1 destination changes; 12 added, 0 removed.\nLink 1: \"Agent Coordination Foundation Vision\" (../vision.md) → \"foundation vision\" (../vision.md); resolved docs/architect/agent-coordination/vision.md → docs/platform/agent-coordination/vision.md.\nLink 2: \"none\" (none) → \"ADR-001: Work Owns Delivery Lifecycle\" (ADR-001-work-lifecycle-authority.md); resolved none → docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md.\nLink 3: \"none\" (none) → \"ADR-002: Preserve Workflow Step Primary Operation Compatibility\" (ADR-002-stage-operation-compatibility.md); resolved none → docs/platform/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md.\nLink 4: \"none\" (none) → \"ADR-003: Separate Assignment, Run, And RunResult\" (ADR-003-assignment-run-runresult-separation.md); resolved none → docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md.\nLink 5: \"none\" (none) → \"ADR-004: Reserve Job For A Future Scheduler\" (ADR-004-reserve-job.md); resolved none → docs/platform/agent-coordination/decisions/ADR-004-reserve-job.md.\nLink 6: \"none\" (none) → \"ADR-005: Herdr Is Visibility, Not Evidence\" (ADR-005-herdr-visibility-only.md); resolved none → docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md.\nLink 7: \"none\" (none) → \"ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot\" (ADR-006-assignment-provenance-and-contract-snapshot.md); resolved none → docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md.\nLink 8: \"none\" (none) → \"ADR-007: Domain Harness Seam And Non-Driving Inline Evidence\" (ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved none → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nLink 9: \"none\" (none) → \"ADR-011: Dispatch Owns Lifecycle; Receiver Writes Receipt\" (ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md); resolved none → docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md.\nLink 10: \"none\" (none) → \"ADR-008: CoordinationSession And Mission Deferral\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 11: \"none\" (none) → \"ADR-009: FlowDefinition Shared IR And Typed Profiles\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 12: \"none\" (none) → \"ADR-010: Interactive/Headless Parity And Work Isolation\" (../history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot.\nLink 13: \"none\" (none) → \"original intent ledger\" (../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Accepted Decisions\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/decisions/README.md#unheaded-block-3 under docs/platform/agent-coordination/decisions/README.md#accepted-decisions; source context \"Agent Coordination Architecture Decisions / Accepted Decisions\", target context \"Agent Coordination Architecture Decisions\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/decisions/README.md",
    "targetAnchor": "accepted-decisions",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "reviewStatus": "reviewed",
    "reviewNote": "rationale-339: deep: supersede, texts differ so the not-an-equal-digest-copy sentence is true; source starts \"The [Agent Coordination Foundation Vision](./vision.md\" and the successor section \"Accepted Decisions\" (50 percent of its longer words reappear there); the one source link is relabelled and re-resolved to docs/platform vision.md while twelve ADR links appear in the successor index; supersede of a one-sentence pointer by the current index fits; facts recomputed equal: source unheaded-block-3 L15-16, target accepted-decisions L33-33, both full digests, links 1/13 (1 destination changes, 12 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 2747b595 at 947f6169e matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-06-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602",
    "targetAncestry": [
      "Agent Coordination Architecture Decisions"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_f7be1d8a794e7f9c867378b67fbc3158",
    "sourceUnitDigest": "4220e3a9675537c9fe609c9cfbf7324d589f26b484441c45a0ebf1ec2d0fa4dc",
    "claimKind": "decision",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/decisions/README.md:15-16#unheaded-block-3 (current lines); unit SHA256 4220e3a9675537c9fe609c9cfbf7324d589f26b484441c45a0ebf1ec2d0fa4dc.\nTarget: docs/platform/agent-coordination/decisions/README.md:33-33#accepted-decisions (current lines); unit SHA256 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 1, target 13; 14 changed spellings/labels, 0 destination changes; 13 added, 1 removed.\nLink 1: \"Agent Coordination Foundation Vision\" (../vision.md) → \"none\" (none); resolved docs/architect/agent-coordination/vision.md → none.\nLink 1: \"none\" (none) → \"foundation vision\" (../vision.md); resolved none → docs/platform/agent-coordination/vision.md.\nLink 2: \"none\" (none) → \"ADR-001: Work Owns Delivery Lifecycle\" (ADR-001-work-lifecycle-authority.md); resolved none → docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md.\nLink 3: \"none\" (none) → \"ADR-002: Preserve Workflow Step Primary Operation Compatibility\" (ADR-002-stage-operation-compatibility.md); resolved none → docs/platform/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md.\nLink 4: \"none\" (none) → \"ADR-003: Separate Assignment, Run, And RunResult\" (ADR-003-assignment-run-runresult-separation.md); resolved none → docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md.\nLink 5: \"none\" (none) → \"ADR-004: Reserve Job For A Future Scheduler\" (ADR-004-reserve-job.md); resolved none → docs/platform/agent-coordination/decisions/ADR-004-reserve-job.md.\nLink 6: \"none\" (none) → \"ADR-005: Herdr Is Visibility, Not Evidence\" (ADR-005-herdr-visibility-only.md); resolved none → docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md.\nLink 7: \"none\" (none) → \"ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot\" (ADR-006-assignment-provenance-and-contract-snapshot.md); resolved none → docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md.\nLink 8: \"none\" (none) → \"ADR-007: Domain Harness Seam And Non-Driving Inline Evidence\" (ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved none → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nLink 9: \"none\" (none) → \"ADR-011: Dispatch Owns Lifecycle; Receiver Writes Receipt\" (ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md); resolved none → docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md.\nLink 10: \"none\" (none) → \"ADR-008: CoordinationSession And Mission Deferral\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 11: \"none\" (none) → \"ADR-009: FlowDefinition Shared IR And Typed Profiles\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 12: \"none\" (none) → \"ADR-010: Interactive/Headless Parity And Work Isolation\" (../history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot.\nLink 13: \"none\" (none) → \"original intent ledger\" (../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Accepted Decisions\".\nWhole direct section differs; depth block → 2; 14 distinct link changes; normalized line order differs; 2 removed and 25 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/decisions/README.md#unheaded-block-3 under docs/platform/agent-coordination/decisions/README.md#accepted-decisions; source context \"Agent Coordination Architecture Decisions / Accepted Decisions\", target context \"Agent Coordination Architecture Decisions\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/decisions/README.md",
    "targetAnchor": "accepted-decisions",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602",
    "targetAncestry": [
      "Agent Coordination Architecture Decisions"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 151,
  "factsSHA256": "df967ebe55b4daff9b40229cceb05f8f7f5de6a2dad03720cdab1a921193133d",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 15,
    "endLine": 16,
    "textDigest": "4220e3a9675537c9fe609c9cfbf7324d589f26b484441c45a0ebf1ec2d0fa4dc",
    "sample": "The [Agent Coordination Foundation Vision](../vision.md) records accepted\ndirection decisions V-001 through V-012 above the specific ADRs below.",
    "identityFingerprint": "159b9e63f26951d55b4b8df9565a779d9432d513de82e19f19b9223edaeaea9c",
    "ancestry": [
      "Agent Coordination Architecture Decisions",
      "Accepted Decisions"
    ],
    "path": "docs/architect/agent-coordination/decisions/README.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Accepted Decisions",
    "anchor": "accepted-decisions",
    "githubAnchor": "accepted-decisions",
    "stableAnchor": "h-08942ec03d07",
    "startLine": 33,
    "endLine": 33,
    "textDigest": "2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602",
    "sample": "Accepted Decisions",
    "sectionPayloadDigest": "b7d6ff7bdbc58a5b86ec9d69b1d05a675bc7c75f597970e65773b7b43d88fece",
    "followingBlockDigest": "dde12e1d9258df2e7b788747b4aa3ce3689047f1687aa2eab9562fb5f3818db1",
    "identityFingerprint": "2db80ea347ccdd49f422714375dfc3e21f36f59d5a71d97ddb160d522cf90c69",
    "ancestry": [
      "Agent Coordination Architecture Decisions"
    ],
    "path": "docs/platform/agent-coordination/decisions/README.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_f7be1d8a794e7f9c867378b67fbc3158",
    "sourceUnitDigest": "4220e3a9675537c9fe609c9cfbf7324d589f26b484441c45a0ebf1ec2d0fa4dc",
    "claimKind": "decision",
    "disposition": "supersede",
    "rationale": "Source: docs/architect/agent-coordination/decisions/README.md:15-16#unheaded-block-3 (current lines); unit SHA256 4220e3a9675537c9fe609c9cfbf7324d589f26b484441c45a0ebf1ec2d0fa4dc.\nTarget: docs/platform/agent-coordination/decisions/README.md:33-33#accepted-decisions (current lines); unit SHA256 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602 at 947f6169e826564b6e00bafb8a0535ec2ff6f0ea.\nLinks: source 1, target 13; 14 changed spellings/labels, 0 destination changes; 13 added, 1 removed.\nLink 1: \"Agent Coordination Foundation Vision\" (../vision.md) → \"none\" (none); resolved docs/architect/agent-coordination/vision.md → none.\nLink 1: \"none\" (none) → \"foundation vision\" (../vision.md); resolved none → docs/platform/agent-coordination/vision.md.\nLink 2: \"none\" (none) → \"ADR-001: Work Owns Delivery Lifecycle\" (ADR-001-work-lifecycle-authority.md); resolved none → docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md.\nLink 3: \"none\" (none) → \"ADR-002: Preserve Workflow Step Primary Operation Compatibility\" (ADR-002-stage-operation-compatibility.md); resolved none → docs/platform/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md.\nLink 4: \"none\" (none) → \"ADR-003: Separate Assignment, Run, And RunResult\" (ADR-003-assignment-run-runresult-separation.md); resolved none → docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md.\nLink 5: \"none\" (none) → \"ADR-004: Reserve Job For A Future Scheduler\" (ADR-004-reserve-job.md); resolved none → docs/platform/agent-coordination/decisions/ADR-004-reserve-job.md.\nLink 6: \"none\" (none) → \"ADR-005: Herdr Is Visibility, Not Evidence\" (ADR-005-herdr-visibility-only.md); resolved none → docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md.\nLink 7: \"none\" (none) → \"ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot\" (ADR-006-assignment-provenance-and-contract-snapshot.md); resolved none → docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md.\nLink 8: \"none\" (none) → \"ADR-007: Domain Harness Seam And Non-Driving Inline Evidence\" (ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved none → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nLink 9: \"none\" (none) → \"ADR-011: Dispatch Owns Lifecycle; Receiver Writes Receipt\" (ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md); resolved none → docs/platform/agent-coordination/decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md.\nLink 10: \"none\" (none) → \"ADR-008: CoordinationSession And Mission Deferral\" (../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot.\nLink 11: \"none\" (none) → \"ADR-009: FlowDefinition Shared IR And Typed Profiles\" (../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot.\nLink 12: \"none\" (none) → \"ADR-010: Interactive/Headless Parity And Work Isolation\" (../history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot.\nLink 13: \"none\" (none) → \"original intent ledger\" (../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot); resolved none → docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot.\nHeading depth: not a heading → 2; title \"Unheaded block 3\" → \"Accepted Decisions\".\nWhole direct section differs; depth block → 2; 14 distinct link changes; normalized line order differs; 2 removed and 25 added nonblank lines after heading/link/correction normalization.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/architect/agent-coordination/decisions/README.md#unheaded-block-3 under docs/platform/agent-coordination/decisions/README.md#accepted-decisions; source context \"Agent Coordination Architecture Decisions / Accepted Decisions\", target context \"Agent Coordination Architecture Decisions\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/agent-coordination/decisions/README.md",
    "targetAnchor": "accepted-decisions",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "reviewStatus": "pending",
    "targetUnitDigest": "2747b59526d6d98b9baf4d83a704f0069ba97b4f0822aab57346fdcbccd09602",
    "targetAncestry": [
      "Agent Coordination Architecture Decisions"
    ]
  }
}
```

