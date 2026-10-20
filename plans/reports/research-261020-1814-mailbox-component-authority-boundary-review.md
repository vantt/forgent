# Rà soát quyền hạn và ranh giới thành phần: draft Agent Mailbox

Ngày: 2026-10-20. Phạm vi: desk research, chỉ đọc. Đối tượng: `docs/platform/agent-mailbox/spec.md` (draft 582 dòng, chưa ký). Không có cờ `--yagni`. Phần "văn bản đề xuất" viết bằng tiếng Anh vì sẽ được controller dán nguyên vào spec/bảng tiếng Anh; phần còn lại bằng tiếng Việt.

## 1. Tóm tắt

**Kết luận: chưa nên ký nguyên trạng. Ký được sau khi áp dụng 6 sửa đổi văn bản (B1-B6), không cần thành phần mới nào.** Ý tưởng cốt lõi (một component sở hữu quyết định "đặt tin vào ngữ cảnh của đầu CLI") là hợp lệ về quyền hạn: không có chủ sở hữu hiện tại cho "tên đầu → generation → hộp thư → khung peer". Vấn đề là spec **tự dựng lại** 5 thứ đã có chủ, và **bỏ sót** 2 ranh giới đang chạy.

Phát hiện chính, xếp theo mức nghiêm trọng:

1. **B1 - Tri thức theo CLI bị chia đôi sai.** Spec đặt `adapters/{claude,codex,agy}.rs` trong crate mailbox, trong khi `fgos-agent-protocol` đã giữ profile terminal theo CLI (`terminal/{claude,codex,agy,pi,omp}.rs`) và `deliver_brief`. Phần gõ tín hiệu + vị từ composer-rỗng + ghim version của màn hình thuộc agent-protocol. Mailbox chỉ giữ cái agent-protocol từ chối giữ (dạng payload hook, `codex queue`, socket Claude). Có một bẫy cụ thể: `submit_by_prompt_door` của codex đi qua `herdr agent prompt`, mà chính spec đã đo là **cướp focus**.
2. **B2 - Spec nói thẳng với herdr** (`herdr agent list`, pane id thô, "tmux pane hoặc bare tty") trong khi terminal-control là cửa theo **key**, chỉ có driver herdr, và ranh giới đã chốt là "người gọi giữ key, không bao giờ giữ pane". Đường đúng là `attach(key, pane)` + `inspect(key, detail)`. Hệ quả chưa được spec tính: mỗi đầu để lại một allocation record không ai giải phóng.
3. **B3 - Tự chế định danh tiến trình.** Binding `(pid, process start time, incarnation)` trùng chức năng `fgos-process` (`Record` + `judge`) nhưng thiếu `bootId` và `pidNs`: sau reboot, cùng pid + cùng start-tick sẽ bị coi là cùng đầu, mail cũ phát lại cho người lạ. Thêm: chưa ai nói "pid của đầu" là pid nào (hook là tiến trình con; session-identity trả về gốc terminal cho agy, không phải CLI).
4. **B4 - Worker do runner khởi động cũng thành người nhận.** Hook cài ở mức project nên worker pane `att-*` cũng đăng ký. Gõ nudge vào pane đó là "actor thứ hai" trên pane mà supervisor đang lái (vi phạm ADR-011 / đề xuất contact 8.4), và mail chèn giữa Unit đổi thứ worker thấy so với envelope. Cần loại `att-` khỏi địa chỉ (dùng `ATTEMPT_PREFIX` của session-identity, không so chuỗi riêng).
5. **B5 - Ranh giới confinement thủng.** Worker bwrap `--ro-bind / /` và `FGOS_STATE_ROOT` được ghim cho mọi worker; `BLIND_HIDDEN_ROOTS` không có thư mục mailbox. Worker `blind` vẫn đọc được toàn bộ thân tin và registry của mọi phiên. Spec §15.7 chỉ nói chiều ngược lại ("lộ state root qua resource").
6. **B6 - Hai cửa hook.** `fgos hook <kind>` đã là cửa (installer, `commandIsKind`, probe doctor, `handleHook`). Spec thêm cửa thứ hai `fgos mailbox drain --for-hook`. Theo L10, nên làm `hook mailbox` là một kind của cửa hiện có, được host Rust phục vụ native (tiền lệ `identity` ở `apps/fgos/src/main.rs:172`). Cách này cũng làm nhanh luôn các hook cũ đang trả 171-223 ms mỗi lần.
7. **Hạng trung (B7-B12):** record chưa khai L1/L7 và phải nghĩ ra `repoKey` dù đã có nhà repo-scope; quota "communication authorization" chưa có chủ trong repo và spec nên chừa cổng thay vì ôm; "Receipt" trùng tên 4 thứ khác; claim "không có prior art" sai (có đề xuất contact + CTR006 + ADR-011); `peer-input.md` vào lớp always-loaded và trùng với text của frame; manifest **không** diễn đạt được crate Rust (trả lời câu hỏi 7).

Quyết định cần chủ sở hữu: mục 8 (5 câu).

## 2. Cách làm và giới hạn

Đọc: spec đủ 582 dòng; `component-boundary.md`; `docs/platform-foundations.md` (L1, L3, L8, L10); `architecture-manifest.json` + `test/architecture.test.mjs`; mã nguồn `session-identity`, `terminal-control` (core, driver herdr, contract port), `agent-protocol` (`terminal/*.rs`, `port.rs`), `run-supervisor/supervise/terminal.rs`, `process/facts.rs`, `holder-lock` (registry, `state_root.rs`, `scope.rs`), `durable-file`; Event Store spec §2-3; vision V-011/V-013 và dòng 317; ADR-011; `docs/routing-handoff-contract.md`; confinement-authority + `resources.mjs` + `adapters.mjs`; `agent-hooks.mjs`, `registrations.mjs`, `instruction-registry.mjs`; `host-runtime/catalog.rs`; `main.rs`.

**Không kiểm chứng được** (không chạy CLI thật, không gọi model): (a) env của tiến trình hook có `CLAUDE_CODE_SESSION_ID`/`CODEX_THREAD_ID` không (báo cáo 261020-1457 dòng 96 cũng ghi "chưa đo"), tức khóa phía hook và phía `send` có trùng không; (b) `herdr agent prompt` cướp focus: lấy từ đo của chính spec §7.2 rule 4, tôi chỉ xác nhận mã đi qua lệnh đó (`herdr.rs:508-516`); (c) `attach` record của pane đã chết hiện ra thế nào trong `reconcile-scan`/doctor `terminal-allocations`; (d) host Rust có thể cho `hook mailbox` chạy native và chuyển các kind khác sang legacy-node hay không; (e) resolver `.fgos` chính (main checkout) bằng Rust; (f) fragment `components/<c>/instructions/` chỉ được chiếu khi component được cài hay chiếu vô điều kiện.

## 3. Bảng quyền hạn

Verdict: **delegate** = spec giao đúng chủ; **duplicate** = spec dựng lại thứ đã có; **cross** = spec chạm quyền người khác không qua cửa; **new** = chưa có chủ, mailbox là chủ hợp lệ.

| # | Quyết định trong spec | Chủ hiện tại (component, file) | Vai trò mailbox | Verdict | Bằng chứng |
|---|---|---|---|---|---|
| 1 | Writer id của người gửi/nhận | session-identity (`resolve.rs` ENV_ORDER; `attempt.rs` `att-`) | gọi qua route/crate | delegate (đúng) | spec §5.1.1 dòng 185; `resolve.rs:9-12` |
| 2 | Nhận ra worker do runner khởi động | session-identity `ATTEMPT_PREFIX` (`attempt.rs`) | không nói gì | **thiếu** (B4) | `adapters.mjs:112-137` bỏ session env, đặt `FGOS_SESSION_ID=att-...` |
| 3 | "Registry" của đầu (tên → binding → generation) | **không có** (`sessions.json` là registry worktree-session của `src/runner/session.mjs`, không phải đầu CLI) | mailbox sở hữu | **new** (hợp lệ) | `session.mjs:1-30`; session-identity spec dòng 32; báo cáo 261020-1457 dòng 23 |
| 4 | Còn sống hay đã chết / pid bị tái dùng | process (`facts.rs` `judge`, `Record` có host, bootId, pidNs, pid, startTime) | tự so `(pid, start time)` | **duplicate, thiếu bootId** (B3) | `facts.rs:19-30,206-240`; spec §5.1 dòng 158 |
| 5 | Pane của đầu, gõ phím, đọc màn hình, trạng thái | terminal-control (cửa theo key; `attach/send/read/inspect`) | gọi `herdr agent list` + pane thô | **cross** (B2) | port contract `operations`; component-boundary dòng 77; spec §4 sơ đồ, §6.3 |
| 6 | Trạng thái `busy/idle/blocked` | herdr detector qua terminal-control `inspect` (ADR-011: "chỉ nói an toàn để gõ hay chưa") | `SessionObservation` | delegate nếu qua `inspect` | ADR-011; `port.rs` `Inspection`; `core` `inspect_parts` |
| 7 | `composer` rỗng/không | agent-protocol (profile theo CLI, `draft_still_in_composer`, `Inspection.prompt_text`) | đặt vị từ trong profile | delegate (đúng, spec §6.3) | `common.rs:187-210`; spec dòng 292 |
| 8 | Gõ một dòng vào pane + xác nhận đã nộp | agent-protocol `Terminal::deliver_brief` (đã gõ-và-xác-nhận cho 5 CLI) | `adapters/agy.rs` tự gõ | **duplicate** (B1) | `terminal/mod.rs:381-415`; `terminal.rs:665` |
| 9 | Kiến thức theo CLI: exit cmd, Enter gap, trust marker, prompt door | agent-protocol `Profile` | bảng `adapters.v1.json` + `adapters/*.rs` riêng | **duplicate một nửa** (B1) | `terminal/mod.rs:186-198`; spec §4.1 |
| 10 | Kênh wake không phải terminal (`codex queue`, socket Claude) | không ai (agent-protocol "không dựng argv", `mod.rs:1-6`, spec agent-protocol §2) | mailbox adapter | **new** (hợp lệ) | agent-protocol spec §2 |
| 11 | Dạng payload hook vào/ra theo CLI | rải: installer (dạng file), `handleHook` (`--format=agy`) | adapter mailbox (đầu ra drain) | new, nhưng là chỗ thứ 3 biết (B6) | `agent-hooks.mjs`; `bin/fgos.mjs:4911` |
| 12 | Cài hook, giữ hook người dùng, probe doctor | `src/setup/agent-hooks.mjs` (+ `registrations.mjs`) | thêm kind `mailbox` | delegate (đúng) | spec §7.1; `agent-hooks.mjs:1-12` |
| 13 | Cửa chạy hook (`fgos hook <kind>`) | `bin/fgos.mjs` `handleHook` (legacy-node), `ALLOWED_HOOK_KINDS` | thêm cửa `fgos mailbox drain` | **duplicate cửa** (B6) | `bin/fgos.mjs:4911-4930`; installer regex `hook <kind>` |
| 14 | Ghi nguyên tử file snapshot | durable-file `replace_durably` / `install_once` | dùng | delegate (đúng) | `durable-file/lib.rs:123` |
| 15 | Mutex loại trừ | holder-lock + lock registry (một hàng mới) | dùng, thêm hàng | delegate; hàng phải khớp `scope` và đường | `lock-registry.v1.json` (scope ∈ repo/run/machine) |
| 16 | Nơi đặt record, khóa dự án | state root (`state_root.rs`) hoặc `.fgos/runtime/` (gitignore dòng 23); Event Store có `storeId`, `machineId` | tự nghĩ `repoKey` | **new, chưa khai L1/L7; chọn nhà chưa tối ưu** (B7) | spec dòng 185, 296; `.gitignore:23,42` |
| 17 | Record có phải "kho thứ hai" so với Event Store | Event Store: claims/leases là runtime state ngoài store | record snapshot + thân tin | **không phải kho thứ hai** nếu khai là runtime state | Event Store §2 (bảng quyết định), §3 "không sở hữu" |
| 18 | Quota gửi, vòng lặp, wake | Vision dòng 317 "communication authorization and loop bounds"; hiện thực gần nhất: `anti-loop.mjs` (visit Work), `maxRounds` (`case-admission-port.mjs:72`), AdmissionPort của Workflow | ôm toàn bộ | **cross một phần** (B8) | vision.md:317; port ở `case-admission-port.mjs:1-18` |
| 19 | "Receipt" cho người gửi | ADR-011: receipt là artifact **do người nhận ghi**; supervisor `receipt.json`, Event Store `receipt.rs`, Workflow receipts | câu do bên gửi sinh | **trùng tên, khác nghĩa** (B9) | ADR-011 "A receipt is an artifact the receiver wrote" |
| 20 | Hợp đồng agent↔agent + ranh giới tin cậy | `docs/routing-handoff-contract.md` (CTR006; AGENTS.md DoD câu 3) | khung peer, trust class | **thiếu liên kết** (B10) | AGENTS.md; contract dòng 54-88 |
| 21 | Đưa quy tắc peer-input vào ngữ cảnh | instruction registry + projection → `AGENTS.md` (L8: always-loaded) | `core/instructions/peer-input.md` + text trong frame | **trùng nguồn text** (B11) | `instruction-registry.mjs:2-8`; spec dòng 258 |
| 22 | Worker bị bwrap: đọc/ghi state | Confinement Authority (`BLIND_HIDDEN_ROOTS`, `--ro-bind / /`) | không nói | **thủng** (B5) | `resources.mjs:26-32`; `confinement-authority.md:1196-1210` |
| 23 | Tín hiệu quan sát, ngưỡng, exit≠0 | Observe (`ObservationSource`); doctor registry | `status` + `mailbox.status.thresholds.*` | song song nhẹ; hoãn được | `metrics_sources.rs`; AGENTS.md "Install/setup/doctor gate" |
| 24 | Đăng ký verb vào host | host-runtime catalog / route trong `main.rs` | "thin wiring" | chưa nêu cửa nào | `catalog.rs`; `main.rs:165-180` |
| 25 | Config key `mailbox.*` | config registry `registerConfigDefault` | đăng ký | delegate (đúng) | spec §12 |
| 26 | Quyết định "ai được nói với ai" | chưa có cho kênh sống (Workflow admission chỉ cho Unit/case) | mailbox cho mọi đầu cùng project | **new, nên chừa cổng** (B8) | `case-admission-port.mjs` |

## 4. Verdict từng nghi vấn

### (a) Tri thức theo CLI và `deliver_brief`
Agent-protocol đã có cái spec định xây. `Profile` (`terminal/mod.rs:186-198`) giữ exit command, Enter gap, `submit_by_prompt_door`, trust marker; `deliver_brief` (`mod.rs:381-415`) gõ, nhấn Enter, nhận ra draft còn kẹt, gõ lại có giới hạn, rồi xác nhận. Đó chính là "gõ một dòng và biết nó đã được nộp" mà §7.2 mô tả. Runner dùng nó (`terminal.rs:665`) và ADR-011 chọn đúng mô hình "con trỏ một dòng, nội dung ở file", trùng mô hình nudge của mailbox.

**Ai giữ tri thức theo CLI:** chia theo loại, một chủ mỗi loại.

| Loại tri thức | Chủ |
|---|---|
| Màn hình, gõ, composer, trust dialog, fixture + ghim version của màn hình | agent-protocol (đã có) |
| Hook payload vào/ra theo CLI, `codex queue`, socket Claude, đầu của CLI là pid nào, version của đầu | mailbox adapter (chưa ai có; agent-protocol từ chối "dựng argv") |
| Đường file và hình dạng cài hook | installer `agent-hooks.mjs` (đã có) |

**Nudge gõ có dùng lại `deliver_brief` không: có, với 3 điều kiện** mà spec phải ghi:
1. **Không cướp focus.** `Terminal::deliver_brief` chọn `submit_brief` khi profile `submit_by_prompt_door` (codex: `true`, `codex.rs:11`), và terminal-control biến `submit:true` thành `herdr agent prompt` (`herdr.rs:508-516`), lệnh mà §7.2 rule 4 đã đo là chuyển focus. agy là `false`, nên nudge agy hôm nay an toàn; nhưng cần một tham số "không dùng prompt door" trong `deliver_brief` trước khi codex/pi/omp dùng đường gõ. Thay đổi này thuộc agent-protocol.
2. **Cần phép kiểm một nhịp, không chờ.** `await_ready` (`mod.rs:300`) chờ tới `ready_ms`; mailbox cần một verdict composer/state tức thời. Vị từ composer-rỗng nên là hàm thuần có tên chung (`composer_state(screen, inspection)`), không có chữ "mailbox", vì agent-protocol không được biết tầng trên. Dữ liệu đã có: `Inspection.prompt_text` (`port.rs`) là "composer text mà luật khớp thấy"; agy/pi/omp không có luật composer (agent-protocol spec §5.1 dòng "Ready"), nên vị từ agy là việc mới thật, như spec nói.
3. **Mailbox tự viết wiring `AgentIo` trên terminal-control.** Agent-protocol không phụ thuộc terminal-control (spec agent-protocol §8), `TermIo` của supervisor (`terminal.rs:450-520`) là private và dính `sup`. Mỗi consumer tự nối là đúng thiết kế (agent-protocol spec §2: "supervisor wires AgentIo"); chấp nhận ~60 dòng, không tách crate chung (xem câu hỏi 4 nếu muốn DRY nghiêm).

Hệ quả cho spec: `adapters/agy.rs` biến mất (chỉ còn lời gọi `adapter_for("agy")`); `adapters.v1.json::tested_against` chỉ ghim hành vi hook/queue; ghim version của màn hình ở lại trong fixture agent-protocol (`contracts/fixtures/terminal/<cli>/*.insp.json`). Hai ghim, hai chủ, nói rõ.

### (b) Presence vs terminal-control và `visibility-session.mjs`
- `SessionObservation.state` = `Inspection.state`/`inspect(key, detail)` của terminal-control (ADR-011: "chỉ nói an toàn gõ hay chưa", đúng câu hỏi nudge hỏi). Delegate được, không cần nguồn "herdr agent list".
- `list()` không có phép tương ứng trong terminal-control (port chỉ có `allocate, attach, launch, send, read, inspect, release, label, capabilities, reconcile-scan`, không có enumerate). `list` phải đến từ registry của mailbox + `judge`, không từ herdr.
- `visibility-session.mjs` là `visibility.json` theo **run** (pane, agent_session, ai đang lái), "volatile, không phải bằng chứng"; không phải registry đầu. Nhưng nó đã dùng `agent_session` của herdr để ghép (báo cáo 261020-1457 dòng 9): đó là nguồn thứ 5-6 cho "ai đang sống". Mailbox không nên thêm nguồn thứ 7 sao chép dữ kiện; chỉ lưu `{tên, khóa, generation, Record, key terminal}`, còn trạng thái, version, socket đọc sống.
Verdict: **delegate qua `inspect`; bỏ `herdr agent list` khỏi §4, §6.3.**

### (c) Đăng ký đầu vs `sessions.json` và writer identity
`sessions.json` **không** là registry đầu: là danh sách worktree-session do `fgos session` tạo (`session.mjs:1-30`), session-identity chỉ đọc nó để gắn `source: registry` (`resolve.rs:17,78`) và spec session-identity ghi "Does not own: Writing sessions.json" (dòng 32). Vậy chưa có registry đầu; mailbox là chủ hợp lệ của nó. Chỗ phải sửa:
- Chữ "session registry" ở §6.2 dòng 278 mơ hồ giữa 3 nghĩa (worktree-session, session id, file phiên của CLI `~/.claude/sessions/<pid>.json`). Đổi thành "the CLI's own session file".
- Writer id lấy từ session-identity (đúng) nhưng với agy id = **gốc terminal** chứ không phải đầu (`resolve.rs` luật cây "tổ tiên cao nhất có tty"; báo cáo 261020-1457 dòng 12 "terminal, không phải đầu"). Pid "của đầu" phải do adapter phía hook tìm (Claude: file phiên theo pid). Spec §5.1 phải nói rõ ai tính tuple này.
- Khóa hook-side và send-side có trùng không là **chưa đo** (mục 2a).

### (d) Record snapshot vs durable-file, holder-lock, Event Store local scope
Không phải kho thứ hai theo nghĩa Event Store. Event Store §2 đã quyết "Claims and leases are runtime state, outside the event store" và §3 "không sở hữu claims, leases, worker slots"; snapshot có trạng thái in-flight, token, generation là cùng loại runtime state. Lý do spec bác scope `local` (cần cache dẫn xuất + thêm phụ thuộc) chấp nhận được. `replace_durably` có thật (`lib.rs:123`); thân tin bất biến nên dùng `install_once` (không ghi đè). Còn thiếu:
1. **L1/L7:** spec chưa khai "state" (L1) và mức bền "máy này, mất được" (L7). Thêm một câu.
2. **Nhà của record và `repoKey`:** spec thừa nhận không có `repoKey` (dòng 185; tôi grep Rust cũng không có). Trong khi `.fgos/runtime/` (gitignore `:23`) đã là nhà runtime state theo project, và `sessions`, `observe`, `reconcile` là khóa `scope: repo` rank 80 ở `<fgosDir>/locks/`. Chọn nhà repo-scope bỏ luôn việc phát minh khóa, khớp "chỉ cùng project" và dùng đúng loại hàng registry hiện có. Chi phí: cần resolver `.fgos` chính (main checkout) trong Rust; chỉ thấy tiền lệ Node (`resolveMainCheckoutRoot`) và `init.rs:733` (git-common-dir) trong Rust, chưa kiểm tra. Phương án B (state root + khóa dẫn xuất) buộc phải định nghĩa khóa. **Xếp hạng: A = repo-scope `<fgosDir>`; B = state root.** Nếu chọn B, hàng lock phải là `scope: machine` với đường có tham số (tiền lệ `provider-account/<provider>/<account>.lock`), không phải `repo`.
3. Thêm hàng vào registry là sửa component holder-lock: spec holder-lock phải liệt kê hàng mới (bảng component-boundary nói "No new lock row" cho đợt cutover, không cấm hàng sau này).

### (e) "Communication authorization and loop bounds"
Vision dòng 317 liệt kê nó là trách nhiệm foundation. **Hôm nay không có hiện thực cho kênh agent sống**: gần nhất là `anti-loop.mjs` (đếm lượt Work), `maxRounds` của pattern reviewed (`case-admission-port.mjs:72`), và AdmissionPort do Workflow hiện thực (kiểm "hoạt động này có hợp lệ lúc này không", `seatLaunchCeiling`). Không cái nào phủ tin giữa hai đầu.
Phân tách đề xuất:
- **Mailbox sở hữu hạn mức bảo vệ kênh** của chính nó: size, queue cap, TTL, offer cap, cửa sổ trùng lặp, loop guard, lifetime cap, wake quota. Đây là đặc tính nội tại của việc giao tin; giá trị ở config registry như spec.
- **Mailbox không sở hữu "ai được nói với ai" và "ngân sách của một case"**. Khi sau này một case/Unit cần gửi, ngân sách phải đến từ khung đã duyệt (AGENTS.md ưu tiên 2: "tự quyết trong khung đã duyệt") qua cổng, theo đúng mẫu `CaseAdmissionPort`: component thấp khai cổng, Workflow hiện thực, không import ngược. Spec chỉ cần **chừa** một input policy duy nhất (số + cho-phép/từ-chối-kèm-lý-do), không xây gì thêm.
- Câu V-013 "only this component decides whether, when and how a message enters" (`vision.md:287`) không được hiểu là lấn dòng 317. Cần một câu làm rõ trong spec (không sửa V-013, đúng cam kết của chủ sở hữu).

### (f) ADR-011: receiver ghi receipt vs mailbox trả receipt cho người gửi
Không mâu thuẫn về nghĩa, **mâu thuẫn về tên**. ADR-011: receipt = "artifact the receiver wrote", và chỉ cái đó chứng minh việc đã xảy ra. Mailbox slice 1 nói thẳng recorded/offered/handled là ba thứ khác nhau và không nhận handled (§5.2), tức tôn trọng tinh thần ADR. Nhưng "Receipt" ở mailbox là một câu do tiến trình **gửi** sinh ra về độ trễ dự kiến. Cùng chữ với `receipt.json` của supervisor, `receipt.rs` Event Store, receipts của Workflow ledger. Đề xuất đổi thành **"delivery report"**. Khi `acked` quay lại (§15.1), ack phải do **người nhận** ghi (reply = ack đã nằm trong spec); chính lúc đó nó mới là "receipt" theo ADR-011. Ghi trước câu này vào §15.1.

### (g) Hook route vs các kind của installer
Installer hôm nay: chỉ `PreToolUse`, hai kind (`HOOK_KINDS`), nhận diện entry của mình bằng regex `\bhook <kind>( --format=agy)?\s*$`; `handleHook` ở `bin/fgos.mjs:4911` kiểm `ALLOWED_HOOK_KINDS` rồi chạy legacy-node. Spec đã tự đo: cửa này 171-223 ms p50 vì hai lần khởi động Node, nên đề xuất cửa riêng `fgos mailbox drain`. Theo L10 ("mở rộng QUA cửa") và nguyên tắc "một cửa", hướng đúng là: **`fgos hook mailbox --cli <c> --event <e>`**, host Rust phục vụ native riêng kind này và chuyển các kind khác sang legacy-node như hôm nay (tiền lệ chuyển đường trong `main.rs:165-180`, `identity`). Lợi: regex `commandIsKind` không phải đổi hình dạng; probe doctor và `--format` có chỗ chung; không có hai cửa hook. Khi `dispatch-decide` được port sau này, nó đi cùng cửa và hưởng cùng tốc độ. **Chủ sở hữu hook installation = installer** (đúng spec §7.1); **chủ sở hữu cửa chạy hook = nhánh `hook` của host**, không phải verb mailbox. Rủi ro chưa đo: host có tách nhánh native cho một kind trước khi exec Node được không (S0 phải đo, thay cho "nên có sibling route").
Hai điểm phụ: (i) installer ghi vào `.claude/settings.json` đã track trong git (`git status` đang `M`), nên hook mailbox sẽ áp cho mọi clone và mọi worker pane của project, đây là gốc của B4; (ii) probe `isShimRunnable` chỉ chạy `hook dispatch-decide`; kind `mailbox` cần probe riêng với input vô hại.

### (h) `core/instructions/peer-input.md` và registry
Registry (`instruction-registry.mjs:2-8`) đọc `core/instructions/`, `components/<c>/instructions/`, `domains/<d>/instructions/`; projection ghi vào `AGENTS.md` managed block, tức lớp **always-loaded** (L8). Hai vấn đề:
1. **Hai nguồn cho cùng một lời trust**: dòng cuối của frame (§5.5, trong lõi Rust/contract) và `peer-input.md`. Vi phạm "một nguồn sự thật".
2. **Đặt sai nhà theo L8.1/L8.2**: quy tắc chỉ có nghĩa khi một frame đến, và frame đã tự mang mức tối thiểu để tuân thủ ("transport rides with the order"). Đưa vào `core/instructions` làm mọi phiên của mọi project tốn token dù không cài mailbox.
Đề xuất: nguồn text duy nhất = contract mailbox (lõi render frame từ đó). Nếu vẫn muốn một dòng ở sheet đứng, đặt ở `components/agent-mailbox/instructions/peer-input.md` (authority `component`) tham chiếu thay vì chép, và thêm anchor-suite assertion (L8.3). Chưa kiểm chứng được việc fragment component có chỉ chiếu khi cài component hay không (mục 2f).

### (i) Worker bị bwrap
- Đọc: worker `--ro-bind / /`, `FGOS_STATE_ROOT` được ghim cho mọi worker (`adapters.mjs:115-155`) nên chúng thấy đúng state root thật. `BLIND_HIDDEN_ROOTS` chỉ liệt kê `assignments`, `workflow-runs`, `dispatch-runs`, thư mục socket herdr, confinement temp root (`resources.mjs:26-32`). Mailbox root không có: worker `blind` đọc được thân tin của mọi phiên, trái ý định "blind" (`routing-handoff-contract.md:85-88`: không đọc run state của peer).
- Ghi: `--ro-bind /` nên worker confined không ghi được snapshot: không `send`, không đăng ký; hành vi an toàn nhưng phải **nêu** thay vì để rơi ra lỗi. Worker không confined (same-user trust invariant, `routing-handoff-contract.md:60-64`) ghi được trực tiếp → giả `from`; khớp tuyên bố "from là attribution, không phải authority" (§5.1), nên ghi rõ đây là ranh giới tin cậy, không phải sandbox.
- Gửi từ worker blind cũng không với tới herdr (socket bị che), nên nudge gõ từ họ là không thể; đã nằm gọn trong "worker không phải người gửi ở slice 1".
Verdict: **ranh giới mailbox không sống sót nếu không sửa dữ liệu `BLIND_HIDDEN_ROOTS`** (B5).

### (j) Chồng lấn khác
- **Tên "session" trùng ba nghĩa** (worktree-session, session id của session-identity, phiên CLI); spec §3 chỉ định nghĩa nghĩa thứ ba. Thêm một dòng phân biệt.
- **Tiền lệ contact chưa được trích:** `docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md` §8.3-8.4 (Discussion) đã thiết kế: con trỏ một dòng qua transport, hook push tại turn boundary, idempotencyKey, "chỉ gửi khi idle|done", một actor giữ lease. Nó **chưa được chấp nhận**, nên không ràng buộc, nhưng spec §13 "Nothing to reuse and nothing to collide with" là sai, và §15.4 "steer events by unitRunId" chồng đúng vùng này.
- **Doctor:** AGENTS.md "Install/setup/doctor gate" bắt mọi thư mục/phụ thuộc mới phải đăng ký vào doctor. Quyết định 2026-10-19 "chưa thêm check" có trước thiết kế này và spec Q5 đang để mở. `status` thoát ≠ 0 theo ngưỡng là một check mang tên khác. Tối thiểu: check thư mục + probe hook chạy được (gần như miễn phí vì `isShimRunnable`).
- **Observe:** `status` tự tính tín hiệu là chấp nhận được cho slice 1; sau này mailbox có thể là một `ObservationSource` (mẫu `RunResultSource`). Không đổi gì bây giờ.

## 5. Vi phạm ranh giới hiện có và văn bản sửa

Văn bản dưới đây là đề xuất, controller áp dụng; tôi không sửa spec, `component-boundary.md` hay manifest.

### B1 - Tri thức theo CLI (spec §4.1, §4 rule 4, §6.3, §7.2 rule 8, §13)
Thay hàng "Core, local record, ports, adapters" của bảng §4.1 và bổ sung rule 4:

> | Core (pure, no I/O) | Rust | `packages/mailbox/rust/core` (crate `fgos-mailbox-core`: envelope, state machine, policies, framing; dependencies: serde only) |
> | Record, ports, adapters | Rust | `packages/mailbox/rust/store` (crate `fgos-mailbox`): `record.rs`, `ports.rs`, `adapters/{claude,codex,agy}.rs`. An adapter holds only what no other component holds: the hook payload shape of its CLI, a non-terminal wake channel (`codex queue`, the Claude socket), and how to find the head process and its version |
>
> Rule 4 addition: *Per-CLI terminal knowledge is not duplicated here.* Typing one line and confirming it was submitted is `fgos_agent_protocol::terminal::Terminal::deliver_brief` through `adapter_for(cli)`; the empty-composer predicate is a pure function `composer_state` in the agent-protocol profile of that CLI, named without reference to the mailbox. The mailbox supplies an `AgentIo` over terminal-control (key-addressed) and never reads a screen or types by another path. The typed nudge must not use the prompt door: `deliver_brief` gains a focus-neutral option (the prompt door of terminal-control is `herdr agent prompt`, which moves focus, section 7.2 rule 4), and a CLI whose profile sets `submit_by_prompt_door` gets no typed nudge until that option exists. Screen fixtures and their version pin stay in `packages/agent-protocol/contracts/fixtures/terminal/<cli>/`; `adapters.v1.json::tested_against` pins only the hook and queue behaviour.

Agent-protocol spec cần thêm: mục "composer state" (`empty | not-empty | unknown`, hàm thuần trên `screen` + `Inspection`) và tham số focus-neutral của `deliver_brief`; không thêm phụ thuộc nào.

### B2 - Terminal theo key (spec §4 sơ đồ, §5.1, §6.3 nguồn)
Thay đoạn đầu §6.3 "Sources" và câu "native handle ... agy herdr pane" của §5.1:

> A head in a terminal is bound to a terminal-control **key**, never to a pane id. At registration the hook calls `attach(key, pane)` (the pane id comes from the pane's own environment) and stores only the key; the key matches `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$` and names one pane for its whole life, so a new generation uses a new key. `Presence.observe` is `inspect(key, detail=true)` of terminal-control; there is no `herdr agent list` and no enumeration by the mailbox other than its own registry. The first slice supports the drivers terminal-control declares (herdr on Linux and macOS); a tmux pane or a bare tty has no typed channel and the tier falls to `turn` or `pull`. Each `attach` publishes one allocation record; the mailbox releases the key at its lazy sweep when the head is judged dead (release of an attached slot only removes label and link and never closes the pane).

Terminal-control spec cần: xác nhận `attach` dùng cho pane do người mở là cách dùng được (spec §3 chỉ nêu `/fgOS:terminal`), và chủ sở hữu quyết dọn record của pane đã chết (câu hỏi 3). Hiện `reconcile-scan` chỉ báo cáo, không đóng (spec terminal-control §11).

### B3 - Danh tính tiến trình (spec §5.1 "Registration and generation")
Thay "(process start time and the pane's own incarnation where the driver reports one)":

> The binding carries the head's process identity as an `fgos_process::Record` (host, boot id, pid namespace, pid, start time) and "is this head gone" is `fgos_process::judge` (`packages/process/rust/src/facts.rs`); the mailbox compares no pid or start time itself. A generation bumps when the registering head's `Record` differs from the stored one or when the stored one is judged `Dead`. `Unknown` never bumps and never releases an address. Which process is the head is decided by the adapter of its CLI (the CLI's own session file records pid, start time and version where it has one); the hook's own pid is never used, and the terminal root that session-identity returns when no env id exists is not the head.

### B4 - Worker của runner không phải người nhận (spec §1 "Out of scope", §5.1, §6.1 `drain`)
Thêm vào §1 "Out of scope for good" và §5.1 "What holds an address":

> A head started by the runner (writer id carrying `fgos_session_identity::ATTEMPT_PREFIX`, `att-`) is neither registered nor addressable: its pane is driven by its run supervisor, and a second actor typing into it, or mail entering it between brief and result, would change what the Unit run saw. `drain` for such a head prints nothing, `list` omits it, and `send` to it is refused as an unknown address. Steering a Unit run is the runner's decision (section 15.4). The prefix test is a function exported by session-identity, not a string comparison in this crate.

Session-identity cần thêm một hàm công khai `is_attempt_writer_id(&str)` (dùng `ATTEMPT_PREFIX`); không đổi hành vi nào khác.

### B5 - Confinement (spec §15.7, §8)
Thay câu về confinement trong §15.7 và thêm vào §8:

> The mailbox root is added to `BLIND_HIDDEN_ROOTS` (`src/runner/dispatch/confinement/resources.mjs`) in the same change that creates it, and to `docs/specs/confinement-authority.md` section 9.2. A confined worker neither reads nor writes mailbox state (the write fails on the read-only root); an unconfined worker can write the snapshot directly, so `from` stays attribution only (section 5.1). Mailbox state is not exposed to workers through a registered resource in the first slice.

### B6 - Một cửa hook (spec §4 sơ đồ, §4.1 hook entry, §7.1, §16 câu 9)
Thay "The hook entry is the native selector `fgos mailbox drain --for-hook <cli> --event <e>`":

> The hook entry is `fgos hook mailbox --cli <cli> --event <e>` through the project shim: a new kind of the existing `fgos hook` door, served natively by the Rust host (the legacy-node `handleHook` keeps `dispatch-decide` and `decision-question`). The installer recognises it with its existing `commandIsKind` rule, no second command form exists, and the doctor probe runs this kind with benign input. `fgos mailbox send|inbox|list|status` are the user verbs; `drain` is not a verb. S0 measures whether the host can route this kind natively before exec of the Node payload.

### B7 - Record: khai loại và chọn nhà (spec §6.4 đầu đoạn)
Thêm vào đầu §6.4:

> **Class.** Runtime state of this machine (L1: state, overwritten by reality; L7: this machine only, lost on a lost machine without harm), in the same class as claims and leases, which the Event Store spec §2 and §3 keep outside the event store. It is not a second store: it holds no event truth and is never replayed. **Location (recommended).** `<fgosDir>/runtime/mailbox/` with a repo-scope lock row `mailbox` (`<fgosDir>/locks/mailbox.lock`, kind mutex, rank 80), like `sessions`, `observe` and `reconcile`; the project is the `.fgos` of the main checkout and no `repoKey` exists. If the owner chooses the state root instead, the key must come from an existing resolver and the lock row is `scope: machine` with a parameterised path.

### B8 - Cổng thẩm quyền (spec §5.3 đầu đoạn; một câu cho §2)
> The limits of this table protect the mailbox's own channel and are defaults owned here. They are not communication authorization: who may address whom, and the budget a case or a Unit may spend on messages, belong to the coordination foundation (Vision, Foundation Responsibilities) and reach this component through one policy input (`allow` or `deny(reason)`, plus a send budget), the same shape as the Execution Core's admission port. In the first slice the input is absent and every head of the project may address every other. V-013 does not narrow that foundation responsibility.

### B9 - Tên (spec §3, §6.1, §5.1 trường receipt, §15.1)
Đổi "Receipt" thành "Delivery report" ở §3, §6.1, §6.2 và các chỗ dùng; thêm vào §15.1: *"`acked` is written by the receiver (a reply counts); that, not the delivery report, is the receipt in the sense of ADR-011."*

### B10 - Prior art và hợp đồng agent↔agent (spec Related, §13 đoạn "Prior art")
Thay đoạn "Prior art" của §13:

> Prior art: `git log -S mailbox` finds this work and the retired coordination engine (`2180b4e72`). Design prior art that is not accepted architecture: `docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md` sections 8.3-8.4 (contact as a one-line pointer, hook push at a turn boundary, one actor per pane) and `docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md` section 4.6 (defer a mailbox until a real consumer exists). Contract touched: `docs/routing-handoff-contract.md` (agent-to-agent trust boundary); the `peer` class and the frame of section 5.5 are a second agent-to-agent channel and that contract gets a pointer to this spec in the same change.

Thêm `docs/routing-handoff-contract.md` và `docs/architect/agent-coordination/decisions/ADR-011-...md` vào Related.

### B11 - Nguồn text duy nhất (spec §4.1 hàng "Instruction text", §5.5 đoạn "The instruction source")
> The frame text, including its trailing instruction lines, is rendered from one contract file under `packages/mailbox/contracts/`. If a standing instruction is kept, it lives in `components/agent-mailbox/instructions/peer-input.md`, refers to that contract instead of copying it, and has an anchor assertion (L8.3). It is not added to `core/instructions/`.

### B12 - Doctor (spec §12 cuối)
Thay "no `mailbox` doctor check is added now" bằng: "the directory check and the hook-runnable probe register into `src/setup/registrations.mjs` with the first adapter (AGENTS.md install gate); the skipped-hook detector `last_drain_at` stays as the runtime signal. Waiving this is the owner's call (question 5)."

## 6. Hướng phụ thuộc và vị trí trong manifest

**Tầng:** Agent Mailbox là **L4, ngang hàng Run Supervisor**. Nó đứng trên L3 agent-protocol và L2 terminal-control mà nó gọi trực tiếp, nên không thể thấp hơn.

**Import cho phép (mailbox → ):** `fgos-process` (judge), `fgos-holder-lock`, `fgos-durable-file`, `fgos-session-identity`, `fgos-terminal-control`, `fgos-agent-protocol`. Lõi `fgos-mailbox-core` chỉ `serde`/`serde_json`.
**Cấm (mailbox → ):** `fgos-run-supervisor` (cùng tầng), `fgos-event-store` và `fgos-git` (slice 1; sau này chỉ qua adapter của port `MailStore`), `fgos-observe`, `fgos-work-state`, bất kỳ Workflow/Work.
**Chiều ngược (ai được import mailbox):** chỉ `apps/fgos` (wiring) và test. `agent-protocol`, `terminal-control`, `session-identity`, `process`, `holder-lock`, `durable-file`, `run-supervisor` không bao giờ import mailbox. Runner steer (§15.4) đi qua route/verb, không qua crate.
**Chu trình:** không có trong thiết kế đề xuất. Hai nguy cơ spec hiện tại: (1) agent-protocol "biết" mailbox nếu vị từ composer mang tên mailbox hoặc fixture tham chiếu `packages/mailbox/contracts/` → tên chung và fixture ở lại agent-protocol; (2) lõi nhắc tên CLI: lõi chỉ giữ `cli` như chuỗi mờ, và tên ngắn `forgent-claude-2b` do adapter cung cấp chuỗi `cli`; việc `adapter_for(cli)` nằm ngoài lõi.

**Vì sao hai crate:** quy tắc 1 và 3 của §4 ("lõi không import adapter, không I/O") hiện được ghi là do `test/architecture.test.mjs` kiểm. Điều đó **không đúng cho crate Rust**: test đó chỉ quét `.mjs` dưới `src/` và `bin/` (`architecture.test.mjs:28-41`) và manifest có 0 đường `packages/` hay `apps/`; các tầng `entry/use-case/infra/domain/kernel` là tầng của Node. Tách `fgos-mailbox-core` cho Cargo tự cưỡng chế (lõi không có dependency nào để import adapter hay I/O) mà không cần cơ chế kiểm mới. Đây cũng là câu trả lời cho spec Q7: **manifest không diễn đạt được ranh giới crate**; Rust layering hôm nay chỉ nằm ở nhãn L0-L4 trong tài liệu và path dependency của Cargo (tôi không tìm thấy test hướng phụ thuộc cargo nào).

**Manifest (`docs/architecture-manifest.json`):** không thêm hàng cho crate. Hàng Node liên quan đã có: `src/setup/agent-hooks.mjs` = `infra`, `src/setup/registrations.mjs` = `use-case`. Slice 1 không có file `.mjs` mới nào nếu verb và hook đều native (mọi `.mjs` mới sẽ bị test (a) bắt buộc có hàng). Sửa spec §4 mở đầu "Rules, enforced by ..." thành: "Rules 1 and 3 are enforced by the dependency set of `fgos-mailbox-core` (Cargo); rule 2 and the layer direction by review until a cargo dependency-direction test exists (owner decision, question 5 below); `test/architecture.test.mjs` covers only Node files."

**Hàng đề xuất cho `docs/platform/component-boundary.md` §4:**

> | Agent Mailbox (L4) | Single authority for "how a message from one agent session is placed into the context of the right live head of a CLI on this machine, with an honest delivery report, and never as the user's input": the envelope, the delivery state machine (`recorded`, `in-flight`, `offered`, `refused`), the registry of heads (name, generation, process `Record`, terminal-control key), the channel-protection policies, the peer frame, and the per-CLI hook payload shape and non-terminal wake channels. Owns one runtime-state record per project (not event truth, never replayed, never pushed). Never owns writer identity (Session Identity), process liveness (Process Facts & Control), pane access (Terminal-control), typing or screen reading per CLI (Agent protocol), hook installation (the setup installer), locks (Holder-lock), communication authorization or case budgets (coordination foundation, Workflow admission), or what a runner worker is told (Execution Core): a head started by the runner is not addressable. Crates `fgos-mailbox-core` (pure) and `fgos-mailbox` (`packages/mailbox/rust`); the hook door is `fgos hook mailbox`, the user verbs `fgos mailbox send\|inbox\|list\|status`. Depends on Process Facts & Control, Holder-lock, durable-file, Session Identity, Terminal-control and Agent protocol; imports no run supervisor, Event Store or Git; nothing below it imports it. | [agent-mailbox/spec.md](agent-mailbox/spec.md) |

Thêm dòng "agent mailbox | agent-mailbox/spec.md" vào bảng §6 Related Files. Hàng Holder-lock, Terminal-control, Agent protocol, Session Identity cần một câu mỗi hàng khi các thay đổi tương ứng (lock row; attach cho pane người dùng; `composer_state` + focus-neutral; `is_attempt_writer_id`) hạ cánh.

## 7. Xếp hạng khuyến nghị

1. Áp dụng B4, B5 trước: đây là ranh giới tin cậy/vận hành, rẻ (văn bản + một hàng dữ liệu + một hàm), và không ai khác sẽ tự phát hiện.
2. B3, B2, B1: chỉ là thay đường dẫn tới cửa có sẵn; làm trước S1 vì chúng đổi hình dạng record và crate.
3. B6: quyết trước S0 vì S0 đang đo "selector native" cho cửa sai.
4. B7-B12: sửa trong cùng lượt ký.
5. Không đổi: lõi thuần + ports, mutex + snapshot, generation theo tiến trình, scope slice 1. Các quyết định đó không chạm quyền hạn của ai.

## 8. Câu hỏi chỉ chủ sở hữu trả lời được

1. **Cửa hook (B6):** chấp nhận `fgos hook mailbox` là kind của cửa hiện có, host Rust phục vụ native (khuyến nghị), hay giữ verb `fgos mailbox drain` riêng (nhanh hơn để giao, nhưng là hai cửa)? Nếu giữ riêng, nên ghi đó là ngoại lệ có chủ ý của L10.
2. **Nhà của record (B7):** `<fgosDir>/runtime/mailbox` repo-scope (khuyến nghị, bỏ `repoKey`, cần resolver Rust cho `.fgos` của main checkout) hay `<stateRoot>/mailbox/<key>` (cần định nghĩa khóa, hàng lock `scope: machine`)?
3. **Pane do người mở:** chấp nhận mỗi đầu đăng ký phát hành một allocation record `attached` trong `<stateRoot>/terminal`, và mailbox dọn nó bằng `release` ở lần sweep, hay muốn terminal-control có đường gắn pane không để lại record bền? (Hai phương án thay đổi spec terminal-control khác nhau.)
4. **Wiring `AgentIo`:** chấp nhận mailbox tự nối ~60 dòng (khuyến nghị, đúng mẫu "mỗi consumer tự nối"), hay muốn tách một leaf dùng chung với run-supervisor để triệt tiêu trùng lặp (tốn một crate mới và sửa supervisor)?
5. **Hai crate và test hướng phụ thuộc:** chấp nhận tách `fgos-mailbox-core` để Cargo cưỡng chế rule 1/3 (khuyến nghị), và có muốn một test cargo hướng-phụ-thuộc cho toàn workspace hay chỉ cho crate này? Đây là cơ chế kiểm mới nên cần quyết định riêng.

Câu hỏi phụ, có thể do controller quyết: có mở lại quyết định 2026-10-19 về doctor (B12) khi áp AGENTS.md install gate không; mailbox có cho phép bất kỳ đầu nào trong project nhận tin từ bất kỳ đầu nào ở slice 1 (hiện đúng như spec, nhưng nên là lựa chọn có tên, B8).
