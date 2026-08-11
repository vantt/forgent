# Research Report: Nâng cấp schema work-item (status branch, type hierarchy, nested domain fields, per-domain status flow)

**Thời điểm nghiên cứu:** 2026-07-30 09:31 (Asia/Saigon), cập nhật 10:10, 10:35 (chốt kiến trúc round 4), 15:10 (milestone `tsk-3w3`), 2026-08-01 09:58 (round 11 — file `tsk-38t`, sửa lỗi `goalTier`), 14:47 (round 12 — re-audit `tsk-2rp`: phát hiện verb `catchup` bị bỏ sót, 9 call site không phải 8), 2026-08-07 17:31 (round 13 — scan lại codebase: `tsk-38t` đã ship qua decision `0027`, `tsk-2rp`/`tsk-3p1` đóng `wontfix`), 2026-08-09 14:15-14:46 (file `tsk-5wr`/`tsk-3m6` cho status `backlog` + pre-submit domain classify; round 14 — nhánh `epic` của ask #2 đã giải qua `goalTier`+`targets`, decision `D4`/`tsk-umc`, vá xong qua `tsk-1ug`)

**Task chính quản lý cụm này:** `tsk-3w3` (`deps: [tsk-2rp, tsk-3p1, tsk-38t]`) —
coi là đạt khi cả 3 dep xong: `tsk-2rp` (Phase 1, `verifyKind`), `tsk-3p1`
(RUL12 marker), `tsk-38t` (Phase 2, `statusCategory`/`kindCategory`/
`domainFields` — filed round 11, xem "Thứ tự triển khai" dưới).

**Sửa lỗi thật (round 11):** dòng này TỪNG ghi `tsk-3w3 (goalTier: milestone`
— SAI, đã kiểm qua `fgos show tsk-3w3` thật: item KHÔNG mang `goalTier`.
Nguyên nhân gốc, đáng ghi lại vì tự nó là 1 data-point cho câu hỏi #2 gốc
("goalTier có generic/dùng đúng không"): `tsk-3w3` được tạo qua `fgos submit`
(có `mode: sync`), nhưng verb `submit` KHÔNG expose `--goal-tier` (chỉ `add`
có flag đó — `bin/fgos.mjs` case `'submit'`, so với case `'add'`). Cộng thêm
`goalTier` bị loại khỏi `EDITABLE_FIELDS` (`store.mjs:186`, cố ý — "luôn set
lúc `add`, không bao giờ retrofit") — nghĩa là **item này đã VĨNH VIỄN không
gắn `goalTier` được nữa**, không có đường sửa. Đây là 1 khoảng hở thật giữa
2 cửa vào work-item (`add` đầy field, `submit` thiếu vài field so với `add`)
— đáng thêm vào câu hỏi mở.

## Mục tiêu report này

**Mục tiêu chính, 1 câu:** làm cho work-item schema fgOS THẬT SỰ chạy được
với domain thứ 2 không phải code (không chỉ đặt tên được) — trong khi
coding giữ nguyên 100% hành vi, 0 regression.

fgOS chuẩn bị mở rộng ra ngoài domain `coding` (duy nhất domain thật hôm
nay, cộng `synthetic` chỉ để minh họa) — user chuẩn bị cho multi-domain
(coding, marketing, ...) và muốn nâng cấp schema work-item để hỗ trợ điều
đó: thêm status `backlog`/`propose` trước `todo`, mở rộng `type` (thêm
`epic`), tách field riêng theo domain, và cho phép status flow khác nhau
theo domain. Report này KHÔNG phải khảo sát tổng quan — nó là 1 phiên đào
sâu (deep dive), bắt đầu từ 4 đề xuất cụ thể của user, để tìm CHỖ NỨT thật
giữa ý định "domain tự do" và kiến trúc hiện tại của fgOS (đặc biệt quyết
định đã khóa base-workflow-model D1-D3: "domain không bao giờ chi phối
status"). Qua nhiều vòng hỏi-đáp, report đi tới 1 thiết kế cụ thể (2 field
`status`/`statusCategory`, domain sở hữu bảng transition riêng) — và phải
supersede thật quyết định D1-D3 để làm được điều đó. Mục đích cuối: để lại
1 tài liệu đủ chi tiết cho người/agent khác đọc lại, hiểu ĐÚNG lý do của
từng lựa chọn (không chỉ kết luận), và biết chỗ nào còn cần quyết định
trước khi code.

## Mục lục
1. [Tóm tắt điều hành](#tóm-tắt-điều-hành)
2. [Phương pháp](#phương-pháp)
3. [Hiện trạng schema (grounded trong code + spec)](#hiện-trạng-schema)
4. [Xung đột cần quyết định trước khi làm](#xung-đột-cần-quyết-định)
5. [Phân tích 4 đề xuất](#phân-tích-4-đề-xuất)
6. [Tổng quát hóa: tách CATEGORY (cơ học, chung) khỏi LABEL (từ vựng domain)](#tổng-quát-hóa-category-vs-label)
7. [Đề xuất tổng hợp](#đề-xuất-tổng-hợp)
8. [Chưa bàn tới — gap cần đào sâu thêm](#chưa-bàn-tới)
9. [Câu hỏi chưa giải quyết](#câu-hỏi-chưa-giải-quyết)
10. [Nguồn](#nguồn)

## Tóm tắt điều hành

fgOS đã có 3 trục độc lập trên work item: `status` (vi mô, "đang ở đâu"), `stage`
(vĩ mô, "loại tác vụ nào" — hiện chỉ domain `coding` khai đủ 4 giá trị), và
`domain` (chọn bộ `stage` nào áp dụng). Có thêm `goalTier` (`mvp`/`milestone`)
— một field TÁCH BIỆT, không phải type hierarchy, đánh dấu 1 item LÀ mục tiêu
cho graph-ranking, KHÔNG phải cấp trong cây phân rã việc. Bốn đề xuất của user
va vào những cấu trúc có sẵn này theo 4 cách khác nhau — 2 việc (backlog
status, nested domain fields) khớp tự nhiên với kiến trúc hiện tại; 2 việc
(type-hierarchy tuyến tính mvp>milestone>task>bug, status flow riêng theo
domain) đang GỘP hai trục fgOS cố tình tách rời, hoặc đảo ngược một quyết định
đã khóa và đã được data thực tế (domain `synthetic`) xác nhận đúng.

Khuyến nghị nhanh: làm #1 (backlog status, đổi tên khỏi "propose") và #3
(nested domain fields) — rủi ro vừa phải, nhất quán kiến trúc. KHÔNG làm #4
(status flow theo domain) như user mô tả — mâu thuẫn base-workflow-model
D1-D3 đã verify qua code+test thật. Với #2 (type hierarchy), tách `kind`
(task/bug/epic-là-nhãn) ra khỏi `goalTier` (mvp/milestone) — đừng xâu chuỗi
tuyến tính, vì cả Jira/Linear/GitHub đều xếp epic là CHA của story/task/bug
(peer), không phải 1 mắt xích trong chain.

**Cập nhật (round 2):** cả `backlog` (status) lẫn `kind` enum tương lai đều
đối mặt cùng 1 vấn đề gốc — schema hôm nay là 1 TẦNG ENUM PHẲNG, đã lộ
coding-bias ở vài giá trị (`awaiting-approval`, `wontfix`, `blocked`
reason `verify-fail`). Thêm `backlog` không sai, nhưng không sửa gốc. Fix
tổng quát (xác nhận qua kiến trúc thật của Linear): tách CATEGORY (nhỏ, cố
định, cơ học — cái `fsm.mjs`/`frontier.mjs` thật sự cần) khỏi LABEL (từ
vựng domain tự đặt, map vào category). Xem mục 6 mới.

**Chốt (round 3):** category và label là 2 FIELD RIÊNG trên item
(`statusCategory` mới + `status` đã có), KHÔNG PHẢI 1 field cộng hàm lookup
derive-on-read — bắt buộc vì luật L3 (replay phải xác định, xem mục 6).
`statusCategory` đóng băng lúc ghi event, domain-agnostic 100%; `status` vẫn
domain-specific như hôm nay, migration = 0.

**Sửa lại (round 4, CHỐT CUỐI):** round 3 còn 1 lỗi — coi "cùng category thì
transition luôn hợp lệ" để suy fsm chạy thuần trên category. SAI, chứng minh
được bằng code thật: `blocked → awaiting-human` KHÔNG có trong 19 cạnh thật
của `fsm.mjs` hôm nay, nhưng nếu fsm chỉ validate ở mức category (`blocked`
và `awaiting-human` cùng nhóm `in-progress`) thì cạnh đó tự nhiên được
legalize — 1 lỗ hổng thật, không phải lý thuyết. Category là bản NÉN có mất
mát của label graph thật, không thể dùng để validate move.

**Quyết định cuối:** `fsm.mjs` validate move dựa trên **bảng transition của
TỪNG DOMAIN** (label thật, đầy đủ, mịn — coding giữ nguyên y hệt 19 cạnh hôm
nay, formalize thành "bảng của domain coding"; domain khác tự khai bảng
riêng). `statusCategory` KHÔNG tham gia validate move — vai trò thật của nó
là **hợp đồng chung cho mọi cơ chế domain-agnostic của fgOS** (compound-learn,
bài học lúc đóng, outcome/friction, frontier, rollup, discovery-judge...) —
xem mục 6.

Hệ quả kiến trúc: đây là supersede THẬT base-workflow-model D1-D3 (không phải
thu hẹp câu chữ như round 3 tưởng) — domain giờ SỞ HỮU bảng transition của
chính nó. Cần 1 decision record mới, đúng khuôn `0024` supersede `0006`.

## Phương pháp

- Đọc trực tiếp `docs/specs/work-state.md`, `docs/explanation/work-item-lifecycle-and-domain-model.md`,
  `docs/decisions/0024-...md`, `src/state/work.mjs`, `src/state/workflow-stage-graphs.mjs`.
- 3 WebSearch (giới hạn quota 5): (a) Jira/Linear/GitHub epic-milestone-story-task-bug
  hierarchy, (b) pattern schema nested/JSONB theo domain-module, (c) Jira workflow
  scheme — status flow theo issue type/project.
- Round 2 (follow-up, ngoài quota /research): 2 WebSearch xác nhận kiến trúc
  Linear (workflow state TYPE/category cố định + custom label per-team) và
  GitHub Projects (issue type — vocab CHUNG toàn org, không per-repo) để đối
  chiếu 2 hướng generalize.
- Không dùng Gemini (`useGemini: false` trong `.ck.json`).

## Hiện trạng schema

| Trục | Field | Giá trị hôm nay | Nguồn |
|---|---|---|---|
| Vi mô ("đang ở đâu") | `status` | `todo`/`doing`/`blocked`/`awaiting-approval`/`done`/`awaiting-human`/`wontfix` (7 giá trị) | `src/state/work.mjs:37` |
| Vĩ mô ("loại tác vụ nào") | `stage` | domain `coding`: `clarify→decompose→executing→compound-learn`; domain `synthetic`: chỉ `assembling` | `src/state/workflow-stage-graphs.mjs:50,89` |
| Chọn bộ stage | `domain` | `coding` (mặc định) · `synthetic` (minh họa, dùng-một-lần) | cùng file, dòng 42-44 |
| Loại việc | `kind` | **free text**, KHÔNG phải enum | `docs/specs/work-state.md` Data Dictionary #3 |
| Mục tiêu | `goalTier` | `mvp`/`milestone` — field RIÊNG, gắn lên bất kỳ item nào để đánh dấu nó LÀ một goal cho graph-ranking (STR67); set 1 lần lúc `add`, không sửa được sau | `src/state/work.mjs:51-57` |
| Cây phân rã | `parent`/`deps` | "epic" hôm nay KHÔNG phải giá trị — chỉ là "item thường được `deps` trỏ vào" | `docs/specs/work-state.md` Data Dictionary #5 |

3 điểm quan trọng khi đọc:

1. **Quyết định đã khóa (base-workflow-model D1-D3):** "`status` và bảng
   chuyển-status (`fsm.mjs`) KHÔNG BAO GIỜ thuộc về domain — domain chỉ chi
   phối `stage`" (`docs/specs/work-state.md` dòng 395-396). Đây không phải law
   cấp L1-L10 của `platform-foundations.md` (không cần thủ tục supersede
   chính thức), nhưng là quyết định ĐÃ VERIFY qua code thật lẫn test thật
   (`test/e2e/synthetic-domain.test.mjs` — domain `synthetic` đi qua ĐÚNG bộ
   `status` của domain `coding`, kể cả `awaiting-approval`).
2. **`proposed` đã bị đổi tên** thành `awaiting-approval` đúng 1 ngày trước
   (`0024`, 2026-07-29) — lý do: "proposed" là danh từ trừu tượng không tự nói
   "chờ gì". Dùng lại chữ "propose" cho MỘT Ý NGHĨA KHÁC (initial-intake) sẽ
   tái sinh đúng từ vựng vừa deprecate, gây nhầm khi đọc lại git history/
   migration script/tài liệu cũ nhắc "proposed".
3. **Domain registry (`DOMAINS` object trong `workflow-stage-graphs.mjs`) ĐÃ
   LÀ pattern nested-per-domain-config** mà user hỏi ở mục 3 — mỗi domain khai
   `{stages, stepMap, transitions, skillMap}` riêng. Tiền lệ trực tiếp, không
   phải ý tưởng mới với hệ thống.
4. **Lệch spec/code:** `goalTier` có trong code (`work.mjs:51-57`) nhưng
   KHÔNG có trong Data Dictionary của `work-state.md` — spec thiếu 1 field
   đang sống. Đáng sửa độc lập với 4 việc user hỏi.

## Xung đột cần quyết định

Theo quy tắc "trình bày quyết định gốc + mối lo + trade-off + option rồi chờ
người quyết" — không tự đảo:

### A. Ask #4 (status flow riêng theo domain) đối đầu trực tiếp quyết định đã khóa
Base-workflow-model D1-D3 nói domain KHÔNG chi phối status. Đảo lại là loại
thay đổi tốn nhất theo đúng bài học nội bộ đã ghi
(`work-item-lifecycle-and-domain-model.md`): "thêm 1 precondition mới" tốn
audit MỌI consumer đọc `fsm.mjs` (frontier, runner, pull-door take/return...),
không chỉ vài chỗ liệt kê sẵn — rủi ro regression thật, không phải lý thuyết.

**Đã quyết (round 4, xem mục 6):** sau khi chứng minh category-only bị lủng
(`blocked→awaiting-human`), chốt là ĐẢO thật D1-D3 — domain sở hữu bảng
transition riêng của nó. Chi phí audit ở đoạn này (mọi consumer `fsm.mjs`)
là cái GIÁ THẬT phải trả, không né được — cần decision record mới + audit
đủ trước khi làm, không phải lý do để không làm.

### B. Ask #2 xâu `mvp>milestone` chung chuỗi với `task>bug` là gộp 2 khái niệm khác trục
`goalTier` (mvp/milestone) trả lời "item này có phải một MỤC TIÊU cần
graph-ranking hướng backlog tới không". `kind`/type mới (task/bug/epic) trả
lời "việc này thuộc LOẠI gì trong cây phân rã". Đây đúng loại lỗi mà lifecycle
doc cảnh báo: "khái niệm mới trả lời câu hỏi KHÁC → cần trục riêng, đừng nhét
vào enum cũ" — nguyên tắc này project đã áp 2 lần rồi (`tier`, `stage`).

### C. Ask #1 (propose/backlog) — status hay stage-like?
`stage` trả lời "loại tác vụ nào cần" (clarify/decompose/...); status trả lời
"đang ở đâu trong lượt làm việc này". "Item đã được duyệt vào kế hoạch chưa"
gần với câu status đang trả lời hơn — nên hợp lý để là 1 giá trị `status` mới,
KHÔNG phải `stage` mới. Nhưng thêm giá trị + thêm precondition (loại
backlog-item khỏi frontier) vẫn là loại thay đổi cần audit theo mục A.

## Phân tích 4 đề xuất

### 1. Status branch propose/backlog trước `todo`

Industry precedent (GitHub Projects, Linear): "Backlog" là 1 cột status riêng
đứng trước "Todo" — phổ biến, tên tự giải nghĩa.

- **Khuyến nghị tên:** `backlog`, KHÔNG dùng `propose`/`proposed` (xung đột
  lịch sử với 0024, xem mục A/C ở trên — đúng lý do 0024 đã đổi tên khỏi
  "proposed").
- **Việc phải làm:** thêm giá trị vào `STATUSES` (`work.mjs:37`), cạnh mới
  `backlog→todo` (promote) trong `fsm.mjs`, loại `backlog` khỏi tập frontier/
  `ready` (hiện lọc `status: todo` — thêm điều kiện dễ), default cho item
  thiếu field vẫn là `todo` (zero-migration cho item cũ, đúng khuôn RUL11/
  optional-additive toàn schema hiện tại).
- **Risk:** MEDIUM — thêm giá trị + có thể thêm precondition mới → audit mọi
  consumer đọc `STATUSES`/`fsm.mjs` (không chỉ frontier).

### 2. Type hierarchy: mvp > milestone > task > bug (+ epic?)

**CẬP NHẬT (round 14, 2026-08-09) — nhánh `epic` của mục này ĐÃ QUYẾT + ĐÃ
SHIP, độc lập với report này, tìm ra lúc quét lại codebase:**
`docs/history/execution-fanout/DISCUSSION.md` (tsk-umc, round 8, decision
`D4`, `fgos decision` seq `8919`, 2026-08-07) — câu hỏi "cụm component/epic
quản lý/triển khai thế nào" — chốt: dùng **`goalTier` + `targets` đã có
sẵn** (không đẻ field/cạnh mới): `targets` không đi qua `resolveRoot` ⇒ mỗi
target giữ root riêng ⇒ merge độc lập lên main, đúng shape "epic gồm nhiều
item độc lập, mỗi cái tự merge". Lỗ hổng duy nhất tìm ra lúc đó (`fgos
rollup` chỉ hiểu `parent`, không hiểu `targets`) đã vá — `tsk-1ug` ("fgos
rollup hiểu targets, không chỉ parent"), status `cleanup` (ship thật).
Khớp hướng round 1 dưới đây ("epic không cần field mới") nhưng khác cơ chế
thật: là `goalTier`+`targets`, không phải `parent`/`deps` như round 1 đoán.
**Phần `kind` enum (task/bug) của mục này VẪN CHƯA GIẢI** — không tìm thấy
commit/decision nào liên quan, xem câu hỏi #3 cập nhật dưới.

Search ngoài xác nhận: Jira/Linear/GitHub xếp **epic là CHA** của
story/task/bug — 3 loại này là PEER cùng cấp dưới epic, KHÔNG phải một mắt
xích tuyến tính "story cha task" hay ngược lại. mvp/milestone là khái niệm
GOAL/timebox, khác hẳn epic/story/task/bug (đơn vị công việc) — 2 trục độc
lập trong mọi hệ thống tham chiếu được, không riêng gì fgOS.

Ứng với fgOS, đây thực ra là 2 câu hỏi độc lập:

| Câu hỏi | Field tương ứng | Hiện trạng |
|---|---|---|
| (a) Việc này thuộc LOẠI gì (task/bug/epic-như-nhãn) | `kind` | free text hôm nay — cần enum hóa nếu muốn ràng buộc |
| (b) Việc này track theo mục tiêu nào (mvp/milestone) | `goalTier` | ĐÃ CÓ, đủ dùng, không cần field mới |

- **Khuyến nghị:** KHÔNG xâu chuỗi tuyến tính. Giữ `goalTier` độc lập; nếu
  muốn ràng buộc `kind`, enum hóa nó thành TRỤC NGANG (`task`/`bug`/...,
  peer), không phải thứ bậc cứng. "Epic" nên là NHÃN cho item có
  children/deps trỏ vào — model hiện tại ĐÃ đúng ý này (`work-state.md`
  Data Dictionary #5: "epic chỉ là item thường được deps trỏ vào"), không cần
  hardcode giá trị `epic` riêng trừ khi cần lọc/hiển thị rõ ràng.
- **Điểm cần cảnh giác nếu enum hóa `kind`:** xác định trước đó là DAG
  (epic → {story,task,bug} → subtask, kiểu Jira) hay thật sự chain tuyến
  tính — 2 shape khác nhau kéo theo validate khác nhau. User đã nói quan hệ
  "xét sau" — hợp lý, nhưng khi xét, đừng mặc định chain chỉ vì cách viết
  liệt kê ban đầu dùng dấu `>`.

**Mở rộng — vì sao epic KHÔNG cần sửa gì (round 5, khác hẳn `status`/`kind`):**

`parent`/`deps` là field STRUCTURAL (chỉ chứa id trỏ tới item khác), không
phải field VOCAB (chuỗi chữ mang nghĩa domain) — không có "giá trị" nào để
domain tự đặt tên riêng, trỏ id thì domain nào cũng giống nhau. Đây chính là
lý do epic không bị coding-bias như `status`/`kind`. Rút ra 1 quy luật áp
được cho TOÀN BỘ schema, không riêng epic:

| Loại field | Ví dụ | Rủi ro domain-bias | Cần category/label không |
|---|---|---|---|
| Structural (chỉ chứa id/reference) | `parent`, `deps` | KHÔNG | Không cần |
| Vocabulary (chuỗi chữ mang nghĩa) | `status`, `kind` | CÓ | Cần (mục 6) |
| Declared marker (field riêng, value đã generic sẵn) | `goalTier` | Thấp | Không cần, đã ổn |

**Đối chiếu Jira:** Jira KHÔNG làm epic thuần structural — gán epic là 1 GIÁ
TRỊ issue-type thật (`type: Epic`), item con link qua field `Epic Link`
RIÊNG (không dùng chung cơ chế parent/subtask). fgOS chọn khác: epic = item
thường + có con qua `parent`/`deps` — TÁI DÙNG cây phân rã sẵn có, không
thêm khái niệm mới. Đơn giản hơn Jira, đổi lại: không có field "đây LÀ
epic" tường minh — phải SUY RA (item có con hay không), không lưu trực
tiếp.

**Muốn hiển thị/lọc "epic" thì sao (không thêm field):**

```js
const isEpic = (item, allItems) =>
  allItems.some((i) => i.parent === item.id || i.deps.includes(item.id));
```

Tính lúc đọc (derived), domain-agnostic 100% vì dựa trên `parent`/`deps`
sẵn có — KHÔNG cần thêm field `isEpic`/`type: 'epic'` vào schema. Nếu 1
domain muốn trang trí thêm cho epic của riêng nó (VD marketing gọi là
"campaign", gắn icon/màu riêng) — đó là việc của `domainFields` (mục #3),
không đụng cơ chế cây chung.

**Liên hệ `goalTier`:** `goalTier` và "epic" là 2 trục KHÁC NHAU, cả 2 đều
foundation-level nhưng cơ chế khác — `goalTier` là field KHAI BÁO (người
submit tự đánh dấu lúc `add`), epic là thuộc tính SUY RA (tính từ cấu trúc
cây). 1 item có thể vừa là epic (có con) vừa mang `goalTier: milestone` —
không xung đột, không trùng lặp.

**Nếu enum hóa `kind` — áp ĐÚNG khuôn category/label của `status` (round 6):**
`kind` rơi vào nhóm VOCABULARY (bảng phân loại field ở trên) — giống
`status`, không giống `parent`/`deps`/`goalTier` — nên nếu enum hóa, cần
tách `kindLabels` (domain tự khai) khỏi `kindCategory` (foundation, nhỏ,
cố định), y hệt cơ chế `status`/`statusCategory` đã chốt ở mục 6.

```js
coding: {
  kindLabels: {
    feature: 'deliverable',
    task:    'deliverable',
    bug:     'defect',
    devops:  'infra',
  },
},
marketing: {
  kindLabels: {
    'long-content': 'deliverable',
    social:         'deliverable',
    banner:         'deliverable',
  },
},
```

`kindCategory` đề xuất: `deliverable / defect / infra / chore`. Marketing cả
3 label đều rơi `deliverable` — KHÔNG SAO, nhiều label 1 domain trỏ về cùng
1 category là bình thường (y hệt `blocked`/`awaiting-human` coding từng gộp
chung `in-progress`); domain không bắt buộc phủ đủ mọi category.

**Khác biệt ưu tiên so với `statusCategory`:** `statusCategory` CẦN THIẾT
THẬT (compound-learn/frontier/rollup dựa vào nó để chạy domain-agnostic —
mục 6). `kindCategory` thì KHÔNG — `kind` hôm nay không tham gia bất kỳ
transition/gate nào (`fsm.mjs` không đọc `kind`), thuần mô tả. `kindCategory`
chỉ có giá trị cho báo cáo/lọc chéo-domain ("đếm bao nhiêu defect toàn hệ
thống"), KHÔNG phải điều kiện bắt buộc hệ thống chạy đúng — ưu tiên thấp
hơn nhiều, làm sau khi có domain thật thứ 2 cũng không sao (khớp câu hỏi mở
#2/#9).

### 3. Nested domain fields (`{coding: {}, marketing: {}}`)

- fgOS ĐÃ áp đúng pattern này ở mức `stage` (`DOMAINS` registry,
  `workflow-stage-graphs.mjs`) — mở rộng xuống field-level là NHẤT QUÁN kiến
  trúc sẵn có, không phải ý tưởng mới.
- Search ngoài xác nhận khuyến nghị ngành: field ổn định/dùng chung
  (id/title/status/kind/deps/...) ở top-level; field riêng biệt/hay đổi theo
  domain đẩy vào 1 namespace lồng, validate bằng schema riêng cho từng
  domain (không để freeform JSON trôi dạt không kiểm soát).
- **Khuyến nghị cụ thể:** thêm field optional mới (ví dụ `domainFields`),
  hình dạng `{ [domainName]: {...} }`, optional-additive đúng khuôn D8/RUL11
  hiện có (vắng mặt = item cũ không bị chạm). Khai optional `fieldSchema`
  trong từng entry `DOMAINS[domain]` (giống `skillMap` đã có) để
  `validateWork` chỉ validate ĐÚNG namespace khớp domain của item — tránh
  field rác không kiểm soát.

**Chi tiết ghi/sửa/replay (round 2):**

- **Chỉ namespace khớp `work.domain` hiện tại của item mới được đọc/validate**
  — namespace domain khác vẫn tồn tại nếu có (không xóa), nhưng bị bỏ qua.
- **Ghi:** qua đúng 2 cửa sẵn có, không thêm cơ chế mới. `work.add` — payload
  mang `domainFields` lúc khai. `work.edit` — thêm `domainFields` vào
  `EDITABLE_FIELDS` (`store.mjs:186`). Patch **ghi đè toàn object** mỗi lần
  (latest-wins), KHÔNG deep-merge từng key con — đúng khuôn `refs`/`deps`/
  `acceptance` đang dùng, tránh logic merge phức tạp.
- **Fold/replay:** đi qua spread-fold sẵn có (`{...work, ...patch}`) — zero cơ
  chế mới, giống `docsRef`/`acceptance` đã optional-additive.
- **Compat:** field vắng mặt = item cũ 0 byte thay đổi (RUL11).

```js
domainFields: {
  coding:    { /* field riêng domain coding */ },
  marketing: { /* field riêng domain marketing */ },
}
```

### 4. Status flow riêng theo domain vs status flow chung

Đây là ask **mâu thuẫn trực tiếp** quyết định đã khóa (mục A). Nhưng đọc kỹ
ví dụ user đưa ra:

> chung: backlog/todo/in-progress/review/done
> domain-coding: backlog/todo/in-progress/awaiting-approval/done

...thực ra đây CHÍNH LÀ những gì `stage`+`status` cộng lại ĐÃ làm hôm nay:
domain `coding` có thêm `stage: compound-learn` mà domain khác không có;
`status: awaiting-approval` là CHUNG cho mọi domain (data thật: domain
`synthetic` cũng đi qua đúng status này, theo chính nội dung xác nhận trong
`0024`). Nói cách khác, "domain-coding có thêm 1 bước domain khác không có"
— hệ thống ĐÃ biểu diễn đúng điều này, nhưng qua trục `stage`, không qua
nhánh riêng của `status`.

- **Khuyến nghị ban đầu (round 1):** KHÔNG làm status flow phân nhánh theo
  domain — biểu diễn khác biệt qua `stage`. **ĐÃ SỬA ở round 4** sau khi đào
  sâu "status theo stage lưu sao" (dưới) và phát hiện lỗ hổng category-only
  (mục 6): domain THẬT SỰ cần bảng transition riêng để không mất độ mịn (ví
  dụ `blocked→awaiting-human` không hợp lệ ở coding — chỉ domain đó mới biết
  điều này, 1 bảng chung không thể vừa domain-agnostic vừa giữ đúng độ mịn
  đó). Chốt cuối: cho phép domain sở hữu bảng transition CỦA CHÍNH NÓ (đúng
  ý ask #4 gốc), đổi lại: (a) đây là supersede thật base-workflow-model
  D1-D3, cần decision record mới đúng khuôn `0024`/`0006`; (b) mọi cơ chế
  domain-agnostic (compound-learn, frontier, rollup...) phải tự chuyển sang
  đọc `statusCategory` thay vì literal `status`, không được giả định chung 1
  bảng transition nữa — audit đủ theo mục A.

**"Status theo stage" (round 2 follow-up) — user đồng ý domain không quản
status, nhưng hỏi riêng: mỗi STAGE có tập status hợp lý riêng không, lưu ở
đâu?**

Cần tách 2 loại trước khi chọn:

1. **ADVISORY** — mỗi stage gợi ý 1 tập status hợp lý, không chặn gì.
2. **HARD GATE** — validate/fsm thật sự từ chối status ngoài scope của
   stage hiện tại — 1 precondition mới.

Lưu ý quan trọng: vì mỗi DOMAIN sở hữu 1 danh sách stage riêng, để stage
giới hạn status thì domain vẫn GIÁN TIẾP chi phối status — qua đường vòng
domain→stage-list→status-scope, hiệu ứng cuối giống domain quản status trực
tiếp. Điểm khác thật với ask #4 gốc: `fsm.mjs`/bảng chuyển-status chính vẫn
domain-agnostic, 1 nguồn duy nhất — chỉ thêm 1 lớp lọc phía trên, không sửa
`fsm.mjs`.

**Chỗ lưu cụ thể:** map optional mới trong từng entry `DOMAINS[domain]`
(`workflow-stage-graphs.mjs`), song song `stepMap`/`skillMap` đã có:

```js
coding: {
  stages: [...], stepMap: {...}, transitions: [...], skillMap: {...},
  statusScope: {
    clarify:          ['todo', 'doing', 'awaiting-human'],
    decompose:        ['todo', 'doing', 'awaiting-human'],
    executing:        ['todo', 'doing', 'blocked', 'awaiting-approval', 'done', 'wontfix'],
    'compound-learn': ['todo', 'doing', 'done'],
  },
}
```

Đọc qua hàm mới `statusScopeForStage(domain, stage)`, cùng khuôn
`stageForStep`/`skillForStage` đã có — domain chưa khai `statusScope` (mọi
domain hôm nay) trả `undefined` = "không giới hạn", KHÔNG BAO GIỜ throw.

**Triển khai 2 bước, không gộp:** bước 1 (risk thấp) — chỉ ADVISORY, dùng ở
`fgos list`/discovery-judge để cảnh báo, KHÔNG đụng `fsm.mjs`/`moveWork`.
Bước 2 (nếu thật cần chặn) — nâng lên HARD GATE, quay lại đúng cost audit ở
mục A, cần decision record riêng, không làm chung đợt.

## Tổng quát hóa: category vs label

**Chẩn đúng gốc rễ (round 2):** cả `backlog` (status) lẫn `kind` enum tương
lai đang bị CÙNG 1 lỗi — flat enum trộn "khái niệm chung mọi domain cần" với
"từ vựng riêng của domain `coding`".

- `backlog` tự nó LÀ khái niệm chung (mọi domain đều có "chưa duyệt vào kế
  hoạch"). Nhưng nó sắp bị nhét vào enum phẳng đã có sẵn 3 giá trị lộ rõ
  coding-bias: `awaiting-approval` (khái niệm PR/merge review), `wontfix`
  (thuật ngữ bug-tracker kinh điển), `blocked` reason `verify-fail` (khái
  niệm "test chạy fail"). Thêm `backlog` không sai, nhưng không sửa gốc.
- `goalTier` (mvp/milestone) đã generic thật — thuật ngữ product/roadmap
  chung, không cần sửa. `kind` free-text hôm nay cũng đã generic. Bias chỉ
  lộ ra NẾU sau này enum hóa `kind` mà đưa cứng `bug` vào — `bug` là khái
  niệm software-defect, marketing không có "bug", nó có
  "compliance-issue"/"revision-request".

**Precedent xác nhận qua Linear (WebSearch round 2):** mỗi TEAM tự đặt tên
status tùy ý ("Ready to Merge", "Won't Fix", "Could not reproduce"...), nhưng
MỌI status bắt buộc thuộc 1 trong 5 **category** cố định toàn hệ thống
(nguyên bản Linear: `backlog / unstarted / started / completed / canceled`
— fgOS đổi tên 2 cái giữa cho dễ đọc, giữ nguyên ý nghĩa: `backlog / todo /
in-progress / completed / canceled`). Logic cơ học (board, filter, "coi là
xong chưa") đọc CATEGORY, không đọc literal tên status.

**Đối chiếu GitHub Projects** (hướng ngược lại): issue-type là 1 từ vựng
CHUNG toàn org (`bug`/`task`/`feature` mặc định), không cho mỗi repo tự đặt
tên riêng — giữ rollup cross-repo còn nghĩa, đổi lại mất linh hoạt per-team.
fgOS đã chọn hướng domain-tự-khai (stage per domain) từ đầu → nên đi tiếp
Linear-style (category chung + label domain tự đặt) nhất quán hơn GitHub-
style (vocab chung cứng).

**Chốt kiến trúc (round 3) — 2 FIELD RIÊNG BIỆT trên work item, không phải 1
field + hàm lookup derive-on-read.** Lý do KỸ THUẬT bắt buộc, không chỉ gọn
hơn: luật L3 của fgOS (`docs/platform-foundations.md` — "truth ở JSONL, db là
view", nhật ký phải replay lại NGUYÊN VẸN mọi lúc). Nếu category chỉ tính từ 1
bảng lookup domain (`statusLabels`) LÚC ĐỌC, mà bảng đó sau này bị sửa/thêm
domain, replay lại 1 event CŨ sẽ ra category KHÁC lúc ghi ban đầu — vỡ
nguyên tắc replay xác định. Category bắt buộc là field RIÊNG, ghi cứng vào
event lúc ghi, không derive lúc replay.

| Field | Tầng | Vai trò | Ai ghi, lúc nào |
|---|---|---|---|
| `statusCategory` (MỚI) | Foundation — generic, mọi domain giống nhau, ~6 giá trị cố định | `fsm.mjs` transition graph đọc field NÀY; `frontier.mjs`/`graph-metrics`/"coi là xong chưa" cũng đọc field NÀY | Tự động tính từ `DOMAINS[domain].statusLabels[status]` **tại thời điểm ghi event** (`work.add`/`work.move`), đóng băng vào event — KHÔNG BAO GIỜ tính lại lúc replay |
| `status` (đã có, giữ nguyên) | Domain-specific — nhãn người đọc, domain tự đặt chữ | Hiển thị, và validate shape ("chữ này có phải nhãn hợp lệ của domain X không") | Người/agent gọi `add`/`move` như hôm nay, byte-for-byte không đổi |

```js
// work.mjs — mới, generic, KHÔNG BAO GIỜ domain sửa được
export const STATUS_CATEGORIES = Object.freeze(
  ['backlog', 'todo', 'in-progress', 'review', 'completed', 'canceled']
);
```

```js
// workflow-stage-graphs.mjs — mỗi domain khai statusLabels, DÙNG ĐỂ TÍNH
// statusCategory LÚC GHI, không phải để đọc lúc replay
coding: {
  stages: [...], stepMap: {...}, transitions: [...], skillMap: {...},
  statusLabels: {
    backlog: 'backlog',
    todo: 'todo',                 // label và category trùng chữ — identity mapping, không sao
    doing: 'in-progress',
    blocked: 'in-progress',
    'awaiting-human': 'in-progress',
    'awaiting-approval': 'review',
    done: 'completed',
    wontfix: 'canceled',
  },
},
marketing: {
  statusLabels: {
    backlog: 'backlog',
    todo: 'todo',
    'in-progress': 'in-progress',
    'awaiting-client-signoff': 'review',
    done: 'completed',
    cancelled: 'canceled',
  },
},
```

**Ghi/fold cụ thể:** `statusCategory` cộng thêm trên CÙNG sự kiện `work.move`
đưa item đổi `status` — y hệt khuôn `headAtTake`/`writer` đã làm (field phụ
đóng băng tại lúc ghi, không phải derive-on-read). `validateWork` check
`status` nằm trong `statusLabels` của domain đó (shape check, giống khuôn
`STATUSES` hôm nay).

**Sửa lại (round 4) — fsm KHÔNG chạy trên `statusCategory`.** Bản round 3
nói "`fsm.mjs` transition rules chuyển hẳn sang chạy trên `statusCategory`"
— SAI, đã chứng minh bằng ví dụ thật `blocked→awaiting-human` (mục "Sửa lại
round 4" ở Tóm tắt điều hành): category là bản nén mất độ mịn, dùng nó để
validate move sẽ tự động legalize những cạnh domain chưa từng cho phép.

**Vai trò 2 field, tách bạch dứt khoát:**

| Field | Dùng để validate move (fsm) | Dùng cho cơ chế domain-agnostic |
|---|---|---|
| `status` (label, domain-specific) | **CÓ** — bảng transition của domain đó, đầy đủ, mịn | Không dùng trực tiếp (mỗi domain 1 từ vựng khác nhau) |
| `statusCategory` (foundation) | **KHÔNG** — không tham gia validate move | **CÓ** — đây là lý do nó tồn tại |

Vì sao `statusCategory` vẫn phải tồn tại dù không validate move: fgOS là 1
NỀN TẢNG (foundation) mà nhiều domain cưỡi lên — các cơ chế LÕI của fgOS
(không phải của riêng domain nào) cần 1 cách đọc "item này đang ở đâu" mà
KHÔNG PHẢI học từ vựng của từng domain. Đây chính là "hồn" của fgOS. Danh
sách cơ chế lõi hôm nay đang đọc literal `status` (coding-specific), cần đổi
sang đọc `statusCategory`:

- **Compound-learn** (`fgos compound`) — hôm nay đòi `status === 'awaiting-approval'`. Đổi sang `statusCategory === 'review'`.
- **Bài học lúc đóng** (learning capture tự động lúc item tới `done`) — đổi sang `statusCategory === 'completed'`.
- **Outcome/friction** (self-improvement loop, disposition `parked`/`halted`) — đổi sang đọc category thay vì literal `wontfix`/`blocked`.
- **Frontier** (`fgos ready`) — đổi sang `statusCategory === 'todo'`.
- **Rollup** ("k/n done") — đổi sang `statusCategory === 'completed'`.
- **Discovery-judge/agent feedback** — mọi chỗ hỏi "item còn mở/đã chốt chưa" — đọc category.
- **RUL12 (mở dependent khi dep `done`)** — cơ chế thứ 7, phát hiện muộn (round 9) qua `tsk-3p1` (xem "Thứ tự triển khai" dưới) — hôm nay đọc literal `done`; ứng viên đổi sang đọc `statusCategory === 'completed'`, NHƯNG `tsk-3p1` cho thấy `completed` có thể KHÔNG ĐỦ MỊN (cần phân biệt "merge xong" với "đóng ceremony/compound-learn xong" ngay trong category đó) — chưa có đáp án, xem câu hỏi mở.

7 giá trị `STATUSES` hôm nay KHÔNG đổi tên — chúng trở thành "bảng transition
+ label của domain `coding`" nguyên xi, migration = 0 cho field `status`.
Event cũ thiếu `statusCategory` (mọi event hôm nay) — đọc absent, backfill 1
lần qua migration script (cùng khuôn
`scripts/migrate-status-proposed-to-awaiting-approval.mjs` đã có tiền lệ)
hoặc lazy-default `undefined`-an-toàn, tùy mức độ cần gấp;
`frontier.mjs:138` `RESOLVED_STATUSES = new Set(['done','wontfix'])` → đổi
sang check `statusCategory` `completed`/`canceled` — đây mới là phần việc
TỔNG QUÁT HÓA thật.

Cùng pattern áp cho type nếu sau này enum hóa `kind`: field mới `kindCategory`
+ domain khai `kindLabels: { bug: 'defect', task: 'deliverable' }`, đóng băng
`kindCategory` lúc ghi — cùng lý do L3, không derive-on-read. Vai trò cũng
tách bạch y hệt status: `kind` (label) validate ở tầng domain nếu cần,
`kindCategory` chỉ phục vụ đọc chéo-domain.

**Vì sao làm bây giờ rẻ nhất:** hôm nay chỉ có `coding` (thật) + `synthetic`
(throwaway) — chưa domain thật thứ 2 nào tồn tại. Đây là thời điểm rẻ nhất
để tách category/label, đúng bài học đã ghi ở mục A ("audit mọi consumer"
tốn hơn nhiều khi đã có domain thật khác dựa vào literal string). Đợi tới
khi domain thật thứ 2 ship với `wontfix` cứng trong code, cost audit nhân
lên.

## Đề xuất tổng hợp

**STATUS THẬT — sau khi scan lại codebase (round 13, 2026-08-07), xem chi
tiết ở mục "Kết quả thật" cuối report:** `tsk-38t` (#3/#4/#6 dưới) ĐÃ SHIP,
merged, decision record `0027` viết xong (thu hẹp đúng phạm vi so với round 4
dưới đây). `tsk-2rp` (`verifyKind`, không có số # riêng — nằm ở mục "Chưa bàn
tới #1") BỊ BÁC, thay bằng thiết kế attestation-artifact. `tsk-3p1` (nằm ở
mục "Việc liên quan phát hiện thêm") đóng `wontfix`, câu hỏi gốc (mở
dependent sớm) CHƯA rõ đã giải hay bị bỏ rơi. Bảng dưới giữ nguyên NGUYÊN VĂN
lúc quyết (round 1-4) để lịch sử không mất — đọc cột mới nhất ở mục "Kết quả
thật" cho tình trạng hiện tại.

| # | Việc | Làm hay không (lúc quyết, round 1-4) | Risk | Kết quả thật (round 13) |
|---|---|---|---|---|
| 1 | Backlog status trước todo | Làm, NHƯNG như 1 **category** chung (`backlog`), không phải giá trị phẳng nhét cạnh `wontfix`/`awaiting-approval` | MEDIUM | KHÔNG làm đúng vậy — `statusCategory` thật (0027) không có category `backlog`; 6 status đoạn đầu map vào `todo/in-progress/review/canceled`, không có nhóm `backlog` riêng |
| 2 | Type hierarchy | Tách `kind`(task/bug/epic-nhãn) khỏi `goalTier`(mvp/milestone) đã có; đừng chain tuyến tính; nếu enum hóa `kind`, áp category/label như status | LOW (nếu tách đúng trục) | CHƯA làm — `kind` vẫn free text, ngoài phạm vi `0027` |
| 3 | Nested domain fields | Làm — nhất quán `DOMAINS` registry pattern sẵn có, `domainFields` optional-additive, ghi đè toàn object mỗi lần edit | LOW-MEDIUM | **ĐÃ SHIP** — `tsk-38t-6`, field `domainFields` đúng shape đề xuất |
| 4 | Status flow theo domain | **CHỐT (round 4):** LÀM — domain sở hữu bảng transition riêng (full fidelity, không lủng); `statusCategory` KHÔNG dùng để validate move, chỉ phục vụ cơ chế domain-agnostic (mục 6) | HIGH — supersede thật D1-D3, cần decision record + audit toàn bộ consumer `fsm.mjs` | **ĐÃ SHIP, NHƯNG THU HẸP HƠN round-4 ĐỀ XUẤT** — domain KHÔNG sở hữu bảng transition (`TRANSITIONS` vẫn 1 bảng CHUNG, DISCUSSION.md §1/§6 tự nhận đã BÁC khung round-4 gốc); domain chỉ sở hữu `statusLabels` (map 6 status đầu → `statusCategory`, KHÔNG phải literal status/cạnh chuyển). 4 status đoạn đuôi (`delivered/retrospective/cleanup/done`) là chuỗi phổ quát MỚI, report round 1-12 chưa từng nghĩ tới — xem `0027` |
| 6 mới | Tách `status` (label, domain sở hữu, dùng validate move) khỏi `statusCategory` (foundation, dùng cho compound-learn/frontier/rollup/outcome...) | Nên làm cùng đợt với #4 — 2 field bổ trợ nhau, không tách rời được nữa sau round 4 | MEDIUM-HIGH (đổi mọi consumer domain-agnostic sang đọc category, xem danh sách mục 6) | **ĐÃ SHIP** — `tsk-38t-2`/`tsk-38t-4`, `statusCategory` đóng băng lúc ghi, không dùng validate move (đúng thiết kế), domain thật thứ 2 `fixture-marketing` chứng minh end-to-end (`tsk-38t-7`) |

**Về câu hỏi riêng "skill fgos-coding-planning coi lại việc dùng harness ghi task
cho đúng quan hệ/type":** phụ thuộc kết quả quyết định mục 2 (type hierarchy)
trước — chưa nên implement, để ở mục câu hỏi mở dưới.

## Chưa bàn tới

Report tới giờ tập trung vào `status`/`kind` (2 field vocab). Rà lại toàn bộ
cuộc thảo luận + spec đã đọc, còn 6 khoảng trống LIÊN QUAN trực tiếp mục tiêu
multi-domain mà CHƯA đào sâu — xếp theo mức độ nghiêm trọng:

### 1. `verify` + `return` — coding-bias NẶNG NHẤT, sâu hơn cả status/kind

`verify` là free text, nhưng `fgos return` **TỰ ĐỘNG CHẠY nó như 1 lệnh
shell thật** trong working directory (goal-check). Coding: `npm test && ...`
chạy được. Marketing: "verify" kiểu "khách đã ký duyệt chưa" — không có
lệnh shell nào trả về true/false cho việc đó. Nếu không giải quyết được,
toàn bộ cửa pull `take`/`return` có thể KHÔNG dùng được cho domain không
phải code — nặng hơn vấn đề status/kind vì nó chặn domain "chạy được", không
chỉ "khai được".

Cùng nhóm: `headAtTake`/`headAtReturn`/`branchHeadAtTake`/`branchHeadAtReturn`
— literally commit hash của git repo, vô nghĩa với domain không có
git-tracked deliverable (Google Doc, banner Canva).

**Đào sâu (round 7, grounded qua code thật) — nặng hơn dự đoán ban đầu:**

`src/runner/goal-check.mjs` — `runGoalCheck(item, cwd, timeoutMs)` gọi thẳng
`spawn(item.verify, { shell: true, cwd })`. Comment đầu file ghi rõ chủ đích:
*"one goal-check implementation, never two"*. Grep thật trong `bin/fgos.mjs`
xác nhận hàm NÀY được dùng ở **cả 3 verb**: `return` (dòng ~1488/1543, worker
tự báo xong), `approve` (dòng ~2008, người duyệt merge cuối), `reject` (dòng
~2158, re-verify để log). Nghĩa là: **KHÔNG có đường "người chỉ cần nói yes"
nào tồn tại hôm nay** — kể cả `approve` (cửa người duyệt cuối) vẫn bắt buộc 1
lệnh shell chạy ra exit-0 THẬT mới cho merge. Marketing không có lệnh shell
nào trả lời "khách đã ký duyệt banner chưa" → cả `return` VÀ `approve` đều
kẹt, không chỉ `return`.

**Vì sao đây là thay đổi kiến trúc LỚN HƠN status/kind:** `goal-check` không
phải 1 field work-item bình thường — nó là NGUYÊN TẮC LÕI của toàn hệ thống
("không tin lời tự báo của caller, luôn tự verify độc lập"). Sửa nó ảnh
hưởng runner + cả 2 cửa pull (`take`/`return`) + cổng duyệt PR nội bộ —
phạm vi audit rộng hơn hẳn `fsm.mjs`.

**Đề xuất tối thiểu (YAGNI — không làm executor framework tổng quát ngay):**
thêm 1 field foundation nhỏ, `verifyKind`, enum CHỈ 2 giá trị (không nhiều
loại executor ngay từ đầu):

- `verifyKind: 'shell'` (mặc định, coding) — y hệt hôm nay, `runGoalCheck`
  spawn như cũ, 0 thay đổi hành vi coding.
- `verifyKind: 'manual-confirm'` (mới) — `runGoalCheck` KHÔNG spawn gì cả;
  goal-check pass = "1 người (role `human`, không phải `session`/`runner`)
  đã gọi `approve`". Tái dùng ĐÚNG cơ chế người-duyệt sẵn có (`approve` đã
  tách bạch role người/máy qua `claimRole`) — không phát minh cửa mới, chỉ
  đổi ĐIỀU KIỆN pass bên trong `runGoalCheck` theo `verifyKind`. `return`
  (worker tự báo) không dùng được cho domain `manual-confirm` — không ai
  "tự verify" thay người được; item domain đó luôn phải đi qua người.

**Risk: HIGH** — sửa `runGoalCheck` (dùng ở runner + 2 cửa pull + `reject`)
là core trust mechanism, cần audit rộng hơn hẳn mọi thứ đã bàn trước đây
trong report này.

**Đang handle:** `tsk-2rp` (stage `clarify`, tier `heavy`, risk `high`) —
`refs` trỏ ngược report này + `src/runner/goal-check.mjs` + `bin/fgos.mjs`.

**Re-audit (round 12, 2026-08-01) — con số "8 call site" (round 10) SAI, đúng
là 9, và thiếu đúng verb nguy hiểm nhất:** đọc lại `bin/fgos.mjs` dòng
2310-2484 phát hiện `case 'catchup':` (dòng 2340) — verb RIÊNG BIỆT đứng
ngay sau `case 'reject':`, KHÔNG phải một nhánh của `reject` như lần audit
trước lầm tưởng. `reject` (2310-2322) đúng là không gọi `runGoalCheck`;
`catchup` thì gọi 2 lần (2416 nhánh "already-caught-up", 2475 nhánh
"clean-merge"). Danh sách 9 call site chính xác: `return` branch-source
(1770) + main-source (1828), `approve` (2288), `catchup` x2 (2416/2475),
`merge.mjs` already-merged (702) + verify-before-commit (748), `loop.mjs`
startupReap (361) + dispatchClaimedItem (694).

`catchup` nguy hiểm hơn cả `return`'s vòng-tròn-tự-báo (round trước đã ghi):
nó chạy với `role: 'runner'` (dòng 2422) — **không có người nào trong đường
này để "gọi approve"** cả, khác `return` (ít nhất còn 1 claimant người/session
thật đứng gọi). Định nghĩa `manual-confirm: pass = human đã gọi approve` gặp
2 đường đều sai với `catchup`: áp cứng → item domain đó kẹt `blocked` vĩnh
viễn mỗi lần catchup chạy (không ai thỏa điều kiện); mặc định luôn-pass →
runner tự merge mà không ai xác nhận gì, phá đúng mục đích `manual-confirm`
định bảo vệ. Chưa có lời giải — `catchup` cần 1 thiết kế RIÊNG, không dùng
chung logic với `return`. Đã sửa vào acceptance clause 4 + clause 8 mới của
`tsk-2rp` (13 clause, tăng từ 7 lần trước).

### 2. Context-discovery/decompose CỨNG vào tên stage của `coding` (đã tự nhận trong spec, đọc lúc grounding nhưng chưa mang vào bàn)

`work-state.md`: *"`resolveDiscovery`/`resolveDecompose` là hai bộ máy phán
CỐ ĐỊNH theo tên stage của `coding` (`clarify`/`decompose`), chưa
domain-hóa"* — domain thứ 2 THẬT (marketing) hôm nay tự động KHÔNG dùng được
context-discovery/chia-việc. Không phải rủi ro tương lai — giới hạn ĐÃ CÓ
SẴN, tự nhận trong spec ("Open Gaps").

### 3. `DOMAINS` registry là literal JS đóng băng — thêm domain = sửa code

`workflow-stage-graphs.mjs`'s `DOMAINS` là `Object.freeze` cứng trong
source — thêm `marketing` phải sửa file JS + deploy, không khai qua CLI/data
được. Cần hỏi: domain có cần add được runtime (giống `submit` 1 item) không,
hay sửa code là chấp nhận được?

### 4. CLI/reporting layer hardcode literal status

`docs/reference/triage-table-columns.md`: cột `status` render "raw status
..., rendered as-is" — nếu domain khác dùng label khác, hiển thị sẽ lẫn
nhiều domain khác nhau trong 1 cột, không thống nhất. Chưa liệt vào danh sách
consumer cần audit (mục 6 mới có 6 cơ chế compound-learn/frontier/..., thiếu
tầng CLI display).

### 5. Kế hoạch version hóa event schema (`v`) khi dồn nhiều field mới

`statusCategory`, `domainFields`, (sau này) `kindCategory` — mỗi field mới
nên bump `SCHEMA_VERSION` (hiện `v: 3`) theo đúng khuôn đã có, nhưng ship
RIÊNG LẺ từng field hay GỘP 1 đợt version? Chưa bàn thứ tự triển khai.

### 6. Chưa có kế hoạch TEST chứng minh thiết kế mới đúng

`synthetic` domain có `test/e2e/synthetic-domain.test.mjs` CHỨNG MINH
domain-agnostic — thiết kế category/label mới (round 4-6) chưa có kế hoạch
test tương tự (1 domain giả lập thứ 2 thật, có `statusLabels`/`kindLabels`
riêng, chạy qua `take`/`return`/`compound`) để verify trước khi tin tưởng.

**Ưu tiên đào sâu tiếp:** #1 (verify/return) — nếu domain marketing không
dùng được `take`/`return` do giả định shell-command, mọi thiết kế
status/kind vừa chốt chưa đủ để domain đó "chạy được", chỉ mới đủ để nó
"khai được".

## Thứ tự triển khai (2 phase, round 8)

Chốt: `verifyKind` (mục "Chưa bàn tới" #1) và `statusCategory`/`kindCategory`
(mục 6) KHÔNG phụ thuộc lẫn nhau về kỹ thuật — đụng 2 subsystem khác nhau
(`goal-check.mjs` vs `fsm.mjs`), tách phase được, không phải tách cho vui.

**Phase 1 — `verifyKind` (làm/quyết TRƯỚC, đã tạo `tsk-2rp`):**

- Lý do đi trước: đây là cái CHẶN CHỨC NĂNG thật — thiếu nó, `return`/
  `approve` của domain không phải coding (VD marketing) KHÔNG CHẠY ĐƯỢC, bất
  kể `status`/`kind` có đẹp/generic cỡ nào. `status`/`kind` coding-bias chỉ
  là vấn đề ngữ nghĩa/hiển thị — domain khác vẫn CHẠY ĐƯỢC nếu tạm dùng chữ
  coding, chỉ không tự nhiên.
- Phạm vi audit hẹp hơn hẳn: đúng 4 call site (`return` x2, `approve`,
  `reject`) trong `runGoalCheck`, so với `fsm.mjs` rải khắp frontier/runner/
  pull-door/rollup.
- KHÔNG cần decision record supersede base-workflow-model D1-D3 (đó là
  chuyện riêng của `status` FSM) — `verifyKind` có thể cần 1 quyết định
  riêng, nhỏ hơn, vì đụng invariant "one goal-check implementation, never
  two" (comment gốc `goal-check.mjs`) — nhưng KHÔNG phải supersede D1-D3.

**Đào sâu (round 10) — phạm vi Phase 1 RỘNG HƠN mô tả ban đầu, ghi bằng
4 acceptance clause trên `tsk-2rp`:** khảo sát test thật (`test/cli/fgos.test.mjs`,
40+ test case về `return`) + 3 incident thật đã xảy ra
(`docs/history/return-approve-scoped-clean-tree/CONTEXT.md` tsk-598,
`docs/history/return-close-pre-done-work/CONTEXT.md` tsk-4on,
`docs/history/fgos-auto-release-main-checkout-lock/CONTEXT.md` tsk-45z) cho
thấy `return` KHÔNG CHỈ có 1 cổng (`verify`) mà có 3 cổng xếp chồng:

1. **Clean-tree gate** — working tree phải sạch (trừ `.fgos/`), scoped đúng
   file của item.
2. **HEAD-advance gate** — HEAD/branch phải TIẾN so `headAtTake`/
   `branchHeadAtTake` (chống-gian-lận). Có khe hẹp `--no-new-commits-ok`
   (tsk-4on) cho ca việc thật đã xong TRƯỚC claim này.
3. **Verify gate** — cái `verifyKind` đang nhắm sửa.

Thiết kế ban đầu (`shell`/`manual-confirm`, chỉ đổi `runGoalCheck`) CHỈ đụng
gate #3. Domain `manual-confirm` (không có commit git thật) sẽ LUÔN fail
gate #2 (y hệt shape bug `tsk-4on`) và gate #1 có thể không áp dụng được —
nếu không xử lý, `verifyKind` một mình không đủ cho domain đó chạy được.
`approve` còn có gate RIÊNG (refuse nếu chạy từ worktree không qua `session
start`) — chưa rõ domain `manual-confirm` có cần đường chạy khác không.
Mọi gate đều DUPLICATE qua 2 đường tách biệt (main-source/branch-source,
`test/cli/fgos.test.mjs` dòng 3416-3887 và 5556-5764) — sửa gì cũng x2 bề
mặt.

**Câu hỏi kiến trúc chưa quyết (để `fgos-coding-exploring` đào, không tự chốt ở
đây):** domain `manual-confirm` có nên đi qua `return` luôn hay không, hay
bỏ qua `return` hoàn toàn — đi thẳng `doing→awaiting-approval` qua verb/
đường riêng — thay vì nhét vào `return` rồi tắt từng gate một.

**Phase 2 — `status`/`statusCategory` + `kind`/`kindCategory` (sau, không bị
Phase 1 chặn) — filed round 11 là `tsk-38t`:**

- Domain sở hữu bảng transition riêng (đảo thật D1-D3, cần decision record
  mới) + `domainFields` (mục #3) — làm sau khi Phase 1 xong hoặc song song,
  miễn không tranh cùng file/subsystem với Phase 1.
- `tsk-38t` mang 6 acceptance clause grounded (bảng transition per-domain
  thay statusCategory để validate move, decision record supersede D1-D3,
  danh sách 6 cơ chế domain-agnostic cần đổi, gộp chung vòng explore với
  `tsk-3p1`, migration=0 cho `STATUSES` hiện có, backfill `statusCategory`
  event cũ chưa chốt) — `refs` trỏ report này + `work-state.md` +
  `0024` + `work.mjs`/`workflow-stage-graphs.mjs`/`fsm.mjs`/`store.mjs`/
  `frontier.mjs` + `tsk-3p1`. Không set `deps: [tsk-3p1]` cố ý — 2 việc GỘP
  CHUNG 1 vòng explore (xem dưới), không phải quan hệ block-trước-sau mà
  `deps` diễn tả.

**Việc liên quan phát hiện thêm (round 9) — `tsk-3p1`, GỘP vào trước khi code Phase 2:**

`tsk-3p1` ("Tách tín hiệu mở-dependent RUL12 khỏi status `done` nghiêm ngặt —
marker 'code đã ship' cộng thêm, không status FSM mới") đang tự giải quyết
ĐÚNG loại xung đột report này lặp lại nhiều lần (1 status trả lời 2 câu hỏi
khác nhau cùng lúc: `done` = "code merge xong" VÀ "đã qua ceremony
compound-learn xong", RUL50 gate cả 2 lối vào `done` bằng compound-learn).
2 lý do phải gộp, không làm tách rời:

- RUL12 là cơ chế domain-agnostic THỨ 7 (mục 6 trên) — marker của tsk-3p1
  ăn khớp `statusCategory` thế nào (giá trị con trong `completed`? đọc từ
  `stage` sẵn có? field thứ 3 riêng?) CHƯA có đáp án — quyết cùng lúc với
  thiết kế `statusCategory` để khỏi làm 2 lần/đá nhau.
- `tsk-3p1` refs `src/state/store.mjs` — ĐÚNG file Phase 2 sẽ sửa
  (`EDITABLE_FIELDS`, event fold) — làm song song không phối hợp dễ conflict
  thật.

**Khuyến nghị:** đưa `tsk-3p1` vào CHUNG 1 vòng fgos-coding-exploring với thiết kế
`statusCategory` (Phase 2), không tách 2 vòng riêng.

## Câu hỏi chưa giải quyết

1. Tên chính thức cho status mới: `backlog` hay tên khác? (đề xuất `backlog`,
   tránh mọi biến thể của "propose").
2. `kind` có nên enum hóa hẳn, hay giữ free-text và thêm field `type` mới
   riêng cho phân loại cứng (task/bug/epic-label)? Ảnh hưởng: mọi item cũ
   đang có `kind` free-text tùy ý.
3. Quan hệ giữa các type (khi xét sau) — DAG kiểu Jira (epic→{story,task,bug}
   peer) hay hình dạng khác fgOS tự chọn? **Nhánh `epic` ĐÃ GIẢI (round
   14)** — dùng `goalTier`+`targets`, xem mục 2 ở trên. Còn lại thuần
   `task`/`bug` (kind enum), chưa ai chạm.
4. `domainFields`/`fieldSchema` per-domain: có cần migrate field hiện đang
   nằm top-level (nếu có field nào chỉ dùng cho `coding`) vào namespace mới,
   hay chỉ áp cho field MỚI thêm từ nay?
5. Nếu #4 (status theo domain) vẫn cần thật (không giải quyết được qua
   `stage`) — cần use-case cụ thể nào đang bị `stage` chặn?
6. Cập nhật `docs/specs/work-state.md` Data Dictionary để bổ sung `goalTier`
   (đang thiếu trong spec dù đã có trong code) — việc riêng, độc lập 4 mục
   trên, nên làm sớm để spec không trôi khỏi code.
7. Tên 6 category status cố định (`backlog/todo/in-progress/review/
   completed/canceled`) — giữ nguyên đề xuất hay đổi tên/gộp/tách? VD
   `blocked`/`awaiting-human` gộp chung `in-progress` hay cần category riêng
   (`stuck`, `waiting-human`)?
8. `frontier.mjs:138` (`RESOLVED_STATUSES`) và mọi nơi khác đang so sánh
   literal `status === 'done'`/`'wontfix'` cần liệt kê đủ trước khi đổi sang
   đọc `statusCategory` — audit consumer thật (theo đúng bài học mục A),
   chưa làm trong report này.
9. Có generalize `kind` thành `kindCategory`/`kindLabels` ngay bây giờ không,
   hay để free-text tới khi domain thứ 2 thật xuất hiện mới cần?
10. Event cũ (mọi event hôm nay) thiếu `statusCategory` — backfill 1 lần qua
    migration script (tiền lệ `scripts/migrate-status-proposed-to-awaiting-approval.mjs`),
    hay để lazy-default `undefined`-an-toàn và chỉ event MỚI mới có? Ảnh
    hưởng: `frontier`/`graph-metrics` đọc `statusCategory` của item cũ ra
    sao trong lúc chưa backfill.
11. Domain có được quyền BỎ hẳn 1 category không dùng (VD marketing không có
    `review`)? Nếu có, audit consumer nào đang giả định MỌI domain đi qua đủ
    6 category (cùng bài học audit mục A, áp cho category thay vì status).
12. Decision record mới supersede base-workflow-model D1-D3 (round 4) — ai
    viết, viết lúc nào (trước khi code hay cùng lúc)? Cần liệt kê đủ mọi
    consumer `fsm.mjs` hôm nay trước khi viết, theo đúng khuôn "audit trước,
    quyết sau" đã áp dụng nhất quán trong report này.
13. Danh sách 6 cơ chế domain-agnostic cần đổi sang đọc `statusCategory`
    (compound-learn, bài học lúc đóng, outcome/friction, frontier, rollup,
    discovery-judge) — đã đủ chưa, hay còn chỗ khác trong code đang đọc
    literal `status` mà report này chưa quét hết?
14. (round 11, phát hiện lúc file `tsk-38t`) `add` và `submit` KHÔNG cùng bề
    mặt field — `submit` thiếu `--refs`/`--goal-tier`/`--parent`/
    `--footprint` mà `add` có (`bin/fgos.mjs`, so 2 case). Vài field
    (`goalTier`) còn bị loại khỏi `EDITABLE_FIELDS` nên item tạo qua `submit`
    KHÔNG BAO GIỜ gắn được về sau — item CÓ THẬT đã dính lỗi này: `tsk-3w3`
    (xem sửa lỗi round 11 ở đầu report). Có nên cho `submit` đủ field ngang
    `add`, hay đây là khoảng cách CỐ Ý ("cửa công khai" `submit` tối giản
    hơn `add` có chủ đích)? Ngoài phạm vi 4 đề xuất gốc nhưng cùng họ vấn đề
    (field vắng mặt vĩnh viễn không sửa được) — nên hỏi riêng, không lẫn vào
    quyết định status/kind.
15. (round 13, phát hiện lúc scan lại codebase) `tsk-3p1` đóng `wontfix`
    không lý do — sau `0027` tách `delivered`/`done`, `RUL12` vẫn đợi
    `done` thật (sau cả `retrospective`/`cleanup`) mới mở dependent. Đây có
    còn là vấn đề thật cần giải (độ trễ mở-dependent) hay `retrospective`/
    `cleanup` đủ nhanh/mechanical nên không đáng lo? Chưa ai đo/quyết.

## Kết quả thật (round 13, scan codebase 2026-08-07)

6 ngày trôi qua kể từ round 12 — scan lại git log + `.fgos` state thật (không
suy đoán từ report cũ) để verify vấn đề còn relevant không.

### `tsk-38t` (Phase 2) — ĐÃ SHIP

`git log --oneline | grep tsk-38t` → 8 sub-task merged (`tsk-38t-1`..`8`),
mỗi cái có doc `retrospective synthesis` riêng, merge commit
`a2c0017 Merge branch 'fgw/tsk-38t'`. `.fgos` state: `status: cleanup` (đã
qua `retrospective`, chờ dọn TTL). Decision record thật:
`docs/decisions/0027-domain-so-huu-status-doan-truoc-delivered-supersede-base-workflow-model-d1-d3.md`
(2026-08-04) — trích thẳng report này làm nguồn ("bản thân report nguồn
... round 4 ban đầu kết luận 'domain sở hữu TOÀN BỘ bảng transition' — một
khung RỘNG HƠN record này thật sự chốt").

**Khác biệt thật so với round 4 (đáng ghi nhớ, không phải lỗi round 4 — là
kết quả của phiên `fgos-coding-exploring` THU HẸP phạm vi đúng lúc):**

- 10 status hôm nay (không phải 7): `todo/doing/blocked/awaiting-human/
  awaiting-approval/wontfix` (**6 status ĐẦU**) cộng `delivered/retrospective/
  cleanup/done` (**4 status ĐUÔI — chuỗi tuyến tính PHỔ QUÁT, KHÔNG domain
  nào relabel** — khái niệm hoàn toàn mới, round 1-12 của report này chưa
  từng nghĩ tới).
- **SỬA LẠI (đọc sai lúc viết round 13 lần đầu, phát hiện lúc file task
  `backlog`):** domain KHÔNG sở hữu bảng TRANSITION, kể cả 6 status đầu.
  Đọc thẳng `workflow-stage-graphs.mjs` (comment trong entry
  `fixture-marketing`) xác nhận: *"`status-fsm.mjs`'s TRANSITIONS is ONE
  shared flat table for every domain (0027's own 'Quyết định' section...) —
  no domain can introduce a genuinely new status literal... only D1-D3's
  original 'domain sở hữu TOÀN BỘ bảng transition' framing, explicitly
  REJECTED in DISCUSSION.md §1/§6, would have allowed that."* Cái domain
  THẬT SỰ sở hữu chỉ là **`statusLabels`** — bảng map 6 status đầu →
  `statusCategory` (vd `fixture-marketing` map `blocked→canceled` thay vì
  `blocked→in-progress` của coding) — KHÔNG phải literal status value, KHÔNG
  phải cạnh chuyển hợp lệ. 10 status + cạnh chuyển vẫn 1 bảng CHUNG cho mọi
  domain (`status-fsm.mjs`'s `TRANSITIONS`, `work.mjs`'s `STATUSES`). Hệ quả
  trực tiếp: muốn thêm 1 status MỚI (vd `backlog`) phải sửa 2 file GLOBAL
  này — không có đường "domain tự khai status riêng".
- `statusCategory` implement ĐÚNG thiết kế round 3-4: field riêng đóng băng
  lúc ghi, KHÔNG dùng validate move (đúng lỗ hổng `blocked→awaiting-human`
  round 4 tự tìm ra — `status-fsm.mjs` vẫn giữ bảng transition đầy đủ mịn
  riêng, dùng chung mọi domain).
- `domainFields` ship đúng shape đề xuất mục 3 (`tsk-38t-6`).
- Domain thật thứ 2 để test: `fixture-marketing`
  (`src/state/workflow-stage-graphs.mjs` dòng ~300) — đóng đúng gap tự flag
  ở "Chưa bàn tới #6" (chưa có kế hoạch test domain-2 thật).
- `resolveDiscovery`/`resolveDecompose` hardcode tên stage coding ("Chưa bàn
  tới #2") — cũng đã dịch chuyển: domain `coding` giờ có 5 stage
  (`clarify/discovery/exploring/decompose/executing`, không phải 4), cho
  thấy khu vực này tiếp tục được sửa độc lập, không nằm trong `tsk-38t`.

### `tsk-2rp` (Phase 1, `verifyKind`) — BỊ BÁC, đóng `wontfix`

KHÔNG có commit code nào (`git log | grep tsk-2rp` rỗng) — chưa từng vào
`executing`. Quyết định ghi lại nguyên văn trên chính item (`fgos show
tsk-2rp` → `decisions`): *"Bác cơ chế verifyKind. `runGoalCheck` giữ nguyên
một bản logic duy nhất và hợp đồng 'luôn spawn một lệnh thật, phân xử bằng
exit status'. Nếu một domain non-coding cần xác nhận thủ công, nó thể hiện
bằng một attestation artifact đọc bởi một verify shell bình thường (vd
`fgos attest-check <id>`), không phải một nhánh bên trong `runGoalCheck`."*

Đây là thiết kế SẠCH hơn đề xuất của report — né được đúng 2 lỗ hổng round 12
tự đào ra (self-report vòng tròn ở `return`, không-ai-để-`approve` ở
`catchup` chạy `role: 'runner'`) vì nó không thêm nhánh mới vào core trust
mechanism — verify vẫn LUÔN là 1 shell command thật.

### `tsk-3p1` (marker RUL12) — đóng `wontfix`, KHÔNG có decision/reason ghi lại

Không commit code. Vấn đề gốc ("`done` trả lời 2 câu hỏi cùng lúc: code ship
xong VÀ ceremony xong") đã được giải QUA ĐƯỜNG KHÁC — tách hẳn `delivered`
khỏi `done` (0027) làm `done` hết mơ hồ. NHƯNG ý gốc cụ thể của `tsk-3p1` —
mở dependent SỚM (ngay lúc delivered, không đợi hết ceremony) — chưa thấy
implement: `docs/specs/work-state.md` RUL12 vẫn đọc "dep chỉ mở khi thật
`done`", mà `done` giờ đứng SAU CẢ `retrospective`/`cleanup` — độ trễ mở-
dependent có thể còn DÀI hơn trước 0027, chưa rõ có ai coi đây là vấn đề cần
giải tiếp không. **Câu hỏi mở mới, chưa có câu trả lời — xem mục câu hỏi
chưa giải quyết #15.**

### Kết luận relevant

Vấn đề GỐC (schema work-item coding-bias, cần tổng quát hóa cho domain thứ
2) — ĐÚNG, đã giải THẬT qua `0027`/`tsk-38t`, không còn là vấn đề mở. Giải
pháp `verifyKind` report đề xuất — SAI hướng, đã bị thay bằng attestation-
artifact (không cần làm gì thêm, đã có quyết định). Giải pháp marker RUL12 —
CHƯA RÕ đã giải hay bị bỏ rơi, đáng đào lại riêng nếu độ trễ mở-dependent
vẫn còn là vấn đề thật với người dùng.

## Nguồn

- [Jira story vs task vs epic: Understanding the hierarchy](https://products.seibert.group/blog/jira-story-vs-task-vs-epic)
- [What's the Difference Between Jira Epic vs Story vs Task](https://community.atlassian.com/forums/App-Central-articles/What-s-the-Difference-Between-Jira-Epic-vs-Story-vs-Task-And/ba-p/3053675)
- [Understanding Jira Hierarchy: Complete Guide in 2025](https://community.atlassian.com/forums/App-Central-articles/Understanding-Jira-Hierarchy-Complete-Guide-in-2025/ba-p/2947722)
- [PostgreSQL JSONB – Operators, GIN Indexes, and Query Examples](https://dbschema.com/blog/postgresql/jsonb-in-postgresql/)
- [Schema-Driven Platforms: Why JSON Schema Is the Most Underrated Tool in Your Stack](https://peterhrynkow.com/ai/architecture/2025/02/01/schema-driven-platforms.html)
- [Jira custom field (Atlassian Forge)](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-custom-field/)
- [How Do I Change Workflows/Screens/Issue Types (Schemes) for a Project?](https://community.atlassian.com/forums/Jira-articles/How-Do-I-Change-Workflows-Screens-Issue-Types-Schemes-for-a/ba-p/2858393)
- [A Guide to Jira Workflow Best Practices (with Examples)](https://idalko.com/blog/jira-workflow-best-practices)
- [Issue status – Linear Docs](https://linear.app/docs/configuring-workflows) (workflow state category: backlog/unstarted/started/completed/canceled, custom label per team)
- [About the issue type field – GitHub Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-the-issue-type-field) (issue type = vocab chung toàn org, không per-repo)
- Nội bộ: `docs/specs/work-state.md`, `docs/explanation/work-item-lifecycle-and-domain-model.md`,
  `docs/decisions/0024-doi-ten-status-proposed-thanh-awaiting-approval.md`,
  `src/state/work.mjs`, `src/state/workflow-stage-graphs.mjs`, `src/state/store.mjs`,
  `src/state/frontier.mjs`
