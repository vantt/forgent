# Điều tra harness fgOS: vì sao agent vẫn làm tùm lum (RUL11), bản 3

Ngày 2026-10-06. Chỉ đọc; không sửa rules/AGENTS/CLAUDE/skill/docs. Bản này thay bản 2. Mục tiêu anh chọn: **tối ưu hành vi**. Phân loại theo ba trục thống nhất ([codebook](harness-investigation-261006/classification-codebook-261006.md)): nguyên nhân, triệu chứng, lớp can thiệp.

Nguồn: 57 ca chấm lại bởi hai người chấm độc lập, không thấy nhãn cũ ([rater 1](harness-investigation-261006/rater-1-261006.md), [rater 2](harness-investigation-261006/rater-2-261006.md), [bảng gộp](harness-investigation-261006/cases-merged-261006.csv)); bảng 38 phát hiện cấu trúc, sổ sở hữu, mẫu brief, kiểm kê eval ([conditions](harness-investigation-261006/conditions-261006.md)); hai vòng phản biện ([critic](harness-investigation-261006/critic-261006.md), [fatal-flaws](harness-investigation-261006/fatal-flaws-261006.md)).

## 0. Phạm vi (anh chốt lúc 12:26)

Các skill `ak-*` và `ck-*`, cùng hook/rules mà AgentKit (`ak`) và ClaudeKit (`ck`) ship (`.claude/hooks/*`, `.claude/rules/*`, `~/.claude/hooks/*`), là dự án của người khác. Báo cáo này coi chúng là **ràng buộc môi trường** (đo và ghi lại tác động lên agent), không phải đối tượng đề xuất sửa, xoá hay dedupe. Phạm vi đề xuất chỉ gồm thứ fgOS sở hữu: `AGENTS.md`, `CLAUDE.md`, `core/skills`, `domains/**`, skill `fgos-*`, `docs/`, `src/`, `bin/`, `.githooks/`, `plans/`. Hệ quả: mọi đề xuất trước đây đụng tới `ak-*`, `ck-*`, hook ck/ak, `.claude/rules/*` đã bị loại bỏ ở các mục dưới.

### 0b. `rtk` và các công cụ ngoài: không sửa, nhưng phải tính tới

`rtk` (hook PreToolUse `rtk hook claude`, `~/.claude/settings.json:91`) viết lại lệnh Bash và nén output trước khi agent thấy. fgOS không sửa nó, nhưng nó đổi **điều agent quan sát được**, nên phải thiết kế phía fgOS cho phù hợp.

Bằng chứng tra được:
- Đo trực tiếp (2026-10-06): `grep -rl "fgos-coding-compounding" . | wc -l` ra **130** khi qua hook và **3320** khi chạy thô (`rtk proxy`). Đếm bằng `grep | wc -l` qua hook là sai âm thầm. Cấu hình `~/.config/rtk/config.toml`: `grep_max_results = 200`, `grep_max_per_file = 25`, `ignore_dirs` gồm `.git`, `target`, `vendor`, `node_modules`, `ignore_files` gồm `*.lock`.
- Số 22 file nhắc `fgos-coding-compounding` của vai catalog: chạy lại thô trong cùng phạm vi ra **23**, tức là tin được trong phạm vi đã nêu. Các số khác đếm bằng `grep|wc` trong báo cáo chưa kiểm lại (UNPROVEN); số tính bằng script Python/Node thì không đi qua hook.
- Ca M23 (`rtk proxy fgos` chạy binary global cũ), M24 (nén output, từng viết lại một định danh), M25 (cắt input pipe >10 MiB, exit 0, `rm` chỉ chạy một phần). Vai kiểm toán instruction cũng đếm sai lần đầu vì rtk.
- Prior art: `docs/explanation/claude-executor-rtk-hook-root-cause.md` — rtk viết lại `git ...` thành `rtk git ...` làm hụt allowlist của executor `claude`; fgOS xử lý ở phía mình (allowlist nêu cả hai dạng), không sửa rtk. Cùng kiểu cách xử lý.
- Chưa có ca "tự chế lại" (R) nào quy được về rtk; việc giới hạn 200 kết quả và bỏ qua `target/` có thể che mất thứ đã có, nhưng đây mới là rủi ro, chưa phải ca.

## 1. Trả lời ngắn

1. **Báo cáo trước thiên về instruction nhiều hơn dữ liệu cho phép.** Khoảng một nửa số ca là lỗi instruction (thiếu/chôn/mâu thuẫn/văn xuôi/bỏ qua/nhiễu) và một nửa là lỗi sản phẩm, công cụ, hạ tầng, model. Về cách sửa, chỉ khoảng 30% cần can thiệp bằng instruction hoặc cơ chế; khoảng 55-63% cần sửa sản phẩm fgOS, quy ước vận hành hoặc công cụ.
2. **"Rule rõ nhưng agent làm trái" gần như không có** (1-3 ca trên 57). Agent hiếm khi cãi rule; nó làm sai vì không có nguồn đúng, có hai nguồn mâu thuẫn, hoặc cửa vào sai.
3. **Tên file do nguồn gần nhất có thẩm quyền quyết định, không phải hook.** 40/46 tên report tuần 41 được đọc sẵn trong brief do lead viết. Thiếu một chủ cho quy ước tên là điều kiện nền thật.
4. **Quy ước có một nguồn định nghĩa cộng cơ chế kiểm thì không lệch:** 3/15 quy ước, cả 3 không drift. 9/15 không chủ không kiểm, đều lệch.
5. **Chưa ai đo được "rule có tác dụng không".** Observe có kho eval nhưng chưa chạy được A/B; thiếu ba thứ nhỏ.

## 2. Độ tin cậy của phân loại

- Hai người chấm (cùng họ model, nên khớp nhau không chứng minh đúng): nguyên nhân khớp 47/57 (82%), lớp can thiệp 46/57, triệu chứng 45/57, cờ sở hữu 52/57, cờ brief 53/57. Chưa tính kappa.
- Nhãn pháp y cũ chỉ trùng 24/57 với mỗi người chấm mới, chủ yếu vì codebook mới tách lỗi sản phẩm (H) và tách G. Nhãn cũ không còn dùng làm bằng chứng tỉ lệ.
- Mẫu vẫn không ngẫu nhiên (38/57 từ memory), không có mẫu số, không nói được "ngày càng tệ". `.claude/rules` untracked nên với ca trước 2026-08-30 không kiểm được nội dung rule lúc xảy ra.
- Hai mô tả đầu vào sai so với nguồn: T04 (commit "restore" thực ra xoá 101 dòng test; commit trước cắt 55 dòng `approve.mjs`) và M14 (gộp hai việc ở hai thời điểm). Đã ghi, cần sửa trong bảng ca gốc.

## 3. Bản đồ ba trục (57 ca; hai số là rater 1 / rater 2)

### Nguyên nhân
| Mã | Tên | R1 | R2 |
|---|---|---|---|
| A | Thiếu rule | 12 | 14 |
| B | Rule bị chôn | 4 | 4 |
| C | Mâu thuẫn | 4 | 6 |
| D | Chỉ văn xuôi | 2 | 4 |
| E | Bị bỏ qua | 3 | 2 |
| F | Nhiễu ngữ cảnh | 2 | 2 |
| G1 | Model | 9 | 5 |
| G2 | Công cụ | 9 | 9 |
| G3 | Hạ tầng/vận hành | 3 | 2 |
| H | Lỗi sản phẩm fgOS | 9 | 9 |

Nhóm instruction (A-F): 27 / 32 trên 57. Nhóm không phải instruction (G1-G3, H): 30 / 25. Trong 47 ca cả hai khớp nguyên nhân: 23 instruction, 24 không phải. Lớp lệch nhiều nhất giữa hai người: G1 (model) 9 so với 5; đây là ranh giới khó nhất.

### Lớp can thiệp ("sửa ở đâu thì hết")
| Mã | R1 | R2 |
|---|---|---|
| SP sản phẩm | 16 | 19 |
| VH vận hành | 10 | 11 |
| IN instruction | 11 | 10 |
| CC cơ chế | 6 | 7 |
| CU công cụ | 5 | 6 |
| SH sở hữu | 4 | 1 |
| BR brief | 4 | 1 |
| MD model | 1 | 2 |

IN + CC = 17/57 (30%) cho cả hai người. SP + VH + CU = 31 / 36 (54% / 63%). Không ai gán DL (đo lường) làm lớp can thiệp cho một ca, vì DL là điều kiện chứ không phải cách sửa một lỗi cụ thể (xem mục 4).

### Triệu chứng
Sai path/tên/cửa (P) 13-14; "khác" (X) 16-20; làm thiếu (U) 7-10; làm thừa (O) 10; tự chế lại (R) 6-7; tự phát sinh (I) 1. "Khác" lớn bất thường: codebook cần thêm giá trị cho nhóm lỗi vận hành/đồng thời (nhiều ca X là ghi nhầm checkout chung). Em chưa đổi codebook.

## 4. Điều kiện nền (những thứ anh hỏi: sở hữu, brief, đo lường, model)

### 4.1 Sở hữu
15 quy ước/artifact (tên report/plan/journal, vị trí plan, vị trí docs, nguồn skill, roster, cửa `fgos`, hook, rules, reading-map, platform-foundations, quyết định...):
- **3/15** có đúng một nguồn định nghĩa cộng cơ chế kiểm cơ học (nguồn skill, roster executor, bộ instruction hiệu lực của fgOS). Cả 3 không drift.
- **9/15** không chủ, không kiểm; cả 9 có drift đo được.
- Biến dự báo tốt nhất không phải số văn bản định nghĩa mà là có một **cửa cơ học agent buộc phải đi qua**. Tên plan có 6+ nguồn trên giấy nhưng tháng 10 đúng 15/15 nhờ `ak plan create` sinh tên.
- Trong 57 ca, cả hai người chấm cùng gắn "thiếu chủ" ở 8 ca (D07, M06, M08, M19, M23, M42, T06, T11); thêm 3 ca (M21, M22, T02) chỉ một người gắn.
- Giới hạn: 15 quy ước, khoảng 7 có số drift, nhiễu chéo; nhân quả UNPROVEN.
- Phát hiện mới: có **ba** bản `platform-foundations.md` (bản `docs/platform/` ghi "Draft, Canonical: Yes, after review"). fgOS đã có engine gộp instruction một chủ, biết phát hiện mâu thuẫn (`src/setup/instruction-composition.mjs`), nhưng chỉ chứa 1 unit; rules và hook của ck/ak nằm ngoài nó.

### 4.2 Brief
Mẫu 20 brief (10 file prompt, 10 prompt Agent từ transcript):
- 16/20 có tiêu chí xong; 14/20 có phạm vi file; chỉ 1/20 nêu cờ `--yagni`.
- 10/10 việc cần file đều nêu path và output nằm đúng path; nhưng 8/10 tên do brief tự đặt, và vì hai hook nói ngược nhau, cả 10 tên trái ít nhất một hook.
- 2 brief xung đột luật đang nạp: một brief chép luật đã chết ("tạo entry `docs/decisions/`"); một brief ra lệnh ngược luật "không để mã plan/unit trong comment và tên test".
- Tên report tuần 41: 40/46 được đọc sẵn trong brief do lead (Claude) viết; 5 lead tự đặt; không tên nào do anh gõ. Kiểu `slug-YYMMDD` là thói quen của lead truyền qua brief. 40/46 là cận dưới.
- Trong 57 ca: cả hai khớp "brief góp phần" ở 5 ca (M03, M13, M19, T01, T07), "quyết định" ở 1 (M35).
- Giới hạn: mẫu không có dispatch ra ngoài tiến trình (codex/agy); hai prompt 09-15 và 09-20 chưa rõ ai viết.

### 4.3 Bộ đo hành vi
- Có sẵn: `metrics eval record|list` (rubric tự do, điểm 0-2), rubric `discussion-quality.v1` có chấm mù, cảm biến stance (đo đồng thuận panelist, không đo tuân rule), `metrics case`.
- Thiếu để chạy A/B "cùng việc, khác bộ instruction": cách khai bộ instruction thành biến tái lập (chưa có invocation cô lập; `dispatch execute` không truyền cờ), bộ chấm máy cho path/tên/file thừa, kịch bản việc nhỏ có đáp án, và **một quy ước tên được chốt làm đáp án** (hôm nay có ba).
- Bổ sung nhỏ nhất, không đụng Rust: một rubric `harness-conformance.v1`, một script chấm diff ra JSON eval, 3 kịch bản theo định dạng `dogfood-fixture`. Hai nhánh tự nhiên đã có: worktree (không có rules/hook của repo) so với main checkout (đủ hai kit).

### 4.4 Model vs công cụ
Đã tách G thành G1/G2/G3. G2 (công cụ) ổn định ở 9 ca; G1 (model) dao động 5-9 giữa hai người. Chưa đủ để nói "model gây X% lỗi".

## 5. Danh sách vấn đề và phân loại

Mỗi dòng là một vấn đề (gộp từ 57 ca và 38 phát hiện cấu trúc). Cột nguyên nhân/triệu chứng/can thiệp theo [codebook](harness-investigation-261006/classification-codebook-261006.md); khi hai người chấm khác nhau, ghi cả hai (R1/R2). "Phạm vi" theo mục 0. H1–H6 là hành động ở mục 7.

| # | Vấn đề | Nguyên nhân | Triệu chứng | Can thiệp | Bằng chứng | Phạm vi · Hành động |
|---|---|---|---|---|---|---|
| V1 | Nhiều cửa `fgos`; binary hoặc shim cũ chạy thay bản của repo | G3 (M23), H (M42), G1/A (M30) | P | CU/VH (M23), SP (M42), IN (M30) | M23, M30, M42; S32 | Trong · H1 |
| V2 | Roster executor có 3 nguồn không khớp nhau | C | P | SH/SP | T06 | Trong · H1 (roster chép tay còn ở `fgos-architecture-panel`) |
| V3 | Agent sửa nhầm file render; nguồn thật `core/skills` không được gọi tên (`AGENTS.md:130` trỏ bản render; 0 file render mang header "generated") | A/C (M32), H/B (D03) | P (X/U ở D03) | SP | M32, D03; S22 | Trong · H1 |
| V4 | Skill nói ngược engine, hoặc skill này nói ngược skill kia | H (M10), C (M06) | U (M10 P/U; M06 U/O) | SP | M10, M06 | Trong · H1 (đã xử lý, chỉ ghi bằng chứng) |
| V5 | Hai tín hiệu path cho report phase (hook `Reports:`, path tương đối của lead, worktree) | C | P | SH/CU | M19 | Trong · H2 |
| V6 | Repo không có văn bản định nghĩa tên report/prompt/journal; có 3 mẫu và brief của lead thắng tất cả (40/46 tên tuần 41) | A, C | P | SH, BR | S3, S15, S16, S18 | Trong (hook ak/ck: ngoài) · H2 |
| V7 | Rác ở gốc repo: 28-30 file nháp nằm 15 ngày trên main | A (T02), D (S30) | O | CC | T02, S30 | Trong · H3 |
| V8 | Luật "không tạo cửa hậu để test xanh" chỉ có ở lớp vendor, không có trong `AGENTS.md` | B | O/X | IN | T03 | Trong · H3 |
| V9 | Tự chế lại hoặc lập kế hoạch trên tiền đề cũ khi thứ cần đã có: skill chìm trong roster (M05), nằm trong lịch sử git theo id cũ (M21), hoãn nằm riêng ở backlog (M27), quên phần việc cũ trong phiên dài (T05), snapshot cũ (M34) | F (M05, T05), A (M21, M34), B (M27) | R (M27: O; M34: X) | SP, IN, VH, không đồng nhất | M05, M21, M27, T05, M34; S27 (prior art: 1/8 plan nhắc tới) | Trong · H4 (chưa có cơ chế rẻ) |
| V10 | Hỏi thừa, hoặc hỏi giả khi phân tích đã chọn rõ | C (M11), E/D (M02, M13) | O (M02: U/X) | IN | M02, M11, M13 | Trong · H5 (đã chốt b') |
| V11 | Foundation: 3 bản; reading-map: 2; `AGENTS.md` trỏ 2/3 bản; 5 gốc docs ngoài governance; `plan.md` ở 3 chỗ | C, A | P | SH | S8, S10, S13, S14 | Trong · H6 (hoãn cho plan 260925) |
| V12 | `AGENTS.md` tự mâu thuẫn: `:13` nói `docs/decisions/` đã retire, `:64-66` bảo ghi quyết định vào đó | C | P | IN | S11 | Trong · chưa có hành động riêng |
| V13 | Tham chiếu mồ côi: 22 file nhắc skill đã xoá; 9/94 path chết trong reading-map; thông báo pre-commit trỏ file không tồn tại; kịch bản dogfood trỏ quyết định retire | H | P (none proven) | CC | S9, S19, S31, S38 | Trong · chưa có hành động (ứng viên mở rộng H1) |
| V14 | Cưỡng chế phân tán: 5 cửa, script check exit 1, script mồ côi; RUL11 chỉ có test câu chữ; 5/18 bất biến bị chặn thật | D | P/R | CC | S23-S28 | Trong · chưa có hành động |
| V15 | Doctrine riêng của fgOS nằm trong file vendor untracked; worktree không nạp | B | none proven | SH/IN | S1, S34 | Trong · H3 |
| V16 | Không có chủ rõ cho quy ước: 3/15 có một nguồn cộng cơ chế kiểm; engine instruction một-chủ chỉ chứa 1 unit | điều kiện nền (SH) | P | SH | conditions §2; S35 | Trong · nền của H1, H2, H6 |
| V17 | Không có bộ đo hành vi để biết một thay đổi có tác dụng hay không | điều kiện nền (DL) | — | DL | conditions §4.3 | Trong · H4 |
| V18 | Brief của lead chép luật đã chết hoặc ngược luật; chỉ 1/20 brief nêu cờ phạm vi | BR | O/U | BR | M03, M13, M19, T01, T07, M35 | Trong một phần · H2 |
| V19 | `rtk` biến dạng output: đếm 130 so với 3320, cắt pipe >10 MiB với exit 0, từng viết lại một định danh | G2 | X/U | CU | M24, M25; đo trực tiếp | Ngoài (không sửa), ghi nhận |
| V20 | Lỗi sản phẩm fgOS khác: regenerate baseline với cờ khác xoá ~785 dòng (M12), claim file rỗng khiến cơ chế kiểm sống không chạy (M35), test không hermetic trong phiên agent (M40) | H | O/X | SP | M12, M35, M40 | Trong nhưng không phải path/tên: work item riêng |
| V21 | Phiên song song, checkout chung: mất file, đổi nhánh, race ghim worktree, cwd drift (12 ca) | G2/G3, B, A | P/X/U | VH/CU/CC | M04, M07, M08, M09, M17, M18, M22, M36, M37, M38, T08, T10 | Ngoài phạm vi RUL11, tạm gác |
| V22 | Lỗi năng lực model hoặc công cụ ngoài, không can thiệp được ở harness | G1/G2 | X/U | MD/CU | M15, M20, M33, T04, T01 | Ngoài |
| V23 | Hook/skill `ak`/`ck`: mâu thuẫn YAGNI, Naming, descriptive-name; 11 hook trùng; 83 cặp skill song sinh | C, F | none proven | SH | S2, S4, S5, S20 | Ngoài (của người khác), ghi nhận tác động |
| V24 | Nhiễu và trùng nội dung của fgOS: khối GitNexus/MDView chép hai lần, 18 `fgos-*` liệt kê hai lần, 302 file trùng giữa hai gốc docs | F, D | none proven | SP | S6, S12, S21 | Trong · phụ lục dọn token, không phải hành vi |

Phép đếm: 24 vấn đề; 19 trong phạm vi, 4 ngoài phạm vi hoặc tạm gác (V19, V21, V22, V23), 1 là phụ lục token (V24). Trong 19 vấn đề trong phạm vi: 14 có hành động ở mục 7 (V1-V11, V15, V17, V18), 1 là điều kiện nền của H1, H2, H6 (V16), và 4 chưa có hành động (V12, V13, V14, V20).

Chỉ khoảng 5/38 phát hiện cấu trúc có triệu chứng hành vi đo được; phần còn lại là artifact hoặc tương quan, và hai kit hook trùng là "none proven" cho hành vi, chỉ chắc về token.

## 6. Cái gì tốt, giữ nguyên

- Bằng chứng rằng cửa sinh tên thì không lệch: thư mục plan do công cụ (`ak plan create`, của AgentKit, chỉ ghi nhận) sinh tên đúng 15/15. fgOS cần cửa tương tự cho chính mình (H2).
- Cưỡng chế phần code: test kiến trúc, pre-commit chặn ghi `.fgos`, hook `dispatch decide`, test drift bản render skill.
- Việc gỡ có chủ ý và có commit (bee, `docs/decisions/*.md`, skill retire).

## 7. Hành động (đã lọc theo phạm vi fgOS và theo bằng chứng)

Chưa có hành động nào được thực hiện. Mỗi hành động thành work item riêng khi anh duyệt, theo luật impact analysis và "đọc spec trước khi sửa" của repo. Thứ tự: H1, H2, H3 là cơ chế, không phụ thuộc nhau, không cần chờ thí nghiệm. H4 quyết định có nên sửa phần văn xuôi hay không. H5 đã chốt, H6 chờ anh.

| # | Hành động | Ở đâu (fgOS sở hữu) | Vấn đề | Bằng chứng | Trạng thái |
|---|---|---|---|---|---|
| H1 | **Một cửa cho mỗi năng lực, đã thu nhỏ sau khi kiểm tra.** (a) Roster: hai skill cũ (`fgos-code-panel`, `fgos-plan-loop`) đã bị gỡ, **nhưng roster chép tay còn trong `core/skills/fgos-architecture-panel/SKILL.md`** (executor id đã đổi tên `claude-bwrap`/`agy-bwrap`/`codex-bwrap`, không có trong `.fgos/config.json`; planner xác nhận, em kiểm lại): lấy roster từ config và thêm test chặn roster chép tay. (b) File render chưa có header "generated" (đã xác nhận ở `.claude/skills/fgos-routing/SKILL.md`, `.agents/skills/fgos-routing/SKILL.md`): sửa bộ build (`scripts/build-skill-wrappers.mjs`, `src/setup/skill-wrappers.mjs`) ghi header sau frontmatter, test drift hiện có sẽ ép; sửa `AGENTS.md:130` trỏ `core/skills/_shared`. (c) Cửa `fgos`: **đã chốt Rust `fgos` là chuẩn** (anh quyết: Node component sửa trực tiếp vẫn được kích hoạt qua host Rust; verb Rust phải build lại). Điều chỉnh sau khi kiểm: máy này đang kích hoạt một **bản release dán chặt theo digest** (`.fgos/installation/activation.json`: `releasePath` `~/.local/state/fgos/releases/sha256:a1ba…`, `exact-digest`), và cả 8 release đều chứa một **bản sao** Node ở `libexec/legacy-node`, không trỏ vào repo. Nghĩa là sửa `bin/fgos.mjs` hay `src/**` trong repo **chưa có hiệu lực** qua `fgos` cho đến khi build và kích hoạt bản mới; đó là nguồn gốc ca M42. Việc cần làm: ghi quy tắc "Rust `fgos` là cửa chuẩn" trong `AGENTS.md`; làm rõ cách kích hoạt kiểu phát triển (root Node trỏ vào repo, memory ghi `root: "."`; chưa kiểm cơ chế bật) hoặc quy trình stage lại sau mỗi thay đổi; thêm check `fgos doctor` báo khi release đang kích hoạt khác bản build của HEAD (đăng ký theo luật doctor). (d) Ví dụ skill ngược engine: đã xong (M10: skill bị gỡ; M06 sửa ở `e92cfe66f` và `d74dfea58`, ba skill trỏ chung một playbook `_shared/catchup-self-recovery.md`); chỉ ghi bằng chứng và đóng | `core/skills`, `domains/**`, `scripts/`, `src/setup/`, `AGENTS.md`, `fgos doctor` | V1, V3 (V2, V4 có thể đã xử lý) | M23, M30, M42, M32, D03 (T06, M10 có thể đã được xử lý; M06 chưa kiểm) | Sẵn sàng sau khi kiểm (a), (d) |
| H2 | **Quy ước tên (b)** `{type}-{YYMMDD-HHMM}-{slug}.md` thành một component Rust sở hữu quy ước có thể sinh và kiểm (tên chốt: `convention`, crate `fgos-convention`, nhóm lệnh `fgos convention name|path|check`). Hợp đồng: `name`, `path`, `check`; một cài đặt duy nhất bằng Rust trả phong bì `fgos.v1`, test giá trị chuẩn nằm trong `cargo test`; Node chỉ là client mỏng qua `invokeHost` (`src/util/host-bin.mjs`, theo mẫu `src/observe/friction-client.mjs`), tiện ích mở rộng viết bằng Node dùng cùng đường đó (tầm nhìn: Rust thay hẳn Node, không có cài đặt Node thứ hai). `convention` là thành phần lõi built-in Rust, không phải plugin; client Node là cầu nối tạm, biến mất khi Node core bị thay. Extension (tiến trình ngoài bằng Node/Rust, hoặc WASM sau này, theo `docs/architect/host-invocation-routing/external-provider-protocol.md`) không có thư viện `convention` riêng: dùng `fgos convention ... --json`, hoặc không cần gọi vì `fgos convention check` ở pre-commit và doctor bắt file sai quy ước, phủ mọi ngôn ngữ; `AGENTS.md` giữ một dòng trỏ vào lệnh. Thay thế chứ không trùng với `src/runner/paths.mjs` (còn 78 lời gọi đi vòng) và giữ `paths.mjs` đến khi host Rust sở hữu các nơi gọi. Id: tách phần tất định (định dạng, kiểm hợp lệ) khỏi phần cấp phát duy nhất (cần state, thuộc chủ state); hoãn đến khi có bằng chứng lệch id. Bước 0 là spec vùng mới, kiểm `docs/platform/component-boundary.md`, đăng ký check vào `fgos doctor`. Bước 1: `name` và `path` cho report/plan/journal cộng `check` | spec mới, crate Rust (vị trí chưa chọn), `bin/fgos.mjs`, `AGENTS.md`, `fgos doctor` | V5, V6, V18 | Từ số đo drift và 40/46 tên đọc sẵn trong brief; chỉ M19 liên quan trực tiếp | Đã quyết (b) và Rust; đã chốt tên `convention`; còn kiểm 3 điều (mục 8) |
| H3 | **Chặn rác ở gốc repo lúc commit** và đưa luật thiếu thật vào `AGENTS.md` kèm cơ chế: nơi để file nháp, không tạo cửa hậu để test xanh | `.githooks/pre-commit`, `AGENTS.md` | V7, V8, V15 | T02, T03, S30, S34 | Sẵn sàng, nhỏ; hôm nay gốc repo vẫn còn khoảng 30 file nháp (lỗi đang sống) |
| H4 | **Thí nghiệm A/B** cùng việc nhỏ dưới các bộ instruction khác nhau; bổ sung nhỏ ở mục 4.3 (rubric, script chấm, 3 kịch bản) | `plans/`, `dogfood-fixture` | V9, V17 | Quyết định sửa văn xuôi hay không phụ thuộc kết quả; đáp án "tên đúng" có nhờ H2 | Cần anh duyệt (tốn quota) |
| H5 | **Hỏi hay quyết, phương án (b').** Giữ nguyên luật global của anh (`~/.claude/rules/CLAUDE.md:7-8`); thêm một câu làm rõ ở phía repo, ngay dưới `AGENTS.md:19`: "Khi phân tích của chính agent đã chọn rõ một phương án, hãy quyết và báo cáo, không hỏi lại. Chỉ hỏi khi các phương án thật sự ngang nhau hoặc phụ thuộc vào ý định của người dùng." | `AGENTS.md` | V10 | M02, M11, M13 | Đã chốt (b'); chưa làm. Là văn xuôi, nên hiệu quả đo bằng H4 |
| H6 | **Foundation và reading-map.** Plan `260925-documentation-authority-unification` **đã chạy dở trên một branch riêng**: worktree `~/projects/forgentX-phase00-documentation-authority-unification`, branch `plan/260925-documentation-authority-unification`, đã đóng pha kiểm kê (Phase 02: "close approved inventory phase"), rồi chuyển plan sang định dạng phase-file và đánh giá "cost-aware review harness … gated on Observe plans" (tạm dừng chờ Observe). branch có 59 commit chưa merge vào main, còn main đã đi trước branch 399 commit (tính từ 2026-09-29), **chưa merge**; bản `plan.md` trên main vẫn ghi "Proposed — not authorized", đã cũ so với branch. Em đã nói sai ở lượt trước ("không thấy dấu hiệu phase nào chạy"). | plan 260925 và worktree của nó | V11 | 3 bản platform-foundations, 2 reading-map | Quyết định cần anh: nối lại plan từ branch (không phải "cho chạy Phase 00-01") |

Hai điểm yếu của danh sách này:
1. **H2 chưa chắc giảm số nguồn mâu thuẫn.** fgOS không sửa hook ak/ck, nên agent vẫn thấy hai khối `## Naming` khác nhau và `AGENTS.md` thành tiếng nói thứ tư. Cách giảm thiểu duy nhất trong phạm vi là lệnh sinh tên để agent không tự dựng tên, tức cơ chế ưu tiên hơn văn xuôi. Việc nó thắng được các khối chèn hay không là UNPROVEN, và H4 là cách đo.
2. **Tác động nhỏ so với 57 ca.** H1 chạm khoảng 5 ca (T06 và M10 có thể đã được xử lý), H3 chạm 1-2 ca, H2 chạm rất ít ca trực tiếp. Phần lớn lỗi còn lại thuộc sản phẩm fgOS, công cụ và model, không nằm trong danh sách này.

## 8. Quyết định đang chờ anh

Đã chốt 2026-10-06: D2 = `git mv` `tsk-1op-case-study-note.md` vào `docs/history/`; G1 duyệt có điều kiện (xoá 30 file tracked + `output.txt` sau khi gắn tag `pre-root-junk-cleanup`; `output.txt` chỉ có 19 byte `produced by worker`, rò từ một test; xác nhận cuối vẫn lấy lúc thi hành). Mặc định lead nhận (anh đổi được): Plan B Q6-Q9 theo khuyến nghị của planner. Đã chốt: **D1 = B** (anh quyết 2026-10-06) cho Plan A, lệnh `fgos:dev` thuộc phase 04 của Plan A, còn C là plan draft riêng `plans/261006-1445-fgctl-dev-activation/` (anh xác nhận; chưa có tác giả extension Node nào nên chưa lên lịch; mục "Dev / Source Activation" rơi khỏi `docs/platform/` là không cố ý, nên Plan C khôi phục một mục đã "Settled for V1", không đảo quyết định); quy ước tên (b); bố cục package của `convention` theo thực tế (Q10: `packages/convention/{contracts,rust/{src,tests}}`, client Node ở `src/convention/`); `ak-*`, `ck-*`, hook và rules của AgentKit/ClaudeKit là dự án của người khác, chỉ ghi nhận tác động; foundation và reading-map giao cho plan `260925-documentation-authority-unification` (trạng thái "Proposed — not authorized for execution", một commit `2085d88fe`); phiên song song trên checkout chung tạm gác.

Đang chờ:
1. **H4:** chạy thí nghiệm A/B không? Khuyến nghị có, trước khi sửa phần văn xuôi.
2. ~~H5: hỏi hay quyết~~ **Đã chốt (b')** lúc 13:56: không đụng luật global của anh, thêm một câu làm rõ vào `AGENTS.md` dưới dòng 19 (văn bản ở hàng H5, mục 7). Các phương án đã loại: (a) ngưỡng "chỉ hỏi khi X", (b) sửa luật global, (c) không đổi. Lý do loại (b): luật global là luật riêng của anh cho mọi dự án, không nên tự sửa. Cái giá của (b'): chỉ phủ repo này và là văn xuôi, có thể vẫn bị bỏ qua (ba ca M02, M11, M13 xảy ra dù `AGENTS.md:19` đã có); đo bằng H4.
3. **H6:** agent nối lại đã xong (2026-10-06 16:3x): main đã merge vào branch (`merge-base --is-ancestor` thành công, cây sạch, chưa push, không chạm main checkout; em kiểm lại), kiểm kê tái sinh, claim "Dev / Source Activation" đã vào `dropped-claims-register.json`, plan cập nhật bằng `ak:plan`, không phase nào được phép. Báo cáo: `resume-261006-1635-doc-authority-unification.md` trong worktree. **Cập nhật 2026-10-06 (anh quyết):** plan 260925 được thi hành ở một phiên chat riêng, chat điều tra chỉ hoàn thiện plan và ý định, không chạy phase nào; việc sửa script (a) chỉ việc 1 (bộ sinh bỏ qua file kết quả của chính nó) được phép, làm ở bước đầu Phase 4, còn việc 2 và 3 là điều tra trước, không sửa cổng; (b) và (c) đã đồng ý (xem `plan.md` §7.5b). Còn chờ anh cho phép bắt đầu Phase 4. Trước đó đã ghi: (a) cho sửa script của plan (bộ sinh kiểm kê hết bộ nhớ vì đọc chính kho kiểm kê của nó; `verify-phase-02` và hai test shipped-path), (b) duyệt nội dung các sửa đổi gốc cũ (ratchet ghi 24 sửa + 1 file mới, đều còn nợ review nội dung) và quy tắc cho các lần sync sau, (c) chấp nhận việc main chuyển `plans/260825-1841-knowledge-registry/` vào `archive/plans/` hay không. Lỗi cần sửa trong plan: cutover đang phụ thuộc vào Plan C phase 05, nhưng Plan C là draft chưa lên lịch.
4. **Doer ở T01-T04, T07 chạy runtime nào, có đọc `AGENTS.md` không?** Quyết định nên đặt luật ở `AGENTS.md` hay nơi khác.
5. **H2: tên component, đã chốt `convention`** (em chọn theo yêu cầu của anh; "address" bị anh đánh giá là khó hiểu). Nếu anh muốn đổi thì phương án thay thế là `naming`. Tiêu chí: người mới đọc hiểu nó làm gì; không đụng thuật ngữ sẵn có (số file dùng từ đó trong `docs/specs`, `core`, `domains`, `src`, `bin`, `packages`, `apps`: registry 377, identity 76, convention 51, naming 50, catalog 34, resolver 32, layout 27, namespace 19, address 15, placement 12); ngắn, dùng được làm tên crate và nhóm lệnh; tự giới hạn phạm vi, khó thành thùng rác. Ứng viên:
   - `convention` (khuyến nghị): quy ước chạy được, tức sinh và kiểm. Khớp từ anh dùng ("quy ước tên"). Chỉ nhận cái nào là một quy ước có thể sinh và kiểm. Nhược: danh từ trừu tượng.
   - `naming`: dễ hiểu nhất, khớp triệu chứng. Nhược: không nói tới path.
   - `layout`: đặt ở đâu, hình dạng ra sao. Nhược: trùng nghĩa gần với "on-disk layout" của state (27 file), không nói tới tên.
   - `filing`: ẩn dụ hồ sơ, đặt tên và cất đúng ngăn. Dễ hiểu với người, tự giới hạn. Nhược: lạ trong code.
   - `scheme`: "naming scheme", chính xác, gồm tên, path, id. Nhược: dễ lẫn với URI scheme.
   - `address`: gồm tên, path, id. Nhược: khó hiểu (anh đã nói); 15 file đã dùng, em chưa kiểm nghĩa.
   - Loại: `utils` (thùng rác), `registry` (377 file), `identity` (đã là thuật ngữ session/runtime identity), `catalog`, `resolver` (đã dùng cho doc registry).
   Chưa kiểm, ghi vào spec bước 0: giao thức §3 có cho extension gọi ngược host không; code `ExternalWasm` đã có hay mới chỉ có tài liệu; extension Node có dùng được `FGOS_HOST_BIN` không; cách bật kích hoạt kiểu phát triển cho repo này (root Node trỏ vào repo) hoặc quy trình stage lại, để Rust `fgos` (đã chốt là cửa chuẩn) thấy code đang sửa. Đã kiểm 3 điều trước bước 0 (2026-10-06): (1) track Rust R1 **đã đóng** (plan ở `archive/plans/260910-1700-rust-host-r1-kernel/`, commit `dfffc54bb`, `817ac7f3c`); `packages/host-runtime/contracts/command-routes.json` có 72 selector, chỉ 4 native (`friction`, `gate-bypass`, `metrics`, `version`), 68 còn `legacy-cli`. Không còn rào chắn. (2) Mẫu component là `packages/<tên>/{contracts,rust/{src,tests}}` (code Node ở `src/<tên>/` cấp repo; Q10 đã quyết theo bố cục này), crate `fgos-<tên>` phụ thuộc `fgos-host-runtime`, lắp ở `apps/fgos` (`wiring/`), khai route trong `command-routes.json` kèm test `test/rust-host/command-routes.test.mjs`; vị trí đề xuất `packages/convention/`. (3) Quét theo mẫu: khoảng 19 file trong `src/`, `scripts/` có sinh id hoặc token (`randomBytes` 11, `randomUUID` 5, băm cắt chuỗi 3, `Date.now()` trong id 4, hàm tên `*Id` 3); không có `uuid`/`rand` trong Rust. Chưa đọc từng file để xác nhận đó là id chứ không phải tmp tag hay nonce. Có vẻ hai bộ cấp decision-id (`src/runner/merge.mjs` `nextFreeDecisionId`, `scripts/next-doc-id.mjs`).
6. Ưu tiên thấp: `check-decision-codes` (375 vi phạm), phạm vi doc registry (15%).

## 9. Bất đồng giữa hai người chấm (10 ca nguyên nhân)

D03 (H/B), M02 (E/D), M13 (E/D), M14 (B/A), M22 (G3/A), M30 (G1/A), M32 (A/C), M35 (G1/H), T01 (G1/C), T08 (G1/E). Lớp can thiệp lệch ở 11 ca; hầu hết cùng là SP/IN/VH. Ranh giới chính: A/H (D03, M32 là lỗi sửa vào bản render), E/D (hỏi thừa), G1 với mọi thứ khác. Không làm tròn: các ca này tính vào "lệch" trong mục 3.

## 10. UNPROVEN

- Tỉ lệ nguyên nhân trong quần thể ca thật (mẫu không ngẫu nhiên, không mẫu số).
- Quan hệ nhân quả "một chủ cộng cơ chế → ít drift" (15 quy ước, nhiễu chéo).
- Hai kit hook có gây lỗi hành vi hay không; Claude Code có khử trùng hai lệnh hook y hệt trong cùng một file settings hay không.
- Cơ chế nào của đề xuất CC đã tồn tại sẵn; `--setting-sources` của Claude CLI có loại được `CLAUDE.md` và rules không.
- Số ca "có thể ngăn" của từng đề xuất là suy luận.
- Ai viết hai prompt ngày 09-15 và 09-20; brief dispatch ra ngoài tiến trình.
- Cách `gitnexus analyze` và `mdview` chọn file để ghi khối (xoá bản trùng có bị sinh lại không).
- Chưa chạy `fgos doctor`; token chỉ ước lượng.

## 11. Phụ lục: dọn token (không phải sửa hành vi)

Khối GitNexus/MDView trùng byte (3664 B) → giữ ở `AGENTS.md` cùng khối "Impact-analysis capability gate" và xoá phía `CLAUDE.md`, nhưng khối do tool sinh nên phải kiểm cấu hình tool trước; 18 skill `fgos-*` hiện hai lần trong catalog (`fgos-X` và `fgOS:fgos-X`); 302 file giống hệt `docs/architect` vs `docs/platform`; `AGENTS.md:64-66` mâu thuẫn `:13`; khoảng 5 path chết trong `reading-map.md`; 22 tham chiếu `fgos-coding-compounding` mồ côi.

## 12. Câu hỏi còn mở

Xem mục 8 và 10. Chưa lập plan triển khai; chỉ khi anh duyệt thì lập plan riêng.
