# Prompt: bật một team điều tra vì sao harness của fgOS vẫn để agent làm tùm lum (RUL11)

Dán nguyên văn (hoặc đưa đường dẫn file này) cho một agent lead mới. Repo `/home/vantt/projects/forgentX`, nhánh `main`. Đây là **điều tra chỉ đọc**: không sửa rules, không sửa AGENTS/CLAUDE, không di chuyển tài liệu. Kết quả là báo cáo có số đo và một đề xuất để anh quyết.

## Vấn đề anh quan sát được

RUL11 (`AGENTS.md`, D-ADR0036: "tùm lum, không phải nặng — gom về một hình dạng, ranh giới rõ, contract tường minh") vẫn còn tàn dư khắp hệ thống. Agent:
- dùng path ngẫu nhiên, đặt tên ngẫu nhiên, không một đường;
- tự phát sinh việc, làm bừa, làm thiếu hoặc làm thừa;
- tự chế xong mới biết đã có sẵn.

Anh nghi ngờ gốc rễ nằm ở **harness**: hệ RULES, AGENTS instruction, tài liệu, catalog skill. Câu hỏi: harness chệch chỗ nào, **thiếu** gì, **thừa** gì gây nhiễu, **mâu thuẫn** ở đâu. Đừng cho rằng agent "ngu": hãy chứng minh nguyên nhân bằng số đo.

## Quan sát hạt giống (em lead phải kiểm chứng, KHÔNG được coi là kết luận)

Đo nhanh ngày 2026-10-06, chưa phân tích sâu:
- Các lớp instruction nạp mỗi phiên: `~/.claude/CLAUDE.md` + `RTK.md` + `~/.claude/rules/*.md` (6 file) + `.claude/rules/*.md` của repo (8 file) + `CLAUDE.md` (6,6 KB) + `AGENTS.md` (17 KB) + `domains/*/AGENTS.md` (6,3 KB). `CLAUDE.md` nạp `AGENTS.md` bằng `@`, và cả hai đều chứa khối GitNexus và khối mdview.
- Rules global và rules của repo **trùng tên, khác nội dung**: `development-rules.md` lệch 7 dòng, `primary-workflow.md` lệch 40 dòng, `documentation-management.md` lệch 64 dòng, `orchestration-protocol.md` lệch 9 dòng; chỉ `review-audit-self-decision.md` giống hệt.
- Hook `UserPromptSubmit` in ra **hai khối "Rules" gần giống nhau mỗi lượt, nói ngược nhau**: một khối nói "Follow YAGNI" mặc định, khối kia nói "KISS/DRY, YAGNI chỉ khi người dùng truyền `--yagni`". Một khối bảo "Plan naming `{date}-{issue}-{slug}`", đặt tên plan `261005-1841-…`; nhưng `ak plan create` thực tế tạo `261005-1143-…` (giờ UTC). Hai nguồn đặt tên, hai kết quả.
- Skill: `.claude/skills` 133 mục (có cả `ak-*` lẫn tên không tiền tố, ví dụ `plan` và `ak-plan`, `cook` và `ak-cook`), `plugins/fgOS/skills` 55, `.agents/skills` 20, `core/skills` 12 (nguồn thật, hai chỗ kia là bản render).
- Tài liệu có nhiều gốc: `docs/specs`, `docs/platform`, `docs/architect`, `docs/decisions` (đã retire một phần), `docs/history` (880 mục), `docs/knowledge`, `docs/journals`, `docs/how-to|reference|tutorials|explanation`, cộng `plans/`, `archive/plans`. Có nhiều quy ước tên báo cáo: `prompt-261001-0955-…`, `observe-…-261005.md`, `red-team-…`, `measurement-audit-260929-1454-…`.
- Trong `~/.claude/projects/-home-vantt-projects-forgentX/memory/` có hàng chục mục feedback dạng "agent đã làm X sai nên đừng làm" (ví dụ "check skill roster before declaring unbuilt", "prior art before design", "phase report Write lands in main checkout"): đây là dữ liệu tần suất sẵn có.

## Quy ước làm việc (bắt buộc)

- Xưng "em", gọi "anh". Không dùng mày/tao. Báo cáo ngắn, nói thật; cái gì chưa chứng minh được thì ghi UNPROVEN.
- Chỉ đọc. Không tạo work item; không dùng `fgos submit/pick/move/approve`. Không sửa file nào ngoài `plans/reports/` và `plans/261006-…/` (nếu cần working notes). Không push.
- Không đọc/in `.fgos/secrets.local.env` hay credential. Khi đọc transcript phiên (`~/.claude/projects/**/*.jsonl`), chỉ trích dẫn đoạn cần, **redact** khóa/token/đường dẫn nhạy cảm.
- Dùng `node bin/fgos.mjs` (không dùng hàm shell `fgos`). Trước khi gọi Agent/Task: `node bin/fgos.mjs dispatch decide --for review --needs-soul --has-live-task-access` (kết quả `in-process` thì dùng Agent). Không chạy `npm test`. Không bật pane/dispatch ngoài việc spawn agent con.
- Mỗi agent con nhận: nhiệm vụ, file được đọc, nơi ghi báo cáo (`plans/reports/`), tiêu chí hoàn thành, và đuôi trạng thái `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`. Không đưa toàn bộ lịch sử chat; đưa đường dẫn cụ thể.
- Mọi nhận định phải có bằng chứng: `file:line`, lệnh + kết quả, hoặc trích transcript đã redact, hoặc số đếm. Nhận định không có bằng chứng bị loại.

## Team cần bật (đề nghị, lead được điều chỉnh nhưng phải nói lý do)

Dùng skill `ak-team` (hoặc spawn Agent song song). Năng lực quan trọng hơn số lượng; tránh quá 6 agent song song.

| # | Vai | Năng lực/Model | Câu hỏi nó phải trả lời |
|---|---|---|---|
| 1 | **Nhà khảo cổ** | sonnet, giỏi `git log -S/-G` | RUL11 và các rules hiện hành ra đời khi nào, vì sao, cái gì từng có rồi bị gỡ (rules, skill, tài liệu, plan system), việc gỡ có chủ ý không? Có tàn dư của hệ cũ (claudekit/`ck:`, `ak:`, `bee`, coordination engine, `docs/decisions/*.md` đã retire) còn gây nhiễu không? |
| 2 | **Kiểm toán lớp instruction** | opus | Mỗi phiên agent thực sự nạp những gì (đo byte/ước lượng token từng lớp, thứ tự, trùng lặp, **mâu thuẫn** giữa các lớp và giữa các hook). Quy tắc nào chỉ là văn xuôi, quy tắc nào được cơ khí hóa. Cái gì bị chôn quá sâu để agent thấy. Cái gì thừa. |
| 3 | **Kiểm toán path/tên/tài liệu** | sonnet | Quy ước đặt path và tên file cho plan, report, doc, journal, prompt: mỗi nơi định nghĩa quy ước nào, các nơi có nhất quán không? Đo **tỷ lệ lệch** thật từ git (script: file `.md` ngoài `plans/` và `docs/`, mẫu tên, trùng chức năng, thư mục mồ côi, báo cáo cùng chủ đề nhiều bản). Có "hệ đăng ký tài liệu" (`doc-registry`, `reading-map`) mà agent không tra không? |
| 4 | **Kiểm toán catalog skill/công cụ** | sonnet | 200+ skill ở 4 cây: trùng chức năng, tên chồng (`ak-*` vs không tiền tố vs `fgOS:`), mô tả đè nhau, cái nào chết/không ai gọi. Agent có tìm thấy năng lực sẵn có trước khi tự chế không (đo bằng ca "tự chế xong mới biết có rồi" trong lịch sử). Nguồn thật vs bản render có rõ không. |
| 5 | **Pháp y hành vi** | opus | Lấy mẫu có hệ thống 30-50 tình huống thật (transcript phiên, plan/report có chữ "finding/đã có sẵn/tự chế/nhầm", mục memory feedback) và phân loại từng ca theo mô hình: *thiếu rule / rule bị chôn / rule mâu thuẫn / rule chỉ là văn xuôi không có cơ chế / rule đủ rõ nhưng bị bỏ qua / nhiễu quá tải ngữ cảnh*. Báo tỉ lệ từng loại. Đây là agent quan trọng nhất: nó biến cảm giác thành số. |
| 6 | **Kiểm toán cưỡng chế** | opus | Mỗi bất biến RUL11 muốn bảo vệ (một nguồn path, một cửa tên, tra có sẵn trước khi tạo): hiện có hook/test/doctor nào ép? (ví dụ `check-decision-codes`, `architecture-manifest`, hook chặn Agent/`dispatch decide`, doctor check). Chỗ nào chỉ là văn xuôi nên thành kiểm tra cơ học. Đề xuất theo hình dạng "gom về một chỗ". |
| 7 | **Phản biện độc lập** | opus (hoặc fable nếu có) | Không tham gia điều tra. Nhận báo cáo của 1-6 và phá: giả thuyết thay thế, độ tin cậy của mẫu, có phải triệu chứng chứ không phải nguyên nhân, đề xuất nào làm tăng độ phức tạp (trái RUL11). |

Lead tổng hợp, không tự làm thay các vai. Bất đồng giữa các agent phải được ghi lại, không "làm tròn".

## Cách điều tra (phương pháp)

1. **Đo trước, kết luận sau.** Viết script đếm (lưu trong `plans/reports/harness-investigation-261006/`): kích thước/đoạn trùng của các lớp instruction, danh sách file `.md` theo thư mục và mẫu tên, số skill trùng mô tả, số mục feedback theo loại lỗi.
2. **Giả thuyết có thể bác bỏ.** Mỗi giả thuyết ghi rõ "nếu đúng thì sẽ thấy gì, nếu sai thì sẽ thấy gì", rồi tìm cả hai. Ví dụ: "mâu thuẫn giữa hai khối rules của hook làm agent chọn ngẫu nhiên" → tìm ca thật có hành vi tương ứng.
3. **Phân biệt ba thứ:** thiếu (agent không có thông tin), thừa/nhiễu (có quá nhiều thông tin, hoặc thông tin mâu thuẫn), và không cưỡng chế (có thông tin đúng nhưng không gì ép). Đề xuất khác nhau cho từng loại.
4. **Thử độ nhiễu bằng thực nghiệm nhỏ nếu rẻ:** cùng một việc nhỏ cho 2-3 agent con với bộ instruction khác nhau (ví dụ chỉ `AGENTS.md`, hay đủ mọi lớp), đo độ lệch path/tên/tự chế. Chỉ làm nếu quota cho phép; nếu không thì ghi là chưa thử.
5. **Kiểm tra chéo với quyết định đã chốt:** đọc `docs/specs/platform-foundations.md` (D-ADR0035/0036), `docs/doc-governance.md`, `docs/specs/reading-map.md`, `docs/distillery/` về những gì đã học từ nguồn ngoài. Không đề xuất đảo ngược quyết định đã chốt mà không nêu theo luật "User Decisions" (quyết định gốc, mối lo, đánh đổi, phương án).

## Đầu ra

1. `plans/reports/harness-investigation-261006-synthesis.md` (lead). Cấu trúc cố định:
   - **Vấn đề thật là gì**, kèm tỉ lệ từng loại lỗi từ pháp y hành vi (con số, cỡ mẫu, giới hạn).
   - **Bản đồ harness hiện tại** (lớp nào nạp gì, bao nhiêu byte, ai thắng khi mâu thuẫn).
   - **Thiếu / Thừa / Mâu thuẫn / Không cưỡng chế**: bốn danh sách có bằng chứng.
   - **Cái gì tốt, giữ nguyên** (để đề xuất không phá cái đang chạy).
   - **Đề xuất nhỏ nhất đạt hiệu quả**, theo hình dạng RUL11 (gom về một chỗ, một cửa, contract rõ): mỗi đề xuất ghi tác động kỳ vọng, cách kiểm chứng đo được, rủi ro, và thứ gì bị xoá. Xếp theo tác động. Cấm đề xuất chỉ thêm quy tắc mới mà không nói bỏ cái gì.
   - **Quyết định cần anh** (mỗi cái có phân tích lợi/hại và khuyến nghị) và **UNPROVEN**.
2. Báo cáo riêng của từng vai trong `plans/reports/harness-investigation-261006/` (tên `<vai>-261006.md`).
3. Báo cáo phản biện độc lập của vai 7, kèm phần lead trả lời từng điểm.
4. Cuối cùng, báo anh bằng một đoạn ngắn: kết luận chính, 3 đề xuất tác động lớn nhất, và điều anh cần quyết.

## Tiêu chí hoàn thành

- [ ] Có số đo tỉ lệ từng loại lỗi từ ít nhất 30 ca thật, kèm cách chọn mẫu và giới hạn.
- [ ] Có bản đồ nạp instruction đo được và danh sách mâu thuẫn cụ thể (file:dòng) giữa các lớp, gồm hai khối rules của hook.
- [ ] Mỗi nhận định chính có bằng chứng; phần không chứng minh được ghi UNPROVEN.
- [ ] Đề xuất đều giảm số nguồn/chỗ/quy ước (không tăng), có cách kiểm chứng đo được.
- [ ] Phản biện độc lập đã chạy và được trả lời.
- [ ] Không file nào ngoài `plans/reports/` và `plans/261006-…/` bị đổi; không commit nếu anh chưa nói.

## Không làm

- Không sửa/xoá/di chuyển bất kỳ rules, AGENTS, CLAUDE, skill, tài liệu nào. Đề xuất thôi.
- Không biến việc này thành kế hoạch triển khai lớn; chỉ khi anh duyệt đề xuất mới lập plan riêng.
- Không viết thêm một lớp "quy tắc về quy tắc". Nếu kết luận là cần thêm, phải kèm cái gì bị bỏ.
