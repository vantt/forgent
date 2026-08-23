# tsk-66l — Đổi tên status `proposed` → `awaiting-approval`

## Ranh giới feature

Đổi tên giá trị chuỗi `proposed` thành `awaiting-approval` ở mọi nơi dùng chung
từ vựng này trong dữ liệu máy đọc (`work.status` và `outcome.actual.outcome`/
disposition), cộng migration ghi-đè-tại-chỗ cho log lịch sử đã commit dưới
miễn trừ pre-release 0019. KHÔNG bao gồm: thêm tầng chú giải hiển thị riêng
(bị loại theo D6), viết migration script thật (thuộc `fgos-coding-planning`/
`fgos-coding-implement`), sửa `test/fixtures/phase1-events.jsonl`.

## Bối cảnh ban đầu

Item gốc quan sát: status `proposed` khó hiểu với người dùng — không tự
nhiên hiểu là "chờ merge/duyệt" nếu chưa đọc `docs/decisions/0006-trang-thai-
proposed.md`. Đề xuất ban đầu (mô tả item): giữ nguyên giá trị máy đọc, chỉ
thêm chú giải ở tầng hiển thị người-đọc.

Qua thảo luận với người dùng, hướng đổi khác đi: sửa TẬN GỐC tên token thay
vì vá triệu chứng bằng lớp hiển thị — vì bản thân từ `proposed` là lỗi đặt
tên thật (xem D1), không chỉ là thiếu tài liệu.

## Locked decisions

| ID | Quyết định |
|----|------------|
| D1 | Đổi `proposed` → `awaiting-approval`. Lý do: FSM domain-agnostic đã chứng minh qua `test/e2e/synthetic-domain.test.mjs` (domain `synthetic` không dùng git/merge cũng đi qua đúng `proposed`) — tên gắn với "merge" (`awaiting-merge`, `merge-propose`, `merge-ready`) sẽ SAI bản chất vì hardcode ngữ nghĩa domain-coding vào field chung. `awaiting-approval` theo đúng convention `awaiting-*` đã có (`awaiting-human`) mà không hứa hẹn merge. |
| D2 | Rename áp dụng đồng nhất 2 nơi dùng chung từ vựng: `work.status` VÀ `outcome.actual.outcome`/disposition (spec `docs/specs/work-state.md` Data Dictionary #4 và O4 xác nhận cả hai cùng dùng chuỗi `proposed` cho cùng 1 khái niệm — goal-check đạt, chờ quyết định duyệt/từ chối). Đổi một nơi mà bỏ nơi kia sẽ tái tạo đúng khoảng ambiguity giữa 2 field lẽ ra đồng nghĩa. |
| D3 | KHÔNG thêm kiến trúc sub-status. `proposed`/`awaiting-approval` sinh ra vì có hiệu ứng cấu trúc riêng trên dependency graph (deps chỉ mở khi dep `done`, không phải `proposed` — per 0006), khác các gate "chờ duyệt" khác trong pipeline (CONTEXT.md gate ở fgos-coding-exploring, plan.md gate ở fgos-coding-planning) vốn không có hiệu ứng đó nên không có status riêng, resolve ngay trong hội thoại hoặc rơi vào `awaiting-human` sẵn có. Cơ chế phân biệt "nhiều lý do chờ trong 1 status" đã có sẵn: field `reason` (cạnh rời `proposed`) và cặp `ask`/`answer` text (cạnh vào/ra `awaiting-human`) — tái dùng, không cần enum con mới. Quy tắc chung cho tương lai: 1 status cấp cao mới CHỈ khi có hiệu ứng cấu trúc riêng trên frontier/dependency graph; nếu không, gộp vào `awaiting-human`. |
| D4 | Migration bằng **ghi đè tại chỗ** `events.jsonl` (không phải compat-shim vĩnh viễn trong `replay.mjs`), dưới miễn trừ pre-release cho RUL11 đã có tiền lệ (`docs/decisions/0019-mien-tru-viet-lai-nhat-ky.md` — STR46 từng đổi `actor`→`role`/`claimRole` theo đúng cơ chế này). Xác nhận `package.json` version `0.1.0` — miễn trừ còn hiệu lực tới v1.0.0. Phạm vi ghi đè đúng 3 kho 0019 đã khoá: kho `.fgos` sống dùng chung giữa mọi worktree, `dogfood-fixture/`, `fgos-test-drive` — KHÔNG đụng `test/fixtures/phase1-events.jsonl` (bị 0019 loại trừ tường minh, là chuẩn nghiệm thu backward-compat, header tự khai "NEVER regenerated or hand-edited"). Migration phải parse JSON theo field path cụ thể (`status`, cạnh `to`/`from` của `work.move`, `outcome.actual.outcome`) — KHÔNG blind string-replace, vì `proposed` có thể xuất hiện trong text tự do (title/description) không liên quan. |
| D5 | Rà soát mở rộng: item gốc chỉ liệt 6 status (thiếu `wontfix`, status TERMINAL thứ 2 — spec xác nhận có 7 status hợp lệ tổng cộng). Kết luận rà soát: `todo`/`doing`/`blocked`/`done`/`awaiting-human`/`wontfix` giữ nguyên tên — đã tự-giải-nghĩa hoặc có tiền lệ ngành phổ biến (`todo`/`doing`/`wontfix` là thuật ngữ quen thuộc từ GitHub/Jira). Chỉ `proposed` là ngoại lệ duy nhất thiếu khả năng tự-giải-nghĩa trong 7 status. |
| D6 | Bỏ ý tưởng ban đầu "thêm chú giải ở tầng hiển thị" (statusLabel/hint field, hoặc mở rộng `--pretty` sang `list`/`check`). Rename token là đủ — giải quyết tận gốc thay vì vá triệu chứng. Không cần sửa `renderPretty` (hiện chỉ phủ `setup`/`doctor` theo D7 cũ, xem comment `bin/fgos.mjs:2500`), không thêm field JSON mới. |

## Thuật ngữ đã ghim (pinned terms)

- **`awaiting-approval`** — tên token mới thay `proposed`, ở cả `work.status` và `outcome.actual.outcome`/disposition.
- **Miễn trừ pre-release RUL11** (0019) — cho phép ghi đè tại chỗ log đã commit, chỉ trong lúc `package.json` version chưa đạt `1.0.0`.

## Scout đã dẫn chứng

- `bin/fgos.mjs:2500-2611` — xác nhận `renderPretty`/`--pretty` hiện chỉ phủ `setup`/`doctor`; `list`/`check` luôn trả JSON thô, không có tầng hiển thị chữ nào tồn tại sẵn.
- `docs/decisions/0006-trang-thai-proposed.md` — nguồn gốc thiết kế status `proposed`, xác nhận vai trò cấu trúc (gate dependents) là lý do nó tồn tại như 1 status riêng.
- `docs/specs/work-state.md` Data Dictionary #4 (dòng ~44) và O4 (dòng ~82) — xác nhận `proposed` là từ vựng dùng chung giữa `work.status` và `outcome.actual.outcome`.
- `test/e2e/synthetic-domain.test.mjs:24-33,147-202` — chứng minh FSM chung (bao gồm trạng thái `proposed`) là domain-agnostic; domain `synthetic` không dùng git/merge vẫn đi qua đúng `proposed`.
- `docs/decisions/0019-mien-tru-viet-lai-nhat-ky.md` — tiền lệ miễn trừ RUL11 pre-release, đúng cơ chế và đúng phạm vi 3 kho cho việc rename lần này.
- `package.json:3` — `version: 0.1.0`, xác nhận miễn trừ 0019 còn hiệu lực.
- Grep `'proposed'` trong `src/`, `test/`, `docs/` — 239 chỗ, 30+ file (FSM core, runner, toàn bộ test suite, docs) — xác nhận đây là rename xuyên hệ thống, không phải sửa cục bộ.

## Tham chiếu

- `docs/decisions/0006-trang-thai-proposed.md`
- `docs/decisions/0019-mien-tru-viet-lai-nhat-ky.md`
- `docs/specs/work-state.md`

## Câu hỏi còn mở cho planning

- Danh sách chính xác mọi field path chứa giá trị `proposed` cần đổi (ngoài `work.status`/`outcome.actual.outcome`, có thể còn `reason` text tự do, docs prose, error messages trong `bin/fgos.mjs` — cần liệt kê đầy đủ trước khi viết migration script).
- Vị trí thật của kho `fgos-test-drive` trong repo (chưa xác nhận đường dẫn cụ thể — chỉ mới xác nhận `dogfood-fixture/` tồn tại tại root).
- Có cần một migration test riêng (giống `test/state/backward-compat.test.mjs`) để khoá hành vi replay sau khi ghi đè, tương tự cách STR46 đã làm, hay không.
