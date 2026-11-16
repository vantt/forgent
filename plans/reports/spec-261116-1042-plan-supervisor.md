# Đặc tả: điều phối plan nhiều tầng (shaper → planner → supervisor → leader)

Trạng thái: **v0, chủ dự án đã duyệt hướng**, chưa có plan thi công. **Chưa cố định**: fgOS đang refactor từ tầng thấp lên
tầng workflow, nên đây là thử nghiệm có đo; mục 12 là một phần của đặc tả, không phải phụ lục. Viết 2026-11-16 từ cuộc thảo luận với chủ dự án (dự án
dùng đầu tiên: `vantt/pkm`). Cơ chế thuộc fgOS; pkm chỉ là nơi dùng.

## 1. Mục tiêu

Session làm việc dài nên tốn token vì context tích luỹ. Muốn: chủ dự án chỉ nói chuyện với hai nơi (shaper để thảo luận,
hàng đợi cần-quyết để duyệt), còn plan đã lập sẵn thì tự được đẩy đi đúng lịch bằng các session ngắn, mỗi session bắt đầu
từ trạng thái trên đĩa chứ không từ trí nhớ.

## 2. Năm vai

| Vai | Sống | Làm | Không làm |
|---|---|---|---|
| **Shaper** | Dài, tương tác, nhiều cái song song (mỗi cái một `DISCUSSION.md`) | Thảo luận với chủ dự án đến khi thống nhất | Viết plan, chạy code |
| **Planner** | Ngắn, một lượt | Đọc `DISCUSSION.md`, lập plan bằng `ak:plan`, ghi dòng vào chỉ mục | Thi hành |
| **Supervisor** | Sống lâu về danh tính; mỗi lượt là session mới | Quét chỉ mục, bật leader, thay leader chết, đẩy việc cần-quyết lên hàng đợi | Đổi nội dung plan, duyệt merge, tag |
| **Leader** | Một plan; thay được giữa chừng | `fgos-cook` nguyên bản: đọc cả plan, mở case, chia slice, kiểm, tích hợp | Merge, sửa trạng thái plan |
| **Worker** | Một slice | Do leader quyết, theo flow `fgos run` | (chủ dự án không cần thấy tầng này) |

## 3. Ràng buộc đã đọc từ fgOS (đổi thiết kế so với bản thảo luận)

1. `fgos-cook` chạy **một plan = một case = một worktree = một nhánh, slice ghi chạy nối tiếp** (land song song chưa
   sẵn sàng). Vậy song song chỉ có **giữa các plan**, mỗi plan một worktree. Không có song song trong một plan.
2. `fgos-cook` cấm leader sửa trạng thái plan và cấm merge. Trạng thái chạy nằm ở `fgos workflow status <caseId>` và
   notebook của case (`fgos convention path --kind report --type cook-notebook`); leader mới tiếp tục từ hai thứ này.
   **Vậy trạng thái chạy không ghi vào plan.** Bản thảo luận "leader ghi trạng thái slice vào plan" bị bỏ.
3. `fgos-cook` đã có sẵn: tự kiểm lại verify của slice, đối chiếu diff với `writes`, bậc thang leo thang (một slice sửa,
   một chẩn đoán, một nâng rigor rồi hỏi), và `milestone-not-recorded`. Không viết lại.
4. fgOS có cả một đường **Work item** (`fgos list/ready/schedule/slots/conflicts/triage/pick`, `mailbox`) giải đúng bài
   chọn việc sẵn sàng, đếm chỗ trống, cảnh báo footprint. `fgos-cook` nói rõ nó **không** đụng Work item. Quyết định
   mở ở mục 8.

## 4. Chỉ mục plan (markdown, sinh ra từ nguồn)

Tham khảo `momentry/plans/board.md` ("plan trước, board sau"; không chép tiến độ lên board) và `scripts/board.mjs` của
`obsidian-pkm-automation` (script đếm tiến độ từ plan, `--check` thoát 1 nếu board cũ).

Một bảng sửa tay chung cho planner (nhiều), supervisor và chủ dự án sẽ đụng nhau khi ghi đồng thời. Nên tách:

| Lớp | Là gì | Ai ghi | Ghi gì |
|---|---|---|---|
| **Nguồn 1** | frontmatter của từng `plan.md` | planner (một file, một người ghi) | ready (`draft`→`ready` ở bước cuối), ưu tiên, phụ thuộc (id plan), footprint, commit gốc |
| **Nguồn 2** | `supervisor-state` | supervisor | leader đang giữ (caseId), kẹt vì gì, đã báo gì |
| **Nguồn 3** | `fgos workflow status` | fgOS | tiến độ thật |
| **Board** | `plans/board.md`, bảng markdown | **script sinh, không ai sửa tay** | ghép ba nguồn trên để người đọc |

Mỗi trường có đúng một nguồn ghi, nên không có xung đột ghi. Script có `--check`: thiếu trường, id lặp, plan không tồn
tại, hai plan `running` trùng footprint, board cũ. Supervisor đọc **nguồn**, không đọc board (board chỉ cho người).
Chưa kiểm: frontmatter của `ak:plan` đã có chỗ cho các trường này chưa (xem `references/output-standards.md`); thiếu thì
planner thêm trường, không đổi `ak:plan`.

Khi plan xong và chủ dự án đã duyệt merge, supervisor lật `status: completed` trong frontmatter **một lần**, sau khi
thấy case đã đóng bằng `fgos workflow close`.

## 5. Supervisor: sống lâu mà không phình

Hai phần:

1. **Bộ kiểm cơ học, không LLM** (script, chạy theo lịch, rẻ): so chỉ mục và trạng thái các case với `supervisor-state`
   lần trước. Không đổi và không leader nào đến hạn kiểm thì thoát, 0 token.
2. **Lượt LLM**: chỉ khi bộ kiểm thấy việc (plan `ready` mới, leader chết hoặc kẹt, có chỗ trống, plan xong, hàng đợi
   đổi). Session mới, đọc chỉ mục + `supervisor-state`, làm một lượt, ghi state, thoát.

`supervisor-state` (nhỏ, một file): lần chạy cuối, bảng plan → caseId → lần thấy sống cuối, số lần thay leader, các mục đã
báo chủ dự án (để không báo lặp).

Trong một lượt supervisor **được**: bật leader cho plan `ready` đủ điều kiện (phụ thuộc xong, không đụng footprint plan
đang chạy, còn chỗ dưới trần song song); thay leader chết hoặc quá hạn bằng leader mới (cùng plan, tiếp từ status +
notebook); ghi hàng đợi cần-quyết. **Không được**: đổi plan, duyệt hay merge, tag, bỏ plan, tự nới frame.

An toàn bắt buộc:
- **Khoá một supervisor một lúc**, có hạn; hết hạn thì lượt sau được chiếm.
- **Mọi thao tác lặp lại không hại**: bật leader cho plan đã có leader = không làm gì.
- **Trần cứng**: số leader song song tối đa; ngân sách token mỗi lượt; hai lượt liền không tiến triển thì dừng và báo.
- **Kiểm lệch trước khi bật**: commit gốc của plan so với HEAD nhánh đích; chạm cùng đường dẫn đã đổi nhiều thì trả
  planner, không cho chạy.
- Nhịp thích ứng: dày khi có leader chạy (bộ kiểm rẻ), thưa khi rảnh.

## 6. Hai luồng gặp nhau ở chỉ mục

```
LUỒNG PLANNING   Shaper(N) ─ DISCUSSION.md ─▶ Planner ─▶ plan + dòng chỉ mục (draft→ready)
                                                              │ (gõ cửa tuỳ chọn: chạm inbox)
LUỒNG THI HÀNH   Supervisor ◀── quét chỉ mục mỗi lượt ────────┘
                    ├─▶ Leader(plan) ─▶ Worker …
                    └─▶ hàng đợi cần-quyết ─▶ chủ dự án
```

Cách chính supervisor biết plan mới là **tự quét chỉ mục**; planner gõ cửa chỉ để bớt độ trễ. Mất tin gõ cửa không mất
việc. Planner đặt `ready` ở bước cuối để supervisor không bắt plan viết dở.

## 7. Hàng đợi cần-quyết

Một file; mỗi mục theo mẫu `_shared/decision-question.md` (năm phần), kèm plan/case liên quan. Nguồn: câu hỏi leader
đã gom (cook gom và hỏi một lần), cổng đồng ý của guide, nâng frame, plan sai, lệch commit gốc. Mục xong thì xoá;
supervisor báo gọn khi hàng đợi đang chặn nhiều plan.

Plan sai giữa chừng: leader dừng, đánh kẹt kèm lý do; supervisor đưa lên hàng đợi; chủ dự án quyết; planner sửa. Leader
không tự đổi mục tiêu hay tiêu chí xong.

## 8. Đã quyết

1. Chỉ mục là markdown; cách sinh từ nguồn ở mục 4 (chủ dự án cho phép đề xuất cách tốt hơn).
2. Supervisor lật trạng thái plan sang `completed` sau khi chủ dự án duyệt merge.

Còn mở: **cơ chế bật session** (S0). Nghiêng về dùng `fgos run` cho supervisor; leader phải là phiên có quyền gọi các
cửa của fgOS, nên chưa chắc chạy được như một Unit của `fgos run`. S0 đo điều này.

## 9. `fgos-coding-shaping`: đã đủ tốt chưa

**Đủ tốt cho vai shaper, cần sửa nhỏ ở cửa thoát.** Giữ nguyên: `DISCUSSION.md` bảy mục, D-ID chỉ khi một điểm đã bền
qua hơn một lượt, ghi `fgos decision` ngay khi bền, §1 viết lại mỗi lượt để tiếp lại sau nhiều ngày, scout trước khi
hỏi, không ép chọn bằng công cụ lựa chọn, một file mỗi tính năng.

Chỗ lệch với thiết kế này:

1. **Cửa thoát cứng vào `fgos-coding-exploring` rồi `fgos-coding-planning`** trong cùng session. Đó là đường Work item,
   không phải `ak:plan` + `fgos-cook`, và nó làm session thảo luận kéo dài thêm. Cần một **chế độ thoát "dừng ở
   DISCUSSION.md, giao planner"**: chốt §6, §7, ghi `refs`, đánh dấu `plan-ready` rồi kết thúc.
2. **§7 chưa có chỗ cho dữ kiện chỉ mục**: footprint dự kiến, phụ thuộc giữa các hạng mục, commit gốc. Thêm vài dòng
   vào mỗi mục §7 để planner chép sang chỉ mục thay vì suy lại.
3. **Mở đầu bắt `fgos pick` (claim + worktree) trước khi viết**: đúng cho đường Work item, thừa cho shaper chỉ để
   thảo luận. Cho phép chạy không claim khi chế độ thoát là "giao planner" (DISCUSSION.md vẫn commit đúng chỗ).

Không cần đổi: quy tắc D-ID, §6 viết lại, `distill`.

## 10. Cỡ việc và thứ tự

Vừa phải; làm được, không cần hoãn. Năm slice, mỗi cái có thể kiểm riêng:

| # | Slice | Kiểm bằng |
|---|---|---|
| S0 | Spike: bật một session leader/supervisor mới từ script (herdr / `claude -p`); đo Work item có làm chỉ mục được không | một lệnh bật được session sạch, đọc được kết quả; kết luận ghi vào DECISIONS |
| S1 | Định dạng chỉ mục + script kiểm (kiểu `board.mjs --check`) | test trên chỉ mục bịa: thiếu trường, trùng footprint, plan không tồn tại |
| S2 | Sửa `fgos-coding-shaping`: chế độ thoát "giao planner" + trường §7 | chạy shaper trên đề bài bịa, ra `DISCUSSION.md` có `plan-ready` |
| S3 | Bộ kiểm cơ học + `supervisor-state` + khoá | test: hai lượt chồng nhau chỉ một thắng; lặp lại không đổi gì |
| S4 | Skill supervisor (mỏng) + hàng đợi cần-quyết | chạy một lượt trên chỉ mục bịa với `fgos-cook` giả: bật đúng leader, không bật plan thiếu điều kiện |

S0 trước vì kết quả quyết S3/S4. S1 và S2 độc lập, chạy song song được. Cổng "chạy thật": một plan nhỏ thật đi hết
chuỗi, **chạy tay supervisor trước** (chủ dự án gõ lệnh một lượt, xem nó làm gì) rồi mới đặt lịch tự động.

## 11. Rủi ro còn lại

- Brief và plan phải tự đủ, nếu không mỗi session mới tốn token nạp lại mà vẫn hỏi lại.
- Chạy nền không ai trông tốn token ngầm: dựa vào trần và dừng khi không tiến triển.
- Chủ dự án là nút cổ chai ở hàng đợi cần-quyết.
- Plan để lâu lệch code: dựa vào kiểm commit gốc.
- Chưa kiểm được: cách bật session (S0), Work item làm chỉ mục được không, `ak:plan` có đủ trường footprint/commit gốc
  không (nếu thiếu, planner thêm vào dòng chỉ mục chứ không đổi `ak:plan`).

## 10b. Tiến độ bản thử (2026-11-16)

Để có sớm cho pkm, bản thử chạy từ `~/.claude/skills/plan-supervisor/`. Từ 2026-11-16 mã nguồn của nó nằm ở
`tools/plan-supervisor/` (cài bằng `install.sh`); chưa là skill của fgOS, chưa qua render và kiểm gốc repo. Ghi chú
cho phiên refactor: `plans/reports/note-261116-1503-plan-supervisor-driver-for-refactor.md`. (Số test và lệnh đã tăng
sau đó: 17 test, thêm `health`, `watch`, `verify`, `event`, `sessions`, `report`.) Trạng thái slice: S1 xong (script + `check`/`render`), S4 bản
tay xong (skill, chưa có hàng đợi dạng file), S0/S2/S3 hoãn. Cùng ngày: `fgctl init` đã chạy trong pkm (v0.2.0-rc.10); `fgos workflow propose` chạy được trên plan pilot `261115-2140-packaging-followups` (phase 1, 3, 4; phase 2 là CI ở repo ngoài, để chủ dự án): ba slice đều rigor `high`, khung 12 lượt/7 lượt ghi, nên plan pkm đi đường nặng (`fgos-cook`). Phát hiện: khoá cấu hình cổng là `runner.capabilities.code:implement.verify`. Chưa mở case thật (cần chủ dự án duyệt khung).
**S0 (kết quả):** `fgos run "<prompt>" --pattern solo` mở được một session Claude sạch, chạy nền, khoảng 17 giây, outcome
`pass`, nhưng **bị giam (bwrap)**: hợp cho lượt supervisor (chỉ đọc, không dispatch), không hợp cho leader (worker bị
giam không được dispatch worker ghi code), nên leader cần một session cấp cao nhất; cách bật nó: thử `claude -p "<brief>" --allowedTools "Bash(fgos:*)"` từ script trong dự án, bật trong khoảng 6 giây và gọi được `fgos` (chưa thử với brief leader thật, cần công cụ rộng hơn); đăng nhập hiện tại hết hạn 2026-11-17 đến 2026-11-20, chạy không người trông cần `claude setup-token`. Đo Work item làm
chỉ mục: chưa làm (đã chọn markdown). **S3 một phần:** khoá một-supervisor-một-lúc có hạn (`lock acquire|release`,
test xanh, 9 test); bộ kiểm cơ học không LLM và lịch vẫn hoãn. **ak:cook:** làm được worker của một slice
(`skills: [ak:cook]`, đã khai trong config máy), không làm leader; thêm vào danh sách đo.

## 12. Đo và quan sát (bắt buộc, làm từ slice đầu)

Mục đích: rút kinh nghiệm từ vận hành thật để chọn flow tốt nhất, vì fgOS còn đổi. Dùng sẵn công cụ quan sát của fgOS,
không dựng hệ đo riêng:

- `fgos metrics case open|close --harness fgos|cook-plan|plain --interventions <N> --verdict usable|fixed|discarded`
  cho mỗi plan chạy thật. `--harness` cho phép so ba cách: chạy đủ bộ này (`fgos`), chạy qua `fgos-cook` (`cook-plan`),
  làm tay một session (`plain`). `metrics harness` cho bảng điểm tổng.
- `fgos friction record` mỗi lần có ma sát (leader chết, plan thiếu thông tin, khoá kẹt, bật session lỗi), kèm tầng
  gây ra (`--layer`) để thấy lỗi nằm ở tầng thấp hay ở thiết kế này.
- `fgos metrics runs/coverage/outcomes` cho tỉ lệ pass/findings/execution-failure theo executor.

Cái cần đo thêm, ghi vào một nhật ký ngắn cạnh `supervisor-state` (mỗi lượt một dòng), vì fgOS chưa có:

| Đo | Để trả lời |
|---|---|
| Token và thời gian mỗi session theo vai (shaper, planner, supervisor, leader) | Mô hình có thật sự rẻ hơn một session dài không (`plain`) |
| Tỉ lệ lượt supervisor bị bộ kiểm cơ học chặn (không gọi LLM) | Bộ kiểm có đáng công không |
| Số lần leader phải thay giữa chừng, và có tiếp tục được không | Plan + notebook có đủ để chạy cold resume không |
| Số lần phải hỏi lại chủ dự án vì plan thiếu, thời gian một mục nằm trong hàng đợi cần-quyết | Chất lượng plan; có phải nút cổ chai ở người không |
| Số lần plan bị trả về planner vì lệch commit gốc | Plan để lâu có hại không; ngưỡng "lệch" có hợp lý không |
| Nhẹ (`workflow start --units`) vs nặng (`fgos-cook`): kết quả, can thiệp, chi phí | Đường chia nhẹ/nặng ở mục 3 có đúng không |
| Số lượt can thiệp tay của chủ dự án | Mức tự động thật sự đạt được |

Cách làm kỷ luật:
1. **Chạy tay trước, đo, rồi mới tự động** (đã có ở mục 10); mỗi plan thật đi qua chuỗi là một mẫu.
2. **Cuối mỗi plan thật, ghi retro ngắn** (làm tốt, ma sát, đổi gì): ba đến năm dòng trong báo cáo của plan.
3. **Mốc xem lại**: sau 3 plan thật, rồi sau mỗi lần fgOS đổi một tầng liên quan (workflow, dispatch, cook), xem lại
   bảng đo và quyết đổi flow bằng một mục `docs/decisions`, không sửa đè.
4. **Giữ các điểm nối mỏng và đổi được**: cách bật session (S0), ngưỡng nhẹ/nặng, nhịp lịch, trần song song, và
   định dạng chỉ mục đều là tham số hoặc một lớp nhỏ, không rải khắp mã. Khi fgOS chuyển sang workflow, phần phải đổi
   là các điểm nối này, không phải cả thiết kế.
5. Không tối ưu sớm: số liệu dưới 3 mẫu chỉ để quan sát, không dùng để đổi thiết kế.
