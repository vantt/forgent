# DISCUSSION — Phase 2: status/statusCategory (multi-domain schema)

Item: `tsk-38t`. Nguồn gốc: `plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md`
(10+ vòng phân tích, chốt kiến trúc round 4). Item đang `stage: clarify`,
`status: awaiting-human`, gate hỏi bảng map 10 status → statusCategory.

## 1. Trạng thái hiện tại

Vòng 3. Đã chốt **D1**: domain-specific status vocabulary chỉ áp cho đoạn
TRƯỚC `delivered`; chuỗi `delivered→retrospective→cleanup→done` cố định,
dùng chung tên y hệt mọi domain — khác nhau ở SKILL chạy bước
`retrospective`/`cleanup`, không phải ở tên status. Đây là thu hẹp thật so
với kết luận round-4 của report gốc ("domain sở hữu TOÀN BỘ bảng
transition") — thu hẹp lại đúng phạm vi domain thật sự cần tự khai (đoạn
đầu vòng đời). Gap thật phát sinh từ D1: chưa có cơ chế nào ánh xạ
per-domain skill cho status `retrospective`/`cleanup` hôm nay (`fgos-
compounding` được gọi cứng, không tham số hoá theo domain) — xem §3 #10.
Câu hỏi kế tiếp: phạm vi chính xác của "đoạn trước delivered" — `wontfix`
(exit thay thế, không nằm trên đường `delivered`) và `blocked`/`awaiting-
human` (đã là từ chung chung, không mang mùi coding) có nằm trong phần
"domain tự khai" hay cũng nên cố định như đuôi?

## 2. Mục tiêu & đề bài

Tách `status` (nhãn hiển thị, domain tự sở hữu bảng transition riêng — coding
giữ nguyên 100% hành vi) khỏi `statusCategory` (field foundation mới, ~6 giá
trị cố định, đóng băng lúc ghi event `work.move`/`work.add`, KHÔNG derive-on-
read) — để mọi cơ chế domain-agnostic của fgOS (frontier dep-resolve, rollup,
compound-learn/retrospective trigger, outcome/friction, discovery-judge) đọc
category thay vì literal status, và domain khác (marketing...) có thể tự khai
label riêng mà không phải học/đụng vào 10 giá trị status của coding. Đây là
supersede thật quyết định base-workflow-model D1-D3 ("domain không bao giờ
chi phối bảng chuyển-status") — domain sẽ sở hữu bảng transition của chính
nó; `fsm.mjs`/`status-fsm.mjs` vẫn validate move dựa trên bảng đó (đầy đủ,
mịn), KHÔNG dựa trên category (category là bản nén có mất mát, đã chứng minh
lủng ở cạnh `blocked→awaiting-human`). Cùng pattern áp cho `kind`→`kindCategory`
nếu enum hóa `kind` sau này (ưu tiên thấp hơn, ngoài phạm vi bắt buộc của
lần chốt này) và `domainFields` nested per-domain (optional-additive).

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `tsk-3p1` (marker RUL12, acceptance clause 5 của tsk-38t nói "gộp chung 1 vòng explore với tsk-3p1") | **RÕ — đã đổi** | `fgos show tsk-3p1` xác nhận `status: wontfix`. Việc đó KHÔNG còn cần gộp — RUL12 dependent-open hôm nay đã đọc `frontier.mjs:186 RESOLVED_STATUSES = {'delivered','retrospective','cleanup','done','wontfix'}`, tức là code thật đã tự giải quyết đúng câu hỏi "done trả lời 2 nghĩa" theo hướng khác (thêm status `delivered` làm điểm mở-dependent, không phải marker cộng-thêm). Acceptance clause 5 của tsk-38t nên coi là lỗi thời, cần xoá/viết lại khi item quay lại `fgos-coding-planning`. |
| 2 | Bảng map status → statusCategory trong report gốc (mục 6) chỉ liệt 7 status cũ | **RÕ — đã đổi, cần bảng mới** | FSM hôm nay có 10 status (`todo/doing/blocked/awaiting-approval/awaiting-human/delivered/retrospective/cleanup/done/wontfix`) — `delivered/retrospective/cleanup` được thêm SAU report bởi quyết định `work-item-status-delivered-retrospective-cleanup` D1/D2, thay `doing→done`/`awaiting-approval→done` trực tiếp bằng chuỗi `delivered→retrospective→cleanup→done`. Đây đúng là câu hỏi đang treo ở gate (`fgos show tsk-38t` — discovery Q2, impactScore 78) — mình sẽ bàn kỹ ở vòng tới, KHÔNG tự chốt ở đây. |
| 3 | `RESOLVED_STATUSES` (`frontier.mjs:186`) đã là 1 tập hợp "giống category" viết tay | **RÕ** | Đây chính là bằng chứng sống cho thấy code đã tự phát sinh nhu cầu category — `{delivered, retrospective, cleanup, done, wontfix}` dùng cho dep-resolve VÀ `hasOpenDescendant`. Khớp gần đúng với đề xuất gate Q2 của item (4 status đó → `completed`, `wontfix` → `canceled`). |
| 4 | `retro-pool.mjs:12` (`isRetrospectiveReady`) đọc `item.status === 'retrospective'` literal | **RÕ — xác nhận consumer thật** | Đây là ví dụ cụ thể, thật, của "cơ chế domain-agnostic đang đọc literal status" mà report mục 6 mô tả trừu tượng — object thật cần đổi sang đọc statusCategory (hoặc giữ nguyên nếu category `review`/`completed` không đủ mịn để phân biệt "vừa delivered" khỏi "sẵn sàng retrospective" — CẦN BÀN, vì nếu cả `delivered/retrospective/cleanup/done` đều → `completed` thì statusCategory KHÔNG đủ mịn để retro-pool tự phân biệt trạng thái nào trong chuỗi đó — xem #5). |
| 5 | Nếu `delivered/retrospective/cleanup/done` gộp chung `completed`, retro-pool/cleanup-harness cần phân biệt các bước TRONG category đó | **RÕ (D1)** | Không gộp — 4 status đuôi giữ nguyên tên, dùng chung mọi domain, không cần category compress. `retro-pool.mjs`'s literal `status === 'retrospective'` đúng mãi mãi, không cần đổi. |
| 6 | `triage-table-columns.md` liệt kê 7 status cũ, đã lệch code (10 status thật) | **RÕ — gap có thật, độc lập** | Xác nhận đúng lo ngại acceptance clause 8 của report/item. Là 1 phần việc cần làm dù statusCategory chốt kiểu gì (spec/doc lệch code, không phụ thuộc quyết định category). |
| 7 | `DOMAINS` registry runtime-addable hay code-only (acceptance clause 7) | **CHƯA RÕ, có thể ngoài phạm vi** | Câu hỏi kiến trúc riêng, không chặn việc thêm `statusLabels`/`statusCategory` vào registry hiện có (dù registry runtime hay code-only, format thêm field giống nhau). Đề xuất: KHÔNG quyết trong vòng discuss này trừ khi anh muốn gộp — nó không chặn Phase 2. |
| 8 | Backfill vs lazy-default cho event cũ thiếu `statusCategory` (acceptance clause 6, câu hỏi mở #10 report) | **RÕ (D4)** | Backfill qua migration script, theo khuôn 2 tiền lệ có sẵn — không lazy-default (rủi ro L3 thật, xem D4). |
| 9 | Test chứng minh thiết kế (acceptance clause 9) — domain giả lập thứ 2 có `statusLabels` riêng, chạy qua take/return/compound | **RÕ là cần, CHƯA có kế hoạch cụ thể** | `test/e2e/synthetic-domain.test.mjs` đã tồn tại làm tiền lệ hình dạng, nhưng domain `synthetic` hôm nay KHÔNG có transition nào cả (`transitions: []`) — không đủ để chứng minh domain-transition-riêng hoạt động đúng. Cần domain giả lập MỚI có bảng transition thật khác coding. |
| 10 | Per-domain skill cho status `retrospective`/`cleanup` (phát sinh từ D1) | **RÕ (D5)** | Chỉ `retrospective` cần — tái dùng `skillMap` có sẵn, thêm key `'retrospective'`. `cleanup` không có khái niệm skill (pure harness, đọc code thật xác nhận), khác biệt per-domain đã có qua `worktreeBacked`. Sửa lại đúng phạm vi D1 (D1 nói cả 2 status đều cần skill — thực ra chỉ 1). |
| 11 | Phạm vi chính xác "đoạn trước delivered" — `wontfix`/`blocked`/`awaiting-human` có nằm trong phần domain tự khai hay cũng cố định như đuôi | **RÕ (D2 + vòng 3 xác nhận)** | `blocked`/`awaiting-human`/`todo`/`doing`/`awaiting-approval` — domain sở hữu (per D1, xác nhận vòng 3: "trước deliver là chắc chắn khác nhau"). `wontfix` — domain sở hữu label (D2), map cố định category `canceled`. Toàn bộ 6 status đoạn đầu giờ đã xếp loại xong. |
| 12 | Bảng map 6 status đoạn đầu → statusCategory (câu hỏi gốc ở gate, thu hẹp lại) | **RÕ (D3)** | Toàn bộ 6 status đoạn đầu đã map xong: `todo→todo`, `doing/blocked/awaiting-human→in-progress`, `awaiting-approval→review`, `wontfix→canceled` (D2). Đây chính là câu hỏi gốc treo ở gate của item — coi như đã trả lời đầy đủ, khác với đề xuất gốc ở chỗ phạm vi hẹp hơn 10 status (chỉ 6, nhờ D1 loại 4 status đuôi ra khỏi nhu cầu category). |
| 13 | `domainFields` (nested per-domain field) — nằm trong tiêu đề gốc của `tsk-38t` nhưng chưa hề bàn tới trong 11 vòng đầu (chỉ bàn status/statusCategory) | **RÕ (D6, distill)** | Chốt nguyên theo thiết kế report gốc mục 3 — không sửa. Đối chiếu code thật xác nhận `domainFields`/`fieldSchema` chưa tồn tại, thiết kế report vẫn khớp 100% pattern hiện có (`EDITABLE_FIELDS`, `validateWorkShape`, tiền lệ `mergeAfter`), không như phần status đã bị code thật vượt qua. |

## 4. Quyết định đã chốt

| D-ID | Tóm tắt | Ghi qua `fgos decision` |
|---|---|---|
| D1 | Domain-specific status vocabulary chỉ áp dụng cho đoạn TRƯỚC `delivered`. Chuỗi `delivered→retrospective→cleanup→done` cố định, dùng chung tên y hệt mọi domain, không domain nào relabel được. Khác biệt per-domain ở bước `retrospective`/`cleanup` nằm ở SKILL nào chạy, không phải tên status — mở rộng đúng pattern `skillMap` per-domain đã có (`workflow-stage-graphs.mjs`) sang 2 status này. | ✅ `tsk-38t` seq 5571 |
| D2 | `wontfix` ở lại đoạn ĐẦU (domain-owned label — coding giữ nguyên chữ `wontfix`, 0 migration) nhưng LUÔN map cố định vào `statusCategory: 'canceled'` — áp đúng cơ chế label/category đã có cho cả đoạn đầu, không phải luật riêng cho `wontfix`. Domain khác có thể tự đặt label khác (`declined`/`out-of-scope`) cùng map vào `canceled`. | ✅ `tsk-38t` seq 5585 |
| D3 | Bảng map 5 status đoạn đầu còn lại → `statusCategory`: `todo→todo`, `doing→in-progress`, `blocked→in-progress`, `awaiting-human→in-progress`, `awaiting-approval→review`. Căn cứ tiền lệ đã ghi thành luật: `docs/history/status-proposed-rename/CONTEXT.md` D3 — "1 status cấp cao mới CHỈ khi có hiệu ứng cấu trúc riêng trên frontier/dependency graph; nếu không, gộp vào `awaiting-human`, phân biệt mịn hơn nằm ở field `reason`/`ask`/`answer`, không phải enum mới." `doing`/`blocked`/`awaiting-human` có hiệu ứng cấu trúc GIỐNG HỆT nhau trên `frontier.mjs` hôm nay (không cái nào trong `ready`-filter, không cái nào trong `RESOLVED_STATUSES`) → đúng luật này, gộp `in-progress`. Category `backlog`/`completed` tạm không status nào map (dự phòng, đúng khung Linear-style). | ✅ `tsk-38t` seq 5586 |
| D4 | Backfill `statusCategory` cho event cũ qua 1 migration script (KHÔNG lazy-default derive-on-read), theo đúng khuôn 2 tiền lệ đã có (`migrate-status-proposed-to-awaiting-approval.mjs`, `migrate-actor-to-role.mjs`) — backup + dry-run report + khoá `withEventsLock` + phạm vi đúng 3 kho (live store, `dogfood-fixture/.fgos`, `fgos-test-drive/.fgos`). Áp bảng map D2/D3 cho ~1500+ `work.move` event sang 6 status đoạn đầu. Lý do: L3 (luật khoá) đòi hỏi replay-from-zero xác định tuyệt đối; lazy-default rủi ro thật vì `DOMAINS[domain].statusLabels` vẫn là code sửa được — sửa sau này sẽ làm 2 lần replay ra 2 kết quả khác nhau cho cùng 1 event cũ, vi phạm L3 rule 2. | ✅ `tsk-38t` seq 5589 |
| D5 | Cơ chế skill-per-domain chỉ cần cho `retrospective` — tái dùng field `skillMap` đã có trong `DOMAINS[domain]` (không thêm field mới), thêm key `'retrospective'` (mặc định `fgos-coding-compounding` cho coding, 0 regression); `fgOS:retro-next` đổi từ gọi cứng sang tra `getDomain(item.domain).skillMap['retrospective']`. `cleanup` GIỮ NGUYÊN pure-harness, không cần skill nào — khác biệt per-domain đã đủ qua field `worktreeBacked` có sẵn. | ✅ `tsk-38t` seq 5595 |
| D6 | `domainFields` chốt NGUYÊN theo thiết kế report gốc (mục 3), không sửa: field optional `domainFields: { [domainName]: {...} }` trên work item, optional-additive (RUL11); ghi qua 2 cửa sẵn có (`add` payload, `edit` thêm vào `EDITABLE_FIELDS`); patch **ghi đè toàn object** mỗi lần (latest-wins, không deep-merge); chỉ namespace khớp `work.domain` hiện tại được đọc/validate; validate qua optional `fieldSchema` khai trong `DOMAINS[domain]` (giống `skillMap`); fold qua spread-fold sẵn có. (Distill từ report — xem §5.) | ✅ `tsk-38t` seq 5602 |

## 5. Q&A log

- **2026-08-04 (vòng 1, scout):** Đọc lại report 260730 + `status-fsm.mjs` +
  `frontier.mjs` + `retro-pool.mjs` + `workflow-stage-graphs.mjs` +
  `docs/specs/work-state.md` (dòng 61/1070 base-workflow-model D1-D3) +
  `docs/decisions/0024`. Kiểm `fgos show tsk-3p1` → `status: wontfix` (xác
  nhận vấn đề #1 ở §3). Chưa hỏi câu quyết định nào — vòng này là trình bày
  drift giữa report gốc và code thật trước khi bàn tiếp.
- **2026-08-04 (vòng 2, hỏi):** Nêu vấn đề #5 (retro-pool đọc literal status,
  category có thể không đủ mịn) — hỏi anh ranh giới category có áp cho toàn
  bộ 10 status hay chỉ đoạn thật sự domain-agnostic. **Trả lời:**
  "`delivered→retrospective→cleanup` đây là đang thiết kế cho domain
  agnostic. vì về bản chất loại hình việc nào cũng cần delivery, retro, và
  cleanup. chỉ có tổ chức nào quá hời hợt sẽ bỏ qua retro và cleanup, khi đó
  sẽ ko làm việc gì trong 2 status cuối."
- **2026-08-04 (vòng 3, xác nhận + chốt D1):** Tổng hợp lại thành giả thuyết
  cụ thể ("domain chỉ tự khai đoạn trước delivered; đuôi cố định dùng
  chung") và hỏi xác nhận. **Trả lời:** "đúng, mỗi phần domain sẽ có
  status/stage trước deliver là chắc chắn khác nhau. nhưng retro không có
  status khác nhưng sẽ có cách học khác (skill), cleanup cũng sẽ có cách
  dọn khác (skill)." — giữ nguyên không đổi qua 2 vòng → chốt **D1**. Scout
  thêm: grep xác nhận `fgos-coding-compounding` gọi cứng không theo domain
  (`retro-pool.mjs`, `bin/fgos.mjs:1012/1088`) → mở vấn đề #10 (gap thật,
  chưa có cơ chế skill-per-domain cho `retrospective`/`cleanup`).
- **2026-08-04 (vòng 4, tổng quan):** Anh hỏi tổng quan toàn bộ 10 status,
  status nào đang có vấn đề. Trình bày bảng 10 status × đoạn × bias tên gọi
  × vấn đề thật, tách 3 loại vấn đề khác nhau (tên status bias / giá trị
  `reason` phụ bias / cơ chế hạ tầng giả định git-worktree). Anh chọn quyết
  loại (1) trước.
- **2026-08-04 (vòng 5, hỏi wontfix):** Chỉ còn `wontfix` chưa xếp loại (5
  status còn lại coi như xong nhờ câu trả lời vòng 3). Hỏi (a) cố định như
  đuôi hay (b) domain tự khai như đầu. **Trả lời:** "wontfix = wontdo =
  cancel = decline = outofscope; (a) thì gần đúng ý nghĩa hơn. cả a và b
  bạn nói thì đều đúng. hãy tư vấn và suy nghĩ thêm. ultrathink."
- **2026-08-04 (vòng 6, đề xuất + chốt D2):** Scout: `wontfix` xuất hiện
  literal ở 49 file + 2 decision record — đổi tên tốn thật, trái nguyên tắc
  migration=0. Nhận ra (a)/(b) không đối lập — (a) đúng ở tầng category
  (`canceled`, đã có sẵn trong 6 category round-3), (b) đúng ở tầng label
  (domain tự đặt chữ). Đề xuất: `wontfix` ở đoạn đầu (label domain-owned,
  coding giữ nguyên chữ) + map cố định category `canceled`. **Trả lời:**
  "wontfix ở lại đoạn đầu (domain-owned label, coding giữ nguyên chữ, 0
  migration)." — xác nhận không đổi → chốt **D2**.
- **2026-08-04 (vòng 7, tổng hợp §6):** Anh yêu cầu trình bày chi tiết lại
  nhóm đầu/nhóm đuôi sau khi có D1+D2.
- **2026-08-04 (vòng 8, đề xuất map):** Đề xuất bảng map 5 status còn lại
  (khớp đề xuất gốc ở gate): `todo→todo`, `doing/blocked/awaiting-human→
  in-progress`, `awaiting-approval→review`.
- **2026-08-04 (vòng 9, hỏi advise + chốt D3):** Anh hỏi advise riêng cho hệ
  quả gộp `blocked`/`awaiting-human`/`doing` chung `in-progress` (mất phân
  biệt "nghẽn" vs "chờ người" ở tầng category), gợi ý bật advisor model
  khác nếu cần. Scout thêm: `docs/history/status-proposed-rename/CONTEXT.md`
  D3 — tiền lệ đã ghi thành luật "1 status cấp cao mới CHỈ khi có hiệu ứng
  cấu trúc riêng trên frontier/dependency graph; nếu không, gộp vào
  `awaiting-human`, phân biệt mịn hơn nằm ở field `reason`/`ask`/`answer`,
  không cần enum mới" — đối chiếu code thật, `doing`/`blocked`/
  `awaiting-human` có hiệu ứng cấu trúc giống hệt nhau trên `frontier.mjs`
  hôm nay → đúng luật, nên gộp. Không cần bật advisor riêng nhờ tìm được
  tiền lệ nội bộ dứt khoát. Đề xuất giữ nguyên bảng vòng 8. **Trả lời:**
  "Ok chốt. Nhớ ghi nhận lý do chi tiết" — xác nhận không đổi qua 2 vòng →
  chốt **D3**.
- **2026-08-04 (vòng 10, hỏi + chốt D4):** Bàn §3 #8 (backfill vs
  lazy-default). Scout: L3 (`docs/platform-foundations.md`, luật khoá) —
  "DB là materialized view, rebuild được từ zero bằng replay changeset";
  2 tiền lệ migration script có sẵn (`migrate-status-proposed-to-awaiting-
  approval.mjs`, `migrate-actor-to-role.mjs`); quy mô thật ~1500+
  `work.move` event cần backfill (đếm từ `.fgos/events.jsonl`, 5588 dòng).
  Đề xuất backfill (không lazy-default, vì lazy-default rủi ro vi phạm L3
  nếu `DOMAINS[coding].statusLabels` bị sửa sau này). **Trả lời:** "chấp
  nhận." — xác nhận không đổi qua 2 vòng → chốt **D4**.
- **2026-08-04 (vòng 11, hỏi + chốt D5):** Bàn §3 #10. Scout:
  `fgos-routing/SKILL.md` dòng 109-111 tự xác nhận `retrospective` KHÔNG đi
  qua `skillMap`/`skillForStage` domain-aware có sẵn, bị bắc cầu riêng
  cứng; đọc code thật `fgos cleanup` xác nhận nó KHÔNG gọi skill nào cả
  (pure harness) — sửa lại giả định D1 (D1 nói cả 2 status cần skill, thực
  ra chỉ `retrospective`). Đề xuất: tái dùng `skillMap` thêm key
  `retrospective`; `cleanup` giữ nguyên harness. **Trả lời:** "ok" — xác
  nhận không đổi qua 2 vòng → chốt **D5**.
- **2026-08-04 (vòng 12, distill domainFields → D6):** Anh hỏi
  `fgOS:coding-shape-distill` có dùng vào đâu không. Nhận ra khoảng hở:
  `domainFields` nằm trong tiêu đề gốc `tsk-38t` nhưng 11 vòng đầu chưa hề
  bàn tới. Chọn hướng (a) — gọi hình thức `fgOS:coding-shape-distill`,
  trích nguồn `plans/reports/research-260730-0931-...-report.md` mục 3
  "Nested domain fields", nạp vào ĐÚNG file này (không tạo file mới, đúng
  luật D3). Đối chiếu code thật (`store.mjs` `EDITABLE_FIELDS`, `work.mjs`
  `validateWorkShape`) xác nhận domainFields/fieldSchema chưa tồn tại,
  thiết kế report chưa bị vượt qua (khác hẳn phần status). Trình bày thiết
  kế trích ra, hỏi xác nhận. **Trả lời:** "chốt nguyên theo report gốc" —
  chốt **D6**.

## 6. Thiết kế đã chốt {#design}

**Bức tranh hiện tại (sau D1), viết cho người/agent chưa đọc gì trước đó:**

fgOS's work item có 10 status hôm nay (`todo/doing/blocked/awaiting-approval/
awaiting-human/delivered/retrospective/cleanup/done/wontfix`), validate qua
1 bảng transition PHẲNG, DÙNG CHUNG cho mọi domain (`status-fsm.mjs`) — đúng
hành vi hôm nay, chưa đổi gì. Mục tiêu Phase 2: cho domain khác (marketing...)
tự khai nhãn/transition riêng mà không phải học 10 chữ coding-flavored, và
cho mọi cơ chế lõi của fgOS (frontier, rollup, outcome/friction,
discovery-judge) 1 cách đọc "item đang ở đâu" không phụ thuộc từ vựng domain.

**D1 + D2 chia 10 status hôm nay thành 2 nhóm bản chất khác nhau — KHÔNG
phải chia theo "status nào đứng trước/sau trong chuỗi", mà theo "domain có
được tự đặt tên khác cho status này không":**

```mermaid
flowchart LR
    subgraph front["NHÓM ĐẦU — domain-owned label (D1+D2+D3)\nmỗi status map vào 1 statusCategory"]
        direction TB
        todo[todo] --> cat1["category: todo"]
        doing[doing] --> cat2["category: in-progress"]
        blocked[blocked] --> cat3["category: in-progress"]
        ah[awaiting-human] --> cat4["category: in-progress"]
        aa[awaiting-approval] --> cat5["category: review"]
        wf[wontfix] --> cat6["category: canceled"]
    end
    subgraph tail["NHÓM ĐUÔI — cố định, dùng chung mọi domain (D1)\nKHÔNG cần statusCategory, literal status = đủ dùng"]
        direction LR
        B[delivered] --> C[retrospective] --> D[cleanup] --> E[done]
    end
    front -- "goal-check pass" --> tail
```

**NHÓM ĐẦU — 6 status: `todo`/`doing`/`blocked`/`awaiting-human`/
`awaiting-approval`/`wontfix`.** Domain sở hữu nhãn + bảng transition riêng
cho nhóm này — đây MỚI thật sự là phạm vi supersede base-workflow-model
D1-D3 (report gốc round 4), thu hẹp hơn report gốc mô tả ("domain sở hữu
TOÀN BỘ bảng"). Domain KHÔNG BẮT BUỘC phải đặt tên khác — coding có thể
giữ nguyên cả 6 chữ này, D1/D2 chỉ nói domain CÓ QUYỀN, không ép. Mỗi
status trong nhóm này map vào đúng 1 `statusCategory` cố định (field
foundation, đóng băng lúc ghi event `work.move`, KHÔNG derive-on-read —
luật L3), đã chốt đủ (D2+D3): `todo→todo`, `doing→in-progress`,
`blocked→in-progress`, `awaiting-human→in-progress`,
`awaiting-approval→review`, `wontfix→canceled`. Gộp 3 status
`doing`/`blocked`/`awaiting-human` chung `in-progress` là quyết định có
căn cứ nội bộ (D3): `docs/history/status-proposed-rename/CONTEXT.md` D3
đã ghi luật "1 status cấp cao mới CHỈ khi có hiệu ứng cấu trúc riêng trên
frontier/dependency graph; nếu không, gộp — phân biệt mịn hơn nằm ở field
`reason`/`ask`/`answer`, không cần enum mới" — 3 status này có hiệu ứng
cấu trúc GIỐNG HỆT nhau trên `frontier.mjs` hôm nay (không cái nào trong
`ready`-filter, không cái nào trong `RESOLVED_STATUSES`), nên gộp đúng
luật, không mất thông tin thật (chi tiết "vì sao đang chờ" vẫn còn nguyên
ở `reason`/`ask`/`answer`, cơ chế nào cần mịn hơn vẫn đọc `status`
literal). Mọi cơ chế domain-agnostic thật sự (frontier's `ready` filter,
rollup, outcome/friction, discovery-judge) phải đọc `statusCategory`,
không đọc literal status, cho 6 status này.

**NHÓM ĐUÔI — 4 status: `delivered`/`retrospective`/`cleanup`/`done`.**
KHÔNG relabel được, mọi domain dùng chung đúng 4 tên này — vì đây là nghĩa
vụ phổ quát của bất kỳ loại hình việc nào (delivery thật, nhìn lại, dọn
dẹp), không phải từ vựng riêng của coding (D1, xác nhận trực tiếp: "loại
hình việc nào cũng cần delivery, retro, và cleanup"). Hệ quả: các cơ chế
đọc literal status ở nhóm này (`retro-pool.mjs`'s
`status === 'retrospective'`, phần `delivered/retrospective/cleanup/done`
trong `frontier.mjs`'s `RESOLVED_STATUSES`) KHÔNG cần đổi sang đọc
category — chúng đã đúng, mãi mãi, không phụ thuộc domain; KHÔNG cần
`statusLabels` map cho 4 status này trong registry domain. Khác biệt
per-domain nằm ở **skill nào chạy** bước `retrospective`/`cleanup` (mở
rộng pattern `skillMap` per-domain đã có ở tầng `stage`,
`workflow-stage-graphs.mjs`), không phải ở tên status — nhưng cơ chế chọn
skill-theo-domain đó CHƯA TỒN TẠI (gap thật, §3 #10; `fgos-coding-compounding`
đang gọi cứng, không tham số hoá theo domain).

**Hệ quả 1 chi tiết cần lưu ý cho `RESOLVED_STATUSES` (frontier.mjs:186):**
tập này hôm nay trộn CẢ 2 nhóm (`delivered/retrospective/cleanup/done` —
nhóm đuôi + `wontfix` — nhóm đầu). Khi hiện thực hoá, nơi này sẽ cần đọc
HỖN HỢP: literal status cho 4 tên đuôi + `statusCategory === 'canceled'`
cho phần thay `wontfix` (để bắt được cả label khác domain map vào cùng
category) — không phải 1 danh sách literal string thuần như hôm nay. Đây
là hệ quả suy ra trực tiếp từ D1+D2, không phải quyết định mới cần hỏi.

**Backfill event cũ (D4):** viết mới 1 migration script (khuôn `migrate-
status-proposed-to-awaiting-approval.mjs`) ghi cứng `statusCategory` vào
~1500+ `work.move` event cũ theo đúng bảng D2/D3 — không lazy-default, vì
`DOMAINS[coding].statusLabels` vẫn là code sửa được, derive-on-read sẽ vỡ
L3 (replay-from-zero xác định) nếu bảng đó bị sửa sau này.

**Skill-per-domain cho `retrospective` (D5):** thêm key `'retrospective'`
vào `skillMap` đã có trong `DOMAINS[domain]` (`workflow-stage-graphs.mjs`),
mặc định `fgos-coding-compounding` cho coding — 0 regression. `fgOS:retro-next`
đổi tra cứu từ gọi cứng sang `getDomain(item.domain).skillMap['retrospective']`.
`cleanup` không đổi gì — pure harness, khác biệt per-domain đã đủ qua
`worktreeBacked`.

**`domainFields` (D6, distill từ report, độc lập kỹ thuật với status/category):**
field optional `domainFields: { [domainName]: {...} }` trên work item —
ghi qua 2 cửa sẵn có (`add`/`edit`, thêm vào `EDITABLE_FIELDS`), ghi đè
toàn object mỗi lần (không deep-merge), validate qua optional `fieldSchema`
khai trong `DOMAINS[domain]`, chỉ namespace khớp `work.domain` hiện tại
được đọc. Không đụng FSM/status/category — độc lập hoàn toàn với D1-D5, có
thể code song song, không tranh file (`store.mjs`'s `EDITABLE_FIELDS` +
`work.mjs`'s `validateWorkShape`, khác vùng với `status-fsm.mjs`/
`frontier.mjs` mà D1-D5 chạm).

**Còn treo, ngoài phạm vi quyết định thiết kế (việc thật thi hành, không
chặn §7):** doc `triage-table-columns.md` lệch code (§3 #6, độc lập, không
phụ thuộc quyết định nào ở đây); kế hoạch test domain giả lập thứ 2 chứng
minh thiết kế (§3 #9, cần cho "done" nhưng là việc lập kế hoạch, không
phải quyết định thiết kế); `DOMAINS` registry runtime-addable (§3 #7,
tường minh ngoài phạm vi, không chặn). Toàn bộ 5 quyết định thiết kế
(D1-D5) đã đủ chín để tách task cụ thể ở §7.

## 7. Danh mục hạng mục / task {#tasks}

### Decision record supersede D1-D3 {#task-supersede-decision-record}
**Mục tiêu:** viết decision record mới, đúng khuôn `0024` supersede `0006`,
supersede thật `base-workflow-model` D1-D3 ("domain không bao giờ chi phối
bảng chuyển-status") — TRƯỚC khi code, liệt kê đủ mọi consumer `fsm.mjs`/
`status-fsm.mjs`/`STATUSES` hôm nay. Trích §6: domain sở hữu bảng
transition riêng CHỈ cho nhóm đầu (6 status), không phải toàn bộ 10.
**D-ID áp dụng:** D1. **Quan hệ:** tiền đề bắt buộc trước mọi task khác —
không task nào dưới đây nên code trước khi decision record này tồn tại.
**Verify nháp:** decision record tồn tại ở `docs/decisions/`, liệt đủ danh
sách consumer (audit thật, không suy đoán).

### Schema: statusCategory + registry {#task-schema-status-category}
**Mục tiêu:** thêm `STATUS_CATEGORIES` (`work.mjs`), thêm `statusLabels`
cho domain `coding` trong `DOMAINS` registry (`workflow-stage-graphs.mjs`)
theo đúng bảng D2/D3, đóng băng `statusCategory` lúc ghi event
(`work.add`/`work.move` trong `store.mjs`) — không derive-on-read.
**D-ID áp dụng:** D2, D3. **Quan hệ:** phụ thuộc task supersede-decision-
record; là nền cho task consumer-migration và backfill. **Verify nháp:**
test mới xác nhận `work.move` ghi đúng `statusCategory` theo bảng, item cũ
(chưa backfill) đọc `statusCategory: undefined` không throw.

### Backfill statusCategory cho event cũ {#task-backfill-status-category}
**Mục tiêu:** viết migration script mới, khuôn `migrate-status-proposed-
to-awaiting-approval.mjs`, backfill ~1500+ `work.move` event cũ theo bảng
D2/D3, chạy đủ 3 kho (live, `dogfood-fixture/.fgos`, `fgos-test-drive/.fgos`),
có `--backup` + dry-run report. **D-ID áp dụng:** D4. **Quan hệ:** phụ
thuộc task schema (cần bảng map đã code xong để backfill đúng). **Verify
nháp:** dry-run report khớp số event, chạy thật trên bản backup trước, đối
chiếu `git diff` chỉ thêm field `statusCategory`, không đổi giá trị khác.

### Consumer migration sang statusCategory {#task-consumer-migration}
**Mục tiêu:** audit đủ + đổi mọi cơ chế domain-agnostic thật đọc literal
status sang đọc category — tối thiểu: `frontier.mjs`'s `ready` filter
(`status==='todo'` → category), `RESOLVED_STATUSES` (hỗn hợp literal 4 tên
đuôi + `category==='canceled'`, xem §6), rollup, outcome/friction,
discovery-judge. **D-ID áp dụng:** D1, D2, D3 (định hình category nào map
vào đâu). **Quan hệ:** phụ thuộc task schema; song song được với task
backfill (không tranh file, `frontier.mjs`/`store.mjs` khác nhau). **Verify
nháp:** test full-suite hiện có xanh (0 regression coding), test mới cho
từng consumer với item domain giả lập có label khác coding.

### skillMap['retrospective'] per-domain {#task-skillmap-retrospective}
**Mục tiêu:** thêm key `'retrospective'` vào `skillMap` của `DOMAINS[coding]`
(mặc định `fgos-coding-compounding`), đổi `fgOS:retro-next` từ gọi cứng sang tra
`getDomain(item.domain).skillMap['retrospective']`. **D-ID áp dụng:** D5.
**Quan hệ:** độc lập kỹ thuật với các task trên (đụng
`workflow-stage-graphs.mjs` + skill file `fgOS:retro-next`, không tranh
file với schema/backfill/consumer-migration) — làm trước/sau/song song
đều được. **Verify nháp:** domain giả lập thứ 2 (xem task test dưới) với
`skillMap.retrospective` khác `fgos-coding-compounding` — `fgOS:retro-next` load
đúng skill đó, không phải `fgos-coding-compounding`.

### domainFields nested per-domain {#task-domain-fields}
**Mục tiêu:** thêm field optional `domainFields` — schema (`work.mjs`'s
`validateWorkShape`, validate namespace khớp domain qua optional
`fieldSchema` khai trong `DOMAINS[domain]`), ghi (`work.add` payload +
thêm `domainFields` vào `EDITABLE_FIELDS` trong `store.mjs`), fold (qua
spread sẵn có, không sửa gì thêm). **D-ID áp dụng:** D6. **Quan hệ:** độc
lập hoàn toàn với mọi task status/category ở trên (khác vùng file, không
đụng FSM) — làm trước/sau/song song đều được, kể cả trước khi decision
record supersede D1-D3 tồn tại (D6 không đụng base-workflow-model D1-D3).
**Verify nháp:** test mới — `work.add`/`work.edit` với `domainFields` hợp
lệ/không hợp lệ theo `fieldSchema` của 1 domain giả lập; item cũ không có
`domainFields` replay y hệt (0 byte thay đổi).

### Test domain giả lập thứ 2 chứng minh thiết kế {#task-second-domain-test}
**Mục tiêu:** domain giả lập MỚI (khác `synthetic`/`triage` hôm nay — cần
bảng transition status THẬT khác coding, `statusLabels` riêng,
`skillMap.retrospective` riêng, và nay cộng thêm `fieldSchema` riêng cho
`domainFields`), chạy qua `take`/`return`/`compound`/`retrospective`/
`cleanup` — chứng minh domain-owned status/category/skill/field hoạt động
đúng, không chỉ khai báo suông (đúng tinh thần
`test/e2e/synthetic-domain.test.mjs` nhưng domain hiện có không đủ, xem §3
#9). **D-ID áp dụng:** D1-D6 (test toàn bộ thiết kế). **Quan hệ:** phụ
thuộc TẤT CẢ task trên (chỉ chạy được sau khi schema/consumer-migration/
skillMap/domainFields đã code xong) — task cuối cùng trước khi coi Phase 2
là done. **Verify nháp:** `npm test` xanh với fixture domain mới, assertion
domain đó đi qua đúng bảng transition/category/skill/field riêng của nó,
KHÔNG lẫn sang bảng của coding.

### Doc gap: triage-table-columns.md {#task-triage-doc-gap}
**Mục tiêu:** cập nhật `docs/reference/triage-table-columns.md` — đang liệt
7 status cũ, lệch 10 status thật hôm nay (độc lập với category, gap có
thật từ trước Phase 2). **D-ID áp dụng:** không (fact-gap, không phải
quyết định thiết kế). **Quan hệ:** độc lập hoàn toàn — làm bất kỳ lúc nào,
không chặn/bị chặn bởi task nào khác. **Verify nháp:** doc liệt đủ 10
status, khớp `STATUSES` trong `work.mjs`.
