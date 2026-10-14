# Root authorities: effect-axis conservation and first-subset A28 list

Author session: codex-session:17@2026-10-14
Content commit: c8b2d948d6dd0b408011b294fd67aea59870749b
Rows: 66 (2 source, 4 gap, 1 stable heading, 59 A28 candidate units).

## claim_ce947d10ed900598bde4df5b552e0265

Entry kind: source row; pending ordinary conservation review.

````json
{
  "claimId": "claim_ce947d10ed900598bde4df5b552e0265",
  "authoredBy": "codex-session:1@2026-10-09",
  "sourceUnitDigest": "c219ee825c3475e6",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-31",
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "rationale": "Code is truth for both effect axes and the whole source field definition. Owner A15 resolves SC-1: the stale exclusive only-review-and-approve assertion is superseded by the current registry contract and a run example, not coordination. Actual --help --json exposes 15 externalEffect verbs including run and no coordination verb. The candidate preserves the source field definitions and corrects its obsolete enumeration; independent review of this changed binding is pending.",
  "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ]
}
````

Source: `docs/specs/work-state.md#unheaded-block-67`

Source unit digest: `c219ee825c3475e61bb642fd89e50efedc586df24b0252a6d99e58df63f419d8`

Shown source SHA256: `c219ee825c3475e61bb642fd89e50efedc586df24b0252a6d99e58df63f419d8`

````text
**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — hôm nay chỉ `review` và
`approve` mang `externalEffect: true`, đúng chế độ `--github` của chúng;
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).
````

Target: `docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31`

Target unit digest: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`

Shown target SHA256: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`

````text
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
````

````diff
--- docs/specs/work-state.md
+++ docs/platform/work-state/contracts/cli-io-contract.md
@@ -4,8 +4,7 @@
 PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
 fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
 (verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
-có bao giờ gọi một dịch vụ ngoài fgOS hay không — hôm nay chỉ `review` và
-`approve` mang `externalEffect: true`, đúng chế độ `--github` của chúng;
+có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
 `review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
 cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
 phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
````

## claim_e2377849e4ba8e3d3beaf70880e4ed23

Entry kind: source row; pending ordinary conservation review.

````json
{
  "claimId": "claim_e2377849e4ba8e3d3beaf70880e4ed23",
  "sourceUnitDigest": "39e4ab1f30a6acc9",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-32",
  "claimKind": "contract",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "rationale": "Code is truth for the whole effect-axis field list. Owner A15 resolves SC-1: replace the retired coordination example with run, preserving every other entry-field definition and qualifier. The actual current machine-readable manifest has 15 externalEffect verbs including run and no coordination verb; both candidate examples now agree. This corrected whole-unit carry supersedes the stale source example, not a claim of verbatim copying or a silent partial carry. Independent review is pending.",
  "authoredBy": "codex-session:1@2026-10-09",
  "targetUnitDigest": "e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ]
}
````

Source: `docs/io-contract.md#unheaded-block-19`

Source unit digest: `39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c`

Shown source SHA256: `39e4ab1f30a6acc99de534a9fd16bd348b9ef8c1827664c0a7a50487f0587c0c`

````text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
````

Target: `docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`

Target unit digest: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`

Shown target SHA256: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`

````text
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
````

````diff
--- docs/io-contract.md
+++ docs/platform/work-state/contracts/cli-io-contract.md
@@ -5,7 +5,8 @@
   **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
   độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
   sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
-  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
-  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
-  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).
+  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest
+  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có
+  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật
+  tính là effect ngoài `.fgos/`).
 - `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
````

## claim_4a023fa2faa879fb0e1dfd8bc5c051e7

Entry kind: native registry gap; pending ordinary supersede review.

````json
{
  "claimId": "claim_4a023fa2faa879fb0e1dfd8bc5c051e7",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ],
  "authoredBy": "codex-session:17@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31 at 9881f8622 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry."
}
````

Immutable source commit: `9881f8622732e3ba7c8e203097d42674b8aba36d`

Source unit digest: `857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f`

Shown source SHA256: `857ad2167a0283ad4b9f08a4493f324f899b84211e10234b9d0eddfb9683c63f`

````text
**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).
````

Current native successor: `claim_f87ba30b5de56939a7fa614030efce48`

Target unit digest: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`

Shown target SHA256: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`

````text
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
````

````diff
--- 9881f8622732e3ba7c8e203097d42674b8aba36d
+++ c8b2d948d6dd0b408011b294fd67aea59870749b
@@ -4,7 +4,7 @@
 PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
 fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
 (verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
-có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (dispatch executor thật tính là effect ngoài `.fgos/`);
+có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
 `review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
 cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
 phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
````

## claim_7333c439fa8d29886b82168e015ca113

Entry kind: native registry gap; pending ordinary supersede review.

````json
{
  "claimId": "claim_7333c439fa8d29886b82168e015ca113",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-31",
  "targetUnitDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ],
  "authoredBy": "codex-session:17@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31 at 01fe216b4 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry."
}
````

Immutable source commit: `01fe216b469626feaa2340ea702a85d9a84e8ac0`

Source unit digest: `97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2`

Shown source SHA256: `97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2`

````text
**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — xem `fgos --help --json` cho danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).
````

Current native successor: `claim_f87ba30b5de56939a7fa614030efce48`

Target unit digest: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`

Shown target SHA256: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`

````text
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
````

````diff
--- 01fe216b469626feaa2340ea702a85d9a84e8ac0
+++ c8b2d948d6dd0b408011b294fd67aea59870749b
@@ -4,7 +4,7 @@
 PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
 fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
 (verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
-có bao giờ gọi một dịch vụ ngoài fgOS hay không — xem `fgos --help --json` cho danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
+có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
 `review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
 cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
 phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
````

## claim_665eb7f4bfb9bee7ba3f5e58368eaba1

Entry kind: native registry gap; pending ordinary supersede review.

````json
{
  "claimId": "claim_665eb7f4bfb9bee7ba3f5e58368eaba1",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ],
  "authoredBy": "codex-session:17@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 at 01fe216b4 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry."
}
````

Immutable source commit: `01fe216b469626feaa2340ea702a85d9a84e8ac0`

Source unit digest: `ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796`

Shown source SHA256: `ba9c9d6e641e3049b46d0596077eabd74593dd83e12391cd7336986f7733d796`

````text
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
````

Current native successor: `claim_0abb403f0f4bb4bb6b916849e4895d65`

Target unit digest: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`

Shown target SHA256: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`

````text
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
````

````diff
--- 01fe216b469626feaa2340ea702a85d9a84e8ac0
+++ c8b2d948d6dd0b408011b294fd67aea59870749b
@@ -5,7 +5,8 @@
   **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
   độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
   sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
-  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
-  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
-  `run` — dispatch executor thật tính là effect ngoài `.fgos/`).
+  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest
+  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có
+  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật
+  tính là effect ngoài `.fgos/`).
 - `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
````

## claim_e597b776163803dcf6e4194962ea4f6e

Entry kind: native registry gap; pending ordinary supersede review.

````json
{
  "claimId": "claim_e597b776163803dcf6e4194962ea4f6e",
  "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
  "sourceUnitDigest": "5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3",
  "disposition": "supersede",
  "targetOwner": "docs/platform/work-state/contracts/cli-io-contract.md",
  "targetAnchor": "unheaded-block-32",
  "targetUnitDigest": "e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1",
  "targetAncestry": [
    "CLI I/O Contract",
    "7. Machine-Readable Verb Registry",
    "Entry Fields And Effect Axes"
  ],
  "authoredBy": "codex-session:17@2026-10-14",
  "reviewStatus": "pending",
  "rationale": "The native predecessor docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32 at 9881f8622 is superseded by the complete same-file effect-axis unit. It preserves the field definitions, review/--github rationale where present, every list item and the external dispatch qualifier, adds explicit COMMAND_REGISTRY/15/no-coordination manifest wording, and keeps the valid review/approve/run examples. Whole source and target are shown; no identity graft or approval carry."
}
````

Immutable source commit: `9881f8622732e3ba7c8e203097d42674b8aba36d`

Source unit digest: `5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3`

Shown source SHA256: `5bed5c61440ab7ef0a9c595d18e3485c47c1952c78cbd07a0ea354db8ad750c3`

````text
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
````

Current native successor: `claim_0abb403f0f4bb4bb6b916849e4895d65`

Target unit digest: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`

Shown target SHA256: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`

````text
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
````

````diff
--- 9881f8622732e3ba7c8e203097d42674b8aba36d
+++ c8b2d948d6dd0b408011b294fd67aea59870749b
@@ -7,5 +7,6 @@
   sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
   bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest
   `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có
-  `coordination` (dispatch executor thật tính là effect ngoài `.fgos/`).
+  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật
+  tính là effect ngoài `.fgos/`).
 - `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
````

## claim_3498d50ccefcfce93481393dcec13370

Entry kind: one native stable-heading binding; review conservation accounting, no guessed ID or source decision.

````json
{
  "claimId": "claim_3498d50ccefcfce93481393dcec13370",
  "beforeIdentity": {
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "7427940de17bc13776d4a087e4df1fe55bb9c9b8a19bcc9ecabfe66125f60d0d",
    "identityFingerprint": "745122ae9e05e3268851d1a79dd241a0711ac2b040e5b2d384cb6c89d66bf5af",
    "claimId": "claim_3498d50ccefcfce93481393dcec13370",
    "sourceAnchor": "entry-fields-and-effect-axes",
    "unitKind": "heading",
    "sourceUnitDigest": "e30e6dc5a60e3ccfaec2103922569eb11fed7cc7df9961e70b595854ef81c29e",
    "claimKind": "contract",
    "status": "future"
  },
  "currentIdentity": {
    "sourcePath": "docs/platform/work-state/contracts/cli-io-contract.md",
    "unitDigest": "5fd40fd49eec27b854cb3d3504ac09f27d5ecd036bcd8a761bcb47dd0edfeb39",
    "identityFingerprint": "d4bb8134eb40163a9ee29f99230f8be28426dfc902144858b0e8ed27db0e9f17",
    "claimId": "claim_3498d50ccefcfce93481393dcec13370",
    "sourceAnchor": "entry-fields-and-effect-axes",
    "unitKind": "heading",
    "sourceUnitDigest": "a7e0489cd2409eb4b835d3368b5d642409d0183530639510033cb4c2ea70d6df",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "9881f8622732e3ba7c8e203097d42674b8aba36d",
      "fromUnitDigest": "01760e131102d397ba77a1fdf99eea046e809b96d18163950071234ec4389e41",
      "toUnitDigest": "5fd40fd49eec27b854cb3d3504ac09f27d5ecd036bcd8a761bcb47dd0edfeb39",
      "fromSourceUnitDigest": "fb9f481077a3b0918f66e7eccf9afaaf2b9326c0824727c376508464ff32b1c4",
      "toSourceUnitDigest": "a7e0489cd2409eb4b835d3368b5d642409d0183530639510033cb4c2ea70d6df"
    }
  },
  "beforeUnit": {
    "unitKind": "heading",
    "level": 3,
    "title": "Entry Fields And Effect Axes",
    "anchor": "entry-fields-and-effect-axes",
    "githubAnchor": "entry-fields-and-effect-axes",
    "stableAnchor": "h-c11e92a7ce10",
    "startLine": 267,
    "endLine": 267,
    "textDigest": "e30e6dc5a60e3ccfaec2103922569eb11fed7cc7df9961e70b595854ef81c29e",
    "sample": "Entry Fields And Effect Axes",
    "sectionPayloadDigest": "e6cc65918fec7e105533342c54811a8925fb8700da506fc90dbbde9dccf7c4c5",
    "followingBlockDigest": "97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2",
    "identityFingerprint": "745122ae9e05e3268851d1a79dd241a0711ac2b040e5b2d384cb6c89d66bf5af",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry"
    ],
    "text": "### Entry Fields And Effect Axes",
    "sectionText": "### Entry Fields And Effect Axes\n\n**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — xem `fgos --help --json` cho danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38).\n\n- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho\n  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,\n  `run` — dispatch executor thật tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n\nCả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38."
  },
  "currentUnit": {
    "unitKind": "heading",
    "level": 3,
    "title": "Entry Fields And Effect Axes",
    "anchor": "entry-fields-and-effect-axes",
    "githubAnchor": "entry-fields-and-effect-axes",
    "stableAnchor": "h-c11e92a7ce10",
    "startLine": 267,
    "endLine": 267,
    "textDigest": "a7e0489cd2409eb4b835d3368b5d642409d0183530639510033cb4c2ea70d6df",
    "sample": "Entry Fields And Effect Axes",
    "sectionPayloadDigest": "4168b8aa195f3f466631d4d6780cdfa462f4faddb7a708f62119475262aa969a",
    "followingBlockDigest": "0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2",
    "identityFingerprint": "d4bb8134eb40163a9ee29f99230f8be28426dfc902144858b0e8ed27db0e9f17",
    "ancestry": [
      "CLI I/O Contract",
      "7. Machine-Readable Verb Registry"
    ],
    "text": "### Entry Fields And Effect Axes",
    "sectionText": "### Entry Fields And Effect Axes\n\n**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`\nđơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —\nlộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một\nPR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái\nfgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`\n(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb\ncó bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);\n`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể\ncả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều\nphối hay xác danh; cổng \"ai được nói verb nào\" vẫn là việc riêng sau này\n(backlog STR38).\n\n- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest\n  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có\n  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật\n  tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n\nCả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38."
  },
  "reviewStatus": "pending-native-heading-binding",
  "authoredBy": "codex-session:17@2026-10-14"
}
````

Before unit digest: `e30e6dc5a60e3ccfaec2103922569eb11fed7cc7df9961e70b595854ef81c29e`

Before shown SHA256: `8c6ec8f320729761ab167702a76cac81a6a553efd7326652ef176a97b5d7ba60`

````text
### Entry Fields And Effect Axes

**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — xem `fgos --help --json` cho danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).

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

Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
````

Current unit digest: `a7e0489cd2409eb4b835d3368b5d642409d0183530639510033cb4c2ea70d6df`

Current shown SHA256: `716322c6fa0b77181fec544c0f6c0c191860741374d7ec21c8689fab0682b9ce`

````text
### Entry Fields And Effect Axes

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

Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
````

## claim_b00f373a151549ef51503fc29e8abd12

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_b00f373a151549ef51503fc29e8abd12",
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "1bdf22f366a423941250211f62e5003e55ddb5430a2b6578a2faa9f6c5b027cd",
  "fileStatus": {
    "kind": "governance",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "1bdf22f366a423941250211f62e5003e55ddb5430a2b6578a2faa9f6c5b027cd"
}
````

````text
```txt
Document type: Governance
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve the root documentation-governance contract as candidate material
Design status: Candidate
Implementation: Partial; conservation review pending, current truth unverified
Provenance: docs/doc-governance.md at d900d6151c58114cd9d0f8ef519f91daa8b4ded5
Writer type: Agent draft writer
Canonical: No
Canonical for: Candidate documentation-governance contract; no authority cutover
Use this when: Reviewing conservation of the root documentation-governance source
Do not use this for: Replacing the current legacy governance authority or certifying implementation
Last reviewed: 2026-10-14
Related:
- docs/doc-governance.md
- docs/reading-map.md
- docs/platform/README.md
Supersedes: None; candidate only
Superseded by: None
```
````

## claim_a03a3935d0797de1bd966c9545404124

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_a03a3935d0797de1bd966c9545404124",
  "path": "docs/platform/governance.md",
  "anchor": "source-metadata-added-in-candidate",
  "unitDigest": "8076f3682a1289b266fd074de6eb1ee7842c5905fe9674771792c8d9a53f42a4",
  "fileStatus": {
    "kind": "governance",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "13fb9178500e4b266909f53b6d16acb9b4f44d2479d5e4033f3af40c334f044f"
}
````

````text
## Source Metadata (Added in candidate)

Added in candidate: retain the complete original source header as historical provenance; its accepted status describes the source, not this candidate.

```txt
Document type: Governance
Audience: Human reviewer, architect, maintainer, agent
Purpose: Define fgOS documentation types, authority, lifecycle, provenance, and placement
Design status: Accepted
Implementation: Partial
Provenance: Promoted from `docs/architect/documentation-system-design.md`
Writer type: Human + agent coauthor
Canonical for: fgOS documentation governance
Use this when: Creating, reviewing, moving, or promoting maintained documentation
Do not use this for: Current product behavior or implementation detail
Last reviewed: 2026-09-25
Related:
- `docs/reading-map.md`
- `docs/transitional-switchboard.md`
- `docs/platform/migration-authoring-rules.md`
- `docs/platform/README.md`
- `docs/architect/documentation-system-design.md`
```
````

## claim_12ab602ab6c592378aa624abfd2fd943

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_12ab602ab6c592378aa624abfd2fd943",
  "path": "docs/platform/governance.md",
  "anchor": "unheaded-block-61",
  "unitDigest": "59d4e62bd8b88fb77ea3f20660a18f58df4aca5b5d6c3c6f38a15ae6f48755a4",
  "fileStatus": {
    "kind": "governance",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "59d4e62bd8b88fb77ea3f20660a18f58df4aca5b5d6c3c6f38a15ae6f48755a4"
}
````

````text
Added in candidate: retain the complete original source header as historical provenance; its accepted status describes the source, not this candidate.
````

## claim_fe092189b623cca65c6aa3b2f86ee225

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_fe092189b623cca65c6aa3b2f86ee225",
  "path": "docs/platform/work-state/architecture/implementation-pointers.md",
  "anchor": "work-state-implementation-pointers",
  "unitDigest": "cb275b793cfe6299aaa442b4021cce113f2dfeb62fee2397f0680acdcb9b56d8",
  "fileStatus": {
    "kind": "architecture",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "d064a90755c5352fc4affd4662c97742ef9a499571e8a39c66e0388ad6292dea"
}
````

````text
# Work State Implementation Pointers

```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Module-to-responsibility pointers for the work state engine implementation.
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/specs/work-state.md
```
````

## claim_178bb22fcc32ae881dd170c17e2cb2ad

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_178bb22fcc32ae881dd170c17e2cb2ad",
  "path": "docs/platform/work-state/architecture/implementation-pointers.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "d357d4a5224eaffb265d2bcf57b79347b4d4a7ef3ca5c998d31da3cc9f1d3d5b",
  "fileStatus": {
    "kind": "architecture",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "d357d4a5224eaffb265d2bcf57b79347b4d4a7ef3ca5c998d31da3cc9f1d3d5b"
}
````

````text
```txt
Document type: Architecture
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Module-to-responsibility pointers for the work state engine implementation.
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/specs/work-state.md
```
````

## claim_ae1f79478cc3028c10094861b3ca9203

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_ae1f79478cc3028c10094861b3ca9203",
  "path": "docs/platform/work-state/architecture/implementation-pointers.md",
  "anchor": "1-purpose-and-scope",
  "unitDigest": "114d842f28715694851c5df891c32b0f8d524b913fbac3111d80abe5434178c6",
  "fileStatus": {
    "kind": "architecture",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "e1b073dec637ec79d85401271f3aafc20380c671fbe15117142617fb156bc450"
}
````

````text
## 1. Purpose And Scope

This document lists which implementation module owns which responsibility of the work state area.
````

## claim_0e63fab01f4b08d4713d57dfee60f724

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_0e63fab01f4b08d4713d57dfee60f724",
  "path": "docs/platform/work-state/architecture/implementation-pointers.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "4e5185bf76d81997933e0c97655c3504c9913d23cecdf0f5ac282aa5f5c701c0",
  "fileStatus": {
    "kind": "architecture",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "4e5185bf76d81997933e0c97655c3504c9913d23cecdf0f5ac282aa5f5c701c0"
}
````

````text
This document lists which implementation module owns which responsibility of the work state area.
````

## claim_362afb23e9ce278b73edf068fb6018de

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_362afb23e9ce278b73edf068fb6018de",
  "path": "docs/platform/work-state/architecture/implementation-pointers.md",
  "anchor": "3-related-files",
  "unitDigest": "0ebfd1d41b3c588f1f469cc28a8884057b30812a24d5870a8a2e44600cf27385",
  "fileStatus": {
    "kind": "architecture",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "122c1e482e3aecd320c88b0cd8a3ea78174bec02b3aaf68d1c418e4f27ebddad"
}
````

````text
## 3. Related Files

- [Work state area portal](../README.md)
- [Work state spec](../spec.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
````

## claim_57e8eb7978357a8ab6cd53959e421972

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_57e8eb7978357a8ab6cd53959e421972",
  "path": "docs/platform/work-state/architecture/implementation-pointers.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "08e9731304f9e54ce01edb082f23b13ff6802af280ca8aeb62ff1d2e1a7a0627",
  "fileStatus": {
    "kind": "architecture",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "08e9731304f9e54ce01edb082f23b13ff6802af280ca8aeb62ff1d2e1a7a0627"
}
````

````text
- [Work state area portal](../README.md)
- [Work state spec](../spec.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
````

## claim_2f0b0a2f17833506438ae6f6b83eb7fd

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_2f0b0a2f17833506438ae6f6b83eb7fd",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "cli-io-contract",
  "unitDigest": "ace07b86452f1aa48efa0897defdd839191e5d66ea38aacd51db318afb0bc941",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "5b0766d639e5e2ff78dc362e6e7abcf0cebb6fd1bd872b5d81cb5dfac178699f"
}
````

````text
# CLI I/O Contract

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.
Design status: Candidate
Last reviewed: 2026-10-06
Added in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/specs/work-state.md
- docs/io-contract.md
```
````

## claim_66b020a1841dcd96a65ebd9fc32fb3cf

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_66b020a1841dcd96a65ebd9fc32fb3cf",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "0987d91c6d782d70b13bae3627e042e262c6f3b3a87dfb82997fba01aa7147fb",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "0987d91c6d782d70b13bae3627e042e262c6f3b3a87dfb82997fba01aa7147fb"
}
````

````text
```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.
Design status: Candidate
Last reviewed: 2026-10-06
Added in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/specs/work-state.md
- docs/io-contract.md
```
````

## claim_f80f69f4de87e6414f83673fa0010ba6

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_f80f69f4de87e6414f83673fa0010ba6",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "single-write-door",
  "unitDigest": "b52d9c4e6e4bb58f446010e169b1f54d25e916b993a08dc4b3c6cb513897fc4c",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "4f2ab1788afab728c89add44393da2010a321e92c909cce47a21499d3b97a9d5"
}
````

````text
### Single Write Door

Mọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`
(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.
````

## claim_32a411cc1ef34025d21bebdcc0183c3f

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_32a411cc1ef34025d21bebdcc0183c3f",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "writer-source-trust-levels",
  "unitDigest": "987e8f9f71703323f0ba7b5ca63c5dbddb7536ba1f69683e432efd4463da6890",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "11296d8d49f12fb2fe54781353afc48b95431822a3033580b482cc56ca5491a8"
}
````

````text
### Writer Source Trust Levels

| source | Ý nghĩa | Độ tin |
|---|---|---|
| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |
| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |
| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |
| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |

- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
  song), luôn có mặt.
- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
  `source` nói giá trị chưa kiểm chứng được).
````

## claim_d10f877c9fe11dbae43ffc87d62a16e3

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_d10f877c9fe11dbae43ffc87d62a16e3",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "writer-resolution-rules",
  "unitDigest": "8789fb7c71d479865e2c6f7c7ade71a6b69867ca1157db3dd424977918db061b",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "ff9b155cbbeec6170ec89e0639ef9a47dfac284fa3b39ccd4da4d87cf064634e"
}
````

````text
### Writer Resolution Rules

**Registry chỉ ĐỐI CHIẾU, không bao giờ tự cấp danh tính** (per str46-io-contract): giá trị `id` lấy từ biến môi trường luôn giữ nguyên bất
kể sổ đăng ký có khớp hay không — sổ đăng ký chỉ nâng độ tin (`source`) khi
khớp, không bao giờ đổi hay tạo ra `id`. Một dòng sổ đăng ký KHÔNG BAO GIỜ
khớp theo thư mục làm việc hay theo pid của chính dòng đó — chỉ khớp đúng
`id` với `sessionId` của dòng — vì khớp theo thư mục sẽ gộp hai phiên khác
nhau trong cùng một worktree thành một danh tính, phá đúng mục đích khoá
hoạt động cây chính (xem spec Runner "Khoá hoạt động cây chính").

Một giá trị `id` sai định dạng (ký tự lạ, quá dài) bị LOẠI ở tầng phân giải
và rơi xuống nguồn kế tiếp — KHÔNG BAO GIỜ ném lỗi, KHÔNG BAO GIỜ chặn verb
(per str46-io-contract); không có validator nào đứng trên đường ghi
`writer`. `writer` fold lên item KHÔNG ĐIỀU KIỆN, GHI ĐÈ mỗi lần (latest-wins)
— khác khuôn "cộng thêm không đè" của outcome/friction/settlement, vì đây là
danh tính của LẦN GHI GẦN NHẤT, không phải một chuỗi lịch sử cần giữ mọi lần.
Item chưa từng qua tính năng này không mang `writer` — vắng mặt hoàn toàn,
tương thích ngược (RUL11 (tiến hóa schema)). Cơ chế phân giải đầy đủ (thứ tự nguồn, khoá hoạt động cây chính dùng cùng danh tính này): spec Runner RUL49 (compound-learning đổi trục: từ stage sang status retrospective).
````

## claim_5f9a6123b5c816fb5fbcd4575a29b75c

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_5f9a6123b5c816fb5fbcd4575a29b75c",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "caller-role",
  "unitDigest": "befd4c0925c52780e0dff93c01ed25165e6ed23c6bafeba2665f172496b25420",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "38d1e05e423ee27f5ab1416fb5c65e831b27b11682d31152e52c24afd61c56d6"
}
````

````text
### Caller Role

Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`
— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ
tư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,
không do ai quyết định). `role` và `writer` tách bạch: một cái nói "ai gây
ra", một cái nói "loại gì gây ra".
````

## claim_dd9e99347fb7582d5e53002d16241ac8

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_dd9e99347fb7582d5e53002d16241ac8",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "error-path-is-not-enveloped",
  "unitDigest": "54081f4a2370577dc2292bd6f53556e29db67c332a9ce6eeff77b95afc9aca34",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "7fb9c0138371d23607a544cdc978c4ae6372ea903292d6b2a77ace056e735f86"
}
````

````text
### Error Path Is Not Enveloped

**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;
khi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi
(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,
không phải bằng việc dò nội dung phong bì.
````

## claim_80674c63716d50ad17cb1704ac8a6bef

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_80674c63716d50ad17cb1704ac8a6bef",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "runner-stdout-envelope",
  "unitDigest": "39837e8811079e85d0b925fa05a05b6cd87150e1610fbe2abb9cfa2ee854fa68",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "bee547ee1f3dda0b14c27e21f552a8d699736a787e882cc3d7b24bd8c40fd038"
}
````

````text
### Runner Stdout Envelope

**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của
mỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều
dòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo
thời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec
Runner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).

**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in
nhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`
hoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong
bì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên
đọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do.
````

## claim_ed6bec6d01e2f6c816bb3a51dc489aa4

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_ed6bec6d01e2f6c816bb3a51dc489aa4",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "recognizing-a-real-envelope",
  "unitDigest": "6a2cf1b5520ada464d6e35a8eab07b2bd7a2965d511b3cbb46ec1ec993167a81",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "9f9a90e19dfdadb982a47661a7d2a64c4ce5967250914c0b27206aae9927fd3c"
}
````

````text
### Recognizing A Real Envelope

**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm
`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd "dòng
bắt đầu bằng `{`"), vì luồng progress-trace của `fgos-runner` (xem "Ngoại
lệ có lý do" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`.
````

## claim_3eda80201a85fe5bdf13782a93cc6331

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_3eda80201a85fe5bdf13782a93cc6331",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "unheaded-block-23",
  "unitDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8"
}
````

````text
Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:
````

## claim_4217ac86de0ba075ca046202b2ce4284

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_4217ac86de0ba075ca046202b2ce4284",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "unheaded-block-24",
  "unitDigest": "4a338e4d813b275ce1c923da4f814881eaab30a4bdca231382fd7df5c5fe9b4a",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "4a338e4d813b275ce1c923da4f814881eaab30a4bdca231382fd7df5c5fe9b4a"
}
````

````text
1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.
````

## claim_9053f1edd1765577dd1bef202eff3d98

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_9053f1edd1765577dd1bef202eff3d98",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "unheaded-block-25",
  "unitDigest": "549dded9fe85b1cfd57f1ec7079141e4feb9e6468a31e93485ab91a2305e79fe",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "549dded9fe85b1cfd57f1ec7079141e4feb9e6468a31e93485ab91a2305e79fe"
}
````

````text
**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.
````

## claim_3498d50ccefcfce93481393dcec13370

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_3498d50ccefcfce93481393dcec13370",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "entry-fields-and-effect-axes",
  "unitDigest": "a7e0489cd2409eb4b835d3368b5d642409d0183530639510033cb4c2ea70d6df",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "716322c6fa0b77181fec544c0f6c0c191860741374d7ec21c8689fab0682b9ce"
}
````

````text
### Entry Fields And Effect Axes

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

Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
````

## claim_667088d67f27a0b1b16ced96df73a19a

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_667088d67f27a0b1b16ced96df73a19a",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "13-related-files",
  "unitDigest": "73a072fb1b320f93951e427d5e1af422830f13d626e6564e14bbe403012a389d",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "aa96c2c16f74af0343fed9584fcff94195956b0e2a92a7c347a4dbc150a4760f"
}
````

````text
## 13. Related Files

- [Work State portal](../README.md)
- [Work State spec](../spec.md)
- [Retired decision history](../decisions/retired-decision-history.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
- [Legacy source: docs/io-contract.md](../../../io-contract.md)
````

## claim_c9081814b1f39c068fb76e62b7726390

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_c9081814b1f39c068fb76e62b7726390",
  "path": "docs/platform/work-state/contracts/cli-io-contract.md",
  "anchor": "unheaded-block-46",
  "unitDigest": "6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0",
  "fileStatus": {
    "kind": "contract",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0"
}
````

````text
- [Work State portal](../README.md)
- [Work State spec](../spec.md)
- [Retired decision history](../decisions/retired-decision-history.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
- [Legacy source: docs/io-contract.md](../../../io-contract.md)
````

## claim_e7b9adc648921a3b524b621ac615fad6

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_e7b9adc648921a3b524b621ac615fad6",
  "path": "docs/platform/work-state/decisions/retired-decision-history.md",
  "anchor": "retired-decision-history-work-state",
  "unitDigest": "b15dec1d66d1ae673352b56ff918b917f9e628294a4ef5124f6face82e91e995",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "45a0ff7913dab7fa430cdd6920ceade9b816d3ecdfefabf513845eabc0c05381"
}
````

````text
# Retired Decision History: Work State

```txt
Document type: Decision
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Hold the retired architecture decision records (ADR 0002 to 0032) of the work state area, relocated verbatim from the legacy work-state spec
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/history/multi-role-harness-distill-record.md
```
````

## claim_33eee087ac3e479ed6296daf4c6d143e

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_33eee087ac3e479ed6296daf4c6d143e",
  "path": "docs/platform/work-state/decisions/retired-decision-history.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "1a6db74c9548d91671e8677038c8a3d5cbb338157fa78edab6420ad6555257ac",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "1a6db74c9548d91671e8677038c8a3d5cbb338157fa78edab6420ad6555257ac"
}
````

````text
```txt
Document type: Decision
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Hold the retired architecture decision records (ADR 0002 to 0032) of the work state area, relocated verbatim from the legacy work-state spec
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/history/multi-role-harness-distill-record.md
```
````

## claim_61b042f479508b9e6671ead705da6e76

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_61b042f479508b9e6671ead705da6e76",
  "path": "docs/platform/work-state/decisions/retired-decision-history.md",
  "anchor": "14-related-files",
  "unitDigest": "74b54c3ee9e2379ee592933ee6d9a0358b172f1ddf78d3295db44d78bb060e5a",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "4c6e9848de7e4dedb0a7ad79e407df764230818a3d33bf0ecc5f91c76a0c94a1"
}
````

````text
## 14. Related Files

- [Work State area portal](../README.md)
- [Work State spec](../spec.md)
- [Multi-role harness distill record](../history/multi-role-harness-distill-record.md)
````

## claim_0f27b5622596386e519aae244e6e5b87

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_0f27b5622596386e519aae244e6e5b87",
  "path": "docs/platform/work-state/decisions/retired-decision-history.md",
  "anchor": "unheaded-block-95",
  "unitDigest": "004f542a5bde3a173fdcfa6aa53cdbadc1f19970795962fb0bf48e73114759bc",
  "fileStatus": {
    "kind": "decision",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "004f542a5bde3a173fdcfa6aa53cdbadc1f19970795962fb0bf48e73114759bc"
}
````

````text
- [Work State area portal](../README.md)
- [Work State spec](../spec.md)
- [Multi-role harness distill record](../history/multi-role-harness-distill-record.md)
````

## claim_373fbe5946a45421c2b7a250d7ebbcf3

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_373fbe5946a45421c2b7a250d7ebbcf3",
  "path": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
  "anchor": "multi-role-harness-distill-record",
  "unitDigest": "c98f5791cdbbddca365d9380156be1beab1612a7d572b34ee5d7cda2c2a75a60",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "82aee2fba6883a126908c77e6824a034c81ae480204db2fd95f1311938ed8a82"
}
````

````text
# Multi-Role Harness Distill Record

```txt
Document type: History
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Dated narrative record of how the multi-role team harness decision was distilled and what happened after the distill.
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/specs/work-state.md
```
````

## claim_e64ffe67cb2ab1ce431b12b77ef43f31

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_e64ffe67cb2ab1ce431b12b77ef43f31",
  "path": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "23354ff6d36685c865345ed911d19b95b22c5bac322c47f823fdb279de29be67",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "23354ff6d36685c865345ed911d19b95b22c5bac322c47f823fdb279de29be67"
}
````

````text
```txt
Document type: History
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Dated narrative record of how the multi-role team harness decision was distilled and what happened after the distill.
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/specs/work-state.md
```
````

## claim_af4ff9aa70ed41333c7bf928a95aaa27

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_af4ff9aa70ed41333c7bf928a95aaa27",
  "path": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
  "anchor": "1-purpose-and-scope",
  "unitDigest": "3c47bf821af476b6ef6aeb600c18f3e02e414a584b903989c9166bb5c458944d",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "e055f180aae77cec1407ee194157cebc83bea1d09f308339505ac7b5de794188"
}
````

````text
## 1. Purpose And Scope

Dated narrative of one decision record: the journey, the state at distill time, and the review after distill. The decision text itself lives in [retired-decision-history.md](../decisions/retired-decision-history.md).
````

## claim_cbaf6ad2c21529cbd2fecbe0e4132f24

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_cbaf6ad2c21529cbd2fecbe0e4132f24",
  "path": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "322ff44464a915090c5003dd765463b7d2dc113730c6e49f9a0ca95961f81962",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "322ff44464a915090c5003dd765463b7d2dc113730c6e49f9a0ca95961f81962"
}
````

````text
Dated narrative of one decision record: the journey, the state at distill time, and the review after distill. The decision text itself lives in [retired-decision-history.md](../decisions/retired-decision-history.md).
````

## claim_355e2e7d7188f92d6960f8df61af138b

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_355e2e7d7188f92d6960f8df61af138b",
  "path": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
  "anchor": "5-related-files",
  "unitDigest": "cf18376a42bddc0e4c1b6fb81faafb0599c3e6c45d5440d61144aca5cabc9bc8",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "53c07d6870e7ac23f89a26aad76d8a6bd139aad608bb92ce4c0dbd9a61145366"
}
````

````text
## 5. Related Files

- [Work state area portal](../README.md)
- [Retired decision history](../decisions/retired-decision-history.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
````

## claim_646e9db9521c2005fa76d437f292c4e8

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_646e9db9521c2005fa76d437f292c4e8",
  "path": "docs/platform/work-state/history/multi-role-harness-distill-record.md",
  "anchor": "unheaded-block-9",
  "unitDigest": "bec0bee4883c07d780fdb7326d398df733b3d360628904265c1b87d86dbd5251",
  "fileStatus": {
    "kind": "history",
    "kindCanonical": false,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "history"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "bec0bee4883c07d780fdb7326d398df733b3d360628904265c1b87d86dbd5251"
}
````

````text
- [Work state area portal](../README.md)
- [Retired decision history](../decisions/retired-decision-history.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
````

## claim_6e7e6c494be10e4791240d2b06d702ca

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_6e7e6c494be10e4791240d2b06d702ca",
  "path": "docs/platform/work-state/README.md",
  "anchor": "work-state",
  "unitDigest": "2a8b93c172f11f9d2f118fea5a934559964ccb299327b5deb8621632a1d2d98a",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "fdc906f0187105d772f0adb87ee9b336d1b748a1cdd7d8231ff7269c49fb7594"
}
````

````text
# Work State

```txt
Document type: Area portal
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/contracts/cli-io-contract.md
- docs/platform/work-state/architecture/implementation-pointers.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/platform/work-state/history/multi-role-harness-distill-record.md
- docs/specs/work-state.md
- docs/io-contract.md
- docs/work-item-lifecycle-vision.md
- docs/platform/vision.md
```
````

## claim_ed518acf009411ce9041b0cd75212b4f

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_ed518acf009411ce9041b0cd75212b4f",
  "path": "docs/platform/work-state/README.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "402fdee5f2de6e3510907b5bcc86080b6b4f8c1f3b40cbec3bc6cb347ea739ea",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "402fdee5f2de6e3510907b5bcc86080b6b4f8c1f3b40cbec3bc6cb347ea739ea"
}
````

````text
```txt
Document type: Area portal
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Route readers through the candidate documents of the work state area and point to the legacy sources they are drawn from
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/contracts/cli-io-contract.md
- docs/platform/work-state/architecture/implementation-pointers.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/platform/work-state/history/multi-role-harness-distill-record.md
- docs/specs/work-state.md
- docs/io-contract.md
- docs/work-item-lifecycle-vision.md
- docs/platform/vision.md
```
````

## claim_cc394d5b0cb0a9b1279269b3e692b476

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_cc394d5b0cb0a9b1279269b3e692b476",
  "path": "docs/platform/work-state/README.md",
  "anchor": "1-purpose-and-audience",
  "unitDigest": "19bf6e1bfdcb178636bc7848a2c7131f85cd93ce2822f4d0d3d8d6db1876aee8",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "d81045db4b15f6136d7c48cad8df86dfe4633930962ab0c1f40598c9adeda36e"
}
````

````text
## 1. Purpose And Audience

This document is the entry point of the candidate documents of the work state area. It holds navigation only.

The documents listed here are candidate material. No reader reads them yet. The legacy documents stay canonical until the cutover: [docs/specs/work-state.md](../../specs/work-state.md), [docs/io-contract.md](../../io-contract.md).
````

## claim_38e265e31664e037fe8d1dc75bb9ddc6

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_38e265e31664e037fe8d1dc75bb9ddc6",
  "path": "docs/platform/work-state/README.md",
  "anchor": "unheaded-block-2",
  "unitDigest": "565e157d554380e371b36756303e6a49480075fdc1a98ca544b8b5b3d95705d5",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "565e157d554380e371b36756303e6a49480075fdc1a98ca544b8b5b3d95705d5"
}
````

````text
This document is the entry point of the candidate documents of the work state area. It holds navigation only.
````

## claim_ee0a84fe03107c499ac59a87bbbb3d0d

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_ee0a84fe03107c499ac59a87bbbb3d0d",
  "path": "docs/platform/work-state/README.md",
  "anchor": "unheaded-block-3",
  "unitDigest": "7928379e01fa7625ab5fe776f09064979906a3269bcaace401926e6f083ecc9f",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "7928379e01fa7625ab5fe776f09064979906a3269bcaace401926e6f083ecc9f"
}
````

````text
The documents listed here are candidate material. No reader reads them yet. The legacy documents stay canonical until the cutover: [docs/specs/work-state.md](../../specs/work-state.md), [docs/io-contract.md](../../io-contract.md).
````

## claim_c56b55017b8f21f481d0ccf9526b55af

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_c56b55017b8f21f481d0ccf9526b55af",
  "path": "docs/platform/work-state/README.md",
  "anchor": "2-read-first",
  "unitDigest": "0179e23b52d6975730a1141c8ae453735d17ccf63c8792b0ce9ad7ca41ef9f1d",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "6cc1179df3b677b5a0b986c570f22e9455d21b170c11d14a5eeb76910dafadec"
}
````

````text
## 2. Read First

| Reader goal | Read |
| --- | --- |
| Find the canonical text today | [docs/specs/work-state.md](../../specs/work-state.md), [docs/io-contract.md](../../io-contract.md) |
| Open the candidate spec | [spec.md](spec.md) |
| Open the candidate CLI input/output contract | [contracts/cli-io-contract.md](contracts/cli-io-contract.md) |
| Open the candidate implementation pointers | [architecture/implementation-pointers.md](architecture/implementation-pointers.md) |
| Open the candidate retired decision history | [decisions/retired-decision-history.md](decisions/retired-decision-history.md) |
| Open the candidate harness distill record | [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md) |
````

## claim_40c4b5d0d4b4213b60aaa9ac1a397c76

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_40c4b5d0d4b4213b60aaa9ac1a397c76",
  "path": "docs/platform/work-state/README.md",
  "anchor": "unheaded-block-4",
  "unitDigest": "678a5f954ec08ce04c589014638beef17c0a40d257dd87311c833bd711055d91",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "678a5f954ec08ce04c589014638beef17c0a40d257dd87311c833bd711055d91"
}
````

````text
| Reader goal | Read |
| --- | --- |
| Find the canonical text today | [docs/specs/work-state.md](../../specs/work-state.md), [docs/io-contract.md](../../io-contract.md) |
| Open the candidate spec | [spec.md](spec.md) |
| Open the candidate CLI input/output contract | [contracts/cli-io-contract.md](contracts/cli-io-contract.md) |
| Open the candidate implementation pointers | [architecture/implementation-pointers.md](architecture/implementation-pointers.md) |
| Open the candidate retired decision history | [decisions/retired-decision-history.md](decisions/retired-decision-history.md) |
| Open the candidate harness distill record | [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md) |
````

## claim_f8a9d4e67202c6e0baeab16e124dcd57

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_f8a9d4e67202c6e0baeab16e124dcd57",
  "path": "docs/platform/work-state/README.md",
  "anchor": "3-document-map",
  "unitDigest": "4e6d7bbc90fe594a85b59680da7e9631bdbae1f41127a43db7b03993b2563949",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "b8214146a6d3dbd601715bb0c3ea375020b421fd0be0e5479536b0d3d5bc5ebb"
}
````

````text
## 3. Document Map

| Document | Kind |
| --- | --- |
| [spec.md](spec.md) | Spec |
| [contracts/cli-io-contract.md](contracts/cli-io-contract.md) | Contract |
| [architecture/implementation-pointers.md](architecture/implementation-pointers.md) | Architecture |
| [decisions/retired-decision-history.md](decisions/retired-decision-history.md) | Decision |
| [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md) | History |
````

## claim_9b6b90e68f3ff5f021a0c257ab0523bf

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_9b6b90e68f3ff5f021a0c257ab0523bf",
  "path": "docs/platform/work-state/README.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "efd8ff22ee1d6e3922302215002a4727e69f2722e5507cba54d9e92f94f2fd17",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "efd8ff22ee1d6e3922302215002a4727e69f2722e5507cba54d9e92f94f2fd17"
}
````

````text
| Document | Kind |
| --- | --- |
| [spec.md](spec.md) | Spec |
| [contracts/cli-io-contract.md](contracts/cli-io-contract.md) | Contract |
| [architecture/implementation-pointers.md](architecture/implementation-pointers.md) | Architecture |
| [decisions/retired-decision-history.md](decisions/retired-decision-history.md) | Decision |
| [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md) | History |
````

## claim_5dbd7535e303723c8a0150bf8db5e89e

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_5dbd7535e303723c8a0150bf8db5e89e",
  "path": "docs/platform/work-state/README.md",
  "anchor": "4-legacy-source-pointers",
  "unitDigest": "4dedd0722088de326bb89be824a5f78fde42fc5a1ec1f8ff50ebabcab5c3464c",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "541d20c922e9975731514c9ac2dc2a2275cf80c89645e0e26948589c88e8a8fb"
}
````

````text
## 4. Legacy Source Pointers

Canonical until the cutover: [docs/specs/work-state.md](../../specs/work-state.md), [docs/io-contract.md](../../io-contract.md)

A third retained source, [docs/work-item-lifecycle-vision.md](../../work-item-lifecycle-vision.md), is not covered by this candidate area. It belongs to the platform vision candidate [vision.md](../vision.md).
````

## claim_cfd5521d6c7f6d2ef7bf91e5d87d7c59

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_cfd5521d6c7f6d2ef7bf91e5d87d7c59",
  "path": "docs/platform/work-state/README.md",
  "anchor": "unheaded-block-6",
  "unitDigest": "19916875886c488a79940aadd1b3ab4c61288ef66c148300b483d9cacf94d994",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "19916875886c488a79940aadd1b3ab4c61288ef66c148300b483d9cacf94d994"
}
````

````text
Canonical until the cutover: [docs/specs/work-state.md](../../specs/work-state.md), [docs/io-contract.md](../../io-contract.md)
````

## claim_3301f241ae14c5f317abe23dcecdb700

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_3301f241ae14c5f317abe23dcecdb700",
  "path": "docs/platform/work-state/README.md",
  "anchor": "unheaded-block-7",
  "unitDigest": "4ec367b6fb47b2dc7705caa2b3ae458f74136f697291ee505a2e884233efd793",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "4ec367b6fb47b2dc7705caa2b3ae458f74136f697291ee505a2e884233efd793"
}
````

````text
A third retained source, [docs/work-item-lifecycle-vision.md](../../work-item-lifecycle-vision.md), is not covered by this candidate area. It belongs to the platform vision candidate [vision.md](../vision.md).
````

## claim_1d0364df7e95a5e3db661955c385ebe7

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_1d0364df7e95a5e3db661955c385ebe7",
  "path": "docs/platform/work-state/README.md",
  "anchor": "5-related-files",
  "unitDigest": "c91a0a9f8d28a1ebc3cee7e8545128407fdc9bea4cc8f20a0e52ad44be626672",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "a8438b2333bccf968eac16630ab63631c4926703bcc6a07672e5a521b54a19f4"
}
````

````text
## 5. Related Files

| Relationship | File |
| --- | --- |
| candidate spec | [spec.md](spec.md) |
| candidate CLI input/output contract | [contracts/cli-io-contract.md](contracts/cli-io-contract.md) |
| candidate implementation pointers | [architecture/implementation-pointers.md](architecture/implementation-pointers.md) |
| candidate retired decision history | [decisions/retired-decision-history.md](decisions/retired-decision-history.md) |
| candidate harness distill record | [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md) |
| legacy owner | [../../specs/work-state.md](../../specs/work-state.md) |
| legacy owner | [../../io-contract.md](../../io-contract.md) |
| retained source for the platform vision candidate | [../../work-item-lifecycle-vision.md](../../work-item-lifecycle-vision.md) |
| platform vision candidate | [../vision.md](../vision.md) |
````

## claim_3e7d96cb9ba40105c67c9f10b5b90f37

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_3e7d96cb9ba40105c67c9f10b5b90f37",
  "path": "docs/platform/work-state/README.md",
  "anchor": "unheaded-block-8",
  "unitDigest": "d329826e03cec87fa8debb4a68909e81621aef1fcef5cec549342c2dbf25c561",
  "fileStatus": {
    "kind": "area-portal",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "d329826e03cec87fa8debb4a68909e81621aef1fcef5cec549342c2dbf25c561"
}
````

````text
| Relationship | File |
| --- | --- |
| candidate spec | [spec.md](spec.md) |
| candidate CLI input/output contract | [contracts/cli-io-contract.md](contracts/cli-io-contract.md) |
| candidate implementation pointers | [architecture/implementation-pointers.md](architecture/implementation-pointers.md) |
| candidate retired decision history | [decisions/retired-decision-history.md](decisions/retired-decision-history.md) |
| candidate harness distill record | [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md) |
| legacy owner | [../../specs/work-state.md](../../specs/work-state.md) |
| legacy owner | [../../io-contract.md](../../io-contract.md) |
| retained source for the platform vision candidate | [../../work-item-lifecycle-vision.md](../../work-item-lifecycle-vision.md) |
| platform vision candidate | [../vision.md](../vision.md) |
````

## claim_d0a4a0ba4c7eac82a7694e85effbd735

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_d0a4a0ba4c7eac82a7694e85effbd735",
  "path": "docs/platform/work-state/spec.md",
  "anchor": "work-state-specification",
  "unitDigest": "9a658ef61faf272a7f509a32ce47a8778f94d791140af01f0dbdab633456a4aa",
  "fileStatus": {
    "kind": "spec",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "a7a11e5f0bb2e094616bfb50a3f85857b7e466047093407630b3e5057cca8efd"
}
````

````text
# Work State Specification

```txt
Document type: Spec
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Own the observable behavior, state model, records, stages, verbs and rules of the work state area.
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/contracts/cli-io-contract.md
- docs/platform/work-state/architecture/implementation-pointers.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/platform/work-state/history/multi-role-harness-distill-record.md
- docs/specs/work-state.md
- docs/io-contract.md
```
````

## claim_b59a3cdc9f62daead75352fbce112437

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_b59a3cdc9f62daead75352fbce112437",
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-1",
  "unitDigest": "48be7e1956a052be73118c1dd9f46ea4380226e957820b79e128011e137c6985",
  "fileStatus": {
    "kind": "spec",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "48be7e1956a052be73118c1dd9f46ea4380226e957820b79e128011e137c6985"
}
````

````text
```txt
Document type: Spec
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Own the observable behavior, state model, records, stages, verbs and rules of the work state area.
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/contracts/cli-io-contract.md
- docs/platform/work-state/architecture/implementation-pointers.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/platform/work-state/history/multi-role-harness-distill-record.md
- docs/specs/work-state.md
- docs/io-contract.md
```
````

## claim_8c62d6551e80993c22ab57147c8f81c3

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_8c62d6551e80993c22ab57147c8f81c3",
  "path": "docs/platform/work-state/spec.md",
  "anchor": "4-capture-and-evidence-records",
  "unitDigest": "f26008336cbb1037dda0f2ae2290c62963215e24d0301057f1e367e3dcab9bfb",
  "fileStatus": {
    "kind": "spec",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "acd76bd3aedb9520db2b3b6ba47c22fb94a3a00c80fe5bf8440bde8f72a01e25"
}
````

````text
## 4. Capture And Evidence Records

Subsections: Outcome Record, Friction Record, Settlement Record, Close Lesson Record, Human Gate Record, Discovery Gate Record.
````

## claim_aa9218de6bffacb2aa3b7a151fedb77e

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_aa9218de6bffacb2aa3b7a151fedb77e",
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-5",
  "unitDigest": "95acad19943ec3bec0f17e89bd1a2913178b14fa1918abd8a3582102d3547e09",
  "fileStatus": {
    "kind": "spec",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "95acad19943ec3bec0f17e89bd1a2913178b14fa1918abd8a3582102d3547e09"
}
````

````text
Subsections: Outcome Record, Friction Record, Settlement Record, Close Lesson Record, Human Gate Record, Discovery Gate Record.
````

## claim_ee3e0d3cc2479898da8a20672923576f

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_ee3e0d3cc2479898da8a20672923576f",
  "path": "docs/platform/work-state/spec.md",
  "anchor": "5-workflow-step-and-stage-model",
  "unitDigest": "1f32213caa9b7a362e4f9264696aa1969ced613dc7bf66d3263c74ddca1ac806",
  "fileStatus": {
    "kind": "spec",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "b9b575e490c26fb939d5115d4abb480ab1e7ab4ce738e596d074eb458d09ac17"
}
````

````text
## 5. Workflow Step And Stage Model

Subsections: Workflow Step Replaces Stage, Discovery And Exploring Stages, Planning Stage.
````

## claim_1ef09ff15a7cb12419b5c10e1d60f936

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_1ef09ff15a7cb12419b5c10e1d60f936",
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-27",
  "unitDigest": "69876b8abcf241ab133b5f7a4e06a3366f94b8ecc9e315ccc249c01b612aaeba",
  "fileStatus": {
    "kind": "spec",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "69876b8abcf241ab133b5f7a4e06a3366f94b8ecc9e315ccc249c01b612aaeba"
}
````

````text
Subsections: Workflow Step Replaces Stage, Discovery And Exploring Stages, Planning Stage.
````

## claim_847c78bb09c21dd00ea3cdd56dfff0ed

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_847c78bb09c21dd00ea3cdd56dfff0ed",
  "path": "docs/platform/work-state/spec.md",
  "anchor": "8-tool-registry",
  "unitDigest": "f4f9e9e9a1350ede402b09ff84e48dfa87b46f7b605cb89788e7bac8d5ca32db",
  "fileStatus": {
    "kind": "spec",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "870e392de09f1a325aa4e21238fc7328b5dfa167a85c73ba4cd3b96d0c1bcf28"
}
````

````text
## 8. Tool Registry

Subsections: Registry Projection And Registration Standard, Tool Registry Verbs.
````

## claim_2d40db0a3a51d53c2dcaca6f0e220760

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_2d40db0a3a51d53c2dcaca6f0e220760",
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-60",
  "unitDigest": "bf1d6f189051b2a329a87fe64f1be27ea4faec22215c94b6606481ebae6ba06c",
  "fileStatus": {
    "kind": "spec",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "bf1d6f189051b2a329a87fe64f1be27ea4faec22215c94b6606481ebae6ba06c"
}
````

````text
Subsections: Registry Projection And Registration Standard, Tool Registry Verbs.
````

## claim_0da2d8002224e164a98be8318dadb650

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_0da2d8002224e164a98be8318dadb650",
  "path": "docs/platform/work-state/spec.md",
  "anchor": "15-source-provenance-and-coverage",
  "unitDigest": "585bb28b7915224df08e4107704e6266f9c81fab514bdf349582be1527b5950b",
  "fileStatus": {
    "kind": "spec",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "ece94e68e59bca6ef0848e19eaa32390f34f69d326b34240e3d024e373d8320d"
}
````

````text
## 15. Source Provenance And Coverage

---
area: work-state
updated: 2026-08-12
sources: [phase-1-state-layer, phase-1-review-fixes, phase-2-routing-s1, phase-2-routing-s2, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, async-human-gate, stage-intake, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1, install-coexistence, discovery-context, worker-execution, fan-out-parallel, human-rounds, work-item-verb-surface, base-workflow-model-s1, base-workflow-model-s2, self-improve-loop, work-graph-intelligence-s1, work-graph-intelligence-s2a, work-graph-intelligence-s2b, entry-standardization, work-id-tsk-hash, p50-workflow-induct, str61-chat-context-continuity, str68-discovery-judge-robustness, compound-learn-enduser-docs, str77-79-doc-gap-fixes, str83-fgos-slash-commands, str86-runner-headless-git, str73-done-flip-cos-check, str93-discovery-precedence-labels, str7-str8-priority-intent, str51-llm-assist-classify, str46-io-contract-lat2, str46-io-contract-lat3, spec-docs-lifecycle-realignment]
decisions: [9ac6ca50, 0790031c, 451ca088, fd17309a, 55ad2f9f, feed7428, 1a80b4d3, 65c642a8, 9f6b52c8, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e, f1715488, 8788e9bb, cfae0120, 396d9d9e, 2e92b7a5, 5a6900b2, b28487af, 2ae492d8, 76b7a36b, 8d04bba3, 1cd895e1, 38160a70, a2146274, 896219a7, b5c0ba0c, b2d18cc7, b0da87aa, 8cf7effe, 81322763, 28e6184b, 14091e58, 19330e09, bce79d8a, 87536f3f, 9c67c3d1, 6aa67ae4, 1c776c56, 1d336d8a, ea8b9a8d, 757e5dd7, ecfd0d1a, 0f3b6eb0, 0e575f83, ee0f95c3, f69951df, f176c18a, d3445024, a5825b8b, a58a7563, 11d5ebc4, 10a740da, 8fc155eb]
coverage: partial
---
````

## claim_ac433070c1a842c2396a6fe4b6d5a0f6

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_ac433070c1a842c2396a6fe4b6d5a0f6",
  "path": "docs/platform/work-state/spec.md",
  "anchor": "16-related-files",
  "unitDigest": "9a02e832f3ff3a984664a32119ecc2a14bc98072bf9f867873ebe81e61f6d238",
  "fileStatus": {
    "kind": "spec",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "f3faccf8579d2bfa74b88c2c8ed47cbee902eb72526668370116b6fecd43f26b"
}
````

````text
## 16. Related Files

- [README.md](README.md)
- [contracts/cli-io-contract.md](contracts/cli-io-contract.md)
- [architecture/implementation-pointers.md](architecture/implementation-pointers.md)
- [decisions/retired-decision-history.md](decisions/retired-decision-history.md)
- [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md)
- [docs/specs/work-state.md](../../specs/work-state.md)
- [docs/io-contract.md](../../io-contract.md)
````

## claim_679bf517a1831f6c2a5dd74c478ed811

Entry kind: A28 candidate-unverified eligibility/equality, no truth approval.

````json
{
  "claimId": "claim_679bf517a1831f6c2a5dd74c478ed811",
  "path": "docs/platform/work-state/spec.md",
  "anchor": "unheaded-block-99",
  "unitDigest": "43c88a88d0eb57f524b0b2768bb6132b7136f7c04066dbea712d00c731c3d9a4",
  "fileStatus": {
    "kind": "spec",
    "kindCanonical": true,
    "authorityStatus": "candidate",
    "designStatus": "Candidate",
    "canonical": false,
    "eligibility": "non-promoted Candidate/Draft"
  },
  "status": "candidate-unverified",
  "shownTextDigest": "43c88a88d0eb57f524b0b2768bb6132b7136f7c04066dbea712d00c731c3d9a4"
}
````

````text
- [README.md](README.md)
- [contracts/cli-io-contract.md](contracts/cli-io-contract.md)
- [architecture/implementation-pointers.md](architecture/implementation-pointers.md)
- [decisions/retired-decision-history.md](decisions/retired-decision-history.md)
- [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md)
- [docs/specs/work-state.md](../../specs/work-state.md)
- [docs/io-contract.md](../../io-contract.md)
````
