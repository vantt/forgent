---
topic: herdr-vs-tmux-observation
date: 2026-07-18
based_on: [herdr@a0678a3]
entries: [herdr:agent-detection-manifests, herdr:status-authority-arbitration, herdr:agent-state-machine, herdr:socket-api-control-surface, herdr:workspace-tab-pane-model, herdr:native-agent-session-restore, herdr:session-snapshot-bootstrap-rpc, herdr:direct-attach-single-writer-ownership, herdr:wait-primitives]
compares_against: forgent tmux operator cockpit (decision ef6ed305)
---

# herdr vs the tmux observation cockpit — is herd hơn không?

**Bottom line — không, đừng thay tmux bằng herdr làm nền quan sát của fgOS; nhưng
herdr thắng ở đúng những thứ fgOS không mua.** Cockpit tmux (chốt ef6ed305) và
herdr quan sát **hai tầng khác nhau**: tmux + các verb `fgos list/ready/rollup/triage`
quan sát **trạng thái work-item ở tầng domain mà fgOS đã sở hữu tường minh**; herdr
quan sát **trạng thái tiến-trình/terminal bằng cách screen-scrape màn hình từng CLI
agent** (idle/working/blocked). Tính năng đầu bảng của herdr — phát hiện state agent
từ màn hình — vừa **trùng lặp** với cái fgOS đã có (rollup), vừa **kém tin cậy hơn**
(chính screen-scrape gây bug "idle giết agent" đo được ở thực địa). Adopt herdr làm
substrate quan sát sẽ **đảo ngược chính chủ ý thiết kế của ef6ed305** ("tmux là Host
Adapter bằng cơm — không đòi hệ mọc bộ phận mới"): fgOS sẽ phải phụ thuộc + nhường
một phần sự thật cho mô hình terminal của herdr, cõng thêm caveat vận hành của nó và
một binary Rust 34MB. **Giữ tmux làm cockpit; MƯỢN vài pattern của herdr (xem cuối).**
herdr chỉ đáng *pilot như một lớp attach tùy chọn ĐỨNG TRÊN* nếu attach-từ-xa/điện
thoại trở thành yêu cầu vận hành thật — không bao giờ làm nguồn sự thật.

---

## 1. Hai thứ đang được so — và chúng KHÔNG cùng loại

| | forgent tmux cockpit (ef6ed305) | herdr |
|---|---|---|
| Bản chất | **Keo dán bằng cơm.** tmux chỉ bày pane; "não" là các verb fgOS (C1) | **Sản phẩm agent-runtime.** 1 binary Rust tự làm multiplexer, tự phát hiện state, tự có socket API |
| Quan sát cái gì | **work-item ở tầng domain**: `fgos list/ready/rollup/triage`, `tail -f` log per-item (P39) | **CLI agent ở tầng terminal**: screen-manifest phân loại idle/working/blocked/done từ bottom-buffer |
| Nguồn sự thật | fgOS state layer (đã tường minh, event-sourced) | Suy ra từ màn hình + hook lifecycle (khi agent có hook) |
| Phụ thuộc thêm | 0 (tmux hầu như luôn có sẵn) | 1 binary 34MB + nó muốn *sở hữu* terminal (single-writer, `--takeover`) |
| Chủ ý thiết kế | "không đòi hệ mọc bộ phận mới" | "path to a real agent runtime" — nó muốn LÀ tầng runtime |

Đây là điểm mấu chốt: fgOS **không cần đoán** một item có blocked hay không bằng cách
nhìn màn hình — nó `fgos rollup`. Cái herdr bán đắt nhất (screen detection) là cái
fgOS đã có ở tầng cao hơn, sạch hơn.

## 2. Chấm theo đúng nhu cầu quan sát của fgOS

| Nhu cầu vận hành fgOS | tmux cockpit | herdr | Thắng |
|---|---|---|---|
| Thấy trạng thái **work-item** (ready/blocked/done, rollup) | ✓✓ query thẳng state layer — chính xác tuyệt đối | ~ chỉ thấy state *tiến trình*, không thấy DAG/deps của fgOS | **tmux** (herdr mù tầng domain) |
| Mắt live vào log 1 item (P39) | ✓✓ `tail -f` — chuẩn, không caveat | ✓ `pane read`/scrollback | **Hòa/tmux** |
| Cửa người (submit/answer/review/approve) | ✓✓ pane gọi verb C1 trực tiếp | ~ phải qua `agent send` (send≠submit, xem §3) | **tmux** |
| Dashboard poll rẻ (P37 data_hash) | ✓✓ poll `fgos rollup`, rẻ hoá bằng hash | ✓ hoặc `events.subscribe` (đẩy thay vì poll) | **Hòa** — herdr có *ý tưởng* subscribe hay hơn (mượn được) |
| Chuông chờ-người | ✓ tmux `monitor-activity`/BEL | ✓✓ `notification.show` native + `wait agent-status` | **herdr** nhẹ nhàng hơn |
| Đa phiên chung 1 checkout (P35) | ~ phải tự kỷ luật (beehive claims/holds) | ✓✓ single-writer ownership + `--takeover`, observer read-only vô hạn | **herdr** (pattern đáng mượn) |
| Attach từ xa / điện thoại, sống qua restart | ~ `tmux attach` + ssh, tự lo | ✓✓✓ `--remote` thin-client, detach/reattach sống qua restart, SSH điện thoại | **herdr** rõ rệt |
| Điều khiển **heterogeneous** third-party agent bạn KHÔNG kiểm soát | ✗ tmux không hiểu agent | ✓✓✓ 19 manifest + 14 integration + native resume | **herdr** — nhưng fgOS agent tự report state, nên ít cần |
| AI tự lái multiplexer | ~ tmux CLI thô | ✓✓ 1 socket JSON-RPC tự mô tả, agent spawn/read/wait nhau | **herdr** — nhưng đây là coordination tầng *pane*, không phải tầng *work* mà fgOS đang xây |

Đọc bảng: herdr thắng ở **remote-attach tương tác, ownership đa-writer, phát hiện
agent lạ, notification** — toàn thứ *phụ trợ*. tmux thắng/hòa ở **đúng lõi fgOS mua:
quan sát trạng thái công việc và mở cửa cho người gọi verb.**

## 3. Cái giá thật của herdr: caveat vận hành đo được (herdr 0.7.3, dogfood airemote)

Đây là bằng chứng thực địa, không phải marketing — lý do mạnh nhất để KHÔNG đặt fgOS
lên nền herdr nếu fgOS phải *lái* agent qua nó:

- **`idle` mập mờ → GIẾT agent.** `idle` được báo cho cả agent sẵn sàng *lẫn* agent
  đang kẹt ở prompt lần-đầu chưa nhận diện. Gửi lệnh lúc đó **giết agent thật** (quan
  sát trực tiếp). Tức: không được tin `idle` của herdr; phải tự screen-scrape shape
  màn hình — đúng thứ herdr lẽ ra làm hộ. (herdr:agent-detection-manifests có giới hạn thật.)
- **send ≠ submit.** `agent send` chỉ gõ chữ, không gửi. Phải poll màn hình xác nhận
  chữ đã lên rồi mới gửi phím submit; gửi Enter sớm **mất submission** (đo 2 lần).
- **`HERDR_SESSION` bị lờ im lặng** (0.7.3) — chỉ `--session` cô lập; theo spec chữ
  literal thì mọi workspace mọc vào session sống của operator.
- **Codex trust-prompt đọc thành `idle` không phải `blocked`** — phá luôn flow
  session-start của chính spec.

tmux không có bất kỳ hố nào trong số này: `send-keys` ngu và đoán được; không có tầng
"phát hiện state" để mà sai.

## 4. Vì sao adopt herdr đi ngược ef6ed305

Lý do chốt của ef6ed305: *"tmux là Host Adapter bằng cơm: chỉ terminal gọi verb qua
C1, không đòi hệ mọc bộ phận mới."* Đặt fgOS lên herdr làm nền quan sát sẽ:

1. **Thêm một nguồn sự thật thứ hai** (state tiến-trình của herdr) cạnh state domain
   của fgOS — đúng bài "2 nguồn sự thật" mà chính herdr cảnh báo và giải bằng
   hook-authority. fgOS đã có 1 nguồn sạch; thêm herdr là bước lùi.
2. **Cõng caveat của herdr** (§3) vào đường vận hành cốt lõi.
3. **Nhường quyền sở hữu terminal** cho herdr (single-writer/`--takeover`) và **thêm
   phụ thuộc binary 34MB** — trái với "không mọc bộ phận mới".
4. herdr đang trên "path to a real agent runtime" — nó muốn LÀ tầng orchestration.
   fgOS *cũng* đang xây tầng đó (multi-agent fan-out, reactive signals). Hai runtime
   chồng vai trò → xung đột kiến trúc, không phải bổ trợ.

## 5. Synthesis — thiết kế nên chọn cho fgOS

**Giữ tmux làm cockpit vận hành (ef6ed305 đứng vững).** Nó fit đúng tầng fgOS cần,
zero phụ thuộc, giữ fgOS là nguồn sự thật duy nhất.

**MƯỢN pattern của herdr — không adopt sản phẩm.** herdr là một cài đặt trưởng thành
của vài ý tưởng fgOS đang/sẽ cần; port *ý tưởng*, viết bằng verb fgOS:

1. **hook-authority-arbitration** → mỗi work-item đúng 1 nguồn status authority; tín
   hiệu report tường minh đè fallback suy diễn. Củng cố `fgos rollup`/state layer.
2. **snapshot-then-subscribe** → dashboard tiến hoá từ poll (P37) sang "snapshot 1
   lần rồi `events.subscribe`"; hợp đồng cache client rõ, rẻ hơn poll khi fleet lớn.
3. **single-writer-ownership + takeover** → cấp thẳng cho P35 (đa phiên chung
   checkout): 1 writer/tài nguyên, `--takeover` để evict, observer read-only vô hạn —
   ngôn ngữ chính xác cho beehive claims/holds hôm nay còn dựa kỷ luật.
4. **wait-primitives split** → tách `wait output` (khớp màn hình) vs `wait
   agent-status` (state ngữ nghĩa); khớp-ngay-hoặc-block. Lõi cho reactive fan-out.
5. **native-session-resume + self-describing schema** → relaunch bằng chính lệnh
   resume của agent (version-gated); sinh schema control-surface từ code (chống drift,
   nối tiếp `beehive --help --json`).

**herdr chỉ như lớp attach TÙY CHỌN, đứng TRÊN, nếu remote/điện thoại thành nhu cầu
thật.** Đúng tư thế airemote đã dùng (consumer chạy TRÊN herdr) — và caveat §3 chính
là bài học của tư thế đó. fgOS chạy trong pane herdr để operator attach từ xa, nhưng
herdr **không bao giờ** là nguồn sự thật hay đường lái agent chính. Rẻ để thử
(`brew install herdr`), không khoá (socket API + CLI-as-plugin).

## 6. Khi nào câu trả lời lật thành "herdr hơn"
- Operator **thật sự** cần attach tương tác từ điện thoại/SSH vào cả fleet, sống qua
  restart — tmux+ssh làm được nhưng thô hơn nhiều.
- fgOS phải điều phối **agent bên thứ ba không kiểm soát** (không report state qua
  fgOS) — lúc đó screen-detection của herdr có giá trị fgOS không tự có.
- Chưa có nhu cầu nào ở trên hôm nay → tmux thắng.

## Open questions (cần người quyết)
1. Remote/điện thoại attach vào fleet có phải yêu cầu vận hành thật của fgOS không?
   Đây gần như tự phân thắng bại (giống open-q của adopt-decision herdr-vs-ntm).
2. fgOS có kế hoạch chạy agent **bên thứ ba không-report-state** không? Nếu có,
   screen-detection của herdr đáng cân lại.
3. Trong 5 pattern §5, cái nào human muốn nâng thành candidate chính thức trong
   `porting-log.md` để triage?

---

## Cập nhật 2026-07-18 — kết luận đã tiến hoá qua thảo luận (đây là phần chốt)

Bàn sâu với người dùng đã **đẩy kết luận đi xa hơn** phần "tmux vs herdr" thuần ở
trên. Ghi lại phần chốt (record sản phẩm: `repo/docs/decisions/0014`, backlog
`repo/docs/backlog.md` P46 + P48):

**A. Câu hỏi thật không phải "multiplexer nào" mà "cửa chuẩn của fgOS là gì".**
Chốt (mức interface): **contract = SCHEMA event-log + giao thức append/read/subscribe**
(fgOS đã event-sourced), KHÔNG phải một lib. **Lib chỉ là client tham chiếu Node.**
CLI = adapter local standalone (cửa hằng ngày). **Daemon NGOÀI core**, là consumer
giao tiếp **qua CLI** (`spawn fgos <verb>` + poll) + giữ kênh push; core fgOS vẫn
passive → `b2d18cc7` (Host-Adapter) **được giữ, không supersede**. UI/remote là
client của **daemon**, không của lib. Push "cần bạn" tách thành subsystem riêng
(P48, delivery-semantics).

**B. Điều đáng lấy từ herdr chưa bao giờ là runtime — mà là kiến trúc INTERFACE.**
Mô hình "một cửa protocol tự-mô-tả, mọi surface (kể cả TUI của nó) là client,
remote = bind socket, push = subscribe" chính là herdr. fgOS nếu dựng cửa mạng
(daemon) nên mượn *cách herdr thiết kế cửa* (`socket-api-control-surface`,
`self-describing-protocol-schema`, `session-snapshot-bootstrap-rpc`) — không adopt
herdr làm runtime.

**C. Option interim được chấp nhận: herdr làm CHROME, agent tự lái pane.** Trước khi
dựng sâu (P46/P40/P48), một cách đứng-được ngay: dùng herdr làm khung, **agent
(claude) lái herdr qua socket/SKILL.md** tự bày pane — mỗi pane chạy **CLI fgOS**
(`fgos list`/`watch`, `tail -f` log). Hợp lý vì: (1) fgOS vẫn chỉ bị lái qua cửa
CLI — herdr không chạm nội tại → không phạm 0014; (2) **né đúng phần dở của herdr**
(không xài screen-detection; agent chỉ mở pane + chạy lệnh, nên idle-giết-agent /
send≠submit gần như không đụng); (3) remote + attach free; (4) zero-build, học được
UX cockpit rẻ. **Kỷ luật bắt buộc:** giữ glue-lái-herdr **mỏng, vứt-đi-được**; đây
là *chrome* tạm chứ chưa phải *view* thật (UX vẫn phụ thuộc `fgos watch` in đẹp cỡ
nào; decision-inbox P48 chưa có); herdr chỉ là **một** lựa chọn chrome-interim ngang
hàng runbook-tmux (P40) và TUI-bespoke — herdr hơn ở *agent-tự-bày + remote-free*,
tmux hơn ở *zero-dep + không moving-part*. Lock-in thấp vì chỉ là chrome: swap sau
không đụng core.

**D. Gate trước khi code:** kiến trúc này KHÔNG tự nâng độ ưu tiên thực thi. P46/P48
phải cân với nợ content đang chặn dogfood (discovery-context, worker-execution,
feedback-loop) trước khi đổ công.
