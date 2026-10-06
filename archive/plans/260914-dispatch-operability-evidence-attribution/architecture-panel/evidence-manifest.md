# Supplemental Panel Evidence Manifest

**Session:** `dispatch-operability-design-d06-panel-r2`
**Captured:** 2026-09-15
**Purpose:** make the supplemental panel evidence durable inside the design
track instead of relying on mutable runtime-store paths.

## Scope And Limitation

This manifest binds the role outputs copied from
`.fgos/assignments/asgn_codex_lead_op_*/runs/01/` into this track. It does not
retroactively change the session event log or claim the original protocol
visibility windows carried these artifact hashes. The accepted repair is:

- the D06 record no longer claims staged-visibility proof from this run;
- the D06 record describes the run as **operator-authorized Codex-only
  role-separated review**, not cross-provider independent review;
- downstream summaries cite committed artifact paths and hashes below.

## Role Output Hashes

| Assignment | Operation | Artifact | SHA256 |
|---|---|---|---|
| `asgn_codex_lead_op_001` | `interpret-request` | `role-outputs/asgn_codex_lead_op_001-agent-report.md` | `828108c911797c2b0d631630133abd846f5a19658fa1077cb2aecf076fa67162` |
| `asgn_codex_lead_op_001` | `interpret-request` | `role-outputs/asgn_codex_lead_op_001-agent-result.json` | `f6b6931a773558b49eb7e8c551efd12192bc0430ca26ae44e4b9fa999b545d2b` |
| `asgn_codex_lead_op_001` | `interpret-request` | `role-outputs/asgn_codex_lead_op_001-dispatch-plan.json` | `41d0218cde297b80508a822dd57ae04f60595c142d9962449d9aa8ab92c725ae` |
| `asgn_codex_lead_op_002` | `investigate-context` | `role-outputs/asgn_codex_lead_op_002-agent-report.md` | `d421422403600f9461056c3ec4a9950d743bee47641ec65652285999c43c86e0` |
| `asgn_codex_lead_op_002` | `investigate-context` | `role-outputs/asgn_codex_lead_op_002-agent-result.json` | `5fb041bba68acc4b678b97111537ba52d61dbbb3a442a492f0a94e9384f4eacb` |
| `asgn_codex_lead_op_002` | `investigate-context` | `role-outputs/asgn_codex_lead_op_002-dispatch-plan.json` | `2bfc16cfd7e4c0d751bf68c5e8305c4117dac88bf57a381519b958ab054b9e21` |
| `asgn_codex_lead_op_003` | `shape-system-proposal` | `role-outputs/asgn_codex_lead_op_003-agent-report.md` | `f9c3f0db1f85b363040451d2da246c6baecd604b8528b70d07a814db1ef07446` |
| `asgn_codex_lead_op_003` | `shape-system-proposal` | `role-outputs/asgn_codex_lead_op_003-agent-result.json` | `303f72a0e77b93a45210a22b1c68b1d20624c471375c90065166ef0e491c4c8b` |
| `asgn_codex_lead_op_003` | `shape-system-proposal` | `role-outputs/asgn_codex_lead_op_003-dispatch-plan.json` | `086bbf6d22e80a016df88e54f9bba343a19727c6f87cc3b8fbc7c56403ae75b2` |
| `asgn_codex_lead_op_004` | `shape-alternative-proposal` | `role-outputs/asgn_codex_lead_op_004-agent-report.md` | `47384367860819fec6a69180d0faa73cbf2911dad78f3d58e2e060065a72da55` |
| `asgn_codex_lead_op_004` | `shape-alternative-proposal` | `role-outputs/asgn_codex_lead_op_004-agent-result.json` | `b3ebc5dbf182e9a88e9225374cac9c682ab3810f9912e048e6b66bbae23b0efa` |
| `asgn_codex_lead_op_004` | `shape-alternative-proposal` | `role-outputs/asgn_codex_lead_op_004-dispatch-plan.json` | `7ea28ce2b7be235c0279d34b4eba361cb126b6e48a94ccda409c6b4e0c4c020a` |
| `asgn_codex_lead_op_005` | `shape-constraint-proposal` | `role-outputs/asgn_codex_lead_op_005-agent-report.md` | `4cd7ee027eb811ee0024f9a99d120afb1d0b6b0d4145cc98173e1a128c4df6a7` |
| `asgn_codex_lead_op_005` | `shape-constraint-proposal` | `role-outputs/asgn_codex_lead_op_005-agent-result.json` | `e76948bbcb4a0034342e5c88f42aab7e7b148b6264469db2e8ab828b1127f4bf` |
| `asgn_codex_lead_op_005` | `shape-constraint-proposal` | `role-outputs/asgn_codex_lead_op_005-dispatch-plan.json` | `d099a6e521c8787efca2fad1bfd0e05a536de35c2c7fc96bb60725e5ad152940` |
| `asgn_codex_lead_op_006` | `critique-proposals` | `role-outputs/asgn_codex_lead_op_006-agent-report.md` | `21171f777851cb7a06f1b5d5d10ba28e361ed3f53bde97f761a4fe81176b1e45` |
| `asgn_codex_lead_op_006` | `critique-proposals` | `role-outputs/asgn_codex_lead_op_006-agent-result.json` | `5254be7ccbdf2f018324b6b344eccc77ea9f33355e32388aeffa7569007c2ed5` |
| `asgn_codex_lead_op_006` | `critique-proposals` | `role-outputs/asgn_codex_lead_op_006-dispatch-plan.json` | `f595c969950271a8fb5e097f42c8b5500a41e717df3e31339d5ee5641afaabe9` |
| `asgn_codex_lead_op_007` | `assess-constraints` | `role-outputs/asgn_codex_lead_op_007-agent-report.md` | `8cdcfa3c517ef5a768e2f12747ba3ced25a844f780f09ac6609a4008f13e3264` |
| `asgn_codex_lead_op_007` | `assess-constraints` | `role-outputs/asgn_codex_lead_op_007-agent-result.json` | `6945834ae6a587ea909464c08ba870c2d1a25022cc797a5fd2206b0237e5a4b1` |
| `asgn_codex_lead_op_007` | `assess-constraints` | `role-outputs/asgn_codex_lead_op_007-dispatch-plan.json` | `e616f5b3e10bd8f65e08b03467fccd81e90d282a6dae288fb48ed8cc72f10a54` |
| `asgn_codex_lead_op_008` | `synthesize-recommendation` | `role-outputs/asgn_codex_lead_op_008-agent-report.md` | `4fb18b162dcbfe85ba4b4389e912c11e317a803eb1765cb9494ebe0221e152d6` |
| `asgn_codex_lead_op_008` | `synthesize-recommendation` | `role-outputs/asgn_codex_lead_op_008-agent-result.json` | `62ad325256ac7effd9cb67422c6f60c56afbac4443f1a17c82dad612768609c4` |
| `asgn_codex_lead_op_008` | `synthesize-recommendation` | `role-outputs/asgn_codex_lead_op_008-dispatch-plan.json` | `c32e56544195b635a8e186dd14cf559d84eebc3f83ec877324e0e8886124a52c` |
| `asgn_codex_lead_op_009` | `red-team-packet` | `role-outputs/asgn_codex_lead_op_009-agent-report.md` | `93052a5b38ef897ea2724d22bd9ca9cbba3e8f07b39bd7e350587e246275ad57` |
| `asgn_codex_lead_op_009` | `red-team-packet` | `role-outputs/asgn_codex_lead_op_009-agent-result.json` | `2f92e000b25c18f5285e68b8465aae177c043d14bab489649032acfddcaff74f` |
| `asgn_codex_lead_op_009` | `red-team-packet` | `role-outputs/asgn_codex_lead_op_009-dispatch-plan.json` | `30b629db2bcf9ff4b92dfff88a97c2e7ba934989cf2255d9b20b83d34b1b39b9` |
| `asgn_codex_lead_op_010` | `explain-recommendation` | `role-outputs/asgn_codex_lead_op_010-agent-report.md` | `25f882b6f4e84420b5cdf71429e57ecef9bf82aa992ced8b28c64c2f7e10e730` |
| `asgn_codex_lead_op_010` | `explain-recommendation` | `role-outputs/asgn_codex_lead_op_010-agent-result.json` | `7f3597503ed1bdfc2df72799a9682534e9f632b3b3b7bf5420bfdb60934b69de` |
| `asgn_codex_lead_op_010` | `explain-recommendation` | `role-outputs/asgn_codex_lead_op_010-dispatch-plan.json` | `e804a72974dc9fe0755ff9c41ec4ed94e645b7df95c8f618e363b84ee9e7d129` |

## Recheck Rule

Any later READY claim must verify these hashes with:

```sh
sha256sum -c plans/260914-dispatch-operability-evidence-attribution/architecture-panel/evidence-manifest.sha256
```
