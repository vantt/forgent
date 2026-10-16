# Bounded re-review: rationales 9

Author session: `codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **18**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
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

## Entry rationale-237

```json
{
  "entryId": "rationale-237",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_9a5781f0086209a17330035ff0e58638",
  "before": {
    "claimId": "claim_9a5781f0086209a17330035ff0e58638",
    "sourceUnitDigest": "f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "targetAnchor": "4-plugin-registry-linker",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:103-103#4-plugin-registry-linker (current lines); unit SHA256 f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c.\nTarget: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:155-155#4-plugin-registry-linker (current lines); unit SHA256 cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-008 restoration\" (../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula); resolved none → docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula.\nHeading depth: 2 → 4; title \"4. Plugin Registry Linker\" → \"4. Plugin Registry Linker\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker under docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker; source context \"External Provider Protocol\", target context \"Architecture: External Provider Protocol / Retained selected source material / External Provider Protocol\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker is retained verbatim at docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-32 (claim_08172f75766eb1d002d4cba2669f9bbd; The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; veri); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-33 (claim_7e15be77fb7c4bff223728491df3e212; Its complete input/output physics:); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-34 (claim_0f401249972ad0ce465e24e0932a2834; ```txt authored OperationCatalog + built-in provider descriptors + transitional CLI-compatibility bindings + validated external manifest dec)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker is retained verbatim at docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-32 (claim_08172f75766eb1d002d4cba2669f9bbd; The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; veri); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-33 (claim_7e15be77fb7c4bff223728491df3e212; Its complete input/output physics:); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-34 (claim_0f401249972ad0ce465e24e0932a2834; ```txt authored OperationCatalog + built-in provider descriptors + transitional CLI-compatibility bindings + validated external manifest dec).",
    "reviewNote": "rationale-432: deep: partial-carry of a heading (depth 2 to 4, same title); named remainders checked by script: b32 found b33 found b34 found inside restored section restored-registry-linker-procedure-and-its-input-output-form; the sentence that the source text occurs verbatim inside the target section is true only because the shorter heading line is a substring of the deeper one, the real carry is the Recorded residual, whose anchors exist; facts recomputed equal: source 4-plugin-registry-linker L103-103, target 4-plugin-registry-linker L155-155, both full digests, links 0/1 (0 destination changes, 1 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause cda1c088 at 0c06e6e6b matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-08-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32",
    "targetAncestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_9a5781f0086209a17330035ff0e58638",
    "sourceUnitDigest": "f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "targetAnchor": "4-plugin-registry-linker",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:103-103#4-plugin-registry-linker (current lines); unit SHA256 f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c.\nTarget: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:155-155#4-plugin-registry-linker (current lines); unit SHA256 cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-008 restoration\" (../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula); resolved none → docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula.\nHeading depth: 2 → 4; title \"4. Plugin Registry Linker\" → \"4. Plugin Registry Linker\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order differs; 10 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"4. Plugin Registry Linker\" → \"4. Plugin Registry Linker\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; verifies compatibility, provider presence, and integrity policy; resolves IDs, namespace claims, precedence, and explicit replacements; emits a deterministic derived lock/cache for help, introspection, dispatch, init, and doctor; starts a selected provider and uses `describe` only to confirm it matches the accepted manifest.\",\"Its complete input/output physics:\",\"```txt\",\"authored OperationCatalog\",\"+ built-in provider descriptors\",\"+ transitional CLI-compatibility bindings\",\"+ validated external manifest declarations\",\"+ explicit global/project enable-disable-replacement policy\",\"  -> immutable RegistrySnapshot + source fingerprint\",\"```\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker under docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker; source context \"External Provider Protocol\", target context \"Architecture: External Provider Protocol / Retained selected source material / External Provider Protocol\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker is retained verbatim at docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-32 (claim_08172f75766eb1d002d4cba2669f9bbd; The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; veri); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-33 (claim_7e15be77fb7c4bff223728491df3e212; Its complete input/output physics:); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-34 (claim_0f401249972ad0ce465e24e0932a2834; ```txt authored OperationCatalog + built-in provider descriptors + transitional CLI-compatibility bindings + validated external manifest dec)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker is retained verbatim at docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-32 (claim_08172f75766eb1d002d4cba2669f9bbd; The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; veri); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-33 (claim_7e15be77fb7c4bff223728491df3e212; Its complete input/output physics:); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-34 (claim_0f401249972ad0ce465e24e0932a2834; ```txt authored OperationCatalog + built-in provider descriptors + transitional CLI-compatibility bindings + validated external manifest dec).",
    "targetUnitDigest": "cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32",
    "targetAncestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 236,
  "factsSHA256": "e616623a30cb1c5ce5639f89446354f1613a15224d5aa0530c7c21e3a4f71941",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Plugin Registry Linker",
    "anchor": "4-plugin-registry-linker",
    "githubAnchor": "4-plugin-registry-linker",
    "stableAnchor": "h-a2b565e6393b",
    "startLine": 103,
    "endLine": 103,
    "textDigest": "f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c",
    "sample": "4. Plugin Registry Linker",
    "sectionPayloadDigest": "06294fe91566f87f10d33546b570a4cbe4335fe0ad139d6165aa976a6d84d5f5",
    "followingBlockDigest": "db002cc2af859f74874068b3e2db12c43f8dfe07276a1d602e1169446d3e88a8",
    "identityFingerprint": "6812f2d8bc7a159b057e63ed8d7aa6c0d1ce836de739e58e4015751f5bedd0c4",
    "ancestry": [
      "External Provider Protocol"
    ],
    "path": "docs/architect/host-invocation-routing/external-provider-protocol.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "4. Plugin Registry Linker",
    "anchor": "4-plugin-registry-linker",
    "githubAnchor": "4-plugin-registry-linker",
    "stableAnchor": "h-de7e325bf7d1",
    "startLine": 155,
    "endLine": 155,
    "textDigest": "cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32",
    "sample": "4. Plugin Registry Linker",
    "sectionPayloadDigest": "a208fa4696f2121b98ebf8f7320e53cf3d1820b288e3a466a8e1b65a88eb636d",
    "followingBlockDigest": "db002cc2af859f74874068b3e2db12c43f8dfe07276a1d602e1169446d3e88a8",
    "identityFingerprint": "e4237eb9a37385b91dd638586cc130db172170f5db48f402d26c015a0a883cee",
    "ancestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"4. Plugin Registry Linker\" → \"4. Plugin Registry Linker\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; verifies compatibility, provider presence, and integrity policy; resolves IDs, namespace claims, precedence, and explicit replacements; emits a deterministic derived lock/cache for help, introspection, dispatch, init, and doctor; starts a selected provider and uses `describe` only to confirm it matches the accepted manifest.\",\"Its complete input/output physics:\",\"```txt\",\"authored OperationCatalog\",\"+ built-in provider descriptors\",\"+ transitional CLI-compatibility bindings\",\"+ validated external manifest declarations\",\"+ explicit global/project enable-disable-replacement policy\",\"  -> immutable RegistrySnapshot + source fingerprint\",\"```\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/236/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_9a5781f0086209a17330035ff0e58638",
    "sourceUnitDigest": "f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "targetAnchor": "4-plugin-registry-linker",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/external-provider-protocol.md:103-103#4-plugin-registry-linker (current lines); unit SHA256 f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c.\nTarget: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md:155-155#4-plugin-registry-linker (current lines); unit SHA256 cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-008 restoration\" (../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula); resolved none → docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula.\nHeading depth: 2 → 4; title \"4. Plugin Registry Linker\" → \"4. Plugin Registry Linker\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order differs; 10 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"4. Plugin Registry Linker\" → \"4. Plugin Registry Linker\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; verifies compatibility, provider presence, and integrity policy; resolves IDs, namespace claims, precedence, and explicit replacements; emits a deterministic derived lock/cache for help, introspection, dispatch, init, and doctor; starts a selected provider and uses `describe` only to confirm it matches the accepted manifest.\",\"Its complete input/output physics:\",\"```txt\",\"authored OperationCatalog\",\"+ built-in provider descriptors\",\"+ transitional CLI-compatibility bindings\",\"+ validated external manifest declarations\",\"+ explicit global/project enable-disable-replacement policy\",\"  -> immutable RegistrySnapshot + source fingerprint\",\"```\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker under docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker; source context \"External Provider Protocol\", target context \"Architecture: External Provider Protocol / Retained selected source material / External Provider Protocol\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker is retained verbatim at docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-32 (claim_08172f75766eb1d002d4cba2669f9bbd; The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; veri); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-33 (claim_7e15be77fb7c4bff223728491df3e212; Its complete input/output physics:); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-34 (claim_0f401249972ad0ce465e24e0932a2834; ```txt authored OperationCatalog + built-in provider descriptors + transitional CLI-compatibility bindings + validated external manifest dec)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker is retained verbatim at docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-32 (claim_08172f75766eb1d002d4cba2669f9bbd; The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; veri); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-33 (claim_7e15be77fb7c4bff223728491df3e212; Its complete input/output physics:); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-34 (claim_0f401249972ad0ce465e24e0932a2834; ```txt authored OperationCatalog + built-in provider descriptors + transitional CLI-compatibility bindings + validated external manifest dec).",
    "targetUnitDigest": "cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32",
    "targetAncestry": [
      "Architecture: External Provider Protocol",
      "Retained selected source material",
      "External Provider Protocol"
    ]
  }
}
```

## Entry rationale-238

```json
{
  "entryId": "rationale-238",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_80fe1621540d25e5e4f6968bea7e0a0b",
  "before": {
    "claimId": "claim_80fe1621540d25e5e4f6968bea7e0a0b",
    "sourceUnitDigest": "5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "5-core-contracts",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:97-97#5-core-contracts (current lines); unit SHA256 5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3.\nTarget: docs/platform/host-invocation-routing/spec.md:203-203#5-core-contracts (current lines); unit SHA256 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 2, target 3; 3 changed spellings/labels, 2 destination changes; 1 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 2: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nLink 3: \"none\" (none) → \"the dropped-002 restoration\" (contracts/component-protocol.md#restored-contract-versioning); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning.\nHeading depth: 2 → 4; title \"5. Core Contracts\" → \"5. Core Contracts\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts under docs/platform/host-invocation-routing/spec.md#5-core-contracts; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-24 (claim_bbaec409dcbaee8f33968727aa0abed5; **Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range )..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-24 (claim_bbaec409dcbaee8f33968727aa0abed5; **Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range ).",
    "reviewNote": "rationale-447: deep: partial-carry of a heading (depth 2 to 4, same title); named remainders checked by script: b24 found inside restored section restored-contract-versioning; the sentence that the source text occurs verbatim inside the target section is true only because the shorter heading line is a substring of the deeper one, the real carry is the Recorded residual, whose anchors exist; facts recomputed equal: source 5-core-contracts L97-97, target 5-core-contracts L203-203, both full digests, links 2/3 (2 destination changes, 1 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 9274b7dd at 0c06e6e6b matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-08-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_80fe1621540d25e5e4f6968bea7e0a0b",
    "sourceUnitDigest": "5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "5-core-contracts",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:97-97#5-core-contracts (current lines); unit SHA256 5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3.\nTarget: docs/platform/host-invocation-routing/spec.md:203-203#5-core-contracts (current lines); unit SHA256 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 2, target 3; 3 changed spellings/labels, 2 destination changes; 1 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 2: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nLink 3: \"none\" (none) → \"the dropped-002 restoration\" (contracts/component-protocol.md#restored-contract-versioning); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning.\nHeading depth: 2 → 4; title \"5. Core Contracts\" → \"5. Core Contracts\".\nWhole direct section differs; depth 2 → 4; 3 distinct link changes; normalized line order differs; 1 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"5. Core Contracts\" → \"5. Core Contracts\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/spec.md#5-core-contracts. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"**Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range intersection — no runtime \\\"best effort\\\" coercion. An incompatible change gets a new operation variant or major contract version per the owning component's policy; adapters may perform an explicit registered upgrade/downgrade transform, recorded in diagnostics — the router never reshapes payloads implicitly.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts under docs/platform/host-invocation-routing/spec.md#5-core-contracts; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-24 (claim_bbaec409dcbaee8f33968727aa0abed5; **Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range )..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-24 (claim_bbaec409dcbaee8f33968727aa0abed5; **Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range ).",
    "targetUnitDigest": "9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 237,
  "factsSHA256": "7795106c21864a72571f9b755fd064c63d0a70698390115ea25bd4c2c21b0333",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Core Contracts",
    "anchor": "5-core-contracts",
    "githubAnchor": "5-core-contracts",
    "stableAnchor": "h-9d08dad38bf5",
    "startLine": 97,
    "endLine": 97,
    "textDigest": "5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3",
    "sample": "5. Core Contracts",
    "sectionPayloadDigest": "c867fc71a65cc817c0c2ab8cdc6c6e8ac02ac0f12d580d7ee921dce648aa5848",
    "followingBlockDigest": "86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e",
    "identityFingerprint": "3868b34f662121cb8d4f0afce84ab7e66499ddaef842b266f0effe0ba83a8f4b",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "path": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "5. Core Contracts",
    "anchor": "5-core-contracts",
    "githubAnchor": "5-core-contracts",
    "stableAnchor": "h-dc2f52ad5387",
    "startLine": 203,
    "endLine": 203,
    "textDigest": "9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79",
    "sample": "5. Core Contracts",
    "sectionPayloadDigest": "599761c6d3a1318c0a0f3bac6eec2b4d274af62b08831d38129471f913f7da58",
    "followingBlockDigest": "86cb21687de69958f80760e385f227f908f68738f5a4a6c9f60f260e4d16d18e",
    "identityFingerprint": "a920610fbd9c39cf0b7a9f2baba84f180fe9699dfdb462a8a7da7d83cb651f81",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "path": "docs/platform/host-invocation-routing/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"5. Core Contracts\" → \"5. Core Contracts\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/spec.md#5-core-contracts. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"**Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range intersection — no runtime \\\"best effort\\\" coercion. An incompatible change gets a new operation variant or major contract version per the owning component's policy; adapters may perform an explicit registered upgrade/downgrade transform, recorded in diagnostics — the router never reshapes payloads implicitly.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/237/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_80fe1621540d25e5e4f6968bea7e0a0b",
    "sourceUnitDigest": "5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "5-core-contracts",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:97-97#5-core-contracts (current lines); unit SHA256 5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3.\nTarget: docs/platform/host-invocation-routing/spec.md:203-203#5-core-contracts (current lines); unit SHA256 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 2, target 3; 3 changed spellings/labels, 2 destination changes; 1 added, 0 removed.\nLink 1: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (architecture/external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 2: \"Legacy CLI Transition\" (./legacy-cli-transition.md) → \"Legacy CLI Transition\" (architecture/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md.\nLink 3: \"none\" (none) → \"the dropped-002 restoration\" (contracts/component-protocol.md#restored-contract-versioning); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning.\nHeading depth: 2 → 4; title \"5. Core Contracts\" → \"5. Core Contracts\".\nWhole direct section differs; depth 2 → 4; 3 distinct link changes; normalized line order differs; 1 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"5. Core Contracts\" → \"5. Core Contracts\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/spec.md#5-core-contracts. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"**Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range intersection — no runtime \\\"best effort\\\" coercion. An incompatible change gets a new operation variant or major contract version per the owning component's policy; adapters may perform an explicit registered upgrade/downgrade transform, recorded in diagnostics — the router never reshapes payloads implicitly.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts under docs/platform/host-invocation-routing/spec.md#5-core-contracts; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-24 (claim_bbaec409dcbaee8f33968727aa0abed5; **Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range )..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-24 (claim_bbaec409dcbaee8f33968727aa0abed5; **Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range ).",
    "targetUnitDigest": "9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ]
  }
}
```

## Entry rationale-239

```json
{
  "entryId": "rationale-239",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_76dfcba31d147e73488ea3abeade7ef1",
  "before": {
    "claimId": "claim_76dfcba31d147e73488ea3abeade7ef1",
    "sourceUnitDigest": "7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:163-163#8-failure-cancellation-lifecycle-and-human-input (current lines); unit SHA256 7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224.\nTarget: docs/platform/host-invocation-routing/spec.md:271-271#8-failure-cancellation-lifecycle-and-human-input (current lines); unit SHA256 a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 2; 2 changed spellings/labels, 0 destination changes; 2 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-003 restoration\" (contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te.\nLink 2: \"none\" (none) → \"the dropped-002 restoration\" (contracts/component-protocol.md#restored-contract-versioning); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning.\nHeading depth: 2 → 4; title \"8. Failure, Cancellation, Lifecycle, And Human Input\" → \"8. Failure, Cancellation, Lifecycle, And Human Input\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input under docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-41 (claim_75c780a31188a0fa1e19d03ccbd3b6b1; ```txt received -> admitted | admission-refused -> selected | selection-refused -> granted | grant-refused -> dis); docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-43 (claim_e365a92a236aa909b9148185aa8f0801; For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never i)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-41 (claim_75c780a31188a0fa1e19d03ccbd3b6b1; ```txt received -> admitted | admission-refused -> selected | selection-refused -> granted | grant-refused -> dis); docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-43 (claim_e365a92a236aa909b9148185aa8f0801; For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never i).",
    "reviewNote": "rationale-469: deep: partial-carry of a heading (depth 2 to 4, same title); named remainders checked by script: b41 found b43 found inside restored section restored-lifecycle-state-chain-received-admitted-refused-sel; the sentence that the source text occurs verbatim inside the target section is true only because the shorter heading line is a substring of the deeper one, the real carry is the Recorded residual, whose anchors exist; facts recomputed equal: source 8-failure-cancellation-lifecycle-and-human-input L163-163, target 8-failure-cancellation-lifecycle-and-human-input L271-271, both full digests, links 0/2 (0 destination changes, 2 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause a3fd2fb5 at 0c06e6e6b matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-08-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_76dfcba31d147e73488ea3abeade7ef1",
    "sourceUnitDigest": "7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:163-163#8-failure-cancellation-lifecycle-and-human-input (current lines); unit SHA256 7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224.\nTarget: docs/platform/host-invocation-routing/spec.md:271-271#8-failure-cancellation-lifecycle-and-human-input (current lines); unit SHA256 a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 2; 2 changed spellings/labels, 0 destination changes; 2 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-003 restoration\" (contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te.\nLink 2: \"none\" (none) → \"the dropped-002 restoration\" (contracts/component-protocol.md#restored-contract-versioning); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning.\nHeading depth: 2 → 4; title \"8. Failure, Cancellation, Lifecycle, And Human Input\" → \"8. Failure, Cancellation, Lifecycle, And Human Input\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 9 removed and 2 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"8. Failure, Cancellation, Lifecycle, And Human Input\" → \"8. Failure, Cancellation, Lifecycle, And Human Input\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"```txt\",\"received -> admitted | admission-refused\",\"         -> selected | selection-refused\",\"         -> granted | grant-refused\",\"         -> dispatched\",\"         -> succeeded | semantic-failed | cancelled | deadline-exceeded\",\"                       | provider-failed | completion-unknown\",\"```\",\"For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never invents one. Read-only does not imply retry-safe when the provider has external effects — the catalog's declared idempotency decides.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input under docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-41 (claim_75c780a31188a0fa1e19d03ccbd3b6b1; ```txt received -> admitted | admission-refused -> selected | selection-refused -> granted | grant-refused -> dis); docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-43 (claim_e365a92a236aa909b9148185aa8f0801; For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never i)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-41 (claim_75c780a31188a0fa1e19d03ccbd3b6b1; ```txt received -> admitted | admission-refused -> selected | selection-refused -> granted | grant-refused -> dis); docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-43 (claim_e365a92a236aa909b9148185aa8f0801; For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never i).",
    "targetUnitDigest": "a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 238,
  "factsSHA256": "3b1853b507b9ca170ecd18ccd7c3ada144ec928d6ea03d451e3503d61ee1a5f8",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "anchor": "8-failure-cancellation-lifecycle-and-human-input",
    "githubAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "stableAnchor": "h-a136c9138d1f",
    "startLine": 163,
    "endLine": 163,
    "textDigest": "7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224",
    "sample": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionPayloadDigest": "10fd3245265492235016efbe525b8d9659ccd0f9954f884c3eb0acaa3aa25a32",
    "followingBlockDigest": "57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15",
    "identityFingerprint": "ddf352ff8ccb2862b427dad4756b12f0799c375068843baa0e71b572e918a0df",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "path": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "anchor": "8-failure-cancellation-lifecycle-and-human-input",
    "githubAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "stableAnchor": "h-8fb36a9fc51d",
    "startLine": 271,
    "endLine": 271,
    "textDigest": "a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6",
    "sample": "8. Failure, Cancellation, Lifecycle, And Human Input",
    "sectionPayloadDigest": "a6182701fc2342bc0cfb57af9d3938f78825c17dd9dd88234371c35e325eb6d2",
    "followingBlockDigest": "57b360fb2f5eca6c39e0789d26807cd21d768ecf49004ae6946c79460e18be15",
    "identityFingerprint": "38d1a84904eef01fab2fcb4720ba8c8f5d843ef4095bc8c7dce8de631557220b",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "path": "docs/platform/host-invocation-routing/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"8. Failure, Cancellation, Lifecycle, And Human Input\" → \"8. Failure, Cancellation, Lifecycle, And Human Input\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"```txt\",\"received -> admitted | admission-refused\",\"         -> selected | selection-refused\",\"         -> granted | grant-refused\",\"         -> dispatched\",\"         -> succeeded | semantic-failed | cancelled | deadline-exceeded\",\"                       | provider-failed | completion-unknown\",\"```\",\"For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never invents one. Read-only does not imply retry-safe when the provider has external effects — the catalog's declared idempotency decides.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/238/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_76dfcba31d147e73488ea3abeade7ef1",
    "sourceUnitDigest": "7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "8-failure-cancellation-lifecycle-and-human-input",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:163-163#8-failure-cancellation-lifecycle-and-human-input (current lines); unit SHA256 7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224.\nTarget: docs/platform/host-invocation-routing/spec.md:271-271#8-failure-cancellation-lifecycle-and-human-input (current lines); unit SHA256 a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6 at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 2; 2 changed spellings/labels, 0 destination changes; 2 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-003 restoration\" (contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te.\nLink 2: \"none\" (none) → \"the dropped-002 restoration\" (contracts/component-protocol.md#restored-contract-versioning); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning.\nHeading depth: 2 → 4; title \"8. Failure, Cancellation, Lifecycle, And Human Input\" → \"8. Failure, Cancellation, Lifecycle, And Human Input\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 9 removed and 2 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"8. Failure, Cancellation, Lifecycle, And Human Input\" → \"8. Failure, Cancellation, Lifecycle, And Human Input\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"```txt\",\"received -> admitted | admission-refused\",\"         -> selected | selection-refused\",\"         -> granted | grant-refused\",\"         -> dispatched\",\"         -> succeeded | semantic-failed | cancelled | deadline-exceeded\",\"                       | provider-failed | completion-unknown\",\"```\",\"For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never invents one. Read-only does not imply retry-safe when the provider has external effects — the catalog's declared idempotency decides.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input under docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-41 (claim_75c780a31188a0fa1e19d03ccbd3b6b1; ```txt received -> admitted | admission-refused -> selected | selection-refused -> granted | grant-refused -> dis); docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-43 (claim_e365a92a236aa909b9148185aa8f0801; For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never i)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-41 (claim_75c780a31188a0fa1e19d03ccbd3b6b1; ```txt received -> admitted | admission-refused -> selected | selection-refused -> granted | grant-refused -> dis); docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-43 (claim_e365a92a236aa909b9148185aa8f0801; For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never i).",
    "targetUnitDigest": "a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ]
  }
}
```

## Entry rationale-240

```json
{
  "entryId": "rationale-240",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_080c5cdacf820ed661ab372086ca7e41",
  "before": {
    "claimId": "claim_080c5cdacf820ed661ab372086ca7e41",
    "sourceUnitDigest": "26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "9-physical-placement",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:190-190#9-physical-placement (current lines); unit SHA256 26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35.\nTarget: docs/platform/host-invocation-routing/spec.md:295-295#9-physical-placement (current lines); unit SHA256 e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-004 restoration\" (architecture/release-boundaries.md#restored-physical-placement-layout-tree); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree.\nLink 2: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"9. Physical Placement\" → \"9. Physical Placement\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement under docs/platform/host-invocation-routing/spec.md#9-physical-placement; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 (claim_54536d1078dc6a2b6eacd17105389f2b; ```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crat)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 (claim_54536d1078dc6a2b6eacd17105389f2b; ```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crat).",
    "targetUnitDigest": "e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ]
  },
  "after": {
    "claimId": "claim_080c5cdacf820ed661ab372086ca7e41",
    "sourceUnitDigest": "26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "9-physical-placement",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:190-190#9-physical-placement (current lines); unit SHA256 26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35.\nTarget: docs/platform/host-invocation-routing/spec.md:295-295#9-physical-placement (current lines); unit SHA256 e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-004 restoration\" (architecture/release-boundaries.md#restored-physical-placement-layout-tree); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree.\nLink 2: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"9. Physical Placement\" → \"9. Physical Placement\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 23 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"9. Physical Placement\" → \"9. Physical Placement\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/spec.md#9-physical-placement. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"```txt\",\"Cargo.toml                           # workspace root; herdr-plugin/ excluded in R1\",\"apps/\",\"  fgos/                              # crate `fgos`, binary `fgos` — thin CLI adapter\",\"    src/cli_projector.rs             # argv -> OperationRequest\",\"    src/cli_presenter.rs             # ProviderOutcome -> fgos.v1 / exit code\",\"    src/legacy_exec.rs               # CommandRouteDescriptor lookup + Node payload exec\",\"  gateway/                           # later: thin REST/MCP/remote adapter (repo-layout-vision)\",\"packages/\",\"  host-runtime/rust/                 # crate `fgos-host-runtime` — the kernel\",\"    src/contracts.rs                 # OperationId, HostInvocation, OperationRequest, ProviderOutcome, ...\",\"    src/operation_provider_router.rs\",\"    src/invocation_service.rs\",\"    src/authority_gate.rs\",\"    src/providers/builtin.rs\",\"    src/remote_host_use_case.rs      # R3\",\"    src/chat_host_use_case.rs        # later\",\"    src/registry_linker.rs           # R2\",\"    src/providers/{external_process,external_wasm}.rs   # R2+\",\"  distribution/rust/                 # crate `fgos-distribution` — owns distribution.build.show\",\"  component-protocol/{rust,node}/    # R2: EncodedMessage, framed protocol\",\"bin/fgos.mjs, src/, scripts/, core/ ...   # the Node payload, unmoved (Legacy CLI Transition §2)\",\"```\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement under docs/platform/host-invocation-routing/spec.md#9-physical-placement; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 (claim_54536d1078dc6a2b6eacd17105389f2b; ```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crat)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 (claim_54536d1078dc6a2b6eacd17105389f2b; ```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crat).",
    "targetUnitDigest": "e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 239,
  "factsSHA256": "8fdc3bfbc76c4dfdf6e11d6c8e0da632c71ffb64c76b166147b4228c0f9ac67d",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "9. Physical Placement",
    "anchor": "9-physical-placement",
    "githubAnchor": "9-physical-placement",
    "stableAnchor": "h-734ef9c7c806",
    "startLine": 190,
    "endLine": 190,
    "textDigest": "26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35",
    "sample": "9. Physical Placement",
    "sectionPayloadDigest": "86f63d6a668a01cf29b981c04f573fe6b18a2ad20f3a3e948e53004b8d9bb7ed",
    "followingBlockDigest": "c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07",
    "identityFingerprint": "025318b6bff39c21f35236b4ec2d2418b6fac8017fa62a96f2cbcfe9bd846fd3",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture"
    ],
    "path": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "9. Physical Placement",
    "anchor": "9-physical-placement",
    "githubAnchor": "9-physical-placement",
    "stableAnchor": "h-7c278e54ecd8",
    "startLine": 295,
    "endLine": 295,
    "textDigest": "e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd",
    "sample": "9. Physical Placement",
    "sectionPayloadDigest": "c51adc02424a50747579774080234a1a9eda8133323f53bb1d9cbd83849b5976",
    "followingBlockDigest": "c840292ccea938c3cf06ce6a02184761ebb3e3e8c6929420be628a793adced07",
    "identityFingerprint": "9ba1cd8ce19abe5df3fefbb1182053c1a27825c330997a3de38362121dcaf0ba",
    "ancestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ],
    "path": "docs/platform/host-invocation-routing/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"9. Physical Placement\" → \"9. Physical Placement\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/spec.md#9-physical-placement. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"```txt\",\"Cargo.toml                           # workspace root; herdr-plugin/ excluded in R1\",\"apps/\",\"  fgos/                              # crate `fgos`, binary `fgos` — thin CLI adapter\",\"    src/cli_projector.rs             # argv -> OperationRequest\",\"    src/cli_presenter.rs             # ProviderOutcome -> fgos.v1 / exit code\",\"    src/legacy_exec.rs               # CommandRouteDescriptor lookup + Node payload exec\",\"  gateway/                           # later: thin REST/MCP/remote adapter (repo-layout-vision)\",\"packages/\",\"  host-runtime/rust/                 # crate `fgos-host-runtime` — the kernel\",\"    src/contracts.rs                 # OperationId, HostInvocation, OperationRequest, ProviderOutcome, ...\",\"    src/operation_provider_router.rs\",\"    src/invocation_service.rs\",\"    src/authority_gate.rs\",\"    src/providers/builtin.rs\",\"    src/remote_host_use_case.rs      # R3\",\"    src/chat_host_use_case.rs        # later\",\"    src/registry_linker.rs           # R2\",\"    src/providers/{external_process,external_wasm}.rs   # R2+\",\"  distribution/rust/                 # crate `fgos-distribution` — owns distribution.build.show\",\"  component-protocol/{rust,node}/    # R2: EncodedMessage, framed protocol\",\"bin/fgos.mjs, src/, scripts/, core/ ...   # the Node payload, unmoved (Legacy CLI Transition §2)\",\"```\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/239/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_080c5cdacf820ed661ab372086ca7e41",
    "sourceUnitDigest": "26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35",
    "claimKind": "architecture",
    "kind": "spec",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/spec.md",
    "targetAnchor": "9-physical-placement",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:190-190#9-physical-placement (current lines); unit SHA256 26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35.\nTarget: docs/platform/host-invocation-routing/spec.md:295-295#9-physical-placement (current lines); unit SHA256 e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-004 restoration\" (architecture/release-boundaries.md#restored-physical-placement-layout-tree); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree.\nLink 2: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"9. Physical Placement\" → \"9. Physical Placement\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 23 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"9. Physical Placement\" → \"9. Physical Placement\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/spec.md#9-physical-placement. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"```txt\",\"Cargo.toml                           # workspace root; herdr-plugin/ excluded in R1\",\"apps/\",\"  fgos/                              # crate `fgos`, binary `fgos` — thin CLI adapter\",\"    src/cli_projector.rs             # argv -> OperationRequest\",\"    src/cli_presenter.rs             # ProviderOutcome -> fgos.v1 / exit code\",\"    src/legacy_exec.rs               # CommandRouteDescriptor lookup + Node payload exec\",\"  gateway/                           # later: thin REST/MCP/remote adapter (repo-layout-vision)\",\"packages/\",\"  host-runtime/rust/                 # crate `fgos-host-runtime` — the kernel\",\"    src/contracts.rs                 # OperationId, HostInvocation, OperationRequest, ProviderOutcome, ...\",\"    src/operation_provider_router.rs\",\"    src/invocation_service.rs\",\"    src/authority_gate.rs\",\"    src/providers/builtin.rs\",\"    src/remote_host_use_case.rs      # R3\",\"    src/chat_host_use_case.rs        # later\",\"    src/registry_linker.rs           # R2\",\"    src/providers/{external_process,external_wasm}.rs   # R2+\",\"  distribution/rust/                 # crate `fgos-distribution` — owns distribution.build.show\",\"  component-protocol/{rust,node}/    # R2: EncodedMessage, framed protocol\",\"bin/fgos.mjs, src/, scripts/, core/ ...   # the Node payload, unmoved (Legacy CLI Transition §2)\",\"```\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement under docs/platform/host-invocation-routing/spec.md#9-physical-placement; source context \"Host Invocation And Provider Routing Architecture\", target context \"Spec: Host Invocation / Retained selected source material / Host Invocation And Provider Routing Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 (claim_54536d1078dc6a2b6eacd17105389f2b; ```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crat)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 (claim_54536d1078dc6a2b6eacd17105389f2b; ```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crat).",
    "targetUnitDigest": "e95f14771b2c72fc9eb48e5c9813b74f897175763fa9b44441fb2cb6a896c1cd",
    "targetAncestry": [
      "Spec: Host Invocation",
      "Retained selected source material",
      "Host Invocation And Provider Routing Architecture"
    ]
  }
}
```

## Entry rationale-241

```json
{
  "entryId": "rationale-241",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_54536d1078dc6a2b6eacd17105389f2b",
  "before": {
    "claimId": "claim_54536d1078dc6a2b6eacd17105389f2b",
    "sourceUnitDigest": "929b1469dbdfbbdfadf002fdd962c3bfd29976b3f19680af12997836a904fde9",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-10",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:194-218#unheaded-block-46 (current lines); unit SHA256 929b1469dbdfbbdfadf002fdd962c3bfd29976b3f19680af12997836a904fde9.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:70-96#unheaded-block-10 (current lines); unit SHA256 d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-10; source context \"Host Invocation And Provider Routing Architecture / 9. Physical Placement\", target context \"Architecture: Release Boundaries / Restored physical placement layout tree\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-476: deep: move where the source block sits byte-for-byte inside the target unit, which only adds a ````md fence (target is exactly 12 characters longer: fence open and close), the restored literal block; the verbatim-inside sentence is true; facts recomputed equal: source unheaded-block-46 L194-218, target unheaded-block-10 L70-96, both full digests, links 0/0 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause d6fcc6cf at 13322f8a6 matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-08-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475",
    "targetAncestry": [
      "Architecture: Release Boundaries",
      "Restored physical placement layout tree"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_54536d1078dc6a2b6eacd17105389f2b",
    "sourceUnitDigest": "929b1469dbdfbbdfadf002fdd962c3bfd29976b3f19680af12997836a904fde9",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-10",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:194-218#unheaded-block-46 (current lines); unit SHA256 929b1469dbdfbbdfadf002fdd962c3bfd29976b3f19680af12997836a904fde9.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:70-96#unheaded-block-10 (current lines); unit SHA256 d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-10; source context \"Host Invocation And Provider Routing Architecture / 9. Physical Placement\", target context \"Architecture: Release Boundaries / Restored physical placement layout tree\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475",
    "targetAncestry": [
      "Architecture: Release Boundaries",
      "Restored physical placement layout tree"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 240,
  "factsSHA256": "834be81942c09d4ad0f7f38a2e569a7f51f0298c27580948669d2c5c09da27e7",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-46",
    "githubAnchor": "unheaded-block-46",
    "stableAnchor": "unheaded-block-46",
    "title": "Unheaded block 46",
    "startLine": 194,
    "endLine": 218,
    "textDigest": "929b1469dbdfbbdfadf002fdd962c3bfd29976b3f19680af12997836a904fde9",
    "sample": "```txt\nCargo.toml                           # workspace root; herdr-plugin/ excluded in R1\napps/\n  fgos/                              # crate `fgos`, binary `fgos` — thin CLI adapt",
    "identityFingerprint": "46501f185f6f6881f8bb7f6684709480c507fa466a29670c50574fdb69e74984",
    "ancestry": [
      "Host Invocation And Provider Routing Architecture",
      "9. Physical Placement"
    ],
    "path": "docs/architect/host-invocation-routing/host-invocation-provider-routing.md"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-10",
    "githubAnchor": "unheaded-block-10",
    "stableAnchor": "unheaded-block-10",
    "title": "Unheaded block 10",
    "startLine": 70,
    "endLine": 96,
    "textDigest": "d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475",
    "sample": "````md\n```txt\nCargo.toml                           # workspace root; herdr-plugin/ excluded in R1\napps/\n  fgos/                              # crate `fgos`, binary `fgos` — thin CL",
    "identityFingerprint": "a13b5ca6d6fe448d7bf4476ab841defadbe72966df71f7e403aaec8c1562def5",
    "ancestry": [
      "Architecture: Release Boundaries",
      "Restored physical placement layout tree"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/release-boundaries.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_54536d1078dc6a2b6eacd17105389f2b",
    "sourceUnitDigest": "929b1469dbdfbbdfadf002fdd962c3bfd29976b3f19680af12997836a904fde9",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-10",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md:194-218#unheaded-block-46 (current lines); unit SHA256 929b1469dbdfbbdfadf002fdd962c3bfd29976b3f19680af12997836a904fde9.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:70-96#unheaded-block-10 (current lines); unit SHA256 d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475 at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-10; source context \"Host Invocation And Provider Routing Architecture / 9. Physical Placement\", target context \"Architecture: Release Boundaries / Restored physical placement layout tree\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d6fcc6cfd6c69e8a58b5c5855b503a2a4e90f7387c63cb62e19732d1ce12f475",
    "targetAncestry": [
      "Architecture: Release Boundaries",
      "Restored physical placement layout tree"
    ]
  }
}
```

## Entry rationale-242

```json
{
  "entryId": "rationale-242",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_7b3c9cdf89fe70d17f3f526bbdffa385",
  "before": {
    "claimId": "claim_7b3c9cdf89fe70d17f3f526bbdffa385",
    "sourceUnitDigest": "fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "1-two-distinct-adapters",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:20-20#1-two-distinct-adapters (current lines); unit SHA256 fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:78-78#1-two-distinct-adapters (current lines); unit SHA256 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-009 restoration\" (../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case.\nHeading depth: 2 → 4; title \"1. Two Distinct Adapters\" → \"1. Two Distinct Adapters\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-8 (claim_7046eb56f67c02ef82f621a3fa30286c; Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a compone)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-8 (claim_7046eb56f67c02ef82f621a3fa30286c; Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a compone).",
    "reviewNote": "rationale-480: deep: partial-carry of a heading (depth 2 to 4, same title); named remainders checked by script: b8 found inside restored section restored-both-adapters-delegate-a-complete-use-case; the sentence that the source text occurs verbatim inside the target section is true only because the shorter heading line is a substring of the deeper one, the real carry is the Recorded residual, whose anchors exist; facts recomputed equal: source 1-two-distinct-adapters L20-20, target 1-two-distinct-adapters L78-78, both full digests, links 0/1 (0 destination changes, 1 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 49afb148 at 0c06e6e6b matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-08-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_7b3c9cdf89fe70d17f3f526bbdffa385",
    "sourceUnitDigest": "fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "1-two-distinct-adapters",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:20-20#1-two-distinct-adapters (current lines); unit SHA256 fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:78-78#1-two-distinct-adapters (current lines); unit SHA256 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-009 restoration\" (../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case.\nHeading depth: 2 → 4; title \"1. Two Distinct Adapters\" → \"1. Two Distinct Adapters\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order differs; 1 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"1. Two Distinct Adapters\" → \"1. Two Distinct Adapters\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a component contract already defines locking, atomicity, recovery, and authority at that boundary.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-8 (claim_7046eb56f67c02ef82f621a3fa30286c; Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a compone)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-8 (claim_7046eb56f67c02ef82f621a3fa30286c; Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a compone).",
    "targetUnitDigest": "49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 241,
  "factsSHA256": "9e13336c85bcacf534912b33a278c70622d48af5bfe870918df6b675aae6dee7",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Two Distinct Adapters",
    "anchor": "1-two-distinct-adapters",
    "githubAnchor": "1-two-distinct-adapters",
    "stableAnchor": "h-3b77f5ee1116",
    "startLine": 20,
    "endLine": 20,
    "textDigest": "fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd",
    "sample": "1. Two Distinct Adapters",
    "sectionPayloadDigest": "7a781dca80d86a7816255fbc133dc57bf26194a856d63d70a7856972c45a1185",
    "followingBlockDigest": "070eef9281dcde7aac4cd065ac319c4eb601c82df284dce49286419ad23ec684",
    "identityFingerprint": "6ceb8083a826909eee8f7e9f476596b25f66f436bd9af2d3d1ebb0f01ccd973b",
    "ancestry": [
      "Legacy CLI Transition"
    ],
    "path": "docs/architect/host-invocation-routing/legacy-cli-transition.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "1. Two Distinct Adapters",
    "anchor": "1-two-distinct-adapters",
    "githubAnchor": "1-two-distinct-adapters",
    "stableAnchor": "h-0398ef359b92",
    "startLine": 78,
    "endLine": 78,
    "textDigest": "49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d",
    "sample": "1. Two Distinct Adapters",
    "sectionPayloadDigest": "58a6459f9e8bf0faa05025f675179c86a73fcd6fb2fe89d8d61152829e9b941a",
    "followingBlockDigest": "070eef9281dcde7aac4cd065ac319c4eb601c82df284dce49286419ad23ec684",
    "identityFingerprint": "7b7f0308b090718c036390dcdbe7306f91e83ec1c294866ae1eb69fb26e8c233",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"1. Two Distinct Adapters\" → \"1. Two Distinct Adapters\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a component contract already defines locking, atomicity, recovery, and authority at that boundary.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/241/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_7b3c9cdf89fe70d17f3f526bbdffa385",
    "sourceUnitDigest": "fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "1-two-distinct-adapters",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:20-20#1-two-distinct-adapters (current lines); unit SHA256 fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:78-78#1-two-distinct-adapters (current lines); unit SHA256 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-009 restoration\" (../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case.\nHeading depth: 2 → 4; title \"1. Two Distinct Adapters\" → \"1. Two Distinct Adapters\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order differs; 1 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"1. Two Distinct Adapters\" → \"1. Two Distinct Adapters\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a component contract already defines locking, atomicity, recovery, and authority at that boundary.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-8 (claim_7046eb56f67c02ef82f621a3fa30286c; Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a compone)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-8 (claim_7046eb56f67c02ef82f621a3fa30286c; Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a compone).",
    "targetUnitDigest": "49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  }
}
```

## Entry rationale-243

```json
{
  "entryId": "rationale-243",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_04f0605dc840e350f63e53d0e1e96843",
  "before": {
    "claimId": "claim_04f0605dc840e350f63e53d0e1e96843",
    "sourceUnitDigest": "e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:34-34#2-legacy-payload-identity-ownership-and-repair-path (current lines); unit SHA256 e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:94-94#2-legacy-payload-identity-ownership-and-repair-path (current lines); unit SHA256 bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 2, target 3; 3 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nLink 2: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nLink 3: \"none\" (none) → \"the dropped-010 restoration\" (release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea.\nHeading depth: 2 → 4; title \"2. Legacy Payload Identity, Ownership, And Repair Path\" → \"2. Legacy Payload Identity, Ownership, And Repair Path\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14 (claim_6a37273a0a45d24c53e344928c3edf22; `package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` )..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14 (claim_6a37273a0a45d24c53e344928c3edf22; `package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` ).",
    "targetUnitDigest": "bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  },
  "after": {
    "claimId": "claim_04f0605dc840e350f63e53d0e1e96843",
    "sourceUnitDigest": "e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:34-34#2-legacy-payload-identity-ownership-and-repair-path (current lines); unit SHA256 e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:94-94#2-legacy-payload-identity-ownership-and-repair-path (current lines); unit SHA256 bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 2, target 3; 3 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nLink 2: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nLink 3: \"none\" (none) → \"the dropped-010 restoration\" (release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea.\nHeading depth: 2 → 4; title \"2. Legacy Payload Identity, Ownership, And Repair Path\" → \"2. Legacy Payload Identity, Ownership, And Repair Path\".\nWhole direct section differs; depth 2 → 4; 3 distinct link changes; normalized line order differs; 1 removed and 2 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"2. Legacy Payload Identity, Ownership, And Repair Path\" → \"2. Legacy Payload Identity, Ownership, And Repair Path\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.\"]; added [\"Added in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14 (claim_6a37273a0a45d24c53e344928c3edf22; `package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` )..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14 (claim_6a37273a0a45d24c53e344928c3edf22; `package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` ).",
    "targetUnitDigest": "bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 242,
  "factsSHA256": "f632eab6ef4b9873f33fb46c7bea5941d2871f3d4b3253386a2f7f05360b5edd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "githubAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "stableAnchor": "h-161656a0cd5d",
    "startLine": 34,
    "endLine": 34,
    "textDigest": "e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d",
    "sample": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionPayloadDigest": "5501641da4f536faa95f668b83b823fbe275c8919184266fa6f4017cfe6b3f39",
    "followingBlockDigest": "3254fda9f7179fc52f68274cf803c9cfe550a6ea9f66d975cd3438100aaf804a",
    "identityFingerprint": "fb7cc258dc05206d132fc94bb086f94b7c0cd11df20059cbcbe90b86c5a65e59",
    "ancestry": [
      "Legacy CLI Transition"
    ],
    "path": "docs/architect/host-invocation-routing/legacy-cli-transition.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "anchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "githubAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "stableAnchor": "h-9d420859bd14",
    "startLine": 94,
    "endLine": 94,
    "textDigest": "bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf",
    "sample": "2. Legacy Payload Identity, Ownership, And Repair Path",
    "sectionPayloadDigest": "42a73e8acb1c7233b3b2b4621504459c837df1c5eb5548006b5c207c1d0b7430",
    "followingBlockDigest": "3254fda9f7179fc52f68274cf803c9cfe550a6ea9f66d975cd3438100aaf804a",
    "identityFingerprint": "e3bba4f3dfed74b0c1b7218ce608018f3a3669dd97b409dc61670e2ebe9d0f4a",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"2. Legacy Payload Identity, Ownership, And Repair Path\" → \"2. Legacy Payload Identity, Ownership, And Repair Path\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.\"]; added [\"Added in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/242/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_04f0605dc840e350f63e53d0e1e96843",
    "sourceUnitDigest": "e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "2-legacy-payload-identity-ownership-and-repair-path",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:34-34#2-legacy-payload-identity-ownership-and-repair-path (current lines); unit SHA256 e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:94-94#2-legacy-payload-identity-ownership-and-repair-path (current lines); unit SHA256 bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 2, target 3; 3 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nLink 2: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nLink 3: \"none\" (none) → \"the dropped-010 restoration\" (release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea); resolved none → docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea.\nHeading depth: 2 → 4; title \"2. Legacy Payload Identity, Ownership, And Repair Path\" → \"2. Legacy Payload Identity, Ownership, And Repair Path\".\nWhole direct section differs; depth 2 → 4; 3 distinct link changes; normalized line order differs; 1 removed and 2 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"2. Legacy Payload Identity, Ownership, And Repair Path\" → \"2. Legacy Payload Identity, Ownership, And Repair Path\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.\"]; added [\"Added in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.\",\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14 (claim_6a37273a0a45d24c53e344928c3edf22; `package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` )..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14 (claim_6a37273a0a45d24c53e344928c3edf22; `package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` ).",
    "targetUnitDigest": "bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  }
}
```

## Entry rationale-244

```json
{
  "entryId": "rationale-244",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_b1e44493c254c54dc18efa2088b0018a",
  "before": {
    "claimId": "claim_b1e44493c254c54dc18efa2088b0018a",
    "sourceUnitDigest": "ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "related-documents",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:93-93#related-documents (current lines); unit SHA256 ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:160-160#related-documents (current lines); unit SHA256 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 3: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"Related Documents\" → \"Related Documents\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#related-documents under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#related-documents; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  },
  "after": {
    "claimId": "claim_b1e44493c254c54dc18efa2088b0018a",
    "sourceUnitDigest": "ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "related-documents",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:93-93#related-documents (current lines); unit SHA256 ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:160-160#related-documents (current lines); unit SHA256 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 3: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"Related Documents\" → \"Related Documents\".\nWhole direct section differs; depth 2 → 4; 3 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"Related Documents\" → \"Related Documents\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#related-documents under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#related-documents; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 243,
  "factsSHA256": "a89d1a30caffaf6512453779b9dea2b7a0ee935b6a50cbea5b7be0e9aea1870b",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Related Documents",
    "anchor": "related-documents",
    "githubAnchor": "related-documents",
    "stableAnchor": "h-2ce0b12649cd",
    "startLine": 93,
    "endLine": 93,
    "textDigest": "ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab",
    "sample": "Related Documents",
    "sectionPayloadDigest": "42cc4ac1d11d27794f03b4cb8c1981441babf36f7b6a207ae7d6513e1e90aaa7",
    "followingBlockDigest": "42cc4ac1d11d27794f03b4cb8c1981441babf36f7b6a207ae7d6513e1e90aaa7",
    "identityFingerprint": "407da90c295f529ffea11dd7a869b8eab88f64a6b3af28c26a08e7869701c235",
    "ancestry": [
      "Legacy CLI Transition"
    ],
    "path": "docs/architect/host-invocation-routing/legacy-cli-transition.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "Related Documents",
    "anchor": "related-documents",
    "githubAnchor": "related-documents",
    "stableAnchor": "h-e9eb6e81a5e8",
    "startLine": 160,
    "endLine": 160,
    "textDigest": "954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337",
    "sample": "Related Documents",
    "sectionPayloadDigest": "79a8711ca2d89312fa54c5f3518f6e8541db0883c16b6de74b945a0c78b886a0",
    "followingBlockDigest": "79a8711ca2d89312fa54c5f3518f6e8541db0883c16b6de74b945a0c78b886a0",
    "identityFingerprint": "5c9bd548a241831ffd900294f28f5fc28e9a667892cbd1154065e6f52cbdb564",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"Related Documents\" → \"Related Documents\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/243/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_b1e44493c254c54dc18efa2088b0018a",
    "sourceUnitDigest": "ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "related-documents",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:93-93#related-documents (current lines); unit SHA256 ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:160-160#related-documents (current lines); unit SHA256 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 3: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"Related Documents\" → \"Related Documents\".\nWhole direct section differs; depth 2 → 4; 3 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"Related Documents\" → \"Related Documents\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#related-documents under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#related-documents; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  }
}
```

## Entry rationale-245

```json
{
  "entryId": "rationale-245",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_2519e82bb2a6054b1b822fc266471424",
  "before": {
    "claimId": "claim_2519e82bb2a6054b1b822fc266471424",
    "sourceUnitDigest": "3eb6efe648980740c062eb5f792200bc14dd24c64c620f7c677ab1657bdf87bd",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-30",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:15-26#unheaded-block-2 (current lines); unit SHA256 3eb6efe648980740c062eb5f792200bc14dd24c64c620f7c677ab1657bdf87bd.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:172-185#unheaded-block-30 (current lines); unit SHA256 99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 3, target 3; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-2 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-30; source context \"Node To Rust Component Migration\", target context \"Architecture: Release Boundaries / Restored scope\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "rationale-494: deep: move where the source block sits byte-for-byte inside the target unit, which only adds a ````md fence (target is exactly 12 characters longer: fence open and close), the restored literal block; the verbatim-inside sentence is true; facts recomputed equal: source unheaded-block-2 L15-26, target unheaded-block-30 L172-185, both full digests, links 3/3 (0 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 99352315 at 13322f8a6 matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-09-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a",
    "targetAncestry": [
      "Architecture: Release Boundaries",
      "Restored scope"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_2519e82bb2a6054b1b822fc266471424",
    "sourceUnitDigest": "3eb6efe648980740c062eb5f792200bc14dd24c64c620f7c677ab1657bdf87bd",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-30",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:15-26#unheaded-block-2 (current lines); unit SHA256 3eb6efe648980740c062eb5f792200bc14dd24c64c620f7c677ab1657bdf87bd.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:172-185#unheaded-block-30 (current lines); unit SHA256 99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 3, target 3; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-2 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-30; source context \"Node To Rust Component Migration\", target context \"Architecture: Release Boundaries / Restored scope\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a",
    "targetAncestry": [
      "Architecture: Release Boundaries",
      "Restored scope"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 244,
  "factsSHA256": "2ad088f304e164fbeffcdc258e0e03c0fbd49e42d1c82ff320d2c1b1fe0fea26",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 15,
    "endLine": 26,
    "textDigest": "3eb6efe648980740c062eb5f792200bc14dd24c64c620f7c677ab1657bdf87bd",
    "sample": "This document discusses only migration options, ordering, transition stages,\ncutover, and rollback. The stable host model, peer CLI/remote host use cases,\nOperation Provider Router",
    "identityFingerprint": "ec9d01cd8fa1a417182fa245ad4048ae8f403beda75ab581c3f6100f4f67d170",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "path": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-30",
    "githubAnchor": "unheaded-block-30",
    "stableAnchor": "unheaded-block-30",
    "title": "Unheaded block 30",
    "startLine": 172,
    "endLine": 185,
    "textDigest": "99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a",
    "sample": "````md\nThis document discusses only migration options, ordering, transition stages,\ncutover, and rollback. The stable host model, peer CLI/remote host use cases,\nOperation Provider",
    "identityFingerprint": "a4cb5a099ac911f6cccc9ed4c19fd8c165d9636004ef789adf78b8360565c4fe",
    "ancestry": [
      "Architecture: Release Boundaries",
      "Restored scope"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/release-boundaries.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_2519e82bb2a6054b1b822fc266471424",
    "sourceUnitDigest": "3eb6efe648980740c062eb5f792200bc14dd24c64c620f7c677ab1657bdf87bd",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "targetAnchor": "unheaded-block-30",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:15-26#unheaded-block-2 (current lines); unit SHA256 3eb6efe648980740c062eb5f792200bc14dd24c64c620f7c677ab1657bdf87bd.\nTarget: docs/platform/host-invocation-routing/architecture/release-boundaries.md:172-185#unheaded-block-30 (current lines); unit SHA256 99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a at 13322f8a6712df4bb3dd69e7df208e237f32c216.\nLinks: source 3, target 3; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-2 under docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-30; source context \"Node To Rust Component Migration\", target context \"Architecture: Release Boundaries / Restored scope\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "99352315c72370b04c18a9eed19b9c526ad319b71d99560f7914766b0b98a15a",
    "targetAncestry": [
      "Architecture: Release Boundaries",
      "Restored scope"
    ]
  }
}
```

## Entry rationale-246

```json
{
  "entryId": "rationale-246",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_c072318ec582affe5e0e6936961fadc4",
  "before": {
    "claimId": "claim_c072318ec582affe5e0e6936961fadc4",
    "sourceUnitDigest": "d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "9-repeat-by-component-boundary",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:303-303#9-repeat-by-component-boundary (current lines); unit SHA256 d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:340-340#9-repeat-by-component-boundary (current lines); unit SHA256 ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 1, target 1; 1 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"fgOS Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"9. Repeat By Component Boundary\" → \"9. Repeat By Component Boundary\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope).",
    "reviewNote": "rationale-495: deep: partial-carry of a heading (depth 2 to 4, same title); named remainders checked by script: b44 found b45 found inside restored section restored-per-component-repeat-procedure; the sentence that the source text occurs verbatim inside the target section is true only because the shorter heading line is a substring of the deeper one, the real carry is the Recorded residual, whose anchors exist; facts recomputed equal: source 9-repeat-by-component-boundary L303-303, target 9-repeat-by-component-boundary L340-340, both full digests, links 1/1 (1 destination changes, 0 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause ef6d9f08 at 0c06e6e6b matches the reviewed base row at 5035fed52; Link 1 pairs the removed Component Boundary Advisory link with the added restoration link by position (counts say 0 added and 0 removed) while the advisory link actually moved with its relocated block-45; the Recorded residual covers it, so the imprecision is cosmetic.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-09-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_c072318ec582affe5e0e6936961fadc4",
    "sourceUnitDigest": "d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "9-repeat-by-component-boundary",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:303-303#9-repeat-by-component-boundary (current lines); unit SHA256 d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:340-340#9-repeat-by-component-boundary (current lines); unit SHA256 ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 1, target 1; 2 changed spellings/labels, 0 destination changes; 1 added, 1 removed.\nLink 1: \"fgOS Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"none\" (none); resolved docs/architect/component-boundary/component-boundary-advisory.md → none.\nLink 1: \"none\" (none) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"9. Repeat By Component Boundary\" → \"9. Repeat By Component Boundary\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 14 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"9. Repeat By Component Boundary\" → \"9. Repeat By Component Boundary\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"For each subsequent component:\",\"1. Read\",\"   <link>\",\"   and name responsibility, semantic operations, authority, state, side\",\"   effects, component class, and physical placement.\",\"2. Select a complete operation/use-case boundary rather than private helpers.\",\"3. Capture current Node behavior as shared fixtures.\",\"4. Extract only the Node boundary needed for this migration slice.\",\"5. Implement the corresponding native Rust provider.\",\"6. Run both providers against the same semantic fixtures.\",\"7. Shadow only side-effect-free reads.\",\"8. Switch the operation from legacy to native after parity proof.\",\"9. Observe the rollback window.\",\"10. Remove the Node implementation in a later cleanup change.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope).",
    "targetUnitDigest": "ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 245,
  "factsSHA256": "93f07bb3ecd6443a7fb04e8a93caa5bbeb8c48b516214327424afef88cabae3a",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "9. Repeat By Component Boundary",
    "anchor": "9-repeat-by-component-boundary",
    "githubAnchor": "9-repeat-by-component-boundary",
    "stableAnchor": "h-50e1a5e5c610",
    "startLine": 303,
    "endLine": 303,
    "textDigest": "d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f",
    "sample": "9. Repeat By Component Boundary",
    "sectionPayloadDigest": "3bd0d07e7c8bd44962dcbab7a0479af9a3b22ddf0208a1ae81e3fdf4221408f4",
    "followingBlockDigest": "79c90b13578b11cbdf28fc7face8f0233b2a18f29356d12b4e874c89d706e952",
    "identityFingerprint": "8fc9a0b059f467fd22e276b64deea49abedfdab94744e2344088ac777bb91a21",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "path": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "9. Repeat By Component Boundary",
    "anchor": "9-repeat-by-component-boundary",
    "githubAnchor": "9-repeat-by-component-boundary",
    "stableAnchor": "h-5296d650b7cf",
    "startLine": 340,
    "endLine": 340,
    "textDigest": "ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e",
    "sample": "9. Repeat By Component Boundary",
    "sectionPayloadDigest": "f1ec3a7a632d5203e8af415779a1a90b61d4e3a7e7b797a6a0aa7e9088c24349",
    "followingBlockDigest": "8fd9f660c71f26f5134efb4d9cebe6d3f2cd253694c0b6572c6faa7b6dca998f",
    "identityFingerprint": "0a47f3421600dc0f9d9ce6a9414af436b1b3954383d88f240db32031bee7ef6b",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"9. Repeat By Component Boundary\" → \"9. Repeat By Component Boundary\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"For each subsequent component:\",\"1. Read\",\"   <link>\",\"   and name responsibility, semantic operations, authority, state, side\",\"   effects, component class, and physical placement.\",\"2. Select a complete operation/use-case boundary rather than private helpers.\",\"3. Capture current Node behavior as shared fixtures.\",\"4. Extract only the Node boundary needed for this migration slice.\",\"5. Implement the corresponding native Rust provider.\",\"6. Run both providers against the same semantic fixtures.\",\"7. Shadow only side-effect-free reads.\",\"8. Switch the operation from legacy to native after parity proof.\",\"9. Observe the rollback window.\",\"10. Remove the Node implementation in a later cleanup change.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/245/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_c072318ec582affe5e0e6936961fadc4",
    "sourceUnitDigest": "d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "9-repeat-by-component-boundary",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:303-303#9-repeat-by-component-boundary (current lines); unit SHA256 d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:340-340#9-repeat-by-component-boundary (current lines); unit SHA256 ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 1, target 1; 2 changed spellings/labels, 0 destination changes; 1 added, 1 removed.\nLink 1: \"fgOS Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"none\" (none); resolved docs/architect/component-boundary/component-boundary-advisory.md → none.\nLink 1: \"none\" (none) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"9. Repeat By Component Boundary\" → \"9. Repeat By Component Boundary\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 14 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"9. Repeat By Component Boundary\" → \"9. Repeat By Component Boundary\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"For each subsequent component:\",\"1. Read\",\"   <link>\",\"   and name responsibility, semantic operations, authority, state, side\",\"   effects, component class, and physical placement.\",\"2. Select a complete operation/use-case boundary rather than private helpers.\",\"3. Capture current Node behavior as shared fixtures.\",\"4. Extract only the Node boundary needed for this migration slice.\",\"5. Implement the corresponding native Rust provider.\",\"6. Run both providers against the same semantic fixtures.\",\"7. Shadow only side-effect-free reads.\",\"8. Switch the operation from legacy to native after parity proof.\",\"9. Observe the rollback window.\",\"10. Remove the Node implementation in a later cleanup change.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope).",
    "targetUnitDigest": "ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  }
}
```

## Entry rationale-247

```json
{
  "entryId": "rationale-247",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_e960a05c0b656d0dae2cffd3daee5a0d",
  "before": {
    "claimId": "claim_e960a05c0b656d0dae2cffd3daee5a0d",
    "sourceUnitDigest": "225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "10-migrate-read-models-before-writers",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:329-329#10-migrate-read-models-before-writers (current lines); unit SHA256 225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:355-355#10-migrate-read-models-before-writers (current lines); unit SHA256 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"10. Migrate Read Models Before Writers\" → \"10. Migrate Read Models Before Writers\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.).",
    "reviewNote": "rationale-496: deep: partial-carry of a heading (depth 2 to 4, same title); named remainders checked by script: b49 found b50 found inside restored section restored-per-component-repeat-procedure; the sentence that the source text occurs verbatim inside the target section is true only because the shorter heading line is a substring of the deeper one, the real carry is the Recorded residual, whose anchors exist; facts recomputed equal: source 10-migrate-read-models-before-writers L329-329, target 10-migrate-read-models-before-writers L355-355, both full digests, links 0/1 (0 destination changes, 1 added, 0 removed), target anchor check passed, shard row equals pack, unchanged-since-review clause 5ae126ea at 0c06e6e6b matches the reviewed base row at 5035fed52.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-09-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_e960a05c0b656d0dae2cffd3daee5a0d",
    "sourceUnitDigest": "225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "10-migrate-read-models-before-writers",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:329-329#10-migrate-read-models-before-writers (current lines); unit SHA256 225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:355-355#10-migrate-read-models-before-writers (current lines); unit SHA256 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"10. Migrate Read Models Before Writers\" → \"10. Migrate Read Models Before Writers\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order differs; 8 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"10. Migrate Read Models Before Writers\" → \"10. Migrate Read Models Before Writers\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"Sequence it internally:\",\"1. event/schema decode fixtures;\",\"2. deterministic replay fixtures;\",\"3. domain/stage projection fixtures;\",\"4. frontier calculation fixtures;\",\"5. effective claim overlay;\",\"6. CLI `ready` parity and pagination;\",\"7. remote semantic parity.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.).",
    "targetUnitDigest": "5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 246,
  "factsSHA256": "14ae15659614f9de1b918bca4a0fa02d2985655a6bfefab2e9e43e9f2140fe2b",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Migrate Read Models Before Writers",
    "anchor": "10-migrate-read-models-before-writers",
    "githubAnchor": "10-migrate-read-models-before-writers",
    "stableAnchor": "h-90c1ea8c17d9",
    "startLine": 329,
    "endLine": 329,
    "textDigest": "225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c",
    "sample": "10. Migrate Read Models Before Writers",
    "sectionPayloadDigest": "c3bf16d84748ff23219b3698da7d6e6ca069c51d4c9e5f686b736b1e99759386",
    "followingBlockDigest": "6820b1ee737ed435ba7664d9983109eb53e943e0c582ca530f2350152cbb475b",
    "identityFingerprint": "716e1bd8edba58043bda80863ea679a6e6580ce041acd0cb4fd3366000fdd35e",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "path": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "10. Migrate Read Models Before Writers",
    "anchor": "10-migrate-read-models-before-writers",
    "githubAnchor": "10-migrate-read-models-before-writers",
    "stableAnchor": "h-a87591a8c5aa",
    "startLine": 355,
    "endLine": 355,
    "textDigest": "5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d",
    "sample": "10. Migrate Read Models Before Writers",
    "sectionPayloadDigest": "815d54242da7d57b452a2cf1f0f5d500f63a6ed15a0802a400996349f92605da",
    "followingBlockDigest": "6820b1ee737ed435ba7664d9983109eb53e943e0c582ca530f2350152cbb475b",
    "identityFingerprint": "7e2fd1d7d3739f840464d5e220c90a2d0cd27af492b33457ff226ea65232e728",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"10. Migrate Read Models Before Writers\" → \"10. Migrate Read Models Before Writers\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"Sequence it internally:\",\"1. event/schema decode fixtures;\",\"2. deterministic replay fixtures;\",\"3. domain/stage projection fixtures;\",\"4. frontier calculation fixtures;\",\"5. effective claim overlay;\",\"6. CLI `ready` parity and pagination;\",\"7. remote semantic parity.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/246/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_e960a05c0b656d0dae2cffd3daee5a0d",
    "sourceUnitDigest": "225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "10-migrate-read-models-before-writers",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:329-329#10-migrate-read-models-before-writers (current lines); unit SHA256 225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:355-355#10-migrate-read-models-before-writers (current lines); unit SHA256 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d at 0c06e6e6b67a3897d660ee54de25fdc9971e59a4.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"10. Migrate Read Models Before Writers\" → \"10. Migrate Read Models Before Writers\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order differs; 8 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"10. Migrate Read Models Before Writers\" → \"10. Migrate Read Models Before Writers\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"Sequence it internally:\",\"1. event/schema decode fixtures;\",\"2. deterministic replay fixtures;\",\"3. domain/stage projection fixtures;\",\"4. frontier calculation fixtures;\",\"5. effective claim overlay;\",\"6. CLI `ready` parity and pagination;\",\"7. remote semantic parity.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.).",
    "targetUnitDigest": "5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  }
}
```

## Entry rationale-248

```json
{
  "entryId": "rationale-248",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json",
  "collection": "claims",
  "claimId": "claim_ac2177776d1a367f2d8e81699b04fc63",
  "before": {
    "claimId": "claim_ac2177776d1a367f2d8e81699b04fc63",
    "sourceUnitDigest": "30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "13-rollback-rules",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:377-377#13-rollback-rules (current lines); unit SHA256 30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:398-398#13-rollback-rules (current lines); unit SHA256 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 2: \"none\" (none) → \"the dropped-015 restoration\" (../contracts/component-protocol.md#restored-rollback-bullets); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets.\nHeading depth: 2 → 4; title \"13. Rollback Rules\" → \"13. Rollback Rules\".\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The source text occurs verbatim inside the bound target section; section-level unit digests differ. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef).",
    "targetUnitDigest": "8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  },
  "after": {
    "claimId": "claim_ac2177776d1a367f2d8e81699b04fc63",
    "sourceUnitDigest": "30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "13-rollback-rules",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:377-377#13-rollback-rules (current lines); unit SHA256 30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:398-398#13-rollback-rules (current lines); unit SHA256 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 2: \"none\" (none) → \"the dropped-015 restoration\" (../contracts/component-protocol.md#restored-rollback-bullets); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets.\nHeading depth: 2 → 4; title \"13. Rollback Rules\" → \"13. Rollback Rules\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 7 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"13. Rollback Rules\" → \"13. Rollback Rules\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"- Keep legacy and native implementations side by side only for the observation\",\"  window of their operation.\",\"- Never delete a Node writer before proving it can read/recover state last\",\"  written by the Rust implementation, or explicitly declaring the cutover\",\"  irreversible with migration evidence.\",\"- Remove rollback code per component after its window; do not accumulate a\",\"  permanent second implementation tree.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef).",
    "targetUnitDigest": "8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 247,
  "factsSHA256": "f7c087977e8bb0e6ec4112827df8fcd38c62ed845ffb2ea34d4c0d96a8a936f3",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "13. Rollback Rules",
    "anchor": "13-rollback-rules",
    "githubAnchor": "13-rollback-rules",
    "stableAnchor": "h-dac01ef40cd5",
    "startLine": 377,
    "endLine": 377,
    "textDigest": "30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20",
    "sample": "13. Rollback Rules",
    "sectionPayloadDigest": "52162dd152f9897fd45adc7eeb79965fe3fd781741875fd3e7d6a8c8b301d7e1",
    "followingBlockDigest": "c2f9416ff4f07d2fbc185f80b1f40d65db10883a380e805cabf3482c5dad8bdb",
    "identityFingerprint": "3d3f1c9ec90ce5f764080a04541d668da1d2670775f63f9ab56f68e37845aec0",
    "ancestry": [
      "Node To Rust Component Migration"
    ],
    "path": "docs/architect/host-invocation-routing/node-to-rust-component-migration.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "13. Rollback Rules",
    "anchor": "13-rollback-rules",
    "githubAnchor": "13-rollback-rules",
    "stableAnchor": "h-34574789399a",
    "startLine": 398,
    "endLine": 398,
    "textDigest": "8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6",
    "sample": "13. Rollback Rules",
    "sectionPayloadDigest": "63d470929a132388df168d2a5c5f1260acecbb6ac0b8183b6e31878c7b3a9b0a",
    "followingBlockDigest": "74bd29942b042b3f787699eb068cbf52e2d7148b0520745218eb9a933c78b0ab",
    "identityFingerprint": "fb9d863b35fc8884d73ad542b4bf57a55e2c209463af265b5b9940d6554f1f14",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"13. Rollback Rules\" → \"13. Rollback Rules\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"- Keep legacy and native implementations side by side only for the observation\",\"  window of their operation.\",\"- Never delete a Node writer before proving it can read/recover state last\",\"  written by the Rust implementation, or explicitly declaring the cutover\",\"  irreversible with migration evidence.\",\"- Remove rollback code per component after its window; do not accumulate a\",\"  permanent second implementation tree.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/247/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_ac2177776d1a367f2d8e81699b04fc63",
    "sourceUnitDigest": "30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "13-rollback-rules",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:377-377#13-rollback-rules (current lines); unit SHA256 30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:398-398#13-rollback-rules (current lines); unit SHA256 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 2: \"none\" (none) → \"the dropped-015 restoration\" (../contracts/component-protocol.md#restored-rollback-bullets); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets.\nHeading depth: 2 → 4; title \"13. Rollback Rules\" → \"13. Rollback Rules\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 7 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"13. Rollback Rules\" → \"13. Rollback Rules\"; 2 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Partial section carriage: removed text is in the live named residual carriers docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed [\"- Keep legacy and native implementations side by side only for the observation\",\"  window of their operation.\",\"- Never delete a Node writer before proving it can read/recover state last\",\"  written by the Rust implementation, or explicitly declaring the cutover\",\"  irreversible with migration evidence.\",\"- Remove rollback code per component after its window; do not accumulate a\",\"  permanent second implementation tree.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef).",
    "targetUnitDigest": "8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  }
}
```

## Entry rationale-249

```json
{
  "entryId": "rationale-249",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json",
  "collection": "claims",
  "claimId": "claim_5766225be2d76d6239e116a664aec7cf",
  "before": {
    "claimId": "claim_5766225be2d76d6239e116a664aec7cf",
    "sourceUnitDigest": "70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8",
    "targetOwner": "docs/platform/packaging-distribution/README.md",
    "targetAnchor": "2-historical-supersession-table",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/README.md:57-57#2-historical-supersession-table (current lines); unit SHA256 70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8.\nTarget: docs/platform/packaging-distribution/README.md:266-266#2-historical-supersession-table (current lines); unit SHA256 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 4, target 4; 4 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"Promoted Runtime Identity And Activation\" (../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) → \"Promoted Runtime Identity And Activation\" (architecture/runtime-identity-and-activation.md); resolved docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 3: \"Promoted Future Constraints\" (../../platform/packaging-distribution/architecture/future-constraints.md) → \"Promoted Future Constraints\" (architecture/future-constraints.md); resolved docs/platform/packaging-distribution/architecture/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nLink 4: \"Distribution Baseline And Scattered Spec Fragments\" (./history/distribution-baseline.md) → \"Distribution Baseline And Scattered Spec Fragments\" (../../architect/packaging-distribution/history/distribution-baseline.md); resolved docs/architect/packaging-distribution/history/distribution-baseline.md → docs/architect/packaging-distribution/history/distribution-baseline.md.\nHeading depth: 2 → 4; title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/README.md#2-historical-supersession-table under docs/platform/packaging-distribution/README.md#2-historical-supersession-table; source context \"Packaging And Distribution Architecture\", target context \"Packaging-Distribution / Retained Readme Source Detail / Packaging And Distribution Architecture\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e",
    "targetAncestry": [
      "Packaging-Distribution",
      "Retained Readme Source Detail",
      "Packaging And Distribution Architecture"
    ]
  },
  "after": {
    "claimId": "claim_5766225be2d76d6239e116a664aec7cf",
    "sourceUnitDigest": "70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8",
    "targetOwner": "docs/platform/packaging-distribution/README.md",
    "targetAnchor": "2-historical-supersession-table",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/README.md:57-57#2-historical-supersession-table (current lines); unit SHA256 70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8.\nTarget: docs/platform/packaging-distribution/README.md:266-266#2-historical-supersession-table (current lines); unit SHA256 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 4, target 4; 4 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"Promoted Runtime Identity And Activation\" (../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) → \"Promoted Runtime Identity And Activation\" (architecture/runtime-identity-and-activation.md); resolved docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 3: \"Promoted Future Constraints\" (../../platform/packaging-distribution/architecture/future-constraints.md) → \"Promoted Future Constraints\" (architecture/future-constraints.md); resolved docs/platform/packaging-distribution/architecture/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nLink 4: \"Distribution Baseline And Scattered Spec Fragments\" (./history/distribution-baseline.md) → \"Distribution Baseline And Scattered Spec Fragments\" (../../architect/packaging-distribution/history/distribution-baseline.md); resolved docs/architect/packaging-distribution/history/distribution-baseline.md → docs/architect/packaging-distribution/history/distribution-baseline.md.\nHeading depth: 2 → 4; title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\".\nWhole direct section differs; depth 2 → 4; 4 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\"; 4 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/README.md#2-historical-supersession-table under docs/platform/packaging-distribution/README.md#2-historical-supersession-table; source context \"Packaging And Distribution Architecture\", target context \"Packaging-Distribution / Retained Readme Source Detail / Packaging And Distribution Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e",
    "targetAncestry": [
      "Packaging-Distribution",
      "Retained Readme Source Detail",
      "Packaging And Distribution Architecture"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 248,
  "factsSHA256": "c8a952d671379739ee5aa728a7deaa195cdbb08443c550a6d366a8afaa70bead",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Historical Supersession Table",
    "anchor": "2-historical-supersession-table",
    "githubAnchor": "2-historical-supersession-table",
    "stableAnchor": "h-8721831c74fc",
    "startLine": 57,
    "endLine": 57,
    "textDigest": "70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8",
    "sample": "2. Historical Supersession Table",
    "sectionPayloadDigest": "302168079cde3ef23795b07c1b04407141262f1af1a9586a56c7e39059878d29",
    "followingBlockDigest": "302168079cde3ef23795b07c1b04407141262f1af1a9586a56c7e39059878d29",
    "identityFingerprint": "711486c6b6f2076af4255c7bf2203be4cf78f6e98af4bb9facf6b255a6a375eb",
    "ancestry": [
      "Packaging And Distribution Architecture"
    ],
    "path": "docs/architect/packaging-distribution/README.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "2. Historical Supersession Table",
    "anchor": "2-historical-supersession-table",
    "githubAnchor": "2-historical-supersession-table",
    "stableAnchor": "h-1b5204464214",
    "startLine": 266,
    "endLine": 266,
    "textDigest": "7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e",
    "sample": "2. Historical Supersession Table",
    "sectionPayloadDigest": "8938a4cbe3f1099f298566f2fd822d2745030454f4f50025e8f9ff685a38f405",
    "followingBlockDigest": "8938a4cbe3f1099f298566f2fd822d2745030454f4f50025e8f9ff685a38f405",
    "identityFingerprint": "70ce9ad5a3d67197827df94c6b0479415e00a37172b85416279db4dbd6119013",
    "ancestry": [
      "Packaging-Distribution",
      "Retained Readme Source Detail",
      "Packaging And Distribution Architecture"
    ],
    "path": "docs/platform/packaging-distribution/README.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\"; 4 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/248/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5766225be2d76d6239e116a664aec7cf",
    "sourceUnitDigest": "70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8",
    "targetOwner": "docs/platform/packaging-distribution/README.md",
    "targetAnchor": "2-historical-supersession-table",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/README.md:57-57#2-historical-supersession-table (current lines); unit SHA256 70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8.\nTarget: docs/platform/packaging-distribution/README.md:266-266#2-historical-supersession-table (current lines); unit SHA256 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 4, target 4; 4 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"Promoted Runtime Identity And Activation\" (../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) → \"Promoted Runtime Identity And Activation\" (architecture/runtime-identity-and-activation.md); resolved docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 3: \"Promoted Future Constraints\" (../../platform/packaging-distribution/architecture/future-constraints.md) → \"Promoted Future Constraints\" (architecture/future-constraints.md); resolved docs/platform/packaging-distribution/architecture/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nLink 4: \"Distribution Baseline And Scattered Spec Fragments\" (./history/distribution-baseline.md) → \"Distribution Baseline And Scattered Spec Fragments\" (../../architect/packaging-distribution/history/distribution-baseline.md); resolved docs/architect/packaging-distribution/history/distribution-baseline.md → docs/architect/packaging-distribution/history/distribution-baseline.md.\nHeading depth: 2 → 4; title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\".\nWhole direct section differs; depth 2 → 4; 4 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\"; 4 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/README.md#2-historical-supersession-table under docs/platform/packaging-distribution/README.md#2-historical-supersession-table; source context \"Packaging And Distribution Architecture\", target context \"Packaging-Distribution / Retained Readme Source Detail / Packaging And Distribution Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e",
    "targetAncestry": [
      "Packaging-Distribution",
      "Retained Readme Source Detail",
      "Packaging And Distribution Architecture"
    ]
  }
}
```

## Entry rationale-250

```json
{
  "entryId": "rationale-250",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json",
  "collection": "claims",
  "claimId": "claim_088af18a5796ed72fe6d33ff2cc5d05c",
  "before": {
    "claimId": "claim_088af18a5796ed72fe6d33ff2cc5d05c",
    "sourceUnitDigest": "b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b",
    "targetOwner": "docs/platform/packaging-distribution/contracts/release-manifest.md",
    "targetAnchor": "5-releasemanifest",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md:295-295#5-releasemanifest (current lines); unit SHA256 b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b.\nTarget: docs/platform/packaging-distribution/contracts/release-manifest.md:146-146#5-releasemanifest (current lines); unit SHA256 dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (../host-invocation-routing/legacy-cli-transition.md) → \"Legacy CLI Transition\" (../../../architect/host-invocation-routing/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/architect/host-invocation-routing/legacy-cli-transition.md.\nHeading depth: 2 → 4; title \"5. ReleaseManifest\" → \"5. ReleaseManifest\".\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest under docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest; source context \"Runtime Identity And Activation\", target context \"Contract: Release Manifest / Retained Runtime Identity And Activation Source Detail\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee",
    "targetAncestry": [
      "Contract: Release Manifest",
      "Retained Runtime Identity And Activation Source Detail"
    ]
  },
  "after": {
    "claimId": "claim_088af18a5796ed72fe6d33ff2cc5d05c",
    "sourceUnitDigest": "b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b",
    "targetOwner": "docs/platform/packaging-distribution/contracts/release-manifest.md",
    "targetAnchor": "5-releasemanifest",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md:295-295#5-releasemanifest (current lines); unit SHA256 b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b.\nTarget: docs/platform/packaging-distribution/contracts/release-manifest.md:146-146#5-releasemanifest (current lines); unit SHA256 dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (../host-invocation-routing/legacy-cli-transition.md) → \"Legacy CLI Transition\" (../../../architect/host-invocation-routing/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/architect/host-invocation-routing/legacy-cli-transition.md.\nHeading depth: 2 → 4; title \"5. ReleaseManifest\" → \"5. ReleaseManifest\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"5. ReleaseManifest\" → \"5. ReleaseManifest\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest under docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest; source context \"Runtime Identity And Activation\", target context \"Contract: Release Manifest / Retained Runtime Identity And Activation Source Detail\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee",
    "targetAncestry": [
      "Contract: Release Manifest",
      "Retained Runtime Identity And Activation Source Detail"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 249,
  "factsSHA256": "0142eb02eb3f21fc44d6dfae006ad611aa8e2a84af8c758f482bdb7082fc9a08",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. ReleaseManifest",
    "anchor": "5-releasemanifest",
    "githubAnchor": "5-releasemanifest",
    "stableAnchor": "h-90d755e95049",
    "startLine": 295,
    "endLine": 295,
    "textDigest": "b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b",
    "sample": "5. ReleaseManifest",
    "sectionPayloadDigest": "1e987d5b136479f6f16636112e57ec8b9d76b0ea043407de92210bbc8869a764",
    "followingBlockDigest": "bac0a2990fcb00aa7b8a014d4397ba8c6cf36cfe401bfc85affe20105adaad07",
    "identityFingerprint": "6ad75e46870d4ccb6c97456ab9d7cce62ad0dcc9ebbc8878df9e4bf75e4246e4",
    "ancestry": [
      "Runtime Identity And Activation"
    ],
    "path": "docs/architect/packaging-distribution/runtime-identity-and-activation.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "5. ReleaseManifest",
    "anchor": "5-releasemanifest",
    "githubAnchor": "5-releasemanifest",
    "stableAnchor": "h-a5fc747da280",
    "startLine": 146,
    "endLine": 146,
    "textDigest": "dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee",
    "sample": "5. ReleaseManifest",
    "sectionPayloadDigest": "23dd0f374a857b3b3912f626a41495bee1c99a69fed52240d99a181c7d0bec4b",
    "followingBlockDigest": "bac0a2990fcb00aa7b8a014d4397ba8c6cf36cfe401bfc85affe20105adaad07",
    "identityFingerprint": "5ba36971d7d59bbf9ebd733b579eda025b350fa915e2493c10a6bc43c6f672b9",
    "ancestry": [
      "Contract: Release Manifest",
      "Retained Runtime Identity And Activation Source Detail"
    ],
    "path": "docs/platform/packaging-distribution/contracts/release-manifest.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"5. ReleaseManifest\" → \"5. ReleaseManifest\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/249/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_088af18a5796ed72fe6d33ff2cc5d05c",
    "sourceUnitDigest": "b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b",
    "targetOwner": "docs/platform/packaging-distribution/contracts/release-manifest.md",
    "targetAnchor": "5-releasemanifest",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md:295-295#5-releasemanifest (current lines); unit SHA256 b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b.\nTarget: docs/platform/packaging-distribution/contracts/release-manifest.md:146-146#5-releasemanifest (current lines); unit SHA256 dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (../host-invocation-routing/legacy-cli-transition.md) → \"Legacy CLI Transition\" (../../../architect/host-invocation-routing/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/architect/host-invocation-routing/legacy-cli-transition.md.\nHeading depth: 2 → 4; title \"5. ReleaseManifest\" → \"5. ReleaseManifest\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"5. ReleaseManifest\" → \"5. ReleaseManifest\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest under docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest; source context \"Runtime Identity And Activation\", target context \"Contract: Release Manifest / Retained Runtime Identity And Activation Source Detail\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee",
    "targetAncestry": [
      "Contract: Release Manifest",
      "Retained Runtime Identity And Activation Source Detail"
    ]
  }
}
```

## Entry rationale-251

```json
{
  "entryId": "rationale-251",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json",
  "collection": "claims",
  "claimId": "claim_163988c8973416bdd64781cc7c667f65",
  "before": {
    "claimId": "claim_163988c8973416bdd64781cc7c667f65",
    "sourceUnitDigest": "b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "workspace-runtime-model",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:1-1#workspace-runtime-model (current lines); unit SHA256 b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0.\nTarget: docs/platform/packaging-distribution/spec.md:425-425#workspace-runtime-model (current lines); unit SHA256 d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e.\nSource and target unit digests differ.\nTarget changed since last reviewed digest b17cd70e3bb848b985deb966b7c9ffc192142e8f887bfb49d3bf4d76c70efa15 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nLink 3: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../system-architecture/architecture/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/platform/system-architecture/architecture/workspace-topology.md.\nHeading depth: 1 → 3; title \"Workspace Runtime Model\" → \"Workspace Runtime Model\".\nApplicable labelled corrections:\nL10-26: \"[docs/architect/workspace-topology.md](../system-architecture/architecture/workspace-topology.md)\" → \"[docs/architect/workspace-topology.md](../../architect/workspace-topology.md)\"; evidence step10-round3-doc-edits.json.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#workspace-runtime-model under docs/platform/packaging-distribution/spec.md#workspace-runtime-model; source context \"workspace-runtime-model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail"
    ]
  },
  "after": {
    "claimId": "claim_163988c8973416bdd64781cc7c667f65",
    "sourceUnitDigest": "b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "workspace-runtime-model",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:1-1#workspace-runtime-model (current lines); unit SHA256 b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0.\nTarget: docs/platform/packaging-distribution/spec.md:425-425#workspace-runtime-model (current lines); unit SHA256 d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e.\nSource and target unit digests differ.\nTarget changed since last reviewed digest b17cd70e3bb848b985deb966b7c9ffc192142e8f887bfb49d3bf4d76c70efa15 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nLink 3: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../system-architecture/architecture/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/platform/system-architecture/architecture/workspace-topology.md.\nHeading depth: 1 → 3; title \"Workspace Runtime Model\" → \"Workspace Runtime Model\".\nWhole direct section differs; depth 1 → 3; 3 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 1 → 3, title \"Workspace Runtime Model\" → \"Workspace Runtime Model\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels L10-26 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#workspace-runtime-model under docs/platform/packaging-distribution/spec.md#workspace-runtime-model; source context \"workspace-runtime-model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 250,
  "factsSHA256": "d654e10b5493ef880106d2aa80a531f8d2553c3b476ce97c227717ba1d70c45a",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Workspace Runtime Model",
    "anchor": "workspace-runtime-model",
    "githubAnchor": "workspace-runtime-model",
    "stableAnchor": "h-7baf5e573957",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0",
    "sample": "Workspace Runtime Model",
    "sectionPayloadDigest": "0054459610cb5b1fb0798f7c067eaf97f953d048eb04d96f2c3a4339c6a3a055",
    "followingBlockDigest": "25b0152eb0224cc8800a2d0284f2b62c6bab8d4933b1122da4e834e7bd922fdf",
    "identityFingerprint": "41cf0ffef6f9a791a1202e2bbd3bd5872f21a12ad08a891244d8b6623fc3c285",
    "ancestry": [],
    "path": "docs/architect/packaging-distribution/workspace-runtime-model.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Workspace Runtime Model",
    "anchor": "workspace-runtime-model",
    "githubAnchor": "workspace-runtime-model",
    "stableAnchor": "h-ef9e3b4d328a",
    "startLine": 425,
    "endLine": 425,
    "textDigest": "d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e",
    "sample": "Workspace Runtime Model",
    "sectionPayloadDigest": "6c8c5006f5109b218b8a306e6fa372acc8d1ca0d65a6391b7dcadaead5d10c5a",
    "followingBlockDigest": "25b0152eb0224cc8800a2d0284f2b62c6bab8d4933b1122da4e834e7bd922fdf",
    "identityFingerprint": "3e6f36181476bd9f5ebb0d46b237e54981a135477ef4912c1b02868b9e3ebfef",
    "ancestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail"
    ],
    "path": "docs/platform/packaging-distribution/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 1 → 3, title \"Workspace Runtime Model\" → \"Workspace Runtime Model\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels L10-26 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/250/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_163988c8973416bdd64781cc7c667f65",
    "sourceUnitDigest": "b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "workspace-runtime-model",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:1-1#workspace-runtime-model (current lines); unit SHA256 b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0.\nTarget: docs/platform/packaging-distribution/spec.md:425-425#workspace-runtime-model (current lines); unit SHA256 d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e.\nSource and target unit digests differ.\nTarget changed since last reviewed digest b17cd70e3bb848b985deb966b7c9ffc192142e8f887bfb49d3bf4d76c70efa15 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nLink 3: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../system-architecture/architecture/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/platform/system-architecture/architecture/workspace-topology.md.\nHeading depth: 1 → 3; title \"Workspace Runtime Model\" → \"Workspace Runtime Model\".\nWhole direct section differs; depth 1 → 3; 3 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 1 → 3, title \"Workspace Runtime Model\" → \"Workspace Runtime Model\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels L10-26 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#workspace-runtime-model under docs/platform/packaging-distribution/spec.md#workspace-runtime-model; source context \"workspace-runtime-model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail"
    ]
  }
}
```

## Entry rationale-252

```json
{
  "entryId": "rationale-252",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json",
  "collection": "claims",
  "claimId": "claim_d6701453661c34a2331f9d9bd12ef843",
  "before": {
    "claimId": "claim_d6701453661c34a2331f9d9bd12ef843",
    "sourceUnitDigest": "4b5c6ec34731f2d032006f5fdd787ef8207452a06456fb639c11a3c1df6c6b39",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-75",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:14-18#unheaded-block-2 (current lines); unit SHA256 4b5c6ec34731f2d032006f5fdd787ef8207452a06456fb639c11a3c1df6c6b39.\nTarget: docs/platform/packaging-distribution/spec.md:438-442#unheaded-block-75 (current lines); unit SHA256 19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 9aefc76daebb502839626d20f26342d459be16ca0412bed1a7d4d3af5dd4ea9c at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 2, target 2; 2 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nApplicable labelled corrections:\nL10-26: \"[docs/architect/workspace-topology.md](../system-architecture/architecture/workspace-topology.md)\" → \"[docs/architect/workspace-topology.md](../../architect/workspace-topology.md)\"; evidence step10-round3-doc-edits.json.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#unheaded-block-2 under docs/platform/packaging-distribution/spec.md#unheaded-block-75; source context \"Workspace Runtime Model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail / Workspace Runtime Model\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "reviewNote": "deep: move workspace-runtime-model.md:14-18#unheaded-block-2@pin -> spec.md:438-442#unheaded-block-75; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 2/2/2/0/0/0 recomputed independently and equal; 1 correction line(s) checked (after-text in target); the difference is fully explained by the listed link respellings, heading depth and corrections; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-11-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail",
      "Workspace Runtime Model"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
  "after": {
    "claimId": "claim_d6701453661c34a2331f9d9bd12ef843",
    "sourceUnitDigest": "4b5c6ec34731f2d032006f5fdd787ef8207452a06456fb639c11a3c1df6c6b39",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-75",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:14-18#unheaded-block-2 (current lines); unit SHA256 4b5c6ec34731f2d032006f5fdd787ef8207452a06456fb639c11a3c1df6c6b39.\nTarget: docs/platform/packaging-distribution/spec.md:438-442#unheaded-block-75 (current lines); unit SHA256 19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 9aefc76daebb502839626d20f26342d459be16ca0412bed1a7d4d3af5dd4ea9c at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 2, target 2; 2 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#unheaded-block-2 under docs/platform/packaging-distribution/spec.md#unheaded-block-75; source context \"Workspace Runtime Model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail / Workspace Runtime Model\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail",
      "Workspace Runtime Model"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 251,
  "factsSHA256": "b92ee2420fd7d15d3a8f740d6c58b130a8dcf003cb1b86d9a3e345cd86448950",
  "sourceWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 14,
    "endLine": 18,
    "textDigest": "4b5c6ec34731f2d032006f5fdd787ef8207452a06456fb639c11a3c1df6c6b39",
    "sample": "> Status: historical redirect. Active topology remains\n> [docs/architect/workspace-topology.md](../workspace-topology.md), while active\n> packaging-distribution runtime records liv",
    "identityFingerprint": "4c4019605f244dbc015f95f3cbd2c3daa733221e2ffa0bc90c0fb3d3d2478bba",
    "ancestry": [
      "Workspace Runtime Model"
    ],
    "path": "docs/architect/packaging-distribution/workspace-runtime-model.md"
  },
  "targetWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-75",
    "githubAnchor": "unheaded-block-75",
    "stableAnchor": "unheaded-block-75",
    "title": "Unheaded block 75",
    "startLine": 438,
    "endLine": 442,
    "textDigest": "19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a",
    "sample": "> Status: historical redirect. Active topology remains\n> [docs/architect/workspace-topology.md](../../architect/workspace-topology.md), while active\n> packaging-distribution runtim",
    "identityFingerprint": "5bdc6ba3ca67fc37b5134f93302687e43ed98224427a962e9d60de09cf4420da",
    "ancestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail",
      "Workspace Runtime Model"
    ],
    "path": "docs/platform/packaging-distribution/spec.md"
  },
  "sectionExplanation": null,
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_d6701453661c34a2331f9d9bd12ef843",
    "sourceUnitDigest": "4b5c6ec34731f2d032006f5fdd787ef8207452a06456fb639c11a3c1df6c6b39",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "unheaded-block-75",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:14-18#unheaded-block-2 (current lines); unit SHA256 4b5c6ec34731f2d032006f5fdd787ef8207452a06456fb639c11a3c1df6c6b39.\nTarget: docs/platform/packaging-distribution/spec.md:438-442#unheaded-block-75 (current lines); unit SHA256 19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 9aefc76daebb502839626d20f26342d459be16ca0412bed1a7d4d3af5dd4ea9c at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 2, target 2; 2 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#unheaded-block-2 under docs/platform/packaging-distribution/spec.md#unheaded-block-75; source context \"Workspace Runtime Model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail / Workspace Runtime Model\". The successor has different direct text; its complete bound unit replaces or accounts for the source under this disposition.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail",
      "Workspace Runtime Model"
    ]
  }
}
```

## Entry rationale-253

```json
{
  "entryId": "rationale-253",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-distribution.json",
  "collection": "claims",
  "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
  "before": {
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "data-dictionary",
    "sourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:55-55#data-dictionary (current lines); unit SHA256 04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f.\nTarget: docs/platform/packaging-distribution/spec.md:515-515#data-dictionary (current lines); unit SHA256 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 4; title \"Data Dictionary\" → \"Data Dictionary\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#data-dictionary under docs/platform/packaging-distribution/spec.md#data-dictionary; source context \"Spec: Distribution\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "data-dictionary",
    "reviewNote": "deep: supersede distribution.md:55-55#data-dictionary@pin -> spec.md:515-515#data-dictionary; digests differ and were recomputed by extractor; lines equal the real spans; anchor ok; context equals the real ancestry; links 0/0/0/0/0/0 recomputed independently and equal; 0 correction line(s) checked (after-text in target); the difference is fully explained by the listed link respellings, heading depth and corrections; last-reviewed digest backed by a committed ok verdict.",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-16",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-step10-rationales-11-287a22d33.md",
    "reviewMode": "ordinary",
    "targetUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ],
    "reviewReportCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505"
  },
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
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 252,
  "factsSHA256": "83da3f516f3f42018ae9210b4a38665034f8ce543224b43fb5b5054a746d22a4",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Data Dictionary",
    "anchor": "data-dictionary",
    "githubAnchor": "data-dictionary",
    "stableAnchor": "h-db5457235e3f",
    "startLine": 55,
    "endLine": 55,
    "textDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "sample": "Data Dictionary",
    "sectionPayloadDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "followingBlockDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "identityFingerprint": "a12ee238bf46dbb593445e87f009ff49eabf8909da233a79cb77963dfab64331",
    "ancestry": [
      "Spec: Distribution"
    ],
    "path": "docs/specs/distribution.md"
  },
  "targetWitness": {
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
    "path": "docs/platform/packaging-distribution/spec.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 4, title \"Data Dictionary\" → \"Data Dictionary\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-distribution.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/252/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
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
  }
}
```

## Entry rationale-254

```json
{
  "entryId": "rationale-254",
  "kind": "round4-rationale-rework",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-governance.json",
  "collection": "claims",
  "claimId": "claim_66f7be3b79ca1fe458ce0416ba1adf89",
  "before": {
    "claimId": "claim_66f7be3b79ca1fe458ce0416ba1adf89",
    "sourceUnitDigest": "b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f",
    "targetOwner": "docs/platform/governance.md",
    "targetAnchor": "14-related-files",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
    "rationale": "Source: docs/doc-governance.md:466-466#14-related-files (current lines); unit SHA256 b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f.\nTarget: docs/platform/governance.md:467-467#14-related-files (current lines); unit SHA256 12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 1b5703ab9905bb5b86c289e9b6474f95cb2313ac563451919595515af5f1000c at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"README.md\" (README.md) → \"README.md\" (documentation/operations/portals/docs-portal.md); resolved docs/README.md → docs/platform/documentation/operations/portals/docs-portal.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"transitional-switchboard.md\" (transitional-switchboard.md) → \"transitional-switchboard.md\" (documentation/switchboard.md); resolved docs/transitional-switchboard.md → docs/platform/documentation/switchboard.md.\nLink 4: \"platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"platform/migration-authoring-rules.md\" (migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 6: \"architect/documentation-system-design.md\" (architect/documentation-system-design.md) → \"architect/documentation-system-design.md\" (../architect/documentation-system-design.md); resolved docs/architect/documentation-system-design.md → docs/architect/documentation-system-design.md.\nHeading depth: 2 → 2; title \"14. Related Files\" → \"14. Related Files\".\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/doc-governance.md#14-related-files under docs/platform/governance.md#14-related-files; source context \"Documentation Governance\", target context \"Documentation Governance\". The source text occurs verbatim inside the bound target section; section-level unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6",
    "targetAncestry": [
      "Documentation Governance"
    ]
  },
  "after": {
    "claimId": "claim_66f7be3b79ca1fe458ce0416ba1adf89",
    "sourceUnitDigest": "b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f",
    "targetOwner": "docs/platform/governance.md",
    "targetAnchor": "14-related-files",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/doc-governance.md:466-466#14-related-files (current lines); unit SHA256 b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f.\nTarget: docs/platform/governance.md:467-467#14-related-files (current lines); unit SHA256 12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 1b5703ab9905bb5b86c289e9b6474f95cb2313ac563451919595515af5f1000c at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"README.md\" (README.md) → \"README.md\" (documentation/operations/portals/docs-portal.md); resolved docs/README.md → docs/platform/documentation/operations/portals/docs-portal.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"transitional-switchboard.md\" (transitional-switchboard.md) → \"transitional-switchboard.md\" (documentation/switchboard.md); resolved docs/transitional-switchboard.md → docs/platform/documentation/switchboard.md.\nLink 4: \"platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"platform/migration-authoring-rules.md\" (migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 6: \"architect/documentation-system-design.md\" (architect/documentation-system-design.md) → \"architect/documentation-system-design.md\" (../architect/documentation-system-design.md); resolved docs/architect/documentation-system-design.md → docs/architect/documentation-system-design.md.\nHeading depth: 2 → 2; title \"14. Related Files\" → \"14. Related Files\".\nWhole direct section differs; depth 2 → 2; 6 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"14. Related Files\" → \"14. Related Files\"; 6 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-governance.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/doc-governance.md#14-related-files under docs/platform/governance.md#14-related-files; source context \"Documentation Governance\", target context \"Documentation Governance\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6",
    "targetAncestry": [
      "Documentation Governance"
    ]
  },
  "authorInputCommit": "9b0526380329d8cb1cb6085a1c8f378e943e2505",
  "tags": [
    "L10-31/whole-direct-section"
  ],
  "evidenceManifest": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json",
  "evidenceIndex": 253,
  "factsSHA256": "f97b6f0a18eb6f224d2363e17eddaf045397900f5b236d5e855b8baf478dffbe",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "14. Related Files",
    "anchor": "14-related-files",
    "githubAnchor": "14-related-files",
    "stableAnchor": "h-268a79605190",
    "startLine": 466,
    "endLine": 466,
    "textDigest": "b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f",
    "sample": "14. Related Files",
    "sectionPayloadDigest": "f42764566cc00268ec5f1cf4ab8d130764ffe3dc3a367881640633c3c876b083",
    "followingBlockDigest": "f42764566cc00268ec5f1cf4ab8d130764ffe3dc3a367881640633c3c876b083",
    "identityFingerprint": "757f5bf6bfafc526942f30385eb0d77534e3ff50eeca6b70e13725c6e6415d19",
    "ancestry": [
      "Documentation Governance"
    ],
    "path": "docs/doc-governance.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "14. Related Files",
    "anchor": "14-related-files",
    "githubAnchor": "14-related-files",
    "stableAnchor": "h-0bbdbfcf2ed4",
    "startLine": 467,
    "endLine": 467,
    "textDigest": "12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6",
    "sample": "14. Related Files",
    "sectionPayloadDigest": "f389738a959bded8d713ae3139c654c123eed5d9a93ae8b439562d84aca629ae",
    "followingBlockDigest": "f389738a959bded8d713ae3139c654c123eed5d9a93ae8b439562d84aca629ae",
    "identityFingerprint": "162adf53d5e0fa7024810b711d2356345e9e4068a20f705de82bf8ea59449bc8",
    "ancestry": [
      "Documentation Governance"
    ],
    "path": "docs/platform/governance.md"
  },
  "sectionExplanation": {
    "kind": "existing-labelled-successor-correction",
    "description": "Complete direct section compared to the next native heading. Depth 2 → 2, title \"14. Related Files\" → \"14. Related Files\"; 6 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-governance.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.",
    "completeWitnessesAt": "62751458b22b47e930dc33b8501d07798b91ace3:plans/260925-documentation-authority-unification/reports/phase-06/step10-round4-rationale-edits.json#/changes/253/facts/sectionExplanation"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "reviewScope": "One ordinary pending claim verdict. Full facts and literal section witnesses are immutable at evidenceManifest/changes/evidenceIndex; currentDecision and after come from the content commit. All rationales mechanically regenerated; independent reviewer chooses deep sample.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_66f7be3b79ca1fe458ce0416ba1adf89",
    "sourceUnitDigest": "b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f",
    "targetOwner": "docs/platform/governance.md",
    "targetAnchor": "14-related-files",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/doc-governance.md:466-466#14-related-files (current lines); unit SHA256 b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f.\nTarget: docs/platform/governance.md:467-467#14-related-files (current lines); unit SHA256 12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 1b5703ab9905bb5b86c289e9b6474f95cb2313ac563451919595515af5f1000c at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"README.md\" (README.md) → \"README.md\" (documentation/operations/portals/docs-portal.md); resolved docs/README.md → docs/platform/documentation/operations/portals/docs-portal.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"transitional-switchboard.md\" (transitional-switchboard.md) → \"transitional-switchboard.md\" (documentation/switchboard.md); resolved docs/transitional-switchboard.md → docs/platform/documentation/switchboard.md.\nLink 4: \"platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"platform/migration-authoring-rules.md\" (migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 6: \"architect/documentation-system-design.md\" (architect/documentation-system-design.md) → \"architect/documentation-system-design.md\" (../architect/documentation-system-design.md); resolved docs/architect/documentation-system-design.md → docs/architect/documentation-system-design.md.\nHeading depth: 2 → 2; title \"14. Related Files\" → \"14. Related Files\".\nWhole direct section differs; depth 2 → 2; 6 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"14. Related Files\" → \"14. Related Files\"; 6 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-governance.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/doc-governance.md#14-related-files under docs/platform/governance.md#14-related-files; source context \"Documentation Governance\", target context \"Documentation Governance\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6",
    "targetAncestry": [
      "Documentation Governance"
    ]
  }
}
```

