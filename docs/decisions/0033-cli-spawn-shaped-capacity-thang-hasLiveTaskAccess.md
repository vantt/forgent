---
type: explanation
title: "0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2"
tags: []
timestamp: 2026-08-16T12:40:00.000Z
source_capture_ids: [tsk-pdg]
date: 2026-08-16
status: accepted
superseded_by: []
extends: [0026]
relates_specs: [runner]
---

# 0033 — Capacity cli-spawn-shaped thắng `hasLiveTaskAccess`, thu hẹp 0026 rule 2

## Quyết định

Một capacity `kind:agent` **cli-spawn-shaped** — declares `command`/
`adapter` của riêng nó, hoặc một entry `invocations[].via === "cli"` —
LUÔN dispatch out-of-process khi đã được cấu hình cho job đó, bất kể
caller có `hasLiveTaskAccess:true` hay không. `0026` rule 2 (ưu tiên
native khi caller cùng provider và có Task tool sống) vẫn đúng nguyên vẹn
cho capacity **agentType-shaped** (chỉ có `agentType`, không `command`
riêng — ví dụ `judge-discovery`) — quyết định này KHÔNG đảo `0026`, chỉ
thu hẹp phạm vi rule 2 xuống đúng nửa case còn hợp lý.

## Người quyết

Người dùng, trực tiếp, trong phiên làm việc 2026-08-16 (sau khi test
sống capacity `fgos-coding-implement` → `agy`, thấy một session sống vẫn
resolve `in-process` — tức KHÔNG bao giờ thật sự gọi `agy` — dù capacity
đã cấu hình rõ ràng). Nguyên văn ý định: "một soul sống sẽ chọn soul khác
phù hợp để làm việc thay nó" — tức cấu hình phải thắng, không phải mặc
định "tự làm" chỉ vì có Task tool.

## Lý do 0026 rule 2 không áp dụng ở đây

Rule 2 tự nêu lý do của chính nó (trích 0026): *"tránh lãng phí/sai lệch
khi soul mù re-derive 1 phán đoán soul sống đã làm rồi"* — bug thật
`tsk-1ni` (`judgeDiscovery` cli-spawn một judge mù dù caller đã tự đọc
CONTEXT.md xong). Lý do này đúng khi target là MỘT PHIÊN BẢN KHÁC CỦA
CHÍNH CALLER (native subagent, cùng provider, không có command riêng) —
không đúng khi target là một BACKEND THẬT SỰ KHÁC đã được người vận hành
đặt tên rõ ràng (`command: "agy"`). "In-process" trong case cli-spawn-
shaped không phải "dùng native thay vì spawn mù" — nó là "âm thầm bỏ qua
hoàn toàn config, tự làm thay". Đó không phải tối ưu hoá native-first,
đó là bỏ qua một quyết định cấu hình.

## Cơ chế phân biệt (không phải heuristic mới)

`resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã sẵn có đúng phép
thử này cho `resolvedViaAgentType`/`cliInvocation` — 2 hình dạng loại
trừ lẫn nhau. `decideCapacityDispatchMechanism` giờ dùng lại đúng phép
thử đó trước khi hỏi `hasLiveTaskAccess`:

```js
const isCliSpawnShaped = Boolean(
  capacity && (capacity.command || capacity.adapter ||
    (Array.isArray(capacity.invocations) && capacity.invocations.some((inv) => inv.via === 'cli'))),
);
if (isCliSpawnShaped) return 'out-of-process';
// agentType-shaped, kind:'tool', hoặc chưa cấu hình -- giữ nguyên logic cũ
```

## Bằng chứng đã kiểm

- `tsk-1m8` (item trước, 2026-08-16): live-proved cơ chế cli-spawn ra
  `agy` hoạt động thật (real spawn, real output) khi capacity được cấu
  hình — nhưng chỉ test qua `hasLiveTaskAccess:false` (headless). Session
  sống thật sự hỏi `decide --work` với `hasLiveTaskAccess:true` vẫn nhận
  `in-process` — đây chính là gap `0033` sửa.
- Quét toàn bộ 28 chỗ `hasLiveTaskAccess: true` trong
  `test/runner/dispatch.test.mjs` (`docs/history/tsk-pdg/RESEARCH.md`):
  không có test nào dùng capacity cli-spawn-shaped + `hasLiveTaskAccess:
  true` mong đợi `in-process` — 0 test hiện có bị gãy, xác nhận thật sau
  khi sửa (`npm test`: 3459 pass / 0 fail).
- Xác nhận sống trên config thật của chính repo này (`.fgos/config.json`,
  capacity `fgos-coding-implement` → `agy`):
  ```
  trước 0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"in-process"}
  sau  0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"out-of-process","configured":true}
  ```

## Việc chưa quyết, để lại

- Có nên đổi tên/tài liệu hoá rõ hơn khái niệm "cli-spawn-shaped" thành
  một field tường minh trên capacity (thay vì suy ra từ shape) không —
  chưa cần, chưa có case thật đòi hỏi.
- 6 skill (`fgos-coding-exploring`/`fgos-coding-planning`/
  `fgos-coding-validating`/`fgos-coding-implement`/`fgos-fanout`/
  `_shared/capacity-dispatch-fallback.md`) trích "Native-First Dispatch
  Doctrine rule 2" làm lý do không tự dispatch Task tool tuỳ tiện — đã
  đọc lại, không cái nào khẳng định sai sau `0033` (lý do của chúng là
  "đừng tự tạo sub-dispatch tuỳ tiện", không phải "hasLiveTaskAccess luôn
  thắng") — không sửa file nào trong số này.

## Tham chiếu

- `0026` — quyết định gốc, rule 2 bị thu hẹp
- `docs/history/tsk-pdg/RESEARCH.md`, `plan.md` — bằng chứng đầy đủ
- `docs/history/tsk-1m8/` — item trước, phát hiện gap này khi live-test
