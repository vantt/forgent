# Bounded re-review: native 1

Author session: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **14**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
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

## Entry native-001

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_c90c0415c20234da816351e16f9903b8",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
      "unitDigest": "c54efdb52694a322e03d791eaa9e796f47ec6c79a5dfefdbe3cec203f8786275",
      "identityFingerprint": "94347a48d5893b21f5e3e6feb113b19864d6121083246f382f811a26b23b5dd3",
      "claimId": "claim_c90c0415c20234da816351e16f9903b8",
      "sourceAnchor": "7-constraint-findings-optional-manual-constraintcritique-shape",
      "unitKind": "heading",
      "sourceUnitDigest": "fcc54b69666a906c0dfbfd1e3a24f0f6f1679a130c0afa73facbcd34753a0600",
      "claimKind": "procedure",
      "status": "future"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
      "unitDigest": "177cdfa4ed8333236deea8f0e326619b16dd3e0f36299d936429f8fb731f966c",
      "identityFingerprint": "08150cf200d9c44c74b59be498a7c8ec778445fb6b3917b4701ab4c05747de63",
      "claimId": "claim_c90c0415c20234da816351e16f9903b8",
      "sourceAnchor": "7-constraint-findings-optional-manual-constraintcritique-shape",
      "unitKind": "heading",
      "sourceUnitDigest": "e24524633ae56daa1d8e9a8c4b2956f92d4e08aac51d98f3fe5775b2f9ae3064",
      "claimKind": "procedure",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
        "fromUnitDigest": "c54efdb52694a322e03d791eaa9e796f47ec6c79a5dfefdbe3cec203f8786275",
        "toUnitDigest": "177cdfa4ed8333236deea8f0e326619b16dd3e0f36299d936429f8fb731f966c",
        "fromSourceUnitDigest": "fcc54b69666a906c0dfbfd1e3a24f0f6f1679a130c0afa73facbcd34753a0600",
        "toSourceUnitDigest": "e24524633ae56daa1d8e9a8c4b2956f92d4e08aac51d98f3fe5775b2f9ae3064"
      }
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-001"
}
```

## Entry native-002

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_4a2dfdbfa271d8f20b4e581757288988",
  "before": null,
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
      "unitDigest": "af5da2fe05d1bd41adb3b876f7f6691be48fc28c4740e0cbebe2c64ab2500beb",
      "identityFingerprint": "af5da2fe05d1bd41adb3b876f7f6691be48fc28c4740e0cbebe2c64ab2500beb",
      "claimId": "claim_4a2dfdbfa271d8f20b4e581757288988",
      "sourceAnchor": "unheaded-block-44",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "f03302423020c8beeac177192fbe0952433473b78efd7c17f5eb96b39d67dbca",
      "claimKind": "procedure",
      "status": "future",
      "origin": "added-since-287a22d33a0eaf2d9e47549a1142daf62361bb8c"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-002"
}
```

## Entry native-003

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_133a4900a601db7cbf1182a96540ef56",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
      "unitDigest": "eadec2470097fe8e2dcf7f190f6a1bb75d4c6a90031e0acc88ea01beeb5a75da",
      "identityFingerprint": "267d74c47def0155b7db1889552947dac04434bfd3fb65cf71fa6fbff397d53a",
      "claimId": "claim_133a4900a601db7cbf1182a96540ef56",
      "sourceAnchor": "evidence-and-conduct-boundaries",
      "unitKind": "heading",
      "sourceUnitDigest": "82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed",
      "claimKind": "procedure",
      "status": "future"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
      "unitDigest": "abebcb68e55ccc8fbbd141bec39d4831c644e71293de075717bbb101a0944801",
      "identityFingerprint": "f39ebd529eeb38692ae7bb1aa2e66a4fa6bd0165843cee2760f379eb75e262e9",
      "claimId": "claim_133a4900a601db7cbf1182a96540ef56",
      "sourceAnchor": "evidence-and-conduct-boundaries",
      "unitKind": "heading",
      "sourceUnitDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485",
      "claimKind": "procedure",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
        "fromUnitDigest": "eadec2470097fe8e2dcf7f190f6a1bb75d4c6a90031e0acc88ea01beeb5a75da",
        "toUnitDigest": "abebcb68e55ccc8fbbd141bec39d4831c644e71293de075717bbb101a0944801",
        "fromSourceUnitDigest": "82e4b520abf075cde4a91928c894f9c6ec67226ad6d989b89a8faef4a80409ed",
        "toSourceUnitDigest": "fd599aeb69ec450ccb654795c8db12e37932153fdf60f71c8eeaa7e463b32485"
      }
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-003"
}
```

## Entry native-004

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_cfdd80946e57e4ea360ed04c1413f4dd",
  "before": null,
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
      "unitDigest": "0093aca093c7750ec5c3b0e2bb870a1fba3b1f888cc2292efd9a9d109c023faa",
      "identityFingerprint": "0093aca093c7750ec5c3b0e2bb870a1fba3b1f888cc2292efd9a9d109c023faa",
      "claimId": "claim_cfdd80946e57e4ea360ed04c1413f4dd",
      "sourceAnchor": "unheaded-block-117",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "7486a9e911dc83dd8182817e3d51bccd7b2e95a87b245307e19b3dd1de9fbb34",
      "claimKind": "procedure",
      "status": "future",
      "origin": "added-since-287a22d33a0eaf2d9e47549a1142daf62361bb8c"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-004"
}
```

## Entry native-005

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_0f8c6c5f2ef2d199ee6b6dadfc6d8c22",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/vision.md",
      "unitDigest": "c84288d92cbacb26fda5896a5d82e3650521e890d0f2c9ba5098aeccfe4e3e7c",
      "identityFingerprint": "4bb0db95d09cc26bec05b8b6e4a963cf644ce608ffb3a8a511db866ebd17983d",
      "claimId": "claim_0f8c6c5f2ef2d199ee6b6dadfc6d8c22",
      "sourceAnchor": "5-design-direction",
      "unitKind": "heading",
      "sourceUnitDigest": "da1300cfba58a475b7f5694c6ec38d1546f7f806cdd9243948660e11305ae21e",
      "claimKind": "vision",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
        "fromUnitDigest": "2c662781f55ef01162de9ccb39f88c47db4514f13f92762943da34515e8584cd",
        "toUnitDigest": "c84288d92cbacb26fda5896a5d82e3650521e890d0f2c9ba5098aeccfe4e3e7c",
        "fromSourceUnitDigest": "08b323bdd29556cad36cdfae8c068fa705025d8ccf394e1231c6ff595615bddc",
        "toSourceUnitDigest": "da1300cfba58a475b7f5694c6ec38d1546f7f806cdd9243948660e11305ae21e"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/vision.md",
      "unitDigest": "c84288d92cbacb26fda5896a5d82e3650521e890d0f2c9ba5098aeccfe4e3e7c",
      "identityFingerprint": "4bb0db95d09cc26bec05b8b6e4a963cf644ce608ffb3a8a511db866ebd17983d",
      "claimId": "claim_0f8c6c5f2ef2d199ee6b6dadfc6d8c22",
      "sourceAnchor": "5-design-direction",
      "unitKind": "heading",
      "sourceUnitDigest": "da1300cfba58a475b7f5694c6ec38d1546f7f806cdd9243948660e11305ae21e",
      "claimKind": "vision",
      "status": "future"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-005"
}
```

## Entry native-006

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_dba2f79b14e40be4baf226be555c8a5f",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/vision.md",
      "unitDigest": "69dc8b96e5e58bf19404dfecc1655813a8f2d33e256386a5b039b7fd966a7167",
      "identityFingerprint": "69dc8b96e5e58bf19404dfecc1655813a8f2d33e256386a5b039b7fd966a7167",
      "claimId": "claim_dba2f79b14e40be4baf226be555c8a5f",
      "sourceAnchor": "unheaded-block-11",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "ae9e5973a1589865f79a8daee8e14aa245ce6a8b7a0f7af3978006e63771ebb2",
      "claimKind": "vision",
      "status": "future",
      "origin": "added-since-345f15d95663260976200be66d1b9a6c648bcd6d"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/vision.md",
      "unitDigest": "69dc8b96e5e58bf19404dfecc1655813a8f2d33e256386a5b039b7fd966a7167",
      "identityFingerprint": "69dc8b96e5e58bf19404dfecc1655813a8f2d33e256386a5b039b7fd966a7167",
      "claimId": "claim_dba2f79b14e40be4baf226be555c8a5f",
      "sourceAnchor": "unheaded-block-11",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "ae9e5973a1589865f79a8daee8e14aa245ce6a8b7a0f7af3978006e63771ebb2",
      "claimKind": "vision",
      "status": "future"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-006"
}
```

## Entry native-007

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_c8e76232f9d36feab9a2f8f4594ce132",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/packaging-distribution/spec.md",
      "unitDigest": "5bdc6ba3ca67fc37b5134f93302687e43ed98224427a962e9d60de09cf4420da",
      "identityFingerprint": "5bdc6ba3ca67fc37b5134f93302687e43ed98224427a962e9d60de09cf4420da",
      "claimId": "claim_c8e76232f9d36feab9a2f8f4594ce132",
      "sourceAnchor": "unheaded-block-75",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a",
      "claimKind": "architecture",
      "status": "future",
      "origin": "added-since-345f15d95663260976200be66d1b9a6c648bcd6d"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/packaging-distribution/spec.md",
      "unitDigest": "5bdc6ba3ca67fc37b5134f93302687e43ed98224427a962e9d60de09cf4420da",
      "identityFingerprint": "5bdc6ba3ca67fc37b5134f93302687e43ed98224427a962e9d60de09cf4420da",
      "claimId": "claim_c8e76232f9d36feab9a2f8f4594ce132",
      "sourceAnchor": "unheaded-block-75",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "19851b062b9026d35b203683af36c1a27d3cf542f557549831e1e860138dee6a",
      "claimKind": "architecture",
      "status": "future"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-007"
}
```

## Entry native-008

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_e1b66c812bf83f5716280dcb8540aa15",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/packaging-distribution/spec.md",
      "unitDigest": "9f7010228abc1a430275821df9bd0cd4e57c7ff3a69da7479317c0b68f44aa54",
      "identityFingerprint": "3e6f36181476bd9f5ebb0d46b237e54981a135477ef4912c1b02868b9e3ebfef",
      "claimId": "claim_e1b66c812bf83f5716280dcb8540aa15",
      "sourceAnchor": "workspace-runtime-model",
      "unitKind": "heading",
      "sourceUnitDigest": "d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e",
      "claimKind": "specification",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
        "fromUnitDigest": "f352df7012b9650ee7d863358bc8aa0fb2fc0cfdb0bba10327de620c2518f9b6",
        "toUnitDigest": "9f7010228abc1a430275821df9bd0cd4e57c7ff3a69da7479317c0b68f44aa54",
        "fromSourceUnitDigest": "b17cd70e3bb848b985deb966b7c9ffc192142e8f887bfb49d3bf4d76c70efa15",
        "toSourceUnitDigest": "d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/packaging-distribution/spec.md",
      "unitDigest": "9f7010228abc1a430275821df9bd0cd4e57c7ff3a69da7479317c0b68f44aa54",
      "identityFingerprint": "3e6f36181476bd9f5ebb0d46b237e54981a135477ef4912c1b02868b9e3ebfef",
      "claimId": "claim_e1b66c812bf83f5716280dcb8540aa15",
      "sourceAnchor": "workspace-runtime-model",
      "unitKind": "heading",
      "sourceUnitDigest": "d53ab4e2ea878a02f665cfaa616e61dbd2a988f027669faff34b62bd1834ad2e",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-008"
}
```

## Entry native-009

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_ab5670284703559f1eb46b866fb6354e",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
      "unitDigest": "4d5463d26ac7e00ab703823fe7b11e94d9f4bb8503d96d42d3631fe0c38cfb53",
      "identityFingerprint": "8d5193901ef1ad1984956710149f8d163fcd6a28dc768fe57f0e4b4bb57a24f3",
      "claimId": "claim_ab5670284703559f1eb46b866fb6354e",
      "sourceAnchor": "gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve",
      "unitKind": "heading",
      "sourceUnitDigest": "445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab",
      "claimKind": "procedure",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
        "fromUnitDigest": "2c123a160df2fc26fceb5b77bc31ebc91c2665654cb67ff8cdba6d29c6d4afb4",
        "toUnitDigest": "4d5463d26ac7e00ab703823fe7b11e94d9f4bb8503d96d42d3631fe0c38cfb53",
        "fromSourceUnitDigest": "48228ecbc2881bfaccdcf13a294876cf74c3afe8670c137132403a9a037999b2",
        "toSourceUnitDigest": "445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
      "unitDigest": "4d5463d26ac7e00ab703823fe7b11e94d9f4bb8503d96d42d3631fe0c38cfb53",
      "identityFingerprint": "8d5193901ef1ad1984956710149f8d163fcd6a28dc768fe57f0e4b4bb57a24f3",
      "claimId": "claim_ab5670284703559f1eb46b866fb6354e",
      "sourceAnchor": "gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve",
      "unitKind": "heading",
      "sourceUnitDigest": "445c152056e209d17110ce712ff081e8adc824b2abba8197069b59ad8fcc37ab",
      "claimKind": "procedure",
      "status": "future"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-009"
}
```

## Entry native-010

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_4e0d8183c900cb2ab3954533b1b13592",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
      "unitDigest": "871f3aa2e8699bc9b5c73af0cbf8305884b3469e1f6e2df1845dd8b030d52add",
      "identityFingerprint": "871f3aa2e8699bc9b5c73af0cbf8305884b3469e1f6e2df1845dd8b030d52add",
      "claimId": "claim_4e0d8183c900cb2ab3954533b1b13592",
      "sourceAnchor": "unheaded-block-26",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
      "claimKind": "procedure",
      "status": "future",
      "origin": "added-since-345f15d95663260976200be66d1b9a6c648bcd6d"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
      "unitDigest": "871f3aa2e8699bc9b5c73af0cbf8305884b3469e1f6e2df1845dd8b030d52add",
      "identityFingerprint": "871f3aa2e8699bc9b5c73af0cbf8305884b3469e1f6e2df1845dd8b030d52add",
      "claimId": "claim_4e0d8183c900cb2ab3954533b1b13592",
      "sourceAnchor": "unheaded-block-26",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "0f61fde6bc880cb19623ecde63a6a137571884e4b6ae2f8b24b8a585b25d600a",
      "claimKind": "procedure",
      "status": "future"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-010"
}
```

## Entry native-011

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_589f838032f1c0475587257a362d4cc0",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
      "unitDigest": "81e751acfba7809cf2b86ce1091b6997c14a944cda0a06a86fc362444ff03684",
      "identityFingerprint": "747c9fe99301465ea6693219e532cd257048547585208d3ed0f9684a8c691f0d",
      "claimId": "claim_589f838032f1c0475587257a362d4cc0",
      "sourceAnchor": "added-in-candidate-runner-pointers-implementation",
      "unitKind": "heading",
      "sourceUnitDigest": "000e9e51e310864054f158972bc706147386a93d2b6c86138a108042a1ca10aa",
      "claimKind": "specification",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
        "fromUnitDigest": "ff530d0aab4403cbc1b5c6907f15adcc433ac80580700aacddbd73b4157b0955",
        "toUnitDigest": "81e751acfba7809cf2b86ce1091b6997c14a944cda0a06a86fc362444ff03684",
        "fromSourceUnitDigest": "0fb71e0ecd07635335f72b12c7509c597bad63c51e4f4aeaef5e83992ca8a53d",
        "toSourceUnitDigest": "000e9e51e310864054f158972bc706147386a93d2b6c86138a108042a1ca10aa"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
      "unitDigest": "81e751acfba7809cf2b86ce1091b6997c14a944cda0a06a86fc362444ff03684",
      "identityFingerprint": "747c9fe99301465ea6693219e532cd257048547585208d3ed0f9684a8c691f0d",
      "claimId": "claim_589f838032f1c0475587257a362d4cc0",
      "sourceAnchor": "added-in-candidate-runner-pointers-implementation",
      "unitKind": "heading",
      "sourceUnitDigest": "000e9e51e310864054f158972bc706147386a93d2b6c86138a108042a1ca10aa",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-011"
}
```

## Entry native-012

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_83a11864c376f283107eeca5fe3ffca5",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
      "unitDigest": "e1fbde6f58cfdeb1279b92317107b574bff70a5805f3838dcdc8be070ff0a51d",
      "identityFingerprint": "e1fbde6f58cfdeb1279b92317107b574bff70a5805f3838dcdc8be070ff0a51d",
      "claimId": "claim_83a11864c376f283107eeca5fe3ffca5",
      "sourceAnchor": "unheaded-block-2",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-345f15d95663260976200be66d1b9a6c648bcd6d"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
      "unitDigest": "e1fbde6f58cfdeb1279b92317107b574bff70a5805f3838dcdc8be070ff0a51d",
      "identityFingerprint": "e1fbde6f58cfdeb1279b92317107b574bff70a5805f3838dcdc8be070ff0a51d",
      "claimId": "claim_83a11864c376f283107eeca5fe3ffca5",
      "sourceAnchor": "unheaded-block-2",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "c354e3357585a5cc6bce8dd57d833b0e85d3f19e58ba6e81e9d6f562aca53edc",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-012"
}
```

## Entry native-013

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_f15e4328e1e5df90c51f535e75da554b",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
      "unitDigest": "0f35e2a68dba79e8691a1dbeabc4aae960abfa8664239abf2054bf09473fa0ba",
      "identityFingerprint": "0f35e2a68dba79e8691a1dbeabc4aae960abfa8664239abf2054bf09473fa0ba",
      "claimId": "claim_f15e4328e1e5df90c51f535e75da554b",
      "sourceAnchor": "unheaded-block-44",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "9643a6fe01ce142637dcea09eb07b8690322ab13683212165934615d5aba3ae5",
      "claimKind": "procedure",
      "status": "future"
    }
  },
  "after": {
    "collection": "identityGaps",
    "row": {
      "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md",
      "unitDigest": "0f35e2a68dba79e8691a1dbeabc4aae960abfa8664239abf2054bf09473fa0ba",
      "identityFingerprint": "0f35e2a68dba79e8691a1dbeabc4aae960abfa8664239abf2054bf09473fa0ba",
      "claimId": "claim_f15e4328e1e5df90c51f535e75da554b",
      "sourceAnchor": "unheaded-block-44",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "9643a6fe01ce142637dcea09eb07b8690322ab13683212165934615d5aba3ae5",
      "claimKind": "procedure",
      "status": "future",
      "identityStatus": "identity-gap",
      "gapReason": "edited unit whose anchor unheaded-block-44 is not a stable heading anchor"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-013"
}
```

## Entry native-014

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16",
  "claimId": "claim_9e9d711e331efe5a12c8b8bf50371dc6",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
      "unitDigest": "b475398ae494b6c3ef3859fa0d80aa989e3b3ed01789cea21ff41f4ae8e2cec5",
      "identityFingerprint": "b475398ae494b6c3ef3859fa0d80aa989e3b3ed01789cea21ff41f4ae8e2cec5",
      "claimId": "claim_9e9d711e331efe5a12c8b8bf50371dc6",
      "sourceAnchor": "unheaded-block-117",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "087d5cdd477bde5b2bf98882290f0d23d3e44a06f0c6f93b7f15e6bcfa391c63",
      "claimKind": "procedure",
      "status": "future"
    }
  },
  "after": {
    "collection": "identityGaps",
    "row": {
      "sourcePath": "docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md",
      "unitDigest": "b475398ae494b6c3ef3859fa0d80aa989e3b3ed01789cea21ff41f4ae8e2cec5",
      "identityFingerprint": "b475398ae494b6c3ef3859fa0d80aa989e3b3ed01789cea21ff41f4ae8e2cec5",
      "claimId": "claim_9e9d711e331efe5a12c8b8bf50371dc6",
      "sourceAnchor": "unheaded-block-117",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "087d5cdd477bde5b2bf98882290f0d23d3e44a06f0c6f93b7f15e6bcfa391c63",
      "claimKind": "procedure",
      "status": "future",
      "identityStatus": "identity-gap",
      "gapReason": "edited unit whose anchor unheaded-block-117 is not a stable heading anchor"
    }
  },
  "contentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-014"
}
```

