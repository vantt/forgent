# Council of High Intelligence: distill, đối chiếu cơ chế thảo luận của fgOS, và thử dùng protocol sẵn có

Ngày: 2026-10-04 · Nguồn: <https://github.com/0xNyk/council-of-high-intelligence> @`fd9f4e5` · Người yêu cầu: owner (`/distill`).

## 1. Kết luận ngắn

**Có thể dùng protocol sẵn có (Pattern `panel` + persona) để làm "council nhẹ" mà không cần engine mới.** Đã chạy thử thật: ba ghế với ba lăng kính của council đi qua `fgos run --pattern panel`, mỗi ghế bind một provider khác nhau trong pane herdr, đọc repo thật, trả ba lập luận khác nhau về cùng một câu hỏi. Quota fallback (Gemini hết hạn mức → xai) hoạt động đúng. Điều **chưa** có là các cổng chất lượng mechanical của council (dissent quota, agreement check, cross-exam ẩn danh, tally có trọng số). Chỗ nào nên bổ sung thì đã thành candidate trong `docs/distillery/porting-log.md`; ba lăng kính chính nó lại khuyên **chưa** thêm cổng vào pattern (xem §4).

## 2. Council là gì (đã distill)

Một skill `/council`, bản chất là **một giao thức viết bằng văn xuôi cho LLM coordinator**, không có runtime. 18 persona "lăng kính" (mỗi persona có khung 8 mục: Identity, Grounding Protocol, Method, What You See/Miss, …), ba chế độ (full/quick/duo), vòng cố định: restate → phân tích độc lập song song → cross-exam **ẩn danh** → quét ép buộc → stance cuối → tally → Chairman (vai riêng, không tham gia thảo luận) tổng hợp verdict "điều chưa biết" đứng đầu. Chi tiết 18 entry: `docs/distillery/sources/council-of-high-intelligence.md` (đã seal, `distill check` xanh).

## 3. Đối chiếu với cơ chế của fgOS (đã kiểm trong code)

| Cơ chế | council | fgOS | Đánh giá |
|---|---|---|---|
| Phân tích độc lập song song | ✓ | ✓ `panel.mjs`, ép **khác provider** giữa các ghế | fgOS mạnh hơn (ràng buộc thật ở `bind()`, council chỉ best-effort) |
| Người tổng hợp tách riêng | ✓ Chairman | ✓ synthesizer `independentOf` mọi panelist | fgOS mạnh hơn |
| Lăng kính riêng từng ghế | ✓ 18 persona | ~ persona mỗi capability một ref; override theo `scope.role` cho phép **từng ghế một persona**; renderer chỉ inject `description/voice/style/archetype/decision_boundary` (`assignment.mjs:728`) | Dùng được ngay (thử nghiệm §4); persona mỏng hơn khung 8 mục |
| Restate đề bài từng ghế | ✓ | ~ chỉ bước `framing` solo | Thiếu |
| Cross-exam ẩn danh | ✓ | ~ Delphi vòng 2 chỉ thấy bản tóm tắt ẩn danh do synthesizer làm | Thiếu phản biện trực tiếp |
| Dissent quota / agreement check | ✓ | ✗ (`reviewed` ép red-team nêu finding, không đo bất đồng của panel) | Thiếu |
| Tally có trọng số, "genuine split" trả về người | ✓ | ~ `nominal-group:vote` qua cổng người | Thiếu tally; hợp ưu tiên Release con người |
| Verdict "điều chưa biết" đứng đầu | ✓ | ~ không có schema cố định | Thiếu |
| Sổ theo dõi kết quả của QUYẾT ĐỊNH | ✓ | ✗ (outcome chỉ cho run) | Thiếu |
| Xem trước định tuyến | ✓ `--dry-route` | ✓ `fgos dispatch decide` | Hòa |

## 4. Thử nghiệm thật

**Thiết lập** (bằng chứng ở `plans/reports/council-lens-experiment-261004/`): worktree riêng; 3 persona `council-socrates` (phá giả định), `council-torvalds` (ship/bảo trì), `council-meadows` (vòng phản hồi) viết thành `core/agents/*.yaml`; một Unit `architecture:shape`; `fgos run --pattern panel --override <persona theo role>`. Câu hỏi thật: *fgOS có nên thêm cổng dissent/agreement vào `panel`, hay khác-provider + red-team của `reviewed` đã đủ?*

**Chạy thật** (670 giây, qua pane herdr, posture read-only):

| Ghế | Lăng kính | Provider | Kết quả |
|---|---|---|---|
| panelist-1 | Socrates | claude | ✓ 337 từ (quá giới hạn 300) |
| panelist-2 | Torvalds | openai | ✓ 232 từ |
| panelist-3 | Meadows | gemini → **hết hạn mức → xai** | ✓ 278 từ, `fallbackFrom: provider-limit` |
| synthesizer | — | glm-herdr | ✗ `timed-out-idle` sau 300 giây, nên run kết thúc `execution-failure` |

**Điều thử nghiệm chứng minh:**
1. Persona **được inject thật** vào brief (`# Persona … council-socrates` trong `brief-1.md`), và mỗi đầu ra bám phương pháp của lăng kính: Socrates kiểm giả định bằng phản chứng; Torvalds đo chi phí/bảo trì và đề một thí nghiệm rẻ; Meadows vẽ vòng phản hồi và chỉ một điểm đòn bẩy.
2. Ba ghế **khác provider, khác lập luận, cùng đọc code thật** và trích `file:line`. Cả ba đi tới cùng một vị trí (chưa thêm cổng vào pattern) bằng ba đường khác nhau, kèm "điều gì làm tôi đổi ý" và một bước tiếp theo cụ thể (`optional dissent field`; chạy so sánh trên 20 prompt đã lưu; ghi `agreement entropy` thụ động).
3. Quota fallback **chạy thật** cho ghế panel, không chỉ test.
4. Cổng council `agreement check (>70%)` sẽ **kích hoạt đúng ở lần chạy này** (cả ba đồng ý), tức là thứ cổng đó bắt chính là trường hợp "đồng thuận quá dễ".

**Điều thử nghiệm bóc ra:**
- Lăng kính vẫn cần kiểm chứng: Socrates nói "panel làm rơi `findings` của panelist". Em kiểm: `findings` **vẫn tới synthesizer** (`inputs: memberResults`), nhưng kết quả cấp pattern không gom `findings` (`panel.mjs` chỉ trả `outcome` + `results`; `run.mjs:515` lấy `patternResult.findings || []`). Đúng một nửa, đúng cỡ nhãn FACT/INFERENCE mà council đòi.
- Lỗi hạ tầng riêng, **chưa điều tra**: synthesizer trên `glm-herdr` treo 5 phút không tiến triển trong pane; run panel thiếu synthesizer thì vô giá trị. Cần một item riêng nếu tái diễn.
- Giới hạn từ "tối đa 300 từ" không được tuân thủ chặt (337): giới hạn chỉ nằm trong prose, không có cổng.

## 5. Khuyến nghị

Theo thứ tự lợi ích/chi phí (các dòng tương ứng đã vào `porting-log.md`, status `candidate`, chờ owner triage):

1. **Lăng kính theo ghế (R2 E1 F1, rẻ nhất, đã chứng minh):** thêm một nhóm persona lăng kính vào `core/agents/` và cho Workflow thảo luận khai persona **theo ghế**; nâng renderer persona nhận thêm `method`/`blind_spot` (hiện chỉ năm trường). Chưa cần code engine.
2. **Cổng dissent/agreement (R2 E1 F2):** ba lăng kính đều khuyên chưa làm trong `panel`. Làm theo lời họ: bắt đầu bằng ghi **thụ động** `agreement entropy` và gom `findings` ở cấp pattern, đo trên các run thật, rồi mới cân nhắc preset opt-in. Đây là lập trường được ba góc nhìn độc lập ủng hộ, không phải của em.
3. **Cross-exam ẩn danh + tally "genuine split" + verdict "điều chưa biết trước" (R2 E1 F2/F2/F1):** nếu cần, dựng thành **bước Workflow** (đúng chỗ mà Socrates chỉ ra: đây là luồng nhiều vòng, không phải pattern song-song-rồi-tổng-hợp 88 dòng).
4. **Sổ theo dõi quyết định (R2 E1 F2):** ý hay nhất của council nhưng độc lập với thảo luận; thuộc Observe, tách việc.

**Chưa nên làm:** sao chép 18 persona nguyên văn hay giao thức 950 dòng. Giá trị nằm ở các cơ chế mechanical và ở lăng kính + điểm mù khai báo, không ở tên nhân vật.

## 6. Câu hỏi còn mở

- Owner có muốn chạy so sánh có đối chứng (cùng một câu hỏi qua `/council --triad architecture` thật và qua panel+persona của fgOS, chấm bằng rubric 0–2 của council) trước khi quyết có đầu tư mục 1–3 không? Hiện mới có thử nghiệm một chiều, một câu hỏi.
- Synthesizer `glm-herdr` treo: có tái diễn không (cần thêm vài run để biết)?

## 7. Việc đã làm trong phiên này

- `docs/distillery/sources/council-of-high-intelligence.md` (18 entry, sealed @`fd9f4e5`, 18 domain, `check` xanh), `comparison-matrix.md` (+12 hàng), `porting-log.md` (+7 candidate), `upstreams/council-of-high-intelligence/` (gitignored).
- Thử nghiệm ở `plans/reports/council-lens-experiment-261004/` (persona, unit, override, bindings, ba đầu ra). Worktree/nhánh thử nghiệm đã xoá; hai pane herdr và hai home credential tạm đã dọn (reap thật, xác nhận phần sửa credential hygiene hôm 03/10 hoạt động).
- Không thay đổi code của fgOS.
