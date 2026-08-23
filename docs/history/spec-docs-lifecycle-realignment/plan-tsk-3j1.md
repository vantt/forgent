# plan-tsk-3j1.md — bốn spec nhỏ (reading-map, system-overview, enduser-docs-\*)

Con thứ 3 của `tsk-5eq`. Bảng từ vựng bắt buộc, quyết định không-đổi-tên
`docs/how-to/`, và ranh giới LIVE-vs-HISTORICAL nằm ở
`docs/history/spec-docs-lifecycle-realignment/plan.md` §"The one rewrite rule"
và `RESEARCH.md` p2/p3 — file này KHÔNG chép lại bảng đó, chỉ trỏ về và ghi
những gì riêng của bốn tệp này.

Mode: small

Flag count: 1 of 10 — **public contracts** (`docs/specs/` là state layer của
repo; `AGENTS.md` Definition-of-done câu 1 gửi mọi agent lạ tới
`docs/specs/reading-map.md` TRƯỚC TIÊN, câu 3 gửi tới bảng Shared Entities của
`system-overview.md`). Không phải `tiny`: bốn tệp, hai quy ước frontmatter khác
nhau (`reading-map.md` không có frontmatter; ba tệp kia có), cộng một con số
thực nghiệm (số test) phải đo lại chứ không đoán. Chưa tới `standard`: không có
vùng xám nào còn lại — bảng từ vựng đã chốt ở `plan.md` cha, phân loại
LIVE-vs-HISTORICAL cho từng dòng đã xong ở `RESEARCH.md` p2, và mọi mỏ neo
verify đã đo là ĐỎ hôm nay (dưới). Không cờ hard-gate nào áp (không auth, không
mất dữ liệu, không audit/security, không nhà cung cấp ngoài, không gỡ
validation) nên không `high-risk`; không phải một câu hỏi có/không nên không
`spike`.

**Cờ "existing covered behavior" KHÔNG áp — đây là sửa lại lời cha.**
`plan.md` (cha) liệt kê nó dựa trên giả định `npm test` chạy
`scripts/check-decision-citation-drift.mjs` trên `docs/specs/*.md` thật. Đọc
trực tiếp: `package.json:24` định nghĩa `"test": "node --test
'test/**/*.test.mjs'"` — không có pretest/posttest, không hook nào gọi script
đó; `test/scripts/check-decision-citation-drift.test.mjs` chỉ dựng fixture tạm
(`docs/specs/work-state.md` ở `:108` là một chuỗi tên fixture, không phải tệp
thật). Không một test nào trong suite đọc bốn tệp của item này (`grep -rln` trên
`test/` và `scripts/` cho tên bốn tệp: không kết quả). Hệ quả thẳng thắn: **`npm
test` không thể đỏ vì nội dung prose của item này** — nó chỉ là hàng rào chống
hồi quy chung, KHÔNG phải bằng chứng item này đã làm đúng. Bằng chứng thật duy
nhất là bốn mệnh đề grep có mục tiêu dưới đây. (Cùng phát hiện mà con
`tsk-1uw` ghi độc lập cho `work-state.md`.)

Không có `CONTEXT.md` cho feature này — item cha đạt `planning` bằng verdict
`clear` ở stage `discovery` (`discovery -> planning`, bỏ qua `exploring`), nên
chưa vòng Socratic nào chạy. Nền bằng chứng là `RESEARCH.md` round 1.

impact-analysis: **full** — `fgos tool query --capability impact-analysis
--status present` trả về GitNexus `present`. Ghi cho đủ: footprint của item này
là Markdown thuần, không symbol code nào, nên không mỏ neo chứng minh nào dưới
đây dựa vào blast radius. `present` không đảm bảo index còn tươi (`CLAUDE.md`),
là lý do thứ hai để không treo gì lên nó.

## Approach

**Đường đã chọn: sửa tại chỗ từng dòng đã có mỏ neo `path:line` trong
`RESEARCH.md` p2, không viết lại tệp.** Bốn tệp này nhỏ (44 / 70 / 125 / 245
dòng) và chỉ sai ở trục vòng đời; mọi phần còn lại đúng. Sửa tại chỗ giữ
nguyên giọng văn và cấu trúc mỗi tệp, đồng thời làm diff đọc được cho người
duyệt.

Bác bỏ — *viết lại `reading-map.md` cho gọn*: nó là tệp đầu tiên một agent lạ
đọc (`AGENTS.md` DoD câu 1); đổi cấu trúc trong cùng một item với đổi nội dung
làm người duyệt không tách được "sửa sai" khỏi "đổi ý".

Bác bỏ — *xoá sạch mọi chuỗi `compound-learn` bằng một phép thay hàng loạt*: sẽ
ăn cả slug frontmatter `sources: [compound-learn-enduser-docs]` — tên feature,
không phải tên stage (`plan.md` cha §"Never rewrite"; `RESEARCH.md` p2 "False
positives to protect"). Mệnh đề verify phủ định trên ba tệp chính là để phân
biệt hai thứ này bằng máy: slug luôn theo sau bởi dấu gạch nối, nên không khớp.

**Đổi tên `docs/how-to/`: KHÔNG, không thuộc item này** — đã chốt ở `plan.md`
cha §"Decided: do not rename", dựa `RESEARCH.md` p3. Hệ quả: `fgos docs-index`
không cần chạy (A4).

### Rủi ro

- **Trung bình** — xoá nhầm slug `compound-learn-enduser-docs` (tên feature).
  Chứng minh ở `fgos-coding-validating`: chạy mệnh đề verify phủ định (nó cố ý
  cho slug đi qua vì sau slug là dấu gạch nối), rồi đọc lại dòng `sources:` của
  cả hai tệp `enduser-docs-*`.
- **Thấp** — số test lệch (phải ĐO, A2); `reading-map.md:26` nửa sai nửa đúng
  (chỉ sửa khoá tra cứu, giữ tên skill `fgos-coding-*`); bốn con trôi cách diễn
  đạt (bảng từ vựng ở `plan.md` cha).

Thứ tự tự do — bốn tệp không tham chiếu nhau ở mức dòng, `fgos graph --json`
đặt cụm này ngoài `criticalPath`. Làm `reading-map.md` trước (DoD câu 1).

## Shape — một mảnh, không chia

Một việc trung thực: bốn tệp, cùng một trục sửa, 12 vị trí đã có mỏ neo dòng.
Chia thêm chỉ tạo con sửa hai dòng — chi phí vòng đời lớn hơn việc.

- **`reading-map.md`** (không frontmatter, không thêm) — `:20` chuỗi stage sống
  `discovery → exploring → planning → executing` (verdict `clear` bỏ qua
  `exploring`), `decompose` mô tả là bí danh legacy chỉ-để-rút-cạn, sổ đăng ký
  domain thêm `triage`/`fixture-marketing`; `:23` `discovery.mjs` phục vụ stage
  `discovery`, `judgeDiscovery` đã rút; `:24` `plan.mjs`, stage `planning`, verb
  `plan`; `:25` bỏ con trỏ `judge-executor.mjs`; `:26` khoá theo status
  `retrospective`, thêm `fgos-coding-discovering` (mỏ neo verify DƯƠNG); `:28`
  tài liệu sinh ở status `retrospective`; `:42` số test đo lại.
- **`system-overview.md`** — `:16`, `:53`; `updated` → `2026-08-12`. Tệp này
  không có khoá `sources:`, không thêm (A3).
- **`enduser-docs-authoring.md`** — sáu chỗ `:11 :19 :23 :42 :74 :121`;
  `updated` → `2026-08-12`; `sources:` nối `spec-docs-lifecycle-realignment`,
  GIỮ NGUYÊN slug `compound-learn-enduser-docs`.
- **`enduser-docs-index.md`** — `:30`, `:200`; frontmatter như trên, giữ cả hai
  slug cũ.

### Trường hợp đáng chứng minh

- Slug `compound-learn-enduser-docs` ở `:4` của hai tệp `enduser-docs-*` phải
  còn nguyên — xoá sạch chuỗi `compound-learn` là SAI dù vẫn qua một grep lỏng.
- `reading-map.md:20` sau khi sửa vẫn phải NHẮC `decompose` (bí danh legacy, 8
  item mở đang đỗ ở đó) — xoá trắng làm người đọc gặp item ở stage đó không tra
  được nó là gì.
- `npm test` xanh: hàng rào hồi quy chung, không đo item này (A5).

## Proof — mọi mỏ neo verify ĐỎ lúc lập kế hoạch

Đo trên `fgw/tsk-3j1`: chuỗi stage cũ trong `reading-map.md` = 1;
`judge-executor` = 3; `fgos-coding-discovering` = 0 (mệnh đề khẳng định, đỏ);
`compound-learn` không-phải-slug = 2 / 6 / 2 trên `system-overview.md` /
`enduser-docs-authoring.md` / `enduser-docs-index.md`. Khác verify kế thừa của
cha (vacuous, `plan.md` cha A3), verify item này không thể xanh trước khi việc
là thật.

## Assumptions

- **A1** — prose giữ BA-grade, tech-agnostic, tiếng Việt, khớp giọng từng tệp.
- **A2** — `reading-map.md:42` nhận số ĐO được từ `npm test` của chính item
  này; không đo được một tổng tin cậy thì bỏ hẳn con số thay vì đoán.
- **A3** — chỉ hai tệp `enduser-docs-*` nối `sources:`; `system-overview.md`
  không được thêm khoá đó vì chính nó chưa từng có.
- **A4** — không chạy `fgos docs-index` (kế thừa quyết định không-đổi-tên).
- **A5** — `npm test` xanh KHÔNG phải bằng chứng item này đúng; ghi rõ là
  chưa-được-chứng-minh theo nghĩa đó thay vì lặng lẽ tính nó là proof.

## Outstanding questions

None
