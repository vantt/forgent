# Bounded re-review: documents 1

Author session: `codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16`
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

## Entry documents-001

```json
{
  "kind": "conservation-label-carrier-fix",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
  "line": 436,
  "before": "Registered counterparts: constraint-lens shaping and reviewed critique reports,",
  "after": "Added in candidate — registered counterparts: constraint-lens shaping and reviewed critique reports,",
  "label": "L10-31/explicit-section-correction",
  "evidenceCommit": "9b0526380",
  "historicalPreservation": "Complete pre-rework source is retained verbatim in the document-linked literal-snapshot; previously reviewed current-Workflow rewrite in truth-ledger-agent-coordination.json.",
  "beforeLine": "Registered counterparts: constraint-lens shaping and reviewed critique reports,",
  "afterLine": "Added in candidate — registered counterparts: constraint-lens shaping and reviewed critique reports,",
  "beforeCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "afterCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "diff": "diff --git a/docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md b/docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md\nindex a61be5ce2..13a76a196 100644\n--- a/docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md\n+++ b/docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md\n@@ -431,11 +431,11 @@ was easy.\n \n ---\n \n ## 7. Constraint Findings — optional manual constraint/critique shape\n \n-Registered counterparts: constraint-lens shaping and reviewed critique reports,\n+Added in candidate — registered counterparts: constraint-lens shaping and reviewed critique reports,\n not a separate numbered runtime phase or mandatory file.\n \n **Why this exists.** To force ranking and reversibility judgment, which is the\n entire value of this role. A flat risk list is indistinguishable from noise.\n \n",
  "deepRequired": true,
  "entryId": "documents-001"
}
```

## Entry documents-002

```json
{
  "kind": "conservation-label-carrier-fix",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
  "line": 1470,
  "before": "Current packet dispositions require actual evidence when they turn on claims",
  "after": "Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims",
  "label": "L10-31/explicit-section-correction",
  "evidenceCommit": "9b0526380",
  "historicalPreservation": "Complete pre-rework source is retained verbatim in the document-linked literal-snapshot; previously reviewed current-Workflow rewrite in truth-ledger-agent-coordination.json.",
  "beforeLine": "Current packet dispositions require actual evidence when they turn on claims",
  "afterLine": "Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims",
  "beforeCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "afterCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "diff": "diff --git a/docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md b/docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md\nindex 711092996..08f5e525f 100644\n--- a/docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md\n+++ b/docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md\n@@ -1465,11 +1465,11 @@ forbidden.\n Requires citing the observation, by path or by run result, made by an advisor who\n looked. Not \"our reasoning shows this is wrong\".\n \n ### Evidence And Conduct Boundaries\n \n-Current packet dispositions require actual evidence when they turn on claims\n+Added in candidate — current-Workflow correction; the former driver-specific rules remain in the historical snapshot linked above. Current packet dispositions require actual evidence when they turn on claims\n about PROJECT_ROOT or the panel's artifacts (`SKILL.md:124-128`):\n \n - **Invalidation:** cite a real observation, not the producer's unsupported\n   explanation for why dissent would be inconvenient.\n - **Answer:** cite the artifact that answers the concern.\n",
  "deepRequired": true,
  "entryId": "documents-002"
}
```

