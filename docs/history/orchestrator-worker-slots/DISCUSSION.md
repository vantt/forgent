# orchestrator-worker-slots — DISCUSSION

> Tên thư mục cố tình KHÔNG dùng `worker-capacity` như tên gọi ban đầu.
> Lý do ở §3 hàng Q1: `capacity` đã là thuật ngữ đã khoá trong
> `docs/decisions/0026` với nghĩa KHÁC hẳn (đơn vị helper hẹp như
> `judge-discovery`), dùng lại sẽ đụng vocabulary. Tên thư mục đổi được
> rẻ, chưa phải quyết định — sẽ chốt trong §4 khi tên thật ngã ngũ.

## 1. Trạng thái hiện tại

Vòng 1, mới mở. Chưa có D-ID nào được mint (đúng luật: một điểm chỉ thành
D-ID sau khi đứng vững qua hơn một vòng, không mint từ một câu trả lời
đơn lẻ). Ba câu trả lời người dùng đưa ở vòng mở màn — engine là chân lý
về occupancy, gộp 2 mảng thành 1 feature, không vá tạm bug đang sống —
đang nằm ở §5 chờ vòng sau xác nhận.

Scout vòng 1 đã xong và đổi hẳn cách đóng khung đề bài: vấn đề KHÔNG phải
"herdr xếp pane thế nào", mà là **ba launcher đang tự quyết trần song song
độc lập nhau, không launcher nào biết launcher kia đang chạy gì**. Chi
tiết ở §3 hàng Q2. Chưa hỏi người dùng câu nào của vòng 1; bốn câu đang
chờ ở cuối §5.

## 2. Mục tiêu & đề bài

Tầng orchestrator của fgOS hôm nay là `herdr-plugin` (Rust, quản pane/tab
của herdr), nhưng không có gì đảm bảo mai sau vẫn là herdr — có thể là
cmux, tmux, hay một thứ khác chưa tồn tại. Đề bài là rút ra khái niệm
tổng quát nằm dưới nó: một *worker* là chỗ đứng cho đúng một đơn vị công
việc có vòng đời đầy đủ; hệ cần biết còn bao nhiêu chỗ trống cho từng
loại việc, phân việc vào đúng chỗ, và thu hồi chỗ khi việc xong hoặc chết
— tất cả qua một port trung lập để đổi tool không phải viết lại logic.
Gắn liền và không tách được: cơ chế đặt tên/nhãn cho chỗ đứng đó, vì hôm
nay nhãn đang gánh state của orchestrator và đó chính là nguồn của một bug
đang sống. Phạm vi bao gồm cả việc đổi `fg:agents-N` thành `fg:workers-N`,
vì đó là đổi tên đúng khái niệm chứ không phải sơn phết.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|--------|-----------|---------|
| Q1 | Gọi khái niệm mới là gì | **chưa rõ** | `capacity` đã bị chiếm nghĩa bởi `docs/decisions/0026` (đơn vị helper hẹp, không mang vòng đời rootTask). Cần tên khác. `worker` là ứng viên, khớp `fg:workers-N` người dùng muốn |
| Q2 | Phạm vi: chỉ herdr hay cả 3 launcher | **chưa rõ** | Scout thấy 3 trần song song độc lập (§5 vòng 1). Thiết kế chỉ cho herdr sẽ để nguyên rủi ro cộng dồn |
| Q3 | Nguồn chân lý cho occupancy | **rõ (chờ xác nhận vòng 2)** | Người dùng chốt: state fgOS. Scout tìm được cơ chế có sẵn để tái dùng: `session-claim-liveness` D1/D4 (tsk-3ni) |
| Q4 | Nhãn/label có được gánh state không | **rõ (chờ xác nhận vòng 2)** | Không. Hệ quả trực tiếp của Q3 |
| Q5 | Rename ở `fgos-coding-driving` hay chỗ khác | **chưa rõ** | Căng thẳng với hard rule "purely mechanical loop" của chính skill đó |
| Q6 | `fg:operation` 2 pane → 4 pane, chia ngẫu nhiên | **chưa rõ** | Là supersede của tsk-5lr D2 (nhận diện trái/phải bằng hình học). Cần biết vì sao cần 4 |
| Q7 | Hết chỗ thì làm gì | **chưa rõ** | Hôm nay mỗi launcher một kiểu: herdr refuse "no room"; runner bó theo wave; fanout chia batch 5 |

## 4. Quyết định đã chốt

Chưa có. (Đúng luật D4 của skill: chưa điểm nào đứng qua đủ hai vòng.)

Khi D-ID đầu tiên đủ chín, cần một work item thật để gọi
`fgos decision --id <item-id>` — hôm nay chưa có item nào cho feature này.

## 5. Q&A log

### 2026-08-12 — Vòng mở màn (người dùng nêu đề bài)

Người dùng nêu 2 mảng cần bàn:

1. Cơ chế rename pane phải thành hexagon (port/adapter + capability-gate
   qua tool registry), vì có thể đổi tool không dùng herdr. Đề xuất đặt ở
   `fgos-coding-driving` vì đó là driver tổng, biết id sớm nhất, làm một
   lần thay cho N launcher. Mở để bàn: có support tự rename và bỏ rename.
2. Khái niệm work-capacity tổng quát: bao nhiêu slot cho mỗi loại việc và
   cách phân bổ. Quan sát của người dùng: có 2 loại work-item — đơn vị
   thực hiện (discovery/plan/implement) và đơn vị quản trị hành chính
   (merge/retro/cleanup). Với herdr: hành chính mỗi loại 1 đơn vị chạy một
   lúc, chia ngẫu nhiên vào 1 trong 4 pane tab `fg:operation`; loại còn
   lại chia ngẫu nhiên vào pane thuộc `fg:agents-N`, muốn đổi thành
   `fg:workers-N`.

Ba trả lời nhanh của người dùng ở cùng vòng này (chưa đủ chín thành D-ID,
chờ vòng 2 xác nhận):

- Occupancy lấy chân lý từ state fgOS; adapter chỉ xếp chỗ và báo id;
  lệch thì engine thắng, adapter reconcile.
- Gộp 2 mảng thành 1 feature, vì rename chỉ sạch khi nhãn hết gánh state.
- Không vá tạm bug đang sống, để thiết kế nuốt luôn.

### 2026-08-12 — Vòng 1, scout (chưa hỏi)

**F1 — `capacity` là thuật ngữ đã khoá, nghĩa khác hẳn.**
`docs/decisions/0026:73-87` chốt `capacity` = "đơn vị functional/helper
hẹp (judge-discovery, submit-assist-classify) — không tự mang vòng đời 1
rootTask đầy đủ", và nói rõ subTask với capacity KHÔNG gộp làm một. Thứ
người dùng đang mô tả (chỗ đứng cho một việc có vòng đời đầy đủ) trong
vocabulary 0026 chính là chỗ chứa một **rootTask**, không phải capacity.
Cùng doc, `0026:49-52` đã nêu đích danh `herdr-plugin` như một **launcher**
tiềm năng. Nên tên "work-capacity" sẽ đụng vocabulary đã khoá.

**F2 — Đã có BA trần song song độc lập, không cái nào biết cái kia.**

| Launcher | Trần | Khai ở đâu | Thuật toán xếp |
|---|---|---|---|
| `fgos-runner` (headless) | `maxRoots × maxLeavesPerRoot`, mặc định 4×4 | `runner.parallel` trong config, validate lúc load (`loop.mjs:126-150`) | `selectWave`, FIFO theo root (`loop.mjs:158-170`) |
| `fgos-fanout` (Agent trong session) | 5 Agent/wave, hard cap | văn xuôi D7 trong SKILL.md (`fgos-fanout/SKILL.md:62-66`) | `computeSchedule`, xếp wave tránh đụng footprint (`graph-metrics.mjs:736`) |
| `herdr-plugin` (pane) | 8 pane (4×2) | hằng số Rust (`layout.rs:10,14`) | `find_agents_tab_with_room`, tab nhỏ số nhất còn chỗ |

Ba nơi khai báo, ba thuật toán, không chung từ vựng. Và chúng chạy được
ĐỒNG THỜI: runner có lock riêng (`runner.lock`, `EXIT_BUSY`) nhưng
auto-launcher của herdr không hề tra lock đó, còn fanout chạy trong
session. Nghĩa là trần thật ở mức máy hôm nay là tổng của cả ba, không ai
quản.

**F3 — Cơ chế "engine là chân lý" đã được thiết kế sẵn, tái dùng được.**
`session-claim-liveness` (tsk-3ni) đã chốt: D1 tín hiệu sống = hoạt động
sửa file thật trong worktree, KHÔNG phải PID/heartbeat, KHÔNG phải tuổi
claim; D4 công thức = `max(git log -1 %ct trên fgw/<id>, mtime mới nhất
trong danh sách git status --porcelain)`; D3 ngưỡng tái dùng thẳng
`/fgOS:stale` (`agentMs` 15 phút, `humanMs` 24 giờ). Đây đúng là tín hiệu
occupancy mà quyết định Q3 cần, đã có sẵn, không phải phát minh lại.

**F4 — `fg:operation` 2 pane là quyết định đã khoá, không phải thiếu sót.**
`herdr-operation-tab-layout` (tsk-5lr) D2 chốt nhận diện trái/phải bằng
hình học (`x` nhỏ nhất = trái = merge-loop; còn lại = retro/cleanup), và
có "pinned assumption": tab không đúng 2 pane là trạng thái lỗi/không hỗ
trợ, "revisit only if it's hit in practice". Muốn 4 pane chia ngẫu nhiên
là **supersede** D2 đó, cần nêu rõ lý do chứ không sửa tại chỗ.

**Bug đang sống, dùng làm bằng chứng cho nguyên tắc "nhãn không gánh
state":** `herdr-plugin` đặt nhãn cố định `fgos-auto-discover` làm khoá
dedupe "tối đa 1 pane auto-discover", set qua `herdr pane rename` trước
khi spawn `claude`; nhưng `/fgOS:discover-next` bước 6 cho phép session
bên trong tự gọi `/fgOS:terminal <id>` đổi nhãn thành `<id> | fg.ssid |
a.ssid` — nhãn guard biến mất, `has_labeled_pane` trả false dù pane vẫn
chạy, tick sau mở thêm pane thứ hai. `autoDiscover` đang `true` thật
trong `.fgos/config.json`.

**Bốn câu đang chờ người dùng (vòng 1):** tên khái niệm (Q1), phạm vi một
hay ba launcher (Q2), vì sao cần 4 pane cho operation (Q6), và hết chỗ thì
làm gì (Q7).

## 6. Thiết kế đã chốt {#design}

Chưa có. Chưa đủ chín — §3 còn 4 hàng "chưa rõ" ở mức định hình khái niệm,
viết §6 lúc này sẽ là bịa ra một thiết kế chưa ai đồng ý.

## 7. Danh mục hạng mục / task {#tasks}

Chưa có. Chờ §6 thành hình.
