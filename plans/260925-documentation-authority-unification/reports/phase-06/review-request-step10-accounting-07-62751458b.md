# Bounded re-review: accounting 7

Author session: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **10**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
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

## Entry fresh-checks

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-checks",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-checks.json",
  "SHA256": "cf2d1f261cd438a934d65c5bf3380926549dc7dee49fb52173a93d68126ddf9e",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "reviewScope": "Independently reproduce this measured evidence; no substantive claim approval. Native-dependent refresh includes exact before/after of four pending rows.",
  "checkARecord": {
    "historicalOffenders": [
      "plans/260925-documentation-authority-unification/phase-06-transform-all-platform-areas-as-candidate-material.md",
      "plans/260925-documentation-authority-unification/phase-08-eliminate-switchboard-bypasses-and-prepare-consumers.md",
      "plans/260925-documentation-authority-unification/phase-09-atomic-platform-authority-cutover.md",
      "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/consumer-survey.json",
      "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/consumer-survey.md",
      "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/open-questions.md",
      "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/phase-07-draft.md",
      "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/phase-08-draft.md"
    ],
    "historicalEqual": true,
    "newWorkingViolations": [],
    "ok": true
  }
}
```

## Entry fresh-native-proof

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-native-proof",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-native-proof.json",
  "SHA256": "0f628ba4e69365f9b3168ecbe4fd66e64d9bd280498922b1bb6b6c614ff13238",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "reviewScope": "Independently reproduce this measured evidence; no substantive claim approval. Native-dependent refresh includes exact before/after of four pending rows.",
  "checkARecord": null
}
```

## Entry fresh-D-summary

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-D-summary",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-D-summary.json",
  "SHA256": "791218c194de6c8d0cb52e3771f8833b430effb2c90998a32b5679c7bf1be708",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "reviewScope": "Independently reproduce this measured evidence; no substantive claim approval. Native-dependent refresh includes exact before/after of four pending rows.",
  "checkARecord": null
}
```

## Entry fresh-rebindings

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-rebindings",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-rebindings.json",
  "SHA256": "18a860a55f21dba7341d0f2dae8d749c06d27ddb9bfbb0d4cd38196a5deaecce",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "reviewScope": "Independently reproduce this measured evidence; no substantive claim approval. Native-dependent refresh includes exact before/after of four pending rows.",
  "checkARecord": null
}
```

## Entry fresh-target-ownership

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-target-ownership",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-target-ownership.json",
  "SHA256": "2b677738da6b1f11b9307046ad7a74345893533663ca62ccad800546b29d1469",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "reviewScope": "Independently reproduce this measured evidence; no substantive claim approval. Native-dependent refresh includes exact before/after of four pending rows.",
  "checkARecord": null
}
```

## Entry fresh-link-replay

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-link-replay",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-link-replay.json",
  "SHA256": "973ed51820a387ce5addf7e63d58c949083ccc9c7d0b92746ab887a86f911d57",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "reviewScope": "Independently reproduce this measured evidence; no substantive claim approval. Native-dependent refresh includes exact before/after of four pending rows.",
  "checkARecord": null
}
```

## Entry fresh-all-shards-consistency

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-all-shards-consistency",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-all-shards-consistency.json",
  "SHA256": "d16bd192a1cbad42d4903355cd8dcf18b41a30e6c790b1059cb9773c0b479670",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "reviewScope": "Independently reproduce this measured evidence; no substantive claim approval. Native-dependent refresh includes exact before/after of four pending rows.",
  "checkARecord": null
}
```

## Entry fresh-predecessor-reconciliation

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-predecessor-reconciliation",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-predecessor-reconciliation.json",
  "SHA256": "6454e80e61cc17f1fcecae3ce36b17a6a5e5f1db10bdde980e3bfb5d0ac58e69",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "reviewScope": "Independently reproduce this measured evidence; no substantive claim approval. Native-dependent refresh includes exact before/after of four pending rows.",
  "checkARecord": null
}
```

## Entry fresh-native-dependent-refresh

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-native-dependent-refresh",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-native-dependent-refresh.json",
  "SHA256": "dec45de3bb67976443bf361690661397221f6ddbb1cabca44fc6c94975cc7a38",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "reviewScope": "Independently reproduce this measured evidence; no substantive claim approval. Native-dependent refresh includes exact before/after of four pending rows.",
  "checkARecord": null
}
```

## Entry fresh-reproduction

```json
{
  "kind": "fresh-package-evidence",
  "entryId": "fresh-reproduction",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-reproduction.json",
  "SHA256": "60070cb2b3ab0c6daff10f0afba523928897a26f4ecb1bd02ba0c0d964d891a9",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "reviewScope": "Independently reproduce this measured evidence; no substantive claim approval. Native-dependent refresh includes exact before/after of four pending rows.",
  "checkARecord": null
}
```

