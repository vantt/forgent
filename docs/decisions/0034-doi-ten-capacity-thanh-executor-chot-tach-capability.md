---
type: explanation
title: "0034 — Đổi tên capacity/capacities thành executor/executors, chốt tách capability"
tags: []
timestamp: 2026-08-17T04:00:00.000Z
source_capture_ids: [tsk-225]
date: 2026-08-17
status: accepted
superseded_by: []
extends: [0029]
relates_specs: [runner]
---

# 0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`

## Quyết định

`runner.capacities.<id>` (danh mục backend cụ thể có thể thực thi công
việc — vd `agy`, `gitnexus`) đổi tên dứt điểm thành `runner.executors.<id>`
— trên cả field config LẪN mọi identifier code liên quan trong `src/`.
Không giữ back-compat/alias cho tên cũ. `runner.capabilities.<name>` (một
purpose/lời hứa trừu tượng, vd `fgos-coding-implement`) và `runner.executor`
(số ít, cấu hình default toàn cục) giữ nguyên tên, không đổi.

`executor` thắng phương án thay thế `backend` trên hai căn cứ: (1) kỹ
thuật — `resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã giải cả
một backend có tên LẪN default toàn cục thành cùng một shape mà chính code
gọi là `executor` từ trước — đổi tên là hợp nhất một sự thật đã có sẵn
trong code, không phải chọn một từ mới tùy ý; (2) ngữ nghĩa — `capability`
= một lời hứa hành vi (behavior-promise), executor = sự hiện thực hóa lời
hứa đó (gốc động từ "to execute"); `backend` là danh từ tĩnh, không mang
nghĩa hành động này.

## Chính thức hóa việc tách `capability`/`capacity` mà `0029` D8 để ngỏ

`0029` D8 định nghĩa gốc: `capacity` = "một năng lực có tên (behavior-
promise / functional-helper)" — tức lịch sử "capacity" từng gộp CẢ lời
hứa (behavior-promise) LẪN đơn vị hiện thực (functional-helper) làm một,
không phân biệt. `tsk-34n` (2026-08-16, trước record này) sau đó TÁCH khái
niệm đó thành hai field riêng — `capability` (lời hứa/purpose) và
`capacity` (backend cụ thể hiện thực nó, qua `for`/`prefer`) — nhưng chưa
bao giờ chính thức sửa lại chữ D8 của `0029`. Record này ghi nhận rõ sự
tách đó, thay vì để nó ngầm định: D8's "behavior-promise" nay là
`capabilities.<name>`; D8's "functional-helper" nay là `executors.<id>`
(đổi tên bởi chính record này).

## Phạm vi đổi tên

- `.fgos/config.json` (live, main checkout): `runner.capacities` →
  `runner.executors`.
- `src/` (7 file), `test/` (8 file), `bin/fgos.mjs`,
  `scripts/dispatch-decide-hook.mjs`, `scripts/project-agents.mjs`,
  `scripts/check-decision-codes.baseline.json`: mọi identifier/field
  liên quan đổi tên đồng bộ (`resolveCapacityAndOverrides` →
  `resolveExecutorAndOverrides`, `capacityId` → `executorId`, `cfg.
  capacities` → `cfg.executors`, v.v.) — xác nhận `npm test` xanh toàn
  bộ sau đổi tên (3477 pass / 0 fail / 5 skip).
- **Không đổi**: `docs/history/*capacity*/` (~14 thư mục lịch sử, nội
  dung ghi lại nguyên trạng dùng thuật ngữ đúng thời điểm được viết —
  đổi tên riêng thư mục sẽ làm nội dung bên trong sai lệch với chính tên
  thư mục nó nằm trong); nội dung của chính `0026`/`0029`/`0033` (giữ
  nguyên chữ "capacity" trong văn bản gốc, không mở lại/supersede).
- **Có đổi**: docs sống (`docs/explanation/`, `docs/how-to/`,
  `docs/reference/`) và fragment skill dùng chung
  `_shared/capacity-dispatch-fallback.md` → `_shared/executor-dispatch-
  fallback.md` (cả nội dung lẫn tên file), vì cả hai mô tả hành vi hệ
  thống HIỆN TẠI, không phải một bản ghi lịch sử.

## Một collision đã xử lý khi thực thi

`runner.executors` (số nhiều) trùng CHỮ với một field đã bị RÚT hoàn toàn
từ trước (`executors.<tier>`, rung override theo tier, rút tại `tsk-in1-2`
D6, 0 entry sống, chưa bao giờ được validate). Đây là trùng CHỮ, không
trùng Ý — field cũ đã chết hẳn từ trước record này (không xuất hiện ở bất
kỳ config nào trên đĩa), record này tái dùng đúng chuỗi ký tự đó cho một
khái niệm thật, có validate, khác hẳn. Một test cũ (`test/runner/
dispatch.test.mjs`) từng khẳng định field "executors" "never validated,
inert" — đúng cho field CŨ, sai cho field MỚI record này tạo ra; test đã
sửa lại để phản ánh đúng, cùng một dòng comment lịch sử giải thích rõ hai
"executors" khác nhau qua thời gian, tránh nhầm lẫn cho người đọc sau.

## Tham chiếu

- `0029` — định nghĩa gốc D8, nay được chính thức hóa việc tách
- `docs/history/capability-capacity-remodel/` — tsk-34n, lần đầu tách
  capability/capacity trên thực tế (code), trước khi record này chốt tên
- `docs/history/capacity-naming-rename/` — DISCUSSION.md/CONTEXT.md/
  plan.md/iron-law-evidence.md của chính tsk-225, toàn bộ scout + bằng
  chứng thật cho quyết định này
