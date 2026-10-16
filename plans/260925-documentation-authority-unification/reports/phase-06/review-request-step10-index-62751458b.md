# One bounded re-review at 62751458b

Author session: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.

**545 entries / 29 request parts**. One logical index (Markdown and JSON projections); each part and sidecar <=60 entries and400000 bytes. All296 original rationale before/after records, all52 whole-section headings, frozen117 list (116 reviewed, restored L10-2 pending), full claim_5c520fcb, all7+1 footer occurrences, both conservation-label before/after repairs, both renamed historical successors, L10-28–32, generator/consistency/reproduction/tests and every affected native tuple are covered. Native sync introduced two predecessor rows and two dependent section-witness wording refreshes; explicit overlays require the runner package commit. All787 matching reviewed applications remain approved and are excluded as fresh claim submissions. [Coverage](step10-sync627-package-coverage.json).

Every header names its actual Author session and carries the following exact scratch-only commands. No producer seeds/verdicts; no duplicate claim verdicts on references.

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

The unchanged all-shard checker audits12895 rows/92 shards, all836 selected outputs, distinct-source occurrences and whole-direct sections. 84 existing historical source-witness limits remain explicit;40 historical target witnesses authenticate old references, not fresh owners. Native gap/dependent changes and the initial four regeneration findings remain in [refresh](step10-sync627-native-dependent-refresh.json). Native registry was carried/persisted once; initial inventory process and first inventory-only retry exited137; a second inventory-only retry used a4096MiB heap with no registry rewrite. See [native proof](step10-sync627-native-proof.json), [D](step10-sync627-D-summary.json), [consistency](step10-sync627-all-shards-consistency.json).

A36: every pending claim gets ordinary review and mechanical binding checks. Reviewer chooses/records independent seeds and IDs; >=45/296 rationale sample and >=45/298 conservative Weak-exact/Judgment draw. All unequal-digest, partial/historical rows,52 headings,8 footer occurrences, restored L10-2 and marked carrier/tool/native changes deep; >3% deep rework escalates to entire set. [Exact mandatory lists](step10-sync627-A36.json). Existing truth/checkpoint/sensitivity/red-team obligations remain independent.

| Request part | Entries | Markdown bytes |
|---|---:|---:|
| [review-request-step10-rationales-01-62751458b.md](review-request-step10-rationales-01-62751458b.md) | 30 | 346116 |
| [review-request-step10-rationales-02-62751458b.md](review-request-step10-rationales-02-62751458b.md) | 31 | 342072 |
| [review-request-step10-rationales-03-62751458b.md](review-request-step10-rationales-03-62751458b.md) | 32 | 344907 |
| [review-request-step10-rationales-04-62751458b.md](review-request-step10-rationales-04-62751458b.md) | 31 | 347747 |
| [review-request-step10-rationales-05-62751458b.md](review-request-step10-rationales-05-62751458b.md) | 28 | 346847 |
| [review-request-step10-rationales-06-62751458b.md](review-request-step10-rationales-06-62751458b.md) | 27 | 338703 |
| [review-request-step10-rationales-07-62751458b.md](review-request-step10-rationales-07-62751458b.md) | 31 | 347265 |
| [review-request-step10-rationales-08-62751458b.md](review-request-step10-rationales-08-62751458b.md) | 26 | 324087 |
| [review-request-step10-rationales-09-62751458b.md](review-request-step10-rationales-09-62751458b.md) | 18 | 348033 |
| [review-request-step10-rationales-10-62751458b.md](review-request-step10-rationales-10-62751458b.md) | 20 | 346894 |
| [review-request-step10-rationales-11-62751458b.md](review-request-step10-rationales-11-62751458b.md) | 16 | 346446 |
| [review-request-step10-rationales-12-62751458b.md](review-request-step10-rationales-12-62751458b.md) | 6 | 84781 |
| [review-request-step10-decisions-01-62751458b.md](review-request-step10-decisions-01-62751458b.md) | 2 | 17246 |
| [review-request-step10-frozen-01-62751458b.md](review-request-step10-frozen-01-62751458b.md) | 40 | 191228 |
| [review-request-step10-frozen-02-62751458b.md](review-request-step10-frozen-02-62751458b.md) | 60 | 210853 |
| [review-request-step10-frozen-03-62751458b.md](review-request-step10-frozen-03-62751458b.md) | 12 | 55213 |
| [review-request-step10-frozen-04-62751458b.md](review-request-step10-frozen-04-62751458b.md) | 4 | 23297 |
| [review-request-step10-frozen-05-62751458b.md](review-request-step10-frozen-05-62751458b.md) | 1 | 10280 |
| [review-request-step10-footers-01-62751458b.md](review-request-step10-footers-01-62751458b.md) | 8 | 49192 |
| [review-request-step10-documents-01-62751458b.md](review-request-step10-documents-01-62751458b.md) | 2 | 9278 |
| [review-request-step10-tools-01-62751458b.md](review-request-step10-tools-01-62751458b.md) | 7 | 81720 |
| [review-request-step10-accounting-01-62751458b.md](review-request-step10-accounting-01-62751458b.md) | 14 | 200478 |
| [review-request-step10-accounting-02-62751458b.md](review-request-step10-accounting-02-62751458b.md) | 11 | 71687 |
| [review-request-step10-accounting-03-62751458b.md](review-request-step10-accounting-03-62751458b.md) | 9 | 134387 |
| [review-request-step10-accounting-04-62751458b.md](review-request-step10-accounting-04-62751458b.md) | 4 | 78690 |
| [review-request-step10-accounting-05-62751458b.md](review-request-step10-accounting-05-62751458b.md) | 4 | 43409 |
| [review-request-step10-accounting-06-62751458b.md](review-request-step10-accounting-06-62751458b.md) | 47 | 152479 |
| [review-request-step10-accounting-07-62751458b.md](review-request-step10-accounting-07-62751458b.md) | 10 | 12119 |
| [review-request-step10-native-01-62751458b.md](review-request-step10-native-01-62751458b.md) | 14 | 29885 |

No docs merge delta. Execution status and blockers are recorded in the current step-10 report. Phase6 remains open: independent review and matching verdict application next, then existing global D/E/T9/truth/mutation/third-refresh/rehearsal/alias/checkpoint/scorecard work. Rings/dashboard/A34/groups/consumer/cutover holds remain explicit. No promotion, retirement, alias adoption, source deletion or closure is inferred from this package.
