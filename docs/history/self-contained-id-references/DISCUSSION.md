# DISCUSSION: Trích dẫn D-ID/RUL-ID/ADR không self-contained

Item: `tsk-37i`.

## 1. Trạng thái hiện tại

Round 4. Round 3 chốt D1 (3 tầng đúng, sửa nhắm format+enforcement). Round 4:
người dùng trả lời câu hỏi mở #6 ở §3 — cần quét sửa lại tài liệu CŨ đang vi
phạm, không chỉ áp luật cho tài liệu mới ("tài liệu quá dơ rồi"). Agent đo
quy mô thật (~36/~62/~69 file across 3 tầng, xem §3 #6 + §5) trước khi coi
câu trả lời này đã đủ cụ thể để đưa vào §7. Tất cả 3 câu hỏi mở quan trọng
nhất (#4/#5 cơ chế, #6 phạm vi) giờ đã có hướng trả lời rõ (D1 + §3 #6) —
discussion gần hội tụ; còn #7 (hiển thị phân biệt local/global cho người
đọc) chưa bàn kỹ, cần xem có phải chặn hội tụ hay có thể gộp vào §7 luôn. Round 1 scout xong hệ thống trích dẫn nội bộ fgOS (ADR/RUL/D-local)
— cả ba đã có convention thành văn nhưng chỉ sửa hình dạng chữ, không đòi
tóm tắt nội dung, và luật D-local đang bị phá ở diện rộng (xem §3 #1-3).
Round 2 scan upstream `beegog` (bản clone cũ lệch 1213 commit, đã pull mới),
tìm 2 cơ chế cụ thể trả lời câu hỏi #4-#5 ở §3, đăng ký thành porting
candidate ở `docs/distillery/porting-log.md`. Round 3: người dùng hỏi
"beegog có mấy tầng luật" rồi tự xác nhận "vẫn có 3 tầng" — **D1 vừa chốt**
(§4): cấu trúc 3-tầng của fgOS không phải chỗ sai, beegog hội tụ độc lập về
đúng 3 tầng đó, nên việc sửa KHÔNG cần tái cấu trúc số tầng — chỉ cần sửa
format trích dẫn (id trần → id+gloss) và cơ chế enforce (kiểm máy phần cấu
trúc, kỷ luật văn xuôi phần nội dung), đúng 2 candidate đã đăng ký ở round
2. §6 vừa regenerate lần đầu theo D1. Câu hỏi mở tiếp theo: người dùng có
đồng ý 2 candidate đó (hoặc phần nào của chúng) là hướng cụ thể để bắt đầu
`plan` không, hay cần bàn thêm trước khi coi discussion hội tụ.

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
| 6 | Rõ | **Người dùng chốt hướng: cần quét sửa lại tài liệu CŨ, không chỉ áp luật cho tài liệu mới** — lý do nêu thẳng: "tài liệu quá dơ rồi." Quy mô thật đã đo (grep, round 3, xem §5): ~36 file (`.agents/skills/`, `docs/specs/`, `.claude/skills/` — phần lớn là bản sinh-tự-động từ `.agents/skills/` nên sửa nguồn là đủ, không sửa 2 lần) trích D-local trần ngoài CONTEXT.md gốc; ~62 file có ít nhất 1 trích RUL trần không kèm tên area; tới ~69 file khớp mẫu số 4 chữ số kiểu ADR trần ngoài `docs/decisions/`/`docs/history/` (số này CHƯA lọc false-positive, cần xác minh lại lúc lập kế hoạch thật). Đây là quy mô thật, không phải ước lượng — việc chia nhỏ/ưu tiên cụ thể (sửa hết 1 lần hay theo domain, ai làm) để `fgos-coding-planning` quyết khi item này hand-off. |
| 7 | Chưa rõ | Câu hỏi gốc của người dùng ("id của rule/decision là local hay global") — đã trả lời được ở mức khái niệm (#1 trên) nhưng CHƯA rõ nên hiển thị phân biệt này ở đâu cho người đọc thấy ngay khi gặp 1 trích dẫn, không phải phải nhớ luật riêng biệt (vd ký hiệu tiền tố khác nhau đã đủ phân biệt global/local, hay cần cách khác)? |

## 4. Quyết định đã chốt

| D-ID | Nội dung |
|---|---|
| D1 | Cấu trúc 3 tầng trích dẫn hiện có của fgOS (global-vĩnh viễn / scope-theo-file-reset-mỗi-file / cục bộ-1-feature) **đã được xác nhận đúng, không phải chỗ cần sửa** — beegog hội tụ độc lập về đúng 3 tầng này (short8 global ~ ADR, `R<n>` reset mỗi `docs/knowledge/areas/<x>.md` ~ RUL`<n>`, D-local ~ D-local). Phạm vi sửa của thảo luận này **không bao gồm** tái cấu trúc số tầng hay đổi id scheme hiện có — chỉ nhắm 2 chỗ: (a) format trích dẫn (bắt buộc kèm gloss, không còn id trần) và (b) cơ chế enforce (kiểm máy phần trích dẫn có trỏ đúng chỗ, kỷ luật văn xuôi phần nội dung gloss đúng/đủ). Ghi qua `fgos decision --id tsk-37i` (seq 18919). |

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

- **2026-08-17T~09:00Z — D1 chốt (agent, theo xác nhận người dùng).** Người
  dùng: "như vậy họ vẫn có 3 tầng" — đọc là xác nhận điểm agent đã nêu ở
  cuối round 2 (3 tầng của fgOS không sai, chỉ chi phí thăng hạng + luật
  trích D-local ra ngoài là khác). Điểm này đã ổn định qua ≥2 lượt (agent
  nêu round 2 → người dùng xác nhận round 3) nên mint D1, ghi qua `fgos
  decision --id tsk-37i` (seq 18919). §6 regenerate lần đầu theo D1 bên
  dưới.

- **2026-08-17T~09:30Z — Trả lời câu hỏi #6 (người dùng), đo quy mô (agent).**
  Người dùng: "cần quét sửa lại tài liệu, vì tài liệu quá dơ rồi" — chốt
  hướng bao gồm quét/sửa tài liệu CŨ, không chỉ luật cho tài liệu mới. Agent
  đo quy mô thật bằng grep trước khi ghi vào §3 (kỷ luật scout-trước-khi-ghi):
  `grep -rlE "\(D[0-9]+[a-z]?(,|\))" .agents/skills .claude/skills docs/specs
  plugins` (loại `/CONTEXT.md` gốc) → 36 file; `grep -rlE "RUL[0-9]+[^ ]"`
  (loại `docs/history`/`docs/decisions`) → 62 file; mẫu 4-chữ-số kiểu ADR
  trần ngoài `docs/decisions`/`docs/history` → 69 file (chưa lọc
  false-positive, cần xác minh lại lúc lập kế hoạch). Ghi chú quan trọng:
  `.claude/skills/*` phần lớn là bản sinh-tự-động từ `.agents/skills/*`
  (xem đầu file `fgos-coding-shaping/SKILL.md`: "generated thin wrapper...
  edit the source instead") — sửa nguồn `.agents/skills/` là đủ, không cần
  sửa 2 lần thủ công. Chưa mint D2 cho câu trả lời này (kỷ luật: không lock
  D-ID từ 1 câu trả lời duy nhất) — để `fgos-coding-planning` khoá chính
  thức lúc hand-off, cùng lúc chia nhỏ quy mô ~36-69 file thành task cụ
  thể.

## 6. Thiết kế đã chốt {#design}

**Không tái cấu trúc, chỉ vá 2 chỗ hẹp.** fgOS giữ nguyên 3 tầng trích dẫn
đã có (ADR toàn cục — RUL scope-theo-spec — D-local scope-theo-feature),
được xác nhận đúng hình dạng qua hội tụ độc lập với beegog (D1). Thiết kế
sửa gồm đúng 2 mảnh, mỗi mảnh khớp 1 porting candidate đã đăng ký ở
`docs/distillery/porting-log.md`:

```mermaid
flowchart TB
    subgraph fgOS3["3 tầng trích dẫn fgOS (giữ nguyên, D1)"]
        ADR["ADR&lt;n&gt;<br/>toàn cục, vĩnh viễn"]
        RUL["RUL&lt;n&gt;<br/>reset mỗi docs/specs/*.md"]
        DLOCAL["D&lt;n&gt; local<br/>1 feature, CONTEXT.md"]
    end
    subgraph Fix1["Mảnh 1 -- format + kiểm máy (one-line-cite-plus-local-delta)"]
        FORMAT["Trích ngoài nhà gốc BẮT BUỘC:<br/>id + 1 dòng gloss + delta cục bộ<br/>(không bao giờ id trần)"]
        POINTER["Check cấu trúc: trích dẫn có trỏ<br/>đúng file/heading thật không --<br/>máy kiểm, fail build"]
        FORMAT --> POINTER
    end
    subgraph Fix2["Mảnh 2 -- reversal sweep (decision-citation-and-reversal-sweep)"]
        SUPERSEDE["supersede 1 ADR"] --> SWEEP["quét docs/**+skills/**<br/>tìm mọi nơi trích id cũ"]
        SWEEP --> RECONCILE["sửa hoặc waive-có-lý-do<br/>NGAY cùng lượt, trước khi ghi"]
    end
    ADR -.trích ngoài.-> FORMAT
    RUL -.trích ngoài.-> FORMAT
    DLOCAL -.trích ngoài, ĐANG VI PHẠM.-> FORMAT
    ADR -.bị supersede.-> SUPERSEDE
```

- **Mảnh 1 (format + pointer-integrity)** trả lời câu hỏi #4/#5 ở §3: nội
  dung gloss (đúng/đủ không) là kỷ luật văn xuôi, xét bởi review; CẤU TRÚC
  trích dẫn (trỏ đúng file/heading thật không) là 1 check máy chạy trong
  `npm test`, có negative-control tự chứng minh còn phát hiện được lỗi.
- **Mảnh 2 (reversal sweep)** vá đúng chỗ hổng thật đang tồn tại: hôm nay
  `docs/decisions/0000-index.md` supersede chỉ dựa kỷ luật tay (dòng
  30-36) — không có gì bắt buộc người viết record mới đi sửa mọi chỗ đã
  trích record cũ.
- **D-local vẫn KHÔNG được nới lỏng** (chưa có quyết định nào đảo luật khoá
  `0017`) — vi phạm cụ thể đã tìm thấy (`fgos-coding-shaping/SKILL.md` trích
  trần D2/D4/D6) là việc cần dọn theo mảnh 1, không phải lý do để đổi luật
  D-local.
- **Phạm vi giờ bao gồm quét/sửa tài liệu CŨ** (§3 #6 người dùng chốt) — 3
  mảnh việc, không phải 2: mảnh 1 (format+pointer-check), mảnh 2 (reversal
  sweep), và mảnh 3 mới — dọn ~36-69 file đang vi phạm trên cả 3 tầng, quy
  mô đo thật ở §5 round 4. Mảnh 3 phụ thuộc mảnh 1 (cần format/check tồn
  tại trước để biết sửa thành gì và biết đã sửa đúng chưa).

Còn mở, có thể không chặn hội tụ: câu hỏi #7 ở §3 (hiển thị phân biệt
local/global cho người đọc ở đâu) — hiện đã có câu trả lời khái niệm qua D1
(tiền tố `ADR`/`RUL(area)`/`D-local` đã đủ phân biệt), có thể gộp thẳng vào
mảnh 1 (format mới) ở §7 thay vì cần bàn riêng.

## 7. Danh mục hạng mục / task {#tasks}

### {#task-citation-format-and-pointer-check} Mảnh 1 — Format trích dẫn + pointer-integrity check
- **Mục tiêu:** mọi trích ADR/RUL/D-local ngoài nhà gốc bắt buộc dạng
  `<ID> (<tóm tắt 1 dòng>)`, không bao giờ id trần; thêm 1 check máy (kiểu
  `pointer_integrity.rs` của beegog) chạy trong `npm test`, xác nhận mọi
  trích dẫn trỏ đúng file/heading thật, có negative-control fixture.
- **Trích §6:** "Mảnh 1 (format + pointer-integrity)".
- **D-ID áp dụng:** D1.
- **Quan hệ với sibling:** mảnh 3 phụ thuộc mảnh này (cần format chốt trước
  khi dọn file cũ theo đúng khuôn).
- **Verify nháp:** `npm test` xanh + check mới bắt được ≥1 lỗi thật đã biết
  (`fgos-coding-shaping/SKILL.md` D2/D4/D6 trần) trước khi sửa, và hết báo
  lỗi sau khi sửa.

### {#task-adr-reversal-sweep} Mảnh 2 — Reversal sweep cho ADR supersede
- **Mục tiêu:** khi 1 quyết định `docs/decisions/` bị supersede, quét
  `docs/**`+`.agents/skills/**` tìm chỗ trích id cũ, bắt xử lý (sửa hoặc
  waive-có-lý-do) trước khi ghi supersede — thay kỷ luật tay hiện tại
  (`0000-index.md` dòng 30-36).
- **Trích §6:** "Mảnh 2 (reversal sweep)".
- **D-ID áp dụng:** D1.
- **Quan hệ với sibling:** độc lập với mảnh 1/3, có thể làm song song.
- **Verify nháp:** supersede 1 ADR test có ≥1 chỗ trích cũ → sweep bắt
  được, chặn ghi cho tới khi reconcile/waive.

### {#task-retroactive-citation-cleanup} Mảnh 3 — Dọn tài liệu cũ đang vi phạm
- **Mục tiêu:** sửa lại ~36 file trích D-local trần, ~62 file trích RUL
  trần không kèm area, tới ~69 file khớp mẫu ADR trần (số cần xác minh lại
  khi lập kế hoạch) theo đúng khuôn mảnh 1. Sửa `.agents/skills/` nguồn là
  đủ — không sửa `.claude/skills/*` (bản sinh tự động).
- **Trích §6:** "Phạm vi giờ bao gồm quét/sửa tài liệu CŨ".
- **D-ID áp dụng:** §3 #6 (chưa mint D-ID riêng — xem ghi chú round 4).
- **Quan hệ với sibling:** phụ thuộc mảnh 1 (cần khuôn format tồn tại
  trước).
- **Verify nháp:** check máy của mảnh 1 chạy sạch trên toàn `docs/`+
  `.agents/skills/` sau khi dọn.
