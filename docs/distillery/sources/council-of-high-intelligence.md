---
name: council-of-high-intelligence
type: git-repo
url: https://github.com/0xnyk/council-of-high-intelligence
local: upstreams/council-of-high-intelligence
last_analyzed_commit: fd9f4e5
last_analyzed_date: 2026-10-04
domains_covered: [harness, skills, hooks, workflow, orchestration, routing, integration-contract, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals]
---

# council-of-high-intelligence (0xNyk) — Feature Index

> Extracted from HEAD `fd9f4e5` on 2026-10-04. Clone: `upstreams/council-of-high-intelligence`. Phạm vi: một skill `/council` (không phải thư viện) — một coordinator protocol dài (`SKILL.md`, ~950 dòng, bốn bản mirror theo host) điều phối 18 persona "lăng kính" qua vòng thảo luận cố định, trả verdict có đo được. Bản chất: **deliberation protocol là prose cho LLM coordinator**, không có code runtime; phần code duy nhất là script kiểm tra/cài đặt.

Nguồn chỉ làm một việc: đưa một quyết định khó cho nhiều persona khác hẳn nhau, giữ vị trí đầu độc lập, ép bất đồng trực diện, rồi trả verdict giữ nguyên điều chưa giải quyết, dissent, kill criteria và bước tiếp theo cụ thể.

## workflow

### council-modes-full-quick-duo
- **What:** Ba hình dạng thảo luận cùng một giao thức: Full (restate → phân tích độc lập → cross-exam → stance cuối → tổng hợp), Quick (restate → phân tích nhanh → vị trí cuối), Duo (hai thành viên đối cực: mở đầu → phản hồi trực tiếp → chốt).
- **Where:** `SKILL.md`, `README.md`
- **Notable:** Chọn hình dạng theo giá trị của cross-exam ("dùng `--quick` khi cross-exam không đổi kết quả; `--duo` khi một căng thẳng định nghĩa quyết định"); README còn liệt kê khi nào KHÔNG nên triệu tập council (tra cứu sự kiện, thí nghiệm rẻ đảo ngược được, tìm sự ủng hộ cho đáp án đã chọn).
- **Keywords:** full, quick, duo, dialectic
- **Seen:** fd9f4e5

### named-triads-and-profiles
- **What:** Bảng bộ ba theo miền quyết định (architecture, strategy, ethics, debugging, risk, shipping, product, founder, ai-product, decision, systems, bias…) và ba profile hội đồng (`classic`, `exploration-orthogonal`, `execution-lean`); chọn panel bằng `--triad`, `--members`, `--profile`.
- **Where:** `SKILL.md`, `agents/council-socrates.md`
- **Notable:** Mỗi persona tự khai `triads`, `duo_keywords`, `profiles` trong frontmatter, nên bảng định tuyến suy ra từ dữ liệu persona chứ không viết tay hai nơi.
- **Seen:** fd9f4e5

## orchestration

### chairman-separate-synthesizer
- **What:** Người tổng hợp verdict (Chairman) là vai riêng, KHÔNG tham gia vòng 1–3; chọn trước Round 1 theo thứ tự: cờ `--chairman` → config → tự chọn model mạnh nhất, ưu tiên provider chưa có trên panel → fallback cùng provider (ghi chú trong verdict).
- **Where:** `SKILL.md`, `configs/auto-route-defaults.yaml`
- **Notable:** Ràng buộc cứng "người kiểm toán không phải người đã phát biểu"; Chairman lỗi thì coordinator tự tổng hợp và verdict ghi `FAILED — synthesized by coordinator fallback` thay vì im lặng.
- **Seen:** fd9f4e5

### blind-first-parallel-rounds
- **What:** Vòng 1 chạy song song, mỗi thành viên chỉ thấy đề bài (blind-first); vòng 2 chỉ chạy khi có kết quả vòng 1; ngân sách vòng cố định (3 vòng full, 2 quick) làm "lực ép hội tụ".
- **Where:** `SKILL.md`
- **Notable:** Hết ngân sách vòng mà chưa đồng thuận thì KHÔNG chạy thêm vòng — trả thế giằng co về cho người dùng.
- **Seen:** fd9f4e5

## quality-gates

### problem-restate-gate
- **What:** Trước phân tích, mỗi thành viên restate đề bài qua lăng kính của mình + một cách đặt lại khác (≤50 từ); lệch đáng kể khỏi đề gốc thì báo người dùng trước khi đốt vòng thảo luận.
- **Where:** `SKILL.md`
- **Notable:** Bắt lỗi "sai câu hỏi" ở bước rẻ nhất; restatements được đưa vào prompt vòng 1.
- **Seen:** fd9f4e5

### anonymized-cross-examination
- **What:** Vòng 2 che danh tính: đầu ra vòng 1 được đổi header thành `Member A/B/…`, xoá tự xưng trong thân bài; bảng ánh xạ chỉ coordinator giữ, khôi phục ở vòng 3 và verdict.
- **Where:** `SKILL.md`
- **Notable:** Dẫn chứng học thuật (Choi et al., arXiv:2510.07517, ICLR 2026) rằng danh tính gây thiên lệch thuận theo; mapping ổn định xuyên vòng để thành viên vẫn tham chiếu nhau.
- **Keywords:** conformity bias, identity masking
- **Seen:** fd9f4e5

### post-round-enforcement-scan
- **What:** Một lượt quét sau vòng 2 với năm điều kiện mechanical: dissent quota (≥2 phản đối không chồng), novelty gate (mỗi phản hồi ≥1 điều mới), agreement check (>70% đồng ý → ép phản chứng từ 2 người), evidence labels (empirical/mechanistic/strategic/ethical/heuristic, cảnh báo độc canh >80%), anti-recursion (Socrates hỏi lặp → "hemlock rule" ép nêu vị trí ≤50 từ).
- **Where:** `SKILL.md`, `agents/council-socrates.md`
- **Notable:** Mọi lần ép buộc được đếm và ghi vào session metadata (số dispatch, điều kiện kích hoạt) nên chất lượng thảo luận đo được; prompt ép buộc là văn bản cố định.
- **Seen:** fd9f4e5

### confidence-weighted-tally-and-split
- **What:** Tie-break theo dòng `STANCE:` có cấu trúc: trọng số cơ sở 1.0, ghế "domain-weight" 1.5×, đồng thuận khi một phương án đạt ≥ 2/3 tổng trọng số CƠ SỞ (không giảm theo độ tự tin); không phương án nào đạt → "genuine split", KHÔNG ép đồng thuận, KHÔNG thêm vòng.
- **Where:** `SKILL.md`
- **Notable:** Mẫu số dùng trọng số cơ sở để panel tự tin thấp không thể tự tạo đồng thuận; DEALBREAKER của người thiểu số luôn vào Minority Report; bảng tally ghi trong verdict để kiểm toán không cần đọc lại transcript.
- **Keywords:** vote tally, minority report
- **Seen:** fd9f4e5

### verdict-unresolved-first
- **What:** Template verdict mở đầu bằng điều council KHÔNG biết (Unresolved Questions), kèm khuyến nghị, nhượng bộ chấp nhận được, kill criteria và đúng một bước tiếp theo cụ thể; không thêm/bớt/đổi tên mục.
- **Where:** `demos/verdict-template.md`, `SKILL.md`
- **Notable:** Mục "N/A — {lý do}" thay vì bỏ trống; verdict hiển thị nguyên văn không hậu xử lý.
- **Seen:** fd9f4e5

### evidence-labels-fact-inference-assumption-unknown
- **What:** Nhãn bốn bậc cho từng mệnh đề (FACT / INFERENCE / ASSUMPTION / UNKNOWN) và ghi chép quyết định trước khi triệu tập (quyết định, ràng buộc, bằng chứng, khả năng đảo ngược, hạn chót).
- **Where:** `README.md`, `SKILL.md`
- **Notable:** Chống dùng cuộc thảo luận dài làm "đồ trang trí" cho quyết định đã có sẵn.
- **Seen:** fd9f4e5

## routing

### polarity-pairs-provider-separation
- **What:** Mỗi persona khai `polarity_pairs` (cặp đối cực, ví dụ Socrates↔Feynman/Watts); bộ định tuyến rải ghế qua các provider và TÁCH cặp đối cực sang provider khác nhau khi có thể, để một họ model không đóng cả hai phía của một bất đồng.
- **Where:** `SKILL.md`, `scripts/detect-providers.sh`, `configs/auto-route-defaults.yaml`
- **Notable:** `--dry-route` xem bảng member → provider → model → exec_method mà không chạy; lỗi provider được báo trước khi ghế fallback về native host.
- **Keywords:** dry-route, provider affinity
- **Seen:** fd9f4e5

### domain-weight-seat
- **What:** Trước mọi phân tích, chỉ định MỘT ghế có trọng số 1.5× (thành viên có chuyên môn sát miền câu hỏi nhất) và ghi vào checkpoint.
- **Where:** `SKILL.md`
- **Notable:** Quyết định trọng số trước khi thấy nội dung (không chọn sau theo kết quả).
- **Seen:** fd9f4e5

## skills

### persona-contract-with-grounding-protocol
- **What:** 18 file persona cùng khung: Identity → Grounding Protocol (đặt ngay sau Identity vì LLM trọng số sớm hơn) → Analytical Method → What You See → What You Miss → When Deliberating → Output Format (vòng 2) → Output Format (đứng riêng). Grounding dùng ràng buộc cụ thể ("tối đa 2 phép ẩn dụ", "giới hạn sâu 3 tầng").
- **Where:** `agents/council-socrates.md`, `agents/council-torvalds.md`, `scripts/validate-roster.py`
- **Notable:** Mỗi persona có điểm mù khai báo ("What You Tend to Miss") và một đối trọng; frontmatter (`polarity`, `triads`, `provider_affinity`, `reasoning_method`) làm persona có thể tra cứu bằng máy.
- **Seen:** fd9f4e5

### multi-host-skill-mirrors-with-parity-check
- **What:** Một `SKILL.md` chuẩn + ba bản mirror nén cho Codex, Gemini CLI, OpenCode; checklist mô phỏng kiểm tính tương đương giao thức giữa các bản, kiểm cấu trúc persona, checkpoint, trường verdict, hành vi installer.
- **Where:** `SKILL.codex.md`, `SKILL.gemini.md`, `SKILL.opencode.md`, `scripts/council-simulation-checklist.sh`, `install.sh`
- **Notable:** Quy ước "đổi giao thức → mirror hoặc ghi lý do miễn" được máy kiểm; `install.sh --dry-run` cho mỗi host.
- **Seen:** fd9f4e5

## config-packaging

### project-override-council-yaml
- **What:** File `./.council.yaml` trong repo ép profile/Chairman/routing mặc định cho project đó; coordinator đọc đúng một lần ở đầu STEP 0 và nêu rõ cấu hình đang áp dụng.
- **Where:** `SKILL.md`, `configs/provider-model-slots.example.yaml`
- **Notable:** Khẩu vị mặc định theo project nằm ở một file, đổi một lần bằng cờ.
- **Seen:** fd9f4e5

## self-improvement

### verdict-outcome-ledger
- **What:** Verdict chỉ có ích nếu kiểm lại được: trước khi hành động ghi dự đoán, chủ sở hữu, ngày xem lại, bằng chứng sẽ đổi khuyến nghị; tại mốc đánh dấu confirmed / revised / reversed / inconclusive thay vì viết lại lý do gốc. Mỗi phiên còn ghi Session Metadata (số dispatch ép buộc, điều kiện kích hoạt).
- **Where:** `README.md`, `SKILL.md`
- **Notable:** Cùng ý "đo dự đoán so với thực tế" với outcome half của fgOS nhưng áp cho QUYẾT ĐỊNH chứ không cho run.
- **Seen:** fd9f4e5

## safety

### quoted-heredoc-prompt-files
- **What:** Khi gọi CLI provider ngoài (codex, gemini), prompt luôn ghi vào file tạm qua heredoc có dấu nháy (`<<'COUNCIL_PROMPT_EOF'`) rồi đọc lại, TUYỆT ĐỐI không nhét trực tiếp vào chuỗi lệnh; coordinator chỉ trích các mục Identity/Grounding/Output Format (cắt Method, What You See/Miss) để prompt gọn.
- **Where:** `SKILL.md`, `SECURITY.md`
- **Notable:** Văn bản đề bài chứa `"`, dấu backtick hay `$(...)` không thể phá shell hay chèn lệnh; timeout 60s mỗi thành viên.
- **Seen:** fd9f4e5

## testing-evals

### simulation-checklist-and-fast-rubric
- **What:** Một script kiểm tra cấu trúc (persona, tương đương giao thức giữa các host, checkpoint, trường verdict, installer) chạy được trong CI, cộng bộ phiên mẫu cho cả ba chế độ kèm rubric chấm nhanh 0–2 điểm mỗi tiêu chí (tối đa 10).
- **Where:** `scripts/council-simulation-checklist.sh`, `demos/session-pack.md`
- **Notable:** Giao thức viết bằng văn xuôi vẫn có test "hợp đồng" mechanical; phần chất lượng thảo luận kiểm bằng rubric thay vì cảm tính.
- **Seen:** fd9f4e5

