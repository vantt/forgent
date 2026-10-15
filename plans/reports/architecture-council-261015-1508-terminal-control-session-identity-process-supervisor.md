# Hội đồng kiến trúc — terminal-control, session-identity, unified process supervisor

- Ngày: 2026-10-15. Workflow `architecture-advisory`, run `wf-run-1792050915567-d978f530`, đang park ở gate `close` (chờ anh).
- Đầu vào: [research-261015-1116-herdr-tab-pane-layout-and-naming.md](research-261015-1116-herdr-tab-pane-layout-and-naming.md) (file research giữ nguyên, report này là file riêng) + 7 nguyên tắc của anh (nguyên văn trong `--request`).
- Revision các seat đối chiếu: `62f0f23f2`.
- Report này do Lead (Claude Opus 5.5, phiên điều phối) tổng hợp từ các report đã settle. Lead không viết lời khuyên; mọi kết luận dưới đây ghi rõ seat nào nói. Phần "Nhận xét của Lead" ở cuối là ý kiến riêng, tách bạch.
- Đây **không** phải phê duyệt, không phải consensus, không phải lệnh triển khai.

## 1. Ai ngồi ghế nào (theo dispatch-plan của runner)

| Bước | Vai | Executor | Model | Tier | Kết quả |
|---|---|---|---|---|---|
| framing | producer | openai (tetcu72) | gpt-6.1-sol | flagship | pass |
| shaping (blind) | panelist-1 — system lens | openai (tetcu72) | gpt-6-astra | frontier | pass |
| shaping (blind) | panelist-2 — alternative lens | claude-herdr | fable | frontier | pass |
| shaping (blind) | panelist-3 — constraint lens | gemini (tetcu72) | gemini-4-argon-high | frontier | pass |
| shaping | synthesizer | xai (vantt) | grok-4.6 | frontier | pass |
| critique | producer | xai (vantt) | grok-4.6 | flagship | pass |
| critique | reviewer | deepseek (openrouter) | deepseek-v4-pro | flagship | pass |
| synthesis | producer r1, r2 | claude-herdr | opus | flagship | pass |
| synthesis | reviewer r1 → r2 | openai | gpt-6.1-sol | flagship | findings → **pass** |
| synthesis | red-team r1 → r2 | openai | gpt-6.1-sol | flagship | findings → **findings** |
| explanation | producer | claude-herdr | fable | frontier | pass |

Giới hạn độc lập (packet tự ghi R10, Lead xác nhận):
- 3 ghế shaping ở 3 họ khác nhau, tier frontier: đây là phần độc lập thật.
- Synthesizer và critic cùng model (grok-4.6). Reviewer và red-team của synthesis cùng model với framing (gpt-6.1-sol), **không phải Argon** như Lead dự tính: pool synthesis chỉ ưu tiên khác họ với producer (claude), nên cả hai checker rơi vào openai. Muốn red-team khác họ reviewer cần chỉnh pool, đã ghi ở mục 9.
- Producer packet (opus) và explanation (fable) cùng họ claude với panelist-2.

Đường dẫn bằng chứng: `.fgos/assignments/<unit-run>/<role>/<n>/runs/01/outbox/report-1.md` với các unit-run `1792050915782-fce39f39` (framing), `1792051281308-0c298779` (shaping), `1792052454167-c5b9e16c` (critique), `1792053135431-be87d799` (synthesis, packet cuối là `producer/2`, sha256 `21ea2e5f…cdd840`), `1792054578280-b86dbe74` (explanation), tất cả có tiền tố `unit-run-`.

## 2. Kết luận chính (packet cuối, producer opus, round 2)

1. **Bác research nguyên trạng.** Lý do được nhiều seat nêu độc lập: tỷ lệ "85% lifecycle giống nhau", helper 4 hàm, LOC/thời gian đều chưa đo (F01); identity đặt trong host-runtime trái nguyên tắc #4; lock file trong repo sai với linked worktree và herdr dùng chung; `host-bin.mjs` không bắt verb mới trên activation cũ (V7); gate 15s vi phạm L5; parse label biến hiển thị thành khoá state; đảo ngược quyết định D2 mà không nói; hình học layout portrait tự mâu thuẫn và quên ô separator (V11).
2. **Không gộp supervisor.** cli-spawn, herdr-spawn và BoundInvocationSupervisor có chủ durability khác nhau: supervisor detached giữ pipe/deadline qua crash coordinator; herdr-spawn dựa vào herdr server + incarnation reconcile; BoundInvocation là vòng đời RPC ngắn có chủ đích (quyết định runner 0043) (F02, V8).
3. **Trước tiên sửa hai lỗi an toàn đang có trong code** (đã kiểm trên source, độc lập ngôn ngữ):
   - **Reaper có thể SIGKILL worker đang chạy và xoá private-home (OAuth token) khi controller chết**, vì ownership marker không có paneId trước khi worker chạy (`p-c3a41d07`, F05, V2).
   - **Worker độc lập kế thừa writer id của cha** (`FGOS_SESSION_ID`), nên self-recognition của `main-checkout.lock` có thể nhận hai process khác nhau là một writer (F03, V3, V4). Thêm vào đó `workerBaseEnv` không strip `CLAUDE_CODE_SESSION_ID`/`CODEX_THREAD_ID` của cha.
4. **Wave 1 bằng Node, nhỏ, mỗi item có test:**
   - **1a** — đóng `p-c3a41d07` trong Confinement Authority, fail-closed, 4 phần cùng lúc: (i) ghi paneId+herdrSession vào marker trước `pane run`, ghi nguyên tử; (ii) reaper chỉ xoá khi marker đọc lại sau khi kiểm liveness y hệt marker đã dùng để quyết định; (iii) binding đang chạy giữ nguyên ân hạn controller-còn-sống/run-timeout như home chưa bind; (iv) finalizer chấp nhận đúng tập trường được phép, vẫn từ chối mọi thay đổi khác. Độ tin cậy packet tự ghi: **medium-low**. Xem RT2-1 ở mục 5: phần (ii) đã bị bác một lần nữa.
   - **1b** — scrub session var CLI của cha trong `workerBaseEnv`.
   - **1c** — sau spike S1: child `FGOS_SESSION_ID = launchCommandId`, id cha đi riêng làm lineage. Đây là thay đổi hợp đồng identity công khai (io-contract, CHANGELOG, kiểm doctor/setup).
   - **1d** — sau 1b: thêm `CODEX_THREAD_ID` vào env tier của resolver; `writer.source` vẫn giữ 4 giá trị.
   - **1e** — truyền `displayContext {groupKey, groupLabel, scope, role, agentKind, model}` từ `fgos run` và workflow runner; đổi tên `dispatchBatchKey` không alias; xoá nhãn tab tự chế; không parse nhãn.
   - Gate: full `npm test` trước activation.
5. **Giữ nguyên:** root pane rỗng làm điểm neo split (vì herdr split theo pane id; `closeIfEmpty` dựa vào `paneCount <= 1`), `src/util/session-identity.mjs` là authority identity duy nhất, D2 (không thêm verb `fgos terminal`), không thêm lock.
6. **Hoãn sau trigger có tên:** crate Rust session-identity / terminal-control, layout engine, supervisor hợp nhất (T2, T4–T8). Thời điểm Rust là quyết định của anh (OQ1).

Bất ngờ đáng chú ý nhất của hội đồng (critique Attack 2, F06): **"root pane rỗng là lãng phí"** là giả định chung của research và cả 3 shaper. Code (`herdr-agent.mjs:144-150, 451-490`) cho thấy nó là địa chỉ để split. Bỏ nó mà không đổi predicate `paneCount <= 1` sẽ đóng tab đang có đúng một worker chạy.

> **Cập nhật sau hội đồng (Lead đo trên herdr live, 2026-10-15 16:14):** quyết định "giữ root pane" của hội đồng chỉ chờ trace live S3 / trigger T2. Bằng chứng ở [mục 10](#10-bằng-chứng-live-sau-hội-đồng-bỏ-root-pane-rỗng) đã thoả điều kiện của T2, nên **đề nghị bỏ root pane rỗng ngay trong wave 1**, không giữ.

## 3. Ba thiết kế độc lập (shaping, blind)

| | Panelist-1 — gpt-6-astra (system) | Panelist-2 — fable (alternative) | Panelist-3 — argon-high (constraint) |
|---|---|---|---|
| Luận điểm | Rust Session Identity + Terminal Control là 2 nền độc lập; một per-attempt Run Supervisor cho cli/herdr; agent protocol là trục riêng | Carrier (herdr) là nguồn sự thật; truyền handle theo lineage thay vì lock; ~200–250 LOC Node, 0 crate/lock/verb | "Lease-fenced, fail-closed": 2 crate Rust độc lập ngay + Node parity mirror, `fgos terminal acquire-pane` với write-ahead lease, lock theo session, clamp `/proc` ở biên multiplexer |
| Đóng góp được giữ | **Authority map + bảng 6 loại identity có lifetime** (critique: "best authority map") → ghi vào spec làm TARGET; đặt identity/ownership/recovery trước layout | `displayContext` là dữ liệu thuần; không lock; giữ D2; contract + test vector chung thay vì gộp vòng chạy | **7 "trap" sản xuất** thành ràng buộc cứng: env bleed, cửa sổ reaper, `paneCount`, `host-bin` mismatch, L5, không lock trong repo, không `execFileSync` trên event loop của panel |
| Bị bác/hoãn | Rust facade + supervisor gộp: hoãn (S6 chưa đo; với herdr, process per-attempt có thể thêm failure domain) | Đóng root sau split đầu (V1); token làm khoá reaper (F10); dùng chung id cha làm lineage (V3/V4). **Carrier writer tier không bị bác**, còn là phương án tranh chấp | Hai sự thật identity Node+Rust; verb mới (trái D2); terminal ghi marker của Confinement (writer thứ 2); TTL 5s; root-as-worker 1-RPC |

Kiểm tra từng phương án với 7 nguyên tắc của anh (critique, grok-4.6, không chấm điểm), các điểm chính:
- **#1 One Door:** research và P3 đều có hai thuật toán identity song song. P2 có một "cửa identity thứ hai" ngầm: id cha dùng chung.
- **#3 Hexagonal:** helper 4 hàm (research, và `PtyCarrierPort` của P3) không diễn đạt được `unknown`/`unsupported`/`retain`. P1 port rộng hơn nhưng trung thực. P2 chưa có port nào cho đến khi có driver thứ 2.
- **#4 Rust:** chỉ P1 và P3 thoả. P2 và packet cuối hoãn, nên đây là lựa chọn giá trị của anh (OQ1).
- **#5 OS-truth:** research giữ file lock + layout engine làm state riêng của fgOS. Bản năng "reaper phải hỏi pane" đúng, nhưng sai chỗ lưu: có hai store (command record và owner marker), reaper đọc nhầm store rỗng.
- **#7 Authority:** chỉ cách "đi qua seam của Confinement Authority" là tôn trọng ranh giới, và chưa seat nào đặc tả API của seam đó.

## 4. Spike trước activation (rẻ nhất trước)

| ID | Việc | Quyết định gì |
|---|---|---|
| S0 | Unit check charset id env (vài phút) | `launchCommandId` hợp lệ làm child id; id có `:` không đi qua `FGOS_SESSION_ID` được |
| S1 | 2 worker song song, id chung và id riêng: lock, claims, commit lồng nhau | Item 1c / chính sách D1 |
| S2 | Bộ case tất định trên hàm cleanup/authority thật (5 case + case RT2-1) | Tính đúng của 1a; **chưa pass đủ thì chưa gọi là an toàn** |
| S3 | Trace panel 3 seat live | T2: có bỏ root pane / layout chooser không |
| S4 | Sau scrub env: CLI con tự đặt session var có bị tamper-kill không | Item 1b, 1d |
| S5 | Kiểm kê call site anchor/batch key (gateway, fanout) | Độ đầy đủ của 1e; T5 |
| S6 | Đo thời gian gọi Rust identity từ pre-commit hook dưới recursion guard | T4; **cho OQ1 dữ liệu thật** |
| S7 | Quan sát herdr live: comm, root pid mỗi pane, việc tái dùng `HERDR_PANE_ID` | Identity cho pane do người mở (P1 vs P3 vs P2) |
| S8 | Diffstat launcher/verify giữa herdr-round và detached-run-supervisor | T7: hoist leaf `/proc` verify |

## 5. Phản biện chưa đóng (red-team round 2, gpt-6.1-sol) — không bỏ qua

Bước synthesis kết thúc với `outcome: findings` sau 2 vòng (giới hạn của workflow), nên **chưa producer nào trả lời** hai finding sau:

- **RT2-1 (high): luật 1a-ii không chặn được controller còn sống nhưng đã quá cửa sổ run.** Lịch trình: reaper đọc marker chưa bind → thấy controller còn sống nhưng home đã quá `max(maxAge, timeout+grace)` → đọc lại marker, y hệt → controller (chậm hoặc bị treo) chạy tiếp, bind pane và launch worker → reaper xoá home với `stopProcesses:true`. Red-team chạy được: `red-team/2/runs/01/outbox/counterexample-1.mjs`, kết quả `killedLiveWorker: true`. Lịch trình này không cần pid reuse, ghi không nguyên tử hay binder thứ hai (ba điều R12 đã liệt kê). Yêu cầu: bind/launch không được vượt mặt một reclaim đã cam kết, hoặc launch muộn phải từ chối; S2 phải có case này. Dời lần đọc lại sát lệnh xoá **không** giải quyết được. Explanation (fable) đã chạy lại và xác nhận cùng kết quả. Theo T3 của chính packet: S2 fail thì không ship 1a, chuyển sang "acquisition-pending ownership state" của panelist-1.
- **RT2-2 (medium): T1 rollback mở lại lỗi identity.** Nếu S1 thấy có consumer cần child == parent, T1 cho quay về id chung kèm trường lineage. Nhưng `main-checkout-lock.mjs:296-308` chỉ so `record.pid === identity`, nên trường lineage không có tác dụng. Rollback phải chứng minh hai attempt độc lập không chiếm slot của nhau, trong khi re-entry của process con hợp lệ vẫn chạy.

Reviewer round 2 (cùng model) cho pass, nhưng tự ghi rằng luật 1a-ii là "acceptance contract awaiting implementation evidence, not an established race-free algorithm". Reviewer không mâu thuẫn với red-team.

## 6. Bất đồng giữ nguyên (không bình quân hoá)

- **panelist-1:** đích là Rust identity + terminal làm sự thật ngữ nghĩa với Node facade mỏng, cộng per-attempt Rust supervisor; packet chỉ lấy authority map.
- **panelist-2:** id cha chung là lineage có chủ ý (commit `13bdf7392`); carrier writer tier đúng. Tier này **chưa bị bác**; S1, S3, S7 có thể phục hồi một phần.
- **panelist-3:** nguyên tắc #4 và fail-closed đòi crate Rust ngay, lease, lock, clamp `/proc`.
- **panelist-1 vs panelist-3:** identity không phân biệt được nên là `unknown` (P1) hay luôn là pid+start-time của root pane (P3). Không tương thích; S7 quyết.
- **shaping synthesizer:** chọn root-as-worker và layout chooser ngay đợt này; bị critique đảo, chưa phản hồi.
- **critique producer:** cố ý không khuyến nghị; các lựa chọn trong packet không phải sự tán thành của critic.
- **Nguyên tắc #4 của anh vs default của packet:** mở, là OQ1.
- **red-team round 2:** RT2-1, RT2-2 mở.

## 7. Bốn việc chờ anh

| # | Câu hỏi | Khuyến nghị của packet / seat | Ghi chú |
|---|---|---|---|
| Gate `close` | Có mời thêm 4 chuyên môn còn thiếu không: (1) nội bộ herdr (protocol, vòng đời pane id, token qua move/restart, idempotency create/split); (2) Linux process/PTY (session/pgid, cắt comm, pid reuse, `/proc` không đọc được); (3) chính sách giữ credential khi liveness không rõ; (4) tích hợp Rust/Node activated-release + hiệu năng pre-commit hook. Red-team r2 thêm (5) reclaim tài nguyên đồng thời (cho RT2-1) | — | Trả lời gate không phải duyệt lời khuyên hay cho phép triển khai |
| Reopen | Mở lại synthesis (`architecture-advisory-reopen`) để producer trả lời RT2-1/RT2-2 | Explanation (fable) đề xuất làm ngay; rẻ, đảo ngược được, không chạm workspace | Không chạy lại các ghế blind |
| OQ1 | Thời điểm Rust (nguyên tắc #4). (a) Node trước, Rust khi trigger; (b) crate session-identity độc lập ngay nếu S6 pass; (c) cả 2 crate + Node mirror; (d) lộ trình P1: cả 2 nền Rust ngay, một authority identity sau Node facade, giữ supervisor Node khi chuyển | Packet: **(a)** và chạy S6 ngay; nếu #4 là luật cứng cho identity thì (b); cho cả hai nền thì (d); **không bao giờ (c)**. P1 và P3 giữ quan điểm ngược về thời điểm | Wave 1 chạy được với mọi lựa chọn |
| OQ2 | Khi herdr không trả lời pane và credential đã quá hạn: (a) expiry thắng; (b) giữ tới khi pane chắc chắn đóng; (c) expiry thắng nhưng hiện home pending/unknown cho xử lý tay | Packet: **(a)** cho đúng các trường hợp hôm nay, kèm 1a-iii để không lan sang run đang chạy | RT2-1 nằm đúng nhánh này nhưng trả lời OQ2 không tự đóng RT2-1 |

## 8. Nhận xét của Lead (ý kiến riêng, không phải của hội đồng)

1. **Nên reopen trước khi lập plan.** RT2-1 là một ca S2 fail đã có bằng chứng chạy được, ngay trong item an toàn quan trọng nhất (1a). Đưa packet hiện tại vào planning nghĩa là mang một hợp đồng đã biết là thiếu vào kế hoạch. Khi reopen nên cho red-team một họ chưa dùng (gemini hoặc deepseek) để giảm R10.
2. **S0 và S6 nên chạy ngay, song song.** Cả hai chỉ đọc/đo, vài phút đến một script. S6 biến OQ1 từ tranh luận giá trị thành quyết định có số.
3. **Về OQ1:** nguyên tắc #4 anh viết rõ ("xây mới bằng Rust để dùng xuyên suốt"). Hội đồng không bác #4. Lý do hoãn chỉ là chưa đo (S6) và chi phí tích hợp (D2, host-bin, doctor, cargo gate). Nếu S6 pass, em nghiêng về **(d)** hơn (a): (d) thoả #4 mà không tạo hai sự thật identity, và giữ supervisor Node trong lúc chuyển nên không đụng vùng durability đang nhạy cảm. Nếu S6 fail, (a) là đúng. Đây là phán đoán của em; em cùng họ claude với producer packet, anh nên đọc với cùng độ dè dặt.
4. **Wave 1 có những phần không phụ thuộc OQ1/OQ2/RT2:** 1b (scrub env, sau S4), 1e (displayContext), và ghi authority map của P1 vào `docs/specs/runner.md` làm TARGET. 1a chờ RT2-1, 1c chờ S1 + RT2-2.

## 9. Ghi chú vận hành của lần chạy này

- Config đã đổi để có hội đồng này (commit `4c78e6e`, `62f0f23`): pool `architecture:*` theo bước, rigor high/critical; `modelPolicies.gemini` flagship/frontier sửa từ `gemini-3.1-pro-*` (agy không còn model này) sang `gemini-4-argon-high`; deepseek có thêm invocation herdr `pi-herdr-openrouter`, đã qua blind canary (`unit-run-1792050408368-80727dca`) và được thêm vào `BLIND_PROVEN_PAIRS`.
- Bài học: pool synthesis cần sắp để reviewer và red-team rơi vào hai họ khác nhau. Hiện cả hai ra openai vì bind chỉ tránh họ của producer.
- `~/.fgos/config.json` (global) vẫn còn `gemini-3.1-pro-*` ở flagship/frontier; chưa sửa vì nhiều workspace cùng đọc file này.
- Doctor `model-policy-tier-coverage` fail sẵn từ trước (xai thiếu tier `nano`), không liên quan đến lần này.

## 10. Bằng chứng live sau hội đồng: bỏ root pane rỗng

Hội đồng không quan sát herdr live (V13) nên giữ root pane làm mặc định và đặt điều kiện mở lại ở T2: *"S3 cho thấy split từ pane worker đang chạy không làm hỏng TUI và pane lỗi được giữ không chặn sibling → bỏ root pane và đổi predicate `paneCount <= 1` trong cùng một lần cutover"*. Lead đo trực tiếp trên herdr thật (tab tạm `probe-root-pane`, `probe-resize`, đã tự biến mất sau thử):

| # | Thử | Kết quả |
|---|---|---|
| 1 | Tạo tab → split worker A từ root → **đóng root** | Đóng được; tab còn 1 pane (A) |
| 2 | Split pane mới từ worker A (không dùng root làm neo) | Pane mới nằm đúng tab đó (`pane_count` 2) |
| 3 | Đóng lần lượt mọi pane | Khi pane cuối đóng, **herdr tự xoá tab** (`tab get` → `tab_not_found`) |
| 4 | Chạy `claude --model haiku` ở A, giao việc in 1..120 + `DONE-MARKER`; **trong lúc A đang `working`**, split B (down) rồi C (right) từ chính A | A vẫn `working` sau 2 lần split, kết thúc `done`; đủ 120 dòng + marker, không mất/vỡ dòng; khung TUI tự vẽ lại theo bề rộng mới |

Vì sao tab rỗng hôm nay bị bỏ lại: root pane rỗng giữ tab sống; `closeIfEmpty()` chỉ chạy ở exit hook của chính process tạo tab và chỉ khi `paneCount <= 1`. Process đó bị kill/crash (ví dụ run workflow bị dừng) thì không còn ai đóng tab.

**Đề xuất (thay ND2, đưa vào wave 1, trong `createBatchTab` ở `src/runner/dispatch/herdr-agent.mjs`):**
1. Worker đầu tiên split từ root như hiện nay; split xong **đóng root ngay**.
2. Neo split cho worker sau = một pane worker còn sống trong tab; nếu nó đã đóng thì lấy pane khác của tab, không còn pane nào thì `invalidate()` và mở tab mới (cơ chế đã có).
3. **Xoá hẳn `closeIfEmpty()`** (không chỉ đổi predicate): herdr tự xoá tab khi pane cuối đóng; giữ predicate `paneCount <= 1` sau khi bỏ root sẽ đóng nhầm tab có đúng một worker (F07).
4. Pane của round lỗi vẫn giữ lại để xem như hiện nay; tab chỉ biến mất khi người đóng pane đó.

### 10.1 Thử bổ sung: resize lúc boot và lúc nhận brief, đủ 5 CLI (16:17–16:30)

Script mô phỏng đúng trình tự fgOS (`pane run` → chờ `idle` → `herdr agent prompt <pane> <brief nhiều dòng> --wait --until working` → chờ marker). Pane của agent bị resize hai lần: split B lúc agent đang boot (0,5s sau `pane run`), và split C rồi D ngay trong lúc `agent prompt` đang dán brief (0,15s và 0,45s). Marker do agent tự ghép (`FINISHED-<số>`), không có sẵn trong brief.

| CLI (lệnh thử) | Brief được nhận | Kết thúc | Paste chip / draft kẹt | Tab tự biến mất |
|---|---|---|---|---|
| claude `--model haiku` | có (`working`) | `done`, marker có | không | có |
| codex (tetcu72) `gpt-5.6-luna` | có (`working`) | `done`, 40/40 dòng + marker | không | có |
| agy (tetcu72) `gemini-3.8-flash-low` | có (`working`) | `done`, 40/40 dòng + marker | không | có |
| pi (openrouter) `deepseek-v4-flash` | có (`working`) | `done`, marker có | không | có |
| omp (`OMP_PROFILE=gemini-tetcu72`) `gemini-3.8-flash` | có | làm xong, 40/40 dòng + marker | không | có |

Riêng omp: `agent prompt --wait` trả `agent_prompt_stalled` (omp không báo `working` cho herdr trong 5s) **giống hệt ở lần đối chứng không split**, nên không phải do resize. Hai lần thử omp trước đó hỏng vì cách gọi của Lead (wrapper `omp` trong zsh tự đặt `OMP_PROFILE=openai-tetnu`, đè `PI_CODING_AGENT_DIR`; fgOS đã strip biến này ở `adapters.mjs:94-103`), không liên quan resize.

### 10.2 Thử bổ sung: pane lỗi được giữ và neo đã chết

| Thử | Kết quả |
|---|---|
| Root đã đóng; pane A mô phỏng round lỗi (in `WORKER FAILED`, giữ lại làm bằng chứng) | Tab còn 1 pane (A), không bị đóng |
| Split B **từ chính pane lỗi A**, chạy claude ở B, giao việc | B nhận brief, `done`, trả đúng `SIBLING-OK-4810`; A vẫn hiện nguyên thông báo lỗi |
| Đóng A rồi split từ id của A | herdr trả `pane_not_found` (lỗi rõ, không treo) |
| Lấy pane còn sống của tab bằng `herdr pane list` lọc theo `tab_id` → split từ đó | Thành công, pane mới cùng tab |
| Đóng hết | Tab tự biến mất |

Kết luận: cả hai vế của T2 đã có bằng chứng live; điều kiện mở lại của chính hội đồng đã thoả. Cơ chế fallback cho neo cần trong code: split lỗi `pane_not_found` → `pane list` lọc theo tab → split từ pane còn sống; tab không còn pane nào (đã tự biến mất) → `invalidate()` và tạo tab mới.

Giới hạn: thử ngoài confinement (không qua bwrap/private-home), model rẻ nhất mỗi CLI, mỗi kịch bản chạy 1 lần; chưa thử resize trong lúc agent đang ở trạng thái `blocked` (hỏi quyền/trust).

## 11. Reopen mục 2 (RT2-1/RT2-2), 2026-10-15 16:42–17:39

Run `wf-run-1792057330643-71c4907b` (`architecture-advisory-reopen`), không chạy lại seat blind. Producer claude opus (flagship); reviewer + red-team **gemini-4-argon-high** (họ mới với packet này, cùng họ với nhau); explanation claude fable. Packet đã chốt: `.fgos/assignments/unit-run-1792057330846-367abcd4/producer/2/runs/01/outbox/report-1.md`, sha256 `e243e6d7…ecd1e`. Giải thích: `unit-run-1792060497202-2aed6723/producer`.

| Vòng | Reviewer | Red-team |
|---|---|---|
| 1 | findings: RV3-1 (high), RV3-2, RV3-3 | findings: RT-R1-1 (high), RT-R1-2, RT-R1-3 |
| 2 | **pass**, 0 finding mở; mô hình trạng thái riêng 1,042 trạng thái, 0 lần xoá nhầm | **pass**; mô hình riêng 68,846 trạng thái, 0 lần xoá nhầm (luật vòng 1: 560 lần trên 36,336) |

Kết luận lớn **không đổi** (bác research nguyên trạng, không gộp supervisor, wave 1 Node, Rust mặc định hoãn, OQ1/OQ2 chờ anh). Thứ đã đổi:

- **1a (lỗi reaper xoá home của worker sống):** (i) bind ghi paneId + **socket/endpoint herdr thật** đã dùng + pid binder + boundAt, nối hàm bind/launch-check/post-launch-check từ `bwrap.mjs`/`authority.mjs` qua `transport.mjs` xuống `herdr-round.mjs`, cho **mọi** round confined; (ii) mọi đường xoá phải **claim** (ghi pid + claimedAt) rồi đọc lại, khác thì bỏ; controller **từ chối bind khi home đã quá cửa sổ run**, chỉ launch trong launch-grace ngắn sau bind khi không có claim, **kiểm lại sau launch**, mất home thì đóng pane và fail round; (iii) home đã bind, binder còn sống, được giữ tới `boundAt + max(maxAgeMs, launchGrace + runTimeout + settleGrace)` bất kể herdr trả lời gì; **ND12** mới: claim của reaper đã chết chỉ được reaper sau tiếp quản. Red-team chấp nhận hai chỗ producer cố ý làm khác gợi ý của nó (ghi socket thật; bỏ qua câu trả lời pane khi binder còn sống trong cửa sổ — tránh đua với chính `settleRound` đóng pane trước `prepared.cleanup()`).
- **T1 (RT2-2):** **cấm** quay về writer id chung; mở lại D1 chỉ khi chứng minh được loại trừ giữa các attempt độc lập trên mọi đường lock/claim.
- **1c:** thêm đường thứ ba — herdr pane **không confined** hôm nay không nhận `FGOS_SESSION_ID` nào; phải mint id cả khi không có `launchCommandId`.
- **1f (mới, thay ND2):** T2 đã kích hoạt nhờ bằng chứng mục 10: đóng root ngay sau split đầu; neo split vào pane worker sống; fallback `pane list` lọc theo tab **chỉ cho batch handle**; xoá hẳn `closeIfEmpty`. Hợp đồng tab đổi thành "một tab mỗi batch **khi tab còn pane**": pha tuần tự sau (reviewer/red-team sau producer) mở tab mới cùng nhãn nhóm; test `herdr-spawn-adapter.test.mjs:419-443` phải viết lại. **ALT-TAB1** (pane giữ chỗ) nếu anh muốn một tab xuyên các pha.
- **missing expertise** lên 5 mục (thêm reclaim tài nguyên đồng thời: fencing theo cửa sổ thời gian, tiếp quản claim cũ).

**Giới hạn của `pass`:** chỉ là hợp đồng không còn lỗi bị chỉ ra; mọi kiểm chứng của 1a là **mô hình trừu tượng** (giả định fs atomic, đồng hồ lệch nhỏ hơn launch-grace, endpoint đúng). Packet tự đặt cổng: 1a chưa được gọi là an toàn cho tới khi **S2** (test trên hàm thật `cleanup.mjs`/`authority.mjs`) pass; confidence `markerFixClosure` vẫn medium-low vì bốn luật trước đã bị counterexample chạy được đánh đổ. 1f cần **S3'** (chạy lại qua `createBatchTab` thật trong confinement). Packet viết trước khi S6 và đề xuất Rust-first có trên HEAD, nên OQ1 trong packet vẫn khuyến nghị "a, chạy S6"; S6 nay đã đo (T4 qua có điều kiện), đề xuất "d thu hẹp" chưa được seat nào phản biện.

Explanation (fable) đề nghị bước kế: **(A)** viết S2 thành file test trên hàm thật trong worktree riêng, test-only, chưa chạm code production.

## Câu hỏi còn mở

1. Gate `close`: mời 4 (hoặc 5, tính cả reclaim đồng thời) chuyên môn còn thiếu, hay không (`[]`)?
2. Có reopen synthesis để xử lý RT2-1/RT2-2 ngay không?
3. OQ1: a / b / c / d, hay chờ S6?
4. OQ2: a / b / c?
