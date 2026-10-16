# Bounded re-review part 03 at ade5812a9

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

Entries: 12.

## entry-025 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-025",
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
    "collection": "metadata",
    "key": "carryForward",
    "kind": "changed",
    "before": {
      "fromCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
      "toCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
      "oldUnits": 91374,
      "newUnits": 91386,
      "kept": 91000,
      "paired": 374,
      "moved": 0,
      "editedKept": 0,
      "added": 12,
      "gaps": 0,
      "retired": 0,
      "retiredDocuments": 0
    },
    "after": {
      "fromCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
      "toCommit": "ade5812a9f444f895185594aedc1f73cf8b2288a",
      "oldUnits": 91386,
      "newUnits": 91386,
      "kept": 91012,
      "paired": 374,
      "moved": 0,
      "editedKept": 0,
      "added": 0,
      "gaps": 0,
      "retired": 0,
      "retiredDocuments": 0
    },
    "changedFields": [
      "added",
      "fromCommit",
      "kept",
      "oldUnits",
      "toCommit"
    ]
  },
  "reviewScope": "All changes since fe98a6455, including origin marker drops and top-level metadata; no identity filtering and no producer approval."
}
```

## entry-026 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-026",
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
    "collection": "metadata",
    "key": "commit",
    "kind": "changed",
    "before": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "after": "ade5812a9f444f895185594aedc1f73cf8b2288a",
    "changedFields": []
  },
  "reviewScope": "All changes since fe98a6455, including origin marker drops and top-level metadata; no identity filtering and no producer approval."
}
```

## entry-027 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-027",
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
    "key": "claim_0876da817dfa1682359c8d1823d92452",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "0281188e0e641db30ee0578e3756c344dc917cad5b1a9092ad23b707f971c6f0",
      "identityFingerprint": "0281188e0e641db30ee0578e3756c344dc917cad5b1a9092ad23b707f971c6f0",
      "claimId": "claim_0876da817dfa1682359c8d1823d92452",
      "sourceAnchor": "unheaded-block-7",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "9216be2c3b07fb41d3f5f27307dd16239899a8f1a1207932bd4af7445a38bcdf",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "0281188e0e641db30ee0578e3756c344dc917cad5b1a9092ad23b707f971c6f0",
      "identityFingerprint": "0281188e0e641db30ee0578e3756c344dc917cad5b1a9092ad23b707f971c6f0",
      "claimId": "claim_0876da817dfa1682359c8d1823d92452",
      "sourceAnchor": "unheaded-block-7",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "9216be2c3b07fb41d3f5f27307dd16239899a8f1a1207932bd4af7445a38bcdf",
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

## entry-028 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-028",
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
    "key": "claim_4494775f2688c7b3ef05ffb458dd628a",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "a012b5f271deee5ee67eb72a82b0cb0583ecee6dd15caac036c34e2e0e9e0589",
      "identityFingerprint": "a012b5f271deee5ee67eb72a82b0cb0583ecee6dd15caac036c34e2e0e9e0589",
      "claimId": "claim_4494775f2688c7b3ef05ffb458dd628a",
      "sourceAnchor": "unheaded-block-9",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "30ad6c3c321a462677fbc037c612520d07495a445dd6a82810f85c1c30d591a9",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "a012b5f271deee5ee67eb72a82b0cb0583ecee6dd15caac036c34e2e0e9e0589",
      "identityFingerprint": "a012b5f271deee5ee67eb72a82b0cb0583ecee6dd15caac036c34e2e0e9e0589",
      "claimId": "claim_4494775f2688c7b3ef05ffb458dd628a",
      "sourceAnchor": "unheaded-block-9",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "30ad6c3c321a462677fbc037c612520d07495a445dd6a82810f85c1c30d591a9",
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

## entry-029 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-029",
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
    "key": "claim_6598b0201d76ee564e11e9fd1f6da0a2",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "92199296863d6e6cb29bfed46e4c686b1f337aa16a3c8587f23f5ad44e1a50e4",
      "identityFingerprint": "92199296863d6e6cb29bfed46e4c686b1f337aa16a3c8587f23f5ad44e1a50e4",
      "claimId": "claim_6598b0201d76ee564e11e9fd1f6da0a2",
      "sourceAnchor": "unheaded-block-6",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "a271942c1834e8f5b9f8a48c5efc501e69d2fa92ef572059f14b24a91f50ed30",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "92199296863d6e6cb29bfed46e4c686b1f337aa16a3c8587f23f5ad44e1a50e4",
      "identityFingerprint": "92199296863d6e6cb29bfed46e4c686b1f337aa16a3c8587f23f5ad44e1a50e4",
      "claimId": "claim_6598b0201d76ee564e11e9fd1f6da0a2",
      "sourceAnchor": "unheaded-block-6",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "a271942c1834e8f5b9f8a48c5efc501e69d2fa92ef572059f14b24a91f50ed30",
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

## entry-030 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-030",
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
    "key": "claim_847f0e0c56a6695d4097fb1e537ea1bc",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "77848f3356fff5dd6fc2061dce83971e320dc5ec1ba14deb17f8f67043efa00a",
      "identityFingerprint": "1f7cd60ee596859e59ac9a48da035c4c253bb060ce98f0330c72ce8fca0a3b2e",
      "claimId": "claim_847f0e0c56a6695d4097fb1e537ea1bc",
      "sourceAnchor": "historical-source-section-552ef3d6",
      "unitKind": "heading",
      "sourceUnitDigest": "d7474ce22b2aacd3fa972c85a7ab553f0712b9959468763ab90f1bbf91621899",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "77848f3356fff5dd6fc2061dce83971e320dc5ec1ba14deb17f8f67043efa00a",
      "identityFingerprint": "1f7cd60ee596859e59ac9a48da035c4c253bb060ce98f0330c72ce8fca0a3b2e",
      "claimId": "claim_847f0e0c56a6695d4097fb1e537ea1bc",
      "sourceAnchor": "historical-source-section-552ef3d6",
      "unitKind": "heading",
      "sourceUnitDigest": "d7474ce22b2aacd3fa972c85a7ab553f0712b9959468763ab90f1bbf91621899",
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

## entry-031 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-031",
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
    "key": "claim_90fb9245a91d2389ba25704be807be20",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "93eecba606a33431350a611bd22fa7f516ce5d825057520f6a067f1d029d4aec",
      "identityFingerprint": "93eecba606a33431350a611bd22fa7f516ce5d825057520f6a067f1d029d4aec",
      "claimId": "claim_90fb9245a91d2389ba25704be807be20",
      "sourceAnchor": "unheaded-block-11",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "75c5c7028e9031320b63d89f672072416ee952498f10887da01e2bbef4848ed3",
      "claimKind": "contract",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "93eecba606a33431350a611bd22fa7f516ce5d825057520f6a067f1d029d4aec",
      "identityFingerprint": "93eecba606a33431350a611bd22fa7f516ce5d825057520f6a067f1d029d4aec",
      "claimId": "claim_90fb9245a91d2389ba25704be807be20",
      "sourceAnchor": "unheaded-block-11",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "75c5c7028e9031320b63d89f672072416ee952498f10887da01e2bbef4848ed3",
      "claimKind": "contract",
      "status": "future"
    },
    "changedFields": [
      "origin"
    ]
  },
  "reviewScope": "All changes since fe98a6455, including origin marker drops and top-level metadata; no identity filtering and no producer approval."
}
```

## entry-032 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-032",
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
    "key": "claim_982fa232e8267691441436f1d7d48b22",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "e88f43cafd7183adf7c2cf3c5fa37138ff2eb72c4e2c08d5e1b8bdb97d193778",
      "identityFingerprint": "8348da6d3f917526cfbdd13cbdae8be33328fcbe3fad3132da52c5b271a98bf3",
      "claimId": "claim_982fa232e8267691441436f1d7d48b22",
      "sourceAnchor": "historical-source-section-099eb566",
      "unitKind": "heading",
      "sourceUnitDigest": "399fd8b3a421c0c53fd57345fffd92928b0b66557e931ef4c495b185dd8a73e5",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "e88f43cafd7183adf7c2cf3c5fa37138ff2eb72c4e2c08d5e1b8bdb97d193778",
      "identityFingerprint": "8348da6d3f917526cfbdd13cbdae8be33328fcbe3fad3132da52c5b271a98bf3",
      "claimId": "claim_982fa232e8267691441436f1d7d48b22",
      "sourceAnchor": "historical-source-section-099eb566",
      "unitKind": "heading",
      "sourceUnitDigest": "399fd8b3a421c0c53fd57345fffd92928b0b66557e931ef4c495b185dd8a73e5",
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

## entry-033 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-033",
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
    "key": "claim_9e9010f284010e4ee3fbc67deed8e8f1",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "3b6fd344b75a59794cfc670892719d642f630568235df187e26275e781967c4f",
      "identityFingerprint": "3b6fd344b75a59794cfc670892719d642f630568235df187e26275e781967c4f",
      "claimId": "claim_9e9010f284010e4ee3fbc67deed8e8f1",
      "sourceAnchor": "unheaded-block-8",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "4747175709c4cc34d23b4b59027e00fe31f95728f8f7791d33696ae2cd660861",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "3b6fd344b75a59794cfc670892719d642f630568235df187e26275e781967c4f",
      "identityFingerprint": "3b6fd344b75a59794cfc670892719d642f630568235df187e26275e781967c4f",
      "claimId": "claim_9e9010f284010e4ee3fbc67deed8e8f1",
      "sourceAnchor": "unheaded-block-8",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "4747175709c4cc34d23b4b59027e00fe31f95728f8f7791d33696ae2cd660861",
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

## entry-034 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-034",
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
    "key": "claim_c321de74b624d639e56cb4dc77169655",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "06dd4d583816ca7178e9106eade800dadf1087ef98c515b859af17290572b623",
      "identityFingerprint": "06dd4d583816ca7178e9106eade800dadf1087ef98c515b859af17290572b623",
      "claimId": "claim_c321de74b624d639e56cb4dc77169655",
      "sourceAnchor": "unheaded-block-12",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "26cd8fbf0cce5fac3315235ebd00984cd4cc8a7ce80bac342e56f816848a7270",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "06dd4d583816ca7178e9106eade800dadf1087ef98c515b859af17290572b623",
      "identityFingerprint": "06dd4d583816ca7178e9106eade800dadf1087ef98c515b859af17290572b623",
      "claimId": "claim_c321de74b624d639e56cb4dc77169655",
      "sourceAnchor": "unheaded-block-12",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "26cd8fbf0cce5fac3315235ebd00984cd4cc8a7ce80bac342e56f816848a7270",
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

## entry-035 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-035",
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
    "key": "claim_d5e5139015078092355b369260cee249",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "abb93562a4c25c698437e9408bc5b1f8a88fdbab2203b9d17ebfb8b116ae4fa4",
      "identityFingerprint": "0e207f586f8222cb9231998bbe90e251766bbbc1e7e9a647074816c5090426e1",
      "claimId": "claim_d5e5139015078092355b369260cee249",
      "sourceAnchor": "historical-source-section-0686418a",
      "unitKind": "heading",
      "sourceUnitDigest": "0232edaa58949708208a01bab57f0b92fa341bac85d0085530d5909fef47170a",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "abb93562a4c25c698437e9408bc5b1f8a88fdbab2203b9d17ebfb8b116ae4fa4",
      "identityFingerprint": "0e207f586f8222cb9231998bbe90e251766bbbc1e7e9a647074816c5090426e1",
      "claimId": "claim_d5e5139015078092355b369260cee249",
      "sourceAnchor": "historical-source-section-0686418a",
      "unitKind": "heading",
      "sourceUnitDigest": "0232edaa58949708208a01bab57f0b92fa341bac85d0085530d5909fef47170a",
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

## entry-036 — registry-change-since-request (A36 deep)

```json
{
  "entryId": "entry-036",
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
    "key": "claim_d8a2c7490367e214b55e86913275bd1b",
    "kind": "changed",
    "before": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "1094f99866ee72fdd8a9b9b9e5d77996700afb853e229136cf1dfb301c4a780d",
      "identityFingerprint": "1094f99866ee72fdd8a9b9b9e5d77996700afb853e229136cf1dfb301c4a780d",
      "claimId": "claim_d8a2c7490367e214b55e86913275bd1b",
      "sourceAnchor": "unheaded-block-13",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "16efa16fda7dbea715e869140f384909207de259f0e88effa0b3ad2d106f2798",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-62751458b22b47e930dc33b8501d07798b91ace3"
    },
    "after": {
      "sourcePath": "docs/platform/runner/spec.md",
      "unitDigest": "1094f99866ee72fdd8a9b9b9e5d77996700afb853e229136cf1dfb301c4a780d",
      "identityFingerprint": "1094f99866ee72fdd8a9b9b9e5d77996700afb853e229136cf1dfb301c4a780d",
      "claimId": "claim_d8a2c7490367e214b55e86913275bd1b",
      "sourceAnchor": "unheaded-block-13",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "16efa16fda7dbea715e869140f384909207de259f0e88effa0b3ad2d106f2798",
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

