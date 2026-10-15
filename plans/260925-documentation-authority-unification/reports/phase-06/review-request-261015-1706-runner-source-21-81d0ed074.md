# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **70**. Target: `docs/platform/runner/decisions/h-36d872fbb0e5.md`; part 3/5. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `01dc7038ce6682366a31544c858cea45029678ab53f9c644e41f8ed830a85c31`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **11/70** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_6c06438943e64ad92cb4fe0f910c6deb",
      "claim_371dbd6e2f5537ded0fafe4e6956c7c3",
      "claim_6ba08f50d0899a95fc8a30c738430037",
      "claim_55a57bfcf543d71d662fa9c4578853f6",
      "claim_c534a1d34445a9c84f0ac6d415c6ac94",
      "claim_62f02199d351a194094cfb027a5afbf0",
      "claim_a1ca672a9ce5da2f5d1be2f4a304897e",
      "claim_21481f570623626c555abeb66544e32a",
      "claim_38e1fafac6d0ffb1befee68f9667c736",
      "claim_3a292bfca814886da454961d4a2364bf",
      "claim_674406418c8c1d1d8ce33179ccde5884",
      "claim_92527ac22d56830923e42002f45e4503",
      "claim_fb2b0e955d7288b0d36851be1e21cd96",
      "claim_b83711d99137ee1f36d5ab2d7e8111a8",
      "claim_44270f020c1e5f055098dfee0772e6d7",
      "claim_044216d43ee604e2c391f65904d4fc67",
      "claim_bcd43c0eef030ebd45a057f308a14392",
      "claim_73ea5bccb4b67f99853a9aa0c14884fb",
      "claim_02222a3adca323c42d68bfc1e3ef0074",
      "claim_95df09dc4b082eed910954ae3d9f2982",
      "claim_41d42bb1d41f1b439c2ac09d70e441e5",
      "claim_d6ffa6438e88873e2ab109de98c88b8e",
      "claim_90bc8da9f3ac54b28ee99c0571f3d644",
      "claim_1ce072ed299f65792cb14a111469678b",
      "claim_04a03bbcf22da92e35c076a333a441cb",
      "claim_4cf1caaebb2f42d74bcb0fbf1f5ad1fe",
      "claim_073eea178ddb52f6cf281cd4d98dc9b0",
      "claim_ab7ac45bddc789eb97d376bbd3116f67",
      "claim_670f343b35cc44d578eb070e60695f68",
      "claim_c481c65d7e4150af235f82f2f0ce81c8",
      "claim_75c377796c78c0790f896c905ce6eeab",
      "claim_ca231ef093c8bd2a5ac89d1299e01853",
      "claim_f73d4e0517ee0f38c84cd30da94db052",
      "claim_7f67d9c0b123003373f3df421c4140c4",
      "claim_5f006128a4aace4f23ca9e593da3fed3",
      "claim_d85e776b378f3d21aed4edcf1a875b99",
      "claim_e85546ebdc346910e6f0d4d7e87b6f44",
      "claim_4df3e42351bed50bab155db31cac4d69",
      "claim_de9f2115601610beaba1b1172b3d6c34",
      "claim_d037320c97e280df0bf48962fe947937",
      "claim_eee179f30e93a2a9660545defe15d6f6",
      "claim_fd76a88f32041021be905c2f4380324f",
      "claim_fee74f474cff0dbcb09b8ff1a03ca23a",
      "claim_b673bf5f4bf691ef7008e7adbf58b1d1",
      "claim_bd64b6d78d76a976993bbba5f42f1c12",
      "claim_08ee8d10e6e6426a684a03a41da86f1f",
      "claim_d79865d7e7b13902620c8ece3ab816a3",
      "claim_e85cb1459d8e0fc199c75abec6e29f13",
      "claim_05afdb7e532066f2333782f0e57421a8",
      "claim_feb66ccdf7eff1256407a48054055b49",
      "claim_5a80fe891f27a7ab4f94b9fd35ae2018",
      "claim_10b11d3d877c23387208c845acffae69",
      "claim_589f9bb75bee7444773cddcfcf750805",
      "claim_3c6f58eaca41a1cd144aa77ee46bc054",
      "claim_b2c312de4aaa127d564cdfb6bcbee86c",
      "claim_16c0859152da30723055fd61b63e1478",
      "claim_94717cd095680643f25ecb6ab0460b09",
      "claim_bccac29e4e55c7682b4aacfa49c3d959",
      "claim_6ec2943998da202bf962ac4ea68efb14",
      "claim_b5f162038c4694edfd464bed7142a0de",
      "claim_8813e4af883bd066590c26354712c496",
      "claim_e60bba2c4113531e577f25984aa0f740",
      "claim_1504531748cba9ccf7f26bedd67ed19b",
      "claim_27487d122caf8603e008b8e7a31278a5",
      "claim_f667319337b33786d75f81ea07e4e46c",
      "claim_5bdcc916625cf6efb3b0b017be1700fb",
      "claim_97f27b8f14b3521928ef89b19635bb83",
      "claim_825b8970950e755e43c8c1740612eac4",
      "claim_3a9eedae02739e6ffe690d3a2b6c5684",
      "claim_c842b765b0ed205f74e38f577a83a052"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_6c06438943e64ad92cb4fe0f910c6deb

Source digest: 39ae73107c09cc580fc96e697fe28d1f9995430ced506ede8c82324729180de5

Target digest: 39ae73107c09cc580fc96e697fe28d1f9995430ced506ede8c82324729180de5

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "việc-chưa-quyết-để-lại-cho-item-build-lớp-quyết-định-thật-đã-hoàn-tất-qua-dispatchmjs-decide-pha-1-4-pha-5-hoãn",
  "sourceLines": [
    2316,
    2316
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "việc-chưa-quyết-để-lại-cho-item-build-lớp-quyết-định-thật-đã-hoàn-tất-qua-dispatchmjs-decide-pha-1-4-pha-5-hoãn",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "nativeTargetClaimId": "claim_11f3e1edf95e73ba0a52dfa107cde27d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "việc-chưa-quyết-để-lại-cho-item-build-lớp-quyết-định-thật-đã-hoàn-tất-qua-dispatchmjs-decide-pha-1-4-pha-5-hoãn",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6c06438943e64ad92cb4fe0f910c6deb",
    "sourceUnitDigest": "39ae73107c09cc580fc96e697fe28d1f9995430ced506ede8c82324729180de5",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "việc-chưa-quyết-để-lại-cho-item-build-lớp-quyết-định-thật-đã-hoàn-tất-qua-dispatchmjs-decide-pha-1-4-pha-5-hoãn",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#việc-chưa-quyết-để-lại-cho-item-build-lớp-quyết-định-thật-đã-hoàn-tất-qua-dispatchmjs-decide-pha-1-4-pha-5-hoãn (lines 2316–2316) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#việc-chưa-quyết-để-lại-cho-item-build-lớp-quyết-định-thật-đã-hoàn-tất-qua-dispatchmjs-decide-pha-1-4-pha-5-hoãn. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "39ae73107c09cc580fc96e697fe28d1f9995430ced506ede8c82324729180de5",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
    ]
  }
}
```

### Full source unit

```text
#### Việc chưa quyết, để lại cho item build lớp quyết định thật (Đã hoàn tất qua `dispatch.mjs decide` & Pha 1-4; Pha 5 hoãn)

- Tín hiệu phát hiện "launcher hiện tại có phải soul sống cùng provider không": Caller tự khai báo qua cờ `--has-live-task-access` khi gọi `dispatch.mjs decide` (Pha 3/4). Pha 5 mở rộng sang `agy` hoãn lại (YAGNI).
- Cơ chế tường minh áp CÙNG 1 quyết định dispatch cho cả subTask lẫn capacity trong code thật: `dispatch.mjs decide` đã hợp nhất qua 1 entry point duy nhất (Pha 4, `tsk-3ik`).
- Địa điểm đặt lớp quyết định native-vs-cli/spawn: Nằm ở helper `decideDispatchMechanism` / `decideExecutorDispatchMechanism` (`src/runner/dispatch/mechanism.mjs`), được gọi bởi `dispatch.mjs decide`.
```

### Full target unit

```text
#### Việc chưa quyết, để lại cho item build lớp quyết định thật (Đã hoàn tất qua `dispatch.mjs decide` & Pha 1-4; Pha 5 hoãn)

- Tín hiệu phát hiện "launcher hiện tại có phải soul sống cùng provider không": Caller tự khai báo qua cờ `--has-live-task-access` khi gọi `dispatch.mjs decide` (Pha 3/4). Pha 5 mở rộng sang `agy` hoãn lại (YAGNI).
- Cơ chế tường minh áp CÙNG 1 quyết định dispatch cho cả subTask lẫn capacity trong code thật: `dispatch.mjs decide` đã hợp nhất qua 1 entry point duy nhất (Pha 4, `tsk-3ik`).
- Địa điểm đặt lớp quyết định native-vs-cli/spawn: Nằm ở helper `decideDispatchMechanism` / `decideExecutorDispatchMechanism` (`src/runner/dispatch/mechanism.mjs`), được gọi bởi `dispatch.mjs decide`.
```

### Full diff

```diff
No text difference.
```

## claim_371dbd6e2f5537ded0fafe4e6956c7c3

Source digest: 2515ea9bfe27df31965fca859c15076ca4eb59c8549b5ff48bdb718d1f1c15d6

Target digest: 2515ea9bfe27df31965fca859c15076ca4eb59c8549b5ff48bdb718d1f1c15d6

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-231",
  "sourceLines": [
    2318,
    2320
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Việc chưa quyết, để lại cho item build lớp quyết định thật (Đã hoàn tất qua `dispatch.mjs decide` & Pha 1-4; Pha 5 hoãn)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-90",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Việc chưa quyết, để lại cho item build lớp quyết định thật (Đã hoàn tất qua `dispatch.mjs decide` & Pha 1-4; Pha 5 hoãn)"
  ],
  "nativeTargetClaimId": "claim_1f09215680f5d5bfddf1330b1450c78f",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "việc-chưa-quyết-để-lại-cho-item-build-lớp-quyết-định-thật-đã-hoàn-tất-qua-dispatchmjs-decide-pha-1-4-pha-5-hoãn",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_371dbd6e2f5537ded0fafe4e6956c7c3",
    "sourceUnitDigest": "2515ea9bfe27df31965fca859c15076ca4eb59c8549b5ff48bdb718d1f1c15d6",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-90",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-231 (lines 2318–2320) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-90. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "2515ea9bfe27df31965fca859c15076ca4eb59c8549b5ff48bdb718d1f1c15d6",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Việc chưa quyết, để lại cho item build lớp quyết định thật (Đã hoàn tất qua `dispatch.mjs decide` & Pha 1-4; Pha 5 hoãn)"
    ]
  }
}
```

### Full source unit

```text
- Tín hiệu phát hiện "launcher hiện tại có phải soul sống cùng provider không": Caller tự khai báo qua cờ `--has-live-task-access` khi gọi `dispatch.mjs decide` (Pha 3/4). Pha 5 mở rộng sang `agy` hoãn lại (YAGNI).
- Cơ chế tường minh áp CÙNG 1 quyết định dispatch cho cả subTask lẫn capacity trong code thật: `dispatch.mjs decide` đã hợp nhất qua 1 entry point duy nhất (Pha 4, `tsk-3ik`).
- Địa điểm đặt lớp quyết định native-vs-cli/spawn: Nằm ở helper `decideDispatchMechanism` / `decideExecutorDispatchMechanism` (`src/runner/dispatch/mechanism.mjs`), được gọi bởi `dispatch.mjs decide`.
```

### Full target unit

```text
- Tín hiệu phát hiện "launcher hiện tại có phải soul sống cùng provider không": Caller tự khai báo qua cờ `--has-live-task-access` khi gọi `dispatch.mjs decide` (Pha 3/4). Pha 5 mở rộng sang `agy` hoãn lại (YAGNI).
- Cơ chế tường minh áp CÙNG 1 quyết định dispatch cho cả subTask lẫn capacity trong code thật: `dispatch.mjs decide` đã hợp nhất qua 1 entry point duy nhất (Pha 4, `tsk-3ik`).
- Địa điểm đặt lớp quyết định native-vs-cli/spawn: Nằm ở helper `decideDispatchMechanism` / `decideExecutorDispatchMechanism` (`src/runner/dispatch/mechanism.mjs`), được gọi bởi `dispatch.mjs decide`.
```

### Full diff

```diff
No text difference.
```

## claim_6ba08f50d0899a95fc8a30c738430037

Source digest: 86dc66eee5838d77b40475ed0b27263538b8e6f1b99af3bb84febac27800220c

Target digest: 86dc66eee5838d77b40475ed0b27263538b8e6f1b99af3bb84febac27800220c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "kế-hoạch-triển-khai-5-pha-đã-file-thành-work-item-deps-thật",
  "sourceLines": [
    2322,
    2322
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "kế-hoạch-triển-khai-5-pha-đã-file-thành-work-item-deps-thật",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "nativeTargetClaimId": "claim_dad20ae09592045e45a6ebf25e8f3850",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "kế-hoạch-triển-khai-5-pha-đã-file-thành-work-item-deps-thật",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6ba08f50d0899a95fc8a30c738430037",
    "sourceUnitDigest": "86dc66eee5838d77b40475ed0b27263538b8e6f1b99af3bb84febac27800220c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "kế-hoạch-triển-khai-5-pha-đã-file-thành-work-item-deps-thật",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#kế-hoạch-triển-khai-5-pha-đã-file-thành-work-item-deps-thật (lines 2322–2322) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#kế-hoạch-triển-khai-5-pha-đã-file-thành-work-item-deps-thật. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "86dc66eee5838d77b40475ed0b27263538b8e6f1b99af3bb84febac27800220c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
    ]
  }
}
```

### Full source unit

```text
#### Kế hoạch triển khai (5 pha, đã file thành work item, deps thật)

| Pha | Item | Phụ thuộc | Song song được với | Trạng thái |
|---|---|---|---|---|
| 1 | `tsk-1ni` — fix `repoRoot` (state-root/content-root lẫn nhau) + verify-overwrite | không | Pha 3 (`tsk-53h`, khác file) | Done |
| 2 | `tsk-27y` — protocol caller tự khai verdict cho `fgos discover`/`fgos plan` | không (chỉ overlap footprint với Pha 1, không phải dep logic) | Pha 3 (`tsk-53h`, khác file) | Done |
| 3 | `tsk-53h` — shared helper phát hiện native-vs-cli/spawn cho skill-facing capacity | `tsk-3sw` (đã done) | Pha 1, Pha 2 (khác file, không overlap) | Done |
| 4 | `tsk-3ik` — hợp nhất `capabilities.<id>` config dispatch với lời gọi Task tool trực tiếp | `tsk-27y` + `tsk-53h` | không (chờ cả 2 xong) | Done |
| 5 | `tsk-6db` — mở rộng native detection sang `agy` (deferred, YAGNI, chưa consumer thật) | `tsk-53h` | Pha 2, Pha 4 (concern khác nhau) | Hoãn / Deferred (YAGNI) |
```

### Full target unit

```text
#### Kế hoạch triển khai (5 pha, đã file thành work item, deps thật)

| Pha | Item | Phụ thuộc | Song song được với | Trạng thái |
|---|---|---|---|---|
| 1 | `tsk-1ni` — fix `repoRoot` (state-root/content-root lẫn nhau) + verify-overwrite | không | Pha 3 (`tsk-53h`, khác file) | Done |
| 2 | `tsk-27y` — protocol caller tự khai verdict cho `fgos discover`/`fgos plan` | không (chỉ overlap footprint với Pha 1, không phải dep logic) | Pha 3 (`tsk-53h`, khác file) | Done |
| 3 | `tsk-53h` — shared helper phát hiện native-vs-cli/spawn cho skill-facing capacity | `tsk-3sw` (đã done) | Pha 1, Pha 2 (khác file, không overlap) | Done |
| 4 | `tsk-3ik` — hợp nhất `capabilities.<id>` config dispatch với lời gọi Task tool trực tiếp | `tsk-27y` + `tsk-53h` | không (chờ cả 2 xong) | Done |
| 5 | `tsk-6db` — mở rộng native detection sang `agy` (deferred, YAGNI, chưa consumer thật) | `tsk-53h` | Pha 2, Pha 4 (concern khác nhau) | Hoãn / Deferred (YAGNI) |
```

### Full diff

```diff
No text difference.
```

## claim_55a57bfcf543d71d662fa9c4578853f6

Source digest: c14ba12fe277739fa5d6809dc6a041a8eae62fe5b1762d38f59fdfa14f919f8a

Target digest: c14ba12fe277739fa5d6809dc6a041a8eae62fe5b1762d38f59fdfa14f919f8a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-232",
  "sourceLines": [
    2324,
    2330
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Kế hoạch triển khai (5 pha, đã file thành work item, deps thật)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-91",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Kế hoạch triển khai (5 pha, đã file thành work item, deps thật)"
  ],
  "nativeTargetClaimId": "claim_c962b7d9646363cafba23768700e6424",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "kế-hoạch-triển-khai-5-pha-đã-file-thành-work-item-deps-thật",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_55a57bfcf543d71d662fa9c4578853f6",
    "sourceUnitDigest": "c14ba12fe277739fa5d6809dc6a041a8eae62fe5b1762d38f59fdfa14f919f8a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-91",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-232 (lines 2324–2330) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-91. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c14ba12fe277739fa5d6809dc6a041a8eae62fe5b1762d38f59fdfa14f919f8a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Kế hoạch triển khai (5 pha, đã file thành work item, deps thật)"
    ]
  }
}
```

### Full source unit

```text
| Pha | Item | Phụ thuộc | Song song được với | Trạng thái |
|---|---|---|---|---|
| 1 | `tsk-1ni` — fix `repoRoot` (state-root/content-root lẫn nhau) + verify-overwrite | không | Pha 3 (`tsk-53h`, khác file) | Done |
| 2 | `tsk-27y` — protocol caller tự khai verdict cho `fgos discover`/`fgos plan` | không (chỉ overlap footprint với Pha 1, không phải dep logic) | Pha 3 (`tsk-53h`, khác file) | Done |
| 3 | `tsk-53h` — shared helper phát hiện native-vs-cli/spawn cho skill-facing capacity | `tsk-3sw` (đã done) | Pha 1, Pha 2 (khác file, không overlap) | Done |
| 4 | `tsk-3ik` — hợp nhất `capabilities.<id>` config dispatch với lời gọi Task tool trực tiếp | `tsk-27y` + `tsk-53h` | không (chờ cả 2 xong) | Done |
| 5 | `tsk-6db` — mở rộng native detection sang `agy` (deferred, YAGNI, chưa consumer thật) | `tsk-53h` | Pha 2, Pha 4 (concern khác nhau) | Hoãn / Deferred (YAGNI) |
```

### Full target unit

```text
| Pha | Item | Phụ thuộc | Song song được với | Trạng thái |
|---|---|---|---|---|
| 1 | `tsk-1ni` — fix `repoRoot` (state-root/content-root lẫn nhau) + verify-overwrite | không | Pha 3 (`tsk-53h`, khác file) | Done |
| 2 | `tsk-27y` — protocol caller tự khai verdict cho `fgos discover`/`fgos plan` | không (chỉ overlap footprint với Pha 1, không phải dep logic) | Pha 3 (`tsk-53h`, khác file) | Done |
| 3 | `tsk-53h` — shared helper phát hiện native-vs-cli/spawn cho skill-facing capacity | `tsk-3sw` (đã done) | Pha 1, Pha 2 (khác file, không overlap) | Done |
| 4 | `tsk-3ik` — hợp nhất `capabilities.<id>` config dispatch với lời gọi Task tool trực tiếp | `tsk-27y` + `tsk-53h` | không (chờ cả 2 xong) | Done |
| 5 | `tsk-6db` — mở rộng native detection sang `agy` (deferred, YAGNI, chưa consumer thật) | `tsk-53h` | Pha 2, Pha 4 (concern khác nhau) | Hoãn / Deferred (YAGNI) |
```

### Full diff

```diff
No text difference.
```

## claim_c534a1d34445a9c84f0ac6d415c6ac94

Source digest: 2333b6eb1f3a2b9c23f8744316800c7d17c79d5c3427fa96a6b2ffe4b971f0dd

Target digest: 2333b6eb1f3a2b9c23f8744316800c7d17c79d5c3427fa96a6b2ffe4b971f0dd

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "tham-chiếu",
  "sourceLines": [
    2332,
    2332
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "tham-chiếu",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
  ],
  "nativeTargetClaimId": "claim_b597cede1b1421cbad8da6184df2ced8",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "tham-chiếu",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c534a1d34445a9c84f0ac6d415c6ac94",
    "sourceUnitDigest": "2333b6eb1f3a2b9c23f8744316800c7d17c79d5c3427fa96a6b2ffe4b971f0dd",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "tham-chiếu",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#tham-chiếu (lines 2332–2332) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#tham-chiếu. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "2333b6eb1f3a2b9c23f8744316800c7d17c79d5c3427fa96a6b2ffe4b971f0dd",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity"
    ]
  }
}
```

### Full source unit

```text
#### Tham chiếu

- `tsk-3sw` — `docs/history/agent-executor-capacity-kind-task-resolution/CONTEXT.md`
- `tsk-53h` — `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md`
- `tsk-1ni` — gap `readLockedContext`/verify-overwrite, bằng chứng sống
  cho lớp quyết định còn thiếu
- `tsk-27y`, `tsk-3ik`, `tsk-6db` — Pha 2/4/5 của kế hoạch triển khai trên
- `docs/explanation/agent-executor-capacity-aware-dispatch.md`
```

### Full target unit

```text
#### Tham chiếu

- `tsk-3sw` — `docs/history/agent-executor-capacity-kind-task-resolution/CONTEXT.md`
- `tsk-53h` — `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md`
- `tsk-1ni` — gap `readLockedContext`/verify-overwrite, bằng chứng sống
  cho lớp quyết định còn thiếu
- `tsk-27y`, `tsk-3ik`, `tsk-6db` — Pha 2/4/5 của kế hoạch triển khai trên
- `docs/explanation/agent-executor-capacity-aware-dispatch.md`
```

### Full diff

```diff
No text difference.
```

## claim_62f02199d351a194094cfb027a5afbf0

Source digest: a803612fdf64eaf97219093605e541dc4ed553a371b452a81fad8a1f6201fc4e

Target digest: a803612fdf64eaf97219093605e541dc4ed553a371b452a81fad8a1f6201fc4e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-233",
  "sourceLines": [
    2334,
    2339
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Tham chiếu"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-92",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
    "Tham chiếu"
  ],
  "nativeTargetClaimId": "claim_4fa1749446056ced3d751cde91aefa37",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "tham-chiếu",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_62f02199d351a194094cfb027a5afbf0",
    "sourceUnitDigest": "a803612fdf64eaf97219093605e541dc4ed553a371b452a81fad8a1f6201fc4e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-92",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-233 (lines 2334–2339) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-92. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a803612fdf64eaf97219093605e541dc4ed553a371b452a81fad8a1f6201fc4e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity",
      "Tham chiếu"
    ]
  }
}
```

### Full source unit

```text
- `tsk-3sw` — `docs/history/agent-executor-capacity-kind-task-resolution/CONTEXT.md`
- `tsk-53h` — `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md`
- `tsk-1ni` — gap `readLockedContext`/verify-overwrite, bằng chứng sống
  cho lớp quyết định còn thiếu
- `tsk-27y`, `tsk-3ik`, `tsk-6db` — Pha 2/4/5 của kế hoạch triển khai trên
- `docs/explanation/agent-executor-capacity-aware-dispatch.md`
```

### Full target unit

```text
- `tsk-3sw` — `docs/history/agent-executor-capacity-kind-task-resolution/CONTEXT.md`
- `tsk-53h` — `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md`
- `tsk-1ni` — gap `readLockedContext`/verify-overwrite, bằng chứng sống
  cho lớp quyết định còn thiếu
- `tsk-27y`, `tsk-3ik`, `tsk-6db` — Pha 2/4/5 của kế hoạch triển khai trên
- `docs/explanation/agent-executor-capacity-aware-dispatch.md`
```

### Full diff

```diff
No text difference.
```

## claim_a1ca672a9ce5da2f5d1be2f4a304897e

Source digest: d8f1249a2c419f0baf2d767776d91463f1efa81acbfb98ec917f75e46fd0841d

Target digest: d8f1249a2c419f0baf2d767776d91463f1efa81acbfb98ec917f75e46fd0841d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0028-đổi-tên-pinned-term-orchestrator-thành-launcher",
  "sourceLines": [
    2341,
    2341
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0028-đổi-tên-pinned-term-orchestrator-thành-launcher",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_de59391b15a4f71ccae806b6e67f83a2",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0028-đổi-tên-pinned-term-orchestrator-thành-launcher",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_a1ca672a9ce5da2f5d1be2f4a304897e",
    "sourceUnitDigest": "d8f1249a2c419f0baf2d767776d91463f1efa81acbfb98ec917f75e46fd0841d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0028-đổi-tên-pinned-term-orchestrator-thành-launcher",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0028-đổi-tên-pinned-term-orchestrator-thành-launcher (lines 2341–2341) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0028-đổi-tên-pinned-term-orchestrator-thành-launcher. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d8f1249a2c419f0baf2d767776d91463f1efa81acbfb98ec917f75e46fd0841d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0028 — Đổi tên pinned term `orchestrator` thành `launcher`
```

### Full target unit

```text
### 0028 — Đổi tên pinned term `orchestrator` thành `launcher`
```

### Full diff

```diff
No text difference.
```

## claim_21481f570623626c555abeb66544e32a

Source digest: a2c04691faba0522f2ef90f8e0d4e0940e61682ea1c81b226f8fe75d6e33b523

Target digest: a2c04691faba0522f2ef90f8e0d4e0940e61682ea1c81b226f8fe75d6e33b523

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-8",
  "sourceLines": [
    2343,
    2343
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-8",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`"
  ],
  "nativeTargetClaimId": "claim_be379116c51565f27582b402839ef07f",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-8",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_21481f570623626c555abeb66544e32a",
    "sourceUnitDigest": "a2c04691faba0522f2ef90f8e0d4e0940e61682ea1c81b226f8fe75d6e33b523",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-8",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-8 (lines 2343–2343) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-8. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a2c04691faba0522f2ef90f8e0d4e0940e61682ea1c81b226f8fe75d6e33b523",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

`0026` đặt tên **orchestrator** cho vai trò: tiến trình/cơ chế QUYẾT ĐỊNH
kích hoạt 1 rootTask, đứng nó lên, rồi bước ra hoàn toàn — logic chọn "item
nào tiếp theo" giữ THUẦN CƠ HỌC, không cần soul; soul chỉ vào cuộc SAU KHI
vai trò này đã quyết định kích hoạt rootTask nào (`0026`'s chính văn: "Vai
trò orchestrator KHÔNG CẦN soul").

Tên này sai nghĩa ngành: "orchestrator" trong ngành (Airflow, Temporal,
Kubernetes) chỉ định 1 tiến trình điều phối NHIỀU đơn vị theo thời gian,
duy trì liên hệ liên tục trong lúc chạy (dependency graph, retry, giám sát,
fan-in). Vai trò `0026` mô tả làm NGƯỢC LẠI: chọn đúng 1 item bằng logic cơ
học, đứng nó lên, rồi bước ra hoàn toàn — không điều phối gì thêm sau đó.
Gọi vai trò này là "orchestrator" là hứa quá: người đọc đi tìm logic điều
phối vốn không tồn tại trong vai trò này.

Người dùng chốt tên thay thế là **launcher** (2026-08-08), sau khi so sánh
4 ứng viên: launcher/invoker/activator/commander.
```

### Full target unit

```text
#### Bối cảnh

`0026` đặt tên **orchestrator** cho vai trò: tiến trình/cơ chế QUYẾT ĐỊNH
kích hoạt 1 rootTask, đứng nó lên, rồi bước ra hoàn toàn — logic chọn "item
nào tiếp theo" giữ THUẦN CƠ HỌC, không cần soul; soul chỉ vào cuộc SAU KHI
vai trò này đã quyết định kích hoạt rootTask nào (`0026`'s chính văn: "Vai
trò orchestrator KHÔNG CẦN soul").

Tên này sai nghĩa ngành: "orchestrator" trong ngành (Airflow, Temporal,
Kubernetes) chỉ định 1 tiến trình điều phối NHIỀU đơn vị theo thời gian,
duy trì liên hệ liên tục trong lúc chạy (dependency graph, retry, giám sát,
fan-in). Vai trò `0026` mô tả làm NGƯỢC LẠI: chọn đúng 1 item bằng logic cơ
học, đứng nó lên, rồi bước ra hoàn toàn — không điều phối gì thêm sau đó.
Gọi vai trò này là "orchestrator" là hứa quá: người đọc đi tìm logic điều
phối vốn không tồn tại trong vai trò này.

Người dùng chốt tên thay thế là **launcher** (2026-08-08), sau khi so sánh
4 ứng viên: launcher/invoker/activator/commander.
```

### Full diff

```diff
No text difference.
```

## claim_38e1fafac6d0ffb1befee68f9667c736

Source digest: a66be9eb72492a81f9bcea49ef682373065cbbaeb45a23695fa146ca9f3c76dc

Target digest: a66be9eb72492a81f9bcea49ef682373065cbbaeb45a23695fa146ca9f3c76dc

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-234",
  "sourceLines": [
    2345,
    2349
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-93",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_b641e994d07e2e4c7c1a3952406535d5",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-8",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_38e1fafac6d0ffb1befee68f9667c736",
    "sourceUnitDigest": "a66be9eb72492a81f9bcea49ef682373065cbbaeb45a23695fa146ca9f3c76dc",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-93",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-234 (lines 2345–2349) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-93. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a66be9eb72492a81f9bcea49ef682373065cbbaeb45a23695fa146ca9f3c76dc",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
`0026` đặt tên **orchestrator** cho vai trò: tiến trình/cơ chế QUYẾT ĐỊNH
kích hoạt 1 rootTask, đứng nó lên, rồi bước ra hoàn toàn — logic chọn "item
nào tiếp theo" giữ THUẦN CƠ HỌC, không cần soul; soul chỉ vào cuộc SAU KHI
vai trò này đã quyết định kích hoạt rootTask nào (`0026`'s chính văn: "Vai
trò orchestrator KHÔNG CẦN soul").
```

### Full target unit

```text
`0026` đặt tên **orchestrator** cho vai trò: tiến trình/cơ chế QUYẾT ĐỊNH
kích hoạt 1 rootTask, đứng nó lên, rồi bước ra hoàn toàn — logic chọn "item
nào tiếp theo" giữ THUẦN CƠ HỌC, không cần soul; soul chỉ vào cuộc SAU KHI
vai trò này đã quyết định kích hoạt rootTask nào (`0026`'s chính văn: "Vai
trò orchestrator KHÔNG CẦN soul").
```

### Full diff

```diff
No text difference.
```

## claim_3a292bfca814886da454961d4a2364bf

Source digest: 265e074e8764de57391cf373be73e3cfbb7737c62b5d0c3908a65bf1bed9ddf8

Target digest: 265e074e8764de57391cf373be73e3cfbb7737c62b5d0c3908a65bf1bed9ddf8

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-235",
  "sourceLines": [
    2351,
    2357
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-94",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_8854b8f65ecd0e570432b6be8800b28b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-8",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3a292bfca814886da454961d4a2364bf",
    "sourceUnitDigest": "265e074e8764de57391cf373be73e3cfbb7737c62b5d0c3908a65bf1bed9ddf8",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-94",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-235 (lines 2351–2357) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-94. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "265e074e8764de57391cf373be73e3cfbb7737c62b5d0c3908a65bf1bed9ddf8",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Tên này sai nghĩa ngành: "orchestrator" trong ngành (Airflow, Temporal,
Kubernetes) chỉ định 1 tiến trình điều phối NHIỀU đơn vị theo thời gian,
duy trì liên hệ liên tục trong lúc chạy (dependency graph, retry, giám sát,
fan-in). Vai trò `0026` mô tả làm NGƯỢC LẠI: chọn đúng 1 item bằng logic cơ
học, đứng nó lên, rồi bước ra hoàn toàn — không điều phối gì thêm sau đó.
Gọi vai trò này là "orchestrator" là hứa quá: người đọc đi tìm logic điều
phối vốn không tồn tại trong vai trò này.
```

### Full target unit

```text
Tên này sai nghĩa ngành: "orchestrator" trong ngành (Airflow, Temporal,
Kubernetes) chỉ định 1 tiến trình điều phối NHIỀU đơn vị theo thời gian,
duy trì liên hệ liên tục trong lúc chạy (dependency graph, retry, giám sát,
fan-in). Vai trò `0026` mô tả làm NGƯỢC LẠI: chọn đúng 1 item bằng logic cơ
học, đứng nó lên, rồi bước ra hoàn toàn — không điều phối gì thêm sau đó.
Gọi vai trò này là "orchestrator" là hứa quá: người đọc đi tìm logic điều
phối vốn không tồn tại trong vai trò này.
```

### Full diff

```diff
No text difference.
```

## claim_674406418c8c1d1d8ce33179ccde5884

Source digest: c95bab0058c491c7a83180fc7aa9fa0ca4a2203fde9fa48b7656f5a066e563eb

Target digest: c95bab0058c491c7a83180fc7aa9fa0ca4a2203fde9fa48b7656f5a066e563eb

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-236",
  "sourceLines": [
    2359,
    2360
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-95",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_dde079e4f38db42b31e4ad52752f8a4c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-8",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_674406418c8c1d1d8ce33179ccde5884",
    "sourceUnitDigest": "c95bab0058c491c7a83180fc7aa9fa0ca4a2203fde9fa48b7656f5a066e563eb",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-95",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-236 (lines 2359–2360) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-95. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c95bab0058c491c7a83180fc7aa9fa0ca4a2203fde9fa48b7656f5a066e563eb",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Người dùng chốt tên thay thế là **launcher** (2026-08-08), sau khi so sánh
4 ứng viên: launcher/invoker/activator/commander.
```

### Full target unit

```text
Người dùng chốt tên thay thế là **launcher** (2026-08-08), sau khi so sánh
4 ứng viên: launcher/invoker/activator/commander.
```

### Full diff

```diff
No text difference.
```

## claim_92527ac22d56830923e42002f45e4503

Source digest: 6fa9c9fcc7c65f27e78a080da2ba7c23d99924ddccad999cad74da219cbe06f8

Target digest: 6fa9c9fcc7c65f27e78a080da2ba7c23d99924ddccad999cad74da219cbe06f8

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-6",
  "sourceLines": [
    2362,
    2362
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-6",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`"
  ],
  "nativeTargetClaimId": "claim_374418592cfe7531e8192a79f7014252",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-6",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_92527ac22d56830923e42002f45e4503",
    "sourceUnitDigest": "6fa9c9fcc7c65f27e78a080da2ba7c23d99924ddccad999cad74da219cbe06f8",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-6",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-6 (lines 2362–2362) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-6. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6fa9c9fcc7c65f27e78a080da2ba7c23d99924ddccad999cad74da219cbe06f8",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Đổi pinned term `orchestrator` → `launcher` xuyên suốt prose fgOS tự sở
hữu (decision doc, `docs/history/*`, `docs/how-to/*`, comment trong
`src/runner/*.mjs`, và mọi chỗ khác dùng từ này theo đúng nghĩa vai trò
`0026` mô tả — kiểm từng chỗ, không đổi hàng loạt mù). KHÔNG đổi:
`herdr-dashboard/src/**/*.rs`'s `PaneOrchestrator` (khái niệm Rust khác hẳn —
trait mở/focus terminal pane, dùng từ đúng, giữ nguyên), `docs/distillery/**`
(trích dẫn verbatim từ nguồn upstream), `plans/reports/**` (bản ghi lịch
sử, không sửa ngược).

Record này chỉ supersede TÊN GỌI của `0026`, không phải thiết kế/logic của
vai trò đó — 4 quy tắc chọn cơ chế dispatch, khái niệm rootTask/subTask/
capacity, và kế hoạch triển khai 5 pha trong `0026` giữ nguyên, chỉ đổi
nhãn "orchestrator" thành "launcher" mọi nơi nó xuất hiện.

Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác, CHƯA
gán nghĩa trong record này — ứng viên đã bàn (chưa chốt): tầng điều phối
N đơn vị chạy đồng thời + hợp nhất kết quả (`fgos-fanout`,
`fgos-runner --watch`). Một item sau này claim nghĩa mới cho từ này, nếu
cần.
```

### Full target unit

```text
#### Quyết định

Đổi pinned term `orchestrator` → `launcher` xuyên suốt prose fgOS tự sở
hữu (decision doc, `docs/history/*`, `docs/how-to/*`, comment trong
`src/runner/*.mjs`, và mọi chỗ khác dùng từ này theo đúng nghĩa vai trò
`0026` mô tả — kiểm từng chỗ, không đổi hàng loạt mù). KHÔNG đổi:
`herdr-dashboard/src/**/*.rs`'s `PaneOrchestrator` (khái niệm Rust khác hẳn —
trait mở/focus terminal pane, dùng từ đúng, giữ nguyên), `docs/distillery/**`
(trích dẫn verbatim từ nguồn upstream), `plans/reports/**` (bản ghi lịch
sử, không sửa ngược).

Record này chỉ supersede TÊN GỌI của `0026`, không phải thiết kế/logic của
vai trò đó — 4 quy tắc chọn cơ chế dispatch, khái niệm rootTask/subTask/
capacity, và kế hoạch triển khai 5 pha trong `0026` giữ nguyên, chỉ đổi
nhãn "orchestrator" thành "launcher" mọi nơi nó xuất hiện.

Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác, CHƯA
gán nghĩa trong record này — ứng viên đã bàn (chưa chốt): tầng điều phối
N đơn vị chạy đồng thời + hợp nhất kết quả (`fgos-fanout`,
`fgos-runner --watch`). Một item sau này claim nghĩa mới cho từ này, nếu
cần.
```

### Full diff

```diff
No text difference.
```

## claim_fb2b0e955d7288b0d36851be1e21cd96

Source digest: de6ce5fc73c6abee5c5636fe0a75cbc826e11d7d95840ff4f63f2797da7f976b

Target digest: de6ce5fc73c6abee5c5636fe0a75cbc826e11d7d95840ff4f63f2797da7f976b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-237",
  "sourceLines": [
    2364,
    2371
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-96",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_dbc7ad3a4bc424981b8031ee66d95172",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-6",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_fb2b0e955d7288b0d36851be1e21cd96",
    "sourceUnitDigest": "de6ce5fc73c6abee5c5636fe0a75cbc826e11d7d95840ff4f63f2797da7f976b",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-96",
    "claimKind": "decision",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-237 (lines 2364–2371) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-96. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "de6ce5fc73c6abee5c5636fe0a75cbc826e11d7d95840ff4f63f2797da7f976b",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Đổi pinned term `orchestrator` → `launcher` xuyên suốt prose fgOS tự sở
hữu (decision doc, `docs/history/*`, `docs/how-to/*`, comment trong
`src/runner/*.mjs`, và mọi chỗ khác dùng từ này theo đúng nghĩa vai trò
`0026` mô tả — kiểm từng chỗ, không đổi hàng loạt mù). KHÔNG đổi:
`herdr-dashboard/src/**/*.rs`'s `PaneOrchestrator` (khái niệm Rust khác hẳn —
trait mở/focus terminal pane, dùng từ đúng, giữ nguyên), `docs/distillery/**`
(trích dẫn verbatim từ nguồn upstream), `plans/reports/**` (bản ghi lịch
sử, không sửa ngược).
```

### Full target unit

```text
Đổi pinned term `orchestrator` → `launcher` xuyên suốt prose fgOS tự sở
hữu (decision doc, `docs/history/*`, `docs/how-to/*`, comment trong
`src/runner/*.mjs`, và mọi chỗ khác dùng từ này theo đúng nghĩa vai trò
`0026` mô tả — kiểm từng chỗ, không đổi hàng loạt mù). KHÔNG đổi:
`herdr-dashboard/src/**/*.rs`'s `PaneOrchestrator` (khái niệm Rust khác hẳn —
trait mở/focus terminal pane, dùng từ đúng, giữ nguyên), `docs/distillery/**`
(trích dẫn verbatim từ nguồn upstream), `plans/reports/**` (bản ghi lịch
sử, không sửa ngược).
```

### Full diff

```diff
No text difference.
```

## claim_b83711d99137ee1f36d5ab2d7e8111a8

Source digest: 3f1e835fdda3d85100b7d3e9752ec502be377f17358e1dd9d32911f294ea3ced

Target digest: 3f1e835fdda3d85100b7d3e9752ec502be377f17358e1dd9d32911f294ea3ced

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-238",
  "sourceLines": [
    2373,
    2376
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-97",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_6bf9d039b4896ec4c4a75b9bfddc2a27",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-6",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b83711d99137ee1f36d5ab2d7e8111a8",
    "sourceUnitDigest": "3f1e835fdda3d85100b7d3e9752ec502be377f17358e1dd9d32911f294ea3ced",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-97",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-238 (lines 2373–2376) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-97. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3f1e835fdda3d85100b7d3e9752ec502be377f17358e1dd9d32911f294ea3ced",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Record này chỉ supersede TÊN GỌI của `0026`, không phải thiết kế/logic của
vai trò đó — 4 quy tắc chọn cơ chế dispatch, khái niệm rootTask/subTask/
capacity, và kế hoạch triển khai 5 pha trong `0026` giữ nguyên, chỉ đổi
nhãn "orchestrator" thành "launcher" mọi nơi nó xuất hiện.
```

### Full target unit

```text
Record này chỉ supersede TÊN GỌI của `0026`, không phải thiết kế/logic của
vai trò đó — 4 quy tắc chọn cơ chế dispatch, khái niệm rootTask/subTask/
capacity, và kế hoạch triển khai 5 pha trong `0026` giữ nguyên, chỉ đổi
nhãn "orchestrator" thành "launcher" mọi nơi nó xuất hiện.
```

### Full diff

```diff
No text difference.
```

## claim_44270f020c1e5f055098dfee0772e6d7

Source digest: ba2849d909619a304171ccece011f39238a3516f95643631c023e0699eaef99f

Target digest: ba2849d909619a304171ccece011f39238a3516f95643631c023e0699eaef99f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-239",
  "sourceLines": [
    2378,
    2382
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-98",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_7734c205aab0496cd9e22afc1176d2ab",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-6",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_44270f020c1e5f055098dfee0772e6d7",
    "sourceUnitDigest": "ba2849d909619a304171ccece011f39238a3516f95643631c023e0699eaef99f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-98",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-239 (lines 2378–2382) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-98. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ba2849d909619a304171ccece011f39238a3516f95643631c023e0699eaef99f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác, CHƯA
gán nghĩa trong record này — ứng viên đã bàn (chưa chốt): tầng điều phối
N đơn vị chạy đồng thời + hợp nhất kết quả (`fgos-fanout`,
`fgos-runner --watch`). Một item sau này claim nghĩa mới cho từ này, nếu
cần.
```

### Full target unit

```text
Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác, CHƯA
gán nghĩa trong record này — ứng viên đã bàn (chưa chốt): tầng điều phối
N đơn vị chạy đồng thời + hợp nhất kết quả (`fgos-fanout`,
`fgos-runner --watch`). Một item sau này claim nghĩa mới cho từ này, nếu
cần.
```

### Full diff

```diff
No text difference.
```

## claim_044216d43ee604e2c391f65904d4fc67

Source digest: 736119c4cc6845655cbf0c7bd974e6ca9aa47af56a18637967135727d7999319

Target digest: 736119c4cc6845655cbf0c7bd974e6ca9aa47af56a18637967135727d7999319

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả-6",
  "sourceLines": [
    2384,
    2384
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả-6",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`"
  ],
  "nativeTargetClaimId": "claim_526ca0076312b5d33de6b4328df35729",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả-6",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_044216d43ee604e2c391f65904d4fc67",
    "sourceUnitDigest": "736119c4cc6845655cbf0c7bd974e6ca9aa47af56a18637967135727d7999319",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả-6",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả-6 (lines 2384–2384) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả-6. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "736119c4cc6845655cbf0c7bd974e6ca9aa47af56a18637967135727d7999319",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- `0026` không sửa tại chỗ — vẫn đúng nguyên văn lịch sử của phần thiết kế
  (4 quy tắc dispatch, rootTask/subTask/capacity, kế hoạch 5 pha), chỉ đổi
  từ "orchestrator" thành "launcher" trong chính văn của nó (đây là phần
  ĐANG được rename, không phải phần bị đóng băng — khác với trường hợp
  `0006`/`0024` nơi `0006` giữ nguyên 100% chữ nghĩa cũ). `0026` nhận thêm
  `superseded_by: 0028` trong frontmatter, đúng khuôn STR72 trỏ-ngược-bắt-buộc.
- 6 skill (`.claude/skills/` + mirror `.agents/skills/`, 12 file) đang trỏ
  tới `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md` bằng đường dẫn — **filename của `0026` không đổi**, nên 12
  file này không cần sửa gì (đường dẫn vẫn đúng, chỉ nội dung 0026 trỏ tới
  đã đổi từ vựng bên trong).
- Test guard (`test/docs/launcher-vocabulary-guard.test.mjs`) chống tái
  phạm: fail khi "orchestrator" xuất hiện trong prose fgOS tự sở hữu ngoài
  allowlist trên.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
#### Hệ quả

- `0026` không sửa tại chỗ — vẫn đúng nguyên văn lịch sử của phần thiết kế
  (4 quy tắc dispatch, rootTask/subTask/capacity, kế hoạch 5 pha), chỉ đổi
  từ "orchestrator" thành "launcher" trong chính văn của nó (đây là phần
  ĐANG được rename, không phải phần bị đóng băng — khác với trường hợp
  `0006`/`0024` nơi `0006` giữ nguyên 100% chữ nghĩa cũ). `0026` nhận thêm
  `superseded_by: 0028` trong frontmatter, đúng khuôn STR72 trỏ-ngược-bắt-buộc.
- 6 skill (`.claude/skills/` + mirror `.agents/skills/`, 12 file) đang trỏ
  tới `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md` bằng đường dẫn — **filename của `0026` không đổi**, nên 12
  file này không cần sửa gì (đường dẫn vẫn đúng, chỉ nội dung 0026 trỏ tới
  đã đổi từ vựng bên trong).
- Test guard (`test/docs/launcher-vocabulary-guard.test.mjs`) chống tái
  phạm: fail khi "orchestrator" xuất hiện trong prose fgOS tự sở hữu ngoài
  allowlist trên.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_bcd43c0eef030ebd45a057f308a14392

Source digest: 3dbb5948ea796ed42d3e29b5338460cce69def97fcbf54de420a1f1a36baedd1

Target digest: 3dbb5948ea796ed42d3e29b5338460cce69def97fcbf54de420a1f1a36baedd1

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-240",
  "sourceLines": [
    2386,
    2399
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-99",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_38ef9687251eca7dd8b76d7e90c833be",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả-6",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_bcd43c0eef030ebd45a057f308a14392",
    "sourceUnitDigest": "3dbb5948ea796ed42d3e29b5338460cce69def97fcbf54de420a1f1a36baedd1",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-99",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-240 (lines 2386–2399) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-99. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3dbb5948ea796ed42d3e29b5338460cce69def97fcbf54de420a1f1a36baedd1",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
- `0026` không sửa tại chỗ — vẫn đúng nguyên văn lịch sử của phần thiết kế
  (4 quy tắc dispatch, rootTask/subTask/capacity, kế hoạch 5 pha), chỉ đổi
  từ "orchestrator" thành "launcher" trong chính văn của nó (đây là phần
  ĐANG được rename, không phải phần bị đóng băng — khác với trường hợp
  `0006`/`0024` nơi `0006` giữ nguyên 100% chữ nghĩa cũ). `0026` nhận thêm
  `superseded_by: 0028` trong frontmatter, đúng khuôn STR72 trỏ-ngược-bắt-buộc.
- 6 skill (`.claude/skills/` + mirror `.agents/skills/`, 12 file) đang trỏ
  tới `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md` bằng đường dẫn — **filename của `0026` không đổi**, nên 12
  file này không cần sửa gì (đường dẫn vẫn đúng, chỉ nội dung 0026 trỏ tới
  đã đổi từ vựng bên trong).
- Test guard (`test/docs/launcher-vocabulary-guard.test.mjs`) chống tái
  phạm: fail khi "orchestrator" xuất hiện trong prose fgOS tự sở hữu ngoài
  allowlist trên.
```

### Full target unit

```text
- `0026` không sửa tại chỗ — vẫn đúng nguyên văn lịch sử của phần thiết kế
  (4 quy tắc dispatch, rootTask/subTask/capacity, kế hoạch 5 pha), chỉ đổi
  từ "orchestrator" thành "launcher" trong chính văn của nó (đây là phần
  ĐANG được rename, không phải phần bị đóng băng — khác với trường hợp
  `0006`/`0024` nơi `0006` giữ nguyên 100% chữ nghĩa cũ). `0026` nhận thêm
  `superseded_by: 0028` trong frontmatter, đúng khuôn STR72 trỏ-ngược-bắt-buộc.
- 6 skill (`.claude/skills/` + mirror `.agents/skills/`, 12 file) đang trỏ
  tới `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md` bằng đường dẫn — **filename của `0026` không đổi**, nên 12
  file này không cần sửa gì (đường dẫn vẫn đúng, chỉ nội dung 0026 trỏ tới
  đã đổi từ vựng bên trong).
- Test guard (`test/docs/launcher-vocabulary-guard.test.mjs`) chống tái
  phạm: fail khi "orchestrator" xuất hiện trong prose fgOS tự sở hữu ngoài
  allowlist trên.
```

### Full diff

```diff
No text difference.
```

## claim_73ea5bccb4b67f99853a9aa0c14884fb

Source digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Target digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-241",
  "sourceLines": [
    2401,
    2401
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0028 — Đổi tên pinned term `orchestrator` thành `launcher`",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-9",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_892115f8efacf90f172fe53b82296354",
  "class": "Weak-exact",
  "classReason": "target digest repeats; ancestor headings differ",
  "section": "hệ-quả-6",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_73ea5bccb4b67f99853a9aa0c14884fb",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: target digest repeats; ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-241 (lines 2401–2401) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_02222a3adca323c42d68bfc1e3ef0074

Source digest: c93ff7accfa74d803887b10ccc4f1c83000d462985b7ca40b18b41104939ce8c

Target digest: c93ff7accfa74d803887b10ccc4f1c83000d462985b7ca40b18b41104939ce8c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0029-sửa-ba-mệnh-đề-từ-vựng-dispatch-của-0026-bỏ-roottasksubtask-capacity-là-năng-lực-có-tên-t1-hai-giá-trị",
  "sourceLines": [
    2403,
    2403
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0029-sửa-ba-mệnh-đề-từ-vựng-dispatch-của-0026-bỏ-roottasksubtask-capacity-là-năng-lực-có-tên-t1-hai-giá-trị",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_b3cea5cb3ad93514fbf225b88483ae64",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0029-sửa-ba-mệnh-đề-từ-vựng-dispatch-của-0026-bỏ-roottasksubtask-capacity-là-năng-lực-có-tên-t1-hai-giá-trị",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_02222a3adca323c42d68bfc1e3ef0074",
    "sourceUnitDigest": "c93ff7accfa74d803887b10ccc4f1c83000d462985b7ca40b18b41104939ce8c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0029-sửa-ba-mệnh-đề-từ-vựng-dispatch-của-0026-bỏ-roottasksubtask-capacity-là-năng-lực-có-tên-t1-hai-giá-trị",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0029-sửa-ba-mệnh-đề-từ-vựng-dispatch-của-0026-bỏ-roottasksubtask-capacity-là-năng-lực-có-tên-t1-hai-giá-trị (lines 2403–2403) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0029-sửa-ba-mệnh-đề-từ-vựng-dispatch-của-0026-bỏ-roottasksubtask-capacity-là-năng-lực-có-tên-t1-hai-giá-trị. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c93ff7accfa74d803887b10ccc4f1c83000d462985b7ca40b18b41104939ce8c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị
```

### Full target unit

```text
### 0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị
```

### Full diff

```diff
No text difference.
```

## claim_95df09dc4b082eed910954ae3d9f2982

Source digest: 3c0b2783128372e5b83c4cf6a47c550f020d1f903c41e8896f17326cfc17d153

Target digest: 3c0b2783128372e5b83c4cf6a47c550f020d1f903c41e8896f17326cfc17d153

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-9",
  "sourceLines": [
    2405,
    2405
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-9",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
  ],
  "nativeTargetClaimId": "claim_2887305de9ae99e5b1eec5746139677e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_95df09dc4b082eed910954ae3d9f2982",
    "sourceUnitDigest": "3c0b2783128372e5b83c4cf6a47c550f020d1f903c41e8896f17326cfc17d153",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-9 (lines 2405–2405) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3c0b2783128372e5b83c4cf6a47c550f020d1f903c41e8896f17326cfc17d153",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

Phiên `tsk-5td` (`fgos-coding-shaping`, `docs/history/dispatch-concept-
boundary/DISCUSSION.md`) khoá lại ranh giới khái niệm tầng dispatch sau khi
gom bài học gather-work vs execution-work của bee, và chốt ba quyết định
cùng chạm đúng **một** mục định nghĩa của `0026` — mục "Đơn vị
vận hành (vocabulary, chốt dùng xuyên suốt từ đây)". Tiền lệ: `0028` đã
supersede `0026` một lần cho việc đổi tên `orchestrator`→`launcher`. Vì cả
ba quyết định lần này cũng sửa đúng mục đó, gộp chung **một** record thay vì
ba.
```

### Full target unit

```text
#### Bối cảnh

Phiên `tsk-5td` (`fgos-coding-shaping`, `docs/history/dispatch-concept-
boundary/DISCUSSION.md`) khoá lại ranh giới khái niệm tầng dispatch sau khi
gom bài học gather-work vs execution-work của bee, và chốt ba quyết định
cùng chạm đúng **một** mục định nghĩa của `0026` — mục "Đơn vị
vận hành (vocabulary, chốt dùng xuyên suốt từ đây)". Tiền lệ: `0028` đã
supersede `0026` một lần cho việc đổi tên `orchestrator`→`launcher`. Vì cả
ba quyết định lần này cũng sửa đúng mục đó, gộp chung **một** record thay vì
ba.
```

### Full diff

```diff
No text difference.
```

## claim_41d42bb1d41f1b439c2ac09d70e441e5

Source digest: ef18f7bdec64b02eb56ec009335d940fea15a4f8e01c3fd545d90fd2790709a4

Target digest: ef18f7bdec64b02eb56ec009335d940fea15a4f8e01c3fd545d90fd2790709a4

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-242",
  "sourceLines": [
    2407,
    2414
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-101",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_f4fba6c1e0ab0e842d8dd7eeef445d40",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_41d42bb1d41f1b439c2ac09d70e441e5",
    "sourceUnitDigest": "ef18f7bdec64b02eb56ec009335d940fea15a4f8e01c3fd545d90fd2790709a4",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-101",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-242 (lines 2407–2414) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-101. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ef18f7bdec64b02eb56ec009335d940fea15a4f8e01c3fd545d90fd2790709a4",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Phiên `tsk-5td` (`fgos-coding-shaping`, `docs/history/dispatch-concept-
boundary/DISCUSSION.md`) khoá lại ranh giới khái niệm tầng dispatch sau khi
gom bài học gather-work vs execution-work của bee, và chốt ba quyết định
cùng chạm đúng **một** mục định nghĩa của `0026` — mục "Đơn vị
vận hành (vocabulary, chốt dùng xuyên suốt từ đây)". Tiền lệ: `0028` đã
supersede `0026` một lần cho việc đổi tên `orchestrator`→`launcher`. Vì cả
ba quyết định lần này cũng sửa đúng mục đó, gộp chung **một** record thay vì
ba.
```

### Full target unit

```text
Phiên `tsk-5td` (`fgos-coding-shaping`, `docs/history/dispatch-concept-
boundary/DISCUSSION.md`) khoá lại ranh giới khái niệm tầng dispatch sau khi
gom bài học gather-work vs execution-work của bee, và chốt ba quyết định
cùng chạm đúng **một** mục định nghĩa của `0026` — mục "Đơn vị
vận hành (vocabulary, chốt dùng xuyên suốt từ đây)". Tiền lệ: `0028` đã
supersede `0026` một lần cho việc đổi tên `orchestrator`→`launcher`. Vì cả
ba quyết định lần này cũng sửa đúng mục đó, gộp chung **một** record thay vì
ba.
```

### Full diff

```diff
No text difference.
```

## claim_d6ffa6438e88873e2ab109de98c88b8e

Source digest: e47e55176fe9a60d019524370f213d7ef2e9a101127b1fe1240f73a96c81447f

Target digest: e47e55176fe9a60d019524370f213d7ef2e9a101127b1fe1240f73a96c81447f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-7",
  "sourceLines": [
    2416,
    2416
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-7",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
  ],
  "nativeTargetClaimId": "claim_b3389737d8dcbeac1caba4fa25b03038",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-7",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d6ffa6438e88873e2ab109de98c88b8e",
    "sourceUnitDigest": "e47e55176fe9a60d019524370f213d7ef2e9a101127b1fe1240f73a96c81447f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-7",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-7 (lines 2416–2416) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-7. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e47e55176fe9a60d019524370f213d7ef2e9a101127b1fe1240f73a96c81447f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định
```

### Full target unit

```text
#### Quyết định
```

### Full diff

```diff
No text difference.
```

## claim_90bc8da9f3ac54b28ee99c0571f3d644

Source digest: a45acaeb1652116327762820c76424ed00d2f2de131d94c16cb179b6e8c57e0d

Target digest: a45acaeb1652116327762820c76424ed00d2f2de131d94c16cb179b6e8c57e0d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bỏ-roottasksubtask-khỏi-từ-vựng-dispatch",
  "sourceLines": [
    2418,
    2418
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bỏ-roottasksubtask-khỏi-từ-vựng-dispatch",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_0b59e371e81849e5beff43f57e126297",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bỏ-roottasksubtask-khỏi-từ-vựng-dispatch",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_90bc8da9f3ac54b28ee99c0571f3d644",
    "sourceUnitDigest": "a45acaeb1652116327762820c76424ed00d2f2de131d94c16cb179b6e8c57e0d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bỏ-roottasksubtask-khỏi-từ-vựng-dispatch",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#bỏ-roottasksubtask-khỏi-từ-vựng-dispatch (lines 2418–2418) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bỏ-roottasksubtask-khỏi-từ-vựng-dispatch. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a45acaeb1652116327762820c76424ed00d2f2de131d94c16cb179b6e8c57e0d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
##### — bỏ `rootTask`/`subTask` khỏi từ vựng dispatch

`0026` viết: *"**rootTask** — công việc gốc đang làm... **Vai trò này** có
tính ĐỆ QUY/fractal"* và *"**subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG
bản chất chỉ là 1 **rootTask** khác... 'subTask' chỉ là tên gọi **tương
đối**, nhìn từ góc của bên kích hoạt"*.

Sửa: bỏ cả hai chữ khỏi từ vựng dispatch. `0026` tự khai `rootTask` là một
**vai trò**, không phải một lớp phân loại — một item nằm backlog là `work`;
một launcher đứng nó lên thì cùng dòng, cùng id, state không đổi một byte mà
chỉ đổi tên gọi. Thay `rootTask` bằng **`work`** (T2, `tsk-*`) mang **vai
trò** T1 khi được kích hoạt. `subTask` đội hai nghĩa khác tập, tách theo
đúng nghĩa: (a) work con sinh ra bởi decompose — đã có tên và đã có field
lưu (`work.parent`, `0012`'s cạnh parent-child) → gọi là **child work**; (b)
target của một lần dispatch đệ quy, thoáng qua, không lưu — chỉ là một
`work`/exec-packet khác, không cần tên riêng.
```

### Full target unit

```text
##### — bỏ `rootTask`/`subTask` khỏi từ vựng dispatch

`0026` viết: *"**rootTask** — công việc gốc đang làm... **Vai trò này** có
tính ĐỆ QUY/fractal"* và *"**subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG
bản chất chỉ là 1 **rootTask** khác... 'subTask' chỉ là tên gọi **tương
đối**, nhìn từ góc của bên kích hoạt"*.

Sửa: bỏ cả hai chữ khỏi từ vựng dispatch. `0026` tự khai `rootTask` là một
**vai trò**, không phải một lớp phân loại — một item nằm backlog là `work`;
một launcher đứng nó lên thì cùng dòng, cùng id, state không đổi một byte mà
chỉ đổi tên gọi. Thay `rootTask` bằng **`work`** (T2, `tsk-*`) mang **vai
trò** T1 khi được kích hoạt. `subTask` đội hai nghĩa khác tập, tách theo
đúng nghĩa: (a) work con sinh ra bởi decompose — đã có tên và đã có field
lưu (`work.parent`, `0012`'s cạnh parent-child) → gọi là **child work**; (b)
target của một lần dispatch đệ quy, thoáng qua, không lưu — chỉ là một
`work`/exec-packet khác, không cần tên riêng.
```

### Full diff

```diff
No text difference.
```

## claim_1ce072ed299f65792cb14a111469678b

Source digest: 36bb7f7b2b4f964fb5d106412948b44530a8691bc02acd77372167fa1e792bd9

Target digest: 36bb7f7b2b4f964fb5d106412948b44530a8691bc02acd77372167fa1e792bd9

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-243",
  "sourceLines": [
    2420,
    2423
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— bỏ `rootTask`/`subTask` khỏi từ vựng dispatch"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-102",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— bỏ `rootTask`/`subTask` khỏi từ vựng dispatch"
  ],
  "nativeTargetClaimId": "claim_c60fedae7cd2c2b1becc9586e88c3a0d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bỏ-roottasksubtask-khỏi-từ-vựng-dispatch",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_1ce072ed299f65792cb14a111469678b",
    "sourceUnitDigest": "36bb7f7b2b4f964fb5d106412948b44530a8691bc02acd77372167fa1e792bd9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-102",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-243 (lines 2420–2423) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-102. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "36bb7f7b2b4f964fb5d106412948b44530a8691bc02acd77372167fa1e792bd9",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Quyết định",
      "— bỏ `rootTask`/`subTask` khỏi từ vựng dispatch"
    ]
  }
}
```

### Full source unit

```text
`0026` viết: *"**rootTask** — công việc gốc đang làm... **Vai trò này** có
tính ĐỆ QUY/fractal"* và *"**subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG
bản chất chỉ là 1 **rootTask** khác... 'subTask' chỉ là tên gọi **tương
đối**, nhìn từ góc của bên kích hoạt"*.
```

### Full target unit

```text
`0026` viết: *"**rootTask** — công việc gốc đang làm... **Vai trò này** có
tính ĐỆ QUY/fractal"* và *"**subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG
bản chất chỉ là 1 **rootTask** khác... 'subTask' chỉ là tên gọi **tương
đối**, nhìn từ góc của bên kích hoạt"*.
```

### Full diff

```diff
No text difference.
```

## claim_04a03bbcf22da92e35c076a333a441cb

Source digest: 498cc3ab94e0728b996c9492a695fef800d180bbf6c66d32a1941c555d1808de

Target digest: 498cc3ab94e0728b996c9492a695fef800d180bbf6c66d32a1941c555d1808de

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-244",
  "sourceLines": [
    2425,
    2433
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— bỏ `rootTask`/`subTask` khỏi từ vựng dispatch"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-103",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— bỏ `rootTask`/`subTask` khỏi từ vựng dispatch"
  ],
  "nativeTargetClaimId": "claim_e9812b34018664fe5356db6be6699114",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bỏ-roottasksubtask-khỏi-từ-vựng-dispatch",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_04a03bbcf22da92e35c076a333a441cb",
    "sourceUnitDigest": "498cc3ab94e0728b996c9492a695fef800d180bbf6c66d32a1941c555d1808de",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-103",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-244 (lines 2425–2433) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-103. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "498cc3ab94e0728b996c9492a695fef800d180bbf6c66d32a1941c555d1808de",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Quyết định",
      "— bỏ `rootTask`/`subTask` khỏi từ vựng dispatch"
    ]
  }
}
```

### Full source unit

```text
Sửa: bỏ cả hai chữ khỏi từ vựng dispatch. `0026` tự khai `rootTask` là một
**vai trò**, không phải một lớp phân loại — một item nằm backlog là `work`;
một launcher đứng nó lên thì cùng dòng, cùng id, state không đổi một byte mà
chỉ đổi tên gọi. Thay `rootTask` bằng **`work`** (T2, `tsk-*`) mang **vai
trò** T1 khi được kích hoạt. `subTask` đội hai nghĩa khác tập, tách theo
đúng nghĩa: (a) work con sinh ra bởi decompose — đã có tên và đã có field
lưu (`work.parent`, `0012`'s cạnh parent-child) → gọi là **child work**; (b)
target của một lần dispatch đệ quy, thoáng qua, không lưu — chỉ là một
`work`/exec-packet khác, không cần tên riêng.
```

### Full target unit

```text
Sửa: bỏ cả hai chữ khỏi từ vựng dispatch. `0026` tự khai `rootTask` là một
**vai trò**, không phải một lớp phân loại — một item nằm backlog là `work`;
một launcher đứng nó lên thì cùng dòng, cùng id, state không đổi một byte mà
chỉ đổi tên gọi. Thay `rootTask` bằng **`work`** (T2, `tsk-*`) mang **vai
trò** T1 khi được kích hoạt. `subTask` đội hai nghĩa khác tập, tách theo
đúng nghĩa: (a) work con sinh ra bởi decompose — đã có tên và đã có field
lưu (`work.parent`, `0012`'s cạnh parent-child) → gọi là **child work**; (b)
target của một lần dispatch đệ quy, thoáng qua, không lưu — chỉ là một
`work`/exec-packet khác, không cần tên riêng.
```

### Full diff

```diff
No text difference.
```

## claim_4cf1caaebb2f42d74bcb0fbf1f5ad1fe

Source digest: bdb952cf50f1ad2350771dd66bf8d2457df5227ab87f184abce12a8a277f22fe

Target digest: bdb952cf50f1ad2350771dd66bf8d2457df5227ab87f184abce12a8a277f22fe

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "capacity-một-năng-lực-có-tên-behavior-promise-functional-helper",
  "sourceLines": [
    2435,
    2435
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "capacity-một-năng-lực-có-tên-behavior-promise-functional-helper",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_a0a0ff34a5fc2385fbcdf5319a102080",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "capacity-một-năng-lực-có-tên-behavior-promise-functional-helper",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_4cf1caaebb2f42d74bcb0fbf1f5ad1fe",
    "sourceUnitDigest": "bdb952cf50f1ad2350771dd66bf8d2457df5227ab87f184abce12a8a277f22fe",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "capacity-một-năng-lực-có-tên-behavior-promise-functional-helper",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#capacity-một-năng-lực-có-tên-behavior-promise-functional-helper (lines 2435–2435) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#capacity-một-năng-lực-có-tên-behavior-promise-functional-helper. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "bdb952cf50f1ad2350771dd66bf8d2457df5227ab87f184abce12a8a277f22fe",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
##### — `capacity` = một năng lực có tên (behavior-promise / functional-helper)

`0026` viết: *"**capacity** — KHÁC bản chất với subTask: là 1 đơn vị
functional/helper hẹp (judge-discovery, submit-assist-classify) — không tự
mang vòng đời 1 rootTask đầy đủ"*.

Sửa: bản chất **giữ nguyên** — vẫn là đơn vị functional/helper hẹp — nhưng
nâng thành cặp **behavior-promise / functional-helper**: behavior-promise
trả lời nó **hứa** gì (`digest` hay `verdict`), functional-helper trả lời nó
**là** gì (hẹp, không authority, phục vụ mục tiêu người khác). Một mình
functional-helper thì hụt hợp đồng — lý do `0026` từng trôi sang tiêu chí
cấu trúc "không tự mang vòng đời rootTask đầy đủ"; một mình behavior-promise
thì không phân biệt được với tool (tool cũng hứa hành vi). **Tiêu chí phân
định** đổi từ cấu trúc ("không mang vòng đời rootTask đầy đủ") sang
**authority + state effects**. `capacities.<id>` (config) là **bản khai**
của một capacity, không phải bản thân capacity đó — cùng quan hệ giữa
`gitnexus` và dòng registry mô tả nó.
```

### Full target unit

```text
##### — `capacity` = một năng lực có tên (behavior-promise / functional-helper)

`0026` viết: *"**capacity** — KHÁC bản chất với subTask: là 1 đơn vị
functional/helper hẹp (judge-discovery, submit-assist-classify) — không tự
mang vòng đời 1 rootTask đầy đủ"*.

Sửa: bản chất **giữ nguyên** — vẫn là đơn vị functional/helper hẹp — nhưng
nâng thành cặp **behavior-promise / functional-helper**: behavior-promise
trả lời nó **hứa** gì (`digest` hay `verdict`), functional-helper trả lời nó
**là** gì (hẹp, không authority, phục vụ mục tiêu người khác). Một mình
functional-helper thì hụt hợp đồng — lý do `0026` từng trôi sang tiêu chí
cấu trúc "không tự mang vòng đời rootTask đầy đủ"; một mình behavior-promise
thì không phân biệt được với tool (tool cũng hứa hành vi). **Tiêu chí phân
định** đổi từ cấu trúc ("không mang vòng đời rootTask đầy đủ") sang
**authority + state effects**. `capacities.<id>` (config) là **bản khai**
của một capacity, không phải bản thân capacity đó — cùng quan hệ giữa
`gitnexus` và dòng registry mô tả nó.
```

### Full diff

```diff
No text difference.
```

## claim_073eea178ddb52f6cf281cd4d98dc9b0

Source digest: 8d4afe21130a227b114a97bcc2e010f64e6de8e31eb99ea4ff0799b5ac66e292

Target digest: 8d4afe21130a227b114a97bcc2e010f64e6de8e31eb99ea4ff0799b5ac66e292

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-245",
  "sourceLines": [
    2437,
    2439
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— `capacity` = một năng lực có tên (behavior-promise / functional-helper)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-104",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— `capacity` = một năng lực có tên (behavior-promise / functional-helper)"
  ],
  "nativeTargetClaimId": "claim_a37fb25286f4fedd8ffba8ee2a2fd421",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "capacity-một-năng-lực-có-tên-behavior-promise-functional-helper",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_073eea178ddb52f6cf281cd4d98dc9b0",
    "sourceUnitDigest": "8d4afe21130a227b114a97bcc2e010f64e6de8e31eb99ea4ff0799b5ac66e292",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-104",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-245 (lines 2437–2439) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-104. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8d4afe21130a227b114a97bcc2e010f64e6de8e31eb99ea4ff0799b5ac66e292",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Quyết định",
      "— `capacity` = một năng lực có tên (behavior-promise / functional-helper)"
    ]
  }
}
```

### Full source unit

```text
`0026` viết: *"**capacity** — KHÁC bản chất với subTask: là 1 đơn vị
functional/helper hẹp (judge-discovery, submit-assist-classify) — không tự
mang vòng đời 1 rootTask đầy đủ"*.
```

### Full target unit

```text
`0026` viết: *"**capacity** — KHÁC bản chất với subTask: là 1 đơn vị
functional/helper hẹp (judge-discovery, submit-assist-classify) — không tự
mang vòng đời 1 rootTask đầy đủ"*.
```

### Full diff

```diff
No text difference.
```

## claim_ab7ac45bddc789eb97d376bbd3116f67

Source digest: ebe37d584a8b8fb2b9524d5bd99312759f65032e5e9f21a5a68c50350eb3068b

Target digest: ebe37d584a8b8fb2b9524d5bd99312759f65032e5e9f21a5a68c50350eb3068b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-246",
  "sourceLines": [
    2441,
    2451
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— `capacity` = một năng lực có tên (behavior-promise / functional-helper)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-105",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— `capacity` = một năng lực có tên (behavior-promise / functional-helper)"
  ],
  "nativeTargetClaimId": "claim_6ca38bd1cf5a6c9ba270d18c60369315",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "capacity-một-năng-lực-có-tên-behavior-promise-functional-helper",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ab7ac45bddc789eb97d376bbd3116f67",
    "sourceUnitDigest": "ebe37d584a8b8fb2b9524d5bd99312759f65032e5e9f21a5a68c50350eb3068b",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-105",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-246 (lines 2441–2451) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-105. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ebe37d584a8b8fb2b9524d5bd99312759f65032e5e9f21a5a68c50350eb3068b",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Quyết định",
      "— `capacity` = một năng lực có tên (behavior-promise / functional-helper)"
    ]
  }
}
```

### Full source unit

```text
Sửa: bản chất **giữ nguyên** — vẫn là đơn vị functional/helper hẹp — nhưng
nâng thành cặp **behavior-promise / functional-helper**: behavior-promise
trả lời nó **hứa** gì (`digest` hay `verdict`), functional-helper trả lời nó
**là** gì (hẹp, không authority, phục vụ mục tiêu người khác). Một mình
functional-helper thì hụt hợp đồng — lý do `0026` từng trôi sang tiêu chí
cấu trúc "không tự mang vòng đời rootTask đầy đủ"; một mình behavior-promise
thì không phân biệt được với tool (tool cũng hứa hành vi). **Tiêu chí phân
định** đổi từ cấu trúc ("không mang vòng đời rootTask đầy đủ") sang
**authority + state effects**. `capacities.<id>` (config) là **bản khai**
của một capacity, không phải bản thân capacity đó — cùng quan hệ giữa
`gitnexus` và dòng registry mô tả nó.
```

### Full target unit

```text
Sửa: bản chất **giữ nguyên** — vẫn là đơn vị functional/helper hẹp — nhưng
nâng thành cặp **behavior-promise / functional-helper**: behavior-promise
trả lời nó **hứa** gì (`digest` hay `verdict`), functional-helper trả lời nó
**là** gì (hẹp, không authority, phục vụ mục tiêu người khác). Một mình
functional-helper thì hụt hợp đồng — lý do `0026` từng trôi sang tiêu chí
cấu trúc "không tự mang vòng đời rootTask đầy đủ"; một mình behavior-promise
thì không phân biệt được với tool (tool cũng hứa hành vi). **Tiêu chí phân
định** đổi từ cấu trúc ("không mang vòng đời rootTask đầy đủ") sang
**authority + state effects**. `capacities.<id>` (config) là **bản khai**
của một capacity, không phải bản thân capacity đó — cùng quan hệ giữa
`gitnexus` và dòng registry mô tả nó.
```

### Full diff

```diff
No text difference.
```

## claim_670f343b35cc44d578eb070e60695f68

Source digest: 616c222609568f919a78d2faa84edfc975c8e8db9c2d046ea7922f4e48b47cdc

Target digest: 616c222609568f919a78d2faa84edfc975c8e8db9c2d046ea7922f4e48b47cdc

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "t1-vai-trò-bên-gọi-hai-giá-trị-launcherdriver-orchestrator-tầng-hợp-thành-t0",
  "sourceLines": [
    2453,
    2453
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "t1-vai-trò-bên-gọi-hai-giá-trị-launcherdriver-orchestrator-tầng-hợp-thành-t0",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_91c497e415477398bfaebaf749f56398",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "t1-vai-trò-bên-gọi-hai-giá-trị-launcherdriver-orchestrator-tầng-hợp-thành-t0",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_670f343b35cc44d578eb070e60695f68",
    "sourceUnitDigest": "616c222609568f919a78d2faa84edfc975c8e8db9c2d046ea7922f4e48b47cdc",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "t1-vai-trò-bên-gọi-hai-giá-trị-launcherdriver-orchestrator-tầng-hợp-thành-t0",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#t1-vai-trò-bên-gọi-hai-giá-trị-launcherdriver-orchestrator-tầng-hợp-thành-t0 (lines 2453–2453) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#t1-vai-trò-bên-gọi-hai-giá-trị-launcherdriver-orchestrator-tầng-hợp-thành-t0. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "616c222609568f919a78d2faa84edfc975c8e8db9c2d046ea7922f4e48b47cdc",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
##### — T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0

`0026` chưa từng liệt kê rõ T1 có bao nhiêu giá trị — chỉ định nghĩa
`launcher`. `0028` chỉ đổi TÊN vai trò đó (`orchestrator`→`launcher`), chưa
từng đụng tới SỐ giá trị; `tsk-2cw` (đã `cleanup`) tự ghi mục đích thứ hai
trong tiêu đề của nó — *"giải phóng từ orchestrator để dành cho MỤC ĐÍCH
KHÁC"* — rồi để trống, không nói mục đích đó là gì.

Sửa: điền vào đúng chỗ trống đó. `0028` đã lập luận sẵn hai tính chất **độc
lập** của vai trò bên gọi: **arity** (1 đơn vị hay N đơn vị) và
**engagement** (bước ra hẳn — "buông" — hay giữ liên hệ liên tục — "ở
lại"). Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
(N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
hợp thành T0**: N lần dấn thân con (mỗi lần là một `driver`) rồi hợp nhất
kết quả (bằng chứng sống: `fgos-fanout` spawn N Agent, mỗi Agent chạy
`/fgOS:pick` end-to-end — mỗi cái là một `driver`, tổng thể là T0); (N,
buông) = trống **có lý do** — buông N đơn vị cùng lúc thì không còn ai hợp
nhất kết quả, đó chỉ là `launcher` chạy N lần, không phải một vai trò mới.
⇒ **T1 chỉ có hai giá trị.**
```

### Full target unit

```text
##### — T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0

`0026` chưa từng liệt kê rõ T1 có bao nhiêu giá trị — chỉ định nghĩa
`launcher`. `0028` chỉ đổi TÊN vai trò đó (`orchestrator`→`launcher`), chưa
từng đụng tới SỐ giá trị; `tsk-2cw` (đã `cleanup`) tự ghi mục đích thứ hai
trong tiêu đề của nó — *"giải phóng từ orchestrator để dành cho MỤC ĐÍCH
KHÁC"* — rồi để trống, không nói mục đích đó là gì.

Sửa: điền vào đúng chỗ trống đó. `0028` đã lập luận sẵn hai tính chất **độc
lập** của vai trò bên gọi: **arity** (1 đơn vị hay N đơn vị) và
**engagement** (bước ra hẳn — "buông" — hay giữ liên hệ liên tục — "ở
lại"). Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
(N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
hợp thành T0**: N lần dấn thân con (mỗi lần là một `driver`) rồi hợp nhất
kết quả (bằng chứng sống: `fgos-fanout` spawn N Agent, mỗi Agent chạy
`/fgOS:pick` end-to-end — mỗi cái là một `driver`, tổng thể là T0); (N,
buông) = trống **có lý do** — buông N đơn vị cùng lúc thì không còn ai hợp
nhất kết quả, đó chỉ là `launcher` chạy N lần, không phải một vai trò mới.
⇒ **T1 chỉ có hai giá trị.**
```

### Full diff

```diff
No text difference.
```

## claim_c481c65d7e4150af235f82f2f0ce81c8

Source digest: 5386679e5a03f851b64a824b159e3317b40822be737c2b4936c5788ad391830f

Target digest: 5386679e5a03f851b64a824b159e3317b40822be737c2b4936c5788ad391830f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-247",
  "sourceLines": [
    2455,
    2459
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-106",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0"
  ],
  "nativeTargetClaimId": "claim_e196d79f73ae5f2a053113df95a92e95",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "t1-vai-trò-bên-gọi-hai-giá-trị-launcherdriver-orchestrator-tầng-hợp-thành-t0",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c481c65d7e4150af235f82f2f0ce81c8",
    "sourceUnitDigest": "5386679e5a03f851b64a824b159e3317b40822be737c2b4936c5788ad391830f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-106",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-247 (lines 2455–2459) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-106. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "5386679e5a03f851b64a824b159e3317b40822be737c2b4936c5788ad391830f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Quyết định",
      "— T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0"
    ]
  }
}
```

### Full source unit

```text
`0026` chưa từng liệt kê rõ T1 có bao nhiêu giá trị — chỉ định nghĩa
`launcher`. `0028` chỉ đổi TÊN vai trò đó (`orchestrator`→`launcher`), chưa
từng đụng tới SỐ giá trị; `tsk-2cw` (đã `cleanup`) tự ghi mục đích thứ hai
trong tiêu đề của nó — *"giải phóng từ orchestrator để dành cho MỤC ĐÍCH
KHÁC"* — rồi để trống, không nói mục đích đó là gì.
```

### Full target unit

```text
`0026` chưa từng liệt kê rõ T1 có bao nhiêu giá trị — chỉ định nghĩa
`launcher`. `0028` chỉ đổi TÊN vai trò đó (`orchestrator`→`launcher`), chưa
từng đụng tới SỐ giá trị; `tsk-2cw` (đã `cleanup`) tự ghi mục đích thứ hai
trong tiêu đề của nó — *"giải phóng từ orchestrator để dành cho MỤC ĐÍCH
KHÁC"* — rồi để trống, không nói mục đích đó là gì.
```

### Full diff

```diff
No text difference.
```

## claim_75c377796c78c0790f896c905ce6eeab

Source digest: 4f37e3101303fb13398d4b292c695eb061d36e653b3c4aafb275f4949238bc1e

Target digest: 4f37e3101303fb13398d4b292c695eb061d36e653b3c4aafb275f4949238bc1e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-248",
  "sourceLines": [
    2461,
    2471
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-107",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Quyết định",
    "— T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0"
  ],
  "nativeTargetClaimId": "claim_f1dac3c601fdc6536f5205582b7c584f",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "t1-vai-trò-bên-gọi-hai-giá-trị-launcherdriver-orchestrator-tầng-hợp-thành-t0",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_75c377796c78c0790f896c905ce6eeab",
    "sourceUnitDigest": "4f37e3101303fb13398d4b292c695eb061d36e653b3c4aafb275f4949238bc1e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-107",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-248 (lines 2461–2471) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-107. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "4f37e3101303fb13398d4b292c695eb061d36e653b3c4aafb275f4949238bc1e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Quyết định",
      "— T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0"
    ]
  }
}
```

### Full source unit

```text
Sửa: điền vào đúng chỗ trống đó. `0028` đã lập luận sẵn hai tính chất **độc
lập** của vai trò bên gọi: **arity** (1 đơn vị hay N đơn vị) và
**engagement** (bước ra hẳn — "buông" — hay giữ liên hệ liên tục — "ở
lại"). Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
(N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
hợp thành T0**: N lần dấn thân con (mỗi lần là một `driver`) rồi hợp nhất
kết quả (bằng chứng sống: `fgos-fanout` spawn N Agent, mỗi Agent chạy
`/fgOS:pick` end-to-end — mỗi cái là một `driver`, tổng thể là T0); (N,
buông) = trống **có lý do** — buông N đơn vị cùng lúc thì không còn ai hợp
nhất kết quả, đó chỉ là `launcher` chạy N lần, không phải một vai trò mới.
⇒ **T1 chỉ có hai giá trị.**
```

### Full target unit

```text
Sửa: điền vào đúng chỗ trống đó. `0028` đã lập luận sẵn hai tính chất **độc
lập** của vai trò bên gọi: **arity** (1 đơn vị hay N đơn vị) và
**engagement** (bước ra hẳn — "buông" — hay giữ liên hệ liên tục — "ở
lại"). Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
(N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
hợp thành T0**: N lần dấn thân con (mỗi lần là một `driver`) rồi hợp nhất
kết quả (bằng chứng sống: `fgos-fanout` spawn N Agent, mỗi Agent chạy
`/fgOS:pick` end-to-end — mỗi cái là một `driver`, tổng thể là T0); (N,
buông) = trống **có lý do** — buông N đơn vị cùng lúc thì không còn ai hợp
nhất kết quả, đó chỉ là `launcher` chạy N lần, không phải một vai trò mới.
⇒ **T1 chỉ có hai giá trị.**
```

### Full diff

```diff
No text difference.
```

## claim_ca231ef093c8bd2a5ac89d1299e01853

Source digest: c5c6ad2ea55987a32ed41732beb0582d0326128ed827cc655b29e2a14ae2d9bc

Target digest: c5c6ad2ea55987a32ed41732beb0582d0326128ed827cc655b29e2a14ae2d9bc

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả-7",
  "sourceLines": [
    2473,
    2473
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả-7",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
  ],
  "nativeTargetClaimId": "claim_e8a6b6bfaf6432a100af32102d6e9248",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả-7",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ca231ef093c8bd2a5ac89d1299e01853",
    "sourceUnitDigest": "c5c6ad2ea55987a32ed41732beb0582d0326128ed827cc655b29e2a14ae2d9bc",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả-7",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả-7 (lines 2473–2473) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả-7. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c5c6ad2ea55987a32ed41732beb0582d0326128ed827cc655b29e2a14ae2d9bc",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- `0026` **không sửa tại chỗ nội dung** — chỉ frontmatter thay đổi: dòng
  `superseded_by: 0028` thành `superseded_by: [0028, 0029]`. `0028` và
  `0029` supersede hai phần **không chồng lấn** của `0026` (`0028` = tên gọi
  "orchestrator"→"launcher"; `0029` = ba mệnh đề định nghĩa
  `rootTask`/`subTask`/`capacity`/T1 ở trên), nên cả hai đều cần được trích
  từ record cũ — một `superseded_by` dạng danh sách, không phải ghi đè.
- `docs/decisions/0000-index.md`'s dòng của `0026` nhận thêm ghi chú trỏ tới
  `0029` bên cạnh ghi chú `0028` đã có sẵn.
- Không sửa code trong record này. `rg -n "rootTask|subTask" src/ bin/` vẫn
  còn 2 hit ở `src/runner/dispatch.mjs:649,654` — prose trong docstring mô
  tả cơ chế dispatch còn sống, không phải định danh, và nằm ngoài phạm vi
  record này; dọn lại prose đó (nếu cần) là việc của một item khác.
- Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích thứ hai của
  "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp thành T0.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
#### Hệ quả

- `0026` **không sửa tại chỗ nội dung** — chỉ frontmatter thay đổi: dòng
  `superseded_by: 0028` thành `superseded_by: [0028, 0029]`. `0028` và
  `0029` supersede hai phần **không chồng lấn** của `0026` (`0028` = tên gọi
  "orchestrator"→"launcher"; `0029` = ba mệnh đề định nghĩa
  `rootTask`/`subTask`/`capacity`/T1 ở trên), nên cả hai đều cần được trích
  từ record cũ — một `superseded_by` dạng danh sách, không phải ghi đè.
- `docs/decisions/0000-index.md`'s dòng của `0026` nhận thêm ghi chú trỏ tới
  `0029` bên cạnh ghi chú `0028` đã có sẵn.
- Không sửa code trong record này. `rg -n "rootTask|subTask" src/ bin/` vẫn
  còn 2 hit ở `src/runner/dispatch.mjs:649,654` — prose trong docstring mô
  tả cơ chế dispatch còn sống, không phải định danh, và nằm ngoài phạm vi
  record này; dọn lại prose đó (nếu cần) là việc của một item khác.
- Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích thứ hai của
  "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp thành T0.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_f73d4e0517ee0f38c84cd30da94db052

Source digest: 0f15d9aff669fdaabd72924856a9a1459bdb5ddeed309009bc6eb427af67cd20

Target digest: 0f15d9aff669fdaabd72924856a9a1459bdb5ddeed309009bc6eb427af67cd20

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-249",
  "sourceLines": [
    2475,
    2488
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-108",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_149c56f829a7bd22a85420c7ef91af83",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả-7",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f73d4e0517ee0f38c84cd30da94db052",
    "sourceUnitDigest": "0f15d9aff669fdaabd72924856a9a1459bdb5ddeed309009bc6eb427af67cd20",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-108",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-249 (lines 2475–2488) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-108. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0f15d9aff669fdaabd72924856a9a1459bdb5ddeed309009bc6eb427af67cd20",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
- `0026` **không sửa tại chỗ nội dung** — chỉ frontmatter thay đổi: dòng
  `superseded_by: 0028` thành `superseded_by: [0028, 0029]`. `0028` và
  `0029` supersede hai phần **không chồng lấn** của `0026` (`0028` = tên gọi
  "orchestrator"→"launcher"; `0029` = ba mệnh đề định nghĩa
  `rootTask`/`subTask`/`capacity`/T1 ở trên), nên cả hai đều cần được trích
  từ record cũ — một `superseded_by` dạng danh sách, không phải ghi đè.
- `docs/decisions/0000-index.md`'s dòng của `0026` nhận thêm ghi chú trỏ tới
  `0029` bên cạnh ghi chú `0028` đã có sẵn.
- Không sửa code trong record này. `rg -n "rootTask|subTask" src/ bin/` vẫn
  còn 2 hit ở `src/runner/dispatch.mjs:649,654` — prose trong docstring mô
  tả cơ chế dispatch còn sống, không phải định danh, và nằm ngoài phạm vi
  record này; dọn lại prose đó (nếu cần) là việc của một item khác.
- Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích thứ hai của
  "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp thành T0.
```

### Full target unit

```text
- `0026` **không sửa tại chỗ nội dung** — chỉ frontmatter thay đổi: dòng
  `superseded_by: 0028` thành `superseded_by: [0028, 0029]`. `0028` và
  `0029` supersede hai phần **không chồng lấn** của `0026` (`0028` = tên gọi
  "orchestrator"→"launcher"; `0029` = ba mệnh đề định nghĩa
  `rootTask`/`subTask`/`capacity`/T1 ở trên), nên cả hai đều cần được trích
  từ record cũ — một `superseded_by` dạng danh sách, không phải ghi đè.
- `docs/decisions/0000-index.md`'s dòng của `0026` nhận thêm ghi chú trỏ tới
  `0029` bên cạnh ghi chú `0028` đã có sẵn.
- Không sửa code trong record này. `rg -n "rootTask|subTask" src/ bin/` vẫn
  còn 2 hit ở `src/runner/dispatch.mjs:649,654` — prose trong docstring mô
  tả cơ chế dispatch còn sống, không phải định danh, và nằm ngoài phạm vi
  record này; dọn lại prose đó (nếu cần) là việc của một item khác.
- Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích thứ hai của
  "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp thành T0.
```

### Full diff

```diff
No text difference.
```

## claim_7f67d9c0b123003373f3df421c4140c4

Source digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Target digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-250",
  "sourceLines": [
    2490,
    2490
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-9",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_892115f8efacf90f172fe53b82296354",
  "class": "Weak-exact",
  "classReason": "target digest repeats; ancestor headings differ",
  "section": "hệ-quả-7",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_7f67d9c0b123003373f3df421c4140c4",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: target digest repeats; ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-250 (lines 2490–2490) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_5f006128a4aace4f23ca9e593da3fed3

Source digest: b4e45c574dd418a120f4959d19440e0169a7d4b0c40a269d51b720a72969744a

Target digest: b4e45c574dd418a120f4959d19440e0169a7d4b0c40a269d51b720a72969744a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "tham-chiếu-1",
  "sourceLines": [
    2492,
    2492
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "tham-chiếu-1",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
  ],
  "nativeTargetClaimId": "claim_f543c743c7f36fd02e5e8f1c8e5a9076",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "tham-chiếu-1",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5f006128a4aace4f23ca9e593da3fed3",
    "sourceUnitDigest": "b4e45c574dd418a120f4959d19440e0169a7d4b0c40a269d51b720a72969744a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "tham-chiếu-1",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#tham-chiếu-1 (lines 2492–2492) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#tham-chiếu-1. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b4e45c574dd418a120f4959d19440e0169a7d4b0c40a269d51b720a72969744a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
    ]
  }
}
```

### Full source unit

```text
#### Tham chiếu

- `tsk-5td` —, (`fgos show tsk-5td`; `tsk-5td` còn `status:
  doing` trên nhánh riêng `fgw/tsk-5td` tại thời điểm record này được viết,
  nên các quyết định trên chỉ đọc được qua `.fgos` event log dùng chung,
  không qua file `CONTEXT.md` trên nhánh đó)
- `docs/history/dispatch-concept-boundary/DISCUSSION.md` §6.3 (T2 · CẦU),
  §6.4 (T3 · NĂNG LỰC CÓ TÊN — `capacity`), §6.7 (T0 và T1 — vai trò bên
  gọi), §7.1 (Decision doc supersede `0026`)
- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0012` — cạnh parent-child (`work.parent`), nền cho "child work"
```

### Full target unit

```text
#### Tham chiếu

- `tsk-5td` —, (`fgos show tsk-5td`; `tsk-5td` còn `status:
  doing` trên nhánh riêng `fgw/tsk-5td` tại thời điểm record này được viết,
  nên các quyết định trên chỉ đọc được qua `.fgos` event log dùng chung,
  không qua file `CONTEXT.md` trên nhánh đó)
- `docs/history/dispatch-concept-boundary/DISCUSSION.md` §6.3 (T2 · CẦU),
  §6.4 (T3 · NĂNG LỰC CÓ TÊN — `capacity`), §6.7 (T0 và T1 — vai trò bên
  gọi), §7.1 (Decision doc supersede `0026`)
- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0012` — cạnh parent-child (`work.parent`), nền cho "child work"
```

### Full diff

```diff
No text difference.
```

## claim_d85e776b378f3d21aed4edcf1a875b99

Source digest: 74336e18b308da60749aff93de5c1e44ff244cb26d3ed57e0cda0755ece2cce7

Target digest: 74336e18b308da60749aff93de5c1e44ff244cb26d3ed57e0cda0755ece2cce7

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-251",
  "sourceLines": [
    2494,
    2503
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Tham chiếu"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-110",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
    "Tham chiếu"
  ],
  "nativeTargetClaimId": "claim_b0a2e68c7278040950d7775d752faec0",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "tham-chiếu-1",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d85e776b378f3d21aed4edcf1a875b99",
    "sourceUnitDigest": "74336e18b308da60749aff93de5c1e44ff244cb26d3ed57e0cda0755ece2cce7",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-110",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-251 (lines 2494–2503) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-110. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "74336e18b308da60749aff93de5c1e44ff244cb26d3ed57e0cda0755ece2cce7",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị",
      "Tham chiếu"
    ]
  }
}
```

### Full source unit

```text
- `tsk-5td` —, (`fgos show tsk-5td`; `tsk-5td` còn `status:
  doing` trên nhánh riêng `fgw/tsk-5td` tại thời điểm record này được viết,
  nên các quyết định trên chỉ đọc được qua `.fgos` event log dùng chung,
  không qua file `CONTEXT.md` trên nhánh đó)
- `docs/history/dispatch-concept-boundary/DISCUSSION.md` §6.3 (T2 · CẦU),
  §6.4 (T3 · NĂNG LỰC CÓ TÊN — `capacity`), §6.7 (T0 và T1 — vai trò bên
  gọi), §7.1 (Decision doc supersede `0026`)
- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0012` — cạnh parent-child (`work.parent`), nền cho "child work"
```

### Full target unit

```text
- `tsk-5td` —, (`fgos show tsk-5td`; `tsk-5td` còn `status:
  doing` trên nhánh riêng `fgw/tsk-5td` tại thời điểm record này được viết,
  nên các quyết định trên chỉ đọc được qua `.fgos` event log dùng chung,
  không qua file `CONTEXT.md` trên nhánh đó)
- `docs/history/dispatch-concept-boundary/DISCUSSION.md` §6.3 (T2 · CẦU),
  §6.4 (T3 · NĂNG LỰC CÓ TÊN — `capacity`), §6.7 (T0 và T1 — vai trò bên
  gọi), §7.1 (Decision doc supersede `0026`)
- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0012` — cạnh parent-child (`work.parent`), nền cho "child work"
```

### Full diff

```diff
No text difference.
```

## claim_e85546ebdc346910e6f0d4d7e87b6f44

Source digest: 37bc1d87f4949e20df85dca9c8cf5e71c743366dc424168490705486abc1948d

Target digest: 37bc1d87f4949e20df85dca9c8cf5e71c743366dc424168490705486abc1948d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm",
  "sourceLines": [
    2505,
    2505
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_1cf6b9dad05220300ff42482146f69fa",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e85546ebdc346910e6f0d4d7e87b6f44",
    "sourceUnitDigest": "37bc1d87f4949e20df85dca9c8cf5e71c743366dc424168490705486abc1948d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm (lines 2505–2505) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "37bc1d87f4949e20df85dca9c8cf5e71c743366dc424168490705486abc1948d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0030 — Thêm bậc ưu tiên #2 "Release con người" vào thứ tự ưu tiên sản phẩm
```

### Full target unit

```text
### 0030 — Thêm bậc ưu tiên #2 "Release con người" vào thứ tự ưu tiên sản phẩm
```

### Full diff

```diff
No text difference.
```

## claim_4df3e42351bed50bab155db31cac4d69

Source digest: 77fee056c5b08ef7af1a1bd3f50d5e10fd9d4101b583320d9bab46f92be1f2b4

Target digest: 77fee056c5b08ef7af1a1bd3f50d5e10fd9d4101b583320d9bab46f92be1f2b4

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-10",
  "sourceLines": [
    2507,
    2507
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-10",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm"
  ],
  "nativeTargetClaimId": "claim_5a6cd8e064d1bb6db04e63fe4f6c318b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_4df3e42351bed50bab155db31cac4d69",
    "sourceUnitDigest": "77fee056c5b08ef7af1a1bd3f50d5e10fd9d4101b583320d9bab46f92be1f2b4",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-10",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-10 (lines 2507–2507) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-10. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "77fee056c5b08ef7af1a1bd3f50d5e10fd9d4101b583320d9bab46f92be1f2b4",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

`0025` chốt 3 bậc ưu tiên sản phẩm (Ship Faster > DoD > Polish Sau DoD),
nạp always-loaded qua `AGENTS.md`. Trong lúc điều tra `tsk-4b2` (2 stage
`discovery`/`exploring` không thể tới được về mặt cấu trúc), phiên làm
việc liên tục đề xuất gộp các bước nhỏ lại cho gọn (vd gộp bước phân loại
`tier`/`kind`/`risk` vào stage `discovery`) — user chặn lại, chỉ ra một
bậc ưu tiên đã phát biểu nhiều lần từ những phiên làm việc đầu tiên
("từ những ngày đầu", đặc biệt xuyên suốt 3 ngày cuối tuần thảo luận
khái niệm launcher/dispatch/capacity dẫn tới `0026`/`0028`/
`0029`) nhưng chưa từng được ghi thành quyết định sản phẩm đứng riêng —
khiến câu hỏi "có nên gộp không" cứ lặp lại ở nhiều phiên khác nhau.

User chốt lại nguyên văn (2026-08-10):

> "số 1 của chúng ta là Ship Faster, cần phải thêm số 2 là `Release con
> người`. Giải phóng con người khỏi việc ngồi canh và chờ trả lời. Hệ
> thống tự phán đoán tự vận hành ở mức cao nhất có thể và khi thật sự cần
> người sẽ hỏi người, và vì thế nó sẽ thiết kế để collect thành bộ để hỏi
> nhằm mỗi lần con người quay lại là có thể trả lời nhiều nhất những câu
> hỏi và đi, sau đó sẽ quay lại chứ không cần ngồi canh. Vì thế mà hệ
> thống cần có cách hoạt động và tích lũy câu hỏi: chuyện gì làm được thì
> làm, không rõ thì bỏ qua làm mảnh việc khác, tích lũy đủ nhiều câu hỏi
> đợi con người quay lại — chứ không phải câu đó stuck và có những việc
> khác của cùng item có thể giải quyết được trước thì lại không giải
> quyết mà ngồi chờ câu trả lời. Vì vậy cần chia nhỏ tiến trình,
> process/stages/skills thật nhỏ và mịn."
> — real conversation, phiên `tsk-4b2`, 2026-08-10
```

### Full target unit

```text
#### Bối cảnh

`0025` chốt 3 bậc ưu tiên sản phẩm (Ship Faster > DoD > Polish Sau DoD),
nạp always-loaded qua `AGENTS.md`. Trong lúc điều tra `tsk-4b2` (2 stage
`discovery`/`exploring` không thể tới được về mặt cấu trúc), phiên làm
việc liên tục đề xuất gộp các bước nhỏ lại cho gọn (vd gộp bước phân loại
`tier`/`kind`/`risk` vào stage `discovery`) — user chặn lại, chỉ ra một
bậc ưu tiên đã phát biểu nhiều lần từ những phiên làm việc đầu tiên
("từ những ngày đầu", đặc biệt xuyên suốt 3 ngày cuối tuần thảo luận
khái niệm launcher/dispatch/capacity dẫn tới `0026`/`0028`/
`0029`) nhưng chưa từng được ghi thành quyết định sản phẩm đứng riêng —
khiến câu hỏi "có nên gộp không" cứ lặp lại ở nhiều phiên khác nhau.

User chốt lại nguyên văn (2026-08-10):

> "số 1 của chúng ta là Ship Faster, cần phải thêm số 2 là `Release con
> người`. Giải phóng con người khỏi việc ngồi canh và chờ trả lời. Hệ
> thống tự phán đoán tự vận hành ở mức cao nhất có thể và khi thật sự cần
> người sẽ hỏi người, và vì thế nó sẽ thiết kế để collect thành bộ để hỏi
> nhằm mỗi lần con người quay lại là có thể trả lời nhiều nhất những câu
> hỏi và đi, sau đó sẽ quay lại chứ không cần ngồi canh. Vì thế mà hệ
> thống cần có cách hoạt động và tích lũy câu hỏi: chuyện gì làm được thì
> làm, không rõ thì bỏ qua làm mảnh việc khác, tích lũy đủ nhiều câu hỏi
> đợi con người quay lại — chứ không phải câu đó stuck và có những việc
> khác của cùng item có thể giải quyết được trước thì lại không giải
> quyết mà ngồi chờ câu trả lời. Vì vậy cần chia nhỏ tiến trình,
> process/stages/skills thật nhỏ và mịn."
> — real conversation, phiên `tsk-4b2`, 2026-08-10
```

### Full diff

```diff
No text difference.
```

## claim_de9f2115601610beaba1b1172b3d6c34

Source digest: f82737a42a7e9cc86a88a7f2a568b61a603248952a79c27571d5ce7f42f0ff54

Target digest: f82737a42a7e9cc86a88a7f2a568b61a603248952a79c27571d5ce7f42f0ff54

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-252",
  "sourceLines": [
    2509,
    2518
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-111",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_31d7e6a08e4d605ae0ea9e9626b32e84",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_de9f2115601610beaba1b1172b3d6c34",
    "sourceUnitDigest": "f82737a42a7e9cc86a88a7f2a568b61a603248952a79c27571d5ce7f42f0ff54",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-111",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-252 (lines 2509–2518) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-111. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f82737a42a7e9cc86a88a7f2a568b61a603248952a79c27571d5ce7f42f0ff54",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
`0025` chốt 3 bậc ưu tiên sản phẩm (Ship Faster > DoD > Polish Sau DoD),
nạp always-loaded qua `AGENTS.md`. Trong lúc điều tra `tsk-4b2` (2 stage
`discovery`/`exploring` không thể tới được về mặt cấu trúc), phiên làm
việc liên tục đề xuất gộp các bước nhỏ lại cho gọn (vd gộp bước phân loại
`tier`/`kind`/`risk` vào stage `discovery`) — user chặn lại, chỉ ra một
bậc ưu tiên đã phát biểu nhiều lần từ những phiên làm việc đầu tiên
("từ những ngày đầu", đặc biệt xuyên suốt 3 ngày cuối tuần thảo luận
khái niệm launcher/dispatch/capacity dẫn tới `0026`/`0028`/
`0029`) nhưng chưa từng được ghi thành quyết định sản phẩm đứng riêng —
khiến câu hỏi "có nên gộp không" cứ lặp lại ở nhiều phiên khác nhau.
```

### Full target unit

```text
`0025` chốt 3 bậc ưu tiên sản phẩm (Ship Faster > DoD > Polish Sau DoD),
nạp always-loaded qua `AGENTS.md`. Trong lúc điều tra `tsk-4b2` (2 stage
`discovery`/`exploring` không thể tới được về mặt cấu trúc), phiên làm
việc liên tục đề xuất gộp các bước nhỏ lại cho gọn (vd gộp bước phân loại
`tier`/`kind`/`risk` vào stage `discovery`) — user chặn lại, chỉ ra một
bậc ưu tiên đã phát biểu nhiều lần từ những phiên làm việc đầu tiên
("từ những ngày đầu", đặc biệt xuyên suốt 3 ngày cuối tuần thảo luận
khái niệm launcher/dispatch/capacity dẫn tới `0026`/`0028`/
`0029`) nhưng chưa từng được ghi thành quyết định sản phẩm đứng riêng —
khiến câu hỏi "có nên gộp không" cứ lặp lại ở nhiều phiên khác nhau.
```

### Full diff

```diff
No text difference.
```

## claim_d037320c97e280df0bf48962fe947937

Source digest: 900143e3cdd2f69732d88d0191a7b1d75bf709264ffcd4d97ede833f867f622b

Target digest: 900143e3cdd2f69732d88d0191a7b1d75bf709264ffcd4d97ede833f867f622b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-253",
  "sourceLines": [
    2520,
    2520
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-112",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_8cd326802ae743d18b29693091d8e8db",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d037320c97e280df0bf48962fe947937",
    "sourceUnitDigest": "900143e3cdd2f69732d88d0191a7b1d75bf709264ffcd4d97ede833f867f622b",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-112",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole unheaded-block docs/specs/runner.md#unheaded-block-253 (lines 2520–2520) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-112. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "900143e3cdd2f69732d88d0191a7b1d75bf709264ffcd4d97ede833f867f622b",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
User chốt lại nguyên văn (2026-08-10):
```

### Full target unit

```text
User chốt lại nguyên văn (2026-08-10):
```

### Full diff

```diff
No text difference.
```

## claim_eee179f30e93a2a9660545defe15d6f6

Source digest: 0a3c70f839a15d101b9aeae5059ac4e6dbd48dd1b903183e80e88325d338e417

Target digest: 0a3c70f839a15d101b9aeae5059ac4e6dbd48dd1b903183e80e88325d338e417

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-254",
  "sourceLines": [
    2522,
    2534
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-113",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_4789aa1d1c073d38ec4f1694fa290e9b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-10",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_eee179f30e93a2a9660545defe15d6f6",
    "sourceUnitDigest": "0a3c70f839a15d101b9aeae5059ac4e6dbd48dd1b903183e80e88325d338e417",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-113",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-254 (lines 2522–2534) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-113. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0a3c70f839a15d101b9aeae5059ac4e6dbd48dd1b903183e80e88325d338e417",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
> "số 1 của chúng ta là Ship Faster, cần phải thêm số 2 là `Release con
> người`. Giải phóng con người khỏi việc ngồi canh và chờ trả lời. Hệ
> thống tự phán đoán tự vận hành ở mức cao nhất có thể và khi thật sự cần
> người sẽ hỏi người, và vì thế nó sẽ thiết kế để collect thành bộ để hỏi
> nhằm mỗi lần con người quay lại là có thể trả lời nhiều nhất những câu
> hỏi và đi, sau đó sẽ quay lại chứ không cần ngồi canh. Vì thế mà hệ
> thống cần có cách hoạt động và tích lũy câu hỏi: chuyện gì làm được thì
> làm, không rõ thì bỏ qua làm mảnh việc khác, tích lũy đủ nhiều câu hỏi
> đợi con người quay lại — chứ không phải câu đó stuck và có những việc
> khác của cùng item có thể giải quyết được trước thì lại không giải
> quyết mà ngồi chờ câu trả lời. Vì vậy cần chia nhỏ tiến trình,
> process/stages/skills thật nhỏ và mịn."
> — real conversation, phiên `tsk-4b2`, 2026-08-10
```

### Full target unit

```text
> "số 1 của chúng ta là Ship Faster, cần phải thêm số 2 là `Release con
> người`. Giải phóng con người khỏi việc ngồi canh và chờ trả lời. Hệ
> thống tự phán đoán tự vận hành ở mức cao nhất có thể và khi thật sự cần
> người sẽ hỏi người, và vì thế nó sẽ thiết kế để collect thành bộ để hỏi
> nhằm mỗi lần con người quay lại là có thể trả lời nhiều nhất những câu
> hỏi và đi, sau đó sẽ quay lại chứ không cần ngồi canh. Vì thế mà hệ
> thống cần có cách hoạt động và tích lũy câu hỏi: chuyện gì làm được thì
> làm, không rõ thì bỏ qua làm mảnh việc khác, tích lũy đủ nhiều câu hỏi
> đợi con người quay lại — chứ không phải câu đó stuck và có những việc
> khác của cùng item có thể giải quyết được trước thì lại không giải
> quyết mà ngồi chờ câu trả lời. Vì vậy cần chia nhỏ tiến trình,
> process/stages/skills thật nhỏ và mịn."
> — real conversation, phiên `tsk-4b2`, 2026-08-10
```

### Full diff

```diff
No text difference.
```

## claim_fd76a88f32041021be905c2f4380324f

Source digest: d4d6ff311ac72b18d05f94392218e60335e9242e5e10ddd7ab10b74588fd8506

Target digest: d4d6ff311ac72b18d05f94392218e60335e9242e5e10ddd7ab10b74588fd8506

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-8",
  "sourceLines": [
    2536,
    2536
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-8",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm"
  ],
  "nativeTargetClaimId": "claim_8d032272a1a2f87fb482a991d729b9c9",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-8",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_fd76a88f32041021be905c2f4380324f",
    "sourceUnitDigest": "d4d6ff311ac72b18d05f94392218e60335e9242e5e10ddd7ab10b74588fd8506",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-8",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-8 (lines 2536–2536) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-8. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d4d6ff311ac72b18d05f94392218e60335e9242e5e10ddd7ab10b74588fd8506",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Thứ tự ưu tiên sản phẩm, mở rộng từ 3 lên **4 bậc cố định** — bậc dưới
không được ghi đè bậc trên:

1. **Ship Faster** — giao nhanh hơn, không đoán mò, giảm
   friction/better-dev-ux, ít chờ đợi. (nguyên văn `0025`, không đổi)
2. **Release con người** — giải phóng con người khỏi việc ngồi canh chờ
   trả lời. Hệ thống tự phán đoán, tự vận hành ở mức cao nhất có thể; chỉ
   hỏi người khi thật sự cần, và khi hỏi thì **collect thành bộ** — để mỗi
   lần con người quay lại có thể trả lời nhiều nhất số câu hỏi đang treo
   rồi đi tiếp, không phải ngồi canh từng câu một. Hệ quả kỹ thuật bắt
   buộc: một câu hỏi treo **không được** làm nghẽn toàn bộ item khi còn
   phần việc khác của CÙNG item có thể tiến tới mà không cần câu trả lời
   đó — process/stage/skill vì vậy phải chia **nhỏ và mịn**, mỗi mảnh tiến
   hoặc park độc lập, thay vì gộp thành đơn vị to, thô.
3. **DoD** — reproducibly verifiable result + evidence-linked
   documentation. (nguyên văn `0025`, không đổi, lùi từ bậc 2 xuống bậc 3)
4. **Polish Sau DoD** — hoàn thiện sau ngưỡng, không mở scope. (nguyên văn
   `0025`, không đổi, lùi từ bậc 3 xuống bậc 4)

Placement test giữ nguyên như `0025` đã áp (họ hàng luật L8,
`docs/platform-foundations.md`): thứ tự ưu tiên áp dụng MỌI lúc, không
riêng 1 workflow → phải nằm standing sheet (`AGENTS.md`, always-loaded),
không phải chỉ nằm `docs/decisions/`.
```

### Full target unit

```text
#### Quyết định

Thứ tự ưu tiên sản phẩm, mở rộng từ 3 lên **4 bậc cố định** — bậc dưới
không được ghi đè bậc trên:

1. **Ship Faster** — giao nhanh hơn, không đoán mò, giảm
   friction/better-dev-ux, ít chờ đợi. (nguyên văn `0025`, không đổi)
2. **Release con người** — giải phóng con người khỏi việc ngồi canh chờ
   trả lời. Hệ thống tự phán đoán, tự vận hành ở mức cao nhất có thể; chỉ
   hỏi người khi thật sự cần, và khi hỏi thì **collect thành bộ** — để mỗi
   lần con người quay lại có thể trả lời nhiều nhất số câu hỏi đang treo
   rồi đi tiếp, không phải ngồi canh từng câu một. Hệ quả kỹ thuật bắt
   buộc: một câu hỏi treo **không được** làm nghẽn toàn bộ item khi còn
   phần việc khác của CÙNG item có thể tiến tới mà không cần câu trả lời
   đó — process/stage/skill vì vậy phải chia **nhỏ và mịn**, mỗi mảnh tiến
   hoặc park độc lập, thay vì gộp thành đơn vị to, thô.
3. **DoD** — reproducibly verifiable result + evidence-linked
   documentation. (nguyên văn `0025`, không đổi, lùi từ bậc 2 xuống bậc 3)
4. **Polish Sau DoD** — hoàn thiện sau ngưỡng, không mở scope. (nguyên văn
   `0025`, không đổi, lùi từ bậc 3 xuống bậc 4)

Placement test giữ nguyên như `0025` đã áp (họ hàng luật L8,
`docs/platform-foundations.md`): thứ tự ưu tiên áp dụng MỌI lúc, không
riêng 1 workflow → phải nằm standing sheet (`AGENTS.md`, always-loaded),
không phải chỉ nằm `docs/decisions/`.
```

### Full diff

```diff
No text difference.
```

## claim_fee74f474cff0dbcb09b8ff1a03ca23a

Source digest: 0bb855baa361591b42d7ad4942487e08e51ba6390ce9e7a6ce88b78676d163e6

Target digest: 0bb855baa361591b42d7ad4942487e08e51ba6390ce9e7a6ce88b78676d163e6

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-255",
  "sourceLines": [
    2538,
    2539
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-114",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_2d9b2022102b559e782eda9ed2875d16",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-8",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_fee74f474cff0dbcb09b8ff1a03ca23a",
    "sourceUnitDigest": "0bb855baa361591b42d7ad4942487e08e51ba6390ce9e7a6ce88b78676d163e6",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-114",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-255 (lines 2538–2539) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-114. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0bb855baa361591b42d7ad4942487e08e51ba6390ce9e7a6ce88b78676d163e6",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Thứ tự ưu tiên sản phẩm, mở rộng từ 3 lên **4 bậc cố định** — bậc dưới
không được ghi đè bậc trên:
```

### Full target unit

```text
Thứ tự ưu tiên sản phẩm, mở rộng từ 3 lên **4 bậc cố định** — bậc dưới
không được ghi đè bậc trên:
```

### Full diff

```diff
No text difference.
```

## claim_b673bf5f4bf691ef7008e7adbf58b1d1

Source digest: 031953560843bf034314fb3364c34aa490e147b56b7f9ae7525a910d33ea9658

Target digest: 031953560843bf034314fb3364c34aa490e147b56b7f9ae7525a910d33ea9658

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-256",
  "sourceLines": [
    2541,
    2555
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-115",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_5fae7fb07dbf387a2ff38b9ce64648a2",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-8",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b673bf5f4bf691ef7008e7adbf58b1d1",
    "sourceUnitDigest": "031953560843bf034314fb3364c34aa490e147b56b7f9ae7525a910d33ea9658",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-115",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-256 (lines 2541–2555) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-115. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "031953560843bf034314fb3364c34aa490e147b56b7f9ae7525a910d33ea9658",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
1. **Ship Faster** — giao nhanh hơn, không đoán mò, giảm
   friction/better-dev-ux, ít chờ đợi. (nguyên văn `0025`, không đổi)
2. **Release con người** — giải phóng con người khỏi việc ngồi canh chờ
   trả lời. Hệ thống tự phán đoán, tự vận hành ở mức cao nhất có thể; chỉ
   hỏi người khi thật sự cần, và khi hỏi thì **collect thành bộ** — để mỗi
   lần con người quay lại có thể trả lời nhiều nhất số câu hỏi đang treo
   rồi đi tiếp, không phải ngồi canh từng câu một. Hệ quả kỹ thuật bắt
   buộc: một câu hỏi treo **không được** làm nghẽn toàn bộ item khi còn
   phần việc khác của CÙNG item có thể tiến tới mà không cần câu trả lời
   đó — process/stage/skill vì vậy phải chia **nhỏ và mịn**, mỗi mảnh tiến
   hoặc park độc lập, thay vì gộp thành đơn vị to, thô.
3. **DoD** — reproducibly verifiable result + evidence-linked
   documentation. (nguyên văn `0025`, không đổi, lùi từ bậc 2 xuống bậc 3)
4. **Polish Sau DoD** — hoàn thiện sau ngưỡng, không mở scope. (nguyên văn
   `0025`, không đổi, lùi từ bậc 3 xuống bậc 4)
```

### Full target unit

```text
1. **Ship Faster** — giao nhanh hơn, không đoán mò, giảm
   friction/better-dev-ux, ít chờ đợi. (nguyên văn `0025`, không đổi)
2. **Release con người** — giải phóng con người khỏi việc ngồi canh chờ
   trả lời. Hệ thống tự phán đoán, tự vận hành ở mức cao nhất có thể; chỉ
   hỏi người khi thật sự cần, và khi hỏi thì **collect thành bộ** — để mỗi
   lần con người quay lại có thể trả lời nhiều nhất số câu hỏi đang treo
   rồi đi tiếp, không phải ngồi canh từng câu một. Hệ quả kỹ thuật bắt
   buộc: một câu hỏi treo **không được** làm nghẽn toàn bộ item khi còn
   phần việc khác của CÙNG item có thể tiến tới mà không cần câu trả lời
   đó — process/stage/skill vì vậy phải chia **nhỏ và mịn**, mỗi mảnh tiến
   hoặc park độc lập, thay vì gộp thành đơn vị to, thô.
3. **DoD** — reproducibly verifiable result + evidence-linked
   documentation. (nguyên văn `0025`, không đổi, lùi từ bậc 2 xuống bậc 3)
4. **Polish Sau DoD** — hoàn thiện sau ngưỡng, không mở scope. (nguyên văn
   `0025`, không đổi, lùi từ bậc 3 xuống bậc 4)
```

### Full diff

```diff
No text difference.
```

## claim_bd64b6d78d76a976993bbba5f42f1c12

Source digest: 73387f76610844c04bc90401204e0195718f93480f2175f77600be80da1b3d87

Target digest: 73387f76610844c04bc90401204e0195718f93480f2175f77600be80da1b3d87

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-257",
  "sourceLines": [
    2557,
    2560
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-116",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_8b9c6c2c18fcbb06d9a9d0518d65d79e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-8",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_bd64b6d78d76a976993bbba5f42f1c12",
    "sourceUnitDigest": "73387f76610844c04bc90401204e0195718f93480f2175f77600be80da1b3d87",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-116",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-257 (lines 2557–2560) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-116. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "73387f76610844c04bc90401204e0195718f93480f2175f77600be80da1b3d87",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Placement test giữ nguyên như `0025` đã áp (họ hàng luật L8,
`docs/platform-foundations.md`): thứ tự ưu tiên áp dụng MỌI lúc, không
riêng 1 workflow → phải nằm standing sheet (`AGENTS.md`, always-loaded),
không phải chỉ nằm `docs/decisions/`.
```

### Full target unit

```text
Placement test giữ nguyên như `0025` đã áp (họ hàng luật L8,
`docs/platform-foundations.md`): thứ tự ưu tiên áp dụng MỌI lúc, không
riêng 1 workflow → phải nằm standing sheet (`AGENTS.md`, always-loaded),
không phải chỉ nằm `docs/decisions/`.
```

### Full diff

```diff
No text difference.
```

## claim_08ee8d10e6e6426a684a03a41da86f1f

Source digest: 14e0aa722cef643382c26bad2388e9cc7bf76b7d52067c72502af1cb2804f9d6

Target digest: 14e0aa722cef643382c26bad2388e9cc7bf76b7d52067c72502af1cb2804f9d6

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả-8",
  "sourceLines": [
    2562,
    2562
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả-8",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm"
  ],
  "nativeTargetClaimId": "claim_c0277e16bff8ca8e94caf55a937069f4",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả-8",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_08ee8d10e6e6426a684a03a41da86f1f",
    "sourceUnitDigest": "14e0aa722cef643382c26bad2388e9cc7bf76b7d52067c72502af1cb2804f9d6",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả-8",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả-8 (lines 2562–2562) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả-8. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "14e0aa722cef643382c26bad2388e9cc7bf76b7d52067c72502af1cb2804f9d6",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- `0025` không sửa tại chỗ, chỉ nhận `superseded_by: 0030` (đúng khuôn
  STR72 trỏ-ngược-bắt-buộc, cùng cách `0023` → `0025` đã làm).
- `AGENTS.md`'s pointer 4 dòng cập nhật theo thứ tự mới, trỏ `docs/decisions/0030`.
- Bậc 2 mới này là căn cứ trực tiếp để `tsk-4b2` (wiring `discovery`/
  `exploring`) thiết kế theo hướng stage/skill chia nhỏ, mỗi mảnh
  park/tiến độc lập — không gộp bước phân loại `tier`/`kind`/`risk` vào
  `discovery` dù gộp có vẻ gọn hơn (YAGNI/DRY thuần code không áp được ở
  đây — bậc 2 này ghi đè trực tiếp bản năng "gộp cho gọn" khi thiết kế
  stage/skill của fgOS).
- Chưa làm ở record này (treo lại, không phải phạm vi hiện tại): một check
  tự động xác nhận `AGENTS.md` còn giữ đúng 4 mục theo thời gian (L8 rule
  3, cùng khoảng trống `0025` đã treo cho bậc cũ).
```

### Full target unit

```text
#### Hệ quả

- `0025` không sửa tại chỗ, chỉ nhận `superseded_by: 0030` (đúng khuôn
  STR72 trỏ-ngược-bắt-buộc, cùng cách `0023` → `0025` đã làm).
- `AGENTS.md`'s pointer 4 dòng cập nhật theo thứ tự mới, trỏ `docs/decisions/0030`.
- Bậc 2 mới này là căn cứ trực tiếp để `tsk-4b2` (wiring `discovery`/
  `exploring`) thiết kế theo hướng stage/skill chia nhỏ, mỗi mảnh
  park/tiến độc lập — không gộp bước phân loại `tier`/`kind`/`risk` vào
  `discovery` dù gộp có vẻ gọn hơn (YAGNI/DRY thuần code không áp được ở
  đây — bậc 2 này ghi đè trực tiếp bản năng "gộp cho gọn" khi thiết kế
  stage/skill của fgOS).
- Chưa làm ở record này (treo lại, không phải phạm vi hiện tại): một check
  tự động xác nhận `AGENTS.md` còn giữ đúng 4 mục theo thời gian (L8 rule
  3, cùng khoảng trống `0025` đã treo cho bậc cũ).
```

### Full diff

```diff
No text difference.
```

## claim_d79865d7e7b13902620c8ece3ab816a3

Source digest: 6de2664043f532b03987c8fbdaff3e0616d236b9c01866d8154731d14f7646c9

Target digest: 6de2664043f532b03987c8fbdaff3e0616d236b9c01866d8154731d14f7646c9

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-258",
  "sourceLines": [
    2564,
    2575
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-117",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_66a9a03ad00ad00d3873c25a22cbc54e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả-8",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d79865d7e7b13902620c8ece3ab816a3",
    "sourceUnitDigest": "6de2664043f532b03987c8fbdaff3e0616d236b9c01866d8154731d14f7646c9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-117",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-258 (lines 2564–2575) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-117. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6de2664043f532b03987c8fbdaff3e0616d236b9c01866d8154731d14f7646c9",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
- `0025` không sửa tại chỗ, chỉ nhận `superseded_by: 0030` (đúng khuôn
  STR72 trỏ-ngược-bắt-buộc, cùng cách `0023` → `0025` đã làm).
- `AGENTS.md`'s pointer 4 dòng cập nhật theo thứ tự mới, trỏ `docs/decisions/0030`.
- Bậc 2 mới này là căn cứ trực tiếp để `tsk-4b2` (wiring `discovery`/
  `exploring`) thiết kế theo hướng stage/skill chia nhỏ, mỗi mảnh
  park/tiến độc lập — không gộp bước phân loại `tier`/`kind`/`risk` vào
  `discovery` dù gộp có vẻ gọn hơn (YAGNI/DRY thuần code không áp được ở
  đây — bậc 2 này ghi đè trực tiếp bản năng "gộp cho gọn" khi thiết kế
  stage/skill của fgOS).
- Chưa làm ở record này (treo lại, không phải phạm vi hiện tại): một check
  tự động xác nhận `AGENTS.md` còn giữ đúng 4 mục theo thời gian (L8 rule
  3, cùng khoảng trống `0025` đã treo cho bậc cũ).
```

### Full target unit

```text
- `0025` không sửa tại chỗ, chỉ nhận `superseded_by: 0030` (đúng khuôn
  STR72 trỏ-ngược-bắt-buộc, cùng cách `0023` → `0025` đã làm).
- `AGENTS.md`'s pointer 4 dòng cập nhật theo thứ tự mới, trỏ `docs/decisions/0030`.
- Bậc 2 mới này là căn cứ trực tiếp để `tsk-4b2` (wiring `discovery`/
  `exploring`) thiết kế theo hướng stage/skill chia nhỏ, mỗi mảnh
  park/tiến độc lập — không gộp bước phân loại `tier`/`kind`/`risk` vào
  `discovery` dù gộp có vẻ gọn hơn (YAGNI/DRY thuần code không áp được ở
  đây — bậc 2 này ghi đè trực tiếp bản năng "gộp cho gọn" khi thiết kế
  stage/skill của fgOS).
- Chưa làm ở record này (treo lại, không phải phạm vi hiện tại): một check
  tự động xác nhận `AGENTS.md` còn giữ đúng 4 mục theo thời gian (L8 rule
  3, cùng khoảng trống `0025` đã treo cho bậc cũ).
```

### Full diff

```diff
No text difference.
```

## claim_e85cb1459d8e0fc199c75abec6e29f13

Source digest: 0e40c4bec2d4c007a8ad19cda638c3a3bfc1c4866c8ca1c5ab81526c001a12dd

Target digest: 0e40c4bec2d4c007a8ad19cda638c3a3bfc1c4866c8ca1c5ab81526c001a12dd

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0031-bỏ-guard-cấm-từ-orchestrator-sau-khi-0029-đã-gán-nghĩa-mới",
  "sourceLines": [
    2577,
    2577
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0031-bỏ-guard-cấm-từ-orchestrator-sau-khi-0029-đã-gán-nghĩa-mới",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_44ad0c91b4d2cc3de5eb195f9bc942d3",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0031-bỏ-guard-cấm-từ-orchestrator-sau-khi-0029-đã-gán-nghĩa-mới",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e85cb1459d8e0fc199c75abec6e29f13",
    "sourceUnitDigest": "0e40c4bec2d4c007a8ad19cda638c3a3bfc1c4866c8ca1c5ab81526c001a12dd",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0031-bỏ-guard-cấm-từ-orchestrator-sau-khi-0029-đã-gán-nghĩa-mới",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0031-bỏ-guard-cấm-từ-orchestrator-sau-khi-0029-đã-gán-nghĩa-mới (lines 2577–2577) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0031-bỏ-guard-cấm-từ-orchestrator-sau-khi-0029-đã-gán-nghĩa-mới. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0e40c4bec2d4c007a8ad19cda638c3a3bfc1c4866c8ca1c5ab81526c001a12dd",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới
```

### Full target unit

```text
### 0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới
```

### Full diff

```diff
No text difference.
```

## claim_05afdb7e532066f2333782f0e57421a8

Source digest: 357a2a344123089446a3a10e192e9d89e9b224d4ded3e0b8366bb07d00e9ef9e

Target digest: 357a2a344123089446a3a10e192e9d89e9b224d4ded3e0b8366bb07d00e9ef9e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-11",
  "sourceLines": [
    2579,
    2579
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-11",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
  ],
  "nativeTargetClaimId": "claim_1d47c2d909e3802e7a88a8a8ff2b1eed",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-11",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_05afdb7e532066f2333782f0e57421a8",
    "sourceUnitDigest": "357a2a344123089446a3a10e192e9d89e9b224d4ded3e0b8366bb07d00e9ef9e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-11",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-11 (lines 2579–2579) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-11. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "357a2a344123089446a3a10e192e9d89e9b224d4ded3e0b8366bb07d00e9ef9e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

`0028` đổi tên pinned term `orchestrator` → `launcher` cho vai trò `0026` mô
tả (chọn 1 item, đứng nó lên, bước ra hẳn), vì tên cũ sai nghĩa ngành. Cùng
record đó ghi rõ từ vừa giải phóng:

> Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác,
> **CHƯA gán nghĩa trong record này** — ứng viên đã bàn (chưa chốt): tầng
> điều phối N đơn vị chạy đồng thời + hợp nhất kết quả.

Và dựng một anti-recidivism guard (`test/docs/launcher-vocabulary-guard.
test.mjs`) fail khi từ đó xuất hiện trong prose fgOS tự sở hữu ngoài
allowlist. Guard đó đúng **trong đúng cửa sổ thời gian ấy**: từ chưa có
nghĩa mới, nên mọi lần nó tái xuất đều là tái phạm nghĩa cũ.

Cửa sổ ấy đã đóng. `0029` điền vào đúng chỗ trống `0028` để lại:

> Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
> (N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
> hợp thành T0** [...] Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích
> thứ hai của "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp
> thành T0.

Từ thời điểm `0029` được chấp nhận, `orchestrator` là **từ vựng fgOS hợp lệ,
đã được định nghĩa chính thức**, chỉ tầng hợp thành T0 (N đơn vị, ở lại) —
đúng thứ `/fgOS:retro-loop`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
`/fgOS:cleanup-loop` và `fgos-fanout` đang làm. Guard của `0028` vẫn chặn nó,
nên nó đang cấm fgOS dùng chính từ vựng fgOS vừa chốt.
```

### Full target unit

```text
#### Bối cảnh

`0028` đổi tên pinned term `orchestrator` → `launcher` cho vai trò `0026` mô
tả (chọn 1 item, đứng nó lên, bước ra hẳn), vì tên cũ sai nghĩa ngành. Cùng
record đó ghi rõ từ vừa giải phóng:

> Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác,
> **CHƯA gán nghĩa trong record này** — ứng viên đã bàn (chưa chốt): tầng
> điều phối N đơn vị chạy đồng thời + hợp nhất kết quả.

Và dựng một anti-recidivism guard (`test/docs/launcher-vocabulary-guard.
test.mjs`) fail khi từ đó xuất hiện trong prose fgOS tự sở hữu ngoài
allowlist. Guard đó đúng **trong đúng cửa sổ thời gian ấy**: từ chưa có
nghĩa mới, nên mọi lần nó tái xuất đều là tái phạm nghĩa cũ.

Cửa sổ ấy đã đóng. `0029` điền vào đúng chỗ trống `0028` để lại:

> Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
> (N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
> hợp thành T0** [...] Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích
> thứ hai của "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp
> thành T0.

Từ thời điểm `0029` được chấp nhận, `orchestrator` là **từ vựng fgOS hợp lệ,
đã được định nghĩa chính thức**, chỉ tầng hợp thành T0 (N đơn vị, ở lại) —
đúng thứ `/fgOS:retro-loop`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
`/fgOS:cleanup-loop` và `fgos-fanout` đang làm. Guard của `0028` vẫn chặn nó,
nên nó đang cấm fgOS dùng chính từ vựng fgOS vừa chốt.
```

### Full diff

```diff
No text difference.
```

## claim_feb66ccdf7eff1256407a48054055b49

Source digest: 2a1b4f2e14735da2d97f78690d71f71d9118ac015d917646ad86624b167a4fa4

Target digest: 2a1b4f2e14735da2d97f78690d71f71d9118ac015d917646ad86624b167a4fa4

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-259",
  "sourceLines": [
    2581,
    2583
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-118",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_51968abdd2c9a4dac0b471bd684b10de",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-11",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_feb66ccdf7eff1256407a48054055b49",
    "sourceUnitDigest": "2a1b4f2e14735da2d97f78690d71f71d9118ac015d917646ad86624b167a4fa4",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-118",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-259 (lines 2581–2583) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-118. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "2a1b4f2e14735da2d97f78690d71f71d9118ac015d917646ad86624b167a4fa4",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
`0028` đổi tên pinned term `orchestrator` → `launcher` cho vai trò `0026` mô
tả (chọn 1 item, đứng nó lên, bước ra hẳn), vì tên cũ sai nghĩa ngành. Cùng
record đó ghi rõ từ vừa giải phóng:
```

### Full target unit

```text
`0028` đổi tên pinned term `orchestrator` → `launcher` cho vai trò `0026` mô
tả (chọn 1 item, đứng nó lên, bước ra hẳn), vì tên cũ sai nghĩa ngành. Cùng
record đó ghi rõ từ vừa giải phóng:
```

### Full diff

```diff
No text difference.
```

## claim_5a80fe891f27a7ab4f94b9fd35ae2018

Source digest: 532d34771624a78748b3ee4055adda6bec2330e898cfa22d99d7c5e7ed5e0220

Target digest: 532d34771624a78748b3ee4055adda6bec2330e898cfa22d99d7c5e7ed5e0220

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-260",
  "sourceLines": [
    2585,
    2587
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-119",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_93f65dca04b2c82d7a7c246d52e2b4b9",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-11",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5a80fe891f27a7ab4f94b9fd35ae2018",
    "sourceUnitDigest": "532d34771624a78748b3ee4055adda6bec2330e898cfa22d99d7c5e7ed5e0220",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-119",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-260 (lines 2585–2587) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-119. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "532d34771624a78748b3ee4055adda6bec2330e898cfa22d99d7c5e7ed5e0220",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
> Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác,
> **CHƯA gán nghĩa trong record này** — ứng viên đã bàn (chưa chốt): tầng
> điều phối N đơn vị chạy đồng thời + hợp nhất kết quả.
```

### Full target unit

```text
> Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác,
> **CHƯA gán nghĩa trong record này** — ứng viên đã bàn (chưa chốt): tầng
> điều phối N đơn vị chạy đồng thời + hợp nhất kết quả.
```

### Full diff

```diff
No text difference.
```

## claim_10b11d3d877c23387208c845acffae69

Source digest: 0b858c1bf071884a25c82c92dfe0290f0087fd4790804dd450501ec0b7d2d9f2

Target digest: 0b858c1bf071884a25c82c92dfe0290f0087fd4790804dd450501ec0b7d2d9f2

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-261",
  "sourceLines": [
    2589,
    2592
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-120",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_ca6f81e2de0df6e94d77df454b97d8fb",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-11",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_10b11d3d877c23387208c845acffae69",
    "sourceUnitDigest": "0b858c1bf071884a25c82c92dfe0290f0087fd4790804dd450501ec0b7d2d9f2",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-120",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-261 (lines 2589–2592) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-120. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0b858c1bf071884a25c82c92dfe0290f0087fd4790804dd450501ec0b7d2d9f2",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Và dựng một anti-recidivism guard (`test/docs/launcher-vocabulary-guard.
test.mjs`) fail khi từ đó xuất hiện trong prose fgOS tự sở hữu ngoài
allowlist. Guard đó đúng **trong đúng cửa sổ thời gian ấy**: từ chưa có
nghĩa mới, nên mọi lần nó tái xuất đều là tái phạm nghĩa cũ.
```

### Full target unit

```text
Và dựng một anti-recidivism guard (`test/docs/launcher-vocabulary-guard.
test.mjs`) fail khi từ đó xuất hiện trong prose fgOS tự sở hữu ngoài
allowlist. Guard đó đúng **trong đúng cửa sổ thời gian ấy**: từ chưa có
nghĩa mới, nên mọi lần nó tái xuất đều là tái phạm nghĩa cũ.
```

### Full diff

```diff
No text difference.
```

## claim_589f9bb75bee7444773cddcfcf750805

Source digest: 720d5e1f4ce31eeaff3ac6c70971e182548b4270044ab781488e9765424968ff

Target digest: 720d5e1f4ce31eeaff3ac6c70971e182548b4270044ab781488e9765424968ff

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-262",
  "sourceLines": [
    2594,
    2594
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-121",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_47c5ac2ef116ef4dbd759045a06434f4",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-11",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_589f9bb75bee7444773cddcfcf750805",
    "sourceUnitDigest": "720d5e1f4ce31eeaff3ac6c70971e182548b4270044ab781488e9765424968ff",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-121",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-262 (lines 2594–2594) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-121. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "720d5e1f4ce31eeaff3ac6c70971e182548b4270044ab781488e9765424968ff",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Cửa sổ ấy đã đóng. `0029` điền vào đúng chỗ trống `0028` để lại:
```

### Full target unit

```text
Cửa sổ ấy đã đóng. `0029` điền vào đúng chỗ trống `0028` để lại:
```

### Full diff

```diff
No text difference.
```

## claim_3c6f58eaca41a1cd144aa77ee46bc054

Source digest: 5acae0ca7726fe23066fd0c6c86c51d33091b7c0e786048f849666ae306de498

Target digest: 5acae0ca7726fe23066fd0c6c86c51d33091b7c0e786048f849666ae306de498

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-263",
  "sourceLines": [
    2596,
    2600
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-122",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_cc859c12dd5890fda0988aa7b083a2e6",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-11",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3c6f58eaca41a1cd144aa77ee46bc054",
    "sourceUnitDigest": "5acae0ca7726fe23066fd0c6c86c51d33091b7c0e786048f849666ae306de498",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-122",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-263 (lines 2596–2600) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-122. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "5acae0ca7726fe23066fd0c6c86c51d33091b7c0e786048f849666ae306de498",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
> Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
> (N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
> hợp thành T0** [...] Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích
> thứ hai của "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp
> thành T0.
```

### Full target unit

```text
> Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
> (N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
> hợp thành T0** [...] Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích
> thứ hai của "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp
> thành T0.
```

### Full diff

```diff
No text difference.
```

## claim_b2c312de4aaa127d564cdfb6bcbee86c

Source digest: e11baa55cabce38a355bcb52a147e24f1d4b21a0d1004ab6d916e8679b813da0

Target digest: e11baa55cabce38a355bcb52a147e24f1d4b21a0d1004ab6d916e8679b813da0

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-264",
  "sourceLines": [
    2602,
    2606
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-123",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_0548838d4295880368080db47ddf4acb",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-11",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b2c312de4aaa127d564cdfb6bcbee86c",
    "sourceUnitDigest": "e11baa55cabce38a355bcb52a147e24f1d4b21a0d1004ab6d916e8679b813da0",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-123",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-264 (lines 2602–2606) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-123. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e11baa55cabce38a355bcb52a147e24f1d4b21a0d1004ab6d916e8679b813da0",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Từ thời điểm `0029` được chấp nhận, `orchestrator` là **từ vựng fgOS hợp lệ,
đã được định nghĩa chính thức**, chỉ tầng hợp thành T0 (N đơn vị, ở lại) —
đúng thứ `/fgOS:retro-loop`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
`/fgOS:cleanup-loop` và `fgos-fanout` đang làm. Guard của `0028` vẫn chặn nó,
nên nó đang cấm fgOS dùng chính từ vựng fgOS vừa chốt.
```

### Full target unit

```text
Từ thời điểm `0029` được chấp nhận, `orchestrator` là **từ vựng fgOS hợp lệ,
đã được định nghĩa chính thức**, chỉ tầng hợp thành T0 (N đơn vị, ở lại) —
đúng thứ `/fgOS:retro-loop`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
`/fgOS:cleanup-loop` và `fgos-fanout` đang làm. Guard của `0028` vẫn chặn nó,
nên nó đang cấm fgOS dùng chính từ vựng fgOS vừa chốt.
```

### Full diff

```diff
No text difference.
```

## claim_16c0859152da30723055fd61b63e1478

Source digest: ee4f9e8c3f3602f8e8533b425a457f3807c79f7dcac0a5f2a7c77d66d16cfe52

Target digest: ee4f9e8c3f3602f8e8533b425a457f3807c79f7dcac0a5f2a7c77d66d16cfe52

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-9",
  "sourceLines": [
    2608,
    2608
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-9",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
  ],
  "nativeTargetClaimId": "claim_9cf7886c0543571ca30b426a58bbf627",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_16c0859152da30723055fd61b63e1478",
    "sourceUnitDigest": "ee4f9e8c3f3602f8e8533b425a457f3807c79f7dcac0a5f2a7c77d66d16cfe52",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-9 (lines 2608–2608) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ee4f9e8c3f3602f8e8533b425a457f3807c79f7dcac0a5f2a7c77d66d16cfe52",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Bỏ hẳn guard cấm từ `orchestrator`: xoá
`test/docs/launcher-vocabulary-guard.test.mjs` và toàn bộ cơ chế allowlist
đi kèm.

Ba lý do, theo thứ tự sức nặng:

1. **Guard mâu thuẫn với `0029`.** Nó chặn một từ mà một decision record
   sau nó đã định nghĩa chính thức. Giữ nguyên nghĩa là để một record cũ
   phủ quyết một record mới hơn — ngược hẳn khuôn supersede của repo này.

2. **Guard là `grep` mức-từ, không phân biệt được nghĩa.** Giá trị còn lại
   duy nhất của nó là bắt người dùng `orchestrator` theo nghĩa CŨ (vai
   1-item). Một phép so khớp chuỗi không làm nổi việc đó: nó chặn nghĩa mới
   hợp lệ y hệt cách nó chặn nghĩa cũ sai. Không có cách thu hẹp nào giữ
   được phần giá trị thật.

3. **Chi phí bảo trì đã vượt giá trị, có bằng chứng đếm được.**
   `ALLOWED_FILES_ENTRIES` đã phình lên 28 entry, mỗi entry một lý do
   hand-written riêng, cộng 3 cơ chế miễn trừ theo pattern
   (`FROZEN_FILENAMES`, `FROZEN_PHRASES`, `IRON_LAW_EVIDENCE_META_CITATION`).
   Ít nhất bốn item đã sinh ra **chỉ để vá allowlist này** (`tsk-2au`,
   `tsk-2lg`, `tsk-2uo`, `tsk-4cx`). Chính `docs/decisions/0000-index.md`
   phải viết vòng vo *"tên gọi ban đầu của `0026`"* ở hai dòng thay vì gọi
   thẳng tên — guard đang bóp méo văn của chính fgOS.

Record này chỉ supersede **mệnh đề guard** trong "Hệ quả" của `0028`. Phần
chính của `0028` — việc đổi tên vai trò `0026` từ `orchestrator` thành
`launcher` — **giữ nguyên hiệu lực**: `launcher` vẫn là tên đúng cho vai (1
đơn vị, buông), và không chỗ nào được quay về dùng `orchestrator` cho nghĩa
đó. Cùng khuôn supersede-từng-phần mà `0028` và `0029` đã dùng với `0026`
(hai phần không chồng lấn).
```

### Full target unit

```text
#### Quyết định

Bỏ hẳn guard cấm từ `orchestrator`: xoá
`test/docs/launcher-vocabulary-guard.test.mjs` và toàn bộ cơ chế allowlist
đi kèm.

Ba lý do, theo thứ tự sức nặng:

1. **Guard mâu thuẫn với `0029`.** Nó chặn một từ mà một decision record
   sau nó đã định nghĩa chính thức. Giữ nguyên nghĩa là để một record cũ
   phủ quyết một record mới hơn — ngược hẳn khuôn supersede của repo này.

2. **Guard là `grep` mức-từ, không phân biệt được nghĩa.** Giá trị còn lại
   duy nhất của nó là bắt người dùng `orchestrator` theo nghĩa CŨ (vai
   1-item). Một phép so khớp chuỗi không làm nổi việc đó: nó chặn nghĩa mới
   hợp lệ y hệt cách nó chặn nghĩa cũ sai. Không có cách thu hẹp nào giữ
   được phần giá trị thật.

3. **Chi phí bảo trì đã vượt giá trị, có bằng chứng đếm được.**
   `ALLOWED_FILES_ENTRIES` đã phình lên 28 entry, mỗi entry một lý do
   hand-written riêng, cộng 3 cơ chế miễn trừ theo pattern
   (`FROZEN_FILENAMES`, `FROZEN_PHRASES`, `IRON_LAW_EVIDENCE_META_CITATION`).
   Ít nhất bốn item đã sinh ra **chỉ để vá allowlist này** (`tsk-2au`,
   `tsk-2lg`, `tsk-2uo`, `tsk-4cx`). Chính `docs/decisions/0000-index.md`
   phải viết vòng vo *"tên gọi ban đầu của `0026`"* ở hai dòng thay vì gọi
   thẳng tên — guard đang bóp méo văn của chính fgOS.

Record này chỉ supersede **mệnh đề guard** trong "Hệ quả" của `0028`. Phần
chính của `0028` — việc đổi tên vai trò `0026` từ `orchestrator` thành
`launcher` — **giữ nguyên hiệu lực**: `launcher` vẫn là tên đúng cho vai (1
đơn vị, buông), và không chỗ nào được quay về dùng `orchestrator` cho nghĩa
đó. Cùng khuôn supersede-từng-phần mà `0028` và `0029` đã dùng với `0026`
(hai phần không chồng lấn).
```

### Full diff

```diff
No text difference.
```

## claim_94717cd095680643f25ecb6ab0460b09

Source digest: 6c6d3cadec8df4b4b1523d40cda5493165625ed38afa8a34bfcffb7043752486

Target digest: 6c6d3cadec8df4b4b1523d40cda5493165625ed38afa8a34bfcffb7043752486

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-265",
  "sourceLines": [
    2610,
    2612
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-124",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_fdb8120052d83bbb813ae389a450cb78",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_94717cd095680643f25ecb6ab0460b09",
    "sourceUnitDigest": "6c6d3cadec8df4b4b1523d40cda5493165625ed38afa8a34bfcffb7043752486",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-124",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-265 (lines 2610–2612) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-124. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6c6d3cadec8df4b4b1523d40cda5493165625ed38afa8a34bfcffb7043752486",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Bỏ hẳn guard cấm từ `orchestrator`: xoá
`test/docs/launcher-vocabulary-guard.test.mjs` và toàn bộ cơ chế allowlist
đi kèm.
```

### Full target unit

```text
Bỏ hẳn guard cấm từ `orchestrator`: xoá
`test/docs/launcher-vocabulary-guard.test.mjs` và toàn bộ cơ chế allowlist
đi kèm.
```

### Full diff

```diff
No text difference.
```

## claim_bccac29e4e55c7682b4aacfa49c3d959

Source digest: fb8dc826fff9536960a4c2132049e8bafcf785f5a3f037b9e127d630837e4088

Target digest: fb8dc826fff9536960a4c2132049e8bafcf785f5a3f037b9e127d630837e4088

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-266",
  "sourceLines": [
    2614,
    2614
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-125",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_f37cec102562f341aa91e158bdcb7029",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_bccac29e4e55c7682b4aacfa49c3d959",
    "sourceUnitDigest": "fb8dc826fff9536960a4c2132049e8bafcf785f5a3f037b9e127d630837e4088",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-125",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole unheaded-block docs/specs/runner.md#unheaded-block-266 (lines 2614–2614) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-125. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "fb8dc826fff9536960a4c2132049e8bafcf785f5a3f037b9e127d630837e4088",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Ba lý do, theo thứ tự sức nặng:
```

### Full target unit

```text
Ba lý do, theo thứ tự sức nặng:
```

### Full diff

```diff
No text difference.
```

## claim_6ec2943998da202bf962ac4ea68efb14

Source digest: 6f877bd5666c3ce645fe63ee3276b428c005b5b0a3822cf945fda3079d5385ac

Target digest: 6f877bd5666c3ce645fe63ee3276b428c005b5b0a3822cf945fda3079d5385ac

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-267",
  "sourceLines": [
    2616,
    2618
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-126",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_c480602f5a361a0408ec726871d53d38",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6ec2943998da202bf962ac4ea68efb14",
    "sourceUnitDigest": "6f877bd5666c3ce645fe63ee3276b428c005b5b0a3822cf945fda3079d5385ac",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-126",
    "claimKind": "decision",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-267 (lines 2616–2618) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-126. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6f877bd5666c3ce645fe63ee3276b428c005b5b0a3822cf945fda3079d5385ac",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
1. **Guard mâu thuẫn với `0029`.** Nó chặn một từ mà một decision record
   sau nó đã định nghĩa chính thức. Giữ nguyên nghĩa là để một record cũ
   phủ quyết một record mới hơn — ngược hẳn khuôn supersede của repo này.
```

### Full target unit

```text
1. **Guard mâu thuẫn với `0029`.** Nó chặn một từ mà một decision record
   sau nó đã định nghĩa chính thức. Giữ nguyên nghĩa là để một record cũ
   phủ quyết một record mới hơn — ngược hẳn khuôn supersede của repo này.
```

### Full diff

```diff
No text difference.
```

## claim_b5f162038c4694edfd464bed7142a0de

Source digest: 6ac36593b477df83e4034ef378167898101c5aec5cdef94071d9cf580a728b70

Target digest: 6ac36593b477df83e4034ef378167898101c5aec5cdef94071d9cf580a728b70

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-268",
  "sourceLines": [
    2620,
    2624
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-127",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_32ccc686c581566f4441ef6024b23732",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b5f162038c4694edfd464bed7142a0de",
    "sourceUnitDigest": "6ac36593b477df83e4034ef378167898101c5aec5cdef94071d9cf580a728b70",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-127",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-268 (lines 2620–2624) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-127. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6ac36593b477df83e4034ef378167898101c5aec5cdef94071d9cf580a728b70",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
2. **Guard là `grep` mức-từ, không phân biệt được nghĩa.** Giá trị còn lại
   duy nhất của nó là bắt người dùng `orchestrator` theo nghĩa CŨ (vai
   1-item). Một phép so khớp chuỗi không làm nổi việc đó: nó chặn nghĩa mới
   hợp lệ y hệt cách nó chặn nghĩa cũ sai. Không có cách thu hẹp nào giữ
   được phần giá trị thật.
```

### Full target unit

```text
2. **Guard là `grep` mức-từ, không phân biệt được nghĩa.** Giá trị còn lại
   duy nhất của nó là bắt người dùng `orchestrator` theo nghĩa CŨ (vai
   1-item). Một phép so khớp chuỗi không làm nổi việc đó: nó chặn nghĩa mới
   hợp lệ y hệt cách nó chặn nghĩa cũ sai. Không có cách thu hẹp nào giữ
   được phần giá trị thật.
```

### Full diff

```diff
No text difference.
```

## claim_8813e4af883bd066590c26354712c496

Source digest: 7383aaf91951994e9cd7d516b789b9d8f85f3820966f14a1f62bf218873c9774

Target digest: 7383aaf91951994e9cd7d516b789b9d8f85f3820966f14a1f62bf218873c9774

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-269",
  "sourceLines": [
    2626,
    2633
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-128",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_6dc4dc0f0118fdc25d263f2d13bac095",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_8813e4af883bd066590c26354712c496",
    "sourceUnitDigest": "7383aaf91951994e9cd7d516b789b9d8f85f3820966f14a1f62bf218873c9774",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-128",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-269 (lines 2626–2633) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-128. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "7383aaf91951994e9cd7d516b789b9d8f85f3820966f14a1f62bf218873c9774",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
3. **Chi phí bảo trì đã vượt giá trị, có bằng chứng đếm được.**
   `ALLOWED_FILES_ENTRIES` đã phình lên 28 entry, mỗi entry một lý do
   hand-written riêng, cộng 3 cơ chế miễn trừ theo pattern
   (`FROZEN_FILENAMES`, `FROZEN_PHRASES`, `IRON_LAW_EVIDENCE_META_CITATION`).
   Ít nhất bốn item đã sinh ra **chỉ để vá allowlist này** (`tsk-2au`,
   `tsk-2lg`, `tsk-2uo`, `tsk-4cx`). Chính `docs/decisions/0000-index.md`
   phải viết vòng vo *"tên gọi ban đầu của `0026`"* ở hai dòng thay vì gọi
   thẳng tên — guard đang bóp méo văn của chính fgOS.
```

### Full target unit

```text
3. **Chi phí bảo trì đã vượt giá trị, có bằng chứng đếm được.**
   `ALLOWED_FILES_ENTRIES` đã phình lên 28 entry, mỗi entry một lý do
   hand-written riêng, cộng 3 cơ chế miễn trừ theo pattern
   (`FROZEN_FILENAMES`, `FROZEN_PHRASES`, `IRON_LAW_EVIDENCE_META_CITATION`).
   Ít nhất bốn item đã sinh ra **chỉ để vá allowlist này** (`tsk-2au`,
   `tsk-2lg`, `tsk-2uo`, `tsk-4cx`). Chính `docs/decisions/0000-index.md`
   phải viết vòng vo *"tên gọi ban đầu của `0026`"* ở hai dòng thay vì gọi
   thẳng tên — guard đang bóp méo văn của chính fgOS.
```

### Full diff

```diff
No text difference.
```

## claim_e60bba2c4113531e577f25984aa0f740

Source digest: 6267e76a78ea182fb45787beb0f2a1bfd71a7aa85cbae119b11a815cbaa0433c

Target digest: 6267e76a78ea182fb45787beb0f2a1bfd71a7aa85cbae119b11a815cbaa0433c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-270",
  "sourceLines": [
    2635,
    2640
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-129",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_72f0ed43456789bff2a1fe278c3e96e1",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e60bba2c4113531e577f25984aa0f740",
    "sourceUnitDigest": "6267e76a78ea182fb45787beb0f2a1bfd71a7aa85cbae119b11a815cbaa0433c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-129",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-270 (lines 2635–2640) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-129. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6267e76a78ea182fb45787beb0f2a1bfd71a7aa85cbae119b11a815cbaa0433c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Record này chỉ supersede **mệnh đề guard** trong "Hệ quả" của `0028`. Phần
chính của `0028` — việc đổi tên vai trò `0026` từ `orchestrator` thành
`launcher` — **giữ nguyên hiệu lực**: `launcher` vẫn là tên đúng cho vai (1
đơn vị, buông), và không chỗ nào được quay về dùng `orchestrator` cho nghĩa
đó. Cùng khuôn supersede-từng-phần mà `0028` và `0029` đã dùng với `0026`
(hai phần không chồng lấn).
```

### Full target unit

```text
Record này chỉ supersede **mệnh đề guard** trong "Hệ quả" của `0028`. Phần
chính của `0028` — việc đổi tên vai trò `0026` từ `orchestrator` thành
`launcher` — **giữ nguyên hiệu lực**: `launcher` vẫn là tên đúng cho vai (1
đơn vị, buông), và không chỗ nào được quay về dùng `orchestrator` cho nghĩa
đó. Cùng khuôn supersede-từng-phần mà `0028` và `0029` đã dùng với `0026`
(hai phần không chồng lấn).
```

### Full diff

```diff
No text difference.
```

## claim_1504531748cba9ccf7f26bedd67ed19b

Source digest: c3f9e6193d91ecc9ecdd333a232e60012efb98b73cabc4604a691623bc8c5dc0

Target digest: c3f9e6193d91ecc9ecdd333a232e60012efb98b73cabc4604a691623bc8c5dc0

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "từ-vựng-sau-record-này",
  "sourceLines": [
    2642,
    2642
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "từ-vựng-sau-record-này",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
  ],
  "nativeTargetClaimId": "claim_bee58c525e22f16b455c779409f9c326",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "từ-vựng-sau-record-này",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_1504531748cba9ccf7f26bedd67ed19b",
    "sourceUnitDigest": "c3f9e6193d91ecc9ecdd333a232e60012efb98b73cabc4604a691623bc8c5dc0",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "từ-vựng-sau-record-này",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#từ-vựng-sau-record-này (lines 2642–2642) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#từ-vựng-sau-record-này. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c3f9e6193d91ecc9ecdd333a232e60012efb98b73cabc4604a691623bc8c5dc0",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
    ]
  }
}
```

### Full source unit

```text
#### Từ vựng sau record này

Lưới 2×2 của `0029` là từ vựng hiện hành, dùng thẳng, không cần né:

| | buông (bước ra hẳn) | ở lại (giữ liên hệ) |
|---|---|---|
| **1 đơn vị** | `launcher` | `driver` |
| **N đơn vị** | trống có lý do | `orchestrator` (tầng hợp thành T0) |
```

### Full target unit

```text
#### Từ vựng sau record này

Lưới 2×2 của `0029` là từ vựng hiện hành, dùng thẳng, không cần né:

| | buông (bước ra hẳn) | ở lại (giữ liên hệ) |
|---|---|---|
| **1 đơn vị** | `launcher` | `driver` |
| **N đơn vị** | trống có lý do | `orchestrator` (tầng hợp thành T0) |
```

### Full diff

```diff
No text difference.
```

## claim_27487d122caf8603e008b8e7a31278a5

Source digest: 4f87d3fcc2a2ad27dfaa6f2e01f13663180b416c99960bccabe1b15961491579

Target digest: 4f87d3fcc2a2ad27dfaa6f2e01f13663180b416c99960bccabe1b15961491579

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-271",
  "sourceLines": [
    2644,
    2644
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Từ vựng sau record này"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-130",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Từ vựng sau record này"
  ],
  "nativeTargetClaimId": "claim_e0c7e04580753db89896a5aad149325d",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "từ-vựng-sau-record-này",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_27487d122caf8603e008b8e7a31278a5",
    "sourceUnitDigest": "4f87d3fcc2a2ad27dfaa6f2e01f13663180b416c99960bccabe1b15961491579",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-130",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-271 (lines 2644–2644) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-130. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "4f87d3fcc2a2ad27dfaa6f2e01f13663180b416c99960bccabe1b15961491579",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Từ vựng sau record này"
    ]
  }
}
```

### Full source unit

```text
Lưới 2×2 của `0029` là từ vựng hiện hành, dùng thẳng, không cần né:
```

### Full target unit

```text
Lưới 2×2 của `0029` là từ vựng hiện hành, dùng thẳng, không cần né:
```

### Full diff

```diff
No text difference.
```

## claim_f667319337b33786d75f81ea07e4e46c

Source digest: 1f2b182749f127340bb8dcd372d42350e304ea1f1d9b4f4ba4819b49f277cf19

Target digest: 1f2b182749f127340bb8dcd372d42350e304ea1f1d9b4f4ba4819b49f277cf19

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-272",
  "sourceLines": [
    2646,
    2649
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Từ vựng sau record này"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-131",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Từ vựng sau record này"
  ],
  "nativeTargetClaimId": "claim_b5ca92b685ea668c83f88efff0bc9c41",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "từ-vựng-sau-record-này",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f667319337b33786d75f81ea07e4e46c",
    "sourceUnitDigest": "1f2b182749f127340bb8dcd372d42350e304ea1f1d9b4f4ba4819b49f277cf19",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-131",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-272 (lines 2646–2649) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-131. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "1f2b182749f127340bb8dcd372d42350e304ea1f1d9b4f4ba4819b49f277cf19",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Từ vựng sau record này"
    ]
  }
}
```

### Full source unit

```text
| | buông (bước ra hẳn) | ở lại (giữ liên hệ) |
|---|---|---|
| **1 đơn vị** | `launcher` | `driver` |
| **N đơn vị** | trống có lý do | `orchestrator` (tầng hợp thành T0) |
```

### Full target unit

```text
| | buông (bước ra hẳn) | ở lại (giữ liên hệ) |
|---|---|---|
| **1 đơn vị** | `launcher` | `driver` |
| **N đơn vị** | trống có lý do | `orchestrator` (tầng hợp thành T0) |
```

### Full diff

```diff
No text difference.
```

## claim_5bdcc916625cf6efb3b0b017be1700fb

Source digest: f41ecefca1aa681c16ead99e85a938e4f0983c804ca956852f7eed8ff235e966

Target digest: f41ecefca1aa681c16ead99e85a938e4f0983c804ca956852f7eed8ff235e966

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả-9",
  "sourceLines": [
    2651,
    2651
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả-9",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
  ],
  "nativeTargetClaimId": "claim_95c1d965e476af21bd28fffc552cbdc2",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5bdcc916625cf6efb3b0b017be1700fb",
    "sourceUnitDigest": "f41ecefca1aa681c16ead99e85a938e4f0983c804ca956852f7eed8ff235e966",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả-9 (lines 2651–2651) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f41ecefca1aa681c16ead99e85a938e4f0983c804ca956852f7eed8ff235e966",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- Xoá `test/docs/launcher-vocabulary-guard.test.mjs`.
- Xoá entry của file đó khỏi `scripts/check-decision-codes.baseline.json`
  (baseline chỉ chặn phát hiện MỚI, nên entry cũ vô hại — bỏ đi để không
  còn dữ liệu chết trỏ tới một file không tồn tại).
- Xoá `docs/how-to/allowlist-a-historical-mention-in-launcher-vocabulary-
  guard.md` và dòng của nó trong `docs/enduser-docs-index.json`: how-to đó
  hướng dẫn dùng một cơ chế không còn tồn tại.
- `0028` nhận `superseded_by: [0031]` trong frontmatter, đúng khuôn STR72
  trỏ-ngược-bắt-buộc; `docs/decisions/0000-index.md` nhận dòng của `0031`
  và ghi chú trên dòng `0028`.
- Không đụng: `herdr-dashboard/src/**/*.rs`'s `PaneOrchestrator` (khái niệm
  Rust khác hẳn), `docs/distillery/**` (trích verbatim upstream),
  `plans/reports/**` (bản ghi lịch sử). Ba nhóm này vốn đã nằm ngoài phạm
  vi guard và không đổi gì.
- Không sửa ngược prose cũ. Những chỗ đang né từ (ví dụ hai dòng vòng vo
  trong `0000-index.md`) được phép viết thẳng lại khi có item chạm vào
  chúng — không phải việc của record này.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
#### Hệ quả

- Xoá `test/docs/launcher-vocabulary-guard.test.mjs`.
- Xoá entry của file đó khỏi `scripts/check-decision-codes.baseline.json`
  (baseline chỉ chặn phát hiện MỚI, nên entry cũ vô hại — bỏ đi để không
  còn dữ liệu chết trỏ tới một file không tồn tại).
- Xoá `docs/how-to/allowlist-a-historical-mention-in-launcher-vocabulary-
  guard.md` và dòng của nó trong `docs/enduser-docs-index.json`: how-to đó
  hướng dẫn dùng một cơ chế không còn tồn tại.
- `0028` nhận `superseded_by: [0031]` trong frontmatter, đúng khuôn STR72
  trỏ-ngược-bắt-buộc; `docs/decisions/0000-index.md` nhận dòng của `0031`
  và ghi chú trên dòng `0028`.
- Không đụng: `herdr-dashboard/src/**/*.rs`'s `PaneOrchestrator` (khái niệm
  Rust khác hẳn), `docs/distillery/**` (trích verbatim upstream),
  `plans/reports/**` (bản ghi lịch sử). Ba nhóm này vốn đã nằm ngoài phạm
  vi guard và không đổi gì.
- Không sửa ngược prose cũ. Những chỗ đang né từ (ví dụ hai dòng vòng vo
  trong `0000-index.md`) được phép viết thẳng lại khi có item chạm vào
  chúng — không phải việc của record này.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_97f27b8f14b3521928ef89b19635bb83

Source digest: 20f6da98e00f7a01a4d36e1a57b4548701e5c202f42f1f84e52c47605ab4a6d7

Target digest: 20f6da98e00f7a01a4d36e1a57b4548701e5c202f42f1f84e52c47605ab4a6d7

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-273",
  "sourceLines": [
    2653,
    2669
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-132",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_68898bd28ab9ae0ac3b97b4dc860348b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_97f27b8f14b3521928ef89b19635bb83",
    "sourceUnitDigest": "20f6da98e00f7a01a4d36e1a57b4548701e5c202f42f1f84e52c47605ab4a6d7",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-132",
    "claimKind": "decision",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-273 (lines 2653–2669) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-132. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "20f6da98e00f7a01a4d36e1a57b4548701e5c202f42f1f84e52c47605ab4a6d7",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
- Xoá `test/docs/launcher-vocabulary-guard.test.mjs`.
- Xoá entry của file đó khỏi `scripts/check-decision-codes.baseline.json`
  (baseline chỉ chặn phát hiện MỚI, nên entry cũ vô hại — bỏ đi để không
  còn dữ liệu chết trỏ tới một file không tồn tại).
- Xoá `docs/how-to/allowlist-a-historical-mention-in-launcher-vocabulary-
  guard.md` và dòng của nó trong `docs/enduser-docs-index.json`: how-to đó
  hướng dẫn dùng một cơ chế không còn tồn tại.
- `0028` nhận `superseded_by: [0031]` trong frontmatter, đúng khuôn STR72
  trỏ-ngược-bắt-buộc; `docs/decisions/0000-index.md` nhận dòng của `0031`
  và ghi chú trên dòng `0028`.
- Không đụng: `herdr-dashboard/src/**/*.rs`'s `PaneOrchestrator` (khái niệm
  Rust khác hẳn), `docs/distillery/**` (trích verbatim upstream),
  `plans/reports/**` (bản ghi lịch sử). Ba nhóm này vốn đã nằm ngoài phạm
  vi guard và không đổi gì.
- Không sửa ngược prose cũ. Những chỗ đang né từ (ví dụ hai dòng vòng vo
  trong `0000-index.md`) được phép viết thẳng lại khi có item chạm vào
  chúng — không phải việc của record này.
```

### Full target unit

```text
- Xoá `test/docs/launcher-vocabulary-guard.test.mjs`.
- Xoá entry của file đó khỏi `scripts/check-decision-codes.baseline.json`
  (baseline chỉ chặn phát hiện MỚI, nên entry cũ vô hại — bỏ đi để không
  còn dữ liệu chết trỏ tới một file không tồn tại).
- Xoá `docs/how-to/allowlist-a-historical-mention-in-launcher-vocabulary-
  guard.md` và dòng của nó trong `docs/enduser-docs-index.json`: how-to đó
  hướng dẫn dùng một cơ chế không còn tồn tại.
- `0028` nhận `superseded_by: [0031]` trong frontmatter, đúng khuôn STR72
  trỏ-ngược-bắt-buộc; `docs/decisions/0000-index.md` nhận dòng của `0031`
  và ghi chú trên dòng `0028`.
- Không đụng: `herdr-dashboard/src/**/*.rs`'s `PaneOrchestrator` (khái niệm
  Rust khác hẳn), `docs/distillery/**` (trích verbatim upstream),
  `plans/reports/**` (bản ghi lịch sử). Ba nhóm này vốn đã nằm ngoài phạm
  vi guard và không đổi gì.
- Không sửa ngược prose cũ. Những chỗ đang né từ (ví dụ hai dòng vòng vo
  trong `0000-index.md`) được phép viết thẳng lại khi có item chạm vào
  chúng — không phải việc của record này.
```

### Full diff

```diff
No text difference.
```

## claim_825b8970950e755e43c8c1740612eac4

Source digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Target digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-274",
  "sourceLines": [
    2671,
    2671
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-9",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_892115f8efacf90f172fe53b82296354",
  "class": "Weak-exact",
  "classReason": "target digest repeats; ancestor headings differ",
  "section": "hệ-quả-9",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_825b8970950e755e43c8c1740612eac4",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: target digest repeats; ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-274 (lines 2671–2671) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_3a9eedae02739e6ffe690d3a2b6c5684

Source digest: 6e0fca4e38d4ff34faef73f00f135eff9fca9da23e37671624e66878e09e767d

Target digest: 6e0fca4e38d4ff34faef73f00f135eff9fca9da23e37671624e66878e09e767d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "tham-chiếu-2",
  "sourceLines": [
    2673,
    2673
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "tham-chiếu-2",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
  ],
  "nativeTargetClaimId": "claim_1c64cbf89073ca83ad237e9fa656eaf1",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "tham-chiếu-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3a9eedae02739e6ffe690d3a2b6c5684",
    "sourceUnitDigest": "6e0fca4e38d4ff34faef73f00f135eff9fca9da23e37671624e66878e09e767d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "tham-chiếu-2",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#tham-chiếu-2 (lines 2673–2673) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#tham-chiếu-2. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6e0fca4e38d4ff34faef73f00f135eff9fca9da23e37671624e66878e09e767d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới"
    ]
  }
}
```

### Full source unit

```text
#### Tham chiếu

- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0029` — `docs/decisions/0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md`
```

### Full target unit

```text
#### Tham chiếu

- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0029` — `docs/decisions/0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md`
```

### Full diff

```diff
No text difference.
```

## claim_c842b765b0ed205f74e38f577a83a052

Source digest: 7a5df60671efcaccdd69f9a4ff90758c9d6f0c54fee0ae165d92379973a235ee

Target digest: 7a5df60671efcaccdd69f9a4ff90758c9d6f0c54fee0ae165d92379973a235ee

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-275",
  "sourceLines": [
    2675,
    2677
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Tham chiếu"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-134",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
    "Tham chiếu"
  ],
  "nativeTargetClaimId": "claim_245d7a7dc0e4702ae1872eeae1d21dbf",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "tham-chiếu-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c842b765b0ed205f74e38f577a83a052",
    "sourceUnitDigest": "7a5df60671efcaccdd69f9a4ff90758c9d6f0c54fee0ae165d92379973a235ee",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-134",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-275 (lines 2675–2677) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-134. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "7a5df60671efcaccdd69f9a4ff90758c9d6f0c54fee0ae165d92379973a235ee",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới",
      "Tham chiếu"
    ]
  }
}
```

### Full source unit

```text
- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0029` — `docs/decisions/0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md`
```

### Full target unit

```text
- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0029` — `docs/decisions/0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md`
```

### Full diff

```diff
No text difference.
```
