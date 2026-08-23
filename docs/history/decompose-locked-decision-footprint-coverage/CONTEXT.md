---
item: tsk-1gr
stage: clarify
docsRef: docs/history/decompose-locked-decision-footprint-coverage/
---

# CONTEXT — tsk-1gr: decompose có thể bỏ sót một quyết định đã khoá khỏi mọi footprint con

## Feature boundary

Sau `decompose` chia một item thành N con, đối chiếu MỖI quyết định đã
khoá trong `CONTEXT.md` của item cha với tập hợp footprint của TẤT CẢ
con sinh ra — nếu một quyết định nêu path file thật (đổi vị trí/tên/nội
dung file hiện có) mà KHÔNG con nào khai footprint chạm tới file đó (cũ
lẫn mới), gắn cờ ADVISORY ngay lúc decompose, thay vì để lọt tới
compound-learn mới phát hiện (hoặc không bao giờ phát hiện).

Khác bản chất với gate `footprintOverlapAmong` đã có (collision giữa
các con — thuần cơ học, 0 false-positive, CHẶN thật/`need-human`): gate
này là completeness (không con nào nhận trách nhiệm một quyết định) —
cần đối chiếu text quyết định với footprint, có rủi ro false-positive
cao hơn nên KHÔNG chặn (D1).

**Ngoài scope:** cơ chế footprint-carry-through cho split-children đã
tồn tại và closed (`docs/backlog.md` `[p-f86134a0]`, `decompose.mjs`
`verdict.children` + `bin/fgos.mjs add` đều có slot footprint) — item
này không đụng lại cơ chế đó, chỉ dùng nó làm input cho check mới.

## Locked decisions

| D-ID | Summary | Rationale |
|---|---|---|
| D1 | Check advisory-only (gắn cờ, không chặn decompose) | Khác gate collision sibling (thuần cơ học, 0 false-positive) — check này cần đối chiếu semantic nên có rủi ro false-positive; chặn oan tốn Ship Faster hơn giá trị. Bắt được tại decompose (thay vì không bao giờ bắt) đã là cải thiện lớn; nâng lên chặn sau nếu advisory chứng minh đáng tin (cùng tinh thần D3/D5 của `tsk-66o`) |
| D2 | Quyết định "phải phủ footprint" xác định THUẦN CƠ HỌC — text D-ID chứa token dạng đường-dẫn + `fs.existsSync` xác nhận file thật tồn tại → đủ điều kiện kiểm; không có path nào trong text → miễn tự động | Giữ toàn bộ cơ chế 100% mechanical, không cần subprocess judge — rẻ hơn dự kiến ban đầu, giảm bề mặt false-positive cho D1 (chỉ kiểm case có bằng chứng path rõ ràng, khớp đúng ca `tsk-2ta`) |

## Pinned terms

- **completeness gap** — một quyết định đã khoá không có child nào
  nhận trách nhiệm (khác **collision** — hai con cùng đụng một file).
- **path-shaped token** — chuỗi con trong text D-ID khớp hình dạng
  đường dẫn file (chứa `/` hoặc đuôi file quen thuộc) VÀ resolve được
  qua `fs.existsSync` tới file thật trong repo tại thời điểm decompose
  chạy.

## Scout evidence

- `docs/explanation/auto-decompose-can-drop-a-locked-decision-from-every-childs-footprint.md` — bằng chứng sống `tsk-2ta` (D1 amended dời `.fgos-runner.json`→`.fgos/config.json`, 4 con không đứa nào chạm, quyết định chưa bao giờ làm dù cả 4 con `done`).
- `docs/explanation/why-decompose-checks-footprint-overlap-before-creating-children.md` — gate sibling đã có: `footprintOverlapAmong` kiểm collision GIỮA các con dự kiến, TRƯỚC khi tạo, chặn thật (`need-human`) khi có chồng lấn — mẫu hình cho vị trí chạy (decompose-time, trước khi con được tạo) nhưng KHÁC mức nghiêm (D1: advisory, không chặn).
- `docs/backlog.md` `[p-f86134a0]` — "fgOS split-children creation has no footprint carry-through... — done": cơ chế field footprint cho parent-linked children ĐÃ closed, không phải gap của item này.
- `src/intake/plan.mjs` — nơi `verdict.children` được xử lý, chỗ tự nhiên để chèn check completeness cạnh check collision đã có.
- Impact-analysis capability: `present` (GitNexus), Full mode.

## Canonical references

- `docs/history/parallel-decomposition-footprint-avoidance/DISCUSSION.md` — nơi gap này lần đầu được đặt tên (D4 của `tsk-66o`), tách ra thành `tsk-1gr` sibling.

## Outstanding questions deferred to planning

- Chọn regex cụ thể cho "path-shaped token" (vd yêu cầu `/` hoặc đuôi file `.mjs`/`.md`/`.json`/...) — implementer chọn, không material (D2 chỉ khoá NGUYÊN TẮC thuần-cơ-học, không khoá regex chính xác).
- Định dạng dòng advisory (nằm trong `ask` của `need-human`-shaped park, hay một kênh riêng như `fgos decision` tự động) — planning quyết, không ảnh hưởng D1/D2.
