# fgOS — Luồng xuyên suốt từ ý tưởng đến xong: viễn cảnh mong muốn vs thực trạng

**Ngày:** 2026-08-08 · **Phạm vi:** toàn hệ (vision, code, state thật, UX vận hành)
**Nguồn bằng chứng:** `.fgos/events.jsonl` (9.693 event), `.fgos/state.json` (445 work item),
`npm test` (2.638 test), docs/decisions, docs/specs, `.claude/skills/fgos-*`, `plugins/fgOS/skills/*`

---

## 0 · Tóm tắt một trang

fgOS **không phải** runner headless không người. Theo `docs/work-item-lifecycle-vision.md:15`, nó là
**pipeline bán-tự-động (mixed-autonomy)**: tự động là mặc định, người xen vào ở những **cổng có điều
kiện**, và mức người-tham-gia **thay đổi theo giai đoạn**.

Khác biệt cốt tử được nêu tường minh: *"bee chặn phiên chat ở mỗi gate; fgOS biến gate thành
checkpoint bất đồng bộ mà hệ đậu lại (park) và chờ người quay lại"* — **người không phải lúc nào
cũng ngồi đợi**.

Đo trên vận hành thật, kết luận gọn:

| | |
|---|---|
| **Khúc build thật đã rất nhanh** | `doing → awaiting-approval` median **0,3h** (18 phút), p90 2,6h |
| **Khúc merge đã rất nhanh** | `awaiting-approval → delivered` median **0,1h** |
| **Nhưng tổng thời gian tới `done`** | median **27,2h**, p90 112h |
| **Vì đuôi hậu-merge dài** | `delivered → done` median **64,9h**, p90 122h |
| **Và chế độ async gần như chưa dùng** | `mode: sync` **301** vs `mode: async` **4** |

Nói cách khác: **fgOS đã làm được phần khó (tự viết code đúng, có bằng chứng) nhưng chưa làm được
phần nó tự đặt làm khác biệt cốt tử (người rời đi rồi quay lại)**. Người vẫn ngồi đợi.

**Phát hiện quan trọng nhất của bản quét này — nguyên nhân gốc nằm cao hơn một bậc so với triệu
chứng, và nó là một quyết định cố ý:**

> **fgOS chưa có kênh chú-ý (attention/push) nào cả.** Hôm nay nó là mô hình pull đồng bộ thuần
> tuý — gọi verb, nhận envelope. Kênh push thật (STR48) chưa khởi động, và đang *chờ có chủ đích*:
> `system-overview.md:55` ghi *"poll bắt đầu khó chịu là tín hiệu kênh chú-ý đến lượt."*

Chuỗi nhân quả kéo theo:

```
Không có kênh chú-ý → async không gọi được người quay lại → mọi người chạy sync (301/305)
  → người dù sao cũng ngồi đó → nên lái tay thay vì chạy loop → loop không chạy
    → clarify dồn 51, cleanup dồn 128
```

**Và một mắt xích thứ hai, song song — chất lượng câu hỏi (§4.3b):** khi hệ *có* hỏi, câu hỏi
thường không trả lời được. Đo trên 314 lượt hỏi người thật:

- **202/314 (64%) là tranh chấp verify máy-vs-máy** — hai judge cãi nhau một pattern `grep` rồi đẩy
  người lên làm trọng tài. Không phải quyết định sản phẩm.
- Chỉ **21%** câu hỏi có phương án rõ ràng; chỉ **45%** tự nói nó đang hỏi về item nào.
- **34 item bị hỏi ≥3 lần**, một item (`tsk-48i`) bị hỏi **23 lần** — người bị dùng làm vòng retry,
  không phải người ra quyết định.

**Hai mắt xích này nhân nhau.** Xây kênh chú-ý mà chưa sửa chất lượng câu hỏi = đẩy 23 thông báo
về `grep` lên điện thoại người ta. **Sửa chất lượng câu hỏi trước.**

Hai nút tắc dưới cùng gỡ được **bằng một lệnh**; nút gốc thì không:

- 51 item kẹt `clarify`: **46 cái tự do chạy, 0 cái từng qua discovery** → thiếu một lần
  `/fgOS:discover-loop`.
- 128 item tồn `cleanup`: **112 cái là leaf TTL 0 ngày, sẵn sàng đóng ngay** → thiếu một lần
  `/fgOS:cleanup-loop`. (Giả thuyết "TTL soak 7 ngày, đúng thiết kế" đã bị bác: 0 root nào hết TTL
  mà chưa quét.)
- 4 item async: cả 4 đều tới `done` — nhưng đường headless **chưa từng chạy an toàn lần nào**, và
  **mốc MVP2 chưa đạt** (§4.1).

Nghịch lý: **hệ được xây để người khỏi ngồi canh, nhưng chưa có cách nào báo cho người biết khi nào
được rời đi.** Nên người ở lại. Và vì đã ngồi đó, họ lái tay.

⚠️ **Một việc cần vá trước mọi việc tăng tốc:** `p-73d99989` — `reclaimOrphanedCheckout` force-xoá
worktree mà không kiểm phiên sống; đã có sự cố xoá mất worktree đang chạy giữa phiên (§4.4b).

---

## 1 · Viễn cảnh mong muốn — hệ này rốt cuộc muốn cho người ta trải nghiệm gì

### 1.1 Ba tiêu chí sản phẩm, thứ tự cố định (`docs/decisions/0025`)

1. **Ship Faster** — giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux, ít chờ đợi.
2. **DoD** — reproducibly verifiable result + evidence-linked documentation.
3. **Polish Sau DoD** — hoàn thiện sau ngưỡng, không mở scope.

Điều làm rõ ngày 2026-08-05 rất quan trọng và hay bị hiểu sai:

> "ship faster nghĩa là các project sử dụng tool này để ship phải ship được faster (không loại trừ
> fgos) tuy nhiên nếu tập trung ship fgos nhanh hơn mà làm các sản phẩm dùng nó không faster được
> là không đúng."

Tức là: **thước đo là tốc độ của project ĐANG DÙNG fgOS**, không phải tốc độ team fgOS build tính
năng của chính fgOS. Một lựa chọn thiết kế rẻ cho fgOS nhưng làm dev dùng fgOS chậm hơn (noise đọc
advisory, chờ gate, friction thao tác) là **sai theo tiêu chí**, dù nó rẻ.

### 1.2 Trải nghiệm mong muốn, kể như một câu chuyện

Đây là viễn cảnh khi ba tiêu chí trên đạt đủ:

> **8:00** — Một người có ý tưởng. Họ gõ **một câu tiếng Việt tự nhiên** vào terminal, không cần
> biết schema, không cần chọn tier/kind/risk, không cần biết item nào đang chạy. Hệ đọc câu đó,
> tự phân loại, tự đặt id, tự viết ra "bằng chứng thế nào là xong" (`verify`) cho chính item đó.
>
> **8:01** — Người **đóng laptop và đi làm việc khác.** Đây là điểm cốt tử. Không phải "submit rồi
> ngồi canh".
>
> **Trong ngày** — Hệ tự chạy: làm rõ đề bài; nếu mơ hồ thì tự tra cứu trước; nếu vẫn mơ hồ thì
> **đậu lại với đúng một câu hỏi cụ thể** và chuyển sang item khác chứ không đứng im. Việc rõ thì
> tự lập kế hoạch nhỏ nhất trung thực, tự đối chiếu kế hoạch với repo thật, tự tách thành n item
> con độc lập, và chạy **song song** các item con trong worktree riêng của từng cái.
>
> **17:00** — Người mở lại máy. Họ thấy **một danh sách ngắn**: "3 việc xong, đang chờ anh duyệt.
> 1 việc cần anh trả lời câu này." Không có bãi log. Không phải đi tìm xem chuyện gì đã xảy ra.
>
> **17:05** — Người duyệt. Hệ merge, rồi **tự viết tài liệu người-dùng-cuối** từ chính cái vừa
> làm, tự phân loại Diataxis, tự cập nhật index, tự dọn branch/worktree.
>
> **Ngày hôm sau** — Hệ **học được từ chính lần chạy đó**: nó biết dự đoán của nó lệch thực tế ở
> đâu, và lần sau đoán đúng hơn.

Người chỉ phải làm đúng **hai việc**: *nói mình muốn gì*, và *duyệt cái đã xong*. Mọi thứ khác là
mặc định tự động; hệ chỉ hỏi khi thật sự không tự quyết được.

### 1.3 Hai chế độ intake — trục quyết định trải nghiệm

`docs/work-item-lifecycle-vision.md:32`:

- **(a) Submit rồi rời đi (un-attended/async)** — người nộp rồi bỏ đi; các bước sau **đậu ở
  cổng-người khi cần và chờ người quay lại**, bất đồng bộ, không chặn một phiên sống.
- **(b) Submit và xử lý ngay (collaborate-now/sync)** — người nộp và muốn làm cùng, dừng ở
  cổng-người theo thời gian thực.

**Chế độ (a) là thứ tạo ra toàn bộ giá trị "ít chờ đợi" của tiêu chí 1.** Chế độ (b) chỉ là bee
với vỏ khác.

### 1.4 Bản đồ người-tham-gia mong muốn

| Giai đoạn | Người tham gia? |
|---|---|
| 1 Intake / submit | **NGƯỜI** khởi tạo (2 chế độ) |
| 2 Ghi nhận + phân loại | Tự động |
| 3 Context-discovery | Tự động |
| 4 Simple → `ready` → pick | Tự động |
| 5 Unclear → `need-exploring` | Tự động chuyển trạng thái |
| 6 Exploring | **NGƯỜI** (hoặc hoãn tới khi người quay lại nếu chế độ (a)) |
| 7 Enrich + planning → queue | Tự động — *có thể* cần NGƯỜI (câu hỏi mở) |
| 8 Execute item nhỏ | Tự động |
| 9 Tạo PR | Tự động |
| 10 Review PR | **NGƯỜI** (cổng) |
| 11 Merge PR | Tự động |

Chỉ **2 ô NGƯỜI bắt buộc**: submit (1) và review (10). Ô (6) chỉ bật khi thật sự mơ hồ.

### 1.5 Thang trưởng thành mong muốn (`platform-foundations.md` L6)

F0 Bare → F1 Lawful → F2 Stateful → F3 Routed → **F4 Compounding** → **F5 Self-improving**.

fgOS **đã claim F4** (2026-07-16, có benchmark thật). Đích là **F5: học từ chính vận hành, cải
tiến có outcome đo được**.

---

## 2 · Quy trình mong muốn, chi tiết từng khâu

Đây là luồng chuẩn mà `docs/architecture-map.md:390` vẽ, mỗi bước kèm hợp đồng của nó.

### Khâu 1 — Intake

**Người gõ:** `fgos submit "<văn xuôi tự do>"` hoặc `/fgOS:submit`.

Skill `fgos-submit-assist` đọc câu đó, **tự suy luận** tier/kind/risk kèm lý do một dòng, rồi
gọi `fgos submit` chỉ với những field nó thật sự tự tin. Verb tự derive title, tự sinh id
`tsk-<hash>` không đụng độ.

Ra: item `status: todo`, `stage: clarify`. Hợp đồng CTR001.

### Khâu 2 — Clarify (làm rõ)

`fgos-clarifying` chạy **im lặng theo mặc định**: nó chỉ nói khi thật sự không hiểu đề bài. Không
Socratic theo phản xạ.

- Gặp khái niệm/thư viện lạ → gọi `fgos-researching` tự tra trước, không hỏi người.
- Còn gray area sản phẩm thật → `fgos-coding-exploring` chốt quyết định cùng người, ghi `CONTEXT.md`.
- Không tự quyết nổi → `fgos ask <id> --text "<đúng một câu hỏi>"` → `awaiting-human`. **Hệ không
  đứng im**; item khác chạy tiếp (CTR004).

Verb: `fgos discover <id>` — chuyển `clarify → decompose`, hoặc park. Cờ `--verdict` cho phép một
phiên sống đã tự suy luận cấp thẳng verdict, bỏ qua judge subprocess.

### Khâu 3 — Decompose (chia việc)

`fgos-coding-planning` viết **kế hoạch nhỏ nhất trung thực** (`plan.md`); `fgos-coding-validating` **đối chiếu kế
hoạch với repo thật** — reality check, không phải chỉ nghe hợp lý.

Verb: `fgos plan <id>` — pass-through nếu đủ nhỏ, hoặc **tách thành n item con độc lập**,
dependency rõ. Safety gate (heavy-risk / blast-radius / footprint-overlap) áp **vô điều kiện**, kể
cả khi caller tự cấp verdict.

### Khâu 4 — Execute (thực thi)

`fgos pick <id>` → claim + **dựng worktree cô lập `fgw/<id>`** trong một bước.

`fgos-coding-implement` viết code thật, tự chạy `verify` của chính item đó, rồi gọi `fgos return
<id>` → `awaiting-approval` (verify xanh) hoặc `blocked` (verify đỏ).

**Song song:** khi một item đã tách con, `fgos-fanout` sóng các con qua `computeSchedule`, bắn tối
đa **5 Agent mỗi wave**, đọc state sống trở lại (**không bao giờ tin lời kể của Agent**), tự duyệt
mỗi leaf đạt `awaiting-approval` — **trừ** leaf trúng từ khoá rủi ro, vẫn cần người. Config:
`parallel.maxRoots 4`, `maxLeavesPerRoot 4`.

### Khâu 5 — Review (cổng người tuyệt đối)

`fgos review <id>` — xem diff + trace tại chỗ, hoặc `--github` mở PR thật qua `gh`.

**Đây là cổng người không bao giờ được tự động hoá.** `/fgOS:cook` ghi thành hard rule:
*"Stop at `awaiting-approval`, never merge... the internal PR review gate is a human decision,
always."*

### Khâu 6 — Merge

`fgos approve <id>` → merge vào main → `delivered`. Hoặc `fgos merge-next` chọn item xếp hạng cao
nhất theo `rankImpact` trong số item **đã hết dep chờ và không đụng footprint**.

### Khâu 7 — Compound-learn

`fgos retrospective` quét mọi item `delivered` → `retrospective`.
`fgos-coding-compounding` đọc capture thật, phân loại Diataxis, viết **tài liệu người-dùng-cuối** có trích
dẫn bằng chứng. `fgos-indexing` / `fgos docs-index` sinh lại index đọc-theo-tag.

### Khâu 8 — Cleanup

`fgos cleanup <id>` kiểm TTL đã trôi, retrospective có nội dung thật, merge còn resolve trên main
→ xoá branch/worktree → `done`. TTL mặc định: **leaf 0 ngày, root 7 ngày**
(`src/setup/registrations.mjs:536,545`).

### Xuyên suốt — bốn luật giữ hệ không rối

1. **Mọi ghi đi qua đúng một cửa** (CTR002) — kể cả đường thất bại.
2. **Event log là sự thật, state là view** (L1/L3) — `fgos rebuild` dựng lại được toàn bộ.
3. **Người là participant có hợp đồng riêng** — CTR001 (submit) / CTR004 (ask-answer) / CTR005 (approve).
4. **Envelope thống nhất** — mọi output có `contract: "fgos.v1"`, `generated_at`, `data_hash`, `data`.

---

## 3 · Những gì ĐÃ làm được (kèm bằng chứng)

### 3.1 Nền tảng state — vững, không phải demo

- **445 work item thật**, 9.693 event, event log 4MB, state view 3,4MB.
- **Status FSM** đầy đủ với precondition + CAS (`src/state/status-fsm.mjs`): `todo → doing →
  awaiting-approval → delivered → retrospective → cleanup → done`, cộng nhánh `blocked`,
  `awaiting-human`, `wontfix`. `done` là terminal không lối ra.
- **Stage FSM** riêng, một tầng trên status (`src/state/stage-fsm.mjs`), domain-aware:
  `clarify → decompose → executing`, cộng cạnh `discovery`/`exploring`.
- **Registry đa domain đã có khung** (`src/state/workflow-stage-graphs.mjs:61`) — domain lạ fold về
  default kèm cảnh báo, **không bao giờ throw**.

### 3.2 Bề mặt CLI — 40+ verb, tự mô tả

Nhóm đủ: intake (`init/add/submit`), advance (`discover/decompose/move/retrospective/cleanup/
compound/edit`), người (`ask/answer/gate-approve/review/approve/reject`), claim
(`take/pick/return/session`), đọc (`list/ready/graph/schedule/conflicts/stale/triage/check/rollup/
show/lock-status/gate-bypass`), merge (`merge list|next/catchup/sync-root/promote-to-component`),
hạ tầng (`rebuild/repair/unlock/main-checkout-reset/setup/doctor/uninstall/tool/goal/evolve/
docs-index/doc-sources`).

Mỗi verb khai rõ `[read]` / `[write]` / `[external]` — người đọc biết trước cái gì đụng đĩa.

### 3.3 Cô lập và an toàn đồng thời

- Worktree riêng `fgw/<id>` mỗi item.
- `.fgos/main-checkout.lock` chống hai writer, kèm `lock-status` (free/live/stale/ambiguous) và
  `unlock` **từ chối force-delete** khi có phiên khác đang giữ thật.
- `main-checkout-reset` — đường an toàn duy nhất cho `git reset --hard`, **từ chối khi cây bẩn**
  cho tới khi người đọc hết `git status` toàn repo rồi `--confirm`.
- Executor spawn bằng argv array, `shell: false` — không nối chuỗi prompt vào shell.

### 3.4 Runner headless — có thật

`bin/fgos-runner.mjs`: `--once` (một lượt drain có biên) và `--watch` (daemon, re-derive frontier
mỗi commit, fallback poll 5s). Reap → pick FIFO head → dispatch worker headless trên nhánh cô lập →
goal-check bằng chính `verify` của item → ghi outcome qua store facade.

### 3.5 Capacity dispatch — chọn model theo tier, đa nhà cung cấp

`.fgos/config.json`: `light → haiku`, `standard → sonnet`, `heavy → opus`. Có capacity riêng cho
judge, và `submit-assist-classify` chạy **cross-provider** (`agy` / Gemini 3.5 Flash) — đúng tinh
thần "rẻ nhất đủ chất lượng".

### 3.6 Vòng compound-learning — chạy thật, không phải slide

- **362 nửa predicted / 335 nửa actual** — vòng dự đoán↔thực tế đủ hai nửa.
- **223 learning đã seal**.
- **151 tài liệu người-dùng-cuối tự sinh**: 105 trong `docs/explanation/`, 67 `docs/how-to/`,
  18 `docs/reference/`, 1 `docs/tutorials/`.
- **298 thư mục `docs/history/`** — capture ngữ cảnh từng item.
- Friction phân loại 5 tầng, tự quy tội: 141 event.

Đây là bằng chứng **F4 đang thật sự vận hành**, không chỉ được claim.

### 3.7 Tự động hoá theo vòng — 4 loop có điều kiện dừng thành văn

`/fgOS:discover-loop`, `/fgOS:retro-loop`, `/fgOS:merge-loop`, `/fgOS:cleanup-loop` — mỗi cái bọc
`/loop` quanh verb `-next` tương ứng, **mã hoá sẵn stop rule** (pool rỗng, lock-timeout, cùng item
block hai lần liên tiếp) để người không phải nhắc lại bằng miệng mỗi lần.

Hiệu quả đo được: 26 commit `retrospective synthesis` liên tiếp trong một ngày (2026-08-07).

### 3.8 Throughput thật — đã ở mức công nghiệp

| Ngày | Return | Merge |
|---|---|---|
| 2026-08-02 | 44 | 36 |
| 2026-08-03 | 30 | 28 |
| 2026-08-05 | 41 | 42 |
| 2026-08-06 | 43 | 39 |
| 2026-08-07 | 37 | 26 |

**~40 item return + ~35 merge mỗi ngày, duy trì một tuần.** Đây là con số rất mạnh.

### 3.9 Tự chủ ở khâu làm rõ

**476/538 (88%) discovery verdict = `clear: true`** — hệ tự hiểu được đề bài mà không cần hỏi.
Chỉ 4% gate là "không phán được rõ ràng — cần người xác nhận thủ công".

### 3.10 DoD gate đang giữ

`npm test`: **2.638 test, 2.633 pass, 0 fail, 5 skip, 186s.** Xanh.
**371/445 item có `verify` thật** (không phải "chưa xác định").

### 3.11 PR lifecycle — đã dựng, opt-in, **nhưng chưa từng chạy thật**

`fgos review <id> --github` mở/soi PR thật; `fgos approve <id> --github --pr` merge qua `gh`
(`bin/fgos.mjs:2133`, `:2421`). Auth uỷ hoàn toàn cho `gh` CLI, module không lưu token.

Cảnh báo: quét toàn bộ 9.693 event, **không có event PR nào** — 22 lần xuất hiện chữ "github/PR"
đều nằm trong title/description của item (mô tả herdr plugin), không phải dấu vết chạy. Tức bước
9-11 của tầm nhìn (*tạo PR → người review PR → tự merge*) **có code, có test đơn vị, nhưng chưa
được chứng minh end-to-end trên repo thật**. Merge hiện tại là `git merge` local.

### 3.12 Cockpit vận hành

`scripts/herdr-cockpit.sh` — 4 pane: runner loop, tail log, **cửa-người** (shell trần, cố ý không
script), dashboard poll `fgos list --json` 5s + bắn **đúng một** notification khi có item vào
`awaiting-human`. Hard rule: **herdr chỉ là chrome, không phải bộ não** — mọi tín hiệu trạng thái
đến từ event log fgOS, một nguồn sự thật.

---

## 4 · Những gì CHƯA làm được (kèm bằng chứng)

Xếp theo mức độ đánh vào tiêu chí 1 (Ship Faster / ít chờ đợi).

### 4.1 ⛔ Chế độ async — khác biệt cốt tử — đã chứng minh chạy được, rồi bỏ không dùng

**Bằng chứng:** `mode: sync` **301** item, `mode: async` **4** item.

Bốn item async đó **đều đã tới `done`** — đường async chạy được. Một trong số đó
(`tsk-1op`) ghi rõ trong title: *"str91 case-study: throwaway item to prove runner-headless"*.
Ba cái còn lại mang id kiểu cũ (`bo-hardcode-ten-trunk-main-...`), tức thuộc thời kỳ đầu nhất.

Nên đây **không phải khoảng cách năng lực — là khoảng cách vận hành**: đường đã dựng, đã chứng
minh, rồi không ai đi nữa.

Toàn bộ luận điểm phân biệt fgOS với bee nằm ở câu *"fgOS biến gate thành checkpoint bất đồng bộ mà
hệ đậu lại và chờ người quay lại — người không phải lúc nào cũng ngồi đợi."* Trên vận hành thật,
**99% item chạy ở chế độ đồng bộ**, tức người vẫn ngồi trong phiên.

**Nguyên nhân gốc (xem §5.1): không có kênh nào gọi người quay lại.** `ask`/`answer` và
`awaiting-human` đã có — đó là chỗ *đậu*. Cái thiếu là chỗ *gọi dậy*. Item đậu im lặng vô thời
hạn: **không timeout, không auto-resolve, không nhắc lại ở bất kỳ đâu trong lớp skill**. Loop coi
một lần đậu là "chuyển sang item kế tiếp", không bao giờ thử lại cho tới khi có trả lời.

Đây **không** phải khoảng cách năng lực ở lớp thực thi — mà là **một hệ con chưa xây** (STR48),
nằm ngoài core theo `0014`.

**Cảnh báo về mốc MVP2:** `docs/decisions/0018` yêu cầu chứng minh vòng lõi đạt kết cục **tương
đương** khi khởi động headless, không cú bấm tay nào. Backlog item `p-2a39f940` (còn `proposed`)
ghi: ca tương tác đạt verify xanh + commit thật nhưng **kẹt ở `awaiting-human` do `fgos return`
kiểm sai branch HEAD**; ca headless **chưa từng chạy thật lần nào** — `fgos-runner.mjs` resolve
repoRoot bằng `git rev-parse --show-toplevel` không có cờ override, mà testbed không phải git repo
riêng, nên gọi thật sẽ dispatch thẳng vào `.fgos/state.json` production 445 item. Ghi nguyên văn:
*"confirmed unsafe twice, never invoked for real."*

Vậy **MVP2 chưa đạt**, dù record `0018` mang status `accepted` — "accepted" mô tả phát biểu mốc,
không phải hệ đã chứng minh.

### 4.2 ⛔ Clarify là nút cổ chai — và nguyên nhân đã xác định được

**Bằng chứng:** **51/56 item `todo` đang kẹt ở `stage: clarify`** (91%). Chỉ 1 ở `decompose`,
1 ở `executing`.

Đào sâu nguyên nhân, kết quả dứt khoát:

- **46/51 item không bị dep nào chặn** — tự do chạy ngay.
- **0/51 item từng có discovery entry** — chưa cái nào được `discover` lần nào.

Vậy nút cổ chai **không phải do thiết kế gate cần người**, mà do **chưa ai chạy
`/fgOS:discover-loop`**. Hệ tự tạo việc (submit) nhanh hơn nhiều so với tốc độ có người bấm nút
làm rõ.

Củng cố thêm: đo 314 lần park vào `awaiting-human` theo stage — **clarify 265 (84%)**, decompose 40,
executing 9. Gánh nặng người dồn gần như toàn bộ vào khâu đầu tiên.

### 4.3 ⚠️ 40% item vẫn kéo người vào hỏi-đáp — và phần lớn là hỏi nhầm

**Bằng chứng:** **142/359 item** có settlement `answer/human`.

Con số 88% `clear:true` ở §3.9 chỉ nói "hiểu được đề bài", **không** nói "không cần người ở khúc
sau". Đo trên toàn vòng đời, cứ 5 item thì 2 item lôi người vào trả lời.

So với bản đồ mong muốn (§1.4) — nơi ô (6) Exploring chỉ bật *khi thật sự mơ hồ* — 40% là cao.

**Nhưng con số này còn dễ chịu hơn thực tế.** Đo theo *lượt hỏi* thay vì *số item*: 314 lượt, và
**64% trong đó không phải quyết định sản phẩm** mà là tranh chấp verify máy-vs-máy — xem §4.3b.

### 4.4 ⛔ Đuôi hậu-merge 65h — **không phải thiết kế, là chưa ai quét**

**Bằng chứng:** `delivered → done` median **64,9h**, p90 **121,7h**. **128 item đang tồn ở
`cleanup`** (28% toàn bộ item).

Giả thuyết ban đầu là "TTL soak 7 ngày cho root, đúng thiết kế". **Sai.** Đào vào từng item:

| Nhóm | Số lượng | TTL | Trạng thái |
|---|---|---|---|
| **Leaf** | **112** | 0 ngày | **Sẵn sàng đóng NGAY** |
| Root | 16 | 7 ngày | Còn đang chờ TTL, đúng thiết kế |
| Root hết TTL chưa quét | 0 | — | — |

**112/128 (88%) item chỉ chờ một lần chạy `/fgOS:cleanup-loop`.** Không có item nào bị chặn bởi
thiết kế cả.

Hệ quả UX rất thật: người nhìn bảng thấy 128 việc "chưa xong" trong khi 112 cái đó code đã merge
xong từ lâu và chỉ chờ bút ký cơ học. **Trạng thái hệ thống không khớp với cảm nhận "đã xong" của
người** — đúng loại noise mà `0025` bảo phải tránh.

### 4.3b 🛑 Chất lượng câu hỏi — hệ hỏi sai thứ, sai người, và hỏi lại mãi

Đây là mặt thứ hai của cùng một vấn đề với §4.1. Không có kênh gọi người quay lại là vấn đề **bề
rộng**. Đây là vấn đề **chất lượng**: khi hệ có hỏi, câu hỏi thường không trả lời được.

**Đo trên 314 lượt hỏi người thật (`state.gates`, kể cả hỏi lại):**

| Chỉ số | Giá trị |
|---|---|
| Lượt hỏi là **tranh chấp verify máy-vs-máy** | **202 / 314 = 64%** |
| Item dính ít nhất một tranh chấp verify | 70 / 152 |
| Câu hỏi có phương án rõ ràng (a)/(b) | **32 / 152 = 21%** |
| Câu hỏi nhắc lại từ khoá title của chính item | **68 / 152 = 45%** |
| Câu hỏi hỏi về một lệnh shell | 57 / 152 = 38% |
| Item bị hỏi **≥3 lần** | 34 |
| Số lần hỏi nhiều nhất trên một item | **23** (`tsk-48i`) |

**Vấn đề 1 — hỏi sai người.** 64% lượt hỏi mang cùng một khuôn:

> *"Đề xuất verify bị nghi ngờ (chưa ghi vào clarify->decompose, cần xác nhận) — vòng 1 đề xuất:
> `grep -q '\.parkReason' test/cli/fgos.test.mjs && node --test ...` — vòng 2 (kiểm tra độc lập)
> không đồng ý: Pin quá lỏng và trùng tên với thứ đã hoạt động sẵn..."*

Đây **không phải quyết định sản phẩm**. Hai judge tự động bất đồng về việc một pattern `grep` có
chặt đủ không, rồi đẩy người lên làm trọng tài. Người không có lợi thế thông tin nào ở đây — đây
là thứ máy kiểm được (chạy thử grep, xem nó khớp cái gì), không phải thứ cần phán đoán con người.

**Vấn đề 2 — người bị dùng làm vòng retry.** `tsk-48i` bị hỏi **23 lần**, mỗi lần là một biến thể
`grep` hơi khác. Người không được hỏi *một quyết định*; người bị hỏi lại cho tới khi máy tự tìm ra
lệnh đúng. `tsk-4xg` và `tsk-66o` mỗi cái 10 lần.

**Vấn đề 3 — câu hỏi không tự mang bối cảnh.** Chỉ **45%** câu hỏi nhắc lại được item đang nói về
việc gì; hơn nửa buộc người phải chạy `fgos show <id>` mới hiểu đang bàn cái gì. 13% tham chiếu
≥2 task id khác, bắt người tra chéo. Có câu (`tsk-42i`) hỏi về nội dung một file **không tồn tại
trong checkout hiện tại** — người về mặt vật lý không mở được thứ đang được hỏi.

**Vấn đề 4 — chỉ 21% có phương án.** Câu hỏi tốt tồn tại và chứng minh làm được. Ví dụ `tsk-1an`,
222 ký tự, hai phương án đặt tên rõ, mỗi cái nói kèm nó giống cái gì đã có:

> *"Should fgOS worktrees use the lock-in-tree strategy (symlink `.fgos/` to shared store, matching
> `session.mjs`) or the isolated-tree strategy (bootstrap-copy `.fgos/` per worktree with
> union-merge at merge-back, matching beegog)?"*

Trả lời được trong 10 giây, không cần mở file nào. Nhưng đó là thiểu số 21%.

**Hệ quả về thứ tự ưu tiên — điểm quan trọng nhất của mục này:**

Nếu xây kênh chú-ý (§5.1) mà **không** sửa chất lượng câu hỏi trước, thì thứ được đẩy lên điện
thoại người ta chính là **23 thông báo về pattern `grep` trên một item**. Kênh chú-ý sẽ làm mọi
thứ **tệ hơn**, không phải tốt hơn — nó khuếch đại đúng thứ đang cần giảm.

Hai việc này phải đi cùng nhau, và nếu buộc chọn một cái làm trước thì **làm cái này trước**.

**Liên hệ ngược lên `verify-miss` (§4.5):** 64% tranh chấp verify ở đây và 87 `verify-miss` ở kia
là **cùng một gốc** — chất lượng `verify` sinh ra lúc submit/clarify quá kém, nên downstream vừa
hỏng lúc chạy (verify-miss) vừa gây cãi lúc thẩm định (tranh chấp). Sửa gốc đó đánh trúng cả hai.

### 4.4b 🛑 Rủi ro mất dữ liệu chưa vá — hạng CRITICAL

**Bằng chứng:** backlog item `p-73d99989`, còn `proposed`:

> `reclaimOrphanedCheckout` force-remove BẤT KỲ worktree checkout nào mà **không kiểm tra đó có
> phải một phiên đang sống hay không** — đã có sự cố dogfood xác nhận: một root worktree đang sống
> bị xoá im lặng giữa phiên.

Journal của chính tác giả (`journals/260728-2211-worktree-reclaim-data-loss-tsk-1os.md:14-18`) gọi
đây là *"an unacceptable gap... one stray worktree away from losing a developer's uncommitted
work"* và *"A crash-recovery helper that destroys user work silently is worse than no recovery at
all — it creates a false sense of safety."*

Đây là **item mở nghiêm trọng nhất trong toàn bộ backlog**, và nó nằm đúng trên đường mà mọi item
đều đi qua. Đáng ưu tiên trên tất cả những thứ khác trong báo cáo này.

### 4.4c ⚠️ Đường thành công cũng có nhánh thất bại câm

**Bằng chứng:** `tsk-480-approve-movework-friction-guard/CONTEXT.md:9-14` — ba lời gọi
`moveWork(...to:'delivered')` trên đường thành công của `approve` **không được bọc**. Nếu write đó
throw (ví dụ lock-timeout lúc tranh chấp), tác dụng bên dưới — một merge thật, hoặc một verify đã
xác nhận xanh — **đã vĩnh viễn**, nhưng status không tiến, và **không friction record nào được
ghi**. Nguyên văn: *"The item looks stuck with zero diagnostic trail."*

Điều này nghịch với chính luật của hệ (kiến trúc khẳng định "đường thất bại cũng đi qua đúng một
cửa"). Có một nhánh lọt lưới.

### 4.4d ⚠️ Con số `merge-conflict` 42 bị thổi phồng

**Bằng chứng:** `tsk-18a-merge-conflict-misclassification/CONTEXT.md:1-33` — sự cố thật:
`fgos merge next` báo `conflict`, nhưng chạy lại **đúng lệnh `git merge` đó bằng tay thì sạch
hoàn toàn**. Nguyên nhân: một catch-block gán nhãn `conflict` cho **mọi** thất bại của
`git merge --no-commit --no-ff`, vứt stderr thật đi. Xung đột thật lẫn với race giữa hai phiên.

Nên trong 42 `merge-conflict`, một phần là **race bị gán nhãn sai**, không phải xung đột nội dung.

### 4.5 ⚠️ `verify-miss` là friction đắt nhất

**Bằng chứng:** 141 friction event: **`verify-miss` 87 (62%)**, `merge-conflict` 42 (30%),
`merge-failed-unclassified` 7, `fgos-write-blocked` 4, `worker-timeout` 1.
Theo tầng: `verification` 87, `state` 53, `environment` 1.

`verify` là hợp đồng "thế nào là xong" của từng item — nó hỏng nhiều nhất. Mỗi lần miss là một vòng
làm lại, đánh thẳng vào "không đoán mò" của tiêu chí 1.

### 4.6 ⚠️ Xung đột merge vẫn xảy ra dù đã có advisory

**Bằng chứng:** 42 `merge-conflict`, dù `fgos conflicts` và `fgos schedule` đã dựng để cảnh báo
trước cặp item đụng footprint.

Advisory **chỉ gợi ý, không bao giờ tự re-slice** (thiết kế cố ý). Nhưng số 42 cho thấy khoảng
cách giữa "có cảnh báo" và "không đụng nhau".

### 4.7 ⚠️ Trường `risk` không có enum — dữ liệu lẫn hai bộ từ vựng

**Bằng chứng:** `src/state/work.mjs:334` chỉ validate `requireNonEmptyString`. Không có
`export const RISKS`. Kết quả trên 445 item thật:

`standard` 205 · `light` 125 · `heavy` 63 · `medium` 24 · `low` 14 · `high` 14

Hai bộ từ vựng (`light/standard/heavy` mượn của `TIERS`, và `low/medium/high` mượn của
`URGENCY_LEVELS`) **trộn trên cùng một field**. Bất kỳ ai đọc bảng đều phải tự đoán `light` với
`low` có khác nhau không. Đây đúng là "đoán mò" mà tiêu chí 1 cấm.

### 4.8 ⚠️ Cặp `status × stage` không tường minh — chính người dùng đã nêu

**Bằng chứng:** item `tsk-u8w` đang `doing`: *"Cặp status x stage hiển thị không tường minh, không
phản ánh quan hệ với nhau — người đọc..."*

Thêm nữa, **48/445 item không có `stage`**, và một item đang `doing` có `stage: undefined`
(`tsk-4lc`). Hai chiều song song mà không có bảng giải thích quan hệ là gánh nặng nhận thức thật.

### 4.9 ⚠️ Đối thoại Socratic đồng bộ — đang `blocked`

**Bằng chứng:** `tsk-42i` status `blocked`, stage `decompose`: *"Đối thoại Socratic đồng bộ giữa
session và người lúc clarify/decompose."*

Đây chính là ô (6) trong bản đồ mong muốn. Nó đang chặn.

### 4.10 ⚠️ Đa domain — mới có khung, chỉ `coding` sống

**Bằng chứng:** `workflow-stage-graphs.mjs` có registry domain, `getDomain` fold an toàn — nhưng
chỉ `coding` có stage graph thật. `tsk-3w3` (*"Multi-domain work-item schema readiness"*) đang
`doing`.

Tầm nhìn nói *"Một base — nhiều domain-extension"* với marketing/HR/finance. Hiện là **một base,
một extension**.

### 4.10b ⚠️ Song song hẹp hơn nhiều so với tưởng — chỉ `/fgOS:cook` được nối

**Bằng chứng:** `fgos-coding-driving/SKILL.md:323-341` — bảng caller của chính nó ghi rõ **4 trên 5
caller KHÔNG được nối hợp đồng fan-out**: `/fgOS:pick`, sweep clarify, sweep planning, sweep
execution. Chỉ `/fgOS:cook` có.

Nghĩa là: một item claim thẳng bằng `/fgOS:pick` mà neo vào con đang mở thì **chỉ báo neo rồi
dừng** — người phải `/fgOS:pick` từng con bằng tay. Năng lực "5 Agent mỗi wave" ở §3.7 chỉ đúng
trên đúng một đường vào.

Skill tự gọi đây là "Open Question" chứ không giấu — nhưng nó trực tiếp làm nhẹ đi mức độ song
song thật của hệ.

### 4.10c ⚠️ Lớp quyết định native-vs-spawn còn thiếu — đang đốt việc

**Bằng chứng:** `docs/decisions/0026:117-139`. Quyết định khoá 4 luật chọn cách dispatch, nhưng
**chưa có lớp nào áp dụng chúng tự động**. Bằng chứng sống: `judgeDiscovery`/`judgeDecompose`
**luôn spawn một `claude -p` mới toanh** kể cả khi caller đã là một phiên sống cùng provider, có
ngữ cảnh tốt hơn — lẽ ra trúng luật 2 (native) nhưng im lặng rơi vào luật 3/4, vì không có cơ chế
phát hiện "mình đang được gọi từ một phiên sống cùng provider".

Hệ quả trực tiếp lên tiêu chí 1: một judge mù **suy diễn lại từ đầu** phán đoán mà phiên sống đã
có sẵn. Đó là chờ đợi và trôi lệch, đúng hai thứ "Ship Faster" cấm.

### 4.10d ⚠️ Đồ thị công việc rất phẳng — không có đòn bẩy nào lớn

**Bằng chứng:** `fgos graph` — 445 node, **236 connected component**, 188 là item cô lập một mình,
component lớn nhất 29. `fgos triage` xếp hạng 72 item mở nhưng **`blocks` cao nhất chỉ bằng 1**.
`fgos ready` chỉ có **6 item** pick được ngay.

Không có item nào là nút mở khoá lớn. Backlog đang phân mảnh — mỗi item gần như độc lập. Điều này
vừa tốt (song song được) vừa xấu (không có thứ tự ưu tiên tự nhiên nào nổi lên; `triage` mất phần
lớn giá trị khi mọi thứ đều `blocks: 1`).

### 4.11 ⚠️ 7 item đang kẹt `awaiting-human`, và 6 item kẹt `doing` tới 11,5 ngày

Trong đó có cả item test cũ (`tsk-5ui` "edge test doc", `tsk-3wd` "task 1") lẫn item thật
(`tsk-4op`, `tsk-3at`, `tsk-sq9`, `tsk-19z`). **Không có cơ chế nhắc lại** — item đậu ở đó im lặng
cho tới khi người tự nhớ ra.

Nặng hơn, `fgos stale` báo **6 item kẹt trong `doing`** quá ngưỡng claim-người 24h:

| Item | Kẹt |
|---|---|
| `tsk-64s` | ~276h (**11,5 ngày**) |
| `tsk-352` | ~260h (10,8 ngày) |
| `tsk-3w3` | ~74h |
| `tsk-5lr` | ~43h |
| `tsk-u8w` | ~24h |
| `tsk-3v2` | ~24,5h |

Điểm sáng: stale hậu-giao (quên trong delivered/retrospective/cleanup) = **0**. Khúc đuôi sạch.

### 4.11b ⚠️ Hai lớp theo dõi, và lớp chiến lược có 0 item done

**Bằng chứng:** `docs/backlog.md` là **hệ theo dõi riêng** (31 dòng PBI do bee render từ
`.bee/backlog.jsonl`), khác hẳn `.fgos/state.json` (445 work item). Đếm được: **30 proposed,
1 in-flight, 0 done** — và đã xác minh rằng bảng **không lọc bỏ** dòng `done`, nên số 0 là tín
hiệu thật.

Nghĩa là: **223 item done ở lớp thi hành, 0 PBI done ở lớp chiến lược.** Hai lớp chưa ai đối
chiếu. Kết hợp với `STR73` (done lật theo FSM chứ không theo mệnh đề CoS), câu hỏi là: lớp PBI chỉ
đang trễ nhịp cập nhật, hay việc lật done ở hai lớp đã tách rời nhau về mặt cấu trúc?

Lưu ý phụ: badge trong `README.md` ghi "backlog done 86", không khớp với 0 đếm được từ bảng —
badge do bee sinh, có vẻ đã cũ.

### 4.12 ℹ️ L8 rule 3 tự treo — chưa có anchor-suite

`docs/decisions/0025` tự ghi: *"L8's rule 3 (mỗi doctrine rule cần cụm từ assert tự động) CHƯA làm
ở record này — chưa có check tự động xác nhận `AGENTS.md` còn giữ đúng 3 mục theo thời gian."*

Tức là chính tiêu chí tối cao của sản phẩm **không có test bảo vệ khỏi trôi**.

---

## 5 · Chẩn đoán cốt lõi — chuỗi nhân quả

Quan sát ban đầu là "ba nút tắc, chưa ai bấm nút". Sau khi quét lớp hợp đồng I/O và backlog chiến
lược, **nguyên nhân gốc nằm cao hơn một bậc và nó là một quyết định cố ý**.

### 5.1 Chuỗi nhân quả thật

```
Chưa có kênh chú-ý (STR48 chưa khởi động, CỐ Ý)
  → chế độ async không có cách nào gọi người quay lại
    → mọi người chạy sync (301/305)
      → người dù sao cũng đang ngồi đó
        → nên họ tự lái tay thay vì chạy loop
          → loop không chạy
            → clarify dồn 51, cleanup dồn 128
```

**Mắt xích gốc** — `docs/io-contract.md:160-180` và `docs/specs/system-overview.md:55`: fgOS hôm
nay là **mô hình pull đồng bộ thuần tuý**. Gọi một verb, nhận về một envelope JSON. **Không có
kênh push nào.** Và đây không phải thiếu sót — là chờ có chủ đích:

> "poll bắt đầu khó chịu là tín hiệu kênh chú-ý đến lượt"

Kênh chú-ý thật (STR48: at-least-once, dedup, routing, ack, escalation) nằm ngoài core, thuộc về
một daemon **chưa được xây**. Theo `docs/decisions/0014`, mọi UI không-phải-terminal đều là client
của daemon đó — nên **không có daemon thì không có UI nào ngoài terminal**, và không có gì gọi
người quay lại.

Thứ duy nhất tồn tại hôm nay: **một pane trong herdr cockpit** poll `fgos list --json` mỗi 5 giây
và bắn đúng một desktop notification khi có item vào `awaiting-human`. Đó là chrome tuỳ chọn, không
phải hợp đồng của sản phẩm.

### 5.1b Mắt xích thứ hai — chất lượng câu hỏi

Kênh chú-ý là vấn đề **bề rộng** (không có cách gọi người). Nhưng có một mắt xích thứ hai song
song, về **chất lượng** (khi có hỏi thì hỏi không trả lời được) — chi tiết ở §4.3b:

```
Verify sinh ra kém lúc submit/clarify
  → hai judge bất đồng về lệnh verify
    → escalate cho người làm trọng tài (202/314 lượt hỏi = 64%)
      → người không có lợi thế thông tin nào để phán một pattern grep
        → trả lời qua loa, hoặc bỏ đó
          → hỏi lại (34 item ≥3 lần, cao nhất 23 lần)
```

**Hai mắt xích này nhân nhau, không cộng.** Xây kênh chú-ý mà không sửa chất lượng câu hỏi thì
thứ được đẩy lên điện thoại người ta là 23 thông báo về `grep` trên một item — kênh chú-ý khuếch
đại đúng thứ cần giảm.

Nên thứ tự đúng là: **sửa chất lượng câu hỏi trước hoặc đồng thời**, không bao giờ sau.

### 5.2 Ba nút tắc — triệu chứng, không phải bệnh

| Nút tắc | Số lượng | Nguyên nhân đã xác minh | Cách gỡ tức thời |
|---|---|---|---|
| Clarify | 51 item `todo` | 46 tự do chạy, **0 từng qua discovery** | chạy `/fgOS:discover-loop` |
| Cleanup | 128 item | **112 là leaf TTL 0 ngày, sẵn sàng đóng** | chạy `/fgOS:cleanup-loop` |
| Async | 4/305 item | **không có kênh gọi người quay lại** | xây kênh chú-ý (STR48) |

Hai cái đầu gỡ được bằng một lệnh. Cái thứ ba **không** — nó cần một hệ con chưa xây.

### 5.3 Nghịch lý

> **Hệ được xây để người khỏi ngồi canh, nhưng chưa có cách nào báo cho người biết khi nào được
> rời đi. Nên người ở lại canh. Và vì đã ngồi đó, họ lái tay thay vì để hệ tự chạy.**

Đây đúng là loại tình huống mà tiêu chí 1 (`0025`) nói tới: một lựa chọn rẻ cho fgOS tự triển khai
(hoãn kênh chú-ý, chờ poll đủ đau) đang làm **người vận hành fgOS chậm hơn**. Theo đúng chữ của
quyết định, khi hai vế xung đột thì **chọn cái giúp project dùng fgOS nhanh hơn**.

### 5.4 Tin tốt — và một cảnh báo về nó

**Tiêu chí 2 (DoD) đang được giữ tốt**: test xanh 2.633/2.638, 371/445 item có verify thật, 151
doc có trích dẫn bằng chứng.

**Nhưng đọc con số "223 done" cho đúng.** Backlog item `STR73` (đang in-flight) ghi nhận: `done`
lật theo **FSM chạm trạng thái cuối**, không theo **kiểm từng mệnh đề CoS đã giao đủ chưa**. Nên
223 nghĩa là "FSM đã tới terminal", không phải "mọi điều kiện nghiệm thu đã được kiểm độc lập".

---

## 6 · Việc tạo đòn bẩy, xếp theo (giảm chờ đợi) / (công bỏ ra)

### Nhóm 0 — vá trước khi tăng tốc

0. **Vá `reclaimOrphanedCheckout` (`p-73d99989`)** — kiểm phiên sống + công việc chưa commit trước
   khi force-remove worktree. Đây là rủi ro mất dữ liệu đã có sự cố xác nhận, nằm trên đường mọi
   item đều đi qua. Tăng tốc một hệ có thể xoá mất việc của người là tăng tần suất gặp nó.

### Nhóm A — cơ học, làm được ngay, không cần thiết kế lại gì

1. **Chạy `/fgOS:cleanup-loop`** → đóng ngay 112 item. Bảng công việc giảm 25%, đuôi 65h biến mất
   cho phần lớn item. Công: một lệnh.
2. **Chạy `/fgOS:discover-loop`** → khơi 46 item đang tự do. Frontier mở lại. Công: một lệnh.

Hai việc này gỡ **2/3 nút tắc lớn nhất** mà không viết một dòng code.

### Nhóm B — xây cái còn thiếu, đây mới là thứ thay đổi bản chất trải nghiệm

3. **Chặn escalate tranh chấp verify lên người + bắt câu hỏi mang bối cảnh** — làm **trước** việc
   4, không sau. Ba luật cụ thể, tất cả đều cơ học:
   - Hai judge bất đồng về một lệnh verify là **việc của máy**: chạy thử lệnh, xem nó khớp cái gì,
     rồi phán. Chỉ escalate lên người khi bất đồng về *mục tiêu*, không bao giờ về *pattern*.
   - **Trần số lần hỏi lại**: cùng một item hỏi lần thứ 3 thì đó là bug của bên hỏi, không phải
     người trả lời chậm. Chuyển sang `blocked` kèm chẩn đoán, đừng hỏi lần 23.
   - **Mỗi câu hỏi phải tự đứng được**: nhắc lại item đang bàn (hiện chỉ 45%), nêu phương án rõ
     ràng (hiện chỉ 21%), không tham chiếu file không tồn tại trong checkout. Mẫu tốt đã có sẵn
     trong chính dữ liệu — `tsk-1an` (§4.3b).
4. **Xây kênh chú-ý (STR48)** — **mắt xích gốc** của chuỗi ở §5.1. Không có nó thì async không
   dùng được. Không cần làm đủ daemon ngay: notification chủ động khi item vào `awaiting-human`,
   nâng pane cockpit thành hợp đồng thật thay vì chrome tuỳ chọn, là đã đủ cắt mắt xích.
   Tiêu chí `0025` đứng về phía làm việc này: hoãn nó rẻ cho fgOS nhưng **làm người dùng fgOS chậm
   hơn**, và khi hai vế xung đột thì chọn vế người dùng.
   ⚠️ **Nhưng phải sau việc 3.** Đẩy câu hỏi hiện tại lên điện thoại người ta = 23 thông báo về
   `grep` trên một item. Kênh chú-ý khuếch đại chất lượng câu hỏi, tốt lẫn xấu.
4. **Tự động hoá chính các loop ở nhóm A** — nếu nhóm A phải làm tay mỗi lần thì tắc nghẽn quay
   lại ngay tuần sau. `--watch` của runner đã có; cần nối nó tới discover/cleanup pool.
4b. **Nối fan-out vào `/fgOS:pick` và ba sweep loop** — hiện chỉ `/fgOS:cook` có. Rẻ, và mở song
   song thật cho bốn đường vào còn lại.
4c. **Dựng lớp quyết định native-vs-spawn (`0026` Phase 1-4, đã có item)** — chặn việc judge mù
   suy diễn lại phán đoán mà phiên sống đã có. Kế hoạch 5 phase đã nộp thành item thật có dep rõ.

### Nhóm C — chất lượng, đánh vào "không đoán mò"

5. **Đóng `verify-miss`** — 62% toàn bộ friction, đòn bẩy đơn lẻ lớn nhất. Chất lượng `verify`
   sinh lúc submit/clarify quyết định con số này.
6. **Khoá enum `risk` + làm rõ `status × stage`** — rẻ, cơ học, gỡ trực tiếp gánh nặng đọc.
   `tsk-u8w` đã mở sẵn.

### Nhóm D — chứng minh còn thiếu

7. **Đóng mốc MVP2 (`p-2a39f940`)** — trước hết cho `fgos-runner.mjs` một cờ override repoRoot để
   chạy được trên testbed mà không đụng state production, rồi vá đường `fgos return` kiểm sai
   branch HEAD. Không có hai cái đó thì ca headless **không thể chạy an toàn lần nào**.
8. **Chạy end-to-end một item qua `--github`** — bước 9-11 của tầm nhìn có code, có test đơn vị,
   nhưng 0 dấu vết chạy thật. Chưa chứng minh thì chưa tính là có.

---

## Câu hỏi chưa giải đáp

Sáu trong bảy câu hỏi mở ban đầu đã trả lời được (xem §4.1, §4.2, §4.3b, §4.4, §3.11, §5.1). Câu
"tại sao 40% item cần người trả lời" nay đã có đáp án: **64% lượt hỏi không phải quyết định sản
phẩm** — là tranh chấp verify máy-vs-máy (§4.3b). Còn lại:

1. **Lớp PBI (0 done) trễ nhịp, hay đã tách rời cấu trúc khỏi lớp thi hành (223 done)?** `STR73`
   đang in-flight chạm đúng vấn đề này. Câu trả lời quyết định con số "223 done" đọc được bao nhiêu
   phần trăm theo nghĩa đen.
3. **Ngưỡng nào thì fgOS tự tuyên bố F5?** L6 nói F5 = "cải tiến có outcome đo được". Hệ đã có
   `fgos evolve` xếp hạng candidate từ friction — nhưng chưa thấy vòng nào đóng từ friction →
   evolve → cải tiến → outcome tốt hơn đo được. Đây là bậc cuối của thang, và là thứ duy nhất còn
   giữa F4 (đã claim) với đích.
