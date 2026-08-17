# DISCUSSION: Trích dẫn D-ID/RUL-ID/ADR không self-contained

Item: `tsk-37i`.

## 1. Trạng thái hiện tại

Round 2. Round 1 scout xong hệ thống trích dẫn nội bộ fgOS (ADR/RUL/D-local)
— cả ba đã có convention thành văn nhưng chỉ sửa hình dạng chữ, không đòi
tóm tắt nội dung, và luật D-local đang bị phá ở diện rộng (xem §3 #1-3).
Người dùng yêu cầu quét thêm upstream `bee`/`beegog` xem họ giải quyết vấn
đề tương tự thế nào, và cập nhật lại bản clone gốc (`upstreams/bee` mô tả
trong `docs/distillery/sources/bee.md` đã lệch **1213 commit** so với
upstream thật — đã pull `/home/vantt/projects/beegog` về mới, cập nhật
`docs/distillery/sources/bee.md` với 2 phát hiện trực tiếp liên quan). Kết
quả: bee có sẵn **2 cơ chế cụ thể, đã chạy thật**, trả lời gần như trọn vẹn
câu hỏi mở #4-#5 ở §3 — xem §5 round 2 để chi tiết, đã trình bày cho người
dùng ở chat. Chưa có quyết định nào chốt (§4 vẫn rỗng) — round tới cần
người dùng phản hồi hướng nào trong 2 cơ chế bee (hoặc kết hợp) muốn áp cho
fgOS.

## 2. Mục tiêu & đề bài

Người dùng (chủ dự án) phản ánh: khi agent trao đổi hoặc viết tài liệu trong
fgOS, agent hay trích các định danh ngắn (D-ID cục bộ một work-item, RUL-ID
luật nền, ADR quyết định toàn dự án, tsk-id công việc khác) mà không kèm nội
dung hay phạm vi hiệu lực, khiến người đọc — không có lịch sử chat, không
thuộc lòng registry — không thể hiểu hay ra quyết định mà không bắt agent
diễn giải lại. Vấn đề nhân đôi khi các artifact vốn phải tồn tại lâu dài
(skills, specs, adhoc-task/subtask giao cho agent khác) bị nhiễm cùng lối
trích dẫn trần trụi này: chúng trở thành không tự-đọc-hiểu-được
(self-contained), tốn resource của agent đọc sau để dò ngược nguồn, và vỡ
hoàn toàn khi một skill/spec bị mang sang vận hành ở project khác (không còn
`docs/history/<feature>/` hay `docs/decisions/` gốc của fgOS để tra). Mục
tiêu của thảo luận này: quyết định một quy ước trích dẫn/viết-tài-liệu áp
dụng thống nhất cho cả giao tiếp hội thoại và tài liệu ghi lại, đủ để một
người/agent lạ đọc một trích dẫn đơn lẻ mà hiểu được nội dung cốt lõi VÀ biết
ngay phạm vi hiệu lực của nó (cục bộ 1 work-item hay toàn dự án) — không phải
bắt buộc phải mở file gốc trước khi hiểu được câu đang đọc.

## 3. Vấn đề rõ / chưa rõ

| # | Trạng thái | Nội dung |
|---|---|---|
| 1 | Rõ | fgOS đã có 3 hệ định danh trích dẫn liên quan, phạm vi hiệu lực khác nhau: **ADR`<n>`** (`docs/decisions/000N-slug.md`, unique toàn dự án, permanent), **RUL`<n>`** (`docs/specs/platform-foundations.md` RUL1-RUL10 + rải rác RUL11-RUL58+ trong từng spec khác — **KHÔNG unique toàn cục, scope theo spec gốc**), **D`<n>` local** (`docs/history/<feature>/CONTEXT.md`, scope đúng 1 work-item/feature, không phải số hex toàn xưởng). |
| 2 | Rõ | Quy ước hiện có cho ADR: viết `ADR<n>` thay vì số trần (`docs/decisions/0000-index.md` dòng 22-25). Quy ước hiện có cho RUL: **không unique toàn cục — khi trích ngoài spec gốc phải kèm tên area**, vd `RUL42 (runner)` (`docs/id-systems-audit.md` dòng 49, mục #5). Quy ước hiện có cho D-local: **khoá cứng — D-local KHÔNG BAO GIỜ được trích dẫn ngoài chính file `CONTEXT.md` gốc của nó** (quyết định `0017`, `docs/id-systems-audit.md` §5 dòng 152). Cả ba đều đã thành văn — vấn đề không phải "chưa có luật" mà là (a) luật chỉ sửa hình thức chữ, không đòi tóm tắt nội dung đi kèm, và (b) luật D-local đang bị phá ở diện rộng (xem #3). |
| 3 | Rõ — bằng chứng thật, không suy đoán | Vi phạm cụ thể quan sát trực tiếp: skill đang chạy phiên thảo luận NÀY (`.agents/skills/fgos-coding-shaping/SKILL.md`) trích trần `(D2)`, `(D4)`, `(D6)` nhiều lần trong "Hard rules" — các D-ID này chỉ tồn tại trong `docs/history/fgos-coding-shaping/CONTEXT.md` (đã đọc, xác nhận D1-D6 nằm ở đó, feature cục bộ của CHÍNH skill này). SKILL.md không phải CONTEXT.md, và SKILL.md được nạp vào MỌI phiên tương lai chạy skill này — vi phạm trực tiếp luật khoá của quyết định `0017`. Đây không phải lỗi ngẫu nhiên của 1 file: `grep RUL[1-9][0-9]` trên `docs/` trả ~559 match trong 147 file, phần lớn trích trần không kèm gloss (`RUL33/RUL34`, `RUL25`, `RUL50`, `RUL58 D4` — không tên area, không tóm tắt). Ví dụ người dùng nêu (`0026, 0028-0031, 0033`) cũng đúng dạng vi phạm quy ước ADR đã có (thiếu prefix `ADR`, thiếu tóm tắt) — không phải hiện tượng cá biệt của 1 lần trả lời. |
| 4 | Chưa rõ | Sửa ở tầng nào: (a) chỉ sửa **kỷ luật hội thoại** (agent tự nhắc mình gloss khi trích, không cần cơ chế enforce), (b) sửa **kỷ luật viết tài liệu** (skills/specs/CONTEXT.md phải tự chứa, không trích D-local/RUL/ADR trần), hay (c) cả hai — và nếu (c), có cần một cơ chế kiểm tra máy (lint/grep-check) hay thuần kỷ luật văn xuôi như `0000-index.md` dòng 30-36 đã chọn cho supersede-trỏ-ngược? |
| 5 | Chưa rõ | Mẫu gloss tối thiểu chấp nhận được là gì — 1 cụm từ ngắn ("D2: never write CONTEXT.md/plan.md directly") hay bắt buộc kèm cả phạm vi hiệu lực ("D2, cục bộ tsk-27y, không áp dụng ngoài feature này")? Có khác nhau giữa gloss-khi-nói-chuyện (ngắn, tự nhiên) và gloss-khi-viết-tài-liệu-bền (đầy đủ hơn, vì tài liệu sống lâu hơn hội thoại)? |
| 6 | Chưa rõ | Phạm vi sửa: chỉ áp dụng luật mới cho tài liệu MỚI viết từ nay, hay cần một đợt quét/sửa tài liệu cũ đang vi phạm (đặc biệt `fgos-coding-shaping/SKILL.md` đang chạy phiên này, và có thể các skill `fgos-coding-*` khác cùng họ)? Việc quét ngược có đáng effort so với ưu tiên Ship Faster không, hay để tự nhiên sửa khi file đó được đụng tới lần sau? |
| 7 | Chưa rõ | Câu hỏi gốc của người dùng ("id của rule/decision là local hay global") — đã trả lời được ở mức khái niệm (#1 trên) nhưng CHƯA rõ nên hiển thị phân biệt này ở đâu cho người đọc thấy ngay khi gặp 1 trích dẫn, không phải phải nhớ luật riêng biệt (vd ký hiệu tiền tố khác nhau đã đủ phân biệt global/local, hay cần cách khác)? |

## 4. Quyết định đã chốt

*(chưa có mục nào — round 1, đang trình bày phân tích trước khi hỏi)*

## 5. Q&A log

- **2026-08-17T04:45Z — Scout ban đầu (agent).** Đọc `docs/decisions/0000-index.md`
  (quy ước `ADR<n>`), `docs/decisions/0017-dong-audit-he-id-ten-goi.md` (luật khoá
  D-local, hệ RUL không unique toàn cục), `docs/id-systems-audit.md` §5 (định
  nghĩa D-hex vs D-local + luật citation), `docs/specs/platform-foundations.md`
  dòng 64-79 (RUL1-RUL10), và grep `RUL[1-9][0-9]` trên toàn `docs/` (559 match,
  147 file). Xác nhận trực tiếp `.agents/skills/fgos-coding-shaping/SKILL.md`
  trích trần D2/D4/D6 ngoài `docs/history/fgos-coding-shaping/CONTEXT.md` —
  vi phạm quyết định `0017`. Kết luận: vấn đề không phải "chưa có luật" mà
  "luật có nhưng (a) không đòi tóm tắt nội dung, chỉ đòi đúng hình dạng chữ,
  và (b) đang bị phá ở diện rộng, kể cả trong chính skill vừa dùng để mở
  cuộc thảo luận này."

- **2026-08-17T~06:20Z — Scan bee/beegog upstream (agent, theo yêu cầu người
  dùng).** Version-check trước: `upstreams/bee/` (mô tả trong
  `docs/distillery/sources/bee.md`, cursor v1.18.3, 2026-07-28) lệch xa thực
  tế — bản clone làm việc `/home/vantt/projects/beegog` (remote
  `github.com/thanhsmind/beegog`) đứng sau `origin/main` **1213 commit**;
  tag thật mới nhất là `v2.7.0` (không có `v0.2.x` nào trong lịch sử —
  người dùng có thể đã nhớ nhầm số phiên bản). Đã `git pull --ff-only` cập
  nhật clone, rồi đọc 2 file trong `docs/knowledge/areas/` (state layer mới
  của bee, thay `docs/specs/` cũ) liên quan trực tiếp câu hỏi của phiên
  này — không phải re-scan toàn bộ 1213 commit. Đã ghi lại 2 phát hiện vào
  `docs/distillery/sources/bee.md` (mục `decision-citation-and-reversal-sweep`
  dưới domain `context-memory`, mục `one-line-cite-plus-local-delta` dưới
  domain `docs-style`), đã trình bày tóm tắt cho người dùng ở chat. Tóm tắt
  2 cơ chế:
  1. **Reversal-propagation sweep** (`docs/knowledge/areas/decision-memory/overview.md`
     R2+R8): mọi artifact trích 1 quyết định phải kèm `short8` (hash 8 ký
     tự, id toàn cục — không phải số nguyên nhỏ đơn thuần); khi 1 quyết
     định bị supersede, hệ thống tự quét `docs/**` tìm mọi nơi đã trích id
     cũ, bắt buộc sửa hoặc waive-có-lý-do NGAY trong cùng lượt trước khi
     ghi supersede — khác hẳn cách fgOS hiện tại (supersede xong, tự nguyện
     nhớ sửa chỗ trích cũ, không cơ chế bắt buộc).
  2. **"One rule, one home" + pointer-integrity check**
     (`docs/knowledge/areas/doctrine-layer/prompt-writing-standard.md` R3,
     `.../verify-pipeline/skill-reference-pointer-integrity.md`): 1 luật chỉ
     phát biểu đầy đủ đúng 1 lần ở nhà gốc; mọi nơi khác trích nó **bắt
     buộc kèm 1 dòng tóm tắt + phần khác biệt cục bộ**, không bao giờ chỉ
     trích id trần — đây chính là câu trả lời trực tiếp cho câu hỏi #5 ở
     §3. Phần này (nội dung gloss có đúng/đủ không) vẫn là kỷ luật văn
     xuôi, xét bởi review — nhưng phần *cấu trúc* (trích dẫn có trỏ tới 1
     file/heading thật không) được 1 test Rust (`pointer_integrity.rs`)
     kiểm máy trên mọi lần verify, có negative-control fixture để tự chứng
     minh test còn phát hiện được lỗi — bắt được 3 pointer gãy thật ngay
     lần đầu chạy, dù các file đó trước giờ vẫn "pass" mọi check khác. Đây
     là câu trả lời cho câu hỏi #4 ở §3 (cần cơ chế kiểm máy hay thuần kỷ
     luật): bee chọn **cả hai, chia theo đúng ranh giới máy-kiểm-được vs
     người-phán-được** — không phải một lựa chọn nhị phân.

- **2026-08-17T~08:55Z — Đăng ký 2 candidate vào porting-log (agent, theo
  yêu cầu "cập nhật tài liệu tìm được").** Thêm 2 dòng `candidate` vào
  `docs/distillery/porting-log.md` qua `addPorting()`
  (`src/state/porting-store.mjs`, đúng cửa ghi state layer, không tay-sửa
  `events.jsonl`): `decision-citation-and-reversal-sweep` (R3 E2 F3) và
  `one-line-cite-plus-local-delta` (R3 E2 F2) — cả hai nguồn `beegog`. Đây
  là bước chính thức hoá 2 phát hiện round 2 vào hệ thống porting của
  distillery, tách biệt với việc mô tả tính năng ở `sources/bee.md` (đã
  làm round 2) — porting-log là nơi TRACK quyết định có port vào fgOS hay
  không, còn `sources/bee.md` chỉ MÔ TẢ tính năng tồn tại ở nguồn. Người
  dùng hỏi thêm: "họ (beegog) có 3 tầng luật như fgOS hay mấy tầng?" — trả
  lời trong chat: beegog có CÙNG hình dạng 3 tầng (global decision /
  area-scoped rule numbering-lại-mỗi-file / feature-local D-label), khác ở
  chỗ tầng global rẻ hơn (một lệnh CLI thay vì viết tay 1 file ADR mới) và
  tầng feature-local ĐƯỢC PHÉP trích ra ngoài miễn kèm neo toàn cục
  (short8) — không cấm tuyệt đối như luật D-local của fgOS.

## 6. Thiết kế đã chốt {#design}

*(chưa đủ chín — chưa có quyết định nào chốt ở §4)*

## 7. Danh mục hạng mục / task {#tasks}

*(chưa đủ chín — chờ §6)*
