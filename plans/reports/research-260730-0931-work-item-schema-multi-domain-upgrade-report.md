# Research Report: Nâng cấp schema work-item (status branch, type hierarchy, nested domain fields, per-domain status flow)

**Thời điểm nghiên cứu:** 2026-07-30 09:31 (Asia/Saigon), cập nhật 10:10, 10:35 (chốt kiến trúc round 4)

## Mục tiêu report này

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
8. [Câu hỏi chưa giải quyết](#câu-hỏi-chưa-giải-quyết)
9. [Nguồn](#nguồn)

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

| # | Việc | Làm hay không | Risk |
|---|---|---|---|
| 1 | Backlog status trước todo | Làm, NHƯNG như 1 **category** chung (`backlog`), không phải giá trị phẳng nhét cạnh `wontfix`/`awaiting-approval` | MEDIUM |
| 2 | Type hierarchy | Tách `kind`(task/bug/epic-nhãn) khỏi `goalTier`(mvp/milestone) đã có; đừng chain tuyến tính; nếu enum hóa `kind`, áp category/label như status | LOW (nếu tách đúng trục) |
| 3 | Nested domain fields | Làm — nhất quán `DOMAINS` registry pattern sẵn có, `domainFields` optional-additive, ghi đè toàn object mỗi lần edit | LOW-MEDIUM |
| 4 | Status flow theo domain | **CHỐT (round 4):** LÀM — domain sở hữu bảng transition riêng (full fidelity, không lủng); `statusCategory` KHÔNG dùng để validate move, chỉ phục vụ cơ chế domain-agnostic (mục 6) | HIGH — supersede thật D1-D3, cần decision record + audit toàn bộ consumer `fsm.mjs` |
| 6 mới | Tách `status` (label, domain sở hữu, dùng validate move) khỏi `statusCategory` (foundation, dùng cho compound-learn/frontier/rollup/outcome...) | Nên làm cùng đợt với #4 — 2 field bổ trợ nhau, không tách rời được nữa sau round 4 | MEDIUM-HIGH (đổi mọi consumer domain-agnostic sang đọc category, xem danh sách mục 6) |

**Về câu hỏi riêng "skill fgos-planning coi lại việc dùng harness ghi task
cho đúng quan hệ/type":** phụ thuộc kết quả quyết định mục 2 (type hierarchy)
trước — chưa nên implement, để ở mục câu hỏi mở dưới.

## Câu hỏi chưa giải quyết

1. Tên chính thức cho status mới: `backlog` hay tên khác? (đề xuất `backlog`,
   tránh mọi biến thể của "propose").
2. `kind` có nên enum hóa hẳn, hay giữ free-text và thêm field `type` mới
   riêng cho phân loại cứng (task/bug/epic-label)? Ảnh hưởng: mọi item cũ
   đang có `kind` free-text tùy ý.
3. Quan hệ giữa các type (khi xét sau) — DAG kiểu Jira (epic→{story,task,bug}
   peer) hay hình dạng khác fgOS tự chọn?
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
