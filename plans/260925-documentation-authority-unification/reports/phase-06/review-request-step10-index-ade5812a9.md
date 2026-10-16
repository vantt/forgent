# One bounded changed-only re-review at ade5812a9

Author session: `codex-session:unit-run-1792130182385-eef9a749@2026-10-16` (five rationales, witness/accounting tools, tests and portable reproduction).
Package Author session: `codex-session:unit-run-1792130920095-4c562e4f@2026-10-16` (native sync, package evidence).
Content commit: `ade5812a9f444f895185594aedc1f73cf8b2288a`; author comparison: `203f4ef93867a60e6a37624b31ce14de426cafa8`; registry comparison request: `fe98a6455`.
Scope: changed entries only. Native/package overlays bind to the runner package commit before ordinary verdicts; exact committed rationale snapshots are separate. No approval, seed or verdict selected by producer.

L10-37 (A42): LAST rationale-wording round. Wording-only defects without conservation loss become reasoned holds for the owner promotion truth check; content defects still get fixed. After review application, the existing global turn.

A36: ALL entries mechanical and deep-required, including five unequal/whole-section rationales, witness rule/tests, marker drops, metadata, check A and reproduction. Reviewer independently records seeds, sample IDs and ordinary verdicts; no producer draw. [Exact deep list](step10-syncade-A36.json).

Portable reproduction from repository root; use fresh caller-owned external scratch. Approximately **3 GiB heap** for the all-shard independent audit; optional full native inventory/D uses4GiB old-space/16MiB semi-space and lossless16MiB chunk transport. Run heavy commands sequentially. Existing wrappers have no author-scratch prerequisite.

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work NODE_OPTIONS=--max-old-space-size=3072 python3 plans/260925-documentation-authority-unification/reports/phase-06/step10-sync4d-reproduce.py --output-dir /tmp/fgos-work/REVIEWER-ade
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work NODE_OPTIONS=--max-old-space-size=3072 python3 plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-reproduce.py --output-dir /tmp/fgos-work/REVIEWER-ade-round5
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node plans/260925-documentation-authority-unification/reports/phase-06/step10-registry-accounting.mjs --previous-request fe98a6455 --output /tmp/fgos-work/REVIEWER-ade/registry-accounting.json
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-*.test.mjs test/scripts/check-doc-*.test.mjs test/scripts/generate-doc-inventory.test.mjs test/scripts/list-doc-anchors.test.mjs test/scripts/verify-phase-02.test.mjs test/scripts/next-doc-id.test.mjs
```

Both default wrappers run the current all-shard audit, checks, ownership and replay. Their historical optional native pin is not this package's pin; for OPTIONAL read-only native D at ade5812a9 use this package manifest instead (never re-sync):

```sh
python3 - <<'PYREPRO'
import pathlib,json
o=pathlib.Path('/tmp/fgos-work/REVIEWER-ade-native');o.mkdir(parents=True,exist_ok=False)
for n,s in json.loads(pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-06/step10-syncade-reproduction.json').read_text())['readOnlyScripts'].items():(o/n).write_text(s)
PYREPRO
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --max-old-space-size=4096 --max-semi-space-size=16 /tmp/fgos-work/REVIEWER-ade-native/inventory-readonly.mjs --output-dir /tmp/fgos-work/REVIEWER-ade-native
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --max-old-space-size=4096 --max-semi-space-size=16 /tmp/fgos-work/REVIEWER-ade-native/verify-readonly.mjs --output-dir /tmp/fgos-work/REVIEWER-ade-native
```

**40 entries / 4 request files**; counts 12, 12, 12, 4.

- [review-request-step10-changed-01-ade5812a9.md](review-request-step10-changed-01-ade5812a9.md): 12 entries / 154691 bytes.
- [review-request-step10-changed-02-ade5812a9.md](review-request-step10-changed-02-ade5812a9.md): 12 entries / 124096 bytes.
- [review-request-step10-changed-03-ade5812a9.md](review-request-step10-changed-03-ade5812a9.md): 12 entries / 27898 bytes.
- [review-request-step10-changed-04-ade5812a9.md](review-request-step10-changed-04-ade5812a9.md): 4 entries / 12297 bytes.

Coverage: five regenerated rationales; eight witness/accounting tool/test changes; four original portable reproduction changes; tooling rationale; four outstanding marker-drop records; EVERY 16 registry change since fe98a6455; regenerated check A; current portable native reproduction manifest. Existing prior reviewed populations are context only.

[Native proof](step10-syncade-native-proof.json), [D both priors](step10-syncade-D-summary.json), [all-shard independent audit](step10-syncade-independent-consistency.json), [ownership](step10-syncade-target-ownership.json), [link replay](step10-syncade-link-replay.json), [checks](step10-syncade-checks.json), [complete accounting](step10-syncade-registry-accounting.json), [final audit](step10-syncade-final-audit.json). Global E/A34/current-truth/consumer/cutover/checkpoint/scorecard remain open.
