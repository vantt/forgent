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
| public contracts | **có** | `stage` là hợp đồng 7 file đọc; `fgos discover`/`fgos plan` đổi mặc định sang caller-verdict (D1) |
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
- **Gộp skill `clarify` vào `fgos-coding-exploring`** — loại. D11: hai stage khác
  nhau ở chỗ *người là tác giả của thứ gì*; gộp lại thì `stage` không còn
  phân biệt được và mất đúng thứ D11 mua về.

### Risk map

| Thành phần | Rủi ro | Thứ chứng minh (proof point cho `fgos-coding-validating`) |
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

Tạo thật lúc `fgos-coding-validating` (bị bỏ sót lúc planning — sửa tại chỗ):
`tsk-2t9`(P1) `tsk-v4b`(P2) `tsk-1x3`(P3) `tsk-1w7`(P4) `tsk-5mj`(P5)
`tsk-puz`(P6), mỗi cái `--parent tsk-5kn --stage decompose`.

### P1 — `tsk-2t9` — skill `fgos-researching`

- **Verify**: `npm test && test -f .claude/skills/fgos-researching/SKILL.md && grep -q "^name: fgos-researching$" .claude/skills/fgos-researching/SKILL.md && rg -q --hidden "docs/history/<feature>/RESEARCH.md" .claude/skills/fgos-researching/SKILL.md && rg -q --hidden "WebSearch/WebFetch" .claude/skills/fgos-researching/SKILL.md && ! rg -q --hidden "có biết cái này không" .claude/skills/fgos-researching/SKILL.md`
- **Footprint**: `.claude/skills/fgos-researching/SKILL.md,.agents/skills/fgos-researching/SKILL.md` (mở rộng lúc `fgos-coding-implement`: `test/skills/fgos-mirror.test.mjs` đòi mọi `.claude/skills/fgos-*/` mirror byte-identical sang `.agents/skills/fgos-*/`; bản đầu bỏ sót nhánh `.agents/`, `npm test` bắt được thật khi chạy trực tiếp — output nền bị cắt ngắn nên không thấy lỗi, phải chạy lại targeted mới lộ ra)
- **D-ID**: D4, D5, D8, D2

#### Child plan (`fgos-coding-planning`, mức riêng của `tsk-2t9`)

**Mode: tiny.** Đếm cờ mode-gate riêng cho child này (không phải phạm vi
`tsk-5kn` tổng thể — chỉ dòng `Mode: high-risk` trên là aggregate, không có
dòng riêng cho từng con): 1 file mới, không đụng data model, không đụng
public contract nào đang sống (chưa skill nào trỏ vào `fgos-researching`
tới khi P4/P5 wire — nằm ngoài phạm vi item này), không hành vi hiện có bị
đe doạ (file chưa tồn tại, không test nào phủ). 0/10 cờ ⇒ tiny. Posture
impact-analysis: `degraded` (như D15 đã ghi ở `tsk-5kn`), nhưng không cần —
item này tạo file mới, không có blast radius để soi.

**Approach.** Viết đúng một file: `.claude/skills/fgos-researching/SKILL.md`.
Nội dung phải mang các hợp đồng đã khoá ở `CONTEXT.md`:

- **D4** — stage-agnostic: skill nhận *(mô tả + những gì đã biết tới giờ)*,
  trả *(lời giải cụ thể + verdict rõ/chưa rõ)*, không tự biết mình bị gọi
  từ stage nào.
- **D8** — luật chọn đường **hai nhánh cơ học**, bỏ hẳn self-test "có biết
  cái này không": tên riêng **có** trong repo/docs ⇒ đọc tại chỗ
  (`rg`/Read/Grep); **không có** ⇒ tra ngoài (WebSearch/WebFetch). Verify
  của item này assert trực tiếp cụm cấm — phải tránh viết đúng cụm đó dù
  là để phủ định.
- **D5** — ghi `docs/history/<feature>/RESEARCH.md`, **tích luỹ theo
  vòng**, không ghi đè (khác `writeScoutNotes` cũ); bắt cả kết quả
  WebSearch/WebFetch, không chỉ lệnh `rg`.
- **D2** — fan-out khi câu hỏi có nhiều nhánh độc lập đi qua cơ chế dispatch
  có hợp đồng (không phải ad-hoc Task call) — đúng cửa `tsk-29i` đã kê sẵn.

**Shape.** Không split — một mảnh, một file, một verify. Ca biên đáng viết
vào skill: (a) mô tả không có tên riêng nào ⇒ không research, trả verdict
thẳng từ dữ liệu sẵn có; (b) tên riêng trùng cả trong-repo lẫn cần tra
ngoài (vd một pattern có tên trùng thư viện ngoài) ⇒ làm cả hai nhánh, không
chọn một; (c) `RESEARCH.md` chưa tồn tại ⇒ tạo mới với đúng hình tích luỹ
ngay từ vòng đầu, không phải "tạo trống rồi ghi đè sau".

### P2 — `tsk-v4b` — skill `fgos-clarifying`

- **Verify**: `npm test && test -f .claude/skills/fgos-clarifying/SKILL.md && grep -q "^name: fgos-clarifying$" .claude/skills/fgos-clarifying/SKILL.md && rg -q --hidden "chỉ hỏi khi không hiểu" .claude/skills/fgos-clarifying/SKILL.md && rg -q --hidden "áp thẳng rồi báo lại một dòng" .claude/skills/fgos-clarifying/SKILL.md`
- **Footprint**: `.claude/skills/fgos-clarifying/SKILL.md,.agents/skills/fgos-clarifying/SKILL.md` (bài học từ `tsk-2t9`: `test/skills/fgos-mirror.test.mjs` đòi mirror byte-identical; `npm test` trong verify đã đủ generic để bắt lỗi này, không cần sửa verify field — chỉ cần tạo cả hai file lúc implement)
- **D-ID**: D13, D14

#### Child plan (`fgos-coding-planning`, mức riêng của `tsk-v4b`)

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
  không hiểu** — không phải quy trình "vào là hỏi" như `fgos-coding-exploring` hiện
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

- **Verify**: `npm test && ! rg -q "runJudgeExecutor" src/intake/discovery.mjs src/intake/plan.mjs && ! test -f src/intake/judge-executor.mjs`
- **Footprint**: `src/intake/discovery.mjs,src/intake/plan.mjs,src/intake/judge-executor.mjs,src/intake/judge-fail-log.mjs,test/intake/judge-executor.test.mjs,test/intake/judge-verify-second-pass-stability.test.mjs,test/intake/discovery.test.mjs,test/intake/plan.test.mjs` (mở rộng lúc `fgos-coding-validating`: `rg` tìm ra 3 test file import `readScoutNotes`/`judgeVerifySemanticCorrectness` từ `judge-executor.mjs` mà bản đầu bỏ sót — `npm test` sẽ vỡ ngay nếu không sửa cùng lúc)
- **D-ID**: D1, D6, D9, D16

#### Child plan (`fgos-coding-planning`, mức riêng của `tsk-1x3`)

**Mode: heavy.** Khác hẳn P1/P2 (tiny, file mới thuần). Đếm cờ mode-gate ở
mức child này:

| Cờ | Áp dụng | Vì sao |
|---|---|---|
| public contracts | **có** | `resolveDiscovery`/`resolveDecompose` là API nội bộ có caller thật ngoài chính file (`bin/fgos.mjs`, `src/runner/loop.mjs`) |
| existing covered behavior | **có** | 244 test case trong 4 file footprint (81 discovery + 114 decompose + 39 judge-executor + 10 judge-verify-second-pass, đếm bằng `grep -c "^test("`); ít nhất 24 lệnh gọi `resolveDiscovery` và 8 lệnh `resolveDecompose` **không** kèm verdict — đang test trực tiếp đường judge cũ |
| **hard-gate: removing a validation** | **có** | Gỡ `judgeVerifySemanticCorrectness` — đúng cờ hard-gate đã làm `tsk-5kn` thành high-risk, lặp lại ở mức child này |

Hard-gate có mặt ⇒ **heavy** bất kể số đếm còn lại. `impact-analysis: degraded`
(D15 kế thừa từ `tsk-5kn`, GitNexus stale 474 commit) — cross-check bằng
`rg`/GitNexus đã làm ở vòng validating của `tsk-5kn`: `runJudgeExecutor` có
đúng 3 consumer (`judgeDiscovery`, `judgeDecompose`,
`judgeVerifySemanticCorrectness`), không consumer nào khác ngoài
`src/intake/`.

**Approach.**

1. **Đảo mặc định** (D1): `resolveDiscovery(dir, id, cfg, role, callerVerdict)`
   và `resolveDecompose(dir, id, cfg, role, callerVerdict)` — làm
   `callerVerdict` **bắt buộc**. Bỏ nhánh gọi `judgeDiscovery`/`judgeDecompose`
   khi thiếu verdict.
2. **Xử lý caller duy nhất không truyền verdict** (D16): `runOnce`
   (`src/runner/loop.mjs:1031,1051`) — thay lời gọi trực tiếp bằng nhánh
   **no-op an toàn** khi không có verdict, không throw, không gọi judge.
   Runner chưa từng chạy thật (D6) nên hành vi quan sát được không đổi.
3. **Giữ nguyên đường trust-signal** — `readLockedContext`/`resolveContentRoot`
   (định nghĩa trong `decompose.mjs`, dùng chung cả hai file) không đụng tới:
   không phụ thuộc `runJudgeExecutor`, là nhánh B1 độc lập (`tsk-ozl`).
4. **`judgeVerifySemanticCorrectness` — SỬA LẠI, đọc code thật lúc
   `fgos-coding-validating` lật ra sai lầm ở đây.** Approach bản đầu coi nó song
   song với `judgeDiscovery`/`judgeDecompose` (gọi khi thiếu callerVerdict).
   **Sai** — đọc `discovery.mjs:671`/`decompose.mjs:893` xác nhận nó chạy
   **KHÔNG ĐIỀU KIỆN** trên mọi `verdict.clear`, kể cả khi verdict đến từ
   `callerVerdict` (không nằm trong nhánh `else` của judge cũ). Đây chính
   là cơ chế đã bắt cả 2 dispute thật của `tsk-5kn` hôm nay — cả hai lần
   em đều truyền `--verdict` tường minh, và vẫn bị từ chối bởi đúng hàm
   này.

   Hàm có 2 nhánh: **mechanical** (`matchesKnownBadVerifyPattern`, dò
   pattern `node --test` sai cách grep TAP — thuần cú pháp, không gọi
   subprocess) và **LLM-fallback** (gọi `runJudgeExecutor`). Cả 2 dispute
   thật hôm nay đều ra từ nhánh LLM, không phải nhánh mechanical — tức
   nhánh LLM đang làm việc thật, bắt đúng 2 lỗi khác nhau.

   Quyết định (thay giả định 3 cũ): **nhánh mechanical Ở LẠI trong verb**
   (rẻ, tất định, không subprocess, đúng tinh thần D1 "verb chỉ ghi" vì nó
   không judgment — chỉ so pattern). **Nhánh LLM-fallback BỊ GỠ HẲN** khỏi
   verb, không chuyển thành lời gọi từ soul bên trong verb (verb là hàm
   Node thuần, không gọi Task được — đúng giới hạn cấu trúc D1 đã chỉ ra
   cho 2 hàm kia, áp y hệt ở đây). **Chi phí thật, không giấu:** verb sẽ
   không còn tự bắt được loại lỗi như dispute #2 hôm nay (regex
   false-negative theo cấu trúc) — trách nhiệm đó chuyển sang skill gọi
   verb (đọc kết quả `verify-disputed` cũ đã chứng minh cơ chế dispute vẫn
   hoạt động, chỉ là người/soul phải tự phán thay vì verb tự phán) và kỷ
   luật `fgos-coding-validating`'s reality gate (chính cơ chế vừa bắt ra phát
   hiện này).
5. **Xoá `judge-executor.mjs` + `judge-fail-log.mjs`** sau khi cả ba hàm
   không còn consumer nào.
6. **Chia lại 244 test case thành ba loại** (không đoán trước tại planning —
   quyết định per-test lúc implement):
   - Test hành vi **riêng** của `judgeDiscovery`/`judgeDecompose`/
     `runJudgeExecutor` (retry, fail-safe, JSON parse) → **xoá cùng hàm**.
   - Test hành vi **khác** của `resolveDiscovery`/`resolveDecompose`
     (re-entrancy, trust-signal, claim release) tình cờ đi qua đường
     judge cũ để dựng fixture → **viết lại dùng `callerVerdict`**, giữ
     nguyên hành vi đang test.
   - Test khẳng định đúng **hành vi mặc định gọi judge** → **đảo khẳng
     định** theo D1/D16 (mặc định giờ là bắt buộc verdict / no-op ở runner).

**Shape.** Không split thêm — một mảnh, phạm vi lớn nhưng liền mạch (đổi
hợp đồng của 2 hàm + dọn hạ tầng dùng chung). Ca biên bắt buộc test:

- `resolveDiscovery`/`resolveDecompose` gọi **không** verdict, từ context
  `role: 'session'`/`'human'` → phải **từ chối rõ ràng** (không phải im
  lặng rơi vào judge như trước).
- `runOnce` gặp item ở `discovery`/`decompose` mà không có verdict → no-op,
  item giữ nguyên stage/status, không throw, không crash cả vòng quét.
- `readLockedContext` có `CONTEXT.md` hợp lệ → vẫn đi nhánh B1 y hệt trước,
  không bị đụng.
- `judgeVerifySemanticCorrectness` (dạng chuyển thành lời gọi từ soul) vẫn
  bắt được đúng 2 ca đã xảy ra thật: verify placeholder rỗng, và regex
  false-negative theo cấu trúc.

**Giả định — trạng thái sau `fgos-coding-validating`:**

1. ~~Xoá `judge-executor.mjs`/`judge-fail-log.mjs` không để lại import
   treo~~ — **ĐÃ CHỨNG MINH**: `rg -l "judge-executor" --glob "*.mjs" .`
   toàn repo cho đúng 9 file — 8 file đã nằm trong footprint (sau khi sửa
   mirror ở P1), cộng `test/cli/fgos.test.mjs` chỉ nhắc trong **comment**
   (`grep -n "^import.*judge-executor"` rỗng) — không cần sửa, không phải
   import thật.
2. 244 test case chia đúng ba loại như Approach bước 6 — **để nguyên,
   không đoán trước**: đây là công việc implement per-test, không phải
   giả định feasibility (không có "chứng minh trước" nào hợp lý cho việc
   sẽ làm đúng khi làm — giống mọi task code khác).
3. ~~`judgeVerifySemanticCorrectness` chuyển thành lời gọi từ soul~~ —
   **THAY BẰNG quyết định thật ở Approach bước 4** (đọc code lúc
   validating lật ra: hàm chạy không điều kiện, không gọi soul được vì
   verb là hàm Node thuần — giữ nhánh mechanical trong verb, gỡ hẳn nhánh
   LLM, chi phí đã nêu rõ). Vị trí đặt `matchesKnownBadVerifyPattern` sau
   khi tách khỏi `judge-executor.mjs` (inline vào `discovery.mjs`/
   `decompose.mjs`, hay module riêng nhỏ) — chi tiết implement, không
   quyết ở đây.

### P4 — `tsk-1w7` — stage machine: thêm `discovery` + `exploring`

- **Verify**: `npm test && rg -q "([\[,]|^) *[\x22\x27]discovery[\x22\x27]" src/state/workflow-stage-graphs.mjs && rg -q "([\[,]|^) *[\x22\x27]exploring[\x22\x27]" src/state/workflow-stage-graphs.mjs`
- **Footprint**: `src/state/workflow-stage-graphs.mjs,src/state/discover-pool.mjs,test/state/workflow-stage-graphs.test.mjs`
- **D-ID**: D3, D10, D11
- **Chờ**: P1, P2

### P5 — `tsk-5mj` — runner giao stage `discovery` cho worker chạy skill research

- **Verify**: `npm test && ! rg -q "resolveDiscovery" src/runner/loop.mjs`
- **Footprint đã sửa lúc planning** (bằng chứng thật, xem bên dưới):
  `src/runner/loop.mjs,src/runner/dispatch.mjs,src/runner/prompt-templates.mjs,src/runner/prompt-templates/worker-prompt-discovery.txt,test/e2e/runner-loop.test.mjs,test/runner/dispatch.test.mjs`
- **D-ID**: D6, D1, D7
- **Chờ**: P1, P4

**Approach (viết lúc fgos-coding-planning tsk-5mj, chưa có trong bản shaping gốc):**

Footprint gốc (`loop.mjs` + 1 test file) không đủ để giao thật — bằng chứng
đọc code trực tiếp:

1. `dispatch.mjs:139` — `buildPrompt` LUÔN gọi `skillForStage(domainObj,
   'executing')`, hardcode literal `'executing'`, bất kể item đang ở stage
   nào. `spawnWorker` (dòng 1068) luôn gọi `buildPrompt` nội bộ, không có
   cách nào truyền prompt khác từ ngoài. ⇒ dispatch thẳng một item
   `discovery` qua `spawnWorker` không sửa gì sẽ ra prompt SAI (bảo worker
   chạy `fgos-coding-implement`, không phải `fgos-researching`).
2. `prompt-templates/worker-prompt-skill-pointer.txt` dòng 30-31: **"Never
   call `fgos` yourself... the runner is the sole writer through that door
   during this dispatch."** — worker bị CẤM tự gọi `fgos discover`. Đường
   worker tự gọi verb (giống `fgos-coding-implement` tự gọi `fgos return`)
   KHÔNG áp dụng được ở đây — vi phạm luật đã có.
3. Cơ chế đúng, suy ra từ (2) + kênh `fgos-discovered` đã có sẵn (cùng
   file, dòng 35-48, "report, not write"): worker chạy `fgos-researching`,
   đạt verdict `{clear, verify?, question?}` (đúng shape
   `readScoutNotes`... không, đúng shape `callerVerdict` của
   `resolveDiscovery`, tsk-27y), **báo verdict đó ra stdout dưới dạng
   fenced block DATA-ONLY** (không gọi `fgos`) — RUNNER đọc block này sau
   khi worker thoát rồi TỰ gọi
   `resolveDiscovery(dir, item.id, config, 'runner', callerVerdict)` —
   role `'runner'` + `callerVerdict` thật, tổ hợp hợp lệ chưa ai dùng
   trước đây (tsk-1x3 D16 chỉ dùng role runner KHÔNG verdict, rơi vào
   no-op) nhưng code hiện tại của `resolveDiscovery` đã hỗ trợ sẵn (kiểm
   `callerVerdict` trước, không quan tâm role khi có).
4. Cần: (a) template mới `worker-prompt-discovery.txt` (khác
   `worker-prompt-skill-pointer.txt` — trỏ skill `fgos-researching` thay
   vì skill của stage `executing`, thêm hướng dẫn báo verdict qua fenced
   block mới, VD `` ```fgos-discovery-verdict ``, KHÔNG tái dùng
   `fgos-discovered` vì shape khác nhau: verdict là quyết định cho CHÍNH
   item, discovered-work là item MỚI); (b) `dispatch.mjs` cần một cách
   chọn template/skillPath theo stage thay vì hardcode `'executing'` —
   thêm tham số `stage` cho `buildPrompt`/route riêng, KHÔNG đổi hành vi
   mặc định (mọi call site hiện có vẫn ngầm định `'executing'`, zero
   regression); (c) `loop.mjs` thêm vòng "DISCOVERY DISPATCH" song song
   CLARIFY/DECOMPOSE SWEEP hiện có — quét `stage: discovery, status: todo`,
   dựng worktree qua `createDispatchWorktree` (dùng lại, không viết mới),
   gọi `spawnWorker` với route mới, parse fenced verdict block từ
   `worker.stdout` sau khi thoát, gọi `resolveDiscovery` với verdict đó.
   Không cần goal-check (stage `discovery` không phải điểm chứng minh cuối
   — đó vẫn là việc của `executing`); không move sang `awaiting-approval`
   — `resolveDiscovery` tự quyết định stage/status tiếp theo giống mọi
   caller khác.
5. Rủi ro: **cao** — cơ chế báo-verdict-qua-fenced-block hoàn toàn mới,
   chưa test end-to-end thật nào. Cần `fgos-coding-validating` tự chạy thử một
   dispatch discovery thật (script giả lập worker) trước khi chốt READY.

**Sửa lại lúc `fgos-coding-implement` (D-ID thêm: không có verdict ở stage
discovery):** ý (3)/(4) ở trên (worker báo verdict qua fenced block, runner
gọi `resolveDiscovery`) SAI — đọc lại kỹ hơn thì `resolveDiscovery` chỉ xử
lý cạnh `clarify -> decompose`, không có hàm engine nào xử lý cạnh
`discovery -> exploring` cả (không phải `resolveDiscovery`, không phải
`resolveDecompose`). Verify của chính item này (`! rg -q "resolveDiscovery"
src/runner/loop.mjs`) thực ra đã ngầm xác nhận điều này — cấm dùng
`resolveDiscovery` nghĩa là cơ chế thật KHÔNG được dựa vào nó. Thiết kế
cuối: **discovery không có verdict, không có judgment gate** — đúng tinh
thần D3 ("pha máy-một-mình", không có câu hỏi cho người ở stage này, câu
hỏi thật chỉ xảy ra ở `exploring`). Worker chạy `fgos-researching`, ghi
`RESEARCH.md`, commit — RUNNER kiểm có commit thật hay không
(`branchFacts(...).aheadCount > 0`, cùng kỷ luật `facts.aheadCount > 0` của
dispatch `executing`) rồi **advance thẳng** `discovery -> exploring` qua
`moveStage` trực tiếp (literal, không qua `stageForStep` vì hai stage này
không map step nào cả — tsk-1w7 D10). Không cần kênh fenced-block verdict
mới; kênh `fgos-discovered` (report-not-write) vẫn giữ nguyên cho việc con
phát sinh ngoài ý, không đổi shape. Đã test thật end-to-end (fake worker
script, worktree/branch thật) trong `test/e2e/runner-loop.test.mjs`.

### P6 — `tsk-puz` — migration 57 item đang ở `clarify`

- **Verify**: `npm test`
- **Footprint đã sửa lúc planning** (bằng chứng bên dưới):
  `scripts/migrate-clarify-split.mjs,test/state/migrate-clarify-split.test.mjs,src/state/workflow-stage-graphs.mjs,test/state/workflow-stage-graphs.test.mjs`
- **D-ID**: D12
- **Chờ**: P4

**Approach (viết lúc fgos-coding-planning tsk-puz):**

D12: chưa ai đụng → giữ `clarify`; đã có D-ID (quyết định thật đã log) → `discovery`; đang park `awaiting-human` (giữa vòng hỏi-đáp) → `exploring`.

Tín hiệu mechanical, đọc thẳng từ view đã replay (không đoán, không LLM):
- `status === 'awaiting-human'` ⇒ đích `exploring`.
- `decisionsById[id]?.length > 0` HOẶC `docsRef` trỏ tới `CONTEXT.md` có nội dung thật (`readLockedContext`, tái dùng từ `decompose.mjs`, đã export) ⇒ đích `discovery`.
- Còn lại (chưa đụng gì) ⇒ đích `clarify` — no-op, không ghi gì.

**Phát hiện thật lúc planning, sửa footprint tại chỗ:** đích `exploring` cần cạnh chuyển `clarify -> exploring` TRỰC TIẾP trong `DOMAINS.coding.transitions` — tsk-1w7 (P4) chỉ thêm `clarify -> discovery`, `discovery -> exploring`, `exploring -> decompose` (đúng luồng tuần tự cho item MỚI), không có cạnh nhảy thẳng `clarify -> exploring` cho item ĐANG PARK migrate vào. Đi qua `discovery` trước rồi mới `exploring` sai về ngữ nghĩa: `discovery` là research thuần máy (D3), một item đang park giữa câu hỏi cho người không nên bị coi là "đi research" — nó đã ở đúng chỗ máy+người rồi. Thêm 1 dòng transition mới vào `workflow-stage-graphs.mjs` (không đổi `stepMap`, không đổi stage nào khác).

Script `scripts/migrate-clarify-split.mjs` theo đúng khuôn `migrate-status-proposed-to-awaiting-approval.mjs`/`migrate-actor-to-role.mjs` đã có (lock qua `events.mjs`, `--backup` bắt buộc, đọc lại backup trước khi ghi) nhưng khác chỗ quan trọng: hai script cũ REWRITE RAW LOG (string substitution trên value), còn migration này cần ĐỌC VIEW ĐÃ REPLAY (`listWork`) để biết `status`/`decisionsById`/`docsRef` của từng item rồi GHI QUA CỬA THẬT (`moveStage`, `role: 'system'`, cùng quy ước `retrospective` verb dùng cho sweep hàng loạt) — không rewrite log trực tiếp. Idempotent tự nhiên: item đã ở đúng đích thì `moveStage`'s `expectedStage` không khớp `clarify` nữa, bỏ qua (không throw, không ghi lại).

**Reality gate riêng cho P6** (không lặp lại phần chung của tsk-5kn):
- Repo fit PASS: `readLockedContext`/`decisionsById` đều đã export/tồn tại thật (đọc `decompose.mjs`, `store.mjs`).
- Assumption rủi ro trung bình: "idempotent" — chứng minh bằng chính code (CAS qua `expectedStage`), không phải giả định suông.
- Proof surface: verify `npm test` — cần test thật cho script (dry-run + apply + idempotent-rerun), viết lúc `fgos-coding-implement`.

Verdict: READY WITH CONSTRAINTS (constraint: thêm 1 transition edge vào P4's schema, ngoài footprint gốc nhưng cùng file P4 đã sửa — rủi ro thấp, chỉ thêm 1 dòng dữ liệu, không đổi hành vi cạnh cũ).

## Giả định đã ghim (chưa chứng minh — việc của `fgos-coding-validating`)

1. **Tên skill `fgos-clarifying`** — `CONTEXT.md` không đặt tên cho skill
   của stage `clarify`; plan này chọn theo quy ước `-ing` sẵn có
   (exploring/planning/validating/researching). Không phải quyết định sản
   phẩm, chỉ là đặt tên nhất quán — nếu sai thì đổi rẻ.
2. **`judge-executor.mjs` xoá được hoàn toàn** sau khi cả ba consumer rời
   đi. Chưa kiểm có consumer nào ngoài `src/intake/` không — `fgos-coding-validating`
   phải xác nhận trước khi P3 chạy.
3. **`judgeVerifySemanticCorrectness` chuyển thành lời gọi từ soul**, không
   phải xoá trắng. `CONTEXT.md` để ngỏ ("gỡ hẳn, hay chuyển thành lời gọi
   từ soul như hai cái kia"). Plan chọn *chuyển*, vì nó vừa bắt lỗi thật hai
   lần trong chính vòng clarify của item này — xoá trắng là mất một lớp
   đang hoạt động.
4. **Migration chạy một lần, idempotent**, không phải lười (lazy). Chọn vậy
   để `stage` đọc lên luôn đúng ngay, không phụ thuộc item có được chạm hay
   chưa.

## Reality gate (`fgos-coding-validating`)

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
| Migration idempotent | trung bình | Chưa viết code — không có gì để kiểm bây giờ, để nguyên là giả định chưa chứng minh cho `fgos-coding-implement` của P6 tự chứng minh qua `npm test` | Chưa chứng minh — chấp nhận được, vì P6 không nằm trên wave 1/2 |

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
