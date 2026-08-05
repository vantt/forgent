# tsk-2jc — closure note

Milestone: `docs/specs/distribution.md` phản ánh đúng thực tại sau vision
cài đặt/setup/doctor. `goalTier: milestone`, `targets: [tsk-1qm]`, thuộc MVP
`tsk-4bc`. Settled-learning checkpoint theo AGENTS.md Definition-of-done #6 —
không phải code release, nên không có test riêng cho chính milestone này.

## Milestone giao được gì

Thực tại cũ mà spec từng mô tả — `fgos doctor --fix` là "Deferred Idea, does
not exist yet", và doctor có một danh sách 3 check cố định — đã biến mất khỏi
`docs/specs/distribution.md`:

- **RUL11** (dòng 216-224) nay nói `fgos doctor --fix` tồn tại và là thật:
  chạy mọi fix đăng ký qua `registerFix` trước khi re-report checks, trả về
  cùng shape với đường không cờ cộng thêm mảng `fixed`. Wording v1 "does not
  exist yet, Deferred Idea" được supersede tường minh, dẫn nguồn `tsk-2qz` D2
  và `docs/distribution-vision.md` §3 trụ cột 3.
- **RUL9** (dòng 201-209) nay ghi `--fix` là ngoại lệ có chủ đích của luật
  "doctor không bao giờ ghi gì" — đảo lại wording no-exceptions ban đầu, cùng
  một D2.
- **Data Dictionary #7** (dòng 46) nay mô tả doctor check là registry mở rộng
  được (`src/setup/registrations.mjs`'s `registerCheck`), không phải danh sách
  cố định, kèm 9 check đang đăng ký thật.
- **Data Dictionary #7b** (dòng 47) là mục mới cho doctor fix — cũng là
  registry, độc lập với `registerCheck`/`registerConfigDefault` (`tsk-2cs` D2).
- **Open Gaps** (dòng 251-256) đã đóng: `--fix` không còn là gap.

## Bằng chứng

Đối chiếu trực tiếp spec với source, không dựa vào lời khai:

- 9 `registerCheck` id trong `src/setup/registrations.mjs` —
  `node-version-and-git`, `shell-integration-sourced`, `config-not-stale`,
  `main-checkout-hook-wired`, `tool-registry-configured`, `root-drift`,
  `config-awareness`, `dependencies-installed`, `gate-bypass-configured` —
  khớp đúng và đúng thứ tự với danh sách trong Data Dictionary #7.
- Một `registerFix` duy nhất (`gate-bypass-configured`) khớp #7b.

Commit thật đã đưa nội dung lên `main`:

- `c9e4a00` docs(tsk-1qm): supersede RUL9/RUL11 + rewrite Data Dictionary #7
  for real doctor --fix
- `452d940` merge `fgw/tsk-1qm`
- `75e3965` bổ sung `root-drift` vào danh sách #7 (check được đăng ký sau khi
  tsk-1qm chốt spec — drift nhỏ còn sót, phát hiện trong audit 2026-08-03)

## Quyết định khi đóng milestone

**D1 — nới điều kiện done từ "tsk-1qm = done" sang "tsk-1qm đã resolved".**

`verify` gốc của item là văn xuôi: "Done when tsk-1qm reaches done — RUL11 +
Data Dictionary #7 của distribution.md không còn mô tả thực tại cũ". Hai vấn
đề khi đóng:

1. `tsk-1qm` đang ở `cleanup` (vào lúc `2026-08-02T15:27:44Z`), không phải
   `done`. TTL cleanup mặc định 7 ngày (`DEFAULT_CLEANUP_TTL_DAYS = 7`,
   `src/setup/registrations.mjs:545`, không có override trong
   `.fgos/config.json`), nên `/fgOS:cleanup-next` sớm nhất chỉ đẩy được nó lên
   `done` vào `2026-08-09T15:27Z`. Đây là bước sweep cơ học cuối chuỗi
   `delivered -> retrospective -> cleanup -> done`, không phải nội dung chưa
   xong.
2. `verify` là văn xuôi nên không chạy được. `runGoalCheck`
   (`src/runner/goal-check.mjs:23`) spawn thẳng chuỗi đó qua shell — câu tiếng
   Việt sẽ fail như lệnh sai và đẩy item sang `blocked`, đúng cái bẫy
   `docs/how-to/close-out-a-goaltier-milestone-after-all-targets-are-done.md`
   mô tả.

Người chọn: đóng ngay, không chờ TTL. `verify` mới chấp nhận `tsk-1qm` ở bất
kỳ status nào trong chuỗi đuôi đã resolved — `delivered`, `retrospective`,
`cleanup`, `done`. `wontfix` **không** tính: đó là hủy, không phải giao xong.

Lý do nới là hợp lệ ở đây: điều kiện thực chất của milestone là *nội dung spec
khớp thực tại*, còn `tsk-1qm = done` chỉ là cách viết tắt cho "target đã giao
xong". Trạng thái `cleanup` đã chứng minh target giao xong rồi (nó đã qua
`delivered` và `retrospective`); phần còn lại thuần là bookkeeping TTL.

**D2 — verify mới kiểm nội dung, không chỉ đọc status tracker.**

Nếu chỉ kiểm status của `tsk-1qm` thì verify sẽ rỗng nghĩa với chính điều
milestone khẳng định. Nên `verify` gồm 4 mệnh đề, mỗi mệnh đề đã được thử tay
cả chiều pass lẫn chiều fail trước khi ghi lên item:

1. `tsk-1qm` ở một trong 4 status đã resolved (D1).
2. RUL11 khẳng định `--fix` là thật.
3. Cả #7 và #7b đều mô tả "not a fixed list".
4. Mọi id đăng ký qua `registerCheck` đều có mặt trong spec — mệnh đề này bắt
   đúng loại drift mà `75e3965` phải vá, nên lần sau nó tự đỏ thay vì phải chờ
   một audit thủ công.

Verify chạy trong worktree rời do `fgos return` dựng, và worktree đó không bao
giờ mang `.fgos/` riêng (ADR0020) — nên lệnh `fgos` bên trong `verify` bắt
buộc mang `--dir` tuyệt đối, đúng cảnh báo của how-to.
