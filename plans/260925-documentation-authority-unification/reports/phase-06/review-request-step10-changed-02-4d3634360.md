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

Entries: 19

## rationale-16

```json
{
  "entryId": "rationale-16",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
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
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:93-93#related-documents (current lines); unit SHA256 ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:160-160#related-documents (current lines); unit SHA256 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 3: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"Related Documents\" → \"Related Documents\".\nWhole direct section differs; depth 2 → 4; 3 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"Related Documents\" → \"Related Documents\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-checkpoint.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#related-documents under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#related-documents; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_b1e44493c254c54dc18efa2088b0018a",
    "sourceUnitDigest": "ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "related-documents",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:93-93#related-documents (current lines); unit SHA256 ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:160-160#related-documents (current lines); unit SHA256 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 3: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"Related Documents\" → \"Related Documents\".\nWhole direct section differs; depth 2 → 4; 3 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#related-documents under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#related-documents; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  },
  "currentDecision": {
    "claimId": "claim_b1e44493c254c54dc18efa2088b0018a",
    "sourceUnitDigest": "ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "move",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "targetAnchor": "related-documents",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/legacy-cli-transition.md:93-93#related-documents (current lines); unit SHA256 ded8adca384e6ae2de3bd7fe2c03692191f0bf14248ca807ff434b43e2efeeab.\nTarget: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md:160-160#related-documents (current lines); unit SHA256 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"Host Invocation And Provider Routing\" (./host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../spec.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/platform/host-invocation-routing/spec.md.\nLink 2: \"External Provider Protocol\" (./external-provider-protocol.md) → \"External Provider Protocol\" (external-provider-protocol.md); resolved docs/architect/host-invocation-routing/external-provider-protocol.md → docs/platform/host-invocation-routing/architecture/external-provider-protocol.md.\nLink 3: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../../architect/packaging-distribution/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/architect/packaging-distribution/runtime-identity-and-activation.md.\nHeading depth: 2 → 4; title \"Related Documents\" → \"Related Documents\".\nWhole direct section differs; depth 2 → 4; 3 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/host-invocation-routing/legacy-cli-transition.md#related-documents under docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#related-documents; source context \"Legacy CLI Transition\", target context \"Architecture: Legacy CLI Transition / Retained selected source material / Legacy CLI Transition\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "954b3dcc8c61cac86072dbe20d9c6aa044d2ddc3387979c743c81bfd69ae9337",
    "targetAncestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
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
    "sectionText": "## Related Documents\n\n- [Host Invocation And Provider Routing](./host-invocation-provider-routing.md) — kernel contract this document depends on.\n- [External Provider Protocol](./external-provider-protocol.md)\n- [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md) — owns the legacy payload's actual on-disk location, `fgctl` rollback mechanics, and the `fgos init` / `fgos doctor --fix` / `fgos doctor` tail that supersedes deprecated legacy `fgos setup` onboarding behavior.",
    "text": "## Related Documents",
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
    "sectionText": "#### Related Documents\n\n- [Host Invocation And Provider Routing](../spec.md) — kernel contract this document depends on.\n- [External Provider Protocol](external-provider-protocol.md)\n- [Runtime Identity And Activation](../../../architect/packaging-distribution/runtime-identity-and-activation.md) — owns the legacy payload's actual on-disk location, `fgctl` rollback mechanics, and the `fgos init` / `fgos doctor --fix` / `fgos doctor` tail that supersedes deprecated legacy `fgos setup` onboarding behavior.",
    "text": "#### Related Documents",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/15/facts",
    "sha256": "40b1d749f74df5117ac9d1eb41840a4cdc11447f959669cbccfe79db296ed766"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-17

```json
{
  "entryId": "rationale-17",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
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
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_c072318ec582affe5e0e6936961fadc4",
    "sourceUnitDigest": "d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "9-repeat-by-component-boundary",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:303-303#9-repeat-by-component-boundary (current lines); unit SHA256 d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:340-340#9-repeat-by-component-boundary (current lines); unit SHA256 ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e at 287a22d33a0eaf2d9e47549a1142daf62361bb8c.\nLinks: source 1, target 1; 2 changed spellings/labels, 0 destination changes; 1 added, 1 removed.\nLink 1: \"fgOS Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"none\" (none); resolved docs/architect/component-boundary/component-boundary-advisory.md → none.\nLink 1: \"none\" (none) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"9. Repeat By Component Boundary\" → \"9. Repeat By Component Boundary\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 14 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (split-or-corrected-section): Removed direct-section lines have distinct live carrier witnesses docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#5-release-r1-distributable-rust-cli-host, docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-32, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure, docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-50, docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-51. Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed [\"For each subsequent component:\",\"1. Read\",\"   <link>\",\"   and name responsibility, semantic operations, authority, state, side\",\"   effects, component class, and physical placement.\",\"2. Select a complete operation/use-case boundary rather than private helpers.\",\"3. Capture current Node behavior as shared fixtures.\",\"4. Extract only the Node boundary needed for this migration slice.\",\"5. Implement the corresponding native Rust provider.\",\"6. Run both providers against the same semantic fixtures.\",\"7. Shadow only side-effect-free reads.\",\"8. Switch the operation from legacy to native after parity proof.\",\"9. Observe the rollback window.\",\"10. Remove the Node implementation in a later cleanup change.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"].\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope).",
    "targetUnitDigest": "ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  },
  "currentDecision": {
    "claimId": "claim_c072318ec582affe5e0e6936961fadc4",
    "sourceUnitDigest": "d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f",
    "claimKind": "contract",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "9-repeat-by-component-boundary",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:303-303#9-repeat-by-component-boundary (current lines); unit SHA256 d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:340-340#9-repeat-by-component-boundary (current lines); unit SHA256 ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e at 287a22d33a0eaf2d9e47549a1142daf62361bb8c.\nLinks: source 1, target 1; 2 changed spellings/labels, 0 destination changes; 1 added, 1 removed.\nLink 1: \"fgOS Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"none\" (none); resolved docs/architect/component-boundary/component-boundary-advisory.md → none.\nLink 1: \"none\" (none) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"9. Repeat By Component Boundary\" → \"9. Repeat By Component Boundary\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 14 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (split-or-corrected-section): Removed direct-section lines have distinct live carrier witnesses docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#5-release-r1-distributable-rust-cli-host, docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-32, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure, docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-50, docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-51. Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed [\"For each subsequent component:\",\"1. Read\",\"   <link>\",\"   and name responsibility, semantic operations, authority, state, side\",\"   effects, component class, and physical placement.\",\"2. Select a complete operation/use-case boundary rather than private helpers.\",\"3. Capture current Node behavior as shared fixtures.\",\"4. Extract only the Node boundary needed for this migration slice.\",\"5. Implement the corresponding native Rust provider.\",\"6. Run both providers against the same semantic fixtures.\",\"7. Shadow only side-effect-free reads.\",\"8. Switch the operation from legacy to native after parity proof.\",\"9. Observe the rollback window.\",\"10. Remove the Node implementation in a later cleanup change.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"].\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope).",
    "targetUnitDigest": "ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
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
    "sectionText": "## 9. Repeat By Component Boundary\n\nFor each subsequent component:\n\n1. Read\n   [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md)\n   and name responsibility, semantic operations, authority, state, side\n   effects, component class, and physical placement.\n2. Select a complete operation/use-case boundary rather than private helpers.\n3. Capture current Node behavior as shared fixtures.\n4. Extract only the Node boundary needed for this migration slice.\n5. Implement the corresponding native Rust provider.\n6. Run both providers against the same semantic fixtures.\n7. Shadow only side-effect-free reads.\n8. Switch the operation from legacy to native after parity proof.\n9. Observe the rollback window.\n10. Remove the Node implementation in a later cleanup change.\n\nNear-thin read-only operations come before complex write owners. File size alone\ndoes not choose order.\n\nA native provider never blocks waiting for a person. An operation that needs\nhuman input returns a `parked` outcome and is re-invoked by the work\nlifecycle, not by a provider-side wait. This must hold before any\n`ask`/`answer`-shaped operation migrates.",
    "text": "## 9. Repeat By Component Boundary",
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
    "sectionText": "#### 9. Repeat By Component Boundary\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).\n\n\n\nNear-thin read-only operations come before complex write owners. File size alone\ndoes not choose order.\n\nA native provider never blocks waiting for a person. An operation that needs\nhuman input returns a `parked` outcome and is re-invoked by the work\nlifecycle, not by a provider-side wait. This must hold before any\n`ask`/`answer`-shaped operation migrates.",
    "text": "#### 9. Repeat By Component Boundary",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/16/facts",
    "sha256": "b5378be6c608ade41906409fef493a914b65f1e79bdc53e0420458d094b6a98a"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-18

```json
{
  "entryId": "rationale-18",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
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
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_e960a05c0b656d0dae2cffd3daee5a0d",
    "sourceUnitDigest": "225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "10-migrate-read-models-before-writers",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:329-329#10-migrate-read-models-before-writers (current lines); unit SHA256 225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:355-355#10-migrate-read-models-before-writers (current lines); unit SHA256 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d at 287a22d33a0eaf2d9e47549a1142daf62361bb8c.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"10. Migrate Read Models Before Writers\" → \"10. Migrate Read Models Before Writers\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order differs; 8 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (split-or-corrected-section): Removed direct-section lines have distinct live carrier witnesses docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure, docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-52, docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-53. Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed [\"Sequence it internally:\",\"1. event/schema decode fixtures;\",\"2. deterministic replay fixtures;\",\"3. domain/stage projection fixtures;\",\"4. frontier calculation fixtures;\",\"5. effective claim overlay;\",\"6. CLI `ready` parity and pagination;\",\"7. remote semantic parity.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"].\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.).",
    "targetUnitDigest": "5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  },
  "currentDecision": {
    "claimId": "claim_e960a05c0b656d0dae2cffd3daee5a0d",
    "sourceUnitDigest": "225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "10-migrate-read-models-before-writers",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:329-329#10-migrate-read-models-before-writers (current lines); unit SHA256 225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:355-355#10-migrate-read-models-before-writers (current lines); unit SHA256 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d at 287a22d33a0eaf2d9e47549a1142daf62361bb8c.\nLinks: source 0, target 1; 1 changed spellings/labels, 0 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"the dropped-014 restoration\" (../contracts/component-protocol.md#restored-per-component-repeat-procedure); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure.\nHeading depth: 2 → 4; title \"10. Migrate Read Models Before Writers\" → \"10. Migrate Read Models Before Writers\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order differs; 8 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (split-or-corrected-section): Removed direct-section lines have distinct live carrier witnesses docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure, docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-52, docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-53. Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed [\"Sequence it internally:\",\"1. event/schema decode fixtures;\",\"2. deterministic replay fixtures;\",\"3. domain/stage projection fixtures;\",\"4. frontier calculation fixtures;\",\"5. effective claim overlay;\",\"6. CLI `ready` parity and pagination;\",\"7. remote semantic parity.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"].\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.).",
    "targetUnitDigest": "5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
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
    "sectionText": "## 10. Migrate Read Models Before Writers\n\nThe next meaningful proof after the small operations should be a Work Lifecycle\nread-side component, potentially the dependencies needed by `ready`.\n\nSequence it internally:\n\n1. event/schema decode fixtures;\n2. deterministic replay fixtures;\n3. domain/stage projection fixtures;\n4. frontier calculation fixtures;\n5. effective claim overlay;\n6. CLI `ready` parity and pagination;\n7. remote semantic parity.\n\nThis creates reusable Rust read models before any event writer moves.",
    "text": "## 10. Migrate Read Models Before Writers",
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
    "sectionText": "#### 10. Migrate Read Models Before Writers\n\nThe next meaningful proof after the small operations should be a Work Lifecycle\nread-side component, potentially the dependencies needed by `ready`.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).\n\n\n\nThis creates reusable Rust read models before any event writer moves.",
    "text": "#### 10. Migrate Read Models Before Writers",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/17/facts",
    "sha256": "3e890044bd44450dd22780df1cf7502e463d28c7b82719be5cd119f9268091e8"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-19

```json
{
  "entryId": "rationale-19",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
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
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_ac2177776d1a367f2d8e81699b04fc63",
    "sourceUnitDigest": "30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "13-rollback-rules",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:377-377#13-rollback-rules (current lines); unit SHA256 30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:398-398#13-rollback-rules (current lines); unit SHA256 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 2: \"none\" (none) → \"the dropped-015 restoration\" (../contracts/component-protocol.md#restored-rollback-bullets); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets.\nHeading depth: 2 → 4; title \"13. Rollback Rules\" → \"13. Rollback Rules\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 7 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (split-or-corrected-section): Removed direct-section lines have distinct live carrier witnesses docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets, docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-57. Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed [\"- Keep legacy and native implementations side by side only for the observation\",\"  window of their operation.\",\"- Never delete a Node writer before proving it can read/recover state last\",\"  written by the Rust implementation, or explicitly declaring the cutover\",\"  irreversible with migration evidence.\",\"- Remove rollback code per component after its window; do not accumulate a\",\"  permanent second implementation tree.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"].\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef).",
    "targetUnitDigest": "8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  },
  "currentDecision": {
    "claimId": "claim_ac2177776d1a367f2d8e81699b04fc63",
    "sourceUnitDigest": "30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20",
    "claimKind": "architecture",
    "kind": "architecture",
    "disposition": "partial-carry",
    "targetOwner": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "targetAnchor": "13-rollback-rules",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md:377-377#13-rollback-rules (current lines); unit SHA256 30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20.\nTarget: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:398-398#13-rollback-rules (current lines); unit SHA256 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6 at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 1, target 2; 2 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"Runtime Identity And Activation\" (../packaging-distribution/runtime-identity-and-activation.md) → \"Runtime Identity And Activation\" (../../packaging-distribution/architecture/runtime-identity-and-activation.md); resolved docs/architect/packaging-distribution/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 2: \"none\" (none) → \"the dropped-015 restoration\" (../contracts/component-protocol.md#restored-rollback-bullets); resolved none → docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets.\nHeading depth: 2 → 4; title \"13. Rollback Rules\" → \"13. Rollback Rules\".\nWhole direct section differs; depth 2 → 4; 2 distinct link changes; normalized line order differs; 7 removed and 1 added nonblank lines after heading/link/correction normalization.\nSection accounting (split-or-corrected-section): Removed direct-section lines have distinct live carrier witnesses docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets, docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-57. Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed [\"- Keep legacy and native implementations side by side only for the observation\",\"  window of their operation.\",\"- Never delete a Node writer before proving it can read/recover state last\",\"  written by the Rust implementation, or explicitly declaring the cutover\",\"  irreversible with migration evidence.\",\"- Remove rollback code per component after its window; do not accumulate a\",\"  permanent second implementation tree.\"]; added [\"Added in candidate: this retained source detail is carried verbatim in <link>.\"].\nApplicable labelled corrections: none in this bound unit.\nDisposition partial-carry: Account for docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules under docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules; source context \"Node To Rust Component Migration\", target context \"Architecture: Node To Rust Migration / Retained selected source material / Node To Rust Component Migration\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy. Recorded residual: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef)..\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "remainder": "The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef).",
    "targetUnitDigest": "8d879f9c47c2ff7d5802b8a53b77ac6b4367b511681b018b81644f370b5abae6",
    "targetAncestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
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
    "sectionText": "## 13. Rollback Rules\n\nConfig can never replace a built-in provider (host doc open question 2 closed\nas \"prohibit\"). A provider binding is not a runtime-selectable switch, so\nrollback of a native operation in R1–R2 is a release rollback through `fgctl`:\n`ActivationRecord.previousArtifactDigest` + the preserved release directory +\na state-schema compatibility check (see\n[Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md)\n§11). The previous release still contains both the native provider and the\nNode payload during the operation's observation window, so a release rollback\nrestores the legacy path without restoring the old outer executable by hand.\n\n- Keep legacy and native implementations side by side only for the observation\n  window of their operation.\n- Never delete a Node writer before proving it can read/recover state last\n  written by the Rust implementation, or explicitly declaring the cutover\n  irreversible with migration evidence.\n- Remove rollback code per component after its window; do not accumulate a\n  permanent second implementation tree.",
    "text": "## 13. Rollback Rules",
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
    "sectionText": "#### 13. Rollback Rules\n\nConfig can never replace a built-in provider (host doc open question 2 closed\nas \"prohibit\"). A provider binding is not a runtime-selectable switch, so\nrollback of a native operation in R1–R2 is a release rollback through `fgctl`:\n`ActivationRecord.previousArtifactDigest` + the preserved release directory +\na state-schema compatibility check (see\n[Runtime Identity And Activation](../../packaging-distribution/architecture/runtime-identity-and-activation.md)\n§11). The previous release still contains both the native provider and the\nNode payload during the operation's observation window, so a release rollback\nrestores the legacy path without restoring the old outer executable by hand.\n\n\nAdded in candidate: this retained source detail is carried verbatim in [the dropped-015 restoration](../contracts/component-protocol.md#restored-rollback-bullets).",
    "text": "#### 13. Rollback Rules",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "Retained selected source material",
      "Node To Rust Component Migration"
    ],
    "path": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/18/facts",
    "sha256": "e845901dadab9e576fa3158c25384ab283e448209e930e32cf08cef6104ba69e"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-20

```json
{
  "entryId": "rationale-20",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
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
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/README.md:57-57#2-historical-supersession-table (current lines); unit SHA256 70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8.\nTarget: docs/platform/packaging-distribution/README.md:266-266#2-historical-supersession-table (current lines); unit SHA256 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 4, target 4; 4 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"Promoted Runtime Identity And Activation\" (../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) → \"Promoted Runtime Identity And Activation\" (architecture/runtime-identity-and-activation.md); resolved docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 3: \"Promoted Future Constraints\" (../../platform/packaging-distribution/architecture/future-constraints.md) → \"Promoted Future Constraints\" (architecture/future-constraints.md); resolved docs/platform/packaging-distribution/architecture/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nLink 4: \"Distribution Baseline And Scattered Spec Fragments\" (./history/distribution-baseline.md) → \"Distribution Baseline And Scattered Spec Fragments\" (../../architect/packaging-distribution/history/distribution-baseline.md); resolved docs/architect/packaging-distribution/history/distribution-baseline.md → docs/architect/packaging-distribution/history/distribution-baseline.md.\nHeading depth: 2 → 4; title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\".\nWhole direct section differs; depth 2 → 4; 4 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\"; 4 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/README.md#2-historical-supersession-table under docs/platform/packaging-distribution/README.md#2-historical-supersession-table; source context \"Packaging And Distribution Architecture\", target context \"Packaging-Distribution / Retained Readme Source Detail / Packaging And Distribution Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e",
    "targetAncestry": [
      "Packaging-Distribution",
      "Retained Readme Source Detail",
      "Packaging And Distribution Architecture"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_5766225be2d76d6239e116a664aec7cf",
    "sourceUnitDigest": "70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8",
    "targetOwner": "docs/platform/packaging-distribution/README.md",
    "targetAnchor": "2-historical-supersession-table",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/README.md:57-57#2-historical-supersession-table (current lines); unit SHA256 70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8.\nTarget: docs/platform/packaging-distribution/README.md:266-266#2-historical-supersession-table (current lines); unit SHA256 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 4, target 4; 4 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"Promoted Runtime Identity And Activation\" (../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) → \"Promoted Runtime Identity And Activation\" (architecture/runtime-identity-and-activation.md); resolved docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 3: \"Promoted Future Constraints\" (../../platform/packaging-distribution/architecture/future-constraints.md) → \"Promoted Future Constraints\" (architecture/future-constraints.md); resolved docs/platform/packaging-distribution/architecture/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nLink 4: \"Distribution Baseline And Scattered Spec Fragments\" (./history/distribution-baseline.md) → \"Distribution Baseline And Scattered Spec Fragments\" (../../architect/packaging-distribution/history/distribution-baseline.md); resolved docs/architect/packaging-distribution/history/distribution-baseline.md → docs/architect/packaging-distribution/history/distribution-baseline.md.\nHeading depth: 2 → 4; title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\".\nWhole direct section differs; depth 2 → 4; 4 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/README.md#2-historical-supersession-table under docs/platform/packaging-distribution/README.md#2-historical-supersession-table; source context \"Packaging And Distribution Architecture\", target context \"Packaging-Distribution / Retained Readme Source Detail / Packaging And Distribution Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e",
    "targetAncestry": [
      "Packaging-Distribution",
      "Retained Readme Source Detail",
      "Packaging And Distribution Architecture"
    ]
  },
  "currentDecision": {
    "claimId": "claim_5766225be2d76d6239e116a664aec7cf",
    "sourceUnitDigest": "70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8",
    "targetOwner": "docs/platform/packaging-distribution/README.md",
    "targetAnchor": "2-historical-supersession-table",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/README.md:57-57#2-historical-supersession-table (current lines); unit SHA256 70847eb505d007a2f2d5667bd66ecb218b1714f49112e48163ab449ad74f5dc8.\nTarget: docs/platform/packaging-distribution/README.md:266-266#2-historical-supersession-table (current lines); unit SHA256 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 4, target 4; 4 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"Promoted Runtime Identity And Activation\" (../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) → \"Promoted Runtime Identity And Activation\" (architecture/runtime-identity-and-activation.md); resolved docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md → docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md.\nLink 3: \"Promoted Future Constraints\" (../../platform/packaging-distribution/architecture/future-constraints.md) → \"Promoted Future Constraints\" (architecture/future-constraints.md); resolved docs/platform/packaging-distribution/architecture/future-constraints.md → docs/platform/packaging-distribution/architecture/future-constraints.md.\nLink 4: \"Distribution Baseline And Scattered Spec Fragments\" (./history/distribution-baseline.md) → \"Distribution Baseline And Scattered Spec Fragments\" (../../architect/packaging-distribution/history/distribution-baseline.md); resolved docs/architect/packaging-distribution/history/distribution-baseline.md → docs/architect/packaging-distribution/history/distribution-baseline.md.\nHeading depth: 2 → 4; title \"2. Historical Supersession Table\" → \"2. Historical Supersession Table\".\nWhole direct section differs; depth 2 → 4; 4 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/README.md#2-historical-supersession-table under docs/platform/packaging-distribution/README.md#2-historical-supersession-table; source context \"Packaging And Distribution Architecture\", target context \"Packaging-Distribution / Retained Readme Source Detail / Packaging And Distribution Architecture\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "7a121f1faaa77b183e3e2d5b187d1ae7a2d65980bfa7a3a4ead0088e25ef938e",
    "targetAncestry": [
      "Packaging-Distribution",
      "Retained Readme Source Detail",
      "Packaging And Distribution Architecture"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
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
    "sectionText": "## 2. Historical Supersession Table\n\n| Topic | Active source to follow | Status |\n|---|---|---|\n| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../workspace-topology.md) | Active architecture target. Supersedes any simpler \"one project root / one runtime root\" reading. Packaging must not own physical placement for config/event/coordination roots. |\n| Release identity and activation | [Promoted Runtime Identity And Activation](../../platform/packaging-distribution/architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |\n| Shared gateway/web | [Promoted Future Constraints](../../platform/packaging-distribution/architecture/future-constraints.md) | Future constraint only; not active delivery scope. |\n| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](./history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |\n| `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |",
    "text": "## 2. Historical Supersession Table",
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
    "sectionText": "#### 2. Historical Supersession Table\n\n| Topic | Active source to follow | Status |\n|---|---|---|\n| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../../architect/workspace-topology.md) | Active architecture target. Supersedes any simpler \"one project root / one runtime root\" reading. Packaging must not own physical placement for config/event/coordination roots. |\n| Release identity and activation | [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |\n| Shared gateway/web | [Promoted Future Constraints](architecture/future-constraints.md) | Future constraint only; not active delivery scope. |\n| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](../../architect/packaging-distribution/history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |\n| `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |",
    "text": "#### 2. Historical Supersession Table",
    "ancestry": [
      "Packaging-Distribution",
      "Retained Readme Source Detail",
      "Packaging And Distribution Architecture"
    ],
    "path": "docs/platform/packaging-distribution/README.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/19/facts",
    "sha256": "2976b38b14005685a18ed6909b9bb063240fc7476d8fe7e3423a4056206630e0"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-21

```json
{
  "entryId": "rationale-21",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
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
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md:295-295#5-releasemanifest (current lines); unit SHA256 b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b.\nTarget: docs/platform/packaging-distribution/contracts/release-manifest.md:146-146#5-releasemanifest (current lines); unit SHA256 dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (../host-invocation-routing/legacy-cli-transition.md) → \"Legacy CLI Transition\" (../../../architect/host-invocation-routing/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/architect/host-invocation-routing/legacy-cli-transition.md.\nHeading depth: 2 → 4; title \"5. ReleaseManifest\" → \"5. ReleaseManifest\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"5. ReleaseManifest\" → \"5. ReleaseManifest\"; 1 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest under docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest; source context \"Runtime Identity And Activation\", target context \"Contract: Release Manifest / Retained Runtime Identity And Activation Source Detail\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee",
    "targetAncestry": [
      "Contract: Release Manifest",
      "Retained Runtime Identity And Activation Source Detail"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_088af18a5796ed72fe6d33ff2cc5d05c",
    "sourceUnitDigest": "b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b",
    "targetOwner": "docs/platform/packaging-distribution/contracts/release-manifest.md",
    "targetAnchor": "5-releasemanifest",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md:295-295#5-releasemanifest (current lines); unit SHA256 b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b.\nTarget: docs/platform/packaging-distribution/contracts/release-manifest.md:146-146#5-releasemanifest (current lines); unit SHA256 dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (../host-invocation-routing/legacy-cli-transition.md) → \"Legacy CLI Transition\" (../../../architect/host-invocation-routing/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/architect/host-invocation-routing/legacy-cli-transition.md.\nHeading depth: 2 → 4; title \"5. ReleaseManifest\" → \"5. ReleaseManifest\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest under docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest; source context \"Runtime Identity And Activation\", target context \"Contract: Release Manifest / Retained Runtime Identity And Activation Source Detail\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee",
    "targetAncestry": [
      "Contract: Release Manifest",
      "Retained Runtime Identity And Activation Source Detail"
    ]
  },
  "currentDecision": {
    "claimId": "claim_088af18a5796ed72fe6d33ff2cc5d05c",
    "sourceUnitDigest": "b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b",
    "targetOwner": "docs/platform/packaging-distribution/contracts/release-manifest.md",
    "targetAnchor": "5-releasemanifest",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/runtime-identity-and-activation.md:295-295#5-releasemanifest (current lines); unit SHA256 b801deec612f9c048de490e35353b38f99031f2bac692e2955b64c7b1411587b.\nTarget: docs/platform/packaging-distribution/contracts/release-manifest.md:146-146#5-releasemanifest (current lines); unit SHA256 dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 1, target 1; 1 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nLink 1: \"Legacy CLI Transition\" (../host-invocation-routing/legacy-cli-transition.md) → \"Legacy CLI Transition\" (../../../architect/host-invocation-routing/legacy-cli-transition.md); resolved docs/architect/host-invocation-routing/legacy-cli-transition.md → docs/architect/host-invocation-routing/legacy-cli-transition.md.\nHeading depth: 2 → 4; title \"5. ReleaseManifest\" → \"5. ReleaseManifest\".\nWhole direct section differs; depth 2 → 4; 1 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/runtime-identity-and-activation.md#5-releasemanifest under docs/platform/packaging-distribution/contracts/release-manifest.md#5-releasemanifest; source context \"Runtime Identity And Activation\", target context \"Contract: Release Manifest / Retained Runtime Identity And Activation Source Detail\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "dab662376a62121a0cdec73438f62b6955fe94aa868d54deceb124c3aceaefee",
    "targetAncestry": [
      "Contract: Release Manifest",
      "Retained Runtime Identity And Activation Source Detail"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
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
    "sectionText": "## 5. ReleaseManifest\n\nThe release manifest is the immutable statement of what an fgOS release\ncontains.\n\nThe canonical artifact digest is computed from this release tree manifest, not\nfrom a `.zip`, `.tar.gz`, npm package archive, or transport wrapper. Archive\ndigests may still be recorded for download/integrity diagnostics, but they are\nnot runtime identity. Runtime identity must survive different compression\nformats, package transports, and mirror locations.\n\nThe digest formula is:\n\n```txt\nfileDigest = sha256(file bytes as emitted by the release build)\nartifactDigest = sha256(canonical-json(release tree manifest without artifactDigest))\n```\n\nThe release build, not the installer, owns byte normalization. Install should\nnot rewrite line endings or file contents to make a digest pass.\n\nMinimum fields:\n\n```json\n{\n  \"schemaVersion\": 1,\n  \"artifactDigest\": \"sha256:...\",\n  \"digestKind\": \"release-tree-manifest\",\n  \"releaseVersion\": \"0.1.0\",\n  \"sourceRevision\": \"...\",\n  \"createdAt\": \"2026-09-04T00:00:00Z\",\n  \"target\": {\n    \"os\": \"linux\",\n    \"arch\": \"x64\",\n    \"libc\": \"glibc\"\n  },\n  \"entries\": {\n    \"fgos\": \"bin/fgos\",\n    \"fgosRunner\": \"bin/fgos-runner\"\n  },\n  \"components\": {\n    \"legacyNode\": {\n      \"root\": \"libexec/legacy-node\",\n      \"entry\": \"bin/fgos.mjs\",\n      \"digest\": \"sha256:...\"\n    },\n    \"runner\": {\n      \"path\": \"bin/fgos-runner\",\n      \"digest\": \"sha256:...\"\n    },\n    \"workshop\": {\n      \"skillsDigest\": \"sha256:...\",\n      \"agentsDigest\": \"sha256:...\",\n      \"proseDigest\": \"sha256:...\"\n    }\n  },\n  \"requires\": {\n    \"node\": \">=20 <23\",\n    \"git\": \">=2.39\"\n  },\n  \"adapter\": {\n    \"protocolVersion\": \"1\",\n    \"entry\": \"bin/fgos adapter\",\n    \"capabilities\": []\n  },\n  \"stateSchemas\": {\n    \"read\": [\"1\"],\n    \"write\": [\"1\"],\n    \"migrations\": []\n  },\n  \"files\": []\n}\n```\n\n`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"` — the same fields serve dogfood and a staged release.",
    "text": "## 5. ReleaseManifest",
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
    "sectionText": "#### 5. ReleaseManifest\n\nThe release manifest is the immutable statement of what an fgOS release\ncontains.\n\nThe canonical artifact digest is computed from this release tree manifest, not\nfrom a `.zip`, `.tar.gz`, npm package archive, or transport wrapper. Archive\ndigests may still be recorded for download/integrity diagnostics, but they are\nnot runtime identity. Runtime identity must survive different compression\nformats, package transports, and mirror locations.\n\nThe digest formula is:\n\n```txt\nfileDigest = sha256(file bytes as emitted by the release build)\nartifactDigest = sha256(canonical-json(release tree manifest without artifactDigest))\n```\n\nThe release build, not the installer, owns byte normalization. Install should\nnot rewrite line endings or file contents to make a digest pass.\n\nMinimum fields:\n\n```json\n{\n  \"schemaVersion\": 1,\n  \"artifactDigest\": \"sha256:...\",\n  \"digestKind\": \"release-tree-manifest\",\n  \"releaseVersion\": \"0.1.0\",\n  \"sourceRevision\": \"...\",\n  \"createdAt\": \"2026-09-04T00:00:00Z\",\n  \"target\": {\n    \"os\": \"linux\",\n    \"arch\": \"x64\",\n    \"libc\": \"glibc\"\n  },\n  \"entries\": {\n    \"fgos\": \"bin/fgos\",\n    \"fgosRunner\": \"bin/fgos-runner\"\n  },\n  \"components\": {\n    \"legacyNode\": {\n      \"root\": \"libexec/legacy-node\",\n      \"entry\": \"bin/fgos.mjs\",\n      \"digest\": \"sha256:...\"\n    },\n    \"runner\": {\n      \"path\": \"bin/fgos-runner\",\n      \"digest\": \"sha256:...\"\n    },\n    \"workshop\": {\n      \"skillsDigest\": \"sha256:...\",\n      \"agentsDigest\": \"sha256:...\",\n      \"proseDigest\": \"sha256:...\"\n    }\n  },\n  \"requires\": {\n    \"node\": \">=20 <23\",\n    \"git\": \">=2.39\"\n  },\n  \"adapter\": {\n    \"protocolVersion\": \"1\",\n    \"entry\": \"bin/fgos adapter\",\n    \"capabilities\": []\n  },\n  \"stateSchemas\": {\n    \"read\": [\"1\"],\n    \"write\": [\"1\"],\n    \"migrations\": []\n  },\n  \"files\": []\n}\n```\n\n`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../../../architect/host-invocation-routing/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"` — the same fields serve dogfood and a staged release.",
    "text": "#### 5. ReleaseManifest",
    "ancestry": [
      "Contract: Release Manifest",
      "Retained Runtime Identity And Activation Source Detail"
    ],
    "path": "docs/platform/packaging-distribution/contracts/release-manifest.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/20/facts",
    "sha256": "9a2e568323d58d090e30c8c32af7a7556e44b2acb0f9008b9b78cedb58d63ade"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-22

```json
{
  "entryId": "rationale-22",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
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
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:1-1#workspace-runtime-model (current lines); unit SHA256 b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0.\nTarget: docs/platform/packaging-distribution/spec.md:425-425#workspace-runtime-model (current lines); unit SHA256 d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e.\nSource and target unit digests differ.\nTarget changed since last reviewed digest b17cd70e3bb848b985deb966b7c9ffc192142e8f887bfb49d3bf4d76c70efa15 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 3, target 3; 3 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nLink 3: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../system-architecture/architecture/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/platform/system-architecture/architecture/workspace-topology.md.\nHeading depth: 1 → 3; title \"Workspace Runtime Model\" → \"Workspace Runtime Model\".\nWhole direct section differs; depth 1 → 3; 3 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 1 → 3, title \"Workspace Runtime Model\" → \"Workspace Runtime Model\"; 3 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels L10-26 at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s4-packaging-distribution-architecture.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#workspace-runtime-model under docs/platform/packaging-distribution/spec.md#workspace-runtime-model; source context \"workspace-runtime-model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_163988c8973416bdd64781cc7c667f65",
    "sourceUnitDigest": "b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "workspace-runtime-model",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:1-1#workspace-runtime-model (current lines); unit SHA256 b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0.\nTarget: docs/platform/packaging-distribution/spec.md:425-425#workspace-runtime-model (current lines); unit SHA256 d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 3, target 3; 3 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nLink 3: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../system-architecture/architecture/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/platform/system-architecture/architecture/workspace-topology.md.\nHeading depth: 1 → 3; title \"Workspace Runtime Model\" → \"Workspace Runtime Model\".\nWhole direct section differs; depth 1 → 3; 3 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#workspace-runtime-model under docs/platform/packaging-distribution/spec.md#workspace-runtime-model; source context \"workspace-runtime-model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail"
    ]
  },
  "currentDecision": {
    "claimId": "claim_163988c8973416bdd64781cc7c667f65",
    "sourceUnitDigest": "b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "workspace-runtime-model",
    "claimKind": "architecture",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/packaging-distribution/workspace-runtime-model.md:1-1#workspace-runtime-model (current lines); unit SHA256 b40b26ddf0efce28d42470472e5c0ff0ec8976b3a7c2e8793bfd9bfef47c06b0.\nTarget: docs/platform/packaging-distribution/spec.md:425-425#workspace-runtime-model (current lines); unit SHA256 d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 3, target 3; 3 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"docs/architect/workspace-topology.md\" (../workspace-topology.md) → \"docs/architect/workspace-topology.md\" (../../architect/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/architect/workspace-topology.md.\nLink 2: \"docs/platform/packaging-distribution/\" (../../platform/packaging-distribution/README.md) → \"docs/platform/packaging-distribution/\" (README.md); resolved docs/platform/packaging-distribution/README.md → docs/platform/packaging-distribution/README.md.\nLink 3: \"Workspace Topology Architecture\" (../workspace-topology.md) → \"Workspace Topology Architecture\" (../system-architecture/architecture/workspace-topology.md); resolved docs/architect/workspace-topology.md → docs/platform/system-architecture/architecture/workspace-topology.md.\nHeading depth: 1 → 3; title \"Workspace Runtime Model\" → \"Workspace Runtime Model\".\nWhole direct section differs; depth 1 → 3; 3 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/packaging-distribution/workspace-runtime-model.md#workspace-runtime-model under docs/platform/packaging-distribution/spec.md#workspace-runtime-model; source context \"workspace-runtime-model\", target context \"Spec: Packaging-Distribution / Retained Workspace Runtime Model Source Detail\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
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
    "sectionText": "# Workspace Runtime Model\n\n```txt\nLegacy status: Superseded pointer\nSuperseded by:\n- docs/architect/workspace-topology.md\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Redirect only\nDo not use this legacy file for: Current model detail\nLast reviewed: 2026-09-13\n```\n\n> Status: historical redirect. Active topology remains\n> [docs/architect/workspace-topology.md](../workspace-topology.md), while active\n> packaging-distribution runtime records live under\n> [docs/platform/packaging-distribution/](../../platform/packaging-distribution/README.md).\n> Keep this file only as the old pointer that explains the split.\n\n**Status:** Moved.\n**Date:** 2026-09-04.\n\nWorkspace/runtime/work-state topology is broader than packaging/distribution.\nThe canonical architecture document is now:\n\n[Workspace Topology Architecture](../workspace-topology.md)\n\nPackaging/distribution consumes that topology for release store placement,\nworkspace activation binding, projection ledger scope, leases, and dirty-tree\nrules. Do not update this file with new topology decisions; update\n`docs/architect/workspace-topology.md` instead.",
    "text": "# Workspace Runtime Model",
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
    "sectionText": "### Workspace Runtime Model\n\n```txt\nLegacy status: Superseded pointer\nSuperseded by:\n- docs/architect/workspace-topology.md\n- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md\nCurrent reader entry: docs/platform/packaging-distribution/README.md\nUse this legacy file for: Redirect only\nDo not use this legacy file for: Current model detail\nLast reviewed: 2026-09-13\n```\n\n> Status: historical redirect. Active topology remains\n> [docs/architect/workspace-topology.md](../../architect/workspace-topology.md), while active\n> packaging-distribution runtime records live under\n> [docs/platform/packaging-distribution/](README.md).\n> Keep this file only as the old pointer that explains the split.\n\n**Status:** Moved.\n**Date:** 2026-09-04.\n\nWorkspace/runtime/work-state topology is broader than packaging/distribution.\nThe canonical architecture document is now:\n\n[Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md)\n\nPackaging/distribution consumes that topology for release store placement,\nworkspace activation binding, projection ledger scope, leases, and dirty-tree\nrules. Do not update this file with new topology decisions; update\n`docs/architect/workspace-topology.md` instead.",
    "text": "### Workspace Runtime Model",
    "ancestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail"
    ],
    "path": "docs/platform/packaging-distribution/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/21/facts",
    "sha256": "3e56598f30b7b9cfc7e1e050c9e289ebaef5cd2b2ea2da79d0189d87a64d5aac"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-23

```json
{
  "entryId": "rationale-23",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
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
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "data-dictionary",
    "sourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:55-55#data-dictionary (current lines); unit SHA256 04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f.\nTarget: docs/platform/packaging-distribution/spec.md:515-515#data-dictionary (current lines); unit SHA256 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95 at 287a22d33a0eaf2d9e47549a1142daf62361bb8c.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 4; title \"Data Dictionary\" → \"Data Dictionary\".\nWhole direct section differs; depth 2 → 4; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#data-dictionary under docs/platform/packaging-distribution/spec.md#data-dictionary; source context \"Spec: Distribution\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "data-dictionary",
    "targetUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ]
  },
  "currentDecision": {
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourcePath": "docs/specs/distribution.md",
    "sourceAnchor": "data-dictionary",
    "sourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "claimKind": "specification",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/distribution.md:55-55#data-dictionary (current lines); unit SHA256 04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f.\nTarget: docs/platform/packaging-distribution/spec.md:515-515#data-dictionary (current lines); unit SHA256 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95 at 287a22d33a0eaf2d9e47549a1142daf62361bb8c.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 4; title \"Data Dictionary\" → \"Data Dictionary\".\nWhole direct section differs; depth 2 → 4; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/specs/distribution.md#data-dictionary under docs/platform/packaging-distribution/spec.md#data-dictionary; source context \"Spec: Distribution\", target context \"Spec: Packaging-Distribution / Retained Distribution Source Detail / Spec: Distribution\". The complete source direct section occurs verbatim inside the bound target section; native unit digests differ.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetOwner": "docs/platform/packaging-distribution/spec.md",
    "targetAnchor": "data-dictionary",
    "targetUnitDigest": "3dd2d51fac193d78f712a83b2f0918c9f5f48a0e8eb65572afda4bb678b1de95",
    "targetAncestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
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
    "sectionText": "## Data Dictionary\n\n| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `writer-identity-resolvable` (the writer identity resolves through the Rust host for both the running host and the workspace activation a plain git commit hook uses; each binary is asked directly, so an older activated release shows as a version mismatch), `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |",
    "text": "## Data Dictionary",
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
    "sectionText": "#### Data Dictionary\n\n| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `writer-identity-resolvable` (the writer identity resolves through the Rust host for both the running host and the workspace activation a plain git commit hook uses; each binary is asked directly, so an older activated release shows as a version mismatch), `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |",
    "text": "#### Data Dictionary",
    "ancestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution"
    ],
    "path": "docs/platform/packaging-distribution/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/22/facts",
    "sha256": "f0e541b97cacb8a7d7ad45ed18dee5dbac0727c2808f4e11b51f3f59009696ba"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-24

```json
{
  "entryId": "rationale-24",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
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
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/doc-governance.md:466-466#14-related-files (current lines); unit SHA256 b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f.\nTarget: docs/platform/governance.md:467-467#14-related-files (current lines); unit SHA256 12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 1b5703ab9905bb5b86c289e9b6474f95cb2313ac563451919595515af5f1000c at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"README.md\" (README.md) → \"README.md\" (documentation/operations/portals/docs-portal.md); resolved docs/README.md → docs/platform/documentation/operations/portals/docs-portal.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"transitional-switchboard.md\" (transitional-switchboard.md) → \"transitional-switchboard.md\" (documentation/switchboard.md); resolved docs/transitional-switchboard.md → docs/platform/documentation/switchboard.md.\nLink 4: \"platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"platform/migration-authoring-rules.md\" (migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 6: \"architect/documentation-system-design.md\" (architect/documentation-system-design.md) → \"architect/documentation-system-design.md\" (../architect/documentation-system-design.md); resolved docs/architect/documentation-system-design.md → docs/architect/documentation-system-design.md.\nHeading depth: 2 → 2; title \"14. Related Files\" → \"14. Related Files\".\nWhole direct section differs; depth 2 → 2; 6 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"14. Related Files\" → \"14. Related Files\"; 6 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-governance.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/doc-governance.md#14-related-files under docs/platform/governance.md#14-related-files; source context \"Documentation Governance\", target context \"Documentation Governance\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6",
    "targetAncestry": [
      "Documentation Governance"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_66f7be3b79ca1fe458ce0416ba1adf89",
    "sourceUnitDigest": "b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f",
    "targetOwner": "docs/platform/governance.md",
    "targetAnchor": "14-related-files",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/doc-governance.md:466-466#14-related-files (current lines); unit SHA256 b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f.\nTarget: docs/platform/governance.md:467-467#14-related-files (current lines); unit SHA256 12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 1b5703ab9905bb5b86c289e9b6474f95cb2313ac563451919595515af5f1000c at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"README.md\" (README.md) → \"README.md\" (documentation/operations/portals/docs-portal.md); resolved docs/README.md → docs/platform/documentation/operations/portals/docs-portal.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"transitional-switchboard.md\" (transitional-switchboard.md) → \"transitional-switchboard.md\" (documentation/switchboard.md); resolved docs/transitional-switchboard.md → docs/platform/documentation/switchboard.md.\nLink 4: \"platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"platform/migration-authoring-rules.md\" (migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 6: \"architect/documentation-system-design.md\" (architect/documentation-system-design.md) → \"architect/documentation-system-design.md\" (../architect/documentation-system-design.md); resolved docs/architect/documentation-system-design.md → docs/architect/documentation-system-design.md.\nHeading depth: 2 → 2; title \"14. Related Files\" → \"14. Related Files\".\nWhole direct section differs; depth 2 → 2; 6 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/doc-governance.md#14-related-files under docs/platform/governance.md#14-related-files; source context \"Documentation Governance\", target context \"Documentation Governance\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6",
    "targetAncestry": [
      "Documentation Governance"
    ]
  },
  "currentDecision": {
    "claimId": "claim_66f7be3b79ca1fe458ce0416ba1adf89",
    "sourceUnitDigest": "b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f",
    "targetOwner": "docs/platform/governance.md",
    "targetAnchor": "14-related-files",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/doc-governance.md:466-466#14-related-files (current lines); unit SHA256 b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f.\nTarget: docs/platform/governance.md:467-467#14-related-files (current lines); unit SHA256 12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6.\nSource and target unit digests differ.\nTarget changed since last reviewed digest 1b5703ab9905bb5b86c289e9b6474f95cb2313ac563451919595515af5f1000c at 2300d65571968bb3bcb80123a273272586e3f1db.\nLinks: source 6, target 6; 6 changed spellings/labels, 2 destination changes; 0 added, 0 removed.\nLink 1: \"README.md\" (README.md) → \"README.md\" (documentation/operations/portals/docs-portal.md); resolved docs/README.md → docs/platform/documentation/operations/portals/docs-portal.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"transitional-switchboard.md\" (transitional-switchboard.md) → \"transitional-switchboard.md\" (documentation/switchboard.md); resolved docs/transitional-switchboard.md → docs/platform/documentation/switchboard.md.\nLink 4: \"platform/migration-authoring-rules.md\" (platform/migration-authoring-rules.md) → \"platform/migration-authoring-rules.md\" (migration-authoring-rules.md); resolved docs/platform/migration-authoring-rules.md → docs/platform/migration-authoring-rules.md.\nLink 5: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 6: \"architect/documentation-system-design.md\" (architect/documentation-system-design.md) → \"architect/documentation-system-design.md\" (../architect/documentation-system-design.md); resolved docs/architect/documentation-system-design.md → docs/architect/documentation-system-design.md.\nHeading depth: 2 → 2; title \"14. Related Files\" → \"14. Related Files\".\nWhole direct section differs; depth 2 → 2; 6 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/doc-governance.md#14-related-files under docs/platform/governance.md#14-related-files; source context \"Documentation Governance\", target context \"Documentation Governance\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6",
    "targetAncestry": [
      "Documentation Governance"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
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
    "sectionText": "## 14. Related Files\n\n| Relationship | File |\n|---|---|\n| documentation portal | [README.md](README.md) |\n| reader routing | [reading-map.md](reading-map.md) |\n| operative transitional switchboard | [transitional-switchboard.md](transitional-switchboard.md) |\n| migration authoring rules | [platform/migration-authoring-rules.md](platform/migration-authoring-rules.md) |\n| platform portal | [platform/README.md](platform/README.md) |\n| source design discussion | [architect/documentation-system-design.md](architect/documentation-system-design.md) |",
    "text": "## 14. Related Files",
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
    "sectionText": "## 14. Related Files\n\n| Relationship | File |\n|---|---|\n| documentation portal | [README.md](documentation/operations/portals/docs-portal.md) |\n| reader routing | [reading-map.md](../reading-map.md) |\n| operative transitional switchboard | [transitional-switchboard.md](documentation/switchboard.md) |\n| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |\n| platform portal | [platform/README.md](README.md) |\n| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |",
    "text": "## 14. Related Files",
    "ancestry": [
      "Documentation Governance"
    ],
    "path": "docs/platform/governance.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/23/facts",
    "sha256": "46f21437faa3cb7cd966f2541527ec0b263283c08a78ff367d5b90daf8bad5b8"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-25

```json
{
  "entryId": "rationale-25",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-mapped-conservation.json",
  "collection": "claims",
  "claimId": "claim_53ebf4b541ff8f6a2c40e3b95304d6b7",
  "before": {
    "claimId": "claim_53ebf4b541ff8f6a2c40e3b95304d6b7",
    "sourceUnitDigest": "2aff5e7721a256efce78953c498af0839f56f0bb5b9918290a36bbc072659eb1",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "1-read-first",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/README.md:23-23#1-read-first (current lines); unit SHA256 2aff5e7721a256efce78953c498af0839f56f0bb5b9918290a36bbc072659eb1.\nTarget: docs/platform/documentation/operations/portals/docs-portal.md:24-24#1-read-first (current lines); unit SHA256 16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 8, target 8; 8 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"doc-governance.md\" (doc-governance.md) → \"doc-governance.md\" (../../../governance.md); resolved docs/doc-governance.md → docs/platform/governance.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../../../../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (../../../README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 4: \"specs/reading-map.md\" (specs/reading-map.md) → \"specs/reading-map.md\" (../../../../specs/reading-map.md); resolved docs/specs/reading-map.md → docs/specs/reading-map.md.\nLink 5: \"user/\" (user/) → \"user/\" (../../../../user); resolved docs/user → docs/user.\nLink 6: \"how-to/\" (how-to/) → \"how-to/\" (../../../../how-to); resolved docs/how-to → docs/how-to.\nLink 7: \"reference/\" (reference/) → \"reference/\" (../../../../reference); resolved docs/reference → docs/reference.\nLink 8: \"explanation/\" (explanation/) → \"explanation/\" (../../../../explanation); resolved docs/explanation → docs/explanation.\nHeading depth: 2 → 2; title \"1. Read First\" → \"1. Read First\".\nWhole direct section differs; depth 2 → 2; 8 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct section compared to the next native heading. Depth 2 → 2, title \"1. Read First\" → \"1. Read First\"; 8 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/README.md#1-read-first under docs/platform/documentation/operations/portals/docs-portal.md#1-read-first; source context \"fgOS Documentation\", target context \"fgOS Documentation\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db",
    "targetAncestry": [
      "fgOS Documentation"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_53ebf4b541ff8f6a2c40e3b95304d6b7",
    "sourceUnitDigest": "2aff5e7721a256efce78953c498af0839f56f0bb5b9918290a36bbc072659eb1",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "1-read-first",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/README.md:23-23#1-read-first (current lines); unit SHA256 2aff5e7721a256efce78953c498af0839f56f0bb5b9918290a36bbc072659eb1.\nTarget: docs/platform/documentation/operations/portals/docs-portal.md:24-24#1-read-first (current lines); unit SHA256 16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 8, target 8; 8 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"doc-governance.md\" (doc-governance.md) → \"doc-governance.md\" (../../../governance.md); resolved docs/doc-governance.md → docs/platform/governance.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../../../../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (../../../README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 4: \"specs/reading-map.md\" (specs/reading-map.md) → \"specs/reading-map.md\" (../../../../specs/reading-map.md); resolved docs/specs/reading-map.md → docs/specs/reading-map.md.\nLink 5: \"user/\" (user/) → \"user/\" (../../../../user); resolved docs/user → docs/user.\nLink 6: \"how-to/\" (how-to/) → \"how-to/\" (../../../../how-to); resolved docs/how-to → docs/how-to.\nLink 7: \"reference/\" (reference/) → \"reference/\" (../../../../reference); resolved docs/reference → docs/reference.\nLink 8: \"explanation/\" (explanation/) → \"explanation/\" (../../../../explanation); resolved docs/explanation → docs/explanation.\nHeading depth: 2 → 2; title \"1. Read First\" → \"1. Read First\".\nWhole direct section differs; depth 2 → 2; 8 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/README.md#1-read-first under docs/platform/documentation/operations/portals/docs-portal.md#1-read-first; source context \"fgOS Documentation\", target context \"fgOS Documentation\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db",
    "targetAncestry": [
      "fgOS Documentation"
    ]
  },
  "currentDecision": {
    "claimId": "claim_53ebf4b541ff8f6a2c40e3b95304d6b7",
    "sourceUnitDigest": "2aff5e7721a256efce78953c498af0839f56f0bb5b9918290a36bbc072659eb1",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "1-read-first",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/README.md:23-23#1-read-first (current lines); unit SHA256 2aff5e7721a256efce78953c498af0839f56f0bb5b9918290a36bbc072659eb1.\nTarget: docs/platform/documentation/operations/portals/docs-portal.md:24-24#1-read-first (current lines); unit SHA256 16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 8, target 8; 8 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"doc-governance.md\" (doc-governance.md) → \"doc-governance.md\" (../../../governance.md); resolved docs/doc-governance.md → docs/platform/governance.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../../../../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (../../../README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 4: \"specs/reading-map.md\" (specs/reading-map.md) → \"specs/reading-map.md\" (../../../../specs/reading-map.md); resolved docs/specs/reading-map.md → docs/specs/reading-map.md.\nLink 5: \"user/\" (user/) → \"user/\" (../../../../user); resolved docs/user → docs/user.\nLink 6: \"how-to/\" (how-to/) → \"how-to/\" (../../../../how-to); resolved docs/how-to → docs/how-to.\nLink 7: \"reference/\" (reference/) → \"reference/\" (../../../../reference); resolved docs/reference → docs/reference.\nLink 8: \"explanation/\" (explanation/) → \"explanation/\" (../../../../explanation); resolved docs/explanation → docs/explanation.\nHeading depth: 2 → 2; title \"1. Read First\" → \"1. Read First\".\nWhole direct section differs; depth 2 → 2; 8 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/README.md#1-read-first under docs/platform/documentation/operations/portals/docs-portal.md#1-read-first; source context \"fgOS Documentation\", target context \"fgOS Documentation\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db",
    "targetAncestry": [
      "fgOS Documentation"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Read First",
    "anchor": "1-read-first",
    "githubAnchor": "1-read-first",
    "stableAnchor": "h-0388bde5e628",
    "startLine": 23,
    "endLine": 23,
    "textDigest": "2aff5e7721a256efce78953c498af0839f56f0bb5b9918290a36bbc072659eb1",
    "sample": "1. Read First",
    "sectionPayloadDigest": "dd493e9c64c0caf205f6acc1617c588a0f6710dc0a4f5922d58551efaf63e579",
    "followingBlockDigest": "dd493e9c64c0caf205f6acc1617c588a0f6710dc0a4f5922d58551efaf63e579",
    "identityFingerprint": "cec3cc48da5f0304a04509a6f525b0c65718f1af632d8ce8616da9e9d2a8f2f5",
    "sectionText": "## 1. Read First\n\n| Need | Read |\n|---|---|\n| Documentation rules | [doc-governance.md](doc-governance.md) |\n| What to read first | [reading-map.md](reading-map.md) |\n| Platform/system design docs | [platform/README.md](platform/README.md) |\n| Current legacy product/source map | [specs/reading-map.md](specs/reading-map.md) |\n| User docs | [user/](user/) target; existing [how-to/](how-to/), [reference/](reference/), [explanation/](explanation/) during migration; `docs/tutorials/` is a planned/legacy slot not present in this checkout |",
    "text": "## 1. Read First",
    "ancestry": [
      "fgOS Documentation"
    ],
    "path": "docs/README.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Read First",
    "anchor": "1-read-first",
    "githubAnchor": "1-read-first",
    "stableAnchor": "h-b7f427058523",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "16929d439319f41461ebf8f9278446e233b23a3b2450a9b9bd4295b12e1052db",
    "sample": "1. Read First",
    "sectionPayloadDigest": "1b6544779a1b1b2aea1f57d5e9f59d5831cbbb499161f8ed90e23e16e3a7f134",
    "followingBlockDigest": "1b6544779a1b1b2aea1f57d5e9f59d5831cbbb499161f8ed90e23e16e3a7f134",
    "identityFingerprint": "a814e0205376a0b450f0c1452ade36d628a85ed7f199e7203356f2268efc309f",
    "sectionText": "## 1. Read First\n\n| Need | Read |\n|---|---|\n| Documentation rules | [doc-governance.md](../../../governance.md) |\n| What to read first | [reading-map.md](../../../../reading-map.md) |\n| Platform/system design docs | [platform/README.md](../../../README.md) |\n| Current legacy product/source map | [specs/reading-map.md](../../../../specs/reading-map.md) |\n| User docs | [user/](../../../../user) target; existing [how-to/](../../../../how-to), [reference/](../../../../reference), [explanation/](../../../../explanation) during migration; `docs/tutorials/` is a planned/legacy slot not present in this checkout |",
    "text": "## 1. Read First",
    "ancestry": [
      "fgOS Documentation"
    ],
    "path": "docs/platform/documentation/operations/portals/docs-portal.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/24/facts",
    "sha256": "db1b38854452365e2222cdc69822225bf4fbd435f3e60d81014eea2289fd2286"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-26

```json
{
  "entryId": "rationale-26",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s5-root-mapped-conservation.json",
  "collection": "claims",
  "claimId": "claim_2ae0cd4fc1cf487f7caa4d77d46e9682",
  "before": {
    "claimId": "claim_2ae0cd4fc1cf487f7caa4d77d46e9682",
    "sourceUnitDigest": "93e63d0c77140732f2db5dcff67c39869f924d501e3556dfb36a9d48cc73ed8d",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "4-related-files",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/README.md:50-50#4-related-files (current lines); unit SHA256 93e63d0c77140732f2db5dcff67c39869f924d501e3556dfb36a9d48cc73ed8d.\nTarget: docs/platform/documentation/operations/portals/docs-portal.md:51-51#4-related-files (current lines); unit SHA256 6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828 at 345f15d95663260976200be66d1b9a6c648bcd6d.\nLinks: source 4, target 4; 4 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"doc-governance.md\" (doc-governance.md) → \"doc-governance.md\" (../../../governance.md); resolved docs/doc-governance.md → docs/platform/governance.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../../../../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (../../../README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 4: \"specs/reading-map.md\" (specs/reading-map.md) → \"specs/reading-map.md\" (../../../../specs/reading-map.md); resolved docs/specs/reading-map.md → docs/specs/reading-map.md.\nHeading depth: 2 → 2; title \"4. Related Files\" → \"4. Related Files\".\nWhole direct section differs; depth 2 → 2; 4 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct section compared to the next native heading. Depth 2 → 2, title \"4. Related Files\" → \"4. Related Files\"; 4 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately.\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/README.md#4-related-files under docs/platform/documentation/operations/portals/docs-portal.md#4-related-files; source context \"fgOS Documentation\", target context \"fgOS Documentation\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828",
    "targetAncestry": [
      "fgOS Documentation"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_2ae0cd4fc1cf487f7caa4d77d46e9682",
    "sourceUnitDigest": "93e63d0c77140732f2db5dcff67c39869f924d501e3556dfb36a9d48cc73ed8d",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "4-related-files",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/README.md:50-50#4-related-files (current lines); unit SHA256 93e63d0c77140732f2db5dcff67c39869f924d501e3556dfb36a9d48cc73ed8d.\nTarget: docs/platform/documentation/operations/portals/docs-portal.md:51-51#4-related-files (current lines); unit SHA256 6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 4, target 4; 4 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"doc-governance.md\" (doc-governance.md) → \"doc-governance.md\" (../../../governance.md); resolved docs/doc-governance.md → docs/platform/governance.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../../../../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (../../../README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 4: \"specs/reading-map.md\" (specs/reading-map.md) → \"specs/reading-map.md\" (../../../../specs/reading-map.md); resolved docs/specs/reading-map.md → docs/specs/reading-map.md.\nHeading depth: 2 → 2; title \"4. Related Files\" → \"4. Related Files\".\nWhole direct section differs; depth 2 → 2; 4 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/README.md#4-related-files under docs/platform/documentation/operations/portals/docs-portal.md#4-related-files; source context \"fgOS Documentation\", target context \"fgOS Documentation\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828",
    "targetAncestry": [
      "fgOS Documentation"
    ]
  },
  "currentDecision": {
    "claimId": "claim_2ae0cd4fc1cf487f7caa4d77d46e9682",
    "sourceUnitDigest": "93e63d0c77140732f2db5dcff67c39869f924d501e3556dfb36a9d48cc73ed8d",
    "targetOwner": "docs/platform/documentation/operations/portals/docs-portal.md",
    "targetAnchor": "4-related-files",
    "claimKind": "navigation",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/README.md:50-50#4-related-files (current lines); unit SHA256 93e63d0c77140732f2db5dcff67c39869f924d501e3556dfb36a9d48cc73ed8d.\nTarget: docs/platform/documentation/operations/portals/docs-portal.md:51-51#4-related-files (current lines); unit SHA256 6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 4, target 4; 4 changed spellings/labels, 1 destination changes; 0 added, 0 removed.\nLink 1: \"doc-governance.md\" (doc-governance.md) → \"doc-governance.md\" (../../../governance.md); resolved docs/doc-governance.md → docs/platform/governance.md.\nLink 2: \"reading-map.md\" (reading-map.md) → \"reading-map.md\" (../../../../reading-map.md); resolved docs/reading-map.md → docs/reading-map.md.\nLink 3: \"platform/README.md\" (platform/README.md) → \"platform/README.md\" (../../../README.md); resolved docs/platform/README.md → docs/platform/README.md.\nLink 4: \"specs/reading-map.md\" (specs/reading-map.md) → \"specs/reading-map.md\" (../../../../specs/reading-map.md); resolved docs/specs/reading-map.md → docs/specs/reading-map.md.\nHeading depth: 2 → 2; title \"4. Related Files\" → \"4. Related Files\".\nWhole direct section differs; depth 2 → 2; 4 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition supersede: Account for docs/README.md#4-related-files under docs/platform/documentation/operations/portals/docs-portal.md#4-related-files; source context \"fgOS Documentation\", target context \"fgOS Documentation\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828",
    "targetAncestry": [
      "fgOS Documentation"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Related Files",
    "anchor": "4-related-files",
    "githubAnchor": "4-related-files",
    "stableAnchor": "h-cf68b4d6c4eb",
    "startLine": 50,
    "endLine": 50,
    "textDigest": "93e63d0c77140732f2db5dcff67c39869f924d501e3556dfb36a9d48cc73ed8d",
    "sample": "4. Related Files",
    "sectionPayloadDigest": "30081b87c5f3fa70b025b187fa5dd4cc947c337d5c005aec01a17fd48d6652ef",
    "followingBlockDigest": "30081b87c5f3fa70b025b187fa5dd4cc947c337d5c005aec01a17fd48d6652ef",
    "identityFingerprint": "55ebb1dce18c7da888a4ee94323b12f7d42eeab62d3d74718bf7c754cf7d45ff",
    "sectionText": "## 4. Related Files\n\n| Relationship | File |\n|---|---|\n| governs documentation system | [doc-governance.md](doc-governance.md) |\n| routes readers by purpose | [reading-map.md](reading-map.md) |\n| platform documentation portal | [platform/README.md](platform/README.md) |\n| legacy/current detailed source map | [specs/reading-map.md](specs/reading-map.md) |",
    "text": "## 4. Related Files",
    "ancestry": [
      "fgOS Documentation"
    ],
    "path": "docs/README.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Related Files",
    "anchor": "4-related-files",
    "githubAnchor": "4-related-files",
    "stableAnchor": "h-fd2851fe7923",
    "startLine": 51,
    "endLine": 51,
    "textDigest": "6dcde68b9663bbcefb3354897ee57514583ac7767a09df3f74a615011844a828",
    "sample": "4. Related Files",
    "sectionPayloadDigest": "10836db6663f77db9404e1d2502532f3928bef5224306570368ddb4fceb59d15",
    "followingBlockDigest": "10836db6663f77db9404e1d2502532f3928bef5224306570368ddb4fceb59d15",
    "identityFingerprint": "dd41e36bfc7693425fc2e18d107aebbce61eb77793e853011d71db8cc1ec13b0",
    "sectionText": "## 4. Related Files\n\n| Relationship | File |\n|---|---|\n| governs documentation system | [doc-governance.md](../../../governance.md) |\n| routes readers by purpose | [reading-map.md](../../../../reading-map.md) |\n| platform documentation portal | [platform/README.md](../../../README.md) |\n| legacy/current detailed source map | [specs/reading-map.md](../../../../specs/reading-map.md) |",
    "text": "## 4. Related Files",
    "ancestry": [
      "fgOS Documentation"
    ],
    "path": "docs/platform/documentation/operations/portals/docs-portal.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/25/facts",
    "sha256": "cdc3bb1b31575c3dbb576d10c6e59045db44314b207db115a7e50cf49df4d0cc"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-27

```json
{
  "entryId": "rationale-27",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-component-boundary-advisory.json",
  "collection": "claims",
  "claimId": "claim_239931ca8e26fd3b19bf970e30e2ae4b",
  "before": {
    "claimId": "claim_239931ca8e26fd3b19bf970e30e2ae4b",
    "sourceUnitDigest": "4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73",
    "targetOwner": "docs/platform/component-boundary.md",
    "targetAnchor": "7-contract-authority-matrix",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/component-boundary/component-boundary-advisory.md:277-277#7-contract-authority-matrix (current lines); unit SHA256 4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73.\nTarget: docs/platform/component-boundary.md:381-381#7-contract-authority-matrix (current lines); unit SHA256 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 11, target 11; 9 changed spellings/labels, 9 destination changes; 0 added, 0 removed.\nLink 1: \"Workflow Stage Operation Contract\" (../agent-coordination/contracts/workflow-stage-operation.md) → \"Workflow Stage Operation Contract\" (agent-coordination/contracts/workflow-stage-operation.md); resolved docs/architect/agent-coordination/contracts/workflow-stage-operation.md → docs/platform/agent-coordination/contracts/workflow-stage-operation.md.\nLink 2: \"FlowDefinition Contract\" (../agent-coordination/contracts/flow-definition.md) → \"FlowDefinition Contract\" (agent-coordination/history/retired-engine/files/contracts/flow-definition.md); resolved docs/architect/agent-coordination/contracts/flow-definition.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md.\nLink 3: \"CoordinationSession Contract\" (../agent-coordination/contracts/coordination-session.md) → \"CoordinationSession Contract\" (agent-coordination/history/retired-engine/files/contracts/coordination-session.md); resolved docs/architect/agent-coordination/contracts/coordination-session.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md.\nLink 4: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 7: \"Dispatch Control Plane\" (../agent-coordination/architecture/dispatch-control-plane.md) → \"Dispatch Control Plane\" (agent-coordination/architecture/dispatch-control-plane.md); resolved docs/architect/agent-coordination/architecture/dispatch-control-plane.md → docs/platform/agent-coordination/architecture/dispatch-control-plane.md.\nLink 8: \"Evidence And Result Architecture\" (../agent-coordination/architecture/evidence-and-results.md) → \"Evidence And Result Architecture\" (agent-coordination/architecture/evidence-and-results.md); resolved docs/architect/agent-coordination/architecture/evidence-and-results.md → docs/platform/agent-coordination/architecture/evidence-and-results.md.\nLink 9: \"Work Integration Boundaries\" (../agent-coordination/architecture/work-integration.md) → \"Work Integration Boundaries\" (agent-coordination/architecture/work-integration.md); resolved docs/architect/agent-coordination/architecture/work-integration.md → docs/platform/agent-coordination/architecture/work-integration.md.\nLink 10: \"Visibility And Herdr\" (../agent-coordination/architecture/visibility-and-herdr.md) → \"Visibility And Herdr\" (agent-coordination/architecture/visibility-and-herdr.md); resolved docs/architect/agent-coordination/architecture/visibility-and-herdr.md → docs/platform/agent-coordination/architecture/visibility-and-herdr.md.\nLink 11: \"ADR-007 Domain Harness Seam\" (../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) → \"ADR-007 Domain Harness Seam\" (agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nHeading depth: 2 → 4; title \"7. Contract Authority Matrix\" → \"7. Contract Authority Matrix\".\nWhole direct section differs; depth 2 → 4; 9 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 4, title \"7. Contract Authority Matrix\" → \"7. Contract Authority Matrix\"; 9 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s6-whole-system-component-component-boundary-advisory.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/component-boundary/component-boundary-advisory.md#7-contract-authority-matrix under docs/platform/component-boundary.md#7-contract-authority-matrix; source context \"fgOS Component Boundary Advisory\", target context \"Component Boundary / Added in candidate: component-boundary-advisory source carriage / fgOS Component Boundary Advisory\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c",
    "targetAncestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_239931ca8e26fd3b19bf970e30e2ae4b",
    "sourceUnitDigest": "4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73",
    "targetOwner": "docs/platform/component-boundary.md",
    "targetAnchor": "7-contract-authority-matrix",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/component-boundary/component-boundary-advisory.md:277-277#7-contract-authority-matrix (current lines); unit SHA256 4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73.\nTarget: docs/platform/component-boundary.md:381-381#7-contract-authority-matrix (current lines); unit SHA256 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 11, target 11; 9 changed spellings/labels, 9 destination changes; 0 added, 0 removed.\nLink 1: \"Workflow Stage Operation Contract\" (../agent-coordination/contracts/workflow-stage-operation.md) → \"Workflow Stage Operation Contract\" (agent-coordination/contracts/workflow-stage-operation.md); resolved docs/architect/agent-coordination/contracts/workflow-stage-operation.md → docs/platform/agent-coordination/contracts/workflow-stage-operation.md.\nLink 2: \"FlowDefinition Contract\" (../agent-coordination/contracts/flow-definition.md) → \"FlowDefinition Contract\" (agent-coordination/history/retired-engine/files/contracts/flow-definition.md); resolved docs/architect/agent-coordination/contracts/flow-definition.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md.\nLink 3: \"CoordinationSession Contract\" (../agent-coordination/contracts/coordination-session.md) → \"CoordinationSession Contract\" (agent-coordination/history/retired-engine/files/contracts/coordination-session.md); resolved docs/architect/agent-coordination/contracts/coordination-session.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md.\nLink 4: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 7: \"Dispatch Control Plane\" (../agent-coordination/architecture/dispatch-control-plane.md) → \"Dispatch Control Plane\" (agent-coordination/architecture/dispatch-control-plane.md); resolved docs/architect/agent-coordination/architecture/dispatch-control-plane.md → docs/platform/agent-coordination/architecture/dispatch-control-plane.md.\nLink 8: \"Evidence And Result Architecture\" (../agent-coordination/architecture/evidence-and-results.md) → \"Evidence And Result Architecture\" (agent-coordination/architecture/evidence-and-results.md); resolved docs/architect/agent-coordination/architecture/evidence-and-results.md → docs/platform/agent-coordination/architecture/evidence-and-results.md.\nLink 9: \"Work Integration Boundaries\" (../agent-coordination/architecture/work-integration.md) → \"Work Integration Boundaries\" (agent-coordination/architecture/work-integration.md); resolved docs/architect/agent-coordination/architecture/work-integration.md → docs/platform/agent-coordination/architecture/work-integration.md.\nLink 10: \"Visibility And Herdr\" (../agent-coordination/architecture/visibility-and-herdr.md) → \"Visibility And Herdr\" (agent-coordination/architecture/visibility-and-herdr.md); resolved docs/architect/agent-coordination/architecture/visibility-and-herdr.md → docs/platform/agent-coordination/architecture/visibility-and-herdr.md.\nLink 11: \"ADR-007 Domain Harness Seam\" (../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) → \"ADR-007 Domain Harness Seam\" (agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nHeading depth: 2 → 4; title \"7. Contract Authority Matrix\" → \"7. Contract Authority Matrix\".\nWhole direct section differs; depth 2 → 4; 9 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/component-boundary/component-boundary-advisory.md#7-contract-authority-matrix under docs/platform/component-boundary.md#7-contract-authority-matrix; source context \"fgOS Component Boundary Advisory\", target context \"Component Boundary / Added in candidate: component-boundary-advisory source carriage / fgOS Component Boundary Advisory\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c",
    "targetAncestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ]
  },
  "currentDecision": {
    "claimId": "claim_239931ca8e26fd3b19bf970e30e2ae4b",
    "sourceUnitDigest": "4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73",
    "targetOwner": "docs/platform/component-boundary.md",
    "targetAnchor": "7-contract-authority-matrix",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/component-boundary/component-boundary-advisory.md:277-277#7-contract-authority-matrix (current lines); unit SHA256 4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73.\nTarget: docs/platform/component-boundary.md:381-381#7-contract-authority-matrix (current lines); unit SHA256 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest 1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 11, target 11; 9 changed spellings/labels, 9 destination changes; 0 added, 0 removed.\nLink 1: \"Workflow Stage Operation Contract\" (../agent-coordination/contracts/workflow-stage-operation.md) → \"Workflow Stage Operation Contract\" (agent-coordination/contracts/workflow-stage-operation.md); resolved docs/architect/agent-coordination/contracts/workflow-stage-operation.md → docs/platform/agent-coordination/contracts/workflow-stage-operation.md.\nLink 2: \"FlowDefinition Contract\" (../agent-coordination/contracts/flow-definition.md) → \"FlowDefinition Contract\" (agent-coordination/history/retired-engine/files/contracts/flow-definition.md); resolved docs/architect/agent-coordination/contracts/flow-definition.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md.\nLink 3: \"CoordinationSession Contract\" (../agent-coordination/contracts/coordination-session.md) → \"CoordinationSession Contract\" (agent-coordination/history/retired-engine/files/contracts/coordination-session.md); resolved docs/architect/agent-coordination/contracts/coordination-session.md → docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md.\nLink 4: \"Assignment, Run, And RunResult Contract\" (../agent-coordination/contracts/assignment-run-runresult.md) → \"Assignment, Run, And RunResult Contract\" (agent-coordination/contracts/assignment-run-runresult.md); resolved docs/architect/agent-coordination/contracts/assignment-run-runresult.md → docs/platform/agent-coordination/contracts/assignment-run-runresult.md.\nLink 7: \"Dispatch Control Plane\" (../agent-coordination/architecture/dispatch-control-plane.md) → \"Dispatch Control Plane\" (agent-coordination/architecture/dispatch-control-plane.md); resolved docs/architect/agent-coordination/architecture/dispatch-control-plane.md → docs/platform/agent-coordination/architecture/dispatch-control-plane.md.\nLink 8: \"Evidence And Result Architecture\" (../agent-coordination/architecture/evidence-and-results.md) → \"Evidence And Result Architecture\" (agent-coordination/architecture/evidence-and-results.md); resolved docs/architect/agent-coordination/architecture/evidence-and-results.md → docs/platform/agent-coordination/architecture/evidence-and-results.md.\nLink 9: \"Work Integration Boundaries\" (../agent-coordination/architecture/work-integration.md) → \"Work Integration Boundaries\" (agent-coordination/architecture/work-integration.md); resolved docs/architect/agent-coordination/architecture/work-integration.md → docs/platform/agent-coordination/architecture/work-integration.md.\nLink 10: \"Visibility And Herdr\" (../agent-coordination/architecture/visibility-and-herdr.md) → \"Visibility And Herdr\" (agent-coordination/architecture/visibility-and-herdr.md); resolved docs/architect/agent-coordination/architecture/visibility-and-herdr.md → docs/platform/agent-coordination/architecture/visibility-and-herdr.md.\nLink 11: \"ADR-007 Domain Harness Seam\" (../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) → \"ADR-007 Domain Harness Seam\" (agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md); resolved docs/architect/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md → docs/platform/agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md.\nHeading depth: 2 → 4; title \"7. Contract Authority Matrix\" → \"7. Contract Authority Matrix\".\nWhole direct section differs; depth 2 → 4; 9 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (heading-and-links): Complete direct sections differ only in heading, link spellings/labels or authenticated exact corrections. Exact normalized nonblank line delta: removed []; added [].\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/architect/component-boundary/component-boundary-advisory.md#7-contract-authority-matrix under docs/platform/component-boundary.md#7-contract-authority-matrix; source context \"fgOS Component Boundary Advisory\", target context \"Component Boundary / Added in candidate: component-boundary-advisory source carriage / fgOS Component Boundary Advisory\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c",
    "targetAncestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "7. Contract Authority Matrix",
    "anchor": "7-contract-authority-matrix",
    "githubAnchor": "7-contract-authority-matrix",
    "stableAnchor": "h-fe1bfd2a3e25",
    "startLine": 277,
    "endLine": 277,
    "textDigest": "4d28b9272b26427ed2d52f257a57be32113f564fe2a49e164ba95262b990fe73",
    "sample": "7. Contract Authority Matrix",
    "sectionPayloadDigest": "0d8cfb91b182fc5d7d2b7646db9378d7dc83f01178139676d2630ccd665db50b",
    "followingBlockDigest": "624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f",
    "identityFingerprint": "533a07a1fa0c1ea97058df997a0b1ed6cba7e7ad1bbe3579d6e927d4b9b67271",
    "sectionText": "## 7. Contract Authority Matrix\n\nThe existing contracts should be read as shared system contracts with explicit\ncomponent ownership. A document may describe a chain across components, but the\nauthority for each decision should still belong to one component.\n\nIn this advisory, a contract is not a component. A contract is the public\ninterface, schema, or invariant owned by the component that controls the\nbehavior. Other components interact through that contract and must not\nre-derive it privately.\n\n| Existing contract or rule | Primary owner | Important consumers | Ownership note |\n|---|---|---|---|\n| [Workflow Stage Operation Contract](../agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |\n| [FlowDefinition Contract](../agent-coordination/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |\n| [CoordinationSession Contract](../agent-coordination/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |\n| Assignment section of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |\n| Run section of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |\n| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](../agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |\n| [Dispatch Control Plane](../agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |\n| [Evidence And Result Architecture](../agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |\n| [Work Integration Boundaries](../agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |\n| [Visibility And Herdr](../agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |\n| [ADR-007 Domain Harness Seam](../agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |\n| Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |\n| Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |\n| Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |\n\nTwo contract files deserve special care:\n\n1. `assignment-run-runresult.md` is a chain contract, not a single-component\n   ownership contract. Assignment, Run, and RunResult should remain separate\n   authority boundaries even if they are documented together.\n2. `flow-definition.md` carries policy and evidence requirement fields, but\n   those are declared requirements. Effective provider/model resolution belongs\n   to Dispatch And Execution, and confidence computation belongs to the Run\n   Result Evaluator.\n\nThree coding-domain sources deserve the same treatment:\n\n1. `domains/coding/workflows/feature.yaml` is the source for the feature\n   workflow's legal stage operations. `planning.validate-plan` should be read\n   from here before any architectural question is asked.\n2. `domains/coding/task-specs/*.md` are the task contracts. They should carry\n   collaboration triggers and return-shape expectations.\n3. `domains/coding/skills/*` are executor doctrine. They can describe how to do\n   the work, but they do not own lifecycle movement or dispatch governance.",
    "text": "## 7. Contract Authority Matrix",
    "ancestry": [
      "fgOS Component Boundary Advisory"
    ],
    "path": "docs/architect/component-boundary/component-boundary-advisory.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "7. Contract Authority Matrix",
    "anchor": "7-contract-authority-matrix",
    "githubAnchor": "7-contract-authority-matrix",
    "stableAnchor": "h-07ffc80a3f93",
    "startLine": 381,
    "endLine": 381,
    "textDigest": "1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c",
    "sample": "7. Contract Authority Matrix",
    "sectionPayloadDigest": "79fa3ff145b22bc40113febe7e716cb940d792e1155830ca3192a4dec4ce4e71",
    "followingBlockDigest": "624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f",
    "identityFingerprint": "2bfc54facfd117c1072a54083b1d382820bbd59b390d3a0d26e2ca5c3927487a",
    "sectionText": "#### 7. Contract Authority Matrix\n\nThe existing contracts should be read as shared system contracts with explicit\ncomponent ownership. A document may describe a chain across components, but the\nauthority for each decision should still belong to one component.\n\nIn this advisory, a contract is not a component. A contract is the public\ninterface, schema, or invariant owned by the component that controls the\nbehavior. Other components interact through that contract and must not\nre-derive it privately.\n\n| Existing contract or rule | Primary owner | Important consumers | Ownership note |\n|---|---|---|---|\n| [Workflow Stage Operation Contract](agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |\n| [FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |\n| [CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |\n| Assignment section of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |\n| Run section of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |\n| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |\n| [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |\n| [Evidence And Result Architecture](agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |\n| [Work Integration Boundaries](agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |\n| [Visibility And Herdr](agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |\n| [ADR-007 Domain Harness Seam](agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |\n| Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |\n| Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |\n| Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |\n\nTwo contract files deserve special care:\n\n1. `assignment-run-runresult.md` is a chain contract, not a single-component\n   ownership contract. Assignment, Run, and RunResult should remain separate\n   authority boundaries even if they are documented together.\n2. `flow-definition.md` carries policy and evidence requirement fields, but\n   those are declared requirements. Effective provider/model resolution belongs\n   to Dispatch And Execution, and confidence computation belongs to the Run\n   Result Evaluator.\n\nThree coding-domain sources deserve the same treatment:\n\n1. `domains/coding/workflows/feature.yaml` is the source for the feature\n   workflow's legal stage operations. `planning.validate-plan` should be read\n   from here before any architectural question is asked.\n2. `domains/coding/task-specs/*.md` are the task contracts. They should carry\n   collaboration triggers and return-shape expectations.\n3. `domains/coding/skills/*` are executor doctrine. They can describe how to do\n   the work, but they do not own lifecycle movement or dispatch governance.",
    "text": "#### 7. Contract Authority Matrix",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ],
    "path": "docs/platform/component-boundary.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/26/facts",
    "sha256": "e1884be98affee23872f7d03af7358f1a22275ce67ff735effca8cad90dfc4a6"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-28

```json
{
  "entryId": "rationale-28",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-08-component-authority-boundary-map.json",
  "collection": "claims",
  "claimId": "claim_c1741ef08c45e88d276f75b668de7452",
  "before": {
    "claimId": "claim_c1741ef08c45e88d276f75b668de7452",
    "sourceUnitDigest": "2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872",
    "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
    "targetAnchor": "component-authority-boundary-map",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/architect/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872.\nTarget: docs/platform/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e at 19ca8de23908e161c34c91626e41041b7813167c.\nLinks: source 9, target 10; 10 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"original source\" (../../architect/proposals/component-authority-boundary-map.md); resolved none → docs/architect/proposals/component-authority-boundary-map.md.\nLink 2: \"Step 09 Group Thinking Substrate\" (step-09-group-thinking-substrate.md) → \"Step 09 Group Thinking Substrate\" (../../architect/proposals/step-09-group-thinking-substrate.md); resolved docs/architect/proposals/step-09-group-thinking-substrate.md → docs/architect/proposals/step-09-group-thinking-substrate.md.\nLink 3: \"Step 10 Coding Domain Adoption\" (step-10-coding-domain-adoption.md) → \"Step 10 Coding Domain Adoption\" (../../architect/proposals/step-10-coding-domain-adoption.md); resolved docs/architect/proposals/step-10-coding-domain-adoption.md → docs/architect/proposals/step-10-coding-domain-adoption.md.\nLink 4: \"Agent Coordination Vision\" (../agent-coordination/vision.md) → \"Agent Coordination Vision\" (../../architect/agent-coordination/vision.md); resolved docs/architect/agent-coordination/vision.md → docs/architect/agent-coordination/vision.md.\nLink 5: \"Intent Preservation Ledger\" (../agent-coordination/intent-preservation-ledger.md) → \"Intent Preservation Ledger\" (../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md); resolved docs/architect/agent-coordination/intent-preservation-ledger.md → docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md.\nLink 6: \"Architecture Intent\" (../architecture-intent.md) → \"Architecture Intent\" (../../architect/architecture-intent.md); resolved docs/architect/architecture-intent.md → docs/architect/architecture-intent.md.\nLink 7: \"Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"Component Boundary Advisory\" (../../architect/component-boundary/component-boundary-advisory.md); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/architect/component-boundary/component-boundary-advisory.md.\nLink 8: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nLink 9: \"Host Invocation And Provider Routing\" (../host-invocation-routing/host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../../architect/host-invocation-routing/host-invocation-provider-routing.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/architect/host-invocation-routing/host-invocation-provider-routing.md.\nLink 10: \"Node To Rust Component Migration\" (../host-invocation-routing/node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (../../architect/host-invocation-routing/node-to-rust-component-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/architect/host-invocation-routing/node-to-rust-component-migration.md.\nHeading depth: 1 → 1; title \"Component Authority Boundary Map\" → \"Component Authority Boundary Map\".\nWhole direct section differs; depth 1 → 1; 10 distinct link changes; normalized line order differs; 0 removed and 20 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 1 → 1, title \"Component Authority Boundary Map\" → \"Component Authority Boundary Map\"; 10 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order differs; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Candidate additions/corrections are explicitly labelled in the direct section: [\"```txt\",\"Document type: Proposal\",\"Audience: Human reviewer, architect, maintainer, agent\",\"Purpose: Preserve mapped source text for independent conservation review\",\"Design status: Candidate\",\"Implementation: Source snapshot retained; current implementation truth not certified\",\"Provenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\",\"Writer type: Agent draft writer\",\"Canonical: No\",\"Canonical for: Nothing; non-canonical candidate conservation carrier\",\"Use this when: Reviewing source carriage, placement, intent and provenance\",\"Do not use this for: Current authority, implementation proof or cutover approval\",\"Last reviewed: Pending independent review\",\"Related:\",\"- docs/architect/proposals/component-authority-boundary-map.md\",\"Supersedes: None; legacy source remains intact\",\"Superseded by: None\",\"```\",\"Added in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\",\"Source relationship: <link>.\"]. Added lines are authenticated contributions from sibling source-unit bindings: docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map, docs/architect/proposals/component-authority-boundary-map.md#2-organizing-formula. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-08-component-authority-boundary-map.json; exact section delta: removed []; added [\"```txt\",\"Document type: Proposal\",\"Audience: Human reviewer, architect, maintainer, agent\",\"Purpose: Preserve mapped source text for independent conservation review\",\"Design status: Candidate\",\"Implementation: Source snapshot retained; current implementation truth not certified\",\"Provenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\",\"Writer type: Agent draft writer\",\"Canonical: No\",\"Canonical for: Nothing; non-canonical candidate conservation carrier\",\"Use this when: Reviewing source carriage, placement, intent and provenance\",\"Do not use this for: Current authority, implementation proof or cutover approval\",\"Last reviewed: Pending independent review\",\"Related:\",\"- docs/architect/proposals/component-authority-boundary-map.md\",\"Supersedes: None; legacy source remains intact\",\"Superseded by: None\",\"```\",\"Added in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\",\"Source relationship: <link>.\"]. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nRelated binding evidence docs/platform/component-boundary.md:14: \"- docs/architect/proposals/component-authority-boundary-map.md\".\nRelated binding evidence docs/platform/component-boundary.md:46: \"| [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |\".\nRelated binding evidence docs/platform/component-boundary.md:97: \"| draft authority map | [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) |\".\nRelated binding evidence docs/platform/component-boundary.md:518: \"                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);\".\nDisposition supersede: Account for docs/architect/proposals/component-authority-boundary-map.md#component-authority-boundary-map under docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map; source context \"component-authority-boundary-map\", target context \"component-authority-boundary-map\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e",
    "targetAncestry": []
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_c1741ef08c45e88d276f75b668de7452",
    "sourceUnitDigest": "2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872",
    "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
    "targetAnchor": "component-authority-boundary-map",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872.\nTarget: docs/platform/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 9, target 10; 10 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"original source\" (../../architect/proposals/component-authority-boundary-map.md); resolved none → docs/architect/proposals/component-authority-boundary-map.md.\nLink 2: \"Step 09 Group Thinking Substrate\" (step-09-group-thinking-substrate.md) → \"Step 09 Group Thinking Substrate\" (../../architect/proposals/step-09-group-thinking-substrate.md); resolved docs/architect/proposals/step-09-group-thinking-substrate.md → docs/architect/proposals/step-09-group-thinking-substrate.md.\nLink 3: \"Step 10 Coding Domain Adoption\" (step-10-coding-domain-adoption.md) → \"Step 10 Coding Domain Adoption\" (../../architect/proposals/step-10-coding-domain-adoption.md); resolved docs/architect/proposals/step-10-coding-domain-adoption.md → docs/architect/proposals/step-10-coding-domain-adoption.md.\nLink 4: \"Agent Coordination Vision\" (../agent-coordination/vision.md) → \"Agent Coordination Vision\" (../../architect/agent-coordination/vision.md); resolved docs/architect/agent-coordination/vision.md → docs/architect/agent-coordination/vision.md.\nLink 5: \"Intent Preservation Ledger\" (../agent-coordination/intent-preservation-ledger.md) → \"Intent Preservation Ledger\" (../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md); resolved docs/architect/agent-coordination/intent-preservation-ledger.md → docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md.\nLink 6: \"Architecture Intent\" (../architecture-intent.md) → \"Architecture Intent\" (../../architect/architecture-intent.md); resolved docs/architect/architecture-intent.md → docs/architect/architecture-intent.md.\nLink 7: \"Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"Component Boundary Advisory\" (../../architect/component-boundary/component-boundary-advisory.md); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/architect/component-boundary/component-boundary-advisory.md.\nLink 8: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nLink 9: \"Host Invocation And Provider Routing\" (../host-invocation-routing/host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../../architect/host-invocation-routing/host-invocation-provider-routing.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/architect/host-invocation-routing/host-invocation-provider-routing.md.\nLink 10: \"Node To Rust Component Migration\" (../host-invocation-routing/node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (../../architect/host-invocation-routing/node-to-rust-component-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/architect/host-invocation-routing/node-to-rust-component-migration.md.\nHeading depth: 1 → 1; title \"Component Authority Boundary Map\" → \"Component Authority Boundary Map\".\nWhole direct section differs; depth 1 → 1; 10 distinct link changes; normalized line order differs; 0 removed and 20 added nonblank lines after heading/link/correction normalization.\nSection accounting (additive-candidate-section): Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed []; added [\"```txt\",\"Document type: Proposal\",\"Audience: Human reviewer, architect, maintainer, agent\",\"Purpose: Preserve mapped source text for independent conservation review\",\"Design status: Candidate\",\"Implementation: Source snapshot retained; current implementation truth not certified\",\"Provenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\",\"Writer type: Agent draft writer\",\"Canonical: No\",\"Canonical for: Nothing; non-canonical candidate conservation carrier\",\"Use this when: Reviewing source carriage, placement, intent and provenance\",\"Do not use this for: Current authority, implementation proof or cutover approval\",\"Last reviewed: Pending independent review\",\"Related:\",\"- docs/architect/proposals/component-authority-boundary-map.md\",\"Supersedes: None; legacy source remains intact\",\"Superseded by: None\",\"```\",\"Added in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\",\"Source relationship: <link>.\"].\nApplicable labelled corrections: none in this bound unit.\nRelated binding evidence docs/platform/component-boundary.md:14: \"- docs/architect/proposals/component-authority-boundary-map.md\".\nRelated binding evidence docs/platform/component-boundary.md:46: \"| [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |\".\nRelated binding evidence docs/platform/component-boundary.md:97: \"| draft authority map | [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) |\".\nRelated binding evidence docs/platform/component-boundary.md:518: \"                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);\".\nDisposition supersede: Account for docs/architect/proposals/component-authority-boundary-map.md#component-authority-boundary-map under docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map; source context \"component-authority-boundary-map\", target context \"component-authority-boundary-map\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e",
    "targetAncestry": []
  },
  "currentDecision": {
    "claimId": "claim_c1741ef08c45e88d276f75b668de7452",
    "sourceUnitDigest": "2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872",
    "targetOwner": "docs/platform/proposals/component-authority-boundary-map.md",
    "targetAnchor": "component-authority-boundary-map",
    "claimKind": "contract",
    "disposition": "supersede",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/architect/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872.\nTarget: docs/platform/proposals/component-authority-boundary-map.md:1-1#component-authority-boundary-map (current lines); unit SHA256 a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e.\nSource and target unit digests differ.\nTarget unchanged since last reviewed digest a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 9, target 10; 10 changed spellings/labels, 1 destination changes; 1 added, 0 removed.\nLink 1: \"none\" (none) → \"original source\" (../../architect/proposals/component-authority-boundary-map.md); resolved none → docs/architect/proposals/component-authority-boundary-map.md.\nLink 2: \"Step 09 Group Thinking Substrate\" (step-09-group-thinking-substrate.md) → \"Step 09 Group Thinking Substrate\" (../../architect/proposals/step-09-group-thinking-substrate.md); resolved docs/architect/proposals/step-09-group-thinking-substrate.md → docs/architect/proposals/step-09-group-thinking-substrate.md.\nLink 3: \"Step 10 Coding Domain Adoption\" (step-10-coding-domain-adoption.md) → \"Step 10 Coding Domain Adoption\" (../../architect/proposals/step-10-coding-domain-adoption.md); resolved docs/architect/proposals/step-10-coding-domain-adoption.md → docs/architect/proposals/step-10-coding-domain-adoption.md.\nLink 4: \"Agent Coordination Vision\" (../agent-coordination/vision.md) → \"Agent Coordination Vision\" (../../architect/agent-coordination/vision.md); resolved docs/architect/agent-coordination/vision.md → docs/architect/agent-coordination/vision.md.\nLink 5: \"Intent Preservation Ledger\" (../agent-coordination/intent-preservation-ledger.md) → \"Intent Preservation Ledger\" (../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md); resolved docs/architect/agent-coordination/intent-preservation-ledger.md → docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md.\nLink 6: \"Architecture Intent\" (../architecture-intent.md) → \"Architecture Intent\" (../../architect/architecture-intent.md); resolved docs/architect/architecture-intent.md → docs/architect/architecture-intent.md.\nLink 7: \"Component Boundary Advisory\" (../component-boundary/component-boundary-advisory.md) → \"Component Boundary Advisory\" (../../architect/component-boundary/component-boundary-advisory.md); resolved docs/architect/component-boundary/component-boundary-advisory.md → docs/architect/component-boundary/component-boundary-advisory.md.\nLink 8: \"Repo Layout Vision\" (../component-boundary/repo-layout-vision.md) → \"Repo Layout Vision\" (../../architect/component-boundary/repo-layout-vision.md); resolved docs/architect/component-boundary/repo-layout-vision.md → docs/architect/component-boundary/repo-layout-vision.md.\nLink 9: \"Host Invocation And Provider Routing\" (../host-invocation-routing/host-invocation-provider-routing.md) → \"Host Invocation And Provider Routing\" (../../architect/host-invocation-routing/host-invocation-provider-routing.md); resolved docs/architect/host-invocation-routing/host-invocation-provider-routing.md → docs/architect/host-invocation-routing/host-invocation-provider-routing.md.\nLink 10: \"Node To Rust Component Migration\" (../host-invocation-routing/node-to-rust-component-migration.md) → \"Node To Rust Component Migration\" (../../architect/host-invocation-routing/node-to-rust-component-migration.md); resolved docs/architect/host-invocation-routing/node-to-rust-component-migration.md → docs/architect/host-invocation-routing/node-to-rust-component-migration.md.\nHeading depth: 1 → 1; title \"Component Authority Boundary Map\" → \"Component Authority Boundary Map\".\nWhole direct section differs; depth 1 → 1; 10 distinct link changes; normalized line order differs; 0 removed and 20 added nonblank lines after heading/link/correction normalization.\nSection accounting (additive-candidate-section): Added lines are explicit candidate declarations or labelled corrections in the bound target; these are additions, not source-carriage evidence.  Exact normalized nonblank line delta: removed []; added [\"```txt\",\"Document type: Proposal\",\"Audience: Human reviewer, architect, maintainer, agent\",\"Purpose: Preserve mapped source text for independent conservation review\",\"Design status: Candidate\",\"Implementation: Source snapshot retained; current implementation truth not certified\",\"Provenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\",\"Writer type: Agent draft writer\",\"Canonical: No\",\"Canonical for: Nothing; non-canonical candidate conservation carrier\",\"Use this when: Reviewing source carriage, placement, intent and provenance\",\"Do not use this for: Current authority, implementation proof or cutover approval\",\"Last reviewed: Pending independent review\",\"Related:\",\"- docs/architect/proposals/component-authority-boundary-map.md\",\"Supersedes: None; legacy source remains intact\",\"Superseded by: None\",\"```\",\"Added in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\",\"Source relationship: <link>.\"].\nApplicable labelled corrections: none in this bound unit.\nRelated binding evidence docs/platform/component-boundary.md:14: \"- docs/architect/proposals/component-authority-boundary-map.md\".\nRelated binding evidence docs/platform/component-boundary.md:46: \"| [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |\".\nRelated binding evidence docs/platform/component-boundary.md:97: \"| draft authority map | [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) |\".\nRelated binding evidence docs/platform/component-boundary.md:518: \"                          [Component Authority Boundary Map §13](../architect/proposals/component-authority-boundary-map.md#13-draft-ports);\".\nDisposition supersede: Account for docs/architect/proposals/component-authority-boundary-map.md#component-authority-boundary-map under docs/platform/proposals/component-authority-boundary-map.md#component-authority-boundary-map; source context \"component-authority-boundary-map\", target context \"component-authority-boundary-map\". The bound heading title, depth or directly following payload differs; the heading is not an equal-digest copy.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e",
    "targetAncestry": []
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Authority Boundary Map",
    "anchor": "component-authority-boundary-map",
    "githubAnchor": "component-authority-boundary-map",
    "stableAnchor": "h-b63ba0b08ef7",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "2e1bf1c32aef1b208e6145a9016e75a6c3cdc39dbc2f7124cb23ec012a4f2872",
    "sample": "Component Authority Boundary Map",
    "sectionPayloadDigest": "f803e72921b475b1a1c7d6e813238314618a3f97d8e7e975223cd9674ab5f37c",
    "followingBlockDigest": "f803e72921b475b1a1c7d6e813238314618a3f97d8e7e975223cd9674ab5f37c",
    "identityFingerprint": "f29334ed0acf79f63084db3bc67c773f422bd096b7fe475b53b77b314ea41cd9",
    "sectionText": "# Component Authority Boundary Map\n\nDocument type: Proposal artifact\nDesign status: Draft / architect-level discussion\nImplementation: Not started\nLast reviewed: 2026-09-02\nCanonical for: nothing until promoted or replaced by an accepted boundary document\nRelated: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md), [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md), [Agent Coordination Vision](../agent-coordination/vision.md), [Intent Preservation Ledger](../agent-coordination/intent-preservation-ledger.md), [Architecture Intent](../architecture-intent.md), [Component Boundary Advisory](../component-boundary/component-boundary-advisory.md), [Repo Layout Vision](../component-boundary/repo-layout-vision.md), [Host Invocation And Provider Routing](../host-invocation-routing/host-invocation-provider-routing.md), [Node To Rust Component Migration](../host-invocation-routing/node-to-rust-component-migration.md)",
    "text": "# Component Authority Boundary Map",
    "ancestry": [],
    "path": "docs/architect/proposals/component-authority-boundary-map.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Authority Boundary Map",
    "anchor": "component-authority-boundary-map",
    "githubAnchor": "component-authority-boundary-map",
    "stableAnchor": "h-b63ba0b08ef7",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "a037734758fe338df958d787c389a2ceeeedeb87a6402677a3803484a3fefe5e",
    "sample": "Component Authority Boundary Map",
    "sectionPayloadDigest": "1e682efe2674d579f94aceb916276b3134cd7e0754a16ab2e92f8c76cba971bf",
    "followingBlockDigest": "44af44d95a1b9708d2ce46e0d0b0b294c7063a53456ac8c2fcee7e2377ecb155",
    "identityFingerprint": "6b5699e28981b986877da4ddd61f07b5829ac5ee7cd26287a9b468aca231006d",
    "sectionText": "# Component Authority Boundary Map\n\n```txt\nDocument type: Proposal\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/proposals/component-authority-boundary-map.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 2f1d0c94a40f1426c0d6b221abb35b379deb9ba7\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/proposals/component-authority-boundary-map.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep map proposal. No component-boundary change; no promotion of draft ports or ownership. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../architect/proposals/component-authority-boundary-map.md).\n\n\nDocument type: Proposal artifact\nDesign status: Draft / architect-level discussion\nImplementation: Not started\nLast reviewed: 2026-09-02\nCanonical for: nothing until promoted or replaced by an accepted boundary document\nRelated: [Step 09 Group Thinking Substrate](../../architect/proposals/step-09-group-thinking-substrate.md), [Step 10 Coding Domain Adoption](../../architect/proposals/step-10-coding-domain-adoption.md), [Agent Coordination Vision](../../architect/agent-coordination/vision.md), [Intent Preservation Ledger](../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md), [Architecture Intent](../../architect/architecture-intent.md), [Component Boundary Advisory](../../architect/component-boundary/component-boundary-advisory.md), [Repo Layout Vision](../../architect/component-boundary/repo-layout-vision.md), [Host Invocation And Provider Routing](../../architect/host-invocation-routing/host-invocation-provider-routing.md), [Node To Rust Component Migration](../../architect/host-invocation-routing/node-to-rust-component-migration.md)",
    "text": "# Component Authority Boundary Map",
    "ancestry": [],
    "path": "docs/platform/proposals/component-authority-boundary-map.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/27/facts",
    "sha256": "f39d94327283e91ab1f7c06aee57ff6e80eab16ea81b35ed05074601871d5470"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-29

```json
{
  "entryId": "rationale-29",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_cd345b6c8a7da2451c2acf04ba8c5292",
  "before": {
    "claimId": "claim_cd345b6c8a7da2451c2acf04ba8c5292",
    "sourceUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "87-bảng-tình-huống-chuẩn",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1122-1122#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nTarget: docs/platform/agent-confinement/spec.md:388-388#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"8.7 Bảng tình huống chuẩn\" → \"8.7 Bảng tình huống chuẩn\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"8.7 Bảng tình huống chuẩn\" → \"8.7 Bảng tình huống chuẩn\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#87-bảng-tình-huống-chuẩn under docs/platform/agent-confinement/spec.md#87-bảng-tình-huống-chuẩn; source context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\", target context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_cd345b6c8a7da2451c2acf04ba8c5292",
    "sourceUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "87-bảng-tình-huống-chuẩn",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1122-1122#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nTarget: docs/platform/agent-confinement/spec.md:388-388#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"8.7 Bảng tình huống chuẩn\" → \"8.7 Bảng tình huống chuẩn\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#87-bảng-tình-huống-chuẩn under docs/platform/agent-confinement/spec.md#87-bảng-tình-huống-chuẩn; source context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\", target context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ]
  },
  "currentDecision": {
    "claimId": "claim_cd345b6c8a7da2451c2acf04ba8c5292",
    "sourceUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "87-bảng-tình-huống-chuẩn",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1122-1122#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nTarget: docs/platform/agent-confinement/spec.md:388-388#87-bảng-tình-huống-chuẩn (current lines); unit SHA256 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"8.7 Bảng tình huống chuẩn\" → \"8.7 Bảng tình huống chuẩn\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#87-bảng-tình-huống-chuẩn under docs/platform/agent-confinement/spec.md#87-bảng-tình-huống-chuẩn; source context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\", target context \"Spec: Agent Confinement Authority / 8. Policy resolution và edge cases\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "8.7 Bảng tình huống chuẩn",
    "anchor": "87-bảng-tình-huống-chuẩn",
    "githubAnchor": "87-bảng-tình-huống-chuẩn",
    "stableAnchor": "h-f2fbabe764f6",
    "startLine": 1122,
    "endLine": 1122,
    "textDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "sample": "8.7 Bảng tình huống chuẩn",
    "sectionPayloadDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "followingBlockDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "identityFingerprint": "b55911020c4482a87485361aa15523e898ae2eb3f77f8a61a6938dce6b8d6bd0",
    "sectionText": "### 8.7 Bảng tình huống chuẩn\n\n| Tình huống | Trước spawn | Kết quả cuối |\n|---|---|---|\n| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |\n| Required, proof stale | tự refresh probe trước spawn | pass thì execute; fail/timeout thì refused |\n| Preferred, thiếu network protection nhưng đủ needs | ghi degrade rồi execute phần đã assess | degraded |\n| Preferred không backend, need private home chưa có | refuse, zero spawn | refused |\n| Grant read-write, backend chỉ read, need read | coverage/readiness satisfied | có thể enforced |\n| Grant read-write, backend chỉ read, need write | readiness unsatisfied, zero spawn | refused ở mọi mode |\n| Prepare tạo resource rồi Authority crash | phục hồi theo profile (local marker hoặc journal) | unknown tới khi recovery có bằng chứng |\n| Remote mất kết nối sau started | không suy đã dừng | failed/unknown, cleanup pending |\n| Collect artifact thất bại | agent đã chạy, không refusal hồi tố | failed, giữ resource để thu lại |",
    "text": "### 8.7 Bảng tình huống chuẩn",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "8.7 Bảng tình huống chuẩn",
    "anchor": "87-bảng-tình-huống-chuẩn",
    "githubAnchor": "87-bảng-tình-huống-chuẩn",
    "stableAnchor": "h-2639919a78c0",
    "startLine": 388,
    "endLine": 388,
    "textDigest": "951028a48688bf9bf121f61795876c4aa5bbe52d0dd58383dbb76608271980f9",
    "sample": "8.7 Bảng tình huống chuẩn",
    "sectionPayloadDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "followingBlockDigest": "0ef8d6c210698ac4fae241e133b626be662e36e1023900186b541f3f7d0e27b8",
    "identityFingerprint": "b55911020c4482a87485361aa15523e898ae2eb3f77f8a61a6938dce6b8d6bd0",
    "sectionText": "### 8.7 Bảng tình huống chuẩn\n\n| Tình huống | Trước spawn | Kết quả cuối |\n|---|---|---|\n| Required, đủ coverage/readiness/proof | prepare rồi execute | enforced khi receipt/evidence khớp |\n| Required, proof stale | tự refresh probe trước spawn | pass thì execute; fail/timeout thì refused |\n| Preferred, thiếu network protection nhưng đủ needs | ghi degrade rồi execute phần đã assess | degraded |\n| Preferred không backend, need private home chưa có | refuse, zero spawn | refused |\n| Grant read-write, backend chỉ read, need read | coverage/readiness satisfied | có thể enforced |\n| Grant read-write, backend chỉ read, need write | readiness unsatisfied, zero spawn | refused ở mọi mode |\n| Prepare tạo resource rồi Authority crash | phục hồi theo profile (local marker hoặc journal) | unknown tới khi recovery có bằng chứng |\n| Remote mất kết nối sau started | không suy đã dừng | failed/unknown, cleanup pending |\n| Collect artifact thất bại | agent đã chạy, không refusal hồi tố | failed, giữ resource để thu lại |",
    "text": "### 8.7 Bảng tình huống chuẩn",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "8. Policy resolution và edge cases"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/28/facts",
    "sha256": "b075e133af9dc252984e5d605e0a324bd770d1a1ceb2b98db5381a0556263f7f"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-30

```json
{
  "entryId": "rationale-30",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_9a1cd05f74418890fbca8955aa76b378",
  "before": {
    "claimId": "claim_9a1cd05f74418890fbca8955aa76b378",
    "sourceUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "9-default-implementation-đầu-tiên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1136-1136#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nTarget: docs/platform/agent-confinement/spec.md:402-402#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"9. Default implementation đầu tiên\" → \"9. Default implementation đầu tiên\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"9. Default implementation đầu tiên\" → \"9. Default implementation đầu tiên\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#9-default-implementation-đầu-tiên under docs/platform/agent-confinement/spec.md#9-default-implementation-đầu-tiên; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_9a1cd05f74418890fbca8955aa76b378",
    "sourceUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "9-default-implementation-đầu-tiên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1136-1136#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nTarget: docs/platform/agent-confinement/spec.md:402-402#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"9. Default implementation đầu tiên\" → \"9. Default implementation đầu tiên\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#9-default-implementation-đầu-tiên under docs/platform/agent-confinement/spec.md#9-default-implementation-đầu-tiên; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  },
  "currentDecision": {
    "claimId": "claim_9a1cd05f74418890fbca8955aa76b378",
    "sourceUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "9-default-implementation-đầu-tiên",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1136-1136#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nTarget: docs/platform/agent-confinement/spec.md:402-402#9-default-implementation-đầu-tiên (current lines); unit SHA256 e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"9. Default implementation đầu tiên\" → \"9. Default implementation đầu tiên\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#9-default-implementation-đầu-tiên under docs/platform/agent-confinement/spec.md#9-default-implementation-đầu-tiên; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "9. Default implementation đầu tiên",
    "anchor": "9-default-implementation-đầu-tiên",
    "githubAnchor": "9-default-implementation-đầu-tiên",
    "stableAnchor": "h-21e1e90de204",
    "startLine": 1136,
    "endLine": 1136,
    "textDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "sample": "9. Default implementation đầu tiên",
    "sectionPayloadDigest": "49471d5985582ee18e2f411316b9a6c1d1af355e47e358552c873f94c98d71d9",
    "followingBlockDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
    "identityFingerprint": "768d935e7d93a151a0f2197a91015d239e9449206b53b0e43ce2720c1d81156a",
    "sectionText": "## 9. Default implementation đầu tiên\n\nDefault nhỏ nhất có ích:\n\n1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine\n   registry.\n2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):\n   `hostWrite: deny`; host-write-denied cấp `run-output` và backend-managed\n   `private-home`; read grant `executor-credentials`;\n   `hostRead/networkEgress/process` lần lượt cho phép `allow/allow/host` và\n   không được trình bày như restriction;\n   workspace-write thêm workspace/git-metadata grant theo ownership/readiness;\n   private home tùy nhu cầu provider, không là control bắt buộc của built-in;\n   private home cho Codex được provider normalizer diễn tả bằng resource binding\n   chuẩn, backend không biết đó là Codex.\n3. Migration ba executor bwrap khỏi argv hardcode; mỗi executor tham chiếu\n   singular backend instance `bwrap`.\n4. Giữ tên `claude-bwrap`, `agy-bwrap`, `codex-bwrap` để không phá evidence\n   trail và capability binding.\n5. Shape cũ của herdr được normalize và đi qua cùng Authority. Việc di dời\n   provisioning khỏi `herdr-round.mjs` có thể ship sau, nhưng chưa di dời xong\n   thì maturity một cửa chỉ được ghi là `partial`.\n6. Mọi capability committed phải khai policy ID hoặc `unconfined` trước khi bật\n   strict mode.\n\nTrong default, host-write-denied giữ workspace read-only; workspace-write cho\nsửa workspace đã cấp. Capability execute/stage implement phải được migrate sang\nprofile có backend phù hợp trước strict flip; không đổi sang unconfined chỉ để\nqua gate. Git commit readiness là kiểm tra riêng như §6.3.\n\nDefault chưa cần network firewall, secret filtering, macOS/container/remote\nbackend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor.",
    "text": "## 9. Default implementation đầu tiên",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "9. Default implementation đầu tiên",
    "anchor": "9-default-implementation-đầu-tiên",
    "githubAnchor": "9-default-implementation-đầu-tiên",
    "stableAnchor": "h-e592dd069194",
    "startLine": 402,
    "endLine": 402,
    "textDigest": "e78c37d28fb7fbf09e1c978624d56d78b442c8082d44b3b19c61e9be95642831",
    "sample": "9. Default implementation đầu tiên",
    "sectionPayloadDigest": "49471d5985582ee18e2f411316b9a6c1d1af355e47e358552c873f94c98d71d9",
    "followingBlockDigest": "f0aa8cea776fc1a9bd023b6e3e1318c7c9c16589a68d5ac16288b63f23634cbb",
    "identityFingerprint": "768d935e7d93a151a0f2197a91015d239e9449206b53b0e43ce2720c1d81156a",
    "sectionText": "## 9. Default implementation đầu tiên\n\nDefault nhỏ nhất có ích:\n\n1. Một backend driver `bwrap` và một backend instance `bwrap` trong machine\n   registry.\n2. Hai built-in policy `host-write-denied` và `workspace-write` (§6.2):\n   `hostWrite: deny`; host-write-denied cấp `run-output` và backend-managed\n   `private-home`; read grant `executor-credentials`;\n   `hostRead/networkEgress/process` lần lượt cho phép `allow/allow/host` và\n   không được trình bày như restriction;\n   workspace-write thêm workspace/git-metadata grant theo ownership/readiness;\n   private home tùy nhu cầu provider, không là control bắt buộc của built-in;\n   private home cho Codex được provider normalizer diễn tả bằng resource binding\n   chuẩn, backend không biết đó là Codex.\n3. Migration ba executor bwrap khỏi argv hardcode; mỗi executor tham chiếu\n   singular backend instance `bwrap`.\n4. Giữ tên `claude-bwrap`, `agy-bwrap`, `codex-bwrap` để không phá evidence\n   trail và capability binding.\n5. Shape cũ của herdr được normalize và đi qua cùng Authority. Việc di dời\n   provisioning khỏi `herdr-round.mjs` có thể ship sau, nhưng chưa di dời xong\n   thì maturity một cửa chỉ được ghi là `partial`.\n6. Mọi capability committed phải khai policy ID hoặc `unconfined` trước khi bật\n   strict mode.\n\nTrong default, host-write-denied giữ workspace read-only; workspace-write cho\nsửa workspace đã cấp. Capability execute/stage implement phải được migrate sang\nprofile có backend phù hợp trước strict flip; không đổi sang unconfined chỉ để\nqua gate. Git commit readiness là kiểm tra riêng như §6.3.\n\nDefault chưa cần network firewall, secret filtering, macOS/container/remote\nbackend, generic composition cho mọi tổ hợp control, hoặc đổi tên executor.",
    "text": "## 9. Default implementation đầu tiên",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/29/facts",
    "sha256": "6e16ab51a7585ef70194c50c1ca39d919519c1a8f65c33fdd4bb83d12977556e"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-31

```json
{
  "entryId": "rationale-31",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_2c080a72c195a28a1ca8efb0e1187f11",
  "before": {
    "claimId": "claim_2c080a72c195a28a1ca8efb0e1187f11",
    "sourceUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "91-support-matrix-của-default",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1169-1169#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nTarget: docs/platform/agent-confinement/spec.md:435-435#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.1 Support matrix của default\" → \"9.1 Support matrix của default\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"9.1 Support matrix của default\" → \"9.1 Support matrix của default\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#91-support-matrix-của-default under docs/platform/agent-confinement/spec.md#91-support-matrix-của-default; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_2c080a72c195a28a1ca8efb0e1187f11",
    "sourceUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "91-support-matrix-của-default",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1169-1169#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nTarget: docs/platform/agent-confinement/spec.md:435-435#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.1 Support matrix của default\" → \"9.1 Support matrix của default\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#91-support-matrix-của-default under docs/platform/agent-confinement/spec.md#91-support-matrix-của-default; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "currentDecision": {
    "claimId": "claim_2c080a72c195a28a1ca8efb0e1187f11",
    "sourceUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "91-support-matrix-của-default",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1169-1169#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nTarget: docs/platform/agent-confinement/spec.md:435-435#91-support-matrix-của-default (current lines); unit SHA256 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.1 Support matrix của default\" → \"9.1 Support matrix của default\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#91-support-matrix-của-default under docs/platform/agent-confinement/spec.md#91-support-matrix-của-default; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "9.1 Support matrix của default",
    "anchor": "91-support-matrix-của-default",
    "githubAnchor": "91-support-matrix-của-default",
    "stableAnchor": "h-d117a31698fd",
    "startLine": 1169,
    "endLine": 1169,
    "textDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "sample": "9.1 Support matrix của default",
    "sectionPayloadDigest": "522737e3c33717161eec1d3f662c623ea3eff73ad6688417c97ffd4930f7776c",
    "followingBlockDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
    "identityFingerprint": "a917c64b1156e5ae25343a255692b39c9f3217e14aa5af7dca047b7181375bcd",
    "sectionText": "### 9.1 Support matrix của default\n\n| Contract surface | Default v1 |\n|---|---|\n| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |\n| Invocation override | Contract đích giữ shape/partial-order; default v1 từ chối config override, dùng policy ID/capability khác — trừ một override duy nhất, `{ controls: { hostRead: 'blind' } }` (§9.2) |\n| `hostWrite` | `deny` qua bwrap, hoặc `allow` khi explicit `unconfined` |\n| Write grant | run-output, private-home khi cần; workspace/git-metadata cho workspace-write theo readiness |\n| Read grant | `executor-credentials` khi policy của dispatch yêu cầu |\n| `home` | host mặc định; private resource khi provider cần; home private nếu policy thực sự yêu cầu và đã prove |\n| `session`, `workspace` | effective value là `shared`; legacy `isolated/own` được normalize nhưng chưa di dời enforcement ở slice đầu |\n| `hostRead` | `allow`, hoặc `blind` (§9.2); request `deny` bị `unsupported` |\n| `networkEgress`, `process` | effective value là `allow`, `host`; request `deny/filtered/isolated` bị `unsupported` |\n| Resource delivery/collect | host direct/mount; copy/remote/workspace-change chưa hỗ trợ |\n| Backend | Linux bwrap; backend khác trả `unsupported` có lý do |\n\nViệc parser hiểu một field không có nghĩa backend đã support field đó. Default\nphải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua.",
    "text": "### 9.1 Support matrix của default",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "9.1 Support matrix của default",
    "anchor": "91-support-matrix-của-default",
    "githubAnchor": "91-support-matrix-của-default",
    "stableAnchor": "h-2172005193b6",
    "startLine": 435,
    "endLine": 435,
    "textDigest": "6547070a649080a9b46e64e56a74695a0a27993e07e7d917978fd4b56697af4d",
    "sample": "9.1 Support matrix của default",
    "sectionPayloadDigest": "522737e3c33717161eec1d3f662c623ea3eff73ad6688417c97ffd4930f7776c",
    "followingBlockDigest": "14f3ee1a5085e8338b27e811d4a6fdddb36726d4f98c9df86111a65f594d85fa",
    "identityFingerprint": "a917c64b1156e5ae25343a255692b39c9f3217e14aa5af7dca047b7181375bcd",
    "sectionText": "### 9.1 Support matrix của default\n\n| Contract surface | Default v1 |\n|---|---|\n| Mode | `required`, `unconfined`; `preferred` có trong contract nhưng default chưa nhận config này |\n| Invocation override | Contract đích giữ shape/partial-order; default v1 từ chối config override, dùng policy ID/capability khác — trừ một override duy nhất, `{ controls: { hostRead: 'blind' } }` (§9.2) |\n| `hostWrite` | `deny` qua bwrap, hoặc `allow` khi explicit `unconfined` |\n| Write grant | run-output, private-home khi cần; workspace/git-metadata cho workspace-write theo readiness |\n| Read grant | `executor-credentials` khi policy của dispatch yêu cầu |\n| `home` | host mặc định; private resource khi provider cần; home private nếu policy thực sự yêu cầu và đã prove |\n| `session`, `workspace` | effective value là `shared`; legacy `isolated/own` được normalize nhưng chưa di dời enforcement ở slice đầu |\n| `hostRead` | `allow`, hoặc `blind` (§9.2); request `deny` bị `unsupported` |\n| `networkEgress`, `process` | effective value là `allow`, `host`; request `deny/filtered/isolated` bị `unsupported` |\n| Resource delivery/collect | host direct/mount; copy/remote/workspace-change chưa hỗ trợ |\n| Backend | Linux bwrap; backend khác trả `unsupported` có lý do |\n\nViệc parser hiểu một field không có nghĩa backend đã support field đó. Default\nphải từ chối requirement ngoài matrix thay vì nhận rồi bỏ qua.",
    "text": "### 9.1 Support matrix của default",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/30/facts",
    "sha256": "510636f4a1e3a9244c948ee771bc272030a8b2599d98e924a7b8b6e3acd6d85a"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-32

```json
{
  "entryId": "rationale-32",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_3770d5a0b897fbd8c1393a38c48c3333",
  "before": {
    "claimId": "claim_3770d5a0b897fbd8c1393a38c48c3333",
    "sourceUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1188-1188#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nTarget: docs/platform/agent-confinement/spec.md:454-454#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.2 `hostRead: blind` — worker mù trước run state của peer\" → \"9.2 `hostRead: blind` — worker mù trước run state của peer\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 3 → 3, title \"9.2 `hostRead: blind` — worker mù trước run state của peer\" → \"9.2 `hostRead: blind` — worker mù trước run state của peer\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#92-hostread-blind-worker-mù-trước-run-state-của-peer under docs/platform/agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_3770d5a0b897fbd8c1393a38c48c3333",
    "sourceUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1188-1188#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nTarget: docs/platform/agent-confinement/spec.md:454-454#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.2 `hostRead: blind` — worker mù trước run state của peer\" → \"9.2 `hostRead: blind` — worker mù trước run state của peer\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#92-hostread-blind-worker-mù-trước-run-state-của-peer under docs/platform/agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "currentDecision": {
    "claimId": "claim_3770d5a0b897fbd8c1393a38c48c3333",
    "sourceUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1188-1188#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nTarget: docs/platform/agent-confinement/spec.md:454-454#92-hostread-blind-worker-mù-trước-run-state-của-peer (current lines); unit SHA256 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 3 → 3; title \"9.2 `hostRead: blind` — worker mù trước run state của peer\" → \"9.2 `hostRead: blind` — worker mù trước run state của peer\".\nWhole direct section equal; depth 3 → 3; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#92-hostread-blind-worker-mù-trước-run-state-của-peer under docs/platform/agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer; source context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\", target context \"Spec: Agent Confinement Authority / 9. Default implementation đầu tiên\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "targetAncestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "9.2 `hostRead: blind` — worker mù trước run state của peer",
    "anchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "githubAnchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "stableAnchor": "h-718be95031d8",
    "startLine": 1188,
    "endLine": 1188,
    "textDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "sample": "9.2 `hostRead: blind` — worker mù trước run state của peer",
    "sectionPayloadDigest": "f1f713ee056bd762d76159d50cb77c58624579c4ffce1a813b6cb3dbba6cedc6",
    "followingBlockDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
    "identityFingerprint": "c4753e3644d5a98f7a223469f8633ac752e8079e94c1c75d71af4948a1efd476",
    "sectionText": "### 9.2 `hostRead: blind` — worker mù trước run state của peer\n\n`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,\ntrừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một override\nchỉ-thu-hẹp qua slot `override` của request (Unit mang `blind: true`, mọi vai của Unit đó đều\nmù); built-in policy không đổi, không có policy ID mới. Mặc định tắt: argv của dispatch không\n`blind` giữ nguyên từng byte.\n\nVới `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn\n`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn tại;\n`--ro-bind` thư mục của chính dispatch (round dir `<assignments>/<unit run>/<role>/<round>`,\nhoặc run dir nếu không có assignment) chỉ-đọc; các mount nằm dưới mask (outbox ghi được, private\nhome); cuối cùng `--remount-ro` trên các mask. Hidden root là dữ liệu của contract\n(`BLIND_HIDDEN_ROOTS`), không phải code của driver: `{fgosDir}/assignments`,\n`{fgosDir}/workflow-runs`, `{fgosDir}/dispatch-runs` của project dispatch đang chạy, thư mục\nsocket của herdr, và confinement temp root (private home của dispatch khác, chứa transcript agent).\nResource `hidden-root` và `own-assignment` đi vào plan/attestation; attestation ghi thêm\n`requested.override`, `effectiveControls.hostRead: blind` và `hiddenRoots`.\n\nVì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file\ntracked (config, events) — che cả thư mục làm chúng hiện thành \"đã xoá\" trong trạng thái checkout,\nvà worker ghi được workspace có thể commit việc xoá đó; (2) `--unshare-pid` vì không có nó worker\nđọc được cmdline của tiến trình anh em; (3) socket herdr nằm trong danh sách vì `--ro-bind / /`\nvẫn cho `connect()`, tức worker có thể `pane read` pane của anh em. Blind chỉ dùng được khi cái\nworker *được trao* nằm sẵn trong thư mục của chính nó, nên với Unit `blind` resolver hand-off\n(`resolveUnitInputs`, `src/runner/execution/handoff-refs.mjs`) không giao đường dẫn gốc: mọi input\n`unit-run:`, `gate-answer:` và mọi ref nằm trong hidden root được chép nguyên byte (kiểm lại sha256\nlúc chép; nguồn đã đổi sau settle thì từ chối `report-changed-after-settle`) vào `inputs/` của\n*round dir của chính vai đó* (`<round>/inputs/<tên>`), vô điều kiện, không cần `anonymizeInputs`; tên\ntrung tính `seat-A...` cho input `unit-run:` khi `anonymizeInputs` bật, tên cố định `<n>-<vai>-r<vòng>`\nhoặc `<n>-gate-<bước>` nếu không. Mỗi vai một bản riêng (không chia sẻ giữa các vai của Unit), nên\nchỉ vai đó đọc được; danh sách ref của vai là các bản chép. `unit.json` giữ `resolvedInputs` (ref\nđọc được tại chỗ) và `inputMap` (nguồn, tên, sha256); resume dùng lại bản chép đã có, fallback chép\nlại vào round dir của lần thử mới. Synthesizer của pattern `panel` nhận report của panelist theo\nđúng cách đó. `blind-ref-hidden` chỉ còn cho ref không chép được.\n\nCanary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn\ntuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi herdr), glm và\ndeepseek (pi cli bwrap) đều đọc bản chép, gặp `ENOENT` ở nguồn và chỉ thấy chuỗi của chính mình\ntrong `.fgos/assignments`. Dưới `--unshare-pid` và mask thư mục socket herdr, herdr vẫn nhận ra agent\ntrong pane (`agentKnownToHerdr: detected`, trạng thái `unknown` → `working` → `idle`/kết thúc), nên\nmask và `--unshare-pid` giữ nguyên. agy chưa chứng minh được: `agy-herdr` hỏng cả khi không blind\n(`foreground process ... does not match prepared command argv`), `agy-cli-bwrap` dừng vì hết quota\ncủa tài khoản.\n\nDispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi\nspawn: `blind-requires-confinement` (mode không phải `required`/không có policy),\n`blind-in-process` (Agent tool/inline không có sandbox quanh worker; `bind()` cũng không chọn nó),\n`blind-hides-workspace` (cwd hoặc repo root nằm trong hidden root), `blind-ref-hidden` (context\nref nằm trong hidden root ngoài thư mục của chính dispatch), `confinement-backend-missing` /\n`confinement-backend-disabled` (không có bwrap), `confinement-probe-failed` (probe chưa tươi hoặc\nkhông qua). Probe `peer-run-hidden` (thứ chín, chỉ cho dispatch blind; fingerprint và cache riêng)\ndựng argv từ chính `prepareBwrap`: worker không đọc được report của peer, home của peer, cmdline\ncủa tiến trình anh em, nhưng đọc được thư mục của mình (chỉ-đọc) và ghi được outbox; falsifier bỏ\nmask thì phải đọc được file peer. `fgos doctor` báo `blind-read: pass | fail |\nbackend-unsupported` (check `confinement-blind-read`). Giới hạn còn mở: transcript agent của Lead\ntrong host home, `.fgos/secrets.local.env` và project khác (bí mật, không phải mù), và mạng\nlocalhost.",
    "text": "### 9.2 `hostRead: blind` — worker mù trước run state của peer",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "9.2 `hostRead: blind` — worker mù trước run state của peer",
    "anchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "githubAnchor": "92-hostread-blind-worker-mù-trước-run-state-của-peer",
    "stableAnchor": "h-9405ab59bf3e",
    "startLine": 454,
    "endLine": 454,
    "textDigest": "28ef20e16a5b5c8d4fe7db58cfb81fa2915a15bd591ddfbdac9094abd5cdd4bc",
    "sample": "9.2 `hostRead: blind` — worker mù trước run state của peer",
    "sectionPayloadDigest": "f1f713ee056bd762d76159d50cb77c58624579c4ffce1a813b6cb3dbba6cedc6",
    "followingBlockDigest": "cd86d66ba41c3e216cfd4d8bd8d3d67ba807275450780add3123faf7d91d35bb",
    "identityFingerprint": "c4753e3644d5a98f7a223469f8633ac752e8079e94c1c75d71af4948a1efd476",
    "sectionText": "### 9.2 `hostRead: blind` — worker mù trước run state của peer\n\n`blind` là giá trị thứ ba của trục `hostRead` (`deny > blind > allow`): host vẫn đọc được,\ntrừ run state của các dispatch khác và phiên agent đang sống. Runner gửi nó như một override\nchỉ-thu-hẹp qua slot `override` của request (Unit mang `blind: true`, mọi vai của Unit đó đều\nmù); built-in policy không đổi, không có policy ID mới. Mặc định tắt: argv của dispatch không\n`blind` giữ nguyên từng byte.\n\nVới `blind`, driver bwrap giữ `--ro-bind / /` và thêm, theo đúng thứ tự: `--unshare-pid` (ẩn\n`/proc/<pid>/cmdline` của tiến trình khác); `--tmpfs` che từng *hidden root* đang tồn tại;\n`--ro-bind` thư mục của chính dispatch (round dir `<assignments>/<unit run>/<role>/<round>`,\nhoặc run dir nếu không có assignment) chỉ-đọc; các mount nằm dưới mask (outbox ghi được, private\nhome); cuối cùng `--remount-ro` trên các mask. Hidden root là dữ liệu của contract\n(`BLIND_HIDDEN_ROOTS`), không phải code của driver: `{fgosDir}/assignments`,\n`{fgosDir}/workflow-runs`, `{fgosDir}/dispatch-runs` của project dispatch đang chạy, thư mục\nsocket của herdr, và confinement temp root (private home của dispatch khác, chứa transcript agent).\nResource `hidden-root` và `own-assignment` đi vào plan/attestation; attestation ghi thêm\n`requested.override`, `effectiveControls.hostRead: blind` và `hiddenRoots`.\n\nVì sao như vậy: (1) chỉ che ba thư mục run state chứ không che cả `.fgos`, vì `.fgos` có file\ntracked (config, events) — che cả thư mục làm chúng hiện thành \"đã xoá\" trong trạng thái checkout,\nvà worker ghi được workspace có thể commit việc xoá đó; (2) `--unshare-pid` vì không có nó worker\nđọc được cmdline của tiến trình anh em; (3) socket herdr nằm trong danh sách vì `--ro-bind / /`\nvẫn cho `connect()`, tức worker có thể `pane read` pane của anh em. Blind chỉ dùng được khi cái\nworker *được trao* nằm sẵn trong thư mục của chính nó, nên với Unit `blind` resolver hand-off\n(`resolveUnitInputs`, `src/runner/execution/handoff-refs.mjs`) không giao đường dẫn gốc: mọi input\n`unit-run:`, `gate-answer:` và mọi ref nằm trong hidden root được chép nguyên byte (kiểm lại sha256\nlúc chép; nguồn đã đổi sau settle thì từ chối `report-changed-after-settle`) vào `inputs/` của\n*round dir của chính vai đó* (`<round>/inputs/<tên>`), vô điều kiện, không cần `anonymizeInputs`; tên\ntrung tính `seat-A...` cho input `unit-run:` khi `anonymizeInputs` bật, tên cố định `<n>-<vai>-r<vòng>`\nhoặc `<n>-gate-<bước>` nếu không. Mỗi vai một bản riêng (không chia sẻ giữa các vai của Unit), nên\nchỉ vai đó đọc được; danh sách ref của vai là các bản chép. `unit.json` giữ `resolvedInputs` (ref\nđọc được tại chỗ) và `inputMap` (nguồn, tên, sha256); resume dùng lại bản chép đã có, fallback chép\nlại vào round dir của lần thử mới. Synthesizer của pattern `panel` nhận report của panelist theo\nđúng cách đó. `blind-ref-hidden` chỉ còn cho ref không chép được.\n\nCanary sống (2026-10-05, mỗi họ executor một Unit blind chỉ-đọc, input `unit-run:`, và đường dẫn\ntuyệt đối tới report nguồn): claude (herdr), codex (herdr và cli bwrap), xai (pi herdr), glm và\ndeepseek (pi cli bwrap) đều đọc bản chép, gặp `ENOENT` ở nguồn và chỉ thấy chuỗi của chính mình\ntrong `.fgos/assignments`. Dưới `--unshare-pid` và mask thư mục socket herdr, herdr vẫn nhận ra agent\ntrong pane (`agentKnownToHerdr: detected`, trạng thái `unknown` → `working` → `idle`/kết thúc), nên\nmask và `--unshare-pid` giữ nguyên. agy chưa chứng minh được: `agy-herdr` hỏng cả khi không blind\n(`foreground process ... does not match prepared command argv`), `agy-cli-bwrap` dừng vì hết quota\ncủa tài khoản.\n\nDispatch `blind` bị **từ chối, không bao giờ chạy không-blind**, với lý do có tên, trước khi\nspawn: `blind-requires-confinement` (mode không phải `required`/không có policy),\n`blind-in-process` (Agent tool/inline không có sandbox quanh worker; `bind()` cũng không chọn nó),\n`blind-hides-workspace` (cwd hoặc repo root nằm trong hidden root), `blind-ref-hidden` (context\nref nằm trong hidden root ngoài thư mục của chính dispatch), `confinement-backend-missing` /\n`confinement-backend-disabled` (không có bwrap), `confinement-probe-failed` (probe chưa tươi hoặc\nkhông qua). Probe `peer-run-hidden` (thứ chín, chỉ cho dispatch blind; fingerprint và cache riêng)\ndựng argv từ chính `prepareBwrap`: worker không đọc được report của peer, home của peer, cmdline\ncủa tiến trình anh em, nhưng đọc được thư mục của mình (chỉ-đọc) và ghi được outbox; falsifier bỏ\nmask thì phải đọc được file peer. `fgos doctor` báo `blind-read: pass | fail |\nbackend-unsupported` (check `confinement-blind-read`). Giới hạn còn mở: transcript agent của Lead\ntrong host home, `.fgos/secrets.local.env` và project khác (bí mật, không phải mù), và mạng\nlocalhost.",
    "text": "### 9.2 `hostRead: blind` — worker mù trước run state của peer",
    "ancestry": [
      "Spec: Agent Confinement Authority",
      "9. Default implementation đầu tiên"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/31/facts",
    "sha256": "e5ca3a829b35d5087660726ddcaf72313dc94aca0fe57be96efc894afc04ebe5"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-33

```json
{
  "entryId": "rationale-33",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_96b54d15ac01f69e7df991151c2268be",
  "before": {
    "claimId": "claim_96b54d15ac01f69e7df991151c2268be",
    "sourceUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1247-1247#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:24-24#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"10. Lộ trình rollout và trạng thái hoàn thành\" → \"10. Lộ trình rollout và trạng thái hoàn thành\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"10. Lộ trình rollout và trạng thái hoàn thành\" → \"10. Lộ trình rollout và trạng thái hoàn thành\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Literal source lines are preserved across the history file; outer snapshot/placeholder fences alter native direct-section boundaries. This is a larger historical wrapper, not a section-equality assertion. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_96b54d15ac01f69e7df991151c2268be",
    "sourceUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1247-1247#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:24-24#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"10. Lộ trình rollout và trạng thái hoàn thành\" → \"10. Lộ trình rollout và trạng thái hoàn thành\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ]
  },
  "currentDecision": {
    "claimId": "claim_96b54d15ac01f69e7df991151c2268be",
    "sourceUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetOwner": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md",
    "targetAnchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1247-1247#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nTarget: docs/platform/agent-confinement/history/rollout-and-settled-facts.md:24-24#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành (current lines); unit SHA256 d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"10. Lộ trình rollout và trạng thái hoàn thành\" → \"10. Lộ trình rollout và trạng thái hoàn thành\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành under docs/platform/agent-confinement/history/rollout-and-settled-facts.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành; source context \"Spec: Agent Confinement Authority\", target context \"Added in candidate: rollout and settled facts\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "targetAncestry": [
      "Added in candidate: rollout and settled facts"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Lộ trình rollout và trạng thái hoàn thành",
    "anchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "githubAnchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "stableAnchor": "h-c24e0504508a",
    "startLine": 1247,
    "endLine": 1247,
    "textDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "sample": "10. Lộ trình rollout và trạng thái hoàn thành",
    "sectionPayloadDigest": "e5f374eb677f77523ea34429fff31c02985f4dcb251a96544022cba1dfc382d9",
    "followingBlockDigest": "5036517c45b86b22554b3c8c1b11e63cc453d4a66722bbd0c820af5ec68cc56f",
    "identityFingerprint": "e1ed42da3cac164486f2df052a7c9435e31d4a1519cc5ac187706c26fdab831e",
    "sectionText": "## 10. Lộ trình rollout và trạng thái hoàn thành\n\n| Phase | Kết quả | Trạng thái (Track `confinement-authority-implementation`) |\n|---|---|---|\n| S0 - Contract | Spec, schema names, error taxonomy, one-door invariant | **Đã hoàn thành (P00)**: Contract đóng băng, repo map, inventory |\n| S1 - One-door observe | Hai call site chỉ gọi Authority; adapter execute handle bị ẩn; attestation đính kèm kết quả | **Đã hoàn thành (P02)**: `executeThroughConfinement` gắn tại `spawnWorker` và `executeExecutorCli` |\n| S2 - Declare | Capabilities explicit policy / `unconfined`; backend registry machine-local; schema validation | **Đã hoàn thành (P01/P04)**: Closed schema, `~/.fgos/confinement-backends.json`, setup/doctor |\n| S3 - Prove | Probe harness committed (8 falsification probes) + doctor checks probe freshness | **Đã hoàn thành (P03)**: `runAllConfinementProbes` + doctor checks |\n| S4 - Enforce | `required` fail closed trước spawn; di trú 3 bwrap executor | **Đã hoàn thành một phần (P04)**: 7 refusal gates, F-a đến F-d đóng; di trú 3 bwrap executor sang backend reference CHỈ ở fixture (P04.md R4) — live `.fgos/config.json` migration deferred, chưa hoàn thành |\n| S5 - Complete migration | Herdr và legacy confinement hội tụ dưới Authority; evaluateBypassPairing | **Đã hoàn thành (P05)**: Chuẩn hoá v1 controls, bypass pairing bảo đảm |\n| Dogfood Proof | Multi-agent coordination với cross-provider execution và bwrap enforcement thật | **Đã hoàn thành (P06)**: Doer/Reviewer/Red-Team live proof xanh, attestation artifacts |\n| S6 - Extend | macOS/container/remote/network/secret backend khi có nhu cầu | Tương lai / mở rộng ngoài v1 |\n\nObserve-first là thứ tự rollout, không phải kiến trúc đích. `required` luôn fail-closed. Mọi capability chưa có backend binding hỗ trợ được giữ ở `unconfined` (cho 3 capability tư vấn) hoặc omitted (chờ backend binding). Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor`.",
    "text": "## 10. Lộ trình rollout và trạng thái hoàn thành",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "10. Lộ trình rollout và trạng thái hoàn thành",
    "anchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "githubAnchor": "10-lộ-trình-rollout-và-trạng-thái-hoàn-thành",
    "stableAnchor": "h-544863937a88",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "d190224e5d950146033421700ed7ddb13820841f2cebcdb371223943ceacd82d",
    "sample": "10. Lộ trình rollout và trạng thái hoàn thành",
    "sectionPayloadDigest": "e5f374eb677f77523ea34429fff31c02985f4dcb251a96544022cba1dfc382d9",
    "followingBlockDigest": "5036517c45b86b22554b3c8c1b11e63cc453d4a66722bbd0c820af5ec68cc56f",
    "identityFingerprint": "e1ed42da3cac164486f2df052a7c9435e31d4a1519cc5ac187706c26fdab831e",
    "sectionText": "## 10. Lộ trình rollout và trạng thái hoàn thành\n\n| Phase | Kết quả | Trạng thái (Track `confinement-authority-implementation`) |\n|---|---|---|\n| S0 - Contract | Spec, schema names, error taxonomy, one-door invariant | **Đã hoàn thành (P00)**: Contract đóng băng, repo map, inventory |\n| S1 - One-door observe | Hai call site chỉ gọi Authority; adapter execute handle bị ẩn; attestation đính kèm kết quả | **Đã hoàn thành (P02)**: `executeThroughConfinement` gắn tại `spawnWorker` và `executeExecutorCli` |\n| S2 - Declare | Capabilities explicit policy / `unconfined`; backend registry machine-local; schema validation | **Đã hoàn thành (P01/P04)**: Closed schema, `~/.fgos/confinement-backends.json`, setup/doctor |\n| S3 - Prove | Probe harness committed (8 falsification probes) + doctor checks probe freshness | **Đã hoàn thành (P03)**: `runAllConfinementProbes` + doctor checks |\n| S4 - Enforce | `required` fail closed trước spawn; di trú 3 bwrap executor | **Đã hoàn thành một phần (P04)**: 7 refusal gates, F-a đến F-d đóng; di trú 3 bwrap executor sang backend reference CHỈ ở fixture (P04.md R4) — live `.fgos/config.json` migration deferred, chưa hoàn thành |\n| S5 - Complete migration | Herdr và legacy confinement hội tụ dưới Authority; evaluateBypassPairing | **Đã hoàn thành (P05)**: Chuẩn hoá v1 controls, bypass pairing bảo đảm |\n| Dogfood Proof | Multi-agent coordination với cross-provider execution và bwrap enforcement thật | **Đã hoàn thành (P06)**: Doer/Reviewer/Red-Team live proof xanh, attestation artifacts |\n| S6 - Extend | macOS/container/remote/network/secret backend khi có nhu cầu | Tương lai / mở rộng ngoài v1 |\n\nObserve-first là thứ tự rollout, không phải kiến trúc đích. `required` luôn fail-closed. Mọi capability chưa có backend binding hỗ trợ được giữ ở `unconfined` (cho 3 capability tư vấn) hoặc omitted (chờ backend binding). Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor`.",
    "text": "## 10. Lộ trình rollout và trạng thái hoàn thành",
    "ancestry": [
      "Added in candidate: rollout and settled facts"
    ],
    "path": "docs/platform/agent-confinement/history/rollout-and-settled-facts.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/32/facts",
    "sha256": "c69b32c535a41a46e81e35166034898583ab447396e03f156abee489caa3b9a3"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```

## rationale-34

```json
{
  "entryId": "rationale-34",
  "kind": "changed-rationale",
  "authorSession": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json",
  "collection": "claims",
  "claimId": "claim_1ef2bc00c79bc7a40787b62a4943f0df",
  "before": {
    "claimId": "claim_1ef2bc00c79bc7a40787b62a4943f0df",
    "sourceUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "11-proof-và-definition-of-done",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1262-1262#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nTarget: docs/platform/agent-confinement/spec.md:513-513#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828 at 1276467f37a99d19aff05808d42fafbf40341449.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"11. Proof và Definition of Done\" → \"11. Proof và Definition of Done\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (existing-labelled-successor-correction): Complete direct section compared to the next native heading. Depth 2 → 2, title \"11. Proof và Definition of Done\" → \"11. Proof và Definition of Done\"; 0 distinct link spelling/label changes; 0 applicable exact labelled corrections. Normalized nonblank line order matches; exact raw-section removed/added line witnesses are accounted below; correction-normalized counts are reported separately. Existing correction labels named corrected successor / truth-ledger-agent-coordination.json at immutable account 9b0526380:plans/260925-documentation-authority-unification/ledger/decisions/s8-agent-confinement-01.json; exact section delta: removed []; added []. This records replacement, not byte carriage or current-truth certification.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#11-proof-và-definition-of-done under docs/platform/agent-confinement/spec.md#11-proof-và-definition-of-done; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  },
  "beforeContentCommit": "1d92a7229af9050b3ce57729c8652b8a836e93b6",
  "after": {
    "claimId": "claim_1ef2bc00c79bc7a40787b62a4943f0df",
    "sourceUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "11-proof-và-definition-of-done",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1262-1262#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nTarget: docs/platform/agent-confinement/spec.md:513-513#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"11. Proof và Definition of Done\" → \"11. Proof và Definition of Done\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#11-proof-và-definition-of-done under docs/platform/agent-confinement/spec.md#11-proof-và-definition-of-done; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  },
  "currentDecision": {
    "claimId": "claim_1ef2bc00c79bc7a40787b62a4943f0df",
    "sourceUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetOwner": "docs/platform/agent-confinement/spec.md",
    "targetAnchor": "11-proof-và-definition-of-done",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792126341980-e0c35701@2026-10-16",
    "rationale": "Source: docs/specs/confinement-authority.md:1262-1262#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nTarget: docs/platform/agent-confinement/spec.md:513-513#11-proof-và-definition-of-done (current lines); unit SHA256 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828.\nSource and target unit digests equal.\nTarget unchanged since last reviewed digest 57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828 at 62751458b22b47e930dc33b8501d07798b91ace3.\nLinks: source 0, target 0; 0 changed spellings/labels, 0 destination changes; 0 added, 0 removed.\nHeading depth: 2 → 2; title \"11. Proof và Definition of Done\" → \"11. Proof và Definition of Done\".\nWhole direct section equal; depth 2 → 2; 0 distinct link changes; normalized line order equal; 0 removed and 0 added nonblank lines after heading/link/correction normalization.\nSection accounting (equal-section): Complete direct source and target sections are byte-equal; no removed or added lines.\nApplicable labelled corrections: none in this bound unit.\nDisposition move: Account for docs/specs/confinement-authority.md#11-proof-và-definition-of-done under docs/platform/agent-confinement/spec.md#11-proof-và-definition-of-done; source context \"Spec: Agent Confinement Authority\", target context \"Spec: Agent Confinement Authority\". The complete bound unit is carried with an equal native digest.\nConservation accounting only; current truth, promotion, retirement and cutover require their own evidence.",
    "targetUnitDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "targetAncestry": [
      "Spec: Agent Confinement Authority"
    ]
  },
  "currentContentCommit": "4d363436049120ffc9b94dd5269f06a026a827fd",
  "sourceWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "11. Proof và Definition of Done",
    "anchor": "11-proof-và-definition-of-done",
    "githubAnchor": "11-proof-và-definition-of-done",
    "stableAnchor": "h-c50fc674d42d",
    "startLine": 1262,
    "endLine": 1262,
    "textDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "sample": "11. Proof và Definition of Done",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "cdb0096afe72b116e5bcd3d167f7c63e4154d6801f4d84ece0a20765b049c280",
    "sectionText": "## 11. Proof và Definition of Done",
    "text": "## 11. Proof và Definition of Done",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/specs/confinement-authority.md"
  },
  "targetWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "11. Proof và Definition of Done",
    "anchor": "11-proof-và-definition-of-done",
    "githubAnchor": "11-proof-và-definition-of-done",
    "stableAnchor": "h-c9d406bb62ec",
    "startLine": 513,
    "endLine": 513,
    "textDigest": "57cf348eee6c014023677b375f253194430c8b05e051987ccbb1ad56e611e828",
    "sample": "11. Proof và Definition of Done",
    "sectionPayloadDigest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "followingBlockDigest": null,
    "identityFingerprint": "cdb0096afe72b116e5bcd3d167f7c63e4154d6801f4d84ece0a20765b049c280",
    "sectionText": "## 11. Proof và Definition of Done",
    "text": "## 11. Proof và Definition of Done",
    "ancestry": [
      "Spec: Agent Confinement Authority"
    ],
    "path": "docs/platform/agent-confinement/spec.md"
  },
  "completeFacts": {
    "commit": "4d363436049120ffc9b94dd5269f06a026a827fd",
    "path": "plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-rationale-edits.json",
    "pointer": "/changes/33/facts",
    "sha256": "f91edb4f139b4bf086e9c5aa894b188c2c80e5bb8aa0daaa7169254edb99f84e"
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "A36": [
    "whole-direct-section"
  ],
  "reviewScope": "Review changed rationale and full exact binding. Current snapshot comes from git show content commit; no approval inherited from earlier prose."
}
```
