---
area: system-overview
updated: 2026-08-12
decisions: [ca7de3cf, ae461c8b, ed953e09, 14ebeea9, 1a80b4d3, 65c642a8, 43f257ae, 6f2cbc47, a30a3d3c, 1359ab5e, b2d18cc7, 1d336d8a, 02623bff, c74bcef9]
coverage: partial
---

# Spec: System Overview

> "Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch." (README, đoạn mở đầu, verbatim)

## Area Map

- platform-foundations — 8 luật thiết kế đã khóa đứng trên mọi code của compound stack; spec: platform-foundations.md
- work-state — bộ nhớ công việc tự quản của forgent (cửa lệnh `fgos`, nhật ký sự kiện là truth, bản chiếu dựng lại được); spec: work-state.md
- enduser-docs-authoring — soạn & nuôi tài liệu người-dùng-cuối ở khâu tổng-hợp, tức khi việc mang status `retrospective`: biến capture thật thành tài liệu theo ngăn Diataxis, một tài liệu sống trên mỗi đường dẫn, tích luỹ không mất (write-side); spec: enduser-docs-authoring.md
- enduser-docs-index — chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối, sinh từ cây tài liệu + capture (`fgos docs-index`), giữ móc truy ngược tài liệu↔việc, và verb `fgos doc-sources` gom mọi capture của một đường dẫn (read-side); spec: enduser-docs-index.md
- runner — vòng tự hành: lấy việc từ frontier, giao trợ lý nền trong nhánh cô lập, tự chấm, ghi đề xuất chờ duyệt; spec: runner.md
- fgos-plugin — bề mặt slash-command `/fgOS:<verb>` cho Claude Code, 12 verb wrapper one-door-write bọc quanh CLI `fgos`; spec: fgos-plugin.md
- distribution — cài `fgos` từ ngoài source repo (npm install qua GitHub); spec: distribution.md
- decision-citation-drift — quét backlog/spec tìm dòng còn trích một quyết định đã bị supersede mà không nhắc quyết định thay thế (chỉ phát hiện, không tự sửa); spec: decision-citation-drift.md
- distillery — vùng học từ reference sources: index feature từng nguồn, so sánh chéo, porting log; spec: distillery.md (partial — chỉ phủ porting lifecycle, xem Open Gaps trong spec đó)
- distill-skill — skill portable vận hành vòng học (init/add/delta/seal/check); spec: chưa có (harvest sẽ viết)

## Shared Entities

| Entity | Meaning | Touched by |
|---|---|---|
| Nguồn tham chiếu (reference source) | Một repo/tài liệu ngoài được quét để học feature | distillery (owns), distill-skill (đọc/ghi index) |
| Luật nền (platform law) | Một luật thiết kế đã khóa, có D-ID và ngưỡng xem lại | platform-foundations (owns); mọi area tương lai tuân theo |
| Work item (`work`) | Đơn vị việc duy nhất của forgent: trạng thái FSM + deps phẳng + tier, đủ trường trả lời sáu câu harness. Một việc có thể đậu lại chờ người quyết (`awaiting-human`, mang câu hỏi) — bất đồng bộ, không chặn việc khác | work-state (owns), runner (đọc frontier — frontier LOẠI việc `awaiting-human`, runner không bao giờ pick việc đang chờ người) |
| Bản ghi kết quả (outcome) | Bản ghi hai nửa gắn theo id work item — dự đoán lúc nhận việc, thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại) — cộng dồn theo id, không bao giờ đè nhau; nguồn tín hiệu cho vòng học compound. Mang thêm nhãn Diataxis `docType` và con trỏ tài-liệu `docPath` (cộng-thêm, tùy chọn) khi capture khai — là móc linkage tài-liệu↔việc | work-state (owns fold + đọc qua `fgos check`; ghi `docType`/`docPath` qua `compound`), runner (ghi cả hai nửa trong vòng dispatch), enduser-docs-index (đọc `docPath` để truy ngược tài liệu về capture) |
| Cổng chờ-người (human-gate) | Điểm một việc dừng chờ người quyết trước khi đi tiếp; mang cặp câu hỏi/câu trả lời gộp theo id. Primitive chung — spine cho mọi cổng-người của vòng đời (intake, exploring, planning, review PR) | work-state (owns — verb `fgos ask`/`answer`, đọc qua `fgos list`) |

[unknown — các entity khác cần harvest interview; xem Open Gaps]

## Actors & Roles (global)

- Product owner (user) — khóa/supersede luật, duyệt gate, chốt quyết định sản phẩm.
- Agent (Claude/Codex session) — đọc doctrine + spec, thi hành công việc, capture settlement.
- Worker (trợ lý nền do runner phái) — làm MỘT việc trong nhánh cô lập, chỉ để lại commit; không ghi trạng thái, không sửa cây chính.

[unknown — vai trò khác nếu có, cần harvest]

## Cross-Area Flows

**Vòng tự hành việc (work-state ↔ runner):** người vận hành khai việc (`fgos add`) → runner `--once` lấy việc sẵn-sàng từ frontier → claim `doing` (runner ghi nửa dự đoán của bản ghi outcome) → trợ lý nền làm trong nhánh `fgw/` → runner tự chấm bằng proof của việc → đạt: `awaiting-approval` (đề xuất + nhánh, runner ghi nửa thực tế) → NGƯỜI duyệt qua cổng `review`/`approve`/`reject` — một cổng duy nhất cho mọi đề xuất (xem "Cổng duyệt PR nội bộ" dưới) — merge sạch tự động khi duyệt → `done` → việc phụ thuộc mở khóa. Trượt/lỗi: bảng phục hồi → thử-lại/đỗ-lại (ghi nửa thực tế)/dừng (ghi nửa thực tế); một cổng duyệt gãy (merge conflict hoặc verify đỏ sau merge) đậu đề xuất lại ở `blocked` mang lý do, không tự rebase, không halt cả vòng. Cả hai nửa đọc lại được qua `fgos check` — nguồn của vòng học compound.

**Cổng duyệt PR nội bộ (work-state ↔ runner):** một đề xuất `awaiting-approval` — dù đến từ runner (nhánh `fgw/<id>`) hay từ cửa pull `take`/`return` (dải commit) — đi qua CÙNG một cổng: `review` (xem diff), `approve` (merge nếu có nhánh, rồi verify; hoặc chỉ verify nếu code đã trên main), `reject` (từ chối, không revert). Duyệt sạch đóng cạnh `→done` mang role NGƯỜI; gãy đóng cạnh MỚI `awaiting-approval→blocked` mang lý do. Xem docs/specs/runner.md "Cổng duyệt PR nội bộ" cho hợp đồng đầy đủ.

**Cửa pull giao–nhận việc (work-state, thay thế runner cho MỘT item):** một tác nhân ngoài runner — người, một phiên đang sống, hay một runner thứ hai — `fgos take` đúng một item từ CÙNG tập frontier runner dùng, rồi tự `fgos return`; `return` không tin lời người gọi, tự đo working tree sạch + HEAD tiến + verify thật trước khi item thành `awaiting-approval` mang `headAtReturn` — mirror đúng contract `awaiting-approval` của runner. Gặt-lại lúc khởi động của runner không bao giờ giẫm lên claim này (xem docs/specs/work-state.md "Cửa pull giao–nhận việc", docs/specs/runner.md). Dải `headAtTake→headAtReturn` là nguồn diff của đề xuất này khi nó tới cổng duyệt PR nội bộ (trên).

**Vòng tài liệu người-dùng-cuối (enduser-docs-authoring → enduser-docs-index):** khi việc mang status `retrospective`, kỷ luật soạn tài liệu đọc capture thật của việc, phân đúng một ngăn Diataxis, lưu tag + móc đường-dẫn lên capture (`fgos compound --doc-type --doc-path`), gom **mọi** capture của đường dẫn đó (`fgos doc-sources`), rồi grow-or-create một tài liệu sống theo tồn-tại-tệp — tích luỹ không mất (write-side). Sau đó `fgos docs-index` liệt kê tài liệu và truy ngược mỗi tài liệu về capture qua `docPath` (read-side); tài liệu how-to đầu tiên nay liên kết thật tới capture `doc-fgos-rollup-howto`. Ngăn Diataxis là trục cấu trúc duy nhất; purpose/audience là metadata, không phải trục thứ hai.

**Hướng mặt-người đa-surface (đã chốt, chưa xây — backlog STR37/STR38, per D b2d18cc7):** mọi mặt người — cửa lệnh hôm nay, web/chat/webhook mai sau — là DA; ruột chỉ có một, và chỗ da gặp ruột là hợp đồng cửa-lệnh (envelope kết quả + phân loại exit đóng). Một listener nhận transport ngoài (web/chat) sống ở đất host-adapter và DỊCH yêu cầu thành verb — gọi cửa lệnh như một người dùng, không bao giờ mở đường ghi riêng; kèm cổng xác danh "ai được nói verb nào" trước khi dịch (mô tả tự do đổ vào intake là vector tiêm lệnh vì proof của việc chạy như lệnh — nguồn chưa kiểm phải qua cổng). Chuẩn hóa đi trước **đã xong** (STR37): envelope bọc kết quả trên MỌI verb qua một cửa in duy nhất + một manifest verb máy-đọc (`--help --json`, mỗi verb có cờ `access` read/mutation) để mọi surface sinh giao diện từ manifest thay vì hard-code. Còn lại của hướng này: listener host-adapter + cổng xác danh (backlog STR38). Chiều hệ→người chủ động (kênh chú-ý) chưa xây — surface tạm poll danh sách việc + so hash thay đổi của envelope; poll bắt đầu khó chịu là tín hiệu kênh chú-ý đến lượt.

[unknown — vòng học distillery → porting → platform law cần harvest xác nhận từng bước; xem Open Gaps]

## Open Gaps

- distillery: spec chỉ phủ porting lifecycle (docs/specs/distillery.md) — các khả năng khác (tìm nguồn mới, so sánh chéo, xếp hạng candidate) chưa có spec.
- distill-skill: chưa có area spec — harvest từ SKILL.md + lệnh thực chạy (`init/add/delta/seal/check`).
- Shared entities ngoài 2 dòng đã liệt kê: cần harvest interview.
- Cross-area flow học→port→luật: các bước và actor quan sát gì ở mỗi bước — cần harvest.

## Pointers (implementation)

- `README.md` — mô tả sản phẩm + mục lục tài liệu
- `.agents/skills/distill/SKILL.md` — định nghĩa skill distill (Node zero-dep)
- `node .claude/skills/distill/scripts/distill.mjs check` — lệnh verify hiện hành (ghi tại `.bee/config.json`)

## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.


### 0016 — Mốc MVP của fgOS

#### Bối cảnh

Trước quyết định này fgOS chưa có phát biểu MVP/milestone chính thức nào — grep "MVP"/"milestone" trong `docs/` trả 0 hit. Định nghĩa "có harness" ở `platform-foundations.md` L5 (sáu câu hỏi) và thang trưởng thành hạ tầng L6 (F0–F5, fgOS tự tuyên F4 tại 2026-07-16) đo ĐỘ CHÍN CỦA HẠ TẦNG, không đo "người dùng cuối LÀM ĐƯỢC GÌ". Một câu MVP nháp xuất hiện trong báo cáo tích hợp P50 (2026-07-20) nhưng gắn nhãn "chưa chốt" và chỉ sống trong một file HTML report — không phải tài liệu sản phẩm đã ship.

Mốc dogfood tự-phát-triển (STR25) đã ĐẠT 2026-07-17: item thật đi trọn vòng submit→clarify→decompose→execute→PR→merge, không cần bee đỡ. Nghĩa là VÒNG cốt lõi đã chạy; cái còn thiếu để thành "sản phẩm cho người lạ" là hai điều trong chính câu MVP: người-mới-chỉ-dùng-tài-liệu-đã-ship, và tối-thiểu-ngồi-canh.

#### Quyết định

1. **Phát biểu MVP của fgOS (chốt):**

   > Một người mới — không có ngữ cảnh trước, chỉ dựa vào tài liệu ĐÃ SHIP — cài fgOS, nộp MỘT yêu cầu thật bằng văn xuôi tự do, và nhận lại một thay đổi code thật: chạy được, có test, sẵn sàng merge — với tối thiểu sự canh chừng của con người.

2. **"Tối thiểu ngồi canh" có răng đo được:** con người chỉ can thiệp ở các CỔNG-NGƯỜI thật sự cần một quyết định (clarify không hội tụ được vì thiếu thông tin chỉ người có; duyệt/merge). Con người KHÔNG phải can thiệp để gỡ hệ tự-kẹt (park oan, loop lỗi, phán đoán lồng-nhau hỏng). Một lần bắt người gỡ-kẹt là một lỗi tính vào MVP, không phải một cổng-người hợp lệ.

3. **Trục MVP bổ sung cho L5/L6, không thay thế:** L5 (định nghĩa "có harness") và L6 (thang chín hạ tầng) đo phía HỆ; câu MVP này đo phía NGƯỜI DÙNG CUỐI. Ba trục cùng tồn tại, không trùng.

4. **Phạm vi MVP là "một yêu cầu → một code change".** Nó KHÔNG đòi goal-directed planning (khai goal → tự sắp cả backlog, STR67) — đó là tính năng lớn hơn, mở rộng CƠ HỘI vượt MVP tối thiểu, không phải điều kiện của MVP.

#### Hệ quả

- **Ưu tiên hướng MVP** (dẫn ra từ phát biểu này): (a) độ tin cậy của loop tự chạy — mọi "gỡ-kẹt-thủ-công" là bug MVP (ví dụ STR68: phán đoán discovery lồng-nhau trả văn xuôi thay vì JSON → park oan item rõ ràng, vi phạm trực tiếp "tối thiểu ngồi canh"); (b) chất lượng tài liệu ĐÃ SHIP đủ cho người lạ (STR64); (c) trải nghiệm cổng-người khi loop THẬT SỰ cần người (STR61 đã ship; STR69/STR70 là enabler).
- **STR67 (goal-directed planning)** dùng chính câu MVP này làm target đầu vào cho ca dogfood đầu tiên của nó — nhưng nằm NGOÀI phạm vi MVP tối thiểu (điểm 4).
- **Không supersede gì** — thêm một trục mục tiêu sản phẩm mới, không đổi luật L1–L10.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0018 — Mốc MVP2 của fgOS

#### Bối cảnh

Quyết định `0016` chốt phát biểu MVP của fgOS: một người mới nộp MỘT yêu cầu
thật bằng văn xuôi tự do và nhận lại một thay đổi code thật, chạy được, có
test, sẵn sàng merge — với tối thiểu sự canh chừng của con người. MVP1 đã
chứng minh vế đó khi con người là người BẤM NÚT khởi động vòng lặp: nộp yêu
cầu rồi tự tay `pick` để hệ chạy tiếp không cần canh (`0016` điểm 2).

Việc còn lại là kiểm tra vế thứ hai: liệu VÒNG LÕI ấy (discover → decompose →
implement → return → review tới `done`) có ra kết cục TƯƠNG ĐƯƠNG hay không
khi không có bất kỳ cú bấm-tay nào khởi động nó — một dispatcher chạy độc lập
(`fgos-runner --once`) tự claim và tự đóng vòng, không cần con người chọn
việc. Đây chính là nội dung CoS đã amend của PBI `p-52601a01`
(`.bee/backlog.jsonl`, 2026-07-27T11:09:16Z): dựng và đối chiếu hai ca dry-run
sống trên testbed `repo/dogfood-fixture/` đã có sẵn — một do
`/fgOS:submit` + `/fgOS:pick` trong cùng phiên tương tác kích hoạt, một do
`/fgOS:submit` + `fgos-runner --once` độc lập kích hoạt — và ghi nhận kết
quả đối chiếu, không phải chỉ lập kế hoạch.

#### Quyết định

1. **Phát biểu MVP2 (chốt, mở rộng `0016`):**

   > MVP1 (`0016`) đã chứng minh một yêu cầu do con người BẤM NÚT khởi động
   > đi trọn vòng lõi tới `done`. MVP2 chứng minh CHÍNH vòng lõi đó
   > (discover → decompose → implement → return → review tới `done`) đạt
   > kết cục TƯƠNG ĐƯƠNG khi khởi động **không có bất kỳ cú bấm-tay nào** —
   > một dispatcher chạy độc lập (headless) tự đóng trọn vòng, không cần
   > con người chọn việc.

2. **"Tương đương" có răng đo được (kế thừa khung đo của `0016` điểm 2):**
   cả hai ca — ca tương tác (`/fgOS:pick`) và ca headless
   (`fgos-runner --once`) — phải cùng đạt: verify xanh, một commit thật trên
   nhánh riêng của item, và dọn worktree sạch sau khi xong. Một khác biệt
   giữa hai kết cục là một GAP THẬT, được ghi nhận thành một dòng `proposed`
   mới trong `repo/docs/backlog.md`, không âm thầm bỏ qua.

3. **Trục MVP2 bổ sung cho trục MVP1, không thay thế:** `0016` chứng minh
   vòng lõi CHẠY ĐƯỢC khi con người khởi động; `0018` chứng minh CHÍNH vòng
   lõi ấy chạy được khi con người KHÔNG khởi động. Đây là cùng một vòng lõi
   được kiểm chứng dưới hai đường kích hoạt khác nhau, không phải một tính
   năng mới.

4. **Phạm vi MVP2 vẫn là "một yêu cầu → một code change"** — kế thừa nguyên
   trạng giới hạn phạm vi của `0016` điểm 4 (không đòi goal-directed
   planning). MVP2 chỉ đổi CÁCH vòng lõi được khởi động, không mở rộng
   những gì vòng lõi phải làm.

#### Hệ quả

- Testbed và hạ tầng dùng để chứng minh MVP2 (`repo/dogfood-fixture/`,
  `repo/.fgos-runner.json`, `src/runner/worktree.mjs`) đã có sẵn từ trước —
  quyết định này không kéo theo việc dựng hạ tầng mới, chỉ ghi nhận phát
  biểu mốc và kết quả đối chiếu hai ca chạy thật.
- Bất kỳ khoảng cách nào giữa ca tương tác và ca headless được đối chiếu ra
  (kể cả trường hợp một trong hai đường không thể chạy an toàn với hạ tầng
  hiện có) là một phát hiện gap thật của chính mốc MVP2 này, được nạp vào
  `repo/docs/backlog.md` như một dòng `proposed`, không phải điều kiện thất
  bại của quyết định — quyết định vẫn đứng, gap trở thành việc kế tiếp.
- **Không supersede `0016`** — `0018` mở rộng trục MVP đã chốt bằng vế
  headless, không đổi phát biểu MVP1 hay luật L1–L10.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
