# DISCUSSION — quản trị việc sửa AGENTS.md/CLAUDE.md/skill prose

## 1. Trạng thái hiện tại

Vòng 1. Chưa có D-ID nào chốt. Đã scout xong tiền lệ trực tiếp trong repo
(`tsk-4l9`) — đã bác bỏ nửa "fresh-rerun harness tự động" của ý tưởng gốc,
có bằng chứng cụ thể. Phần "gate cấm sửa ngoài đường tường minh" (ai được
sửa AGENTS.md/CLAUDE.md/skill prose, lúc nào) thì CHƯA có tiền lệ — vẫn mở.
Đang chờ người quyết hướng đi tiếp trước khi mint D-ID đầu tiên.

## 2. Mục tiêu & đề bài

Từ một phiên distill quét upstream `repository-harness`: dự án đó có skill
`$improve-harness` — sửa AGENTS.md/skill guidance chỉ được phép qua lời gọi
tường minh của người, bắt buộc viết statement tiên đoán dạng "nếu thêm X tại
owner Y thì agent mới sẽ Z, vì M" TRƯỚC khi sửa, và bắt buộc chạy lại bằng
một phiên agent hoàn toàn độc lập SAU khi sửa để chứng minh cải tiến thật
trước khi được giữ (Keep/Revise/Remove). Người dùng forgentX nêu đúng nỗi
đau: hiện tại prose "tự phát sinh" vào AGENTS.md/CLAUDE.md như tác dụng phụ
của việc làm bình thường, không qua cổng nào — sợ nếu không quản trước sẽ
tùm lum như quan sát được ở một số dự án khác. Câu hỏi mở: forgentX có nên
mang cơ chế `$improve-harness` về không, mang phần nào, và mang dưới hình
dạng gì cho phù hợp với bối cảnh forgentX (ưu tiên Ship Faster > DoD > Polish
theo `docs/decisions/0025`) thay vì bê nguyên khối.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Có nên xây "runtime harness tự động spawn phiên LLM độc lập để verify mỗi lần sửa skill/instruction prose"? | **Rõ — đã có tiền lệ bác bỏ trong chính repo này** | `tsk-4l9` D1/D4: quyết không xây, dùng structural positive/negative verify + smoke-test how-to + quan sát thụ động `.fgos/events.jsonl` thay thế. Lý do bác: `fgos setup` không cài plugin nên harness phải tự chế phần cài, nondeterminism, chi phí token, không có trigger ép chạy. |
| 2 | Có nên có MỘT GATE cấm sửa AGENTS.md/CLAUDE.md/`.claude/skills/**/SKILL.md`/`plugins/fgOS/skills/**/SKILL.md` như tác dụng phụ ngầm của việc khác (khác hẳn câu hỏi verify ở #1)? | Chưa rõ | repository-harness's AGENTS.md tự có câu luật này ("chỉ sửa guidance khi được yêu cầu tường minh dùng `$improve-harness`"); forgentX hiện KHÔNG có câu tương đương nào trong CLAUDE.md/AGENTS.md hiện tại (đã đọc — không thấy). Đây có phải đúng cơ chế đang thiếu, hay `tsk-4l9`'s phạm vi đã ngầm che luôn phần này? |
| 3 | Nếu có gate, gate đó là PROSE (một câu luật trong AGENTS.md, agent tự tuân theo) hay CƠ HỌC (hook/check chặn thật, như `tsk-4l9` đã có xu hướng chọn structural-verify hơn prose-only)? | Chưa rõ | Cần cân nhắc: repo này có sẵn hạ tầng hook/verify (`.githooks`, `fgos doctor` check registry) — gate cơ học rẻ hơn ở forgentX so với ở một repo chỉ có markdown thuần. |
| 4 | "Sửa CÓ TRỌNG LƯỢNG" (đổi hành vi agent rõ rệt) khác "sửa nhỏ" (rewording/typo) ở đâu, ai/cái gì phân loại? | Chưa rõ | Câu hỏi gốc người dùng tự nêu ("chỉ áp fresh-rerun cho sửa có trọng lượng"), nhưng phân loại theo tiêu chí gì chưa bàn. |
| 5 | Liên hệ với `porting-log`'s field `Outcome` (predicted→actual, đã có cho porting candidate) và `fgos-coding-compounding`'s retrospective loop — có nên tái dùng 2 cơ chế đó thay vì dựng thêm cái thứ 3? | Chưa rõ | Cả hai đã tồn tại, phục vụ mục đích gần giống (đo lường "cải tiến có thật không" sau khi làm) nhưng cho đối tượng khác (porting candidate / retrospective của work item, không phải sửa AGENTS.md trực tiếp). |
| 6 | Phạm vi ban đầu: chỉ AGENTS.md/CLAUDE.md gốc, hay cả `.claude/skills/**`, `plugins/fgOS/skills/**`, `docs/decisions/`? | Chưa rõ | `tsk-4l9` định nghĩa "skill prose" hẹp = `SKILL.md` các loại. Câu hỏi gốc của người dùng nói rộng hơn ("AGENTS.md/CLAUDE.md/skill instruction"). |

## 4. Quyết định đã chốt

(chưa có — vòng 1, chưa D-ID nào giữ vững qua >1 vòng)

## 5. Q&A log

**[Vòng 1]** Scout ban đầu (trước khi hỏi gì): đọc `docs/history/skill-prose-verify-standard/CONTEXT.md` (`tsk-4l9`, status `cleanup`) — phát hiện phần "fresh-rerun bằng phiên agent độc lập" của ý tưởng gốc đã có một quyết định rất gần, đã bị bác bỏ có bằng chứng cụ thể trong CHÍNH repo này, không phải giả định. Trích nguyên văn 2 quyết định liên quan:

> D1: `tsk-4l9` thu scope: **không** xây runtime verify harness.
> D4: Nhu cầu harness bị bác bởi bằng chứng thật: 103 event `discovery caller-supplied` sau khi merge, cộng việc smoke-test how-to đã là đúng cơ chế mô tả (spawn phiên chạy skill trên item test cố định, assert state đổi).

Và lý do cụ thể tại sao không phải harness tự động (trích): "`fgos setup` không cài plugin... harness chạy plugin skill trong repo mkdtemp sẽ phải tự chế phần cài plugin, dễ trôi phiên bản. Cộng nondeterminism + chi phí token + không có trigger buộc chạy."

Grep toàn `.fgos/` work items cho từ khoá liên quan ("improve-harness", "prose creep", "fresh-rerun", "instruction... improve/verify/wording") — không có item nào đang mở về đúng chủ đề này. Không trùng lặp công việc.

**Câu hỏi cho vòng 2:** Với tiền lệ D1/D4 của `tsk-4l9` đã bác bỏ đúng phần "harness tự động rerun", bạn còn muốn giữ ý "fresh-rerun bằng phiên agent độc lập" ở dạng nào — hay đồng ý bỏ hẳn phần đó và chỉ tập trung vào phần #2 (GATE cấm sửa ngoài đường tường minh, chưa có tiền lệ, vẫn mở)? Và nếu giữ gate, bạn nghiêng về gate PROSE (câu luật trong AGENTS.md) hay gate CƠ HỌC (hook/check thật, tận dụng `.githooks`/`fgos doctor` đã có sẵn)?

## 6. Thiết kế đã chốt {#design}

(chưa đủ hình hài — chờ vòng 2)

## 7. Danh mục hạng mục / task {#tasks}

(chưa tách — chờ §6 ổn định)
