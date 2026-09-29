---
phase: 4
title: "Ghi usage từ output của adapter"
status: pending
priority: P2
effort: "1d"
dependencies: []
---

# Phase 4: `usage` trong RunResult

## Overview
Ghi token vào RunResult cho những adapter có sẵn dữ liệu này, để Observe đo được chi phí của executor không phải Claude.

Parser làm ngay sau phase 1, trong cùng worktree (xem thứ tự ở `plan.md`). **Phần nối vào producer** làm sau commit C1 của phase 3, vì hai bên sửa cùng hàm (`normalizeRunResultV2` ở `run-result.mjs:269`, `settlement.mjs:613-640`). C1 đã chừa sẵn input `usage`, nên bước nối chỉ là truyền giá trị vào. <!-- Red Team #15 -->

## Requirements
- Shape:
  ```
  usage: { inputTokens|null, outputTokens|null, totalTokens|null,
           cacheReadTokens?, cacheCreationTokens?, source } | null
  ```
  `inputTokens`/`outputTokens` được phép `null` khi adapter chỉ báo tổng. <!-- Red Team #10 -->
- Nguồn theo adapter (kiểm lại lúc red-team 2026-09-29):
  - **pi** (`--mode json`): `message_end.usage` là số **của từng turn**, không phải số cộng dồn, và có run không có `agent_end`. Vì vậy **cộng** `message_end.usage` trên toàn run, khử trùng lặp theo message/response id. Chỉ parse event JSON ở cấp top-level theo `type`, không tìm sâu chuỗi `"usage"`. Lúc red-team, xai 35/35 và codex-pi 4/5 run có usage; gemini và openai 0.
  - **codex-cli**: chỉ neo vào **hai dòng cuối** của `stderr.log` (`tokens used` rồi `<N>` có dấu phẩy). Ghi `totalTokens`, còn `inputTokens`/`outputTokens` là `null`. Không quét toàn file, vì `stderr` có output lệnh do worker điều khiển.
  - **claude**: executor cli-spawn **không** có `--output-format stream-json`; nó chỉ có ở `liveOutput.streamFlags` của executor herdr (`.fgos/config.json:238-262`). Ghi `usage: null, source: "transcript"`; token của claude do source transcript của Observe lấy. **Không đổi argv executor** (anh chốt). <!-- Red Team #10 -->
  - **herdr-spawn**: `usage: null, source: "unavailable-herdr"`.
  - Adapter khác: `null`, `source: "unsupported"`.
- Parser thuần, mỗi adapter một hàm, đặt trong module của owner RunResult.

## Related Code Files
- Create: `src/runner/dispatch/usage-parsers.mjs` kèm test (fixture lấy từ `stdout.log`/`stderr.log` thật, đã lọc bớt; có một fixture codex mà giữa file có tool output chứa chuỗi "tokens used")
- Modify: producer duy nhất (sau commit C1 của phase 3), `docs/specs/runner.md`

## Implementation Steps
1. [x] Đếm theo executor số run có usage, lấy 3 mẫu thật cho mỗi adapter có dữ liệu, và dán bảng đếm vào phase này. (Đã quét toàn bộ 1072 run trong `.fgos/assignments/**/runs/**/` ngày 2026-09-29).
2. Viết parser kèm test (có case pi nhiều turn, và case codex bị chèn chuỗi giả).
3. Sau commit C1 của phase 3: nối parser vào input `usage` của producer.

## Dữ liệu quét thực tế (2026-09-29)

Tổng số run được quét: **1072 runs** tại `.fgos/assignments/**/runs/**/`.

### 1. Bảng tổng hợp theo Executor & Adapter

| Nhóm Executor / Adapter | Executor ID | Adapter Invocation | Tổng số run | Có usage parse được | Tỷ lệ | Nguồn / Ghi chú cơ chế parse |
|---|---|---|---|---|---|---|
| **pi** (`--mode json`) | `xai` | `cli-spawn` | 35 | **35** | 100% | `stdout.log` JSON lines: cộng dồn `message_end.usage` qua các turn |
| **pi** (`--mode json`) | `codex-pi` | `cli-spawn` | 5 | **4** | 80% | 4 run có JSON `message_end.usage` (báo 0 do limit); 1 run hỏng trước khi dispatch |
| **pi** (kiểm tra chéo) | `gemini` | `cli-spawn` | 41 | **0** | 0% | Chạy `agy` CLI, output plain text, không có cấu trúc usage |
| **pi** (kiểm tra chéo) | `openai` | `cli-spawn` | 24 | **0** | 0% | Thực tế chạy binary `codex` CLI (xem dòng codex bên dưới) |
| **codex-cli** | `codex-cli` | `cli-spawn` | 157 | **143** | 91.1% | `stderr.log` neo vào 2 dòng cuối (`tokens used\n<N>`). 14 run bị limit trước khi chạy |
| **codex-cli** | `codex-bwrap` | `cli-spawn` | 24 | **20** | 83.3% | `stderr.log` neo vào 2 dòng cuối. 1 run limit, 3 run thiếu file stderr |
| **codex-cli** | `openai` | `cli-spawn` | 24 | **14** | 58.3% | `stderr.log` neo vào 2 dòng cuối. 10 run bị limit trước khi chạy |
| **codex-cli** | `codex-readonly` | `cli-spawn` | 1 | **1** | 100% | `stderr.log` neo vào 2 dòng cuối |
| **claude** | `claude` | `cli-spawn` | 198 | **0** | 0% | `usage: null, source: "transcript"` (Observe transcript lấy) |
| **claude** | `claude-reviewer` | `cli-spawn` | 123 | **0** | 0% | `usage: null, source: "transcript"` |
| **claude** | `claude-bwrap` | `cli-spawn` | 52 | **0** | 0% | `usage: null, source: "transcript"` |
| **herdr** | `claude-reviewer-herdr` | `herdr-spawn` | 167 | **0** | 0% | `usage: null, source: "unavailable-herdr"` |
| **herdr** | `codex-herdr` | `herdr-spawn` | 85 | **0** | 0% | `usage: null, source: "unavailable-herdr"` |
| **herdr** | `agy-herdr` | `herdr-spawn` | 56 | **0** | 0% | `usage: null, source: "unavailable-herdr"` |
| **other** | `agy-cli` | `cli-spawn` | 69 | **0** | 0% | `usage: null, source: "unsupported"` (agy CLI text) |
| **other** | `agy-bwrap` | `cli-spawn` | 28 | **0** | 0% | `usage: null, source: "unsupported"` |
| **other** | `glm-cli` | `cli-spawn` | 6 | **0** | 0% | `usage: null, source: "unsupported"` (Claude Code routed OpenRouter) |
| **other** | `node` (internal) | `cli-spawn` | 1 | **0** | 0% | `usage: null, source: "unsupported"` |
| **Tổng cộng** | *(17 cấu hình)* | | **1072** | **217** | 20.2% | (39 pi + 178 codex-cli có usage trực tiếp trong logs) |

---

### 2. Cấu trúc & 3 Mẫu thật cho `pi`

#### Cấu trúc event `message_end` trong `stdout.log`:
Chỉ parse các dòng JSON có `"type": "message_end"` và `message.role === "assistant"`.
```json
{
  "type": "message_end",
  "message": {
    "role": "assistant",
    "api": "openai-responses",
    "provider": "xai",
    "model": "grok-4.6",
    "usage": {
      "input": 12924,
      "output": 391,
      "cacheRead": 512,
      "cacheWrite": 0,
      "reasoning": 281,
      "totalTokens": 13827
    },
    "stopReason": "toolUse",
    "timestamp": 1789717053101,
    "responseId": "1c30ce4a-c810-9c03-9698-f1981fe994d6"
  }
}
```
*Quy tắc cộng dồn*: Khử trùng lặp theo `responseId` (hoặc `id`), cộng dồn `input`, `output`, `cacheRead`, `cacheWrite`, và `totalTokens`.

#### Mẫu 1: Run bình thường nhiều turn (`asgn_lead_cold_resumable_dag_op_064/runs/01`)
- **Turn 1**: `responseId: "1c30ce4a-c810-9c03-9698-f1981fe994d6"`
  - `input: 12924, output: 391, cacheRead: 512, cacheWrite: 0, totalTokens: 13827`
- **Turn 2**: `responseId: "60a294bf-8ed4-9b57-bc8b-1960b472508c"`
  - `input: 14083, output: 172, cacheRead: 640, cacheWrite: 0, totalTokens: 14895`
- **Kết quả cộng dồn 2 turn**:
  - `inputTokens`: 27,007
  - `outputTokens`: 563
  - `cacheReadTokens`: 1,152
  - `cacheCreationTokens`: 0
  - `totalTokens`: 28,722
  - `source`: `"pi"`
- Fixture: `test/fixtures/usage/pi-multiturn-normal.jsonl`

#### Mẫu 2: Run dừng ngang (SIGTERM), thiếu `agent_end` (`asgn_lead_cold_resumable_dag_op_061/runs/01`)
- Đặc điểm: Run có 57 assistant `message_end` và 3,321 dòng log, nhưng bị SIGTERM lúc thực thi tool nên **không bao giờ có event `agent_end`**.
- **Turn 1**: `responseId: "d6a8b13d-e13d-9185-83dd-c2230e6a41dd"`
  - `input: 13459, output: 415, cacheRead: 0, cacheWrite: 0, totalTokens: 13874`
- **Turn 2**: `responseId: "6d941f13-5b4f-95d5-8e3c-deadb0327241"`
  - `input: 14153, output: 233, cacheRead: 512, cacheWrite: 0, totalTokens: 14898`
- **Kết quả cộng dồn 2 turn**:
  - `inputTokens`: 27,612
  - `outputTokens`: 648
  - `cacheReadTokens`: 512
  - `totalTokens`: 28,772
- Fixture: `test/fixtures/usage/pi-multiturn-no-agent-end.jsonl`

#### Mẫu 3: `codex-pi` gặp rate limit (`asgn_codex_coordinator_op_026/runs/01`)
- Đặc điểm: Adapter pi kết nối tới `openai-codex`, bị lỗi limit ngay turn 1 (`stopReason: "error"`, message `"Codex error: The usage limit has been reached"`).
- **Turn 1**: `input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0`
- **Kết quả**:
  - `inputTokens`: 0
  - `outputTokens`: 0
  - `totalTokens`: 0
  - `source`: `"pi"`
- Fixture: `test/fixtures/usage/pi-codex-rate-limit.jsonl`

---

### 3. Cấu trúc & 3 Mẫu thật cho `codex-cli`

#### Cấu trúc ở cuối `stderr.log`:
Chỉ lấy 2 dòng không rỗng cuối cùng của file `stderr.log`:
```
tokens used
75,387
```
*Quy tắc parse*:
1. Đọc ngược hoặc lấy tail của `stderr.log`.
2. Lọc bỏ các dòng rỗng ở cuối.
3. Dòng kề cuối phải là `tokens used` (case-insensitive).
4. Dòng cuối cùng phải match định dạng số có dấu phẩy: `/^[\d,]+$/`.
5. Bỏ dấu phẩy chuyển thành số nguyên: `parseInt(num.replace(/,/g, ''), 10)`.
6. Trả về `{ inputTokens: null, outputTokens: null, totalTokens: N, source: "codex-cli" }`.

#### Mẫu 1: Run bình thường (`asgn_packaging_distribution_coordinator_op_008/runs/01`)
- Tail `stderr.log`:
  ```
  2026-09-14T13:21:05.719895Z ERROR codex_core::session: failed to record rollout items: thread 01a0a011-f1ce-7530-9626-1f8a738c9735 not found
  tokens used
  75,387
  ```
- **Kết quả**: `totalTokens: 75387, inputTokens: null, outputTokens: null, source: "codex-cli"`
- Fixture: `test/fixtures/usage/codex-cli-normal.stderr.log`

#### Mẫu 2: Tool grep chứa chuỗi giả giữa file (`asgn_lead_dispatch_operability_implementation_op_021/runs/01`)
- Đặc điểm: Lệnh grep tìm kiếm trong các run cũ in ra dòng:
  ```
  .../runs/01/stderr.log-3131-tokens used
  --
  ```
  Ở cuối file mới là usage thật của phiên chạy:
  ```
  tokens used
  80,961
  ```
- **Kết quả**: Parser neo tail lấy đúng `totalTokens: 80961`, không bị lừa bởi grep output ở dòng 3131.
- Fixture: `test/fixtures/usage/codex-cli-grep-tokens-used.stderr.log`

#### Mẫu 3: Lồng tiến trình con (nested codex) giữa file (`asgn_p00_1_coordinator_op_003/runs/01`)
- Đặc điểm: Tại dòng 1906, một lệnh con in ra `tokens used\n4,043\n`. Tại dòng 3452, output JSON chứa stderr của codex khác. Ở cuối file (dòng 4262) là usage thật:
  ```
  tokens used
  84,606
  ```
- **Kết quả**: Parser neo tail lấy đúng `totalTokens: 84606`, không lấy nhầm giá trị con `4043` ở giữa file.
- Fixture: `test/fixtures/usage/codex-cli-nested-tokens-used.stderr.log`

---

### 4. Danh sách Edge Cases & Rủi ro phát hiện

1. **Chuỗi "tokens used" giả / lồng nhau ở giữa `stderr.log` của codex**:
   - Xuất hiện trong thực tế ở 2 run (`asgn_lead_dispatch_operability_implementation_op_021` do grep log cũ, và `asgn_p00_1_coordinator_op_003` do gọi codex con).
   - *Giải pháp*: Cấm regex quét toàn file (`/tokens used\s+([\d,]+)/g`). Bắt buộc chỉ neo vào **2 dòng không rỗng cuối cùng** của `stderr.log`.
2. **Run `pi` bị SIGTERM / Timeout mất `agent_end`**:
   - Xuất hiện ở run `asgn_lead_cold_resumable_dag_op_061/runs/01` (3,321 dòng, 57 turns).
   - *Giải pháp*: Không đợi event `agent_end`. Duyệt toàn bộ các event JSON dòng (JSON Lines) và cộng dồn mọi `message_end` có `role === "assistant"`.
3. **Trùng lặp event giữa `message_end` và `turn_end` trong `pi`**:
   - Cả hai event đều mang object `message` giống nhau và cùng `responseId`.
   - *Giải pháp*: Chỉ bắt event có `type === "message_end"`, đồng thời lưu `Set` các `responseId` đã tính để đảm bảo tính idempotent.
4. **Run bị dính Rate Limit trước khi session hoạt động**:
   - 14 run `codex-cli` và 10 run `openai` bị `ERROR: You've hit your usage limit...` ngay đầu file và không có block `tokens used`.
   - 4 run `codex-pi` trả về `usage` với các giá trị `0`.
   - *Giải pháp*: Trả về `null` kèm `source: "unrecognized"` hoặc giữ nguyên `0` theo đúng dữ liệu log; không bao giờ ném Exception làm fail run.
5. **Executor `gemini` và `openai`**:
   - `gemini` dùng binary `agy` (Antigravity CLI), output là text thường trong `stdout.log`, không có usage.
   - `openai` thực tế chỉ chạy `codex` CLI (chưa có run nào chạy `pi` qua OpenAI), token nằm ở `stderr.log`.

---

### 5. Danh mục Fixtures đã tạo sẵn (`test/fixtures/usage/`)

- `test/fixtures/usage/pi-multiturn-normal.jsonl`: 2 turns chuẩn có cacheRead, totalTokens.
- `test/fixtures/usage/pi-multiturn-no-agent-end.jsonl`: 2 turns chuẩn, ngắt ngang không có `agent_end`.
- `test/fixtures/usage/pi-codex-rate-limit.jsonl`: event pi trả về 0 token khi lỗi limit.
- `test/fixtures/usage/codex-cli-normal.stderr.log`: log chuẩn kết thúc bằng `tokens used\n75,387`.
- `test/fixtures/usage/codex-cli-grep-tokens-used.stderr.log`: log có chứa chuỗi grep giả giữa file và kết thúc bằng `80,961`.
- `test/fixtures/usage/codex-cli-nested-tokens-used.stderr.log`: log có nested sub-run chứa `tokens used\n4,043` giữa file và kết thúc bằng `84,606`.

## Success Criteria
- [ ] Một run `pi` thật (xai) có `usage` khác null, và `inputTokens` bằng tổng qua các turn.
- [ ] Một run `codex-cli` thật có `totalTokens`; fixture có chuỗi "tokens used" giả ở giữa file không bị parse nhầm.
- [ ] Run claude/herdr có `usage: null` kèm `source`.

## Risk Assessment
- **Định dạng output đổi theo version CLI.** Parser trả `null` kèm `source: "unrecognized"`, không ném lỗi và không làm fail run.
- **Dữ liệu usage do worker kiểm soát** (stdout/stderr). Chỉ dùng để đo, **không bao giờ** là input cho quyết định dispatch hay quorum.
