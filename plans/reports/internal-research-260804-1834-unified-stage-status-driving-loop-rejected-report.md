# Internal Research: "1 cơ chế driving thống nhất cả stage+status" — đề xuất, phản biện, kết luận

Ghi lại toàn bộ quá trình đánh giá đề xuất gộp `fgos-coding-driving` (trục
`stage`) với `retro-next`/`cleanup-next` (trục `status`) thành 1 loop duy
nhất. Kết luận: **bác bỏ**, có bằng chứng cụ thể qua 2 vòng advisor review
(Claude Opus, brainstormer persona) trong cùng phiên làm việc. Thay bằng
thiết kế 2 pha phối hợp qua shared-state — đã chốt, đã tạo 2 item vá đúng
lỗ hổng thật tìm được.

## 1. Bối cảnh — vì sao câu hỏi này nảy sinh

Trong lúc thống nhất `/fgOS:discover`/`/fgOS:plan`/`discover-next` đi
qua `fgos-coding-driving` thay vì gọi verb CLI trực tiếp (mù, `tsk-31l`),
phát hiện `fgos-coding-driving` chỉ lái được trục `stage`
(`clarify→decompose→executing`), còn chuỗi hậu-merge
(`delivered→retrospective→cleanup→done`, trục `status`) do 2 cơ chế khác
hoàn toàn xử lý (`retro-next`/`cleanup-next`, pool-batch, không dùng
`fgos-coding-driving`).

Người dùng đặt câu hỏi: có thể có 1 cơ chế driving thống nhất, kết hợp
quyết định của cả 2 trục không? Lý do nêu ra: "công việc bao giờ cũng là
mối ràng buộc giữa status và stage" — trực giác hợp lý, cần kiểm chứng
nghiêm túc thay vì bác bỏ cảm tính.

## 2. Đề xuất ban đầu (thiết kế đưa ra phản biện)

Giữ nguyên khung loop của `fgos-coding-driving` (đọc state tươi → check
stop → resolve handler → invoke → check ceiling → lặp) và ceiling grammar
sẵn có (đã hỗ trợ cả `stage:<name>` lẫn `status:<name>`, D13 trong chính
`fgos-coding-driving/SKILL.md`). Chỉ đổi bước "resolve handler" mỗi vòng:

```
status thuộc {todo, doing, blocked, awaiting-human, awaiting-approval}?
  -> tra skillForStage(domain, stage)  [trục stage đang "cầm quyền"]
status thuộc {delivered, retrospective, cleanup}?
  -> tra skillForStatus(status) MỚI    [trục status đang "cầm quyền"]
```

Đây LÀ 1 quyết định 2-trục thật (không phải mù 1-trục) — điểm này quan
trọng, vì phản biện sau không nhắm vào "logic dở", mà vào chỗ khác.

## 3. Vòng phản biện 1 — 5 hard blocker

Advisor được giao đọc trực tiếp `fgos-coding-driving/SKILL.md`,
`docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`
(D1-D16), `retro-next`/`cleanup-next` SKILL.md, và code thật
(`bin/fgos.mjs`, `cleanup-harness.mjs`, `retro-pool.mjs`), yêu cầu tìm vấn
đề thay vì xác nhận đề xuất.

| # | Vấn đề | Bằng chứng |
|---|---|---|
| 1 | Ranh giới `awaiting-approval` không vượt qua được — dù đề xuất CÓ nhận diện đúng "stage đông cứng ở executing, status là tín hiệu thật", quyết định tiếp theo (bước qua `delivered`) chính là hành động merge code — 1 quyết định hệ thống đã cố ý dành riêng cho người, không phải chỗ nào trong logic 2-trục sửa được. Giữ nguyên chỗ dừng cứng ở đây (từ `tsk-19j-4`, vá đúng lỗ hổng "unlimited ceiling lần chạy thật đầu tiên") thì loop KHÔNG BAO GIỜ chạm được trục status — tức "thống nhất" chỉ là vẽ trên giấy, hành vi thật vẫn 2 pha tách biệt như hiện tại. | `SKILL.md:59-69` |
| 2 | Không handler nào ở trục status tự đẩy được `status` bằng verb riêng của nó — `fgos-coding-compounding` chỉ ghi tag `fgos compound`, còn `retrospective→cleanup` do CALLER gọi `fgos move` (`retro-next/SKILL.md:86`). Loop hợp nhất hoặc tự áp transition (phạm đúng luật gốc "never applies a transition directly" của chính nó), hoặc đọc lại thấy state không đổi → tự bắn no-progress mỗi lần. | `retro-next/SKILL.md:86`, `SKILL.md:42-46,87-96` |
| 3 | `fgos retrospective` quét CẢ REPO (mọi item đang `delivered`), không phải 1 item — loop "lái 1 id" gọi lệnh này đụng chéo item khác, đá văng FIFO của `pickNextRetrospectiveItem`, và **đảo ngược D9** ("processed by a separate loop... never inline in return/approve") không có bằng chứng mới — vi phạm luật "không đảo quyết định đã verify nếu không có bằng chứng mới". | `bin/fgos.mjs:1019-1023`, `retro-pool.mjs:33-47`, CONTEXT.md D9 |
| 4 | `cleanup` TTL không "chờ êm" — TTL chưa tới, `assessCleanupReadiness` KHÔNG no-op mà PARK item vào `cleanup→blocked` kèm lý do — loop coi đây là lỗi thật trên 1 item hoàn toàn khoẻ mạnh. | `cleanup-harness.mjs:97-111` |
| 5 | Worktree/cwd vỡ ngang biên merge — việc code diễn ra trong worktree riêng của item; `approve` TỪ CHỐI chạy nếu đang đứng trong bất kỳ worktree nào; `cleanup` dùng thẳng `process.cwd()` làm `repoRoot`, có thể dọn dẹp đúng worktree loop đang đứng trong đó. 3 việc ở 3 vị trí vật lý khác nhau, không đi xuyên được trong 1 phiên. | `bin/fgos.mjs:2277-2308`, `cleanup-harness.mjs`/`bin/fgos.mjs:1051` |

**Verdict vòng 1:** sai khung — đây là 2 loop khác chủ thể (1 id đã claim /
cả pool), khác vị trí (worktree / main checkout), khác actor, khác nhịp
(liên tục theo phiên / batch), khác cách đẩy trạng thái (skill tự advance /
caller advance). D11 ("2 cơ chế làm cùng 1 việc là nợ kỹ thuật") không áp
dụng — đây là 2 việc THẬT SỰ khác nhau, không phải cùng việc trên 2 trục.
Tài sản duy nhất còn sống: ceiling grammar dual-axis (D13), không cần đổi.

## 4. Phản hồi người dùng — yêu cầu nghĩ lại có định hướng

Người dùng không chấp nhận "bác bỏ rồi thôi" — yêu cầu tái xét có định
hướng: coi 5 vấn đề trên là RÀNG BUỘC CỨNG phải tôn trọng, không phải
chướng ngại để né, và hỏi thẳng: điều phối 2 trục có thật sự đang thiếu gì
không, hay đã đủ dưới hình thức khác?

## 5. Vòng phản biện 2 — điều phối qua shared-state, tìm lỗ hổng thật

Advisor (cùng phiên, tiếp tục qua `SendMessage`) được giao câu hỏi hẹp
hơn: giả thuyết "shared-state (field `status`/`stage`) đã LÀ cơ chế điều
phối, 2 loop đọc bất đồng bộ, không gọi nhau" — đúng/đủ không, thiếu gì?

| # | Phát hiện | Bằng chứng |
|---|---|---|
| 1 | Giả thuyết ĐÚNG, còn đúng SÂU hơn dự đoán: `RESOLVED_STATUSES` (D13) đã liệt `delivered/retrospective/cleanup` vào nhóm resolved — `depsReady`/`hasOpenDescendant` mở dependent NGAY lúc `delivered`, không chờ retro/cleanup xong. Không ai downstream chờ chuỗi status — đó là lý do 0 lệnh gọi chéo giữa 2 loop là ĐÚNG THIẾT KẾ, không phải tạm chấp nhận. | `frontier.mjs:107,186,202` |
| 2 | Ý tưởng "ưu tiên retro theo số dependent đang chờ" (nêu ra như khả năng cải thiện) — SAI VỀ GỐC, không chỉ dư thừa: `rankImpact.blocks` chỉ đếm trên item còn OPEN; item đã `retrospective` thì đã RESOLVED, `blocks` LUÔN = 0 theo định nghĩa. Không có tín hiệu ưu tiên nào để dùng ở đây — FIFO hiện tại (`retro-pool.mjs`) là đúng, giữ nguyên. | `impact.mjs:78-97` |
| 3 | Lỗ hổng thật duy nhất: KHÔNG có phát hiện "bị bỏ quên" cho chuỗi hậu-merge. `classifyStaleDoing` chỉ phủ `doing`; `staleBlocked` chỉ phủ `todo`/`blocked`; `frontier()` không bao giờ thấy 3 status này (D15). Item nằm ở `delivered` cả tháng không ai chạy `/fgOS:retro-loop` — VÔ HÌNH trước mọi bề mặt cảnh báo hiện có. | `graph-metrics.mjs:296-297,479-493` |
| 4 | Fix tối thiểu (~40 dòng, thuần, không đụng loop nào): `classifyStalePostDelivery`, mirror khuôn `classifyStaleDoing`, neo tuổi trên đúng sự kiện entry (không phải "sự kiện gần nhất bất kỳ"), TTL-aware cho `cleanup` (tránh báo nhầm item đang chờ TTL hợp lệ). | đề xuất, chưa code |
| 5 | 2 giả thuyết khác (thiếu thông báo tức thời, thiếu view tổng hợp) — KHÔNG phải gap: `fgos show <id>` đã trả lời "retro xong chưa"; `fgos rollup` cố ý đếm `done` chặt (D13, đã khoá). Notification tức thời lúc `delivered` = D9-reversal đội lốt thông báo — né đúng bẫy vòng 1 đã tìm. | `bin/fgos.mjs:1409-1425` |
| 6 | "Orchestrator" đúng nghĩa ở đây = LỊCH CHẠY ĐỀU, không phải trigger tức thời — `/fgOS:retro-loop`/`cleanup-loop` đã whole-pool + idempotent, chạy theo cadence là đủ, không cần đối tượng orchestrator riêng. | `retro-next/SKILL.md:36-39` |

**Verdict vòng 2:** điều phối 2 trục, xét như CONTROL, đã hoàn chỉnh đúng
từ đầu. Cái thiếu là OBSERVABILITY của bàn giao — 1 classifier là đủ vá,
không cần sửa cơ chế điều phối.

## 6. Kết luận thiết kế cuối

```
PHA 1 — trục stage, 1 item, trong worktree, phiên sống
  clarify → decompose → executing
  fgos-coding-driving lái, dừng cứng ở awaiting-human/blocked/awaiting-approval

──── CỔNG NGƯỜI (duy nhất bắt buộc có người trong toàn chuỗi) ────
  approve/merge (CTR005), awaiting-approval → delivered

PHA 2 — trục status, cả pool, main checkout, theo lô
  delivered → retrospective → cleanup → done
  retro-next/cleanup-next lái (bọc bởi retro-loop/cleanup-loop), pick theo pool
```

2 pha không gọi nhau — phối hợp qua field `status` trên item (đọc/ghi bất
đồng bộ, đúng mô hình hàng đợi việc). Không có khoảng nào trong toàn
lifecycle bị "quên" thiết kế — chỉ là không nằm chung 1 vòng lặp.

## 7. Task và tài liệu phát sinh

| Hạng mục | Trạng thái hiện tại | Ghi chú |
|---|---|---|
| `tsk-1bl` — `classifyStalePostDelivery` (vá gap quan sát) | `todo`/`clarify` | ngưỡng đã khoá: `delivered` 3 ngày (từ sự kiện entry), `cleanup` = `ttlDays+3` ngày (grace sau TTL thật); ngưỡng `retrospective` để ngỏ |
| `tsk-2xt` — herdr plugin tự detect + tự launch pane retro/cleanup (vá gap kích hoạt) | `todo`/`clarify` | chốt hướng herdr, KHÔNG mở rộng `fgos-runner --watch` (lý do: tránh tái tạo pattern "mù" `judgeDiscovery`/`judgeDecompose` cho `fgos-coding-compounding`) |
| `docs/history/stage-status-driving-coordination/CONTEXT.md` | đã ghi | D1-D6, gắn `docsRef` vào cả `tsk-1bl` và `tsk-2xt` |
| `tsk-31l` (nền tảng dẫn tới câu hỏi này — thống nhất dispatch discover/decompose qua routing) | `retrospective`/`executing` | đã delivered, đang tổng hợp tài liệu |

## 8. Bổ sung — đối chiếu với gap-plan report (routing/coding-driving) + `tsk-38t`

Đối chiếu kết luận trên với `plans/reports/internal-research-260804-1230-
routing-coding-driving-domain-gap-plan-report.md` (Finding 1-3, diagram loop)
và mô tả thật của `tsk-38t` — 2 điểm KHÔNG nằm trong 2 vòng phản biện trên,
không mâu thuẫn với kết luận "bác bỏ", chỉ thêm ngữ cảnh còn thiếu.

### 8.1 — `tsk-38t` sắp làm trục `status` cũng thành domain-owned, giống trục `stage` hôm nay

`tsk-38t` (dep của `tsk-3w3`) — **giờ đã `delivered`** (8 con `tsk-38t-1..8`,
cả 8 delivered, verify cha xanh) — mô tả nguyên văn lúc còn `awaiting-human`:

> "Đây là supersede THẬT base-workflow-model D1-D3 (domain giờ sở hữu bảng
> transition status của chính nó, không còn 1 bảng fsm.mjs chung cho mọi
> domain)"

Nghĩa là sau `tsk-38t`, CẢ `stage` VÀ `status` đều domain-owned — đúng cấu
trúc "2 tầng foundation/domain" người dùng đang hình dung, không chỉ là ẩn
dụ.

**Sửa lại kết luận ban đầu ở đây — SAI, đã kiểm bằng mapping thật vừa chốt
(settlement của `tsk-38t`):**

> "domain-specific chỉ áp cho 6 status đoạn đầu (map category: todo→todo,
> doing/blocked/awaiting-human→in-progress, awaiting-approval→review,
> wontfix→canceled); 4 status đuôi (delivered/retrospective/cleanup/done) cố
> định dùng chung mọi domain, không cần category."

`blocked` và `awaiting-human` — 2 status `fgos-coding-driving`'s stop-
condition PHẢI phân biệt (1 là lỗi hệ thống, 1 là câu hỏi người, báo khác
nhau về caller) — **cùng rơi vào category `in-progress`**. Migrate check này
sang `statusCategory` như đề xuất ban đầu sẽ **xoá mất đúng phân biệt loop
cần**, không phải nâng cấp. Vì `coding` giữ nguyên 100% label cũ (`tsk-38t`
D2: "0 rename"), `fgos-coding-driving` **không cần đổi gì**, kể cả sau khi
`tsk-38t` đã triển khai xong. Chỉ thành vấn đề thật nếu sau này có domain 2
vừa (a) được generalize loop chạy qua, vừa (b) tự đặt label khác cho nhóm 6
status đầu — lúc đó category thô không đủ, cần thêm 1 cơ chế khác (chưa
thiết kế) để phân biệt tinh, không phải chỉ đổi tên trục đang gate.

### 8.2 — Tín hiệu thứ 3 ngoài stage/status: artifact existence

`fgos-routing`'s own text (gap-plan report §1) mô tả điểm tách "shaping" (→
`fgos-coding-planning`) vs "proving" (→ `fgos-coding-validating`) trong `decompose` bằng
"shape and children (if any) exist" — KHÔNG phải `stage`, KHÔNG phải
`status`, mà là artifact/lineage tồn tại hay chưa (`plan.md` có chưa,
children đã tạo chưa). Không có field registry nào cho tín hiệu này —
đúng ý gap-plan report §8: "a domain without a stage named `decompose`...
has no equivalent split defined anywhere". Không phải gap của báo cáo này
(2 vòng phản biện trên đúng phạm vi PHA 1 vs PHA 2, không đụng bên trong
1 stage), chỉ ghi lại để lần sau ai tính "gộp dispatch" không phát hiện lại
từ đầu: không gian dispatch thật có ít nhất 3 chiều, không phải 2.

## Unresolved questions

- ~~Ngưỡng stale riêng cho status `retrospective` chưa chốt~~ — **đã chốt
  sau khi báo cáo này viết**: 3 ngày, giống hệt `delivered` (người dùng xác
  nhận trực tiếp). Cập nhật thẳng vào `tsk-1bl`'s description, không cần
  hỏi lại lúc implement.
- ~~Chu kỳ poll của `tsk-2xt`'s herdr-side detection loop, cách herdr đọc
  pane list~~ — **đã trả lời bằng bằng chứng code thật**: `POLL_INTERVAL =
  5s` có sẵn (`herdr-plugin/src/main.rs:15`), `herdr pane list` trả về
  `title`/`terminal_title` (`upstreams/herdr/src/cli/pane.rs:52`,
  `api/schema/panes.rs:355,410-414`) — dùng thẳng, không cần state riêng.
  Cập nhật thẳng vào `tsk-2xt`'s description.
- Transcript đầy đủ của 2 vòng advisor review không được lưu thành artifact
  riêng — mọi trích dẫn file:line trong báo cáo này đã verify trực tiếp
  lúc review, nhưng câu trả lời gốc (dài hơn) không còn truy xuất lại được
  ngoài báo cáo này. (Còn thật, không sửa được — chỉ ghi nhận.)
- Phát sinh thêm ngoài phạm vi ban đầu, đã xử lý: `tsk-5lp` — ghi nhận gap
  "tín hiệu dispatch thứ 3" (mục 8.2) thành 1 known-limitation tracked
  item riêng, trỏ `refs` về
  `internal-research-260804-1230-routing-coding-driving-domain-gap-plan-report.md`.
