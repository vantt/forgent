# Native identity transitions and candidate accounting — part 4

Author session: `codex-session:unit-run-1792090455209-159fbfed@2026-10-16`
Packaged by: `codex-session:unit-run-1792090455209-159fbfed@2026-10-16`
Content pin / SYNC: `19ca8de23908e161c34c91626e41041b7813167c`
Comparison base: `ab4d6274a9ae78c2613897432df726bfab32be52`
Entries: **116**, maximum 120 per request part.

[Single request index](review-request-step10-index-19ca8de23.md). This is one bounded re-review set of changes since `ab4d6274a`, replacing prior submission for changed entries only; unchanged matching ok verdicts remain accepted. This author header identifies this part's submitted author; per-row `authoredBy` and immutable historical author fields remain exact. No producer seed, draw, sample or verdict is selected.

Read [A36 mechanical/deep lists](step10-sync19-A36.json). Every submitted claim requires one ordinary verdict with exact shown source and target digests and a `deep` or `mechanical` note. Recompute full digests and anchors and compare current shard/pack equality for every row. Deep-review every unequal source/target row, every submitted partial carry, all seven labelled truth corrections, all historical AGENTS rows and other explicitly marked reworks. The reviewer selects and records a seed for at least 63/415 Weak-exact/Judgment rows (15%, minimum 10, all if fewer); >3% deep rework escalates to whole-pack deep review. A36 changes neither truth sampling nor checkpoint review. Non-claim entries receive item-specific accounting/content verdicts, not claim approvals. Existing independently ok unchanged full-file content is context only.

## Entry claim_b3aab9cac451e24a234cd6ced8a7c36c

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_b3aab9cac451e24a234cd6ced8a7c36c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/architecture/implementation-pointers.md",
    "unitDigest": "172b95a3e7dfce6a53584af148501b0ce1e4117f4fb004d8d31381176a17a6d2",
    "identityFingerprint": "172b95a3e7dfce6a53584af148501b0ce1e4117f4fb004d8d31381176a17a6d2",
    "claimId": "claim_b3aab9cac451e24a234cd6ced8a7c36c",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "08e9731304f9e54ce01edb082f23b13ff6802af280ca8aeb62ff1d2e1a7a0627",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/architecture/implementation-pointers.md",
    "unitDigest": "172b95a3e7dfce6a53584af148501b0ce1e4117f4fb004d8d31381176a17a6d2",
    "identityFingerprint": "172b95a3e7dfce6a53584af148501b0ce1e4117f4fb004d8d31381176a17a6d2",
    "claimId": "claim_b3aab9cac451e24a234cd6ced8a7c36c",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "08e9731304f9e54ce01edb082f23b13ff6802af280ca8aeb62ff1d2e1a7a0627",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-4",
    "githubAnchor": "unheaded-block-4",
    "stableAnchor": "unheaded-block-4",
    "title": "Unheaded block 4",
    "startLine": 56,
    "endLine": 58,
    "textDigest": "08e9731304f9e54ce01edb082f23b13ff6802af280ca8aeb62ff1d2e1a7a0627",
    "sample": "- [Work state area portal](../README.md)\n- [Work state spec](../spec.md)\n- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)",
    "identityFingerprint": "172b95a3e7dfce6a53584af148501b0ce1e4117f4fb004d8d31381176a17a6d2",
    "ancestry": [
      "Work State Implementation Pointers",
      "3. Related Files"
    ],
    "text": "- [Work state area portal](../README.md)\n- [Work state spec](../spec.md)\n- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-4",
    "githubAnchor": "unheaded-block-4",
    "stableAnchor": "unheaded-block-4",
    "title": "Unheaded block 4",
    "startLine": 56,
    "endLine": 58,
    "textDigest": "08e9731304f9e54ce01edb082f23b13ff6802af280ca8aeb62ff1d2e1a7a0627",
    "sample": "- [Work state area portal](../README.md)\n- [Work state spec](../spec.md)\n- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)",
    "identityFingerprint": "172b95a3e7dfce6a53584af148501b0ce1e4117f4fb004d8d31381176a17a6d2",
    "ancestry": [
      "Work State Implementation Pointers",
      "3. Related Files"
    ],
    "text": "- [Work state area portal](../README.md)\n- [Work state spec](../spec.md)\n- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_b3aab9cac451e24a234cd6ced8a7c36c"
}
```

## Entry claim_667088d67f27a0b1b16ced96df73a19a

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_667088d67f27a0b1b16ced96df73a19a",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "834bf9e101af42c4390412826074d9bbf07ac00d5e0f0fb60dba68f8ebc05493",
    "identityFingerprint": "f59b5374888cb01890b5eaa1fe23ecd105eb0b4df97a903e4fae268468c7b81b",
    "claimId": "claim_667088d67f27a0b1b16ced96df73a19a",
    "sourceAnchor": "13-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "73a072fb1b320f93951e427d5e1af422830f13d626e6564e14bbe403012a389d",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "7c3a08672e73e2dacc28f810754594a55afe8f77feefcb88f113e55348ed2e48",
      "toUnitDigest": "834bf9e101af42c4390412826074d9bbf07ac00d5e0f0fb60dba68f8ebc05493",
      "fromSourceUnitDigest": "5d770150299311726311786de10a833b43eb497114868e4ab5c57bd6e611c399",
      "toSourceUnitDigest": "73a072fb1b320f93951e427d5e1af422830f13d626e6564e14bbe403012a389d"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "834bf9e101af42c4390412826074d9bbf07ac00d5e0f0fb60dba68f8ebc05493",
    "identityFingerprint": "f59b5374888cb01890b5eaa1fe23ecd105eb0b4df97a903e4fae268468c7b81b",
    "claimId": "claim_667088d67f27a0b1b16ced96df73a19a",
    "sourceAnchor": "13-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "73a072fb1b320f93951e427d5e1af422830f13d626e6564e14bbe403012a389d",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "13. Related Files",
    "anchor": "13-related-files",
    "githubAnchor": "13-related-files",
    "stableAnchor": "h-d4b97706e14e",
    "startLine": 433,
    "endLine": 433,
    "textDigest": "73a072fb1b320f93951e427d5e1af422830f13d626e6564e14bbe403012a389d",
    "sample": "13. Related Files",
    "sectionPayloadDigest": "6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0",
    "followingBlockDigest": "6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0",
    "identityFingerprint": "f59b5374888cb01890b5eaa1fe23ecd105eb0b4df97a903e4fae268468c7b81b",
    "ancestry": [
      "CLI I/O Contract"
    ],
    "text": "## 13. Related Files",
    "sectionText": "## 13. Related Files\n\n- [Work State portal](../README.md)\n- [Work State spec](../spec.md)\n- [Retired decision history](../decisions/retired-decision-history.md)\n- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)\n- [Legacy source: docs/io-contract.md](../../../io-contract.md)"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "13. Related Files",
    "anchor": "13-related-files",
    "githubAnchor": "13-related-files",
    "stableAnchor": "h-63a3a090ff42",
    "startLine": 443,
    "endLine": 443,
    "textDigest": "73a072fb1b320f93951e427d5e1af422830f13d626e6564e14bbe403012a389d",
    "sample": "13. Related Files",
    "sectionPayloadDigest": "6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0",
    "followingBlockDigest": "6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0",
    "identityFingerprint": "f59b5374888cb01890b5eaa1fe23ecd105eb0b4df97a903e4fae268468c7b81b",
    "ancestry": [
      "CLI I/O Contract"
    ],
    "text": "## 13. Related Files",
    "sectionText": "## 13. Related Files\n\n- [Work State portal](../README.md)\n- [Work State spec](../spec.md)\n- [Retired decision history](../decisions/retired-decision-history.md)\n- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)\n- [Legacy source: docs/io-contract.md](../../../io-contract.md)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_667088d67f27a0b1b16ced96df73a19a"
}
```

## Entry claim_5f9a6123b5c816fb5fbcd4575a29b75c

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_5f9a6123b5c816fb5fbcd4575a29b75c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "02dfb87ba224f1347e8c124b1bd164d6cc0a265a432e9bde38b9de3ceed20b5f",
    "identityFingerprint": "d0fe4af7311e0340b884e03d517acefb961f7baf99d63affb7731769fb171e78",
    "claimId": "claim_5f9a6123b5c816fb5fbcd4575a29b75c",
    "sourceAnchor": "caller-role",
    "unitKind": "heading",
    "sourceUnitDigest": "befd4c0925c52780e0dff93c01ed25165e6ed23c6bafeba2665f172496b25420",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "4af96fad0e9ecbefc016a64a3cff4f63aa929fb107cf5daf315653c99521fe45",
    "identityFingerprint": "d6c7a745300367e6c7a3579421194e1952e63a9c0b0253bc9d6c17eb654c3c1a",
    "claimId": "claim_5f9a6123b5c816fb5fbcd4575a29b75c",
    "sourceAnchor": "caller-role",
    "unitKind": "heading",
    "sourceUnitDigest": "8d194e876bac7a54c733916f927346facfe878113904e2e5a2c0745359ed917d",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "02dfb87ba224f1347e8c124b1bd164d6cc0a265a432e9bde38b9de3ceed20b5f",
      "toUnitDigest": "4af96fad0e9ecbefc016a64a3cff4f63aa929fb107cf5daf315653c99521fe45",
      "fromSourceUnitDigest": "befd4c0925c52780e0dff93c01ed25165e6ed23c6bafeba2665f172496b25420",
      "toSourceUnitDigest": "8d194e876bac7a54c733916f927346facfe878113904e2e5a2c0745359ed917d"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Caller Role",
    "anchor": "caller-role",
    "githubAnchor": "caller-role",
    "stableAnchor": "h-319b619d6fff",
    "startLine": 111,
    "endLine": 111,
    "textDigest": "befd4c0925c52780e0dff93c01ed25165e6ed23c6bafeba2665f172496b25420",
    "sample": "Caller Role",
    "sectionPayloadDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "followingBlockDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "identityFingerprint": "d0fe4af7311e0340b884e03d517acefb961f7baf99d63affb7731769fb171e78",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity"
    ],
    "text": "### Caller Role",
    "sectionText": "### Caller Role\n\nSong song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,\nkhông do ai quyết định). `role` và `writer` tách bạch: một cái nói \"ai gây\nra\", một cái nói \"loại gì gây ra\"."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 3,
    "title": "Caller Role",
    "anchor": "caller-role",
    "githubAnchor": "caller-role",
    "stableAnchor": "h-918a1bc97abb",
    "startLine": 114,
    "endLine": 114,
    "textDigest": "8d194e876bac7a54c733916f927346facfe878113904e2e5a2c0745359ed917d",
    "sample": "Caller Role",
    "sectionPayloadDigest": "dcbed9ee9b1df77e667ff24d65c7cd461df834e4b677ee732a8c3fd079b95d27",
    "followingBlockDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "identityFingerprint": "d6c7a745300367e6c7a3579421194e1952e63a9c0b0253bc9d6c17eb654c3c1a",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity"
    ],
    "text": "### Caller Role",
    "sectionText": "### Caller Role\n\nKhác với \"chưa xác danh\", **lỗi cài đặt** thì chặn: khi không có binary host\nRust nào trả lời được identity (`host-missing`, `host-version-mismatch`,\n`timeout`, `host-error`, `bad-output`), verb ghi dừng với lỗi `precondition`\n(exit 2) trước khi ghi gì, không bao giờ đoán id. Kênh `node bin/fgos.mjs` và\n`bin.fgos` của npm global vì vậy chỉ ghi được trong project đã activate, hoặc\nkhi `FGOS_HOST_BIN` trỏ tới một binary host.\n\nSong song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,\nkhông do ai quyết định). `role` và `writer` tách bạch: một cái nói \"ai gây\nra\", một cái nói \"loại gì gây ra\"."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_5f9a6123b5c816fb5fbcd4575a29b75c"
}
```

## Entry claim_a5eb3c9d9a017ed2c0697dd9aa7581be

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_a5eb3c9d9a017ed2c0697dd9aa7581be",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "b45243cbc3aa642918126e02620b2d2fe4b33f96e860cc2345ffa67cd090dc0a",
    "identityFingerprint": "b45243cbc3aa642918126e02620b2d2fe4b33f96e860cc2345ffa67cd090dc0a",
    "claimId": "claim_a5eb3c9d9a017ed2c0697dd9aa7581be",
    "sourceAnchor": "unheaded-block-10",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "8aa8491435b1bd76c915faca0aaf324c77472f53839ef536c00d9cd1a7b9a2be",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-10",
    "githubAnchor": "unheaded-block-10",
    "stableAnchor": "unheaded-block-10",
    "title": "Unheaded block 10",
    "startLine": 83,
    "endLine": 93,
    "textDigest": "8aa8491435b1bd76c915faca0aaf324c77472f53839ef536c00d9cd1a7b9a2be",
    "sample": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: ",
    "identityFingerprint": "b45243cbc3aa642918126e02620b2d2fe4b33f96e860cc2345ffa67cd090dc0a",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Writer Source Trust Levels"
    ],
    "text": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·\n  `env` (biến môi trường, ai cũng set được) · `pid` (tổ tiên cao nhất còn\n  terminal, không có thì session id của tiến trình gọi; best-effort) ·\n  `unresolved` (không nguồn nào xác nhận được — `id` vẫn là\n  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn\n  `source` nói giá trị chưa kiểm chứng được). Luật đầy đủ (thứ tự biến env,\n  giới hạn đã biết) chỉ nằm ở [spec Session Identity](../../session-identity/spec.md);\n  nguồn duy nhất là crate Rust `fgos-session-identity`."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_a5eb3c9d9a017ed2c0697dd9aa7581be"
}
```

## Entry claim_ebead1511c99c215b7ef32469cdc3831

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_ebead1511c99c215b7ef32469cdc3831",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "364e81e85037c5701c597a7036c723d620a39c75e5137bb197651b57c9865746",
    "identityFingerprint": "364e81e85037c5701c597a7036c723d620a39c75e5137bb197651b57c9865746",
    "claimId": "claim_ebead1511c99c215b7ef32469cdc3831",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-13",
    "githubAnchor": "unheaded-block-13",
    "stableAnchor": "unheaded-block-13",
    "title": "Unheaded block 13",
    "startLine": 116,
    "endLine": 121,
    "textDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "sample": "Khác với \"chưa xác danh\", **lỗi cài đặt** thì chặn: khi không có binary host\nRust nào trả lời được identity (`host-missing`, `host-version-mismatch`,\n`timeout`, `host-error`, `bad-",
    "identityFingerprint": "364e81e85037c5701c597a7036c723d620a39c75e5137bb197651b57c9865746",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Caller Role"
    ],
    "text": "Khác với \"chưa xác danh\", **lỗi cài đặt** thì chặn: khi không có binary host\nRust nào trả lời được identity (`host-missing`, `host-version-mismatch`,\n`timeout`, `host-error`, `bad-output`), verb ghi dừng với lỗi `precondition`\n(exit 2) trước khi ghi gì, không bao giờ đoán id. Kênh `node bin/fgos.mjs` và\n`bin.fgos` của npm global vì vậy chỉ ghi được trong project đã activate, hoặc\nkhi `FGOS_HOST_BIN` trỏ tới một binary host."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_ebead1511c99c215b7ef32469cdc3831"
}
```

## Entry claim_3f95f64ae75e9eafac8e5b93d5cb5c63

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_3f95f64ae75e9eafac8e5b93d5cb5c63",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "claimId": "claim_3f95f64ae75e9eafac8e5b93d5cb5c63",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "claimId": "claim_3f95f64ae75e9eafac8e5b93d5cb5c63",
    "sourceAnchor": "unheaded-block-14",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-13",
    "githubAnchor": "unheaded-block-13",
    "stableAnchor": "unheaded-block-13",
    "title": "Unheaded block 13",
    "startLine": 113,
    "endLine": 117,
    "textDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "sample": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park ",
    "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Caller Role"
    ],
    "text": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,\nkhông do ai quyết định). `role` và `writer` tách bạch: một cái nói \"ai gây\nra\", một cái nói \"loại gì gây ra\"."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-14",
    "githubAnchor": "unheaded-block-14",
    "stableAnchor": "unheaded-block-14",
    "title": "Unheaded block 14",
    "startLine": 123,
    "endLine": 127,
    "textDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "sample": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park ",
    "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Caller Role"
    ],
    "text": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,\nkhông do ai quyết định). `role` và `writer` tách bạch: một cái nói \"ai gây\nra\", một cái nói \"loại gì gây ra\"."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_3f95f64ae75e9eafac8e5b93d5cb5c63"
}
```

## Entry claim_29f04ce21d77ad5dbcf3d89f27b126c4

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_29f04ce21d77ad5dbcf3d89f27b126c4",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "9b12e65fe917f22123f6e96d3bfcf4332c1f8a0d3957624aa853e17ac283ca12",
    "identityFingerprint": "9b12e65fe917f22123f6e96d3bfcf4332c1f8a0d3957624aa853e17ac283ca12",
    "claimId": "claim_29f04ce21d77ad5dbcf3d89f27b126c4",
    "sourceAnchor": "unheaded-block-14",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "9b12e65fe917f22123f6e96d3bfcf4332c1f8a0d3957624aa853e17ac283ca12",
    "identityFingerprint": "9b12e65fe917f22123f6e96d3bfcf4332c1f8a0d3957624aa853e17ac283ca12",
    "claimId": "claim_29f04ce21d77ad5dbcf3d89f27b126c4",
    "sourceAnchor": "unheaded-block-15",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-14",
    "githubAnchor": "unheaded-block-14",
    "stableAnchor": "unheaded-block-14",
    "title": "Unheaded block 14",
    "startLine": 123,
    "endLine": 133,
    "textDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
    "sample": "**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất\nthay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:\n`contract` (tên+phiên bản chuẩn",
    "identityFingerprint": "9b12e65fe917f22123f6e96d3bfcf4332c1f8a0d3957624aa853e17ac283ca12",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất\nthay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:\n`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),\n`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không\ncần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`\nlà **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:\nverb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả\nđúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)\n— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò\nregex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb\nnào lọt lưới và không có hai cách in khác nhau."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-15",
    "githubAnchor": "unheaded-block-15",
    "stableAnchor": "unheaded-block-15",
    "title": "Unheaded block 15",
    "startLine": 133,
    "endLine": 143,
    "textDigest": "8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4",
    "sample": "**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất\nthay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:\n`contract` (tên+phiên bản chuẩn",
    "identityFingerprint": "9b12e65fe917f22123f6e96d3bfcf4332c1f8a0d3957624aa853e17ac283ca12",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất\nthay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:\n`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),\n`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không\ncần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`\nlà **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:\nverb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả\nđúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)\n— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò\nregex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb\nnào lọt lưới và không có hai cách in khác nhau."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_29f04ce21d77ad5dbcf3d89f27b126c4"
}
```

## Entry claim_2c7ba7c08b540f1565c4fac86e0f88d5

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_2c7ba7c08b540f1565c4fac86e0f88d5",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "claimId": "claim_2c7ba7c08b540f1565c4fac86e0f88d5",
    "sourceAnchor": "unheaded-block-15",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "claimId": "claim_2c7ba7c08b540f1565c4fac86e0f88d5",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-15",
    "githubAnchor": "unheaded-block-15",
    "stableAnchor": "unheaded-block-15",
    "title": "Unheaded block 15",
    "startLine": 135,
    "endLine": 137,
    "textDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "sample": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:",
    "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-16",
    "githubAnchor": "unheaded-block-16",
    "stableAnchor": "unheaded-block-16",
    "title": "Unheaded block 16",
    "startLine": 145,
    "endLine": 147,
    "textDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "sample": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:",
    "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_2c7ba7c08b540f1565c4fac86e0f88d5"
}
```

## Entry claim_e00f77334f67689a366e215274459542

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_e00f77334f67689a366e215274459542",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "claimId": "claim_e00f77334f67689a366e215274459542",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "claimId": "claim_e00f77334f67689a366e215274459542",
    "sourceAnchor": "unheaded-block-17",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-16",
    "githubAnchor": "unheaded-block-16",
    "stableAnchor": "unheaded-block-16",
    "title": "Unheaded block 16",
    "startLine": 139,
    "endLine": 141,
    "textDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "sample": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```",
    "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-17",
    "githubAnchor": "unheaded-block-17",
    "stableAnchor": "unheaded-block-17",
    "title": "Unheaded block 17",
    "startLine": 149,
    "endLine": 151,
    "textDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "sample": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```",
    "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_e00f77334f67689a366e215274459542"
}
```

## Entry claim_14c1c8c75ed4222f4e3280ca09da7ef6

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_14c1c8c75ed4222f4e3280ca09da7ef6",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "claimId": "claim_14c1c8c75ed4222f4e3280ca09da7ef6",
    "sourceAnchor": "unheaded-block-17",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "claimId": "claim_14c1c8c75ed4222f4e3280ca09da7ef6",
    "sourceAnchor": "unheaded-block-18",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-17",
    "githubAnchor": "unheaded-block-17",
    "stableAnchor": "unheaded-block-17",
    "title": "Unheaded block 17",
    "startLine": 143,
    "endLine": 146,
    "textDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "sample": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phon",
    "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/\nbại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-18",
    "githubAnchor": "unheaded-block-18",
    "stableAnchor": "unheaded-block-18",
    "title": "Unheaded block 18",
    "startLine": 153,
    "endLine": 156,
    "textDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "sample": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phon",
    "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Envelope Shape"
    ],
    "text": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/\nbại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_14c1c8c75ed4222f4e3280ca09da7ef6"
}
```

## Entry claim_2beadda8db30fa95fa29063bae954245

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_2beadda8db30fa95fa29063bae954245",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "0f7d6b622276bd60f3607f619d603ba58a4496a16c988a2a4f2f3610470eb526",
    "identityFingerprint": "0f7d6b622276bd60f3607f619d603ba58a4496a16c988a2a4f2f3610470eb526",
    "claimId": "claim_2beadda8db30fa95fa29063bae954245",
    "sourceAnchor": "unheaded-block-18",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "0f7d6b622276bd60f3607f619d603ba58a4496a16c988a2a4f2f3610470eb526",
    "identityFingerprint": "0f7d6b622276bd60f3607f619d603ba58a4496a16c988a2a4f2f3610470eb526",
    "claimId": "claim_2beadda8db30fa95fa29063bae954245",
    "sourceAnchor": "unheaded-block-19",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-18",
    "githubAnchor": "unheaded-block-18",
    "stableAnchor": "unheaded-block-18",
    "title": "Unheaded block 18",
    "startLine": 150,
    "endLine": 153,
    "textDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
    "sample": "**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;\nkhi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi\n(stdout=dữ liệu, std",
    "identityFingerprint": "0f7d6b622276bd60f3607f619d603ba58a4496a16c988a2a4f2f3610470eb526",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Error Path Is Not Enveloped"
    ],
    "text": "**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;\nkhi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi\n(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,\nkhông phải bằng việc dò nội dung phong bì."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-19",
    "githubAnchor": "unheaded-block-19",
    "stableAnchor": "unheaded-block-19",
    "title": "Unheaded block 19",
    "startLine": 160,
    "endLine": 163,
    "textDigest": "5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4",
    "sample": "**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;\nkhi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi\n(stdout=dữ liệu, std",
    "identityFingerprint": "0f7d6b622276bd60f3607f619d603ba58a4496a16c988a2a4f2f3610470eb526",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Error Path Is Not Enveloped"
    ],
    "text": "**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;\nkhi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi\n(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,\nkhông phải bằng việc dò nội dung phong bì."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_2beadda8db30fa95fa29063bae954245"
}
```

## Entry claim_2ae9347f090d39a2ba3c84ec18caf370

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_2ae9347f090d39a2ba3c84ec18caf370",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "33f37f423dd766e23819dd4bcb17a93bd66b8500200798a60fab598d29885c62",
    "identityFingerprint": "33f37f423dd766e23819dd4bcb17a93bd66b8500200798a60fab598d29885c62",
    "claimId": "claim_2ae9347f090d39a2ba3c84ec18caf370",
    "sourceAnchor": "unheaded-block-19",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "33f37f423dd766e23819dd4bcb17a93bd66b8500200798a60fab598d29885c62",
    "identityFingerprint": "33f37f423dd766e23819dd4bcb17a93bd66b8500200798a60fab598d29885c62",
    "claimId": "claim_2ae9347f090d39a2ba3c84ec18caf370",
    "sourceAnchor": "unheaded-block-20",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-19",
    "githubAnchor": "unheaded-block-19",
    "stableAnchor": "unheaded-block-19",
    "title": "Unheaded block 19",
    "startLine": 157,
    "endLine": 161,
    "textDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
    "sample": "**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của\nmỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều\ndòng như trên, vì một tiế",
    "identityFingerprint": "33f37f423dd766e23819dd4bcb17a93bd66b8500200798a60fab598d29885c62",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ],
    "text": "**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của\nmỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều\ndòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo\nthời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec\nRunner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-20",
    "githubAnchor": "unheaded-block-20",
    "stableAnchor": "unheaded-block-20",
    "title": "Unheaded block 20",
    "startLine": 167,
    "endLine": 171,
    "textDigest": "75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b",
    "sample": "**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của\nmỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều\ndòng như trên, vì một tiế",
    "identityFingerprint": "33f37f423dd766e23819dd4bcb17a93bd66b8500200798a60fab598d29885c62",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ],
    "text": "**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của\nmỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều\ndòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo\nthời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec\nRunner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_2ae9347f090d39a2ba3c84ec18caf370"
}
```

## Entry claim_cb49dfeab435a5cb463f8f232996c451

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_cb49dfeab435a5cb463f8f232996c451",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "claimId": "claim_cb49dfeab435a5cb463f8f232996c451",
    "sourceAnchor": "unheaded-block-20",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "claimId": "claim_cb49dfeab435a5cb463f8f232996c451",
    "sourceAnchor": "unheaded-block-21",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-20",
    "githubAnchor": "unheaded-block-20",
    "stableAnchor": "unheaded-block-20",
    "title": "Unheaded block 20",
    "startLine": 163,
    "endLine": 167,
    "textDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "sample": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một",
    "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ],
    "text": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong\nbì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên\nđọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-21",
    "githubAnchor": "unheaded-block-21",
    "stableAnchor": "unheaded-block-21",
    "title": "Unheaded block 21",
    "startLine": 173,
    "endLine": 177,
    "textDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "sample": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một",
    "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Runner Stdout Envelope"
    ],
    "text": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong\nbì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên\nđọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_cb49dfeab435a5cb463f8f232996c451"
}
```

## Entry claim_9d526eee666500cba4e0f288787c7020

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_9d526eee666500cba4e0f288787c7020",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "claimId": "claim_9d526eee666500cba4e0f288787c7020",
    "sourceAnchor": "unheaded-block-21",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "claimId": "claim_9d526eee666500cba4e0f288787c7020",
    "sourceAnchor": "unheaded-block-22",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-21",
    "githubAnchor": "unheaded-block-21",
    "stableAnchor": "unheaded-block-21",
    "title": "Unheaded block 21",
    "startLine": 171,
    "endLine": 174,
    "textDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "sample": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progr",
    "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Recognizing A Real Envelope"
    ],
    "text": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progress-trace của `fgos-runner` (xem \"Ngoại\nlệ có lý do\" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-22",
    "githubAnchor": "unheaded-block-22",
    "stableAnchor": "unheaded-block-22",
    "title": "Unheaded block 22",
    "startLine": 181,
    "endLine": 184,
    "textDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "sample": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progr",
    "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "ancestry": [
      "CLI I/O Contract",
      "3. Output Direction Unified Envelope",
      "Recognizing A Real Envelope"
    ],
    "text": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progress-trace của `fgos-runner` (xem \"Ngoại\nlệ có lý do\" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_9d526eee666500cba4e0f288787c7020"
}
```

## Entry claim_e928d55417d521f1c34a39e046a072e0

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_e928d55417d521f1c34a39e046a072e0",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "claimId": "claim_e928d55417d521f1c34a39e046a072e0",
    "sourceAnchor": "unheaded-block-22",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "claimId": "claim_e928d55417d521f1c34a39e046a072e0",
    "sourceAnchor": "unheaded-block-23",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-22",
    "githubAnchor": "unheaded-block-22",
    "stableAnchor": "unheaded-block-22",
    "title": "Unheaded block 22",
    "startLine": 178,
    "endLine": 183,
    "textDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "sample": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "ancestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "text": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-23",
    "githubAnchor": "unheaded-block-23",
    "stableAnchor": "unheaded-block-23",
    "title": "Unheaded block 23",
    "startLine": 188,
    "endLine": 193,
    "textDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "sample": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "ancestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "text": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_e928d55417d521f1c34a39e046a072e0"
}
```

## Entry claim_98b1174bf41bacf3c431e1f7d2c174a1

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_98b1174bf41bacf3c431e1f7d2c174a1",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "identityFingerprint": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "claimId": "claim_98b1174bf41bacf3c431e1f7d2c174a1",
    "sourceAnchor": "unheaded-block-23",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "identityFingerprint": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "claimId": "claim_98b1174bf41bacf3c431e1f7d2c174a1",
    "sourceAnchor": "unheaded-block-24",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-23",
    "githubAnchor": "unheaded-block-23",
    "stableAnchor": "unheaded-block-23",
    "title": "Unheaded block 23",
    "startLine": 185,
    "endLine": 186,
    "textDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "sample": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tư",
    "identityFingerprint": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "ancestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "text": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tương ứng theo bảng mã kết cục thực thi (`policy-refusal`: 4, `provider-limit`: 10, `execution-failure`: 11, `partial-writes`: 12, `blocked`: 13, `findings`: 14), trong khi toàn bộ luồng stdout JSON envelope `fgos.v1` vẫn được giữ nguyên vẹn 100%. Các lệnh chỉ-đọc như `fgos workflow status` luôn trả mã thoát 0 bất kể outcome của workflow run. Lệnh `fgos workflow start` chạy detached trả exit code 0 khi tiến trình daemon được kích hoạt thành công."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-24",
    "githubAnchor": "unheaded-block-24",
    "stableAnchor": "unheaded-block-24",
    "title": "Unheaded block 24",
    "startLine": 195,
    "endLine": 196,
    "textDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "sample": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tư",
    "identityFingerprint": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "ancestry": [
      "CLI I/O Contract",
      "4. Exit Codes"
    ],
    "text": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tương ứng theo bảng mã kết cục thực thi (`policy-refusal`: 4, `provider-limit`: 10, `execution-failure`: 11, `partial-writes`: 12, `blocked`: 13, `findings`: 14), trong khi toàn bộ luồng stdout JSON envelope `fgos.v1` vẫn được giữ nguyên vẹn 100%. Các lệnh chỉ-đọc như `fgos workflow status` luôn trả mã thoát 0 bất kể outcome của workflow run. Lệnh `fgos workflow start` chạy detached trả exit code 0 khi tiến trình daemon được kích hoạt thành công."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_98b1174bf41bacf3c431e1f7d2c174a1"
}
```

## Entry claim_3eda80201a85fe5bdf13782a93cc6331

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_3eda80201a85fe5bdf13782a93cc6331",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "identityFingerprint": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "claimId": "claim_3eda80201a85fe5bdf13782a93cc6331",
    "sourceAnchor": "unheaded-block-24",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "identityFingerprint": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "claimId": "claim_3eda80201a85fe5bdf13782a93cc6331",
    "sourceAnchor": "unheaded-block-25",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-24",
    "githubAnchor": "unheaded-block-24",
    "stableAnchor": "unheaded-block-24",
    "title": "Unheaded block 24",
    "startLine": 190,
    "endLine": 191,
    "textDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "sample": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:",
    "identityFingerprint": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-25",
    "githubAnchor": "unheaded-block-25",
    "stableAnchor": "unheaded-block-25",
    "title": "Unheaded block 25",
    "startLine": 200,
    "endLine": 201,
    "textDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "sample": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:",
    "identityFingerprint": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_3eda80201a85fe5bdf13782a93cc6331"
}
```

## Entry claim_d2b08fd0534d5773ce827072239491bb

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_d2b08fd0534d5773ce827072239491bb",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
    "identityFingerprint": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
    "claimId": "claim_d2b08fd0534d5773ce827072239491bb",
    "sourceAnchor": "unheaded-block-25",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
    "identityFingerprint": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
    "claimId": "claim_d2b08fd0534d5773ce827072239491bb",
    "sourceAnchor": "unheaded-block-26",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-25",
    "githubAnchor": "unheaded-block-25",
    "stableAnchor": "unheaded-block-25",
    "title": "Unheaded block 25",
    "startLine": 193,
    "endLine": 207,
    "textDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "sample": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --p",
    "identityFingerprint": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 203,
    "endLine": 217,
    "textDigest": "f58253403717e416cd5aa169d971bc332b43ab40f16ab6845c90d959d4283221",
    "sample": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --p",
    "identityFingerprint": "4dd427bdfd5fe7ca215b47e3ecfeb8ce37ad0ed58c683df6934f67d32c373e3e",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_d2b08fd0534d5773ce827072239491bb"
}
```

## Entry claim_9053f1edd1765577dd1bef202eff3d98

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_9053f1edd1765577dd1bef202eff3d98",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "57878f62bf37872a990b4b836ca7d25169a2ad4edf5b608c06201b1d772e2f63",
    "identityFingerprint": "57878f62bf37872a990b4b836ca7d25169a2ad4edf5b608c06201b1d772e2f63",
    "claimId": "claim_9053f1edd1765577dd1bef202eff3d98",
    "sourceAnchor": "unheaded-block-26",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "549dded9fe85b1cfd57f1ec7079141e4feb9e6468a31e93485ab91a2305e79fe",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "57878f62bf37872a990b4b836ca7d25169a2ad4edf5b608c06201b1d772e2f63",
    "identityFingerprint": "57878f62bf37872a990b4b836ca7d25169a2ad4edf5b608c06201b1d772e2f63",
    "claimId": "claim_9053f1edd1765577dd1bef202eff3d98",
    "sourceAnchor": "unheaded-block-27",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "549dded9fe85b1cfd57f1ec7079141e4feb9e6468a31e93485ab91a2305e79fe",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 209,
    "endLine": 211,
    "textDigest": "549dded9fe85b1cfd57f1ec7079141e4feb9e6468a31e93485ab91a2305e79fe",
    "sample": "**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)\nNẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không\nphải cửa ra tới người.",
    "identityFingerprint": "57878f62bf37872a990b4b836ca7d25169a2ad4edf5b608c06201b1d772e2f63",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)\nNẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không\nphải cửa ra tới người."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-27",
    "githubAnchor": "unheaded-block-27",
    "stableAnchor": "unheaded-block-27",
    "title": "Unheaded block 27",
    "startLine": 219,
    "endLine": 221,
    "textDigest": "549dded9fe85b1cfd57f1ec7079141e4feb9e6468a31e93485ab91a2305e79fe",
    "sample": "**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)\nNẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không\nphải cửa ra tới người.",
    "identityFingerprint": "57878f62bf37872a990b4b836ca7d25169a2ad4edf5b608c06201b1d772e2f63",
    "ancestry": [
      "CLI I/O Contract",
      "5. Reasoned Envelope Exceptions"
    ],
    "text": "**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)\nNẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không\nphải cửa ra tới người."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_9053f1edd1765577dd1bef202eff3d98"
}
```

## Entry claim_f9941e7fa0598cabe4dbc218c76c14be

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_f9941e7fa0598cabe4dbc218c76c14be",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "0c4d416214101537d7ba4005ceea36a6978aa90efb8dc69e750359b5ccb0647d",
    "identityFingerprint": "0c4d416214101537d7ba4005ceea36a6978aa90efb8dc69e750359b5ccb0647d",
    "claimId": "claim_f9941e7fa0598cabe4dbc218c76c14be",
    "sourceAnchor": "unheaded-block-27",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "0c4d416214101537d7ba4005ceea36a6978aa90efb8dc69e750359b5ccb0647d",
    "identityFingerprint": "0c4d416214101537d7ba4005ceea36a6978aa90efb8dc69e750359b5ccb0647d",
    "claimId": "claim_f9941e7fa0598cabe4dbc218c76c14be",
    "sourceAnchor": "unheaded-block-28",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-27",
    "githubAnchor": "unheaded-block-27",
    "stableAnchor": "unheaded-block-27",
    "title": "Unheaded block 27",
    "startLine": 215,
    "endLine": 239,
    "textDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "sample": "**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-\nscoping/CONTEXT.md`).** Sổ verb khai thêm cờ `pa",
    "identityFingerprint": "0c4d416214101537d7ba4005ceea36a6978aa90efb8dc69e750359b5ccb0647d",
    "ancestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "text": "**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-\nscoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho\nMỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,\n`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn\nverb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không\ntruyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình\ndạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/\n`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/\nfgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp\nđồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,\n`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm\n`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/\n`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang\nthật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không\ntheo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/\n`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả\nđổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục\nhoàn toàn** —\nngười gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền\ntiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã\ntới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ\nlượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa\n(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang\n(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là\nmột cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-28",
    "githubAnchor": "unheaded-block-28",
    "stableAnchor": "unheaded-block-28",
    "title": "Unheaded block 28",
    "startLine": 225,
    "endLine": 249,
    "textDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
    "sample": "**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-\nscoping/CONTEXT.md`).** Sổ verb khai thêm cờ `pa",
    "identityFingerprint": "0c4d416214101537d7ba4005ceea36a6978aa90efb8dc69e750359b5ccb0647d",
    "ancestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "text": "**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-\nscoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho\nMỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,\n`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn\nverb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không\ntruyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình\ndạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/\n`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/\nfgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp\nđồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,\n`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm\n`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/\n`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang\nthật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không\ntheo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/\n`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả\nđổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục\nhoàn toàn** —\nngười gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền\ntiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã\ntới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ\nlượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa\n(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang\n(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là\nmột cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f9941e7fa0598cabe4dbc218c76c14be"
}
```

## Entry claim_e7ef34e35d4eed7fe2ce3988ff7839e0

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_e7ef34e35d4eed7fe2ce3988ff7839e0",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "claimId": "claim_e7ef34e35d4eed7fe2ce3988ff7839e0",
    "sourceAnchor": "unheaded-block-28",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "claimId": "claim_e7ef34e35d4eed7fe2ce3988ff7839e0",
    "sourceAnchor": "unheaded-block-29",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-28",
    "githubAnchor": "unheaded-block-28",
    "stableAnchor": "unheaded-block-28",
    "title": "Unheaded block 28",
    "startLine": 241,
    "endLine": 250,
    "textDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "sample": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → ",
    "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "ancestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "text": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có\ntính năng này. Truyền một trong hai → kết quả đổi hình dạng thành\n`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy\nchủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự\nchế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã\nrời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu\nlại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của\nnó là một cặp `(a,b)`, không có khoá riêng cho một dòng."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-29",
    "githubAnchor": "unheaded-block-29",
    "stableAnchor": "unheaded-block-29",
    "title": "Unheaded block 29",
    "startLine": 251,
    "endLine": 260,
    "textDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "sample": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → ",
    "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "ancestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "text": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có\ntính năng này. Truyền một trong hai → kết quả đổi hình dạng thành\n`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy\nchủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự\nchế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã\nrời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu\nlại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của\nnó là một cặp `(a,b)`, không có khoá riêng cho một dòng."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_e7ef34e35d4eed7fe2ce3988ff7839e0"
}
```

## Entry claim_2b9b0c26c915c8b9945004689300d073

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_2b9b0c26c915c8b9945004689300d073",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "claimId": "claim_2b9b0c26c915c8b9945004689300d073",
    "sourceAnchor": "unheaded-block-29",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "claimId": "claim_2b9b0c26c915c8b9945004689300d073",
    "sourceAnchor": "unheaded-block-30",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-29",
    "githubAnchor": "unheaded-block-29",
    "stableAnchor": "unheaded-block-29",
    "title": "Unheaded block 29",
    "startLine": 252,
    "endLine": 253,
    "textDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "sample": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb).",
    "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "ancestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "text": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-30",
    "githubAnchor": "unheaded-block-30",
    "stableAnchor": "unheaded-block-30",
    "title": "Unheaded block 30",
    "startLine": 262,
    "endLine": 263,
    "textDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "sample": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb).",
    "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "ancestry": [
      "CLI I/O Contract",
      "6. Cursor Pagination"
    ],
    "text": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_2b9b0c26c915c8b9945004689300d073"
}
```

## Entry claim_30a9d0de08bcf9a5c7397edee6c8943a

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_30a9d0de08bcf9a5c7397edee6c8943a",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "claimId": "claim_30a9d0de08bcf9a5c7397edee6c8943a",
    "sourceAnchor": "unheaded-block-30",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "claimId": "claim_30a9d0de08bcf9a5c7397edee6c8943a",
    "sourceAnchor": "unheaded-block-31",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-30",
    "githubAnchor": "unheaded-block-30",
    "stableAnchor": "unheaded-block-30",
    "title": "Unheaded block 30",
    "startLine": 259,
    "endLine": 274,
    "textDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "sample": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` k",
    "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc))."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-31",
    "githubAnchor": "unheaded-block-31",
    "stableAnchor": "unheaded-block-31",
    "title": "Unheaded block 31",
    "startLine": 269,
    "endLine": 284,
    "textDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
    "sample": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` k",
    "identityFingerprint": "32c6dad9c72451cefbaa2daad7d5abc2f6a32ee533e487fb41a7ca37f6994400",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng\nmáy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành\n`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào\n`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị\nxoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,\nlược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một\nlistener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì\nhard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc\ntrong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ\ngiúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với\nmột tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của\n`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb\nđánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in\ndòng \"positional: `<tên>`\" cho tham số này, KHÔNG BAO GIỜ in nhầm thành\n\"required: `--<tên>`\" như một cờ thật — một tham số vừa nhận positional vừa\nnhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc))."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_30a9d0de08bcf9a5c7397edee6c8943a"
}
```

## Entry claim_04292efdbc4e0d275d80e978702ae3e8

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_04292efdbc4e0d275d80e978702ae3e8",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "c3dddccd9f6b4e83539167b84ac8eac025517acefb8eb3a2ef306bb667383064",
    "identityFingerprint": "c3dddccd9f6b4e83539167b84ac8eac025517acefb8eb3a2ef306bb667383064",
    "claimId": "claim_04292efdbc4e0d275d80e978702ae3e8",
    "sourceAnchor": "unheaded-block-31",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "c3dddccd9f6b4e83539167b84ac8eac025517acefb8eb3a2ef306bb667383064",
    "identityFingerprint": "c3dddccd9f6b4e83539167b84ac8eac025517acefb8eb3a2ef306bb667383064",
    "claimId": "claim_04292efdbc4e0d275d80e978702ae3e8",
    "sourceAnchor": "unheaded-block-32",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-31",
    "githubAnchor": "unheaded-block-31",
    "stableAnchor": "unheaded-block-31",
    "title": "Unheaded block 31",
    "startLine": 276,
    "endLine": 287,
    "textDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "sample": "**Sub-verb (lane help của plan two-doors-one-rununit, 2026-10-14).** Verb\ncó sub-verb ở vị trí đầu (`dispatch`, `workflow`, `merge`, `session`,\n`gateway`, `goal`, `tool`, `agents`,",
    "identityFingerprint": "c3dddccd9f6b4e83539167b84ac8eac025517acefb8eb3a2ef306bb667383064",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "**Sub-verb (lane help của plan two-doors-one-rununit, 2026-10-14).** Verb\ncó sub-verb ở vị trí đầu (`dispatch`, `workflow`, `merge`, `session`,\n`gateway`, `goal`, `tool`, `agents`, và verb chạy ở Rust host `metrics`,\n`friction`, `convention`) mang thêm `subcommands: {<sub>: {description,\nparameters, examples}}` — `parameters` của từng sub-verb chỉ chứa cờ mà\nsub-verb đó thật sự đọc, cùng dạng `{type, properties, required,\npositional?}`. `parameters` cấp verb của các verb này chỉ còn `sub` (enum\nđúng bằng các khoá của `subcommands`, sinh ra từ đó — một nguồn). Schema\ntừng sub-verb khớp cờ handler thật đọc, hai chiều (test\n`test/cli/subcommand-flag-drift.test.mjs`, quét tĩnh mã nguồn; với verb\nRust host thì đối chiếu `AVAILABLE_SUBCOMMANDS` và cờ trong mã Rust của\nsub-verb đó)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-32",
    "githubAnchor": "unheaded-block-32",
    "stableAnchor": "unheaded-block-32",
    "title": "Unheaded block 32",
    "startLine": 286,
    "endLine": 297,
    "textDigest": "a5128895b71f07c2e1baa3ecb90cd302f016fdb4191518ef02835a768c8dc156",
    "sample": "**Sub-verb (lane help của plan two-doors-one-rununit, 2026-10-14).** Verb\ncó sub-verb ở vị trí đầu (`dispatch`, `workflow`, `merge`, `session`,\n`gateway`, `goal`, `tool`, `agents`,",
    "identityFingerprint": "c3dddccd9f6b4e83539167b84ac8eac025517acefb8eb3a2ef306bb667383064",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "**Sub-verb (lane help của plan two-doors-one-rununit, 2026-10-14).** Verb\ncó sub-verb ở vị trí đầu (`dispatch`, `workflow`, `merge`, `session`,\n`gateway`, `goal`, `tool`, `agents`, và verb chạy ở Rust host `metrics`,\n`friction`, `convention`) mang thêm `subcommands: {<sub>: {description,\nparameters, examples}}` — `parameters` của từng sub-verb chỉ chứa cờ mà\nsub-verb đó thật sự đọc, cùng dạng `{type, properties, required,\npositional?}`. `parameters` cấp verb của các verb này chỉ còn `sub` (enum\nđúng bằng các khoá của `subcommands`, sinh ra từ đó — một nguồn). Schema\ntừng sub-verb khớp cờ handler thật đọc, hai chiều (test\n`test/cli/subcommand-flag-drift.test.mjs`, quét tĩnh mã nguồn; với verb\nRust host thì đối chiếu `AVAILABLE_SUBCOMMANDS` và cờ trong mã Rust của\nsub-verb đó)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_04292efdbc4e0d275d80e978702ae3e8"
}
```

## Entry claim_ec97464d041657707774c6c50771b151

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_ec97464d041657707774c6c50771b151",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "claimId": "claim_ec97464d041657707774c6c50771b151",
    "sourceAnchor": "unheaded-block-32",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "claimId": "claim_ec97464d041657707774c6c50771b151",
    "sourceAnchor": "unheaded-block-33",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-32",
    "githubAnchor": "unheaded-block-32",
    "stableAnchor": "unheaded-block-32",
    "title": "Unheaded block 32",
    "startLine": 289,
    "endLine": 296,
    "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-33",
    "githubAnchor": "unheaded-block-33",
    "stableAnchor": "unheaded-block-33",
    "title": "Unheaded block 33",
    "startLine": 299,
    "endLine": 306,
    "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Manifest Shape"
    ],
    "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_ec97464d041657707774c6c50771b151"
}
```

## Entry claim_f87ba30b5de56939a7fa614030efce48

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_f87ba30b5de56939a7fa614030efce48",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "claimId": "claim_f87ba30b5de56939a7fa614030efce48",
    "sourceAnchor": "unheaded-block-33",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "claimId": "claim_f87ba30b5de56939a7fa614030efce48",
    "sourceAnchor": "unheaded-block-34",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-33",
    "githubAnchor": "unheaded-block-33",
    "stableAnchor": "unheaded-block-33",
    "title": "Unheaded block 33",
    "startLine": 300,
    "endLine": 310,
    "textDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "sample": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` ",
    "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-34",
    "githubAnchor": "unheaded-block-34",
    "stableAnchor": "unheaded-block-34",
    "title": "Unheaded block 34",
    "startLine": 310,
    "endLine": 320,
    "textDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "sample": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` ",
    "identityFingerprint": "abdaf7574d8107b6e5d325a95cb8c7327dac1248939788580176154fa990dace",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f87ba30b5de56939a7fa614030efce48"
}
```

## Entry claim_f8d732956d895365272400e4f7e8279b

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_f8d732956d895365272400e4f7e8279b",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "claimId": "claim_f8d732956d895365272400e4f7e8279b",
    "sourceAnchor": "unheaded-block-34",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "claimId": "claim_f8d732956d895365272400e4f7e8279b",
    "sourceAnchor": "unheaded-block-35",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-34",
    "githubAnchor": "unheaded-block-34",
    "stableAnchor": "unheaded-block-34",
    "title": "Unheaded block 34",
    "startLine": 312,
    "endLine": 326,
    "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-35",
    "githubAnchor": "unheaded-block-35",
    "stableAnchor": "unheaded-block-35",
    "title": "Unheaded block 35",
    "startLine": 322,
    "endLine": 336,
    "textDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "a2e363fadb4249200e60df2aadad52b9400844e58930f9461c17ddb0feb33e8d",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f8d732956d895365272400e4f7e8279b"
}
```

## Entry claim_764256647fca6cf7257ca0b2c0e8e477

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_764256647fca6cf7257ca0b2c0e8e477",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "claimId": "claim_764256647fca6cf7257ca0b2c0e8e477",
    "sourceAnchor": "unheaded-block-35",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "claimId": "claim_764256647fca6cf7257ca0b2c0e8e477",
    "sourceAnchor": "unheaded-block-36",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-35",
    "githubAnchor": "unheaded-block-35",
    "stableAnchor": "unheaded-block-35",
    "title": "Unheaded block 35",
    "startLine": 328,
    "endLine": 329,
    "textDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "sample": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38.",
    "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-36",
    "githubAnchor": "unheaded-block-36",
    "stableAnchor": "unheaded-block-36",
    "title": "Unheaded block 36",
    "startLine": 338,
    "endLine": 339,
    "textDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "sample": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38.",
    "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry",
      "Entry Fields And Effect Axes"
    ],
    "text": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_764256647fca6cf7257ca0b2c0e8e477"
}
```

## Entry claim_55aab2ee6b56137762f5c87ea550daad

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_55aab2ee6b56137762f5c87ea550daad",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "3106ff6efc6244bea6ee9a9696727e25ff45124b65419573616164315cfb46dd",
    "identityFingerprint": "3106ff6efc6244bea6ee9a9696727e25ff45124b65419573616164315cfb46dd",
    "claimId": "claim_55aab2ee6b56137762f5c87ea550daad",
    "sourceAnchor": "unheaded-block-36",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "3106ff6efc6244bea6ee9a9696727e25ff45124b65419573616164315cfb46dd",
    "identityFingerprint": "3106ff6efc6244bea6ee9a9696727e25ff45124b65419573616164315cfb46dd",
    "claimId": "claim_55aab2ee6b56137762f5c87ea550daad",
    "sourceAnchor": "unheaded-block-37",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-36",
    "githubAnchor": "unheaded-block-36",
    "stableAnchor": "unheaded-block-36",
    "title": "Unheaded block 36",
    "startLine": 333,
    "endLine": 340,
    "textDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "sample": "**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm\ntrường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham\nsố nào mang nhiều giá trị — trướ",
    "identityFingerprint": "3106ff6efc6244bea6ee9a9696727e25ff45124b65419573616164315cfb46dd",
    "ancestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ],
    "text": "**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm\ntrường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham\nsố nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi\nmô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang\n`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang\n`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn\nbản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị\nkhông có trường này."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-37",
    "githubAnchor": "unheaded-block-37",
    "stableAnchor": "unheaded-block-37",
    "title": "Unheaded block 37",
    "startLine": 343,
    "endLine": 350,
    "textDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
    "sample": "**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm\ntrường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham\nsố nào mang nhiều giá trị — trướ",
    "identityFingerprint": "3106ff6efc6244bea6ee9a9696727e25ff45124b65419573616164315cfb46dd",
    "ancestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ],
    "text": "**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm\ntrường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham\nsố nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi\nmô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang\n`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang\n`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn\nbản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị\nkhông có trường này."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_55aab2ee6b56137762f5c87ea550daad"
}
```

## Entry claim_587d1adddb37253c6b6780b9a00c6b59

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_587d1adddb37253c6b6780b9a00c6b59",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "claimId": "claim_587d1adddb37253c6b6780b9a00c6b59",
    "sourceAnchor": "unheaded-block-37",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "claimId": "claim_587d1adddb37253c6b6780b9a00c6b59",
    "sourceAnchor": "unheaded-block-38",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-37",
    "githubAnchor": "unheaded-block-37",
    "stableAnchor": "unheaded-block-37",
    "title": "Unheaded block 37",
    "startLine": 342,
    "endLine": 346,
    "textDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "sample": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý k",
    "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "ancestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ],
    "text": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự\nchứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;\nnay đọc được bằng máy."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-38",
    "githubAnchor": "unheaded-block-38",
    "stableAnchor": "unheaded-block-38",
    "title": "Unheaded block 38",
    "startLine": 352,
    "endLine": 356,
    "textDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "sample": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý k",
    "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "ancestry": [
      "CLI I/O Contract",
      "8. Multi-Value Flag Convention"
    ],
    "text": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự\nchứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;\nnay đọc được bằng máy."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_587d1adddb37253c6b6780b9a00c6b59"
}
```

## Entry claim_f9ac232fb9e071915de2f018cd16d232

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_f9ac232fb9e071915de2f018cd16d232",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "77aa7806dddff77fc090234e473475a502ada0a2a61fcd16e9115f59463f4562",
    "identityFingerprint": "77aa7806dddff77fc090234e473475a502ada0a2a61fcd16e9115f59463f4562",
    "claimId": "claim_f9ac232fb9e071915de2f018cd16d232",
    "sourceAnchor": "unheaded-block-38",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "77aa7806dddff77fc090234e473475a502ada0a2a61fcd16e9115f59463f4562",
    "identityFingerprint": "77aa7806dddff77fc090234e473475a502ada0a2a61fcd16e9115f59463f4562",
    "claimId": "claim_f9ac232fb9e071915de2f018cd16d232",
    "sourceAnchor": "unheaded-block-39",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-38",
    "githubAnchor": "unheaded-block-38",
    "stableAnchor": "unheaded-block-38",
    "title": "Unheaded block 38",
    "startLine": 350,
    "endLine": 355,
    "textDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "sample": "Gọi `--help` (hoặc `-h`) SAU tên một verb cụ thể (vd `fgos submit\n--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,\nví dụ) — không phải toàn bộ sổ verb. Áp",
    "identityFingerprint": "77aa7806dddff77fc090234e473475a502ada0a2a61fcd16e9115f59463f4562",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "Gọi `--help` (hoặc `-h`) SAU tên một verb cụ thể (vd `fgos submit\n--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,\nví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả\n`init` và verb chạy ở Rust host (`version`, `metrics`, `friction`,\n`convention`, `gate-bypass`): Rust host giao mọi lời gọi có token help cho\npayload Node, nơi giữ sổ verb, thay vì chạy verb."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-39",
    "githubAnchor": "unheaded-block-39",
    "stableAnchor": "unheaded-block-39",
    "title": "Unheaded block 39",
    "startLine": 360,
    "endLine": 365,
    "textDigest": "7cb2dbfd3b698c923c15d17222daf08e96f5fcbf54aa79afd3e1248fdd8d9b2e",
    "sample": "Gọi `--help` (hoặc `-h`) SAU tên một verb cụ thể (vd `fgos submit\n--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,\nví dụ) — không phải toàn bộ sổ verb. Áp",
    "identityFingerprint": "77aa7806dddff77fc090234e473475a502ada0a2a61fcd16e9115f59463f4562",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "Gọi `--help` (hoặc `-h`) SAU tên một verb cụ thể (vd `fgos submit\n--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,\nví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả\n`init` và verb chạy ở Rust host (`version`, `metrics`, `friction`,\n`convention`, `gate-bypass`): Rust host giao mọi lời gọi có token help cho\npayload Node, nơi giữ sổ verb, thay vì chạy verb."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f9ac232fb9e071915de2f018cd16d232"
}
```

## Entry claim_e13202e5fb3991e61452914186b2920c

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_e13202e5fb3991e61452914186b2920c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "cc33e86f1358175bdfc8be1ff1815c56c51c055eeae3cdf43fdf3ff47c7b14f0",
    "identityFingerprint": "cc33e86f1358175bdfc8be1ff1815c56c51c055eeae3cdf43fdf3ff47c7b14f0",
    "claimId": "claim_e13202e5fb3991e61452914186b2920c",
    "sourceAnchor": "unheaded-block-39",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "cc33e86f1358175bdfc8be1ff1815c56c51c055eeae3cdf43fdf3ff47c7b14f0",
    "identityFingerprint": "cc33e86f1358175bdfc8be1ff1815c56c51c055eeae3cdf43fdf3ff47c7b14f0",
    "claimId": "claim_e13202e5fb3991e61452914186b2920c",
    "sourceAnchor": "unheaded-block-40",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-39",
    "githubAnchor": "unheaded-block-39",
    "stableAnchor": "unheaded-block-39",
    "title": "Unheaded block 39",
    "startLine": 357,
    "endLine": 370,
    "textDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "sample": "- **Dạng máy-đọc:** kèm `--json` thì in đúng object của verb đó như trong\n  `commands[]` của sổ verb, không bọc phong bì. Với verb có sub-verb, đối\n  số vị trí đầu tiên thu hẹp mục",
    "identityFingerprint": "cc33e86f1358175bdfc8be1ff1815c56c51c055eeae3cdf43fdf3ff47c7b14f0",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "- **Dạng máy-đọc:** kèm `--json` thì in đúng object của verb đó như trong\n  `commands[]` của sổ verb, không bọc phong bì. Với verb có sub-verb, đối\n  số vị trí đầu tiên thu hẹp mục về một sub-verb (`subcommands` chỉ còn\n  sub-verb đó); sub-verb không có trong sổ → thoát mã 4, stdout rỗng. Với\n  verb không có sub-verb, đối số vị trí là đối số của verb (vd prompt của\n  `run`) và bị bỏ qua.\n- **Token help:** `--help`/`-h` đứng riêng ở BẤT KỲ vị trí nào là yêu cầu\n  trợ giúp — kể cả khi đứng sau một cờ nhận giá trị (`fgos init --dir -h`)\n  — ở cả Rust host lẫn payload Node, nên trợ giúp không bao giờ lỡ tay\n  chạy verb.\n- **Dạng đầu dòng:** `fgos --help|-h [<verb> [<sub>]] [--json] [--dir\n  <x>]` in toàn bộ sổ verb, hoặc mục của một verb/sub-verb. `--dir` (cờ hàm\n  shell `fgos` tự gắn vào mọi lời gọi) được nhận và không dùng; verb lạ,\n  sub-verb lạ, từ thừa hay option khác → thoát mã 4, stdout rỗng."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-40",
    "githubAnchor": "unheaded-block-40",
    "stableAnchor": "unheaded-block-40",
    "title": "Unheaded block 40",
    "startLine": 367,
    "endLine": 380,
    "textDigest": "9b711cb5a088ede56ad00207289f1fed2ccc05887597169bbc41eb2e55429db3",
    "sample": "- **Dạng máy-đọc:** kèm `--json` thì in đúng object của verb đó như trong\n  `commands[]` của sổ verb, không bọc phong bì. Với verb có sub-verb, đối\n  số vị trí đầu tiên thu hẹp mục",
    "identityFingerprint": "cc33e86f1358175bdfc8be1ff1815c56c51c055eeae3cdf43fdf3ff47c7b14f0",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "- **Dạng máy-đọc:** kèm `--json` thì in đúng object của verb đó như trong\n  `commands[]` của sổ verb, không bọc phong bì. Với verb có sub-verb, đối\n  số vị trí đầu tiên thu hẹp mục về một sub-verb (`subcommands` chỉ còn\n  sub-verb đó); sub-verb không có trong sổ → thoát mã 4, stdout rỗng. Với\n  verb không có sub-verb, đối số vị trí là đối số của verb (vd prompt của\n  `run`) và bị bỏ qua.\n- **Token help:** `--help`/`-h` đứng riêng ở BẤT KỲ vị trí nào là yêu cầu\n  trợ giúp — kể cả khi đứng sau một cờ nhận giá trị (`fgos init --dir -h`)\n  — ở cả Rust host lẫn payload Node, nên trợ giúp không bao giờ lỡ tay\n  chạy verb.\n- **Dạng đầu dòng:** `fgos --help|-h [<verb> [<sub>]] [--json] [--dir\n  <x>]` in toàn bộ sổ verb, hoặc mục của một verb/sub-verb. `--dir` (cờ hàm\n  shell `fgos` tự gắn vào mọi lời gọi) được nhận và không dùng; verb lạ,\n  sub-verb lạ, từ thừa hay option khác → thoát mã 4, stdout rỗng."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_e13202e5fb3991e61452914186b2920c"
}
```

## Entry claim_4b57ee512cc014fc094a3dad6f72d5c7

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_4b57ee512cc014fc094a3dad6f72d5c7",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a4b8f46267345e4fc04574b601726648feb938131fcf8d1d3ead6872ed968d73",
    "identityFingerprint": "a4b8f46267345e4fc04574b601726648feb938131fcf8d1d3ead6872ed968d73",
    "claimId": "claim_4b57ee512cc014fc094a3dad6f72d5c7",
    "sourceAnchor": "unheaded-block-40",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a4b8f46267345e4fc04574b601726648feb938131fcf8d1d3ead6872ed968d73",
    "identityFingerprint": "a4b8f46267345e4fc04574b601726648feb938131fcf8d1d3ead6872ed968d73",
    "claimId": "claim_4b57ee512cc014fc094a3dad6f72d5c7",
    "sourceAnchor": "unheaded-block-41",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-40",
    "githubAnchor": "unheaded-block-40",
    "stableAnchor": "unheaded-block-40",
    "title": "Unheaded block 40",
    "startLine": 372,
    "endLine": 383,
    "textDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "sample": "- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào\n  trong sổ verb.\n- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp\n  riêng.\n- **W",
    "identityFingerprint": "a4b8f46267345e4fc04574b601726648feb938131fcf8d1d3ead6872ed968d73",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào\n  trong sổ verb.\n- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp\n  riêng.\n- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,\n  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos\n  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).\n- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác\n  dụng phụ khi gọi thật (vd `init`).\n- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát\n  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,\n  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ))."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-41",
    "githubAnchor": "unheaded-block-41",
    "stableAnchor": "unheaded-block-41",
    "title": "Unheaded block 41",
    "startLine": 382,
    "endLine": 393,
    "textDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
    "sample": "- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào\n  trong sổ verb.\n- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp\n  riêng.\n- **W",
    "identityFingerprint": "a4b8f46267345e4fc04574b601726648feb938131fcf8d1d3ead6872ed968d73",
    "ancestry": [
      "CLI I/O Contract",
      "9. Per-Verb Help"
    ],
    "text": "- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào\n  trong sổ verb.\n- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp\n  riêng.\n- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,\n  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos\n  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).\n- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác\n  dụng phụ khi gọi thật (vd `init`).\n- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát\n  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,\n  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ))."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_4b57ee512cc014fc094a3dad6f72d5c7"
}
```

## Entry claim_4a9967445e7d9d61d02d659b48733620

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_4a9967445e7d9d61d02d659b48733620",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "88147338a93e7d589904d36f6d85470d19e7d0e75ac270e2a2e465f1255292a7",
    "identityFingerprint": "88147338a93e7d589904d36f6d85470d19e7d0e75ac270e2a2e465f1255292a7",
    "claimId": "claim_4a9967445e7d9d61d02d659b48733620",
    "sourceAnchor": "unheaded-block-41",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a378c81f6a84c5e3ed9b38917f7136c55dcc4af85295bcf105fa9ac9d6792532",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "88147338a93e7d589904d36f6d85470d19e7d0e75ac270e2a2e465f1255292a7",
    "identityFingerprint": "88147338a93e7d589904d36f6d85470d19e7d0e75ac270e2a2e465f1255292a7",
    "claimId": "claim_4a9967445e7d9d61d02d659b48733620",
    "sourceAnchor": "unheaded-block-42",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a378c81f6a84c5e3ed9b38917f7136c55dcc4af85295bcf105fa9ac9d6792532",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-41",
    "githubAnchor": "unheaded-block-41",
    "stableAnchor": "unheaded-block-41",
    "title": "Unheaded block 41",
    "startLine": 387,
    "endLine": 388,
    "textDigest": "a378c81f6a84c5e3ed9b38917f7136c55dcc4af85295bcf105fa9ac9d6792532",
    "sample": "Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi\ncontract mang version tường minh trong định danh của chính nó.",
    "identityFingerprint": "88147338a93e7d589904d36f6d85470d19e7d0e75ac270e2a2e465f1255292a7",
    "ancestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "text": "Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi\ncontract mang version tường minh trong định danh của chính nó."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-42",
    "githubAnchor": "unheaded-block-42",
    "stableAnchor": "unheaded-block-42",
    "title": "Unheaded block 42",
    "startLine": 397,
    "endLine": 398,
    "textDigest": "a378c81f6a84c5e3ed9b38917f7136c55dcc4af85295bcf105fa9ac9d6792532",
    "sample": "Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi\ncontract mang version tường minh trong định danh của chính nó.",
    "identityFingerprint": "88147338a93e7d589904d36f6d85470d19e7d0e75ac270e2a2e465f1255292a7",
    "ancestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "text": "Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi\ncontract mang version tường minh trong định danh của chính nó."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_4a9967445e7d9d61d02d659b48733620"
}
```

## Entry claim_1c1d4afc14a1cc1bc4b982bf69387d55

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_1c1d4afc14a1cc1bc4b982bf69387d55",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "claimId": "claim_1c1d4afc14a1cc1bc4b982bf69387d55",
    "sourceAnchor": "unheaded-block-42",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "claimId": "claim_1c1d4afc14a1cc1bc4b982bf69387d55",
    "sourceAnchor": "unheaded-block-43",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-42",
    "githubAnchor": "unheaded-block-42",
    "stableAnchor": "unheaded-block-42",
    "title": "Unheaded block 42",
    "startLine": 390,
    "endLine": 396,
    "textDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "sample": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phầ",
    "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "ancestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "text": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |\n| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |\n| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |\n| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-43",
    "githubAnchor": "unheaded-block-43",
    "stableAnchor": "unheaded-block-43",
    "title": "Unheaded block 43",
    "startLine": 400,
    "endLine": 406,
    "textDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "sample": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phầ",
    "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "ancestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "text": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |\n| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |\n| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |\n| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_1c1d4afc14a1cc1bc4b982bf69387d55"
}
```

## Entry claim_1f6dd7f2cb7aa5e61eb8b9232513b51c

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_1f6dd7f2cb7aa5e61eb8b9232513b51c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "claimId": "claim_1f6dd7f2cb7aa5e61eb8b9232513b51c",
    "sourceAnchor": "unheaded-block-43",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "claimId": "claim_1f6dd7f2cb7aa5e61eb8b9232513b51c",
    "sourceAnchor": "unheaded-block-44",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-43",
    "githubAnchor": "unheaded-block-43",
    "stableAnchor": "unheaded-block-43",
    "title": "Unheaded block 43",
    "startLine": 398,
    "endLine": 399,
    "textDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "sample": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định.",
    "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "ancestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "text": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-44",
    "githubAnchor": "unheaded-block-44",
    "stableAnchor": "unheaded-block-44",
    "title": "Unheaded block 44",
    "startLine": 408,
    "endLine": 409,
    "textDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "sample": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định.",
    "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "ancestry": [
      "CLI I/O Contract",
      "10. Version Tokens"
    ],
    "text": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_1f6dd7f2cb7aa5e61eb8b9232513b51c"
}
```

## Entry claim_82d56ca63fdae091877a9bbb5c3c6c8c

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_82d56ca63fdae091877a9bbb5c3c6c8c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "claimId": "claim_82d56ca63fdae091877a9bbb5c3c6c8c",
    "sourceAnchor": "unheaded-block-44",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "claimId": "claim_82d56ca63fdae091877a9bbb5c3c6c8c",
    "sourceAnchor": "unheaded-block-45",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-44",
    "githubAnchor": "unheaded-block-44",
    "stableAnchor": "unheaded-block-44",
    "title": "Unheaded block 44",
    "startLine": 403,
    "endLine": 405,
    "textDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "sample": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:",
    "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-45",
    "githubAnchor": "unheaded-block-45",
    "stableAnchor": "unheaded-block-45",
    "title": "Unheaded block 45",
    "startLine": 413,
    "endLine": 415,
    "textDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "sample": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:",
    "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_82d56ca63fdae091877a9bbb5c3c6c8c"
}
```

## Entry claim_00752b4b2a11e39acaef4a6bdb9f6aaf

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_00752b4b2a11e39acaef4a6bdb9f6aaf",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "claimId": "claim_00752b4b2a11e39acaef4a6bdb9f6aaf",
    "sourceAnchor": "unheaded-block-45",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "claimId": "claim_00752b4b2a11e39acaef4a6bdb9f6aaf",
    "sourceAnchor": "unheaded-block-46",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-45",
    "githubAnchor": "unheaded-block-45",
    "stableAnchor": "unheaded-block-45",
    "title": "Unheaded block 45",
    "startLine": 407,
    "endLine": 412,
    "textDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "sample": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daem",
    "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.\n- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.\n- **Tầng phân quyền** (\"ai được gọi verb nào\", caller chưa xác danh có bị\n  chặn hay không) — thuộc STR38."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-46",
    "githubAnchor": "unheaded-block-46",
    "stableAnchor": "unheaded-block-46",
    "title": "Unheaded block 46",
    "startLine": 417,
    "endLine": 422,
    "textDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "sample": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daem",
    "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.\n- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.\n- **Tầng phân quyền** (\"ai được gọi verb nào\", caller chưa xác danh có bị\n  chặn hay không) — thuộc STR38."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_00752b4b2a11e39acaef4a6bdb9f6aaf"
}
```

## Entry claim_60d9cc75aabe29c3ddb361d489849aec

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_60d9cc75aabe29c3ddb361d489849aec",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "claimId": "claim_60d9cc75aabe29c3ddb361d489849aec",
    "sourceAnchor": "unheaded-block-46",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "claimId": "claim_60d9cc75aabe29c3ddb361d489849aec",
    "sourceAnchor": "unheaded-block-47",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-46",
    "githubAnchor": "unheaded-block-46",
    "stableAnchor": "unheaded-block-46",
    "title": "Unheaded block 46",
    "startLine": 414,
    "endLine": 416,
    "textDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "sample": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, ",
    "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-47",
    "githubAnchor": "unheaded-block-47",
    "stableAnchor": "unheaded-block-47",
    "title": "Unheaded block 47",
    "startLine": 424,
    "endLine": 426,
    "textDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "sample": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, ",
    "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_60d9cc75aabe29c3ddb361d489849aec"
}
```

## Entry claim_4625ce7449b0442caddda4d3d41ac84d

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_4625ce7449b0442caddda4d3d41ac84d",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "claimId": "claim_4625ce7449b0442caddda4d3d41ac84d",
    "sourceAnchor": "unheaded-block-47",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "claimId": "claim_4625ce7449b0442caddda4d3d41ac84d",
    "sourceAnchor": "unheaded-block-48",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-47",
    "githubAnchor": "unheaded-block-47",
    "stableAnchor": "unheaded-block-47",
    "title": "Unheaded block 47",
    "startLine": 418,
    "endLine": 421,
    "textDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "sample": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discove",
    "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải\ncửa ra tới người)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-48",
    "githubAnchor": "unheaded-block-48",
    "stableAnchor": "unheaded-block-48",
    "title": "Unheaded block 48",
    "startLine": 428,
    "endLine": 431,
    "textDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "sample": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discove",
    "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "ancestry": [
      "CLI I/O Contract",
      "11. Scope Boundary"
    ],
    "text": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải\ncửa ra tới người)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_4625ce7449b0442caddda4d3d41ac84d"
}
```

## Entry claim_d36f51d7eb1767c7a204cd7d8f3b18c0

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_d36f51d7eb1767c7a204cd7d8f3b18c0",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "claimId": "claim_d36f51d7eb1767c7a204cd7d8f3b18c0",
    "sourceAnchor": "unheaded-block-48",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "claimId": "claim_d36f51d7eb1767c7a204cd7d8f3b18c0",
    "sourceAnchor": "unheaded-block-49",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-48",
    "githubAnchor": "unheaded-block-48",
    "stableAnchor": "unheaded-block-48",
    "title": "Unheaded block 48",
    "startLine": 425,
    "endLine": 431,
    "textDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "sample": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envel",
    "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "ancestry": [
      "CLI I/O Contract",
      "12. References"
    ],
    "text": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người\nghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope\nstdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng\nký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định\nkhoá, plan.md bốn lát)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-49",
    "githubAnchor": "unheaded-block-49",
    "stableAnchor": "unheaded-block-49",
    "title": "Unheaded block 49",
    "startLine": 435,
    "endLine": 441,
    "textDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "sample": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envel",
    "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "ancestry": [
      "CLI I/O Contract",
      "12. References"
    ],
    "text": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người\nghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope\nstdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng\nký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định\nkhoá, plan.md bốn lát)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_d36f51d7eb1767c7a204cd7d8f3b18c0"
}
```

## Entry claim_3a33dd186893d5e3ec604bd468c1466e

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_3a33dd186893d5e3ec604bd468c1466e",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a73dce0c1bbba31643301ee1ec303e8912b38e04184311a30a198fd1c4e4fca2",
    "identityFingerprint": "a73dce0c1bbba31643301ee1ec303e8912b38e04184311a30a198fd1c4e4fca2",
    "claimId": "claim_3a33dd186893d5e3ec604bd468c1466e",
    "sourceAnchor": "unheaded-block-49",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "a73dce0c1bbba31643301ee1ec303e8912b38e04184311a30a198fd1c4e4fca2",
    "identityFingerprint": "a73dce0c1bbba31643301ee1ec303e8912b38e04184311a30a198fd1c4e4fca2",
    "claimId": "claim_3a33dd186893d5e3ec604bd468c1466e",
    "sourceAnchor": "unheaded-block-50",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-49",
    "githubAnchor": "unheaded-block-49",
    "stableAnchor": "unheaded-block-49",
    "title": "Unheaded block 49",
    "startLine": 435,
    "endLine": 439,
    "textDigest": "6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0",
    "sample": "- [Work State portal](../README.md)\n- [Work State spec](../spec.md)\n- [Retired decision history](../decisions/retired-decision-history.md)\n- [Legacy source: docs/specs/work-state.m",
    "identityFingerprint": "a73dce0c1bbba31643301ee1ec303e8912b38e04184311a30a198fd1c4e4fca2",
    "ancestry": [
      "CLI I/O Contract",
      "13. Related Files"
    ],
    "text": "- [Work State portal](../README.md)\n- [Work State spec](../spec.md)\n- [Retired decision history](../decisions/retired-decision-history.md)\n- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)\n- [Legacy source: docs/io-contract.md](../../../io-contract.md)"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-50",
    "githubAnchor": "unheaded-block-50",
    "stableAnchor": "unheaded-block-50",
    "title": "Unheaded block 50",
    "startLine": 445,
    "endLine": 449,
    "textDigest": "6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0",
    "sample": "- [Work State portal](../README.md)\n- [Work State spec](../spec.md)\n- [Retired decision history](../decisions/retired-decision-history.md)\n- [Legacy source: docs/specs/work-state.m",
    "identityFingerprint": "a73dce0c1bbba31643301ee1ec303e8912b38e04184311a30a198fd1c4e4fca2",
    "ancestry": [
      "CLI I/O Contract",
      "13. Related Files"
    ],
    "text": "- [Work State portal](../README.md)\n- [Work State spec](../spec.md)\n- [Retired decision history](../decisions/retired-decision-history.md)\n- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)\n- [Legacy source: docs/io-contract.md](../../../io-contract.md)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_3a33dd186893d5e3ec604bd468c1466e"
}
```

## Entry claim_32a411cc1ef34025d21bebdcc0183c3f

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_32a411cc1ef34025d21bebdcc0183c3f",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "69bca5bbe2cc040da42f6a647f2d259a0408fb2b195fd3d6227e79ce786c4984",
    "identityFingerprint": "2908d45f61ea15e4ee80a62660a4b11a12097863afadc2c55ed5b67674f3a61d",
    "claimId": "claim_32a411cc1ef34025d21bebdcc0183c3f",
    "sourceAnchor": "writer-source-trust-levels",
    "unitKind": "heading",
    "sourceUnitDigest": "987e8f9f71703323f0ba7b5ca63c5dbddb7536ba1f69683e432efd4463da6890",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "3cb9e5e15557da62e5ae94f0aab2d267db33fb871649c1971cbbc441de04b6dc",
    "identityFingerprint": "0c9b5edc89a98a3f4864d8b26923c749046179ff000f912313ff5fe126fc9f00",
    "claimId": "claim_32a411cc1ef34025d21bebdcc0183c3f",
    "sourceAnchor": "writer-source-trust-levels",
    "unitKind": "heading",
    "sourceUnitDigest": "4f751accb88f58ecf5884341df15465c2160516e0c84109aef211ad11bee4df8",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "69bca5bbe2cc040da42f6a647f2d259a0408fb2b195fd3d6227e79ce786c4984",
      "toUnitDigest": "3cb9e5e15557da62e5ae94f0aab2d267db33fb871649c1971cbbc441de04b6dc",
      "fromSourceUnitDigest": "987e8f9f71703323f0ba7b5ca63c5dbddb7536ba1f69683e432efd4463da6890",
      "toSourceUnitDigest": "4f751accb88f58ecf5884341df15465c2160516e0c84109aef211ad11bee4df8"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Writer Source Trust Levels",
    "anchor": "writer-source-trust-levels",
    "githubAnchor": "writer-source-trust-levels",
    "stableAnchor": "h-929556827aa2",
    "startLine": 74,
    "endLine": 74,
    "textDigest": "987e8f9f71703323f0ba7b5ca63c5dbddb7536ba1f69683e432efd4463da6890",
    "sample": "Writer Source Trust Levels",
    "sectionPayloadDigest": "1e0381f5c2ec0793960c0bf5225ea27c40e4e532a94139f6c80d71ff1c8eb306",
    "followingBlockDigest": "b3d95b30cc6cd2a1b0bb6bd8bec47976bedba54191c94aeec67ff6441ebdefb6",
    "identityFingerprint": "2908d45f61ea15e4ee80a62660a4b11a12097863afadc2c55ed5b67674f3a61d",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity"
    ],
    "text": "### Writer Source Trust Levels",
    "sectionText": "### Writer Source Trust Levels\n\n| source | Ý nghĩa | Độ tin |\n|---|---|---|\n| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |\n| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |\n| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |\n| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |\n\n- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·\n  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,\n  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là\n  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn\n  `source` nói giá trị chưa kiểm chứng được)."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 3,
    "title": "Writer Source Trust Levels",
    "anchor": "writer-source-trust-levels",
    "githubAnchor": "writer-source-trust-levels",
    "stableAnchor": "h-929556827aa2",
    "startLine": 74,
    "endLine": 74,
    "textDigest": "4f751accb88f58ecf5884341df15465c2160516e0c84109aef211ad11bee4df8",
    "sample": "Writer Source Trust Levels",
    "sectionPayloadDigest": "0127fbf7af8c404c1243374865d4385be1937e9815d8a7ab9863a0df294b2c31",
    "followingBlockDigest": "b3d95b30cc6cd2a1b0bb6bd8bec47976bedba54191c94aeec67ff6441ebdefb6",
    "identityFingerprint": "0c9b5edc89a98a3f4864d8b26923c749046179ff000f912313ff5fe126fc9f00",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity"
    ],
    "text": "### Writer Source Trust Levels",
    "sectionText": "### Writer Source Trust Levels\n\n| source | Ý nghĩa | Độ tin |\n|---|---|---|\n| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |\n| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |\n| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |\n| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |\n\n- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·\n  `env` (biến môi trường, ai cũng set được) · `pid` (tổ tiên cao nhất còn\n  terminal, không có thì session id của tiến trình gọi; best-effort) ·\n  `unresolved` (không nguồn nào xác nhận được — `id` vẫn là\n  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn\n  `source` nói giá trị chưa kiểm chứng được). Luật đầy đủ (thứ tự biến env,\n  giới hạn đã biết) chỉ nằm ở [spec Session Identity](../../session-identity/spec.md);\n  nguồn duy nhất là crate Rust `fgos-session-identity`."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_32a411cc1ef34025d21bebdcc0183c3f"
}
```

## Entry claim_ac433070c1a842c2396a6fe4b6d5a0f6

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_ac433070c1a842c2396a6fe4b6d5a0f6",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/spec.md",
    "unitDigest": "e8260f9323f52bc3f4cbcc4ded3cbbb023882d2fe2c494b793e2996eb4728a5b",
    "identityFingerprint": "5010ba050b1889fd1926cfdc25a93fb6105f23992eadc228c5c052956c6d0216",
    "claimId": "claim_ac433070c1a842c2396a6fe4b6d5a0f6",
    "sourceAnchor": "16-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "864142701093c35660c7a6319e4a7f20c4f98b79992fba0f1129675624b40c77",
    "claimKind": "specification",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "b866fbe1dbb2639e584387d8c81daa45c1f5848b99b3b98267d2c531eca5e679",
      "toUnitDigest": "e8260f9323f52bc3f4cbcc4ded3cbbb023882d2fe2c494b793e2996eb4728a5b",
      "fromSourceUnitDigest": "59a9a1974b77ce531571c6cd728a1fcd53ed81b3a7d890f563145a9a5a6553bd",
      "toSourceUnitDigest": "864142701093c35660c7a6319e4a7f20c4f98b79992fba0f1129675624b40c77"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/spec.md",
    "unitDigest": "ee180247322e49efe42bc6115daa320acb329c9a3ba4c70fc962856334376f8f",
    "identityFingerprint": "ad0f07a3329d6fd7157a14ce0282d1cd5007deb69180c7afadeabb0ccfa0f719",
    "claimId": "claim_ac433070c1a842c2396a6fe4b6d5a0f6",
    "sourceAnchor": "16-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "9a02e832f3ff3a984664a32119ecc2a14bc98072bf9f867873ebe81e61f6d238",
    "claimKind": "specification",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "e8260f9323f52bc3f4cbcc4ded3cbbb023882d2fe2c494b793e2996eb4728a5b",
      "toUnitDigest": "ee180247322e49efe42bc6115daa320acb329c9a3ba4c70fc962856334376f8f",
      "fromSourceUnitDigest": "864142701093c35660c7a6319e4a7f20c4f98b79992fba0f1129675624b40c77",
      "toSourceUnitDigest": "9a02e832f3ff3a984664a32119ecc2a14bc98072bf9f867873ebe81e61f6d238"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "16. Related Files",
    "anchor": "16-related-files",
    "githubAnchor": "16-related-files",
    "stableAnchor": "h-85cb1aa0e7fc",
    "startLine": 1196,
    "endLine": 1196,
    "textDigest": "864142701093c35660c7a6319e4a7f20c4f98b79992fba0f1129675624b40c77",
    "sample": "16. Related Files",
    "sectionPayloadDigest": "ae8351ddf33a5f98ffee186a0df1514290ab474129e31446c6c5668ee12d69d2",
    "followingBlockDigest": "ae8351ddf33a5f98ffee186a0df1514290ab474129e31446c6c5668ee12d69d2",
    "identityFingerprint": "5010ba050b1889fd1926cfdc25a93fb6105f23992eadc228c5c052956c6d0216",
    "ancestry": [
      "Work State Specification"
    ],
    "text": "## 16. Related Files",
    "sectionText": "## 16. Related Files\n\n- [README.md](README.md)\n- [contracts/cli-io-contract.md](contracts/cli-io-contract.md)\n- [architecture/implementation-pointers.md](architecture/implementation-pointers.md)\n- [decisions/retired-decision-history.md](decisions/retired-decision-history.md)\n- [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md)\n- [docs/specs/work-state.md](../../specs/work-state.md)\n- [docs/platform/work-state/contracts/cli-io-contract.md](contracts/cli-io-contract.md)"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "16. Related Files",
    "anchor": "16-related-files",
    "githubAnchor": "16-related-files",
    "stableAnchor": "h-85cb1aa0e7fc",
    "startLine": 1196,
    "endLine": 1196,
    "textDigest": "9a02e832f3ff3a984664a32119ecc2a14bc98072bf9f867873ebe81e61f6d238",
    "sample": "16. Related Files",
    "sectionPayloadDigest": "43c88a88d0eb57f524b0b2768bb6132b7136f7c04066dbea712d00c731c3d9a4",
    "followingBlockDigest": "43c88a88d0eb57f524b0b2768bb6132b7136f7c04066dbea712d00c731c3d9a4",
    "identityFingerprint": "ad0f07a3329d6fd7157a14ce0282d1cd5007deb69180c7afadeabb0ccfa0f719",
    "ancestry": [
      "Work State Specification"
    ],
    "text": "## 16. Related Files",
    "sectionText": "## 16. Related Files\n\n- [README.md](README.md)\n- [contracts/cli-io-contract.md](contracts/cli-io-contract.md)\n- [architecture/implementation-pointers.md](architecture/implementation-pointers.md)\n- [decisions/retired-decision-history.md](decisions/retired-decision-history.md)\n- [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md)\n- [docs/specs/work-state.md](../../specs/work-state.md)\n- [docs/io-contract.md](../../io-contract.md)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_ac433070c1a842c2396a6fe4b6d5a0f6"
}
```

## Entry claim_70d702c35e3c5e23ef258e3918747c60

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_70d702c35e3c5e23ef258e3918747c60",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/spec.md",
    "unitDigest": "ad8795201dead4e5f371ee3e6b26e4efd8a4307813c9e43aa0c0995170783598",
    "identityFingerprint": "ad8795201dead4e5f371ee3e6b26e4efd8a4307813c9e43aa0c0995170783598",
    "claimId": "claim_70d702c35e3c5e23ef258e3918747c60",
    "sourceAnchor": "unheaded-block-99",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "43c88a88d0eb57f524b0b2768bb6132b7136f7c04066dbea712d00c731c3d9a4",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-99",
    "githubAnchor": "unheaded-block-99",
    "stableAnchor": "unheaded-block-99",
    "title": "Unheaded block 99",
    "startLine": 1198,
    "endLine": 1204,
    "textDigest": "43c88a88d0eb57f524b0b2768bb6132b7136f7c04066dbea712d00c731c3d9a4",
    "sample": "- [README.md](README.md)\n- [contracts/cli-io-contract.md](contracts/cli-io-contract.md)\n- [architecture/implementation-pointers.md](architecture/implementation-pointers.md)\n- [deci",
    "identityFingerprint": "ad8795201dead4e5f371ee3e6b26e4efd8a4307813c9e43aa0c0995170783598",
    "ancestry": [
      "Work State Specification",
      "16. Related Files"
    ],
    "text": "- [README.md](README.md)\n- [contracts/cli-io-contract.md](contracts/cli-io-contract.md)\n- [architecture/implementation-pointers.md](architecture/implementation-pointers.md)\n- [decisions/retired-decision-history.md](decisions/retired-decision-history.md)\n- [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md)\n- [docs/specs/work-state.md](../../specs/work-state.md)\n- [docs/io-contract.md](../../io-contract.md)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_70d702c35e3c5e23ef258e3918747c60"
}
```

## Entry claim_9c8387207fd0c025e7d643a97625a71d

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_9c8387207fd0c025e7d643a97625a71d",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "4c067e46a22ee1e7d2c99e6bc27df9081c49724699e71c35acd8b27465416174",
    "identityFingerprint": "e23a3974b42f609b3bbb3b069db11ea018cf52372321b14a770149822ca04110",
    "claimId": "claim_9c8387207fd0c025e7d643a97625a71d",
    "sourceAnchor": "1-start-here",
    "unitKind": "heading",
    "sourceUnitDigest": "1007e818be04d1b580f8e18e3bedc19de7cf71d6d2921441a08d7b04e1318e86",
    "claimKind": "navigation",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "a7da3c43e74d1d768ea65182735d03a160bbf0c0fedd960fa47e507ba45ab244",
      "toUnitDigest": "4c067e46a22ee1e7d2c99e6bc27df9081c49724699e71c35acd8b27465416174",
      "fromSourceUnitDigest": "a0c63d891be180aae3488da0c2035081f03d1e001bfd24499eabee67e7621d4b",
      "toSourceUnitDigest": "1007e818be04d1b580f8e18e3bedc19de7cf71d6d2921441a08d7b04e1318e86"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "4c067e46a22ee1e7d2c99e6bc27df9081c49724699e71c35acd8b27465416174",
    "identityFingerprint": "e23a3974b42f609b3bbb3b069db11ea018cf52372321b14a770149822ca04110",
    "claimId": "claim_9c8387207fd0c025e7d643a97625a71d",
    "sourceAnchor": "1-start-here",
    "unitKind": "heading",
    "sourceUnitDigest": "1007e818be04d1b580f8e18e3bedc19de7cf71d6d2921441a08d7b04e1318e86",
    "claimKind": "navigation",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Start Here",
    "anchor": "1-start-here",
    "githubAnchor": "1-start-here",
    "stableAnchor": "h-0b79d96bc9cc",
    "startLine": 26,
    "endLine": 26,
    "textDigest": "1007e818be04d1b580f8e18e3bedc19de7cf71d6d2921441a08d7b04e1318e86",
    "sample": "1. Start Here",
    "sectionPayloadDigest": "67798e09dff5c22bd679b1b04d1f4ee104f5699de0f19d8c9ebd18c7a8b19c17",
    "followingBlockDigest": "67798e09dff5c22bd679b1b04d1f4ee104f5699de0f19d8c9ebd18c7a8b19c17",
    "identityFingerprint": "e23a3974b42f609b3bbb3b069db11ea018cf52372321b14a770149822ca04110",
    "ancestry": [
      "Documentation Reading Map"
    ],
    "text": "## 1. Start Here",
    "sectionText": "## 1. Start Here\n\n| Need | Read |\n|---|---|\n| Understand documentation rules | [doc-governance.md](doc-governance.md) |\n| Resolve authority during transition | [transitional-switchboard.md](transitional-switchboard.md) |\n| Understand platform-wide docs | [platform/README.md](platform/README.md) |\n| Understand packaging, install, activation, setup, and doctor | [platform/packaging-distribution/README.md](platform/packaging-distribution/README.md) |\n| Understand the detailed product/source map | [Section 5](#5-detailed-product-and-source-map) |\n| Shape a new multi-round design | Create or update a discussion scratchpad |\n| Understand an area | `docs/platform/<area>/README.md`, or current legacy `docs/specs/<area>.md` during migration |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Start Here",
    "anchor": "1-start-here",
    "githubAnchor": "1-start-here",
    "stableAnchor": "h-0b79d96bc9cc",
    "startLine": 26,
    "endLine": 26,
    "textDigest": "1007e818be04d1b580f8e18e3bedc19de7cf71d6d2921441a08d7b04e1318e86",
    "sample": "1. Start Here",
    "sectionPayloadDigest": "67798e09dff5c22bd679b1b04d1f4ee104f5699de0f19d8c9ebd18c7a8b19c17",
    "followingBlockDigest": "67798e09dff5c22bd679b1b04d1f4ee104f5699de0f19d8c9ebd18c7a8b19c17",
    "identityFingerprint": "e23a3974b42f609b3bbb3b069db11ea018cf52372321b14a770149822ca04110",
    "ancestry": [
      "Documentation Reading Map"
    ],
    "text": "## 1. Start Here",
    "sectionText": "## 1. Start Here\n\n| Need | Read |\n|---|---|\n| Understand documentation rules | [doc-governance.md](doc-governance.md) |\n| Resolve authority during transition | [transitional-switchboard.md](transitional-switchboard.md) |\n| Understand platform-wide docs | [platform/README.md](platform/README.md) |\n| Understand packaging, install, activation, setup, and doctor | [platform/packaging-distribution/README.md](platform/packaging-distribution/README.md) |\n| Understand the detailed product/source map | [Section 5](#5-detailed-product-and-source-map) |\n| Shape a new multi-round design | Create or update a discussion scratchpad |\n| Understand an area | `docs/platform/<area>/README.md`, or current legacy `docs/specs/<area>.md` during migration |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_9c8387207fd0c025e7d643a97625a71d"
}
```

## Entry claim_aad6d095624ef67fd09cb8c0cc89fd97

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_aad6d095624ef67fd09cb8c0cc89fd97",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "f75b64c62d3c9b6c2f6c4d9d30d247030cb47053d6293b1b62fb0461182f09c4",
    "identityFingerprint": "35efada7e051208ba541bbf444ca3a5b2d81beeec660a8feb23799b37a559dd1",
    "claimId": "claim_aad6d095624ef67fd09cb8c0cc89fd97",
    "sourceAnchor": "4-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "186264dd1cc951c075a0799d201cf25da7e204191e27327a91d66f367d6c0b7c",
    "claimKind": "navigation",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "a033c3506ca9a48c60e54d19571b68cb3e4f5bb06eb4ddb059b49b8230a28407",
      "toUnitDigest": "f75b64c62d3c9b6c2f6c4d9d30d247030cb47053d6293b1b62fb0461182f09c4",
      "fromSourceUnitDigest": "1a1310d64283efdeff2184dff92272d4fbc8ddc1b75d2746b8e7550f42577c90",
      "toSourceUnitDigest": "186264dd1cc951c075a0799d201cf25da7e204191e27327a91d66f367d6c0b7c"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "f75b64c62d3c9b6c2f6c4d9d30d247030cb47053d6293b1b62fb0461182f09c4",
    "identityFingerprint": "35efada7e051208ba541bbf444ca3a5b2d81beeec660a8feb23799b37a559dd1",
    "claimId": "claim_aad6d095624ef67fd09cb8c0cc89fd97",
    "sourceAnchor": "4-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "186264dd1cc951c075a0799d201cf25da7e204191e27327a91d66f367d6c0b7c",
    "claimKind": "navigation",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Related Files",
    "anchor": "4-related-files",
    "githubAnchor": "4-related-files",
    "stableAnchor": "h-65d0c992ff81",
    "startLine": 110,
    "endLine": 110,
    "textDigest": "186264dd1cc951c075a0799d201cf25da7e204191e27327a91d66f367d6c0b7c",
    "sample": "4. Related Files",
    "sectionPayloadDigest": "232212bee70408ea591b609f3e2bcda60f640c9bd8643a224a84f63b92cea556",
    "followingBlockDigest": "232212bee70408ea591b609f3e2bcda60f640c9bd8643a224a84f63b92cea556",
    "identityFingerprint": "35efada7e051208ba541bbf444ca3a5b2d81beeec660a8feb23799b37a559dd1",
    "ancestry": [
      "Documentation Reading Map"
    ],
    "text": "## 4. Related Files",
    "sectionText": "## 4. Related Files\n\n| Relationship | File |\n|---|---|\n| governs documentation system | [doc-governance.md](doc-governance.md) |\n| operative transitional switchboard | [transitional-switchboard.md](transitional-switchboard.md) |\n| platform portal | [platform/README.md](platform/README.md) |\n| merged detailed product/source map | [Section 5](#5-detailed-product-and-source-map) |\n| verified transitional authority snapshot | [current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) |\n| full-horizon documentation-system proposal | [platform/proposals/documentation-system-unification.md](platform/proposals/documentation-system-unification.md) |\n| preserved future documentation intents | [platform/intent-preservation-ledger.md](platform/intent-preservation-ledger.md) |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Related Files",
    "anchor": "4-related-files",
    "githubAnchor": "4-related-files",
    "stableAnchor": "h-65d0c992ff81",
    "startLine": 110,
    "endLine": 110,
    "textDigest": "186264dd1cc951c075a0799d201cf25da7e204191e27327a91d66f367d6c0b7c",
    "sample": "4. Related Files",
    "sectionPayloadDigest": "232212bee70408ea591b609f3e2bcda60f640c9bd8643a224a84f63b92cea556",
    "followingBlockDigest": "232212bee70408ea591b609f3e2bcda60f640c9bd8643a224a84f63b92cea556",
    "identityFingerprint": "35efada7e051208ba541bbf444ca3a5b2d81beeec660a8feb23799b37a559dd1",
    "ancestry": [
      "Documentation Reading Map"
    ],
    "text": "## 4. Related Files",
    "sectionText": "## 4. Related Files\n\n| Relationship | File |\n|---|---|\n| governs documentation system | [doc-governance.md](doc-governance.md) |\n| operative transitional switchboard | [transitional-switchboard.md](transitional-switchboard.md) |\n| platform portal | [platform/README.md](platform/README.md) |\n| merged detailed product/source map | [Section 5](#5-detailed-product-and-source-map) |\n| verified transitional authority snapshot | [current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) |\n| full-horizon documentation-system proposal | [platform/proposals/documentation-system-unification.md](platform/proposals/documentation-system-unification.md) |\n| preserved future documentation intents | [platform/intent-preservation-ledger.md](platform/intent-preservation-ledger.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_aad6d095624ef67fd09cb8c0cc89fd97"
}
```

## Entry claim_c8677c74072e0ac1ac4d9b345de1ee1f

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "632567b6d49b3714092feff05522aaf424d6b497f353602518a0d0a769fd7ac2",
    "identityFingerprint": "18d001bb03d9f494b00a972419a4d660b6aa0f7168f2d298bfd997b915b56072",
    "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
    "sourceAnchor": "5-detailed-product-and-source-map",
    "unitKind": "heading",
    "sourceUnitDigest": "3fc17fdda14e751313ece3ac881cdd17d0eabb6c98a3ce47a39486de3c39ac3f",
    "claimKind": "navigation",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "17b8994c8c65bb0475695d8d1198bc69546f360ac0f743189bd1803c3ddfa6d9",
      "toUnitDigest": "632567b6d49b3714092feff05522aaf424d6b497f353602518a0d0a769fd7ac2",
      "fromSourceUnitDigest": "e3d47de7f915ea92861801fef67198f0a7211232be1a18c67b49904ea1917280",
      "toSourceUnitDigest": "3fc17fdda14e751313ece3ac881cdd17d0eabb6c98a3ce47a39486de3c39ac3f"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "069f241f2fc827e1f0c0a4ad3943c224e1449e22d4ac1969859c8c16729232ef",
    "identityFingerprint": "c51f768e5c74b655475dfc142ea63650f337ca6eab6a67906fcd49498c7a07bd",
    "claimId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f",
    "sourceAnchor": "5-detailed-product-and-source-map",
    "unitKind": "heading",
    "sourceUnitDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91",
    "claimKind": "navigation",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "632567b6d49b3714092feff05522aaf424d6b497f353602518a0d0a769fd7ac2",
      "toUnitDigest": "069f241f2fc827e1f0c0a4ad3943c224e1449e22d4ac1969859c8c16729232ef",
      "fromSourceUnitDigest": "3fc17fdda14e751313ece3ac881cdd17d0eabb6c98a3ce47a39486de3c39ac3f",
      "toSourceUnitDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Detailed Product And Source Map",
    "anchor": "5-detailed-product-and-source-map",
    "githubAnchor": "5-detailed-product-and-source-map",
    "stableAnchor": "h-20f4aaa7e477",
    "startLine": 122,
    "endLine": 122,
    "textDigest": "3fc17fdda14e751313ece3ac881cdd17d0eabb6c98a3ce47a39486de3c39ac3f",
    "sample": "5. Detailed Product And Source Map",
    "sectionPayloadDigest": "b01bedc0f4a53e31143bd3973bd6b762f64b4cb2d7504bc78fbdc9cc326dc780",
    "followingBlockDigest": "2224720e5dba57fb7728214b829cb8850518f0ba27fc9e76b4049b040d596cb7",
    "identityFingerprint": "18d001bb03d9f494b00a972419a4d660b6aa0f7168f2d298bfd997b915b56072",
    "ancestry": [
      "Documentation Reading Map"
    ],
    "text": "## 5. Detailed Product And Source Map",
    "sectionText": "## 5. Detailed Product And Source Map\n\nMerged from `docs/specs/reading-map.md`. The how-to directory and README\nroutes above retain their routing role; their complete source entries below\nreconcile the detailed descriptions. Labelled truth corrections identify known\nstale claims and current evidence. Historical paths are identified explicitly\nwhere no current file exists. The retained legacy map remains a provenance\npointer until consumer cutover; it is not the reader's detailed-map destination.\n\n- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)\n- `docs/architecture-map.md` — bản chuẩn kiến trúc (v0.2, record ADR0010 (bản đồ kiến trúc là bản chuẩn)): 5 tầng + 2 lớp phủ, sổ component + sổ contract (CTR001–CTR009), nghi thức thẻ-căn-cước-trước-code\n- `docs/work-item-lifecycle-vision.md` — tầm nhìn nền tảng: chu trình sống của work-item (mixed-autonomy, base-workflow + domain-extension); khung cho các PBI STR14-STR18\n- `docs/platform/packaging-distribution/README.md` — portal hiện hành cho packaging/distribution: `fgctl` bootstrap/init/repair/upgrade, workspace activation, doctor/fix readiness, legacy Node compatibility, skill/instruction projections. Khi mục này mâu thuẫn với `docs/specs/distribution.md`, đọc portal + implementation-alignment trước; `docs/specs/distribution.md` hiện là legacy/generated-curated source trong lúc migration.\n- `docs/distribution-vision.md` — tầm nhìn nền tảng lịch sử: cài đặt/setup/doctor ổn định + tái dùng được (không cần clone, global/project không xung đột — project ghi đè global, doctor/setup tự fix hạ tầng + merge config thiếu, module mới tự đăng ký năng lực config, CI như một phần của setup); đã được promote/supersede từng phần vào `docs/platform/packaging-distribution/vision.md`.\n- `docs/specs/` — state layer: area spec + system-overview + bản đồ này\n- `docs/routing-handoff-contract.md` — hợp đồng handoff agent↔agent + ranh giới tin cậy\n- `docs/io-contract.md` — hợp đồng giao tiếp VÀO/RA của cửa CLI + bề mặt stdout `fgos-runner` (str46-io-contract): danh tính `writer`/`role`, envelope `fgos.v1` + ngoại lệ có lý do, exit-code một nguồn, sổ verb (`touchesState`/`externalEffect`/`paginated`/`multiValueFormat`), version token, ranh giới ngoài (STR38/STR48/STR83)\n- `docs/coexistence.md` — doctrine chạy cạnh một harness agent khác (record ADR0009 (chống giao thoa lúc cài — fgOS khi cài không giao thoa tiến trình với harness khác)): lãnh địa, một-nhạc-trưởng-mỗi-phiên, nhường-nhịn lúc `init`, manifest `.fgos/coexistence.json`, Known Gaps chưa flip; `src/install/coexist.mjs` — cài đặt detection + manifest (read-only, không đè)\n- `package.json` (`version`, `files`, `bin.fgos`, `bin.fgos-runner`) + `README.md` (mục `## Install`) — cài `fgos` VÀ `fgos-runner` từ ngoài source repo qua GitHub install, cả hai executable ngay sau cài; `test/install-packaging.test.mjs` — proof e2e (pack → install → chạy từ project ngoài, gồm cả hai binary); spec: docs/specs/distribution.md\n- `scripts/fgos-shell-integration.sh` — dev checkout shell helper (STR87 first slice): hàm `fgos`/`fgos-runner` tự resolve root qua `git rev-parse --git-common-dir` (worktree-safe), source từ shell profile của contributor, không cài đặt gì; test: `test/scripts/fgos-shell-integration.test.mjs`; spec: docs/specs/distribution.md §Dev checkout shell helpers\n- `src/setup/` (`ansi.mjs`, `config-merge.mjs`, `shell-rc.mjs`, `checks.mjs`) + `bin/fgos.mjs`'s current legacy `setup`/`doctor` verbs + `src/cli/command-registry.mjs` entries — doctor/fix registry and legacy setup compatibility: `doctor` chẩn đoán read-only, `doctor --fix` chạy registered fixes, current Node `fgos setup` vẫn tồn tại nhưng target architecture supersedes onboarding bằng `fgctl init` + local `fgos init` / `fgos doctor --fix` / `fgos doctor`; manifest: `docs/architecture-manifest.json`; test: `test/setup/*.test.mjs`; current portal: `docs/platform/packaging-distribution/README.md`; legacy spec: docs/specs/distribution.md §Setup, §Doctor\n- `docs/decisions/` — hồ sơ quyết định dài hạn cho người ngoài (decision records); từ str64-backfill, mỗi record còn mang đầu-mô-tả OKF-style (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn, xem `frontmatter.mjs` dòng dưới) và được `fgos docs-index` công nhận là vị trí thay thế của ngăn `explanation` (R10, spec: docs/specs/enduser-docs-index.md) — thân ADR không đổi, chỉ thêm đầu-mô-tả; lưu ý `orchestrator` là pinned term đã đổi nghĩa giữa chừng (0026→0028 nghĩa cũ \"launcher\", 0029 nghĩa mới \"tầng hợp thành T0\"; xem chuỗi quyết định tại `docs/decisions/index.md` dòng 28-32)\n- `scripts/check-decision-citation-drift.mjs` + `test/scripts/check-decision-citation-drift.test.mjs` — quét `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế trên cùng dòng (STR72 CoS clause 2, PBI p-2d71dfc3); chỉ phát hiện, không tự sửa; spec: docs/specs/decision-citation-drift.md\n- `scripts/check-decision-codes.mjs` + `test/scripts/check-decision-codes.test.mjs` — quét `test/**/*.test.mjs` tìm tên test còn nhúng mã quyết định nội bộ (str##/D#/RUL##/STR##/tsk-xxx) thay vì mô tả bất biến bằng lời thường (review-audit-self-decision.md mục Stable Code Artifacts); chặn (ratchet) chỉ vi phạm MỚI so với `scripts/check-decision-codes.baseline.json` đã chốt, không chặn ngược nợ cũ; `npm test` tự chạy qua glob `test/**/*.test.mjs`, không hook riêng\n- `docs/id-systems-audit.md` — audit + quyết định hình dạng mọi hệ id/mã đang sống trong hệ thống (work.id/kind/Story/ADR/Rule/Contract phía fgOS; D-hex/D-local/cell-id/feature-slug/severity phía bee) — nguồn cho `work.id`'s `tsk-<hash>` và các migration STR53-STR58 (tất cả đã `done`); boundary appendix: `docs/architecture-map.md` Phụ lục B\n- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; gồm verb `edit` — sửa đè các trường (title/kind/risk/verify/tier/refs/deps/acceptance/priority/intent — str7-str8-priority-intent) trên một item đã có, cùng cửa ghi CTR002 như `add`/`move`; gồm verb `take`/`return` — cửa pull giao–nhận việc cho tác nhân ngoài runner; gồm verb `pick` — cửa pull GỘP `take` + dựng workspace (`createWorktree`), role cố định `session`, không cờ `--role` (theo str83-fgos-slash-commands); gồm verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, một cổng cho mọi đề xuất `awaiting-approval`, nay leaf-vs-root-aware (con nhập vào nhánh của gốc, gốc nhập vào cây chính); `review`/`approve` nay chấp nhận thêm `--github [--pr <n>]` — vận chuyển thay thế CÙNG cổng duyệt qua GitHub thay vì diff/merge cục bộ (chỉ nguồn runner, theo github-adapter, spec: docs/specs/runner.md); gồm verb `catchup` — đồng bộ lại một việc đỗ vì gãy nhập/trôi tích hợp (spec: docs/specs/runner.md); gồm verb `session` (`start`/`end`/`list`) — vòng đời phiên checkout đa-phiên tùy chọn, mỗi phiên một worktree detached-HEAD cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink (spec: docs/specs/runner.md); spec: docs/specs/work-state.md\n- `src/state/` — lõi work-state: events (nhật ký; `appendEvent` nay khóa liên-tiến-trình `.fgos/events.lock`, per fgos-multi-session-checkout Epic 3/STR35 — xem spec Work-State RUL10 (tiền đề có ngưỡng — một người ghi tại một thời điểm; multi-agent ghi đồng thời qua `.fgos/events.lock`)), work (schema — STATUSES + STAGES + field `parent` lineage + field `domain`), fsm (bảng chuyển status + CAS), stage (bảng chuyển stage + CAS, chiều vĩ mô song song fsm; cạnh chuyển-stage tra theo domain của item — `coding`: `discovery → exploring → planning → executing`, trong đó phán-quyết `clear` ở `discovery` bỏ qua `exploring` để sang thẳng `planning` còn `unclear` đi qua `exploring`; tên `decompose` vẫn còn nhưng chỉ là bí danh legacy chỉ-để-rút-cạn (không việc MỚI nào vào được nữa); `synthetic`: một stage, không cạnh nào), domains (sổ đăng ký domain — stage list + step-mapping base-workflow + cạnh-chuyển mỗi domain; `coding` + ba domain minh họa/thử-nghiệm `synthetic` (đúng một stage), `triage`, `fixture-marketing`; base-workflow-model STR18, hoàn tất S1+S2), replay (fold), frontier (truy vấn sẵn-sàng — lọc theo status, stage domain-aware, VÀ lineage qua `parent`), dep-graph (dò chu trình trên `deps` — bất biến phi-chu-trình tại cửa ghi, per work-graph-intelligence S1), store (chủ ghi duy nhất + readRawEvents), envelope (phong bì output CTR001, `wrapEnvelope` — nay bọc MỌI verb ở một cửa in trong `bin/fgos.mjs main()`, STR37; spec: docs/specs/work-state.md §envelope)\n- `src/cli/command-registry.mjs` — sổ verb máy-đọc của CLI (STR37, kernel, thuần dữ liệu): `SCHEMA_VERSION` + `COMMAND_REGISTRY` (mọi verb với `{name, invoke, description, parameters, examples, access read|mutation, deprecated}`); `bin/fgos.mjs` `--help [--json]` và `<verb> [<sub>] --help [--json]` sinh sổ từ đây; verb có sub-verb mang `subcommands`, `HELP_SELECTORS` (`--help`, `-h`) thành route của Rust host qua `scripts/export-command-selectors.mjs`; test chống-lệch `test/cli/fgos-manifest.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` (cờ handler ↔ schema sub-verb), `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/help-routes.test.mjs` (qua host thật); spec: docs/specs/work-state.md §sổ verb\n- `src/intake/classify.mjs` — logic thuần của `fgos submit`: deriveTitle, classify (tier/kind/risk cơ học), generateId (`tsk-<hash>` chống trùng, STR53)\n- `src/intake/discovery.mjs` — context-discovery của stage `discovery` (stage đầu tiên của domain `coding`): `resolveDiscovery` (đọc-phán-ghi, dùng chung bởi verb `discover` và vòng tự hành) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDiscovery` đã rút; phán-quyết `clear` chuyển item sang stage `planning`, `unclear` sang `exploring`\n- `src/intake/plan.mjs` — phán chia-việc của stage `planning`: `resolvePlan` (đọc-phán-ghi, dùng chung bởi verb `plan` và vòng tự hành khi item ở stage `planning`, hoặc ở bí danh legacy `decompose`) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDecompose` đã rút, cùng lý do `judgeDiscovery` rút; sinh con qua lineage `parent`, không qua `deps`\n- `domains/coding/AGENTS.md` `## fgOS Workflow` + `.claude/skills/` (`.agents/skills/` mirror byte-identical) — lớp hướng dẫn P50: entry skill (`fgos-routing`) + skill giai đoạn (`fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-knowledge`) trỏ một phiên tự mở tới đúng skill theo `stage` của item; từ str89-fgos-domain-skills, tra cứu này domain-pluggable — đọc trường `domain` + `stage` của item rồi tra qua `skillForStep`/`getDomain` (`src/state/domain-registry.mjs`), không còn giả định ngầm domain `coding`; `fgos-routing` nay có hàng khoá theo **status** `retrospective → fgos-coding-knowledge` (skill tổng hợp cấp nhãn Diataxis + soạn tài liệu người-dùng-cuối) — stage `compound-learn` đã rút, việc tổng hợp nó từng canh nay là việc của status `retrospective`; skill ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã rút (tsk-6ar) — `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`) nay tự chạy clarify+classify trong cùng phiên sống, cùng việc mà skill đó từng làm nhưng trên bản mô tả SẠCH hơn; spec: docs/specs/work-state.md §RUL60 (hành vi), docs/specs/runner.md (lớp hướng dẫn) **Truth correction:** src/state/domain-registry.mjs:193,240; core/skills/fgos-routing/SKILL.md:124-136.\n- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 37 wrapper không có tiền tố fgos- trong 55 thư mục skill; `check` không có wrapper. Mỗi wrapper giữ hướng dẫn cửa gọi của riêng nó; spec: docs/specs/fgos-plugin.md **Truth correction:** plugins/fgOS/.claude-plugin/plugin.json:1; plugins/fgOS/skills/submit/SKILL.md:1; plugins/fgOS/skills/answer/SKILL.md:1 (directory enumeration at e7393ea3c).\n- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)\n- `docs/how-to/`, `docs/tutorials/`, `docs/reference/`, `docs/explanation/` — tài liệu NGƯỜI-DÙNG-CUỐI theo bốn quadrant Diataxis (audience-facing, khác `docs/specs/` là BA-reference nội bộ); sinh bởi kỹ năng `fgos-coding-knowledge` ở status `retrospective` (grow-or-create một tài liệu SỐNG mỗi đường dẫn: gom mọi capture qua `fgos doc-sources` rồi tích luỹ không mất, ngăn Diataxis là trục cấu trúc duy nhất — write-side, spec: docs/specs/enduser-docs-authoring.md), quadrant khớp `docType` capture; `docs/explanation/` từ str64-backfill còn có 6 tài liệu chưng cất từ critical-patterns.md (learnings vận hành bee thật sự thuộc tiến trình hình thành fgOS); chỉ mục đọc-theo-tag máy-đọc-được: `docs/enduser-docs-index.json` (sinh bởi verb `fgos docs-index` / kỹ năng `fgos-indexing`, thay cho việc liệt-kê-tay từng tài liệu — supersedes con trỏ văn xuôi cũ, theo compound-learn-enduser-docs; ngăn `explanation` còn quét thêm `docs/decisions/` làm vị trí thay thế, theo str64-backfill); spec read-side: docs/specs/enduser-docs-index.md\n- `src/runner/` + `bin/fgos-runner.mjs` — vòng tự hành (loop/dispatch/worktree/recovery/anti-loop/write-queue/root-affinity); `loop.mjs`'s `runWatch` + `write-queue.mjs`'s `onCommit` — chế độ `--watch` bền, tín hiệu-cơ-học + nghỉ dự phòng, ghép `runOnce` không đổi làm hộp đen (str7-str8-priority-intent, spec: docs/specs/runner.md §RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); loop giao việc theo mẻ song song có giới hạn hai tầng (cấu hình `parallel` trong `.fgos/config.json`'s `runner` section, theo tsk-5vf), giữ quyền-sở-hữu-gốc trong một lượt chạy, quét làm-rõ rồi quét chia-việc trước mọi dispatch thi công; gặt-lại bỏ qua claim của cửa pull (`claimRole` human/session); `dispatch.mjs`'s executor là port có tên CTR009 v2 (`EXECUTOR_ADAPTERS`, per-tier qua config's `executors`, STR41), `ensureRunnerConfigForDir` tự sinh cấu hình mặc định tại `.fgos/config.json` khi vắng mặt (không áp dụng cho `--config` tường minh, str76-runner-bootstrap; tsk-5hv xoá hẳn fallback về file flat legacy cũ); worker của loop và fan-out chạy như một Unit run qua `runUnit` (`work-dispatch.mjs`'s `spawnWorker`), `fgos-runner` không còn `--config` (spec: docs/specs/runner.md §RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) và prompt worker được tách sang `prompt-templates.mjs` + `prompt-templates/*.txt` (chọn template qua bảng cơ học kind/tier/domain, substitution `{placeholder}` thuần, log dispatch kèm tên+hash template, STR49); `goal-check.mjs` — hàm goal-check dùng chung giữa vòng tự hành và verb `return`; `write-queue.mjs` — cửa ghi tuần tự giữ một-người-ghi dưới song song; `root-affinity.mjs` — quyền-sở-hữu-gốc, giữ mọi con của một gốc chung một chủ trong một lượt chạy; `resolveRepoRoot` nay còn xác nhận HEAD repo resolve được trước khi runner claim bất kỳ item nào (fail-fast, str86-runner-headless-git D ecfd0d1a); config: `.fgos/config.json`'s `runner` section (tự sinh khi vắng mặt tại đường mặc định, nguồn config duy nhất kể từ tsk-5hv); spec: docs/specs/runner.md\n- `docs/specs/confinement-authority.md` + `src/runner/dispatch/confinement/` — Agent Confinement Authority: runtime one-door confinement enforcement (`executeThroughConfinement`), machine backend registry `~/.fgos/confinement-backends.json`, local `bwrap` v1 driver with 8 falsification probes, required fail-closed checks, attestation storage (`confinement-attestation.v1`), herdr convergence with shared `evaluateBypassPairing`, setup defaults and doctor checks; spec: docs/specs/confinement-authority.md Pane herdr confine cho agent không phải claude (codex/agy/pi): công thức private-home + account inventory + lịch sử các commit đã đi qua (và vì sao từng bị quên) ở §13.1.\n- `docs/architect/README.md` + `docs/architect/architecture-intent.md` + `docs/architect/domainization/README.md` — portal architect-level, registry intention xuyên-khu-vực, và deep-dive domainization (core đóng vs `domains/<name>/` adapter mở: manifest/workflow YAML, task-spec, skill, knowledge, doctrine, agent, resolver, enforcement); active thread đầu tiên giữ intent mở rộng fgOS từ fan-out/fan-in + artifact mediation thành năng lực group-thinking/problem-solving rộng hơn (Delphi/NGT/RFC/adversarial/master-coordinator), giữ `group-cognition-framework.yaml` isolation-heavy không bị nới ngầm; liên quan Step 09 group-thinking substrate, Step 10 coding-domain adoption, component authority boundary map, và Domain Components And Extension Layer\n- `src/workflow/` (`definition.mjs`, `runner.mjs`, `step-fsm.mjs`, `units-source.mjs`) + `core/workflows/*.yaml` — Workflow engine (Request-to-Run P3a/P4): DAG steps, human gates, dependency scheduling, runner integration; `units-source.mjs` dịch units file của `fgos workflow start --units` thành Workflow tạm (RUL89 (workflow start --units)); spec: `docs/specs/runner.md`\n- `src/runner/execution/` (`unit.mjs`, `bind.mjs`, `run.mjs`, `patterns/`) — Execution Core (Request-to-Run P1/P2/P4): Unit (hợp đồng dữ liệu duy nhất), `bind()` (chọn executor 5 mức), `fgos run` (cửa chạy mới, herdr mặc định), CollaborationPattern (`solo`, `reviewed`, `panel` + presets `consult`, `research-fan-out`, `rfc`, `code-change`); `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi Unit (RUL84 (one write-scope matcher)), dùng cho runner commit, settlement và Workflow; spec: `docs/specs/runner.md`\n- `docs/architect/agent-coordination/` — thiết kế agent-coordination lịch sử (đã thu hồi ở P4 per D-0050, thay bằng Workflow runner và Execution Core); `README.md` là portal ghi nhận chuyển tiếp; `contracts/` lưu giữ hợp đồng lịch sử (`coordination-session.md`, `flow-definition.md`).\n- `docs/architect/host-invocation-routing/` — kiến trúc định tuyến và host runtime Rust (5 tệp: `host-invocation-provider-routing.md` — hợp đồng kernel canonical OperationRequest/ProviderOutcome, pure Router, InvocationService; `legacy-cli-transition.md` — chiến lược exec payload Node với parity harness và descriptor command-routes; `external-provider-protocol.md` — giao thức external provider R2; `node-to-rust-component-migration.md` — lộ trình chuyển dịch component từ Node sang Rust; `rust-cli-and-proof-components-plan.md` — kế hoạch triển khai Rust CLI host và proof components); spec: docs/specs/distribution.md\n- `src/runner/merge.mjs` — cơ chế cổng duyệt PR nội bộ (`classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`), dùng bởi `bin/fgos.mjs` verb `review`/`approve`/`reject`, nay tham số hóa được nhánh đích (cây chính hoặc nhánh của gốc — cây nhánh tích hợp); `catchup` (bin/fgos.mjs) dùng lại cùng cơ chế git cho cả tầng con→gốc lẫn gốc→cây chính; `isMainWorktree` (STR44) — chặn cấu trúc (không dựa sổ đăng ký session) xác nhận `cwd` LÀ worktree chính trước khi `approve` merge/verify, bắt cả worktree tay không đăng ký qua `fgos session start` — cùng `detectTrunk` nay ở `src/runner/worktree.mjs` (theo tsk-49i), không còn ở file này; spec: docs/specs/runner.md\n- `src/verbs/<domain>/<verb>.mjs` — tầng use-case của CLI (theo tsk-49i): logic nghiệp vụ của một verb, chữ ký thống nhất `<verb>UseCase(ctx, options)` — `ctx` là thứ adapter tính từ môi trường (`{dir, cwd?, repoRoot?}`, use-case KHÔNG BAO GIỜ tự đọc `process.cwd()`/`process.env`/argv), `options` là flag đã parse; trả đúng payload `fgos.v1` (bọc envelope + map exit-code vẫn ở `bin/fgos.mjs`), refusal vẫn `throw StoreError`. Cụm đầu tiên: `src/verbs/merge/` (`merge`/`approve`/`review`/`sync-root`/`catchup`/`reject`/`promote-to-component`) — `bin/fgos.mjs` cho 7 verb này nay chỉ parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb, gọi một hàm use-case. Không ngụ ý migrate 7 file use-case-rank sẵn có (`runner/loop.mjs`, `intake/*`, `setup/*`, `state/cursor.mjs`); spec: docs/specs/runner.md\n- `src/report/item-trace.mjs` — trace outcome/friction của MỘT item, đọc thuần trên view (`collectOutcomeEntry`/`collectFrictionData`/`collectReviewTrace`); dùng chung bởi `review` (use-case) và `check`/`show`/`doc-sources`/`evolve` (`bin/fgos.mjs`); spec: docs/specs/runner.md\n- `src/runner/github-adapter.mjs` — vận chuyển GitHub thuần cho cổng duyệt PR nội bộ (`createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR`/`classifyGhFailure`, shell ra `gh` CLI thật, layer infra), dùng bởi `bin/fgos.mjs` verb `review`/`approve --github`; spec: docs/specs/runner.md\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ của trợ lý (`.fgos/logs/<id>.log`, git-ignored): `appendWorkerLog` — khối kết-cục cuối, gọi bởi `loop.mjs` sau mỗi lượt dispatch; `appendWorkerLogChunk` — live tee từng chunk stdout/stderr khi đến (STR39), gọi bởi `dispatch.mjs`'s `spawnWorker` qua `opts.onChunk`; spec: docs/specs/runner.md\n- `src/runner/session.mjs` — vòng đời phiên checkout đa-phiên tùy chọn (fgos-multi-session-checkout, STR35): `createSession`/`endSession`/`listSessions`/`reclaimOrphanedSessions`, worktree detached-HEAD mỗi phiên (`git worktree add --detach`), `.fgos` symlink dùng chung (KHÔNG BAO GIỜ sao chép), sổ `.fgos/sessions.json` canh bởi `.fgos/sessions.lock` riêng; dùng bởi `bin/fgos.mjs` verb `session`; spec: docs/specs/runner.md\n- `packages/observe/rust/src/metrics_cli/entropy.rs` — tín hiệu entropy-trend + đếm compounding (thuần, đọc trên view work-state), surfaced qua `fgos metrics entropy`; spec: docs/specs/runner.md\n- `src/report/enduser-index.mjs` — bộ sinh CHỈ MỤC đọc-theo-tag tài liệu người-dùng-cuối (biến đổi dữ liệu, không tự thực hiện I/O; ghi chú mirror entropy trong source là lịch sử, `src/report/entropy.mjs` không còn): `QUADRANTS`, bảng nguồn-sự-thật `QUADRANT_META` (quadrant→{purpose,audience}), `QUADRANT_DIR_ALIASES` (quadrant→vị trí thay thế trên đĩa, theo str64-backfill; hiện `explanation`→`['decisions']`), `findSourceCaptureId` (gom một, cho chỉ mục), `findSourceCaptureIds` (gom mọi capture của một đường dẫn, cho `doc-sources`), `buildEnduserIndex`; I/O + verb `fgos docs-index` (quét cả thư mục chính lẫn `QUADRANT_DIR_ALIASES`, ghi manifest `docs/enduser-docs-index.json`) và verb `fgos doc-sources <docPath>` (gom nguồn của một đường dẫn) sống ở `bin/fgos.mjs`, cả hai quyền `read`; vận hành chỉ mục: kỹ năng `fgos-indexing`; spec: docs/specs/enduser-docs-index.md **Truth correction:** src/report/enduser-index.mjs:1-17; packages/observe/rust/src/metrics_cli/entropy.rs:1.\n- `src/report/frontmatter.mjs` — bộ đọc/ghi đầu-mô-tả OKF-style của mỗi tài liệu người-dùng-cuối (thuần, không I/O, không phụ thuộc thư viện ngoài — theo str64-backfill): `parseFrontmatter`/`renderFrontmatter` (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn); tách biệt với bộ sinh chỉ mục — đầu-mô-tả là bản sao ghi-lúc-soạn, KHÔNG phải nguồn thẩm quyền của linkage; spec: docs/specs/enduser-docs-index.md\n- Historical `src/evolve/candidates.mjs` — path not present at this commit; `src/report/entropy.mjs`, `listUnsettledFrictionsByWork` và verb `fgos evolve` cũng không còn. Tín hiệu entropy hiện ở `packages/observe/rust/src/metrics_cli/entropy.rs`, qua `fgos metrics entropy`; không có cửa candidate ranking được mô tả ở câu cũ. **Truth correction:** src/cli/command-registry.mjs:98,204-207; packages/observe/rust/src/metrics_cli/entropy.rs:1; src/evolve/iron-law.mjs:1 (only current src/evolve file; full src/bin/packages symbol search has no old ranking symbol).\n- `src/state/impact.mjs` — backlog-triage impact ranking (STR21, cửa 2 của triage — tách bạch khỏi STR14 intake-triage): thuần, xếp hạng item CHƯA `done` theo `blocks` (số item khác chưa `done` liệt kê nó trong `deps`); surfaced qua `fgos triage`; spec: docs/specs/work-state.md\n- `src/state/awaiting-context.mjs` — neo gốc cho cổng chờ-người (str61-chat-context-continuity): thuần, đọc trên view work-state, tính `{parent, changedSinceAsk?}` cho một item `awaiting-human` có `parent` mỗi lần đọc (không lưu trữ); surfaced qua `fgos list`'s khóa cộng thêm `awaitingContext`; spec: docs/specs/work-state.md §RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2, kernel layer, dùng chung giữa `classify.mjs` và `iron-law.mjs`); spec: docs/specs/runner.md\n- `src/evolve/iron-law.mjs` — Iron Law risk classifier cho vòng tự cải thiện (self-improve loop, STR13 Slice 2): thuần, đã được gọi qua `src/runner/iron-law-gate.mjs` (import và gọi `classifyIronLaw`); spec: docs/specs/runner.md **Truth correction:** src/evolve/iron-law.mjs:64; src/runner/iron-law-gate.mjs:20,59.\n- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`.\n- `test/` — node:test suite (`npm test`; tổng số test lịch sử 2970 chưa được đếm lại): smoke + state + cli + runner + report + e2e (rebuild-determinism, runner-loop — gồm kịch bản cửa pull S2-pull + con fork từ tip nhánh gốc, pr-gate — 4 kịch bản trọn vòng review/approve/reject, dispatch song song thật với cửa sổ chồng-lấn đo được); benchmark lịch sử ngoài suite (F4): `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` — path not present at this commit; không có benchmark hiện hành ở đường dẫn này **Truth correction:** package.json:28 (scripts.test); git ls-tree e7393ea3c docs/history/phase-3-compound-learning (no entries).\n- `scripts/run-test-canary.mjs` (`npm run test:canary -- <file...>`) + `scripts/test-select.mjs` (`npm run test:related -- --explain`, plus `test:related:shadow` for evidence-gathering; manifest: `test/test-ownership.mjs`) — additive fast test-feedback doors, `npm test` unchanged/authoritative either way; how-to: `docs/how-to/use-fast-test-feedback-commands.md`; plan: `archive/plans/260920-immediate-test-feedback-reduction/plan.md` **Truth correction:** archive/plans/260920-immediate-test-feedback-reduction/plan.md:5.\n- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored; `.fgos/logs/<id>.log` — bản ghi output cục bộ của trợ lý theo từng việc, gitignored (spec: docs/specs/runner.md)\n- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent (bản sản phẩm — thuần forgent)"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Detailed Product And Source Map",
    "anchor": "5-detailed-product-and-source-map",
    "githubAnchor": "5-detailed-product-and-source-map",
    "stableAnchor": "h-20f4aaa7e477",
    "startLine": 122,
    "endLine": 122,
    "textDigest": "01204e281f177e257efc7b015d93651c874a149f0e4bb3a68054b943a66d2e91",
    "sample": "5. Detailed Product And Source Map",
    "sectionPayloadDigest": "18c9f682fe6ae74dd3fa63d027b3d26d7076dbe9a5fe09b55dc71553e8f642eb",
    "followingBlockDigest": "2224720e5dba57fb7728214b829cb8850518f0ba27fc9e76b4049b040d596cb7",
    "identityFingerprint": "c51f768e5c74b655475dfc142ea63650f337ca6eab6a67906fcd49498c7a07bd",
    "ancestry": [
      "Documentation Reading Map"
    ],
    "text": "## 5. Detailed Product And Source Map",
    "sectionText": "## 5. Detailed Product And Source Map\n\nMerged from `docs/specs/reading-map.md`. The how-to directory and README\nroutes above retain their routing role; their complete source entries below\nreconcile the detailed descriptions. Labelled truth corrections identify known\nstale claims and current evidence. Historical paths are identified explicitly\nwhere no current file exists. The retained legacy map remains a provenance\npointer until consumer cutover; it is not the reader's detailed-map destination.\n\n- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)\n- `docs/architecture-map.md` — bản chuẩn kiến trúc (v0.2, record ADR0010 (bản đồ kiến trúc là bản chuẩn)): 5 tầng + 2 lớp phủ, sổ component + sổ contract (CTR001–CTR009), nghi thức thẻ-căn-cước-trước-code\n- `docs/work-item-lifecycle-vision.md` — tầm nhìn nền tảng: chu trình sống của work-item (mixed-autonomy, base-workflow + domain-extension); khung cho các PBI STR14-STR18\n- `docs/platform/packaging-distribution/README.md` — portal hiện hành cho packaging/distribution: `fgctl` bootstrap/init/repair/upgrade, workspace activation, doctor/fix readiness, legacy Node compatibility, skill/instruction projections. Khi mục này mâu thuẫn với `docs/specs/distribution.md`, đọc portal + implementation-alignment trước; `docs/specs/distribution.md` hiện là legacy/generated-curated source trong lúc migration.\n- `docs/distribution-vision.md` — tầm nhìn nền tảng lịch sử: cài đặt/setup/doctor ổn định + tái dùng được (không cần clone, global/project không xung đột — project ghi đè global, doctor/setup tự fix hạ tầng + merge config thiếu, module mới tự đăng ký năng lực config, CI như một phần của setup); đã được promote/supersede từng phần vào `docs/platform/packaging-distribution/vision.md`.\n- `docs/specs/` — state layer: area spec + system-overview + bản đồ này\n- `docs/routing-handoff-contract.md` — hợp đồng handoff agent↔agent + ranh giới tin cậy\n- `docs/io-contract.md` — hợp đồng giao tiếp VÀO/RA của cửa CLI + bề mặt stdout `fgos-runner` (str46-io-contract): danh tính `writer`/`role`, envelope `fgos.v1` + ngoại lệ có lý do, exit-code một nguồn, sổ verb (`touchesState`/`externalEffect`/`paginated`/`multiValueFormat`), version token, ranh giới ngoài (STR38/STR48/STR83)\n- `docs/coexistence.md` — doctrine chạy cạnh một harness agent khác (record ADR0009 (chống giao thoa lúc cài — fgOS khi cài không giao thoa tiến trình với harness khác)): lãnh địa, một-nhạc-trưởng-mỗi-phiên, nhường-nhịn lúc `init`, manifest `.fgos/coexistence.json`, Known Gaps chưa flip; `src/install/coexist.mjs` — cài đặt detection + manifest (read-only, không đè)\n- `package.json` (`version`, `files`, `bin.fgos`, `bin.fgos-runner`) + `README.md` (mục `## Install`) — cài `fgos` VÀ `fgos-runner` từ ngoài source repo qua GitHub install, cả hai executable ngay sau cài; `test/install-packaging.test.mjs` — proof e2e (pack → install → chạy từ project ngoài, gồm cả hai binary); spec: docs/specs/distribution.md\n- `scripts/fgos-shell-integration.sh` — dev checkout shell helper (STR87 first slice): hàm `fgos`/`fgos-runner` tự resolve root qua `git rev-parse --git-common-dir` (worktree-safe), source từ shell profile của contributor, không cài đặt gì; test: `test/scripts/fgos-shell-integration.test.mjs`; spec: docs/specs/distribution.md §Dev checkout shell helpers\n- `src/setup/` (`ansi.mjs`, `config-merge.mjs`, `shell-rc.mjs`, `checks.mjs`) + `bin/fgos.mjs`'s current legacy `setup`/`doctor` verbs + `src/cli/command-registry.mjs` entries — doctor/fix registry and legacy setup compatibility: `doctor` chẩn đoán read-only, `doctor --fix` chạy registered fixes, current Node `fgos setup` vẫn tồn tại nhưng target architecture supersedes onboarding bằng `fgctl init` + local `fgos init` / `fgos doctor --fix` / `fgos doctor`; manifest: `docs/architecture-manifest.json`; test: `test/setup/*.test.mjs`; current portal: `docs/platform/packaging-distribution/README.md`; legacy spec: docs/specs/distribution.md §Setup, §Doctor\n- `docs/decisions/` — hồ sơ quyết định dài hạn cho người ngoài (decision records); từ str64-backfill, mỗi record còn mang đầu-mô-tả OKF-style (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn, xem `frontmatter.mjs` dòng dưới) và được `fgos docs-index` công nhận là vị trí thay thế của ngăn `explanation` (R10, spec: docs/specs/enduser-docs-index.md) — thân ADR không đổi, chỉ thêm đầu-mô-tả; lưu ý `orchestrator` là pinned term đã đổi nghĩa giữa chừng (0026→0028 nghĩa cũ \"launcher\", 0029 nghĩa mới \"tầng hợp thành T0\"; xem chuỗi quyết định tại `docs/decisions/index.md` dòng 28-32)\n- `scripts/check-decision-citation-drift.mjs` + `test/scripts/check-decision-citation-drift.test.mjs` — quét `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế trên cùng dòng (STR72 CoS clause 2, PBI p-2d71dfc3); chỉ phát hiện, không tự sửa; spec: docs/specs/decision-citation-drift.md\n- `scripts/check-decision-codes.mjs` + `test/scripts/check-decision-codes.test.mjs` — quét `test/**/*.test.mjs` tìm tên test còn nhúng mã quyết định nội bộ (str##/D#/RUL##/STR##/tsk-xxx) thay vì mô tả bất biến bằng lời thường (review-audit-self-decision.md mục Stable Code Artifacts); chặn (ratchet) chỉ vi phạm MỚI so với `scripts/check-decision-codes.baseline.json` đã chốt, không chặn ngược nợ cũ; `npm test` tự chạy qua glob `test/**/*.test.mjs`, không hook riêng\n- `docs/id-systems-audit.md` — audit + quyết định hình dạng mọi hệ id/mã đang sống trong hệ thống (work.id/kind/Story/ADR/Rule/Contract phía fgOS; D-hex/D-local/cell-id/feature-slug/severity phía bee) — nguồn cho `work.id`'s `tsk-<hash>` và các migration STR53-STR58 (tất cả đã `done`); boundary appendix: `docs/architecture-map.md` Phụ lục B\n- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; gồm verb `edit` — sửa đè các trường (title/kind/risk/verify/tier/refs/deps/acceptance/priority/intent — str7-str8-priority-intent) trên một item đã có, cùng cửa ghi CTR002 như `add`/`move`; gồm verb `take`/`return` — cửa pull giao–nhận việc cho tác nhân ngoài runner; gồm verb `pick` — cửa pull GỘP `take` + dựng workspace (`createWorktree`), role cố định `session`, không cờ `--role` (theo str83-fgos-slash-commands); gồm verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, một cổng cho mọi đề xuất `awaiting-approval`, nay leaf-vs-root-aware (con nhập vào nhánh của gốc, gốc nhập vào cây chính); `review`/`approve` nay chấp nhận thêm `--github [--pr <n>]` — vận chuyển thay thế CÙNG cổng duyệt qua GitHub thay vì diff/merge cục bộ (chỉ nguồn runner, theo github-adapter, spec: docs/specs/runner.md); gồm verb `catchup` — đồng bộ lại một việc đỗ vì gãy nhập/trôi tích hợp (spec: docs/specs/runner.md); gồm verb `session` (`start`/`end`/`list`) — vòng đời phiên checkout đa-phiên tùy chọn, mỗi phiên một worktree detached-HEAD cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink (spec: docs/specs/runner.md); spec: docs/specs/work-state.md\n- `src/state/` — lõi work-state: events (nhật ký; `appendEvent` nay khóa liên-tiến-trình `.fgos/events.lock`, per fgos-multi-session-checkout Epic 3/STR35 — xem spec Work-State RUL10 (tiền đề có ngưỡng — một người ghi tại một thời điểm; multi-agent ghi đồng thời qua `.fgos/events.lock`)), work (schema — STATUSES + STAGES + field `parent` lineage + field `domain`), fsm (bảng chuyển status + CAS), stage (bảng chuyển stage + CAS, chiều vĩ mô song song fsm; cạnh chuyển-stage tra theo domain của item — `coding`: `discovery → exploring → planning → executing`, trong đó phán-quyết `clear` ở `discovery` bỏ qua `exploring` để sang thẳng `planning` còn `unclear` đi qua `exploring`; tên `decompose` vẫn còn nhưng chỉ là bí danh legacy chỉ-để-rút-cạn (không việc MỚI nào vào được nữa); `synthetic`: một stage, không cạnh nào), domains (sổ đăng ký domain — stage list + step-mapping base-workflow + cạnh-chuyển mỗi domain; `coding` + ba domain minh họa/thử-nghiệm `synthetic` (đúng một stage), `triage`, `fixture-marketing`; base-workflow-model STR18, hoàn tất S1+S2), replay (fold), frontier (truy vấn sẵn-sàng — lọc theo status, stage domain-aware, VÀ lineage qua `parent`), dep-graph (dò chu trình trên `deps` — bất biến phi-chu-trình tại cửa ghi, per work-graph-intelligence S1), store (chủ ghi duy nhất + readRawEvents), envelope (phong bì output CTR001, `wrapEnvelope` — nay bọc MỌI verb ở một cửa in trong `bin/fgos.mjs main()`, STR37; spec: docs/specs/work-state.md §envelope)\n- `src/cli/command-registry.mjs` — sổ verb máy-đọc của CLI (STR37, kernel, thuần dữ liệu): `SCHEMA_VERSION` + `COMMAND_REGISTRY` (mọi verb với `{name, invoke, description, parameters, examples, access read|mutation, deprecated}`); `bin/fgos.mjs` `--help [--json]` và `<verb> [<sub>] --help [--json]` sinh sổ từ đây; verb có sub-verb mang `subcommands`, `HELP_SELECTORS` (`--help`, `-h`) thành route của Rust host qua `scripts/export-command-selectors.mjs`; test chống-lệch `test/cli/fgos-manifest.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` (cờ handler ↔ schema sub-verb), `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/help-routes.test.mjs` (qua host thật); spec: docs/specs/work-state.md §sổ verb\n- `src/intake/classify.mjs` — logic thuần của `fgos submit`: deriveTitle, classify (tier/kind/risk cơ học), generateId (`tsk-<hash>` chống trùng, STR53)\n- `src/intake/discovery.mjs` — context-discovery của stage `discovery` (stage đầu tiên của domain `coding`): `resolveDiscovery` (đọc-phán-ghi, dùng chung bởi verb `discover` và vòng tự hành) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDiscovery` đã rút; phán-quyết `clear` chuyển item sang stage `planning`, `unclear` sang `exploring`\n- `src/intake/plan.mjs` — phán chia-việc của stage `planning`: `resolvePlan` (đọc-phán-ghi, dùng chung bởi verb `plan` và vòng tự hành khi item ở stage `planning`, hoặc ở bí danh legacy `decompose`) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDecompose` đã rút, cùng lý do `judgeDiscovery` rút; sinh con qua lineage `parent`, không qua `deps`\n- `domains/coding/AGENTS.md` `## fgOS Workflow` + `.claude/skills/` (`.agents/skills/` mirror byte-identical) — lớp hướng dẫn P50: entry skill (`fgos-routing`) + skill giai đoạn (`fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-knowledge`) trỏ một phiên tự mở tới đúng skill theo `stage` của item; từ str89-fgos-domain-skills, tra cứu này domain-pluggable — đọc trường `domain` + `stage` của item rồi tra qua `skillForStep`/`getDomain` (`src/state/domain-registry.mjs`), không còn giả định ngầm domain `coding`; `fgos-routing` nay có hàng khoá theo **status** `retrospective → fgos-coding-knowledge` (skill tổng hợp cấp nhãn Diataxis + soạn tài liệu người-dùng-cuối) — stage `compound-learn` đã rút, việc tổng hợp nó từng canh nay là việc của status `retrospective`; skill ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã rút (tsk-6ar) — `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`) nay tự chạy clarify+classify trong cùng phiên sống, cùng việc mà skill đó từng làm nhưng trên bản mô tả SẠCH hơn; spec: docs/specs/work-state.md §RUL60 (hành vi), docs/specs/runner.md (lớp hướng dẫn) **Truth correction:** src/state/domain-registry.mjs:193,240; core/skills/fgos-routing/SKILL.md:124-136.\n- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 36 wrapper không có tiền tố fgos- trong 55 thư mục skill; `_shared` không có SKILL.md và không phải wrapper; `check` không có wrapper. Mỗi wrapper giữ hướng dẫn cửa gọi của riêng nó; spec: docs/specs/fgos-plugin.md **Truth correction:** `find plugins/fgOS/skills -mindepth 2 -maxdepth 2 -name SKILL.md` gives 54 files, of which 18 have the fgos- prefix and 36 do not; 55 directories include `_shared` without SKILL.md (enumerated at SYNC 59b9b7087).\n- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)\n- `docs/how-to/`, `docs/tutorials/`, `docs/reference/`, `docs/explanation/` — tài liệu NGƯỜI-DÙNG-CUỐI theo bốn quadrant Diataxis (audience-facing, khác `docs/specs/` là BA-reference nội bộ); sinh bởi kỹ năng `fgos-coding-knowledge` ở status `retrospective` (grow-or-create một tài liệu SỐNG mỗi đường dẫn: gom mọi capture qua `fgos doc-sources` rồi tích luỹ không mất, ngăn Diataxis là trục cấu trúc duy nhất — write-side, spec: docs/specs/enduser-docs-authoring.md), quadrant khớp `docType` capture; `docs/explanation/` từ str64-backfill còn có 6 tài liệu chưng cất từ critical-patterns.md (learnings vận hành bee thật sự thuộc tiến trình hình thành fgOS); chỉ mục đọc-theo-tag máy-đọc-được: `docs/enduser-docs-index.json` (sinh bởi verb `fgos docs-index` / kỹ năng `fgos-indexing`, thay cho việc liệt-kê-tay từng tài liệu — supersedes con trỏ văn xuôi cũ, theo compound-learn-enduser-docs; ngăn `explanation` còn quét thêm `docs/decisions/` làm vị trí thay thế, theo str64-backfill); spec read-side: docs/specs/enduser-docs-index.md\n- `src/runner/` + `bin/fgos-runner.mjs` — vòng tự hành (loop/dispatch/worktree/recovery/anti-loop/write-queue/root-affinity); `loop.mjs`'s `runWatch` + `write-queue.mjs`'s `onCommit` — chế độ `--watch` bền, tín hiệu-cơ-học + nghỉ dự phòng, ghép `runOnce` không đổi làm hộp đen (str7-str8-priority-intent, spec: docs/specs/runner.md §RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); loop giao việc theo mẻ song song có giới hạn hai tầng (cấu hình `parallel` trong `.fgos/config.json`'s `runner` section, theo tsk-5vf), giữ quyền-sở-hữu-gốc trong một lượt chạy, quét làm-rõ rồi quét chia-việc trước mọi dispatch thi công; gặt-lại bỏ qua claim của cửa pull (`claimRole` human/session); `dispatch.mjs`'s executor là port có tên CTR009 v2 (`EXECUTOR_ADAPTERS`, per-tier qua config's `executors`, STR41), `ensureRunnerConfigForDir` tự sinh cấu hình mặc định tại `.fgos/config.json` khi vắng mặt (không áp dụng cho `--config` tường minh, str76-runner-bootstrap; tsk-5hv xoá hẳn fallback về file flat legacy cũ); worker của loop và fan-out chạy như một Unit run qua `runUnit` (`work-dispatch.mjs`'s `spawnWorker`), `fgos-runner` không còn `--config` (spec: docs/specs/runner.md §RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) và prompt worker được tách sang `prompt-templates.mjs` + `prompt-templates/*.txt` (chọn template qua bảng cơ học kind/tier/domain, substitution `{placeholder}` thuần, log dispatch kèm tên+hash template, STR49); `goal-check.mjs` — hàm goal-check dùng chung giữa vòng tự hành và verb `return`; `write-queue.mjs` — cửa ghi tuần tự giữ một-người-ghi dưới song song; `root-affinity.mjs` — quyền-sở-hữu-gốc, giữ mọi con của một gốc chung một chủ trong một lượt chạy; `resolveRepoRoot` nay còn xác nhận HEAD repo resolve được trước khi runner claim bất kỳ item nào (fail-fast, str86-runner-headless-git D ecfd0d1a); config: `.fgos/config.json`'s `runner` section (tự sinh khi vắng mặt tại đường mặc định, nguồn config duy nhất kể từ tsk-5hv); spec: docs/specs/runner.md\n- `docs/specs/confinement-authority.md` + `src/runner/dispatch/confinement/` — Agent Confinement Authority: runtime one-door confinement enforcement (`executeThroughConfinement`), machine backend registry `~/.fgos/confinement-backends.json`, local `bwrap` v1 driver with 8 falsification probes, required fail-closed checks, attestation storage (`confinement-attestation.v1`), herdr convergence with shared `evaluateBypassPairing`, setup defaults and doctor checks; spec: docs/specs/confinement-authority.md Pane herdr confine cho agent không phải claude (codex/agy/pi): công thức private-home + account inventory + lịch sử các commit đã đi qua (và vì sao từng bị quên) ở §13.1.\n- `docs/architect/README.md` + `docs/architect/architecture-intent.md` + `docs/architect/domainization/README.md` — portal architect-level, registry intention xuyên-khu-vực, và deep-dive domainization (core đóng vs `domains/<name>/` adapter mở: manifest/workflow YAML, task-spec, skill, knowledge, doctrine, agent, resolver, enforcement); active thread đầu tiên giữ intent mở rộng fgOS từ fan-out/fan-in + artifact mediation thành năng lực group-thinking/problem-solving rộng hơn (Delphi/NGT/RFC/adversarial/master-coordinator), giữ `group-cognition-framework.yaml` isolation-heavy không bị nới ngầm; liên quan Step 09 group-thinking substrate, Step 10 coding-domain adoption, component authority boundary map, và Domain Components And Extension Layer\n- `src/workflow/` (`definition.mjs`, `runner.mjs`, `step-fsm.mjs`, `units-source.mjs`) + `core/workflows/*.yaml` — Workflow engine (Request-to-Run P3a/P4): DAG steps, human gates, dependency scheduling, runner integration; `units-source.mjs` dịch units file của `fgos workflow start --units` thành Workflow tạm (RUL89 (workflow start --units)); spec: `docs/specs/runner.md`\n- `src/runner/execution/` (`unit.mjs`, `bind.mjs`, `run.mjs`, `patterns/`) — Execution Core (Request-to-Run P1/P2/P4): Unit (hợp đồng dữ liệu duy nhất), `bind()` (chọn executor 5 mức), `fgos run` (cửa chạy mới, herdr mặc định), CollaborationPattern (`solo`, `reviewed`, `panel` + presets `consult`, `research-fan-out`, `rfc`, `code-change`); `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi Unit (RUL84 (one write-scope matcher)), dùng cho runner commit, settlement và Workflow; spec: `docs/specs/runner.md`\n- `docs/architect/agent-coordination/` — thiết kế agent-coordination lịch sử (đã thu hồi ở P4 per D-0050, thay bằng Workflow runner và Execution Core); `README.md` là portal ghi nhận chuyển tiếp; `contracts/` lưu giữ hợp đồng lịch sử (`coordination-session.md`, `flow-definition.md`).\n- `docs/architect/host-invocation-routing/` — kiến trúc định tuyến và host runtime Rust (5 tệp: `host-invocation-provider-routing.md` — hợp đồng kernel canonical OperationRequest/ProviderOutcome, pure Router, InvocationService; `legacy-cli-transition.md` — chiến lược exec payload Node với parity harness và descriptor command-routes; `external-provider-protocol.md` — giao thức external provider R2; `node-to-rust-component-migration.md` — lộ trình chuyển dịch component từ Node sang Rust; `rust-cli-and-proof-components-plan.md` — kế hoạch triển khai Rust CLI host và proof components); spec: docs/specs/distribution.md\n- `src/runner/merge.mjs` — cơ chế cổng duyệt PR nội bộ (`classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`), dùng bởi `bin/fgos.mjs` verb `review`/`approve`/`reject`, nay tham số hóa được nhánh đích (cây chính hoặc nhánh của gốc — cây nhánh tích hợp); `catchup` (bin/fgos.mjs) dùng lại cùng cơ chế git cho cả tầng con→gốc lẫn gốc→cây chính; `isMainWorktree` (STR44) — chặn cấu trúc (không dựa sổ đăng ký session) xác nhận `cwd` LÀ worktree chính trước khi `approve` merge/verify, bắt cả worktree tay không đăng ký qua `fgos session start` — cùng `detectTrunk` nay ở `src/runner/worktree.mjs` (theo tsk-49i), không còn ở file này; spec: docs/specs/runner.md\n- `src/verbs/<domain>/<verb>.mjs` — tầng use-case của CLI (theo tsk-49i): logic nghiệp vụ của một verb, chữ ký thống nhất `<verb>UseCase(ctx, options)` — `ctx` là thứ adapter tính từ môi trường (`{dir, cwd?, repoRoot?}`, use-case KHÔNG BAO GIỜ tự đọc `process.cwd()`/`process.env`/argv), `options` là flag đã parse; trả đúng payload `fgos.v1` (bọc envelope + map exit-code vẫn ở `bin/fgos.mjs`), refusal vẫn `throw StoreError`. Cụm đầu tiên: `src/verbs/merge/` (`merge`/`approve`/`review`/`sync-root`/`catchup`/`reject`/`promote-to-component`) — `bin/fgos.mjs` cho 7 verb này nay chỉ parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb, gọi một hàm use-case. Không ngụ ý migrate 7 file use-case-rank sẵn có (`runner/loop.mjs`, `intake/*`, `setup/*`, `state/cursor.mjs`); spec: docs/specs/runner.md\n- `src/report/item-trace.mjs` — trace outcome/friction của MỘT item, đọc thuần trên view (`collectOutcomeEntry`/`collectFrictionData`/`collectReviewTrace`); dùng chung bởi `review` (use-case) và `check`/`show`/`doc-sources`/`evolve` (`bin/fgos.mjs`); spec: docs/specs/runner.md\n- `src/runner/github-adapter.mjs` — vận chuyển GitHub thuần cho cổng duyệt PR nội bộ (`createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR`/`classifyGhFailure`, shell ra `gh` CLI thật, layer infra), dùng bởi `bin/fgos.mjs` verb `review`/`approve --github`; spec: docs/specs/runner.md\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ của trợ lý (`.fgos/logs/<id>.log`, git-ignored): `appendWorkerLog` — khối kết-cục cuối, gọi bởi `loop.mjs` sau mỗi lượt dispatch; `appendWorkerLogChunk` — live tee từng chunk stdout/stderr khi đến (STR39), gọi bởi `dispatch.mjs`'s `spawnWorker` qua `opts.onChunk`; spec: docs/specs/runner.md\n- `src/runner/session.mjs` — vòng đời phiên checkout đa-phiên tùy chọn (fgos-multi-session-checkout, STR35): `createSession`/`endSession`/`listSessions`/`reclaimOrphanedSessions`, worktree detached-HEAD mỗi phiên (`git worktree add --detach`), `.fgos` symlink dùng chung (KHÔNG BAO GIỜ sao chép), sổ `.fgos/sessions.json` canh bởi `.fgos/sessions.lock` riêng; dùng bởi `bin/fgos.mjs` verb `session`; spec: docs/specs/runner.md\n- `packages/observe/rust/src/metrics_cli/entropy.rs` — tín hiệu entropy-trend + đếm compounding (thuần, đọc trên view work-state), surfaced qua `fgos metrics entropy`; spec: docs/specs/runner.md\n- `src/report/enduser-index.mjs` — bộ sinh CHỈ MỤC đọc-theo-tag tài liệu người-dùng-cuối (biến đổi dữ liệu, không tự thực hiện I/O; ghi chú mirror entropy trong source là lịch sử, `src/report/entropy.mjs` không còn): `QUADRANTS`, bảng nguồn-sự-thật `QUADRANT_META` (quadrant→{purpose,audience}), `QUADRANT_DIR_ALIASES` (quadrant→vị trí thay thế trên đĩa, theo str64-backfill; hiện `explanation`→`['decisions']`), `findSourceCaptureId` (gom một, cho chỉ mục), `findSourceCaptureIds` (gom mọi capture của một đường dẫn, cho `doc-sources`), `buildEnduserIndex`; I/O + verb `fgos docs-index` (quét cả thư mục chính lẫn `QUADRANT_DIR_ALIASES`, ghi manifest `docs/enduser-docs-index.json`) và verb `fgos doc-sources <docPath>` (gom nguồn của một đường dẫn) sống ở `bin/fgos.mjs`, cả hai quyền `read`; vận hành chỉ mục: kỹ năng `fgos-indexing`; spec: docs/specs/enduser-docs-index.md **Truth correction:** src/report/enduser-index.mjs:1-17; packages/observe/rust/src/metrics_cli/entropy.rs:1.\n- `src/report/frontmatter.mjs` — bộ đọc/ghi đầu-mô-tả OKF-style của mỗi tài liệu người-dùng-cuối (thuần, không I/O, không phụ thuộc thư viện ngoài — theo str64-backfill): `parseFrontmatter`/`renderFrontmatter` (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn); tách biệt với bộ sinh chỉ mục — đầu-mô-tả là bản sao ghi-lúc-soạn, KHÔNG phải nguồn thẩm quyền của linkage; spec: docs/specs/enduser-docs-index.md\n- Historical `src/evolve/candidates.mjs` — path not present at this commit; `src/report/entropy.mjs`, `listUnsettledFrictionsByWork` và verb `fgos evolve` cũng không còn. Tín hiệu entropy hiện ở `packages/observe/rust/src/metrics_cli/entropy.rs`, qua `fgos metrics entropy`; không có cửa candidate ranking được mô tả ở câu cũ. **Truth correction:** src/cli/command-registry.mjs:98,204-207; packages/observe/rust/src/metrics_cli/entropy.rs:1; src/evolve/iron-law.mjs:1 (only current src/evolve file; full src/bin/packages symbol search has no old ranking symbol).\n- `src/state/impact.mjs` — backlog-triage impact ranking (STR21, cửa 2 của triage — tách bạch khỏi STR14 intake-triage): thuần, xếp hạng item CHƯA `done` theo `blocks` (số item khác chưa `done` liệt kê nó trong `deps`); surfaced qua `fgos triage`; spec: docs/specs/work-state.md\n- `src/state/awaiting-context.mjs` — neo gốc cho cổng chờ-người (str61-chat-context-continuity): thuần, đọc trên view work-state, tính `{parent, changedSinceAsk?}` cho một item `awaiting-human` có `parent` mỗi lần đọc (không lưu trữ); surfaced qua `fgos list`'s khóa cộng thêm `awaitingContext`; spec: docs/specs/work-state.md §RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2, kernel layer, dùng chung giữa `classify.mjs` và `iron-law.mjs`); spec: docs/specs/runner.md\n- `src/evolve/iron-law.mjs` — Iron Law risk classifier cho vòng tự cải thiện (self-improve loop, STR13 Slice 2): thuần, đã được gọi qua `src/runner/iron-law-gate.mjs` (import và gọi `classifyIronLaw`); spec: docs/specs/runner.md **Truth correction:** src/evolve/iron-law.mjs:64; src/runner/iron-law-gate.mjs:20,59.\n- `docs/platform/session-identity/spec.md` — spec thành phần Session Identity: nguồn duy nhất trả lời \"writer của process này là ai\" (`{id, source}`); source: `packages/session-identity/rust` (verb native `fgos identity`), contracts + vector dùng chung: `packages/session-identity/contracts/`; Node chỉ gọi qua facade `src/util/session-identity.mjs` (tìm binary: `src/util/host-bin-path.mjs`).\n- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`.\n- `test/` — node:test suite (`npm test`; tổng số test lịch sử 2970 chưa được đếm lại): smoke + state + cli + runner + report + e2e (rebuild-determinism, runner-loop — gồm kịch bản cửa pull S2-pull + con fork từ tip nhánh gốc, pr-gate — 4 kịch bản trọn vòng review/approve/reject, dispatch song song thật với cửa sổ chồng-lấn đo được); benchmark lịch sử ngoài suite (F4): `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` — path not present at this commit; không có benchmark hiện hành ở đường dẫn này **Truth correction:** package.json:28 (scripts.test); git ls-tree e7393ea3c docs/history/phase-3-compound-learning (no entries).\n- `scripts/run-test-canary.mjs` (`npm run test:canary -- <file...>`) + `scripts/test-select.mjs` (`npm run test:related -- --explain`, plus `test:related:shadow` for evidence-gathering; manifest: `test/test-ownership.mjs`) — additive fast test-feedback doors, `npm test` unchanged/authoritative either way; how-to: `docs/how-to/use-fast-test-feedback-commands.md`; plan: `archive/plans/260920-immediate-test-feedback-reduction/plan.md` **Truth correction:** archive/plans/260920-immediate-test-feedback-reduction/plan.md:5.\n- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored; `.fgos/logs/<id>.log` — bản ghi output cục bộ của trợ lý theo từng việc, gitignored (spec: docs/specs/runner.md)\n- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent (bản sản phẩm — thuần forgent)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_c8677c74072e0ac1ac4d9b345de1ee1f"
}
```

## Entry claim_5e39467512dc05bfe6e3b4a96c660d6c

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_5e39467512dc05bfe6e3b4a96c660d6c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "5d2b6a28a04a687d6042462a41b005e276cf8feca981a2f3a42afddbd3eb2e54",
    "identityFingerprint": "e76bc1c098dcff073b8749e9ecebc7de9a431544e50687c7a59eb44af3c9673d",
    "claimId": "claim_5e39467512dc05bfe6e3b4a96c660d6c",
    "sourceAnchor": "documentation-reading-map",
    "unitKind": "heading",
    "sourceUnitDigest": "f56b373a4532d0a280541b1eeda7ba4aee730699cc0e39d338a1abb7d9c9294e",
    "claimKind": "navigation",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "d832d31d45e46fe8b7c2dc4234e478213c486974529260d297a1743a48fcdf4e",
      "toUnitDigest": "5d2b6a28a04a687d6042462a41b005e276cf8feca981a2f3a42afddbd3eb2e54",
      "fromSourceUnitDigest": "82e97a857539eea9e5f20bb9b1f5cdfc6209f68afcdf604502c2b3d70ca448be",
      "toSourceUnitDigest": "f56b373a4532d0a280541b1eeda7ba4aee730699cc0e39d338a1abb7d9c9294e"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "5d2b6a28a04a687d6042462a41b005e276cf8feca981a2f3a42afddbd3eb2e54",
    "identityFingerprint": "e76bc1c098dcff073b8749e9ecebc7de9a431544e50687c7a59eb44af3c9673d",
    "claimId": "claim_5e39467512dc05bfe6e3b4a96c660d6c",
    "sourceAnchor": "documentation-reading-map",
    "unitKind": "heading",
    "sourceUnitDigest": "f56b373a4532d0a280541b1eeda7ba4aee730699cc0e39d338a1abb7d9c9294e",
    "claimKind": "navigation",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Documentation Reading Map",
    "anchor": "documentation-reading-map",
    "githubAnchor": "documentation-reading-map",
    "stableAnchor": "h-00706e683013",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f56b373a4532d0a280541b1eeda7ba4aee730699cc0e39d338a1abb7d9c9294e",
    "sample": "Documentation Reading Map",
    "sectionPayloadDigest": "05a58822c0f388dc66347f0db1c29f249e16d39764e3ab188a91930b4e14ea04",
    "followingBlockDigest": "4b06a227179cdf05a3c4cbfae70c9ffb6aa2be702a226872f61f38c7bfefc79c",
    "identityFingerprint": "e76bc1c098dcff073b8749e9ecebc7de9a431544e50687c7a59eb44af3c9673d",
    "ancestry": [],
    "text": "# Documentation Reading Map",
    "sectionText": "# Documentation Reading Map\n\n```txt\nDocument type: Reading map\nAudience: Human reviewer, maintainer, implementer, agent\nPurpose: Tell readers what to read first by purpose\nDesign status: Accepted\nImplementation: Partial\nProvenance: Promoted from documentation-system redesign\nWriter type: Human + agent coauthor\nCanonical for: Documentation entry routing\nUse this when: You need to decide which fgOS docs to read first\nDo not use this for: Documentation governance or complete file inventory\nLast reviewed: 2026-09-25\nRelated:\n- `docs/doc-governance.md`\n- `docs/transitional-switchboard.md`\n- `docs/platform/README.md`\n- `docs/specs/reading-map.md`\n```\n\nThis map provides reader routes and the merged detailed product/source map in\n[section 5](#5-detailed-product-and-source-map). The legacy source remains\nretained for provenance until consumer cutover."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 1,
    "title": "Documentation Reading Map",
    "anchor": "documentation-reading-map",
    "githubAnchor": "documentation-reading-map",
    "stableAnchor": "h-00706e683013",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "f56b373a4532d0a280541b1eeda7ba4aee730699cc0e39d338a1abb7d9c9294e",
    "sample": "Documentation Reading Map",
    "sectionPayloadDigest": "05a58822c0f388dc66347f0db1c29f249e16d39764e3ab188a91930b4e14ea04",
    "followingBlockDigest": "4b06a227179cdf05a3c4cbfae70c9ffb6aa2be702a226872f61f38c7bfefc79c",
    "identityFingerprint": "e76bc1c098dcff073b8749e9ecebc7de9a431544e50687c7a59eb44af3c9673d",
    "ancestry": [],
    "text": "# Documentation Reading Map",
    "sectionText": "# Documentation Reading Map\n\n```txt\nDocument type: Reading map\nAudience: Human reviewer, maintainer, implementer, agent\nPurpose: Tell readers what to read first by purpose\nDesign status: Accepted\nImplementation: Partial\nProvenance: Promoted from documentation-system redesign\nWriter type: Human + agent coauthor\nCanonical for: Documentation entry routing\nUse this when: You need to decide which fgOS docs to read first\nDo not use this for: Documentation governance or complete file inventory\nLast reviewed: 2026-09-25\nRelated:\n- `docs/doc-governance.md`\n- `docs/transitional-switchboard.md`\n- `docs/platform/README.md`\n- `docs/specs/reading-map.md`\n```\n\nThis map provides reader routes and the merged detailed product/source map in\n[section 5](#5-detailed-product-and-source-map). The legacy source remains\nretained for provenance until consumer cutover."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_5e39467512dc05bfe6e3b4a96c660d6c"
}
```

## Entry claim_a4f7ef8823510c108225f922da1261ba

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_a4f7ef8823510c108225f922da1261ba",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "ae696eaf98f857a4b05aeceb6175ea1c2b27e403462bc5a3dcdb0d5d79085cd2",
    "identityFingerprint": "ae696eaf98f857a4b05aeceb6175ea1c2b27e403462bc5a3dcdb0d5d79085cd2",
    "claimId": "claim_a4f7ef8823510c108225f922da1261ba",
    "sourceAnchor": "unheaded-block-14",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "232212bee70408ea591b609f3e2bcda60f640c9bd8643a224a84f63b92cea556",
    "claimKind": "navigation",
    "status": "current",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "ae696eaf98f857a4b05aeceb6175ea1c2b27e403462bc5a3dcdb0d5d79085cd2",
    "identityFingerprint": "ae696eaf98f857a4b05aeceb6175ea1c2b27e403462bc5a3dcdb0d5d79085cd2",
    "claimId": "claim_a4f7ef8823510c108225f922da1261ba",
    "sourceAnchor": "unheaded-block-14",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "232212bee70408ea591b609f3e2bcda60f640c9bd8643a224a84f63b92cea556",
    "claimKind": "navigation",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-14",
    "githubAnchor": "unheaded-block-14",
    "stableAnchor": "unheaded-block-14",
    "title": "Unheaded block 14",
    "startLine": 112,
    "endLine": 120,
    "textDigest": "232212bee70408ea591b609f3e2bcda60f640c9bd8643a224a84f63b92cea556",
    "sample": "| Relationship | File |\n|---|---|\n| governs documentation system | [doc-governance.md](doc-governance.md) |\n| operative transitional switchboard | [transitional-switchboard.md](tra",
    "identityFingerprint": "ae696eaf98f857a4b05aeceb6175ea1c2b27e403462bc5a3dcdb0d5d79085cd2",
    "ancestry": [
      "Documentation Reading Map",
      "4. Related Files"
    ],
    "text": "| Relationship | File |\n|---|---|\n| governs documentation system | [doc-governance.md](doc-governance.md) |\n| operative transitional switchboard | [transitional-switchboard.md](transitional-switchboard.md) |\n| platform portal | [platform/README.md](platform/README.md) |\n| merged detailed product/source map | [Section 5](#5-detailed-product-and-source-map) |\n| verified transitional authority snapshot | [current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) |\n| full-horizon documentation-system proposal | [platform/proposals/documentation-system-unification.md](platform/proposals/documentation-system-unification.md) |\n| preserved future documentation intents | [platform/intent-preservation-ledger.md](platform/intent-preservation-ledger.md) |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-14",
    "githubAnchor": "unheaded-block-14",
    "stableAnchor": "unheaded-block-14",
    "title": "Unheaded block 14",
    "startLine": 112,
    "endLine": 120,
    "textDigest": "232212bee70408ea591b609f3e2bcda60f640c9bd8643a224a84f63b92cea556",
    "sample": "| Relationship | File |\n|---|---|\n| governs documentation system | [doc-governance.md](doc-governance.md) |\n| operative transitional switchboard | [transitional-switchboard.md](tra",
    "identityFingerprint": "ae696eaf98f857a4b05aeceb6175ea1c2b27e403462bc5a3dcdb0d5d79085cd2",
    "ancestry": [
      "Documentation Reading Map",
      "4. Related Files"
    ],
    "text": "| Relationship | File |\n|---|---|\n| governs documentation system | [doc-governance.md](doc-governance.md) |\n| operative transitional switchboard | [transitional-switchboard.md](transitional-switchboard.md) |\n| platform portal | [platform/README.md](platform/README.md) |\n| merged detailed product/source map | [Section 5](#5-detailed-product-and-source-map) |\n| verified transitional authority snapshot | [current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) |\n| full-horizon documentation-system proposal | [platform/proposals/documentation-system-unification.md](platform/proposals/documentation-system-unification.md) |\n| preserved future documentation intents | [platform/intent-preservation-ledger.md](platform/intent-preservation-ledger.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_a4f7ef8823510c108225f922da1261ba"
}
```

## Entry claim_69f68ab48e108dc19e2e8f69936fce60

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_69f68ab48e108dc19e2e8f69936fce60",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "26cb7548aa69ed4505a116ce89218788304b71bfeed8590b2906204b81670be3",
    "identityFingerprint": "26cb7548aa69ed4505a116ce89218788304b71bfeed8590b2906204b81670be3",
    "claimId": "claim_69f68ab48e108dc19e2e8f69936fce60",
    "sourceAnchor": "unheaded-block-15",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "2224720e5dba57fb7728214b829cb8850518f0ba27fc9e76b4049b040d596cb7",
    "claimKind": "navigation",
    "status": "current",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "26cb7548aa69ed4505a116ce89218788304b71bfeed8590b2906204b81670be3",
    "identityFingerprint": "26cb7548aa69ed4505a116ce89218788304b71bfeed8590b2906204b81670be3",
    "claimId": "claim_69f68ab48e108dc19e2e8f69936fce60",
    "sourceAnchor": "unheaded-block-15",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "2224720e5dba57fb7728214b829cb8850518f0ba27fc9e76b4049b040d596cb7",
    "claimKind": "navigation",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-15",
    "githubAnchor": "unheaded-block-15",
    "stableAnchor": "unheaded-block-15",
    "title": "Unheaded block 15",
    "startLine": 124,
    "endLine": 129,
    "textDigest": "2224720e5dba57fb7728214b829cb8850518f0ba27fc9e76b4049b040d596cb7",
    "sample": "Merged from `docs/specs/reading-map.md`. The how-to directory and README\nroutes above retain their routing role; their complete source entries below\nreconcile the detailed descript",
    "identityFingerprint": "26cb7548aa69ed4505a116ce89218788304b71bfeed8590b2906204b81670be3",
    "ancestry": [
      "Documentation Reading Map",
      "5. Detailed Product And Source Map"
    ],
    "text": "Merged from `docs/specs/reading-map.md`. The how-to directory and README\nroutes above retain their routing role; their complete source entries below\nreconcile the detailed descriptions. Labelled truth corrections identify known\nstale claims and current evidence. Historical paths are identified explicitly\nwhere no current file exists. The retained legacy map remains a provenance\npointer until consumer cutover; it is not the reader's detailed-map destination."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-15",
    "githubAnchor": "unheaded-block-15",
    "stableAnchor": "unheaded-block-15",
    "title": "Unheaded block 15",
    "startLine": 124,
    "endLine": 129,
    "textDigest": "2224720e5dba57fb7728214b829cb8850518f0ba27fc9e76b4049b040d596cb7",
    "sample": "Merged from `docs/specs/reading-map.md`. The how-to directory and README\nroutes above retain their routing role; their complete source entries below\nreconcile the detailed descript",
    "identityFingerprint": "26cb7548aa69ed4505a116ce89218788304b71bfeed8590b2906204b81670be3",
    "ancestry": [
      "Documentation Reading Map",
      "5. Detailed Product And Source Map"
    ],
    "text": "Merged from `docs/specs/reading-map.md`. The how-to directory and README\nroutes above retain their routing role; their complete source entries below\nreconcile the detailed descriptions. Labelled truth corrections identify known\nstale claims and current evidence. Historical paths are identified explicitly\nwhere no current file exists. The retained legacy map remains a provenance\npointer until consumer cutover; it is not the reader's detailed-map destination."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_69f68ab48e108dc19e2e8f69936fce60"
}
```

## Entry claim_42444c5f44c4076300c2b9c56516c429

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_42444c5f44c4076300c2b9c56516c429",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "896ac46952e9d6e969849b5c05229d53bd88db021665930ecf4d8eb814ab655a",
    "identityFingerprint": "896ac46952e9d6e969849b5c05229d53bd88db021665930ecf4d8eb814ab655a",
    "claimId": "claim_42444c5f44c4076300c2b9c56516c429",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24",
    "claimKind": "navigation",
    "status": "current",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-16",
    "githubAnchor": "unheaded-block-16",
    "stableAnchor": "unheaded-block-16",
    "title": "Unheaded block 16",
    "startLine": 131,
    "endLine": 184,
    "textDigest": "607cd88b7a9323d610811e9bee61bbcb328ad12ba92f9f1b62defc5ab6c6db24",
    "sample": "- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned",
    "identityFingerprint": "896ac46952e9d6e969849b5c05229d53bd88db021665930ecf4d8eb814ab655a",
    "ancestry": [
      "Documentation Reading Map",
      "5. Detailed Product And Source Map"
    ],
    "text": "- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)\n- `docs/architecture-map.md` — bản chuẩn kiến trúc (v0.2, record ADR0010 (bản đồ kiến trúc là bản chuẩn)): 5 tầng + 2 lớp phủ, sổ component + sổ contract (CTR001–CTR009), nghi thức thẻ-căn-cước-trước-code\n- `docs/work-item-lifecycle-vision.md` — tầm nhìn nền tảng: chu trình sống của work-item (mixed-autonomy, base-workflow + domain-extension); khung cho các PBI STR14-STR18\n- `docs/platform/packaging-distribution/README.md` — portal hiện hành cho packaging/distribution: `fgctl` bootstrap/init/repair/upgrade, workspace activation, doctor/fix readiness, legacy Node compatibility, skill/instruction projections. Khi mục này mâu thuẫn với `docs/specs/distribution.md`, đọc portal + implementation-alignment trước; `docs/specs/distribution.md` hiện là legacy/generated-curated source trong lúc migration.\n- `docs/distribution-vision.md` — tầm nhìn nền tảng lịch sử: cài đặt/setup/doctor ổn định + tái dùng được (không cần clone, global/project không xung đột — project ghi đè global, doctor/setup tự fix hạ tầng + merge config thiếu, module mới tự đăng ký năng lực config, CI như một phần của setup); đã được promote/supersede từng phần vào `docs/platform/packaging-distribution/vision.md`.\n- `docs/specs/` — state layer: area spec + system-overview + bản đồ này\n- `docs/routing-handoff-contract.md` — hợp đồng handoff agent↔agent + ranh giới tin cậy\n- `docs/io-contract.md` — hợp đồng giao tiếp VÀO/RA của cửa CLI + bề mặt stdout `fgos-runner` (str46-io-contract): danh tính `writer`/`role`, envelope `fgos.v1` + ngoại lệ có lý do, exit-code một nguồn, sổ verb (`touchesState`/`externalEffect`/`paginated`/`multiValueFormat`), version token, ranh giới ngoài (STR38/STR48/STR83)\n- `docs/coexistence.md` — doctrine chạy cạnh một harness agent khác (record ADR0009 (chống giao thoa lúc cài — fgOS khi cài không giao thoa tiến trình với harness khác)): lãnh địa, một-nhạc-trưởng-mỗi-phiên, nhường-nhịn lúc `init`, manifest `.fgos/coexistence.json`, Known Gaps chưa flip; `src/install/coexist.mjs` — cài đặt detection + manifest (read-only, không đè)\n- `package.json` (`version`, `files`, `bin.fgos`, `bin.fgos-runner`) + `README.md` (mục `## Install`) — cài `fgos` VÀ `fgos-runner` từ ngoài source repo qua GitHub install, cả hai executable ngay sau cài; `test/install-packaging.test.mjs` — proof e2e (pack → install → chạy từ project ngoài, gồm cả hai binary); spec: docs/specs/distribution.md\n- `scripts/fgos-shell-integration.sh` — dev checkout shell helper (STR87 first slice): hàm `fgos`/`fgos-runner` tự resolve root qua `git rev-parse --git-common-dir` (worktree-safe), source từ shell profile của contributor, không cài đặt gì; test: `test/scripts/fgos-shell-integration.test.mjs`; spec: docs/specs/distribution.md §Dev checkout shell helpers\n- `src/setup/` (`ansi.mjs`, `config-merge.mjs`, `shell-rc.mjs`, `checks.mjs`) + `bin/fgos.mjs`'s current legacy `setup`/`doctor` verbs + `src/cli/command-registry.mjs` entries — doctor/fix registry and legacy setup compatibility: `doctor` chẩn đoán read-only, `doctor --fix` chạy registered fixes, current Node `fgos setup` vẫn tồn tại nhưng target architecture supersedes onboarding bằng `fgctl init` + local `fgos init` / `fgos doctor --fix` / `fgos doctor`; manifest: `docs/architecture-manifest.json`; test: `test/setup/*.test.mjs`; current portal: `docs/platform/packaging-distribution/README.md`; legacy spec: docs/specs/distribution.md §Setup, §Doctor\n- `docs/decisions/` — hồ sơ quyết định dài hạn cho người ngoài (decision records); từ str64-backfill, mỗi record còn mang đầu-mô-tả OKF-style (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn, xem `frontmatter.mjs` dòng dưới) và được `fgos docs-index` công nhận là vị trí thay thế của ngăn `explanation` (R10, spec: docs/specs/enduser-docs-index.md) — thân ADR không đổi, chỉ thêm đầu-mô-tả; lưu ý `orchestrator` là pinned term đã đổi nghĩa giữa chừng (0026→0028 nghĩa cũ \"launcher\", 0029 nghĩa mới \"tầng hợp thành T0\"; xem chuỗi quyết định tại `docs/decisions/index.md` dòng 28-32)\n- `scripts/check-decision-citation-drift.mjs` + `test/scripts/check-decision-citation-drift.test.mjs` — quét `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế trên cùng dòng (STR72 CoS clause 2, PBI p-2d71dfc3); chỉ phát hiện, không tự sửa; spec: docs/specs/decision-citation-drift.md\n- `scripts/check-decision-codes.mjs` + `test/scripts/check-decision-codes.test.mjs` — quét `test/**/*.test.mjs` tìm tên test còn nhúng mã quyết định nội bộ (str##/D#/RUL##/STR##/tsk-xxx) thay vì mô tả bất biến bằng lời thường (review-audit-self-decision.md mục Stable Code Artifacts); chặn (ratchet) chỉ vi phạm MỚI so với `scripts/check-decision-codes.baseline.json` đã chốt, không chặn ngược nợ cũ; `npm test` tự chạy qua glob `test/**/*.test.mjs`, không hook riêng\n- `docs/id-systems-audit.md` — audit + quyết định hình dạng mọi hệ id/mã đang sống trong hệ thống (work.id/kind/Story/ADR/Rule/Contract phía fgOS; D-hex/D-local/cell-id/feature-slug/severity phía bee) — nguồn cho `work.id`'s `tsk-<hash>` và các migration STR53-STR58 (tất cả đã `done`); boundary appendix: `docs/architecture-map.md` Phụ lục B\n- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; gồm verb `edit` — sửa đè các trường (title/kind/risk/verify/tier/refs/deps/acceptance/priority/intent — str7-str8-priority-intent) trên một item đã có, cùng cửa ghi CTR002 như `add`/`move`; gồm verb `take`/`return` — cửa pull giao–nhận việc cho tác nhân ngoài runner; gồm verb `pick` — cửa pull GỘP `take` + dựng workspace (`createWorktree`), role cố định `session`, không cờ `--role` (theo str83-fgos-slash-commands); gồm verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, một cổng cho mọi đề xuất `awaiting-approval`, nay leaf-vs-root-aware (con nhập vào nhánh của gốc, gốc nhập vào cây chính); `review`/`approve` nay chấp nhận thêm `--github [--pr <n>]` — vận chuyển thay thế CÙNG cổng duyệt qua GitHub thay vì diff/merge cục bộ (chỉ nguồn runner, theo github-adapter, spec: docs/specs/runner.md); gồm verb `catchup` — đồng bộ lại một việc đỗ vì gãy nhập/trôi tích hợp (spec: docs/specs/runner.md); gồm verb `session` (`start`/`end`/`list`) — vòng đời phiên checkout đa-phiên tùy chọn, mỗi phiên một worktree detached-HEAD cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink (spec: docs/specs/runner.md); spec: docs/specs/work-state.md\n- `src/state/` — lõi work-state: events (nhật ký; `appendEvent` nay khóa liên-tiến-trình `.fgos/events.lock`, per fgos-multi-session-checkout Epic 3/STR35 — xem spec Work-State RUL10 (tiền đề có ngưỡng — một người ghi tại một thời điểm; multi-agent ghi đồng thời qua `.fgos/events.lock`)), work (schema — STATUSES + STAGES + field `parent` lineage + field `domain`), fsm (bảng chuyển status + CAS), stage (bảng chuyển stage + CAS, chiều vĩ mô song song fsm; cạnh chuyển-stage tra theo domain của item — `coding`: `discovery → exploring → planning → executing`, trong đó phán-quyết `clear` ở `discovery` bỏ qua `exploring` để sang thẳng `planning` còn `unclear` đi qua `exploring`; tên `decompose` vẫn còn nhưng chỉ là bí danh legacy chỉ-để-rút-cạn (không việc MỚI nào vào được nữa); `synthetic`: một stage, không cạnh nào), domains (sổ đăng ký domain — stage list + step-mapping base-workflow + cạnh-chuyển mỗi domain; `coding` + ba domain minh họa/thử-nghiệm `synthetic` (đúng một stage), `triage`, `fixture-marketing`; base-workflow-model STR18, hoàn tất S1+S2), replay (fold), frontier (truy vấn sẵn-sàng — lọc theo status, stage domain-aware, VÀ lineage qua `parent`), dep-graph (dò chu trình trên `deps` — bất biến phi-chu-trình tại cửa ghi, per work-graph-intelligence S1), store (chủ ghi duy nhất + readRawEvents), envelope (phong bì output CTR001, `wrapEnvelope` — nay bọc MỌI verb ở một cửa in trong `bin/fgos.mjs main()`, STR37; spec: docs/specs/work-state.md §envelope)\n- `src/cli/command-registry.mjs` — sổ verb máy-đọc của CLI (STR37, kernel, thuần dữ liệu): `SCHEMA_VERSION` + `COMMAND_REGISTRY` (mọi verb với `{name, invoke, description, parameters, examples, access read|mutation, deprecated}`); `bin/fgos.mjs` `--help [--json]` và `<verb> [<sub>] --help [--json]` sinh sổ từ đây; verb có sub-verb mang `subcommands`, `HELP_SELECTORS` (`--help`, `-h`) thành route của Rust host qua `scripts/export-command-selectors.mjs`; test chống-lệch `test/cli/fgos-manifest.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` (cờ handler ↔ schema sub-verb), `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/help-routes.test.mjs` (qua host thật); spec: docs/specs/work-state.md §sổ verb\n- `src/intake/classify.mjs` — logic thuần của `fgos submit`: deriveTitle, classify (tier/kind/risk cơ học), generateId (`tsk-<hash>` chống trùng, STR53)\n- `src/intake/discovery.mjs` — context-discovery của stage `discovery` (stage đầu tiên của domain `coding`): `resolveDiscovery` (đọc-phán-ghi, dùng chung bởi verb `discover` và vòng tự hành) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDiscovery` đã rút; phán-quyết `clear` chuyển item sang stage `planning`, `unclear` sang `exploring`\n- `src/intake/plan.mjs` — phán chia-việc của stage `planning`: `resolvePlan` (đọc-phán-ghi, dùng chung bởi verb `plan` và vòng tự hành khi item ở stage `planning`, hoặc ở bí danh legacy `decompose`) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDecompose` đã rút, cùng lý do `judgeDiscovery` rút; sinh con qua lineage `parent`, không qua `deps`\n- `domains/coding/AGENTS.md` `## fgOS Workflow` + `.claude/skills/` (`.agents/skills/` mirror byte-identical) — lớp hướng dẫn P50: entry skill (`fgos-routing`) + skill giai đoạn (`fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-knowledge`) trỏ một phiên tự mở tới đúng skill theo `stage` của item; từ str89-fgos-domain-skills, tra cứu này domain-pluggable — đọc trường `domain` + `stage` của item rồi tra qua `skillForStep`/`getDomain` (`src/state/domain-registry.mjs`), không còn giả định ngầm domain `coding`; `fgos-routing` nay có hàng khoá theo **status** `retrospective → fgos-coding-knowledge` (skill tổng hợp cấp nhãn Diataxis + soạn tài liệu người-dùng-cuối) — stage `compound-learn` đã rút, việc tổng hợp nó từng canh nay là việc của status `retrospective`; skill ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã rút (tsk-6ar) — `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`) nay tự chạy clarify+classify trong cùng phiên sống, cùng việc mà skill đó từng làm nhưng trên bản mô tả SẠCH hơn; spec: docs/specs/work-state.md §RUL60 (hành vi), docs/specs/runner.md (lớp hướng dẫn) **Truth correction:** src/state/domain-registry.mjs:193,240; core/skills/fgos-routing/SKILL.md:124-136.\n- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 36 wrapper không có tiền tố fgos- trong 55 thư mục skill; `_shared` không có SKILL.md và không phải wrapper; `check` không có wrapper. Mỗi wrapper giữ hướng dẫn cửa gọi của riêng nó; spec: docs/specs/fgos-plugin.md **Truth correction:** `find plugins/fgOS/skills -mindepth 2 -maxdepth 2 -name SKILL.md` gives 54 files, of which 18 have the fgos- prefix and 36 do not; 55 directories include `_shared` without SKILL.md (enumerated at SYNC 59b9b7087).\n- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)\n- `docs/how-to/`, `docs/tutorials/`, `docs/reference/`, `docs/explanation/` — tài liệu NGƯỜI-DÙNG-CUỐI theo bốn quadrant Diataxis (audience-facing, khác `docs/specs/` là BA-reference nội bộ); sinh bởi kỹ năng `fgos-coding-knowledge` ở status `retrospective` (grow-or-create một tài liệu SỐNG mỗi đường dẫn: gom mọi capture qua `fgos doc-sources` rồi tích luỹ không mất, ngăn Diataxis là trục cấu trúc duy nhất — write-side, spec: docs/specs/enduser-docs-authoring.md), quadrant khớp `docType` capture; `docs/explanation/` từ str64-backfill còn có 6 tài liệu chưng cất từ critical-patterns.md (learnings vận hành bee thật sự thuộc tiến trình hình thành fgOS); chỉ mục đọc-theo-tag máy-đọc-được: `docs/enduser-docs-index.json` (sinh bởi verb `fgos docs-index` / kỹ năng `fgos-indexing`, thay cho việc liệt-kê-tay từng tài liệu — supersedes con trỏ văn xuôi cũ, theo compound-learn-enduser-docs; ngăn `explanation` còn quét thêm `docs/decisions/` làm vị trí thay thế, theo str64-backfill); spec read-side: docs/specs/enduser-docs-index.md\n- `src/runner/` + `bin/fgos-runner.mjs` — vòng tự hành (loop/dispatch/worktree/recovery/anti-loop/write-queue/root-affinity); `loop.mjs`'s `runWatch` + `write-queue.mjs`'s `onCommit` — chế độ `--watch` bền, tín hiệu-cơ-học + nghỉ dự phòng, ghép `runOnce` không đổi làm hộp đen (str7-str8-priority-intent, spec: docs/specs/runner.md §RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); loop giao việc theo mẻ song song có giới hạn hai tầng (cấu hình `parallel` trong `.fgos/config.json`'s `runner` section, theo tsk-5vf), giữ quyền-sở-hữu-gốc trong một lượt chạy, quét làm-rõ rồi quét chia-việc trước mọi dispatch thi công; gặt-lại bỏ qua claim của cửa pull (`claimRole` human/session); `dispatch.mjs`'s executor là port có tên CTR009 v2 (`EXECUTOR_ADAPTERS`, per-tier qua config's `executors`, STR41), `ensureRunnerConfigForDir` tự sinh cấu hình mặc định tại `.fgos/config.json` khi vắng mặt (không áp dụng cho `--config` tường minh, str76-runner-bootstrap; tsk-5hv xoá hẳn fallback về file flat legacy cũ); worker của loop và fan-out chạy như một Unit run qua `runUnit` (`work-dispatch.mjs`'s `spawnWorker`), `fgos-runner` không còn `--config` (spec: docs/specs/runner.md §RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) và prompt worker được tách sang `prompt-templates.mjs` + `prompt-templates/*.txt` (chọn template qua bảng cơ học kind/tier/domain, substitution `{placeholder}` thuần, log dispatch kèm tên+hash template, STR49); `goal-check.mjs` — hàm goal-check dùng chung giữa vòng tự hành và verb `return`; `write-queue.mjs` — cửa ghi tuần tự giữ một-người-ghi dưới song song; `root-affinity.mjs` — quyền-sở-hữu-gốc, giữ mọi con của một gốc chung một chủ trong một lượt chạy; `resolveRepoRoot` nay còn xác nhận HEAD repo resolve được trước khi runner claim bất kỳ item nào (fail-fast, str86-runner-headless-git D ecfd0d1a); config: `.fgos/config.json`'s `runner` section (tự sinh khi vắng mặt tại đường mặc định, nguồn config duy nhất kể từ tsk-5hv); spec: docs/specs/runner.md\n- `docs/specs/confinement-authority.md` + `src/runner/dispatch/confinement/` — Agent Confinement Authority: runtime one-door confinement enforcement (`executeThroughConfinement`), machine backend registry `~/.fgos/confinement-backends.json`, local `bwrap` v1 driver with 8 falsification probes, required fail-closed checks, attestation storage (`confinement-attestation.v1`), herdr convergence with shared `evaluateBypassPairing`, setup defaults and doctor checks; spec: docs/specs/confinement-authority.md Pane herdr confine cho agent không phải claude (codex/agy/pi): công thức private-home + account inventory + lịch sử các commit đã đi qua (và vì sao từng bị quên) ở §13.1.\n- `docs/architect/README.md` + `docs/architect/architecture-intent.md` + `docs/architect/domainization/README.md` — portal architect-level, registry intention xuyên-khu-vực, và deep-dive domainization (core đóng vs `domains/<name>/` adapter mở: manifest/workflow YAML, task-spec, skill, knowledge, doctrine, agent, resolver, enforcement); active thread đầu tiên giữ intent mở rộng fgOS từ fan-out/fan-in + artifact mediation thành năng lực group-thinking/problem-solving rộng hơn (Delphi/NGT/RFC/adversarial/master-coordinator), giữ `group-cognition-framework.yaml` isolation-heavy không bị nới ngầm; liên quan Step 09 group-thinking substrate, Step 10 coding-domain adoption, component authority boundary map, và Domain Components And Extension Layer\n- `src/workflow/` (`definition.mjs`, `runner.mjs`, `step-fsm.mjs`, `units-source.mjs`) + `core/workflows/*.yaml` — Workflow engine (Request-to-Run P3a/P4): DAG steps, human gates, dependency scheduling, runner integration; `units-source.mjs` dịch units file của `fgos workflow start --units` thành Workflow tạm (RUL89 (workflow start --units)); spec: `docs/specs/runner.md`\n- `src/runner/execution/` (`unit.mjs`, `bind.mjs`, `run.mjs`, `patterns/`) — Execution Core (Request-to-Run P1/P2/P4): Unit (hợp đồng dữ liệu duy nhất), `bind()` (chọn executor 5 mức), `fgos run` (cửa chạy mới, herdr mặc định), CollaborationPattern (`solo`, `reviewed`, `panel` + presets `consult`, `research-fan-out`, `rfc`, `code-change`); `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi Unit (RUL84 (one write-scope matcher)), dùng cho runner commit, settlement và Workflow; spec: `docs/specs/runner.md`\n- `docs/architect/agent-coordination/` — thiết kế agent-coordination lịch sử (đã thu hồi ở P4 per D-0050, thay bằng Workflow runner và Execution Core); `README.md` là portal ghi nhận chuyển tiếp; `contracts/` lưu giữ hợp đồng lịch sử (`coordination-session.md`, `flow-definition.md`).\n- `docs/architect/host-invocation-routing/` — kiến trúc định tuyến và host runtime Rust (5 tệp: `host-invocation-provider-routing.md` — hợp đồng kernel canonical OperationRequest/ProviderOutcome, pure Router, InvocationService; `legacy-cli-transition.md` — chiến lược exec payload Node với parity harness và descriptor command-routes; `external-provider-protocol.md` — giao thức external provider R2; `node-to-rust-component-migration.md` — lộ trình chuyển dịch component từ Node sang Rust; `rust-cli-and-proof-components-plan.md` — kế hoạch triển khai Rust CLI host và proof components); spec: docs/specs/distribution.md\n- `src/runner/merge.mjs` — cơ chế cổng duyệt PR nội bộ (`classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`), dùng bởi `bin/fgos.mjs` verb `review`/`approve`/`reject`, nay tham số hóa được nhánh đích (cây chính hoặc nhánh của gốc — cây nhánh tích hợp); `catchup` (bin/fgos.mjs) dùng lại cùng cơ chế git cho cả tầng con→gốc lẫn gốc→cây chính; `isMainWorktree` (STR44) — chặn cấu trúc (không dựa sổ đăng ký session) xác nhận `cwd` LÀ worktree chính trước khi `approve` merge/verify, bắt cả worktree tay không đăng ký qua `fgos session start` — cùng `detectTrunk` nay ở `src/runner/worktree.mjs` (theo tsk-49i), không còn ở file này; spec: docs/specs/runner.md\n- `src/verbs/<domain>/<verb>.mjs` — tầng use-case của CLI (theo tsk-49i): logic nghiệp vụ của một verb, chữ ký thống nhất `<verb>UseCase(ctx, options)` — `ctx` là thứ adapter tính từ môi trường (`{dir, cwd?, repoRoot?}`, use-case KHÔNG BAO GIỜ tự đọc `process.cwd()`/`process.env`/argv), `options` là flag đã parse; trả đúng payload `fgos.v1` (bọc envelope + map exit-code vẫn ở `bin/fgos.mjs`), refusal vẫn `throw StoreError`. Cụm đầu tiên: `src/verbs/merge/` (`merge`/`approve`/`review`/`sync-root`/`catchup`/`reject`/`promote-to-component`) — `bin/fgos.mjs` cho 7 verb này nay chỉ parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb, gọi một hàm use-case. Không ngụ ý migrate 7 file use-case-rank sẵn có (`runner/loop.mjs`, `intake/*`, `setup/*`, `state/cursor.mjs`); spec: docs/specs/runner.md\n- `src/report/item-trace.mjs` — trace outcome/friction của MỘT item, đọc thuần trên view (`collectOutcomeEntry`/`collectFrictionData`/`collectReviewTrace`); dùng chung bởi `review` (use-case) và `check`/`show`/`doc-sources`/`evolve` (`bin/fgos.mjs`); spec: docs/specs/runner.md\n- `src/runner/github-adapter.mjs` — vận chuyển GitHub thuần cho cổng duyệt PR nội bộ (`createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR`/`classifyGhFailure`, shell ra `gh` CLI thật, layer infra), dùng bởi `bin/fgos.mjs` verb `review`/`approve --github`; spec: docs/specs/runner.md\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ của trợ lý (`.fgos/logs/<id>.log`, git-ignored): `appendWorkerLog` — khối kết-cục cuối, gọi bởi `loop.mjs` sau mỗi lượt dispatch; `appendWorkerLogChunk` — live tee từng chunk stdout/stderr khi đến (STR39), gọi bởi `dispatch.mjs`'s `spawnWorker` qua `opts.onChunk`; spec: docs/specs/runner.md\n- `src/runner/session.mjs` — vòng đời phiên checkout đa-phiên tùy chọn (fgos-multi-session-checkout, STR35): `createSession`/`endSession`/`listSessions`/`reclaimOrphanedSessions`, worktree detached-HEAD mỗi phiên (`git worktree add --detach`), `.fgos` symlink dùng chung (KHÔNG BAO GIỜ sao chép), sổ `.fgos/sessions.json` canh bởi `.fgos/sessions.lock` riêng; dùng bởi `bin/fgos.mjs` verb `session`; spec: docs/specs/runner.md\n- `packages/observe/rust/src/metrics_cli/entropy.rs` — tín hiệu entropy-trend + đếm compounding (thuần, đọc trên view work-state), surfaced qua `fgos metrics entropy`; spec: docs/specs/runner.md\n- `src/report/enduser-index.mjs` — bộ sinh CHỈ MỤC đọc-theo-tag tài liệu người-dùng-cuối (biến đổi dữ liệu, không tự thực hiện I/O; ghi chú mirror entropy trong source là lịch sử, `src/report/entropy.mjs` không còn): `QUADRANTS`, bảng nguồn-sự-thật `QUADRANT_META` (quadrant→{purpose,audience}), `QUADRANT_DIR_ALIASES` (quadrant→vị trí thay thế trên đĩa, theo str64-backfill; hiện `explanation`→`['decisions']`), `findSourceCaptureId` (gom một, cho chỉ mục), `findSourceCaptureIds` (gom mọi capture của một đường dẫn, cho `doc-sources`), `buildEnduserIndex`; I/O + verb `fgos docs-index` (quét cả thư mục chính lẫn `QUADRANT_DIR_ALIASES`, ghi manifest `docs/enduser-docs-index.json`) và verb `fgos doc-sources <docPath>` (gom nguồn của một đường dẫn) sống ở `bin/fgos.mjs`, cả hai quyền `read`; vận hành chỉ mục: kỹ năng `fgos-indexing`; spec: docs/specs/enduser-docs-index.md **Truth correction:** src/report/enduser-index.mjs:1-17; packages/observe/rust/src/metrics_cli/entropy.rs:1.\n- `src/report/frontmatter.mjs` — bộ đọc/ghi đầu-mô-tả OKF-style của mỗi tài liệu người-dùng-cuối (thuần, không I/O, không phụ thuộc thư viện ngoài — theo str64-backfill): `parseFrontmatter`/`renderFrontmatter` (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn); tách biệt với bộ sinh chỉ mục — đầu-mô-tả là bản sao ghi-lúc-soạn, KHÔNG phải nguồn thẩm quyền của linkage; spec: docs/specs/enduser-docs-index.md\n- Historical `src/evolve/candidates.mjs` — path not present at this commit; `src/report/entropy.mjs`, `listUnsettledFrictionsByWork` và verb `fgos evolve` cũng không còn. Tín hiệu entropy hiện ở `packages/observe/rust/src/metrics_cli/entropy.rs`, qua `fgos metrics entropy`; không có cửa candidate ranking được mô tả ở câu cũ. **Truth correction:** src/cli/command-registry.mjs:98,204-207; packages/observe/rust/src/metrics_cli/entropy.rs:1; src/evolve/iron-law.mjs:1 (only current src/evolve file; full src/bin/packages symbol search has no old ranking symbol).\n- `src/state/impact.mjs` — backlog-triage impact ranking (STR21, cửa 2 của triage — tách bạch khỏi STR14 intake-triage): thuần, xếp hạng item CHƯA `done` theo `blocks` (số item khác chưa `done` liệt kê nó trong `deps`); surfaced qua `fgos triage`; spec: docs/specs/work-state.md\n- `src/state/awaiting-context.mjs` — neo gốc cho cổng chờ-người (str61-chat-context-continuity): thuần, đọc trên view work-state, tính `{parent, changedSinceAsk?}` cho một item `awaiting-human` có `parent` mỗi lần đọc (không lưu trữ); surfaced qua `fgos list`'s khóa cộng thêm `awaitingContext`; spec: docs/specs/work-state.md §RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2, kernel layer, dùng chung giữa `classify.mjs` và `iron-law.mjs`); spec: docs/specs/runner.md\n- `src/evolve/iron-law.mjs` — Iron Law risk classifier cho vòng tự cải thiện (self-improve loop, STR13 Slice 2): thuần, đã được gọi qua `src/runner/iron-law-gate.mjs` (import và gọi `classifyIronLaw`); spec: docs/specs/runner.md **Truth correction:** src/evolve/iron-law.mjs:64; src/runner/iron-law-gate.mjs:20,59.\n- `docs/platform/session-identity/spec.md` — spec thành phần Session Identity: nguồn duy nhất trả lời \"writer của process này là ai\" (`{id, source}`); source: `packages/session-identity/rust` (verb native `fgos identity`), contracts + vector dùng chung: `packages/session-identity/contracts/`; Node chỉ gọi qua facade `src/util/session-identity.mjs` (tìm binary: `src/util/host-bin-path.mjs`).\n- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`.\n- `test/` — node:test suite (`npm test`; tổng số test lịch sử 2970 chưa được đếm lại): smoke + state + cli + runner + report + e2e (rebuild-determinism, runner-loop — gồm kịch bản cửa pull S2-pull + con fork từ tip nhánh gốc, pr-gate — 4 kịch bản trọn vòng review/approve/reject, dispatch song song thật với cửa sổ chồng-lấn đo được); benchmark lịch sử ngoài suite (F4): `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` — path not present at this commit; không có benchmark hiện hành ở đường dẫn này **Truth correction:** package.json:28 (scripts.test); git ls-tree e7393ea3c docs/history/phase-3-compound-learning (no entries).\n- `scripts/run-test-canary.mjs` (`npm run test:canary -- <file...>`) + `scripts/test-select.mjs` (`npm run test:related -- --explain`, plus `test:related:shadow` for evidence-gathering; manifest: `test/test-ownership.mjs`) — additive fast test-feedback doors, `npm test` unchanged/authoritative either way; how-to: `docs/how-to/use-fast-test-feedback-commands.md`; plan: `archive/plans/260920-immediate-test-feedback-reduction/plan.md` **Truth correction:** archive/plans/260920-immediate-test-feedback-reduction/plan.md:5.\n- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored; `.fgos/logs/<id>.log` — bản ghi output cục bộ của trợ lý theo từng việc, gitignored (spec: docs/specs/runner.md)\n- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent (bản sản phẩm — thuần forgent)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_42444c5f44c4076300c2b9c56516c429"
}
```

## Entry claim_85d25e6ad2429e431b1b4d7d7025a498

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_85d25e6ad2429e431b1b4d7d7025a498",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "3adebe39e20de4111a989dc5578c387c3643fc6128519c96624385efef42fb24",
    "identityFingerprint": "3adebe39e20de4111a989dc5578c387c3643fc6128519c96624385efef42fb24",
    "claimId": "claim_85d25e6ad2429e431b1b4d7d7025a498",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b951d131c085ce17b7fccbcbd71473f53db24b05e4301cdf01cb42945de0b2ec",
    "claimKind": "navigation",
    "status": "current",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "3adebe39e20de4111a989dc5578c387c3643fc6128519c96624385efef42fb24",
    "identityFingerprint": "3adebe39e20de4111a989dc5578c387c3643fc6128519c96624385efef42fb24",
    "claimId": "claim_85d25e6ad2429e431b1b4d7d7025a498",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b951d131c085ce17b7fccbcbd71473f53db24b05e4301cdf01cb42945de0b2ec",
    "claimKind": "navigation",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 22,
    "endLine": 24,
    "textDigest": "b951d131c085ce17b7fccbcbd71473f53db24b05e4301cdf01cb42945de0b2ec",
    "sample": "This map provides reader routes and the merged detailed product/source map in\n[section 5](#5-detailed-product-and-source-map). The legacy source remains\nretained for provenance unt",
    "identityFingerprint": "3adebe39e20de4111a989dc5578c387c3643fc6128519c96624385efef42fb24",
    "ancestry": [
      "Documentation Reading Map"
    ],
    "text": "This map provides reader routes and the merged detailed product/source map in\n[section 5](#5-detailed-product-and-source-map). The legacy source remains\nretained for provenance until consumer cutover."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 22,
    "endLine": 24,
    "textDigest": "b951d131c085ce17b7fccbcbd71473f53db24b05e4301cdf01cb42945de0b2ec",
    "sample": "This map provides reader routes and the merged detailed product/source map in\n[section 5](#5-detailed-product-and-source-map). The legacy source remains\nretained for provenance unt",
    "identityFingerprint": "3adebe39e20de4111a989dc5578c387c3643fc6128519c96624385efef42fb24",
    "ancestry": [
      "Documentation Reading Map"
    ],
    "text": "This map provides reader routes and the merged detailed product/source map in\n[section 5](#5-detailed-product-and-source-map). The legacy source remains\nretained for provenance until consumer cutover."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_85d25e6ad2429e431b1b4d7d7025a498"
}
```

## Entry claim_ddc56de5664b8049f3498eb46899f4ec

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_ddc56de5664b8049f3498eb46899f4ec",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "8d671260e0efa9830d191c2aa43c0a12d75b40abbb626fb17761a05964c2af3d",
    "identityFingerprint": "8d671260e0efa9830d191c2aa43c0a12d75b40abbb626fb17761a05964c2af3d",
    "claimId": "claim_ddc56de5664b8049f3498eb46899f4ec",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "67798e09dff5c22bd679b1b04d1f4ee104f5699de0f19d8c9ebd18c7a8b19c17",
    "claimKind": "navigation",
    "status": "current",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "8d671260e0efa9830d191c2aa43c0a12d75b40abbb626fb17761a05964c2af3d",
    "identityFingerprint": "8d671260e0efa9830d191c2aa43c0a12d75b40abbb626fb17761a05964c2af3d",
    "claimId": "claim_ddc56de5664b8049f3498eb46899f4ec",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "67798e09dff5c22bd679b1b04d1f4ee104f5699de0f19d8c9ebd18c7a8b19c17",
    "claimKind": "navigation",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 28,
    "endLine": 36,
    "textDigest": "67798e09dff5c22bd679b1b04d1f4ee104f5699de0f19d8c9ebd18c7a8b19c17",
    "sample": "| Need | Read |\n|---|---|\n| Understand documentation rules | [doc-governance.md](doc-governance.md) |\n| Resolve authority during transition | [transitional-switchboard.md](transiti",
    "identityFingerprint": "8d671260e0efa9830d191c2aa43c0a12d75b40abbb626fb17761a05964c2af3d",
    "ancestry": [
      "Documentation Reading Map",
      "1. Start Here"
    ],
    "text": "| Need | Read |\n|---|---|\n| Understand documentation rules | [doc-governance.md](doc-governance.md) |\n| Resolve authority during transition | [transitional-switchboard.md](transitional-switchboard.md) |\n| Understand platform-wide docs | [platform/README.md](platform/README.md) |\n| Understand packaging, install, activation, setup, and doctor | [platform/packaging-distribution/README.md](platform/packaging-distribution/README.md) |\n| Understand the detailed product/source map | [Section 5](#5-detailed-product-and-source-map) |\n| Shape a new multi-round design | Create or update a discussion scratchpad |\n| Understand an area | `docs/platform/<area>/README.md`, or current legacy `docs/specs/<area>.md` during migration |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 28,
    "endLine": 36,
    "textDigest": "67798e09dff5c22bd679b1b04d1f4ee104f5699de0f19d8c9ebd18c7a8b19c17",
    "sample": "| Need | Read |\n|---|---|\n| Understand documentation rules | [doc-governance.md](doc-governance.md) |\n| Resolve authority during transition | [transitional-switchboard.md](transiti",
    "identityFingerprint": "8d671260e0efa9830d191c2aa43c0a12d75b40abbb626fb17761a05964c2af3d",
    "ancestry": [
      "Documentation Reading Map",
      "1. Start Here"
    ],
    "text": "| Need | Read |\n|---|---|\n| Understand documentation rules | [doc-governance.md](doc-governance.md) |\n| Resolve authority during transition | [transitional-switchboard.md](transitional-switchboard.md) |\n| Understand platform-wide docs | [platform/README.md](platform/README.md) |\n| Understand packaging, install, activation, setup, and doctor | [platform/packaging-distribution/README.md](platform/packaging-distribution/README.md) |\n| Understand the detailed product/source map | [Section 5](#5-detailed-product-and-source-map) |\n| Shape a new multi-round design | Create or update a discussion scratchpad |\n| Understand an area | `docs/platform/<area>/README.md`, or current legacy `docs/specs/<area>.md` during migration |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_ddc56de5664b8049f3498eb46899f4ec"
}
```

## Entry claim_4eeb2f406288458e61bad21531966ab1

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/distribution.md",
    "unitDigest": "ed84cdf379aa83d6602ee9481bc8be5d20724b26a93c6574af72532650b95619",
    "identityFingerprint": "6f2f5b9da0db4875bb1e19b709c7091621358c4582bdb6e937873f765467acd9",
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourceAnchor": "data-dictionary",
    "unitKind": "heading",
    "sourceUnitDigest": "192108cf0505221ad1943f7a12c459ba1c7e456a75f483983bc718b5d66523dd",
    "claimKind": "specification",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/distribution.md",
    "unitDigest": "6f5ebbe0d4bf45bbe61a46b082fc8d84f95e120f7e62f8c01c8af86ff1d7e3fb",
    "identityFingerprint": "a12ee238bf46dbb593445e87f009ff49eabf8909da233a79cb77963dfab64331",
    "claimId": "claim_4eeb2f406288458e61bad21531966ab1",
    "sourceAnchor": "data-dictionary",
    "unitKind": "heading",
    "sourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "claimKind": "specification",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "ed84cdf379aa83d6602ee9481bc8be5d20724b26a93c6574af72532650b95619",
      "toUnitDigest": "6f5ebbe0d4bf45bbe61a46b082fc8d84f95e120f7e62f8c01c8af86ff1d7e3fb",
      "fromSourceUnitDigest": "192108cf0505221ad1943f7a12c459ba1c7e456a75f483983bc718b5d66523dd",
      "toSourceUnitDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Data Dictionary",
    "anchor": "data-dictionary",
    "githubAnchor": "data-dictionary",
    "stableAnchor": "h-db5457235e3f",
    "startLine": 55,
    "endLine": 55,
    "textDigest": "192108cf0505221ad1943f7a12c459ba1c7e456a75f483983bc718b5d66523dd",
    "sample": "Data Dictionary",
    "sectionPayloadDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "followingBlockDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "identityFingerprint": "6f2f5b9da0db4875bb1e19b709c7091621358c4582bdb6e937873f765467acd9",
    "ancestry": [
      "Spec: Distribution"
    ],
    "text": "## Data Dictionary",
    "sectionText": "## Data Dictionary\n\n| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Data Dictionary",
    "anchor": "data-dictionary",
    "githubAnchor": "data-dictionary",
    "stableAnchor": "h-db5457235e3f",
    "startLine": 55,
    "endLine": 55,
    "textDigest": "04f89e98512b5fd7af474ab2abbf362b9a0d30a25b5a911d011037539b3a9d3f",
    "sample": "Data Dictionary",
    "sectionPayloadDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "followingBlockDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "identityFingerprint": "a12ee238bf46dbb593445e87f009ff49eabf8909da233a79cb77963dfab64331",
    "ancestry": [
      "Spec: Distribution"
    ],
    "text": "## Data Dictionary",
    "sectionText": "## Data Dictionary\n\n| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `writer-identity-resolvable` (the writer identity resolves through the Rust host for both the running host and the workspace activation a plain git commit hook uses; each binary is asked directly, so an older activated release shows as a version mismatch), `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_4eeb2f406288458e61bad21531966ab1"
}
```

## Entry claim_d9185072d68925b4c020b13ba6c4d74f

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_d9185072d68925b4c020b13ba6c4d74f",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/distribution.md",
    "unitDigest": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "identityFingerprint": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "claimId": "claim_d9185072d68925b4c020b13ba6c4d74f",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "claimKind": "specification",
    "status": "current",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 57,
    "endLine": 73,
    "textDigest": "59297ed6cac29ae0d34e9f3a48ca0c518e8c06fed5e224ca0182f627ae93839e",
    "sample": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based i",
    "identityFingerprint": "efdbc472e987bef628352ebcce1a16bf80b33d017c6b99af37f0f9d20d2dd69f",
    "ancestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "text": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `writer-identity-resolvable` (the writer identity resolves through the Rust host for both the running host and the workspace activation a plain git commit hook uses; each binary is asked directly, so an older activated release shows as a version mismatch), `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_d9185072d68925b4c020b13ba6c4d74f"
}
```

## Entry claim_b2a51d5d39832d330879947bdbbcb227

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/observe.md",
    "unitDigest": "7776d8bac9c3c43fd28ad50303bae1269c53c42802ebe1355b8c765b7cb6aac5",
    "identityFingerprint": "0b013c439f15bae96e644f0ffe63e0520751391602c6639f5e6acf900106b1d6",
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourceAnchor": "owns",
    "unitKind": "heading",
    "sourceUnitDigest": "867c3b15546d97e9565b557a2dbff37cfde054ad310e8a19be48d316ef159476",
    "claimKind": "specification",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/observe.md",
    "unitDigest": "79ecdd6f98fcaea03a21ee5a759953706ac9d76f69954a640fbcf6da5dcc7844",
    "identityFingerprint": "4f30fa5a4bf9cedf2a45a147639ccf65bb8775574dcbf1ec929c5167d09abaff",
    "claimId": "claim_b2a51d5d39832d330879947bdbbcb227",
    "sourceAnchor": "owns",
    "unitKind": "heading",
    "sourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "claimKind": "specification",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "7776d8bac9c3c43fd28ad50303bae1269c53c42802ebe1355b8c765b7cb6aac5",
      "toUnitDigest": "79ecdd6f98fcaea03a21ee5a759953706ac9d76f69954a640fbcf6da5dcc7844",
      "fromSourceUnitDigest": "867c3b15546d97e9565b557a2dbff37cfde054ad310e8a19be48d316ef159476",
      "toSourceUnitDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Owns",
    "anchor": "owns",
    "githubAnchor": "owns",
    "stableAnchor": "h-9ad6f085e283",
    "startLine": 12,
    "endLine": 12,
    "textDigest": "867c3b15546d97e9565b557a2dbff37cfde054ad310e8a19be48d316ef159476",
    "sample": "Owns",
    "sectionPayloadDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
    "followingBlockDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
    "identityFingerprint": "0b013c439f15bae96e644f0ffe63e0520751391602c6639f5e6acf900106b1d6",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ],
    "text": "### Owns",
    "sectionText": "### Owns\n- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`).\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 3,
    "title": "Owns",
    "anchor": "owns",
    "githubAnchor": "owns",
    "stableAnchor": "h-9ad6f085e283",
    "startLine": 12,
    "endLine": 12,
    "textDigest": "ca2fd76b4ca2fe575e858e1f9ae76cf0ddf0f7300593c6a58b11ac2249b4d1b2",
    "sample": "Owns",
    "sectionPayloadDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "followingBlockDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "identityFingerprint": "4f30fa5a4bf9cedf2a45a147639ccf65bb8775574dcbf1ec929c5167d09abaff",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries"
    ],
    "text": "### Owns",
    "sectionText": "### Owns\n- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`). `writerId` lấy từ crate Session Identity ([spec](../platform/session-identity/spec.md)): chính session id khi `source` là `env`/`registry` (gồm `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`), `pid-<id>` khi `pid`/`unresolved` (gốc terminal hoặc session, không còn pid của chính process). `sessionId` của friction cũng lấy từ đó. Observe không tự đọc biến env identity.\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_b2a51d5d39832d330879947bdbbcb227"
}
```

## Entry claim_bf1888a05f53ba3cd515eb792c5059b8

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_bf1888a05f53ba3cd515eb792c5059b8",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/observe.md",
    "unitDigest": "d4ba57f63848f35113fc0984b0062b63b09b99132feba60325b6be4553f5d2aa",
    "identityFingerprint": "d4ba57f63848f35113fc0984b0062b63b09b99132feba60325b6be4553f5d2aa",
    "claimId": "claim_bf1888a05f53ba3cd515eb792c5059b8",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "claimKind": "specification",
    "status": "current",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 13,
    "endLine": 17,
    "textDigest": "36f5428de433214eb4a9a17e3a2366471095b9bb658faa4f11d4bb108beea137",
    "sample": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`,",
    "identityFingerprint": "d4ba57f63848f35113fc0984b0062b63b09b99132feba60325b6be4553f5d2aa",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "text": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`). `writerId` lấy từ crate Session Identity ([spec](../platform/session-identity/spec.md)): chính session id khi `source` là `env`/`registry` (gồm `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`), `pid-<id>` khi `pid`/`unresolved` (gốc terminal hoặc session, không còn pid của chính process). `sessionId` của friction cũng lấy từ đó. Observe không tự đọc biến env identity.\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_bf1888a05f53ba3cd515eb792c5059b8"
}
```

## Entry claim_8e290abbe8f1344bf8f19c997da11921

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/reading-map.md",
    "unitDigest": "81dd20b5b075d4d303917f761ebaee7acc91b404dab48cfee804131434716bc2",
    "identityFingerprint": "3e29f8d1eb2d7348d1ff497279758b1b8e021546b01081cf78d4502b0bf17463",
    "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
    "sourceAnchor": "reading-map-sản-phẩm",
    "unitKind": "heading",
    "sourceUnitDigest": "22c6580953028171ac1febd1a750c1930c6374a479ea17af5aa6f541df122f18",
    "claimKind": "specification",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/reading-map.md",
    "unitDigest": "9abd2b0338d441697db7a86a864101adb4753d42f594e653ab3b22c5c73ac51e",
    "identityFingerprint": "8484fc7eb4c6a966da4ba2680864f0be73a943485c6a698dea142d2db4dd8acb",
    "claimId": "claim_8e290abbe8f1344bf8f19c997da11921",
    "sourceAnchor": "reading-map-sản-phẩm",
    "unitKind": "heading",
    "sourceUnitDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a",
    "claimKind": "specification",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "81dd20b5b075d4d303917f761ebaee7acc91b404dab48cfee804131434716bc2",
      "toUnitDigest": "9abd2b0338d441697db7a86a864101adb4753d42f594e653ab3b22c5c73ac51e",
      "fromSourceUnitDigest": "22c6580953028171ac1febd1a750c1930c6374a479ea17af5aa6f541df122f18",
      "toSourceUnitDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Reading Map (sản phẩm)",
    "anchor": "reading-map-sản-phẩm",
    "githubAnchor": "reading-map-sản-phẩm",
    "stableAnchor": "h-725e8ebaeb49",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "22c6580953028171ac1febd1a750c1930c6374a479ea17af5aa6f541df122f18",
    "sample": "Reading Map (sản phẩm)",
    "sectionPayloadDigest": "317c0d276097175c006908eb368eba665719983e0cd2d0624f43fd73158b6e12",
    "followingBlockDigest": "db75e0b3a3bb12f6da1feaaf6321eede85a208e6c93dcf82978ee26618a79196",
    "identityFingerprint": "3e29f8d1eb2d7348d1ff497279758b1b8e021546b01081cf78d4502b0bf17463",
    "ancestry": [],
    "text": "# Reading Map (sản phẩm)",
    "sectionText": "# Reading Map (sản phẩm)\n\n> **Quy tắc chuyển tiếp hiện hành:** bắt đầu ở `docs/reading-map.md` và `docs/platform/README.md`\n> (hoặc tra cứu nhanh tại `docs/transitional-switchboard.md`), rồi dùng mapping current-source tường minh của\n> portal area. Không suy authority từ path, ngày review, độ chi tiết, hoặc\n> riêng metadata `Canonical:`. Bảng kiểm chứng Phase 00 sống tại\n> `plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md`;\n> bảng đó không promote, migrate hay retire source nào. Phase 00 và Phase 01 đã\n> hoàn tất; Phase 02–09 vẫn chưa được authorize.\n\n- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)\n- `docs/architecture-map.md` — bản chuẩn kiến trúc (v0.2, record ADR0010 (bản đồ kiến trúc là bản chuẩn)): 5 tầng + 2 lớp phủ, sổ component + sổ contract (CTR001–CTR009), nghi thức thẻ-căn-cước-trước-code\n- `docs/work-item-lifecycle-vision.md` — tầm nhìn nền tảng: chu trình sống của work-item (mixed-autonomy, base-workflow + domain-extension); khung cho các PBI STR14-STR18\n- `docs/platform/packaging-distribution/README.md` — portal hiện hành cho packaging/distribution: `fgctl` bootstrap/init/repair/upgrade, workspace activation, doctor/fix readiness, legacy Node compatibility, skill/instruction projections. Khi mục này mâu thuẫn với `docs/specs/distribution.md`, đọc portal + implementation-alignment trước; `docs/specs/distribution.md` hiện là legacy/generated-curated source trong lúc migration.\n- `docs/distribution-vision.md` — tầm nhìn nền tảng lịch sử: cài đặt/setup/doctor ổn định + tái dùng được (không cần clone, global/project không xung đột — project ghi đè global, doctor/setup tự fix hạ tầng + merge config thiếu, module mới tự đăng ký năng lực config, CI như một phần của setup); đã được promote/supersede từng phần vào `docs/platform/packaging-distribution/vision.md`.\n- `docs/specs/` — state layer: area spec + system-overview + bản đồ này\n- `docs/routing-handoff-contract.md` — hợp đồng handoff agent↔agent + ranh giới tin cậy\n- `docs/io-contract.md` — hợp đồng giao tiếp VÀO/RA của cửa CLI + bề mặt stdout `fgos-runner` (str46-io-contract): danh tính `writer`/`role`, envelope `fgos.v1` + ngoại lệ có lý do, exit-code một nguồn, sổ verb (`touchesState`/`externalEffect`/`paginated`/`multiValueFormat`), version token, ranh giới ngoài (STR38/STR48/STR83)\n- `docs/coexistence.md` — doctrine chạy cạnh một harness agent khác (record ADR0009 (chống giao thoa lúc cài — fgOS khi cài không giao thoa tiến trình với harness khác)): lãnh địa, một-nhạc-trưởng-mỗi-phiên, nhường-nhịn lúc `init`, manifest `.fgos/coexistence.json`, Known Gaps chưa flip; `src/install/coexist.mjs` — cài đặt detection + manifest (read-only, không đè)\n- `package.json` (`version`, `files`, `bin.fgos`, `bin.fgos-runner`) + `README.md` (mục `## Install`) — cài `fgos` VÀ `fgos-runner` từ ngoài source repo qua GitHub install, cả hai executable ngay sau cài; `test/install-packaging.test.mjs` — proof e2e (pack → install → chạy từ project ngoài, gồm cả hai binary); spec: docs/specs/distribution.md\n- `scripts/fgos-shell-integration.sh` — dev checkout shell helper (STR87 first slice): hàm `fgos`/`fgos-runner` tự resolve root qua `git rev-parse --git-common-dir` (worktree-safe), source từ shell profile của contributor, không cài đặt gì; test: `test/scripts/fgos-shell-integration.test.mjs`; spec: docs/specs/distribution.md §Dev checkout shell helpers\n- `src/setup/` (`ansi.mjs`, `config-merge.mjs`, `shell-rc.mjs`, `checks.mjs`) + `bin/fgos.mjs`'s current legacy `setup`/`doctor` verbs + `src/cli/command-registry.mjs` entries — doctor/fix registry and legacy setup compatibility: `doctor` chẩn đoán read-only, `doctor --fix` chạy registered fixes, current Node `fgos setup` vẫn tồn tại nhưng target architecture supersedes onboarding bằng `fgctl init` + local `fgos init` / `fgos doctor --fix` / `fgos doctor`; manifest: `docs/architecture-manifest.json`; test: `test/setup/*.test.mjs`; current portal: `docs/platform/packaging-distribution/README.md`; legacy spec: docs/specs/distribution.md §Setup, §Doctor\n- `docs/decisions/` — hồ sơ quyết định dài hạn cho người ngoài (decision records); từ str64-backfill, mỗi record còn mang đầu-mô-tả OKF-style (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn, xem `frontmatter.mjs` dòng dưới) và được `fgos docs-index` công nhận là vị trí thay thế của ngăn `explanation` (R10, spec: docs/specs/enduser-docs-index.md) — thân ADR không đổi, chỉ thêm đầu-mô-tả; lưu ý `orchestrator` là pinned term đã đổi nghĩa giữa chừng (0026→0028 nghĩa cũ \"launcher\", 0029 nghĩa mới \"tầng hợp thành T0\"; xem chuỗi quyết định tại `docs/decisions/index.md` dòng 28-32)\n- `scripts/check-decision-citation-drift.mjs` + `test/scripts/check-decision-citation-drift.test.mjs` — quét `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế trên cùng dòng (STR72 CoS clause 2, PBI p-2d71dfc3); chỉ phát hiện, không tự sửa; spec: docs/specs/decision-citation-drift.md\n- `scripts/check-decision-codes.mjs` + `test/scripts/check-decision-codes.test.mjs` — quét `test/**/*.test.mjs` tìm tên test còn nhúng mã quyết định nội bộ (str##/D#/RUL##/STR##/tsk-xxx) thay vì mô tả bất biến bằng lời thường (review-audit-self-decision.md mục Stable Code Artifacts); chặn (ratchet) chỉ vi phạm MỚI so với `scripts/check-decision-codes.baseline.json` đã chốt, không chặn ngược nợ cũ; `npm test` tự chạy qua glob `test/**/*.test.mjs`, không hook riêng\n- `docs/id-systems-audit.md` — audit + quyết định hình dạng mọi hệ id/mã đang sống trong hệ thống (work.id/kind/Story/ADR/Rule/Contract phía fgOS; D-hex/D-local/cell-id/feature-slug/severity phía bee) — nguồn cho `work.id`'s `tsk-<hash>` và các migration STR53-STR58 (tất cả đã `done`); boundary appendix: `docs/architecture-map.md` Phụ lục B\n- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; gồm verb `edit` — sửa đè các trường (title/kind/risk/verify/tier/refs/deps/acceptance/priority/intent — str7-str8-priority-intent) trên một item đã có, cùng cửa ghi CTR002 như `add`/`move`; gồm verb `take`/`return` — cửa pull giao–nhận việc cho tác nhân ngoài runner; gồm verb `pick` — cửa pull GỘP `take` + dựng workspace (`createWorktree`), role cố định `session`, không cờ `--role` (theo str83-fgos-slash-commands); gồm verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, một cổng cho mọi đề xuất `awaiting-approval`, nay leaf-vs-root-aware (con nhập vào nhánh của gốc, gốc nhập vào cây chính); `review`/`approve` nay chấp nhận thêm `--github [--pr <n>]` — vận chuyển thay thế CÙNG cổng duyệt qua GitHub thay vì diff/merge cục bộ (chỉ nguồn runner, theo github-adapter, spec: docs/specs/runner.md); gồm verb `catchup` — đồng bộ lại một việc đỗ vì gãy nhập/trôi tích hợp (spec: docs/specs/runner.md); gồm verb `session` (`start`/`end`/`list`) — vòng đời phiên checkout đa-phiên tùy chọn, mỗi phiên một worktree detached-HEAD cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink (spec: docs/specs/runner.md); spec: docs/specs/work-state.md\n- `src/state/` — lõi work-state: events (nhật ký; `appendEvent` nay khóa liên-tiến-trình `.fgos/events.lock`, per fgos-multi-session-checkout Epic 3/STR35 — xem spec Work-State RUL10 (tiền đề có ngưỡng — một người ghi tại một thời điểm; multi-agent ghi đồng thời qua `.fgos/events.lock`)), work (schema — STATUSES + STAGES + field `parent` lineage + field `domain`), fsm (bảng chuyển status + CAS), stage (bảng chuyển stage + CAS, chiều vĩ mô song song fsm; cạnh chuyển-stage tra theo domain của item — `coding`: `discovery → exploring → planning → executing`, trong đó phán-quyết `clear` ở `discovery` bỏ qua `exploring` để sang thẳng `planning` còn `unclear` đi qua `exploring`; tên `decompose` vẫn còn nhưng chỉ là bí danh legacy chỉ-để-rút-cạn (không việc MỚI nào vào được nữa); `synthetic`: một stage, không cạnh nào), domains (sổ đăng ký domain — stage list + step-mapping base-workflow + cạnh-chuyển mỗi domain; `coding` + ba domain minh họa/thử-nghiệm `synthetic` (đúng một stage), `triage`, `fixture-marketing`; base-workflow-model STR18, hoàn tất S1+S2), replay (fold), frontier (truy vấn sẵn-sàng — lọc theo status, stage domain-aware, VÀ lineage qua `parent`), dep-graph (dò chu trình trên `deps` — bất biến phi-chu-trình tại cửa ghi, per work-graph-intelligence S1), store (chủ ghi duy nhất + readRawEvents), envelope (phong bì output CTR001, `wrapEnvelope` — nay bọc MỌI verb ở một cửa in trong `bin/fgos.mjs main()`, STR37; spec: docs/specs/work-state.md §envelope)\n- `src/cli/command-registry.mjs` — sổ verb máy-đọc của CLI (STR37, kernel, thuần dữ liệu): `SCHEMA_VERSION` + `COMMAND_REGISTRY` (mọi verb với `{name, invoke, description, parameters, examples, access read|mutation, deprecated}`); `bin/fgos.mjs` `--help [--json]` và `<verb> [<sub>] --help [--json]` sinh sổ từ đây; verb có sub-verb mang `subcommands`, `HELP_SELECTORS` (`--help`, `-h`) thành route của Rust host qua `scripts/export-command-selectors.mjs`; test chống-lệch `test/cli/fgos-manifest.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` (cờ handler ↔ schema sub-verb), `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/help-routes.test.mjs` (qua host thật); spec: docs/specs/work-state.md §sổ verb\n- `src/intake/classify.mjs` — logic thuần của `fgos submit`: deriveTitle, classify (tier/kind/risk cơ học), generateId (`tsk-<hash>` chống trùng, STR53)\n- `src/intake/discovery.mjs` — context-discovery của stage `discovery` (stage đầu tiên của domain `coding`): `resolveDiscovery` (đọc-phán-ghi, dùng chung bởi verb `discover` và vòng tự hành) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDiscovery` đã rút; phán-quyết `clear` chuyển item sang stage `planning`, `unclear` sang `exploring`\n- `src/intake/plan.mjs` — phán chia-việc của stage `planning`: `resolvePlan` (đọc-phán-ghi, dùng chung bởi verb `plan` và vòng tự hành khi item ở stage `planning`, hoặc ở bí danh legacy `decompose`) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDecompose` đã rút, cùng lý do `judgeDiscovery` rút; sinh con qua lineage `parent`, không qua `deps`\n- `domains/coding/AGENTS.md` `## fgOS Workflow` + `.claude/skills/` (`.agents/skills/` mirror byte-identical) — lớp hướng dẫn P50: entry skill (`fgos-routing`) + skill giai đoạn (`fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-knowledge`) trỏ một phiên tự mở tới đúng skill theo `stage` của item; từ str89-fgos-domain-skills, tra cứu này domain-pluggable — đọc trường `domain` + `stage` của item rồi tra qua `skillForStage`/`getDomain` (`src/state/workflow-stage-graphs.mjs`), không còn giả định ngầm domain `coding`; `fgos-routing` nay có hàng khoá theo **status** `retrospective → fgos-coding-knowledge` (skill tổng hợp cấp nhãn Diataxis + soạn tài liệu người-dùng-cuối) — stage `compound-learn` đã rút, việc tổng hợp nó từng canh nay là việc của status `retrospective`; skill ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã rút (tsk-6ar) — `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`) nay tự chạy clarify+classify trong cùng phiên sống, cùng việc mà skill đó từng làm nhưng trên bản mô tả SẠCH hơn; spec: docs/specs/work-state.md §RUL60 (hành vi), docs/specs/runner.md (lớp hướng dẫn)\n- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md\n- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)\n- `docs/how-to/`, `docs/tutorials/`, `docs/reference/`, `docs/explanation/` — tài liệu NGƯỜI-DÙNG-CUỐI theo bốn quadrant Diataxis (audience-facing, khác `docs/specs/` là BA-reference nội bộ); sinh bởi kỹ năng `fgos-coding-knowledge` ở status `retrospective` (grow-or-create một tài liệu SỐNG mỗi đường dẫn: gom mọi capture qua `fgos doc-sources` rồi tích luỹ không mất, ngăn Diataxis là trục cấu trúc duy nhất — write-side, spec: docs/specs/enduser-docs-authoring.md), quadrant khớp `docType` capture; `docs/explanation/` từ str64-backfill còn có 6 tài liệu chưng cất từ critical-patterns.md (learnings vận hành bee thật sự thuộc tiến trình hình thành fgOS); chỉ mục đọc-theo-tag máy-đọc-được: `docs/enduser-docs-index.json` (sinh bởi verb `fgos docs-index` / kỹ năng `fgos-indexing`, thay cho việc liệt-kê-tay từng tài liệu — supersedes con trỏ văn xuôi cũ, theo compound-learn-enduser-docs; ngăn `explanation` còn quét thêm `docs/decisions/` làm vị trí thay thế, theo str64-backfill); spec read-side: docs/specs/enduser-docs-index.md\n- `src/runner/` + `bin/fgos-runner.mjs` — vòng tự hành (loop/dispatch/worktree/recovery/anti-loop/write-queue/root-affinity); `loop.mjs`'s `runWatch` + `write-queue.mjs`'s `onCommit` — chế độ `--watch` bền, tín hiệu-cơ-học + nghỉ dự phòng, ghép `runOnce` không đổi làm hộp đen (str7-str8-priority-intent, spec: docs/specs/runner.md §RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); loop giao việc theo mẻ song song có giới hạn hai tầng (cấu hình `parallel` trong `.fgos/config.json`'s `runner` section, theo tsk-5vf), giữ quyền-sở-hữu-gốc trong một lượt chạy, quét làm-rõ rồi quét chia-việc trước mọi dispatch thi công; gặt-lại bỏ qua claim của cửa pull (`claimRole` human/session); `dispatch.mjs`'s executor là port có tên CTR009 v2 (`EXECUTOR_ADAPTERS`, per-tier qua config's `executors`, STR41), `ensureRunnerConfigForDir` tự sinh cấu hình mặc định tại `.fgos/config.json` khi vắng mặt (không áp dụng cho `--config` tường minh, str76-runner-bootstrap; tsk-5hv xoá hẳn fallback về file flat legacy cũ); worker của loop và fan-out chạy như một Unit run qua `runUnit` (`work-dispatch.mjs`'s `spawnWorker`), `fgos-runner` không còn `--config` (spec: docs/specs/runner.md §RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) và prompt worker được tách sang `prompt-templates.mjs` + `prompt-templates/*.txt` (chọn template qua bảng cơ học kind/tier/domain, substitution `{placeholder}` thuần, log dispatch kèm tên+hash template, STR49); `goal-check.mjs` — hàm goal-check dùng chung giữa vòng tự hành và verb `return`; `write-queue.mjs` — cửa ghi tuần tự giữ một-người-ghi dưới song song; `root-affinity.mjs` — quyền-sở-hữu-gốc, giữ mọi con của một gốc chung một chủ trong một lượt chạy; `resolveRepoRoot` nay còn xác nhận HEAD repo resolve được trước khi runner claim bất kỳ item nào (fail-fast, str86-runner-headless-git D ecfd0d1a); config: `.fgos/config.json`'s `runner` section (tự sinh khi vắng mặt tại đường mặc định, nguồn config duy nhất kể từ tsk-5hv); spec: docs/specs/runner.md\n- `docs/specs/confinement-authority.md` + `src/runner/dispatch/confinement/` — Agent Confinement Authority: runtime one-door confinement enforcement (`executeThroughConfinement`), machine backend registry `~/.fgos/confinement-backends.json`, local `bwrap` v1 driver with 8 falsification probes, required fail-closed checks, attestation storage (`confinement-attestation.v1`), herdr convergence with shared `evaluateBypassPairing`, setup defaults and doctor checks; spec: docs/specs/confinement-authority.md Pane herdr confine cho agent không phải claude (codex/agy/pi): công thức private-home + account inventory + lịch sử các commit đã đi qua (và vì sao từng bị quên) ở §13.1.\n- `docs/architect/README.md` + `docs/architect/architecture-intent.md` + `docs/architect/domainization/README.md` — portal architect-level, registry intention xuyên-khu-vực, và deep-dive domainization (core đóng vs `domains/<name>/` adapter mở: manifest/workflow YAML, task-spec, skill, knowledge, doctrine, agent, resolver, enforcement); active thread đầu tiên giữ intent mở rộng fgOS từ fan-out/fan-in + artifact mediation thành năng lực group-thinking/problem-solving rộng hơn (Delphi/NGT/RFC/adversarial/master-coordinator), giữ `group-cognition-framework.yaml` isolation-heavy không bị nới ngầm; liên quan Step 09 group-thinking substrate, Step 10 coding-domain adoption, component authority boundary map, và Domain Components And Extension Layer\n- `src/workflow/` (`definition.mjs`, `runner.mjs`, `step-fsm.mjs`, `units-source.mjs`) + `core/workflows/*.yaml` — Workflow engine (Request-to-Run P3a/P4): DAG steps, human gates, dependency scheduling, runner integration; `units-source.mjs` dịch units file của `fgos workflow start --units` thành Workflow tạm (RUL89 (workflow start --units)); spec: `docs/specs/runner.md`\n- `src/runner/execution/` (`unit.mjs`, `bind.mjs`, `run.mjs`, `patterns/`) — Execution Core (Request-to-Run P1/P2/P4): Unit (hợp đồng dữ liệu duy nhất), `bind()` (chọn executor 5 mức), `fgos run` (cửa chạy mới, herdr mặc định), CollaborationPattern (`solo`, `reviewed`, `panel` + presets `consult`, `research-fan-out`, `rfc`, `code-change`); `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi Unit (RUL84 (one write-scope matcher)), dùng cho runner commit, settlement và Workflow; spec: `docs/specs/runner.md`\n- `docs/architect/agent-coordination/` — thiết kế agent-coordination lịch sử (đã thu hồi ở P4 per D-0050, thay bằng Workflow runner và Execution Core); `README.md` là portal ghi nhận chuyển tiếp; `contracts/` lưu giữ hợp đồng lịch sử (`coordination-session.md`, `flow-definition.md`).\n- `docs/architect/host-invocation-routing/` — kiến trúc định tuyến và host runtime Rust (5 tệp: `host-invocation-provider-routing.md` — hợp đồng kernel canonical OperationRequest/ProviderOutcome, pure Router, InvocationService; `legacy-cli-transition.md` — chiến lược exec payload Node với parity harness và descriptor command-routes; `external-provider-protocol.md` — giao thức external provider R2; `node-to-rust-component-migration.md` — lộ trình chuyển dịch component từ Node sang Rust; `rust-cli-and-proof-components-plan.md` — kế hoạch triển khai Rust CLI host và proof components); spec: docs/specs/distribution.md\n- `src/runner/merge.mjs` — cơ chế cổng duyệt PR nội bộ (`classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`), dùng bởi `bin/fgos.mjs` verb `review`/`approve`/`reject`, nay tham số hóa được nhánh đích (cây chính hoặc nhánh của gốc — cây nhánh tích hợp); `catchup` (bin/fgos.mjs) dùng lại cùng cơ chế git cho cả tầng con→gốc lẫn gốc→cây chính; `isMainWorktree` (STR44) — chặn cấu trúc (không dựa sổ đăng ký session) xác nhận `cwd` LÀ worktree chính trước khi `approve` merge/verify, bắt cả worktree tay không đăng ký qua `fgos session start` — cùng `detectTrunk` nay ở `src/runner/worktree.mjs` (theo tsk-49i), không còn ở file này; spec: docs/specs/runner.md\n- `src/verbs/<domain>/<verb>.mjs` — tầng use-case của CLI (theo tsk-49i): logic nghiệp vụ của một verb, chữ ký thống nhất `<verb>UseCase(ctx, options)` — `ctx` là thứ adapter tính từ môi trường (`{dir, cwd?, repoRoot?}`, use-case KHÔNG BAO GIỜ tự đọc `process.cwd()`/`process.env`/argv), `options` là flag đã parse; trả đúng payload `fgos.v1` (bọc envelope + map exit-code vẫn ở `bin/fgos.mjs`), refusal vẫn `throw StoreError`. Cụm đầu tiên: `src/verbs/merge/` (`merge`/`approve`/`review`/`sync-root`/`catchup`/`reject`/`promote-to-component`) — `bin/fgos.mjs` cho 7 verb này nay chỉ parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb, gọi một hàm use-case. Không ngụ ý migrate 7 file use-case-rank sẵn có (`runner/loop.mjs`, `intake/*`, `setup/*`, `state/cursor.mjs`); spec: docs/specs/runner.md\n- `src/report/item-trace.mjs` — trace outcome/friction của MỘT item, đọc thuần trên view (`collectOutcomeEntry`/`collectFrictionData`/`collectReviewTrace`); dùng chung bởi `review` (use-case) và `check`/`show`/`doc-sources`/`evolve` (`bin/fgos.mjs`); spec: docs/specs/runner.md\n- `src/runner/github-adapter.mjs` — vận chuyển GitHub thuần cho cổng duyệt PR nội bộ (`createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR`/`classifyGhFailure`, shell ra `gh` CLI thật, layer infra), dùng bởi `bin/fgos.mjs` verb `review`/`approve --github`; spec: docs/specs/runner.md\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ của trợ lý (`.fgos/logs/<id>.log`, git-ignored): `appendWorkerLog` — khối kết-cục cuối, gọi bởi `loop.mjs` sau mỗi lượt dispatch; `appendWorkerLogChunk` — live tee từng chunk stdout/stderr khi đến (STR39), gọi bởi `dispatch.mjs`'s `spawnWorker` qua `opts.onChunk`; spec: docs/specs/runner.md\n- `src/runner/session.mjs` — vòng đời phiên checkout đa-phiên tùy chọn (fgos-multi-session-checkout, STR35): `createSession`/`endSession`/`listSessions`/`reclaimOrphanedSessions`, worktree detached-HEAD mỗi phiên (`git worktree add --detach`), `.fgos` symlink dùng chung (KHÔNG BAO GIỜ sao chép), sổ `.fgos/sessions.json` canh bởi `.fgos/sessions.lock` riêng; dùng bởi `bin/fgos.mjs` verb `session`; spec: docs/specs/runner.md\n- `packages/observe/rust/src/metrics_cli/entropy.rs` — tín hiệu entropy-trend + đếm compounding (thuần, đọc trên view work-state), surfaced qua `fgos metrics entropy`; spec: docs/specs/runner.md\n- `src/report/enduser-index.mjs` — bộ sinh CHỈ MỤC đọc-theo-tag tài liệu người-dùng-cuối (thuần, không I/O — mirror `entropy.mjs`): `QUADRANTS`, bảng nguồn-sự-thật `QUADRANT_META` (quadrant→{purpose,audience}), `QUADRANT_DIR_ALIASES` (quadrant→vị trí thay thế trên đĩa, theo str64-backfill; hiện `explanation`→`['decisions']`), `findSourceCaptureId` (gom một, cho chỉ mục), `findSourceCaptureIds` (gom mọi capture của một đường dẫn, cho `doc-sources`), `buildEnduserIndex`; I/O + verb `fgos docs-index` (quét cả thư mục chính lẫn `QUADRANT_DIR_ALIASES`, ghi manifest `docs/enduser-docs-index.json`) và verb `fgos doc-sources <docPath>` (gom nguồn của một đường dẫn) sống ở `bin/fgos.mjs`, cả hai quyền `read`; vận hành chỉ mục: kỹ năng `fgos-indexing`; spec: docs/specs/enduser-docs-index.md\n- `src/report/frontmatter.mjs` — bộ đọc/ghi đầu-mô-tả OKF-style của mỗi tài liệu người-dùng-cuối (thuần, không I/O, không phụ thuộc thư viện ngoài — theo str64-backfill): `parseFrontmatter`/`renderFrontmatter` (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn); tách biệt với bộ sinh chỉ mục — đầu-mô-tả là bản sao ghi-lúc-soạn, KHÔNG phải nguồn thẩm quyền của linkage; spec: docs/specs/enduser-docs-index.md\n- `src/evolve/candidates.mjs` — Gate A candidate ranking cho vòng tự cải thiện (self-improve loop, STR13 Slice 1): thuần, đọc trên view work-state, dùng lại `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa lại); surfaced qua `fgos evolve` (liệt kê + `--pick <id>`, hai bước, không stdin); spec: docs/specs/runner.md\n- `src/state/impact.mjs` — backlog-triage impact ranking (STR21, cửa 2 của triage — tách bạch khỏi STR14 intake-triage): thuần, xếp hạng item CHƯA `done` theo `blocks` (số item khác chưa `done` liệt kê nó trong `deps`); surfaced qua `fgos triage`; spec: docs/specs/work-state.md\n- `src/state/awaiting-context.mjs` — neo gốc cho cổng chờ-người (str61-chat-context-continuity): thuần, đọc trên view work-state, tính `{parent, changedSinceAsk?}` cho một item `awaiting-human` có `parent` mỗi lần đọc (không lưu trữ); surfaced qua `fgos list`'s khóa cộng thêm `awaitingContext`; spec: docs/specs/work-state.md §RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2, kernel layer, dùng chung giữa `classify.mjs` và `iron-law.mjs`); spec: docs/specs/runner.md\n- `src/evolve/iron-law.mjs` — Iron Law risk classifier cho vòng tự cải thiện (self-improve loop, STR13 Slice 2): thuần, chưa có call site (Slice 3 wiring); spec: docs/specs/runner.md\n- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`.\n- `test/` — node:test suite (`npm test`, 2970 test): smoke + state + cli + runner + report + e2e (rebuild-determinism, runner-loop — gồm kịch bản cửa pull S2-pull + con fork từ tip nhánh gốc, pr-gate — 4 kịch bản trọn vòng review/approve/reject, dispatch song song thật với cửa sổ chồng-lấn đo được); benchmark ngoài suite (F4) tại `docs/history/phase-3-compound-learning/reports/f4-benchmark.md`\n- `scripts/run-test-canary.mjs` (`npm run test:canary -- <file...>`) + `scripts/test-select.mjs` (`npm run test:related -- --explain`, plus `test:related:shadow` for evidence-gathering; manifest: `test/test-ownership.mjs`) — additive fast test-feedback doors, `npm test` unchanged/authoritative either way; how-to: `docs/how-to/use-fast-test-feedback-commands.md`; plan: `plans/260920-immediate-test-feedback-reduction/plan.md`\n- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored; `.fgos/logs/<id>.log` — bản ghi output cục bộ của trợ lý theo từng việc, gitignored (spec: docs/specs/runner.md)\n- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent (bản sản phẩm — thuần forgent)"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 1,
    "title": "Reading Map (sản phẩm)",
    "anchor": "reading-map-sản-phẩm",
    "githubAnchor": "reading-map-sản-phẩm",
    "stableAnchor": "h-725e8ebaeb49",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "19c2ff247fb664d39a56d6194b1d47b6dce16ea18c8ee19369bd2884efbf918a",
    "sample": "Reading Map (sản phẩm)",
    "sectionPayloadDigest": "f9a5c59939acf1b234de4509d1c0e8b1c29f66d3e593a2a32fad9e674b1fa2fd",
    "followingBlockDigest": "db75e0b3a3bb12f6da1feaaf6321eede85a208e6c93dcf82978ee26618a79196",
    "identityFingerprint": "8484fc7eb4c6a966da4ba2680864f0be73a943485c6a698dea142d2db4dd8acb",
    "ancestry": [],
    "text": "# Reading Map (sản phẩm)",
    "sectionText": "# Reading Map (sản phẩm)\n\n> **Quy tắc chuyển tiếp hiện hành:** bắt đầu ở `docs/reading-map.md` và `docs/platform/README.md`\n> (hoặc tra cứu nhanh tại `docs/transitional-switchboard.md`), rồi dùng mapping current-source tường minh của\n> portal area. Không suy authority từ path, ngày review, độ chi tiết, hoặc\n> riêng metadata `Canonical:`. Bảng kiểm chứng Phase 00 sống tại\n> `plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md`;\n> bảng đó không promote, migrate hay retire source nào. Phase 00 và Phase 01 đã\n> hoàn tất; Phase 02–09 vẫn chưa được authorize.\n\n- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)\n- `docs/architecture-map.md` — bản chuẩn kiến trúc (v0.2, record ADR0010 (bản đồ kiến trúc là bản chuẩn)): 5 tầng + 2 lớp phủ, sổ component + sổ contract (CTR001–CTR009), nghi thức thẻ-căn-cước-trước-code\n- `docs/work-item-lifecycle-vision.md` — tầm nhìn nền tảng: chu trình sống của work-item (mixed-autonomy, base-workflow + domain-extension); khung cho các PBI STR14-STR18\n- `docs/platform/packaging-distribution/README.md` — portal hiện hành cho packaging/distribution: `fgctl` bootstrap/init/repair/upgrade, workspace activation, doctor/fix readiness, legacy Node compatibility, skill/instruction projections. Khi mục này mâu thuẫn với `docs/specs/distribution.md`, đọc portal + implementation-alignment trước; `docs/specs/distribution.md` hiện là legacy/generated-curated source trong lúc migration.\n- `docs/distribution-vision.md` — tầm nhìn nền tảng lịch sử: cài đặt/setup/doctor ổn định + tái dùng được (không cần clone, global/project không xung đột — project ghi đè global, doctor/setup tự fix hạ tầng + merge config thiếu, module mới tự đăng ký năng lực config, CI như một phần của setup); đã được promote/supersede từng phần vào `docs/platform/packaging-distribution/vision.md`.\n- `docs/specs/` — state layer: area spec + system-overview + bản đồ này\n- `docs/routing-handoff-contract.md` — hợp đồng handoff agent↔agent + ranh giới tin cậy\n- `docs/io-contract.md` — hợp đồng giao tiếp VÀO/RA của cửa CLI + bề mặt stdout `fgos-runner` (str46-io-contract): danh tính `writer`/`role`, envelope `fgos.v1` + ngoại lệ có lý do, exit-code một nguồn, sổ verb (`touchesState`/`externalEffect`/`paginated`/`multiValueFormat`), version token, ranh giới ngoài (STR38/STR48/STR83)\n- `docs/coexistence.md` — doctrine chạy cạnh một harness agent khác (record ADR0009 (chống giao thoa lúc cài — fgOS khi cài không giao thoa tiến trình với harness khác)): lãnh địa, một-nhạc-trưởng-mỗi-phiên, nhường-nhịn lúc `init`, manifest `.fgos/coexistence.json`, Known Gaps chưa flip; `src/install/coexist.mjs` — cài đặt detection + manifest (read-only, không đè)\n- `package.json` (`version`, `files`, `bin.fgos`, `bin.fgos-runner`) + `README.md` (mục `## Install`) — cài `fgos` VÀ `fgos-runner` từ ngoài source repo qua GitHub install, cả hai executable ngay sau cài; `test/install-packaging.test.mjs` — proof e2e (pack → install → chạy từ project ngoài, gồm cả hai binary); spec: docs/specs/distribution.md\n- `scripts/fgos-shell-integration.sh` — dev checkout shell helper (STR87 first slice): hàm `fgos`/`fgos-runner` tự resolve root qua `git rev-parse --git-common-dir` (worktree-safe), source từ shell profile của contributor, không cài đặt gì; test: `test/scripts/fgos-shell-integration.test.mjs`; spec: docs/specs/distribution.md §Dev checkout shell helpers\n- `src/setup/` (`ansi.mjs`, `config-merge.mjs`, `shell-rc.mjs`, `checks.mjs`) + `bin/fgos.mjs`'s current legacy `setup`/`doctor` verbs + `src/cli/command-registry.mjs` entries — doctor/fix registry and legacy setup compatibility: `doctor` chẩn đoán read-only, `doctor --fix` chạy registered fixes, current Node `fgos setup` vẫn tồn tại nhưng target architecture supersedes onboarding bằng `fgctl init` + local `fgos init` / `fgos doctor --fix` / `fgos doctor`; manifest: `docs/architecture-manifest.json`; test: `test/setup/*.test.mjs`; current portal: `docs/platform/packaging-distribution/README.md`; legacy spec: docs/specs/distribution.md §Setup, §Doctor\n- `docs/decisions/` — hồ sơ quyết định dài hạn cho người ngoài (decision records); từ str64-backfill, mỗi record còn mang đầu-mô-tả OKF-style (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn, xem `frontmatter.mjs` dòng dưới) và được `fgos docs-index` công nhận là vị trí thay thế của ngăn `explanation` (R10, spec: docs/specs/enduser-docs-index.md) — thân ADR không đổi, chỉ thêm đầu-mô-tả; lưu ý `orchestrator` là pinned term đã đổi nghĩa giữa chừng (0026→0028 nghĩa cũ \"launcher\", 0029 nghĩa mới \"tầng hợp thành T0\"; xem chuỗi quyết định tại `docs/decisions/index.md` dòng 28-32)\n- `scripts/check-decision-citation-drift.mjs` + `test/scripts/check-decision-citation-drift.test.mjs` — quét `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế trên cùng dòng (STR72 CoS clause 2, PBI p-2d71dfc3); chỉ phát hiện, không tự sửa; spec: docs/specs/decision-citation-drift.md\n- `scripts/check-decision-codes.mjs` + `test/scripts/check-decision-codes.test.mjs` — quét `test/**/*.test.mjs` tìm tên test còn nhúng mã quyết định nội bộ (str##/D#/RUL##/STR##/tsk-xxx) thay vì mô tả bất biến bằng lời thường (review-audit-self-decision.md mục Stable Code Artifacts); chặn (ratchet) chỉ vi phạm MỚI so với `scripts/check-decision-codes.baseline.json` đã chốt, không chặn ngược nợ cũ; `npm test` tự chạy qua glob `test/**/*.test.mjs`, không hook riêng\n- `docs/id-systems-audit.md` — audit + quyết định hình dạng mọi hệ id/mã đang sống trong hệ thống (work.id/kind/Story/ADR/Rule/Contract phía fgOS; D-hex/D-local/cell-id/feature-slug/severity phía bee) — nguồn cho `work.id`'s `tsk-<hash>` và các migration STR53-STR58 (tất cả đã `done`); boundary appendix: `docs/architecture-map.md` Phụ lục B\n- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; gồm verb `edit` — sửa đè các trường (title/kind/risk/verify/tier/refs/deps/acceptance/priority/intent — str7-str8-priority-intent) trên một item đã có, cùng cửa ghi CTR002 như `add`/`move`; gồm verb `take`/`return` — cửa pull giao–nhận việc cho tác nhân ngoài runner; gồm verb `pick` — cửa pull GỘP `take` + dựng workspace (`createWorktree`), role cố định `session`, không cờ `--role` (theo str83-fgos-slash-commands); gồm verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, một cổng cho mọi đề xuất `awaiting-approval`, nay leaf-vs-root-aware (con nhập vào nhánh của gốc, gốc nhập vào cây chính); `review`/`approve` nay chấp nhận thêm `--github [--pr <n>]` — vận chuyển thay thế CÙNG cổng duyệt qua GitHub thay vì diff/merge cục bộ (chỉ nguồn runner, theo github-adapter, spec: docs/specs/runner.md); gồm verb `catchup` — đồng bộ lại một việc đỗ vì gãy nhập/trôi tích hợp (spec: docs/specs/runner.md); gồm verb `session` (`start`/`end`/`list`) — vòng đời phiên checkout đa-phiên tùy chọn, mỗi phiên một worktree detached-HEAD cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink (spec: docs/specs/runner.md); spec: docs/specs/work-state.md\n- `src/state/` — lõi work-state: events (nhật ký; `appendEvent` nay khóa liên-tiến-trình `.fgos/events.lock`, per fgos-multi-session-checkout Epic 3/STR35 — xem spec Work-State RUL10 (tiền đề có ngưỡng — một người ghi tại một thời điểm; multi-agent ghi đồng thời qua `.fgos/events.lock`)), work (schema — STATUSES + STAGES + field `parent` lineage + field `domain`), fsm (bảng chuyển status + CAS), stage (bảng chuyển stage + CAS, chiều vĩ mô song song fsm; cạnh chuyển-stage tra theo domain của item — `coding`: `discovery → exploring → planning → executing`, trong đó phán-quyết `clear` ở `discovery` bỏ qua `exploring` để sang thẳng `planning` còn `unclear` đi qua `exploring`; tên `decompose` vẫn còn nhưng chỉ là bí danh legacy chỉ-để-rút-cạn (không việc MỚI nào vào được nữa); `synthetic`: một stage, không cạnh nào), domains (sổ đăng ký domain — stage list + step-mapping base-workflow + cạnh-chuyển mỗi domain; `coding` + ba domain minh họa/thử-nghiệm `synthetic` (đúng một stage), `triage`, `fixture-marketing`; base-workflow-model STR18, hoàn tất S1+S2), replay (fold), frontier (truy vấn sẵn-sàng — lọc theo status, stage domain-aware, VÀ lineage qua `parent`), dep-graph (dò chu trình trên `deps` — bất biến phi-chu-trình tại cửa ghi, per work-graph-intelligence S1), store (chủ ghi duy nhất + readRawEvents), envelope (phong bì output CTR001, `wrapEnvelope` — nay bọc MỌI verb ở một cửa in trong `bin/fgos.mjs main()`, STR37; spec: docs/specs/work-state.md §envelope)\n- `src/cli/command-registry.mjs` — sổ verb máy-đọc của CLI (STR37, kernel, thuần dữ liệu): `SCHEMA_VERSION` + `COMMAND_REGISTRY` (mọi verb với `{name, invoke, description, parameters, examples, access read|mutation, deprecated}`); `bin/fgos.mjs` `--help [--json]` và `<verb> [<sub>] --help [--json]` sinh sổ từ đây; verb có sub-verb mang `subcommands`, `HELP_SELECTORS` (`--help`, `-h`) thành route của Rust host qua `scripts/export-command-selectors.mjs`; test chống-lệch `test/cli/fgos-manifest.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` (cờ handler ↔ schema sub-verb), `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/help-routes.test.mjs` (qua host thật); spec: docs/specs/work-state.md §sổ verb\n- `src/intake/classify.mjs` — logic thuần của `fgos submit`: deriveTitle, classify (tier/kind/risk cơ học), generateId (`tsk-<hash>` chống trùng, STR53)\n- `src/intake/discovery.mjs` — context-discovery của stage `discovery` (stage đầu tiên của domain `coding`): `resolveDiscovery` (đọc-phán-ghi, dùng chung bởi verb `discover` và vòng tự hành) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDiscovery` đã rút; phán-quyết `clear` chuyển item sang stage `planning`, `unclear` sang `exploring`\n- `src/intake/plan.mjs` — phán chia-việc của stage `planning`: `resolvePlan` (đọc-phán-ghi, dùng chung bởi verb `plan` và vòng tự hành khi item ở stage `planning`, hoặc ở bí danh legacy `decompose`) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDecompose` đã rút, cùng lý do `judgeDiscovery` rút; sinh con qua lineage `parent`, không qua `deps`\n- `domains/coding/AGENTS.md` `## fgOS Workflow` + `.claude/skills/` (`.agents/skills/` mirror byte-identical) — lớp hướng dẫn P50: entry skill (`fgos-routing`) + skill giai đoạn (`fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-knowledge`) trỏ một phiên tự mở tới đúng skill theo `stage` của item; từ str89-fgos-domain-skills, tra cứu này domain-pluggable — đọc trường `domain` + `stage` của item rồi tra qua `skillForStage`/`getDomain` (`src/state/workflow-stage-graphs.mjs`), không còn giả định ngầm domain `coding`; `fgos-routing` nay có hàng khoá theo **status** `retrospective → fgos-coding-knowledge` (skill tổng hợp cấp nhãn Diataxis + soạn tài liệu người-dùng-cuối) — stage `compound-learn` đã rút, việc tổng hợp nó từng canh nay là việc của status `retrospective`; skill ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã rút (tsk-6ar) — `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`) nay tự chạy clarify+classify trong cùng phiên sống, cùng việc mà skill đó từng làm nhưng trên bản mô tả SẠCH hơn; spec: docs/specs/work-state.md §RUL60 (hành vi), docs/specs/runner.md (lớp hướng dẫn)\n- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md\n- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)\n- `docs/how-to/`, `docs/tutorials/`, `docs/reference/`, `docs/explanation/` — tài liệu NGƯỜI-DÙNG-CUỐI theo bốn quadrant Diataxis (audience-facing, khác `docs/specs/` là BA-reference nội bộ); sinh bởi kỹ năng `fgos-coding-knowledge` ở status `retrospective` (grow-or-create một tài liệu SỐNG mỗi đường dẫn: gom mọi capture qua `fgos doc-sources` rồi tích luỹ không mất, ngăn Diataxis là trục cấu trúc duy nhất — write-side, spec: docs/specs/enduser-docs-authoring.md), quadrant khớp `docType` capture; `docs/explanation/` từ str64-backfill còn có 6 tài liệu chưng cất từ critical-patterns.md (learnings vận hành bee thật sự thuộc tiến trình hình thành fgOS); chỉ mục đọc-theo-tag máy-đọc-được: `docs/enduser-docs-index.json` (sinh bởi verb `fgos docs-index` / kỹ năng `fgos-indexing`, thay cho việc liệt-kê-tay từng tài liệu — supersedes con trỏ văn xuôi cũ, theo compound-learn-enduser-docs; ngăn `explanation` còn quét thêm `docs/decisions/` làm vị trí thay thế, theo str64-backfill); spec read-side: docs/specs/enduser-docs-index.md\n- `src/runner/` + `bin/fgos-runner.mjs` — vòng tự hành (loop/dispatch/worktree/recovery/anti-loop/write-queue/root-affinity); `loop.mjs`'s `runWatch` + `write-queue.mjs`'s `onCommit` — chế độ `--watch` bền, tín hiệu-cơ-học + nghỉ dự phòng, ghép `runOnce` không đổi làm hộp đen (str7-str8-priority-intent, spec: docs/specs/runner.md §RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); loop giao việc theo mẻ song song có giới hạn hai tầng (cấu hình `parallel` trong `.fgos/config.json`'s `runner` section, theo tsk-5vf), giữ quyền-sở-hữu-gốc trong một lượt chạy, quét làm-rõ rồi quét chia-việc trước mọi dispatch thi công; gặt-lại bỏ qua claim của cửa pull (`claimRole` human/session); `dispatch.mjs`'s executor là port có tên CTR009 v2 (`EXECUTOR_ADAPTERS`, per-tier qua config's `executors`, STR41), `ensureRunnerConfigForDir` tự sinh cấu hình mặc định tại `.fgos/config.json` khi vắng mặt (không áp dụng cho `--config` tường minh, str76-runner-bootstrap; tsk-5hv xoá hẳn fallback về file flat legacy cũ); worker của loop và fan-out chạy như một Unit run qua `runUnit` (`work-dispatch.mjs`'s `spawnWorker`), `fgos-runner` không còn `--config` (spec: docs/specs/runner.md §RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) và prompt worker được tách sang `prompt-templates.mjs` + `prompt-templates/*.txt` (chọn template qua bảng cơ học kind/tier/domain, substitution `{placeholder}` thuần, log dispatch kèm tên+hash template, STR49); `goal-check.mjs` — hàm goal-check dùng chung giữa vòng tự hành và verb `return`; `write-queue.mjs` — cửa ghi tuần tự giữ một-người-ghi dưới song song; `root-affinity.mjs` — quyền-sở-hữu-gốc, giữ mọi con của một gốc chung một chủ trong một lượt chạy; `resolveRepoRoot` nay còn xác nhận HEAD repo resolve được trước khi runner claim bất kỳ item nào (fail-fast, str86-runner-headless-git D ecfd0d1a); config: `.fgos/config.json`'s `runner` section (tự sinh khi vắng mặt tại đường mặc định, nguồn config duy nhất kể từ tsk-5hv); spec: docs/specs/runner.md\n- `docs/specs/confinement-authority.md` + `src/runner/dispatch/confinement/` — Agent Confinement Authority: runtime one-door confinement enforcement (`executeThroughConfinement`), machine backend registry `~/.fgos/confinement-backends.json`, local `bwrap` v1 driver with 8 falsification probes, required fail-closed checks, attestation storage (`confinement-attestation.v1`), herdr convergence with shared `evaluateBypassPairing`, setup defaults and doctor checks; spec: docs/specs/confinement-authority.md Pane herdr confine cho agent không phải claude (codex/agy/pi): công thức private-home + account inventory + lịch sử các commit đã đi qua (và vì sao từng bị quên) ở §13.1.\n- `docs/architect/README.md` + `docs/architect/architecture-intent.md` + `docs/architect/domainization/README.md` — portal architect-level, registry intention xuyên-khu-vực, và deep-dive domainization (core đóng vs `domains/<name>/` adapter mở: manifest/workflow YAML, task-spec, skill, knowledge, doctrine, agent, resolver, enforcement); active thread đầu tiên giữ intent mở rộng fgOS từ fan-out/fan-in + artifact mediation thành năng lực group-thinking/problem-solving rộng hơn (Delphi/NGT/RFC/adversarial/master-coordinator), giữ `group-cognition-framework.yaml` isolation-heavy không bị nới ngầm; liên quan Step 09 group-thinking substrate, Step 10 coding-domain adoption, component authority boundary map, và Domain Components And Extension Layer\n- `src/workflow/` (`definition.mjs`, `runner.mjs`, `step-fsm.mjs`, `units-source.mjs`) + `core/workflows/*.yaml` — Workflow engine (Request-to-Run P3a/P4): DAG steps, human gates, dependency scheduling, runner integration; `units-source.mjs` dịch units file của `fgos workflow start --units` thành Workflow tạm (RUL89 (workflow start --units)); spec: `docs/specs/runner.md`\n- `src/runner/execution/` (`unit.mjs`, `bind.mjs`, `run.mjs`, `patterns/`) — Execution Core (Request-to-Run P1/P2/P4): Unit (hợp đồng dữ liệu duy nhất), `bind()` (chọn executor 5 mức), `fgos run` (cửa chạy mới, herdr mặc định), CollaborationPattern (`solo`, `reviewed`, `panel` + presets `consult`, `research-fan-out`, `rfc`, `code-change`); `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi Unit (RUL84 (one write-scope matcher)), dùng cho runner commit, settlement và Workflow; spec: `docs/specs/runner.md`\n- `docs/architect/agent-coordination/` — thiết kế agent-coordination lịch sử (đã thu hồi ở P4 per D-0050, thay bằng Workflow runner và Execution Core); `README.md` là portal ghi nhận chuyển tiếp; `contracts/` lưu giữ hợp đồng lịch sử (`coordination-session.md`, `flow-definition.md`).\n- `docs/architect/host-invocation-routing/` — kiến trúc định tuyến và host runtime Rust (5 tệp: `host-invocation-provider-routing.md` — hợp đồng kernel canonical OperationRequest/ProviderOutcome, pure Router, InvocationService; `legacy-cli-transition.md` — chiến lược exec payload Node với parity harness và descriptor command-routes; `external-provider-protocol.md` — giao thức external provider R2; `node-to-rust-component-migration.md` — lộ trình chuyển dịch component từ Node sang Rust; `rust-cli-and-proof-components-plan.md` — kế hoạch triển khai Rust CLI host và proof components); spec: docs/specs/distribution.md\n- `src/runner/merge.mjs` — cơ chế cổng duyệt PR nội bộ (`classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`), dùng bởi `bin/fgos.mjs` verb `review`/`approve`/`reject`, nay tham số hóa được nhánh đích (cây chính hoặc nhánh của gốc — cây nhánh tích hợp); `catchup` (bin/fgos.mjs) dùng lại cùng cơ chế git cho cả tầng con→gốc lẫn gốc→cây chính; `isMainWorktree` (STR44) — chặn cấu trúc (không dựa sổ đăng ký session) xác nhận `cwd` LÀ worktree chính trước khi `approve` merge/verify, bắt cả worktree tay không đăng ký qua `fgos session start` — cùng `detectTrunk` nay ở `src/runner/worktree.mjs` (theo tsk-49i), không còn ở file này; spec: docs/specs/runner.md\n- `src/verbs/<domain>/<verb>.mjs` — tầng use-case của CLI (theo tsk-49i): logic nghiệp vụ của một verb, chữ ký thống nhất `<verb>UseCase(ctx, options)` — `ctx` là thứ adapter tính từ môi trường (`{dir, cwd?, repoRoot?}`, use-case KHÔNG BAO GIỜ tự đọc `process.cwd()`/`process.env`/argv), `options` là flag đã parse; trả đúng payload `fgos.v1` (bọc envelope + map exit-code vẫn ở `bin/fgos.mjs`), refusal vẫn `throw StoreError`. Cụm đầu tiên: `src/verbs/merge/` (`merge`/`approve`/`review`/`sync-root`/`catchup`/`reject`/`promote-to-component`) — `bin/fgos.mjs` cho 7 verb này nay chỉ parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb, gọi một hàm use-case. Không ngụ ý migrate 7 file use-case-rank sẵn có (`runner/loop.mjs`, `intake/*`, `setup/*`, `state/cursor.mjs`); spec: docs/specs/runner.md\n- `src/report/item-trace.mjs` — trace outcome/friction của MỘT item, đọc thuần trên view (`collectOutcomeEntry`/`collectFrictionData`/`collectReviewTrace`); dùng chung bởi `review` (use-case) và `check`/`show`/`doc-sources`/`evolve` (`bin/fgos.mjs`); spec: docs/specs/runner.md\n- `src/runner/github-adapter.mjs` — vận chuyển GitHub thuần cho cổng duyệt PR nội bộ (`createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR`/`classifyGhFailure`, shell ra `gh` CLI thật, layer infra), dùng bởi `bin/fgos.mjs` verb `review`/`approve --github`; spec: docs/specs/runner.md\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ của trợ lý (`.fgos/logs/<id>.log`, git-ignored): `appendWorkerLog` — khối kết-cục cuối, gọi bởi `loop.mjs` sau mỗi lượt dispatch; `appendWorkerLogChunk` — live tee từng chunk stdout/stderr khi đến (STR39), gọi bởi `dispatch.mjs`'s `spawnWorker` qua `opts.onChunk`; spec: docs/specs/runner.md\n- `src/runner/session.mjs` — vòng đời phiên checkout đa-phiên tùy chọn (fgos-multi-session-checkout, STR35): `createSession`/`endSession`/`listSessions`/`reclaimOrphanedSessions`, worktree detached-HEAD mỗi phiên (`git worktree add --detach`), `.fgos` symlink dùng chung (KHÔNG BAO GIỜ sao chép), sổ `.fgos/sessions.json` canh bởi `.fgos/sessions.lock` riêng; dùng bởi `bin/fgos.mjs` verb `session`; spec: docs/specs/runner.md\n- `packages/observe/rust/src/metrics_cli/entropy.rs` — tín hiệu entropy-trend + đếm compounding (thuần, đọc trên view work-state), surfaced qua `fgos metrics entropy`; spec: docs/specs/runner.md\n- `src/report/enduser-index.mjs` — bộ sinh CHỈ MỤC đọc-theo-tag tài liệu người-dùng-cuối (thuần, không I/O — mirror `entropy.mjs`): `QUADRANTS`, bảng nguồn-sự-thật `QUADRANT_META` (quadrant→{purpose,audience}), `QUADRANT_DIR_ALIASES` (quadrant→vị trí thay thế trên đĩa, theo str64-backfill; hiện `explanation`→`['decisions']`), `findSourceCaptureId` (gom một, cho chỉ mục), `findSourceCaptureIds` (gom mọi capture của một đường dẫn, cho `doc-sources`), `buildEnduserIndex`; I/O + verb `fgos docs-index` (quét cả thư mục chính lẫn `QUADRANT_DIR_ALIASES`, ghi manifest `docs/enduser-docs-index.json`) và verb `fgos doc-sources <docPath>` (gom nguồn của một đường dẫn) sống ở `bin/fgos.mjs`, cả hai quyền `read`; vận hành chỉ mục: kỹ năng `fgos-indexing`; spec: docs/specs/enduser-docs-index.md\n- `src/report/frontmatter.mjs` — bộ đọc/ghi đầu-mô-tả OKF-style của mỗi tài liệu người-dùng-cuối (thuần, không I/O, không phụ thuộc thư viện ngoài — theo str64-backfill): `parseFrontmatter`/`renderFrontmatter` (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn); tách biệt với bộ sinh chỉ mục — đầu-mô-tả là bản sao ghi-lúc-soạn, KHÔNG phải nguồn thẩm quyền của linkage; spec: docs/specs/enduser-docs-index.md\n- `src/evolve/candidates.mjs` — Gate A candidate ranking cho vòng tự cải thiện (self-improve loop, STR13 Slice 1): thuần, đọc trên view work-state, dùng lại `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa lại); surfaced qua `fgos evolve` (liệt kê + `--pick <id>`, hai bước, không stdin); spec: docs/specs/runner.md\n- `src/state/impact.mjs` — backlog-triage impact ranking (STR21, cửa 2 của triage — tách bạch khỏi STR14 intake-triage): thuần, xếp hạng item CHƯA `done` theo `blocks` (số item khác chưa `done` liệt kê nó trong `deps`); surfaced qua `fgos triage`; spec: docs/specs/work-state.md\n- `src/state/awaiting-context.mjs` — neo gốc cho cổng chờ-người (str61-chat-context-continuity): thuần, đọc trên view work-state, tính `{parent, changedSinceAsk?}` cho một item `awaiting-human` có `parent` mỗi lần đọc (không lưu trữ); surfaced qua `fgos list`'s khóa cộng thêm `awaitingContext`; spec: docs/specs/work-state.md §RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2, kernel layer, dùng chung giữa `classify.mjs` và `iron-law.mjs`); spec: docs/specs/runner.md\n- `src/evolve/iron-law.mjs` — Iron Law risk classifier cho vòng tự cải thiện (self-improve loop, STR13 Slice 2): thuần, chưa có call site (Slice 3 wiring); spec: docs/specs/runner.md\n- `docs/platform/session-identity/spec.md` — spec thành phần Session Identity: nguồn duy nhất trả lời \"writer của process này là ai\" (`{id, source}`); source: `packages/session-identity/rust` (verb native `fgos identity`), contracts + vector dùng chung: `packages/session-identity/contracts/`; Node chỉ gọi qua facade `src/util/session-identity.mjs` (tìm binary: `src/util/host-bin-path.mjs`).\n- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`.\n- `test/` — node:test suite (`npm test`, 2970 test): smoke + state + cli + runner + report + e2e (rebuild-determinism, runner-loop — gồm kịch bản cửa pull S2-pull + con fork từ tip nhánh gốc, pr-gate — 4 kịch bản trọn vòng review/approve/reject, dispatch song song thật với cửa sổ chồng-lấn đo được); benchmark ngoài suite (F4) tại `docs/history/phase-3-compound-learning/reports/f4-benchmark.md`\n- `scripts/run-test-canary.mjs` (`npm run test:canary -- <file...>`) + `scripts/test-select.mjs` (`npm run test:related -- --explain`, plus `test:related:shadow` for evidence-gathering; manifest: `test/test-ownership.mjs`) — additive fast test-feedback doors, `npm test` unchanged/authoritative either way; how-to: `docs/how-to/use-fast-test-feedback-commands.md`; plan: `plans/260920-immediate-test-feedback-reduction/plan.md`\n- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored; `.fgos/logs/<id>.log` — bản ghi output cục bộ của trợ lý theo từng việc, gitignored (spec: docs/specs/runner.md)\n- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent (bản sản phẩm — thuần forgent)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_8e290abbe8f1344bf8f19c997da11921"
}
```

## Entry claim_690e83ad4f79a1bbac8eafc9acb1d4ea

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_690e83ad4f79a1bbac8eafc9acb1d4ea",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/reading-map.md",
    "unitDigest": "c472f5d9628b5c4e2d881017d5d497672ed3ed1d5d1a9bf06022f775c37e701b",
    "identityFingerprint": "c472f5d9628b5c4e2d881017d5d497672ed3ed1d5d1a9bf06022f775c37e701b",
    "claimId": "claim_690e83ad4f79a1bbac8eafc9acb1d4ea",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd",
    "claimKind": "specification",
    "status": "current",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 11,
    "endLine": 64,
    "textDigest": "1c7bbf9e95dcf48b5e1f6de612a5baf82e268ea009eda1ff201ffa5dacdd1fbd",
    "sample": "- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned",
    "identityFingerprint": "c472f5d9628b5c4e2d881017d5d497672ed3ed1d5d1a9bf06022f775c37e701b",
    "ancestry": [
      "Reading Map (sản phẩm)"
    ],
    "text": "- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)\n- `docs/architecture-map.md` — bản chuẩn kiến trúc (v0.2, record ADR0010 (bản đồ kiến trúc là bản chuẩn)): 5 tầng + 2 lớp phủ, sổ component + sổ contract (CTR001–CTR009), nghi thức thẻ-căn-cước-trước-code\n- `docs/work-item-lifecycle-vision.md` — tầm nhìn nền tảng: chu trình sống của work-item (mixed-autonomy, base-workflow + domain-extension); khung cho các PBI STR14-STR18\n- `docs/platform/packaging-distribution/README.md` — portal hiện hành cho packaging/distribution: `fgctl` bootstrap/init/repair/upgrade, workspace activation, doctor/fix readiness, legacy Node compatibility, skill/instruction projections. Khi mục này mâu thuẫn với `docs/specs/distribution.md`, đọc portal + implementation-alignment trước; `docs/specs/distribution.md` hiện là legacy/generated-curated source trong lúc migration.\n- `docs/distribution-vision.md` — tầm nhìn nền tảng lịch sử: cài đặt/setup/doctor ổn định + tái dùng được (không cần clone, global/project không xung đột — project ghi đè global, doctor/setup tự fix hạ tầng + merge config thiếu, module mới tự đăng ký năng lực config, CI như một phần của setup); đã được promote/supersede từng phần vào `docs/platform/packaging-distribution/vision.md`.\n- `docs/specs/` — state layer: area spec + system-overview + bản đồ này\n- `docs/routing-handoff-contract.md` — hợp đồng handoff agent↔agent + ranh giới tin cậy\n- `docs/io-contract.md` — hợp đồng giao tiếp VÀO/RA của cửa CLI + bề mặt stdout `fgos-runner` (str46-io-contract): danh tính `writer`/`role`, envelope `fgos.v1` + ngoại lệ có lý do, exit-code một nguồn, sổ verb (`touchesState`/`externalEffect`/`paginated`/`multiValueFormat`), version token, ranh giới ngoài (STR38/STR48/STR83)\n- `docs/coexistence.md` — doctrine chạy cạnh một harness agent khác (record ADR0009 (chống giao thoa lúc cài — fgOS khi cài không giao thoa tiến trình với harness khác)): lãnh địa, một-nhạc-trưởng-mỗi-phiên, nhường-nhịn lúc `init`, manifest `.fgos/coexistence.json`, Known Gaps chưa flip; `src/install/coexist.mjs` — cài đặt detection + manifest (read-only, không đè)\n- `package.json` (`version`, `files`, `bin.fgos`, `bin.fgos-runner`) + `README.md` (mục `## Install`) — cài `fgos` VÀ `fgos-runner` từ ngoài source repo qua GitHub install, cả hai executable ngay sau cài; `test/install-packaging.test.mjs` — proof e2e (pack → install → chạy từ project ngoài, gồm cả hai binary); spec: docs/specs/distribution.md\n- `scripts/fgos-shell-integration.sh` — dev checkout shell helper (STR87 first slice): hàm `fgos`/`fgos-runner` tự resolve root qua `git rev-parse --git-common-dir` (worktree-safe), source từ shell profile của contributor, không cài đặt gì; test: `test/scripts/fgos-shell-integration.test.mjs`; spec: docs/specs/distribution.md §Dev checkout shell helpers\n- `src/setup/` (`ansi.mjs`, `config-merge.mjs`, `shell-rc.mjs`, `checks.mjs`) + `bin/fgos.mjs`'s current legacy `setup`/`doctor` verbs + `src/cli/command-registry.mjs` entries — doctor/fix registry and legacy setup compatibility: `doctor` chẩn đoán read-only, `doctor --fix` chạy registered fixes, current Node `fgos setup` vẫn tồn tại nhưng target architecture supersedes onboarding bằng `fgctl init` + local `fgos init` / `fgos doctor --fix` / `fgos doctor`; manifest: `docs/architecture-manifest.json`; test: `test/setup/*.test.mjs`; current portal: `docs/platform/packaging-distribution/README.md`; legacy spec: docs/specs/distribution.md §Setup, §Doctor\n- `docs/decisions/` — hồ sơ quyết định dài hạn cho người ngoài (decision records); từ str64-backfill, mỗi record còn mang đầu-mô-tả OKF-style (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn, xem `frontmatter.mjs` dòng dưới) và được `fgos docs-index` công nhận là vị trí thay thế của ngăn `explanation` (R10, spec: docs/specs/enduser-docs-index.md) — thân ADR không đổi, chỉ thêm đầu-mô-tả; lưu ý `orchestrator` là pinned term đã đổi nghĩa giữa chừng (0026→0028 nghĩa cũ \"launcher\", 0029 nghĩa mới \"tầng hợp thành T0\"; xem chuỗi quyết định tại `docs/decisions/index.md` dòng 28-32)\n- `scripts/check-decision-citation-drift.mjs` + `test/scripts/check-decision-citation-drift.test.mjs` — quét `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế trên cùng dòng (STR72 CoS clause 2, PBI p-2d71dfc3); chỉ phát hiện, không tự sửa; spec: docs/specs/decision-citation-drift.md\n- `scripts/check-decision-codes.mjs` + `test/scripts/check-decision-codes.test.mjs` — quét `test/**/*.test.mjs` tìm tên test còn nhúng mã quyết định nội bộ (str##/D#/RUL##/STR##/tsk-xxx) thay vì mô tả bất biến bằng lời thường (review-audit-self-decision.md mục Stable Code Artifacts); chặn (ratchet) chỉ vi phạm MỚI so với `scripts/check-decision-codes.baseline.json` đã chốt, không chặn ngược nợ cũ; `npm test` tự chạy qua glob `test/**/*.test.mjs`, không hook riêng\n- `docs/id-systems-audit.md` — audit + quyết định hình dạng mọi hệ id/mã đang sống trong hệ thống (work.id/kind/Story/ADR/Rule/Contract phía fgOS; D-hex/D-local/cell-id/feature-slug/severity phía bee) — nguồn cho `work.id`'s `tsk-<hash>` và các migration STR53-STR58 (tất cả đã `done`); boundary appendix: `docs/architecture-map.md` Phụ lục B\n- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; gồm verb `edit` — sửa đè các trường (title/kind/risk/verify/tier/refs/deps/acceptance/priority/intent — str7-str8-priority-intent) trên một item đã có, cùng cửa ghi CTR002 như `add`/`move`; gồm verb `take`/`return` — cửa pull giao–nhận việc cho tác nhân ngoài runner; gồm verb `pick` — cửa pull GỘP `take` + dựng workspace (`createWorktree`), role cố định `session`, không cờ `--role` (theo str83-fgos-slash-commands); gồm verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, một cổng cho mọi đề xuất `awaiting-approval`, nay leaf-vs-root-aware (con nhập vào nhánh của gốc, gốc nhập vào cây chính); `review`/`approve` nay chấp nhận thêm `--github [--pr <n>]` — vận chuyển thay thế CÙNG cổng duyệt qua GitHub thay vì diff/merge cục bộ (chỉ nguồn runner, theo github-adapter, spec: docs/specs/runner.md); gồm verb `catchup` — đồng bộ lại một việc đỗ vì gãy nhập/trôi tích hợp (spec: docs/specs/runner.md); gồm verb `session` (`start`/`end`/`list`) — vòng đời phiên checkout đa-phiên tùy chọn, mỗi phiên một worktree detached-HEAD cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink (spec: docs/specs/runner.md); spec: docs/specs/work-state.md\n- `src/state/` — lõi work-state: events (nhật ký; `appendEvent` nay khóa liên-tiến-trình `.fgos/events.lock`, per fgos-multi-session-checkout Epic 3/STR35 — xem spec Work-State RUL10 (tiền đề có ngưỡng — một người ghi tại một thời điểm; multi-agent ghi đồng thời qua `.fgos/events.lock`)), work (schema — STATUSES + STAGES + field `parent` lineage + field `domain`), fsm (bảng chuyển status + CAS), stage (bảng chuyển stage + CAS, chiều vĩ mô song song fsm; cạnh chuyển-stage tra theo domain của item — `coding`: `discovery → exploring → planning → executing`, trong đó phán-quyết `clear` ở `discovery` bỏ qua `exploring` để sang thẳng `planning` còn `unclear` đi qua `exploring`; tên `decompose` vẫn còn nhưng chỉ là bí danh legacy chỉ-để-rút-cạn (không việc MỚI nào vào được nữa); `synthetic`: một stage, không cạnh nào), domains (sổ đăng ký domain — stage list + step-mapping base-workflow + cạnh-chuyển mỗi domain; `coding` + ba domain minh họa/thử-nghiệm `synthetic` (đúng một stage), `triage`, `fixture-marketing`; base-workflow-model STR18, hoàn tất S1+S2), replay (fold), frontier (truy vấn sẵn-sàng — lọc theo status, stage domain-aware, VÀ lineage qua `parent`), dep-graph (dò chu trình trên `deps` — bất biến phi-chu-trình tại cửa ghi, per work-graph-intelligence S1), store (chủ ghi duy nhất + readRawEvents), envelope (phong bì output CTR001, `wrapEnvelope` — nay bọc MỌI verb ở một cửa in trong `bin/fgos.mjs main()`, STR37; spec: docs/specs/work-state.md §envelope)\n- `src/cli/command-registry.mjs` — sổ verb máy-đọc của CLI (STR37, kernel, thuần dữ liệu): `SCHEMA_VERSION` + `COMMAND_REGISTRY` (mọi verb với `{name, invoke, description, parameters, examples, access read|mutation, deprecated}`); `bin/fgos.mjs` `--help [--json]` và `<verb> [<sub>] --help [--json]` sinh sổ từ đây; verb có sub-verb mang `subcommands`, `HELP_SELECTORS` (`--help`, `-h`) thành route của Rust host qua `scripts/export-command-selectors.mjs`; test chống-lệch `test/cli/fgos-manifest.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` (cờ handler ↔ schema sub-verb), `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/help-routes.test.mjs` (qua host thật); spec: docs/specs/work-state.md §sổ verb\n- `src/intake/classify.mjs` — logic thuần của `fgos submit`: deriveTitle, classify (tier/kind/risk cơ học), generateId (`tsk-<hash>` chống trùng, STR53)\n- `src/intake/discovery.mjs` — context-discovery của stage `discovery` (stage đầu tiên của domain `coding`): `resolveDiscovery` (đọc-phán-ghi, dùng chung bởi verb `discover` và vòng tự hành) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDiscovery` đã rút; phán-quyết `clear` chuyển item sang stage `planning`, `unclear` sang `exploring`\n- `src/intake/plan.mjs` — phán chia-việc của stage `planning`: `resolvePlan` (đọc-phán-ghi, dùng chung bởi verb `plan` và vòng tự hành khi item ở stage `planning`, hoặc ở bí danh legacy `decompose`) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDecompose` đã rút, cùng lý do `judgeDiscovery` rút; sinh con qua lineage `parent`, không qua `deps`\n- `domains/coding/AGENTS.md` `## fgOS Workflow` + `.claude/skills/` (`.agents/skills/` mirror byte-identical) — lớp hướng dẫn P50: entry skill (`fgos-routing`) + skill giai đoạn (`fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-knowledge`) trỏ một phiên tự mở tới đúng skill theo `stage` của item; từ str89-fgos-domain-skills, tra cứu này domain-pluggable — đọc trường `domain` + `stage` của item rồi tra qua `skillForStage`/`getDomain` (`src/state/workflow-stage-graphs.mjs`), không còn giả định ngầm domain `coding`; `fgos-routing` nay có hàng khoá theo **status** `retrospective → fgos-coding-knowledge` (skill tổng hợp cấp nhãn Diataxis + soạn tài liệu người-dùng-cuối) — stage `compound-learn` đã rút, việc tổng hợp nó từng canh nay là việc của status `retrospective`; skill ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã rút (tsk-6ar) — `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`) nay tự chạy clarify+classify trong cùng phiên sống, cùng việc mà skill đó từng làm nhưng trên bản mô tả SẠCH hơn; spec: docs/specs/work-state.md §RUL60 (hành vi), docs/specs/runner.md (lớp hướng dẫn)\n- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md\n- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)\n- `docs/how-to/`, `docs/tutorials/`, `docs/reference/`, `docs/explanation/` — tài liệu NGƯỜI-DÙNG-CUỐI theo bốn quadrant Diataxis (audience-facing, khác `docs/specs/` là BA-reference nội bộ); sinh bởi kỹ năng `fgos-coding-knowledge` ở status `retrospective` (grow-or-create một tài liệu SỐNG mỗi đường dẫn: gom mọi capture qua `fgos doc-sources` rồi tích luỹ không mất, ngăn Diataxis là trục cấu trúc duy nhất — write-side, spec: docs/specs/enduser-docs-authoring.md), quadrant khớp `docType` capture; `docs/explanation/` từ str64-backfill còn có 6 tài liệu chưng cất từ critical-patterns.md (learnings vận hành bee thật sự thuộc tiến trình hình thành fgOS); chỉ mục đọc-theo-tag máy-đọc-được: `docs/enduser-docs-index.json` (sinh bởi verb `fgos docs-index` / kỹ năng `fgos-indexing`, thay cho việc liệt-kê-tay từng tài liệu — supersedes con trỏ văn xuôi cũ, theo compound-learn-enduser-docs; ngăn `explanation` còn quét thêm `docs/decisions/` làm vị trí thay thế, theo str64-backfill); spec read-side: docs/specs/enduser-docs-index.md\n- `src/runner/` + `bin/fgos-runner.mjs` — vòng tự hành (loop/dispatch/worktree/recovery/anti-loop/write-queue/root-affinity); `loop.mjs`'s `runWatch` + `write-queue.mjs`'s `onCommit` — chế độ `--watch` bền, tín hiệu-cơ-học + nghỉ dự phòng, ghép `runOnce` không đổi làm hộp đen (str7-str8-priority-intent, spec: docs/specs/runner.md §RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); loop giao việc theo mẻ song song có giới hạn hai tầng (cấu hình `parallel` trong `.fgos/config.json`'s `runner` section, theo tsk-5vf), giữ quyền-sở-hữu-gốc trong một lượt chạy, quét làm-rõ rồi quét chia-việc trước mọi dispatch thi công; gặt-lại bỏ qua claim của cửa pull (`claimRole` human/session); `dispatch.mjs`'s executor là port có tên CTR009 v2 (`EXECUTOR_ADAPTERS`, per-tier qua config's `executors`, STR41), `ensureRunnerConfigForDir` tự sinh cấu hình mặc định tại `.fgos/config.json` khi vắng mặt (không áp dụng cho `--config` tường minh, str76-runner-bootstrap; tsk-5hv xoá hẳn fallback về file flat legacy cũ); worker của loop và fan-out chạy như một Unit run qua `runUnit` (`work-dispatch.mjs`'s `spawnWorker`), `fgos-runner` không còn `--config` (spec: docs/specs/runner.md §RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) và prompt worker được tách sang `prompt-templates.mjs` + `prompt-templates/*.txt` (chọn template qua bảng cơ học kind/tier/domain, substitution `{placeholder}` thuần, log dispatch kèm tên+hash template, STR49); `goal-check.mjs` — hàm goal-check dùng chung giữa vòng tự hành và verb `return`; `write-queue.mjs` — cửa ghi tuần tự giữ một-người-ghi dưới song song; `root-affinity.mjs` — quyền-sở-hữu-gốc, giữ mọi con của một gốc chung một chủ trong một lượt chạy; `resolveRepoRoot` nay còn xác nhận HEAD repo resolve được trước khi runner claim bất kỳ item nào (fail-fast, str86-runner-headless-git D ecfd0d1a); config: `.fgos/config.json`'s `runner` section (tự sinh khi vắng mặt tại đường mặc định, nguồn config duy nhất kể từ tsk-5hv); spec: docs/specs/runner.md\n- `docs/specs/confinement-authority.md` + `src/runner/dispatch/confinement/` — Agent Confinement Authority: runtime one-door confinement enforcement (`executeThroughConfinement`), machine backend registry `~/.fgos/confinement-backends.json`, local `bwrap` v1 driver with 8 falsification probes, required fail-closed checks, attestation storage (`confinement-attestation.v1`), herdr convergence with shared `evaluateBypassPairing`, setup defaults and doctor checks; spec: docs/specs/confinement-authority.md Pane herdr confine cho agent không phải claude (codex/agy/pi): công thức private-home + account inventory + lịch sử các commit đã đi qua (và vì sao từng bị quên) ở §13.1.\n- `docs/architect/README.md` + `docs/architect/architecture-intent.md` + `docs/architect/domainization/README.md` — portal architect-level, registry intention xuyên-khu-vực, và deep-dive domainization (core đóng vs `domains/<name>/` adapter mở: manifest/workflow YAML, task-spec, skill, knowledge, doctrine, agent, resolver, enforcement); active thread đầu tiên giữ intent mở rộng fgOS từ fan-out/fan-in + artifact mediation thành năng lực group-thinking/problem-solving rộng hơn (Delphi/NGT/RFC/adversarial/master-coordinator), giữ `group-cognition-framework.yaml` isolation-heavy không bị nới ngầm; liên quan Step 09 group-thinking substrate, Step 10 coding-domain adoption, component authority boundary map, và Domain Components And Extension Layer\n- `src/workflow/` (`definition.mjs`, `runner.mjs`, `step-fsm.mjs`, `units-source.mjs`) + `core/workflows/*.yaml` — Workflow engine (Request-to-Run P3a/P4): DAG steps, human gates, dependency scheduling, runner integration; `units-source.mjs` dịch units file của `fgos workflow start --units` thành Workflow tạm (RUL89 (workflow start --units)); spec: `docs/specs/runner.md`\n- `src/runner/execution/` (`unit.mjs`, `bind.mjs`, `run.mjs`, `patterns/`) — Execution Core (Request-to-Run P1/P2/P4): Unit (hợp đồng dữ liệu duy nhất), `bind()` (chọn executor 5 mức), `fgos run` (cửa chạy mới, herdr mặc định), CollaborationPattern (`solo`, `reviewed`, `panel` + presets `consult`, `research-fan-out`, `rfc`, `code-change`); `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi Unit (RUL84 (one write-scope matcher)), dùng cho runner commit, settlement và Workflow; spec: `docs/specs/runner.md`\n- `docs/architect/agent-coordination/` — thiết kế agent-coordination lịch sử (đã thu hồi ở P4 per D-0050, thay bằng Workflow runner và Execution Core); `README.md` là portal ghi nhận chuyển tiếp; `contracts/` lưu giữ hợp đồng lịch sử (`coordination-session.md`, `flow-definition.md`).\n- `docs/architect/host-invocation-routing/` — kiến trúc định tuyến và host runtime Rust (5 tệp: `host-invocation-provider-routing.md` — hợp đồng kernel canonical OperationRequest/ProviderOutcome, pure Router, InvocationService; `legacy-cli-transition.md` — chiến lược exec payload Node với parity harness và descriptor command-routes; `external-provider-protocol.md` — giao thức external provider R2; `node-to-rust-component-migration.md` — lộ trình chuyển dịch component từ Node sang Rust; `rust-cli-and-proof-components-plan.md` — kế hoạch triển khai Rust CLI host và proof components); spec: docs/specs/distribution.md\n- `src/runner/merge.mjs` — cơ chế cổng duyệt PR nội bộ (`classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`), dùng bởi `bin/fgos.mjs` verb `review`/`approve`/`reject`, nay tham số hóa được nhánh đích (cây chính hoặc nhánh của gốc — cây nhánh tích hợp); `catchup` (bin/fgos.mjs) dùng lại cùng cơ chế git cho cả tầng con→gốc lẫn gốc→cây chính; `isMainWorktree` (STR44) — chặn cấu trúc (không dựa sổ đăng ký session) xác nhận `cwd` LÀ worktree chính trước khi `approve` merge/verify, bắt cả worktree tay không đăng ký qua `fgos session start` — cùng `detectTrunk` nay ở `src/runner/worktree.mjs` (theo tsk-49i), không còn ở file này; spec: docs/specs/runner.md\n- `src/verbs/<domain>/<verb>.mjs` — tầng use-case của CLI (theo tsk-49i): logic nghiệp vụ của một verb, chữ ký thống nhất `<verb>UseCase(ctx, options)` — `ctx` là thứ adapter tính từ môi trường (`{dir, cwd?, repoRoot?}`, use-case KHÔNG BAO GIỜ tự đọc `process.cwd()`/`process.env`/argv), `options` là flag đã parse; trả đúng payload `fgos.v1` (bọc envelope + map exit-code vẫn ở `bin/fgos.mjs`), refusal vẫn `throw StoreError`. Cụm đầu tiên: `src/verbs/merge/` (`merge`/`approve`/`review`/`sync-root`/`catchup`/`reject`/`promote-to-component`) — `bin/fgos.mjs` cho 7 verb này nay chỉ parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb, gọi một hàm use-case. Không ngụ ý migrate 7 file use-case-rank sẵn có (`runner/loop.mjs`, `intake/*`, `setup/*`, `state/cursor.mjs`); spec: docs/specs/runner.md\n- `src/report/item-trace.mjs` — trace outcome/friction của MỘT item, đọc thuần trên view (`collectOutcomeEntry`/`collectFrictionData`/`collectReviewTrace`); dùng chung bởi `review` (use-case) và `check`/`show`/`doc-sources`/`evolve` (`bin/fgos.mjs`); spec: docs/specs/runner.md\n- `src/runner/github-adapter.mjs` — vận chuyển GitHub thuần cho cổng duyệt PR nội bộ (`createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR`/`classifyGhFailure`, shell ra `gh` CLI thật, layer infra), dùng bởi `bin/fgos.mjs` verb `review`/`approve --github`; spec: docs/specs/runner.md\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ của trợ lý (`.fgos/logs/<id>.log`, git-ignored): `appendWorkerLog` — khối kết-cục cuối, gọi bởi `loop.mjs` sau mỗi lượt dispatch; `appendWorkerLogChunk` — live tee từng chunk stdout/stderr khi đến (STR39), gọi bởi `dispatch.mjs`'s `spawnWorker` qua `opts.onChunk`; spec: docs/specs/runner.md\n- `src/runner/session.mjs` — vòng đời phiên checkout đa-phiên tùy chọn (fgos-multi-session-checkout, STR35): `createSession`/`endSession`/`listSessions`/`reclaimOrphanedSessions`, worktree detached-HEAD mỗi phiên (`git worktree add --detach`), `.fgos` symlink dùng chung (KHÔNG BAO GIỜ sao chép), sổ `.fgos/sessions.json` canh bởi `.fgos/sessions.lock` riêng; dùng bởi `bin/fgos.mjs` verb `session`; spec: docs/specs/runner.md\n- `packages/observe/rust/src/metrics_cli/entropy.rs` — tín hiệu entropy-trend + đếm compounding (thuần, đọc trên view work-state), surfaced qua `fgos metrics entropy`; spec: docs/specs/runner.md\n- `src/report/enduser-index.mjs` — bộ sinh CHỈ MỤC đọc-theo-tag tài liệu người-dùng-cuối (thuần, không I/O — mirror `entropy.mjs`): `QUADRANTS`, bảng nguồn-sự-thật `QUADRANT_META` (quadrant→{purpose,audience}), `QUADRANT_DIR_ALIASES` (quadrant→vị trí thay thế trên đĩa, theo str64-backfill; hiện `explanation`→`['decisions']`), `findSourceCaptureId` (gom một, cho chỉ mục), `findSourceCaptureIds` (gom mọi capture của một đường dẫn, cho `doc-sources`), `buildEnduserIndex`; I/O + verb `fgos docs-index` (quét cả thư mục chính lẫn `QUADRANT_DIR_ALIASES`, ghi manifest `docs/enduser-docs-index.json`) và verb `fgos doc-sources <docPath>` (gom nguồn của một đường dẫn) sống ở `bin/fgos.mjs`, cả hai quyền `read`; vận hành chỉ mục: kỹ năng `fgos-indexing`; spec: docs/specs/enduser-docs-index.md\n- `src/report/frontmatter.mjs` — bộ đọc/ghi đầu-mô-tả OKF-style của mỗi tài liệu người-dùng-cuối (thuần, không I/O, không phụ thuộc thư viện ngoài — theo str64-backfill): `parseFrontmatter`/`renderFrontmatter` (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn); tách biệt với bộ sinh chỉ mục — đầu-mô-tả là bản sao ghi-lúc-soạn, KHÔNG phải nguồn thẩm quyền của linkage; spec: docs/specs/enduser-docs-index.md\n- `src/evolve/candidates.mjs` — Gate A candidate ranking cho vòng tự cải thiện (self-improve loop, STR13 Slice 1): thuần, đọc trên view work-state, dùng lại `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa lại); surfaced qua `fgos evolve` (liệt kê + `--pick <id>`, hai bước, không stdin); spec: docs/specs/runner.md\n- `src/state/impact.mjs` — backlog-triage impact ranking (STR21, cửa 2 của triage — tách bạch khỏi STR14 intake-triage): thuần, xếp hạng item CHƯA `done` theo `blocks` (số item khác chưa `done` liệt kê nó trong `deps`); surfaced qua `fgos triage`; spec: docs/specs/work-state.md\n- `src/state/awaiting-context.mjs` — neo gốc cho cổng chờ-người (str61-chat-context-continuity): thuần, đọc trên view work-state, tính `{parent, changedSinceAsk?}` cho một item `awaiting-human` có `parent` mỗi lần đọc (không lưu trữ); surfaced qua `fgos list`'s khóa cộng thêm `awaitingContext`; spec: docs/specs/work-state.md §RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2, kernel layer, dùng chung giữa `classify.mjs` và `iron-law.mjs`); spec: docs/specs/runner.md\n- `src/evolve/iron-law.mjs` — Iron Law risk classifier cho vòng tự cải thiện (self-improve loop, STR13 Slice 2): thuần, chưa có call site (Slice 3 wiring); spec: docs/specs/runner.md\n- `docs/platform/session-identity/spec.md` — spec thành phần Session Identity: nguồn duy nhất trả lời \"writer của process này là ai\" (`{id, source}`); source: `packages/session-identity/rust` (verb native `fgos identity`), contracts + vector dùng chung: `packages/session-identity/contracts/`; Node chỉ gọi qua facade `src/util/session-identity.mjs` (tìm binary: `src/util/host-bin-path.mjs`).\n- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`.\n- `test/` — node:test suite (`npm test`, 2970 test): smoke + state + cli + runner + report + e2e (rebuild-determinism, runner-loop — gồm kịch bản cửa pull S2-pull + con fork từ tip nhánh gốc, pr-gate — 4 kịch bản trọn vòng review/approve/reject, dispatch song song thật với cửa sổ chồng-lấn đo được); benchmark ngoài suite (F4) tại `docs/history/phase-3-compound-learning/reports/f4-benchmark.md`\n- `scripts/run-test-canary.mjs` (`npm run test:canary -- <file...>`) + `scripts/test-select.mjs` (`npm run test:related -- --explain`, plus `test:related:shadow` for evidence-gathering; manifest: `test/test-ownership.mjs`) — additive fast test-feedback doors, `npm test` unchanged/authoritative either way; how-to: `docs/how-to/use-fast-test-feedback-commands.md`; plan: `plans/260920-immediate-test-feedback-reduction/plan.md`\n- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored; `.fgos/logs/<id>.log` — bản ghi output cục bộ của trợ lý theo từng việc, gitignored (spec: docs/specs/runner.md)\n- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent (bản sản phẩm — thuần forgent)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_690e83ad4f79a1bbac8eafc9acb1d4ea"
}
```

## Entry claim_40c0caf4bd105994712dd37578f27746

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_40c0caf4bd105994712dd37578f27746",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "0d6987ee946549b02397f935d48bd1fe1a12b6175776f6298246add762ede685",
    "identityFingerprint": "2c9f6cb1932df90b29a69f5b3a1f1326a1c33bcb10b59c0fda6ad514d2c0be77",
    "claimId": "claim_40c0caf4bd105994712dd37578f27746",
    "sourceAnchor": "0064-hook-commit-để-lại-đèn-hoạt-động-riêng-không-ghi-main-checkoutlock-người-tranh-xét-record-theo-ttlms-của-chính-holder-checkpoint-dưới-merge-slot-giữ-main-mutex",
    "unitKind": "heading",
    "sourceUnitDigest": "dbd2125739c4bcd43eae0e2abb00500fb4b4f309a84d2ba6ef751cc5141b674e",
    "claimKind": "specification",
    "status": "current",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "0d6987ee946549b02397f935d48bd1fe1a12b6175776f6298246add762ede685",
    "identityFingerprint": "2c9f6cb1932df90b29a69f5b3a1f1326a1c33bcb10b59c0fda6ad514d2c0be77",
    "claimId": "claim_40c0caf4bd105994712dd37578f27746",
    "sourceAnchor": "0064-hook-commit-để-lại-đèn-hoạt-động-riêng-không-ghi-main-checkoutlock-người-tranh-xét-record-theo-ttlms-của-chính-holder-checkpoint-dưới-merge-slot-giữ-main-mutex",
    "unitKind": "heading",
    "sourceUnitDigest": "dbd2125739c4bcd43eae0e2abb00500fb4b4f309a84d2ba6ef751cc5141b674e",
    "claimKind": "specification",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "0064 — Hook commit để lại đèn hoạt động riêng, không ghi `main-checkout.lock`; người tranh xét record theo `ttlMs` của chính holder; checkpoint dưới merge slot giữ main mutex",
    "anchor": "0064-hook-commit-để-lại-đèn-hoạt-động-riêng-không-ghi-main-checkoutlock-người-tranh-xét-record-theo-ttlms-của-chính-holder-checkpoint-dưới-merge-slot-giữ-main-mutex",
    "githubAnchor": "0064-hook-commit-để-lại-đèn-hoạt-động-riêng-không-ghi-main-checkoutlock-người-tranh-xét-record-theo-ttlms-của-chính-holder-checkpoint-dưới-merge-slot-giữ-main-mutex",
    "stableAnchor": "h-8d37dbc52c85",
    "startLine": 3346,
    "endLine": 3346,
    "textDigest": "dbd2125739c4bcd43eae0e2abb00500fb4b4f309a84d2ba6ef751cc5141b674e",
    "sample": "0064 — Hook commit để lại đèn hoạt động riêng, không ghi `main-checkout.lock`; người tranh xét record theo `ttlMs` của chính holder; checkpoint dưới merge slot giữ main mutex",
    "sectionPayloadDigest": "2b6d9c95cda4a9c5c9e36a2acd67da0f030a9cfd01e83e7932e10cdbcd814ce8",
    "followingBlockDigest": "2b6d9c95cda4a9c5c9e36a2acd67da0f030a9cfd01e83e7932e10cdbcd814ce8",
    "identityFingerprint": "2c9f6cb1932df90b29a69f5b3a1f1326a1c33bcb10b59c0fda6ad514d2c0be77",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ],
    "text": "### 0064 — Hook commit để lại đèn hoạt động riêng, không ghi `main-checkout.lock`; người tranh xét record theo `ttlMs` của chính holder; checkpoint dưới merge slot giữ main mutex",
    "sectionText": "### 0064 — Hook commit để lại đèn hoạt động riêng, không ghi `main-checkout.lock`; người tranh xét record theo `ttlMs` của chính holder; checkpoint dưới merge slot giữ main mutex\n\n- **Trạng thái:** Settled (2026-10-15). W1' của thiết kế nền lock + identity bản 2 (`plans/reports/design-261015-1814-lock-and-identity-foundation-lead-design-v2.md` mục 8.5, 13) cộng các điều kiện phản biện vòng 2 (`plans/reports/red-team-astra-round2-261015-1859-lock-and-identity-foundation-design-v2-review.md` B4 và \"W1 chạy một mình\"). Không gì của W2+ (ledger, grant v2, holder-lock).\n- **Bối cảnh:** Hook ghi `main-checkout.lock` bằng chuỗi session id, không `ttlMs`, không bao giờ release; claim/land/merge/`fgctl init` đọc record đó bằng 180 s và identity `process.pid` của chính mình, nên sau MỌI commit ở main, mọi pick/take/land của mọi phiên (kể cả phiên vừa commit) bị chặn tới ~3 phút. Đèn báo và mutex nằm chung một file và một bảng quyết định.\n- **Quyết định:**\n  1. Hook ghi đèn `.fgos/runtime/main-checkout-activity.json` (`windowMs` do người ghi khai), ghi CUỐI hook sau mọi kiểm tra từ chối; không ghi/acquire `main-checkout.lock`. Chỉ hook đọc đèn. Commit của fgOS (pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp đúng holder sống của khóa) bỏ qua đèn. Hook đọc khóa một lần, không chờ: holder pid số sống khác, giao thức lạ hoặc khóa hỏng → từ chối.\n  2. Năm lời `releaseMainCheckoutLockIfOwn(dir, writerId)` của `bin/fgos.mjs` (cleanup ×2, compound, return ×2) thành `clearBeaconIfOwn`. Không còn lời gọi nào chạm `main-checkout.lock` bằng writer id.\n  3. Mọi writer của `main-checkout.lock`, `merge-slot--*`, `dispatch--*` ghi `ttlMs`; người tranh dùng `ttlMs` của record (chặn ở 4 h), không dùng của mình. Record cũ không `ttlMs`: chuỗi phiên → 20 s, pid → 180 s, composite dispatch → 4 h. Rust `lock.rs` theo cùng luật.\n  4. Checkpoint `.fgos` chạy trọn add → commit → reset-khi-lỗi trong main mutex v1: caller truyền `mainCheckoutWriter` (mutex thuộc tầng runner, kernel không import lên): đã giữ thì `heldMainCheckoutWriter(pid)` (không acquire lồng, không re-entry theo identity), chỉ giữ merge slot thì `acquiringMainCheckoutWriter(dir)` acquire rồi nhả ngay, bị giữ thì bỏ lượt; không có writer thì không commit.\n  5. Trung hoà: record có `v` hoặc marker `.fgos/runtime/locks/<tên>/protocol.json` khác `{writer:1}` → HELD `unsupported-protocol`, không bao giờ bị dọn, làm mới hay release. Marker là một quyết định chung cho acquire (trước khi ghi và sau acquire), inspect (trước nhánh không có file), reclaim/unlock, hook và Rust; record có `v` bị từ chối kể cả khi mang đủ `pid`/`ts`. Writer tự acquire của checkpoint không tự nhận holder cùng pid (`allowSelfRecognition: false`). Chưa có code v2 nên không chuyển hướng; nâng marker chờ sửa B1/B2/B3.\n  6. Vùng claim giữ nguyên độ rộng (A7 chưa sửa).\n- **Không đóng:** A1 (dọn v1 vẫn đọc-lại-rồi-unlink), lấy cắp holder số còn sống khi quá ttl (nay là ttl của holder), commit tay không bị loại trừ (A5), `main-checkout-reset` chưa bọc mutex, promote-engine đọc tip ngoài lock, hook `post-checkout`/worktree add chậm vẫn trong vùng claim (A14). Đèn còn sót của hook bản cũ đọc theo 20 s, nhưng release cũ đang chạy vẫn có thể ghi record chuỗi mới cho tới khi được thay.\n- **Bằng chứng:** `test/e2e/main-checkout-activity-beacon.test.mjs` (9 ca, đỏ trên HEAD trước thay đổi, xanh sau), `test/runner/main-checkout-lock.test.mjs`, `test/runner/main-checkout-activity.test.mjs`, ba file e2e hook hiện có, `cargo test -p fgos-distribution lock::`. Báo cáo: `plans/reports/implementation-261015-2150-w1-main-checkout-lock-unblock.md`.\n- **Ranh giới:** No component-boundary change (đèn là một file mới trong `.fgos/runtime/` của runner; mutex giữ chủ cũ).\nĐổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 3,
    "title": "0064 — Hook commit để lại đèn hoạt động riêng, không ghi `main-checkout.lock`; người tranh xét record theo `ttlMs` của chính holder; checkpoint dưới merge slot giữ main mutex",
    "anchor": "0064-hook-commit-để-lại-đèn-hoạt-động-riêng-không-ghi-main-checkoutlock-người-tranh-xét-record-theo-ttlms-của-chính-holder-checkpoint-dưới-merge-slot-giữ-main-mutex",
    "githubAnchor": "0064-hook-commit-để-lại-đèn-hoạt-động-riêng-không-ghi-main-checkoutlock-người-tranh-xét-record-theo-ttlms-của-chính-holder-checkpoint-dưới-merge-slot-giữ-main-mutex",
    "stableAnchor": "h-8d37dbc52c85",
    "startLine": 3346,
    "endLine": 3346,
    "textDigest": "dbd2125739c4bcd43eae0e2abb00500fb4b4f309a84d2ba6ef751cc5141b674e",
    "sample": "0064 — Hook commit để lại đèn hoạt động riêng, không ghi `main-checkout.lock`; người tranh xét record theo `ttlMs` của chính holder; checkpoint dưới merge slot giữ main mutex",
    "sectionPayloadDigest": "2b6d9c95cda4a9c5c9e36a2acd67da0f030a9cfd01e83e7932e10cdbcd814ce8",
    "followingBlockDigest": "2b6d9c95cda4a9c5c9e36a2acd67da0f030a9cfd01e83e7932e10cdbcd814ce8",
    "identityFingerprint": "2c9f6cb1932df90b29a69f5b3a1f1326a1c33bcb10b59c0fda6ad514d2c0be77",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ],
    "text": "### 0064 — Hook commit để lại đèn hoạt động riêng, không ghi `main-checkout.lock`; người tranh xét record theo `ttlMs` của chính holder; checkpoint dưới merge slot giữ main mutex",
    "sectionText": "### 0064 — Hook commit để lại đèn hoạt động riêng, không ghi `main-checkout.lock`; người tranh xét record theo `ttlMs` của chính holder; checkpoint dưới merge slot giữ main mutex\n\n- **Trạng thái:** Settled (2026-10-15). W1' của thiết kế nền lock + identity bản 2 (`plans/reports/design-261015-1814-lock-and-identity-foundation-lead-design-v2.md` mục 8.5, 13) cộng các điều kiện phản biện vòng 2 (`plans/reports/red-team-astra-round2-261015-1859-lock-and-identity-foundation-design-v2-review.md` B4 và \"W1 chạy một mình\"). Không gì của W2+ (ledger, grant v2, holder-lock).\n- **Bối cảnh:** Hook ghi `main-checkout.lock` bằng chuỗi session id, không `ttlMs`, không bao giờ release; claim/land/merge/`fgctl init` đọc record đó bằng 180 s và identity `process.pid` của chính mình, nên sau MỌI commit ở main, mọi pick/take/land của mọi phiên (kể cả phiên vừa commit) bị chặn tới ~3 phút. Đèn báo và mutex nằm chung một file và một bảng quyết định.\n- **Quyết định:**\n  1. Hook ghi đèn `.fgos/runtime/main-checkout-activity.json` (`windowMs` do người ghi khai), ghi CUỐI hook sau mọi kiểm tra từ chối; không ghi/acquire `main-checkout.lock`. Chỉ hook đọc đèn. Commit của fgOS (pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp đúng holder sống của khóa) bỏ qua đèn. Hook đọc khóa một lần, không chờ: holder pid số sống khác, giao thức lạ hoặc khóa hỏng → từ chối.\n  2. Năm lời `releaseMainCheckoutLockIfOwn(dir, writerId)` của `bin/fgos.mjs` (cleanup ×2, compound, return ×2) thành `clearBeaconIfOwn`. Không còn lời gọi nào chạm `main-checkout.lock` bằng writer id.\n  3. Mọi writer của `main-checkout.lock`, `merge-slot--*`, `dispatch--*` ghi `ttlMs`; người tranh dùng `ttlMs` của record (chặn ở 4 h), không dùng của mình. Record cũ không `ttlMs`: chuỗi phiên → 20 s, pid → 180 s, composite dispatch → 4 h. Rust `lock.rs` theo cùng luật.\n  4. Checkpoint `.fgos` chạy trọn add → commit → reset-khi-lỗi trong main mutex v1: caller truyền `mainCheckoutWriter` (mutex thuộc tầng runner, kernel không import lên): đã giữ thì `heldMainCheckoutWriter(pid)` (không acquire lồng, không re-entry theo identity), chỉ giữ merge slot thì `acquiringMainCheckoutWriter(dir)` acquire rồi nhả ngay, bị giữ thì bỏ lượt; không có writer thì không commit.\n  5. Trung hoà: record có `v` hoặc marker `.fgos/runtime/locks/<tên>/protocol.json` khác `{writer:1}` → HELD `unsupported-protocol`, không bao giờ bị dọn, làm mới hay release. Marker là một quyết định chung cho acquire (trước khi ghi và sau acquire), inspect (trước nhánh không có file), reclaim/unlock, hook và Rust; record có `v` bị từ chối kể cả khi mang đủ `pid`/`ts`. Writer tự acquire của checkpoint không tự nhận holder cùng pid (`allowSelfRecognition: false`). Chưa có code v2 nên không chuyển hướng; nâng marker chờ sửa B1/B2/B3.\n  6. Vùng claim giữ nguyên độ rộng (A7 chưa sửa).\n- **Không đóng:** A1 (dọn v1 vẫn đọc-lại-rồi-unlink), lấy cắp holder số còn sống khi quá ttl (nay là ttl của holder), commit tay không bị loại trừ (A5), `main-checkout-reset` chưa bọc mutex, promote-engine đọc tip ngoài lock, hook `post-checkout`/worktree add chậm vẫn trong vùng claim (A14). Đèn còn sót của hook bản cũ đọc theo 20 s, nhưng release cũ đang chạy vẫn có thể ghi record chuỗi mới cho tới khi được thay.\n- **Bằng chứng:** `test/e2e/main-checkout-activity-beacon.test.mjs` (9 ca, đỏ trên HEAD trước thay đổi, xanh sau), `test/runner/main-checkout-lock.test.mjs`, `test/runner/main-checkout-activity.test.mjs`, ba file e2e hook hiện có, `cargo test -p fgos-distribution lock::`. Báo cáo: `plans/reports/implementation-261015-2150-w1-main-checkout-lock-unblock.md`.\n- **Ranh giới:** No component-boundary change (đèn là một file mới trong `.fgos/runtime/` của runner; mutex giữ chủ cũ).\nĐổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_40c0caf4bd105994712dd37578f27746"
}
```

## Entry claim_66c5a56d447d241a438d212c7b6222d2

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_66c5a56d447d241a438d212c7b6222d2",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "996d9b385e408d994f5e76e3e005be62fdbef5ca102c1dcf21d04e9c232bbeea",
    "identityFingerprint": "c0648e34f77b78bca3215347282514de20fda3256d7a767a36eba6b0617ccf92",
    "claimId": "claim_66c5a56d447d241a438d212c7b6222d2",
    "sourceAnchor": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
    "unitKind": "heading",
    "sourceUnitDigest": "1c46bbd825e116160efeadcef33dab9d2fa69c0ba9985af5de2d4e717cf7b577",
    "claimKind": "specification",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "1aea95ef141538dc89de76ed933e29f95997326d1816535d1f38cccc09df5c46",
      "toUnitDigest": "996d9b385e408d994f5e76e3e005be62fdbef5ca102c1dcf21d04e9c232bbeea",
      "fromSourceUnitDigest": "df9402da4e0b1087fb0b38c82b93963f70524eff5988cad5d9e4715eade7953a",
      "toSourceUnitDigest": "1c46bbd825e116160efeadcef33dab9d2fa69c0ba9985af5de2d4e717cf7b577"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "996d9b385e408d994f5e76e3e005be62fdbef5ca102c1dcf21d04e9c232bbeea",
    "identityFingerprint": "c0648e34f77b78bca3215347282514de20fda3256d7a767a36eba6b0617ccf92",
    "claimId": "claim_66c5a56d447d241a438d212c7b6222d2",
    "sourceAnchor": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
    "unitKind": "heading",
    "sourceUnitDigest": "1c46bbd825e116160efeadcef33dab9d2fa69c0ba9985af5de2d4e717cf7b577",
    "claimKind": "specification",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)",
    "anchor": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
    "githubAnchor": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
    "stableAnchor": "h-fca948c65337",
    "startLine": 878,
    "endLine": 878,
    "textDigest": "1c46bbd825e116160efeadcef33dab9d2fa69c0ba9985af5de2d4e717cf7b577",
    "sample": "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)",
    "sectionPayloadDigest": "ef813c3c772425274d8a306cacca5f0daf32cf4ce90c7f7602b45e41ce47cc3f",
    "followingBlockDigest": "0a2e8a0bd017b6f8d8eaedfa35a8b20aeb8fdd77ac0fad161d80749f151b42df",
    "identityFingerprint": "c0648e34f77b78bca3215347282514de20fda3256d7a767a36eba6b0617ccf92",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Behaviors & Operations"
    ],
    "text": "### Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)",
    "sectionText": "### Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)\n\nKhác với \"Bảo vệ approve khỏi lồng phiên\" trên (chỉ canh MỘT verb, `approve`, và chỉ\ncanh phiên đã đăng ký qua sổ `session start`), cơ chế này canh MỌI `git commit` trần\nvào cây chính (dù qua verb fgOS nào, qua một trợ lý, hay tay gõ thẳng) và không phụ\nthuộc sổ đăng ký — vá đúng lỗ hổng \"một `git worktree add` thủ công chưa từng đăng ký\"\nmà rủi ro-còn-lại ở trên nêu tên.\n\n- **Runs when:** mọi lần `git commit` chạm cây chính — dù người gõ tay, một trợ lý,\n  hay CI — đi qua một hook cài sẵn ở tầng git (không phải một verb fgOS, không phải\n  một cấu hình riêng của công cụ trợ lý nào).\n- **Blocked when:** đèn hoạt động (beacon, `.fgos/runtime/main-checkout-activity.json`)\n  ghi rằng một danh tính KHÁC đã commit ở cây chính này trong cửa sổ `windowMs` chính\n  người ghi khai (mặc định 20 s, đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`) — commit\n  bị từ chối thẳng; hoặc một writer fgOS (claim, checkpoint, land) đang giữ\n  `.fgos/main-checkout.lock` bằng pid số còn sống — hook chỉ đọc khóa này MỘT lần, không\n  bao giờ chờ, rồi từ chối; hoặc khóa không đọc được / thuộc giao thức khóa mới hơn bản\n  đang chạy — commit CŨNG bị từ chối (thà chặn nhầm còn hơn để lọt một race thật). Đèn\n  hỏng thì ngược lại: chỉ là gợi ý, nên cảnh báo rồi cho qua. Commit của chính fgOS\n  (biến `FGOS_MAIN_LOCK_HOLDER_PID` khớp đúng pid đang giữ khóa) bỏ qua đèn, không ghi đèn.\n- **What changes:** khi cây chính đang rảnh, hoặc khi CHÍNH danh tính đang commit là\n  danh tính đã ghi khóa gần nhất (cùng phiên tiếp tục làm việc), commit đi qua bình\n  thường, không thông báo gì. Danh tính ưu tiên biến môi trường phiên trợ lý khi có;\n  vắng mặt (terminal tay gõ) thì suy ra từ một tiến trình tổ tiên gần đó — suy đoán\n  tốt-nhất, không tuyệt đối (hai terminal tay gõ chia sẻ cùng tiến trình cha gần có\n  thể không phân biệt được nhau — xem Open Gaps).\n- **Side effects:** ghi đèn hoạt động (`{v:1, kind:'beacon', writer, writtenAt,\n  windowMs, auditPid}`, thay nguyên tử) CUỐI hook, sau mọi kiểm tra từ chối, nên commit\n  bị từ chối không để lại đèn. Hook KHÔNG ghi `.fgos/main-checkout.lock`: đó là mutex của\n  writer fgOS, claim/land/approve/`fgctl init` không bao giờ đọc đèn, nên một commit ở\n  main không còn chặn ai tới 3 phút. Không đụng sổ đăng ký phiên, không đụng\n  `sessions.lock`/`runner.lock`/`events.lock`. `fgos return`/`cleanup`/`compound` xoá\n  đèn của chính phiên (chỉ khi đúng writer); `fgos lock-status` hiện đèn ở trường\n  `activity`.\n- **Afterwards:** một commit bị từ chối in thông điệp giải thích bằng thời gian (\"một\n  phiên khác dường như đang hoạt động ở đây gần đây\") và trỏ người tới đúng cách mở\n  một cây làm việc cô lập — không bao giờ in ra một định danh thô (pid/session-id) như\n  thể đó là thứ người đọc cần tự hành động theo."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 3,
    "title": "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)",
    "anchor": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
    "githubAnchor": "khóa-hoạt-động-cây-chính-chặn-commit-trần-khi-phiên-khác-đang-hoạt-động-str65",
    "stableAnchor": "h-fca948c65337",
    "startLine": 878,
    "endLine": 878,
    "textDigest": "1c46bbd825e116160efeadcef33dab9d2fa69c0ba9985af5de2d4e717cf7b577",
    "sample": "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)",
    "sectionPayloadDigest": "ef813c3c772425274d8a306cacca5f0daf32cf4ce90c7f7602b45e41ce47cc3f",
    "followingBlockDigest": "0a2e8a0bd017b6f8d8eaedfa35a8b20aeb8fdd77ac0fad161d80749f151b42df",
    "identityFingerprint": "c0648e34f77b78bca3215347282514de20fda3256d7a767a36eba6b0617ccf92",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Behaviors & Operations"
    ],
    "text": "### Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)",
    "sectionText": "### Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)\n\nKhác với \"Bảo vệ approve khỏi lồng phiên\" trên (chỉ canh MỘT verb, `approve`, và chỉ\ncanh phiên đã đăng ký qua sổ `session start`), cơ chế này canh MỌI `git commit` trần\nvào cây chính (dù qua verb fgOS nào, qua một trợ lý, hay tay gõ thẳng) và không phụ\nthuộc sổ đăng ký — vá đúng lỗ hổng \"một `git worktree add` thủ công chưa từng đăng ký\"\nmà rủi ro-còn-lại ở trên nêu tên.\n\n- **Runs when:** mọi lần `git commit` chạm cây chính — dù người gõ tay, một trợ lý,\n  hay CI — đi qua một hook cài sẵn ở tầng git (không phải một verb fgOS, không phải\n  một cấu hình riêng của công cụ trợ lý nào).\n- **Blocked when:** đèn hoạt động (beacon, `.fgos/runtime/main-checkout-activity.json`)\n  ghi rằng một danh tính KHÁC đã commit ở cây chính này trong cửa sổ `windowMs` chính\n  người ghi khai (mặc định 20 s, đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`) — commit\n  bị từ chối thẳng; hoặc một writer fgOS (claim, checkpoint, land) đang giữ\n  `.fgos/main-checkout.lock` bằng pid số còn sống — hook chỉ đọc khóa này MỘT lần, không\n  bao giờ chờ, rồi từ chối; hoặc khóa không đọc được / thuộc giao thức khóa mới hơn bản\n  đang chạy — commit CŨNG bị từ chối (thà chặn nhầm còn hơn để lọt một race thật). Đèn\n  hỏng thì ngược lại: chỉ là gợi ý, nên cảnh báo rồi cho qua. Commit của chính fgOS\n  (biến `FGOS_MAIN_LOCK_HOLDER_PID` khớp đúng pid đang giữ khóa) bỏ qua đèn, không ghi đèn.\n- **What changes:** khi cây chính đang rảnh, hoặc khi CHÍNH danh tính đang commit là\n  danh tính đã ghi khóa gần nhất (cùng phiên tiếp tục làm việc), commit đi qua bình\n  thường, không thông báo gì. Danh tính ưu tiên biến môi trường phiên trợ lý khi có;\n  vắng mặt (terminal tay gõ) thì suy ra từ một tiến trình tổ tiên gần đó — suy đoán\n  tốt-nhất, không tuyệt đối (hai terminal tay gõ chia sẻ cùng tiến trình cha gần có\n  thể không phân biệt được nhau — xem Open Gaps).\n- **Side effects:** ghi đèn hoạt động (`{v:1, kind:'beacon', writer, writtenAt,\n  windowMs, auditPid}`, thay nguyên tử) CUỐI hook, sau mọi kiểm tra từ chối, nên commit\n  bị từ chối không để lại đèn. Hook KHÔNG ghi `.fgos/main-checkout.lock`: đó là mutex của\n  writer fgOS, claim/land/approve/`fgctl init` không bao giờ đọc đèn, nên một commit ở\n  main không còn chặn ai tới 3 phút. Không đụng sổ đăng ký phiên, không đụng\n  `sessions.lock`/`runner.lock`/`events.lock`. `fgos return`/`cleanup`/`compound` xoá\n  đèn của chính phiên (chỉ khi đúng writer); `fgos lock-status` hiện đèn ở trường\n  `activity`.\n- **Afterwards:** một commit bị từ chối in thông điệp giải thích bằng thời gian (\"một\n  phiên khác dường như đang hoạt động ở đây gần đây\") và trỏ người tới đúng cách mở\n  một cây làm việc cô lập — không bao giờ in ra một định danh thô (pid/session-id) như\n  thể đó là thứ người đọc cần tự hành động theo."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_66c5a56d447d241a438d212c7b6222d2"
}
```

## Entry claim_4efee765e5a47fc42f4d9cccc7a53191

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_4efee765e5a47fc42f4d9cccc7a53191",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "afc8106cb0fcce6430956a8c671b812ac71abb84765c6f9fafba878c9518ec07",
    "identityFingerprint": "64a4992d916a5d0f73ebe34444de2a3d0687e469b299b00157f699e8fe5ba076",
    "claimId": "claim_4efee765e5a47fc42f4d9cccc7a53191",
    "sourceAnchor": "pointers-implementation",
    "unitKind": "heading",
    "sourceUnitDigest": "4bed9c69a1de3312aca4a42931d4d848718ce35f6e8ee2c964b4395748e3cf10",
    "claimKind": "specification",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "cf33b023153e84cd6efc759802ab2dbe04d85bfefce14bfb1d057c7b3e501db0",
      "toUnitDigest": "afc8106cb0fcce6430956a8c671b812ac71abb84765c6f9fafba878c9518ec07",
      "fromSourceUnitDigest": "a28a44307d00f10d0da810cccc5a0d5651ce6695e180cdf502baadcf43c6e641",
      "toSourceUnitDigest": "4bed9c69a1de3312aca4a42931d4d848718ce35f6e8ee2c964b4395748e3cf10"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "afc8106cb0fcce6430956a8c671b812ac71abb84765c6f9fafba878c9518ec07",
    "identityFingerprint": "64a4992d916a5d0f73ebe34444de2a3d0687e469b299b00157f699e8fe5ba076",
    "claimId": "claim_4efee765e5a47fc42f4d9cccc7a53191",
    "sourceAnchor": "pointers-implementation",
    "unitKind": "heading",
    "sourceUnitDigest": "4bed9c69a1de3312aca4a42931d4d848718ce35f6e8ee2c964b4395748e3cf10",
    "claimKind": "specification",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Pointers (implementation)",
    "anchor": "pointers-implementation",
    "githubAnchor": "pointers-implementation",
    "stableAnchor": "h-ac9c3595f979",
    "startLine": 1220,
    "endLine": 1220,
    "textDigest": "4bed9c69a1de3312aca4a42931d4d848718ce35f6e8ee2c964b4395748e3cf10",
    "sample": "Pointers (implementation)",
    "sectionPayloadDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "followingBlockDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "identityFingerprint": "64a4992d916a5d0f73ebe34444de2a3d0687e469b299b00157f699e8fe5ba076",
    "ancestry": [
      "Spec: Runner (vòng tự hành)"
    ],
    "text": "## Pointers (implementation)",
    "sectionText": "## Pointers (implementation)\n\n- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng\n- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem \"Gặt-lại lúc khởi động\") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`resolveTierModel` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade \"(không có)\" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item\n- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem \"Báo việc-phát-hiện từ trợ lý\" trên, RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, có trần + chống trùng)): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, và stage vào-vòng của domain — `discovery` cho `coding`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc \"chỉ báo, không tự ghi\" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`\n- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song\n- `src/runner/frozen-judge.mjs` (STR63, domain layer thuần — không fs/git) — `FROZEN_JUDGE_PATTERNS` (bê nguyên từ frozen-judge của bee, bỏ mục `.bee/config.json` không áp dụng) + `frozenJudgeHits(changedFiles, footprint)`: chấm file đã đổi khớp nhóm nhạy cảm (test/CI/lockfile/manifest) NGOÀI `footprint` đã khai — khớp exact-path, không prefix/glob. `bin/fgos.mjs`'s `changedFilesSince(cwd, from, to)` (`git diff --name-only`, cạnh `commitsSince`) cấp input; gọi trong `return` khi `check.passed`, xem RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn)\n- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ `moveStage` tới `planning` (bỏ qua `exploring`), verdict chưa đủ rõ `moveStage` tới `exploring` RỒI đậu `awaiting-human` mang câu hỏi (hai cửa ghi rời nhau — `stage` và `status` không giẫm nhau); một đề xuất `verify` còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi, bất đồng thì cũng đậu chờ người. `judgeDiscovery` (lời gọi phán lồng cũ) đã NGHỈ HƯU: engine luôn cần một verdict do người gọi đưa vào — worker của quét nghiên-cứu, hay phiên sống gọi `fgos discover --verdict` — thiếu verdict thì role `runner` no-op an toàn, role khác báo lỗi rõ ràng\n- `src/intake/plan.mjs` (đổi tên từ `decompose.mjs`) — xem Pointers spec Work-State (module dùng chung giữa runner và verb `plan` khi item ở stage `planning`, hoặc còn ở tên di sản `decompose`); verb `plan` (phiên sống) truyền `'session'`; `resolvePlan` cũng là chỗ nhả claim `doing→todo` khi gốc sang `executing` (claim-lock §3b)\n- `src/runner/prompt-templates/worker-prompt-discovery.txt` — mẫu prompt riêng của lượt dispatch nghiên-cứu, chọn bởi luật `{domain:'coding', stage:'discovery'}` trong `selectTemplate` (`src/runner/prompt-templates.mjs`); mọi lời gọi không truyền `stage` giữ nguyên hành vi cũ, không bị luật này chen trước. (Helper thử-lại `src/intake/judge-executor.mjs` của bản trước đã bị xoá cùng lúc `judgeDiscovery`/`judgeDecompose` nghỉ hưu — không còn lời gọi model phán lồng nào để thử lại.)\n- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`.fgos/logs/entropy-history.jsonl`, gitignored, kể từ phase-01 plans/260825-0842-fgos-logs-dir-bucketing) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này\n- `.fgos/config.json`'s `runner` section (tsk-5vf; tsk-5hv xoá hẳn fallback về file flat legacy cũ — đây giờ là nguồn config DUY NHẤT, `fgos setup` là verb thực hiện move thật) — config committed (executor template + `modelPolicies.claude` nano/haiku, standard/sonnet, frontier/opus [tsk-5tm, thay `models` phẳng cũ; 6-tier vocab từ 2026-09-17] + timeoutMs); `executor.args` mang `--permission-mode acceptEdits`, không còn quyền git — runner commit thay worker (0052) (quyền TỐI THIỂU, xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfigForDir(dir)` — shared-file-aware: tại đường MẶC ĐỊNH (không `--config`) vắng file, gọi `detectAssistantCli` (quét PATH thuần, không spawn — `KNOWN_ASSISTANT_CLI_NAMES`) rồi viết `DEFAULT_RUNNER_CONFIG` với executor từ `SUPPORTED_EXECUTOR_TEMPLATES[detected]` khi trợ lý dò được có mẫu đã kiểm chứng (hôm nay chỉ `claude`, y hệt `DEFAULT_RUNNER_CONFIG.executor`), hoặc executor placeholder tự-báo-lỗi khi không (RUL48b) — rồi mới nạp, kèm một dòng thông báo tên file + executor được chọn (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfigForDir` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh của `discover` (`fgos-runner` chỉ còn đường mặc định, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)); đọc qua `mergeWithGlobalConfig` trước khi tách phần `runner` (project luôn thắng `~/.fgos/config.json` theo key, tsk-5vf)\n- `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi (RUL84 (one write-scope matcher)): chuẩn hoá `writes`, nở `runner.generatedPaths`, `matchesWriteScope`/`partitionPaths` cho runner commit, settlement và Workflow.\n- `src/workflow/units-source.mjs` — `translateUnitsToWorkflow`: dịch units file của `fgos workflow start --units` thành Workflow tạm, mỗi Unit một step (RUL89 (workflow start --units)).\n- `src/runner/execution/account-pin.mjs` — ghim account (RUL91 (a person may pin the provider account of a unit run)): `resolveAccountPin` (bind() gọi), `runnerConfigForBinding` (inventory thu hẹp cho dispatch), `assertPinnedAccountsUsable` (quarantine trước unit run/resume), `capacityProviderOf`.\n- `src/runner/execution/partial-writes.mjs` — `worktreeSnapshot`/`writesSince`: baseline của seat ghi và phép so sau provider-limit (RUL92 (a writing seat is not run again over its own partial writes)).\n- `src/runner/execution/unit-sync.mjs` — sync base của Unit (RUL97 (a Unit may sync a base ref first)): `seedSync` (resolve ref trước khi unit run tồn tại), `runPendingSync`, `assertSyncResumable`, `syncBrief`, `commitRoundWithSync`; git tin cậy nằm ở `commit-unit-work.mjs` (`startSyncMerge`/`finishSyncMerge`/`syncMergeState`).\n- `src/runner/work-dispatch.mjs` — cửa của tầng Work vào runUnit (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)): `workUnitFor`/`workUnitIdFor` (Unit từ Work item), `spawnWorker` (chạy Unit, ánh xạ outcome sang recovery matrix, cờ `resumable`); `src/runner/fanout-batch.mjs` — fan-out batch trên runUnit.\n- `src/runner/operation-choice.mjs` — driver của Work (RUL94 (a Work driver step runs as a Unit)): `chooseStageOperation`, `executeDriverOperationChoice` chạy operation qua `runUnit`, walker `findLatestAssignmentRunResult` đọc verdict ở cả hai layout và so plan theo `rel` + digest; `digestPinnedInputs` (`src/runner/dispatch/assignment-runner.mjs`) băm pin lúc launch.\n- `src/runner/dispatch/run-timeout.mjs` — sàn/trần thời gian của một lượt chạy (RUL96 (one run may take its own timeout)): `RUN_TIMEOUT_MIN_MS`, `RUN_TIMEOUT_MAX_MS`, `runTimeoutProblem`; leaf không import, đọc bởi `config.mjs` (`parseRunTimeout`, `assertRunTimeoutMs`), reaper confinement, khoá dispatch và `src/workflow/definition.mjs`.\n- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue({onCommit})`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau; hiện thực in-process của \"cửa ghi\"; `onCommit` (TÙY CHỌN, str7-str8-priority-intent) — callback gọi đúng một lần trên MỖI giao dịch thành công (không bao giờ trên giao dịch reject), tự bọc try/catch riêng nên một callback lỗi không bao giờ làm gãy hàng đợi; `createWriteQueue` không tham số giữ hành vi y hệt trước khi `onCommit` tồn tại\n- `src/runner/loop.mjs`'s `runWatch(options)` (str7-str8-priority-intent) — vòng cầm-giao bền, xem \"Vòng cầm-giao bền (--watch)\" trên; ghép `runOnce` KHÔNG ĐỔI làm hộp đen, gọi lặp lại; MỘT `createWriteQueue({onCommit})` + MỘT `createMissBreaker` được tạo trước vòng lặp và dùng CHUNG xuyên mọi lượt (không tạo lại mỗi lượt — điểm đúng-sai cốt lõi cho cầu dao tích lũy per RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); một cờ đóng (closure boolean) do `onCommit` set, kiểm tra SAU khi mỗi lượt `runOnce` trả về (không phải một listener chờ sự kiện — mọi giao dịch cửa-ghi trong sản phẩm đều nằm TRONG một lượt `runOnce` đã await xong, nên một thiết kế lắng-nghe-sau sẽ không bao giờ bắt được tín hiệu, đã bị loại per quyết định d3445024); lượt không ghi gì chờ qua `node:timers/promises`'s `setTimeout(ms, null, {signal})` — hủy được ngay khi `AbortSignal` bắn, không rò timer/listener vì không có listener nào để rò; một `runOnce` throw bị bọc try/catch, báo qua `options.onCycle`, KHÔNG BAO GIỜ thoát ra ngoài làm gãy vòng lặp\n- `src/state/frontier.mjs` — `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); ở `state/` chứ không ở `runner/root-affinity.mjs` như trước (tsk-49i) vì chính `state/` cũng cần cùng phép đi ngược đó, và việc import ngược sang `runner/` là một trong các cạnh làm hai thư mục phụ thuộc vòng\n- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process): `createOwnershipStore` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này\n- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `role` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle)\n- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State \"Cửa pull giao–nhận việc\" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới), xem spec Work-State \"Cửa pull giao–nhận việc\")\n- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → renew/check lock ownership synchronously → commit-hoặc-abort, spike-proven; mất lock ở bước kiểm tra cuối trả `lock-lost-mid-merge` và KHÔNG abort merge state vì tree đó có thể thuộc chủ lock mới; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`awaiting-approval→done`/`awaiting-approval→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra\n- `src/verbs/merge/*.mjs` (tầng `use-case`, tsk-49i) — logic nghiệp vụ của cả 7 verb cụm merge: `merge.mjs` (`mergeList`/`mergeNext`), `approve.mjs`, `review.mjs`, `sync-root.mjs`, `catchup.mjs`, `reject.mjs`, `promote-to-component.mjs`. `bin/fgos.mjs` cho 7 verb này chỉ còn parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb (`--trust-dir` gate cho approve/sync-root/promote-to-component; `path.dirname(dir)` vô điều kiện cho catchup, tsk-5vl; `process.cwd` thô cho drift của `merge list`/`merge next`), rồi gọi một hàm use-case. `merge next` gọi thẳng `approveUseCase`/`syncRootUseCase` (same-rank, hợp lệ) thay cho đệ quy `runVerb` cũ, và option của hai verb đó được `parseMergeClusterOptions` dựng MỘT lần rồi truyền nguyên khối — thay cho việc forward raw `flags`\n- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem \"Cổng duyệt PR nội bộ\" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `state/frontier.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường; gốc không con giữ nguyên hành vi/lý do cũ, không đổi\n- `src/runner/github-adapter.mjs` (github-adapter, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về \"chưa rõ\" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (verify vẫn ở cây làm việc cục bộ).\n- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem \"Cổng duyệt qua GitHub\" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.\n- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem \"Đồng bộ lại một việc đỗ (catch-up)\" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-blocked-other-item`, `lock-lost-mid-merge`, `main-checkout-dirty-mid-merge`} (`main-checkout-dirty-mid-merge`: cổng duyệt gốc→`main` kiểm cây sạch hai lần — trước khi mở worktree CAS, và lại lần nữa dưới `main-checkout.lock` ngay trước `update-ref`, đóng khe hở giữa hai lần đó; lần hai dính bẩn thì không `update-ref`/không đồng bộ cây, trả `blocked` với lý do này, cùng hình dạng \"chưa chạm gì, thử lại được\" như `lock-lost-mid-merge`) (tsk-18a một lần `git merge --no-commit --no-ff` gãy mà KHÔNG tạo `MERGE_HEAD` — không phải xung đột văn bản thật — nên catchup coi là ứng viên thử lại tốt nhất, vì lần gãy này rất có thể chỉ do điều kiện nhất thời; tsk-4hj `merge-blocked-other-item` — `MERGE_HEAD` đã có sẵn TRƯỚC lần merge này, thuộc về một việc KHÁC đang nhập dở, cũng là ứng viên thử lại tốt vì việc kia rồi sẽ xong hoặc bị hủy) và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge-base --is-ancestor <đích> HEAD` TRƯỚC khi nhập → nhánh đã chứa đích rồi (exit 0) → bỏ hẳn merge lẫn commit (merge sẽ là no-op, `git commit` sau đó chết vì \"nothing to commit\" và việc kẹt `blocked` vĩnh viễn), vẫn chạy `runGoalCheck` thật trên cây hiện có → đỏ → giữ nguyên `blocked`, KHÔNG gọi `git merge --abort` (không có merge nào đang chạy) → xanh → `moveWork(..., to:'awaiting-approval')` với `outcome: 'already-caught-up'`, không tạo commit nào; chưa chứa đích (exit 1) → `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'awaiting-approval', expectedStatus:'blocked')` — cạnh, không `reason`, không qua `doing` (spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)\n- `src/evolve/candidates.mjs` — Gate A candidate ranking (self-improve loop STR13 Slice 1): thuần (`rankCandidates(view)`), không fs/Date.now, tái dùng `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa \"chưa ngã-ngũ\" hay trọng số riêng); một candidate mỗi id còn friction chưa ngã-ngũ, trường hiển thị lấy từ bản ghi MỚI NHẤT theo `ts`, `score` cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, sắp xếp score giảm dần rồi id tăng dần (tie-break). Manifest layer: domain.\n- `bin/fgos.mjs` verb `evolve` — bề mặt CLI của Gate A (xem \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).\n- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem \"Iron Law — phân loại rủi ro của một candidate fix\" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: ba chỗ trong `bin/fgos.mjs`, tất cả nguồn `runner` và tất cả chỉ ở ranh giới trunk (per `0032`) — `approve` (ngay trước bước kiểm cây sạch, STR13 Slice 3), pre-check thuần của `merge next`, và `sync-root`. Ba bản gọi giữ nguyên hình dạng lặp có chủ đích: `approve`/`merge next` phân biệt bằng `resolveRoot`, `sync-root` bằng `!item.parent` (RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent`. Manifest layer (`docs/architecture-manifest.json`): infra.\n- `domains/coding/AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos-routing/SKILL.md`\n- `.claude/skills/fgos-routing/SKILL.md` + `.agents/skills/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp\n- `.claude/skills/fgos-coding-discovering/SKILL.md` + `.agents/` mirror — skill `nghiên-cứu` (stage `discovery`, pha máy-một-mình)\n- `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `exploring`, pha máy+người)\n- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `planning`; cũng là skill mà tên stage di sản `decompose` trỏ tới)\n- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `planning`, gác cạnh `planning→executing`) — KHÔNG có ô riêng nào trong bảng stage→skill: nó chạy như pha thứ hai của chính `fgos-coding-planning`\n- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/` mirror — skill `thi-công` (stage `executing`, domain `coding` — str89-fgos-domain-skills)\n- `src/state/domain-registry.mjs` + Workflow của domain (`steps[].skill`, `skillForStep(domain, step)`) (str89-fgos-domain-skills) — skill ứng với mỗi bước nằm trong Workflow, xem spec Work-State \"Mô hình domain\"\n- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần\n- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)\n- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy\n- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là \"chính phiên này tiếp tục\", không phải một chủ cạnh tranh; danh tính KHÁC: mọi writer ghi `ttlMs` của chính nó vào record và người tranh xét record theo `ttlMs` ĐÓ, không bao giờ theo `ttlMs` của mình — số nguyên: pid sống VÀ còn trong ttl; chuỗi: chỉ xét độ mới (không có gì để kiểm sống); record cũ không có `ttlMs` nhận cửa sổ của writer cũ (chuỗi phiên do hook cũ ghi: `HOOK_TTL_MS` 20 s; pid: `DEFAULT_TTL_MS` 3 phút), mọi ttl bị chặn ở trần một run (4 h); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ); record có trường `v` (giao thức khóa mới hơn) hoặc marker `.fgos/runtime/locks/<tên khóa>/protocol.json` khác `{writer:1}` (một quyết định marker cho mọi cửa: acquire kiểm TRƯỚC khi ghi và kiểm lại sau acquire, `inspectMainCheckoutLock` kiểm trước nhánh \"không có file\", `forceReclaimAmbiguousLock` kiểm trước mọi sửa, hook và Rust `lock.rs` dùng cùng luật) → HELD với `reason: unsupported-protocol`; record có `v` kể cả khi mang đủ `pid`/`ts` không bao giờ bị dọn/làm mới/release (kể cả closure của một hold cũ và `releaseMainCheckoutLock`), `fgos unlock` từ chối và không bao giờ báo `cleared:true`. Writer tự acquire của checkpoint (`acquiringMainCheckoutWriter`) dùng `allowSelfRecognition: false` để không tái nhập hold của một operation khác cùng pid. Checkpoint `.fgos` (`runOpportunisticMainCheckoutChecks`) chạy trọn add → commit → reset-khi-lỗi trong mutex này: mutex thuộc tầng runner nên checkpoint (tầng kernel) nhận `mainCheckoutWriter` từ caller: caller đã giữ (claim, merge không slot) truyền `heldMainCheckoutWriter(pid)`, caller chỉ giữ merge slot truyền `acquiringMainCheckoutWriter(dir)` (acquire rồi nhả ngay, bị giữ thì bỏ lượt); không có writer thì checkpoint không commit. Manifest layer: infra.\n- `src/util/session-identity.mjs` (STR65; ở `src/runner/` cho tới tsk-49i — dời sang `util/` để `state/store.mjs` không phải import ngược sang `runner/`) — `resolveWriterIdentity(fgosDir, {env, pid, execFile})` → `{id, source}`: ưu tiên `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` làm `id` chuỗi; registry `<fgosDir>/sessions.json` chỉ ĐỐI CHIẾU giá trị đó, không bao giờ tự cấp một danh tính — khớp một `row.sessionId` → `source: 'registry'`, không khớp → `source: 'env'` (không có luật khớp theo thư mục hay pid của row, per str46-io-contract). Vắng cả hai biến môi trường (hoặc giá trị sai charset) thì đi ngược tối đa 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi `ps`) lấy một pid số làm `id`, `source: 'pid'` — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → `id` lui về pid của chính người gọi, `source: 'unresolved'` thay vì treo/ném lỗi (`unresolved` là nhãn xuất xứ, không phải danh tính vắng mặt — giá trị `id` không đổi, per str46-io-contract). Manifest layer: kernel.\n- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem \"Khóa hoạt động cây chính\" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); sau các guard `.fgos`/root-file/nhánh `fgw/*`, đọc `.fgos/main-checkout.lock` MỘT lần qua `inspectMainCheckoutLock` (không acquire, không chờ — git đã giữ `index.lock` khi hook chạy): pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp holder sống → commit của fgOS, bỏ qua đèn; holder pid số khác còn sống, giao thức khóa lạ, hoặc khóa hỏng → từ chối. Rồi `resolveWriterIdentity()` và đèn hoạt động `src/runner/main-checkout-activity.mjs` (`.fgos/runtime/main-checkout-activity.json`): writer khác trong `windowMs` → từ chối; còn lại ghi đèn cuối hook với `windowMs` = `HOOK_TTL_MS` 20 s (đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`); từ chối → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0.\n- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.\n- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-discovery — dispatch worker thật rồi phán quyết đủ rõ đẩy item sang `planning`, phán quyết chưa đủ rõ đẩy sang `exploring` + đậu chờ người, worker sập thì item đứng yên tại `discovery`/`todo` — cộng các kịch bản stage-clarify/stage-decompose còn lại, nay khẳng định `--once` KHÔNG tự phán ở hai tên stage đó: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimRole`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→awaiting-approval`) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + `test/runner/frozen-judge.test.mjs` (STR63 — unit `frozenJudgeHits`, mọi rule + exact-path footprint match) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 1380 test toàn suite tính tới STR63 (`cd repo && npm test`, số cũ 637 đã trôi qua nhiều feature trước đó — không phải drift do cell này)"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Pointers (implementation)",
    "anchor": "pointers-implementation",
    "githubAnchor": "pointers-implementation",
    "stableAnchor": "h-ac9c3595f979",
    "startLine": 1220,
    "endLine": 1220,
    "textDigest": "4bed9c69a1de3312aca4a42931d4d848718ce35f6e8ee2c964b4395748e3cf10",
    "sample": "Pointers (implementation)",
    "sectionPayloadDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "followingBlockDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "identityFingerprint": "64a4992d916a5d0f73ebe34444de2a3d0687e469b299b00157f699e8fe5ba076",
    "ancestry": [
      "Spec: Runner (vòng tự hành)"
    ],
    "text": "## Pointers (implementation)",
    "sectionText": "## Pointers (implementation)\n\n- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng\n- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem \"Gặt-lại lúc khởi động\") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`resolveTierModel` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade \"(không có)\" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item\n- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem \"Báo việc-phát-hiện từ trợ lý\" trên, RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, có trần + chống trùng)): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, và stage vào-vòng của domain — `discovery` cho `coding`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc \"chỉ báo, không tự ghi\" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`\n- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song\n- `src/runner/frozen-judge.mjs` (STR63, domain layer thuần — không fs/git) — `FROZEN_JUDGE_PATTERNS` (bê nguyên từ frozen-judge của bee, bỏ mục `.bee/config.json` không áp dụng) + `frozenJudgeHits(changedFiles, footprint)`: chấm file đã đổi khớp nhóm nhạy cảm (test/CI/lockfile/manifest) NGOÀI `footprint` đã khai — khớp exact-path, không prefix/glob. `bin/fgos.mjs`'s `changedFilesSince(cwd, from, to)` (`git diff --name-only`, cạnh `commitsSince`) cấp input; gọi trong `return` khi `check.passed`, xem RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn)\n- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ `moveStage` tới `planning` (bỏ qua `exploring`), verdict chưa đủ rõ `moveStage` tới `exploring` RỒI đậu `awaiting-human` mang câu hỏi (hai cửa ghi rời nhau — `stage` và `status` không giẫm nhau); một đề xuất `verify` còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi, bất đồng thì cũng đậu chờ người. `judgeDiscovery` (lời gọi phán lồng cũ) đã NGHỈ HƯU: engine luôn cần một verdict do người gọi đưa vào — worker của quét nghiên-cứu, hay phiên sống gọi `fgos discover --verdict` — thiếu verdict thì role `runner` no-op an toàn, role khác báo lỗi rõ ràng\n- `src/intake/plan.mjs` (đổi tên từ `decompose.mjs`) — xem Pointers spec Work-State (module dùng chung giữa runner và verb `plan` khi item ở stage `planning`, hoặc còn ở tên di sản `decompose`); verb `plan` (phiên sống) truyền `'session'`; `resolvePlan` cũng là chỗ nhả claim `doing→todo` khi gốc sang `executing` (claim-lock §3b)\n- `src/runner/prompt-templates/worker-prompt-discovery.txt` — mẫu prompt riêng của lượt dispatch nghiên-cứu, chọn bởi luật `{domain:'coding', stage:'discovery'}` trong `selectTemplate` (`src/runner/prompt-templates.mjs`); mọi lời gọi không truyền `stage` giữ nguyên hành vi cũ, không bị luật này chen trước. (Helper thử-lại `src/intake/judge-executor.mjs` của bản trước đã bị xoá cùng lúc `judgeDiscovery`/`judgeDecompose` nghỉ hưu — không còn lời gọi model phán lồng nào để thử lại.)\n- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`.fgos/logs/entropy-history.jsonl`, gitignored, kể từ phase-01 plans/260825-0842-fgos-logs-dir-bucketing) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này\n- `.fgos/config.json`'s `runner` section (tsk-5vf; tsk-5hv xoá hẳn fallback về file flat legacy cũ — đây giờ là nguồn config DUY NHẤT, `fgos setup` là verb thực hiện move thật) — config committed (executor template + `modelPolicies.claude` nano/haiku, standard/sonnet, frontier/opus [tsk-5tm, thay `models` phẳng cũ; 6-tier vocab từ 2026-09-17] + timeoutMs); `executor.args` mang `--permission-mode acceptEdits`, không còn quyền git — runner commit thay worker (0052) (quyền TỐI THIỂU, xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfigForDir(dir)` — shared-file-aware: tại đường MẶC ĐỊNH (không `--config`) vắng file, gọi `detectAssistantCli` (quét PATH thuần, không spawn — `KNOWN_ASSISTANT_CLI_NAMES`) rồi viết `DEFAULT_RUNNER_CONFIG` với executor từ `SUPPORTED_EXECUTOR_TEMPLATES[detected]` khi trợ lý dò được có mẫu đã kiểm chứng (hôm nay chỉ `claude`, y hệt `DEFAULT_RUNNER_CONFIG.executor`), hoặc executor placeholder tự-báo-lỗi khi không (RUL48b) — rồi mới nạp, kèm một dòng thông báo tên file + executor được chọn (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfigForDir` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh của `discover` (`fgos-runner` chỉ còn đường mặc định, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)); đọc qua `mergeWithGlobalConfig` trước khi tách phần `runner` (project luôn thắng `~/.fgos/config.json` theo key, tsk-5vf)\n- `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi (RUL84 (one write-scope matcher)): chuẩn hoá `writes`, nở `runner.generatedPaths`, `matchesWriteScope`/`partitionPaths` cho runner commit, settlement và Workflow.\n- `src/workflow/units-source.mjs` — `translateUnitsToWorkflow`: dịch units file của `fgos workflow start --units` thành Workflow tạm, mỗi Unit một step (RUL89 (workflow start --units)).\n- `src/runner/execution/account-pin.mjs` — ghim account (RUL91 (a person may pin the provider account of a unit run)): `resolveAccountPin` (bind() gọi), `runnerConfigForBinding` (inventory thu hẹp cho dispatch), `assertPinnedAccountsUsable` (quarantine trước unit run/resume), `capacityProviderOf`.\n- `src/runner/execution/partial-writes.mjs` — `worktreeSnapshot`/`writesSince`: baseline của seat ghi và phép so sau provider-limit (RUL92 (a writing seat is not run again over its own partial writes)).\n- `src/runner/execution/unit-sync.mjs` — sync base của Unit (RUL97 (a Unit may sync a base ref first)): `seedSync` (resolve ref trước khi unit run tồn tại), `runPendingSync`, `assertSyncResumable`, `syncBrief`, `commitRoundWithSync`; git tin cậy nằm ở `commit-unit-work.mjs` (`startSyncMerge`/`finishSyncMerge`/`syncMergeState`).\n- `src/runner/work-dispatch.mjs` — cửa của tầng Work vào runUnit (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)): `workUnitFor`/`workUnitIdFor` (Unit từ Work item), `spawnWorker` (chạy Unit, ánh xạ outcome sang recovery matrix, cờ `resumable`); `src/runner/fanout-batch.mjs` — fan-out batch trên runUnit.\n- `src/runner/operation-choice.mjs` — driver của Work (RUL94 (a Work driver step runs as a Unit)): `chooseStageOperation`, `executeDriverOperationChoice` chạy operation qua `runUnit`, walker `findLatestAssignmentRunResult` đọc verdict ở cả hai layout và so plan theo `rel` + digest; `digestPinnedInputs` (`src/runner/dispatch/assignment-runner.mjs`) băm pin lúc launch.\n- `src/runner/dispatch/run-timeout.mjs` — sàn/trần thời gian của một lượt chạy (RUL96 (one run may take its own timeout)): `RUN_TIMEOUT_MIN_MS`, `RUN_TIMEOUT_MAX_MS`, `runTimeoutProblem`; leaf không import, đọc bởi `config.mjs` (`parseRunTimeout`, `assertRunTimeoutMs`), reaper confinement, khoá dispatch và `src/workflow/definition.mjs`.\n- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue({onCommit})`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau; hiện thực in-process của \"cửa ghi\"; `onCommit` (TÙY CHỌN, str7-str8-priority-intent) — callback gọi đúng một lần trên MỖI giao dịch thành công (không bao giờ trên giao dịch reject), tự bọc try/catch riêng nên một callback lỗi không bao giờ làm gãy hàng đợi; `createWriteQueue` không tham số giữ hành vi y hệt trước khi `onCommit` tồn tại\n- `src/runner/loop.mjs`'s `runWatch(options)` (str7-str8-priority-intent) — vòng cầm-giao bền, xem \"Vòng cầm-giao bền (--watch)\" trên; ghép `runOnce` KHÔNG ĐỔI làm hộp đen, gọi lặp lại; MỘT `createWriteQueue({onCommit})` + MỘT `createMissBreaker` được tạo trước vòng lặp và dùng CHUNG xuyên mọi lượt (không tạo lại mỗi lượt — điểm đúng-sai cốt lõi cho cầu dao tích lũy per RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); một cờ đóng (closure boolean) do `onCommit` set, kiểm tra SAU khi mỗi lượt `runOnce` trả về (không phải một listener chờ sự kiện — mọi giao dịch cửa-ghi trong sản phẩm đều nằm TRONG một lượt `runOnce` đã await xong, nên một thiết kế lắng-nghe-sau sẽ không bao giờ bắt được tín hiệu, đã bị loại per quyết định d3445024); lượt không ghi gì chờ qua `node:timers/promises`'s `setTimeout(ms, null, {signal})` — hủy được ngay khi `AbortSignal` bắn, không rò timer/listener vì không có listener nào để rò; một `runOnce` throw bị bọc try/catch, báo qua `options.onCycle`, KHÔNG BAO GIỜ thoát ra ngoài làm gãy vòng lặp\n- `src/state/frontier.mjs` — `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); ở `state/` chứ không ở `runner/root-affinity.mjs` như trước (tsk-49i) vì chính `state/` cũng cần cùng phép đi ngược đó, và việc import ngược sang `runner/` là một trong các cạnh làm hai thư mục phụ thuộc vòng\n- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process): `createOwnershipStore` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này\n- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `role` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle)\n- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State \"Cửa pull giao–nhận việc\" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới), xem spec Work-State \"Cửa pull giao–nhận việc\")\n- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → renew/check lock ownership synchronously → commit-hoặc-abort, spike-proven; mất lock ở bước kiểm tra cuối trả `lock-lost-mid-merge` và KHÔNG abort merge state vì tree đó có thể thuộc chủ lock mới; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`awaiting-approval→done`/`awaiting-approval→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra\n- `src/verbs/merge/*.mjs` (tầng `use-case`, tsk-49i) — logic nghiệp vụ của cả 7 verb cụm merge: `merge.mjs` (`mergeList`/`mergeNext`), `approve.mjs`, `review.mjs`, `sync-root.mjs`, `catchup.mjs`, `reject.mjs`, `promote-to-component.mjs`. `bin/fgos.mjs` cho 7 verb này chỉ còn parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb (`--trust-dir` gate cho approve/sync-root/promote-to-component; `path.dirname(dir)` vô điều kiện cho catchup, tsk-5vl; `process.cwd` thô cho drift của `merge list`/`merge next`), rồi gọi một hàm use-case. `merge next` gọi thẳng `approveUseCase`/`syncRootUseCase` (same-rank, hợp lệ) thay cho đệ quy `runVerb` cũ, và option của hai verb đó được `parseMergeClusterOptions` dựng MỘT lần rồi truyền nguyên khối — thay cho việc forward raw `flags`\n- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem \"Cổng duyệt PR nội bộ\" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `state/frontier.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường; gốc không con giữ nguyên hành vi/lý do cũ, không đổi\n- `src/runner/github-adapter.mjs` (github-adapter, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về \"chưa rõ\" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (verify vẫn ở cây làm việc cục bộ).\n- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem \"Cổng duyệt qua GitHub\" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.\n- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem \"Đồng bộ lại một việc đỗ (catch-up)\" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-blocked-other-item`, `lock-lost-mid-merge`, `main-checkout-dirty-mid-merge`} (`main-checkout-dirty-mid-merge`: cổng duyệt gốc→`main` kiểm cây sạch hai lần — trước khi mở worktree CAS, và lại lần nữa dưới `main-checkout.lock` ngay trước `update-ref`, đóng khe hở giữa hai lần đó; lần hai dính bẩn thì không `update-ref`/không đồng bộ cây, trả `blocked` với lý do này, cùng hình dạng \"chưa chạm gì, thử lại được\" như `lock-lost-mid-merge`) (tsk-18a một lần `git merge --no-commit --no-ff` gãy mà KHÔNG tạo `MERGE_HEAD` — không phải xung đột văn bản thật — nên catchup coi là ứng viên thử lại tốt nhất, vì lần gãy này rất có thể chỉ do điều kiện nhất thời; tsk-4hj `merge-blocked-other-item` — `MERGE_HEAD` đã có sẵn TRƯỚC lần merge này, thuộc về một việc KHÁC đang nhập dở, cũng là ứng viên thử lại tốt vì việc kia rồi sẽ xong hoặc bị hủy) và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge-base --is-ancestor <đích> HEAD` TRƯỚC khi nhập → nhánh đã chứa đích rồi (exit 0) → bỏ hẳn merge lẫn commit (merge sẽ là no-op, `git commit` sau đó chết vì \"nothing to commit\" và việc kẹt `blocked` vĩnh viễn), vẫn chạy `runGoalCheck` thật trên cây hiện có → đỏ → giữ nguyên `blocked`, KHÔNG gọi `git merge --abort` (không có merge nào đang chạy) → xanh → `moveWork(..., to:'awaiting-approval')` với `outcome: 'already-caught-up'`, không tạo commit nào; chưa chứa đích (exit 1) → `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'awaiting-approval', expectedStatus:'blocked')` — cạnh, không `reason`, không qua `doing` (spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)\n- `src/evolve/candidates.mjs` — Gate A candidate ranking (self-improve loop STR13 Slice 1): thuần (`rankCandidates(view)`), không fs/Date.now, tái dùng `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa \"chưa ngã-ngũ\" hay trọng số riêng); một candidate mỗi id còn friction chưa ngã-ngũ, trường hiển thị lấy từ bản ghi MỚI NHẤT theo `ts`, `score` cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, sắp xếp score giảm dần rồi id tăng dần (tie-break). Manifest layer: domain.\n- `bin/fgos.mjs` verb `evolve` — bề mặt CLI của Gate A (xem \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).\n- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem \"Iron Law — phân loại rủi ro của một candidate fix\" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: ba chỗ trong `bin/fgos.mjs`, tất cả nguồn `runner` và tất cả chỉ ở ranh giới trunk (per `0032`) — `approve` (ngay trước bước kiểm cây sạch, STR13 Slice 3), pre-check thuần của `merge next`, và `sync-root`. Ba bản gọi giữ nguyên hình dạng lặp có chủ đích: `approve`/`merge next` phân biệt bằng `resolveRoot`, `sync-root` bằng `!item.parent` (RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent`. Manifest layer (`docs/architecture-manifest.json`): infra.\n- `domains/coding/AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos-routing/SKILL.md`\n- `.claude/skills/fgos-routing/SKILL.md` + `.agents/skills/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp\n- `.claude/skills/fgos-coding-discovering/SKILL.md` + `.agents/` mirror — skill `nghiên-cứu` (stage `discovery`, pha máy-một-mình)\n- `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `exploring`, pha máy+người)\n- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `planning`; cũng là skill mà tên stage di sản `decompose` trỏ tới)\n- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `planning`, gác cạnh `planning→executing`) — KHÔNG có ô riêng nào trong bảng stage→skill: nó chạy như pha thứ hai của chính `fgos-coding-planning`\n- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/` mirror — skill `thi-công` (stage `executing`, domain `coding` — str89-fgos-domain-skills)\n- `src/state/domain-registry.mjs` + Workflow của domain (`steps[].skill`, `skillForStep(domain, step)`) (str89-fgos-domain-skills) — skill ứng với mỗi bước nằm trong Workflow, xem spec Work-State \"Mô hình domain\"\n- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần\n- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)\n- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy\n- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là \"chính phiên này tiếp tục\", không phải một chủ cạnh tranh; danh tính KHÁC: mọi writer ghi `ttlMs` của chính nó vào record và người tranh xét record theo `ttlMs` ĐÓ, không bao giờ theo `ttlMs` của mình — số nguyên: pid sống VÀ còn trong ttl; chuỗi: chỉ xét độ mới (không có gì để kiểm sống); record cũ không có `ttlMs` nhận cửa sổ của writer cũ (chuỗi phiên do hook cũ ghi: `HOOK_TTL_MS` 20 s; pid: `DEFAULT_TTL_MS` 3 phút), mọi ttl bị chặn ở trần một run (4 h); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ); record có trường `v` (giao thức khóa mới hơn) hoặc marker `.fgos/runtime/locks/<tên khóa>/protocol.json` khác `{writer:1}` (một quyết định marker cho mọi cửa: acquire kiểm TRƯỚC khi ghi và kiểm lại sau acquire, `inspectMainCheckoutLock` kiểm trước nhánh \"không có file\", `forceReclaimAmbiguousLock` kiểm trước mọi sửa, hook và Rust `lock.rs` dùng cùng luật) → HELD với `reason: unsupported-protocol`; record có `v` kể cả khi mang đủ `pid`/`ts` không bao giờ bị dọn/làm mới/release (kể cả closure của một hold cũ và `releaseMainCheckoutLock`), `fgos unlock` từ chối và không bao giờ báo `cleared:true`. Writer tự acquire của checkpoint (`acquiringMainCheckoutWriter`) dùng `allowSelfRecognition: false` để không tái nhập hold của một operation khác cùng pid. Checkpoint `.fgos` (`runOpportunisticMainCheckoutChecks`) chạy trọn add → commit → reset-khi-lỗi trong mutex này: mutex thuộc tầng runner nên checkpoint (tầng kernel) nhận `mainCheckoutWriter` từ caller: caller đã giữ (claim, merge không slot) truyền `heldMainCheckoutWriter(pid)`, caller chỉ giữ merge slot truyền `acquiringMainCheckoutWriter(dir)` (acquire rồi nhả ngay, bị giữ thì bỏ lượt); không có writer thì checkpoint không commit. Manifest layer: infra.\n- `src/util/session-identity.mjs` (STR65; ở `src/runner/` cho tới tsk-49i — dời sang `util/` để `state/store.mjs` không phải import ngược sang `runner/`) — `resolveWriterIdentity(fgosDir, {env, pid, execFile})` → `{id, source}`: ưu tiên `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` làm `id` chuỗi; registry `<fgosDir>/sessions.json` chỉ ĐỐI CHIẾU giá trị đó, không bao giờ tự cấp một danh tính — khớp một `row.sessionId` → `source: 'registry'`, không khớp → `source: 'env'` (không có luật khớp theo thư mục hay pid của row, per str46-io-contract). Vắng cả hai biến môi trường (hoặc giá trị sai charset) thì đi ngược tối đa 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi `ps`) lấy một pid số làm `id`, `source: 'pid'` — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → `id` lui về pid của chính người gọi, `source: 'unresolved'` thay vì treo/ném lỗi (`unresolved` là nhãn xuất xứ, không phải danh tính vắng mặt — giá trị `id` không đổi, per str46-io-contract). Manifest layer: kernel.\n- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem \"Khóa hoạt động cây chính\" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); sau các guard `.fgos`/root-file/nhánh `fgw/*`, đọc `.fgos/main-checkout.lock` MỘT lần qua `inspectMainCheckoutLock` (không acquire, không chờ — git đã giữ `index.lock` khi hook chạy): pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp holder sống → commit của fgOS, bỏ qua đèn; holder pid số khác còn sống, giao thức khóa lạ, hoặc khóa hỏng → từ chối. Rồi `resolveWriterIdentity()` và đèn hoạt động `src/runner/main-checkout-activity.mjs` (`.fgos/runtime/main-checkout-activity.json`): writer khác trong `windowMs` → từ chối; còn lại ghi đèn cuối hook với `windowMs` = `HOOK_TTL_MS` 20 s (đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`); từ chối → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0.\n- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.\n- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-discovery — dispatch worker thật rồi phán quyết đủ rõ đẩy item sang `planning`, phán quyết chưa đủ rõ đẩy sang `exploring` + đậu chờ người, worker sập thì item đứng yên tại `discovery`/`todo` — cộng các kịch bản stage-clarify/stage-decompose còn lại, nay khẳng định `--once` KHÔNG tự phán ở hai tên stage đó: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimRole`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→awaiting-approval`) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + `test/runner/frozen-judge.test.mjs` (STR63 — unit `frozenJudgeHits`, mọi rule + exact-path footprint match) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 1380 test toàn suite tính tới STR63 (`cd repo && npm test`, số cũ 637 đã trôi qua nhiều feature trước đó — không phải drift do cell này)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_4efee765e5a47fc42f4d9cccc7a53191"
}
```

## Entry claim_4599d55c9de4262714d378be2b9eaf80

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_4599d55c9de4262714d378be2b9eaf80",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "8a39cdd36cc90738b6c6fc0ceb366669f9e4f310dbc882ec3442d71205ef0851",
    "identityFingerprint": "8a39cdd36cc90738b6c6fc0ceb366669f9e4f310dbc882ec3442d71205ef0851",
    "claimId": "claim_4599d55c9de4262714d378be2b9eaf80",
    "sourceAnchor": "unheaded-block-102",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "claimKind": "specification",
    "status": "current",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "8a39cdd36cc90738b6c6fc0ceb366669f9e4f310dbc882ec3442d71205ef0851",
    "identityFingerprint": "8a39cdd36cc90738b6c6fc0ceb366669f9e4f310dbc882ec3442d71205ef0851",
    "claimId": "claim_4599d55c9de4262714d378be2b9eaf80",
    "sourceAnchor": "unheaded-block-102",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "claimKind": "specification",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-102",
    "githubAnchor": "unheaded-block-102",
    "stableAnchor": "unheaded-block-102",
    "title": "Unheaded block 102",
    "startLine": 1222,
    "endLine": 1272,
    "textDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "sample": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit",
    "identityFingerprint": "8a39cdd36cc90738b6c6fc0ceb366669f9e4f310dbc882ec3442d71205ef0851",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Pointers (implementation)"
    ],
    "text": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng\n- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem \"Gặt-lại lúc khởi động\") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`resolveTierModel` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade \"(không có)\" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item\n- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem \"Báo việc-phát-hiện từ trợ lý\" trên, RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, có trần + chống trùng)): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, và stage vào-vòng của domain — `discovery` cho `coding`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc \"chỉ báo, không tự ghi\" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`\n- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song\n- `src/runner/frozen-judge.mjs` (STR63, domain layer thuần — không fs/git) — `FROZEN_JUDGE_PATTERNS` (bê nguyên từ frozen-judge của bee, bỏ mục `.bee/config.json` không áp dụng) + `frozenJudgeHits(changedFiles, footprint)`: chấm file đã đổi khớp nhóm nhạy cảm (test/CI/lockfile/manifest) NGOÀI `footprint` đã khai — khớp exact-path, không prefix/glob. `bin/fgos.mjs`'s `changedFilesSince(cwd, from, to)` (`git diff --name-only`, cạnh `commitsSince`) cấp input; gọi trong `return` khi `check.passed`, xem RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn)\n- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ `moveStage` tới `planning` (bỏ qua `exploring`), verdict chưa đủ rõ `moveStage` tới `exploring` RỒI đậu `awaiting-human` mang câu hỏi (hai cửa ghi rời nhau — `stage` và `status` không giẫm nhau); một đề xuất `verify` còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi, bất đồng thì cũng đậu chờ người. `judgeDiscovery` (lời gọi phán lồng cũ) đã NGHỈ HƯU: engine luôn cần một verdict do người gọi đưa vào — worker của quét nghiên-cứu, hay phiên sống gọi `fgos discover --verdict` — thiếu verdict thì role `runner` no-op an toàn, role khác báo lỗi rõ ràng\n- `src/intake/plan.mjs` (đổi tên từ `decompose.mjs`) — xem Pointers spec Work-State (module dùng chung giữa runner và verb `plan` khi item ở stage `planning`, hoặc còn ở tên di sản `decompose`); verb `plan` (phiên sống) truyền `'session'`; `resolvePlan` cũng là chỗ nhả claim `doing→todo` khi gốc sang `executing` (claim-lock §3b)\n- `src/runner/prompt-templates/worker-prompt-discovery.txt` — mẫu prompt riêng của lượt dispatch nghiên-cứu, chọn bởi luật `{domain:'coding', stage:'discovery'}` trong `selectTemplate` (`src/runner/prompt-templates.mjs`); mọi lời gọi không truyền `stage` giữ nguyên hành vi cũ, không bị luật này chen trước. (Helper thử-lại `src/intake/judge-executor.mjs` của bản trước đã bị xoá cùng lúc `judgeDiscovery`/`judgeDecompose` nghỉ hưu — không còn lời gọi model phán lồng nào để thử lại.)\n- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`.fgos/logs/entropy-history.jsonl`, gitignored, kể từ phase-01 plans/260825-0842-fgos-logs-dir-bucketing) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này\n- `.fgos/config.json`'s `runner` section (tsk-5vf; tsk-5hv xoá hẳn fallback về file flat legacy cũ — đây giờ là nguồn config DUY NHẤT, `fgos setup` là verb thực hiện move thật) — config committed (executor template + `modelPolicies.claude` nano/haiku, standard/sonnet, frontier/opus [tsk-5tm, thay `models` phẳng cũ; 6-tier vocab từ 2026-09-17] + timeoutMs); `executor.args` mang `--permission-mode acceptEdits`, không còn quyền git — runner commit thay worker (0052) (quyền TỐI THIỂU, xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfigForDir(dir)` — shared-file-aware: tại đường MẶC ĐỊNH (không `--config`) vắng file, gọi `detectAssistantCli` (quét PATH thuần, không spawn — `KNOWN_ASSISTANT_CLI_NAMES`) rồi viết `DEFAULT_RUNNER_CONFIG` với executor từ `SUPPORTED_EXECUTOR_TEMPLATES[detected]` khi trợ lý dò được có mẫu đã kiểm chứng (hôm nay chỉ `claude`, y hệt `DEFAULT_RUNNER_CONFIG.executor`), hoặc executor placeholder tự-báo-lỗi khi không (RUL48b) — rồi mới nạp, kèm một dòng thông báo tên file + executor được chọn (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfigForDir` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh của `discover` (`fgos-runner` chỉ còn đường mặc định, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)); đọc qua `mergeWithGlobalConfig` trước khi tách phần `runner` (project luôn thắng `~/.fgos/config.json` theo key, tsk-5vf)\n- `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi (RUL84 (one write-scope matcher)): chuẩn hoá `writes`, nở `runner.generatedPaths`, `matchesWriteScope`/`partitionPaths` cho runner commit, settlement và Workflow.\n- `src/workflow/units-source.mjs` — `translateUnitsToWorkflow`: dịch units file của `fgos workflow start --units` thành Workflow tạm, mỗi Unit một step (RUL89 (workflow start --units)).\n- `src/runner/execution/account-pin.mjs` — ghim account (RUL91 (a person may pin the provider account of a unit run)): `resolveAccountPin` (bind() gọi), `runnerConfigForBinding` (inventory thu hẹp cho dispatch), `assertPinnedAccountsUsable` (quarantine trước unit run/resume), `capacityProviderOf`.\n- `src/runner/execution/partial-writes.mjs` — `worktreeSnapshot`/`writesSince`: baseline của seat ghi và phép so sau provider-limit (RUL92 (a writing seat is not run again over its own partial writes)).\n- `src/runner/execution/unit-sync.mjs` — sync base của Unit (RUL97 (a Unit may sync a base ref first)): `seedSync` (resolve ref trước khi unit run tồn tại), `runPendingSync`, `assertSyncResumable`, `syncBrief`, `commitRoundWithSync`; git tin cậy nằm ở `commit-unit-work.mjs` (`startSyncMerge`/`finishSyncMerge`/`syncMergeState`).\n- `src/runner/work-dispatch.mjs` — cửa của tầng Work vào runUnit (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)): `workUnitFor`/`workUnitIdFor` (Unit từ Work item), `spawnWorker` (chạy Unit, ánh xạ outcome sang recovery matrix, cờ `resumable`); `src/runner/fanout-batch.mjs` — fan-out batch trên runUnit.\n- `src/runner/operation-choice.mjs` — driver của Work (RUL94 (a Work driver step runs as a Unit)): `chooseStageOperation`, `executeDriverOperationChoice` chạy operation qua `runUnit`, walker `findLatestAssignmentRunResult` đọc verdict ở cả hai layout và so plan theo `rel` + digest; `digestPinnedInputs` (`src/runner/dispatch/assignment-runner.mjs`) băm pin lúc launch.\n- `src/runner/dispatch/run-timeout.mjs` — sàn/trần thời gian của một lượt chạy (RUL96 (one run may take its own timeout)): `RUN_TIMEOUT_MIN_MS`, `RUN_TIMEOUT_MAX_MS`, `runTimeoutProblem`; leaf không import, đọc bởi `config.mjs` (`parseRunTimeout`, `assertRunTimeoutMs`), reaper confinement, khoá dispatch và `src/workflow/definition.mjs`.\n- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue({onCommit})`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau; hiện thực in-process của \"cửa ghi\"; `onCommit` (TÙY CHỌN, str7-str8-priority-intent) — callback gọi đúng một lần trên MỖI giao dịch thành công (không bao giờ trên giao dịch reject), tự bọc try/catch riêng nên một callback lỗi không bao giờ làm gãy hàng đợi; `createWriteQueue` không tham số giữ hành vi y hệt trước khi `onCommit` tồn tại\n- `src/runner/loop.mjs`'s `runWatch(options)` (str7-str8-priority-intent) — vòng cầm-giao bền, xem \"Vòng cầm-giao bền (--watch)\" trên; ghép `runOnce` KHÔNG ĐỔI làm hộp đen, gọi lặp lại; MỘT `createWriteQueue({onCommit})` + MỘT `createMissBreaker` được tạo trước vòng lặp và dùng CHUNG xuyên mọi lượt (không tạo lại mỗi lượt — điểm đúng-sai cốt lõi cho cầu dao tích lũy per RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); một cờ đóng (closure boolean) do `onCommit` set, kiểm tra SAU khi mỗi lượt `runOnce` trả về (không phải một listener chờ sự kiện — mọi giao dịch cửa-ghi trong sản phẩm đều nằm TRONG một lượt `runOnce` đã await xong, nên một thiết kế lắng-nghe-sau sẽ không bao giờ bắt được tín hiệu, đã bị loại per quyết định d3445024); lượt không ghi gì chờ qua `node:timers/promises`'s `setTimeout(ms, null, {signal})` — hủy được ngay khi `AbortSignal` bắn, không rò timer/listener vì không có listener nào để rò; một `runOnce` throw bị bọc try/catch, báo qua `options.onCycle`, KHÔNG BAO GIỜ thoát ra ngoài làm gãy vòng lặp\n- `src/state/frontier.mjs` — `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); ở `state/` chứ không ở `runner/root-affinity.mjs` như trước (tsk-49i) vì chính `state/` cũng cần cùng phép đi ngược đó, và việc import ngược sang `runner/` là một trong các cạnh làm hai thư mục phụ thuộc vòng\n- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process): `createOwnershipStore` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này\n- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `role` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle)\n- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State \"Cửa pull giao–nhận việc\" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới), xem spec Work-State \"Cửa pull giao–nhận việc\")\n- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → renew/check lock ownership synchronously → commit-hoặc-abort, spike-proven; mất lock ở bước kiểm tra cuối trả `lock-lost-mid-merge` và KHÔNG abort merge state vì tree đó có thể thuộc chủ lock mới; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`awaiting-approval→done`/`awaiting-approval→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra\n- `src/verbs/merge/*.mjs` (tầng `use-case`, tsk-49i) — logic nghiệp vụ của cả 7 verb cụm merge: `merge.mjs` (`mergeList`/`mergeNext`), `approve.mjs`, `review.mjs`, `sync-root.mjs`, `catchup.mjs`, `reject.mjs`, `promote-to-component.mjs`. `bin/fgos.mjs` cho 7 verb này chỉ còn parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb (`--trust-dir` gate cho approve/sync-root/promote-to-component; `path.dirname(dir)` vô điều kiện cho catchup, tsk-5vl; `process.cwd` thô cho drift của `merge list`/`merge next`), rồi gọi một hàm use-case. `merge next` gọi thẳng `approveUseCase`/`syncRootUseCase` (same-rank, hợp lệ) thay cho đệ quy `runVerb` cũ, và option của hai verb đó được `parseMergeClusterOptions` dựng MỘT lần rồi truyền nguyên khối — thay cho việc forward raw `flags`\n- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem \"Cổng duyệt PR nội bộ\" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `state/frontier.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường; gốc không con giữ nguyên hành vi/lý do cũ, không đổi\n- `src/runner/github-adapter.mjs` (github-adapter, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về \"chưa rõ\" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (verify vẫn ở cây làm việc cục bộ).\n- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem \"Cổng duyệt qua GitHub\" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.\n- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem \"Đồng bộ lại một việc đỗ (catch-up)\" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-blocked-other-item`, `lock-lost-mid-merge`, `main-checkout-dirty-mid-merge`} (`main-checkout-dirty-mid-merge`: cổng duyệt gốc→`main` kiểm cây sạch hai lần — trước khi mở worktree CAS, và lại lần nữa dưới `main-checkout.lock` ngay trước `update-ref`, đóng khe hở giữa hai lần đó; lần hai dính bẩn thì không `update-ref`/không đồng bộ cây, trả `blocked` với lý do này, cùng hình dạng \"chưa chạm gì, thử lại được\" như `lock-lost-mid-merge`) (tsk-18a một lần `git merge --no-commit --no-ff` gãy mà KHÔNG tạo `MERGE_HEAD` — không phải xung đột văn bản thật — nên catchup coi là ứng viên thử lại tốt nhất, vì lần gãy này rất có thể chỉ do điều kiện nhất thời; tsk-4hj `merge-blocked-other-item` — `MERGE_HEAD` đã có sẵn TRƯỚC lần merge này, thuộc về một việc KHÁC đang nhập dở, cũng là ứng viên thử lại tốt vì việc kia rồi sẽ xong hoặc bị hủy) và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge-base --is-ancestor <đích> HEAD` TRƯỚC khi nhập → nhánh đã chứa đích rồi (exit 0) → bỏ hẳn merge lẫn commit (merge sẽ là no-op, `git commit` sau đó chết vì \"nothing to commit\" và việc kẹt `blocked` vĩnh viễn), vẫn chạy `runGoalCheck` thật trên cây hiện có → đỏ → giữ nguyên `blocked`, KHÔNG gọi `git merge --abort` (không có merge nào đang chạy) → xanh → `moveWork(..., to:'awaiting-approval')` với `outcome: 'already-caught-up'`, không tạo commit nào; chưa chứa đích (exit 1) → `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'awaiting-approval', expectedStatus:'blocked')` — cạnh, không `reason`, không qua `doing` (spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)\n- `src/evolve/candidates.mjs` — Gate A candidate ranking (self-improve loop STR13 Slice 1): thuần (`rankCandidates(view)`), không fs/Date.now, tái dùng `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa \"chưa ngã-ngũ\" hay trọng số riêng); một candidate mỗi id còn friction chưa ngã-ngũ, trường hiển thị lấy từ bản ghi MỚI NHẤT theo `ts`, `score` cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, sắp xếp score giảm dần rồi id tăng dần (tie-break). Manifest layer: domain.\n- `bin/fgos.mjs` verb `evolve` — bề mặt CLI của Gate A (xem \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).\n- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem \"Iron Law — phân loại rủi ro của một candidate fix\" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: ba chỗ trong `bin/fgos.mjs`, tất cả nguồn `runner` và tất cả chỉ ở ranh giới trunk (per `0032`) — `approve` (ngay trước bước kiểm cây sạch, STR13 Slice 3), pre-check thuần của `merge next`, và `sync-root`. Ba bản gọi giữ nguyên hình dạng lặp có chủ đích: `approve`/`merge next` phân biệt bằng `resolveRoot`, `sync-root` bằng `!item.parent` (RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent`. Manifest layer (`docs/architecture-manifest.json`): infra.\n- `domains/coding/AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos-routing/SKILL.md`\n- `.claude/skills/fgos-routing/SKILL.md` + `.agents/skills/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp\n- `.claude/skills/fgos-coding-discovering/SKILL.md` + `.agents/` mirror — skill `nghiên-cứu` (stage `discovery`, pha máy-một-mình)\n- `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `exploring`, pha máy+người)\n- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `planning`; cũng là skill mà tên stage di sản `decompose` trỏ tới)\n- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `planning`, gác cạnh `planning→executing`) — KHÔNG có ô riêng nào trong bảng stage→skill: nó chạy như pha thứ hai của chính `fgos-coding-planning`\n- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/` mirror — skill `thi-công` (stage `executing`, domain `coding` — str89-fgos-domain-skills)\n- `src/state/domain-registry.mjs` + Workflow của domain (`steps[].skill`, `skillForStep(domain, step)`) (str89-fgos-domain-skills) — skill ứng với mỗi bước nằm trong Workflow, xem spec Work-State \"Mô hình domain\"\n- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần\n- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)\n- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy\n- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là \"chính phiên này tiếp tục\", không phải một chủ cạnh tranh; danh tính KHÁC: mọi writer ghi `ttlMs` của chính nó vào record và người tranh xét record theo `ttlMs` ĐÓ, không bao giờ theo `ttlMs` của mình — số nguyên: pid sống VÀ còn trong ttl; chuỗi: chỉ xét độ mới (không có gì để kiểm sống); record cũ không có `ttlMs` nhận cửa sổ của writer cũ (chuỗi phiên do hook cũ ghi: `HOOK_TTL_MS` 20 s; pid: `DEFAULT_TTL_MS` 3 phút), mọi ttl bị chặn ở trần một run (4 h); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ); record có trường `v` (giao thức khóa mới hơn) hoặc marker `.fgos/runtime/locks/<tên khóa>/protocol.json` khác `{writer:1}` (một quyết định marker cho mọi cửa: acquire kiểm TRƯỚC khi ghi và kiểm lại sau acquire, `inspectMainCheckoutLock` kiểm trước nhánh \"không có file\", `forceReclaimAmbiguousLock` kiểm trước mọi sửa, hook và Rust `lock.rs` dùng cùng luật) → HELD với `reason: unsupported-protocol`; record có `v` kể cả khi mang đủ `pid`/`ts` không bao giờ bị dọn/làm mới/release (kể cả closure của một hold cũ và `releaseMainCheckoutLock`), `fgos unlock` từ chối và không bao giờ báo `cleared:true`. Writer tự acquire của checkpoint (`acquiringMainCheckoutWriter`) dùng `allowSelfRecognition: false` để không tái nhập hold của một operation khác cùng pid. Checkpoint `.fgos` (`runOpportunisticMainCheckoutChecks`) chạy trọn add → commit → reset-khi-lỗi trong mutex này: mutex thuộc tầng runner nên checkpoint (tầng kernel) nhận `mainCheckoutWriter` từ caller: caller đã giữ (claim, merge không slot) truyền `heldMainCheckoutWriter(pid)`, caller chỉ giữ merge slot truyền `acquiringMainCheckoutWriter(dir)` (acquire rồi nhả ngay, bị giữ thì bỏ lượt); không có writer thì checkpoint không commit. Manifest layer: infra.\n- `src/util/session-identity.mjs` (STR65; ở `src/runner/` cho tới tsk-49i — dời sang `util/` để `state/store.mjs` không phải import ngược sang `runner/`) — `resolveWriterIdentity(fgosDir, {env, pid, execFile})` → `{id, source}`: ưu tiên `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` làm `id` chuỗi; registry `<fgosDir>/sessions.json` chỉ ĐỐI CHIẾU giá trị đó, không bao giờ tự cấp một danh tính — khớp một `row.sessionId` → `source: 'registry'`, không khớp → `source: 'env'` (không có luật khớp theo thư mục hay pid của row, per str46-io-contract). Vắng cả hai biến môi trường (hoặc giá trị sai charset) thì đi ngược tối đa 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi `ps`) lấy một pid số làm `id`, `source: 'pid'` — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → `id` lui về pid của chính người gọi, `source: 'unresolved'` thay vì treo/ném lỗi (`unresolved` là nhãn xuất xứ, không phải danh tính vắng mặt — giá trị `id` không đổi, per str46-io-contract). Manifest layer: kernel.\n- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem \"Khóa hoạt động cây chính\" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); sau các guard `.fgos`/root-file/nhánh `fgw/*`, đọc `.fgos/main-checkout.lock` MỘT lần qua `inspectMainCheckoutLock` (không acquire, không chờ — git đã giữ `index.lock` khi hook chạy): pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp holder sống → commit của fgOS, bỏ qua đèn; holder pid số khác còn sống, giao thức khóa lạ, hoặc khóa hỏng → từ chối. Rồi `resolveWriterIdentity()` và đèn hoạt động `src/runner/main-checkout-activity.mjs` (`.fgos/runtime/main-checkout-activity.json`): writer khác trong `windowMs` → từ chối; còn lại ghi đèn cuối hook với `windowMs` = `HOOK_TTL_MS` 20 s (đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`); từ chối → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0.\n- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.\n- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-discovery — dispatch worker thật rồi phán quyết đủ rõ đẩy item sang `planning`, phán quyết chưa đủ rõ đẩy sang `exploring` + đậu chờ người, worker sập thì item đứng yên tại `discovery`/`todo` — cộng các kịch bản stage-clarify/stage-decompose còn lại, nay khẳng định `--once` KHÔNG tự phán ở hai tên stage đó: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimRole`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→awaiting-approval`) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + `test/runner/frozen-judge.test.mjs` (STR63 — unit `frozenJudgeHits`, mọi rule + exact-path footprint match) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 1380 test toàn suite tính tới STR63 (`cd repo && npm test`, số cũ 637 đã trôi qua nhiều feature trước đó — không phải drift do cell này)"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-102",
    "githubAnchor": "unheaded-block-102",
    "stableAnchor": "unheaded-block-102",
    "title": "Unheaded block 102",
    "startLine": 1222,
    "endLine": 1272,
    "textDigest": "29fd80cd85f3529f3dcc99950563df4461655efc9d0550abe9dc52b199d07854",
    "sample": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit",
    "identityFingerprint": "8a39cdd36cc90738b6c6fc0ceb366669f9e4f310dbc882ec3442d71205ef0851",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Pointers (implementation)"
    ],
    "text": "- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng\n- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem \"Gặt-lại lúc khởi động\") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`resolveTierModel` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade \"(không có)\" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item\n- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem \"Báo việc-phát-hiện từ trợ lý\" trên, RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, có trần + chống trùng)): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, và stage vào-vòng của domain — `discovery` cho `coding`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc \"chỉ báo, không tự ghi\" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`\n- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song\n- `src/runner/frozen-judge.mjs` (STR63, domain layer thuần — không fs/git) — `FROZEN_JUDGE_PATTERNS` (bê nguyên từ frozen-judge của bee, bỏ mục `.bee/config.json` không áp dụng) + `frozenJudgeHits(changedFiles, footprint)`: chấm file đã đổi khớp nhóm nhạy cảm (test/CI/lockfile/manifest) NGOÀI `footprint` đã khai — khớp exact-path, không prefix/glob. `bin/fgos.mjs`'s `changedFilesSince(cwd, from, to)` (`git diff --name-only`, cạnh `commitsSince`) cấp input; gọi trong `return` khi `check.passed`, xem RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn)\n- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ `moveStage` tới `planning` (bỏ qua `exploring`), verdict chưa đủ rõ `moveStage` tới `exploring` RỒI đậu `awaiting-human` mang câu hỏi (hai cửa ghi rời nhau — `stage` và `status` không giẫm nhau); một đề xuất `verify` còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi, bất đồng thì cũng đậu chờ người. `judgeDiscovery` (lời gọi phán lồng cũ) đã NGHỈ HƯU: engine luôn cần một verdict do người gọi đưa vào — worker của quét nghiên-cứu, hay phiên sống gọi `fgos discover --verdict` — thiếu verdict thì role `runner` no-op an toàn, role khác báo lỗi rõ ràng\n- `src/intake/plan.mjs` (đổi tên từ `decompose.mjs`) — xem Pointers spec Work-State (module dùng chung giữa runner và verb `plan` khi item ở stage `planning`, hoặc còn ở tên di sản `decompose`); verb `plan` (phiên sống) truyền `'session'`; `resolvePlan` cũng là chỗ nhả claim `doing→todo` khi gốc sang `executing` (claim-lock §3b)\n- `src/runner/prompt-templates/worker-prompt-discovery.txt` — mẫu prompt riêng của lượt dispatch nghiên-cứu, chọn bởi luật `{domain:'coding', stage:'discovery'}` trong `selectTemplate` (`src/runner/prompt-templates.mjs`); mọi lời gọi không truyền `stage` giữ nguyên hành vi cũ, không bị luật này chen trước. (Helper thử-lại `src/intake/judge-executor.mjs` của bản trước đã bị xoá cùng lúc `judgeDiscovery`/`judgeDecompose` nghỉ hưu — không còn lời gọi model phán lồng nào để thử lại.)\n- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`.fgos/logs/entropy-history.jsonl`, gitignored, kể từ phase-01 plans/260825-0842-fgos-logs-dir-bucketing) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này\n- `.fgos/config.json`'s `runner` section (tsk-5vf; tsk-5hv xoá hẳn fallback về file flat legacy cũ — đây giờ là nguồn config DUY NHẤT, `fgos setup` là verb thực hiện move thật) — config committed (executor template + `modelPolicies.claude` nano/haiku, standard/sonnet, frontier/opus [tsk-5tm, thay `models` phẳng cũ; 6-tier vocab từ 2026-09-17] + timeoutMs); `executor.args` mang `--permission-mode acceptEdits`, không còn quyền git — runner commit thay worker (0052) (quyền TỐI THIỂU, xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfigForDir(dir)` — shared-file-aware: tại đường MẶC ĐỊNH (không `--config`) vắng file, gọi `detectAssistantCli` (quét PATH thuần, không spawn — `KNOWN_ASSISTANT_CLI_NAMES`) rồi viết `DEFAULT_RUNNER_CONFIG` với executor từ `SUPPORTED_EXECUTOR_TEMPLATES[detected]` khi trợ lý dò được có mẫu đã kiểm chứng (hôm nay chỉ `claude`, y hệt `DEFAULT_RUNNER_CONFIG.executor`), hoặc executor placeholder tự-báo-lỗi khi không (RUL48b) — rồi mới nạp, kèm một dòng thông báo tên file + executor được chọn (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfigForDir` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh của `discover` (`fgos-runner` chỉ còn đường mặc định, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)); đọc qua `mergeWithGlobalConfig` trước khi tách phần `runner` (project luôn thắng `~/.fgos/config.json` theo key, tsk-5vf)\n- `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi (RUL84 (one write-scope matcher)): chuẩn hoá `writes`, nở `runner.generatedPaths`, `matchesWriteScope`/`partitionPaths` cho runner commit, settlement và Workflow.\n- `src/workflow/units-source.mjs` — `translateUnitsToWorkflow`: dịch units file của `fgos workflow start --units` thành Workflow tạm, mỗi Unit một step (RUL89 (workflow start --units)).\n- `src/runner/execution/account-pin.mjs` — ghim account (RUL91 (a person may pin the provider account of a unit run)): `resolveAccountPin` (bind() gọi), `runnerConfigForBinding` (inventory thu hẹp cho dispatch), `assertPinnedAccountsUsable` (quarantine trước unit run/resume), `capacityProviderOf`.\n- `src/runner/execution/partial-writes.mjs` — `worktreeSnapshot`/`writesSince`: baseline của seat ghi và phép so sau provider-limit (RUL92 (a writing seat is not run again over its own partial writes)).\n- `src/runner/execution/unit-sync.mjs` — sync base của Unit (RUL97 (a Unit may sync a base ref first)): `seedSync` (resolve ref trước khi unit run tồn tại), `runPendingSync`, `assertSyncResumable`, `syncBrief`, `commitRoundWithSync`; git tin cậy nằm ở `commit-unit-work.mjs` (`startSyncMerge`/`finishSyncMerge`/`syncMergeState`).\n- `src/runner/work-dispatch.mjs` — cửa của tầng Work vào runUnit (RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)): `workUnitFor`/`workUnitIdFor` (Unit từ Work item), `spawnWorker` (chạy Unit, ánh xạ outcome sang recovery matrix, cờ `resumable`); `src/runner/fanout-batch.mjs` — fan-out batch trên runUnit.\n- `src/runner/operation-choice.mjs` — driver của Work (RUL94 (a Work driver step runs as a Unit)): `chooseStageOperation`, `executeDriverOperationChoice` chạy operation qua `runUnit`, walker `findLatestAssignmentRunResult` đọc verdict ở cả hai layout và so plan theo `rel` + digest; `digestPinnedInputs` (`src/runner/dispatch/assignment-runner.mjs`) băm pin lúc launch.\n- `src/runner/dispatch/run-timeout.mjs` — sàn/trần thời gian của một lượt chạy (RUL96 (one run may take its own timeout)): `RUN_TIMEOUT_MIN_MS`, `RUN_TIMEOUT_MAX_MS`, `runTimeoutProblem`; leaf không import, đọc bởi `config.mjs` (`parseRunTimeout`, `assertRunTimeoutMs`), reaper confinement, khoá dispatch và `src/workflow/definition.mjs`.\n- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue({onCommit})`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau; hiện thực in-process của \"cửa ghi\"; `onCommit` (TÙY CHỌN, str7-str8-priority-intent) — callback gọi đúng một lần trên MỖI giao dịch thành công (không bao giờ trên giao dịch reject), tự bọc try/catch riêng nên một callback lỗi không bao giờ làm gãy hàng đợi; `createWriteQueue` không tham số giữ hành vi y hệt trước khi `onCommit` tồn tại\n- `src/runner/loop.mjs`'s `runWatch(options)` (str7-str8-priority-intent) — vòng cầm-giao bền, xem \"Vòng cầm-giao bền (--watch)\" trên; ghép `runOnce` KHÔNG ĐỔI làm hộp đen, gọi lặp lại; MỘT `createWriteQueue({onCommit})` + MỘT `createMissBreaker` được tạo trước vòng lặp và dùng CHUNG xuyên mọi lượt (không tạo lại mỗi lượt — điểm đúng-sai cốt lõi cho cầu dao tích lũy per RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); một cờ đóng (closure boolean) do `onCommit` set, kiểm tra SAU khi mỗi lượt `runOnce` trả về (không phải một listener chờ sự kiện — mọi giao dịch cửa-ghi trong sản phẩm đều nằm TRONG một lượt `runOnce` đã await xong, nên một thiết kế lắng-nghe-sau sẽ không bao giờ bắt được tín hiệu, đã bị loại per quyết định d3445024); lượt không ghi gì chờ qua `node:timers/promises`'s `setTimeout(ms, null, {signal})` — hủy được ngay khi `AbortSignal` bắn, không rò timer/listener vì không có listener nào để rò; một `runOnce` throw bị bọc try/catch, báo qua `options.onCycle`, KHÔNG BAO GIỜ thoát ra ngoài làm gãy vòng lặp\n- `src/state/frontier.mjs` — `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); ở `state/` chứ không ở `runner/root-affinity.mjs` như trước (tsk-49i) vì chính `state/` cũng cần cùng phép đi ngược đó, và việc import ngược sang `runner/` là một trong các cạnh làm hai thư mục phụ thuộc vòng\n- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process): `createOwnershipStore` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này\n- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `role` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle)\n- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State \"Cửa pull giao–nhận việc\" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới), xem spec Work-State \"Cửa pull giao–nhận việc\")\n- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → renew/check lock ownership synchronously → commit-hoặc-abort, spike-proven; mất lock ở bước kiểm tra cuối trả `lock-lost-mid-merge` và KHÔNG abort merge state vì tree đó có thể thuộc chủ lock mới; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`awaiting-approval→done`/`awaiting-approval→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra\n- `src/verbs/merge/*.mjs` (tầng `use-case`, tsk-49i) — logic nghiệp vụ của cả 7 verb cụm merge: `merge.mjs` (`mergeList`/`mergeNext`), `approve.mjs`, `review.mjs`, `sync-root.mjs`, `catchup.mjs`, `reject.mjs`, `promote-to-component.mjs`. `bin/fgos.mjs` cho 7 verb này chỉ còn parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb (`--trust-dir` gate cho approve/sync-root/promote-to-component; `path.dirname(dir)` vô điều kiện cho catchup, tsk-5vl; `process.cwd` thô cho drift của `merge list`/`merge next`), rồi gọi một hàm use-case. `merge next` gọi thẳng `approveUseCase`/`syncRootUseCase` (same-rank, hợp lệ) thay cho đệ quy `runVerb` cũ, và option của hai verb đó được `parseMergeClusterOptions` dựng MỘT lần rồi truyền nguyên khối — thay cho việc forward raw `flags`\n- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem \"Cổng duyệt PR nội bộ\" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `state/frontier.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường; gốc không con giữ nguyên hành vi/lý do cũ, không đổi\n- `src/runner/github-adapter.mjs` (github-adapter, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về \"chưa rõ\" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (verify vẫn ở cây làm việc cục bộ).\n- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem \"Cổng duyệt qua GitHub\" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.\n- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem \"Đồng bộ lại một việc đỗ (catch-up)\" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-blocked-other-item`, `lock-lost-mid-merge`, `main-checkout-dirty-mid-merge`} (`main-checkout-dirty-mid-merge`: cổng duyệt gốc→`main` kiểm cây sạch hai lần — trước khi mở worktree CAS, và lại lần nữa dưới `main-checkout.lock` ngay trước `update-ref`, đóng khe hở giữa hai lần đó; lần hai dính bẩn thì không `update-ref`/không đồng bộ cây, trả `blocked` với lý do này, cùng hình dạng \"chưa chạm gì, thử lại được\" như `lock-lost-mid-merge`) (tsk-18a một lần `git merge --no-commit --no-ff` gãy mà KHÔNG tạo `MERGE_HEAD` — không phải xung đột văn bản thật — nên catchup coi là ứng viên thử lại tốt nhất, vì lần gãy này rất có thể chỉ do điều kiện nhất thời; tsk-4hj `merge-blocked-other-item` — `MERGE_HEAD` đã có sẵn TRƯỚC lần merge này, thuộc về một việc KHÁC đang nhập dở, cũng là ứng viên thử lại tốt vì việc kia rồi sẽ xong hoặc bị hủy) và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge-base --is-ancestor <đích> HEAD` TRƯỚC khi nhập → nhánh đã chứa đích rồi (exit 0) → bỏ hẳn merge lẫn commit (merge sẽ là no-op, `git commit` sau đó chết vì \"nothing to commit\" và việc kẹt `blocked` vĩnh viễn), vẫn chạy `runGoalCheck` thật trên cây hiện có → đỏ → giữ nguyên `blocked`, KHÔNG gọi `git merge --abort` (không có merge nào đang chạy) → xanh → `moveWork(..., to:'awaiting-approval')` với `outcome: 'already-caught-up'`, không tạo commit nào; chưa chứa đích (exit 1) → `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'awaiting-approval', expectedStatus:'blocked')` — cạnh, không `reason`, không qua `doing` (spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)\n- `src/evolve/candidates.mjs` — Gate A candidate ranking (self-improve loop STR13 Slice 1): thuần (`rankCandidates(view)`), không fs/Date.now, tái dùng `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa \"chưa ngã-ngũ\" hay trọng số riêng); một candidate mỗi id còn friction chưa ngã-ngũ, trường hiển thị lấy từ bản ghi MỚI NHẤT theo `ts`, `score` cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, sắp xếp score giảm dần rồi id tăng dần (tie-break). Manifest layer: domain.\n- `bin/fgos.mjs` verb `evolve` — bề mặt CLI của Gate A (xem \"Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).\n- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem \"Iron Law — phân loại rủi ro của một candidate fix\" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: ba chỗ trong `bin/fgos.mjs`, tất cả nguồn `runner` và tất cả chỉ ở ranh giới trunk (per `0032`) — `approve` (ngay trước bước kiểm cây sạch, STR13 Slice 3), pre-check thuần của `merge next`, và `sync-root`. Ba bản gọi giữ nguyên hình dạng lặp có chủ đích: `approve`/`merge next` phân biệt bằng `resolveRoot`, `sync-root` bằng `!item.parent` (RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent`. Manifest layer (`docs/architecture-manifest.json`): infra.\n- `domains/coding/AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos-routing/SKILL.md`\n- `.claude/skills/fgos-routing/SKILL.md` + `.agents/skills/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp\n- `.claude/skills/fgos-coding-discovering/SKILL.md` + `.agents/` mirror — skill `nghiên-cứu` (stage `discovery`, pha máy-một-mình)\n- `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `exploring`, pha máy+người)\n- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `planning`; cũng là skill mà tên stage di sản `decompose` trỏ tới)\n- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `planning`, gác cạnh `planning→executing`) — KHÔNG có ô riêng nào trong bảng stage→skill: nó chạy như pha thứ hai của chính `fgos-coding-planning`\n- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/` mirror — skill `thi-công` (stage `executing`, domain `coding` — str89-fgos-domain-skills)\n- `src/state/domain-registry.mjs` + Workflow của domain (`steps[].skill`, `skillForStep(domain, step)`) (str89-fgos-domain-skills) — skill ứng với mỗi bước nằm trong Workflow, xem spec Work-State \"Mô hình domain\"\n- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần\n- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)\n- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy\n- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là \"chính phiên này tiếp tục\", không phải một chủ cạnh tranh; danh tính KHÁC: mọi writer ghi `ttlMs` của chính nó vào record và người tranh xét record theo `ttlMs` ĐÓ, không bao giờ theo `ttlMs` của mình — số nguyên: pid sống VÀ còn trong ttl; chuỗi: chỉ xét độ mới (không có gì để kiểm sống); record cũ không có `ttlMs` nhận cửa sổ của writer cũ (chuỗi phiên do hook cũ ghi: `HOOK_TTL_MS` 20 s; pid: `DEFAULT_TTL_MS` 3 phút), mọi ttl bị chặn ở trần một run (4 h); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ); record có trường `v` (giao thức khóa mới hơn) hoặc marker `.fgos/runtime/locks/<tên khóa>/protocol.json` khác `{writer:1}` (một quyết định marker cho mọi cửa: acquire kiểm TRƯỚC khi ghi và kiểm lại sau acquire, `inspectMainCheckoutLock` kiểm trước nhánh \"không có file\", `forceReclaimAmbiguousLock` kiểm trước mọi sửa, hook và Rust `lock.rs` dùng cùng luật) → HELD với `reason: unsupported-protocol`; record có `v` kể cả khi mang đủ `pid`/`ts` không bao giờ bị dọn/làm mới/release (kể cả closure của một hold cũ và `releaseMainCheckoutLock`), `fgos unlock` từ chối và không bao giờ báo `cleared:true`. Writer tự acquire của checkpoint (`acquiringMainCheckoutWriter`) dùng `allowSelfRecognition: false` để không tái nhập hold của một operation khác cùng pid. Checkpoint `.fgos` (`runOpportunisticMainCheckoutChecks`) chạy trọn add → commit → reset-khi-lỗi trong mutex này: mutex thuộc tầng runner nên checkpoint (tầng kernel) nhận `mainCheckoutWriter` từ caller: caller đã giữ (claim, merge không slot) truyền `heldMainCheckoutWriter(pid)`, caller chỉ giữ merge slot truyền `acquiringMainCheckoutWriter(dir)` (acquire rồi nhả ngay, bị giữ thì bỏ lượt); không có writer thì checkpoint không commit. Manifest layer: infra.\n- `src/util/session-identity.mjs` (STR65; ở `src/runner/` cho tới tsk-49i — dời sang `util/` để `state/store.mjs` không phải import ngược sang `runner/`) — `resolveWriterIdentity(fgosDir, {env, pid, execFile})` → `{id, source}`: ưu tiên `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` làm `id` chuỗi; registry `<fgosDir>/sessions.json` chỉ ĐỐI CHIẾU giá trị đó, không bao giờ tự cấp một danh tính — khớp một `row.sessionId` → `source: 'registry'`, không khớp → `source: 'env'` (không có luật khớp theo thư mục hay pid của row, per str46-io-contract). Vắng cả hai biến môi trường (hoặc giá trị sai charset) thì đi ngược tối đa 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi `ps`) lấy một pid số làm `id`, `source: 'pid'` — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → `id` lui về pid của chính người gọi, `source: 'unresolved'` thay vì treo/ném lỗi (`unresolved` là nhãn xuất xứ, không phải danh tính vắng mặt — giá trị `id` không đổi, per str46-io-contract). Manifest layer: kernel.\n- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem \"Khóa hoạt động cây chính\" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); sau các guard `.fgos`/root-file/nhánh `fgw/*`, đọc `.fgos/main-checkout.lock` MỘT lần qua `inspectMainCheckoutLock` (không acquire, không chờ — git đã giữ `index.lock` khi hook chạy): pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp holder sống → commit của fgOS, bỏ qua đèn; holder pid số khác còn sống, giao thức khóa lạ, hoặc khóa hỏng → từ chối. Rồi `resolveWriterIdentity()` và đèn hoạt động `src/runner/main-checkout-activity.mjs` (`.fgos/runtime/main-checkout-activity.json`): writer khác trong `windowMs` → từ chối; còn lại ghi đèn cuối hook với `windowMs` = `HOOK_TTL_MS` 20 s (đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`); từ chối → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0.\n- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.\n- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-discovery — dispatch worker thật rồi phán quyết đủ rõ đẩy item sang `planning`, phán quyết chưa đủ rõ đẩy sang `exploring` + đậu chờ người, worker sập thì item đứng yên tại `discovery`/`todo` — cộng các kịch bản stage-clarify/stage-decompose còn lại, nay khẳng định `--once` KHÔNG tự phán ở hai tên stage đó: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimRole`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→awaiting-approval`) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + `test/runner/frozen-judge.test.mjs` (STR63 — unit `frozenJudgeHits`, mọi rule + exact-path footprint match) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 1380 test toàn suite tính tới STR63 (`cd repo && npm test`, số cũ 637 đã trôi qua nhiều feature trước đó — không phải drift do cell này)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_4599d55c9de4262714d378be2b9eaf80"
}
```

## Entry claim_bbfca84de55fe9dfa387cd027bb818f7

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_bbfca84de55fe9dfa387cd027bb818f7",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "69c505b02cb220b5d9d9d1d4b0806d808fc8cf7219abe9a78bc02e74e5abdd76",
    "identityFingerprint": "69c505b02cb220b5d9d9d1d4b0806d808fc8cf7219abe9a78bc02e74e5abdd76",
    "claimId": "claim_bbfca84de55fe9dfa387cd027bb818f7",
    "sourceAnchor": "unheaded-block-330",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "2b6d9c95cda4a9c5c9e36a2acd67da0f030a9cfd01e83e7932e10cdbcd814ce8",
    "claimKind": "specification",
    "status": "current",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "69c505b02cb220b5d9d9d1d4b0806d808fc8cf7219abe9a78bc02e74e5abdd76",
    "identityFingerprint": "69c505b02cb220b5d9d9d1d4b0806d808fc8cf7219abe9a78bc02e74e5abdd76",
    "claimId": "claim_bbfca84de55fe9dfa387cd027bb818f7",
    "sourceAnchor": "unheaded-block-330",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "2b6d9c95cda4a9c5c9e36a2acd67da0f030a9cfd01e83e7932e10cdbcd814ce8",
    "claimKind": "specification",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-330",
    "githubAnchor": "unheaded-block-330",
    "stableAnchor": "unheaded-block-330",
    "title": "Unheaded block 330",
    "startLine": 3348,
    "endLine": 3360,
    "textDigest": "2b6d9c95cda4a9c5c9e36a2acd67da0f030a9cfd01e83e7932e10cdbcd814ce8",
    "sample": "- **Trạng thái:** Settled (2026-10-15). W1' của thiết kế nền lock + identity bản 2 (`plans/reports/design-261015-1814-lock-and-identity-foundation-lead-design-v2.md` mục 8.5, 13) c",
    "identityFingerprint": "69c505b02cb220b5d9d9d1d4b0806d808fc8cf7219abe9a78bc02e74e5abdd76",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0064 — Hook commit để lại đèn hoạt động riêng, không ghi `main-checkout.lock`; người tranh xét record theo `ttlMs` của chính holder; checkpoint dưới merge slot giữ main mutex"
    ],
    "text": "- **Trạng thái:** Settled (2026-10-15). W1' của thiết kế nền lock + identity bản 2 (`plans/reports/design-261015-1814-lock-and-identity-foundation-lead-design-v2.md` mục 8.5, 13) cộng các điều kiện phản biện vòng 2 (`plans/reports/red-team-astra-round2-261015-1859-lock-and-identity-foundation-design-v2-review.md` B4 và \"W1 chạy một mình\"). Không gì của W2+ (ledger, grant v2, holder-lock).\n- **Bối cảnh:** Hook ghi `main-checkout.lock` bằng chuỗi session id, không `ttlMs`, không bao giờ release; claim/land/merge/`fgctl init` đọc record đó bằng 180 s và identity `process.pid` của chính mình, nên sau MỌI commit ở main, mọi pick/take/land của mọi phiên (kể cả phiên vừa commit) bị chặn tới ~3 phút. Đèn báo và mutex nằm chung một file và một bảng quyết định.\n- **Quyết định:**\n  1. Hook ghi đèn `.fgos/runtime/main-checkout-activity.json` (`windowMs` do người ghi khai), ghi CUỐI hook sau mọi kiểm tra từ chối; không ghi/acquire `main-checkout.lock`. Chỉ hook đọc đèn. Commit của fgOS (pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp đúng holder sống của khóa) bỏ qua đèn. Hook đọc khóa một lần, không chờ: holder pid số sống khác, giao thức lạ hoặc khóa hỏng → từ chối.\n  2. Năm lời `releaseMainCheckoutLockIfOwn(dir, writerId)` của `bin/fgos.mjs` (cleanup ×2, compound, return ×2) thành `clearBeaconIfOwn`. Không còn lời gọi nào chạm `main-checkout.lock` bằng writer id.\n  3. Mọi writer của `main-checkout.lock`, `merge-slot--*`, `dispatch--*` ghi `ttlMs`; người tranh dùng `ttlMs` của record (chặn ở 4 h), không dùng của mình. Record cũ không `ttlMs`: chuỗi phiên → 20 s, pid → 180 s, composite dispatch → 4 h. Rust `lock.rs` theo cùng luật.\n  4. Checkpoint `.fgos` chạy trọn add → commit → reset-khi-lỗi trong main mutex v1: caller truyền `mainCheckoutWriter` (mutex thuộc tầng runner, kernel không import lên): đã giữ thì `heldMainCheckoutWriter(pid)` (không acquire lồng, không re-entry theo identity), chỉ giữ merge slot thì `acquiringMainCheckoutWriter(dir)` acquire rồi nhả ngay, bị giữ thì bỏ lượt; không có writer thì không commit.\n  5. Trung hoà: record có `v` hoặc marker `.fgos/runtime/locks/<tên>/protocol.json` khác `{writer:1}` → HELD `unsupported-protocol`, không bao giờ bị dọn, làm mới hay release. Marker là một quyết định chung cho acquire (trước khi ghi và sau acquire), inspect (trước nhánh không có file), reclaim/unlock, hook và Rust; record có `v` bị từ chối kể cả khi mang đủ `pid`/`ts`. Writer tự acquire của checkpoint không tự nhận holder cùng pid (`allowSelfRecognition: false`). Chưa có code v2 nên không chuyển hướng; nâng marker chờ sửa B1/B2/B3.\n  6. Vùng claim giữ nguyên độ rộng (A7 chưa sửa).\n- **Không đóng:** A1 (dọn v1 vẫn đọc-lại-rồi-unlink), lấy cắp holder số còn sống khi quá ttl (nay là ttl của holder), commit tay không bị loại trừ (A5), `main-checkout-reset` chưa bọc mutex, promote-engine đọc tip ngoài lock, hook `post-checkout`/worktree add chậm vẫn trong vùng claim (A14). Đèn còn sót của hook bản cũ đọc theo 20 s, nhưng release cũ đang chạy vẫn có thể ghi record chuỗi mới cho tới khi được thay.\n- **Bằng chứng:** `test/e2e/main-checkout-activity-beacon.test.mjs` (9 ca, đỏ trên HEAD trước thay đổi, xanh sau), `test/runner/main-checkout-lock.test.mjs`, `test/runner/main-checkout-activity.test.mjs`, ba file e2e hook hiện có, `cargo test -p fgos-distribution lock::`. Báo cáo: `plans/reports/implementation-261015-2150-w1-main-checkout-lock-unblock.md`.\n- **Ranh giới:** No component-boundary change (đèn là một file mới trong `.fgos/runtime/` của runner; mutex giữ chủ cũ).\nĐổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-330",
    "githubAnchor": "unheaded-block-330",
    "stableAnchor": "unheaded-block-330",
    "title": "Unheaded block 330",
    "startLine": 3348,
    "endLine": 3360,
    "textDigest": "2b6d9c95cda4a9c5c9e36a2acd67da0f030a9cfd01e83e7932e10cdbcd814ce8",
    "sample": "- **Trạng thái:** Settled (2026-10-15). W1' của thiết kế nền lock + identity bản 2 (`plans/reports/design-261015-1814-lock-and-identity-foundation-lead-design-v2.md` mục 8.5, 13) c",
    "identityFingerprint": "69c505b02cb220b5d9d9d1d4b0806d808fc8cf7219abe9a78bc02e74e5abdd76",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0064 — Hook commit để lại đèn hoạt động riêng, không ghi `main-checkout.lock`; người tranh xét record theo `ttlMs` của chính holder; checkpoint dưới merge slot giữ main mutex"
    ],
    "text": "- **Trạng thái:** Settled (2026-10-15). W1' của thiết kế nền lock + identity bản 2 (`plans/reports/design-261015-1814-lock-and-identity-foundation-lead-design-v2.md` mục 8.5, 13) cộng các điều kiện phản biện vòng 2 (`plans/reports/red-team-astra-round2-261015-1859-lock-and-identity-foundation-design-v2-review.md` B4 và \"W1 chạy một mình\"). Không gì của W2+ (ledger, grant v2, holder-lock).\n- **Bối cảnh:** Hook ghi `main-checkout.lock` bằng chuỗi session id, không `ttlMs`, không bao giờ release; claim/land/merge/`fgctl init` đọc record đó bằng 180 s và identity `process.pid` của chính mình, nên sau MỌI commit ở main, mọi pick/take/land của mọi phiên (kể cả phiên vừa commit) bị chặn tới ~3 phút. Đèn báo và mutex nằm chung một file và một bảng quyết định.\n- **Quyết định:**\n  1. Hook ghi đèn `.fgos/runtime/main-checkout-activity.json` (`windowMs` do người ghi khai), ghi CUỐI hook sau mọi kiểm tra từ chối; không ghi/acquire `main-checkout.lock`. Chỉ hook đọc đèn. Commit của fgOS (pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp đúng holder sống của khóa) bỏ qua đèn. Hook đọc khóa một lần, không chờ: holder pid số sống khác, giao thức lạ hoặc khóa hỏng → từ chối.\n  2. Năm lời `releaseMainCheckoutLockIfOwn(dir, writerId)` của `bin/fgos.mjs` (cleanup ×2, compound, return ×2) thành `clearBeaconIfOwn`. Không còn lời gọi nào chạm `main-checkout.lock` bằng writer id.\n  3. Mọi writer của `main-checkout.lock`, `merge-slot--*`, `dispatch--*` ghi `ttlMs`; người tranh dùng `ttlMs` của record (chặn ở 4 h), không dùng của mình. Record cũ không `ttlMs`: chuỗi phiên → 20 s, pid → 180 s, composite dispatch → 4 h. Rust `lock.rs` theo cùng luật.\n  4. Checkpoint `.fgos` chạy trọn add → commit → reset-khi-lỗi trong main mutex v1: caller truyền `mainCheckoutWriter` (mutex thuộc tầng runner, kernel không import lên): đã giữ thì `heldMainCheckoutWriter(pid)` (không acquire lồng, không re-entry theo identity), chỉ giữ merge slot thì `acquiringMainCheckoutWriter(dir)` acquire rồi nhả ngay, bị giữ thì bỏ lượt; không có writer thì không commit.\n  5. Trung hoà: record có `v` hoặc marker `.fgos/runtime/locks/<tên>/protocol.json` khác `{writer:1}` → HELD `unsupported-protocol`, không bao giờ bị dọn, làm mới hay release. Marker là một quyết định chung cho acquire (trước khi ghi và sau acquire), inspect (trước nhánh không có file), reclaim/unlock, hook và Rust; record có `v` bị từ chối kể cả khi mang đủ `pid`/`ts`. Writer tự acquire của checkpoint không tự nhận holder cùng pid (`allowSelfRecognition: false`). Chưa có code v2 nên không chuyển hướng; nâng marker chờ sửa B1/B2/B3.\n  6. Vùng claim giữ nguyên độ rộng (A7 chưa sửa).\n- **Không đóng:** A1 (dọn v1 vẫn đọc-lại-rồi-unlink), lấy cắp holder số còn sống khi quá ttl (nay là ttl của holder), commit tay không bị loại trừ (A5), `main-checkout-reset` chưa bọc mutex, promote-engine đọc tip ngoài lock, hook `post-checkout`/worktree add chậm vẫn trong vùng claim (A14). Đèn còn sót của hook bản cũ đọc theo 20 s, nhưng release cũ đang chạy vẫn có thể ghi record chuỗi mới cho tới khi được thay.\n- **Bằng chứng:** `test/e2e/main-checkout-activity-beacon.test.mjs` (9 ca, đỏ trên HEAD trước thay đổi, xanh sau), `test/runner/main-checkout-lock.test.mjs`, `test/runner/main-checkout-activity.test.mjs`, ba file e2e hook hiện có, `cargo test -p fgos-distribution lock::`. Báo cáo: `plans/reports/implementation-261015-2150-w1-main-checkout-lock-unblock.md`.\n- **Ranh giới:** No component-boundary change (đèn là một file mới trong `.fgos/runtime/` của runner; mutex giữ chủ cũ).\nĐổi quyết định này = supersede bằng record mới, không sửa tại chỗ."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_bbfca84de55fe9dfa387cd027bb818f7"
}
```

## Entry claim_5f3ad073a39ac476da56045883f4e852

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_5f3ad073a39ac476da56045883f4e852",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "2c3d2d02d8eb81a6495353c3968f624728f02c6faa5a69413c29226a0007a9a2",
    "identityFingerprint": "2c3d2d02d8eb81a6495353c3968f624728f02c6faa5a69413c29226a0007a9a2",
    "claimId": "claim_5f3ad073a39ac476da56045883f4e852",
    "sourceAnchor": "unheaded-block-52",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "325f9c8c7a59c1dfe6ece4b1b20bb12769d8239db1ad80a0e8c3b20d236ea62c",
    "claimKind": "specification",
    "status": "current",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/specs/runner.md",
    "unitDigest": "2c3d2d02d8eb81a6495353c3968f624728f02c6faa5a69413c29226a0007a9a2",
    "identityFingerprint": "2c3d2d02d8eb81a6495353c3968f624728f02c6faa5a69413c29226a0007a9a2",
    "claimId": "claim_5f3ad073a39ac476da56045883f4e852",
    "sourceAnchor": "unheaded-block-52",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "325f9c8c7a59c1dfe6ece4b1b20bb12769d8239db1ad80a0e8c3b20d236ea62c",
    "claimKind": "specification",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-52",
    "githubAnchor": "unheaded-block-52",
    "stableAnchor": "unheaded-block-52",
    "title": "Unheaded block 52",
    "startLine": 886,
    "endLine": 915,
    "textDigest": "325f9c8c7a59c1dfe6ece4b1b20bb12769d8239db1ad80a0e8c3b20d236ea62c",
    "sample": "- **Runs when:** mọi lần `git commit` chạm cây chính — dù người gõ tay, một trợ lý,\n  hay CI — đi qua một hook cài sẵn ở tầng git (không phải một verb fgOS, không phải\n  một cấu hì",
    "identityFingerprint": "2c3d2d02d8eb81a6495353c3968f624728f02c6faa5a69413c29226a0007a9a2",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Behaviors & Operations",
      "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)"
    ],
    "text": "- **Runs when:** mọi lần `git commit` chạm cây chính — dù người gõ tay, một trợ lý,\n  hay CI — đi qua một hook cài sẵn ở tầng git (không phải một verb fgOS, không phải\n  một cấu hình riêng của công cụ trợ lý nào).\n- **Blocked when:** đèn hoạt động (beacon, `.fgos/runtime/main-checkout-activity.json`)\n  ghi rằng một danh tính KHÁC đã commit ở cây chính này trong cửa sổ `windowMs` chính\n  người ghi khai (mặc định 20 s, đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`) — commit\n  bị từ chối thẳng; hoặc một writer fgOS (claim, checkpoint, land) đang giữ\n  `.fgos/main-checkout.lock` bằng pid số còn sống — hook chỉ đọc khóa này MỘT lần, không\n  bao giờ chờ, rồi từ chối; hoặc khóa không đọc được / thuộc giao thức khóa mới hơn bản\n  đang chạy — commit CŨNG bị từ chối (thà chặn nhầm còn hơn để lọt một race thật). Đèn\n  hỏng thì ngược lại: chỉ là gợi ý, nên cảnh báo rồi cho qua. Commit của chính fgOS\n  (biến `FGOS_MAIN_LOCK_HOLDER_PID` khớp đúng pid đang giữ khóa) bỏ qua đèn, không ghi đèn.\n- **What changes:** khi cây chính đang rảnh, hoặc khi CHÍNH danh tính đang commit là\n  danh tính đã ghi khóa gần nhất (cùng phiên tiếp tục làm việc), commit đi qua bình\n  thường, không thông báo gì. Danh tính ưu tiên biến môi trường phiên trợ lý khi có;\n  vắng mặt (terminal tay gõ) thì suy ra từ một tiến trình tổ tiên gần đó — suy đoán\n  tốt-nhất, không tuyệt đối (hai terminal tay gõ chia sẻ cùng tiến trình cha gần có\n  thể không phân biệt được nhau — xem Open Gaps).\n- **Side effects:** ghi đèn hoạt động (`{v:1, kind:'beacon', writer, writtenAt,\n  windowMs, auditPid}`, thay nguyên tử) CUỐI hook, sau mọi kiểm tra từ chối, nên commit\n  bị từ chối không để lại đèn. Hook KHÔNG ghi `.fgos/main-checkout.lock`: đó là mutex của\n  writer fgOS, claim/land/approve/`fgctl init` không bao giờ đọc đèn, nên một commit ở\n  main không còn chặn ai tới 3 phút. Không đụng sổ đăng ký phiên, không đụng\n  `sessions.lock`/`runner.lock`/`events.lock`. `fgos return`/`cleanup`/`compound` xoá\n  đèn của chính phiên (chỉ khi đúng writer); `fgos lock-status` hiện đèn ở trường\n  `activity`.\n- **Afterwards:** một commit bị từ chối in thông điệp giải thích bằng thời gian (\"một\n  phiên khác dường như đang hoạt động ở đây gần đây\") và trỏ người tới đúng cách mở\n  một cây làm việc cô lập — không bao giờ in ra một định danh thô (pid/session-id) như\n  thể đó là thứ người đọc cần tự hành động theo."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-52",
    "githubAnchor": "unheaded-block-52",
    "stableAnchor": "unheaded-block-52",
    "title": "Unheaded block 52",
    "startLine": 886,
    "endLine": 915,
    "textDigest": "325f9c8c7a59c1dfe6ece4b1b20bb12769d8239db1ad80a0e8c3b20d236ea62c",
    "sample": "- **Runs when:** mọi lần `git commit` chạm cây chính — dù người gõ tay, một trợ lý,\n  hay CI — đi qua một hook cài sẵn ở tầng git (không phải một verb fgOS, không phải\n  một cấu hì",
    "identityFingerprint": "2c3d2d02d8eb81a6495353c3968f624728f02c6faa5a69413c29226a0007a9a2",
    "ancestry": [
      "Spec: Runner (vòng tự hành)",
      "Behaviors & Operations",
      "Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)"
    ],
    "text": "- **Runs when:** mọi lần `git commit` chạm cây chính — dù người gõ tay, một trợ lý,\n  hay CI — đi qua một hook cài sẵn ở tầng git (không phải một verb fgOS, không phải\n  một cấu hình riêng của công cụ trợ lý nào).\n- **Blocked when:** đèn hoạt động (beacon, `.fgos/runtime/main-checkout-activity.json`)\n  ghi rằng một danh tính KHÁC đã commit ở cây chính này trong cửa sổ `windowMs` chính\n  người ghi khai (mặc định 20 s, đè được qua `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`) — commit\n  bị từ chối thẳng; hoặc một writer fgOS (claim, checkpoint, land) đang giữ\n  `.fgos/main-checkout.lock` bằng pid số còn sống — hook chỉ đọc khóa này MỘT lần, không\n  bao giờ chờ, rồi từ chối; hoặc khóa không đọc được / thuộc giao thức khóa mới hơn bản\n  đang chạy — commit CŨNG bị từ chối (thà chặn nhầm còn hơn để lọt một race thật). Đèn\n  hỏng thì ngược lại: chỉ là gợi ý, nên cảnh báo rồi cho qua. Commit của chính fgOS\n  (biến `FGOS_MAIN_LOCK_HOLDER_PID` khớp đúng pid đang giữ khóa) bỏ qua đèn, không ghi đèn.\n- **What changes:** khi cây chính đang rảnh, hoặc khi CHÍNH danh tính đang commit là\n  danh tính đã ghi khóa gần nhất (cùng phiên tiếp tục làm việc), commit đi qua bình\n  thường, không thông báo gì. Danh tính ưu tiên biến môi trường phiên trợ lý khi có;\n  vắng mặt (terminal tay gõ) thì suy ra từ một tiến trình tổ tiên gần đó — suy đoán\n  tốt-nhất, không tuyệt đối (hai terminal tay gõ chia sẻ cùng tiến trình cha gần có\n  thể không phân biệt được nhau — xem Open Gaps).\n- **Side effects:** ghi đèn hoạt động (`{v:1, kind:'beacon', writer, writtenAt,\n  windowMs, auditPid}`, thay nguyên tử) CUỐI hook, sau mọi kiểm tra từ chối, nên commit\n  bị từ chối không để lại đèn. Hook KHÔNG ghi `.fgos/main-checkout.lock`: đó là mutex của\n  writer fgOS, claim/land/approve/`fgctl init` không bao giờ đọc đèn, nên một commit ở\n  main không còn chặn ai tới 3 phút. Không đụng sổ đăng ký phiên, không đụng\n  `sessions.lock`/`runner.lock`/`events.lock`. `fgos return`/`cleanup`/`compound` xoá\n  đèn của chính phiên (chỉ khi đúng writer); `fgos lock-status` hiện đèn ở trường\n  `activity`.\n- **Afterwards:** một commit bị từ chối in thông điệp giải thích bằng thời gian (\"một\n  phiên khác dường như đang hoạt động ở đây gần đây\") và trỏ người tới đúng cách mở\n  một cây làm việc cô lập — không bao giờ in ra một định danh thô (pid/session-id) như\n  thể đó là thứ người đọc cần tự hành động theo."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_5f3ad073a39ac476da56045883f4e852"
}
```

## Entry claim_251b389b227a62ef26b0fd3e1f0bebd9

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_251b389b227a62ef26b0fd3e1f0bebd9",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "68d6174b9b02bd3e5b9ef8e9b95f911a4888abd54545339bc6856b028a81da02",
    "identityFingerprint": "68d6174b9b02bd3e5b9ef8e9b95f911a4888abd54545339bc6856b028a81da02",
    "claimId": "claim_251b389b227a62ef26b0fd3e1f0bebd9",
    "sourceAnchor": "unheaded-block-14",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f",
    "claimKind": "unclassified",
    "status": "current"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "AGENTS.md",
    "unitDigest": "68d6174b9b02bd3e5b9ef8e9b95f911a4888abd54545339bc6856b028a81da02",
    "identityFingerprint": "68d6174b9b02bd3e5b9ef8e9b95f911a4888abd54545339bc6856b028a81da02",
    "claimId": "claim_251b389b227a62ef26b0fd3e1f0bebd9",
    "sourceAnchor": "unheaded-block-14",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f",
    "claimKind": "unclassified",
    "status": "current",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-14 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-14",
    "githubAnchor": "unheaded-block-14",
    "stableAnchor": "unheaded-block-14",
    "title": "Unheaded block 14",
    "startLine": 85,
    "endLine": 91,
    "textDigest": "9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f",
    "sample": "Rust `fgos` is the standard door for every verb. `bin/fgos.mjs` is the\n`legacy-node` payload entry, staged whole under a release's\n`components.legacyNode.root` and exec'd by the Ru",
    "identityFingerprint": "68d6174b9b02bd3e5b9ef8e9b95f911a4888abd54545339bc6856b028a81da02",
    "ancestry": [
      "forgent",
      "Legacy-Node CLI Ownership Boundary"
    ],
    "text": "Rust `fgos` is the standard door for every verb. `bin/fgos.mjs` is the\n`legacy-node` payload entry, staged whole under a release's\n`components.legacyNode.root` and exec'd by the Rust host at\n`components.legacyNode.entry` — never relocated or renamed in the source tree.\nThe host resolves it only through those manifest fields, never PATH, cwd or\nhardcoded locations outside the manifest. Global npm `bin.fgos` and fallback\n`node bin/fgos.mjs` are compatibility channels calling this entry directly."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_251b389b227a62ef26b0fd3e1f0bebd9"
}
```

## Entry claim_b19630ef4dcf1330c9807fc226a90e7b

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_b19630ef4dcf1330c9807fc226a90e7b",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/architecture-manifest.json",
    "unitDigest": "da05abfa0f09e69312f721a571c4d9ca39ff0326f84f5985a3fd2b7de2f57d63",
    "identityFingerprint": "da05abfa0f09e69312f721a571c4d9ca39ff0326f84f5985a3fd2b7de2f57d63",
    "claimId": "claim_b19630ef4dcf1330c9807fc226a90e7b",
    "sourceAnchor": "file-block",
    "unitKind": "file-block",
    "sourceUnitDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/architecture-manifest.json",
    "unitDigest": "da05abfa0f09e69312f721a571c4d9ca39ff0326f84f5985a3fd2b7de2f57d63",
    "identityFingerprint": "da05abfa0f09e69312f721a571c4d9ca39ff0326f84f5985a3fd2b7de2f57d63",
    "claimId": "claim_b19630ef4dcf1330c9807fc226a90e7b",
    "sourceAnchor": "file-block",
    "unitKind": "file-block",
    "sourceUnitDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor file-block is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "file-block",
    "anchor": "file-block",
    "githubAnchor": "file-block",
    "stableAnchor": "file-block",
    "title": "architecture-manifest.json",
    "startLine": 1,
    "endLine": 268,
    "textDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "identityFingerprint": "da05abfa0f09e69312f721a571c4d9ca39ff0326f84f5985a3fd2b7de2f57d63",
    "sample": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": ",
    "ancestry": [],
    "text": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": [\n    \"one-directional-layer\",\n    \"domain-siloing\"\n  ],\n  \"components\": [\n    \"packaging-distribution\"\n  ],\n  \"domains\": [\n    \"coding\",\n    \"marketing\"\n  ],\n  \"files\": {\n    \"bin/fgos.mjs\": \"entry\",\n    \"bin/fgos-runner.mjs\": \"entry\",\n    \"src/runner/loop.mjs\": \"use-case\",\n    \"src/runner/paths.mjs\": \"infra\",\n    \"src/runner/dispatch.mjs\": \"infra\",\n    \"src/runner/operation-capability.mjs\": \"domain\",\n    \"src/runner/rigor.mjs\": \"kernel\",\n    \"src/runner/fanout-batch.mjs\": \"use-case\",\n    \"src/runner/work-compat.mjs\": \"infra\",\n    \"src/runner/dispatch/adapters.mjs\": \"infra\",\n    \"src/runner/dispatch/config.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/policies.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/bypass-pairing.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/backend-registry.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/authority.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/request.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/resources.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/cleanup.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/attestation-store.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/drivers/bwrap.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/probes/harness.mjs\": \"infra\",\n    \"src/runner/dispatch/resolve.mjs\": \"infra\",\n    \"src/runner/dispatch/mechanism.mjs\": \"infra\",\n    \"src/runner/dispatch/plan.mjs\": \"infra\",\n    \"src/runner/dispatch/transport.mjs\": \"infra\",\n    \"src/runner/dispatch/prepare.mjs\": \"infra\",\n    \"src/runner/dispatch/result-ladder.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-layout.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-normalizer.mjs\": \"infra\",\n    \"src/runner/dispatch/execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/effective-execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/agent-result-claim-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/evidence-attribution.mjs\": \"infra\",\n    \"src/runner/dispatch/write-scope.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-timeout.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-result.mjs\": \"infra\",\n    \"src/runner/dispatch/usage-parsers.mjs\": \"infra\",\n    \"src/runner/dispatch/runtime-inspection.mjs\": \"infra\",\n    \"src/runner/dispatch/reconciliation-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-policy.mjs\": \"infra\",\n    \"src/runner/dispatch/operation-prompt-templates.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-adapter.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-capacity.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-auth-failure.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-account-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-renewal.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-runner.mjs\": \"infra\",\n    \"src/runner/dispatch/settlement.mjs\": \"infra\",\n    \"src/runner/dispatch/reconcile-cli-spawn.mjs\": \"infra\",\n    \"src/runner/dispatch/cli.mjs\": \"infra\",\n    \"src/runner/dispatch/detached-run-supervisor.mjs\": \"infra\",\n    \"src/runner/prompt-templates.mjs\": \"infra\",\n    \"src/runner/worker-log.mjs\": \"infra\",\n    \"src/runner/agent-roster.mjs\": \"infra\",\n    \"src/runner/agent-definitions.mjs\": \"infra\",\n    \"src/runner/agent-listing.mjs\": \"infra\",\n    \"src/runner/worktree.mjs\": \"infra\",\n    \"src/runner/promote-preflight.mjs\": \"infra\",\n    \"src/runner/promote-engine.mjs\": \"infra\",\n    \"src/runner/session.mjs\": \"infra\",\n    \"src/runner/gateway-control.mjs\": \"infra\",\n    \"src/runner/goal-check.mjs\": \"infra\",\n    \"src/runner/iron-law-gate.mjs\": \"infra\",\n    \"src/runner/frozen-judge.mjs\": \"domain\",\n    \"src/runner/merge.mjs\": \"infra\",\n    \"src/runner/main-checkout-lock.mjs\": \"infra\",\n    \"src/runner/main-checkout-activity.mjs\": \"infra\",\n    \"src/runner/main-checkout-reset-guard.mjs\": \"infra\",\n    \"src/runner/github-adapter.mjs\": \"infra\",\n    \"src/state/drift-status.mjs\": \"infra\",\n    \"src/state/postland-drift.mjs\": \"infra\",\n    \"src/state/store.mjs\": \"infra\",\n    \"src/state/gate-bypass.mjs\": \"infra\",\n    \"src/state/cursor.mjs\": \"use-case\",\n    \"src/state/porting-store.mjs\": \"infra\",\n    \"src/state/tool-registry.mjs\": \"domain\",\n    \"src/install/coexist.mjs\": \"infra\",\n    \"src/runner/recovery.mjs\": \"domain\",\n    \"src/runner/anti-loop.mjs\": \"domain\",\n    \"src/runner/attestation-guard.mjs\": \"domain\",\n    \"src/runner/claim-port.mjs\": \"infra\",\n    \"src/runner/claim-liveness.mjs\": \"infra\",\n    \"src/runner/lock-wait.mjs\": \"infra\",\n    \"src/runner/write-queue.mjs\": \"domain\",\n    \"src/runner/root-affinity.mjs\": \"domain\",\n    \"src/state/status-fsm.mjs\": \"domain\",\n    \"src/state/decision-question.mjs\": \"domain\",\n    \"src/state/handoff.mjs\": \"domain\",\n    \"src/state/porting.mjs\": \"domain\",\n    \"src/state/frontier.mjs\": \"domain\",\n    \"src/state/impact.mjs\": \"domain\",\n    \"src/state/priority-formula.mjs\": \"domain\",\n    \"src/state/replay.mjs\": \"domain\",\n    \"src/state/events-compaction.mjs\": \"domain\",\n    \"src/state/dep-graph.mjs\": \"domain\",\n    \"src/state/graph-harness.mjs\": \"domain\",\n    \"src/state/graph-metrics.mjs\": \"domain\",\n    \"src/state/awaiting-context.mjs\": \"domain\",\n    \"src/state/cleanup-harness.mjs\": \"domain\",\n    \"src/state/cleanup-pool.mjs\": \"domain\",\n    \"src/state/discover-pool.mjs\": \"domain\",\n    \"src/state/plan-pool.mjs\": \"domain\",\n    \"src/state/retro-pool.mjs\": \"domain\",\n    \"src/state/retrospective-doors.mjs\": \"domain\",\n    \"src/state/worker-slots.mjs\": \"domain\",\n    \"src/intake/discovery.mjs\": \"use-case\",\n    \"src/intake/plan.mjs\": \"use-case\",\n    \"src/intake/plan-verdict-from-plan-md.mjs\": \"use-case\",\n    \"src/intake/verify-pattern-check.mjs\": \"kernel\",\n    \"src/cli/command-registry.mjs\": \"kernel\",\n    \"src/cli/deprecation.mjs\": \"kernel\",\n    \"src/cli/version.mjs\": \"kernel\",\n    \"src/cli/invocation-fault-log.mjs\": \"infra\",\n    \"src/cli/approve-fault-log.mjs\": \"infra\",\n    \"src/report/enduser-index.mjs\": \"domain\",\n    \"src/report/enduser-index-generate.mjs\": \"infra\",\n    \"src/report/decision-index.mjs\": \"infra\",\n    \"src/report/capability-plan-lint.mjs\": \"infra\",\n    \"src/report/context-render.mjs\": \"domain\",\n    \"src/report/frontmatter.mjs\": \"domain\",\n    \"src/report/authoritative-match.mjs\": \"domain\",\n    \"src/evolve/iron-law.mjs\": \"domain\",\n    \"src/state/events.mjs\": \"kernel\",\n    \"src/state/events-jsonl-truncation-guard.mjs\": \"kernel\",\n    \"src/state/main-checkout-guard-warnings.mjs\": \"kernel\",\n    \"src/state/work.mjs\": \"kernel\",\n    \"src/state/envelope.mjs\": \"kernel\",\n    \"src/intake/risk-keywords.mjs\": \"kernel\",\n    \"src/verbs/merge/merge.mjs\": \"use-case\",\n    \"src/verbs/merge/iron-law-level.mjs\": \"use-case\",\n    \"src/verbs/merge/approve.mjs\": \"use-case\",\n    \"src/verbs/merge/review.mjs\": \"use-case\",\n    \"src/verbs/merge/sync-root.mjs\": \"use-case\",\n    \"src/verbs/merge/catchup.mjs\": \"use-case\",\n    \"src/verbs/merge/reject.mjs\": \"use-case\",\n    \"src/verbs/merge/promote-to-component.mjs\": \"use-case\",\n    \"src/verbs/state/edit.mjs\": \"use-case\",\n    \"src/verbs/state/move.mjs\": \"use-case\",\n    \"src/verbs/state/read.mjs\": \"use-case\",\n    \"src/verbs/dispatch/show-run.mjs\": \"use-case\",\n    \"src/verbs/dispatch/inspect.mjs\": \"use-case\",\n    \"src/verbs/dispatch/reconcile.mjs\": \"use-case\",\n    \"src/verbs/dispatch/watch.mjs\": \"use-case\",\n    \"src/verbs/dispatch/recover.mjs\": \"use-case\",\n    \"src/report/item-trace.mjs\": \"domain\",\n    \"src/util/format-bytes.mjs\": \"kernel\",\n    \"src/util/format-duration.mjs\": \"kernel\",\n    \"src/util/normalize-path.mjs\": \"kernel\",\n    \"src/util/git-paths.mjs\": \"kernel\",\n    \"src/util/release-binary-path.mjs\": \"kernel\",\n    \"src/util/release-targets.mjs\": \"kernel\",\n    \"src/util/session-identity.mjs\": \"kernel\",\n    \"src/util/unique-tmp-tag.mjs\": \"kernel\",\n    \"src/util/host-bin.mjs\": \"infra\",\n    \"src/convention/convention-client.mjs\": \"infra\",\n    \"src/observe/friction-client.mjs\": \"infra\",\n    \"src/intake/classify.mjs\": \"use-case\",\n    \"src/setup/ansi.mjs\": \"domain\",\n    \"src/setup/config-merge.mjs\": \"domain\",\n    \"src/setup/shell-rc.mjs\": \"infra\",\n    \"src/setup/project-launcher.mjs\": \"infra\",\n    \"src/setup/bin-discovery.mjs\": \"infra\",\n    \"src/setup/skill-wrappers.mjs\": \"infra\",\n    \"src/setup/instruction-registry.mjs\": \"infra\",\n    \"src/setup/git-hooks.mjs\": \"infra\",\n    \"src/setup/claude-code-hooks.mjs\": \"infra\",\n    \"src/setup/agent-hooks.mjs\": \"infra\",\n    \"src/setup/agy-permissions.mjs\": \"infra\",\n    \"src/setup/agent-cli-trust.mjs\": \"infra\",\n    \"src/setup/blind-steps-proven-pools.mjs\": \"use-case\",\n    \"src/setup/workflow-pool-independence.mjs\": \"use-case\",\n    \"src/setup/checks.mjs\": \"use-case\",\n    \"src/setup/executor-profile-warnings.mjs\": \"infra\",\n    \"src/config/global-config.mjs\": \"infra\",\n    \"src/setup/registrations.mjs\": \"use-case\",\n    \"src/setup/executor-posture-coverage.mjs\": \"use-case\",\n    \"src/config/shared-config-file.mjs\": \"domain\",\n    \"src/state/knowledge-registry.mjs\": \"domain\",\n    \"src/report/knowledge-resolver.mjs\": \"domain\",\n    \"src/report/knowledge-projection.mjs\": \"domain\",\n    \"src/state/fgos-file-registry.mjs\": \"kernel\",\n    \"src/state/runtime-coordination.mjs\": \"infra\",\n    \"src/runner/dispatch/brief.mjs\": \"infra\",\n    \"src/runner/dispatch/dispatch-error.mjs\": \"infra\",\n    \"src/runner/dispatch/proof-helpers.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-agent.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-diagnosis.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-round.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-reconcile.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-artifacts.mjs\": \"infra\",\n    \"src/runner/dispatch/liveness.mjs\": \"infra\",\n    \"src/runner/dispatch/visibility-session.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/run-lock.mjs\": \"infra\",\n    \"src/runner/dispatch/process-identity.mjs\": \"infra\",\n    \"src/runner/dispatch/trust-store.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-home.mjs\": \"infra\",\n    \"src/runner/dispatch/stop-processes-inside.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session-boot.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery.mjs\": \"infra\",\n    \"src/setup/instruction-composition.mjs\": \"infra\",\n    \"src/setup/instruction-projections.mjs\": \"infra\",\n    \"src/runner/execution/unit.mjs\": \"infra\",\n    \"src/runner/execution/bind.mjs\": \"infra\",\n    \"src/runner/execution/account-pin.mjs\": \"infra\",\n    \"src/runner/execution/account-rotation.mjs\": \"infra\",\n    \"src/runner/execution/dry-bind.mjs\": \"infra\",\n    \"src/runner/execution/role-ledger.mjs\": \"infra\",\n    \"src/runner/execution/commit-unit-work.mjs\": \"infra\",\n    \"src/runner/execution/partial-writes.mjs\": \"infra\",\n    \"src/runner/execution/unit-sync.mjs\": \"infra\",\n    \"src/runner/execution/handoff-refs.mjs\": \"infra\",\n    \"src/runner/execution/unit-run-history.mjs\": \"infra\",\n    \"src/runner/execution/unit-summary.mjs\": \"infra\",\n    \"src/runner/execution/run.mjs\": \"use-case\",\n    \"src/runner/execution/patterns/index.mjs\": \"domain\",\n    \"src/runner/execution/patterns/panel.mjs\": \"domain\",\n    \"src/runner/execution/patterns/presets.mjs\": \"domain\",\n    \"src/runner/execution/patterns/reviewed.mjs\": \"domain\",\n    \"src/runner/execution/patterns/role-tasks.mjs\": \"domain\",\n    \"src/runner/execution/patterns/solo.mjs\": \"domain\",\n    \"src/workflow/definition.mjs\": \"kernel\",\n    \"src/workflow/dir-guard.mjs\": \"infra\",\n    \"src/workflow/loader.mjs\": \"infra\",\n    \"src/workflow/store.mjs\": \"infra\",\n    \"src/workflow/integrate.mjs\": \"infra\",\n    \"src/workflow/plan-source.mjs\": \"infra\",\n    \"src/workflow/units-source.mjs\": \"infra\",\n    \"src/workflow/runner.mjs\": \"use-case\",\n    \"src/workflow/index.mjs\": \"use-case\",\n    \"src/workflow/checked.mjs\": \"infra\",\n    \"src/workflow/ref-digests.mjs\": \"infra\",\n    \"src/workflow/seat-providers.mjs\": \"infra\",\n    \"src/workflow/seats.mjs\": \"infra\",\n    \"src/workflow/steps.mjs\": \"kernel\",\n    \"src/state/domain-registry.mjs\": \"kernel\",\n    \"src/state/step-fsm.mjs\": \"domain\",\n    \"src/verbs/state/step.mjs\": \"use-case\",\n    \"src/runner/operation-choice.mjs\": \"use-case\",\n    \"src/runner/work-dispatch.mjs\": \"use-case\"\n  }\n}"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_b19630ef4dcf1330c9807fc226a90e7b"
}
```

## Entry claim_f5365b8e40fb58c75adc56a574263242

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_f5365b8e40fb58c75adc56a574263242",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "47f83d8d383a22d29f809cacdd7fdc8e73d5982d8aa670ed2b034a53a76f9bec",
    "identityFingerprint": "47f83d8d383a22d29f809cacdd7fdc8e73d5982d8aa670ed2b034a53a76f9bec",
    "claimId": "claim_f5365b8e40fb58c75adc56a574263242",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "47f83d8d383a22d29f809cacdd7fdc8e73d5982d8aa670ed2b034a53a76f9bec",
    "identityFingerprint": "47f83d8d383a22d29f809cacdd7fdc8e73d5982d8aa670ed2b034a53a76f9bec",
    "claimId": "claim_f5365b8e40fb58c75adc56a574263242",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "claimKind": "contract",
    "status": "current",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-5 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 24,
    "endLine": 31,
    "textDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "sample": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: ",
    "identityFingerprint": "47f83d8d383a22d29f809cacdd7fdc8e73d5982d8aa670ed2b034a53a76f9bec",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "text": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·\n  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,\n  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là\n  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn\n  `source` nói giá trị chưa kiểm chứng được)."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f5365b8e40fb58c75adc56a574263242"
}
```

## Entry claim_b584b3c07a52f009537dbb06423a177e

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_b584b3c07a52f009537dbb06423a177e",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "ee4438b2fbfef71a4e95f95612868f02e05c6cfb7bad34dae6a598789204b0c2",
    "identityFingerprint": "ee4438b2fbfef71a4e95f95612868f02e05c6cfb7bad34dae6a598789204b0c2",
    "claimId": "claim_b584b3c07a52f009537dbb06423a177e",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3780e1a95c63621f0792e2323f39e313728dfc96d106217f8b6b538e45143b7d",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "ee4438b2fbfef71a4e95f95612868f02e05c6cfb7bad34dae6a598789204b0c2",
    "identityFingerprint": "ee4438b2fbfef71a4e95f95612868f02e05c6cfb7bad34dae6a598789204b0c2",
    "claimId": "claim_b584b3c07a52f009537dbb06423a177e",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3780e1a95c63621f0792e2323f39e313728dfc96d106217f8b6b538e45143b7d",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-11 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-11",
    "githubAnchor": "unheaded-block-11",
    "stableAnchor": "unheaded-block-11",
    "title": "Unheaded block 11",
    "startLine": 75,
    "endLine": 75,
    "textDigest": "3780e1a95c63621f0792e2323f39e313728dfc96d106217f8b6b538e45143b7d",
    "sample": "Unit/Workflow execution ownership is described by [docs/platform/runner/spec.md](../runner/spec.md). The surviving Assignment/Run dispatch contract is retained in this area's curre",
    "identityFingerprint": "ee4438b2fbfef71a4e95f95612868f02e05c6cfb7bad34dae6a598789204b0c2",
    "ancestry": [
      "Agent Coordination Spec",
      "Contracts Owned"
    ],
    "text": "Unit/Workflow execution ownership is described by [docs/platform/runner/spec.md](../runner/spec.md). The surviving Assignment/Run dispatch contract is retained in this area's current contract and architecture documents; the runner spec does not supersede their complete recovery/control details."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_b584b3c07a52f009537dbb06423a177e"
}
```

## Entry claim_8a5245d8eeab527e4a691d5a4c548ef3

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_8a5245d8eeab527e4a691d5a4c548ef3",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "445b2487ad9359dcf5941b8cf02c14aa1e7bd6f481da52676130e1882c425ca4",
    "identityFingerprint": "445b2487ad9359dcf5941b8cf02c14aa1e7bd6f481da52676130e1882c425ca4",
    "claimId": "claim_8a5245d8eeab527e4a691d5a4c548ef3",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "98c4c235294db2b0d8048b250c3fda14ed0295d346be00eec139e901a12dd354",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "445b2487ad9359dcf5941b8cf02c14aa1e7bd6f481da52676130e1882c425ca4",
    "identityFingerprint": "445b2487ad9359dcf5941b8cf02c14aa1e7bd6f481da52676130e1882c425ca4",
    "claimId": "claim_8a5245d8eeab527e4a691d5a4c548ef3",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "98c4c235294db2b0d8048b250c3fda14ed0295d346be00eec139e901a12dd354",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-16 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-16",
    "githubAnchor": "unheaded-block-16",
    "stableAnchor": "unheaded-block-16",
    "title": "Unheaded block 16",
    "startLine": 100,
    "endLine": 100,
    "textDigest": "98c4c235294db2b0d8048b250c3fda14ed0295d346be00eec139e901a12dd354",
    "sample": "The former gap/status list is [retained verbatim](history/retired-engine/spec.md#literal-snapshot). It is not a current implementation backlog; use [the current owner](../runner/sp",
    "identityFingerprint": "445b2487ad9359dcf5941b8cf02c14aa1e7bd6f481da52676130e1882c425ca4",
    "ancestry": [
      "Agent Coordination Spec",
      "Known Gaps"
    ],
    "text": "The former gap/status list is [retained verbatim](history/retired-engine/spec.md#literal-snapshot). It is not a current implementation backlog; use [the current owner](../runner/spec.md) when assessing present execution."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_8a5245d8eeab527e4a691d5a4c548ef3"
}
```

## Entry claim_b6578994ab5e57a69d65607a962cd9d0

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_b6578994ab5e57a69d65607a962cd9d0",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "590448af4b68b0424ce98e45ee303f03ad923ac7a8a2910b8cd06c5565d94b8e",
    "identityFingerprint": "590448af4b68b0424ce98e45ee303f03ad923ac7a8a2910b8cd06c5565d94b8e",
    "claimId": "claim_b6578994ab5e57a69d65607a962cd9d0",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6bea55eabbf3ca711b55d4bee07df1e778082b2c93056e32cd2385c41465f4df",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "590448af4b68b0424ce98e45ee303f03ad923ac7a8a2910b8cd06c5565d94b8e",
    "identityFingerprint": "590448af4b68b0424ce98e45ee303f03ad923ac7a8a2910b8cd06c5565d94b8e",
    "claimId": "claim_b6578994ab5e57a69d65607a962cd9d0",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6bea55eabbf3ca711b55d4bee07df1e778082b2c93056e32cd2385c41465f4df",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-11 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-11",
    "githubAnchor": "unheaded-block-11",
    "stableAnchor": "unheaded-block-11",
    "title": "Unheaded block 11",
    "startLine": 66,
    "endLine": 81,
    "textDigest": "6bea55eabbf3ca711b55d4bee07df1e778082b2c93056e32cd2385c41465f4df",
    "sample": "| Component | Current role | Current source |\n| --- | --- | --- |\n| Work Lifecycle Engine / Work Driver | Domain-agnostic work-unit lifecycle, status board, claim/return, human gat",
    "identityFingerprint": "590448af4b68b0424ce98e45ee303f03ad923ac7a8a2910b8cd06c5565d94b8e",
    "ancestry": [
      "Component Boundary",
      "4. Current High-Level Components"
    ],
    "text": "| Component | Current role | Current source |\n| --- | --- | --- |\n| Work Lifecycle Engine / Work Driver | Domain-agnostic work-unit lifecycle, status board, claim/return, human gates. Does not own stage or sequencing (owned by Workflow runner). Owns worker slots (`OccupancyPort`), and fail-safe claim settlement (`fgos return --to blocked`). | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |\n| Workflow (Định nghĩa + Run + Runner + Tích hợp) | Domain-neutral step & Unit DAG scheduling (`src/workflow/**`), human review gates, pure git integration. Single sequencer for plans, workflows, and multi-unit tasks. | [../specs/runner.md](../specs/runner.md) |\n| Execution Core (Unit, Unit run, `bind()`, Pattern cộng tác, cửa `fgos run`, posture) | Single authority for \"ai làm / model / persona / cơ chế\" (`src/runner/execution/bind.mjs`), single run door for new work (`fgos run` via `src/runner/execution/run.mjs`, herdr pane default, cli fallback), OS confinement posture for both herdr and cli, verifiable mutating gate. Strictly forbids L3 Work lifecycle dependencies (`src/state/**`). | [../specs/runner.md](../specs/runner.md) |\n| Collaboration Patterns (Execution Core) | Domain-neutral small collaboration loops (`solo`, `reviewed`, `panel`) and presets (`consult`, `research-fan-out`, `rfc`). Replaces retired coordination engine. | [../specs/runner.md](../specs/runner.md) |\n| Herdr (Transport chính + Bề mặt quan sát) | Transport mặc định cho out-of-process runs, pane execution liveness, plugin `herdr-dashboard/` (TUI trong pane herdr + pick/pane supervisor; herdr nạp qua `herdr-plugin.toml`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |\n| fgos Gateway | Tiến trình detached duy nhất phục vụ REST API (`/v1`, hợp đồng CTR010), MCP `search`/`execute` trên cùng cổng, và bundle web dashboard nhúng sẵn (`apps/fgos-gateway/`: `gateway.rs`, `mcp.rs`, `cf_access.rs`, `remote_invocation.rs`, `web/`). Vòng đời duy nhất qua `fgos gateway start\\|status\\|stop`; không phải một phần của herdr và không phải \"herdr-gateway\" (tên đó chỉ repo tham chiếu ngoài). Dùng chung với `herdr-dashboard` lớp adapter CLI fgos tại `packages/herdr-fgos-common/rust` (`fgos.rs`, `settings.rs`, trait `WorkItemSource`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |\n| Dispatch Transport & Confinement | Machine backend registry, isolation confinement (`bwrap` v1 driver, attestation storage, fail-closed probes), executor adapters; the `bwrap` driver calls the credential renewal module at provisioning (`copyCredentialFiles`, the write-back marker) and removing a private home (`confinement/cleanup.mjs`) calls it again for write-back (dependency confinement → provider capacity, for the account lock only). | [../specs/confinement-authority.md](../specs/confinement-authority.md) |\n| Run Result Evaluator | Evidence/confidence boundary for assignment run results. | [../architect/agent-coordination/architecture/evidence-and-results.md](../architect/agent-coordination/architecture/evidence-and-results.md) |\n| Domain Components And Extension Layer | Domain-specific behavior, workflows, skills, task specs, doctrine. L2 prose no longer picks executors or mechanisms (lớp matching L2 cũ đã thu hồi per 0048); thin driver `fgos-run` delegates directly to Workflow runner and P1 Execution Core. | [../../domains/](../../domains/), [../architect/domainization/](../architect/domainization/) |\n| Host And Surface Layer | CLI, fgos Gateway (REST/MCP/web), `herdr-dashboard` plugin and other Herdr surfaces into platform engines. | Host invocation and gateway docs |\n| Packaging-Distribution | Runtime packaging, install, activation, setup/doctor readiness. | [packaging-distribution/README.md](packaging-distribution/README.md) |\n| Knowledge, Learning, And Documentation Registry | Retrospective learning, doc registry, end-user docs index, trace/evolve signals. | Knowledge and docs registry docs |\n| Observe (Metrics & Friction) | Measurement and friction tracking across substrate entities (cases, runs, sessions, friction, snapshots). Owned in Rust (`packages/observe/rust`), native routing. | [../specs/observe.md](../specs/observe.md) |\n| Convention (Executable Names & Placement) | Platform-core authority for deterministic artifact names, repository-relative placement, path classification, and conformance checking. Implemented; owns no state and depends only on `fgos-host-runtime`. | [convention/spec.md](convention/spec.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_b6578994ab5e57a69d65607a962cd9d0"
}
```

## Entry claim_89a69393bbe06eaf65bb743c4720df35

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_89a69393bbe06eaf65bb743c4720df35",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "6bb6a51b7808a1756d2fa033a1f479508d4c6f1695e5f91cf9200dbd3395f748",
    "identityFingerprint": "6bb6a51b7808a1756d2fa033a1f479508d4c6f1695e5f91cf9200dbd3395f748",
    "claimId": "claim_89a69393bbe06eaf65bb743c4720df35",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "76ff74833d9f8d2f1da39c42c5a1882cfce68b4d5c0b02628f24d94e68cc3c42",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "6bb6a51b7808a1756d2fa033a1f479508d4c6f1695e5f91cf9200dbd3395f748",
    "identityFingerprint": "6bb6a51b7808a1756d2fa033a1f479508d4c6f1695e5f91cf9200dbd3395f748",
    "claimId": "claim_89a69393bbe06eaf65bb743c4720df35",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "76ff74833d9f8d2f1da39c42c5a1882cfce68b4d5c0b02628f24d94e68cc3c42",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-5 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 42,
    "endLine": 46,
    "textDigest": "76ff74833d9f8d2f1da39c42c5a1882cfce68b4d5c0b02628f24d94e68cc3c42",
    "sample": "| Source | Role |\n| --- | --- |\n| [../architect/component-boundary/README.md](../architect/component-boundary/README.md) | Reading portal for the existing component-boundary archit",
    "identityFingerprint": "6bb6a51b7808a1756d2fa033a1f479508d4c6f1695e5f91cf9200dbd3395f748",
    "ancestry": [
      "Component Boundary",
      "2. Current Source During Migration"
    ],
    "text": "| Source | Role |\n| --- | --- |\n| [../architect/component-boundary/README.md](../architect/component-boundary/README.md) | Reading portal for the existing component-boundary architecture package. |\n| [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) | Advisory map of components, bounded contexts, and authority boundaries. |\n| [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_89a69393bbe06eaf65bb743c4720df35"
}
```

## Entry claim_963b9565292a869b6e3576361bbec740

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_963b9565292a869b6e3576361bbec740",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "9da7367d8b1c9bde40a46a6835b661e216f45e4f726e6966d9ec597c39ef9e92",
    "identityFingerprint": "9da7367d8b1c9bde40a46a6835b661e216f45e4f726e6966d9ec597c39ef9e92",
    "claimId": "claim_963b9565292a869b6e3576361bbec740",
    "sourceAnchor": "unheaded-block-56",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a204f9bca146a5ddb4f8649b79dbb07fb4d06e0f7f526c4207f00237497e3700",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "9da7367d8b1c9bde40a46a6835b661e216f45e4f726e6966d9ec597c39ef9e92",
    "identityFingerprint": "9da7367d8b1c9bde40a46a6835b661e216f45e4f726e6966d9ec597c39ef9e92",
    "claimId": "claim_963b9565292a869b6e3576361bbec740",
    "sourceAnchor": "unheaded-block-56",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a204f9bca146a5ddb4f8649b79dbb07fb4d06e0f7f526c4207f00237497e3700",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-56 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-56",
    "githubAnchor": "unheaded-block-56",
    "stableAnchor": "unheaded-block-56",
    "title": "Unheaded block 56",
    "startLine": 391,
    "endLine": 406,
    "textDigest": "a204f9bca146a5ddb4f8649b79dbb07fb4d06e0f7f526c4207f00237497e3700",
    "sample": "| Existing contract or rule | Primary owner | Important consumers | Ownership note |\n|---|---|---|---|\n| [Workflow Stage Operation Contract](agent-coordination/contracts/workflow-s",
    "identityFingerprint": "9da7367d8b1c9bde40a46a6835b661e216f45e4f726e6966d9ec597c39ef9e92",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory",
      "7. Contract Authority Matrix"
    ],
    "text": "| Existing contract or rule | Primary owner | Important consumers | Ownership note |\n|---|---|---|---|\n| [Workflow Stage Operation Contract](agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |\n| [FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |\n| [CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |\n| Assignment section of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |\n| Run section of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |\n| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |\n| [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |\n| [Evidence And Result Architecture](agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |\n| [Work Integration Boundaries](agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |\n| [Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |\n| [ADR-007 Domain Harness Seam](agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |\n| Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |\n| Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |\n| Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_963b9565292a869b6e3576361bbec740"
}
```

## Entry claim_c872fffdb642fa2e566bf22e983430a5

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_c872fffdb642fa2e566bf22e983430a5",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/contracts/architecture-manifest.json",
    "unitDigest": "da05abfa0f09e69312f721a571c4d9ca39ff0326f84f5985a3fd2b7de2f57d63",
    "identityFingerprint": "da05abfa0f09e69312f721a571c4d9ca39ff0326f84f5985a3fd2b7de2f57d63",
    "claimId": "claim_c872fffdb642fa2e566bf22e983430a5",
    "sourceAnchor": "file-block",
    "unitKind": "file-block",
    "sourceUnitDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/contracts/architecture-manifest.json",
    "unitDigest": "da05abfa0f09e69312f721a571c4d9ca39ff0326f84f5985a3fd2b7de2f57d63",
    "identityFingerprint": "da05abfa0f09e69312f721a571c4d9ca39ff0326f84f5985a3fd2b7de2f57d63",
    "claimId": "claim_c872fffdb642fa2e566bf22e983430a5",
    "sourceAnchor": "file-block",
    "unitKind": "file-block",
    "sourceUnitDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor file-block is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "file-block",
    "anchor": "file-block",
    "githubAnchor": "file-block",
    "stableAnchor": "file-block",
    "title": "architecture-manifest.json",
    "startLine": 1,
    "endLine": 268,
    "textDigest": "92391ce631b0c3602a5e22947a73182a6fd37f148e4b052cb4749a55b7657a6d",
    "identityFingerprint": "da05abfa0f09e69312f721a571c4d9ca39ff0326f84f5985a3fd2b7de2f57d63",
    "sample": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": ",
    "ancestry": [],
    "text": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": [\n    \"one-directional-layer\",\n    \"domain-siloing\"\n  ],\n  \"components\": [\n    \"packaging-distribution\"\n  ],\n  \"domains\": [\n    \"coding\",\n    \"marketing\"\n  ],\n  \"files\": {\n    \"bin/fgos.mjs\": \"entry\",\n    \"bin/fgos-runner.mjs\": \"entry\",\n    \"src/runner/loop.mjs\": \"use-case\",\n    \"src/runner/paths.mjs\": \"infra\",\n    \"src/runner/dispatch.mjs\": \"infra\",\n    \"src/runner/operation-capability.mjs\": \"domain\",\n    \"src/runner/rigor.mjs\": \"kernel\",\n    \"src/runner/fanout-batch.mjs\": \"use-case\",\n    \"src/runner/work-compat.mjs\": \"infra\",\n    \"src/runner/dispatch/adapters.mjs\": \"infra\",\n    \"src/runner/dispatch/config.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/policies.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/bypass-pairing.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/backend-registry.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/authority.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/request.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/resources.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/cleanup.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/attestation-store.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/drivers/bwrap.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/probes/harness.mjs\": \"infra\",\n    \"src/runner/dispatch/resolve.mjs\": \"infra\",\n    \"src/runner/dispatch/mechanism.mjs\": \"infra\",\n    \"src/runner/dispatch/plan.mjs\": \"infra\",\n    \"src/runner/dispatch/transport.mjs\": \"infra\",\n    \"src/runner/dispatch/prepare.mjs\": \"infra\",\n    \"src/runner/dispatch/result-ladder.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-layout.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-normalizer.mjs\": \"infra\",\n    \"src/runner/dispatch/execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/effective-execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/agent-result-claim-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/evidence-attribution.mjs\": \"infra\",\n    \"src/runner/dispatch/write-scope.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-timeout.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-result.mjs\": \"infra\",\n    \"src/runner/dispatch/usage-parsers.mjs\": \"infra\",\n    \"src/runner/dispatch/runtime-inspection.mjs\": \"infra\",\n    \"src/runner/dispatch/reconciliation-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-policy.mjs\": \"infra\",\n    \"src/runner/dispatch/operation-prompt-templates.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-adapter.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-capacity.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-auth-failure.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-account-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-renewal.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-runner.mjs\": \"infra\",\n    \"src/runner/dispatch/settlement.mjs\": \"infra\",\n    \"src/runner/dispatch/reconcile-cli-spawn.mjs\": \"infra\",\n    \"src/runner/dispatch/cli.mjs\": \"infra\",\n    \"src/runner/dispatch/detached-run-supervisor.mjs\": \"infra\",\n    \"src/runner/prompt-templates.mjs\": \"infra\",\n    \"src/runner/worker-log.mjs\": \"infra\",\n    \"src/runner/agent-roster.mjs\": \"infra\",\n    \"src/runner/agent-definitions.mjs\": \"infra\",\n    \"src/runner/agent-listing.mjs\": \"infra\",\n    \"src/runner/worktree.mjs\": \"infra\",\n    \"src/runner/promote-preflight.mjs\": \"infra\",\n    \"src/runner/promote-engine.mjs\": \"infra\",\n    \"src/runner/session.mjs\": \"infra\",\n    \"src/runner/gateway-control.mjs\": \"infra\",\n    \"src/runner/goal-check.mjs\": \"infra\",\n    \"src/runner/iron-law-gate.mjs\": \"infra\",\n    \"src/runner/frozen-judge.mjs\": \"domain\",\n    \"src/runner/merge.mjs\": \"infra\",\n    \"src/runner/main-checkout-lock.mjs\": \"infra\",\n    \"src/runner/main-checkout-activity.mjs\": \"infra\",\n    \"src/runner/main-checkout-reset-guard.mjs\": \"infra\",\n    \"src/runner/github-adapter.mjs\": \"infra\",\n    \"src/state/drift-status.mjs\": \"infra\",\n    \"src/state/postland-drift.mjs\": \"infra\",\n    \"src/state/store.mjs\": \"infra\",\n    \"src/state/gate-bypass.mjs\": \"infra\",\n    \"src/state/cursor.mjs\": \"use-case\",\n    \"src/state/porting-store.mjs\": \"infra\",\n    \"src/state/tool-registry.mjs\": \"domain\",\n    \"src/install/coexist.mjs\": \"infra\",\n    \"src/runner/recovery.mjs\": \"domain\",\n    \"src/runner/anti-loop.mjs\": \"domain\",\n    \"src/runner/attestation-guard.mjs\": \"domain\",\n    \"src/runner/claim-port.mjs\": \"infra\",\n    \"src/runner/claim-liveness.mjs\": \"infra\",\n    \"src/runner/lock-wait.mjs\": \"infra\",\n    \"src/runner/write-queue.mjs\": \"domain\",\n    \"src/runner/root-affinity.mjs\": \"domain\",\n    \"src/state/status-fsm.mjs\": \"domain\",\n    \"src/state/decision-question.mjs\": \"domain\",\n    \"src/state/handoff.mjs\": \"domain\",\n    \"src/state/porting.mjs\": \"domain\",\n    \"src/state/frontier.mjs\": \"domain\",\n    \"src/state/impact.mjs\": \"domain\",\n    \"src/state/priority-formula.mjs\": \"domain\",\n    \"src/state/replay.mjs\": \"domain\",\n    \"src/state/events-compaction.mjs\": \"domain\",\n    \"src/state/dep-graph.mjs\": \"domain\",\n    \"src/state/graph-harness.mjs\": \"domain\",\n    \"src/state/graph-metrics.mjs\": \"domain\",\n    \"src/state/awaiting-context.mjs\": \"domain\",\n    \"src/state/cleanup-harness.mjs\": \"domain\",\n    \"src/state/cleanup-pool.mjs\": \"domain\",\n    \"src/state/discover-pool.mjs\": \"domain\",\n    \"src/state/plan-pool.mjs\": \"domain\",\n    \"src/state/retro-pool.mjs\": \"domain\",\n    \"src/state/retrospective-doors.mjs\": \"domain\",\n    \"src/state/worker-slots.mjs\": \"domain\",\n    \"src/intake/discovery.mjs\": \"use-case\",\n    \"src/intake/plan.mjs\": \"use-case\",\n    \"src/intake/plan-verdict-from-plan-md.mjs\": \"use-case\",\n    \"src/intake/verify-pattern-check.mjs\": \"kernel\",\n    \"src/cli/command-registry.mjs\": \"kernel\",\n    \"src/cli/deprecation.mjs\": \"kernel\",\n    \"src/cli/version.mjs\": \"kernel\",\n    \"src/cli/invocation-fault-log.mjs\": \"infra\",\n    \"src/cli/approve-fault-log.mjs\": \"infra\",\n    \"src/report/enduser-index.mjs\": \"domain\",\n    \"src/report/enduser-index-generate.mjs\": \"infra\",\n    \"src/report/decision-index.mjs\": \"infra\",\n    \"src/report/capability-plan-lint.mjs\": \"infra\",\n    \"src/report/context-render.mjs\": \"domain\",\n    \"src/report/frontmatter.mjs\": \"domain\",\n    \"src/report/authoritative-match.mjs\": \"domain\",\n    \"src/evolve/iron-law.mjs\": \"domain\",\n    \"src/state/events.mjs\": \"kernel\",\n    \"src/state/events-jsonl-truncation-guard.mjs\": \"kernel\",\n    \"src/state/main-checkout-guard-warnings.mjs\": \"kernel\",\n    \"src/state/work.mjs\": \"kernel\",\n    \"src/state/envelope.mjs\": \"kernel\",\n    \"src/intake/risk-keywords.mjs\": \"kernel\",\n    \"src/verbs/merge/merge.mjs\": \"use-case\",\n    \"src/verbs/merge/iron-law-level.mjs\": \"use-case\",\n    \"src/verbs/merge/approve.mjs\": \"use-case\",\n    \"src/verbs/merge/review.mjs\": \"use-case\",\n    \"src/verbs/merge/sync-root.mjs\": \"use-case\",\n    \"src/verbs/merge/catchup.mjs\": \"use-case\",\n    \"src/verbs/merge/reject.mjs\": \"use-case\",\n    \"src/verbs/merge/promote-to-component.mjs\": \"use-case\",\n    \"src/verbs/state/edit.mjs\": \"use-case\",\n    \"src/verbs/state/move.mjs\": \"use-case\",\n    \"src/verbs/state/read.mjs\": \"use-case\",\n    \"src/verbs/dispatch/show-run.mjs\": \"use-case\",\n    \"src/verbs/dispatch/inspect.mjs\": \"use-case\",\n    \"src/verbs/dispatch/reconcile.mjs\": \"use-case\",\n    \"src/verbs/dispatch/watch.mjs\": \"use-case\",\n    \"src/verbs/dispatch/recover.mjs\": \"use-case\",\n    \"src/report/item-trace.mjs\": \"domain\",\n    \"src/util/format-bytes.mjs\": \"kernel\",\n    \"src/util/format-duration.mjs\": \"kernel\",\n    \"src/util/normalize-path.mjs\": \"kernel\",\n    \"src/util/git-paths.mjs\": \"kernel\",\n    \"src/util/release-binary-path.mjs\": \"kernel\",\n    \"src/util/release-targets.mjs\": \"kernel\",\n    \"src/util/session-identity.mjs\": \"kernel\",\n    \"src/util/unique-tmp-tag.mjs\": \"kernel\",\n    \"src/util/host-bin.mjs\": \"infra\",\n    \"src/convention/convention-client.mjs\": \"infra\",\n    \"src/observe/friction-client.mjs\": \"infra\",\n    \"src/intake/classify.mjs\": \"use-case\",\n    \"src/setup/ansi.mjs\": \"domain\",\n    \"src/setup/config-merge.mjs\": \"domain\",\n    \"src/setup/shell-rc.mjs\": \"infra\",\n    \"src/setup/project-launcher.mjs\": \"infra\",\n    \"src/setup/bin-discovery.mjs\": \"infra\",\n    \"src/setup/skill-wrappers.mjs\": \"infra\",\n    \"src/setup/instruction-registry.mjs\": \"infra\",\n    \"src/setup/git-hooks.mjs\": \"infra\",\n    \"src/setup/claude-code-hooks.mjs\": \"infra\",\n    \"src/setup/agent-hooks.mjs\": \"infra\",\n    \"src/setup/agy-permissions.mjs\": \"infra\",\n    \"src/setup/agent-cli-trust.mjs\": \"infra\",\n    \"src/setup/blind-steps-proven-pools.mjs\": \"use-case\",\n    \"src/setup/workflow-pool-independence.mjs\": \"use-case\",\n    \"src/setup/checks.mjs\": \"use-case\",\n    \"src/setup/executor-profile-warnings.mjs\": \"infra\",\n    \"src/config/global-config.mjs\": \"infra\",\n    \"src/setup/registrations.mjs\": \"use-case\",\n    \"src/setup/executor-posture-coverage.mjs\": \"use-case\",\n    \"src/config/shared-config-file.mjs\": \"domain\",\n    \"src/state/knowledge-registry.mjs\": \"domain\",\n    \"src/report/knowledge-resolver.mjs\": \"domain\",\n    \"src/report/knowledge-projection.mjs\": \"domain\",\n    \"src/state/fgos-file-registry.mjs\": \"kernel\",\n    \"src/state/runtime-coordination.mjs\": \"infra\",\n    \"src/runner/dispatch/brief.mjs\": \"infra\",\n    \"src/runner/dispatch/dispatch-error.mjs\": \"infra\",\n    \"src/runner/dispatch/proof-helpers.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-agent.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-diagnosis.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-round.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-reconcile.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-artifacts.mjs\": \"infra\",\n    \"src/runner/dispatch/liveness.mjs\": \"infra\",\n    \"src/runner/dispatch/visibility-session.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/run-lock.mjs\": \"infra\",\n    \"src/runner/dispatch/process-identity.mjs\": \"infra\",\n    \"src/runner/dispatch/trust-store.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-home.mjs\": \"infra\",\n    \"src/runner/dispatch/stop-processes-inside.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session-boot.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery.mjs\": \"infra\",\n    \"src/setup/instruction-composition.mjs\": \"infra\",\n    \"src/setup/instruction-projections.mjs\": \"infra\",\n    \"src/runner/execution/unit.mjs\": \"infra\",\n    \"src/runner/execution/bind.mjs\": \"infra\",\n    \"src/runner/execution/account-pin.mjs\": \"infra\",\n    \"src/runner/execution/account-rotation.mjs\": \"infra\",\n    \"src/runner/execution/dry-bind.mjs\": \"infra\",\n    \"src/runner/execution/role-ledger.mjs\": \"infra\",\n    \"src/runner/execution/commit-unit-work.mjs\": \"infra\",\n    \"src/runner/execution/partial-writes.mjs\": \"infra\",\n    \"src/runner/execution/unit-sync.mjs\": \"infra\",\n    \"src/runner/execution/handoff-refs.mjs\": \"infra\",\n    \"src/runner/execution/unit-run-history.mjs\": \"infra\",\n    \"src/runner/execution/unit-summary.mjs\": \"infra\",\n    \"src/runner/execution/run.mjs\": \"use-case\",\n    \"src/runner/execution/patterns/index.mjs\": \"domain\",\n    \"src/runner/execution/patterns/panel.mjs\": \"domain\",\n    \"src/runner/execution/patterns/presets.mjs\": \"domain\",\n    \"src/runner/execution/patterns/reviewed.mjs\": \"domain\",\n    \"src/runner/execution/patterns/role-tasks.mjs\": \"domain\",\n    \"src/runner/execution/patterns/solo.mjs\": \"domain\",\n    \"src/workflow/definition.mjs\": \"kernel\",\n    \"src/workflow/dir-guard.mjs\": \"infra\",\n    \"src/workflow/loader.mjs\": \"infra\",\n    \"src/workflow/store.mjs\": \"infra\",\n    \"src/workflow/integrate.mjs\": \"infra\",\n    \"src/workflow/plan-source.mjs\": \"infra\",\n    \"src/workflow/units-source.mjs\": \"infra\",\n    \"src/workflow/runner.mjs\": \"use-case\",\n    \"src/workflow/index.mjs\": \"use-case\",\n    \"src/workflow/checked.mjs\": \"infra\",\n    \"src/workflow/ref-digests.mjs\": \"infra\",\n    \"src/workflow/seat-providers.mjs\": \"infra\",\n    \"src/workflow/seats.mjs\": \"infra\",\n    \"src/workflow/steps.mjs\": \"kernel\",\n    \"src/state/domain-registry.mjs\": \"kernel\",\n    \"src/state/step-fsm.mjs\": \"domain\",\n    \"src/verbs/state/step.mjs\": \"use-case\",\n    \"src/runner/operation-choice.mjs\": \"use-case\",\n    \"src/runner/work-dispatch.mjs\": \"use-case\"\n  }\n}"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_c872fffdb642fa2e566bf22e983430a5"
}
```

## Entry claim_2da535961368185b50c66310d03688c1

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_2da535961368185b50c66310d03688c1",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/governance.md",
    "unitDigest": "77af7760ec5eefec8efc493b10011c7fe92329ff417af467fdaebb05e22e8c5f",
    "identityFingerprint": "77af7760ec5eefec8efc493b10011c7fe92329ff417af467fdaebb05e22e8c5f",
    "claimId": "claim_2da535961368185b50c66310d03688c1",
    "sourceAnchor": "unheaded-block-60",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "32b40e383cb5cb41ff5b61f312d99116278ddac6728391109adbd1f7f891c4ba",
    "claimKind": "unclassified",
    "status": "future"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/governance.md",
    "unitDigest": "77af7760ec5eefec8efc493b10011c7fe92329ff417af467fdaebb05e22e8c5f",
    "identityFingerprint": "77af7760ec5eefec8efc493b10011c7fe92329ff417af467fdaebb05e22e8c5f",
    "claimId": "claim_2da535961368185b50c66310d03688c1",
    "sourceAnchor": "unheaded-block-60",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "32b40e383cb5cb41ff5b61f312d99116278ddac6728391109adbd1f7f891c4ba",
    "claimKind": "unclassified",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-60 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-60",
    "githubAnchor": "unheaded-block-60",
    "stableAnchor": "unheaded-block-60",
    "title": "Unheaded block 60",
    "startLine": 469,
    "endLine": 476,
    "textDigest": "32b40e383cb5cb41ff5b61f312d99116278ddac6728391109adbd1f7f891c4ba",
    "sample": "| Relationship | File |\n|---|---|\n| documentation portal | [README.md](documentation/operations/portals/docs-portal.md) |\n| reader routing | [reading-map.md](../reading-map.md) |\n|",
    "identityFingerprint": "77af7760ec5eefec8efc493b10011c7fe92329ff417af467fdaebb05e22e8c5f",
    "ancestry": [
      "Documentation Governance",
      "14. Related Files"
    ],
    "text": "| Relationship | File |\n|---|---|\n| documentation portal | [README.md](documentation/operations/portals/docs-portal.md) |\n| reader routing | [reading-map.md](../reading-map.md) |\n| operative transitional switchboard | [transitional-switchboard.md](documentation/switchboard.md) |\n| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |\n| platform portal | [platform/README.md](README.md) |\n| source design discussion | [architect/documentation-system-design.md](documentation/architecture/documentation-system-design.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_2da535961368185b50c66310d03688c1"
}
```

## Entry claim_fdb1ea31093ed42b3d4cff6279ff2200

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_fdb1ea31093ed42b3d4cff6279ff2200",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
    "unitDigest": "3a262841bd2a904dce59c4bcdf874e735bad8f3995854e32402efff34589ed58",
    "identityFingerprint": "3a262841bd2a904dce59c4bcdf874e735bad8f3995854e32402efff34589ed58",
    "claimId": "claim_fdb1ea31093ed42b3d4cff6279ff2200",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ab40fd9c0d594d2ce9571cbc3b00ff69ba65ab744ff1598327f276057e3dae4e",
    "claimKind": "architecture",
    "status": "future"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
    "unitDigest": "3a262841bd2a904dce59c4bcdf874e735bad8f3995854e32402efff34589ed58",
    "identityFingerprint": "3a262841bd2a904dce59c4bcdf874e735bad8f3995854e32402efff34589ed58",
    "claimId": "claim_fdb1ea31093ed42b3d4cff6279ff2200",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ab40fd9c0d594d2ce9571cbc3b00ff69ba65ab744ff1598327f276057e3dae4e",
    "claimKind": "architecture",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-4 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-4",
    "githubAnchor": "unheaded-block-4",
    "stableAnchor": "unheaded-block-4",
    "title": "Unheaded block 4",
    "startLine": 38,
    "endLine": 42,
    "textDigest": "ab40fd9c0d594d2ce9571cbc3b00ff69ba65ab744ff1598327f276057e3dae4e",
    "sample": "| Design claim | Implementation status | Evidence | Gap / next action |\n| --- | --- | --- | --- |\n| Remote peer is project-local gateway in R3. | `current partial` | Source: [old a",
    "identityFingerprint": "3a262841bd2a904dce59c4bcdf874e735bad8f3995854e32402efff34589ed58",
    "ancestry": [
      "Architecture: Host Use Cases",
      "3. Implementation Alignment"
    ],
    "text": "| Design claim | Implementation status | Evidence | Gap / next action |\n| --- | --- | --- | --- |\n| Remote peer is project-local gateway in R3. | `current partial` | Source: [old architecture §10](../spec.md#10-release-boundaries), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs) | Proven native gateway route for `distribution.build.show` in [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md); all other routes remain legacy `VerbGateway`. |\n| `GET /v1/runtime` (`distribution.build.show`) is the first remote-host-use-case proof for R3. | `implemented preview` | [R3 execution record](../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs) | Route wired and verified with no-VerbGateway / no-fgos.v1 proof. Remote host is now a proven peer for `distribution.build.show` only. |\n| Future shared multi-project gateway is separate. | `planned` | [Packaging future constraints](../../packaging-distribution/architecture/future-constraints.md) | Keep separate from R3 project-local gateway. |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_fdb1ea31093ed42b3d4cff6279ff2200"
}
```

## Entry claim_2bad0ad1ce9664e0e7983cd49e3e5692

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_2bad0ad1ce9664e0e7983cd49e3e5692",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
    "unitDigest": "cb2e0ab204022e0bd06e26535cd9dddd24ef06d0be9b0aa8e5297829438046fc",
    "identityFingerprint": "cb2e0ab204022e0bd06e26535cd9dddd24ef06d0be9b0aa8e5297829438046fc",
    "claimId": "claim_2bad0ad1ce9664e0e7983cd49e3e5692",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ac3e29e8d1365d5cbfb9eaea6b37edde94b318bb76363716f1264a5ec0bdb6b3",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/host-use-cases.md",
    "unitDigest": "cb2e0ab204022e0bd06e26535cd9dddd24ef06d0be9b0aa8e5297829438046fc",
    "identityFingerprint": "cb2e0ab204022e0bd06e26535cd9dddd24ef06d0be9b0aa8e5297829438046fc",
    "claimId": "claim_2bad0ad1ce9664e0e7983cd49e3e5692",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ac3e29e8d1365d5cbfb9eaea6b37edde94b318bb76363716f1264a5ec0bdb6b3",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-5 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 46,
    "endLine": 52,
    "textDigest": "ac3e29e8d1365d5cbfb9eaea6b37edde94b318bb76363716f1264a5ec0bdb6b3",
    "sample": "| Relationship | File |\n| --- | --- |\n| kernel | [invocation-kernel.md](invocation-kernel.md) |\n| R3 proof | [../verification/r3-remote-peer-proof.md](../verification/r3-remote-pee",
    "identityFingerprint": "cb2e0ab204022e0bd06e26535cd9dddd24ef06d0be9b0aa8e5297829438046fc",
    "ancestry": [
      "Architecture: Host Use Cases",
      "4. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| kernel | [invocation-kernel.md](invocation-kernel.md) |\n| R3 proof | [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) |\n| R3 execution record | [../../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md) |\n| packaging future constraint | [../../packaging-distribution/architecture/future-constraints.md](../../packaging-distribution/architecture/future-constraints.md) |\n| source architecture | [../spec.md](../spec.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_2bad0ad1ce9664e0e7983cd49e3e5692"
}
```

## Entry claim_a8f1775fb49967858d92dd1cd1fca40f

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_a8f1775fb49967858d92dd1cd1fca40f",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/invocation-kernel.md",
    "unitDigest": "fef2588777d0073f18fac2f54b8e612394bd8b4f1704deab854df73418f36ee3",
    "identityFingerprint": "fef2588777d0073f18fac2f54b8e612394bd8b4f1704deab854df73418f36ee3",
    "claimId": "claim_a8f1775fb49967858d92dd1cd1fca40f",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "8bf43f2751739c9e6c84a8beaf81169eff6d3057ff09eb1ddda8752550963bf7",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/invocation-kernel.md",
    "unitDigest": "fef2588777d0073f18fac2f54b8e612394bd8b4f1704deab854df73418f36ee3",
    "identityFingerprint": "fef2588777d0073f18fac2f54b8e612394bd8b4f1704deab854df73418f36ee3",
    "claimId": "claim_a8f1775fb49967858d92dd1cd1fca40f",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "8bf43f2751739c9e6c84a8beaf81169eff6d3057ff09eb1ddda8752550963bf7",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-6 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 50,
    "endLine": 55,
    "textDigest": "8bf43f2751739c9e6c84a8beaf81169eff6d3057ff09eb1ddda8752550963bf7",
    "sample": "| Relationship | File |\n| --- | --- |\n| operation request/outcome contract | [../contracts/operation-request-outcome.md](../contracts/operation-request-outcome.md) |\n| provider con",
    "identityFingerprint": "fef2588777d0073f18fac2f54b8e612394bd8b4f1704deab854df73418f36ee3",
    "ancestry": [
      "Architecture: Invocation Kernel",
      "4. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| operation request/outcome contract | [../contracts/operation-request-outcome.md](../contracts/operation-request-outcome.md) |\n| provider contract | [../contracts/operation-provider.md](../contracts/operation-provider.md) |\n| alignment | [../verification/implementation-alignment.md](../verification/implementation-alignment.md) |\n| source architecture | [../spec.md](../spec.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_a8f1775fb49967858d92dd1cd1fca40f"
}
```

## Entry claim_f206fa9f8c3bf5081d595ef5155b72e4

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_f206fa9f8c3bf5081d595ef5155b72e4",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "unitDigest": "22f410b216544acfdcbfda286199726be615b35446239b5eff5327e9d4043f16",
    "identityFingerprint": "22f410b216544acfdcbfda286199726be615b35446239b5eff5327e9d4043f16",
    "claimId": "claim_f206fa9f8c3bf5081d595ef5155b72e4",
    "sourceAnchor": "unheaded-block-18",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d91f9f6c059d67429bf1103a52a8d0ea676d9af650e1cf9ac324d967124b0902",
    "claimKind": "architecture",
    "status": "future"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "unitDigest": "22f410b216544acfdcbfda286199726be615b35446239b5eff5327e9d4043f16",
    "identityFingerprint": "22f410b216544acfdcbfda286199726be615b35446239b5eff5327e9d4043f16",
    "claimId": "claim_f206fa9f8c3bf5081d595ef5155b72e4",
    "sourceAnchor": "unheaded-block-18",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d91f9f6c059d67429bf1103a52a8d0ea676d9af650e1cf9ac324d967124b0902",
    "claimKind": "architecture",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-18 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-18",
    "githubAnchor": "unheaded-block-18",
    "stableAnchor": "unheaded-block-18",
    "title": "Unheaded block 18",
    "startLine": 104,
    "endLine": 104,
    "textDigest": "d91f9f6c059d67429bf1103a52a8d0ea676d9af650e1cf9ac324d967124b0902",
    "sample": "**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../s",
    "identityFingerprint": "22f410b216544acfdcbfda286199726be615b35446239b5eff5327e9d4043f16",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition",
      "2. Legacy Payload Identity, Ownership, And Repair Path"
    ],
    "text": "**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../../component-boundary.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as \"legacy\"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f206fa9f8c3bf5081d595ef5155b72e4"
}
```

## Entry claim_c3cd683f77abf73b41cd260c9cab135f

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_c3cd683f77abf73b41cd260c9cab135f",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "unitDigest": "ae09f34580618de1199f438df08f488b043dbc56628d7e21a54f221d6fc2858a",
    "identityFingerprint": "ae09f34580618de1199f438df08f488b043dbc56628d7e21a54f221d6fc2858a",
    "claimId": "claim_c3cd683f77abf73b41cd260c9cab135f",
    "sourceAnchor": "unheaded-block-19",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "de0ae19bed33fc5dd3ea48d0be145d8c50690bdb1529055b40c1bd0ae22ca06f",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "unitDigest": "ae09f34580618de1199f438df08f488b043dbc56628d7e21a54f221d6fc2858a",
    "identityFingerprint": "ae09f34580618de1199f438df08f488b043dbc56628d7e21a54f221d6fc2858a",
    "claimId": "claim_c3cd683f77abf73b41cd260c9cab135f",
    "sourceAnchor": "unheaded-block-19",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "de0ae19bed33fc5dd3ea48d0be145d8c50690bdb1529055b40c1bd0ae22ca06f",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-19 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-19",
    "githubAnchor": "unheaded-block-19",
    "stableAnchor": "unheaded-block-19",
    "title": "Unheaded block 19",
    "startLine": 106,
    "endLine": 106,
    "textDigest": "de0ae19bed33fc5dd3ea48d0be145d8c50690bdb1529055b40c1bd0ae22ca06f",
    "sample": "The public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read fr",
    "identityFingerprint": "ae09f34580618de1199f438df08f488b043dbc56628d7e21a54f221d6fc2858a",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition",
      "2. Legacy Payload Identity, Ownership, And Repair Path"
    ],
    "text": "The public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"`; a staged release declares `root: \"libexec/legacy-node\"`, `entries.fgos: \"bin/fgos\"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../../packaging-distribution/architecture/runtime-identity-and-activation.md) §5)."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_c3cd683f77abf73b41cd260c9cab135f"
}
```

## Entry claim_360bb370fc4e26546be2b68c84acb0d1

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_360bb370fc4e26546be2b68c84acb0d1",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "unitDigest": "9359bbb33a15fa92c990c31d4d549409ed208382951f057209f0d1496353a0d2",
    "identityFingerprint": "9359bbb33a15fa92c990c31d4d549409ed208382951f057209f0d1496353a0d2",
    "claimId": "claim_360bb370fc4e26546be2b68c84acb0d1",
    "sourceAnchor": "unheaded-block-37",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "cf294a957ee6cdf9b75f573e8796e10c7c55af7e0410888ae82824005a3f6a3e",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md",
    "unitDigest": "9359bbb33a15fa92c990c31d4d549409ed208382951f057209f0d1496353a0d2",
    "identityFingerprint": "9359bbb33a15fa92c990c31d4d549409ed208382951f057209f0d1496353a0d2",
    "claimId": "claim_360bb370fc4e26546be2b68c84acb0d1",
    "sourceAnchor": "unheaded-block-37",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "cf294a957ee6cdf9b75f573e8796e10c7c55af7e0410888ae82824005a3f6a3e",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-37 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-37",
    "githubAnchor": "unheaded-block-37",
    "stableAnchor": "unheaded-block-37",
    "title": "Unheaded block 37",
    "startLine": 162,
    "endLine": 164,
    "textDigest": "cf294a957ee6cdf9b75f573e8796e10c7c55af7e0410888ae82824005a3f6a3e",
    "sample": "- [Host Invocation And Provider Routing](../spec.md) — kernel contract this document depends on.\n- [External Provider Protocol](external-provider-protocol.md)\n- [Runtime Identity A",
    "identityFingerprint": "9359bbb33a15fa92c990c31d4d549409ed208382951f057209f0d1496353a0d2",
    "ancestry": [
      "Architecture: Legacy CLI Transition",
      "Retained selected source material",
      "Legacy CLI Transition",
      "Related Documents"
    ],
    "text": "- [Host Invocation And Provider Routing](../spec.md) — kernel contract this document depends on.\n- [External Provider Protocol](external-provider-protocol.md)\n- [Runtime Identity And Activation](../../packaging-distribution/architecture/runtime-identity-and-activation.md) — owns the legacy payload's actual on-disk location, `fgctl` rollback mechanics, and the `fgos init` / `fgos doctor --fix` / `fgos doctor` tail that supersedes deprecated legacy `fgos setup` onboarding behavior."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_360bb370fc4e26546be2b68c84acb0d1"
}
```

## Entry claim_443410e9def131c10f1a69e9997a8082

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_443410e9def131c10f1a69e9997a8082",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "unitDigest": "97295fc8d8292f8635d08c9ef65c34e6161774c07053eea54b1ea21a70031e9b",
    "identityFingerprint": "97295fc8d8292f8635d08c9ef65c34e6161774c07053eea54b1ea21a70031e9b",
    "claimId": "claim_443410e9def131c10f1a69e9997a8082",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "063f9e46c05f12820a1ea62b8ff0d3f2ab4024b19162a2f9e09e4f7186c83ffb",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md",
    "unitDigest": "97295fc8d8292f8635d08c9ef65c34e6161774c07053eea54b1ea21a70031e9b",
    "identityFingerprint": "97295fc8d8292f8635d08c9ef65c34e6161774c07053eea54b1ea21a70031e9b",
    "claimId": "claim_443410e9def131c10f1a69e9997a8082",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "063f9e46c05f12820a1ea62b8ff0d3f2ab4024b19162a2f9e09e4f7186c83ffb",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-5 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 43,
    "endLine": 48,
    "textDigest": "063f9e46c05f12820a1ea62b8ff0d3f2ab4024b19162a2f9e09e4f7186c83ffb",
    "sample": "| Design claim | Implementation status | Evidence | Gap / next action |\n| --- | --- | --- | --- |\n| Rust host first is selected. | `implemented preview` | [source migration §2](../",
    "identityFingerprint": "97295fc8d8292f8635d08c9ef65c34e6161774c07053eea54b1ea21a70031e9b",
    "ancestry": [
      "Architecture: Node To Rust Migration",
      "4. Implementation Alignment"
    ],
    "text": "| Design claim | Implementation status | Evidence | Gap / next action |\n| --- | --- | --- | --- |\n| Rust host first is selected. | `implemented preview` | [source migration §2](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs) | Preview Rust host exists and is the installed/default preview entry. Stable/default graduation remains a release-owner decision. |\n| Read models before writers. | `current partial` | [source migration §10](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | `version`, `gate-bypass`, and remote `/runtime` are read proofs. Future read routes should migrate before writes. |\n| Writer migration has atomicity/replay/mutual-exclusion gates. | `planned` | [source migration §11](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components) | Future writer proof. |\n| Observe is first component fully in Rust. | `implemented complete` | [Observe Spec](../../observe/spec.md), [packages/observe/rust](../../../../packages/observe/rust), [plans/260929-1501-metrics-friction-rust-native](../../../../archive/plans/260929-1501-metrics-friction-rust-native/plan.md) | Observe migrated completely into Rust native without Node fallback; covers metrics and friction writers with native routing and writer shards. |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_443410e9def131c10f1a69e9997a8082"
}
```

## Entry claim_a32c3bb82db11c8463cad25486c4a3fd

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_a32c3bb82db11c8463cad25486c4a3fd",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/provider-routing.md",
    "unitDigest": "0a51034c468de482c9610b5175f6e4579c74bfce8b136551eaa8c0c3bb2dcdbd",
    "identityFingerprint": "0a51034c468de482c9610b5175f6e4579c74bfce8b136551eaa8c0c3bb2dcdbd",
    "claimId": "claim_a32c3bb82db11c8463cad25486c4a3fd",
    "sourceAnchor": "unheaded-block-8",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "8035f87193fb92bb30fbff34694b8b9b8bbdaec736fae6f8d77d74123047565c",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/provider-routing.md",
    "unitDigest": "0a51034c468de482c9610b5175f6e4579c74bfce8b136551eaa8c0c3bb2dcdbd",
    "identityFingerprint": "0a51034c468de482c9610b5175f6e4579c74bfce8b136551eaa8c0c3bb2dcdbd",
    "claimId": "claim_a32c3bb82db11c8463cad25486c4a3fd",
    "sourceAnchor": "unheaded-block-8",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "8035f87193fb92bb30fbff34694b8b9b8bbdaec736fae6f8d77d74123047565c",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-8 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-8",
    "githubAnchor": "unheaded-block-8",
    "stableAnchor": "unheaded-block-8",
    "title": "Unheaded block 8",
    "startLine": 56,
    "endLine": 61,
    "textDigest": "8035f87193fb92bb30fbff34694b8b9b8bbdaec736fae6f8d77d74123047565c",
    "sample": "| Relationship | File |\n| --- | --- |\n| operation catalog | [../contracts/operation-catalog.md](../contracts/operation-catalog.md) |\n| provider contract | [../contracts/operation-p",
    "identityFingerprint": "0a51034c468de482c9610b5175f6e4579c74bfce8b136551eaa8c0c3bb2dcdbd",
    "ancestry": [
      "Architecture: Provider Routing",
      "5. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| operation catalog | [../contracts/operation-catalog.md](../contracts/operation-catalog.md) |\n| provider contract | [../contracts/operation-provider.md](../contracts/operation-provider.md) |\n| manifest contract | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |\n| source architecture | [../spec.md](../spec.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_a32c3bb82db11c8463cad25486c4a3fd"
}
```

## Entry claim_9ffe001756c0e59f1eef5ad578790b3b

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_9ffe001756c0e59f1eef5ad578790b3b",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "unitDigest": "33eec7e9eacf0c3c0befa80e79393307b67d45e56c477e5cfad2c2130dfdae64",
    "identityFingerprint": "33eec7e9eacf0c3c0befa80e79393307b67d45e56c477e5cfad2c2130dfdae64",
    "claimId": "claim_9ffe001756c0e59f1eef5ad578790b3b",
    "sourceAnchor": "unheaded-block-31",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c6c900b0f9efb8bad264810f447e496a46d6daee410476f186fa6eaa91d46c1f",
    "claimKind": "architecture",
    "status": "future"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "unitDigest": "33eec7e9eacf0c3c0befa80e79393307b67d45e56c477e5cfad2c2130dfdae64",
    "identityFingerprint": "33eec7e9eacf0c3c0befa80e79393307b67d45e56c477e5cfad2c2130dfdae64",
    "claimId": "claim_9ffe001756c0e59f1eef5ad578790b3b",
    "sourceAnchor": "unheaded-block-31",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c6c900b0f9efb8bad264810f447e496a46d6daee410476f186fa6eaa91d46c1f",
    "claimKind": "architecture",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-31 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-31",
    "githubAnchor": "unheaded-block-31",
    "stableAnchor": "unheaded-block-31",
    "title": "Unheaded block 31",
    "startLine": 189,
    "endLine": 189,
    "textDigest": "c6c900b0f9efb8bad264810f447e496a46d6daee410476f186fa6eaa91d46c1f",
    "sample": "Added in candidate — source-relative link destinations: the literal restored excerpts retain their original link bytes. `./host-invocation-provider-routing.md` maps to [the area sp",
    "identityFingerprint": "33eec7e9eacf0c3c0befa80e79393307b67d45e56c477e5cfad2c2130dfdae64",
    "ancestry": [
      "Architecture: Release Boundaries",
      "Source-relative Navigation Mappings"
    ],
    "text": "Added in candidate — source-relative link destinations: the literal restored excerpts retain their original link bytes. `./host-invocation-provider-routing.md` maps to [the area spec](../spec.md); `./rust-cli-and-proof-components-plan.md` maps to [the area roadmap](../roadmap.md); `../component-boundary/component-boundary-advisory.md` maps to [the retained component-boundary advisory](../../component-boundary.md). These are navigation mappings, not revised restored text."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_9ffe001756c0e59f1eef5ad578790b3b"
}
```

## Entry claim_93faf4c0d7d6cc10c3f3b0f9ed7ccce9

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_93faf4c0d7d6cc10c3f3b0f9ed7ccce9",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "unitDigest": "be2cfe0c9ab25d7d08a28452fbbc5c91697ee11f638786c12f1a1770c55128b2",
    "identityFingerprint": "be2cfe0c9ab25d7d08a28452fbbc5c91697ee11f638786c12f1a1770c55128b2",
    "claimId": "claim_93faf4c0d7d6cc10c3f3b0f9ed7ccce9",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b0865debd72f04af5ac8d2a5520ae051128229ec04dd669f9f7da8e5c759b917",
    "claimKind": "architecture",
    "status": "future"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "unitDigest": "be2cfe0c9ab25d7d08a28452fbbc5c91697ee11f638786c12f1a1770c55128b2",
    "identityFingerprint": "be2cfe0c9ab25d7d08a28452fbbc5c91697ee11f638786c12f1a1770c55128b2",
    "claimId": "claim_93faf4c0d7d6cc10c3f3b0f9ed7ccce9",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b0865debd72f04af5ac8d2a5520ae051128229ec04dd669f9f7da8e5c759b917",
    "claimKind": "architecture",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-5 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 45,
    "endLine": 50,
    "textDigest": "b0865debd72f04af5ac8d2a5520ae051128229ec04dd669f9f7da8e5c759b917",
    "sample": "| Design claim | Implementation status | Evidence | Gap / next action |\n| --- | --- | --- | --- |\n| R1 Rust host code path exists. | `implemented preview` | [../../../../apps/fgos/",
    "identityFingerprint": "be2cfe0c9ab25d7d08a28452fbbc5c91697ee11f638786c12f1a1770c55128b2",
    "ancestry": [
      "Architecture: Release Boundaries",
      "3. Implementation Alignment"
    ],
    "text": "| Design claim | Implementation status | Evidence | Gap / next action |\n| --- | --- | --- | --- |\n| R1 Rust host code path exists. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../packages/host-runtime/rust/src/lib.rs](../../../../packages/host-runtime/rust/src/lib.rs), [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Route migration remains partial: 70 selectors still use the manifest-owned legacy CLI lane. |\n| R1 is a shipped host only with reproducible install/activation/rollback proof. | `implemented preview` | [source plan §18](../roadmap.md#18-definition-of-done), [../../packaging-distribution/reports/track-closeout.md](../../packaging-distribution/reports/track-closeout.md), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md), release `v0.1.0` workflow `35317876419`, post-release CI/external-consumer proof `35498322149` | Stable/default release graduation remains a release-owner decision. |\n| R2 and R3 do not delay R1 installed-entry flip. | `confirmed` | [source plan §1](../roadmap.md#1-outcome), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md)#6, [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | Every R2 merge re-ran and passed the full R1 proof (`cargo test -p fgos-host-runtime -p fgos --quiet`, `node --test test/rust-host/command-routes.test.mjs`) with `apps/fgos` composition-root wiring untouched. R3 is a separate implemented-preview gateway peer proof for `GET /v1/runtime`; it does not change the R1 installed-entry flip. |\n| `fgctl` owns rollback; runtime provider selection does not. | `implemented preview` | [packaging runtime activation](../../packaging-distribution/architecture/runtime-identity-and-activation.md), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md) | Preview install/activation/repair proof is recorded. Stable/default graduation remains a release-owner decision. |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_93faf4c0d7d6cc10c3f3b0f9ed7ccce9"
}
```

## Entry claim_0f3bc9c4c33361028f0e9674a322713e

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_0f3bc9c4c33361028f0e9674a322713e",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "unitDigest": "4bb8492f379a4443e367c812ff3149a95b579f40be737337c6dd35a3db531fd8",
    "identityFingerprint": "4bb8492f379a4443e367c812ff3149a95b579f40be737337c6dd35a3db531fd8",
    "claimId": "claim_0f3bc9c4c33361028f0e9674a322713e",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b0f143d73e1271ebd26c17222ff6cc3943f528347e22beec468312107195ce0b",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/release-boundaries.md",
    "unitDigest": "4bb8492f379a4443e367c812ff3149a95b579f40be737337c6dd35a3db531fd8",
    "identityFingerprint": "4bb8492f379a4443e367c812ff3149a95b579f40be737337c6dd35a3db531fd8",
    "claimId": "claim_0f3bc9c4c33361028f0e9674a322713e",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b0f143d73e1271ebd26c17222ff6cc3943f528347e22beec468312107195ce0b",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-6 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 54,
    "endLine": 60,
    "textDigest": "b0f143d73e1271ebd26c17222ff6cc3943f528347e22beec468312107195ce0b",
    "sample": "| Relationship | File |\n| --- | --- |\n| R1 proof | [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) |\n| R2 proof | [../verification/r2-external-proces",
    "identityFingerprint": "4bb8492f379a4443e367c812ff3149a95b579f40be737337c6dd35a3db531fd8",
    "ancestry": [
      "Architecture: Release Boundaries",
      "4. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| R1 proof | [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) |\n| R2 proof | [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) |\n| R3 proof | [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) |\n| compatibility harness | [../verification/compatibility-harness.md](../verification/compatibility-harness.md) |\n| source plan | [../roadmap.md](../roadmap.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_0f3bc9c4c33361028f0e9674a322713e"
}
```

## Entry claim_705af68b7d3c02741779d17760ad9db4

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_705af68b7d3c02741779d17760ad9db4",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/contracts/component-protocol.md",
    "unitDigest": "1b442f65404afcecb90288eb6dfd472d6f308ac302635600364c718ddccdb0f1",
    "identityFingerprint": "1b442f65404afcecb90288eb6dfd472d6f308ac302635600364c718ddccdb0f1",
    "claimId": "claim_705af68b7d3c02741779d17760ad9db4",
    "sourceAnchor": "unheaded-block-68",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "1d34acfc2b48e89fabc8f312e6a30cdd6d7bb1a6b2b8e2db262338e18ac3e2e9",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/contracts/component-protocol.md",
    "unitDigest": "1b442f65404afcecb90288eb6dfd472d6f308ac302635600364c718ddccdb0f1",
    "identityFingerprint": "1b442f65404afcecb90288eb6dfd472d6f308ac302635600364c718ddccdb0f1",
    "claimId": "claim_705af68b7d3c02741779d17760ad9db4",
    "sourceAnchor": "unheaded-block-68",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "1d34acfc2b48e89fabc8f312e6a30cdd6d7bb1a6b2b8e2db262338e18ac3e2e9",
    "claimKind": "contract",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-68 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-68",
    "githubAnchor": "unheaded-block-68",
    "stableAnchor": "unheaded-block-68",
    "title": "Unheaded block 68",
    "startLine": 326,
    "endLine": 326,
    "textDigest": "1d34acfc2b48e89fabc8f312e6a30cdd6d7bb1a6b2b8e2db262338e18ac3e2e9",
    "sample": "Added in candidate — source-relative link destination: the literal restored excerpt retains `../component-boundary/component-boundary-advisory.md`; its live destination is [the ret",
    "identityFingerprint": "1b442f65404afcecb90288eb6dfd472d6f308ac302635600364c718ddccdb0f1",
    "ancestry": [
      "Contract: Component Protocol",
      "Source-relative Navigation Mappings"
    ],
    "text": "Added in candidate — source-relative link destination: the literal restored excerpt retains `../component-boundary/component-boundary-advisory.md`; its live destination is [the retained component-boundary advisory](../../component-boundary.md). This navigation mapping does not revise the restored text."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_705af68b7d3c02741779d17760ad9db4"
}
```

## Entry claim_4cf68c86ff785dce2e4f2ab178de22cf

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_4cf68c86ff785dce2e4f2ab178de22cf",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
    "unitDigest": "cdd2d6fd351fd34cc2d157caefcd1dc47a4a5db8f84bbb5851e3d7edbf63653c",
    "identityFingerprint": "cdd2d6fd351fd34cc2d157caefcd1dc47a4a5db8f84bbb5851e3d7edbf63653c",
    "claimId": "claim_4cf68c86ff785dce2e4f2ab178de22cf",
    "sourceAnchor": "unheaded-block-9",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "5e23582a2807469c3d902d79e0208a1ad6790e2105f9194805e6d170c8ea2339",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/contracts/legacy-payload.md",
    "unitDigest": "cdd2d6fd351fd34cc2d157caefcd1dc47a4a5db8f84bbb5851e3d7edbf63653c",
    "identityFingerprint": "cdd2d6fd351fd34cc2d157caefcd1dc47a4a5db8f84bbb5851e3d7edbf63653c",
    "claimId": "claim_4cf68c86ff785dce2e4f2ab178de22cf",
    "sourceAnchor": "unheaded-block-9",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "5e23582a2807469c3d902d79e0208a1ad6790e2105f9194805e6d170c8ea2339",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-9 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-9",
    "githubAnchor": "unheaded-block-9",
    "stableAnchor": "unheaded-block-9",
    "title": "Unheaded block 9",
    "startLine": 55,
    "endLine": 60,
    "textDigest": "5e23582a2807469c3d902d79e0208a1ad6790e2105f9194805e6d170c8ea2339",
    "sample": "| Relationship | File |\n| --- | --- |\n| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |\n| command route descriptor | [com",
    "identityFingerprint": "cdd2d6fd351fd34cc2d157caefcd1dc47a4a5db8f84bbb5851e3d7edbf63653c",
    "ancestry": [
      "Contract: Legacy Payload",
      "5. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |\n| command route descriptor | [command-route-descriptor.md](command-route-descriptor.md) |\n| release manifest | [../../packaging-distribution/contracts/release-manifest.md](../../packaging-distribution/contracts/release-manifest.md) |\n| source transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_4cf68c86ff785dce2e4f2ab178de22cf"
}
```

## Entry claim_02ed19162d09c0e4779b58ca1ef854b7

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_02ed19162d09c0e4779b58ca1ef854b7",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/contracts/operation-catalog.md",
    "unitDigest": "2e6459d234a5b8ea2be431fc47b02d17bbb24a65551aecd02deef092953ab23c",
    "identityFingerprint": "2e6459d234a5b8ea2be431fc47b02d17bbb24a65551aecd02deef092953ab23c",
    "claimId": "claim_02ed19162d09c0e4779b58ca1ef854b7",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b436d1cf2bcabf2ba330ac17a1b38806a48d35a5c114e83710fa105eca1cf6c7",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/contracts/operation-catalog.md",
    "unitDigest": "2e6459d234a5b8ea2be431fc47b02d17bbb24a65551aecd02deef092953ab23c",
    "identityFingerprint": "2e6459d234a5b8ea2be431fc47b02d17bbb24a65551aecd02deef092953ab23c",
    "claimId": "claim_02ed19162d09c0e4779b58ca1ef854b7",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b436d1cf2bcabf2ba330ac17a1b38806a48d35a5c114e83710fa105eca1cf6c7",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-6 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 41,
    "endLine": 45,
    "textDigest": "b436d1cf2bcabf2ba330ac17a1b38806a48d35a5c114e83710fa105eca1cf6c7",
    "sample": "| Relationship | File |\n| --- | --- |\n| provider routing | [../architecture/provider-routing.md](../architecture/provider-routing.md) |\n| operation provider | [operation-provider.m",
    "identityFingerprint": "2e6459d234a5b8ea2be431fc47b02d17bbb24a65551aecd02deef092953ab23c",
    "ancestry": [
      "Contract: Operation Catalog",
      "3. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| provider routing | [../architecture/provider-routing.md](../architecture/provider-routing.md) |\n| operation provider | [operation-provider.md](operation-provider.md) |\n| source architecture | [../spec.md](../spec.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_02ed19162d09c0e4779b58ca1ef854b7"
}
```

## Entry claim_d54fdc9d84fbe2f063ab7a566ff0e184

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_d54fdc9d84fbe2f063ab7a566ff0e184",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/contracts/operation-request-outcome.md",
    "unitDigest": "ff102b15c981ad1bcfb7e5e71a499230c63c35f329d005d94a9a760ad67d01be",
    "identityFingerprint": "ff102b15c981ad1bcfb7e5e71a499230c63c35f329d005d94a9a760ad67d01be",
    "claimId": "claim_d54fdc9d84fbe2f063ab7a566ff0e184",
    "sourceAnchor": "unheaded-block-9",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "af77d507a61079a3b8762e2689cb6acab0b3793128e5534a52b8ae9fefeeb584",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/contracts/operation-request-outcome.md",
    "unitDigest": "ff102b15c981ad1bcfb7e5e71a499230c63c35f329d005d94a9a760ad67d01be",
    "identityFingerprint": "ff102b15c981ad1bcfb7e5e71a499230c63c35f329d005d94a9a760ad67d01be",
    "claimId": "claim_d54fdc9d84fbe2f063ab7a566ff0e184",
    "sourceAnchor": "unheaded-block-9",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "af77d507a61079a3b8762e2689cb6acab0b3793128e5534a52b8ae9fefeeb584",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-9 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-9",
    "githubAnchor": "unheaded-block-9",
    "stableAnchor": "unheaded-block-9",
    "title": "Unheaded block 9",
    "startLine": 53,
    "endLine": 57,
    "textDigest": "af77d507a61079a3b8762e2689cb6acab0b3793128e5534a52b8ae9fefeeb584",
    "sample": "| Relationship | File |\n| --- | --- |\n| kernel architecture | [../architecture/invocation-kernel.md](../architecture/invocation-kernel.md) |\n| component protocol | [component-proto",
    "identityFingerprint": "ff102b15c981ad1bcfb7e5e71a499230c63c35f329d005d94a9a760ad67d01be",
    "ancestry": [
      "Contract: Operation Request And Outcome",
      "6. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| kernel architecture | [../architecture/invocation-kernel.md](../architecture/invocation-kernel.md) |\n| component protocol | [component-protocol.md](component-protocol.md) |\n| source architecture | [../spec.md](../spec.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_d54fdc9d84fbe2f063ab7a566ff0e184"
}
```

## Entry claim_a610c38b692fbf239557c30e8f966ad3

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_a610c38b692fbf239557c30e8f966ad3",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
    "unitDigest": "ef7f73d711279adfd343cc5a43c89d6e0674fab4307ba947f9749960afed2a37",
    "identityFingerprint": "ef7f73d711279adfd343cc5a43c89d6e0674fab4307ba947f9749960afed2a37",
    "claimId": "claim_a610c38b692fbf239557c30e8f966ad3",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7bb9699f5eedbae17682a9822f73c7c2844fc634854337e1a0c62269c0854a0e",
    "claimKind": "intent",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/intent-preservation-ledger.md",
    "unitDigest": "ef7f73d711279adfd343cc5a43c89d6e0674fab4307ba947f9749960afed2a37",
    "identityFingerprint": "ef7f73d711279adfd343cc5a43c89d6e0674fab4307ba947f9749960afed2a37",
    "claimId": "claim_a610c38b692fbf239557c30e8f966ad3",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7bb9699f5eedbae17682a9822f73c7c2844fc634854337e1a0c62269c0854a0e",
    "claimKind": "intent",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-6 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 61,
    "endLine": 100,
    "textDigest": "7bb9699f5eedbae17682a9822f73c7c2844fc634854337e1a0c62269c0854a0e",
    "sample": "| ID | Claim / intent | Source | Status | Disposition | Target doc | Must not lose | Proof / gap |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| HI-I001 | The area name is Ho",
    "identityFingerprint": "ef7f73d711279adfd343cc5a43c89d6e0674fab4307ba947f9749960afed2a37",
    "ancestry": [
      "Host Invocation Intent Preservation Ledger",
      "4. Preserved Intentions"
    ],
    "text": "| ID | Claim / intent | Source | Status | Disposition | Target doc | Must not lose | Proof / gap |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| HI-I001 | The area name is Host Invocation And Provider Routing, centered on the Operation Provider Router; avoid `Component Router` and `Command Router`. | [host-invocation-provider-routing.md](spec.md#1-architecture-name) | `accepted-not-implemented` | `promote` | [README.md](README.md), [architecture/provider-routing.md](architecture/provider-routing.md) | Commands are only CLI projections; not every component is dispatchable. | Needs implementation proof for actual router naming. |\n| HI-I002 | Host invocation and provider routing are separate responsibilities: host normalizes/admits; router selects implementation. | [host-invocation-provider-routing.md](spec.md#1-architecture-name) | `current partial` | `split` | [vision.md](vision.md), [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Do not collapse parsing, admission, selection, and provider invocation into one CLI path. | Rust kernel proof exists for current built-in routes, R2 external-provider route, and R3 remote peer route; broader component migration remains partial. |\n| HI-I003 | CLI, remote, and chat are peer host use cases; none shells through or wraps another after migration. | [host-invocation-provider-routing.md](spec.md#4-peer-host-use-cases) | `current partial` | `promote` | [architecture/host-use-cases.md](architecture/host-use-cases.md) | Peer status does not require one OS process; hosts may compose the same runtime crate. | CLI and remote peer proof exist for selected operations; chat remains future. |\n| HI-I004 | The legacy CLI lane is the only non-`OperationRequest`/`ProviderOutcome` path and never enters `InvocationService` or Router. | [host-invocation-provider-routing.md](spec.md#4-peer-host-use-cases), [legacy-cli-transition.md](architecture/legacy-cli-transition.md#1-two-distinct-adapters) | `current partial` with `legacy-current` payload behavior | `promote` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Direct Node exec preserves argv/stdin/cwd/env/signals and writes one invocation record without semantic wrapping. | Preview proof exists for the manifest-owned legacy CLI lane; full compatibility vectors remain future cleanup. |\n| HI-I005 | Canonical kernel terms include `OperationId`, `HostInvocation`, `OperationRequest`, `ContractRef`, `ProviderOutcome`, `ProviderError`, `OperationProvider`, `ProviderDescriptor`, `OperationDescriptor`, `OperationCatalog`, `RegistrySnapshot`, Router, `InvocationService`, `InvocationControl`, `EventSink`, `CommandRouteDescriptor`, and `ConfigPort`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#3-canonical-names) | `accepted-not-implemented` | `split` | [contracts/operation-catalog.md](contracts/operation-catalog.md), [contracts/operation-provider.md](contracts/operation-provider.md), [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md) | One canonical name per concept; no alias drift. | Contract implementation unknown until Rust types exist. |\n| HI-I006 | `OperationId` is stable semantic identity independent of CLI/REST/MCP/chat spelling. | [host-invocation-provider-routing.md](spec.md#5-core-contracts) | `accepted-not-implemented` | `promote` | [contracts/operation-catalog.md](contracts/operation-catalog.md) | Format `<component>.<object-type>.<action>[.<variant>]`; hosts own projection. | First descriptors remain open. |\n| HI-I007 | Built-in providers use typed Rust representation; `EncodedMessage` exists only at external process/WASM boundary. | [host-invocation-provider-routing.md](spec.md#5-core-contracts), [external-provider-protocol.md](architecture/external-provider-protocol.md#3-component-protocol) | `implemented preview` | `split` | [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [contracts/component-protocol.md](contracts/component-protocol.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Raw `OsString` is never semantic request; built-ins never decode bytes. | Built-in Rust routes prove typed provider flow; R2 proves `EncodedMessage` stays private to the external process adapter boundary. |\n| HI-I008 | `OperationCatalog` is authored by owning components; CLI registry or provider manifest cannot create an operation. | [host-invocation-provider-routing.md](spec.md#5-core-contracts) | `current partial` | `promote` | [contracts/operation-catalog.md](contracts/operation-catalog.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | R1 uses const catalog/snapshot at composition root; no linker/cache/manifest scan in R1. | Current built-in catalog proof exists; R2 proves external manifests cannot claim reserved core operations and only add through the external provider linker path. |\n| HI-I009 | Router is pure selection; `InvocationService` owns admit, select, grant, invoke, normalize, and record. | [host-invocation-provider-routing.md](spec.md#6-router-pure-and-invocationservice-pipeline) | `current partial` | `promote` | [architecture/provider-routing.md](architecture/provider-routing.md), [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Router has no I/O, async, invocation, failure normalization, reporting, or host parsing. | Current Rust slice plus R2 external process proof use the same router/InvocationService path; replacement resolution remains partial. |\n| HI-I010 | Authority has two stages: caller admission before routing and selected-provider grant after routing. | [host-invocation-provider-routing.md](spec.md#7-authority-two-stage) | `current partial` | `promote` | [architecture/provider-routing.md](architecture/provider-routing.md), [contracts/operation-provider.md](contracts/operation-provider.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Provider manifest is never authority; selected grant is least privilege. | Current authority-gate proof exists; R2 negative tests cover external manifest/linker refusal and same-pipeline provider grants. |\n| HI-I011 | Configuration can never replace a built-in provider; rollback is via `fgctl` release rollback, not provider-selection swap. | [host-invocation-provider-routing.md](spec.md#7-authority-two-stage), [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#13-rollback-rules) | `current partial` | `split` | [architecture/provider-routing.md](architecture/provider-routing.md), [architecture/release-boundaries.md](architecture/release-boundaries.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | Replacement policy only governs explicit external/plugin surface. | Preview `fgctl` proof exists; stable/default graduation remains a release-owner decision, while fallback removal follows the 30-day preview window. |\n| HI-I012 | Failure families are closed and host presenters map them to their own public contracts. | [host-invocation-provider-routing.md](spec.md#8-failure-cancellation-lifecycle-and-human-input) | `current partial` | `split` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [verification/implementation-alignment.md](verification/implementation-alignment.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Provider crash is not semantic failure; partial output does not imply success. | Built-in provider errors and R2 external process crash/timeout/cancellation mapping are covered for preview; future routes/providers must keep the closed-family mapping. |\n| HI-I013 | Exactly one terminal lifecycle record is emitted; late response after cancellation/deadline is diagnostic evidence, not second truth. | [host-invocation-provider-routing.md](spec.md#8-failure-cancellation-lifecycle-and-human-input) | `accepted-not-implemented` | `promote` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) | Records carry ids, contracts, registry fingerprint, provider id, host kind, timing, terminal family, evidence refs; never secrets. | Lifecycle recorder implementation missing. |\n| HI-I014 | Providers never block waiting for human input; they return `parked`. | [host-invocation-provider-routing.md](spec.md#8-failure-cancellation-lifecycle-and-human-input), [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#9-repeat-by-component-boundary) | `accepted-not-implemented` | `promote` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md) | No mid-invocation callback to solicit input. | Needed before `ask`/`answer` migration. |\n| HI-I015 | Public command name remains `fgos`; runtime identity is release digest; `fgctl` is separate bootstrap binary. | [host-invocation-provider-routing.md](spec.md#9-physical-placement) | `implemented preview` | `promote` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [spec.md](spec.md), [../packaging-distribution/verification/install-and-release-proof.md](../packaging-distribution/verification/install-and-release-proof.md) | Do not rename `fgos` to `fgctl`; `fgctl` owns bootstrap. | Preview proof shows `fgos` runtime identity through `version --runtime-json`; stable/default graduation remains open. |\n| HI-I016 | R1 physical placement is three Rust crates plus unmoved Node payload; `component-protocol` waits for R2. | [host-invocation-provider-routing.md](spec.md#9-physical-placement), [rust-cli-and-proof-components-plan.md](roadmap.md#7-p2-rust-workspace-and-generated-inputs) | `implemented preview` | `promote` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | No `packages/legacy-node` crate; legacy exec is CLI-adapter module; do not create fake `gate-policy` component. | R1 placement and R2 component protocol preview proof are closed; production ecosystem hardening remains future. |\n| HI-I017 | R1 ships a distributable Rust CLI host, native `version`, and transparent Node compatibility. | [host-invocation-provider-routing.md](spec.md#10-release-boundaries), [rust-cli-and-proof-components-plan.md](roadmap.md#1-outcome) | `implemented preview` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | R1 is useful without R2/R3; repo tests alone do not mean stable/default release graduation. | Preview installed/default proof is recorded; stable/default graduation remains open. |\n| HI-I018 | R2 proves external process provider preview without marketplace/signature/WASM scope. | [host-invocation-provider-routing.md](spec.md#10-release-boundaries), [rust-cli-and-proof-components-plan.md](roadmap.md#12-p7-external-process-provider-preview) | `implemented preview` | `promote` | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Static manifest validation and fail-closed protocol behavior gate R2. | R2 proof closed with `fixture.echo.echo`; marketplace/signature/WASM remain future. |\n| HI-I019 | R3 proves a production remote peer through project-local gateway without CLI shelling or `fgos.v1` parsing. | [host-invocation-provider-routing.md](spec.md#10-release-boundaries), [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#7-release-r3-production-remote-host) | `implemented preview` | `promote` | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md), [architecture/host-use-cases.md](architecture/host-use-cases.md) | Future shared multi-project gateway is separate and uses Project Runtime Adapter. | `GET /v1/runtime` proves the first project-local gateway peer route for `distribution.build.show`; all other gateway routes remain legacy `VerbGateway` consumers. |\n| HI-I020 | Component class and invocation mechanism are separate axes. | [external-provider-protocol.md](architecture/external-provider-protocol.md#1-component-classes) | `accepted-not-implemented` | `promote` | [architecture/external-provider-protocol.md](architecture/external-provider-protocol.md) | Core/packaged extension/user plugin differ from built-in/process/WASM mechanisms. | Provider descriptor proof needed. |\n| HI-I021 | External process protocol is JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. | [external-provider-protocol.md](architecture/external-provider-protocol.md#3-component-protocol) | `implemented preview` | `promote` | [contracts/component-protocol.md](contracts/component-protocol.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Stdout is protocol only; logs go to stderr or declared notification; newline JSON is not contract. | R2 conformance closed for external process preview. |\n| HI-I022 | External discovery scans static `manifest.yaml` and never executes unknown provider code to discover claims. | [external-provider-protocol.md](architecture/external-provider-protocol.md#4-plugin-registry-linker) | `implemented preview` | `promote` | [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | `Registry` names derived runtime index/lock/cache, not another authored file. | R2 manifest proof closed; persisted cache/lock remains future. |\n| HI-I023 | Duplicate operation claims fail closed unless explicit replacement policy names selected and replaced provider. | [external-provider-protocol.md](architecture/external-provider-protocol.md#4-plugin-registry-linker) | `current partial` | `split` | [architecture/provider-routing.md](architecture/provider-routing.md), [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md) | Project-over-global config precedence is not authority precedence. | R2 negative tests cover duplicate/reserved/built-in replacement refusal; declared replacement resolution remains future. |\n| HI-I024 | Core operation and command namespaces are reserved; plugins add vendor-scoped operations or implement published extension points. | [external-provider-protocol.md](architecture/external-provider-protocol.md#5-namespace-rules) | `implemented preview` | `promote` | [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md), [contracts/operation-catalog.md](contracts/operation-catalog.md) | Unknown capability requests and ambiguous claims fail closed. | R2 negative tests cover reserved namespace, duplicate, unknown capability, and incompatible-contract failures. |\n| HI-I025 | `LegacyCliPassthroughProvider` and `LegacySemanticProvider` are distinct adapters with different contracts. | [legacy-cli-transition.md](architecture/legacy-cli-transition.md#1-two-distinct-adapters) | `accepted-not-implemented` | `promote` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/legacy-payload.md](contracts/legacy-payload.md) | Captured stdout/stderr never become semantic result; semantic bridge calls extracted Node use case, never `bin/fgos.mjs`. | P4/P8 proof needed. |\n| HI-I026 | Node payload identity is `legacy-node`; source file `bin/fgos.mjs` is not relocated or renamed. | [legacy-cli-transition.md](architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path) | `legacy-current` and `accepted-not-implemented` target manifest identity | `keep legacy` | [contracts/legacy-payload.md](contracts/legacy-payload.md), [spec.md](spec.md) | Payload is current npm package as `package.json` `files` defines it, staged whole under `components.legacyNode.root`. | Current file exists; release-manifest proof needed. |\n| HI-I027 | The Rust adapter resolves the payload through verified release-manifest legacyNode fields, never from PATH, never from the caller’s cwd, never as an alternate package-manager bin entry, and never hardcoded. | [legacy-cli-transition.md](architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path) | `accepted-not-implemented` target; manifest-owned resolver checked, dated preview proofs retained | `promote` | [contracts/legacy-payload.md](contracts/legacy-payload.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [manifest-owned resolver](../../../apps/fgos/src/legacy_exec.rs) | Explicit release/dev environment bindings or current_exe-relative manifest discovery choose the root; manifest invariants, release files and confined legacy entry are verified. | Checked at the pinned candidate source tree: apps/fgos/src/legacy_exec.rs:69-154. package.json:9-12 and bin/fgos.mjs:1-10 retain npm/direct-Node compatibility channels; those channels are not the Rust payload resolver. No new install/activation smoke is claimed. |\n| HI-I028 | Old `bin/fgos.mjs` callers require resolver migration; tests that spawn Node directly remain payload tests. | [legacy-cli-transition.md](architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path), [rust-cli-and-proof-components-plan.md](roadmap.md#5-p0-lock-release-inputs-and-baseline-inventory) | `planned` | `promote` | [verification/compatibility-harness.md](verification/compatibility-harness.md), [contracts/legacy-payload.md](contracts/legacy-payload.md) | Nine real call sites route through resolver; `.agents`/`plugins` copies are render targets. | P0/P4 scan proof needed. |\n| HI-I029 | Every selector has exactly one generated `CommandRouteDescriptor`, route kind, owner path, and compatibility tests. | [legacy-cli-transition.md](architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path), [rust-cli-and-proof-components-plan.md](roadmap.md#6-p1-compatibility-harness) | `current partial` | `promote` | [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md), [verification/compatibility-harness.md](verification/compatibility-harness.md) | Descriptor is routing input and contributor repair map; unlisted selector fails build. | Current route matrix has 75 selectors, 70 legacy and five native, with drift tests. |\n| HI-I030 | `fgos.v1` is CLI presentation, not provider protocol; legacy passthrough must not be double-wrapped. | [legacy-cli-transition.md](architecture/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome) | `accepted-not-implemented` | `split` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md) | Preserve compact hash input, pretty envelope output, order, timestamps, stdout/stderr, exit/signal mapping. | Compatibility vectors needed. |\n| HI-I031 | Migration selects Rust host first, Node as legacy provider/lane; Option A and C are rejected. | [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#2-options-considered) | `accepted-not-implemented` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Do not do repository-wide Node thinning first or big-bang rewrite. | Plan accepted; implementation planned. |\n| HI-I032 | Current CLI thinness categories are ordering signals, not authority to migrate by file size. | [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#4-current-migration-readiness) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md), [history/host-invocation-baseline.md](history/host-invocation-baseline.md) | Preserve near-thin, partly-thin, and not-thin lists. | Needs fresh scan before execution. |\n| HI-I033 | R1 migration order includes packaging contract adoption, legacy payload naming, selector descriptor, kernel, CLI adapter, native `version`, external install proof, then installed default flip. | [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#5-release-r1-distributable-rust-cli-host) | `implemented preview` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | Flip only after compatibility and distribution gates pass. | Preview installed/default flip is proven; stable/default release graduation remains open. |\n| HI-I034 | `gate-bypass` is the next read proof, not a pre-created component; `ready` is not first proof. | [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#8-migrate-the-next-small-read-only-proof), [rust-cli-and-proof-components-plan.md](roadmap.md#14-p9-next-native-read) | `implemented local proof` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md), [roadmap.md](roadmap.md#7-phase-d-add-the-next-native-read-route), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Implemented as existing work/state read ownership with Packaging-Distribution retaining setup/doctor readiness; do not invent `gate-policy`. | Keep proof scoped to read-only `work.gate-bypass.show`; full Work/State migration remains future work. |\n| HI-I035 | Read models migrate before writers; writers need sole authority, event/schema compatibility, locks, atomicity, idempotency, crash recovery, mutual exclusion, and rollback compatibility. | [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers), [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#11-migrate-state-writing-components) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Never dual-run a write for shadow comparison. | Future writer proof needed. |\n| HI-I036 | Node removal is allowed only after zero legacy routes, replay compatibility, public host contract tests, no init/doctor dependency, and no rollback dependency. | [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md#12-remove-node) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Node removal is consequence of zero routes, not calendar target. | Future cleanup proof needed. |\n| HI-I037 | P0-P9 execution graph and proof gates remain planning material, not architecture authority. | [rust-cli-and-proof-components-plan.md](roadmap.md#4-delivery-graph) | `planned` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/compatibility-harness.md](verification/compatibility-harness.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md), [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) | P-numbering stays P0-P9; PK is packaging dependency, not new P-package. | Proof docs are stubs until executed. |\n| HI-I038 | Remaining decisions before R1: target matrix, preview-vs-stable, compatibility-window duration. | [rust-cli-and-proof-components-plan.md](roadmap.md#3-decisions-required-before-r1-execution) | `preview settled; stable deferred; fallback window settled` | `deferred` | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [architecture/release-boundaries.md](architecture/release-boundaries.md), [../packaging-distribution/verification/install-and-release-proof.md](../packaging-distribution/verification/install-and-release-proof.md) | Settled packaging choices for publication, rollback, artifact identity, and setup/doctor authority must not be reopened here. | Preview/default is settled; fallback escape-hatch window is 30 calendar days after preview release publication; stable graduation still needs release-owner decision. |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_a610c38b692fbf239557c30e8f966ad3"
}
```

## Entry claim_f7c3dccfecbcfec8edeb64fcfc4437aa

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_f7c3dccfecbcfec8edeb64fcfc4437aa",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/verification/compatibility-harness.md",
    "unitDigest": "f2d775be69f9f9e8973f81a9365f31a1f9152d1f824b4cf2aa45107dbd472a45",
    "identityFingerprint": "f2d775be69f9f9e8973f81a9365f31a1f9152d1f824b4cf2aa45107dbd472a45",
    "claimId": "claim_f7c3dccfecbcfec8edeb64fcfc4437aa",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "95e0b02356484a7a938046cd6cb523f3443b1a17a079bc27cd0a7f2d96b46821",
    "claimKind": "verification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/verification/compatibility-harness.md",
    "unitDigest": "f2d775be69f9f9e8973f81a9365f31a1f9152d1f824b4cf2aa45107dbd472a45",
    "identityFingerprint": "f2d775be69f9f9e8973f81a9365f31a1f9152d1f824b4cf2aa45107dbd472a45",
    "claimId": "claim_f7c3dccfecbcfec8edeb64fcfc4437aa",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "95e0b02356484a7a938046cd6cb523f3443b1a17a079bc27cd0a7f2d96b46821",
    "claimKind": "verification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-6 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 48,
    "endLine": 52,
    "textDigest": "95e0b02356484a7a938046cd6cb523f3443b1a17a079bc27cd0a7f2d96b46821",
    "sample": "| Relationship | File |\n| --- | --- |\n| descriptor contract | [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |\n| legacy transition | [../archi",
    "identityFingerprint": "f2d775be69f9f9e8973f81a9365f31a1f9152d1f824b4cf2aa45107dbd472a45",
    "ancestry": [
      "Verification: Compatibility Harness",
      "4. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| descriptor contract | [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |\n| legacy transition | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md) |\n| source plan | [../roadmap.md](../roadmap.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f7c3dccfecbcfec8edeb64fcfc4437aa"
}
```

## Entry claim_dd52d39a0cfa7492a45650113b65468f

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_dd52d39a0cfa7492a45650113b65468f",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md",
    "unitDigest": "2190cb4a2b2fda027340de9afa450ffaa64b5f226670578b740301aa54157524",
    "identityFingerprint": "2190cb4a2b2fda027340de9afa450ffaa64b5f226670578b740301aa54157524",
    "claimId": "claim_dd52d39a0cfa7492a45650113b65468f",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "81c7abfd48dce2579087ec6b5210f20a9b3f7f03d6655489ebcaee2f71d2e7fb",
    "claimKind": "verification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md",
    "unitDigest": "2190cb4a2b2fda027340de9afa450ffaa64b5f226670578b740301aa54157524",
    "identityFingerprint": "2190cb4a2b2fda027340de9afa450ffaa64b5f226670578b740301aa54157524",
    "claimId": "claim_dd52d39a0cfa7492a45650113b65468f",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "81c7abfd48dce2579087ec6b5210f20a9b3f7f03d6655489ebcaee2f71d2e7fb",
    "claimKind": "verification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-12 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-12",
    "githubAnchor": "unheaded-block-12",
    "stableAnchor": "unheaded-block-12",
    "title": "Unheaded block 12",
    "startLine": 87,
    "endLine": 92,
    "textDigest": "81c7abfd48dce2579087ec6b5210f20a9b3f7f03d6655489ebcaee2f71d2e7fb",
    "sample": "| Relationship | File |\n| --- | --- |\n| release boundaries | [../architecture/release-boundaries.md](../architecture/release-boundaries.md) |\n| compatibility harness | [compatibili",
    "identityFingerprint": "2190cb4a2b2fda027340de9afa450ffaa64b5f226670578b740301aa54157524",
    "ancestry": [
      "Verification: R1 Rust Host Proof",
      "5. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| release boundaries | [../architecture/release-boundaries.md](../architecture/release-boundaries.md) |\n| compatibility harness | [compatibility-harness.md](compatibility-harness.md) |\n| release manifest contract | [../../packaging-distribution/contracts/release-manifest.md](../../packaging-distribution/contracts/release-manifest.md) |\n| source plan | [../roadmap.md](../roadmap.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_dd52d39a0cfa7492a45650113b65468f"
}
```

## Entry claim_f1bf5f1790914c5f5a12983526825ee7

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_f1bf5f1790914c5f5a12983526825ee7",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/verification/r2-external-process-proof.md",
    "unitDigest": "c8e6600c5dd7dee6dbd9c6f098677e8cb834bef5e55178f79f117fd6f9b124e4",
    "identityFingerprint": "c8e6600c5dd7dee6dbd9c6f098677e8cb834bef5e55178f79f117fd6f9b124e4",
    "claimId": "claim_f1bf5f1790914c5f5a12983526825ee7",
    "sourceAnchor": "unheaded-block-15",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "72e12f0f393685acd049e315205ea448894f62a54a6c6efb69c7fb3893480029",
    "claimKind": "verification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/verification/r2-external-process-proof.md",
    "unitDigest": "c8e6600c5dd7dee6dbd9c6f098677e8cb834bef5e55178f79f117fd6f9b124e4",
    "identityFingerprint": "c8e6600c5dd7dee6dbd9c6f098677e8cb834bef5e55178f79f117fd6f9b124e4",
    "claimId": "claim_f1bf5f1790914c5f5a12983526825ee7",
    "sourceAnchor": "unheaded-block-15",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "72e12f0f393685acd049e315205ea448894f62a54a6c6efb69c7fb3893480029",
    "claimKind": "verification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-15 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-15",
    "githubAnchor": "unheaded-block-15",
    "stableAnchor": "unheaded-block-15",
    "title": "Unheaded block 15",
    "startLine": 98,
    "endLine": 105,
    "textDigest": "72e12f0f393685acd049e315205ea448894f62a54a6c6efb69c7fb3893480029",
    "sample": "| Relationship | File |\n| --- | --- |\n| execution record | [../../../../plans/260915-host-invocation-r2-external-process/plan.md](../../../../archive/plans/260915-host-invocation-r",
    "identityFingerprint": "c8e6600c5dd7dee6dbd9c6f098677e8cb834bef5e55178f79f117fd6f9b124e4",
    "ancestry": [
      "Verification: R2 External Process Proof",
      "8. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| execution record | [../../../../plans/260915-host-invocation-r2-external-process/plan.md](../../../../archive/plans/260915-host-invocation-r2-external-process/plan.md) |\n| component protocol | [../contracts/component-protocol.md](../contracts/component-protocol.md) |\n| provider manifest | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |\n| implementation alignment | [implementation-alignment.md](implementation-alignment.md) |\n| R1 proof | [r1-rust-host-proof.md](r1-rust-host-proof.md) |\n| source plan | [../roadmap.md](../roadmap.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f1bf5f1790914c5f5a12983526825ee7"
}
```

## Entry claim_747b05a6c87581e0024ddd6f24802f17

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_747b05a6c87581e0024ddd6f24802f17",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md",
    "unitDigest": "e9b481e5520da0500066c863ef60d25581970a928ae337671472582f231edd21",
    "identityFingerprint": "e9b481e5520da0500066c863ef60d25581970a928ae337671472582f231edd21",
    "claimId": "claim_747b05a6c87581e0024ddd6f24802f17",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "223d22df37d4a1e6f1c925c5747cdf3e6aa9a272c6708665bd44c695ae984a68",
    "claimKind": "verification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md",
    "unitDigest": "e9b481e5520da0500066c863ef60d25581970a928ae337671472582f231edd21",
    "identityFingerprint": "e9b481e5520da0500066c863ef60d25581970a928ae337671472582f231edd21",
    "claimId": "claim_747b05a6c87581e0024ddd6f24802f17",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "223d22df37d4a1e6f1c925c5747cdf3e6aa9a272c6708665bd44c695ae984a68",
    "claimKind": "verification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-16 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-16",
    "githubAnchor": "unheaded-block-16",
    "stableAnchor": "unheaded-block-16",
    "title": "Unheaded block 16",
    "startLine": 107,
    "endLine": 112,
    "textDigest": "223d22df37d4a1e6f1c925c5747cdf3e6aa9a272c6708665bd44c695ae984a68",
    "sample": "| Relationship | File |\n| --- | --- |\n| execution record | [../../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../../archive/plans/260918-host-invocation-r3-rem",
    "identityFingerprint": "e9b481e5520da0500066c863ef60d25581970a928ae337671472582f231edd21",
    "ancestry": [
      "Verification: R3 Remote Peer Proof",
      "4. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| execution record | [../../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md) |\n| host use cases | [../architecture/host-use-cases.md](../architecture/host-use-cases.md) |\n| release boundaries | [../architecture/release-boundaries.md](../architecture/release-boundaries.md) |\n| source migration | [../architecture/node-to-rust-migration.md](../architecture/node-to-rust-migration.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_747b05a6c87581e0024ddd6f24802f17"
}
```

## Entry claim_fbafc121dbbb437c11bc6c76f8dd3b5e

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_fbafc121dbbb437c11bc6c76f8dd3b5e",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
    "unitDigest": "8cfb9f9ec6cc8431e801be434efa8bb38ca3ec99e231dae93d67c4b442931426",
    "identityFingerprint": "8cfb9f9ec6cc8431e801be434efa8bb38ca3ec99e231dae93d67c4b442931426",
    "claimId": "claim_fbafc121dbbb437c11bc6c76f8dd3b5e",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "76270a042a3d3c5b2bcb73fd0590497abd867c3b6ae26afce5f046de058a2749",
    "claimKind": "verification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/verification/source-preservation-audit.md",
    "unitDigest": "8cfb9f9ec6cc8431e801be434efa8bb38ca3ec99e231dae93d67c4b442931426",
    "identityFingerprint": "8cfb9f9ec6cc8431e801be434efa8bb38ca3ec99e231dae93d67c4b442931426",
    "claimId": "claim_fbafc121dbbb437c11bc6c76f8dd3b5e",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "76270a042a3d3c5b2bcb73fd0590497abd867c3b6ae26afce5f046de058a2749",
    "claimKind": "verification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-6 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 37,
    "endLine": 44,
    "textDigest": "76270a042a3d3c5b2bcb73fd0590497abd867c3b6ae26afce5f046de058a2749",
    "sample": "| Legacy source | Source content audited | Preservation target |\n| --- | --- | --- |\n| [documentation-standardization-plan.md](../history/documentation-migration/documentation-stan",
    "identityFingerprint": "8cfb9f9ec6cc8431e801be434efa8bb38ca3ec99e231dae93d67c4b442931426",
    "ancestry": [
      "Host Invocation Source Preservation Audit",
      "2. Source Coverage Matrix"
    ],
    "text": "| Legacy source | Source content audited | Preservation target |\n| --- | --- | --- |\n| [documentation-standardization-plan.md](../history/documentation-migration/documentation-standardization-plan.md) | Goal, non-goals, hard rules, source inventory requirement, target tree, status vocabulary, phase order, ledger requirement, old-doc redirect requirement, component-boundary check, validation requirement. | [../README.md](../README.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md), [../history/source-inventory.md](../history/source-inventory.md), this audit. |\n| [host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) | Architecture name, problem statement, canonical names, peer host use cases, core contracts, pure Router, `InvocationService`, two-stage authority, failure families, lifecycle record, human-input parking, physical placement, release boundaries, open questions. | [../vision.md](../vision.md), [../architecture/invocation-kernel.md](../architecture/invocation-kernel.md), [../architecture/host-use-cases.md](../architecture/host-use-cases.md), [../architecture/provider-routing.md](../architecture/provider-routing.md), [../contracts/operation-catalog.md](../contracts/operation-catalog.md), [../contracts/operation-provider.md](../contracts/operation-provider.md), [../contracts/operation-request-outcome.md](../contracts/operation-request-outcome.md), [implementation-alignment.md](implementation-alignment.md), ledger rows HI-I001 through HI-I019. |\n| [external-provider-protocol.md](../architecture/external-provider-protocol.md) | Component class versus invocation mechanism, built-in/process/WASM protocol placement, JSON-RPC 2.0 semantics over length-prefixed stdio frames, static manifest discovery, registry/linker meaning, namespace and replacement rules. | [../architecture/external-provider-protocol.md](../architecture/external-provider-protocol.md), [../contracts/component-protocol.md](../contracts/component-protocol.md), [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md), [../architecture/provider-routing.md](../architecture/provider-routing.md), [r2-external-process-proof.md](r2-external-process-proof.md), ledger rows HI-I020 through HI-I024. |\n| [legacy-cli-transition.md](../architecture/legacy-cli-transition.md) | Separate `LegacyCliPassthroughProvider` and `LegacySemanticProvider`, `legacy-node` identity, `bin/fgos.mjs` immovability, activation-manifest resolution, caller inventory, `CommandRouteDescriptor`, Rust parser ownership, `fgos.v1` presentation boundary, Rust host benefit/cost. | [../architecture/legacy-cli-transition.md](../architecture/legacy-cli-transition.md), [../contracts/legacy-payload.md](../contracts/legacy-payload.md), [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md), [compatibility-harness.md](compatibility-harness.md), [../history/host-invocation-baseline.md](../history/host-invocation-baseline.md), ledger rows HI-I025 through HI-I033. |\n| [node-to-rust-component-migration.md](../architecture/node-to-rust-migration.md) | Chosen migration strategy, rejected migration options, R1/R2/R3 sequence, release readiness categories, component-boundary repetition rule, read-model-before-writer rule, writer migration constraints, Node removal gate, rollback rules, verification gate, remaining decisions. | [../architecture/node-to-rust-migration.md](../architecture/node-to-rust-migration.md), [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [r1-rust-host-proof.md](r1-rust-host-proof.md), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../history/host-invocation-baseline.md](../history/host-invocation-baseline.md), ledger rows HI-I034 through HI-I038. |\n| [rust-cli-and-proof-components-plan.md](../roadmap.md) | Outcome, non-goals, settled choices, P0-P9 proof graph, test gates, rollback gates, risk controls, done criteria, remaining choices for target matrix, compatibility window, and preview versus stable. | [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [compatibility-harness.md](compatibility-harness.md), [r1-rust-host-proof.md](r1-rust-host-proof.md), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [implementation-alignment.md](implementation-alignment.md), ledger rows HI-I016 through HI-I019 and HI-I034 through HI-I038. |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_fbafc121dbbb437c11bc6c76f8dd3b5e"
}
```

## Entry claim_a9dcff5f77392c94924505b210e517c1

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_a9dcff5f77392c94924505b210e517c1",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/vision.md",
    "unitDigest": "0b07a70aabbc2f28467960d880a07b7f19c523ecf18b4beb01797d79c693bdd8",
    "identityFingerprint": "0b07a70aabbc2f28467960d880a07b7f19c523ecf18b4beb01797d79c693bdd8",
    "claimId": "claim_a9dcff5f77392c94924505b210e517c1",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a3c1c365ebdd1652fabf28758c8e0064ac6b1ce7f78960b63a8c986c394f8e68",
    "claimKind": "vision",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/vision.md",
    "unitDigest": "0b07a70aabbc2f28467960d880a07b7f19c523ecf18b4beb01797d79c693bdd8",
    "identityFingerprint": "0b07a70aabbc2f28467960d880a07b7f19c523ecf18b4beb01797d79c693bdd8",
    "claimId": "claim_a9dcff5f77392c94924505b210e517c1",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a3c1c365ebdd1652fabf28758c8e0064ac6b1ce7f78960b63a8c986c394f8e68",
    "claimKind": "vision",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-11 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-11",
    "githubAnchor": "unheaded-block-11",
    "stableAnchor": "unheaded-block-11",
    "title": "Unheaded block 11",
    "startLine": 61,
    "endLine": 67,
    "textDigest": "a3c1c365ebdd1652fabf28758c8e0064ac6b1ce7f78960b63a8c986c394f8e68",
    "sample": "| Direction | Status | Alignment |\n| --- | --- | --- |\n| CLI, remote, and chat are peer hosts that feed one semantic invocation service. | `accepted-not-implemented` | Preserved fr",
    "identityFingerprint": "0b07a70aabbc2f28467960d880a07b7f19c523ecf18b4beb01797d79c693bdd8",
    "ancestry": [
      "Host Invocation Vision",
      "5. Design Direction"
    ],
    "text": "| Direction | Status | Alignment |\n| --- | --- | --- |\n| CLI, remote, and chat are peer hosts that feed one semantic invocation service. | `accepted-not-implemented` | Preserved from [host-invocation-provider-routing.md](spec.md); proof gap in [verification/implementation-alignment.md](verification/implementation-alignment.md). |\n| Legacy Node compatibility is transitional and CLI-local unless a per-operation semantic bridge is needed. | `accepted-not-implemented` with `legacy-current` behavior | Preserved from [legacy-cli-transition.md](architecture/legacy-cli-transition.md). |\n| Provider manifests describe capability requests and operation claims but never grant authority. | `accepted-not-implemented` | Preserved from [external-provider-protocol.md](architecture/external-provider-protocol.md). |\n| Rust host migration proceeds by complete component/use-case boundaries, reads before writers, and no write dual-run. | `planned` | Preserved from [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md). |\n| Rollback of native R1/R2 behavior is a release rollback through `fgctl`, not a runtime provider-selection toggle. | `accepted-not-implemented` | Depends on packaging-distribution contracts. |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_a9dcff5f77392c94924505b210e517c1"
}
```

## Entry claim_1e430bb3bafb3db3bb2c50fed52cba33

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_1e430bb3bafb3db3bb2c50fed52cba33",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/vision.md",
    "unitDigest": "7e36243d6e74661fa772919910752a69741a4d898bf5ba307402b8dcf72c872b",
    "identityFingerprint": "7e36243d6e74661fa772919910752a69741a4d898bf5ba307402b8dcf72c872b",
    "claimId": "claim_1e430bb3bafb3db3bb2c50fed52cba33",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "40f4b761e9f3782aaa6ce72bc6753e8bbd1ef60cb53c47db199544c491fa6aba",
    "claimKind": "vision",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/host-invocation-routing/vision.md",
    "unitDigest": "7e36243d6e74661fa772919910752a69741a4d898bf5ba307402b8dcf72c872b",
    "identityFingerprint": "7e36243d6e74661fa772919910752a69741a4d898bf5ba307402b8dcf72c872b",
    "claimId": "claim_1e430bb3bafb3db3bb2c50fed52cba33",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "40f4b761e9f3782aaa6ce72bc6753e8bbd1ef60cb53c47db199544c491fa6aba",
    "claimKind": "vision",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-12 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-12",
    "githubAnchor": "unheaded-block-12",
    "stableAnchor": "unheaded-block-12",
    "title": "Unheaded block 12",
    "startLine": 71,
    "endLine": 78,
    "textDigest": "40f4b761e9f3782aaa6ce72bc6753e8bbd1ef60cb53c47db199544c491fa6aba",
    "sample": "| Relationship | File |\n| --- | --- |\n| area portal | [README.md](README.md) |\n| preserved intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| current state",
    "identityFingerprint": "7e36243d6e74661fa772919910752a69741a4d898bf5ba307402b8dcf72c872b",
    "ancestry": [
      "Host Invocation Vision",
      "6. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| area portal | [README.md](README.md) |\n| preserved intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| current state | [spec.md](spec.md) |\n| implementation alignment | [verification/implementation-alignment.md](verification/implementation-alignment.md) |\n| source architecture | [spec.md](spec.md) |\n| source migration strategy | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_1e430bb3bafb3db3bb2c50fed52cba33"
}
```

## Entry claim_835ddc789dd8f13f2e496e2be00a78af

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_835ddc789dd8f13f2e496e2be00a78af",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/observe/spec.md",
    "unitDigest": "5298889bd8c8258c687bdf6bd24aa932cba7e9fdfa44f193e8954e29f0e761b5",
    "identityFingerprint": "5298889bd8c8258c687bdf6bd24aa932cba7e9fdfa44f193e8954e29f0e761b5",
    "claimId": "claim_835ddc789dd8f13f2e496e2be00a78af",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fb157c8023d0df3a8f9673a7659d80b88bde4b76d28c32811d5b0552f530bb4d",
    "claimKind": "specification",
    "status": "future"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/observe/spec.md",
    "unitDigest": "5298889bd8c8258c687bdf6bd24aa932cba7e9fdfa44f193e8954e29f0e761b5",
    "identityFingerprint": "5298889bd8c8258c687bdf6bd24aa932cba7e9fdfa44f193e8954e29f0e761b5",
    "claimId": "claim_835ddc789dd8f13f2e496e2be00a78af",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fb157c8023d0df3a8f9673a7659d80b88bde4b76d28c32811d5b0552f530bb4d",
    "claimKind": "specification",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-5 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 35,
    "endLine": 39,
    "textDigest": "fb157c8023d0df3a8f9673a7659d80b88bde4b76d28c32811d5b0552f530bb4d",
    "sample": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`,",
    "identityFingerprint": "5298889bd8c8258c687bdf6bd24aa932cba7e9fdfa44f193e8954e29f0e761b5",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "text": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`, `fgos friction ping`, `fgos friction migrate`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`).\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_835ddc789dd8f13f2e496e2be00a78af"
}
```

## Entry claim_476b52e290b387d0fca2ba67f332780e

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_476b52e290b387d0fca2ba67f332780e",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/packaging-distribution/README.md",
    "unitDigest": "d750fdba730ded4dfc8452132586de2daa7b7045cfc668f13108e69bee66bd36",
    "identityFingerprint": "d750fdba730ded4dfc8452132586de2daa7b7045cfc668f13108e69bee66bd36",
    "claimId": "claim_476b52e290b387d0fca2ba67f332780e",
    "sourceAnchor": "unheaded-block-38",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "f5197870363cbb04004795f6a8a85550585141fd999e6d913ae7874f0282afbf",
    "claimKind": "navigation",
    "status": "current"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/packaging-distribution/README.md",
    "unitDigest": "d750fdba730ded4dfc8452132586de2daa7b7045cfc668f13108e69bee66bd36",
    "identityFingerprint": "d750fdba730ded4dfc8452132586de2daa7b7045cfc668f13108e69bee66bd36",
    "claimId": "claim_476b52e290b387d0fca2ba67f332780e",
    "sourceAnchor": "unheaded-block-38",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "f5197870363cbb04004795f6a8a85550585141fd999e6d913ae7874f0282afbf",
    "claimKind": "navigation",
    "status": "current",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-38 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-38",
    "githubAnchor": "unheaded-block-38",
    "stableAnchor": "unheaded-block-38",
    "title": "Unheaded block 38",
    "startLine": 268,
    "endLine": 274,
    "textDigest": "f5197870363cbb04004795f6a8a85550585141fd999e6d913ae7874f0282afbf",
    "sample": "| Topic | Active source to follow | Status |\n|---|---|---|\n| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../system-architecture/architecture/workspace",
    "identityFingerprint": "d750fdba730ded4dfc8452132586de2daa7b7045cfc668f13108e69bee66bd36",
    "ancestry": [
      "Packaging-Distribution",
      "Retained Readme Source Detail",
      "Packaging And Distribution Architecture",
      "2. Historical Supersession Table"
    ],
    "text": "| Topic | Active source to follow | Status |\n|---|---|---|\n| Runtime/workspace/work-state topology | [Workspace Topology Architecture](../system-architecture/architecture/workspace-topology.md) | Active architecture target. Supersedes any simpler \"one project root / one runtime root\" reading. Packaging must not own physical placement for config/event/coordination roots. |\n| Release identity and activation | [Promoted Runtime Identity And Activation](architecture/runtime-identity-and-activation.md) | Active architecture target. Uses per-workspace activation binding, not one repository-wide `active.json`. |\n| Shared gateway/web | [Promoted Future Constraints](architecture/future-constraints.md) | Future constraint only; not active delivery scope. |\n| Old npm/global/setup install story | [Distribution Baseline And Scattered Spec Fragments](history/distribution-baseline.md) | Historical input. Do not implement as target without explicit supersession. |\n| `docs/specs/*` distribution wording | Generated specs | Read as current generated state plus historical constraints; not the target while this architecture stream is active. |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_476b52e290b387d0fca2ba67f332780e"
}
```

## Entry claim_7619e5f0f90405ed4041629f996eb17a

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_7619e5f0f90405ed4041629f996eb17a",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/packaging-distribution/contracts/release-manifest.md",
    "unitDigest": "4528836259b5e84380fb940fd378e69748a33c967c21a21f7c2e93b2d2e48e54",
    "identityFingerprint": "4528836259b5e84380fb940fd378e69748a33c967c21a21f7c2e93b2d2e48e54",
    "claimId": "claim_7619e5f0f90405ed4041629f996eb17a",
    "sourceAnchor": "unheaded-block-17",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "18f7037414eaa3e6682d49f5477a6f75321fd6b77ffd90110ab99539dc47298b",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/packaging-distribution/contracts/release-manifest.md",
    "unitDigest": "4528836259b5e84380fb940fd378e69748a33c967c21a21f7c2e93b2d2e48e54",
    "identityFingerprint": "4528836259b5e84380fb940fd378e69748a33c967c21a21f7c2e93b2d2e48e54",
    "claimId": "claim_7619e5f0f90405ed4041629f996eb17a",
    "sourceAnchor": "unheaded-block-17",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "18f7037414eaa3e6682d49f5477a6f75321fd6b77ffd90110ab99539dc47298b",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-17 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-17",
    "githubAnchor": "unheaded-block-17",
    "stableAnchor": "unheaded-block-17",
    "title": "Unheaded block 17",
    "startLine": 220,
    "endLine": 220,
    "textDigest": "18f7037414eaa3e6682d49f5477a6f75321fd6b77ffd90110ab99539dc47298b",
    "sample": "`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../.",
    "identityFingerprint": "4528836259b5e84380fb940fd378e69748a33c967c21a21f7c2e93b2d2e48e54",
    "ancestry": [
      "Contract: Release Manifest",
      "Retained Runtime Identity And Activation Source Detail",
      "5. ReleaseManifest"
    ],
    "text": "`components.legacyNode` names a payload **root** plus an **entry** inside it, not a single file (proposed 2026-09-10 by the host-invocation stream, see [Legacy CLI Transition](../../host-invocation-routing/architecture/legacy-cli-transition.md) §2): the legacy payload is the whole Node package as `package.json` `files` defines it, staged with its source-relative layout intact so `bin/fgos.mjs` needs no import changes, and `bin/fgos-runner.mjs` lives in the same root. The Rust host resolves `join(activeReleasePath, root, entry)` and nothing else. A `dev:<rev>` source activation declares `root: \".\"`, `entry: \"bin/fgos.mjs\"`, `entries.fgos: \"target/release/fgos\"` — the same fields serve dogfood and a staged release."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_7619e5f0f90405ed4041629f996eb17a"
}
```

## Entry claim_47851268fbce8f6087f931306649a4b6

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_47851268fbce8f6087f931306649a4b6",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/packaging-distribution/spec.md",
    "unitDigest": "6baada3109649d12a254a1ad430afa2ba0a8084f65bac43c08f3ecd0f35d5934",
    "identityFingerprint": "6baada3109649d12a254a1ad430afa2ba0a8084f65bac43c08f3ecd0f35d5934",
    "claimId": "claim_47851268fbce8f6087f931306649a4b6",
    "sourceAnchor": "unheaded-block-75",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "65cb0621a4ec37ae5bfed6de55320aa96a6df5ea9f6868a9d6a0c51403366eec",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/packaging-distribution/spec.md",
    "unitDigest": "6baada3109649d12a254a1ad430afa2ba0a8084f65bac43c08f3ecd0f35d5934",
    "identityFingerprint": "6baada3109649d12a254a1ad430afa2ba0a8084f65bac43c08f3ecd0f35d5934",
    "claimId": "claim_47851268fbce8f6087f931306649a4b6",
    "sourceAnchor": "unheaded-block-75",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "65cb0621a4ec37ae5bfed6de55320aa96a6df5ea9f6868a9d6a0c51403366eec",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-75 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-75",
    "githubAnchor": "unheaded-block-75",
    "stableAnchor": "unheaded-block-75",
    "title": "Unheaded block 75",
    "startLine": 438,
    "endLine": 442,
    "textDigest": "65cb0621a4ec37ae5bfed6de55320aa96a6df5ea9f6868a9d6a0c51403366eec",
    "sample": "> Status: historical redirect. Active topology remains\n> [docs/platform/system-architecture/architecture/workspace-topology.md](../system-architecture/architecture/workspace-topolo",
    "identityFingerprint": "6baada3109649d12a254a1ad430afa2ba0a8084f65bac43c08f3ecd0f35d5934",
    "ancestry": [
      "Spec: Packaging-Distribution",
      "Retained Workspace Runtime Model Source Detail",
      "Workspace Runtime Model"
    ],
    "text": "> Status: historical redirect. Active topology remains\n> [docs/platform/system-architecture/architecture/workspace-topology.md](../system-architecture/architecture/workspace-topology.md), while active\n> packaging-distribution runtime records live under\n> [docs/platform/packaging-distribution/](README.md).\n> Keep this file only as the old pointer that explains the split."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_47851268fbce8f6087f931306649a4b6"
}
```

## Entry claim_5733ecd0feed1e82582af50b273934c9

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_5733ecd0feed1e82582af50b273934c9",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/packaging-distribution/spec.md",
    "unitDigest": "1a72acf07f83fb86940d7242f60ed89cc80b9fa5ff85e4f69a25976849d34e4d",
    "identityFingerprint": "1a72acf07f83fb86940d7242f60ed89cc80b9fa5ff85e4f69a25976849d34e4d",
    "claimId": "claim_5733ecd0feed1e82582af50b273934c9",
    "sourceAnchor": "unheaded-block-85",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "claimKind": "specification",
    "status": "future"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/packaging-distribution/spec.md",
    "unitDigest": "1a72acf07f83fb86940d7242f60ed89cc80b9fa5ff85e4f69a25976849d34e4d",
    "identityFingerprint": "1a72acf07f83fb86940d7242f60ed89cc80b9fa5ff85e4f69a25976849d34e4d",
    "claimId": "claim_5733ecd0feed1e82582af50b273934c9",
    "sourceAnchor": "unheaded-block-85",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "claimKind": "specification",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-85 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-85",
    "githubAnchor": "unheaded-block-85",
    "stableAnchor": "unheaded-block-85",
    "title": "Unheaded block 85",
    "startLine": 517,
    "endLine": 533,
    "textDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "sample": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based i",
    "identityFingerprint": "1a72acf07f83fb86940d7242f60ed89cc80b9fa5ff85e4f69a25976849d34e4d",
    "ancestry": [
      "Spec: Packaging-Distribution",
      "Retained Distribution Source Detail",
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "text": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_5733ecd0feed1e82582af50b273934c9"
}
```

## Entry claim_6c2fa7dbab0ae63392159e5aff447643

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_6c2fa7dbab0ae63392159e5aff447643",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/proposals/component-authority-boundary-map.md",
    "unitDigest": "790ccebeba287d99a5b4b6e24c59e8c765b2881f044b45f9efa2da60ab345b3a",
    "identityFingerprint": "790ccebeba287d99a5b4b6e24c59e8c765b2881f044b45f9efa2da60ab345b3a",
    "claimId": "claim_6c2fa7dbab0ae63392159e5aff447643",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ad7d204ae671235bb9bd69479588522525842b9abb9b8df79bb06651d346965e",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/proposals/component-authority-boundary-map.md",
    "unitDigest": "790ccebeba287d99a5b4b6e24c59e8c765b2881f044b45f9efa2da60ab345b3a",
    "identityFingerprint": "790ccebeba287d99a5b4b6e24c59e8c765b2881f044b45f9efa2da60ab345b3a",
    "claimId": "claim_6c2fa7dbab0ae63392159e5aff447643",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ad7d204ae671235bb9bd69479588522525842b9abb9b8df79bb06651d346965e",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-4 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-4",
    "githubAnchor": "unheaded-block-4",
    "stableAnchor": "unheaded-block-4",
    "title": "Unheaded block 4",
    "startLine": 27,
    "endLine": 32,
    "textDigest": "ad7d204ae671235bb9bd69479588522525842b9abb9b8df79bb06651d346965e",
    "sample": "Document type: Proposal artifact\nDesign status: Draft / architect-level discussion\nImplementation: Not started\nLast reviewed: 2026-09-02\nCanonical for: nothing until promoted or re",
    "identityFingerprint": "790ccebeba287d99a5b4b6e24c59e8c765b2881f044b45f9efa2da60ab345b3a",
    "ancestry": [
      "Component Authority Boundary Map"
    ],
    "text": "Document type: Proposal artifact\nDesign status: Draft / architect-level discussion\nImplementation: Not started\nLast reviewed: 2026-09-02\nCanonical for: nothing until promoted or replaced by an accepted boundary document\nRelated: [Step 09 Group Thinking Substrate](step-09-group-thinking-substrate.md), [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md), [Agent Coordination Vision](../agent-coordination/vision.md), [Intent Preservation Ledger](../agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md), [Architecture Intent](../system-architecture/architecture/architecture-intent.md), [Component Boundary Advisory](../component-boundary.md), [Repo Layout Vision](../component-boundary.md), [Host Invocation And Provider Routing](../host-invocation-routing/spec.md), [Node To Rust Component Migration](../host-invocation-routing/architecture/node-to-rust-migration.md)"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_6c2fa7dbab0ae63392159e5aff447643"
}
```

## Entry claim_95ecfacefbe989a282e80086da78c813

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_95ecfacefbe989a282e80086da78c813",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "unitDigest": "9e798603223e142a812bc324ac5bf77201d1136b838951798f307fe5d9a25373",
    "identityFingerprint": "9e798603223e142a812bc324ac5bf77201d1136b838951798f307fe5d9a25373",
    "claimId": "claim_95ecfacefbe989a282e80086da78c813",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "846ef344dc875c30b8c5aaaf62ef71d2629011a265605d75cc3bb278066579eb",
    "claimKind": "verification",
    "status": "future"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md",
    "unitDigest": "9e798603223e142a812bc324ac5bf77201d1136b838951798f307fe5d9a25373",
    "identityFingerprint": "9e798603223e142a812bc324ac5bf77201d1136b838951798f307fe5d9a25373",
    "claimId": "claim_95ecfacefbe989a282e80086da78c813",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "846ef344dc875c30b8c5aaaf62ef71d2629011a265605d75cc3bb278066579eb",
    "claimKind": "verification",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-2 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 22,
    "endLine": 22,
    "textDigest": "846ef344dc875c30b8c5aaaf62ef71d2629011a265605d75cc3bb278066579eb",
    "sample": "Added in candidate: Candidate design evidence cited by docs/specs/runner.md:999 RUL40, sections 3.3, 4 and 14 H1. Source transport line references and proposed recommendations are ",
    "identityFingerprint": "9e798603223e142a812bc324ac5bf77201d1136b838951798f307fe5d9a25373",
    "ancestry": [
      "Visibility và Interactive Contact trong Dispatch & Execution — herdr-spawn là candidate đầu tiên"
    ],
    "text": "Added in candidate: Candidate design evidence cited by docs/specs/runner.md:999 RUL40, sections 3.3, 4 and 14 H1. Source transport line references and proposed recommendations are preserved as dated text. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_95ecfacefbe989a282e80086da78c813"
}
```

## Entry claim_98ebe3a997b0c8659ea9f7324520ee5d

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_98ebe3a997b0c8659ea9f7324520ee5d",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "unitDigest": "2f37412668eeb88ba8433203b7924b157bf677266e599c54366a47ab55577326",
    "identityFingerprint": "2f37412668eeb88ba8433203b7924b157bf677266e599c54366a47ab55577326",
    "claimId": "claim_98ebe3a997b0c8659ea9f7324520ee5d",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "12a5df8d364b96c50c0dc7f473107fb827c25f59b0e1d6cf8bbc7c9f71957412",
    "claimKind": "decision",
    "status": "future"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "unitDigest": "2f37412668eeb88ba8433203b7924b157bf677266e599c54366a47ab55577326",
    "identityFingerprint": "2f37412668eeb88ba8433203b7924b157bf677266e599c54366a47ab55577326",
    "claimId": "claim_98ebe3a997b0c8659ea9f7324520ee5d",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "12a5df8d364b96c50c0dc7f473107fb827c25f59b0e1d6cf8bbc7c9f71957412",
    "claimKind": "decision",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-2 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 23,
    "endLine": 23,
    "textDigest": "12a5df8d364b96c50c0dc7f473107fb827c25f59b0e1d6cf8bbc7c9f71957412",
    "sample": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Placement in decisions does not declare th",
    "identityFingerprint": "2f37412668eeb88ba8433203b7924b157bf677266e599c54366a47ab55577326",
    "ancestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ],
    "text": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Placement in decisions does not declare the subject retired. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: R9-1: link-only rebase; label and repository referent preserved (docs/specs/confinement-authority.md); R9-1: link-only rebase; label and repository referent preserved (plans/261002-1339-request-to-run-p6-herdr-posture-quota/reports/acceptance-herdr.md). The verbatim carried retired heading holds 11 current decision records: 0047, 0052 and 0055–0063; partly superseded clauses keep their dated historical meaning (including 0062 R3_PENDING_WORK_CALLERS, superseded by 0063). Carried `runner.md:<line>` self-citations are stale line references; numbers and historical decision text retained."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_98ebe3a997b0c8659ea9f7324520ee5d"
}
```

## Entry claim_691012acd7d87837798c16366ea07269

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_691012acd7d87837798c16366ea07269",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/vision.md",
    "unitDigest": "55a2a5cbbd2bfdd82a45df1ce59d10e72d61f0937205ca51154501ed0874b714",
    "identityFingerprint": "55a2a5cbbd2bfdd82a45df1ce59d10e72d61f0937205ca51154501ed0874b714",
    "claimId": "claim_691012acd7d87837798c16366ea07269",
    "sourceAnchor": "unheaded-block-14",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a70ffde1724c48b9beda0dec51c63b4e438e835d6c2c8ff2672d080fb7a61fc9",
    "claimKind": "vision",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/vision.md",
    "unitDigest": "55a2a5cbbd2bfdd82a45df1ce59d10e72d61f0937205ca51154501ed0874b714",
    "identityFingerprint": "55a2a5cbbd2bfdd82a45df1ce59d10e72d61f0937205ca51154501ed0874b714",
    "claimId": "claim_691012acd7d87837798c16366ea07269",
    "sourceAnchor": "unheaded-block-14",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a70ffde1724c48b9beda0dec51c63b4e438e835d6c2c8ff2672d080fb7a61fc9",
    "claimKind": "vision",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-14 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-14",
    "githubAnchor": "unheaded-block-14",
    "stableAnchor": "unheaded-block-14",
    "title": "Unheaded block 14",
    "startLine": 85,
    "endLine": 92,
    "textDigest": "a70ffde1724c48b9beda0dec51c63b4e438e835d6c2c8ff2672d080fb7a61fc9",
    "sample": "| Need | Read |\n| --- | --- |\n| Preserved platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| Platform laws | [platform-foundations.md](platform-fo",
    "identityFingerprint": "55a2a5cbbd2bfdd82a45df1ce59d10e72d61f0937205ca51154501ed0874b714",
    "ancestry": [
      "Platform Vision",
      "6. Related Anchors"
    ],
    "text": "| Need | Read |\n| --- | --- |\n| Preserved platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| Platform laws | [platform-foundations.md](platform-foundations.md) |\n| Whole-system architecture | [architecture-map.md](architecture-map.md) |\n| Component authority map | [component-boundary.md](component-boundary.md) |\n| Documentation governance | [governance.md](governance.md) |\n| Legacy full law source | [platform-foundations.md](platform-foundations.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_691012acd7d87837798c16366ea07269"
}
```

## Entry claim_8e9ebcebb330c66d2fff49033dacbd0e

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_8e9ebcebb330c66d2fff49033dacbd0e",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/README.md",
    "unitDigest": "105ae4a0705755587860b15337617bf3e7afca656c37d3632d2e0f004f91ef8a",
    "identityFingerprint": "105ae4a0705755587860b15337617bf3e7afca656c37d3632d2e0f004f91ef8a",
    "claimId": "claim_8e9ebcebb330c66d2fff49033dacbd0e",
    "sourceAnchor": "unheaded-block-7",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "524d4be6ecf625d339cbfe75ba8f5cff2773256df5c3c69d5916176c0cd8d5d7",
    "claimKind": "navigation",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/work-state/README.md",
    "unitDigest": "105ae4a0705755587860b15337617bf3e7afca656c37d3632d2e0f004f91ef8a",
    "identityFingerprint": "105ae4a0705755587860b15337617bf3e7afca656c37d3632d2e0f004f91ef8a",
    "claimId": "claim_8e9ebcebb330c66d2fff49033dacbd0e",
    "sourceAnchor": "unheaded-block-7",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "524d4be6ecf625d339cbfe75ba8f5cff2773256df5c3c69d5916176c0cd8d5d7",
    "claimKind": "navigation",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-7 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-7",
    "githubAnchor": "unheaded-block-7",
    "stableAnchor": "unheaded-block-7",
    "title": "Unheaded block 7",
    "startLine": 61,
    "endLine": 61,
    "textDigest": "524d4be6ecf625d339cbfe75ba8f5cff2773256df5c3c69d5916176c0cd8d5d7",
    "sample": "A third retained source, [docs/platform/vision.md](../vision.md), is not covered by this candidate area. It belongs to the platform vision candidate [vision.md](../vision.md).",
    "identityFingerprint": "105ae4a0705755587860b15337617bf3e7afca656c37d3632d2e0f004f91ef8a",
    "ancestry": [
      "Work State",
      "4. Legacy Source Pointers"
    ],
    "text": "A third retained source, [docs/platform/vision.md](../vision.md), is not covered by this candidate area. It belongs to the platform vision candidate [vision.md](../vision.md)."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_8e9ebcebb330c66d2fff49033dacbd0e"
}
```

## Entry claim_96d22d52a8bd25dcdd9395b0791be6a2

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_96d22d52a8bd25dcdd9395b0791be6a2",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/README.md",
    "unitDigest": "26d995773d3f4b2d41c1298c031535ef386adceb967294898556df497106814b",
    "identityFingerprint": "26d995773d3f4b2d41c1298c031535ef386adceb967294898556df497106814b",
    "claimId": "claim_96d22d52a8bd25dcdd9395b0791be6a2",
    "sourceAnchor": "unheaded-block-8",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "50166225fa6e613bcfca2c49780c21d5bc358877822d2d20ad1ce8adcfee116a",
    "claimKind": "navigation",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/work-state/README.md",
    "unitDigest": "26d995773d3f4b2d41c1298c031535ef386adceb967294898556df497106814b",
    "identityFingerprint": "26d995773d3f4b2d41c1298c031535ef386adceb967294898556df497106814b",
    "claimId": "claim_96d22d52a8bd25dcdd9395b0791be6a2",
    "sourceAnchor": "unheaded-block-8",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "50166225fa6e613bcfca2c49780c21d5bc358877822d2d20ad1ce8adcfee116a",
    "claimKind": "navigation",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-8 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-8",
    "githubAnchor": "unheaded-block-8",
    "stableAnchor": "unheaded-block-8",
    "title": "Unheaded block 8",
    "startLine": 65,
    "endLine": 75,
    "textDigest": "50166225fa6e613bcfca2c49780c21d5bc358877822d2d20ad1ce8adcfee116a",
    "sample": "| Relationship | File |\n| --- | --- |\n| candidate spec | [spec.md](spec.md) |\n| candidate CLI input/output contract | [contracts/cli-io-contract.md](contracts/cli-io-contract.md) |",
    "identityFingerprint": "26d995773d3f4b2d41c1298c031535ef386adceb967294898556df497106814b",
    "ancestry": [
      "Work State",
      "5. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| candidate spec | [spec.md](spec.md) |\n| candidate CLI input/output contract | [contracts/cli-io-contract.md](contracts/cli-io-contract.md) |\n| candidate implementation pointers | [architecture/implementation-pointers.md](architecture/implementation-pointers.md) |\n| candidate retired decision history | [decisions/retired-decision-history.md](decisions/retired-decision-history.md) |\n| candidate harness distill record | [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md) |\n| legacy owner | [../../specs/work-state.md](../../specs/work-state.md) |\n| legacy owner | [../../io-contract.md](../../io-contract.md) |\n| retained source for the platform vision candidate | [../vision.md](../vision.md) |\n| platform vision candidate | [../vision.md](../vision.md) |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_96d22d52a8bd25dcdd9395b0791be6a2"
}
```

## Entry claim_21d32d019d7a6656f2595c5b4d600929

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_21d32d019d7a6656f2595c5b4d600929",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "47f83d8d383a22d29f809cacdd7fdc8e73d5982d8aa670ed2b034a53a76f9bec",
    "identityFingerprint": "47f83d8d383a22d29f809cacdd7fdc8e73d5982d8aa670ed2b034a53a76f9bec",
    "claimId": "claim_21d32d019d7a6656f2595c5b4d600929",
    "sourceAnchor": "unheaded-block-10",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "claimKind": "contract",
    "status": "future"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "47f83d8d383a22d29f809cacdd7fdc8e73d5982d8aa670ed2b034a53a76f9bec",
    "identityFingerprint": "47f83d8d383a22d29f809cacdd7fdc8e73d5982d8aa670ed2b034a53a76f9bec",
    "claimId": "claim_21d32d019d7a6656f2595c5b4d600929",
    "sourceAnchor": "unheaded-block-10",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "claimKind": "contract",
    "status": "future",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-10 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-10",
    "githubAnchor": "unheaded-block-10",
    "stableAnchor": "unheaded-block-10",
    "title": "Unheaded block 10",
    "startLine": 83,
    "endLine": 90,
    "textDigest": "fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9",
    "sample": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: ",
    "identityFingerprint": "47f83d8d383a22d29f809cacdd7fdc8e73d5982d8aa670ed2b034a53a76f9bec",
    "ancestry": [
      "CLI I/O Contract",
      "2. Input Direction Verb And Identity",
      "Writer Source Trust Levels"
    ],
    "text": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·\n  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,\n  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là\n  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn\n  `source` nói giá trị chưa kiểm chứng được)."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_21d32d019d7a6656f2595c5b4d600929"
}
```

## Entry claim_1ab7bc54b3da5ee01116bf30dfa11cef

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_1ab7bc54b3da5ee01116bf30dfa11cef",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/work-state/spec.md",
    "unitDigest": "d91b60e8559dbd6947e489c15000ac7de127e7da59471fbc30c401de31ce5007",
    "identityFingerprint": "d91b60e8559dbd6947e489c15000ac7de127e7da59471fbc30c401de31ce5007",
    "claimId": "claim_1ab7bc54b3da5ee01116bf30dfa11cef",
    "sourceAnchor": "unheaded-block-99",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ae8351ddf33a5f98ffee186a0df1514290ab474129e31446c6c5668ee12d69d2",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/platform/work-state/spec.md",
    "unitDigest": "d91b60e8559dbd6947e489c15000ac7de127e7da59471fbc30c401de31ce5007",
    "identityFingerprint": "d91b60e8559dbd6947e489c15000ac7de127e7da59471fbc30c401de31ce5007",
    "claimId": "claim_1ab7bc54b3da5ee01116bf30dfa11cef",
    "sourceAnchor": "unheaded-block-99",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ae8351ddf33a5f98ffee186a0df1514290ab474129e31446c6c5668ee12d69d2",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-99 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-99",
    "githubAnchor": "unheaded-block-99",
    "stableAnchor": "unheaded-block-99",
    "title": "Unheaded block 99",
    "startLine": 1198,
    "endLine": 1204,
    "textDigest": "ae8351ddf33a5f98ffee186a0df1514290ab474129e31446c6c5668ee12d69d2",
    "sample": "- [README.md](README.md)\n- [contracts/cli-io-contract.md](contracts/cli-io-contract.md)\n- [architecture/implementation-pointers.md](architecture/implementation-pointers.md)\n- [deci",
    "identityFingerprint": "d91b60e8559dbd6947e489c15000ac7de127e7da59471fbc30c401de31ce5007",
    "ancestry": [
      "Work State Specification",
      "16. Related Files"
    ],
    "text": "- [README.md](README.md)\n- [contracts/cli-io-contract.md](contracts/cli-io-contract.md)\n- [architecture/implementation-pointers.md](architecture/implementation-pointers.md)\n- [decisions/retired-decision-history.md](decisions/retired-decision-history.md)\n- [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md)\n- [docs/specs/work-state.md](../../specs/work-state.md)\n- [docs/platform/work-state/contracts/cli-io-contract.md](contracts/cli-io-contract.md)"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_1ab7bc54b3da5ee01116bf30dfa11cef"
}
```

## Entry claim_2bdbea8cb68325ec8b5b8d1a62447f4d

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "fbe5d6fd0ce9627c67421db7c086913618d8ad8869441187e3f6b37c36177f77",
    "identityFingerprint": "fbe5d6fd0ce9627c67421db7c086913618d8ad8869441187e3f6b37c36177f77",
    "claimId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219",
    "claimKind": "navigation",
    "status": "current",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/reading-map.md",
    "unitDigest": "fbe5d6fd0ce9627c67421db7c086913618d8ad8869441187e3f6b37c36177f77",
    "identityFingerprint": "fbe5d6fd0ce9627c67421db7c086913618d8ad8869441187e3f6b37c36177f77",
    "claimId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219",
    "claimKind": "navigation",
    "status": "current",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-16 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-16",
    "githubAnchor": "unheaded-block-16",
    "stableAnchor": "unheaded-block-16",
    "title": "Unheaded block 16",
    "startLine": 131,
    "endLine": 183,
    "textDigest": "9a08a47745ab1aaa1c00c35a181813b16ff2e9f12eb14332d3993c9009d36219",
    "sample": "- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned",
    "identityFingerprint": "fbe5d6fd0ce9627c67421db7c086913618d8ad8869441187e3f6b37c36177f77",
    "ancestry": [
      "Documentation Reading Map",
      "5. Detailed Product And Source Map"
    ],
    "text": "- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)\n- `docs/architecture-map.md` — bản chuẩn kiến trúc (v0.2, record ADR0010 (bản đồ kiến trúc là bản chuẩn)): 5 tầng + 2 lớp phủ, sổ component + sổ contract (CTR001–CTR009), nghi thức thẻ-căn-cước-trước-code\n- `docs/work-item-lifecycle-vision.md` — tầm nhìn nền tảng: chu trình sống của work-item (mixed-autonomy, base-workflow + domain-extension); khung cho các PBI STR14-STR18\n- `docs/platform/packaging-distribution/README.md` — portal hiện hành cho packaging/distribution: `fgctl` bootstrap/init/repair/upgrade, workspace activation, doctor/fix readiness, legacy Node compatibility, skill/instruction projections. Khi mục này mâu thuẫn với `docs/specs/distribution.md`, đọc portal + implementation-alignment trước; `docs/specs/distribution.md` hiện là legacy/generated-curated source trong lúc migration.\n- `docs/distribution-vision.md` — tầm nhìn nền tảng lịch sử: cài đặt/setup/doctor ổn định + tái dùng được (không cần clone, global/project không xung đột — project ghi đè global, doctor/setup tự fix hạ tầng + merge config thiếu, module mới tự đăng ký năng lực config, CI như một phần của setup); đã được promote/supersede từng phần vào `docs/platform/packaging-distribution/vision.md`.\n- `docs/specs/` — state layer: area spec + system-overview + bản đồ này\n- `docs/routing-handoff-contract.md` — hợp đồng handoff agent↔agent + ranh giới tin cậy\n- `docs/io-contract.md` — hợp đồng giao tiếp VÀO/RA của cửa CLI + bề mặt stdout `fgos-runner` (str46-io-contract): danh tính `writer`/`role`, envelope `fgos.v1` + ngoại lệ có lý do, exit-code một nguồn, sổ verb (`touchesState`/`externalEffect`/`paginated`/`multiValueFormat`), version token, ranh giới ngoài (STR38/STR48/STR83)\n- `docs/coexistence.md` — doctrine chạy cạnh một harness agent khác (record ADR0009 (chống giao thoa lúc cài — fgOS khi cài không giao thoa tiến trình với harness khác)): lãnh địa, một-nhạc-trưởng-mỗi-phiên, nhường-nhịn lúc `init`, manifest `.fgos/coexistence.json`, Known Gaps chưa flip; `src/install/coexist.mjs` — cài đặt detection + manifest (read-only, không đè)\n- `package.json` (`version`, `files`, `bin.fgos`, `bin.fgos-runner`) + `README.md` (mục `## Install`) — cài `fgos` VÀ `fgos-runner` từ ngoài source repo qua GitHub install, cả hai executable ngay sau cài; `test/install-packaging.test.mjs` — proof e2e (pack → install → chạy từ project ngoài, gồm cả hai binary); spec: docs/specs/distribution.md\n- `scripts/fgos-shell-integration.sh` — dev checkout shell helper (STR87 first slice): hàm `fgos`/`fgos-runner` tự resolve root qua `git rev-parse --git-common-dir` (worktree-safe), source từ shell profile của contributor, không cài đặt gì; test: `test/scripts/fgos-shell-integration.test.mjs`; spec: docs/specs/distribution.md §Dev checkout shell helpers\n- `src/setup/` (`ansi.mjs`, `config-merge.mjs`, `shell-rc.mjs`, `checks.mjs`) + `bin/fgos.mjs`'s current legacy `setup`/`doctor` verbs + `src/cli/command-registry.mjs` entries — doctor/fix registry and legacy setup compatibility: `doctor` chẩn đoán read-only, `doctor --fix` chạy registered fixes, current Node `fgos setup` vẫn tồn tại nhưng target architecture supersedes onboarding bằng `fgctl init` + local `fgos init` / `fgos doctor --fix` / `fgos doctor`; manifest: `docs/architecture-manifest.json`; test: `test/setup/*.test.mjs`; current portal: `docs/platform/packaging-distribution/README.md`; legacy spec: docs/specs/distribution.md §Setup, §Doctor\n- `docs/decisions/` — hồ sơ quyết định dài hạn cho người ngoài (decision records); từ str64-backfill, mỗi record còn mang đầu-mô-tả OKF-style (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn, xem `frontmatter.mjs` dòng dưới) và được `fgos docs-index` công nhận là vị trí thay thế của ngăn `explanation` (R10, spec: docs/specs/enduser-docs-index.md) — thân ADR không đổi, chỉ thêm đầu-mô-tả; lưu ý `orchestrator` là pinned term đã đổi nghĩa giữa chừng (0026→0028 nghĩa cũ \"launcher\", 0029 nghĩa mới \"tầng hợp thành T0\"; xem chuỗi quyết định tại `docs/decisions/index.md` dòng 28-32)\n- `scripts/check-decision-citation-drift.mjs` + `test/scripts/check-decision-citation-drift.test.mjs` — quét `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế trên cùng dòng (STR72 CoS clause 2, PBI p-2d71dfc3); chỉ phát hiện, không tự sửa; spec: docs/specs/decision-citation-drift.md\n- `scripts/check-decision-codes.mjs` + `test/scripts/check-decision-codes.test.mjs` — quét `test/**/*.test.mjs` tìm tên test còn nhúng mã quyết định nội bộ (str##/D#/RUL##/STR##/tsk-xxx) thay vì mô tả bất biến bằng lời thường (review-audit-self-decision.md mục Stable Code Artifacts); chặn (ratchet) chỉ vi phạm MỚI so với `scripts/check-decision-codes.baseline.json` đã chốt, không chặn ngược nợ cũ; `npm test` tự chạy qua glob `test/**/*.test.mjs`, không hook riêng\n- `docs/id-systems-audit.md` — audit + quyết định hình dạng mọi hệ id/mã đang sống trong hệ thống (work.id/kind/Story/ADR/Rule/Contract phía fgOS; D-hex/D-local/cell-id/feature-slug/severity phía bee) — nguồn cho `work.id`'s `tsk-<hash>` và các migration STR53-STR58 (tất cả đã `done`); boundary appendix: `docs/architecture-map.md` Phụ lục B\n- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; gồm verb `edit` — sửa đè các trường (title/kind/risk/verify/tier/refs/deps/acceptance/priority/intent — str7-str8-priority-intent) trên một item đã có, cùng cửa ghi CTR002 như `add`/`move`; gồm verb `take`/`return` — cửa pull giao–nhận việc cho tác nhân ngoài runner; gồm verb `pick` — cửa pull GỘP `take` + dựng workspace (`createWorktree`), role cố định `session`, không cờ `--role` (theo str83-fgos-slash-commands); gồm verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, một cổng cho mọi đề xuất `awaiting-approval`, nay leaf-vs-root-aware (con nhập vào nhánh của gốc, gốc nhập vào cây chính); `review`/`approve` nay chấp nhận thêm `--github [--pr <n>]` — vận chuyển thay thế CÙNG cổng duyệt qua GitHub thay vì diff/merge cục bộ (chỉ nguồn runner, theo github-adapter, spec: docs/specs/runner.md); gồm verb `catchup` — đồng bộ lại một việc đỗ vì gãy nhập/trôi tích hợp (spec: docs/specs/runner.md); gồm verb `session` (`start`/`end`/`list`) — vòng đời phiên checkout đa-phiên tùy chọn, mỗi phiên một worktree detached-HEAD cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink (spec: docs/specs/runner.md); spec: docs/specs/work-state.md\n- `src/state/` — lõi work-state: events (nhật ký; `appendEvent` nay khóa liên-tiến-trình `.fgos/events.lock`, per fgos-multi-session-checkout Epic 3/STR35 — xem spec Work-State RUL10 (tiền đề có ngưỡng — một người ghi tại một thời điểm; multi-agent ghi đồng thời qua `.fgos/events.lock`)), work (schema — STATUSES + STAGES + field `parent` lineage + field `domain`), fsm (bảng chuyển status + CAS), stage (bảng chuyển stage + CAS, chiều vĩ mô song song fsm; cạnh chuyển-stage tra theo domain của item — `coding`: `discovery → exploring → planning → executing`, trong đó phán-quyết `clear` ở `discovery` bỏ qua `exploring` để sang thẳng `planning` còn `unclear` đi qua `exploring`; tên `decompose` vẫn còn nhưng chỉ là bí danh legacy chỉ-để-rút-cạn (không việc MỚI nào vào được nữa); `synthetic`: một stage, không cạnh nào), domains (sổ đăng ký domain — stage list + step-mapping base-workflow + cạnh-chuyển mỗi domain; `coding` + ba domain minh họa/thử-nghiệm `synthetic` (đúng một stage), `triage`, `fixture-marketing`; base-workflow-model STR18, hoàn tất S1+S2), replay (fold), frontier (truy vấn sẵn-sàng — lọc theo status, stage domain-aware, VÀ lineage qua `parent`), dep-graph (dò chu trình trên `deps` — bất biến phi-chu-trình tại cửa ghi, per work-graph-intelligence S1), store (chủ ghi duy nhất + readRawEvents), envelope (phong bì output CTR001, `wrapEnvelope` — nay bọc MỌI verb ở một cửa in trong `bin/fgos.mjs main()`, STR37; spec: docs/specs/work-state.md §envelope)\n- `src/cli/command-registry.mjs` — sổ verb máy-đọc của CLI (STR37, kernel, thuần dữ liệu): `SCHEMA_VERSION` + `COMMAND_REGISTRY` (mọi verb với `{name, invoke, description, parameters, examples, access read|mutation, deprecated}`); `bin/fgos.mjs` `--help [--json]` và `<verb> [<sub>] --help [--json]` sinh sổ từ đây; verb có sub-verb mang `subcommands`, `HELP_SELECTORS` (`--help`, `-h`) thành route của Rust host qua `scripts/export-command-selectors.mjs`; test chống-lệch `test/cli/fgos-manifest.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` (cờ handler ↔ schema sub-verb), `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/help-routes.test.mjs` (qua host thật); spec: docs/specs/work-state.md §sổ verb\n- `src/intake/classify.mjs` — logic thuần của `fgos submit`: deriveTitle, classify (tier/kind/risk cơ học), generateId (`tsk-<hash>` chống trùng, STR53)\n- `src/intake/discovery.mjs` — context-discovery của stage `discovery` (stage đầu tiên của domain `coding`): `resolveDiscovery` (đọc-phán-ghi, dùng chung bởi verb `discover` và vòng tự hành) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDiscovery` đã rút; phán-quyết `clear` chuyển item sang stage `planning`, `unclear` sang `exploring`\n- `src/intake/plan.mjs` — phán chia-việc của stage `planning`: `resolvePlan` (đọc-phán-ghi, dùng chung bởi verb `plan` và vòng tự hành khi item ở stage `planning`, hoặc ở bí danh legacy `decompose`) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDecompose` đã rút, cùng lý do `judgeDiscovery` rút; sinh con qua lineage `parent`, không qua `deps`\n- `domains/coding/AGENTS.md` `## fgOS Workflow` + `.claude/skills/` (`.agents/skills/` mirror byte-identical) — lớp hướng dẫn P50: entry skill (`fgos-routing`) + skill giai đoạn (`fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-knowledge`) trỏ một phiên tự mở tới đúng skill theo `stage` của item; từ str89-fgos-domain-skills, tra cứu này domain-pluggable — đọc trường `domain` + `stage` của item rồi tra qua `skillForStep`/`getDomain` (`src/state/domain-registry.mjs`), không còn giả định ngầm domain `coding`; `fgos-routing` nay có hàng khoá theo **status** `retrospective → fgos-coding-knowledge` (skill tổng hợp cấp nhãn Diataxis + soạn tài liệu người-dùng-cuối) — stage `compound-learn` đã rút, việc tổng hợp nó từng canh nay là việc của status `retrospective`; skill ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã rút (tsk-6ar) — `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`) nay tự chạy clarify+classify trong cùng phiên sống, cùng việc mà skill đó từng làm nhưng trên bản mô tả SẠCH hơn; spec: docs/specs/work-state.md §RUL60 (hành vi), docs/specs/runner.md (lớp hướng dẫn) **Truth correction:** src/state/domain-registry.mjs:193,240; core/skills/fgos-routing/SKILL.md:124-136.\n- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 37 wrapper không có tiền tố fgos- trong 55 thư mục skill; `check` không có wrapper. Mỗi wrapper giữ hướng dẫn cửa gọi của riêng nó; spec: docs/specs/fgos-plugin.md **Truth correction:** plugins/fgOS/.claude-plugin/plugin.json:1; plugins/fgOS/skills/submit/SKILL.md:1; plugins/fgOS/skills/answer/SKILL.md:1 (directory enumeration at e7393ea3c).\n- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)\n- `docs/how-to/`, `docs/tutorials/`, `docs/reference/`, `docs/explanation/` — tài liệu NGƯỜI-DÙNG-CUỐI theo bốn quadrant Diataxis (audience-facing, khác `docs/specs/` là BA-reference nội bộ); sinh bởi kỹ năng `fgos-coding-knowledge` ở status `retrospective` (grow-or-create một tài liệu SỐNG mỗi đường dẫn: gom mọi capture qua `fgos doc-sources` rồi tích luỹ không mất, ngăn Diataxis là trục cấu trúc duy nhất — write-side, spec: docs/specs/enduser-docs-authoring.md), quadrant khớp `docType` capture; `docs/explanation/` từ str64-backfill còn có 6 tài liệu chưng cất từ critical-patterns.md (learnings vận hành bee thật sự thuộc tiến trình hình thành fgOS); chỉ mục đọc-theo-tag máy-đọc-được: `docs/enduser-docs-index.json` (sinh bởi verb `fgos docs-index` / kỹ năng `fgos-indexing`, thay cho việc liệt-kê-tay từng tài liệu — supersedes con trỏ văn xuôi cũ, theo compound-learn-enduser-docs; ngăn `explanation` còn quét thêm `docs/decisions/` làm vị trí thay thế, theo str64-backfill); spec read-side: docs/specs/enduser-docs-index.md\n- `src/runner/` + `bin/fgos-runner.mjs` — vòng tự hành (loop/dispatch/worktree/recovery/anti-loop/write-queue/root-affinity); `loop.mjs`'s `runWatch` + `write-queue.mjs`'s `onCommit` — chế độ `--watch` bền, tín hiệu-cơ-học + nghỉ dự phòng, ghép `runOnce` không đổi làm hộp đen (str7-str8-priority-intent, spec: docs/specs/runner.md §RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); loop giao việc theo mẻ song song có giới hạn hai tầng (cấu hình `parallel` trong `.fgos/config.json`'s `runner` section, theo tsk-5vf), giữ quyền-sở-hữu-gốc trong một lượt chạy, quét làm-rõ rồi quét chia-việc trước mọi dispatch thi công; gặt-lại bỏ qua claim của cửa pull (`claimRole` human/session); `dispatch.mjs`'s executor là port có tên CTR009 v2 (`EXECUTOR_ADAPTERS`, per-tier qua config's `executors`, STR41), `ensureRunnerConfigForDir` tự sinh cấu hình mặc định tại `.fgos/config.json` khi vắng mặt (không áp dụng cho `--config` tường minh, str76-runner-bootstrap; tsk-5hv xoá hẳn fallback về file flat legacy cũ); worker của loop và fan-out chạy như một Unit run qua `runUnit` (`work-dispatch.mjs`'s `spawnWorker`), `fgos-runner` không còn `--config` (spec: docs/specs/runner.md §RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) và prompt worker được tách sang `prompt-templates.mjs` + `prompt-templates/*.txt` (chọn template qua bảng cơ học kind/tier/domain, substitution `{placeholder}` thuần, log dispatch kèm tên+hash template, STR49); `goal-check.mjs` — hàm goal-check dùng chung giữa vòng tự hành và verb `return`; `write-queue.mjs` — cửa ghi tuần tự giữ một-người-ghi dưới song song; `root-affinity.mjs` — quyền-sở-hữu-gốc, giữ mọi con của một gốc chung một chủ trong một lượt chạy; `resolveRepoRoot` nay còn xác nhận HEAD repo resolve được trước khi runner claim bất kỳ item nào (fail-fast, str86-runner-headless-git D ecfd0d1a); config: `.fgos/config.json`'s `runner` section (tự sinh khi vắng mặt tại đường mặc định, nguồn config duy nhất kể từ tsk-5hv); spec: docs/specs/runner.md\n- `docs/specs/confinement-authority.md` + `src/runner/dispatch/confinement/` — Agent Confinement Authority: runtime one-door confinement enforcement (`executeThroughConfinement`), machine backend registry `~/.fgos/confinement-backends.json`, local `bwrap` v1 driver with 8 falsification probes, required fail-closed checks, attestation storage (`confinement-attestation.v1`), herdr convergence with shared `evaluateBypassPairing`, setup defaults and doctor checks; spec: docs/specs/confinement-authority.md Pane herdr confine cho agent không phải claude (codex/agy/pi): công thức private-home + account inventory + lịch sử các commit đã đi qua (và vì sao từng bị quên) ở §13.1.\n- `docs/architect/README.md` + `docs/architect/architecture-intent.md` + `docs/architect/domainization/README.md` — portal architect-level, registry intention xuyên-khu-vực, và deep-dive domainization (core đóng vs `domains/<name>/` adapter mở: manifest/workflow YAML, task-spec, skill, knowledge, doctrine, agent, resolver, enforcement); active thread đầu tiên giữ intent mở rộng fgOS từ fan-out/fan-in + artifact mediation thành năng lực group-thinking/problem-solving rộng hơn (Delphi/NGT/RFC/adversarial/master-coordinator), giữ `group-cognition-framework.yaml` isolation-heavy không bị nới ngầm; liên quan Step 09 group-thinking substrate, Step 10 coding-domain adoption, component authority boundary map, và Domain Components And Extension Layer\n- `src/workflow/` (`definition.mjs`, `runner.mjs`, `step-fsm.mjs`, `units-source.mjs`) + `core/workflows/*.yaml` — Workflow engine (Request-to-Run P3a/P4): DAG steps, human gates, dependency scheduling, runner integration; `units-source.mjs` dịch units file của `fgos workflow start --units` thành Workflow tạm (RUL89 (workflow start --units)); spec: `docs/specs/runner.md`\n- `src/runner/execution/` (`unit.mjs`, `bind.mjs`, `run.mjs`, `patterns/`) — Execution Core (Request-to-Run P1/P2/P4): Unit (hợp đồng dữ liệu duy nhất), `bind()` (chọn executor 5 mức), `fgos run` (cửa chạy mới, herdr mặc định), CollaborationPattern (`solo`, `reviewed`, `panel` + presets `consult`, `research-fan-out`, `rfc`, `code-change`); `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi Unit (RUL84 (one write-scope matcher)), dùng cho runner commit, settlement và Workflow; spec: `docs/specs/runner.md`\n- `docs/architect/agent-coordination/` — thiết kế agent-coordination lịch sử (đã thu hồi ở P4 per D-0050, thay bằng Workflow runner và Execution Core); `README.md` là portal ghi nhận chuyển tiếp; `contracts/` lưu giữ hợp đồng lịch sử (`coordination-session.md`, `flow-definition.md`).\n- `docs/architect/host-invocation-routing/` — kiến trúc định tuyến và host runtime Rust (5 tệp: `host-invocation-provider-routing.md` — hợp đồng kernel canonical OperationRequest/ProviderOutcome, pure Router, InvocationService; `legacy-cli-transition.md` — chiến lược exec payload Node với parity harness và descriptor command-routes; `external-provider-protocol.md` — giao thức external provider R2; `node-to-rust-component-migration.md` — lộ trình chuyển dịch component từ Node sang Rust; `rust-cli-and-proof-components-plan.md` — kế hoạch triển khai Rust CLI host và proof components); spec: docs/specs/distribution.md\n- `src/runner/merge.mjs` — cơ chế cổng duyệt PR nội bộ (`classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`), dùng bởi `bin/fgos.mjs` verb `review`/`approve`/`reject`, nay tham số hóa được nhánh đích (cây chính hoặc nhánh của gốc — cây nhánh tích hợp); `catchup` (bin/fgos.mjs) dùng lại cùng cơ chế git cho cả tầng con→gốc lẫn gốc→cây chính; `isMainWorktree` (STR44) — chặn cấu trúc (không dựa sổ đăng ký session) xác nhận `cwd` LÀ worktree chính trước khi `approve` merge/verify, bắt cả worktree tay không đăng ký qua `fgos session start` — cùng `detectTrunk` nay ở `src/runner/worktree.mjs` (theo tsk-49i), không còn ở file này; spec: docs/specs/runner.md\n- `src/verbs/<domain>/<verb>.mjs` — tầng use-case của CLI (theo tsk-49i): logic nghiệp vụ của một verb, chữ ký thống nhất `<verb>UseCase(ctx, options)` — `ctx` là thứ adapter tính từ môi trường (`{dir, cwd?, repoRoot?}`, use-case KHÔNG BAO GIỜ tự đọc `process.cwd()`/`process.env`/argv), `options` là flag đã parse; trả đúng payload `fgos.v1` (bọc envelope + map exit-code vẫn ở `bin/fgos.mjs`), refusal vẫn `throw StoreError`. Cụm đầu tiên: `src/verbs/merge/` (`merge`/`approve`/`review`/`sync-root`/`catchup`/`reject`/`promote-to-component`) — `bin/fgos.mjs` cho 7 verb này nay chỉ parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb, gọi một hàm use-case. Không ngụ ý migrate 7 file use-case-rank sẵn có (`runner/loop.mjs`, `intake/*`, `setup/*`, `state/cursor.mjs`); spec: docs/specs/runner.md\n- `src/report/item-trace.mjs` — trace outcome/friction của MỘT item, đọc thuần trên view (`collectOutcomeEntry`/`collectFrictionData`/`collectReviewTrace`); dùng chung bởi `review` (use-case) và `check`/`show`/`doc-sources`/`evolve` (`bin/fgos.mjs`); spec: docs/specs/runner.md\n- `src/runner/github-adapter.mjs` — vận chuyển GitHub thuần cho cổng duyệt PR nội bộ (`createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR`/`classifyGhFailure`, shell ra `gh` CLI thật, layer infra), dùng bởi `bin/fgos.mjs` verb `review`/`approve --github`; spec: docs/specs/runner.md\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ của trợ lý (`.fgos/logs/<id>.log`, git-ignored): `appendWorkerLog` — khối kết-cục cuối, gọi bởi `loop.mjs` sau mỗi lượt dispatch; `appendWorkerLogChunk` — live tee từng chunk stdout/stderr khi đến (STR39), gọi bởi `dispatch.mjs`'s `spawnWorker` qua `opts.onChunk`; spec: docs/specs/runner.md\n- `src/runner/session.mjs` — vòng đời phiên checkout đa-phiên tùy chọn (fgos-multi-session-checkout, STR35): `createSession`/`endSession`/`listSessions`/`reclaimOrphanedSessions`, worktree detached-HEAD mỗi phiên (`git worktree add --detach`), `.fgos` symlink dùng chung (KHÔNG BAO GIỜ sao chép), sổ `.fgos/sessions.json` canh bởi `.fgos/sessions.lock` riêng; dùng bởi `bin/fgos.mjs` verb `session`; spec: docs/specs/runner.md\n- `packages/observe/rust/src/metrics_cli/entropy.rs` — tín hiệu entropy-trend + đếm compounding (thuần, đọc trên view work-state), surfaced qua `fgos metrics entropy`; spec: docs/specs/runner.md\n- `src/report/enduser-index.mjs` — bộ sinh CHỈ MỤC đọc-theo-tag tài liệu người-dùng-cuối (biến đổi dữ liệu, không tự thực hiện I/O; ghi chú mirror entropy trong source là lịch sử, `src/report/entropy.mjs` không còn): `QUADRANTS`, bảng nguồn-sự-thật `QUADRANT_META` (quadrant→{purpose,audience}), `QUADRANT_DIR_ALIASES` (quadrant→vị trí thay thế trên đĩa, theo str64-backfill; hiện `explanation`→`['decisions']`), `findSourceCaptureId` (gom một, cho chỉ mục), `findSourceCaptureIds` (gom mọi capture của một đường dẫn, cho `doc-sources`), `buildEnduserIndex`; I/O + verb `fgos docs-index` (quét cả thư mục chính lẫn `QUADRANT_DIR_ALIASES`, ghi manifest `docs/enduser-docs-index.json`) và verb `fgos doc-sources <docPath>` (gom nguồn của một đường dẫn) sống ở `bin/fgos.mjs`, cả hai quyền `read`; vận hành chỉ mục: kỹ năng `fgos-indexing`; spec: docs/specs/enduser-docs-index.md **Truth correction:** src/report/enduser-index.mjs:1-17; packages/observe/rust/src/metrics_cli/entropy.rs:1.\n- `src/report/frontmatter.mjs` — bộ đọc/ghi đầu-mô-tả OKF-style của mỗi tài liệu người-dùng-cuối (thuần, không I/O, không phụ thuộc thư viện ngoài — theo str64-backfill): `parseFrontmatter`/`renderFrontmatter` (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn); tách biệt với bộ sinh chỉ mục — đầu-mô-tả là bản sao ghi-lúc-soạn, KHÔNG phải nguồn thẩm quyền của linkage; spec: docs/specs/enduser-docs-index.md\n- Historical `src/evolve/candidates.mjs` — path not present at this commit; `src/report/entropy.mjs`, `listUnsettledFrictionsByWork` và verb `fgos evolve` cũng không còn. Tín hiệu entropy hiện ở `packages/observe/rust/src/metrics_cli/entropy.rs`, qua `fgos metrics entropy`; không có cửa candidate ranking được mô tả ở câu cũ. **Truth correction:** src/cli/command-registry.mjs:98,204-207; packages/observe/rust/src/metrics_cli/entropy.rs:1; src/evolve/iron-law.mjs:1 (only current src/evolve file; full src/bin/packages symbol search has no old ranking symbol).\n- `src/state/impact.mjs` — backlog-triage impact ranking (STR21, cửa 2 của triage — tách bạch khỏi STR14 intake-triage): thuần, xếp hạng item CHƯA `done` theo `blocks` (số item khác chưa `done` liệt kê nó trong `deps`); surfaced qua `fgos triage`; spec: docs/specs/work-state.md\n- `src/state/awaiting-context.mjs` — neo gốc cho cổng chờ-người (str61-chat-context-continuity): thuần, đọc trên view work-state, tính `{parent, changedSinceAsk?}` cho một item `awaiting-human` có `parent` mỗi lần đọc (không lưu trữ); surfaced qua `fgos list`'s khóa cộng thêm `awaitingContext`; spec: docs/specs/work-state.md §RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2, kernel layer, dùng chung giữa `classify.mjs` và `iron-law.mjs`); spec: docs/specs/runner.md\n- `src/evolve/iron-law.mjs` — Iron Law risk classifier cho vòng tự cải thiện (self-improve loop, STR13 Slice 2): thuần, đã được gọi qua `src/runner/iron-law-gate.mjs` (import và gọi `classifyIronLaw`); spec: docs/specs/runner.md **Truth correction:** src/evolve/iron-law.mjs:64; src/runner/iron-law-gate.mjs:20,59.\n- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`.\n- `test/` — node:test suite (`npm test`; tổng số test lịch sử 2970 chưa được đếm lại): smoke + state + cli + runner + report + e2e (rebuild-determinism, runner-loop — gồm kịch bản cửa pull S2-pull + con fork từ tip nhánh gốc, pr-gate — 4 kịch bản trọn vòng review/approve/reject, dispatch song song thật với cửa sổ chồng-lấn đo được); benchmark lịch sử ngoài suite (F4): `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` — path not present at this commit; không có benchmark hiện hành ở đường dẫn này **Truth correction:** package.json:28 (scripts.test); git ls-tree e7393ea3c docs/history/phase-3-compound-learning (no entries).\n- `scripts/run-test-canary.mjs` (`npm run test:canary -- <file...>`) + `scripts/test-select.mjs` (`npm run test:related -- --explain`, plus `test:related:shadow` for evidence-gathering; manifest: `test/test-ownership.mjs`) — additive fast test-feedback doors, `npm test` unchanged/authoritative either way; how-to: `docs/how-to/use-fast-test-feedback-commands.md`; plan: `archive/plans/260920-immediate-test-feedback-reduction/plan.md` **Truth correction:** archive/plans/260920-immediate-test-feedback-reduction/plan.md:5.\n- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored; `.fgos/logs/<id>.log` — bản ghi output cục bộ của trợ lý theo từng việc, gitignored (spec: docs/specs/runner.md)\n- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent (bản sản phẩm — thuần forgent)"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_2bdbea8cb68325ec8b5b8d1a62447f4d"
}
```

## Entry claim_26f62a1ae1abc17d0f02706788bfd399

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_26f62a1ae1abc17d0f02706788bfd399",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/distribution.md",
    "unitDigest": "1a72acf07f83fb86940d7242f60ed89cc80b9fa5ff85e4f69a25976849d34e4d",
    "identityFingerprint": "1a72acf07f83fb86940d7242f60ed89cc80b9fa5ff85e4f69a25976849d34e4d",
    "claimId": "claim_26f62a1ae1abc17d0f02706788bfd399",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "claimKind": "specification",
    "status": "current"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/specs/distribution.md",
    "unitDigest": "1a72acf07f83fb86940d7242f60ed89cc80b9fa5ff85e4f69a25976849d34e4d",
    "identityFingerprint": "1a72acf07f83fb86940d7242f60ed89cc80b9fa5ff85e4f69a25976849d34e4d",
    "claimId": "claim_26f62a1ae1abc17d0f02706788bfd399",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "claimKind": "specification",
    "status": "current",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-5 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 57,
    "endLine": 73,
    "textDigest": "034305c494ee289535b1b4121c8b90ed9d2eb5b850364e1c2a63e936221d40e3",
    "sample": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based i",
    "identityFingerprint": "1a72acf07f83fb86940d7242f60ed89cc80b9fa5ff85e4f69a25976849d34e4d",
    "ancestry": [
      "Spec: Distribution",
      "Data Dictionary"
    ],
    "text": "| # | Element | Meaning | Values | Required | Default |\n|---|-------|---------|--------|----------|---------|\n| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |\n| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |\n| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |\n| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |\n| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |\n| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |\n| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |\n| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |\n| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |\n| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |\n| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |\n| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |\n| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn, and, when the machine-global provider inventory was read, copies of any age in a store directory the account's login store layout no longer reads fail, naming the directory for hand recovery (when the global config cannot be read or is refused by the validator the check fails, says the layout was not checked with the reason, lists copies at any age and promises nothing about a dispatch); interrupted stagings (pending/.tmp-*) are reported too once their writer is gone and they have sat for ten minutes, and the over-limit line names the store; kept homes under a registered backend's temp and private-home roots are scanned, which the orphan reaper check does not do, and one there counts as held at once because nothing retries it; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no \"prefer\" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \"Trust this folder?\" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-posture-coverage` (core capabilities execute, code:implement, and capabilities declaring a pool have at least one candidate executor capable of applying required posture; dry simulation via bind(), no process spawn), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `runner-generated-paths` (validates runner.generatedPaths source-to-render-target mappings), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |\n| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, and any kept home under a registered backend's own root, which nothing else retries, under the account lock, and removes one only when its login is shown applied or obsolete; also removes an interrupted staging (pending/.tmp-*) only after claiming it by rename, when its writer is gone and it is empty, identical to a copy already kept, or shown no newer than the source login under the account lock; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |\n| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_26f62a1ae1abc17d0f02706788bfd399"
}
```

## Entry claim_a7278e1567e5432cfb079506cf2f5050

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_a7278e1567e5432cfb079506cf2f5050",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/observe.md",
    "unitDigest": "bd804dc9854498f7e08241b3b71de0cbce283de029c0e1cddecde756bad29d50",
    "identityFingerprint": "bd804dc9854498f7e08241b3b71de0cbce283de029c0e1cddecde756bad29d50",
    "claimId": "claim_a7278e1567e5432cfb079506cf2f5050",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
    "claimKind": "specification",
    "status": "current"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/specs/observe.md",
    "unitDigest": "bd804dc9854498f7e08241b3b71de0cbce283de029c0e1cddecde756bad29d50",
    "identityFingerprint": "bd804dc9854498f7e08241b3b71de0cbce283de029c0e1cddecde756bad29d50",
    "claimId": "claim_a7278e1567e5432cfb079506cf2f5050",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
    "claimKind": "specification",
    "status": "current",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-3 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 13,
    "endLine": 17,
    "textDigest": "1840cc4b1da22587ed69755276cad9a882139c62a36179d8fba2269905414623",
    "sample": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`,",
    "identityFingerprint": "bd804dc9854498f7e08241b3b71de0cbce283de029c0e1cddecde756bad29d50",
    "ancestry": [
      "Observe Component Specification",
      "1. Overview & Boundaries",
      "Owns"
    ],
    "text": "- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).\n- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).\n- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).\n- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`).\n- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai."
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_a7278e1567e5432cfb079506cf2f5050"
}
```

## Entry claim_d956ba3fb9a8cce9589194e5f59d021f

```json
{
  "kind": "native-state-transition",
  "claimId": "claim_d956ba3fb9a8cce9589194e5f59d021f",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/specs/reading-map.md",
    "unitDigest": "ec317fc75a4fbe4a7f332e9360a594eb87ec74142e07972863d7b27c3df2dd49",
    "identityFingerprint": "ec317fc75a4fbe4a7f332e9360a594eb87ec74142e07972863d7b27c3df2dd49",
    "claimId": "claim_d956ba3fb9a8cce9589194e5f59d021f",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30",
    "claimKind": "specification",
    "status": "current"
  },
  "after": {
    "kind": "identityGaps",
    "sourcePath": "docs/specs/reading-map.md",
    "unitDigest": "ec317fc75a4fbe4a7f332e9360a594eb87ec74142e07972863d7b27c3df2dd49",
    "identityFingerprint": "ec317fc75a4fbe4a7f332e9360a594eb87ec74142e07972863d7b27c3df2dd49",
    "claimId": "claim_d956ba3fb9a8cce9589194e5f59d021f",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30",
    "claimKind": "specification",
    "status": "current",
    "identityStatus": "identity-gap",
    "gapReason": "edited unit whose anchor unheaded-block-2 is not a stable heading anchor"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 11,
    "endLine": 63,
    "textDigest": "3cb37dbc28864019579211dcadd7e189fb667783946e770ad45a9a81c2ca5b30",
    "sample": "- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned",
    "identityFingerprint": "ec317fc75a4fbe4a7f332e9360a594eb87ec74142e07972863d7b27c3df2dd49",
    "ancestry": [
      "Reading Map (sản phẩm)"
    ],
    "text": "- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md\n- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)\n- `docs/architecture-map.md` — bản chuẩn kiến trúc (v0.2, record ADR0010 (bản đồ kiến trúc là bản chuẩn)): 5 tầng + 2 lớp phủ, sổ component + sổ contract (CTR001–CTR009), nghi thức thẻ-căn-cước-trước-code\n- `docs/work-item-lifecycle-vision.md` — tầm nhìn nền tảng: chu trình sống của work-item (mixed-autonomy, base-workflow + domain-extension); khung cho các PBI STR14-STR18\n- `docs/platform/packaging-distribution/README.md` — portal hiện hành cho packaging/distribution: `fgctl` bootstrap/init/repair/upgrade, workspace activation, doctor/fix readiness, legacy Node compatibility, skill/instruction projections. Khi mục này mâu thuẫn với `docs/specs/distribution.md`, đọc portal + implementation-alignment trước; `docs/specs/distribution.md` hiện là legacy/generated-curated source trong lúc migration.\n- `docs/distribution-vision.md` — tầm nhìn nền tảng lịch sử: cài đặt/setup/doctor ổn định + tái dùng được (không cần clone, global/project không xung đột — project ghi đè global, doctor/setup tự fix hạ tầng + merge config thiếu, module mới tự đăng ký năng lực config, CI như một phần của setup); đã được promote/supersede từng phần vào `docs/platform/packaging-distribution/vision.md`.\n- `docs/specs/` — state layer: area spec + system-overview + bản đồ này\n- `docs/routing-handoff-contract.md` — hợp đồng handoff agent↔agent + ranh giới tin cậy\n- `docs/io-contract.md` — hợp đồng giao tiếp VÀO/RA của cửa CLI + bề mặt stdout `fgos-runner` (str46-io-contract): danh tính `writer`/`role`, envelope `fgos.v1` + ngoại lệ có lý do, exit-code một nguồn, sổ verb (`touchesState`/`externalEffect`/`paginated`/`multiValueFormat`), version token, ranh giới ngoài (STR38/STR48/STR83)\n- `docs/coexistence.md` — doctrine chạy cạnh một harness agent khác (record ADR0009 (chống giao thoa lúc cài — fgOS khi cài không giao thoa tiến trình với harness khác)): lãnh địa, một-nhạc-trưởng-mỗi-phiên, nhường-nhịn lúc `init`, manifest `.fgos/coexistence.json`, Known Gaps chưa flip; `src/install/coexist.mjs` — cài đặt detection + manifest (read-only, không đè)\n- `package.json` (`version`, `files`, `bin.fgos`, `bin.fgos-runner`) + `README.md` (mục `## Install`) — cài `fgos` VÀ `fgos-runner` từ ngoài source repo qua GitHub install, cả hai executable ngay sau cài; `test/install-packaging.test.mjs` — proof e2e (pack → install → chạy từ project ngoài, gồm cả hai binary); spec: docs/specs/distribution.md\n- `scripts/fgos-shell-integration.sh` — dev checkout shell helper (STR87 first slice): hàm `fgos`/`fgos-runner` tự resolve root qua `git rev-parse --git-common-dir` (worktree-safe), source từ shell profile của contributor, không cài đặt gì; test: `test/scripts/fgos-shell-integration.test.mjs`; spec: docs/specs/distribution.md §Dev checkout shell helpers\n- `src/setup/` (`ansi.mjs`, `config-merge.mjs`, `shell-rc.mjs`, `checks.mjs`) + `bin/fgos.mjs`'s current legacy `setup`/`doctor` verbs + `src/cli/command-registry.mjs` entries — doctor/fix registry and legacy setup compatibility: `doctor` chẩn đoán read-only, `doctor --fix` chạy registered fixes, current Node `fgos setup` vẫn tồn tại nhưng target architecture supersedes onboarding bằng `fgctl init` + local `fgos init` / `fgos doctor --fix` / `fgos doctor`; manifest: `docs/architecture-manifest.json`; test: `test/setup/*.test.mjs`; current portal: `docs/platform/packaging-distribution/README.md`; legacy spec: docs/specs/distribution.md §Setup, §Doctor\n- `docs/decisions/` — hồ sơ quyết định dài hạn cho người ngoài (decision records); từ str64-backfill, mỗi record còn mang đầu-mô-tả OKF-style (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn, xem `frontmatter.mjs` dòng dưới) và được `fgos docs-index` công nhận là vị trí thay thế của ngăn `explanation` (R10, spec: docs/specs/enduser-docs-index.md) — thân ADR không đổi, chỉ thêm đầu-mô-tả; lưu ý `orchestrator` là pinned term đã đổi nghĩa giữa chừng (0026→0028 nghĩa cũ \"launcher\", 0029 nghĩa mới \"tầng hợp thành T0\"; xem chuỗi quyết định tại `docs/decisions/index.md` dòng 28-32)\n- `scripts/check-decision-citation-drift.mjs` + `test/scripts/check-decision-citation-drift.test.mjs` — quét `docs/backlog.md` + `docs/specs/*.md` tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế trên cùng dòng (STR72 CoS clause 2, PBI p-2d71dfc3); chỉ phát hiện, không tự sửa; spec: docs/specs/decision-citation-drift.md\n- `scripts/check-decision-codes.mjs` + `test/scripts/check-decision-codes.test.mjs` — quét `test/**/*.test.mjs` tìm tên test còn nhúng mã quyết định nội bộ (str##/D#/RUL##/STR##/tsk-xxx) thay vì mô tả bất biến bằng lời thường (review-audit-self-decision.md mục Stable Code Artifacts); chặn (ratchet) chỉ vi phạm MỚI so với `scripts/check-decision-codes.baseline.json` đã chốt, không chặn ngược nợ cũ; `npm test` tự chạy qua glob `test/**/*.test.mjs`, không hook riêng\n- `docs/id-systems-audit.md` — audit + quyết định hình dạng mọi hệ id/mã đang sống trong hệ thống (work.id/kind/Story/ADR/Rule/Contract phía fgOS; D-hex/D-local/cell-id/feature-slug/severity phía bee) — nguồn cho `work.id`'s `tsk-<hash>` và các migration STR53-STR58 (tất cả đã `done`); boundary appendix: `docs/architecture-map.md` Phụ lục B\n- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; gồm verb `edit` — sửa đè các trường (title/kind/risk/verify/tier/refs/deps/acceptance/priority/intent — str7-str8-priority-intent) trên một item đã có, cùng cửa ghi CTR002 như `add`/`move`; gồm verb `take`/`return` — cửa pull giao–nhận việc cho tác nhân ngoài runner; gồm verb `pick` — cửa pull GỘP `take` + dựng workspace (`createWorktree`), role cố định `session`, không cờ `--role` (theo str83-fgos-slash-commands); gồm verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, một cổng cho mọi đề xuất `awaiting-approval`, nay leaf-vs-root-aware (con nhập vào nhánh của gốc, gốc nhập vào cây chính); `review`/`approve` nay chấp nhận thêm `--github [--pr <n>]` — vận chuyển thay thế CÙNG cổng duyệt qua GitHub thay vì diff/merge cục bộ (chỉ nguồn runner, theo github-adapter, spec: docs/specs/runner.md); gồm verb `catchup` — đồng bộ lại một việc đỗ vì gãy nhập/trôi tích hợp (spec: docs/specs/runner.md); gồm verb `session` (`start`/`end`/`list`) — vòng đời phiên checkout đa-phiên tùy chọn, mỗi phiên một worktree detached-HEAD cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink (spec: docs/specs/runner.md); spec: docs/specs/work-state.md\n- `src/state/` — lõi work-state: events (nhật ký; `appendEvent` nay khóa liên-tiến-trình `.fgos/events.lock`, per fgos-multi-session-checkout Epic 3/STR35 — xem spec Work-State RUL10 (tiền đề có ngưỡng — một người ghi tại một thời điểm; multi-agent ghi đồng thời qua `.fgos/events.lock`)), work (schema — STATUSES + STAGES + field `parent` lineage + field `domain`), fsm (bảng chuyển status + CAS), stage (bảng chuyển stage + CAS, chiều vĩ mô song song fsm; cạnh chuyển-stage tra theo domain của item — `coding`: `discovery → exploring → planning → executing`, trong đó phán-quyết `clear` ở `discovery` bỏ qua `exploring` để sang thẳng `planning` còn `unclear` đi qua `exploring`; tên `decompose` vẫn còn nhưng chỉ là bí danh legacy chỉ-để-rút-cạn (không việc MỚI nào vào được nữa); `synthetic`: một stage, không cạnh nào), domains (sổ đăng ký domain — stage list + step-mapping base-workflow + cạnh-chuyển mỗi domain; `coding` + ba domain minh họa/thử-nghiệm `synthetic` (đúng một stage), `triage`, `fixture-marketing`; base-workflow-model STR18, hoàn tất S1+S2), replay (fold), frontier (truy vấn sẵn-sàng — lọc theo status, stage domain-aware, VÀ lineage qua `parent`), dep-graph (dò chu trình trên `deps` — bất biến phi-chu-trình tại cửa ghi, per work-graph-intelligence S1), store (chủ ghi duy nhất + readRawEvents), envelope (phong bì output CTR001, `wrapEnvelope` — nay bọc MỌI verb ở một cửa in trong `bin/fgos.mjs main()`, STR37; spec: docs/specs/work-state.md §envelope)\n- `src/cli/command-registry.mjs` — sổ verb máy-đọc của CLI (STR37, kernel, thuần dữ liệu): `SCHEMA_VERSION` + `COMMAND_REGISTRY` (mọi verb với `{name, invoke, description, parameters, examples, access read|mutation, deprecated}`); `bin/fgos.mjs` `--help [--json]` và `<verb> [<sub>] --help [--json]` sinh sổ từ đây; verb có sub-verb mang `subcommands`, `HELP_SELECTORS` (`--help`, `-h`) thành route của Rust host qua `scripts/export-command-selectors.mjs`; test chống-lệch `test/cli/fgos-manifest.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` (cờ handler ↔ schema sub-verb), `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/help-routes.test.mjs` (qua host thật); spec: docs/specs/work-state.md §sổ verb\n- `src/intake/classify.mjs` — logic thuần của `fgos submit`: deriveTitle, classify (tier/kind/risk cơ học), generateId (`tsk-<hash>` chống trùng, STR53)\n- `src/intake/discovery.mjs` — context-discovery của stage `discovery` (stage đầu tiên của domain `coding`): `resolveDiscovery` (đọc-phán-ghi, dùng chung bởi verb `discover` và vòng tự hành) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDiscovery` đã rút; phán-quyết `clear` chuyển item sang stage `planning`, `unclear` sang `exploring`\n- `src/intake/plan.mjs` — phán chia-việc của stage `planning`: `resolvePlan` (đọc-phán-ghi, dùng chung bởi verb `plan` và vòng tự hành khi item ở stage `planning`, hoặc ở bí danh legacy `decompose`) ĐÒI phán-quyết do người gọi cấp — judge lồng `judgeDecompose` đã rút, cùng lý do `judgeDiscovery` rút; sinh con qua lineage `parent`, không qua `deps`\n- `domains/coding/AGENTS.md` `## fgOS Workflow` + `.claude/skills/` (`.agents/skills/` mirror byte-identical) — lớp hướng dẫn P50: entry skill (`fgos-routing`) + skill giai đoạn (`fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-knowledge`) trỏ một phiên tự mở tới đúng skill theo `stage` của item; từ str89-fgos-domain-skills, tra cứu này domain-pluggable — đọc trường `domain` + `stage` của item rồi tra qua `skillForStage`/`getDomain` (`src/state/workflow-stage-graphs.mjs`), không còn giả định ngầm domain `coding`; `fgos-routing` nay có hàng khoá theo **status** `retrospective → fgos-coding-knowledge` (skill tổng hợp cấp nhãn Diataxis + soạn tài liệu người-dùng-cuối) — stage `compound-learn` đã rút, việc tổng hợp nó từng canh nay là việc của status `retrospective`; skill ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã rút (tsk-6ar) — `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`) nay tự chạy clarify+classify trong cùng phiên sống, cùng việc mà skill đó từng làm nhưng trên bản mô tả SẠCH hơn; spec: docs/specs/work-state.md §RUL60 (hành vi), docs/specs/runner.md (lớp hướng dẫn)\n- `plugins/fgOS/` (`.claude-plugin/plugin.json` + `skills/<verb>/SKILL.md`) — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper (submit, pick, move, return, ask, answer, ready, stale, rollup, check, graph, conflicts), mỗi verb một wrapper one-door-write qua `bin/fgos.mjs <verb>`; spec: docs/specs/fgos-plugin.md\n- `apps/fgos-gateway/` + `apps/fgos-gateway/web/` — fgos gateway (REST, MCP, bundle web dashboard nhúng sẵn; vòng đời `fgos gateway`) và bề mặt web dashboard: client trình duyệt ĐỘC LẬP (không phải code máy chủ trong gateway, theo tsk-7l9 + decision 0014); `herdr-dashboard/` là plugin herdr (TUI trong pane), `packages/herdr-fgos-common/rust` là adapter CLI fgos dùng chung của cả hai, gọi API REST/RPC của gateway từ ngoài; ba màn đọc (taskboard, task-detail, câu hỏi cần trả lời — phủ cả kênh `ask` lẫn `gate-approve`) cộng các hành động ghi đi qua verb một-cửa-ghi của fgOS (`answer`/`approve`/`add`/`edit`/`move`), không có đường ghi thứ hai; bật mặc định, port 8788, token bắt buộc; spec: docs/specs/herdr-web-dashboard.md (lớp UI/wireframe: docs/reference/herdr-web-dashboard-layout.md)\n- `docs/how-to/`, `docs/tutorials/`, `docs/reference/`, `docs/explanation/` — tài liệu NGƯỜI-DÙNG-CUỐI theo bốn quadrant Diataxis (audience-facing, khác `docs/specs/` là BA-reference nội bộ); sinh bởi kỹ năng `fgos-coding-knowledge` ở status `retrospective` (grow-or-create một tài liệu SỐNG mỗi đường dẫn: gom mọi capture qua `fgos doc-sources` rồi tích luỹ không mất, ngăn Diataxis là trục cấu trúc duy nhất — write-side, spec: docs/specs/enduser-docs-authoring.md), quadrant khớp `docType` capture; `docs/explanation/` từ str64-backfill còn có 6 tài liệu chưng cất từ critical-patterns.md (learnings vận hành bee thật sự thuộc tiến trình hình thành fgOS); chỉ mục đọc-theo-tag máy-đọc-được: `docs/enduser-docs-index.json` (sinh bởi verb `fgos docs-index` / kỹ năng `fgos-indexing`, thay cho việc liệt-kê-tay từng tài liệu — supersedes con trỏ văn xuôi cũ, theo compound-learn-enduser-docs; ngăn `explanation` còn quét thêm `docs/decisions/` làm vị trí thay thế, theo str64-backfill); spec read-side: docs/specs/enduser-docs-index.md\n- `src/runner/` + `bin/fgos-runner.mjs` — vòng tự hành (loop/dispatch/worktree/recovery/anti-loop/write-queue/root-affinity); `loop.mjs`'s `runWatch` + `write-queue.mjs`'s `onCommit` — chế độ `--watch` bền, tín hiệu-cơ-học + nghỉ dự phòng, ghép `runOnce` không đổi làm hộp đen (str7-str8-priority-intent, spec: docs/specs/runner.md §RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); loop giao việc theo mẻ song song có giới hạn hai tầng (cấu hình `parallel` trong `.fgos/config.json`'s `runner` section, theo tsk-5vf), giữ quyền-sở-hữu-gốc trong một lượt chạy, quét làm-rõ rồi quét chia-việc trước mọi dispatch thi công; gặt-lại bỏ qua claim của cửa pull (`claimRole` human/session); `dispatch.mjs`'s executor là port có tên CTR009 v2 (`EXECUTOR_ADAPTERS`, per-tier qua config's `executors`, STR41), `ensureRunnerConfigForDir` tự sinh cấu hình mặc định tại `.fgos/config.json` khi vắng mặt (không áp dụng cho `--config` tường minh, str76-runner-bootstrap; tsk-5hv xoá hẳn fallback về file flat legacy cũ); worker của loop và fan-out chạy như một Unit run qua `runUnit` (`work-dispatch.mjs`'s `spawnWorker`), `fgos-runner` không còn `--config` (spec: docs/specs/runner.md §RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) và prompt worker được tách sang `prompt-templates.mjs` + `prompt-templates/*.txt` (chọn template qua bảng cơ học kind/tier/domain, substitution `{placeholder}` thuần, log dispatch kèm tên+hash template, STR49); `goal-check.mjs` — hàm goal-check dùng chung giữa vòng tự hành và verb `return`; `write-queue.mjs` — cửa ghi tuần tự giữ một-người-ghi dưới song song; `root-affinity.mjs` — quyền-sở-hữu-gốc, giữ mọi con của một gốc chung một chủ trong một lượt chạy; `resolveRepoRoot` nay còn xác nhận HEAD repo resolve được trước khi runner claim bất kỳ item nào (fail-fast, str86-runner-headless-git D ecfd0d1a); config: `.fgos/config.json`'s `runner` section (tự sinh khi vắng mặt tại đường mặc định, nguồn config duy nhất kể từ tsk-5hv); spec: docs/specs/runner.md\n- `docs/specs/confinement-authority.md` + `src/runner/dispatch/confinement/` — Agent Confinement Authority: runtime one-door confinement enforcement (`executeThroughConfinement`), machine backend registry `~/.fgos/confinement-backends.json`, local `bwrap` v1 driver with 8 falsification probes, required fail-closed checks, attestation storage (`confinement-attestation.v1`), herdr convergence with shared `evaluateBypassPairing`, setup defaults and doctor checks; spec: docs/specs/confinement-authority.md Pane herdr confine cho agent không phải claude (codex/agy/pi): công thức private-home + account inventory + lịch sử các commit đã đi qua (và vì sao từng bị quên) ở §13.1.\n- `docs/architect/README.md` + `docs/architect/architecture-intent.md` + `docs/architect/domainization/README.md` — portal architect-level, registry intention xuyên-khu-vực, và deep-dive domainization (core đóng vs `domains/<name>/` adapter mở: manifest/workflow YAML, task-spec, skill, knowledge, doctrine, agent, resolver, enforcement); active thread đầu tiên giữ intent mở rộng fgOS từ fan-out/fan-in + artifact mediation thành năng lực group-thinking/problem-solving rộng hơn (Delphi/NGT/RFC/adversarial/master-coordinator), giữ `group-cognition-framework.yaml` isolation-heavy không bị nới ngầm; liên quan Step 09 group-thinking substrate, Step 10 coding-domain adoption, component authority boundary map, và Domain Components And Extension Layer\n- `src/workflow/` (`definition.mjs`, `runner.mjs`, `step-fsm.mjs`, `units-source.mjs`) + `core/workflows/*.yaml` — Workflow engine (Request-to-Run P3a/P4): DAG steps, human gates, dependency scheduling, runner integration; `units-source.mjs` dịch units file của `fgos workflow start --units` thành Workflow tạm (RUL89 (workflow start --units)); spec: `docs/specs/runner.md`\n- `src/runner/execution/` (`unit.mjs`, `bind.mjs`, `run.mjs`, `patterns/`) — Execution Core (Request-to-Run P1/P2/P4): Unit (hợp đồng dữ liệu duy nhất), `bind()` (chọn executor 5 mức), `fgos run` (cửa chạy mới, herdr mặc định), CollaborationPattern (`solo`, `reviewed`, `panel` + presets `consult`, `research-fan-out`, `rfc`, `code-change`); `src/runner/dispatch/write-scope.mjs` — matcher duy nhất của phạm vi ghi Unit (RUL84 (one write-scope matcher)), dùng cho runner commit, settlement và Workflow; spec: `docs/specs/runner.md`\n- `docs/architect/agent-coordination/` — thiết kế agent-coordination lịch sử (đã thu hồi ở P4 per D-0050, thay bằng Workflow runner và Execution Core); `README.md` là portal ghi nhận chuyển tiếp; `contracts/` lưu giữ hợp đồng lịch sử (`coordination-session.md`, `flow-definition.md`).\n- `docs/architect/host-invocation-routing/` — kiến trúc định tuyến và host runtime Rust (5 tệp: `host-invocation-provider-routing.md` — hợp đồng kernel canonical OperationRequest/ProviderOutcome, pure Router, InvocationService; `legacy-cli-transition.md` — chiến lược exec payload Node với parity harness và descriptor command-routes; `external-provider-protocol.md` — giao thức external provider R2; `node-to-rust-component-migration.md` — lộ trình chuyển dịch component từ Node sang Rust; `rust-cli-and-proof-components-plan.md` — kế hoạch triển khai Rust CLI host và proof components); spec: docs/specs/distribution.md\n- `src/runner/merge.mjs` — cơ chế cổng duyệt PR nội bộ (`classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`), dùng bởi `bin/fgos.mjs` verb `review`/`approve`/`reject`, nay tham số hóa được nhánh đích (cây chính hoặc nhánh của gốc — cây nhánh tích hợp); `catchup` (bin/fgos.mjs) dùng lại cùng cơ chế git cho cả tầng con→gốc lẫn gốc→cây chính; `isMainWorktree` (STR44) — chặn cấu trúc (không dựa sổ đăng ký session) xác nhận `cwd` LÀ worktree chính trước khi `approve` merge/verify, bắt cả worktree tay không đăng ký qua `fgos session start` — cùng `detectTrunk` nay ở `src/runner/worktree.mjs` (theo tsk-49i), không còn ở file này; spec: docs/specs/runner.md\n- `src/verbs/<domain>/<verb>.mjs` — tầng use-case của CLI (theo tsk-49i): logic nghiệp vụ của một verb, chữ ký thống nhất `<verb>UseCase(ctx, options)` — `ctx` là thứ adapter tính từ môi trường (`{dir, cwd?, repoRoot?}`, use-case KHÔNG BAO GIỜ tự đọc `process.cwd()`/`process.env`/argv), `options` là flag đã parse; trả đúng payload `fgos.v1` (bọc envelope + map exit-code vẫn ở `bin/fgos.mjs`), refusal vẫn `throw StoreError`. Cụm đầu tiên: `src/verbs/merge/` (`merge`/`approve`/`review`/`sync-root`/`catchup`/`reject`/`promote-to-component`) — `bin/fgos.mjs` cho 7 verb này nay chỉ parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb, gọi một hàm use-case. Không ngụ ý migrate 7 file use-case-rank sẵn có (`runner/loop.mjs`, `intake/*`, `setup/*`, `state/cursor.mjs`); spec: docs/specs/runner.md\n- `src/report/item-trace.mjs` — trace outcome/friction của MỘT item, đọc thuần trên view (`collectOutcomeEntry`/`collectFrictionData`/`collectReviewTrace`); dùng chung bởi `review` (use-case) và `check`/`show`/`doc-sources`/`evolve` (`bin/fgos.mjs`); spec: docs/specs/runner.md\n- `src/runner/github-adapter.mjs` — vận chuyển GitHub thuần cho cổng duyệt PR nội bộ (`createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR`/`classifyGhFailure`, shell ra `gh` CLI thật, layer infra), dùng bởi `bin/fgos.mjs` verb `review`/`approve --github`; spec: docs/specs/runner.md\n- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ của trợ lý (`.fgos/logs/<id>.log`, git-ignored): `appendWorkerLog` — khối kết-cục cuối, gọi bởi `loop.mjs` sau mỗi lượt dispatch; `appendWorkerLogChunk` — live tee từng chunk stdout/stderr khi đến (STR39), gọi bởi `dispatch.mjs`'s `spawnWorker` qua `opts.onChunk`; spec: docs/specs/runner.md\n- `src/runner/session.mjs` — vòng đời phiên checkout đa-phiên tùy chọn (fgos-multi-session-checkout, STR35): `createSession`/`endSession`/`listSessions`/`reclaimOrphanedSessions`, worktree detached-HEAD mỗi phiên (`git worktree add --detach`), `.fgos` symlink dùng chung (KHÔNG BAO GIỜ sao chép), sổ `.fgos/sessions.json` canh bởi `.fgos/sessions.lock` riêng; dùng bởi `bin/fgos.mjs` verb `session`; spec: docs/specs/runner.md\n- `packages/observe/rust/src/metrics_cli/entropy.rs` — tín hiệu entropy-trend + đếm compounding (thuần, đọc trên view work-state), surfaced qua `fgos metrics entropy`; spec: docs/specs/runner.md\n- `src/report/enduser-index.mjs` — bộ sinh CHỈ MỤC đọc-theo-tag tài liệu người-dùng-cuối (thuần, không I/O — mirror `entropy.mjs`): `QUADRANTS`, bảng nguồn-sự-thật `QUADRANT_META` (quadrant→{purpose,audience}), `QUADRANT_DIR_ALIASES` (quadrant→vị trí thay thế trên đĩa, theo str64-backfill; hiện `explanation`→`['decisions']`), `findSourceCaptureId` (gom một, cho chỉ mục), `findSourceCaptureIds` (gom mọi capture của một đường dẫn, cho `doc-sources`), `buildEnduserIndex`; I/O + verb `fgos docs-index` (quét cả thư mục chính lẫn `QUADRANT_DIR_ALIASES`, ghi manifest `docs/enduser-docs-index.json`) và verb `fgos doc-sources <docPath>` (gom nguồn của một đường dẫn) sống ở `bin/fgos.mjs`, cả hai quyền `read`; vận hành chỉ mục: kỹ năng `fgos-indexing`; spec: docs/specs/enduser-docs-index.md\n- `src/report/frontmatter.mjs` — bộ đọc/ghi đầu-mô-tả OKF-style của mỗi tài liệu người-dùng-cuối (thuần, không I/O, không phụ thuộc thư viện ngoài — theo str64-backfill): `parseFrontmatter`/`renderFrontmatter` (loại/tiêu đề/nhãn/thời điểm/móc-liên-kết-nguồn); tách biệt với bộ sinh chỉ mục — đầu-mô-tả là bản sao ghi-lúc-soạn, KHÔNG phải nguồn thẩm quyền của linkage; spec: docs/specs/enduser-docs-index.md\n- `src/evolve/candidates.mjs` — Gate A candidate ranking cho vòng tự cải thiện (self-improve loop, STR13 Slice 1): thuần, đọc trên view work-state, dùng lại `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa lại); surfaced qua `fgos evolve` (liệt kê + `--pick <id>`, hai bước, không stdin); spec: docs/specs/runner.md\n- `src/state/impact.mjs` — backlog-triage impact ranking (STR21, cửa 2 của triage — tách bạch khỏi STR14 intake-triage): thuần, xếp hạng item CHƯA `done` theo `blocks` (số item khác chưa `done` liệt kê nó trong `deps`); surfaced qua `fgos triage`; spec: docs/specs/work-state.md\n- `src/state/awaiting-context.mjs` — neo gốc cho cổng chờ-người (str61-chat-context-continuity): thuần, đọc trên view work-state, tính `{parent, changedSinceAsk?}` cho một item `awaiting-human` có `parent` mỗi lần đọc (không lưu trữ); surfaced qua `fgos list`'s khóa cộng thêm `awaitingContext`; spec: docs/specs/work-state.md §RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)\n- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2, kernel layer, dùng chung giữa `classify.mjs` và `iron-law.mjs`); spec: docs/specs/runner.md\n- `src/evolve/iron-law.mjs` — Iron Law risk classifier cho vòng tự cải thiện (self-improve loop, STR13 Slice 2): thuần, chưa có call site (Slice 3 wiring); spec: docs/specs/runner.md\n- `docs/specs/observe.md` — spec thành phần Observe (đo lường `fgos metrics` và ghi nhận `fgos friction` trọn sang Rust); source: `packages/observe/rust`, contracts: `packages/observe/contracts/`, store `.fgos/observe/`. `metrics discussions` đọc summary do Node Execution ghi (`src/runner/execution/unit-summary.mjs`, `packages/run-result/contracts/unit-summary.read.v2.json`), `metrics eval` ghi journal `.fgos/observe/evals/`. Rubric: `docs/reference/discussion-quality-rubric.md`; cách so sánh mù: `docs/how-to/compare-discussion-setups-with-metrics-eval.md`.\n- `test/` — node:test suite (`npm test`, 2970 test): smoke + state + cli + runner + report + e2e (rebuild-determinism, runner-loop — gồm kịch bản cửa pull S2-pull + con fork từ tip nhánh gốc, pr-gate — 4 kịch bản trọn vòng review/approve/reject, dispatch song song thật với cửa sổ chồng-lấn đo được); benchmark ngoài suite (F4) tại `docs/history/phase-3-compound-learning/reports/f4-benchmark.md`\n- `scripts/run-test-canary.mjs` (`npm run test:canary -- <file...>`) + `scripts/test-select.mjs` (`npm run test:related -- --explain`, plus `test:related:shadow` for evidence-gathering; manifest: `test/test-ownership.mjs`) — additive fast test-feedback doors, `npm test` unchanged/authoritative either way; how-to: `docs/how-to/use-fast-test-feedback-commands.md`; plan: `plans/260920-immediate-test-feedback-reduction/plan.md`\n- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored; `.fgos/logs/<id>.log` — bản ghi output cục bộ của trợ lý theo từng việc, gitignored (spec: docs/specs/runner.md)\n- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent (bản sản phẩm — thuần forgent)"
  },
  "currentSource": null,
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_d956ba3fb9a8cce9589194e5f59d021f"
}
```

