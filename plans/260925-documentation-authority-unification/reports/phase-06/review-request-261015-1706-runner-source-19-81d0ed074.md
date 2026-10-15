# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **66**. Target: `docs/platform/runner/decisions/h-36d872fbb0e5.md`; part 1/5. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `36df58d64bb618c975746b882672b10f2bb386f8971e597a78134dc46684ef92`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **10/66** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_4060effa4f71f4e9367b0fc41af34ef0",
      "claim_a9b1dd4a68565497b9bcb9120e7b9a76",
      "claim_4b894cf655ce33acc51fa458ba3f8e4d",
      "claim_c94a50fe7441df62bb996eb30a0710bf",
      "claim_892ebac27e47005bd094d2b485848f5a",
      "claim_12d95999cad8738ccac79a6f15728788",
      "claim_9a2a8ae8744ba63d4b5ec17bfa232fc5",
      "claim_bf68003224dd8e23200b03335dd8e9fe",
      "claim_245d9d4f556b45ea264409e0f250c925",
      "claim_4dd29ceecc93f1f78204aab75f0191c8",
      "claim_0902043724963f8590002ddbcd859177",
      "claim_d54ae2a76a3c4dc5d33d792dee048919",
      "claim_1bdd6442655fafc5d31fb4eee31ddb62",
      "claim_66b520efdcb55944f5d7e765a9e7d03a",
      "claim_fe7dd2a0ceed68b443ff08f8dfa90bcc",
      "claim_3b42c6e8e46058e613ce1e8a84199a50",
      "claim_09d57eb9097ccbab605c2c21542ae128",
      "claim_d6319c1c5cd66eb235a52d2dd98aaf95",
      "claim_ea583c26caf4f098a74cc11792a4a322",
      "claim_70a514f1fb45b55143db825456292ece",
      "claim_fd255b07245da5bc2437df92c1ffd15c",
      "claim_fc2a29f61b3b82c22ab9271e70a866b7",
      "claim_6c3d0086a14dc2c147748d7549f12f27",
      "claim_82947d03f0ca3597b1759f46bd72bde9",
      "claim_2640520d4eb496a0a00f90c7046b7ad3",
      "claim_d710eacb7b0c198b6feb1bb7cfe2f9d4",
      "claim_b3e99ecb4c96ba9df259b1da12621dfb",
      "claim_e8959424bce46c72d71990506da547d4",
      "claim_83e19a7229586ffd422226045900c35f",
      "claim_7bdaab988a25b47521c865264de5bda2",
      "claim_a851d1084ff0574381b28ba862edd3e4",
      "claim_b272040e723c24b073c0927d9cc44ec3",
      "claim_84afd5693c0006c1f53f0c1cf891e59e",
      "claim_97b71c7b8325cf01a893754c17c27dc7",
      "claim_63334a97536dcef6c54b64f986b6bd58",
      "claim_3e65bf4753fcc751b792f8cf4b67419e",
      "claim_fc1455edf4ca2acbae01ff194cd71951",
      "claim_f5934f88d357e84d390235e5863c051c",
      "claim_3b408585d46b76cfa21775dddce07417",
      "claim_e4beb2d579963a35d9b26b2265967d27",
      "claim_ae62e94e555e534f15f87337b38c4fca",
      "claim_22c8f33258e3b20ea891e98973ca284c",
      "claim_3e051db17c926cdbfaf6104e2d13c25c",
      "claim_0b6d3350fdb4cb44459bdee8caf09daf",
      "claim_652a2b350f1c46e429e00a80d9e01248",
      "claim_cfc4f47f0ecd03e0836b6bedd3158f60",
      "claim_14857a18ae008301d5870e0a4bc9f6ac",
      "claim_d21867cff8a51dfc4fdea3c3e95096d7",
      "claim_5afb8f3b4089acd884d2c3cd6b9bbb57",
      "claim_4b5ecfb051da3efc45ee7640277b768d",
      "claim_e5fcd366a66ba29887d712945fd7e3ff",
      "claim_a5bb50fb4f64e842334fe353a955524c",
      "claim_7a7eaa509c57c203757dafb1ef42c770",
      "claim_b20e1919dacb2d2fa0de0d4ca2c47db0",
      "claim_acd0fb1e35440535fc61d9ee0b15864b",
      "claim_8b22a5fd98d87a35c5c2d50c57060b46",
      "claim_3e759fdd13b85a14dca58cfdc902cb5d",
      "claim_589c5bca305535fea6cc0109ac66b668",
      "claim_6403b0907bb0a7415a2e48bfdcd576bb",
      "claim_317aead16cf595b7cf55ed42eaa18ddc",
      "claim_b016edf6f12e3024cb092606bb771b0a",
      "claim_368c6ea350e45900fcada35e67122f8a",
      "claim_b9de9d038f79f0e9cfa52561fca4181a",
      "claim_2d17f3a10e99a9da564808a8ca3e56c8",
      "claim_f5e397112a36967f6c2057456eb9b173",
      "claim_12825427c0cb1d693c6eb2f803952181"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_4060effa4f71f4e9367b0fc41af34ef0

Source digest: 0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea

Target digest: 0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4",
  "sourceLines": [
    1609,
    1609
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_cac2a037a2250cb5d46b3915c5941e9a",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_4060effa4f71f4e9367b0fc41af34ef0",
    "sourceUnitDigest": "0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4 (lines 1609–1609) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "0e00c9cccba1af1ea5926f1106dd72d535b230294281707303ecd16fbc0a2bea",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Full target unit

```text
## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Full diff

```diff
No text difference.
```

## claim_a9b1dd4a68565497b9bcb9120e7b9a76

Source digest: ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c

Target digest: ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-144",
  "sourceLines": [
    1611,
    1611
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-3",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_0679e11c7616be0958e9801926d1b971",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_a9b1dd4a68565497b9bcb9120e7b9a76",
    "sourceUnitDigest": "ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "decision",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-144 (lines 1611–1611) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ac2b043c0d4f9fde1e7ecee60609cbe700480b9dd33105f98d30f6c6057ffb5c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Full target unit

```text
Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.
```

### Full diff

```diff
No text difference.
```

## claim_4b894cf655ce33acc51fa458ba3f8e4d

Source digest: 8c6dec18f6bef92315f061a9bdcf6803f5c40f688265b36d608602036bf9778a

Target digest: 8c6dec18f6bef92315f061a9bdcf6803f5c40f688265b36d608602036bf9778a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0005-runner-cô-lập-worker",
  "sourceLines": [
    1614,
    1614
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0005-runner-cô-lập-worker",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_2a15f9c758e3d0a6ec1720684b551972",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "0005-runner-cô-lập-worker",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_4b894cf655ce33acc51fa458ba3f8e4d",
    "sourceUnitDigest": "8c6dec18f6bef92315f061a9bdcf6803f5c40f688265b36d608602036bf9778a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0005-runner-cô-lập-worker",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#0005-runner-cô-lập-worker (lines 1614–1614) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0005-runner-cô-lập-worker. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8c6dec18f6bef92315f061a9bdcf6803f5c40f688265b36d608602036bf9778a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0005 — Runner & cô lập worker
```

### Full target unit

```text
### 0005 — Runner & cô lập worker
```

### Full diff

```diff
No text difference.
```

## claim_c94a50fe7441df62bb996eb30a0710bf

Source digest: c85972d73e0c1fc03329d33ae01a1fcf036d3d19c81c2e91389f04163992016e

Target digest: c85972d73e0c1fc03329d33ae01a1fcf036d3d19c81c2e91389f04163992016e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh",
  "sourceLines": [
    1616,
    1616
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker"
  ],
  "nativeTargetClaimId": "claim_0eb4cb730b50fa419baa89bf8d943a80",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_c94a50fe7441df62bb996eb30a0710bf",
    "sourceUnitDigest": "c85972d73e0c1fc03329d33ae01a1fcf036d3d19c81c2e91389f04163992016e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh (lines 1616–1616) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c85972d73e0c1fc03329d33ae01a1fcf036d3d19c81c2e91389f04163992016e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

Lớp state cần một "máy" thật để vòng recovery và anti-loop được **kiểm bằng chạy
thật**, không phải bảng chính sách treo. Đây cũng là bước đầu của hướng nhiều-agent
chạy song song. Đồ bảo hộ phải có máy để bảo vệ.

Mối đe dọa thực tế đối với worker trong fgOS không phải là worker cố ý gian lận (adversarial swarm worker), mà là worker drift không cố ý. Hai bằng chứng thực tế đã ghi nhận trong repo:
1. Lỗi `agy` cwd (`docs/history/agy-cwd-fidelity/RESEARCH.md`): tiến trình executor chạy với `cwd` đúng nhưng agent tự nhảy sang worktree của item khác (`fgw/tsk-1lv`), thoát thành công và báo xanh dù kết quả hoàn toàn sai.
2. Fanout worktree race (`.agents/skills/fgos-fanout/SKILL.md` dòng 159-166): trạng thái cô lập worktree ở session level bị clobber bởi sibling dispatched agents, khiến working directory của session điều phối trôi sang worktree sibling mid-run.

Ngoài ra, giả định "luôn có con người review trước khi merge" không phản ánh đúng vận hành thực tế — fgOS ưu tiên #2 "Release con người" (`docs/specs/runner.md`) với các vòng tự-duyệt batch tự động (`/fgOS:merge-loop`, `/fgOS:cleanup-loop`). Do đó, `verify` của item do RUNNER tự re-verify độc lập là bắt buộc để phát hiện worker drift trước khi auto-merge.
```

### Full target unit

```text
#### Bối cảnh

Lớp state cần một "máy" thật để vòng recovery và anti-loop được **kiểm bằng chạy
thật**, không phải bảng chính sách treo. Đây cũng là bước đầu của hướng nhiều-agent
chạy song song. Đồ bảo hộ phải có máy để bảo vệ.

Mối đe dọa thực tế đối với worker trong fgOS không phải là worker cố ý gian lận (adversarial swarm worker), mà là worker drift không cố ý. Hai bằng chứng thực tế đã ghi nhận trong repo:
1. Lỗi `agy` cwd (`docs/history/agy-cwd-fidelity/RESEARCH.md`): tiến trình executor chạy với `cwd` đúng nhưng agent tự nhảy sang worktree của item khác (`fgw/tsk-1lv`), thoát thành công và báo xanh dù kết quả hoàn toàn sai.
2. Fanout worktree race (`.agents/skills/fgos-fanout/SKILL.md` dòng 159-166): trạng thái cô lập worktree ở session level bị clobber bởi sibling dispatched agents, khiến working directory của session điều phối trôi sang worktree sibling mid-run.

Ngoài ra, giả định "luôn có con người review trước khi merge" không phản ánh đúng vận hành thực tế — fgOS ưu tiên #2 "Release con người" (`docs/specs/runner.md`) với các vòng tự-duyệt batch tự động (`/fgOS:merge-loop`, `/fgOS:cleanup-loop`). Do đó, `verify` của item do RUNNER tự re-verify độc lập là bắt buộc để phát hiện worker drift trước khi auto-merge.
```

### Full diff

```diff
No text difference.
```

## claim_892ebac27e47005bd094d2b485848f5a

Source digest: 09f360a1b21c6c4a7d5243a9f59e9be4fa207bed8f03efed6d9db2f3ce6a5c74

Target digest: 09f360a1b21c6c4a7d5243a9f59e9be4fa207bed8f03efed6d9db2f3ce6a5c74

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-145",
  "sourceLines": [
    1618,
    1620
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-4",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_0f08a7436f256da9b6244b4015c5db92",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_892ebac27e47005bd094d2b485848f5a",
    "sourceUnitDigest": "09f360a1b21c6c4a7d5243a9f59e9be4fa207bed8f03efed6d9db2f3ce6a5c74",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-145 (lines 1618–1620) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "09f360a1b21c6c4a7d5243a9f59e9be4fa207bed8f03efed6d9db2f3ce6a5c74",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Lớp state cần một "máy" thật để vòng recovery và anti-loop được **kiểm bằng chạy
thật**, không phải bảng chính sách treo. Đây cũng là bước đầu của hướng nhiều-agent
chạy song song. Đồ bảo hộ phải có máy để bảo vệ.
```

### Full target unit

```text
Lớp state cần một "máy" thật để vòng recovery và anti-loop được **kiểm bằng chạy
thật**, không phải bảng chính sách treo. Đây cũng là bước đầu của hướng nhiều-agent
chạy song song. Đồ bảo hộ phải có máy để bảo vệ.
```

### Full diff

```diff
No text difference.
```

## claim_12d95999cad8738ccac79a6f15728788

Source digest: 24dafae94344b1482e3a20434790a593e8f855d3a33206bf8acf118b3103eea3

Target digest: 24dafae94344b1482e3a20434790a593e8f855d3a33206bf8acf118b3103eea3

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-146",
  "sourceLines": [
    1622,
    1624
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-5",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_d55745969b60c58c4bbb9fa706d04fd0",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_12d95999cad8738ccac79a6f15728788",
    "sourceUnitDigest": "24dafae94344b1482e3a20434790a593e8f855d3a33206bf8acf118b3103eea3",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-146 (lines 1622–1624) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "24dafae94344b1482e3a20434790a593e8f855d3a33206bf8acf118b3103eea3",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Mối đe dọa thực tế đối với worker trong fgOS không phải là worker cố ý gian lận (adversarial swarm worker), mà là worker drift không cố ý. Hai bằng chứng thực tế đã ghi nhận trong repo:
1. Lỗi `agy` cwd (`docs/history/agy-cwd-fidelity/RESEARCH.md`): tiến trình executor chạy với `cwd` đúng nhưng agent tự nhảy sang worktree của item khác (`fgw/tsk-1lv`), thoát thành công và báo xanh dù kết quả hoàn toàn sai.
2. Fanout worktree race (`.agents/skills/fgos-fanout/SKILL.md` dòng 159-166): trạng thái cô lập worktree ở session level bị clobber bởi sibling dispatched agents, khiến working directory của session điều phối trôi sang worktree sibling mid-run.
```

### Full target unit

```text
Mối đe dọa thực tế đối với worker trong fgOS không phải là worker cố ý gian lận (adversarial swarm worker), mà là worker drift không cố ý. Hai bằng chứng thực tế đã ghi nhận trong repo:
1. Lỗi `agy` cwd (`docs/history/agy-cwd-fidelity/RESEARCH.md`): tiến trình executor chạy với `cwd` đúng nhưng agent tự nhảy sang worktree của item khác (`fgw/tsk-1lv`), thoát thành công và báo xanh dù kết quả hoàn toàn sai.
2. Fanout worktree race (`.agents/skills/fgos-fanout/SKILL.md` dòng 159-166): trạng thái cô lập worktree ở session level bị clobber bởi sibling dispatched agents, khiến working directory của session điều phối trôi sang worktree sibling mid-run.
```

### Full diff

```diff
No text difference.
```

## claim_9a2a8ae8744ba63d4b5ec17bfa232fc5

Source digest: 184f869be39fc530bfaa1b547341d4b2f6647142ee7478c72795a65f52862183

Target digest: 184f869be39fc530bfaa1b547341d4b2f6647142ee7478c72795a65f52862183

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-147",
  "sourceLines": [
    1626,
    1626
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-6",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_f728c96e6ab909e82217054a4d03c271",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_9a2a8ae8744ba63d4b5ec17bfa232fc5",
    "sourceUnitDigest": "184f869be39fc530bfaa1b547341d4b2f6647142ee7478c72795a65f52862183",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-147 (lines 1626–1626) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-6. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "184f869be39fc530bfaa1b547341d4b2f6647142ee7478c72795a65f52862183",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Ngoài ra, giả định "luôn có con người review trước khi merge" không phản ánh đúng vận hành thực tế — fgOS ưu tiên #2 "Release con người" (`docs/specs/runner.md`) với các vòng tự-duyệt batch tự động (`/fgOS:merge-loop`, `/fgOS:cleanup-loop`). Do đó, `verify` của item do RUNNER tự re-verify độc lập là bắt buộc để phát hiện worker drift trước khi auto-merge.
```

### Full target unit

```text
Ngoài ra, giả định "luôn có con người review trước khi merge" không phản ánh đúng vận hành thực tế — fgOS ưu tiên #2 "Release con người" (`docs/specs/runner.md`) với các vòng tự-duyệt batch tự động (`/fgOS:merge-loop`, `/fgOS:cleanup-loop`). Do đó, `verify` của item do RUNNER tự re-verify độc lập là bắt buộc để phát hiện worker drift trước khi auto-merge.
```

### Full diff

```diff
No text difference.
```

## claim_bf68003224dd8e23200b03335dd8e9fe

Source digest: c64245dd24cd536e06e0a8df7540ead2e5fd6cbcbb309cdd520cbcfe14dee163

Target digest: c64245dd24cd536e06e0a8df7540ead2e5fd6cbcbb309cdd520cbcfe14dee163

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định",
  "sourceLines": [
    1628,
    1628
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker"
  ],
  "nativeTargetClaimId": "claim_91db18c6c938f297f7f29d1fe9d3f4c9",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_bf68003224dd8e23200b03335dd8e9fe",
    "sourceUnitDigest": "c64245dd24cd536e06e0a8df7540ead2e5fd6cbcbb309cdd520cbcfe14dee163",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định (lines 1628–1628) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c64245dd24cd536e06e0a8df7540ead2e5fd6cbcbb309cdd520cbcfe14dee163",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

- **Runner tối thiểu, vòng lặp thật:** đọc frontier → lấy một việc → dispatch →
  thu kết quả → ghi qua `fgos`. Recovery matrix + anti-loop **sống trong runner** và
  được test bằng vòng chạy thật.
- **Executor = agent headless.** Prompt dựng từ chính work item (tiêu đề/loại/tham
  chiếu/verify). **`verify` của item do RUNNER tự chạy** làm goal-check độc lập —
  không tin lời worker tự khai.
- **Trong vòng dispatch, runner là NGƯỜI GHI DUY NHẤT** qua `fgos`; worker **không
  bao giờ tự gọi `fgos`**. (Giữ tiền đề single-writer của 0001 — phá là chạm ngưỡng
  mở lại luật.) Quyền ghi của người vận hành *ngoài* vòng dispatch giữ nguyên.
- **Worker chạy trên nhánh/worktree cô lập; kết quả là ĐỀ XUẤT** — commit trên nhánh
  + báo cáo. Con người (hoặc một vòng review được gọi riêng) duyệt rồi mới merge.
  **Worker không bao giờ sửa thẳng working tree chính.**
- **tier→model:** schema `work` thêm trường `tier`; runner đọc bảng map tier→model
  từ config khi dispatch worker (giao việc rẻ cho model rẻ).
- **Anti-loop đọc raw events:** đếm số lần thăm một việc cần đọc event thô, nên store
  có thêm một accessor **chỉ-đọc** trả về event thô; **cửa ghi duy nhất không đổi**.
```

### Full target unit

```text
#### Quyết định

- **Runner tối thiểu, vòng lặp thật:** đọc frontier → lấy một việc → dispatch →
  thu kết quả → ghi qua `fgos`. Recovery matrix + anti-loop **sống trong runner** và
  được test bằng vòng chạy thật.
- **Executor = agent headless.** Prompt dựng từ chính work item (tiêu đề/loại/tham
  chiếu/verify). **`verify` của item do RUNNER tự chạy** làm goal-check độc lập —
  không tin lời worker tự khai.
- **Trong vòng dispatch, runner là NGƯỜI GHI DUY NHẤT** qua `fgos`; worker **không
  bao giờ tự gọi `fgos`**. (Giữ tiền đề single-writer của 0001 — phá là chạm ngưỡng
  mở lại luật.) Quyền ghi của người vận hành *ngoài* vòng dispatch giữ nguyên.
- **Worker chạy trên nhánh/worktree cô lập; kết quả là ĐỀ XUẤT** — commit trên nhánh
  + báo cáo. Con người (hoặc một vòng review được gọi riêng) duyệt rồi mới merge.
  **Worker không bao giờ sửa thẳng working tree chính.**
- **tier→model:** schema `work` thêm trường `tier`; runner đọc bảng map tier→model
  từ config khi dispatch worker (giao việc rẻ cho model rẻ).
- **Anti-loop đọc raw events:** đếm số lần thăm một việc cần đọc event thô, nên store
  có thêm một accessor **chỉ-đọc** trả về event thô; **cửa ghi duy nhất không đổi**.
```

### Full diff

```diff
No text difference.
```

## claim_245d9d4f556b45ea264409e0f250c925

Source digest: 9ab04443daf84a8574e1b4c6ae3c99098cbac4eb4a3e49af85c145cba700b73d

Target digest: 9ab04443daf84a8574e1b4c6ae3c99098cbac4eb4a3e49af85c145cba700b73d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-148",
  "sourceLines": [
    1630,
    1645
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-7",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_994da477209609a79325712026f6c036",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_245d9d4f556b45ea264409e0f250c925",
    "sourceUnitDigest": "9ab04443daf84a8574e1b4c6ae3c99098cbac4eb4a3e49af85c145cba700b73d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-148 (lines 1630–1645) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-7. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "9ab04443daf84a8574e1b4c6ae3c99098cbac4eb4a3e49af85c145cba700b73d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
- **Runner tối thiểu, vòng lặp thật:** đọc frontier → lấy một việc → dispatch →
  thu kết quả → ghi qua `fgos`. Recovery matrix + anti-loop **sống trong runner** và
  được test bằng vòng chạy thật.
- **Executor = agent headless.** Prompt dựng từ chính work item (tiêu đề/loại/tham
  chiếu/verify). **`verify` của item do RUNNER tự chạy** làm goal-check độc lập —
  không tin lời worker tự khai.
- **Trong vòng dispatch, runner là NGƯỜI GHI DUY NHẤT** qua `fgos`; worker **không
  bao giờ tự gọi `fgos`**. (Giữ tiền đề single-writer của 0001 — phá là chạm ngưỡng
  mở lại luật.) Quyền ghi của người vận hành *ngoài* vòng dispatch giữ nguyên.
- **Worker chạy trên nhánh/worktree cô lập; kết quả là ĐỀ XUẤT** — commit trên nhánh
  + báo cáo. Con người (hoặc một vòng review được gọi riêng) duyệt rồi mới merge.
  **Worker không bao giờ sửa thẳng working tree chính.**
- **tier→model:** schema `work` thêm trường `tier`; runner đọc bảng map tier→model
  từ config khi dispatch worker (giao việc rẻ cho model rẻ).
- **Anti-loop đọc raw events:** đếm số lần thăm một việc cần đọc event thô, nên store
  có thêm một accessor **chỉ-đọc** trả về event thô; **cửa ghi duy nhất không đổi**.
```

### Full target unit

```text
- **Runner tối thiểu, vòng lặp thật:** đọc frontier → lấy một việc → dispatch →
  thu kết quả → ghi qua `fgos`. Recovery matrix + anti-loop **sống trong runner** và
  được test bằng vòng chạy thật.
- **Executor = agent headless.** Prompt dựng từ chính work item (tiêu đề/loại/tham
  chiếu/verify). **`verify` của item do RUNNER tự chạy** làm goal-check độc lập —
  không tin lời worker tự khai.
- **Trong vòng dispatch, runner là NGƯỜI GHI DUY NHẤT** qua `fgos`; worker **không
  bao giờ tự gọi `fgos`**. (Giữ tiền đề single-writer của 0001 — phá là chạm ngưỡng
  mở lại luật.) Quyền ghi của người vận hành *ngoài* vòng dispatch giữ nguyên.
- **Worker chạy trên nhánh/worktree cô lập; kết quả là ĐỀ XUẤT** — commit trên nhánh
  + báo cáo. Con người (hoặc một vòng review được gọi riêng) duyệt rồi mới merge.
  **Worker không bao giờ sửa thẳng working tree chính.**
- **tier→model:** schema `work` thêm trường `tier`; runner đọc bảng map tier→model
  từ config khi dispatch worker (giao việc rẻ cho model rẻ).
- **Anti-loop đọc raw events:** đếm số lần thăm một việc cần đọc event thô, nên store
  có thêm một accessor **chỉ-đọc** trả về event thô; **cửa ghi duy nhất không đổi**.
```

### Full diff

```diff
No text difference.
```

## claim_4dd29ceecc93f1f78204aab75f0191c8

Source digest: bd3abb8a9b8884d507aa39dad26a0a8669326d975f1cbbcddaa1a1d70d2b692f

Target digest: bd3abb8a9b8884d507aa39dad26a0a8669326d975f1cbbcddaa1a1d70d2b692f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả",
  "sourceLines": [
    1647,
    1647
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker"
  ],
  "nativeTargetClaimId": "claim_eb1aaa7c4d1b4e049a0d1531581886fe",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_4dd29ceecc93f1f78204aab75f0191c8",
    "sourceUnitDigest": "bd3abb8a9b8884d507aa39dad26a0a8669326d975f1cbbcddaa1a1d70d2b692f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả (lines 1647–1647) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "bd3abb8a9b8884d507aa39dad26a0a8669326d975f1cbbcddaa1a1d70d2b692f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0005 — Runner & cô lập worker"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- **Sai thì vứt nhánh:** runner tự hành được mà không cần phòng tuyến hoàn hảo ngày
  đầu — kết quả xấu nằm trên nhánh cô lập, không đụng cây chính.
- **Recovery/anti-loop là hành vi được test,** không phải lời hứa trên giấy.
- **Cost-tiered delegation** ngay từ vòng dispatch.
- **Single-writer bảo toàn:** một cửa ghi trong lúc chạy tự động → không tranh ghi.
- **Bảo vệ trước worker drift không cố ý:** độc lập re-verify `verify` ngăn chặn sai sót lọt qua các vòng batch unattended merge (`/fgOS:merge-loop`, `/fgOS:cleanup-loop`) mà không đòi hỏi con người ngồi canh từng item.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
#### Hệ quả

- **Sai thì vứt nhánh:** runner tự hành được mà không cần phòng tuyến hoàn hảo ngày
  đầu — kết quả xấu nằm trên nhánh cô lập, không đụng cây chính.
- **Recovery/anti-loop là hành vi được test,** không phải lời hứa trên giấy.
- **Cost-tiered delegation** ngay từ vòng dispatch.
- **Single-writer bảo toàn:** một cửa ghi trong lúc chạy tự động → không tranh ghi.
- **Bảo vệ trước worker drift không cố ý:** độc lập re-verify `verify` ngăn chặn sai sót lọt qua các vòng batch unattended merge (`/fgOS:merge-loop`, `/fgOS:cleanup-loop`) mà không đòi hỏi con người ngồi canh từng item.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_0902043724963f8590002ddbcd859177

Source digest: 6fa34adf36ffc88adb887ccd6c4e7548e685a569e576a56ff465ad05a360c067

Target digest: 6fa34adf36ffc88adb887ccd6c4e7548e685a569e576a56ff465ad05a360c067

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-149",
  "sourceLines": [
    1649,
    1654
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-8",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_97a2747940d02867d8b06638e2f0aa61",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_0902043724963f8590002ddbcd859177",
    "sourceUnitDigest": "6fa34adf36ffc88adb887ccd6c4e7548e685a569e576a56ff465ad05a360c067",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-149 (lines 1649–1654) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-8. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6fa34adf36ffc88adb887ccd6c4e7548e685a569e576a56ff465ad05a360c067",
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
- **Sai thì vứt nhánh:** runner tự hành được mà không cần phòng tuyến hoàn hảo ngày
  đầu — kết quả xấu nằm trên nhánh cô lập, không đụng cây chính.
- **Recovery/anti-loop là hành vi được test,** không phải lời hứa trên giấy.
- **Cost-tiered delegation** ngay từ vòng dispatch.
- **Single-writer bảo toàn:** một cửa ghi trong lúc chạy tự động → không tranh ghi.
- **Bảo vệ trước worker drift không cố ý:** độc lập re-verify `verify` ngăn chặn sai sót lọt qua các vòng batch unattended merge (`/fgOS:merge-loop`, `/fgOS:cleanup-loop`) mà không đòi hỏi con người ngồi canh từng item.
```

### Full target unit

```text
- **Sai thì vứt nhánh:** runner tự hành được mà không cần phòng tuyến hoàn hảo ngày
  đầu — kết quả xấu nằm trên nhánh cô lập, không đụng cây chính.
- **Recovery/anti-loop là hành vi được test,** không phải lời hứa trên giấy.
- **Cost-tiered delegation** ngay từ vòng dispatch.
- **Single-writer bảo toàn:** một cửa ghi trong lúc chạy tự động → không tranh ghi.
- **Bảo vệ trước worker drift không cố ý:** độc lập re-verify `verify` ngăn chặn sai sót lọt qua các vòng batch unattended merge (`/fgOS:merge-loop`, `/fgOS:cleanup-loop`) mà không đòi hỏi con người ngồi canh từng item.
```

### Full diff

```diff
No text difference.
```

## claim_d54ae2a76a3c4dc5d33d792dee048919

Source digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Target digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-150",
  "sourceLines": [
    1656,
    1656
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0005 — Runner & cô lập worker",
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
  "section": "hệ-quả",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d54ae2a76a3c4dc5d33d792dee048919",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: target digest repeats; ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-150 (lines 1656–1656) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
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

## claim_1bdd6442655fafc5d31fb4eee31ddb62

Source digest: 4a89d0eee1476346d312e102a9990ae398d0c9a0a04621614c32bf60ac3586ff

Target digest: 4a89d0eee1476346d312e102a9990ae398d0c9a0a04621614c32bf60ac3586ff

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0008-routing-theo-audience-của-từng-interface",
  "sourceLines": [
    1658,
    1658
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0008-routing-theo-audience-của-từng-interface",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_f290d258862171d5c9ba5bf4391eb6ad",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0008-routing-theo-audience-của-từng-interface",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_1bdd6442655fafc5d31fb4eee31ddb62",
    "sourceUnitDigest": "4a89d0eee1476346d312e102a9990ae398d0c9a0a04621614c32bf60ac3586ff",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0008-routing-theo-audience-của-từng-interface",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0008-routing-theo-audience-của-từng-interface (lines 1658–1658) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0008-routing-theo-audience-của-từng-interface. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "4a89d0eee1476346d312e102a9990ae398d0c9a0a04621614c32bf60ac3586ff",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0008 — Routing theo audience của từng interface
```

### Full target unit

```text
### 0008 — Routing theo audience của từng interface
```

### Full diff

```diff
No text difference.
```

## claim_66b520efdcb55944f5d7e765a9e7d03a

Source digest: bb0b97a3dd60e838c00bfb454fb5731d1d570dcbae8d0c0dbe03171d04f5b62d

Target digest: bb0b97a3dd60e838c00bfb454fb5731d1d570dcbae8d0c0dbe03171d04f5b62d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-1",
  "sourceLines": [
    1660,
    1660
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-1",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface"
  ],
  "nativeTargetClaimId": "claim_a9a5e8c10eeebd7138616414078bc6de",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-1",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_66b520efdcb55944f5d7e765a9e7d03a",
    "sourceUnitDigest": "bb0b97a3dd60e838c00bfb454fb5731d1d570dcbae8d0c0dbe03171d04f5b62d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-1",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-1 (lines 1660–1660) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-1. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "bb0b97a3dd60e838c00bfb454fb5731d1d570dcbae8d0c0dbe03171d04f5b62d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

forgent có nhiều interface (giữa các bước trong một chuỗi agent, và giữa hệ thống
với các consumer bên ngoài). Cám dỗ là chọn **một** kiểu giao tiếp (một khuôn:
hoặc tất cả bằng văn xuôi, hoặc tất cả bằng dữ liệu cấu trúc) rồi áp toàn cục. Mỗi
khuôn đúng cho một loại người-đọc và sai cho loại kia.
```

### Full target unit

```text
#### Bối cảnh

forgent có nhiều interface (giữa các bước trong một chuỗi agent, và giữa hệ thống
với các consumer bên ngoài). Cám dỗ là chọn **một** kiểu giao tiếp (một khuôn:
hoặc tất cả bằng văn xuôi, hoặc tất cả bằng dữ liệu cấu trúc) rồi áp toàn cục. Mỗi
khuôn đúng cho một loại người-đọc và sai cho loại kia.
```

### Full diff

```diff
No text difference.
```

## claim_fe7dd2a0ceed68b443ff08f8dfa90bcc

Source digest: dd21a066c310159ee1d3ae421e70bcb90d300f6de21f77035c761385dda3c21f

Target digest: dd21a066c310159ee1d3ae421e70bcb90d300f6de21f77035c761385dda3c21f

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-151",
  "sourceLines": [
    1662,
    1665
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-10",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_4f71db489e3510117136642854f8458f",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-1",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_fe7dd2a0ceed68b443ff08f8dfa90bcc",
    "sourceUnitDigest": "dd21a066c310159ee1d3ae421e70bcb90d300f6de21f77035c761385dda3c21f",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-10",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-151 (lines 1662–1665) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-10. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "dd21a066c310159ee1d3ae421e70bcb90d300f6de21f77035c761385dda3c21f",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
forgent có nhiều interface (giữa các bước trong một chuỗi agent, và giữa hệ thống
với các consumer bên ngoài). Cám dỗ là chọn **một** kiểu giao tiếp (một khuôn:
hoặc tất cả bằng văn xuôi, hoặc tất cả bằng dữ liệu cấu trúc) rồi áp toàn cục. Mỗi
khuôn đúng cho một loại người-đọc và sai cho loại kia.
```

### Full target unit

```text
forgent có nhiều interface (giữa các bước trong một chuỗi agent, và giữa hệ thống
với các consumer bên ngoài). Cám dỗ là chọn **một** kiểu giao tiếp (một khuôn:
hoặc tất cả bằng văn xuôi, hoặc tất cả bằng dữ liệu cấu trúc) rồi áp toàn cục. Mỗi
khuôn đúng cho một loại người-đọc và sai cho loại kia.
```

### Full diff

```diff
No text difference.
```

## claim_3b42c6e8e46058e613ce1e8a84199a50

Source digest: 687fa164315afb5b3f0ef967cd17ef3510d04921541a2ae26ee408ca699e4b9e

Target digest: 687fa164315afb5b3f0ef967cd17ef3510d04921541a2ae26ee408ca699e4b9e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-1",
  "sourceLines": [
    1667,
    1667
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-1",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface"
  ],
  "nativeTargetClaimId": "claim_3735447f6f4c175ae90459471bb12366",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-1",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3b42c6e8e46058e613ce1e8a84199a50",
    "sourceUnitDigest": "687fa164315afb5b3f0ef967cd17ef3510d04921541a2ae26ee408ca699e4b9e",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-1",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-1 (lines 1667–1667) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-1. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "687fa164315afb5b3f0ef967cd17ef3510d04921541a2ae26ee408ca699e4b9e",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Chọn kiểu routing **theo audience của TỪNG interface**, không toàn cục:

- **prose-handoff** (bàn giao bằng văn xuôi) cho **agent ↔ agent trong một chuỗi**:
  người đọc là một agent hiểu ngôn ngữ, cần bối cảnh và ý định.
- **data / exit-code / decision-table** (dữ liệu, mã thoát, bảng quyết định) cho
  **consumer không-chắc-là-agent**: người đọc có thể là script/máy, cần hợp đồng
  chặt và phân giải được không mơ hồ.
```

### Full target unit

```text
#### Quyết định

Chọn kiểu routing **theo audience của TỪNG interface**, không toàn cục:

- **prose-handoff** (bàn giao bằng văn xuôi) cho **agent ↔ agent trong một chuỗi**:
  người đọc là một agent hiểu ngôn ngữ, cần bối cảnh và ý định.
- **data / exit-code / decision-table** (dữ liệu, mã thoát, bảng quyết định) cho
  **consumer không-chắc-là-agent**: người đọc có thể là script/máy, cần hợp đồng
  chặt và phân giải được không mơ hồ.
```

### Full diff

```diff
No text difference.
```

## claim_09d57eb9097ccbab605c2c21542ae128

Source digest: 3f3e77b66c269da1de24a568c762cc92c3042b35479fc4a9a234583ecb771e44

Target digest: 3f3e77b66c269da1de24a568c762cc92c3042b35479fc4a9a234583ecb771e44

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-152",
  "sourceLines": [
    1669,
    1669
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-11",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_6e4963477b0a9ee53e8a292c1804f68b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-1",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_09d57eb9097ccbab605c2c21542ae128",
    "sourceUnitDigest": "3f3e77b66c269da1de24a568c762cc92c3042b35479fc4a9a234583ecb771e44",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-11",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-152 (lines 1669–1669) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-11. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3f3e77b66c269da1de24a568c762cc92c3042b35479fc4a9a234583ecb771e44",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Chọn kiểu routing **theo audience của TỪNG interface**, không toàn cục:
```

### Full target unit

```text
Chọn kiểu routing **theo audience của TỪNG interface**, không toàn cục:
```

### Full diff

```diff
No text difference.
```

## claim_d6319c1c5cd66eb235a52d2dd98aaf95

Source digest: e42d5e19a449f4279faa1d1d32033bafdc01e1a595a641547d91962bc24ba63d

Target digest: e42d5e19a449f4279faa1d1d32033bafdc01e1a595a641547d91962bc24ba63d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-153",
  "sourceLines": [
    1671,
    1675
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-12",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_d872212b0218ea475c32ec48e9e03079",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-1",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d6319c1c5cd66eb235a52d2dd98aaf95",
    "sourceUnitDigest": "e42d5e19a449f4279faa1d1d32033bafdc01e1a595a641547d91962bc24ba63d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-12",
    "claimKind": "decision",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-153 (lines 1671–1675) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-12. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e42d5e19a449f4279faa1d1d32033bafdc01e1a595a641547d91962bc24ba63d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
- **prose-handoff** (bàn giao bằng văn xuôi) cho **agent ↔ agent trong một chuỗi**:
  người đọc là một agent hiểu ngôn ngữ, cần bối cảnh và ý định.
- **data / exit-code / decision-table** (dữ liệu, mã thoát, bảng quyết định) cho
  **consumer không-chắc-là-agent**: người đọc có thể là script/máy, cần hợp đồng
  chặt và phân giải được không mơ hồ.
```

### Full target unit

```text
- **prose-handoff** (bàn giao bằng văn xuôi) cho **agent ↔ agent trong một chuỗi**:
  người đọc là một agent hiểu ngôn ngữ, cần bối cảnh và ý định.
- **data / exit-code / decision-table** (dữ liệu, mã thoát, bảng quyết định) cho
  **consumer không-chắc-là-agent**: người đọc có thể là script/máy, cần hợp đồng
  chặt và phân giải được không mơ hồ.
```

### Full diff

```diff
No text difference.
```

## claim_ea583c26caf4f098a74cc11792a4a322

Source digest: c0d2ed8b1050279455c37226890b760cbd9991f77066c97d57813548c46c3810

Target digest: c0d2ed8b1050279455c37226890b760cbd9991f77066c97d57813548c46c3810

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả-1",
  "sourceLines": [
    1677,
    1677
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả-1",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface"
  ],
  "nativeTargetClaimId": "claim_22c01b9f11a00a9ce02521fd5d197dac",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả-1",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ea583c26caf4f098a74cc11792a4a322",
    "sourceUnitDigest": "c0d2ed8b1050279455c37226890b760cbd9991f77066c97d57813548c46c3810",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả-1",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả-1 (lines 1677–1677) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả-1. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c0d2ed8b1050279455c37226890b760cbd9991f77066c97d57813548c46c3810",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- **Mỗi interface mang đúng hợp đồng cho người đọc nó** — không ép một agent phải
  parse bảng cứng, cũng không ép một script phải hiểu văn xuôi.
- **Quy tắc quyết định rõ:** hỏi "ai đọc đầu kia?" trước khi chọn định dạng, thay
  vì áp một khuôn quen tay lên mọi biên.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
#### Hệ quả

- **Mỗi interface mang đúng hợp đồng cho người đọc nó** — không ép một agent phải
  parse bảng cứng, cũng không ép một script phải hiểu văn xuôi.
- **Quy tắc quyết định rõ:** hỏi "ai đọc đầu kia?" trước khi chọn định dạng, thay
  vì áp một khuôn quen tay lên mọi biên.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_70a514f1fb45b55143db825456292ece

Source digest: 68a090c03687c392007abee05e2630d6a501e4d08ad6a2debe50c33b8edb8776

Target digest: 68a090c03687c392007abee05e2630d6a501e4d08ad6a2debe50c33b8edb8776

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-154",
  "sourceLines": [
    1679,
    1682
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-13",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_03494624dc452bfaf477b4eed9924225",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả-1",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_70a514f1fb45b55143db825456292ece",
    "sourceUnitDigest": "68a090c03687c392007abee05e2630d6a501e4d08ad6a2debe50c33b8edb8776",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-13",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-154 (lines 1679–1682) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-13. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "68a090c03687c392007abee05e2630d6a501e4d08ad6a2debe50c33b8edb8776",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0008 — Routing theo audience của từng interface",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
- **Mỗi interface mang đúng hợp đồng cho người đọc nó** — không ép một agent phải
  parse bảng cứng, cũng không ép một script phải hiểu văn xuôi.
- **Quy tắc quyết định rõ:** hỏi "ai đọc đầu kia?" trước khi chọn định dạng, thay
  vì áp một khuôn quen tay lên mọi biên.
```

### Full target unit

```text
- **Mỗi interface mang đúng hợp đồng cho người đọc nó** — không ép một agent phải
  parse bảng cứng, cũng không ép một script phải hiểu văn xuôi.
- **Quy tắc quyết định rõ:** hỏi "ai đọc đầu kia?" trước khi chọn định dạng, thay
  vì áp một khuôn quen tay lên mọi biên.
```

### Full diff

```diff
No text difference.
```

## claim_fd255b07245da5bc2437df92c1ffd15c

Source digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Target digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-155",
  "sourceLines": [
    1684,
    1684
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0008 — Routing theo audience của từng interface",
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
  "section": "hệ-quả-1",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_fd255b07245da5bc2437df92c1ffd15c",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: target digest repeats; ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-155 (lines 1684–1684) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
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

## claim_fc2a29f61b3b82c22ab9271e70a866b7

Source digest: 846ae5c87d5d064d453beeb1084d4670a19a4da867ab19c3c1cb6fbc5c62b088

Target digest: 846ae5c87d5d064d453beeb1084d4670a19a4da867ab19c3c1cb6fbc5c62b088

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập",
  "sourceLines": [
    1686,
    1686
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_2a135b3df62d7a9da316bc8fd4f9ec0e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_fc2a29f61b3b82c22ab9271e70a866b7",
    "sourceUnitDigest": "846ae5c87d5d064d453beeb1084d4670a19a4da867ab19c3c1cb6fbc5c62b088",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập (lines 1686–1686) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "846ae5c87d5d064d453beeb1084d4670a19a4da867ab19c3c1cb6fbc5c62b088",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)
```

### Full target unit

```text
### 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)
```

### Full diff

```diff
No text difference.
```

## claim_6c3d0086a14dc2c147748d7549f12f27

Source digest: 6fb8b852b1fc94c9a926ec161be7278c2b7e11bce46ac025cacbb612e9514698

Target digest: 6fb8b852b1fc94c9a926ec161be7278c2b7e11bce46ac025cacbb612e9514698

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-2",
  "sourceLines": [
    1688,
    1688
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-2",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)"
  ],
  "nativeTargetClaimId": "claim_53955f408d74af437d73cc944e082186",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6c3d0086a14dc2c147748d7549f12f27",
    "sourceUnitDigest": "6fb8b852b1fc94c9a926ec161be7278c2b7e11bce46ac025cacbb612e9514698",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-2",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-2 (lines 1688–1688) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-2. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "6fb8b852b1fc94c9a926ec161be7278c2b7e11bce46ac025cacbb612e9514698",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

`tsk-1an` tái hiện: `worktree.mjs`'s `createWorktree` (dùng bởi pick/take/runner/approve
cho nhánh `fgw/<id>`) là `git worktree add` trần — vì `.fgos/` được git-tracked trong
repo này, fork checkout ra một BẢN CHỤP `.fgos/` đứng yên tại thời điểm fork, bỏ sót mọi
event chưa commit trên main. `session.mjs`'s `createSession` (dùng cho phiên driver
`fgos session start`) đã giải đúng lớp vấn đề này từ trước — xóa bản checkout rồi
symlink `.fgos/` về thẳng kho chung (trích tại `session.mjs:1-6` và
`specs/runner.md:26`). Hai code path lệch nhau về cách xử lý `.fgos/`; `docs/distillery/
porting-log.md:101` (`worktree-isolation-axis`, nguồn beegog `independent-feature-
worktrees`) treo câu hỏi mở "human chọn khóa-cây hay cô-lập-cây cho fan-out fgOS".

Trước khi chọn trục, đã xác minh bằng đọc code (không đoán):

- Không có gì trong đường dispatch worker đọc/ghi `.fgos/` hôm nay: `dispatch.mjs`'s
  executor spawn ở `cwd = wt.path` (`loop.mjs:699`) không hề gọi `fgos`; prompt worker
  cấm thẳng ("Never call `fgos` yourself and never write to `.fgos/` directly" —
  `worker-prompt-default.txt:18-21`); `dataDir()` của CLI resolve theo `process.cwd()`
  (`bin/fgos.mjs:59-61`), không có `repoRoot` cố định.
- Mọi transition trạng thái/stage — `doing→proposed/blocked` lẫn `proposed→done` — đều
  ghi **từ ngoài worktree**: `loop.mjs`'s `dispatchClaimedItem` gọi `moveWork` cùng
  process với `dir = repoRoot/.fgos` (`loop.mjs:727-815`, `store.mjs:327`); `approve`
  (merge thật) là lệnh CLI riêng chạy ở main checkout (`bin/fgos.mjs:1507`). Cửa ghi
  CTR001/one-door-write **chưa từng nằm trong worktree worker**, bất kể verify chạy ở
  đâu.
- Cơ chế duy nhất từng cho phép worker ẢNH HƯỞNG state — "discovered work" — đã đi theo
  mẫu output-có-cấu-trúc-rồi-runner-tự-áp (`0013`), không phải access sống vào
  `.fgos/`.
- `worker`'s cwd có quyền `Bash(git add:*),Bash(git commit:*)` KHÔNG giới hạn path
  (`dispatch.mjs:210-218`) — không có capability-wall thật, chỉ có lời dặn trong prompt.
  Đúng lớp lỗi repo đã tự ghi nhận ở `capability-enforced-readonly-fanout`
  (porting-log): "capability LÀ tường, không phải câu dặn — sự cố thật: analyst được
  dặn 'no writes' vẫn commit source."
```

### Full target unit

```text
#### Bối cảnh

`tsk-1an` tái hiện: `worktree.mjs`'s `createWorktree` (dùng bởi pick/take/runner/approve
cho nhánh `fgw/<id>`) là `git worktree add` trần — vì `.fgos/` được git-tracked trong
repo này, fork checkout ra một BẢN CHỤP `.fgos/` đứng yên tại thời điểm fork, bỏ sót mọi
event chưa commit trên main. `session.mjs`'s `createSession` (dùng cho phiên driver
`fgos session start`) đã giải đúng lớp vấn đề này từ trước — xóa bản checkout rồi
symlink `.fgos/` về thẳng kho chung (trích tại `session.mjs:1-6` và
`specs/runner.md:26`). Hai code path lệch nhau về cách xử lý `.fgos/`; `docs/distillery/
porting-log.md:101` (`worktree-isolation-axis`, nguồn beegog `independent-feature-
worktrees`) treo câu hỏi mở "human chọn khóa-cây hay cô-lập-cây cho fan-out fgOS".

Trước khi chọn trục, đã xác minh bằng đọc code (không đoán):

- Không có gì trong đường dispatch worker đọc/ghi `.fgos/` hôm nay: `dispatch.mjs`'s
  executor spawn ở `cwd = wt.path` (`loop.mjs:699`) không hề gọi `fgos`; prompt worker
  cấm thẳng ("Never call `fgos` yourself and never write to `.fgos/` directly" —
  `worker-prompt-default.txt:18-21`); `dataDir()` của CLI resolve theo `process.cwd()`
  (`bin/fgos.mjs:59-61`), không có `repoRoot` cố định.
- Mọi transition trạng thái/stage — `doing→proposed/blocked` lẫn `proposed→done` — đều
  ghi **từ ngoài worktree**: `loop.mjs`'s `dispatchClaimedItem` gọi `moveWork` cùng
  process với `dir = repoRoot/.fgos` (`loop.mjs:727-815`, `store.mjs:327`); `approve`
  (merge thật) là lệnh CLI riêng chạy ở main checkout (`bin/fgos.mjs:1507`). Cửa ghi
  CTR001/one-door-write **chưa từng nằm trong worktree worker**, bất kể verify chạy ở
  đâu.
- Cơ chế duy nhất từng cho phép worker ẢNH HƯỞNG state — "discovered work" — đã đi theo
  mẫu output-có-cấu-trúc-rồi-runner-tự-áp (`0013`), không phải access sống vào
  `.fgos/`.
- `worker`'s cwd có quyền `Bash(git add:*),Bash(git commit:*)` KHÔNG giới hạn path
  (`dispatch.mjs:210-218`) — không có capability-wall thật, chỉ có lời dặn trong prompt.
  Đúng lớp lỗi repo đã tự ghi nhận ở `capability-enforced-readonly-fanout`
  (porting-log): "capability LÀ tường, không phải câu dặn — sự cố thật: analyst được
  dặn 'no writes' vẫn commit source."
```

### Full diff

```diff
No text difference.
```

## claim_82947d03f0ca3597b1759f46bd72bde9

Source digest: 2f863460a19cad5a680c705451042ccd74e12bd27f7fefcb774403f291f66790

Target digest: 2f863460a19cad5a680c705451042ccd74e12bd27f7fefcb774403f291f66790

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-156",
  "sourceLines": [
    1690,
    1698
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-15",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_65e6add1999e968bdda31647b4509180",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_82947d03f0ca3597b1759f46bd72bde9",
    "sourceUnitDigest": "2f863460a19cad5a680c705451042ccd74e12bd27f7fefcb774403f291f66790",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-15",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-156 (lines 1690–1698) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-15. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "2f863460a19cad5a680c705451042ccd74e12bd27f7fefcb774403f291f66790",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
`tsk-1an` tái hiện: `worktree.mjs`'s `createWorktree` (dùng bởi pick/take/runner/approve
cho nhánh `fgw/<id>`) là `git worktree add` trần — vì `.fgos/` được git-tracked trong
repo này, fork checkout ra một BẢN CHỤP `.fgos/` đứng yên tại thời điểm fork, bỏ sót mọi
event chưa commit trên main. `session.mjs`'s `createSession` (dùng cho phiên driver
`fgos session start`) đã giải đúng lớp vấn đề này từ trước — xóa bản checkout rồi
symlink `.fgos/` về thẳng kho chung (trích tại `session.mjs:1-6` và
`specs/runner.md:26`). Hai code path lệch nhau về cách xử lý `.fgos/`; `docs/distillery/
porting-log.md:101` (`worktree-isolation-axis`, nguồn beegog `independent-feature-
worktrees`) treo câu hỏi mở "human chọn khóa-cây hay cô-lập-cây cho fan-out fgOS".
```

### Full target unit

```text
`tsk-1an` tái hiện: `worktree.mjs`'s `createWorktree` (dùng bởi pick/take/runner/approve
cho nhánh `fgw/<id>`) là `git worktree add` trần — vì `.fgos/` được git-tracked trong
repo này, fork checkout ra một BẢN CHỤP `.fgos/` đứng yên tại thời điểm fork, bỏ sót mọi
event chưa commit trên main. `session.mjs`'s `createSession` (dùng cho phiên driver
`fgos session start`) đã giải đúng lớp vấn đề này từ trước — xóa bản checkout rồi
symlink `.fgos/` về thẳng kho chung (trích tại `session.mjs:1-6` và
`specs/runner.md:26`). Hai code path lệch nhau về cách xử lý `.fgos/`; `docs/distillery/
porting-log.md:101` (`worktree-isolation-axis`, nguồn beegog `independent-feature-
worktrees`) treo câu hỏi mở "human chọn khóa-cây hay cô-lập-cây cho fan-out fgOS".
```

### Full diff

```diff
No text difference.
```

## claim_2640520d4eb496a0a00f90c7046b7ad3

Source digest: 3dc14d83a27474210e3214adf23a9bcaec37881265f02cfb706fd4539624dd76

Target digest: 3dc14d83a27474210e3214adf23a9bcaec37881265f02cfb706fd4539624dd76

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-157",
  "sourceLines": [
    1700,
    1700
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-16",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_75e9cf43fb462433b761c0b2236f4e29",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_2640520d4eb496a0a00f90c7046b7ad3",
    "sourceUnitDigest": "3dc14d83a27474210e3214adf23a9bcaec37881265f02cfb706fd4539624dd76",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-16",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-157 (lines 1700–1700) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-16. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3dc14d83a27474210e3214adf23a9bcaec37881265f02cfb706fd4539624dd76",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Trước khi chọn trục, đã xác minh bằng đọc code (không đoán):
```

### Full target unit

```text
Trước khi chọn trục, đã xác minh bằng đọc code (không đoán):
```

### Full diff

```diff
No text difference.
```

## claim_d710eacb7b0c198b6feb1bb7cfe2f9d4

Source digest: 92f61c0e309cfdf24b4d5e1c24c74ded53fdc11a9e9d0a5b8cfd8d9bde5c87fd

Target digest: 92f61c0e309cfdf24b4d5e1c24c74ded53fdc11a9e9d0a5b8cfd8d9bde5c87fd

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-158",
  "sourceLines": [
    1702,
    1720
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-17",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_32097706f6956c0681b64b125945fe9e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d710eacb7b0c198b6feb1bb7cfe2f9d4",
    "sourceUnitDigest": "92f61c0e309cfdf24b4d5e1c24c74ded53fdc11a9e9d0a5b8cfd8d9bde5c87fd",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-17",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-158 (lines 1702–1720) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-17. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "92f61c0e309cfdf24b4d5e1c24c74ded53fdc11a9e9d0a5b8cfd8d9bde5c87fd",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
- Không có gì trong đường dispatch worker đọc/ghi `.fgos/` hôm nay: `dispatch.mjs`'s
  executor spawn ở `cwd = wt.path` (`loop.mjs:699`) không hề gọi `fgos`; prompt worker
  cấm thẳng ("Never call `fgos` yourself and never write to `.fgos/` directly" —
  `worker-prompt-default.txt:18-21`); `dataDir()` của CLI resolve theo `process.cwd()`
  (`bin/fgos.mjs:59-61`), không có `repoRoot` cố định.
- Mọi transition trạng thái/stage — `doing→proposed/blocked` lẫn `proposed→done` — đều
  ghi **từ ngoài worktree**: `loop.mjs`'s `dispatchClaimedItem` gọi `moveWork` cùng
  process với `dir = repoRoot/.fgos` (`loop.mjs:727-815`, `store.mjs:327`); `approve`
  (merge thật) là lệnh CLI riêng chạy ở main checkout (`bin/fgos.mjs:1507`). Cửa ghi
  CTR001/one-door-write **chưa từng nằm trong worktree worker**, bất kể verify chạy ở
  đâu.
- Cơ chế duy nhất từng cho phép worker ẢNH HƯỞNG state — "discovered work" — đã đi theo
  mẫu output-có-cấu-trúc-rồi-runner-tự-áp (`0013`), không phải access sống vào
  `.fgos/`.
- `worker`'s cwd có quyền `Bash(git add:*),Bash(git commit:*)` KHÔNG giới hạn path
  (`dispatch.mjs:210-218`) — không có capability-wall thật, chỉ có lời dặn trong prompt.
  Đúng lớp lỗi repo đã tự ghi nhận ở `capability-enforced-readonly-fanout`
  (porting-log): "capability LÀ tường, không phải câu dặn — sự cố thật: analyst được
  dặn 'no writes' vẫn commit source."
```

### Full target unit

```text
- Không có gì trong đường dispatch worker đọc/ghi `.fgos/` hôm nay: `dispatch.mjs`'s
  executor spawn ở `cwd = wt.path` (`loop.mjs:699`) không hề gọi `fgos`; prompt worker
  cấm thẳng ("Never call `fgos` yourself and never write to `.fgos/` directly" —
  `worker-prompt-default.txt:18-21`); `dataDir()` của CLI resolve theo `process.cwd()`
  (`bin/fgos.mjs:59-61`), không có `repoRoot` cố định.
- Mọi transition trạng thái/stage — `doing→proposed/blocked` lẫn `proposed→done` — đều
  ghi **từ ngoài worktree**: `loop.mjs`'s `dispatchClaimedItem` gọi `moveWork` cùng
  process với `dir = repoRoot/.fgos` (`loop.mjs:727-815`, `store.mjs:327`); `approve`
  (merge thật) là lệnh CLI riêng chạy ở main checkout (`bin/fgos.mjs:1507`). Cửa ghi
  CTR001/one-door-write **chưa từng nằm trong worktree worker**, bất kể verify chạy ở
  đâu.
- Cơ chế duy nhất từng cho phép worker ẢNH HƯỞNG state — "discovered work" — đã đi theo
  mẫu output-có-cấu-trúc-rồi-runner-tự-áp (`0013`), không phải access sống vào
  `.fgos/`.
- `worker`'s cwd có quyền `Bash(git add:*),Bash(git commit:*)` KHÔNG giới hạn path
  (`dispatch.mjs:210-218`) — không có capability-wall thật, chỉ có lời dặn trong prompt.
  Đúng lớp lỗi repo đã tự ghi nhận ở `capability-enforced-readonly-fanout`
  (porting-log): "capability LÀ tường, không phải câu dặn — sự cố thật: analyst được
  dặn 'no writes' vẫn commit source."
```

### Full diff

```diff
No text difference.
```

## claim_b3e99ecb4c96ba9df259b1da12621dfb

Source digest: bd3af91b774c6ce83cc9a74d0becc4c5344bf3ed8b8aeb45504bfdd1b0efe1a5

Target digest: bd3af91b774c6ce83cc9a74d0becc4c5344bf3ed8b8aeb45504bfdd1b0efe1a5

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-2",
  "sourceLines": [
    1722,
    1722
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-2",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)"
  ],
  "nativeTargetClaimId": "claim_816e99e626cab19331423f8a9371d6a5",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b3e99ecb4c96ba9df259b1da12621dfb",
    "sourceUnitDigest": "bd3af91b774c6ce83cc9a74d0becc4c5344bf3ed8b8aeb45504bfdd1b0efe1a5",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-2",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-2 (lines 1722–1722) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-2. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "bd3af91b774c6ce83cc9a74d0becc4c5344bf3ed8b8aeb45504bfdd1b0efe1a5",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Chọn phương án thứ ba, hẹp hơn cả hai vế của câu hỏi treo — **chặn-cây**, không phải
khóa-trong-cây (symlink) và không phải cô-lập-cây đầy đủ (bootstrap-copy + union-merge):

- `worktree.mjs`'s `createWorktree`, sau `git worktree add`, xóa hẳn bản `.fgos/` vừa
  checkout ra (không symlink, không giữ lại) — mirror bước xóa của `session.mjs:346-359`
  nhưng KHÔNG làm bước symlink theo sau.
- `merge.mjs` thêm một guard cơ học: một diff của nhánh `fgw/<id>` chạm bất kỳ path nào
  dưới `.fgos/` bị `approve` từ chối cứng trước khi tin merge — wall nằm ở phía trusted
  (mã chạy trên main), không dựa lời dặn worker.
- `session.mjs` giữ nguyên 100% (symlink) — actor khác hẳn: phiên driver được PHÉP
  gọi `fgos`, worker thì không.
```

### Full target unit

```text
#### Quyết định

Chọn phương án thứ ba, hẹp hơn cả hai vế của câu hỏi treo — **chặn-cây**, không phải
khóa-trong-cây (symlink) và không phải cô-lập-cây đầy đủ (bootstrap-copy + union-merge):

- `worktree.mjs`'s `createWorktree`, sau `git worktree add`, xóa hẳn bản `.fgos/` vừa
  checkout ra (không symlink, không giữ lại) — mirror bước xóa của `session.mjs:346-359`
  nhưng KHÔNG làm bước symlink theo sau.
- `merge.mjs` thêm một guard cơ học: một diff của nhánh `fgw/<id>` chạm bất kỳ path nào
  dưới `.fgos/` bị `approve` từ chối cứng trước khi tin merge — wall nằm ở phía trusted
  (mã chạy trên main), không dựa lời dặn worker.
- `session.mjs` giữ nguyên 100% (symlink) — actor khác hẳn: phiên driver được PHÉP
  gọi `fgos`, worker thì không.
```

### Full diff

```diff
No text difference.
```

## claim_e8959424bce46c72d71990506da547d4

Source digest: d0cec64082b3acccc101c8ccac1d250f65b94e02494ae5f1a08d07df37ab92db

Target digest: d0cec64082b3acccc101c8ccac1d250f65b94e02494ae5f1a08d07df37ab92db

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-159",
  "sourceLines": [
    1724,
    1725
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-18",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_581765f3f210cf27b8446d82ef48baed",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e8959424bce46c72d71990506da547d4",
    "sourceUnitDigest": "d0cec64082b3acccc101c8ccac1d250f65b94e02494ae5f1a08d07df37ab92db",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-18",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-159 (lines 1724–1725) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-18. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d0cec64082b3acccc101c8ccac1d250f65b94e02494ae5f1a08d07df37ab92db",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Chọn phương án thứ ba, hẹp hơn cả hai vế của câu hỏi treo — **chặn-cây**, không phải
khóa-trong-cây (symlink) và không phải cô-lập-cây đầy đủ (bootstrap-copy + union-merge):
```

### Full target unit

```text
Chọn phương án thứ ba, hẹp hơn cả hai vế của câu hỏi treo — **chặn-cây**, không phải
khóa-trong-cây (symlink) và không phải cô-lập-cây đầy đủ (bootstrap-copy + union-merge):
```

### Full diff

```diff
No text difference.
```

## claim_83e19a7229586ffd422226045900c35f

Source digest: 49f444d9ca1e542d3e072d4f4a80d9c22a599e32b722c748f5e2fc5289f07992

Target digest: 49f444d9ca1e542d3e072d4f4a80d9c22a599e32b722c748f5e2fc5289f07992

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-160",
  "sourceLines": [
    1727,
    1734
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-19",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_81a04892b84d6b617277af8ee88ee212",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_83e19a7229586ffd422226045900c35f",
    "sourceUnitDigest": "49f444d9ca1e542d3e072d4f4a80d9c22a599e32b722c748f5e2fc5289f07992",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-19",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-160 (lines 1727–1734) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-19. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "49f444d9ca1e542d3e072d4f4a80d9c22a599e32b722c748f5e2fc5289f07992",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
- `worktree.mjs`'s `createWorktree`, sau `git worktree add`, xóa hẳn bản `.fgos/` vừa
  checkout ra (không symlink, không giữ lại) — mirror bước xóa của `session.mjs:346-359`
  nhưng KHÔNG làm bước symlink theo sau.
- `merge.mjs` thêm một guard cơ học: một diff của nhánh `fgw/<id>` chạm bất kỳ path nào
  dưới `.fgos/` bị `approve` từ chối cứng trước khi tin merge — wall nằm ở phía trusted
  (mã chạy trên main), không dựa lời dặn worker.
- `session.mjs` giữ nguyên 100% (symlink) — actor khác hẳn: phiên driver được PHÉP
  gọi `fgos`, worker thì không.
```

### Full target unit

```text
- `worktree.mjs`'s `createWorktree`, sau `git worktree add`, xóa hẳn bản `.fgos/` vừa
  checkout ra (không symlink, không giữ lại) — mirror bước xóa của `session.mjs:346-359`
  nhưng KHÔNG làm bước symlink theo sau.
- `merge.mjs` thêm một guard cơ học: một diff của nhánh `fgw/<id>` chạm bất kỳ path nào
  dưới `.fgos/` bị `approve` từ chối cứng trước khi tin merge — wall nằm ở phía trusted
  (mã chạy trên main), không dựa lời dặn worker.
- `session.mjs` giữ nguyên 100% (symlink) — actor khác hẳn: phiên driver được PHÉP
  gọi `fgos`, worker thì không.
```

### Full diff

```diff
No text difference.
```

## claim_7bdaab988a25b47521c865264de5bda2

Source digest: e864974187268596c338d30eef5701de3316dcd7714c54b7999fab819bf746a4

Target digest: e864974187268596c338d30eef5701de3316dcd7714c54b7999fab819bf746a4

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "vì-sao-không-khóa-trong-cây-symlink-như-sessionmjs",
  "sourceLines": [
    1736,
    1736
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "vì-sao-không-khóa-trong-cây-symlink-như-sessionmjs",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_72938353f004ecf4b38d6e14d9ce43cd",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-không-khóa-trong-cây-symlink-như-sessionmjs",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_7bdaab988a25b47521c865264de5bda2",
    "sourceUnitDigest": "e864974187268596c338d30eef5701de3316dcd7714c54b7999fab819bf746a4",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "vì-sao-không-khóa-trong-cây-symlink-như-sessionmjs",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#vì-sao-không-khóa-trong-cây-symlink-như-sessionmjs (lines 1736–1736) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#vì-sao-không-khóa-trong-cây-symlink-như-sessionmjs. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e864974187268596c338d30eef5701de3316dcd7714c54b7999fab819bf746a4",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
##### Vì sao không khóa-trong-cây (symlink như session.mjs)

Đúng pattern cho actor trusted (session), SAI cho worker: symlink trỏ RA NGOÀI worktree
là lối thoát sandbox kinh điển — một write-guard mai sau muốn khoanh worker vào đúng cây
của nó sẽ phải tự biết resolve symlink target mới chặn được, nếu không thì path
`.fgos/events.jsonl` nhìn như "trong worktree" nhưng thật ra ghi thẳng ra kho sống. Hơn
nữa symlink cấp quyền ghi SỐNG vào kho DUY NHẤT từ một execution context không có
capability-wall thật (wildcard git add/commit, xem Bối cảnh) — một lần ghi lạc (bug,
prompt injection, hay agent tự ý) đâm thẳng vào `.fgos/events.jsonl` thật, không qua
review, không như code (code lỡ sai còn nằm trên nhánh vứt được). Nặng hơn cả hiện trạng
(bản chụp cũ đứng yên, ghi lạc vào đó chỉ tự làm bẩn nhánh của chính nó, bị chặn lúc
merge nếu commit).
```

### Full target unit

```text
##### Vì sao không khóa-trong-cây (symlink như session.mjs)

Đúng pattern cho actor trusted (session), SAI cho worker: symlink trỏ RA NGOÀI worktree
là lối thoát sandbox kinh điển — một write-guard mai sau muốn khoanh worker vào đúng cây
của nó sẽ phải tự biết resolve symlink target mới chặn được, nếu không thì path
`.fgos/events.jsonl` nhìn như "trong worktree" nhưng thật ra ghi thẳng ra kho sống. Hơn
nữa symlink cấp quyền ghi SỐNG vào kho DUY NHẤT từ một execution context không có
capability-wall thật (wildcard git add/commit, xem Bối cảnh) — một lần ghi lạc (bug,
prompt injection, hay agent tự ý) đâm thẳng vào `.fgos/events.jsonl` thật, không qua
review, không như code (code lỡ sai còn nằm trên nhánh vứt được). Nặng hơn cả hiện trạng
(bản chụp cũ đứng yên, ghi lạc vào đó chỉ tự làm bẩn nhánh của chính nó, bị chặn lúc
merge nếu commit).
```

### Full diff

```diff
No text difference.
```

## claim_a851d1084ff0574381b28ba862edd3e4

Source digest: 188d06d40981d970b1a47a319f5757ca1e1a9cd400388e21b2a563ebc95c2957

Target digest: 188d06d40981d970b1a47a319f5757ca1e1a9cd400388e21b2a563ebc95c2957

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-161",
  "sourceLines": [
    1738,
    1747
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định",
    "Vì sao không khóa-trong-cây (symlink như session.mjs)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-20",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định",
    "Vì sao không khóa-trong-cây (symlink như session.mjs)"
  ],
  "nativeTargetClaimId": "claim_291ac465c099255b7e487d780fa6a4a8",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-không-khóa-trong-cây-symlink-như-sessionmjs",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_a851d1084ff0574381b28ba862edd3e4",
    "sourceUnitDigest": "188d06d40981d970b1a47a319f5757ca1e1a9cd400388e21b2a563ebc95c2957",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-20",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-161 (lines 1738–1747) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-20. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "188d06d40981d970b1a47a319f5757ca1e1a9cd400388e21b2a563ebc95c2957",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Quyết định",
      "Vì sao không khóa-trong-cây (symlink như session.mjs)"
    ]
  }
}
```

### Full source unit

```text
Đúng pattern cho actor trusted (session), SAI cho worker: symlink trỏ RA NGOÀI worktree
là lối thoát sandbox kinh điển — một write-guard mai sau muốn khoanh worker vào đúng cây
của nó sẽ phải tự biết resolve symlink target mới chặn được, nếu không thì path
`.fgos/events.jsonl` nhìn như "trong worktree" nhưng thật ra ghi thẳng ra kho sống. Hơn
nữa symlink cấp quyền ghi SỐNG vào kho DUY NHẤT từ một execution context không có
capability-wall thật (wildcard git add/commit, xem Bối cảnh) — một lần ghi lạc (bug,
prompt injection, hay agent tự ý) đâm thẳng vào `.fgos/events.jsonl` thật, không qua
review, không như code (code lỡ sai còn nằm trên nhánh vứt được). Nặng hơn cả hiện trạng
(bản chụp cũ đứng yên, ghi lạc vào đó chỉ tự làm bẩn nhánh của chính nó, bị chặn lúc
merge nếu commit).
```

### Full target unit

```text
Đúng pattern cho actor trusted (session), SAI cho worker: symlink trỏ RA NGOÀI worktree
là lối thoát sandbox kinh điển — một write-guard mai sau muốn khoanh worker vào đúng cây
của nó sẽ phải tự biết resolve symlink target mới chặn được, nếu không thì path
`.fgos/events.jsonl` nhìn như "trong worktree" nhưng thật ra ghi thẳng ra kho sống. Hơn
nữa symlink cấp quyền ghi SỐNG vào kho DUY NHẤT từ một execution context không có
capability-wall thật (wildcard git add/commit, xem Bối cảnh) — một lần ghi lạc (bug,
prompt injection, hay agent tự ý) đâm thẳng vào `.fgos/events.jsonl` thật, không qua
review, không như code (code lỡ sai còn nằm trên nhánh vứt được). Nặng hơn cả hiện trạng
(bản chụp cũ đứng yên, ghi lạc vào đó chỉ tự làm bẩn nhánh của chính nó, bị chặn lúc
merge nếu commit).
```

### Full diff

```diff
No text difference.
```

## claim_b272040e723c24b073c0927d9cc44ec3

Source digest: 5246787f1280c40ba0d102aebc576fcf363c3461cd01d5d710c4c8962bf89c92

Target digest: 5246787f1280c40ba0d102aebc576fcf363c3461cd01d5d710c4c8962bf89c92

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "vì-sao-không-cô-lập-cây-đầy-đủ-bootstrap-copy-union-merge-kiểu-beegogsymphony",
  "sourceLines": [
    1749,
    1749
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "vì-sao-không-cô-lập-cây-đầy-đủ-bootstrap-copy-union-merge-kiểu-beegogsymphony",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_3e5ce4a72a1a7fc88455a03fe4a28e2b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-không-cô-lập-cây-đầy-đủ-bootstrap-copy-union-merge-kiểu-beegogsymphony",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b272040e723c24b073c0927d9cc44ec3",
    "sourceUnitDigest": "5246787f1280c40ba0d102aebc576fcf363c3461cd01d5d710c4c8962bf89c92",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "vì-sao-không-cô-lập-cây-đầy-đủ-bootstrap-copy-union-merge-kiểu-beegogsymphony",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#vì-sao-không-cô-lập-cây-đầy-đủ-bootstrap-copy-union-merge-kiểu-beegogsymphony (lines 1749–1749) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#vì-sao-không-cô-lập-cây-đầy-đủ-bootstrap-copy-union-merge-kiểu-beegogsymphony. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "5246787f1280c40ba0d102aebc576fcf363c3461cd01d5d710c4c8962bf89c92",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
##### Vì sao không cô-lập-cây đầy đủ (bootstrap-copy + union-merge, kiểu beegog/symphony)

Đúng pattern cho worker THẬT SỰ cần state riêng rồi hòa giải sau (repository-harness's
`symphony-isolated-runner`: "root db never source of truth of the run", đổi trạng thái
bền chỉ qua semantic changeset) — nhưng đó là bài **chưa ai hỏi** ở fgOS hôm nay: đã xác
minh không nơi nào trong dispatch cần đọc/ghi `.fgos/` từ worktree (xem Bối cảnh). Build
cả subsystem F3 (store riêng + grant read-only + resolve + union-merge lúc merge-back)
cho nhu cầu chưa tồn tại là xây trước — ngược YAGNI (`development-rules.md`). Nó còn kéo
thêm một mặt trận chưa có lời giải rẻ trong Node: cấp "read-only main-store" cho worktree
mà worktree "không tự-cấp" (đúng chữ porting-log dùng) đòi cơ chế permission/bind-mount
không cơ học đơn giản cross-platform — thêm bề mặt phải giữ đúng cho một khả năng chưa
dùng.
```

### Full target unit

```text
##### Vì sao không cô-lập-cây đầy đủ (bootstrap-copy + union-merge, kiểu beegog/symphony)

Đúng pattern cho worker THẬT SỰ cần state riêng rồi hòa giải sau (repository-harness's
`symphony-isolated-runner`: "root db never source of truth of the run", đổi trạng thái
bền chỉ qua semantic changeset) — nhưng đó là bài **chưa ai hỏi** ở fgOS hôm nay: đã xác
minh không nơi nào trong dispatch cần đọc/ghi `.fgos/` từ worktree (xem Bối cảnh). Build
cả subsystem F3 (store riêng + grant read-only + resolve + union-merge lúc merge-back)
cho nhu cầu chưa tồn tại là xây trước — ngược YAGNI (`development-rules.md`). Nó còn kéo
thêm một mặt trận chưa có lời giải rẻ trong Node: cấp "read-only main-store" cho worktree
mà worktree "không tự-cấp" (đúng chữ porting-log dùng) đòi cơ chế permission/bind-mount
không cơ học đơn giản cross-platform — thêm bề mặt phải giữ đúng cho một khả năng chưa
dùng.
```

### Full diff

```diff
No text difference.
```

## claim_84afd5693c0006c1f53f0c1cf891e59e

Source digest: be0da6bac17e587080b7e0a7b7c2990ae40c7b1f8fd50edb315dc77318afda99

Target digest: be0da6bac17e587080b7e0a7b7c2990ae40c7b1f8fd50edb315dc77318afda99

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-162",
  "sourceLines": [
    1751,
    1760
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định",
    "Vì sao không cô-lập-cây đầy đủ (bootstrap-copy + union-merge, kiểu beegog/symphony)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-21",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định",
    "Vì sao không cô-lập-cây đầy đủ (bootstrap-copy + union-merge, kiểu beegog/symphony)"
  ],
  "nativeTargetClaimId": "claim_d010b3c882eddf63df2b0f8910b10e61",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-không-cô-lập-cây-đầy-đủ-bootstrap-copy-union-merge-kiểu-beegogsymphony",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_84afd5693c0006c1f53f0c1cf891e59e",
    "sourceUnitDigest": "be0da6bac17e587080b7e0a7b7c2990ae40c7b1f8fd50edb315dc77318afda99",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-21",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-162 (lines 1751–1760) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-21. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "be0da6bac17e587080b7e0a7b7c2990ae40c7b1f8fd50edb315dc77318afda99",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Quyết định",
      "Vì sao không cô-lập-cây đầy đủ (bootstrap-copy + union-merge, kiểu beegog/symphony)"
    ]
  }
}
```

### Full source unit

```text
Đúng pattern cho worker THẬT SỰ cần state riêng rồi hòa giải sau (repository-harness's
`symphony-isolated-runner`: "root db never source of truth of the run", đổi trạng thái
bền chỉ qua semantic changeset) — nhưng đó là bài **chưa ai hỏi** ở fgOS hôm nay: đã xác
minh không nơi nào trong dispatch cần đọc/ghi `.fgos/` từ worktree (xem Bối cảnh). Build
cả subsystem F3 (store riêng + grant read-only + resolve + union-merge lúc merge-back)
cho nhu cầu chưa tồn tại là xây trước — ngược YAGNI (`development-rules.md`). Nó còn kéo
thêm một mặt trận chưa có lời giải rẻ trong Node: cấp "read-only main-store" cho worktree
mà worktree "không tự-cấp" (đúng chữ porting-log dùng) đòi cơ chế permission/bind-mount
không cơ học đơn giản cross-platform — thêm bề mặt phải giữ đúng cho một khả năng chưa
dùng.
```

### Full target unit

```text
Đúng pattern cho worker THẬT SỰ cần state riêng rồi hòa giải sau (repository-harness's
`symphony-isolated-runner`: "root db never source of truth of the run", đổi trạng thái
bền chỉ qua semantic changeset) — nhưng đó là bài **chưa ai hỏi** ở fgOS hôm nay: đã xác
minh không nơi nào trong dispatch cần đọc/ghi `.fgos/` từ worktree (xem Bối cảnh). Build
cả subsystem F3 (store riêng + grant read-only + resolve + union-merge lúc merge-back)
cho nhu cầu chưa tồn tại là xây trước — ngược YAGNI (`development-rules.md`). Nó còn kéo
thêm một mặt trận chưa có lời giải rẻ trong Node: cấp "read-only main-store" cho worktree
mà worktree "không tự-cấp" (đúng chữ porting-log dùng) đòi cơ chế permission/bind-mount
không cơ học đơn giản cross-platform — thêm bề mặt phải giữ đúng cho một khả năng chưa
dùng.
```

### Full diff

```diff
No text difference.
```

## claim_97b71c7b8325cf01a893754c17c27dc7

Source digest: 9042f3c00d50553049e56f46052cc4a6bee2765b2f785f9d014a82a509b5a684

Target digest: 9042f3c00d50553049e56f46052cc4a6bee2765b2f785f9d014a82a509b5a684

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "vì-sao-chặn-cây",
  "sourceLines": [
    1762,
    1762
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "vì-sao-chặn-cây",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_bb1ff64ceba77d3fe5bc64f26fe10909",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "vì-sao-chặn-cây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_97b71c7b8325cf01a893754c17c27dc7",
    "sourceUnitDigest": "9042f3c00d50553049e56f46052cc4a6bee2765b2f785f9d014a82a509b5a684",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "vì-sao-chặn-cây",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#vì-sao-chặn-cây (lines 1762–1762) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#vì-sao-chặn-cây. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "9042f3c00d50553049e56f46052cc4a6bee2765b2f785f9d014a82a509b5a684",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
##### Vì sao chặn-cây

Đóng cả hai rủi ro cùng lúc, chi phí nhỏ nhất:

- Đóng bug tái hiện của `tsk-1an` triệt để hơn cả khóa lẫn cô-lập: không còn bản `.fgos/`
  nào trong worktree để "thiếu" hay "cũ" — không có gì để đọc sai, vì đọc sai cần có dữ
  liệu (dù cũ) để đọc.
- Đóng lối thoát sandbox mà khóa-trong-cây mở ra, mà không cần xây subsystem của cô-lập.
- Không thêm state phải đồng bộ, không thêm cửa ghi thứ hai — CTR001 one-door-write giữ
  nguyên nghĩa đen: chỉ một nơi vật lý là `.fgos/`, đứng ở `repoRoot`.
- Đường mở rộng vẫn còn nguyên nếu sau này worker THẬT cần ảnh hưởng state (planning
  worker, luồng dài tự đề xuất việc): nối theo đúng mẫu `0013` (output có cấu trúc,
  runner/main checkout tự áp qua verb) — không cần đảo quyết định này, chỉ cần thêm một
  kênh output nữa, giống discovered-work.

Không chốt cho trục điều phối rộng hơn (`worktree-isolation-axis`, đa-agent tách nhánh
tính năng song song) — câu hỏi đó vẫn `candidate` ở `porting-log.md:101`, phạm vi rộng
hơn hẳn bug `.fgos`-trong-`fgw/<id>` này.
```

### Full target unit

```text
##### Vì sao chặn-cây

Đóng cả hai rủi ro cùng lúc, chi phí nhỏ nhất:

- Đóng bug tái hiện của `tsk-1an` triệt để hơn cả khóa lẫn cô-lập: không còn bản `.fgos/`
  nào trong worktree để "thiếu" hay "cũ" — không có gì để đọc sai, vì đọc sai cần có dữ
  liệu (dù cũ) để đọc.
- Đóng lối thoát sandbox mà khóa-trong-cây mở ra, mà không cần xây subsystem của cô-lập.
- Không thêm state phải đồng bộ, không thêm cửa ghi thứ hai — CTR001 one-door-write giữ
  nguyên nghĩa đen: chỉ một nơi vật lý là `.fgos/`, đứng ở `repoRoot`.
- Đường mở rộng vẫn còn nguyên nếu sau này worker THẬT cần ảnh hưởng state (planning
  worker, luồng dài tự đề xuất việc): nối theo đúng mẫu `0013` (output có cấu trúc,
  runner/main checkout tự áp qua verb) — không cần đảo quyết định này, chỉ cần thêm một
  kênh output nữa, giống discovered-work.

Không chốt cho trục điều phối rộng hơn (`worktree-isolation-axis`, đa-agent tách nhánh
tính năng song song) — câu hỏi đó vẫn `candidate` ở `porting-log.md:101`, phạm vi rộng
hơn hẳn bug `.fgos`-trong-`fgw/<id>` này.
```

### Full diff

```diff
No text difference.
```

## claim_63334a97536dcef6c54b64f986b6bd58

Source digest: c44761ab4dd5a4ee84f0ba874a0e4b96c2aa3baafafbe1802e2ad8e7b2a2cb56

Target digest: c44761ab4dd5a4ee84f0ba874a0e4b96c2aa3baafafbe1802e2ad8e7b2a2cb56

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-163",
  "sourceLines": [
    1764,
    1764
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định",
    "Vì sao chặn-cây"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-22",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định",
    "Vì sao chặn-cây"
  ],
  "nativeTargetClaimId": "claim_9aad073e00cd88638dde0fedb1de06ba",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-chặn-cây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_63334a97536dcef6c54b64f986b6bd58",
    "sourceUnitDigest": "c44761ab4dd5a4ee84f0ba874a0e4b96c2aa3baafafbe1802e2ad8e7b2a2cb56",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-22",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-163 (lines 1764–1764) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-22. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c44761ab4dd5a4ee84f0ba874a0e4b96c2aa3baafafbe1802e2ad8e7b2a2cb56",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Quyết định",
      "Vì sao chặn-cây"
    ]
  }
}
```

### Full source unit

```text
Đóng cả hai rủi ro cùng lúc, chi phí nhỏ nhất:
```

### Full target unit

```text
Đóng cả hai rủi ro cùng lúc, chi phí nhỏ nhất:
```

### Full diff

```diff
No text difference.
```

## claim_3e65bf4753fcc751b792f8cf4b67419e

Source digest: a818c4dc5a4517a8d3aaebf61209187dce07d5963f26dccd2097cf15fee3825c

Target digest: a818c4dc5a4517a8d3aaebf61209187dce07d5963f26dccd2097cf15fee3825c

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-164",
  "sourceLines": [
    1766,
    1775
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định",
    "Vì sao chặn-cây"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-23",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định",
    "Vì sao chặn-cây"
  ],
  "nativeTargetClaimId": "claim_bf848d40685fdf751a74e4129fc405ac",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-chặn-cây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3e65bf4753fcc751b792f8cf4b67419e",
    "sourceUnitDigest": "a818c4dc5a4517a8d3aaebf61209187dce07d5963f26dccd2097cf15fee3825c",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-23",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-164 (lines 1766–1775) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-23. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a818c4dc5a4517a8d3aaebf61209187dce07d5963f26dccd2097cf15fee3825c",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Quyết định",
      "Vì sao chặn-cây"
    ]
  }
}
```

### Full source unit

```text
- Đóng bug tái hiện của `tsk-1an` triệt để hơn cả khóa lẫn cô-lập: không còn bản `.fgos/`
  nào trong worktree để "thiếu" hay "cũ" — không có gì để đọc sai, vì đọc sai cần có dữ
  liệu (dù cũ) để đọc.
- Đóng lối thoát sandbox mà khóa-trong-cây mở ra, mà không cần xây subsystem của cô-lập.
- Không thêm state phải đồng bộ, không thêm cửa ghi thứ hai — CTR001 one-door-write giữ
  nguyên nghĩa đen: chỉ một nơi vật lý là `.fgos/`, đứng ở `repoRoot`.
- Đường mở rộng vẫn còn nguyên nếu sau này worker THẬT cần ảnh hưởng state (planning
  worker, luồng dài tự đề xuất việc): nối theo đúng mẫu `0013` (output có cấu trúc,
  runner/main checkout tự áp qua verb) — không cần đảo quyết định này, chỉ cần thêm một
  kênh output nữa, giống discovered-work.
```

### Full target unit

```text
- Đóng bug tái hiện của `tsk-1an` triệt để hơn cả khóa lẫn cô-lập: không còn bản `.fgos/`
  nào trong worktree để "thiếu" hay "cũ" — không có gì để đọc sai, vì đọc sai cần có dữ
  liệu (dù cũ) để đọc.
- Đóng lối thoát sandbox mà khóa-trong-cây mở ra, mà không cần xây subsystem của cô-lập.
- Không thêm state phải đồng bộ, không thêm cửa ghi thứ hai — CTR001 one-door-write giữ
  nguyên nghĩa đen: chỉ một nơi vật lý là `.fgos/`, đứng ở `repoRoot`.
- Đường mở rộng vẫn còn nguyên nếu sau này worker THẬT cần ảnh hưởng state (planning
  worker, luồng dài tự đề xuất việc): nối theo đúng mẫu `0013` (output có cấu trúc,
  runner/main checkout tự áp qua verb) — không cần đảo quyết định này, chỉ cần thêm một
  kênh output nữa, giống discovered-work.
```

### Full diff

```diff
No text difference.
```

## claim_fc1455edf4ca2acbae01ff194cd71951

Source digest: a864acacd269750cf31c62618e5f4d294754bc7393bdb5dd130eec00cf278527

Target digest: a864acacd269750cf31c62618e5f4d294754bc7393bdb5dd130eec00cf278527

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-165",
  "sourceLines": [
    1777,
    1779
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định",
    "Vì sao chặn-cây"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-24",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Quyết định",
    "Vì sao chặn-cây"
  ],
  "nativeTargetClaimId": "claim_5336382b97f13e0cc766690dd7aa5156",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-chặn-cây",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_fc1455edf4ca2acbae01ff194cd71951",
    "sourceUnitDigest": "a864acacd269750cf31c62618e5f4d294754bc7393bdb5dd130eec00cf278527",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-24",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-165 (lines 1777–1779) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-24. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a864acacd269750cf31c62618e5f4d294754bc7393bdb5dd130eec00cf278527",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Quyết định",
      "Vì sao chặn-cây"
    ]
  }
}
```

### Full source unit

```text
Không chốt cho trục điều phối rộng hơn (`worktree-isolation-axis`, đa-agent tách nhánh
tính năng song song) — câu hỏi đó vẫn `candidate` ở `porting-log.md:101`, phạm vi rộng
hơn hẳn bug `.fgos`-trong-`fgw/<id>` này.
```

### Full target unit

```text
Không chốt cho trục điều phối rộng hơn (`worktree-isolation-axis`, đa-agent tách nhánh
tính năng song song) — câu hỏi đó vẫn `candidate` ở `porting-log.md:101`, phạm vi rộng
hơn hẳn bug `.fgos`-trong-`fgw/<id>` này.
```

### Full diff

```diff
No text difference.
```

## claim_f5934f88d357e84d390235e5863c051c

Source digest: 1a4eed607d10e73fe1cff749ffe1c5c17c6d79ec05d5928d3e014b24ccac6e39

Target digest: 1a4eed607d10e73fe1cff749ffe1c5c17c6d79ec05d5928d3e014b24ccac6e39

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả-2",
  "sourceLines": [
    1781,
    1781
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả-2",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)"
  ],
  "nativeTargetClaimId": "claim_0867031af0101c341a9c666409275e78",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f5934f88d357e84d390235e5863c051c",
    "sourceUnitDigest": "1a4eed607d10e73fe1cff749ffe1c5c17c6d79ec05d5928d3e014b24ccac6e39",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả-2",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả-2 (lines 1781–1781) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả-2. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "1a4eed607d10e73fe1cff749ffe1c5c17c6d79ec05d5928d3e014b24ccac6e39",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- `worktree.mjs`, `merge.mjs` cần sửa theo đúng hai gạch đầu dòng ở Quyết định — chưa
  làm tại thời điểm ghi record này, đây là quyết định trục, phần thực thi đi theo sau.
  Kiểm test: (1) tái hiện bug gốc (submit uncommitted rồi pick → xác nhận trước-sửa
  worktree mang bản `.fgos/` cũ/thiếu), (2) sau sửa, worktree hoàn toàn không có
  `.fgos/`, (3) `merge.mjs` từ chối một diff giả lập có chạm path `.fgos/`.
- `tsk-3w8` (đợi trục này chốt, theo `deps`) không đổi hướng gì thêm — vấn đề của nó
  (race main-checkout lúc `approve`/commit) là lớp coordination khác, không phải
  DB-copy/staleness của trục này.
- `session.mjs` không đổi — vẫn symlink, vẫn.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
#### Hệ quả

- `worktree.mjs`, `merge.mjs` cần sửa theo đúng hai gạch đầu dòng ở Quyết định — chưa
  làm tại thời điểm ghi record này, đây là quyết định trục, phần thực thi đi theo sau.
  Kiểm test: (1) tái hiện bug gốc (submit uncommitted rồi pick → xác nhận trước-sửa
  worktree mang bản `.fgos/` cũ/thiếu), (2) sau sửa, worktree hoàn toàn không có
  `.fgos/`, (3) `merge.mjs` từ chối một diff giả lập có chạm path `.fgos/`.
- `tsk-3w8` (đợi trục này chốt, theo `deps`) không đổi hướng gì thêm — vấn đề của nó
  (race main-checkout lúc `approve`/commit) là lớp coordination khác, không phải
  DB-copy/staleness của trục này.
- `session.mjs` không đổi — vẫn symlink, vẫn.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_3b408585d46b76cfa21775dddce07417

Source digest: a15b4b232930d291368f455a3fa06893ed1f94fc2d4b686962db39f80bcc8288

Target digest: a15b4b232930d291368f455a3fa06893ed1f94fc2d4b686962db39f80bcc8288

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-166",
  "sourceLines": [
    1783,
    1791
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-25",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_ad8a1398de7b150e643c7084759bb22b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3b408585d46b76cfa21775dddce07417",
    "sourceUnitDigest": "a15b4b232930d291368f455a3fa06893ed1f94fc2d4b686962db39f80bcc8288",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-25",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-166 (lines 1783–1791) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-25. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a15b4b232930d291368f455a3fa06893ed1f94fc2d4b686962db39f80bcc8288",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
- `worktree.mjs`, `merge.mjs` cần sửa theo đúng hai gạch đầu dòng ở Quyết định — chưa
  làm tại thời điểm ghi record này, đây là quyết định trục, phần thực thi đi theo sau.
  Kiểm test: (1) tái hiện bug gốc (submit uncommitted rồi pick → xác nhận trước-sửa
  worktree mang bản `.fgos/` cũ/thiếu), (2) sau sửa, worktree hoàn toàn không có
  `.fgos/`, (3) `merge.mjs` từ chối một diff giả lập có chạm path `.fgos/`.
- `tsk-3w8` (đợi trục này chốt, theo `deps`) không đổi hướng gì thêm — vấn đề của nó
  (race main-checkout lúc `approve`/commit) là lớp coordination khác, không phải
  DB-copy/staleness của trục này.
- `session.mjs` không đổi — vẫn symlink, vẫn.
```

### Full target unit

```text
- `worktree.mjs`, `merge.mjs` cần sửa theo đúng hai gạch đầu dòng ở Quyết định — chưa
  làm tại thời điểm ghi record này, đây là quyết định trục, phần thực thi đi theo sau.
  Kiểm test: (1) tái hiện bug gốc (submit uncommitted rồi pick → xác nhận trước-sửa
  worktree mang bản `.fgos/` cũ/thiếu), (2) sau sửa, worktree hoàn toàn không có
  `.fgos/`, (3) `merge.mjs` từ chối một diff giả lập có chạm path `.fgos/`.
- `tsk-3w8` (đợi trục này chốt, theo `deps`) không đổi hướng gì thêm — vấn đề của nó
  (race main-checkout lúc `approve`/commit) là lớp coordination khác, không phải
  DB-copy/staleness của trục này.
- `session.mjs` không đổi — vẫn symlink, vẫn.
```

### Full diff

```diff
No text difference.
```

## claim_e4beb2d579963a35d9b26b2265967d27

Source digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Target digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-167",
  "sourceLines": [
    1793,
    1793
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)",
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
  "section": "hệ-quả-2",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e4beb2d579963a35d9b26b2265967d27",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: target digest repeats; ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-167 (lines 1793–1793) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
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

## claim_ae62e94e555e534f15f87337b38c4fca

Source digest: 959caa2c40413558eef7fc8ddf9b56e55624d8e1d2d1ca39bef105028e8bf7d4

Target digest: 959caa2c40413558eef7fc8ddf9b56e55624d8e1d2d1ca39bef105028e8bf7d4

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0021-wire-main-checkout-lock-hook-qua-fgos-doctorsetup-không-epoch-fence",
  "sourceLines": [
    1795,
    1795
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0021-wire-main-checkout-lock-hook-qua-fgos-doctorsetup-không-epoch-fence",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_af35c33829842706185c029734f65f34",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0021-wire-main-checkout-lock-hook-qua-fgos-doctorsetup-không-epoch-fence",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ae62e94e555e534f15f87337b38c4fca",
    "sourceUnitDigest": "959caa2c40413558eef7fc8ddf9b56e55624d8e1d2d1ca39bef105028e8bf7d4",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0021-wire-main-checkout-lock-hook-qua-fgos-doctorsetup-không-epoch-fence",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0021-wire-main-checkout-lock-hook-qua-fgos-doctorsetup-không-epoch-fence (lines 1795–1795) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0021-wire-main-checkout-lock-hook-qua-fgos-doctorsetup-không-epoch-fence. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "959caa2c40413558eef7fc8ddf9b56e55624d8e1d2d1ca39bef105028e8bf7d4",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence
```

### Full target unit

```text
### 0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence
```

### Full diff

```diff
No text difference.
```

## claim_22c8f33258e3b20ea891e98973ca284c

Source digest: ad761744dda5fb4efe907ece8dd148f3e6441853b0b4f328bd323958720ff323

Target digest: ad761744dda5fb4efe907ece8dd148f3e6441853b0b4f328bd323958720ff323

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-3",
  "sourceLines": [
    1797,
    1797
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-3",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence"
  ],
  "nativeTargetClaimId": "claim_190e227e6d927dfd7d82aa89a6b59833",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_22c8f33258e3b20ea891e98973ca284c",
    "sourceUnitDigest": "ad761744dda5fb4efe907ece8dd148f3e6441853b0b4f328bd323958720ff323",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-3",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-3 (lines 1797–1797) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ad761744dda5fb4efe907ece8dd148f3e6441853b0b4f328bd323958720ff323",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

`tsk-3w8` tái hiện thật (2026-07-28, dogfood tsk-veg): `approve`'s bước cuối
(`mergeRunnerItem`'s `git commit --no-edit`, merge.mjs) fail khi 1 session
khác commit lên main CÙNG LÚC (`.git/index` clobbering — đúng lớp lỗi
`str65-worktree-isolation-enforcement` đặt tên). Code merge vẫn landed đúng
lên main; chỉ bước ghi `work.move(to:'done')` sau đó rớt, item ở lại
`proposed` dù thực tế đã xong.

Trước khi chọn hướng sửa, phát hiện qua đọc code (không đoán): cơ chế giải
đúng bài này ĐÃ CÓ SẴN, viết bởi 1 phiên khác (nhánh `str46`/`str65`/`str88`,
hợp nhất vào main qua `git pull` cùng ngày) — `src/runner/main-checkout-lock.mjs`
(primitive khóa) + `.githooks/pre-commit` (hook thật, acquire khóa đó cho MỌI
`git commit` trên checkout, bất kỳ actor nào — người, agent, CI, không riêng
verb nào của fgOS). `test/e2e/main-checkout-lock-hook.test.mjs` xanh 7/7,
`git commit` subprocess thật, tranh chấp identity thật. Hook này, MỘT KHI
ACTIVE, đã bảo vệ đúng bước `approve`'s `git commit --no-edit` mà `tsk-3w8`
nêu — không cần code application-level mới.

Nhưng hook KHÔNG active mặc định. Từng được wire tự động qua npm `prepare`
(`str65-worktree-isolation-enforcement-6`), rồi bị GỠ CHỦ Ý
(`str88-fgos-pnpm-lifecycle-1`, vì pnpm 10+ chặn `prepare` cho dependency
git-hosted), thay bằng bước tay `npm run setup:hooks` — có ghi ở README
nhưng `fgos setup`/`fgos doctor` chưa từng đọc/ghi tới, và không ai tự động
hoá lại. Không có decision record nào giải thích lý do hoãn — chỉ 1 commit
message ngắn.
```

### Full target unit

```text
#### Bối cảnh

`tsk-3w8` tái hiện thật (2026-07-28, dogfood tsk-veg): `approve`'s bước cuối
(`mergeRunnerItem`'s `git commit --no-edit`, merge.mjs) fail khi 1 session
khác commit lên main CÙNG LÚC (`.git/index` clobbering — đúng lớp lỗi
`str65-worktree-isolation-enforcement` đặt tên). Code merge vẫn landed đúng
lên main; chỉ bước ghi `work.move(to:'done')` sau đó rớt, item ở lại
`proposed` dù thực tế đã xong.

Trước khi chọn hướng sửa, phát hiện qua đọc code (không đoán): cơ chế giải
đúng bài này ĐÃ CÓ SẴN, viết bởi 1 phiên khác (nhánh `str46`/`str65`/`str88`,
hợp nhất vào main qua `git pull` cùng ngày) — `src/runner/main-checkout-lock.mjs`
(primitive khóa) + `.githooks/pre-commit` (hook thật, acquire khóa đó cho MỌI
`git commit` trên checkout, bất kỳ actor nào — người, agent, CI, không riêng
verb nào của fgOS). `test/e2e/main-checkout-lock-hook.test.mjs` xanh 7/7,
`git commit` subprocess thật, tranh chấp identity thật. Hook này, MỘT KHI
ACTIVE, đã bảo vệ đúng bước `approve`'s `git commit --no-edit` mà `tsk-3w8`
nêu — không cần code application-level mới.

Nhưng hook KHÔNG active mặc định. Từng được wire tự động qua npm `prepare`
(`str65-worktree-isolation-enforcement-6`), rồi bị GỠ CHỦ Ý
(`str88-fgos-pnpm-lifecycle-1`, vì pnpm 10+ chặn `prepare` cho dependency
git-hosted), thay bằng bước tay `npm run setup:hooks` — có ghi ở README
nhưng `fgos setup`/`fgos doctor` chưa từng đọc/ghi tới, và không ai tự động
hoá lại. Không có decision record nào giải thích lý do hoãn — chỉ 1 commit
message ngắn.
```

### Full diff

```diff
No text difference.
```

## claim_3e051db17c926cdbfaf6104e2d13c25c

Source digest: b53f469dcbda652b04f0f1ea74850c80c49e544fffc39a53129f5ef849dd4d95

Target digest: b53f469dcbda652b04f0f1ea74850c80c49e544fffc39a53129f5ef849dd4d95

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-168",
  "sourceLines": [
    1799,
    1804
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-27",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_444fe689ea8469f4eb0635deaaafb4d4",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3e051db17c926cdbfaf6104e2d13c25c",
    "sourceUnitDigest": "b53f469dcbda652b04f0f1ea74850c80c49e544fffc39a53129f5ef849dd4d95",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-27",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-168 (lines 1799–1804) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-27. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b53f469dcbda652b04f0f1ea74850c80c49e544fffc39a53129f5ef849dd4d95",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
`tsk-3w8` tái hiện thật (2026-07-28, dogfood tsk-veg): `approve`'s bước cuối
(`mergeRunnerItem`'s `git commit --no-edit`, merge.mjs) fail khi 1 session
khác commit lên main CÙNG LÚC (`.git/index` clobbering — đúng lớp lỗi
`str65-worktree-isolation-enforcement` đặt tên). Code merge vẫn landed đúng
lên main; chỉ bước ghi `work.move(to:'done')` sau đó rớt, item ở lại
`proposed` dù thực tế đã xong.
```

### Full target unit

```text
`tsk-3w8` tái hiện thật (2026-07-28, dogfood tsk-veg): `approve`'s bước cuối
(`mergeRunnerItem`'s `git commit --no-edit`, merge.mjs) fail khi 1 session
khác commit lên main CÙNG LÚC (`.git/index` clobbering — đúng lớp lỗi
`str65-worktree-isolation-enforcement` đặt tên). Code merge vẫn landed đúng
lên main; chỉ bước ghi `work.move(to:'done')` sau đó rớt, item ở lại
`proposed` dù thực tế đã xong.
```

### Full diff

```diff
No text difference.
```

## claim_0b6d3350fdb4cb44459bdee8caf09daf

Source digest: 5848ff6fc9b8290ae55b6dd6a7f4d4199b3417b45e6943c82f724c190d919ea9

Target digest: 5848ff6fc9b8290ae55b6dd6a7f4d4199b3417b45e6943c82f724c190d919ea9

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-169",
  "sourceLines": [
    1806,
    1814
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-28",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_289ee0bb1ee53378d8ab543621a27858",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_0b6d3350fdb4cb44459bdee8caf09daf",
    "sourceUnitDigest": "5848ff6fc9b8290ae55b6dd6a7f4d4199b3417b45e6943c82f724c190d919ea9",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-28",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-169 (lines 1806–1814) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-28. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "5848ff6fc9b8290ae55b6dd6a7f4d4199b3417b45e6943c82f724c190d919ea9",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Trước khi chọn hướng sửa, phát hiện qua đọc code (không đoán): cơ chế giải
đúng bài này ĐÃ CÓ SẴN, viết bởi 1 phiên khác (nhánh `str46`/`str65`/`str88`,
hợp nhất vào main qua `git pull` cùng ngày) — `src/runner/main-checkout-lock.mjs`
(primitive khóa) + `.githooks/pre-commit` (hook thật, acquire khóa đó cho MỌI
`git commit` trên checkout, bất kỳ actor nào — người, agent, CI, không riêng
verb nào của fgOS). `test/e2e/main-checkout-lock-hook.test.mjs` xanh 7/7,
`git commit` subprocess thật, tranh chấp identity thật. Hook này, MỘT KHI
ACTIVE, đã bảo vệ đúng bước `approve`'s `git commit --no-edit` mà `tsk-3w8`
nêu — không cần code application-level mới.
```

### Full target unit

```text
Trước khi chọn hướng sửa, phát hiện qua đọc code (không đoán): cơ chế giải
đúng bài này ĐÃ CÓ SẴN, viết bởi 1 phiên khác (nhánh `str46`/`str65`/`str88`,
hợp nhất vào main qua `git pull` cùng ngày) — `src/runner/main-checkout-lock.mjs`
(primitive khóa) + `.githooks/pre-commit` (hook thật, acquire khóa đó cho MỌI
`git commit` trên checkout, bất kỳ actor nào — người, agent, CI, không riêng
verb nào của fgOS). `test/e2e/main-checkout-lock-hook.test.mjs` xanh 7/7,
`git commit` subprocess thật, tranh chấp identity thật. Hook này, MỘT KHI
ACTIVE, đã bảo vệ đúng bước `approve`'s `git commit --no-edit` mà `tsk-3w8`
nêu — không cần code application-level mới.
```

### Full diff

```diff
No text difference.
```

## claim_652a2b350f1c46e429e00a80d9e01248

Source digest: 79e0d511797ff7cb2e15a2eed31571cbc0fbf3bfb039e39eec157b8fd80ce62d

Target digest: 79e0d511797ff7cb2e15a2eed31571cbc0fbf3bfb039e39eec157b8fd80ce62d

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-170",
  "sourceLines": [
    1816,
    1822
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-29",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_2d08e534b6c14d965c50adfc5f9b323e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_652a2b350f1c46e429e00a80d9e01248",
    "sourceUnitDigest": "79e0d511797ff7cb2e15a2eed31571cbc0fbf3bfb039e39eec157b8fd80ce62d",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-29",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-170 (lines 1816–1822) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-29. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "79e0d511797ff7cb2e15a2eed31571cbc0fbf3bfb039e39eec157b8fd80ce62d",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
Nhưng hook KHÔNG active mặc định. Từng được wire tự động qua npm `prepare`
(`str65-worktree-isolation-enforcement-6`), rồi bị GỠ CHỦ Ý
(`str88-fgos-pnpm-lifecycle-1`, vì pnpm 10+ chặn `prepare` cho dependency
git-hosted), thay bằng bước tay `npm run setup:hooks` — có ghi ở README
nhưng `fgos setup`/`fgos doctor` chưa từng đọc/ghi tới, và không ai tự động
hoá lại. Không có decision record nào giải thích lý do hoãn — chỉ 1 commit
message ngắn.
```

### Full target unit

```text
Nhưng hook KHÔNG active mặc định. Từng được wire tự động qua npm `prepare`
(`str65-worktree-isolation-enforcement-6`), rồi bị GỠ CHỦ Ý
(`str88-fgos-pnpm-lifecycle-1`, vì pnpm 10+ chặn `prepare` cho dependency
git-hosted), thay bằng bước tay `npm run setup:hooks` — có ghi ở README
nhưng `fgos setup`/`fgos doctor` chưa từng đọc/ghi tới, và không ai tự động
hoá lại. Không có decision record nào giải thích lý do hoãn — chỉ 1 commit
message ngắn.
```

### Full diff

```diff
No text difference.
```

## claim_cfc4f47f0ecd03e0836b6bedd3158f60

Source digest: d1db4a7c3ce7c8f2bc3ddf73e57b92cd02a65d20bd2fd63344faeea85098befe

Target digest: d1db4a7c3ce7c8f2bc3ddf73e57b92cd02a65d20bd2fd63344faeea85098befe

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "quyết-định-3",
  "sourceLines": [
    1824,
    1824
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "quyết-định-3",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence"
  ],
  "nativeTargetClaimId": "claim_6dd45fb19f483c39ebc62869d770ab3b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "quyết-định-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_cfc4f47f0ecd03e0836b6bedd3158f60",
    "sourceUnitDigest": "d1db4a7c3ce7c8f2bc3ddf73e57b92cd02a65d20bd2fd63344faeea85098befe",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "quyết-định-3",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#quyết-định-3 (lines 1824–1824) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#quyết-định-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d1db4a7c3ce7c8f2bc3ddf73e57b92cd02a65d20bd2fd63344faeea85098befe",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence"
    ]
  }
}
```

### Full source unit

```text
#### Quyết định

Chọn **wire hook có sẵn vào `fgos doctor` (đọc) + `fgos setup` (ghi)** —
KHÔNG viết app-level lock-wrap riêng trong `approve`, KHÔNG xây
`epoch-fence-merge-gate` (CAS subsystem mới, nguồn repository-harness, ghi
trong `porting-log.md` là "Closes tsk-3w8"):

- `src/setup/git-hooks.mjs` (mới, layer `infra`) — `installGitHooks(repoRoot)`
  (ghi, **fill-only**: không bao giờ ghi đè `core.hooksPath` đã trỏ nơi khác,
  giống đúng nguyên tắc 2 side-effect kia của `setup` — `insertSourceLine`
  chỉ append, `mergeConfigDefaults` không bao giờ đụng key user đã có) và
  `mainCheckoutHookWired(cwd)` (đọc, dùng bởi cả doctor lẫn setup's report).
- `fgos doctor` thêm check thứ 4: `main-checkout-hook-wired`.
- `fgos setup` gọi `installGitHooks`, trả thêm `hooksWired` +
  `hooksSkippedExisting` (giá trị custom cũ nếu có, để không âm thầm mất
  thông tin khi từ chối ghi đè).
- `scripts/install-git-hooks.mjs` (giữ cho `npm run setup:hooks`) trở thành
  shim mỏng, re-export từ `src/setup/git-hooks.mjs` — logic thật phải nằm ở
  `src/setup/` vì `scripts/` không nằm trong `package.json`'s `files` (không
  ship theo npm package) và không nằm trong phạm vi
  `docs/architecture-manifest.json`'s import-direction check (chỉ quét
  `src/`+`bin/`) — `bin/fgos.mjs` import thẳng từ `scripts/` từng làm vỡ cả 2
  (test kiến trúc + e2e `npm pack -> npm install -g`).
```

### Full target unit

```text
#### Quyết định

Chọn **wire hook có sẵn vào `fgos doctor` (đọc) + `fgos setup` (ghi)** —
KHÔNG viết app-level lock-wrap riêng trong `approve`, KHÔNG xây
`epoch-fence-merge-gate` (CAS subsystem mới, nguồn repository-harness, ghi
trong `porting-log.md` là "Closes tsk-3w8"):

- `src/setup/git-hooks.mjs` (mới, layer `infra`) — `installGitHooks(repoRoot)`
  (ghi, **fill-only**: không bao giờ ghi đè `core.hooksPath` đã trỏ nơi khác,
  giống đúng nguyên tắc 2 side-effect kia của `setup` — `insertSourceLine`
  chỉ append, `mergeConfigDefaults` không bao giờ đụng key user đã có) và
  `mainCheckoutHookWired(cwd)` (đọc, dùng bởi cả doctor lẫn setup's report).
- `fgos doctor` thêm check thứ 4: `main-checkout-hook-wired`.
- `fgos setup` gọi `installGitHooks`, trả thêm `hooksWired` +
  `hooksSkippedExisting` (giá trị custom cũ nếu có, để không âm thầm mất
  thông tin khi từ chối ghi đè).
- `scripts/install-git-hooks.mjs` (giữ cho `npm run setup:hooks`) trở thành
  shim mỏng, re-export từ `src/setup/git-hooks.mjs` — logic thật phải nằm ở
  `src/setup/` vì `scripts/` không nằm trong `package.json`'s `files` (không
  ship theo npm package) và không nằm trong phạm vi
  `docs/architecture-manifest.json`'s import-direction check (chỉ quét
  `src/`+`bin/`) — `bin/fgos.mjs` import thẳng từ `scripts/` từng làm vỡ cả 2
  (test kiến trúc + e2e `npm pack -> npm install -g`).
```

### Full diff

```diff
No text difference.
```

## claim_14857a18ae008301d5870e0a4bc9f6ac

Source digest: 951dfdb4d2ab7fa46aadb635ceee324c555fd09c495712d6ba4a71a7a11fd27a

Target digest: 951dfdb4d2ab7fa46aadb635ceee324c555fd09c495712d6ba4a71a7a11fd27a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-171",
  "sourceLines": [
    1826,
    1829
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-30",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_7bfdecd5c747ca74d6979eecd1c618f4",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_14857a18ae008301d5870e0a4bc9f6ac",
    "sourceUnitDigest": "951dfdb4d2ab7fa46aadb635ceee324c555fd09c495712d6ba4a71a7a11fd27a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-30",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-171 (lines 1826–1829) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-30. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "951dfdb4d2ab7fa46aadb635ceee324c555fd09c495712d6ba4a71a7a11fd27a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
Chọn **wire hook có sẵn vào `fgos doctor` (đọc) + `fgos setup` (ghi)** —
KHÔNG viết app-level lock-wrap riêng trong `approve`, KHÔNG xây
`epoch-fence-merge-gate` (CAS subsystem mới, nguồn repository-harness, ghi
trong `porting-log.md` là "Closes tsk-3w8"):
```

### Full target unit

```text
Chọn **wire hook có sẵn vào `fgos doctor` (đọc) + `fgos setup` (ghi)** —
KHÔNG viết app-level lock-wrap riêng trong `approve`, KHÔNG xây
`epoch-fence-merge-gate` (CAS subsystem mới, nguồn repository-harness, ghi
trong `porting-log.md` là "Closes tsk-3w8"):
```

### Full diff

```diff
No text difference.
```

## claim_d21867cff8a51dfc4fdea3c3e95096d7

Source digest: 5b376ab641e5553e2b30b25dd818a23941e35dcb0680f994ff31425e53474e3b

Target digest: 5b376ab641e5553e2b30b25dd818a23941e35dcb0680f994ff31425e53474e3b

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-172",
  "sourceLines": [
    1831,
    1846
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-31",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_af917ee956b995c526d241739cbec73a",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "quyết-định-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_d21867cff8a51dfc4fdea3c3e95096d7",
    "sourceUnitDigest": "5b376ab641e5553e2b30b25dd818a23941e35dcb0680f994ff31425e53474e3b",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-31",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-172 (lines 1831–1846) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-31. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "5b376ab641e5553e2b30b25dd818a23941e35dcb0680f994ff31425e53474e3b",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
- `src/setup/git-hooks.mjs` (mới, layer `infra`) — `installGitHooks(repoRoot)`
  (ghi, **fill-only**: không bao giờ ghi đè `core.hooksPath` đã trỏ nơi khác,
  giống đúng nguyên tắc 2 side-effect kia của `setup` — `insertSourceLine`
  chỉ append, `mergeConfigDefaults` không bao giờ đụng key user đã có) và
  `mainCheckoutHookWired(cwd)` (đọc, dùng bởi cả doctor lẫn setup's report).
- `fgos doctor` thêm check thứ 4: `main-checkout-hook-wired`.
- `fgos setup` gọi `installGitHooks`, trả thêm `hooksWired` +
  `hooksSkippedExisting` (giá trị custom cũ nếu có, để không âm thầm mất
  thông tin khi từ chối ghi đè).
- `scripts/install-git-hooks.mjs` (giữ cho `npm run setup:hooks`) trở thành
  shim mỏng, re-export từ `src/setup/git-hooks.mjs` — logic thật phải nằm ở
  `src/setup/` vì `scripts/` không nằm trong `package.json`'s `files` (không
  ship theo npm package) và không nằm trong phạm vi
  `docs/architecture-manifest.json`'s import-direction check (chỉ quét
  `src/`+`bin/`) — `bin/fgos.mjs` import thẳng từ `scripts/` từng làm vỡ cả 2
  (test kiến trúc + e2e `npm pack -> npm install -g`).
```

### Full target unit

```text
- `src/setup/git-hooks.mjs` (mới, layer `infra`) — `installGitHooks(repoRoot)`
  (ghi, **fill-only**: không bao giờ ghi đè `core.hooksPath` đã trỏ nơi khác,
  giống đúng nguyên tắc 2 side-effect kia của `setup` — `insertSourceLine`
  chỉ append, `mergeConfigDefaults` không bao giờ đụng key user đã có) và
  `mainCheckoutHookWired(cwd)` (đọc, dùng bởi cả doctor lẫn setup's report).
- `fgos doctor` thêm check thứ 4: `main-checkout-hook-wired`.
- `fgos setup` gọi `installGitHooks`, trả thêm `hooksWired` +
  `hooksSkippedExisting` (giá trị custom cũ nếu có, để không âm thầm mất
  thông tin khi từ chối ghi đè).
- `scripts/install-git-hooks.mjs` (giữ cho `npm run setup:hooks`) trở thành
  shim mỏng, re-export từ `src/setup/git-hooks.mjs` — logic thật phải nằm ở
  `src/setup/` vì `scripts/` không nằm trong `package.json`'s `files` (không
  ship theo npm package) và không nằm trong phạm vi
  `docs/architecture-manifest.json`'s import-direction check (chỉ quét
  `src/`+`bin/`) — `bin/fgos.mjs` import thẳng từ `scripts/` từng làm vỡ cả 2
  (test kiến trúc + e2e `npm pack -> npm install -g`).
```

### Full diff

```diff
No text difference.
```

## claim_5afb8f3b4089acd884d2c3cd6b9bbb57

Source digest: afd23010642e58b41119693e1921573d2ecd30670335d595e8695b6859558d92

Target digest: afd23010642e58b41119693e1921573d2ecd30670335d595e8695b6859558d92

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "vì-sao-không-app-level-lock-wrap-trong-approve",
  "sourceLines": [
    1848,
    1848
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "vì-sao-không-app-level-lock-wrap-trong-approve",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_1c117f1837bcc7867f564b1c5065ed1e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-không-app-level-lock-wrap-trong-approve",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5afb8f3b4089acd884d2c3cd6b9bbb57",
    "sourceUnitDigest": "afd23010642e58b41119693e1921573d2ecd30670335d595e8695b6859558d92",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "vì-sao-không-app-level-lock-wrap-trong-approve",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#vì-sao-không-app-level-lock-wrap-trong-approve (lines 1848–1848) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#vì-sao-không-app-level-lock-wrap-trong-approve. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "afd23010642e58b41119693e1921573d2ecd30670335d595e8695b6859558d92",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
##### Vì sao không app-level lock-wrap trong `approve`

Vá sai chỗ: ca lỗi thật là 1 session KHÁC không hề gọi qua `approve` — nó tự
`git commit` tay. Khóa chỉ đặt trong `approve` vô dụng với chính thủ phạm.
Hook giải đúng gốc vì chặn ở TẦNG GIT, mọi commit, không riêng 1 verb.
```

### Full target unit

```text
##### Vì sao không app-level lock-wrap trong `approve`

Vá sai chỗ: ca lỗi thật là 1 session KHÁC không hề gọi qua `approve` — nó tự
`git commit` tay. Khóa chỉ đặt trong `approve` vô dụng với chính thủ phạm.
Hook giải đúng gốc vì chặn ở TẦNG GIT, mọi commit, không riêng 1 verb.
```

### Full diff

```diff
No text difference.
```

## claim_4b5ecfb051da3efc45ee7640277b768d

Source digest: 8debb3f3747fcd53511f7fe63c3a08615805094a70f2e9b89398a05676fea243

Target digest: 8debb3f3747fcd53511f7fe63c3a08615805094a70f2e9b89398a05676fea243

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-173",
  "sourceLines": [
    1850,
    1852
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định",
    "Vì sao không app-level lock-wrap trong `approve`"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-32",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định",
    "Vì sao không app-level lock-wrap trong `approve`"
  ],
  "nativeTargetClaimId": "claim_18ef2e5662d7045a7d334fcdc146eb06",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-không-app-level-lock-wrap-trong-approve",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_4b5ecfb051da3efc45ee7640277b768d",
    "sourceUnitDigest": "8debb3f3747fcd53511f7fe63c3a08615805094a70f2e9b89398a05676fea243",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-32",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-173 (lines 1850–1852) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-32. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8debb3f3747fcd53511f7fe63c3a08615805094a70f2e9b89398a05676fea243",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Quyết định",
      "Vì sao không app-level lock-wrap trong `approve`"
    ]
  }
}
```

### Full source unit

```text
Vá sai chỗ: ca lỗi thật là 1 session KHÁC không hề gọi qua `approve` — nó tự
`git commit` tay. Khóa chỉ đặt trong `approve` vô dụng với chính thủ phạm.
Hook giải đúng gốc vì chặn ở TẦNG GIT, mọi commit, không riêng 1 verb.
```

### Full target unit

```text
Vá sai chỗ: ca lỗi thật là 1 session KHÁC không hề gọi qua `approve` — nó tự
`git commit` tay. Khóa chỉ đặt trong `approve` vô dụng với chính thủ phạm.
Hook giải đúng gốc vì chặn ở TẦNG GIT, mọi commit, không riêng 1 verb.
```

### Full diff

```diff
No text difference.
```

## claim_e5fcd366a66ba29887d712945fd7e3ff

Source digest: 33047932d1952db55caadf82cb612b1447614e58dd792f2223325b36a0cb5994

Target digest: 33047932d1952db55caadf82cb612b1447614e58dd792f2223325b36a0cb5994

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "vì-sao-không-epoch-fence-merge-gate",
  "sourceLines": [
    1854,
    1854
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "vì-sao-không-epoch-fence-merge-gate",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định"
  ],
  "nativeTargetClaimId": "claim_d764e7b4de9a8e1fcc0a416bdaca7659",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-không-epoch-fence-merge-gate",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e5fcd366a66ba29887d712945fd7e3ff",
    "sourceUnitDigest": "33047932d1952db55caadf82cb612b1447614e58dd792f2223325b36a0cb5994",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "vì-sao-không-epoch-fence-merge-gate",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#vì-sao-không-epoch-fence-merge-gate (lines 1854–1854) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#vì-sao-không-epoch-fence-merge-gate. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "33047932d1952db55caadf82cb612b1447614e58dd792f2223325b36a0cb5994",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Quyết định"
    ]
  }
}
```

### Full source unit

```text
##### Vì sao không epoch-fence-merge-gate

Xây subsystem mới (F2 theo phân loại distill) để giải lại bài hook ĐÃ GIẢI —
ngược YAGNI. Chỉ đáng nếu sau này có bằng chứng mutex (khóa-độc-quyền) không
đủ — cần nhiều writer chạy song song thật, không chỉ chặn-nhau. Chưa có bằng
chứng đó.
```

### Full target unit

```text
##### Vì sao không epoch-fence-merge-gate

Xây subsystem mới (F2 theo phân loại distill) để giải lại bài hook ĐÃ GIẢI —
ngược YAGNI. Chỉ đáng nếu sau này có bằng chứng mutex (khóa-độc-quyền) không
đủ — cần nhiều writer chạy song song thật, không chỉ chặn-nhau. Chưa có bằng
chứng đó.
```

### Full diff

```diff
No text difference.
```

## claim_a5bb50fb4f64e842334fe353a955524c

Source digest: 439edeebfe8f7843e4e29586c6fe3f3d0ab942285ef564447c8ab1de76a130d3

Target digest: 439edeebfe8f7843e4e29586c6fe3f3d0ab942285ef564447c8ab1de76a130d3

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-174",
  "sourceLines": [
    1856,
    1859
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định",
    "Vì sao không epoch-fence-merge-gate"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-33",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Quyết định",
    "Vì sao không epoch-fence-merge-gate"
  ],
  "nativeTargetClaimId": "claim_1571ad08157ba7b50bd7cd168c9c4c55",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "vì-sao-không-epoch-fence-merge-gate",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_a5bb50fb4f64e842334fe353a955524c",
    "sourceUnitDigest": "439edeebfe8f7843e4e29586c6fe3f3d0ab942285ef564447c8ab1de76a130d3",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-33",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-174 (lines 1856–1859) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-33. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "439edeebfe8f7843e4e29586c6fe3f3d0ab942285ef564447c8ab1de76a130d3",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Quyết định",
      "Vì sao không epoch-fence-merge-gate"
    ]
  }
}
```

### Full source unit

```text
Xây subsystem mới (F2 theo phân loại distill) để giải lại bài hook ĐÃ GIẢI —
ngược YAGNI. Chỉ đáng nếu sau này có bằng chứng mutex (khóa-độc-quyền) không
đủ — cần nhiều writer chạy song song thật, không chỉ chặn-nhau. Chưa có bằng
chứng đó.
```

### Full target unit

```text
Xây subsystem mới (F2 theo phân loại distill) để giải lại bài hook ĐÃ GIẢI —
ngược YAGNI. Chỉ đáng nếu sau này có bằng chứng mutex (khóa-độc-quyền) không
đủ — cần nhiều writer chạy song song thật, không chỉ chặn-nhau. Chưa có bằng
chứng đó.
```

### Full diff

```diff
No text difference.
```

## claim_7a7eaa509c57c203757dafb1ef42c770

Source digest: 7296dfaf2a21f7bff97e45c9dd7c77dc69ff49061dab1577395d67343b6aa8aa

Target digest: 7296dfaf2a21f7bff97e45c9dd7c77dc69ff49061dab1577395d67343b6aa8aa

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hệ-quả-3",
  "sourceLines": [
    1861,
    1861
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "hệ-quả-3",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence"
  ],
  "nativeTargetClaimId": "claim_178087f321fb4eb0fd1a9b863c8110d4",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "hệ-quả-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_7a7eaa509c57c203757dafb1ef42c770",
    "sourceUnitDigest": "7296dfaf2a21f7bff97e45c9dd7c77dc69ff49061dab1577395d67343b6aa8aa",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "hệ-quả-3",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#hệ-quả-3 (lines 1861–1861) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#hệ-quả-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "7296dfaf2a21f7bff97e45c9dd7c77dc69ff49061dab1577395d67343b6aa8aa",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence"
    ]
  }
}
```

### Full source unit

```text
#### Hệ quả

- **Đây là fix khả-tiếp-cận (reachability), không phải enforcement tự
  động** — tự đánh giá trung thực, không phóng đại: một checkout clone mới
  KHÔNG BAO GIỜ chạy `fgos setup`/`fgos doctor`/`npm run setup:hooks` (CI
  chạy `git commit` trần, hoặc agent không gọi 2 verb đó) vẫn hở y như trước
  quyết định này. Việc này thêm đường kích hoạt thứ 2 (không phụ thuộc npm
  lifecycle) + cách PHÁT HIỆN khoảng hở (`fgos doctor`), không bắt buộc kích
  hoạt.
- Việc còn mở, chưa làm trong quyết định này: có cần ép `fgos setup`/`doctor`
  chạy bắt buộc ở CI hay một trigger không tùy-chọn khác để đóng nốt khoảng
  hở đó hay không — để dành thành item riêng nếu ca thật (agent/CI commit
  không qua 2 verb này) xảy ra thường xuyên.
- Dogfood thật trên chính checkout này: `fgos setup` đã chạy, xác nhận
  `git config --get core.hooksPath` = `.githooks`, `fgos doctor` báo xanh.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full target unit

```text
#### Hệ quả

- **Đây là fix khả-tiếp-cận (reachability), không phải enforcement tự
  động** — tự đánh giá trung thực, không phóng đại: một checkout clone mới
  KHÔNG BAO GIỜ chạy `fgos setup`/`fgos doctor`/`npm run setup:hooks` (CI
  chạy `git commit` trần, hoặc agent không gọi 2 verb đó) vẫn hở y như trước
  quyết định này. Việc này thêm đường kích hoạt thứ 2 (không phụ thuộc npm
  lifecycle) + cách PHÁT HIỆN khoảng hở (`fgos doctor`), không bắt buộc kích
  hoạt.
- Việc còn mở, chưa làm trong quyết định này: có cần ép `fgos setup`/`doctor`
  chạy bắt buộc ở CI hay một trigger không tùy-chọn khác để đóng nốt khoảng
  hở đó hay không — để dành thành item riêng nếu ca thật (agent/CI commit
  không qua 2 verb này) xảy ra thường xuyên.
- Dogfood thật trên chính checkout này: `fgos setup` đã chạy, xác nhận
  `git config --get core.hooksPath` = `.githooks`, `fgos doctor` báo xanh.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### Full diff

```diff
No text difference.
```

## claim_b20e1919dacb2d2fa0de0d4ca2c47db0

Source digest: 1934238586a09fa9128f142822b159bacaa6fa556afbdb4bde4e886046812aa3

Target digest: 1934238586a09fa9128f142822b159bacaa6fa556afbdb4bde4e886046812aa3

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-175",
  "sourceLines": [
    1863,
    1875
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Hệ quả"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-34",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
    "Hệ quả"
  ],
  "nativeTargetClaimId": "claim_2b61aceba5dd1725984af11957dc7beb",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "hệ-quả-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b20e1919dacb2d2fa0de0d4ca2c47db0",
    "sourceUnitDigest": "1934238586a09fa9128f142822b159bacaa6fa556afbdb4bde4e886046812aa3",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-34",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-175 (lines 1863–1875) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-34. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "1934238586a09fa9128f142822b159bacaa6fa556afbdb4bde4e886046812aa3",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
      "Hệ quả"
    ]
  }
}
```

### Full source unit

```text
- **Đây là fix khả-tiếp-cận (reachability), không phải enforcement tự
  động** — tự đánh giá trung thực, không phóng đại: một checkout clone mới
  KHÔNG BAO GIỜ chạy `fgos setup`/`fgos doctor`/`npm run setup:hooks` (CI
  chạy `git commit` trần, hoặc agent không gọi 2 verb đó) vẫn hở y như trước
  quyết định này. Việc này thêm đường kích hoạt thứ 2 (không phụ thuộc npm
  lifecycle) + cách PHÁT HIỆN khoảng hở (`fgos doctor`), không bắt buộc kích
  hoạt.
- Việc còn mở, chưa làm trong quyết định này: có cần ép `fgos setup`/`doctor`
  chạy bắt buộc ở CI hay một trigger không tùy-chọn khác để đóng nốt khoảng
  hở đó hay không — để dành thành item riêng nếu ca thật (agent/CI commit
  không qua 2 verb này) xảy ra thường xuyên.
- Dogfood thật trên chính checkout này: `fgos setup` đã chạy, xác nhận
  `git config --get core.hooksPath` = `.githooks`, `fgos doctor` báo xanh.
```

### Full target unit

```text
- **Đây là fix khả-tiếp-cận (reachability), không phải enforcement tự
  động** — tự đánh giá trung thực, không phóng đại: một checkout clone mới
  KHÔNG BAO GIỜ chạy `fgos setup`/`fgos doctor`/`npm run setup:hooks` (CI
  chạy `git commit` trần, hoặc agent không gọi 2 verb đó) vẫn hở y như trước
  quyết định này. Việc này thêm đường kích hoạt thứ 2 (không phụ thuộc npm
  lifecycle) + cách PHÁT HIỆN khoảng hở (`fgos doctor`), không bắt buộc kích
  hoạt.
- Việc còn mở, chưa làm trong quyết định này: có cần ép `fgos setup`/`doctor`
  chạy bắt buộc ở CI hay một trigger không tùy-chọn khác để đóng nốt khoảng
  hở đó hay không — để dành thành item riêng nếu ca thật (agent/CI commit
  không qua 2 verb này) xảy ra thường xuyên.
- Dogfood thật trên chính checkout này: `fgos setup` đã chạy, xác nhận
  `git config --get core.hooksPath` = `.githooks`, `fgos doctor` báo xanh.
```

### Full diff

```diff
No text difference.
```

## claim_acd0fb1e35440535fc61d9ee0b15864b

Source digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Target digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-176",
  "sourceLines": [
    1877,
    1877
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence",
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
  "section": "hệ-quả-3",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_acd0fb1e35440535fc61d9ee0b15864b",
    "sourceUnitDigest": "95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-9",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: target digest repeats; ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-176 (lines 1877–1877) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-9. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
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

## claim_8b22a5fd98d87a35c5c2d50c57060b46

Source digest: 2666cf25c87f39bcaee829d110aae261bf5290761df53f486b3ac0466a855df2

Target digest: 2666cf25c87f39bcaee829d110aae261bf5290761df53f486b3ac0466a855df2

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "0022-khảo-sát-choke-point-fgos-quyết-định-lặplệch-xuyên-clirunnerskill",
  "sourceLines": [
    1879,
    1879
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "0022-khảo-sát-choke-point-fgos-quyết-định-lặplệch-xuyên-clirunnerskill",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
  ],
  "nativeTargetClaimId": "claim_64fc422d23f6438a8f5986ce2b872105",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "0022-khảo-sát-choke-point-fgos-quyết-định-lặplệch-xuyên-clirunnerskill",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_8b22a5fd98d87a35c5c2d50c57060b46",
    "sourceUnitDigest": "2666cf25c87f39bcaee829d110aae261bf5290761df53f486b3ac0466a855df2",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "0022-khảo-sát-choke-point-fgos-quyết-định-lặplệch-xuyên-clirunnerskill",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#0022-khảo-sát-choke-point-fgos-quyết-định-lặplệch-xuyên-clirunnerskill (lines 1879–1879) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#0022-khảo-sát-choke-point-fgos-quyết-định-lặplệch-xuyên-clirunnerskill. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "2666cf25c87f39bcaee829d110aae261bf5290761df53f486b3ac0466a855df2",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)"
    ]
  }
}
```

### Full source unit

```text
### 0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)
```

### Full target unit

```text
### 0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)
```

### Full diff

```diff
No text difference.
```

## claim_3e759fdd13b85a14dca58cfdc902cb5d

Source digest: 2230d7de38bd1a697ef276c8eeded79ab4e02a9783ab94813ca816a268ea86e0

Target digest: 2230d7de38bd1a697ef276c8eeded79ab4e02a9783ab94813ca816a268ea86e0

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bối-cảnh-4",
  "sourceLines": [
    1881,
    1881
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "bối-cảnh-4",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
  ],
  "nativeTargetClaimId": "claim_959dd35e932899ba1a66687bcc436115",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "bối-cảnh-4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_3e759fdd13b85a14dca58cfdc902cb5d",
    "sourceUnitDigest": "2230d7de38bd1a697ef276c8eeded79ab4e02a9783ab94813ca816a268ea86e0",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "bối-cảnh-4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#bối-cảnh-4 (lines 1881–1881) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#bối-cảnh-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "2230d7de38bd1a697ef276c8eeded79ab4e02a9783ab94813ca816a268ea86e0",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
    ]
  }
}
```

### Full source unit

```text
#### Bối cảnh

`tsk-53f` xác nhận 1 case cụ thể: claim + worktree-isolation (`take`/`pick`
vs runner) từng có 3 đường claim độc lập, đã hợp nhất qua `claim-port.mjs`
. `tsk-1ab` là khảo sát rộng hơn: những loại quyết định NÀO KHÁC trong
fgOS đang bị nhiều flow (CLI verb, runner loop, skill) tự implement riêng,
dẫn tới hành vi lệch nhau cho CÙNG một câu hỏi quyết định. Mỗi candidate
dưới đây được xác nhận bằng cách đọc trực tiếp từng call site — không suy
diễn từ tên/hình dạng giống nhau (yêu cầu (2) của item).
```

### Full target unit

```text
#### Bối cảnh

`tsk-53f` xác nhận 1 case cụ thể: claim + worktree-isolation (`take`/`pick`
vs runner) từng có 3 đường claim độc lập, đã hợp nhất qua `claim-port.mjs`
. `tsk-1ab` là khảo sát rộng hơn: những loại quyết định NÀO KHÁC trong
fgOS đang bị nhiều flow (CLI verb, runner loop, skill) tự implement riêng,
dẫn tới hành vi lệch nhau cho CÙNG một câu hỏi quyết định. Mỗi candidate
dưới đây được xác nhận bằng cách đọc trực tiếp từng call site — không suy
diễn từ tên/hình dạng giống nhau (yêu cầu (2) của item).
```

### Full diff

```diff
No text difference.
```

## claim_589c5bca305535fea6cc0109ac66b668

Source digest: 50b6deba4d8ed1c7bc3c8e300d6f339a5ff4a34644a7fb9f59268543e640a460

Target digest: 50b6deba4d8ed1c7bc3c8e300d6f339a5ff4a34644a7fb9f59268543e640a460

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-177",
  "sourceLines": [
    1883,
    1889
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Bối cảnh"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-36",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Bối cảnh"
  ],
  "nativeTargetClaimId": "claim_4a5244c1fdf0c323a496c28e554570b0",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "bối-cảnh-4",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_589c5bca305535fea6cc0109ac66b668",
    "sourceUnitDigest": "50b6deba4d8ed1c7bc3c8e300d6f339a5ff4a34644a7fb9f59268543e640a460",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-36",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-177 (lines 1883–1889) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-36. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "50b6deba4d8ed1c7bc3c8e300d6f339a5ff4a34644a7fb9f59268543e640a460",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Bối cảnh"
    ]
  }
}
```

### Full source unit

```text
`tsk-53f` xác nhận 1 case cụ thể: claim + worktree-isolation (`take`/`pick`
vs runner) từng có 3 đường claim độc lập, đã hợp nhất qua `claim-port.mjs`
. `tsk-1ab` là khảo sát rộng hơn: những loại quyết định NÀO KHÁC trong
fgOS đang bị nhiều flow (CLI verb, runner loop, skill) tự implement riêng,
dẫn tới hành vi lệch nhau cho CÙNG một câu hỏi quyết định. Mỗi candidate
dưới đây được xác nhận bằng cách đọc trực tiếp từng call site — không suy
diễn từ tên/hình dạng giống nhau (yêu cầu (2) của item).
```

### Full target unit

```text
`tsk-53f` xác nhận 1 case cụ thể: claim + worktree-isolation (`take`/`pick`
vs runner) từng có 3 đường claim độc lập, đã hợp nhất qua `claim-port.mjs`
. `tsk-1ab` là khảo sát rộng hơn: những loại quyết định NÀO KHÁC trong
fgOS đang bị nhiều flow (CLI verb, runner loop, skill) tự implement riêng,
dẫn tới hành vi lệch nhau cho CÙNG một câu hỏi quyết định. Mỗi candidate
dưới đây được xác nhận bằng cách đọc trực tiếp từng call site — không suy
diễn từ tên/hình dạng giống nhau (yêu cầu (2) của item).
```

### Full diff

```diff
No text difference.
```

## claim_6403b0907bb0a7415a2e48bfdcd576bb

Source digest: 8ddbd223d18aa054946e9087698849202a8fb1d634c58e09c58f7a3fbf21f56a

Target digest: 8ddbd223d18aa054946e9087698849202a8fb1d634c58e09c58f7a3fbf21f56a

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "candidates",
  "sourceLines": [
    1891,
    1891
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "candidates",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
  ],
  "nativeTargetClaimId": "claim_5f071e06117dd60f4c5b45a2678e2fc2",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters",
  "section": "candidates",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_6403b0907bb0a7415a2e48bfdcd576bb",
    "sourceUnitDigest": "8ddbd223d18aa054946e9087698849202a8fb1d634c58e09c58f7a3fbf21f56a",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "candidates",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters. Whole heading docs/specs/runner.md#candidates (lines 1891–1891) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#candidates. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8ddbd223d18aa054946e9087698849202a8fb1d634c58e09c58f7a3fbf21f56a",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)"
    ]
  }
}
```

### Full source unit

```text
#### Candidates
```

### Full target unit

```text
#### Candidates
```

### Full diff

```diff
No text difference.
```

## claim_317aead16cf595b7cf55ed42eaa18ddc

Source digest: 383a56412366b74d58d2487ea5cbb859bb51413dafb467340b1539b61389f380

Target digest: 383a56412366b74d58d2487ea5cbb859bb51413dafb467340b1539b61389f380

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "xác-nhận-thật-choke-point-có-bằng-chứng-cụ-thể",
  "sourceLines": [
    1893,
    1893
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "xác-nhận-thật-choke-point-có-bằng-chứng-cụ-thể",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates"
  ],
  "nativeTargetClaimId": "claim_16be3fe32bd025fbe2aa2e6b9e4915b7",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "xác-nhận-thật-choke-point-có-bằng-chứng-cụ-thể",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_317aead16cf595b7cf55ed42eaa18ddc",
    "sourceUnitDigest": "383a56412366b74d58d2487ea5cbb859bb51413dafb467340b1539b61389f380",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "xác-nhận-thật-choke-point-có-bằng-chứng-cụ-thể",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#xác-nhận-thật-choke-point-có-bằng-chứng-cụ-thể (lines 1893–1893) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#xác-nhận-thật-choke-point-có-bằng-chứng-cụ-thể. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "383a56412366b74d58d2487ea5cbb859bb51413dafb467340b1539b61389f380",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates"
    ]
  }
}
```

### Full source unit

```text
##### Xác nhận THẬT (choke-point có bằng chứng cụ thể)
```

### Full target unit

```text
##### Xác nhận THẬT (choke-point có bằng chứng cụ thể)
```

### Full diff

```diff
No text difference.
```

## claim_b016edf6f12e3024cb092606bb771b0a

Source digest: e8eee63f828f4b5a6653239b4bf2c3e087acc21bae56fec77dd99514d5d129db

Target digest: e8eee63f828f4b5a6653239b4bf2c3e087acc21bae56fec77dd99514d5d129db

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "1-take-vs-pick-2-định-nghĩa-khác-nhau-cho-item-này-claim-được-không",
  "sourceLines": [
    1895,
    1895
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)"
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "1-take-vs-pick-2-định-nghĩa-khác-nhau-cho-item-này-claim-được-không",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)"
  ],
  "nativeTargetClaimId": "claim_0cd39db6e80c80d198c216c016324bcf",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "1-take-vs-pick-2-định-nghĩa-khác-nhau-cho-item-này-claim-được-không",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b016edf6f12e3024cb092606bb771b0a",
    "sourceUnitDigest": "e8eee63f828f4b5a6653239b4bf2c3e087acc21bae56fec77dd99514d5d129db",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "1-take-vs-pick-2-định-nghĩa-khác-nhau-cho-item-này-claim-được-không",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole heading docs/specs/runner.md#1-take-vs-pick-2-định-nghĩa-khác-nhau-cho-item-này-claim-được-không (lines 1895–1895) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#1-take-vs-pick-2-định-nghĩa-khác-nhau-cho-item-này-claim-được-không. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "e8eee63f828f4b5a6653239b4bf2c3e087acc21bae56fec77dd99514d5d129db",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)"
    ]
  }
}
```

### Full source unit

```text
###### 1. `take` vs `pick` — 2 định nghĩa khác nhau cho "item này claim được không"

Cả hai đều delegate phần ghi state cho cùng `claimWork` (`claim-port.mjs`,
đã hợp nhất đúng theo tsk-53f) — NHƯNG mỗi verb tự gác một lớp kiểm tra
điều kiện claim RIÊNG, ngay trước khi gọi `claimWork`, và hai lớp gác đó
trả lời khác nhau cho cùng 1 input (id đang ở stage `clarify`/`decompose`,
status `todo`, chưa vào frontier):

- `take --id <id>` (`bin/fgos.mjs:1233-1237`): chặn cứng — nếu
  `status === 'todo'` và id không nằm trong `readyWork()` (frontier, tức
  chưa tới stage `executing`), ném lỗi `"is todo but not in the frontier
  yet (stage/deps/lineage)"`.
- `pick --id <id>` (`bin/fgos.mjs:1272-1285`): KHÔNG có kiểm tra
  frontier/stage — chỉ cần id tồn tại. Comment ngay tại chỗ
  (`bin/fgos.mjs:1263-1268`) xác nhận đây là chủ ý: "the frontier-membership
  guard removed below was a hard check at THIS verb layer, never an FSM
  law" — nới lỏng để clarify/decompose claim qua được cửa pick.

Hệ quả đã xác nhận thật, không suy đoán:
- `plugins/fgOS/skills/fgos-routing/SKILL.md` (bản trong worktree này) tự
  hướng dẫn dùng đúng `fgos take --role session [--id <id>]` để claim một
  item còn ở `clarify`/`decompose` — lệnh này BỊ REJECT bởi chính guard ở
  trên, vì `take` chưa từng được nới lỏng như `pick`.
- `plugins/fgOS/skills/cook/SKILL.md:36-39` đã tự phát hiện đúng lỗi này
  qua test thật ("Verified empirically against this repo... rejected"),
  ghi thành "Known gap (flagged, not guessed around)" — nhưng chỉ vá ở
  tầng cook's own flow, không sửa `fgos-routing`, và tự nhận "reconciling
  fgos-routing itself is a separate, out-of-scope fix".
- Phiên làm việc khảo sát item NÀY (tsk-1ab) tự confirm thêm 1 lần nữa:
  `pick tsk-1ab` thành công thật khi item còn stage `clarify` (log claim
  seq 518 (renumbered by tsk-n4i-1; was 502), `"from":"todo","to":"doing"`),
  đúng khớp phân tích code trên.

3 nguồn (code, cook's known-gap note, phiên này) đồng nhất — đây là
choke-point rõ nhất tìm được: 1 câu hỏi quyết định ("id này claim được
chưa"), 2 verb code trả lời khác nhau, và tài liệu skill chính thức
(`fgos-routing`) đang hướng dẫn sai theo nhánh `take` bị chặn.

**Đã sửa** (item `choke-point-take-vs-pick-claim-eligibility`): đồng bộ
guard giữa `take`/`pick` cho nhánh `--id` tường minh, KHÔNG nới `take`'s
no-`--id` default ("take mirrors runner dispatch" giữ nguyên cho nhánh
đó). `take`'s explicit-`--id` branch (`bin/fgos.mjs`) giờ gọi
`isDepsAndLineageReady` (`src/state/frontier.mjs`, factored từ `frontier`'s
own deps+lineage clause, trừ stage clause) thay vì `readyWork(dir).some(...)`
— dep-chưa-xong và open-descendant vẫn chặn claim y như cũ (test cũ
`pull-dep-blocked` vẫn xanh), chỉ riêng stage `clarify`/`decompose` không
còn chặn nữa, khớp đúng hành vi `pick` đã có từ trước. `fgos-routing`'s
prose ("claim it specifically with `--id <id>`" dùng `take --role session
[--id <id>]`) giờ ĐÚNG với hành vi thật, không cần sửa. Regression:
`test/cli/take-pick-claim-eligibility.test.mjs`.
```

### Full target unit

```text
###### 1. `take` vs `pick` — 2 định nghĩa khác nhau cho "item này claim được không"

Cả hai đều delegate phần ghi state cho cùng `claimWork` (`claim-port.mjs`,
đã hợp nhất đúng theo tsk-53f) — NHƯNG mỗi verb tự gác một lớp kiểm tra
điều kiện claim RIÊNG, ngay trước khi gọi `claimWork`, và hai lớp gác đó
trả lời khác nhau cho cùng 1 input (id đang ở stage `clarify`/`decompose`,
status `todo`, chưa vào frontier):

- `take --id <id>` (`bin/fgos.mjs:1233-1237`): chặn cứng — nếu
  `status === 'todo'` và id không nằm trong `readyWork()` (frontier, tức
  chưa tới stage `executing`), ném lỗi `"is todo but not in the frontier
  yet (stage/deps/lineage)"`.
- `pick --id <id>` (`bin/fgos.mjs:1272-1285`): KHÔNG có kiểm tra
  frontier/stage — chỉ cần id tồn tại. Comment ngay tại chỗ
  (`bin/fgos.mjs:1263-1268`) xác nhận đây là chủ ý: "the frontier-membership
  guard removed below was a hard check at THIS verb layer, never an FSM
  law" — nới lỏng để clarify/decompose claim qua được cửa pick.

Hệ quả đã xác nhận thật, không suy đoán:
- `plugins/fgOS/skills/fgos-routing/SKILL.md` (bản trong worktree này) tự
  hướng dẫn dùng đúng `fgos take --role session [--id <id>]` để claim một
  item còn ở `clarify`/`decompose` — lệnh này BỊ REJECT bởi chính guard ở
  trên, vì `take` chưa từng được nới lỏng như `pick`.
- `plugins/fgOS/skills/cook/SKILL.md:36-39` đã tự phát hiện đúng lỗi này
  qua test thật ("Verified empirically against this repo... rejected"),
  ghi thành "Known gap (flagged, not guessed around)" — nhưng chỉ vá ở
  tầng cook's own flow, không sửa `fgos-routing`, và tự nhận "reconciling
  fgos-routing itself is a separate, out-of-scope fix".
- Phiên làm việc khảo sát item NÀY (tsk-1ab) tự confirm thêm 1 lần nữa:
  `pick tsk-1ab` thành công thật khi item còn stage `clarify` (log claim
  seq 518 (renumbered by tsk-n4i-1; was 502), `"from":"todo","to":"doing"`),
  đúng khớp phân tích code trên.

3 nguồn (code, cook's known-gap note, phiên này) đồng nhất — đây là
choke-point rõ nhất tìm được: 1 câu hỏi quyết định ("id này claim được
chưa"), 2 verb code trả lời khác nhau, và tài liệu skill chính thức
(`fgos-routing`) đang hướng dẫn sai theo nhánh `take` bị chặn.

**Đã sửa** (item `choke-point-take-vs-pick-claim-eligibility`): đồng bộ
guard giữa `take`/`pick` cho nhánh `--id` tường minh, KHÔNG nới `take`'s
no-`--id` default ("take mirrors runner dispatch" giữ nguyên cho nhánh
đó). `take`'s explicit-`--id` branch (`bin/fgos.mjs`) giờ gọi
`isDepsAndLineageReady` (`src/state/frontier.mjs`, factored từ `frontier`'s
own deps+lineage clause, trừ stage clause) thay vì `readyWork(dir).some(...)`
— dep-chưa-xong và open-descendant vẫn chặn claim y như cũ (test cũ
`pull-dep-blocked` vẫn xanh), chỉ riêng stage `clarify`/`decompose` không
còn chặn nữa, khớp đúng hành vi `pick` đã có từ trước. `fgos-routing`'s
prose ("claim it specifically with `--id <id>`" dùng `take --role session
[--id <id>]`) giờ ĐÚNG với hành vi thật, không cần sửa. Regression:
`test/cli/take-pick-claim-eligibility.test.mjs`.
```

### Full diff

```diff
No text difference.
```

## claim_368c6ea350e45900fcada35e67122f8a

Source digest: 3a74f97680892712456227dc57286bc6dbaceb76bf8291886f99025a9636df39

Target digest: 3a74f97680892712456227dc57286bc6dbaceb76bf8291886f99025a9636df39

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-178",
  "sourceLines": [
    1897,
    1901
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-37",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
  ],
  "nativeTargetClaimId": "claim_640913a05b01ffe38ff590578ec98f1b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "1-take-vs-pick-2-định-nghĩa-khác-nhau-cho-item-này-claim-được-không",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_368c6ea350e45900fcada35e67122f8a",
    "sourceUnitDigest": "3a74f97680892712456227dc57286bc6dbaceb76bf8291886f99025a9636df39",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-37",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-178 (lines 1897–1901) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-37. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "3a74f97680892712456227dc57286bc6dbaceb76bf8291886f99025a9636df39",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
    ]
  }
}
```

### Full source unit

```text
Cả hai đều delegate phần ghi state cho cùng `claimWork` (`claim-port.mjs`,
đã hợp nhất đúng theo tsk-53f) — NHƯNG mỗi verb tự gác một lớp kiểm tra
điều kiện claim RIÊNG, ngay trước khi gọi `claimWork`, và hai lớp gác đó
trả lời khác nhau cho cùng 1 input (id đang ở stage `clarify`/`decompose`,
status `todo`, chưa vào frontier):
```

### Full target unit

```text
Cả hai đều delegate phần ghi state cho cùng `claimWork` (`claim-port.mjs`,
đã hợp nhất đúng theo tsk-53f) — NHƯNG mỗi verb tự gác một lớp kiểm tra
điều kiện claim RIÊNG, ngay trước khi gọi `claimWork`, và hai lớp gác đó
trả lời khác nhau cho cùng 1 input (id đang ở stage `clarify`/`decompose`,
status `todo`, chưa vào frontier):
```

### Full diff

```diff
No text difference.
```

## claim_b9de9d038f79f0e9cfa52561fca4181a

Source digest: f210a6630e16d442bd97cc5a7a5baca341cf2b195fa0e70201589238a64d25fa

Target digest: f210a6630e16d442bd97cc5a7a5baca341cf2b195fa0e70201589238a64d25fa

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-179",
  "sourceLines": [
    1903,
    1911
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-38",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
  ],
  "nativeTargetClaimId": "claim_ed211bb484aacd9ea850e5b7b3c918eb",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "1-take-vs-pick-2-định-nghĩa-khác-nhau-cho-item-này-claim-được-không",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_b9de9d038f79f0e9cfa52561fca4181a",
    "sourceUnitDigest": "f210a6630e16d442bd97cc5a7a5baca341cf2b195fa0e70201589238a64d25fa",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-38",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-179 (lines 1903–1911) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-38. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f210a6630e16d442bd97cc5a7a5baca341cf2b195fa0e70201589238a64d25fa",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
    ]
  }
}
```

### Full source unit

```text
- `take --id <id>` (`bin/fgos.mjs:1233-1237`): chặn cứng — nếu
  `status === 'todo'` và id không nằm trong `readyWork()` (frontier, tức
  chưa tới stage `executing`), ném lỗi `"is todo but not in the frontier
  yet (stage/deps/lineage)"`.
- `pick --id <id>` (`bin/fgos.mjs:1272-1285`): KHÔNG có kiểm tra
  frontier/stage — chỉ cần id tồn tại. Comment ngay tại chỗ
  (`bin/fgos.mjs:1263-1268`) xác nhận đây là chủ ý: "the frontier-membership
  guard removed below was a hard check at THIS verb layer, never an FSM
  law" — nới lỏng để clarify/decompose claim qua được cửa pick.
```

### Full target unit

```text
- `take --id <id>` (`bin/fgos.mjs:1233-1237`): chặn cứng — nếu
  `status === 'todo'` và id không nằm trong `readyWork()` (frontier, tức
  chưa tới stage `executing`), ném lỗi `"is todo but not in the frontier
  yet (stage/deps/lineage)"`.
- `pick --id <id>` (`bin/fgos.mjs:1272-1285`): KHÔNG có kiểm tra
  frontier/stage — chỉ cần id tồn tại. Comment ngay tại chỗ
  (`bin/fgos.mjs:1263-1268`) xác nhận đây là chủ ý: "the frontier-membership
  guard removed below was a hard check at THIS verb layer, never an FSM
  law" — nới lỏng để clarify/decompose claim qua được cửa pick.
```

### Full diff

```diff
No text difference.
```

## claim_2d17f3a10e99a9da564808a8ca3e56c8

Source digest: 8d51b521960ab6c64ddb293acdb709485b626c0ceedbaa1ea752027e7dd431b3

Target digest: 8d51b521960ab6c64ddb293acdb709485b626c0ceedbaa1ea752027e7dd431b3

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-180",
  "sourceLines": [
    1913,
    1926
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-39",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
  ],
  "nativeTargetClaimId": "claim_6c910f00ac79fe4c6f4bde7b5c94602c",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "1-take-vs-pick-2-định-nghĩa-khác-nhau-cho-item-này-claim-được-không",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_2d17f3a10e99a9da564808a8ca3e56c8",
    "sourceUnitDigest": "8d51b521960ab6c64ddb293acdb709485b626c0ceedbaa1ea752027e7dd431b3",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-39",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-180 (lines 1913–1926) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-39. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "8d51b521960ab6c64ddb293acdb709485b626c0ceedbaa1ea752027e7dd431b3",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
    ]
  }
}
```

### Full source unit

```text
Hệ quả đã xác nhận thật, không suy đoán:
- `plugins/fgOS/skills/fgos-routing/SKILL.md` (bản trong worktree này) tự
  hướng dẫn dùng đúng `fgos take --role session [--id <id>]` để claim một
  item còn ở `clarify`/`decompose` — lệnh này BỊ REJECT bởi chính guard ở
  trên, vì `take` chưa từng được nới lỏng như `pick`.
- `plugins/fgOS/skills/cook/SKILL.md:36-39` đã tự phát hiện đúng lỗi này
  qua test thật ("Verified empirically against this repo... rejected"),
  ghi thành "Known gap (flagged, not guessed around)" — nhưng chỉ vá ở
  tầng cook's own flow, không sửa `fgos-routing`, và tự nhận "reconciling
  fgos-routing itself is a separate, out-of-scope fix".
- Phiên làm việc khảo sát item NÀY (tsk-1ab) tự confirm thêm 1 lần nữa:
  `pick tsk-1ab` thành công thật khi item còn stage `clarify` (log claim
  seq 518 (renumbered by tsk-n4i-1; was 502), `"from":"todo","to":"doing"`),
  đúng khớp phân tích code trên.
```

### Full target unit

```text
Hệ quả đã xác nhận thật, không suy đoán:
- `plugins/fgOS/skills/fgos-routing/SKILL.md` (bản trong worktree này) tự
  hướng dẫn dùng đúng `fgos take --role session [--id <id>]` để claim một
  item còn ở `clarify`/`decompose` — lệnh này BỊ REJECT bởi chính guard ở
  trên, vì `take` chưa từng được nới lỏng như `pick`.
- `plugins/fgOS/skills/cook/SKILL.md:36-39` đã tự phát hiện đúng lỗi này
  qua test thật ("Verified empirically against this repo... rejected"),
  ghi thành "Known gap (flagged, not guessed around)" — nhưng chỉ vá ở
  tầng cook's own flow, không sửa `fgos-routing`, và tự nhận "reconciling
  fgos-routing itself is a separate, out-of-scope fix".
- Phiên làm việc khảo sát item NÀY (tsk-1ab) tự confirm thêm 1 lần nữa:
  `pick tsk-1ab` thành công thật khi item còn stage `clarify` (log claim
  seq 518 (renumbered by tsk-n4i-1; was 502), `"from":"todo","to":"doing"`),
  đúng khớp phân tích code trên.
```

### Full diff

```diff
No text difference.
```

## claim_f5e397112a36967f6c2057456eb9b173

Source digest: 9b1777b6c4951c3f7a8688a2d3121c093d4fa1518983b1010397af93034b2361

Target digest: 9b1777b6c4951c3f7a8688a2d3121c093d4fa1518983b1010397af93034b2361

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-181",
  "sourceLines": [
    1928,
    1931
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-40",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
  ],
  "nativeTargetClaimId": "claim_ac8fc4a64183675ff0c1f0b75d1ce457",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "1-take-vs-pick-2-định-nghĩa-khác-nhau-cho-item-này-claim-được-không",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_f5e397112a36967f6c2057456eb9b173",
    "sourceUnitDigest": "9b1777b6c4951c3f7a8688a2d3121c093d4fa1518983b1010397af93034b2361",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-40",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-181 (lines 1928–1931) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-40. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "9b1777b6c4951c3f7a8688a2d3121c093d4fa1518983b1010397af93034b2361",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
    ]
  }
}
```

### Full source unit

```text
3 nguồn (code, cook's known-gap note, phiên này) đồng nhất — đây là
choke-point rõ nhất tìm được: 1 câu hỏi quyết định ("id này claim được
chưa"), 2 verb code trả lời khác nhau, và tài liệu skill chính thức
(`fgos-routing`) đang hướng dẫn sai theo nhánh `take` bị chặn.
```

### Full target unit

```text
3 nguồn (code, cook's known-gap note, phiên này) đồng nhất — đây là
choke-point rõ nhất tìm được: 1 câu hỏi quyết định ("id này claim được
chưa"), 2 verb code trả lời khác nhau, và tài liệu skill chính thức
(`fgos-routing`) đang hướng dẫn sai theo nhánh `take` bị chặn.
```

### Full diff

```diff
No text difference.
```

## claim_12825427c0cb1d693c6eb2f803952181

Source digest: c94b8f3bfaca3ce6d30bddefa67355c8da5beec783fd3f1490d82885cbfefdc7

Target digest: c94b8f3bfaca3ce6d30bddefa67355c8da5beec783fd3f1490d82885cbfefdc7

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-182",
  "sourceLines": [
    1933,
    1944
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
  ],
  "targetPath": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
  "targetAnchor": "unheaded-block-41",
  "targetAncestry": [
    "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
    "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
    "Candidates",
    "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
    "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
  ],
  "nativeTargetClaimId": "claim_0cbe74271ffe32022421843e854a8ce8",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ",
  "section": "1-take-vs-pick-2-định-nghĩa-khác-nhau-cho-item-này-claim-được-không",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_12825427c0cb1d693c6eb2f803952181",
    "sourceUnitDigest": "c94b8f3bfaca3ce6d30bddefa67355c8da5beec783fd3f1490d82885cbfefdc7",
    "targetOwner": "docs/platform/runner/decisions/h-36d872fbb0e5.md",
    "targetAnchor": "unheaded-block-41",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ. Whole unheaded-block docs/specs/runner.md#unheaded-block-182 (lines 1933–1944) carried at docs/platform/runner/decisions/h-36d872fbb0e5.md#unheaded-block-41. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c94b8f3bfaca3ce6d30bddefa67355c8da5beec783fd3f1490d82885cbfefdc7",
    "targetAncestry": [
      "Added in candidate: Runner Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)",
      "0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)",
      "Candidates",
      "Xác nhận THẬT (choke-point có bằng chứng cụ thể)",
      "1. `take` vs `pick` — 2 định nghĩa khác nhau cho \"item này claim được không\""
    ]
  }
}
```

### Full source unit

```text
**Đã sửa** (item `choke-point-take-vs-pick-claim-eligibility`): đồng bộ
guard giữa `take`/`pick` cho nhánh `--id` tường minh, KHÔNG nới `take`'s
no-`--id` default ("take mirrors runner dispatch" giữ nguyên cho nhánh
đó). `take`'s explicit-`--id` branch (`bin/fgos.mjs`) giờ gọi
`isDepsAndLineageReady` (`src/state/frontier.mjs`, factored từ `frontier`'s
own deps+lineage clause, trừ stage clause) thay vì `readyWork(dir).some(...)`
— dep-chưa-xong và open-descendant vẫn chặn claim y như cũ (test cũ
`pull-dep-blocked` vẫn xanh), chỉ riêng stage `clarify`/`decompose` không
còn chặn nữa, khớp đúng hành vi `pick` đã có từ trước. `fgos-routing`'s
prose ("claim it specifically with `--id <id>`" dùng `take --role session
[--id <id>]`) giờ ĐÚNG với hành vi thật, không cần sửa. Regression:
`test/cli/take-pick-claim-eligibility.test.mjs`.
```

### Full target unit

```text
**Đã sửa** (item `choke-point-take-vs-pick-claim-eligibility`): đồng bộ
guard giữa `take`/`pick` cho nhánh `--id` tường minh, KHÔNG nới `take`'s
no-`--id` default ("take mirrors runner dispatch" giữ nguyên cho nhánh
đó). `take`'s explicit-`--id` branch (`bin/fgos.mjs`) giờ gọi
`isDepsAndLineageReady` (`src/state/frontier.mjs`, factored từ `frontier`'s
own deps+lineage clause, trừ stage clause) thay vì `readyWork(dir).some(...)`
— dep-chưa-xong và open-descendant vẫn chặn claim y như cũ (test cũ
`pull-dep-blocked` vẫn xanh), chỉ riêng stage `clarify`/`decompose` không
còn chặn nữa, khớp đúng hành vi `pick` đã có từ trước. `fgos-routing`'s
prose ("claim it specifically with `--id <id>`" dùng `take --role session
[--id <id>]`) giờ ĐÚNG với hành vi thật, không cần sửa. Regression:
`test/cli/take-pick-claim-eligibility.test.mjs`.
```

### Full diff

```diff
No text difference.
```
