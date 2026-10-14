# Root conservation rework: seven rows

Content commit: 7833bb4c11125394ea5482fdc781ccd1cf8e4e1d
Author session: codex-session:18@2026-10-14

## claim_049328a09ba2129e3fcf91723d32a4e2

````json
{
  "claimId": "claim_049328a09ba2129e3fcf91723d32a4e2",
  "sourceUnitDigest": "f4b2fe939e035e0720bfed27c889b6a74904d570b8e1bf8860cbef0115ef9afb",
  "targetOwner": "docs/platform/governance.md",
  "targetAnchor": "13-migration-rule",
  "targetUnitDigest": "c75402a1584a65fe82b7c8343d1694feb1ac4af353095ac1e3a7c46356d01100",
  "targetAncestry": [
    "Documentation Governance"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:17@2026-10-14",
  "rationale": "Whole Migration Rule section is retained; only two relative link spellings change, to ../transitional-switchboard.md and migration-authoring-rules.md, preserving the original repository destinations. Every prose clause and obligation is retained. No governance rule or authority changes."
}
````

Source: `docs/doc-governance.md#13-migration-rule`

Source unit digest: `f4b2fe939e035e0720bfed27c889b6a74904d570b8e1bf8860cbef0115ef9afb`
Shown source SHA256: `c1f0081d268a6af2c4c14e3bc982207578b88fea4c2b16d04ec23d738e13958f`

````text
## 13. Migration Rule

Do not bulk-move old docs before classifying them by type, authority, lifecycle,
provenance, and claim ownership. Content may be transformed and reviewed one
area at a time, but the authorized migration program must declare whether
promotion is per-area or repository-wide; transformation order alone never
changes authority.

Until a newer program is explicitly accepted, each area portal's current-source
mapping controls, operationalized through [transitional-switchboard.md](transitional-switchboard.md).
Authors during migration must follow [platform/migration-authoring-rules.md](platform/migration-authoring-rules.md)
(one claim, one canonical owner, never dual-author prose, ratchet enforcement on legacy roots).
A target marked partial/candidate does not outrank that map, and readers must surface
conflicts rather than infer authority from path or date. Any redirect/stub must be
explicitly read-only and temporary. The proposed repository-wide normalization and
alias-based retirement model is documented in
`platform/proposals/documentation-system-unification.md` and is not active merely
because its plan exists.
````

Target: `docs/platform/governance.md#13-migration-rule`

Target unit digest: `c75402a1584a65fe82b7c8343d1694feb1ac4af353095ac1e3a7c46356d01100`
Shown target SHA256: `42a3314f9d499a822ccceac3772df09d4dbe22c4ade755bcfa191007c13a5c3d`

````text
## 13. Migration Rule

Do not bulk-move old docs before classifying them by type, authority, lifecycle,
provenance, and claim ownership. Content may be transformed and reviewed one
area at a time, but the authorized migration program must declare whether
promotion is per-area or repository-wide; transformation order alone never
changes authority.

Until a newer program is explicitly accepted, each area portal's current-source
mapping controls, operationalized through [transitional-switchboard.md](../transitional-switchboard.md).
Authors during migration must follow [platform/migration-authoring-rules.md](migration-authoring-rules.md)
(one claim, one canonical owner, never dual-author prose, ratchet enforcement on legacy roots).
A target marked partial/candidate does not outrank that map, and readers must surface
conflicts rather than infer authority from path or date. Any redirect/stub must be
explicitly read-only and temporary. The proposed repository-wide normalization and
alias-based retirement model is documented in
`platform/proposals/documentation-system-unification.md` and is not active merely
because its plan exists.
````

````diff
--- docs/doc-governance.md
+++ docs/platform/governance.md
@@ -7,8 +7,8 @@
 changes authority.
 
 Until a newer program is explicitly accepted, each area portal's current-source
-mapping controls, operationalized through [transitional-switchboard.md](transitional-switchboard.md).
-Authors during migration must follow [platform/migration-authoring-rules.md](platform/migration-authoring-rules.md)
+mapping controls, operationalized through [transitional-switchboard.md](../transitional-switchboard.md).
+Authors during migration must follow [platform/migration-authoring-rules.md](migration-authoring-rules.md)
 (one claim, one canonical owner, never dual-author prose, ratchet enforcement on legacy roots).
 A target marked partial/candidate does not outrank that map, and readers must surface
 conflicts rather than infer authority from path or date. Any redirect/stub must be
````

Before decision and rationale (immutable reviewed request):
````json
{
  "claimId": "claim_049328a09ba2129e3fcf91723d32a4e2",
  "sourceUnitDigest": "f4b2fe939e035e0720bfed27c889b6a74904d570b8e1bf8860cbef0115ef9afb",
  "targetOwner": "docs/platform/governance.md",
  "targetAnchor": "13-migration-rule",
  "targetUnitDigest": "c75402a1584a65fe82b7c8343d1694feb1ac4af353095ac1e3a7c46356d01100",
  "targetAncestry": [
    "Documentation Governance"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:17@2026-10-14",
  "rationale": "Whole source unit docs/doc-governance.md#13-migration-rule is retained at docs/platform/governance.md#13-migration-rule; only relative navigation spelling changes to preserve the same absolute repository destinations. The future component-boundary target is a plain path under the later-batch rule. Every prose clause, rule and list item is retained; shown full text and diff must be checked independently. No new governance rule or authority cutover."
}
````

Decision delta:
````diff
--- 
+++ 
@@ -11,5 +11,5 @@
   "disposition": "supersede",
   "reviewStatus": "pending",
   "authoredBy": "codex-session:17@2026-10-14",
-  "rationale": "Whole source unit docs/doc-governance.md#13-migration-rule is retained at docs/platform/governance.md#13-migration-rule; only relative navigation spelling changes to preserve the same absolute repository destinations. The future component-boundary target is a plain path under the later-batch rule. Every prose clause, rule and list item is retained; shown full text and diff must be checked independently. No new governance rule or authority cutover."
+  "rationale": "Whole Migration Rule section is retained; only two relative link spellings change, to ../transitional-switchboard.md and migration-authoring-rules.md, preserving the original repository destinations. Every prose clause and obligation is retained. No governance rule or authority changes."
 }
````
## claim_25f06d2e833c0241a324a4898781bc4a

````json
{
  "claimId": "claim_25f06d2e833c0241a324a4898781bc4a",
  "sourceUnitDigest": "9e852420cafcc284db1d2e3d60aab4dce51818638cfa79ebdf0554732f0edd03",
  "targetOwner": "docs/platform/governance.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "fb5565f1a415763fd84e9474b968e9780d3cf1ede3d0bdc242c58b499f90bfc3",
  "targetAncestry": [
    "Documentation Governance",
    "13. Migration Rule"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:17@2026-10-14",
  "rationale": "Whole Migration Rule block is retained; only two relative link spellings change, to ../transitional-switchboard.md and migration-authoring-rules.md, preserving the original repository destinations. Every prose clause and obligation is retained. No governance rule or authority changes."
}
````

Source: `docs/doc-governance.md#unheaded-block-59`

Source unit digest: `9e852420cafcc284db1d2e3d60aab4dce51818638cfa79ebdf0554732f0edd03`
Shown source SHA256: `9e852420cafcc284db1d2e3d60aab4dce51818638cfa79ebdf0554732f0edd03`

````text
Until a newer program is explicitly accepted, each area portal's current-source
mapping controls, operationalized through [transitional-switchboard.md](transitional-switchboard.md).
Authors during migration must follow [platform/migration-authoring-rules.md](platform/migration-authoring-rules.md)
(one claim, one canonical owner, never dual-author prose, ratchet enforcement on legacy roots).
A target marked partial/candidate does not outrank that map, and readers must surface
conflicts rather than infer authority from path or date. Any redirect/stub must be
explicitly read-only and temporary. The proposed repository-wide normalization and
alias-based retirement model is documented in
`platform/proposals/documentation-system-unification.md` and is not active merely
because its plan exists.
````

Target: `docs/platform/governance.md#unheaded-block-59`

Target unit digest: `fb5565f1a415763fd84e9474b968e9780d3cf1ede3d0bdc242c58b499f90bfc3`
Shown target SHA256: `fb5565f1a415763fd84e9474b968e9780d3cf1ede3d0bdc242c58b499f90bfc3`

````text
Until a newer program is explicitly accepted, each area portal's current-source
mapping controls, operationalized through [transitional-switchboard.md](../transitional-switchboard.md).
Authors during migration must follow [platform/migration-authoring-rules.md](migration-authoring-rules.md)
(one claim, one canonical owner, never dual-author prose, ratchet enforcement on legacy roots).
A target marked partial/candidate does not outrank that map, and readers must surface
conflicts rather than infer authority from path or date. Any redirect/stub must be
explicitly read-only and temporary. The proposed repository-wide normalization and
alias-based retirement model is documented in
`platform/proposals/documentation-system-unification.md` and is not active merely
because its plan exists.
````

````diff
--- docs/doc-governance.md
+++ docs/platform/governance.md
@@ -1,6 +1,6 @@
 Until a newer program is explicitly accepted, each area portal's current-source
-mapping controls, operationalized through [transitional-switchboard.md](transitional-switchboard.md).
-Authors during migration must follow [platform/migration-authoring-rules.md](platform/migration-authoring-rules.md)
+mapping controls, operationalized through [transitional-switchboard.md](../transitional-switchboard.md).
+Authors during migration must follow [platform/migration-authoring-rules.md](migration-authoring-rules.md)
 (one claim, one canonical owner, never dual-author prose, ratchet enforcement on legacy roots).
 A target marked partial/candidate does not outrank that map, and readers must surface
 conflicts rather than infer authority from path or date. Any redirect/stub must be
````

Before decision and rationale (immutable reviewed request):
````json
{
  "claimId": "claim_25f06d2e833c0241a324a4898781bc4a",
  "sourceUnitDigest": "9e852420cafcc284db1d2e3d60aab4dce51818638cfa79ebdf0554732f0edd03",
  "targetOwner": "docs/platform/governance.md",
  "targetAnchor": "unheaded-block-59",
  "targetUnitDigest": "fb5565f1a415763fd84e9474b968e9780d3cf1ede3d0bdc242c58b499f90bfc3",
  "targetAncestry": [
    "Documentation Governance",
    "13. Migration Rule"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:17@2026-10-14",
  "rationale": "Whole source unit docs/doc-governance.md#unheaded-block-59 is retained at docs/platform/governance.md#unheaded-block-59; only relative navigation spelling changes to preserve the same absolute repository destinations. The future component-boundary target is a plain path under the later-batch rule. Every prose clause, rule and list item is retained; shown full text and diff must be checked independently. No new governance rule or authority cutover."
}
````

Decision delta:
````diff
--- 
+++ 
@@ -12,5 +12,5 @@
   "disposition": "supersede",
   "reviewStatus": "pending",
   "authoredBy": "codex-session:17@2026-10-14",
-  "rationale": "Whole source unit docs/doc-governance.md#unheaded-block-59 is retained at docs/platform/governance.md#unheaded-block-59; only relative navigation spelling changes to preserve the same absolute repository destinations. The future component-boundary target is a plain path under the later-batch rule. Every prose clause, rule and list item is retained; shown full text and diff must be checked independently. No new governance rule or authority cutover."
+  "rationale": "Whole Migration Rule block is retained; only two relative link spellings change, to ../transitional-switchboard.md and migration-authoring-rules.md, preserving the original repository destinations. Every prose clause and obligation is retained. No governance rule or authority changes."
 }
````
## claim_66f7be3b79ca1fe458ce0416ba1adf89

````json
{
  "claimId": "claim_66f7be3b79ca1fe458ce0416ba1adf89",
  "sourceUnitDigest": "b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f",
  "targetOwner": "docs/platform/governance.md",
  "targetAnchor": "14-related-files",
  "targetUnitDigest": "e589d54d9c81da5e926e98fa5cecf502a3fbe44355a75963d71242b42ef55edb",
  "targetAncestry": [
    "Documentation Governance"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:17@2026-10-14",
  "rationale": "Whole Related Files section is retained. Nine relative link spellings are adjusted across governance.md to preserve the original repository destinations, including the documentation portal README.md now written ../README.md (docs/README.md), distinct from the platform portal. This unit contains no component-boundary plain path. No governance rule or authority changes."
}
````

Source: `docs/doc-governance.md#14-related-files`

Source unit digest: `b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f`
Shown source SHA256: `cf18a678f3f4d96d24689cf554e548bfb7c22a395302a21447f06915397ee8a8`

````text
## 14. Related Files

| Relationship | File |
|---|---|
| documentation portal | [README.md](README.md) |
| reader routing | [reading-map.md](reading-map.md) |
| operative transitional switchboard | [transitional-switchboard.md](transitional-switchboard.md) |
| migration authoring rules | [platform/migration-authoring-rules.md](platform/migration-authoring-rules.md) |
| platform portal | [platform/README.md](platform/README.md) |
| source design discussion | [architect/documentation-system-design.md](architect/documentation-system-design.md) |
````

Target: `docs/platform/governance.md#14-related-files`

Target unit digest: `e589d54d9c81da5e926e98fa5cecf502a3fbe44355a75963d71242b42ef55edb`
Shown target SHA256: `f71c00e8dd2a11be019af0483181ca9e7e3b055134b7967cd76b05cb35d20deb`

````text
## 14. Related Files

| Relationship | File |
|---|---|
| documentation portal | [README.md](../README.md) |
| reader routing | [reading-map.md](../reading-map.md) |
| operative transitional switchboard | [transitional-switchboard.md](../transitional-switchboard.md) |
| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |
| platform portal | [platform/README.md](README.md) |
| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |
````

````diff
--- docs/doc-governance.md
+++ docs/platform/governance.md
@@ -2,9 +2,9 @@
 
 | Relationship | File |
 |---|---|
-| documentation portal | [README.md](README.md) |
-| reader routing | [reading-map.md](reading-map.md) |
-| operative transitional switchboard | [transitional-switchboard.md](transitional-switchboard.md) |
-| migration authoring rules | [platform/migration-authoring-rules.md](platform/migration-authoring-rules.md) |
-| platform portal | [platform/README.md](platform/README.md) |
-| source design discussion | [architect/documentation-system-design.md](architect/documentation-system-design.md) |+| documentation portal | [README.md](../README.md) |
+| reader routing | [reading-map.md](../reading-map.md) |
+| operative transitional switchboard | [transitional-switchboard.md](../transitional-switchboard.md) |
+| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |
+| platform portal | [platform/README.md](README.md) |
+| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |
````

Before decision and rationale (immutable reviewed request):
````json
{
  "claimId": "claim_66f7be3b79ca1fe458ce0416ba1adf89",
  "sourceUnitDigest": "b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f",
  "targetOwner": "docs/platform/governance.md",
  "targetAnchor": "14-related-files",
  "targetUnitDigest": "fee84962ef28aa9f7435ec5dd77a474a013bc2f2595a9d34f403da53411cdbc9",
  "targetAncestry": [
    "Documentation Governance"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:17@2026-10-14",
  "rationale": "Whole source unit docs/doc-governance.md#14-related-files is retained at docs/platform/governance.md#14-related-files; only relative navigation spelling changes to preserve the same absolute repository destinations. The future component-boundary target is a plain path under the later-batch rule. Every prose clause, rule and list item is retained; shown full text and diff must be checked independently. No new governance rule or authority cutover."
}
````

Decision delta:
````diff
--- 
+++ 
@@ -3,7 +3,7 @@
   "sourceUnitDigest": "b94c5cec93998f88a549a7613a90fbb1c4f111181aacf0faffc469528603bf9f",
   "targetOwner": "docs/platform/governance.md",
   "targetAnchor": "14-related-files",
-  "targetUnitDigest": "fee84962ef28aa9f7435ec5dd77a474a013bc2f2595a9d34f403da53411cdbc9",
+  "targetUnitDigest": "e589d54d9c81da5e926e98fa5cecf502a3fbe44355a75963d71242b42ef55edb",
   "targetAncestry": [
     "Documentation Governance"
   ],
@@ -11,5 +11,5 @@
   "disposition": "supersede",
   "reviewStatus": "pending",
   "authoredBy": "codex-session:17@2026-10-14",
-  "rationale": "Whole source unit docs/doc-governance.md#14-related-files is retained at docs/platform/governance.md#14-related-files; only relative navigation spelling changes to preserve the same absolute repository destinations. The future component-boundary target is a plain path under the later-batch rule. Every prose clause, rule and list item is retained; shown full text and diff must be checked independently. No new governance rule or authority cutover."
+  "rationale": "Whole Related Files section is retained. Nine relative link spellings are adjusted across governance.md to preserve the original repository destinations, including the documentation portal README.md now written ../README.md (docs/README.md), distinct from the platform portal. This unit contains no component-boundary plain path. No governance rule or authority changes."
 }
````
## claim_5f99956630d0cb78499c2a3542d2e5e3

````json
{
  "claimId": "claim_5f99956630d0cb78499c2a3542d2e5e3",
  "sourceUnitDigest": "f42764566cc00268ec5f1cf4ab8d130764ffe3dc3a367881640633c3c876b083",
  "targetOwner": "docs/platform/governance.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "0729946d01afffc2b5800527271a368947d3971968759a447bd51eec81f15f5b",
  "targetAncestry": [
    "Documentation Governance",
    "14. Related Files"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:17@2026-10-14",
  "rationale": "Whole Related Files table is retained. Nine relative link spellings are adjusted across governance.md to preserve the original repository destinations, including the documentation portal README.md now written ../README.md (docs/README.md), distinct from the platform portal. This unit contains no component-boundary plain path. No governance rule or authority changes."
}
````

Source: `docs/doc-governance.md#unheaded-block-60`

Source unit digest: `f42764566cc00268ec5f1cf4ab8d130764ffe3dc3a367881640633c3c876b083`
Shown source SHA256: `f42764566cc00268ec5f1cf4ab8d130764ffe3dc3a367881640633c3c876b083`

````text
| Relationship | File |
|---|---|
| documentation portal | [README.md](README.md) |
| reader routing | [reading-map.md](reading-map.md) |
| operative transitional switchboard | [transitional-switchboard.md](transitional-switchboard.md) |
| migration authoring rules | [platform/migration-authoring-rules.md](platform/migration-authoring-rules.md) |
| platform portal | [platform/README.md](platform/README.md) |
| source design discussion | [architect/documentation-system-design.md](architect/documentation-system-design.md) |
````

Target: `docs/platform/governance.md#unheaded-block-60`

Target unit digest: `0729946d01afffc2b5800527271a368947d3971968759a447bd51eec81f15f5b`
Shown target SHA256: `0729946d01afffc2b5800527271a368947d3971968759a447bd51eec81f15f5b`

````text
| Relationship | File |
|---|---|
| documentation portal | [README.md](../README.md) |
| reader routing | [reading-map.md](../reading-map.md) |
| operative transitional switchboard | [transitional-switchboard.md](../transitional-switchboard.md) |
| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |
| platform portal | [platform/README.md](README.md) |
| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |
````

````diff
--- docs/doc-governance.md
+++ docs/platform/governance.md
@@ -1,8 +1,8 @@
 | Relationship | File |
 |---|---|
-| documentation portal | [README.md](README.md) |
-| reader routing | [reading-map.md](reading-map.md) |
-| operative transitional switchboard | [transitional-switchboard.md](transitional-switchboard.md) |
-| migration authoring rules | [platform/migration-authoring-rules.md](platform/migration-authoring-rules.md) |
-| platform portal | [platform/README.md](platform/README.md) |
-| source design discussion | [architect/documentation-system-design.md](architect/documentation-system-design.md) |+| documentation portal | [README.md](../README.md) |
+| reader routing | [reading-map.md](../reading-map.md) |
+| operative transitional switchboard | [transitional-switchboard.md](../transitional-switchboard.md) |
+| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |
+| platform portal | [platform/README.md](README.md) |
+| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |
````

Before decision and rationale (immutable reviewed request):
````json
{
  "claimId": "claim_5f99956630d0cb78499c2a3542d2e5e3",
  "sourceUnitDigest": "f42764566cc00268ec5f1cf4ab8d130764ffe3dc3a367881640633c3c876b083",
  "targetOwner": "docs/platform/governance.md",
  "targetAnchor": "unheaded-block-60",
  "targetUnitDigest": "4aad7684bd5ff59163cf2e9cfc405f7b897c2a9b3a6fc678531b179c343e305f",
  "targetAncestry": [
    "Documentation Governance",
    "14. Related Files"
  ],
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:17@2026-10-14",
  "rationale": "Whole source unit docs/doc-governance.md#unheaded-block-60 is retained at docs/platform/governance.md#unheaded-block-60; only relative navigation spelling changes to preserve the same absolute repository destinations. The future component-boundary target is a plain path under the later-batch rule. Every prose clause, rule and list item is retained; shown full text and diff must be checked independently. No new governance rule or authority cutover."
}
````

Decision delta:
````diff
--- 
+++ 
@@ -3,7 +3,7 @@
   "sourceUnitDigest": "f42764566cc00268ec5f1cf4ab8d130764ffe3dc3a367881640633c3c876b083",
   "targetOwner": "docs/platform/governance.md",
   "targetAnchor": "unheaded-block-60",
-  "targetUnitDigest": "4aad7684bd5ff59163cf2e9cfc405f7b897c2a9b3a6fc678531b179c343e305f",
+  "targetUnitDigest": "0729946d01afffc2b5800527271a368947d3971968759a447bd51eec81f15f5b",
   "targetAncestry": [
     "Documentation Governance",
     "14. Related Files"
@@ -12,5 +12,5 @@
   "disposition": "supersede",
   "reviewStatus": "pending",
   "authoredBy": "codex-session:17@2026-10-14",
-  "rationale": "Whole source unit docs/doc-governance.md#unheaded-block-60 is retained at docs/platform/governance.md#unheaded-block-60; only relative navigation spelling changes to preserve the same absolute repository destinations. The future component-boundary target is a plain path under the later-batch rule. Every prose clause, rule and list item is retained; shown full text and diff must be checked independently. No new governance rule or authority cutover."
+  "rationale": "Whole Related Files table is retained. Nine relative link spellings are adjusted across governance.md to preserve the original repository destinations, including the documentation portal README.md now written ../README.md (docs/README.md), distinct from the platform portal. This unit contains no component-boundary plain path. No governance rule or authority changes."
 }
````
## claim_4a023fa2faa879fb0e1dfd8bc5c051e7

````json
{
  "claimId": "claim_4a023fa2faa879fb0e1dfd8bc5c051e7",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ],
  "authoredBy": "codex-session:17@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "The predecessor block 31 at 9881f8622 already states COMMAND_REGISTRY, 15 externalEffect verbs and no coordination. The only delta to the real same-file successor is adding review/approve/run examples. All other wording is retained, including field definitions, review rationale and STR38 clause. Native predecessor identity is conserved without graft or approval carry."
}
````

Source: `docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31`

Source unit digest: `857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f`
Shown source SHA256: `857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f`

````text
**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).
````

Target: `docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31`

Target unit digest: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`
Shown target SHA256: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`

````text
**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).
````

````diff
--- docs/platform/work-state/contracts/cli-io-contract.md
+++ docs/platform/work-state/contracts/cli-io-contract.md
@@ -4,7 +4,7 @@
 PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
 fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
 (verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
-có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (dispatch executor thật tính là effect ngoài `.fgos/`);
+có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
 `review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
 cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
 phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
````

Before decision and rationale (immutable reviewed request):
````json
{
  "claimId": "claim_4a023fa2faa879fb0e1dfd8bc5c051e7",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ],
  "authoredBy": "codex-session:17@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31 at 9881f8622 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry."
}
````

Decision delta:
````diff
--- 
+++ 
@@ -13,5 +13,5 @@
   ],
   "authoredBy": "codex-session:17@2026-10-14",
   "reviewStatus": "pending",
-  "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31 at 9881f8622 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry."
+  "rationale": "The predecessor block 31 at 9881f8622 already states COMMAND_REGISTRY, 15 externalEffect verbs and no coordination. The only delta to the real same-file successor is adding review/approve/run examples. All other wording is retained, including field definitions, review rationale and STR38 clause. Native predecessor identity is conserved without graft or approval carry."
 }
````
## claim_e597b776163803dcf6e4194962ea4f6e

````json
{
  "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ],
  "authoredBy": "codex-session:17@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "The predecessor block 32 at 9881f8622 already states COMMAND_REGISTRY, 15 externalEffect verbs and no coordination. The only delta to the real same-file successor is adding review/approve/run examples. All other wording, list items and dispatch executor qualifier are retained. Native predecessor identity is conserved without graft or approval carry."
}
````

Source: `docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`

Source unit digest: `5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3`
Shown source SHA256: `5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3`

````text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest
  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có
  `coordination` (dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
````

Target: `docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`

Target unit digest: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`
Shown target SHA256: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`

````text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest
  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có
  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật
  tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
````

````diff
--- docs/platform/work-state/contracts/cli-io-contract.md
+++ docs/platform/work-state/contracts/cli-io-contract.md
@@ -7,5 +7,6 @@
   sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
   bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest
   `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có
-  `coordination` (dispatch executor thật tính là effect ngoài `.fgos/`).
+  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật
+  tính là effect ngoài `.fgos/`).
 - `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
````

Before decision and rationale (immutable reviewed request):
````json
{
  "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ],
  "authoredBy": "codex-session:17@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 at 9881f8622 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry."
}
````

Decision delta:
````diff
--- 
+++ 
@@ -13,5 +13,5 @@
   ],
   "authoredBy": "codex-session:17@2026-10-14",
   "reviewStatus": "pending",
-  "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 at 9881f8622 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry."
+  "rationale": "The predecessor block 32 at 9881f8622 already states COMMAND_REGISTRY, 15 externalEffect verbs and no coordination. The only delta to the real same-file successor is adding review/approve/run examples. All other wording, list items and dispatch executor qualifier are retained. Native predecessor identity is conserved without graft or approval carry."
 }
````
## claim_e2377849e4ba8e3d3beaf70880e4ed23

````json
{
  "claimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
  "sourceUnitDigest": "39e4ab1f30a6acc9",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-32",
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "rationale": "Whole source unit is carried. Besides replacing the coordination example with run, the diff replaces the fgos --help --json deferral with explicit current assertions: COMMAND_REGISTRY is the source, 15 verbs carry externalEffect: true, and coordination is absent. The review/approve/run examples, dispatch executor qualifier, other bullets and field definitions are conserved; no approval carries.",
  "authoredBy": "codex-session:1@2026-10-09",
  "targetUnitDigest": "e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ]
}
````

Source: `docs/io-contract.md#unheaded-block-19`

Source unit digest: `39e4ab1f30a6acc9`
Shown source SHA256: `39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c`

````text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
````

Target: `docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`

Target unit digest: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`
Shown target SHA256: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`

````text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest
  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có
  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật
  tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
````

````diff
--- docs/io-contract.md
+++ docs/platform/work-state/contracts/cli-io-contract.md
@@ -5,7 +5,8 @@
   **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
   độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
   sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
-  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
-  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
-  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).
+  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest
+  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có
+  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật
+  tính là effect ngoài `.fgos/`).
 - `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
````

Before decision and rationale (immutable reviewed request):
````json
{
  "claimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
  "sourceUnitDigest": "39e4ab1f30a6acc9",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-32",
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "rationale": "Code is truth for the whole effect-axis field list. Owner A15 resolves SC-1: replace the retired coordination example with run, preserving every other entry-field definition and qualifier. The actual current machine-readable manifest has 15 externalEffect verbs including run and no coordination verb; both candidate examples now agree. This corrected whole-unit carry supersedes the stale source example, not a claim of verbatim copying or a silent partial carry. Independent review is pending.",
  "authoredBy": "codex-session:1@2026-10-09",
  "targetUnitDigest": "e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ]
}
````

Decision delta:
````diff
--- 
+++ 
@@ -6,7 +6,7 @@
   "claimKind": "contract",
   "disposition": "supersede",
   "reviewStatus": "pending",
-  "rationale": "Code is truth for the whole effect-axis field list. Owner A15 resolves SC-1: replace the retired coordination example with run, preserving every other entry-field definition and qualifier. The actual current machine-readable manifest has 15 externalEffect verbs including run and no coordination verb; both candidate examples now agree. This corrected whole-unit carry supersedes the stale source example, not a claim of verbatim copying or a silent partial carry. Independent review is pending.",
+  "rationale": "Whole source unit is carried. Besides replacing the coordination example with run, the diff replaces the fgos --help --json deferral with explicit current assertions: COMMAND_REGISTRY is the source, 15 verbs carry externalEffect: true, and coordination is absent. The review/approve/run examples, dispatch executor qualifier, other bullets and field definitions are conserved; no approval carries.",
   "authoredBy": "codex-session:1@2026-10-09",
   "targetUnitDigest": "e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1",
   "targetAncestry": [
````
## Native binding consequence of Related Files correction

````json
{
  "identityGap": {
    "sourcePath": "docs/platform/governance.md",
    "unitDigest": "e22049e06c0ec6c9ec58b06a1bd677264589d16ba887e8c95685c05fd2073a82",
    "identityFingerprint": "e22049e06c0ec6c9ec58b06a1bd677264589d16ba887e8c95685c05fd2073a82",
    "claimId": "claim_a01d870cf693e19d3ee3b376a2c99093",
    "sourceAnchor": "unheaded-block-60",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "4aad7684bd5ff59163cf2e9cfc405f7b897c2a9b3a6fc678531b179c343e305f",
    "claimKind": "unclassified",
    "status": "future",
    "origin": "added-since-9881f8622732e3ba7c8e203097d42674b8aba36d",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-60 is not a stable heading anchor"
  },
  "beforeIdentity": {
    "sourcePath": "docs/platform/governance.md",
    "unitDigest": "e22049e06c0ec6c9ec58b06a1bd677264589d16ba887e8c95685c05fd2073a82",
    "identityFingerprint": "e22049e06c0ec6c9ec58b06a1bd677264589d16ba887e8c95685c05fd2073a82",
    "claimId": "claim_a01d870cf693e19d3ee3b376a2c99093",
    "sourceAnchor": "unheaded-block-60",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "4aad7684bd5ff59163cf2e9cfc405f7b897c2a9b3a6fc678531b179c343e305f",
    "claimKind": "unclassified",
    "status": "future",
    "origin": "added-since-9881f8622732e3ba7c8e203097d42674b8aba36d"
  },
  "nativeSuccessor": {
    "sourcePath": "docs/platform/governance.md",
    "unitDigest": "febba28a75f0ffc2e795142eade83b9409275a4ac349bcbe6634d92bad1f689d",
    "identityFingerprint": "febba28a75f0ffc2e795142eade83b9409275a4ac349bcbe6634d92bad1f689d",
    "claimId": "claim_c810411255d8383db9a186eb780c0b44",
    "sourceAnchor": "unheaded-block-60",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0729946d01afffc2b5800527271a368947d3971968759a447bd51eec81f15f5b",
    "claimKind": "unclassified",
    "status": "future",
    "origin": "added-since-c8b2d948d6dd0b408011b294fd67aea59870749b"
  },
  "sourceCommit": "c8b2d948d6dd0b408011b294fd67aea59870749b",
  "targetCommit": "1157b7243ed3c4b2f9dfe67597f3908f6f881ec9",
  "status": "pending-native-conservation-accounting",
  "reason": "One real native table identity gap follows the README destination correction; old ID retained, no graft or approval carry. Independent reviewer checks this consequence together with the two corrected Related Files source rows."
}
````

Before digest: `4aad7684bd5ff59163cf2e9cfc405f7b897c2a9b3a6fc678531b179c343e305f`

````text
| Relationship | File |
|---|---|
| documentation portal | [README.md](README.md) |
| reader routing | [reading-map.md](../reading-map.md) |
| operative transitional switchboard | [transitional-switchboard.md](../transitional-switchboard.md) |
| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |
| platform portal | [platform/README.md](README.md) |
| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |
````

Current digest: `0729946d01afffc2b5800527271a368947d3971968759a447bd51eec81f15f5b`

````text
| Relationship | File |
|---|---|
| documentation portal | [README.md](../README.md) |
| reader routing | [reading-map.md](../reading-map.md) |
| operative transitional switchboard | [transitional-switchboard.md](../transitional-switchboard.md) |
| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |
| platform portal | [platform/README.md](README.md) |
| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |
````

````diff
--- 
+++ 
@@ -1,6 +1,6 @@
 | Relationship | File |
 |---|---|
-| documentation portal | [README.md](README.md) |
+| documentation portal | [README.md](../README.md) |
 | reader routing | [reading-map.md](../reading-map.md) |
 | operative transitional switchboard | [transitional-switchboard.md](../transitional-switchboard.md) |
 | migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |
````
## Stable heading binding consequence

````json
{
  "before": {
    "sourcePath": "docs/platform/governance.md",
    "unitDigest": "1c3e89b21a688b9a640ad96348b2207ec9fe815768986e54f122a17c5072b382",
    "identityFingerprint": "da6c4f70e7e3f9dc60b96ba395e7baf1ecbfc6b41984147d6c293f07071c8d93",
    "claimId": "claim_5dae6eed87e8f69f3c3530f0d203b7fa",
    "sourceAnchor": "14-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "fee84962ef28aa9f7435ec5dd77a474a013bc2f2595a9d34f403da53411cdbc9",
    "claimKind": "unclassified",
    "status": "future",
    "origin": "added-since-9881f8622732e3ba7c8e203097d42674b8aba36d"
  },
  "after": {
    "sourcePath": "docs/platform/governance.md",
    "unitDigest": "15b1a809afa5ae010c563289cb139415947fb5e15a7fd1aad855316684c30a49",
    "identityFingerprint": "79106d7dc90dd0812b27974f1392e78190495833abe57e4cfdbcf024f35be975",
    "claimId": "claim_5dae6eed87e8f69f3c3530f0d203b7fa",
    "sourceAnchor": "14-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "e589d54d9c81da5e926e98fa5cecf502a3fbe44355a75963d71242b42ef55edb",
    "claimKind": "unclassified",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "c8b2d948d6dd0b408011b294fd67aea59870749b",
      "fromUnitDigest": "1c3e89b21a688b9a640ad96348b2207ec9fe815768986e54f122a17c5072b382",
      "toUnitDigest": "15b1a809afa5ae010c563289cb139415947fb5e15a7fd1aad855316684c30a49",
      "fromSourceUnitDigest": "fee84962ef28aa9f7435ec5dd77a474a013bc2f2595a9d34f403da53411cdbc9",
      "toSourceUnitDigest": "e589d54d9c81da5e926e98fa5cecf502a3fbe44355a75963d71242b42ef55edb"
    }
  }
}
````

````text
## 14. Related Files

| Relationship | File |
|---|---|
| documentation portal | [README.md](README.md) |
| reader routing | [reading-map.md](../reading-map.md) |
| operative transitional switchboard | [transitional-switchboard.md](../transitional-switchboard.md) |
| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |
| platform portal | [platform/README.md](README.md) |
| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |
````

````text
## 14. Related Files

| Relationship | File |
|---|---|
| documentation portal | [README.md](../README.md) |
| reader routing | [reading-map.md](../reading-map.md) |
| operative transitional switchboard | [transitional-switchboard.md](../transitional-switchboard.md) |
| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |
| platform portal | [platform/README.md](README.md) |
| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |
````

````diff
--- 
+++ 
@@ -2,7 +2,7 @@
 
 | Relationship | File |
 |---|---|
-| documentation portal | [README.md](README.md) |
+| documentation portal | [README.md](../README.md) |
 | reader routing | [reading-map.md](../reading-map.md) |
 | operative transitional switchboard | [transitional-switchboard.md](../transitional-switchboard.md) |
 | migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |
````
