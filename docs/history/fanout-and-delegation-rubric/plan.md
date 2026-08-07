# tsk-5kn — plan

Mode: **high-risk**

Quyết định đã khoá: `CONTEXT.md` cùng thư mục (D1–D14). Plan này không mở
lại quyết định nào, chỉ trích D-ID.

## Mode gate

Đếm cờ cơ học (`fgos-routing`'s Mode gate — không session nào quyết lane
cho item này trước đó, nên áp trực tiếp từ nguồn):

| Cờ | Áp dụng | Vì sao |
|---|---|---|
| data model | **có** | Thêm hai stage vào `DOMAINS.coding`; 57 item đang mở phải migrate (D10, D12) |
| public contracts | **có** | `stage` là hợp đồng 7 file đọc; `fgos discover`/`fgos decompose` đổi mặc định sang caller-verdict (D1) |
| existing covered behavior | **có** | `test/intake/judge-executor.test.mjs` + test discovery/decompose đang phủ đúng phần bị gỡ |
| auth · authorization · audit/security · external systems · cross-platform · multi-domain | không | — |
| weak proof around the area | không | Vùng này **có** test thật; bằng chứng không yếu |

3 cờ ⇒ theo bảng là `standard`. **Nhưng có hard-gate flag: "removing a
validation"** — item gỡ ba lớp validation (`judgeDiscovery`,
`judgeDecompose`, `judgeVerifySemanticCorrectness`, D9). Hard-gate ⇒
**high-risk** bất kể số đếm.

`impact-analysis: full` (GitNexus registered, `status: present`).

## Approach

### Đường chọn

Xây **thứ thay thế trước**, gỡ **thứ cũ sau** — trừ một ngoại lệ có lý do
(xem P3 dưới). Cụ thể: skill mới và việc gỡ judge không đụng file nhau nên
chạy song song được ngay từ đầu; phần wiring stage machine chờ skill có
mặt trên đĩa vì `skillForStage` phải trỏ vào file thật.

### Các đường đã cân và loại

- **Gỡ judge trước khi có skill thay thế** — nghe như để lại lỗ hổng, nhưng
  soi thật thì không: hai đường đang dùng hằng ngày là caller-verdict
  (nhánh A) và `readLockedContext` (nhánh B1, `tsk-ozl`), cả hai **không
  gọi judge**. Chính session này vừa đi qua nhánh A. Đường duy nhất mất là
  nhánh B2 — dành cho caller không khai verdict, tức `fgos-runner` headless,
  mà runner **chưa từng chạy** (0 sự kiện `capacity.dispatch`). Nên gỡ sớm
  không chặn ai. → giữ P3 ở wave 1.
- **Đổi tên `clarify` thành `discovery`** — loại. D10 giữ `clarify` làm pha
  ý định. Hệ quả tốt: phần lớn trong 7 file đọc literal `'clarify'` **không
  cần đụng tới**, vì `clarify` vẫn là stage hợp lệ.
- **Migrate 57 item bằng tay** — loại; 57 item với ba luật phân loại khác
  nhau (D12) là việc của code, không phải của người.
- **Gộp skill `clarify` vào `fgos-exploring`** — loại. D11: hai stage khác
  nhau ở chỗ *người là tác giả của thứ gì*; gộp lại thì `stage` không còn
  phân biệt được và mất đúng thứ D11 mua về.

### Risk map

| Thành phần | Rủi ro | Thứ chứng minh (proof point cho `fgos-validating`) |
|---|---|---|
| Gỡ `judgeVerifySemanticCorrectness` | **cao** — nó là lớp chặn đã bắt lỗi thật **hai lần trong chính vòng clarify của item này** (placeholder verify, rồi regex false-negative). Gỡ mà không thay thì mất một lớp bảo vệ đang hoạt động | Chạy thử `fgos discover` với một verify cố tình hỏng, chứng minh đường thay thế vẫn bắt được. `impact-analysis: full` — chạy `impact` trên `judgeVerifySemanticCorrectness` trước khi sửa |
| Thêm 2 stage vào `DOMAINS.coding` | **cao** — `stage` là hợp đồng công khai; `frontier`, `discover-pool`, `entropy`, `replay`, `bin/fgos.mjs` đều đọc | `npm test` xanh + `impact` trên `getDomain`/`skillForStage` trước khi sửa |
| Migrate 57 item | **trung bình** — sai luật phân loại thì item vào nhầm stage | Chạy thử trên bản sao store, đối chiếu số đếm ba rổ trước/sau |
| Skill prose (P1, P2) | **trung bình** — không lệnh shell nào assert được hành vi runtime của prose | Theo `docs/how-to/write-verify-for-a-skill-prose-change.md`: verify chỉ gánh POSITIVE/NEGATIVE về nội dung; chứng-minh-runtime thuộc smoke-test + event log |
| Runner dispatch research | **thấp** — runner chưa từng chạy nên không có regression thật để phá | `npm test` |

### Vị trí trong graph

`fgos graph --json`: `tsk-5kn` **không** nằm trên `criticalPath` (depth 10,
đường khác) và **không** có trong `topUnblock` — item không dep, không ai
chờ nó. Nên thứ tự dưới đây do bản thân công việc quyết định, không do
graph ép.

## Shape — 6 mảnh, 3 wave

Footprint đã tách để wave 1 không đụng file nhau.

```
wave 1 (song song thật, 0 overlap)
  P1  skill fgos-researching      .claude/skills/fgos-researching/**
  P2  skill fgos-clarifying       .claude/skills/fgos-clarifying/**
  P3  verb + gỡ judge cả ba       src/intake/**, test/intake/**
        │
wave 2  ▼
  P4  stage machine               src/state/workflow-stage-graphs.mjs,
                                  src/state/discover-pool.mjs, test/state/**
        │
wave 3  ▼ (song song)
  P5  runner dispatch research    src/runner/loop.mjs, test/runner/**
  P6  migration 57 item           scripts/**, test/**
```

P4 chờ P1+P2 vì `skillMap` phải trỏ vào file skill **có thật** — verify của
P4 assert đúng điều đó. P5 chờ P1 (cần skill để dispatch) và P4 (cần stage
`discovery` tồn tại). P6 chờ P4 (cần stage đích tồn tại).

### Neo văn bản (anchor) cho verify của P1/P2

Verify skill-prose phải ghim **cụm đủ dài** (bẫy #5 trong how-to). Plan này
đặt tên sẵn để người thi công viết đúng cụm:

- **P1** phải chứa nguyên văn `docs/history/<feature>/RESEARCH.md` và cụm
  `WebSearch/WebFetch`; và **không** được chứa cụm tự-đánh-giá
  `có biết cái này không` (negative — D8 bỏ hẳn self-test).
- **P2** phải chứa cụm `chỉ hỏi khi không hiểu` và cụm
  `áp thẳng rồi báo lại một dòng` (D13, D14).

### Ca đáng chứng minh (high-risk ⇒ sketch đầy đủ)

- **Biên rỗng**: item không `docsRef`, không `CONTEXT.md`, mô tả một dòng —
  soul `clarify` phải tự phán được, không nổ.
- **Hành vi cũ không được vỡ**: item đã có `CONTEXT.md` commit vẫn đi qua
  nhánh `readLockedContext` như trước.
- **Truy cập đồng thời**: hai session cùng chạy `fgos discover` trên hai
  item khác nhau — lock `.fgos/events.jsonl` vẫn đúng.
- **Hỏng một phần**: migration dừng giữa chừng ⇒ một số item đã chuyển, số
  còn lại chưa. Phải chạy lại được (idempotent).
- **Ca âm của D14**: mô tả **đã rõ** thì soul **không** được sửa — "không
  đổi chỉ để đổi".

## Split — 6 item con

Tạo thật lúc `fgos-validating` (bị bỏ sót lúc planning — sửa tại chỗ):
`tsk-2t9`(P1) `tsk-v4b`(P2) `tsk-1x3`(P3) `tsk-1w7`(P4) `tsk-5mj`(P5)
`tsk-puz`(P6), mỗi cái `--parent tsk-5kn --stage decompose`.

### P1 — `tsk-2t9` — skill `fgos-researching`

- **Verify**: `npm test && test -f .claude/skills/fgos-researching/SKILL.md && grep -q "^name: fgos-researching$" .claude/skills/fgos-researching/SKILL.md && rg -q --hidden "docs/history/<feature>/RESEARCH.md" .claude/skills/fgos-researching/SKILL.md && rg -q --hidden "WebSearch/WebFetch" .claude/skills/fgos-researching/SKILL.md && ! rg -q --hidden "có biết cái này không" .claude/skills/fgos-researching/SKILL.md`
- **Footprint**: `.claude/skills/fgos-researching/SKILL.md`
- **D-ID**: D4, D5, D8, D2

### P2 — `tsk-v4b` — skill `fgos-clarifying`

- **Verify**: `npm test && test -f .claude/skills/fgos-clarifying/SKILL.md && grep -q "^name: fgos-clarifying$" .claude/skills/fgos-clarifying/SKILL.md && rg -q --hidden "chỉ hỏi khi không hiểu" .claude/skills/fgos-clarifying/SKILL.md && rg -q --hidden "áp thẳng rồi báo lại một dòng" .claude/skills/fgos-clarifying/SKILL.md`
- **Footprint**: `.claude/skills/fgos-clarifying/SKILL.md,.agents/skills/fgos-clarifying/SKILL.md` (bài học từ `tsk-2t9`: `test/skills/fgos-mirror.test.mjs` đòi mirror byte-identical; `npm test` trong verify đã đủ generic để bắt lỗi này, không cần sửa verify field — chỉ cần tạo cả hai file lúc implement)
- **D-ID**: D13, D14

#### Child plan (`fgos-planning`, mức riêng của `tsk-v4b`)

**Mode: tiny.** Cùng lý luận với `tsk-2t9`: 0/10 cờ ở mức child — 1 file mới
(×2 với mirror), không public contract nào sống trỏ vào `fgos-clarifying`
(`rg` rỗng), không hành vi hiện có bị đe doạ. Posture impact-analysis:
`degraded` (D15 ở `tsk-5kn`), không cần — không có blast radius để soi.

**Approach.** Viết `.claude/skills/fgos-clarifying/SKILL.md` +
`.agents/skills/fgos-clarifying/SKILL.md` (byte-identical, mirror bắt buộc).
Nội dung mang hai hợp đồng đã khoá:

- **D13** — soul tự phán hiểu-hay-không-hiểu **ý định** (khác `fgos-researching`:
  đây là decide-altitude, đối thoại với người, không phải gather-altitude).
  Mặc định: đọc mô tả, tự đánh giá đã đủ để thi công chưa. **Chỉ hỏi người khi
  không hiểu** — không phải quy trình "vào là hỏi" như `fgos-exploring` hiện
  tại (bước 1 của nó: một lượt `rg` rồi luôn sinh câu hỏi). Mục tiêu: tự động
  tối đa — item rõ ràng thì đi thẳng, không phiền ai.
- **D14** — được phép viết lại `title`/`description` mơ hồ thành bản rõ hơn.
  **Áp thẳng rồi báo lại một dòng**, không chờ duyệt (khác đề xuất-rồi-chờ).
  An toàn nhờ `.fgos/events.jsonl` append-only — bản gốc không mất, hoàn tác
  được. Không đổi nếu bản gốc đã đủ rõ ("không đổi chỉ để đổi").

**Shape.** Không split — hai file mirror, một verify. Ca biên: (a) mô tả đã
rất rõ ⇒ không hỏi, không viết lại, đi thẳng; (b) mô tả mơ hồ nhưng viết lại
được ngay ⇒ áp + báo một dòng, không park; (c) mô tả mơ hồ và không đủ dữ
kiện để tự viết lại ⇒ hỏi đúng một câu cụ thể, park đợi người.

### P3 — `tsk-1x3` — verb về cửa ghi thuần, gỡ judge cả ba consumer

- **Verify**: `npm test && ! rg -q "runJudgeExecutor" src/intake/discovery.mjs src/intake/decompose.mjs && ! test -f src/intake/judge-executor.mjs`
- **Footprint**: `src/intake/discovery.mjs,src/intake/decompose.mjs,src/intake/judge-executor.mjs,src/intake/judge-fail-log.mjs,test/intake/judge-executor.test.mjs,test/intake/judge-verify-second-pass-stability.test.mjs,test/intake/discovery.test.mjs,test/intake/decompose.test.mjs` (mở rộng lúc `fgos-validating`: `rg` tìm ra 3 test file import `readScoutNotes`/`judgeVerifySemanticCorrectness` từ `judge-executor.mjs` mà bản đầu bỏ sót — `npm test` sẽ vỡ ngay nếu không sửa cùng lúc)
- **D-ID**: D1, D6, D9

### P4 — `tsk-1w7` — stage machine: thêm `discovery` + `exploring`

- **Verify**: `npm test && rg -q "([\[,]|^) *[\x22\x27]discovery[\x22\x27]" src/state/workflow-stage-graphs.mjs && rg -q "([\[,]|^) *[\x22\x27]exploring[\x22\x27]" src/state/workflow-stage-graphs.mjs`
- **Footprint**: `src/state/workflow-stage-graphs.mjs,src/state/discover-pool.mjs,test/state/workflow-stage-graphs.test.mjs`
- **D-ID**: D3, D10, D11
- **Chờ**: P1, P2

### P5 — `tsk-5mj` — runner giao stage `discovery` cho worker chạy skill research

- **Verify**: `npm test && ! rg -q "resolveDiscovery" src/runner/loop.mjs`
- **Footprint**: `src/runner/loop.mjs,test/e2e/runner-loop.test.mjs`
- **D-ID**: D6, D1
- **Chờ**: P1, P4

### P6 — `tsk-puz` — migration 57 item đang ở `clarify`

- **Verify**: `npm test`
- **Footprint**: `scripts/migrate-clarify-split.mjs,test/state/migrate-clarify-split.test.mjs`
- **D-ID**: D12
- **Chờ**: P4

## Giả định đã ghim (chưa chứng minh — việc của `fgos-validating`)

1. **Tên skill `fgos-clarifying`** — `CONTEXT.md` không đặt tên cho skill
   của stage `clarify`; plan này chọn theo quy ước `-ing` sẵn có
   (exploring/planning/validating/researching). Không phải quyết định sản
   phẩm, chỉ là đặt tên nhất quán — nếu sai thì đổi rẻ.
2. **`judge-executor.mjs` xoá được hoàn toàn** sau khi cả ba consumer rời
   đi. Chưa kiểm có consumer nào ngoài `src/intake/` không — `fgos-validating`
   phải xác nhận trước khi P3 chạy.
3. **`judgeVerifySemanticCorrectness` chuyển thành lời gọi từ soul**, không
   phải xoá trắng. `CONTEXT.md` để ngỏ ("gỡ hẳn, hay chuyển thành lời gọi
   từ soul như hai cái kia"). Plan chọn *chuyển*, vì nó vừa bắt lỗi thật hai
   lần trong chính vòng clarify của item này — xoá trắng là mất một lớp
   đang hoạt động.
4. **Migration chạy một lần, idempotent**, không phải lười (lazy). Chọn vậy
   để `stage` đọc lên luôn đúng ngay, không phụ thuộc item có được chạm hay
   chưa.

## Reality gate (`fgos-validating`)

| Chiều | Kết quả | Bằng chứng |
|---|---|---|
| Mode fit | PASS | Hard-gate "removing a validation" ⇒ high-risk đúng, không phụ thuộc số đếm cờ |
| Repo fit | PASS (sau sửa) | 9/9 file plan dựa vào có thật (`test -f`); P3 thiếu 3 test consumer thật, đã sửa footprint tại chỗ (xem P3) |
| Assumptions | PASS với ghi chú | Giả định 2 (xoá được `judge-executor.mjs`) xác nhận đúng cho `src/` (chỉ `decompose.mjs`/`discovery.mjs` import), nhưng rộng hơn cho `test/` — đã sửa |
| Smaller path | PASS | Không tìm ra đường nhỏ hơn 6 mảnh mà vẫn giữ được wave 1 song song thật |
| Proof surface | PASS | Cả 6 item con đều có verify chạy được thật, không placeholder |
| Impact-analysis posture | **degraded, không phải `full`** | GitNexus `status: present` nhưng index sau HEAD 474 commit (`251d0b5`). Cross-check bằng `rg` thay thế: `getDomain`/`skillForStage` có 9 consumer thật, nhưng chỉ `frontier.mjs`/`stage-fsm.mjs` đọc `domain.stages` tổng quát (không hardcode tên) — không consumer nào vỡ khi THÊM stage. `judgeVerifySemanticCorrectness`: GitNexus báo đúng dù stale (`resolveDecompose`/`resolveDiscovery`), cross-check `rg` xác nhận không sai lệch |

**Feasibility matrix** (rủi ro medium+ trong risk map của plan):

| Giả định | Rủi ro | Bằng chứng | Kết quả |
|---|---|---|---|
| Gỡ `judgeVerifySemanticCorrectness` an toàn nếu chuyển thành lời gọi từ soul | cao | Nó bắt 2 lỗi thật trong chính vòng `clarify` của item này (placeholder verify, regex false-negative) — plan chọn CHUYỂN không XOÁ, đúng giả định 3 của `CONTEXT.md` | Chấp nhận — quyết định đã có lý do, không phải đoán |
| Thêm 2 stage không vỡ consumer hiện có | cao | Cross-check `rg` trên (xem hàng impact-analysis) | Xác nhận PASS |
| `judge-executor.mjs` xoá được hoàn toàn | trung bình | `rg` xác nhận không consumer `src/` ngoài `intake/`; 3 test file cần sửa cùng lúc, đã thêm vào footprint P3 | PASS sau sửa |
| Migration idempotent | trung bình | Chưa viết code — không có gì để kiểm bây giờ, để nguyên là giả định chưa chứng minh cho `fgos-code-implement` của P6 tự chứng minh qua `npm test` | Chưa chứng minh — chấp nhận được, vì P6 không nằm trên wave 1/2 |

## Verdict

**READY WITH CONSTRAINTS.**

Constraint duy nhất: posture impact-analysis là `degraded` không phải
`full` — mọi proof point dựa vào GitNexus trong risk map của plan gốc phải
đọc là "cross-checked bằng `rg`", không phải "xác nhận bằng code-graph". Đã
làm cho hai điểm rủi ro cao nhất (P4, P3) ngay tại đây; không điểm nào còn
lại trong risk map cần thêm cross-check trước khi build.

## Câu mở

- **Ai gỡ `.fgos/config.json`'s `capacities.judge-discovery`** sau khi P3
  xong? Entry đó trỏ `claude -p` và sẽ thành rác. Chưa gán cho mảnh nào.
- **`discover-pool.mjs`** hiện gom item theo `clarify`+`decompose`; sau khi
  thêm hai stage thì `/fgOS:discover-loop` gom theo gì? P4 phải trả lời,
  nhưng `CONTEXT.md` không khoá.
