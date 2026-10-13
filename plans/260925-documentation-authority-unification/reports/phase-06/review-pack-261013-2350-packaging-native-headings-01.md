# Packaging independent review: native-headings 1

Content pin: `baef3a075899f83d515a28ab66abd6c3d55201c5`

Author: `codex-session:8@2026-10-13`; assembler: `codex-session:9@2026-10-13`. All proposals remain pending.

## claim_0675d27f76c743d53aae27bc8d72c8d1

Binding and proposed decision:

```json
{
  "claimId": "claim_0675d27f76c743d53aae27bc8d72c8d1",
  "path": "docs/platform/packaging-distribution/README.md",
  "anchor": "packaging-distribution",
  "beforeUnitDigest": "000e6b7e788f8cbe946a7490a7690c3c53884135f1e8a6ab305f95fcfac4d43a",
  "afterUnitDigest": "19e5e05abf531948c54037d55341d63daf7e1a062c251385fd0744ce382d3d26",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `f17e16083030a4af070988ef4341a4adaf5266142df818c76b962b51c088f4cd`

Target shown SHA256: `a92396016843e5749160309f2f0aa7ec8a1536b8bd35fe36fa882956d71231a1`

### Source shown text

````text
# Packaging-Distribution

```txt
Document type: Area portal
Audience: Human reviewer, maintainer, architecture collaborator, implementation agent
Purpose: Route readers through fgOS packaging, install, runtime activation, doctor/repair, and release docs
Design status: Draft
Implementation status: Implemented preview plus tracked partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/**
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/vision.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
- docs/platform/packaging-distribution/code-panel-rollout-plan.md
```
````

### Target shown text

````text
# Packaging-Distribution

```txt
Document type: Area portal
Audience: Human reviewer, maintainer, architecture collaborator, implementation agent
Purpose: Route readers through fgOS packaging, install, runtime activation, doctor/repair, and release docs
Design status: Draft
Implementation status: Implemented preview plus tracked partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/**
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/vision.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
- docs/platform/packaging-distribution/code-panel-rollout-plan.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -21,4 +21,12 @@
 - docs/platform/packaging-distribution/verification/implementation-alignment.md
 - docs/platform/packaging-distribution/verification/source-preservation-audit.md
 - docs/platform/packaging-distribution/code-panel-rollout-plan.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_c83db9e7c725ee8a14dc1143efd84270

Binding and proposed decision:

```json
{
  "claimId": "claim_c83db9e7c725ee8a14dc1143efd84270",
  "path": "docs/platform/packaging-distribution/architecture/fgctl-and-local-fgos.md",
  "anchor": "fgctl-and-local-fgos",
  "beforeUnitDigest": "5821f389404672f828348db9b49f95217ed8eafc22a74297612fe7d80fad17da",
  "afterUnitDigest": "2a40888958807b239f76b447184c204b13962dff670399e8474cbf0239e59387",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `d578a7b32c99a3359ca296ccaceb5747f64c6020c0e46159c4d539eb45e4aff5`

Target shown SHA256: `9242f1b04401e4c901d458862e8b037a43da238c9aaaf34f9e5643ec30a8d03c`

### Source shown text

````text
# fgctl And Local fgOS

```txt
Document type: Architecture
Audience: Architect, maintainer, implementation agent
Purpose: Define the ownership split between fgctl and the project-local fgos runtime
Design status: Draft
Implementation status: Implemented preview plus projection partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from packaging-distribution architecture discussion and code scan
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
```
````

### Target shown text

````text
# fgctl And Local fgOS

```txt
Document type: Architecture
Audience: Architect, maintainer, implementation agent
Purpose: Define the ownership split between fgctl and the project-local fgos runtime
Design status: Draft
Implementation status: Implemented preview plus projection partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from packaging-distribution architecture discussion and code scan
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -14,4 +14,12 @@
 - docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
 - docs/platform/packaging-distribution/contracts/activation-binding.md
 - docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_948c3417e4a8a8501880ea0b907deab0

Binding and proposed decision:

```json
{
  "claimId": "claim_948c3417e4a8a8501880ea0b907deab0",
  "path": "docs/platform/packaging-distribution/architecture/future-constraints.md",
  "anchor": "future-constraints",
  "beforeUnitDigest": "56f4968e6796714c430d80648f018a9010cbffc9fcadac611de9ec4e4a2318e2",
  "afterUnitDigest": "2911b40f830853fafd27cf1d816738ad181d1f49643aeedbea88e29a8a572e7a",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `3c47a3d3659243d1676ebb69311ce6f15357660852adc851acc7c2bb49ef3d6a`

Target shown SHA256: `6a8f0de02b95432d96bfe0507663326983fa0653372cddccf6a82ee4a0aafd2f`

### Source shown text

````text
# Future Constraints

```txt
Document type: Architecture
Audience: Architect, maintainer, implementation agent
Purpose: Preserve future constraints that packaging-distribution must not block
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/architect/packaging-distribution/future-constraints.md
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
```
````

### Target shown text

````text
# Future Constraints

```txt
Document type: Architecture
Audience: Architect, maintainer, implementation agent
Purpose: Preserve future constraints that packaging-distribution must not block
Design status: Draft
Implementation status: Planned
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/architect/packaging-distribution/future-constraints.md
Last reviewed: 2026-09-13
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -12,4 +12,12 @@
 Last reviewed: 2026-09-13
 Related:
 - docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_1c4e26a74b985421161091e46d9bf145

Binding and proposed decision:

```json
{
  "claimId": "claim_1c4e26a74b985421161091e46d9bf145",
  "path": "docs/platform/packaging-distribution/code-panel-rollout-plan.md",
  "anchor": "code-panel-rollout-plan-packaging-distribution",
  "beforeUnitDigest": "b56bb30ac000b182e08e577fbc62718c7e621c11f54ba8a3598ecc8adfb3e565",
  "afterUnitDigest": "ceeb9a153ea7f6706320e7855e35eadf7c97fd0766b45d221db64c1dd759ea0a",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `39d2b7573a681622e36c68bb09b77dcd554d2c22df1b2f78f3df5549eeb702e3`

Target shown SHA256: `fcad18d06bf23b9591cd641f4c88da4b335a2e4d700464d87143da8279df64db`

### Source shown text

````text
# Code-Panel Rollout Plan: Packaging-Distribution

```txt
Document type: Implementation plan
Audience: Code-panel coordinator, implementation agent, reviewer, red-team
Purpose: Break packaging-distribution work into independently reviewable code-panel packets
Design status: Draft
Implementation status: Done
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Derived from docs/platform/packaging-distribution/** and the source preservation audit
Last reviewed: 2026-09-15
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
```

Status: DONE. P1-P9 are merged, the panel branch has merged to `main`, and
the R1 preview installed/default Rust-host proof is recorded. Stable/default
graduation remains a release-owner follow-up.
````

### Target shown text

````text
# Code-Panel Rollout Plan: Packaging-Distribution

```txt
Document type: Implementation plan
Audience: Code-panel coordinator, implementation agent, reviewer, red-team
Purpose: Break packaging-distribution work into independently reviewable code-panel packets
Design status: Draft
Implementation status: Done
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Derived from docs/platform/packaging-distribution/** and the source preservation audit
Last reviewed: 2026-09-15
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```

Status: DONE. P1-P9 are merged, the panel branch has merged to `main`, and
the R1 preview installed/default Rust-host proof is recorded. Stable/default
graduation remains a release-owner follow-up.
````

### Unified diff

````diff
--- source
+++ target
@@ -17,6 +17,14 @@
 - docs/platform/packaging-distribution/contracts/skill-package-distribution.md
 - docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
 - docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
 
 Status: DONE. P1-P9 are merged, the panel branch has merged to `main`, and

````

## claim_aa0c404c1111d7c6f433b8d910b5ced9

Binding and proposed decision:

```json
{
  "claimId": "claim_aa0c404c1111d7c6f433b8d910b5ced9",
  "path": "docs/platform/packaging-distribution/contracts/activation-binding.md",
  "anchor": "contract-activation-binding",
  "beforeUnitDigest": "f4bbdb8716b82dcea63f8b9f3e54c4abc6cf6bad86ff9ec94b3aa282d611f1b2",
  "afterUnitDigest": "af683c9ce39feb2174037e082468332190f8b08c36ccb769e068e69dd182aacf",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `31d85c1a2f35391522c5517165fc7d701d173322b5dadd35456529139cd0d657`

Target shown SHA256: `3fc5acc8ff8917fc3807175c9d201a14f4081c3dd02392d953d648243e297d28`

### Source shown text

````text
# Contract: Activation Binding

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe workspace activation records for project-local fgOS runtime selection
Design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs, src/setup/bin-discovery.mjs, and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
```
````

### Target shown text

````text
# Contract: Activation Binding

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe workspace activation records for project-local fgOS runtime selection
Design status: Candidate
Contract design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs, src/setup/bin-discovery.mjs, and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -4,7 +4,8 @@
 Document type: Contract
 Audience: Maintainer, implementation agent, reviewer
 Purpose: Describe workspace activation records for project-local fgOS runtime selection
-Design status: Frozen (V1)
+Design status: Candidate
+Contract design status: Frozen (V1)
 Implementation status: Implemented
 Canonical: Yes, after review
 Owner: Packaging-distribution
@@ -15,4 +16,12 @@
 - docs/platform/packaging-distribution/contracts/release-manifest.md
 - packages/distribution/rust/src/init.rs
 - packages/distribution/rust/tests/schema_golden.rs
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_d24087e433e165f4326223636687eca3

Binding and proposed decision:

```json
{
  "claimId": "claim_d24087e433e165f4326223636687eca3",
  "path": "docs/platform/packaging-distribution/contracts/distribution-pin.md",
  "anchor": "contract-distribution-pin",
  "beforeUnitDigest": "5bdd58c4e3e888becf790f231e48a8bcc6b54b4eba60cd133d9e78bb38fd7a1b",
  "afterUnitDigest": "f7d56ca839c1d347e3d63c3d96fa64fe6ac987704b45b97fd2d203173cf87c51",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `c925fd3114d69ad4864bba92c359c29ec7c70a2503d3f6f82a007a7535a16945`

Target shown SHA256: `596c36f8cb3d59337159fbfe0e8572b64f9917ef2005f8a03d614805ac17d495`

### Source shown text

````text
# Contract: Distribution Pin

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe the tracked project runtime pin for packaging-distribution
Design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/contracts/activation-binding.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
```
````

### Target shown text

````text
# Contract: Distribution Pin

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Describe the tracked project runtime pin for packaging-distribution
Design status: Candidate
Contract design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of packages/distribution/rust/src/init.rs and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/contracts/activation-binding.md
- packages/distribution/rust/src/init.rs
- packages/distribution/rust/tests/schema_golden.rs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -4,7 +4,8 @@
 Document type: Contract
 Audience: Maintainer, implementation agent, reviewer
 Purpose: Describe the tracked project runtime pin for packaging-distribution
-Design status: Frozen (V1)
+Design status: Candidate
+Contract design status: Frozen (V1)
 Implementation status: Implemented
 Canonical: Yes, after review
 Owner: Packaging-distribution
@@ -14,4 +15,12 @@
 - docs/platform/packaging-distribution/contracts/activation-binding.md
 - packages/distribution/rust/src/init.rs
 - packages/distribution/rust/tests/schema_golden.rs
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_f1a29b57921412048eedbdacc72223de

Binding and proposed decision:

```json
{
  "claimId": "claim_f1a29b57921412048eedbdacc72223de",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "contract-instruction-composition-and-projection",
  "beforeUnitDigest": "64c3f5b478acc1ecb6f9b4fc7d09581924009d09999f6812d4076991db584412",
  "afterUnitDigest": "0c2be2cd4196e516676639cd41febbb91d7f60def81df4a49d11283b6020a18c",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `a91c11f0ba418744903af3575b16e6d76e7e904733b95dae5afb96bf4a83b8e0`

Target shown SHA256: `554b4606137ec830c04f5644b95e06dda99d5a2a2e9fe04c432205c85616ba4e`

### Source shown text

````text
# Contract: Instruction Composition And Projection

```txt
Document type: Contract
Audience: Maintainer, component owner, domain owner, implementation agent
Purpose: Define how fgOS instruction fragments compose into effective agent instructions and render into host-visible files
Design status: Draft
Implementation status: Implemented for source registry, composition engine, portable AGENTS.md rendering, and instruction projection repair; host-specific adapter expansion remains demand-driven
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Architecture discussion
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/contracts/projection-ledger.md
```
````

### Target shown text

````text
# Contract: Instruction Composition And Projection

```txt
Document type: Contract
Audience: Maintainer, component owner, domain owner, implementation agent
Purpose: Define how fgOS instruction fragments compose into effective agent instructions and render into host-visible files
Design status: Draft
Implementation status: Implemented for source registry, composition engine, portable AGENTS.md rendering, and instruction projection repair; host-specific adapter expansion remains demand-driven
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Architecture discussion
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/contracts/projection-ledger.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -15,4 +15,12 @@
 - docs/platform/packaging-distribution/spec.md
 - docs/platform/packaging-distribution/contracts/skill-package-distribution.md
 - docs/platform/packaging-distribution/contracts/projection-ledger.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_af9b830284eae47ca28764fb9f092baf

Binding and proposed decision:

```json
{
  "claimId": "claim_af9b830284eae47ca28764fb9f092baf",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "contract-projection-ledger",
  "beforeUnitDigest": "224d55b32cb43bcf2b910992482e4d35d811caa996219b82919f8f3757871acc",
  "afterUnitDigest": "17d2ab4ea33154ce9a51159bc15bdc14f4a0c7d5ae254e369e199e1255a3cfbc",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `498a7cb1f17875550fb62f47b667650d3bd95b286d644e2be963d8958456aaaf`

Target shown SHA256: `a028e6991dff33cf719b2eac49a41958f4337b03daca5618a6fd8b5dca3e3161`

### Source shown text

````text
# Contract: Projection Ledger

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Track the intended projection ledger boundary for packaging-distribution
Design status: Draft
Implementation status: Partial: instruction projections have a ledger entry and doctor/fix repair; skill and wider host projections remain follow-up
Canonical: Yes, after review
Owner: Platform documentation
Source type: Architecture discussion
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
```
````

### Target shown text

````text
# Contract: Projection Ledger

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Track the intended projection ledger boundary for packaging-distribution
Design status: Draft
Implementation status: Partial: instruction projections have a ledger entry and doctor/fix repair; skill and wider host projections remain follow-up
Canonical: Yes, after review
Owner: Platform documentation
Source type: Architecture discussion
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -13,4 +13,12 @@
 Related:
 - docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
 - docs/platform/packaging-distribution/verification/implementation-alignment.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_c1398a168fb773262044e87ae67c5afe

Binding and proposed decision:

```json
{
  "claimId": "claim_c1398a168fb773262044e87ae67c5afe",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "contract-release-manifest",
  "beforeUnitDigest": "0858e2161700732f262bee151a56bad4fa409ed8a31402266bd5dc432e978d4d",
  "afterUnitDigest": "4618afea8cedfea70ca34fbabe52930a198ea86598269b7e55e1a3f104a8a89e",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `75339ff99b19e7436789e6a5da2dbbee032f43be7034be16ef379c6ccfeaea94`

Target shown SHA256: `dd9a91ace53a5a9c9a48cdc826cce23d884a4d1565aeda6c89d13fa71acfc920`

### Source shown text

````text
# Contract: Release Manifest

```txt
Document type: Contract
Audience: Maintainer, release engineer, implementation agent
Purpose: Describe the fgOS release manifest contract used by packaging-distribution
Design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of scripts/build-rust-distribution.mjs, packages/distribution/rust/src/manifest.rs, and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- packages/distribution/rust/src/manifest.rs
- packages/distribution/rust/tests/schema_golden.rs
- scripts/build-rust-distribution.mjs
```
````

### Target shown text

````text
# Contract: Release Manifest

```txt
Document type: Contract
Audience: Maintainer, release engineer, implementation agent
Purpose: Describe the fgOS release manifest contract used by packaging-distribution
Design status: Candidate
Contract design status: Frozen (V1)
Implementation status: Implemented
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code scan of scripts/build-rust-distribution.mjs, packages/distribution/rust/src/manifest.rs, and packages/distribution/rust/tests/schema_golden.rs
Last reviewed: 2026-09-14
Related:
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- packages/distribution/rust/src/manifest.rs
- packages/distribution/rust/tests/schema_golden.rs
- scripts/build-rust-distribution.mjs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -4,7 +4,8 @@
 Document type: Contract
 Audience: Maintainer, release engineer, implementation agent
 Purpose: Describe the fgOS release manifest contract used by packaging-distribution
-Design status: Frozen (V1)
+Design status: Candidate
+Contract design status: Frozen (V1)
 Implementation status: Implemented
 Canonical: Yes, after review
 Owner: Packaging-distribution
@@ -15,4 +16,12 @@
 - packages/distribution/rust/src/manifest.rs
 - packages/distribution/rust/tests/schema_golden.rs
 - scripts/build-rust-distribution.mjs
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_396859ab9821f94fd19d211675673edd

Binding and proposed decision:

```json
{
  "claimId": "claim_396859ab9821f94fd19d211675673edd",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "contract-repository-runtime-layout",
  "beforeUnitDigest": "87943c78c8cb6a9c45b3a1fcd061fc04b5395f8438cc67fbd61bf3a40a0d630f",
  "afterUnitDigest": "85ecf3fb528db0c8aa9deae14f88ed3cb36f166bbae3615e6e01737d7788535e",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `84d72a5c431f6da64d8519cf338bd000450b7117da0382e37f10308721c19890`

Target shown SHA256: `599a36d4f338c14ec0d391ef4b60a2d5b63785c311d3661bbb18f66dee6187f4`

### Source shown text

````text
# Contract: Repository Runtime Layout

```txt
Document type: Contract
Audience: Maintainer, distribution engineer, implementation agent
Purpose: Preserve the repository/workspace/release-store layout boundaries for packaging-distribution
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Promoted from docs/architect/packaging-distribution/runtime-identity-and-activation.md and scope-map.md
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/distribution-pin.md
- docs/platform/packaging-distribution/contracts/projection-ledger.md
- docs/architect/workspace-topology.md
```
````

### Target shown text

````text
# Contract: Repository Runtime Layout

```txt
Document type: Contract
Audience: Maintainer, distribution engineer, implementation agent
Purpose: Preserve the repository/workspace/release-store layout boundaries for packaging-distribution
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Promoted from docs/architect/packaging-distribution/runtime-identity-and-activation.md and scope-map.md
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- docs/platform/packaging-distribution/contracts/activation-binding.md
- docs/platform/packaging-distribution/contracts/distribution-pin.md
- docs/platform/packaging-distribution/contracts/projection-ledger.md
- docs/architect/workspace-topology.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -17,4 +17,12 @@
 - docs/platform/packaging-distribution/contracts/distribution-pin.md
 - docs/platform/packaging-distribution/contracts/projection-ledger.md
 - docs/architect/workspace-topology.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_dd55d050ee01f01d06f6ee84bef6168a

Binding and proposed decision:

```json
{
  "claimId": "claim_dd55d050ee01f01d06f6ee84bef6168a",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "contract-setup-doctor-registry",
  "beforeUnitDigest": "04f7e138e62d9a4a9b59652f9792cfeabae652ad3080a3840516e9d0ea1b995c",
  "afterUnitDigest": "38dd34d9cb812f932b6ce74f7952bc0d21b98cdcff2add15056d26d85da54463",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `a9568167f37a0d9186ecf81fb71c6883ebaf52233c9ada8dc9d1912139b40836`

Target shown SHA256: `f40678baf836b2f98b8f7caaa20b31d5d054dcd15e9079b8b6e952ce0a4f94a3`

### Source shown text

````text
# Contract: Setup Doctor Registry

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Define the doctor/fix registry contract and legacy setup compatibility used by packaging-distribution
Design status: Draft
Implementation status: Implemented
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md and src/setup/**
Last reviewed: 2026-09-13
Related:
- src/setup/checks.mjs
- src/setup/registrations.mjs
- bin/fgos.mjs
- test/setup/registrations.test.mjs
```
````

### Target shown text

````text
# Contract: Setup Doctor Registry

```txt
Document type: Contract
Audience: Maintainer, implementation agent, reviewer
Purpose: Define the doctor/fix registry contract and legacy setup compatibility used by packaging-distribution
Design status: Draft
Implementation status: Implemented
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md and src/setup/**
Last reviewed: 2026-09-13
Related:
- src/setup/checks.mjs
- src/setup/registrations.mjs
- bin/fgos.mjs
- test/setup/registrations.test.mjs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -15,4 +15,12 @@
 - src/setup/registrations.mjs
 - bin/fgos.mjs
 - test/setup/registrations.test.mjs
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_e465e6b43510bb3eca2a271755c9a22a

Binding and proposed decision:

```json
{
  "claimId": "claim_e465e6b43510bb3eca2a271755c9a22a",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "contract-skill-package-distribution",
  "beforeUnitDigest": "432d9918b9fa97129dec60fdbf8977686e5481eabc7defd2d36f7452e9c99637",
  "afterUnitDigest": "1f9c45bb0841690beabddafd19492f2a27628cd2414d7fad86928d83bff0a1fa",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `95baac3a3d9fa82c8536f1dedae6dbf4b2a6d666fdbd8a56568f2ede9f3560af`

Target shown SHA256: `1cf6d1cfb68ae1eed9f78375ec711353a293405c155b0b1c7ab725ef23196a91`

### Source shown text

````text
# Contract: Skill Package Distribution

```txt
Document type: Contract
Audience: Maintainer, skill author, distribution engineer, implementation agent
Purpose: Define how fgOS skills are authored once and distributed to agent-host surfaces
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code/test scan plus cross-host trigger design discussion
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/contracts/projection-ledger.md
- docs/architect/domainization/README.md
- src/setup/skill-wrappers.mjs
- scripts/build-skill-wrappers.mjs
- test/setup/skill-wrappers.test.mjs
- test/skills/fgos-mirror.test.mjs
```
````

### Target shown text

````text
# Contract: Skill Package Distribution

```txt
Document type: Contract
Audience: Maintainer, skill author, distribution engineer, implementation agent
Purpose: Define how fgOS skills are authored once and distributed to agent-host surfaces
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code/test scan plus cross-host trigger design discussion
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/contracts/projection-ledger.md
- docs/architect/domainization/README.md
- src/setup/skill-wrappers.mjs
- scripts/build-skill-wrappers.mjs
- test/setup/skill-wrappers.test.mjs
- test/skills/fgos-mirror.test.mjs
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -18,4 +18,12 @@
 - scripts/build-skill-wrappers.mjs
 - test/setup/skill-wrappers.test.mjs
 - test/skills/fgos-mirror.test.mjs
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_997439719d7a23e6ec3438a35cda7f98

Binding and proposed decision:

```json
{
  "claimId": "claim_997439719d7a23e6ec3438a35cda7f98",
  "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
  "anchor": "history-distribution-baseline",
  "beforeUnitDigest": "cdd9ed931e84faff903113466c01d48f578d84af2208bc2a96e3fb6ceea93c6e",
  "afterUnitDigest": "b57fe4039be08296553e47795d1a22410c52ee030475f3cc98e711ccef7631dd",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `9ae3282f98cdc7a4cb900a223efdaae4913f5a22c1f31b85232a31af7b9f078f`

Target shown SHA256: `d6a28ee725526e4afb16557e5c9561ce70e691c54c283c3658a7d8bd3c1008c0`

### Source shown text

````text
# History: Distribution Baseline

```txt
Document type: History
Audience: Maintainer, architecture reviewer, documentation agent
Purpose: Preserve old distribution baseline and rationale while new packaging-distribution docs become canonical
Design status: Draft
Implementation status: Historical source
Canonical: Yes, after review
Owner: Platform documentation
Source type: Condensed from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/history/distribution-baseline.md
Last reviewed: 2026-09-13
Related:
- docs/specs/distribution.md
- docs/distribution-vision.md
- docs/platform/packaging-distribution/vision.md
- docs/architect/packaging-distribution/history/distribution-baseline.md
```
````

### Target shown text

````text
# History: Distribution Baseline

```txt
Document type: History
Audience: Maintainer, architecture reviewer, documentation agent
Purpose: Preserve old distribution baseline and rationale while new packaging-distribution docs become canonical
Design status: Draft
Implementation status: Historical source
Canonical: Yes, after review
Owner: Platform documentation
Source type: Condensed from docs/specs/distribution.md, docs/distribution-vision.md, and docs/architect/packaging-distribution/history/distribution-baseline.md
Last reviewed: 2026-09-13
Related:
- docs/specs/distribution.md
- docs/distribution-vision.md
- docs/platform/packaging-distribution/vision.md
- docs/architect/packaging-distribution/history/distribution-baseline.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -15,4 +15,12 @@
 - docs/distribution-vision.md
 - docs/platform/packaging-distribution/vision.md
 - docs/architect/packaging-distribution/history/distribution-baseline.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_2d158e290f6214402960912042281588

Binding and proposed decision:

```json
{
  "claimId": "claim_2d158e290f6214402960912042281588",
  "path": "docs/platform/packaging-distribution/reports/track-closeout.md",
  "anchor": "packaging-distribution-code-panel-track-closeout",
  "beforeUnitDigest": "a5e58c321a82ff4bbc6634bcf7c4c8d8fb9395cecb4772c0a2a9a23f87e5161e",
  "afterUnitDigest": "d39c503de1c73aa7c8921930f3c6ef0a6150a7cb2bdb54e74d7569c4636badec",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `345d3bcd7de70f9d891f83f1d16f87538073b8b6d1d3148566ed02205ed3888b`

Target shown SHA256: `9509774f86f22ee52273cbaae6ba6560269bb931f89be3574ea044b356caefcb`

### Source shown text

````text
# Packaging-Distribution Code-Panel Track Closeout

```txt
Document type: Verification closeout
Audience: Packaging-distribution coordinator, release owner, maintainer
Purpose: Record packet merge commits, proof commands, remaining partial claims, and release decisions for the packaging-distribution code-panel track
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code-panel packet reports, panel branch verification, and packaging-distribution verification docs
Last reviewed: 2026-09-21
Related:
- docs/platform/packaging-distribution/code-panel-rollout-plan.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
- docs/platform/packaging-distribution/verification/install-and-release-proof.md
```
````

### Target shown text

````text
# Packaging-Distribution Code-Panel Track Closeout

```txt
Document type: Verification closeout
Audience: Packaging-distribution coordinator, release owner, maintainer
Purpose: Record packet merge commits, proof commands, remaining partial claims, and release decisions for the packaging-distribution code-panel track
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Code-panel packet reports, panel branch verification, and packaging-distribution verification docs
Last reviewed: 2026-09-21
Related:
- docs/platform/packaging-distribution/code-panel-rollout-plan.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
- docs/platform/packaging-distribution/verification/install-and-release-proof.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -15,4 +15,12 @@
 - docs/platform/packaging-distribution/verification/implementation-alignment.md
 - docs/platform/packaging-distribution/verification/source-preservation-audit.md
 - docs/platform/packaging-distribution/verification/install-and-release-proof.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_766fced0f59d762a00ba6c24956fe2a1

Binding and proposed decision:

```json
{
  "claimId": "claim_766fced0f59d762a00ba6c24956fe2a1",
  "path": "docs/platform/packaging-distribution/spec.md",
  "anchor": "spec-packaging-distribution",
  "beforeUnitDigest": "4e7b4b67546d1f73080e686b71c0d2020abeea20ba788c78e6f0e3bce6b5ea6d",
  "afterUnitDigest": "5251cb3d11a2a508b8b450f7af374c43c8fb8e46b5d0c2496dadd30bdc7123dd",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `b0e08d56d3d3d1b00ecef275ab85bd9a5ca60e1cdc36b5ca8cc691cd4a28cd17`

Target shown SHA256: `9cbd8c476c998ec252e408f7dac5c9237e5c1de0c14b4dca778476186c92c7e6`

### Source shown text

````text
# Spec: Packaging-Distribution

```txt
Document type: Area spec
Audience: Human reviewer, maintainer, implementation agent
Purpose: State the user-visible and maintainer-visible behavior of fgOS packaging/distribution
Design status: Draft
Implementation status: Implemented preview plus tracked partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md, README.md, code/test scan
Last reviewed: 2026-10-13
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/specs/distribution.md
- docs/distribution-vision.md
```
````

### Target shown text

````text
# Spec: Packaging-Distribution

```txt
Document type: Area spec
Audience: Human reviewer, maintainer, implementation agent
Purpose: State the user-visible and maintainer-visible behavior of fgOS packaging/distribution
Design status: Draft
Implementation status: Implemented preview plus tracked partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from docs/specs/distribution.md, README.md, code/test scan
Last reviewed: 2026-10-13
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/specs/distribution.md
- docs/distribution-vision.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -15,4 +15,12 @@
 - docs/platform/packaging-distribution/verification/implementation-alignment.md
 - docs/specs/distribution.md
 - docs/distribution-vision.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_00cb8d97dde54957c4257b56edadc0b3

Binding and proposed decision:

```json
{
  "claimId": "claim_00cb8d97dde54957c4257b56edadc0b3",
  "path": "docs/platform/packaging-distribution/verification/implementation-alignment.md",
  "anchor": "verification-implementation-alignment",
  "beforeUnitDigest": "ca21da296865e98b19295d4bf4f87786bfd30d20de414e9ff1f4938372045bc4",
  "afterUnitDigest": "b153a020d05c4a4b75fbe878fcf2607aa003f76c664d5df0bd2c0253e18cc4a3",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `8e8b1a3bdaf4ebdac5d1d61992569470a83fc1e169193bc45c5c9613d518bb11`

Target shown SHA256: `448c39afbc0ca4064cf971d44ab6189ca9b6dced8b1076a418afc9621d63518a`

### Source shown text

````text
# Verification: Implementation Alignment

```txt
Document type: Verification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Track how far packaging-distribution implementation matches the design
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Platform documentation
Source type: Code/test/doc scan
Last reviewed: 2026-09-21
Related:
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
```
````

### Target shown text

````text
# Verification: Implementation Alignment

```txt
Document type: Verification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Track how far packaging-distribution implementation matches the design
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Platform documentation
Source type: Code/test/doc scan
Last reviewed: 2026-09-21
Related:
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
- docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
- docs/platform/packaging-distribution/verification/source-preservation-audit.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -17,4 +17,12 @@
 - docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md
 - docs/platform/packaging-distribution/contracts/skill-package-distribution.md
 - docs/platform/packaging-distribution/verification/source-preservation-audit.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_3990ab03a5ae3863d109e1620b08342f

Binding and proposed decision:

```json
{
  "claimId": "claim_3990ab03a5ae3863d109e1620b08342f",
  "path": "docs/platform/packaging-distribution/verification/install-and-release-proof.md",
  "anchor": "verification-install-and-release-proof",
  "beforeUnitDigest": "30a10895cd549b1f862b42d08d328fdcb6116ea4e71b2697fd2b0448a6c20488",
  "afterUnitDigest": "b536df35579fdec9aa3e707668bc304c05b1ba8179c9d607652b03167251f07d",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `b8d0b7b8ccea3ee947c1fb94127b660f4824a3ee5068e364b196fa56193eef41`

Target shown SHA256: `f5216596b7fd152f218084260e687347268fc26264d60ed33765b821e2e89452`

### Source shown text

````text
# Verification: Install And Release Proof

```txt
Document type: Verification
Audience: Reviewer, maintainer, release engineer, implementation agent
Purpose: List proof paths for packaging, install, release, activation, doctor/fix behavior, and legacy setup compatibility
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Platform documentation
Source type: Code/test scan
Last reviewed: 2026-09-21
Related:
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
```
````

### Target shown text

````text
# Verification: Install And Release Proof

```txt
Document type: Verification
Audience: Reviewer, maintainer, release engineer, implementation agent
Purpose: List proof paths for packaging, install, release, activation, doctor/fix behavior, and legacy setup compatibility
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Platform documentation
Source type: Code/test scan
Last reviewed: 2026-09-21
Related:
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/skill-package-distribution.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -13,4 +13,12 @@
 Related:
 - docs/platform/packaging-distribution/verification/implementation-alignment.md
 - docs/platform/packaging-distribution/contracts/skill-package-distribution.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_eb945163c0239deaa6c6170e39d9e4ef

Binding and proposed decision:

```json
{
  "claimId": "claim_eb945163c0239deaa6c6170e39d9e4ef",
  "path": "docs/platform/packaging-distribution/verification/source-preservation-audit.md",
  "anchor": "verification-source-preservation-audit",
  "beforeUnitDigest": "83e1ffd2e66420162ecf81eab407f19724ea64973488fb0c8eaf0bc68f1d34a4",
  "afterUnitDigest": "656f2d125f093f0876577455016ddc2d8405150ab4a6f1013f35102200cf404e",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `c0fbae8fef35fb759aca92bfeb002ac14ef20072e6f7c08749c21673cc778db2`

Target shown SHA256: `442cd49b1d89f4f3d4c9078c051574044bf7d54f11ed3b88e49c4673ac9c7133`

### Source shown text

````text
# Verification: Source Preservation Audit

```txt
Document type: Verification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Track whether legacy and history packaging-distribution details were preserved during promotion into platform docs
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Audit of docs/specs/distribution.md, docs/distribution-vision.md, docs/architect/packaging-distribution/**, and docs/platform/packaging-distribution/**
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
```
````

### Target shown text

````text
# Verification: Source Preservation Audit

```txt
Document type: Verification
Audience: Human reviewer, maintainer, implementation agent
Purpose: Track whether legacy and history packaging-distribution details were preserved during promotion into platform docs
Design status: Draft
Implementation status: Current evidence snapshot
Canonical: Yes, after review
Owner: Packaging-distribution
Source type: Audit of docs/specs/distribution.md, docs/distribution-vision.md, docs/architect/packaging-distribution/**, and docs/platform/packaging-distribution/**
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -14,4 +14,12 @@
 - docs/platform/packaging-distribution/README.md
 - docs/platform/packaging-distribution/verification/implementation-alignment.md
 - docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_20fe0ac3d62c50bf718792466734d0a7

Binding and proposed decision:

```json
{
  "claimId": "claim_20fe0ac3d62c50bf718792466734d0a7",
  "path": "docs/platform/packaging-distribution/vision.md",
  "anchor": "vision-packaging-distribution",
  "beforeUnitDigest": "36ead5156e013921474b30f0099672067077f4083d19576ec32ab416e9a2b95f",
  "afterUnitDigest": "b5eb2b54f66e628baaf779c84d48806d17155a69ffd9fcbc909d9a62bd2f05a9",
  "cause": "additive candidate metadata changes the direct heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `db43b0298a274d317d69da23e5a1bd11df3485521fa20476d49ebff64db2bf07`

Target shown SHA256: `ed62e36adcdec0f2ce792fb8c35b1aed6d71c8284752a407524298109697b4c2`

### Source shown text

````text
# Vision: Packaging-Distribution

```txt
Document type: Vision
Audience: Human reviewer, maintainer, architect, implementation agent
Purpose: State the living direction for fgOS packaging, install, doctor/fix readiness, and runtime activation
Design status: Draft
Implementation status: Implemented preview plus tracked partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted and reconciled from docs/distribution-vision.md
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/distribution-vision.md
```
````

### Target shown text

````text
# Vision: Packaging-Distribution

```txt
Document type: Vision
Audience: Human reviewer, maintainer, architect, implementation agent
Purpose: State the living direction for fgOS packaging, install, doctor/fix readiness, and runtime activation
Design status: Draft
Implementation status: Implemented preview plus tracked partials
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted and reconciled from docs/distribution-vision.md
Last reviewed: 2026-09-18
Related:
- docs/platform/packaging-distribution/README.md
- docs/platform/packaging-distribution/spec.md
- docs/platform/packaging-distribution/verification/implementation-alignment.md
- docs/distribution-vision.md
Implementation: Original section-specific implementation statements retained; carriage is pending independent review
Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
Writer type: Human + agent coauthor
Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
Use this when: Reading this area topic and its retained design details
Do not use this for: Claiming a truth review or an authority cutover from carriage alone
Supersedes: No authority transition in this carriage pass
Superseded by: None recorded
```
````

### Unified diff

````diff
--- source
+++ target
@@ -15,4 +15,12 @@
 - docs/platform/packaging-distribution/spec.md
 - docs/platform/packaging-distribution/verification/implementation-alignment.md
 - docs/distribution-vision.md
+Implementation: Original section-specific implementation statements retained; carriage is pending independent review
+Provenance: Existing area document plus source-detail carriage at 77830ba77eb05991d95b005919776ee6254e833b
+Writer type: Human + agent coauthor
+Canonical for: The topic stated by this document, subject to the unchanged switchboard route and independent review
+Use this when: Reading this area topic and its retained design details
+Do not use this for: Claiming a truth review or an authority cutover from carriage alone
+Supersedes: No authority transition in this carriage pass
+Superseded by: None recorded
 ```
````

## claim_bed90dbb7de2a5782fafcdb4a3d6e0da

Binding and proposed decision:

```json
{
  "claimId": "claim_bed90dbb7de2a5782fafcdb4a3d6e0da",
  "path": "docs/specs/confinement-authority.md",
  "anchor": "132-login-được-gia-hạn-trong-private-home-bản-chép-là-snapshot-bản-mới-hơn-được-ghi-ngược",
  "beforeUnitDigest": "486a5222b8b8ff44660b47637686763da38687c0ae36669035b95098f218180b",
  "afterUnitDigest": "9bf3a0ea66134dd8849e9c600e3a571c1190fbf1bc714ebe3c23a096c6d445ee",
  "cause": "main-only changed clause alters its containing heading payload",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:8@2026-10-13"
}
```

Source shown SHA256: `6bf97fa5063dc320916215ee14122993136c34aa279905b1076f3b8ddd32251d`

Target shown SHA256: `ab19e61dfddeaa8407522f90a03487a8e47d1440ba4c9fdd0955f316b9aa8c23`

### Source shown text

```text
### 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược

Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):

- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.
- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (tối đa 5 bản mới nhất mỗi account) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Home cũng vẫn bị giữ khi `pending/` đã đầy và login của nó chỉ có thể được dàn (để trần không đẩy mất bản cũ hơn); bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.
```

### Target shown text

```text
### 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược

Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):

- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.
- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi account, nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.
```

### Unified diff

```diff
--- source
+++ target
@@ -3,4 +3,4 @@
 Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):
 
 - **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.
-- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (tối đa 5 bản mới nhất mỗi account) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Home cũng vẫn bị giữ khi `pending/` đã đầy và login của nó chỉ có thể được dàn (để trần không đẩy mất bản cũ hơn); bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.+- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (giới hạn 5 bản mỗi account, nhưng chỉ bản dư thừa mới bị bỏ: sau khi áp các bản pending dưới account lock, bản có login trùng hệt một bản pending khác thì bị bỏ khi account vượt giới hạn, bản mới nhất của mỗi nhóm trùng được giữ; bản không chứng minh được là dư thừa hay lỗi thời thì không bao giờ bị bỏ để nhường chỗ, nên account có thể vượt giới hạn và check doctor báo; bản do probe ghi dở được giữ ở `torn/` cho việc khôi phục thủ công, không bao giờ tự áp hay tự bỏ, và doctor báo ở mọi tuổi; `torn/` chỉ áp cho bản scratch của probe, còn scratch do runner đã chết để lại và pane home có store bị cắt vẫn bị xoá khi JSON không đọc được; bản không parse được thì so theo byte của file store và của write-ahead log hoặc rollback journal không rỗng (file không đọc được, trừ khi không tồn tại, không bao giờ bị coi là không có; index `-shm` không tính); home có file store trùng từng byte với nguồn và không bên nào có write-ahead log hay journal không rỗng thì không renew gì nên không được dàn) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.
```

