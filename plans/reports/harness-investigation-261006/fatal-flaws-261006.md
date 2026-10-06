# Phản biện thù địch: điểm yếu chí mạng của bản tổng hợp harness (2026-10-06)

## 0. Phán quyết (5 dòng)

1. **Kết luận trung tâm không đứng được như đang viết.** "Harness khoảng 63%, thiếu rule là chính" dựa vào lớp A. Lớp A thực chất là thùng chứa mặc định: lỗi sản phẩm fgOS, rủi ro vận hành song song và năng lực chung của agent đều bị đếm là "thiếu rule". Em chấm lại 9 ca A thì chỉ giữ 2. Nếu tỉ lệ đó đúng cho cả 21 ca, phần harness còn khoảng 32-35%, không còn là đa số.
2. **Chí mạng 1, đề xuất không khớp với ca.** P2-P6 ngăn được gần như 0/57 ca. P1 ngăn được nhiều nhất 2-4 ca, và chỉ khi viết luật **mới** (luật về file nháp và nguồn skill hiện không có trong `.claude/rules`). Điều này trái với câu "không đề xuất nào chỉ thêm luật". Ba cụm lớn nhất không có đề xuất nào: 16 ca vận hành song song, 3 ca do binary `fgos` có nhiều cửa vào, và các ca lỗi sản phẩm.
3. **Chí mạng 2, chính dữ liệu đã bác bỏ cách sửa bằng văn xuôi luôn nạp.** Lỗi "hỏi thừa" lặp lại 3 lần (M11, rồi M02, rồi M13), lần nào memory và `AGENTS.md:19` cũng đang nạp. Lỗi lệch cwd cũng lặp lại (M09, rồi T10) trong khi dòng memory "Confirm Bash cwd" có mặt 6 lần trong transcript của T10. Vậy mà đề xuất số 1 lại là chuyển văn xuôi vào `AGENTS.md`, một lớp luôn nạp.
4. **Chí mạng 3, không có mẫu số, không có baseline, và bỏ qua thí nghiệm A/B.** Bộ dữ liệu là 57 ca được phát hiện và ghi lại, trên khoảng 7.300 commit và 198 transcript. Không đo được tỉ lệ lỗi và không có chuỗi thời gian. Câu "harness gây ra" mới là tương quan. Thí nghiệm A/B có trong brief (bước 4) mà không chạy, dù rẻ (mục 6).
5. **Phần vẫn đứng:** bản đồ sự kiện gần như đúng. Em chạy lại 8 phép đo và cả 8 khớp, chỉ một số bị thổi phồng nhẹ. Khối trùng, hai kit hook, và rules vắng trong worktree đều có thật; worktree em đã kiểm bằng transcript. Đó là nợ vệ sinh và chi phí token, chưa phải nguyên nhân hành vi đã được chứng minh.

## 1. Headline 63% và cách lấy mẫu: FATAL

### 1.1 Đếm lại CSV

Em đếm lại CSV, kết quả khớp: A21, G14, C8, E7, B4, F2, D1. Có 38/57 ca lấy từ memory. Riêng nguồn transcript (11 ca) cho E3, A2, B2, còn F, C, G, D mỗi lớp 1 ca.

### 1.2 Lỗi định nghĩa

Lớp A là "không lớp nào nói gì về tình huống đó". Định nghĩa này không bác bỏ được, vì sau sự cố lúc nào cũng viết được một luật. Thêm vào đó, memory được viết theo dạng luật "làm/đừng làm". Hệ quả là mọi sự cố đã ghi vào memory đều trông giống lớp A khi nhìn lại.

Taxonomy trong brief có 6 lớp harness và chỉ 1 thùng "không phải harness". Nó không có lớp riêng cho:
- lỗi sản phẩm fgOS: fgOS là chính thứ đang được xây, nên bug của nó hiện ra thành lỗi của agent;
- mô hình vận hành song song;
- chất lượng brief của người.

### 1.3 Em chấm lại 13 ca

Em chọn có chủ đích 9 ca A trong CSV, cộng 4 ca lấy thẳng từ git, không có trong CSV. Em đã đọc file memory hoặc commit của từng ca.

| Ca | CSV | Em chấm | Lý do (bằng chứng) |
|---|---|---|---|
| M07 | A | G-vận hành | Ngữ nghĩa `git worktree add` chỉ checkout trạng thái đã commit. Đây là năng lực git chung cộng với mô hình nhiều worktree, không phải lỗ hổng instruction |
| M12 | A | G-sản phẩm | Mặc định của script `check-decision-citation-drift --write-baseline` khác scope của test. Cách sửa đúng là sửa mặc định của script. Chính CSV ghi "No single door fixes the invocation" |
| M16 | A | A (giữ) | Không có hướng dẫn nào về chi phí monitor |
| M18 | A | G-vận hành | Lead ghi vào cwd mà một assignment đang chạy. Đây là xung đột nhiều writer |
| M22 | A | G-sản phẩm | herdr báo pane đã thoát về shell là "busy" (`agent_pane_busy`) |
| M29 | A | A (giữ) | Kỳ vọng của người chưa từng được ghi ra |
| M30 | A | G-vận hành/model | Hiểu sai việc module graph resolve theo path của `bin/fgos.mjs`. Topology track/main |
| M36 | A | G-sản phẩm | Mặc định cwd của adapter `dispatch execute` sai. Đã file `tsk-1ck`, và một phiên khác cũng dính |
| D04 | A | G-vận hành/model | Đổi key config trên main trước khi code merge. Kỷ luật kỹ thuật chung |
| `8772f3fb5` (git) | — | E | Gate promotion có sẵn mà vẫn tự gắn `live` |
| `5abebd45e` (git) | — | E/model | Closeout overclaim, bịa mục "herdr-native confinement driver". Red-team đã bắt |
| `be5461945` (git) | — | E/model | Over-correct một kết luận enforcement. Reviewer đã bắt |
| `8f1fc042d` (git) | — | G-vận hành | Fast-forward mang theo một lần xoá `.fgos` hợp lệ trên nhánh worker. Hai cơ chế đúng tương tác thành sai |

### 1.4 Kết quả

- 9 ca A: em chỉ giữ 2. Ngoại suy 2/9 cho 21 ca thì A còn khoảng 5. Harness còn khoảng 20/57 (35%). Cộng thêm hai ca phản biện cũ đã chuyển (M05 F→E, M11 C→E) thì còn khoảng 18/57 (32%).
- 4 ca lấy thẳng từ git: không ca nào là lỗi instruction.
- Từ khoá mà forensics dùng để quét git bỏ sót hẳn nhóm lỗi model. `git log --since=08-01` có **98 commit** "review finding/review round", **17 commit** "overclaim/over-correct" và **47 commit** "invented/nonexistent". Forensics chỉ lấy 1 ca loại này (D06). Nếu lấy mẫu từ đây, E và model sẽ áp đảo.

### 1.5 Đánh giá và điều kiện đổi kết luận

- **Giới hạn của em:** em cũng là một người chấm, và em chọn mẫu có chủ đích vào lớp A. Vì vậy em không khẳng định con số 35%. Điều em khẳng định là con số **dao động 32-63% tuỳ người chấm**. Một con số như vậy không được làm headline.
- **Lead đã nhận** rằng A bị thổi phồng (mục 7), nhưng bảng ở §1 vẫn để 63% và vẫn viết "thiếu rule là chính".
- **Điều sẽ đổi kết luận:** người chấm thứ hai, chấm mù trên taxonomy có thêm hai lớp "lỗi sản phẩm" và "vận hành song song", vẫn ra A ≥ 30%.

## 2. Survivorship, mẫu số, baseline: FATAL

- **Mẫu số.**
  - 57 ca trên khoảng 7.337 commit từ 08-01, cộng 198 transcript chính và 1.806 lượt người gõ.
  - Theo tháng: tháng 08 có 24 ca/5.264 commit, tháng 09 có 30 ca/1.819 commit, tháng 10 có 2 ca.
  - Không có số "hành động agent" làm mẫu số, nên không có tỉ lệ lỗi. Không thể nói lỗi "nhiều hơn" hay "ít hơn".
- **"Ngày càng tệ" chưa được chứng minh.**
  - Chuỗi thời gian duy nhất là tên report, và phản biện cũ đã chỉ ra đó là đổi quy ước theo brief.
  - Phép tách trước/sau ngày cài AgentKit (08-30) ra phân bố lớp gần như y hệt. Nghĩa là thêm cả một kit harness cũng không đổi kiểu lỗi. Đây là bằng chứng **chống lại** giả thuyết harness quyết định hành vi, nhưng bản tổng hợp không dùng nó theo hướng đó.
- **Survivorship.** Memory chỉ ghi lỗi mà anh hoặc agent để ý và cho là đáng ghi. Lỗi âm thầm và lỗi đã bị review bắt rồi sửa đều không vào mẫu. Trong khi đó, chính review của harness đã bắt T03, D06 và các commit em lấy ở mục 1. Tỉ lệ review bắt được lỗi trước khi merge không được đo. Có thể harness đang **chặn phần lớn lỗi**, và mẫu chỉ thấy phần lọt qua.
- **Không có baseline** so với model hay quy mô. Không có so sánh nào với giai đoạn ít song song hơn hay ít instruction hơn. Chưa tách được biến harness khỏi biến số phiên chạy song song (28 worktree) và biến runtime non-Claude (8 ca).
- **Điều sẽ đổi kết luận:** đo tỉ lệ lỗi trên mỗi item hoặc mỗi phiên theo tuần, có chuẩn hoá theo khối lượng, rồi đối chiếu với thời điểm thêm hoặc bớt lớp instruction.

## 3. Đề xuất và số ca ngăn được: FATAL

Em đối chiếu từng đề xuất với 57 ca, ghi rõ cơ chế ngăn.

| # | Đề xuất | Ca có thể ngăn | Lý do |
|---|---|---|---|
| P1 | Chuyển "khoảng 25 dòng tự viết" từ `.claude/rules` vào `AGENTS.md` | **2-4** (T02, T03, M32, D03), với điều kiện viết luật mới | Xem phân tích ngay dưới bảng |
| P2 | Một bản khối GitNexus/MDView | **0** | Không ca nào liên quan |
| P3 | Một kit hook | **0-1** | Lead đã thừa nhận 0/57. M19 là hook đối đầu với path của lead, không phải ck đối đầu ak |
| P4 | Một reading-map, một platform-foundations, tham chiếu mồ côi | **0** (1-2 nếu tính sửa `AGENTS.md:130`, nhưng P4 không nêu dòng này) | Không ca nào trích reading-map hay platform-foundations |
| P5 | Gom check, `check-decision-codes` | **0** | Không ca nào do mã quyết định |
| P6 | Dọn ak/ck | **0-1** (M05) | Chính M05 cũng đang tranh cãi là F hay E |

Phân tích P1, em kiểm bằng `diff` với cache AgentKit và `grep`:
- "Prior art" đã có sẵn ở `AGENTS.md:42`, nên chuyển vào là trùng.
- "Không cửa hậu" (`development-rules.md:12`) là chữ của vendor, `diff` với AgentKit 2.19.0 ra 0 dòng. Đây không phải dòng tự viết.
- "Nơi để file nháp" và "`core/skills` là nguồn" **không có trong file `.claude/rules` nào**, tức là luật mới.
- Phần tự viết thật (`documentation-management.md`, lệch 29 dòng so với vendor) là one-H1, intent-ledger và component-boundary. Không ca nào trong 57 ca liên quan tới phần này.

Tổng cộng P1-P6 ngăn được khoảng **3-6/57 ca (5-10%)**. Bản tổng hợp gọi thứ tự này là "xếp theo tác động", nhưng tác động ở đây là byte và token, không phải hành vi. Thực chất đây là **dọn token, khoác áo sửa hành vi**.

Những cụm có ca mà không có đề xuất nào:
- **Một cửa cho binary `fgos`** (M23, M30, M42; forensics §6.3 đã nêu bốn cửa). Đây đúng hình dạng RUL11 và có cơ chế.
- **Một nguồn roster và ví dụ sinh từ contract** (T06, M10, M06). Cùng loại C, sửa được bằng cách sinh ví dụ, không cần thêm chữ.
- **Một writer cho mỗi checkout** (16 ca vận hành). Lead "chấp nhận" giả thuyết này rồi không làm gì.
- **Sửa các lỗi sản phẩm** đang được vá bằng memory (M12, M22, M36, M42), thay vì để agent nhớ cách né.

**Điều sẽ đổi kết luận:** chỉ ra được ≥5 ca cụ thể mà P2, P3 hoặc P6 ngăn được.

## 4. Kiểm lại các sự kiện lead nêu

| Sự kiện | Lệnh | Kết quả | Mức |
|---|---|---|---|
| `CLAUDE.md:50-122` byte-identical với `AGENTS.md:137-209`, 3664 B | `sed -n` hai khoảng, rồi `cmp` | IDENTICAL, mỗi khoảng 3664 B (trên working tree) | Đúng |
| `CLAUDE.md:6` là `@AGENTS.md` | `sed -n 1,8p` | Đúng | Đúng |
| Khối là thứ tay xoá được | `grep` marker | Cả hai khối nằm trong marker do công cụ sinh: `<!-- mdview:START -->` (`CLAUDE.md:49`, `AGENTS.md:136`) và `<!-- gitnexus:start -->` (`:79`, `:166`). Xoá tay sẽ bị sinh lại. Số symbol đang churn ngay lúc này: HEAD 54344, working tree 58821, context của em 58449 | P2 ghi rủi ro "Thấp" là đánh giá thấp. Phải chỉnh nơi sinh. MINOR |
| Claude Code đọc `AGENTS.md` native? | Docs chính thức `code.claude.com/docs/en/memory` §AGENTS.md | "An `AGENTS.md` and a `CLAUDE.md` … → Claude reads: Your `CLAUDE.md` files only"; "A `CLAUDE.md` that already imports `AGENTS.md` → … `AGENTS.md` included through the import". Đọc native cần v2.1.277+ và chỉ khi không có `CLAUDE.md` | PROVEN (docs). Với Claude, `AGENTS.md` chỉ đến qua import. P2 phải giữ import, xoá phía `CLAUDE.md` |
| `.claude/rules` bị gitignore, vắng trong worktree | `git check-ignore -v` | `.gitignore:62:/.claude/*` | Đúng |
| Worktree có nạp `CLAUDE.md` của main (UNPROVEN #2 của bản tổng hợp)? | `grep 'Contents of'` trong transcript worktree | Phiên `…worktrees-agent-coordination-state-root` nạp `CLAUDE.md` và `AGENTS.md` **của worktree**, 6 file `~/.claude/rules`, và `MEMORY.md`. **Không** nạp `CLAUDE.md` của main, **không** nạp `.claude/rules` của repo. 5/8 thư mục transcript worktree có dấu này; 3 thư mục còn lại không có "Contents of" | Đã giải UNPROVEN #2: không nạp kép, và rules repo thật sự vắng. **Ủng hộ P1** về hướng (rules repo không tới được worktree) |
| Hook trùng ở hai settings | Liệt kê command của hai file | 11 tên chung. Chuỗi lệnh khác nhau (`$HOME/...` và `${CLAUDE_PROJECT_DIR}/...` có guard `[ -f ] \|\| exit 0`) | Đúng |
| Claude Code có khử trùng? | Docs `hooks`: "If you define the same handler in more than one settings file, it runs once"; "When several hooks return `additionalContext` … Claude receives all of the values" | Hook ck và ak là hai handler khác nhau nên cả hai chạy, và cả hai khối đều được tiêm. `secret-output-guardrail` và `simplify-gate` ×2 có chuỗi y hệt nhau, rất có thể chỉ chạy một lần (docs nói "more than one settings file"; trường hợp cùng một file chưa có câu chữ rõ) | Phần lớn PROVEN. Riêng trùng trong cùng một file thì UNPROVEN-nhẹ |
| Khối thứ hai được tiêm mỗi prompt | Chạy lại `count-hook-injections.cjs` (40 transcript main) | 467/565 prompt có cả hai khối (báo cáo ghi 464/560, chênh do cửa sổ dịch). Ở worktree: 66/228 có cả hai, 133/228 chỉ có global. Chính context SubagentStart của em cũng nhận hai khối (YAGNI và `--yagni`; `-report.md` và `.md`) | Đúng |
| "Khoảng 11k token/phiên cho phần trùng" | `hook-injection-counts.txt`, `instruction-audit` §7 | 11k là **tổng** khối rules mỗi phiên (median 40 KB, cả hai bản), không phải riêng phần trùng. Phần trùng chỉ khoảng một nửa | Thổi phồng khoảng 2 lần. MINOR |

## 5. Mâu thuẫn nội tại và suy luận trình bày như sự thật: SERIOUS

1. **Kit hook.** §7 viết "nguyên nhân chưa chứng minh". Vậy mà P3 vẫn có mặt trong bảng "xếp theo tác động", và **Quyết định #1** hỏi anh đúng chuyện kit hook. Câu hỏi đầu tiên anh nhận lại là về thứ chưa chứng minh gây lỗi.
2. **Thêm luật.** §5 viết "không đề xuất nào chỉ thêm luật". P1 thực chất thêm luật mới: file nháp, nguồn skill (mục 3).
3. **Cơ chế hay văn xuôi.** Lead và phản biện cùng gọi "cơ chế thắng văn xuôi" (plan dir 15/15) là bằng chứng tốt nhất. Forensics §7 cảnh báo "chỉ thêm văn xuôi sẽ lặp lại mẫu hình". Thế nhưng sau khi loại E1, E4, E5 và E6, **không còn đề xuất nào biến văn xuôi thành cơ chế**, trừ P5 (chỉ ép mã quyết định, không dính ca nào). Bản tổng hợp hành động ngược với bài học mạnh nhất của chính nó.
4. **Nhận nhưng không làm.** "28% ca vận hành song song, không sửa được bằng rule" được chấp nhận, nhưng không có đề xuất, không có quyết định nào hỏi anh, cũng không có dòng UNPROVEN nào cho nó. Đây là chấp nhận trên danh nghĩa.
5. **Runtime non-Claude.** "Rule có mặt ở runtime non-Claude" được dùng làm thước đo của P1. Nhưng runtime của doer T01-T07 là UNPROVEN (§8), và việc agy/codex/gemini có đọc `AGENTS.md` hay không thì không ai kiểm. Lợi ích chính của P1 vì vậy là suy luận.
6. **Lead không đo lại.** Lead ghi "không tự đo lại" ở dòng 3, rồi đặt 63% làm con số đầu tiên.

**Lead trả lời phản biện cũ, công bằng ở đâu, không công bằng ở đâu.**
- Công bằng: nhận `--yagni` là mặc định vendor, bỏ nhánh track `.claude/`, sửa ba sai sự kiện.
- Không công bằng hoặc chỉ hình thức: nhận A bị thổi phồng nhưng giữ headline; nhận 28% vận hành nhưng không đề xuất gì; phản biện gợi ý "một nguồn tên chung cho brief và hook" thì lead chỉ ghi lại, không đề xuất.
- Loại E4 và E6 là đúng. Loại E5 với lý do "không bắt được M21" là hợp lý. Nhưng loại hết mà không thay bằng cơ chế nào thì không còn hợp lý.

## 6. Cuộc điều tra không xem gì, và thí nghiệm rẻ bị bỏ qua: SERIOUS

### 6.1 Những chỗ không xem

- **Lỗi sản phẩm fgOS bị ghi thành luật agent:** M12, M22, M36, M42, D01. Gốc là sửa sản phẩm, không phải sửa harness.
- **Brief của người:** phản biện đã cho thấy tên report đi theo brief. Không ai đo xem có bao nhiêu ca bắt đầu từ prompt hoặc brief thiếu tiêu chí. T07 tự nhận "fix prompt also lacked reasons".
- **Contract cấp task:** acceptance criteria và "done" của từng việc. Không đo.
- **Tỉ lệ review bắt lỗi** (98 commit sửa review finding), tức là harness đang chặn được bao nhiêu. Không đo.
- **Trọng số thiệt hại:** 57 ca được đếm ngang nhau. Ca suýt xoá 785 baseline và ca xưng hô có cùng trọng số 1.
- **Executor và model:** gemini và agy kém tin cậy (M15, M33). Đây là lựa chọn roster, không phải instruction.
- **Không có eval "agent có tuân rule X không".** Đây chính là thứ đáng xây nếu muốn quản lý harness bằng số.

### 6.2 Thí nghiệm quyết định, rẻ (chỉ thiết kế, em không chạy)

- **Ba task nhỏ**, chọn đúng chỗ lỗi đã từng xảy ra, mỗi lần chạy trong một throwaway worktree từ cùng một SHA:
  - (a) "Viết báo cáo điều tra về X". Đo path và tên report.
  - (b) "Thêm cờ `--foo` cho verb Y, kèm test, sửa skill mô tả liên quan". Đo file nháp ở gốc, sửa `.agents/skills` hay `core/skills`, có env backdoor không, có tái dùng helper sẵn có không.
  - (c) "Thiết kế cơ chế Z", trong đó Z đã từng tồn tại dưới id cũ trong git. Đo có chạy `git log -S` không, có tìm ra prior art không.
- **Bốn biến thể instruction:**
  - V0: đủ mọi lớp như main hôm nay.
  - V1: như worktree hôm nay (global ck và `AGENTS.md`, không có `.claude/rules`).
  - V2: chỉ `AGENTS.md`, không hook ck/ak, không skill ngoài (`CLAUDE_CONFIG_DIR` tạm, rỗng).
  - V3: V2 cộng các luật P1 đã viết vào `AGENTS.md`.
- **Chạy:** `claude -p` headless, cùng model, N=5 mỗi ô, tổng 3×4×5 = 60 lượt.
- **Chấm bằng script, không chấm bằng người:**
  - path và tên khớp một quy ước;
  - số file mới ngoài allowlist;
  - có sửa render target không;
  - có thêm env-gate trong `src/` không;
  - có tool call `git log -S` hoặc `-G` không;
  - diff có dùng helper sẵn có không;
  - tổng token context.
- **Luật quyết định:**
  - Nếu V0, V1, V2 không khác nhau quá nhiễu (khoảng tin cậy chồng nhau) trên mọi chỉ số, thì lớp instruction không phải đòn bẩy. Chuyển nỗ lực sang cơ chế và sửa sản phẩm.
  - Nếu V3 tốt hơn V2 rõ ở (b), thì P1 có giá trị thật.
  - Nếu V2 tốt hơn V0, thì giả thuyết "nhiễu" là đúng, và P2, P3, P6 có giá trị hành vi chứ không chỉ token.

## 7. Số liệu có tái lập không (em chạy lại 8 phép đo)

| Script hoặc lệnh | Báo cáo ghi | Em ra | Kết luận |
|---|---|---|---|
| Đếm lại CSV (python) | A21, G14, C8, E7, B4, F2, D1; 38 ca từ memory | Giống | Khớp |
| `measure-instruction-layers.cjs` | 63.960 B, khoảng 17,5k tok, 23 đoạn trùng | 63.960, 17.522, 23 | Khớp |
| `count-hook-injections.cjs` (40 transcript main) | 464/560, 253/253 | 467/565, 254/254 | Khớp (cửa sổ dịch) |
| `duplicate-docs.py` | 362 nhóm, 433 file thừa | 362, 433 | Khớp |
| `md-inventory.py` | 4.449 `.md`, 1 file lạc | 4.450, `tsk-1op-case-study-note.md` | Khớp |
| `naming-drift-relaxed.py` | W41 2/47 (4%) | 2/48 (4%) | Khớp |
| `skill-catalog-measure.py` | 83/106 song sinh, 132/54/94 skill | Giống | Khớp |
| `dead-pointers.py` | reading-map 9/94 path chết | Script chỉ in 8 path, trong đó `runner/loop.mjs`, `patterns/`, `contracts/` là token tương đối đều **tồn tại** (`src/runner/loop.mjs`, `src/runner/execution/patterns/`) | Thổi phồng: path chết thật khoảng 5. MINOR |

Em không thấy số nào bịa. Sai lệch nằm ở **diễn giải** (A, 11k token, mẫu số), không nằm ở đo.

## 8. Câu hỏi chưa giải quyết

1. Doer của T01-T04 và T07 chạy runtime nào, và runtime đó có đọc `AGENTS.md` không? Chưa có câu trả lời thì lợi ích chính của P1 là suy luận.
2. Teammate ở T10 có nạp `MEMORY.md` không? Transcript lead có dòng đó 6 lần. Nếu teammate cũng có, thì T10 là bằng chứng mạnh nữa rằng văn xuôi luôn nạp không đủ.
3. Anh muốn tối ưu chi phí token (P2, P3, P6 làm tốt việc này) hay hành vi (cần cơ chế, sửa sản phẩm, một writer mỗi checkout)? Hai mục tiêu này cần hai danh sách đề xuất khác nhau.
4. Có chạy thí nghiệm ở mục 6.2 trước khi duyệt bất kỳ đề xuất nào không? Em khuyến nghị có, vì chi phí khoảng 60 lượt headless nhỏ.
5. Hook trùng chuỗi y hệt trong **cùng một** settings file có được khử trùng không? Docs mới nói rõ trường hợp nhiều file.

Status: DONE_WITH_CONCERNS
Summary: Phần đo đạc tái lập được (8/8 khớp). Kết luận trung tâm thì không đứng được: lớp A là thùng chứa mặc định; em chấm lại thì phần harness rơi từ 63% xuống khoảng 32-35%. Sáu đề xuất ngăn được khoảng 3-6/57 ca, và P1 lén thêm luật mới. Chính dữ liệu cho thấy văn xuôi luôn nạp không ngăn tái phát. Em đã giải UNPROVEN về nạp `CLAUDE.md`/`AGENTS.md` trong worktree bằng docs và transcript, và đề xuất một thí nghiệm A/B 60 lượt.
Concerns: Em cũng chỉ là một người chấm, chọn mẫu có chủ đích vào lớp A, nên con số 32-35% là ước lượng, không phải số đo. Khử trùng hook trong cùng một file vẫn chưa rõ hẳn. Runtime của doer non-Claude vẫn chưa xác minh.
