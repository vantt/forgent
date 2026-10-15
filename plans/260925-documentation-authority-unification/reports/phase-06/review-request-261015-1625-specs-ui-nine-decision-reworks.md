# Nine decision corrections: bounded re-review

Author: codex-session:unit-run-1792056203419-9b5bd055@2026-10-15
Review mode: ordinary; review status: pending.
Content commit: 7854cff84d8bcb67075d4f9c09cd0b6d04808ff4

Exactly **9 pending rows: (a) 2 Step 8; (b) 7 main re-carry**. Docs bytes are unchanged; all source/target units below use the content pin, except explicitly labelled historical source witnesses. Pin the runner commit containing these decision artifacts when reviewing.

Review exactly these nine changed decisions with full before/after content. Source/target docs remain pinned to 7854cff84. No seed, draw or verdict is chosen by the author. Compare each shown decision to its committed shard; supply ordinary notes and full source/target digests. Unchanged 96 ok verdicts are applied and not reopened. Accounting receipts do not authorize promotion, full truth or cutover.

[Full packet](review-request-261015-1625-specs-ui-nine-decision-reworks.md.json), [96-verdict application and verbatim Notes](step8-nine-rework-application.json). Before means the decision reworked by the committed report; after is the current pending decision. Historical previously reviewed decisions remain separately shown in the JSON. Restored five merge/promote dispositions follow the unchanged vocabulary; schema corrections are explicitly named in the manifest rationales.

## 1. claim_665eb7f4bfb9bee7ba3f5e58368eaba1 — section (b)

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-sc1-gaps.json`.
Source: `docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`

Source digest: `ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796`
Before target digest: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`
After target digest: `e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68`

Prior finding (verbatim):

deep: gap row whose old unit (digest 665eb7f4, found at 977509d5f block 32) is the BULLET list (name, touchesState, externalEffect, paginated); it differs from carrier bullets block 34 (e013c5b0) only by the upstream-era wording and the added subcommands bullet, but the rebind points it at paragraph block 33 (0b3d8cfa), a different unit with no list items; the stored digest e1577e3b was already the bullets unit (found at c8b2d948d block 32) and the reviewed rationale says every list item is preserved; repoint target to cli-io-contract.md#unheaded-block-34 with digest e013c5b0 like row 54

### Before decision

```json
{
  "claimId": "claim_665eb7f4bfb9bee7ba3f5e58368eaba1",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-33",
  "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
  "reviewStatus": "pending",
  "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
  "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ]
}
```

### After decision

```json
{
  "claimId": "claim_665eb7f4bfb9bee7ba3f5e58368eaba1",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-34",
  "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
  "reviewStatus": "pending",
  "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 at 01fe216b4 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry. Corrected binding: the successor is the bullets unit unheaded-block-34 (name, touchesState, externalEffect, paginated and subcommands), not the paragraph at unheaded-block-33. The old stored anchor/digest pair was inconsistent; no identity is grafted and no approval is carried.",
  "targetUnitDigest": "e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ]
}
```

### Source unit

Historical witness: `977509d5f8c49a31c781b54ea53c2b3617f70a13:docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`; exact source digest matched.

```text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
  `run` — dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
```

### Before target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-33`

```text
**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).
```

### After target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34`
Ancestry: ["CLI I/O Contract","7. Machine-Readable Verb Registry","Entry Fields And Effect Axes"]

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

## 2. claim_e597b776163803dcf6e4194962ea4f6e — section (b)

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s5-root-authorities-sc1-gaps.json`.
Source: `docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`

Source digest: `5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3`
Before target digest: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`
After target digest: `e013c5b05d6ff58782aa8231ab4a55967bd5ef853dac4015aec8f16f5fcf9c68`

Prior finding (verbatim):

deep: gap row whose old unit (digest 5bed5c61, found at 9881f8622 block 32) is the BULLET list; word diff against carrier bullets block 34 (e013c5b0) is only the example list and the added subcommands bullet, but the rebind points it at paragraph block 33 (0b3d8cfa); stored digest e1577e3b was the bullets unit; same defect as row 6; repoint to cli-io-contract.md#unheaded-block-34 digest e013c5b0

### Before decision

```json
{
  "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-33",
  "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
  "reviewStatus": "pending",
  "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
  "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ]
}
```

### After decision

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

### Source unit

Historical witness: `9881f8622732e3ba7c8e203097d42674b8aba36d:docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`; exact source digest matched.

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

### Before target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-33`

```text
**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).
```

### After target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34`
Ancestry: ["CLI I/O Contract","7. Machine-Readable Verb Registry","Entry Fields And Effect Axes"]

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

## 3. claim_74a311a5ab882fe8ee4806125167e2d4 — section (a)

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s8-claude-plugin-01.json`.
Source: `docs/specs/fgos-plugin.md#data-dictionary`

Source digest: `5f7bbc0ccb0a688217a410356a618559820b7dfd24315cdd7dde1ca8ba7df0be`
Before target digest: `80aad4984704cb2169f9b47f19b917eb49396d225f5ba07cd499b7ce6c68e015`
After target digest: `80aad4984704cb2169f9b47f19b917eb49396d225f5ba07cd499b7ce6c68e015`

Prior finding (verbatim):

deep: the heading section differs from the source by exactly the corrected Work item id row (diff read, only line 5 of the section) yet disposition stays move, a verbatim-carry basis that is no longer true; siblings with a corrected sentence inside the section (claim_3459a397, claim_111f864d, claim_2aae8d68) are supersede and unheaded row 26 below was switched to supersede; set disposition supersede, name the corrected sentence in the rationale, rebind. Target 80aad498 recomputes, anchor ok, pending, no approval fields

### Before decision

```json
{
  "claimId": "claim_74a311a5ab882fe8ee4806125167e2d4",
  "sourceUnitDigest": "5f7bbc0ccb0a688217a410356a618559820b7dfd24315cdd7dde1ca8ba7df0be",
  "targetOwner": "docs/platform/claude-plugin/spec.md",
  "targetAnchor": "data-dictionary",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
  "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
  "targetUnitDigest": "80aad4984704cb2169f9b47f19b917eb49396d225f5ba07cd499b7ce6c68e015",
  "targetAncestry": [
    "Spec: fgOS Plugin (Claude Code slash-command surface)"
  ]
}
```

### After decision

```json
{
  "claimId": "claim_74a311a5ab882fe8ee4806125167e2d4",
  "sourceUnitDigest": "5f7bbc0ccb0a688217a410356a618559820b7dfd24315cdd7dde1ca8ba7df0be",
  "targetOwner": "docs/platform/claude-plugin/spec.md",
  "targetAnchor": "data-dictionary",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
  "rationale": "The complete Data Dictionary section replaces the legacy section with the corrected Work item id sentence: id is optional for pick/graph, check is not a shipped skill, and behavior when id is unspecified follows the corrected row. The section therefore differs from its source and is supersede, consistent with the corrected sibling units; its whole current section is bound by digest and ancestry.",
  "targetUnitDigest": "80aad4984704cb2169f9b47f19b917eb49396d225f5ba07cd499b7ce6c68e015",
  "targetAncestry": [
    "Spec: fgOS Plugin (Claude Code slash-command surface)"
  ]
}
```

### Source unit

Current committed source at the content pin.

```text
## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Work item id | The identifier of the item a command acts on or reports on | free text, must match an existing item for verbs that require one | required for `move`/`return`/`ask`/`answer`/`rollup`; optional for `pick`/`check`/`graph` | — (no default; an optional id omitted means "every item" for `check`, "the frontier head" for `pick`, "full metrics" for `graph`) |
| 2 | Target status | The status `move` transitions a work item to | any status in the item's lifecycle (owned by Work-State) | yes, for `move` | — |
| 3 | Question text | The question attached when parking an item | free text | yes, for `ask` | — |
| 4 | Answer text | The answer recorded to resume a parked item | free text | yes, for `answer` | — |
| 5 | Free-text description | The plain-language input a new item is intaken from | free text | yes, for `submit` | — |
```

### Before target unit

`docs/platform/claude-plugin/spec.md#data-dictionary`

```text
## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Work item id | The identifier of the item a command acts on or reports on | free text, must match an existing item for verbs that require one | required for `move`/`return`/`ask`/`answer`/`rollup`; optional for `pick`/`graph`; `check` has no shipped plugin skill | — (no default; an optional id omitted means "the frontier head" for `pick`, "full metrics" for `graph`; the legacy `check` description does not define a shipped skill) |
| 2 | Target status | The status `move` transitions a work item to | any status in the item's lifecycle (owned by Work-State) | yes, for `move` | — |
| 3 | Question text | The question attached when parking an item | free text | yes, for `ask` | — |
| 4 | Answer text | The answer recorded to resume a parked item | free text | yes, for `answer` | — |
| 5 | Free-text description | The plain-language input a new item is intaken from | free text | yes, for `submit` | — |
```

### After target unit

`docs/platform/claude-plugin/spec.md#data-dictionary`
Ancestry: ["Spec: fgOS Plugin (Claude Code slash-command surface)"]

```text
## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|---------|---------|--------|----------|---------|
| 1 | Work item id | The identifier of the item a command acts on or reports on | free text, must match an existing item for verbs that require one | required for `move`/`return`/`ask`/`answer`/`rollup`; optional for `pick`/`graph`; `check` has no shipped plugin skill | — (no default; an optional id omitted means "the frontier head" for `pick`, "full metrics" for `graph`; the legacy `check` description does not define a shipped skill) |
| 2 | Target status | The status `move` transitions a work item to | any status in the item's lifecycle (owned by Work-State) | yes, for `move` | — |
| 3 | Question text | The question attached when parking an item | free text | yes, for `ask` | — |
| 4 | Answer text | The answer recorded to resume a parked item | free text | yes, for `answer` | — |
| 5 | Free-text description | The plain-language input a new item is intaken from | free text | yes, for `submit` | — |
```

## 4. claim_c4c6b55686b7e315f34ae005173b79db — section (a)

Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s8-claude-plugin-01.json`.
Source: `docs/specs/fgos-plugin.md#actors-access`

Source digest: `4be8acef415d77200e8b8bef2f2f78665c99cf7882f2395a2597c5b9b99c8f01`
Before target digest: `b1405975f4c717c854a7bb988a6af790be278401ffa1d415b2a24ec69c442c50`
After target digest: `b1405975f4c717c854a7bb988a6af790be278401ffa1d415b2a24ec69c442c50`

Prior finding (verbatim):

deep: the heading section differs from the source by the corrected capability-table row (diff read, only that row; check not shipped, true) yet disposition stays move; same defect as row 25 and as the earlier claim_511605d3 rework; set supersede with the corrected row named, rebind. Target b1405975 recomputes, anchor ok, pending, no approval fields

### Before decision

```json
{
  "claimId": "claim_c4c6b55686b7e315f34ae005173b79db",
  "sourceUnitDigest": "4be8acef415d77200e8b8bef2f2f78665c99cf7882f2395a2597c5b9b99c8f01",
  "targetOwner": "docs/platform/claude-plugin/spec.md",
  "targetAnchor": "actors-access",
  "claimKind": "specification",
  "disposition": "move",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
  "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
  "targetUnitDigest": "b1405975f4c717c854a7bb988a6af790be278401ffa1d415b2a24ec69c442c50",
  "targetAncestry": [
    "Spec: fgOS Plugin (Claude Code slash-command surface)"
  ]
}
```

### After decision

```json
{
  "claimId": "claim_c4c6b55686b7e315f34ae005173b79db",
  "sourceUnitDigest": "4be8acef415d77200e8b8bef2f2f78665c99cf7882f2395a2597c5b9b99c8f01",
  "targetOwner": "docs/platform/claude-plugin/spec.md",
  "targetAnchor": "actors-access",
  "claimKind": "specification",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
  "rationale": "The complete Actors & Access section replaces the legacy section with the corrected capability row: check is not a shipped skill. The corrected sentence makes the whole section differ from its source, so supersede matches the corrected sibling units; the full section is retained and bound by digest and ancestry.",
  "targetUnitDigest": "b1405975f4c717c854a7bb988a6af790be278401ffa1d415b2a24ec69c442c50",
  "targetAncestry": [
    "Spec: fgOS Plugin (Claude Code slash-command surface)"
  ]
}
```

### Source unit

Current committed source at the content pin.

```text
## Actors & Access

| Capability | Person in a Claude Code session |
|---|---|
| Submit / pick / move / return / ask / answer (mutating verbs) | ✓ |
| Read frontier / staleness / rollup / check / graph / conflicts | ✓ |

Every command runs as whatever role the underlying tool itself assigns (a
human role for the mutating verbs) — the plugin layer introduces no separate
role model of its own.
```

### Before target unit

`docs/platform/claude-plugin/spec.md#actors-access`

```text
## Actors & Access

| Capability | Person in a Claude Code session |
|---|---|
| Submit / pick / move / return / ask / answer (mutating verbs) | ✓ |
| Read frontier / staleness / rollup / graph / conflicts (`check` has no shipped skill) | ✓ |

Every command runs as whatever role the underlying tool itself assigns (a
human role for the mutating verbs) — the plugin layer introduces no separate
role model of its own.
```

### After target unit

`docs/platform/claude-plugin/spec.md#actors-access`
Ancestry: ["Spec: fgOS Plugin (Claude Code slash-command surface)"]

```text
## Actors & Access

| Capability | Person in a Claude Code session |
|---|---|
| Submit / pick / move / return / ask / answer (mutating verbs) | ✓ |
| Read frontier / staleness / rollup / graph / conflicts (`check` has no shipped skill) | ✓ |

Every command runs as whatever role the underlying tool itself assigns (a
human role for the mutating verbs) — the plugin layer introduces no separate
role model of its own.
```

## 5. claim_15a24dbb1f2d0470f04cdf8900da67a0 — section (b)

Shard: `plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json`.
Source: `docs/specs/work-state.md#unheaded-block-69`

Source digest: `2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9`
Before target digest: `2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9`
After target digest: `2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9`

Prior finding (verbatim):

deep: sampled; legacy block 69 byte-equal to carrier block 27 (cursor pagination, 2196 bytes), digests and shift 26 to 27 verified; but disposition change; the reviewed decision was merge with its own rationale, now silently supersede with only the generic rebind rationale; restore merge and its rationale (re-point anchor and digest only) or state why supersede is right; siblings 41 to 44 keep merge

### Before decision

```json
{
  "claimId": "claim_15a24dbb1f2d0470f04cdf8900da67a0",
  "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
  "sourceUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-27",
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
  "targetUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
  "targetAncestry": [
    "CLI I/O Contract",
    "6. Cursor Pagination"
  ]
}
```

### After decision

```json
{
  "claimId": "claim_15a24dbb1f2d0470f04cdf8900da67a0",
  "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
  "sourceUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-27",
  "claimKind": "contract",
  "disposition": "merge",
  "reviewStatus": "pending",
  "rationale": "Cursor pagination superset (adds permanent list --all --json exception and side-log narrowing) is carried verbatim; the io-contract short text follows it in the same section, so both sources are present.",
  "targetUnitDigest": "2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9",
  "targetAncestry": [
    "CLI I/O Contract",
    "6. Cursor Pagination"
  ]
}
```

### Source unit

Current committed source at the content pin.

```text
**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.
```

### Before target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-27`

```text
**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.
```

### After target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-27`
Ancestry: ["CLI I/O Contract","6. Cursor Pagination"]

```text
**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.
```

## 6. claim_5dcb56608e17caeb53c197186ae33827 — section (b)

Shard: `plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json`.
Source: `docs/specs/work-state.md#unheaded-block-70`

Source digest: `3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62`
Before target digest: `3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62`
After target digest: `3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62`

Prior finding (verbatim):

mechanical: digests, anchor and byte equality pass (legacy block 70 3964ac13 equals carrier block 36, shift 35 to 36); but disposition change found by comparing the decision with its reviewed form; the reviewed decision was merge with its own rationale, now silently supersede with only the generic rebind rationale; restore merge and its rationale (re-point anchor and digest only) or state why supersede is right; the reviewed rationale says both sources state the csv/json-array rule, a merge fact

### Before decision

```json
{
  "claimId": "claim_5dcb56608e17caeb53c197186ae33827",
  "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
  "sourceUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-36",
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
  "targetUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
  "targetAncestry": [
    "CLI I/O Contract",
    "8. Multi-Value Flag Convention"
  ]
}
```

### After decision

```json
{
  "claimId": "claim_5dcb56608e17caeb53c197186ae33827",
  "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
  "sourceUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-36",
  "claimKind": "contract",
  "disposition": "merge",
  "reviewStatus": "pending",
  "rationale": "csv versus json-array multiValueFormat rule is stated in both sources; candidate carries both texts under the H2 8. A31 upstream merge conservation: the exact current source and candidate successor are shown. This is a pending re-carry/rebinding, with no prior approval carry and no code-truth certification.",
  "targetUnitDigest": "3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62",
  "targetAncestry": [
    "CLI I/O Contract",
    "8. Multi-Value Flag Convention"
  ]
}
```

### Source unit

Current committed source at the content pin.

```text
**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.
```

### Before target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-36`

```text
**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.
```

### After target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-36`
Ancestry: ["CLI I/O Contract","8. Multi-Value Flag Convention"]

```text
**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.
```

## 7. claim_6fe86521fead9cec7253443e3275a3cf — section (b)

Shard: `plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json`.
Source: `docs/specs/work-state.md#unheaded-block-73`

Source digest: `a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798`
Before target digest: `a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798`
After target digest: `a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798`

Prior finding (verbatim):

deep: sampled; legacy block 73 byte-equal to carrier block 40 (help Runs-when bullets); shift 39 to 40 verified; but disposition change; the reviewed decision was promote with its own rationale, now silently supersede with only the generic rebind rationale; restore promote and its rationale (re-point anchor and digest only) or state why supersede is right

### Before decision

```json
{
  "claimId": "claim_6fe86521fead9cec7253443e3275a3cf",
  "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
  "sourceUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-40",
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
  "targetUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
  "targetAncestry": [
    "CLI I/O Contract",
    "9. Per-Verb Help"
  ]
}
```

### After decision

```json
{
  "claimId": "claim_6fe86521fead9cec7253443e3275a3cf",
  "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
  "sourceUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-40",
  "claimKind": "contract",
  "disposition": "promote",
  "reviewStatus": "pending",
  "rationale": "Runs-when / Blocked-when bullets of per-verb help are carried verbatim; kept as contract since it is a CLI surface guarantee. A31 upstream merge conservation: the exact current source and candidate successor are shown. This is a pending re-carry/rebinding, with no prior approval carry and no code-truth certification.",
  "targetUnitDigest": "a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798",
  "targetAncestry": [
    "CLI I/O Contract",
    "9. Per-Verb Help"
  ]
}
```

### Source unit

Current committed source at the content pin.

```text
- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).
```

### Before target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-40`

```text
- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).
```

### After target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-40`
Ancestry: ["CLI I/O Contract","9. Per-Verb Help"]

```text
- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).
```

## 8. claim_9959e82e2874baeb627a8441faa07e9a — section (b)

Shard: `plans/260925-documentation-authority-unification/pilot/decisions/b-data-dictionary.json`.
Source: `docs/specs/work-state.md#unheaded-block-66`

Source digest: `a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04`
Before target digest: `878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe`
After target digest: `878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe`

Prior finding (verbatim):

deep: gap row, old digest a2e6a5ff found at 2636ba229 block 66, successor block 30 878d708d correct and unchanged, but disposition change; the reviewed decision was merge with its own rationale, now silently supersede with only the generic rebind rationale; restore merge and its rationale (re-point anchor and digest only) or state why supersede is right (supersede does match the other gap rows, so a one-line reason is enough)

### Before decision

```json
{
  "claimId": "claim_9959e82e2874baeb627a8441faa07e9a",
  "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
  "sourceUnitDigest": "a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-30",
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "unheaded-block-66",
  "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Manifest Shape"
  ]
}
```

### After decision

```json
{
  "claimId": "claim_9959e82e2874baeb627a8441faa07e9a",
  "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
  "sourceUnitDigest": "a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-30",
  "claimKind": "contract",
  "disposition": "merge",
  "reviewStatus": "pending",
  "rationale": "Manifest fields are combined from work-state and io-contract in the single Manifest Shape section; the work-state contribution includes the positional-parameter rule. The source schema_version 2.0 sentence is represented by the corrected schema_version 3.0 successor, with the complete fields carried. The reviewed merge disposition is restored: vocabulary merge combines multiple sources and does not require byte equality. The anchor shift changes no target text in this turn.",
  "sourcePath": "docs/specs/work-state.md",
  "sourceAnchor": "unheaded-block-66",
  "targetUnitDigest": "878d708db7a0afb3e23a0829f98be122c83ac562946b51ab1989e73e5e4a8bfe",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Manifest Shape"
  ]
}
```

### Source unit

Historical witness: `977509d5f8c49a31c781b54ea53c2b3617f70a13:docs/specs/work-state.md#unheaded-block-66`; exact source digest matched.

```text
CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'2.0'`, per str46-io-contract — tăng từ `'1.0'` vì một trường bị xoá,
xem ngay dưới), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).
```

### Before target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-30`

```text
CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào
`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị
xoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).
```

### After target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-30`
Ancestry: ["CLI I/O Contract","7. Machine-Readable Verb Registry","Manifest Shape"]

```text
CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'3.0'` — tăng từ `'2.0'` khi cờ của verb có sub-verb dời vào
`subcommands`, xem ngay dưới; `'2.0'` từng tăng từ `'1.0'` vì một trường bị
xoá, per str46-io-contract), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).
```

## 9. claim_19495d2772ced1aa1af4b20d4640fa3a — section (b)

Shard: `plans/260925-documentation-authority-unification/pilot/decisions/b-io-contract.json`.
Source: `docs/io-contract.md#unheaded-block-18`

Source digest: `83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca`
Before target digest: `51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23`
After target digest: `51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23`

Prior finding (verbatim):

deep: gap row, old digest 83773dda found at 3ea75475d block 18, successor block 32 51dd3c8a correct and unchanged, but disposition change; the reviewed decision was merge with its own rationale, now silently supersede with only the generic rebind rationale; restore merge and its rationale (re-point anchor and digest only) or state why supersede is right (supersede does match the other gap rows, so a one-line reason is enough)

### Before decision

```json
{
  "claimId": "claim_19495d2772ced1aa1af4b20d4640fa3a",
  "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-32",
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "rationale": "A22 actual working target digest/anchor rebound. Full original/current units and decisions in reports/phase-06/step8-final-rework-accounting.json. Pending independent bounded review; no approval carry, source edit, promotion or cutover.",
  "authoredBy": "codex-session:unit-run-1792052396770-6f1c5957@2026-10-15",
  "sourcePath": "docs/io-contract.md",
  "sourceAnchor": "unheaded-block-18",
  "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Manifest Shape"
  ]
}
```

### After decision

```json
{
  "claimId": "claim_19495d2772ced1aa1af4b20d4640fa3a",
  "sourceUnitDigest": "83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-32",
  "claimKind": "contract",
  "disposition": "merge",
  "reviewStatus": "pending",
  "rationale": "The fgos --help --json manifest contract is combined with the work-state manifest contribution under Manifest Shape. Its schema_version 2.0 source wording is represented by the corrected schema_version 3.0 successor, including commands and per-verb entries; work-state adds the positional-parameter rule. The reviewed merge disposition is restored: vocabulary merge combines multiple sources and does not require byte equality. The anchor shift changes no target text in this turn.",
  "authoredBy": "codex-session:unit-run-1792056203419-9b5bd055@2026-10-15",
  "sourcePath": "docs/io-contract.md",
  "sourceAnchor": "unheaded-block-18",
  "targetUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Manifest Shape"
  ]
}
```

### Source unit

Historical witness: `977509d5f8c49a31c781b54ea53c2b3617f70a13:docs/io-contract.md#unheaded-block-18`; exact source digest matched.

```text
`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
vì trường `access` bị xoá). Mỗi mục verb mang:
```

### Before target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`

```text
`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`
khi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ
`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả
riêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một
phần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không
bao giờ chạy verb. Mỗi mục verb mang:
```

### After target unit

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`
Ancestry: ["CLI I/O Contract","7. Machine-Readable Verb Registry","Manifest Shape"]

```text
`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`
khi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ
`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả
riêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một
phần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không
bao giờ chạy verb. Mỗi mục verb mang:
```

## Verification and closure boundary

See [D/E verification](step8-nine-rework-verification.json). Reuse the registry synced at request 0068ed498; no native sync, no docs edits, no approval carry. Step 8 and main-merge accounting remain open until all nine verdicts are independently accepted and applied: two section (a) rows and seven section (b) rows. Step 9 is next after that closure. Runner RUL98/99/100 remain deferred to Step 9.

The unrelated pre-existing host-invocation claim_9c0e5bb6 stale target digest is recorded in the owner queue for the Step 10 link pass; it is outside these nine rows and is not rebound or approved here. Full truth at promotion, Rings holds, A34 residuals, token checkpoint, fresh-reader/isolation limits and navigation/consumer/alias/cutover obligations remain.
