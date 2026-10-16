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

Entries: 18

## rationale-35

```json
{
  "entryId": "rationale-35",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_7aacf43ab14386fce6c4a5a8a0519402",
  "before": {
    "claimId": "claim_7aacf43ab14386fce6c4a5a8a0519402",
    "sourceUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "111-contract-tests",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1264-1264#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nTarget: docs/platform/agent-confinement/spec.md:515-515#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.1 Contract tests\" → \"11.1 Contract tests\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.1 Contract tests\" → \"11.1 Contract tests\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#111-contract-tests under docs/platform/agent-confinement/spec.md#111-contract-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_7aacf43ab14386fce6c4a5a8a0519402",
    "sourceUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "111-contract-tests",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1264-1264#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nTarget: docs/platform/agent-confinement/spec.md:515-515#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.1 Contract tests\" → \"11.1 Contract tests\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#111-contract-tests under docs/platform/agent-confinement/spec.md#111-contract-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "currentDecision": {
    "claimId": "claim_7aacf43ab14386fce6c4a5a8a0519402",
    "sourceUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "111-contract-tests",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1264-1264#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nTarget: docs/platform/agent-confinement/spec.md:515-515#111-contract-tests (current lines); unit SHA256 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.1 Contract tests\" → \"11.1 Contract tests\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#111-contract-tests under docs/platform/agent-confinement/spec.md#111-contract-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.1 Contract tests",
    "anchor": "111-contract-tests",
    "githubAnchor": "111-contract-tests",
    "stableAnchor": "h-0ecd8a0b825c",
    "startLine": 1264,
    "endLine": 1264,
    "textDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "sample": "11.1 Contract tests",
    "sectionPayloadDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "followingBlockDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "identityFingerprint": "82af35f92031a6c0270bce069b5b40fe9a518a24c48cf9c19dfd4620df7a8167",
    "sectionText": "### 11.1 Contract tests\n\n- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,\n  policy thiếu và override hạ policy.\n- Project-over-global merge được validate lại.\n- Project config không thể định nghĩa hoặc override machine backend instance.\n- Mọi capability resolve thành policy ID hoặc explicit `unconfined`.\n- Backend không cover required control/grant phải refuse.\n- Network filter/override, grant coverage và resource readiness tuân bảng §8.7.\n- Fingerprint/receipt/channels đúng closed schema; stale proof phải refresh pass\n  trước required spawn, refresh fail/timeout thì refuse.",
    "text": "### 11.1 Contract tests",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.1 Contract tests",
    "anchor": "111-contract-tests",
    "githubAnchor": "111-contract-tests",
    "stableAnchor": "h-60f2d630d8bd",
    "startLine": 515,
    "endLine": 515,
    "textDigest": "6d170846be1146514c997c484be5a940415a4a695507cfad1750510d531bd0d9",
    "sample": "11.1 Contract tests",
    "sectionPayloadDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "followingBlockDigest": "7653e11267b25193a2a1f9c9969fffcc140830bfec41bb55bd80af4a541dc396",
    "identityFingerprint": "82af35f92031a6c0270bce069b5b40fe9a518a24c48cf9c19dfd4620df7a8167",
    "sectionText": "### 11.1 Contract tests\n\n- Schema từ chối key lạ, backend instance/driver type lạ, driver config sai,\n  policy thiếu và override hạ policy.\n- Project-over-global merge được validate lại.\n- Project config không thể định nghĩa hoặc override machine backend instance.\n- Mọi capability resolve thành policy ID hoặc explicit `unconfined`.\n- Backend không cover required control/grant phải refuse.\n- Network filter/override, grant coverage và resource readiness tuân bảng §8.7.\n- Fingerprint/receipt/channels đúng closed schema; stale proof phải refresh pass\n  trước required spawn, refresh fail/timeout thì refuse.",
    "text": "### 11.1 Contract tests",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/34/facts",
    "sha256": "498c63753f5dce084071da9e0e7d69ccec7816f1c2b90f8e1948f55b18ead24d"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-36

```json
{
  "entryId": "rationale-36",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_9168d8af609c58932a87918d4a49b8aa",
  "before": {
    "claimId": "claim_9168d8af609c58932a87918d4a49b8aa",
    "sourceUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "112-one-door-tests",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1276-1276#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nTarget: docs/platform/agent-confinement/spec.md:527-527#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.2 One-door tests\" → \"11.2 One-door tests\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.2 One-door tests\" → \"11.2 One-door tests\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#112-one-door-tests under docs/platform/agent-confinement/spec.md#112-one-door-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_9168d8af609c58932a87918d4a49b8aa",
    "sourceUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "112-one-door-tests",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1276-1276#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nTarget: docs/platform/agent-confinement/spec.md:527-527#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.2 One-door tests\" → \"11.2 One-door tests\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#112-one-door-tests under docs/platform/agent-confinement/spec.md#112-one-door-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "currentDecision": {
    "claimId": "claim_9168d8af609c58932a87918d4a49b8aa",
    "sourceUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "112-one-door-tests",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1276-1276#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nTarget: docs/platform/agent-confinement/spec.md:527-527#112-one-door-tests (current lines); unit SHA256 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.2 One-door tests\" → \"11.2 One-door tests\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#112-one-door-tests under docs/platform/agent-confinement/spec.md#112-one-door-tests; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.2 One-door tests",
    "anchor": "112-one-door-tests",
    "githubAnchor": "112-one-door-tests",
    "stableAnchor": "h-886b988eecbd",
    "startLine": 1276,
    "endLine": 1276,
    "textDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "sample": "11.2 One-door tests",
    "sectionPayloadDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "followingBlockDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "identityFingerprint": "b2e82e3f7befe0b07ad09334df78f223468288b139a707aa687919ceff6bd2b1",
    "sectionText": "### 11.2 One-door tests\n\n- Import/static test chứng minh production caller không gọi executor adapter\n  execute function trực tiếp.\n- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.\n- Adapter fake chỉ nhận prepared invocation.\n- Throw trong resolve/assess/compile/prepare tạo zero spawn.\n- Preferred thiếu backend/needs và partial coverage tuân §8.2, không fallback\n  invocation gốc sau prepare failure.\n- Crash giữa allocation intent và prepare completion được replay/reap\n  idempotent; không cleanup execution còn sống hoặc remote chưa rõ liveness.\n- Collect failure giữ artifact/resource; cleanup failure không xóa agent result.",
    "text": "### 11.2 One-door tests",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.2 One-door tests",
    "anchor": "112-one-door-tests",
    "githubAnchor": "112-one-door-tests",
    "stableAnchor": "h-fb363aa95795",
    "startLine": 527,
    "endLine": 527,
    "textDigest": "82ad2c5e239e041eee2e98c16e8b463b09fb944eade7c446627ee3509bf79fc8",
    "sample": "11.2 One-door tests",
    "sectionPayloadDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "followingBlockDigest": "ef13d34054bfb70d28e34612c2fa9c8baf76e7a153c8f38c1673b92b9936f2bd",
    "identityFingerprint": "b2e82e3f7befe0b07ad09334df78f223468288b139a707aa687919ceff6bd2b1",
    "sectionText": "### 11.2 One-door tests\n\n- Import/static test chứng minh production caller không gọi executor adapter\n  execute function trực tiếp.\n- Cả `spawnWorker` và `executeExecutorCli` đi qua cùng facade.\n- Adapter fake chỉ nhận prepared invocation.\n- Throw trong resolve/assess/compile/prepare tạo zero spawn.\n- Preferred thiếu backend/needs và partial coverage tuân §8.2, không fallback\n  invocation gốc sau prepare failure.\n- Crash giữa allocation intent và prepare completion được replay/reap\n  idempotent; không cleanup execution còn sống hoặc remote chưa rõ liveness.\n- Collect failure giữ artifact/resource; cleanup failure không xóa agent result.",
    "text": "### 11.2 One-door tests",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/35/facts",
    "sha256": "7ea87be44e72c5922101f94916f34c1e7b4e948bc8057143324ece634d8c4d36"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-37

```json
{
  "entryId": "rationale-37",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_78563a2491b11f7a0b412c5b900a7414",
  "before": {
    "claimId": "claim_78563a2491b11f7a0b412c5b900a7414",
    "sourceUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "113-behavior-probes",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1289-1289#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nTarget: docs/platform/agent-confinement/spec.md:540-540#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.3 Behavior probes\" → \"11.3 Behavior probes\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.3 Behavior probes\" → \"11.3 Behavior probes\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#113-behavior-probes under docs/platform/agent-confinement/spec.md#113-behavior-probes; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_78563a2491b11f7a0b412c5b900a7414",
    "sourceUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "113-behavior-probes",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1289-1289#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nTarget: docs/platform/agent-confinement/spec.md:540-540#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.3 Behavior probes\" → \"11.3 Behavior probes\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#113-behavior-probes under docs/platform/agent-confinement/spec.md#113-behavior-probes; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "currentDecision": {
    "claimId": "claim_78563a2491b11f7a0b412c5b900a7414",
    "sourceUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "113-behavior-probes",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1289-1289#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nTarget: docs/platform/agent-confinement/spec.md:540-540#113-behavior-probes (current lines); unit SHA256 a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.3 Behavior probes\" → \"11.3 Behavior probes\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#113-behavior-probes under docs/platform/agent-confinement/spec.md#113-behavior-probes; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.3 Behavior probes",
    "anchor": "113-behavior-probes",
    "githubAnchor": "113-behavior-probes",
    "stableAnchor": "h-866855bcc874",
    "startLine": 1289,
    "endLine": 1289,
    "textDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "sample": "11.3 Behavior probes",
    "sectionPayloadDigest": "25795daf33ab63c17682f94969b0e8f456a1ce9d6742558eaef42524b19d492b",
    "followingBlockDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
    "identityFingerprint": "6fb2d37e90d0e1f61144bf73d34b74f73eb3a1dbcd714f61687ad16ce61459ad",
    "sectionText": "### 11.3 Behavior probes\n\nProbe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:\n\n- ghi vào `run-output` của chính dispatch thành công;\n- host-write-denied: ghi vào cwd/repo root bị chặn;\n- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;\n  probe riêng Git metadata ownership và commit readiness;\n- ghi vào run directory của dispatch khác bị chặn;\n- private home ghi được nhưng real host home bị chặn;\n- descriptor ghi ngoài grant không được kế thừa; stdio chỉ qua output channel\n  được quản lý; attestation công bố host IPC/network ngoài phạm vi đúng §4;\n- `executor-credentials` grant đọc được nhưng không ghi được;\n- host read và network vẫn khả dụng, để chứng minh attestation không overclaim.\n\nProbe input/assertion độc lập với declarative claims. Thay đổi dependency trong\nproof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe\nprovider thay đổi không invalidate backend proof không liên quan.",
    "text": "### 11.3 Behavior probes",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.3 Behavior probes",
    "anchor": "113-behavior-probes",
    "githubAnchor": "113-behavior-probes",
    "stableAnchor": "h-179220e5521a",
    "startLine": 540,
    "endLine": 540,
    "textDigest": "a7a202fee6a85efd0c8a379637bd43e9f5391a9cda96a3d428077837f92f3311",
    "sample": "11.3 Behavior probes",
    "sectionPayloadDigest": "25795daf33ab63c17682f94969b0e8f456a1ce9d6742558eaef42524b19d492b",
    "followingBlockDigest": "6dc2d3110bcb9737263766d842a280447bb840efd94b14cc54cbc739d7c3c0a8",
    "identityFingerprint": "6fb2d37e90d0e1f61144bf73d34b74f73eb3a1dbcd714f61687ad16ce61459ad",
    "sectionText": "### 11.3 Behavior probes\n\nProbe phải nằm trong repo và chạy lại được. Với default bwrap, probe chứng minh:\n\n- ghi vào `run-output` của chính dispatch thành công;\n- host-write-denied: ghi vào cwd/repo root bị chặn;\n- workspace-write: workspace được cấp ghi được, ngoài grant vẫn bị chặn;\n  probe riêng Git metadata ownership và commit readiness;\n- ghi vào run directory của dispatch khác bị chặn;\n- private home ghi được nhưng real host home bị chặn;\n- descriptor ghi ngoài grant không được kế thừa; stdio chỉ qua output channel\n  được quản lý; attestation công bố host IPC/network ngoài phạm vi đúng §4;\n- `executor-credentials` grant đọc được nhưng không ghi được;\n- host read và network vẫn khả dụng, để chứng minh attestation không overclaim.\n\nProbe input/assertion độc lập với declarative claims. Thay đổi dependency trong\nproof profile bắt buộc refresh probe tương ứng theo §6.6; readiness recipe\nprovider thay đổi không invalidate backend proof không liên quan.",
    "text": "### 11.3 Behavior probes",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/36/facts",
    "sha256": "97bcf04145aa374b72fb427199bed1fe0b94b38c5bfd097d3e12bbbfd8278033"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-38

```json
{
  "entryId": "rationale-38",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_dc8b5bc2507201dd705fcd64deba8224",
  "before": {
    "claimId": "claim_dc8b5bc2507201dd705fcd64deba8224",
    "sourceUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "114-observability",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1308-1308#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nTarget: docs/platform/agent-confinement/spec.md:559-559#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.4 Observability\" → \"11.4 Observability\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.4 Observability\" → \"11.4 Observability\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#114-observability under docs/platform/agent-confinement/spec.md#114-observability; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_dc8b5bc2507201dd705fcd64deba8224",
    "sourceUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "114-observability",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1308-1308#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nTarget: docs/platform/agent-confinement/spec.md:559-559#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.4 Observability\" → \"11.4 Observability\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#114-observability under docs/platform/agent-confinement/spec.md#114-observability; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "currentDecision": {
    "claimId": "claim_dc8b5bc2507201dd705fcd64deba8224",
    "sourceUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "114-observability",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1308-1308#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nTarget: docs/platform/agent-confinement/spec.md:559-559#114-observability (current lines); unit SHA256 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.4 Observability\" → \"11.4 Observability\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#114-observability under docs/platform/agent-confinement/spec.md#114-observability; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.4 Observability",
    "anchor": "114-observability",
    "githubAnchor": "114-observability",
    "stableAnchor": "h-dcc49dd9f79f",
    "startLine": 1308,
    "endLine": 1308,
    "textDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "sample": "11.4 Observability",
    "sectionPayloadDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "followingBlockDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "identityFingerprint": "1e29090251eca1008282da4897323dc42aef6b3d44b173e61dcc7b56ca99350f",
    "sectionText": "### 11.4 Observability\n\n- Pin posture của cả 17 executor hiện tại.\n- Pin exact write grant của ba executor bwrap.\n- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.\n- Event/run record lưu `confinement-attestation.v1` và mismatch.\n- Log stdout/stderr không chứa credential value.",
    "text": "### 11.4 Observability",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.4 Observability",
    "anchor": "114-observability",
    "githubAnchor": "114-observability",
    "stableAnchor": "h-0cf582736c01",
    "startLine": 559,
    "endLine": 559,
    "textDigest": "3ab503ef0253b33caddd6ae3e969b0ca08877af01ef959ca2fcbce54b548419e",
    "sample": "11.4 Observability",
    "sectionPayloadDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "followingBlockDigest": "0863b0b9257af2b10d97f01c65e9433aa9e18f3bca620427ae014d6c874bd9dc",
    "identityFingerprint": "1e29090251eca1008282da4897323dc42aef6b3d44b173e61dcc7b56ca99350f",
    "sectionText": "### 11.4 Observability\n\n- Pin posture của cả 17 executor hiện tại.\n- Pin exact write grant của ba executor bwrap.\n- Có falsifier đỏ khi thêm executor bwrap thứ tư mà không khai báo.\n- Event/run record lưu `confinement-attestation.v1` và mismatch.\n- Log stdout/stderr không chứa credential value.",
    "text": "### 11.4 Observability",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/37/facts",
    "sha256": "55f12fea62bc0af8c086d6c6a27847518c1993bc99db27b7d81f6a07bdc9316b"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-39

```json
{
  "entryId": "rationale-39",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_b532b9a9eb7f76d041c343e2d45bf859",
  "before": {
    "claimId": "claim_b532b9a9eb7f76d041c343e2d45bf859",
    "sourceUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "115-doctorsetup",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1316-1316#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nTarget: docs/platform/agent-confinement/spec.md:567-567#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.5 Doctor/setup\" → \"11.5 Doctor/setup\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"11.5 Doctor/setup\" → \"11.5 Doctor/setup\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#115-doctorsetup under docs/platform/agent-confinement/spec.md#115-doctorsetup; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_b532b9a9eb7f76d041c343e2d45bf859",
    "sourceUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "115-doctorsetup",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1316-1316#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nTarget: docs/platform/agent-confinement/spec.md:567-567#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.5 Doctor/setup\" → \"11.5 Doctor/setup\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#115-doctorsetup under docs/platform/agent-confinement/spec.md#115-doctorsetup; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "currentDecision": {
    "claimId": "claim_b532b9a9eb7f76d041c343e2d45bf859",
    "sourceUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "115-doctorsetup",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1316-1316#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nTarget: docs/platform/agent-confinement/spec.md:567-567#115-doctorsetup (current lines); unit SHA256 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"11.5 Doctor/setup\" → \"11.5 Doctor/setup\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#115-doctorsetup under docs/platform/agent-confinement/spec.md#115-doctorsetup; source context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\", target context \"Spec: Agent Confinement Authority / 11. Proof và Definition of Done\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.5 Doctor/setup",
    "anchor": "115-doctorsetup",
    "githubAnchor": "115-doctorsetup",
    "stableAnchor": "h-f12088d9faea",
    "startLine": 1316,
    "endLine": 1316,
    "textDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "sample": "11.5 Doctor/setup",
    "sectionPayloadDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "followingBlockDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "identityFingerprint": "63db4a6c6040e594a90a3ba706fe7bb20be7e02a99702a61a51928b0815ede37",
    "sectionText": "### 11.5 Doctor/setup\n\nMỗi backend driver đăng ký check schema/capability và mỗi machine-registry\ninstance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform\nsupport, namespace/mount prerequisite, runDir writable, credential source\nreadable và probe freshness. `fgos setup` tạo/fill missing backend instance\ntrong machine registry mà không ghi đè custom value; shared project/global\nconfig vẫn giữ precedence hiện hành. Doctor report phân biệt rõ `configured`,\n`disabled`, `unavailable` và `ready`.",
    "text": "### 11.5 Doctor/setup",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "11.5 Doctor/setup",
    "anchor": "115-doctorsetup",
    "githubAnchor": "115-doctorsetup",
    "stableAnchor": "h-59852c0a93a4",
    "startLine": 567,
    "endLine": 567,
    "textDigest": "2bcf45ee10d616e860737c38258d6a819c63e4a5f86ef7668e37abf3d6b9a3fe",
    "sample": "11.5 Doctor/setup",
    "sectionPayloadDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "followingBlockDigest": "03aadf655bc30ec74e7e34d25a18d3b8f3f866fc2120a48550822fada8afa1d5",
    "identityFingerprint": "63db4a6c6040e594a90a3ba706fe7bb20be7e02a99702a61a51928b0815ede37",
    "sectionText": "### 11.5 Doctor/setup\n\nMỗi backend driver đăng ký check schema/capability và mỗi machine-registry\ninstance được `fgos doctor` kiểm tra: binary hoặc runtime khả dụng, platform\nsupport, namespace/mount prerequisite, runDir writable, credential source\nreadable và probe freshness. `fgos setup` tạo/fill missing backend instance\ntrong machine registry mà không ghi đè custom value; shared project/global\nconfig vẫn giữ precedence hiện hành. Doctor report phân biệt rõ `configured`,\n`disabled`, `unavailable` và `ready`.",
    "text": "### 11.5 Doctor/setup",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "11. Proof và Definition of Done"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/38/facts",
    "sha256": "08d67bb9e78927385007df08365bf6a85423500ea4a0dd4052aac40ef20f887c"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-40

```json
{
  "entryId": "rationale-40",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_e793bd095f4a872b0bc08757c827359f",
  "before": {
    "claimId": "claim_e793bd095f4a872b0bc08757c827359f",
    "sourceUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
    "targetAnchor": "12-quyết-định-của-proposal",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1326-1326#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nTarget: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md:24-24#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"12. Quyết định của proposal\" → \"12. Quyết định của proposal\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"12. Quyết định của proposal\" → \"12. Quyết định của proposal\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#12-quyết-định-của-proposal under docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#12-quyết-định-của-proposal; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: confinement authority decisions\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetAncestry": [
      "Added in candidate: confinement authority decisions"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_e793bd095f4a872b0bc08757c827359f",
    "sourceUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
    "targetAnchor": "12-quyết-định-của-proposal",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1326-1326#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nTarget: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md:24-24#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"12. Quyết định của proposal\" → \"12. Quyết định của proposal\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#12-quyết-định-của-proposal under docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#12-quyết-định-của-proposal; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: confinement authority decisions\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetAncestry": [
      "Added in candidate: confinement authority decisions"
    ]
  },
  "currentDecision": {
    "claimId": "claim_e793bd095f4a872b0bc08757c827359f",
    "sourceUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
    "targetAnchor": "12-quyết-định-của-proposal",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1326-1326#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nTarget: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md:24-24#12-quyết-định-của-proposal (current lines); unit SHA256 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"12. Quyết định của proposal\" → \"12. Quyết định của proposal\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#12-quyết-định-của-proposal under docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#12-quyết-định-của-proposal; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: confinement authority decisions\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "targetAncestry": [
      "Added in candidate: confinement authority decisions"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "12. Quyết định của proposal",
    "anchor": "12-quyết-định-của-proposal",
    "githubAnchor": "12-quyết-định-của-proposal",
    "stableAnchor": "h-ff16de6cd157",
    "startLine": 1326,
    "endLine": 1326,
    "textDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "sample": "12. Quyết định của proposal",
    "sectionPayloadDigest": "92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1",
    "followingBlockDigest": "92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1",
    "identityFingerprint": "c87149d70c4b0ea8ad97bd1a4cc43a66d1f2cbea61ed8522610331905d35ceaa",
    "sectionText": "## 12. Quyết định của proposal\n\n| Quyết định | Lý do |\n|---|---|\n| Một runtime authority door, sau khi có `runDir`, trước adapter | Đủ runtime data và adapter không bypass |\n| Nhiều phase nội bộ không phải nhiều cửa | Tách pure logic/side effect nhưng chỉ một quyền execute |\n| Policy diễn tả từng threat axis, không có boolean tổng quát | Chống overclaim và mở rộng không phá nghĩa cũ |\n| Write exception là resource `run-output`, resolve runtime | Portable và hẹp đúng dispatch |\n| `required` refuse; `preferred` mới degrade; `unconfined` explicit | Một contract đủ cho secure và portable workflow |\n| Capability đặt minimum; executor tham chiếu một backend instance | Trách nhiệm rõ, không có thuật toán chọn backend ẩn |\n| Machine registry khai instance + driver-specific deployment config, không chọn default | Customizable nhưng không tạo nguồn routing thứ hai |\n| Backend không cover thì refuse/degrade theo mode, không auto-fallback | Không âm thầm đổi filesystem, credential hay network semantics |\n| Driver assess; Authority decide/compile; driver prepare; Authority execute | Mỗi quyết định chỉ có một owner |\n| Provider normalizer phát resource binding chuẩn; backend provider-agnostic | Không giấu recipe thành nhánh provider trong driver |\n| Observe-first khi rollout, enforcement là đích | Có evidence trước breaking change, không hạ mục tiêu |\n| Detector độc lập và không tự nâng assurance | Tránh tự xác nhận vòng tròn |",
    "text": "## 12. Quyết định của proposal",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "12. Quyết định của proposal",
    "anchor": "12-quyết-định-của-proposal",
    "githubAnchor": "12-quyết-định-của-proposal",
    "stableAnchor": "h-80f48075fc23",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "52a57335bb3e35e9a18d3af5acbb56331567d845bd468629f7c4ea3ee5a4935f",
    "sample": "12. Quyết định của proposal",
    "sectionPayloadDigest": "92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1",
    "followingBlockDigest": "92b2a00d3ef31661c9945793933c8796b9d85c5d1ff72795cb0f4cb1882526d1",
    "identityFingerprint": "c87149d70c4b0ea8ad97bd1a4cc43a66d1f2cbea61ed8522610331905d35ceaa",
    "sectionText": "## 12. Quyết định của proposal\n\n| Quyết định | Lý do |\n|---|---|\n| Một runtime authority door, sau khi có `runDir`, trước adapter | Đủ runtime data và adapter không bypass |\n| Nhiều phase nội bộ không phải nhiều cửa | Tách pure logic/side effect nhưng chỉ một quyền execute |\n| Policy diễn tả từng threat axis, không có boolean tổng quát | Chống overclaim và mở rộng không phá nghĩa cũ |\n| Write exception là resource `run-output`, resolve runtime | Portable và hẹp đúng dispatch |\n| `required` refuse; `preferred` mới degrade; `unconfined` explicit | Một contract đủ cho secure và portable workflow |\n| Capability đặt minimum; executor tham chiếu một backend instance | Trách nhiệm rõ, không có thuật toán chọn backend ẩn |\n| Machine registry khai instance + driver-specific deployment config, không chọn default | Customizable nhưng không tạo nguồn routing thứ hai |\n| Backend không cover thì refuse/degrade theo mode, không auto-fallback | Không âm thầm đổi filesystem, credential hay network semantics |\n| Driver assess; Authority decide/compile; driver prepare; Authority execute | Mỗi quyết định chỉ có một owner |\n| Provider normalizer phát resource binding chuẩn; backend provider-agnostic | Không giấu recipe thành nhánh provider trong driver |\n| Observe-first khi rollout, enforcement là đích | Có evidence trước breaking change, không hạ mục tiêu |\n| Detector độc lập và không tự nâng assurance | Tránh tự xác nhận vòng tròn |",
    "text": "## 12. Quyết định của proposal",
    "ancestry": [
      "Added in candidate: confinement authority decisions"
    ],
    "path": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/39/facts",
    "sha256": "7da564025bc7fa284b0da3b5ecac5ea0534f3282fa7dfea234bf4dd640e1bb48"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-41

```json
{
  "entryId": "rationale-41",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_7aede254166851de375089f4b0160ca6",
  "before": {
    "claimId": "claim_7aede254166851de375089f4b0160ca6",
    "sourceUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1343-1343#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:39-39#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\" → \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\" → \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_7aede254166851de375089f4b0160ca6",
    "sourceUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1343-1343#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:39-39#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\" → \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ]
  },
  "currentDecision": {
    "claimId": "claim_7aede254166851de375089f4b0160ca6",
    "sourceUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1343-1343#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:39-39#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items (current lines); unit SHA256 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\" → \"13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "anchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "githubAnchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "stableAnchor": "h-c9b02be6aabd",
    "startLine": 1343,
    "endLine": 1343,
    "textDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "sample": "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "sectionPayloadDigest": "1fc0d4cbbe5a263e67f29f17230401aa211d9042d09712af5ff20cd53c33e91f",
    "followingBlockDigest": "a7fc9ce0823faab5b809042244aae5280d335cab7d03343c7e3ba2fe7e1e20ea",
    "identityFingerprint": "a038bbeda50426ee1b97b96f990dc8ffcf1bc80a86fd1141ca6d75984a87bd76",
    "sectionText": "## 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\n\nBảy rủi ro ban đầu đã được giải quyết qua các cell thi công P00-P06:\n\n1. **`herdr-spawn` convergence:** Pre-adapter checks (`workspace: own` worktree cwd và bypass pairing) đã đưa ra Authority prepare. Bypass pairing được bảo vệ bởi hàm dùng chung `evaluateBypassPairing` cho cả Authority và `herdr-round.mjs`. Quản lý session/home lifecycle được khoanh vùng trong adapter; `fgos doctor` phản ánh trạng thái này là `partial` (P05).\n2. **One-door call graph:** AST và import tests (`test/architecture.test.mjs`) bảo đảm không còn production call site nào ngoài `authority.mjs` được phép truy cập adapter execute handle (P02).\n3. **`runDir` và grant scoping:** `run-output` được cấp riêng theo từng dispatch; agent không thể ghi đè sang runDir của dispatch khác (P03, probe 4).\n4. **Attestation persistence:** Bản ghi `confinement-attestation.v1` được lưu trữ an toàn, gắn liền với kết quả execution, ngăn chặn agent trong sandbox giả mạo bằng chứng (P03).\n5. **Probe harness:** 8 bài probe falsification độc lập đã được cam kết tại `src/runner/dispatch/confinement/probes/` và kiểm tra độ tươi qua `fgos doctor` (P03).\n6. **Machine backend registry:** `~/.fgos/confinement-backends.json` được định nghĩa theo schema đóng `confinement-backend-registry.v1`, không cho phép project config ghi đè, và tự động bootstrap qua `fgos doctor --fix` (P01).\n7. **Bản đồ kiến trúc:** Component `src/runner/dispatch/confinement/`, slice `confinement-enforcement`, và contract CTR010 (`confinement-authority.v1`) đã được đăng ký chính thức tại `docs/architecture-map.md` (P07).",
    "text": "## 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "anchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "githubAnchor": "13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items",
    "stableAnchor": "h-c462f8b8b037",
    "startLine": 39,
    "endLine": 39,
    "textDigest": "5b4b826dee4bf97e40378670f520aa3dc9c667d40de9d6e2b10447578371d38f",
    "sample": "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "sectionPayloadDigest": "1fc0d4cbbe5a263e67f29f17230401aa211d9042d09712af5ff20cd53c33e91f",
    "followingBlockDigest": "a7fc9ce0823faab5b809042244aae5280d335cab7d03343c7e3ba2fe7e1e20ea",
    "identityFingerprint": "a038bbeda50426ee1b97b96f990dc8ffcf1bc80a86fd1141ca6d75984a87bd76",
    "sectionText": "## 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\n\nBảy rủi ro ban đầu đã được giải quyết qua các cell thi công P00-P06:\n\n1. **`herdr-spawn` convergence:** Pre-adapter checks (`workspace: own` worktree cwd và bypass pairing) đã đưa ra Authority prepare. Bypass pairing được bảo vệ bởi hàm dùng chung `evaluateBypassPairing` cho cả Authority và `herdr-round.mjs`. Quản lý session/home lifecycle được khoanh vùng trong adapter; `fgos doctor` phản ánh trạng thái này là `partial` (P05).\n2. **One-door call graph:** AST và import tests (`test/architecture.test.mjs`) bảo đảm không còn production call site nào ngoài `authority.mjs` được phép truy cập adapter execute handle (P02).\n3. **`runDir` và grant scoping:** `run-output` được cấp riêng theo từng dispatch; agent không thể ghi đè sang runDir của dispatch khác (P03, probe 4).\n4. **Attestation persistence:** Bản ghi `confinement-attestation.v1` được lưu trữ an toàn, gắn liền với kết quả execution, ngăn chặn agent trong sandbox giả mạo bằng chứng (P03).\n5. **Probe harness:** 8 bài probe falsification độc lập đã được cam kết tại `src/runner/dispatch/confinement/probes/` và kiểm tra độ tươi qua `fgos doctor` (P03).\n6. **Machine backend registry:** `~/.fgos/confinement-backends.json` được định nghĩa theo schema đóng `confinement-backend-registry.v1`, không cho phép project config ghi đè, và tự động bootstrap qua `fgos doctor --fix` (P01).\n7. **Bản đồ kiến trúc:** Component `src/runner/dispatch/confinement/`, slice `confinement-enforcement`, và contract CTR010 (`confinement-authority.v1`) đã được đăng ký chính thức tại `docs/architecture-map.md` (P07).",
    "text": "## 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)",
    "ancestry": [
      "Added in candidate: rollout and settled facts"
    ],
    "path": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/40/facts",
    "sha256": "90ed97d3050b907c1b77c54a35a8ed602566270f03a0c68dd2113e49145be7ce"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-42

```json
{
  "entryId": "rationale-42",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_39c40cef341e227d936ea768b12ba435",
  "before": {
    "claimId": "claim_39c40cef341e227d936ea768b12ba435",
    "sourceUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1355-1355#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:51-51#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\" → \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\" → \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Added in candidate: rollout and settled facts / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_39c40cef341e227d936ea768b12ba435",
    "sourceUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1355-1355#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:51-51#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\" → \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Added in candidate: rollout and settled facts / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ]
  },
  "currentDecision": {
    "claimId": "claim_39c40cef341e227d936ea768b12ba435",
    "sourceUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1355-1355#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:51-51#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên (current lines); unit SHA256 ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\" → \"13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Added in candidate: rollout and settled facts / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên",
    "anchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "githubAnchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "stableAnchor": "h-e0e1a7595b41",
    "startLine": 1355,
    "endLine": 1355,
    "textDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "sample": "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên",
    "sectionPayloadDigest": "0c8410017c94755acd170973be6e4c78eb54aea4bd0cdb3a1350d3524c95c391",
    "followingBlockDigest": "09081a2c1a3eb4536192eed72162efca188fdf9b084170519b57415f216c32c3",
    "identityFingerprint": "942a121dc08a85b84a6973f1551e50da26e990fac1ed773c9ba34f31d4879838",
    "sectionText": "### 13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\n\n**Công thức (đã chạy thật, Request-to-Run P6):** một invocation `herdr-spawn` có `confinement.backend: bwrap` giữ trạng thái của agent trong một private home thay vì thư mục account thật (đang read-only dưới posture):\n\n1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).\n2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.\n3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state.\"<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>\"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.\n\n**Lịch sử (để khỏi suy ra lại):** `5a42bc376` (2026-09-11) `codex-bwrap` cli-spawn có private-home→`CODEX_HOME`; `569f72d3b`, `a1a966ff2`, `ec6a0745d` (09-16, rotator slice 1 thay `FGOS_CODEX_CREDENTIAL_HOMES`) chuyển credential sang inventory (khi đó chỉ `codex-home`). `c54c1888b`, `8c4b4aeeb`, `2cff7102a` (09-11..18) đưa launch confine của herdr-spawn qua Authority — chứng minh bằng worker giả và claude. `e37f8225d` (09-21, H8) từ chối `credential-provisioning-unsupported` cho adapter khác cli-spawn; lý do chỉ nằm trong comment code và `plans/reports/dispatch-execution-engine-architecture-review-260920.md`. `e7bd9b418`, `a9fc61324` (09-17) gộp/đổi tên executor id (`codex-bwrap` thành `openai`/`codex-cli-bwrap`), `5bbd066cd` xoá `claude-herdr`/`pi-herdr` \"dormant\" nên grep theo tên cũ không còn ra. `cfd670c43` (2026-10-01) áp posture lên mọi invocation herdr nhưng không kèm binding: codex/pi/agy chết ngay lúc khởi động (state dir read-only).\n\n**Vì sao từng bị quên:** (a) cách làm nằm trong commit và trong spec dưới nhãn \"Codex bwrap\" nên đọc như chuyện riêng của cli-spawn; (b) ngoại lệ H8 loại herdr-spawn không có trong spec; (c) id executor bị đổi tên, tìm theo tên cũ không thấy; (d) phase \"facts\" của kế hoạch chỉ hỏi về code hiện tại, không hỏi \"trước đây đã có gì và vì sao bị bỏ\". Bước kiểm tiền lệ nay nằm ở `AGENTS.md` (\"Before touching code\").",
    "text": "### 13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên",
    "anchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "githubAnchor": "131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên",
    "stableAnchor": "h-8c2cd16a1cdd",
    "startLine": 51,
    "endLine": 51,
    "textDigest": "ea51c76dca7a1c31cbc4288b0970c5b108a4ebf755e9b0d5790638262cf0580b",
    "sample": "13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên",
    "sectionPayloadDigest": "0c8410017c94755acd170973be6e4c78eb54aea4bd0cdb3a1350d3524c95c391",
    "followingBlockDigest": "09081a2c1a3eb4536192eed72162efca188fdf9b084170519b57415f216c32c3",
    "identityFingerprint": "942a121dc08a85b84a6973f1551e50da26e990fac1ed773c9ba34f31d4879838",
    "sectionText": "### 13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên\n\n**Công thức (đã chạy thật, Request-to-Run P6):** một invocation `herdr-spawn` có `confinement.backend: bwrap` giữ trạng thái của agent trong một private home thay vì thư mục account thật (đang read-only dưới posture):\n\n1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).\n2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.\n3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state.\"<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>\"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.\n\n**Lịch sử (để khỏi suy ra lại):** `5a42bc376` (2026-09-11) `codex-bwrap` cli-spawn có private-home→`CODEX_HOME`; `569f72d3b`, `a1a966ff2`, `ec6a0745d` (09-16, rotator slice 1 thay `FGOS_CODEX_CREDENTIAL_HOMES`) chuyển credential sang inventory (khi đó chỉ `codex-home`). `c54c1888b`, `8c4b4aeeb`, `2cff7102a` (09-11..18) đưa launch confine của herdr-spawn qua Authority — chứng minh bằng worker giả và claude. `e37f8225d` (09-21, H8) từ chối `credential-provisioning-unsupported` cho adapter khác cli-spawn; lý do chỉ nằm trong comment code và `plans/reports/dispatch-execution-engine-architecture-review-260920.md`. `e7bd9b418`, `a9fc61324` (09-17) gộp/đổi tên executor id (`codex-bwrap` thành `openai`/`codex-cli-bwrap`), `5bbd066cd` xoá `claude-herdr`/`pi-herdr` \"dormant\" nên grep theo tên cũ không còn ra. `cfd670c43` (2026-10-01) áp posture lên mọi invocation herdr nhưng không kèm binding: codex/pi/agy chết ngay lúc khởi động (state dir read-only).\n\n**Vì sao từng bị quên:** (a) cách làm nằm trong commit và trong spec dưới nhãn \"Codex bwrap\" nên đọc như chuyện riêng của cli-spawn; (b) ngoại lệ H8 loại herdr-spawn không có trong spec; (c) id executor bị đổi tên, tìm theo tên cũ không thấy; (d) phase \"facts\" của kế hoạch chỉ hỏi về code hiện tại, không hỏi \"trước đây đã có gì và vì sao bị bỏ\". Bước kiểm tiền lệ nay nằm ở `AGENTS.md` (\"Before touching code\").",
    "text": "### 13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên",
    "ancestry": [
      "Added in candidate: rollout and settled facts",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ],
    "path": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/41/facts",
    "sha256": "c68d17f7528b68cbeadf595c567549dabc2d130ee35cba4a9155fb17d254f325"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-43

```json
{
  "entryId": "rationale-43",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_bed90dbb7de2a5782fafcdb4a3d6e0da",
  "before": {
    "claimId": "claim_bed90dbb7de2a5782fafcdb4a3d6e0da",
    "sourceUnitDigest": "21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1367-1367#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược (current lines); unit SHA256 21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84.\nTarget: docs/platform/agent-confinement/spec.md:579-579#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược (current lines); unit SHA256 21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\" → \"13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\" → \"13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược under docs/platform/agent-confinement/spec.md#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Spec: Agent Confinement Authority / Added in candidate: Current settled facts and deferred items\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_bed90dbb7de2a5782fafcdb4a3d6e0da",
    "sourceUnitDigest": "21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1367-1367#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược (current lines); unit SHA256 21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84.\nTarget: docs/platform/agent-confinement/spec.md:579-579#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược (current lines); unit SHA256 21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\" → \"13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược under docs/platform/agent-confinement/spec.md#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Spec: Agent Confinement Authority / Added in candidate: Current settled facts and deferred items\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items"
    ]
  },
  "currentDecision": {
    "claimId": "claim_bed90dbb7de2a5782fafcdb4a3d6e0da",
    "sourceUnitDigest": "21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1367-1367#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược (current lines); unit SHA256 21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84.\nTarget: docs/platform/agent-confinement/spec.md:579-579#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược (current lines); unit SHA256 21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\" → \"13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược under docs/platform/agent-confinement/spec.md#132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Spec: Agent Confinement Authority / Added in candidate: Current settled facts and deferred items\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược",
    "anchor": "132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược",
    "githubAnchor": "132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược",
    "stableAnchor": "h-e6747aeceed4",
    "startLine": 1367,
    "endLine": 1367,
    "textDigest": "21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84",
    "sample": "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược",
    "sectionPayloadDigest": "a8b0ff0b2a0cd54a0720bee76bc966a0f63ff854c52181e0eb4965814a337a03",
    "followingBlockDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
    "identityFingerprint": "1abe73192bbbf75d4ec5970dba1c15398d58a58cb5ee24c11d0ecf3d0101d6aa",
    "sectionText": "### 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\n\nPrivate home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):\n\n- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.",
    "text": "### 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược",
    "anchor": "132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược",
    "githubAnchor": "132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược",
    "stableAnchor": "h-9db0d1aaa48e",
    "startLine": 579,
    "endLine": 579,
    "textDigest": "21f2bf3ad52967fc6e5414fed7ade9b084a6c1a76adf93fbcb39447ca3f5da84",
    "sample": "13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược",
    "sectionPayloadDigest": "a8b0ff0b2a0cd54a0720bee76bc966a0f63ff854c52181e0eb4965814a337a03",
    "followingBlockDigest": "9c24e69b1b4a4ede9fce9ed6d771f342920397506c61c2a546df8163a810c5ae",
    "identityFingerprint": "1abe73192bbbf75d4ec5970dba1c15398d58a58cb5ee24c11d0ecf3d0101d6aa",
    "sectionText": "### 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược\n\nPrivate home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):\n\n- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.\n- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi kho login (mỗi account với một kho, mỗi `stores/<cli>` với kho theo CLI), nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.",
    "text": "### 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/42/facts",
    "sha256": "4a07d2584c6f775dcbfb9b07eadc0a0dcd1060b58d1b38124868db01ce971768"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-44

```json
{
  "entryId": "rationale-44",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_3f1a1bbd362edb4ff925ff6de3cbd823",
  "before": {
    "claimId": "claim_3f1a1bbd362edb4ff925ff6de3cbd823",
    "sourceUnitDigest": "49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad",
    "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
    "targetAnchor": "133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1374-1374#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên (current lines); unit SHA256 49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad.\nTarget: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md:41-41#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên (current lines); unit SHA256 49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên\" → \"13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên\" → \"13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên under docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Added in candidate: confinement authority decisions / 12. Quyết định của proposal\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad",
    "targetAncestry": [
      "Added in candidate: confinement authority decisions",
      "12. Quyết định của proposal"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_3f1a1bbd362edb4ff925ff6de3cbd823",
    "sourceUnitDigest": "49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad",
    "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
    "targetAnchor": "133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1374-1374#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên (current lines); unit SHA256 49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad.\nTarget: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md:41-41#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên (current lines); unit SHA256 49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên\" → \"13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên under docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Added in candidate: confinement authority decisions / 12. Quyết định của proposal\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad",
    "targetAncestry": [
      "Added in candidate: confinement authority decisions",
      "12. Quyết định của proposal"
    ]
  },
  "currentDecision": {
    "claimId": "claim_3f1a1bbd362edb4ff925ff6de3cbd823",
    "sourceUnitDigest": "49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad",
    "targetOwner": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md",
    "targetAnchor": "133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1374-1374#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên (current lines); unit SHA256 49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad.\nTarget: docs/platform/agent-confinement/decisions/confinement-authority-decisions.md:41-41#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên (current lines); unit SHA256 49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên\" → \"13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên under docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Added in candidate: confinement authority decisions / 12. Quyết định của proposal\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad",
    "targetAncestry": [
      "Added in candidate: confinement authority decisions",
      "12. Quyết định của proposal"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên",
    "anchor": "133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên",
    "githubAnchor": "133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên",
    "stableAnchor": "h-a8612b5d601a",
    "startLine": 1374,
    "endLine": 1374,
    "textDigest": "49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad",
    "sample": "13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên",
    "sectionPayloadDigest": "334fb1ce3b807ff72b08a1dd960bd6360a654eeed38ec83c840cfa3a354979ba",
    "followingBlockDigest": "af28f424e64708cf882cb1c0f7919d22ea461c5a71cf3c39ba0654b90de583b4",
    "identityFingerprint": "4640d71ba8fc29823cd8156aa48f574f453b92167a7a8d383158552afc8e273b",
    "sectionText": "### 13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên\n\n**Quyết định (2026-10-13):** invocation `codex-herdr-fgovn` truyền thêm `--no-daemon` cạnh `-s danger-full-access -a never`. bwrap là confinement; sandbox riêng của Codex phải tắt trong suốt phiên, không chỉ ở lượt đầu.\n\n**Vì sao:** mặc định TUI của Codex (từ 0.160) không tự chạy phiên mà giao cho một app-server daemon dùng chung (`codex app-server --listen unix:// --managed-daemon`), cài vào `<CODEX_HOME>/packages/app-server-daemon/releases/<version>/` lúc khởi động, kèm một daemon-updater tự thay bản mới hơn. Cờ `-s` của TUI chỉ áp cho thread nó mở; một thread mà daemon mở lại sau khi bị thay thì chạy theo mặc định của config, mà với workspace đã được gieo trust thì đó là sandbox `workspace-write` của chính Codex. Sandbox đó dựng bwrap riêng, coi cwd là writable root và mkdir các mount che (`.codex`, `.aws`, ...) bên trong cwd; dưới `--ro-bind / /` của fgOS lệnh mkdir thất bại nên mọi lệnh hỏng trước khi chạy: `bwrap: Can't mkdir <cwd>/.aws: Read-only file system`. Với `--no-daemon` phiên chạy trong chính tiến trình TUI, mang `-s danger-full-access` đến hết, không có daemon/updater nào chạy ra từ private home.\n\n**Bằng chứng:** sự cố thật ở run `unit-run-1791874482416-acccbfe0/panelist-2/1` (pane chạy codex 0.160.1, lệnh đầu chạy được, sau một lần turn bị ngắt thì daemon 0.162.1 xuất hiện trong private home và mọi lệnh hỏng với lỗi trên). Tái hiện cơ chế: dưới đúng mount fgOS dựng (`--ro-bind / /`, `--tmpfs /tmp`, private home và outbox writable), `codex sandbox -c sandbox_mode=\"workspace-write\" -- <ghi outbox>` với cwd là checkout chính báo đúng `bwrap: Can't mkdir /home/vantt/projects/forgentX/.aws: Read-only file system` (worktree không có `.codex` thì báo `.codex`), còn `danger-full-access` ghi được outbox; `read-only` hỏng vì cách khác (`execvp codex-linux-sandbox`). Dispatch pane thật có `--no-daemon`: private home không có `app-server-daemon/` hay `packages/`, run settle, outbox có `report-1.md` và `result-1.json`.\n\n**Chưa chứng minh:** sự kiện nào khiến thread trong sự cố chạy lại dưới `workspace-write` (giả thuyết mạnh nhất: daemon-updater thay 0.160.1 bằng 0.162.1 giữa run, chính việc thay thế làm ngắt turn, và thread được mở lại không mang `-s`). Tắt daemon loại bỏ cả nhánh này; ghi `sandbox_mode = \"danger-full-access\"` vào `config.toml` của private home là lớp phòng thủ thứ hai chưa làm (file đó do bước gieo trust ghi, và driver bwrap không được rẽ nhánh theo provider). Đường `codex exec` (`codex-cli-bwrap`) không dùng daemon nên không đổi.",
    "text": "### 13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên",
    "anchor": "133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên",
    "githubAnchor": "133-pane-codex-chạy---no-daemon-sandbox-riêng-của-codex-phải-tắt-suốt-phiên",
    "stableAnchor": "h-afe028400442",
    "startLine": 41,
    "endLine": 41,
    "textDigest": "49cfcc85f0287a57313ea8cce45d4a511fad6cb36fefbdfc7c532acaf1ffe1ad",
    "sample": "13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên",
    "sectionPayloadDigest": "334fb1ce3b807ff72b08a1dd960bd6360a654eeed38ec83c840cfa3a354979ba",
    "followingBlockDigest": "af28f424e64708cf882cb1c0f7919d22ea461c5a71cf3c39ba0654b90de583b4",
    "identityFingerprint": "4640d71ba8fc29823cd8156aa48f574f453b92167a7a8d383158552afc8e273b",
    "sectionText": "### 13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên\n\n**Quyết định (2026-10-13):** invocation `codex-herdr-fgovn` truyền thêm `--no-daemon` cạnh `-s danger-full-access -a never`. bwrap là confinement; sandbox riêng của Codex phải tắt trong suốt phiên, không chỉ ở lượt đầu.\n\n**Vì sao:** mặc định TUI của Codex (từ 0.160) không tự chạy phiên mà giao cho một app-server daemon dùng chung (`codex app-server --listen unix:// --managed-daemon`), cài vào `<CODEX_HOME>/packages/app-server-daemon/releases/<version>/` lúc khởi động, kèm một daemon-updater tự thay bản mới hơn. Cờ `-s` của TUI chỉ áp cho thread nó mở; một thread mà daemon mở lại sau khi bị thay thì chạy theo mặc định của config, mà với workspace đã được gieo trust thì đó là sandbox `workspace-write` của chính Codex. Sandbox đó dựng bwrap riêng, coi cwd là writable root và mkdir các mount che (`.codex`, `.aws`, ...) bên trong cwd; dưới `--ro-bind / /` của fgOS lệnh mkdir thất bại nên mọi lệnh hỏng trước khi chạy: `bwrap: Can't mkdir <cwd>/.aws: Read-only file system`. Với `--no-daemon` phiên chạy trong chính tiến trình TUI, mang `-s danger-full-access` đến hết, không có daemon/updater nào chạy ra từ private home.\n\n**Bằng chứng:** sự cố thật ở run `unit-run-1791874482416-acccbfe0/panelist-2/1` (pane chạy codex 0.160.1, lệnh đầu chạy được, sau một lần turn bị ngắt thì daemon 0.162.1 xuất hiện trong private home và mọi lệnh hỏng với lỗi trên). Tái hiện cơ chế: dưới đúng mount fgOS dựng (`--ro-bind / /`, `--tmpfs /tmp`, private home và outbox writable), `codex sandbox -c sandbox_mode=\"workspace-write\" -- <ghi outbox>` với cwd là checkout chính báo đúng `bwrap: Can't mkdir /home/vantt/projects/forgentX/.aws: Read-only file system` (worktree không có `.codex` thì báo `.codex`), còn `danger-full-access` ghi được outbox; `read-only` hỏng vì cách khác (`execvp codex-linux-sandbox`). Dispatch pane thật có `--no-daemon`: private home không có `app-server-daemon/` hay `packages/`, run settle, outbox có `report-1.md` và `result-1.json`.\n\n**Chưa chứng minh:** sự kiện nào khiến thread trong sự cố chạy lại dưới `workspace-write` (giả thuyết mạnh nhất: daemon-updater thay 0.160.1 bằng 0.162.1 giữa run, chính việc thay thế làm ngắt turn, và thread được mở lại không mang `-s`). Tắt daemon loại bỏ cả nhánh này; ghi `sandbox_mode = \"danger-full-access\"` vào `config.toml` của private home là lớp phòng thủ thứ hai chưa làm (file đó do bước gieo trust ghi, và driver bwrap không được rẽ nhánh theo provider). Đường `codex exec` (`codex-cli-bwrap`) không dùng daemon nên không đổi.",
    "text": "### 13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên",
    "ancestry": [
      "Added in candidate: confinement authority decisions",
      "12. Quyết định của proposal"
    ],
    "path": "docs/platform/agent-confinement/decisions/confinement-authority-decisions.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/43/facts",
    "sha256": "5e3470766461678a83e671c960b99d9a17d052e78890aa2a33ebdfb315f336a8"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-45

```json
{
  "entryId": "rationale-45",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_06e68651628b7a731b974ec5c34c9743",
  "before": {
    "claimId": "claim_06e68651628b7a731b974ec5c34c9743",
    "sourceUnitDigest": "9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "tồn-đọng-mở-open-deferred-items",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1384-1384#tồn-đọng-mở-open-deferred-items (current lines); unit SHA256 9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f.\nTarget: docs/platform/agent-confinement/spec.md:586-586#tồn-đọng-mở-open-deferred-items (current lines); unit SHA256 9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"Tồn đọng mở (Open Deferred Items):\" → \"Tồn đọng mở (Open Deferred Items):\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"Tồn đọng mở (Open Deferred Items):\" → \"Tồn đọng mở (Open Deferred Items):\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#tồn-đọng-mở-open-deferred-items under docs/platform/agent-confinement/spec.md#tồn-đọng-mở-open-deferred-items; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Spec: Agent Confinement Authority / Added in candidate: Current settled facts and deferred items\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_06e68651628b7a731b974ec5c34c9743",
    "sourceUnitDigest": "9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "tồn-đọng-mở-open-deferred-items",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1384-1384#tồn-đọng-mở-open-deferred-items (current lines); unit SHA256 9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f.\nTarget: docs/platform/agent-confinement/spec.md:586-586#tồn-đọng-mở-open-deferred-items (current lines); unit SHA256 9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"Tồn đọng mở (Open Deferred Items):\" → \"Tồn đọng mở (Open Deferred Items):\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#tồn-đọng-mở-open-deferred-items under docs/platform/agent-confinement/spec.md#tồn-đọng-mở-open-deferred-items; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Spec: Agent Confinement Authority / Added in candidate: Current settled facts and deferred items\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items"
    ]
  },
  "currentDecision": {
    "claimId": "claim_06e68651628b7a731b974ec5c34c9743",
    "sourceUnitDigest": "9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "tồn-đọng-mở-open-deferred-items",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1384-1384#tồn-đọng-mở-open-deferred-items (current lines); unit SHA256 9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f.\nTarget: docs/platform/agent-confinement/spec.md:586-586#tồn-đọng-mở-open-deferred-items (current lines); unit SHA256 9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"Tồn đọng mở (Open Deferred Items):\" → \"Tồn đọng mở (Open Deferred Items):\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#tồn-đọng-mở-open-deferred-items under docs/platform/agent-confinement/spec.md#tồn-đọng-mở-open-deferred-items; source context \"Spec: Agent Confinement Authority / 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)\", target context \"Spec: Agent Confinement Authority / Added in candidate: Current settled facts and deferred items\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Tồn đọng mở (Open Deferred Items):",
    "anchor": "tồn-đọng-mở-open-deferred-items",
    "githubAnchor": "tồn-đọng-mở-open-deferred-items",
    "stableAnchor": "h-46ac9b185e1a",
    "startLine": 1384,
    "endLine": 1384,
    "textDigest": "9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f",
    "sample": "Tồn đọng mở (Open Deferred Items):",
    "sectionPayloadDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
    "followingBlockDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
    "identityFingerprint": "d08dd32340b651e8794fc31c1b1284e6c96ecea808d32bdfc7ed7a1e017f2ff6",
    "sectionText": "### Tồn đọng mở (Open Deferred Items):\n\n- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-out) thay vì `unknown`/`omitted`. Cần phân biệt rõ cờ thừa kế trong phase tiếp theo.\n- **P03 NEW-1b/NEW-1c & P06 M2 (Thin attestation body):** Thân attestation của `enforced` chưa so sánh toàn diện invocation chạy thực tế với plan đã prepare; mảng `channels[]` vẫn mang chi tiết observe-mode.\n- **P03 R4 (Reaper caller):** Hàm dọn dẹp thư mục tạm thành công chưa có caller định kỳ trong production.\n- **Strict Mode Default:** `runner.confinement.strict` tiếp tục mặc định là `false`, giữ an toàn tương thích cho môi trường phát triển và chờ hoàn thiện các tồn đọng trên trước khi kích hoạt mặc định. Operator có thể bật `strict: true` khi đã thoả mãn `fgos doctor`.",
    "text": "### Tồn đọng mở (Open Deferred Items):",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Tồn đọng mở (Open Deferred Items):",
    "anchor": "tồn-đọng-mở-open-deferred-items",
    "githubAnchor": "tồn-đọng-mở-open-deferred-items",
    "stableAnchor": "h-f092b10e073d",
    "startLine": 586,
    "endLine": 586,
    "textDigest": "9f3428ddbdb9c7e79116cfd005571f29b2bf61f2f64344dedf46a0628b04b35f",
    "sample": "Tồn đọng mở (Open Deferred Items):",
    "sectionPayloadDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
    "followingBlockDigest": "63bf6e3f79aef39f4af16bbcdeb237dff250a8f2aefbe0e5b18249eab50649e1",
    "identityFingerprint": "d08dd32340b651e8794fc31c1b1284e6c96ecea808d32bdfc7ed7a1e017f2ff6",
    "sectionText": "### Tồn đọng mở (Open Deferred Items):\n\n- **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-out) thay vì `unknown`/`omitted`. Cần phân biệt rõ cờ thừa kế trong phase tiếp theo.\n- **P03 NEW-1b/NEW-1c & P06 M2 (Thin attestation body):** Thân attestation của `enforced` chưa so sánh toàn diện invocation chạy thực tế với plan đã prepare; mảng `channels[]` vẫn mang chi tiết observe-mode.\n- **P03 R4 (Reaper caller):** Hàm dọn dẹp thư mục tạm thành công chưa có caller định kỳ trong production.\n- **Strict Mode Default:** `runner.confinement.strict` tiếp tục mặc định là `false`, giữ an toàn tương thích cho môi trường phát triển và chờ hoàn thiện các tồn đọng trên trước khi kích hoạt mặc định. Operator có thể bật `strict: true` khi đã thoả mãn `fgos doctor`.",
    "text": "### Tồn đọng mở (Open Deferred Items):",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "Added in candidate: Current settled facts and deferred items"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/44/facts",
    "sha256": "94b12c9caea53140e37cddd9e0a0d575bf6eaa016f9247fcc7f0d5ab33bce219"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-46

```json
{
  "entryId": "rationale-46",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_1d1eb2ce98dcf1855678b2cf86c2ee67",
  "before": {
    "claimId": "claim_1d1eb2ce98dcf1855678b2cf86c2ee67",
    "sourceUnitDigest": "68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "14-pointers-hiện-tại",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1391-1391#14-pointers-hiện-tại (current lines); unit SHA256 68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2.\nTarget: docs/platform/agent-confinement/spec.md:593-593#14-pointers-hiện-tại (current lines); unit SHA256 68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"14. Pointers hiện tại\" → \"14. Pointers hiện tại\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"14. Pointers hiện tại\" → \"14. Pointers hiện tại\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#14-pointers-hiện-tại under docs/platform/agent-confinement/spec.md#14-pointers-hiện-tại; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_1d1eb2ce98dcf1855678b2cf86c2ee67",
    "sourceUnitDigest": "68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "14-pointers-hiện-tại",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1391-1391#14-pointers-hiện-tại (current lines); unit SHA256 68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2.\nTarget: docs/platform/agent-confinement/spec.md:593-593#14-pointers-hiện-tại (current lines); unit SHA256 68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"14. Pointers hiện tại\" → \"14. Pointers hiện tại\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#14-pointers-hiện-tại under docs/platform/agent-confinement/spec.md#14-pointers-hiện-tại; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  },
  "currentDecision": {
    "claimId": "claim_1d1eb2ce98dcf1855678b2cf86c2ee67",
    "sourceUnitDigest": "68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "14-pointers-hiện-tại",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1391-1391#14-pointers-hiện-tại (current lines); unit SHA256 68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2.\nTarget: docs/platform/agent-confinement/spec.md:593-593#14-pointers-hiện-tại (current lines); unit SHA256 68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"14. Pointers hiện tại\" → \"14. Pointers hiện tại\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#14-pointers-hiện-tại under docs/platform/agent-confinement/spec.md#14-pointers-hiện-tại; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "14. Pointers hiện tại",
    "anchor": "14-pointers-hiện-tại",
    "githubAnchor": "14-pointers-hiện-tại",
    "stableAnchor": "h-34b56d01ad2f",
    "startLine": 1391,
    "endLine": 1391,
    "textDigest": "68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2",
    "sample": "14. Pointers hiện tại",
    "sectionPayloadDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
    "followingBlockDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
    "identityFingerprint": "ba056dfbed3fe7ec640afda64bc8d79eb8d94ce5b0754269935083f7289b894e",
    "sectionText": "## 14. Pointers hiện tại\n\n- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.\n- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry\n  và `cliSpawnAdapter` hiện bỏ `confinement`.\n- `src/runner/dispatch/resolve.mjs`: resolve executor và fallback path.\n- `src/runner/dispatch/config.mjs`: validation của shape confinement cũ.\n- `src/runner/dispatch/herdr-round.mjs`: enforcement session/home hiện tại.\n- `src/setup/registrations.mjs`: doctor checks liên quan.\n- `.fgos/config.json`: các invocation bwrap (cli-spawn và herdr-spawn) khai `confinement.backend`; invocation herdr của codex/agy/pi khai thêm `resourceBindings` private-home (§13.1).\n- `docs/routing-handoff-contract.md`: worktree containment không phải sandbox.",
    "text": "## 14. Pointers hiện tại",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "14. Pointers hiện tại",
    "anchor": "14-pointers-hiện-tại",
    "githubAnchor": "14-pointers-hiện-tại",
    "stableAnchor": "h-affb1f69c700",
    "startLine": 593,
    "endLine": 593,
    "textDigest": "68ee70ad03e7863859d56156353b04a9e61b3188841abf5c84e482b110afd3a2",
    "sample": "14. Pointers hiện tại",
    "sectionPayloadDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
    "followingBlockDigest": "b412674cbe8f64e89a752ba65cf9752f00b362a19455bcded73bd2a283d4ab16",
    "identityFingerprint": "ba056dfbed3fe7ec640afda64bc8d79eb8d94ce5b0754269935083f7289b894e",
    "sectionText": "## 14. Pointers hiện tại\n\n- `src/runner/dispatch/cli.mjs`: hai seam trước adapter; `runDir` có tại đây.\n- `src/runner/dispatch/transport.mjs`: `resolveExecutorCommand`, adapter registry\n  và `cliSpawnAdapter` hiện bỏ `confinement`.\n- `src/runner/dispatch/resolve.mjs`: resolve executor và fallback path.\n- `src/runner/dispatch/config.mjs`: validation của shape confinement cũ.\n- `src/runner/dispatch/herdr-round.mjs`: enforcement session/home hiện tại.\n- `src/setup/registrations.mjs`: doctor checks liên quan.\n- `.fgos/config.json`: các invocation bwrap (cli-spawn và herdr-spawn) khai `confinement.backend`; invocation herdr của codex/agy/pi khai thêm `resourceBindings` private-home (§13.1).\n- `docs/routing-handoff-contract.md`: worktree containment không phải sandbox.",
    "text": "## 14. Pointers hiện tại",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/45/facts",
    "sha256": "db45e977f9e297bc2d011b6d412e98462a1b204956e09ca585dda8257a751f99"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-47

```json
{
  "entryId": "rationale-47",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-decision-citation-drift-01.json",
  "collection": "claims",
  "claimId": "claim_fefb1bf47fc375b9e83089dc6059326c",
  "before": {
    "claimId": "claim_fefb1bf47fc375b9e83089dc6059326c",
    "sourceUnitDigest": "95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f",
    "targetOwner": "docs/platform/decision-citation-drift/spec.md",
    "targetAnchor": "pointers-implementation",
    "claimKind": "decision",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/decision-citation-drift.md:98-98#pointers-implementation (current lines); unit SHA256 95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f.\nTarget: docs/platform/decision-citation-drift/spec.md:119-119#pointers-implementation (current lines); unit SHA256 95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Pointers (implementation)\" → \"Pointers (implementation)\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"Pointers (implementation)\" → \"Pointers (implementation)\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-decision-citation-drift-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/decision-citation-drift.md#pointers-implementation under docs/platform/decision-citation-drift/spec.md#pointers-implementation; source context \"Spec: Decision Citation Drift Check\", target context \"Spec: Decision Citation Drift Check\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f",
    "targetAncestry": [
      "Spec: Decision Citation Drift Check"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_fefb1bf47fc375b9e83089dc6059326c",
    "sourceUnitDigest": "95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f",
    "targetOwner": "docs/platform/decision-citation-drift/spec.md",
    "targetAnchor": "pointers-implementation",
    "claimKind": "decision",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/decision-citation-drift.md:98-98#pointers-implementation (current lines); unit SHA256 95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f.\nTarget: docs/platform/decision-citation-drift/spec.md:119-119#pointers-implementation (current lines); unit SHA256 95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Pointers (implementation)\" → \"Pointers (implementation)\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/decision-citation-drift.md#pointers-implementation under docs/platform/decision-citation-drift/spec.md#pointers-implementation; source context \"Spec: Decision Citation Drift Check\", target context \"Spec: Decision Citation Drift Check\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f",
    "targetAncestry": [
      "Spec: Decision Citation Drift Check"
    ]
  },
  "currentDecision": {
    "claimId": "claim_fefb1bf47fc375b9e83089dc6059326c",
    "sourceUnitDigest": "95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f",
    "targetOwner": "docs/platform/decision-citation-drift/spec.md",
    "targetAnchor": "pointers-implementation",
    "claimKind": "decision",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/decision-citation-drift.md:98-98#pointers-implementation (current lines); unit SHA256 95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f.\nTarget: docs/platform/decision-citation-drift/spec.md:119-119#pointers-implementation (current lines); unit SHA256 95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Pointers (implementation)\" → \"Pointers (implementation)\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/decision-citation-drift.md#pointers-implementation under docs/platform/decision-citation-drift/spec.md#pointers-implementation; source context \"Spec: Decision Citation Drift Check\", target context \"Spec: Decision Citation Drift Check\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f",
    "targetAncestry": [
      "Spec: Decision Citation Drift Check"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Pointers (implementation)",
    "anchor": "pointers-implementation",
    "githubAnchor": "pointers-implementation",
    "stableAnchor": "h-e34dee7616ff",
    "startLine": 98,
    "endLine": 98,
    "textDigest": "95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f",
    "sample": "Pointers (implementation)",
    "sectionPayloadDigest": "b2c59c202dc6de42a01a6cec95a4aeca692960350aee8e0f37198a01c736dacd",
    "followingBlockDigest": "b2c59c202dc6de42a01a6cec95a4aeca692960350aee8e0f37198a01c736dacd",
    "identityFingerprint": "a530c2cc6345f4d6cb1b40b41cdc53c47ca96225e5cef415921d7c3d9afe0085",
    "sectionText": "## Pointers (implementation)\n\n- `scripts/check-decision-citation-drift.mjs` — pure functions\n  (`extractCitedIds`, `findCitationDriftFindings`) plus a thin CLI\n  (`loadSupersededById`, `loadSourceFiles`, `runCli`).\n- `test/scripts/check-decision-citation-drift.test.mjs` — 9 tests covering\n  the rules and edge cases above.\n- `src/report/frontmatter.mjs` — reused to read a decision record's\n  `superseded_by` front-matter field.\n- `scripts/check-decision-supersession.mjs` — the sibling check this one\n  mirrors in structure; it checks a decision record's own internal\n  backward-pointer instead of backlog/spec citations (a different area).\n  **Retired against the real repo (tsk-1lv-4/review-fix F9):** the\n  `docs/decisions/NNNN-*.md` + `0000-index.md` pointer-pair format it\n  validates was retired for good along with the hand-authored ADR corpus\n  -- no longer wired into `npm run check:*` (removed from `package.json`).\n  Its pure functions stay real and unit-tested against synthetic\n  fixtures; only the real-repo CLI mode has nothing left to run against.",
    "text": "## Pointers (implementation)",
    "ancestry": [
      "Spec: Decision Citation Drift Check"
    ],
    "path": "docs/specs/decision-citation-drift.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Pointers (implementation)",
    "anchor": "pointers-implementation",
    "githubAnchor": "pointers-implementation",
    "stableAnchor": "h-677440e4f788",
    "startLine": 119,
    "endLine": 119,
    "textDigest": "95e71b5dfa80858cdc6300b28de97966fb7de22d77bdba919c47ad7c9b81d32f",
    "sample": "Pointers (implementation)",
    "sectionPayloadDigest": "b2c59c202dc6de42a01a6cec95a4aeca692960350aee8e0f37198a01c736dacd",
    "followingBlockDigest": "b2c59c202dc6de42a01a6cec95a4aeca692960350aee8e0f37198a01c736dacd",
    "identityFingerprint": "a530c2cc6345f4d6cb1b40b41cdc53c47ca96225e5cef415921d7c3d9afe0085",
    "sectionText": "## Pointers (implementation)\n\n- `scripts/check-decision-citation-drift.mjs` — pure functions\n  (`extractCitedIds`, `findCitationDriftFindings`) plus a thin CLI\n  (`loadSupersededById`, `loadSourceFiles`, `runCli`).\n- `test/scripts/check-decision-citation-drift.test.mjs` — 9 tests covering\n  the rules and edge cases above.\n- `src/report/frontmatter.mjs` — reused to read a decision record's\n  `superseded_by` front-matter field.\n- `scripts/check-decision-supersession.mjs` — the sibling check this one\n  mirrors in structure; it checks a decision record's own internal\n  backward-pointer instead of backlog/spec citations (a different area).\n  **Retired against the real repo (tsk-1lv-4/review-fix F9):** the\n  `docs/decisions/NNNN-*.md` + `0000-index.md` pointer-pair format it\n  validates was retired for good along with the hand-authored ADR corpus\n  -- no longer wired into `npm run check:*` (removed from `package.json`).\n  Its pure functions stay real and unit-tested against synthetic\n  fixtures; only the real-repo CLI mode has nothing left to run against.",
    "text": "## Pointers (implementation)",
    "ancestry": [
      "Spec: Decision Citation Drift Check"
    ],
    "path": "docs/platform/decision-citation-drift/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/46/facts",
    "sha256": "cc0dd4d94214b92aa3a1d1984e4031fa198abf890831c864828fbfb94c9c3e1c"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-48

```json
{
  "entryId": "rationale-48",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-herdr-web-dashboard-01.json",
  "collection": "claims",
  "claimId": "claim_7e17ce226062d06a53b940f64b9d5cdb",
  "before": {
    "claimId": "claim_7e17ce226062d06a53b940f64b9d5cdb",
    "sourceUnitDigest": "e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879",
    "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
    "targetAnchor": "edge-cases-settled",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/herdr-web-dashboard.md:246-246#edge-cases-settled (current lines); unit SHA256 e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879.\nTarget: docs/platform/herdr-web-dashboard/spec.md:267-267#edge-cases-settled (current lines); unit SHA256 e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Edge Cases Settled\" → \"Edge Cases Settled\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"Edge Cases Settled\" → \"Edge Cases Settled\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-herdr-web-dashboard-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/herdr-web-dashboard.md#edge-cases-settled under docs/platform/herdr-web-dashboard/spec.md#edge-cases-settled; source context \"Spec: herdr Web Dashboard (browser surface for fgOS work)\", target context \"Spec: herdr Web Dashboard (browser surface for fgOS work)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879",
    "targetAncestry": [
      "Spec: herdr Web Dashboard (browser surface for fgOS work)"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_7e17ce226062d06a53b940f64b9d5cdb",
    "sourceUnitDigest": "e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879",
    "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
    "targetAnchor": "edge-cases-settled",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/herdr-web-dashboard.md:246-246#edge-cases-settled (current lines); unit SHA256 e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879.\nTarget: docs/platform/herdr-web-dashboard/spec.md:267-267#edge-cases-settled (current lines); unit SHA256 e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Edge Cases Settled\" → \"Edge Cases Settled\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/herdr-web-dashboard.md#edge-cases-settled under docs/platform/herdr-web-dashboard/spec.md#edge-cases-settled; source context \"Spec: herdr Web Dashboard (browser surface for fgOS work)\", target context \"Spec: herdr Web Dashboard (browser surface for fgOS work)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879",
    "targetAncestry": [
      "Spec: herdr Web Dashboard (browser surface for fgOS work)"
    ]
  },
  "currentDecision": {
    "claimId": "claim_7e17ce226062d06a53b940f64b9d5cdb",
    "sourceUnitDigest": "e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879",
    "targetOwner": "docs/platform/herdr-web-dashboard/spec.md",
    "targetAnchor": "edge-cases-settled",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/herdr-web-dashboard.md:246-246#edge-cases-settled (current lines); unit SHA256 e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879.\nTarget: docs/platform/herdr-web-dashboard/spec.md:267-267#edge-cases-settled (current lines); unit SHA256 e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Edge Cases Settled\" → \"Edge Cases Settled\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/herdr-web-dashboard.md#edge-cases-settled under docs/platform/herdr-web-dashboard/spec.md#edge-cases-settled; source context \"Spec: herdr Web Dashboard (browser surface for fgOS work)\", target context \"Spec: herdr Web Dashboard (browser surface for fgOS work)\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879",
    "targetAncestry": [
      "Spec: herdr Web Dashboard (browser surface for fgOS work)"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Edge Cases Settled",
    "anchor": "edge-cases-settled",
    "githubAnchor": "edge-cases-settled",
    "stableAnchor": "h-cc51d2f48367",
    "startLine": 246,
    "endLine": 246,
    "textDigest": "e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879",
    "sample": "Edge Cases Settled",
    "sectionPayloadDigest": "1c226a16285c1c611d2dcbc3db679c21f6367eb19f66428f97fa0b6741c2027d",
    "followingBlockDigest": "1c226a16285c1c611d2dcbc3db679c21f6367eb19f66428f97fa0b6741c2027d",
    "identityFingerprint": "53b973196d2667138be76f057343c97eaf9a521ba2169947a16d11b650108985",
    "sectionText": "## Edge Cases Settled\n\n- **An item that has never been parked.** Its task detail shows a work history\n  and an empty question/answer timeline — the empty timeline is the normal\n  case, not an error.\n- **An item whose narrative source is missing.** Its documentation reference\n  can point at a directory that does not exist. The detail screen shows the\n  item without its narrative rather than failing; the missing narrative is\n  reported as missing.\n- **A narrative reference pointing outside the documentation tree.** Treated\n  as invalid and refused, not followed.\n- **The cockpit is closed.** The dashboard keeps serving (R6) — this is\n  the whole point of the design, not a leftover process.\n- **The gateway is unreachable.** The client says so plainly and offers to\n  retry; it never presents stale data as current.\n- **Approve is offered where it cannot run.** Covered by R7 — reported as\n  unavailable with the reason, never attempted and silently failed.\n- **Retire is asked for as \"delete\".** Covered under Retire a work item —\n  the surface performs retirement and names it as such.",
    "text": "## Edge Cases Settled",
    "ancestry": [
      "Spec: herdr Web Dashboard (browser surface for fgOS work)"
    ],
    "path": "docs/specs/herdr-web-dashboard.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Edge Cases Settled",
    "anchor": "edge-cases-settled",
    "githubAnchor": "edge-cases-settled",
    "stableAnchor": "h-11385622aa2c",
    "startLine": 267,
    "endLine": 267,
    "textDigest": "e57fadfa3c6367e1098e0565fa3a61fe011bb34b4994eb241557beaa2c2ff879",
    "sample": "Edge Cases Settled",
    "sectionPayloadDigest": "1c226a16285c1c611d2dcbc3db679c21f6367eb19f66428f97fa0b6741c2027d",
    "followingBlockDigest": "1c226a16285c1c611d2dcbc3db679c21f6367eb19f66428f97fa0b6741c2027d",
    "identityFingerprint": "53b973196d2667138be76f057343c97eaf9a521ba2169947a16d11b650108985",
    "sectionText": "## Edge Cases Settled\n\n- **An item that has never been parked.** Its task detail shows a work history\n  and an empty question/answer timeline — the empty timeline is the normal\n  case, not an error.\n- **An item whose narrative source is missing.** Its documentation reference\n  can point at a directory that does not exist. The detail screen shows the\n  item without its narrative rather than failing; the missing narrative is\n  reported as missing.\n- **A narrative reference pointing outside the documentation tree.** Treated\n  as invalid and refused, not followed.\n- **The cockpit is closed.** The dashboard keeps serving (R6) — this is\n  the whole point of the design, not a leftover process.\n- **The gateway is unreachable.** The client says so plainly and offers to\n  retry; it never presents stale data as current.\n- **Approve is offered where it cannot run.** Covered by R7 — reported as\n  unavailable with the reason, never attempted and silently failed.\n- **Retire is asked for as \"delete\".** Covered under Retire a work item —\n  the surface performs retirement and names it as such.",
    "text": "## Edge Cases Settled",
    "ancestry": [
      "Spec: herdr Web Dashboard (browser surface for fgOS work)"
    ],
    "path": "docs/platform/herdr-web-dashboard/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/47/facts",
    "sha256": "8449ba0f53c02105b1282a8ca24e17de3bdea5223f798bdb5cfa7bd49e741aa7"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-49

```json
{
  "entryId": "rationale-49",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-observe-01.json",
  "collection": "claims",
  "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
  "before": {
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
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "owns",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/observe.md:12-12#owns (current lines); unit SHA256 ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2.\nTarget: docs/platform/observe/spec.md:34-34#owns (current lines); unit SHA256 a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec\" (../platform/session-identity/spec.md) → \"spec\" (../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nHeading depth: 3 → 3; title \"Owns\" → \"Owns\".\nWhole direct section differs; depth 3 → 3; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections:\nA40/step8-truth-corrections-1: \"`fgos friction rank`).\" → \"`fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"; evidence step8-truth-corrections.json; packages/observe/rust/src/friction_cli.rs:7-9 (evidence commit 2107c4761cdde5f4302502ad564258220ba6a09d).\nDisposition supersede: Account for docs/specs/observe.md#owns under docs/platform/observe/spec.md#owns; source context \"Observe Component Specification / 1. Overview & Boundaries\", target context \"Observe Component Specification / 1. Overview & Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "owns",
    "targetUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ]
  },
  "currentDecision": {
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourcePath": "docs/specs/observe.md",
    "sourceAnchor": "owns",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/observe.md:12-12#owns (current lines); unit SHA256 ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2.\nTarget: docs/platform/observe/spec.md:34-34#owns (current lines); unit SHA256 a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"spec\" (../platform/session-identity/spec.md) → \"spec\" (../session-identity/spec.md); resolved docs/platform/session-identity/spec.md → docs/platform/session-identity/spec.md.\nHeading depth: 3 → 3; title \"Owns\" → \"Owns\".\nWhole direct section differs; depth 3 → 3; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections:\nA40/step8-truth-corrections-1: \"`fgos friction rank`).\" → \"`fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\"; evidence step8-truth-corrections.json; packages/observe/rust/src/friction_cli.rs:7-9 (evidence commit 2107c4761cdde5f4302502ad564258220ba6a09d).\nDisposition supersede: Account for docs/specs/observe.md#owns under docs/platform/observe/spec.md#owns; source context \"Observe Component Specification / 1. Overview & Boundaries\", target context \"Observe Component Specification / 1. Overview & Boundaries\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/observe/spec.md",
    "targetAnchor": "owns",
    "targetUnitDigest": "a03c9cf9107371c2ec305cd2efea93cc9ca0f549ec485158bdb5e9ecc05c63aa",
    "targetAncestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Owns",
    "anchor": "owns",
    "githubAnchor": "owns",
    "stableAnchor": "h-9ad6f085e283",
    "startLine": 12,
    "endLine": 12,
    "textDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "sample": "Owns",
    "sectionPayloadDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "followingBlockDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "identityFingerprint": "4f30fa5a4bf9cedf2a45a147639ccf65bb8775574dcbf1ec929c5167d09abaff",
    "sectionText": "### Owns\n- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`). `writerId` lấy từ crate Session Identity ([spec](../platform/session-identity/spec.md)): chính session id khi `source` là `env`/`registry` (gồm `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`), `pid-<id>` khi `pid`/`unresolved` (gốc terminal hoặc session, không còn pid của chính process). `sessionId` của friction cũng lấy từ đó. Observe không tự đọc biến env identity.\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai.",
    "text": "### Owns",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ],
    "path": "docs/specs/observe.md"
  },
  "targetWitness": {
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
    "sectionText": "### Owns\n- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`). `writerId` lấy từ crate Session Identity ([spec](../session-identity/spec.md)): chính session id khi `source` là `env`/`registry` (gồm `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`), `pid-<id>` khi `pid`/`unresolved` (gốc terminal hoặc session, không còn pid của chính process). `sessionId` của friction cũng lấy từ đó. Observe không tự đọc biến env identity.\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai.",
    "text": "### Owns",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ],
    "path": "docs/platform/observe/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/48/facts",
    "sha256": "0891247b4cacb54f7af90c1c99b54832b0ceb3b3111880ba27b07a91f9905abe"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-50

```json
{
  "entryId": "rationale-50",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json",
  "collection": "claims",
  "claimId": "claim_552ef3d6e22bac10c24cc31e48463d50",
  "before": {
    "claimId": "claim_552ef3d6e22bac10c24cc31e48463d50",
    "sourceUnitDigest": "b91663aeb373f3e9759bda7e8edf97edc512497d6d3adbf55ebdb6b8c7af5187",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "data-dictionary",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/runner.md:71-71#data-dictionary (current lines); unit SHA256 b91663aeb373f3e9759bda7e8edf97edc512497d6d3adbf55ebdb6b8c7af5187.\nTarget: docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md:25-25#data-dictionary (current lines); unit SHA256 3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Data Dictionary\" → \"Data Dictionary\".\nWhole direct section differs; depth 2 → 2; 0 distinct link changes; normalized line order differs; 2 removed and 2 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"Data Dictionary\" → \"Data Dictionary\"; 0 distinct link spelling/label changes; 4 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Labelled successor correction changes the following exact source lines (retained in the bound legacy source): [\"| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: \\\"codex-home\\\", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock ở `~/.fgos/runtime/provider-capacity/state.lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |\",\"| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |\",\"| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem \\\"Xem live output worker khi đang chạy\\\") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |\",\"| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |\",\"| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \\\"Cổng duyệt PR nội bộ\\\" và \\\"Iron Law\\\" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\"]. Candidate additions/corrections are explicitly labelled in the direct section: [\"| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: \\\"codex-home\\\", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock là thư mục `~/.fgos/runtime/provider-capacity/state-lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |\",\"| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 14 lớp: `worker-spawn-fail`, `worker-timeout`, `verify-miss`, `verify-timeout`, `worktree-fail`, `corrupt-log`, `reject-returned`, `stale-doing`, `state-conflict`, `dispatch-in-flight`, `dispatch-depth-exceeded`, `provider-limit`, `worker-failed`, `no-executor` → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |\",\"| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Trong lúc worker chạy, file nhận con trỏ tới capture của Unit run; khối output được nối sau khi run kết thúc | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); con trỏ Unit run được ghi khi run được tạo | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |\",\"| 9 | Candidate (former Gate A; Added in candidate: `evolve` removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | former derivation on `evolve`; no current CLI entry |\",\"| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \\\"Cổng duyệt PR nội bộ\\\" và \\\"Iron Law\\\" dưới, Business Rules RUL36 (former `evolve --submit` contract; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#data-dictionary, docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#unheaded-block-3. Existing correction labels A41 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json; exact section delta: removed [\"| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: \\\"codex-home\\\", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock ở `~/.fgos/runtime/provider-capacity/state.lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |\",\"| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |\",\"| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem \\\"Xem live output worker khi đang chạy\\\") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |\",\"| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |\",\"| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \\\"Cổng duyệt PR nội bộ\\\" và \\\"Iron Law\\\" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\"]; added [\"| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: \\\"codex-home\\\", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock là thư mục `~/.fgos/runtime/provider-capacity/state-lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |\",\"| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 14 lớp: `worker-spawn-fail`, `worker-timeout`, `verify-miss`, `verify-timeout`, `worktree-fail`, `corrupt-log`, `reject-returned`, `stale-doing`, `state-conflict`, `dispatch-in-flight`, `dispatch-depth-exceeded`, `provider-limit`, `worker-failed`, `no-executor` → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |\",\"| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Trong lúc worker chạy, file nhận con trỏ tới capture của Unit run; khối output được nối sau khi run kết thúc | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); con trỏ Unit run được ghi khi run được tạo | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |\",\"| 9 | Candidate (former Gate A; Added in candidate: `evolve` removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | former derivation on `evolve`; no current CLI entry |\",\"| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \\\"Cổng duyệt PR nội bộ\\\" và \\\"Iron Law\\\" dưới, Business Rules RUL36 (former `evolve --submit` contract; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections:\nA41 F-D: capacity lock is a directory: \"lock ở `~/.fgos/runtime/provider-capacity/state.lock`\" → \"lock là thư mục `~/.fgos/runtime/provider-capacity/state-lock`\"; evidence step9-truth-corrections.json; src/runner/dispatch/provider-capacity.mjs:44-49 (evidence commit 24be6cb1d).\nA41 F-D: recovery has 14 classes: \"8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi\" → \"14 lớp: `worker-spawn-fail`, `worker-timeout`, `verify-miss`, `verify-timeout`, `worktree-fail`, `corrupt-log`, `reject-returned`, `stale-doing`, `state-conflict`, `dispatch-in-flight`, `dispatch-depth-exceeded`, `provider-limit`, `worker-failed`, `no-executor`\"; evidence step9-truth-corrections.json; src/runner/recovery.mjs:126-141 (evidence commit 24be6cb1d).\nA41 F-E: item log receives pointer and settled output: \"Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem \\\"Xem live output worker khi đang chạy\\\") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối\" → \"Trong lúc worker chạy, file nhận con trỏ tới capture của Unit run; khối output được nối sau khi run kết thúc\"; evidence step9-truth-corrections.json; src/runner/loop.mjs:349-351 (evidence commit 24be6cb1d); src/runner/loop.mjs:1110-1112 (evidence commit 24be6cb1d); src/runner/loop.mjs:1150-1163 (evidence commit 24be6cb1d).\nA41 F-E: remove raw live-chunk claim: \"xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến\" → \"con trỏ Unit run được ghi khi run được tạo\"; evidence step9-truth-corrections.json; src/runner/loop.mjs:1110-1112 (evidence commit 24be6cb1d).\nDisposition supersede: Account for docs/specs/runner.md#data-dictionary under docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#data-dictionary; source context \"Spec: Runner (vòng tự hành)\", target context \"Added in candidate: Runner Data Dictionary\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_552ef3d6e22bac10c24cc31e48463d50",
    "sourceUnitDigest": "b91663aeb373f3e9759bda7e8edf97edc512497d6d3adbf55ebdb6b8c7af5187",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "data-dictionary",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/runner.md:71-71#data-dictionary (current lines); unit SHA256 b91663aeb373f3e9759bda7e8edf97edc512497d6d3adbf55ebdb6b8c7af5187.\nTarget: docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md:25-25#data-dictionary (current lines); unit SHA256 3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Data Dictionary\" → \"Data Dictionary\".\nWhole direct section differs; depth 2 → 2; 0 distinct link changes; normalized line order differs; 2 removed and 2 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Existing correction labels A41 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json; Removed direct-section lines have distinct live carrier witnesses docs/platform/runner/spec.md#historical-source-section-552ef3d6, docs/platform/runner/spec.md#unheaded-block-7. Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed [\"| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |\",\"| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \\\"Cổng duyệt PR nội bộ\\\" và \\\"Iron Law\\\" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\"]; added [\"| 9 | Candidate (former Gate A; Added in candidate: `evolve` removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | former derivation on `evolve`; no current CLI entry |\",\"| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \\\"Cổng duyệt PR nội bộ\\\" và \\\"Iron Law\\\" dưới, Business Rules RUL36 (former `evolve --submit` contract; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\"].\nApplicable labelled corrections:\nA41 F-D: capacity lock is a directory: \"lock ở `~/.fgos/runtime/provider-capacity/state.lock`\" → \"lock là thư mục `~/.fgos/runtime/provider-capacity/state-lock`\"; evidence step9-truth-corrections.json; src/runner/dispatch/provider-capacity.mjs:44-49 (evidence commit 24be6cb1d).\nA41 F-D: recovery has 14 classes: \"8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi\" → \"14 lớp: `worker-spawn-fail`, `worker-timeout`, `verify-miss`, `verify-timeout`, `worktree-fail`, `corrupt-log`, `reject-returned`, `stale-doing`, `state-conflict`, `dispatch-in-flight`, `dispatch-depth-exceeded`, `provider-limit`, `worker-failed`, `no-executor`\"; evidence step9-truth-corrections.json; src/runner/recovery.mjs:126-141 (evidence commit 24be6cb1d).\nA41 F-E: item log receives pointer and settled output: \"Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem \\\"Xem live output worker khi đang chạy\\\") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối\" → \"Trong lúc worker chạy, file nhận con trỏ tới capture của Unit run; khối output được nối sau khi run kết thúc\"; evidence step9-truth-corrections.json; src/runner/loop.mjs:349-351 (evidence commit 24be6cb1d); src/runner/loop.mjs:1110-1112 (evidence commit 24be6cb1d); src/runner/loop.mjs:1150-1163 (evidence commit 24be6cb1d).\nA41 F-E: remove raw live-chunk claim: \"xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến\" → \"con trỏ Unit run được ghi khi run được tạo\"; evidence step9-truth-corrections.json; src/runner/loop.mjs:1110-1112 (evidence commit 24be6cb1d).\nDisposition supersede: Account for docs/specs/runner.md#data-dictionary under docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#data-dictionary; source context \"Spec: Runner (vòng tự hành)\", target context \"Added in candidate: Runner Data Dictionary\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary"
    ]
  },
  "currentDecision": {
    "claimId": "claim_552ef3d6e22bac10c24cc31e48463d50",
    "sourceUnitDigest": "b91663aeb373f3e9759bda7e8edf97edc512497d6d3adbf55ebdb6b8c7af5187",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "data-dictionary",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/runner.md:71-71#data-dictionary (current lines); unit SHA256 b91663aeb373f3e9759bda7e8edf97edc512497d6d3adbf55ebdb6b8c7af5187.\nTarget: docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md:25-25#data-dictionary (current lines); unit SHA256 3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Data Dictionary\" → \"Data Dictionary\".\nWhole direct section differs; depth 2 → 2; 0 distinct link changes; normalized line order differs; 2 removed and 2 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Existing correction labels A41 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json; Removed direct-section lines have distinct live carrier witnesses docs/platform/runner/spec.md#historical-source-section-552ef3d6, docs/platform/runner/spec.md#unheaded-block-7. Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed [\"| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |\",\"| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \\\"Cổng duyệt PR nội bộ\\\" và \\\"Iron Law\\\" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\"]; added [\"| 9 | Candidate (former Gate A; Added in candidate: `evolve` removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | former derivation on `evolve`; no current CLI entry |\",\"| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \\\"Cổng duyệt PR nội bộ\\\" và \\\"Iron Law\\\" dưới, Business Rules RUL36 (former `evolve --submit` contract; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\"].\nApplicable labelled corrections:\nA41 F-D: capacity lock is a directory: \"lock ở `~/.fgos/runtime/provider-capacity/state.lock`\" → \"lock là thư mục `~/.fgos/runtime/provider-capacity/state-lock`\"; evidence step9-truth-corrections.json; src/runner/dispatch/provider-capacity.mjs:44-49 (evidence commit 24be6cb1d).\nA41 F-D: recovery has 14 classes: \"8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi\" → \"14 lớp: `worker-spawn-fail`, `worker-timeout`, `verify-miss`, `verify-timeout`, `worktree-fail`, `corrupt-log`, `reject-returned`, `stale-doing`, `state-conflict`, `dispatch-in-flight`, `dispatch-depth-exceeded`, `provider-limit`, `worker-failed`, `no-executor`\"; evidence step9-truth-corrections.json; src/runner/recovery.mjs:126-141 (evidence commit 24be6cb1d).\nA41 F-E: item log receives pointer and settled output: \"Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem \\\"Xem live output worker khi đang chạy\\\") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối\" → \"Trong lúc worker chạy, file nhận con trỏ tới capture của Unit run; khối output được nối sau khi run kết thúc\"; evidence step9-truth-corrections.json; src/runner/loop.mjs:349-351 (evidence commit 24be6cb1d); src/runner/loop.mjs:1110-1112 (evidence commit 24be6cb1d); src/runner/loop.mjs:1150-1163 (evidence commit 24be6cb1d).\nA41 F-E: remove raw live-chunk claim: \"xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến\" → \"con trỏ Unit run được ghi khi run được tạo\"; evidence step9-truth-corrections.json; src/runner/loop.mjs:1110-1112 (evidence commit 24be6cb1d).\nDisposition supersede: Account for docs/specs/runner.md#data-dictionary under docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#data-dictionary; source context \"Spec: Runner (vòng tự hành)\", target context \"Added in candidate: Runner Data Dictionary\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Data Dictionary",
    "anchor": "data-dictionary",
    "githubAnchor": "data-dictionary",
    "stableAnchor": "h-02842f76ffd2",
    "startLine": 71,
    "endLine": 71,
    "textDigest": "b91663aeb373f3e9759bda7e8edf97edc512497d6d3adbf55ebdb6b8c7af5187",
    "sample": "Data Dictionary",
    "sectionPayloadDigest": "43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e",
    "followingBlockDigest": "43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e",
    "identityFingerprint": "fe9e6edd48fc349bec6aaa62276311bcaef9cf05282aa9610622f43c6eb0674a",
    "sectionText": "## Data Dictionary\n\n| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế `{prompt}`/`{model}` theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`) · `executors` — catalog executor theo danh tính provider/cách gọi, không mang khẩu vị chất lượng · `modelPolicies` — bảng bắt buộc provider→tier→model với tier cung `nano|mini|standard|advanced|flagship|frontier` · `rigorToTier` — bảng bắt buộc ánh xạ đủ bốn mức cầu `low|standard|high|critical` sang tier cung · `capabilities.<name>.rigor` — sàn cầu tùy chọn, chỉ nâng; khối `capabilities.<name>.overrides` bị từ chối · `timeoutMs` — trần thời gian mặc định của một worker, tối đa 4h; một lượt chạy có thể xin thời gian riêng (RUL96 (one run may take its own timeout)) · `confinement`/`confinementPolicies` — chính sách giam giữ · `capabilities` — catalog lời hứa hành vi và binding executor/invocation | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`); `fgos setup` điền `rigorToTier`, `fgos doctor` kiểm bảng này và các khoá placement đã retired; một `--config <path>` tường minh trỏ vào đường vắng mặt vẫn báo lỗi ngay (`fgos discover`/`plan`; `fgos-runner` không còn `--config`, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) |\n| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: \"codex-home\", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock ở `~/.fgos/runtime/provider-capacity/state.lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |\n| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |\n| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |\n| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |\n| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` **ở stage executing** TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp. Executing-phase-only scoping (claim-lock): trước đây, pick/take chỉ mở frontier (executing-phase), nên counting mọi `todo→doing` move tương đương dispatch attempts. Claim-lock cho phép `pick` cầm stage khác — claim-release cycle ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) không được tính vào ngân sách executing-phase (per claim-lock code-review finding) | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |\n| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |\n| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |\n| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |\n| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem \"Xem live output worker khi đang chạy\") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |\n| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |\n| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \"Cổng duyệt PR nội bộ\" và \"Iron Law\" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\n| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (từ STR91: luật `domain: 'coding'` khớp TRƯỚC wildcard — domain vắng mặt hay không nhận diện được đều fold về `coding` giống mọi nơi khác trong hệ, không phải một fallback riêng — trỏ `worker-prompt-skill-pointer.txt`; mọi domain đã đăng ký khác `coding` (vd `synthetic`) vẫn rơi về wildcard, trỏ `worker-prompt-default.txt` như trước STR91) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) · template `worker-prompt-skill-pointer.txt` giữ đủ 6 mục cố định sẵn có, CHỈ thêm đúng một mục `# Agent skill` trỏ `SKILL.md` của domain đó — đường dẫn luôn resolve qua sổ đăng ký domain→skill (`skillForStage`, spec Work-State \"Mô hình domain\"), không bao giờ hardcode (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`)) | yes (một template mặc định luôn có) | `worker-prompt-default.txt`, `worker-prompt-skill-pointer.txt` |",
    "text": "## Data Dictionary",
    "ancestry": [
      "Spec: Runner (vòng tự hành)"
    ],
    "path": "docs/specs/runner.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Data Dictionary",
    "anchor": "data-dictionary",
    "githubAnchor": "data-dictionary",
    "stableAnchor": "h-5a888960eb72",
    "startLine": 25,
    "endLine": 25,
    "textDigest": "3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41",
    "sample": "Data Dictionary",
    "sectionPayloadDigest": "417a56fd2a82950722e3a35187fe79050d444a85b8b55a4106d3e45059fa1b39",
    "followingBlockDigest": "417a56fd2a82950722e3a35187fe79050d444a85b8b55a4106d3e45059fa1b39",
    "identityFingerprint": "5172aa2c2f0b68441a5fd639d95a46898c2a424379a0ab8a58f24e2ba08c2985",
    "sectionText": "## Data Dictionary\n\n| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế `{prompt}`/`{model}` theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`) · `executors` — catalog executor theo danh tính provider/cách gọi, không mang khẩu vị chất lượng · `modelPolicies` — bảng bắt buộc provider→tier→model với tier cung `nano|mini|standard|advanced|flagship|frontier` · `rigorToTier` — bảng bắt buộc ánh xạ đủ bốn mức cầu `low|standard|high|critical` sang tier cung · `capabilities.<name>.rigor` — sàn cầu tùy chọn, chỉ nâng; khối `capabilities.<name>.overrides` bị từ chối · `timeoutMs` — trần thời gian mặc định của một worker, tối đa 4h; một lượt chạy có thể xin thời gian riêng (RUL96 (one run may take its own timeout)) · `confinement`/`confinementPolicies` — chính sách giam giữ · `capabilities` — catalog lời hứa hành vi và binding executor/invocation | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`); `fgos setup` điền `rigorToTier`, `fgos doctor` kiểm bảng này và các khoá placement đã retired; một `--config <path>` tường minh trỏ vào đường vắng mặt vẫn báo lỗi ngay (`fgos discover`/`plan`; `fgos-runner` không còn `--config`, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) |\n| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: \"codex-home\", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock là thư mục `~/.fgos/runtime/provider-capacity/state-lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |\n| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |\n| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 14 lớp: `worker-spawn-fail`, `worker-timeout`, `verify-miss`, `verify-timeout`, `worktree-fail`, `corrupt-log`, `reject-returned`, `stale-doing`, `state-conflict`, `dispatch-in-flight`, `dispatch-depth-exceeded`, `provider-limit`, `worker-failed`, `no-executor` → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |\n| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |\n| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` **ở stage executing** TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp. Executing-phase-only scoping (claim-lock): trước đây, pick/take chỉ mở frontier (executing-phase), nên counting mọi `todo→doing` move tương đương dispatch attempts. Claim-lock cho phép `pick` cầm stage khác — claim-release cycle ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) không được tính vào ngân sách executing-phase (per claim-lock code-review finding) | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |\n| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |\n| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |\n| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |\n| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Trong lúc worker chạy, file nhận con trỏ tới capture của Unit run; khối output được nối sau khi run kết thúc | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); con trỏ Unit run được ghi khi run được tạo | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |\n| 9 | Candidate (former Gate A; Added in candidate: `evolve` removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | former derivation on `evolve`; no current CLI entry |\n| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem \"Cổng duyệt PR nội bộ\" và \"Iron Law\" dưới, Business Rules RUL36 (former `evolve --submit` contract; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |\n| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (từ STR91: luật `domain: 'coding'` khớp TRƯỚC wildcard — domain vắng mặt hay không nhận diện được đều fold về `coding` giống mọi nơi khác trong hệ, không phải một fallback riêng — trỏ `worker-prompt-skill-pointer.txt`; mọi domain đã đăng ký khác `coding` (vd `synthetic`) vẫn rơi về wildcard, trỏ `worker-prompt-default.txt` như trước STR91) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) · template `worker-prompt-skill-pointer.txt` giữ đủ 6 mục cố định sẵn có, CHỈ thêm đúng một mục `# Agent skill` trỏ `SKILL.md` của domain đó — đường dẫn luôn resolve qua sổ đăng ký domain→skill (`skillForStage`, spec Work-State \"Mô hình domain\"), không bao giờ hardcode (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`)) | yes (một template mặc định luôn có) | `worker-prompt-default.txt`, `worker-prompt-skill-pointer.txt` |",
    "text": "## Data Dictionary",
    "ancestry": [
      "Added in candidate: Runner Data Dictionary"
    ],
    "path": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/49/facts",
    "sha256": "f2411114df68a6f9847c8b4f379bbd22746214aaad4fd2319e735b39d044984b"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-51

```json
{
  "entryId": "rationale-51",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json",
  "collection": "claims",
  "claimId": "claim_224b5f54d28b453f1e3feaced0468399",
  "before": {
    "claimId": "claim_224b5f54d28b453f1e3feaced0468399",
    "sourceUnitDigest": "52a283ef3e1356d53fc5ae6efb44c1c8c687858b70009ef970c11e151b896b6d",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/runner.md:548-548#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve (current lines); unit SHA256 52a283ef3e1356d53fc5ae6efb44c1c8c687858b70009ef970c11e151b896b6d.\nTarget: docs/platform/runner/operations/h-51f5cd7279fd.md:454-454#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve (current lines); unit SHA256 445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 48228ecbc2881bfaccdcf13a294876cf74c3afe8670c137132403a9a037999b2 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" → \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\".\nWhole direct section differs; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" → \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\"; 0 distinct link spelling/label changes; 4 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Labelled successor correction changes the following exact source lines (retained in the bound legacy source): [\"Bước vào của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\",\"fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\",\"- **Runs when:** người vận hành gọi `fgos evolve` (liệt kê), `fgos evolve\",\"    - `fgos evolve` — xếp hạng MỖI id còn friction chưa ngã-ngũ\",\" (`src/evolve/candidates.mjs`'s `rankCandidates`, tái dùng cơ học\",\"      `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` của\",\"      `entropy.mjs`, không tự định nghĩa lại \\\"chưa ngã-ngũ\\\" hay trọng số\",\"      riêng) rồi in TOÀN BỘ danh sách — mỗi dòng mang đủ id/score/\",\"      disposition/errorClass/layer/attempts/detail, không cắt bớt (cùng kỷ\",\"      luật \\\"mọi trường người cần để phán\\\" như phần friction của `check`).\",\"      Không friction chưa ngã-ngũ nào → một thông điệp trạng-thái-rỗng rõ\",\"      ràng, exit 0 — chưa khởi tạo `.fgos/` nếu nó chưa tồn tại, giữ đúng hợp\",\"      đồng đọc-thuần của `ready`/`list`.\"]. Candidate additions/corrections are explicitly labelled in the direct section: [\"Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \\\"unknown verb\\\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\",\"Bước vào trước đây của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\",\"Theo hợp đồng cũ, fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\",\"- **Runs when:** CLI hiện hành không có `fgos evolve`; phần còn lại của mục này lưu hợp đồng Gate A trước khi module ranking bị xoá, không mô tả hành vi hiện hành. Theo hợp đồng cũ, người vận hành gọi `fgos evolve` (liệt kê), `fgos evolve\",\"    - CLI hiện hành không có verb `fgos evolve`; module `src/evolve/candidates.mjs` đã bị xoá và không có hàm `rankCandidates` đang chạy.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/runner/operations/h-51f5cd7279fd.md#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve, docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-26. Existing correction labels A41, L10-24 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json; exact section delta: removed [\"Bước vào của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\",\"fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\",\"- **Runs when:** người vận hành gọi `fgos evolve` (liệt kê), `fgos evolve\",\"    - `fgos evolve` — xếp hạng MỖI id còn friction chưa ngã-ngũ\",\" (`src/evolve/candidates.mjs`'s `rankCandidates`, tái dùng cơ học\",\"      `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` của\",\"      `entropy.mjs`, không tự định nghĩa lại \\\"chưa ngã-ngũ\\\" hay trọng số\",\"      riêng) rồi in TOÀN BỘ danh sách — mỗi dòng mang đủ id/score/\",\"      disposition/errorClass/layer/attempts/detail, không cắt bớt (cùng kỷ\",\"      luật \\\"mọi trường người cần để phán\\\" như phần friction của `check`).\",\"      Không friction chưa ngã-ngũ nào → một thông điệp trạng-thái-rỗng rõ\",\"      ràng, exit 0 — chưa khởi tạo `.fgos/` nếu nó chưa tồn tại, giữ đúng hợp\",\"      đồng đọc-thuần của `ready`/`list`.\"]; added [\"Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \\\"unknown verb\\\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\",\"Bước vào trước đây của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\",\"Theo hợp đồng cũ, fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\",\"- **Runs when:** CLI hiện hành không có `fgos evolve`; phần còn lại của mục này lưu hợp đồng Gate A trước khi module ranking bị xoá, không mô tả hành vi hiện hành. Theo hợp đồng cũ, người vận hành gọi `fgos evolve` (liệt kê), `fgos evolve\",\"    - CLI hiện hành không có verb `fgos evolve`; module `src/evolve/candidates.mjs` đã bị xoá và không có hàm `rankCandidates` đang chạy.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections:\nA41 F-C: evolve/ranking is absent: \"    - `fgos evolve` — xếp hạng MỖI id còn friction chưa ngã-ngũ\\n (`src/evolve/candidates.mjs`'s `rankCandidates`, tái dùng cơ học\\n      `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` của\\n      `entropy.mjs`, không tự định nghĩa lại \\\"chưa ngã-ngũ\\\" hay trọng số\\n      riêng) rồi in TOÀN BỘ danh sách — mỗi dòng mang đủ id/score/\\n      disposition/errorClass/layer/attempts/detail, không cắt bớt (cùng kỷ\\n      luật \\\"mọi trường người cần để phán\\\" như phần friction của `check`).\\n      Không friction chưa ngã-ngũ nào → một thông điệp trạng-thái-rỗng rõ\\n      ràng, exit 0 — chưa khởi tạo `.fgos/` nếu nó chưa tồn tại, giữ đúng hợp\\n      đồng đọc-thuần của `ready`/`list`.\" → \"    - CLI hiện hành không có verb `fgos evolve`; module `src/evolve/candidates.mjs` đã bị xoá và không có hàm `rankCandidates` đang chạy.\"; evidence step9-truth-corrections.json; bin/fgos.mjs:4373-4380 (evidence commit 24be6cb1d); bin/fgos.mjs:4640-4643 (evidence commit 24be6cb1d).\nA41 F-C: scope the old Gate A contract explicitly; unavailable verb is not described as current: \"- **Runs when:** người vận hành gọi `fgos evolve`\" → \"- **Runs when:** CLI hiện hành không có `fgos evolve`; phần còn lại của mục này lưu hợp đồng Gate A trước khi module ranking bị xoá, không mô tả hành vi hiện hành. Theo hợp đồng cũ, người vận hành gọi `fgos evolve`\"; evidence step9-truth-corrections.json; bin/fgos.mjs:4373-4380 (evidence commit 24be6cb1d); git show 120af6b3d -- src/evolve/candidates.mjs.\nA41 addition under Lead A42: scope remaining present-tense Gate A introduction to removed legacy evolve surface (composed with L10-24/citation-refuseHelp): \"Bước vào của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\\nfgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge.\" → \"Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \\\"unknown verb\\\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\\nBước vào trước đây của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\\nTheo hợp đồng cũ, fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge.\"; evidence step9-truth-corrections.json; bin/fgos.mjs:4373 (evidence commit 24be6cb1d); bin/fgos.mjs:4461 (evidence commit 24be6cb1d); 120af6b3d; single CLI evidence probe, env -u CLAUDE_CODE_SESSION_ID node bin/fgos.mjs evolve --help.\nL10-24/citation-refuseHelp [intermediate state; witness 19ca8de23]: \"bin/fgos.mjs:4373,4461\" → \"bin/fgos.mjs:4415,4503\"; evidence step10-round3-doc-edits.json; bin/fgos.mjs:4414-4417,4503 (evidence commit 5035fed52e60254ecbe034cc987553feb24616f4).\nDisposition supersede: Account for docs/specs/runner.md#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve under docs/platform/runner/operations/h-51f5cd7279fd.md#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve; source context \"Spec: Runner (vòng tự hành) / Behaviors & Operations\", target context \"Added in candidate: Runner Behaviors & Operations / Behaviors & Operations\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_224b5f54d28b453f1e3feaced0468399",
    "sourceUnitDigest": "52a283ef3e1356d53fc5ae6efb44c1c8c687858b70009ef970c11e151b896b6d",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/runner.md:548-548#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve (current lines); unit SHA256 52a283ef3e1356d53fc5ae6efb44c1c8c687858b70009ef970c11e151b896b6d.\nTarget: docs/platform/runner/operations/h-51f5cd7279fd.md:454-454#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve (current lines); unit SHA256 445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" → \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\".\nWhole direct section differs; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections:\nA41 F-C: evolve/ranking is absent: \"    - `fgos evolve` — xếp hạng MỖI id còn friction chưa ngã-ngũ\\n (`src/evolve/candidates.mjs`'s `rankCandidates`, tái dùng cơ học\\n      `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` của\\n      `entropy.mjs`, không tự định nghĩa lại \\\"chưa ngã-ngũ\\\" hay trọng số\\n      riêng) rồi in TOÀN BỘ danh sách — mỗi dòng mang đủ id/score/\\n      disposition/errorClass/layer/attempts/detail, không cắt bớt (cùng kỷ\\n      luật \\\"mọi trường người cần để phán\\\" như phần friction của `check`).\\n      Không friction chưa ngã-ngũ nào → một thông điệp trạng-thái-rỗng rõ\\n      ràng, exit 0 — chưa khởi tạo `.fgos/` nếu nó chưa tồn tại, giữ đúng hợp\\n      đồng đọc-thuần của `ready`/`list`.\" → \"    - CLI hiện hành không có verb `fgos evolve`; module `src/evolve/candidates.mjs` đã bị xoá và không có hàm `rankCandidates` đang chạy.\"; evidence step9-truth-corrections.json; bin/fgos.mjs:4373-4380 (evidence commit 24be6cb1d); bin/fgos.mjs:4640-4643 (evidence commit 24be6cb1d).\nA41 F-C: scope the old Gate A contract explicitly; unavailable verb is not described as current: \"- **Runs when:** người vận hành gọi `fgos evolve`\" → \"- **Runs when:** CLI hiện hành không có `fgos evolve`; phần còn lại của mục này lưu hợp đồng Gate A trước khi module ranking bị xoá, không mô tả hành vi hiện hành. Theo hợp đồng cũ, người vận hành gọi `fgos evolve`\"; evidence step9-truth-corrections.json; bin/fgos.mjs:4373-4380 (evidence commit 24be6cb1d); git show 120af6b3d -- src/evolve/candidates.mjs.\nA41 addition under Lead A42: scope remaining present-tense Gate A introduction to removed legacy evolve surface (composed with L10-24/citation-refuseHelp): \"Bước vào của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\\nfgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge.\" → \"Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \\\"unknown verb\\\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\\nBước vào trước đây của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\\nTheo hợp đồng cũ, fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge.\"; evidence step9-truth-corrections.json; bin/fgos.mjs:4373 (evidence commit 24be6cb1d); bin/fgos.mjs:4461 (evidence commit 24be6cb1d); 120af6b3d; single CLI evidence probe, env -u CLAUDE_CODE_SESSION_ID node bin/fgos.mjs evolve --help.\nL10-24/citation-refuseHelp [intermediate state; witness 19ca8de23]: \"bin/fgos.mjs:4373,4461\" → \"bin/fgos.mjs:4415,4503\"; evidence step10-round3-doc-edits.json; bin/fgos.mjs:4414-4417,4503 (evidence commit 5035fed52e60254ecbe034cc987553feb24616f4).\nDisposition supersede: Account for docs/specs/runner.md#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve under docs/platform/runner/operations/h-51f5cd7279fd.md#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve; source context \"Spec: Runner (vòng tự hành) / Behaviors & Operations\", target context \"Added in candidate: Runner Behaviors & Operations / Behaviors & Operations\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations"
    ]
  },
  "currentDecision": {
    "claimId": "claim_224b5f54d28b453f1e3feaced0468399",
    "sourceUnitDigest": "52a283ef3e1356d53fc5ae6efb44c1c8c687858b70009ef970c11e151b896b6d",
    "targetOwner": "docs/platform/runner/operations/h-51f5cd7279fd.md",
    "targetAnchor": "gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/runner.md:548-548#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve (current lines); unit SHA256 52a283ef3e1356d53fc5ae6efb44c1c8c687858b70009ef970c11e151b896b6d.\nTarget: docs/platform/runner/operations/h-51f5cd7279fd.md:454-454#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve (current lines); unit SHA256 445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" → \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\".\nWhole direct section differs; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections:\nA41 F-C: evolve/ranking is absent: \"    - `fgos evolve` — xếp hạng MỖI id còn friction chưa ngã-ngũ\\n (`src/evolve/candidates.mjs`'s `rankCandidates`, tái dùng cơ học\\n      `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` của\\n      `entropy.mjs`, không tự định nghĩa lại \\\"chưa ngã-ngũ\\\" hay trọng số\\n      riêng) rồi in TOÀN BỘ danh sách — mỗi dòng mang đủ id/score/\\n      disposition/errorClass/layer/attempts/detail, không cắt bớt (cùng kỷ\\n      luật \\\"mọi trường người cần để phán\\\" như phần friction của `check`).\\n      Không friction chưa ngã-ngũ nào → một thông điệp trạng-thái-rỗng rõ\\n      ràng, exit 0 — chưa khởi tạo `.fgos/` nếu nó chưa tồn tại, giữ đúng hợp\\n      đồng đọc-thuần của `ready`/`list`.\" → \"    - CLI hiện hành không có verb `fgos evolve`; module `src/evolve/candidates.mjs` đã bị xoá và không có hàm `rankCandidates` đang chạy.\"; evidence step9-truth-corrections.json; bin/fgos.mjs:4373-4380 (evidence commit 24be6cb1d); bin/fgos.mjs:4640-4643 (evidence commit 24be6cb1d).\nA41 F-C: scope the old Gate A contract explicitly; unavailable verb is not described as current: \"- **Runs when:** người vận hành gọi `fgos evolve`\" → \"- **Runs when:** CLI hiện hành không có `fgos evolve`; phần còn lại của mục này lưu hợp đồng Gate A trước khi module ranking bị xoá, không mô tả hành vi hiện hành. Theo hợp đồng cũ, người vận hành gọi `fgos evolve`\"; evidence step9-truth-corrections.json; bin/fgos.mjs:4373-4380 (evidence commit 24be6cb1d); git show 120af6b3d -- src/evolve/candidates.mjs.\nA41 addition under Lead A42: scope remaining present-tense Gate A introduction to removed legacy evolve surface (composed with L10-24/citation-refuseHelp): \"Bước vào của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\\nfgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge.\" → \"Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \\\"unknown verb\\\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\\nBước vào trước đây của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\\nTheo hợp đồng cũ, fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge.\"; evidence step9-truth-corrections.json; bin/fgos.mjs:4373 (evidence commit 24be6cb1d); bin/fgos.mjs:4461 (evidence commit 24be6cb1d); 120af6b3d; single CLI evidence probe, env -u CLAUDE_CODE_SESSION_ID node bin/fgos.mjs evolve --help.\nL10-24/citation-refuseHelp [intermediate state; witness 19ca8de23]: \"bin/fgos.mjs:4373,4461\" → \"bin/fgos.mjs:4415,4503\"; evidence step10-round3-doc-edits.json; bin/fgos.mjs:4414-4417,4503 (evidence commit 5035fed52e60254ecbe034cc987553feb24616f4).\nDisposition supersede: Account for docs/specs/runner.md#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve under docs/platform/runner/operations/h-51f5cd7279fd.md#gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve; source context \"Spec: Runner (vòng tự hành) / Behaviors & Operations\", target context \"Added in candidate: Runner Behaviors & Operations / Behaviors & Operations\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab",
    "targetAncestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)",
    "anchor": "gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve",
    "githubAnchor": "gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve",
    "stableAnchor": "h-59eb618ecbe9",
    "startLine": 548,
    "endLine": 548,
    "textDigest": "52a283ef3e1356d53fc5ae6efb44c1c8c687858b70009ef970c11e151b896b6d",
    "sample": "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)",
    "sectionPayloadDigest": "dd58adb76fae55b69ea6dc49c9743620e6b6fe8be0eae95c478984d11898307f",
    "followingBlockDigest": "c7182f609c029616bc8c23ef95b7fb69ade8fc943ebf7aba8f339003c4437459",
    "identityFingerprint": "658f6029f4da8c4d862113cfac3432782b0067e44c01f27469047ebf6e3fa1b4",
    "sectionText": "### Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\n\nBước vào của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\nfgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge.\n\n- **Runs when:** người vận hành gọi `fgos evolve` (liệt kê), `fgos evolve\n  --pick <id>` (xem chi tiết một candidate), hoặc `fgos evolve --submit <id>`\n (bắc cầu candidate sang một việc thật) — không có input tương tác nào\n khác, không vòng lặp chờ trả lời (hai bước, không stdin).\n- **Blocked when:** `--pick <id>`/`--submit <id>` không khớp candidate nào\n đang mở — `validation`, thông điệp rõ ràng, KHÔNG BAO GIỜ hỏi lại (\n  \"input sai là lỗi sạch, không re-prompt\"), không việc nào được tạo ra cho\n  `--submit` khi không khớp; `--pick`/`--submit` mang cờ trần (không giá trị)\n  cũng bị từ chối cùng khuôn `validation` như mọi verb khác dùng\n  `requireField`.\n- **What changes:**\n  - `fgos evolve` (không `--pick`/`--submit`) và `fgos evolve --pick <id>` —\n ĐỌC-THUẦN TUYỆT ĐỐI, cùng request-class với `ready`/`list`/`check`:\n    đọc view qua `listWork(dir)` DUY NHẤT, không bao giờ\n    `rebuild`/`refreshView`/`initStore` (những cửa GHI view/log).\n    - `fgos evolve` — xếp hạng MỖI id còn friction chưa ngã-ngũ\n (`src/evolve/candidates.mjs`'s `rankCandidates`, tái dùng cơ học\n      `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` của\n      `entropy.mjs`, không tự định nghĩa lại \"chưa ngã-ngũ\" hay trọng số\n      riêng) rồi in TOÀN BỘ danh sách — mỗi dòng mang đủ id/score/\n      disposition/errorClass/layer/attempts/detail, không cắt bớt (cùng kỷ\n      luật \"mọi trường người cần để phán\" như phần friction của `check`).\n      Không friction chưa ngã-ngũ nào → một thông điệp trạng-thái-rỗng rõ\n      ràng, exit 0 — chưa khởi tạo `.fgos/` nếu nó chưa tồn tại, giữ đúng hợp\n      đồng đọc-thuần của `ready`/`list`.\n    - `fgos evolve --pick <id>` — xếp hạng lại CÙNG một view rồi tìm `id`\n      trong danh sách; khớp → in bản ghi friction đầy đủ của candidate đó,\n      TÁI DÙNG đúng formatter friction sẵn có của `check` (không viết\n      formatter mới); không khớp → lỗi `validation` sạch, không đổi trạng\n      thái. Chạy `fgos evolve` không mang `--pick`/`--submit` CHÍNH LÀ kết\n cục \"dừng\" của Gate A — không có input hủy/dừng riêng nào khác\n      cần xử lý.\n - `fgos evolve --submit <id>` (self-improve loop STR13 Slice 3) — HÀNH\n    ĐỘNG GHI DUY NHẤT của cả bề mặt evolve: xếp hạng lại CÙNG một view, tìm\n    `id`; khớp → soạn một mô tả người-đọc-được từ các trường của candidate\n    (id/disposition/errorClass/layer/attempts/detail — trường vắng mặt được\n    bỏ qua, không bao giờ in literal \"undefined\") rồi tạo đúng MỘT việc thật\n    qua CÙNG cửa `submitWork` mà `fgos submit` tự dùng (không logic tạo-việc\n    thứ hai) — `status: todo`, stage vào-vòng theo domain (stage đầu tiên\n    domain đó khai; với `coding` là `discovery`), `tier`/`risk` dẫn xuất\n    mechanically từ chính mô tả đó qua\n    `classify()` giống hệt một `submit` bình thường. `evolve --submit` không\n    mang cờ `--async`/`--unattended`/`--domain` riêng của nó (bề mặt cờ tối\n    thiểu, YAGNI) — luôn gọi `submitWork` với mặc định. Việc mới tạo ra đi\n    đúng vòng đời runner thường (quét nghiên-cứu → quét chia-việc → dispatch →\n    `awaiting-approval`) như mọi việc khác — Gate A không có cơ chế dispatch/wiring\n    riêng nào cho việc bắc cầu này.\n- **Side effects:** `evolve`/`evolve --pick` — không có: không sự kiện nào\n  vào nhật ký, không dòng nào vào `state.json`, không tiến trình con git nào.\n  `evolve --submit` — đúng MỘT sự kiện `work.add` mới (qua `submitWork`), y\n  hệt một `fgos submit` bình thường; không tiến trình con git nào (việc mới\n  chưa dispatch, chưa có nhánh).\n- **Afterwards:** `evolve`/`evolve --pick` — người vận hành thấy đúng\n  candidate mình cần để quyết định có bắc cầu hay không; không candidate nào\n  bị chọn tự động, không việc nào được tạo ra chỉ vì `evolve` chạy.\n  `evolve --submit` — việc mới nằm trong hàng chờ runner thường, sẵn sàng cho\n  quét làm-rõ/chia-việc/dispatch như mọi việc khác; khi đề xuất của nó tới\n  `awaiting-approval`, nó đi qua đúng cổng duyệt PR nội bộ ở trên — nếu diff của nó\n  chạm cờ/module Iron Law (xem dưới), `approve` từ chối cho tới khi người\n  vận hành xác nhận bằng `--acknowledge-iron-law`.\n  **Tương tác đã biết (chứng minh bằng e2e thật, STR13 Slice 3):** vì Iron\n  Law's phép thử từ khóa TÁI DÙNG đúng `HEAVY_KEYWORDS` mà `classify()` cũng\n dùng, một mô tả candidate chứa từ khóa rủi ro nặng — điều kiện tự\n  nhiên để một fix thật sự cần Iron Law — cũng khiến chính việc mới đó nhận\n  `risk: 'heavy'` ngay lúc `submitWork` chạy. Root mang `risk: 'heavy'` đi\n  đúng nhánh \"cần người quyết\" của quét chia-việc (xem \"Edge Cases Settled\"\n  dưới, mục risk `heavy`) — đậu `awaiting-human` TRƯỚC KHI kịp dispatch, dù\n  không phải vì thiếu rõ. Đây không phải bug — người vận hành cần một bước\n  thao tác thường (vd `fgos edit <id> --risk standard`, verb công khai đã có\n  từ work-item-verb-surface) giữa `evolve --submit` và khi item tới dispatch,\n  nếu muốn bỏ qua cửa chia-việc cho trường hợp này; `description` giữ\n  nguyên nên Iron Law's phép thử từ khóa tại `approve` vẫn chạy đúng như\n  thiết kế bất kể `risk` bị đổi sau đó.",
    "text": "### Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Behaviors & Operations"
    ],
    "path": "docs/specs/runner.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)",
    "anchor": "gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve",
    "githubAnchor": "gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve",
    "stableAnchor": "h-011429750b1b",
    "startLine": 454,
    "endLine": 454,
    "textDigest": "445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab",
    "sample": "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)",
    "sectionPayloadDigest": "20dbb6b5589f0258d385edac0f92124f744bccc123ebc05d99c4de7b09685ad3",
    "followingBlockDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
    "identityFingerprint": "8d5193901ef1ad1984956710149f8d163fcd6a28dc768fe57f0e4b4bb57a24f3",
    "sectionText": "### Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\n\nAdded in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\nBước vào trước đây của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\nTheo hợp đồng cũ, fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\nmột danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\nbắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\n`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\nphải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,\nkhông bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép\nkín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)\n→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →\nrunner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt\nPR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge.\n\n- **Runs when:** CLI hiện hành không có `fgos evolve`; phần còn lại của mục này lưu hợp đồng Gate A trước khi module ranking bị xoá, không mô tả hành vi hiện hành. Theo hợp đồng cũ, người vận hành gọi `fgos evolve` (liệt kê), `fgos evolve\n  --pick <id>` (xem chi tiết một candidate), hoặc `fgos evolve --submit <id>`\n (bắc cầu candidate sang một việc thật) — không có input tương tác nào\n khác, không vòng lặp chờ trả lời (hai bước, không stdin).\n- **Blocked when:** `--pick <id>`/`--submit <id>` không khớp candidate nào\n đang mở — `validation`, thông điệp rõ ràng, KHÔNG BAO GIỜ hỏi lại (\n  \"input sai là lỗi sạch, không re-prompt\"), không việc nào được tạo ra cho\n  `--submit` khi không khớp; `--pick`/`--submit` mang cờ trần (không giá trị)\n  cũng bị từ chối cùng khuôn `validation` như mọi verb khác dùng\n  `requireField`.\n- **What changes:**\n  - `fgos evolve` (không `--pick`/`--submit`) và `fgos evolve --pick <id>` —\n ĐỌC-THUẦN TUYỆT ĐỐI, cùng request-class với `ready`/`list`/`check`:\n    đọc view qua `listWork(dir)` DUY NHẤT, không bao giờ\n    `rebuild`/`refreshView`/`initStore` (những cửa GHI view/log).\n    - CLI hiện hành không có verb `fgos evolve`; module `src/evolve/candidates.mjs` đã bị xoá và không có hàm `rankCandidates` đang chạy.\n    - `fgos evolve --pick <id>` — xếp hạng lại CÙNG một view rồi tìm `id`\n      trong danh sách; khớp → in bản ghi friction đầy đủ của candidate đó,\n      TÁI DÙNG đúng formatter friction sẵn có của `check` (không viết\n      formatter mới); không khớp → lỗi `validation` sạch, không đổi trạng\n      thái. Chạy `fgos evolve` không mang `--pick`/`--submit` CHÍNH LÀ kết\n cục \"dừng\" của Gate A — không có input hủy/dừng riêng nào khác\n      cần xử lý.\n - `fgos evolve --submit <id>` (self-improve loop STR13 Slice 3) — HÀNH\n    ĐỘNG GHI DUY NHẤT của cả bề mặt evolve: xếp hạng lại CÙNG một view, tìm\n    `id`; khớp → soạn một mô tả người-đọc-được từ các trường của candidate\n    (id/disposition/errorClass/layer/attempts/detail — trường vắng mặt được\n    bỏ qua, không bao giờ in literal \"undefined\") rồi tạo đúng MỘT việc thật\n    qua CÙNG cửa `submitWork` mà `fgos submit` tự dùng (không logic tạo-việc\n    thứ hai) — `status: todo`, stage vào-vòng theo domain (stage đầu tiên\n    domain đó khai; với `coding` là `discovery`), `tier`/`risk` dẫn xuất\n    mechanically từ chính mô tả đó qua\n    `classify()` giống hệt một `submit` bình thường. `evolve --submit` không\n    mang cờ `--async`/`--unattended`/`--domain` riêng của nó (bề mặt cờ tối\n    thiểu, YAGNI) — luôn gọi `submitWork` với mặc định. Việc mới tạo ra đi\n    đúng vòng đời runner thường (quét nghiên-cứu → quét chia-việc → dispatch →\n    `awaiting-approval`) như mọi việc khác — Gate A không có cơ chế dispatch/wiring\n    riêng nào cho việc bắc cầu này.\n- **Side effects:** `evolve`/`evolve --pick` — không có: không sự kiện nào\n  vào nhật ký, không dòng nào vào `state.json`, không tiến trình con git nào.\n  `evolve --submit` — đúng MỘT sự kiện `work.add` mới (qua `submitWork`), y\n  hệt một `fgos submit` bình thường; không tiến trình con git nào (việc mới\n  chưa dispatch, chưa có nhánh).\n- **Afterwards:** `evolve`/`evolve --pick` — người vận hành thấy đúng\n  candidate mình cần để quyết định có bắc cầu hay không; không candidate nào\n  bị chọn tự động, không việc nào được tạo ra chỉ vì `evolve` chạy.\n  `evolve --submit` — việc mới nằm trong hàng chờ runner thường, sẵn sàng cho\n  quét làm-rõ/chia-việc/dispatch như mọi việc khác; khi đề xuất của nó tới\n  `awaiting-approval`, nó đi qua đúng cổng duyệt PR nội bộ ở trên — nếu diff của nó\n  chạm cờ/module Iron Law (xem dưới), `approve` từ chối cho tới khi người\n  vận hành xác nhận bằng `--acknowledge-iron-law`.\n  **Tương tác đã biết (chứng minh bằng e2e thật, STR13 Slice 3):** vì Iron\n  Law's phép thử từ khóa TÁI DÙNG đúng `HEAVY_KEYWORDS` mà `classify()` cũng\n dùng, một mô tả candidate chứa từ khóa rủi ro nặng — điều kiện tự\n  nhiên để một fix thật sự cần Iron Law — cũng khiến chính việc mới đó nhận\n  `risk: 'heavy'` ngay lúc `submitWork` chạy. Root mang `risk: 'heavy'` đi\n  đúng nhánh \"cần người quyết\" của quét chia-việc (xem \"Edge Cases Settled\"\n  dưới, mục risk `heavy`) — đậu `awaiting-human` TRƯỚC KHI kịp dispatch, dù\n  không phải vì thiếu rõ. Đây không phải bug — người vận hành cần một bước\n  thao tác thường (vd `fgos edit <id> --risk standard`, verb công khai đã có\n  từ work-item-verb-surface) giữa `evolve --submit` và khi item tới dispatch,\n  nếu muốn bỏ qua cửa chia-việc cho trường hợp này; `description` giữ\n  nguyên nên Iron Law's phép thử từ khóa tại `approve` vẫn chạy đúng như\n  thiết kế bất kể `risk` bị đổi sau đó.",
    "text": "### Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)",
    "ancestry": [
      "Added in candidate: Runner Behaviors & Operations",
      "Behaviors & Operations"
    ],
    "path": "docs/platform/runner/operations/h-51f5cd7279fd.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/50/facts",
    "sha256": "5348325741dd66a3af24c3d9c072aae5bee84d5ea98afb514bd2b7f792262044"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-52

```json
{
  "entryId": "rationale-52",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json",
  "collection": "claims",
  "claimId": "claim_0686418ae7571d82eade8059c698709d",
  "before": {
    "claimId": "claim_0686418ae7571d82eade8059c698709d",
    "sourceUnitDigest": "3f682e32dc04d19e654abc927f8a3570f8ed866f17711e4ff18302e2840461e7",
    "targetOwner": "docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md",
    "targetAnchor": "actors-access",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/runner.md:950-950#actors-access (current lines); unit SHA256 3f682e32dc04d19e654abc927f8a3570f8ed866f17711e4ff18302e2840461e7.\nTarget: docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md:25-25#actors-access (current lines); unit SHA256 704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Actors & Access\" → \"Actors & Access\".\nWhole direct section differs; depth 2 → 2; 0 distinct link changes; normalized line order differs; 1 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"Actors & Access\" → \"Actors & Access\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Labelled successor correction changes the following exact source lines (retained in the bound legacy source): [\"| Xếp hạng/xem candidate tự cải thiện (Gate A, `evolve`) | ✓ | — | — |\"]. Candidate additions/corrections are explicitly labelled in the direct section: [\"| Xếp hạng/xem candidate tự cải thiện (Gate A, former `evolve`; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Historical operator role | — | — |\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md#actors-access. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json; exact section delta: removed [\"| Xếp hạng/xem candidate tự cải thiện (Gate A, `evolve`) | ✓ | — | — |\"]; added [\"| Xếp hạng/xem candidate tự cải thiện (Gate A, former `evolve`; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Historical operator role | — | — |\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#actors-access under docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md#actors-access; source context \"Spec: Runner (vòng tự hành)\", target context \"Added in candidate: Runner Actors & Access\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42",
    "targetAncestry": [
      "Added in candidate: Runner Actors & Access"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_0686418ae7571d82eade8059c698709d",
    "sourceUnitDigest": "3f682e32dc04d19e654abc927f8a3570f8ed866f17711e4ff18302e2840461e7",
    "targetOwner": "docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md",
    "targetAnchor": "actors-access",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/runner.md:950-950#actors-access (current lines); unit SHA256 3f682e32dc04d19e654abc927f8a3570f8ed866f17711e4ff18302e2840461e7.\nTarget: docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md:25-25#actors-access (current lines); unit SHA256 704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Actors & Access\" → \"Actors & Access\".\nWhole direct section differs; depth 2 → 2; 0 distinct link changes; normalized line order differs; 1 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (split-or-corrected-section): Removed direct-section lines have distinct live carrier witnesses docs/platform/runner/spec.md#historical-source-section-0686418a, docs/platform/runner/spec.md#unheaded-block-9. Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed [\"| Xếp hạng/xem candidate tự cải thiện (Gate A, `evolve`) | ✓ | — | — |\"]; added [\"| Xếp hạng/xem candidate tự cải thiện (Gate A, former `evolve`; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Historical operator role | — | — |\"].\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#actors-access under docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md#actors-access; source context \"Spec: Runner (vòng tự hành)\", target context \"Added in candidate: Runner Actors & Access\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42",
    "targetAncestry": [
      "Added in candidate: Runner Actors & Access"
    ]
  },
  "currentDecision": {
    "claimId": "claim_0686418ae7571d82eade8059c698709d",
    "sourceUnitDigest": "3f682e32dc04d19e654abc927f8a3570f8ed866f17711e4ff18302e2840461e7",
    "targetOwner": "docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md",
    "targetAnchor": "actors-access",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/runner.md:950-950#actors-access (current lines); unit SHA256 3f682e32dc04d19e654abc927f8a3570f8ed866f17711e4ff18302e2840461e7.\nTarget: docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md:25-25#actors-access (current lines); unit SHA256 704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"Actors & Access\" → \"Actors & Access\".\nWhole direct section differs; depth 2 → 2; 0 distinct link changes; normalized line order differs; 1 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (split-or-corrected-section): Removed direct-section lines have distinct live carrier witnesses docs/platform/runner/spec.md#historical-source-section-0686418a, docs/platform/runner/spec.md#unheaded-block-9. Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed [\"| Xếp hạng/xem candidate tự cải thiện (Gate A, `evolve`) | ✓ | — | — |\"]; added [\"| Xếp hạng/xem candidate tự cải thiện (Gate A, former `evolve`; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Historical operator role | — | — |\"].\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/runner.md#actors-access under docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md#actors-access; source context \"Spec: Runner (vòng tự hành)\", target context \"Added in candidate: Runner Actors & Access\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42",
    "targetAncestry": [
      "Added in candidate: Runner Actors & Access"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Actors & Access",
    "anchor": "actors-access",
    "githubAnchor": "actors-access",
    "stableAnchor": "h-eaf6406e4ceb",
    "startLine": 950,
    "endLine": 950,
    "textDigest": "3f682e32dc04d19e654abc927f8a3570f8ed866f17711e4ff18302e2840461e7",
    "sample": "Actors & Access",
    "sectionPayloadDigest": "81c2724820c499b40d0e4d2964c798263c2ad99a479582176a95ee13b7f4d24e",
    "followingBlockDigest": "81c2724820c499b40d0e4d2964c798263c2ad99a479582176a95ee13b7f4d24e",
    "identityFingerprint": "a0680db8ef16c4e5ca63c167e2d8ac92af767c88273b736924d8bf5f2d424838",
    "sectionText": "## Actors & Access\n\n| Capability | Người vận hành | Runner | Worker (trợ lý nền) |\n|---|---|---|---|\n| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |\n| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |\n| Commit trong worktree/nhánh riêng | — | — | ✓ |\n| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |\n| Đồng bộ lại một việc đỗ vì gãy nhập (`catchup`) | ✓ | — | — |\n| Xếp hạng/xem candidate tự cải thiện (Gate A, `evolve`) | ✓ | — | — |",
    "text": "## Actors & Access",
    "ancestry": [
      "Spec: Runner (vòng tự hành)"
    ],
    "path": "docs/specs/runner.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Actors & Access",
    "anchor": "actors-access",
    "githubAnchor": "actors-access",
    "stableAnchor": "h-cf58d496a2ac",
    "startLine": 25,
    "endLine": 25,
    "textDigest": "704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42",
    "sample": "Actors & Access",
    "sectionPayloadDigest": "6ee82017c754d1ebcfed7fcd146851cdd954235737f350c0dbd70a9629516110",
    "followingBlockDigest": "6ee82017c754d1ebcfed7fcd146851cdd954235737f350c0dbd70a9629516110",
    "identityFingerprint": "b9f06d6f1520ef1e792da40aa3ca96e0c47cc20bd80228d29ed7e64375c1fc5f",
    "sectionText": "## Actors & Access\n\n| Capability | Người vận hành | Runner | Worker (trợ lý nền) |\n|---|---|---|---|\n| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |\n| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |\n| Commit trong worktree/nhánh riêng | — | — | ✓ |\n| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |\n| Đồng bộ lại một việc đỗ vì gãy nhập (`catchup`) | ✓ | — | — |\n| Xếp hạng/xem candidate tự cải thiện (Gate A, former `evolve`; Added in candidate: door removed in `120af6b3d`, `bin/fgos.mjs:4415`) | Historical operator role | — | — |",
    "text": "## Actors & Access",
    "ancestry": [
      "Added in candidate: Runner Actors & Access"
    ],
    "path": "docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/51/facts",
    "sha256": "9f940ea0bb30b42ac487eb5a250f331b72a88f3c528766d422adceb6412d9a16"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```
