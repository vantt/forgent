# Mapped root conservation: bounded full-text pack 01

Author session: codex-session:20@2026-10-14
Content commit: 23062c2ce9caaf6711a906673e2dc14c3f345ec3

## source-decision claim_8415b80600de8f4556f623a2b5d12e1c

Decision:

````json
{
  "claimId": "claim_8415b80600de8f4556f623a2b5d12e1c",
  "sourceUnitDigest": "19d76b37d318c814790e8274888332820810e3aa03025ef424fe1b72baec31e8",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "decision",
  "targetUnitDigest": "7a712e922ad0f4d2b69f95bedf024adc683d67f1c31c2f696030f2438585e947",
  "targetAncestry": [],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#decision to docs/platform/documentation/history/templates/decision.md#decision. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#decision`
Source unit SHA256: `19d76b37d318c814790e8274888332820810e3aa03025ef424fe1b72baec31e8`
Shown source SHA256: `97690552e33b8654f9379cbdf405337345cdfce6be5457cfd2aa7c467cc33bbc`

````text
# Decision: <Title>

```txt
Document type: Decision
Audience: Human reviewer, architect, maintainer, agent
Purpose: Record one accepted or rejected durable decision
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Decision provenance for <scope>
Use this when: You need to know what was decided and why
Do not use this for: Current behavior details without checking the spec
Last reviewed: YYYY-MM-DD
Related:
- `../README.md`
```
````

Target: `docs/platform/documentation/history/templates/decision.md#decision`
Target unit SHA256: `7a712e922ad0f4d2b69f95bedf024adc683d67f1c31c2f696030f2438585e947`
Shown target SHA256: `2dc2eeda79ce704d076f8f77d18b2c4d95e03c00a901b9acef7e3522bf52dbf5`

````text
# Decision: <Title>

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/templates/decision.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/templates/decision.md
Supersedes: None; candidate only
Superseded by: None
```
````

````diff
--- docs/templates/decision.md
+++ docs/platform/documentation/history/templates/decision.md
@@ -4,11 +4,12 @@
-Document type: Decision
-Audience: Human reviewer, architect, maintainer, agent
-Purpose: Record one accepted or rejected durable decision
-Design status: Draft
-Implementation: N/A
-Provenance: Human + agent coauthor
-Writer type: Human + agent coauthor
-Canonical for: Decision provenance for <scope>
-Use this when: You need to know what was decided and why
-Do not use this for: Current behavior details without checking the spec
-Last reviewed: YYYY-MM-DD
+Document type: History
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/templates/decision.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
@@ -16 +17,3 @@
-- `../README.md`
+- docs/templates/decision.md
+Supersedes: None; candidate only
+Superseded by: None
````
## source-decision claim_019a134f507964b4acdafb405af987d2

Decision:

````json
{
  "claimId": "claim_019a134f507964b4acdafb405af987d2",
  "sourceUnitDigest": "6502d7ee8e1a967486edd08641e4dd4a7407e84d5c4417261c8340948483d497",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "b4c77f3a054ff5df8a38c2c84a2cbdb0ece20a95af047bf13840fa10c8713b48",
  "targetAncestry": [
    "Decision: <Title>",
    "Source Metadata (Added in candidate)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#unheaded-block-1 to docs/platform/documentation/history/templates/decision.md#unheaded-block-3. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Original metadata is retained verbatim under Source Metadata (Added in candidate), separate from the candidate authority header. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#unheaded-block-1`
Source unit SHA256: `6502d7ee8e1a967486edd08641e4dd4a7407e84d5c4417261c8340948483d497`
Shown source SHA256: `6502d7ee8e1a967486edd08641e4dd4a7407e84d5c4417261c8340948483d497`

````text
```txt
Document type: Decision
Audience: Human reviewer, architect, maintainer, agent
Purpose: Record one accepted or rejected durable decision
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Decision provenance for <scope>
Use this when: You need to know what was decided and why
Do not use this for: Current behavior details without checking the spec
Last reviewed: YYYY-MM-DD
Related:
- `../README.md`
```
````

Target: `docs/platform/documentation/history/templates/decision.md#unheaded-block-3`
Target unit SHA256: `b4c77f3a054ff5df8a38c2c84a2cbdb0ece20a95af047bf13840fa10c8713b48`
Shown target SHA256: `b4c77f3a054ff5df8a38c2c84a2cbdb0ece20a95af047bf13840fa10c8713b48`

`````text
````text
```txt
Document type: Decision
Audience: Human reviewer, architect, maintainer, agent
Purpose: Record one accepted or rejected durable decision
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Decision provenance for <scope>
Use this when: You need to know what was decided and why
Do not use this for: Current behavior details without checking the spec
Last reviewed: YYYY-MM-DD
Related:
- `../README.md`
```
````
`````

`````diff
--- docs/templates/decision.md
+++ docs/platform/documentation/history/templates/decision.md
@@ -0,0 +1 @@
+````text
@@ -15 +16,2 @@
-```+```
+````
`````
## source-decision claim_fc3ba35a4a6054296a2921a7f4a0bace

Decision:

````json
{
  "claimId": "claim_fc3ba35a4a6054296a2921a7f4a0bace",
  "sourceUnitDigest": "4bcc75985a8ab70b12905950ceb37bec01ad710f4f63931ac969264a2682d90c",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "1-decision",
  "targetUnitDigest": "4bcc75985a8ab70b12905950ceb37bec01ad710f4f63931ac969264a2682d90c",
  "targetAncestry": [
    "Decision: <Title>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#1-decision to docs/platform/documentation/history/templates/decision.md#1-decision. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#1-decision`
Source unit SHA256: `4bcc75985a8ab70b12905950ceb37bec01ad710f4f63931ac969264a2682d90c`
Shown source SHA256: `4742b6dd7afe6d12596f2aef80bb8bcbd823ca8f82ad5aeef630234e28f22bf8`

````text
## 1. Decision
````

Target: `docs/platform/documentation/history/templates/decision.md#1-decision`
Target unit SHA256: `4bcc75985a8ab70b12905950ceb37bec01ad710f4f63931ac969264a2682d90c`
Shown target SHA256: `4742b6dd7afe6d12596f2aef80bb8bcbd823ca8f82ad5aeef630234e28f22bf8`

````text
## 1. Decision
````

````diff

````
## source-decision claim_bfe9c921a410b984d10d4fd7bcfb234f

Decision:

````json
{
  "claimId": "claim_bfe9c921a410b984d10d4fd7bcfb234f",
  "sourceUnitDigest": "d1278c55e0404423c5a769b659196a944d15afbdc217e05b96450872cd68241a",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "2-status",
  "targetUnitDigest": "d1278c55e0404423c5a769b659196a944d15afbdc217e05b96450872cd68241a",
  "targetAncestry": [
    "Decision: <Title>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#2-status to docs/platform/documentation/history/templates/decision.md#2-status. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#2-status`
Source unit SHA256: `d1278c55e0404423c5a769b659196a944d15afbdc217e05b96450872cd68241a`
Shown source SHA256: `1d7e6ace53fb03a4f4fb3fc4cdc2d1edba195ed39b28a395b73021a7b3db072a`

````text
## 2. Status
````

Target: `docs/platform/documentation/history/templates/decision.md#2-status`
Target unit SHA256: `d1278c55e0404423c5a769b659196a944d15afbdc217e05b96450872cd68241a`
Shown target SHA256: `1d7e6ace53fb03a4f4fb3fc4cdc2d1edba195ed39b28a395b73021a7b3db072a`

````text
## 2. Status
````

````diff

````
## source-decision claim_ddbbf7252439bd23e90c23d5ba8ca781

Decision:

````json
{
  "claimId": "claim_ddbbf7252439bd23e90c23d5ba8ca781",
  "sourceUnitDigest": "224a207f2767fc69a1f994883581119c23200b8002b9937bf4d51126c6adbded",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "3-context",
  "targetUnitDigest": "224a207f2767fc69a1f994883581119c23200b8002b9937bf4d51126c6adbded",
  "targetAncestry": [
    "Decision: <Title>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#3-context to docs/platform/documentation/history/templates/decision.md#3-context. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#3-context`
Source unit SHA256: `224a207f2767fc69a1f994883581119c23200b8002b9937bf4d51126c6adbded`
Shown source SHA256: `3d8ebcbb570bd2be7af0dd7fd159ece099e070d27e2498e6e995de250d3897d9`

````text
## 3. Context
````

Target: `docs/platform/documentation/history/templates/decision.md#3-context`
Target unit SHA256: `224a207f2767fc69a1f994883581119c23200b8002b9937bf4d51126c6adbded`
Shown target SHA256: `3d8ebcbb570bd2be7af0dd7fd159ece099e070d27e2498e6e995de250d3897d9`

````text
## 3. Context
````

````diff

````
## source-decision claim_3d68a7e334b18b309ff952c640c4349f

Decision:

````json
{
  "claimId": "claim_3d68a7e334b18b309ff952c640c4349f",
  "sourceUnitDigest": "078672381c26a7aebf1f2b30713a5b18f9050a0f2a2e69c7a78121b824c0aab3",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "4-options-considered",
  "targetUnitDigest": "078672381c26a7aebf1f2b30713a5b18f9050a0f2a2e69c7a78121b824c0aab3",
  "targetAncestry": [
    "Decision: <Title>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#4-options-considered to docs/platform/documentation/history/templates/decision.md#4-options-considered. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#4-options-considered`
Source unit SHA256: `078672381c26a7aebf1f2b30713a5b18f9050a0f2a2e69c7a78121b824c0aab3`
Shown source SHA256: `a87930342648c9dfda5c12f4d5a71e112285981ec21f68e17ee98f24c61f185c`

````text
## 4. Options Considered
````

Target: `docs/platform/documentation/history/templates/decision.md#4-options-considered`
Target unit SHA256: `078672381c26a7aebf1f2b30713a5b18f9050a0f2a2e69c7a78121b824c0aab3`
Shown target SHA256: `a87930342648c9dfda5c12f4d5a71e112285981ec21f68e17ee98f24c61f185c`

````text
## 4. Options Considered
````

````diff

````
## source-decision claim_c6ca90af0d4db3715873c6aceb571374

Decision:

````json
{
  "claimId": "claim_c6ca90af0d4db3715873c6aceb571374",
  "sourceUnitDigest": "56d308dbd6af1a404f751fb4e292695e4030c4175fcbddc10eb95241e6dcc730",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "5-rationale",
  "targetUnitDigest": "56d308dbd6af1a404f751fb4e292695e4030c4175fcbddc10eb95241e6dcc730",
  "targetAncestry": [
    "Decision: <Title>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#5-rationale to docs/platform/documentation/history/templates/decision.md#5-rationale. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#5-rationale`
Source unit SHA256: `56d308dbd6af1a404f751fb4e292695e4030c4175fcbddc10eb95241e6dcc730`
Shown source SHA256: `7bcec65c9f771898526d54e27df92a85754c3f33d80bf8b9cf9067c873c60e6d`

````text
## 5. Rationale
````

Target: `docs/platform/documentation/history/templates/decision.md#5-rationale`
Target unit SHA256: `56d308dbd6af1a404f751fb4e292695e4030c4175fcbddc10eb95241e6dcc730`
Shown target SHA256: `7bcec65c9f771898526d54e27df92a85754c3f33d80bf8b9cf9067c873c60e6d`

````text
## 5. Rationale
````

````diff

````
## source-decision claim_b91d99e692bb9ff6f1de339422bcd603

Decision:

````json
{
  "claimId": "claim_b91d99e692bb9ff6f1de339422bcd603",
  "sourceUnitDigest": "9886b88919d8dc243c562f7d16a6d15a77753060617c26b381f38d5a594d7850",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "6-consequences",
  "targetUnitDigest": "9886b88919d8dc243c562f7d16a6d15a77753060617c26b381f38d5a594d7850",
  "targetAncestry": [
    "Decision: <Title>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#6-consequences to docs/platform/documentation/history/templates/decision.md#6-consequences. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#6-consequences`
Source unit SHA256: `9886b88919d8dc243c562f7d16a6d15a77753060617c26b381f38d5a594d7850`
Shown source SHA256: `3642d3c484a66e976a2d6d193a5b574e8158edfe0d6e7f10db09449d0ae3d652`

````text
## 6. Consequences
````

Target: `docs/platform/documentation/history/templates/decision.md#6-consequences`
Target unit SHA256: `9886b88919d8dc243c562f7d16a6d15a77753060617c26b381f38d5a594d7850`
Shown target SHA256: `3642d3c484a66e976a2d6d193a5b574e8158edfe0d6e7f10db09449d0ae3d652`

````text
## 6. Consequences
````

````diff

````
## source-decision claim_8abc1e813dec242523acd9a595bb1d4e

Decision:

````json
{
  "claimId": "claim_8abc1e813dec242523acd9a595bb1d4e",
  "sourceUnitDigest": "cda7f1d0b3d66b6ee8fdd063cda59c0cec521a86206277e7e611809e67bde953",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "7-dissent-uncertainty",
  "targetUnitDigest": "cda7f1d0b3d66b6ee8fdd063cda59c0cec521a86206277e7e611809e67bde953",
  "targetAncestry": [
    "Decision: <Title>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#7-dissent-uncertainty to docs/platform/documentation/history/templates/decision.md#7-dissent-uncertainty. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#7-dissent-uncertainty`
Source unit SHA256: `cda7f1d0b3d66b6ee8fdd063cda59c0cec521a86206277e7e611809e67bde953`
Shown source SHA256: `fd2494e26c1e980d740fdc78367151a03a21d6f1a16820b662ac171123f98678`

````text
## 7. Dissent / Uncertainty
````

Target: `docs/platform/documentation/history/templates/decision.md#7-dissent-uncertainty`
Target unit SHA256: `cda7f1d0b3d66b6ee8fdd063cda59c0cec521a86206277e7e611809e67bde953`
Shown target SHA256: `fd2494e26c1e980d740fdc78367151a03a21d6f1a16820b662ac171123f98678`

````text
## 7. Dissent / Uncertainty
````

````diff

````
## source-decision claim_199692388ab7ee1591a2d462a0cc375e

Decision:

````json
{
  "claimId": "claim_199692388ab7ee1591a2d462a0cc375e",
  "sourceUnitDigest": "706b66b70ffa54f7b9480765c23b46be3fef32a1467beb9eb98154f632826eec",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "8-supersession",
  "targetUnitDigest": "706b66b70ffa54f7b9480765c23b46be3fef32a1467beb9eb98154f632826eec",
  "targetAncestry": [
    "Decision: <Title>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#8-supersession to docs/platform/documentation/history/templates/decision.md#8-supersession. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#8-supersession`
Source unit SHA256: `706b66b70ffa54f7b9480765c23b46be3fef32a1467beb9eb98154f632826eec`
Shown source SHA256: `d80d1aefbf9ed041a991b1a23affcc9bf44816ecc14d262bfe02decebe24f5e4`

````text
## 8. Supersession
````

Target: `docs/platform/documentation/history/templates/decision.md#8-supersession`
Target unit SHA256: `706b66b70ffa54f7b9480765c23b46be3fef32a1467beb9eb98154f632826eec`
Shown target SHA256: `d80d1aefbf9ed041a991b1a23affcc9bf44816ecc14d262bfe02decebe24f5e4`

````text
## 8. Supersession
````

````diff

````
## source-decision claim_8dbc1cd297e15539638fe43e604104f9

Decision:

````json
{
  "claimId": "claim_8dbc1cd297e15539638fe43e604104f9",
  "sourceUnitDigest": "216cc7dc854a37778589f80c460bf926ed5e454ce60c190520730792834ccef9",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "9-evidence",
  "targetUnitDigest": "216cc7dc854a37778589f80c460bf926ed5e454ce60c190520730792834ccef9",
  "targetAncestry": [
    "Decision: <Title>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#9-evidence to docs/platform/documentation/history/templates/decision.md#9-evidence. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#9-evidence`
Source unit SHA256: `216cc7dc854a37778589f80c460bf926ed5e454ce60c190520730792834ccef9`
Shown source SHA256: `49ed4f33e430a03276638f14588d7d8c0547c69f24f5a2f780908ef0832d6069`

````text
## 9. Evidence
````

Target: `docs/platform/documentation/history/templates/decision.md#9-evidence`
Target unit SHA256: `216cc7dc854a37778589f80c460bf926ed5e454ce60c190520730792834ccef9`
Shown target SHA256: `49ed4f33e430a03276638f14588d7d8c0547c69f24f5a2f780908ef0832d6069`

````text
## 9. Evidence
````

````diff

````
## source-decision claim_385a0a5f560ac4b87378c9384a6d62b5

Decision:

````json
{
  "claimId": "claim_385a0a5f560ac4b87378c9384a6d62b5",
  "sourceUnitDigest": "c1598f2d662f661485030f75a4c96593b3b91071e1308883f0f09e35c48bbbe9",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "10-affected-files",
  "targetUnitDigest": "f1d8224d8ba8f05f5096ade69950bd66de485e4a47f9039154a8ee4ae25451d2",
  "targetAncestry": [
    "Decision: <Title>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#10-affected-files to docs/platform/documentation/history/templates/decision.md#10-affected-files. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#10-affected-files`
Source unit SHA256: `c1598f2d662f661485030f75a4c96593b3b91071e1308883f0f09e35c48bbbe9`
Shown source SHA256: `3335a31aeb57d23f76d06b80b8f5624ced8ad5ae73b0006b5f12101ace7884cd`

````text
## 10. Affected Files

| Relationship | File |
|---|---|
| owning area | [../README.md](../README.md) |
| current behavior | [../spec.md](../spec.md) |
| evidence | <link> |
````

Target: `docs/platform/documentation/history/templates/decision.md#10-affected-files`
Target unit SHA256: `f1d8224d8ba8f05f5096ade69950bd66de485e4a47f9039154a8ee4ae25451d2`
Shown target SHA256: `1332b6372f4e3fb78fc5087b976e8708c166badc4ed02c2329195e938fa3da9a`

````text
## 10. Affected Files

```markdown
| Relationship | File |
|---|---|
| owning area | [../README.md](../README.md) |
| current behavior | [../spec.md](../spec.md) |
| evidence | <link> |
```
````

````diff
--- docs/templates/decision.md
+++ docs/platform/documentation/history/templates/decision.md
@@ -2,0 +3 @@
+```markdown
@@ -7 +8,2 @@
-| evidence | <link> |+| evidence | <link> |
+```
````
## source-decision claim_027a40ad9ed4dadf08ebcc73586dd9a1

Decision:

````json
{
  "claimId": "claim_027a40ad9ed4dadf08ebcc73586dd9a1",
  "sourceUnitDigest": "761063de33d3f2bd45daba62389b4775f542d1ab20470952661ff3eb601a7508",
  "targetOwner": "docs/platform/documentation/history/templates/decision.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "4f930677458e87cb27b1ca982e4d3cef5d0eaa0887d66d2a6a31dedbebe83cf6",
  "targetAncestry": [
    "Decision: <Title>",
    "10. Affected Files"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/decision.md#unheaded-block-2 to docs/platform/documentation/history/templates/decision.md#unheaded-block-2. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/decision.md#unheaded-block-2`
Source unit SHA256: `761063de33d3f2bd45daba62389b4775f542d1ab20470952661ff3eb601a7508`
Shown source SHA256: `761063de33d3f2bd45daba62389b4775f542d1ab20470952661ff3eb601a7508`

````text
| Relationship | File |
|---|---|
| owning area | [../README.md](../README.md) |
| current behavior | [../spec.md](../spec.md) |
| evidence | <link> |
````

Target: `docs/platform/documentation/history/templates/decision.md#unheaded-block-2`
Target unit SHA256: `4f930677458e87cb27b1ca982e4d3cef5d0eaa0887d66d2a6a31dedbebe83cf6`
Shown target SHA256: `4f930677458e87cb27b1ca982e4d3cef5d0eaa0887d66d2a6a31dedbebe83cf6`

````text
```markdown
| Relationship | File |
|---|---|
| owning area | [../README.md](../README.md) |
| current behavior | [../spec.md](../spec.md) |
| evidence | <link> |
```
````

````diff
--- docs/templates/decision.md
+++ docs/platform/documentation/history/templates/decision.md
@@ -0,0 +1 @@
+```markdown
@@ -5 +6,2 @@
-| evidence | <link> |+| evidence | <link> |
+```
````
## source-decision claim_bb13ae8ff2a978863f7ff6ff20a455df

Decision:

````json
{
  "claimId": "claim_bb13ae8ff2a978863f7ff6ff20a455df",
  "sourceUnitDigest": "f49ac334cf5ce88bf10d8379381de7cdcc65b5caf28a554f271d7e467187506c",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "discussion",
  "targetUnitDigest": "ec5215c654e3c0954f4641817f07d062b9e0e3d8345b13511aae3427c3fa6721",
  "targetAncestry": [],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/discussion.md#discussion to docs/platform/documentation/history/templates/discussion.md#discussion. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/discussion.md#discussion`
Source unit SHA256: `f49ac334cf5ce88bf10d8379381de7cdcc65b5caf28a554f271d7e467187506c`
Shown source SHA256: `15d6dd94314159d22f0aed67c47d3940fd5bae679ffed22a9b95e56dbe0cc2b9`

````text
# <Topic> Discussion

```txt
Document type: Discussion scratchpad
Audience: Human collaborator, shaping agent
Purpose: Preserve active shaping context until promoted
Design status: Discussion
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: nothing
Use this when: The design is still being shaped
Do not use this for: Accepted architecture, implementation truth, runtime instruction
Delete when: All settled content is promoted or explicitly discarded
Last reviewed: YYYY-MM-DD
Related:
-
```
````

Target: `docs/platform/documentation/history/templates/discussion.md#discussion`
Target unit SHA256: `ec5215c654e3c0954f4641817f07d062b9e0e3d8345b13511aae3427c3fa6721`
Shown target SHA256: `8c38db4e6bd7364ba54cef6020169bd6803e32e3be72f99756ad0113256e0620`

````text
# <Topic> Discussion

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/templates/discussion.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/templates/discussion.md
Supersedes: None; candidate only
Superseded by: None
```
````

````diff
--- docs/templates/discussion.md
+++ docs/platform/documentation/history/templates/discussion.md
@@ -4,12 +4,12 @@
-Document type: Discussion scratchpad
-Audience: Human collaborator, shaping agent
-Purpose: Preserve active shaping context until promoted
-Design status: Discussion
-Implementation: N/A
-Provenance: Human + agent coauthor
-Writer type: Human + agent coauthor
-Canonical for: nothing
-Use this when: The design is still being shaped
-Do not use this for: Accepted architecture, implementation truth, runtime instruction
-Delete when: All settled content is promoted or explicitly discarded
-Last reviewed: YYYY-MM-DD
+Document type: History
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/templates/discussion.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
@@ -17 +17,3 @@
--
+- docs/templates/discussion.md
+Supersedes: None; candidate only
+Superseded by: None
````
## source-decision claim_a991a3191ee2d7590c0862621dc2a06a

Decision:

````json
{
  "claimId": "claim_a991a3191ee2d7590c0862621dc2a06a",
  "sourceUnitDigest": "d78ecd737996ef4d7e5c9955614c89921c8d4859a2e274eb8f245922eb51142c",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "9537ada509227ee895828f5ba76dfd0f2bd977103bdf0108c911ec2dea2be849",
  "targetAncestry": [
    "<Topic> Discussion",
    "Source Metadata (Added in candidate)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/discussion.md#unheaded-block-1 to docs/platform/documentation/history/templates/discussion.md#unheaded-block-3. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Original metadata is retained verbatim under Source Metadata (Added in candidate), separate from the candidate authority header. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/discussion.md#unheaded-block-1`
Source unit SHA256: `d78ecd737996ef4d7e5c9955614c89921c8d4859a2e274eb8f245922eb51142c`
Shown source SHA256: `d78ecd737996ef4d7e5c9955614c89921c8d4859a2e274eb8f245922eb51142c`

````text
```txt
Document type: Discussion scratchpad
Audience: Human collaborator, shaping agent
Purpose: Preserve active shaping context until promoted
Design status: Discussion
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: nothing
Use this when: The design is still being shaped
Do not use this for: Accepted architecture, implementation truth, runtime instruction
Delete when: All settled content is promoted or explicitly discarded
Last reviewed: YYYY-MM-DD
Related:
-
```
````

Target: `docs/platform/documentation/history/templates/discussion.md#unheaded-block-3`
Target unit SHA256: `9537ada509227ee895828f5ba76dfd0f2bd977103bdf0108c911ec2dea2be849`
Shown target SHA256: `9537ada509227ee895828f5ba76dfd0f2bd977103bdf0108c911ec2dea2be849`

`````text
````text
```txt
Document type: Discussion scratchpad
Audience: Human collaborator, shaping agent
Purpose: Preserve active shaping context until promoted
Design status: Discussion
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: nothing
Use this when: The design is still being shaped
Do not use this for: Accepted architecture, implementation truth, runtime instruction
Delete when: All settled content is promoted or explicitly discarded
Last reviewed: YYYY-MM-DD
Related:
-
```
````
`````

`````diff
--- docs/templates/discussion.md
+++ docs/platform/documentation/history/templates/discussion.md
@@ -0,0 +1 @@
+````text
@@ -16 +17,2 @@
-```+```
+````
`````
## source-decision claim_630c884a95a84ad5eea22c035638f83e

Decision:

````json
{
  "claimId": "claim_630c884a95a84ad5eea22c035638f83e",
  "sourceUnitDigest": "b4f4ae113f2bb06b797cf4343fc31eace2b66fcd98070172f36877405f9df170",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "1-current-summary",
  "targetUnitDigest": "b4f4ae113f2bb06b797cf4343fc31eace2b66fcd98070172f36877405f9df170",
  "targetAncestry": [
    "<Topic> Discussion"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/discussion.md#1-current-summary to docs/platform/documentation/history/templates/discussion.md#1-current-summary. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/discussion.md#1-current-summary`
Source unit SHA256: `b4f4ae113f2bb06b797cf4343fc31eace2b66fcd98070172f36877405f9df170`
Shown source SHA256: `8a8c8caeb0c74d79e39d3263c288acc22c451f971b366c6822ebec5a5ad5effe`

````text
## 1. Current Summary
````

Target: `docs/platform/documentation/history/templates/discussion.md#1-current-summary`
Target unit SHA256: `b4f4ae113f2bb06b797cf4343fc31eace2b66fcd98070172f36877405f9df170`
Shown target SHA256: `8a8c8caeb0c74d79e39d3263c288acc22c451f971b366c6822ebec5a5ad5effe`

````text
## 1. Current Summary
````

````diff

````
## source-decision claim_85175d44794e2f1f4f394de5965af0ed

Decision:

````json
{
  "claimId": "claim_85175d44794e2f1f4f394de5965af0ed",
  "sourceUnitDigest": "a553730a0bbe2d9d861bc2bb3872c1fdf604f42625c81641f59b04474d0cf42a",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "2-open-questions",
  "targetUnitDigest": "a553730a0bbe2d9d861bc2bb3872c1fdf604f42625c81641f59b04474d0cf42a",
  "targetAncestry": [
    "<Topic> Discussion"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/discussion.md#2-open-questions to docs/platform/documentation/history/templates/discussion.md#2-open-questions. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/discussion.md#2-open-questions`
Source unit SHA256: `a553730a0bbe2d9d861bc2bb3872c1fdf604f42625c81641f59b04474d0cf42a`
Shown source SHA256: `9f0dc45cd9d636279f673aeeb908d5b382bea9e09405f25055acfa70a158a335`

````text
## 2. Open Questions
````

Target: `docs/platform/documentation/history/templates/discussion.md#2-open-questions`
Target unit SHA256: `a553730a0bbe2d9d861bc2bb3872c1fdf604f42625c81641f59b04474d0cf42a`
Shown target SHA256: `9f0dc45cd9d636279f673aeeb908d5b382bea9e09405f25055acfa70a158a335`

````text
## 2. Open Questions
````

````diff

````
## source-decision claim_318885bccab24d0a820cb9a26bf29abc

Decision:

````json
{
  "claimId": "claim_318885bccab24d0a820cb9a26bf29abc",
  "sourceUnitDigest": "82e4eb17d63584cbd0b366d628d8a2663745c3c526d024ff2b8431e50b1acb6b",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "3-tentative-decisions",
  "targetUnitDigest": "82e4eb17d63584cbd0b366d628d8a2663745c3c526d024ff2b8431e50b1acb6b",
  "targetAncestry": [
    "<Topic> Discussion"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/discussion.md#3-tentative-decisions to docs/platform/documentation/history/templates/discussion.md#3-tentative-decisions. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/discussion.md#3-tentative-decisions`
Source unit SHA256: `82e4eb17d63584cbd0b366d628d8a2663745c3c526d024ff2b8431e50b1acb6b`
Shown source SHA256: `671901045e1c439b6b0f2a2a2257c0816cdd6e7e0f699b68d60ebb5e11c6f126`

````text
## 3. Tentative Decisions
````

Target: `docs/platform/documentation/history/templates/discussion.md#3-tentative-decisions`
Target unit SHA256: `82e4eb17d63584cbd0b366d628d8a2663745c3c526d024ff2b8431e50b1acb6b`
Shown target SHA256: `671901045e1c439b6b0f2a2a2257c0816cdd6e7e0f699b68d60ebb5e11c6f126`

````text
## 3. Tentative Decisions
````

````diff

````
## source-decision claim_994b96c67626ed2da842e4c33830142d

Decision:

````json
{
  "claimId": "claim_994b96c67626ed2da842e4c33830142d",
  "sourceUnitDigest": "25eb7d3e256a414e92c052bdfe9ff1ec1959136b23ec4de49262c6d5c8c1ce47",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "4-promoted-decisions",
  "targetUnitDigest": "25eb7d3e256a414e92c052bdfe9ff1ec1959136b23ec4de49262c6d5c8c1ce47",
  "targetAncestry": [
    "<Topic> Discussion"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/discussion.md#4-promoted-decisions to docs/platform/documentation/history/templates/discussion.md#4-promoted-decisions. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/discussion.md#4-promoted-decisions`
Source unit SHA256: `25eb7d3e256a414e92c052bdfe9ff1ec1959136b23ec4de49262c6d5c8c1ce47`
Shown source SHA256: `2455325297bd5339bef020876d8d105afb2ee71e5668c3936591cd69fc4e51e5`

````text
## 4. Promoted Decisions
````

Target: `docs/platform/documentation/history/templates/discussion.md#4-promoted-decisions`
Target unit SHA256: `25eb7d3e256a414e92c052bdfe9ff1ec1959136b23ec4de49262c6d5c8c1ce47`
Shown target SHA256: `2455325297bd5339bef020876d8d105afb2ee71e5668c3936591cd69fc4e51e5`

````text
## 4. Promoted Decisions
````

````diff

````
## source-decision claim_b99c04f17e9d133dc4f985a1a0195403

Decision:

````json
{
  "claimId": "claim_b99c04f17e9d133dc4f985a1a0195403",
  "sourceUnitDigest": "31c11e0a3eb3238bd88abe10156e0a31cdf837a099db6ebb870a378d94f62895",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "5-rejected-parked-alternatives",
  "targetUnitDigest": "31c11e0a3eb3238bd88abe10156e0a31cdf837a099db6ebb870a378d94f62895",
  "targetAncestry": [
    "<Topic> Discussion"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/discussion.md#5-rejected-parked-alternatives to docs/platform/documentation/history/templates/discussion.md#5-rejected-parked-alternatives. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/discussion.md#5-rejected-parked-alternatives`
Source unit SHA256: `31c11e0a3eb3238bd88abe10156e0a31cdf837a099db6ebb870a378d94f62895`
Shown source SHA256: `3b7127e1daf75b63937106ff108483313a42744d0ca1e367872c1a7b83ac597e`

````text
## 5. Rejected / Parked Alternatives
````

Target: `docs/platform/documentation/history/templates/discussion.md#5-rejected-parked-alternatives`
Target unit SHA256: `31c11e0a3eb3238bd88abe10156e0a31cdf837a099db6ebb870a378d94f62895`
Shown target SHA256: `3b7127e1daf75b63937106ff108483313a42744d0ca1e367872c1a7b83ac597e`

````text
## 5. Rejected / Parked Alternatives
````

````diff

````
## source-decision claim_677ef19a8f81f975807f8a2b5f623440

Decision:

````json
{
  "claimId": "claim_677ef19a8f81f975807f8a2b5f623440",
  "sourceUnitDigest": "28cbe54f9a8f518729ee3a1d4fc8c95597cf4fe5b1d0313a1a603abbaefb2dc7",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "6-evidence-and-source-links",
  "targetUnitDigest": "28cbe54f9a8f518729ee3a1d4fc8c95597cf4fe5b1d0313a1a603abbaefb2dc7",
  "targetAncestry": [
    "<Topic> Discussion"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/discussion.md#6-evidence-and-source-links to docs/platform/documentation/history/templates/discussion.md#6-evidence-and-source-links. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/discussion.md#6-evidence-and-source-links`
Source unit SHA256: `28cbe54f9a8f518729ee3a1d4fc8c95597cf4fe5b1d0313a1a603abbaefb2dc7`
Shown source SHA256: `a8f084c2223ea5f8d822f0390795e7e47d95240887598cf60332c4547418f89a`

````text
## 6. Evidence And Source Links
````

Target: `docs/platform/documentation/history/templates/discussion.md#6-evidence-and-source-links`
Target unit SHA256: `28cbe54f9a8f518729ee3a1d4fc8c95597cf4fe5b1d0313a1a603abbaefb2dc7`
Shown target SHA256: `a8f084c2223ea5f8d822f0390795e7e47d95240887598cf60332c4547418f89a`

````text
## 6. Evidence And Source Links
````

````diff

````
## source-decision claim_e7a5211570ef3acf24be2c8aed25f7d9

Decision:

````json
{
  "claimId": "claim_e7a5211570ef3acf24be2c8aed25f7d9",
  "sourceUnitDigest": "d3622b3da6693857b5e215e4dc645da900389c086f3716775c9788425552178b",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "7-promotion-targets",
  "targetUnitDigest": "d3622b3da6693857b5e215e4dc645da900389c086f3716775c9788425552178b",
  "targetAncestry": [
    "<Topic> Discussion"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/discussion.md#7-promotion-targets to docs/platform/documentation/history/templates/discussion.md#7-promotion-targets. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/discussion.md#7-promotion-targets`
Source unit SHA256: `d3622b3da6693857b5e215e4dc645da900389c086f3716775c9788425552178b`
Shown source SHA256: `65d1a1ecdfaddbacb5e976baf5602cb8ca2a79a3c1425decd27e5582ed9781bb`

````text
## 7. Promotion Targets

| Item | Status | Target |
|---|---|---|
````

Target: `docs/platform/documentation/history/templates/discussion.md#7-promotion-targets`
Target unit SHA256: `d3622b3da6693857b5e215e4dc645da900389c086f3716775c9788425552178b`
Shown target SHA256: `65d1a1ecdfaddbacb5e976baf5602cb8ca2a79a3c1425decd27e5582ed9781bb`

````text
## 7. Promotion Targets

| Item | Status | Target |
|---|---|---|
````

````diff

````
## source-decision claim_90dbf8d83bda70886dd8bbc7f3831f83

Decision:

````json
{
  "claimId": "claim_90dbf8d83bda70886dd8bbc7f3831f83",
  "sourceUnitDigest": "5906ad720cdf87a4671a56d051f87545515dbb288c591f7aaa6179d558842dcd",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "5906ad720cdf87a4671a56d051f87545515dbb288c591f7aaa6179d558842dcd",
  "targetAncestry": [
    "<Topic> Discussion",
    "7. Promotion Targets"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/discussion.md#unheaded-block-2 to docs/platform/documentation/history/templates/discussion.md#unheaded-block-2. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/discussion.md#unheaded-block-2`
Source unit SHA256: `5906ad720cdf87a4671a56d051f87545515dbb288c591f7aaa6179d558842dcd`
Shown source SHA256: `5906ad720cdf87a4671a56d051f87545515dbb288c591f7aaa6179d558842dcd`

````text
| Item | Status | Target |
|---|---|---|
````

Target: `docs/platform/documentation/history/templates/discussion.md#unheaded-block-2`
Target unit SHA256: `5906ad720cdf87a4671a56d051f87545515dbb288c591f7aaa6179d558842dcd`
Shown target SHA256: `5906ad720cdf87a4671a56d051f87545515dbb288c591f7aaa6179d558842dcd`

````text
| Item | Status | Target |
|---|---|---|
````

````diff

````
## source-decision claim_9e6028aac3d1cbc4cd5c7a7ac317656a

Decision:

````json
{
  "claimId": "claim_9e6028aac3d1cbc4cd5c7a7ac317656a",
  "sourceUnitDigest": "218ed4ed15f6d60cf95f35f5a4bfa8afa0d76147e8f2549bc107e93e79040550",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "8-raw-discussion-log",
  "targetUnitDigest": "218ed4ed15f6d60cf95f35f5a4bfa8afa0d76147e8f2549bc107e93e79040550",
  "targetAncestry": [
    "<Topic> Discussion"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/discussion.md#8-raw-discussion-log to docs/platform/documentation/history/templates/discussion.md#8-raw-discussion-log. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/discussion.md#8-raw-discussion-log`
Source unit SHA256: `218ed4ed15f6d60cf95f35f5a4bfa8afa0d76147e8f2549bc107e93e79040550`
Shown source SHA256: `7fe063263f5b9550e0152a039f0d52854142c0f4113461943ae8c28493ee73e0`

````text
## 8. Raw Discussion Log
````

Target: `docs/platform/documentation/history/templates/discussion.md#8-raw-discussion-log`
Target unit SHA256: `218ed4ed15f6d60cf95f35f5a4bfa8afa0d76147e8f2549bc107e93e79040550`
Shown target SHA256: `7fe063263f5b9550e0152a039f0d52854142c0f4113461943ae8c28493ee73e0`

````text
## 8. Raw Discussion Log
````

````diff

````
## source-decision claim_bc11a187e9d7ff386dff0698302dc2a9

Decision:

````json
{
  "claimId": "claim_bc11a187e9d7ff386dff0698302dc2a9",
  "sourceUnitDigest": "5629c3b3a4cb1084c150bb743ffbab9fb74816c5b57ea487e5cac9626036ec97",
  "targetOwner": "docs/platform/documentation/history/templates/generated.md",
  "targetAnchor": "section",
  "targetUnitDigest": "2cda2b7ab786500eeb53c06cfbeb9b3807ff6e723cc52afc8feebcb10e85b52b",
  "targetAncestry": [],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/generated.md#section to docs/platform/documentation/history/templates/generated.md#section. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/generated.md#section`
Source unit SHA256: `5629c3b3a4cb1084c150bb743ffbab9fb74816c5b57ea487e5cac9626036ec97`
Shown source SHA256: `b83d40cf1452a77d2fc055642ff936d04a67766bcd11d20985df3a2cf65249aa`

````text
# <Generated Artifact Name>

```txt
Document type: Generated artifact
Audience: Human reviewer, maintainer, agent
Purpose: Project source state into a readable or machine-readable view
Design status: N/A
Implementation: Active
Provenance: Generated
Writer type: Runtime generator
Canonical for: derived view only
Use this when: You need the generated projection
Do not use this for: Editing source truth directly
Last reviewed: YYYY-MM-DD
Source of truth:
Generator:
Generator version:
Generated at:
Freshness check:
Do not edit: true
Related:
-
```

This file is generated. To change it, change the source of truth or the
generator.
````

Target: `docs/platform/documentation/history/templates/generated.md#section`
Target unit SHA256: `2cda2b7ab786500eeb53c06cfbeb9b3807ff6e723cc52afc8feebcb10e85b52b`
Shown target SHA256: `1bfcb2f9eaa17e2860a94bf391a13800ee2b25bd8c6087663938a3f19d18d99c`

````text
# <Generated Artifact Name>

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/templates/generated.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/templates/generated.md
Supersedes: None; candidate only
Superseded by: None
```

This file is generated. To change it, change the source of truth or the
generator.
````

````diff
--- docs/templates/generated.md
+++ docs/platform/documentation/history/templates/generated.md
@@ -4,17 +4,12 @@
-Document type: Generated artifact
-Audience: Human reviewer, maintainer, agent
-Purpose: Project source state into a readable or machine-readable view
-Design status: N/A
-Implementation: Active
-Provenance: Generated
-Writer type: Runtime generator
-Canonical for: derived view only
-Use this when: You need the generated projection
-Do not use this for: Editing source truth directly
-Last reviewed: YYYY-MM-DD
-Source of truth:
-Generator:
-Generator version:
-Generated at:
-Freshness check:
-Do not edit: true
+Document type: History
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/templates/generated.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
@@ -22 +17,3 @@
--
+- docs/templates/generated.md
+Supersedes: None; candidate only
+Superseded by: None
````
## source-decision claim_7108513a06fdb92644760d384e2663d6

Decision:

````json
{
  "claimId": "claim_7108513a06fdb92644760d384e2663d6",
  "sourceUnitDigest": "35eb59a8aee21d02dbf965b2c1bfec4fbd7cec70c3d0a067ca15c9c175d7707e",
  "targetOwner": "docs/platform/documentation/history/templates/generated.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "20adbd2c6c9d69f8cd705e4f0eb689c5c35aa1bfcc829183c220d7aa064ff8bd",
  "targetAncestry": [
    "<Generated Artifact Name>",
    "Source Metadata (Added in candidate)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/generated.md#unheaded-block-1 to docs/platform/documentation/history/templates/generated.md#unheaded-block-3. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Original metadata is retained verbatim under Source Metadata (Added in candidate), separate from the candidate authority header. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/generated.md#unheaded-block-1`
Source unit SHA256: `35eb59a8aee21d02dbf965b2c1bfec4fbd7cec70c3d0a067ca15c9c175d7707e`
Shown source SHA256: `35eb59a8aee21d02dbf965b2c1bfec4fbd7cec70c3d0a067ca15c9c175d7707e`

````text
```txt
Document type: Generated artifact
Audience: Human reviewer, maintainer, agent
Purpose: Project source state into a readable or machine-readable view
Design status: N/A
Implementation: Active
Provenance: Generated
Writer type: Runtime generator
Canonical for: derived view only
Use this when: You need the generated projection
Do not use this for: Editing source truth directly
Last reviewed: YYYY-MM-DD
Source of truth:
Generator:
Generator version:
Generated at:
Freshness check:
Do not edit: true
Related:
-
```
````

Target: `docs/platform/documentation/history/templates/generated.md#unheaded-block-3`
Target unit SHA256: `20adbd2c6c9d69f8cd705e4f0eb689c5c35aa1bfcc829183c220d7aa064ff8bd`
Shown target SHA256: `20adbd2c6c9d69f8cd705e4f0eb689c5c35aa1bfcc829183c220d7aa064ff8bd`

`````text
````text
```txt
Document type: Generated artifact
Audience: Human reviewer, maintainer, agent
Purpose: Project source state into a readable or machine-readable view
Design status: N/A
Implementation: Active
Provenance: Generated
Writer type: Runtime generator
Canonical for: derived view only
Use this when: You need the generated projection
Do not use this for: Editing source truth directly
Last reviewed: YYYY-MM-DD
Source of truth:
Generator:
Generator version:
Generated at:
Freshness check:
Do not edit: true
Related:
-
```
````
`````

`````diff
--- docs/templates/generated.md
+++ docs/platform/documentation/history/templates/generated.md
@@ -0,0 +1 @@
+````text
@@ -21 +22,2 @@
-```+```
+````
`````
## source-decision claim_c92cfffdd611655e62f4be3ba2859acc

Decision:

````json
{
  "claimId": "claim_c92cfffdd611655e62f4be3ba2859acc",
  "sourceUnitDigest": "0c40d64333e03ec6ced72d94e48d36f5f50adb9890abc0733f0f6141a85985f0",
  "targetOwner": "docs/platform/documentation/history/templates/generated.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "0c40d64333e03ec6ced72d94e48d36f5f50adb9890abc0733f0f6141a85985f0",
  "targetAncestry": [
    "<Generated Artifact Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/generated.md#unheaded-block-2 to docs/platform/documentation/history/templates/generated.md#unheaded-block-2. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/generated.md#unheaded-block-2`
Source unit SHA256: `0c40d64333e03ec6ced72d94e48d36f5f50adb9890abc0733f0f6141a85985f0`
Shown source SHA256: `0c40d64333e03ec6ced72d94e48d36f5f50adb9890abc0733f0f6141a85985f0`

````text
This file is generated. To change it, change the source of truth or the
generator.
````

Target: `docs/platform/documentation/history/templates/generated.md#unheaded-block-2`
Target unit SHA256: `0c40d64333e03ec6ced72d94e48d36f5f50adb9890abc0733f0f6141a85985f0`
Shown target SHA256: `0c40d64333e03ec6ced72d94e48d36f5f50adb9890abc0733f0f6141a85985f0`

````text
This file is generated. To change it, change the source of truth or the
generator.
````

````diff

````
## source-decision claim_088e8648addb44a4b6aa9ea49dfe06f6

Decision:

````json
{
  "claimId": "claim_088e8648addb44a4b6aa9ea49dfe06f6",
  "sourceUnitDigest": "1194385db07cbdee1b48cf878f6c8f3c99500a6e6e9daf34db0f6d7335d46816",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "intent-preservation-ledger",
  "targetUnitDigest": "13b6b33a09155510d36a5895422c414206222237ebe6105922582aaddb701f1d",
  "targetAncestry": [],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#intent-preservation-ledger to docs/platform/documentation/history/templates/intent-preservation-ledger.md#intent-preservation-ledger. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#intent-preservation-ledger`
Source unit SHA256: `1194385db07cbdee1b48cf878f6c8f3c99500a6e6e9daf34db0f6d7335d46816`
Shown source SHA256: `243e6e8e57cb13c3f528e7bba8cc192fd027f87cf7220da499197c5d0309fc5c`

````text
# <Area> Intent Preservation Ledger

```txt
Document type: Intent preservation ledger
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve full <area> intent across simplified implementation slices
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Preserved design intent for <area>
Use this when: A plan or implementation narrows, stages, or simplifies <area>'s full vision
Do not use this for: Current behavior without checking spec.md, or accepting new architecture by itself
Last reviewed: YYYY-MM-DD
Related:
- `vision.md`
- `spec.md`
```
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#intent-preservation-ledger`
Target unit SHA256: `13b6b33a09155510d36a5895422c414206222237ebe6105922582aaddb701f1d`
Shown target SHA256: `663562e02f55140cdbf7d01e9e03dccfaef1bbb3a57e6e60df438ce68b8fca66`

````text
# <Area> Intent Preservation Ledger

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/templates/intent-preservation-ledger.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/templates/intent-preservation-ledger.md
Supersedes: None; candidate only
Superseded by: None
```
````

````diff
--- docs/templates/intent-preservation-ledger.md
+++ docs/platform/documentation/history/templates/intent-preservation-ledger.md
@@ -4,11 +4,12 @@
-Document type: Intent preservation ledger
-Audience: Human reviewer, architect, maintainer, agent
-Purpose: Preserve full <area> intent across simplified implementation slices
-Design status: Draft
-Implementation: N/A
-Provenance: Human + agent coauthor
-Writer type: Human + agent coauthor
-Canonical for: Preserved design intent for <area>
-Use this when: A plan or implementation narrows, stages, or simplifies <area>'s full vision
-Do not use this for: Current behavior without checking spec.md, or accepting new architecture by itself
-Last reviewed: YYYY-MM-DD
+Document type: History
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/templates/intent-preservation-ledger.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
@@ -16,2 +17,3 @@
-- `vision.md`
-- `spec.md`
+- docs/templates/intent-preservation-ledger.md
+Supersedes: None; candidate only
+Superseded by: None
````
## source-decision claim_8730f45cf1ac41bbbd9f92fd5e018acb

Decision:

````json
{
  "claimId": "claim_8730f45cf1ac41bbbd9f92fd5e018acb",
  "sourceUnitDigest": "3e7be11de725163967b27583210e2ba555ee03694403e2adda93428b466b648c",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "unheaded-block-7",
  "targetUnitDigest": "67efa7d7b2b83c64d8e6f6bab07b476a0d5cf580e2711ad8f9a549382169a029",
  "targetAncestry": [
    "<Area> Intent Preservation Ledger",
    "Source Metadata (Added in candidate)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#unheaded-block-1 to docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-7. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Original metadata is retained verbatim under Source Metadata (Added in candidate), separate from the candidate authority header. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#unheaded-block-1`
Source unit SHA256: `3e7be11de725163967b27583210e2ba555ee03694403e2adda93428b466b648c`
Shown source SHA256: `3e7be11de725163967b27583210e2ba555ee03694403e2adda93428b466b648c`

````text
```txt
Document type: Intent preservation ledger
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve full <area> intent across simplified implementation slices
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Preserved design intent for <area>
Use this when: A plan or implementation narrows, stages, or simplifies <area>'s full vision
Do not use this for: Current behavior without checking spec.md, or accepting new architecture by itself
Last reviewed: YYYY-MM-DD
Related:
- `vision.md`
- `spec.md`
```
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-7`
Target unit SHA256: `67efa7d7b2b83c64d8e6f6bab07b476a0d5cf580e2711ad8f9a549382169a029`
Shown target SHA256: `67efa7d7b2b83c64d8e6f6bab07b476a0d5cf580e2711ad8f9a549382169a029`

`````text
````text
```txt
Document type: Intent preservation ledger
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve full <area> intent across simplified implementation slices
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: Preserved design intent for <area>
Use this when: A plan or implementation narrows, stages, or simplifies <area>'s full vision
Do not use this for: Current behavior without checking spec.md, or accepting new architecture by itself
Last reviewed: YYYY-MM-DD
Related:
- `vision.md`
- `spec.md`
```
````
`````

`````diff
--- docs/templates/intent-preservation-ledger.md
+++ docs/platform/documentation/history/templates/intent-preservation-ledger.md
@@ -0,0 +1 @@
+````text
@@ -16 +17,2 @@
-```+```
+````
`````
## source-decision claim_92eba2424b594a6bddea4f6ee0e2d82c

Decision:

````json
{
  "claimId": "claim_92eba2424b594a6bddea4f6ee0e2d82c",
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
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#1-purpose to docs/platform/documentation/history/templates/intent-preservation-ledger.md#1-purpose. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#1-purpose`
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
## source-decision claim_a156d400f7ce7c598811129557094c5e

Decision:

````json
{
  "claimId": "claim_a156d400f7ce7c598811129557094c5e",
  "sourceUnitDigest": "8c876bf5039e49bf89ec738a6fd8e9fb4d6b90ba8601c03fb50c83c29d9b92fc",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "2-status-vocabulary",
  "targetUnitDigest": "8c876bf5039e49bf89ec738a6fd8e9fb4d6b90ba8601c03fb50c83c29d9b92fc",
  "targetAncestry": [
    "<Area> Intent Preservation Ledger"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#2-status-vocabulary to docs/platform/documentation/history/templates/intent-preservation-ledger.md#2-status-vocabulary. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#2-status-vocabulary`
Source unit SHA256: `8c876bf5039e49bf89ec738a6fd8e9fb4d6b90ba8601c03fb50c83c29d9b92fc`
Shown source SHA256: `499ff40d3eeb07cbe1b37cee7ba008a6f74be5de0512b16a7d5e4f29e97cb04b`

````text
## 2. Status Vocabulary

| Status | Meaning |
|---|---|
| `implemented` | The intent is implemented and has evidence. |
| `partial` | Some implementation exists, but the full intent is not satisfied. |
| `deferred-preserved` | Not implemented in the current slice, but still intended. |
| `accepted-not-implemented` | Accepted design direction with no current implementation proof. |
| `superseded` | Replaced by an explicit accepted decision. |
| `rejected` | Explicitly abandoned by human decision with rationale. |
| `unknown` | Needs fresh scan or review before use. |
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#2-status-vocabulary`
Target unit SHA256: `8c876bf5039e49bf89ec738a6fd8e9fb4d6b90ba8601c03fb50c83c29d9b92fc`
Shown target SHA256: `499ff40d3eeb07cbe1b37cee7ba008a6f74be5de0512b16a7d5e4f29e97cb04b`

````text
## 2. Status Vocabulary

| Status | Meaning |
|---|---|
| `implemented` | The intent is implemented and has evidence. |
| `partial` | Some implementation exists, but the full intent is not satisfied. |
| `deferred-preserved` | Not implemented in the current slice, but still intended. |
| `accepted-not-implemented` | Accepted design direction with no current implementation proof. |
| `superseded` | Replaced by an explicit accepted decision. |
| `rejected` | Explicitly abandoned by human decision with rationale. |
| `unknown` | Needs fresh scan or review before use. |
````

````diff

````
## source-decision claim_3f9117a3c7a534f1b2c418868118619c

Decision:

````json
{
  "claimId": "claim_3f9117a3c7a534f1b2c418868118619c",
  "sourceUnitDigest": "d781a719179cb91f80889601f2a248abfa5a4ff930e44bd1bddbf2d5f31b1b19",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "d781a719179cb91f80889601f2a248abfa5a4ff930e44bd1bddbf2d5f31b1b19",
  "targetAncestry": [
    "<Area> Intent Preservation Ledger",
    "2. Status Vocabulary"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#unheaded-block-2 to docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-2. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#unheaded-block-2`
Source unit SHA256: `d781a719179cb91f80889601f2a248abfa5a4ff930e44bd1bddbf2d5f31b1b19`
Shown source SHA256: `d781a719179cb91f80889601f2a248abfa5a4ff930e44bd1bddbf2d5f31b1b19`

````text
| Status | Meaning |
|---|---|
| `implemented` | The intent is implemented and has evidence. |
| `partial` | Some implementation exists, but the full intent is not satisfied. |
| `deferred-preserved` | Not implemented in the current slice, but still intended. |
| `accepted-not-implemented` | Accepted design direction with no current implementation proof. |
| `superseded` | Replaced by an explicit accepted decision. |
| `rejected` | Explicitly abandoned by human decision with rationale. |
| `unknown` | Needs fresh scan or review before use. |
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-2`
Target unit SHA256: `d781a719179cb91f80889601f2a248abfa5a4ff930e44bd1bddbf2d5f31b1b19`
Shown target SHA256: `d781a719179cb91f80889601f2a248abfa5a4ff930e44bd1bddbf2d5f31b1b19`

````text
| Status | Meaning |
|---|---|
| `implemented` | The intent is implemented and has evidence. |
| `partial` | Some implementation exists, but the full intent is not satisfied. |
| `deferred-preserved` | Not implemented in the current slice, but still intended. |
| `accepted-not-implemented` | Accepted design direction with no current implementation proof. |
| `superseded` | Replaced by an explicit accepted decision. |
| `rejected` | Explicitly abandoned by human decision with rationale. |
| `unknown` | Needs fresh scan or review before use. |
````

````diff

````
## source-decision claim_9009e4a5ad257dfb138745b4dc8ae0e0

Decision:

````json
{
  "claimId": "claim_9009e4a5ad257dfb138745b4dc8ae0e0",
  "sourceUnitDigest": "1d9f2f9e9aeb89d4dc3ed0e3198c76dea47e7b12645ecf691d207a4f2acc7491",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "3-preserved-intents",
  "targetUnitDigest": "1d9f2f9e9aeb89d4dc3ed0e3198c76dea47e7b12645ecf691d207a4f2acc7491",
  "targetAncestry": [
    "<Area> Intent Preservation Ledger"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#3-preserved-intents to docs/platform/documentation/history/templates/intent-preservation-ledger.md#3-preserved-intents. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#3-preserved-intents`
Source unit SHA256: `1d9f2f9e9aeb89d4dc3ed0e3198c76dea47e7b12645ecf691d207a4f2acc7491`
Shown source SHA256: `fbc45b03f85b40cd4459068e0626a239020944ace8a1eac496db4474152ba790`

````text
## 3. Preserved Intents

| ID | Original intent | Source | Status | Current slice | Must not preclude | Revisit trigger | Proof / evidence |
|---|---|---|---|---|---|---|---|
| <AREA-I001> |  |  |  |  |  |  |  |
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#3-preserved-intents`
Target unit SHA256: `1d9f2f9e9aeb89d4dc3ed0e3198c76dea47e7b12645ecf691d207a4f2acc7491`
Shown target SHA256: `fbc45b03f85b40cd4459068e0626a239020944ace8a1eac496db4474152ba790`

````text
## 3. Preserved Intents

| ID | Original intent | Source | Status | Current slice | Must not preclude | Revisit trigger | Proof / evidence |
|---|---|---|---|---|---|---|---|
| <AREA-I001> |  |  |  |  |  |  |  |
````

````diff

````
## source-decision claim_4590768b333671cf98f6f39c1a3d5aeb

Decision:

````json
{
  "claimId": "claim_4590768b333671cf98f6f39c1a3d5aeb",
  "sourceUnitDigest": "1dc5f5c96ce288a8b53ad12084218252f01d4e91b556f495ff70a7e39ada88ff",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "1dc5f5c96ce288a8b53ad12084218252f01d4e91b556f495ff70a7e39ada88ff",
  "targetAncestry": [
    "<Area> Intent Preservation Ledger",
    "3. Preserved Intents"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#unheaded-block-3 to docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-3. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#unheaded-block-3`
Source unit SHA256: `1dc5f5c96ce288a8b53ad12084218252f01d4e91b556f495ff70a7e39ada88ff`
Shown source SHA256: `1dc5f5c96ce288a8b53ad12084218252f01d4e91b556f495ff70a7e39ada88ff`

````text
| ID | Original intent | Source | Status | Current slice | Must not preclude | Revisit trigger | Proof / evidence |
|---|---|---|---|---|---|---|---|
| <AREA-I001> |  |  |  |  |  |  |  |
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-3`
Target unit SHA256: `1dc5f5c96ce288a8b53ad12084218252f01d4e91b556f495ff70a7e39ada88ff`
Shown target SHA256: `1dc5f5c96ce288a8b53ad12084218252f01d4e91b556f495ff70a7e39ada88ff`

````text
| ID | Original intent | Source | Status | Current slice | Must not preclude | Revisit trigger | Proof / evidence |
|---|---|---|---|---|---|---|---|
| <AREA-I001> |  |  |  |  |  |  |  |
````

````diff

````
## source-decision claim_58c6eef162879926a789acc22f1a339f

Decision:

````json
{
  "claimId": "claim_58c6eef162879926a789acc22f1a339f",
  "sourceUnitDigest": "fdd596cae7e331b12de6ce2f44d3a35794f96c16cdb82a96f4c3e12e723a3515",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "4-required-plan-traceability",
  "targetUnitDigest": "fdd596cae7e331b12de6ce2f44d3a35794f96c16cdb82a96f4c3e12e723a3515",
  "targetAncestry": [
    "<Area> Intent Preservation Ledger"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#4-required-plan-traceability to docs/platform/documentation/history/templates/intent-preservation-ledger.md#4-required-plan-traceability. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#4-required-plan-traceability`
Source unit SHA256: `fdd596cae7e331b12de6ce2f44d3a35794f96c16cdb82a96f4c3e12e723a3515`
Shown source SHA256: `50edabfda6bf370c6006423e5f3e0ab48c8240547cc647d39c80136e0580ab04`

````text
## 4. Required Plan Traceability

Every implementation plan that narrows this area's vision must include:

1. an intent traceability table;
2. a must-not-preclude check for every touched preserved intent;
3. evidence or an explicit gap for every status change;
4. a phase-closing deferral audit.
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#4-required-plan-traceability`
Target unit SHA256: `fdd596cae7e331b12de6ce2f44d3a35794f96c16cdb82a96f4c3e12e723a3515`
Shown target SHA256: `50edabfda6bf370c6006423e5f3e0ab48c8240547cc647d39c80136e0580ab04`

````text
## 4. Required Plan Traceability

Every implementation plan that narrows this area's vision must include:

1. an intent traceability table;
2. a must-not-preclude check for every touched preserved intent;
3. evidence or an explicit gap for every status change;
4. a phase-closing deferral audit.
````

````diff

````
## source-decision claim_48e0f411f0c1c9eb5caa5b51a6a4bdec

Decision:

````json
{
  "claimId": "claim_48e0f411f0c1c9eb5caa5b51a6a4bdec",
  "sourceUnitDigest": "1ec856e51adfd7afd16e1276f98f86346095f5c6f85985d21aa00d520a087680",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "1ec856e51adfd7afd16e1276f98f86346095f5c6f85985d21aa00d520a087680",
  "targetAncestry": [
    "<Area> Intent Preservation Ledger",
    "4. Required Plan Traceability"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#unheaded-block-4 to docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-4. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#unheaded-block-4`
Source unit SHA256: `1ec856e51adfd7afd16e1276f98f86346095f5c6f85985d21aa00d520a087680`
Shown source SHA256: `1ec856e51adfd7afd16e1276f98f86346095f5c6f85985d21aa00d520a087680`

````text
Every implementation plan that narrows this area's vision must include:
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-4`
Target unit SHA256: `1ec856e51adfd7afd16e1276f98f86346095f5c6f85985d21aa00d520a087680`
Shown target SHA256: `1ec856e51adfd7afd16e1276f98f86346095f5c6f85985d21aa00d520a087680`

````text
Every implementation plan that narrows this area's vision must include:
````

````diff

````
## source-decision claim_22bb5339f29356ff5f865bec08343d63

Decision:

````json
{
  "claimId": "claim_22bb5339f29356ff5f865bec08343d63",
  "sourceUnitDigest": "8fc064b9ff9996fc5fefcdcdc3586a9668625806a5f2e242fd98a2f01cfba1bc",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "8fc064b9ff9996fc5fefcdcdc3586a9668625806a5f2e242fd98a2f01cfba1bc",
  "targetAncestry": [
    "<Area> Intent Preservation Ledger",
    "4. Required Plan Traceability"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#unheaded-block-5 to docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-5. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#unheaded-block-5`
Source unit SHA256: `8fc064b9ff9996fc5fefcdcdc3586a9668625806a5f2e242fd98a2f01cfba1bc`
Shown source SHA256: `8fc064b9ff9996fc5fefcdcdc3586a9668625806a5f2e242fd98a2f01cfba1bc`

````text
1. an intent traceability table;
2. a must-not-preclude check for every touched preserved intent;
3. evidence or an explicit gap for every status change;
4. a phase-closing deferral audit.
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-5`
Target unit SHA256: `8fc064b9ff9996fc5fefcdcdc3586a9668625806a5f2e242fd98a2f01cfba1bc`
Shown target SHA256: `8fc064b9ff9996fc5fefcdcdc3586a9668625806a5f2e242fd98a2f01cfba1bc`

````text
1. an intent traceability table;
2. a must-not-preclude check for every touched preserved intent;
3. evidence or an explicit gap for every status change;
4. a phase-closing deferral audit.
````

````diff

````
## source-decision claim_2459fb56922616d86e3780da3cf4dd19

Decision:

````json
{
  "claimId": "claim_2459fb56922616d86e3780da3cf4dd19",
  "sourceUnitDigest": "284ebc2fd3544061f8c3a25217a69ba7386305466ba010a3badb48f8be27bee1",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "5-related-files",
  "targetUnitDigest": "23c70f4ba4670ccfb52b3a60b84ec064fbd2dff6aa7ceb2140f01f6396eb379a",
  "targetAncestry": [
    "<Area> Intent Preservation Ledger"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#5-related-files to docs/platform/documentation/history/templates/intent-preservation-ledger.md#5-related-files. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#5-related-files`
Source unit SHA256: `284ebc2fd3544061f8c3a25217a69ba7386305466ba010a3badb48f8be27bee1`
Shown source SHA256: `af16ab885686112e2304e0d77fed93820135205d08386a6fad64b9065b58bceb`

````text
## 5. Related Files

| Relationship | File |
|---|---|
| area vision | [vision.md](vision.md) |
| current behavior | [spec.md](spec.md) |
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#5-related-files`
Target unit SHA256: `23c70f4ba4670ccfb52b3a60b84ec064fbd2dff6aa7ceb2140f01f6396eb379a`
Shown target SHA256: `ee202134c23bcfde1faaadcf6b900e214998fbfdac04be2b49092bc215c446e3`

````text
## 5. Related Files

```markdown
| Relationship | File |
|---|---|
| area vision | [vision.md](vision.md) |
| current behavior | [spec.md](spec.md) |
```
````

````diff
--- docs/templates/intent-preservation-ledger.md
+++ docs/platform/documentation/history/templates/intent-preservation-ledger.md
@@ -2,0 +3 @@
+```markdown
@@ -6 +7,2 @@
-| current behavior | [spec.md](spec.md) |+| current behavior | [spec.md](spec.md) |
+```
````
## source-decision claim_d660efa6e2427772ae44971c30e68a4b

Decision:

````json
{
  "claimId": "claim_d660efa6e2427772ae44971c30e68a4b",
  "sourceUnitDigest": "c76ccfd8fd32f42418fc5b9e9f7f69333c4d3c2af3023da9e3624abd6de61e9d",
  "targetOwner": "docs/platform/documentation/history/templates/intent-preservation-ledger.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "006fe41a2ca6f5f4542ce6405cde297810d9d44cd354bfacdc86fa527f7d87fa",
  "targetAncestry": [
    "<Area> Intent Preservation Ledger",
    "5. Related Files"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/intent-preservation-ledger.md#unheaded-block-6 to docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-6. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/intent-preservation-ledger.md#unheaded-block-6`
Source unit SHA256: `c76ccfd8fd32f42418fc5b9e9f7f69333c4d3c2af3023da9e3624abd6de61e9d`
Shown source SHA256: `c76ccfd8fd32f42418fc5b9e9f7f69333c4d3c2af3023da9e3624abd6de61e9d`

````text
| Relationship | File |
|---|---|
| area vision | [vision.md](vision.md) |
| current behavior | [spec.md](spec.md) |
````

Target: `docs/platform/documentation/history/templates/intent-preservation-ledger.md#unheaded-block-6`
Target unit SHA256: `006fe41a2ca6f5f4542ce6405cde297810d9d44cd354bfacdc86fa527f7d87fa`
Shown target SHA256: `006fe41a2ca6f5f4542ce6405cde297810d9d44cd354bfacdc86fa527f7d87fa`

````text
```markdown
| Relationship | File |
|---|---|
| area vision | [vision.md](vision.md) |
| current behavior | [spec.md](spec.md) |
```
````

````diff
--- docs/templates/intent-preservation-ledger.md
+++ docs/platform/documentation/history/templates/intent-preservation-ledger.md
@@ -0,0 +1 @@
+```markdown
@@ -4 +5,2 @@
-| current behavior | [spec.md](spec.md) |+| current behavior | [spec.md](spec.md) |
+```
````
## source-decision claim_ae24b8746d2322b51336a3964ffd6670

Decision:

````json
{
  "claimId": "claim_ae24b8746d2322b51336a3964ffd6670",
  "sourceUnitDigest": "97a026961d6ec441cabdc39a35d8cf913bb6a21da3717df6a20017ae5f34fdef",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "spec",
  "targetUnitDigest": "07f6b58d8d8a0f36c9bffc505d126926a1dcc347c2e8dbb0b53481cd2d3c44d1",
  "targetAncestry": [],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#spec to docs/platform/documentation/history/templates/spec.md#spec. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#spec`
Source unit SHA256: `97a026961d6ec441cabdc39a35d8cf913bb6a21da3717df6a20017ae5f34fdef`
Shown source SHA256: `05120e98762fdd2c826042d4c0123569744a54e1f9ff449f838f8d5922d1ebf4`

````text
# Spec: <Area Name>

```txt
Document type: Spec
Audience: Human reviewer, implementer, agent
Purpose: Describe current behavior/state/reference for <area>
Design status: Draft
Implementation: N/A
Provenance: Human + agent curated
Writer type: Human + agent coauthor
Canonical for: Current behavior/state of <area>
Use this when: You need to implement, verify, maintain, or preserve current behavior
Do not use this for: Design alternatives, long rationale, or historical discussion
Last reviewed: YYYY-MM-DD
Related:
- `README.md`
```
````

Target: `docs/platform/documentation/history/templates/spec.md#spec`
Target unit SHA256: `07f6b58d8d8a0f36c9bffc505d126926a1dcc347c2e8dbb0b53481cd2d3c44d1`
Shown target SHA256: `acba866911908dcb42f7b59094da736308593224042a15be6ee6c3123a1ebbf3`

````text
# Spec: <Area Name>

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/templates/spec.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/templates/spec.md
Supersedes: None; candidate only
Superseded by: None
```
````

````diff
--- docs/templates/spec.md
+++ docs/platform/documentation/history/templates/spec.md
@@ -4,11 +4,12 @@
-Document type: Spec
-Audience: Human reviewer, implementer, agent
-Purpose: Describe current behavior/state/reference for <area>
-Design status: Draft
-Implementation: N/A
-Provenance: Human + agent curated
-Writer type: Human + agent coauthor
-Canonical for: Current behavior/state of <area>
-Use this when: You need to implement, verify, maintain, or preserve current behavior
-Do not use this for: Design alternatives, long rationale, or historical discussion
-Last reviewed: YYYY-MM-DD
+Document type: History
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/templates/spec.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
@@ -16 +17,3 @@
-- `README.md`
+- docs/templates/spec.md
+Supersedes: None; candidate only
+Superseded by: None
````
## source-decision claim_a45257049fe00947d73007e74910b25d

Decision:

````json
{
  "claimId": "claim_a45257049fe00947d73007e74910b25d",
  "sourceUnitDigest": "b12843d3353fb5116ebfea73d40c8a46d55481f09ca87e08adb0c39b6e15b034",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "8947bb1d4e377fbf27c877cee74d0b26b66b7bea8f7756742aadeedd4366f7ee",
  "targetAncestry": [
    "Spec: <Area Name>",
    "Source Metadata (Added in candidate)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#unheaded-block-1 to docs/platform/documentation/history/templates/spec.md#unheaded-block-6. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Original metadata is retained verbatim under Source Metadata (Added in candidate), separate from the candidate authority header. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#unheaded-block-1`
Source unit SHA256: `b12843d3353fb5116ebfea73d40c8a46d55481f09ca87e08adb0c39b6e15b034`
Shown source SHA256: `b12843d3353fb5116ebfea73d40c8a46d55481f09ca87e08adb0c39b6e15b034`

````text
```txt
Document type: Spec
Audience: Human reviewer, implementer, agent
Purpose: Describe current behavior/state/reference for <area>
Design status: Draft
Implementation: N/A
Provenance: Human + agent curated
Writer type: Human + agent coauthor
Canonical for: Current behavior/state of <area>
Use this when: You need to implement, verify, maintain, or preserve current behavior
Do not use this for: Design alternatives, long rationale, or historical discussion
Last reviewed: YYYY-MM-DD
Related:
- `README.md`
```
````

Target: `docs/platform/documentation/history/templates/spec.md#unheaded-block-6`
Target unit SHA256: `8947bb1d4e377fbf27c877cee74d0b26b66b7bea8f7756742aadeedd4366f7ee`
Shown target SHA256: `8947bb1d4e377fbf27c877cee74d0b26b66b7bea8f7756742aadeedd4366f7ee`

`````text
````text
```txt
Document type: Spec
Audience: Human reviewer, implementer, agent
Purpose: Describe current behavior/state/reference for <area>
Design status: Draft
Implementation: N/A
Provenance: Human + agent curated
Writer type: Human + agent coauthor
Canonical for: Current behavior/state of <area>
Use this when: You need to implement, verify, maintain, or preserve current behavior
Do not use this for: Design alternatives, long rationale, or historical discussion
Last reviewed: YYYY-MM-DD
Related:
- `README.md`
```
````
`````

`````diff
--- docs/templates/spec.md
+++ docs/platform/documentation/history/templates/spec.md
@@ -0,0 +1 @@
+````text
@@ -15 +16,2 @@
-```+```
+````
`````
## source-decision claim_e8ad412db9d0a5f0df0fc2fef6b7ad0b

Decision:

````json
{
  "claimId": "claim_e8ad412db9d0a5f0df0fc2fef6b7ad0b",
  "sourceUnitDigest": "b4f4ae113f2bb06b797cf4343fc31eace2b66fcd98070172f36877405f9df170",
  "targetOwner": "docs/platform/documentation/history/templates/discussion.md",
  "targetAnchor": "1-current-summary",
  "targetUnitDigest": "b4f4ae113f2bb06b797cf4343fc31eace2b66fcd98070172f36877405f9df170",
  "targetAncestry": [
    "<Topic> Discussion"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "The whole empty template heading is byte-identical to claim_630c884a95a84ad5eea22c035638f83e; one shared history owner docs/platform/documentation/history/templates/discussion.md#1-current-summary conserves both units under the identical-unit rule. The full former template remains independently preserved at its mapped history path, including this empty heading. No behavioral assertion, truth certification or source retirement. Both source decisions stay pending."
}
````

Source: `docs/templates/spec.md#1-current-summary`
Source unit SHA256: `b4f4ae113f2bb06b797cf4343fc31eace2b66fcd98070172f36877405f9df170`
Shown source SHA256: `8a8c8caeb0c74d79e39d3263c288acc22c451f971b366c6822ebec5a5ad5effe`

````text
## 1. Current Summary
````

Target: `docs/platform/documentation/history/templates/discussion.md#1-current-summary`
Target unit SHA256: `b4f4ae113f2bb06b797cf4343fc31eace2b66fcd98070172f36877405f9df170`
Shown target SHA256: `8a8c8caeb0c74d79e39d3263c288acc22c451f971b366c6822ebec5a5ad5effe`

````text
## 1. Current Summary
````

````diff

````
## source-decision claim_6b69104f02ec6acc77ff79b6bfdb3f25

Decision:

````json
{
  "claimId": "claim_6b69104f02ec6acc77ff79b6bfdb3f25",
  "sourceUnitDigest": "43a28a72bbe42824092ee996a42568f03088e4083b49705cca8ef601992e46f1",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "2-scope",
  "targetUnitDigest": "43a28a72bbe42824092ee996a42568f03088e4083b49705cca8ef601992e46f1",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#2-scope to docs/platform/documentation/history/templates/spec.md#2-scope. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#2-scope`
Source unit SHA256: `43a28a72bbe42824092ee996a42568f03088e4083b49705cca8ef601992e46f1`
Shown source SHA256: `5458fc0c87b9fd573ceb5c58360f3b059cd438154b29666cb838c7b5bfea55c0`

````text
## 2. Scope
````

Target: `docs/platform/documentation/history/templates/spec.md#2-scope`
Target unit SHA256: `43a28a72bbe42824092ee996a42568f03088e4083b49705cca8ef601992e46f1`
Shown target SHA256: `5458fc0c87b9fd573ceb5c58360f3b059cd438154b29666cb838c7b5bfea55c0`

````text
## 2. Scope
````

````diff

````
## source-decision claim_85864e088f7eb72366a2044548466c80

Decision:

````json
{
  "claimId": "claim_85864e088f7eb72366a2044548466c80",
  "sourceUnitDigest": "6577d48407f347445e200ebb59673b01e566050e776d1e9e4742c16bff06b752",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "3-entry-points-and-triggers",
  "targetUnitDigest": "6577d48407f347445e200ebb59673b01e566050e776d1e9e4742c16bff06b752",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#3-entry-points-and-triggers to docs/platform/documentation/history/templates/spec.md#3-entry-points-and-triggers. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#3-entry-points-and-triggers`
Source unit SHA256: `6577d48407f347445e200ebb59673b01e566050e776d1e9e4742c16bff06b752`
Shown source SHA256: `e4318f6d4a08b6abc4e686ab161d2f905e762d89eca492de4ba97f75926e6028`

````text
## 3. Entry Points And Triggers
````

Target: `docs/platform/documentation/history/templates/spec.md#3-entry-points-and-triggers`
Target unit SHA256: `6577d48407f347445e200ebb59673b01e566050e776d1e9e4742c16bff06b752`
Shown target SHA256: `e4318f6d4a08b6abc4e686ab161d2f905e762d89eca492de4ba97f75926e6028`

````text
## 3. Entry Points And Triggers
````

````diff

````
## source-decision claim_7372546a17410211cf3b35ccbf2b7128

Decision:

````json
{
  "claimId": "claim_7372546a17410211cf3b35ccbf2b7128",
  "sourceUnitDigest": "7f1b91e6873f41aebab881cbc14a33f1acccdd975425dd4e3fe9c46875740d00",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "4-actors-and-access",
  "targetUnitDigest": "7f1b91e6873f41aebab881cbc14a33f1acccdd975425dd4e3fe9c46875740d00",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#4-actors-and-access to docs/platform/documentation/history/templates/spec.md#4-actors-and-access. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#4-actors-and-access`
Source unit SHA256: `7f1b91e6873f41aebab881cbc14a33f1acccdd975425dd4e3fe9c46875740d00`
Shown source SHA256: `4a60e545c2d5b20f52200001adafcdf41a660d114fcbb54a1120f94a34857d23`

````text
## 4. Actors And Access
````

Target: `docs/platform/documentation/history/templates/spec.md#4-actors-and-access`
Target unit SHA256: `7f1b91e6873f41aebab881cbc14a33f1acccdd975425dd4e3fe9c46875740d00`
Shown target SHA256: `4a60e545c2d5b20f52200001adafcdf41a660d114fcbb54a1120f94a34857d23`

````text
## 4. Actors And Access
````

````diff

````
## source-decision claim_339d29403333adfe79f03f041551387a

Decision:

````json
{
  "claimId": "claim_339d29403333adfe79f03f041551387a",
  "sourceUnitDigest": "32f3490c63a31c25751e857be987576c42363bd61e65922fad4943aa0277738c",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "5-data-concepts",
  "targetUnitDigest": "32f3490c63a31c25751e857be987576c42363bd61e65922fad4943aa0277738c",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#5-data-concepts to docs/platform/documentation/history/templates/spec.md#5-data-concepts. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#5-data-concepts`
Source unit SHA256: `32f3490c63a31c25751e857be987576c42363bd61e65922fad4943aa0277738c`
Shown source SHA256: `7827c77ff1ef0a23121c280eecf026935e24325510593aa58ca6de3d4b1fba3e`

````text
## 5. Data / Concepts
````

Target: `docs/platform/documentation/history/templates/spec.md#5-data-concepts`
Target unit SHA256: `32f3490c63a31c25751e857be987576c42363bd61e65922fad4943aa0277738c`
Shown target SHA256: `7827c77ff1ef0a23121c280eecf026935e24325510593aa58ca6de3d4b1fba3e`

````text
## 5. Data / Concepts
````

````diff

````
## source-decision claim_70028f5aa4c6ad5558adc036ee45d9a0

Decision:

````json
{
  "claimId": "claim_70028f5aa4c6ad5558adc036ee45d9a0",
  "sourceUnitDigest": "9de713b7aefba8ff9c96f4a1ae455e4ed52168c3d0941b4adf7aa1ef2a9c7fa2",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "6-behaviors-and-operations",
  "targetUnitDigest": "9de713b7aefba8ff9c96f4a1ae455e4ed52168c3d0941b4adf7aa1ef2a9c7fa2",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#6-behaviors-and-operations to docs/platform/documentation/history/templates/spec.md#6-behaviors-and-operations. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#6-behaviors-and-operations`
Source unit SHA256: `9de713b7aefba8ff9c96f4a1ae455e4ed52168c3d0941b4adf7aa1ef2a9c7fa2`
Shown source SHA256: `eda6ca0a7a7701de00588fe591529c0b608a2f37b6e4146990f1e5f9c89f94f1`

````text
## 6. Behaviors And Operations

For each operation, prefer this shape:

```txt
Runs when:
Blocked when:
What changes:
Afterwards / side effects:
```
````

Target: `docs/platform/documentation/history/templates/spec.md#6-behaviors-and-operations`
Target unit SHA256: `9de713b7aefba8ff9c96f4a1ae455e4ed52168c3d0941b4adf7aa1ef2a9c7fa2`
Shown target SHA256: `eda6ca0a7a7701de00588fe591529c0b608a2f37b6e4146990f1e5f9c89f94f1`

````text
## 6. Behaviors And Operations

For each operation, prefer this shape:

```txt
Runs when:
Blocked when:
What changes:
Afterwards / side effects:
```
````

````diff

````
## source-decision claim_de75118d33ad4375275fb4c8756e8090

Decision:

````json
{
  "claimId": "claim_de75118d33ad4375275fb4c8756e8090",
  "sourceUnitDigest": "149229705b7b31edf864d727c61cd87f3188caf0f7594950d292c447bfe017cc",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "149229705b7b31edf864d727c61cd87f3188caf0f7594950d292c447bfe017cc",
  "targetAncestry": [
    "Spec: <Area Name>",
    "6. Behaviors And Operations"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#unheaded-block-2 to docs/platform/documentation/history/templates/spec.md#unheaded-block-2. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#unheaded-block-2`
Source unit SHA256: `149229705b7b31edf864d727c61cd87f3188caf0f7594950d292c447bfe017cc`
Shown source SHA256: `149229705b7b31edf864d727c61cd87f3188caf0f7594950d292c447bfe017cc`

````text
For each operation, prefer this shape:
````

Target: `docs/platform/documentation/history/templates/spec.md#unheaded-block-2`
Target unit SHA256: `149229705b7b31edf864d727c61cd87f3188caf0f7594950d292c447bfe017cc`
Shown target SHA256: `149229705b7b31edf864d727c61cd87f3188caf0f7594950d292c447bfe017cc`

````text
For each operation, prefer this shape:
````

````diff

````
## source-decision claim_7986021956540a45414a393ca74043f6

Decision:

````json
{
  "claimId": "claim_7986021956540a45414a393ca74043f6",
  "sourceUnitDigest": "ec5e1994db51e1b2b68867891ee2e2aa032d1a1d24ff7dab1967e01d8d41298a",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "unheaded-block-3",
  "targetUnitDigest": "ec5e1994db51e1b2b68867891ee2e2aa032d1a1d24ff7dab1967e01d8d41298a",
  "targetAncestry": [
    "Spec: <Area Name>",
    "6. Behaviors And Operations"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#unheaded-block-3 to docs/platform/documentation/history/templates/spec.md#unheaded-block-3. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#unheaded-block-3`
Source unit SHA256: `ec5e1994db51e1b2b68867891ee2e2aa032d1a1d24ff7dab1967e01d8d41298a`
Shown source SHA256: `ec5e1994db51e1b2b68867891ee2e2aa032d1a1d24ff7dab1967e01d8d41298a`

````text
```txt
Runs when:
Blocked when:
What changes:
Afterwards / side effects:
```
````

Target: `docs/platform/documentation/history/templates/spec.md#unheaded-block-3`
Target unit SHA256: `ec5e1994db51e1b2b68867891ee2e2aa032d1a1d24ff7dab1967e01d8d41298a`
Shown target SHA256: `ec5e1994db51e1b2b68867891ee2e2aa032d1a1d24ff7dab1967e01d8d41298a`

````text
```txt
Runs when:
Blocked when:
What changes:
Afterwards / side effects:
```
````

````diff

````
## source-decision claim_b7b51142eaf0ed740e342d67c09d2b4e

Decision:

````json
{
  "claimId": "claim_b7b51142eaf0ed740e342d67c09d2b4e",
  "sourceUnitDigest": "4e4ae74745d753cb21c6359d30de9d46a1743456e833bf69532fcab840f6bd1c",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "7-rules-and-invariants",
  "targetUnitDigest": "4e4ae74745d753cb21c6359d30de9d46a1743456e833bf69532fcab840f6bd1c",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#7-rules-and-invariants to docs/platform/documentation/history/templates/spec.md#7-rules-and-invariants. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#7-rules-and-invariants`
Source unit SHA256: `4e4ae74745d753cb21c6359d30de9d46a1743456e833bf69532fcab840f6bd1c`
Shown source SHA256: `5cce6d5475484ef362e8973a8f22c72583e210b8f14245adc189d13ee546ce6f`

````text
## 7. Rules And Invariants
````

Target: `docs/platform/documentation/history/templates/spec.md#7-rules-and-invariants`
Target unit SHA256: `4e4ae74745d753cb21c6359d30de9d46a1743456e833bf69532fcab840f6bd1c`
Shown target SHA256: `5cce6d5475484ef362e8973a8f22c72583e210b8f14245adc189d13ee546ce6f`

````text
## 7. Rules And Invariants
````

````diff

````
## source-decision claim_ef20b9eef53017a3399efa9ce1e24dc3

Decision:

````json
{
  "claimId": "claim_ef20b9eef53017a3399efa9ce1e24dc3",
  "sourceUnitDigest": "0b5d9f3b00854f6c3fe460be1d9eeb7a7fb9c1b274f0c75487158fdd5d668850",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "8-contracts-owned",
  "targetUnitDigest": "0b5d9f3b00854f6c3fe460be1d9eeb7a7fb9c1b274f0c75487158fdd5d668850",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#8-contracts-owned to docs/platform/documentation/history/templates/spec.md#8-contracts-owned. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#8-contracts-owned`
Source unit SHA256: `0b5d9f3b00854f6c3fe460be1d9eeb7a7fb9c1b274f0c75487158fdd5d668850`
Shown source SHA256: `bffb100e83ea4959b51274e84aeb5acc7d48809e78c4b0bfec1f3e3bdb1264db`

````text
## 8. Contracts Owned
````

Target: `docs/platform/documentation/history/templates/spec.md#8-contracts-owned`
Target unit SHA256: `0b5d9f3b00854f6c3fe460be1d9eeb7a7fb9c1b274f0c75487158fdd5d668850`
Shown target SHA256: `bffb100e83ea4959b51274e84aeb5acc7d48809e78c4b0bfec1f3e3bdb1264db`

````text
## 8. Contracts Owned
````

````diff

````
## source-decision claim_5d2966325bfa91d2aece7d2af6aac890

Decision:

````json
{
  "claimId": "claim_5d2966325bfa91d2aece7d2af6aac890",
  "sourceUnitDigest": "aa139e7f29d4cc10aa6f2552a16142d2f46c1ba5a066b6a806283a33ab260646",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "9-contracts-consumed",
  "targetUnitDigest": "aa139e7f29d4cc10aa6f2552a16142d2f46c1ba5a066b6a806283a33ab260646",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#9-contracts-consumed to docs/platform/documentation/history/templates/spec.md#9-contracts-consumed. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#9-contracts-consumed`
Source unit SHA256: `aa139e7f29d4cc10aa6f2552a16142d2f46c1ba5a066b6a806283a33ab260646`
Shown source SHA256: `3d751d4cab13393fceb2f1aa16a2c84cf9b90429354424fd398f6db1d2cfa62a`

````text
## 9. Contracts Consumed
````

Target: `docs/platform/documentation/history/templates/spec.md#9-contracts-consumed`
Target unit SHA256: `aa139e7f29d4cc10aa6f2552a16142d2f46c1ba5a066b6a806283a33ab260646`
Shown target SHA256: `3d751d4cab13393fceb2f1aa16a2c84cf9b90429354424fd398f6db1d2cfa62a`

````text
## 9. Contracts Consumed
````

````diff

````
## source-decision claim_02e6e6be57caed3e7e38d7d74289abe4

Decision:

````json
{
  "claimId": "claim_02e6e6be57caed3e7e38d7d74289abe4",
  "sourceUnitDigest": "280469ab6a1d0054b93fc94a938e649ab2193e360c25733c0d8ed916e06d65e3",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "10-edge-cases-settled",
  "targetUnitDigest": "280469ab6a1d0054b93fc94a938e649ab2193e360c25733c0d8ed916e06d65e3",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#10-edge-cases-settled to docs/platform/documentation/history/templates/spec.md#10-edge-cases-settled. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#10-edge-cases-settled`
Source unit SHA256: `280469ab6a1d0054b93fc94a938e649ab2193e360c25733c0d8ed916e06d65e3`
Shown source SHA256: `9197604d452d015a6fe898ade79a70d9339f814b7efd9b83a97cef6258c28024`

````text
## 10. Edge Cases Settled
````

Target: `docs/platform/documentation/history/templates/spec.md#10-edge-cases-settled`
Target unit SHA256: `280469ab6a1d0054b93fc94a938e649ab2193e360c25733c0d8ed916e06d65e3`
Shown target SHA256: `9197604d452d015a6fe898ade79a70d9339f814b7efd9b83a97cef6258c28024`

````text
## 10. Edge Cases Settled
````

````diff

````
## source-decision claim_650112b876998d4cb3aabc8821bd3b3d

Decision:

````json
{
  "claimId": "claim_650112b876998d4cb3aabc8821bd3b3d",
  "sourceUnitDigest": "5f9560316d69a080e5e8df860868ec23968d665633a3886dd18aa956db3c2c81",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "11-open-gaps",
  "targetUnitDigest": "5f9560316d69a080e5e8df860868ec23968d665633a3886dd18aa956db3c2c81",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#11-open-gaps to docs/platform/documentation/history/templates/spec.md#11-open-gaps. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#11-open-gaps`
Source unit SHA256: `5f9560316d69a080e5e8df860868ec23968d665633a3886dd18aa956db3c2c81`
Shown source SHA256: `848734913f1bbe718f260ff2b8896abb36c606abfdd1dd9477ac3ba2c7673fec`

````text
## 11. Open Gaps
````

Target: `docs/platform/documentation/history/templates/spec.md#11-open-gaps`
Target unit SHA256: `5f9560316d69a080e5e8df860868ec23968d665633a3886dd18aa956db3c2c81`
Shown target SHA256: `848734913f1bbe718f260ff2b8896abb36c606abfdd1dd9477ac3ba2c7673fec`

````text
## 11. Open Gaps
````

````diff

````
## source-decision claim_6a6e84ef10e1642a3f82dc4d60846fbf

Decision:

````json
{
  "claimId": "claim_6a6e84ef10e1642a3f82dc4d60846fbf",
  "sourceUnitDigest": "e9fc751b1b7b41defbccc4ceafd53f00bf788928135f1212677bfc5fbf805618",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "12-implementation-alignment",
  "targetUnitDigest": "e9fc751b1b7b41defbccc4ceafd53f00bf788928135f1212677bfc5fbf805618",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#12-implementation-alignment to docs/platform/documentation/history/templates/spec.md#12-implementation-alignment. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#12-implementation-alignment`
Source unit SHA256: `e9fc751b1b7b41defbccc4ceafd53f00bf788928135f1212677bfc5fbf805618`
Shown source SHA256: `8316f72655966066d571ea171e0bdbdc8e6543d4176913c65ae777fa6e66e255`

````text
## 12. Implementation Alignment

| Behavior claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|
| <claim> | implemented / partial / planned / superseded / unknown | <links> | <gap> |
````

Target: `docs/platform/documentation/history/templates/spec.md#12-implementation-alignment`
Target unit SHA256: `e9fc751b1b7b41defbccc4ceafd53f00bf788928135f1212677bfc5fbf805618`
Shown target SHA256: `8316f72655966066d571ea171e0bdbdc8e6543d4176913c65ae777fa6e66e255`

````text
## 12. Implementation Alignment

| Behavior claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|
| <claim> | implemented / partial / planned / superseded / unknown | <links> | <gap> |
````

````diff

````
## source-decision claim_b902d33f6951d2bd4a86d0d166465c5a

Decision:

````json
{
  "claimId": "claim_b902d33f6951d2bd4a86d0d166465c5a",
  "sourceUnitDigest": "0665ddd86e8f74ea7642815fcb3e86b3070d01ca8cc4590ddb4d83d874f9bcc1",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "0665ddd86e8f74ea7642815fcb3e86b3070d01ca8cc4590ddb4d83d874f9bcc1",
  "targetAncestry": [
    "Spec: <Area Name>",
    "12. Implementation Alignment"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#unheaded-block-4 to docs/platform/documentation/history/templates/spec.md#unheaded-block-4. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#unheaded-block-4`
Source unit SHA256: `0665ddd86e8f74ea7642815fcb3e86b3070d01ca8cc4590ddb4d83d874f9bcc1`
Shown source SHA256: `0665ddd86e8f74ea7642815fcb3e86b3070d01ca8cc4590ddb4d83d874f9bcc1`

````text
| Behavior claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|
| <claim> | implemented / partial / planned / superseded / unknown | <links> | <gap> |
````

Target: `docs/platform/documentation/history/templates/spec.md#unheaded-block-4`
Target unit SHA256: `0665ddd86e8f74ea7642815fcb3e86b3070d01ca8cc4590ddb4d83d874f9bcc1`
Shown target SHA256: `0665ddd86e8f74ea7642815fcb3e86b3070d01ca8cc4590ddb4d83d874f9bcc1`

````text
| Behavior claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|
| <claim> | implemented / partial / planned / superseded / unknown | <links> | <gap> |
````

````diff

````
## source-decision claim_2664791a3d04752b151ecf669a79f9e6

Decision:

````json
{
  "claimId": "claim_2664791a3d04752b151ecf669a79f9e6",
  "sourceUnitDigest": "6272fadd8b7c0b0f9c25de4c23bc9e359f4c07f799b46b286805bda02f6b32c6",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "13-verification",
  "targetUnitDigest": "6272fadd8b7c0b0f9c25de4c23bc9e359f4c07f799b46b286805bda02f6b32c6",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#13-verification to docs/platform/documentation/history/templates/spec.md#13-verification. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#13-verification`
Source unit SHA256: `6272fadd8b7c0b0f9c25de4c23bc9e359f4c07f799b46b286805bda02f6b32c6`
Shown source SHA256: `a22c3798a54b1a8dfc42adb928f5ffa64b64ec6ac0eb30b557119890657fac73`

````text
## 13. Verification
````

Target: `docs/platform/documentation/history/templates/spec.md#13-verification`
Target unit SHA256: `6272fadd8b7c0b0f9c25de4c23bc9e359f4c07f799b46b286805bda02f6b32c6`
Shown target SHA256: `a22c3798a54b1a8dfc42adb928f5ffa64b64ec6ac0eb30b557119890657fac73`

````text
## 13. Verification
````

````diff

````
## source-decision claim_d1cc054c7b4e3e345619fd3da1af5adc

Decision:

````json
{
  "claimId": "claim_d1cc054c7b4e3e345619fd3da1af5adc",
  "sourceUnitDigest": "8b13592b1a1fabb0dfeb669e3f06bb805358e7c10f750a73a8b02fc433dff4fa",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "14-related-files",
  "targetUnitDigest": "74b2a72fe67db248940a1cdc955fcf8c273ab4bae71d834fb103d97bb81dd9ee",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#14-related-files to docs/platform/documentation/history/templates/spec.md#14-related-files. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#14-related-files`
Source unit SHA256: `8b13592b1a1fabb0dfeb669e3f06bb805358e7c10f750a73a8b02fc433dff4fa`
Shown source SHA256: `a020930f0d9deff4374c432bb9c484a65683e0d68801aec369c88b6663e47207`

````text
## 14. Related Files

| Relationship | File |
|---|---|
| area portal | [README.md](README.md) |
| design rationale | [architecture/](architecture/) |
| owned contracts | [contracts/](contracts/) |
| verification evidence | [verification/](verification/) |
````

Target: `docs/platform/documentation/history/templates/spec.md#14-related-files`
Target unit SHA256: `74b2a72fe67db248940a1cdc955fcf8c273ab4bae71d834fb103d97bb81dd9ee`
Shown target SHA256: `9173c497af465b0c2576e6073cd699f1d0d6359a4af706a2e0cb1fc3d2cd16cc`

````text
## 14. Related Files

```markdown
| Relationship | File |
|---|---|
| area portal | [README.md](README.md) |
| design rationale | [architecture/](architecture/) |
| owned contracts | [contracts/](contracts/) |
| verification evidence | [verification/](verification/) |
```
````

````diff
--- docs/templates/spec.md
+++ docs/platform/documentation/history/templates/spec.md
@@ -2,0 +3 @@
+```markdown
@@ -8 +9,2 @@
-| verification evidence | [verification/](verification/) |+| verification evidence | [verification/](verification/) |
+```
````
## source-decision claim_d6482c62c40b1d86ce2953a4fd074c0e

Decision:

````json
{
  "claimId": "claim_d6482c62c40b1d86ce2953a4fd074c0e",
  "sourceUnitDigest": "c51828ec79bcb07e97fa714d944361dd73f6d28b1832d6b748cb4ecda1adbc40",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "094f99814a34c9e13a8f1f9397d84e0ca6bddf0258f2fcc535fa1938519e068d",
  "targetAncestry": [
    "Spec: <Area Name>",
    "14. Related Files"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#unheaded-block-5 to docs/platform/documentation/history/templates/spec.md#unheaded-block-5. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#unheaded-block-5`
Source unit SHA256: `c51828ec79bcb07e97fa714d944361dd73f6d28b1832d6b748cb4ecda1adbc40`
Shown source SHA256: `c51828ec79bcb07e97fa714d944361dd73f6d28b1832d6b748cb4ecda1adbc40`

````text
| Relationship | File |
|---|---|
| area portal | [README.md](README.md) |
| design rationale | [architecture/](architecture/) |
| owned contracts | [contracts/](contracts/) |
| verification evidence | [verification/](verification/) |
````

Target: `docs/platform/documentation/history/templates/spec.md#unheaded-block-5`
Target unit SHA256: `094f99814a34c9e13a8f1f9397d84e0ca6bddf0258f2fcc535fa1938519e068d`
Shown target SHA256: `094f99814a34c9e13a8f1f9397d84e0ca6bddf0258f2fcc535fa1938519e068d`

````text
```markdown
| Relationship | File |
|---|---|
| area portal | [README.md](README.md) |
| design rationale | [architecture/](architecture/) |
| owned contracts | [contracts/](contracts/) |
| verification evidence | [verification/](verification/) |
```
````

````diff
--- docs/templates/spec.md
+++ docs/platform/documentation/history/templates/spec.md
@@ -0,0 +1 @@
+```markdown
@@ -6 +7,2 @@
-| verification evidence | [verification/](verification/) |+| verification evidence | [verification/](verification/) |
+```
````
## source-decision claim_92432fc7ae23620e94e6f8e1aaefe0ea

Decision:

````json
{
  "claimId": "claim_92432fc7ae23620e94e6f8e1aaefe0ea",
  "sourceUnitDigest": "f702a38e05dadab4af95cf96fe663c8fe2038e80921f7f7c4f2921399f0ae45f",
  "targetOwner": "docs/platform/documentation/history/templates/spec.md",
  "targetAnchor": "15-decision-history-summary",
  "targetUnitDigest": "f702a38e05dadab4af95cf96fe663c8fe2038e80921f7f7c4f2921399f0ae45f",
  "targetAncestry": [
    "Spec: <Area Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/spec.md#15-decision-history-summary to docs/platform/documentation/history/templates/spec.md#15-decision-history-summary. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/spec.md#15-decision-history-summary`
Source unit SHA256: `f702a38e05dadab4af95cf96fe663c8fe2038e80921f7f7c4f2921399f0ae45f`
Shown source SHA256: `a685e657183b3c619650c398158442f69abd431ac560fd89dc23cd74ed270f3a`

````text
## 15. Decision History Summary
````

Target: `docs/platform/documentation/history/templates/spec.md#15-decision-history-summary`
Target unit SHA256: `f702a38e05dadab4af95cf96fe663c8fe2038e80921f7f7c4f2921399f0ae45f`
Shown target SHA256: `a685e657183b3c619650c398158442f69abd431ac560fd89dc23cd74ed270f3a`

````text
## 15. Decision History Summary
````

````diff

````
## source-decision claim_82590e6d9aa64b3691203911b37fabda

Decision:

````json
{
  "claimId": "claim_82590e6d9aa64b3691203911b37fabda",
  "sourceUnitDigest": "e1570959d76c07840b8f0f8075a3cd22459164e9078c0cef2dc84ba2a14ab2c4",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "section",
  "targetUnitDigest": "0013c714868989a666cdfe718f5adac8af28be54ab1ac7906472e91007e02e57",
  "targetAncestry": [],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#section to docs/platform/documentation/history/templates/subcomponent-readme.md#section. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#section`
Source unit SHA256: `e1570959d76c07840b8f0f8075a3cd22459164e9078c0cef2dc84ba2a14ab2c4`
Shown source SHA256: `6142d51f328ed2a50af4761bb8066674128750224d47f901b4dd00cee0b1bfaf`

````text
# <Subcomponent Name>

```txt
Document type: Subcomponent portal
Audience: Human reviewer, architect, implementer, agent
Purpose: Enter this subcomponent, understand local ownership, choose what to read next
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: <subcomponent navigation and local ownership>
Use this when: You need to understand or change <subcomponent>
Do not use this for: Area-wide direction or cross-area authority
Last reviewed: YYYY-MM-DD
Related:
- `../../README.md`
- `spec.md`
```
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#section`
Target unit SHA256: `0013c714868989a666cdfe718f5adac8af28be54ab1ac7906472e91007e02e57`
Shown target SHA256: `45cf64d4d6c6bbaf4713c379fbe29e1789414e1eb5154097ca5e75e8203b5999`

````text
# <Subcomponent Name>

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve the mapped source as candidate material for conservation review
Design status: Candidate
Implementation: Historical source retained; current truth not certified
Provenance: docs/templates/subcomponent-readme.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing conservation of the mapped legacy source
Do not use this for: Current canonical authority or proof of implemented behavior
Last reviewed: 2026-10-14
Related:
- docs/templates/subcomponent-readme.md
Supersedes: None; candidate only
Superseded by: None
```
````

````diff
--- docs/templates/subcomponent-readme.md
+++ docs/platform/documentation/history/templates/subcomponent-readme.md
@@ -4,11 +4,12 @@
-Document type: Subcomponent portal
-Audience: Human reviewer, architect, implementer, agent
-Purpose: Enter this subcomponent, understand local ownership, choose what to read next
-Design status: Draft
-Implementation: N/A
-Provenance: Human + agent coauthor
-Writer type: Human + agent coauthor
-Canonical for: <subcomponent navigation and local ownership>
-Use this when: You need to understand or change <subcomponent>
-Do not use this for: Area-wide direction or cross-area authority
-Last reviewed: YYYY-MM-DD
+Document type: History
+Audience: Documentation migration reviewer, maintainer, agent
+Purpose: Preserve the mapped source as candidate material for conservation review
+Design status: Candidate
+Implementation: Historical source retained; current truth not certified
+Provenance: docs/templates/subcomponent-readme.md at ad2ca83e245bbd76c0d275cc30366457b26c8df3
+Writer type: Agent draft writer
+Canonical: No
+Canonical for: None; candidate only
+Use this when: Reviewing conservation of the mapped legacy source
+Do not use this for: Current canonical authority or proof of implemented behavior
+Last reviewed: 2026-10-14
@@ -16,2 +17,3 @@
-- `../../README.md`
-- `spec.md`
+- docs/templates/subcomponent-readme.md
+Supersedes: None; candidate only
+Superseded by: None
````
## source-decision claim_05dbddd0e1a360b6246e8e752ef7fdff

Decision:

````json
{
  "claimId": "claim_05dbddd0e1a360b6246e8e752ef7fdff",
  "sourceUnitDigest": "724d955e087decd02f52b0a781724fb329e24ad748a149d0ff28b0425ddaa4f9",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "unheaded-block-8",
  "targetUnitDigest": "0f16bf8815f64473ff7698eed8591bf9f2cfbb99beb78611dc3303dd7d4acaa3",
  "targetAncestry": [
    "<Subcomponent Name>",
    "Source Metadata (Added in candidate)"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#unheaded-block-1 to docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-8. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Original metadata is retained verbatim under Source Metadata (Added in candidate), separate from the candidate authority header. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#unheaded-block-1`
Source unit SHA256: `724d955e087decd02f52b0a781724fb329e24ad748a149d0ff28b0425ddaa4f9`
Shown source SHA256: `724d955e087decd02f52b0a781724fb329e24ad748a149d0ff28b0425ddaa4f9`

````text
```txt
Document type: Subcomponent portal
Audience: Human reviewer, architect, implementer, agent
Purpose: Enter this subcomponent, understand local ownership, choose what to read next
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: <subcomponent navigation and local ownership>
Use this when: You need to understand or change <subcomponent>
Do not use this for: Area-wide direction or cross-area authority
Last reviewed: YYYY-MM-DD
Related:
- `../../README.md`
- `spec.md`
```
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-8`
Target unit SHA256: `0f16bf8815f64473ff7698eed8591bf9f2cfbb99beb78611dc3303dd7d4acaa3`
Shown target SHA256: `0f16bf8815f64473ff7698eed8591bf9f2cfbb99beb78611dc3303dd7d4acaa3`

`````text
````text
```txt
Document type: Subcomponent portal
Audience: Human reviewer, architect, implementer, agent
Purpose: Enter this subcomponent, understand local ownership, choose what to read next
Design status: Draft
Implementation: N/A
Provenance: Human + agent coauthor
Writer type: Human + agent coauthor
Canonical for: <subcomponent navigation and local ownership>
Use this when: You need to understand or change <subcomponent>
Do not use this for: Area-wide direction or cross-area authority
Last reviewed: YYYY-MM-DD
Related:
- `../../README.md`
- `spec.md`
```
````
`````

`````diff
--- docs/templates/subcomponent-readme.md
+++ docs/platform/documentation/history/templates/subcomponent-readme.md
@@ -0,0 +1 @@
+````text
@@ -16 +17,2 @@
-```+```
+````
`````
## source-decision claim_9c3ace99f40733edadc187b9a6962f30

Decision:

````json
{
  "claimId": "claim_9c3ace99f40733edadc187b9a6962f30",
  "sourceUnitDigest": "5528493601e5ef29fcc93b69d997c0aec3ecf563797816e77d79bcb6996f1bda",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "1-parent-area",
  "targetUnitDigest": "639a9769444a78bb1558a6978a1af72b670e08dc11add854992078b09bb0ed4c",
  "targetAncestry": [
    "<Subcomponent Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#1-parent-area to docs/platform/documentation/history/templates/subcomponent-readme.md#1-parent-area. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#1-parent-area`
Source unit SHA256: `5528493601e5ef29fcc93b69d997c0aec3ecf563797816e77d79bcb6996f1bda`
Shown source SHA256: `604c26fa8be8021a2b51539b3d880cd0de6f3844a7241e6330567b72d8af12a5`

````text
## 1. Parent Area

| Field | Value |
|---|---|
| Parent area | [../../README.md](../../README.md) |
| Parent spec | [../../spec.md](../../spec.md) |
| Parent intent ledger | [../../intent-preservation-ledger.md](../../intent-preservation-ledger.md) |
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#1-parent-area`
Target unit SHA256: `639a9769444a78bb1558a6978a1af72b670e08dc11add854992078b09bb0ed4c`
Shown target SHA256: `2b72011cf83236eeb5331bea46a6634d37dd7244120f1bb60f01620ef4bc75df`

````text
## 1. Parent Area

```markdown
| Field | Value |
|---|---|
| Parent area | [../../README.md](../../README.md) |
| Parent spec | [../../spec.md](../../spec.md) |
| Parent intent ledger | [../../intent-preservation-ledger.md](../../intent-preservation-ledger.md) |
```
````

````diff
--- docs/templates/subcomponent-readme.md
+++ docs/platform/documentation/history/templates/subcomponent-readme.md
@@ -2,0 +3 @@
+```markdown
@@ -7 +8,2 @@
-| Parent intent ledger | [../../intent-preservation-ledger.md](../../intent-preservation-ledger.md) |+| Parent intent ledger | [../../intent-preservation-ledger.md](../../intent-preservation-ledger.md) |
+```
````
## source-decision claim_d4c900f7715e01d6d486ad14c3023666

Decision:

````json
{
  "claimId": "claim_d4c900f7715e01d6d486ad14c3023666",
  "sourceUnitDigest": "52afa7d87c50531f57c4b99d57eaca863eba028340d1fa3b65792cc514b65863",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "unheaded-block-2",
  "targetUnitDigest": "26378adcbb3d3de832d73f7ff892c5cb23fd72afe557430aee815e2d374d30af",
  "targetAncestry": [
    "<Subcomponent Name>",
    "1. Parent Area"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#unheaded-block-2 to docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-2. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#unheaded-block-2`
Source unit SHA256: `52afa7d87c50531f57c4b99d57eaca863eba028340d1fa3b65792cc514b65863`
Shown source SHA256: `52afa7d87c50531f57c4b99d57eaca863eba028340d1fa3b65792cc514b65863`

````text
| Field | Value |
|---|---|
| Parent area | [../../README.md](../../README.md) |
| Parent spec | [../../spec.md](../../spec.md) |
| Parent intent ledger | [../../intent-preservation-ledger.md](../../intent-preservation-ledger.md) |
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-2`
Target unit SHA256: `26378adcbb3d3de832d73f7ff892c5cb23fd72afe557430aee815e2d374d30af`
Shown target SHA256: `26378adcbb3d3de832d73f7ff892c5cb23fd72afe557430aee815e2d374d30af`

````text
```markdown
| Field | Value |
|---|---|
| Parent area | [../../README.md](../../README.md) |
| Parent spec | [../../spec.md](../../spec.md) |
| Parent intent ledger | [../../intent-preservation-ledger.md](../../intent-preservation-ledger.md) |
```
````

````diff
--- docs/templates/subcomponent-readme.md
+++ docs/platform/documentation/history/templates/subcomponent-readme.md
@@ -0,0 +1 @@
+```markdown
@@ -5 +6,2 @@
-| Parent intent ledger | [../../intent-preservation-ledger.md](../../intent-preservation-ledger.md) |+| Parent intent ledger | [../../intent-preservation-ledger.md](../../intent-preservation-ledger.md) |
+```
````
## source-decision claim_3dc403ae9d9394d0ea1f7efc49635c1f

Decision:

````json
{
  "claimId": "claim_3dc403ae9d9394d0ea1f7efc49635c1f",
  "sourceUnitDigest": "d37ddeb04789fb376c86bf83679c431a68529cbdcdfbb50707de8ee85b04589a",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "2-what-this-subcomponent-owns",
  "targetUnitDigest": "d37ddeb04789fb376c86bf83679c431a68529cbdcdfbb50707de8ee85b04589a",
  "targetAncestry": [
    "<Subcomponent Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#2-what-this-subcomponent-owns to docs/platform/documentation/history/templates/subcomponent-readme.md#2-what-this-subcomponent-owns. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#2-what-this-subcomponent-owns`
Source unit SHA256: `d37ddeb04789fb376c86bf83679c431a68529cbdcdfbb50707de8ee85b04589a`
Shown source SHA256: `57fade43cadd6a737ade317efafb6f0206f4a9c9bf492a28ad75e3f3d30b6381`

````text
## 2. What This Subcomponent Owns
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#2-what-this-subcomponent-owns`
Target unit SHA256: `d37ddeb04789fb376c86bf83679c431a68529cbdcdfbb50707de8ee85b04589a`
Shown target SHA256: `57fade43cadd6a737ade317efafb6f0206f4a9c9bf492a28ad75e3f3d30b6381`

````text
## 2. What This Subcomponent Owns
````

````diff

````
## source-decision claim_596dd9589431832a27a84373fd43dc64

Decision:

````json
{
  "claimId": "claim_596dd9589431832a27a84373fd43dc64",
  "sourceUnitDigest": "a59e045381d64188a92b76b7033c3fd7682f63b04014215c88faad1b8510f810",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "3-what-this-subcomponent-does-not-own",
  "targetUnitDigest": "a59e045381d64188a92b76b7033c3fd7682f63b04014215c88faad1b8510f810",
  "targetAncestry": [
    "<Subcomponent Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#3-what-this-subcomponent-does-not-own to docs/platform/documentation/history/templates/subcomponent-readme.md#3-what-this-subcomponent-does-not-own. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#3-what-this-subcomponent-does-not-own`
Source unit SHA256: `a59e045381d64188a92b76b7033c3fd7682f63b04014215c88faad1b8510f810`
Shown source SHA256: `cf6d0e413c7bd10b808363299ca166a6918cea84bf8a62715250b5f827ef17d3`

````text
## 3. What This Subcomponent Does Not Own
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#3-what-this-subcomponent-does-not-own`
Target unit SHA256: `a59e045381d64188a92b76b7033c3fd7682f63b04014215c88faad1b8510f810`
Shown target SHA256: `cf6d0e413c7bd10b808363299ca166a6918cea84bf8a62715250b5f827ef17d3`

````text
## 3. What This Subcomponent Does Not Own
````

````diff

````
## source-decision claim_9fc806d7ab3f5ed7166aa1e3682e3663

Decision:

````json
{
  "claimId": "claim_9fc806d7ab3f5ed7166aa1e3682e3663",
  "sourceUnitDigest": "51ffd86b7f7ed955a30fa155272b8fb80837472a912212e65432bdf142135d82",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "4-current-shape",
  "targetUnitDigest": "51ffd86b7f7ed955a30fa155272b8fb80837472a912212e65432bdf142135d82",
  "targetAncestry": [
    "<Subcomponent Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#4-current-shape to docs/platform/documentation/history/templates/subcomponent-readme.md#4-current-shape. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Native full unit digests are equal. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#4-current-shape`
Source unit SHA256: `51ffd86b7f7ed955a30fa155272b8fb80837472a912212e65432bdf142135d82`
Shown source SHA256: `2dc100ac6410f9719adbba6f529bb7ea96bf1bf61a411b16643f5a07f97ee18f`

````text
## 4. Current Shape
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#4-current-shape`
Target unit SHA256: `51ffd86b7f7ed955a30fa155272b8fb80837472a912212e65432bdf142135d82`
Shown target SHA256: `2dc100ac6410f9719adbba6f529bb7ea96bf1bf61a411b16643f5a07f97ee18f`

````text
## 4. Current Shape
````

````diff

````
## source-decision claim_be73d40c738edf6c1e59c5cc6b85fbec

Decision:

````json
{
  "claimId": "claim_be73d40c738edf6c1e59c5cc6b85fbec",
  "sourceUnitDigest": "37490c3b6051031027921b98ba5b3c550bd01ca69f4923398da74d62fab6d726",
  "targetOwner": "docs/platform/documentation/history/templates/subcomponent-readme.md",
  "targetAnchor": "5-read-first",
  "targetUnitDigest": "c9064480df1c899a489140e2fff74ae69e6b506f49096038cdb41fe78100e35b",
  "targetAncestry": [
    "<Subcomponent Name>"
  ],
  "claimKind": "historical-context",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:20@2026-10-14",
  "rationale": "Frozen root map assigns docs/templates/subcomponent-readme.md#5-read-first to docs/platform/documentation/history/templates/subcomponent-readme.md#5-read-first. Retain the complete source unit as non-canonical history; the source remains active/retained until cutover. Placeholder link tables are fenced verbatim as examples; every instruction and placeholder is retained. Full source/target text and diff are submitted for independent whole-unit conservation review; wrapping/header/relative-path changes grant no truth approval. No source retirement, promotion or component-boundary change."
}
````

Source: `docs/templates/subcomponent-readme.md#5-read-first`
Source unit SHA256: `37490c3b6051031027921b98ba5b3c550bd01ca69f4923398da74d62fab6d726`
Shown source SHA256: `77c5b77409d6b3b2ebcc25f56f588b28f986492cd09011b43f6c0a7d1402d71d`

````text
## 5. Read First

| Need | Read |
|---|---|
| Current behavior/state | [spec.md](spec.md) |
| Design rationale/boundaries | [architecture/](architecture/) |
| Exact local interfaces/rules | [contracts/](contracts/) |
| Proof/evidence | [verification/](verification/) |
| Historical context | [history/](history/) |
````

Target: `docs/platform/documentation/history/templates/subcomponent-readme.md#5-read-first`
Target unit SHA256: `c9064480df1c899a489140e2fff74ae69e6b506f49096038cdb41fe78100e35b`
Shown target SHA256: `9cba213616fde18e0a890775a7f3a7d6827d13e2c0d4497e02197acb777fe42e`

````text
## 5. Read First

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
@@ -2,0 +3 @@
+```markdown
@@ -9 +10,2 @@
-| Historical context | [history/](history/) |+| Historical context | [history/](history/) |
+```
````
