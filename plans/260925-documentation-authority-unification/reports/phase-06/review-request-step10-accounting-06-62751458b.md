# Bounded re-review: accounting 6

Author session: `codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **47**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
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

## Entry accounting-001

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "51415a84b629f22f69817afbb3f2e687a76c1587",
  "entryBytes": 81681,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-001"
}
```

## Entry accounting-002

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/owner-queue.md",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "c0294edcb9b0f72d570f28b9d3ccba319691bc79",
  "entryBytes": 262171,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-002"
}
```

## Entry accounting-003

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/progress.md",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "b30f6efa4688def0ce0cfe40b06b934337761ee3",
  "entryBytes": 682203,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-003"
}
```

## Entry accounting-004

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step-10-report.md",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "0f7543b972f256bd85aa2915818850444b52eba3",
  "entryBytes": 69978,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-004"
}
```

## Entry accounting-005

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-frozen-rationales.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "4e71624a63f126e3ac839e362ef52ef963c4d459",
  "entryBytes": 142197,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-005"
}
```

## Entry accounting-006

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-candidate-status.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "c270b069050f0a88e1651fd0cc33a49f2121f68d",
  "entryBytes": 286,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-006"
}
```

## Entry accounting-007

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-checks.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "33ce58d85b19af1392116d846c8144582baf52de",
  "entryBytes": 5568,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-007"
}
```

## Entry accounting-008

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-dangling-output-red.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "1fd3e39ceaf1e6dbc12d55b59715c5c586de43af",
  "entryBytes": 4487,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-008"
}
```

## Entry accounting-009

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-directory-link-red.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "8a99c7b28fb31e0dbbcc6f13fc9ab579fbac8f6f",
  "entryBytes": 2165,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-009"
}
```

## Entry accounting-010

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-doc-edits.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "dcba40ce8323cce3a35e283cf19f2ea3fe3f5f2d",
  "entryBytes": 1615,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-010"
}
```

## Entry accounting-011

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-fast-check.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "7e25086c1f6a6c2b3ef8cb37eb01f58c3216913f",
  "entryBytes": 8510,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-011"
}
```

## Entry accounting-012

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-final-audit.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "557e164f8f9ca2ae1cb6e0b556784ca94c159777",
  "entryBytes": 2620,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-012"
}
```

## Entry accounting-013

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-footer-witness.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "258cb9359f668665175c7710ddcf5e492da802c6",
  "entryBytes": 4937,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-013"
}
```

## Entry accounting-014

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-frozen-binding-red.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "0ce1ada28b3666453fa84e71554c1749af037d0d",
  "entryBytes": 1909,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-014"
}
```

## Entry accounting-015

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-helper-green.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "77d8dd7ea77c0952503553ce82996d763e5df334",
  "entryBytes": 3454,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-015"
}
```

## Entry accounting-016

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-helper-red.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "63bf30086204bf28e1c9a0649b30741599c341af",
  "entryBytes": 6503,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-016"
}
```

## Entry accounting-017

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-link-replay.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "53d07c4a644777094d3ff286ee46ed55a9673d12",
  "entryBytes": 246576,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-017"
}
```

## Entry accounting-018

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-native-refresh-owed.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "c86cfcc7012670c6c7547ec18d64462b95d32127",
  "entryBytes": 2109,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-018"
}
```

## Entry accounting-019

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-output-links-red.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "83cf81a0bb16a58347bd5f7b397546916c7c8eee",
  "entryBytes": 8093,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-019"
}
```

## Entry accounting-020

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-promotion-tails.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "0f343d1e9c3f7b26ec99a87bac6d19e042f58ff8",
  "entryBytes": 5807437,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-020"
}
```

## Entry accounting-021

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-consistency.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "7b74f6905752f8f96c643f93dbe2047113e5bfb7",
  "entryBytes": 10716556,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-021"
}
```

## Entry accounting-022

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "e4d213806408e83ee2a79ff2e420d406395feb10",
  "entryBytes": 6710739,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-022"
}
```

## Entry accounting-023

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-renamed-successors.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "991171ae0f84fd6e38e7da554876c0a99da568b7",
  "entryBytes": 14809,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-023"
}
```

## Entry accounting-024

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-reproduce-red.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "c8727ba6fcfbdc433c3a5944c606d9607a734ef4",
  "entryBytes": 6774,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-024"
}
```

## Entry accounting-025

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-reproduction.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "cee6ab4148e79b6e6cd0456411ff7980a75912b0",
  "entryBytes": 46010,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-025"
}
```

## Entry accounting-026

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-review-application.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "87a70bcbac42c789cf29b85f9753ee262f0db3d6",
  "entryBytes": 1000566,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-026"
}
```

## Entry accounting-027

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-review-notes-index.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "2e3a10a6ddb0ef1dd2717779570dd6aa18708b15",
  "entryBytes": 52539,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-027"
}
```

## Entry accounting-028

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rework-revocations.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "11911133c330747cca1a1c8a6dde0cff040f39d9",
  "entryBytes": 32593,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-028"
}
```

## Entry accounting-029

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-section-audit-red.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "b31f22133c981361fedc4c92d9a8fae6fd1e1bb5",
  "entryBytes": 1597,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-029"
}
```

## Entry accounting-030

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-section-context-red.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "7942380f9d90f8ec1c4e3890bc72dae95ab6055d",
  "entryBytes": 2452,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-030"
}
```

## Entry accounting-031

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-section-order-red.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "749ecaab0875d3c87d824d30f5179d426732b898",
  "entryBytes": 1927,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-031"
}
```

## Entry accounting-032

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-section-overlap-red.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "2c1746f532c8e35b157796cb6e528169c4beba59",
  "entryBytes": 2070,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-032"
}
```

## Entry accounting-033

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-target-ownership.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "86cc121188025fe2228bfe70edcd26656fbf7522",
  "entryBytes": 3455236,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-033"
}
```

## Entry accounting-034

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-tool-tests.log",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "8646d233478505edb28b6a2f55361df419a3d55c",
  "entryBytes": 47750,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-034"
}
```

## Entry accounting-035

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-whole-section-red.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "483403e70737b5cca3c473eb4d887a04ff436d74",
  "entryBytes": 5659948,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-035"
}
```

## Entry accounting-036

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-reproduction.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "23f9a10a27cc3cb63887a415fe5e45e9242d81a8",
  "entryBytes": 71367,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-036"
}
```

## Entry accounting-037

```json
{
  "kind": "committed-author-evidence-accounting",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/tooling.md",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "gitBlob": "94825fc747e18f934872c05fcc33d657ca7c9fbb",
  "entryBytes": 84461,
  "reviewScope": "Immutable evidence delta; inspect git show contentCommit:path. Reviewed application rows/frozen promotion tails retain approval; historical failures remain historical. This reference does not submit every reviewed row for a new verdict.",
  "entryId": "accounting-037"
}
```

## Entry accounting-038

```json
{
  "kind": "shard-header-changes",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "changes": [],
  "entryId": "accounting-038"
}
```

## Entry accounting-039

```json
{
  "kind": "lead-decisions-L10-28-through-L10-32",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md",
  "diff": "diff --git a/plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md b/plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md\nindex 53e78368d..51415a84b 100644\n--- a/plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md\n+++ b/plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md\n@@ -313,3 +313,16 @@ Source: assignment `unit-run-1792114313040-56132651/producer/1`, based on commit\n - **L10-27:** Lead commit `51cb843b8` adds `scripts/doc-binding-repair.mjs` and `scripts/doc-link-pass.mjs` to `allowed-paths.json`. Regenerate A directly from that allowlist; only disclosed Lead commits remain. No producer allowlist/baseline change.\n \n Apply all matching committed ok verdicts with verbatim notes. Generate future requests from committed rows, including after snapshots. Author/docs turn only: zero native sync/review packs. Next turn packages one sync and one bounded re-review of changed docs lines, generator/tests, every regenerated rationale with mechanical checking and independent deep sample, and reopened rows. Evidence and remaining obligations: step-10-report.md / step10-round3-*.\n+\n+\n+## L10-28–L10-32 — Lead A42 round-4 author instruction\n+\n+Relayed in assignment `unit-run-1792118148618-e4fd15ef/producer/1`; reports committed at `0836714ae`, content `287a22d33`, request `bca590a4e`, merge `9b0526380` changes no docs. These record supplied Lead decisions, not producer verdicts.\n+\n+- **L10-28:** keep frozen author-time pending-review/A34 tails on reviewed rows. Enumerate for promotion truth check in owner-queue; row status remains authoritative.\n+- **L10-29:** deliberately written/reviewed rationales are frozen unless binding changes. Maintain frozen list and restore full L10-2 rationale for `claim_5c520fcb1a68ba27e2093341834258c7`, including original lines, all identities/digests, residual and superseded A34 note.\n+- **L10-30:** source occurrence follows its own anchor or historical witness, never first digest match. Enforce distinct identical-source occurrences; runner footer claims map to occurrences 1–8; disclose first claim's +6 anchor shift.\n+- **L10-31:** correction before-text must occur in its bound source or identify intermediate evidence; compose real citation edits (4373,4461 → 4415,4503; 4640-4643;4373-4380 → 4414-4417). Compare full heading sections; explain depth, links, labels, splits and residuals. Unexplained differences are conservation findings requiring carrier repair. Regenerate every heading row in the reviewed request population and same-defect siblings. Code citations carry evidence commit. Link counts use distinct pairs; unrelated removal/addition stay separate. Reproduction requires explicit external scratch output.\n+- **L10-32:** re-decide `claim_0145c13614b75e7da1321473afa8a0f1` and `claim_deb1e4063a1eabf13dd8ed523748039f` as pending supersede to current renamed sections, historical witness under A34 (upstream `09fe3ab32`, `f4ed59997`).\n+\n+Apply every still-matching ok verdict with verbatim notes; reopen changed rows. Author/docs turn: no native sync or review packs. Next = package, one native sync and one bounded independent re-review of every changed row, parts ≤60 entries. Existing global/cutover/consumer/checkpoint obligations remain.\n",
  "deepRequired": true,
  "entryId": "accounting-039"
}
```

## Entry accounting-052

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/5/after",
  "historicalSnapshot": {
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "data-dictionary",
    "sourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "data-dictionary",
    "reviewNote": "deep: docs/specs/distribution.md#data-dictionary to docs/platform/packaging-distribution/spec.md#data-dictionary: the 20-line section is byte-identical except the heading depth (## becomes ####), a nesting change that the rationale does not name but that is a heading-depth change only; mandatory unequal row, digests recomputed, anchors pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-distribution.json",
  "collection": "claims",
  "relatedClaimId": "claim_4eeb2f406288458e61bad21531966ab1",
  "after": {
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "data-dictionary",
    "sourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:55-55#data-dictionary (current lines); unit SHA256 04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f.\nTarget: docs/platform/packaging-distribution/spec.md:515-515#data-dictionary (current lines); unit SHA256 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 4; title \"Data Dictionary\" → \"Data Dictionary\".\nWhole direct section differs; depth 2 → 4; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"Data Dictionary\" → \"Data Dictionary\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-distribution.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#data-dictionary under docs/platform/packaging-distribution/spec.md#data-dictionary; source context \"Spec: Distribution\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "data-dictionary",
    "targetUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ]
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 4,
    "title": "Data Dictionary",
    "anchor": "data-dictionary",
    "githubAnchor": "data-dictionary",
    "stableAnchor": "h-9d3df3b2bec8",
    "startLine": 515,
    "endLine": 515,
    "textDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "sample": "Data Dictionary",
    "sectionPayloadDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "followingBlockDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "identityFingerprint": "b21182e7c3aa0a098607ad3c94a20aada6a3ef44224b6bfacd30188c36967466",
    "ancestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ],
    "text": "#### Data Dictionary",
    "sectionText": "#### Data Dictionary\n\n| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `writer-identity-resolvable` (the writer identity resolves through the Rust host for both the running host and the workspace activation a plain git commit hook uses; each binary is asked directly, so an older activated release shows as a version mismatch), `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |"
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/packaging-distribution/spec.md",
    "unitDigest": "76072d6308310a074a737f2b974014d8113b212829301afaa19088a2dd935001",
    "identityFingerprint": "b21182e7c3aa0a098607ad3c94a20aada6a3ef44224b6bfacd30188c36967466",
    "claimId": "claim_5c7a41cb0091d5fa398c963b4f28b50d",
    "sourceAnchor": "data-dictionary",
    "unitKind": "heading",
    "sourceUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "claimKind": "specification",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "data-dictionary",
    "sourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:55-55#data-dictionary (current lines); unit SHA256 04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f.\nTarget: docs/platform/packaging-distribution/spec.md:515-515#data-dictionary (current lines); unit SHA256 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 4; title \"Data Dictionary\" → \"Data Dictionary\".\nWhole direct section differs; depth 2 → 4; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"Data Dictionary\" → \"Data Dictionary\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-distribution.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#data-dictionary under docs/platform/packaging-distribution/spec.md#data-dictionary; source context \"Spec: Distribution\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "data-dictionary",
    "targetUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ]
  },
  "entryId": "accounting-052"
}
```

## Entry accounting-054

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/7/after",
  "historicalSnapshot": {
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "owns",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "owns",
    "reviewNote": "deep: docs/specs/observe.md#owns to docs/platform/observe/spec.md#owns: section differs by the friction ping and migrate additions to the first bullet (labelled Truth correction in the candidate scaffold, with evidence friction_cli.rs:7-9) and one link destination rebased (../platform/session-identity/spec.md becomes ../session-identity/spec.md, not named in the scaffold list of rebased links but a pure destination change); nothing lost; mandatory unequal row, digests recomputed, anchors pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json",
  "collection": "claims",
  "relatedClaimId": "claim_b2a51d5d39832d330879947bdbbcb227",
  "after": {
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "owns",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/observe.md:12-12#owns (current lines); unit SHA256 ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2.\nTarget: docs/platform/observe/spec.md:34-34#owns (current lines); unit SHA256 a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec\" (../platform/session-identity/spec.md) → \"spec\" (../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nHeading depth: 3 → 3; title \"Owns\" → \"Owns\".\nWhole direct section differs; depth 3 → 3; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"Owns\" → \"Owns\"; 1 distinct link spelling/label changes; 1 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels A40 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json; exact section delta: removed [\"- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\"]; added [\"- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections:\nA40/step8-truth-corrections-1: \"`fgos friction rank`).\" → \"`fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"; evidence step8-truth-corrections.json; packages/observe/rust/src/friction_cli.rs:7-9 (evidence commit 2107c4761cdde5f4302502ad564258220ba6a09d).\nDisposition supersede: Account for docs/specs/observe.md#owns under docs/platform/observe/spec.md#owns; source context \"Observe Component Specification / 1. Overview & Boundaries\", target context \"Observe Component Specification / 1. Overview & Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "owns",
    "targetUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ]
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "Owns",
    "anchor": "owns",
    "githubAnchor": "owns",
    "stableAnchor": "h-7876a0bcabd0",
    "startLine": 34,
    "endLine": 34,
    "textDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "sample": "Owns",
    "sectionPayloadDigest": "11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c",
    "followingBlockDigest": "11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c",
    "identityFingerprint": "1a6e22e6c6b4960b3cd50cc63bf4495513ec982f916cd4a58f3ab5e05ab13fc2",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ],
    "text": "### Owns",
    "sectionText": "### Owns\n- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`). `writerId` lấy từ crate Session Identity ([spec](../session-identity/spec.md)): chính session id khi `source` là `env`/`registry` (gồm `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`), `pid-<id>` khi `pid`/`unresolved` (gốc terminal hoặc session, không còn pid của chính process). `sessionId` của friction cũng lấy từ đó. Observe không tự đọc biến env identity.\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/observe/spec.md",
    "unitDigest": "9cbef79c0d7a521e8a8427c1009b95df8e4b6f7c93e382337c265957d6281824",
    "identityFingerprint": "1a6e22e6c6b4960b3cd50cc63bf4495513ec982f916cd4a58f3ab5e05ab13fc2",
    "claimId": "claim_9a7f102f2e18a81ce472b2b57f81cff3",
    "sourceAnchor": "owns",
    "unitKind": "heading",
    "sourceUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "claimKind": "specification",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "owns",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/observe.md:12-12#owns (current lines); unit SHA256 ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2.\nTarget: docs/platform/observe/spec.md:34-34#owns (current lines); unit SHA256 a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec\" (../platform/session-identity/spec.md) → \"spec\" (../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nHeading depth: 3 → 3; title \"Owns\" → \"Owns\".\nWhole direct section differs; depth 3 → 3; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"Owns\" → \"Owns\"; 1 distinct link spelling/label changes; 1 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels A40 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json; exact section delta: removed [\"- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\"]; added [\"- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections:\nA40/step8-truth-corrections-1: \"`fgos friction rank`).\" → \"`fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"; evidence step8-truth-corrections.json; packages/observe/rust/src/friction_cli.rs:7-9 (evidence commit 2107c4761cdde5f4302502ad564258220ba6a09d).\nDisposition supersede: Account for docs/specs/observe.md#owns under docs/platform/observe/spec.md#owns; source context \"Observe Component Specification / 1. Overview & Boundaries\", target context \"Observe Component Specification / 1. Overview & Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "owns",
    "targetUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ]
  },
  "entryId": "accounting-054"
}
```

## Entry accounting-055

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-predecessor-reconciliation.json",
  "historicalProjectionPath": "/resolvedDrafts/8/after",
  "historicalSnapshot": {
    "claimId": "claim_bf1888a05f53ba3cd515eb792c5059b8",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "unheaded-block-3",
    "sourceUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "unheaded-block-5",
    "reviewNote": "deep: docs/specs/observe.md#unheaded-block-3 to docs/platform/observe/spec.md#unheaded-block-5: same two-line delta as the Owns heading (labelled ping and migrate truth correction plus one rebased link destination), no word lost, it is the carrier of the partial-carry successor of claim_a7278e15; mandatory unequal row, digests recomputed, anchors pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json",
  "collection": "claims",
  "relatedClaimId": "claim_bf1888a05f53ba3cd515eb792c5059b8",
  "after": {
    "claimId": "claim_bf1888a05f53ba3cd515eb792c5059b8",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "unheaded-block-3",
    "sourceUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/observe.md:13-17#unheaded-block-3 (current lines); unit SHA256 36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137.\nTarget: docs/platform/observe/spec.md:35-39#unheaded-block-5 (current lines); unit SHA256 11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec\" (../platform/session-identity/spec.md) → \"spec\" (../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nApplicable labelled corrections:\nA40/step8-truth-corrections-1: \"`fgos friction rank`).\" → \"`fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"; evidence step8-truth-corrections.json; packages/observe/rust/src/friction_cli.rs:7-9 (evidence commit 2107c4761cdde5f4302502ad564258220ba6a09d).\nDisposition supersede: Account for docs/specs/observe.md#unheaded-block-3 under docs/platform/observe/spec.md#unheaded-block-5; source context \"Observe Component Specification / 1. Overview & Boundaries / Owns\", target context \"Observe Component Specification / 1. Overview & Boundaries / Owns\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "unheaded-block-5",
    "targetUnitDigest": "11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 35,
    "endLine": 39,
    "textDigest": "11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c",
    "sample": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`,",
    "identityFingerprint": "c2a02a1cc546d5037f4f1824c51ada42b9b82d9c49e5a2fb01b5c15aa372e2af",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "text": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`). `writerId` lấy từ crate Session Identity ([spec](../session-identity/spec.md)): chính session id khi `source` là `env`/`registry` (gồm `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`), `pid-<id>` khi `pid`/`unresolved` (gốc terminal hoặc session, không còn pid của chính process). `sessionId` của friction cũng lấy từ đó. Observe không tự đọc biến env identity.\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/observe/spec.md",
    "unitDigest": "c2a02a1cc546d5037f4f1824c51ada42b9b82d9c49e5a2fb01b5c15aa372e2af",
    "identityFingerprint": "c2a02a1cc546d5037f4f1824c51ada42b9b82d9c49e5a2fb01b5c15aa372e2af",
    "claimId": "claim_5a7fb197c5c92f400d4f4d29e7a60cc7",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c",
    "claimKind": "specification",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_bf1888a05f53ba3cd515eb792c5059b8",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "unheaded-block-3",
    "sourceUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/observe.md:13-17#unheaded-block-3 (current lines); unit SHA256 36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137.\nTarget: docs/platform/observe/spec.md:35-39#unheaded-block-5 (current lines); unit SHA256 11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec\" (../platform/session-identity/spec.md) → \"spec\" (../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nApplicable labelled corrections:\nA40/step8-truth-corrections-1: \"`fgos friction rank`).\" → \"`fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"; evidence step8-truth-corrections.json; packages/observe/rust/src/friction_cli.rs:7-9 (evidence commit 2107c4761cdde5f4302502ad564258220ba6a09d).\nDisposition supersede: Account for docs/specs/observe.md#unheaded-block-3 under docs/platform/observe/spec.md#unheaded-block-5; source context \"Observe Component Specification / 1. Overview & Boundaries / Owns\", target context \"Observe Component Specification / 1. Overview & Boundaries / Owns\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "unheaded-block-5",
    "targetUnitDigest": "11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ]
  },
  "entryId": "accounting-055"
}
```

## Entry accounting-065

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/4/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "data-dictionary",
    "sourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "data-dictionary",
    "reviewNote": "deep: docs/specs/distribution.md#data-dictionary to docs/platform/packaging-distribution/spec.md#data-dictionary: the 20-line section is byte-identical except the heading depth (## becomes ####), a nesting change that the rationale does not name but that is a heading-depth change only; mandatory unequal row, digests recomputed, anchors pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-distribution.json",
  "collection": "claims",
  "relatedClaimId": "claim_4eeb2f406288458e61bad21531966ab1",
  "after": {
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "data-dictionary",
    "sourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:55-55#data-dictionary (current lines); unit SHA256 04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f.\nTarget: docs/platform/packaging-distribution/spec.md:515-515#data-dictionary (current lines); unit SHA256 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 4; title \"Data Dictionary\" → \"Data Dictionary\".\nWhole direct section differs; depth 2 → 4; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"Data Dictionary\" → \"Data Dictionary\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-distribution.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#data-dictionary under docs/platform/packaging-distribution/spec.md#data-dictionary; source context \"Spec: Distribution\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "data-dictionary",
    "targetUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ]
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 4,
    "title": "Data Dictionary",
    "anchor": "data-dictionary",
    "githubAnchor": "data-dictionary",
    "stableAnchor": "h-9d3df3b2bec8",
    "startLine": 515,
    "endLine": 515,
    "textDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "sample": "Data Dictionary",
    "sectionPayloadDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "followingBlockDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "identityFingerprint": "b21182e7c3aa0a098607ad3c94a20aada6a3ef44224b6bfacd30188c36967466",
    "ancestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ],
    "text": "#### Data Dictionary",
    "sectionText": "#### Data Dictionary\n\n| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `writer-identity-resolvable` (the writer identity resolves through the Rust host for both the running host and the workspace activation a plain git commit hook uses; each binary is asked directly, so an older activated release shows as a version mismatch), `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |"
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/packaging-distribution/spec.md",
    "unitDigest": "76072d6308310a074a737f2b974014d8113b212829301afaa19088a2dd935001",
    "identityFingerprint": "b21182e7c3aa0a098607ad3c94a20aada6a3ef44224b6bfacd30188c36967466",
    "claimId": "claim_5c7a41cb0091d5fa398c963b4f28b50d",
    "sourceAnchor": "data-dictionary",
    "unitKind": "heading",
    "sourceUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "claimKind": "specification",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "data-dictionary",
    "sourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:55-55#data-dictionary (current lines); unit SHA256 04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f.\nTarget: docs/platform/packaging-distribution/spec.md:515-515#data-dictionary (current lines); unit SHA256 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 4; title \"Data Dictionary\" → \"Data Dictionary\".\nWhole direct section differs; depth 2 → 4; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"Data Dictionary\" → \"Data Dictionary\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-distribution.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#data-dictionary under docs/platform/packaging-distribution/spec.md#data-dictionary; source context \"Spec: Distribution\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "data-dictionary",
    "targetUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ]
  },
  "entryId": "accounting-065"
}
```

## Entry accounting-072

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync19-prior-findings.json",
  "historicalProjectionPath": "/rows/11/currentDecision",
  "historicalSnapshot": {
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "owns",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
    "rationale": "A31 / SYNC 59b9b7087: current upstream text carried into its mapped candidate with only disclosed relative-link rebases; existing labelled truth corrections remain. This is a provisional current-source draft from unchanged buildInventoryRow; next package must resolve native identity. No source retirement, authority flip or approval carried. Native identity resolved at 19ca8de23908e161c34c91626e41041b7813167c from the sole native sync. Historical gaps remain separate; no provisional ID is persisted as a decision and no approval carries.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "owns",
    "reviewNote": "deep: docs/specs/observe.md#owns to docs/platform/observe/spec.md#owns: section differs by the friction ping and migrate additions to the first bullet (labelled Truth correction in the candidate scaffold, with evidence friction_cli.rs:7-9) and one link destination rebased (../platform/session-identity/spec.md becomes ../session-identity/spec.md, not named in the scaffold list of rebased links but a pure destination change); nothing lost; mandatory unequal row, digests recomputed, anchors pass",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-05-19ca8de23.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ],
    "reviewReportCommit": "4a18f35ff5d6a9b7a07e955bd64418282c6a91b2"
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json",
  "collection": "claims",
  "relatedClaimId": "claim_b2a51d5d39832d330879947bdbbcb227",
  "after": {
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "owns",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/observe.md:12-12#owns (current lines); unit SHA256 ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2.\nTarget: docs/platform/observe/spec.md:34-34#owns (current lines); unit SHA256 a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec\" (../platform/session-identity/spec.md) → \"spec\" (../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nHeading depth: 3 → 3; title \"Owns\" → \"Owns\".\nWhole direct section differs; depth 3 → 3; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"Owns\" → \"Owns\"; 1 distinct link spelling/label changes; 1 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels A40 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json; exact section delta: removed [\"- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\"]; added [\"- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections:\nA40/step8-truth-corrections-1: \"`fgos friction rank`).\" → \"`fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"; evidence step8-truth-corrections.json; packages/observe/rust/src/friction_cli.rs:7-9 (evidence commit 2107c4761cdde5f4302502ad564258220ba6a09d).\nDisposition supersede: Account for docs/specs/observe.md#owns under docs/platform/observe/spec.md#owns; source context \"Observe Component Specification / 1. Overview & Boundaries\", target context \"Observe Component Specification / 1. Overview & Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "owns",
    "targetUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ]
  },
  "currentTarget": {
    "unitKind": "heading",
    "level": 3,
    "title": "Owns",
    "anchor": "owns",
    "githubAnchor": "owns",
    "stableAnchor": "h-7876a0bcabd0",
    "startLine": 34,
    "endLine": 34,
    "textDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "sample": "Owns",
    "sectionPayloadDigest": "11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c",
    "followingBlockDigest": "11717c094b7543079c51f31172bdc5cc8e3d66f9da00bdb02056323819401b2c",
    "identityFingerprint": "1a6e22e6c6b4960b3cd50cc63bf4495513ec982f916cd4a58f3ab5e05ab13fc2",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ],
    "text": "### Owns",
    "sectionText": "### Owns\n- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`). `writerId` lấy từ crate Session Identity ([spec](../session-identity/spec.md)): chính session id khi `source` là `env`/`registry` (gồm `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`), `pid-<id>` khi `pid`/`unresolved` (gốc terminal hoặc session, không còn pid của chính process). `sessionId` của friction cũng lấy từ đó. Observe không tự đọc biến env identity.\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/observe/spec.md",
    "unitDigest": "9cbef79c0d7a521e8a8427c1009b95df8e4b6f7c93e382337c265957d6281824",
    "identityFingerprint": "1a6e22e6c6b4960b3cd50cc63bf4495513ec982f916cd4a58f3ab5e05ab13fc2",
    "claimId": "claim_9a7f102f2e18a81ce472b2b57f81cff3",
    "sourceAnchor": "owns",
    "unitKind": "heading",
    "sourceUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "claimKind": "specification",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "owns",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/observe.md:12-12#owns (current lines); unit SHA256 ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2.\nTarget: docs/platform/observe/spec.md:34-34#owns (current lines); unit SHA256 a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec\" (../platform/session-identity/spec.md) → \"spec\" (../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nHeading depth: 3 → 3; title \"Owns\" → \"Owns\".\nWhole direct section differs; depth 3 → 3; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"Owns\" → \"Owns\"; 1 distinct link spelling/label changes; 1 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels A40 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json; exact section delta: removed [\"- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\"]; added [\"- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections:\nA40/step8-truth-corrections-1: \"`fgos friction rank`).\" → \"`fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"; evidence step8-truth-corrections.json; packages/observe/rust/src/friction_cli.rs:7-9 (evidence commit 2107c4761cdde5f4302502ad564258220ba6a09d).\nDisposition supersede: Account for docs/specs/observe.md#owns under docs/platform/observe/spec.md#owns; source context \"Observe Component Specification / 1. Overview & Boundaries\", target context \"Observe Component Specification / 1. Overview & Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "owns",
    "targetUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ]
  },
  "entryId": "accounting-072"
}
```

## Entry accounting-077

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync345-predecessor-reconciliation.json",
  "historicalProjectionPath": "/newPredecessors/3/after",
  "historicalSnapshot": {
    "claimId": "claim_08f9b4c140ce931a064c131c2bd4e014",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "sourceUnitDigest": "30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-26",
    "targetUnitDigest": "0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_08f9b4c140ce931a064c131c2bd4e014",
  "after": {
    "claimId": "claim_08f9b4c140ce931a064c131c2bd4e014",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "sourceUnitDigest": "30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-26",
    "rationale": "Source: docs/platform/runner/operations/h-51f5cd7279fd.md:456-467#unheaded-block-26 (historical witness at 19ca8de23908e161c34c91626e41041b7813167c); unit SHA256 30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059.\nTarget: docs/platform/runner/operations/h-51f5cd7279fd.md:456-467#unheaded-block-26 (current lines); unit SHA256 0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-24/citation-refuseHelp: \"bin/fgos.mjs:4373,4461\" → \"bin/fgos.mjs:4415,4503\"; evidence step10-round3-doc-edits.json; bin/fgos.mjs:4414-4417,4503 (evidence commit 5035fed52e60254ecbe034cc987553feb24616f4).\nDisposition supersede: Account for docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-26 under docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-26; source context \"Added in candidate: Runner Behaviors & Operations / Behaviors & Operations / Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\", target context \"Added in candidate: Runner Behaviors & Operations / Behaviors & Operations / Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "targetUnitDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 456,
    "endLine": 467,
    "textDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "sample": "Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120",
    "identityFingerprint": "871f3aa2e8699bc9b5c73af0cbf8305884b3469e1f6e2df1845dd8b030d52add",
    "ancestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ],
    "text": "Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\nBước vào trước đây của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\nTheo hợp đồng cũ, fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "unitDigest": "871f3aa2e8699bc9b5c73af0cbf8305884b3469e1f6e2df1845dd8b030d52add",
    "identityFingerprint": "871f3aa2e8699bc9b5c73af0cbf8305884b3469e1f6e2df1845dd8b030d52add",
    "claimId": "claim_4e0d8183c900cb2ab3954533b1b13592",
    "sourceAnchor": "unheaded-block-26",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "claimKind": "procedure",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_08f9b4c140ce931a064c131c2bd4e014",
    "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "sourceUnitDigest": "30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "unheaded-block-26",
    "rationale": "Source: docs/platform/runner/operations/h-51f5cd7279fd.md:456-467#unheaded-block-26 (historical witness at 19ca8de23908e161c34c91626e41041b7813167c); unit SHA256 30bbabf9219560dd2744a98e42e43b53e9fbaf15c4282e68860a8682f2b63059.\nTarget: docs/platform/runner/operations/h-51f5cd7279fd.md:456-467#unheaded-block-26 (current lines); unit SHA256 0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-24/citation-refuseHelp: \"bin/fgos.mjs:4373,4461\" → \"bin/fgos.mjs:4415,4503\"; evidence step10-round3-doc-edits.json; bin/fgos.mjs:4414-4417,4503 (evidence commit 5035fed52e60254ecbe034cc987553feb24616f4).\nDisposition supersede: Account for docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-26 under docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-26; source context \"Added in candidate: Runner Behaviors & Operations / Behaviors & Operations / Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\", target context \"Added in candidate: Runner Behaviors & Operations / Behaviors & Operations / Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "targetUnitDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations",
      "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)"
    ]
  },
  "entryId": "accounting-077"
}
```

## Entry accounting-082

```json
{
  "kind": "refreshed-dependent-accounting",
  "historicalArtifact": "plans/260925-documentation-authority-unification/reports/phase-06/step10-sync345-predecessor-reconciliation.json",
  "historicalProjectionPath": "/newPredecessors/8/after",
  "historicalSnapshot": {
    "claimId": "claim_61244b0a84842a2771f7cdb493ebb699",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "sourceUnitDigest": "ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-2",
    "targetUnitDigest": "35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ],
    "rationale": "A22/A31/L10-18b/L10-20: native predecessor from 19ca8de23 is superseded by the current same-section unit after authorized source/target link-cell restoration, sentence-order restoration or evolve code-line citation correction. Complete immutable before/after unit text and native successor identity are recorded in step10-sync345-predecessor-reconciliation.json; review the actual delta, not ordinal-anchor equality. Current successor remains candidate, no truth or cutover approval.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16",
    "reviewNote": "Independent review pending at 345f15d95; no approval carried."
  },
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-systemic-native-predecessors.json",
  "collection": "registryGaps",
  "relatedClaimId": "claim_61244b0a84842a2771f7cdb493ebb699",
  "after": {
    "claimId": "claim_61244b0a84842a2771f7cdb493ebb699",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "sourceUnitDigest": "ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-2",
    "rationale": "Source: docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:23-23#unheaded-block-2 (historical witness at 19ca8de23908e161c34c91626e41041b7813167c); unit SHA256 ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f.\nTarget: docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:23-23#unheaded-block-2 (current lines); unit SHA256 c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc.\nSource and target unit digests differ.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-24/citation-scaffold: \"bin/fgos.mjs:4640-4643; bin/fgos.mjs:4373-4380\" → \"bin/fgos.mjs:4414-4417\"; evidence step10-round3-doc-edits.json; bin/fgos.mjs:4414-4417,4503 (evidence commit 5035fed52e60254ecbe034cc987553feb24616f4).\nDisposition supersede: Account for docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md#unheaded-block-2 under docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md#unheaded-block-2; source context \"Added in candidate: Runner Pointers (implementation)\", target context \"Added in candidate: Runner Pointers (implementation)\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "targetUnitDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ]
  },
  "currentTarget": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 23,
    "endLine": 23,
    "textDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
    "sample": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth ",
    "identityFingerprint": "e1fbde6f58cfdeb1279b92317107b574bff70a5805f3838dcdc8be070ff0a51d",
    "ancestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ],
    "text": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F2: replace deleted entropy pointer (packages/observe/rust/src/metrics_cli/entropy.rs:1-8; packages/observe/rust/src/metrics_cli/entropy.rs:107-127); A41 F1: replace deleted ranking pointer (bin/fgos.mjs:4414-4417); R9-5: remove decisions-placement boilerplate from non-decision carrier."
  },
  "currentNativeSuccessor": {
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "unitDigest": "e1fbde6f58cfdeb1279b92317107b574bff70a5805f3838dcdc8be070ff0a51d",
    "identityFingerprint": "e1fbde6f58cfdeb1279b92317107b574bff70a5805f3838dcdc8be070ff0a51d",
    "claimId": "claim_83a11864c376f283107eeca5fe3ffca5",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
    "claimKind": "specification",
    "status": "future"
  },
  "sourceAndResidualHistoryPreserved": true,
  "reviewScope": "Current projection supersedes the historical artifact for this package only; historical before/native witness remains immutable. Pending rows receive no approval.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_61244b0a84842a2771f7cdb493ebb699",
    "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "sourceUnitDigest": "ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f",
    "claimKind": "specification",
    "disposition": "supersede",
    "targetOwner": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
    "targetAnchor": "unheaded-block-2",
    "rationale": "Source: docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:23-23#unheaded-block-2 (historical witness at 19ca8de23908e161c34c91626e41041b7813167c); unit SHA256 ae0e268fad727f5deda17cf43d013aa1710f5cea2506fdd844809c3c8e98511f.\nTarget: docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:23-23#unheaded-block-2 (current lines); unit SHA256 c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc.\nSource and target unit digests differ.\nNo prior reviewed target digest available; no unchanged-since-review claim.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections:\nL10-24/citation-scaffold: \"bin/fgos.mjs:4640-4643; bin/fgos.mjs:4373-4380\" → \"bin/fgos.mjs:4414-4417\"; evidence step10-round3-doc-edits.json; bin/fgos.mjs:4414-4417,4503 (evidence commit 5035fed52e60254ecbe034cc987553feb24616f4).\nDisposition supersede: Account for docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md#unheaded-block-2 under docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md#unheaded-block-2; source context \"Added in candidate: Runner Pointers (implementation)\", target context \"Added in candidate: Runner Pointers (implementation)\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "targetUnitDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
    "targetAncestry": [
      "Added in candidate: Runner Pointers (implementation)"
    ]
  },
  "entryId": "accounting-082"
}
```

## Entry accounting-089

```json
{
  "kind": "frozen-list-metadata-and-rework-exclusions",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-frozen-rationales.json",
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "metadata": {
    "version": 1,
    "excludedLatestReworks": [
      {
        "claimId": "claim_53ebf4b541ff8f6a2c40e3b95304d6b7",
        "sourceUnitDigest": "2aff5e7721a256efce78953c498af0839f56f0bb5b9918290a36bbc072659eb1",
        "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-287a22d33.md",
        "reason": "Latest committed rework revokes the older reviewed status; this incorrect prose is not frozen."
      },
      {
        "claimId": "claim_53d2f5742d24e980328f8cee963fb73b",
        "sourceUnitDigest": "dd493e9c64c0caf205f6acc1617c588a0f6710dc0a4f5922d58551efaf63e579",
        "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-287a22d33.md",
        "reason": "Latest committed rework revokes the older reviewed status; this incorrect prose is not frozen."
      },
      {
        "claimId": "claim_2ae0cd4fc1cf487f7caa4d77d46e9682",
        "sourceUnitDigest": "93e63d0c77140732f2db5dcff67c39869f924d501e3556dfb36a9d48cc73ed8d",
        "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-287a22d33.md",
        "reason": "Latest committed rework revokes the older reviewed status; this incorrect prose is not frozen."
      },
      {
        "claimId": "claim_0f63a4c33bd9ab4d707e6ea459868a91",
        "sourceUnitDigest": "30081b87c5f3fa70b025b187fa5dd4cc947c337d5c005aec01a17fd48d6652ef",
        "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-decisions-02-287a22d33.md",
        "reason": "Latest committed rework revokes the older reviewed status; this incorrect prose is not frozen."
      }
    ]
  },
  "listedRecords": 117,
  "actualReviewed": 116,
  "restoredPending": 1,
  "reviewScope": "Verify all excludedLatestReworks stay pending, absent from the frozen list; their one current claim submission is in rationalales. Full restored L10-2 is pending, not retained approval.",
  "deepRequired": true,
  "entryId": "accounting-089"
}
```

