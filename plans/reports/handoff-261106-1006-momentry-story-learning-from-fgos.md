# Handoff: momentry learns storytelling from fgOS sessions

Ngày: 2026-11-06 10:06. Từ: Lead `forgentx-5f` (lead:DOC). Sang: một chat mới, làm việc momentry. Chat cũ giữ lại để xem kế hoạch DOC.

## Prompt cho chat mới

Dán nguyên khối dưới đây vào chat mới (mở ở `/home/vantt/projects/momentry`):

```text
Em tiếp quản phần momentry học kể chuyện từ chính các phiên làm fgOS (forgentX). Báo cáo anh bằng tiếng Việt, xưng anh/em. Anh đã cho phép làm mọi bước cần thiết để momentry thông minh hơn, bắt được chất liệu kể chuyện hay hơn (kể cả chạy có trả phí và code momentry); tự quyết trong khung đó và báo cáo, chỉ hỏi khi các phương án ngang nhau.

Đọc trước:
1. Handoff đầy đủ: /home/vantt/projects/forgentX/plans/reports/handoff-261106-1006-momentry-story-learning-from-fgos.md
2. momentry: plans/board.md, plans/261105-story-material/plan.md (E20, của em), plans/261104-story-quality/plan.md (E17, agent khác), plans/261106-0900-user-taste/plan.md (E21), scripts/eval/README.md.

Việc trước mắt, theo thứ tự:
A. Trang chấm đang chạy cho anh (cổng 4826, link anh đã có). Anh hỏi: thêm nút "Viết góc kể" để chạy riêng một chuyện chưa có góc kể (hạng > 10). Làm ở trang chấm eval trước, rồi ở trang chi tiết chuyện của web chính momentry; nối vào `momentry angle --story` đã có; ghi giá ~0,003 USD/chuyện. Nhánh riêng, test, fetch lại main trước khi merge (agent E17 đang commit main).
B. Khi anh nhắn chấm xong: đo M.5 (0 USD, chạy lại xếp hạng) trên bộ anh chấm forgentX và bộ E17; rồi M.6 (chụp có trả phí, ~3,5 USD mỗi bộ forgentX theo lần chụp 11-06). Báo số kèm đề xuất.
C. M.2–M.4 của E20 (nguồn git, transcript subagent, chế độ nhìn lại theo phương pháp retrospective).

Luật: không commit gì dưới docs/_private/; repo momentry public nên không tên riêng, đường dẫn máy, session id, trích transcript hay tiêu đề chuyện trong file commit; không sửa lib/rank.mjs hay outsider (của E17) mà gửi đề xuất; commit conventional, không nhắc AI hay mã plan; chạy test với `env -u CLAUDE_CODE_SESSION_ID`.
```

## Trạng thái lúc giao

**momentry** (`/home/vantt/projects/momentry`, main `32bf6cd`, sạch, đã pull):
- E20 đã merge và push: bộ dò `ownerVoice`, `lessonWrite`, `blocked`; lọc nhiễu `metricPair`, `gitReversal`; sửa `validateHarvest` (câu trả lời id lạ không còn làm mất cả cửa sổ); số đo `docs/experiments/2026-11-05-material-signals/README.md`; 4 báo cáo đã lược `plans/reports/researcher-261105-*.md`. Test 370/370 lúc merge.
- E20 còn mở: M.5 (đề xuất cho E17: tầng tension chỉ hạ `none` khi stakes < 2; "Land gọn" stakes 3 rơi #27/34, mô phỏng lên #11), M.6 (thêm dòng vào `hook-tension.md` và `stakes.md` để phản đối/quyết định của người dùng không bị chấm `none`, stakes ≥ 2), M.2–M.4.
- Mới trên main (agent khác): góc kể và xương chuyện 7 ô, mã M-XXXX, câu chấm "hiểu được, không cần hỏi thêm?", `--rank-by completeness`, plan E21 học gu người dùng (T.5 dùng nhãn anh chấm).
- Chưa ra bản mới; máy anh vẫn v0.3.0.

**Bộ eval forgentX** (`/home/vantt/projects/momentry-eval/docs/_private/`, không commit):
- `eval-forgentx/labels-v2/`: nhãn nháp agent (draft-v2, 88 dòng, 8 cửa sổ). `labels-owner/`: bản chép để anh chấm qua trang; so hai thư mục để thấy anh sửa gì.
- `eval-forgentx/manifest-owner.json` trỏ `labels-owner/`.
- `eval-forgentx-main/`: lần chụp 2026-11-06 bằng main `32bf6cd`, 8/8 phiên, 3,46 USD, 251 chuyện; góc kể chỉ top 10 mỗi phiên (`angle.topN`), 9 chuyện top 10 bị chấm `none`, 170 chuyện chưa xét. Trên nhãn nháp: recall 91%, p@5 0,55, `t` nửa trên 24/31. Kết quả: `eval-forgentx-main/results/2026-11-06T02-52-39-143Z-capture.json`.
- `eval-forgentx/`, `eval-forgentx-branch/`: lần chụp 11-05 (trước góc kể) của main cũ và nhánh E20.

**Trang chấm đang chạy:** `node scripts/eval/review.mjs --labels …/eval-forgentx/labels-owner --data …/eval-forgentx-main --port 4826`, PID 1440304, nghe 127.0.0.1 và Tailscale (`design-lap.tail342564.ts.net:4826`). Khoá ở `eval-forgentx/.review-key` nên khởi động lại không đổi link. Muốn khởi động lại: kill đúng PID (đừng `pkill -f` theo mẫu, nó giết luôn shell gọi).

**Anh đang chấm:** tick `t`, xoá dòng không phải chuyện, thêm chuyện thiếu, và (nếu còn sức) kể được / không ra chuyện / bịa + "hiểu được". Anh hỏi vì sao nhiều chuyện không có nội dung: không phải lỗi hiển thị, do chỉ top 10 có góc kể; từ đó ra yêu cầu nút chạy riêng (việc A).

## Bên forgentX (để tra, không làm tiếp ở chat mới)

- Báo cáo gốc (có chi tiết phiên, không đưa sang momentry vì repo public): `plans/reports/feedback-261105-1700-momentry-story-picking.md`, `research-261105-1700-momentry-pick-algorithm.md`, `research-261105-1700-momentry-reduce-on-doc-sessions.md`, `research-261105-1700-retrospective-method-reflection.md`, `research-261105-1700-story-selection-practice.md`, `research-261105-1737-momentry-harvest-baseline-doc-sessions.md`, `research-261105-1812-momentry-branch-vs-baseline-doc-sessions.md`, `research-261105-1738-retrospective-story-candidates-ranked.md` (36 ứng viên; 9/10 đầu loạt bài đã bỏ sót).
- Loạt bài retrospective 6 phần và bản Facebook: `plans/reports/retrospective-261105-1416-doc-260925-*.md`. Anh tự đăng; agent không đăng.
- Phương pháp retrospective (đầu vào M.4): chia nguồn theo giai đoạn và câu hỏi cắt ngang, đọc transcript, gói bằng chứng, xếp hạng ứng viên từ dưới lên trước khi chọn mạch, brief không kèm kết luận, đếm bằng script, fact-check độc lập từng câu, vòng đọc của người ngoài.
