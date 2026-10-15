# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **5**. Target: `docs/platform/runner/architecture/h-7af1f0242611.md`; part 1/1. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `7846ced45f69bbff903859a2ba72fb304e87bde1c86364d0b71b49989ce651ef`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **5/5** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_49a878f920dd60fd0449e74d71b5fc1b",
      "claim_df3b43cb418418ef385dc9adb09adec2",
      "claim_532692d4c5ebdea48d2a8352129cc843",
      "claim_e212e87da06a0a552cc1ccde10b5aaab",
      "claim_17f27ab085e951c529afff07f099e25b"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_49a878f920dd60fd0449e74d71b5fc1b

Source digest: f43d4e34b06779c58f17e45c31f66be1d2a0daa7d90d6fbbe78f88131ea5d609

Target digest: f43d4e34b06779c58f17e45c31f66be1d2a0daa7d90d6fbbe78f88131ea5d609

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "từ-vựng-dispatch-hiện-hành",
  "sourceLines": [
    1265,
    1265
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)"
  ],
  "targetPath": "docs/platform/runner/architecture/h-7af1f0242611.md",
  "targetAnchor": "từ-vựng-dispatch-hiện-hành",
  "targetAncestry": [
    "Added in candidate: Runner Từ vựng dispatch hiện hành"
  ],
  "nativeTargetClaimId": "claim_fadbe8e1798430dd285cb8cf0c316a5e",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters; document exact share below one half",
  "section": "từ-vựng-dispatch-hiện-hành",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_49a878f920dd60fd0449e74d71b5fc1b",
    "sourceUnitDigest": "f43d4e34b06779c58f17e45c31f66be1d2a0daa7d90d6fbbe78f88131ea5d609",
    "targetOwner": "docs/platform/runner/architecture/h-7af1f0242611.md",
    "targetAnchor": "từ-vựng-dispatch-hiện-hành",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. Whole heading docs/specs/runner.md#từ-vựng-dispatch-hiện-hành (lines 1265–1265) carried at docs/platform/runner/architecture/h-7af1f0242611.md#từ-vựng-dispatch-hiện-hành. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "f43d4e34b06779c58f17e45c31f66be1d2a0daa7d90d6fbbe78f88131ea5d609",
    "targetAncestry": [
      "Added in candidate: Runner Từ vựng dispatch hiện hành"
    ]
  }
}
```

### Full source unit

```text
## Từ vựng dispatch hiện hành

Lớp từ vựng dispatch hiện hành của fgOS phản ánh mô hình control plane hợp nhất (chuỗi ADR 0026 / 0028 / 0029 / 0031 / 0034 — Native-First Dispatch Doctrine và lịch sử tiến hóa control plane). Các thuật ngữ cũ như `rootTask`, `subTask` đã được loại bỏ hoàn toàn (superseded bởi ADR 0029 — Sửa ba mệnh đề từ vựng dispatch, xem `docs/decisions/index.md`), và `capacity` cũ đã được phân tách thành `capability` và `executor` (superseded bởi ADR 0034 — Đổi tên capacity/capacities thành executor/executors, xem `docs/decisions/index.md`).
```

### Full target unit

```text
## Từ vựng dispatch hiện hành

Lớp từ vựng dispatch hiện hành của fgOS phản ánh mô hình control plane hợp nhất (chuỗi ADR 0026 / 0028 / 0029 / 0031 / 0034 — Native-First Dispatch Doctrine và lịch sử tiến hóa control plane). Các thuật ngữ cũ như `rootTask`, `subTask` đã được loại bỏ hoàn toàn (superseded bởi ADR 0029 — Sửa ba mệnh đề từ vựng dispatch, xem `docs/decisions/index.md`), và `capacity` cũ đã được phân tách thành `capability` và `executor` (superseded bởi ADR 0034 — Đổi tên capacity/capacities thành executor/executors, xem `docs/decisions/index.md`).
```

### Full diff

```diff
No text difference.
```

## claim_df3b43cb418418ef385dc9adb09adec2

Source digest: 289d09c0638b751d56c01bb15ddd9e052c0cf73c0938e093b1efdfca3f986bba

Target digest: 289d09c0638b751d56c01bb15ddd9e052c0cf73c0938e093b1efdfca3f986bba

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-103",
  "sourceLines": [
    1267,
    1267
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Từ vựng dispatch hiện hành"
  ],
  "targetPath": "docs/platform/runner/architecture/h-7af1f0242611.md",
  "targetAnchor": "unheaded-block-3",
  "targetAncestry": [
    "Added in candidate: Runner Từ vựng dispatch hiện hành",
    "Từ vựng dispatch hiện hành"
  ],
  "nativeTargetClaimId": "claim_325dfb2bb2a8c2ac01d9294da9bec233",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "từ-vựng-dispatch-hiện-hành",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_df3b43cb418418ef385dc9adb09adec2",
    "sourceUnitDigest": "289d09c0638b751d56c01bb15ddd9e052c0cf73c0938e093b1efdfca3f986bba",
    "targetOwner": "docs/platform/runner/architecture/h-7af1f0242611.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "decision",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-103 (lines 1267–1267) carried at docs/platform/runner/architecture/h-7af1f0242611.md#unheaded-block-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "289d09c0638b751d56c01bb15ddd9e052c0cf73c0938e093b1efdfca3f986bba",
    "targetAncestry": [
      "Added in candidate: Runner Từ vựng dispatch hiện hành",
      "Từ vựng dispatch hiện hành"
    ]
  }
}
```

### Full source unit

```text
Lớp từ vựng dispatch hiện hành của fgOS phản ánh mô hình control plane hợp nhất (chuỗi ADR 0026 / 0028 / 0029 / 0031 / 0034 — Native-First Dispatch Doctrine và lịch sử tiến hóa control plane). Các thuật ngữ cũ như `rootTask`, `subTask` đã được loại bỏ hoàn toàn (superseded bởi ADR 0029 — Sửa ba mệnh đề từ vựng dispatch, xem `docs/decisions/index.md`), và `capacity` cũ đã được phân tách thành `capability` và `executor` (superseded bởi ADR 0034 — Đổi tên capacity/capacities thành executor/executors, xem `docs/decisions/index.md`).
```

### Full target unit

```text
Lớp từ vựng dispatch hiện hành của fgOS phản ánh mô hình control plane hợp nhất (chuỗi ADR 0026 / 0028 / 0029 / 0031 / 0034 — Native-First Dispatch Doctrine và lịch sử tiến hóa control plane). Các thuật ngữ cũ như `rootTask`, `subTask` đã được loại bỏ hoàn toàn (superseded bởi ADR 0029 — Sửa ba mệnh đề từ vựng dispatch, xem `docs/decisions/index.md`), và `capacity` cũ đã được phân tách thành `capability` và `executor` (superseded bởi ADR 0034 — Đổi tên capacity/capacities thành executor/executors, xem `docs/decisions/index.md`).
```

### Full diff

```diff
No text difference.
```

## claim_532692d4c5ebdea48d2a8352129cc843

Source digest: 4d4c05e94bd4baf1756a0e253ce3a29ec9b73beaa546931acf49ac259e774f44

Target digest: 4d4c05e94bd4baf1756a0e253ce3a29ec9b73beaa546931acf49ac259e774f44

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "bảng-đối-chiếu-từ-vựng-dispatch",
  "sourceLines": [
    1269,
    1269
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Từ vựng dispatch hiện hành"
  ],
  "targetPath": "docs/platform/runner/architecture/h-7af1f0242611.md",
  "targetAnchor": "bảng-đối-chiếu-từ-vựng-dispatch",
  "targetAncestry": [
    "Added in candidate: Runner Từ vựng dispatch hiện hành",
    "Từ vựng dispatch hiện hành"
  ],
  "nativeTargetClaimId": "claim_a1f4a8c99cc9956676b5a2649bc42702",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters; document exact share below one half",
  "section": "bảng-đối-chiếu-từ-vựng-dispatch",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_532692d4c5ebdea48d2a8352129cc843",
    "sourceUnitDigest": "4d4c05e94bd4baf1756a0e253ce3a29ec9b73beaa546931acf49ac259e774f44",
    "targetOwner": "docs/platform/runner/architecture/h-7af1f0242611.md",
    "targetAnchor": "bảng-đối-chiếu-từ-vựng-dispatch",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. Whole heading docs/specs/runner.md#bảng-đối-chiếu-từ-vựng-dispatch (lines 1269–1269) carried at docs/platform/runner/architecture/h-7af1f0242611.md#bảng-đối-chiếu-từ-vựng-dispatch. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "4d4c05e94bd4baf1756a0e253ce3a29ec9b73beaa546931acf49ac259e774f44",
    "targetAncestry": [
      "Added in candidate: Runner Từ vựng dispatch hiện hành",
      "Từ vựng dispatch hiện hành"
    ]
  }
}
```

### Full source unit

```text
### Bảng đối chiếu từ vựng dispatch

| Thuật ngữ hiện hành | Thuật ngữ cũ / superseded | Ý nghĩa ngắn gọn | Con trỏ tham chiếu |
|---|---|---|---|
| `work` | `rootTask` | Đơn vị công việc gốc (T2, `tsk-*`) mang vai trò T1 khi được kích hoạt | `runner.md:1958` (ADR 0029) |
| `child work` | `subTask` | Công việc con được phân rã từ một work cha | `runner.md:1959` (ADR 0029) |
| `executor` | `capacity` (đơn vị thực thi) | Đối tượng thực thi cụ thể (agentType/cli/task/mcp) đảm nhận một job/capability | `runner.md:2434` (ADR 0034) |
| `capability` | `capacity` (năng lực) | Năng lực / lời hứa hành vi có tên (abstract behavior promise) mà executor cung cấp | `runner.md:2434` (ADR 0034), `dispatch-control-plane-redesign.md:125` |
| `launcher` | `orchestrator` (nghĩa cũ `0026`) | Tiến trình/cơ chế quyết định kích hoạt work, dựng work lên rồi rời đi (buông) | `runner.md:1871` (ADR 0028) |
| `driver` | (không đổi) | Tiến trình/phiên đồng hành cùng work từ đầu đến cuối (ở lại) | `runner.md:1986` (ADR 0029), `runner.md:2172` (ADR 0031) |
| `orchestrator` | (tái gán nghĩa `0029`) | Tầng hợp thành T0 quản lý N đơn vị work (ở lại) | `runner.md:1995` (ADR 0029), `runner.md:2172` (ADR 0031) |
| `DispatchPlan` | (mới) | Kế hoạch dispatch được resolved gồm mechanism, target agent/tool, và metadata | `src/runner/dispatch/plan.mjs`, `dispatch-control-plane-redesign.md:175` |
| `DispatchAssignment` | (mới) | Đơn vị phân công dispatch cụ thể gán executor cho work item | `src/runner/dispatch/plan.mjs`, `dispatch-control-plane-redesign.md:210` |
| `Unit` / `capability` | (mới, thay matching L2 cũ per 0048) | Unit khai báo thuộc tính và canonical capability; bind() phân giải executor | `core/skills/_shared/capability-matching.md` |
| `rigor` | (từ vựng chất lượng cũ) | Yêu cầu chất lượng phía cầu (`low | standard | high | critical`), gộp chỉ-nâng qua các scope và sàn capability | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046 |
| `tier` | `modelTier` | Mức model phía cung (`nano | mini | standard | advanced | flagship | frontier`), cấu hình qua `runner.rigorToTier` và chọn model tại `runner.modelPolicies` | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046 |
| `work.size` | (hạng việc cũ) | Độ lớn việc (`light | standard | heavy`), không bao giờ dẫn tới model | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), spec Work-State |

*Ghi chú:*
- Gom thang tier/rigor (RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046): phân định triệt để bên cầu (`rigor`) và bên cung (`tier` qua bảng `rigorToTier`). Xoá hoàn toàn các lớp trung gian, cầu nối và overrides cũ. Sàn duy nhất theo loại việc là `capabilities.<cap>.rigor`.
- Về vai trò bên gọi `launcher` / `driver` / `orchestrator`: xem lưới 2×2 tại `runner.md:2172-2180` (kỷ yếu `0031`) tóm tắt trục T1/T0.
- Khái niệm `capacity` trong lịch sử từng đại diện cho cả năng lực lẫn đơn vị thực thi; từ ADR 0034 (`runner.md:2434`), các cấu hình `capacities.<id>` được chuyển thành `executors.<id>` và `capabilities.<id>`.
- `rootTask` và `subTask` đã bị loại bỏ khỏi từ vựng dispatch per ADR 0029 (xem `docs/decisions/index.md`).
- `purpose` (tham số nội bộ `resolve.mjs`/`plan.mjs`) và flag CLI `--for <purpose>` KHÔNG phải một ontology thứ ba — cả hai đặt tên cho một giá trị `capability`, chỉ là cú pháp tương thích lịch sử (compatibility syntax), không phải một identity định tuyến riêng.
- `job` KHÔNG phải một routing identity — ADR-004 dành riêng tên này cho một scheduler tương lai (chưa dùng); nếu xuất hiện trong log, nó chỉ là nhãn ngữ cảnh của một request, không phải mục tiêu dispatch resolve tới. Một `Run` là một lần thực thi cụ thể cho một Assignment, không phải job/operation identity.
- Dispatch core chỉ nhận đúng hai target identity — `capability` và `executor-id` — cùng hợp đồng `DispatchRequest`/`PolicyPatch`/`DispatchPlan` chính tắc và danh sách sở hữu component-internal (8 thẩm quyền + forbidden dependencies): xem [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md).
- `Unit` và canonical capability (thay thế matching đa tầng L2 per 0048): Unit khai báo các thuộc tính nhu cầu của đơn vị việc và capability (`domain:verb`); `bind()` chọn executor theo 5 mức (xem `core/skills/_shared/capability-matching.md`).
```

### Full target unit

```text
### Bảng đối chiếu từ vựng dispatch

| Thuật ngữ hiện hành | Thuật ngữ cũ / superseded | Ý nghĩa ngắn gọn | Con trỏ tham chiếu |
|---|---|---|---|
| `work` | `rootTask` | Đơn vị công việc gốc (T2, `tsk-*`) mang vai trò T1 khi được kích hoạt | `runner.md:1958` (ADR 0029) |
| `child work` | `subTask` | Công việc con được phân rã từ một work cha | `runner.md:1959` (ADR 0029) |
| `executor` | `capacity` (đơn vị thực thi) | Đối tượng thực thi cụ thể (agentType/cli/task/mcp) đảm nhận một job/capability | `runner.md:2434` (ADR 0034) |
| `capability` | `capacity` (năng lực) | Năng lực / lời hứa hành vi có tên (abstract behavior promise) mà executor cung cấp | `runner.md:2434` (ADR 0034), `dispatch-control-plane-redesign.md:125` |
| `launcher` | `orchestrator` (nghĩa cũ `0026`) | Tiến trình/cơ chế quyết định kích hoạt work, dựng work lên rồi rời đi (buông) | `runner.md:1871` (ADR 0028) |
| `driver` | (không đổi) | Tiến trình/phiên đồng hành cùng work từ đầu đến cuối (ở lại) | `runner.md:1986` (ADR 0029), `runner.md:2172` (ADR 0031) |
| `orchestrator` | (tái gán nghĩa `0029`) | Tầng hợp thành T0 quản lý N đơn vị work (ở lại) | `runner.md:1995` (ADR 0029), `runner.md:2172` (ADR 0031) |
| `DispatchPlan` | (mới) | Kế hoạch dispatch được resolved gồm mechanism, target agent/tool, và metadata | `src/runner/dispatch/plan.mjs`, `dispatch-control-plane-redesign.md:175` |
| `DispatchAssignment` | (mới) | Đơn vị phân công dispatch cụ thể gán executor cho work item | `src/runner/dispatch/plan.mjs`, `dispatch-control-plane-redesign.md:210` |
| `Unit` / `capability` | (mới, thay matching L2 cũ per 0048) | Unit khai báo thuộc tính và canonical capability; bind() phân giải executor | `core/skills/_shared/capability-matching.md` |
| `rigor` | (từ vựng chất lượng cũ) | Yêu cầu chất lượng phía cầu (`low | standard | high | critical`), gộp chỉ-nâng qua các scope và sàn capability | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046 |
| `tier` | `modelTier` | Mức model phía cung (`nano | mini | standard | advanced | flagship | frontier`), cấu hình qua `runner.rigorToTier` và chọn model tại `runner.modelPolicies` | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046 |
| `work.size` | (hạng việc cũ) | Độ lớn việc (`light | standard | heavy`), không bao giờ dẫn tới model | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), spec Work-State |

*Ghi chú:*
- Gom thang tier/rigor (RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046): phân định triệt để bên cầu (`rigor`) và bên cung (`tier` qua bảng `rigorToTier`). Xoá hoàn toàn các lớp trung gian, cầu nối và overrides cũ. Sàn duy nhất theo loại việc là `capabilities.<cap>.rigor`.
- Về vai trò bên gọi `launcher` / `driver` / `orchestrator`: xem lưới 2×2 tại `runner.md:2172-2180` (kỷ yếu `0031`) tóm tắt trục T1/T0.
- Khái niệm `capacity` trong lịch sử từng đại diện cho cả năng lực lẫn đơn vị thực thi; từ ADR 0034 (`runner.md:2434`), các cấu hình `capacities.<id>` được chuyển thành `executors.<id>` và `capabilities.<id>`.
- `rootTask` và `subTask` đã bị loại bỏ khỏi từ vựng dispatch per ADR 0029 (xem `docs/decisions/index.md`).
- `purpose` (tham số nội bộ `resolve.mjs`/`plan.mjs`) và flag CLI `--for <purpose>` KHÔNG phải một ontology thứ ba — cả hai đặt tên cho một giá trị `capability`, chỉ là cú pháp tương thích lịch sử (compatibility syntax), không phải một identity định tuyến riêng.
- `job` KHÔNG phải một routing identity — ADR-004 dành riêng tên này cho một scheduler tương lai (chưa dùng); nếu xuất hiện trong log, nó chỉ là nhãn ngữ cảnh của một request, không phải mục tiêu dispatch resolve tới. Một `Run` là một lần thực thi cụ thể cho một Assignment, không phải job/operation identity.
- Dispatch core chỉ nhận đúng hai target identity — `capability` và `executor-id` — cùng hợp đồng `DispatchRequest`/`PolicyPatch`/`DispatchPlan` chính tắc và danh sách sở hữu component-internal (8 thẩm quyền + forbidden dependencies): xem [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md).
- `Unit` và canonical capability (thay thế matching đa tầng L2 per 0048): Unit khai báo các thuộc tính nhu cầu của đơn vị việc và capability (`domain:verb`); `bind()` chọn executor theo 5 mức (xem `core/skills/_shared/capability-matching.md`).
```

### Full diff

```diff
No text difference.
```

## claim_e212e87da06a0a552cc1ccde10b5aaab

Source digest: ea328f8878d7b1816a6b23abc0b80e08352165da8a97ee753c80b855322d41d0

Target digest: ea328f8878d7b1816a6b23abc0b80e08352165da8a97ee753c80b855322d41d0

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-104",
  "sourceLines": [
    1271,
    1285
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Từ vựng dispatch hiện hành",
    "Bảng đối chiếu từ vựng dispatch"
  ],
  "targetPath": "docs/platform/runner/architecture/h-7af1f0242611.md",
  "targetAnchor": "unheaded-block-4",
  "targetAncestry": [
    "Added in candidate: Runner Từ vựng dispatch hiện hành",
    "Từ vựng dispatch hiện hành",
    "Bảng đối chiếu từ vựng dispatch"
  ],
  "nativeTargetClaimId": "claim_04f910291a673b25fcff1b75b81dcae4",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "bảng-đối-chiếu-từ-vựng-dispatch",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e212e87da06a0a552cc1ccde10b5aaab",
    "sourceUnitDigest": "ea328f8878d7b1816a6b23abc0b80e08352165da8a97ee753c80b855322d41d0",
    "targetOwner": "docs/platform/runner/architecture/h-7af1f0242611.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-104 (lines 1271–1285) carried at docs/platform/runner/architecture/h-7af1f0242611.md#unheaded-block-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "ea328f8878d7b1816a6b23abc0b80e08352165da8a97ee753c80b855322d41d0",
    "targetAncestry": [
      "Added in candidate: Runner Từ vựng dispatch hiện hành",
      "Từ vựng dispatch hiện hành",
      "Bảng đối chiếu từ vựng dispatch"
    ]
  }
}
```

### Full source unit

```text
| Thuật ngữ hiện hành | Thuật ngữ cũ / superseded | Ý nghĩa ngắn gọn | Con trỏ tham chiếu |
|---|---|---|---|
| `work` | `rootTask` | Đơn vị công việc gốc (T2, `tsk-*`) mang vai trò T1 khi được kích hoạt | `runner.md:1958` (ADR 0029) |
| `child work` | `subTask` | Công việc con được phân rã từ một work cha | `runner.md:1959` (ADR 0029) |
| `executor` | `capacity` (đơn vị thực thi) | Đối tượng thực thi cụ thể (agentType/cli/task/mcp) đảm nhận một job/capability | `runner.md:2434` (ADR 0034) |
| `capability` | `capacity` (năng lực) | Năng lực / lời hứa hành vi có tên (abstract behavior promise) mà executor cung cấp | `runner.md:2434` (ADR 0034), `dispatch-control-plane-redesign.md:125` |
| `launcher` | `orchestrator` (nghĩa cũ `0026`) | Tiến trình/cơ chế quyết định kích hoạt work, dựng work lên rồi rời đi (buông) | `runner.md:1871` (ADR 0028) |
| `driver` | (không đổi) | Tiến trình/phiên đồng hành cùng work từ đầu đến cuối (ở lại) | `runner.md:1986` (ADR 0029), `runner.md:2172` (ADR 0031) |
| `orchestrator` | (tái gán nghĩa `0029`) | Tầng hợp thành T0 quản lý N đơn vị work (ở lại) | `runner.md:1995` (ADR 0029), `runner.md:2172` (ADR 0031) |
| `DispatchPlan` | (mới) | Kế hoạch dispatch được resolved gồm mechanism, target agent/tool, và metadata | `src/runner/dispatch/plan.mjs`, `dispatch-control-plane-redesign.md:175` |
| `DispatchAssignment` | (mới) | Đơn vị phân công dispatch cụ thể gán executor cho work item | `src/runner/dispatch/plan.mjs`, `dispatch-control-plane-redesign.md:210` |
| `Unit` / `capability` | (mới, thay matching L2 cũ per 0048) | Unit khai báo thuộc tính và canonical capability; bind() phân giải executor | `core/skills/_shared/capability-matching.md` |
| `rigor` | (từ vựng chất lượng cũ) | Yêu cầu chất lượng phía cầu (`low | standard | high | critical`), gộp chỉ-nâng qua các scope và sàn capability | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046 |
| `tier` | `modelTier` | Mức model phía cung (`nano | mini | standard | advanced | flagship | frontier`), cấu hình qua `runner.rigorToTier` và chọn model tại `runner.modelPolicies` | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046 |
| `work.size` | (hạng việc cũ) | Độ lớn việc (`light | standard | heavy`), không bao giờ dẫn tới model | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), spec Work-State |
```

### Full target unit

```text
| Thuật ngữ hiện hành | Thuật ngữ cũ / superseded | Ý nghĩa ngắn gọn | Con trỏ tham chiếu |
|---|---|---|---|
| `work` | `rootTask` | Đơn vị công việc gốc (T2, `tsk-*`) mang vai trò T1 khi được kích hoạt | `runner.md:1958` (ADR 0029) |
| `child work` | `subTask` | Công việc con được phân rã từ một work cha | `runner.md:1959` (ADR 0029) |
| `executor` | `capacity` (đơn vị thực thi) | Đối tượng thực thi cụ thể (agentType/cli/task/mcp) đảm nhận một job/capability | `runner.md:2434` (ADR 0034) |
| `capability` | `capacity` (năng lực) | Năng lực / lời hứa hành vi có tên (abstract behavior promise) mà executor cung cấp | `runner.md:2434` (ADR 0034), `dispatch-control-plane-redesign.md:125` |
| `launcher` | `orchestrator` (nghĩa cũ `0026`) | Tiến trình/cơ chế quyết định kích hoạt work, dựng work lên rồi rời đi (buông) | `runner.md:1871` (ADR 0028) |
| `driver` | (không đổi) | Tiến trình/phiên đồng hành cùng work từ đầu đến cuối (ở lại) | `runner.md:1986` (ADR 0029), `runner.md:2172` (ADR 0031) |
| `orchestrator` | (tái gán nghĩa `0029`) | Tầng hợp thành T0 quản lý N đơn vị work (ở lại) | `runner.md:1995` (ADR 0029), `runner.md:2172` (ADR 0031) |
| `DispatchPlan` | (mới) | Kế hoạch dispatch được resolved gồm mechanism, target agent/tool, và metadata | `src/runner/dispatch/plan.mjs`, `dispatch-control-plane-redesign.md:175` |
| `DispatchAssignment` | (mới) | Đơn vị phân công dispatch cụ thể gán executor cho work item | `src/runner/dispatch/plan.mjs`, `dispatch-control-plane-redesign.md:210` |
| `Unit` / `capability` | (mới, thay matching L2 cũ per 0048) | Unit khai báo thuộc tính và canonical capability; bind() phân giải executor | `core/skills/_shared/capability-matching.md` |
| `rigor` | (từ vựng chất lượng cũ) | Yêu cầu chất lượng phía cầu (`low | standard | high | critical`), gộp chỉ-nâng qua các scope và sàn capability | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046 |
| `tier` | `modelTier` | Mức model phía cung (`nano | mini | standard | advanced | flagship | frontier`), cấu hình qua `runner.rigorToTier` và chọn model tại `runner.modelPolicies` | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046 |
| `work.size` | (hạng việc cũ) | Độ lớn việc (`light | standard | heavy`), không bao giờ dẫn tới model | RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), spec Work-State |
```

### Full diff

```diff
No text difference.
```

## claim_17f27ab085e951c529afff07f099e25b

Source digest: 75d27c27bf35d669cd2e4899d9ed3966cc2e628a6c37bfdd78483e02c35c28bc

Target digest: 75d27c27bf35d669cd2e4899d9ed3966cc2e628a6c37bfdd78483e02c35c28bc

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-105",
  "sourceLines": [
    1287,
    1295
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Từ vựng dispatch hiện hành",
    "Bảng đối chiếu từ vựng dispatch"
  ],
  "targetPath": "docs/platform/runner/architecture/h-7af1f0242611.md",
  "targetAnchor": "unheaded-block-5",
  "targetAncestry": [
    "Added in candidate: Runner Từ vựng dispatch hiện hành",
    "Từ vựng dispatch hiện hành",
    "Bảng đối chiếu từ vựng dispatch"
  ],
  "nativeTargetClaimId": "claim_7d7b61bd0c5872bd35c873900ec8d6b2",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "bảng-đối-chiếu-từ-vựng-dispatch",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_17f27ab085e951c529afff07f099e25b",
    "sourceUnitDigest": "75d27c27bf35d669cd2e4899d9ed3966cc2e628a6c37bfdd78483e02c35c28bc",
    "targetOwner": "docs/platform/runner/architecture/h-7af1f0242611.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-105 (lines 1287–1295) carried at docs/platform/runner/architecture/h-7af1f0242611.md#unheaded-block-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "75d27c27bf35d669cd2e4899d9ed3966cc2e628a6c37bfdd78483e02c35c28bc",
    "targetAncestry": [
      "Added in candidate: Runner Từ vựng dispatch hiện hành",
      "Từ vựng dispatch hiện hành",
      "Bảng đối chiếu từ vựng dispatch"
    ]
  }
}
```

### Full source unit

```text
*Ghi chú:*
- Gom thang tier/rigor (RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046): phân định triệt để bên cầu (`rigor`) và bên cung (`tier` qua bảng `rigorToTier`). Xoá hoàn toàn các lớp trung gian, cầu nối và overrides cũ. Sàn duy nhất theo loại việc là `capabilities.<cap>.rigor`.
- Về vai trò bên gọi `launcher` / `driver` / `orchestrator`: xem lưới 2×2 tại `runner.md:2172-2180` (kỷ yếu `0031`) tóm tắt trục T1/T0.
- Khái niệm `capacity` trong lịch sử từng đại diện cho cả năng lực lẫn đơn vị thực thi; từ ADR 0034 (`runner.md:2434`), các cấu hình `capacities.<id>` được chuyển thành `executors.<id>` và `capabilities.<id>`.
- `rootTask` và `subTask` đã bị loại bỏ khỏi từ vựng dispatch per ADR 0029 (xem `docs/decisions/index.md`).
- `purpose` (tham số nội bộ `resolve.mjs`/`plan.mjs`) và flag CLI `--for <purpose>` KHÔNG phải một ontology thứ ba — cả hai đặt tên cho một giá trị `capability`, chỉ là cú pháp tương thích lịch sử (compatibility syntax), không phải một identity định tuyến riêng.
- `job` KHÔNG phải một routing identity — ADR-004 dành riêng tên này cho một scheduler tương lai (chưa dùng); nếu xuất hiện trong log, nó chỉ là nhãn ngữ cảnh của một request, không phải mục tiêu dispatch resolve tới. Một `Run` là một lần thực thi cụ thể cho một Assignment, không phải job/operation identity.
- Dispatch core chỉ nhận đúng hai target identity — `capability` và `executor-id` — cùng hợp đồng `DispatchRequest`/`PolicyPatch`/`DispatchPlan` chính tắc và danh sách sở hữu component-internal (8 thẩm quyền + forbidden dependencies): xem [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md).
- `Unit` và canonical capability (thay thế matching đa tầng L2 per 0048): Unit khai báo các thuộc tính nhu cầu của đơn vị việc và capability (`domain:verb`); `bind()` chọn executor theo 5 mức (xem `core/skills/_shared/capability-matching.md`).
```

### Full target unit

```text
*Ghi chú:*
- Gom thang tier/rigor (RUL72 (Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng), 0046): phân định triệt để bên cầu (`rigor`) và bên cung (`tier` qua bảng `rigorToTier`). Xoá hoàn toàn các lớp trung gian, cầu nối và overrides cũ. Sàn duy nhất theo loại việc là `capabilities.<cap>.rigor`.
- Về vai trò bên gọi `launcher` / `driver` / `orchestrator`: xem lưới 2×2 tại `runner.md:2172-2180` (kỷ yếu `0031`) tóm tắt trục T1/T0.
- Khái niệm `capacity` trong lịch sử từng đại diện cho cả năng lực lẫn đơn vị thực thi; từ ADR 0034 (`runner.md:2434`), các cấu hình `capacities.<id>` được chuyển thành `executors.<id>` và `capabilities.<id>`.
- `rootTask` và `subTask` đã bị loại bỏ khỏi từ vựng dispatch per ADR 0029 (xem `docs/decisions/index.md`).
- `purpose` (tham số nội bộ `resolve.mjs`/`plan.mjs`) và flag CLI `--for <purpose>` KHÔNG phải một ontology thứ ba — cả hai đặt tên cho một giá trị `capability`, chỉ là cú pháp tương thích lịch sử (compatibility syntax), không phải một identity định tuyến riêng.
- `job` KHÔNG phải một routing identity — ADR-004 dành riêng tên này cho một scheduler tương lai (chưa dùng); nếu xuất hiện trong log, nó chỉ là nhãn ngữ cảnh của một request, không phải mục tiêu dispatch resolve tới. Một `Run` là một lần thực thi cụ thể cho một Assignment, không phải job/operation identity.
- Dispatch core chỉ nhận đúng hai target identity — `capability` và `executor-id` — cùng hợp đồng `DispatchRequest`/`PolicyPatch`/`DispatchPlan` chính tắc và danh sách sở hữu component-internal (8 thẩm quyền + forbidden dependencies): xem [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md).
- `Unit` và canonical capability (thay thế matching đa tầng L2 per 0048): Unit khai báo các thuộc tính nhu cầu của đơn vị việc và capability (`domain:verb`); `bind()` chọn executor theo 5 mức (xem `core/skills/_shared/capability-matching.md`).
```

### Full diff

```diff
No text difference.
```
