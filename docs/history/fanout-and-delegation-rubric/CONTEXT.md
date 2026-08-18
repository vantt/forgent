# tsk-5kn — quyết định đã khoá

Tách `clarify` thành ba stage, thêm skill research tái dùng, trả verb
`discover`/`decompose` về đúng vai cửa ghi sổ thuần.

Nguồn thảo luận: `DISCUSSION.md` cùng thư mục (7 vòng shaping, D1–D8).
Vòng `clarify` của chính item này bổ sung D9–D14. Vòng `decompose` của
`tsk-1x3` (P3) bổ sung D16.

## Feature boundary

**Trong phạm vi:**

- Thêm hai stage (`discovery`, `exploring`) vào domain `coding`, giữ
  `clarify`; migrate 57 item đang ở `clarify`.
- Một skill research mới, stage-agnostic, tái dùng được — chạy trong một
  soul (session sống hoặc worker do runner spawn), fan-out native được,
  viết `RESEARCH.md` tích luỹ.
- Một skill `clarify` mới: soul tự phán hiểu-hay-không-hiểu ý định, chỉ hỏi
  khi không hiểu, và được viết lại `title`/`description`.
- Đảo mặc định của `resolveDiscovery`/`resolveDecompose`: caller-verdict
  thành đường chính; gỡ judge khỏi cả **ba** consumer của
  `runJudgeExecutor`.
- Cho `fgos-runner` giao stage `discovery` cho worker chạy skill research
  qua chính `spawnWorker`/`createWorktree` nó đã dùng cho `executing`.

**Ngoài phạm vi:**

- **Fan-out B** (bung N children song song sau decompose) — item riêng
  `tsk-umc`. `DISCUSSION.md` §3 hàng 36 ghi rõ ranh giới này.
- Đặt tên/hình thức hoá ô **review-class** trong lưới dispatch L1
  (`DISCUSSION.md` §3 hàng 39). D9 gỡ `judgeVerifySemanticCorrectness`
  khỏi `runJudgeExecutor`, nhưng việc phân loại nó thành một lớp dispatch
  có tên là việc khác, chưa có item.
- Sửa luật cấm ad-hoc delegation của `tsk-29i` — D2 đã chốt là **không
  cần sửa**.

## Locked decisions

### Từ vòng shaping (`DISCUSSION.md`)

| D-ID | Quyết định |
|---|---|
| D1 | Verb là **cửa ghi sổ thuần**; skill là bên sản xuất verdict. Luật one-door-write chỉ đòi mọi *ghi* đi qua CLI, không đòi verb phải *tạo ra* giá trị được ghi |
| D2 | **`tsk-29i` không cần sửa** — luật chỉ cấm *"ad hoc sub-dispatch"* và tự chỉ đường *"route it explicitly through the capacity-dispatch mechanism"*; skill research có hợp đồng chính là đường đó |
| D3 | Tách stage: pha máy-một-mình tách khỏi pha máy+người |
| D4 | Research là **skill tái dùng, stage-agnostic** — nhận *(mô tả + đã biết gì)*, trả *(lời giải + verdict)*, không được biết mình bị gọi từ stage nào |
| D5 | Bản đúc kết research ở **`docs/history/<feature>/RESEARCH.md`, tích luỹ theo vòng**, bắt cả WebSearch/WebFetch. Không trộn vào `CONTEXT.md` — hai độ tin cậy khác nhau |
| D6 | **Ca "không có soul khả dụng" không tồn tại** — runner đã `spawnWorker` cho thi công (`loop.mjs:707`), worker spawn là agent loop thật (nesting rule `0026`) |
| D7 | Research giữa chừng exploring là **lời gọi trong-stage**; research là **stage dispatch được của item đã có**, không phải work item riêng |
| D8 | Trigger research **bỏ hẳn** câu hỏi *"agent có biết cái này không"* — chỉ hỏi *bằng đường nào*: tên **có** trong repo ⇒ đọc tại chỗ; **không có** ⇒ tra ngoài |

### Từ vòng `clarify` của item này

| D-ID | Quyết định |
|---|---|
| D9 | Gỡ judge khỏi **cả ba** consumer của `runJudgeExecutor`, không chỉ discovery |
| D10 | **GIỮ `clarify`**, thêm `discovery` + `exploring`. Stage array: `clarify → discovery → exploring → decompose → executing` |
| D11 | **Nguyên tắc đặt ranh giới stage**: rơi đúng chỗ *ai là **TÁC GIẢ** nội dung* thay đổi — không phải ai duyệt |
| D12 | Migration 57 item ở `clarify`: chưa ai đụng → `clarify`; đã có D-ID → `discovery`; đang park `awaiting-human` → `exploring` |
| D13 | Skill ở `clarify` là một **soul tự phán** hiểu-hay-không-hiểu ý định; **chỉ hỏi khi không hiểu**, không phải vào là hỏi |
| D14 | Soul ở `clarify` được viết lại `title`/`description` — **áp thẳng rồi báo lại một dòng**, không chờ duyệt |

### Từ vòng `decompose` của `tsk-1x3` (P3)

| D-ID | Quyết định |
|---|---|
| D16 | `resolveDecompose` **không đối xứng** với `resolveDiscovery` — nhánh không-verdict của nó rơi vào `judgeDecompose` thật (chỉ miễn khi `plan.md` ghi `tiny`/`small`). `runOnce` (`loop.mjs:1051`) là caller **duy nhất** không truyền verdict. Quyết định: `callerVerdict` bắt buộc; nhánh không-verdict thành **no-op an toàn** (không throw, không gọi judge) — không phải lỗi. Áp dụng cùng logic D6 đã dùng cho discovery: runner chưa từng chạy thật, no-op không đổi hành vi quan sát được nào trong dogfood history hôm nay; throw mới là regression thật nếu ai đó bật runner sau này |
| D17 | `judgeVerifySemanticCorrectness` chạy **không điều kiện** trên mọi `verdict.clear`, kể cả `callerVerdict` — khác hẳn `judgeDiscovery`/`judgeDecompose` (đọc `discovery.mjs:671`/`decompose.mjs:893` xác nhận). Bằng chứng sống: cả 2 dispute thật hôm nay trên `tsk-5kn` xảy ra dù luôn truyền `--verdict`. Quyết định: **giữ nhánh mechanical** (`matchesKnownBadVerifyPattern`, không subprocess) **trong verb**; **gỡ hẳn nhánh LLM-fallback** (gọi `runJudgeExecutor`) — verb là hàm Node thuần, không gọi Task được, cùng giới hạn cấu trúc D1 đã chỉ ra. Chi phí thật: verb không còn tự bắt được lỗi kiểu dispute #2 (regex false-negative theo cấu trúc) — trách nhiệm chuyển sang skill gọi verb + kỷ luật `fgos-coding-validating` |

## Thuật ngữ đã ghim

- **`clarify`** — pha làm rõ **ý định**. Người là tác giả. Loại câu hỏi ở
  đây **không research được**: quét repo hay tra web bao nhiêu cũng không
  trả lời được *"anh muốn gì"*.
- **`discovery`** — pha làm rõ **lời giải**. Máy là tác giả, làm một mình:
  scout hệ sinh thái, tra cứu ngoài, tự kết luận rõ/chưa rõ.
- **`exploring`** — pha chốt **quyết định sản phẩm**. Người là tác giả.
  Loại quyết định ở đây chỉ **nảy sinh sau** khi research bày ra lựa chọn.
- **tác giả vs người duyệt** (D11) — stage mà *máy* là tác giả thì loop
  drain được (dừng ở cổng duyệt nếu có); stage mà *người* là tác giả thì
  loop không đụng vào được chút nào.
- **cửa ghi sổ thuần** — verb nhận verdict và ghi, không phán.

## Bằng chứng scout

- `runJudgeExecutor` có **ba** consumer — `judgeDiscovery`
  (`src/intake/discovery.mjs`), `judgeDecompose`
  (`src/intake/plan.mjs`), `judgeVerifySemanticCorrectness`
  (`src/intake/judge-executor.mjs`). Xác nhận bằng `rg` + GitNexus call
  graph. → D9.
- Domain `coding` hiện: `stages = ['clarify','decompose','executing']`;
  `transitions` đã có sẵn cạnh **`clarify → executing`**, nên stage là *vị
  trí*, không phải *bước bắt buộc* — item nhỏ vẫn nhảy thẳng được. → D10
  (chi phí thêm stage có trần).
- **7 file** đọc literal `'clarify'`: `workflow-stage-graphs.mjs`,
  `replay.mjs`, `discover-pool.mjs`, `report/entropy.mjs`,
  `intake/discovery.mjs`, `bin/fgos.mjs`, `runner/loop.mjs`.
- **57 item còn mở đang ở `clarify`** (so với 5 ở `decompose`, 9 ở
  `executing`, 7 không có stage). → D12.
- `titleProposal`/`descriptionProposal` **đã tồn tại** (`tsk-4rd`): prompt
  yêu cầu, verdict mang, `addDiscovery` persist — nhưng **không bao giờ
  áp** vào `work.title`/`work.description`. Lý do ghi nguyên văn tại
  `src/intake/discovery.mjs:430-439`: *"Auto-overwriting a user-authored
  field is a **product decision this item didn't make**"*. Tức để ngỏ, không
  phủ quyết. → D14.
- `.fgos/events.jsonl` append-only ⇒ mọi `edit` là một event, bản gốc không
  mất, hoàn tác và truy vết được. → làm D14 an toàn.
- `impact-analysis: full` — GitNexus registered, `status: "present"`
  (`fgos tool query`). Ghi nhận thông tin, không gate gì ở stage này.
- Item đụng skill-prose (`.claude/skills/**/SKILL.md`) ⇒ verify phải theo
  `docs/how-to/write-verify-for-a-skill-prose-change.md`: hình dạng
  `npm test && POSITIVE && NEGATIVE`, có `--hidden`, ghim cụm đủ dài.

## Rủi ro đã ghi nhận (không chặn, để đo sau)

`clarify` và `exploring` **đều là đối thoại với người**, nên trong thực tế
có thể dính lại: agent hỏi ý định và hỏi quyết định trong cùng một lượt,
item nảy qua nảy lại. Thứ chặn nguy cơ đó là **`discovery` nằm giữa** — ý
định phải rõ *trước* mới research được, quyết định sản phẩm chỉ xuất hiện
*sau* khi research bày ra bàn.

Nếu chạy thật một thời gian mà thấy agent thường xuyên hỏi cả hai loại
trong một lượt **không cần research xen giữa**, thì hai stage đó đúng là
nên gộp. Đó là tín hiệu **đo được sau**, không phải phán đoán bây giờ.

## Câu còn để lại cho `fgos-coding-planning`

- **Hình chia việc.** `DISCUSSION.md` §7 đã đề xuất 5 hạng mục, nhưng đó là
  bản trước D9. D9 (gỡ cả ba judge) mở rộng phạm vi thật, và D10 thêm một
  stage nữa (`clarify` giữ lại + skill riêng cho nó) — planning phải chia
  lại, không dùng nguyên §7.
- **Cơ chế migrate 57 item** — làm bằng gì, chạy một lần hay theo lười,
  rollback thế nào.
- **`judgeVerifySemanticCorrectness` đi đâu** sau khi rời
  `runJudgeExecutor` — gỡ hẳn, hay chuyển thành một lời gọi từ soul như hai
  cái kia. Việc đặt tên nó thành lớp *review-class* thì nằm ngoài phạm vi
  (xem Feature boundary).
- **`verify` thật cho item này** — chưa có; `fgos-coding-exploring` không thiết kế
  verify (luật "không nghiên cứu implementation"). Hình dạng bắt buộc đã
  ghi ở mục Bằng chứng scout.

## Tham chiếu

- `DISCUSSION.md` (cùng thư mục) — 7 vòng shaping, D1–D8, §6 thiết kế đầy
  đủ + sơ đồ, §7 hạng mục (bản trước D9).
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, 4 quy tắc, và mục "Việc chưa quyết" nêu
  đúng câu hỏi "đặt lớp quyết định ở đâu" mà item này trả lời.
- `docs/history/two-layer-dispatch/` — D1–D12, lưới L1/L2, gói 6 ô.
- `docs/history/fgos-stage-skills-task-delegation-audit/CONTEXT.md`
  (`tsk-29i`) — luật cấm ad-hoc delegation mà D2 chốt là **không sửa**.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` — hình dạng verify
  bắt buộc cho item đụng skill prose.
- `tsk-umc` — fan-out B, item riêng, ngoài phạm vi item này.
