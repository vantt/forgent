# Extensible multi-audience artifact-producer registry for compound-learn — Discussion

## 1. Trạng thái hiện tại

Vòng 2 (vòng scout sâu, chưa hỏi thêm câu mới). Chủ sản phẩm hỏi "compound
system đã ứng dụng OKF chưa" — scout trả lời: **mới ứng dụng lớp NÔNG nhất**
(chỉ `frontmatter.mjs`, codec phẳng), toàn bộ phần chịu lực của Bee OKF
Profile chưa port. Đọc sâu 4 concept file OKF (~630 dòng) đổi khung 3 câu
hỏi vòng 1: OKF đã trả lời câu hỏi "bao nhiêu loại tài liệu" bằng
**vocabulary ĐÓNG 9 loại + luật cấm loại thứ 10**, tức NGƯỢC hướng
"registry mở" em đề xuất vòng 1 — nhưng 9 loại đó nằm trên TRỤC KHÁC với
4 quadrant Diataxis, nên không phải "chọn danh sách nào" mà là "trục nào".
Chi tiết §5 (vòng 2). §3 viết lại theo khung mới. Chưa D-ID nào chốt.

## 2. Mục tiêu & đề bài

Chủ sản phẩm coi compound-learn (bước `fgos-compounding` chạy khi item ở
`status: retrospective`, phân loại capture thật thành tài liệu Diataxis)
là một hướng chiến lược quan trọng, không chỉ công cụ nội bộ. Tầm nhìn: về
sau muốn hệ thống viết được NHIỀU LOẠI tài liệu hơn, phục vụ NHIỀU
audience hơn — không dừng ở 4 quadrant kỹ thuật (tutorial/how-to/
reference/explanation) hiện có. Ví dụ audience mới được nêu cụ thể:
marketing-storytelling — chất liệu kể chuyện cho người dùng fgOS để phát
triển sản phẩm của họ, hệ thống tự ghi nhận chi tiết/chất liệu và phát
hiện ý tưởng đáng kể chuyện, không bịa. `tsk-12m` (changelog tự động) là
use case CỤ THỂ đầu tiên của hướng này. Việc ở đây là thiết kế một cơ chế
đăng ký (registry) để mỗi audience/loại-tài-liệu mới cắm vào compound-learn
mà không phải sửa lại logic lõi mỗi lần — nhưng PHẢI giữ nguyên 4 quadrant
Diataxis hiện có (không đụng, không pha trộn — hard rule của
`fgos-compounding` cấm thẳng việc bịa quadrant thứ 5).

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Không đụng 4 quadrant Diataxis hiện có | RÕ | Hard rule `fgos-compounding` SKILL.md, xác nhận lại từ discussion `tsk-12m` |
| 2 | Tiền lệ registry mở-rộng-được đã chạy thật trong repo | RÕ, nhưng KHÔNG còn là tiền lệ phù hợp nhất | `registerCheck`/`registerFix` (`src/setup/registrations.mjs:64/85/110`) là registry cho FUNCTION máy tự chạy. Phân loại tài liệu không phải chuyện đó — Bee OKF Profile mới là tiền lệ đúng ngành, và nó chọn NGƯỢC lại (vocabulary đóng). Xem §5 vòng 2 |
| 3 | fgOS mới port lớp nông nhất của OKF | RÕ (scout vòng 2) | Có: `frontmatter.mjs` (codec phẳng, không nested), `fgos docs-index`. KHÔNG có: checker 2 tầng, `authoritative_for`/anti-fork, `context --budget`, `promote`. Bảng đối chiếu đầy đủ ở §5 |
| A | **Trục nào?** Loại tài liệu mới nằm trên trục phân loại nào | CHƯA RÕ — câu hỏi lõi, thay cho câu "registry mở hay đóng" của vòng 1 | Diataxis 4 quadrant = trục MỤC ĐÍCH NGƯỜI ĐỌC (học/làm/tra/hiểu). OKF 9 type = trục VAI TRÒ TRONG DÒNG CÔNG VIỆC (area/feature/work-item/plan/delivery/decision/pattern/runbook/evidence). Hai trục VUÔNG GÓC, không cạnh tranh nhau — một tài liệu có cả hai thuộc tính. Vậy "changelog" và "marketing-storytelling" thuộc trục nào: (A1) trục mục đích (thành quadrant thứ 5/6 — nhưng hard rule cấm, và Diataxis vốn là khung 4-góc đóng của ngành); (A2) trục vai trò mới (fgOS chưa có trục này — phải mở trục mới, giống 9-type của OKF); (A3) trục AUDIENCE riêng thứ 3 (engineer/end-user/prospect) — trực giao cả hai trục trên, khớp nhất với chữ "phục vụ nhiều audience hơn" của chủ sản phẩm |
| B | Đóng hay mở — sau khi đã chốt trục | CHƯA RÕ | OKF chọn ĐÓNG (9 type) + luật cấm loại thứ 10 khi phân biệt đó nhét vừa vào FIELD của loại đã có (ví dụ chuẩn: pitfall không thành type riêng, nằm trong `bee.polarity` của `bee.pattern`). Đồng thời OKF vẫn để MỞ phần dữ liệu: `areas`, `authoritative_for`, `tags` là free-text. Tức mô hình chín: **vocabulary cấu trúc ĐÓNG + dữ liệu chủ đề MỞ**. Nếu theo mô hình này thì câu hỏi "làm sao thêm audience mới nhanh" tự tan: audience mới là DỮ LIỆU (mở, thêm tự do), không phải TYPE mới (đóng, hiếm khi đụng) |
| C | **`compound` GHI hay ĐỀ XUẤT?** | CHƯA RÕ — phát sinh vòng 2, có thể lớn hơn cả câu A | fgOS's `compound` hiện GHI thẳng (session viết doc + commit, rồi tag). OKF's `promote` cố ý làm NGƯỢC: đề xuất, không bao giờ ghi (`writes: []` trong payload là hình thức máy-đọc của cam kết đó; không có cờ `--apply`). Lý do OKF nêu: "một đề xuất tự ghi mình vào bundle sẽ đến với dáng vẻ tri thức đã được biên tập và được tin ngay, mà chưa ai phán xét nó". Tầm nhìn chủ sản phẩm ("hệ thống ghi nhận chi tiết, chất liệu, PHÁT HIỆN ý tưởng kể chuyện") khớp chữ "phát hiện/đề xuất" hơn hẳn chữ "tự viết ra tài liệu marketing" — cần chốt: hướng mở rộng là thêm loại tài liệu ĐƯỢC GHI, hay thêm loại ĐỀ XUẤT cho người duyệt? |
| D | Ai giữ "một chủ đề một chủ sở hữu" khi số tài liệu tăng | CHƯA RÕ | `fgos-compounding` hiện phát hiện grow-vs-create CHỈ bằng file có tồn tại không. Không có khái niệm chủ-sở-hữu-chủ-đề. OKF gặp đúng vấn đề này và trả lời bằng `authoritative_for` (duy nhất theo chủ đề) + anti-fork gate 3 tầng, sau khi một judge độc lập phá được bản 1 tầng bằng 4 cách trong một buổi. Càng nhiều audience thì rủi ro 2 tài liệu cùng chủ đề càng cao — có nên port khái niệm này cùng lúc, hay để riêng? |
| E | Thứ tự làm: `tsk-28x` chờ `tsk-12m` xong trước? | GIẢ ĐỊNH, CHƯA XÁC NHẬN | Em đặt `deps: [tsk-12m]` lúc submit (làm changelog gọn trước rồi tổng quát hoá sau — Rule of Three/YAGNI). Chưa hỏi thẳng. Lưu ý mới từ vòng 2: nếu câu C nghiêng về "đề xuất, không ghi" thì `tsk-12m` (đang thiết kế theo hướng TỰ GHI changelog) có thể phải đổi hướng — tức thứ tự này có thể cần đảo |

## 4. Quyết định đã chốt

(chưa có mục nào — chưa điểm nào giữ ổn định qua >1 vòng)

## 5. Q&A log

- **2026-08-07** — Khởi tạo từ điểm E của `tsk-12m`'s discussion, theo
  yêu cầu chủ sản phẩm "chuyển sang coding-shape để bàn". Submit `tsk-28x`
  (`deps: [tsk-12m]`, dependency candidate `tsk-12m` được xác nhận bởi
  chủ sản phẩm trước khi submit). Scout tái sử dụng từ discussion
  `tsk-12m`: `src/setup/registrations.mjs:64/85/110` (tiền lệ registry),
  `.claude/skills/fgos-compounding/SKILL.md` (hard rule không bịa
  quadrant thứ 5, không ghi ngoài `docs/<quadrant>/`). 3 câu hỏi mở đặt ra
  cho vòng tiếp theo (§3).

- **2026-08-07 (vòng 2 — scout sâu OKF, không hỏi câu mới)** — Chủ sản
  phẩm hỏi: "compound system của chúng ta đã ứng dụng OKF chưa?". Đọc
  toàn văn 4 concept của Bee OKF Profile (`upstreams/beegog/docs/knowledge/
  areas/okf-profile/`: `overview.md`, `concept-model-and-authoring.md` 385
  dòng, `conformance-check.md`, `context-and-promote.md`) + `src/report/
  frontmatter.mjs` của fgOS + kiểm tra `docs/distillery/comparison-matrix.md`
  và `deep-dives/fgos-capture-gaps-vs-bee.md` (xác nhận: OKF CHƯA từng
  được distill vào fgOS — vùng chưa khai thác, không phải đã bàn rồi).

  **Trả lời câu hỏi: mới ứng dụng lớp NÔNG nhất.** Đối chiếu thật:

  | Bee OKF Profile | fgOS hôm nay | Khoảng cách |
  |---|---|---|
  | Codec frontmatter emitter-first + canonical round-trip guard (`not_canonical` bắt file sửa tay còn parse được nhưng re-emit không khớp byte) | `frontmatter.mjs` — codec phẳng, hand-rolled, không nested, KHÔNG có khái niệm canonical | Đã port hình dáng, chưa port bảo đảm |
  | Vocabulary 9 type ĐÓNG + luật cấm type thứ 10 | 4 quadrant Diataxis đóng cứng trong `DIATAXIS_DOC_TYPES` | Khác trục, xem §3 điểm A |
  | `bee knowledge check` 2 tầng (OKF error / profile error / profile warning), 7+2+6 mã lỗi có tên, chain-failing | KHÔNG có checker nào | Thiếu hoàn toàn |
  | `authoritative_for` duy-nhất-theo-chủ-đề + anti-fork gate 3 tầng (so khớp skeleton chuẩn hoá NFKC/confusable-fold, fail-closed, backstop toàn bundle) | grow-vs-create chỉ bằng `fs.existsSync` | Thiếu hoàn toàn |
  | `context --work --budget` trả MANIFEST (không nội dung), xếp hạng IDF, có floor/conservation/zero-signal guard | KHÔNG có | Thiếu hoàn toàn |
  | `promote` ĐỀ XUẤT, không bao giờ ghi (`writes: []`) | `compound` GHI thẳng (viết doc + commit + tag) | **Triết lý ngược nhau** |

  **Phát hiện 1 — OKF trả lời câu hỏi "bao nhiêu loại" bằng ĐÓNG, không
  phải registry mở.** Luật nguyên văn: vocabulary đóng ở 9 type, "không
  bao giờ thêm type thứ 10 để mã hoá một phân biệt vốn nhét vừa vào field
  của một type đã có" — ví dụ chuẩn đang chạy: pitfall KHÔNG thành type
  riêng, nó là `bee.polarity: practice|pitfall` bên trong `bee.pattern`,
  vì pattern và pitfall mang metadata giống hệt và được tiêu thụ giống
  hệt. Đây là bằng chứng NGƯỢC lại đề xuất "registry mở-rộng-được" của
  vòng 1. Nhưng OKF vẫn để MỞ phần dữ liệu (`areas`, `authoritative_for`,
  `tags` là free-text) — mô hình thật là **vocabulary cấu trúc ĐÓNG +
  dữ liệu chủ đề MỞ**, không phải chọn một trong hai.

  **Phát hiện 2 — 9 type và 4 quadrant là HAI TRỤC VUÔNG GÓC, không phải
  hai danh sách cạnh tranh.** Diataxis phân theo mục đích người đọc
  (học/làm/tra/hiểu); OKF phân theo vai trò trong dòng công việc
  (area/feature/work-item/plan/delivery/decision/pattern/runbook/evidence).
  Một tài liệu có cả hai thuộc tính cùng lúc. Vì vậy câu hỏi lõi của
  `tsk-28x` KHÔNG phải "mở hay đóng" mà là **"loại mới nằm trên trục
  nào"** — viết lại thành §3 điểm A. Đáng chú ý: cả 9 type OKF lẫn 4
  quadrant Diataxis đều KHÔNG chứa changelog lẫn marketing-storytelling,
  nên không copy nguyên si danh sách nào được.

  **Phát hiện 3 — tầm nhìn của chủ sản phẩm khớp `promote` hơn khớp
  `compound`.** `promote` trả đúng 3 mục: (a) bản nháp delivery, (b) gạch
  đầu dòng cập nhật area, (c) ứng viên pattern/pitfall — mọi dòng trích
  nguyên văn từ cell trace đã capped, không bịa, và KHÔNG GHI gì cả. Chữ
  của chủ sản phẩm — "hệ thống sẽ ghi nhận chi tiết, chất liệu, PHÁT HIỆN
  các ý tưởng kể chuyện" — đọc gần với "đề xuất ứng viên cho người duyệt"
  hơn là "tự động viết ra bài marketing". Nếu đúng vậy thì
  marketing-storytelling là MỤC ĐỀ XUẤT THỨ TƯ của promote, không phải
  quadrant/type mới của compound. Lý do OKF đưa ra cho luật này đáng
  trích: "một đề xuất tự ghi mình vào bundle sẽ đến với dáng vẻ tri thức
  đã được biên tập và được tin ngay, mà chưa ai phán xét nó."

  **Phát hiện 4 — bài học quy mô đã được ĐO, không phải suy đoán (B6b).**
  Luật gốc "đưa mọi critical pattern vào context" viết khi có 3 pattern;
  tới 49 pattern nó lật ngược: 40/45 mục manifest là critical pattern,
  ngốn 13.000/19.726 token, phần lớn không liên quan, 7 mục liên quan bị
  cắt vì hết chỗ — công cụ sinh ra để chống lãng phí context trở thành
  nguồn lãng phí lớn nhất. Tín hiệu liên quan được CHỌN BẰNG ĐO: tag
  overlap bị loại (AUC 0.550, 48/49 hoà 0 điểm), `areas` overlap 0.500
  (đúng bằng tung đồng xu), bản ship là IDF-weighted vocabulary coverage
  (AUC 0.805). Liên hệ trực tiếp fgOS: `findAllSourceCaptureIds` gom MỌI
  capture theo `docPath` sẽ phình đúng kiểu đó khi số item tăng — hiện
  chưa có ranking, floor, hay guard nào.

## 6. Thiết kế đã chốt {#design}

(chưa viết — chờ §3's câu hỏi mở được trả lời trước khi tổng hợp)

## 7. Danh mục hạng mục / task {#tasks}

(chưa chia — chờ §6)
