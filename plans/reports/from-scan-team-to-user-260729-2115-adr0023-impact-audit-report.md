# ADR 0023 (ship faster > DoD > hoàn thiện sau ngưỡng) — audit ảnh hưởng

**Ngày:** 2026-07-29 · **Nguồn:** 5 agent Explore (haiku) quét song song + tự
kiểm/verify của lead trước khi kết luận. **Phạm vi:** tìm mọi chỗ trong repo
bị ảnh hưởng bởi `docs/decisions/0023-uu-tien-san-pham-ship-dod-hoan-thien.md`.

---

## Phát hiện quan trọng nhất: việc này ĐÃ có người làm rồi

Trước khi liệt kê blast radius, phải báo cái này trước — nếu bỏ qua sẽ làm
trùng việc. `docs/backlog.md` (markdown) không chứa nó vì đây là work-item
sống thuần trong `.fgos/state.json` (`fgos list`), 1 agent quét markdown
không thấy được:

- **`tsk-4op`** (status `todo`, stage `clarify`) — *"Tách 'ship' khỏi
  'compound-learn' (settlement/decision/learning/enduser-docs) + chuyển lớp
  TỔNG-HỢP-VIẾT sang batch/patch, GIỮ lớp GHI-NHẬN rải rác xuyên tiến trình"*
  — ĐÚNG NGUYÊN VĂN hướng đã bàn trong chat `b0010842` (2026-07-28): tách
  compound-learn khỏi ship, marker code-đã-merge thay vì đợi status `done`,
  batch theo ngưỡng N item/T thời gian. Còn ở `clarify`, CHƯA decompose/plan.
- **`tsk-ma4`** (status `done`, con của `tsk-4op`) — bước (1): kiểm toán các
  điểm GHI-NHẬN hiện có, trả lời đúng câu hỏi mở cuối chat trước ("raw
  material có cần rải rác không"). Kết luận đã có (báo cáo
  `plans/reports/capture-recording-points-audit-260729-1745-report.md`):
  **có lỗ hổng thật** — chỉ 21-23% work-item có `docsRef`, chỉ
  15-16.5% thư mục `docs/history/*/` có `CONTEXT.md`.
- Quyết định phụ đã chốt trong `tsk-4op` (2026-07-29): **bỏ khái niệm nhánh
  `dev`** — không cần tầng tích-hợp thứ 3, vì tsk-4op giải đúng nhu cầu
  "gom rồi chạy lô" bằng 2 lớp (GHI-NHẬN / TỔNG-HỢP-VIẾT) + marker, không cần
  branch mới.
- Có thêm 1 báo cáo khảo sát riêng, rộng hơn (verify gate / test suite
  selectivity / merge mechanics):
  `plans/reports/from-scan-team-to-planning-260729-1614-verify-scope-compound-cadence-merge-tiering-report.md`
  — đo thật: verify chạy 3-4 lần/item, không có cơ chế chọn-lọc test, full
  suite 85s (91% do 1 file `test/cli/fgos.test.mjs`).

**Khuyến nghị:** đừng mở lại từ đầu — tiếp `tsk-4op` (đang kẹt ở `clarify`,
cần 1 vòng `fgos-coding-exploring` hoặc `fgos discover tsk-4op`) là đường ngắn nhất.

---

## Blast radius theo ADR 0023 (xác nhận qua code + spec thật)

### 1. FSM & gate cơ học (`scan-code`, đã tự verify thêm)

| Vị trí | Vai trò |
|---|---|
| `src/state/fsm.mjs:79,96` | cạnh `doing→done`, `proposed→done` — 1 cạnh duy nhất gánh cả merge lẫn compound-learn |
| `src/state/frontier.mjs:89` | dep chỉ mở khi `status==='done'` — đúng chỗ `tsk-4op` định đổi (đọc marker code-đã-merge thay vì đợi `done`) |
| `bin/fgos.mjs:1694-2042` | `approve` — merge trước, flip `done` sau |
| `bin/fgos.mjs:866-898` | `compound` verb — check `status !== 'proposed'`, ghi outcome `docType/docPath` |
| `bin/fgos.mjs:1302-1315` | `doc-sources` verb — đối chiếu doc↔source, hạ tầng cho tier-2 DoD |
| `src/state/graph-harness.mjs:46`, `graph-metrics.mjs:402`, `impact.mjs:68,117` | **thêm 3 chỗ khác cũng gate trên `status==='done'`** — chat gốc chỉ nhắc `frontier.mjs`, phạm vi đổi FSM rộng hơn đã tưởng nếu chọn marker/status mới |

### 2. Specs — RUL đã định vị chính xác (`scan-specs`)

`docs/specs/work-state.md:971-1010` — RUL4/12/13/20/21 (khung chung) và
RUL49-53 (compound-learn cụ thể). Xác nhận thật: **RUL50 (gate compound) và
RUL52/53 (field docType/docPath) là 2 cơ chế tách rời**, không phải 1 gate
atomic — đúng khoảng cách giữa hiện trạng và ý "DoD = 1 gate" của ADR 0023
tier 2. Đây là việc thật cần đóng, không phải suy diễn.

Lưu ý: `docs/specs/runner.md:851-869` cũng nhắc lại RUL4/12/13/20/21 — chưa
xác minh đây là cross-reference hợp lệ hay là bản định nghĩa lặp thứ 2 (nếu
lặp thật, đó là 1 choke-point mới kiểu ADR 0022) — cần đọc kỹ 2 file cạnh
nhau trước khi kết luận, KHÔNG khẳng định ở đây.

### 3. Skill routing (`scan-skills`) — 9 skill, 52 hit

`fgos-routing`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/
`fgos-coding-implement`/`fgos-coding-compounding`/`fgos-indexing` đều nhắc "gate" theo
nghĩa **chuyển stage** (clarify→decompose→executing→compound-learn) — TRỤC
KHÁC với "DoD gate" (CoS/evidence-check) của ADR 0023. `scan-skills` tự gọi
đây là "CRITICAL OUT-OF-STEP" — **hạ cấp độ nghiêm trọng đó**: 2 trục có tên
trùng chữ "gate" nhưng không cùng nghĩa (giống hệt case `judgeDecompose`/
"decompose" trùng tên ngẫu nhiên mà backlog STR93 đã tự phân biệt). Không
skill nào cần sửa GẤP vì lý do này; nhưng đúng là chưa skill nào mã hoá rõ
3 bậc ưu tiên ADR 0023 — nếu sau này muốn skill tự biết "đừng chờ
compound-learn để ship", phải sửa `fgos-routing`/`fgos-coding-implement`.

### 4. Test coverage (`scan-tests`) — an toàn tốt, đã sẵn safety net

212 ref compound, 121 frontier, 342 approve trên toàn test suite. Có test
riêng cho done-gate (`test/state/compound-learn-done-gate.test.mjs`), FSM
edge (`test/state/fsm.test.mjs`), frontier (`test/state/frontier.test.mjs`
+ e2e), doc-sources (`test/cli/fgos.test.mjs:2088-2139`). Nghĩa là: khi
`tsk-4op` triển khai (đổi cách mở dep), **có lưới an toàn sẵn để không vỡ
âm thầm** — điểm cộng, không phải việc cần làm thêm.

### 5. Decisions/backlog liên quan (`scan-decisions` + tự verify)

- Decision D-ID `9c67c3d1` (compound-learn-enduser-docs) — **KHÔNG có ADR
  riêng trong `docs/decisions/`** (grep xác nhận 0 hit), chỉ sống trong log
  quyết định gốc + được trích trong `docs/history/recording-points-audit/
  CONTEXT.md:30`, ghi "superseding decision `9c67c3d1`" — đây là Ý ĐỊNH của
  `tsk-4op`, CHƯA xảy ra thật (`tsk-4op` còn `todo/clarify`, chưa đóng nên
  chưa có supersede chính thức). `scan-decisions` báo "đã superseded" là
  **nói sớm hơn thực tế** — sửa lại: sẽ supersede KHI tsk-4op đóng, chưa
  đóng bây giờ.
- STR73 (in-flight, done-flip phải verify từng CoS clause) — cùng tinh thần
  tier-2 DoD của ADR 0023, không mâu thuẫn, nên đồng bộ ngôn ngữ nếu viết
  thêm sau này.
- STR81 (proposed, audit lệch frontmatter↔log) — bổ trợ hạ tầng `doc-sources`
  mà tier-2 DoD dựa vào.

---

## Việc CHƯA làm / mở

1. Đọc `docs/specs/runner.md:851-869` cạnh `work-state.md:971-1010` để xác
   nhận có phải RUL4/12/13/20/21 bị định nghĩa lặp không (chưa kết luận ở
   report này).
2. `tsk-4op` đang kẹt `clarify` — cần 1 vòng khoá quyết định trước khi
   decompose (marker field cụ thể ra sao, ngưỡng N/T bao nhiêu).
3. Không skill nào mã hoá 3 bậc ADR 0023 thành hành vi — chỉ cần nếu quyết
   định thật sự đổi cách skill điều phối ship vs compound-learn.

## Câu hỏi chưa giải

- `docs/specs/runner.md` có phải nguồn RUL lặp thật hay chỉ trích dẫn hợp lệ?
- Có muốn resume `tsk-4op` ngay (qua `fgos discover tsk-4op` hoặc pick) thay
  vì mở việc mới không?
