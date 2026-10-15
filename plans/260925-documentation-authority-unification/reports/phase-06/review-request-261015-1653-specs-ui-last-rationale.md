# Bounded re-review: one corrected rationale

Author: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15
Review mode: ordinary
Content commit: 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4

Exactly one pending predecessor-accounting row. Eight ok verdicts from the committed nine-row review have been applied, with verbatim notes. Step 8 closes when this row is independently accepted and applied. Pin the runner commit containing this request and compare the shown decision to its shard. No seed, sample or verdict chosen by the author. This is a Step 8 rationale-only request; Step 9 review packaging is deferred.

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-sc1-gaps.json`. Claim: `claim_e597b776163803dcf6e4194962ea4f6e`.

Prior finding (verbatim):

deep: binding fixed correctly (block 34, e013c5b0, source 5bed5c61 at 9881f8622 recomputes) but the rationale says the only delta to the successor is adding review/approve/run examples, which is false: the diff also adds the whole subcommands bullet (3 lines); correct the rationale to name both deltas

Source witness: `9881f8622732e3ba7c8e203097d42674b8aba36d:docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`; digest `5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3`.

```text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest
  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có
  `coordination` (dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
```

Target: `docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34`; digest `e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68`; ancestry ["CLI I/O Contract","7. Machine-Readable Verb Registry","Entry Fields And Effect Axes"].

```text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest
  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có
  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật
  tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,
  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;
  `parameters` cấp verb khi đó chỉ còn `sub`.
```

## Before decision

```json
{
  "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-34",
  "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
  "reviewStatus": "pending",
  "rationale": "The predecessor block 32 at 9881f8622 already states COMMAND_REGISTRY, 15 externalEffect verbs and no coordination. The only delta to the real same-file successor is adding review/approve/run examples. All other wording, list items and dispatch executor qualifier are retained. Native predecessor identity is conserved without graft or approval carry. Corrected binding: the successor is the bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), not the paragraph at unheaded-block-33. The old stored anchor/digest pair was inconsistent; no identity is grafted and no approval is carried.",
  "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ]
}
```

## After decision

```json
{
  "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-34",
  "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
  "reviewStatus": "pending",
  "rationale": "The predecessor block 32 at 9881f8622 already states COMMAND_REGISTRY, 15 externalEffect verbs and no coordination. The successor adds two deltas: the review/approve/run examples and the whole subcommands bullet (three lines), which the source never had. The other source field definitions, paginated/multiValueFormat bullet and dispatch executor qualifier are retained, with line reflow. Corrected binding remains the same-file bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), digest e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68; paragraph unheaded-block-33 was an inconsistent earlier binding. Native predecessor identity is conserved without graft or approval carry. Pending independent rationale re-review.",
  "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ]
}
```

[Full binding sidecar](review-request-261015-1653-specs-ui-last-rationale.md.json). Full current truth and promotion checks remain owed.
