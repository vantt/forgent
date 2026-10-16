# Bounded changed-only re-review at 4d3634360

Author session: `codex-session:unit-run-1792126341980-e0c35701@2026-10-16` (rationales, carriers, tools/tests and original reproduction changes).
Package Author session: `codex-session:unit-run-1792127410542-c10a1e4e@2026-10-16` (native sync, pending rebinds and package evidence).
Content commit: `4d363436049120ffc9b94dd5269f06a026a827fd`. Comparison: `1d92a7229af9050b3ce57729c8652b8a836e93b6`.
Scope: only 54 regenerated rationales, four historical-section preservation changes, classifier/independent-checker/doc-binding-repair and tests, reproduction command changes, and resulting native/binding transitions. Historical wider request sets are references, not this submission. Native/rebind package overlays must bind to the runner package commit before ordinary verdicts.

A36: every entry requires mechanical binding/blob checks; deep-required entries are marked individually, including whole sections, unequal digests, partial carries, historical carriers, tools and native transitions. Reviewer chooses and records seeds, sample IDs and verdicts independently under A36; producer chooses none. Existing global E/A34/truth/consumer/cutover/checkpoint/scorecard obligations remain open.

Scratch-only reproduce commands (run heavy steps sequentially):

Memory note: Run heavy commands sequentially. Independent audit needs approximately 3 GiB heap; full native inventory and D use 4 GiB old-space/16 MiB semi-space. Lossless 16 MiB chunk I/O handles the inventory exceeding the Node 2 GiB single-call limit. Inventory replay is optional, expensive, and never repeats carry-forward or registry persistence. All reproduce outputs and temporary test fixtures stay under /tmp/fgos-work.

```sh
mkdir -p /tmp/fgos-work/review4d
python3 - <<'PYREPRO'
import json,pathlib
r=pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-06');o=pathlib.Path('/tmp/fgos-work/review4d');o.mkdir(parents=True,exist_ok=True)
for n,s in json.loads((r/'step10-sync4d-reproduction.json').read_text())['readOnlyScripts'].items():(o/n).write_text(s)
PYREPRO
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work NODE_OPTIONS=--max-old-space-size=3072 python3 plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-reproduce.py consistency --output /tmp/fgos-work/review4d/independent.json
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node /tmp/fgos-work/review4d/ownership.mjs --output-dir /tmp/fgos-work/review4d
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node /tmp/fgos-work/review4d/audit-ownership.mjs --output-dir /tmp/fgos-work/review4d
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work python3 /tmp/fgos-work/review4d/replay.py --output-dir /tmp/fgos-work/review4d
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node /tmp/fgos-work/review4d/checks.mjs --output-dir /tmp/fgos-work/review4d
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-*.test.mjs test/scripts/check-doc-*.test.mjs test/scripts/generate-doc-inventory.test.mjs test/scripts/list-doc-anchors.test.mjs test/scripts/verify-phase-02.test.mjs test/scripts/next-doc-id.test.mjs
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --max-old-space-size=4096 --max-semi-space-size=16 /tmp/fgos-work/review4d/inventory-readonly.mjs --output-dir /tmp/fgos-work/review4d
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --max-old-space-size=4096 --max-semi-space-size=16 /tmp/fgos-work/review4d/verify-readonly.mjs --output-dir /tmp/fgos-work/review4d
```

ONE bounded set: **81 entries / 5 request files**. Per-file counts: 15, 19, 18, 20, 9.

- [review-request-step10-changed-01-4d3634360.md](review-request-step10-changed-01-4d3634360.md): 15 entries, 388825 bytes.
- [review-request-step10-changed-02-4d3634360.md](review-request-step10-changed-02-4d3634360.md): 19 entries, 389933 bytes.
- [review-request-step10-changed-03-4d3634360.md](review-request-step10-changed-03-4d3634360.md): 18 entries, 347673 bytes.
- [review-request-step10-changed-04-4d3634360.md](review-request-step10-changed-04-4d3634360.md): 20 entries, 314777 bytes.
- [review-request-step10-changed-05-4d3634360.md](review-request-step10-changed-05-4d3634360.md): 9 entries, 13061 bytes.

Coverage: 54 rationale snapshots; four complete distinct historical carriers; six tool/test changes; five reproduction changes; 12 native transitions; 0 pending content rebinds. No reviewed application population or unchanged frozen rationale is resubmitted. Native overlays are evidence, not approval.

Complete marked deep list: [A36](step10-sync4d-A36.json). Raw check A additionally sees the committed new helper outside the unchanged historical allowlist; Lead reconciliation remains open, no producer baseline edit.
