# Bounded re-review part 04 at ade5812a9

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

Entries: 4.

## entry-037 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-037",
  "kind": "registry-change-since-request",
  "authorSession": "codex-session:unit-run-1792130920095-4c562e4f@2026-10-16",
  "A36": [
    "deep-required"
  ],
  "contentCommit": "ade5812a9f444f895185594aedc1f73cf8b2288a",
  "file": "plans/260925-documentation-authority-unification/reports/phase-06/working-identity-registry.json",
  "previousRequestCommit": "fe98a6455464da90de8e371c530560bf8d14751f",
  "packageOverlay": true,
  "packageCommitBinding": "Bind exact registry SHA256 and this record to runner package commit before ordinary verdicts.",
  "change": {
    "collection": "units",
    "key": "claim_ee99b0951090e8a9aeabd89bf2982f05",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "3f04a25770175d51f86d82739e8ba1134f1395a17dd235a34e5a3c5517c8a757",
      "identityFingerprint": "3f04a25770175d51f86d82739e8ba1134f1395a17dd235a34e5a3c5517c8a757",
      "claimId": "claim_ee99b0951090e8a9aeabd89bf2982f05",
      "sourceAnchor": "unheaded-block-10",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "28d0009fb157647913ed15eaaa21f78a13218cffb6610cda0f0b0d223a61fed6",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "3f04a25770175d51f86d82739e8ba1134f1395a17dd235a34e5a3c5517c8a757",
      "identityFingerprint": "3f04a25770175d51f86d82739e8ba1134f1395a17dd235a34e5a3c5517c8a757",
      "claimId": "claim_ee99b0951090e8a9aeabd89bf2982f05",
      "sourceAnchor": "unheaded-block-10",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "28d0009fb157647913ed15eaaa21f78a13218cffb6610cda0f0b0d223a61fed6",
      "claimKind": "specification",
      "status": "future"
    },
    "changedFields": [
      "origin"
    ]
  },
  "reviewScope": "All changes since fe98a6455, including origin marker drops and top-level metadata; no identity filtering and no producer approval."
}
```

## entry-038 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-038",
  "kind": "registry-change-since-request",
  "authorSession": "codex-session:unit-run-1792130920095-4c562e4f@2026-10-16",
  "A36": [
    "deep-required"
  ],
  "contentCommit": "ade5812a9f444f895185594aedc1f73cf8b2288a",
  "file": "plans/260925-documentation-authority-unification/reports/phase-06/working-identity-registry.json",
  "previousRequestCommit": "fe98a6455464da90de8e371c530560bf8d14751f",
  "packageOverlay": true,
  "packageCommitBinding": "Bind exact registry SHA256 and this record to runner package commit before ordinary verdicts.",
  "change": {
    "collection": "units",
    "key": "claim_f97b02893c6b8f2554062dfea5f5df2c",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "20e63a0400b36e33b618d6f9fc4a93a7eb4771ecbdfcac90ae08d3c6042c87e1",
      "identityFingerprint": "b2e64ed28704a72e6aba9f52d7feac1d9f398a8e44d3cc6ea1d6c8c942ab6670",
      "claimId": "claim_f97b02893c6b8f2554062dfea5f5df2c",
      "sourceAnchor": "historical-source-section-4efee765",
      "unitKind": "heading",
      "sourceUnitDigest": "feecc4809f456b2d4201f2527febcdd521ca9eccf64144629268071cea373d0d",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "20e63a0400b36e33b618d6f9fc4a93a7eb4771ecbdfcac90ae08d3c6042c87e1",
      "identityFingerprint": "b2e64ed28704a72e6aba9f52d7feac1d9f398a8e44d3cc6ea1d6c8c942ab6670",
      "claimId": "claim_f97b02893c6b8f2554062dfea5f5df2c",
      "sourceAnchor": "historical-source-section-4efee765",
      "unitKind": "heading",
      "sourceUnitDigest": "feecc4809f456b2d4201f2527febcdd521ca9eccf64144629268071cea373d0d",
      "claimKind": "specification",
      "status": "future"
    },
    "changedFields": [
      "origin"
    ]
  },
  "reviewScope": "All changes since fe98a6455, including origin marker drops and top-level metadata; no identity filtering and no producer approval."
}
```

## entry-039 — regenerated-check-A (A36 deep)

```json
{
  "entryId": "entry-039",
  "kind": "regenerated-check-A",
  "authorSession": "codex-session:unit-run-1792130920095-4c562e4f@2026-10-16",
  "A36": [
    "deep-required"
  ],
  "contentCommit": "ade5812a9f444f895185594aedc1f73cf8b2288a",
  "file": "plans/260925-documentation-authority-unification/reports/phase-06/step10-syncade-checks.json",
  "packageOverlay": true,
  "record": {
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
    "accountedPairs": [
      {
        "commit": "bd217ecf12bc75929d63c2285a838254b1b825cd",
        "path": "plans/260925-documentation-authority-unification/phase-06-transform-all-platform-areas-as-candidate-material.md",
        "authority": "L10-35a"
      },
      {
        "commit": "bd217ecf12bc75929d63c2285a838254b1b825cd",
        "path": "plans/260925-documentation-authority-unification/phase-09-atomic-platform-authority-cutover.md",
        "authority": "L10-35a"
      },
      {
        "commit": "db9fa7608ce5faeaadaea3d7ba0bbb98c1a8fedd",
        "path": "plans/260925-documentation-authority-unification/phase-08-eliminate-switchboard-bypasses-and-prepare-consumers.md",
        "authority": "A21"
      },
      {
        "commit": "db9fa7608ce5faeaadaea3d7ba0bbb98c1a8fedd",
        "path": "plans/260925-documentation-authority-unification/phase-09-atomic-platform-authority-cutover.md",
        "authority": "A21"
      },
      {
        "commit": "1cc92d7db383b78dafebebf6a057c3d87163afa0",
        "path": "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/consumer-survey.json",
        "authority": "A3"
      },
      {
        "commit": "1cc92d7db383b78dafebebf6a057c3d87163afa0",
        "path": "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/consumer-survey.md",
        "authority": "A3"
      },
      {
        "commit": "1cc92d7db383b78dafebebf6a057c3d87163afa0",
        "path": "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/open-questions.md",
        "authority": "A3"
      },
      {
        "commit": "1cc92d7db383b78dafebebf6a057c3d87163afa0",
        "path": "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/phase-07-draft.md",
        "authority": "A3"
      },
      {
        "commit": "1cc92d7db383b78dafebebf6a057c3d87163afa0",
        "path": "plans/260925-documentation-authority-unification/reports/phase-07-08-prep/phase-08-draft.md",
        "authority": "A3"
      }
    ],
    "unaccountedPairs": [],
    "ok": true
  },
  "HEAD": "ade5812a9f444f895185594aedc1f73cf8b2288a",
  "reproduction": "checks.mjs from step10-syncade-reproduction.json; current working overlay, exact accounted commit/path pairs; no native checker/allowlist/baseline edits."
}
```

## entry-040 — package-portable-reproduction (A36 deep)

```json
{
  "entryId": "entry-040",
  "kind": "package-portable-reproduction",
  "authorSession": "codex-session:unit-run-1792130920095-4c562e4f@2026-10-16",
  "A36": [
    "deep-required"
  ],
  "contentCommit": "ade5812a9f444f895185594aedc1f73cf8b2288a",
  "file": "plans/260925-documentation-authority-unification/reports/phase-06/step10-syncade-reproduction.json",
  "packageOverlay": true,
  "reviewScope": "Read-only script materialization with explicit external scratch and current content pin; historical sync never replayed. Optional native D requires package registry binding."
}
```

