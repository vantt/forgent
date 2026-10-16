# Bounded re-review: decisions 1

Author session: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **2**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
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

## Entry decisions-001

```json
{
  "kind": "package-native-predecessor-decision",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-round4-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_f15e4328e1e5df90c51f535e75da554b",
  "currentDecision": {
    "claimId": "claim_f15e4328e1e5df90c51f535e75da554b",
    "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "sourceUnitDigest": "9643a6fe01ce142637dcea09eb07b8690322ab13683212165934615d5aba3ae5",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "unheaded-block-44",
    "targetUnitDigest": "f03302423020c8beeac177192fbe0952433473b78efd7c17f5eb96b39d67dbca",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates",
      "7. Constraint Findings — optional manual constraint/critique shape"
    ],
    "rationale": "Source: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:436-437#unheaded-block-44 (historical witness at 9b0526380); unit SHA256 9643a6fe01ce142637dcea09eb07b8690322ab13683212165934615d5aba3ae5.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:436-437#unheaded-block-44 (current lines); unit SHA256 f03302423020c8beeac177192fbe0952433473b78efd7c17f5eb96b39d67dbca.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 9643a6fe01ce142637dcea09eb07b8690322ab13683212165934615d5aba3ae5 at 0f063d18fdab01cb6f2c915bb60ff528c5e0f238.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-31/explicit-section-correction: \"Registered counterparts: constraint-lens shaping and reviewed critique reports,\" → \"Added in candidate — registered counterparts: constraint-lens shaping and reviewed critique reports,\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-44 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-44; source context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — optional manual constraint/critique shape\", target context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — optional manual constraint/critique shape\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
    "reviewNote": "Independent review pending at 62751458b; no approval carried."
  },
  "after": {
    "claimId": "claim_f15e4328e1e5df90c51f535e75da554b",
    "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "sourceUnitDigest": "9643a6fe01ce142637dcea09eb07b8690322ab13683212165934615d5aba3ae5",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
    "targetAnchor": "unheaded-block-44",
    "targetUnitDigest": "f03302423020c8beeac177192fbe0952433473b78efd7c17f5eb96b39d67dbca",
    "targetAncestry": [
      "Architecture Advisory Artifact Templates",
      "7. Constraint Findings — optional manual constraint/critique shape"
    ],
    "rationale": "Source: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:436-437#unheaded-block-44 (historical witness at 9b0526380); unit SHA256 9643a6fe01ce142637dcea09eb07b8690322ab13683212165934615d5aba3ae5.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md:436-437#unheaded-block-44 (current lines); unit SHA256 f03302423020c8beeac177192fbe0952433473b78efd7c17f5eb96b39d67dbca.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 9643a6fe01ce142637dcea09eb07b8690322ab13683212165934615d5aba3ae5 at 0f063d18fdab01cb6f2c915bb60ff528c5e0f238.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-31/explicit-section-correction: \"Registered counterparts: constraint-lens shaping and reviewed critique reports,\" → \"Added in candidate — registered counterparts: constraint-lens shaping and reviewed critique reports,\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-44 under docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-44; source context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — optional manual constraint/critique shape\", target context \"Architecture Advisory Artifact Templates / 7. Constraint Findings — optional manual constraint/critique shape\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
    "reviewNote": "Independent review pending at 62751458b; no approval carried."
  },
  "packageOverlay": true,
  "contentPin": "62751458b22b47e930dc33b8501d07798b91ace3",
  "deepRequired": true,
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-predecessor-reconciliation.json",
  "reviewScope": "Pending package-overlay row; bind to runner package commit before ordinary review. Not claimed present at content pin.",
  "entryId": "decisions-001"
}
```

## Entry decisions-002

```json
{
  "kind": "package-native-predecessor-decision",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-round4-native-predecessors.json",
  "collection": "registryGaps",
  "claimId": "claim_9e9d711e331efe5a12c8b8bf50371dc6",
  "currentDecision": {
    "claimId": "claim_9e9d711e331efe5a12c8b8bf50371dc6",
    "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "sourceUnitDigest": "087d5cdd477bde5b2bf98882290f0d23d3e44a06f0c6f93b7f15e6bcfa391c63",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "unheaded-block-117",
    "targetUnitDigest": "7486a9e911dc83dd8182817e3d51bccd7b2e95a87b245307e19b3dd1de9fbb34",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine",
      "Evidence And Conduct Boundaries"
    ],
    "rationale": "Source: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1470-1471#unheaded-block-117 (historical witness at 9b0526380); unit SHA256 087d5cdd477bde5b2bf98882290f0d23d3e44a06f0c6f93b7f15e6bcfa391c63.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1470-1471#unheaded-block-117 (current lines); unit SHA256 7486a9e911dc83dd8182817e3d51bccd7b2e95a87b245307e19b3dd1de9fbb34.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 087d5cdd477bde5b2bf98882290f0d23d3e44a06f0c6f93b7f15e6bcfa391c63 at 0f063d18fdab01cb6f2c915bb60ff528c5e0f238.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-31/explicit-section-correction: \"Current packet dispositions require actual evidence when they turn on claims\" → \"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-117 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-117; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / Evidence And Conduct Boundaries\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / Evidence And Conduct Boundaries\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
    "reviewNote": "Independent review pending at 62751458b; no approval carried."
  },
  "after": {
    "claimId": "claim_9e9d711e331efe5a12c8b8bf50371dc6",
    "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "sourceUnitDigest": "087d5cdd477bde5b2bf98882290f0d23d3e44a06f0c6f93b7f15e6bcfa391c63",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
    "targetAnchor": "unheaded-block-117",
    "targetUnitDigest": "7486a9e911dc83dd8182817e3d51bccd7b2e95a87b245307e19b3dd1de9fbb34",
    "targetAncestry": [
      "Architecture Advisory Role Doctrine",
      "Driver-Disposition Doctrine",
      "Evidence And Conduct Boundaries"
    ],
    "rationale": "Source: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1470-1471#unheaded-block-117 (historical witness at 9b0526380); unit SHA256 087d5cdd477bde5b2bf98882290f0d23d3e44a06f0c6f93b7f15e6bcfa391c63.\nTarget: docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md:1470-1471#unheaded-block-117 (current lines); unit SHA256 7486a9e911dc83dd8182817e3d51bccd7b2e95a87b245307e19b3dd1de9fbb34.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 087d5cdd477bde5b2bf98882290f0d23d3e44a06f0c6f93b7f15e6bcfa391c63 at 0f063d18fdab01cb6f2c915bb60ff528c5e0f238.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-31/explicit-section-correction: \"Current packet dispositions require actual evidence when they turn on claims\" → \"Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\"; evidence step10-round4-doc-edits.json.\nDisposition supersede: Account for docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-117 under docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-117; source context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / Evidence And Conduct Boundaries\", target context \"Architecture Advisory Role Doctrine / Driver-Disposition Doctrine / Evidence And Conduct Boundaries\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
    "reviewNote": "Independent review pending at 62751458b; no approval carried."
  },
  "packageOverlay": true,
  "contentPin": "62751458b22b47e930dc33b8501d07798b91ace3",
  "deepRequired": true,
  "witness": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-predecessor-reconciliation.json",
  "reviewScope": "Pending package-overlay row; bind to runner package commit before ordinary review. Not claimed present at content pin.",
  "entryId": "decisions-002"
}
```

