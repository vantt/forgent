# Mapped root conservation: bounded full-text pack 02

Author session: codex-session:20@2026-10-14
Content commit: 23062c2ce9caaf6711a906673e2dc14c3f345ec3

## source-decision claim_454f6d8335dabe97efe18b811eefefaf

Decision:

````json
{
  "claimId": "claim_454f6d8335dabe97efe18b811eefefaf",
  "sourceUnitDigest": "5e6f431308636052ea3e0656a2f6523510c766773e1baff8b3226d998f57edba",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "aca1411a687dbe2288f5a2e87cd48e6bbe9c2000204511fdc72fa1e735c543cc",
  "targetAncestry": [
    "<Subcomponent Name>",
    "5. Read First"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#unheaded-block-3 to docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-3. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#unheaded-block-3`
Source unit SHA256: `5e6f431308636052ea3e0656a2f6523510c766773e1baff8b3226d998f57edba`
Shown source SHA256: `5e6f431308636052ea3e0656a2f6523510c766773e1baff8b3226d998f57edba`

````text
| Need | Read |
|---|---|
| Current behavior/state | [spec.md](spec.md) |
| Design rationale/boundaries | [architecture/](architecture/) |
| Exact local interfaces/rules | [contracts/](contracts/) |
| Proof/evidence | [verification/](verification/) |
| Historical context | [history/](history/) |
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-3`
Target unit SHA256: `aca1411a687dbe2288f5a2e87cd48e6bbe9c2000204511fdc72fa1e735c543cc`
Shown target SHA256: `aca1411a687dbe2288f5a2e87cd48e6bbe9c2000204511fdc72fa1e735c543cc`

````text
```markdown
| Need | Read |
|---|---|
| Current behavior/state | [spec.md](spec.md) |
| Design rationale/boundaries | [architecture/](architecture/) |
| Exact local interfaces/rules | [contracts/](contracts/) |
| Proof/evidence | [verification/](verification/) |
| Historical context | [history/](history/) |
```
````

````diff
--- docs/templates/subcomponent-readme.md
+++ docs/platform/documentation/history/templates/subcomponent-readme.md
@@ -0,0 +1 @@
+```markdown
@@ -7 +8,2 @@
-| Historical context | [history/](history/) |+| Historical context | [history/](history/) |
+```
````
## source-decision claim_73b857e82f88cc9d3459132758321b3f

Decision:

````json
{
  "claimId": "claim_73b857e82f88cc9d3459132758321b3f",
  "sourceUnitDigest": "bce4dd9c55fac78c7d4e53932b8cd9b06e879db600ddf9993a0aa674f89221db",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "6-local-boundary",
  "targetUnitDigest": "bce4dd9c55fac78c7d4e53932b8cd9b06e879db600ddf9993a0aa674f89221db",
  "targetAncestry": [
    "<Subcomponent Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#6-local-boundary to docs/platform/documentation/history/templates/subcomponent-readme.md#6-local-boundary. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#6-local-boundary`
Source unit SHA256: `bce4dd9c55fac78c7d4e53932b8cd9b06e879db600ddf9993a0aa674f89221db`
Shown source SHA256: `67989cf9e0729c7b96c18afae706eae22fae0209a75a1a2d997959318b9d8824`

````text
## 6. Local Boundary

| Boundary question | Answer |
|---|---|
| Parent component |  |
| Child responsibilities |  |
| State writes owned |  |
| Contracts owned |  |
| Contracts consumed |  |
| Relevant `docs/platform/component-boundary.md` entry |  |
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#6-local-boundary`
Target unit SHA256: `bce4dd9c55fac78c7d4e53932b8cd9b06e879db600ddf9993a0aa674f89221db`
Shown target SHA256: `67989cf9e0729c7b96c18afae706eae22fae0209a75a1a2d997959318b9d8824`

````text
## 6. Local Boundary

| Boundary question | Answer |
|---|---|
| Parent component |  |
| Child responsibilities |  |
| State writes owned |  |
| Contracts owned |  |
| Contracts consumed |  |
| Relevant `docs/platform/component-boundary.md` entry |  |
````

````diff

````
## source-decision claim_2c5f66a73fc6c1061c9aa1eacb76123f

Decision:

````json
{
  "claimId": "claim_2c5f66a73fc6c1061c9aa1eacb76123f",
  "sourceUnitDigest": "5de58631ce25a536aeda47373b179bbf1bc9e606d896ad1f6127be5a3b0c1052",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "5de58631ce25a536aeda47373b179bbf1bc9e606d896ad1f6127be5a3b0c1052",
  "targetAncestry": [
    "<Subcomponent Name>",
    "6. Local Boundary"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#unheaded-block-4 to docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-4. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#unheaded-block-4`
Source unit SHA256: `5de58631ce25a536aeda47373b179bbf1bc9e606d896ad1f6127be5a3b0c1052`
Shown source SHA256: `5de58631ce25a536aeda47373b179bbf1bc9e606d896ad1f6127be5a3b0c1052`

````text
| Boundary question | Answer |
|---|---|
| Parent component |  |
| Child responsibilities |  |
| State writes owned |  |
| Contracts owned |  |
| Contracts consumed |  |
| Relevant `docs/platform/component-boundary.md` entry |  |
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-4`
Target unit SHA256: `5de58631ce25a536aeda47373b179bbf1bc9e606d896ad1f6127be5a3b0c1052`
Shown target SHA256: `5de58631ce25a536aeda47373b179bbf1bc9e606d896ad1f6127be5a3b0c1052`

````text
| Boundary question | Answer |
|---|---|
| Parent component |  |
| Child responsibilities |  |
| State writes owned |  |
| Contracts owned |  |
| Contracts consumed |  |
| Relevant `docs/platform/component-boundary.md` entry |  |
````

````diff

````
## source-decision claim_29e4db4d1e0e9f74098c0eea7d793c99

Decision:

````json
{
  "claimId": "claim_29e4db4d1e0e9f74098c0eea7d793c99",
  "sourceUnitDigest": "e7fbdb1a30ba4a93c65250ec8732bee9f5607c0acaa0af1964921eb27968244b",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "7-implementation-alignment",
  "targetUnitDigest": "e7fbdb1a30ba4a93c65250ec8732bee9f5607c0acaa0af1964921eb27968244b",
  "targetAncestry": [
    "<Subcomponent Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#7-implementation-alignment to docs/platform/documentation/history/templates/subcomponent-readme.md#7-implementation-alignment. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#7-implementation-alignment`
Source unit SHA256: `e7fbdb1a30ba4a93c65250ec8732bee9f5607c0acaa0af1964921eb27968244b`
Shown source SHA256: `0a3a7d2b7c56536b6459e2445ccf4a54ab34f042defc4128b8aba6e92692cd02`

````text
## 7. Implementation Alignment

| Claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|
| <claim> | implemented / partial / planned / superseded / unknown | <links> | <gap> |
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#7-implementation-alignment`
Target unit SHA256: `e7fbdb1a30ba4a93c65250ec8732bee9f5607c0acaa0af1964921eb27968244b`
Shown target SHA256: `0a3a7d2b7c56536b6459e2445ccf4a54ab34f042defc4128b8aba6e92692cd02`

````text
## 7. Implementation Alignment

| Claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|
| <claim> | implemented / partial / planned / superseded / unknown | <links> | <gap> |
````

````diff

````
## source-decision claim_3c87db9e8900c099ee0ff1cebdbf7e92

Decision:

````json
{
  "claimId": "claim_3c87db9e8900c099ee0ff1cebdbf7e92",
  "sourceUnitDigest": "d01e25650e85c43a9b483b88255b1eb1a90756c8dc15c59ca4dac278d97c9776",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "d01e25650e85c43a9b483b88255b1eb1a90756c8dc15c59ca4dac278d97c9776",
  "targetAncestry": [
    "<Subcomponent Name>",
    "7. Implementation Alignment"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#unheaded-block-5 to docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-5. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#unheaded-block-5`
Source unit SHA256: `d01e25650e85c43a9b483b88255b1eb1a90756c8dc15c59ca4dac278d97c9776`
Shown source SHA256: `d01e25650e85c43a9b483b88255b1eb1a90756c8dc15c59ca4dac278d97c9776`

````text
| Claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|
| <claim> | implemented / partial / planned / superseded / unknown | <links> | <gap> |
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-5`
Target unit SHA256: `d01e25650e85c43a9b483b88255b1eb1a90756c8dc15c59ca4dac278d97c9776`
Shown target SHA256: `d01e25650e85c43a9b483b88255b1eb1a90756c8dc15c59ca4dac278d97c9776`

````text
| Claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|
| <claim> | implemented / partial / planned / superseded / unknown | <links> | <gap> |
````

````diff

````
## source-decision claim_587505d1f5fbce977f568326d91ad285

Decision:

````json
{
  "claimId": "claim_587505d1f5fbce977f568326d91ad285",
  "sourceUnitDigest": "0a5afc3d354657bce6080de5b41485d5a1b825a0518b7bae3fc8af3a0a876dc1",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "8-how-to-change-this-subcomponent",
  "targetUnitDigest": "0a5afc3d354657bce6080de5b41485d5a1b825a0518b7bae3fc8af3a0a876dc1",
  "targetAncestry": [
    "<Subcomponent Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#8-how-to-change-this-subcomponent to docs/platform/documentation/history/templates/subcomponent-readme.md#8-how-to-change-this-subcomponent. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#8-how-to-change-this-subcomponent`
Source unit SHA256: `0a5afc3d354657bce6080de5b41485d5a1b825a0518b7bae3fc8af3a0a876dc1`
Shown source SHA256: `73dfe6398a5f757d3d78af6015dddd45b2cfb3ac772a629b2326e08b251be8ff`

````text
## 8. How To Change This Subcomponent

1. Read the parent area README and this README.
2. Read parent `vision.md` and `intent-preservation-ledger.md` when the work
   narrows or stages the full design.
3. Check this subcomponent's spec, contracts, and verification.
4. Check whether `docs/platform/component-boundary.md` needs an update.
5. Promote settled changes into the right parent or subcomponent doc.
6. Add or update proof.
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#8-how-to-change-this-subcomponent`
Target unit SHA256: `0a5afc3d354657bce6080de5b41485d5a1b825a0518b7bae3fc8af3a0a876dc1`
Shown target SHA256: `73dfe6398a5f757d3d78af6015dddd45b2cfb3ac772a629b2326e08b251be8ff`

````text
## 8. How To Change This Subcomponent

1. Read the parent area README and this README.
2. Read parent `vision.md` and `intent-preservation-ledger.md` when the work
   narrows or stages the full design.
3. Check this subcomponent's spec, contracts, and verification.
4. Check whether `docs/platform/component-boundary.md` needs an update.
5. Promote settled changes into the right parent or subcomponent doc.
6. Add or update proof.
````

````diff

````
## source-decision claim_fd0d10e6518d65c8c1bcf6bdd4c693df

Decision:

````json
{
  "claimId": "claim_fd0d10e6518d65c8c1bcf6bdd4c693df",
  "sourceUnitDigest": "20ff133eca295e522261975ffc038b0dc9d64362c532064698eab5f5352ac46c",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "20ff133eca295e522261975ffc038b0dc9d64362c532064698eab5f5352ac46c",
  "targetAncestry": [
    "<Subcomponent Name>",
    "8. How To Change This Subcomponent"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#unheaded-block-6 to docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-6. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#unheaded-block-6`
Source unit SHA256: `20ff133eca295e522261975ffc038b0dc9d64362c532064698eab5f5352ac46c`
Shown source SHA256: `20ff133eca295e522261975ffc038b0dc9d64362c532064698eab5f5352ac46c`

````text
1. Read the parent area README and this README.
2. Read parent `vision.md` and `intent-preservation-ledger.md` when the work
   narrows or stages the full design.
3. Check this subcomponent's spec, contracts, and verification.
4. Check whether `docs/platform/component-boundary.md` needs an update.
5. Promote settled changes into the right parent or subcomponent doc.
6. Add or update proof.
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-6`
Target unit SHA256: `20ff133eca295e522261975ffc038b0dc9d64362c532064698eab5f5352ac46c`
Shown target SHA256: `20ff133eca295e522261975ffc038b0dc9d64362c532064698eab5f5352ac46c`

````text
1. Read the parent area README and this README.
2. Read parent `vision.md` and `intent-preservation-ledger.md` when the work
   narrows or stages the full design.
3. Check this subcomponent's spec, contracts, and verification.
4. Check whether `docs/platform/component-boundary.md` needs an update.
5. Promote settled changes into the right parent or subcomponent doc.
6. Add or update proof.
````

````diff

````
## source-decision claim_800c0b9450fc2922055b79f3015e8bf7

Decision:

````json
{
  "claimId": "claim_800c0b9450fc2922055b79f3015e8bf7",
  "sourceUnitDigest": "5eb523e2cfc17382df001e949ce60be4819fb32a6900ae64925a48f9dadc5a0c",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "9-related-files",
  "targetUnitDigest": "a7ec1de8ccb66220a96833693968fa59f0bab816d2fbdd02e520c1c580e4a0e2",
  "targetAncestry": [
    "<Subcomponent Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#9-related-files to docs/platform/documentation/history/templates/subcomponent-readme.md#9-related-files. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#9-related-files`
Source unit SHA256: `5eb523e2cfc17382df001e949ce60be4819fb32a6900ae64925a48f9dadc5a0c`
Shown source SHA256: `0512f107ddc2fe7c1aa6b54e63b69981de12c45a22abcf5cd8310d52f6a8f669`

````text
## 9. Related Files

| Relationship | File |
|---|---|
| parent area | [../../README.md](../../README.md) |
| parent current behavior | [../../spec.md](../../spec.md) |
| local current behavior | [spec.md](spec.md) |
| local design shape | [architecture/](architecture/) |
| local contracts | [contracts/](contracts/) |
| local proof | [verification/](verification/) |
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#9-related-files`
Target unit SHA256: `a7ec1de8ccb66220a96833693968fa59f0bab816d2fbdd02e520c1c580e4a0e2`
Shown target SHA256: `493e00491796aaccfd9b3cb307a277a06c3880ee9a1bb5c7be809eb0f06f1047`

````text
## 9. Related Files

```markdown
| Relationship | File |
|---|---|
| parent area | [../../README.md](../../README.md) |
| parent current behavior | [../../spec.md](../../spec.md) |
| local current behavior | [spec.md](spec.md) |
| local design shape | [architecture/](architecture/) |
| local contracts | [contracts/](contracts/) |
| local proof | [verification/](verification/) |
```
````

````diff
--- docs/templates/subcomponent-readme.md
+++ docs/platform/documentation/history/templates/subcomponent-readme.md
@@ -2,0 +3 @@
+```markdown
@@ -10 +11,2 @@
-| local proof | [verification/](verification/) |+| local proof | [verification/](verification/) |
+```
````
## source-decision claim_67666efaf53224a9348dd7f3060cc811

Decision:

````json
{
  "claimId": "claim_67666efaf53224a9348dd7f3060cc811",
  "sourceUnitDigest": "c2156d0d8e5129281c6fab03e4d1d3719c6dc3e681b8b32c1088c6f6702bba8e",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "fb41f3d41130dff474a7e5540ea8d9eb0a3b6d52b3192b501c0f583510b53332",
  "targetAncestry": [
    "<Subcomponent Name>",
    "9. Related Files"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#unheaded-block-7 to docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-7. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#unheaded-block-7`
Source unit SHA256: `c2156d0d8e5129281c6fab03e4d1d3719c6dc3e681b8b32c1088c6f6702bba8e`
Shown source SHA256: `c2156d0d8e5129281c6fab03e4d1d3719c6dc3e681b8b32c1088c6f6702bba8e`

````text
| Relationship | File |
|---|---|
| parent area | [../../README.md](../../README.md) |
| parent current behavior | [../../spec.md](../../spec.md) |
| local current behavior | [spec.md](spec.md) |
| local design shape | [architecture/](architecture/) |
| local contracts | [contracts/](contracts/) |
| local proof | [verification/](verification/) |
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-7`
Target unit SHA256: `fb41f3d41130dff474a7e5540ea8d9eb0a3b6d52b3192b501c0f583510b53332`
Shown target SHA256: `fb41f3d41130dff474a7e5540ea8d9eb0a3b6d52b3192b501c0f583510b53332`

````text
```markdown
| Relationship | File |
|---|---|
| parent area | [../../README.md](../../README.md) |
| parent current behavior | [../../spec.md](../../spec.md) |
| local current behavior | [spec.md](spec.md) |
| local design shape | [architecture/](architecture/) |
| local contracts | [contracts/](contracts/) |
| local proof | [verification/](verification/) |
```
````

````diff
--- docs/templates/subcomponent-readme.md
+++ docs/platform/documentation/history/templates/subcomponent-readme.md
@@ -0,0 +1 @@
+```markdown
@@ -8 +9,2 @@
-| local proof | [verification/](verification/) |+| local proof | [verification/](verification/) |
+```
````
## source-decision claim_54d5f40b91d8dbc73afa7847d4536896

Decision:

````json
{
  "claimId": "claim_54d5f40b91d8dbc73afa7847d4536896",
  "sourceUnitDigest": "5af2a3805aa1d35845c117f741365c9aeb934a4516d0d8f589bddec729f811f9",
  "targetOwner": "docs/platform/documentation/history/templates/verification.md",
  "targetAnchor": "verification",
  "targetUnitDigest": "385c5edaea93e98c4375b90347e2e49c8155c602bb9bc8634ba096fff729819d",
  "targetAncestry": [],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/verification.md#verification to docs/platform/documentation/history/templates/verification.md#verification. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/verification.md#verification`
Source unit SHA256: `5af2a3805aa1d35845c117f741365c9aeb934a4516d0d8f589bddec729f811f9`
Shown source SHA256: `77a27ee86b723d9cb478f8b104e146835bb46057bfa46b8274d757dee6a0380b`

````text
# Verification: <Claim>

```txt
Document type: Verification
Audience: Human reviewer, implementer, agent
Purpose: Preserve proof for a claim, behavior, contract, or decision
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Evidence for <claim>
Use this when: You need proof, test evidence, traces, or limitations
Do not use this for: Defining new rules or design authority
Last reviewed: YYYY-MM-DD
Related:
- `../README.md`
```
````

Target: `docs/platform/documentation/history/templates/verification.md#verification`
Target unit SHA256: `385c5edaea93e98c4375b90347e2e49c8155c602bb9bc8634ba096fff729819d`
Shown target SHA256: `b150912468c8ac2ad87440b8dd441de356f4d52ab4de3fc17efb469831f72bac`

````text
# Verification: <Claim>

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/templates/verification.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/templates/verification.md
Supersedes: None; candidate only
Superseded by: None
```
````

````diff
--- docs/templates/verification.md
+++ docs/platform/documentation/history/templates/verification.md
@@ -4,11 +4,12 @@
-Document type: Verification
-Audience: Human reviewer, implementer, agent
-Purpose: Preserve proof for a claim, behavior, contract, or decision
-Design status: Draft
-Implementation: N/A
-Provenance: Human + agent coauthor
-Writer type: Human + agent coauthor
-Canonical for: Evidence for <claim>
-Use this when: You need proof, test evidence, traces, or limitations
-Do not use this for: Defining new rules or design authority
-Last reviewed: YYYY-MM-DD
+Document type: History
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/templates/verification.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
@@ -16 +17,3 @@
-- `../README.md`
+- docs/templates/verification.md
+Supersedes: None; candidate only
+Superseded by: None
````
## source-decision claim_b85d4207748c7a0fcce2ebb21c97688c

Decision:

````json
{
  "claimId": "claim_b85d4207748c7a0fcce2ebb21c97688c",
  "sourceUnitDigest": "9c4500563419c3f1b34747ec715fb74809c2e4e0f504b194b2f02a9258e07a45",
  "targetOwner": "docs/platform/documentation/history/templates/verification.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "d0de707b81243c02f7efde79893ff7b385f1406429119a6b9b6974d58f801097",
  "targetAncestry": [
    "Verification: <Claim>",
    "Source Metadata (Added in candidate)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/verification.md#unheaded-block-1 to docs/platform/documentation/history/templates/verification.md#unheaded-block-3. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Original metadata is retained verbatim under Source Metadata (Added in candidate), separate from the candidate authority header. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/verification.md#unheaded-block-1`
Source unit SHA256: `9c4500563419c3f1b34747ec715fb74809c2e4e0f504b194b2f02a9258e07a45`
Shown source SHA256: `9c4500563419c3f1b34747ec715fb74809c2e4e0f504b194b2f02a9258e07a45`

````text
```txt
Document type: Verification
Audience: Human reviewer, implementer, agent
Purpose: Preserve proof for a claim, behavior, contract, or decision
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Evidence for <claim>
Use this when: You need proof, test evidence, traces, or limitations
Do not use this for: Defining new rules or design authority
Last reviewed: YYYY-MM-DD
Related:
- `../README.md`
```
````

Target: `docs/platform/documentation/history/templates/verification.md#unheaded-block-3`
Target unit SHA256: `d0de707b81243c02f7efde79893ff7b385f1406429119a6b9b6974d58f801097`
Shown target SHA256: `d0de707b81243c02f7efde79893ff7b385f1406429119a6b9b6974d58f801097`

`````text
````text
```txt
Document type: Verification
Audience: Human reviewer, implementer, agent
Purpose: Preserve proof for a claim, behavior, contract, or decision
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Evidence for <claim>
Use this when: You need proof, test evidence, traces, or limitations
Do not use this for: Defining new rules or design authority
Last reviewed: YYYY-MM-DD
Related:
- `../README.md`
```
````
`````

`````diff
--- docs/templates/verification.md
+++ docs/platform/documentation/history/templates/verification.md
@@ -0,0 +1 @@
+````text
@@ -15 +16,2 @@
-```+```
+````
`````
## source-decision claim_eda962e66800996ed767b10cac5d30c8

Decision:

````json
{
  "claimId": "claim_eda962e66800996ed767b10cac5d30c8",
  "sourceUnitDigest": "5bb0afe7f8ac3fd2ce28cd6d13f870749ab7390b82ed210c0ed150f745b868f9",
  "targetOwner": "docs/platform/documentation/history/templates/verification.md",
  "targetAnchor": "1-claim",
  "targetUnitDigest": "5bb0afe7f8ac3fd2ce28cd6d13f870749ab7390b82ed210c0ed150f745b868f9",
  "targetAncestry": [
    "Verification: <Claim>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/verification.md#1-claim to docs/platform/documentation/history/templates/verification.md#1-claim. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/verification.md#1-claim`
Source unit SHA256: `5bb0afe7f8ac3fd2ce28cd6d13f870749ab7390b82ed210c0ed150f745b868f9`
Shown source SHA256: `0616f13bedec51fdbc390d0aa285991fd90f9c84564af5ad1daa343d02904b68`

````text
## 1. Claim
````

Target: `docs/platform/documentation/history/templates/verification.md#1-claim`
Target unit SHA256: `5bb0afe7f8ac3fd2ce28cd6d13f870749ab7390b82ed210c0ed150f745b868f9`
Shown target SHA256: `0616f13bedec51fdbc390d0aa285991fd90f9c84564af5ad1daa343d02904b68`

````text
## 1. Claim
````

````diff

````
## source-decision claim_f2ab840fe3dbd3965b83c34b3abd3f2c

Decision:

````json
{
  "claimId": "claim_f2ab840fe3dbd3965b83c34b3abd3f2c",
  "sourceUnitDigest": "812a31e2133e9a10ebd275c43d64b3a0e65e1c70c6b761bb5ac01dcdb4b2ada8",
  "targetOwner": "docs/platform/documentation/history/templates/verification.md",
  "targetAnchor": "2-acceptance-evidence",
  "targetUnitDigest": "812a31e2133e9a10ebd275c43d64b3a0e65e1c70c6b761bb5ac01dcdb4b2ada8",
  "targetAncestry": [
    "Verification: <Claim>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/verification.md#2-acceptance-evidence to docs/platform/documentation/history/templates/verification.md#2-acceptance-evidence. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/verification.md#2-acceptance-evidence`
Source unit SHA256: `812a31e2133e9a10ebd275c43d64b3a0e65e1c70c6b761bb5ac01dcdb4b2ada8`
Shown source SHA256: `1c7fa89acef761842f0cd23e3da5e506951303b983e8fd56866fb6814cc760e5`

````text
## 2. Acceptance Evidence
````

Target: `docs/platform/documentation/history/templates/verification.md#2-acceptance-evidence`
Target unit SHA256: `812a31e2133e9a10ebd275c43d64b3a0e65e1c70c6b761bb5ac01dcdb4b2ada8`
Shown target SHA256: `1c7fa89acef761842f0cd23e3da5e506951303b983e8fd56866fb6814cc760e5`

````text
## 2. Acceptance Evidence
````

````diff

````
## source-decision claim_bb5a3eacd48f9a3f24329ca07d8b7b85

Decision:

````json
{
  "claimId": "claim_bb5a3eacd48f9a3f24329ca07d8b7b85",
  "sourceUnitDigest": "4c00a249e92384adbd64972b717c2cd011998ebb031a8e94b830427505863a8a",
  "targetOwner": "docs/platform/documentation/history/templates/verification.md",
  "targetAnchor": "3-procedure",
  "targetUnitDigest": "4c00a249e92384adbd64972b717c2cd011998ebb031a8e94b830427505863a8a",
  "targetAncestry": [
    "Verification: <Claim>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/verification.md#3-procedure to docs/platform/documentation/history/templates/verification.md#3-procedure. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/verification.md#3-procedure`
Source unit SHA256: `4c00a249e92384adbd64972b717c2cd011998ebb031a8e94b830427505863a8a`
Shown source SHA256: `0ea9a4ae13cc4476a0ee178c4d321d3cc031bf982c35b11ae3998b3a73b60cca`

````text
## 3. Procedure
````

Target: `docs/platform/documentation/history/templates/verification.md#3-procedure`
Target unit SHA256: `4c00a249e92384adbd64972b717c2cd011998ebb031a8e94b830427505863a8a`
Shown target SHA256: `0ea9a4ae13cc4476a0ee178c4d321d3cc031bf982c35b11ae3998b3a73b60cca`

````text
## 3. Procedure
````

````diff

````
## source-decision claim_ce08bbb844ab2fa273386174c79adf84

Decision:

````json
{
  "claimId": "claim_ce08bbb844ab2fa273386174c79adf84",
  "sourceUnitDigest": "be27453be2283b45de057d6aac5581df74fb6d8d63c033fa52bb78f9e28b0322",
  "targetOwner": "docs/platform/documentation/history/templates/verification.md",
  "targetAnchor": "4-current-evidence-status",
  "targetUnitDigest": "be27453be2283b45de057d6aac5581df74fb6d8d63c033fa52bb78f9e28b0322",
  "targetAncestry": [
    "Verification: <Claim>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/verification.md#4-current-evidence-status to docs/platform/documentation/history/templates/verification.md#4-current-evidence-status. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/verification.md#4-current-evidence-status`
Source unit SHA256: `be27453be2283b45de057d6aac5581df74fb6d8d63c033fa52bb78f9e28b0322`
Shown source SHA256: `3b1c5cc731256c01469c3e21cb90294f46e6a279fa98d1718e7b03c674d4e60b`

````text
## 4. Current Evidence Status
````

Target: `docs/platform/documentation/history/templates/verification.md#4-current-evidence-status`
Target unit SHA256: `be27453be2283b45de057d6aac5581df74fb6d8d63c033fa52bb78f9e28b0322`
Shown target SHA256: `3b1c5cc731256c01469c3e21cb90294f46e6a279fa98d1718e7b03c674d4e60b`

````text
## 4. Current Evidence Status
````

````diff

````
## source-decision claim_7325a8a88cc51c84dec9366965dac02e

Decision:

````json
{
  "claimId": "claim_7325a8a88cc51c84dec9366965dac02e",
  "sourceUnitDigest": "9ce20c443197a4488d966dc178ac327583748ff2916ad5744c71e4442ac09716",
  "targetOwner": "docs/platform/documentation/history/templates/verification.md",
  "targetAnchor": "5-known-gaps",
  "targetUnitDigest": "9ce20c443197a4488d966dc178ac327583748ff2916ad5744c71e4442ac09716",
  "targetAncestry": [
    "Verification: <Claim>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/verification.md#5-known-gaps to docs/platform/documentation/history/templates/verification.md#5-known-gaps. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/verification.md#5-known-gaps`
Source unit SHA256: `9ce20c443197a4488d966dc178ac327583748ff2916ad5744c71e4442ac09716`
Shown source SHA256: `47910348ee64d64e04ae5213ea18babab7fc880003c06569ce871215b907d72f`

````text
## 5. Known Gaps
````

Target: `docs/platform/documentation/history/templates/verification.md#5-known-gaps`
Target unit SHA256: `9ce20c443197a4488d966dc178ac327583748ff2916ad5744c71e4442ac09716`
Shown target SHA256: `47910348ee64d64e04ae5213ea18babab7fc880003c06569ce871215b907d72f`

````text
## 5. Known Gaps
````

````diff

````
## source-decision claim_e15c3758602d9e89cb76bb9788146522

Decision:

````json
{
  "claimId": "claim_e15c3758602d9e89cb76bb9788146522",
  "sourceUnitDigest": "d56ba799cef5d65bb1a61e8a7a631010354e87bc776ceea658ae6e2b38e6888c",
  "targetOwner": "docs/platform/documentation/history/templates/verification.md",
  "targetAnchor": "6-traceability",
  "targetUnitDigest": "d56ba799cef5d65bb1a61e8a7a631010354e87bc776ceea658ae6e2b38e6888c",
  "targetAncestry": [
    "Verification: <Claim>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/verification.md#6-traceability to docs/platform/documentation/history/templates/verification.md#6-traceability. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/verification.md#6-traceability`
Source unit SHA256: `d56ba799cef5d65bb1a61e8a7a631010354e87bc776ceea658ae6e2b38e6888c`
Shown source SHA256: `1ee1385d9b3dd44a47ff4a9e45a6ac313f62312c700bb628d961487d7593287f`

````text
## 6. Traceability
````

Target: `docs/platform/documentation/history/templates/verification.md#6-traceability`
Target unit SHA256: `d56ba799cef5d65bb1a61e8a7a631010354e87bc776ceea658ae6e2b38e6888c`
Shown target SHA256: `1ee1385d9b3dd44a47ff4a9e45a6ac313f62312c700bb628d961487d7593287f`

````text
## 6. Traceability
````

````diff

````
## source-decision claim_e31df097ecd5ad85e6bda9ea267988c1

Decision:

````json
{
  "claimId": "claim_e31df097ecd5ad85e6bda9ea267988c1",
  "sourceUnitDigest": "06d2e52826012cdf7e5a36ebe7e8e86e8123d4da34b186d696599faecced7e31",
  "targetOwner": "docs/platform/documentation/history/templates/verification.md",
  "targetAnchor": "7-related-files",
  "targetUnitDigest": "1dbac81d11473808583dd64e804c1978fbcd9606a1affb4c1a8c6d907cd9c2b8",
  "targetAncestry": [
    "Verification: <Claim>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/verification.md#7-related-files to docs/platform/documentation/history/templates/verification.md#7-related-files. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/verification.md#7-related-files`
Source unit SHA256: `06d2e52826012cdf7e5a36ebe7e8e86e8123d4da34b186d696599faecced7e31`
Shown source SHA256: `fec628ced7678a7be6dc9fe5cc13914739b9f1d666e0627eaa3e9d0a8789bacc`

````text
## 7. Related Files

| Relationship | File |
|---|---|
| claim owner | [../README.md](../README.md) |
| current behavior | [../spec.md](../spec.md) |
| contract or architecture proved | <link> |
````

Target: `docs/platform/documentation/history/templates/verification.md#7-related-files`
Target unit SHA256: `1dbac81d11473808583dd64e804c1978fbcd9606a1affb4c1a8c6d907cd9c2b8`
Shown target SHA256: `294620b7f7ba0307552105069b43abec44759663ab155263c9a411ae74614531`

````text
## 7. Related Files

```markdown
| Relationship | File |
|---|---|
| claim owner | [../README.md](../README.md) |
| current behavior | [../spec.md](../spec.md) |
| contract or architecture proved | <link> |
```
````

````diff
--- docs/templates/verification.md
+++ docs/platform/documentation/history/templates/verification.md
@@ -2,0 +3 @@
+```markdown
@@ -7 +8,2 @@
-| contract or architecture proved | <link> |+| contract or architecture proved | <link> |
+```
````
## source-decision claim_60fb20199e23f76f2d75a69ab7b6df63

Decision:

````json
{
  "claimId": "claim_60fb20199e23f76f2d75a69ab7b6df63",
  "sourceUnitDigest": "5d8f7cd0fabc70ce7e9ab5be6bef99966fbcf74c227d6719c84628d6649b72fc",
  "targetOwner": "docs/platform/documentation/history/templates/verification.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "67a656ed1bb123b204b3fe96ab8ce974a4ef28f17d4368a56e7833563a17d6b0",
  "targetAncestry": [
    "Verification: <Claim>",
    "7. Related Files"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/verification.md#unheaded-block-2 to docs/platform/documentation/history/templates/verification.md#unheaded-block-2. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/verification.md#unheaded-block-2`
Source unit SHA256: `5d8f7cd0fabc70ce7e9ab5be6bef99966fbcf74c227d6719c84628d6649b72fc`
Shown source SHA256: `5d8f7cd0fabc70ce7e9ab5be6bef99966fbcf74c227d6719c84628d6649b72fc`

````text
| Relationship | File |
|---|---|
| claim owner | [../README.md](../README.md) |
| current behavior | [../spec.md](../spec.md) |
| contract or architecture proved | <link> |
````

Target: `docs/platform/documentation/history/templates/verification.md#unheaded-block-2`
Target unit SHA256: `67a656ed1bb123b204b3fe96ab8ce974a4ef28f17d4368a56e7833563a17d6b0`
Shown target SHA256: `67a656ed1bb123b204b3fe96ab8ce974a4ef28f17d4368a56e7833563a17d6b0`

````text
```markdown
| Relationship | File |
|---|---|
| claim owner | [../README.md](../README.md) |
| current behavior | [../spec.md](../spec.md) |
| contract or architecture proved | <link> |
```
````

````diff
--- docs/templates/verification.md
+++ docs/platform/documentation/history/templates/verification.md
@@ -0,0 +1 @@
+```markdown
@@ -5 +6,2 @@
-| contract or architecture proved | <link> |+| contract or architecture proved | <link> |
+```
````
## source-decision claim_07a6749be69305a6aa18ce2425f4582b

Decision:

````json
{
  "claimId": "claim_07a6749be69305a6aa18ce2425f4582b",
  "sourceUnitDigest": "69e48da70a1b128a6679cf4ae5efab1cd20be1137184b3c4271f5575c0718bed",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "vision",
  "targetUnitDigest": "28d464a3a28a6ae9aa62c5f496b3fd52c3719d042dae0ca24ddc1d4b6d860c84",
  "targetAncestry": [],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#vision to docs/platform/documentation/history/templates/vision.md#vision. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#vision`
Source unit SHA256: `69e48da70a1b128a6679cf4ae5efab1cd20be1137184b3c4271f5575c0718bed`
Shown source SHA256: `d4c932cc54ebe3e7e40b77e7243eba45ee2fa297298386ccf8926bd13f0a38d8`

````text
# Vision: <Area>

```txt
Document type: Vision
Audience: Human reviewer, architect, maintainer, agent
Purpose: State the full intended direction, mission fit, and non-scope for <area>
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Full intended direction for <area>
Use this when: You need the north star before accepting, narrowing, or staging <area> work
Do not use this for: Current behavior without checking spec.md, or proof without checking verification
Last reviewed: YYYY-MM-DD
Related:
- `intent-preservation-ledger.md`
- `spec.md`
```
````

Target: `docs/platform/documentation/history/templates/vision.md#vision`
Target unit SHA256: `28d464a3a28a6ae9aa62c5f496b3fd52c3719d042dae0ca24ddc1d4b6d860c84`
Shown target SHA256: `605559e1810884acd8025c62633554884236ddc253684ec97fdc1cd6aa53061e`

````text
# Vision: <Area>

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/templates/vision.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/templates/vision.md
Supersedes: None; candidate only
Superseded by: None
```
````

````diff
--- docs/templates/vision.md
+++ docs/platform/documentation/history/templates/vision.md
@@ -4,11 +4,12 @@
-Document type: Vision
-Audience: Human reviewer, architect, maintainer, agent
-Purpose: State the full intended direction, mission fit, and non-scope for <area>
-Design status: Draft
-Implementation: N/A
-Provenance: Human + agent coauthor
-Writer type: Human + agent coauthor
-Canonical for: Full intended direction for <area>
-Use this when: You need the north star before accepting, narrowing, or staging <area> work
-Do not use this for: Current behavior without checking spec.md, or proof without checking verification
-Last reviewed: YYYY-MM-DD
+Document type: History
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/templates/vision.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
@@ -16,2 +17,3 @@
-- `intent-preservation-ledger.md`
-- `spec.md`
+- docs/templates/vision.md
+Supersedes: None; candidate only
+Superseded by: None
````
## source-decision claim_97c68529a35e8087f8d2dee188ae0dd2

Decision:

````json
{
  "claimId": "claim_97c68529a35e8087f8d2dee188ae0dd2",
  "sourceUnitDigest": "241b0de7825b48aea9e32c9dd526094312f29ea501922d5237236bc16cc38f00",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "e0a02e834096f03b0ad821633ec08765b8cd829984ad096ffc215a797cf2e0a7",
  "targetAncestry": [
    "Vision: <Area>",
    "Source Metadata (Added in candidate)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#unheaded-block-1 to docs/platform/documentation/history/templates/vision.md#unheaded-block-5. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Original metadata is retained verbatim under Source Metadata (Added in candidate), separate from the candidate authority header. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#unheaded-block-1`
Source unit SHA256: `241b0de7825b48aea9e32c9dd526094312f29ea501922d5237236bc16cc38f00`
Shown source SHA256: `241b0de7825b48aea9e32c9dd526094312f29ea501922d5237236bc16cc38f00`

````text
```txt
Document type: Vision
Audience: Human reviewer, architect, maintainer, agent
Purpose: State the full intended direction, mission fit, and non-scope for <area>
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Full intended direction for <area>
Use this when: You need the north star before accepting, narrowing, or staging <area> work
Do not use this for: Current behavior without checking spec.md, or proof without checking verification
Last reviewed: YYYY-MM-DD
Related:
- `intent-preservation-ledger.md`
- `spec.md`
```
````

Target: `docs/platform/documentation/history/templates/vision.md#unheaded-block-5`
Target unit SHA256: `e0a02e834096f03b0ad821633ec08765b8cd829984ad096ffc215a797cf2e0a7`
Shown target SHA256: `e0a02e834096f03b0ad821633ec08765b8cd829984ad096ffc215a797cf2e0a7`

`````text
````text
```txt
Document type: Vision
Audience: Human reviewer, architect, maintainer, agent
Purpose: State the full intended direction, mission fit, and non-scope for <area>
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Full intended direction for <area>
Use this when: You need the north star before accepting, narrowing, or staging <area> work
Do not use this for: Current behavior without checking spec.md, or proof without checking verification
Last reviewed: YYYY-MM-DD
Related:
- `intent-preservation-ledger.md`
- `spec.md`
```
````
`````

`````diff
--- docs/templates/vision.md
+++ docs/platform/documentation/history/templates/vision.md
@@ -0,0 +1 @@
+````text
@@ -16 +17,2 @@
-```+```
+````
`````
## source-decision claim_fd36aa6d5ecde01def3d53c0007670ca

Decision:

````json
{
  "claimId": "claim_fd36aa6d5ecde01def3d53c0007670ca",
  "sourceUnitDigest": "e008f4420e278caad8afa31028a0c49c1ae2422e2bb99bbdfab4c0bd433d94ab",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "1-purpose",
  "targetUnitDigest": "e008f4420e278caad8afa31028a0c49c1ae2422e2bb99bbdfab4c0bd433d94ab",
  "targetAncestry": [
    "<Area> Intent Preservation Ledger"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "The whole empty template heading is byte-identical to claim_92eba2424b594a6bddea4f6ee0e2d82c; one shared history owner docs/platform/documentation/history/templates/intent-preservation-ledger.md#1-purpose conserves both units under the identical-unit rule. The full former template remains independently preserved at its mapped history path, including this empty heading. No behavioral assertion, truth certification or source retirement. Both source decisions stay pending."
}
````

Source: `docs/templates/vision.md#1-purpose`
Source unit SHA256: `e008f4420e278caad8afa31028a0c49c1ae2422e2bb99bbdfab4c0bd433d94ab`
Shown source SHA256: `d554ba84b1559c01a9eb1628d110baa45b8e38e942fc3ac08a0a3bd32561b6c4`

````text
## 1. Purpose
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#1-purpose`
Target unit SHA256: `e008f4420e278caad8afa31028a0c49c1ae2422e2bb99bbdfab4c0bd433d94ab`
Shown target SHA256: `d554ba84b1559c01a9eb1628d110baa45b8e38e942fc3ac08a0a3bd32561b6c4`

````text
## 1. Purpose
````

````diff

````
## source-decision claim_47b0f20bb3b210336db5f9c4042ee52e

Decision:

````json
{
  "claimId": "claim_47b0f20bb3b210336db5f9c4042ee52e",
  "sourceUnitDigest": "6e102f95ce7de1743a17764020133983d1a561443c06691ccdc3d73d26197612",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "2-mission-fit",
  "targetUnitDigest": "6e102f95ce7de1743a17764020133983d1a561443c06691ccdc3d73d26197612",
  "targetAncestry": [
    "Vision: <Area>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#2-mission-fit to docs/platform/documentation/history/templates/vision.md#2-mission-fit. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#2-mission-fit`
Source unit SHA256: `6e102f95ce7de1743a17764020133983d1a561443c06691ccdc3d73d26197612`
Shown source SHA256: `2134f7dbc87cac04d20bf5150a2c219c61204de492e0dc66450a366e5f891fb3`

````text
## 2. Mission Fit
````

Target: `docs/platform/documentation/history/templates/vision.md#2-mission-fit`
Target unit SHA256: `6e102f95ce7de1743a17764020133983d1a561443c06691ccdc3d73d26197612`
Shown target SHA256: `2134f7dbc87cac04d20bf5150a2c219c61204de492e0dc66450a366e5f891fb3`

````text
## 2. Mission Fit
````

````diff

````
## source-decision claim_6645662f1fbda88084ca672b0febb705

Decision:

````json
{
  "claimId": "claim_6645662f1fbda88084ca672b0febb705",
  "sourceUnitDigest": "2c83269a2e2c01a226c15e65f49ba57e8f24b6a76b5372173ad963803513dbc8",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "3-full-intended-shape",
  "targetUnitDigest": "2c83269a2e2c01a226c15e65f49ba57e8f24b6a76b5372173ad963803513dbc8",
  "targetAncestry": [
    "Vision: <Area>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#3-full-intended-shape to docs/platform/documentation/history/templates/vision.md#3-full-intended-shape. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#3-full-intended-shape`
Source unit SHA256: `2c83269a2e2c01a226c15e65f49ba57e8f24b6a76b5372173ad963803513dbc8`
Shown source SHA256: `9a70bb3820b21c44e86c6cad0458bb2760bc655a4534f5ef589c0dc528c0b34e`

````text
## 3. Full Intended Shape

Describe the complete direction, even if implementation will ship in smaller
slices.
````

Target: `docs/platform/documentation/history/templates/vision.md#3-full-intended-shape`
Target unit SHA256: `2c83269a2e2c01a226c15e65f49ba57e8f24b6a76b5372173ad963803513dbc8`
Shown target SHA256: `9a70bb3820b21c44e86c6cad0458bb2760bc655a4534f5ef589c0dc528c0b34e`

````text
## 3. Full Intended Shape

Describe the complete direction, even if implementation will ship in smaller
slices.
````

````diff

````
## source-decision claim_f3842d1ec913d8cc36f2ea86353a3225

Decision:

````json
{
  "claimId": "claim_f3842d1ec913d8cc36f2ea86353a3225",
  "sourceUnitDigest": "437e33962f5ef84a127b1a8cf4a180dba02bee479d4ca938dd676826743e1262",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "437e33962f5ef84a127b1a8cf4a180dba02bee479d4ca938dd676826743e1262",
  "targetAncestry": [
    "Vision: <Area>",
    "3. Full Intended Shape"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#unheaded-block-2 to docs/platform/documentation/history/templates/vision.md#unheaded-block-2. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#unheaded-block-2`
Source unit SHA256: `437e33962f5ef84a127b1a8cf4a180dba02bee479d4ca938dd676826743e1262`
Shown source SHA256: `437e33962f5ef84a127b1a8cf4a180dba02bee479d4ca938dd676826743e1262`

````text
Describe the complete direction, even if implementation will ship in smaller
slices.
````

Target: `docs/platform/documentation/history/templates/vision.md#unheaded-block-2`
Target unit SHA256: `437e33962f5ef84a127b1a8cf4a180dba02bee479d4ca938dd676826743e1262`
Shown target SHA256: `437e33962f5ef84a127b1a8cf4a180dba02bee479d4ca938dd676826743e1262`

````text
Describe the complete direction, even if implementation will ship in smaller
slices.
````

````diff

````
## source-decision claim_20bc110149a3bd2a2e649115d1658eb1

Decision:

````json
{
  "claimId": "claim_20bc110149a3bd2a2e649115d1658eb1",
  "sourceUnitDigest": "80b3bfe3f3e7602da62fa064d789383164e7eac1c3a0b60ada49e5c13f5e22f7",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "4-non-scope",
  "targetUnitDigest": "80b3bfe3f3e7602da62fa064d789383164e7eac1c3a0b60ada49e5c13f5e22f7",
  "targetAncestry": [
    "Vision: <Area>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#4-non-scope to docs/platform/documentation/history/templates/vision.md#4-non-scope. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#4-non-scope`
Source unit SHA256: `80b3bfe3f3e7602da62fa064d789383164e7eac1c3a0b60ada49e5c13f5e22f7`
Shown source SHA256: `928d0fc5255f22e9f7ba632bb55ebc7d6efb2da14eb8a03aaf12bd12f8aaa0a3`

````text
## 4. Non-Scope
````

Target: `docs/platform/documentation/history/templates/vision.md#4-non-scope`
Target unit SHA256: `80b3bfe3f3e7602da62fa064d789383164e7eac1c3a0b60ada49e5c13f5e22f7`
Shown target SHA256: `928d0fc5255f22e9f7ba632bb55ebc7d6efb2da14eb8a03aaf12bd12f8aaa0a3`

````text
## 4. Non-Scope
````

````diff

````
## source-decision claim_d519a77e315a8b80326ff96c6e9b69a0

Decision:

````json
{
  "claimId": "claim_d519a77e315a8b80326ff96c6e9b69a0",
  "sourceUnitDigest": "69b4d984ee2dc40c8cc198c5563bbcee4079f80ddffe63a0f43696c2ec87713e",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "5-product-priorities-and-trade-offs",
  "targetUnitDigest": "69b4d984ee2dc40c8cc198c5563bbcee4079f80ddffe63a0f43696c2ec87713e",
  "targetAncestry": [
    "Vision: <Area>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#5-product-priorities-and-trade-offs to docs/platform/documentation/history/templates/vision.md#5-product-priorities-and-trade-offs. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#5-product-priorities-and-trade-offs`
Source unit SHA256: `69b4d984ee2dc40c8cc198c5563bbcee4079f80ddffe63a0f43696c2ec87713e`
Shown source SHA256: `5c515c36877969d15db3673c045d07e3f3d1e4840a021ab0240c66dd47ab4d28`

````text
## 5. Product Priorities And Trade-Offs
````

Target: `docs/platform/documentation/history/templates/vision.md#5-product-priorities-and-trade-offs`
Target unit SHA256: `69b4d984ee2dc40c8cc198c5563bbcee4079f80ddffe63a0f43696c2ec87713e`
Shown target SHA256: `5c515c36877969d15db3673c045d07e3f3d1e4840a021ab0240c66dd47ab4d28`

````text
## 5. Product Priorities And Trade-Offs
````

````diff

````
## source-decision claim_f30f14a4fee5cb27d7e215d30751d1ea

Decision:

````json
{
  "claimId": "claim_f30f14a4fee5cb27d7e215d30751d1ea",
  "sourceUnitDigest": "e46dcc90755604b137a0c662f380dc3aeaf25aca0cce01f19bc76fc9af118477",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "6-what-must-stay-true",
  "targetUnitDigest": "e46dcc90755604b137a0c662f380dc3aeaf25aca0cce01f19bc76fc9af118477",
  "targetAncestry": [
    "Vision: <Area>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#6-what-must-stay-true to docs/platform/documentation/history/templates/vision.md#6-what-must-stay-true. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#6-what-must-stay-true`
Source unit SHA256: `e46dcc90755604b137a0c662f380dc3aeaf25aca0cce01f19bc76fc9af118477`
Shown source SHA256: `f5aa4bd1dd8f9abbcd66fd71999872a2e9fd7857f3c1d119f794d76c8711ad6c`

````text
## 6. What Must Stay True
````

Target: `docs/platform/documentation/history/templates/vision.md#6-what-must-stay-true`
Target unit SHA256: `e46dcc90755604b137a0c662f380dc3aeaf25aca0cce01f19bc76fc9af118477`
Shown target SHA256: `f5aa4bd1dd8f9abbcd66fd71999872a2e9fd7857f3c1d119f794d76c8711ad6c`

````text
## 6. What Must Stay True
````

````diff

````
## source-decision claim_a3a1c2a0aa732e9c30068537f058f374

Decision:

````json
{
  "claimId": "claim_a3a1c2a0aa732e9c30068537f058f374",
  "sourceUnitDigest": "660413549cc4189a96e8b239ca4cf4d5cacc5304723a1e9d0d70279fc61930b1",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "7-implementation-staging-notes",
  "targetUnitDigest": "660413549cc4189a96e8b239ca4cf4d5cacc5304723a1e9d0d70279fc61930b1",
  "targetAncestry": [
    "Vision: <Area>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#7-implementation-staging-notes to docs/platform/documentation/history/templates/vision.md#7-implementation-staging-notes. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#7-implementation-staging-notes`
Source unit SHA256: `660413549cc4189a96e8b239ca4cf4d5cacc5304723a1e9d0d70279fc61930b1`
Shown source SHA256: `9ff9ae00cb575725250c47ee1f36b8dc295b2b6859a50cd8da1cd3e1c79c8d32`

````text
## 7. Implementation Staging Notes

Point to the intent preservation ledger for deferred or simplified parts of the
vision. A staged implementation does not shrink this vision by itself.
````

Target: `docs/platform/documentation/history/templates/vision.md#7-implementation-staging-notes`
Target unit SHA256: `660413549cc4189a96e8b239ca4cf4d5cacc5304723a1e9d0d70279fc61930b1`
Shown target SHA256: `9ff9ae00cb575725250c47ee1f36b8dc295b2b6859a50cd8da1cd3e1c79c8d32`

````text
## 7. Implementation Staging Notes

Point to the intent preservation ledger for deferred or simplified parts of the
vision. A staged implementation does not shrink this vision by itself.
````

````diff

````
## source-decision claim_b69d6f3847b770edb3ba5d699591d0b5

Decision:

````json
{
  "claimId": "claim_b69d6f3847b770edb3ba5d699591d0b5",
  "sourceUnitDigest": "33a9bd2028091a8bfdadf440282c2bf9ead0b84641cef616ac6772996f3fdaa7",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "33a9bd2028091a8bfdadf440282c2bf9ead0b84641cef616ac6772996f3fdaa7",
  "targetAncestry": [
    "Vision: <Area>",
    "7. Implementation Staging Notes"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#unheaded-block-3 to docs/platform/documentation/history/templates/vision.md#unheaded-block-3. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#unheaded-block-3`
Source unit SHA256: `33a9bd2028091a8bfdadf440282c2bf9ead0b84641cef616ac6772996f3fdaa7`
Shown source SHA256: `33a9bd2028091a8bfdadf440282c2bf9ead0b84641cef616ac6772996f3fdaa7`

````text
Point to the intent preservation ledger for deferred or simplified parts of the
vision. A staged implementation does not shrink this vision by itself.
````

Target: `docs/platform/documentation/history/templates/vision.md#unheaded-block-3`
Target unit SHA256: `33a9bd2028091a8bfdadf440282c2bf9ead0b84641cef616ac6772996f3fdaa7`
Shown target SHA256: `33a9bd2028091a8bfdadf440282c2bf9ead0b84641cef616ac6772996f3fdaa7`

````text
Point to the intent preservation ledger for deferred or simplified parts of the
vision. A staged implementation does not shrink this vision by itself.
````

````diff

````
## source-decision claim_bceeb9c028624cb642deccaba86b2688

Decision:

````json
{
  "claimId": "claim_bceeb9c028624cb642deccaba86b2688",
  "sourceUnitDigest": "65dcff8529e056d4cce8604571b0a088bb7b4d44bc388d9a04f0d7201a06c40c",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "8-related-files",
  "targetUnitDigest": "2eed557c82fd634ab26e6fb2c448d67aeded765f3f60b4bc754ef85a6465109f",
  "targetAncestry": [
    "Vision: <Area>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#8-related-files to docs/platform/documentation/history/templates/vision.md#8-related-files. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#8-related-files`
Source unit SHA256: `65dcff8529e056d4cce8604571b0a088bb7b4d44bc388d9a04f0d7201a06c40c`
Shown source SHA256: `9966b4ae4b19cb7670ad7d4b261cefdd3e0b9c93a5d65c5a31ee66ecfa55beba`

````text
## 8. Related Files

| Relationship | File |
|---|---|
| preserves deferred intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| current behavior | [spec.md](spec.md) |
````

Target: `docs/platform/documentation/history/templates/vision.md#8-related-files`
Target unit SHA256: `2eed557c82fd634ab26e6fb2c448d67aeded765f3f60b4bc754ef85a6465109f`
Shown target SHA256: `9beae628cbc169dece487c0cf6a55c5964a5bcba061ea345ae111dd5660a652a`

````text
## 8. Related Files

```markdown
| Relationship | File |
|---|---|
| preserves deferred intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| current behavior | [spec.md](spec.md) |
```
````

````diff
--- docs/templates/vision.md
+++ docs/platform/documentation/history/templates/vision.md
@@ -2,0 +3 @@
+```markdown
@@ -6 +7,2 @@
-| current behavior | [spec.md](spec.md) |+| current behavior | [spec.md](spec.md) |
+```
````
## source-decision claim_8d6c0a21110220c459497ae1f42f44c4

Decision:

````json
{
  "claimId": "claim_8d6c0a21110220c459497ae1f42f44c4",
  "sourceUnitDigest": "23734513736d05daa91e5540d7e80790c2b17e6a54d7b8015045440fcc984f79",
  "targetOwner": "docs/platform/documentation/history/templates/vision.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "3c4663acfb61a305663cfc21826b4847729335cce6494a1788014a7bfae8092d",
  "targetAncestry": [
    "Vision: <Area>",
    "8. Related Files"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/vision.md#unheaded-block-4 to docs/platform/documentation/history/templates/vision.md#unheaded-block-4. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/vision.md#unheaded-block-4`
Source unit SHA256: `23734513736d05daa91e5540d7e80790c2b17e6a54d7b8015045440fcc984f79`
Shown source SHA256: `23734513736d05daa91e5540d7e80790c2b17e6a54d7b8015045440fcc984f79`

````text
| Relationship | File |
|---|---|
| preserves deferred intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| current behavior | [spec.md](spec.md) |
````

Target: `docs/platform/documentation/history/templates/vision.md#unheaded-block-4`
Target unit SHA256: `3c4663acfb61a305663cfc21826b4847729335cce6494a1788014a7bfae8092d`
Shown target SHA256: `3c4663acfb61a305663cfc21826b4847729335cce6494a1788014a7bfae8092d`

````text
```markdown
| Relationship | File |
|---|---|
| preserves deferred intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| current behavior | [spec.md](spec.md) |
```
````

````diff
--- docs/templates/vision.md
+++ docs/platform/documentation/history/templates/vision.md
@@ -0,0 +1 @@
+```markdown
@@ -4 +5,2 @@
-| current behavior | [spec.md](spec.md) |+| current behavior | [spec.md](spec.md) |
+```
````
## source-decision claim_536fd6bd518a3ae183ba0b6a171894e0

Decision:

````json
{
  "claimId": "claim_536fd6bd518a3ae183ba0b6a171894e0",
  "sourceUnitDigest": "71fa1fe3696a2c79fe3bb5fba0ff855ffff38701d8802e94e1cd67366bbdb753",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-19",
  "targetUnitDigest": "20da3515e5e82adbcfc65f330ec56bedb48564a19734e2c8a9506a22b5bbad4b",
  "targetAncestry": [
    "Coexistence",
    "Source Metadata (Added in candidate)"
  ],
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-1 to docs/platform/coexistence/spec.md#unheaded-block-19. Carry the complete unit into its candidate spec owner. Original metadata is retained verbatim under Source Metadata (Added in candidate), separate from the candidate authority header. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-1`
Source unit SHA256: `71fa1fe3696a2c79fe3bb5fba0ff855ffff38701d8802e94e1cd67366bbdb753`
Shown source SHA256: `71fa1fe3696a2c79fe3bb5fba0ff855ffff38701d8802e94e1cd67366bbdb753`

````text
---
title: Coexistence — chạy cạnh một harness agent khác
status: living
relates_decisions: [ADR0009]
relates_backlog: [STR10]
---
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-19`
Target unit SHA256: `20da3515e5e82adbcfc65f330ec56bedb48564a19734e2c8a9506a22b5bbad4b`
Shown target SHA256: `20da3515e5e82adbcfc65f330ec56bedb48564a19734e2c8a9506a22b5bbad4b`

`````text
````text
---
title: Coexistence — chạy cạnh một harness agent khác
status: living
relates_decisions: [ADR0009]
relates_backlog: [STR10]
---
````
`````

`````diff
--- docs/coexistence.md
+++ docs/platform/coexistence/spec.md
@@ -0,0 +1 @@
+````text
@@ -6 +7,2 @@
----+---
+````
`````
## source-decision claim_0c761cc239c69f9ee0d1af9afded91d6

Decision:

````json
{
  "claimId": "claim_0c761cc239c69f9ee0d1af9afded91d6",
  "sourceUnitDigest": "b0191587880d503aa14c1fba92c5924d80d8a54068005a45da443ca135c2d144",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "coexistence",
  "targetUnitDigest": "b413d37c560d4b74feacaf1f5213efbe13c93e4d385ecbb3465a2f84d2c4fb3c",
  "targetAncestry": [],
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#coexistence to docs/platform/coexistence/spec.md#coexistence. Carry the complete unit into its candidate spec owner. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#coexistence`
Source unit SHA256: `b0191587880d503aa14c1fba92c5924d80d8a54068005a45da443ca135c2d144`
Shown source SHA256: `b5681acf70dbec99a5bf3a74696e0e9cd765fbda8465a89043b0a74a2f202b8a`

````text
# Coexistence

fgOS đôi khi chạy trong một project **cùng lúc với một harness agent khác** đã
có mặt (một công cụ điều phối agent bên ngoài fgOS — ví dụ có thể là quy trình
quản lý phiên, hook chặn ghi, hay bộ skill riêng của công cụ đó). Tài liệu này
là doctrine thi hành cho yêu cầu nền tảng ở `docs/decisions/0009-chong-giao-thoa-luc-cai.md`:
fgOS không giao thoa tiến trình với harness khác cùng máy. Nội dung dưới đây
mô tả hành vi của fgOS — không mô tả, không sửa, hành vi phía harness khác.
````

Target: `docs/platform/coexistence/spec.md#coexistence`
Target unit SHA256: `b413d37c560d4b74feacaf1f5213efbe13c93e4d385ecbb3465a2f84d2c4fb3c`
Shown target SHA256: `08b081e052cabd09fe0bea5fd3fecf24e3686eaf5592c32f0822ef8f827dcc5f`

````text
# Coexistence

```txt
Document type: Spec
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/coexistence.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/coexistence.md
Supersedes: None; candidate only
Superseded by: None
```

fgOS đôi khi chạy trong một project **cùng lúc với một harness agent khác** đã
có mặt (một công cụ điều phối agent bên ngoài fgOS — ví dụ có thể là quy trình
quản lý phiên, hook chặn ghi, hay bộ skill riêng của công cụ đó). Tài liệu này
là doctrine thi hành cho yêu cầu nền tảng ở `docs/decisions/0009-chong-giao-thoa-luc-cai.md`:
fgOS không giao thoa tiến trình với harness khác cùng máy. Nội dung dưới đây
mô tả hành vi của fgOS — không mô tả, không sửa, hành vi phía harness khác.
````

````diff
--- docs/coexistence.md
+++ docs/platform/coexistence/spec.md
@@ -1,0 +2,19 @@
+
+```txt
+Document type: Spec
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/coexistence.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
+Related:
+- docs/coexistence.md
+Supersedes: None; candidate only
+Superseded by: None
+```
````
## source-decision claim_70c98282d70c3019c5b0f518c5b41ca6

Decision:

````json
{
  "claimId": "claim_70c98282d70c3019c5b0f518c5b41ca6",
  "sourceUnitDigest": "7e62385ddc90d8d132134a247995fd6979516a226b5d8581507b4b4b23775ef5",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "7e62385ddc90d8d132134a247995fd6979516a226b5d8581507b4b4b23775ef5",
  "targetAncestry": [
    "Coexistence"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-2 to docs/platform/coexistence/spec.md#unheaded-block-2. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-2`
Source unit SHA256: `7e62385ddc90d8d132134a247995fd6979516a226b5d8581507b4b4b23775ef5`
Shown source SHA256: `7e62385ddc90d8d132134a247995fd6979516a226b5d8581507b4b4b23775ef5`

````text
fgOS đôi khi chạy trong một project **cùng lúc với một harness agent khác** đã
có mặt (một công cụ điều phối agent bên ngoài fgOS — ví dụ có thể là quy trình
quản lý phiên, hook chặn ghi, hay bộ skill riêng của công cụ đó). Tài liệu này
là doctrine thi hành cho yêu cầu nền tảng ở `docs/decisions/0009-chong-giao-thoa-luc-cai.md`:
fgOS không giao thoa tiến trình với harness khác cùng máy. Nội dung dưới đây
mô tả hành vi của fgOS — không mô tả, không sửa, hành vi phía harness khác.
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-2`
Target unit SHA256: `7e62385ddc90d8d132134a247995fd6979516a226b5d8581507b4b4b23775ef5`
Shown target SHA256: `7e62385ddc90d8d132134a247995fd6979516a226b5d8581507b4b4b23775ef5`

````text
fgOS đôi khi chạy trong một project **cùng lúc với một harness agent khác** đã
có mặt (một công cụ điều phối agent bên ngoài fgOS — ví dụ có thể là quy trình
quản lý phiên, hook chặn ghi, hay bộ skill riêng của công cụ đó). Tài liệu này
là doctrine thi hành cho yêu cầu nền tảng ở `docs/decisions/0009-chong-giao-thoa-luc-cai.md`:
fgOS không giao thoa tiến trình với harness khác cùng máy. Nội dung dưới đây
mô tả hành vi của fgOS — không mô tả, không sửa, hành vi phía harness khác.
````

````diff

````
## source-decision claim_1741941775d663e7bd58923814485a29

Decision:

````json
{
  "claimId": "claim_1741941775d663e7bd58923814485a29",
  "sourceUnitDigest": "1c83beca1cdbf50a13d29e16115296541d14ba9dc90c939f579b7e4233a4b1dc",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "lãnh-địa-territory",
  "targetUnitDigest": "1c83beca1cdbf50a13d29e16115296541d14ba9dc90c939f579b7e4233a4b1dc",
  "targetAncestry": [
    "Coexistence"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#lãnh-địa-territory to docs/platform/coexistence/spec.md#lãnh-địa-territory. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#lãnh-địa-territory`
Source unit SHA256: `1c83beca1cdbf50a13d29e16115296541d14ba9dc90c939f579b7e4233a4b1dc`
Shown source SHA256: `cfa2d1f1b76d116e0b95445c8fa21a79e5238a154a872f833df3735f0141ccc2`

````text
## Lãnh địa (territory)

fgOS chỉ ghi/khóa trong phạm vi:

| Path | Vai trò |
|---|---|
| `.fgos/` (theo cwd của project) | data dir — event log, view, manifest coexistence |
| `<tmpdir>/fgos-worktrees` (ngoài cây project) | worktree tạm cho mỗi work-item runner xử lý |
| nhánh `fgw/*` | nhánh git runner tạo cho mỗi worktree |

Ngoài ba phạm vi trên, fgOS chỉ ghi vào đúng hai cửa **có chủ** — luôn qua một
cổng có kiểm soát, không phải một hook quơ rộng:

1. **Merge-vào-trunk qua cổng duyệt người** (`fgos review`/`approve`/`reject`
   — spec: `docs/specs/runner.md`) — ghi vào trunk repo chỉ sau khi người
   duyệt một đề xuất.
2. **Chính source repo khi một runner worker được giao việc** — worker nhận
   dispatch, làm việc, commit lên nhánh `fgw/*` của chính nó; đây là bề mặt đã
   có chủ (runner), không phải một ghi tùy tiện ngoài lãnh địa.

Lãnh địa được ghi thành **manifest máy-đọc được**: `.fgos/coexistence.json`
(xem [Manifest schema](#manifest-schema-fgoscoexistencejson) dưới đây) — một
harness khác có thể đọc file này để biết chính xác fgOS ghi ở đâu, thay vì
đoán hoặc quét toàn cây.
````

Target: `docs/platform/coexistence/spec.md#lãnh-địa-territory`
Target unit SHA256: `1c83beca1cdbf50a13d29e16115296541d14ba9dc90c939f579b7e4233a4b1dc`
Shown target SHA256: `cfa2d1f1b76d116e0b95445c8fa21a79e5238a154a872f833df3735f0141ccc2`

````text
## Lãnh địa (territory)

fgOS chỉ ghi/khóa trong phạm vi:

| Path | Vai trò |
|---|---|
| `.fgos/` (theo cwd của project) | data dir — event log, view, manifest coexistence |
| `<tmpdir>/fgos-worktrees` (ngoài cây project) | worktree tạm cho mỗi work-item runner xử lý |
| nhánh `fgw/*` | nhánh git runner tạo cho mỗi worktree |

Ngoài ba phạm vi trên, fgOS chỉ ghi vào đúng hai cửa **có chủ** — luôn qua một
cổng có kiểm soát, không phải một hook quơ rộng:

1. **Merge-vào-trunk qua cổng duyệt người** (`fgos review`/`approve`/`reject`
   — spec: `docs/specs/runner.md`) — ghi vào trunk repo chỉ sau khi người
   duyệt một đề xuất.
2. **Chính source repo khi một runner worker được giao việc** — worker nhận
   dispatch, làm việc, commit lên nhánh `fgw/*` của chính nó; đây là bề mặt đã
   có chủ (runner), không phải một ghi tùy tiện ngoài lãnh địa.

Lãnh địa được ghi thành **manifest máy-đọc được**: `.fgos/coexistence.json`
(xem [Manifest schema](#manifest-schema-fgoscoexistencejson) dưới đây) — một
harness khác có thể đọc file này để biết chính xác fgOS ghi ở đâu, thay vì
đoán hoặc quét toàn cây.
````

````diff

````
## source-decision claim_6bb699f0b9c22cbffa3de482d8434b6a

Decision:

````json
{
  "claimId": "claim_6bb699f0b9c22cbffa3de482d8434b6a",
  "sourceUnitDigest": "54bd827efe52f713ee77267e027dd72235d5a6360dd2c2278ca21eb40d933521",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "54bd827efe52f713ee77267e027dd72235d5a6360dd2c2278ca21eb40d933521",
  "targetAncestry": [
    "Coexistence",
    "Lãnh địa (territory)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-3 to docs/platform/coexistence/spec.md#unheaded-block-3. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-3`
Source unit SHA256: `54bd827efe52f713ee77267e027dd72235d5a6360dd2c2278ca21eb40d933521`
Shown source SHA256: `54bd827efe52f713ee77267e027dd72235d5a6360dd2c2278ca21eb40d933521`

````text
fgOS chỉ ghi/khóa trong phạm vi:
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-3`
Target unit SHA256: `54bd827efe52f713ee77267e027dd72235d5a6360dd2c2278ca21eb40d933521`
Shown target SHA256: `54bd827efe52f713ee77267e027dd72235d5a6360dd2c2278ca21eb40d933521`

````text
fgOS chỉ ghi/khóa trong phạm vi:
````

````diff

````
## source-decision claim_4a216ec0b6a1a7bd8d104ef38a8dff45

Decision:

````json
{
  "claimId": "claim_4a216ec0b6a1a7bd8d104ef38a8dff45",
  "sourceUnitDigest": "3eff74f1ff0c6baf75fe6cd4cd141617f14528cb728a17773c7a57843a641323",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "3eff74f1ff0c6baf75fe6cd4cd141617f14528cb728a17773c7a57843a641323",
  "targetAncestry": [
    "Coexistence",
    "Lãnh địa (territory)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-4 to docs/platform/coexistence/spec.md#unheaded-block-4. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-4`
Source unit SHA256: `3eff74f1ff0c6baf75fe6cd4cd141617f14528cb728a17773c7a57843a641323`
Shown source SHA256: `3eff74f1ff0c6baf75fe6cd4cd141617f14528cb728a17773c7a57843a641323`

````text
| Path | Vai trò |
|---|---|
| `.fgos/` (theo cwd của project) | data dir — event log, view, manifest coexistence |
| `<tmpdir>/fgos-worktrees` (ngoài cây project) | worktree tạm cho mỗi work-item runner xử lý |
| nhánh `fgw/*` | nhánh git runner tạo cho mỗi worktree |
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-4`
Target unit SHA256: `3eff74f1ff0c6baf75fe6cd4cd141617f14528cb728a17773c7a57843a641323`
Shown target SHA256: `3eff74f1ff0c6baf75fe6cd4cd141617f14528cb728a17773c7a57843a641323`

````text
| Path | Vai trò |
|---|---|
| `.fgos/` (theo cwd của project) | data dir — event log, view, manifest coexistence |
| `<tmpdir>/fgos-worktrees` (ngoài cây project) | worktree tạm cho mỗi work-item runner xử lý |
| nhánh `fgw/*` | nhánh git runner tạo cho mỗi worktree |
````

````diff

````
## source-decision claim_9d6db4efcb1f3a21e8e19d67a624a53b

Decision:

````json
{
  "claimId": "claim_9d6db4efcb1f3a21e8e19d67a624a53b",
  "sourceUnitDigest": "3a51a9f8c9df009dfd174e9660ec9c5f32c34b5817a7c22045bd4d9d57dccf3c",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "3a51a9f8c9df009dfd174e9660ec9c5f32c34b5817a7c22045bd4d9d57dccf3c",
  "targetAncestry": [
    "Coexistence",
    "Lãnh địa (territory)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-5 to docs/platform/coexistence/spec.md#unheaded-block-5. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-5`
Source unit SHA256: `3a51a9f8c9df009dfd174e9660ec9c5f32c34b5817a7c22045bd4d9d57dccf3c`
Shown source SHA256: `3a51a9f8c9df009dfd174e9660ec9c5f32c34b5817a7c22045bd4d9d57dccf3c`

````text
Ngoài ba phạm vi trên, fgOS chỉ ghi vào đúng hai cửa **có chủ** — luôn qua một
cổng có kiểm soát, không phải một hook quơ rộng:
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-5`
Target unit SHA256: `3a51a9f8c9df009dfd174e9660ec9c5f32c34b5817a7c22045bd4d9d57dccf3c`
Shown target SHA256: `3a51a9f8c9df009dfd174e9660ec9c5f32c34b5817a7c22045bd4d9d57dccf3c`

````text
Ngoài ba phạm vi trên, fgOS chỉ ghi vào đúng hai cửa **có chủ** — luôn qua một
cổng có kiểm soát, không phải một hook quơ rộng:
````

````diff

````
## source-decision claim_9b21955627ce92a9373241a5ff3862f1

Decision:

````json
{
  "claimId": "claim_9b21955627ce92a9373241a5ff3862f1",
  "sourceUnitDigest": "e3320381434b8c090ebb654ce15209469300643cda58396dd0b44ee535db6b8a",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "e3320381434b8c090ebb654ce15209469300643cda58396dd0b44ee535db6b8a",
  "targetAncestry": [
    "Coexistence",
    "Lãnh địa (territory)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-6 to docs/platform/coexistence/spec.md#unheaded-block-6. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-6`
Source unit SHA256: `e3320381434b8c090ebb654ce15209469300643cda58396dd0b44ee535db6b8a`
Shown source SHA256: `e3320381434b8c090ebb654ce15209469300643cda58396dd0b44ee535db6b8a`

````text
1. **Merge-vào-trunk qua cổng duyệt người** (`fgos review`/`approve`/`reject`
   — spec: `docs/specs/runner.md`) — ghi vào trunk repo chỉ sau khi người
   duyệt một đề xuất.
2. **Chính source repo khi một runner worker được giao việc** — worker nhận
   dispatch, làm việc, commit lên nhánh `fgw/*` của chính nó; đây là bề mặt đã
   có chủ (runner), không phải một ghi tùy tiện ngoài lãnh địa.
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-6`
Target unit SHA256: `e3320381434b8c090ebb654ce15209469300643cda58396dd0b44ee535db6b8a`
Shown target SHA256: `e3320381434b8c090ebb654ce15209469300643cda58396dd0b44ee535db6b8a`

````text
1. **Merge-vào-trunk qua cổng duyệt người** (`fgos review`/`approve`/`reject`
   — spec: `docs/specs/runner.md`) — ghi vào trunk repo chỉ sau khi người
   duyệt một đề xuất.
2. **Chính source repo khi một runner worker được giao việc** — worker nhận
   dispatch, làm việc, commit lên nhánh `fgw/*` của chính nó; đây là bề mặt đã
   có chủ (runner), không phải một ghi tùy tiện ngoài lãnh địa.
````

````diff

````
## source-decision claim_77d2d3c11cc80b314525858b457a5609

Decision:

````json
{
  "claimId": "claim_77d2d3c11cc80b314525858b457a5609",
  "sourceUnitDigest": "23de78bfd6233e6be40e9b4a85b90b2355ef4d270ef61850a2932846f9d12aa4",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "23de78bfd6233e6be40e9b4a85b90b2355ef4d270ef61850a2932846f9d12aa4",
  "targetAncestry": [
    "Coexistence",
    "Lãnh địa (territory)"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-7 to docs/platform/coexistence/spec.md#unheaded-block-7. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-7`
Source unit SHA256: `23de78bfd6233e6be40e9b4a85b90b2355ef4d270ef61850a2932846f9d12aa4`
Shown source SHA256: `23de78bfd6233e6be40e9b4a85b90b2355ef4d270ef61850a2932846f9d12aa4`

````text
Lãnh địa được ghi thành **manifest máy-đọc được**: `.fgos/coexistence.json`
(xem [Manifest schema](#manifest-schema-fgoscoexistencejson) dưới đây) — một
harness khác có thể đọc file này để biết chính xác fgOS ghi ở đâu, thay vì
đoán hoặc quét toàn cây.
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-7`
Target unit SHA256: `23de78bfd6233e6be40e9b4a85b90b2355ef4d270ef61850a2932846f9d12aa4`
Shown target SHA256: `23de78bfd6233e6be40e9b4a85b90b2355ef4d270ef61850a2932846f9d12aa4`

````text
Lãnh địa được ghi thành **manifest máy-đọc được**: `.fgos/coexistence.json`
(xem [Manifest schema](#manifest-schema-fgoscoexistencejson) dưới đây) — một
harness khác có thể đọc file này để biết chính xác fgOS ghi ở đâu, thay vì
đoán hoặc quét toàn cây.
````

````diff

````
## source-decision claim_584075b067cebc0c0971bfc8cfa4a5a2

Decision:

````json
{
  "claimId": "claim_584075b067cebc0c0971bfc8cfa4a5a2",
  "sourceUnitDigest": "acb5fb274961e046674c51da1c970c33265b5deff0195ab067a18969c0b905b6",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "một-nhạc-trưởng-mỗi-phiên",
  "targetUnitDigest": "acb5fb274961e046674c51da1c970c33265b5deff0195ab067a18969c0b905b6",
  "targetAncestry": [
    "Coexistence"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#một-nhạc-trưởng-mỗi-phiên to docs/platform/coexistence/spec.md#một-nhạc-trưởng-mỗi-phiên. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#một-nhạc-trưởng-mỗi-phiên`
Source unit SHA256: `acb5fb274961e046674c51da1c970c33265b5deff0195ab067a18969c0b905b6`
Shown source SHA256: `9522979561e875c21bae27262f5a62ed73d492147119b6caa51b426dc9603ce4`

````text
## Một-nhạc-trưởng-mỗi-phiên

Trong một phiên agent, chỉ **một** bên điều phối: harness mà người gọi phiên
đó chỉ định. fgOS không tiêm mệnh lệnh điều phối vào phiên của một harness
khác — fgOS không tạo, không sửa `AGENTS.md` của project host để chèn khối
điều phối của mình vào đó. Khi một runner worker của fgOS được spawn, nó nhận
đúng contract dispatch của riêng fgOS (spec: `docs/specs/runner.md`) — không
liên quan gì tới nhạc trưởng của phiên host.
````

Target: `docs/platform/coexistence/spec.md#một-nhạc-trưởng-mỗi-phiên`
Target unit SHA256: `acb5fb274961e046674c51da1c970c33265b5deff0195ab067a18969c0b905b6`
Shown target SHA256: `9522979561e875c21bae27262f5a62ed73d492147119b6caa51b426dc9603ce4`

````text
## Một-nhạc-trưởng-mỗi-phiên

Trong một phiên agent, chỉ **một** bên điều phối: harness mà người gọi phiên
đó chỉ định. fgOS không tiêm mệnh lệnh điều phối vào phiên của một harness
khác — fgOS không tạo, không sửa `AGENTS.md` của project host để chèn khối
điều phối của mình vào đó. Khi một runner worker của fgOS được spawn, nó nhận
đúng contract dispatch của riêng fgOS (spec: `docs/specs/runner.md`) — không
liên quan gì tới nhạc trưởng của phiên host.
````

````diff

````
## source-decision claim_400b187e204d43d47bf0ef99b0a0c9e2

Decision:

````json
{
  "claimId": "claim_400b187e204d43d47bf0ef99b0a0c9e2",
  "sourceUnitDigest": "2620e281e1857265ac8d29ec6f70e429d4fa14fc9552f8673ee0a08839af451b",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "2620e281e1857265ac8d29ec6f70e429d4fa14fc9552f8673ee0a08839af451b",
  "targetAncestry": [
    "Coexistence",
    "Một-nhạc-trưởng-mỗi-phiên"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-8 to docs/platform/coexistence/spec.md#unheaded-block-8. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-8`
Source unit SHA256: `2620e281e1857265ac8d29ec6f70e429d4fa14fc9552f8673ee0a08839af451b`
Shown source SHA256: `2620e281e1857265ac8d29ec6f70e429d4fa14fc9552f8673ee0a08839af451b`

````text
Trong một phiên agent, chỉ **một** bên điều phối: harness mà người gọi phiên
đó chỉ định. fgOS không tiêm mệnh lệnh điều phối vào phiên của một harness
khác — fgOS không tạo, không sửa `AGENTS.md` của project host để chèn khối
điều phối của mình vào đó. Khi một runner worker của fgOS được spawn, nó nhận
đúng contract dispatch của riêng fgOS (spec: `docs/specs/runner.md`) — không
liên quan gì tới nhạc trưởng của phiên host.
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-8`
Target unit SHA256: `2620e281e1857265ac8d29ec6f70e429d4fa14fc9552f8673ee0a08839af451b`
Shown target SHA256: `2620e281e1857265ac8d29ec6f70e429d4fa14fc9552f8673ee0a08839af451b`

````text
Trong một phiên agent, chỉ **một** bên điều phối: harness mà người gọi phiên
đó chỉ định. fgOS không tiêm mệnh lệnh điều phối vào phiên của một harness
khác — fgOS không tạo, không sửa `AGENTS.md` của project host để chèn khối
điều phối của mình vào đó. Khi một runner worker của fgOS được spawn, nó nhận
đúng contract dispatch của riêng fgOS (spec: `docs/specs/runner.md`) — không
liên quan gì tới nhạc trưởng của phiên host.
````

````diff

````
## source-decision claim_776ecb30a65d1b3f58ded88bcea06a39

Decision:

````json
{
  "claimId": "claim_776ecb30a65d1b3f58ded88bcea06a39",
  "sourceUnitDigest": "e1f5e530fb904a48871439190074cd505353e0ce68393e231c7daccc025ed1e9",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "nhường-nhịn-lúc-init-marker-detection",
  "targetUnitDigest": "e1f5e530fb904a48871439190074cd505353e0ce68393e231c7daccc025ed1e9",
  "targetAncestry": [
    "Coexistence"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#nhường-nhịn-lúc-init-marker-detection to docs/platform/coexistence/spec.md#nhường-nhịn-lúc-init-marker-detection. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#nhường-nhịn-lúc-init-marker-detection`
Source unit SHA256: `e1f5e530fb904a48871439190074cd505353e0ce68393e231c7daccc025ed1e9`
Shown source SHA256: `1ed41204439ba65d079af4506b5f2d79f8bb19279c0cc3000e9608678a31aa91`

````text
## Nhường-nhịn lúc init (marker detection)

`fgos init` quét **read-only** project để nhận diện dấu hiệu (marker) một
harness khác đã có mặt: một số thư mục dấu ấn phổ biến (ví dụ `.bee/`,
`.claude/`, `.codex/`, `.cursor/` — tập khởi đầu, mở rộng được bằng cách thêm
dòng dữ liệu, không phải nhánh logic mới) và một khối managed trong
`AGENTS.md` của host nếu có (ví dụ một khối đánh dấu bằng comment mở/đóng
riêng của harness đó).

Ứng xử khi phát hiện:

- **Ghi nhận** — in ra output của `init` và lưu vào manifest
  (`detected_harnesses`), để cả người lẫn agent thấy ngay.
- **Không đè, không sửa** — `fgos init` không bao giờ ghi, đổi tên, hay xóa
  bất kỳ file nào thuộc về harness khác. Nếu host không có `AGENTS.md`, `fgos
  init` bỏ qua bước đó và **không tạo** file này — fgOS không tự ý đưa mình
  vào doctrine của một phiên do harness khác điều phối.
- **Lỗi đọc không chặn `init`** — nếu một marker không đọc được (ví dụ
  `AGENTS.md` bị hỏng quyền), `init` ghi nhận lỗi đó vào manifest chứ không
  làm hỏng lượt `init`.

`init` luôn thành công bất kể phát hiện gì.
````

Target: `docs/platform/coexistence/spec.md#nhường-nhịn-lúc-init-marker-detection`
Target unit SHA256: `e1f5e530fb904a48871439190074cd505353e0ce68393e231c7daccc025ed1e9`
Shown target SHA256: `1ed41204439ba65d079af4506b5f2d79f8bb19279c0cc3000e9608678a31aa91`

````text
## Nhường-nhịn lúc init (marker detection)

`fgos init` quét **read-only** project để nhận diện dấu hiệu (marker) một
harness khác đã có mặt: một số thư mục dấu ấn phổ biến (ví dụ `.bee/`,
`.claude/`, `.codex/`, `.cursor/` — tập khởi đầu, mở rộng được bằng cách thêm
dòng dữ liệu, không phải nhánh logic mới) và một khối managed trong
`AGENTS.md` của host nếu có (ví dụ một khối đánh dấu bằng comment mở/đóng
riêng của harness đó).

Ứng xử khi phát hiện:

- **Ghi nhận** — in ra output của `init` và lưu vào manifest
  (`detected_harnesses`), để cả người lẫn agent thấy ngay.
- **Không đè, không sửa** — `fgos init` không bao giờ ghi, đổi tên, hay xóa
  bất kỳ file nào thuộc về harness khác. Nếu host không có `AGENTS.md`, `fgos
  init` bỏ qua bước đó và **không tạo** file này — fgOS không tự ý đưa mình
  vào doctrine của một phiên do harness khác điều phối.
- **Lỗi đọc không chặn `init`** — nếu một marker không đọc được (ví dụ
  `AGENTS.md` bị hỏng quyền), `init` ghi nhận lỗi đó vào manifest chứ không
  làm hỏng lượt `init`.

`init` luôn thành công bất kể phát hiện gì.
````

````diff

````
## source-decision claim_0b6be5a559b8c342e9f32c990ee60887

Decision:

````json
{
  "claimId": "claim_0b6be5a559b8c342e9f32c990ee60887",
  "sourceUnitDigest": "787c56fbaae6d796210e94fc81178a80ebb7a12f0e6d582399504adaa83c669e",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-9",
  "targetUnitDigest": "787c56fbaae6d796210e94fc81178a80ebb7a12f0e6d582399504adaa83c669e",
  "targetAncestry": [
    "Coexistence",
    "Nhường-nhịn lúc init (marker detection)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-9 to docs/platform/coexistence/spec.md#unheaded-block-9. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-9`
Source unit SHA256: `787c56fbaae6d796210e94fc81178a80ebb7a12f0e6d582399504adaa83c669e`
Shown source SHA256: `787c56fbaae6d796210e94fc81178a80ebb7a12f0e6d582399504adaa83c669e`

````text
`fgos init` quét **read-only** project để nhận diện dấu hiệu (marker) một
harness khác đã có mặt: một số thư mục dấu ấn phổ biến (ví dụ `.bee/`,
`.claude/`, `.codex/`, `.cursor/` — tập khởi đầu, mở rộng được bằng cách thêm
dòng dữ liệu, không phải nhánh logic mới) và một khối managed trong
`AGENTS.md` của host nếu có (ví dụ một khối đánh dấu bằng comment mở/đóng
riêng của harness đó).
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-9`
Target unit SHA256: `787c56fbaae6d796210e94fc81178a80ebb7a12f0e6d582399504adaa83c669e`
Shown target SHA256: `787c56fbaae6d796210e94fc81178a80ebb7a12f0e6d582399504adaa83c669e`

````text
`fgos init` quét **read-only** project để nhận diện dấu hiệu (marker) một
harness khác đã có mặt: một số thư mục dấu ấn phổ biến (ví dụ `.bee/`,
`.claude/`, `.codex/`, `.cursor/` — tập khởi đầu, mở rộng được bằng cách thêm
dòng dữ liệu, không phải nhánh logic mới) và một khối managed trong
`AGENTS.md` của host nếu có (ví dụ một khối đánh dấu bằng comment mở/đóng
riêng của harness đó).
````

````diff

````
## source-decision claim_758e22a9189f1a0963d4fbd4d6d6962a

Decision:

````json
{
  "claimId": "claim_758e22a9189f1a0963d4fbd4d6d6962a",
  "sourceUnitDigest": "dc6ca9e9b25c3b5742da559f7f532ddd616ebd835ec0049e0e490f66c989a868",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-10",
  "targetUnitDigest": "dc6ca9e9b25c3b5742da559f7f532ddd616ebd835ec0049e0e490f66c989a868",
  "targetAncestry": [
    "Coexistence",
    "Nhường-nhịn lúc init (marker detection)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-10 to docs/platform/coexistence/spec.md#unheaded-block-10. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-10`
Source unit SHA256: `dc6ca9e9b25c3b5742da559f7f532ddd616ebd835ec0049e0e490f66c989a868`
Shown source SHA256: `dc6ca9e9b25c3b5742da559f7f532ddd616ebd835ec0049e0e490f66c989a868`

````text
Ứng xử khi phát hiện:

- **Ghi nhận** — in ra output của `init` và lưu vào manifest
  (`detected_harnesses`), để cả người lẫn agent thấy ngay.
- **Không đè, không sửa** — `fgos init` không bao giờ ghi, đổi tên, hay xóa
  bất kỳ file nào thuộc về harness khác. Nếu host không có `AGENTS.md`, `fgos
  init` bỏ qua bước đó và **không tạo** file này — fgOS không tự ý đưa mình
  vào doctrine của một phiên do harness khác điều phối.
- **Lỗi đọc không chặn `init`** — nếu một marker không đọc được (ví dụ
  `AGENTS.md` bị hỏng quyền), `init` ghi nhận lỗi đó vào manifest chứ không
  làm hỏng lượt `init`.
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-10`
Target unit SHA256: `dc6ca9e9b25c3b5742da559f7f532ddd616ebd835ec0049e0e490f66c989a868`
Shown target SHA256: `dc6ca9e9b25c3b5742da559f7f532ddd616ebd835ec0049e0e490f66c989a868`

````text
Ứng xử khi phát hiện:

- **Ghi nhận** — in ra output của `init` và lưu vào manifest
  (`detected_harnesses`), để cả người lẫn agent thấy ngay.
- **Không đè, không sửa** — `fgos init` không bao giờ ghi, đổi tên, hay xóa
  bất kỳ file nào thuộc về harness khác. Nếu host không có `AGENTS.md`, `fgos
  init` bỏ qua bước đó và **không tạo** file này — fgOS không tự ý đưa mình
  vào doctrine của một phiên do harness khác điều phối.
- **Lỗi đọc không chặn `init`** — nếu một marker không đọc được (ví dụ
  `AGENTS.md` bị hỏng quyền), `init` ghi nhận lỗi đó vào manifest chứ không
  làm hỏng lượt `init`.
````

````diff

````
## source-decision claim_691ffd30205cf61f2e6e319a603c033b

Decision:

````json
{
  "claimId": "claim_691ffd30205cf61f2e6e319a603c033b",
  "sourceUnitDigest": "3d25f914a61385efbe7bfb0515d8b6067929d046ce13e49fc952558c9cee09e4",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-11",
  "targetUnitDigest": "3d25f914a61385efbe7bfb0515d8b6067929d046ce13e49fc952558c9cee09e4",
  "targetAncestry": [
    "Coexistence",
    "Nhường-nhịn lúc init (marker detection)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-11 to docs/platform/coexistence/spec.md#unheaded-block-11. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-11`
Source unit SHA256: `3d25f914a61385efbe7bfb0515d8b6067929d046ce13e49fc952558c9cee09e4`
Shown source SHA256: `3d25f914a61385efbe7bfb0515d8b6067929d046ce13e49fc952558c9cee09e4`

````text
`init` luôn thành công bất kể phát hiện gì.
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-11`
Target unit SHA256: `3d25f914a61385efbe7bfb0515d8b6067929d046ce13e49fc952558c9cee09e4`
Shown target SHA256: `3d25f914a61385efbe7bfb0515d8b6067929d046ce13e49fc952558c9cee09e4`

````text
`init` luôn thành công bất kể phát hiện gì.
````

````diff

````
## source-decision claim_9edf8b90118646c6b94691ebc60e04da

Decision:

````json
{
  "claimId": "claim_9edf8b90118646c6b94691ebc60e04da",
  "sourceUnitDigest": "a27ccac8fc16e298014be7b1eae6e57f2c76cc3f8e69cd0b282b7383e636608a",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "manifest-schema-fgoscoexistencejson",
  "targetUnitDigest": "a27ccac8fc16e298014be7b1eae6e57f2c76cc3f8e69cd0b282b7383e636608a",
  "targetAncestry": [
    "Coexistence"
  ],
  "claimKind": "contract",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#manifest-schema-fgoscoexistencejson to docs/platform/coexistence/spec.md#manifest-schema-fgoscoexistencejson. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#manifest-schema-fgoscoexistencejson`
Source unit SHA256: `a27ccac8fc16e298014be7b1eae6e57f2c76cc3f8e69cd0b282b7383e636608a`
Shown source SHA256: `34d9d718aa860fb2de54ce0d8548acdf9f4ecf4ad67b54e18106d0fdac045f29`

````text
## Manifest schema (`.fgos/coexistence.json`)

```json
{
  "v": 1,
  "territory": {
    "data": ".fgos/",
    "worktrees": { "descriptor": "<tmpdir>/fgos-worktrees", "resolved": "/abs/path" },
    "branches": "fgw/*"
  },
  "detected_harnesses": [{ "name": "example-harness", "markers": [".example-dir"] }],
  "agentsMdReadError": "optional — chỉ có khi AGENTS.md tồn tại nhưng đọc lỗi"
}
```

`territory` mô tả đúng những gì `fgos.mjs`/`worktree.mjs` đã làm từ trước —
không phải một quy ước path mới được tính lại. `detected_harnesses` là mảng
gộp theo tên (một harness có cả marker thư mục lẫn khối AGENTS.md thì gộp
thành một entry).
````

Target: `docs/platform/coexistence/spec.md#manifest-schema-fgoscoexistencejson`
Target unit SHA256: `a27ccac8fc16e298014be7b1eae6e57f2c76cc3f8e69cd0b282b7383e636608a`
Shown target SHA256: `34d9d718aa860fb2de54ce0d8548acdf9f4ecf4ad67b54e18106d0fdac045f29`

````text
## Manifest schema (`.fgos/coexistence.json`)

```json
{
  "v": 1,
  "territory": {
    "data": ".fgos/",
    "worktrees": { "descriptor": "<tmpdir>/fgos-worktrees", "resolved": "/abs/path" },
    "branches": "fgw/*"
  },
  "detected_harnesses": [{ "name": "example-harness", "markers": [".example-dir"] }],
  "agentsMdReadError": "optional — chỉ có khi AGENTS.md tồn tại nhưng đọc lỗi"
}
```

`territory` mô tả đúng những gì `fgos.mjs`/`worktree.mjs` đã làm từ trước —
không phải một quy ước path mới được tính lại. `detected_harnesses` là mảng
gộp theo tên (một harness có cả marker thư mục lẫn khối AGENTS.md thì gộp
thành một entry).
````

````diff

````
## source-decision claim_a6e6648cd73c21fdebf2595693c144c0

Decision:

````json
{
  "claimId": "claim_a6e6648cd73c21fdebf2595693c144c0",
  "sourceUnitDigest": "bb3ecfdb26db74e2c1994e836bfa3948342cbe40c06066f4a34a4f9f8609ff79",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-12",
  "targetUnitDigest": "bb3ecfdb26db74e2c1994e836bfa3948342cbe40c06066f4a34a4f9f8609ff79",
  "targetAncestry": [
    "Coexistence",
    "Manifest schema (`.fgos/coexistence.json`)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-12 to docs/platform/coexistence/spec.md#unheaded-block-12. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-12`
Source unit SHA256: `bb3ecfdb26db74e2c1994e836bfa3948342cbe40c06066f4a34a4f9f8609ff79`
Shown source SHA256: `bb3ecfdb26db74e2c1994e836bfa3948342cbe40c06066f4a34a4f9f8609ff79`

````text
```json
{
  "v": 1,
  "territory": {
    "data": ".fgos/",
    "worktrees": { "descriptor": "<tmpdir>/fgos-worktrees", "resolved": "/abs/path" },
    "branches": "fgw/*"
  },
  "detected_harnesses": [{ "name": "example-harness", "markers": [".example-dir"] }],
  "agentsMdReadError": "optional — chỉ có khi AGENTS.md tồn tại nhưng đọc lỗi"
}
```
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-12`
Target unit SHA256: `bb3ecfdb26db74e2c1994e836bfa3948342cbe40c06066f4a34a4f9f8609ff79`
Shown target SHA256: `bb3ecfdb26db74e2c1994e836bfa3948342cbe40c06066f4a34a4f9f8609ff79`

````text
```json
{
  "v": 1,
  "territory": {
    "data": ".fgos/",
    "worktrees": { "descriptor": "<tmpdir>/fgos-worktrees", "resolved": "/abs/path" },
    "branches": "fgw/*"
  },
  "detected_harnesses": [{ "name": "example-harness", "markers": [".example-dir"] }],
  "agentsMdReadError": "optional — chỉ có khi AGENTS.md tồn tại nhưng đọc lỗi"
}
```
````

````diff

````
## source-decision claim_b9b328c05b626eb18f1dbb5396513f17

Decision:

````json
{
  "claimId": "claim_b9b328c05b626eb18f1dbb5396513f17",
  "sourceUnitDigest": "c251c70cd142a978cc0298ae1697eddb857d8634f5aef616f7d21e51e889843d",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-13",
  "targetUnitDigest": "c251c70cd142a978cc0298ae1697eddb857d8634f5aef616f7d21e51e889843d",
  "targetAncestry": [
    "Coexistence",
    "Manifest schema (`.fgos/coexistence.json`)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-13 to docs/platform/coexistence/spec.md#unheaded-block-13. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-13`
Source unit SHA256: `c251c70cd142a978cc0298ae1697eddb857d8634f5aef616f7d21e51e889843d`
Shown source SHA256: `c251c70cd142a978cc0298ae1697eddb857d8634f5aef616f7d21e51e889843d`

````text
`territory` mô tả đúng những gì `fgos.mjs`/`worktree.mjs` đã làm từ trước —
không phải một quy ước path mới được tính lại. `detected_harnesses` là mảng
gộp theo tên (một harness có cả marker thư mục lẫn khối AGENTS.md thì gộp
thành một entry).
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-13`
Target unit SHA256: `c251c70cd142a978cc0298ae1697eddb857d8634f5aef616f7d21e51e889843d`
Shown target SHA256: `c251c70cd142a978cc0298ae1697eddb857d8634f5aef616f7d21e51e889843d`

````text
`territory` mô tả đúng những gì `fgos.mjs`/`worktree.mjs` đã làm từ trước —
không phải một quy ước path mới được tính lại. `detected_harnesses` là mảng
gộp theo tên (một harness có cả marker thư mục lẫn khối AGENTS.md thì gộp
thành một entry).
````

````diff

````
## source-decision claim_b1d8fe26af0ff9fa6a578035f5c6945b

Decision:

````json
{
  "claimId": "claim_b1d8fe26af0ff9fa6a578035f5c6945b",
  "sourceUnitDigest": "a68c17326b60d7ad5acda9b48dc02434242230abac3b718ec828003693eedccc",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "known-gaps-thành-thật-chưa-flip",
  "targetUnitDigest": "a68c17326b60d7ad5acda9b48dc02434242230abac3b718ec828003693eedccc",
  "targetAncestry": [
    "Coexistence"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#known-gaps-thành-thật-chưa-flip to docs/platform/coexistence/spec.md#known-gaps-thành-thật-chưa-flip. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#known-gaps-thành-thật-chưa-flip`
Source unit SHA256: `a68c17326b60d7ad5acda9b48dc02434242230abac3b718ec828003693eedccc`
Shown source SHA256: `65c6d057fd38f2770d74eb3218a18d45a1ca493006f7190cbe5181826b5bb1ab`

````text
## Known Gaps (thành thật, chưa flip)

Nguyên tắc 2 của record ADR0009 ("hook gate theo path của mình — không quơ lên
path harness khác") hiện **chưa được thi hành ở phía harness ngoài fgOS**
trong đợt cài này. Một canary thật (spawn hook chặn-ghi thật của một harness
tham chiếu, chạy trong xưởng phát triển fgOS — xem
`docs/history/install-coexistence/reports/canary-run.md`, hồ sơ xưởng, không
thuộc repo sản phẩm này) đo được **hai loại chặn nhầm lãnh địa fgOS, hai CƠ
CHẾ hoàn toàn khác nhau**:

1. **Chặn theo-phase (phase-contingent):** một cổng "idle intake" của harness
   đó, khi phiên harness ở trạng thái nghỉ, deny MỌI ghi ngoài một allowlist
   tĩnh — bao gồm cả ghi vào `.fgos/`. Đây không phải luật nhắm riêng fgOS:
   một ghi bất kỳ khác ngoài allowlist (không liên quan gì tới fgOS) bị deny
   y hệt. Flip khi cổng này biết đọc territory manifest (`.fgos/coexistence.json`
   hoặc một registry tương đương) thay vì chỉ dùng allowlist tĩnh.
2. **Containment phi-phase (phase-independent):** một guard containment của
   harness đó deny ghi ra ngoài checkout vật lý của chính nó, kể cả khi đích
   ghi là worktree tạm hợp lệ của fgOS (`<tmpdir>/fgos-worktrees`) — guard này
   không quan tâm phase, chặn vô điều kiện. Flip khi guard này biết miễn trừ
   (exempt) một lãnh địa đã đăng ký của harness khác.

Hai fix trên **độc lập với nhau** — không có một sửa chung nào giải quyết cả
hai. Cả hai đều thuộc về cây mã nguồn của harness kia, không thuộc fgOS: fgOS
không tự sửa một harness khác. Bash — tức là gọi `fgos <verb>` như một lệnh
shell thường — không bị chặn bởi cả hai cơ chế trên.

Phần fgOS của STR10 (manifest, detection, nhường-nhịn, canary pin đúng thực
trạng) đóng đủ ở đợt này. Gap ở trên là gap phía-ngoài, được pin làm known-gap
có bằng chứng sống, không phải bị che giấu — flip khi phía kia sửa.
````

Target: `docs/platform/coexistence/spec.md#known-gaps-thành-thật-chưa-flip`
Target unit SHA256: `a68c17326b60d7ad5acda9b48dc02434242230abac3b718ec828003693eedccc`
Shown target SHA256: `65c6d057fd38f2770d74eb3218a18d45a1ca493006f7190cbe5181826b5bb1ab`

````text
## Known Gaps (thành thật, chưa flip)

Nguyên tắc 2 của record ADR0009 ("hook gate theo path của mình — không quơ lên
path harness khác") hiện **chưa được thi hành ở phía harness ngoài fgOS**
trong đợt cài này. Một canary thật (spawn hook chặn-ghi thật của một harness
tham chiếu, chạy trong xưởng phát triển fgOS — xem
`docs/history/install-coexistence/reports/canary-run.md`, hồ sơ xưởng, không
thuộc repo sản phẩm này) đo được **hai loại chặn nhầm lãnh địa fgOS, hai CƠ
CHẾ hoàn toàn khác nhau**:

1. **Chặn theo-phase (phase-contingent):** một cổng "idle intake" của harness
   đó, khi phiên harness ở trạng thái nghỉ, deny MỌI ghi ngoài một allowlist
   tĩnh — bao gồm cả ghi vào `.fgos/`. Đây không phải luật nhắm riêng fgOS:
   một ghi bất kỳ khác ngoài allowlist (không liên quan gì tới fgOS) bị deny
   y hệt. Flip khi cổng này biết đọc territory manifest (`.fgos/coexistence.json`
   hoặc một registry tương đương) thay vì chỉ dùng allowlist tĩnh.
2. **Containment phi-phase (phase-independent):** một guard containment của
   harness đó deny ghi ra ngoài checkout vật lý của chính nó, kể cả khi đích
   ghi là worktree tạm hợp lệ của fgOS (`<tmpdir>/fgos-worktrees`) — guard này
   không quan tâm phase, chặn vô điều kiện. Flip khi guard này biết miễn trừ
   (exempt) một lãnh địa đã đăng ký của harness khác.

Hai fix trên **độc lập với nhau** — không có một sửa chung nào giải quyết cả
hai. Cả hai đều thuộc về cây mã nguồn của harness kia, không thuộc fgOS: fgOS
không tự sửa một harness khác. Bash — tức là gọi `fgos <verb>` như một lệnh
shell thường — không bị chặn bởi cả hai cơ chế trên.

Phần fgOS của STR10 (manifest, detection, nhường-nhịn, canary pin đúng thực
trạng) đóng đủ ở đợt này. Gap ở trên là gap phía-ngoài, được pin làm known-gap
có bằng chứng sống, không phải bị che giấu — flip khi phía kia sửa.
````

````diff

````
## source-decision claim_1fb392829af79ab4e310fc57e7a18417

Decision:

````json
{
  "claimId": "claim_1fb392829af79ab4e310fc57e7a18417",
  "sourceUnitDigest": "83bb4a6e15e98dfa5915fc97930900e83c87b6bf1e1fc6550c4823b760c03644",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-14",
  "targetUnitDigest": "83bb4a6e15e98dfa5915fc97930900e83c87b6bf1e1fc6550c4823b760c03644",
  "targetAncestry": [
    "Coexistence",
    "Known Gaps (thành thật, chưa flip)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-14 to docs/platform/coexistence/spec.md#unheaded-block-14. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-14`
Source unit SHA256: `83bb4a6e15e98dfa5915fc97930900e83c87b6bf1e1fc6550c4823b760c03644`
Shown source SHA256: `83bb4a6e15e98dfa5915fc97930900e83c87b6bf1e1fc6550c4823b760c03644`

````text
Nguyên tắc 2 của record ADR0009 ("hook gate theo path của mình — không quơ lên
path harness khác") hiện **chưa được thi hành ở phía harness ngoài fgOS**
trong đợt cài này. Một canary thật (spawn hook chặn-ghi thật của một harness
tham chiếu, chạy trong xưởng phát triển fgOS — xem
`docs/history/install-coexistence/reports/canary-run.md`, hồ sơ xưởng, không
thuộc repo sản phẩm này) đo được **hai loại chặn nhầm lãnh địa fgOS, hai CƠ
CHẾ hoàn toàn khác nhau**:
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-14`
Target unit SHA256: `83bb4a6e15e98dfa5915fc97930900e83c87b6bf1e1fc6550c4823b760c03644`
Shown target SHA256: `83bb4a6e15e98dfa5915fc97930900e83c87b6bf1e1fc6550c4823b760c03644`

````text
Nguyên tắc 2 của record ADR0009 ("hook gate theo path của mình — không quơ lên
path harness khác") hiện **chưa được thi hành ở phía harness ngoài fgOS**
trong đợt cài này. Một canary thật (spawn hook chặn-ghi thật của một harness
tham chiếu, chạy trong xưởng phát triển fgOS — xem
`docs/history/install-coexistence/reports/canary-run.md`, hồ sơ xưởng, không
thuộc repo sản phẩm này) đo được **hai loại chặn nhầm lãnh địa fgOS, hai CƠ
CHẾ hoàn toàn khác nhau**:
````

````diff

````
## source-decision claim_0d6b548f25c43726e16dfaa3db3b50c6

Decision:

````json
{
  "claimId": "claim_0d6b548f25c43726e16dfaa3db3b50c6",
  "sourceUnitDigest": "108ef42eb0f9b4c14b52945810ca180e81f45f1de7c5bd7175a2856f3733c95f",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-15",
  "targetUnitDigest": "108ef42eb0f9b4c14b52945810ca180e81f45f1de7c5bd7175a2856f3733c95f",
  "targetAncestry": [
    "Coexistence",
    "Known Gaps (thành thật, chưa flip)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-15 to docs/platform/coexistence/spec.md#unheaded-block-15. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-15`
Source unit SHA256: `108ef42eb0f9b4c14b52945810ca180e81f45f1de7c5bd7175a2856f3733c95f`
Shown source SHA256: `108ef42eb0f9b4c14b52945810ca180e81f45f1de7c5bd7175a2856f3733c95f`

````text
1. **Chặn theo-phase (phase-contingent):** một cổng "idle intake" của harness
   đó, khi phiên harness ở trạng thái nghỉ, deny MỌI ghi ngoài một allowlist
   tĩnh — bao gồm cả ghi vào `.fgos/`. Đây không phải luật nhắm riêng fgOS:
   một ghi bất kỳ khác ngoài allowlist (không liên quan gì tới fgOS) bị deny
   y hệt. Flip khi cổng này biết đọc territory manifest (`.fgos/coexistence.json`
   hoặc một registry tương đương) thay vì chỉ dùng allowlist tĩnh.
2. **Containment phi-phase (phase-independent):** một guard containment của
   harness đó deny ghi ra ngoài checkout vật lý của chính nó, kể cả khi đích
   ghi là worktree tạm hợp lệ của fgOS (`<tmpdir>/fgos-worktrees`) — guard này
   không quan tâm phase, chặn vô điều kiện. Flip khi guard này biết miễn trừ
   (exempt) một lãnh địa đã đăng ký của harness khác.
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-15`
Target unit SHA256: `108ef42eb0f9b4c14b52945810ca180e81f45f1de7c5bd7175a2856f3733c95f`
Shown target SHA256: `108ef42eb0f9b4c14b52945810ca180e81f45f1de7c5bd7175a2856f3733c95f`

````text
1. **Chặn theo-phase (phase-contingent):** một cổng "idle intake" của harness
   đó, khi phiên harness ở trạng thái nghỉ, deny MỌI ghi ngoài một allowlist
   tĩnh — bao gồm cả ghi vào `.fgos/`. Đây không phải luật nhắm riêng fgOS:
   một ghi bất kỳ khác ngoài allowlist (không liên quan gì tới fgOS) bị deny
   y hệt. Flip khi cổng này biết đọc territory manifest (`.fgos/coexistence.json`
   hoặc một registry tương đương) thay vì chỉ dùng allowlist tĩnh.
2. **Containment phi-phase (phase-independent):** một guard containment của
   harness đó deny ghi ra ngoài checkout vật lý của chính nó, kể cả khi đích
   ghi là worktree tạm hợp lệ của fgOS (`<tmpdir>/fgos-worktrees`) — guard này
   không quan tâm phase, chặn vô điều kiện. Flip khi guard này biết miễn trừ
   (exempt) một lãnh địa đã đăng ký của harness khác.
````

````diff

````
## source-decision claim_176133a9c908301954329ee1c9c63dfe

Decision:

````json
{
  "claimId": "claim_176133a9c908301954329ee1c9c63dfe",
  "sourceUnitDigest": "711282804d4c2908e7dbb68401a2665068b10040172acbff0fc76c86c23ae15e",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-16",
  "targetUnitDigest": "711282804d4c2908e7dbb68401a2665068b10040172acbff0fc76c86c23ae15e",
  "targetAncestry": [
    "Coexistence",
    "Known Gaps (thành thật, chưa flip)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-16 to docs/platform/coexistence/spec.md#unheaded-block-16. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-16`
Source unit SHA256: `711282804d4c2908e7dbb68401a2665068b10040172acbff0fc76c86c23ae15e`
Shown source SHA256: `711282804d4c2908e7dbb68401a2665068b10040172acbff0fc76c86c23ae15e`

````text
Hai fix trên **độc lập với nhau** — không có một sửa chung nào giải quyết cả
hai. Cả hai đều thuộc về cây mã nguồn của harness kia, không thuộc fgOS: fgOS
không tự sửa một harness khác. Bash — tức là gọi `fgos <verb>` như một lệnh
shell thường — không bị chặn bởi cả hai cơ chế trên.
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-16`
Target unit SHA256: `711282804d4c2908e7dbb68401a2665068b10040172acbff0fc76c86c23ae15e`
Shown target SHA256: `711282804d4c2908e7dbb68401a2665068b10040172acbff0fc76c86c23ae15e`

````text
Hai fix trên **độc lập với nhau** — không có một sửa chung nào giải quyết cả
hai. Cả hai đều thuộc về cây mã nguồn của harness kia, không thuộc fgOS: fgOS
không tự sửa một harness khác. Bash — tức là gọi `fgos <verb>` như một lệnh
shell thường — không bị chặn bởi cả hai cơ chế trên.
````

````diff

````
## source-decision claim_9b91936a3ad03f80101c4cbb5718f2bb

Decision:

````json
{
  "claimId": "claim_9b91936a3ad03f80101c4cbb5718f2bb",
  "sourceUnitDigest": "979a7e6604657c12b8bb38e12a421854e0173f21b7c0dbca549b336f4c7a94d2",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-17",
  "targetUnitDigest": "979a7e6604657c12b8bb38e12a421854e0173f21b7c0dbca549b336f4c7a94d2",
  "targetAncestry": [
    "Coexistence",
    "Known Gaps (thành thật, chưa flip)"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-17 to docs/platform/coexistence/spec.md#unheaded-block-17. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-17`
Source unit SHA256: `979a7e6604657c12b8bb38e12a421854e0173f21b7c0dbca549b336f4c7a94d2`
Shown source SHA256: `979a7e6604657c12b8bb38e12a421854e0173f21b7c0dbca549b336f4c7a94d2`

````text
Phần fgOS của STR10 (manifest, detection, nhường-nhịn, canary pin đúng thực
trạng) đóng đủ ở đợt này. Gap ở trên là gap phía-ngoài, được pin làm known-gap
có bằng chứng sống, không phải bị che giấu — flip khi phía kia sửa.
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-17`
Target unit SHA256: `979a7e6604657c12b8bb38e12a421854e0173f21b7c0dbca549b336f4c7a94d2`
Shown target SHA256: `979a7e6604657c12b8bb38e12a421854e0173f21b7c0dbca549b336f4c7a94d2`

````text
Phần fgOS của STR10 (manifest, detection, nhường-nhịn, canary pin đúng thực
trạng) đóng đủ ở đợt này. Gap ở trên là gap phía-ngoài, được pin làm known-gap
có bằng chứng sống, không phải bị che giấu — flip khi phía kia sửa.
````

````diff

````
## source-decision claim_5d857143e69127b974573a563f2b4f0d

Decision:

````json
{
  "claimId": "claim_5d857143e69127b974573a563f2b4f0d",
  "sourceUnitDigest": "19c8da607e29227f761c037089424c6bb4b03e7fe8595b6f570365f2d7eec2ed",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "pointers",
  "targetUnitDigest": "19c8da607e29227f761c037089424c6bb4b03e7fe8595b6f570365f2d7eec2ed",
  "targetAncestry": [
    "Coexistence"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#pointers to docs/platform/coexistence/spec.md#pointers. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#pointers`
Source unit SHA256: `19c8da607e29227f761c037089424c6bb4b03e7fe8595b6f570365f2d7eec2ed`
Shown source SHA256: `998739467fd37c01c28abc6a4500214c845850aaf466096d66a1193a0582d2d6`

````text
## Pointers

- `docs/decisions/0009-chong-giao-thoa-luc-cai.md` — quyết định nguồn của 4
  nguyên tắc trên.
- `src/install/coexist.mjs` — cài đặt detection + manifest.
- `bin/fgos.mjs` verb `init` — điểm gọi detection.
- `test/e2e/coexistence-canary.test.mjs` — canary pin known-gap + footprint +
  nhường-nhịn.
- `docs/backlog.md` (STR10) — trạng thái backlog, trỏ tới hồ sơ xưởng.
````

Target: `docs/platform/coexistence/spec.md#pointers`
Target unit SHA256: `19c8da607e29227f761c037089424c6bb4b03e7fe8595b6f570365f2d7eec2ed`
Shown target SHA256: `998739467fd37c01c28abc6a4500214c845850aaf466096d66a1193a0582d2d6`

````text
## Pointers

- `docs/decisions/0009-chong-giao-thoa-luc-cai.md` — quyết định nguồn của 4
  nguyên tắc trên.
- `src/install/coexist.mjs` — cài đặt detection + manifest.
- `bin/fgos.mjs` verb `init` — điểm gọi detection.
- `test/e2e/coexistence-canary.test.mjs` — canary pin known-gap + footprint +
  nhường-nhịn.
- `docs/backlog.md` (STR10) — trạng thái backlog, trỏ tới hồ sơ xưởng.
````

````diff

````
## source-decision claim_03442ce35ad000f53a7b3c8ada7f3917

Decision:

````json
{
  "claimId": "claim_03442ce35ad000f53a7b3c8ada7f3917",
  "sourceUnitDigest": "092c4defefefd6fe98bd926a924d821599937c976c30136cd332d1daaa01f81c",
  "targetOwner": "docs/platform/coexistence/spec.md",
  "targetAnchor": "unheaded-block-18",
  "targetUnitDigest": "092c4defefefd6fe98bd926a924d821599937c976c30136cd332d1daaa01f81c",
  "targetAncestry": [
    "Coexistence",
    "Pointers"
  ],
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/coexistence.md#unheaded-block-18 to docs/platform/coexistence/spec.md#unheaded-block-18. Carry the complete unit into its candidate spec owner. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/coexistence.md#unheaded-block-18`
Source unit SHA256: `092c4defefefd6fe98bd926a924d821599937c976c30136cd332d1daaa01f81c`
Shown source SHA256: `092c4defefefd6fe98bd926a924d821599937c976c30136cd332d1daaa01f81c`

````text
- `docs/decisions/0009-chong-giao-thoa-luc-cai.md` — quyết định nguồn của 4
  nguyên tắc trên.
- `src/install/coexist.mjs` — cài đặt detection + manifest.
- `bin/fgos.mjs` verb `init` — điểm gọi detection.
- `test/e2e/coexistence-canary.test.mjs` — canary pin known-gap + footprint +
  nhường-nhịn.
- `docs/backlog.md` (STR10) — trạng thái backlog, trỏ tới hồ sơ xưởng.
````

Target: `docs/platform/coexistence/spec.md#unheaded-block-18`
Target unit SHA256: `092c4defefefd6fe98bd926a924d821599937c976c30136cd332d1daaa01f81c`
Shown target SHA256: `092c4defefefd6fe98bd926a924d821599937c976c30136cd332d1daaa01f81c`

````text
- `docs/decisions/0009-chong-giao-thoa-luc-cai.md` — quyết định nguồn của 4
  nguyên tắc trên.
- `src/install/coexist.mjs` — cài đặt detection + manifest.
- `bin/fgos.mjs` verb `init` — điểm gọi detection.
- `test/e2e/coexistence-canary.test.mjs` — canary pin known-gap + footprint +
  nhường-nhịn.
- `docs/backlog.md` (STR10) — trạng thái backlog, trỏ tới hồ sơ xưởng.
````

````diff

````
## source-decision claim_31da3484337f9291d10f1d7bfdbf98a1

Decision:

````json
{
  "claimId": "claim_31da3484337f9291d10f1d7bfdbf98a1",
  "sourceUnitDigest": "101ca24a4babcc80626fd5bdcd92a4abbe46c15d9183819af86f2faab75c5d8e",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-22",
  "targetUnitDigest": "93d5681e33b3f1468d40e466af8f7ca9bd1d2775388690e9449d82a07905c41e",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "Source Metadata (Added in candidate)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-1 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-22. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Original metadata is retained verbatim under Source Metadata (Added in candidate), separate from the candidate authority header. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-1`
Source unit SHA256: `101ca24a4babcc80626fd5bdcd92a4abbe46c15d9183819af86f2faab75c5d8e`
Shown source SHA256: `101ca24a4babcc80626fd5bdcd92a4abbe46c15d9183819af86f2faab75c5d8e`

````text
---
title: Audit loại-hình công việc & hệ đặt tên/đánh mã (STR47)
status: FINAL — mọi hệ đã chốt hướng; #1,#3,#4,#5,#6 đã migrate (STR53/55/57/56/54); #7-#10 chốt hướng "giữ nguyên/tài liệu hoá" tại record ADR0017
updated: 2026-07-27
kind: audit
decision: ADR0017
---
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-22`
Target unit SHA256: `93d5681e33b3f1468d40e466af8f7ca9bd1d2775388690e9449d82a07905c41e`
Shown target SHA256: `93d5681e33b3f1468d40e466af8f7ca9bd1d2775388690e9449d82a07905c41e`

`````text
````text
---
title: Audit loại-hình công việc & hệ đặt tên/đánh mã (STR47)
status: FINAL — mọi hệ đã chốt hướng; #1,#3,#4,#5,#6 đã migrate (STR53/55/57/56/54); #7-#10 chốt hướng "giữ nguyên/tài liệu hoá" tại record ADR0017
updated: 2026-07-27
kind: audit
decision: ADR0017
---
````
`````

`````diff
--- docs/id-systems-audit.md
+++ docs/platform/documentation/history/id-systems-audit.md
@@ -0,0 +1 @@
+````text
@@ -7 +8,2 @@
----+---
+````
`````
## source-decision claim_2aea5b3660d8588c5287636f01a78ce2

Decision:

````json
{
  "claimId": "claim_2aea5b3660d8588c5287636f01a78ce2",
  "sourceUnitDigest": "83db723622b27a7d83b0435ac1f692eabcb247aca79936bbc93d2602d2d6d1c7",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "audit-loại-hình-công-việc-hệ-đặt-tênđánh-mã",
  "targetUnitDigest": "6db014d964b2427f4309a52e657875aeb760d740d7f7fc29344683c2f49fea18",
  "targetAncestry": [],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#audit-loại-hình-công-việc-hệ-đặt-tênđánh-mã to docs/platform/documentation/history/id-systems-audit.md#audit-loại-hình-công-việc-hệ-đặt-tênđánh-mã. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#audit-loại-hình-công-việc-hệ-đặt-tênđánh-mã`
Source unit SHA256: `83db723622b27a7d83b0435ac1f692eabcb247aca79936bbc93d2602d2d6d1c7`
Shown source SHA256: `3986f4e1eabc1acabdf9c56985fea43a6fc894157a61e526f17bbd2f8d074a0d`

````text
# Audit: loại-hình công việc + hệ đặt tên/đánh mã

Tài liệu này trả lời `docs/backlog.md` STR47. Bảng inventory trích thẳng từ
code/docs thật (file:line), không suy đoán. Mọi migration mà audit này chốt
hướng (#1, #3, #4, #5, #6) đã thi công xong qua STR53/STR55/STR57/STR56/STR54
(`docs/backlog.md`, mục Done/Declined). Các hệ còn lại của bee (#7-#10) chốt
hướng "giữ nguyên, chỉ tài liệu hoá ranh giới" — quyết định đầy đủ + bằng
chứng ở `docs/decisions/0017-dong-audit-he-id-ten-goi.md`.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#audit-loại-hình-công-việc-hệ-đặt-tênđánh-mã`
Target unit SHA256: `6db014d964b2427f4309a52e657875aeb760d740d7f7fc29344683c2f49fea18`
Shown target SHA256: `b57a30f9a5636c76486b5ed41a835c4cc5f38e114fcd866f32779e109a1ec45b`

````text
# Audit: loại-hình công việc + hệ đặt tên/đánh mã

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/id-systems-audit.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/id-systems-audit.md
Supersedes: None; candidate only
Superseded by: None
```

Tài liệu này trả lời `docs/backlog.md` STR47. Bảng inventory trích thẳng từ
code/docs thật (file:line), không suy đoán. Mọi migration mà audit này chốt
hướng (#1, #3, #4, #5, #6) đã thi công xong qua STR53/STR55/STR57/STR56/STR54
(`docs/backlog.md`, mục Done/Declined). Các hệ còn lại của bee (#7-#10) chốt
hướng "giữ nguyên, chỉ tài liệu hoá ranh giới" — quyết định đầy đủ + bằng
chứng ở `docs/decisions/0017-dong-audit-he-id-ten-goi.md`.
````

````diff
--- docs/id-systems-audit.md
+++ docs/platform/documentation/history/id-systems-audit.md
@@ -1,0 +2,19 @@
+
+```txt
+Document type: History
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/id-systems-audit.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
+Related:
+- docs/id-systems-audit.md
+Supersedes: None; candidate only
+Superseded by: None
+```
````
## source-decision claim_35e86f81ee143f2e20aba15cfdb37b68

Decision:

````json
{
  "claimId": "claim_35e86f81ee143f2e20aba15cfdb37b68",
  "sourceUnitDigest": "11d382080aeaa76409bab5d5b51b697d49fe84f497cecaa4073697e71272a2ac",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "11d382080aeaa76409bab5d5b51b697d49fe84f497cecaa4073697e71272a2ac",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-2 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-2. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-2`
Source unit SHA256: `11d382080aeaa76409bab5d5b51b697d49fe84f497cecaa4073697e71272a2ac`
Shown source SHA256: `11d382080aeaa76409bab5d5b51b697d49fe84f497cecaa4073697e71272a2ac`

````text
Tài liệu này trả lời `docs/backlog.md` STR47. Bảng inventory trích thẳng từ
code/docs thật (file:line), không suy đoán. Mọi migration mà audit này chốt
hướng (#1, #3, #4, #5, #6) đã thi công xong qua STR53/STR55/STR57/STR56/STR54
(`docs/backlog.md`, mục Done/Declined). Các hệ còn lại của bee (#7-#10) chốt
hướng "giữ nguyên, chỉ tài liệu hoá ranh giới" — quyết định đầy đủ + bằng
chứng ở `docs/decisions/0017-dong-audit-he-id-ten-goi.md`.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-2`
Target unit SHA256: `11d382080aeaa76409bab5d5b51b697d49fe84f497cecaa4073697e71272a2ac`
Shown target SHA256: `11d382080aeaa76409bab5d5b51b697d49fe84f497cecaa4073697e71272a2ac`

````text
Tài liệu này trả lời `docs/backlog.md` STR47. Bảng inventory trích thẳng từ
code/docs thật (file:line), không suy đoán. Mọi migration mà audit này chốt
hướng (#1, #3, #4, #5, #6) đã thi công xong qua STR53/STR55/STR57/STR56/STR54
(`docs/backlog.md`, mục Done/Declined). Các hệ còn lại của bee (#7-#10) chốt
hướng "giữ nguyên, chỉ tài liệu hoá ranh giới" — quyết định đầy đủ + bằng
chứng ở `docs/decisions/0017-dong-audit-he-id-ten-goi.md`.
````

````diff

````
## source-decision claim_9e2d3f49be7a349869017a93b73120cc

Decision:

````json
{
  "claimId": "claim_9e2d3f49be7a349869017a93b73120cc",
  "sourceUnitDigest": "3f34f9d14c4ecaa8482d9a90059902cebddfd83e5e82126037d43c4928e6468d",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "bối-cảnh-str47",
  "targetUnitDigest": "3f34f9d14c4ecaa8482d9a90059902cebddfd83e5e82126037d43c4928e6468d",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#bối-cảnh-str47 to docs/platform/documentation/history/id-systems-audit.md#bối-cảnh-str47. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#bối-cảnh-str47`
Source unit SHA256: `3f34f9d14c4ecaa8482d9a90059902cebddfd83e5e82126037d43c4928e6468d`
Shown source SHA256: `dc5269203142d8b8e18a7ce3bc4c22402efa89668a2b017a7a9d2f0ef50c7100`

````text
## Bối cảnh (STR47)

> Audit thống nhất **loại-hình công việc** + **hệ đặt tên/đánh mã** đang chạy
> song song trong hệ thống — chưa có review nào gộp chung: (a) `kind`
> work-item; (b) nhiều hệ mã số tách biệt cùng sống mà chưa giải thích ranh
> giới ở một chỗ: P# tuần tự, D-hex, R#, C1-C9, cell-id `<feature>-N`; (c)
> tên feature kebab-case tự đặt tay.

`work.id` (#1) không nằm trong danh sách gốc của STR47 — phát hiện thêm trong
lúc thảo luận, gộp vào audit vì cùng loại vấn đề.

**Khung xét trọng số (thảo luận 2026-07-18):** decision `0004`
(`repo/docs/decisions/0004-pham-vi-va-non-goal.md`) đã khoá: fgOS chạy
**song song, không thay thế** harness phát triển (bee) cho tới khi chạm
"ngưỡng-có-tên". STR50 (`docs/backlog.md`) là chính bước mở ngưỡng đó — induct
skill-workflow của bee vào fgOS. Hệ quả: **hệ id của bee (#7-#10) là giàn
giáo TẠM THỜI** — dùng trong giai đoạn xây fgOS, không cần đầu tư sâu; **hệ
id của fgOS (#1-#6) là SẢN PHẨM VĨNH VIỄN**, và về sau chính fgOS (không cần
bee) sẽ phải tự sinh/tự đọc được các hệ này — đáng đầu tư kỹ hơn. Khung này
là căn cứ cho quyết định "giữ nguyên, chỉ tài liệu hoá" ở #7-#10 (xem §5).
````

Target: `docs/platform/documentation/history/id-systems-audit.md#bối-cảnh-str47`
Target unit SHA256: `3f34f9d14c4ecaa8482d9a90059902cebddfd83e5e82126037d43c4928e6468d`
Shown target SHA256: `dc5269203142d8b8e18a7ce3bc4c22402efa89668a2b017a7a9d2f0ef50c7100`

````text
## Bối cảnh (STR47)

> Audit thống nhất **loại-hình công việc** + **hệ đặt tên/đánh mã** đang chạy
> song song trong hệ thống — chưa có review nào gộp chung: (a) `kind`
> work-item; (b) nhiều hệ mã số tách biệt cùng sống mà chưa giải thích ranh
> giới ở một chỗ: P# tuần tự, D-hex, R#, C1-C9, cell-id `<feature>-N`; (c)
> tên feature kebab-case tự đặt tay.

`work.id` (#1) không nằm trong danh sách gốc của STR47 — phát hiện thêm trong
lúc thảo luận, gộp vào audit vì cùng loại vấn đề.

**Khung xét trọng số (thảo luận 2026-07-18):** decision `0004`
(`repo/docs/decisions/0004-pham-vi-va-non-goal.md`) đã khoá: fgOS chạy
**song song, không thay thế** harness phát triển (bee) cho tới khi chạm
"ngưỡng-có-tên". STR50 (`docs/backlog.md`) là chính bước mở ngưỡng đó — induct
skill-workflow của bee vào fgOS. Hệ quả: **hệ id của bee (#7-#10) là giàn
giáo TẠM THỜI** — dùng trong giai đoạn xây fgOS, không cần đầu tư sâu; **hệ
id của fgOS (#1-#6) là SẢN PHẨM VĨNH VIỄN**, và về sau chính fgOS (không cần
bee) sẽ phải tự sinh/tự đọc được các hệ này — đáng đầu tư kỹ hơn. Khung này
là căn cứ cho quyết định "giữ nguyên, chỉ tài liệu hoá" ở #7-#10 (xem §5).
````

````diff

````
## source-decision claim_151f5734d44df79cf8987d09dd4d598c

Decision:

````json
{
  "claimId": "claim_151f5734d44df79cf8987d09dd4d598c",
  "sourceUnitDigest": "cb76d2bce7480169b75239a45cbe0be326a4d1b45f9900246ffedea3d98adab8",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "cb76d2bce7480169b75239a45cbe0be326a4d1b45f9900246ffedea3d98adab8",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "Bối cảnh (STR47)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-3 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-3. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-3`
Source unit SHA256: `cb76d2bce7480169b75239a45cbe0be326a4d1b45f9900246ffedea3d98adab8`
Shown source SHA256: `cb76d2bce7480169b75239a45cbe0be326a4d1b45f9900246ffedea3d98adab8`

````text
> Audit thống nhất **loại-hình công việc** + **hệ đặt tên/đánh mã** đang chạy
> song song trong hệ thống — chưa có review nào gộp chung: (a) `kind`
> work-item; (b) nhiều hệ mã số tách biệt cùng sống mà chưa giải thích ranh
> giới ở một chỗ: P# tuần tự, D-hex, R#, C1-C9, cell-id `<feature>-N`; (c)
> tên feature kebab-case tự đặt tay.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-3`
Target unit SHA256: `cb76d2bce7480169b75239a45cbe0be326a4d1b45f9900246ffedea3d98adab8`
Shown target SHA256: `cb76d2bce7480169b75239a45cbe0be326a4d1b45f9900246ffedea3d98adab8`

````text
> Audit thống nhất **loại-hình công việc** + **hệ đặt tên/đánh mã** đang chạy
> song song trong hệ thống — chưa có review nào gộp chung: (a) `kind`
> work-item; (b) nhiều hệ mã số tách biệt cùng sống mà chưa giải thích ranh
> giới ở một chỗ: P# tuần tự, D-hex, R#, C1-C9, cell-id `<feature>-N`; (c)
> tên feature kebab-case tự đặt tay.
````

````diff

````
## source-decision claim_bec16cd0f24310a6419caff7453a715f

Decision:

````json
{
  "claimId": "claim_bec16cd0f24310a6419caff7453a715f",
  "sourceUnitDigest": "faf7b44d78496b6ce6893b1f1bea7d0902f77ca8dc6446e53d276ce2f5be7ec4",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "faf7b44d78496b6ce6893b1f1bea7d0902f77ca8dc6446e53d276ce2f5be7ec4",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "Bối cảnh (STR47)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-4 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-4. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-4`
Source unit SHA256: `faf7b44d78496b6ce6893b1f1bea7d0902f77ca8dc6446e53d276ce2f5be7ec4`
Shown source SHA256: `faf7b44d78496b6ce6893b1f1bea7d0902f77ca8dc6446e53d276ce2f5be7ec4`

````text
`work.id` (#1) không nằm trong danh sách gốc của STR47 — phát hiện thêm trong
lúc thảo luận, gộp vào audit vì cùng loại vấn đề.
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-4`
Target unit SHA256: `faf7b44d78496b6ce6893b1f1bea7d0902f77ca8dc6446e53d276ce2f5be7ec4`
Shown target SHA256: `faf7b44d78496b6ce6893b1f1bea7d0902f77ca8dc6446e53d276ce2f5be7ec4`

````text
`work.id` (#1) không nằm trong danh sách gốc của STR47 — phát hiện thêm trong
lúc thảo luận, gộp vào audit vì cùng loại vấn đề.
````

````diff

````
## source-decision claim_25d99c6c797c21efdd1d11ed7d70a87f

Decision:

````json
{
  "claimId": "claim_25d99c6c797c21efdd1d11ed7d70a87f",
  "sourceUnitDigest": "3d3adc6c49927c4627f46dfc82178f2e337641b60932f73dd6847b5c7cdefc0c",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "3d3adc6c49927c4627f46dfc82178f2e337641b60932f73dd6847b5c7cdefc0c",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "Bối cảnh (STR47)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-5 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-5. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-5`
Source unit SHA256: `3d3adc6c49927c4627f46dfc82178f2e337641b60932f73dd6847b5c7cdefc0c`
Shown source SHA256: `3d3adc6c49927c4627f46dfc82178f2e337641b60932f73dd6847b5c7cdefc0c`

````text
**Khung xét trọng số (thảo luận 2026-07-18):** decision `0004`
(`repo/docs/decisions/0004-pham-vi-va-non-goal.md`) đã khoá: fgOS chạy
**song song, không thay thế** harness phát triển (bee) cho tới khi chạm
"ngưỡng-có-tên". STR50 (`docs/backlog.md`) là chính bước mở ngưỡng đó — induct
skill-workflow của bee vào fgOS. Hệ quả: **hệ id của bee (#7-#10) là giàn
giáo TẠM THỜI** — dùng trong giai đoạn xây fgOS, không cần đầu tư sâu; **hệ
id của fgOS (#1-#6) là SẢN PHẨM VĨNH VIỄN**, và về sau chính fgOS (không cần
bee) sẽ phải tự sinh/tự đọc được các hệ này — đáng đầu tư kỹ hơn. Khung này
là căn cứ cho quyết định "giữ nguyên, chỉ tài liệu hoá" ở #7-#10 (xem §5).
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-5`
Target unit SHA256: `3d3adc6c49927c4627f46dfc82178f2e337641b60932f73dd6847b5c7cdefc0c`
Shown target SHA256: `3d3adc6c49927c4627f46dfc82178f2e337641b60932f73dd6847b5c7cdefc0c`

````text
**Khung xét trọng số (thảo luận 2026-07-18):** decision `0004`
(`repo/docs/decisions/0004-pham-vi-va-non-goal.md`) đã khoá: fgOS chạy
**song song, không thay thế** harness phát triển (bee) cho tới khi chạm
"ngưỡng-có-tên". STR50 (`docs/backlog.md`) là chính bước mở ngưỡng đó — induct
skill-workflow của bee vào fgOS. Hệ quả: **hệ id của bee (#7-#10) là giàn
giáo TẠM THỜI** — dùng trong giai đoạn xây fgOS, không cần đầu tư sâu; **hệ
id của fgOS (#1-#6) là SẢN PHẨM VĨNH VIỄN**, và về sau chính fgOS (không cần
bee) sẽ phải tự sinh/tự đọc được các hệ này — đáng đầu tư kỹ hơn. Khung này
là căn cứ cho quyết định "giữ nguyên, chỉ tài liệu hoá" ở #7-#10 (xem §5).
````

````diff

````
## source-decision claim_ee0bc5ddb9626281662430a0492cdccd

Decision:

````json
{
  "claimId": "claim_ee0bc5ddb9626281662430a0492cdccd",
  "sourceUnitDigest": "ac18ddb7f9acf66f4c5fe7f01ecf7319fb4942a29bb33201b6dbdc6a57aeca34",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "1-bảng-inventory-13-hệ-6-của-fgos-7-của-bee",
  "targetUnitDigest": "ac18ddb7f9acf66f4c5fe7f01ecf7319fb4942a29bb33201b6dbdc6a57aeca34",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#1-bảng-inventory-13-hệ-6-của-fgos-7-của-bee to docs/platform/documentation/history/id-systems-audit.md#1-bảng-inventory-13-hệ-6-của-fgos-7-của-bee. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#1-bảng-inventory-13-hệ-6-của-fgos-7-của-bee`
Source unit SHA256: `ac18ddb7f9acf66f4c5fe7f01ecf7319fb4942a29bb33201b6dbdc6a57aeca34`
Shown source SHA256: `1f41e39343054cbf95039ce80905c6535859c367c0e707f94a2b5d1b2194e567`

````text
## 1 · Bảng inventory (13 hệ — 6 của fgOS, 7 của bee)
````

Target: `docs/platform/documentation/history/id-systems-audit.md#1-bảng-inventory-13-hệ-6-của-fgos-7-của-bee`
Target unit SHA256: `ac18ddb7f9acf66f4c5fe7f01ecf7319fb4942a29bb33201b6dbdc6a57aeca34`
Shown target SHA256: `1f41e39343054cbf95039ce80905c6535859c367c0e707f94a2b5d1b2194e567`

````text
## 1 · Bảng inventory (13 hệ — 6 của fgOS, 7 của bee)
````

````diff

````
## source-decision claim_df26acdf7c7c6ad3a25c44486535c4b3

Decision:

````json
{
  "claimId": "claim_df26acdf7c7c6ad3a25c44486535c4b3",
  "sourceUnitDigest": "6c6c50ac084317fde0e6286127fe1f8a62026a5c527ce8a0e954d28f7c05847b",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "fgos-sản-phẩm-vĩnh-viễn-đã-migrate",
  "targetUnitDigest": "6c6c50ac084317fde0e6286127fe1f8a62026a5c527ce8a0e954d28f7c05847b",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "1 · Bảng inventory (13 hệ — 6 của fgOS, 7 của bee)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#fgos-sản-phẩm-vĩnh-viễn-đã-migrate to docs/platform/documentation/history/id-systems-audit.md#fgos-sản-phẩm-vĩnh-viễn-đã-migrate. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#fgos-sản-phẩm-vĩnh-viễn-đã-migrate`
Source unit SHA256: `6c6c50ac084317fde0e6286127fe1f8a62026a5c527ce8a0e954d28f7c05847b`
Shown source SHA256: `9adaa228ec261cc5828a5f2ed7b954cb181b87ce0f5b9f52aa28ba7f2c0bc70b`

````text
### fgOS (sản phẩm — vĩnh viễn, đã migrate)

| # | Hệ | Định dạng ĐÃ SHIP | Migrate qua | Định nghĩa ở |
|---|---|---|---|---|
| 1 | `work.id` (Task — chính danh work item) | **`tsk-<hash>`** (gốc, chữ thường + gạch nối), **`tsk-<hash>-<n>`** (con, đệ quy theo lineage `parent`) — không còn slug title trong id | STR53 — done | `repo/src/intake/classify.mjs:115-128` (`generateId`), `repo/src/state/work.mjs:22` (`ID_PATTERN`), `repo/src/intake/decompose.mjs:245` (sinh id con) |
| 2 | `kind` work-item | enum tự do (bug/feature/chore/docs, mặc định `task`) | Không đổi | `repo/src/intake/classify.mjs:48-53,79-80` |
| 3 | `P<n>` → **Story** `STR<n>` (đổi tên khỏi "PBI") | `STR<n>` (vd `STR47`) | STR57 — done | `.claude/skills/bee-scribing/references/scribing-reference.md:293`; cột "Story" — `repo/docs/backlog.md` |
| 4 | ADR `NNNN-slug.md` | tên file đầy đủ giữ nguyên; trích dẫn rút gọn = `ADR<n>` (vd `ADR0013`), không bare số | STR55 — done | `repo/docs/decisions/0000-index.md:12-16` |
| 5 | `R#` business rule | `RUL<n>` (vd `RUL042`), không unique toàn cục — trích dẫn ngoài spec gốc kèm tên area (vd `RUL42 (runner)`) | STR56 — done (83 citation ở `runner.md`, 0 bare `R#` còn lại) | `repo/docs/specs/runner.md` |
| 6 | `C1`-`C9` contract | `CTR<n>` 3-digit zero-pad (vd `CTR009`) | STR54 — done, decision `ADR0015` | `repo/docs/architecture-map.md` §7 |
````

Target: `docs/platform/documentation/history/id-systems-audit.md#fgos-sản-phẩm-vĩnh-viễn-đã-migrate`
Target unit SHA256: `6c6c50ac084317fde0e6286127fe1f8a62026a5c527ce8a0e954d28f7c05847b`
Shown target SHA256: `9adaa228ec261cc5828a5f2ed7b954cb181b87ce0f5b9f52aa28ba7f2c0bc70b`

````text
### fgOS (sản phẩm — vĩnh viễn, đã migrate)

| # | Hệ | Định dạng ĐÃ SHIP | Migrate qua | Định nghĩa ở |
|---|---|---|---|---|
| 1 | `work.id` (Task — chính danh work item) | **`tsk-<hash>`** (gốc, chữ thường + gạch nối), **`tsk-<hash>-<n>`** (con, đệ quy theo lineage `parent`) — không còn slug title trong id | STR53 — done | `repo/src/intake/classify.mjs:115-128` (`generateId`), `repo/src/state/work.mjs:22` (`ID_PATTERN`), `repo/src/intake/decompose.mjs:245` (sinh id con) |
| 2 | `kind` work-item | enum tự do (bug/feature/chore/docs, mặc định `task`) | Không đổi | `repo/src/intake/classify.mjs:48-53,79-80` |
| 3 | `P<n>` → **Story** `STR<n>` (đổi tên khỏi "PBI") | `STR<n>` (vd `STR47`) | STR57 — done | `.claude/skills/bee-scribing/references/scribing-reference.md:293`; cột "Story" — `repo/docs/backlog.md` |
| 4 | ADR `NNNN-slug.md` | tên file đầy đủ giữ nguyên; trích dẫn rút gọn = `ADR<n>` (vd `ADR0013`), không bare số | STR55 — done | `repo/docs/decisions/0000-index.md:12-16` |
| 5 | `R#` business rule | `RUL<n>` (vd `RUL042`), không unique toàn cục — trích dẫn ngoài spec gốc kèm tên area (vd `RUL42 (runner)`) | STR56 — done (83 citation ở `runner.md`, 0 bare `R#` còn lại) | `repo/docs/specs/runner.md` |
| 6 | `C1`-`C9` contract | `CTR<n>` 3-digit zero-pad (vd `CTR009`) | STR54 — done, decision `ADR0015` | `repo/docs/architecture-map.md` §7 |
````

````diff

````
## source-decision claim_3661df6c69488b1ea9c596a2ffc65ff4

Decision:

````json
{
  "claimId": "claim_3661df6c69488b1ea9c596a2ffc65ff4",
  "sourceUnitDigest": "84a87e70aac52e1b7cdf1d96a657c8d8482659e0e38af5ada4c3a63982e1f157",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "84a87e70aac52e1b7cdf1d96a657c8d8482659e0e38af5ada4c3a63982e1f157",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "1 · Bảng inventory (13 hệ — 6 của fgOS, 7 của bee)",
    "fgOS (sản phẩm — vĩnh viễn, đã migrate)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#unheaded-block-6 to docs/platform/documentation/history/id-systems-audit.md#unheaded-block-6. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#unheaded-block-6`
Source unit SHA256: `84a87e70aac52e1b7cdf1d96a657c8d8482659e0e38af5ada4c3a63982e1f157`
Shown source SHA256: `84a87e70aac52e1b7cdf1d96a657c8d8482659e0e38af5ada4c3a63982e1f157`

````text
| # | Hệ | Định dạng ĐÃ SHIP | Migrate qua | Định nghĩa ở |
|---|---|---|---|---|
| 1 | `work.id` (Task — chính danh work item) | **`tsk-<hash>`** (gốc, chữ thường + gạch nối), **`tsk-<hash>-<n>`** (con, đệ quy theo lineage `parent`) — không còn slug title trong id | STR53 — done | `repo/src/intake/classify.mjs:115-128` (`generateId`), `repo/src/state/work.mjs:22` (`ID_PATTERN`), `repo/src/intake/decompose.mjs:245` (sinh id con) |
| 2 | `kind` work-item | enum tự do (bug/feature/chore/docs, mặc định `task`) | Không đổi | `repo/src/intake/classify.mjs:48-53,79-80` |
| 3 | `P<n>` → **Story** `STR<n>` (đổi tên khỏi "PBI") | `STR<n>` (vd `STR47`) | STR57 — done | `.claude/skills/bee-scribing/references/scribing-reference.md:293`; cột "Story" — `repo/docs/backlog.md` |
| 4 | ADR `NNNN-slug.md` | tên file đầy đủ giữ nguyên; trích dẫn rút gọn = `ADR<n>` (vd `ADR0013`), không bare số | STR55 — done | `repo/docs/decisions/0000-index.md:12-16` |
| 5 | `R#` business rule | `RUL<n>` (vd `RUL042`), không unique toàn cục — trích dẫn ngoài spec gốc kèm tên area (vd `RUL42 (runner)`) | STR56 — done (83 citation ở `runner.md`, 0 bare `R#` còn lại) | `repo/docs/specs/runner.md` |
| 6 | `C1`-`C9` contract | `CTR<n>` 3-digit zero-pad (vd `CTR009`) | STR54 — done, decision `ADR0015` | `repo/docs/architecture-map.md` §7 |
````

Target: `docs/platform/documentation/history/id-systems-audit.md#unheaded-block-6`
Target unit SHA256: `84a87e70aac52e1b7cdf1d96a657c8d8482659e0e38af5ada4c3a63982e1f157`
Shown target SHA256: `84a87e70aac52e1b7cdf1d96a657c8d8482659e0e38af5ada4c3a63982e1f157`

````text
| # | Hệ | Định dạng ĐÃ SHIP | Migrate qua | Định nghĩa ở |
|---|---|---|---|---|
| 1 | `work.id` (Task — chính danh work item) | **`tsk-<hash>`** (gốc, chữ thường + gạch nối), **`tsk-<hash>-<n>`** (con, đệ quy theo lineage `parent`) — không còn slug title trong id | STR53 — done | `repo/src/intake/classify.mjs:115-128` (`generateId`), `repo/src/state/work.mjs:22` (`ID_PATTERN`), `repo/src/intake/decompose.mjs:245` (sinh id con) |
| 2 | `kind` work-item | enum tự do (bug/feature/chore/docs, mặc định `task`) | Không đổi | `repo/src/intake/classify.mjs:48-53,79-80` |
| 3 | `P<n>` → **Story** `STR<n>` (đổi tên khỏi "PBI") | `STR<n>` (vd `STR47`) | STR57 — done | `.claude/skills/bee-scribing/references/scribing-reference.md:293`; cột "Story" — `repo/docs/backlog.md` |
| 4 | ADR `NNNN-slug.md` | tên file đầy đủ giữ nguyên; trích dẫn rút gọn = `ADR<n>` (vd `ADR0013`), không bare số | STR55 — done | `repo/docs/decisions/0000-index.md:12-16` |
| 5 | `R#` business rule | `RUL<n>` (vd `RUL042`), không unique toàn cục — trích dẫn ngoài spec gốc kèm tên area (vd `RUL42 (runner)`) | STR56 — done (83 citation ở `runner.md`, 0 bare `R#` còn lại) | `repo/docs/specs/runner.md` |
| 6 | `C1`-`C9` contract | `CTR<n>` 3-digit zero-pad (vd `CTR009`) | STR54 — done, decision `ADR0015` | `repo/docs/architecture-map.md` §7 |
````

````diff

````
## source-decision claim_f3413d5462ad3f26c73d617c67279ced

Decision:

````json
{
  "claimId": "claim_f3413d5462ad3f26c73d617c67279ced",
  "sourceUnitDigest": "3533f4a5a93811ebcf336c70764e89e32af1c93e33ae7047181ec1e7eea293a7",
  "targetOwner": "docs/platform/documentation/history/id-systems-audit.md",
  "targetAnchor": "bee-xưởng-giàn-giáo-tạm-giữ-nguyên",
  "targetUnitDigest": "3533f4a5a93811ebcf336c70764e89e32af1c93e33ae7047181ec1e7eea293a7",
  "targetAncestry": [
    "Audit: loại-hình công việc + hệ đặt tên/đánh mã",
    "1 · Bảng inventory (13 hệ — 6 của fgOS, 7 của bee)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/id-systems-audit.md#bee-xưởng-giàn-giáo-tạm-giữ-nguyên to docs/platform/documentation/history/id-systems-audit.md#bee-xưởng-giàn-giáo-tạm-giữ-nguyên. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/id-systems-audit.md#bee-xưởng-giàn-giáo-tạm-giữ-nguyên`
Source unit SHA256: `3533f4a5a93811ebcf336c70764e89e32af1c93e33ae7047181ec1e7eea293a7`
Shown source SHA256: `f4912a2e047b2db2005976cb7613e105aabf1b239f28ec23bcc70ca93d7d544c`

````text
### bee (xưởng — giàn giáo tạm, giữ nguyên)

| # | Hệ | Định dạng hiện tại | Trạng thái | Định nghĩa ở |
|---|---|---|---|---|
| 7 | D-hex global (quyết định TOÀN XƯỞNG) | `randomUUID()`, trích 8-hex khi cite | ✅ Giữ nguyên — luật citation chốt tại §5 | `.bee/bin/lib/decisions.mjs:67,94,113` |
| 8 | `D<n>` local (quyết định CỤC BỘ 1 feature) | số nguyên nhỏ | ✅ Giữ nguyên — luật citation chốt tại §5 | `docs/history/<feature>/CONTEXT.md`, mẫu `.claude/skills/bee-exploring/references/context-template.md:4-6` |
| 9 | cell-id `<feature>-N` | quy ước, regex thật lỏng (`ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/`) | ✅ Giữ nguyên — convention-scoped, chưa từng va chạm thật | `.bee/bin/lib/cells.mjs:363` |
| 10 | feature slug (kebab) | free-text; unique tính bằng hiệu ứng phụ của `bee worktree new` (từ chối branch/dir đã tồn tại), không phải bằng format id | ✅ Giữ nguyên — cùng lý do #9 | `.bee/bin/lib/cells.mjs:594` (`FEATURE_SLUG_PATTERN`) |
| 11 | `P1`/`P2`/`P3` severity | enum 3 giá trị | ✅ Giữ nguyên — va chạm với #3 đã tự giải quyết vì #3 đổi thành `STR<n>` | `.claude/skills/bee-hive/templates/lib/command-registry.mjs:841` |
| 12 | Session id (đa phiên) | `randomUUID()` đầy đủ | ⏸ Không cần đổi — sổ sách vận hành thuần, không ai trích trong văn xuôi | `.bee/bin/lib/claims.mjs:78` (`createSession`) |
| 13 | Capture-stub id | `randomUUID()` đầy đủ | ⏸ Không cần đổi — cùng lý do #12 | `.bee/bin/lib/capture.mjs:64` |
````

Target: `docs/platform/documentation/history/id-systems-audit.md#bee-xưởng-giàn-giáo-tạm-giữ-nguyên`
Target unit SHA256: `3533f4a5a93811ebcf336c70764e89e32af1c93e33ae7047181ec1e7eea293a7`
Shown target SHA256: `f4912a2e047b2db2005976cb7613e105aabf1b239f28ec23bcc70ca93d7d544c`

````text
### bee (xưởng — giàn giáo tạm, giữ nguyên)

| # | Hệ | Định dạng hiện tại | Trạng thái | Định nghĩa ở |
|---|---|---|---|---|
| 7 | D-hex global (quyết định TOÀN XƯỞNG) | `randomUUID()`, trích 8-hex khi cite | ✅ Giữ nguyên — luật citation chốt tại §5 | `.bee/bin/lib/decisions.mjs:67,94,113` |
| 8 | `D<n>` local (quyết định CỤC BỘ 1 feature) | số nguyên nhỏ | ✅ Giữ nguyên — luật citation chốt tại §5 | `docs/history/<feature>/CONTEXT.md`, mẫu `.claude/skills/bee-exploring/references/context-template.md:4-6` |
| 9 | cell-id `<feature>-N` | quy ước, regex thật lỏng (`ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/`) | ✅ Giữ nguyên — convention-scoped, chưa từng va chạm thật | `.bee/bin/lib/cells.mjs:363` |
| 10 | feature slug (kebab) | free-text; unique tính bằng hiệu ứng phụ của `bee worktree new` (từ chối branch/dir đã tồn tại), không phải bằng format id | ✅ Giữ nguyên — cùng lý do #9 | `.bee/bin/lib/cells.mjs:594` (`FEATURE_SLUG_PATTERN`) |
| 11 | `P1`/`P2`/`P3` severity | enum 3 giá trị | ✅ Giữ nguyên — va chạm với #3 đã tự giải quyết vì #3 đổi thành `STR<n>` | `.claude/skills/bee-hive/templates/lib/command-registry.mjs:841` |
| 12 | Session id (đa phiên) | `randomUUID()` đầy đủ | ⏸ Không cần đổi — sổ sách vận hành thuần, không ai trích trong văn xuôi | `.bee/bin/lib/claims.mjs:78` (`createSession`) |
| 13 | Capture-stub id | `randomUUID()` đầy đủ | ⏸ Không cần đổi — cùng lý do #12 | `.bee/bin/lib/capture.mjs:64` |
````

````diff

````
