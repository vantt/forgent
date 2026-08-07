# Execution fan-out (fan-out B) — DISCUSSION

`tsk-umc` · tier `heavy` · risk `heavy` · kind `feature` ·
`docsRef` = `docs/history/execution-fanout/`

## 1. Trạng thái hiện tại

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

## 6. Thiết kế đã chốt {#design}

*(Chưa dựng. Hình dạng chưa thật — chờ câu "ai claim" và bộ chọn wave.
Sẽ regenerate toàn bộ ở vòng đầu tiên có D-ID làm đổi hình dạng.)*

## 7. Danh mục hạng mục / task {#tasks}

*(Chưa chia. §6 phải thật trước.)*
