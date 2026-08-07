# Execution fan-out (fan-out B) — DISCUSSION

`tsk-umc` · tier `heavy` · risk `heavy` · kind `feature` ·
`docsRef` = `docs/history/execution-fanout/`

## 1. Trạng thái hiện tại

**Vòng 2 (2026-08-07) — ba câu của vòng 1 vẫn treo, và một trục mới mở
ra.** Người dùng nêu: có ca children là *vấn đề hoàn toàn độc lập* ⇒ đáng
thành work item thật; có ca cha chỉ chẻ ra *mảnh việc* giao con ⇒ không
đáng đi qua tiến trình hành chính. Scout cho thấy ý này **đã có tên và đã
bị gác**: nó chính là ô **B2 "exec packet"** mà `D4` của
`docs/history/two-layer-dispatch` gác, kèm `D9` đặt điều kiện mở lại đo
được — mà **một nửa điều kiện đã thoả**.

Đồng thời phép thử do chính D4 đặt ra (*"nếu con work-item thật đã mang
được `action` prose thì B2 có thể thừa"*) giờ trả lời được bằng code: con
của decompose **sinh ra đã ở stage `executing`** và **đã mang `action`
prose**. Nên phần "hành chính cồng kềnh" mà tiền đề nói tới **không tồn
tại ở đầu vào**; thứ còn lại không phải giấy tờ mà là bốn cơ chế cách ly.
Chi tiết §5 vòng 2.

Trục mới cần người quyết: có **ba ca chứ không phải hai** (§3 hàng 16), và
ca ở giữa — mảnh ghi thẳng vào worktree cha, cha commit/merge một lần —
**có thể đã hợp lệ sẵn** dưới D3 chứ không bị D4 gác (§3 hàng 17).

Vẫn chưa có D-ID nào.

**Vòng 1 (2026-08-07) — vừa mở, chưa chốt gì.** Đây là file thảo luận
riêng của **fan-out B (execution fan-out)**, tách khỏi
`docs/history/fanout-and-delegation-rubric/DISCUSSION.md` — file đó mang
`tsk-5kn` và giải **fan-out A (gather)**. Ranh giới hai bài toán đã được
chốt ở vòng 7 của file kia (§3 hàng 36/37/38), không mở lại ở đây.

Vòng 1 làm hai việc: (a) scout code thật để đặt câu hỏi có bằng chứng, và
(b) nêu **một phát hiện đi ngược mô tả item** — câu "dùng lại
`computeSchedule`/`selectWave` thay vì viết logic mới" không đứng vững như
đã viết: hai hàm đó chọn theo **hai trục khác nhau**, và `selectWave` là
trục *sai* cho bài toán này. Chi tiết ở §5 vòng 1.

Câu hỏi đang chờ người trả lời: **ai claim** (§3 hàng 38, chuyển sang đây
thành hàng 3) — và câu hỏi phụ mới phát sinh từ scout: **chọn wave bằng
gì**, khi `selectWave` bị loại.

Chưa có D-ID nào. §6/§7 còn trống — đúng theo luật: không mint D-ID từ một
câu trả lời đơn lẻ, và không dựng §6 khi hình dạng chưa thật.

## 2. Mục tiêu & đề bài

Sau khi một item được `decompose` ra N children, fgOS hôm nay **luôn chạy N
children đó tuần tự** — `/fgOS:cook` đẩy chúng lên đầu một hàng đợi rồi
rút từng cái một, `fgos-coding-driving` gặp children mở thì dừng hẳn và
trả danh sách id về cho caller chứ không tự chạy tiếp. Trong khi đó không
luật nào cấm chạy song song: children của decompose là work item thật, tức
rootTask thật, nên dispatch N cái đồng thời chính là kích hoạt N rootTask —
đúng định nghĩa orchestrator của `docs/decisions/0026`, và đã có bằng
chứng chạy thật (`tsk-1sj` → `tsk-30z`/`tsk-50ic`, hai Agent chồng lấn
~184s ở trạng thái `doing`) nhưng làm hoàn toàn bằng tay. Việc cần làm là
biến cơ chế đã chứng minh bằng tay đó thành **đường đi mặc định**: một
skill nhận danh sách children không đụng footprint, bắn N Agent dispatch
đồng thời, mỗi con claim và thi công một child, rồi gom kết quả về — cho
**session tương tác**, không phụ thuộc `fgos-runner` (runner là cơ chế phụ,
bật sau, và tới nay chưa từng chạy thật). Câu thiết kế thật chưa ai trả
lời là **ai đặt lock**: orchestrator claim trước rồi mới spawn (cách bee,
*"workers never self-select"*), hay mỗi child session tự claim với id do
cha chỉ định (cách demo đã làm) — hai cách khác nhau ở chỗ đặt lock và ở
chuyện gì xảy ra khi một worker chết giữa chừng.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Fan-out B không bị luật nào chặn — chỉ chưa ai xây. Children của decompose là rootTask thật ⇒ dispatch N cái = kích hoạt N rootTask đúng `0026`. Không vi phạm luật cấm delegation của `tsk-29i` (luật đó chỉ cấm *ad hoc* sub-dispatch và tự chỉ đường qua capacity-dispatch) | **Rõ** — kế thừa từ `fanout-and-delegation-rubric` §3 hàng 37, D2 | `docs/history/fanout-and-delegation-rubric/DISCUSSION.md` §3:37, §4 D2 |
| 2 | Chỗ móc vào đã có sẵn và chỉ có **một**: `fgos-coding-driving` dừng ở "anchored-by-open-children" và **báo danh sách child id về cho caller** — nói thẳng "This is never this skill's own job to resolve: the caller decides whether to drive each open child next". `/fgOS:cook` là caller duy nhất hôm nay, và nó đẩy children lên **đầu một hàng đợi tuần tự** | **Rõ** | `.claude/skills/fgos-coding-driving/SKILL.md:86-102`; `plugins/fgOS/skills/cook/SKILL.md:90-96` |
| 3 | **Ai claim?** (a) orchestrator claim trước rồi spawn (bee: *workers never self-select*), hay (b) mỗi child session tự claim với id cha chỉ định (demo `tsk-1sj`) | **Chưa rõ — câu hỏi chính vòng 1** | `fanout-and-delegation-rubric` §3:38; xem phân tích §5 vòng 1 |
| 4 | Cách (a) **đã có sẵn code chạy được**: `claimAndDispatch` claim trước, rồi mới `dispatchClaimedItem` spawn worker. Nhưng nó nằm trong `fgos-runner` — đường chưa từng chạy thật (0 sự kiện `capacity.dispatch` trong lịch sử repo) | **Rõ** | `src/runner/loop.mjs:938-956`, `:654` |
| 5 | Mọi claim (CLI `take`, CLI `pick`, runner `claimItem`) đã đi qua **một cửa duy nhất** `claim-port.mjs` — nên cả (a) lẫn (b) đều không phải viết đường claim mới, chỉ khác ai gọi và gọi từ tiến trình nào | **Rõ** | `src/runner/claim-port.mjs:1-8` "single choke-point for all claim flows (tsk-53f D1)" |
| 6 | `main-checkout.lock` là lock **ngắn hạn theo từng claim** (`releaseOnExit: true`), không giữ suốt phiên; và đã có `lock-wait.mjs` retry-with-backoff ở tầng CLI ⇒ N claim đồng thời **không deadlock**, chỉ xếp hàng | **Rõ** | `claim-port.mjs:104`; `src/runner/lock-wait.mjs:1-5,78` |
| 7 | **Chi phí thật của cách (b) không nằm ở lock mà ở lúc worker chết**: `startupReap` **cố tình bỏ qua** claim của người/session. Một child do session tự claim mà chết giữa chừng sẽ kẹt `doing` và không có đường tự hồi phục — chỉ `/fgOS:stale` báo cáo | **Rõ** | `claim-port.mjs` comment "(startupReap skips human/session claims by design)" |
| 8 | **Mô tả item nói sai một nửa**: "dùng lại `computeSchedule`/`selectWave`" — hai hàm chọn theo hai trục khác nhau. `computeSchedule` xếp wave theo **footprint** (đúng trục cần); `selectWave` xếp theo **root affinity** với trần `maxRoots` — mà N children của fan-out B **cùng đúng một root** ⇒ `selectWave` sẽ bóp cả wave xuống `maxLeavesPerRoot` của một root duy nhất. Nó là selector *sai* cho bài toán này, không phải thứ để dùng lại | **Rõ — phát hiện vòng 1** | `src/state/graph-metrics.mjs:703-733` vs `src/runner/loop.mjs:156-171` |
| 9 | `computeSchedule` cũng **không dùng thẳng được**: nó chạy trên **toàn bộ frontier**, không scope theo một parent. Fan-out B cần `waves ∩ children(parent)` — hoặc một biến thể nhận sẵn tập ứng viên | **Rõ — phát hiện vòng 1** | `graph-metrics.mjs:704` `const candidates = frontier(view)` |
| 10 | Leaf claim đã tự fork từ `fgw/<rootId>` khi nhánh root tồn tại, và đã có guard thứ tự merge giữa các sibling (dep chưa resolved ⇒ từ chối claim) ⇒ hạ tầng nhánh/worktree cho N sibling song song **đã có**, không phải xây | **Rõ** | `claim-port.mjs:130-160` |
| 11 | Một child Agent có thật sự chạy được `/fgOS:pick` + `EnterWorktree` trong phiên con của nó không (bộ tool của subagent khác bộ của phiên chính)? Demo `tsk-1sj` chạy được bằng tay, nhưng bằng tay là người tự spawn | **Chưa rõ** | demo `tsk-1sj`→`tsk-30z`/`tsk-50ic`; chưa scout bộ tool subagent |
| 12 | Gom kết quả về: mỗi child tự chạy tới `awaiting-approval` rồi dừng (luật dừng của `fgos-coding-driving`). Vậy "gom về" là gom **báo cáo** hay chỉ là đợi rồi đọc lại state? | **Chưa rõ** | `fgos-coding-driving/SKILL.md:75-84` |
| 13 | Ý "mảnh việc không cần work item hoàn chỉnh" **không phải ý mới** — nó là ô **B2 "exec packet"** (helper CÓ ghi file, id ephemeral) mà `D4` gác. Lý do gác: *"hễ cần reserve, attest, commit và merge thì đã là vòng đời, mà vòng đời là thứ định nghĩa rootTask"* ⇒ mở nó phải nới `capacity` cho ghi file **hoặc** supersede `0026`, cả hai đụng luật khoá | **Rõ** | `docs/history/two-layer-dispatch/DISCUSSION.md` §4 D4, §5:544-549 |
| 14 | `D9` đặt điều kiện mở lại D4, **AND hai vế**: (a) `tsk-3xd` đã merge — **ĐÃ THỎA 2026-08-06**; (b) **≥2 ca thật**, ghi bằng capture/friction, cha cần con GHI file mà việc đó không đáng thành work item — **CHƯA**. Thiếu (b) thì D4 giữ nguyên vô thời hạn ("YAGNI có răng, đo bằng ca thật chứ không phải cảm giác") | **Rõ** | `two-layer-dispatch/DISCUSSION.md` §4 D9 |
| 15 | **Phép thử của chính D4 giờ trả lời được, và trả lời NGƯỢC tiền đề**: D4 viết *"xét lại sau khi `tsk-3xd` xong: nếu con work-item thật đã mang được `action` prose thì B2 có thể thừa"*. Code hôm nay: con của decompose sinh ra với `stage: stageForStep(domain, 'Execute')` — **bỏ qua cả clarify lẫn decompose** — và mang `action: child.action` (đúng lỗ `tsk-3xd` vá). Tức **không có tiến trình hành chính nào ở đầu vào** để mà cồng kềnh | **Rõ — phát hiện vòng 2** | `src/intake/decompose.mjs:988-1012` (`stage` :1008, `action` :1001, `parent` :1009) |
| 15b | Thứ còn lại sau khi bỏ front-end **không phải giấy tờ mà là bốn cơ chế**: claim+worktree = cách ly (N agent không ghi chung một cây) · verify = quy trách nhiệm lỗi theo mảnh · merge vào `fgw/<root>` = đường bytes quay về · retrospective/cleanup = TTL cơ học, không có người. Đúng câu D4 đã nói | **Rõ** | `claim-port.mjs:130-160`; `/fgOS:retro-loop`, `/fgOS:cleanup-loop` |
| 16 | **Có BA ca, không phải hai**: (1) mảnh chỉ ĐỌC, trả digest ⇒ không vòng đời — nhưng đó là **fan-out A**, đất của `tsk-5kn`, không thuộc file này · (2) mảnh GHI thẳng vào worktree **cha đã claim sẵn**, cha commit+merge một lần cho cả cụm ⇒ mảnh không claim/reserve/verify/merge gì · (3) mảnh GHI và cần nhánh + rollback riêng ⇒ **là work item, theo định nghĩa** | **Chưa rõ — nêu vòng 2** | §5 vòng 2 |
| 17 | **Ca (2) có thể đã hợp lệ sẵn dưới D3, không bị D4 gác.** Cổng của D4 đặt trên **vòng đời**, không phải trên chuyện ghi byte: hợp đồng gói viết *"never a lifecycle id: no claim, no reserve, no cap, no merge"* — không chỗ nào nói read-only. Và ô `boundary` của D6 đọc nguyên văn *"what must not be touched/written"* ⇒ **tiền giả định worker CÓ thể ghi** | **Chưa rõ — nêu vòng 2, cần người quyết** | `_shared/capacity-dispatch-fallback.md:131,134` |
| 18 | **Giá của ca (2), nói thẳng**: không rollback theo mảnh (undo duy nhất của cha là cả cây) · verify all-or-nothing trên hợp của các mảnh, không quy được lỗi về mảnh nào · mảnh chết giữa chừng để lại file dở **không dấu vết** · tranh git index nếu mảnh nào chạm git. Bốn thứ đó đúng là bốn thứ worktree+branch+verify+merge mua về | **Rõ — nêu vòng 2** | §5 vòng 2 |
| 19 | Phép thử tách ca (2) khỏi ca (3) **không phải "việc to hay nhỏ"** mà là: *mảnh này có cần ranh giới rollback/verify riêng không?* — cơ học, đo được. Còn "có đáng thành work item không" là cảm giác | **Chưa rõ — đề xuất vòng 2** | §5 vòng 2 |
| 20 | Ca (2) thuộc phạm vi `tsk-umc` hay là item riêng? Tiền lệ đã có: hàng 39 của rubric đẩy ô review-class ra ngoài vì *"không liên quan gì tới fan-out"* | **Chưa rõ** | `fanout-and-delegation-rubric` §3:39 |

## 4. Quyết định đã chốt

*(Chưa có. Vòng 1 chưa chốt gì — luật của skill này: không mint D-ID từ
một câu trả lời đơn lẻ, phải giữ nguyên qua hơn một vòng.)*

| D-ID | Quyết định | Vòng chốt |
|---|---|---|
| — | — | — |

## 5. Q&A log

### 2026-08-07 — Vòng 1: scout mở màn, và một phát hiện đi ngược mô tả item

**Scout đã đọc thật:** `src/runner/loop.mjs` (`selectWave` :156,
`claimAndDispatch` :938, `dispatchClaimedItem` :654, `runOnce` wave dispatch
:1124-1131), `src/state/graph-metrics.mjs` (`computeSchedule` :703),
`src/runner/claim-port.mjs` (toàn bộ đường claim), `src/runner/lock-wait.mjs`,
`.claude/skills/fgos-coding-driving/SKILL.md`,
`plugins/fgOS/skills/cook/SKILL.md`,
`.claude/skills/_shared/capacity-dispatch-fallback.md`.

**Phát hiện 1 — chỗ móc vào chỉ có một, và nó đã sẵn sàng.**
`fgos-coding-driving` đã dừng đúng chỗ cần dừng và đã trả về đúng thứ cần
trả: danh sách child id đang mở, kèm câu tuyên bố rõ ràng rằng giải quyết
chúng *không phải việc của nó*. `/fgOS:cook` hôm nay nhận danh sách đó và
đẩy vào một hàng đợi tuần tự. Fan-out B không cần sửa driver, không cần
stage mới, không cần verb mới — nó là **một cách xử lý khác cho đúng cái
danh sách đó**.

**Phát hiện 2 — mô tả item nói sai về `selectWave` (§3 hàng 8).** Mô tả
`tsk-umc` viết *"computeSchedule và selectWave trong
src/state/graph-metrics.mjs đã tính sẵn wave không đụng footprint"*. Đọc
code thì:

- `computeSchedule` (`graph-metrics.mjs:703`) đúng là xếp wave theo
  footprint — gói frontier vào wave sớm nhất không đụng nhau, deferred chứ
  không refuse. Trục đúng.
- `selectWave` **không nằm trong `graph-metrics.mjs`** mà là hàm private
  của `src/runner/loop.mjs:156`, và nó chọn theo trục **hoàn toàn khác**:
  gom theo root rồi lấy tối đa `maxRoots` root, mỗi root tối đa
  `maxLeavesPerRoot` item. Với fan-out B thì **cả N children cùng một
  root** — nên `selectWave` sẽ cắt wave xuống còn `maxLeavesPerRoot` item
  của một root duy nhất. Nó là cơ chế *giới hạn đồng thời theo root*, đúng
  cho runner (chạy nhiều root khác nhau), **sai** cho fan-out B (một root,
  nhiều lá).

Nên câu "dùng lại cả hai thay vì viết logic mới" không đứng: dùng lại được
đúng **một** (`computeSchedule`), và ngay cả nó cũng cần chỉnh — nó chạy
trên toàn frontier, còn fan-out B cần scope vào children của đúng một
parent (§3 hàng 9).

**Phát hiện 3 — cách (a) không phải lý thuyết, code đã có.**
`claimAndDispatch` (`loop.mjs:938`) chính là mô hình bee: claim trước
(`claimItem`), claim bị từ chối thì bỏ qua để poll sau, claim được rồi mới
`dispatchClaimedItem` spawn worker. Tức fgOS **đã** implement
"orchestrator claim trước" — chỉ có điều nó nằm trong `fgos-runner`, đường
chưa từng chạy thật.

**Phát hiện 4 — trục đánh đổi thật của câu "ai claim" không phải lock.**
Trực giác ban đầu là cách (b) sẽ kẹt lock vì N phiên con cùng đòi
`main-checkout.lock`. Đọc code thì lock đó ngắn hạn theo từng claim
(`releaseOnExit: true`) và đã có `lock-wait.mjs` retry-with-backoff — N
claim đồng thời chỉ **xếp hàng**, không deadlock. Chi phí thật nằm ở chỗ
khác: `claim-port.mjs` ghi thẳng trong comment rằng *`startupReap` cố ý bỏ
qua claim của người/session*. Nghĩa là:

| | (a) orchestrator claim trước | (b) child tự claim |
|---|---|---|
| Lock | tuần tự trong một tiến trình, không tranh | N claim xếp hàng qua backoff — chậm hơn chút, không deadlock |
| Worker chết giữa chừng | cha còn biết mình đã claim gì ⇒ có chỗ để reap | item kẹt `doing`, `startupReap` **cố ý** không đụng ⇒ chỉ `/fgOS:stale` báo, người dọn tay |
| Đã có code chưa | có, `claimAndDispatch` (nhưng ở runner) | có, chính là `/fgOS:pick <id>` — và demo đã chạy thật |
| Rủi ro chưa biết | con nhận worktree đã claim sẵn kiểu gì? | subagent có `EnterWorktree` không? (§3 hàng 11) |

**Câu hỏi gửi người dùng (vòng 1):**

1. **Ai claim?** Nghiêng về (a) hay (b) — và nếu (a) thì cha claim xong,
   phiên con nhận worktree đã dựng sẵn bằng đường nào? Nếu (b) thì chấp
   nhận chuyện child chết là kẹt `doing` chờ người dọn, hay muốn có đường
   reap?
2. **`selectWave` bị loại (§3 hàng 8) — có ai phản đối không?** Nếu không,
   vòng sau sẽ bàn hình dạng đúng của bộ chọn wave scope-theo-parent.
3. Ngoài lề nhưng đáng hỏi sớm: **"gom kết quả về" nghĩa là gì** (§3 hàng
   12) — mỗi child tự chạy tới `awaiting-approval` rồi tự dừng theo luật
   của driver, nên cha có thể chỉ cần *đợi rồi đọc lại state*, không cần
   giao thức báo cáo riêng.

### 2026-08-07 — Vòng 2: "mảnh việc không cần work item" — ô đã bị gác, và phép thử vừa có đáp án

**Người dùng nêu:** children chia thành hai loại — vấn đề hoàn toàn độc lập
⇒ tạo work item con hoàn chỉnh có id; còn ca cha chỉ chẻ nhỏ thành *mảnh
việc* giao con thì không cần work item hoàn chỉnh để phải đi qua một tiến
trình hành chính quá cồng kềnh.

**Việc đầu tiên phải làm là nhận diện: đây không phải ý mới.** Nó là ô
**B2 "exec packet"** — helper CÓ ghi file, id ephemeral — và `D4` của
`two-layer-dispatch` đã gác nó, bằng một lập luận vẫn còn nguyên giá trị:

> *"Nó không phải ý tồi; nó là thứ đòi ngồi ở hàng có-vòng-đời trong khi
> tước đi chính vòng đời: hễ cần reserve, attest, commit và merge thì đã
> là vòng đời, mà vòng đời là thứ định nghĩa rootTask."*

Và `D9` không để nó thành zombie — nó đặt điều kiện mở lại **đo được, AND
hai vế**: (a) `tsk-3xd` merge xong — **đã thoả 2026-08-06**; (b) **≥2 ca
thật**, ghi bằng capture/friction, cha cần con ghi file mà việc đó không
đáng thành work item — **chưa**. Nguyên văn lý do: *"YAGNI có răng, đo
bằng ca thật chứ không phải cảm giác."*

Nên trạng thái đúng của ý này là: **không bị bác, đang bị gác, và một nửa
cổng đã mở.** Cuộc thảo luận này chưa phải một trong hai ca — D9 đòi ca
ghi bằng capture/friction, không phải một đề xuất trong phòng thiết kế.

**Phát hiện vòng 2 — phép thử của chính D4 giờ trả lời được, và nó trả
lời ngược tiền đề.** D4 tự đặt hạn: *"xét lại sau khi `tsk-3xd` xong: nếu
con work-item thật đã mang được `action` prose thì B2 có thể thừa."* Đọc
`src/intake/decompose.mjs:988-1012`:

```js
addWork(dir, {
  ...
  action: child.action,                        // :1001 — tsk-3xd tầng 3
  stage: stageForStep(domain, 'Execute'),      // :1008
  parent: id,                                  // :1009
});
```

Con của decompose **sinh ra thẳng ở stage `executing`** — nó không đi qua
clarify, không đi qua decompose, không chạm cổng người nào ở đầu vào — và
nó **đã mang `action` prose** (đúng lỗ `tsk-3xd` vá). Nghĩa là *"tiến
trình hành chính quá cồng kềnh"* mà tiền đề nói tới **không tồn tại ở đầu
vào** cho con của decompose. Phần nặng, phần có cổng người, đã bị bỏ qua
sẵn.

**Vậy phần "hành chính" còn lại thật ra là gì?** Đúng bốn thứ — và không
thứ nào là giấy tờ:

| Cơ chế | Nó mua về cái gì |
|---|---|
| claim + worktree | **cách ly** — N agent không cùng ghi vào một cây làm việc |
| verify | **quy trách nhiệm** — hỏng thì biết mảnh nào hỏng |
| merge vào `fgw/<root>` | **đường bytes quay về** nhánh cha |
| retrospective / cleanup | TTL cơ học, FIFO, **không có người** trong vòng |

Đó chính là câu D4 nói: *"hễ cần reserve, attest, commit và merge thì đã
là vòng đời."*

**Nhưng người dùng đang chỉ vào một thứ có thật, và nó không hoàn toàn
trùng B2.** Tách cho đúng thì có **ba ca, không phải hai**:

| Ca | Mảnh làm gì | Ai giữ vòng đời | Trạng thái luật |
|---|---|---|---|
| **(1)** | chỉ ĐỌC, trả digest | không ai — không cần | **đã mở** (D3 gói tự do). Nhưng đây là **fan-out A**, đất `tsk-5kn` — không thuộc file này |
| **(2)** | GHI vào worktree **cha đã claim sẵn**; cha commit + merge **một lần** cho cả cụm | **cha**, một vòng đời cho N mảnh | **chưa rõ** — có thể đã hợp lệ dưới D3, xem dưới |
| **(3)** | GHI, cần nhánh + rollback riêng | mỗi mảnh | **là work item, theo định nghĩa** — và rẻ hơn tưởng (sinh thẳng ở `executing`) |

**Ca (2) là câu hỏi thật, và có lý do tin nó KHÔNG bị D4 gác.** Cổng của
D4 đặt trên **vòng đời**, không phải trên chuyện ghi byte. Hợp đồng gói
viết nguyên văn: id gói *"never a lifecycle id: no claim, no reserve, no
cap, no merge"* — không một chỗ nào nói gói phải read-only. Ngược lại, ô
`boundary` trong sáu ô bắt buộc của D6 đọc là *"what must not be
touched/written"* — cách nói đó **tiền giả định worker có thể ghi**, nếu
không thì ô ranh giới ghi để làm gì.

Một mảnh ghi vào worktree cha thì: không claim, không reserve, không cap,
không merge — cả bốn đều do cha làm, một lần. Đọc theo **chữ** của hợp
đồng thì nó nằm trong ô D3 đã mở, không phải ô D4 đang gác.

**Giá của ca (2), nói thẳng, không giấu:**

- **Không rollback theo mảnh.** Undo duy nhất của cha là cả cây. Một mảnh
  làm bậy thì bẩn chung.
- **Verify all-or-nothing.** Cha verify hợp của các mảnh; hỏng thì không
  quy được về mảnh nào.
- **Mảnh chết giữa chừng để lại file dở không dấu vết** — không có
  `status: doing` nào để `/fgOS:stale` nhìn thấy.
- **Tranh git index** nếu mảnh nào chạm git.

Bốn thứ đó đúng là bốn thứ worktree + branch + verify + merge mua về. Đây
là đánh đổi thật, không phải chi phí thừa.

**Đề xuất phép thử tách ca (2) khỏi ca (3)** — thay cho câu "việc này có
đáng thành work item không", vốn là cảm giác:

> **Mảnh này có cần ranh giới rollback/verify riêng không?**
> Không ⇒ ca (2). Có ⇒ work item.

Cơ học, trả lời được, không phụ thuộc ai đang cầm bút.

**Câu hỏi gửi người dùng (vòng 2):**

1. Ca (2) — ghi vào worktree cha, cha merge một lần — **có phải đúng thứ
   anh đang nói tới không**, hay anh đang nghĩ tới ca (3) rẻ hơn (mảnh có
   nhánh riêng nhưng bỏ bớt thủ tục)? Hai cái đòi hai chỗ sửa khác nhau.
2. Nếu là ca (2): chấp nhận bốn cái giá ở trên chứ? Cái đắt nhất là *mảnh
   chết để lại file dở không dấu vết*.
3. Đọc-theo-chữ ở §3 hàng 17 (ca 2 nằm trong D3, không phải D4) — anh
   thấy thuyết phục hay thấy đó là lách cửa sau vào ô D4 đang gác? Nếu là
   lách thì phải đi đường D9 (gom đủ 2 ca thật) chứ không tự mở.
4. Ca (2) thuộc `tsk-umc` hay tách item riêng? Tiền lệ: rubric hàng 39 đã
   đẩy ô review-class ra ngoài vì không liên quan fan-out.

*(Ba câu vòng 1 — ai claim · `selectWave` bị loại · "gom kết quả về" nghĩa
là gì — vẫn treo, chưa được trả lời.)*

## 6. Thiết kế đã chốt {#design}

*(Chưa dựng. Hình dạng chưa thật — chờ câu "ai claim" và bộ chọn wave.
Sẽ regenerate toàn bộ ở vòng đầu tiên có D-ID làm đổi hình dạng.)*

## 7. Danh mục hạng mục / task {#tasks}

*(Chưa chia. §6 phải thật trước.)*
