---
area: work-state
updated: 2026-07-14
sources: [phase-1-state-layer, phase-1-review-fixes, phase-2-routing-s1]
decisions: [9ac6ca50, 0790031c, 451ca088, fd17309a, 55ad2f9f, feed7428]
coverage: full
---

# Spec: Work-State (tầng quản việc của forgent)

Bộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận "đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn.

## Entry Points & Triggers

- `fgos init` → khởi tạo kho work-state rỗng tại thư mục làm việc hiện hành (nhật ký rỗng + bản chiếu rỗng)
- `fgos add` → khai một work item mới (kèm đủ trường bắt buộc; `--tier` tùy chọn)
- `fgos move` → chuyển trạng thái một item, kèm `--expect` (kỳ vọng, chống ghi đè mù); cạnh từ-chối-đề-xuất bắt buộc `--reason`
- `fgos decision --text "..."` → ghi một quyết định vào nhật ký
- `fgos list` → đọc danh sách item từ bản chiếu hiện hành
- `fgos rebuild` → dựng lại bản chiếu từ zero bằng cách phát lại toàn bộ nhật ký

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | id | Định danh bền của work item, dạng kebab-case chữ thường, mở đầu bằng chữ cái; không trùng | ví dụ `add-login-form` | yes | — |
| 2 | title | Tên việc người đọc hiểu; nhận mọi ký tự unicode | free text | yes | — |
| 3 | kind | Loại việc (trả lời "việc này thuộc loại gì" — câu 2 của sáu câu) | free text | yes | — |
| 4 | status | Trạng thái vòng đời; schema từ chối giá trị ngoài năm trạng thái này (phạm trù `validation`) kể cả qua tầng thư viện | `todo` — chưa bắt đầu · `doing` — đang làm · `blocked` — kẹt, hai chiều với todo/doing · `proposed` — goal-check đạt, đề xuất nằm trên nhánh chờ duyệt · `done` — đã nhận vào cây chính, TERMINAL: hai lối vào (`doing→done` thao tác tay, `proposed→done` duyệt đề xuất), không bao giờ ra | yes | `todo` |
| 5 | deps | Các id item phải xong trước; mọi id phải tồn tại, cấm tự trỏ; "epic" chỉ là một item thường được deps trỏ vào | danh sách id | yes (rỗng được) | `[]` |
| 6 | risk | Mức rủi ro của việc (câu 4) | free text | yes | — |
| 7 | refs | Đọc gì trước / chạm contract nào (câu 1 + 3) | danh sách tham chiếu | yes (rỗng được) | — |
| 8 | verify | Proof gì thì xong (câu 5) | free text | yes | — |
| 9 | learn | Link bài học để lại (câu 6 — chỗ cắm vòng học sau này) | text | no | — |
| 10 | tier | Hạng nặng-nhẹ của việc, để chọn model thực thi (bảng tier→model đến ở Phase 2 E3; tập giá trị provisional tới lúc đó) | `light` · `standard` · `heavy` | no | `standard` |
| — | Sự kiện (không hiển thị) | Đơn vị ghi của nhật ký; mỗi thao tác ghi đúng MỘT sự kiện, số thứ tự tăng dần + thời điểm + phiên bản schema `v` (hiện hành: 2; sự kiện di sản không có `v` vẫn đọc được) | `work.add` — khai item (luôn mang tier tường minh từ v2) · `work.move` — chuyển trạng thái (from/to; cạnh từ-chối mang `reason`) · `decision` — quyết định kèm chữ | — | — |
| — | Phạm trù lỗi (không hiển thị) | Hợp đồng cho consumer: rẽ nhánh theo mã thoát, không theo thông điệp | `precondition` → mã 2 · `conflict` (kỳ vọng lệch) → mã 3 · `validation` → mã 4 · `corrupt-log` → mã 5 · bất ngờ → mã 1 · thành công → 0 | — | — |

## Behaviors & Operations

### Khai việc (add)

- **Blocked when:** thiếu trường bắt buộc, id sai dạng kebab-case, id trùng, dep trỏ id không tồn tại — tất cả trả phạm trù `validation` (mã 4), KHÔNG sự kiện nào được ghi.
- **What changes:** một sự kiện khai-item vào nhật ký, item xuất hiện trong bản chiếu ở `todo`.
- **Side effects:** không.
- **Afterwards:** người/agent thấy item trong `list`; clone khác thấy sau khi nhận commit chứa nhật ký.

### Chuyển trạng thái (move)

- **Blocked when:** (a) cạnh chuyển không có trong bảng — `todo→doing`, `doing→done`, `doing→proposed`, `proposed→done`, `proposed→todo` (bắt buộc lý do), `todo/doing→blocked`, `blocked→todo/doing` là toàn bộ cạnh hợp lệ — trả `precondition` (mã 2); (a2) cạnh từ-chối `proposed→todo` thiếu/rỗng lý do — trả `validation` (mã 4); (b) trạng thái thực khác `--expect` — trả `conflict` (mã 3); (c) cờ thiếu giá trị hoặc rỗng (`--to` trống, `--expect ""`) — trả `validation` (mã 4), không bao giờ lọt sang phạm trù 2/3. Cả ba trường hợp KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái (kèm from/to) vào nhật ký, rồi bản chiếu cập nhật — luôn theo thứ tự nhật-ký-trước, bản-chiếu-sau.
- **Side effects:** không.
- **Afterwards:** `done` là cửa một chiều ra: item đã done thì mọi lần move tiếp theo đều bị `precondition`. Item bị từ chối về `todo` mang lý do trong nhật ký, vào lại hàng chờ làm tiếp.

### Ghi quyết định (decision)

- **Blocked when:** thiếu nội dung chữ — `validation`.
- **What changes:** một sự kiện quyết-định vào nhật ký; quyết định đọc được lại từ bản chiếu sau replay.

### Dựng lại (rebuild) — thao tác phục hồi

- **Runs when:** người/agent gọi, đặc biệt khi bản chiếu mất hoặc nghi lệch so với nhật ký.
- **What changes:** bản chiếu được dựng lại từ zero bằng phát lại toàn bộ nhật ký — kết quả giống hệt bản chiếu trước đó (đã chứng minh bằng test đầu-cuối chạy lệnh thật: xóa bản chiếu → rebuild → so sánh sâu bằng nhau).
- **On failure:** nhật ký có dòng cuối dở dang (đứt giữa chừng khi ghi) → báo `corrupt-log` (mã 5) nói rõ lỗi, phần nguyên vẹn phía trước vẫn đọc được; hỏng ở GIỮA nhật ký là lỗi cứng, không tự sửa, không nuốt.

### Đọc (list)

- **Blocked when:** nhật ký hỏng → `corrupt-log` (mã 5). Đọc không bao giờ ghi gì.

## Actors & Access

| Capability | Người vận hành | Agent trong repo | Clone/máy khác |
|---|---|---|---|
| Mọi thao tác ghi (init/add/move/decision) | ✓ qua cửa lệnh duy nhất | ✓ qua cửa lệnh duy nhất | — (nhận qua commit) |
| Đọc (list) / rebuild | ✓ | ✓ | ✓ sau khi clone/pull |
| Ghi thẳng vào nhật ký hay bản chiếu không qua cửa | — cấm | — cấm | — cấm |

## Business Rules

- **R1.** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lại được từ zero — không bao giờ là truth (per D3 / 451ca088; luật nền L3).
- **R2.** Mọi mutation đi qua đúng MỘT cửa; mỗi mutation để lại đúng một sự kiện (per D3).
- **R3.** Thứ tự ghi bất biến: sự kiện vào nhật ký TRƯỚC, bản chiếu cập nhật SAU; bản chiếu lệch thì rebuild là đường phục hồi (per D3).
- **R4.** Chuyển trạng thái chỉ theo bảng cạnh tường minh; `done` terminal: hai lối vào (thao tác tay / duyệt đề xuất), không lối ra (per D4 / fd17309a; mở rộng per D5 phase-2-routing / feed7428).
- **R5.** Ghi có kỳ vọng: trạng thái thực khác kỳ vọng → từ chối, không ghi đè mù (per D3).
- **R6.** Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp (per luật L4 / 14ebeea9).
- **R7.** Schema item mang đủ chất liệu trả lời sáu câu hỏi harness: refs (đọc gì/contract), kind (loại), risk (rủi ro), verify (proof), learn (bài học) (per luật L5).
- **R8.** Deps phải trỏ id tồn tại, cấm tự trỏ; một loại item duy nhất, không cấp bậc entity (per D4 / D1).
- **R9.** Tầng này quản việc của chính forgent; không generic hóa cho consumer khác khi chưa tới lượt (per D1 / 9ac6ca50).
- **R10 (tiền đề có ngưỡng).** Một người ghi tại một thời điểm; khi nhiều agent ghi đồng thời thành tải chính, mở lại thiết kế store theo ngưỡng đã ghi trong luật L3 (per ae461c8b).
- **R11 (tiến hóa schema).** Nhật ký đã commit bất khả xâm phạm — không bao giờ migration ghi đè; replay tương thích ngược có test khóa (bản ghi di sản thiếu trường nhận default khai báo, fixture nhật ký Phase 1 thật là chuẩn nghiệm thu); mỗi sự kiện mới mang phiên bản schema (per D7 phase-2-routing / feed7428).

## Edge Cases Settled

- Tiêu đề unicode (tiếng Việt, CJK, emoji) đi qua toàn tuyến ghi-đọc-rebuild nguyên vẹn (test đầu-cuối).
- Kỳ vọng cũ dùng lại lần hai (double-apply) bị chặn ở `conflict`, nhật ký không phình (test đầu-cuối).
- Dòng cuối nhật ký đứt giữa chừng: phát hiện to và rõ, phần trước còn nguyên; đây là trường hợp DUY NHẤT được tha thứ khi đọc — hỏng giữa nhật ký là lỗi cứng.
- Id trùng khi khai: từ chối, không sự kiện thừa.
- Cờ thiếu giá trị/rỗng ở `move` được phân loại `validation` (mã 4), không nhầm sang `precondition`/`conflict` — chốt từ review, có test khóa (phase-1-review-fixes).
- Nhật ký di sản (trước v2, thiếu tier/v) replay nguyên vẹn với default; nhật ký trộn cũ/mới cùng kết quả — test khóa bằng fixture sinh từ binary Phase 1 thật (`test/fixtures/phase1-events.jsonl`).
- View lệch-còn-tồn-tại (khác view mất): `rebuild` ghi đè toàn phần từ log, có test khóa đúng chế độ hỏng này; đọc không bao giờ tự sửa file view.

## Open Gaps

(none)

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `bin/fgos.mjs` — CLI một cửa, bảng EXIT_CODES, resolve `.fgos/` từ cwd
- `src/state/store.mjs` — chủ ghi duy nhất (append event → update view); facade lỗi: EXIT_CODES + categoryOf + re-export 4 error class; STATUSES sống ở work.mjs (fsm re-export)
- `src/state/events.mjs` — append/read JSONL `.fgos/events.jsonl` (seq + ts ISO, path tường minh), phát hiện corrupt tail
- `src/state/fsm.mjs` — bảng TRANSITIONS + precondition + CAS, thuần
- `src/state/work.mjs` — schema + validate (ID_PATTERN kebab-case)
- `src/state/replay.mjs` — fold events → view, thuần
- `.fgos/events.jsonl` (committed, truth) · `.fgos/state.json` (gitignored, view D4)
- Test: `npm test` (116 test; e2e tại `test/e2e/rebuild-determinism.test.mjs`, chạy binary thật trong tmp dir)
