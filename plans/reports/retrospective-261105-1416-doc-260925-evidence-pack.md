# Evidence pack: hồi cứu plan 260925 (documentation authority unification)

Ngày lập: 2026-11-05 (Asia/Saigon). Đây là nguồn dữ liệu cho chuỗi sáu bài hồi cứu. Mỗi dòng có nguồn. Dòng nào nghiên cứu ghi là chưa kiểm chứng thì được đánh dấu **UNVERIFIED** hoặc bỏ hẳn (danh sách bỏ ở mục 5).

## Quy ước nguồn

- **R-genesis**: [research-261105-1411-retrospective-genesis-compound-era.md](research-261105-1411-retrospective-genesis-compound-era.md)
- **R-middle**: [research-261105-1411-retrospective-middle-growth-era.md](research-261105-1411-retrospective-middle-growth-era.md)
- **R-trigger**: [research-261105-1411-retrospective-plan-260925-trigger.md](research-261105-1411-retrospective-plan-260925-trigger.md)
- **R-built**: [research-261105-1412-retrospective-plan-260925-built-and-gained.md](research-261105-1412-retrospective-plan-260925-built-and-gained.md)
- **R-cost**: [research-261105-1411-retrospective-plan-260925-execution-cost.md](research-261105-1411-retrospective-plan-260925-execution-cost.md)
- **TAG** = `archive/doc-260925-lineage` (commit `84bbfa7b8`); **P** = `plans/260925-documentation-authority-unification`.
- **Lead check 2026-11-05**: ba sự kiện do Lead xác nhận: (a) `97cc4b432` là đỉnh fast-forward mà Phase 10 land lên main, các commit công việc của Phase 10 là `46310f968..00c64d5a5`; (b) tag `archive/doc-260925-lineage` (`84bbfa7b8`) chỉ có trên máy owner, không push lên origin, để giữ 7,5 GB evidence ngoài main; (c) write lease của cutover được gỡ ở `ad72e3a46` (2026-11-04).
- **Fact-check**: [review-261105-1423-doc-260925-retrospective-claims.md](review-261105-1423-doc-260925-retrospective-claims.md), trích theo số claim (#N). Bản pack này đã sửa theo các edit của nó.
- **Writer check 2026-11-05**: kiểm tra trực tiếp, chỉ đọc, của người viết (`git log -1` và `sed` trên file ở main).
- Memory notes được trích theo tên file trong `~/.claude/projects/-home-vantt-projects-forgentX/memory/`.

## 1. Dòng thời gian gộp (genesis đến 2026-11-04)

| Ngày (+0700) | Commit / file | Sự kiện | Nguồn |
|---|---|---|---|
| 2026-07-13 11:34 | `f6139bf57` | Root commit, chỉ có `LICENSE`. | R-genesis §1 |
| 2026-07-13 13:29 | `a21d9446c` | Tài liệu đầu tiên: README định vị (gõ sai thành `READEME.md`) và `docs/naming.md`. | R-genesis §1 |
| 2026-07-13 13:30 | `2930a89fc` | Hệ "reference learning" (`docs/references/*`), tiền thân của distillery. | R-genesis §1 |
| 2026-07-14 00:01 | `ebc6e8047` | Deep-dive `compound-engineering`: "mỗi đơn vị công việc để lại hệ thống KHÁ HƠN cho đơn vị kế". | R-genesis §1, §2.1 |
| 2026-07-14 00:03 | `823926cc7` | Onboard bee 0.1.32; `AGENTS.md`, `docs/history/learnings/critical-patterns.md`. | R-genesis §1 |
| 2026-07-14 00:28 | `e9ff70db7` | `docs/platform-foundations.md`: tám luật L1 đến L8 của compound-learning stack. | R-genesis §1, §2.2 |
| 2026-07-14 02:26 | `ad65f59fd` | `docs/specs/` ra đời (work-state, system-overview, platform-foundations, reading-map); bản thứ hai của luật nằm ở `docs/specs/platform-foundations.md`. | R-genesis §1, §3.7 |
| 2026-07-14 | `06df4970f` | `docs/routing-handoff-contract.md` đặt ở gốc `docs/`, ngoài `specs/`. | R-middle §1 |
| 2026-07-14 20:02 | `e99998633` | "Repo divorce": `/plans/`, `/docs/history/`, `/docs/distillery/` bị ignore khỏi repo sản phẩm. | R-genesis §3.3 |
| 2026-07-14 22:48 | `c93aa4acf` | `docs/decisions/` với 9 ADR chưng cất tay từ 17 quyết định nguồn. | R-genesis §1, §3.2 |
| 2026-07-15 10:20 | `8c7be926a` | `docs/work-item-lifecycle.md`: bước 5 là "Compound-learning". | R-genesis §2.4 |
| 2026-07-16 | `2d60303ef` | `docs/architecture-map.md` ở gốc `docs/`. | R-middle §1 |
| 2026-07-16 15:17 | `15ddd61e8` | Tuyên bố đạt bậc F4. Bằng chứng benchmark nằm ở workshop, ngoài repo: **UNVERIFIED** từ repo này. | R-genesis §2.3 |
| 2026-07-20 19:33 | `3ee30977a` | Done-gate: item coding không được tới `done` nếu chưa qua stage compound-learn; thêm `test/e2e/compound-learn-lifecycle.test.mjs`. | R-genesis §1, §2.4 |
| 2026-07-20 23:49 | `1739a83d5` | Skill `fgos-compounding`: viết tài liệu end-user theo bốn góc Diataxis. | R-genesis §2.4 |
| 2026-07-22 | `cf27ae0b3` | `critical-patterns.md` được chưng cất thành `docs/explanation/*`. | R-genesis §1 |
| 2026-07-28 | `2bbd8f70f` | Bỏ ignore `docs/history`, kết thúc thời "divorce". | R-genesis §3.3 |
| 2026-08-01 | `6e0e3c017` | Mẫu đo: 365 file trong `docs/`. | R-middle §2 |
| 2026-08-15 | `36e0602fd` | 1.500 file; `docs/history` tăng 535 lên 1.115 trong một tuần. | R-middle §2 |
| 2026-08-17 | `4722361ae` | tsk-1lv-4 dời 34 ADR vào mục "Lịch sử quyết định" của `docs/specs/<area>.md`. | R-middle §1, §3.3 |
| 2026-07-27 | `41af242e7`, `510abb006` | Script và spec guard citation drift ra đời. | fact-check #18 |
| 2026-08-17 | `4270c0c0d` | 59 phút sau, phải cập nhật baseline của guard citation drift và sửa "dead write-time sweep". | R-middle §3.3; fact-check #17, #18 |
| 2026-08-20 | `07c4a5205` | Tách doctrine core/domain; sửa tay bản render `plugins/fgOS/skills/fgos-routing/SKILL.md` trong cùng commit với nguồn. | R-middle §1, §3.9 |
| 2026-08-25 | report | 268 tài liệu end-user, +50 mỗi 7 ngày. | `plans/reports/for-external-advisor-260825-1209-doc-identity-axis-topic-registry-design-report.md` (R-middle §1) |
| 2026-08-26/27 | `ccf8ed091`, `6cce97ab3`, `7dc95a26c`..`c30261fac` | `docs/doc-registry.md`; `docRegistry.enforce` bật; tsk-5mh dời 332 tài liệu vào `docs/knowledge/`, các gốc quadrant cũ không bị xoá. | R-middle §3.4 |
| 2026-08-31 | `ba7b62ace` | `docs/architect/agent-coordination/` có cấu trúc con; tới 09-12 chứa 905 file. | R-middle §1, §2 |
| 2026-09-14 | `679585957` | Commit đầu tiên dưới `docs/platform/`. | R-middle §1 |
| 2026-09-15 03:13 | `23fb220e3` | Một commit "chore" thêm `docs/doc-governance.md` (Implementation: Partial), `docs/reading-map.md`, `docs/platform/README.md`. | R-middle §1; R-trigger §1.2 |
| 2026-09-18 | `e1307d33f` | Commit tên "fix(dispatch)..." thêm 943 file vào `docs/platform/agent-coordination/`, 0 rename, 0 xoá bản gốc. | R-middle §1, §3.6 |
| 2026-09-19 | `81437ffff` | 935 đường dẫn tương đối có ở cả hai cây; 868 giống hệt, 67 khác nhau. | R-middle §2 |
| 2026-09-20 | proposal | Proposal "documentation-system-unification" ghi `Last reviewed: 2026-09-20`. Phiên chat gốc: **UNVERIFIED** (không có trong repo). | R-trigger §1.1 |
| 2026-09-21 23:23 | `ca854f443` | Proposal được commit lần đầu trong một commit tên "refactor coordination action legality and test fixtures". | R-trigger §1.1 |
| 2026-09-25 | `cfdaf4bc9` | Ba bản luật nền (16.398 B, 33.845 B, 3.341 B); hai reading map. | R-middle §2 |
| 2026-09-25 | review files tại TAG | Hai review độc lập của bản nháp plan (Opus, rồi Gemini trên bản đã sửa): "PROCEED WITH REQUIRED CHANGES, for Phase 00 only". Opus yêu cầu Phase 00 kiểm kê trạng thái thẩm quyền trước; Gemini nêu năm phát hiện (H1, H2, M1, M2, L1). | R-trigger §1.4; fact-check #32, #34 |
| 2026-09-25 13:57 | `a725d4788` | Truth reset trả lời yêu cầu đó: authority map (snapshot `ac19f6d1e`), hai review và `plan.md` (724 dòng, "Phase 00 authorized and completed") commit cùng nhau trên nhánh plan. Đây là lần đầu `plan.md` xuất hiện. | R-trigger §1.4; fact-check #32, #35; writer check 2026-11-05 |
| 2026-09-26 22:43 | `2085d88fe` | Bản 704 dòng "Proposed — not authorized for execution" được commit lên main; `a725d4788` không phải tổ tiên của nó. | R-trigger §2; fact-check #35; writer check 2026-11-05 |
| 2026-09-26 | tag `documentation-authority-phase-01-20260926`, `-phase-02-` | Phase 2 và Phase 3 (số mới) đóng; inventory 4.305 file, 85.772 claim unit. | R-built §1; R-cost §2 |
| 2026-09-29 18:51 | `4d80eaf29` | Plan đổi sang định dạng AgentKit: `plan.md` trên nhánh từ 800 rút còn 454 dòng, mười file phase, đánh số lại từ 1. | R-trigger §2; fact-check #40; writer check 2026-11-05 |
| 2026-09-30 đến 10-05 | (không commit) | Tạm dừng. | R-cost §2; fact-check #41 |
| 2026-10-06 | `b9fee1e56`, `6b8ef0e8d`, `73142f7d6`, `3c5080b06` | Resume: merge main (main đi trước 400 commit); generator inventory hết bộ nhớ (exit 134, 137); Phase 4 đóng cùng ngày. | R-trigger §2; R-built §2 |
| 2026-10-07 | `TAG:P/reports/phase-05/pilot-method-defects.md` | Phase 5 pilot: vòng đầu "Not PASS" (E6 14/20, E7 15,6%); owner phán METHOD-MUST-CHANGE; sau một vòng sửa E6 đạt 19/20, E7 đạt theo tiêu chí định nghĩa lại; PASS-WITH-AMENDMENTS (owner). 16 drop thật bị audit cũ bỏ sót. | pilot-method-defects §3, §5, §6; R-built §2; fact-check #50 |
| 2026-10-09 | A12 | Dừng vì hết quota trong Phase 6. | R-cost §4.1 |
| 2026-10-11 | A28 | Owner: "tài liệu thôi mà sao kì công vậy ta". A28 bỏ check ngược T6=0, thay bằng mẫu 30 unit. | R-cost §4.3; memory `feedback_flag_verification_cost_early.md` |
| 2026-10-17 | A44 | Phase 6 đóng (owner). | R-cost §2 |
| 2026-10-19 | A48, A49 | Phase 7 đóng; Phase 8 được duyệt. | R-cost §2 |
| 2026-10-19 | A50, A51 | A50 (owner): gói per-edge 338 phần bị "superseded, not reviewed", review chuyển xuống mức ánh xạ. A51 (owner, "đồng ý phương án 2"): sau bảy lần sinh lại vẫn 8,3% rework, cổng Step 2 đổi thành kiểm kê cơ học; patch viết và review theo từng file tiêu thụ ở Step 3, L12-21..26 là quy tắc viết patch. | `TAG:P/reports/phase-08/owner-answers.md:193-197, 280-286`; fact-check #57 |
| 2026-10-20 | phase-11 brief | Owner yêu cầu chuỗi bài hồi cứu. | `TAG:P/phase-11-retrospective-post-series.md` |
| 2026-10-22 16:45 | memory | SSD QLC bão hoà: ghi 765 ms (nguyên nhân chủ yếu ở lane khác). | R-cost §1 |
| 2026-10-23 | L12-136 | Phase 8 đóng, 12 cổng PRE-FLIP chuyển sang Phase 9. | R-built §2; R-cost §2 |
| khoảng 2026-10-27 | memory | Partial đang đỏ của Doer bị merge vào nhánh plan, làm đỏ mọi lần chạy proof. | R-cost §4.6 |
| 2026-10-29 11:14 | memory | Owner: "làm lâu quá. Cả 5 tuần rồi." | R-cost §4.7; memory `feedback_doc_plan_parallelize_for_speed.md` |
| 2026-10-30 | memory | Doer sửa bản oracle của mình 8 lần; 5 lần nới lỏng check hoặc thay bằng dữ liệu của chính tác giả. | R-cost §4.5; memory `feedback_author_never_edits_acceptance_tool.md` |
| 2026-11-03 22:07 (commit) / 23:50 (board log) | `97dd62aa7` | Cutover nguyên tử: 1.677 file, +182.794 / -239.220. | R-built §2; writer check 2026-11-05 |
| 2026-11-04 | `b37aea82c` | Phase 10 viết lại thành "không verb mới, không checker song song". | R-built §2 |
| 2026-11-04 12:56 | `97cc4b432` | Phase 10 land (đỉnh fast-forward); công việc là `46310f968..00c64d5a5`. | Lead check 2026-11-05; writer check 2026-11-05 |
| 2026-11-04 15:46 | `ad72e3a46` (merge), `c7a354e1d` | Gỡ write lease: 39 file, +182 / -2.734. | Lead check 2026-11-05; R-built §1 |

## 2. Chuỗi nhân quả

| # | Mắt xích | Bằng chứng |
|---|---|---|
| 1 | Ngày 07-14, luật nền có hai bản (`docs/platform-foundations.md`, `docs/specs/platform-foundations.md`); contract và architecture map đặt ở gốc `docs/`. Ngay từ đầu đã có ít nhất ba chỗ có thể sở hữu một claim, và không có dấu nào chỉ ra chỗ nào có thẩm quyền. | `e9ff70db7`, `ad65f59fd`, `06df4970f`, `2d60303ef`; R-middle §3.1 |
| 2 | Repo divorce đẩy history, plan và report ra workshop trong hai tuần; bằng chứng cho F4 nằm ngoài repo. | `e99998633`, `2bbd8f70f`, `15ddd61e8`; R-genesis §3.3 |
| 3 | Kho tri thức đổi chỗ ít nhất bốn lần trong sáu tuần (`docs/history/learnings`, event `.fgos`, quadrant Diataxis, `docs/knowledge/`). | `823926cc7`, `0228c4034`, `cf27ae0b3`, `d889032c0`; R-genesis §3.4 |
| 4 | Mỗi work item ghi evidence vào cùng cây `docs/`, skill tự sinh thêm tài liệu; "viết mới hay viết thêm" chỉ do `fs.existsSync` quyết định. `docs/` tăng 365 lên 4.301 file trong 8 tuần, `specs/` vẫn 11 đến 13 file. | R-middle §2, §3.2; report 2026-08-25 |
| 5 | Dời ADR vào specs: guard citation drift đã có từ 27/7 (`41af242e7`, `510abb006`) nhưng lần dời vẫn để lại tham chiếu chết; 59 phút sau `4270c0c0d` phải cập nhật baseline của guard và sửa sweep. | `4722361ae`, `4270c0c0d`; R-middle §3.3; fact-check #17, #18 |
| 6 | Hai registry tài liệu end-user trong một tuần; gốc cũ không xoá; 332 tài liệu đều `provisional`, số topic bằng số tài liệu. | `ccf8ed091`, `6cce97ab3`, tsk-5mh; R-middle §3.4 |
| 7 | Cây `docs/architect/agent-coordination` phình thành nơi chứa payload (905 file tới 09-12). | `ba7b62ace`; R-middle §3.5 |
| 8 | Cây đích `docs/platform/` được tạo bằng cách chép chứ không dời: 943 file ở `e1307d33f`, 67 bản tách nhánh. Governance ghi "Implementation: Partial". Ý định của người chép: **UNVERIFIED**. | `23fb220e3`, `e1307d33f`; R-middle §3.6 |
| 9 | Di trú từng khu, nên thẩm quyền chia ba: 3 promoted, 3 candidate, 12 legacy-current; portal promoted vẫn trỏ ngược về `docs/architect/**`. | R-middle §3.7; current-authority-map 2026-09-25 |
| 10 | Bên tiêu thụ luôn được nạp (AGENTS.md, `core/instructions`, skill) không đổi sang switchboard: AGENTS.md vẫn trỏ `docs/specs/*`. | `cfdaf4bc9:AGENTS.md`; R-middle §3.8 |
| 11 | Bản sao skill nhân lên qua các render target (`.agents/skills`, `.claude/skills`, `plugins/fgOS`), có bản bị sửa tay. | `07c4a5205`, `e859e71d6`; R-middle §3.9 |
| 12 | Kết quả: proposal 09-20 yêu cầu bỏ hẳn cây legacy; review bản nháp plan ngày 09-25 phát hiện "three authority rules are live at the same time and disagree"; truth reset và plan được commit trên nhánh (`a725d4788`), rồi lên main (`2085d88fe`). | `ca854f443`, `a725d4788`, `2085d88fe`; R-trigger §1.3, §1.4; fact-check #32, #35 |

## 3. Bảng chi phí

| Chỉ số | Giá trị | Nguồn |
|---|---|---|
| Lịch, từ commit đầu tới landing | 2026-09-25 đến 2026-11-03: 40 ngày (khoảng 5,7 tuần) | R-cost §1 |
| Lịch, tới hết Phase 10 | 41 ngày (2026-11-04) | R-cost §1; Lead check 2026-11-05 |
| Commit trên nhánh plan | 2.143 (09: 59; 10: 1.858; 11: 226) | R-cost §1 |
| Ngày đỉnh | 10-25: 146; 10-27: 139; 11-01: 135; 10-07: 134 | R-cost §1 |
| File trong cây plan tại TAG | 11.669 (11.423 dưới `reports/`) | R-cost §1 |
| Dung lượng cây plan | 7.508.112.807 byte (khoảng 7,5 GB thập phân) | R-cost §1 |
| Blob lớn nhất | `phase-09/fchain/g7-r6-rebind-batch.json` 457 MB; 9 blob trên 100 MB | R-cost §1 |
| Bản nén evidence | 575,4 MiB (`.tar.zst`) | R-cost §1 |
| File review per-unit | 1.647 `review-*.md` | R-cost §1 |
| Tỉ lệ rework trên toàn bộ review per-unit | **Chưa đo được**: verdict nằm theo dòng bảng, chưa parse (con số 19/10/7/2 trước đây không tái lập được, đã bỏ) | R-cost §6; fact-check #77 |
| Tỉ lệ rework mẫu | Phase 6 sớm 1,8%; Phase 8 step-02j 106/1.275 = 8,3% | R-cost §1 |
| Quyết định có số | A1..A51 (51), L10 42, L11 28, L12 137, L13 110 trong file (L13-156 trong board log); tổng **ít nhất 368** (cận dưới). 33 mã A là owner-decided hoặc owner-directed (A5, A10, A15-17, A19-21, A26, A28-51); A11 không ghi người quyết; 17 mã Lead-decided | R-cost §3; fact-check #73, #74 |
| Dòng board log của lane DOC | 180 trên 1.381 | R-cost §1 |
| Số lượt Doer / reviewer gắn riêng cho plan | **UNVERIFIED** (2.249 assignment trên cả máy, không tách được) | R-cost §1, §6 |
| Giờ công, token, chi phí model | **Không đo** | R-cost §6 |
| Bị bỏ / xoá | Gói per-edge A36 (338 part, A50); check T6=0; write lease (thiết kế Phase 4, dựng Phase 8, xoá 11-04) | R-cost §4.10; Lead check 2026-11-05 |
| Phần code dọn đi ở Phase 10 và sau đó | `159971615`: -7.426 dòng script, xoá 22 file test (xoá 35 file; -13.856 dòng cả commit); lease: -2.734 dòng trên 39 file | fact-check #93; writer check 2026-11-05; `c7a354e1d` |

## 4. Trạng thái mở tại 2026-11-05

| Mục | Bằng chứng |
|---|---|
| DOCOS: "not-planned", chưa có plan | `plans/261017-1313-fgos-platform-program-board/plan.md:80`; R-built §4 |
| doc-health chỉ chạy trong `npm test`, không ở pre-commit, không có doctor row | `docs/platform/convention/spec.md:382`; R-built §4 |
| Evidence chỉ có ở máy owner (tag local + một tar). Trên main chỉ còn bản ghi digest của sealed ledger (68.441 dòng, ghim `2a028cdc9`) và 28 file trong thư mục plan (27 lúc cutover) | Lead check 2026-11-05; R-built §4; fact-check #89, #96 |
| `plan.md` ở main lệch trạng thái lúc viết (đã sửa trong `36737e5d6`): frontmatter `status: in-progress`, H1 "active migration plan", dòng 15 vẫn ghi việc gỡ lease "follows as its own item", Phase 11 "pending" | writer check 2026-11-05 (`plans/260925-documentation-authority-unification/plan.md` dòng 4, 12, 15, 262) |
| Guard Phase 9 không có hiệu lực qua host đã cài lúc landing (gap G1); release `47e1016d` sau đó chưa được kiểm lại | R-built §2 (UNVERIFIED cho release sau) |

## 5. Những gì đã bỏ vì thiếu nguồn

- Nguyên nhân `.agents/skills` và `plugins` nhảy số giữa 08-15 và 08-22 (R-middle §4.1).
- Bản sao 67 file tách nhánh trước hay sau lần chép 09-18 (R-middle §4.2).
- Ai quyết định chép thay vì dời ở `e1307d33f` (R-middle §4.6): chỉ nêu là chưa rõ.
- "Bản viết lại plan 10-06": không tìm thấy commit; chỉ dùng `4d80eaf29` (09-29) và resume 10-06 (R-trigger §2).
- Số liệu "479 docs/topics: 147 active, 332 provisional" của plan: re-review đánh dấu có thể sai, không dùng (R-trigger §3).
- Vòng F5 "self-improving" có được dựng hay không (R-genesis §2.3).
- Phiên chat gốc sinh ra proposal 09-20 (R-trigger §4.1).
- Số lần chạy lại cổng do SSD bão hoà (R-cost §4.8).
- Cách xử lý cuối cùng của 247 finding Phase 8 (`phase-08/owner-answers.md:2821`): chỉ nêu là chưa truy được. (E6/E7 của Phase 5 đã truy được, xem dòng 2026-10-07.)
- Bảng đếm verdict 19/10/7/2 trên 193 file và câu "khoảng 3 ngày làm việc thực" cho Phase 1 tới 5: bỏ theo fact-check #77, #65.
