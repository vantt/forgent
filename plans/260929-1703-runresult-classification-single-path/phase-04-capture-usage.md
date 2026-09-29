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
1. Đếm theo executor số run có usage, lấy 3 mẫu thật cho mỗi adapter có dữ liệu, và dán bảng đếm vào phase này.
2. Viết parser kèm test (có case pi nhiều turn, và case codex bị chèn chuỗi giả).
3. Sau commit C1 của phase 3: nối parser vào input `usage` của producer.

## Success Criteria
- [ ] Một run `pi` thật (xai) có `usage` khác null, và `inputTokens` bằng tổng qua các turn.
- [ ] Một run `codex-cli` thật có `totalTokens`; fixture có chuỗi "tokens used" giả ở giữa file không bị parse nhầm.
- [ ] Run claude/herdr có `usage: null` kèm `source`.

## Risk Assessment
- **Định dạng output đổi theo version CLI.** Parser trả `null` kèm `source: "unrecognized"`, không ném lỗi và không làm fail run.
- **Dữ liệu usage do worker kiểm soát** (stdout/stderr). Chỉ dùng để đo, **không bao giờ** là input cho quyết định dispatch hay quorum.
