# Automated CHANGELOG capture wired into compound-learn — Discussion

## 1. Trạng thái hiện tại

Vòng 4. D-tsk12m-A/B/C đã mint từ vòng 3 (§4). Câu D (session tự phán đoán
"user-visible", không heuristic file-touched) giữ nguyên qua vòng 3→4,
**đủ điều kiện mint nhưng chưa mint** — chờ chốt cùng lượt với lộ trình
dưới. Điểm E (tầm nhìn đa-audience) đã tách sang
`docs/history/compound-learn-artifact-registry/DISCUSSION.md`.

Vòng 4 mở một trục MỚI, không có trong 3 vòng trước: **lộ trình đưa
changelog vào đời — thủ công trước, cơ giới hoá sau** — và tìm ra một
ranh giới cho phép làm việc thật NGAY BÂY GIỜ mà không cần chờ discussion
registry hội tụ (ranh giới quan-sát/nhắc vs quyết/viết/chặn, §6). Đây là
thay đổi trạng thái quan trọng: `tsk-12m` **không còn bị chặn hoàn toàn**
bởi `tsk-28x` như vòng 3 ghi.

## 2. Mục tiêu & đề bài

`tsk-12m` đề xuất: khi một work item mang thay đổi user-visible (CLI flag
mới, lệnh mới, breaking change, đổi hành vi) đi qua bước retrospective
(cùng lúc `fgos-coding-compounding` đang chạy phân loại Diataxis), fgOS tự động
ghi lại một dòng changelog thay vì để một file `CHANGELOG.md` bị bỏ quên
(hiện repo hoàn toàn không có file này dù `package.json` đứng yên `0.1.0`
qua hàng chục feature đã merge — phát hiện từ audit install/setup/doctor
2026-08-07). Bản tự động PHẢI tái dùng đúng kỷ luật ghi-tài-liệu hiện có
của compound-learn (viết+commit trước, tag sau — D1/D3 của
retrospective-doc-write-path) thay vì phát minh luồng ghi riêng, và
KHÔNG được nhét changelog vào enum `DIATAXIS_DOC_TYPES` bốn-quadrant hiện
có (category error — changelog không phải tutorial/how-to/reference/
explanation). Đây là việc theo sau, không khẩn — interim thật (bootstrap
tay `CHANGELOG.md` theo format Keep a Changelog) đã quyết làm riêng, không
thuộc phạm vi thảo luận này.

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Không nhét vào `DIATAXIS_DOC_TYPES`/`QUADRANT_META` | RÕ | Hard rule của `fgos-coding-compounding` SKILL.md xác nhận trực tiếp: "Do not invent a fifth Diataxis quadrant or blend two" |
| 2 | Ghi nội dung trước, tag sau, chỉ tag khi đã commit ở HEAD | RÕ | `compound` verb's D3 check (`git cat-file -e HEAD:<path>`) — bất kỳ đường ghi mới nào cũng phải theo đúng thứ tự này |
| 3 | Model "grow vs create" (additive, không xoá/rút gọn) | RÕ, tái dùng được | Khớp tự nhiên bản chất changelog — mỗi entry cộng dồn |
| A | Vị trí file `CHANGELOG.md` | **D-tsk12m-A** | Chốt: repo root. `fgos-coding-compounding` SKILL.md cần sửa câu chữ hard rule (exemption cho changelog) khi vào giai đoạn planning |
| B | Điểm quyết "có đáng ghi changelog không" nằm ở đâu | **D-tsk12m-B** | Mở rộng `fgos-coding-compounding`, hình dạng registry mở-rộng-được (tiền lệ `registerCheck`/`registerFix`). Phạm vi/thiết kế registry cụ thể → tách sang `docs/history/compound-learn-artifact-registry/DISCUSSION.md` |
| C | Version heading cho entry mới | **D-tsk12m-C** | Chuỗi chính xác **`## [Unreleased]`** (có ngoặc vuông, đúng chuẩn Keep a Changelog mà D-tsk12m-A đã cam kết). Cắt-release là bước thủ công riêng, ngoài phạm vi `tsk-12m`. *Làm rõ 2026-08-09: các dòng ghi tắt `## Unreleased` không ngoặc trong văn xuôi §5 là cùng một thứ viết gọn, không phải quyết định khác — pin lại ở đây vì `tsk-3ip` PARSE đúng chuỗi này, sai một ký tự là check đọc trượt.* |
| D | "User-visible" định nghĩa bằng gì | TRẢ LỜI V3 (chưa D-ID, chờ vòng 4) | Chốt D2: session tự phán đoán có bằng chứng ngay lúc retrospective, cùng kỷ luật chọn quadrant (không mặc định, không coin-flip) — hệ quả tự nhiên của D-tsk12m-B |
| E | Tầm nhìn compound-learn đa-audience | TÁCH RA | Chuyển sang discussion riêng `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (yêu cầu chủ sản phẩm, 2026-08-07 vòng 3) — không còn theo dõi ở đây |
| F | **Ranh giới: cơ chế nào làm được TRƯỚC khi chốt phương án tổng thể** | RÕ (vòng 4) | Không phải chia theo "chặng", mà theo **cơ chế đó LÀM GÌ**. Loại **quan sát/nhắc** (nag, doctor check, bộ đếm) không quyết gì, không viết gì, không chặn ai → độc lập hoàn toàn với câu hỏi phương án của `tsk-28x`. Loại **quyết/viết/chặn** (phán đoán changelog-worthy, sinh nội dung entry, chặn merge khi thiếu entry) → kẹt sau nó. Xem §6 |
| G | Chặng 1 (ghi tay) tự nó KHÔNG sinh số đo | RÕ (vòng 4, tự sửa lỗi) | Vòng 4 ban đầu tuyên bố "chặng 1 là chặng ĐO". Sai: ghi tay không ghi lại gì đo được — ba con số cần (tần suất user-visible, tỉ lệ suy-ra-cơ-học-được, **tỉ lệ quên**) sẽ chỉ là cảm giác. Chính lỗi "không ai nhớ" lặp ở tầng trên. Cần chặng 2 (bộ đếm) mới đo thật được |
| H | Số đo của changelog KHÔNG mở khoá nửa storytelling | RÕ (vòng 4) | Câu hỏi phương án (`tsk-28x` §6.4) phủ CẢ changelog lẫn marketing-storytelling. Chặng 1+2 chỉ sinh bằng chứng cho nửa changelog. Nửa storytelling cần phép thử RIÊNG (Cách 1 — mặt đọc trên vỉa ask/tranh cãi). Hai phép thử ĐỘC LẬP, chạy song song được — không phải một chuỗi tuần tự. Nhất quán với lỗi 3 của `tsk-28x` vòng 4 (gộp nhầm artifact cơ học với artifact phán đoán) |

## 4. Quyết định đã chốt

| D-ID | Tóm tắt | Ghi chú |
|---|---|---|
| D-tsk12m-A | `CHANGELOG.md` ở repo root, chuẩn ngành Keep a Changelog | Cần sửa hard rule `fgos-coding-compounding` SKILL.md lúc planning |
| D-tsk12m-B | Changelog-worthy quyết ngay trong `fgos-coding-compounding`, hình dạng registry mở-rộng-được | Tiền lệ `registerCheck`/`registerFix`/`registerConfigDefault`, `src/setup/registrations.mjs:64/85/110`. Phạm vi registry → discussion riêng |
| D-tsk12m-C | Entry mới vào `## Unreleased`, cắt-release thủ công riêng | Ngoài phạm vi `tsk-12m` |

## 5. Q&A log

- **2026-08-07** — Khởi tạo discussion từ `tsk-12m` (submit ngay trước đó
  trong cùng phiên, không có dependency rõ ràng nào tìm thấy trong
  `fgos list --json` lúc submit). Scout: `bin/fgos.mjs` case 'compound'
  (dòng ~1236-1274), `.claude/skills/fgos-coding-compounding/SKILL.md` toàn văn,
  `docs/explanation/fgos-retro-loop-and-the-restored-compound-verb.md`
  toàn văn. 4 câu hỏi mở (§3 A-D) đặt ra cho vòng tiếp theo.
- **2026-08-07 (vòng 2)** — Trả lời: A=root (repo root, chuẩn ngành —
  chấp nhận đánh đổi phải sửa hard rule của `fgos-coding-compounding`); B=(a)
  mở rộng `fgos-coding-compounding` trực tiếp; C=đồng ý `## Unreleased` +
  cắt-release thủ công riêng; D=chưa hiểu câu hỏi gốc (viết lại kèm ví dụ
  cụ thể trong §3). Đồng thời chủ sản phẩm nêu tầm nhìn chiến lược lớn
  hơn phạm vi ban đầu: compound-learn về sau phục vụ nhiều loại tài liệu
  + nhiều audience hơn, kể cả chất liệu marketing-storytelling cho người
  dùng fgOS xây sản phẩm; hệ thống nên tự ghi nhận chi tiết/chất liệu và
  phát hiện ý tưởng kể chuyện — ghi nhận thành điểm E (§3), chưa quyết
  phạm vi. Scout thêm: xác nhận tiền lệ registry mở-rộng-được đã tồn tại
  thật (`registerCheck`/`registerConfigDefault`/`registerFix`,
  `src/setup/registrations.mjs` dòng 64/85/110) — dùng làm căn cứ cho đề
  xuất ở dòng B/E, không phải ý tưởng suông.
- **2026-08-07 (vòng 3)** — A/B/C giữ nguyên, mint D-tsk12m-A/B/C thật qua
  `fgos decision --id tsk-12m` (seq 9005-9007). Chốt D=D2. Chủ sản phẩm
  yêu cầu tách điểm E ra thảo luận riêng ("chuyển sang coding-shape để
  bàn") — mở `docs/history/compound-learn-artifact-registry/
  DISCUSSION.md` làm feature riêng, không viết chung file này (D3 rule:
  một feature một file). `tsk-12m` tạm dừng chờ discussion đó hội tụ vì
  D-tsk12m-B phụ thuộc hình dạng registry.

- **2026-08-09 (vòng 4)** — Chủ sản phẩm hỏi lại cách làm `CHANGELOG.md`
  thủ công cụ thể và dự định tiếp theo cho hoàn chỉnh. Session trình bày
  lộ trình 3 chặng, trong đó tuyên bố "chặng 2 phụ thuộc câu hỏi phương
  án của `tsk-28x`, không có bước cơ giới hoá nào trung thực làm được
  trước đó" và "chặng 1 là chặng ĐO".

  Chủ sản phẩm hỏi tiếp: "nếu có cơ chế thì nó sẽ fit vào chặng nào sau
  này". Câu hỏi này lộ **hai lỗi trong chính lộ trình vừa trình bày**:

  1. **"Chặng 1 là chặng đo" — sai.** Ghi tay không sinh ra số đo nào.
     Ba con số hứa đo (tần suất, tỉ lệ suy-ra-cơ-học-được, tỉ lệ quên)
     sẽ chỉ là cảm giác. Chặng 2 không bao giờ có bằng chứng, câu hỏi
     phương án treo mãi. Đúng lỗi "không ai nhớ" lặp ở tầng trên.
  2. **"Không cơ chế nào làm được trước khi chốt phương án" — cũng sai.**
     Ranh giới thật không nằm ở chặng, mà ở **cơ chế đó LÀM GÌ** (§3
     dòng F, §6).

  Scout xác nhận hai tiền lệ có thật trong repo, không phải ý tưởng
  suông: `collectMissingOutcomeNag` (`bin/fgos.mjs:620` — khuôn nag đã
  chạy, hiện ra qua `fgos check`) và `registerCheck({id, description,
  check})` (`src/setup/registrations.mjs:65` — registry doctor đang chạy;
  hơn nữa gate install/setup/doctor trong `AGENTS.md` **bắt buộc** năng
  lực mới phải đăng ký vào đó, nên doctor check không phải lựa chọn mà là
  nghĩa vụ).

  Số liệu mặt công khai đo lúc này: **49 verb CLI**, 2 bin entry
  (`fgos`, `fgos-runner`), `version: 0.1.0`, `private: true` — không một
  dòng changelog nào cho toàn bộ mặt đó. Ghi chú trung thực: `private:
  true` chặn `npm publish`, người dùng cài bằng `npm install -g
  github:vantt/forgent` tức lấy thẳng HEAD, **không ghim version** — nên
  SemVer lúc này là kỷ luật tài liệu, chưa phải cơ chế.

  Chủ sản phẩm hỏi cuối vòng: "như vậy phải làm 1 và 2 trước rồi mới tính
  tiếp?" — trả lời ở §6.4, kèm một đính chính: đúng cho nửa changelog,
  KHÔNG đúng cho nửa storytelling (§3 dòng H).

## 6. Thiết kế đã chốt {#design}

**Bản đầu (vòng 4).** D-tsk12m-A/B/C đã chốt (§4); phần dưới là lộ trình
đưa changelog vào đời, chưa mint D-ID. Viết cho người đọc không có lịch
sử hội thoại.

### 6.1 Ranh giới cho phép làm việc ngay, không chờ

Câu hỏi lớn còn treo (`tsk-28x` §6.4: chọn phương án nào cho toàn bộ
compound-learn) **không chặn mọi thứ**. Ranh giới thật không phải "chặng
nào", mà là **cơ chế đó làm gì**:

| Loại | Ví dụ | Có đụng vùng đang tranh luận? |
|---|---|---|
| **Quan sát / nhắc** | nag qua `fgos check`; doctor check `changelog-unreleased-stale`; bộ đếm tỉ lệ quên; doctor so version đã cài với version repo | **Không** — không quyết gì, không viết tài liệu nào, không chặn ai |
| **Quyết / viết / chặn** | phán đoán một thay đổi có đáng changelog không; sinh nội dung dòng entry; chặn merge khi thiếu entry | **Có** — đúng vùng D-tsk12m-B + câu hỏi phương án; riêng "chặn merge" còn vi phạm ràng buộc R2 của `tsk-28x` (quyền quyết định của người phải đạt được không bằng cửa chặn) |

Tính chất đáng giá: **loại quan sát/nhắc sống sót qua mọi câu trả lời của
câu hỏi phương án.** Dù phương án nào thắng, việc "quan sát xem có ai ghi
không" vẫn cần. Không phải việc vứt đi.

### 6.2 Cách làm thủ công — 4 bước

1. **Tạo `CHANGELOG.md` ở repo root** (D-tsk12m-A), chuẩn Keep a
   Changelog, có sẵn khối `## [Unreleased]` với bốn mục Added / Changed /
   Fixed / Removed.
2. **Backfill tới đâu — cắt `0.1.0` = "mặt hiện có tính tới hôm nay"**:
   kể tên câu chuyện install/setup/doctor/uninstall, hai bin entry, CLI
   49 verb; **không liệt kê lịch sử từng item**. Backfill chi tiết từ 166
   item `done` bị loại vì nó **tự vi phạm luật đang lập** — phần lớn item
   là nội bộ, không user-visible.
3. **Luật cập nhật**: điểm ghi là **lúc merge/approve** (`awaiting-
   approval` → `delivered`) — lúc thay đổi thành thật với người dùng.
   Gia cố rẻ nhất không viết code: thêm một câu vào gate đã có sẵn trong
   `AGENTS.md` ("Install/setup/doctor gate"), cùng dạng câu hỏi bắt buộc
   đang có — "thay đổi này người dùng có thấy không? nếu có, thêm một
   dòng vào `## [Unreleased]`". Tái dùng cơ chế đang chạy, chi phí bằng
   không.
4. **Bump version** khi có một cụm thay đổi đáng gọi là bản phát hành.

### 6.3 Điểm yếu cố hữu của bản thủ công

Phải có ai đó *nhớ*. Chính cái quên đó tạo ra lỗ hổng này ngay từ đầu, và
bước 3 chỉ làm nó bớt quên chứ không loại bỏ. Đây là lý do chặng 2 tồn
tại — không phải để tự động hoá việc ghi, mà để **đo xem việc quên xảy ra
bao nhiêu**.

### 6.4 Lộ trình

| Chặng | Nội dung | Chờ câu hỏi phương án? |
|---|---|---|
| 1 | File + baseline `0.1.0` + dòng gate `AGENTS.md` | Không |
| 2 | Nag + doctor check + bộ đếm (loại quan sát/nhắc) | Không — **và chính nó sinh bằng chứng** để trả lời |
| 3 | Quyết + viết tự động, theo phương án được chọn | Có |

**Chặng 2 là thứ biến chặng 1 thành chặng đo thật.** Sau N lần merge sẽ
biết ba thứ hiện đang đoán: tần suất thay đổi user-visible (hiếm thì tự
động hoá là lãng phí); bao nhiêu phần một entry suy ra được cơ học; và
**tỉ lệ quên** — con số duy nhất biện minh được cho việc tự động hoá.

**Rủi ro phải phòng ngay khi thiết kế chặng 2:** nag bắn mỗi lần merge
rồi bị bỏ qua sẽ thành nhiễu. Nag phải **đếm, đừng mắng** — và chính con
số đếm đó là số đo. 5% quên sau 20 merge nghĩa là tự động hoá lãng phí;
70% nghĩa là câu hỏi phương án có căn cứ thật để chọn.

### 6.5 Giới hạn của lộ trình này

Chặng 1+2 chỉ mở khoá **nửa changelog** của câu hỏi phương án. Nửa
marketing-storytelling cần phép thử riêng (`tsk-28x` §6.4 Cách 1 — mặt
đọc trên vỉa ask/tranh cãi). Hai phép thử **độc lập, chạy song song
được** — không phải một chuỗi tuần tự. Nhất quán với lỗi 3 mà `tsk-28x`
vòng 4 tự tìm ra: artifact cơ học và artifact phán đoán không dùng chung
một đường.

## 7. Danh mục hạng mục / task {#tasks}

Hai task đã submit thật 2026-08-09, enrich đầy đủ để chạy không cần hỏi
lại. **Chạy song song được** — `fgos conflicts` xác nhận footprint rời
hẳn, không cặp xung đột nào giữa hai cái.

### tsk-469 — bootstrap CHANGELOG.md thủ công {#task-manual-changelog-bootstrap}

**Mục tiêu:** dựng `CHANGELOG.md` ở repo root theo Keep a Changelog, cắt
baseline `## [0.1.0]` gộp, thêm câu hỏi bắt buộc vào gate sẵn có trong
`AGENTS.md`. Không tự động hoá gì.

**Trích §6 áp dụng:** §6.2 (4 bước) và §6.3 (điểm yếu cố hữu — bản thủ
công phụ thuộc việc có người nhớ; bước 4 chỉ làm bớt quên chứ không loại
bỏ, và đó chính là lý do `tsk-3ip` tồn tại).

**D-ID áp dụng:** D-tsk12m-A (root), D-tsk12m-C (`## [Unreleased]`,
cắt-release ngoài phạm vi).

**Quan hệ anh em:** không phụ thuộc `tsk-3ip`, chạy song song được.
Cung cấp cho `tsk-3ip` chuỗi heading mà nó parse — nhưng `tsk-3ip` phải
xử lý được cả trường hợp file chưa tồn tại, nên không phải dependency
cứng.

**Footprint:** `CHANGELOG.md`, `AGENTS.md`.
**Verify:** `test -f CHANGELOG.md && grep -qF '## [Unreleased]' CHANGELOG.md && grep -qF '## [0.1.0]' CHANGELOG.md && grep -qF 'CHANGELOG.md' AGENTS.md && echo PASS`

### tsk-3ip — cơ chế quan sát/nhắc + bộ đếm {#task-changelog-observe-remind}

**Mục tiêu:** nag gộp qua `fgos check`, doctor check đăng ký qua
`registerCheck`, bộ đếm tỉ lệ quên. Chỉ quan sát và nhắc.

**Trích §6 áp dụng:** §6.1 (ranh giới quan-sát/nhắc vs quyết/viết/chặn —
lý do task này làm được ngay dù câu hỏi phương án còn treo, và lý do nó
sống sót qua mọi câu trả lời), §6.4 (chặng 2 là thứ biến chặng 1 thành
chặng đo thật; nag phải **đếm, đừng mắng**).

**Ràng buộc ngoài áp vào:** R2 của `tsk-28x` §6.4 — quyền quyết định của
người phải đạt được KHÔNG bằng cửa chặn, nên tuyệt đối không chặn merge.

**Số liệu bắt buộc tôn trọng:** ~25 lượt vào `delivered`/ngày, ~176/tuần
(đo `.fgos/events.jsonl`, 2026-08-01→08). Nag per-merge = 176 lần làm
phiền/tuần → chết vì nhiễu. Bắt buộc gộp.

**Quan hệ anh em:** song song với `tsk-469`. **Nhưng xung đột footprint
với `tsk-3cb`** trên `bin/fgos.mjs` (`fgos conflicts` phát hiện; cả hai
đang `todo/clarify`, chưa cái nào chạy) — đừng chạy đồng thời hai cái đó.

**Footprint:** `bin/fgos.mjs`, `src/setup/registrations.mjs`,
`test/setup/checks.test.mjs`.
**Verify:** `node --test test/setup/checks.test.mjs`

### Quan hệ với `tsk-12m` (chặng 3)

`tsk-12m` (tự động hoá thật) **phụ thuộc cả hai** — cần file tồn tại
(`tsk-469`) và cần số đo để trả lời câu hỏi phương án (`tsk-3ip`). Đã gắn
`deps` thật 2026-08-09.

### Nằm NGOÀI phạm vi hai task này

Nửa marketing-storytelling của câu hỏi phương án. Nó cần phép thử riêng
(`tsk-28x` §6.4 Cách 1 — mặt đọc trên vỉa ask/tranh cãi), độc lập, chạy
song song được, **chưa submit thành item**.
