---
type: explanation
title: "0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị"
tags: []
timestamp: 2026-08-09T07:55:18.000Z
source_capture_ids: []
date: 2026-08-09
supersedes: [0026]
---

# 0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`

## Bối cảnh

Phiên `tsk-5td` (`fgos-coding-shaping`, `docs/history/dispatch-concept-
boundary/DISCUSSION.md`) khoá lại ranh giới khái niệm tầng dispatch sau khi
gom bài học gather-work vs execution-work của bee, và chốt ba quyết định
(D7, D8, D17) cùng chạm đúng **một** mục định nghĩa của `0026` — mục "Đơn vị
vận hành (vocabulary, chốt dùng xuyên suốt từ đây)". Tiền lệ: `0028` đã
supersede `0026` một lần cho việc đổi tên `orchestrator`→`launcher`. Vì cả
ba quyết định lần này cũng sửa đúng mục đó, gộp chung **một** record thay vì
ba.

## Quyết định

### D7 — bỏ `rootTask`/`subTask` khỏi từ vựng dispatch

`0026` viết: *"**rootTask** — công việc gốc đang làm... **Vai trò này** có
tính ĐỆ QUY/fractal"* và *"**subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG
bản chất chỉ là 1 **rootTask** khác... 'subTask' chỉ là tên gọi **tương
đối**, nhìn từ góc của bên kích hoạt"*.

Sửa: bỏ cả hai chữ khỏi từ vựng dispatch. `0026` tự khai `rootTask` là một
**vai trò**, không phải một lớp phân loại — một item nằm backlog là `work`;
một launcher đứng nó lên thì cùng dòng, cùng id, state không đổi một byte mà
chỉ đổi tên gọi. Thay `rootTask` bằng **`work`** (T2, `tsk-*`) mang **vai
trò** T1 khi được kích hoạt. `subTask` đội hai nghĩa khác tập, tách theo
đúng nghĩa: (a) work con sinh ra bởi decompose — đã có tên và đã có field
lưu (`work.parent`, `0012`'s cạnh parent-child) → gọi là **child work**; (b)
target của một lần dispatch đệ quy, thoáng qua, không lưu — chỉ là một
`work`/exec-packet khác, không cần tên riêng.

### D8 — `capacity` = một năng lực có tên (behavior-promise / functional-helper)

`0026` viết: *"**capacity** — KHÁC bản chất với subTask: là 1 đơn vị
functional/helper hẹp (judge-discovery, submit-assist-classify) — không tự
mang vòng đời 1 rootTask đầy đủ"*.

Sửa: bản chất **giữ nguyên** — vẫn là đơn vị functional/helper hẹp — nhưng
nâng thành cặp **behavior-promise / functional-helper**: behavior-promise
trả lời nó **hứa** gì (`digest` hay `verdict`), functional-helper trả lời nó
**là** gì (hẹp, không authority, phục vụ mục tiêu người khác). Một mình
functional-helper thì hụt hợp đồng — lý do `0026` từng trôi sang tiêu chí
cấu trúc "không tự mang vòng đời rootTask đầy đủ"; một mình behavior-promise
thì không phân biệt được với tool (tool cũng hứa hành vi). **Tiêu chí phân
định** đổi từ cấu trúc ("không mang vòng đời rootTask đầy đủ") sang
**authority + state effects**. `capacities.<id>` (config) là **bản khai**
của một capacity, không phải bản thân capacity đó — cùng quan hệ giữa
`gitnexus` và dòng registry mô tả nó.

### D17 — T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0

`0026` chưa từng liệt kê rõ T1 có bao nhiêu giá trị — chỉ định nghĩa
`launcher`. `0028` chỉ đổi TÊN vai trò đó (`orchestrator`→`launcher`), chưa
từng đụng tới SỐ giá trị; `tsk-2cw` (đã `cleanup`) tự ghi mục đích thứ hai
trong tiêu đề của nó — *"giải phóng từ orchestrator để dành cho MỤC ĐÍCH
KHÁC"* — rồi để trống, không nói mục đích đó là gì.

Sửa: điền vào đúng chỗ trống đó. `0028` đã lập luận sẵn hai tính chất **độc
lập** của vai trò bên gọi: **arity** (1 đơn vị hay N đơn vị) và
**engagement** (bước ra hẳn — "buông" — hay giữ liên hệ liên tục — "ở
lại"). Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
(N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
hợp thành T0**: N lần dấn thân con (mỗi lần là một `driver`) rồi hợp nhất
kết quả (bằng chứng sống: `fgos-fanout` spawn N Agent, mỗi Agent chạy
`/fgOS:pick` end-to-end — mỗi cái là một `driver`, tổng thể là T0); (N,
buông) = trống **có lý do** — buông N đơn vị cùng lúc thì không còn ai hợp
nhất kết quả, đó chỉ là `launcher` chạy N lần, không phải một vai trò mới.
⇒ **T1 chỉ có hai giá trị.**

## Hệ quả

- `0026` **không sửa tại chỗ nội dung** — chỉ frontmatter thay đổi: dòng
  `superseded_by: 0028` thành `superseded_by: [0028, 0029]`. `0028` và
  `0029` supersede hai phần **không chồng lấn** của `0026` (`0028` = tên gọi
  "orchestrator"→"launcher"; `0029` = ba mệnh đề định nghĩa
  `rootTask`/`subTask`/`capacity`/T1 ở trên), nên cả hai đều cần được trích
  từ record cũ — một `superseded_by` dạng danh sách, không phải ghi đè.
- `docs/decisions/0000-index.md`'s dòng của `0026` nhận thêm ghi chú trỏ tới
  `0029` bên cạnh ghi chú `0028` đã có sẵn.
- Không sửa code trong record này. `rg -n "rootTask|subTask" src/ bin/` vẫn
  còn 2 hit ở `src/runner/dispatch.mjs:649,654` — prose trong docstring mô
  tả cơ chế dispatch còn sống, không phải định danh, và nằm ngoài phạm vi
  record này; dọn lại prose đó (nếu cần) là việc của một item khác.
- Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích thứ hai của
  "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp thành T0.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

## Tham chiếu

- `tsk-5td` — D7, D8, D17 (`fgos show tsk-5td`; `tsk-5td` còn `status:
  doing` trên nhánh riêng `fgw/tsk-5td` tại thời điểm record này được viết,
  nên các quyết định trên chỉ đọc được qua `.fgos` event log dùng chung,
  không qua file `CONTEXT.md` trên nhánh đó)
- `docs/history/dispatch-concept-boundary/DISCUSSION.md` §6.3 (T2 · CẦU),
  §6.4 (T3 · NĂNG LỰC CÓ TÊN — `capacity`), §6.7 (T0 và T1 — vai trò bên
  gọi), §7.1 (Decision doc supersede `0026`)
- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0012` — cạnh parent-child (`work.parent`), nền cho "child work"
