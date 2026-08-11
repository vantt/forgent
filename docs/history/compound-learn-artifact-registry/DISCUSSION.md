# Extensible multi-audience artifact-producer registry for compound-learn — Discussion

## 1. Trạng thái hiện tại

Vòng 4. Chủ sản phẩm chặn việc chốt vội, yêu cầu đánh giá lại chính mô
hình 5 pha vòng 3 phác ra. Session đo dữ liệu thật rồi tự phê bình, kết
quả: **rút lại một khẳng định của vòng 3** (`friction` KHÔNG phải chất
liệu kể chuyện — 92% là telemetry máy; vòng 3 suy rộng từ một bản ghi
duy nhất), và **bác phần lớn đường ống 5 pha** (4 lỗi: cửa gác chặn thay
vì trạng thái `draft`; triage cần quần thể nhưng vòng lặp chạy từng item;
gộp nhầm artifact cơ học với artifact phán đoán; quy mô kiến trúc lệch
quy mô vấn đề gốc). Số đo chặn lại quyết định: **54 item đang đứng ở
`retrospective`** — hàng đợi thật, nên mọi phương án thêm bước per-item
đều đi ngược. §6.4 viết lại thành 5 ràng buộc + 4 phương án.

Vòng 6. Chấm lại §6.4 cho **nửa storytelling**: bảng bốn phương án co còn
**một** — Làn B của phương án 2 (quét theo lô, xếp hạng trên quần thể, đẻ
ứng viên `draft`, curate bất đồng bộ, kèm doctor check canh chính nó).
Ba phương án kia tự loại chứ không bị chấm thua. **R1 sụp** (hàng đợi 54
là tồn đọng chứ không phải trần — đo lại còn 2, riêng 07-08 đẩy 86 item
qua `cleanup`), gộp vào R6. Kết luận **chưa mint**, chờ xác nhận. Nửa
changelog vẫn chờ số đo tỉ lệ quên (`tsk-12m` đang park `awaiting-human`).

*Vòng 5 (giữ lại để đối chiếu):* Phép thử Cách 1 (`tsk-1hy`) **đã chạy thật và merge** — trả lời
xong câu hỏi của nó: vỉa chất liệu **dùng được nhưng mật độ không đều**,
kèm ứng viên tín hiệu xếp hạng đầu tiên có căn cứ (round-count trên mỗi
item). Đồng thời đo được một thí nghiệm tự nhiên chưa ai để ý: bước
hậu-kỳ dựa vào "có người nhớ" đang hỏng ở **32%** (`docs/enduser-docs-
index.json` thiếu 70/220 tài liệu, không doctor check nào canh) — thành
ràng buộc R6 ở §6.4. Hệ quả lớn nhất: **§6.4 giờ trả lời được TỪNG NỬA**
— nửa storytelling đã có chứng cứ, nửa changelog còn chờ `tsk-3ip`.

Đứng vững: D-tsk28x-1 (hai trục), nguyên tắc tách-theo-giai-đoạn, và
toàn bộ 6 ràng buộc R1-R6. Còn mở: chọn phương án cho nửa storytelling
(giờ đã đủ chứng cứ để chọn), hai trục có cần cùng lúc không, ranh giới
scope `tsk-28x`/`tsk-12m`, va giữa D-tsk12m-B với mô hình mới, và một câu
mới — có gộp doctor check cho index drift vào `tsk-3ip` hay tách riêng.

## 2. Mục tiêu & đề bài

Chủ sản phẩm coi compound-learn (bước `fgos-coding-compounding` chạy khi item ở
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
`fgos-coding-compounding` cấm thẳng việc bịa quadrant thứ 5).

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Không đụng 4 quadrant Diataxis hiện có | RÕ | Hard rule `fgos-coding-compounding` SKILL.md, xác nhận lại từ discussion `tsk-12m` |
| 2 | Tiền lệ registry mở-rộng-được đã chạy thật trong repo | RÕ, nhưng KHÔNG còn là tiền lệ phù hợp nhất | `registerCheck`/`registerFix` (`src/setup/registrations.mjs:64/85/110`) là registry cho FUNCTION máy tự chạy. Phân loại tài liệu không phải chuyện đó — Bee OKF Profile mới là tiền lệ đúng ngành, và nó chọn NGƯỢC lại (vocabulary đóng). Xem §5 vòng 2 |
| 3 | fgOS mới port lớp nông nhất của OKF | RÕ (scout vòng 2) | Có: `frontmatter.mjs` (codec phẳng, không nested), `fgos docs-index`. KHÔNG có: checker 2 tầng, `authoritative_for`/anti-fork, `context --budget`, `promote`. Bảng đối chiếu đầy đủ ở §5 |
| A | **Trục nào?** | **D-tsk28x-1** (vòng 3) | Hai trục, bắt buộc, hiện fgOS mới có một. Diataxis = trục TRẠNG THÁI NHẬN THỨC người đọc; OKF 9-type = trục DANH TÍNH (tài liệu này LÀ gì, của ai, về vấn đề gì). Vuông góc, một tài liệu mang cả hai nhãn |
| B | Đóng hay mở | **TRẢ LỜI V3** (chưa D-ID) — giải bởi chữ `struggle` | `struggle` KHÔNG nằm trong 4 quadrant Diataxis (Diataxis dựng từ 2 chiều hành-động/nhận-thức × tiếp-thu/vận-dụng, ra đúng 4 ô, không ô nào là struggle). Suy ra: trục trạng-thái-nhận-thức là trục TỔNG QUÁT, Diataxis chỉ là MỘT PROFILE của trục đó (profile cho tài liệu kỹ thuật); marketing có profile riêng trên cùng trục, `struggle` là một trạng thái trong đó. **Trục MỞ (thêm profile mới được) + mỗi profile ĐÓNG (Diataxis mãi đúng 4)** — chính là kiến trúc OKF v0.1 (lỏng) + Bee Profile (đóng) đã dùng. Không phải chọn một trong hai |
| C | **GHI hay ĐỀ XUẤT** | **TRẢ LỜI V3** (chưa D-ID) — câu hỏi vòng 2 đặt SAI | Không chọn một cho cả hệ thống — tách theo GIAI ĐOẠN. **Thu chất liệu: ghi thẳng, liên tục, không bao giờ dừng để hỏi** (ràng buộc chủ sản phẩm đặt: nhanh, rẻ, ít token, không cắt ngang luồng làm việc khác — loại thẳng mọi phương án gọi LLM phân loại ngay lúc capture). **Tổng hợp: nhiều pha, có triage nổi ứng viên, có người duyệt.** Lý do OKF sợ tự-ghi chỉ áp cho TÀI LIỆU (giả vờ là kết luận đã biên tập), không áp cho CHẤT LIỆU THÔ (chỉ ghi "đã xảy ra chuyện này"). Cửa gác đặt đúng chỗ chất liệu biến thành khẳng định |
| D | Ai giữ "một chủ đề một chủ sở hữu" khi số tài liệu tăng | CHƯA RÕ (chưa bàn vòng 3) | `fgos-coding-compounding` phát hiện grow-vs-create CHỈ bằng `fs.existsSync`. Không có khái niệm chủ-sở-hữu-chủ-đề. OKF trả lời bằng `authoritative_for` + anti-fork gate 3 tầng (sau khi judge độc lập phá bản 1 tầng bằng 4 cách trong một buổi). Càng nhiều profile/audience thì rủi ro 2 tài liệu cùng chủ đề càng cao — port cùng lúc hay để riêng? |
| E | Ranh giới scope `tsk-28x` vs `tsk-12m` | CHƯA RÕ, đã đổi bản chất so với vòng 1-2 | Vòng 1 hỏi "thứ tự nào trước". Vòng 3 đổi câu hỏi: đường ống 5 pha (§6) rõ ràng lớn hơn cả hai item cộng lại. Cần cắt lại: pha nào thuộc `tsk-12m`, pha nào `tsk-28x`, pha nào là item mới chưa tồn tại. `deps: [tsk-12m]` đặt lúc submit có thể không còn đúng. **Bổ sung 2026-08-09:** `tsk-12m` vòng 4 tìm ra ranh giới **quan sát/nhắc vs quyết/viết/chặn** (`docs/history/automated-changelog-compound-learn/DISCUSSION.md` §6.1) — loại quan sát/nhắc độc lập hoàn toàn với câu hỏi §6.4 ở đây và **sống sót qua mọi phương án**, nên làm được ngay. Kèm đính chính: số đo từ nửa changelog KHÔNG mở khoá nửa storytelling — nửa đó cần phép thử riêng (Cách 1), hai phép thử chạy song song được, không tuần tự |
| F | Hình dạng pha TRIAGE (pha 1, §6) | ĐỠ MỜ sau vòng 5 — xem J2 | Pha triage phải chấm điểm ứng viên. Bài học B6b (§5 vòng 2): tín hiệu xếp hạng phải chọn BẰNG ĐO, không bằng trực giác — trùng tag đo ra AUC 0.550 (≈ tung đồng xu), `areas` 0.500 (đúng bằng tung đồng xu). **Vòng 5 có ứng viên đầu có căn cứ: round-count trên mỗi item (J2).** Còn mở: đo nó bằng bộ nhãn nào — fgOS vẫn chưa có tập nhãn tay như bee đã có, nên chưa chạy được phép đo AUC tương đương |
| G | ~~Chất liệu `struggle` đã có sẵn trong `friction`~~ | **RÚT LẠI — SAI** (đo lại vòng 4) | Vòng 3 kết luận "RÕ" từ ĐÚNG MỘT bản ghi (`tsk-1gn`) rồi suy rộng ra cả hệ thống. Đo toàn log: 131 friction = 81 `verify-miss` + 39 `merge-conflict` (92% telemetry máy), `detail` điển hình `goal-check failed on branch "fgw/tsk-puz" (exit null)` — ghi RẰNG hỏng, không ghi ĐÃ THỬ GÌ / VÌ SAO / CHỖ NGOẶT. Không phải chất liệu kể chuyện. Thứ làm vòng 3 phấn khích thực ra là `gates.askHistory`, KHÁC `friction` — vòng 3 lẫn hai thứ |
| G2 | Vỉa chất liệu thật nằm ở đâu | RÕ (đo vòng 4) | (a) **375 event mang question/ask** — tranh cãi thật, văn bản thật, ví dụ "vòng 2 (kiểm tra độc lập) không đồng ý: ..."; (b) **715 rationale xuất hiện đúng một lần** trong tổng 1583 decision. Đây là vỉa, không phải `friction` |
| H | Tỉ lệ nhiễu đã ở mức nguy hiểm NGAY HÔM NAY | RÕ (đo vòng 4) | 1583 decision nhưng chỉ **765 rationale riêng biệt**. Khuôn mẫu đo được: `x321` "caller-supplied verdict…", `x132` rỗng, `x96`, `x82` "see CONTEXT.md", `x38` → **~42% là khuôn mẫu/con trỏ, không phải nội dung**. Nghĩa là bài học B6b (không bao giờ "gom hết", phải xếp hạng) KHÔNG phải rủi ro tương lai của fgOS — nó là hiện trạng |
| J | **Vỉa chất liệu có thật sự dùng được không** | **RÕ — phép thử `tsk-1hy` đã chạy thật (2026-08-09)** | **Dùng được, nhưng mật độ KHÔNG ĐỀU.** 10119 event → vỉa (a) 314 ask event trên ~230 item; vỉa (b) 778 rationale singleton sau lọc. Tìm được arc thật, trích nguyên văn: `tsk-19j` (15 entry, 3 ngày) có khoảnh khắc ngoặt tự-nhận-ra đóng một câu hỏi mở; `tsk-1ca` (25 entry) có quyết định người bẻ lái giữa chừng + một khoảnh khắc session tự kìm trước rủi ro git-surgery. Báo cáo đầy đủ: `reports/tsk-1hy-storytelling-material-probe-report.md` |
| J2 | Tín hiệu xếp hạng ứng viên — câu trả lời SƠ BỘ cho dòng F | RÕ (phép thử `tsk-1hy`) | **Số vòng trên mỗi item** (round-count). Arc thật tập trung ở item có nhiều entry theo ngày; item một-hai entry gần như không mang chuyện. Đến từ dữ liệu, không phải trực giác — đúng kỷ luật B6b. CHƯA đo bằng AUC (fgOS vẫn chưa có bộ nhãn tay), nên đây là ứng viên có căn cứ, chưa phải tín hiệu đã chứng minh |
| J3 | Vỉa (a) còn TẦNG KHUÔN MẪU THỨ HAI chưa lọc | RÕ (phép thử `tsk-1hy`) | Ngoài 4 khuôn mẫu của decision-rationale đã lọc, vỉa ask còn khuôn mẫu riêng: `"Không phán được rõ ràng — cần người xác nhận thủ công."`, `"Đề xuất: không chia (pass-through) — Item gốc có risk cao (heavy)..."` (lặp 4 lần nguyên văn trong CÙNG một item). Thiết kế nào đọc thẳng vỉa (a) phải lọc thêm tầng này |
| K | **Bước hậu-kỳ dựa vào "có người nhớ" đang hỏng ở 32%** | **RÕ (đo 2026-08-09) — thí nghiệm tự nhiên, miễn phí** | 220 tài liệu end-user trên đĩa (`how-to`/`explanation`/`reference`/`decisions`), 151 có trong `docs/enduser-docs-index.json`, **70 thiếu = 32%**; 0 mục ma (index đúng nguyên vẹn, chỉ TỤT LẠI). Có hẳn skill `fgos-indexing` mà nhiệm vụ duy nhất là regenerate index sau mỗi lần compound-learn ghi doc — không được chạy. 6 doctor check đang đăng ký (`config-not-stale`, `main-checkout-hook-wired`, `node-version-and-git`, `root-drift`, `shell-integration-sourced`, `tool-registry-configured`), **không cái nào canh chuyện này**. Đây KHÔNG còn là rủi ro giả định: nó là tỉ lệ hỏng đã đo, trong đúng subsystem này |
| I | Hàng đợi tổng hợp đã tồn tại thật | RÕ (đo vòng 4) | **54 item đứng ở `retrospective`**, 16 `delivered`, 99 `cleanup`, 166 `done` / tổng 435. Đọc ngược: tổng hợp hiện đắt và làm theo TỪNG ITEM (phán đoán LLM + viết doc + commit mỗi item) — hàng đợi 54 chính là bằng chứng thiết kế per-item hiện tại đã không co giãn nổi. Hệ quả trực tiếp: mọi phương án THÊM pha vào mỗi item đều đi ngược, gồm cả đường ống 5 pha ở §6 |

## 4. Quyết định đã chốt

| D-ID | Tóm tắt | Ghi chú |
|---|---|---|
| D-tsk28x-1 | Phân loại tài liệu cần HAI trục vuông góc, không phải một danh sách dài hơn: trục trạng-thái-nhận-thức (Diataxis là một profile của nó) + trục danh tính (LÀ gì, của ai, về vấn đề gì) | Nêu vòng 2 (scout OKF), chủ sản phẩm xác nhận + làm sắc vòng 3, không bị sửa. Ghi qua `fgos decision --id tsk-28x` seq 9180 |

## 5. Q&A log

- **2026-08-07** — Khởi tạo từ điểm E của `tsk-12m`'s discussion, theo
  yêu cầu chủ sản phẩm "chuyển sang coding-shape để bàn". Submit `tsk-28x`
  (`deps: [tsk-12m]`, dependency candidate `tsk-12m` được xác nhận bởi
  chủ sản phẩm trước khi submit). Scout tái sử dụng từ discussion
  `tsk-12m`: `src/setup/registrations.mjs:64/85/110` (tiền lệ registry),
  `.claude/skills/fgos-coding-compounding/SKILL.md` (hard rule không bịa
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

- **2026-08-07 (vòng 3)** — Chủ sản phẩm trả lời cả 4 phát hiện vòng 2.

  **(1) Câu "GHI hay ĐỀ XUẤT" của vòng 2 là câu hỏi SAI.** Nguyên văn:
  ghi thẳng liên tục (raw material) thì nên làm luôn, liên tục, không cần
  hỏi; việc ghi nhận chất liệu và các vấn đề tốt nhất không nên dừng lại
  để hỏi; quan trọng là ghi sao cho nhanh, đỡ tốn kém, đỡ tốn token và
  không ảnh hưởng tới luồng làm việc khác. Phần đề xuất thì **dịch chuyển
  xuống khâu tổng hợp** — khâu đó có thể mở ra nhiều giai đoạn, trong đó
  chạy triage trước để xác định và gợi ý các ý tưởng hay, và **khi này con
  người có mặt để duyệt**. Tức tách theo GIAI ĐOẠN, không chọn một cho cả
  hệ thống. Phân tích thêm (session): nỗi sợ của OKF ("tài liệu tự viết ra
  trông như tri thức đã biên tập nên được tin mà chưa ai phán xét") chỉ áp
  cho TÀI LIỆU, không áp cho CHẤT LIỆU THÔ — chất liệu thô không giả vờ là
  kết luận, nó chỉ ghi "đã xảy ra chuyện này". Cửa gác vì vậy thuộc đúng
  chỗ chất liệu biến thành khẳng định.

  **(2) Hai trục là đương nhiên, chỉ chưa triển khai** — chủ sản phẩm xác
  nhận. Và nêu thêm: với marketing-story, trục Diataxis còn giúp neo chất
  liệu vào một vùng trạng thái nhận thức quan trọng là `struggle`. Session
  kiểm lại: **`struggle` KHÔNG nằm trong 4 quadrant Diataxis** — Diataxis
  dựng từ 2 chiều (hành động/nhận thức × tiếp thu/vận dụng) ra đúng 4 ô,
  không ô nào là struggle. Suy ra kết luận mạnh hơn cả hai bên vừa nói:
  trục trạng-thái-nhận-thức là trục TỔNG QUÁT, **Diataxis chỉ là một
  PROFILE của trục đó** cho miền tài liệu kỹ thuật; marketing có profile
  riêng trên cùng trục ấy. Đây đúng là kiến trúc OKF đã dùng (OKF v0.1 cố
  ý lỏng — chỉ bắt buộc `type`; Bee OKF Profile là lớp ĐÓNG dựng trên nó
  cho một miền) — và nó giải xong câu "đóng hay mở" treo từ vòng 1:
  **trục mở, mỗi profile đóng.**

  Kiểm tra thêm trong vòng này: chất liệu cho `struggle` **fgOS đã thu
  rồi, chưa ai dùng**. Bản ghi thật `tsk-1gn` mang `friction` (`errorClass:
  verify-miss`, `layer: verification`, `disposition: blocked`),
  `gates.askHistory` giữ nguyên văn một tranh cãi thật giữa hai vòng kiểm
  tra, `outcome.actual.attempts`. Hiện chỉ được dùng làm tín hiệu entropy
  (`src/report/entropy.mjs`). Nghĩa là tầm nhìn marketing-storytelling
  không cần cơ chế THU mới — cần cơ chế KHAI THÁC.

  **(3) Chủ sản phẩm xác nhận hướng `promote`, và mô tả lại mental model
  của mình**: hệ thống đang ghi nhận chất liệu xuyên suốt quá trình làm
  việc — đó là một công việc trong component `compound-engineering/learning`
  của fgOS; `compound` ở giai đoạn retro là việc trích lọc và xây dựng tài
  liệu. Câu hỏi đặt ra: promote diễn ra như thế nào — lúc chạy compound
  thì hỏi promote, hay promote hỏi trước rồi ok mới collect? Trả lời
  (session): **không phải cái nào** — phần collect đã xong từ pha 0 rồi.
  Promote không hỏi gì; nó đọc cái đã thu và in ra đề xuất. Việc hỏi nằm ở
  pha duyệt, và hỏi về BẢN NHÁP, không phải về chất liệu thô. Đường ống 5
  pha viết ở §6.

  **(4) Bài học B6b là bắt buộc phải học** — chủ sản phẩm đọc nó thành
  "ghi bài học tách ra khỏi CONTEXT". Session bổ sung phần còn thiếu: đó
  mới là bước MỘT (bee cũng làm đúng bước đó: `critical-patterns.md` →
  thư mục `patterns/`, mỗi bài học một concept địa chỉ hoá được). Bài học
  thật của B6b xảy ra SAU bước đó: khi đã tách ra 49 mảnh, luật "nạp hết"
  vỡ — tách nhỏ không giải quyết gì nếu khâu LẤY RA vẫn là "lấy tất". Đủ
  bộ là ba bước: (1) tách thành đơn vị riêng, (2) xếp hạng khi lấy ra,
  không bao giờ nạp hết, (3) chọn tín hiệu xếp hạng bằng ĐO. Với fgOS,
  bước 2+3 chính là pha TRIAGE ở §6, không phải việc khác.

- **2026-08-07 (vòng 4 — chủ sản phẩm chặn việc chốt vội, yêu cầu đánh giá
  lại chính mô hình 5 pha)** — Nguyên văn: "khoan quyết này quyết kia,
  quay lại thông tin của anh về các pha, suy nghĩ và đánh giá thật kỹ xem
  có hợp lý không đã, cách tiếp cận có đúng chưa, có cách tiếp cận cụ thể
  nào không. thảo luận trước rồi mới chốt chứ." Session đo dữ liệu thật
  trước khi tự phê bình.

  **(a) RÚT LẠI một khẳng định của vòng 3.** Xem §3 dòng G. `friction`
  không phải chất liệu kể chuyện — 92% là telemetry máy. Vòng 3 suy rộng
  từ một bản ghi duy nhất. Vỉa thật là ask/tranh cãi (375 event) và
  rationale-xuất-hiện-một-lần (715/1583). Ghi lại chỗ sai này tường minh
  vì nó là lý do vòng 4 hạ độ tin vào mọi kết luận chưa-đo-được khác.

  **(b) Bốn lỗi của đường ống 5 pha (§6), tìm ra khi soi lại:**

  1. **Cửa gác CHẶN, trong khi thứ chủ sản phẩm yêu cầu là QUYỀN QUYẾT
     ĐỊNH.** Vòng 3 dịch "người có mặt để duyệt" thành cửa chặn đường ống.
     Có cách đạt đúng mục đích mà không chặn: **trạng thái `draft`** —
     tổng hợp cứ chạy cứ ghi, nhưng ghi ra dạng nháp; người nâng nháp lên
     chính thức lúc nào tuỳ họ. Không ai bị chặn, không gì được tin cho
     tới khi có người gật. bee làm đúng vậy (`lifecycle: draft|active|
     superseded|archived`; ứng viên pattern của `promote` ra đời với
     `draft`) — vòng 2 đã đọc qua mà bỏ sót.
  2. **Triage cần QUẦN THỂ, vòng lặp lại chạy TỪNG ITEM.** `retro-next`
     bốc một item theo FIFO; không xếp hạng được quần thể một phần tử.
     "Xác định và gợi ý các ý tưởng hay" vốn là việc nhìn ngang nhiều
     item. Nên triage là một LƯỢT QUÉT trên pool, một verb khác hẳn —
     không phải một bước trong vòng lặp per-item như sơ đồ §6 vẽ.
  3. **Gộp nhầm hai loại sản phẩm rất khác.** Changelog/bản ghi delivery:
     đơn vị = từng item, gần như cơ học, không cần xếp hạng, gần như
     không cần người. Pattern/câu chuyện: đơn vị = nhiều item, nặng phán
     đoán, cần xếp hạng, cần người. Ép một ống lên cả hai làm changelog
     quá nặng và câu chuyện quá nông. bee cũng tách hai thứ này (`promote`
     per-item; `context` mới là cái xếp hạng trên quần thể) — vòng 2 đã bê
     bài học ranking của `context` gắn nhầm vào luồng per-item.
  4. **Quy mô kiến trúc lệch quy mô vấn đề gốc.** Vấn đề khởi phát là
     thiếu `CHANGELOG.md` + version đứng yên 0.1.0 — lỗ hổng nhỏ, cơ học.
     Đáp lại bằng kiến trúc 5 pha là ngược ưu tiên số 1 (Ship Faster,
     AGENTS.md).

  **(c) Bốn cách tiếp cận cụ thể, đặt cạnh nhau** — xem §6.4 (viết lại).

  **(d) Tự soi D-tsk28x-1 (hai trục) — mô hình đúng, giả định triển khai
  thì chưa kiểm.** Áp lên ba ca thật: (1) doc how-to đang có — trục danh
  tính chưa gánh gì cả, mọi doc hiện có sẽ nhận cùng một danh tính (cờ đỏ
  YAGNI: trục này chỉ chịu lực khi đã có nhiều danh tính); (2) changelog —
  có thể chỉ là `{nhận thức: reference, danh tính: changelog}`, tức KHÔNG
  cần trạng thái nhận thức mới, chỉ cần danh tính mới; (3) marketing story
  — ca duy nhất cần cả hai trục mới. Suy ra hai trục **không nhất thiết
  cần đến cùng lúc**, và cái nào trước phụ thuộc làm changelog hay story
  trước. D-tsk28x-1 giữ nguyên (mô hình vẫn đúng), nhưng giả định ngầm
  "triển khai cả hai cùng lúc" bị gỡ ra thành câu hỏi riêng. Ngoài ra
  chưa ai tính **chi phí retro-fit toàn bộ doc đang có** khi áp trục danh
  tính — vòng 2 và 3 đều không nêu.

  **(e) Thiên hướng của session (chưa phải đề xuất chốt):** làm Cách 1
  (mặt đọc, không đường ống) trước — rẻ, không cam kết gì, và nó trả lời
  đúng câu hỏi mà vòng 4 vừa chứng minh là session đoán sai (vật liệu có
  thật sự dùng được không). Quyết Làn A/Làn B sau, dựa trên cái nhìn thấy
  thật. Chủ sản phẩm chưa trả lời.

- **2026-08-09 (vòng 5)** — Cách 1 đã được submit thành `tsk-1hy`, **chạy
  thật và đã merge** (`delivered`). Kèm một phát hiện đo được, ngoài dự
  kiến, trong lúc soát các câu hỏi còn mở.

  **(a) Phép thử trả lời xong câu hỏi của chính nó — xem §3 dòng J/J2/J3.**
  Vật liệu dùng được, mật độ không đều; tín hiệu xếp hạng có ứng viên đầu
  tiên có căn cứ (round-count); vỉa ask còn một tầng khuôn mẫu thứ hai
  chưa lọc.

  **(b) Đính chính một câu trong chính báo cáo phép thử.** Báo cáo viết
  kết quả "không xác nhận cả khẳng định quá rộng của vòng 3 lẫn việc rút
  lại toàn phần của vòng 4". Không chính xác, và phải sửa ở đây kẻo phiên
  sau tin nhầm: vòng 4 **chỉ** rút lại khẳng định về `friction` (§3 dòng
  G), đồng thời chỉ đúng vỉa thật là **ask + rationale singleton** (dòng
  G2). Phép thử soi đúng hai vỉa G2 đã chỉ ra và xác nhận chúng tốt — tức
  **XÁC NHẬN vòng 4**, không bác. Không có "rút lại toàn phần" nào để bác
  cả. Điều phép thử thật sự thêm vào là chiều *mật độ không đều*, thứ cả
  vòng 3 lẫn vòng 4 đều chưa nói tới.

  **(c) Phát hiện mới: bước hậu-kỳ dựa vào "có người nhớ" đang hỏng ở
  32%** — §3 dòng K. Ý nghĩa với discussion này: ta đang tranh luận "ghi
  thẳng thì có ai gác không" bằng suy luận, trong khi **fgOS đã vô tình
  chạy đúng thí nghiệm đó rồi** và kết quả là 32%. Ba hệ quả: (1) luận
  điểm của `tsk-3ip` (quan sát/nhắc vì người quên) tổng quát hơn phạm vi
  changelog, vừa được xác nhận bằng một ca độc lập đã xảy ra; (2) mọi
  phương án §6.4 thêm một bước "nhớ chạy" nữa phải trả lời được vì sao nó
  sẽ không tụt như bước này — đã thành ràng buộc R6; (3) đây là **mẫu đo
  thứ hai**, trước đó chỉ có changelog (0%, vì chưa từng có file).

  **(d) Mỉa mai đáng ghi, và là bằng chứng bổ sung cho chính (c):** kết
  quả phép thử `tsk-1hy` nằm trong `reports/`, còn phát hiện 32% ban đầu
  chỉ được nói miệng — cả hai đứng đúng vị trí "chờ ai đó nhớ gấp vào chỗ
  cần". Vòng 5 này chính là thao tác gấp đó, làm bằng tay.

  **(e) Câu hỏi phương án §6.4 vừa được mở khoá MỘT NỬA.** Nửa
  storytelling giờ có bằng chứng (vật liệu dùng được + ứng viên tín hiệu
  xếp hạng). Nửa changelog vẫn chưa (chờ `tsk-3ip` đo tỉ lệ quên). Đúng
  như lỗi 3 của vòng 4 đã tách: hai loại artifact, hai nguồn chứng cứ,
  không đi cùng nhịp — nên §6.4 **có thể được trả lời từng nửa**, không
  phải chờ chốt một lượt.

- **2026-08-10 (vòng 6 — chấm lại §6.4 cho nửa storytelling)** — Chứng cứ
  đã đủ (phép thử + R6 có tiền lệ), nên chấm. Hai kết quả.

  **(a) R1 SỤP, và cách nó sụp mới là điều đáng ghi.** R1 rút từ ảnh chụp
  "54 item đứng ở `retrospective`", suy ra ngầm rằng tổng hợp per-item
  không co giãn nổi. Đo lại hai ngày sau: `retrospective` còn **2**,
  `done` 229 (từ 166), tổng 518 item (từ 435); nhật ký cho thấy riêng
  2026-08-07 đẩy **86 item** qua `cleanup`. Hàng đợi 54 là **tồn đọng**,
  không phải trần — nó là khoảnh khắc chưa ai chạy vòng lặp, tức **cùng
  gốc với R6**, không phải ràng buộc riêng. Gạch R1, gộp vào R6, giữ
  nguyên dòng cũ để thấy lịch sử.

  Đây là **lần thứ hai** trong thảo luận này một kết luận rút từ MỘT ảnh
  chụp bị dữ liệu-theo-thời-gian bác (lần đầu: `friction`, §3 dòng G).
  Bài học lặp lại đủ hai lần để đáng thành nguyên tắc làm việc: **một
  ảnh chụp không phân biệt được "trần năng lực" với "lúc chưa ai chạy" —
  phải nhìn chuỗi thời gian trước khi rút ràng buộc từ một con số.**

  **(b) Bảng bốn phương án co còn hai, rồi còn một.** Phương án 1 đã làm
  (`tsk-1hy`); phương án 4 không độc lập (bỏ cửa chặn để thoả R2 thì nó
  BIẾN THÀNH phương án 2); phương án 3 trượt R3 vì lý do đã đo — phép thử
  chứng minh tín hiệu nằm ở quần thể, mà 3 thì per-item. Còn **Làn B của
  phương án 2**. Bảng chấm chi tiết theo R2-R6 ở §6.4.

  Đáng chú ý: R6 từng là ràng buộc khó nhất, cấm trả lời bằng lời hứa
  ("sẽ có kỷ luật" không tính). Trong đúng một ngày nó có **hai tiền lệ
  chạy thật**: `tsk-3ip` đăng ký `changelog-unreleased-stale`, `tsk-1m0`
  đăng ký `enduser-docs-index-stale` (hiện FAIL đúng như thiết kế: "85/237
  tài liệu end-user chưa có trong index"). Doctor giờ 14 check. Câu trả
  lời cho R6 không còn là hứa hẹn.

  **(c) Chưa mint D-ID.** Kết luận Làn B mới qua một vòng; chờ xác nhận.
  Ba điều còn chưa chắc ghi ở cuối §6.4 — round-count mới là ứng viên
  chưa đo, tầng khuôn mẫu thứ hai chưa lọc, chi phí curate chưa ước.

## 6. Thiết kế đã chốt {#design}

**Tái sinh vòng 4.** Chỉ D-tsk28x-1 đã chốt thật. §6.1-6.3 giữ nguyên từ
vòng 3 (vẫn đứng vững). **§6.4 bị vòng 4 bác phần lớn và đã viết lại** —
đường ống 5 pha của vòng 3 giờ là MỘT trong bốn phương án, không còn là
"thiết kế". Viết cho người đọc không có lịch sử hội thoại.

### 6.1 Vấn đề gốc: một trục gánh ba việc

fgOS hôm nay phân loại tài liệu người-dùng-cuối bằng đúng một trục —
bốn quadrant Diataxis (`tutorial` / `how-to` / `reference` / `explanation`,
đóng cứng trong `DIATAXIS_DOC_TYPES`, `src/state/store.mjs:846`). Trục đó
đang gánh ba việc cùng lúc: quyết định **cách viết**, quyết định **nơi
lưu** (hard rule của `fgos-coding-compounding`: không viết ra ngoài
`docs/<quadrant>/` khớp tag vừa lưu), và là **danh sách duy nhất** một tài
liệu có thể thuộc về.

Hệ quả: một loại tài liệu không phải là bốn trạng thái nhận thức đó thì
không có chỗ ngồi hợp lệ. Changelog không phải học/làm/tra/hiểu. Chất liệu
marketing cũng vậy. Cách duy nhất còn lại là bịa quadrant thứ năm — đúng
thứ hard rule của skill cấm thẳng, và cũng là category error thật vì
Diataxis vốn là khung bốn góc đóng.

### 6.2 Hai trục vuông góc (D-tsk28x-1)

Lời giải không phải kéo dài danh sách quadrant, mà tách ra hai trục độc
lập; một tài liệu mang nhãn trên cả hai:

- **Trục trạng thái nhận thức** — lúc đọc, trong đầu người đọc đang diễn
  ra gì. Trục này trả lời "viết thế nào".
- **Trục danh tính** — tài liệu này LÀ gì, thuộc về ai, nói về vấn đề gì.
  Trục này trả lời "đây là cái gì, của ai". Tiền lệ ngành: chín type đóng
  của Bee OKF Profile (`bee.area`, `bee.decision`, `bee.pattern`,
  `bee.evidence`, …) cộng `authoritative_for` (chủ sở hữu duy nhất của một
  chủ đề).

### 6.3 Trục mở, profile đóng

Trục trạng thái nhận thức là trục **tổng quát**; Diataxis chỉ là **một
profile** của nó — profile dành cho tài liệu kỹ thuật, gồm đúng bốn trạng
thái, đóng vĩnh viễn. Miền khác có profile riêng trên cùng trục ấy: chất
liệu marketing neo vào những trạng thái như `struggle` — một trạng thái
thật, và là trạng thái không tồn tại trong Diataxis (Diataxis dựng từ hai
chiều hành-động/nhận-thức × tiếp-thu/vận-dụng, ra đúng bốn ô).

Quy tắc rút ra: **trục MỞ (thêm profile mới được), mỗi profile ĐÓNG
(Diataxis mãi mãi đúng bốn, không bao giờ năm)**. Đây đúng là kiến trúc
OKF v0.1 (cố ý lỏng, chỉ bắt buộc `type`) cộng Bee OKF Profile (lớp đóng
dựng trên nó cho một miền) — không phải phát minh mới.

Kèm theo, mượn nguyên luật chống-phình của OKF: **không bao giờ thêm một
loại mới để mã hoá một phân biệt vốn nhét vừa vào field của loại đã có.**
Ví dụ đang chạy trong OKF: pitfall không thành type riêng, nó là
`polarity: practice|pitfall` bên trong type `pattern`, vì hai thứ mang
metadata giống hệt và được tiêu thụ giống hệt.

### 6.4 Tách theo giai đoạn — nguyên tắc đứng vững, đường ống thì không

**Phần đứng vững (vòng 3, vòng 4 không bác):** câu hỏi "hệ thống nên GHI
thẳng hay ĐỀ XUẤT cho người duyệt" là câu hỏi sai vì nó giả định một câu
trả lời cho toàn hệ thống. Tách theo giai đoạn: **thu chất liệu thì ghi
thẳng, không bao giờ hỏi; tổng hợp thì có chỗ cho phán xét của người.**
Cơ sở: nỗi lo "một đề xuất tự ghi mình vào kho sẽ trông như tri thức đã
biên tập và được tin dù chưa ai phán xét" chỉ đúng với **tài liệu** — thứ
giả vờ là kết luận. Không đúng với **chất liệu thô**, thứ chỉ tuyên bố
"đã xảy ra chuyện này".

**Phần bị bác (vòng 4):** vòng 3 hiện thực nguyên tắc trên thành một
đường ống 5 pha per-item có cửa gác chặn. Bốn lỗi, xem §5 vòng 4(b): cửa
gác chặn thay vì trạng thái `draft`; triage cần quần thể nhưng vòng lặp
chạy từng item; gộp nhầm hai loại sản phẩm khác nhau; quy mô kiến trúc
lệch quy mô vấn đề gốc. Số đo chặn lại: **54 item đang đứng ở
`retrospective`** — thêm pha vào mỗi item là đi ngược.

**Ràng buộc rút ra, dùng để chấm mọi phương án:**

- ~~R1 — không thêm bước per-item nào vào một hàng đợi đã 54.~~
  **SỤP (vòng 6, 2026-08-10) — gộp vào R6.** Tiền đề sai: hàng đợi 54
  không phải trần năng lực mà là **tồn đọng lúc chưa ai chạy vòng lặp**.
  Đo lại: `retrospective` còn **2** (từ 54), `done` 229 (từ 166), tổng
  item 518 (từ 435); riêng 2026-08-07 đẩy **86 item** qua `cleanup`. Mô
  hình per-item xử lý được 518 item. Cùng gốc với R6 (bước cần người
  chạy, có lúc không ai chạy) — không phải ràng buộc riêng. Giữ dòng này
  gạch ngang thay vì xoá: đây là lần THỨ HAI một kết luận rút từ MỘT ảnh
  chụp bị dữ liệu theo thời gian bác (lần đầu: `friction` là chất liệu
  kể chuyện, §3 dòng G).
- R2 — quyền quyết định của người phải đạt được **không bằng cửa chặn**
  (dùng trạng thái `draft`, hoặc curate bất đồng bộ).
- R3 — cái gì cần xếp hạng thì phải chạy trên **quần thể**, không nằm
  trong vòng lặp per-item.
- R4 — không bao giờ "gom hết": 42% decision hôm nay là khuôn mẫu (§3
  dòng H).
- R5 — artifact cơ học (changelog) và artifact phán đoán (pattern/câu
  chuyện) không dùng chung một đường.
- **R6 (vòng 5) — mọi phương án thêm một bước "nhớ chạy" phải trả lời
  được vì sao nó không tụt như bước đã tụt.** Không phải ràng buộc suy
  diễn: `fgos-indexing` là đúng một bước như vậy, và index đang thiếu
  **70/220 tài liệu = 32%** (§3 dòng K), không doctor check nào canh.
  Trả lời "sẽ có kỷ luật" không tính là trả lời — bước đang tụt cũng đã
  có kỷ luật bằng lời.

**Bốn phương án — chấm lại vòng 6, co còn hai:**

| # | Hình dạng | Trạng thái sau vòng 6 |
|---|---|---|
| 1 | **Chỉ mặt đọc** — verb/script truy vấn chất liệu đã có, không state mới, không gate | **ĐÃ LÀM RỒI** — chính là `tsk-1hy`, đã merge. Không còn là ứng viên; nó là phép thử đã hoàn thành, và kết quả của nó là đầu vào cho việc chấm này |
| 2 | **Hai làn tách theo chi phí phán đoán** — Làn A (cơ học, per-item, chạy thẳng): changelog. Làn B (phán đoán, quét theo lô): quét pool, xếp hạng, đẻ ứng viên dạng `draft`, người curate bất đồng bộ | **CÒN LẠI — ứng viên duy nhất cho nửa storytelling.** Làn A đã xong (`tsk-469` + `tsk-3ip`) |
| 3 | **Chỉ thêm `draft` vào compound hiện tại** | **LOẠI cho mục đích storytelling** — per-item, không xếp hạng trên quần thể. Nhưng phép thử đã đo: tín hiệu NẰM Ở QUẦN THỂ (arc tập trung ở item nhiều vòng — `tsk-19j` 15 entry, `tsk-1ca` 25 entry; item một-hai entry gần như rỗng). Trượt R3 vì lý do đã đo, không phải lý do lý thuyết. *Vẫn có thể hữu ích cho mục đích khác — chỉ loại cho storytelling* |
| 4 | **Đường ống 5 pha (bản vòng 3)** | **KHÔNG PHẢI LỰA CHỌN ĐỘC LẬP.** R1 sụp nên nó hết bị chặn bởi R1, nhưng R2 vẫn chặn (cửa gác chặn). Đổi cửa gác thành trạng thái `draft` để thoả R2 thì nó **biến thành đúng phương án 2**. Tức 4 = 2 + một cửa chặn không cần thiết |

**Chấm Làn B (phương án 2) theo R2-R6 — nửa storytelling:**

| Ràng buộc | Thoả? | Căn cứ |
|---|---|---|
| R2 — không cửa chặn | ✓ | Đẻ ứng viên dạng `draft`, người curate bất đồng bộ |
| R3 — xếp hạng trên quần thể | ✓ | Quét theo lô, đúng chỗ phép thử đo được tín hiệu |
| R4 — không gom hết | ✓ **nhưng phải lọc HAI tầng** | Phép thử phát hiện vỉa ask còn tầng khuôn mẫu thứ hai chưa lọc (§3 dòng J3) |
| R5 — tách cơ học/phán đoán | ✓ | Làn A đã xong rồi, tách sẵn |
| R6 — không tụt | ✓ **có câu trả lời ĐÃ CHỨNG MINH** | Đăng ký doctor check. `tsk-3ip` làm rồi (`changelog-unreleased-stale`), `tsk-1m0` làm rồi (`enduser-docs-index-stale`, hiện FAIL đúng: "85/237 tài liệu chưa có trong index"). R6 xưa cấm trả lời bằng lời hứa — giờ có tiền lệ chạy thật, hai lần |

**Kết luận đề xuất (CHƯA mint):** nửa storytelling đi theo **Làn B của
phương án 2** — verb quét theo lô trên quần thể, xếp hạng, đẻ ứng viên
dạng `draft`, người curate bất đồng bộ, kèm doctor check canh chính nó.
Không phải vì nó ăn điểm cao nhất trên giấy, mà vì **ba phương án kia đã
tự loại**: 1 đã làm, 4 là 2 đội thêm cửa chặn, 3 trượt đúng chỗ phép thử
vừa đo.

**Ba điều còn chưa chắc, không được lờ khi thi công:**

1. **Round-count mới là ỨNG VIÊN, chưa phải tín hiệu đã chứng minh.** bee
   chọn được tín hiệu vì có bộ nhãn tay để đo AUC; fgOS chưa có. Không
   khoá round-count như thể đã đo.
2. **Tầng khuôn mẫu thứ hai của vỉa ask chưa ai lọc** — phải lọc trước
   khi xếp hạng, kẻo xếp hạng trên rác.
3. **Chi phí curate của người chưa ai ước.** Làn B đẻ ứng viên; không ai
   duyệt thì thành nghĩa địa `draft` — đúng rủi ro nêu từ vòng 4, vẫn
   chưa xử.

Ghi chú sự thật hiện trạng, đúng cho mọi phương án: `fgos compound` chạy
khi item ở `retrospective`, tức SAU cổng duyệt `awaiting-approval`
(`src/state/work.mjs:83-94`) — nội dung tài liệu hiện **không đi qua cổng
duyệt nào của con người**, dù code thì có.

### 6.5 Kỷ luật cho pha triage: xếp hạng phải ĐO được

Pha 1 phải chấm điểm ứng viên, và đây là chỗ dễ tự lừa nhất. Bee đã trả
giá thật: luật "nạp mọi pattern quan trọng" viết lúc kho có 3 pattern; tới
49 pattern nó lật — 40/45 mục ngốn 13.000/19.726 token, phần lớn không
liên quan, 7 mục liên quan bị cắt vì hết chỗ.

Cách họ sửa mới là phần đáng port: **không đoán một luật tốt hơn, mà đo**.
Chấm từng tín hiệu ứng viên bằng AUC trên nhãn tay (0.5 = tung đồng xu):
trùng tag — ứng viên trực giác nhất — ra 0.550 với 48/49 hoà nhau ở 0
điểm, bị loại; trùng `areas` ra đúng 0.500; bản ship là IDF-weighted
vocabulary coverage, 0.805. Kèm ba khoá an toàn: floor (giữ chỗ cho vài
mục top), conservation (mọi mục phải được kể tên đúng một lần — trong danh
sách, trong phần bị cắt, hoặc trong phần loại trừ; thiếu một cái là ném
lỗi), và zero-signal guard (đa số hoà 0 điểm thì báo lỗi, vì đó là sắp
theo path đội lốt xếp hạng).

Ba bước bắt buộc, theo thứ tự: (1) tách bài học thành đơn vị riêng địa chỉ
hoá được, (2) xếp hạng khi lấy ra — không bao giờ "lấy tất", (3) chọn tín
hiệu xếp hạng bằng đo. Bước 1 không giải quyết gì nếu bước 2 vẫn là "lấy
tất".

## 7. Danh mục hạng mục / task {#tasks}

§6.4 còn bốn phương án chưa chọn, nên **chưa chia được task thi công**.
Nhưng một việc chia được ngay và không phụ thuộc lựa chọn đó: phép thử
đọc vỉa chất liệu.

### tsk-1hy — phép thử vỉa chất liệu kể chuyện {#task-storytelling-material-probe}

> **XONG 2026-08-09** (`delivered`). Giao: `scripts/probe-storytelling-
> material.mjs` + báo cáo `reports/tsk-1hy-storytelling-material-probe-
> report.md`. Kết quả đã gấp vào §3 (dòng J/J2/J3) và §5 vòng 5 — đọc ở
> đó, không cần mở lại báo cáo trừ khi cần trích dẫn nguyên văn.

**Mục tiêu:** script đọc-thuần gom + lọc chất liệu kể chuyện từ event log
đã có, để biết **vỉa đó có thật sự dùng được không** trước khi cam kết
bất kỳ kiến trúc nào. Là phép thử, không phải tính năng.

**Trích §6.4 áp dụng:** Cách 1 — "chỉ mặt đọc, không đường ống". Được
chọn làm việc-làm-trước vì nó **là phép thử**: trả lời đúng câu hỏi mà
vòng 4 vừa chứng minh session đoán sai.

**Vì sao nó tồn tại — §5 vòng 4(a):** vòng 3 khẳng định "chất liệu
struggle đã có sẵn trong `friction`"; đo lại thì SAI (92% friction là
telemetry máy), suy rộng từ đúng một bản ghi. Chính vì đã sai một lần
theo kiểu đó nên phải đọc vỉa thật trước khi ai đó thiết kế tiếp trên
giả định.

**Ràng buộc mang theo:** bài học B6b (§5 vòng 2) — không bao giờ "gom
hết"; nhưng phạm vi task này CHƯA cần ranking đầy đủ, chỉ cần lọc khuôn
mẫu + nhóm. Chọn tín hiệu xếp hạng bằng đo là giai đoạn sau.

**Quyết định thiết kế đáng ghi:** làm script trong `scripts/` (không nằm
trong `package.json` `files`, nên không được ship), **không** thêm verb
vào `bin/fgos.mjs`. Hai lý do thật: một phép thử chưa nên thành mặt công
khai vĩnh viễn khi chưa biết vật liệu có dùng được; và `bin/fgos.mjs`
đang có xung đột footprint sẵn giữa `tsk-3ip` và `tsk-3cb` — thêm cái
thứ ba là tự chuốc khó.

**Quan hệ anh em:** độc lập hoàn toàn. `fgos conflicts` xác nhận không
xung đột với bất kỳ item nào đang mở. Chạy song song được với `tsk-469`
và `tsk-3ip` (hai task nửa changelog, ở
`docs/history/automated-changelog-compound-learn/DISCUSSION.md` §7).

**Footprint:** `scripts/probe-storytelling-material.mjs`,
`test/scripts/probe-storytelling-material.test.mjs`,
`docs/history/compound-learn-artifact-registry/reports`.
**Verify:** `node --test test/scripts/probe-storytelling-material.test.mjs`

### Quan hệ với `tsk-28x` (chính nó)

`tsk-28x` giờ mang `deps: [tsk-12m, tsk-1hy]` — cần kết quả phép thử mới
trả lời được câu hỏi phương án §6.4. **Lưu ý:** `deps` trên `tsk-12m` là
di sản từ lúc submit và vẫn là **câu hỏi mở** (§3 dòng E), chưa được xác
nhận là đúng; `deps` trên `tsk-1hy` thì rõ ràng đúng.

### Chưa chia được

Mọi thứ sau khi chọn phương án: hình dạng registry/trục, port
`authoritative_for`, triage, `draft` lifecycle. Chờ §6.4.
