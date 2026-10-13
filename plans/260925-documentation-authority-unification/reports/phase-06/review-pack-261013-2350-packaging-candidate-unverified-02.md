# Packaging independent review: candidate-unverified 2

Content pin: `baef3a075899f83d515a28ab66abd6c3d55201c5`

Author: `codex-session:8@2026-10-13`; assembler: `codex-session:9@2026-10-13`. All proposals remain pending.

## claim_23e20ecd95a04621181062bb791349ad

```json
{
  "claimId": "claim_23e20ecd95a04621181062bb791349ad",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-11",
  "unitDigest": "c66015f893d27851664b2ae37ddbdee03e1995290837838777b05b60741b9e08",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c66015f893d27851664b2ae37ddbdee03e1995290837838777b05b60741b9e08`

````text
```txt
core/instructions/
components/<component>/instructions/
domains/<domain>/instructions/
```
````
## claim_47cecae2e17150739955ace685ff6713

```json
{
  "claimId": "claim_47cecae2e17150739955ace685ff6713",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-12",
  "unitDigest": "360cdee6ade096eb6b813f44817340c6f4e17b948e97cff2af775df9bd3f3438",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `360cdee6ade096eb6b813f44817340c6f4e17b948e97cff2af775df9bd3f3438`

```text
| Instruction type | Canonical source |
| --- | --- |
| Platform law or repo-wide operating rule | Root platform source, root instruction source, or locked platform law document when the law itself is documentary authority |
| Domain doctrine | `domains/<domain>/instructions/` or another domain-owned instruction source |
| Component-specific procedure | `components/<component>/instructions/` or another component-owned source root |
| Skill-specific operating rule | Canonical skill source |
| Host syntax wrapper | Generated adapter target, not canonical source |
```
## claim_7bc6b869e492a1728318b89b366f496b

```json
{
  "claimId": "claim_7bc6b869e492a1728318b89b366f496b",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-13",
  "unitDigest": "9a8d87a2315f8ec81052361ba1c3ae3c24a0e6d0c949aae71eeaa73d777d8bcf",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `9a8d87a2315f8ec81052361ba1c3ae3c24a0e6d0c949aae71eeaa73d777d8bcf`

```text
Component and domain additions must not hand-edit generated projections directly. They register canonical fragments and let the projection path render the correct host/workspace files.
```
## claim_b37fb14bb029c7b11d2c0d3d05626b4f

```json
{
  "claimId": "claim_b37fb14bb029c7b11d2c0d3d05626b4f",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-14",
  "unitDigest": "c2c1bc0565c362c74e3e74d45051265687e36dc33ffcb3d667ee81c9ad0211ef",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c2c1bc0565c362c74e3e74d45051265687e36dc33ffcb3d667ee81c9ad0211ef`

```text
Allowed component and domain owners are resolved authoritatively from `docs/architecture-manifest.json` (or explicitly configured known owners). Unregistered component or domain roots are rejected by default discovery. Custom roots are internal/test-only options for fixture isolation and cannot be used by production default discovery.
```
## claim_06d17d7e783993acbb420e611a962ebf

```json
{
  "claimId": "claim_06d17d7e783993acbb420e611a962ebf",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "5-instruction-unit",
  "unitDigest": "c3b59a0e3b493b79a9539e02b23e6f9918f84eb630cc80dbf2ba0f60aab6c92d",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `59c636bebddc027c740b1ba3f93639c0f51d01768abb436d04666145156981db`

````text
## 5. Instruction Unit

Each instruction fragment should compile into a machine-readable instruction unit:

```txt
id
owner
sourcePath
scope
kind
mode
appliesTo
specificity
dependsOn?
refines?
supersedes?
conflictsWith?
renderHints?
```

Required meanings:

| Field | Meaning |
| --- | --- |
| `id` | Stable rule id, unique across the effective set unless explicitly superseded. |
| `owner` | Component/domain/platform authority that owns the rule. |
| `scope` | Where the rule applies: repo, domain, component, command, skill, host, or session. |
| `kind` | Rule force: `law`, `boundary`, `procedure`, `host-adapter`, or `preference`. |
| `mode` | Composition operation: `append`, `refine`, `override`, or `forbid`. |
| `appliesTo` | Host/runtime audience filter. |
| `specificity` | Scope distance used after kind and explicit relationships. |
````
## claim_7f8341785c1570d5f4e1020e6209de3a

```json
{
  "claimId": "claim_7f8341785c1570d5f4e1020e6209de3a",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-15",
  "unitDigest": "dc0a86cf4873dfc973924ff27ca6db4d892bbf2efdfcdd8c0391aa84751bb5d8",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `dc0a86cf4873dfc973924ff27ca6db4d892bbf2efdfcdd8c0391aa84751bb5d8`

```text
Each instruction fragment should compile into a machine-readable instruction unit:
```
## claim_928dfe40c7c06aec84eb289415c329a3

```json
{
  "claimId": "claim_928dfe40c7c06aec84eb289415c329a3",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-16",
  "unitDigest": "a93761cb051031cbcdb51863dd4bab0f9cde566573397cedb10c0233b00ba123",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a93761cb051031cbcdb51863dd4bab0f9cde566573397cedb10c0233b00ba123`

````text
```txt
id
owner
sourcePath
scope
kind
mode
appliesTo
specificity
dependsOn?
refines?
supersedes?
conflictsWith?
renderHints?
```
````
## claim_b7178498da20dcb25ec0e72bddd8400d

```json
{
  "claimId": "claim_b7178498da20dcb25ec0e72bddd8400d",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-17",
  "unitDigest": "d946484f62cad9d4ca629308fc5a4094a7ebc7763713ae58bb92324d87192712",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d946484f62cad9d4ca629308fc5a4094a7ebc7763713ae58bb92324d87192712`

```text
Required meanings:

| Field | Meaning |
| --- | --- |
| `id` | Stable rule id, unique across the effective set unless explicitly superseded. |
| `owner` | Component/domain/platform authority that owns the rule. |
| `scope` | Where the rule applies: repo, domain, component, command, skill, host, or session. |
| `kind` | Rule force: `law`, `boundary`, `procedure`, `host-adapter`, or `preference`. |
| `mode` | Composition operation: `append`, `refine`, `override`, or `forbid`. |
| `appliesTo` | Host/runtime audience filter. |
| `specificity` | Scope distance used after kind and explicit relationships. |
```
## claim_d13a8f7b485a3fdc14d0dc22b02ccd70

```json
{
  "claimId": "claim_d13a8f7b485a3fdc14d0dc22b02ccd70",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "6-rule-force",
  "unitDigest": "cf2a642c3cd096c0c688e491fd34f66cb6edaa5a526cdf5c29080d54624e2e0a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e9a85746c4c8c372fe9181111e5f0b9f2d7d1baa2b6d1a5a1d867a17c5e67a80`

```text
## 6. Rule Force

Composition must classify rule force before sorting by textual order.

| Kind | Rule |
| --- | --- |
| `law` | Cannot be overridden by narrower scopes. It may only be superseded by the required decision/review process for that law. |
| `boundary` | Declares authority. Conflicts fail the composition instead of picking a winner. |
| `procedure` | Default operating procedure. Narrower scopes may refine it if the source permits refinement. |
| `host-adapter` | Describes host syntax or packaging. It cannot change semantic meaning. |
| `preference` | Advisory/default behavior. Narrower scopes may override it. |

Priority numbers may break ties within the same kind and scope. They must not be the primary source of authority.
```
## claim_fd01cba6b586d9e7a81c863934f65106

```json
{
  "claimId": "claim_fd01cba6b586d9e7a81c863934f65106",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-18",
  "unitDigest": "cd77fdcec34fb0a8b5dd41263a5972fdd9d78bd3383270cedeb0e5fb3d484507",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `cd77fdcec34fb0a8b5dd41263a5972fdd9d78bd3383270cedeb0e5fb3d484507`

```text
Composition must classify rule force before sorting by textual order.
```
## claim_df00b57a86156eea51537eff77baf9a4

```json
{
  "claimId": "claim_df00b57a86156eea51537eff77baf9a4",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-19",
  "unitDigest": "d3c0f15ffbff77b69bf27a52fb4facba944b688eebd187f662188a19df678b48",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d3c0f15ffbff77b69bf27a52fb4facba944b688eebd187f662188a19df678b48`

```text
| Kind | Rule |
| --- | --- |
| `law` | Cannot be overridden by narrower scopes. It may only be superseded by the required decision/review process for that law. |
| `boundary` | Declares authority. Conflicts fail the composition instead of picking a winner. |
| `procedure` | Default operating procedure. Narrower scopes may refine it if the source permits refinement. |
| `host-adapter` | Describes host syntax or packaging. It cannot change semantic meaning. |
| `preference` | Advisory/default behavior. Narrower scopes may override it. |
```
## claim_8366d90840255fbd14e153bc18308ecd

```json
{
  "claimId": "claim_8366d90840255fbd14e153bc18308ecd",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-20",
  "unitDigest": "c99db16e39712efdf185387e263b3788b872ef103a20b040490efc493a70e899",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c99db16e39712efdf185387e263b3788b872ef103a20b040490efc493a70e899`

```text
Priority numbers may break ties within the same kind and scope. They must not be the primary source of authority.
```
## claim_44bbd5580e22c611ec2b7c301c46a01f

```json
{
  "claimId": "claim_44bbd5580e22c611ec2b7c301c46a01f",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "7-composition-order",
  "unitDigest": "8b0d6b742f0933ac8b9d98d769e06e444d3038983657b5a53030df6ca3c40534",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `2cc92b0f8318432ad0e47c4b0d716ce793baf369debe5b63a092e17376db099a`

````text
## 7. Composition Order

The target order is:

```txt
laws
  -> boundaries
  -> procedures from broad to narrow
  -> preferences from broad to narrow
  -> host adapters last
```

Scope specificity, broad to narrow:

```txt
platform/repo
  -> component
  -> domain
  -> workspace/project
  -> command
  -> skill
  -> session
```

Host adapters run last because they translate an already-composed instruction set into host syntax. They must not silently drop or alter semantic rules unless `appliesTo` excludes that host.
````
## claim_fdf659ad4dd4b5e1d4a118859bbaa4a3

```json
{
  "claimId": "claim_fdf659ad4dd4b5e1d4a118859bbaa4a3",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-21",
  "unitDigest": "e8d47d1ecd68936932a8a88d39dd7e836b44283cd320be8a064bb360be89fc00",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e8d47d1ecd68936932a8a88d39dd7e836b44283cd320be8a064bb360be89fc00`

````text
The target order is:

```txt
laws
  -> boundaries
  -> procedures from broad to narrow
  -> preferences from broad to narrow
  -> host adapters last
```
````
## claim_8d1aa545aa7b26b88df1c22a4e05c2e8

```json
{
  "claimId": "claim_8d1aa545aa7b26b88df1c22a4e05c2e8",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-22",
  "unitDigest": "1e65dfe55a731661b5ada7bdc782baccd102d08b9d6b357d4f28455f15f1e018",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1e65dfe55a731661b5ada7bdc782baccd102d08b9d6b357d4f28455f15f1e018`

```text
Scope specificity, broad to narrow:
```
## claim_45e36f4c04dc9c674841a1634b78d0be

```json
{
  "claimId": "claim_45e36f4c04dc9c674841a1634b78d0be",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-23",
  "unitDigest": "9ccc88388fe8c2772c0de874236a7f63d82cb0ec7300e1465959450295f5349a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `9ccc88388fe8c2772c0de874236a7f63d82cb0ec7300e1465959450295f5349a`

````text
```txt
platform/repo
  -> component
  -> domain
  -> workspace/project
  -> command
  -> skill
  -> session
```
````
## claim_36fc311cd66903f60d891f10a6483e1e

```json
{
  "claimId": "claim_36fc311cd66903f60d891f10a6483e1e",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-24",
  "unitDigest": "581611b24e9fcfcbb95446d9496a862385c19bbcf76e9082f71c93b66b6a763c",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `581611b24e9fcfcbb95446d9496a862385c19bbcf76e9082f71c93b66b6a763c`

```text
Host adapters run last because they translate an already-composed instruction set into host syntax. They must not silently drop or alter semantic rules unless `appliesTo` excludes that host.
```
## claim_a9bf0a09b17e95de2839fec4391c8c73

```json
{
  "claimId": "claim_a9bf0a09b17e95de2839fec4391c8c73",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "8-override-and-conflict-rules",
  "unitDigest": "a54e0fe2262ba050c23173e24fb9ac7ad0f965e3a49ee48e36a572e38bee2c9d",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `5fee210f5e41354f1fefa7bde65ce9026c095743303d4bc8ce34a418bbb22b16`

```text
## 8. Override And Conflict Rules

Override is valid only when the overridden rule permits it.

Refine is valid when a narrower rule narrows, clarifies, or gives an execution-specific form to a broader procedure without contradicting it.

Composition must fail when:

- two active instruction units share the same `id` without a valid supersession relationship;
- two active `boundary` rules assign incompatible authority;
- a narrower rule attempts to override a `law`;
- a host adapter drops an applicable semantic rule;
- a required dependency is missing;
- two fragments require incompatible ordering and neither declares supersession.

Failing composition is preferable to rendering instructions that look complete but have ambiguous effect.
```
## claim_0f8ad5ba9fd7c06f0720ccf33489faa8

```json
{
  "claimId": "claim_0f8ad5ba9fd7c06f0720ccf33489faa8",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-25",
  "unitDigest": "67bda63a75852b3ca818429196ceca8e117090aedfad0bebc03642382a38aeb7",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `67bda63a75852b3ca818429196ceca8e117090aedfad0bebc03642382a38aeb7`

```text
Override is valid only when the overridden rule permits it.
```
## claim_00a5ea60368840c0a4be5e34d3d55617

```json
{
  "claimId": "claim_00a5ea60368840c0a4be5e34d3d55617",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-26",
  "unitDigest": "482862629ece5bbc7185d7cdd9de7061e1a36a09c81e8132270b93d23c7d493f",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `482862629ece5bbc7185d7cdd9de7061e1a36a09c81e8132270b93d23c7d493f`

```text
Refine is valid when a narrower rule narrows, clarifies, or gives an execution-specific form to a broader procedure without contradicting it.
```
## claim_f017ac60a32a5dc6dff387c9eb058318

```json
{
  "claimId": "claim_f017ac60a32a5dc6dff387c9eb058318",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-27",
  "unitDigest": "64a9277ec7211452956a8acaa1fdae96e64d4a4bb6a2865ca6dee04abc5fad43",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `64a9277ec7211452956a8acaa1fdae96e64d4a4bb6a2865ca6dee04abc5fad43`

```text
Composition must fail when:
```
## claim_9651d44f4eb122ba4f5e5963d6d6f556

```json
{
  "claimId": "claim_9651d44f4eb122ba4f5e5963d6d6f556",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-28",
  "unitDigest": "7325d75aa00f232417ab82be15328bf468c039ebf690cac03073261a5aa1c1a7",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `7325d75aa00f232417ab82be15328bf468c039ebf690cac03073261a5aa1c1a7`

```text
- two active instruction units share the same `id` without a valid supersession relationship;
- two active `boundary` rules assign incompatible authority;
- a narrower rule attempts to override a `law`;
- a host adapter drops an applicable semantic rule;
- a required dependency is missing;
- two fragments require incompatible ordering and neither declares supersession.
```
## claim_31883fd0653491568d8b963ff88263c7

```json
{
  "claimId": "claim_31883fd0653491568d8b963ff88263c7",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-29",
  "unitDigest": "a64623552c5d06a59c466dec86780289633a8ef8d43aeda0b663475feaa7c951",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a64623552c5d06a59c466dec86780289633a8ef8d43aeda0b663475feaa7c951`

```text
Failing composition is preferable to rendering instructions that look complete but have ambiguous effect.
```
## claim_fc8e885af36b2a2585acc9ac54536174

```json
{
  "claimId": "claim_fc8e885af36b2a2585acc9ac54536174",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "9-effective-instruction-set",
  "unitDigest": "245a13b4bbc31be9c9f9e6ae196bdae8b493fb4091cf261d585e8b3759876828",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `77c51b307315a39090fc80db788fbac0ec77baf362706afaa67b47e803559196`

````text
## 9. Effective Instruction Set

The composition output should be machine-readable before rendering.

Target path shape:

```txt
.fgos/instructions/effective/repo.json
.fgos/instructions/effective/domain-<domain>.json
.fgos/instructions/effective/component-<component>.json
```

Each effective rule should carry provenance:

```json
{
  "id": "docs-only-verification",
  "kind": "procedure",
  "effectiveText": "Docs-only changes may use doc/render checks instead of runtime test suites.",
  "sources": [
    "AGENTS.md",
    "components/packaging-distribution/instructions/verification.md"
  ],
  "refines": ["default-verification"],
  "supersedes": []
}
```

When someone asks why an instruction did or did not apply, the effective set is the debug surface. Rendered Markdown is not the authority for composition.
````
## claim_9612c56a24c3f985b48774e2a14d7490

```json
{
  "claimId": "claim_9612c56a24c3f985b48774e2a14d7490",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-30",
  "unitDigest": "f318a6c8612c8eba6702da00eecf2aae8a575f22381b5281c6553aa6ea32a128",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f318a6c8612c8eba6702da00eecf2aae8a575f22381b5281c6553aa6ea32a128`

```text
The composition output should be machine-readable before rendering.
```
## claim_7383daefddf2e9ac20dbe144fc955af0

```json
{
  "claimId": "claim_7383daefddf2e9ac20dbe144fc955af0",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-31",
  "unitDigest": "3250a295c1b8d4d74fe25d5bcaa7a6ea25849bc76316630e8eaffab1fa83b224",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `3250a295c1b8d4d74fe25d5bcaa7a6ea25849bc76316630e8eaffab1fa83b224`

````text
Target path shape:

```txt
.fgos/instructions/effective/repo.json
.fgos/instructions/effective/domain-<domain>.json
.fgos/instructions/effective/component-<component>.json
```
````
## claim_6942c9c611162a1883a8b718b7a44cc0

```json
{
  "claimId": "claim_6942c9c611162a1883a8b718b7a44cc0",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-32",
  "unitDigest": "3f4a7e65b9076151fcb87f4d9acc8692747116239d9c494dde4964d01222f5bb",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `3f4a7e65b9076151fcb87f4d9acc8692747116239d9c494dde4964d01222f5bb`

```text
Each effective rule should carry provenance:
```
## claim_07232457de5dc33d9c4f0360880d2590

```json
{
  "claimId": "claim_07232457de5dc33d9c4f0360880d2590",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-33",
  "unitDigest": "dbfd1f9d5652d9d77837c76d46c240c52dd4e462ee47a7d1b8fab52dc38f2acb",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `dbfd1f9d5652d9d77837c76d46c240c52dd4e462ee47a7d1b8fab52dc38f2acb`

````text
```json
{
  "id": "docs-only-verification",
  "kind": "procedure",
  "effectiveText": "Docs-only changes may use doc/render checks instead of runtime test suites.",
  "sources": [
    "AGENTS.md",
    "components/packaging-distribution/instructions/verification.md"
  ],
  "refines": ["default-verification"],
  "supersedes": []
}
```
````
## claim_19cb0ed37840eb9caef07b708fde86aa

```json
{
  "claimId": "claim_19cb0ed37840eb9caef07b708fde86aa",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-34",
  "unitDigest": "290494491cc787e1e2d58e82100135d5eeca79d75d15fb295db92c3b94dc433d",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `290494491cc787e1e2d58e82100135d5eeca79d75d15fb295db92c3b94dc433d`

```text
When someone asks why an instruction did or did not apply, the effective set is the debug surface. Rendered Markdown is not the authority for composition.
```
## claim_7bb898141cb11733192457986b5e8c59

```json
{
  "claimId": "claim_7bb898141cb11733192457986b5e8c59",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "10-projection-targets",
  "unitDigest": "ec719fb0d7e7e03ce7891015c4c9ad3cec9cd47e0a34f00f536e1e7ede68a750",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `99c749a7b364715ff34ab35be125a7fad07e6a3d1f33559ab448db9415e95577`

```text
## 10. Projection Targets

`AGENTS.md` is the primary portable instruction projection when the host supports it.

Host-specific projections are optional adapters:

| Target | Use |
| --- | --- |
| Root `AGENTS.md` | Repo-wide portable instructions. |
| Scoped `AGENTS.md` files | Domain/component/workspace portable instructions. |
| Claude-specific files or plugin text | Only for host syntax, plugin command behavior, or compatibility gaps. |
| Gemini `GEMINI.md` or extension context | Only for extension context, command behavior, or compatibility gaps. |
| Codex/OpenAI adapter files | Only where skill or command packaging needs host-specific structure. |

Do not create `CLAUDE.md`, `GEMINI.md`, or equivalent files merely to duplicate an `AGENTS.md` projection.
```
## claim_03a6535378423b8d239f6b87f72eca9b

```json
{
  "claimId": "claim_03a6535378423b8d239f6b87f72eca9b",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-35",
  "unitDigest": "9c3df6f8127dc6d1b88d319c18e1354710d1311237e2ce82216ad139ce57f61a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `9c3df6f8127dc6d1b88d319c18e1354710d1311237e2ce82216ad139ce57f61a`

```text
`AGENTS.md` is the primary portable instruction projection when the host supports it.
```
## claim_9eac43359798365a1dae9d995dac564f

```json
{
  "claimId": "claim_9eac43359798365a1dae9d995dac564f",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-36",
  "unitDigest": "c5205ecb5c2d59eb2db763663c43ad2fa35924cf2a95dbad4092f881661f7f6e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c5205ecb5c2d59eb2db763663c43ad2fa35924cf2a95dbad4092f881661f7f6e`

```text
Host-specific projections are optional adapters:
```
## claim_9c53837b4909f63f20dc80e3c41c8b83

```json
{
  "claimId": "claim_9c53837b4909f63f20dc80e3c41c8b83",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-37",
  "unitDigest": "da588380798e2028a64a6b9e2c551959bcd0561fe5ab161c48528b7de29877c5",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `da588380798e2028a64a6b9e2c551959bcd0561fe5ab161c48528b7de29877c5`

```text
| Target | Use |
| --- | --- |
| Root `AGENTS.md` | Repo-wide portable instructions. |
| Scoped `AGENTS.md` files | Domain/component/workspace portable instructions. |
| Claude-specific files or plugin text | Only for host syntax, plugin command behavior, or compatibility gaps. |
| Gemini `GEMINI.md` or extension context | Only for extension context, command behavior, or compatibility gaps. |
| Codex/OpenAI adapter files | Only where skill or command packaging needs host-specific structure. |
```
## claim_60cc1bcf44e5ec9fee4885fd8ce0eb10

```json
{
  "claimId": "claim_60cc1bcf44e5ec9fee4885fd8ce0eb10",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-38",
  "unitDigest": "124aedcc07db331be6e6ad9a25c33cb451d166fe08efc282a05baee33b49d38c",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `124aedcc07db331be6e6ad9a25c33cb451d166fe08efc282a05baee33b49d38c`

```text
Do not create `CLAUDE.md`, `GEMINI.md`, or equivalent files merely to duplicate an `AGENTS.md` projection.
```
## claim_f02b5a948879dd8bfb6be5730b8de46e

```json
{
  "claimId": "claim_f02b5a948879dd8bfb6be5730b8de46e",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "11-doctorfix-obligations",
  "unitDigest": "6db979980ef39d45e34f1afff3523b40e3b477b6a5ffd8dac47aef808cee2ac9",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `3d3cad75a8a3633a80770aec14093c2dcf5a1d9d558ae3db25d1a22d2ed588e7`

```text
## 11. Doctor/Fix Obligations

Before instruction composition becomes a release promise, `fgos doctor` and `fgos doctor --fix` should detect and repair:

- stale generated instruction projections;
- invalid instruction registry entries;
- duplicate ids without supersession;
- illegal override/refine relationships;
- host adapter projections that omit applicable semantic rules;
- generated projections edited by hand when provenance says they are managed.

`fgos doctor` remains read-only. `fgos doctor --fix` may regenerate projections through registered fixes. Current legacy `fgos setup` may consume the same fix path while it remains implemented, but new design should not depend on it.
```
## claim_95269aa7569cb746583955f64c92c240

```json
{
  "claimId": "claim_95269aa7569cb746583955f64c92c240",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-39",
  "unitDigest": "748e073891a03b2aee8616e32d86c40698bfc112a1c11b8ca192eb4e4b3b943c",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `748e073891a03b2aee8616e32d86c40698bfc112a1c11b8ca192eb4e4b3b943c`

```text
Before instruction composition becomes a release promise, `fgos doctor` and `fgos doctor --fix` should detect and repair:
```
## claim_6f262e9836759361072287a63a169ad3

```json
{
  "claimId": "claim_6f262e9836759361072287a63a169ad3",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-40",
  "unitDigest": "6be830ef9441eaf3fd797a1c47ef0174ff0cafdcfd2a4521a3cec109c64eb99e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6be830ef9441eaf3fd797a1c47ef0174ff0cafdcfd2a4521a3cec109c64eb99e`

```text
- stale generated instruction projections;
- invalid instruction registry entries;
- duplicate ids without supersession;
- illegal override/refine relationships;
- host adapter projections that omit applicable semantic rules;
- generated projections edited by hand when provenance says they are managed.
```
## claim_4364d7cba36b5848958c3d5f61201031

```json
{
  "claimId": "claim_4364d7cba36b5848958c3d5f61201031",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-41",
  "unitDigest": "954e27f10845a81f1bcc048b5437e4123fea5499ada91d08275a662fdb13349d",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `954e27f10845a81f1bcc048b5437e4123fea5499ada91d08275a662fdb13349d`

```text
`fgos doctor` remains read-only. `fgos doctor --fix` may regenerate projections through registered fixes. Current legacy `fgos setup` may consume the same fix path while it remains implemented, but new design should not depend on it.
```
## claim_05939e4e14b800c18ebc1ef62d34a9c5

```json
{
  "claimId": "claim_05939e4e14b800c18ebc1ef62d34a9c5",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "12-projection-ledger-fit",
  "unitDigest": "ae6f7b4a11ac45ce0cf02b69e45c9b1ff5e18a9003fb70b0693776f0b626841c",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `bea7f3885603f086dfd45f44844ec9029cafd5063dda962b9aa98fd001d2fc4c`

```text
## 12. Projection Ledger Fit

Instruction projections are host-visible generated files. The long-term projection ledger should record:

- selected runtime identity;
- canonical instruction source;
- effective instruction set digest;
- render adapter;
- destination path;
- repair/overwrite ownership.

Instruction projection repair records the portable `AGENTS.md` managed block in `.fgos/installation/projections/ledger.json`. Host-specific adapters should add ledger entries only when adapter behavior requires them.
```
## claim_4bf63d3b37086e89e09ad81ad5807ff6

```json
{
  "claimId": "claim_4bf63d3b37086e89e09ad81ad5807ff6",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-42",
  "unitDigest": "ef1a567e7bc4ad7a4ab70258e08bf5c3ea48d8dfc54c7f151a8bdfaac122bf93",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ef1a567e7bc4ad7a4ab70258e08bf5c3ea48d8dfc54c7f151a8bdfaac122bf93`

```text
Instruction projections are host-visible generated files. The long-term projection ledger should record:
```
## claim_8d2d44ed7fc49066bd660db30c8fc59e

```json
{
  "claimId": "claim_8d2d44ed7fc49066bd660db30c8fc59e",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-43",
  "unitDigest": "e95fe22654ecf8472c0a1abab35dfad282e469e5247309d1b7082ac43e3d0877",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e95fe22654ecf8472c0a1abab35dfad282e469e5247309d1b7082ac43e3d0877`

```text
- selected runtime identity;
- canonical instruction source;
- effective instruction set digest;
- render adapter;
- destination path;
- repair/overwrite ownership.
```
## claim_f18a11e8c27c52ed15ef12e8c234fa5b

```json
{
  "claimId": "claim_f18a11e8c27c52ed15ef12e8c234fa5b",
  "path": "docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md",
  "anchor": "unheaded-block-44",
  "unitDigest": "cc021fe9125fd57a3fb4c22a0b705859c23fc707ba50967a06eb177569a06854",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `cc021fe9125fd57a3fb4c22a0b705859c23fc707ba50967a06eb177569a06854`

```text
Instruction projection repair records the portable `AGENTS.md` managed block in `.fgos/installation/projections/ledger.json`. Host-specific adapters should add ledger entries only when adapter behavior requires them.
```
## claim_af9b830284eae47ca28764fb9f092baf

```json
{
  "claimId": "claim_af9b830284eae47ca28764fb9f092baf",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "contract-projection-ledger",
  "unitDigest": "17d2ab4ea33154ce9a51159bc15bdc14f4a0c7d5ae254e369e199e1255a3cfbc",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a028e6991dff33cf719b2eac49a41958f4337b03daca5618a6fd8b5dca3e3161`

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
## claim_14c5a8f3fa4423017ae4dcc58c3a9fc5

```json
{
  "claimId": "claim_14c5a8f3fa4423017ae4dcc58c3a9fc5",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "03896b9afa38fe9a0841344fc4d9b7fa0f44db52f9b6b0d28821aff50f5076ec",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `03896b9afa38fe9a0841344fc4d9b7fa0f44db52f9b6b0d28821aff50f5076ec`

````text
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
## claim_590014058472c892c9d3316c50ebfa14

```json
{
  "claimId": "claim_590014058472c892c9d3316c50ebfa14",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "1-purpose",
  "unitDigest": "7fd77bc7c17a3ef8a1f81f3fe35b3ecc315b4dee2faef0f5d2f463e8926d0ef9",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a3479022fa5d6b1330e7220f7104c66d9604580b3e305b681739e7781a226c86`

````text
## 1. Purpose

The projection ledger records host-visible files materialized by the active runtime, such as managed skills, agents, prose, docs, or instruction blocks.

Expected path from architecture discussion:

```txt
.fgos/installation/projections/ledger.json
```
````
## claim_f397ddf4037215f8eec0a8b1383e4bb3

```json
{
  "claimId": "claim_f397ddf4037215f8eec0a8b1383e4bb3",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "aae2d89d9a65c7b29d1ea8173d4fa93989ad595903038a54793a6101afbb871f",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `aae2d89d9a65c7b29d1ea8173d4fa93989ad595903038a54793a6101afbb871f`

```text
The projection ledger records host-visible files materialized by the active runtime, such as managed skills, agents, prose, docs, or instruction blocks.
```
## claim_0092a86be63550bfe9ffca98e26003ae

```json
{
  "claimId": "claim_0092a86be63550bfe9ffca98e26003ae",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "1b0f82e6236df2429e1f4eb6c7ef5571734020894ec32292bc1afe1de788c773",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1b0f82e6236df2429e1f4eb6c7ef5571734020894ec32292bc1afe1de788c773`

```text
Expected path from architecture discussion:
```
## claim_747c1627f1dfa4312c39e47b5c6312d6

```json
{
  "claimId": "claim_747c1627f1dfa4312c39e47b5c6312d6",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "9d32cc03dd7870bcb965161d83319bd6a01b6704a99c1d365eeccd22c91c6aaf",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `9d32cc03dd7870bcb965161d83319bd6a01b6704a99c1d365eeccd22c91c6aaf`

````text
```txt
.fgos/installation/projections/ledger.json
```
````
## claim_72b9a9272ac2659f5f673feed2f3892b

```json
{
  "claimId": "claim_72b9a9272ac2659f5f673feed2f3892b",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "2-boundary",
  "unitDigest": "43b75e5f52c542d7c82a1123f429511e9d1495112cb9a88e708446617f1f04f8",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `0e0c3b11617fd8d683036571f65835ca663ff7a6696f1eaddaf236f0a7edd7c4`

```text
## 2. Boundary

`fgctl` selects and repairs runtime identity. It should not directly own host-visible projection writes.

The active local `fgos` should own projection materialization after activation.
```
## claim_aa082415c51c8cf9e887a13111960d22

```json
{
  "claimId": "claim_aa082415c51c8cf9e887a13111960d22",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "b240b4907516e0b326fc6fb8ac4ad6568cf53e5e91e5fbcf7da38af005d803b1",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `b240b4907516e0b326fc6fb8ac4ad6568cf53e5e91e5fbcf7da38af005d803b1`

```text
`fgctl` selects and repairs runtime identity. It should not directly own host-visible projection writes.
```
## claim_b14173604bde4dbaeaef9795206fc936

```json
{
  "claimId": "claim_b14173604bde4dbaeaef9795206fc936",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "a9f24ed702e5040ddbb0d37597c5c1dc0e39bed92785ddcaa67940e2d0cd4cd4",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a9f24ed702e5040ddbb0d37597c5c1dc0e39bed92785ddcaa67940e2d0cd4cd4`

```text
The active local `fgos` should own projection materialization after activation.
```
## claim_eeaf966a5a4dd923b21261f43c8c8318

```json
{
  "claimId": "claim_eeaf966a5a4dd923b21261f43c8c8318",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "3-why-this-matters",
  "unitDigest": "6c0d9399da47105015b80744223c34cdc07eed7511d9632ca64f5c0543a654a5",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `909e40101e167bc1d0da4e871c7572ee9e560d8db819f07705152ce7f9ff4931`

```text
## 3. Why This Matters

Projection files are visible to host tools and humans. If two runtime identities can write them without a ledger, a workspace can drift silently.

The ledger should answer:

- which runtime wrote the projection;
- what source inside the release produced it;
- which destination was written;
- whether a later runtime owns or supersedes it;
- how repair should handle missing or stale projections.
```
## claim_0cb9fc2652a767a449c6fe0142d894d3

```json
{
  "claimId": "claim_0cb9fc2652a767a449c6fe0142d894d3",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "6d7436f75d244ac4f598810226ddd261f868bec25b360e472026458e317d01ac",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6d7436f75d244ac4f598810226ddd261f868bec25b360e472026458e317d01ac`

```text
Projection files are visible to host tools and humans. If two runtime identities can write them without a ledger, a workspace can drift silently.
```
## claim_1a0b704e380cd5f8abdc76f76861adb9

```json
{
  "claimId": "claim_1a0b704e380cd5f8abdc76f76861adb9",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "8605439430cee52634342c31103ac46340ee179b3c938e594283e7f8d814a623",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `8605439430cee52634342c31103ac46340ee179b3c938e594283e7f8d814a623`

```text
The ledger should answer:
```
## claim_32f8500542cec76a8ad6af66e15ccef5

```json
{
  "claimId": "claim_32f8500542cec76a8ad6af66e15ccef5",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-9",
  "unitDigest": "2d6a794caef05bdbe46587bcf22ce402c8e85e95dd615760424af4d996c3949f",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `2d6a794caef05bdbe46587bcf22ce402c8e85e95dd615760424af4d996c3949f`

```text
- which runtime wrote the projection;
- what source inside the release produced it;
- which destination was written;
- whether a later runtime owns or supersedes it;
- how repair should handle missing or stale projections.
```
## claim_03b0befe72b24d8c912adaa78ab68e03

```json
{
  "claimId": "claim_03b0befe72b24d8c912adaa78ab68e03",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "4-current-status",
  "unitDigest": "5a2c4673523f68e155215e486c4a354585a1e87d2630683d867e44668d196847",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `b5ba1747be003ad4192da5401862a1409886ca400e7b0bee6991f888f95415bb`

```text
## 4. Current Status

Instruction projections now write a managed `AGENTS.md` block, effective-set JSON, and an entry in `.fgos/installation/projections/ledger.json`. The check/fix path lives in `src/setup/instruction-projections.mjs` and is registered as `instruction-projections-stale`.

This does not yet prove ledger coverage for every host-visible projection. Skill packaging projections and future host adapters still need their own ledger entries before this contract can be promoted to fully implemented.
```
## claim_f005310f07e0de4374b51976ed24902b

```json
{
  "claimId": "claim_f005310f07e0de4374b51976ed24902b",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "c475dace7da4f932f9426518133776245ab090c9a307d8b1ac5f926c4b9e6efa",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c475dace7da4f932f9426518133776245ab090c9a307d8b1ac5f926c4b9e6efa`

```text
Instruction projections now write a managed `AGENTS.md` block, effective-set JSON, and an entry in `.fgos/installation/projections/ledger.json`. The check/fix path lives in `src/setup/instruction-projections.mjs` and is registered as `instruction-projections-stale`.
```
## claim_3992c20608493a794c72d8d81c5c74a6

```json
{
  "claimId": "claim_3992c20608493a794c72d8d81c5c74a6",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-11",
  "unitDigest": "c5560c46c5f42ec106c2eb1c763a1d94108d13026104d9016be7c0bbe95bd356",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c5560c46c5f42ec106c2eb1c763a1d94108d13026104d9016be7c0bbe95bd356`

```text
This does not yet prove ledger coverage for every host-visible projection. Skill packaging projections and future host adapters still need their own ledger entries before this contract can be promoted to fully implemented.
```
## claim_312ee5de7bd35b84a86cda101c4f8d86

```json
{
  "claimId": "claim_312ee5de7bd35b84a86cda101c4f8d86",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "5-evidence-needed",
  "unitDigest": "beccfd01da757deb46128aaa1955f0036e81f64f2e8532ed039e22043a4e6228",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `7eedd3972a4fd67618e921c94fcc1859a9308477311d7e50d29d10a56ae2fb7e`

```text
## 5. Evidence Needed

Before promoting this contract:

- scan projection writers;
- identify whether a ledger exists today;
- verify `fgctl` does not write projections directly;
- verify local `fgos init` or `fgos doctor --fix` owns projection repair.
```
## claim_132b7234fee51957dcc18c1e0b72f6f1

```json
{
  "claimId": "claim_132b7234fee51957dcc18c1e0b72f6f1",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-12",
  "unitDigest": "1f69765c1b33a6801468afbb5d8fb38f5dbe2b3097f895f1abc47eec683acc4d",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1f69765c1b33a6801468afbb5d8fb38f5dbe2b3097f895f1abc47eec683acc4d`

```text
Before promoting this contract:
```
## claim_980b8b544062d80c2e0c21d4b20772c1

```json
{
  "claimId": "claim_980b8b544062d80c2e0c21d4b20772c1",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-13",
  "unitDigest": "268cffe3bd35e9f76a54b2a8e1672d7fa7d184227b57fa5878b34cc43974e8e9",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `268cffe3bd35e9f76a54b2a8e1672d7fa7d184227b57fa5878b34cc43974e8e9`

```text
- scan projection writers;
- identify whether a ledger exists today;
- verify `fgctl` does not write projections directly;
- verify local `fgos init` or `fgos doctor --fix` owns projection repair.
```
## claim_808414015ccc4669b609acec23f4722e

```json
{
  "claimId": "claim_808414015ccc4669b609acec23f4722e",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "retained-runtime-identity-and-activation-source-detail",
  "unitDigest": "2c6b0e0d84d8d7b9468cf38f0d857344344318481cec21c90f4c9550350f713a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c2a862030dfce7dc20c0da1ef97b6e9ea3cd32cacd3331ee62857743235b9305`

```text
## Retained Runtime Identity And Activation Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.
```
## claim_0794e958c9e38ffa04c4184af47bf2ec

```json
{
  "claimId": "claim_0794e958c9e38ffa04c4184af47bf2ec",
  "path": "docs/platform/packaging-distribution/contracts/projection-ledger.md",
  "anchor": "unheaded-block-14",
  "unitDigest": "4e3d8c1fa834506f1df0dbdf9862fcd806f236645523b2b9208b1d0b11b90253",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `4e3d8c1fa834506f1df0dbdf9862fcd806f236645523b2b9208b1d0b11b90253`

```text
Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.
```
## claim_c1398a168fb773262044e87ae67c5afe

```json
{
  "claimId": "claim_c1398a168fb773262044e87ae67c5afe",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "contract-release-manifest",
  "unitDigest": "4618afea8cedfea70ca34fbabe52930a198ea86598269b7e55e1a3f104a8a89e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `dd9a91ace53a5a9c9a48cdc826cce23d884a4d1565aeda6c89d13fa71acfc920`

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
## claim_86898c3520ad58e502a1084eae262130

```json
{
  "claimId": "claim_86898c3520ad58e502a1084eae262130",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "28cfc4174a87b1d603361d312cf5c03172c5dece24c367db4bb1813341bc0ad2",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `28cfc4174a87b1d603361d312cf5c03172c5dece24c367db4bb1813341bc0ad2`

````text
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
## claim_d7fdda16cc7431f068607e5762532e0c

```json
{
  "claimId": "claim_d7fdda16cc7431f068607e5762532e0c",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "1-purpose",
  "unitDigest": "405890737d6d1ab3b62d5e422fae5ab739717051180d7f381493bde5e0885dc9",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a2132ae3483667ae554037a074f6f8eba3f983b44680090912de70f9955e42e6`

```text
## 1. Purpose

`manifest.json` is the release identity and verification record for a staged fgOS runtime. It is located at the root of every staged release tree under `machineReleaseStore/releases/<artifactDigest>/manifest.json`.
```
## claim_a9a54f3db037795e9b0e76208fc4893a

```json
{
  "claimId": "claim_a9a54f3db037795e9b0e76208fc4893a",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "526dfb3161f1a342dc606b251fa7dcf5499fb38963a788f76d693df2cdff7ad2",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `526dfb3161f1a342dc606b251fa7dcf5499fb38963a788f76d693df2cdff7ad2`

```text
`manifest.json` is the release identity and verification record for a staged fgOS runtime. It is located at the root of every staged release tree under `machineReleaseStore/releases/<artifactDigest>/manifest.json`.
```
## claim_e8b1f64244fe5767420d99a71a0c715d

```json
{
  "claimId": "claim_e8b1f64244fe5767420d99a71a0c715d",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "2-frozen-schema-v1-shape",
  "unitDigest": "e130a96bb122ac24ea1a9c3cad7112ac28e8d51e83708015b2a2c6688ceb0434",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `fd895f30b9c645b733aee8bc8f21bad88978a5cc957c94b6a612e7833052bce7`

````text
## 2. Frozen Schema V1 Shape

The schema is frozen at `schemaVersion: 1`. Rust serde definitions live in `packages/distribution/rust/src/manifest.rs` (`ReleaseManifest`).

```json
{
  "schemaVersion": 1,
  "artifactDigest": "sha256:<64-hex>",
  "digestKind": "sha256",
  "releaseVersion": "0.1.0",
  "sourceRevision": "abcdef123456",
  "createdAt": "2026-09-14T00:00:00.000Z",
  "target": {
    "os": "linux",
    "arch": "x86_64",
    "libc": "gnu"
  },
  "entries": {
    "fgos": "bin/fgos",
    "fgosRunner": "bin/fgos-runner"
  },
  "components": {
    "legacyNode": {
      "root": "libexec/legacy-node",
      "entry": "bin/fgos.mjs",
      "digest": "sha256:<64-hex>"
    },
    "runner": {
      "path": "bin/fgos-runner",
      "digest": "sha256:<64-hex>"
    },
    "workshop": {
      "skillsDigest": "sha256:<64-hex>",
      "agentsDigest": "sha256:<64-hex>",
      "proseDigest": "sha256:<64-hex>"
    }
  },
  "requires": {
    "node": ">=20.0.0",
    "git": ">=2.30.0"
  },
  "stateSchemas": {
    "read": ["1"],
    "write": ["1"],
    "migrations": []
  },
  "files": [
    {
      "path": "bin/fgos",
      "kind": "file",
      "digest": "sha256:<64-hex>",
      "mode": "0755",
      "class": "binary"
    }
  ]
}
```
````
## claim_606d689c02c870d8131c13d03dd1eb73

```json
{
  "claimId": "claim_606d689c02c870d8131c13d03dd1eb73",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "6d77abaee74b79997b3f25983575ebb2e534e8d9831385dd46ed9150a7b61d98",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6d77abaee74b79997b3f25983575ebb2e534e8d9831385dd46ed9150a7b61d98`

```text
The schema is frozen at `schemaVersion: 1`. Rust serde definitions live in `packages/distribution/rust/src/manifest.rs` (`ReleaseManifest`).
```
## claim_2ab9f21d4bea9ec0e9992f57c9872b6b

```json
{
  "claimId": "claim_2ab9f21d4bea9ec0e9992f57c9872b6b",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "f5105e6f558729e565355681418feb084d9abc8c23c920bef0fd8b9c77202a2a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f5105e6f558729e565355681418feb084d9abc8c23c920bef0fd8b9c77202a2a`

````text
```json
{
  "schemaVersion": 1,
  "artifactDigest": "sha256:<64-hex>",
  "digestKind": "sha256",
  "releaseVersion": "0.1.0",
  "sourceRevision": "abcdef123456",
  "createdAt": "2026-09-14T00:00:00.000Z",
  "target": {
    "os": "linux",
    "arch": "x86_64",
    "libc": "gnu"
  },
  "entries": {
    "fgos": "bin/fgos",
    "fgosRunner": "bin/fgos-runner"
  },
  "components": {
    "legacyNode": {
      "root": "libexec/legacy-node",
      "entry": "bin/fgos.mjs",
      "digest": "sha256:<64-hex>"
    },
    "runner": {
      "path": "bin/fgos-runner",
      "digest": "sha256:<64-hex>"
    },
    "workshop": {
      "skillsDigest": "sha256:<64-hex>",
      "agentsDigest": "sha256:<64-hex>",
      "proseDigest": "sha256:<64-hex>"
    }
  },
  "requires": {
    "node": ">=20.0.0",
    "git": ">=2.30.0"
  },
  "stateSchemas": {
    "read": ["1"],
    "write": ["1"],
    "migrations": []
  },
  "files": [
    {
      "path": "bin/fgos",
      "kind": "file",
      "digest": "sha256:<64-hex>",
      "mode": "0755",
      "class": "binary"
    }
  ]
}
```
````
## claim_f10c6efe4349dd2209a758f2a109ffa3

```json
{
  "claimId": "claim_f10c6efe4349dd2209a758f2a109ffa3",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "3-field-specifications-optionality",
  "unitDigest": "9598778429900c53cee2fbb30ecbfe490e07f001f970a8aac4b8715a951758ac",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `00c8b43be87f94fdfcba8ad4b50d43f110cafd359e6389d6381f95efb9530f2d`

```text
## 3. Field Specifications & Optionality

| Field | Type | Required? | Description |
| --- | --- | --- | --- |
| `schemaVersion` | integer | Yes | Fixed at `1` for V1. |
| `artifactDigest` | string | Yes | Canonical SHA-256 tree digest over manifest without `artifactDigest`. |
| `digestKind` | string | Optional | Defaults to `"sha256"` if omitted. |
| `releaseVersion` | string | Optional | Semantic release version (e.g. `"0.1.0"`). |
| `sourceRevision` | string | Optional | Git commit hash from which release was built. |
| `createdAt` | string | Optional | ISO 8601 UTC timestamp of build. |
| `target` | object | Yes | Target platform info (`os`, `arch`, optional `libc`). |
| `entries` | object | Yes | Native executable entry points (`fgos`, optional `fgosRunner`). |
| `components` | object | Yes | Payload component locators (see section 4). |
| `requires` | object | Yes | System prerequisites (optional `node`, `git` semver range strings). |
| `stateSchemas` | object | Optional | Work-state schema compatibility (`read`, `write`, `migrations`). In V1, `migrations` is reserved and must be empty. |
| `files` | array | Yes | Array of manifest file entries (`path`, `kind`, `digest`, `mode`, `class`). |
```
## claim_d74424dde4c5dc2046063a4df9817a2a

```json
{
  "claimId": "claim_d74424dde4c5dc2046063a4df9817a2a",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "0601dc5e52d9a8668dce47014b86a298f749d10b1da9005aa174161bf9c334cd",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `0601dc5e52d9a8668dce47014b86a298f749d10b1da9005aa174161bf9c334cd`

```text
| Field | Type | Required? | Description |
| --- | --- | --- | --- |
| `schemaVersion` | integer | Yes | Fixed at `1` for V1. |
| `artifactDigest` | string | Yes | Canonical SHA-256 tree digest over manifest without `artifactDigest`. |
| `digestKind` | string | Optional | Defaults to `"sha256"` if omitted. |
| `releaseVersion` | string | Optional | Semantic release version (e.g. `"0.1.0"`). |
| `sourceRevision` | string | Optional | Git commit hash from which release was built. |
| `createdAt` | string | Optional | ISO 8601 UTC timestamp of build. |
| `target` | object | Yes | Target platform info (`os`, `arch`, optional `libc`). |
| `entries` | object | Yes | Native executable entry points (`fgos`, optional `fgosRunner`). |
| `components` | object | Yes | Payload component locators (see section 4). |
| `requires` | object | Yes | System prerequisites (optional `node`, `git` semver range strings). |
| `stateSchemas` | object | Optional | Work-state schema compatibility (`read`, `write`, `migrations`). In V1, `migrations` is reserved and must be empty. |
| `files` | array | Yes | Array of manifest file entries (`path`, `kind`, `digest`, `mode`, `class`). |
```
## claim_176e1b48c055ca0f09189b2430186dd7

```json
{
  "claimId": "claim_176e1b48c055ca0f09189b2430186dd7",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "4-legacy-node-ownership-boundary-invariant",
  "unitDigest": "f2b3e4161392e989e933a85ee35940eea126fbba58bb33d9a507ecae48a0a085",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `2a41af5127094d3cf8891c11a8fa1c27445ae187916b9730f0cf7e66b109008d`

```text
## 4. Legacy Node Ownership Boundary Invariant

`components.legacyNode.root` and `components.legacyNode.entry` remain the **ONLY** legacy Node payload locator across the entire platform.

- The Rust host resolves the Node CLI entrypoint exclusively through `manifest.components.legacyNode`, never `PATH`, never `cwd`, and never hardcoded outside the manifest.
- Omission of `components.legacyNode` is a schema validation error.
- Empty, absolute, or parent-traversing `root`, `entry`, or `digest` fails `ReleaseManifest::validate_legacy_node_invariant`.
- `entry` is relative to `root`; it must not repeat the `root` prefix.
```
## claim_108284585656d27bd734673044766494

```json
{
  "claimId": "claim_108284585656d27bd734673044766494",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "5480aa379d0478ffbf474980ad7241929c04e2e0b850e3304fbee7488e777749",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `5480aa379d0478ffbf474980ad7241929c04e2e0b850e3304fbee7488e777749`

```text
`components.legacyNode.root` and `components.legacyNode.entry` remain the **ONLY** legacy Node payload locator across the entire platform.
```
## claim_d79db84acf5ab477e1b3a6ecf2bdc71b

```json
{
  "claimId": "claim_d79db84acf5ab477e1b3a6ecf2bdc71b",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "5b12fd1fa4f3ab432b19f5620fb11972fb1dc19c6b38564a9f4d7297dff5d7ad",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `5b12fd1fa4f3ab432b19f5620fb11972fb1dc19c6b38564a9f4d7297dff5d7ad`

```text
- The Rust host resolves the Node CLI entrypoint exclusively through `manifest.components.legacyNode`, never `PATH`, never `cwd`, and never hardcoded outside the manifest.
- Omission of `components.legacyNode` is a schema validation error.
- Empty, absolute, or parent-traversing `root`, `entry`, or `digest` fails `ReleaseManifest::validate_legacy_node_invariant`.
- `entry` is relative to `root`; it must not repeat the `root` prefix.
```
## claim_611fc0d1861626edd81d1a9d892e6738

```json
{
  "claimId": "claim_611fc0d1861626edd81d1a9d892e6738",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "5-digest-rule",
  "unitDigest": "af31e1f9d39f47257739091763b3c781ed95b2d0e231898d55e1dcc3df2959d1",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `fdb8d2676359b58b20207f190bdab499ab5eb65c6ac290eb6e78be721eb53871`

```text
## 5. Digest Rule

`artifactDigest` is the canonical manifest/tree identity. It is recomputed by canonicalizing the manifest without `artifactDigest` using pure Rust SHA-256 (`packages/distribution/rust/src/verify.rs`), not from archive bytes.
```
## claim_72631f262787f8381403dca44e4670bd

```json
{
  "claimId": "claim_72631f262787f8381403dca44e4670bd",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "d27d1eb5e4181ea117e86010c24ddc5ab4531242a80ab053667433cd0a64c3c4",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d27d1eb5e4181ea117e86010c24ddc5ab4531242a80ab053667433cd0a64c3c4`

```text
`artifactDigest` is the canonical manifest/tree identity. It is recomputed by canonicalizing the manifest without `artifactDigest` using pure Rust SHA-256 (`packages/distribution/rust/src/verify.rs`), not from archive bytes.
```
## claim_b4d1544898bfa0926e92e98c0575cf6c

```json
{
  "claimId": "claim_b4d1544898bfa0926e92e98c0575cf6c",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "6-safety-rules",
  "unitDigest": "3497be0d771d90488c972c595c7e9b2c4f136834926c3e77dbd868b7b061a6ba",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d540b49bb8e2acb785c5bc23f314a2012d104f805fd2cba6595f31dbb43fae4b`

```text
## 6. Safety Rules

Release staging and preflight reject:
- symlinks anywhere in payload;
- entries escaping the source checkout or staged tree (path traversal);
- corrupt or mismatched file digests;
- non-canonical manifest file ordering;
- unsafe tar extraction paths and Windows drive letter paths.
```
## claim_80152026b2970e0d4e838a246c41ceab

```json
{
  "claimId": "claim_80152026b2970e0d4e838a246c41ceab",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "unheaded-block-9",
  "unitDigest": "2b909279da2dd1455f11fdc002ff8704e42f28048044d83ceab2647909b19ce4",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `2b909279da2dd1455f11fdc002ff8704e42f28048044d83ceab2647909b19ce4`

```text
Release staging and preflight reject:
- symlinks anywhere in payload;
- entries escaping the source checkout or staged tree (path traversal);
- corrupt or mismatched file digests;
- non-canonical manifest file ordering;
- unsafe tar extraction paths and Windows drive letter paths.
```
## claim_6b712148fdac64d78766df044f750f15

```json
{
  "claimId": "claim_6b712148fdac64d78766df044f750f15",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "7-evidence",
  "unitDigest": "8a8f72532fc0100566a509b47f3a00a29ae9b00cac761174edca1efde8aaf978",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ca8cb8b8f11e220860a0adc67008ecb9156530542a3c389666c8f78a13455637`

```text
## 7. Evidence

| Claim | Evidence |
| --- | --- |
| Manifest struct frozen and documented | `packages/distribution/rust/src/manifest.rs` |
| Manifest builder with legacy Node payload | `scripts/build-rust-distribution.mjs` |
| Artifact digest reproducible | `test/rust-host/release-tree.test.mjs` |
| Stage, preflight, and host verify manifest and release files (`verify_release_files` + `verify_legacy_node`) | `packages/distribution/rust/src/store.rs`, `packages/distribution/rust/src/verify.rs`, `apps/fgos/src/legacy_exec.rs`, `test/rust-host/fgctl-stage.test.mjs` |
| Payload safety and digest enforcement regression tests (commits 19000200, 3b3a95fc: symlink-component refusal, path traversal, legacyNode digest verification) | `packages/distribution/rust/src/verify.rs`, `apps/fgos/tests/cli_tests.rs`, `test/rust-host/fgctl-stage.test.mjs` |
| Schema golden tests (full, minimal, forward-compat, invariant) | `packages/distribution/rust/tests/schema_golden.rs`, `packages/distribution/rust/tests/goldens/release-manifest-*.json` |
```
## claim_008bdf7009e0785a5440d4ff95fdbbed

```json
{
  "claimId": "claim_008bdf7009e0785a5440d4ff95fdbbed",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "8f4ca3f46d0ee60b2aa0fb8855633f7ad26c485737ccd8378628b84cba0c07ae",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `8f4ca3f46d0ee60b2aa0fb8855633f7ad26c485737ccd8378628b84cba0c07ae`

```text
| Claim | Evidence |
| --- | --- |
| Manifest struct frozen and documented | `packages/distribution/rust/src/manifest.rs` |
| Manifest builder with legacy Node payload | `scripts/build-rust-distribution.mjs` |
| Artifact digest reproducible | `test/rust-host/release-tree.test.mjs` |
| Stage, preflight, and host verify manifest and release files (`verify_release_files` + `verify_legacy_node`) | `packages/distribution/rust/src/store.rs`, `packages/distribution/rust/src/verify.rs`, `apps/fgos/src/legacy_exec.rs`, `test/rust-host/fgctl-stage.test.mjs` |
| Payload safety and digest enforcement regression tests (commits 19000200, 3b3a95fc: symlink-component refusal, path traversal, legacyNode digest verification) | `packages/distribution/rust/src/verify.rs`, `apps/fgos/tests/cli_tests.rs`, `test/rust-host/fgctl-stage.test.mjs` |
| Schema golden tests (full, minimal, forward-compat, invariant) | `packages/distribution/rust/tests/schema_golden.rs`, `packages/distribution/rust/tests/goldens/release-manifest-*.json` |
```
## claim_b4961133a78f2faf3c9823c8aea0c51b

```json
{
  "claimId": "claim_b4961133a78f2faf3c9823c8aea0c51b",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "retained-runtime-identity-and-activation-source-detail",
  "unitDigest": "2c6b0e0d84d8d7b9468cf38f0d857344344318481cec21c90f4c9550350f713a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c2a862030dfce7dc20c0da1ef97b6e9ea3cd32cacd3331ee62857743235b9305`

```text
## Retained Runtime Identity And Activation Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.
```
## claim_62d9d413deb9854e26392bf0bbd8f4e4

```json
{
  "claimId": "claim_62d9d413deb9854e26392bf0bbd8f4e4",
  "path": "docs/platform/packaging-distribution/contracts/release-manifest.md",
  "anchor": "unheaded-block-11",
  "unitDigest": "4e3d8c1fa834506f1df0dbdf9862fcd806f236645523b2b9208b1d0b11b90253",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `4e3d8c1fa834506f1df0dbdf9862fcd806f236645523b2b9208b1d0b11b90253`

```text
Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.
```
## claim_396859ab9821f94fd19d211675673edd

```json
{
  "claimId": "claim_396859ab9821f94fd19d211675673edd",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "contract-repository-runtime-layout",
  "unitDigest": "85ecf3fb528db0c8aa9deae14f88ed3cb36f166bbae3615e6e01737d7788535e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `599a36d4f338c14ec0d391ef4b60a2d5b63785c311d3661bbb18f66dee6187f4`

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
## claim_3f3d268bf4c352ed0eb2db5ff591f309

```json
{
  "claimId": "claim_3f3d268bf4c352ed0eb2db5ff591f309",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "b022e0559d190ec4bacc002d8da26237c4ee70beb924db5d7dba660fd8a5c3ab",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `b022e0559d190ec4bacc002d8da26237c4ee70beb924db5d7dba660fd8a5c3ab`

````text
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
## claim_391aa57a156a053aa82b7569e6496d86

```json
{
  "claimId": "claim_391aa57a156a053aa82b7569e6496d86",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "1-purpose",
  "unitDigest": "ddb1f2d748ee389a0d0687251368ad9a7daf89b2fd5c941bf4be6547537d5af9",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `2d77ce3f9ba619608fcec87732f3cd23e832b5588708bd5f775107add434c7b2`

```text
## 1. Purpose

This contract records the minimum on-disk layout packaging-distribution must preserve. It prevents install, activation, doctor/fix, projection, and worker-workspace logic from collapsing distinct authorities into one `.fgos` tree.

Packaging-distribution consumes workspace topology; it does not own durable work-state semantics.
```
## claim_990315b66b174be738df28b5b956ebd3

```json
{
  "claimId": "claim_990315b66b174be738df28b5b956ebd3",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "1cd6a254861bd69ac5de460109e936b27b837985fd08a29313cea7d349015efd",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1cd6a254861bd69ac5de460109e936b27b837985fd08a29313cea7d349015efd`

```text
This contract records the minimum on-disk layout packaging-distribution must preserve. It prevents install, activation, doctor/fix, projection, and worker-workspace logic from collapsing distinct authorities into one `.fgos` tree.
```
## claim_f66f9a45dca522e7da61f7f3b1f1c7ec

```json
{
  "claimId": "claim_f66f9a45dca522e7da61f7f3b1f1c7ec",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "926a798b52adf7b3dc4fed7c111110f201005c630ab365dfdbd492ae7294220e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `926a798b52adf7b3dc4fed7c111110f201005c630ab365dfdbd492ae7294220e`

```text
Packaging-distribution consumes workspace topology; it does not own durable work-state semantics.
```
## claim_a24d76ebf3690d115193637eeee63073

```json
{
  "claimId": "claim_a24d76ebf3690d115193637eeee63073",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "2-minimum-layout",
  "unitDigest": "02c28ffc6e8f82de19e87d8bbb948163f00c7346380d37f6fd49f87278044dcc",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e21b92ba9abad6e03e33052d83d0a06b34965999ffa84b3dd799af1c8350aee1`

````text
## 2. Minimum Layout

```txt
workspace root:
  .fgos/
    config.json             # tracked workspace/branch policy
    distribution.json       # tracked team/project runtime pin
    installation/
      bin/
        fgos                # ignored stable workspace shim
        fgos-runner         # ignored stable workspace shim
      root.json             # ignored TopologyContext/root binding snapshot
      activation.json       # ignored per-workspace ready binding
      projections/
        ledger.json         # ignored per-workspace projection ledger

workHistoryRoot(workStateId):
  active-events/            # hot durable history; placement owned by topology/work-state
  schema.json               # current work-state schema record
  derived/

runtimeCoordinationRoot(workStateId):
  claims/
  sessions/
  leases/
  locks/

machineReleaseStore:
  releases/
    <artifactDigest>/
      manifest.json
      bin/
        fgos
        fgos-runner
      libexec/
        legacy-node/
      workshop/
        skills/
        agents/
        prose/
      docs/
  installs/
    <activationId>.json
  install.lock
  quarantine/
```
````
## claim_200b8aa54d9ceafba169941429b748a5

```json
{
  "claimId": "claim_200b8aa54d9ceafba169941429b748a5",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "f9f015e1eb12bd30451185a84e37011de1987122ea4c60c31f3f73e1f9811a8b",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f9f015e1eb12bd30451185a84e37011de1987122ea4c60c31f3f73e1f9811a8b`

````text
```txt
workspace root:
  .fgos/
    config.json             # tracked workspace/branch policy
    distribution.json       # tracked team/project runtime pin
    installation/
      bin/
        fgos                # ignored stable workspace shim
        fgos-runner         # ignored stable workspace shim
      root.json             # ignored TopologyContext/root binding snapshot
      activation.json       # ignored per-workspace ready binding
      projections/
        ledger.json         # ignored per-workspace projection ledger

workHistoryRoot(workStateId):
  active-events/            # hot durable history; placement owned by topology/work-state
  schema.json               # current work-state schema record
  derived/

runtimeCoordinationRoot(workStateId):
  claims/
  sessions/
  leases/
  locks/

machineReleaseStore:
  releases/
    <artifactDigest>/
      manifest.json
      bin/
        fgos
        fgos-runner
      libexec/
        legacy-node/
      workshop/
        skills/
        agents/
        prose/
      docs/
  installs/
    <activationId>.json
  install.lock
  quarantine/
```
````
## claim_2ea6c48331bdb46e6885f12ba1c118f3

```json
{
  "claimId": "claim_2ea6c48331bdb46e6885f12ba1c118f3",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "3-separation-rules",
  "unitDigest": "257bc8c14276bfffef5ada63ea5a91b410e803fddb202c60ebccbf1d6f281dec",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `dc0e4abf9d5271c7dcdbf285ae0591e142ac6b51289dca911c8b4124dbc580d5`

```text
## 3. Separation Rules

- `machineReleaseStore/releases/<artifactDigest>/` is immutable release payload.
- Workspace `.fgos/installation/bin/*` is the stable local entry surface.
- Workspace `.fgos/installation/activation.json` selects the active runtime for that workspace only.
- Workspace `.fgos/config.json` is tracked workspace/branch policy.
- Workspace `.fgos/distribution.json` is tracked runtime pin policy and may differ by branch/worktree.
- Workspace `.fgos/installation/projections/ledger.json` records host-visible projections for that workspace only.
- `workHistoryRoot(workStateId)` owns durable workflow history, not packaging.
- `runtimeCoordinationRoot(workStateId)` owns claims, sessions, leases, and locks, and must not share a namespace with release or activation records.
- Config, event history, coordination, cache, activation, release payload, and projections are distinct state classes.
```
## claim_832bdab48fd09af5c37f76c07f4dc2cb

```json
{
  "claimId": "claim_832bdab48fd09af5c37f76c07f4dc2cb",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "d96e7c2a8ee087516f5233c8ddc794000505f9df796921032859df49dde4cc5b",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d96e7c2a8ee087516f5233c8ddc794000505f9df796921032859df49dde4cc5b`

```text
- `machineReleaseStore/releases/<artifactDigest>/` is immutable release payload.
- Workspace `.fgos/installation/bin/*` is the stable local entry surface.
- Workspace `.fgos/installation/activation.json` selects the active runtime for that workspace only.
- Workspace `.fgos/config.json` is tracked workspace/branch policy.
- Workspace `.fgos/distribution.json` is tracked runtime pin policy and may differ by branch/worktree.
- Workspace `.fgos/installation/projections/ledger.json` records host-visible projections for that workspace only.
- `workHistoryRoot(workStateId)` owns durable workflow history, not packaging.
- `runtimeCoordinationRoot(workStateId)` owns claims, sessions, leases, and locks, and must not share a namespace with release or activation records.
- Config, event history, coordination, cache, activation, release payload, and projections are distinct state classes.
```
## claim_9c9442ded3ebfb8320acf9968352b270

```json
{
  "claimId": "claim_9c9442ded3ebfb8320acf9968352b270",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "4-worker-workspace-capsule",
  "unitDigest": "6263c4fac456cfd3be21a315450ba0ed9fe00d16d834717ab1971a9526ca2ae6",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `83e773f37355684efaf781f850901f842435b9bd4fa56ce3d28c9fa8504e429b`

````text
## 4. Worker Workspace Capsule

Worker workspaces still need an installation capsule if commands should enter through local shims. They must not symlink or copy the entire shared `.fgos` state tree.

Minimum worker capsule:

```txt
worker workspace:
  .fgos/
    distribution.json        # checked out with the branch when present
    installation/
      bin/fgos
      bin/fgos-runner
      root.json              # binds shared workState/release/coordination roots
      activation.json
      projections/ledger.json
```
````
## claim_a2d7f750819eef3e391e797b3d549525

```json
{
  "claimId": "claim_a2d7f750819eef3e391e797b3d549525",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "87aec1c993cd2b55170a5b263671bc20435dd10fe27bd9089f7343cf815e539b",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `87aec1c993cd2b55170a5b263671bc20435dd10fe27bd9089f7343cf815e539b`

```text
Worker workspaces still need an installation capsule if commands should enter through local shims. They must not symlink or copy the entire shared `.fgos` state tree.
```
## claim_c38a12c92550b0edfd59dbd369b6b3dd

```json
{
  "claimId": "claim_c38a12c92550b0edfd59dbd369b6b3dd",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "1f62f0afda890e89dc9751867bf1050d4211177f7eeefad8af811e4738e1f644",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1f62f0afda890e89dc9751867bf1050d4211177f7eeefad8af811e4738e1f644`

```text
Minimum worker capsule:
```
## claim_66eee45b19351994159b800423f31fdb

```json
{
  "claimId": "claim_66eee45b19351994159b800423f31fdb",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "e6ea7ecd83eecbd2d4698b3080e7a97a22d7864e178b29ec90896654f3974a12",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e6ea7ecd83eecbd2d4698b3080e7a97a22d7864e178b29ec90896654f3974a12`

````text
```txt
worker workspace:
  .fgos/
    distribution.json        # checked out with the branch when present
    installation/
      bin/fgos
      bin/fgos-runner
      root.json              # binds shared workState/release/coordination roots
      activation.json
      projections/ledger.json
```
````
## claim_179498765c8a3dcf5a71154de96b8b26

```json
{
  "claimId": "claim_179498765c8a3dcf5a71154de96b8b26",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "5-source-release-projection",
  "unitDigest": "c1dcaed7d598d31dd546a2652b4055ed388fdd940f5ac3f6c8354e0c1aefb317",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e44c1db9ca84d08de5ce6f4b03b86e862992c0d8ca60fad4b5ff4cace3214059`

```text
## 5. Source, Release, Projection

Packaging-distribution must keep these three shapes distinct:

| Shape | Meaning | Mutation rule |
| --- | --- | --- |
| Source repository layout | The developer/source checkout, including code, docs, tests, canonical skill/instruction sources, and release build scripts. | Mutated by development work only. |
| Release tree | Immutable staged runtime payload under `machineReleaseStore/releases/<artifactDigest>/`. | Never patched in place; repair reacquires or restages. |
| Workspace projections | Host-visible generated files such as `.agents/skills`, `.claude/skills`, managed `AGENTS.md` blocks, or plugin/extension projections. | Materialized by active local `fgos init` or `fgos doctor --fix`, recorded by projection ledger when implemented. |

Generated workspace projections are not release-tree files at their final workspace paths. The release manifest records canonical source material; the projection ledger records where that material is projected inside a workspace.
```
## claim_b11c8ffdf0193f03cb38abebb534336f

```json
{
  "claimId": "claim_b11c8ffdf0193f03cb38abebb534336f",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-9",
  "unitDigest": "ae2e9f2de4d9358f0bc4b4ad2739110121ff3c27fa9ffc5e041e4deabed7be12",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ae2e9f2de4d9358f0bc4b4ad2739110121ff3c27fa9ffc5e041e4deabed7be12`

```text
Packaging-distribution must keep these three shapes distinct:
```
## claim_f140b123ea373a49bf3682f2420b9807

```json
{
  "claimId": "claim_f140b123ea373a49bf3682f2420b9807",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "fcd691b25aa3183d3e4ce227fe2cf76ee469b0bd964607314b47925f8cadb2ca",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `fcd691b25aa3183d3e4ce227fe2cf76ee469b0bd964607314b47925f8cadb2ca`

```text
| Shape | Meaning | Mutation rule |
| --- | --- | --- |
| Source repository layout | The developer/source checkout, including code, docs, tests, canonical skill/instruction sources, and release build scripts. | Mutated by development work only. |
| Release tree | Immutable staged runtime payload under `machineReleaseStore/releases/<artifactDigest>/`. | Never patched in place; repair reacquires or restages. |
| Workspace projections | Host-visible generated files such as `.agents/skills`, `.claude/skills`, managed `AGENTS.md` blocks, or plugin/extension projections. | Materialized by active local `fgos init` or `fgos doctor --fix`, recorded by projection ledger when implemented. |
```
## claim_c956f517565de762de9c5200920e0871

```json
{
  "claimId": "claim_c956f517565de762de9c5200920e0871",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-11",
  "unitDigest": "9f344c30f4075032fde2fff369772d0b0291a70e9f45b3fe98e584ee17a07abf",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `9f344c30f4075032fde2fff369772d0b0291a70e9f45b3fe98e584ee17a07abf`

```text
Generated workspace projections are not release-tree files at their final workspace paths. The release manifest records canonical source material; the projection ledger records where that material is projected inside a workspace.
```
## claim_2ec69a617fe82df910a8b3bae4a864dd

```json
{
  "claimId": "claim_2ec69a617fe82df910a8b3bae4a864dd",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "6-pin-and-staging-rule",
  "unitDigest": "687b05d489034755fc8366e45cceedbfe8bcb3765e9d9016e50ed9aafdc155f9",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `525dcf12784ef0ae13318d97be0de2ed25c81ac4140dcceb7b805008211a715b`

```text
## 6. Pin And Staging Rule

If `.fgos/distribution.json` exists but the release store has not staged its requested release, the workspace is `pinned-not-staged`.

`fgctl init` must acquire or stage the pinned release and publish this workspace's activation binding. It must not silently choose latest.
```
## claim_6991320a24fd703187a033ffd887b884

```json
{
  "claimId": "claim_6991320a24fd703187a033ffd887b884",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-12",
  "unitDigest": "2ed073a6ae6b0b92efd580b6b6360e8708fad636491c71c4106c56e8bdf05d9c",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `2ed073a6ae6b0b92efd580b6b6360e8708fad636491c71c4106c56e8bdf05d9c`

```text
If `.fgos/distribution.json` exists but the release store has not staged its requested release, the workspace is `pinned-not-staged`.
```
## claim_4bd2e72a28c43e1a1858f8a47a5d504b

```json
{
  "claimId": "claim_4bd2e72a28c43e1a1858f8a47a5d504b",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-13",
  "unitDigest": "4ab70068dc04ea94957303e0561d41e9bb6e4da73a3aab1ec55c5a70793fa536",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `4ab70068dc04ea94957303e0561d41e9bb6e4da73a3aab1ec55c5a70793fa536`

```text
`fgctl init` must acquire or stage the pinned release and publish this workspace's activation binding. It must not silently choose latest.
```
## claim_dc5986af9cc8c2730885aeed2e5916ed

```json
{
  "claimId": "claim_dc5986af9cc8c2730885aeed2e5916ed",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "7-topology-records-schema-frozen-v1",
  "unitDigest": "9c1ea22bc560436661a2d6f0b1d711f903d0527ef01cbcafdadcf04d8a1ec144",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6ed3d6e53d1bfea8f8237c83f65fb791a9abbc56c7cd958155d3c37a6b89509c`

```text
## 7. Topology Records Schema (Frozen V1)
```
## claim_4ef6cb0e92243a9fe1e2d3b6a57a7199

```json
{
  "claimId": "claim_4ef6cb0e92243a9fe1e2d3b6a57a7199",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "71-workspace-root-binding-fgosinstallationrootjson",
  "unitDigest": "ed51577005ed174287b4a4d881288e65b0e86b2465a89952a53d05e90409653c",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `feed6032abf1ff7e3561bc3cbde0809e805266f90d0c1b5e93d91b2170a04619`

````text
### 7.1 Workspace Root Binding (`.fgos/installation/root.json`)

The schema is frozen at `schemaVersion: 1`. Rust serde definition lives in `packages/distribution/rust/src/init.rs` (`WorkspaceRootBinding`, aliased as `TopologyRootBinding`).

```json
{
  "schemaVersion": 1,
  "repositoryRoot": "/home/user/project",
  "workspaceId": "8d3322d88fba3bd8",
  "workStateId": "8d3322d88fba3bd8",
  "machineReleaseStore": "/home/user/.local/state/fgos"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `schemaVersion` | integer | Fixed at `1` for V1. |
| `repositoryRoot` | string | Canonical filesystem path of the repository checkout root. |
| `workspaceId` | string | 16-hex hash of canonical workspace root. |
| `workStateId` | string | Work-state namespace identifier (equals `workspaceId` in V1). |
| `machineReleaseStore` | string | Absolute path to the machine release store. |
````
## claim_0bb5d10cc45247f041b182ef5f3afc63

```json
{
  "claimId": "claim_0bb5d10cc45247f041b182ef5f3afc63",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-14",
  "unitDigest": "849f40cf7b2fa6e5699c31cf7a3d0b6d745406da0ed7397337872431a28dcc45",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `849f40cf7b2fa6e5699c31cf7a3d0b6d745406da0ed7397337872431a28dcc45`

```text
The schema is frozen at `schemaVersion: 1`. Rust serde definition lives in `packages/distribution/rust/src/init.rs` (`WorkspaceRootBinding`, aliased as `TopologyRootBinding`).
```
## claim_2306c38c8d0444996b94ec2e3266b2e1

```json
{
  "claimId": "claim_2306c38c8d0444996b94ec2e3266b2e1",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-15",
  "unitDigest": "8657db4faa98638cc5f205b0ed0d89b82e65e3de7295508adcbadf8c929383c3",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `8657db4faa98638cc5f205b0ed0d89b82e65e3de7295508adcbadf8c929383c3`

````text
```json
{
  "schemaVersion": 1,
  "repositoryRoot": "/home/user/project",
  "workspaceId": "8d3322d88fba3bd8",
  "workStateId": "8d3322d88fba3bd8",
  "machineReleaseStore": "/home/user/.local/state/fgos"
}
```
````
## claim_ab2edccf4c869bf7b05c6b7f1c6cc61e

```json
{
  "claimId": "claim_ab2edccf4c869bf7b05c6b7f1c6cc61e",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-16",
  "unitDigest": "cf86e5d90ce283292b31fafb242fb443ec91a1eabdd91b8414ea16950d3cfbd4",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `cf86e5d90ce283292b31fafb242fb443ec91a1eabdd91b8414ea16950d3cfbd4`

```text
| Field | Type | Description |
| --- | --- | --- |
| `schemaVersion` | integer | Fixed at `1` for V1. |
| `repositoryRoot` | string | Canonical filesystem path of the repository checkout root. |
| `workspaceId` | string | 16-hex hash of canonical workspace root. |
| `workStateId` | string | Work-state namespace identifier (equals `workspaceId` in V1). |
| `machineReleaseStore` | string | Absolute path to the machine release store. |
```
## claim_32792c214bd9c16623bcce61d53ccced

```json
{
  "claimId": "claim_32792c214bd9c16623bcce61d53ccced",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "72-install-transaction-record-installsjson",
  "unitDigest": "1783677d1994e9d6f26c6add740edb8da29ec3ba122db903e18e30c1278dc8b0",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ee17416e290b74d250f49d980990ee9f37497c8d49d8385065cf94f88ffeda03`

````text
### 7.2 Install Transaction Record (`<store>/installs/<activationId>.json`)

The schema is frozen at `schemaVersion: 1`. Rust serde definition lives in `packages/distribution/rust/src/init.rs` (`InstallTransactionRecord`).

```json
{
  "schemaVersion": 1,
  "activationId": "act_000001a08fe31d00",
  "workspaceId": "8d3322d88fba3bd8",
  "artifactDigest": "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4",
  "status": "ready-published",
  "history": [
    { "status": "staging", "timestamp": "2026-09-14T00:00:00.000Z" },
    { "status": "verified", "timestamp": "2026-09-14T00:00:01.000Z" },
    { "status": "preparing", "timestamp": "2026-09-14T00:00:02.000Z" },
    { "status": "ready-published", "timestamp": "2026-09-14T00:00:03.000Z" }
  ],
  "updatedAt": "2026-09-14T00:00:03.000Z"
}
```
````
## claim_2b4428922dab21a7b00f561eadd4ebf2

```json
{
  "claimId": "claim_2b4428922dab21a7b00f561eadd4ebf2",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-17",
  "unitDigest": "925d08d4ac9e20af1c01e6ac1939076e8b1d85d8fb0adfd4ffeb7180acc3e977",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `925d08d4ac9e20af1c01e6ac1939076e8b1d85d8fb0adfd4ffeb7180acc3e977`

```text
The schema is frozen at `schemaVersion: 1`. Rust serde definition lives in `packages/distribution/rust/src/init.rs` (`InstallTransactionRecord`).
```
## claim_74c83544eb558616f8559bc1dc9b7e43

```json
{
  "claimId": "claim_74c83544eb558616f8559bc1dc9b7e43",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-18",
  "unitDigest": "d5254551e36825082ed4f57c656f0a5b100999e5ddd72d527c1186d2f0fa9162",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d5254551e36825082ed4f57c656f0a5b100999e5ddd72d527c1186d2f0fa9162`

````text
```json
{
  "schemaVersion": 1,
  "activationId": "act_000001a08fe31d00",
  "workspaceId": "8d3322d88fba3bd8",
  "artifactDigest": "sha256:08e33ffd77ccae43fd3b9f3034c9d4c28bdc1d8c69966f913ed66707a0486ec4",
  "status": "ready-published",
  "history": [
    { "status": "staging", "timestamp": "2026-09-14T00:00:00.000Z" },
    { "status": "verified", "timestamp": "2026-09-14T00:00:01.000Z" },
    { "status": "preparing", "timestamp": "2026-09-14T00:00:02.000Z" },
    { "status": "ready-published", "timestamp": "2026-09-14T00:00:03.000Z" }
  ],
  "updatedAt": "2026-09-14T00:00:03.000Z"
}
```
````
## claim_670590b90f7832354a945049f7d33b18

```json
{
  "claimId": "claim_670590b90f7832354a945049f7d33b18",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "8-implementation-status",
  "unitDigest": "34649dc24c975a87a2731ab7aee388580bbece7afc2257230294755a2f8ea983",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `df4dd4e02e67ab882e83da2ba09035e2555ab4ec157242284d457a4a5465b84c`

```text
## 8. Implementation Status

| Claim | Status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Release tree has `manifest.json`, `bin/`, and `libexec/legacy-node/`. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs` | Keep exact fields in sync with `contracts/release-manifest.md`. |
| Workspace activation lives under `.fgos/installation/activation.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` | Schema frozen at V1 with golden test coverage. |
| Topology root binding snapshot lives under `.fgos/installation/root.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs` | Schema frozen at V1 with golden test coverage. |
| Projection ledger path is `.fgos/installation/projections/ledger.json`. | partial | `contracts/projection-ledger.md`, `src/setup/instruction-projections.mjs`, `test/setup/instruction-projections.test.mjs` | Instruction projections write ledger evidence; skill and wider host projections still need ledger coverage before claiming projection repair is complete. |
| Worker workspace capsule avoids copying the whole shared `.fgos` tree. | planned/unknown | Architecture source only | Scan worker/worktree implementation before marking implemented. |
```
## claim_a88ee8b9a6d1f19d2205b460a388f5fa

```json
{
  "claimId": "claim_a88ee8b9a6d1f19d2205b460a388f5fa",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-19",
  "unitDigest": "46616ff48f20fe9f0d1bf98825c134ea122a27d6879e69f0675b27b96bb32094",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `46616ff48f20fe9f0d1bf98825c134ea122a27d6879e69f0675b27b96bb32094`

```text
| Claim | Status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Release tree has `manifest.json`, `bin/`, and `libexec/legacy-node/`. | implemented | `scripts/build-rust-distribution.mjs`, `test/rust-host/release-tree.test.mjs` | Keep exact fields in sync with `contracts/release-manifest.md`. |
| Workspace activation lives under `.fgos/installation/activation.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs`, `test/rust-host/fgctl-upgrade.test.mjs` | Schema frozen at V1 with golden test coverage. |
| Topology root binding snapshot lives under `.fgos/installation/root.json`. | implemented | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/tests/schema_golden.rs`, `test/rust-host/fgctl-init.test.mjs` | Schema frozen at V1 with golden test coverage. |
| Projection ledger path is `.fgos/installation/projections/ledger.json`. | partial | `contracts/projection-ledger.md`, `src/setup/instruction-projections.mjs`, `test/setup/instruction-projections.test.mjs` | Instruction projections write ledger evidence; skill and wider host projections still need ledger coverage before claiming projection repair is complete. |
| Worker workspace capsule avoids copying the whole shared `.fgos` tree. | planned/unknown | Architecture source only | Scan worker/worktree implementation before marking implemented. |
```
## claim_d46b927d199910a719657988abf141cc

```json
{
  "claimId": "claim_d46b927d199910a719657988abf141cc",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "retained-runtime-identity-and-activation-source-detail",
  "unitDigest": "2c6b0e0d84d8d7b9468cf38f0d857344344318481cec21c90f4c9550350f713a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c2a862030dfce7dc20c0da1ef97b6e9ea3cd32cacd3331ee62857743235b9305`

```text
## Retained Runtime Identity And Activation Source Detail

Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.
```
## claim_22d92a4feb86ed55613133db16cf03fc

```json
{
  "claimId": "claim_22d92a4feb86ed55613133db16cf03fc",
  "path": "docs/platform/packaging-distribution/contracts/repository-runtime-layout.md",
  "anchor": "unheaded-block-20",
  "unitDigest": "4e3d8c1fa834506f1df0dbdf9862fcd806f236645523b2b9208b1d0b11b90253",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `4e3d8c1fa834506f1df0dbdf9862fcd806f236645523b2b9208b1d0b11b90253`

```text
Added in candidate — complete source units from `docs/architect/packaging-distribution/runtime-identity-and-activation.md` at `77830ba77eb05991d95b005919776ee6254e833b`. Source design, dated status and obligations are preserved here; this carriage does not certify current implementation. Relative links retain their destination.
```
## claim_dd55d050ee01f01d06f6ee84bef6168a

```json
{
  "claimId": "claim_dd55d050ee01f01d06f6ee84bef6168a",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "contract-setup-doctor-registry",
  "unitDigest": "38dd34d9cb812f932b6ce74f7952bc0d21b98cdcff2add15056d26d85da54463",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f40678baf836b2f98b8f7caaa20b31d5d054dcd15e9079b8b6e952ce0a4f94a3`

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
## claim_fe7caef843a02777239db707d1ca248f

```json
{
  "claimId": "claim_fe7caef843a02777239db707d1ca248f",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "944079021a60a7c200c15894a7cf363ee0c9f17fc8ef4af919d470003b3bdc5e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `944079021a60a7c200c15894a7cf363ee0c9f17fc8ef4af919d470003b3bdc5e`

````text
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
## claim_8d678fa8fd17f977cb5297b861717176

```json
{
  "claimId": "claim_8d678fa8fd17f977cb5297b861717176",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "1-purpose",
  "unitDigest": "dd7d5b40f1d9981d48b9d683db6be68aa8993e6b876d56fb279c52af47d7ccdf",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `78e8d38058c2aa018d0addfe2a50db0c94ac8c0f2c4cdb92d0886a839be80bf7`

```text
## 1. Purpose

The doctor/fix registry is the extension point for environment readiness. Modules register checks, fixes, and config defaults instead of adding one-off repair logic.

Target architecture has no separate `fgos setup` verb for workspace onboarding. `fgctl init` is the one-command workspace onboarding orchestrator; after activation it invokes active local `fgos init`, `fgos doctor --fix`, and `fgos doctor`. Legacy shell/global integration remains compatibility behavior under the explicit deprecated fallback window: 30 calendar days after preview release publication, unless a later release decision replaces that policy.

Current Node `fgos setup` remains implemented as deprecated legacy compatibility and consumes the same registry while it exists.
```
## claim_b17e9b0cdbc64248e692e0cab64a0571

```json
{
  "claimId": "claim_b17e9b0cdbc64248e692e0cab64a0571",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "32c705528748c56a85d705990e3ed5672b84a509ddf12e88fb8e54121ed7e85f",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `32c705528748c56a85d705990e3ed5672b84a509ddf12e88fb8e54121ed7e85f`

```text
The doctor/fix registry is the extension point for environment readiness. Modules register checks, fixes, and config defaults instead of adding one-off repair logic.
```
## claim_e29fc1bfeb81af4a318b8245eeed8cd3

```json
{
  "claimId": "claim_e29fc1bfeb81af4a318b8245eeed8cd3",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "50af62f64bbaed6ea8dcb72f0152d1c1548d4b6f40ea2f14a5e6ac2476d4dc7b",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `50af62f64bbaed6ea8dcb72f0152d1c1548d4b6f40ea2f14a5e6ac2476d4dc7b`

```text
Target architecture has no separate `fgos setup` verb for workspace onboarding. `fgctl init` is the one-command workspace onboarding orchestrator; after activation it invokes active local `fgos init`, `fgos doctor --fix`, and `fgos doctor`. Legacy shell/global integration remains compatibility behavior under the explicit deprecated fallback window: 30 calendar days after preview release publication, unless a later release decision replaces that policy.
```
## claim_a17ece2559214a06262eccb6945be183

```json
{
  "claimId": "claim_a17ece2559214a06262eccb6945be183",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "8ec96758c1e38d19f4770f10758dc39983581fb990d63f18225fed3dfbc18cca",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `8ec96758c1e38d19f4770f10758dc39983581fb990d63f18225fed3dfbc18cca`

```text
Current Node `fgos setup` remains implemented as deprecated legacy compatibility and consumes the same registry while it exists.
```
## claim_e1e065de2db72639984f73849ea0fd07

```json
{
  "claimId": "claim_e1e065de2db72639984f73849ea0fd07",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "2-registry-types",
  "unitDigest": "c8fdb0a8fcd07eea8825da159989e66841e222a9027deca67cdb5cef122d8bd4",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `b014292dfd50477307422b4d3ecde3ad4d2a58340a9be2497ac7cba4afbd7701`

```text
## 2. Registry Types

| Registry | Function | Meaning |
| --- | --- | --- |
| Check | `registerCheck` | A named diagnostic reported by `fgos doctor`. |
| Fix | `registerFix` | A named repair run by `fgos doctor --fix`; current legacy `fgos setup` also runs fixes while it remains implemented. |
| Config default | `registerConfigDefault` | A default config shape merged into shared config without overwriting user values. |

The registries are independent. A module may register only a check, only a fix, only a config default, or any combination.
```
## claim_6ecb42dce856830e7c476d0399cf384f

```json
{
  "claimId": "claim_6ecb42dce856830e7c476d0399cf384f",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "e90bc6e26e222a5c4bc8cc58ad5256d3b266c5dfb7d397eeb3111d4742687686",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e90bc6e26e222a5c4bc8cc58ad5256d3b266c5dfb7d397eeb3111d4742687686`

```text
| Registry | Function | Meaning |
| --- | --- | --- |
| Check | `registerCheck` | A named diagnostic reported by `fgos doctor`. |
| Fix | `registerFix` | A named repair run by `fgos doctor --fix`; current legacy `fgos setup` also runs fixes while it remains implemented. |
| Config default | `registerConfigDefault` | A default config shape merged into shared config without overwriting user values. |
```
## claim_f14d1c04baa118dc03473e44a8bf1600

```json
{
  "claimId": "claim_f14d1c04baa118dc03473e44a8bf1600",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "574bb4df131d3b5475f34478e2b3e3ac8cf2a8f99dca89b52869c62dee937e80",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `574bb4df131d3b5475f34478e2b3e3ac8cf2a8f99dca89b52869c62dee937e80`

```text
The registries are independent. A module may register only a check, only a fix, only a config default, or any combination.
```
## claim_c0a9b8529b13df5ffd25a03204e0e91b

```json
{
  "claimId": "claim_c0a9b8529b13df5ffd25a03204e0e91b",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "3-doctor-contract",
  "unitDigest": "fbd2b04c122007424ace23013554d44aefe325256b0c8f6c7bcd41243b2ed191",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `25a21c79a9f9edee2711921f938493abbbda6c49a46141c7986668cca107f295`

```text
## 3. Doctor Contract

`fgos doctor`:

- runs registered checks;
- reports individual pass/fail status;
- does not write files by default;
- should tell the user what command or fix path applies when a check fails.

Run coverage is checked by `observe-run-coverage`: the host's `metrics coverage`
must report layout rule `v2` and valid observed/skipped accounting. Doctor
independently compares both eligible unique results and candidate-directory/
barrier counts against the Node production admission projection and layout scan.
Both read the main checkout store, including from a worktree. A candidate run
directory changed in the last 60 seconds permits a bounded transient difference,
even before a result exists; future mtimes are recent for clock skew. The host's
`recentRuns` remains result-file based. Diagnostic paths are sample candidates,
not verified host omissions. An unknown coverage subcommand or a response
without `layoutRule` identifies an old host positively and reports
passed-but-degraded with an upgrade instruction; other host errors fail.
This check is read-only, introduces no config default, and never rewrites runs.

`convention-conformance` checks the packaged naming and placement rules only
inside an fgOS source checkout. Violations on paths already present at the
rule cutoff pass with counts and up to three examples; a violation on a path
introduced after that cutoff fails the check, even while the rule posture is
`warn`. A missing or old host pass-skips with the reason because doctor never
reimplements the native rules. The check is read-only and has no registered
fix or config default.


`active-release-matches-checkout` compares a source checkout's Node payload
working-tree bytes with its own activated manifest, using the release builder's
source enumeration. It reports changed, missing and extra source files, excludes
staged production dependencies, and does not certify Rust host freshness.
Outside source checkouts, without activation, with a same-checkout development
manifest, or in a linked worktree whose activation belongs to main, it reports
a reasoned skip. Unsafe paths and unreadable inputs fail this check rather than
throwing out the whole doctor run. It is read-only, with no registered fix:
`npm run fgos:dev -- <verb>` runs working-tree code; build/stage/upgrade updates
plain `fgos`. Diagnosis never changes the activation implicitly.


`fgos doctor --fix`:

- runs every registered fix;
- reports fix results;
- then reports checks.
```
## claim_5df437bf3a7eb71cf5edea8a4c27d577

```json
{
  "claimId": "claim_5df437bf3a7eb71cf5edea8a4c27d577",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "e7d4690c687d22abccefe8d969aee8942d4a83f6d01d1474e00e6fbe86835988",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e7d4690c687d22abccefe8d969aee8942d4a83f6d01d1474e00e6fbe86835988`

```text
`fgos doctor`:

- runs registered checks;
- reports individual pass/fail status;
- does not write files by default;
- should tell the user what command or fix path applies when a check fails.
```
## claim_3ade508810d2c40ed2983303a55637e0

```json
{
  "claimId": "claim_3ade508810d2c40ed2983303a55637e0",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "026a432df485ec60f2e3f10080b772c10d8ffe5298dcb4da289ff9b032af553a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `026a432df485ec60f2e3f10080b772c10d8ffe5298dcb4da289ff9b032af553a`

```text
Run coverage is checked by `observe-run-coverage`: the host's `metrics coverage`
must report layout rule `v2` and valid observed/skipped accounting. Doctor
independently compares both eligible unique results and candidate-directory/
barrier counts against the Node production admission projection and layout scan.
Both read the main checkout store, including from a worktree. A candidate run
directory changed in the last 60 seconds permits a bounded transient difference,
even before a result exists; future mtimes are recent for clock skew. The host's
`recentRuns` remains result-file based. Diagnostic paths are sample candidates,
not verified host omissions. An unknown coverage subcommand or a response
without `layoutRule` identifies an old host positively and reports
passed-but-degraded with an upgrade instruction; other host errors fail.
This check is read-only, introduces no config default, and never rewrites runs.
```
## claim_0f79e4629fb355ee1eaf9c738c98d26b

```json
{
  "claimId": "claim_0f79e4629fb355ee1eaf9c738c98d26b",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-9",
  "unitDigest": "5e78d2354bf6b6426c2ef8a99d43a0e3983990997bb7df7dd989d203798e7d3c",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `5e78d2354bf6b6426c2ef8a99d43a0e3983990997bb7df7dd989d203798e7d3c`

```text
`convention-conformance` checks the packaged naming and placement rules only
inside an fgOS source checkout. Violations on paths already present at the
rule cutoff pass with counts and up to three examples; a violation on a path
introduced after that cutoff fails the check, even while the rule posture is
`warn`. A missing or old host pass-skips with the reason because doctor never
reimplements the native rules. The check is read-only and has no registered
fix or config default.
```
## claim_3683011b17f630f65e47fbe6c97175a7

```json
{
  "claimId": "claim_3683011b17f630f65e47fbe6c97175a7",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "7e894d125b47706e63e1424200681138653afd9fd86d237f30e3fd575f71c71a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `7e894d125b47706e63e1424200681138653afd9fd86d237f30e3fd575f71c71a`

```text
`active-release-matches-checkout` compares a source checkout's Node payload
working-tree bytes with its own activated manifest, using the release builder's
source enumeration. It reports changed, missing and extra source files, excludes
staged production dependencies, and does not certify Rust host freshness.
Outside source checkouts, without activation, with a same-checkout development
manifest, or in a linked worktree whose activation belongs to main, it reports
a reasoned skip. Unsafe paths and unreadable inputs fail this check rather than
throwing out the whole doctor run. It is read-only, with no registered fix:
`npm run fgos:dev -- <verb>` runs working-tree code; build/stage/upgrade updates
plain `fgos`. Diagnosis never changes the activation implicitly.
```
## claim_5019618270095dfb12ff8b464bde9846

```json
{
  "claimId": "claim_5019618270095dfb12ff8b464bde9846",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-11",
  "unitDigest": "9b7b39415a483861865739e4a90b69a7e034c9afc3a3ee6c22fd4056eb06ce1d",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `9b7b39415a483861865739e4a90b69a7e034c9afc3a3ee6c22fd4056eb06ce1d`

```text
`fgos doctor --fix`:

- runs every registered fix;
- reports fix results;
- then reports checks.
```
## claim_174263e5ea64553fad7a8c96fe3dd898

```json
{
  "claimId": "claim_174263e5ea64553fad7a8c96fe3dd898",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "4-legacy-setup-compatibility",
  "unitDigest": "c3eca8e2f79a6e7c80bc0c2b29340fddc2bfb22261e955d9f590a2aa45121732",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1eaca0901b0774e5f51ee364f006ad291143dfea0797d3742a7fae7e54614d0f`

```text
## 4. Legacy Setup Compatibility

Current legacy `fgos setup` is deprecated but still reachable:

- wires known local support such as shell integration and hooks where applicable;
- ensures shared config defaults are present;
- runs every registered fix unconditionally;
- reports changes;
- preserves idempotency when run repeatedly.

The command registry and setup result payload expose the deprecation and workspace-onboarding path. This is implemented behavior, not the target architecture. New distribution design should route workspace onboarding through `fgctl init` plus local `fgos init`/`doctor --fix`/`doctor`, while preserving `fgos setup` as the legacy shell/global integration path through the 30-day preview fallback window unless a later release decision replaces that behavior. Removing the command entirely remains gated by that release-policy window, not by implementation-side inference.
```
## claim_08dbd0e65d4de4ee4d1bf63536fe50bd

```json
{
  "claimId": "claim_08dbd0e65d4de4ee4d1bf63536fe50bd",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-12",
  "unitDigest": "ff88825f072e643451a90e34275ece205320797f38da7888e13ff9771e6fa7bc",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ff88825f072e643451a90e34275ece205320797f38da7888e13ff9771e6fa7bc`

```text
Current legacy `fgos setup` is deprecated but still reachable:
```
## claim_4e1c3722dda4dee5578a4e1ccb7e10ba

```json
{
  "claimId": "claim_4e1c3722dda4dee5578a4e1ccb7e10ba",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-13",
  "unitDigest": "ff5d9f60a647d422a09332bd0543cdab007ab9b557af3312e56ae7a5cca9049b",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ff5d9f60a647d422a09332bd0543cdab007ab9b557af3312e56ae7a5cca9049b`

```text
- wires known local support such as shell integration and hooks where applicable;
- ensures shared config defaults are present;
- runs every registered fix unconditionally;
- reports changes;
- preserves idempotency when run repeatedly.
```
## claim_b5d5434ee6eadadd808906248989cd6b

```json
{
  "claimId": "claim_b5d5434ee6eadadd808906248989cd6b",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-14",
  "unitDigest": "6a31ff3a9291f5367770015d9bc38e818abf1b25e930a4de17e2e178f34ae0e1",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6a31ff3a9291f5367770015d9bc38e818abf1b25e930a4de17e2e178f34ae0e1`

```text
The command registry and setup result payload expose the deprecation and workspace-onboarding path. This is implemented behavior, not the target architecture. New distribution design should route workspace onboarding through `fgctl init` plus local `fgos init`/`doctor --fix`/`doctor`, while preserving `fgos setup` as the legacy shell/global integration path through the 30-day preview fallback window unless a later release decision replaces that behavior. Removing the command entirely remains gated by that release-policy window, not by implementation-side inference.
```
## claim_ad0ba362bca283d41b86cb7abffefbe3

```json
{
  "claimId": "claim_ad0ba362bca283d41b86cb7abffefbe3",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "5-config-merge-contract",
  "unitDigest": "66c51e89aabd1c6bbea4228ff2197ee708b295e7d3cee977cba1f4e2d6c6daca",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `0a6010a72dee31dddde1b9d09923b6e386a10c85db2df1c6b9d401f2aba5f384`

```text
## 5. Config Merge Contract

Config merge is fill-missing-only:

- customized values are not overwritten;
- nested object defaults fill missing keys;
- arrays are added wholesale only when missing;
- project config wins over global config for matching keys;
- missing global config is not an error.
```
## claim_c0b746c87450751bc39242dbba57e908

```json
{
  "claimId": "claim_c0b746c87450751bc39242dbba57e908",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-15",
  "unitDigest": "a189617eee2cb9a16006e93309574852b7c1c2c090808abb211c54dd3e477ff9",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a189617eee2cb9a16006e93309574852b7c1c2c090808abb211c54dd3e477ff9`

```text
Config merge is fill-missing-only:
```
## claim_6b73adf830cd8c02013abb21f6e66eaf

```json
{
  "claimId": "claim_6b73adf830cd8c02013abb21f6e66eaf",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-16",
  "unitDigest": "c344f3e12ee3d58029f8b7c8b5e761ae1c9ce39c4e0a19bfface4463bec03344",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c344f3e12ee3d58029f8b7c8b5e761ae1c9ce39c4e0a19bfface4463bec03344`

```text
- customized values are not overwritten;
- nested object defaults fill missing keys;
- arrays are added wholesale only when missing;
- project config wins over global config for matching keys;
- missing global config is not an error.
```
## claim_efe79cacb754471c0e4713771aebe779

```json
{
  "claimId": "claim_efe79cacb754471c0e4713771aebe779",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "6-ownership-boundary",
  "unitDigest": "1919a5ba192902b20a460a2495e0914c502fe481573128dd6d7ae5b9e388e05e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e4eb24a35f88c015a98a6c28362cdb0c64fbb84b8f96a1c46ae8deb933548df5`

```text
## 6. Ownership Boundary

Doctor/fix paths may repair environment readiness. They must not silently select a different runtime identity when a workspace activation is present. Runtime selection belongs to `fgctl` and workspace activation records.
```
## claim_a9defa80af364b3573fc1fdfecf0471b

```json
{
  "claimId": "claim_a9defa80af364b3573fc1fdfecf0471b",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-17",
  "unitDigest": "18908936fbf8daca52385094d77243fd260f0e1cc0b2eee0308ac50cb69f4908",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `18908936fbf8daca52385094d77243fd260f0e1cc0b2eee0308ac50cb69f4908`

```text
Doctor/fix paths may repair environment readiness. They must not silently select a different runtime identity when a workspace activation is present. Runtime selection belongs to `fgctl` and workspace activation records.
```
## claim_1c782dcb291017346dd21dea77286f25

```json
{
  "claimId": "claim_1c782dcb291017346dd21dea77286f25",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "7-implementation-evidence",
  "unitDigest": "30d4cc2ce92ed93b95affbaa6c554a771dbecb29a802ca1db10dbef73659b74d",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `9f741b0582e7af26a460e804973d283c587a7403b1a83fa0076898e66c8e861c`

```text
## 7. Implementation Evidence

| Claim | Evidence |
| --- | --- |
| Checks/fixes/defaults are registered through open registries | `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `test/setup/registrations.test.mjs` |
| Doctor default path is read-only | `bin/fgos.mjs`, `test/setup/*.test.mjs` |
| Doctor fix runs registered fixes | `src/setup/registrations.mjs`, `bin/fgos.mjs`, `test/setup/*.test.mjs` |
| Legacy setup runs registered fixes and declares its deprecation path | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md`, `test/cli/fgos-manifest.test.mjs`, `test/setup/checks-setup-rc-line.test.mjs` |
| Project config overrides global config | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` |
```
## claim_7b274865e1bcac1142f71b0c1f99165c

```json
{
  "claimId": "claim_7b274865e1bcac1142f71b0c1f99165c",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-18",
  "unitDigest": "c20e0504735ff111f5b7cff6798c4eb97086d3efd9cdf4c467ae07a1bf393068",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c20e0504735ff111f5b7cff6798c4eb97086d3efd9cdf4c467ae07a1bf393068`

```text
| Claim | Evidence |
| --- | --- |
| Checks/fixes/defaults are registered through open registries | `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `test/setup/registrations.test.mjs` |
| Doctor default path is read-only | `bin/fgos.mjs`, `test/setup/*.test.mjs` |
| Doctor fix runs registered fixes | `src/setup/registrations.mjs`, `bin/fgos.mjs`, `test/setup/*.test.mjs` |
| Legacy setup runs registered fixes and declares its deprecation path | `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `docs/history/setup-runs-registered-fixes/CONTEXT.md`, `test/cli/fgos-manifest.test.mjs`, `test/setup/checks-setup-rc-line.test.mjs` |
| Project config overrides global config | `src/config/global-config.mjs`, `test/config/global-config.test.mjs` |
```
## claim_521bd6ed49324749eb303618b1919f14

```json
{
  "claimId": "claim_521bd6ed49324749eb303618b1919f14",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "8-open-follow-up",
  "unitDigest": "dd77241131bdb276ff121f4a3b611107b9153f26e7c9e063e7362653ab08d9d1",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `44e026dd59cdbcf3fbc506337bba966d731bb1e383c1badbf330372b0bc3e423`

```text
## 8. Open Follow-Up

The exact list of registered checks/fixes changes over time. This contract should avoid carrying a stale giant list; generated registry reports or verification docs should carry snapshots when needed.
```
## claim_bf16f3677ad979382118ecf5464e3531

```json
{
  "claimId": "claim_bf16f3677ad979382118ecf5464e3531",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-19",
  "unitDigest": "67e9211a15f5ed8461a1ea519ca54b769f73dd21cf02c2606937bab7e77cf1d9",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `67e9211a15f5ed8461a1ea519ca54b769f73dd21cf02c2606937bab7e77cf1d9`

```text
The exact list of registered checks/fixes changes over time. This contract should avoid carrying a stale giant list; generated registry reports or verification docs should carry snapshots when needed.
```
## claim_84e91709077f327394177361c8b3eadb

```json
{
  "claimId": "claim_84e91709077f327394177361c8b3eadb",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "retained-distribution-source-detail",
  "unitDigest": "5390e5b425f4d2b33dc4215ad4604b30e10b956521d1477f0553e8321c92c8c4",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `4ac7e67b347d3866327abc579d49350ed0af7279e016bedb2b7f2a83aa541694`

```text
## Retained Distribution Source Detail

Added in candidate — complete source units from `docs/specs/distribution.md` at blob `13d2e172de35a570d148022d4c859cac05223acb`, after the boundary main sync. Dated decisions, implementation rules and recorded gaps are retained; current assertions remain subject to the independent truth sample.
```
## claim_34ed238db0948bcb2327af84acf9f3f5

```json
{
  "claimId": "claim_34ed238db0948bcb2327af84acf9f3f5",
  "path": "docs/platform/packaging-distribution/contracts/setup-doctor-registry.md",
  "anchor": "unheaded-block-20",
  "unitDigest": "65ef150ce20bd76be43ca121bcc0c31f7d6cc68d35c77284dbb43070231b03dc",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `65ef150ce20bd76be43ca121bcc0c31f7d6cc68d35c77284dbb43070231b03dc`

```text
Added in candidate — complete source units from `docs/specs/distribution.md` at blob `13d2e172de35a570d148022d4c859cac05223acb`, after the boundary main sync. Dated decisions, implementation rules and recorded gaps are retained; current assertions remain subject to the independent truth sample.
```
## claim_e465e6b43510bb3eca2a271755c9a22a

```json
{
  "claimId": "claim_e465e6b43510bb3eca2a271755c9a22a",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "contract-skill-package-distribution",
  "unitDigest": "1f9c45bb0841690beabddafd19492f2a27628cd2414d7fad86928d83bff0a1fa",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1cf6d1cfb68ae1eed9f78375ec711353a293405c155b0b1c7ab725ef23196a91`

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
## claim_c0be27e95eb272b93015ea906ce41d42

```json
{
  "claimId": "claim_c0be27e95eb272b93015ea906ce41d42",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "5e7de8fb61407a8497ec83f50fb3e35558695dc5ef0dce8c2a0a666df1311ba1",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `5e7de8fb61407a8497ec83f50fb3e35558695dc5ef0dce8c2a0a666df1311ba1`

````text
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
## claim_b8276f05c547873f29fa987ca40db933

```json
{
  "claimId": "claim_b8276f05c547873f29fa987ca40db933",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "1-purpose",
  "unitDigest": "a6ae5859d58abeb45fe4a6f047f3bd2b24d0efe8dce2744672e5a3ad9ea8651e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `8d1510d1b1574005a47ff9798142675ed6b28580d304aeee0fa428fff6b4283b`

```text
## 1. Purpose

Skill package-distribution defines how one canonical fgOS skill source is rendered into the host-specific surfaces used by Codex/OpenAI agents, Claude, Gemini, and plugin-only consumers.

It does not define the behavioral semantics of a skill. The owning component or domain owns the skill body, examples, protocols, and execution policy.
```
## claim_d09bec4acac252a4add2de31c6da72d4

```json
{
  "claimId": "claim_d09bec4acac252a4add2de31c6da72d4",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "0defa310bacd9238f1d1cd3d1d1af790985838678d6d928da5a8f7ac2547215d",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `0defa310bacd9238f1d1cd3d1d1af790985838678d6d928da5a8f7ac2547215d`

```text
Skill package-distribution defines how one canonical fgOS skill source is rendered into the host-specific surfaces used by Codex/OpenAI agents, Claude, Gemini, and plugin-only consumers.
```
## claim_1dca180b399c682b8efa4b721d3e789d

```json
{
  "claimId": "claim_1dca180b399c682b8efa4b721d3e789d",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "f1f4217f097b6643e40f8c335795ffdebbe122668e79696e259a1771bb727593",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f1f4217f097b6643e40f8c335795ffdebbe122668e79696e259a1771bb727593`

```text
It does not define the behavioral semantics of a skill. The owning component or domain owns the skill body, examples, protocols, and execution policy.
```
## claim_d560a7c906f8dcf0fc723b065ca90f2c

```json
{
  "claimId": "claim_d560a7c906f8dcf0fc723b065ca90f2c",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "2-boundary",
  "unitDigest": "70af14ee1c829b1fee8334fbcdbd6c0ea70945a1a79c40d323a13db0ce89cd84",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `b655a8f08f5d1a674828afc4835fbe90bc78aab57204a307d459e922c723c267`

```text
## 2. Boundary

| Concern | Owner |
| --- | --- |
| Canonical skill body and its semantics | Owning component or domain |
| Skill render targets, host adapters, wrapper generation, install packaging, stale checks | Packaging-distribution |
| Group-thinking protocol semantics | Agent coordination / group-thinking |
| Coding mutation, tests, worktree, commit, review/red-team policy | Coding domain |
| Host command invocation syntax after projection exists | Host invocation / host adapter surface |

Packaging-distribution owns the distribution layer because `.agents/skills`, `.claude/skills`, plugin skill bundles, and future Gemini extension files are host-visible projections of the selected runtime.
```
## claim_66be3cecde86659d088483b54b5d2696

```json
{
  "claimId": "claim_66be3cecde86659d088483b54b5d2696",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "ac4ab41f466a79763e155c3295e60405fdcd8cb3c1ce680c656dff07dae60905",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ac4ab41f466a79763e155c3295e60405fdcd8cb3c1ce680c656dff07dae60905`

```text
| Concern | Owner |
| --- | --- |
| Canonical skill body and its semantics | Owning component or domain |
| Skill render targets, host adapters, wrapper generation, install packaging, stale checks | Packaging-distribution |
| Group-thinking protocol semantics | Agent coordination / group-thinking |
| Coding mutation, tests, worktree, commit, review/red-team policy | Coding domain |
| Host command invocation syntax after projection exists | Host invocation / host adapter surface |
```
## claim_8d9f046834a7c4a489ffa83dbd8dc94a

```json
{
  "claimId": "claim_8d9f046834a7c4a489ffa83dbd8dc94a",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "a6cc9dbac6ea91b8141e416f74a4ce35d076f2a677cb556284323bbe5f29f435",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a6cc9dbac6ea91b8141e416f74a4ce35d076f2a677cb556284323bbe5f29f435`

```text
Packaging-distribution owns the distribution layer because `.agents/skills`, `.claude/skills`, plugin skill bundles, and future Gemini extension files are host-visible projections of the selected runtime.
```
## claim_8346d3fc0bd4551aae82a045dc081a3f

```json
{
  "claimId": "claim_8346d3fc0bd4551aae82a045dc081a3f",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "3-implemented-model",
  "unitDigest": "60647e3fe7bc9ecdea9d6a06c0d7758979a28930daf0b1b32ba9186736406e58",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c895bdff7e2c7906de97df25ecb205fb38f653f338d3b2ac2e7f732961be7f49`

````text
## 3. Implemented Model

Current canonical authoring sources:

```txt
core/skills/
domains/<domain>/skills/
```

Current generated or assembled distribution targets:

```txt
.agents/skills/ (assembled portable projection)
.claude/skills/ (generated thin wrappers for canonical skills; hand-authored skills preserved)
plugins/fgOS/skills/ (mirrored fgos-* dev skills and _shared/; hand-authored plugin skills preserved)
.gemini/extensions/fgos/ (prototype extension package generator; partial/planned)
```

Current build/proof surfaces:

| Surface | Status | Evidence |
| --- | --- | --- |
| Assemble canonical skills from `core/skills` and `domains/*/skills` into `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Generate Claude wrapper skills from `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Mirror `fgos-*` dev skills into the fgOS plugin for plugin-only consumers | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` |
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs` |
| Generate Gemini CLI extension package layout and commands | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` |

Generated targets are not the source of truth. They may be committed for host compatibility, but edits should flow from the canonical source through the generator. Note that host trees may be mixed: `plugins/fgOS/skills/` contains hand-authored user commands (`pick`, `submit`, `cook`, `list`, etc.) alongside mirrored `fgos-*` dev skills, and `.claude/skills/` preserves hand-authored skills (`ui-spec`, `gitnexus`) without treating them as generated wrappers.

Run `npm run build:skills` in the fgOS source repo after editing canonical skill sources. Every Markdown file written by assembly carries a one-line HTML generated-from header naming its repo-relative `core/skills/...` or `domains/<domain>/skills/...` source and that rebuild command. The header follows byte-identical YAML frontmatter, or is the first line when none exists. Plugin mirrors and Claude companion/reference files inherit it through copying; Claude `SKILL.md` thin wrappers retain their generated-wrapper marker and point to the assembled projection whose header identifies the canonical source. Non-Markdown bytes and hand-authored plugin CLI-wrapper skills are unchanged.
````
## claim_fe0c474bdc2abdffdd1f8e61d9d1f82c

```json
{
  "claimId": "claim_fe0c474bdc2abdffdd1f8e61d9d1f82c",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "5ea1a5e3aea591811aa0c316b095b525b444f85b69eff848d93612591b4f7b8d",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `5ea1a5e3aea591811aa0c316b095b525b444f85b69eff848d93612591b4f7b8d`

```text
Current canonical authoring sources:
```
## claim_e9b1018f8e86dadf08799e775a45f17e

```json
{
  "claimId": "claim_e9b1018f8e86dadf08799e775a45f17e",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "07bb23af365c2bc3d29124aaffe9b45163f593e889c0247f1555c14cc1d5c953",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `07bb23af365c2bc3d29124aaffe9b45163f593e889c0247f1555c14cc1d5c953`

````text
```txt
core/skills/
domains/<domain>/skills/
```
````
## claim_976095345979bc6fe927aaec63ae1283

```json
{
  "claimId": "claim_976095345979bc6fe927aaec63ae1283",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "92d8e8c9400ed9221f3cf5d65616d9ba882051f420a8f1d34e967d6acbc07dc6",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `92d8e8c9400ed9221f3cf5d65616d9ba882051f420a8f1d34e967d6acbc07dc6`

```text
Current generated or assembled distribution targets:
```
## claim_766c4151525ba1b5bc29d470706c72e6

```json
{
  "claimId": "claim_766c4151525ba1b5bc29d470706c72e6",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-9",
  "unitDigest": "b441017f3c7868488afb3ff75d5204f698eb07e876b88e2a134ad24ed4a104df",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `b441017f3c7868488afb3ff75d5204f698eb07e876b88e2a134ad24ed4a104df`

````text
```txt
.agents/skills/ (assembled portable projection)
.claude/skills/ (generated thin wrappers for canonical skills; hand-authored skills preserved)
plugins/fgOS/skills/ (mirrored fgos-* dev skills and _shared/; hand-authored plugin skills preserved)
.gemini/extensions/fgos/ (prototype extension package generator; partial/planned)
```
````
## claim_765b9176b8629a376d181f4531f4f695

```json
{
  "claimId": "claim_765b9176b8629a376d181f4531f4f695",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-10",
  "unitDigest": "198b1796665d9df1a24d0b14de1db6e3aa5e72ecd3c48a59623ceffed8f6621b",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `198b1796665d9df1a24d0b14de1db6e3aa5e72ecd3c48a59623ceffed8f6621b`

```text
Current build/proof surfaces:
```
## claim_8db02d2c23a009bfaab4b9e9bdba4622

```json
{
  "claimId": "claim_8db02d2c23a009bfaab4b9e9bdba4622",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-11",
  "unitDigest": "6243e500e00b9ac6c14a9430c85ac0c5ffb12ae145edddb5a17b8096ed84de5b",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6243e500e00b9ac6c14a9430c85ac0c5ffb12ae145edddb5a17b8096ed84de5b`

```text
| Surface | Status | Evidence |
| --- | --- | --- |
| Assemble canonical skills from `core/skills` and `domains/*/skills` into `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `scripts/build-skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Generate Claude wrapper skills from `.agents/skills` | implemented | `src/setup/skill-wrappers.mjs`, `test/setup/skill-wrappers.test.mjs` |
| Mirror `fgos-*` dev skills into the fgOS plugin for plugin-only consumers | implemented | `plugins/fgOS/skills/`, `test/skills/fgos-mirror.test.mjs` |
| Detect missing/stale plugin skill packaging through doctor/fix registry | implemented | `src/setup/registrations.mjs`, `test/skills/fgos-mirror.test.mjs` |
| Generate Gemini CLI extension package layout and commands | partial | `src/setup/skill-wrappers.mjs` (`generateGeminiSkillPackage`), `test/setup/skill-wrappers.test.mjs` |
```
## claim_2fcce9ce9eecb93d7452df2e7074ce2e

```json
{
  "claimId": "claim_2fcce9ce9eecb93d7452df2e7074ce2e",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-12",
  "unitDigest": "0ab74a9aa55b9a144d92018b9ce9d605ce702f19795316a6d6121941cfe25a83",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `0ab74a9aa55b9a144d92018b9ce9d605ce702f19795316a6d6121941cfe25a83`

```text
Generated targets are not the source of truth. They may be committed for host compatibility, but edits should flow from the canonical source through the generator. Note that host trees may be mixed: `plugins/fgOS/skills/` contains hand-authored user commands (`pick`, `submit`, `cook`, `list`, etc.) alongside mirrored `fgos-*` dev skills, and `.claude/skills/` preserves hand-authored skills (`ui-spec`, `gitnexus`) without treating them as generated wrappers.
```
## claim_2b3c4535fce7be0b5f6a8b53d70cdbc0

```json
{
  "claimId": "claim_2b3c4535fce7be0b5f6a8b53d70cdbc0",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-13",
  "unitDigest": "bfec271ee7706bbcfb52301ec6bf732de520e070ef1c1a281d78b3d04dbba71e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `bfec271ee7706bbcfb52301ec6bf732de520e070ef1c1a281d78b3d04dbba71e`

```text
Run `npm run build:skills` in the fgOS source repo after editing canonical skill sources. Every Markdown file written by assembly carries a one-line HTML generated-from header naming its repo-relative `core/skills/...` or `domains/<domain>/skills/...` source and that rebuild command. The header follows byte-identical YAML frontmatter, or is the first line when none exists. Plugin mirrors and Claude companion/reference files inherit it through copying; Claude `SKILL.md` thin wrappers retain their generated-wrapper marker and point to the assembled projection whose header identifies the canonical source. Non-Markdown bytes and hand-authored plugin CLI-wrapper skills are unchanged.
```
## claim_a111ed6abc885bcf7374fc8d040f57a8

```json
{
  "claimId": "claim_a111ed6abc885bcf7374fc8d040f57a8",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "4-source-of-truth-rule",
  "unitDigest": "186d78767bb80714a2203a783da68f02fd2a2a5f7a10456299a46c15c8bef7cd",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `69332c3b3d66949e751a2473c0a7002df4f5a3cbc232ed68b16933ab37c1fd95`

```text
## 4. Source-Of-Truth Rule

Every skill has exactly one canonical source directory.

The correct canonical location is determined by component authority:

| Skill type | Canonical source |
| --- | --- |
| Cross-cutting platform skill | `core/skills/<skill>/` |
| Domain-owned skill | `domains/<domain>/skills/<skill>/` |
| Host adapter/wrapper only | Distribution target generated from canonical source |
| Plugin/extension packaging metadata | Packaging-distribution owned adapter target |

Do not create a second canonical copy in `.agents/skills`, `.claude/skills`, `plugins/fgOS/skills`, or a Gemini extension package.
```
## claim_d867bf6e15a0effd94f70e31b0d39936

```json
{
  "claimId": "claim_d867bf6e15a0effd94f70e31b0d39936",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-14",
  "unitDigest": "fcfa654740d758aabfffe28d8e20ef3235ae1c3d21701bc0e67ee8b33ed7401e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `fcfa654740d758aabfffe28d8e20ef3235ae1c3d21701bc0e67ee8b33ed7401e`

```text
Every skill has exactly one canonical source directory.
```
## claim_6d2ac6df288dabd5fb48e1bc998a43b2

```json
{
  "claimId": "claim_6d2ac6df288dabd5fb48e1bc998a43b2",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-15",
  "unitDigest": "4dc182ca9a9502d457d9d5ba8c1e9dffe52c1459a5bc22c81eaf0474a7bdc4a1",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `4dc182ca9a9502d457d9d5ba8c1e9dffe52c1459a5bc22c81eaf0474a7bdc4a1`

```text
The correct canonical location is determined by component authority:
```
## claim_28409f56ab23554dcc2499fbbd32b91d

```json
{
  "claimId": "claim_28409f56ab23554dcc2499fbbd32b91d",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-16",
  "unitDigest": "d2208f63b55d29e28f0eebeacfde79eaca339f44a47182dbdb8d58b3c1fbf608",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d2208f63b55d29e28f0eebeacfde79eaca339f44a47182dbdb8d58b3c1fbf608`

```text
| Skill type | Canonical source |
| --- | --- |
| Cross-cutting platform skill | `core/skills/<skill>/` |
| Domain-owned skill | `domains/<domain>/skills/<skill>/` |
| Host adapter/wrapper only | Distribution target generated from canonical source |
| Plugin/extension packaging metadata | Packaging-distribution owned adapter target |
```
## claim_be849a2e014824affc5e476514eabf47

```json
{
  "claimId": "claim_be849a2e014824affc5e476514eabf47",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-17",
  "unitDigest": "016d6a38ebff9a999958aa65c8412884f35140ef93a1c662bc1f4002ba5c662a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `016d6a38ebff9a999958aa65c8412884f35140ef93a1c662bc1f4002ba5c662a`

```text
Do not create a second canonical copy in `.agents/skills`, `.claude/skills`, `plugins/fgOS/skills`, or a Gemini extension package.
```
## claim_938b94fe26c4d9a098ae96a4b5d18d7b

```json
{
  "claimId": "claim_938b94fe26c4d9a098ae96a4b5d18d7b",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "5-host-adapter-targets",
  "unitDigest": "51e9658ae4d5b1ef5a99cf292bb635f2038791a89899622fcb9b06c60329ee67",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1649fdb29481cec95d4b775c84de87830fded94440486e0272866e764e73955a`

````text
## 5. Host Adapter Targets

The target model is:

```txt
canonical skill source
  -> portable skill projection
  -> host adapter projections
```

| Host / consumer | Adapter target | Trigger shape | Status |
| --- | --- | --- | --- |
| Codex / OpenAI skills | `.agents/skills/<skill>/SKILL.md` | `$fgos-...` or implicit selection by skill description | implemented for current canonical skills |
| Claude | `.claude/skills/<skill>/SKILL.md` plus fgOS plugin wrappers/commands where needed | existing `/fgOS:<verb>` compatibility, target lowercase alias `/fgos:<verb>` where host allows | partial |
| Claude plugin-only consumer | `plugins/fgOS/skills/<skill>/SKILL.md` | plugin-exposed command/skill surface | implemented for current `fgos-*` dev skills |
| Gemini CLI | extension package with `gemini-extension.json`, `GEMINI.md`, and `commands/fgos/<verb>.toml` | `/fgos:<verb>` via command directory namespace | partial (prototype generator only; release/doctor wiring planned) |

Claude, Gemini, and Codex are adapters. None of them should own the fgOS skill semantics.

Self-containment rule for the Gemini package (and any future installable extension): the package must run with the fgOS source repo absent. Every `commands/fgos/<verb>.toml` names only its packaged copy (`packaged_source = "skills/<skill>/SKILL.md"`) as the thing the host reads; the canonical directory it was rendered from is recorded in `provenance` as ledger metadata only, never as a runnable reference. Shared fragments ship inside the package under `skills/_shared/`. Generated adapter classification for `plugins/fgOS/skills/` follows the mirror's own write rule plus provenance (`_shared/` or `fgos-*` **and** a canonical/assembled source), so a hand-authored `plugins/fgOS/skills/fgos-custom/` with no source stays unmanaged.
````
## claim_df648900e2c3d068c9ed0ed8b06ee396

```json
{
  "claimId": "claim_df648900e2c3d068c9ed0ed8b06ee396",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-18",
  "unitDigest": "dbe2274ea5ac62da2b00557308d940f5b4f70538bcc1dddc0c5a7132b7ed4884",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `dbe2274ea5ac62da2b00557308d940f5b4f70538bcc1dddc0c5a7132b7ed4884`

````text
The target model is:

```txt
canonical skill source
  -> portable skill projection
  -> host adapter projections
```
````
## claim_474357e192b82182d316cb9364014e6c

```json
{
  "claimId": "claim_474357e192b82182d316cb9364014e6c",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-19",
  "unitDigest": "719810d0e4eb471b128af69d9ac235b370d5b995e1544beea93ef396686dc41d",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `719810d0e4eb471b128af69d9ac235b370d5b995e1544beea93ef396686dc41d`

```text
| Host / consumer | Adapter target | Trigger shape | Status |
| --- | --- | --- | --- |
| Codex / OpenAI skills | `.agents/skills/<skill>/SKILL.md` | `$fgos-...` or implicit selection by skill description | implemented for current canonical skills |
| Claude | `.claude/skills/<skill>/SKILL.md` plus fgOS plugin wrappers/commands where needed | existing `/fgOS:<verb>` compatibility, target lowercase alias `/fgos:<verb>` where host allows | partial |
| Claude plugin-only consumer | `plugins/fgOS/skills/<skill>/SKILL.md` | plugin-exposed command/skill surface | implemented for current `fgos-*` dev skills |
| Gemini CLI | extension package with `gemini-extension.json`, `GEMINI.md`, and `commands/fgos/<verb>.toml` | `/fgos:<verb>` via command directory namespace | partial (prototype generator only; release/doctor wiring planned) |
```
## claim_df6e13dc3642f024ec6d9f4500773d54

```json
{
  "claimId": "claim_df6e13dc3642f024ec6d9f4500773d54",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-20",
  "unitDigest": "3222071ca6c8c161f4da075d95ad0e0ffb938cffd65f65f128ad7ea31c84e833",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `3222071ca6c8c161f4da075d95ad0e0ffb938cffd65f65f128ad7ea31c84e833`

```text
Claude, Gemini, and Codex are adapters. None of them should own the fgOS skill semantics.
```
## claim_f5a47eabfd0388f78d1fce639365270e

```json
{
  "claimId": "claim_f5a47eabfd0388f78d1fce639365270e",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-21",
  "unitDigest": "cce14f40c8a3e5580f9d1e2774af6c6324d74244db80f80e8c2215a6886e8181",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `cce14f40c8a3e5580f9d1e2774af6c6324d74244db80f80e8c2215a6886e8181`

```text
Self-containment rule for the Gemini package (and any future installable extension): the package must run with the fgOS source repo absent. Every `commands/fgos/<verb>.toml` names only its packaged copy (`packaged_source = "skills/<skill>/SKILL.md"`) as the thing the host reads; the canonical directory it was rendered from is recorded in `provenance` as ledger metadata only, never as a runnable reference. Shared fragments ship inside the package under `skills/_shared/`. Generated adapter classification for `plugins/fgOS/skills/` follows the mirror's own write rule plus provenance (`_shared/` or `fgos-*` **and** a canonical/assembled source), so a hand-authored `plugins/fgOS/skills/fgos-custom/` with no source stays unmanaged.
```
## claim_d14732b8c58168f8aee8b736ce0c71ab

```json
{
  "claimId": "claim_d14732b8c58168f8aee8b736ce0c71ab",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "6-trigger-vocabulary",
  "unitDigest": "daac8451ea44432887909531802d7099613f60cb1a418dd4245e2683d84f3d57",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `038cdb01a989822c04986e31f735ef1cd17055a37593814a01280d15d024f769`

````text
## 6. Trigger Vocabulary

fgOS should keep a host-neutral intent id and map it to each host's native affordance.

Canonical intent id shape:

```txt
fgos:<verb>
fgos:<compound-verb>
```

Examples:

```txt
fgos:submit
fgos:pick
fgos:code-panel
fgos:architecture-panel
```

Adapter mapping:

| Intent id | Codex/OpenAI skill | Claude | Gemini | Status |
| --- | --- | --- | --- | --- |
| `fgos:code-panel` | `$fgos-code-panel` | `/fgos:code-panel` and compatibility `/fgOS:code-panel` if already shipped | `/fgos:code-panel` | deprecated (stubbed by Unit I29; superseded by `fgos:code-change`) |
| `fgos:code-change` | `$fgos-code-change` | `/fgos:code-change` | `/fgos:code-change` | deprecated (superseded by `fgos-run`, routing via canonical capability) |
| `fgos:architecture-panel` | `$fgos-architecture-panel` | `/fgos:architecture-panel` | `/fgos:architecture-panel` | implemented |
| `fgos:routing` | `$fgos-routing` | `/fgos:routing` | `/fgos:routing` | implemented |
| `fgos:pick` | `$fgos-routing` (alias) | `/fgos:pick` (compat `/fgOS:pick`) | `/fgos:pick` | partial (hand-authored plugin command; canonical public-intent mapping planned) |
| `fgos:submit` | `$fgos-clarifying` (target) | `/fgos:submit` (compat `/fgOS:submit`) | `/fgos:submit` | partial (hand-authored plugin command; canonical public-intent mapping planned) |

Direct 1:1 intent-to-trigger mapping is implemented for canonical skills whose intent matches their canonical name or frontmatter `intent:` / `public-intent:`. Compatibility mapping for legacy `/fgOS:*` commands where discovery does not yet produce explicit intent aliases (e.g. `fgos:pick` vs `fgos-routing`) is partial and tracked for subsequent instruction/routing phases.

The lowercase `fgos:*` vocabulary is the desired cross-host user surface where the host supports slash commands and auto-suggest. Codex/OpenAI skills do not use slash command namespaces today, so `$fgos-*` remains the native portable trigger there.
````
## claim_37f64c68681d629b0a978640eb5bd2fe

```json
{
  "claimId": "claim_37f64c68681d629b0a978640eb5bd2fe",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-22",
  "unitDigest": "303378cdfb131b095195997ddaf16371909bfb22eaa66c42364364a4493bdab7",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `303378cdfb131b095195997ddaf16371909bfb22eaa66c42364364a4493bdab7`

```text
fgOS should keep a host-neutral intent id and map it to each host's native affordance.
```
## claim_a23bc69ba7ce1f31cb4fa6bffbe88946

```json
{
  "claimId": "claim_a23bc69ba7ce1f31cb4fa6bffbe88946",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-23",
  "unitDigest": "7033b5af9e2d39b34331cae9ba076805018044f7a4e1dc442e59cd6351598839",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `7033b5af9e2d39b34331cae9ba076805018044f7a4e1dc442e59cd6351598839`

```text
Canonical intent id shape:
```
## claim_84d9f508e8cac48deb4bc4c1fd03086e

```json
{
  "claimId": "claim_84d9f508e8cac48deb4bc4c1fd03086e",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-24",
  "unitDigest": "ecddfeaf5921c99c6a9d2892631192734f045cca575d0bdedf054d0afd33f1dc",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ecddfeaf5921c99c6a9d2892631192734f045cca575d0bdedf054d0afd33f1dc`

````text
```txt
fgos:<verb>
fgos:<compound-verb>
```
````
## claim_205a38ef6a0dbcd19c8e855e4f08aef7

```json
{
  "claimId": "claim_205a38ef6a0dbcd19c8e855e4f08aef7",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-25",
  "unitDigest": "77d3c31c3e0a42b571ac9fe7f7380be2d2b611ec33b9617277018a1a3cf2d5f5",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `77d3c31c3e0a42b571ac9fe7f7380be2d2b611ec33b9617277018a1a3cf2d5f5`

````text
Examples:

```txt
fgos:submit
fgos:pick
fgos:code-panel
fgos:architecture-panel
```
````
## claim_cc07c7e740f7ec26280bf77d4f4a9049

```json
{
  "claimId": "claim_cc07c7e740f7ec26280bf77d4f4a9049",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-26",
  "unitDigest": "fcb57fe9791ab065117fe553c59dc44a1d99be0716c495b166ed21c53a07caed",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `fcb57fe9791ab065117fe553c59dc44a1d99be0716c495b166ed21c53a07caed`

```text
Adapter mapping:

| Intent id | Codex/OpenAI skill | Claude | Gemini | Status |
| --- | --- | --- | --- | --- |
| `fgos:code-panel` | `$fgos-code-panel` | `/fgos:code-panel` and compatibility `/fgOS:code-panel` if already shipped | `/fgos:code-panel` | deprecated (stubbed by Unit I29; superseded by `fgos:code-change`) |
| `fgos:code-change` | `$fgos-code-change` | `/fgos:code-change` | `/fgos:code-change` | deprecated (superseded by `fgos-run`, routing via canonical capability) |
| `fgos:architecture-panel` | `$fgos-architecture-panel` | `/fgos:architecture-panel` | `/fgos:architecture-panel` | implemented |
| `fgos:routing` | `$fgos-routing` | `/fgos:routing` | `/fgos:routing` | implemented |
| `fgos:pick` | `$fgos-routing` (alias) | `/fgos:pick` (compat `/fgOS:pick`) | `/fgos:pick` | partial (hand-authored plugin command; canonical public-intent mapping planned) |
| `fgos:submit` | `$fgos-clarifying` (target) | `/fgos:submit` (compat `/fgOS:submit`) | `/fgos:submit` | partial (hand-authored plugin command; canonical public-intent mapping planned) |
```
## claim_e6e7442d11d6ac61d0796f5376e1fa6b

```json
{
  "claimId": "claim_e6e7442d11d6ac61d0796f5376e1fa6b",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-27",
  "unitDigest": "f2453127e112af90e404355ba3dbcdd3c577d1a792a6243204117a1ee3e29265",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f2453127e112af90e404355ba3dbcdd3c577d1a792a6243204117a1ee3e29265`

```text
Direct 1:1 intent-to-trigger mapping is implemented for canonical skills whose intent matches their canonical name or frontmatter `intent:` / `public-intent:`. Compatibility mapping for legacy `/fgOS:*` commands where discovery does not yet produce explicit intent aliases (e.g. `fgos:pick` vs `fgos-routing`) is partial and tracked for subsequent instruction/routing phases.
```
## claim_915a1414c39afaef09c1f59ce89cfad9

```json
{
  "claimId": "claim_915a1414c39afaef09c1f59ce89cfad9",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-28",
  "unitDigest": "161b5cea0dffabf6d9a2bc221f98117b85b8cbee1e215873f90cdc96e792dec5",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `161b5cea0dffabf6d9a2bc221f98117b85b8cbee1e215873f90cdc96e792dec5`

```text
The lowercase `fgos:*` vocabulary is the desired cross-host user surface where the host supports slash commands and auto-suggest. Codex/OpenAI skills do not use slash command namespaces today, so `$fgos-*` remains the native portable trigger there.
```
## claim_03010b00ae411feab61cd51e62aabab0

```json
{
  "claimId": "claim_03010b00ae411feab61cd51e62aabab0",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "7-shared-fragments",
  "unitDigest": "60c7eef417fd4663d5c2538fc0f7012f6d8aa24c4aad9b2a1d53776304d0b538",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6642d83b142de2fd4f3cbd6175b6c5db8e0ef0308734177d3107d65caa7f8857`

````text
## 7. Shared Fragments

Shared instruction fragments must not become an accidental global namespace.

Target rule:

```txt
_shared/<owner>/<fragment>.md
```

Examples:

```txt
_shared/core/executor-dispatch-fallback.md
_shared/coding/worktree-safety.md
```

Current implementation flattens shared fragments into `.agents/skills/_shared`. That is acceptable only as a compatibility shape while the generator guards against collisions and the canonical source remains component-owned.
````
## claim_c59c67667692b887aac3cfeb14d226c3

```json
{
  "claimId": "claim_c59c67667692b887aac3cfeb14d226c3",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-29",
  "unitDigest": "dcb8c940cde1e885846450af802837db85728ea04cbe0bf7fe5c2335450746ea",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `dcb8c940cde1e885846450af802837db85728ea04cbe0bf7fe5c2335450746ea`

```text
Shared instruction fragments must not become an accidental global namespace.
```
## claim_fdb6106c879196ec307103492b700bfe

```json
{
  "claimId": "claim_fdb6106c879196ec307103492b700bfe",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-30",
  "unitDigest": "c392df07b9016f8883edd245b16c9bfbf3c23a3e67ebca548aab004aeaf6ecf1",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c392df07b9016f8883edd245b16c9bfbf3c23a3e67ebca548aab004aeaf6ecf1`

````text
Target rule:

```txt
_shared/<owner>/<fragment>.md
```
````
## claim_ba86a099362e486fb7d92b81d6d58436

```json
{
  "claimId": "claim_ba86a099362e486fb7d92b81d6d58436",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-31",
  "unitDigest": "d787a72a9d8be658cc3387bb2f5f64238b83c6591929404f5ef47a4c50df5793",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d787a72a9d8be658cc3387bb2f5f64238b83c6591929404f5ef47a4c50df5793`

````text
Examples:

```txt
_shared/core/executor-dispatch-fallback.md
_shared/coding/worktree-safety.md
```
````
## claim_cd05ab0f241965e285c5ff01556ad375

```json
{
  "claimId": "claim_cd05ab0f241965e285c5ff01556ad375",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-32",
  "unitDigest": "96bc919c6b0e98046e3f3fa981dca6338370462ed24b4dff068f42303a58a224",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `96bc919c6b0e98046e3f3fa981dca6338370462ed24b4dff068f42303a58a224`

```text
Current implementation flattens shared fragments into `.agents/skills/_shared`. That is acceptable only as a compatibility shape while the generator guards against collisions and the canonical source remains component-owned.
```
## claim_6d7b6ea1dd0c48e48c565ccd93f239c9

```json
{
  "claimId": "claim_6d7b6ea1dd0c48e48c565ccd93f239c9",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "8-known-ownership-move",
  "unitDigest": "43f9e4355dcf870234b3c7926967132a9bdf4fcba0a8dfc09f7d8c6276920f1e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e073dd1d70cba871f23974148571684acb4cc69e85dcf5e6ede7b687c98dd00e`

````text
## 8. Known Ownership Move

`fgos-code-panel` is a coding-domain application surface over coordination/group-thinking machinery. It is not a special case inside group-thinking.

Target canonical location:

```txt
domains/coding/skills/fgos-code-panel/
```

Compatibility requirements for the move:

- keep the generated public skill name `fgos-code-panel`;
- keep existing host triggers working;
- keep plugin-only consumers receiving the same skill;
- update mirror and wrapper tests in the same change;
- document any temporary alias if an old source path remains during migration.
````
## claim_66c583fb336f68d4e0b0e60267f70492

```json
{
  "claimId": "claim_66c583fb336f68d4e0b0e60267f70492",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-33",
  "unitDigest": "04298b59a0548d7392e88389b7a37a37a1c4c71b7c18d8617658ba8a0ecba04b",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `04298b59a0548d7392e88389b7a37a37a1c4c71b7c18d8617658ba8a0ecba04b`

```text
`fgos-code-panel` is a coding-domain application surface over coordination/group-thinking machinery. It is not a special case inside group-thinking.
```
## claim_ac0b85433a1ef1827cc0ce980e00ef2f

```json
{
  "claimId": "claim_ac0b85433a1ef1827cc0ce980e00ef2f",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-34",
  "unitDigest": "c3326e4e7ce59f297be4d834b2873843c3360064c475e5414de3b79d87d0d3e2",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c3326e4e7ce59f297be4d834b2873843c3360064c475e5414de3b79d87d0d3e2`

```text
Target canonical location:
```
## claim_ed7748fb8e4d252d45e2a4358cf48492

```json
{
  "claimId": "claim_ed7748fb8e4d252d45e2a4358cf48492",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-35",
  "unitDigest": "e5683dba4abb904d6bf40aefd86ced68a48b5d634166d274e3ac8358a2b6ea88",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `e5683dba4abb904d6bf40aefd86ced68a48b5d634166d274e3ac8358a2b6ea88`

````text
```txt
domains/coding/skills/fgos-code-panel/
```
````
## claim_7162af519009e2df5a6b9c294e884e21

```json
{
  "claimId": "claim_7162af519009e2df5a6b9c294e884e21",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-36",
  "unitDigest": "2e35407f562ae60dd2973bdd4e04a946f6606cfbe47e262bb9e47ad2f7851d29",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `2e35407f562ae60dd2973bdd4e04a946f6606cfbe47e262bb9e47ad2f7851d29`

```text
Compatibility requirements for the move:
```
## claim_1e016eac93b64af0a6d44cfbe41190b1

```json
{
  "claimId": "claim_1e016eac93b64af0a6d44cfbe41190b1",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-37",
  "unitDigest": "5406ad11ba07ff9c06db598a50cb98335240e1c5a50ad5c8458d122ae1b2872e",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `5406ad11ba07ff9c06db598a50cb98335240e1c5a50ad5c8458d122ae1b2872e`

```text
- keep the generated public skill name `fgos-code-panel`;
- keep existing host triggers working;
- keep plugin-only consumers receiving the same skill;
- update mirror and wrapper tests in the same change;
- document any temporary alias if an old source path remains during migration.
```
## claim_1a7eeab650fbab7cb6afd93dbd0a5549

```json
{
  "claimId": "claim_1a7eeab650fbab7cb6afd93dbd0a5549",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "9-doctorfix-obligations",
  "unitDigest": "51fded4559298e208bca78e420415bcd998620322802112dfa08a538abb58bf5",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f734f0579be320208538e3371d97afe3c412712cc642073e7236be2851be343f`

```text
## 9. Doctor/Fix Obligations

Any new skill adapter target must register distribution health through `fgos doctor` and safe repair through `fgos doctor --fix` before it becomes a release promise.

Minimum checks:

- missing generated target;
- stale generated target compared with canonical source;
- missing plugin/extension packaging for a shipped host adapter;
- duplicate canonical skill names across `core/skills` and `domains/*/skills`;
- shared fragment collision across component-owned sources.

`fgos doctor` remains read-only. `fgos doctor --fix` may regenerate generated projections through the registered fix path. Current legacy `fgos setup` may consume the same fix path while it remains implemented, but new design should not depend on it.
```
## claim_6f7d813da5b79bc0100825e547be46e5

```json
{
  "claimId": "claim_6f7d813da5b79bc0100825e547be46e5",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-38",
  "unitDigest": "9599894029a74bf3db926fe1a201cd31f02455e988e3aa1e258495a1b7028824",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `9599894029a74bf3db926fe1a201cd31f02455e988e3aa1e258495a1b7028824`

```text
Any new skill adapter target must register distribution health through `fgos doctor` and safe repair through `fgos doctor --fix` before it becomes a release promise.
```
## claim_6556bda6de16b9465f56e12d1c0d3bfe

```json
{
  "claimId": "claim_6556bda6de16b9465f56e12d1c0d3bfe",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-39",
  "unitDigest": "eca361c4a649e7b4ae9465775044060f4d385fb11400484912b2db71ddd3207f",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `eca361c4a649e7b4ae9465775044060f4d385fb11400484912b2db71ddd3207f`

```text
Minimum checks:

- missing generated target;
- stale generated target compared with canonical source;
- missing plugin/extension packaging for a shipped host adapter;
- duplicate canonical skill names across `core/skills` and `domains/*/skills`;
- shared fragment collision across component-owned sources.
```
## claim_bb35e3f7af9f1af4a256eefce33ab411

```json
{
  "claimId": "claim_bb35e3f7af9f1af4a256eefce33ab411",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-40",
  "unitDigest": "f3f89768093589cf74eebe38c0dbd18f1949a12e2627df23f033174c4f044247",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `f3f89768093589cf74eebe38c0dbd18f1949a12e2627df23f033174c4f044247`

```text
`fgos doctor` remains read-only. `fgos doctor --fix` may regenerate generated projections through the registered fix path. Current legacy `fgos setup` may consume the same fix path while it remains implemented, but new design should not depend on it.
```
## claim_eab01552ad536f71350c533ef8ee3bb7

```json
{
  "claimId": "claim_eab01552ad536f71350c533ef8ee3bb7",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "10-projection-ledger-fit",
  "unitDigest": "783a92e54f5c98e052373a493f4ab0e2f438f16bcc8aae129c7b5afec4c733fa",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6063d12d42848a1ada2594af69717d8c98d5481a398ed2f260842cdd06f784f5`

```text
## 10. Projection Ledger Fit

Skill distribution targets are host-visible projections. The long-term ledger should be able to answer:

- which runtime generated the projection;
- which canonical skill source produced it;
- which host adapter wrote it;
- which files are safe to repair or overwrite.

Until projection ledger behavior is implemented, docs must mark those claims as planned or partial.
```
## claim_0704fcfb99a2e7652fede1c59d93031c

```json
{
  "claimId": "claim_0704fcfb99a2e7652fede1c59d93031c",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-41",
  "unitDigest": "9d68201ec15f9890c015d5fede9b06e43fe6682563bdfd8dce3d14c2afcd8ddb",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `9d68201ec15f9890c015d5fede9b06e43fe6682563bdfd8dce3d14c2afcd8ddb`

```text
Skill distribution targets are host-visible projections. The long-term ledger should be able to answer:
```
## claim_9cfe43b17f5abd9bb865f1298eebcf1a

```json
{
  "claimId": "claim_9cfe43b17f5abd9bb865f1298eebcf1a",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-42",
  "unitDigest": "1a6e0a6c40ce40515c72387791b74c1a2f7cc395833570dbed5d18fda4779e30",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1a6e0a6c40ce40515c72387791b74c1a2f7cc395833570dbed5d18fda4779e30`

```text
- which runtime generated the projection;
- which canonical skill source produced it;
- which host adapter wrote it;
- which files are safe to repair or overwrite.
```
## claim_1247f4b0cae9b9b67ebecc9712cd5df7

```json
{
  "claimId": "claim_1247f4b0cae9b9b67ebecc9712cd5df7",
  "path": "docs/platform/packaging-distribution/contracts/skill-package-distribution.md",
  "anchor": "unheaded-block-43",
  "unitDigest": "d1af1f943a66edf99e4c1a346db02de2739a5fe3d167105ae57ad999fb97df7a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d1af1f943a66edf99e4c1a346db02de2739a5fe3d167105ae57ad999fb97df7a`

```text
Until projection ledger behavior is implemented, docs must mark those claims as planned or partial.
```
## claim_a0f184bc39b573f0b4bf0ba469d68d2a

```json
{
  "claimId": "claim_a0f184bc39b573f0b4bf0ba469d68d2a",
  "path": "docs/platform/packaging-distribution/decisions/installed-default-npm-compatibility.md",
  "anchor": "installed-default-and-npm-compatibility",
  "unitDigest": "a77dc7f6b7b1dd819a751579a1de6e718e80e669ef146fdcd10d0f66e6c821e4",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `1ac83e4cef56391fcf15d97cc5ce09eb1f8f2b7b565bf7c31d234e691cd0e79e`

````text
# Installed Default And npm Compatibility

```txt
Document type: Decision
Audience: Release owner, maintainer and independent reviewer
Purpose: Propose the disposition of the retained installed-default npm entry obligation
Design status: Candidate
Implementation: Proposed retirement of a dated trigger clause; no retirement is approved here
Provenance: dropped-010; original legacy-cli-transition.md obligation and current ownership boundary
Writer type: Human + agent coauthor
Canonical: No
Canonical for: The pending decision proposal only
Use this when: Reviewing the original installed-default trigger against the retained npm compatibility channel
Do not use this for: Removing npm entries, changing release support, or treating the proposal as accepted
Last reviewed: Pending independent review
Related:
- docs/platform/packaging-distribution/spec.md
Supersedes: None until independent verdict
Superseded by: None recorded
```
````
## claim_743f0b70132cc6fda8271214be7c061a

```json
{
  "claimId": "claim_743f0b70132cc6fda8271214be7c061a",
  "path": "docs/platform/packaging-distribution/decisions/installed-default-npm-compatibility.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "ffc24cb21beb67e859d84f86ef48e47a78b8c3e678c78823abd7be210cbd1a2c",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ffc24cb21beb67e859d84f86ef48e47a78b8c3e678c78823abd7be210cbd1a2c`

````text
```txt
Document type: Decision
Audience: Release owner, maintainer and independent reviewer
Purpose: Propose the disposition of the retained installed-default npm entry obligation
Design status: Candidate
Implementation: Proposed retirement of a dated trigger clause; no retirement is approved here
Provenance: dropped-010; original legacy-cli-transition.md obligation and current ownership boundary
Writer type: Human + agent coauthor
Canonical: No
Canonical for: The pending decision proposal only
Use this when: Reviewing the original installed-default trigger against the retained npm compatibility channel
Do not use this for: Removing npm entries, changing release support, or treating the proposal as accepted
Last reviewed: Pending independent review
Related:
- docs/platform/packaging-distribution/spec.md
Supersedes: None until independent verdict
Superseded by: None recorded
```
````
## claim_a3a9a2dc3483b0ce85dfe3c1ea4e6f9c

```json
{
  "claimId": "claim_a3a9a2dc3483b0ce85dfe3c1ea4e6f9c",
  "path": "docs/platform/packaging-distribution/decisions/installed-default-npm-compatibility.md",
  "anchor": "original-obligation",
  "unitDigest": "221f67b6a05611fde2d3e8129ffd0834c5c7bf36775f120424a8e0dd10a90d3c",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `ac3c769c872b613f52a35ca20d5001a23cce7d4cc0d195157438dc3252ad9553`

```text
## Original Obligation

`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.
```
## claim_7a9955b49e0104fcc17be7e9e2a16263

```json
{
  "claimId": "claim_7a9955b49e0104fcc17be7e9e2a16263",
  "path": "docs/platform/packaging-distribution/decisions/installed-default-npm-compatibility.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "6f959e9066321a5afcbb3c6ae57d46b03fa8da3ae18f7ce0b5454eff36ba701e",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6f959e9066321a5afcbb3c6ae57d46b03fa8da3ae18f7ce0b5454eff36ba701e`

```text
`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.
```
## claim_e6538fb192303f7d4fdf1e00c0d3aa18

```json
{
  "claimId": "claim_e6538fb192303f7d4fdf1e00c0d3aa18",
  "path": "docs/platform/packaging-distribution/decisions/installed-default-npm-compatibility.md",
  "anchor": "proposed-disposition",
  "unitDigest": "b1ec345e0756e842dfa086f9c4ef0110dca6a04da2c95d9139cb11186688c3a2",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `fd9c92a3a1bd2b50533a4763eaa00363205e5a7619b208637ec875fb33ad972d`

```text
## Proposed Disposition

Added in candidate — propose retirement of the automatic installed-default removal or redirection trigger. Keep the npm compatibility mapping, runner mapping and source-entry ownership header under their existing support and release policy. This does not decide when the npm fallback channel ends, extend its support promise, or remove a payload.

The current `package.json:9-12` maps both npm entries to the Node payload. `bin/fgos.mjs:4-10` expressly retains global npm and direct Node compatibility channels while requiring Rust host payload resolution through manifest fields. The source obligation was introduced by `4db6ee7e5d32efdd10ebfdc6aa71816e1f98754f`; the implementation header added by `c831811faaa0be93f505456aae6a134865ccbc9b` explicitly retained npm compatibility and did not remove that mapping. The candidate spec distinguishes the native public/default posture from the deprecated npm channel.

The current code proves coexistence, not intentional retirement of the original obligation. No commit explicitly retiring the trigger was found by the recorded symbol/history search. Independent review must decide whether this proposal becomes a retirement verdict or whether a restoration remains owed. Until that verdict, dropped-010 stays deferred to Packaging-distribution and its FLAGGED-obsolete literal retention is unchanged.
```
## claim_34de7c299044ca3ebf49837a0ef7f3bb

```json
{
  "claimId": "claim_34de7c299044ca3ebf49837a0ef7f3bb",
  "path": "docs/platform/packaging-distribution/decisions/installed-default-npm-compatibility.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "8c825fbfc4345283bc92771c4af94d6a38ff5e2b75e2b7097d29267f7d882769",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `8c825fbfc4345283bc92771c4af94d6a38ff5e2b75e2b7097d29267f7d882769`

```text
Added in candidate — propose retirement of the automatic installed-default removal or redirection trigger. Keep the npm compatibility mapping, runner mapping and source-entry ownership header under their existing support and release policy. This does not decide when the npm fallback channel ends, extend its support promise, or remove a payload.
```
## claim_76e368f9914b86f0de7fcef41386b8d7

```json
{
  "claimId": "claim_76e368f9914b86f0de7fcef41386b8d7",
  "path": "docs/platform/packaging-distribution/decisions/installed-default-npm-compatibility.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "a513eb7c42ddbdd4384e1aa33225568a3f0591a9dc433b435bc578a6acc9d972",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a513eb7c42ddbdd4384e1aa33225568a3f0591a9dc433b435bc578a6acc9d972`

```text
The current `package.json:9-12` maps both npm entries to the Node payload. `bin/fgos.mjs:4-10` expressly retains global npm and direct Node compatibility channels while requiring Rust host payload resolution through manifest fields. The source obligation was introduced by `4db6ee7e5d32efdd10ebfdc6aa71816e1f98754f`; the implementation header added by `c831811faaa0be93f505456aae6a134865ccbc9b` explicitly retained npm compatibility and did not remove that mapping. The candidate spec distinguishes the native public/default posture from the deprecated npm channel.
```
## claim_d301f741817cf5afb1da6637ea19c3c7

```json
{
  "claimId": "claim_d301f741817cf5afb1da6637ea19c3c7",
  "path": "docs/platform/packaging-distribution/decisions/installed-default-npm-compatibility.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "6587193ed55d77e09a42126a76fde7bb74560bb4d554440f4b09983a4fc8fc00",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `6587193ed55d77e09a42126a76fde7bb74560bb4d554440f4b09983a4fc8fc00`

```text
The current code proves coexistence, not intentional retirement of the original obligation. No commit explicitly retiring the trigger was found by the recorded symbol/history search. Independent review must decide whether this proposal becomes a retirement verdict or whether a restoration remains owed. Until that verdict, dropped-010 stays deferred to Packaging-distribution and its FLAGGED-obsolete literal retention is unchanged.
```
## claim_997439719d7a23e6ec3438a35cda7f98

```json
{
  "claimId": "claim_997439719d7a23e6ec3438a35cda7f98",
  "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
  "anchor": "history-distribution-baseline",
  "unitDigest": "b57fe4039be08296553e47795d1a22410c52ee030475f3cc98e711ccef7631dd",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `d6a28ee725526e4afb16557e5c9561ce70e691c54c283c3658a7d8bd3c1008c0`

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
## claim_d8eade6e6eeb3c72eb73a6549d5dee42

```json
{
  "claimId": "claim_d8eade6e6eeb3c72eb73a6549d5dee42",
  "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "c9b860344990b95975c3479384c1072d1c6eb66f3ceabab7a0350b60f9b06a0c",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `c9b860344990b95975c3479384c1072d1c6eb66f3ceabab7a0350b60f9b06a0c`

````text
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
## claim_bb269b010c0fe79961da1d1b8ad79115

```json
{
  "claimId": "claim_bb269b010c0fe79961da1d1b8ad79115",
  "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
  "anchor": "1-purpose",
  "unitDigest": "1fe2f28adc528c09558e1c57248236012f4e5123f8b37b9b8aa8936ab84c2c7f",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `157395445c4fe86571806709ba07941c6baf216477b0ffa6dec5144f6d634409`

```text
## 1. Purpose

This history keeps the old baseline visible without letting it masquerade as current target design.
```
## claim_726153b4ac54e68e03df1acab30d80d0

```json
{
  "claimId": "claim_726153b4ac54e68e03df1acab30d80d0",
  "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "a1a615b6bdcf91b9afe66e5967fdfa7c99e8b014041c1dae875ecf6d2e2ffeb2",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `a1a615b6bdcf91b9afe66e5967fdfa7c99e8b014041c1dae875ecf6d2e2ffeb2`

```text
This history keeps the old baseline visible without letting it masquerade as current target design.
```
## claim_13be2a1d5f027c8daaa4cdb3c3028993

```json
{
  "claimId": "claim_13be2a1d5f027c8daaa4cdb3c3028993",
  "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
  "anchor": "2-legacy-baseline",
  "unitDigest": "5d398bab7e52edc90264d9b2146347eead1ab67de9efc713cd7d97c3162d1316",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `51cad688aa1a938ba48a8481a21d7dd2ad40ef4198592bad97bd69786785c811`

```text
## 2. Legacy Baseline

The older distribution model centered on:

- GitHub npm install;
- `package.json` `bin.fgos` and `bin.fgos-runner`;
- package allowlist through `package.json` `files`;
- dev checkout shell helper;
- setup/doctor for shell/config readiness;
- no npm registry publish;
- no lifecycle install script.

Those facts remain useful, especially for compatibility behavior.
```
## claim_1bbb650ae008625c9c8c72335c8a6bd3

```json
{
  "claimId": "claim_1bbb650ae008625c9c8c72335c8a6bd3",
  "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "5a5e815435a4417e896d143690f0c5269f743736bd6f525bf12802f96fa4f162",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `5a5e815435a4417e896d143690f0c5269f743736bd6f525bf12802f96fa4f162`

```text
The older distribution model centered on:
```
## claim_f45bb5e4fe6042e3aad7f1fe10dc50cb

```json
{
  "claimId": "claim_f45bb5e4fe6042e3aad7f1fe10dc50cb",
  "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "5b65b6e6b3851f262206d4fee15ce725b39fd55ff2a405da76ba1bd3b48d4c6e",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `5b65b6e6b3851f262206d4fee15ce725b39fd55ff2a405da76ba1bd3b48d4c6e`

```text
- GitHub npm install;
- `package.json` `bin.fgos` and `bin.fgos-runner`;
- package allowlist through `package.json` `files`;
- dev checkout shell helper;
- setup/doctor for shell/config readiness;
- no npm registry publish;
- no lifecycle install script.
```
## claim_96f5ddef1a3bd3e5e6477bfd9dd9b4dc

```json
{
  "claimId": "claim_96f5ddef1a3bd3e5e6477bfd9dd9b4dc",
  "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "acf85d4e46ea324ba7a58a2349714016657760dc8fdb9999a86c72e817a7bca0",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `acf85d4e46ea324ba7a58a2349714016657760dc8fdb9999a86c72e817a7bca0`

```text
Those facts remain useful, especially for compatibility behavior.
```
## claim_cdf7a017406e39f0d7989b9a3778e188

```json
{
  "claimId": "claim_cdf7a017406e39f0d7989b9a3778e188",
  "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
  "anchor": "3-vision-source",
  "unitDigest": "71c6b4ff000a07ed241a8044c59393e7b4b5ba4e87fd9a21f784ff5d69193925",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `dd5ac4bf4067e7503031bba90301abe44eb211a455c59c5c66b3a92b40ff92af`

```text
## 3. Vision Source

`docs/distribution-vision.md` introduced a stronger direction that now lives in `../vision.md`:

- install should not require cloning;
- setup/doctor should self-repair where possible;
- setup/doctor registries should be extensible;
- global/project/dev-checkout contexts should not conflict;
- CI should become part of setup confidence.

History keeps the old source trace. It is not the current authority for the living direction.

Several items that were open in that document have since been implemented or partially implemented. Do not copy its dated “not yet present” claims into current docs without checking code.
```
## claim_2561a6bd80c95d9940e17de03fcb2980

```json
{
  "claimId": "claim_2561a6bd80c95d9940e17de03fcb2980",
  "path": "docs/platform/packaging-distribution/history/distribution-baseline.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "920413e93d4e3b4300eea04ae92c7bb3aa24902fe767749862e33fb4cae36be1",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Draft",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified"
}
```

Shown SHA256: `920413e93d4e3b4300eea04ae92c7bb3aa24902fe767749862e33fb4cae36be1`

```text
`docs/distribution-vision.md` introduced a stronger direction that now lives in `../vision.md`:
```
