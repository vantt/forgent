# Reissued portal classification receipts

Author session: codex-session:unit-run-1792026600994-509241c8@2026-10-15
Receipt commit: ec08072e26949676703446c99a1229abc6793901
Content review pin: 2a1304393b9b284ad9566b6542ba78554f54b100
Receipt path: plans/260925-documentation-authority-unification/ledger/candidate-classifications-whole-system-portal-evidence-rework.json

Separate formal classification request: 2 entries. Read full shown payloads and currentEvidence at the actual receipt commit. candidate-native-content uses the evidence extension authorized by owner-answers.md; the original three non-content classes do not suffice for these implementation/scope assertions. No source verdict, predecessor acceptance or checkpoint result substitutes for this channel. Keep author identity intact.

Independent report must repeat Author session, Reviewer, Receipt commit and Review mode: ordinary. Commit review-6-portal-evidence-2a1304393.md using the table below with your own verdicts/notes and the exact Evidence digest. No pending row below is an approval.

| Claim | Class | Verdict | Unit digest | Shown text digest | Note | Evidence digest |
|---|---|---|---|---|---|---|
| claim_1898cdafa7835d675526173d39eb5cd2 | candidate-native-content | pending | 6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66 | f5c1667c7fdb67315d2494ac0726098261794fc00f205d99f5b60214c199a21f | Independent review required | 5a8c56135a4eff5373020cbea094a5d868d4eb64b96418710b2119e4420bdaa0 |
| claim_51d4658b154804b82dbce0587b17efc0 | candidate-native-content | pending | 3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2 | 3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2 | Independent review required | 5a8c56135a4eff5373020cbea094a5d868d4eb64b96418710b2119e4420bdaa0 |

## claim_1898cdafa7835d675526173d39eb5cd2

Full receipt, full shown text and evidence (including actual outputs):

```json
{
  "claimId": "claim_1898cdafa7835d675526173d39eb5cd2",
  "path": "docs/platform/README.md",
  "anchor": "2-area-registry",
  "unitDigest": "6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66",
  "shownText": "## 2. Area Registry\n\nTarget area docs live at `docs/platform/<area>/`.\n\n| Area | Current source during migration |\n|---|---|\n| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |\n| `work-state` | [../specs/work-state.md](../specs/work-state.md) |\n| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |\n| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |\n| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |\n| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |\n| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |\n| `ui-spec` | [../ui-spec/](../ui-spec/) |\n| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |",
  "shownTextDigest": "f5c1667c7fdb67315d2494ac0726098261794fc00f205d99f5b60214c199a21f",
  "class": "candidate-native-content",
  "authoredBy": "codex-session:unit-run-1792026600994-509241c8@2026-10-15",
  "rationale": "Full Area Registry payload contains implementation and scope assertions as well as reader routes, so content classification is retained. Replayed current evidence accepts only code-prefix citations and command inputs; archive and package facts are explicit command data inputs. Independent approval remains pending.",
  "reviewStatus": "pending",
  "predecessorClaimId": "claim_1898cdafa7835d675526173d39eb5cd2",
  "priorReceipt": {
    "path": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-whole-system-portal.json",
    "commit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
    "receipt": {
      "claimId": "claim_1898cdafa7835d675526173d39eb5cd2",
      "path": "docs/platform/README.md",
      "anchor": "2-area-registry",
      "unitDigest": "6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66",
      "shownText": "## 2. Area Registry\n\nTarget area docs live at `docs/platform/<area>/`.\n\n| Area | Current source during migration |\n|---|---|\n| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |\n| `work-state` | [../specs/work-state.md](../specs/work-state.md) |\n| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |\n| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |\n| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |\n| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |\n| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |\n| `ui-spec` | [../ui-spec/](../ui-spec/) |\n| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |",
      "shownTextDigest": "f5c1667c7fdb67315d2494ac0726098261794fc00f205d99f5b60214c199a21f",
      "class": "candidate-native-content",
      "authoredBy": "codex-session:39@2026-10-15",
      "reviewStatus": "pending",
      "rationale": "Current canonical portal content, with only the stale knowledge-registry foundation path corrected to its existing archived location. Full unit shown, all other assertions unchanged; independent classification/content review pending.",
      "currentEvidence": {
        "commit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "finding": "true-and-current",
        "scope": "Authored evidence for the authorized path-only correction; independent content acceptance pending. The remaining assertions retain their committed evidence and Lead ordinary assessment.",
        "citations": [
          {
            "path": "archive/plans/260825-1841-knowledge-registry/plan.md",
            "startLine": 1,
            "endLine": 25,
            "blobSha": "ee13eacb7b53e915e0975ec02ad5ccf12f186d1e"
          }
        ],
        "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/accounting-261015-0700-whole-system-verdict-corrections.md.json"
      },
      "amendedBy": "codex-session:42@2026-10-15",
      "rebindingReason": "A19 path-only correction, real extractor unit and full shown-section payload; A22 pending review.",
      "priorEvidence": {
        "commit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "finding": "true-and-current",
        "citations": [
          {
            "path": "scripts/check-doc-candidate-status.mjs",
            "startLine": 1,
            "endLine": 69,
            "blobSha": "789bb33eec89ed5dac3736880cc27e95d71ba857"
          },
          {
            "path": "apps/fgos/src/cli_projector.rs",
            "startLine": 75,
            "endLine": 86,
            "blobSha": "fbc44236f38e8052ffaccc52afa3be8d10b8b349"
          }
        ],
        "commands": [
          {
            "command": "node --input-type=module -e 'import fs from '\\''node:fs'\\'';import path from '\\''node:path'\\'';import {relativeLinkTargets} from '\\''./scripts/check-doc-candidate-status.mjs'\\'';import {extractMarkdownConservationUnits} from '\\''./scripts/generate-doc-inventory.mjs'\\'';const portal=fs.readFileSync('\\''docs/platform/README.md'\\'','\\''utf8'\\'');const targets=[...new Set(relativeLinkTargets(portal))];const missing=targets.filter(p=>!fs.existsSync(path.resolve('\\''docs/platform'\\'',p)));const units=extractMarkdownConservationUnits(portal);const answer=fs.readFileSync('\\''plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md'\\'','\\''utf8'\\'');const rules=JSON.parse(fs.readFileSync('\\''packages/convention/contracts/convention.rules.v1.json'\\'','\\''utf8'\\''));const impl=fs.readFileSync('\\''packages/convention/rust/src/operations.rs'\\'','\\''utf8'\\'');console.log(JSON.stringify({units:units.map(u=>({anchor:u.anchor,digest:u.textDigest})),linkTargets:targets,missing,areaRootExists:fs.existsSync('\\''docs/platform/system-architecture'\\''),conventionOperations:['\\''convention_name'\\'','\\''convention_path'\\'','\\''check_paths'\\'','\\''classify'\\''].map(n=>({name:n,implemented:impl.includes('\\''pub fn '\\''+n+'\\''('\\'')})),conventionRuleShapes:[...new Set(rules.rules.map(r=>r.shape))],phase6Authorized:/Phase 6 authorized: yes/.test(answer),portalSaysPhases03to09Unauthorized:portal.includes('\\''Phases 03–09 remain unauthorized'\\'')}));if(missing.length)process.exitCode=1;'",
            "exitCode": 0,
            "output": "{\"units\":[{\"anchor\":\"platform-documentation\",\"digest\":\"8fc9c0389780b881695ab47666312083822592c77e4e6e7edc4ab35da7c1299e\"},{\"anchor\":\"unheaded-block-1\",\"digest\":\"de17bdcf6470426386de3e75549ce8239a1e535e747842facdc53dd258fb1479\"},{\"anchor\":\"unheaded-block-2\",\"digest\":\"efc34ef6f5aa655035efac51a724089ce84dd17cd231f6dacdef63f5d1356c05\"},{\"anchor\":\"1-platform-wide-anchors\",\"digest\":\"a50bb1654cb8fda3fd30a1d4de47465b15870f24a5a7034d6c003f6ee386612c\"},{\"anchor\":\"unheaded-block-3\",\"digest\":\"b91459b47f7a7aec45a0e03afc29342b26e9cdba66f334988a648ac9acf6e4bd\"},{\"anchor\":\"unheaded-block-4\",\"digest\":\"9b4b3a19cc2e07dbd32a971403f26aa29034191bff4c65de59850183866d0e24\"},{\"anchor\":\"2-area-registry\",\"digest\":\"c1c8d66852c686b940eb0ceab00d7f6abde4f143be360919f223176afeae88d1\"},{\"anchor\":\"unheaded-block-5\",\"digest\":\"ca9b55008482c55a9c860c3c957855a19075bdd07ef9e882435be2c6d2413069\"},{\"anchor\":\"unheaded-block-6\",\"digest\":\"f2d3701022f39f5669ec2aa50aa078458032d0aad4398630e3aaf3dcc5b353ca\"},{\"anchor\":\"3-decision-surface\",\"digest\":\"5b577ba76c013ac3079053a37da9764292815a862e3d1519d54172d8d9bf7e3c\"},{\"anchor\":\"unheaded-block-7\",\"digest\":\"d2295aa8bb8ade7d7e359ae65c80b310d7baf8921771294e58d0523302d5269e\"},{\"anchor\":\"4-how-to-change-platform-docs\",\"digest\":\"26ba4bbb4020dfcf0e9c7691d01fae431c0ade4e92ec48d9e28793ac84ccd34b\"},{\"anchor\":\"unheaded-block-8\",\"digest\":\"e4046fd7c27a762982d49241b30e3f99899719586530455fb4e9dfc7fbb6734f\"},{\"anchor\":\"5-related-files\",\"digest\":\"c216275c70704b3851ca22c07410a6743b69a249a0fda11cf67bc8b848cce2a5\"},{\"anchor\":\"unheaded-block-9\",\"digest\":\"233073464aa7a066ec6812e54a3bbc87f523a2f83c8b0a1c87d09448296f8c74\"}],\"linkTargets\":[\"vision.md\",\"../platform-foundations.md\",\"../work-item-lifecycle-vision.md\",\"intent-preservation-ledger.md\",\"../architect/agent-coordination/intent-preservation-ledger.md\",\"platform-foundations.md\",\"../specs/platform-foundations.md\",\"architecture-map.md\",\"../architecture-map.md\",\"component-boundary.md\",\"../architect/component-boundary/\",\"../contracts/\",\"../routing-handoff-contract.md\",\"../specs/runner.md\",\"../specs/work-state.md\",\"packaging-distribution/README.md\",\"../specs/distribution.md\",\"../distribution-vision.md\",\"../architect/packaging-distribution/\",\"host-invocation-routing/README.md\",\"../architect/host-invocation-routing/\",\"convention/spec.md\",\"agent-coordination/README.md\",\"../architect/agent-coordination/\",\"../../domains/\",\"../../.agents/skills/\",\"../../plugins/fgOS/skills/\",\"../ui-spec/\",\"proposals/documentation-system-unification.md\",\"migration-authoring-rules.md\",\"../transitional-switchboard.md\",\"../doc-governance.md\",\"../reading-map.md\"],\"missing\":[],\"areaRootExists\":true,\"conventionOperations\":[{\"name\":\"convention_name\",\"implemented\":true},{\"name\":\"convention_path\",\"implemented\":true},{\"name\":\"check_paths\",\"implemented\":true},{\"name\":\"classify\",\"implemented\":true}],\"conventionRuleShapes\":[\"name-template\",\"placement-glob\"],\"phase6Authorized\":true,\"portalSaysPhases03to09Unauthorized\":true}\n",
            "outputDigest": "2460d4dd3ac393bd93bceab9e3ee03e33a84bc471271253f74ee1014fc67ca56",
            "inputs": [
              {
                "path": "scripts/check-doc-candidate-status.mjs",
                "blobSha": "789bb33eec89ed5dac3736880cc27e95d71ba857"
              },
              {
                "path": "scripts/generate-doc-inventory.mjs",
                "blobSha": "a52981ff2862cc2c553dbb3181e4e822a26b146b"
              }
            ],
            "dataInputs": [
              {
                "path": "docs/platform/README.md",
                "scope": "unchanged pre-carriage prefix at the report pin; appendix removed only"
              },
              {
                "path": "plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md",
                "blobSha": "265b2fc433034053c1e93eee8212ad4da840a032"
              },
              {
                "path": "packages/convention/contracts/convention.rules.v1.json",
                "blobSha": "ac399ac8fab84a181d572663a3179fd5a49a73c8"
              },
              {
                "path": "packages/convention/rust/src/operations.rs",
                "blobSha": "460f7839751c97b401f53428c5c26b29ed97319e"
              }
            ]
          }
        ],
        "scope": "Checks cover the stated documentation layout and descriptor/role of existing route destinations. Convention naming/path generation and path checking are implemented, as CLI projector, Rust operations and path-only packaged rule shapes show. No document-body health implementation is asserted by those rules. The table describes proposals as proposals and names implemented registry foundation separately; neither is promoted by this receipt."
      }
    }
  },
  "currentEvidence": {
    "commit": "5f0403a0055a9cb50f9975cb74777fba3828eff4",
    "finding": "true-and-current",
    "citations": [
      {
        "path": "scripts/check-doc-candidate-status.mjs",
        "startLine": 1,
        "endLine": 69,
        "blobSha": "789bb33eec89ed5dac3736880cc27e95d71ba857"
      },
      {
        "path": "apps/fgos/src/cli_projector.rs",
        "startLine": 75,
        "endLine": 86,
        "blobSha": "fbc44236f38e8052ffaccc52afa3be8d10b8b349"
      }
    ],
    "commands": [
      {
        "command": "node --input-type=module -e 'import fs from '\\''node:fs'\\'';import path from '\\''node:path'\\'';import {relativeLinkTargets} from '\\''./scripts/check-doc-candidate-status.mjs'\\'';import {extractMarkdownConservationUnits} from '\\''./scripts/generate-doc-inventory.mjs'\\'';const portal=fs.readFileSync('\\''docs/platform/README.md'\\'','\\''utf8'\\'');const targets=[...new Set(relativeLinkTargets(portal))];const missing=targets.filter(p=>!fs.existsSync(path.resolve('\\''docs/platform'\\'',p)));const units=extractMarkdownConservationUnits(portal);const answer=fs.readFileSync('\\''plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md'\\'','\\''utf8'\\'');const rules=JSON.parse(fs.readFileSync('\\''packages/convention/contracts/convention.rules.v1.json'\\'','\\''utf8'\\''));const impl=fs.readFileSync('\\''packages/convention/rust/src/operations.rs'\\'','\\''utf8'\\'');console.log(JSON.stringify({units:units.map(u=>({anchor:u.anchor,digest:u.textDigest})),linkTargets:targets,missing,areaRootExists:fs.existsSync('\\''docs/platform/system-architecture'\\''),conventionOperations:['\\''convention_name'\\'','\\''convention_path'\\'','\\''check_paths'\\'','\\''classify'\\''].map(n=>({name:n,implemented:impl.includes('\\''pub fn '\\''+n+'\\''('\\'')})),conventionRuleShapes:[...new Set(rules.rules.map(r=>r.shape))],phase6Authorized:/Phase 6 authorized: yes/.test(answer),portalSaysPhases03to09Unauthorized:portal.includes('\\''Phases 03–09 remain unauthorized'\\'')}));if(missing.length)process.exitCode=1;'",
        "exitCode": 0,
        "output": "{\"units\":[{\"anchor\":\"platform-documentation\",\"digest\":\"8fc9c0389780b881695ab47666312083822592c77e4e6e7edc4ab35da7c1299e\"},{\"anchor\":\"unheaded-block-1\",\"digest\":\"de17bdcf6470426386de3e75549ce8239a1e535e747842facdc53dd258fb1479\"},{\"anchor\":\"unheaded-block-2\",\"digest\":\"efc34ef6f5aa655035efac51a724089ce84dd17cd231f6dacdef63f5d1356c05\"},{\"anchor\":\"1-platform-wide-anchors\",\"digest\":\"a50bb1654cb8fda3fd30a1d4de47465b15870f24a5a7034d6c003f6ee386612c\"},{\"anchor\":\"unheaded-block-3\",\"digest\":\"b91459b47f7a7aec45a0e03afc29342b26e9cdba66f334988a648ac9acf6e4bd\"},{\"anchor\":\"unheaded-block-4\",\"digest\":\"9b4b3a19cc2e07dbd32a971403f26aa29034191bff4c65de59850183866d0e24\"},{\"anchor\":\"2-area-registry\",\"digest\":\"6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66\"},{\"anchor\":\"unheaded-block-5\",\"digest\":\"ca9b55008482c55a9c860c3c957855a19075bdd07ef9e882435be2c6d2413069\"},{\"anchor\":\"unheaded-block-6\",\"digest\":\"3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2\"},{\"anchor\":\"3-decision-surface\",\"digest\":\"4f71dfe83dabcb8db41496b7f6ef054a9c8241d3847dd590731f03430e017ccb\"},{\"anchor\":\"unheaded-block-7\",\"digest\":\"f2fc847dcc06987d76c83c1e8ab5f049b5d6ab9b049241ca047d517d6b1afd63\"},{\"anchor\":\"4-how-to-change-platform-docs\",\"digest\":\"26ba4bbb4020dfcf0e9c7691d01fae431c0ade4e92ec48d9e28793ac84ccd34b\"},{\"anchor\":\"unheaded-block-8\",\"digest\":\"e4046fd7c27a762982d49241b30e3f99899719586530455fb4e9dfc7fbb6734f\"},{\"anchor\":\"5-related-files\",\"digest\":\"c216275c70704b3851ca22c07410a6743b69a249a0fda11cf67bc8b848cce2a5\"},{\"anchor\":\"unheaded-block-9\",\"digest\":\"233073464aa7a066ec6812e54a3bbc87f523a2f83c8b0a1c87d09448296f8c74\"}],\"linkTargets\":[\"vision.md\",\"../platform-foundations.md\",\"../work-item-lifecycle-vision.md\",\"intent-preservation-ledger.md\",\"../architect/agent-coordination/intent-preservation-ledger.md\",\"platform-foundations.md\",\"../specs/platform-foundations.md\",\"architecture-map.md\",\"../architecture-map.md\",\"component-boundary.md\",\"../architect/component-boundary/\",\"../contracts/\",\"../routing-handoff-contract.md\",\"../specs/runner.md\",\"../specs/work-state.md\",\"packaging-distribution/README.md\",\"../specs/distribution.md\",\"../distribution-vision.md\",\"../architect/packaging-distribution/\",\"host-invocation-routing/README.md\",\"../architect/host-invocation-routing/\",\"convention/spec.md\",\"agent-coordination/README.md\",\"../architect/agent-coordination/\",\"../../domains/\",\"../../.agents/skills/\",\"../../plugins/fgOS/skills/\",\"../ui-spec/\",\"proposals/documentation-system-unification.md\",\"migration-authoring-rules.md\",\"../transitional-switchboard.md\",\"../doc-governance.md\",\"../reading-map.md\"],\"missing\":[],\"areaRootExists\":true,\"conventionOperations\":[{\"name\":\"convention_name\",\"implemented\":true},{\"name\":\"convention_path\",\"implemented\":true},{\"name\":\"check_paths\",\"implemented\":true},{\"name\":\"classify\",\"implemented\":true}],\"conventionRuleShapes\":[\"name-template\",\"placement-glob\"],\"phase6Authorized\":true,\"portalSaysPhases03to09Unauthorized\":false}\n",
        "outputDigest": "97c1da109de5169181f1d9ce4e9617502a4a87a286ef69d991d8e592d11db16a",
        "inputs": [
          {
            "path": "scripts/check-doc-candidate-status.mjs",
            "blobSha": "789bb33eec89ed5dac3736880cc27e95d71ba857"
          },
          {
            "path": "scripts/generate-doc-inventory.mjs",
            "blobSha": "a52981ff2862cc2c553dbb3181e4e822a26b146b"
          }
        ],
        "dataInputs": [
          {
            "path": "docs/platform/README.md",
            "scope": "unchanged pre-carriage prefix at the report pin; appendix removed only"
          },
          {
            "path": "plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md",
            "blobSha": "265b2fc433034053c1e93eee8212ad4da840a032"
          },
          {
            "path": "packages/convention/contracts/convention.rules.v1.json",
            "blobSha": "ac399ac8fab84a181d572663a3179fd5a49a73c8"
          },
          {
            "path": "packages/convention/rust/src/operations.rs",
            "blobSha": "460f7839751c97b401f53428c5c26b29ed97319e"
          }
        ]
      },
      {
        "command": "env -u CLAUDE_CODE_SESSION_ID node --input-type=module -e 'import fs from '\\''node:fs'\\'';import assert from '\\''node:assert/strict'\\'';import {relativeLinkTargets} from '\\''./scripts/check-doc-candidate-status.mjs'\\'';import {execFileSync} from '\\''node:child_process'\\'';const file='\\''archive/plans/260825-1841-knowledge-registry/plan.md'\\'',plan=fs.readFileSync(file,'\\''utf8'\\''),correction=fs.readFileSync('\\''archive/plans/260825-1841-knowledge-registry/CURRENT-STATE-CORRECTION.md'\\'','\\''utf8'\\''),portal=fs.readFileSync('\\''docs/platform/README.md'\\'','\\''utf8'\\''),rules=JSON.parse(fs.readFileSync('\\''packages/convention/contracts/convention.rules.v1.json'\\'')),operations=fs.readFileSync('\\''packages/convention/rust/src/operations.rs'\\'','\\''utf8'\\'');assert(/^status: completed$/m.test(plan));assert(plan.includes('\\''5c948d2a4'\\''));assert(correction.includes('\\''5c948d2a49da9fc184513bba5585a9a381ee5edb'\\''));execFileSync('\\''git'\\'',['\\''merge-base'\\'','\\''--is-ancestor'\\'','\\''5c948d2a4'\\'','\\''HEAD'\\'']);assert(portal.includes(file));assert(!fs.existsSync('\\''plans/260825-1841-knowledge-registry/plan.md'\\''));assert(relativeLinkTargets(portal).length>0);const names=['\\''convention_name'\\'','\\''convention_path'\\'','\\''check_paths'\\'','\\''classify'\\''];assert(names.every(n=>operations.includes('\\''pub fn '\\''+n+'\\''('\\'')));const shapes=[...new Set(rules.rules.map(r=>r.shape))];assert.deepEqual(shapes.sort(),['\\''name-template'\\'','\\''placement-glob'\\'']);console.log(JSON.stringify({archivePlan:file,status:'\\''completed'\\'',foundationCommit:'\\''5c948d2a4'\\'',ancestor:true,oldPlanAbsent:true,currentPortalArchivePath:true,conventionOperations:names,ruleShapes:shapes,bodyHealthRules:false}));'",
        "exitCode": 0,
        "output": "{\"archivePlan\":\"archive/plans/260825-1841-knowledge-registry/plan.md\",\"status\":\"completed\",\"foundationCommit\":\"5c948d2a4\",\"ancestor\":true,\"oldPlanAbsent\":true,\"currentPortalArchivePath\":true,\"conventionOperations\":[\"convention_name\",\"convention_path\",\"check_paths\",\"classify\"],\"ruleShapes\":[\"name-template\",\"placement-glob\"],\"bodyHealthRules\":false}\n",
        "outputDigest": "2544e413cbf169b7e4a71276c7c43d5d5fd9f0ea128ea01f014c96d2f087804b",
        "inputs": [
          {
            "path": "scripts/check-doc-candidate-status.mjs",
            "blobSha": "789bb33eec89ed5dac3736880cc27e95d71ba857"
          }
        ],
        "dataInputs": [
          {
            "path": "archive/plans/260825-1841-knowledge-registry/plan.md",
            "blobSha": "ee13eacb7b53e915e0975ec02ad5ccf12f186d1e"
          },
          {
            "path": "archive/plans/260825-1841-knowledge-registry/CURRENT-STATE-CORRECTION.md",
            "blobSha": "041b6b3abf9007744cfd2ed3e5b3b325365a79e1"
          },
          {
            "path": "docs/platform/README.md",
            "blobSha": "24916921770ab41a1efcccea59c58997cc20dcc6"
          },
          {
            "path": "packages/convention/contracts/convention.rules.v1.json",
            "blobSha": "ac399ac8fab84a181d572663a3179fd5a49a73c8"
          },
          {
            "path": "packages/convention/rust/src/operations.rs",
            "blobSha": "460f7839751c97b401f53428c5c26b29ed97319e"
          }
        ]
      }
    ],
    "scope": "Current layout, route destinations, implemented convention path-only operations, and archived implemented end-user registry foundation; no platform engine implementation or promotion asserted."
  }
}
```

## claim_51d4658b154804b82dbce0587b17efc0

Full receipt, full shown text and evidence (including actual outputs):

```json
{
  "claimId": "claim_51d4658b154804b82dbce0587b17efc0",
  "path": "docs/platform/README.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2",
  "shownText": "| Area | Current source during migration |\n|---|---|\n| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |\n| `work-state` | [../specs/work-state.md](../specs/work-state.md) |\n| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |\n| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |\n| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |\n| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |\n| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |\n| `ui-spec` | [../ui-spec/](../ui-spec/) |\n| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |",
  "shownTextDigest": "3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2",
  "class": "candidate-native-content",
  "authoredBy": "codex-session:unit-run-1792026600994-509241c8@2026-10-15",
  "rationale": "Full Area Registry payload contains implementation and scope assertions as well as reader routes, so content classification is retained. Replayed current evidence accepts only code-prefix citations and command inputs; archive and package facts are explicit command data inputs. Independent approval remains pending.",
  "reviewStatus": "pending",
  "predecessorClaimId": "claim_ec78621ff44b9fe7fa47ce85bd84bfa6",
  "priorReceipt": {
    "path": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-whole-system-portal.json",
    "commit": "dfff335d3f620b49403e4e4b2f70cedee5ca0452",
    "receipt": {
      "claimId": "claim_ec78621ff44b9fe7fa47ce85bd84bfa6",
      "path": "docs/platform/README.md",
      "anchor": "unheaded-block-6",
      "unitDigest": "3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2",
      "shownText": "| Area | Current source during migration |\n|---|---|\n| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |\n| `work-state` | [../specs/work-state.md](../specs/work-state.md) |\n| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |\n| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |\n| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |\n| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |\n| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |\n| `ui-spec` | [../ui-spec/](../ui-spec/) |\n| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |",
      "shownTextDigest": "3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2",
      "class": "candidate-native-content",
      "authoredBy": "codex-session:39@2026-10-15",
      "reviewStatus": "pending",
      "rationale": "Current canonical portal content, with only the stale knowledge-registry foundation path corrected to its existing archived location. Full unit shown, all other assertions unchanged; independent classification/content review pending.",
      "currentEvidence": {
        "commit": "36d79ddcc4e421b4739e34f73be8f878bedfadf7",
        "finding": "true-and-current",
        "scope": "Authored evidence for the authorized path-only correction; independent content acceptance pending. The remaining assertions retain their committed evidence and Lead ordinary assessment.",
        "citations": [
          {
            "path": "archive/plans/260825-1841-knowledge-registry/plan.md",
            "startLine": 1,
            "endLine": 25,
            "blobSha": "ee13eacb7b53e915e0975ec02ad5ccf12f186d1e"
          }
        ],
        "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/accounting-261015-0700-whole-system-verdict-corrections.md.json"
      },
      "amendedBy": "codex-session:42@2026-10-15",
      "rebindingReason": "A19 path-only correction, real extractor unit and full shown-section payload; A22 pending review.",
      "priorEvidence": {
        "commit": "48da12f2b5dedd6d9dd047ffb9c96f9259e20930",
        "finding": "true-and-current",
        "citations": [
          {
            "path": "scripts/check-doc-candidate-status.mjs",
            "startLine": 1,
            "endLine": 69,
            "blobSha": "789bb33eec89ed5dac3736880cc27e95d71ba857"
          },
          {
            "path": "apps/fgos/src/cli_projector.rs",
            "startLine": 75,
            "endLine": 86,
            "blobSha": "fbc44236f38e8052ffaccc52afa3be8d10b8b349"
          }
        ],
        "commands": [
          {
            "command": "node --input-type=module -e 'import fs from '\\''node:fs'\\'';import path from '\\''node:path'\\'';import {relativeLinkTargets} from '\\''./scripts/check-doc-candidate-status.mjs'\\'';import {extractMarkdownConservationUnits} from '\\''./scripts/generate-doc-inventory.mjs'\\'';const portal=fs.readFileSync('\\''docs/platform/README.md'\\'','\\''utf8'\\'');const targets=[...new Set(relativeLinkTargets(portal))];const missing=targets.filter(p=>!fs.existsSync(path.resolve('\\''docs/platform'\\'',p)));const units=extractMarkdownConservationUnits(portal);const answer=fs.readFileSync('\\''plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md'\\'','\\''utf8'\\'');const rules=JSON.parse(fs.readFileSync('\\''packages/convention/contracts/convention.rules.v1.json'\\'','\\''utf8'\\''));const impl=fs.readFileSync('\\''packages/convention/rust/src/operations.rs'\\'','\\''utf8'\\'');console.log(JSON.stringify({units:units.map(u=>({anchor:u.anchor,digest:u.textDigest})),linkTargets:targets,missing,areaRootExists:fs.existsSync('\\''docs/platform/system-architecture'\\''),conventionOperations:['\\''convention_name'\\'','\\''convention_path'\\'','\\''check_paths'\\'','\\''classify'\\''].map(n=>({name:n,implemented:impl.includes('\\''pub fn '\\''+n+'\\''('\\'')})),conventionRuleShapes:[...new Set(rules.rules.map(r=>r.shape))],phase6Authorized:/Phase 6 authorized: yes/.test(answer),portalSaysPhases03to09Unauthorized:portal.includes('\\''Phases 03–09 remain unauthorized'\\'')}));if(missing.length)process.exitCode=1;'",
            "exitCode": 0,
            "output": "{\"units\":[{\"anchor\":\"platform-documentation\",\"digest\":\"8fc9c0389780b881695ab47666312083822592c77e4e6e7edc4ab35da7c1299e\"},{\"anchor\":\"unheaded-block-1\",\"digest\":\"de17bdcf6470426386de3e75549ce8239a1e535e747842facdc53dd258fb1479\"},{\"anchor\":\"unheaded-block-2\",\"digest\":\"efc34ef6f5aa655035efac51a724089ce84dd17cd231f6dacdef63f5d1356c05\"},{\"anchor\":\"1-platform-wide-anchors\",\"digest\":\"a50bb1654cb8fda3fd30a1d4de47465b15870f24a5a7034d6c003f6ee386612c\"},{\"anchor\":\"unheaded-block-3\",\"digest\":\"b91459b47f7a7aec45a0e03afc29342b26e9cdba66f334988a648ac9acf6e4bd\"},{\"anchor\":\"unheaded-block-4\",\"digest\":\"9b4b3a19cc2e07dbd32a971403f26aa29034191bff4c65de59850183866d0e24\"},{\"anchor\":\"2-area-registry\",\"digest\":\"c1c8d66852c686b940eb0ceab00d7f6abde4f143be360919f223176afeae88d1\"},{\"anchor\":\"unheaded-block-5\",\"digest\":\"ca9b55008482c55a9c860c3c957855a19075bdd07ef9e882435be2c6d2413069\"},{\"anchor\":\"unheaded-block-6\",\"digest\":\"f2d3701022f39f5669ec2aa50aa078458032d0aad4398630e3aaf3dcc5b353ca\"},{\"anchor\":\"3-decision-surface\",\"digest\":\"5b577ba76c013ac3079053a37da9764292815a862e3d1519d54172d8d9bf7e3c\"},{\"anchor\":\"unheaded-block-7\",\"digest\":\"d2295aa8bb8ade7d7e359ae65c80b310d7baf8921771294e58d0523302d5269e\"},{\"anchor\":\"4-how-to-change-platform-docs\",\"digest\":\"26ba4bbb4020dfcf0e9c7691d01fae431c0ade4e92ec48d9e28793ac84ccd34b\"},{\"anchor\":\"unheaded-block-8\",\"digest\":\"e4046fd7c27a762982d49241b30e3f99899719586530455fb4e9dfc7fbb6734f\"},{\"anchor\":\"5-related-files\",\"digest\":\"c216275c70704b3851ca22c07410a6743b69a249a0fda11cf67bc8b848cce2a5\"},{\"anchor\":\"unheaded-block-9\",\"digest\":\"233073464aa7a066ec6812e54a3bbc87f523a2f83c8b0a1c87d09448296f8c74\"}],\"linkTargets\":[\"vision.md\",\"../platform-foundations.md\",\"../work-item-lifecycle-vision.md\",\"intent-preservation-ledger.md\",\"../architect/agent-coordination/intent-preservation-ledger.md\",\"platform-foundations.md\",\"../specs/platform-foundations.md\",\"architecture-map.md\",\"../architecture-map.md\",\"component-boundary.md\",\"../architect/component-boundary/\",\"../contracts/\",\"../routing-handoff-contract.md\",\"../specs/runner.md\",\"../specs/work-state.md\",\"packaging-distribution/README.md\",\"../specs/distribution.md\",\"../distribution-vision.md\",\"../architect/packaging-distribution/\",\"host-invocation-routing/README.md\",\"../architect/host-invocation-routing/\",\"convention/spec.md\",\"agent-coordination/README.md\",\"../architect/agent-coordination/\",\"../../domains/\",\"../../.agents/skills/\",\"../../plugins/fgOS/skills/\",\"../ui-spec/\",\"proposals/documentation-system-unification.md\",\"migration-authoring-rules.md\",\"../transitional-switchboard.md\",\"../doc-governance.md\",\"../reading-map.md\"],\"missing\":[],\"areaRootExists\":true,\"conventionOperations\":[{\"name\":\"convention_name\",\"implemented\":true},{\"name\":\"convention_path\",\"implemented\":true},{\"name\":\"check_paths\",\"implemented\":true},{\"name\":\"classify\",\"implemented\":true}],\"conventionRuleShapes\":[\"name-template\",\"placement-glob\"],\"phase6Authorized\":true,\"portalSaysPhases03to09Unauthorized\":true}\n",
            "outputDigest": "2460d4dd3ac393bd93bceab9e3ee03e33a84bc471271253f74ee1014fc67ca56",
            "inputs": [
              {
                "path": "scripts/check-doc-candidate-status.mjs",
                "blobSha": "789bb33eec89ed5dac3736880cc27e95d71ba857"
              },
              {
                "path": "scripts/generate-doc-inventory.mjs",
                "blobSha": "a52981ff2862cc2c553dbb3181e4e822a26b146b"
              }
            ],
            "dataInputs": [
              {
                "path": "docs/platform/README.md",
                "scope": "unchanged pre-carriage prefix at the report pin; appendix removed only"
              },
              {
                "path": "plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md",
                "blobSha": "265b2fc433034053c1e93eee8212ad4da840a032"
              },
              {
                "path": "packages/convention/contracts/convention.rules.v1.json",
                "blobSha": "ac399ac8fab84a181d572663a3179fd5a49a73c8"
              },
              {
                "path": "packages/convention/rust/src/operations.rs",
                "blobSha": "460f7839751c97b401f53428c5c26b29ed97319e"
              }
            ]
          }
        ],
        "scope": "Checks cover the stated documentation layout and descriptor/role of existing route destinations. Convention naming/path generation and path checking are implemented, as CLI projector, Rust operations and path-only packaged rule shapes show. No document-body health implementation is asserted by those rules. The table describes proposals as proposals and names implemented registry foundation separately; neither is promoted by this receipt."
      }
    }
  },
  "currentEvidence": {
    "commit": "5f0403a0055a9cb50f9975cb74777fba3828eff4",
    "finding": "true-and-current",
    "citations": [
      {
        "path": "scripts/check-doc-candidate-status.mjs",
        "startLine": 1,
        "endLine": 69,
        "blobSha": "789bb33eec89ed5dac3736880cc27e95d71ba857"
      },
      {
        "path": "apps/fgos/src/cli_projector.rs",
        "startLine": 75,
        "endLine": 86,
        "blobSha": "fbc44236f38e8052ffaccc52afa3be8d10b8b349"
      }
    ],
    "commands": [
      {
        "command": "node --input-type=module -e 'import fs from '\\''node:fs'\\'';import path from '\\''node:path'\\'';import {relativeLinkTargets} from '\\''./scripts/check-doc-candidate-status.mjs'\\'';import {extractMarkdownConservationUnits} from '\\''./scripts/generate-doc-inventory.mjs'\\'';const portal=fs.readFileSync('\\''docs/platform/README.md'\\'','\\''utf8'\\'');const targets=[...new Set(relativeLinkTargets(portal))];const missing=targets.filter(p=>!fs.existsSync(path.resolve('\\''docs/platform'\\'',p)));const units=extractMarkdownConservationUnits(portal);const answer=fs.readFileSync('\\''plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md'\\'','\\''utf8'\\'');const rules=JSON.parse(fs.readFileSync('\\''packages/convention/contracts/convention.rules.v1.json'\\'','\\''utf8'\\''));const impl=fs.readFileSync('\\''packages/convention/rust/src/operations.rs'\\'','\\''utf8'\\'');console.log(JSON.stringify({units:units.map(u=>({anchor:u.anchor,digest:u.textDigest})),linkTargets:targets,missing,areaRootExists:fs.existsSync('\\''docs/platform/system-architecture'\\''),conventionOperations:['\\''convention_name'\\'','\\''convention_path'\\'','\\''check_paths'\\'','\\''classify'\\''].map(n=>({name:n,implemented:impl.includes('\\''pub fn '\\''+n+'\\''('\\'')})),conventionRuleShapes:[...new Set(rules.rules.map(r=>r.shape))],phase6Authorized:/Phase 6 authorized: yes/.test(answer),portalSaysPhases03to09Unauthorized:portal.includes('\\''Phases 03–09 remain unauthorized'\\'')}));if(missing.length)process.exitCode=1;'",
        "exitCode": 0,
        "output": "{\"units\":[{\"anchor\":\"platform-documentation\",\"digest\":\"8fc9c0389780b881695ab47666312083822592c77e4e6e7edc4ab35da7c1299e\"},{\"anchor\":\"unheaded-block-1\",\"digest\":\"de17bdcf6470426386de3e75549ce8239a1e535e747842facdc53dd258fb1479\"},{\"anchor\":\"unheaded-block-2\",\"digest\":\"efc34ef6f5aa655035efac51a724089ce84dd17cd231f6dacdef63f5d1356c05\"},{\"anchor\":\"1-platform-wide-anchors\",\"digest\":\"a50bb1654cb8fda3fd30a1d4de47465b15870f24a5a7034d6c003f6ee386612c\"},{\"anchor\":\"unheaded-block-3\",\"digest\":\"b91459b47f7a7aec45a0e03afc29342b26e9cdba66f334988a648ac9acf6e4bd\"},{\"anchor\":\"unheaded-block-4\",\"digest\":\"9b4b3a19cc2e07dbd32a971403f26aa29034191bff4c65de59850183866d0e24\"},{\"anchor\":\"2-area-registry\",\"digest\":\"6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66\"},{\"anchor\":\"unheaded-block-5\",\"digest\":\"ca9b55008482c55a9c860c3c957855a19075bdd07ef9e882435be2c6d2413069\"},{\"anchor\":\"unheaded-block-6\",\"digest\":\"3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2\"},{\"anchor\":\"3-decision-surface\",\"digest\":\"4f71dfe83dabcb8db41496b7f6ef054a9c8241d3847dd590731f03430e017ccb\"},{\"anchor\":\"unheaded-block-7\",\"digest\":\"f2fc847dcc06987d76c83c1e8ab5f049b5d6ab9b049241ca047d517d6b1afd63\"},{\"anchor\":\"4-how-to-change-platform-docs\",\"digest\":\"26ba4bbb4020dfcf0e9c7691d01fae431c0ade4e92ec48d9e28793ac84ccd34b\"},{\"anchor\":\"unheaded-block-8\",\"digest\":\"e4046fd7c27a762982d49241b30e3f99899719586530455fb4e9dfc7fbb6734f\"},{\"anchor\":\"5-related-files\",\"digest\":\"c216275c70704b3851ca22c07410a6743b69a249a0fda11cf67bc8b848cce2a5\"},{\"anchor\":\"unheaded-block-9\",\"digest\":\"233073464aa7a066ec6812e54a3bbc87f523a2f83c8b0a1c87d09448296f8c74\"}],\"linkTargets\":[\"vision.md\",\"../platform-foundations.md\",\"../work-item-lifecycle-vision.md\",\"intent-preservation-ledger.md\",\"../architect/agent-coordination/intent-preservation-ledger.md\",\"platform-foundations.md\",\"../specs/platform-foundations.md\",\"architecture-map.md\",\"../architecture-map.md\",\"component-boundary.md\",\"../architect/component-boundary/\",\"../contracts/\",\"../routing-handoff-contract.md\",\"../specs/runner.md\",\"../specs/work-state.md\",\"packaging-distribution/README.md\",\"../specs/distribution.md\",\"../distribution-vision.md\",\"../architect/packaging-distribution/\",\"host-invocation-routing/README.md\",\"../architect/host-invocation-routing/\",\"convention/spec.md\",\"agent-coordination/README.md\",\"../architect/agent-coordination/\",\"../../domains/\",\"../../.agents/skills/\",\"../../plugins/fgOS/skills/\",\"../ui-spec/\",\"proposals/documentation-system-unification.md\",\"migration-authoring-rules.md\",\"../transitional-switchboard.md\",\"../doc-governance.md\",\"../reading-map.md\"],\"missing\":[],\"areaRootExists\":true,\"conventionOperations\":[{\"name\":\"convention_name\",\"implemented\":true},{\"name\":\"convention_path\",\"implemented\":true},{\"name\":\"check_paths\",\"implemented\":true},{\"name\":\"classify\",\"implemented\":true}],\"conventionRuleShapes\":[\"name-template\",\"placement-glob\"],\"phase6Authorized\":true,\"portalSaysPhases03to09Unauthorized\":false}\n",
        "outputDigest": "97c1da109de5169181f1d9ce4e9617502a4a87a286ef69d991d8e592d11db16a",
        "inputs": [
          {
            "path": "scripts/check-doc-candidate-status.mjs",
            "blobSha": "789bb33eec89ed5dac3736880cc27e95d71ba857"
          },
          {
            "path": "scripts/generate-doc-inventory.mjs",
            "blobSha": "a52981ff2862cc2c553dbb3181e4e822a26b146b"
          }
        ],
        "dataInputs": [
          {
            "path": "docs/platform/README.md",
            "scope": "unchanged pre-carriage prefix at the report pin; appendix removed only"
          },
          {
            "path": "plans/260925-documentation-authority-unification/reports/phase-06/owner-answers.md",
            "blobSha": "265b2fc433034053c1e93eee8212ad4da840a032"
          },
          {
            "path": "packages/convention/contracts/convention.rules.v1.json",
            "blobSha": "ac399ac8fab84a181d572663a3179fd5a49a73c8"
          },
          {
            "path": "packages/convention/rust/src/operations.rs",
            "blobSha": "460f7839751c97b401f53428c5c26b29ed97319e"
          }
        ]
      },
      {
        "command": "env -u CLAUDE_CODE_SESSION_ID node --input-type=module -e 'import fs from '\\''node:fs'\\'';import assert from '\\''node:assert/strict'\\'';import {relativeLinkTargets} from '\\''./scripts/check-doc-candidate-status.mjs'\\'';import {execFileSync} from '\\''node:child_process'\\'';const file='\\''archive/plans/260825-1841-knowledge-registry/plan.md'\\'',plan=fs.readFileSync(file,'\\''utf8'\\''),correction=fs.readFileSync('\\''archive/plans/260825-1841-knowledge-registry/CURRENT-STATE-CORRECTION.md'\\'','\\''utf8'\\''),portal=fs.readFileSync('\\''docs/platform/README.md'\\'','\\''utf8'\\''),rules=JSON.parse(fs.readFileSync('\\''packages/convention/contracts/convention.rules.v1.json'\\'')),operations=fs.readFileSync('\\''packages/convention/rust/src/operations.rs'\\'','\\''utf8'\\'');assert(/^status: completed$/m.test(plan));assert(plan.includes('\\''5c948d2a4'\\''));assert(correction.includes('\\''5c948d2a49da9fc184513bba5585a9a381ee5edb'\\''));execFileSync('\\''git'\\'',['\\''merge-base'\\'','\\''--is-ancestor'\\'','\\''5c948d2a4'\\'','\\''HEAD'\\'']);assert(portal.includes(file));assert(!fs.existsSync('\\''plans/260825-1841-knowledge-registry/plan.md'\\''));assert(relativeLinkTargets(portal).length>0);const names=['\\''convention_name'\\'','\\''convention_path'\\'','\\''check_paths'\\'','\\''classify'\\''];assert(names.every(n=>operations.includes('\\''pub fn '\\''+n+'\\''('\\'')));const shapes=[...new Set(rules.rules.map(r=>r.shape))];assert.deepEqual(shapes.sort(),['\\''name-template'\\'','\\''placement-glob'\\'']);console.log(JSON.stringify({archivePlan:file,status:'\\''completed'\\'',foundationCommit:'\\''5c948d2a4'\\'',ancestor:true,oldPlanAbsent:true,currentPortalArchivePath:true,conventionOperations:names,ruleShapes:shapes,bodyHealthRules:false}));'",
        "exitCode": 0,
        "output": "{\"archivePlan\":\"archive/plans/260825-1841-knowledge-registry/plan.md\",\"status\":\"completed\",\"foundationCommit\":\"5c948d2a4\",\"ancestor\":true,\"oldPlanAbsent\":true,\"currentPortalArchivePath\":true,\"conventionOperations\":[\"convention_name\",\"convention_path\",\"check_paths\",\"classify\"],\"ruleShapes\":[\"name-template\",\"placement-glob\"],\"bodyHealthRules\":false}\n",
        "outputDigest": "2544e413cbf169b7e4a71276c7c43d5d5fd9f0ea128ea01f014c96d2f087804b",
        "inputs": [
          {
            "path": "scripts/check-doc-candidate-status.mjs",
            "blobSha": "789bb33eec89ed5dac3736880cc27e95d71ba857"
          }
        ],
        "dataInputs": [
          {
            "path": "archive/plans/260825-1841-knowledge-registry/plan.md",
            "blobSha": "ee13eacb7b53e915e0975ec02ad5ccf12f186d1e"
          },
          {
            "path": "archive/plans/260825-1841-knowledge-registry/CURRENT-STATE-CORRECTION.md",
            "blobSha": "041b6b3abf9007744cfd2ed3e5b3b325365a79e1"
          },
          {
            "path": "docs/platform/README.md",
            "blobSha": "24916921770ab41a1efcccea59c58997cc20dcc6"
          },
          {
            "path": "packages/convention/contracts/convention.rules.v1.json",
            "blobSha": "ac399ac8fab84a181d572663a3179fd5a49a73c8"
          },
          {
            "path": "packages/convention/rust/src/operations.rs",
            "blobSha": "460f7839751c97b401f53428c5c26b29ed97319e"
          }
        ]
      }
    ],
    "scope": "Current layout, route destinations, implemented convention path-only operations, and archived implemented end-user registry foundation; no platform engine implementation or promotion asserted."
  }
}
```

## Actual pending reference bindings

```json
[
  {
    "claimId": "claim_1898cdafa7835d675526173d39eb5cd2",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-whole-system-portal-evidence-rework.json",
    "reviewStatus": "pending",
    "predecessorClaimId": "claim_1898cdafa7835d675526173d39eb5cd2",
    "receiptCommit": "ec08072e26949676703446c99a1229abc6793901",
    "receiptBinding": "Actual committed re-issued artifact; independent classification review pending; no approval carry."
  },
  {
    "claimId": "claim_51d4658b154804b82dbce0587b17efc0",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-whole-system-portal-evidence-rework.json",
    "reviewStatus": "pending",
    "predecessorClaimId": "claim_ec78621ff44b9fe7fa47ce85bd84bfa6",
    "receiptCommit": "ec08072e26949676703446c99a1229abc6793901",
    "receiptBinding": "Actual committed re-issued artifact; independent classification review pending; no approval carry."
  }
]
```

## Full shown receipt text: claim_1898cdafa7835d675526173d39eb5cd2

Unit digest: 6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66
Shown text digest: f5c1667c7fdb67315d2494ac0726098261794fc00f205d99f5b60214c199a21f

~~~~markdown
## 2. Area Registry

Target area docs live at `docs/platform/<area>/`.

| Area | Current source during migration |
|---|---|
| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |
| `work-state` | [../specs/work-state.md](../specs/work-state.md) |
| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |
| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |
| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |
| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |
| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |
| `ui-spec` | [../ui-spec/](../ui-spec/) |
| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |
~~~~

## Full shown receipt text: claim_51d4658b154804b82dbce0587b17efc0

Unit digest: 3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2
Shown text digest: 3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2

~~~~markdown
| Area | Current source during migration |
|---|---|
| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |
| `work-state` | [../specs/work-state.md](../specs/work-state.md) |
| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |
| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |
| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |
| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |
| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |
| `ui-spec` | [../ui-spec/](../ui-spec/) |
| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |
~~~~
