---
area: platform-foundations
updated: 2026-07-14
sources: [phase-0-compound-learning-stack]
decisions: [ca7de3cf, ae461c8b, ed953e09, 14ebeea9]
coverage: full
---

# Spec: Platform Foundations (luật nền)

Vùng doctrine của forgent: 8 luật thiết kế đã khóa, đứng trên mọi code của compound stack (state/FSM → routing → compound-learning). Người dùng: product owner (khóa và supersede luật) và mọi agent/reviewer thiết kế hay thẩm định artifact của forgent. Văn bản gốc đầy đủ (phát biểu, nguồn bằng chứng, hệ quả, ngưỡng xem lại): xem Pointers.

## Entry Points & Triggers

- Trước khi thiết kế bất kỳ artifact bền, store, hay interface mới → đọc luật nền; thiết kế phải khai các phân loại bắt buộc (RUL1, RUL8, RUL4).
- Mở đầu mọi review thiết kế tầng state → câu hỏi "log hay state?" (RUL1).
- Ngưỡng xem lại có tên của một luật bị chạm → mở lại luật đó qua thao tác "sửa luật" bên dưới.
- Nghiệm thu mỗi phase của compound stack → hỏi lại sáu câu hỏi (RUL6).

## Data Dictionary

| # | Element | Meaning | Values |
|---|---------|---------|--------|
| 1 | Physics của artifact | Phân loại bắt buộc lúc thiết kế cho mọi dữ liệu bền | `log` — append-only, tổ chức theo feature/phiên, trả lời "làm sao tới đây", không bao giờ overwrite · `state` — overwrite theo reality, tổ chức theo area, trả lời "đang ở đâu" |
| 2 | Tầng memory | Tầng mà một cơ chế nhớ thuộc về | `lower` — cơ học/raw/chính xác, chỉ dùng hai-physics, không TTL, không tự quên · `higher` — nơi agent học pattern: 4 loại memory (working/episodic/semantic/procedural) + consolidation, human-gated |
| 3 | Mức bền (D1–D5) | Mức durability mọi artifact phải khai | `D1` — đề xuất chờ duyệt · `D2` — truth vĩnh viễn được commit · `D3` — bằng chứng phiên, nén được · `D4` — dựng lại được từ D2 · `D5` — chỉ tồn tại máy này |
| 4 | Bậc trưởng thành (F0–F5) | Thang đo tiến hóa của platform, mỗi bậc có tiêu chí kiểm chứng | `F0` bare · `F1` lawful (luật thành văn, 6 câu trả lời bằng tay) · `F2` stateful (6 câu trả lời từ state) · `F3` routed (agent lạ tự tìm việc kế tiếp) · `F4` compounding (vòng predicted→actual chạy) · `F5` self-improving (học từ vận hành, human-gated) |
| 5 | Ngưỡng xem lại | Điều kiện có tên mà khi chạm, luật phải được mở lại — luật không có ngưỡng là luật phân loại/acceptance, chỉ có thể thêm | điều kiện mô tả tường minh trong văn bản luật |
| 6 | Changeset | Bản ghi thao tác ngữ nghĩa append-only, ghi cùng transaction với mutation, được commit — là truth mà mọi database view dựng lại từ đó | — |

## Behaviors & Operations

### Sửa/mở lại một luật

- **Blocked when:** không có bằng chứng mới và không ngưỡng xem lại nào bị chạm — audit chỉ nêu lo ngại trừu tượng thì không mở luật.
- **What changes:** quyết định gốc bị supersede bằng quyết định mới có D-ID; văn bản luật cập nhật trỏ D-ID mới. Không bao giờ sửa tại chỗ không dấu vết.
- **Side effects:** thiết kế và spec đang dựa trên luật đó được rà lại.
- **Afterwards:** người đọc chỉ thấy luật hiện hành; lịch sử nằm trong decision log.

### Khai phân loại khi thiết kế artifact mới

- **Runs when:** bất kỳ artifact bền, store, hay interface mới nào được thiết kế.
- **Blocked when:** artifact không khai được physics (RUL1), mức bền (RUL8), hoặc — với interface — audience (RUL4): thiết kế đó là lỗi bị trả lại, không phải chi tiết để sau.
- **What changes:** bản thiết kế mang các khai báo; reviewer thẩm định theo đúng các khai báo đó.
- **Afterwards:** artifact vào đời với phân loại tra cứu được; file lai (vừa append vừa sửa) phải tách đôi.

### Tuyên bố bậc trưởng thành

- **Runs when:** một bậc F0–F5 được cho là đạt.
- **Blocked when:** không có bằng chứng chạy thật (output benchmark/check) — "không tự phán".
- **Afterwards:** bậc được ghi nhận kèm bằng chứng; roadmap đo bằng thang này, không bằng cảm giác.

## Actors & Access

| Capability | Product owner | Agent | Reviewer |
|---|---|---|---|
| Khóa / supersede luật | ✓ | — | — |
| Đọc và tuân thủ luật | ✓ | ✓ | ✓ |
| Trích luật theo ID (L1–L8) khi thẩm định | — | ✓ | ✓ |
| Tuyên bố bậc F-ladder (kèm bằng chứng) | ✓ (chốt) | đề xuất | đề xuất |

## Business Rules

- **RUL1.** Mọi mẩu dữ liệu bền khai là Log hoặc State ngay lúc thiết kế; không khai được là lỗi thiết kế (L1, per ca7de3cf).
- **RUL2.** Memory chạy đồng thời hai tầng: lower chỉ dùng hai-physics; higher dùng 4 loại memory + consolidation human-gated — hai mô hình không phủ định nhau (L2, per ca7de3cf).
- **RUL3.** Truth của mọi database tương lai là changeset append-only được commit; database là view dựng lại được từ zero; graph store là view cấp 2 không bao giờ ghi ngược; mọi ghi qua MỘT cửa (L3, per ae461c8b).
- **RUL4.** Không có mô hình routing toàn cục — mỗi interface chọn theo audience: prose-handoff cho agent↔agent trong chain; kỷ luật data (branch theo exit-code, decision-table, rediscover trước retry) cho consumer không-chắc-là-agent (L4, per 14ebeea9).
- **RUL5.** Việc kế tiếp luôn là truy vấn dẫn xuất từ state, không bao giờ là danh sách tay (L4, per 14ebeea9).
- **RUL6.** Platform "có harness" chỉ khi agent lạ không chat history trả lời được sáu câu: đọc gì trước / việc loại gì / chạm contract nào / rủi ro bao nhiêu / proof gì thì xong / bài học nào để lại — mọi phase nghiệm thu bằng sáu câu này (L5).
- **RUL7.** Tiến hóa đo bằng thang F0–F5; mỗi bậc chỉ tuyên bố khi có bằng chứng chạy thật (L6).
- **RUL8.** "Chạy xong ≠ đã merge ≠ đã bền" — mọi artifact khai mức bền D1–D5 tường minh (L7).
- **RUL9.** Tầng doctrine nạp-mọi-turn tuân ba quy tắc: placement test một câu; transport đi kèm mệnh lệnh; mỗi rule có anchor phrase được check tự động assert (L8).
- **RUL10.** Trend-history và reconsideration bookkeeping lưu policy-side, git-tracked (per ed953e09).

## Edge Cases Settled

- Ngưỡng xem lại của RUL3 đã có tên và bằng chứng thật: khi multi-agent write trở thành tải chính, luật được mở lại với beads (đã pivot sang db-as-truth ở đúng điều kiện đó) làm case study — không vá tại chỗ (ghi nhận 2026-07-14).
- Higher layer không bao giờ thành hình → tầng 4-memory-type của RUL2 tự rơi, không để lại nợ.
- Luật phân loại (RUL1) và acceptance test (RUL6) không có ngưỡng xem lại — RUL6 chỉ có thể THÊM câu hỏi.

## Open Gaps

(none)

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `docs/platform-foundations.md` — văn bản gốc đầy đủ của 8 luật (phát biểu + nguồn `nguồn:slug` + hệ quả + ngưỡng xem lại)
- `.bee/decisions.jsonl` — decision log mang các D-ID trích ở trên (đọc qua `node .bee/bin/bee_decisions.mjs`)
- `plans/reports/distill-consult-260713-2323-compound-learning-stack-report.md` — chất liệu consult gốc
- `docs/distillery/deep-dives/` — deep-dives state / compound-engineering / routing
