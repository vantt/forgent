# Bounded re-review: native 1

Author session: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Packaged by: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Content commit: `287a22d33a0eaf2d9e47549a1142daf62361bb8c` (author changes at `0d8c602e2`)
Comparison base: `5035fed52e60254ecbe034cc987553feb24616f4`
Entries: **30**; each request at most60 entries and400000 bytes.

[Single request index](review-request-step10-index-287a22d33.md). Before values are historical; currentDecision and after for content rows come from `git show <content commit>:<shard>` through unchanged `reviewEntryFromCommittedRow`. New package-native predecessor rows are explicitly labelled overlay and require the runner package commit. No seed, sample IDs or verdict chosen by producer.

Reproduce all-shard consistency and every714 generated rationale (unchanged checker, no --apply):

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work python3 plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-reproduce.py consistency
```

Reproduce tests yourself (473 expected):

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-*.test.mjs test/scripts/check-doc-*.test.mjs test/scripts/generate-doc-inventory.test.mjs test/scripts/list-doc-anchors.test.mjs test/scripts/verify-phase-02.test.mjs test/scripts/next-doc-id.test.mjs
```

Run at the runner package checkout from repository root. The consistency reproduction materializes scratch only under `/tmp/fgos-work/`, checks all90 pinned shards with the original checker, verifies their current-row equality, then audits all4 package-native rows with unchanged `checkLegacyRationale`:12893 rows/91 nonempty shards in total. The original checker directly on the new shard errors because its historical oldRow lookup assumes every shard existed at5035fed52; that observed limitation is preserved in `step10-sync287-rationale-consistency.log`. No checker code was altered or bypassed for a pass.

Review every submitted current claim with an ordinary verdict and full digest/anchor/shard equality. Rationales are grouped for mechanical regeneration plus an independent seeded deep sample of at least108/714. A36 additionally requires reviewer-seeded at least162/1079 conservative Weak-exact/Judgment population, every unequal source/target digest and partial/historical row deep. One independently selected draw may satisfy both populations if both coverage thresholds are met; otherwise add draws. All exact doc corrections, tool changes and marked native predecessor transitions are deep. >3% deep rework escalates to the entire pack. Report seed/sample IDs and each claim's deep/mechanical note. Independent checkpoint/truth/red-team obligations remain. Confirmations retain existing committed approvals; metadata/evidence/native entries do not approve claims.

## Entry native-001

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_910f8ff1442f06922461e0765e24d8c5",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
      "unitDigest": "d6e0814643a7749dac8a94faed30749cf0ad6aa519a4a42a9727dbc3af8a2666",
      "identityFingerprint": "7cf7499dc9bcbd5657d93a4b9f9c75f88ec63130f268d19fda173f8796aa065c",
      "claimId": "claim_910f8ff1442f06922461e0765e24d8c5",
      "sourceAnchor": "5-related-files",
      "unitKind": "heading",
      "sourceUnitDigest": "c2e541d44a9583fb580dc9c4c632511633e3a56b41e0bd2924acce8bc1a106c9",
      "claimKind": "contract",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "19ca8de23908e161c34c91626e41041b7813167c",
        "fromUnitDigest": "34794a284c7b2be85cca1cc78f079c36052b47458c8686804964119556fbae18",
        "toUnitDigest": "d6e0814643a7749dac8a94faed30749cf0ad6aa519a4a42a9727dbc3af8a2666",
        "fromSourceUnitDigest": "3ee564943d5243ec4e6add8da46e566bd6b223a45bee510de2eb915a873de7e6",
        "toSourceUnitDigest": "c2e541d44a9583fb580dc9c4c632511633e3a56b41e0bd2924acce8bc1a106c9"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
      "unitDigest": "d6e0814643a7749dac8a94faed30749cf0ad6aa519a4a42a9727dbc3af8a2666",
      "identityFingerprint": "7cf7499dc9bcbd5657d93a4b9f9c75f88ec63130f268d19fda173f8796aa065c",
      "claimId": "claim_910f8ff1442f06922461e0765e24d8c5",
      "sourceAnchor": "5-related-files",
      "unitKind": "heading",
      "sourceUnitDigest": "c2e541d44a9583fb580dc9c4c632511633e3a56b41e0bd2924acce8bc1a106c9",
      "claimKind": "contract",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-001"
}
```

## Entry native-002

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_2f303a0b0819ff9e6ce8f300d784b242",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
      "unitDigest": "913edc9e80d1c3a497adfc15d20f1635227059ed6a0ec1bd750488315ec1d578",
      "identityFingerprint": "913edc9e80d1c3a497adfc15d20f1635227059ed6a0ec1bd750488315ec1d578",
      "claimId": "claim_2f303a0b0819ff9e6ce8f300d784b242",
      "sourceAnchor": "unheaded-block-9",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "14c1c0ac5e7be57002c04a3c0beed23bc3afcb963eb9f6ece2afe2dbcb29e015",
      "claimKind": "contract",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
      "unitDigest": "913edc9e80d1c3a497adfc15d20f1635227059ed6a0ec1bd750488315ec1d578",
      "identityFingerprint": "913edc9e80d1c3a497adfc15d20f1635227059ed6a0ec1bd750488315ec1d578",
      "claimId": "claim_2f303a0b0819ff9e6ce8f300d784b242",
      "sourceAnchor": "unheaded-block-9",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "14c1c0ac5e7be57002c04a3c0beed23bc3afcb963eb9f6ece2afe2dbcb29e015",
      "claimKind": "contract",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-002"
}
```

## Entry native-003

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_ebf51e1e74a6ffbea8db36e4d58729b8",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
      "unitDigest": "2e83273dc59c1d786639f5a2fc8ffff5f23ab85ab6de053c812c3f7de996cfa9",
      "identityFingerprint": "996a15d063a547d23b7545c42145f37412ac7c43892646d4b07157aff2f885df",
      "claimId": "claim_ebf51e1e74a6ffbea8db36e4d58729b8",
      "sourceAnchor": "2-source-coverage-matrix",
      "unitKind": "heading",
      "sourceUnitDigest": "b1dcac3905a41dfa64bbc892b4d7d37e92a9778b3c2b13c835c4edba32ae267e",
      "claimKind": "verification",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "19ca8de23908e161c34c91626e41041b7813167c",
        "fromUnitDigest": "370ae04dcd3a07690b546835d1614e532a43c6899ec0578cf0aa9a1af5927a3c",
        "toUnitDigest": "2e83273dc59c1d786639f5a2fc8ffff5f23ab85ab6de053c812c3f7de996cfa9",
        "fromSourceUnitDigest": "fad7bc6f4891d141778cb35b0b48fbfd2ff3aace948ff6e1194843b08d5233a9",
        "toSourceUnitDigest": "b1dcac3905a41dfa64bbc892b4d7d37e92a9778b3c2b13c835c4edba32ae267e"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
      "unitDigest": "2e83273dc59c1d786639f5a2fc8ffff5f23ab85ab6de053c812c3f7de996cfa9",
      "identityFingerprint": "996a15d063a547d23b7545c42145f37412ac7c43892646d4b07157aff2f885df",
      "claimId": "claim_ebf51e1e74a6ffbea8db36e4d58729b8",
      "sourceAnchor": "2-source-coverage-matrix",
      "unitKind": "heading",
      "sourceUnitDigest": "b1dcac3905a41dfa64bbc892b4d7d37e92a9778b3c2b13c835c4edba32ae267e",
      "claimKind": "verification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-003"
}
```

## Entry native-004

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_989a974d1fa3f43ba46ce69bf5708d5d",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
      "unitDigest": "19a8d964cf47ded25d697628a3e12b970092bb6a235e5d3249effa3bdf3e51de",
      "identityFingerprint": "19a8d964cf47ded25d697628a3e12b970092bb6a235e5d3249effa3bdf3e51de",
      "claimId": "claim_989a974d1fa3f43ba46ce69bf5708d5d",
      "sourceAnchor": "unheaded-block-6",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "bde5207b515b4be800ca245741a3c524e97067e3c96e39853879a1995d7c2ed0",
      "claimKind": "verification",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
      "unitDigest": "19a8d964cf47ded25d697628a3e12b970092bb6a235e5d3249effa3bdf3e51de",
      "identityFingerprint": "19a8d964cf47ded25d697628a3e12b970092bb6a235e5d3249effa3bdf3e51de",
      "claimId": "claim_989a974d1fa3f43ba46ce69bf5708d5d",
      "sourceAnchor": "unheaded-block-6",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "bde5207b515b4be800ca245741a3c524e97067e3c96e39853879a1995d7c2ed0",
      "claimKind": "verification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-004"
}
```

## Entry native-005

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_0f8c6c5f2ef2d199ee6b6dadfc6d8c22",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/vision.md",
      "unitDigest": "2c662781f55ef01162de9ccb39f88c47db4514f13f92762943da34515e8584cd",
      "identityFingerprint": "f4d851aee4e975aaaa1a94ab81a57d73c49ea1c240392ae0d341056c6d9c624c",
      "claimId": "claim_0f8c6c5f2ef2d199ee6b6dadfc6d8c22",
      "sourceAnchor": "5-design-direction",
      "unitKind": "heading",
      "sourceUnitDigest": "08b323bdd29556cad36cdfae8c068fa705025d8ccf394e1231c6ff595615bddc",
      "claimKind": "vision",
      "status": "future"
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
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-005"
}
```

## Entry native-006

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_dba2f79b14e40be4baf226be555c8a5f",
  "before": null,
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
      "status": "future",
      "origin": "added-since-345f15d95663260976200be66d1b9a6c648bcd6d"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-006"
}
```

## Entry native-007

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_c8e76232f9d36feab9a2f8f4594ce132",
  "before": null,
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
      "status": "future",
      "origin": "added-since-345f15d95663260976200be66d1b9a6c648bcd6d"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-007"
}
```

## Entry native-008

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_e1b66c812bf83f5716280dcb8540aa15",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/packaging-distribution/spec.md",
      "unitDigest": "f352df7012b9650ee7d863358bc8aa0fb2fc0cfdb0bba10327de620c2518f9b6",
      "identityFingerprint": "fc9228150d49b6b8952b683c5d4e2a4caed60c56e960ec9fe8239640f190e1c4",
      "claimId": "claim_e1b66c812bf83f5716280dcb8540aa15",
      "sourceAnchor": "workspace-runtime-model",
      "unitKind": "heading",
      "sourceUnitDigest": "b17cd70e3bb848b985deb966b7c9ffc192142e8f887bfb49d3bf4d76c70efa15",
      "claimKind": "specification",
      "status": "future"
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
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-008"
}
```

## Entry native-009

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_068de0851cd81c1c38d509d107fd11a3",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
      "unitDigest": "e5f9a26216fa71f8ce722ae8d519b28078bc67f06bee4c3cdfe8008595cc6ecd",
      "identityFingerprint": "d3fa1e5cc1fd4ce02a3a25a535a2b50e4ceeca71011e378fd7f31a747b676495",
      "claimId": "claim_068de0851cd81c1c38d509d107fd11a3",
      "sourceAnchor": "added-in-candidate-runner-behaviors-operations",
      "unitKind": "heading",
      "sourceUnitDigest": "b25679f99cf830e4a7b2ea4278537d055b0e9114366f9e2101da66404a910b34",
      "claimKind": "procedure",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "19ca8de23908e161c34c91626e41041b7813167c",
        "fromUnitDigest": "d4aa1e0b0cf2f96e6fe0fe9d6241e2974ede7777386aca4673c57c09fe6ee18e",
        "toUnitDigest": "e5f9a26216fa71f8ce722ae8d519b28078bc67f06bee4c3cdfe8008595cc6ecd",
        "fromSourceUnitDigest": "b48b04eee38eecc530ff296d1b616f123b28db9a8e5b0bb83f0b8383dbc71c3d",
        "toSourceUnitDigest": "b25679f99cf830e4a7b2ea4278537d055b0e9114366f9e2101da66404a910b34"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
      "unitDigest": "e5f9a26216fa71f8ce722ae8d519b28078bc67f06bee4c3cdfe8008595cc6ecd",
      "identityFingerprint": "d3fa1e5cc1fd4ce02a3a25a535a2b50e4ceeca71011e378fd7f31a747b676495",
      "claimId": "claim_068de0851cd81c1c38d509d107fd11a3",
      "sourceAnchor": "added-in-candidate-runner-behaviors-operations",
      "unitKind": "heading",
      "sourceUnitDigest": "b25679f99cf830e4a7b2ea4278537d055b0e9114366f9e2101da66404a910b34",
      "claimKind": "procedure",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-009"
}
```

## Entry native-010

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_ab5670284703559f1eb46b866fb6354e",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
      "unitDigest": "2c123a160df2fc26fceb5b77bc31ebc91c2665654cb67ff8cdba6d29c6d4afb4",
      "identityFingerprint": "250a85e8138c559b444974f22c490e04cff09d92e18de7a1479306934675a345",
      "claimId": "claim_ab5670284703559f1eb46b866fb6354e",
      "sourceAnchor": "gate-a-xếp-hạng-candidate-bắc-cầu-sang-việc-thật-evolve",
      "unitKind": "heading",
      "sourceUnitDigest": "48228ecbc2881bfaccdcf13a294876cf74c3afe8670c137132403a9a037999b2",
      "claimKind": "procedure",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "19ca8de23908e161c34c91626e41041b7813167c",
        "fromUnitDigest": "8ae0d47c50e57a312ef066f695b4c950e7379f45304b64375fc908d13bcf484a",
        "toUnitDigest": "2c123a160df2fc26fceb5b77bc31ebc91c2665654cb67ff8cdba6d29c6d4afb4",
        "fromSourceUnitDigest": "63cc24d991ad0f3cf493ab1b3e3ca046ea24aa1944a4c85411abef6612626aea",
        "toSourceUnitDigest": "48228ecbc2881bfaccdcf13a294876cf74c3afe8670c137132403a9a037999b2"
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
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-010"
}
```

## Entry native-011

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_1238f27d06dc31148ae1d649cf910018",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
      "unitDigest": "473a742d0cac3cdb2fb913303cbf13ab6fe2a0f8fcc70cb2ce8edbb13299f507",
      "identityFingerprint": "473a742d0cac3cdb2fb913303cbf13ab6fe2a0f8fcc70cb2ce8edbb13299f507",
      "claimId": "claim_1238f27d06dc31148ae1d649cf910018",
      "sourceAnchor": "unheaded-block-2",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "3fab723eb054be1c1007c12f347887b98f4d864a5ae24d84527fa3eca45e3446",
      "claimKind": "procedure",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
      "unitDigest": "473a742d0cac3cdb2fb913303cbf13ab6fe2a0f8fcc70cb2ce8edbb13299f507",
      "identityFingerprint": "473a742d0cac3cdb2fb913303cbf13ab6fe2a0f8fcc70cb2ce8edbb13299f507",
      "claimId": "claim_1238f27d06dc31148ae1d649cf910018",
      "sourceAnchor": "unheaded-block-2",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "3fab723eb054be1c1007c12f347887b98f4d864a5ae24d84527fa3eca45e3446",
      "claimKind": "procedure",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-011"
}
```

## Entry native-012

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_4e0d8183c900cb2ab3954533b1b13592",
  "before": null,
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
      "status": "future",
      "origin": "added-since-345f15d95663260976200be66d1b9a6c648bcd6d"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-012"
}
```

## Entry native-013

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_5d18d39505152ccae6e2f5e8667400a7",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
      "unitDigest": "73b5a84b71aac8a93a3eee89392285b79f32991f10ed4a3f01a517b18e4886e4",
      "identityFingerprint": "5172aa2c2f0b68441a5fd639d95a46898c2a424379a0ab8a58f24e2ba08c2985",
      "claimId": "claim_5d18d39505152ccae6e2f5e8667400a7",
      "sourceAnchor": "data-dictionary",
      "unitKind": "heading",
      "sourceUnitDigest": "3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41",
      "claimKind": "specification",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "19ca8de23908e161c34c91626e41041b7813167c",
        "fromUnitDigest": "773901d283515aeeb1e8cce24fe4a4cb27270e07626f8b113bb80e5352825780",
        "toUnitDigest": "73b5a84b71aac8a93a3eee89392285b79f32991f10ed4a3f01a517b18e4886e4",
        "fromSourceUnitDigest": "7e314f375af7ee7c1dca812544d9968b65e002c91f205f58d104b9057b22e2a8",
        "toSourceUnitDigest": "3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
      "unitDigest": "73b5a84b71aac8a93a3eee89392285b79f32991f10ed4a3f01a517b18e4886e4",
      "identityFingerprint": "5172aa2c2f0b68441a5fd639d95a46898c2a424379a0ab8a58f24e2ba08c2985",
      "claimId": "claim_5d18d39505152ccae6e2f5e8667400a7",
      "sourceAnchor": "data-dictionary",
      "unitKind": "heading",
      "sourceUnitDigest": "3ffc347bf68707fd1a1b4d6d8673db7d38467fae324107ddf64e6151d03a3c41",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-013"
}
```

## Entry native-014

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_06cc8ae6c1978bb7877c12969fee2c3c",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
      "unitDigest": "0914c63c64d8dc0b88c6efe72bb3ea06d590244d92fcdf2b30b79a6948b7177f",
      "identityFingerprint": "0914c63c64d8dc0b88c6efe72bb3ea06d590244d92fcdf2b30b79a6948b7177f",
      "claimId": "claim_06cc8ae6c1978bb7877c12969fee2c3c",
      "sourceAnchor": "unheaded-block-3",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "417a56fd2a82950722e3a35187fe79050d444a85b8b55a4106d3e45059fa1b39",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
      "unitDigest": "0914c63c64d8dc0b88c6efe72bb3ea06d590244d92fcdf2b30b79a6948b7177f",
      "identityFingerprint": "0914c63c64d8dc0b88c6efe72bb3ea06d590244d92fcdf2b30b79a6948b7177f",
      "claimId": "claim_06cc8ae6c1978bb7877c12969fee2c3c",
      "sourceAnchor": "unheaded-block-3",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "417a56fd2a82950722e3a35187fe79050d444a85b8b55a4106d3e45059fa1b39",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-014"
}
```

## Entry native-015

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_61a63c4d8f9e49a059f603260d9e51fd",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
      "unitDigest": "5094140825ee14ba288b9b9d8163789979c03c45fd49d6db4a10f1f833d2a9e2",
      "identityFingerprint": "c524c7dbb7b21ec2d3b22ccfbf2130d4905275992c8aaf952e9f9992b607dc30",
      "claimId": "claim_61a63c4d8f9e49a059f603260d9e51fd",
      "sourceAnchor": "edge-cases-settled",
      "unitKind": "heading",
      "sourceUnitDigest": "8fbc6ed74d8d0c274acc53ef231e5bdb2172c02bd6c16f6aadf861a096623f9e",
      "claimKind": "specification",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "19ca8de23908e161c34c91626e41041b7813167c",
        "fromUnitDigest": "43bc240a2b77c431fafaa73b54ec1458dddb6434186dc8e7f38176240c488f83",
        "toUnitDigest": "5094140825ee14ba288b9b9d8163789979c03c45fd49d6db4a10f1f833d2a9e2",
        "fromSourceUnitDigest": "42f7d3b5bc55faa2dccd8f8d20cb008002957c8a31549f3fda4d1568c161b894",
        "toSourceUnitDigest": "8fbc6ed74d8d0c274acc53ef231e5bdb2172c02bd6c16f6aadf861a096623f9e"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
      "unitDigest": "5094140825ee14ba288b9b9d8163789979c03c45fd49d6db4a10f1f833d2a9e2",
      "identityFingerprint": "c524c7dbb7b21ec2d3b22ccfbf2130d4905275992c8aaf952e9f9992b607dc30",
      "claimId": "claim_61a63c4d8f9e49a059f603260d9e51fd",
      "sourceAnchor": "edge-cases-settled",
      "unitKind": "heading",
      "sourceUnitDigest": "8fbc6ed74d8d0c274acc53ef231e5bdb2172c02bd6c16f6aadf861a096623f9e",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-015"
}
```

## Entry native-016

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_3adbed37d774c1b9e49ddc7c91c7e570",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
      "unitDigest": "3b279daae8ac3113507608082fe12924d67854ff32a17c789a7514a915c808d9",
      "identityFingerprint": "3b279daae8ac3113507608082fe12924d67854ff32a17c789a7514a915c808d9",
      "claimId": "claim_3adbed37d774c1b9e49ddc7c91c7e570",
      "sourceAnchor": "unheaded-block-5",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "b4abd2b685fe57f6a2616db1b22d4ddc28196279ade0c0307087370b59671964",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-37aced3896a8/spec.md",
      "unitDigest": "3b279daae8ac3113507608082fe12924d67854ff32a17c789a7514a915c808d9",
      "identityFingerprint": "3b279daae8ac3113507608082fe12924d67854ff32a17c789a7514a915c808d9",
      "claimId": "claim_3adbed37d774c1b9e49ddc7c91c7e570",
      "sourceAnchor": "unheaded-block-5",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "b4abd2b685fe57f6a2616db1b22d4ddc28196279ade0c0307087370b59671964",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-016"
}
```

## Entry native-017

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_e0860568f118f2e80e6cd1bff6b0a62f",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md",
      "unitDigest": "d6e939713939a0067ddf5f80a145102cddf9d66f0b857899663a7ac83ec25e2c",
      "identityFingerprint": "b9f06d6f1520ef1e792da40aa3ca96e0c47cc20bd80228d29ed7e64375c1fc5f",
      "claimId": "claim_e0860568f118f2e80e6cd1bff6b0a62f",
      "sourceAnchor": "actors-access",
      "unitKind": "heading",
      "sourceUnitDigest": "704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42",
      "claimKind": "specification",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "19ca8de23908e161c34c91626e41041b7813167c",
        "fromUnitDigest": "0bbbfdc331d4ce61e415aecc887691423d1be529dd5505a608f9f77bcb741bf2",
        "toUnitDigest": "d6e939713939a0067ddf5f80a145102cddf9d66f0b857899663a7ac83ec25e2c",
        "fromSourceUnitDigest": "b860dec045aac1ef7bd041e99451ae747df3b3bdcedee268b427ec9eda3ee667",
        "toSourceUnitDigest": "704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md",
      "unitDigest": "d6e939713939a0067ddf5f80a145102cddf9d66f0b857899663a7ac83ec25e2c",
      "identityFingerprint": "b9f06d6f1520ef1e792da40aa3ca96e0c47cc20bd80228d29ed7e64375c1fc5f",
      "claimId": "claim_e0860568f118f2e80e6cd1bff6b0a62f",
      "sourceAnchor": "actors-access",
      "unitKind": "heading",
      "sourceUnitDigest": "704500af02588d8c934f08e738fc13445896cc4feba37d83c162b866d7d59e42",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-017"
}
```

## Entry native-018

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_ba4cedd158e4d1ea0d5c413084ed14b4",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md",
      "unitDigest": "65e9d12b794043970ea57fb1eada15ebc11a3b012cc477e0d72235cf63224a47",
      "identityFingerprint": "65e9d12b794043970ea57fb1eada15ebc11a3b012cc477e0d72235cf63224a47",
      "claimId": "claim_ba4cedd158e4d1ea0d5c413084ed14b4",
      "sourceAnchor": "unheaded-block-3",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "6ee82017c754d1ebcfed7fcd146851cdd954235737f350c0dbd70a9629516110",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md",
      "unitDigest": "65e9d12b794043970ea57fb1eada15ebc11a3b012cc477e0d72235cf63224a47",
      "identityFingerprint": "65e9d12b794043970ea57fb1eada15ebc11a3b012cc477e0d72235cf63224a47",
      "claimId": "claim_ba4cedd158e4d1ea0d5c413084ed14b4",
      "sourceAnchor": "unheaded-block-3",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "6ee82017c754d1ebcfed7fcd146851cdd954235737f350c0dbd70a9629516110",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-018"
}
```

## Entry native-019

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_54603609b547a6f66e5bac303a3557be",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md",
      "unitDigest": "8a423d55205db89e6ceec812e72173be833e2b2d53a27a72497755a3aed4dd49",
      "identityFingerprint": "ac9f195956181cbdb348b7a47ff89128b1e101b2affa23eceb6698ed603e5cb8",
      "claimId": "claim_54603609b547a6f66e5bac303a3557be",
      "sourceAnchor": "added-in-candidate-runner-entry-points-triggers",
      "unitKind": "heading",
      "sourceUnitDigest": "e7dbacb4c73a3907eef90472f3f447973273eb0995f984016685277d79dae1f4",
      "claimKind": "specification",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "19ca8de23908e161c34c91626e41041b7813167c",
        "fromUnitDigest": "09b2457ff6eeda9f810cb70acc013218e79ae8b3b85135d24de89ac974322a65",
        "toUnitDigest": "8a423d55205db89e6ceec812e72173be833e2b2d53a27a72497755a3aed4dd49",
        "fromSourceUnitDigest": "f2da04a8f6d26763b2e6fd21d0ac10cef8a7d85a453cff7638b7c58d57ca7cd6",
        "toSourceUnitDigest": "e7dbacb4c73a3907eef90472f3f447973273eb0995f984016685277d79dae1f4"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md",
      "unitDigest": "8a423d55205db89e6ceec812e72173be833e2b2d53a27a72497755a3aed4dd49",
      "identityFingerprint": "ac9f195956181cbdb348b7a47ff89128b1e101b2affa23eceb6698ed603e5cb8",
      "claimId": "claim_54603609b547a6f66e5bac303a3557be",
      "sourceAnchor": "added-in-candidate-runner-entry-points-triggers",
      "unitKind": "heading",
      "sourceUnitDigest": "e7dbacb4c73a3907eef90472f3f447973273eb0995f984016685277d79dae1f4",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-019"
}
```

## Entry native-020

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_73a0a1df74653030d37e108cfd37218d",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md",
      "unitDigest": "331f8dde9ba29f91749828284b1560f567dcbed4f9fe3a1562c5224db7a65c92",
      "identityFingerprint": "331f8dde9ba29f91749828284b1560f567dcbed4f9fe3a1562c5224db7a65c92",
      "claimId": "claim_73a0a1df74653030d37e108cfd37218d",
      "sourceAnchor": "unheaded-block-2",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "3405ed4f32704ce2e17c155d22d3366a75bdf88bc026b500d66ed59f11314445",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md",
      "unitDigest": "331f8dde9ba29f91749828284b1560f567dcbed4f9fe3a1562c5224db7a65c92",
      "identityFingerprint": "331f8dde9ba29f91749828284b1560f567dcbed4f9fe3a1562c5224db7a65c92",
      "claimId": "claim_73a0a1df74653030d37e108cfd37218d",
      "sourceAnchor": "unheaded-block-2",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "3405ed4f32704ce2e17c155d22d3366a75bdf88bc026b500d66ed59f11314445",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-020"
}
```

## Entry native-021

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_589f838032f1c0475587257a362d4cc0",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
      "unitDigest": "ff530d0aab4403cbc1b5c6907f15adcc433ac80580700aacddbd73b4157b0955",
      "identityFingerprint": "c15de7236a29408bc562c953b38e0080f2d4715d4cb08916edd7863e13b7a836",
      "claimId": "claim_589f838032f1c0475587257a362d4cc0",
      "sourceAnchor": "added-in-candidate-runner-pointers-implementation",
      "unitKind": "heading",
      "sourceUnitDigest": "0fb71e0ecd07635335f72b12c7509c597bad63c51e4f4aeaef5e83992ca8a53d",
      "claimKind": "specification",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "19ca8de23908e161c34c91626e41041b7813167c",
        "fromUnitDigest": "4fc46da5c5511be58a17f5666f2f1c67832f49ca96d37872acd9767178b45887",
        "toUnitDigest": "ff530d0aab4403cbc1b5c6907f15adcc433ac80580700aacddbd73b4157b0955",
        "fromSourceUnitDigest": "43760affd7e65f8e020a774625818c670b4fec3f64f50a759d66860ad166bcb6",
        "toSourceUnitDigest": "0fb71e0ecd07635335f72b12c7509c597bad63c51e4f4aeaef5e83992ca8a53d"
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
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-021"
}
```

## Entry native-022

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_493485517679036e141cf5b9fb645e0b",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
      "unitDigest": "8558fe743abeec6ed23eeb8fbbf98a73323842471f075a4cddb43dd9943b3fd8",
      "identityFingerprint": "3754324fd3a725b5d2ae2543b42abaa9cbc215e015cead5b1b66473a4f544840",
      "claimId": "claim_493485517679036e141cf5b9fb645e0b",
      "sourceAnchor": "pointers-implementation",
      "unitKind": "heading",
      "sourceUnitDigest": "850878a688f3b9c613114ddcb166a7fd1038b2865e113b41b99251817f40721e",
      "claimKind": "specification",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "19ca8de23908e161c34c91626e41041b7813167c",
        "fromUnitDigest": "5fa47ebbd4fdcfa859e79f181207370360a5b17ac838bc0f475ee0d98fd8b593",
        "toUnitDigest": "8558fe743abeec6ed23eeb8fbbf98a73323842471f075a4cddb43dd9943b3fd8",
        "fromSourceUnitDigest": "077e4456152fabdeec033b95bef9434aacc5236a1b550dd1e752bd1b36f876a9",
        "toSourceUnitDigest": "850878a688f3b9c613114ddcb166a7fd1038b2865e113b41b99251817f40721e"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
      "unitDigest": "8558fe743abeec6ed23eeb8fbbf98a73323842471f075a4cddb43dd9943b3fd8",
      "identityFingerprint": "3754324fd3a725b5d2ae2543b42abaa9cbc215e015cead5b1b66473a4f544840",
      "claimId": "claim_493485517679036e141cf5b9fb645e0b",
      "sourceAnchor": "pointers-implementation",
      "unitKind": "heading",
      "sourceUnitDigest": "850878a688f3b9c613114ddcb166a7fd1038b2865e113b41b99251817f40721e",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-022"
}
```

## Entry native-023

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_83a11864c376f283107eeca5fe3ffca5",
  "before": null,
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
      "status": "future",
      "origin": "added-since-345f15d95663260976200be66d1b9a6c648bcd6d"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-023"
}
```

## Entry native-024

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_935f50bdbe56dd09018224ee143bf43d",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
      "unitDigest": "e893d87fa54e4b018e43829b1af2cfd85d40811e6dfad96ed0054babeac675cf",
      "identityFingerprint": "e893d87fa54e4b018e43829b1af2cfd85d40811e6dfad96ed0054babeac675cf",
      "claimId": "claim_935f50bdbe56dd09018224ee143bf43d",
      "sourceAnchor": "unheaded-block-3",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "853cf58afec64a9d7b507305bfadf959cf0f88ef17e3b90b199a85bf3ed71c43",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
      "unitDigest": "e893d87fa54e4b018e43829b1af2cfd85d40811e6dfad96ed0054babeac675cf",
      "identityFingerprint": "e893d87fa54e4b018e43829b1af2cfd85d40811e6dfad96ed0054babeac675cf",
      "claimId": "claim_935f50bdbe56dd09018224ee143bf43d",
      "sourceAnchor": "unheaded-block-3",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "853cf58afec64a9d7b507305bfadf959cf0f88ef17e3b90b199a85bf3ed71c43",
      "claimKind": "specification",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-024"
}
```

## Entry native-025

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_5dbd7535e303723c8a0150bf8db5e89e",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/work-state/README.md",
      "unitDigest": "2ac4a0c1ca580c34068e608d68071f34b5abee87757b20bd96efd94eb56a2b2f",
      "identityFingerprint": "c357c183dbc24ca5dd18ac4a6dfaa4fc097774cbcf7c227418289a9c69ebf9f4",
      "claimId": "claim_5dbd7535e303723c8a0150bf8db5e89e",
      "sourceAnchor": "4-legacy-source-pointers",
      "unitKind": "heading",
      "sourceUnitDigest": "4dedd0722088de326bb89be824a5f78fde42fc5a1ec1f8ff50ebabcab5c3464c",
      "claimKind": "navigation",
      "status": "future",
      "reviewStatus": "needs-review",
      "lineage": {
        "fromCommit": "19ca8de23908e161c34c91626e41041b7813167c",
        "fromUnitDigest": "5e31e0767a66e4fad77e91b7c88c6fd7b99391d184759688718a7ad6ee8b3546",
        "toUnitDigest": "2ac4a0c1ca580c34068e608d68071f34b5abee87757b20bd96efd94eb56a2b2f",
        "fromSourceUnitDigest": "139e0d23eb74704984506b917d690284b79f2cb60227806ca7f7e2e7278a4486",
        "toSourceUnitDigest": "4dedd0722088de326bb89be824a5f78fde42fc5a1ec1f8ff50ebabcab5c3464c"
      }
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/work-state/README.md",
      "unitDigest": "2ac4a0c1ca580c34068e608d68071f34b5abee87757b20bd96efd94eb56a2b2f",
      "identityFingerprint": "c357c183dbc24ca5dd18ac4a6dfaa4fc097774cbcf7c227418289a9c69ebf9f4",
      "claimId": "claim_5dbd7535e303723c8a0150bf8db5e89e",
      "sourceAnchor": "4-legacy-source-pointers",
      "unitKind": "heading",
      "sourceUnitDigest": "4dedd0722088de326bb89be824a5f78fde42fc5a1ec1f8ff50ebabcab5c3464c",
      "claimKind": "navigation",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-025"
}
```

## Entry native-026

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_7a9fd52a2548b330af8f7f2c296a97dd",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/work-state/README.md",
      "unitDigest": "1afd98da3c2363e451b0b07fdcfa2293b3ce4491facfd9b03e16530230474b37",
      "identityFingerprint": "1afd98da3c2363e451b0b07fdcfa2293b3ce4491facfd9b03e16530230474b37",
      "claimId": "claim_7a9fd52a2548b330af8f7f2c296a97dd",
      "sourceAnchor": "unheaded-block-7",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "4ec367b6fb47b2dc7705caa2b3ae458f74136f697291ee505a2e884233efd793",
      "claimKind": "navigation",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c"
    }
  },
  "after": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/work-state/README.md",
      "unitDigest": "1afd98da3c2363e451b0b07fdcfa2293b3ce4491facfd9b03e16530230474b37",
      "identityFingerprint": "1afd98da3c2363e451b0b07fdcfa2293b3ce4491facfd9b03e16530230474b37",
      "claimId": "claim_7a9fd52a2548b330af8f7f2c296a97dd",
      "sourceAnchor": "unheaded-block-7",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "4ec367b6fb47b2dc7705caa2b3ae458f74136f697291ee505a2e884233efd793",
      "claimKind": "navigation",
      "status": "future"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": false,
  "entryId": "native-026"
}
```

## Entry native-027

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_d342cec565707124f0b4e7860db2193c",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/vision.md",
      "unitDigest": "feba2a8555eee26e9c64300bc888119427f19d79e7115773bd474f4775d22519",
      "identityFingerprint": "feba2a8555eee26e9c64300bc888119427f19d79e7115773bd474f4775d22519",
      "claimId": "claim_d342cec565707124f0b4e7860db2193c",
      "sourceAnchor": "unheaded-block-11",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "d02d7891949ca1a0284d509b5c8828e1631138f4d32c20830d5491efb75836c8",
      "claimKind": "vision",
      "status": "future"
    }
  },
  "after": {
    "collection": "identityGaps",
    "row": {
      "sourcePath": "docs/platform/host-invocation-routing/vision.md",
      "unitDigest": "feba2a8555eee26e9c64300bc888119427f19d79e7115773bd474f4775d22519",
      "identityFingerprint": "feba2a8555eee26e9c64300bc888119427f19d79e7115773bd474f4775d22519",
      "claimId": "claim_d342cec565707124f0b4e7860db2193c",
      "sourceAnchor": "unheaded-block-11",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "d02d7891949ca1a0284d509b5c8828e1631138f4d32c20830d5491efb75836c8",
      "claimKind": "vision",
      "status": "future",
      "identityStatus": "identity-gap",
      "gapReason": "edited unit whose anchor unheaded-block-11 is not a stable heading anchor"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-027"
}
```

## Entry native-028

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_a4ed6ca5cfd26790037b35d1c99373b2",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/packaging-distribution/spec.md",
      "unitDigest": "f734105d1f5c0b9ab096c145cce3595411b7d2bb5c628d8e508aa75fb87d1dda",
      "identityFingerprint": "f734105d1f5c0b9ab096c145cce3595411b7d2bb5c628d8e508aa75fb87d1dda",
      "claimId": "claim_a4ed6ca5cfd26790037b35d1c99373b2",
      "sourceAnchor": "unheaded-block-75",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "9aefc76daebb502839626d20f26342d459be16ca0412bed1a7d4d3af5dd4ea9c",
      "claimKind": "architecture",
      "status": "future"
    }
  },
  "after": {
    "collection": "identityGaps",
    "row": {
      "sourcePath": "docs/platform/packaging-distribution/spec.md",
      "unitDigest": "f734105d1f5c0b9ab096c145cce3595411b7d2bb5c628d8e508aa75fb87d1dda",
      "identityFingerprint": "f734105d1f5c0b9ab096c145cce3595411b7d2bb5c628d8e508aa75fb87d1dda",
      "claimId": "claim_a4ed6ca5cfd26790037b35d1c99373b2",
      "sourceAnchor": "unheaded-block-75",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "9aefc76daebb502839626d20f26342d459be16ca0412bed1a7d4d3af5dd4ea9c",
      "claimKind": "architecture",
      "status": "future",
      "identityStatus": "identity-gap",
      "gapReason": "edited unit whose anchor unheaded-block-75 is not a stable heading anchor"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-028"
}
```

## Entry native-029

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_c0f157804addf46fdb20b9c61882794b",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
      "unitDigest": "7048efa94641c54ae38bef92f2da26de9fb17daf145246156e881bad9842679a",
      "identityFingerprint": "7048efa94641c54ae38bef92f2da26de9fb17daf145246156e881bad9842679a",
      "claimId": "claim_c0f157804addf46fdb20b9c61882794b",
      "sourceAnchor": "unheaded-block-26",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2",
      "claimKind": "procedure",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c"
    }
  },
  "after": {
    "collection": "identityGaps",
    "row": {
      "sourcePath": "docs/platform/runner/operations/h-51f5cd7279fd.md",
      "unitDigest": "7048efa94641c54ae38bef92f2da26de9fb17daf145246156e881bad9842679a",
      "identityFingerprint": "7048efa94641c54ae38bef92f2da26de9fb17daf145246156e881bad9842679a",
      "claimId": "claim_c0f157804addf46fdb20b9c61882794b",
      "sourceAnchor": "unheaded-block-26",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "0dce2b78b5d497ab9dbe1b9cc6d0d8a00ad2ff468b97fe5964c8e86464b0a3b2",
      "claimKind": "procedure",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c",
      "identityStatus": "identity-gap",
      "gapReason": "edited unit whose anchor unheaded-block-26 is not a stable heading anchor"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-029"
}
```

## Entry native-030

```json
{
  "kind": "native-identity-transition",
  "authorSession": "codex-session:unit-run-1792116045118-73cfbb42@2026-10-16",
  "claimId": "claim_647a9d5f06216a5e9d6fa267e77cbf03",
  "before": {
    "collection": "units",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
      "unitDigest": "96946de13c0696253ab306030fc9e269d9aa56a4be5371ba9cbd92064a3badc8",
      "identityFingerprint": "96946de13c0696253ab306030fc9e269d9aa56a4be5371ba9cbd92064a3badc8",
      "claimId": "claim_647a9d5f06216a5e9d6fa267e77cbf03",
      "sourceAnchor": "unheaded-block-2",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c"
    }
  },
  "after": {
    "collection": "identityGaps",
    "row": {
      "sourcePath": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
      "unitDigest": "96946de13c0696253ab306030fc9e269d9aa56a4be5371ba9cbd92064a3badc8",
      "identityFingerprint": "96946de13c0696253ab306030fc9e269d9aa56a4be5371ba9cbd92064a3badc8",
      "claimId": "claim_647a9d5f06216a5e9d6fa267e77cbf03",
      "sourceAnchor": "unheaded-block-2",
      "unitKind": "unheaded-block",
      "sourceUnitDigest": "35107e63035cafc34d5698a84f60bb1be49f6700d5e2ad14471d6de41ad86cca",
      "claimKind": "specification",
      "status": "future",
      "origin": "added-since-19ca8de23908e161c34c91626e41041b7813167c",
      "identityStatus": "identity-gap",
      "gapReason": "edited unit whose anchor unheaded-block-2 is not a stable heading anchor"
    }
  },
  "contentCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "mechanicalRequired": true,
  "deepRequired": true,
  "entryId": "native-030"
}
```

