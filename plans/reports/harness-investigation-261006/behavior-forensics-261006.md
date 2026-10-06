# Pháp y hành vi: 57 ca agent làm sai, phân loại theo lớp harness

- Vai: Pháp y hành vi (vai 5), điều tra chỉ đọc, 2026-10-06.
- Brief: [prompt-261006-0955-investigate-harness-drift-rul11.md](../prompt-261006-0955-investigate-harness-drift-rul11.md)
- Bảng ca đầy đủ (CSV): [behavior-forensics-cases-261006.csv](behavior-forensics-cases-261006.csv)
- Script: [forensics-extract-corrections.py](forensics-extract-corrections.py), [forensics-show-context.py](forensics-show-context.py)

## 1. Kết luận ngắn

- Mẫu: **57 ca thật**, 54 ca có độ tin cao/vừa. Tỉ lệ theo lớp chính: thiếu rule (A) **37%**, rule mâu thuẫn (C) **14%**, rule bị chôn (B) **7%**, chỉ có văn xuôi (D) **2%**, nhiễu ngữ cảnh (F) **4%**, rule rõ nhưng bị bỏ qua (E) **12%**, không phải harness (G) **25%**.
- Gộp lại: **harness 63%** (A+B+C+D+F), **model 12%** (E) cộng 2 ca model nằm trong G, **tooling/hạ tầng khoảng 21%**.
- Lỗi điển hình là **thiếu rule tại thời điểm xảy ra**, rồi được vá bằng một mục memory văn xuôi. Quá tải ngữ cảnh chỉ có 2 ca (F), nên giả thuyết "nhiễu" có ít bằng chứng hành vi. Mâu thuẫn (C) thì tập trung đúng vào triệu chứng path/tên/cửa vào.
- **D chỉ đứng thứ cấp nhưng xuất hiện ở 14/57 ca**. Gần như mọi bài học đều kết thúc thành văn xuôi (memory, docs/knowledge, docs/history), ít khi thành cơ chế. Vì vậy ca A hôm qua trở thành ca B/D hôm nay.

## 2. Cách lấy mẫu, quy mô quần thể, giới hạn

| Nguồn | Quần thể | Cách chọn | Số ca lấy |
|---|---|---|---|
| Memory `~/.claude/projects/-home-vantt-projects-forgentX/memory/` | 60 mục (trừ `MEMORY.md`) | **Điều tra toàn bộ**: đọc cả 60 mục, lấy mọi mục mô tả một hành vi sai cụ thể. Loại 22 mục: 4 mục là cấp quyền (iron-law ×2, unattended-merge, fgos-move-exception), 2 mục là sở thích (kongming, cleanup-batched), 8 mục là trạng thái track hoặc quy ước, 4 mục là sự cố hạ tầng mà agent không làm sai (claude-executor-sandboxed, maxrounds, tmp-inode, node_modules-symlink), và 4 ca có bằng chứng yếu (M26 ps-sandbox, M28 nguyên nhân đã bị re-check 2026-09-30 ghi "unattributed", M31 agent làm đúng, M41 không nêu ca cụ thể). | 38 |
| Transcript `~/.claude/projects/-home-vantt-projects-forgentX/*.jsonl` | 205 phiên, **1.806 lượt người gõ** | Regex 23 mẫu sửa sai (vi/en) trên lượt người gõ, loại tool_result/command/system-reminder và lượt dài hơn 4.000 ký tự. Được 41 ứng viên (2,3%). Đọc ngữ cảnh từng ca, giữ những ca có hành vi sai rõ và không trùng memory. Phần lớn ứng viên bị loại vì là nội dung dán từ agent khác hoặc thảo luận thiết kế. | 11 |
| Git `main` | 7.335 commit từ 2026-08-01 | `git log` grep `revert/accidental/stray/duplicat/restore/...` được khoảng 70 dòng. Lấy những commit mà message hoặc diff chứng minh agent làm sai. | 6 |
| `docs/history`, `plans/` | 504 file khớp `tự chế/reinvent/re-deriv/đã có sẵn/...` | Đọc các dòng khớp "tự chế/reinvent", giữ ca có hành vi thật. | 2 |

Giới hạn (cần đọc trước khi tin số):

1. **Không phải mẫu ngẫu nhiên.** Memory là phần người dùng và agent *chọn* ghi lại, nên thiên về lỗi nổi bật, lặp lại và lỗi git/worktree, đồng thời bỏ sót lỗi âm thầm không ai bắt. Đây là lỗi *được phát hiện*, không phải mọi lỗi.
2. Regex transcript bỏ sót nhiều câu sửa sai không chứa từ khoá. Recall chưa đo (UNPROVEN).
3. **Một người chấm** (em), không có kiểm chéo giữa nhiều người chấm. Lớp A và E dễ lẫn khi không biết rule đã tồn tại vào ngày xảy ra ca. `.claude/rules/` và `~/.claude/rules/` không nằm trong git nên **không xác định được ngày ra đời** của chúng. Những ca dựa vào hai file này được ghi med/low.
4. Lớp "A" tính theo **thời điểm xảy ra ca**. Nhiều ca A sau đó đã có memory hoặc rule (xem §5).
5. Runtime của các doer ở T01–T04 và T07 (agy/codex hay claude) chưa xác minh. Riêng T01–T03 có dấu hiệu là Antigravity, vì dùng tool `replace_file_content`, `write_to_file`.

## 3. Định nghĩa lớp dùng khi chấm

- **A, thiếu rule**: lúc xảy ra, không lớp nào nói gì về tình huống đó.
- **B, rule bị chôn**: rule có, nhưng nằm ở nơi agent không nạp lúc quyết định (memory body, `docs/knowledge`, `docs/history`, hoặc lớp chỉ Claude nạp).
- **C, mâu thuẫn**: hai nguồn trong harness nói khác nhau cho cùng tình huống.
- **D, chỉ văn xuôi**: rule có và đã được nạp, nhưng không cơ chế nào ép, và chính việc thiếu cơ chế là nguyên nhân chính.
- **E, rule rõ nhưng bị bỏ qua**: rule rõ, đã nạp, không mâu thuẫn, agent vẫn làm sai.
- **F, nhiễu ngữ cảnh**: thông tin đúng có trong ngữ cảnh nhưng bị chìm.
- **G, không phải harness**: model, công cụ (Claude Code, git, rtk), hoặc bug hạ tầng hay sản phẩm.

Triệu chứng: **P** path/tên/cửa vào sai; **I** tự phát sinh việc hoặc tự bịa finding; **O** làm thừa; **U** làm thiếu; **R** tự chế lại thứ đã có; **X** khác (an toàn git, giao tiếp).

## 4. Bảng ca

Chi tiết (nguồn, file:dòng của rule, lý do) nằm trong CSV. Bảng dưới là bản rút gọn.

| ID | Ngày | Việc sai | Lớp | Phụ | Tr.chứng | Tin |
|---|---|---|---|---|---|---|
| M01 | 07-31 | Xưng mày/tao | A | C | X | med |
| M02 | 08-18 | Hỏi "anh cần gì" mà không có phân tích | E | D | U | med |
| M03 | 09-10 | Dừng giữa chuỗi artifact, round timeout bị chấm failed | E | D | U | med |
| M04 | 09-04 | `git branch -f` làm worktree khác lệch | G | A | X | high |
| M05 | 08-14 | Kết luận "chưa có" trong khi `fgos-clarifying` nằm sẵn trong skill list | F | B | R | high |
| M06 | 08-20 | `approve/SKILL.md` ngược với `merge-loop` nên phải hỏi người | C | | U | high |
| M07 | 09-03 | Tạo worktree trước khi commit `current-cell.md` | A | G | P | high |
| M08 | 09-10 | Sửa chưa commit bị phiên khác xoá | G | | X | high |
| M09 | 09-03 | cwd trôi, `git add -A` gom nhầm file | G | D | P | high |
| M10 | 09-17 | Ví dụ trong skill thiếu `grantedContextRefs` nên engine từ chối | C | | U | high |
| M11 | 08-13 | Hỏi lựa chọn giả dù đã có đáp án | C | E | U | med |
| M12 | 08-18 | Chạy baseline sai tham số, suýt xoá khoảng 785 mục | A | D | O | high |
| M13 | 09-18 | Hỏi "tiếp P01?" trong track đã đặc tả đủ | E | C | U | high |
| M14 | 08-24 | Tự `git merge` thay vì dùng `fgos catchup` | B | D | R | med |
| M15 | 09-18 | gemini ngồi chờ, tự nhận "tests pass" sai | G | | U | high |
| M16 | 08-27 | Mỗi lần thức lại phát lại ngữ cảnh dài, tốn token | A | | O | med |
| M17 | 09-15 | Đổi nhánh trên main checkout dùng chung (tái phát, đã có tsk-4hk) | B | D | P | high |
| M18 | 09-18 | Lead commit trong worktree của assignment đang chạy | A | D | O | high |
| M19 | 09-28 | Report ghi vào main thay vì nhánh phase | C | | P | high |
| M20 | 08-20 | Đọc sai exit code khi chạy `cmd \| tail` | G | | U | med |
| M21 | 10-02 | Dựng lại confined herdr hàng giờ, dù đã có từ trước | A | B | R | high |
| M22 | 09-10 | Pane idle chặn dispatch | A | G | U | med |
| M23 | 08-26 | `rtk proxy fgos` chạy binary global cũ | C | G | P | high |
| M24 | 08-18 | rtk nén output, đổi tên identifier trong output grep | G | F | X | med |
| M25 | 09-23 | rtk cắt input, `rm` chỉ chạy một phần | G | | U | high |
| M27 | 08-14 | Lập plan cho item đã bị hoãn bằng quyết định khác | A | B | I | high |
| M29 | 08-24 | Vá tay lặp lại, không file bug | A | | U | med |
| M30 | 09-18 | Gọi binary main cho tính năng chỉ có trên track | A | C | P | high |
| M32 | 09-05 | Sửa render target `.agents/skills` thay vì `core/skills` | C | D | P | high |
| M33 | 08-26 | agy commit vào nhánh của item khác | G | | P | high |
| M34 | 09-06 | Tin snapshot upstream cũ, kết luận "không có inbox" | A | B | U | med |
| M35 | 09-21 | Plan dẫn tới cơ chế proof không thể chạy với file thật | A | E | O | low |
| M36 | 08-26 | `dispatch execute` thiếu `--cwd`, commit rơi vào main | A | G | P | med |
| M37 | 08-19 | Pin race, ghi đè lên main checkout | G | A | P | high |
| M38 | 08-12 | Con trỏ worktree nhảy giữa các driver | G | A | P | high |
| M39 | 08-10 | Người dùng phải giảng lại hai luật lõi | A | | X | med |
| M40 | 09-09 | Hai commit lật qua lật lại expectation của một test | G | E | O | high |
| M42 | 09-11 | Shell fn `fgos` chạy release cũ | G | C | P | high |
| T01 | 09-22 | Doer revert commit Q5 đã có trên main | E | B | O | med |
| T02 | 09-23 | 28 script `patch_*.cjs` ở gốc repo, có bị commit | A | D | P | high |
| T03 | 09-23 | Cửa hậu `FGOS_TEST_SUITE` để test xanh | B | E | O | high |
| T04 | 09-23 | Lỡ xoá 101 dòng manifest | E | | O | low |
| T05 | 09-17 | Quên account rotator vừa xây trong cùng phiên | F | E | R | med |
| T06 | 09-18 | Chọn openai làm fixer hai lần (ba roster nói khác nhau) | C | | P | high |
| T07 | 09-24 | Fix sinh 2 regression, bỏ qua impact analysis | E | D | O | med |
| T08 | 09-21 | Không tự tách worktree khi main checkout bẩn | B | E | U | med |
| T09 | 10-05 | Tên invocation `*-tetcu72/tetnu` sai sự thật | A | E | P | med |
| T10 | 09-27 | Chạy test sai thư mục | G | A | P | med |
| T11 | 09-30 | Engine phình 21k dòng trong khi mô hình gọn là đủ | D | A | O | low |
| D01 | 08-12 | Index cũ revert 2.838 dòng | G | A | X | high |
| D02 | 08-25 | Lúc chụp bằng chứng Iron Law lại commit bản revert | A | D | O | high |
| D03 | 08-24 | `build:skills` ghi đè tài liệu chỉ nằm ở mirror | C | D | P | high |
| D04 | 08-17 | Đổi key config trước khi code merge, main gãy | A | E | O | high |
| D05 | 08-26 | tsk-1dd trùng tsk-17m giao 90 phút trước | A | D | I | high |
| D06 | 08-21 | Bịa finding "seq gap" | E | | I | high |
| D07 | 09 | Ba launcher tự chế ba trần song song | A | D | R | high |
| D08 | 08 | Tự chế lại mẫu jq verify, gây bug | A | B | R | med |

## 5. Số đếm

### 5.1 Theo lớp chính (N=57; trong ngoặc: chỉ ca high+med, N=54)

| Lớp | Số ca | % | high+med |
|---|---|---|---|
| A, thiếu rule | 21 | 37% | 20 |
| B, rule bị chôn | 4 | 7% | 4 |
| C, mâu thuẫn | 8 | 14% | 8 |
| D, chỉ văn xuôi | 1 | 2% | 0 |
| E, rõ nhưng bị bỏ qua | 7 | 12% | 6 |
| F, nhiễu ngữ cảnh | 2 | 4% | 2 |
| G, không phải harness | 14 | 25% | 14 |

Lớp thứ cấp: **D 14**, E 8, A 6, B 6, C 4, G 4, F 1.

### 5.2 Theo triệu chứng (bốn triệu chứng anh nêu)

| Triệu chứng | Số ca | % | Lớp chính chiếm nhiều nhất |
|---|---|---|---|
| P path/tên/cửa vào | 17 | 30% | G 6, A 5, **C 5** |
| U làm thiếu | 13 | 23% | A/C/E/G mỗi lớp 3 |
| O làm thừa | 12 | 21% | A 6, E 3 |
| R tự chế lại | 6 | 11% | A 3, F 2, B 1 |
| I tự phát sinh/bịa | 3 | 5% | A 2, E 1 |
| X khác | 6 | 11% | G 4 |

Nếu tính rộng "tự chế xong mới biết có rồi" thì gộp được R với D05 (item trùng) và M27 (item đã bị hoãn): **8 ca (14%)**. Cả 8 ca đều thuộc A, B hoặc F, **không ca nào là E**. Tức là chưa thấy agent nào biết thứ đó đã có mà vẫn tự chế; trong mọi ca, agent không có cách nào thấy nó.

### 5.3 Tách G

- Model: 2 (M15 gemini nhận vơ, M20 thói quen shell).
- Công cụ ngoài như Claude Code (pin/cwd), git, rtk: 7 (M04, M09, M24, M25, M37, M38, T10).
- Hạ tầng hoặc sản phẩm fgOS: 5 (M08 checkout dùng chung, M33 agy, M40 test không hermetic, M42 shim, D01 approve dùng `branch -f`).
- rtk là công cụ do harness global cài (`~/.claude/RTK.md`). Nếu xếp rtk vào harness thì phần harness tăng thêm 2 ca (lên khoảng 67%).

## 6. Mẫu hình có bằng chứng

1. **Rule sinh ra sau sự cố, dưới dạng văn xuôi, ở lớp chỉ Claude thấy.** Trong 21 ca A, phần lớn được vá bằng một file memory. Ví dụ M21 thì rule được viết vào `AGENTS.md:42` trong cùng ngày, ở commit `b048e852d`. Memory là 60 file, chỉ phần chỉ mục được nạp, và **chỉ phiên Claude** thấy. Các doer codex/agy/gemini không thấy.
2. **`AGENTS.md` (lớp duy nhất mọi runtime cùng đọc) thiếu đúng những rule đã gây sự cố:**
   - không cấm shortcut/cửa hậu để test xanh (rule đó chỉ có ở `.claude/rules/development-rules.md:12` và `primary-workflow.md:39`), dẫn tới ca T03;
   - không quy định nơi để file scratch, dẫn tới T02;
   - không cấm checkout nhánh trên main checkout (chỉ có trong `docs/knowledge/...` và memory), dẫn tới M17 và T08;
   - không nói `core/skills` mới là nguồn, dẫn tới M32 và D03;
   - không có "không backward-compat" (chỉ có trong memory).
3. **Một năng lực có nhiều cửa vào, các cửa nói khác nhau (C, trùng triệu chứng P):**
   - Binary `fgos` có bốn cửa: shell fn, shim staged, `node bin/fgos.mjs`, `rtk proxy`. Liên quan M23, M30, M42.
   - Executor roster có ba nguồn: `.fgos/config.json` `prefer`, roster trong `fgos-code-panel`, roster trong `fgos-plan-loop`. Liên quan T06.
   - Nguồn skill: `AGENTS.md:130` trỏ vào `.agents/skills/_shared/` (render target), trong khi nguồn thật là `core/skills/_shared/`; không file render nào mang header "generated". Liên quan M32 và D03.
   - Anchor cho path report: hook và lead trỏ hai nơi khác nhau. Liên quan M19.
4. **Mâu thuẫn "hỏi hay tự quyết" giữa global và repo:** `~/.claude/rules/CLAUDE.md:8` ("present the options... before asking") đối nghịch `AGENTS.md:19` (Release con người). Liên quan M11 (C), M13 (E/C), M02. Ba ca cùng một hướng sai: hỏi quá nhiều.
5. **Quá tải ngữ cảnh có nhưng hiếm:** M05 (đáp án nằm trong skill list khoảng 200 mục) và T05 (phiên khoảng 9.000 dòng quên việc tự làm trước đó). Chưa đủ để coi đây là nguyên nhân chính (UNPROVEN ở quy mô lớn).

### 6.1 Bằng chứng sống ngay trong phiên này (không tính vào 57 ca)

- Hook SubagentStart đưa **hai mẫu tên report khác nhau**: `general-purpose-261006-1003-{slug}-report.md` và `general-purpose-261006-1003-{slug}.md`. Brief lại yêu cầu `<vai>-261006.md`. Vậy là ba nguồn tên cho cùng một file, và em theo brief.
- Hook PreToolUse(Write) cho file `.py` in hai khối nói ngược nhau: "Python/Go/Rust use snake_case" và "kebab-case for JS/TS/Python". Em chọn kebab, tức là thực tế em đã phải chọn tuỳ ý giữa hai khối.
- Hook GitNexus chèn các "related symbols" không liên quan (test của `herdr-dashboard`) vào mỗi lệnh grep. Đây là nhiễu, một bằng chứng cho F.

## 7. Phán quyết

- **Harness chiếm phần lớn (khoảng 63%, khoảng 67% nếu tính rtk)**, nhưng *hình dạng* lỗi khác giả thuyết ban đầu. Phần lớn đến từ **thiếu rule đúng lúc** (A) và **nhiều cửa hoặc nguồn mâu thuẫn** (C). Quá tải hay nhiễu (F) rất ít.
- **Model khoảng 16%**, gồm E 7 ca và 2 ca model trong G. Trong 7 ca E có 3 ca (T01, T03, T07) mà rule nằm ở lớp runtime kia có thể không nạp, nên có thể thực chất là B (UNPROVEN).
- **Công cụ và hạ tầng khoảng 21%**, chủ yếu là worktree, cwd, git, rtk. Đây là nhóm triệu chứng path lớn nhất: 6/17 ca P không phải lỗi instruction.
- Điều quan trọng nhất cho lead: **vòng học hiện tại biến sự cố thành văn xuôi**, gồm memory (chỉ Claude thấy), `docs/knowledge` và `docs/history`. Số D thứ cấp là 14 và B là 4+6. Nếu đề xuất chỉ thêm văn xuôi thì sẽ lặp lại đúng mẫu hình này.

## 8. Câu hỏi còn mở

1. Doer ở T01–T04 và T07 chạy runtime nào, và runtime đó nạp những file instruction nào (`AGENTS.md`? prompt do `buildPrompt` sinh?). Câu này quyết định T01, T03, T07 là E hay B.
2. Ngày ra đời của `~/.claude/rules/*.md` và `.claude/rules/*.md` (không có trong git). Cần biết để chấm lại ranh giới A/E cho M02, M11, M13.
3. Regex transcript bỏ sót bao nhiêu câu sửa sai? Cần chấm tay một mẫu ngẫu nhiên khoảng 100 lượt người gõ để ước lượng recall.
4. Nên có người chấm thứ hai cho khoảng 15 ca để đo mức đồng thuận, nhất là ranh giới A/E/C.

Status: DONE_WITH_CONCERNS
Summary: Em đã phân loại 57 ca thật (38 từ memory, 11 từ transcript, 6 từ git, 2 từ docs). Harness chiếm khoảng 63% (A 37%, C 14%, B 7%, F 4%, D 2%), model khoảng 16%, công cụ/hạ tầng khoảng 21%. Bài học đang bị biến thành văn xuôi (D thứ cấp 14 ca), và `AGENTS.md`, lớp chung cho mọi runtime, thiếu đúng các rule đã gây sự cố.
Concerns: mẫu không ngẫu nhiên, thiên về lỗi được phát hiện; chỉ một người chấm; chưa xác định được ngày tạo các file rules không nằm trong git; runtime của doer ở T01–T04 và T07 chưa xác minh.
