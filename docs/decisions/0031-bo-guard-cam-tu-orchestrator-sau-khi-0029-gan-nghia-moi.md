---
type: explanation
title: 0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới
tags: []
timestamp: 2026-08-11T00:00:00.000Z
source_capture_ids: []
date: 2026-08-11
status: accepted
supersedes: [0028]
relates_specs: [runner]
---

# 0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới

## Bối cảnh

`0028` đổi tên pinned term `orchestrator` → `launcher` cho vai trò `0026` mô
tả (chọn 1 item, đứng nó lên, bước ra hẳn), vì tên cũ sai nghĩa ngành. Cùng
record đó ghi rõ từ vừa giải phóng:

> Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác,
> **CHƯA gán nghĩa trong record này** — ứng viên đã bàn (chưa chốt): tầng
> điều phối N đơn vị chạy đồng thời + hợp nhất kết quả.

Và dựng một anti-recidivism guard (`test/docs/launcher-vocabulary-guard.
test.mjs`) fail khi từ đó xuất hiện trong prose fgOS tự sở hữu ngoài
allowlist. Guard đó đúng **trong đúng cửa sổ thời gian ấy**: từ chưa có
nghĩa mới, nên mọi lần nó tái xuất đều là tái phạm nghĩa cũ.

Cửa sổ ấy đã đóng. `0029` D17 điền vào đúng chỗ trống `0028` để lại:

> Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
> (N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
> hợp thành T0** [...] Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích
> thứ hai của "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp
> thành T0.

Từ thời điểm `0029` được chấp nhận, `orchestrator` là **từ vựng fgOS hợp lệ,
đã được định nghĩa chính thức**, chỉ tầng hợp thành T0 (N đơn vị, ở lại) —
đúng thứ `/fgOS:retro-loop`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
`/fgOS:cleanup-loop` và `fgos-fanout` đang làm. Guard của `0028` vẫn chặn nó,
nên nó đang cấm fgOS dùng chính từ vựng fgOS vừa chốt.

## Quyết định

Bỏ hẳn guard cấm từ `orchestrator`: xoá
`test/docs/launcher-vocabulary-guard.test.mjs` và toàn bộ cơ chế allowlist
đi kèm.

Ba lý do, theo thứ tự sức nặng:

1. **Guard mâu thuẫn với `0029`.** Nó chặn một từ mà một decision record
   sau nó đã định nghĩa chính thức. Giữ nguyên nghĩa là để một record cũ
   phủ quyết một record mới hơn — ngược hẳn khuôn supersede của repo này.

2. **Guard là `grep` mức-từ, không phân biệt được nghĩa.** Giá trị còn lại
   duy nhất của nó là bắt người dùng `orchestrator` theo nghĩa CŨ (vai
   1-item). Một phép so khớp chuỗi không làm nổi việc đó: nó chặn nghĩa mới
   hợp lệ y hệt cách nó chặn nghĩa cũ sai. Không có cách thu hẹp nào giữ
   được phần giá trị thật.

3. **Chi phí bảo trì đã vượt giá trị, có bằng chứng đếm được.**
   `ALLOWED_FILES_ENTRIES` đã phình lên 28 entry, mỗi entry một lý do
   hand-written riêng, cộng 3 cơ chế miễn trừ theo pattern
   (`FROZEN_FILENAMES`, `FROZEN_PHRASES`, `IRON_LAW_EVIDENCE_META_CITATION`).
   Ít nhất bốn item đã sinh ra **chỉ để vá allowlist này** (`tsk-2au`,
   `tsk-2lg`, `tsk-2uo`, `tsk-4cx`). Chính `docs/decisions/0000-index.md`
   phải viết vòng vo *"tên gọi ban đầu của `0026`"* ở hai dòng thay vì gọi
   thẳng tên — guard đang bóp méo văn của chính fgOS.

Record này chỉ supersede **mệnh đề guard** trong "Hệ quả" của `0028`. Phần
chính của `0028` — việc đổi tên vai trò `0026` từ `orchestrator` thành
`launcher` — **giữ nguyên hiệu lực**: `launcher` vẫn là tên đúng cho vai (1
đơn vị, buông), và không chỗ nào được quay về dùng `orchestrator` cho nghĩa
đó. Cùng khuôn supersede-từng-phần mà `0028` và `0029` đã dùng với `0026`
(hai phần không chồng lấn).

## Từ vựng sau record này

Lưới 2×2 của `0029` D17 là từ vựng hiện hành, dùng thẳng, không cần né:

| | buông (bước ra hẳn) | ở lại (giữ liên hệ) |
|---|---|---|
| **1 đơn vị** | `launcher` | `driver` |
| **N đơn vị** | trống có lý do | `orchestrator` (tầng hợp thành T0) |

## Hệ quả

- Xoá `test/docs/launcher-vocabulary-guard.test.mjs`.
- Xoá entry của file đó khỏi `scripts/check-decision-codes.baseline.json`
  (baseline chỉ chặn phát hiện MỚI, nên entry cũ vô hại — bỏ đi để không
  còn dữ liệu chết trỏ tới một file không tồn tại).
- Xoá `docs/how-to/allowlist-a-historical-mention-in-launcher-vocabulary-
  guard.md` và dòng của nó trong `docs/enduser-docs-index.json`: how-to đó
  hướng dẫn dùng một cơ chế không còn tồn tại.
- `0028` nhận `superseded_by: [0031]` trong frontmatter, đúng khuôn STR72
  trỏ-ngược-bắt-buộc; `docs/decisions/0000-index.md` nhận dòng của `0031`
  và ghi chú trên dòng `0028`.
- Không đụng: `herdr-plugin/src/**/*.rs`'s `PaneOrchestrator` (khái niệm
  Rust khác hẳn), `docs/distillery/**` (trích verbatim upstream),
  `plans/reports/**` (bản ghi lịch sử). Ba nhóm này vốn đã nằm ngoài phạm
  vi guard và không đổi gì.
- Không sửa ngược prose cũ. Những chỗ đang né từ (ví dụ hai dòng vòng vo
  trong `0000-index.md`) được phép viết thẳng lại khi có item chạm vào
  chúng — không phải việc của record này.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## Tham chiếu

- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0029` — `docs/decisions/0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md`
