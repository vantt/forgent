---
area: work-state
updated: 2026-08-12
sources: [phase-1-state-layer, phase-1-review-fixes, phase-2-routing-s1, phase-2-routing-s2, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, async-human-gate, stage-intake, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1, install-coexistence, discovery-context, worker-execution, fan-out-parallel, human-rounds, work-item-verb-surface, base-workflow-model-s1, base-workflow-model-s2, self-improve-loop, work-graph-intelligence-s1, work-graph-intelligence-s2a, work-graph-intelligence-s2b, entry-standardization, work-id-tsk-hash, p50-workflow-induct, str61-chat-context-continuity, str68-discovery-judge-robustness, compound-learn-enduser-docs, str77-79-doc-gap-fixes, str83-fgos-slash-commands, str86-runner-headless-git, str73-done-flip-cos-check, str93-discovery-precedence-labels, str7-str8-priority-intent, str51-llm-assist-classify, str46-io-contract-lat2, str46-io-contract-lat3, spec-docs-lifecycle-realignment]
decisions: [9ac6ca50, 0790031c, 451ca088, fd17309a, 55ad2f9f, feed7428, 1a80b4d3, 65c642a8, 9f6b52c8, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e, f1715488, 8788e9bb, cfae0120, 396d9d9e, 2e92b7a5, 5a6900b2, b28487af, 2ae492d8, 76b7a36b, 8d04bba3, 1cd895e1, 38160a70, a2146274, 896219a7, b5c0ba0c, b2d18cc7, b0da87aa, 8cf7effe, 81322763, 28e6184b, 14091e58, 19330e09, bce79d8a, 87536f3f, 9c67c3d1, 6aa67ae4, 1c776c56, 1d336d8a, ea8b9a8d, 757e5dd7, ecfd0d1a, 0f3b6eb0, 0e575f83, ee0f95c3, f69951df, f176c18a, d3445024, a5825b8b, a58a7563, 11d5ebc4, 10a740da, 8fc155eb]
coverage: partial
---

# Spec: Work-State (tầng quản việc của forgent)

Bộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận "đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn.

## Entry Points & Triggers

- `fgos init` → khởi tạo kho work-state rỗng tại thư mục làm việc hiện hành (nhật ký rỗng + bản chiếu rỗng); đồng thời quét READ-ONLY project tìm marker của harness agent khác đã có mặt (thư mục dấu ấn như `.bee/`, `.claude/`, `.codex/`, `.cursor/`, và khối managed trong `AGENTS.md` khi file đó tồn tại — `init` không bao giờ tạo/sửa `AGENTS.md`), ghi kết quả phát hiện ra output + vào manifest `.fgos/coexistence.json`; lỗi phát hiện không bao giờ chặn `init` (fail-safe), re-init lặp lại ghi manifest nhất quán (idempotent) — doctrine đầy đủ: `docs/coexistence.md`
- `fgos submit "<mô tả tự do>" [--async|--unattended] [--deps <id1,id2,...>]` → **cửa vào công khai duy nhất** cho việc mới: khai một work item từ một câu mô tả văn xuôi duy nhất — id, title, kind, risk, tier đều TỰ SUY (không cần người submit tự đặt); toàn văn mô tả gốc được giữ nguyên trên trường `description` (Data Dictionary #17, per discovery-context STR30) — nguồn ngữ cảnh đầy đủ cho context-discovery đọc lại sau, không bị cắt gọn như `title`; `verify` nhận placeholder cố định chờ bổ sung sau; `--deps` (tùy chọn, mirror hệt `add`'s `deps` sẵn có) ghi trực tiếp danh sách id phụ thuộc, đi qua ĐÚNG cửa ghi/kiểm chu trình mà mọi verb khác dùng — vắng cờ này thì `deps` rỗng, byte-identical hành vi trước đây (per str83-fgos-slash-commands / 757e5dd7); kết quả in ra bọc trong một phong bì máy-đọc chuẩn (xem "Phong bì output" dưới)
- `fgos move` → chuyển trạng thái một item, kèm `--expect` (kỳ vọng, chống ghi đè mù); cạnh từ-chối-đề-xuất bắt buộc `--reason`
- `fgos decision --text "..."` → ghi một quyết định vào nhật ký
- `fgos ask <id> --text "..."` → đưa một item vào chờ người (`awaiting-human`), kèm **câu hỏi** người phải quyết; item rời tập việc-sẵn-sàng cho tới khi được trả lời; nếu item có `parent`, `ask` còn chụp thêm một ảnh `{id, title, status}` của gốc lúc này làm mốc so sánh sau (per str61-chat-context-continuity — xem RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm))
- `fgos answer <id> --text "..."` → **trả lời** câu hỏi của một item đang chờ; ghi câu trả lời vào nhật ký rồi đưa item rời `awaiting-human` về `todo`, thành việc actionable trở lại
- `fgos list` → đọc danh sách item từ bản chiếu hiện hành; item đang `awaiting-human` hiện kèm câu hỏi của nó (không cần lệnh đọc riêng); item `awaiting-human` có `parent` còn kèm thêm `awaitingContext` — gốc hiện tại để neo ngữ cảnh, cộng phần đổi-từ-lúc-hỏi nếu có (per str61-chat-context-continuity — xem RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)), khóa này vắng mặt hoàn toàn khi không có item nào thuộc diện đó
- `fgos ready` → đọc frontier: mọi item `todo` có toàn bộ deps đã ngã-ngũ, đang ở stage `executing`, VÀ không còn hậu duệ nào (qua `parent`) dang dở, thứ tự đúng thứ tự khai — thao tác ĐỌC thuần; item `awaiting-human`, còn ở stage `discovery`/`exploring`/`planning`, hoặc còn con dang dở KHÔNG BAO GIỜ xuất hiện trong tập này. "Ngã-ngũ" ở đây tính từ `delivered` trở đi (`delivered`/`retrospective`/`cleanup`/`done`), cộng item bị hủy — nghĩa là code đã vào cây chính là đủ mở dep, không phải chờ hết cả phần đuôi tổng-hợp/thu-hồi (xem RUL12 (frontier dẫn xuất))
- `fgos discover <id> [--verdict clear|unclear]` → chạy context-discovery cho một item đang ở stage `discovery` hoặc `exploring`, mang theo verdict của chính người gọi — đọc gì trước "Giai đoạn Soi-rõ (stage discovery) và Đào-sâu (stage exploring)" dưới; item ở stage lập-kế-hoạch dùng `plan`, không dùng verb này
- `fgos plan <id> [--verdict pass-through|decompose|need-human] [--children <json>]` → chạy phán chia-việc cho một item đang ở stage `planning` (hoặc bí danh di sản `decompose`) — verb RIÊNG, tách bạch khỏi `discover`, xem "Giai đoạn Lập-kế-hoạch" dưới
- `fgos rebuild` → dựng lại bản chiếu từ zero bằng cách phát lại toàn bộ nhật ký
- `fgos repair` → sửa CHỈ MỘT hình dạng hỏng hẹp của nhật ký sự kiện: dòng cuối bị cắt cụt (crash giữa lúc append). Trước khi cắt, sao lưu nguyên trạng nhật ký hỏng ra file backup có dấu thời gian; sau khi cắt, tự đọc lại kiểm chứng nhật ký sạch trước khi báo thành công. Hỏng hình dạng khác (giữa file, nhiều dòng hỏng, hoặc nhật ký vốn đã sạch) đều bị từ chối rõ lý do, KHÔNG đụng file — cửa fail-closed cho `corrupt-log` (mã thoát 5) không bị nới, chỉ có đúng một khe hẹp này được vá tay bởi người vận hành. **Yêu cầu KHÔNG-tiến-trình-song-song (per fgos-multi-session-checkout Epic 3):** `repair` là ghi-đè-cả-file (`writeFileSync` sau khi sao lưu) và CỐ Ý không lấy `.fgos/events.lock` của `appendEvent` — nó phải chỉ chạy khi KHÔNG có tiến trình fgos nào đang sống, vì một `appendEvent` chen vào giữa lúc đọc và lúc ghi-đè của repair sẽ bị âm thầm nuốt mất (drop). Đây là thao tác hiếm, người vận hành chủ động gọi, không nằm trên đường append thường; bảo vệ repair khỏi ca đó là ngoài phạm vi, chỉ ghi nhận yêu cầu chứ không cưỡng chế
- `fgos check [id]` → đọc bản chiếu, in cặp dự đoán/thực tế (outcome) đã gộp cho một item, hoặc cho mọi item đang có dữ liệu nếu không truyền id — thao tác ĐỌC thuần
- `fgos rollup <id>` → đọc bản chiếu, in một item gốc (title/status) kèm đếm con theo status (`k/n done`) và liệt kê từng con trực tiếp (qua `parent`, dựng từ STR16 decompose) cùng status của nó; item không con in `0/0 done` + ghi rõ "không có con"; id không tồn tại báo lỗi `validation` — thao tác ĐỌC thuần, không sự kiện mới
- `fgos triage` → đọc bản chiếu, xếp hạng mọi item CHƯA `done` theo số item khác (cũng chưa `done`) đang phụ thuộc vào nó qua đồ thị hợp nhất `deps` + `parent` (`blocks`; một parent được tính cả từ con còn mở, không chỉ `deps`), giảm dần rồi id tăng dần (tie-break); mỗi dòng còn kèm `blockedBy` — chiều ngược lại, danh sách id mà CHÍNH dòng này còn đang chờ (unmet `deps`, cộng con còn mở nếu dòng là parent); backlog-triage impact ranking (STR21), tách bạch khỏi phân loại rủi ro/lane lúc intake (STR14 `classify.mjs`) — thao tác ĐỌC thuần, không sự kiện mới
- `fgos take [--id <id>] [--role human|session]` → **cửa pull giao–nhận việc** (bên ngoài vòng runner): một tác nhân ngoài (người mặc định, hoặc một phiên đang sống) cầm đúng một item từ ĐÚNG tập frontier runner dispatch-được — xem "Cửa pull giao–nhận việc" dưới
- `fgos return <id> [--timeout <ms>]` → trả kết quả cho một item đã `take` — verb tự đo tiến độ thật (tree sạch + HEAD tiến + verify thật), KHÔNG tin lời người gọi — xem "Cửa pull giao–nhận việc" dưới
- `fgos pick [id]` → **cửa pull giao–nhận việc CỘNG dựng workspace**, một lệnh kết hợp `take` + tạo/tái dùng worktree cho item claim được: không truyền `id` thì cầm đầu frontier (giống `take`), truyền `id` thì cầm đúng item đó (kể cả đường tái claim `blocked→doing` mang nhánh sống, giống `take`) — role LUÔN `session`, không có cờ `--role` (khác `take`); sau khi claim thành công, dựng (hoặc tái dùng) một worktree + nhánh `fgw/<id>` qua CHÍNH `createWorktree` mà vòng tự hành dùng (xem spec Runner Data Dictionary #2) — xem "Cầm việc + dựng workspace (pick)" dưới
- `fgos retrospective` → quét cơ học MỌI item đang `delivered` và chuyển từng cái sang `retrospective` — không nhận id, không phán xét, chạy lại nhiều lần vẫn ra cùng kết quả; đây là cửa vào của chặng tổng hợp sau-thi-công
- `fgos compound <id>` → GẮN NHÃN tài liệu lên bản ghi capture của một item đang ở status `retrospective` — item ở status khác bị từ chối rõ lý do, không sự kiện nào ghi thêm. Verb này KHÔNG còn chuyển stage: stage `compound-learn` mà nó từng mở lối vào đã rút, nên nó chỉ ghi outcome. Cờ tùy chọn `--doc-type <quadrant>` ghi nhãn Diataxis, cờ tùy chọn `--doc-path <path>` ghi con trỏ nguồn↔tài liệu (linkage) lên cùng outcome — xem RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)/RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)
- `fgos cleanup <id>` → đóng chặng cuối: đòi item đang ở status `cleanup`, chạy phép kiểm thu-hồi (TTL toàn cục đã trôi qua, và merge của item vẫn còn giải được) rồi mới cho `cleanup → done`; không đạt thì item rẽ `cleanup → blocked` nêu rõ lý do. Là harness thuần — KHÔNG skill nào nạp cho chặng này
- `fgos docs-index` → sinh chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối (manifest `docs/enduser-docs-index.json`) — verb ĐỌC-THUẦN (quyền `read`): không ghi sự kiện, không đổi trạng thái item, không sửa tài liệu nào; enumerate các quadrant Diataxis trên đĩa và truy ngược mỗi tài liệu về capture đã sinh nó — chi tiết hành vi + hình dạng manifest ở area `enduser-docs-index` (per bước-3 compound-learn-enduser-docs)
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>]` / `fgos reject <id> --reason "..."` → cổng duyệt PR nội bộ, MỘT cổng cho mọi đề xuất `awaiting-approval` bất kể nguồn (runner hay pull-door) — bề mặt CLI này sống ở đây (cửa lệnh `fgos` một cửa), nhưng cơ chế merge/verify đầy đủ được đặc tả ở spec Runner "Cổng duyệt PR nội bộ"
- Bản ghi dự đoán/thực tế (outcome) không có verb ghi riêng qua cửa lệnh: nó được ghi từ bên trong vòng tự hành (xem spec Runner) — nửa dự đoán lúc nhận việc, nửa thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại); cửa pull `take`/`return` ghi hai nửa này trực tiếp, cùng khuôn

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | id | Định danh bền của work item, dạng kebab-case chữ thường, mở đầu bằng chữ cái; không trùng. KHÔNG mang nội dung title (title lưu ở field riêng #2) — item gốc sinh tiền tố cố định `tsk-` + hậu tố ngắn chống trùng; item con (sinh qua chia-việc) mang id `<id-của-gốc>-<n>` (n = thứ tự trong lứa con, đệ quy nếu con lại bị chia tiếp) | ví dụ `tsk-e5i0f2` (gốc), `tsk-e5i0f2-1` (con thứ 1) | yes | — |
| 2 | title | Tên việc người đọc hiểu; nhận mọi ký tự unicode | free text | yes | — |
| 3 | kind | Loại việc (trả lời "việc này thuộc loại gì" — câu 2 của sáu câu) | free text | yes | — |
| 4 | status | Trạng thái vòng đời; schema từ chối giá trị ngoài **mười** trạng thái này (phạm trù `validation`) kể cả qua tầng thư viện. Chuỗi chính chạy `todo → doing → awaiting-approval → delivered → retrospective → cleanup → done`, cộng ba nhánh rẽ `blocked`/`awaiting-human`/`wontfix`. Bốn chặng ĐUÔI (`delivered`/`retrospective`/`cleanup`/`done`) là chuỗi dùng chung mọi domain đi y hệt nhau, không domain nào được đặt nhãn lại. **Phân biệt durable status vs effective status:** Trạng thái bền (**durable status**) là view gộp từ nhật ký sự kiện `work.move`. Trạng thái hiệu lực (**effective status**) là trạng thái bền được phủ bởi bản ghi runtime claim đang hoạt động (`.fgos/runtime/claims/<id>.json`), theo công thức `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện (*new claims do not durably write into doing*); `doing` đóng vai trò trạng thái hiệu lực khi claim đang hoạt động, và vẫn giữ giá trị FSM hợp lệ cho dữ liệu di sản hoặc đường phục hồi fallback | `todo` — chưa bắt đầu · `doing` — đang làm · `blocked` — kẹt vì lỗi/runner-park, hai chiều với todo/doing; nhận thêm một cạnh vào từ `awaiting-approval` (per pr-lifecycle / 1359ab5e) khi cổng duyệt gãy — merge conflict hoặc verify đỏ sau merge — mang `reason` bắt buộc, cùng khuôn enforce với `awaiting-approval→todo`; xem spec Runner "Cổng duyệt PR nội bộ"; và một cạnh RA thẳng tới `awaiting-approval` (per fan-out-parallel) khi một lần đồng bộ-lại (catch-up) sạch — cạnh này KHÔNG mang `reason` (mirror khuôn cơ học của `blocked→todo`/`blocked→doing`, khác khuôn bắt-buộc-lý-do của `awaiting-approval→todo`/`awaiting-approval→blocked`) và KHÔNG BAO GIỜ đi qua `doing`; xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)" · `awaiting-human` — đậu chờ người quyết, mang một câu hỏi; runner/frontier KHÔNG BAO GIỜ pick; rời khi người trả lời (một lối vào từ `todo` hoặc `doing`, một lối ra về `todo`); đậu vô thời hạn, không timeout · `awaiting-approval` — goal-check đạt, đề xuất nằm trên nhánh chờ duyệt · `delivered` — code ĐÃ được nhận vào cây chính; đây chính là nghĩa hẹp mà `done` từng mang không chính thức cho phép kiểm "dep đã mở chưa" (RUL12 (frontier dẫn xuất)), nay tách ra thành một chặng riêng có tên · `retrospective` — chặng tổng hợp/học sau-thi-công theo lô, chỗ ở mới của bước Compound-learning sau khi nó thôi làm một stage (xem "Mô hình domain" dưới) · `cleanup` — chặng thu-hồi worktree có hạn TTL; một item đỗ ở đây chỉ đi tiếp khi TTL đã trôi qua và phép kiểm thu-hồi đạt, nếu không thì rẽ `cleanup→blocked` · `done` — TERMINAL, nay chỉ còn ĐÚNG MỘT lối vào `cleanup→done`, không bao giờ ra; hai lối vào cũ `doing→done`/`awaiting-approval→done` KHÔNG còn tồn tại — chúng đã được thay bằng `doing→delivered`/`awaiting-approval→delivered`, và phần đuôi nói trên chạy tiếp từ đó · `wontfix` — TERMINAL thứ hai (per fsm-wontfix-terminal-status), cho item bị đóng CHỦ Ý mà không xây (superseded/duplicate/quyết định hành chính), khác `done` (đã hoàn thành thật); ba lối vào — `blocked→wontfix`/`todo→wontfix`/`doing→wontfix` (mirror hai lối vào của `awaiting-human` cộng thêm `blocked`) — không lối ra; KHÔNG bắt buộc `reason` cơ học (cùng khuôn `todo→blocked`/`doing→blocked`), lý do đóng ghi ở decision log của item; `hasOpenDescendant` (`frontier.mjs`) coi `wontfix` là đã-giải-quyết ngang `done` — một con `wontfix` vĩnh viễn không neo gốc ngoài frontier mãi (khác lỗ hổng cũ của `blocked`) | yes | `todo` |
| 5 | deps | Các id item phải xong trước; mọi id phải tồn tại, cấm tự trỏ; "epic" chỉ là một item thường được deps trỏ vào. **Bất biến phi-chu-trình (per work-graph-intelligence S1):** đồ thị `deps` không bao giờ được phép khép vòng — cửa ghi duy nhất (qua verb `add` và `edit`) chặn MỘI lần ghi (thêm mới hoặc sửa `deps`) mà kết quả sẽ tạo một chu trình (A→B→A hoặc dài hơn), ngay sau bước kiểm tồn tại và TRƯỚC khi sự kiện được ghi; lần ghi bị chặn trả lỗi phạm trù `validation` (mã thoát 4). Chu trình được đo qua đúng một đường kiểm tra dùng chung, không có đường thứ hai. Vì id của một item mới phải trỏ tới các id đã tồn tại, một chu trình nhiều-nút chỉ có thể phát sinh khi SỬA `deps` của item đang có; lần ghi thêm mới chỉ có thể tự-trỏ (đã bị chặn từ trước ở bước kiểm hình dạng). Trước bất biến này, một lần sửa `deps` có thể tạo chu trình A↔B mà lọt qua âm thầm (phép kiểm deps khi đó chỉ xét sự tồn tại của id) — lỗ hổng đó nay đã đóng. **Mở rộng (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** bất biến phi-chu-trình nay phủ ĐỒ THỊ CẠNH-ĐỊNH-KIỂU HỢP NHẤT (`blocks` từ `deps` + `parent-child` từ `parent`), không chỉ riêng `deps` — xem quy tắc RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị) và Data Dictionary #13 | danh sách id | yes (rỗng được) | `[]` |
| 6 | risk | Mức rủi ro của việc (câu 4) | free text | yes | — |
| 7 | refs | Đọc gì trước / chạm contract nào (câu 1 + 3) | danh sách tham chiếu | yes (rỗng được) | — |
| 8 | verify | Proof gì thì xong (câu 5) | free text | yes | — |
| 9 | learn | Link bài học để lại (câu 6 — chỗ cắm vòng học sau này) | text | no | — |
| 10 | tier | Hạng nặng-nhẹ của việc, để chọn model thực thi (bảng tier→model đến ở Phase 2 E3; tập giá trị provisional tới lúc đó) | `light` · `standard` · `heavy` | no | `standard` |
| 11 | mode | Chế độ submit đã dùng khi item được tạo qua `submit` — quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-DISCOVERY-TRƯỚC (agent đang sống hay runner tự hành), KHÔNG phải điều kiện mà code rẽ nhánh (xem RUL17 (mode là quy ước gọi, không phải điều kiện code)) | `sync` (mặc định — người submit tương tác ngay) · `async` (người submit rời đi ngay) | no | `sync` (khi tạo qua `submit`; vắng mặt trên item tạo qua `add`) |
| 12 | stage | Giai đoạn vòng đời VĨ MÔ của item — chiều MỚI, song song với `status` (chiều vi mô, không đổi). Quyết định loại tác vụ/persona nào xử lý item ở thời điểm hiện tại; `status` vẫn áp dụng như cũ BÊN TRONG mỗi stage Với domain `coding`: `discovery` — chưa qua kiểm chất lượng thông tin, context-discovery còn phải chạy · `exploring` — context-discovery thấy chưa đủ rõ, cần một vòng đào sâu cùng người để khóa quyết định sản phẩm · `planning` — đã qua kiểm, đang chờ/qua phán chia-việc (làm giàu ngữ cảnh + phân rã thành con, hoặc pass-through nếu không cần chia) trước khi vào executing · `executing` — đã qua các bước trên (hoặc chưa từng cần), sẵn sàng cho vòng thi công · `decompose` — BÍ DANH DI SẢN của `planning`, chỉ để tháo cạn: không item mới nào tới được đây, giữ lại vì `stage` không sửa được nên item đang đỗ sẽ mắc kẹt nếu gỡ tên (xem "Giai đoạn Lập-kế-hoạch" dưới). `clarify` và `compound-learn` KHÔNG còn là giá trị hợp lệ — cái trước dời về bước Init trước khi item tồn tại, cái sau dời sang chiều `status` (`retrospective`) | no | `executing` khi vắng mặt (item tạo qua `add`, hoặc mọi item tạo trước tính năng này); `discovery` — stage đầu của domain — khi tạo qua `submit` |
| 13 | parent | Lineage: id của item GỐC mà item này là hậu duệ; chỉ sinh ra qua phán chia-việc, không phải trường người tự điền qua `add`/`submit`. **Mô hình cạnh-định-kiểu (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất), supersede ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường)):** `parent` là cạnh `parent-child` trong MỘT đồ thị cạnh-định-kiểu hợp nhất cùng `deps` (cạnh `blocks`) — hai quan hệ vẫn TÁCH BẠCH về lưu trữ và về điều-phối (con của một lần chia-việc KHÔNG BAO GIỜ được ghi vào `deps` của gốc — RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối) giữ nguyên), nhưng là MỘT đồ thị cho phép kiểm phi-chu-trình: `parent` nay tham gia bất biến acyclic ở cửa ghi (xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)). Trước S2a, một chu trình `parent-child` (A cha B, B cha A) lọt qua âm thầm vì id của `parent` không được kiểm tồn tại — nay bị cửa ghi từ chối | id của một work item đã tồn tại, hoặc vắng mặt | no | vắng mặt (item gốc, hoặc mọi item tạo trước tính năng chia-việc) |
| 14 | claimRole | Ai đang cầm claim hiện tại của item — lưu trên bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`), hoặc cộng-thêm (fold) từ `role` trên sự kiện di sản; phân biệt claim của cửa pull (`human`/`session`) với claim của runner (`runner`/`system`). Runtime claim phủ trạng thái hiệu lực `doing` lên item trong lúc hoạt động (xem "Cửa pull giao–nhận việc" dưới) | `runner` · `human` · `session` · `system` — vai thứ tư (per str46-io-contract): cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (dùng trên cạnh park nội bộ, xem RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)/spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) | no | vắng mặt (nhật ký di sản không mang `role` trên cạnh claim) |
| 15 | headAtTake | Vị trí commit (HEAD) của host repo tại đúng thời điểm cửa pull `take` cầm item — cộng-thêm trên CÙNG sự kiện `work.move` đưa item vào `doing`; CHỈ `take` ghi trường này, claim của runner không bao giờ mang nó | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim của runner, hoặc item chưa từng qua cửa pull) |
| 16 | headAtReturn | Vị trí commit (HEAD) của host repo tại đúng thời điểm `return` đo verify XANH — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; đối xứng `headAtTake` nhưng ghi ở đầu RA thay vì đầu VÀO (per pr-lifecycle / 1359ab5e); nguồn diff trung thực cho cổng duyệt tính dải `headAtTake→headAtReturn` của một đề xuất pull-door (xem spec Runner "Cổng duyệt PR nội bộ") | mã commit (string), hoặc vắng mặt | no | vắng mặt (đề xuất của runner không qua `return`, hoặc mọi đề xuất tạo trước pr-lifecycle) |
| 17 | description | Toàn văn mô tả gốc người submit gõ — nguồn ngữ cảnh đầy đủ để context-discovery đọc lại (xem "Giai đoạn Soi-rõ" dưới), không bị cắt gọn/phân loại như `title` (per discovery-context STR30 / cfae0120) | free text (không rỗng khi có mặt) | no | vắng mặt (item tạo qua `add`, hoặc mọi item tạo trước tính năng này) |
| 18 | reason | Lý do từ-chối/đỗ MỚI NHẤT của item — fold từ trường `reason` trên sự kiện `work.move` gần nhất mang nó (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`), KHÔNG phải trường người tự điền. GHI ĐÈ mỗi lần fold (latest-wins) — khác khuôn "cộng thêm không đè" của outcome/friction/settlement/discovery, vì đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker prompt, xem spec Runner RUL23 (hợp đồng con — verify thật, không placeholder)), không phải một chuỗi lịch sử cần giữ mọi lần. Khi item đạt trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason`/`parkReason` tồn dư từ đợt đỗ cũ có thể được xóa khỏi view phát lại qua verb `fgos resolve-park-reason <id> --note "..."` (bỏ khóa `reason`/`parkReason` trên view và ghi nhận note vào `view.parkResolutions[id]`) | free text | no | vắng mặt (item chưa từng bị đỗ/từ chối, hoặc đã được xóa qua resolve-park-reason) |
| 19 | branchHeadAtTake | Vị trí commit (HEAD) của CHÍNH NHÁNH đề xuất (`fgw/<id>`) tại đúng thời điểm `take` cầm một item `blocked` mang nhánh sống — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `blocked→doing`; KHÔNG BAO GIỜ cùng mặt với `headAtTake` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim main-based, hoặc claim của runner) |
| 20 | branchHeadAtReturn | Vị trí commit (HEAD) của CHÍNH NHÁNH tại đúng thời điểm `return` đo verify XANH trên một item nguồn-nhánh — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; KHÔNG BAO GIỜ cùng mặt với `headAtReturn` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (return main-based, hoặc đề xuất của runner) |
| 21 | domain | Domain nào chi phối bộ stage/chuyển-stage của item — chiều thứ BA, song song `stage` (vĩ mô, "loại tác vụ nào") và `status` (vi mô, "đang ở đâu"); một domain khai đúng ba thứ: danh sách stage có thứ tự, step-mapping (bước nào trong 5 bước base-workflow mỗi stage thỏa — xem "Mô hình domain" dưới), và cạnh chuyển-stage hợp lệ riêng của nó; domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`) (per base-workflow-model / 2ae492d8) | `coding` (stage `discovery`/`exploring`/`planning`/`executing`, cộng bí danh di sản `decompose`) · `synthetic` — fixture minh họa/dùng-một-lần, đúng MỘT stage, chỉ thỏa bước Thực-thi · `triage` — fixture ba stage mang tên riêng không trùng coding, thỏa Làm-rõ/Chia-việc/Thực-thi · `fixture-marketing` — fixture mượn hình dạng stage của coding nhưng khai bộ nhãn status và skill tổng-hợp của riêng nó (xem "Mô hình domain" dưới) | no | `coding` khi vắng mặt (mặc định lazy, cùng khuôn mặc định lazy của `stage`); `add`/`submit` đều nhận `--domain <tên>` tùy chọn (xem "Khai việc"/"Nộp vấn đề tự do" dưới) |
| 22 | discoveredFrom | Dòng dõi PHÁT-HIỆN: id của item mà trong lúc thi công nó, việc này lộ ra — cạnh `discovered-from` của mô hình cạnh-định-kiểu (xem #13/RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)), khác `parent` (dòng dõi CHIA-VIỆC): `discoveredFrom` không sinh từ một phán chia-việc, mà từ việc thi công item nguồn phát hiện thêm việc mới. KHÔNG BAO GIỜ chặn — loại trừ khỏi phép kiểm phi-chu-trình theo đúng thiết kế (chỉ `blocks`/`parent-child` tham gia acyclic, xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)); tồn tại của id nguồn KHÔNG được kiểm (cùng khuôn `parent` — một id treo vẫn được chấp nhận, degrade an toàn). Hai nguồn sinh: (a) người tự khai tường minh lúc `add`/`submit` một item mới; (b) tự động — khi trợ lý thi công một item báo có việc mới lộ ra, runner (bên duy nhất được ghi) tự tạo item đó và đóng dấu trường này trỏ về item đang thi công (xem spec Runner "Báo việc-phát-hiện từ trợ lý") | id của một work item đã tồn tại, hoặc vắng mặt (tồn tại không được kiểm) | no | vắng mặt (item không có dòng dõi phát-hiện, hoặc mọi item tạo trước tính năng này) |
| 23 | docsRef | Con trỏ CEREMONY-STATE tới artifact quyết định của tính năng đã tạo ra item này — đường dẫn tương đối trỏ vào `docs/history/<feature>/` (nơi CONTEXT.md/plan.md của tính năng đó thực sự sống). Item chỉ mang CON TRỎ; nội dung quyết định ở nguyên trong file markdown git-hoá đó — không có sự kiện/contract mới (`work.add`/`work.edit` payload đã đủ chỗ, C2 không đổi) (per p50-workflow-induct / 28e6184b). Cùng khuôn optional-additive với `description`/`parent` ở trên: kiểm hình dạng (chuỗi không rỗng) khi có mặt, KHÔNG kiểm tồn tại trên đĩa lúc ghi — một `docsRef` trỏ tới đường dẫn chưa tồn tại hoặc đã dời đi vẫn được chấp nhận, degrade an toàn cùng khuôn `parent`/`discoveredFrom` | đường dẫn tương đối dạng chuỗi (không rỗng khi có mặt), ví dụ `docs/history/p50-workflow-induct/` | no | vắng mặt (item tạo qua `add` không kèm field, hoặc mọi item tạo trước tính năng này) |
| 24 | acceptance | Danh sách clause điều-kiện-hoàn-thành (CoS) TÙY CHỌN của item, mỗi clause `{text, evidence}` — mirror discipline per-clause CoS mà bee tự áp cho backlog PBI của chính nó, port sang tầng work-item fgOS (per str73-done-flip-cos-check). `text` bắt buộc chuỗi không rỗng khi một clause tồn tại trong mảng; `evidence` tùy chọn — chuỗi không rỗng khi có mặt, hoặc vắng mặt/`null` khi clause đó chưa có bằng chứng. Khi TOÀN BỘ trường vắng mặt hoặc `null`, item hoàn toàn không bị chạm bởi gate RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) dưới — KHÔNG BAO GIỜ tự mặc định về mảng rỗng, cùng khuôn optional-additive với `docsRef`/`parent` ở trên. Sửa được qua `edit --acceptance '<json>'` — GHI ĐÈ TOÀN MẢNG mỗi lần (latest-wins), cùng khuôn `refs`/`deps`, KHÔNG có cửa sửa-từng-clause riêng | mảng `{text: string, evidence: string \| null}`, hoặc vắng mặt | no | vắng mặt (item tạo qua `add`/`submit` không kèm cờ, hoặc mọi item tạo trước tính năng này) |
| 25 | priority | Khóa sắp-xếp frontier CHÍNH — người hoặc một tác nhân tự khai qua `edit --priority <n>`, KHÔNG BAO GIỜ picker tự suy ra (giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item) dưới: picker cơ học vĩnh viễn). Số CÀNG NHỎ càng ưu tiên (ASC). Vắng mặt xếp SAU mọi item có `priority` tường minh, bất kể trị số — không coi vắng mặt là 0 (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) | số nguyên không âm | no | vắng mặt (mọi item trước tính năng này, hoặc item không truyền cờ) |
| 27 | writer | Danh tính CÁ THỂ của tiến trình ghi lần gần nhất (fold không điều kiện, ghi đè mỗi lần) — object lồng hai trường con `id`/`source`, tách bạch khỏi `role` (#14/#S2, xem "Danh tính người ghi" dưới) | `{id, source}`, `source` một trong `registry`/`env`/`pid`/`unresolved` | no | vắng mặt (nhật ký di sản không mang `writer`, hoặc mọi item tạo trước tính năng này) |
| 26 | intent | Khóa sắp-xếp frontier PHỤ (tie-break sau `priority`) — điểm mức-độ-nên-làm-ngay do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item, đọc metrics đồ thị (STR43) + xếp hạng tác động (STR21) làm tín hiệu cơ học rồi tự quyết field cuối qua cửa ghi chuẩn — KHÔNG BAO GIỜ do người hay chat ghi thẳng (nếu STR38 sau này thêm gợi ý qua chat, gợi ý đó vẫn chỉ là tín hiệu đầu vào cho bước tính này, không tự nó là giá trị cuối). Ghi cả khi item CHƯA đủ rõ để rời `discovery` (đậu `awaiting-human` vẫn được chấm điểm) — không gắn với kết quả rõ/chưa-rõ của lần soi đó. Số CÀNG LỚN càng ưu tiên (DESC, ngược chiều `priority`). Vắng mặt xếp SAU mọi item có `intent`, cùng khuôn absent-last với `priority`. Cũng sửa được thủ công qua `edit --intent <n>` (không có ràng buộc dấu/khoảng — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc schema) | số nguyên (không ràng buộc dấu) | no | vắng mặt (item chưa từng qua giai đoạn soi-rõ dưới tính năng này, hoặc mọi item trước tính năng này) |
| 28 | mergedSha | Mã commit merge THẬT đã đưa item này vào `mergedInto` — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `→delivered`, chỉ do `approve`'s các đường merge thật (local root-into-main, local leaf-into-root, GitHub PR merge) ghi; đây chính là bằng chứng kiểm-chứng-được thay cho việc phải suy luận từ git xem "việc này đã lên main chưa" (per tsk-5dk, đóng lớp sự cố "việc xong nằm ngoài main mà không ai biết" — tsk-4b2/tsk-64h/tsk-2t5). Một `move --to delivered` gõ tay, hoặc một đề xuất pull-door chỉ verify-only (không có merge commit thật nào), KHÔNG BAO GIỜ mang trường này — vắng mặt CHÍNH LÀ tín hiệu "không có bằng chứng merge", không phải một lỗ hổng ghi thiếu | mã commit (string), hoặc vắng mặt | no | vắng mặt (351 item lịch sử trước tsk-5dk, một move gõ tay, hoặc một delivery verify-only) |
| 29 | mergedInto | Tên nhánh mà `mergedSha` thực sự nằm trên đó — `main` (root-into-main hoặc GitHub PR merge) hoặc `fgw/<rootId>` (leaf-into-root) — cộng-thêm trên CÙNG sự kiện với `mergedSha` (#28), luôn cùng có-mặt/vắng-mặt với nhau trên một sự kiện | tên nhánh (string), hoặc vắng mặt | no | vắng mặt (cùng điều kiện vắng mặt với `mergedSha` #28) |
| — | Sự kiện (không hiển thị) | Đơn vị ghi của nhật ký; mỗi thao tác ghi đúng MỘT sự kiện, số thứ tự tăng dần + thời điểm + phiên bản schema `v` (hiện hành: 3; sự kiện di sản không có `v` vẫn đọc được) | `work.add` — khai item (luôn mang tier tường minh từ v2) · `work.move` — chuyển trạng thái (from/to; cạnh từ-chối `awaiting-approval→todo` VÀ cạnh gate-gãy `awaiting-approval→blocked` (per pr-lifecycle) đều mang `reason` bắt buộc; cạnh vào chờ mang `ask`, cạnh rời chờ mang `answer`; mọi ngã-ngũ có thể mang thêm `role` tùy chọn — xem "Bản ghi settlement" dưới; ngã-ngũ vào chặng đóng cũng tự mang thêm một bản ghi học — xem "Bài học lúc đóng" dưới; cạnh claim `todo→doing` qua cửa pull `take` mang thêm `headAtTake`, xem Data Dictionary #15 (hoặc `branchHeadAtTake` thay vào đó khi claim là nguồn-nhánh, cạnh `blocked→doing`, Data Dictionary #19); cạnh `doing→awaiting-approval` qua cửa pull `return` (verify xanh) mang thêm `headAtReturn`, xem Data Dictionary #16 (hoặc `branchHeadAtReturn` cho nguồn-nhánh, Data Dictionary #20, xem RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh))) · `decision` — quyết định kèm chữ · `work.outcome` — dự đoán HOẶC thực tế cho một item (mỗi nửa là một sự kiện riêng, cùng id; xem "Bản ghi kết quả" dưới) · `work.friction` — một lần thất bại tự-quy-tội tại park/halt (xem "Bản ghi friction" dưới) · `work.stage` — chuyển stage (from/to; có thể kèm `verify` khi rời `discovery`/`exploring` — xem "Giai đoạn Soi-rõ" dưới; ngã-ngũ đó cũng có thể mang `role` tùy chọn) · `work.discovery` — một lần context-discovery soi (xem "Bản ghi cổng discovery" dưới) | — | — |
| — | Phạm trù lỗi (không hiển thị) | Hợp đồng cho consumer: rẽ nhánh theo mã thoát, không theo thông điệp | `precondition` → mã 2 · `conflict` (kỳ vọng lệch) → mã 3 · `validation` → mã 4 · `corrupt-log` → mã 5 · bất ngờ → mã 1 · thành công → 0 | — | — |

### Bản ghi kết quả (outcome) — dự đoán / thực tế

Ngoài bảng trường của work item, một item có thể mang thêm một **bản ghi outcome**: hai nửa
đến ở hai thời điểm khác nhau trong đời của một lần chạy, gộp theo id — nửa đến sau CỘNG
THÊM vào bản ghi, không bao giờ đè mất nửa đã có.

| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| O1 | dự đoán | tier dự kiến | Hạng nặng-nhẹ dự kiến của việc tại thời điểm nhận việc | `light` / `standard` / `heavy` | lúc nhận việc (claim) |
| O2 | dự đoán | số dep | Số lượng việc phụ thuộc của item tại thời điểm nhận việc | số nguyên ≥ 0 | lúc nhận việc |
| O3 | dự đoán | số lần nhận trước đó | Item này đã từng được nhận (chuyển sang "đang làm") bao nhiêu lần trước lần này | số nguyên ≥ 0 | lúc nhận việc |
| O4 | thực tế | kết cục (disposition) | Kết cục cuối của lần chạy | `awaiting-approval` — goal-check đạt, thành đề xuất chờ duyệt · `parked` — dừng lại theo lẽ thường (hết trần thử lại, hoặc lỗi không thử lại được), item bị đỗ · `halted` — cầu dao chấm-trượt-liên-tiếp cắt cả vòng chạy, item bị đỗ trước khi vòng dừng hẳn | lúc item tới trạng thái cuối |
| O5 | thực tế | đạt goal-check | Phép đo goal-check của chính vòng tự hành có đạt hay không | boolean | lúc item tới trạng thái cuối |
| O6 | thực tế | số lần thử | Số lần thử trong đúng lần chạy này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| O7 | thực tế | lớp lỗi | Lớp lỗi (theo bảng phục hồi của spec Runner) nếu thất bại; rỗng nếu thành công | free text hoặc rỗng | lúc item tới trạng thái cuối |
| O8 | thực tế | số commit | Số commit mà item để lại trên nhánh đề xuất | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O9 | thực tế | số lần nhận (đến giờ) | Item này đã từng được nhận bao nhiêu lần tính đến hết lần chạy này | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O10 | — (trực giao) | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN gắn trên bản ghi — chiều AUDIENCE/loại-tài-liệu, TRỰC GIAO với chiều type-axis kỹ sư (pattern/decision/failure), một chiều CỘNG THÊM chứ không thay thế. Kiểm hình dạng khi CÓ MẶT (phải là đúng một trong bốn quadrant); vắng mặt/`null` = chưa gắn nhãn, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (Data Dictionary #23). Đi ké payload thô của sự kiện capture nên sống sót replay qua chính spread-fold sẵn có, không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` (bốn quadrant Diataxis; giá trị khác khi có mặt bị từ chối `validation`) | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |
| O11 | — (trực giao) | con trỏ tài liệu (docPath) | Con trỏ TÙY CHỌN tới tài liệu người-dùng-cuối mà bản ghi outcome này sinh ra — chiều LINKAGE nguồn↔tài-liệu, đứng CẠNH `docType` (O10) chứ không thay thế: `docType` nói "loại tài liệu", `docPath` nói "đúng tài liệu nào". Ghi lúc `compound --doc-path <path>` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)); không kiểm hình dạng (đường dẫn tự do), vắng mặt/`null` = chưa gắn linkage, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docType`/`docsRef`. Đi ké payload thô của sự kiện capture nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Là móc để chỉ mục đọc-theo-tag truy ngược tài liệu về capture (area `enduser-docs-index`), đảm bảo dựng lại tài liệu không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs) | chuỗi đường dẫn tài liệu (vd `docs/how-to/x.md`); vắng/`null` khi chưa gắn | tùy — bên sản xuất `compound --doc-path` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)) |

Item chưa từng chạy không mang bản ghi outcome nào — vắng mặt hoàn toàn, không phải bản ghi
rỗng. Nhật ký ghi trước khi bản ghi này tồn tại replay lại nguyên vẹn, không sinh ra outcome
nào cho item nào (tương thích ngược, theo luật tiến hóa schema RUL11 (tiến hóa schema)).

### Bản ghi friction — kênh 2 của capture (Phase 3 Slice 2)

Mỗi lần một item kết thúc thất bại (`parked` hoặc `halted`) sinh thêm một **bản ghi
friction**, ghi cùng lúc với nửa thực tế của outcome, tại cùng một điểm trong runner.
Khác outcome (hai nửa gộp làm một theo id), friction là **chuỗi lần xảy ra** — mỗi
record CỘNG THÊM vào danh sách của id, không bao giờ gộp/đè lên record trước.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| F1 | disposition | Kết cục của lần thất bại này | `parked` / `halted` | lúc item tới trạng thái cuối (park/halt) |
| F2 | lớp lỗi | Lớp lỗi theo bảng phục hồi (spec Runner) | free text | lúc item tới trạng thái cuối |
| F3 | lớp friction | Runner tự quy tội — 5 lớp cơ học suy ra từ lớp lỗi: `task-spec` · `context` · `environment` · `verification` · `state` | một trong 5 lớp | lúc item tới trạng thái cuối |
| F4 | số lần thử | Số lần thử của lần chạy dẫn tới thất bại này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| F5 | chi tiết | Thông điệp lỗi cụ thể (vd nội dung goal-check miss) | free text | lúc item tới trạng thái cuối |
| F6 | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN, cùng nghĩa và cùng khuôn với O10 của bản ghi outcome (trực giao với type-axis kỹ sư, kiểm khi có mặt, vắng/`null` = chưa gắn) — đi ké payload thô của sự kiện friction, sống sót replay không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |

Item chưa từng thất bại không mang bản ghi friction nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục friction: đếm theo lớp trên TOÀN BỘ record,
kèm tối đa 5 record gần nhất (không xả vô hạn); và nhắc mọi item đã tới trạng thái
cuối (`awaiting-approval`/`blocked`/`done`) mà chưa có nửa outcome thực tế — hai cảnh báo này
đọc từ view, không sự kiện mới nào sinh ra khi chạy `check` (vẫn là read thuần).

### Bản ghi settlement — kênh 1 của capture 2 kênh (Phase 3 S3-closeout)

Mỗi lần một item đi qua một **ngã-ngũ** — một điểm quyết-xong cụ thể trong
vòng đời của nó — sinh thêm một **bản ghi settlement**, cùng khuôn "cộng thêm
không đè" với friction/discovery: mỗi lần ngã-ngũ là một lần xảy ra, APPEND
vào danh sách của id, không bao giờ gộp/đè lên lần trước.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| S1 | loại ngã-ngũ (kind) | Loại điểm quyết-xong | `clarify-pass` — context-discovery cho qua, item RỜI stage ĐẦU CHUỖI của domain nó (`discovery` với `coding`; khóa theo cạnh RỜI nên đích `planning` hay `exploring` không đổi phép kiểm, nhưng một verdict `clear: false` thì KHÔNG ngã-ngũ). Tên kind là nhãn DI SẢN đã ghi vào nhật ký, không phải tên stage — xem RUL27 (settlement clarify-pass theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict) · `answer` — người trả lời một câu hỏi đang chờ · `close` — item tới `done` | lúc chính ngã-ngũ đó xảy ra |
| S2 | role | Ai/cái gì đã ngã-ngũ | `runner` — vòng tự hành tự động (quét soi-rõ, nhận việc, đề xuất, đỗ) · `session` — phiên đang sống gọi tay context-discovery · `human` — người qua lệnh CLI (`move`, `answer`) · `system` — cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (vai thứ tư, per str46-io-contract) · vắng mặt (rỗng) — ngã-ngũ không kèm role (nhật ký cũ hơn tính năng này, hoặc lời gọi không khai) | lúc ngã-ngũ xảy ra, tùy chọn |
| S3 | chi tiết | Nội dung đi kèm ngã-ngũ này — verify thật (clarify-pass), câu trả lời (answer), hoặc rỗng (close) | free text hoặc rỗng | lúc ngã-ngũ xảy ra |

Bản ghi settlement không sinh event mới: nó là một **bề mặt đọc dẫn xuất** từ
ba ngã-ngũ đã có sẵn trong nhật ký — không thêm một loại sự kiện "settlement"
riêng, tránh ghi-đôi cùng một sự thật (nguyên tắc sự-thật-một-nguồn). `role`
là trường tùy chọn cộng-thêm trên chính ngã-ngũ đó (`work.move`/`work.stage`)
— item chưa từng mang role (nhật ký cũ) vẫn fold bình thường, chỉ với role
rỗng.

**Bảo vệ tương thích ngược:** ngã-ngũ `answer`/`close` chỉ sinh bản ghi
settlement khi sự kiện gốc mang phiên bản schema hiện hành — một sự kiện nhật
ký thật sự tiền-phiên-bản (trước khi khái niệm phiên bản schema tồn tại) giữ
nguyên hình dạng bản chiếu lịch sử của nó, không tự nhiên "mọc thêm" một bản
ghi settlement mà nó chưa từng có (cùng luật tiến hóa schema RUL11 (tiến hóa schema)).

Item chưa từng qua ngã-ngũ nào không mang bản ghi settlement — vắng mặt hoàn
toàn (tương thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục settlement: đếm theo
kind+role trên TOÀN BỘ record, kèm tối đa 5 record gần nhất (cùng cap-5 của
friction) — đọc từ view, không sự kiện mới nào sinh ra khi chạy `check`.

### Danh tính người ghi (writer) — cá thể, tách bạch khỏi vai (str46-io-contract)

Mỗi sự kiện ghi qua ba cửa ghi chính (`work.move`, `work.edit`, `work.stage`)
mang thêm một trường **writer** — object lồng đúng hai trường con, `id` và
`source`. Đây là một khái niệm MỚI, tách bạch có chủ ý khỏi `role`
(Data Dictionary #14, xem "Bản ghi settlement" trên): `role` trả lời "người
gọi thuộc LOẠI nào" (`human`/`runner`/`session`/`system`), còn `writer`
trả lời "người gọi là CÁ THỂ nào" — phân biệt được hai phiên agent cùng chạy
song song, cùng mang `role: session` nhưng là hai tiến trình khác nhau
(per str46-io-contract). The gates[id] projection derived from `work.move` events carries CTR004/v1 version token through the `SCHEMA_VERSION` field of the source event, per str46-io-contract.

`writer.id` là chuỗi hoặc số định danh tiến trình ghi. `writer.source` nói
độ tin của giá trị đó — KHÔNG phải một trường độc lập, mà đi kèm bắt buộc với
`id`:

| source | Ý nghĩa | Độ tin |
|---|---|---|
| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |
| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |
| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |
| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |

**Registry chỉ ĐỐI CHIẾU, không bao giờ tự cấp danh tính** (per str46-io-contract): giá trị `id` lấy từ biến môi trường luôn giữ nguyên bất
kể sổ đăng ký có khớp hay không — sổ đăng ký chỉ nâng độ tin (`source`) khi
khớp, không bao giờ đổi hay tạo ra `id`. Một dòng sổ đăng ký KHÔNG BAO GIỜ
khớp theo thư mục làm việc hay theo pid của chính dòng đó — chỉ khớp đúng
`id` với `sessionId` của dòng — vì khớp theo thư mục sẽ gộp hai phiên khác
nhau trong cùng một worktree thành một danh tính, phá đúng mục đích khoá
hoạt động cây chính (xem spec Runner "Khoá hoạt động cây chính").

Một giá trị `id` sai định dạng (ký tự lạ, quá dài) bị LOẠI ở tầng phân giải
và rơi xuống nguồn kế tiếp — KHÔNG BAO GIỜ ném lỗi, KHÔNG BAO GIỜ chặn verb
(per str46-io-contract); không có validator nào đứng trên đường ghi
`writer`. `writer` fold lên item KHÔNG ĐIỀU KIỆN, GHI ĐÈ mỗi lần (latest-wins)
— khác khuôn "cộng thêm không đè" của outcome/friction/settlement, vì đây là
danh tính của LẦN GHI GẦN NHẤT, không phải một chuỗi lịch sử cần giữ mọi lần.
Item chưa từng qua tính năng này không mang `writer` — vắng mặt hoàn toàn,
tương thích ngược (RUL11 (tiến hóa schema)). Cơ chế phân giải đầy đủ (thứ tự nguồn, khoá hoạt động cây chính dùng cùng danh tính này): spec Runner RUL49 (compound-learning đổi trục: từ stage sang status retrospective).

### Bài học lúc đóng — câu-6 tự động (Phase 3 S3-closeout)

Đúng lúc một item tới `done` — qua BẤT KỲ lối vào nào (thao tác tay
`doing→done`, hoặc duyệt đề xuất `awaiting-approval→done`) — hệ thống tự động soạn
thêm một **bản ghi học**, trả lời câu-6 của sáu câu hỏi harness ("learning gì
để lại?"). Soạn cơ học hoàn toàn từ dữ liệu item đã tích lũy — không có phán
xét bên ngoài, không gọi model, không spawn — và không bao giờ chặn việc đóng
item nếu soạn lỗi (best-effort, cùng tinh thần fail-safe của context-discovery).

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| L1 | kết cục (outcome) | Nửa thực tế của bản ghi kết quả tại thời điểm đóng — kết cục/số lần thử/lớp lỗi | object, hoặc rỗng nếu item chưa từng chạy | lúc item tới `done` |
| L2 | friction theo lớp | Đếm các bản ghi friction của item, theo lớp | map lớp→số lượng, rỗng nếu item chưa từng thất bại | lúc item tới `done` |
| L3 | settlement theo loại/role | Đếm các bản ghi settlement của item — kể cả chính ngã-ngũ đóng vừa xảy ra — theo cặp loại+role | map loại/role→số lượng | lúc item tới `done` |

Item đóng mà KHÔNG có outcome/friction/settlement nào trước đó vẫn nhận một
bản ghi học tối thiểu nhưng thật — không nổ, không im lặng bỏ qua. Ngược lại,
soạn bài học không bao giờ là điều kiện chặn đóng item: nếu việc soạn lỗi,
item vẫn đóng thành công, chỉ bản ghi học bị bỏ qua lần đó.

Item chưa từng đóng không mang bản ghi học nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục học: mỗi item đã đóng một dòng tóm tắt
kết cục + friction + settlement của nó, kèm tối đa 5 record gần nhất.

### Bản ghi cổng-người (gate) — câu hỏi / câu trả lời / ảnh chụp gốc

Một item từng đi qua cổng chờ-người mang thêm một **bản ghi cổng**: câu hỏi/câu trả lời/ảnh
chụp gốc đến ở các thời điểm khác nhau, gộp theo id — hệt khuôn bản ghi outcome. Câu hỏi ghi
lúc item vào chờ; câu trả lời ghi lúc người trả lời; nửa đến sau CỘNG THÊM, không đè mất nửa
đã có.

| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| G1 | hỏi | câu hỏi (ask) | Điều người phải quyết trước khi việc đi tiếp (vd "OAuth hay mật khẩu?") — nhãn trạng thái đơn thuần không nói được "chờ gì" | free text (không rỗng) | lúc item vào `awaiting-human` |
| G2 | trả lời | câu trả lời (answer) | Quyết định của người; ghi xong thì item rời `awaiting-human` | free text (không rỗng) | lúc người trả lời |
| G3 | ảnh chụp gốc | `parentSnapshotAtAsk` | Ảnh `{id, title, status}` của gốc (`parent`) tại đúng lúc item vào chờ — mốc so sánh cho RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)'s "đổi-từ-lúc-hỏi"; KHÔNG BAO GIỜ tự sửa lại sau khi ghi (per str61-chat-context-continuity) | `{id, title, status}` | lúc item vào `awaiting-human`, CHỈ KHI item có `parent` giải được lúc đó |
| G4 | status trước hỏi | `statusAtAsk` | Status CHÍNH item ngay trước khi vào chờ (`todo` hay `doing`) — mốc `answer` đọc lại để biết resume về đâu (claim-lock §5.1: một claim `doing` đang giữ lúc hỏi phải resume về `doing`, không rớt xuống `todo` trần); KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3 | `'todo'` \| `'doing'` | lúc item vào `awaiting-human`, LUÔN CÓ (không điều kiện như G3) |

Item chưa từng vào cổng chờ-người không mang bản ghi cổng nào — vắng mặt hoàn toàn, không phải
bản ghi rỗng. Item đang chờ có G1 mà G2 chưa tới (đang chờ trả lời). Item không có `parent`
(hoặc `parent` không giải được lúc `ask`) không mang G3 — vắng mặt, không phải `null`. Log cũ
ghi trước claim-lock cũng không mang G4 — `answer` đọc vắng mặt là `todo` (tương thích ngược
byte-for-byte với hành vi trước §5.1). Một lần `ask` mới trên item vừa được `answer` xong ghi
lại G3/G4 mới, GHI ĐÈ ảnh cũ (không gộp hai ảnh). Nhật ký không có sự kiện cổng nào replay lại
không sinh bản ghi cổng nào (tương thích ngược, cùng khuôn RUL11 (tiến hóa schema)/RUL13 (bản ghi outcome, cộng thêm không đè)).

### Giai đoạn Soi-rõ (stage discovery) và Đào-sâu (stage exploring)

Song song với `status` (vi mô, không đổi), mỗi item mang một chiều thứ hai —
`stage` — trả lời "loại tác vụ nào đang cần cho item này ngay lúc này". Chuỗi
stage SỐNG của domain `coding` hôm nay có bốn tên một item mới đi qua được:
`discovery` (soi phần còn mơ hồ, máy tự làm một mình), `exploring` (đào sâu
cùng người, khi máy tự soi thấy chưa đủ), `planning` (lập hình dạng + phán
chia-việc — xem "Giai đoạn Lập-kế-hoạch" dưới), và `executing` (đã qua các
bước trên, hoặc chưa từng cần qua). `status` vẫn vận hành y hệt BÊN TRONG mỗi
stage — một item ở stage `discovery` vẫn có thể là `todo` hay
`awaiting-human`, ý nghĩa của hai status đó không đổi.

**`clarify` KHÔNG còn là một stage.** Việc làm-rõ ý định của một câu mô tả tự
do nay xảy ra ở bước Init — TRƯỚC khi item tồn tại: cửa nộp gọi một trợ thủ
làm-rõ đọc thẳng văn bản gốc, chỉ hỏi người khi thật sự còn khoảng trống, rồi
mới khai item. Với domain `coding`, cửa khai từ chối `stage: clarify` trên
bất kỳ item mới nào — không phải bằng một luật riêng cho cái tên đó, mà vì
cửa chỉ nhận stage nằm trong danh sách stage của chính domain, và `coding` đã
gỡ tên đó khỏi danh sách. Một domain KHÁC còn khai `clarify` thật (hôm nay:
`fixture-marketing`) vẫn nhận bình thường — quy tắc là "stage phải còn đăng
ký", không phải "cấm chữ clarify". Toàn bộ item `coding` từng đỗ trên tên đó
đã được di trú THẬT sang chuỗi mới (khác `decompose` dưới, vốn được giữ lại
làm bí danh), nên không còn gì mắc kẹt; từ nay một item mở đứng ở stage
domain của nó không còn đăng ký sẽ bị `fgos doctor` gọi tên qua phép kiểm
`work-stage-vocabulary`.
`stage` đầu tiên của một item mới là `discovery`.

Item vào stage `discovery` đi qua **context-discovery**: một lần soi xem
thông tin đã đủ để bắt tay lập kế hoạch chưa. Phép soi này KHÔNG còn tự gọi
một phán-quan lồng bên trong: người gọi — một phiên đang sống, vốn đã tự đọc
và tự lập luận — phải TỰ đưa ra verdict và truyền vào; engine không bao giờ
tự đoán hộ. Chỉ hai lối thay thế còn lại: một artifact quyết định đã commit
dưới `docsRef` được coi là tín hiệu tin-cậy rằng người đã chốt xong, và lượt
quét cơ học của vòng tự hành degrade an toàn về không-làm-gì thay vì đoán bừa.

- **Đủ rõ (`clear`)** — item chuyển thẳng `discovery → planning`, BỎ QUA
  `exploring`; MỘT sự kiện `work.stage` vừa đổi stage vừa gắn lại `verify`
  bằng một lệnh chạy được thật, thay cho placeholder cố định `submit` đã điền
  lúc tạo — không bao giờ để placeholder giả sống sót qua khỏi bước này.
- **Chưa đủ rõ (`unclear`)** — item chuyển `discovery → exploring`: phần còn
  mơ hồ cần một vòng đào sâu cùng người, khóa lại các quyết định sản phẩm,
  trước khi có gì để lập kế hoạch. Chốt xong, item đi tiếp `exploring →
  planning`. Hai đường này là toàn bộ lối ra của `discovery` — không có cạnh
  nào đi thẳng từ đây tới `executing`.
- **Cần người quyết** — item đậu vào `awaiting-human` (như mọi cổng chờ-người
  khác — xem "Bản ghi cổng-người" trên), mang đúng một câu hỏi cụ thể; người
  trả lời xong, item về `todo` (GIỮ NGUYÊN stage), và phép soi chạy lại — lặp
  tới khi đủ rõ. Không có cơ chế "quay lại" riêng; đây là hành vi tự nhiên
  của vòng lặp.

**Ngữ cảnh soi (per discovery-context STR30 / cfae0120):** phép soi không chỉ
đọc title/kind/refs/deps — nó còn đọc toàn văn `description` (Data
Dictionary #17; item không có description, vd tạo qua `add`, đọc ra
"(không có)" — degrade, không nổ), cặp hỏi-đáp MỚI NHẤT của cổng chờ-người
nếu item từng qua đó ("Bản ghi cổng-người" trên), và toàn bộ các lần soi
trước đó của chính item ("Bản ghi cổng discovery" dưới). **Câu trả lời của
người ở đây là quyết định CUỐI CÙNG — không bao giờ hỏi lại một chủ đề đã
được trả lời**; một câu trả lời đủ để thi công phải ra verdict đủ rõ kèm một
`verify` chạy được thật. Known limitation: bản ghi cổng chỉ giữ cặp hỏi-đáp
MỚI NHẤT (gộp-mới-nhất theo id, không phải một mảng lịch sử) — nếu một vòng
làm-rõ cần nhìn lại nhiều vòng hỏi-đáp trước đó, đó là mở rộng sau (xem Open
Gaps).

**Ai chạy context-discovery, khi nào:** hai điểm gọi cùng một phép soi —
(a) lệnh `fgos discover <id>` (gọi tay/agent đang sống, dùng khi người submit
còn ở đó — mode `sync`), mang theo verdict của chính người gọi; (b) vòng tự
hành, MỖI lần chạy, quét TOÀN BỘ item đang ở stage `discovery` và status
`todo` — BẤT KỂ giá trị `mode` mang gì, TRƯỚC khi giao bất kỳ việc thi công
nào trong cùng lượt chạy đó (xem spec Runner). Vòng tự hành là lưới đỡ: dù
phiên sống (mode `sync`) không kịp gọi `discover` — chết giữa chừng, hay
người rời đi không dùng `--async` — lượt chạy kế tiếp vẫn tự quét, không item
nào kẹt vô hình; lượt quét cơ học đó không tự phán hộ mà để item nguyên tại
chỗ. `mode` chỉ là quy ước NGƯỜI-GỌI-NÀO-NÊN-LÀM-TRƯỚC, không phải điều kiện
mà code rẽ nhánh (RUL17 (mode là quy ước gọi, không phải điều kiện code)).

### Bản ghi cổng discovery

Mỗi lần context-discovery soi (dù đủ rõ hay chưa) sinh thêm một **bản ghi
discovery**, ghi CẢ hai kết cục — cùng khuôn "cộng thêm không đè" với bản
ghi friction: mỗi lần soi là một lần xảy ra, APPEND vào danh sách của id,
không bao giờ gộp/đè lên lần trước. Bản ghi không đổi hình dạng khi phán-quan
lồng bên trong rút đi: nó ghi verdict thật sự đã được áp dụng, bất kể verdict
đó do người gọi cung cấp hay do tín hiệu tin-cậy suy ra.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| C1 | đủ rõ | Kết quả soi của lần này | boolean | mỗi lần context-discovery chạy |
| C2 | câu hỏi | Điều cần người làm rõ (chỉ có khi chưa đủ rõ) | free text | khi đủ rõ = false |
| C3 | verify đề xuất | Lệnh proof thật người gọi cung cấp (chỉ có khi đủ rõ) | free text | khi đủ rõ = true |

Item chưa từng qua context-discovery không mang bản ghi discovery nào — vắng
mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)).

### Giai đoạn Lập-kế-hoạch (stage planning)

Mọi item RỜI `discovery` — dù đi thẳng (verdict đủ rõ) hay vòng qua
`exploring` (verdict chưa đủ rõ) — đều hẹn nhau ở `planning` trước khi thi
công: item đã qua kiểm chất lượng thông tin nhưng còn phải qua đúng một phép
phán chia-việc. Không có cạnh nào đi thẳng từ `discovery`/`exploring` sang
`executing`; `planning → executing` là lối vào duy nhất của bước thi công.

**`decompose` là bí danh di sản, CHỈ để tháo cạn (drain-only).** Stage này
từng là tên của chính bước lập-kế-hoạch và đã được đổi tên thành `planning`.
Cái tên cũ được GIỮ LẠI trong sổ đăng ký — cùng hai cạnh `exploring →
decompose` và `decompose → executing` — vì `stage` không nằm trong danh sách
trường sửa được, nên các item đang đỗ trên tên đó không thể gán nhãn lại và
sẽ mắc kẹt vĩnh viễn nếu tên bị gỡ. Nhưng KHÔNG item mới nào còn tới được đây:
`decompose` cố ý không mang mục step-mapping nào, nên phép tra "stage nào thỏa
bước Chia-việc" luôn trả về `planning`. Bí danh này biến mất khi số item còn
đỗ trên nó về 0 (lúc viết lại mục này: 5 item còn mở). Mọi điều mục này nói về
`planning` áp dụng nguyên vẹn cho một item còn đỗ ở `decompose`.

Item vào stage `planning` đi qua **phán chia-việc**: xem item có cần tách
thành các việc con độc lập hay không. Cùng khuôn với context-discovery, phép
phán này KHÔNG còn tự gọi một phán-quan lồng bên trong — người gọi tự lập
luận rồi truyền verdict vào qua verb `plan`.

- **Pass-through** (item đơn giản, hoặc không có gì để chia) — item chuyển
  thẳng `planning → executing`, GIỮ NGUYÊN `verify` đã gắn từ lúc rời
  `discovery`/`exploring` — không có bước gắn lại verify riêng ở đây.
- **Chia (decompose)** — phán sinh ra n ≥ 1 item con ĐỘC LẬP, mỗi con mang:
  field `parent` trỏ về item gốc (lineage — xem Data Dictionary #13), `deps`
  giữa các con nếu phán đề xuất (dùng nghĩa `deps` sẵn có, không phải trường
  mới), một `verify` THẬT — con thừa hưởng ngữ cảnh đã chốt của gốc và vào
  thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán
  chia-việc là nơi duy nhất sản xuất verify đó, không bao giờ để lại
  placeholder — và tùy
  chọn một `footprint` (cùng nghĩa `footprint` sẵn có ở trên, feed cố-vấn
  `fgos conflicts`) khi phán đề xuất đường-dẫn file con đó dự kiến chạm; phán
  không nêu, hoặc nêu sai hình dạng (không phải mảng chuỗi) → con đó ghi
  KHÔNG có `footprint` (vắng, không phải mảng rỗng), không bao giờ làm hỏng cả
  verdict chia. Sinh đủ con xong, gốc chuyển `planning → executing` ngay —
  gốc KHÔNG tự động `done`; nó chỉ dispatch-được khi mọi con đã `done` (xem bộ
  lọc frontier lineage dưới).
- **Cần người quyết (need-human)** — rơi vào cổng có điều kiện khi (a) phán
  tự báo mơ hồ không tách được rành mạch, hoặc (b) item gốc mang risk `heavy`
  (ngưỡng risk cao ánh xạ thẳng vào giá trị risk sẵn có từ classify). Item đậu
  `awaiting-human` (như mọi cổng chờ-người khác) mang một **đề xuất chia**
  (danh sách con + deps dự kiến) làm câu hỏi — CHƯA ghi con nào vào queue.
  Người trả lời xong, item về `todo` (vẫn ở stage `planning`), phán chia-việc
  chạy lại từ đầu ở lượt quét sau (không giữ lại đề xuất cũ, cùng khuôn lặp
  của context-discovery).
- **Verdict KHÔNG HỢP LỆ** — verdict chia sinh ra ít nhất một con THIẾU
  verify thật, hoặc người gọi không cung cấp được verdict nào đọc hiểu được:
  item ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không
  pass-through ngầm; lượt sau thử lại (fail-safe, không bao giờ throw, mẫu hệt
  context-discovery). Một lượt quét cơ học của vòng tự hành tới đây cũng dừng
  ở đúng chỗ đó thay vì đoán bừa một verdict.

**Ai chạy phán chia-việc, khi nào:** verb riêng `fgos plan <id>` (gọi
tay/phiên sống, mode `sync`) — TÁCH BẠCH khỏi `fgos discover`, vốn chỉ phục
vụ `discovery`/`exploring`: gọi nhầm verb cho một item ở stage sai bị từ chối
rõ lý do chứ không âm thầm dispatch chéo. Vòng tự hành cũng quét bước này mỗi
lượt chạy, NGAY SAU lượt quét soi-rõ và TRƯỚC khi giao việc thi công — cùng
lưới đỡ: dù phiên sống chết giữa chừng, lượt chạy kế tiếp vẫn tự quét, và khi
không có verdict nào được cung cấp thì để item nguyên tại chỗ.

**Lineage (`parent`) tách bạch khỏi `deps`:** `parent` trả lời "item này là
hậu duệ của gốc nào", `deps` trả lời "việc nào phải xong trước việc này" —
hai quan hệ không bao giờ trộn; con của một lần chia-việc TUYỆT ĐỐI KHÔNG bao
giờ được ghi vào `deps` của gốc. Bộ lọc frontier (tập việc sẵn-sàng) chặn một
item gốc khi bất kỳ hậu duệ nào của nó (dẫn xuất qua chuỗi `parent`, đệ quy
xuống mọi tầng) chưa `done` — chặn này DẪN XUẤT thuần từ `parent`, không thêm
cơ chế mới, không đụng `deps`. Khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt
frontier ở lượt kế tiếp như một item thường: KHÔNG có bước "đóng bộ" ghi
riêng — `verify` của chính gốc (mang từ lúc rời `discovery`/`exploring`) đóng
vai trò phép kiểm tích hợp cho toàn bộ hậu duệ, và gốc đi hết đường thường
`todo → doing → awaiting-approval → delivered → retrospective → cleanup →
done` như mọi item khác (xem Data Dictionary #4). Một con bị `blocked`
hoặc đỗ giữa chừng không sinh ra một trạng thái "bộ khẩn" riêng — nó dùng
đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn
dispatch cho tới khi con đó (và mọi hậu duệ khác) thật sự `done`.

Item được tạo trước tính năng chia-việc, hoặc tạo qua `add`, không mang
`parent` — vắng mặt hoàn toàn, không lọt vào bộ lọc lineage (tương thích
ngược, RUL11 (tiến hóa schema)).

### Mô hình domain (base-workflow + domain-extension)

Song song với `stage` (chuỗi sống của coding: `discovery`/`exploring`/
`planning`/`executing`, xem hai mục trên), mỗi item còn thuộc về một
**domain** — chiều thứ ba, trả lời "bộ stage nào áp dụng cho item này". Một
domain khai: (a) danh sách stage có thứ tự của nó, (b) mỗi stage đó thỏa bước
nào trong 5 bước của chu trình nền base-workflow (Init/Làm-rõ/Chia-việc/
Thực-thi/Compound-learning — `work-item-lifecycle-vision.md` §2), (c) cạnh
chuyển-stage hợp lệ (`{from,to}`) riêng của domain đó, và (d) skill hướng dẫn
(nếu có) ứng với mỗi stage của nó — `null` nghĩa là "không skill, thi công
máy móc thuần" (str89-fgos-domain-skills). Từ khi vòng đời mọc thêm
phần đuôi sau merge, một domain còn khai thêm ba thứ NGOÀI chiều `stage`:
(e) `worktreeBacked` — item của domain này có đi qua worktree/merge git thật
hay không, (f) nhãn phạm-trù cho từng status ĐẦU chuỗi của nó, để một bên đọc
không-biết-domain vẫn phân loại được "việc này đi tới đâu rồi", và (g) bộ giá
trị `kind`/`risk` hợp lệ khi khai việc. Bảng chuyển-status (`fsm.mjs`) vẫn
KHÔNG BAO GIỜ thuộc về domain — domain được quyền ĐẶT NHÃN cho status, không
được quyền đổi cạnh.

Hôm nay sổ đăng ký có **bốn** domain. `coding` là domain sản xuất thật duy
nhất (xem hai mục trên). Ba domain còn lại đều là fixture minh họa, dùng
một lần, KHÔNG phải sản phẩm marketing/HR/tài-chính thật — mỗi cái đóng đúng
một khoảng trống chứng minh:

- `synthetic` — đúng một stage (`assembling`), chỉ thỏa bước Thực-thi, không
  cạnh chuyển-stage nào (một stage thì không có gì để chuyển): chứng minh mô
  hình chạy được với một domain KHÁC coding.
- `triage` — ba stage mang tên KHÔNG trùng chữ nào với coding
  (`triage`/`shaping`/`assembling`), thỏa lần lượt Làm-rõ/Chia-việc/Thực-thi:
  chứng minh một domain đi qua được các bước đó dưới tên riêng, để mọi lần
  quay lại hard-code tên stage của coding vỡ to thay vì lặng lẽ qua.
- `fixture-marketing` — mượn nguyên hình dạng stage của coding nhưng khai bộ
  nhãn status của RIÊNG nó và một skill tổng-hợp riêng: chứng minh phần khai
  báo per-domain ở (f)/(d) thật sự được đọc từ bảng của chính domain đó, chứ
  không âm thầm rơi về bảng của `coding`.

Cả bốn dispatch qua đúng MỘT sổ đăng ký chung và đúng MỘT đường thi công
(vòng tự hành/CLI) — chứng minh trực tiếp acceptance criterion "domain thứ
hai chạy trên cùng base FSM, chỉ thêm stage riêng, không fork chu trình"
(backlog STR18). Một domain sản xuất thật thứ hai vẫn chưa có (xem Open Gaps).

**`compound-learn` KHÔNG còn là một stage.** Nó từng là stage thứ tư của
`coding`, chèn sau `executing`, giữ chỗ cho bước Compound-learning. Bước tổng
hợp/học sau-thi-công vẫn còn nguyên và vẫn quan sát-được — nhưng nay nằm trên
chiều `status` chứ không phải `stage`: status `retrospective`, một chặng thật
giữa `delivered` và `cleanup` mà mọi item đều đi qua (xem Data Dictionary #4).
Đổi trục như vậy vì phần đuôi sau merge vốn không còn "loại tác vụ" nào để
`stage` phân biệt — chỉ còn "đang ở đâu", đúng câu hỏi `status` trả lời.

Từ str89-fgos-domain-skills, lớp hướng dẫn (P50, xem spec Runner) không còn
giả định ngầm domain `coding`: nó đọc trường `domain` của item rồi tra đúng
sổ đăng ký này để biết skill nào ứng với mỗi stage, thay vì một bảng
skill/stage hard-code cố định. Với `coding` hôm nay: `discovery` →
`fgos-coding-discovering`, `exploring` → `fgos-coding-exploring`, `planning` →
`fgos-coding-planning` (mặc định điểm-vào; phán shaping/proving giữa
`fgos-coding-planning`/`fgos-coding-validating` vẫn là xét-đoán phía phiên của
entry skill, không phải một mục sổ đăng ký thứ hai — `fgos-coding-validating`
KHÔNG có mục riêng nào ở đây, nó chạy như pha thứ hai của chính
`fgos-coding-planning`), `executing` → `fgos-coding-implement`. Bí danh di sản
`decompose` trỏ về CÙNG skill mà `planning` trỏ tới, để một item còn đỗ trên
tên cũ vẫn tra ra một skill có thật.

Cùng BẢNG ĐÓ còn mang thêm một khóa không phải tên stage: **`retrospective`**
— một tên `status` — trỏ tới `fgos-coding-compounding`, skill tổng hợp
sau-thi-công. Hai bộ từ vựng không bao giờ đụng nhau (không stage nào của
coding tên `retrospective`), và "khóa này thuộc bảng tra nào" là việc của bên
gọi, không phải của bảng. `cleanup` cố ý KHÔNG có mục nào: nó là harness
thuần, không skill nào từng nạp cho nó.

**Một domain không bắt buộc thỏa cả 5 bước base-workflow — và việc THIẾU một
bước có hệ quả vận hành thật, không chỉ là khai báo suông (R-domain-1, per
1cd895e1/38160a70).** Nếu một domain không có stage nào thỏa bước Làm-rõ,
item của nó KHÔNG BAO GIỜ được quét vào context-discovery dù đang ở vòng tự
hành — tương tự cho Chia-việc và phán chia-việc. Đây là chủ đích, không phải
khiếm khuyết: một domain không map bước nào tới đó thì item của nó không bao
giờ chạm hai bộ máy này — an toàn, nhưng cũng có nghĩa domain đó KHÔNG dùng
được context-discovery/chia-việc, dù muốn.

Giới hạn này đã HẸP LẠI một bậc so với lúc luật được ghi. Hai bộ máy đó
không còn cố định theo tên stage của `coding` nữa: chúng hỏi sổ đăng ký "stage
nào của domain NÀY thỏa bước Làm-rõ / Chia-việc" rồi dùng đúng tên trả về, nên
một domain khai các bước đó dưới tên riêng (vd `triage` với
`triage`/`shaping`) đi qua được thật. Điều còn lại đúng nguyên văn là mệnh đề
mở đầu: KHÔNG khai bước nào thì không bao giờ chạm bộ máy nào — cái quyết định
là step-mapping, không còn là tên stage.

Item KHÔNG mang trường `domain` đọc ra `coding` — mặc định lazy, cùng khuôn
mặc định lazy của `stage`; `add`/`submit` đều nhận `--domain <tên>` tùy chọn, mặc định
`coding` khi không truyền (xem "Khai việc"/"Nộp vấn đề tự do" dưới). Một giá
trị `domain` không nhận diện được tới điểm đọc nóng của vòng dispatch (bộ lọc
frontier, vòng tự hành, bảng chuyển-stage) KHÔNG BAO GIỜ làm vỡ đường đó: cả
ba rơi về `coding` kèm một cảnh báo, không throw — khác với lúc KHAI
(`validateWork`), nơi một giá trị `--domain` hoặc `stage` không hợp lệ với
domain của item vẫn bị từ chối `validation` như trước (có chủ đích: một bên
là đường nóng không được vỡ, một bên là cửa khai chỉ chạy một lần, sai thì
báo ngay).

### Cửa pull giao–nhận việc (take/return)

Song song với vòng tự hành (runner tự dispatch việc — xem spec Runner), một
**cửa pull** đơn giản cho phép một tác nhân NGOÀI runner — người vận hành,
một phiên đang sống, hay một runner thứ hai — cầm đúng một item và tự trả
kết quả, không qua bất kỳ tiến trình điều phối nào đứng giữa (không
registry/heartbeat/push/lease — tầng đó, khi cần, đắp sau trên cùng nhật ký,
xem Open Gaps). Tập item cửa pull mở ra là ĐÚNG tập frontier mà runner tự
dispatch (`fgos ready`) — cửa pull không mở một tập riêng.

- **`fgos take [--id <id>] [--role human|session]`** (mặc định `human`) —
  cầm đúng một item: không truyền `--id` thì cầm đầu frontier; truyền
  `--id` thì item đó phải ở `status: 'todo'` nếu còn là status đó (một id đã bị
  cầm/đỗ/kẹt rơi thẳng xuống kỳ vọng (CAS) của pre-claim status, báo `conflict`
  thật (mã 3), không phải một thông điệp tùy biến trùng lặp). Claim nhận một bản
  ghi claim runtime (`.fgos/runtime/claims/<id>.json`, gitignored) qua `claimWork`/
  `acquireClaim`. **Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện**
  (*new claims do not durably write into doing*); trạng thái bền (**durable status**)
  giữ nguyên giá trị pre-claim (`todo`, hoặc `blocked` đối với đường tái claim nguồn-nhánh),
  còn `doing` là trạng thái hiệu lực (**effective status**) do lớp phủ runtime (`buildEffectiveView`)
  dẫn xuất: `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)` khi claim đang hoạt động.
  (Nếu một claim bị stale — `preClaimStatus` không còn khớp trạng thái bền hiện tại — `buildEffectiveView`
  bỏ qua claim đó và giữ nguyên trạng thái bền). Bản ghi claim lưu `role` (người cầm), `headAtTake`
  (HEAD hiện tại của host repo, hoặc `branchHeadAtTake` cho nguồn-nhánh), `preClaimStatus` và `preClaimRevision`.
  **Lưu ý (claim-lock):** `take` kiểm frontier nếu item còn `todo` (frontier = executing-stage items), nhưng `pick --id` không
  — `pick` mở cửa claim cho item đang ở `discovery`/`exploring`/`planning` cũng được (status chỉ là
  một trục độc lập từ stage, fsm.mjs; frontier-guard là một hard-check tại tầng verb, không phải luật FSM).
- **`fgos return <id> [--timeout <ms>]`** — trả kết quả, KHÔNG BAO GIỜ tin
  lời người gọi: verb tự đo đủ ba điều kiện, mirror TRUNG THỰC contract
  `awaiting-approval` của chính runner — (a) working tree của host repo phải SẠCH
  (mọi việc đã commit, loại trừ `.fgos/` — store sống tự mutate bởi chính
  take/return/approve nên không bao giờ tính là bẩn), (b) HEAD phải tiến so `headAtTake` (tiến bộ THẬT,
  không phải commit rỗng hay chưa commit gì), (c) verb TỰ CHẠY `verify`
  thật của item (goal-check — cùng một hàm runner dùng, xem spec Runner)
  tại HEAD đó, ngay trong thư mục làm việc hiện hành. Thiếu (a) hoặc (b) →
  từ chối `validation` (mã 4), item giữ nguyên trạng thái hiệu lực `doing`, KHÔNG ghi sự kiện
  nào. Settlement (`settleClaim`) chuyển THẲNG từ `preClaimStatus` ghi trên claim sang `finalStatus`
  ngay trong cùng giao dịch: Verify xanh → `settleClaim` chuyển bền từ `preClaimStatus → awaiting-approval`
  (không qua trạng thái trung gian bền `doing`) + nửa THỰC TẾ của outcome + giải phóng claim file (KHÔNG
  sinh settlement ở đây — settlement thuộc cạnh `→done`, xem "Bài học lúc đóng" trên; nếu `finalStatus === preClaimStatus`,
  `settleClaim` chỉ ghi `work.attempt` mà không ghi `work.move` bền nào). Verify đỏ → `settleClaim`
  chuyển bền từ `preClaimStatus → blocked` (lý do `verify-fail`) + nửa thực tế + một bản ghi friction lớp `verification` —
  mirror đúng đường đỗ của runner.

`return` chỉ hoàn tất một `take`: một item có trạng thái hiệu lực `doing` nhưng KHÔNG mang
`claimRole` là `human`/`session` (nghĩa là claim của chính runner, hoặc một
claim di sản không role) bị `return` từ chối `validation` — cửa pull không
bao giờ đụng vào claim of runner.

#### Cửa pull mở rộng: hoàn tất một đề xuất nguồn-nhánh bị đỗ

Một item `blocked` mang một nhánh đề xuất còn sống (`fgw/<id>` — vd bị đỗ do
chạm trần chống-lặp, xem spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) cũng đi qua CÙNG hai verb `take`/
`return` ở trên, không phải verb riêng — chỉ khác Ở NGUỒN được ghi lại:

- **`take`** trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua
  bản ghi runtime claim mang `preClaimStatus: 'blocked'`, trạng thái bền giữ `blocked`,
  trạng thái hiệu lực hiện `doing`, ghi **`branchHeadAtTake`**
  — HEAD của CHÍNH NHÁNH lúc take, KHÔNG phải HEAD của host repo — thay vì
  `headAtTake`. `branchHeadAtTake` là discriminator DUY NHẤT phân biệt một
  claim nguồn-nhánh với một claim main-based ở bước `return`; nguồn không
  được suy ra từ việc nhánh có tồn tại hay không tại thời điểm return (nhánh
  có thể tồn tại vì lý do khác, xem spec Runner "Cổng duyệt PR nội bộ" —
  phân loại nguồn `runner`/`pull`/`legacy` của cổng duyệt).
- Người commit thêm việc lên NHÁNH (không đụng cây làm việc chính của host
  repo).
- **`return`** kiểm `item.branchHeadAtTake` TRƯỚC ba điều kiện main-based ở
  trên — một claim nguồn-nhánh không mang `headAtTake` nên kiểm main trước
  sẽ từ chối oan. Đo: nhánh phải có commit MỚI kể từ `branchHeadAtTake`, và
  verify của item phải chạy XANH — nhưng chạy trong một **worktree tạm,
  DETACHED tại đúng SHA của nhánh** (không bao giờ checkout theo tên nhánh,
  không dùng cơ chế đòi-lại-worktree-mồ-côi của runner) — cây làm việc chính
  của người đứng KHÔNG BAO GIỜ bị đọc hay đụng tới, kể cả khi người đang
  đứng trên chính nhánh đó ở một worktree khác. Worktree tạm luôn được dọn
  sau khi đo xong, thành công hay thất bại như nhau. Sạch + xanh →
  `settleClaim` chuyển bền từ `preClaimStatus` (`blocked`) sang `awaiting-approval` mang **`branchHeadAtReturn`** (HEAD nhánh tại lúc đo) —
  **TUYỆT ĐỐI không ghi `headAtReturn`** (trộn hai marker cho `reviewDiff`
  của cổng duyệt một dải vô nghĩa). Không có commit mới, hoặc verify đỏ →
  từ chối rõ lý do (nguồn-nhánh: `verify-fail` + friction lớp
  `verification`), item giữ nguyên trạng thái hiệu lực `doing`, nhánh không đổi tip.
- Một đề xuất hoàn tất theo đường này đọc nguồn là `runner` ở cổng duyệt như
  bình thường (nhánh `fgw/<id>` còn sống) — không cần thay đổi cách phân
  loại nguồn của cổng duyệt.

### Phong bì output (envelope) — chuẩn máy-đọc của MỌI verb (per D b2d18cc7, b0da87aa)

**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất
thay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:
`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),
`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không
cần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`
là **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:
verb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả
đúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)
— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò
regex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb
nào lọt lưới và không có hai cách in khác nhau.

**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;
khi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi
(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,
không phải bằng việc dò nội dung phong bì.

**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của
mỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều
dòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo
thời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec
Runner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).

### Sổ verb máy-đọc (manifest) — `--help --json`

CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'2.0'`, per str46-io-contract — tăng từ `'1.0'` vì một trường bị xoá,
xem ngay dưới), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).

**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — hôm nay chỉ `review` và
`approve` mang `externalEffect: true`, đúng chế độ `--github` của chúng;
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).

**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `herdr-plugin/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.

**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.

### Trợ giúp theo từng verb — `fgos <verb> --help`

Gọi `--help` (không kèm `--json`) SAU tên một verb cụ thể (vd `fgos submit
--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,
ví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả
`init`.

- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).

### Sổ đăng ký công cụ (tool registry) — hai chiều, tách chuẩn "đăng ký" khỏi "đang hiện diện"

Cổng vào cho một mảnh distillery đã porting (tsk-1dj, ported từ
repository-harness's tool-registry-capability — xem
`docs/distillery/deep-dives/tool-registry.md`): một registry hai chiều —
project **đăng ký** công cụ (tool) nào phục vụ **capability** (nhãn tự do,
chuẩn hóa kebab-case) nào, rồi bất kỳ bước nào cần capability đó **hỏi**
registry thay vì hardcode tên tool cụ thể ("core consults capabilities,
never tools" — US-027, ported nguyên vẹn).

- `view.tools` (bản chiếu, gộp từ hai sự kiện mới `tool.register`/
  `tool.remove` cùng cơ chế fold sẵn có — không store riêng, không schema
  SQL riêng): `{ [name]: { name, kind, capability, command, scanTarget?,
  responsibility?, description? } }`. `kind` ∈ `cli|binary|mcp|skill|http`
  — quyết định `tool check` probe bằng cách nào (PATH cho cli/binary; quét
  `scanTarget` trên đĩa cho mcp/skill — hai kind này vốn không nằm trên
  PATH; TCP probe ngắn cho http). `capability` LUÔN chuẩn hóa kebab-case
  lúc `register` (nhiều cách viết cùng gộp về một chuỗi).
- **`register`/`remove` là quyết định TEAM** — qua `.fgos/events.jsonl`
  như mọi sự kiện khác, cùng cửa ghi CTR002, `view.tools` fold y hệt
  `view.work` fold từ `work.add`/`work.move`.
- **`check`'s kết quả (`status`, `checkedAt`) là SỰ THẬT VỀ MÁY NÀY, không
  phải quyết định team** — KHÔNG qua event-log. Ghi vào một file cục bộ
  gitignored riêng, `.fgos/tool-status.local.json` (đặt cạnh
  `events.jsonl`, không phải trong nó) — cùng tinh thần "trạng thái máy
  này tách khỏi cấu hình được chia sẻ" mà `.fgos/sessions.json`/
  `.fgos/*.lock` đã theo trong `.gitignore`. `tool check` LUÔN thoát mã 0
  — thiếu tool là một sự thật cần báo cáo, không phải lỗi CLI ("absent
  capability = clean skip, never a failure" — nguyên tắc lõi item này
  port qua).
- **Đọc gộp lúc `query`:** `view.tools` (đăng ký) overlay file cục bộ
  (trạng thái máy này). Một tool đã đăng ký nhưng CHƯA từng `check` trên
  máy này đọc là `unknown` — KHÔNG BAO GIỜ là `missing` (`missing` nghĩa
  là đã probe và không thấy). Đây là phân biệt cốt lõi của US-027: "chưa
  đăng ký" (vô hại, `inactive`) khác hẳn "đăng ký rồi mà probe ra
  missing/unknown" (gap thật, `degraded`).

### Đăng ký/gỡ/probe/hỏi công cụ (tool register / check / query / remove)

- **Runs when:** người/agent gọi `fgos tool <register|check|query|remove>
  ...`.
- **Blocked when:** `register` — thiếu `--name`/`--kind`/`--capability`/
  `--command`, `--kind` ngoài `cli|binary|mcp|skill|http`, `--capability`
  chuẩn hóa ra rỗng, hoặc `--kind mcp|skill` thiếu `--scan` (hai kind này
  không nằm trên PATH) — tất cả `validation`; `--name` đã tồn tại —
  `validation`. `remove` — `--name` chưa từng đăng ký — `validation`.
  `check --name x` — `x` chưa đăng ký — `validation`. `check`/`query`
  không có điều kiện chặn nào khác — `check` LUÔN thoát 0 kể cả khi mọi
  tool được probe đều `missing`.
- **What changes:** `register` — một sự kiện `tool.register` (bản ghi ĐẦY
  ĐỦ, ghi đè theo `name` — không có `tool.edit`, đăng ký lại một `name` đã
  gỡ là một `tool.register` mới, sạch). `remove` — một sự kiện
  `tool.remove` (xóa hẳn key khỏi `view.tools`, không phải tombstone).
  `check` — KHÔNG sự kiện nào; ghi đè các entry được probe trong
  `.fgos/tool-status.local.json` (entry của tool không nằm trong lượt
  probe này, vd gọi kèm `--name`, giữ nguyên). `query` — không gì, đọc
  thuần.
- **Side effects:** `check` gọi `command -v`-tương-đương qua PATH thật
  (cli/binary) hoặc mở một kết nối TCP ngắn thật (http) — không mock.
- **Afterwards:** `query --capability X [--status present]` trả về TẬP
  provider (nhiều tool cùng phục vụ một capability, bổ sung lẫn nhau —
  không loại trừ), mỗi provider kèm `status` đã gộp overlay cục bộ. Bất kỳ
  bước nào (skill/AGENTS.md của một project khác) muốn "hỏi trước khi làm
  X" tự chèn câu gọi `query` vào đúng chỗ cần — injection là hợp đồng văn
  xuôi (prose contract), KHÔNG có hook cấu trúc nào tự động gọi `query` hộ
  (phát hiện cốt lõi của deep-dive: ngay cả repository-harness, nơi sinh
  ra cơ chế này, cũng không tự động hóa bước đó).

## Behaviors & Operations

### Khởi tạo (init)

- **Runs when:** người/agent gọi `fgos init` tại thư mục làm việc — bước đầu
  tiên trước khi bất kỳ verb nào khác dùng được kho work-state.
- **Blocked when:** không có điều kiện chặn — `init` luôn thành công bất kể
  phát hiện gì (per install-coexistence / f1715488).
- **What changes:** tạo `.fgos/` rỗng (nhật ký rỗng + bản chiếu rỗng) tại cwd
  nếu chưa có; quét READ-ONLY project tìm marker của harness agent khác đã có
  mặt (thư mục dấu ấn — `.bee/`, `.claude/`, `.codex/`, `.cursor/` là tập khởi
  đầu, mở rộng được — và khối managed trong `AGENTS.md` của host nếu file đó
  tồn tại); ghi kết quả phát hiện vào `.fgos/coexistence.json` (manifest v1:
  `territory` {data, worktrees {descriptor, resolved}, branches} +
  `detected_harnesses`), và in ra output những gì phát hiện được.
- Cộng thêm, phi-chặn: `init` còn tự kiểm project directory có phải một repo
  git với HEAD resolve được hay không (`git rev-parse --verify --quiet HEAD`,
  bọc try/catch fail-safe — git vắng mặt hay repo chưa có commit nào đều rơi
  cùng một nhánh, không phân biệt); khi KHÔNG resolve được, kết quả trả về
  mang thêm trường `gitHeadless: true` — một trường dữ liệu cộng-thêm trên
  phong bì `fgos.v1` sẵn có, không banner riêng, không đổi mã thoát, không
  chặn `init` (per D ecfd0d1a). Repo có ≥1 commit: không mang trường này
  (vắng mặt, không phải `false`) — hành vi/hình dạng output không đổi cho case
  đã có từ trước.
- **Side effects:** không ghi/sửa/xóa bất kỳ file nào thuộc harness khác —
  host không có `AGENTS.md` thì `init` bỏ qua bước đó, không tự tạo.
  Lỗi đọc một marker (vd `AGENTS.md` hỏng quyền) không chặn `init` — ghi nhận
  lỗi vào manifest, `init` vẫn thành công (fail-safe).
- **Afterwards:** re-init trên cùng project ghi lại manifest nhất quán
  (idempotent — không tích lũy/trùng lặp entry qua nhiều lần chạy). Doctrine
  đầy đủ (lãnh địa, một-nhạc-trưởng-mỗi-phiên, Known Gaps): `docs/coexistence.md`.

### Khai việc (add) — bề mặt nội bộ

`add` không còn là cửa vào của câu chuyện public (đó là `submit`, per stage-intake) — vẫn hoạt động nguyên vẹn cho test/tooling nội bộ, đòi người
gọi tự điền mọi trường (kể cả tự đặt id kebab-case), khác hẳn UX "nộp rồi đi"
của `submit`. **Đã quyết (STR22, per work-item-verb-surface): giữ `add`
làm bề mặt nội bộ, không xóa** — bộ test hiện dùng `add` để tự điền id/field
trực tiếp (9 file) tiếp tục dùng nguyên trạng; tài liệu/spec không giới thiệu
`add` như một cửa vào public ở bất kỳ đâu khác.

- **Blocked when:** thiếu trường bắt buộc, id sai dạng kebab-case, id trùng, dep trỏ id không tồn tại, `--domain` không khớp domain nào trong sổ đăng ký — tất cả trả phạm trù `validation` (mã 4), KHÔNG sự kiện nào được ghi.
- **What changes:** một sự kiện khai-item vào nhật ký, item xuất hiện trong bản chiếu ở `todo`.
  - **domain** — tùy chọn qua `--domain <tên>`; vắng mặt đọc ra `coding` (mặc
    định lazy). `add` KHÔNG truyền `--stage` — vắng mặt `stage` tự đọc ra
    stage thỏa bước Thực-thi của domain đó (per "Mô hình domain" trên), nên
    một item `add --domain synthetic` (domain chỉ có một stage, thỏa Thực-thi)
    sẵn sàng dispatch ngay, không cần qua context-discovery/chia-việc.
  - **acceptance** — tùy chọn qua `--acceptance '<json>'` (mảng `{text,evidence}`,
    Data Dictionary #24); giá trị hỏng dạng (không parse được, không phải
    mảng, một clause thiếu/rỗng `text`) bị chặn ở `validation` (mã 4) trước
    khi merge, cùng khuôn mọi trường khác của `add`; vắng cờ thì
    `item.acceptance` vắng mặt hoàn toàn, không mặc định mảng rỗng (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)).
- **Side effects:** không.
- **Afterwards:** người/agent thấy item trong `list`; clone khác thấy sau khi nhận commit chứa nhật ký.

### Nộp vấn đề tự do (submit)

- **Runs when:** người/agent gọi `fgos submit "<mô tả>" [--async|--unattended] [--domain <tên>] [--deps <id1,id2,...>] [--tier <bậc>] [--kind <loại>] [--risk <mức>]` —
  song song với `add`, không thay thế; dùng khi người submit không muốn/không
  thể tự điền các trường tách rời của `add`.
- **Blocked when:** thiếu mô tả (không truyền văn bản nào) — `validation` (mã
  4), KHÔNG sự kiện nào được ghi; `--deps` trỏ một id không tồn tại —
  `validation` (mã 4) qua ĐÚNG cửa kiểm `add` đã dùng, KHÔNG sự kiện nào được
  ghi. Không có điều kiện chặn nào khác — mọi mô tả không khớp từ khóa phân
  loại nào vẫn tạo item thành công (rơi về mặc định an toàn), đúng tinh thần
  "không bao giờ chặn vì không đoán được loại".
- **What changes:** một sự kiện khai-item (đúng loại `work.add` như `add`,
  không phải sự kiện mới) vào nhật ký. Các trường được suy tự động từ mô tả:
  - **title** — câu/dòng đầu tiên của mô tả, hoặc một đoạn cắt gọn nếu mô tả
    không có ranh giới câu tự nhiên.
  - **id** — sinh từ title, kèm hậu tố chống trùng; nếu trùng với id đã có
    (hai mô tả tương tự nhau), tự thử lại với hậu tố khác cho tới khi ra một
    id chưa dùng.
  - **tier, kind, risk** — mặc định suy bằng cách đếm các từ khóa rủi ro/loại-việc
    xuất hiện trong mô tả (quy tắc cơ học, không dùng model/AI) — không khớp
    từ khóa nào thì `tier`/`risk` về mặc định `standard`, `kind` về mặc định
    `task`. Ba cờ tùy chọn `--tier`/`--kind`/`--risk` (str51-llm-assist-classify)
    GHI ĐÈ suy luận cơ học TỪNG TRƯỜNG MỘT khi có mặt — cờ nào vắng thì
    trường đó vẫn suy như cũ, không phụ thuộc các cờ khác có mặt hay không
    (per RUL60 (submit — ba cờ ghi-đè tier/kind/risk, độc lập từng trường) dưới). Luôn ghi đè được bằng một sửa (`edit`) sau đó dù trường
    đến từ suy luận hay từ cờ tường minh.
  - **verify** — một giá trị placeholder cố định, đánh dấu "chưa xác định" —
    một stage sau bổ sung proof thật.
  - **mode** — `sync` nếu không truyền cờ; `async` nếu truyền `--async` hoặc
    `--unattended` (hai cờ cùng nghĩa). Chỉ được GHI lại ở bước này, chưa có
    hành vi nào khác đi kèm — không có gì tự động đậu chờ người ở bước submit,
    kể cả với `--async`.
  - **deps** — tùy chọn qua `--deps <id1,id2,...>`, mirror HỆT cách `add` đã xử
    lý deps từ trước: mỗi id được kiểm tồn tại + kiểm chu trình qua ĐÚNG cửa
    ghi `addWork` mọi verb khác dùng, không cửa ghi mới; vắng cờ → `deps: []`,
    y hệt hành vi `submit` trước khi cờ này tồn tại (per str83-fgos-slash-commands / 757e5dd7).
  - item xuất hiện trong bản chiếu ở `todo` — y hệt `add`, ngay lập tức actionable
    nếu deps rỗng (mặc định của submit).
  - **domain** — tùy chọn qua `--domain <tên>`; vắng mặt đọc ra `coding`.
  - **acceptance** — tùy chọn qua `--acceptance '<json>'`, mirror HỆT `add`
    (Data Dictionary #24, RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)): cùng kiểm hỏng-dạng, cùng khuôn vắng-cờ-là-
    vắng-mặt, không mặc định mảng rỗng.
  - **stage** — stage của domain đó thỏa bước Làm-rõ, nếu domain đó có (per
    "Mô hình domain" trên); với `coding` (mặc định/vắng mặt) là `discovery`,
    stage đầu chuỗi (xem "Giai đoạn Soi-rõ" dưới) — item từ `submit`
    KHÔNG BAO GIỜ xuất hiện trong `ready` cho tới khi context-discovery cho
    qua, dù deps đã rỗng. Một domain KHÔNG có stage nào thỏa bước Làm-rõ (vd
    `synthetic`) nhận stage đầu tiên trong danh sách khai của domain đó thay
    thế — bỏ qua context-discovery hoàn toàn (per R-domain-1 trên); `submit`
    cho một domain như vậy chưa có proof thật (`verify` vẫn là placeholder
    của `submit`, không ai điền lại) — dùng `add --domain <tên> --verify ...`
    cho một domain bỏ-qua-discovery thay vì `submit`.
- **Side effects:** không.
- **Afterwards:** kết quả in ra là work item vừa tạo, bọc trong phong bì máy-đọc
  (xem dưới); item xuất hiện trong `list` ngay (ở stage `discovery`); chỉ xuất
  hiện trong `ready` sau khi qua context-discovery VÀ phán chia-việc.

### Chạy context-discovery (discover)

- **Runs when:** người/agent gọi
  `fgos discover <id> [--verdict clear|unclear] [--tier <bậc>] [--kind <loại>] [--risk <mức>]`
  — điểm gọi tay/phiên-sống (mode `sync`). Verb này phục vụ ĐÚNG hai stage đầu
  chuỗi (`discovery`, `exploring`); item ở stage lập-kế-hoạch dùng verb `plan`
  riêng bên dưới, KHÔNG dispatch chéo. Vòng tự hành cũng quét đúng hai stage
  này mỗi lượt chạy (xem spec Runner) — cùng hành vi, khác điểm gọi.
- **Blocked when:** item không tồn tại — `validation`; item đang ở stage mà
  verb này không phục vụ — báo rõ và chỉ sang verb đúng, không âm thầm làm
  việc khác. Người gọi tương tác KHÔNG cung cấp verdict cũng bị từ chối, trừ
  khi tín hiệu tin-cậy (artifact quyết định đã commit dưới `docsRef`) trả lời
  thay: engine không bao giờ tự đoán verdict hộ.
- **What changes:** một bản ghi discovery (xem trên); rồi HOẶC một sự kiện
  đổi-stage `discovery → planning` (verdict `clear`, kèm `verify` thật) hoặc
  `discovery → exploring` (verdict `unclear`) hoặc `exploring → planning`
  (đã chốt xong), HOẶC một sự kiện đổi-status sang `awaiting-human` (kèm câu
  hỏi) khi còn cần người quyết. Kèm theo, khi người gọi có truyền
  `--tier`/`--kind`/`--risk`: một bản vá phân loại lên chính item — đây là
  chỗ `tier`/`kind`/`risk` được phán LẠI sau khi có bằng chứng, thay
  cho giá trị đếm-từ-khoá mà `submit` gán lúc sinh. Ba cờ đều tùy chọn và
  độc lập từng trường.
- **Side effects:** không có lời gọi model nào từ bên trong verb. Phán-quan
  lồng bên trong đã rút — lập luận nằm ở người gọi, verb chỉ áp dụng verdict
  nhận được. Bản vá phân loại đi qua ĐÚNG một chốt chặn dùng chung với đường
  headless của runner: chỉ áp dụng khi cả kết cục lẫn verdict đều `clear`,
  nên một verdict `unclear` (hay một tranh chấp `verify` đang park) không bao
  giờ ghi phân loại; và một giá trị ngoài từ vựng của domain bị từ chối
  TRƯỚC khi verb ghi bất cứ thứ gì. Trước đây chỉ đường headless có hợp đồng
  dữ liệu này còn đường tương tác chỉ có prose ("skill tự nhớ gọi `fgos
  edit`") — hai đường nay dùng chung một cửa.
- **Afterwards:** verdict `clear` → item sang `planning` (chưa lọt `ready` —
  còn một giai đoạn nữa phải qua) với `verify` thật, không còn placeholder;
  verdict `unclear` → item sang `exploring`; cần người → item xuất hiện trong
  `list` ở `awaiting-human` kèm câu hỏi, y hệt mọi cổng chờ-người khác. Mọi
  nhánh chưa xong đều trả lời xong rồi gọi lại `discover` (hoặc để vòng tự
  hành tự quét) sẽ soi lại.

### Chạy phán chia-việc (plan)

- **Runs when:** người/agent gọi
  `fgos plan <id> [--verdict pass-through|decompose|need-human] [--children <json>]`
  — verb RIÊNG cho stage `planning` (và bí danh di sản `decompose`), tách bạch
  khỏi `discover` ở trên: một item đứng sai stage bị từ chối rõ lý do thay vì
  được dispatch nhầm phép phán. Vòng tự hành quét bước này NGAY SAU lượt quét
  soi-rõ và TRƯỚC khi giao việc thi công.
- **Blocked when:** item không tồn tại — `validation`; item không ở stage
  lập-kế-hoạch — chỉ sang `discover`. Verdict chia mà có bất kỳ con nào thiếu
  `verify` thật là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item
  ở nguyên trạng cho lượt sau (fail-safe, không bao giờ throw).
- **What changes:** HOẶC một sự kiện đổi-stage `planning → executing`
  (pass-through, hoặc sau khi sinh đủ con), HOẶC các sự kiện khai-con cộng sự
  kiện đổi-stage của gốc (verdict chia), HOẶC một sự kiện đổi-status sang
  `awaiting-human` mang đề xuất chia (cần người quyết), HOẶC không gì cả nếu
  verdict không hợp lệ (xem "Giai đoạn Lập-kế-hoạch" trên).
- **Side effects:** không có lời gọi model nào từ bên trong verb — cùng lý do
  với `discover` ở trên. Khi item tới `executing`, verb NHẢ luôn claim của
  item về `todo`: phiên nào cầm tiếp việc thi công phải claim lại qua cửa pull.
- **Afterwards:** pass-through hoặc chia xong → item/gốc sang `executing`,
  xuất hiện trong `ready` khi deps/lineage cũng đã mở; cần người quyết →
  `awaiting-human` mang đề xuất chia, trả lời xong thì phán lại từ đầu.

### Chuyển trạng thái (move)

- **Blocked when:** (a) cạnh chuyển không có trong bảng — `todo→doing`, `doing→delivered`, `doing→awaiting-approval`, `awaiting-approval→delivered`, `delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`, `awaiting-approval→todo` (bắt buộc lý do), `awaiting-approval→blocked` (bắt buộc lý do — per pr-lifecycle / 1359ab5e, cạnh gate duyệt gãy: merge conflict hoặc verify đỏ sau merge, xem spec Runner "Cổng duyệt PR nội bộ"), `todo/doing→blocked`, `blocked→todo/doing`, `blocked→awaiting-approval` (per fan-out-parallel — cạnh cơ học, KHÔNG bắt buộc lý do, dành riêng cho một lần đồng bộ-lại/catch-up sạch, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)"), `todo/doing→awaiting-human` (bắt buộc câu hỏi), `awaiting-human→todo` (bắt buộc câu trả lời) là toàn bộ cạnh hợp lệ — trả `precondition` (mã 2); (a2) cạnh từ-chối `awaiting-approval→todo` hoặc cạnh gate-gãy `awaiting-approval→blocked` thiếu/rỗng lý do, hoặc cạnh vào chờ thiếu/rỗng câu hỏi, hoặc cạnh rời chờ thiếu/rỗng câu trả lời — trả `validation` (mã 4); (b) trạng thái thực khác `--expect` — trả `conflict` (mã 3); (c) cờ thiếu giá trị hoặc rỗng (`--to` trống, `--expect ""`) — trả `validation` (mã 4), không bao giờ lọt sang phạm trù 2/3; (d) **`--to delivered` khi nhánh `fgw/<id>` tồn tại mà CHƯA reachable từ trunk** (per tsk-5dk — `git merge-base --is-ancestor`, đo trực tiếp trong `case 'move'`, không tái dùng đường suy-luận-từ-git của cleanup-harness) — trả `validation` (mã 4), TRỪ KHI cờ `--override-reason "<lý do>"` được truyền kèm giá trị không rỗng; item không có nhánh `fgw/<id>` (item pull/legacy, hoặc fixture trạng thái thuần) hoặc có nhánh nhưng ĐÃ reachable không bị chặn — xem Data Dictionary #28/#29. Bốn trường hợp trên KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái (kèm from/to) vào nhật ký, rồi bản chiếu cập nhật — luôn theo thứ tự nhật-ký-trước, bản-chiếu-sau.
- **Side effects:** không, TRỪ đường override ở (d) — khi `--override-reason` cho phép một `--to delivered` vượt qua kiểm reachability, một bản ghi `decision` (kind `engine`) được ghi TRƯỚC sự kiện chuyển-trạng-thái, mang chính lý do đó làm `rationale` — luôn kiểm được sau này qua nhật ký quyết định của item, không âm thầm.
- **Afterwards:** `done` là cửa một chiều ra: item đã done thì mọi lần move tiếp theo đều bị `precondition`; nay chỉ tới được `done` qua đúng một cạnh `cleanup→done`, sau khi item đã đi hết chuỗi đuôi `delivered → retrospective → cleanup`. Item bị từ chối về `todo` mang lý do trong nhật ký, vào lại hàng chờ làm tiếp. Cạnh `awaiting-approval→todo` (reject) hoặc `awaiting-approval→blocked` (gate gãy) mang `reason`: giá trị MỚI NHẤT còn được fold thêm lên chính item (`item.reason`, Data Dictionary #18, latest-wins) — không chỉ nằm trong nhật ký sự kiện, để consumer sau (prompt worker, người đọc `list`) thấy lý do mới nhất mà không cần lục nhật ký (per worker-execution STR33 / 396d9d9e, xem spec Runner RUL23 (hợp đồng con — verify thật, không placeholder)). Cạnh `blocked→awaiting-approval` (per fan-out-parallel) là cạnh DUY NHẤT rời `blocked` không mang `reason` và không đi qua `doing` — dành riêng cho một lần đồng bộ-lại (catch-up) sạch, phân biệt với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, đi qua chống-lặp bình thường như mọi lần nhận việc khác); xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)".

### Sửa việc (edit) — luôn ghi đè được (STR23, per work-item-verb-surface)

`edit` là cửa công khai để sửa đè các trường trên một item ĐÃ có sẵn — đóng
khoảng trống "luôn ghi đè được" mà `submit`'s phân loại cơ học (mechanical
classification) để lại (item vào qua `submit` không có cơ hội sửa lại field
đã phân loại sai). Ghi qua CÙNG một cửa ghi duy nhất (CTR002, `src/state/
store.mjs`) như `add`/`move` — không tạo cửa ghi thứ hai. Danh sách trường
được sửa (RỘNG): `title`, `kind`, `risk`, `verify`, `tier`, `refs`,
`deps`, `acceptance` (per str73-done-flip-cos-check — Data Dictionary #24,
RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done); ghi qua `JSON.parse`, không phải `parseListFlag` của `refs`/`deps`,
vì text clause có thể chứa dấu phẩy), `priority`, `intent` (per str7-str8-priority-intent —
Data Dictionary #25/#26; `--priority` ép kiểu số nguyên không âm, `--intent` ép
kiểu số nguyên bất kỳ dấu; truyền cờ KHÔNG kèm giá trị theo sau bị chặn tường
minh — không bao giờ âm thầm biến thành số nhờ ép kiểu boolean). Cố tình KHÔNG sửa được `id` (định danh bất biến), `status` (thuộc
`move`), `stage` (thuộc `moveStage` nội bộ, chưa có verb công khai), hay
`domain` — mỗi trường đó đã có cửa ghi riêng, gộp vào `edit` sẽ tạo cửa
ghi thứ hai cho cùng một trường.

- **Blocked when:** id không tồn tại — `validation` (mã 4); patch rỗng
  (không cờ `--<field>` nào được truyền) — `validation`; patch chứa một
  trường ngoài danh sách ở trên (kể cả cố tình truyền `id`/`status`/
  `stage`/`domain`) — `validation`, bị chặn TRƯỚC khi merge vào bản ghi; giá
  trị sau merge không qua được `validateWork` (vd `--tier` ngoài domain,
  `--deps` trỏ id không tồn tại, `--priority` âm) — `validation`; `--priority`/
  `--intent` truyền không kèm giá trị — `validation`, không bao giờ ghi `1`.
  Cả các trường hợp trên KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện `work.edit` mang patch (CHỈ những trường
  thật sự đổi, không phải toàn bộ bản ghi) vào nhật ký; bản chiếu gộp thêm
  (Object.assign) đúng những trường đó lên item — additive, không bao giờ
  ghi đè lại một sự kiện cũ (per RUL11 (tiến hóa schema)).
- **Side effects:** không.
- **Afterwards:** hai lần `edit` liên tiếp trên cùng item đều đọng lại —
  patch sau không xóa mất trường patch trước đã đổi (mỗi lần chỉ gộp đúng
  các key nó mang). Bỏ qua một cờ `--refs`/`--deps` giữ nguyên trường đó;
  truyền cờ với giá trị rỗng (`--refs ''`) XÓA trường về `[]` — hai trường
  hợp này phân biệt được, không lẫn vào nhau (cùng cơ chế `parseListFlag`
  `add` đã dùng). `edit --acceptance '<json>'` GHI ĐÈ TOÀN MẢNG mỗi lần
  (latest-wins), cùng ý nghĩa nhưng qua `JSON.parse` riêng — không có cơ chế
  sửa-từng-clause (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)). `edit` chạy được y hệt bất kể `status` hiện tại của item
  là gì — verb này không bao giờ tự đổi `status`. Không có cơ chế CAS/
  `--expect` ở slice này (mỗi `edit` đã là một sự kiện cộng thêm nên giá trị
  cũ luôn phục hồi được qua nhật ký, không như một ghi-đè thật trong kho có
  thể biến đổi).

### Ghi quyết định (decision)

- **Blocked when:** thiếu nội dung chữ — `validation`.
- **What changes:** một sự kiện quyết-định vào nhật ký; quyết định đọc được lại từ bản chiếu sau replay.

### Đưa vào chờ người (ask)

- **Runs when:** người/agent gọi `fgos ask <id> --text "..."` để đậu một việc lại chờ người quyết.
- **Blocked when:** item không ở `todo`/`doing` (cạnh vào chờ không hợp lệ) — `precondition`; câu hỏi thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu hỏi vào nhật ký; item sang `awaiting-human`, bản chiếu gộp câu hỏi vào bản ghi cổng của item (theo id).
- **Side effects:** không.
- **Afterwards:** `list` hiện item ở `awaiting-human` kèm câu hỏi; `ready` không còn liệt kê item; mọi việc khác vẫn chạy bình thường — cổng bất đồng bộ, không chặn tiến trình khác. Việc đậu vô thời hạn cho tới khi có người trả lời.

### Trả lời (answer)

- **Runs when:** người gọi `fgos answer <id> --text "..."` để trả lời câu hỏi của một việc đang chờ.
- **Blocked when:** item không ở `awaiting-human` (không có cạnh rời chờ từ trạng thái khác) — `precondition`; câu trả lời thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu trả lời vào nhật ký; item về status trước lúc `ask` đậu nó (`statusAtAsk`, ghi lúc `ask`, mặc định `todo` khi vắng — log cũ/gate không mang field này) — **`todo`** nếu item chưa bị cầm claim lúc hỏi, hoặc **`doing`** nếu một claim `pick`/`take` đang sống lúc hỏi (claim-lock §5.1: trước đây LUÔN về `todo` trần, làm rớt claim đang giữ nếu `ask` xảy ra giữa lúc item `doing` — đã sửa). Bản chiếu gộp câu trả lời vào bản ghi cổng (cạnh câu hỏi đã có vẫn còn — cộng thêm, không đè).
- **Side effects:** không.
- **Afterwards:** item lại actionable — về `todo` thì xuất hiện trong `ready` khi deps đủ điều kiện; về `doing` thì KHÔNG xuất hiện trong `ready` (claim vẫn đang giữ, chờ `fgos return` như bình thường). Bản ghi cổng giữ cả câu hỏi lẫn câu trả lời để tra sau.

### Ghi kết quả dự đoán/thực tế (outcome)

- **Runs when:** không qua verb CLI riêng — được ghi từ bên trong vòng tự hành (spec Runner): nửa dự đoán ngay khi item được nhận việc; nửa thực tế khi item tới trạng thái cuối, CẢ khi thành công lẫn khi thất bại.
- **Blocked when:** thiếu id — `validation`.
- **What changes:** một sự kiện outcome vào nhật ký cho MỖI nửa (hai sự kiện riêng biệt, cùng id, đến ở hai thời điểm khác nhau); bản chiếu gộp hai nửa theo id — nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất.
- **Side effects:** không.
- **Afterwards:** `fgos check` đọc được cả hai nửa cho item đó ngay khi chúng tồn tại; item chưa từng chạy hoàn toàn không xuất hiện trong `check`.

### Đọc kết quả (check)

- **Runs when:** người/agent gọi `fgos check [id]`.
- **Blocked when:** nhật ký hỏng → `corrupt-log`. Không bao giờ ghi gì — đọc thuần, cùng họ với `list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** truyền id → in đúng một khối cho item đó, mỗi nửa (dự đoán/thực tế) in giá trị thật nếu đã có, hoặc thông báo "chưa có dữ liệu" nếu nửa đó chưa tới; không truyền id → in một khối cho mỗi item ĐANG có ít nhất một nửa outcome; kho/log không mang bản ghi outcome nào → in đúng một dòng "chưa có dữ liệu" — thành công, không phải lỗi.

### Sinh chỉ mục đọc-theo-tag tài liệu người-dùng-cuối (docs-index)

- **Runs when:** người/agent gọi `fgos docs-index`.
- **Blocked when:** không có điều kiện chặn riêng — verb đọc-thuần với trạng thái item (quyền `read`): nó đọc bản chiếu outcome để truy ngược linkage và đọc cây tài liệu trên đĩa; nhật ký hỏng thì tầng đọc chung báo `corrupt-log` như mọi bên đọc. Không bao giờ ghi sự kiện, không đổi trạng thái item, không sửa tài liệu nào.
- **What changes:** ghi/ghi-đè đúng một tệp manifest `docs/enduser-docs-index.json` — một artifact dẫn xuất, không phải sự kiện hay bản chiếu trạng thái.
- **Afterwards:** manifest liệt kê mỗi tài liệu người-dùng-cuối tìm thấy dưới các thư mục quadrant, kèm linkage ngược về capture đã sinh nó (hoặc `null` cho tài liệu di sản chưa có linkage). Cơ chế đầy đủ (hình dạng manifest, ánh xạ quadrant→mục-đích/đối-tượng, cách truy linkage, tính idempotent, dung sai thư mục quadrant vắng) đặc tả ở area **`enduser-docs-index`** — bề mặt CLI sống ở đây (cửa lệnh `fgos` một cửa), hành vi chi tiết sống ở spec area đó, cùng khuôn `review`/`approve` trỏ sang spec Runner.

### Xem tiến độ theo bộ (rollup)

- **Runs when:** người/agent gọi `fgos rollup <id>` để hỏi "việc tôi nộp tới đâu rồi" cho một item gốc (per stage-clarify / STR24).
- **Blocked when:** thiếu id — `validation`; id không tồn tại trong bản chiếu — `validation`, cùng khuôn `requireField`/not-found với `review`/`approve`. Không bao giờ ghi gì — đọc thuần, cùng họ với `check`/`list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** in item gốc (title + status), rồi đếm con TRỰC TIẾP (qua `parent`, dựng từ STR16 decompose) đã `done` trên tổng số con (`k/n done`), rồi liệt kê từng con kèm status riêng của nó; item gốc không có con nào vẫn in `0/0 done` cộng một ghi chú rõ ràng "không có con" — không throw, không coi là lỗi.

### Xếp hạng tác động backlog (triage)

- **Runs when:** người/agent gọi `fgos triage` để hỏi "việc nào nổi lên chú ý" — cửa 2 của triage, phân biệt với STR14 intake-triage (cửa 1, phân loại rủi ro/lane lúc submit) — per deep-dive work-item-management.md, STR21.
- **Blocked when:** nhật ký hỏng → `corrupt-log`. Không bao giờ ghi gì — đọc thuần, cùng họ với `rollup`/`check`/`list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** in mọi item CHƯA `done`, xếp hạng theo `blocks` — số item khác CŨNG CHƯA `done` đang liệt kê id đó trong `deps` — giảm dần, tie-break id tăng dần; item `done` không bao giờ xuất hiện trong danh sách VÀ không bao giờ được đếm vào `blocks` của item khác (một dep đã `done` không còn "chặn" ai); backlog rỗng hoặc mọi item đã `done` → một dòng thông báo rõ ràng, không throw. `blocks` là một proxy tác động (fan-out chặn), KHÔNG phải trường `priority` trên schema (đó là phạm vi STR7/STR8, còn `awaiting-approval`) — một derive thuần trên `deps` sẵn có, cùng tinh thần với `frontier.mjs`'s derive trên `parent`.

### Cầm việc qua cửa pull (take)

- **Runs when:** một tác nhân ngoài runner gọi `fgos take [--id <id>] [--role human|session]`.
- **Blocked when:** `--role` khác `human`/`session` — `validation`; không truyền `--id` và frontier rỗng — `validation`; `--id` truyền một id không tồn tại — `validation`; `--id` truyền một item còn `todo` nhưng CHƯA nằm trong frontier (stage/deps/lineage chưa mở) — `validation`, thông điệp nói rõ "take chỉ mở đúng tập runner dispatch-được"; `--id` truyền một item đã bị cầm/đỗ/kẹt — rơi thẳng xuống CAS của pre-claim status, báo `conflict` thật (mã 3). Mọi nhánh chặn KHÔNG ghi sự kiện nào.
- **What changes:** Tạo một bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`) lưu `role` (`human`), `headAtTake` (Data Dictionary #14/#15), `preClaimStatus` (`todo` hoặc `blocked`), `preClaimRevision`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện (*new claims do not durably write into doing*); trạng thái bền giữ nguyên pre-claim, trạng thái hiệu lực hiển thị `doing` qua lớp phủ runtime (`buildEffectiveView`). Một sự kiện outcome nửa DỰ ĐOÁN (tier/số dep/số lần nhận trước đó) được ghi cho cùng item — đối xứng claim của runner (xem spec Runner).
- **Side effects:** không.
- **Afterwards:** item hiển thị trạng thái hiệu lực `doing`, biến mất khỏi frontier (giống mọi claim khác); `fgos check` đọc được nửa dự đoán ngay; item chờ một `fgos return` để tới kết cục.

### Cầm việc + dựng workspace (pick)

- **Runs when:** một tác nhân ngoài runner gọi `fgos pick [id]` — cùng cửa pull với `take`/`return`, nhưng gộp thêm bước dựng workspace trong MỘT lệnh.
- **Blocked when:** không truyền `id` và frontier rỗng — `validation` (no-id mở frontier-head như `take`); `id` truyền một id không tồn tại — `validation`; `id` truyền một item đã bị cầm/đỗ/kẹt — rơi thẳng xuống CAS của pre-claim status, báo `conflict` thật (mã 3) — HỆT `take`, không có cờ `--role` (role LUÔN `session`, không đọc/chấp nhận cờ đó). **Khác `take`: explicit `--id` không kiểm frontier** (claim-lock §3a) — `pick` nên cầm item ở BẤT KỲ stage nào nếu còn `status: 'todo'` (item đang ở `discovery`/`exploring`/`planning` đều được), miễn status chưa thay (CAS trong `moveWork` là guard thật).
- **What changes:** Tạo một bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`) lưu `role: 'session'` + `headAtTake` (hoặc `branchHeadAtTake` cho đường nguồn-nhánh), `preClaimStatus`, `preClaimRevision`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký (*new claims do not durably write into doing*); trạng thái bền giữ pre-claim, trạng thái hiệu lực hiển thị `doing`. Một sự kiện outcome nửa DỰ ĐOÁN được ghi cho cùng item, HỆT `take`. NGAY SAU claim thành công, một worktree + nhánh `fgw/<id>` được dựng (hoặc tái dùng nếu đã sống) qua CHÍNH `createWorktree` vòng tự hành dùng — không đường dựng workspace riêng.
- **Side effects:** nếu dựng workspace thất bại SAU KHI claim đã thành công, lỗi đó lộ ra nguyên vẹn cho người gọi — claim KHÔNG bao giờ bị âm thầm hoàn tác (không rollback tự động); item ở lại trạng thái hiệu lực `doing`, không worktree.
- **Afterwards:** người/phiên thấy item vừa claim VÀ đường dẫn worktree + tên nhánh của nó; item biến mất khỏi frontier như mọi claim khác; item chờ một `fgos return` để tới kết cục — HỆT vòng đời của một claim qua `take` (per str83-fgos-slash-commands / 757e5dd7).

### Trả việc qua cửa pull (return)

- **Runs when:** người/phiên đang cầm một item qua `take` gọi `fgos return <id> [--timeout <ms>]`.
- **Blocked when:** item không tồn tại — `validation`; item không mang trạng thái hiệu lực `doing` — `validation`; item mang trạng thái hiệu lực `doing` nhưng `claimRole` không phải `human`/`session` (claim của runner) — `validation`, `return` chỉ hoàn tất một `take`; item thiếu `headAtTake` (claim di sản/không qua `take`) — `validation`; working tree host repo KHÔNG sạch (loại trừ `.fgos/` — store sống tự mutate bởi chính `return`, không bao giờ tính là bẩn) — `validation`; HEAD chưa tiến so `headAtTake` — `validation`; `--timeout` không phải số dương — `validation`. KHÔNG có nhánh chặn nào ghi sự kiện.
- **What changes:** verb TỰ CHẠY `verify` thật của item (goal-check) tại HEAD hiện hành, trong thư mục làm việc hiện hành — không bao giờ tin lời người gọi. Verify xanh: `settleClaim` chuyển bền trực tiếp từ `preClaimStatus → awaiting-approval` (mang thêm `headAtReturn`, Data Dictionary #16, per pr-lifecycle / 1359ab5e), giải phóng claim file, cộng một sự kiện outcome nửa THỰC TẾ (kết cục `awaiting-approval`, đạt goal-check, số commit kể từ `headAtTake`). Verify đỏ: `settleClaim` chuyển bền từ `preClaimStatus → blocked` (lý do `verify-fail`), giải phóng claim file, cộng nửa thực tế (kết cục `blocked`, không đạt), cộng một bản ghi friction lớp `verification`.
- **Side effects:** một tiến trình con chạy `verify` của item (shell, trong `cwd` hiện hành).
- **Afterwards:** verify xanh → item ở `awaiting-approval` mang `headAtReturn`, chờ người duyệt qua cổng `review`/`approve`/`reject` như mọi đề xuất khác (xem spec Runner "Cổng duyệt PR nội bộ" — dải `headAtTake→headAtReturn` là nguồn diff của một đề xuất pull-door) — KHÔNG sinh settlement ở bước này (settlement thuộc cạnh `→done`); verify đỏ → item ở `blocked`, mang một bản ghi friction verification, đi lại đường `blocked → todo` thường như mọi item đỗ khác.

### Dựng lại (rebuild) — thao tác phục hồi

- **Runs when:** người/agent gọi, đặc biệt khi bản chiếu mất hoặc nghi lệch so với nhật ký.
- **What changes:** bản chiếu được dựng lại từ zero bằng phát lại toàn bộ nhật ký — kết quả giống hệt bản chiếu trước đó (đã chứng minh bằng test đầu-cuối chạy lệnh thật: xóa bản chiếu → rebuild → so sánh sâu bằng nhau).
- **On failure:** nhật ký có dòng cuối dở dang (đứt giữa chừng khi ghi) → báo `corrupt-log` (mã 5) nói rõ lỗi, phần nguyên vẹn phía trước vẫn đọc được; hỏng ở GIỮA nhật ký là lỗi cứng, không tự sửa, không nuốt.

### Đọc (list / ready)

- **Blocked when:** nhật ký hỏng → `corrupt-log` (mã 5). Đọc không bao giờ ghi gì — chạy bao nhiêu lần nhật ký cũng không đổi một byte (có test so byte khóa).
- **ready:** trả danh sách việc sẵn-sàng dẫn xuất từ trạng thái (`todo` + mọi dep đã ngã-ngũ thật, tức từ `delivered` trở đi hoặc đã hủy + đang ở stage `executing` + không còn hậu duệ dang dở qua `parent`; dep đang `awaiting-approval`/`doing`/`blocked`/`awaiting-human` KHÔNG mở việc phụ thuộc), thứ tự đúng thứ tự khai việc; kho chưa khởi tạo → danh sách rỗng, thành công. Đầu ra máy-đọc-được. Item `awaiting-human` không lọt vào tập này vì chỉ trạng thái `todo` mới sẵn-sàng — cổng chờ-người được loại "miễn phí" bởi chính bộ lọc trạng thái, và một item có dep đang chờ-người cũng không được mở. Item còn ở stage `discovery`/`exploring`/`planning` cũng không lọt vào tập này dù status là `todo` — "sẵn sàng" nghĩa là đã qua cả context-discovery lẫn chia-việc, không chỉ đã hết dep. Một item gốc còn hậu duệ dang dở cũng không lọt vào tập này dù bản thân nó `todo`+`executing` — lineage (`parent`) là một chiều lọc riêng, tách khỏi `deps`.
- **Thứ tự sẵn-sàng là một HỢP ĐỒNG CÓ VERSION (STR43 S4, nâng lên v2 bởi str7-str8-priority-intent).** Thứ tự `ready` trả về là hợp đồng phân-thứ-tự có tên, có số phiên bản — v2 hiện hành: khóa 1 `priority` ASC (Data Dictionary #25, vắng mặt xếp cuối) → khóa 2 `intent` DESC (Data Dictionary #26, vắng mặt xếp cuối) → khóa 3 (tie-break) FIFO theo thứ tự khai việc, chính là toàn bộ khóa của v1. Đây là bề mặt DUY NHẤT quyết định thứ tự cầm-giao việc; sort ổn định (`Array.prototype.sort`) nên một view mà không item nào mang `priority`/`intent` cho kết quả BYTE-GIỐNG-HỆT v1 — v2 không đổi hành vi của bất kỳ nhật ký nào chưa từng dùng hai trường mới.

### Đọc metrics đồ thị (graph) — bề mặt đọc-thuần STR43

Một verb đọc-thuần trả **metrics CƠ HỌC** của đồ thị công việc, fold từ nhật ký, qua envelope CTR001. Không bao giờ ghi, không bao giờ gọi model — chỉ tính SỰ THẬT đồ thị cho một bên đọc (picker STR7, planner-brain STR8) dùng làm đầu vào, thay vì tự suy lại topology (stance RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item)). Mọi số liệu deterministic (cùng nhật ký → cùng kết quả → `data_hash` ổn định).

- **Connected-components (mấy mũi song song độc lập):** nhóm các item liên kết qua BẤT KỲ cạnh phụ-thuộc hoặc lineage nào (coi vô hướng) thành từng thành phần. Hai item ở hai thành phần khác nhau không chia sẻ dep/lineage → làm song song hoàn toàn được. Item không cạnh nào là một thành phần đơn.
- **Critical path (đường tới hạn / độ sâu):** chuỗi phụ-thuộc DÀI NHẤT trong đồ thị `deps` (bảo đảm phi-chu-trình ở cửa ghi) — độ dài là số bước tuần tự tối thiểu trước khi item sâu nhất khởi động được.
- **Stale-blocked (chuỗi kẹt):** các item `todo`/`blocked` còn ≥1 dep chưa `done` (kể cả một dep KHÔNG tồn tại — kẹt vĩnh viễn), kèm danh sách dep đang chặn. Item đã sẵn-sàng (mọi dep done) không liệt kê.
- **Greedy top-k-unblock (nên làm gì tiếp):** xếp hạng tham-lam dưới-mô-đun các item chưa `done` theo lượng công việc hoàn thành nó sẽ MỞ KHÓA — mỗi lượt chọn item phủ được nhiều hậu-duệ-chưa-done MỚI nhất; báo cả tổng hậu duệ (`unblocks`) lẫn phần mở mới biên (`newlyUnblocks`).
- **What-if (hoàn thành X → mở khóa gì):** `graph --what-if <id>` trả riêng tác động của một item: tổng hậu-duệ-chưa-done transitive + `newlyReady` (các item phụ thuộc trực-tiếp mà MỌI dep KHÁC đã `done` → hoàn thành X làm chúng thỏa-dep). Là sự thật phụ-thuộc, KHÔNG phải đủ-điều-kiện-frontier (không xét stage/lineage).
- **Frame (computed/skipped + revision):** mỗi payload metrics kèm một `frame` — `revision` (dấu vân tay view deterministic, S3) để một bên đọc cache theo revision và bỏ qua tính lại khi không đổi; `computed[]`/`skipped[]` nêu metric nào đã chạy: greedy `topUnblock` (metric duy nhất siêu-tuyến-tính) bị BỎ QUA trên đồ thị lớn (quá `maxNodesForGreedy`), giữ đọc luôn có biên.
- **Blocked when:** như mọi đọc — nhật ký hỏng → `corrupt-log` (mã 5); không bao giờ ghi một byte.
- Chỉ các id thật (có trong view) được nhóm/tính — một cạnh trỏ tới id không tồn tại (dangling parent/dep) không bao giờ tạo nút ma.
- **Đầu ra time-relative:** `graph`/`what-if`/components/critical-path là deterministic; chỉ advisory `stale` (dưới) mang thời-gian-thực nên `data_hash` của nó đổi theo thời gian đã trôi — đúng bản chất "kẹt bao lâu rồi".

### Cố vấn item kẹt ở `doing` (stale) — đọc-thuần, KHÔNG tự thu hồi (S8)

`stale` phân loại các item đang `doing` là kẹt-hay-không theo NGƯỠNG-THEO-CHỦ, gợi ý — không bao giờ hành động:

- **Ngưỡng theo chủ (người ≫ agent):** claim của `runner` là claim AGENT (ân hạn ngắn, mặc định 15 phút); claim của `human`/`session`/khác là claim NGƯỜI (ân hạn dài, mặc định 24 giờ). Cùng một tuổi claim có thể kẹt với agent mà chưa kẹt với người. Ngưỡng ghi đè được.
- Chỉ liệt kê item kẹt, kèm `ageMs`/`thresholdMs`/`suggestion`. **Gợi ý không bao giờ mô tả thu-hồi tự-động** — đúng luật đã khóa: reap của runner chỉ thu hồi claim của CHÍNH nó khi crash, không bao giờ thu hồi claim của một người. Đây là bên cố-vấn: phân loại + gợi ý, người quyết.
- Item không tìm được thời-điểm-claim bị bỏ qua (không bao giờ tuổi NaN).

### Cố vấn xung đột dấu chân file (conflicts) — chống đụng độ fan-out song song (S9)

`conflicts` tìm rủi ro đụng-độ-file giữa các item CÓ THỂ giao SONG SONG. Tập ứng viên là frontier (`ready` = item giao được ngay bây giờ), nên mỗi xung đột là thật: một runner song song có thể nhặt cả hai cùng lúc.

- Mỗi item có thể khai một **`footprint`** — danh sách đường-dẫn file nó dự kiến chạm (`add --footprint a,b`). Trường phụ TÙY CHỌN, cưỡi SCHEMA_VERSION lúc bằng 2 tại thời điểm nó được thêm vào (SCHEMA_VERSION hiện hành nay là 3, per str46-io-contract), vắng-khi-không-khai; là nội dung cụ thể cho hai trường CTR003 có-tên-mà-rỗng (`forbidden_paths`/`required_outputs`). PHI-CHẶN: chỉ nuôi cố-vấn này, không vào cycle-check/frontier.
- Mỗi cặp ready chia sẻ ≥1 đường-dẫn footprint được nêu kèm đường-dẫn chung + **lựa chọn giải quyết** `sequence`/`hoist`/`re-slice`. Bên cố-vấn CHỈ gợi ý — không bao giờ tự re-slice hay sửa deps. Item không khai footprint không bao giờ xung đột.

## Actors & Access

| Capability | Người vận hành | Agent trong repo | Clone/máy khác |
|---|---|---|---|
| Mọi thao tác ghi (init/add/move/decision/ask/answer) | ✓ qua cửa lệnh duy nhất | ✓ qua cửa lệnh duy nhất | — (nhận qua commit) |
| Trả lời một cổng chờ-người (answer) | ✓ — người là bên quyết | ✓ về mặt cơ chế (cùng cửa lệnh); ai được phép trả lời cổng nào chưa phân quyền | — |
| Đọc (list) / rebuild | ✓ | ✓ | ✓ sau khi clone/pull |
| Ghi thẳng vào nhật ký hay bản chiếu không qua cửa | — cấm | — cấm | — cấm |

## Business Rules

- **RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất).** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lại được từ zero — không bao giờ là truth (per 451ca088; luật nền L3).
- **RUL2 (mọi mutation đi qua đúng một cửa ghi).** Mọi mutation đi qua đúng MỘT cửa; mỗi mutation để lại đúng một sự kiện.
- **RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau).** Thứ tự ghi bất biến: sự kiện vào nhật ký TRƯỚC, bản chiếu cập nhật SAU; bản chiếu lệch thì rebuild là đường phục hồi.
- **RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal).** Chuyển trạng thái chỉ theo bảng cạnh tường minh; `done` terminal, không lối ra (per fd17309a; mở rộng per phase-2-routing / feed7428). `done` nay có ĐÚNG MỘT lối vào — `cleanup→done` — tới được sau một chuỗi tuần tự `delivered → retrospective → cleanup`. Hai lối vào cũ (`doing→done` thao tác tay, `awaiting-approval→done` duyệt đề xuất) KHÔNG còn tồn tại: chúng nay dừng ở `delivered`, và điều kiện "phải đi qua bước tổng hợp trước khi đóng" không còn được cưỡng chế bằng một gate gắn ở cửa `done` nữa mà bằng chính hình dạng tuần tự của chuỗi đuôi — không có đường vòng nào để lách qua `retrospective`.
- **RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù).** Ghi có kỳ vọng: trạng thái thực khác kỳ vọng → từ chối, không ghi đè mù.
- **RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp).** Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp (per luật L4 / 14ebeea9).
- **RUL7 (schema item mang đủ chất liệu trả lời sáu câu hỏi harness).** Schema item mang đủ chất liệu trả lời sáu câu hỏi harness: refs (đọc gì/contract), kind (loại), risk (rủi ro), verify (proof), learn (bài học) (per luật L5).
- **RUL8 (deps phải trỏ id tồn tại, cấm tự trỏ).** Deps phải trỏ id tồn tại, cấm tự trỏ; một loại item duy nhất, không cấp bậc entity.
- **RUL9 (tầng này quản việc của chính forgent, chưa generic hóa cho consumer khác).** Tầng này quản việc của chính forgent; không generic hóa cho consumer khác khi chưa tới lượt (per 9ac6ca50).
- **RUL10 (tiền đề có ngưỡng).** Một người ghi tại một thời điểm; khi nhiều agent ghi đồng thời thành tải chính, mở lại thiết kế store theo ngưỡng đã ghi trong luật L3 (per ae461c8b). **Bổ chú (fgos-multi-session-checkout Epic 3 / STR35):** cửa ghi sự kiện `appendEvent` nay tự khóa liên-tiến-trình bằng một `.fgos/events.lock` riêng (chính sách CHẶN-có-timeout — thử lại với backoff cho tới khi thắng hoặc hết giờ, mirror `acquireSessionsLock` chứ KHÔNG phải lối lùi-không-chặn của `acquireRunnerLock`; một thể hiện thứ ba độc lập của cùng primitive wx-atomic-create + gặt-pid-chết, không đụng `runner.lock`/`sessions.lock`). Nhờ đó hai tiến trình `fgos` chạy song song không còn cùng đọc một `seq` cuối rồi cùng ghi `seq+1` — đua trùng-seq trên nhật ký append-only (đã xác nhận bằng spike) bị đóng NGAY TẠI append. Hết timeout khi giành khóa → phạm trù lỗi MỚI `lock-timeout` (tách bạch `corrupt-log`/`validation`: nghĩa là "đang có người ghi, thử lại cả thao tác", không phải hỏng dữ liệu). **Bổ chú 2 (store-atomic-rmw):** dư lượng trên — khóa chỉ đóng đua tại chính append, không đóng đua đọc-sửa-ghi cấp cao ở `store.mjs` — nay ĐÃ ĐÓNG. `events.mjs` xuất thêm `withEventsLock(logPath, fn)` (giữ nguyên `.fgos/events.lock` hiện có, không khóa mới) và `appendEventLocked` (lõi không-tự-khóa của `appendEvent`, dùng khi khóa đã đang giữ). `addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`) trong MỘT phiên giữ khóa đó — tiến trình thứ hai giành khóa sẽ đọc lại SAU KHI sự kiện của tiến trình thứ nhất đã nằm trong nhật ký, nên tiền-kiểm của nó phát hiện đúng xung đột (`validation` "already exists" hoặc `conflict` CAS) thay vì cùng qua rồi cùng ghi. `refreshView` (dựng lại bản chiếu + ghi `state.json`) vẫn chạy SAU khi khóa nhả, không đổi. `runner.lock`/hàng-ghi ở tầng vòng lặp không đụng tới.
- **RUL12 (frontier dẫn xuất).** Việc-kế-tiếp là truy vấn dẫn xuất từ trạng thái, không bao giờ là danh sách tay; dep chỉ mở việc phụ thuộc khi việc đó thật sự đã ngã-ngũ — đề xuất chưa duyệt KHÔNG mở (per phase-2-routing / luật RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù) nền tảng). "Ngã-ngũ" tính từ `delivered` trở đi (`delivered`/`retrospective`/`cleanup`/`done`), cộng item bị hủy: ngưỡng thật là "code đã vào cây chính", đúng nghĩa hẹp mà `done` vốn mang không chính thức cho phép kiểm này trước khi chuỗi đuôi tách các chặng đó ra thành tên riêng. Một item đang nằm ở `retrospective`/`cleanup` vì thế không giữ chân việc phụ thuộc nào — phần đuôi là tổng-hợp và thu-hồi, không phải phần việc mà ai đó còn phải chờ.
- **RUL11 (tiến hóa schema).** Nhật ký đã commit bất khả xâm phạm — không bao giờ migration ghi đè; replay tương thích ngược có test khóa (bản ghi di sản thiếu trường nhận default khai báo, fixture nhật ký Phase 1 thật là chuẩn nghiệm thu); mỗi sự kiện mới mang phiên bản schema (per phase-2-routing / feed7428). **Miễn trừ pre-release** (viết lại tại chỗ cho phép trong lúc sản phẩm chưa phát hành, hết hiệu lực ở v1.0.0): xem `0017-mien-tru-viet-lai-nhat-ky`.
- **RUL13 (bản ghi outcome, cộng thêm không đè).** Dự đoán và thực tế của cùng một item là hai sự kiện outcome riêng, gộp theo id ở bản chiếu; nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất nửa trước (per phase-3-compound-learning / 1a80b4d3). Đây là một ca cụ thể của luật tiến hóa schema RUL11 (tiến hóa schema): cộng thêm, không migration, log cũ replay nguyên vẹn không sinh outcome nào.
- **RUL14 (cổng chờ-người, awaiting-human).** "Chờ người quyết" là một trạng thái RIÊNG, tách bạch khỏi `blocked` (kẹt vì lỗi/runner-park) — "việc đang chờ tôi" tra được sạch theo một status. Là MỘT trạng thái chung, không đẻ nhiều loại cổng (need-review/need-approval/…) khi chưa có consumer thật cần — nội dung câu hỏi/câu trả lời đã gánh phần "chờ gì". Mỗi cổng mang một cặp câu hỏi/câu trả lời cụ thể, không chỉ nhãn: câu hỏi ghi lúc vào chờ, câu trả lời ghi lúc người trả lời. Đậu VÔ THỜI HẠN — không timeout, không hết-hạn, không đánh-thức tự động; người quay lại lúc nào trả lời lúc đó. Người trả lời qua một lệnh CLI; câu trả lời thành một sự kiện trong nhật ký, rồi item RỜI `awaiting-human` về `todo` và chạy tiếp. Câu hỏi của một cổng đang chờ đọc được qua `list` sẵn có — không cần surface đọc riêng. Tất cả per 65c642a8 (khóa exploring async-human-gate).
- **RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng).** Bộ chọn việc-sẵn-sàng và runner KHÔNG BAO GIỜ pick một item `awaiting-human`; một item có dep đang `awaiting-human` cũng không được mở (dep chỉ mở khi thật `done`). Đây là tiêu chí nghiệm thu, không phải khuyến nghị: một việc chờ người mà runner vẫn pick thì phá cả ý nghĩa cổng (per 65c642a8). Là hệ quả trực tiếp của RUL12 (chỉ `todo` mới sẵn-sàng) áp cho trạng thái mới — không cần điều kiện lọc thêm, có test khóa cả hai chiều.
- **RUL16 (submit là cơ học, không bao giờ chặn).** Phân loại tier/kind/risk của `submit` chỉ đếm từ khóa, không gọi model/AI; mô tả không khớp từ khóa nào KHÔNG BAO GIỜ chặn tạo item — luôn rơi về mặc định an toàn, luôn ghi đè được sau (per stage-intake / 9f6b52c8). **Bổ chú (self-improve loop STR13 Slice 2):** bộ từ khóa rủi-ro-nặng quyết định tier `heavy` không còn riêng của `submit` — nó là MỘT nguồn dùng chung với phép thử-từ-khóa của Iron Law (xem spec Runner "Iron Law — phân loại rủi ro của một candidate fix"), và đã được mở rộng thêm 13 từ khóa (nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán) — `submit` từ nay phân loại `heavy` cho các mô tả trùng từ khóa mới này, một thay đổi hành vi CHỦ Ý, không phải hồi quy.
- **RUL17 (mode là quy ước gọi, không phải điều kiện code).** Trường `mode` do `submit` ghi lại chế độ đã dùng khi tạo item; KHÔNG có đoạn code nào (submit, discover, hay vòng tự hành) đọc/rẽ nhánh theo giá trị của nó. Ý nghĩa của `mode` là quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-discover-TRƯỚC (per stage-intake / 9f6b52c8, làm rõ tại stage-clarify / 9a19eea5): `sync` gợi ý phiên đang sống nên tự gọi `discover` ngay; `async` gợi ý không ai làm vậy, để vòng tự hành lo. Dù người gọi bỏ qua gợi ý này (gọi sai chiều, hoặc không gọi gì cả), RUL18 (stage — chiều vĩ mô song song với status) đảm bảo item vẫn được xử lý.
- **RUL18 (stage — chiều vĩ mô song song với status).** Mỗi item mang thêm một trường `stage`, tách bạch khỏi `status` (vi mô): `stage` trả lời "loại tác vụ nào đang cần", `status` trả lời "việc đang ở đâu trong vòng đời của tác vụ đó". Với `coding` hôm nay bộ giá trị sống là `discovery`/`exploring`/`planning`/`executing`, cộng bí danh di sản `decompose`. Item vào hệ qua `submit` bắt đầu ở stage đầu chuỗi của domain nó (`discovery` với `coding`); qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing` (per stage-clarify / 9a19eea5). `stage` chỉ có nghĩa ở PHẦN ĐẦU vòng đời: từ `awaiting-approval` trở đi không còn cạnh chuyển-stage nào, nên chiều trả lời "đang ở đâu" từ đó là `status`, không phải `stage`.
- **RUL19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode).** Mỗi lượt chạy, vòng tự hành quét TOÀN BỘ item đang ở stage soi-rõ của domain nó (`discovery` với `coding`) VÀ `status: todo` — không phân biệt giá trị `mode` — TRƯỚC khi giao bất kỳ việc thi công executing nào trong cùng lượt. Lượt quét cơ học này KHÔNG tự phán hộ verdict: không có verdict do người gọi cung cấp thì nó để item nguyên tại chỗ, chờ một phiên sống. Không bao giờ chạm item đang `awaiting-human` (hệ quả trực tiếp của RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng), áp dụng cho cả sweep này). Đảm bảo không item nào kẹt vô hình dù phiên sống đã chết giữa chừng hoặc người submit bỏ đi không gọi `discover` (per stage-clarify / 9a19eea5).
- **RUL20 (settlement — kênh 1 của capture 2 kênh).** `role` là trường cộng-thêm tùy chọn trên chính ngã-ngũ (`work.move`/`work.stage`) — không sinh event mới. Bản ghi settlement là bề mặt đọc dẫn xuất từ ba loại ngã-ngũ đã có (clarify-pass/answer/close), cộng thêm không đè theo id, và giữ nguyên nhật ký di sản thật (không tự "mọc" bản ghi cho một ngã-ngũ tiền-phiên-bản) (per phase-3-compound-learning S3-closeout / 96a65365; hoàn thành quyết định trì hoãn 719cbe3a).
- **RUL21 (câu-6 tự động — bài học lúc đóng).** Bất kỳ item nào tới `done` — nay qua đúng một lối vào `cleanup→done` — đều tự động sinh một bản ghi học cơ học — không phán xét, không gọi model. Soạn bài học là best-effort: lỗi soạn không bao giờ chặn việc đóng item; item không dữ liệu nào trước đó vẫn nhận một bản ghi tối thiểu, không rỗng-im-lặng (per phase-3-compound-learning S3-closeout / 96a65365).
- **RUL22 (mọi item qua chia-việc trước executing).** Item rời chuỗi soi-rõ luôn vào stage `planning` trước — dù đi thẳng (`discovery → planning`, verdict đủ rõ) hay vòng qua `exploring` (`discovery → exploring → planning`). Không có cạnh nào đi từ `discovery`/`exploring` thẳng tới `executing`: `planning → executing` là lối vào duy nhất của bước thi công. Item đơn giản được phán pass-through rẻ; chỉ item cần chia mới tốn công thật (per stage-decompose / 43f257ae).
- **RUL23 (hợp đồng con — verify thật, không placeholder).** Mỗi con sinh ra từ phán chia-việc phải mang `verify` THẬT (lệnh chạy được) ngay từ lúc sinh — con thừa hưởng ngữ cảnh đã chốt của gốc và vào thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán chia-việc là nơi sản xuất verify đó. Verdict có bất kỳ con nào thiếu verify là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item ở nguyên trạng cho lượt quét sau (per stage-decompose / 43f257ae).
- **RUL24 (lineage `parent` tách bạch với `deps` về lưu trữ và điều-phối).** `parent` là quan hệ lineage (hậu duệ→gốc); `deps` là quan hệ chặn. Về LƯU TRỮ và ĐIỀU-PHỐI hai quan hệ không bao giờ trộn: con của một lần chia-việc TUYỆT ĐỐI KHÔNG được ghi vào `deps` của gốc (per stage-decompose / 43f257ae). **Bổ chú (work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** "tách bạch" nay giới hạn ở lưu trữ + điều-phối; cho phép kiểm PHI-CHU-TRÌNH, `deps` và `parent` được chiếu thành MỘT đồ thị cạnh-định-kiểu hợp nhất (RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)) — không mâu thuẫn: con vẫn không nằm trong `deps` của gốc, chỉ là cả hai cạnh cùng được một phép kiểm chu trình soi.
- **RUL25 (frontier chặn gốc theo lineage, gốc tự chứng minh khi bộ đóng).** Bộ lọc frontier chặn một gốc khi bất kỳ hậu duệ nào (qua chuỗi `parent`, đệ quy) chưa `done` — dẫn xuất thuần từ `parent`, không cơ chế mới. Khi hậu duệ cuối đóng, gốc tự lọt frontier như một item thường; `verify` của chính gốc (mang từ lúc rời chuỗi soi-rõ) là phép kiểm tích hợp của cả bộ — không có bước "đóng bộ" ghi riêng, không auto-`done` không chứng minh (per stage-decompose / 43f257ae).
- **RUL26 (cổng-người có điều kiện trên kết quả chia).** Con mặc định vào queue thẳng; item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`. Chế độ sync hỏi ngay trong phiên, dấu vết y hệt async (per stage-decompose / 43f257ae).
- **RUL27 (settlement `clarify-pass` theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict).** Bản ghi settlement kind `clarify-pass` khóa theo cạnh RỜI stage ĐẦU CHUỖI của domain nó — với `coding` hôm nay là `discovery` — không theo cạnh ĐẾN, để việc chèn stage mới ở giữa không làm câm bản ghi settlement đã có (per stage-decompose / 43f257ae); cái đổi khi `clarify` rút là stage nào giữ vai "đầu chuỗi", không phải hình dạng của luật. Tên `clarify-pass` GIỮ NGUYÊN như một nhãn di sản: nó là giá trị đã ghi vào nhật ký append-only, không phải một tên stage, nên đổi tên sẽ vô hiệu các bản ghi cũ mà chẳng được gì. RỜI stage đầu chuỗi là điều kiện CẦN nhưng không ĐỦ: từ khi một verdict `unclear` cũng đổi stage (`discovery → exploring`, item vẫn đậu `awaiting-human` với câu hỏi mở), settlement chỉ ghi khi verdict dẫn tới chính cạnh đó không phải `clear: false` — đọc từ bản ghi `work.discovery` mà `resolveDiscovery` ghi ngay trước `work.stage` của nó, chứ KHÔNG đọc cạnh ĐẾN (giữ nguyên lý do khóa-theo-cạnh-RỜI ở trên) và KHÔNG thêm trường mới vào payload (replay là fold thuần trên log đã ghi, một cờ ghi ở nguồn chỉ sửa được các cạnh ghi SAU khi sửa). Log không mang verdict đọc được (log di sản, hoặc một lệnh đổi stage chạy tay) vẫn ngã-ngũ y như trước. Hệ quả cần biết: các hop SAU đó (`exploring → planning`, `planning → executing`) KHÔNG sinh settlement — chúng không bao giờ mang cạnh RỜI `discovery`.
- **RUL28 (cửa pull take/return — mirror trung thực, không tin lời).** `take` mở đúng tập frontier runner dispatch-được (`readyWork`), không bao giờ mở một tập riêng (per stage-decompose / 43f257ae). `return` không bao giờ chuyển `doing → awaiting-approval` chỉ vì người gọi tự báo xong: nó tự đo working tree sạch + HEAD tiến so `headAtTake` (tiến bộ THẬT) + tự chạy `verify` thật của item, cùng khuôn "không tin lời" của RUL13 (bản ghi outcome, cộng thêm không đè); verify đỏ đi đúng đường `blocked` + friction như runner tự đỗ. Không sinh settlement ở `return` — settlement chỉ sinh ở cạnh `→done` (per stage-decompose), giữ đúng một nguồn sự thật cho "đóng bộ" (per 6f2cbc47, a30a3d3c).
- **RUL29 (cạnh `awaiting-approval→blocked` — gate duyệt gãy, bổ sung schema duy nhất của pr-lifecycle).** Cổng duyệt (spec Runner "Cổng duyệt PR nội bộ") khi gặp merge conflict hoặc verify đỏ sau merge chuyển item `awaiting-approval → blocked` mang `reason` bắt buộc, cùng khuôn enforce-reason với `awaiting-approval→todo` — cạnh MỚI DUY NHẤT mà feature này thêm vào bảng FSM (per pr-lifecycle / 1359ab5e). `todo` bị loại vì runner tự re-dispatch (sai nghĩa giữ-chờ-người); `blocked` đúng nghĩa kẹt-vì-lỗi. KHÔNG tự rebase, KHÔNG halt cả vòng runner — item đậu lại như mọi `blocked` khác, đi lại đường `blocked → todo/doing` sẵn có khi người xử lý xong.
- **RUL30 (`headAtReturn` — đối xứng `headAtTake`, nguồn diff của một đề xuất pull-door).** `return` verify xanh ghi thêm `headAtReturn` (HEAD host repo tại đúng thời điểm đó) lên CÙNG sự kiện `doing→awaiting-approval` (per pr-lifecycle / 1359ab5e) — cổng duyệt dùng dải `headAtTake→headAtReturn` làm nguồn diff trung thực của một đề xuất pull-door. Vắng mặt cho đề xuất runner (không qua `return`) và cho mọi đề xuất tạo trước feature này (tương thích ngược, RUL11 (tiến hóa schema)).
- **RUL31 (lãnh địa fgos tường minh, `init` chỉ đọc-và-ghi-nhận).** Lãnh địa ghi/khóa của fgos là CHÍNH XÁC `.fgos/` (data dir theo cwd) + worktree tmpdir + nhánh `fgw/*`, cộng đúng hai cửa có chủ (merge-sau-duyệt cổng review, và source repo khi một runner worker được giao việc) — mọi thứ fgos làm với file của một harness khác là READ-ONLY, không bao giờ ghi/sửa/xóa. `init` quét marker harness khác (thư mục dấu ấn + khối managed AGENTS.md) chỉ để GHI NHẬN vào manifest `.fgos/coexistence.json`, không bao giờ tạo/sửa `AGENTS.md` của host; lỗi phát hiện không chặn `init` (fail-safe), re-init idempotent (per install-coexistence / f1715488; doctrine đầy đủ: `docs/coexistence.md`).
- **RUL32 (`reason` mới nhất fold lên item, latest-wins — khác khuôn cộng-thêm-không-đè).** Trường `reason` trên một sự kiện `work.move` (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`) được fold thêm lên `item.reason` (Data Dictionary #18) — GHI ĐÈ giá trị cũ mỗi lần (latest-wins), khác hẳn khuôn "cộng thêm, không đè" của outcome/friction/settlement/discovery: đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker cần lý do MỚI NHẤT, không phải toàn bộ lịch sử), không phải một chuỗi ghi nhận lịch sử. Item chưa từng bị đỗ/từ chối không mang trường này — vắng mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)) (per worker-execution STR33 / 396d9d9e).
- **RUL33 (cạnh `blocked→awaiting-approval` — đồng bộ-lại cơ học, cạnh MỚI DUY NHẤT mà fan-out-parallel thêm vào bảng FSM).** Khi một việc đỗ vì gãy nhập (xung đột/verify-đỏ-sau-nhập/trôi-tích-hợp) được đồng bộ-lại (catch-up) sạch, nó chuyển thẳng `blocked → awaiting-approval` — cạnh này KHÔNG mang `reason` bắt buộc (khác khuôn của `awaiting-approval→todo`/`awaiting-approval→blocked`, cùng khuôn cơ học của `blocked→todo`/`blocked→doing`) và KHÔNG BAO GIỜ đi qua `doing`, nên không tính vào ngân sách chống-lặp (`visitCount`) của việc — phân biệt rõ với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, có tính) (per fan-out-parallel / 2e92b7a5, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)").
- **RUL34 (`branchHeadAtTake`/`branchHeadAtReturn` — cặp marker nguồn-nhánh, luôn tách bạch với `headAtTake`/`headAtReturn`).** Cửa pull `take`/`return` trên một item `blocked` mang nhánh sống ghi CẶP marker riêng — `branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên cạnh `blocked→doing`, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên cạnh `doing→awaiting-approval` — mirror đúng cặp `headAtTake`/`headAtReturn` main-based nhưng KHÔNG BAO GIỜ cùng xuất hiện với cặp đó trên MỘT item: một claim nguồn-nhánh ghi `branchHeadAtTake` thay vì `headAtTake`, một return nguồn-nhánh ghi `branchHeadAtReturn` thay vì `headAtReturn` — trộn hai cặp cho cùng một đề xuất khiến `reviewDiff` của cổng duyệt dựng một dải vô nghĩa (cấm tuyệt đối, kiểm bằng test). `branchHeadAtTake` là discriminator DUY NHẤT `return` dùng để rẽ nhánh nguồn-nhánh — không dùng `classifySource` (nó ưu-tiên-nhánh và nhập nhằng với một pull-take main-based mà nhánh vẫn còn sót lại) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
- **RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage).** Một domain khai: danh sách stage có thứ tự, step-mapping (bước nào trong 5 bước base-workflow mỗi stage thỏa), cạnh chuyển-stage hợp lệ riêng của nó, skill ứng với mỗi stage, cộng ba khai báo ngoài chiều `stage` — có đi qua worktree/merge git thật hay không, nhãn phạm-trù cho từng status đầu chuỗi, và bộ `kind`/`risk` hợp lệ. Domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`): nó được quyền ĐẶT NHÃN cho status, không được quyền đổi cạnh; và bốn chặng đuôi (`delivered`/`retrospective`/`cleanup`/`done`) thì mọi domain đi y hệt nhau, không đặt nhãn lại được. Hôm nay tồn tại bốn domain: `coding` (sản xuất thật) cộng ba fixture minh họa `synthetic`/`triage`/`fixture-marketing` (xem "Mô hình domain" trên); cả `add`/`submit` đều có flag `--domain` (mặc định `coding` khi vắng) nối thẳng vào cửa CLI thật (per base-workflow-model / 2ae492d8, hoàn tất S1+S2). Item vắng `domain` (mọi item tạo trước base-workflow-model) đọc ra `coding` — mặc định lazy, cùng khuôn mặc định lazy của `stage`. Một giá trị `domain` lạ tại các điểm đọc nóng (frontier/vòng tự hành/bảng chuyển-stage) fail-safe về `coding` kèm cảnh báo, không throw.
- **RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị).** Quan hệ giữa các work item được mô hình hóa thành MỘT đồ thị cạnh-định-kiểu DẪN XUẤT (không phải một trường lưu trữ mới): mỗi phần tử `deps` là một cạnh **chặn** (`blocks`), mỗi `parent` là một cạnh **cha-con** (`parent-child`) — hướng cạnh là "nguồn chờ đích" (một gốc chờ hậu duệ của nó, đúng theo lineage của frontier: cạnh cha→con). Bất biến phi-chu-trình của cửa ghi phủ TOÀN đồ thị hợp nhất này (chặn + cha-con), không chỉ `deps`: `add`/`edit` từ chối mọi ghi khép một chu trình — kể cả chu trình TRỘN (một cạnh chặn cộng một chuỗi cha-con) hay chu trình cha-con thuần — với lỗi phạm trù `validation` (mã thoát 4). Đây là supersession CÓ CHỦ Ý của thiết kế "deps và parent tách bạch tuyệt đối" (record ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường) → record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)): hai quan hệ giữ lưu trữ + điều-phối riêng (RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối)) nhưng là một đồ thị cho phép kiểm chu trình. Bốn LOẠI CẠNH của mô hình là `blocks` / `parent-child` / `waits-for` / `discovered-from`. `blocks`/`parent-child` có nguồn dữ liệu từ `deps`/`parent` và tham gia bất biến acyclic. `discovered-from` NAY CÓ trường lưu trữ thật (`discoveredFrom`, xem Data Dictionary #22) và hai nguồn sinh (tường minh lúc khai việc, hoặc tự động khi trợ lý báo phát-hiện lúc thi công — xem spec Runner "Báo việc-phát-hiện từ trợ lý", per work-graph-intelligence S2b / 8cf7effe) nhưng là cạnh KHÔNG chặn theo đúng thiết kế ban đầu — loại trừ khỏi phép kiểm chu trình. `waits-for` (chờ mềm) VẪN là TỪ VỰNG MÔ HÌNH đã khai, chưa có trường lưu trữ hay nguồn sinh — chưa có driver fgOS cụ thể nào cần tới nó, deferred có chủ ý (per work-graph-intelligence S2b / 81322763) tới khi một use-case thật xuất hiện. Chỉ hai loại cạnh chặn (`blocks`, `parent-child`) tham gia bất biến acyclic (per work-graph-intelligence S2a / b5c0ba0c, record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)).
- **RUL45 (`awaitingContext` — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm, không lưu trữ).** Với mọi item `awaiting-human` có `parent`, `list` tính thêm một khóa cộng thêm `awaitingContext[id]` — KHÔNG BAO GIỜ lưu vào bản chiếu hay nhật ký, tính lại mỗi lần đọc từ đúng dữ liệu đang có — không "session" nào sống ngoài nhật ký/bản chiếu; không có transcript nào được lưu lại hay phát lại. Nội dung luôn mang `parent: {id, title, status}` lấy từ trạng thái SỐNG hiện tại của gốc — neo luôn cập nhật, không đông cứng tại lúc hỏi; gốc trỏ một id không còn giải được trong bản chiếu degrade về không có neo (cùng khuôn dung sai id-treo đã có cho `parent`/`discoveredFrom` ở nơi khác trong schema này). Cộng thêm khóa `changedSinceAsk` — mảng `{field, from, to}` — CHỈ khi so ảnh chụp G3 (`parentSnapshotAtAsk`) với gốc hiện tại thấy khác trên `title` HOẶC `status` (so sánh chuỗi chính xác, không trim/normalize — cố ý, không phải thiếu sót); khóa này VẮNG MẶT hoàn toàn khi so ra không có gì đổi HOẶC khi item không mang G3 (item tạo trước tính năng này, hoặc gốc không giải được lúc `ask`) — hai trạng thái "đã so, không đổi" và "không có gì để so" không bao giờ lẫn vào nhau qua cùng một mảng rỗng đại diện cho cả hai. Bộ trường so sánh CHỈ gồm `title`/`status` — schema nay đã có `priority`/`intent` (Data Dictionary #25/#26, str7-str8-priority-intent) nhưng chưa được thêm vào bộ so sánh này hay assignee/owner nào khác; mở rộng bộ trường này khi có nhu cầu thật là follow-up tự nhiên, không phải khoảng hở của luật này. `list` không có item nào thuộc diện `awaiting-human`-có-`parent` thì không sinh khóa `awaitingContext` ở envelope — hành vi `list` với các repo/item không thuộc diện này y hệt trước khi tính năng này tồn tại (per str61-chat-context-continuity / 14091e58, 19330e09, bce79d8a).
- **RUL48 (thử-lại-một-lần: ĐÃ RÚT cùng với phán-quan lồng bên trong).** Luật này từng mô tả cách context-discovery và phán chia-việc xử lý một lời gọi model hỏng: lỗi thật (không phản hồi, hết giờ) rơi thẳng fail-safe, còn phản hồi thành công mà nội dung không đọc được thì gọi lại đúng MỘT lần với chỉ dẫn định dạng nghiêm ngặt hơn (per str68 / 87536f3f). Cơ chế đó không còn tồn tại: cả hai phép phán đều đã bỏ phán-quan lồng bên trong, verdict nay do người gọi cung cấp, nên không còn lời gọi model nào bên trong verb để mà thử lại. Cái CÒN NGUYÊN là kỷ luật fail-safe mà luật này bảo vệ: một verdict không đọc được hoặc không đạt hợp đồng nội dung (vd verdict chia có con thiếu verify thật) KHÔNG BAO GIỜ được âm thầm cho qua — item ở nguyên trạng cho lượt sau, không có nhãn hay trạng thái thứ ba nào phát sinh, và không bao giờ throw ra ngoài.
- **RUL49 (Compound-learning đổi trục: từ stage sang status `retrospective`).** Bước tổng hợp/học sau-thi-công từng là stage thứ tư của `coding` (`compound-learn`, chèn sau `executing`). Stage đó ĐÃ RÚT; bước này nay là một chặng trên chiều `status` — `retrospective`, nằm giữa `delivered` và `cleanup` trong chuỗi đuôi dùng chung mọi domain (Data Dictionary #4). Lý do đổi trục: phần vòng đời sau merge không còn "loại tác vụ" nào để `stage` phân biệt, chỉ còn "đang ở đâu" — đúng câu hỏi `status` trả lời. Điều luật này bảo vệ giữ nguyên: tổng hợp là một chặng quan sát-được, FSM-hóa, không phải một phản xạ có thể bị bỏ sót lặng lẽ (per compound-learn-enduser-docs / 9c67c3d1, đổi trục sau đó).
- **RUL50 (không đóng được nếu chưa qua tổng hợp — nay do hình dạng chuỗi, không do một gate riêng).** Một item không thể tới `done` mà chưa đi qua bước tổng hợp. Trước đây điều này được cưỡng chế bằng một gate gắn ở cả hai cửa vào `done`, kiểm "item đã qua stage `compound-learn` chưa". Gate đó không còn cần thiết: `done` nay chỉ có đúng một lối vào `cleanup→done`, và `cleanup` chỉ tới được từ `retrospective`, nên chuỗi tuần tự TỰ NÓ đảm bảo điều luật này — không còn đường vòng nào để lách. Điều khác biệt đáng ghi: luật này giờ áp dụng cho MỌI domain như nhau (chuỗi đuôi dùng chung), thay vì chỉ domain nào khai stage tổng hợp. Bản ghi học câu-6 tự động lúc đóng (RUL21 (câu-6 tự động — bài học lúc đóng)) không đổi.
- **RUL51 (verb `compound` — nay là cửa GẮN NHÃN, không còn là cửa chuyển stage).** `fgos compound <id>` từng là hành động chủ ý duy nhất mở lối vào stage `compound-learn`. Stage đó rút, nên verb KHÔNG còn chuyển stage nào — nó chỉ ghi nhãn tài liệu lên bản ghi outcome. Điều kiện tiên quyết đổi theo: verb đòi item đang `status: retrospective` (không còn là `awaiting-approval`) — item ở status khác bị từ chối `validation` (mã 4), không sự kiện nào ghi thêm. Cờ TÙY CHỌN `--doc-type <quadrant>`: khi có mặt, giá trị được KIỂM TRƯỚC MỌI GHI (đúng một trong bốn quadrant) — sai thì từ chối `validation` (mã 4), không sự kiện nào ghi. Cờ `--doc-path <path>` đi kèm ghi con trỏ linkage lên cùng bản ghi outcome đó — xem RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome). Vì không còn nhánh chuyển-stage nào, ca "gọi lại lần hai trên item đã ở stage tổng hợp" mà luật cũ phải xử lý riêng cũng biến mất: mọi lời gọi hợp lệ nay đi đúng một đường ghi outcome (per + producer & linkage bước-3 compound-learn-enduser-docs).
- **RUL52 (nhãn Diataxis `docType` — trường capture cộng-thêm, trực giao và tùy chọn).** Bản ghi capture của chặng tổng hợp (outcome VÀ friction) mang thêm một trường TÙY CHỌN `docType` — nhãn phân loại tài liệu Diataxis theo chiều audience, đúng một trong bốn quadrant `tutorial`/`how-to`/`reference`/`explanation`. Chiều này TRỰC GIAO với type-axis kỹ sư (pattern/decision/failure): một chiều CỘNG THÊM, không thay thế. Kiểm hình dạng chỉ KHI có mặt — giá trị ngoài bốn quadrant bị từ chối `validation`; vắng mặt/`null` luôn hợp lệ (chưa gắn nhãn), không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (RUL nền của Data Dictionary #23). KHÔNG event type mới, KHÔNG đổi fold: trường đi ké payload thô của `work.outcome`/`work.friction` nên sống sót replay/rebuild qua chính spread-fold sẵn có, cơ chế không đổi một byte. `fgos check` hiển thị `docType` khi có mặt (trên khối outcome và trong record friction gần nhất); log chưa có nhãn nào giữ hình dạng đầu ra byte-for-byte như trước khi trường tồn tại. BÊN SẢN XUẤT nhãn nay đã tồn tại: cờ TÙY CHỌN `--doc-type <quadrant>` trên verb `compound` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) ghi một `docType` thật lên bản ghi outcome — nên `fgos check` hiển thị nhãn thật, không còn chỉ là khả năng. Cờ tái dùng đúng kiểm slice-2 (giá trị ngoài bốn quadrant bị từ chối `validation`); vắng cờ thì `compound` giữ hành vi cũ byte-for-byte. Lớp phán đoán tổng hợp cấp nhãn — kỹ năng `fgos-coding-compounding`, nay kích hoạt theo STATUS `retrospective` chứ không theo một stage — nay cũng đã dựng: nó gom capture thật, phân loại quadrant, gọi `compound --doc-type`, rồi soạn tài liệu người-dùng-cuối đặt dưới `docs/<quadrant>/` có trích dẫn bằng chứng thật; skill nào ứng với status đó tra từ chính bảng skill của domain, nên một domain khác khai skill tổng-hợp riêng thì dùng skill của nó (per + producer/skill slice 3 compound-learn-enduser-docs / 6aa67ae4).
- **RUL53 (con trỏ tài liệu `docPath` — trường linkage cộng-thêm trên outcome).** Verb `compound` nhận thêm cờ TÙY CHỌN `--doc-path <path>`: khi có mặt, ghi trường `docPath` lên CÙNG bản ghi outcome mang `docType`, tại site ghi outcome của verb — trước đây verb có HAI site (một đường chuyển-stage, một đường gắn-nhãn-lại) và bỏ sót một site thì linkage bị nuốt lặng lẽ; nay verb không chuyển stage nữa nên chỉ còn đúng một đường ghi, và cái bẫy đó không còn. Trường này trực giao và tùy chọn hệt `docType` (RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)): KHÔNG kiểm hình dạng (đường dẫn tự do), KHÔNG event type mới, KHÔNG đổi fold — đi ké payload thô của `work.outcome` nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Vắng cờ thì `compound` giữ hành vi cũ byte-for-byte (kể cả bare `compound` không cờ nào; chỉ có `--doc-type` mà không `--doc-path` vẫn ghi `docType` bình thường, `docPath` là `null`). `fgos check` hiển thị `docPath` khi có mặt. Con trỏ này là NỀN cho chỉ mục đọc-theo-tag (area `enduser-docs-index`): mỗi tài liệu người-dùng-cuối truy ngược được về capture đã sinh ra nó, nên khi dựng lại tài liệu (slice gộp-sống về sau) không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs).
- **RUL54 (sổ verb máy-đọc không bao giờ in nhầm tham số positional thành cờ bắt buộc).** Một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của `submit`) được đánh dấu riêng trong sổ verb máy-đọc; dạng trợ giúp chữ cho người đọc in "positional: `<tên>`" cho tham số đó, KHÔNG BAO GIỜ "required: `--<tên>`" — trước fix này, sổ verb in nhầm mọi tham số bắt buộc thành dạng cờ dù tham số chỉ nhận positional, khiến người dùng thử một cờ chưa từng hoạt động. Tham số vừa nhận positional vừa nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt. Sổ verb máy-đọc (`--help --json`) không đổi hình dạng — chỉ dạng chữ cho người đọc đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ).** `fgos <verb> --help` (không kèm `--json`) luôn in mục trợ giúp CỦA RIÊNG verb đó, thoát mã 0, không ghi sự kiện/đổi bản chiếu/tác dụng phụ nào — áp dụng ĐỒNG NHẤT cho mọi verb kể cả `init` (gọi `init --help` không chạy `init` thật, không tạo `.fgos/`). Trước fix này, verb không có xử lý `--help` riêng: hầu hết verb rơi vào nhánh lỗi thiếu-tham-số (thoát mã 4, một dòng chẩn đoán thay vì trợ giúp thật), còn `init --help` lặng lẽ bỏ qua cờ và chạy `init` thật (tác dụng phụ ngoài ý muốn). `fgos --help` (không kèm tên verb) và `fgos <verb> --help --json` không đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL56 (`pick` — `take` + dựng workspace trong MỘT lệnh, role cố định, không rollback claim khi worktree gãy).** `fgos pick` tái dùng NGUYÊN VẸN logic claim của `take` (cùng CAS, cùng luật frontier, cùng đường tái claim nguồn-nhánh) — khác đúng một điểm: role LUÔN `session`, không có cờ `--role` (per str83-fgos-slash-commands — role cửa pull tự-hoàn-tất bằng chính phiên được dispatch, không phải một proxy). Ngay sau claim, `pick` dựng/tái dùng workspace qua CHÍNH `createWorktree` (spec Runner) — không một cơ chế dựng-worktree thứ hai. Claim và dựng-workspace không phải một giao dịch nguyên tử: nếu `createWorktree` ném lỗi SAU KHI claim đã ghi, `pick` không tự động hoàn tác claim đó — lỗi lộ ra nguyên vẹn, item ở lại `doing` không worktree, người gọi tự xử lý tiếp (per str83-fgos-slash-commands / 757e5dd7).
- **RUL57 (`init`'s cảnh báo git-headless là dữ liệu cộng-thêm, không bao giờ chặn `init`).** `init` tự kiểm project directory có HEAD git resolve được hay không, cùng kỷ luật fail-safe với bước quét coexistence-manifest liền kề: lỗi đọc (git vắng mặt, không phải repo git, hay repo có 0 commit) không bao giờ ném ra ngoài, không bao giờ đổi mã thoát của `init`. Khi không resolve được, kết quả mang thêm `gitHeadless: true` trên CÙNG phong bì `fgos.v1` đã có — một trường dữ liệu thuần, không banner riêng; đây là NHẮC SỚM cho người/agent trước khi chạm `fgos-runner`/`pick`/`take`'s worktree, vốn cần git thao tác thật — không thay thế cho kiểm tra fail-fast của chính vòng tự hành lúc khởi động (xem spec Runner "Kiểm tra tiền-điều-kiện lúc khởi động", RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) (per D ecfd0d1a).
- **RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, hai NGUỒN GHI tách bạch, picker vẫn cơ học vĩnh viễn per RUL42 (runner)).** `priority` (Data Dictionary #25) CHỈ ghi qua `edit --priority <n>` — một người hoặc một tác nhân tự khai tường minh, không bao giờ do picker tự suy ra. `intent` (Data Dictionary #26) do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item (đọc metrics đồ thị STR43 + xếp hạng tác động STR21 làm tín hiệu cơ học), ghi qua MỘT lệnh `edit` thứ hai ngay sau khi bản ghi discovery được ghi — tách bạch hoàn toàn khỏi lệnh chuyển-stage đi kèm (không bao giờ gộp vào payload của nó), và chạy CẢ khi verdict không đủ rõ để rời `discovery` (một item đậu `awaiting-human` vẫn được chấm điểm). Một lỗi ghi `intent` (vd item không qua được `validateWork` toàn phần) không bao giờ chặn kết quả phán rõ/chưa-rõ của lần đó — nuốt lặng lẽ, cùng kỷ luật fail-safe RUL48 (thử-lại-một-lần: đã rút cùng với phán-quan lồng bên trong). `intent` KHÔNG có ràng buộc dấu/khoảng ở tầng schema — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc ghi; sửa tay được qua `edit --intent <n>` như mọi trường editable khác. Cả hai trường chỉ đổi KHÓA SẮP-XẾP mà bộ lọc frontier cơ học đọc (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) — không bao giờ đổi TẬP HỢP item nào lọt frontier, giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item): picker cơ học vĩnh viễn, trí tuệ vào hệ qua đúng field-trên-item, không bao giờ qua vòng chọn-giao (per str7-str8-priority-intent).
- **RUL60 (`submit` — ba cờ ghi-đè `--tier`/`--kind`/`--risk`, độc lập từng trường; `risk` KHÔNG mirror `tier` khi có cờ).** Xem "Nộp vấn đề tự do (submit)" trên: mặc định cả ba trường vẫn suy cơ học từ mô tả (đếm từ khóa) như trước; ba cờ tùy chọn ghi đè TỪNG TRƯỜNG một cách độc lập — có `--tier` không bắt buộc phải có `--kind`/`--risk`, và ngược lại. Khi CHỈ `--tier` có mặt (không `--risk`), `risk` VẪN suy cơ học như trước — tức `risk` khi đó mirror `tier` CƠ HỌC (giá trị suy ra, không phải giá trị vừa ghi đè qua cờ) — một điểm dễ hiểu lầm: `submit "..." --tier heavy` (không `--risk`) có thể cho ra item `risk` KHÁC `heavy` nếu suy luận cơ học trên mô tả đó tự ra một bậc khác. Cờ vắng mặt không đổi hành vi cũ một byte (cùng khuôn optional-additive như `--domain`/`--deps`/`--acceptance` — RUL nền). Trường `domain` KHÔNG nằm trong phạm vi ba cờ này và không bị đụng tới (giữ nguyên hành vi cũ hoàn toàn). BÊN SẢN XUẤT giá trị cho ba cờ này từng là kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify), gọi trực tiếp khi có một mô tả tự do cần nộp trước cả khi `submit` chạy; skill đó đã RÚT (tsk-6ar) vì việc nó làm bị `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`, tsk-5wz) làm lại — trên bản mô tả SẠCH hơn (sau clarify, không phải trước) — cho bất kỳ phiên sống nào gọi cửa thường, không cần gọi riêng một skill nữa. Đường sản xuất còn sống hiện nay KHÔNG còn đi qua ba cờ `--tier`/`--kind`/`--risk` của chính verb `submit` mô tả ở trên — ba cờ ấy vẫn hoạt động y nguyên cho bất kỳ bên gọi nào (người, script, agent khác) muốn ghi đè trực tiếp lúc nộp, chỉ là không còn một skill đứng sẵn để tự suy luận và điền hộ chúng. **Cập nhật (cờ phân loại của `discover`):** chỗ phán lại chính thức nay là verb `discover` ở stage `discovery` — nó nhận cùng ba cờ và áp qua chốt chặn dùng chung với đường headless (xem "Chạy context-discovery (discover)" trên). `fgos edit` vẫn là cửa ghi hợp lệ cho một chỉnh tay lẻ, nhưng nó không còn là đường sản xuất được mô tả ở đây: phân loại thuộc về `discovery`, sau research, chứ không thuộc về một bước 6b nối sau `submit`.
- **RUL61 (writer — danh tính người ghi, cá thể tách bạch khỏi vai, không bao giờ chặn verb).** Ba cửa ghi `work.move`/`work.edit`/`work.stage` đều đóng dấu `writer{id,source}` (Data Dictionary #27) lên payload, không điều kiện — nguồn ưu tiên registry đối chiếu → biến môi trường → pid tổ tiên → nhãn `unresolved` (`id` vẫn là pid, không bao giờ rỗng). Registry CHỈ đối chiếu, không bao giờ tự cấp danh tính, và không bao giờ khớp theo thư mục làm việc hay pid của dòng đăng ký — giữ đúng bất biến "hai phiên khác nhau trong cùng worktree không bao giờ gộp làm một danh tính" mà khoá hoạt động cây chính (spec Runner) dựa vào. Một giá trị sai định dạng bị lọc và rơi xuống nguồn kế tiếp tại tầng phân giải, không đi qua validator nào — verb không bao giờ bị chặn vì danh tính không xác định được (per str46-io-contract).
- **RUL58 (Acceptance-clause gate — chặn ở cửa `delivered`, không phải cửa `done`).** Một item mang `acceptance` (Data Dictionary #24) với ít nhất một clause có `text` không rỗng KHÔNG thể tới `delivered` — qua CẢ HAI lối vào (`doing→delivered` thao tác tay, `awaiting-approval→delivered` duyệt đề xuất, RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal)) — nếu bất kỳ clause nào trong số đó thiếu `evidence` không rỗng; nỗ lực bị từ chối `precondition` (mã 2), nêu đích danh clause đầu tiên thiếu bằng chứng, item ở nguyên trạng, không sự kiện nào ghi thêm. Gate ĐỨNG Ở `delivered` chứ không phải `done` là có chủ đích: `delivered` là chỗ code thật sự vào cây chính, nên bằng chứng phải đủ TRƯỚC lúc đó — chờ tới `done` thì đã muộn ba chặng. Phép kiểm chạy TRƯỚC khi sự kiện được ghi, bên trong CÙNG phiên giữ khóa `events.lock`; cửa duyệt còn chạy sẵn cùng phép kiểm này như một bước tiền-kiểm trước mọi thao tác merge, thay vì chỉ bắt được sau khi merge đã xảy ra. Gate này CHỈ ĐỌC `item.acceptance`, không bao giờ tự ghi bằng chứng — bằng chứng được bổ sung qua `edit --acceptance` sẵn có (không có cửa ghi mới), rồi thử đóng lại: phép kiểm luôn đọc trạng thái TƯƠI, không có verdict lưu-đệm từ lần từ chối trước. Item vắng `acceptance`, hoặc mang mảng rỗng, hoàn toàn không bị gate này chạm tới — đóng y hệt hành vi trước tính năng này. Gate này mechanically chỉ kiểm SỰ HIỆN DIỆN của `evidence`, không bao giờ phán xét TÍNH ĐÚNG của nó — cùng ranh giới tin cậy mà chính CoS check của bee tự áp cho backlog PBI của nó, port sang work-item fgOS (per str73-done-flip-cos-check / 0f3b6eb0, 0e575f83).
- **RUL64 (`holder` — trục thứ ba TRỰC GIAO status × stage, opt-in per-domain, chỉ đổi qua verb `handoff`).** `work.holder` (per tsk-2t9c) là trường tùy chọn giống `stage`/`domain` — vắng mặt trên MỌI item hiện có, và vẫn hợp lệ vắng mặt trên domain nào không khai `roleGraph` trong `DOMAINS` registry. Domain CÓ khai `roleGraph` ràng buộc `holder` phải là một trong `roleGraph.roles`; domain KHÔNG khai thì `holder` phải vắng mặt tuyệt đối — ghi `holder` lên item của domain không có roleGraph bị từ chối `validation`. `holder` KHÔNG nằm trong `EDITABLE_FIELDS` (`store.mjs`) — cùng loại trừ `stage`/`status`/`domain` đã có, đổi `holder` CHỈ qua verb `fgos handoff`/`fgos handoff-return`, không bao giờ qua `edit`. `fgos handoff <id> --to <role> --reason <advise|assist|review|consult>` tra hợp lệ qua `roleGraph.edges[stage]` of domain (một cặp `{from, to, reason, mode}`); route ngoài graph bị từ chối kèm DANH SÁCH edge hợp lệ trong message — "chặn và dạy tại chỗ", không chỉ một `false`. Loại `async` ghi event `work.handoff` (đổi `holder`, checkpoint đầy đủ); loại `sync` ghi event `work.call-summary` (KHÔNG đổi `holder`, bản ghi gọn) — bất biến: `holder` chỉ đổi qua handoff async, không bao giờ qua call-summary. `fgos handoff-return <id>` đóng call async đang mở gần nhất, trả bóng về đúng người mở nó ("call = round-trip") — KHÔNG tra lại `roleGraph` (hoàn tất một call đã được duyệt hợp lệ lúc mở không cần xét hợp lệ lần hai); độ sâu call lồng (`callstackCap`, mặc định 3 trong `roleGraph`) suy ra thuần từ việc phát lại log (`callThreads[id]`, ngăn xếp LIFO trên các entry `handoff` chưa `returning`), không bao giờ một biến đếm lưu trữ — biến đếm có thể trôi khỏi log, một phép phát lại thì không. Cả hai event type gấp vào khoá LAZY `view.callThreads[id]` (mirror khuôn `view.discovery`/`view.outcomes` sẵn có) — một log không có event nào trong hai loại này phát lại y hệt trước tính năng, không `callThreads` key, không `holder` field (per tsk-2t9c).
- **RUL66 (`fgos resolve-park-reason` — xóa `reason`/`parkReason` tồn dư trên item kết thúc).** Trên item đã ở trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason` hoặc `parkReason` từ một đợt đỗ cũ không còn là ngữ cảnh sống nhưng có thể gây hiểu lầm cho người đọc `fgos show`/`fgos list`. Verb `fgos resolve-park-reason <id> --note "<giải trình>"` xóa các trường này khỏi `item` (bỏ khóa `reason`/`parkReason` trên view phát lại) và lưu bản ghi giải trình vào `view.parkResolutions[id]` qua sự kiện `work.resolve-park-reason`. Chỉ áp dụng cho trạng thái kết thúc `done` hoặc `wontfix` (từ chối `validation` với mọi trạng thái khác) và bắt buộc `--note` không rỗng để đảm bảo tính giải trình audit-trail của nhật ký.
- **RUL65 (`workflows`/`resolveWorkflow` — hierarchy domain × N workflow, mechanism-first, `feature` là tham chiếu chứ không phải bản sao).** Theo tsk-2t9c: `DOMAINS.coding` có thêm `workflows` (map tên workflow → `{stages, stepMap, transitions}`), `defaultWorkflow` (`'feature'`), và `workflowFor` (map `kind` → tên workflow, RỖNG hôm nay — mọi kind fold về `defaultWorkflow`). `workflows.feature.{stages,stepMap,transitions}` KHÔNG phải bản sao của `domain.stages`/`stepMap`/`transitions` — cùng MỘT tham chiếu object (kiểm chứng bằng `===`, không chỉ deep-equal), nên không có nơi thứ hai để hai bản trôi lệch nhau. `resolveWorkflow(domain, kind)` (`workflow-stage-graphs.mjs`) là hàm phân giải: trả về `undefined` khi domain không khai `workflows` (mọi domain trừ `coding` hôm nay — cùng khuôn absent-key `roleGraphFor`/`classificationVocabulary` đã dùng), không bao giờ ném lỗi. **Cố ý CHƯA nối vào đường nóng** (`stage-fsm.mjs`, `frontier.mjs`, `intake/discovery.mjs`, `intake/plan.mjs`) — vì `workflows.feature` là CHÍNH các field domain-level đang dùng (tham chiếu giống hệt), nối dây hôm nay không đổi hành vi một byte, chỉ thêm rủi ro chỉnh sửa vào các module đã kiểm chứng kỹ mà không có lợi ích nào; nối dây thật sự chỉ cần thiết — và chỉ khi đó mới an toàn để làm — lúc workflow thứ hai (`bugfix`/`lightweight`, hoãn theo D7a) thật sự tồn tại. Bằng chứng gồng của graph đơn hiện có: 47% backlog thật (363/768 item) là `kind: bug`, và luật "chứng minh nguyên nhân trước khi sửa hành vi" khác bản chất `feature` nhưng đang chịu chung một graph.

## Edge Cases Settled

- Tiêu đề unicode (tiếng Việt, CJK, emoji) đi qua toàn tuyến ghi-đọc-rebuild nguyên vẹn (test đầu-cuối).
- Kỳ vọng cũ dùng lại lần hai (double-apply) bị chặn ở `conflict`, nhật ký không phình (test đầu-cuối).
- Dòng cuối nhật ký đứt giữa chừng: phát hiện to và rõ, phần trước còn nguyên; đây là trường hợp DUY NHẤT được tha thứ khi đọc — hỏng giữa nhật ký là lỗi cứng.
- Nhiều tiến trình OS THẬT (fork) cùng gọi `appendEvent` trên một nhật ký đồng thời: mọi `seq` vẫn duy nhất, không trùng, không hở, tăng ngặt — `.fgos/events.lock` liên-tiến-trình tuần tự hóa chuỗi đọc-seq/append (per RUL10 (tiền đề có ngưỡng) bổ chú). Có test khóa fork nhiều tiến trình con thật, đồng bộ về một mốc khởi động chung để các đợt append thật sự chồng cửa sổ (mirror kỹ thuật spike ép-đua); một kiểm chứng vứt-đi cho thấy chính hình dạng đọc-rồi-append KHÔNG khóa va trùng nặng dưới cùng tải, nên test không rỗng-nghĩa.
- Hai tiến trình OS THẬT cùng gọi `addWork` trên CÙNG một id đồng thời: đúng một tiến trình thắng, phía thua nhận `validation` "already exists" thật (không crash/treo), nhật ký chỉ mang đúng MỘT sự kiện `work.add` cho id đó. Cùng kỹ thuật fork-đồng-bộ, cùng test khóa vứt-đi-nếu-thiếu-khóa (per RUL10 (tiền đề có ngưỡng) bổ chú 2, store-atomic-rmw) — chứng minh bằng cách tạm bỏ khóa (git stash bản vá) rồi chạy lại: cả 2/2 test race đỏ đúng như dự đoán (6/6 tiến trình đua cùng thắng thay vì 1/6), phục hồi bản vá thì cả hai xanh trở lại.
- Hai tiến trình OS THẬT cùng gọi `moveWork` với CÙNG `expectedStatus` trên CÙNG một id đồng thời: đúng một tiến trình thắng, phía thua nhận `conflict` CAS thật, nhật ký chỉ mang đúng MỘT sự kiện `work.move` khớp cạnh đó cho id đó (cùng kỹ thuật, cùng cell trên).
- Id trùng khi khai: từ chối, không sự kiện thừa.
- Cờ thiếu giá trị/rỗng ở `move` được phân loại `validation` (mã 4), không nhầm sang `precondition`/`conflict` — chốt từ review, có test khóa (phase-1-review-fixes).
- Nhật ký di sản (trước v2, thiếu tier/v) replay nguyên vẹn với default; nhật ký trộn cũ/mới cùng kết quả — test khóa bằng fixture sinh từ binary Phase 1 thật (`test/fixtures/phase1-events.jsonl`).
- View lệch-còn-tồn-tại (khác view mất): `rebuild` ghi đè toàn phần từ log, có test khóa đúng chế độ hỏng này; đọc không bao giờ tự sửa file view.
- Item được nhận rồi đóng ở hai thời điểm khác nhau (dự đoán lúc nhận, thực tế lúc đóng): cả hai nửa còn sống trong bản chiếu, không nửa nào bị mất — test khóa.
- Log không mang bản ghi outcome nào: bản chiếu không có key outcome (vắng mặt, không phải rỗng) — hành vi so-khớp bản chiếu cũ giữ nguyên (test tương thích ngược).
- Item `awaiting-human` không bao giờ vào tập việc-sẵn-sàng, và item có dep đang `awaiting-human` không được mở — cả hai có test khóa (không cần sửa bộ lọc frontier: bộ lọc `todo` sẵn có đã loại).
- Cạnh vào chờ thiếu câu hỏi / cạnh rời chờ thiếu câu trả lời bị chặn ở `validation` — cùng khuôn cạnh từ-chối `awaiting-approval→todo` thiếu lý do; câu hỏi/câu trả lời bị bỏ qua (không vào payload) trên mọi cạnh khác, hệt như `reason`.
- Log không mang sự kiện cổng nào: bản chiếu không có key bản-ghi-cổng (vắng mặt, không phải rỗng) — tương thích ngược, cùng khuôn bản ghi outcome.
- Item `awaiting-human` mà `parent` trỏ một id không giải được (gốc đã xóa/không tồn tại): `awaitingContext` cho item đó coi như không có gốc — không throw, không `changedSinceAsk`, cùng khuôn dung sai id-treo đã có cho `parent` ở nơi khác (RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)).
- Item `awaiting-human` được park TRƯỚC khi tính năng `awaitingContext` tồn tại (không mang G3 trong bản ghi cổng): `list` vẫn hiện `parent` hiện tại của nó bình thường, nhưng không có khóa `changedSinceAsk` — im lặng đúng nghĩa "không có mốc để so", không phải "đã so và không đổi" (RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)).
- `answer` một item rồi `ask` lại đúng item đó lần hai: G3 của lần `ask` sau ghi đè hoàn toàn ảnh chụp gốc của lần trước, không gộp hai ảnh cũ/mới.
- Hai lần `submit` cùng một mô tả (cùng title suy ra): id lần hai tự khác id lần đầu — thử lại với hậu tố dài hơn cho tới khi hết trùng, cả hai item cùng tồn tại, không lỗi "id trùng".
- `submit` với mô tả không khớp từ khóa phân loại nào: vẫn tạo item thành công, `tier`/`risk` về mặc định `standard`, `kind` về mặc định `task` — không lỗi, không chặn.
- `submit --deps <id-không-tồn-tại>`: từ chối `validation` (mã 4) qua ĐÚNG cửa kiểm `add` đã dùng, không sự kiện nào ghi — cùng khuôn `add` với dep lạ.
- `submit --deps <id1,id2>` hợp lệ: cả hai id được ghi vào `deps` của item mới, đi qua đúng kiểm chu trình sẵn có; `submit` không kèm `--deps`: `deps: []`, byte-identical hành vi trước khi cờ này tồn tại.
- Context-discovery verdict đủ rõ: item rời `discovery` vào stage `planning` (không thẳng `executing`) MANG THEO verify thật trong đúng một sự kiện — không có khoảng hở nào item rời chuỗi soi-rõ mà verify còn placeholder giả.
- Context-discovery verdict chưa đủ rõ: item rời `discovery` vào `exploring` để đào sâu cùng người, rồi mới `exploring → planning`. Hai đường này là toàn bộ lối ra của `discovery`; không có cạnh nào đi thẳng tới `executing`.
- Phán chia-việc trả verdict pass-through (item đơn giản, hoặc không có gì để chia): gốc chuyển thẳng `planning → executing`, giữ nguyên verify đã có từ lúc rời chuỗi soi-rõ — không gắn lại verify lần hai.
- Phán chia-việc trả verdict chia (n≥1 con): mỗi con sinh qua đúng một cửa ghi, mang `parent` trỏ về gốc, `deps` nội bộ theo đề xuất, và verify THẬT của riêng nó; gốc chuyển `planning → executing` ngay sau khi sinh đủ con nhưng KHÔNG lọt frontier cho tới khi mọi con ngã-ngũ (chặn qua lineage, không qua deps).
- Sinh con giữa chừng bị crash (một vài con đã ghi, gốc chưa kịp chuyển stage): lượt quét sau phát hiện gốc đã có con mang `parent` trỏ về nó qua view hiện hành, không sinh thêm con trùng — chỉ hoàn tất việc chuyển stage gốc còn dang dở (re-entrancy an toàn, không đẻ đôi con).
- Phán chia-việc trả verdict cần người quyết (tự báo mơ hồ) hoặc gốc mang risk `heavy`: gốc đậu `awaiting-human` mang đề xuất chia (danh sách con + deps đề xuất) làm câu hỏi — chưa ghi con nào vào queue; người trả lời xong, gốc về `todo` ở stage `planning`, lượt sau phán lại từ đầu.
- Verdict chia có bất kỳ con nào thiếu verify thật, hoặc không có verdict nào đọc hiểu được: verdict bị coi là không hợp lệ toàn bộ — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không pass-through ngầm; lượt sau thử lại (fail-safe, không bao giờ throw).
- Lượt quét cơ học của vòng tự hành gặp một item ở stage soi-rõ/lập-kế-hoạch mà không có verdict nào được cung cấp: để item nguyên tại chỗ, KHÔNG tự phán hộ và không throw — chờ một phiên sống tới quyết (RUL48 (thử-lại-một-lần: đã rút cùng với phán-quan lồng bên trong)).
- Gốc có ≥1 hậu duệ dang dở (chưa `done`): gốc không bao giờ được runner dispatch dù chính gốc đang `todo` ở stage `executing` — bộ lọc frontier chặn qua chuỗi `parent`, không qua `deps`; khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt frontier ở lượt quét kế tiếp mà không cần thao tác tay nào, rồi tự chứng minh bằng verify của chính nó.
- Một con bị `blocked`/đỗ giữa chừng không sinh trạng thái "bộ khẩn" mới: nó đi qua đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn dispatch cho tới khi con đó thật sự `done`.
- Item đơn giản đi qua lượt quét soi-rõ rồi lượt quét chia-việc trong CÙNG một lượt chạy `--once`: cả hai ngã-ngũ (clarify-pass rồi pass-through) hoàn tất trước khi vòng dispatch thi công của lượt đó bắt đầu — không cần đợi lượt sau.
- Context-discovery ra verdict chưa đủ rõ nhiều lần liên tiếp trên cùng item (người trả lời rồi vẫn chưa đủ): mỗi lần soi một bản ghi discovery riêng, tất cả còn sống — không lần nào bị mất; vòng lặp không có trần cố định (con người luôn là bên gate mỗi lượt lặp).
- Item còn đỗ trên bí danh di sản `decompose`: vẫn đi tiếp được qua `decompose → executing` như trước, và tra ra đúng skill mà `planning` tra ra — bí danh không bao giờ làm một item mắc kẹt. Nhưng KHÔNG item mới nào tới được đó: phép tra "stage nào thỏa bước Chia-việc" luôn trả `planning`.
- Item tạo qua `add` không mang field `stage`: đọc ra `executing` (mặc định lazy), xuất hiện trong `ready` ngay như hôm nay — hành vi `add`/legacy không đổi một byte.
- Nhật ký di sản thật đã có sẵn một ngã-ngũ đóng (`→done`) từ trước khi khái niệm phiên bản schema tồn tại: replay KHÔNG tự sinh bản ghi settlement cho nó — bản chiếu lịch sử giữ nguyên byte-for-byte (test khóa bằng fixture nhật ký Phase 1 thật).
- Item đóng mà chưa từng chạy, chưa từng thất bại, chưa từng qua ngã-ngũ nào khác vẫn nhận đúng một bản ghi học tối thiểu — không rỗng-im-lặng, không lỗi.
- Soạn bài học lúc đóng gặp dữ liệu bất thường: transition đóng vẫn thành công (item vẫn thành `done`), chỉ bản ghi học của lần đó bị bỏ qua — chưa từng làm hỏng một lần đóng item nào.
- `take` không truyền `--id`: cầm đúng đầu frontier, mặc định `role=human`, ghi `headAtTake` và nửa dự đoán — chứng minh qua CLI thật. `take --id` một item đã bị cầm rơi thẳng xuống CAS của `move`, báo `conflict` thật (mã 3), không phải một thông điệp validation trùng lặp.
- `return` từ chối sạch khi working tree bẩn, hoặc khi HEAD chưa tiến so `headAtTake` (kể cả tree sạch nhưng zero tiến bộ thật) — cả hai `validation`, item giữ nguyên `doing`, không sự kiện nào ghi thêm.
- `return` verify xanh: `doing → awaiting-approval` + nửa thực tế, KHÔNG sinh settlement (settlement thuộc cạnh `→done`). `return` verify đỏ: `doing → blocked` (lý do `verify-fail`) + nửa thực tế + một bản ghi friction lớp `verification` — mirror đúng đường đỗ của runner.
- `return` trên một item claim bởi runner (`claimRole: 'runner'`, không `headAtTake`) bị từ chối `validation` — cửa pull không đụng vào claim của runner.
- Một `fgos-runner --once` chạy song song khi một người đang cầm item qua `take`: gặt-lại lúc khởi động của runner KHÔNG BAO GIỜ giẫm claim đó (claim người cầm vô thời hạn) — chứng minh bằng e2e qua binary thật, chạy runner song song trước khi người `return` (xem spec Runner "Gặt-lại lúc khởi động").
- Cạnh `awaiting-approval→blocked` thiếu `reason` bị từ chối `validation`, cùng khuôn `awaiting-approval→todo` — test khóa (per pr-lifecycle).
- `return` verify xanh ghi `headAtReturn` lên đúng sự kiện `doing→awaiting-approval`; fold đọc lại được qua rebuild (mẫu `headAtTake`), vắng mặt cho một đề xuất của runner (không qua `return`) — test khóa (per pr-lifecycle).
- Reject/park mang `reason`: giá trị fold lên `item.reason`, đọc lại được qua rebuild (mẫu `claimRole`/`headAtTake`); một lần fold sau GHI ĐÈ lần trước (latest-wins, không cộng thêm) — test khóa cả hai chiều (per worker-execution STR33 / 396d9d9e).
- `take` trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua `blocked→doing`, ghi `branchHeadAtTake` (không `headAtTake`) — chứng minh qua CLI thật; `take` trên một item `blocked` KHÔNG mang nhánh sống vẫn xung đột như trước (không đường mới nào mở toang `blocked→doing`).
- `return` nguồn-nhánh (item mang `branchHeadAtTake`): đo trên nhánh KHÔNG đụng working tree host repo — verify chạy trong worktree tạm detached tại SHA nhánh, dọn trong `finally` dù thành công hay thất bại; verify xanh + có commit mới → `awaiting-approval` mang `branchHeadAtReturn`, KHÔNG BAO GIỜ mang `headAtReturn` — test khóa cả hai chiều (mutual exclusion) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
- `return` nguồn-nhánh khi nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, item giữ `doing`, không sự kiện nào ghi thêm, tip nhánh không đổi — chứng minh bằng test thật.
- `fold` của `branchHeadAtTake`/`branchHeadAtReturn` qua rebuild: chỉ fold trên đúng cạnh của nó (`blocked→doing`/`doing→awaiting-approval`), không bao giờ lẫn với `headAtTake`/`headAtReturn` của cùng item hay của item khác — test khóa (write-side allowlist trong `store.mjs` + read-side fold trong `replay.mjs` đều được kiểm, đây là lỗ CRITICAL mà bee-validating từng gắn cờ trước khi cell dựng thật).
- `pick` không truyền `id`: cầm đúng đầu frontier, role CỐ ĐỊNH `session` (không đọc `--role`, cờ đó không tồn tại trên `pick`), dựng một nhánh + worktree THẬT (không detached) cho claim đó — chứng minh qua CLI thật.
- `pick <id>` trên một item đã `doing`: rơi thẳng CAS như `take`, báo `conflict` (mã 3), không double-claim.
- `pick` trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua `blocked→doing` (HỆT đường tái claim của `take`), rồi TÁI DÙNG worktree/nhánh sẵn có thay vì dựng bản sao.
- `createWorktree` ném lỗi SAU KHI claim của `pick` đã ghi thành công: lỗi lộ nguyên vẹn ra người gọi, claim KHÔNG bị hoàn tác/che giấu — chứng minh bằng một xung đột namespace nhánh git THẬT, không phải mock.
- `init` trong một repo git có 0 commit: `data.gitHeadless === true`, `init` vẫn thành công (không throw, không đổi mã thoát) — chứng minh qua CLI thật.
- `init` trong một repo git có ≥1 commit, hoặc ngoài một repo git hoàn toàn: không mang trường `gitHeadless` — hành vi/hình dạng output y hệt trước khi kiểm tra này tồn tại; lỗi đọc HEAD không bao giờ làm `init` thất bại (fail-safe, cùng khuôn với kiểm coexistence-manifest liền kề).
- Item mang `domain` lạ (không khớp sổ đăng ký) tới điểm đọc nóng (bộ lọc frontier, vòng tự hành, bảng chuyển-stage): rơi về `coding` kèm một cảnh báo, không crash vòng tự hành — test khóa.
- Item vắng `domain` (100% item hôm nay): mọi hành vi dispatch/chuyển-stage y hệt trước khi tính năng domain tồn tại — test khóa qua toàn bộ suite hiện có, không sửa một assertion nào (retrofit base-workflow-model).
- Đóng một item bằng cách nhảy cóc qua bước tổng hợp: không có cạnh nào để nhảy. `done` chỉ tới được từ `cleanup`, `cleanup` chỉ tới được từ `retrospective` — chuỗi tuần tự tự nó chặn, không cần một gate riêng gắn ở cửa `done` như trước.
- `fgos compound <id>` gọi trên một item KHÔNG ở `retrospective`: từ chối `validation` (mã 4), không sự kiện nào ghi thêm. Gọi đúng lúc item ở `retrospective`: ghi nhãn lên bản ghi outcome, KHÔNG chuyển stage nào (không còn stage nào để chuyển).
- `move --to delivered` (hoặc `approve`) trên một item mang `acceptance` có ít nhất một clause `text` không rỗng nhưng `evidence` rỗng/vắng mặt: từ chối `precondition` (mã 2), nêu đích danh clause đó, item ở nguyên trạng thái/stage hiện tại, không sự kiện nào ghi thêm (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done), per str73-done-flip-cos-check / 0f3b6eb0).
- Cùng item trên, sau khi `edit --acceptance '<json đã điền evidence>'` rồi thử lại: đi qua — RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) luôn đọc trạng thái tươi, không có verdict lưu-đệm từ lần từ chối trước.
- Item mang `acceptance` mà MỌI clause đều có `evidence` không rỗng: qua `delivered` bằng cả hai lối vào, y hệt hành vi trước khi RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) tồn tại.
- Item KHÔNG mang `acceptance` (vắng mặt hoặc mảng rỗng): RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) không chạm tới — hành vi y hệt trước khi luật này tồn tại (per str73-done-flip-cos-check / 0e575f83).
- `add`/`submit`/`edit --acceptance` với giá trị JSON hỏng dạng (không parse được, không phải mảng, một clause thiếu `text` hoặc `text` rỗng): từ chối `validation` (mã 4), không sự kiện nào ghi thêm — cùng khuôn `--deps`/`--refs` hỏng dạng.

## Open Gaps

- Bản ghi thực tế (outcome) chưa có trường "thời lượng chạy" — nếu cần, đây là một mở rộng schema cộng thêm mới, chưa quyết (nêu lúc validate slice 1 của phase-3-compound-learning).
- Cổng có-phân-loại (typed gates: need-review / need-approval) — vẫn cố ý gộp về một `awaiting-human` chung; thêm nhãn loại chỉ khi có consumer thật cần (, deferred). Riêng nhu cầu "cần làm rõ trước khi thi công" đã giải qua chiều `stage` (`discovery`/`exploring`/`planning`/`executing`) thay vì một loại cổng mới — xem "Giai đoạn Soi-rõ" và "Giai đoạn Lập-kế-hoạch".
- Timeout / nhắc-nhở / đánh-thức khi người vắng lâu — cố ý không làm; đậu vô thời hạn (deferred). Riêng việc CLAIM một item đang `doing` bị bỏ quên (worktree không còn ai chỉnh sửa) đã có một cửa hẹp hơn: `pick`/`take` tự kiểm tra hoạt động file/worktree thật của claim cũ ngay trong đường CAS-conflict sẵn có, và tự động reclaim (reattach, không phá hủy) khi bằng chứng đủ kết luận — không phải timeout/nhắc-nhở chủ động, chỉ kích hoạt khi một session khác chủ động thử claim lại (docs/history/session-claim-liveness/CONTEXT.md).
- Phân quyền / nhiều người / giao việc: ai được trả lời cổng nào — chưa mô hình hóa (deferred).
- Orchestrator service tầng fleet (registry/heartbeat/push assignment/lease, giao thức+auth cho worker từ xa) — không thuộc cửa pull take/return đã dựng, đắp sau trên cùng nhật ký sự kiện chỉ khi cần fleet worker (deferred, per stage-decompose).
- Rollup view theo bộ (tổng hợp trạng thái mọi hậu duệ của một gốc trong một màn hình) — STR24, chưa làm (deferred).
- Trong một project mà bee đang nghỉ (phase terminal), guard hiện tại của bee chặn ghi trực tiếp vào `.fgos/` (cổng idle-intake theo-phase, allowlist tĩnh không biết territory manifest) VÀ vào worktree tmpdir (containment phi-phase, không quan tâm phase) — hai cơ chế độc lập, không nhắm riêng fgos; luồng qua verb CLI `fgos <verb>` (Bash) không bị chặn bởi cả hai. Gap thuộc cây bee, không sửa trong feature này; friction đã file (`.bee/backlog.jsonl`, severity P2) làm địa chỉ flip khi bee sửa (per install-coexistence / 8788e9bb; canary pin sự thật này — `docs/coexistence.md` Known Gaps, `docs/history/install-coexistence/reports/canary-run.md`).
- Ngữ cảnh soi của context-discovery (xem "Giai đoạn Soi-rõ" trên) chỉ mang cặp hỏi-đáp MỚI NHẤT của một item — bản ghi cổng gộp-mới-nhất, không giữ một lịch sử đầy đủ mọi vòng hỏi-đáp trước đó; nếu một vòng làm-rõ nhiều bước cần nhìn lại toàn bộ chuỗi hỏi-đáp, đó là mở rộng sau (per discovery-context STR30 / cfae0120, chấp nhận cho CoS hiện tại — accepted trade-off, không phải bug).
- Domain thứ hai thật SẢN XUẤT (vd marketing, chạy trên vòng thi công thật `runner/dispatch.mjs`, không chỉ minh họa) — sổ đăng ký đã dựng, `coding` đã retrofit, và nay có tới BA domain fixture (`synthetic`/`triage`/`fixture-marketing`) chạy hết cửa CLI (`add`/`submit --domain`) thật; nhưng cả ba đều là fixture dùng-một-lần. Một domain mang giá trị sản xuất thật vẫn là backlog STR18 tiếp tục (per base-workflow-model / 2ae492d8).
- **Phạm vi tài liệu này chưa phủ hết bề mặt verb.** Spec mô tả đầy đủ chiều vòng đời (`stage` + `status`) và các verb đi trên nó, nhưng CHƯA có mục riêng cho một số verb đang sống: `merge`, `show`, `schedule`, `gate-approve`, `gate-bypass`. Đây là nợ tài liệu của các tính năng đó, không phải khoảng hở của mô hình vòng đời — ghi nhận ở đây thay vì để `coverage` khai khống (xem frontmatter: `coverage: partial`).
- `repair` (ghi-đè-cả-file) KHÔNG lấy `.fgos/events.lock` — chỉ chạy khi không có tiến trình fgos nào đang sống; một `appendEvent` chen vào giữa lúc repair đọc và ghi-đè sẽ bị nuốt. Ghi nhận yêu cầu, không cưỡng chế (per fgos-multi-session-checkout Epic 3 / STR35; xem entry point `repair`).
- Lối tổng hợp (nay ở status `retrospective`) đã đóng vòng đầu-cuối: `compound --doc-type` ghi `docType` thật (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52), `--doc-path` ghi linkage nguồn↔tài-liệu (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)), kỹ năng `fgos-coding-compounding` phân loại quadrant và soạn tài liệu người-dùng-cuối, một tài liệu how-to thật đầu tiên đã được sinh có trích dẫn bằng chứng từ capture thật, và một chỉ mục đọc-theo-tag máy-đọc-được (`fgos docs-index` → manifest; area `enduser-docs-index`) đã liệt kê tài liệu đó kèm linkage ngược (per bước-3 compound-learn-enduser-docs). Còn mở, có chủ ý HOÃN sang slice sau: (a) **gộp-sống** — hợp nhất capture thành tài liệu prose sống (dựng lại từ nguồn qua linkage RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)/manifest, không mất chi tiết/cấu trúc) — chưa làm; (b) **backfill** nội dung di sản (critical-patterns.md, docs/decisions/) vào bốn quadrant — chưa làm; (c) bề rộng sản xuất tài liệu — mới một tài liệu/một quadrant (how-to) được chứng minh, chưa phủ cả bốn; (d) nghi vấn Diataxis-đủ-hay-không (CONTEXT) để lại cho slice gộp-sống; (e) kỹ năng `fgos-scribing` (đồng bộ BA-spec ở chặng tổng hợp) HOÃN có chủ ý — chỉ dựng khi một bước spec-sync thật được nối (Agent's Discretion, CONTEXT).

**Đã đóng:** dư lượng CAS verb-tương-tác-vs-verb-tương-tác (per fgos-multi-session-checkout Epic 3 / STR35) — từng liệt ở đây, nay đã sửa (xem RUL10 (tiền đề có ngưỡng) bổ chú 2 ở trên và `docs/history/store-atomic-rmw/`).

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `bin/fgos.mjs` — CLI một cửa, bảng EXIT_CODES, resolve `.fgos/` từ cwd; verb `rollup <id>` (STR24) — đọc thuần qua `listWork`, không cửa ghi mới: not-found báo `validation` cùng khuôn `review`/`approve`; đếm con TRỰC TIẾP qua `Object.values(view.work).filter(w => w.parent === id)` (KHÔNG đệ quy đa tầng như `frontier.mjs`'s `hasOpenDescendant` — job khác nhau, gate frontier vs báo tiến độ, và phán chia-việc hiện chỉ sinh một tầng con); verb `triage` (STR21) — đọc thuần qua `listWork` + `rankImpact` (`src/state/impact.mjs`), formatter riêng `formatTriage` (không tái dùng `formatCandidateList`/`formatRollup` — hình dạng dòng khác)
- `src/state/impact.mjs` — backlog-triage impact ranking (STR21): thuần (`rankImpact(view)`), không fs/Date.now/mutation, cùng kỷ luật với `src/evolve/candidates.mjs`. `blocks` của một item = số item KHÁC chưa `done` đang liệt kê id đó trong `deps`; item `done` không được xếp hạng và không được đếm ở phía đếm; sắp xếp `blocks` giảm dần rồi id tăng dần (tie-break). Đây là proxy tác động dẫn xuất từ `deps` sẵn có — KHÔNG phải trường `priority`/`impact` mới trên schema work.mjs (đó là phạm vi STR7/STR8, còn `awaiting-approval`). Manifest layer: domain.
- `src/state/store.mjs` — chủ ghi duy nhất (append event → update view); facade lỗi: EXIT_CODES + categoryOf + re-export 4 error class; STATUSES sống ở work.mjs (fsm re-export); `addWork`/`editWork`/`moveWork`/`moveStage` mỗi cửa bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`) trong một phiên giữ `.fgos/events.lock` (qua `withEventsLock`/`appendEventLocked` của `events.mjs`) — hai verb tương tác song song trên CÙNG id không còn cùng qua tiền-kiểm cũ rồi cùng ghi hai sự kiện mâu thuẫn (per RUL10 (tiền đề có ngưỡng) bổ chú 2, store-atomic-rmw); `refreshView` vẫn chạy sau khi khóa nhả, không đổi; `addOutcome` — cửa ghi outcome (mẫu `addDecision`), gọi trực tiếp từ runner (không qua verb CLI); `addFriction` — cửa ghi friction (mẫu giống `addOutcome`), cũng gọi trực tiếp từ runner; `moveWork` chuyển tiếp `ask`/`answer` cho `transitionWork`, GẮN `role` vào payload SAU khi transition thuần trả về (không truyền vào transitionWork — payload bị rebuild sẽ nuốt mất), và khi `to==='done'` compose bài học câu-6 (`composeLearning`, thuần, try/catch best-effort) từ view TRƯỚC transition + settlement đóng sắp sinh, gắn additive vào CÙNG event `work.move`; `putInAwaiting`/`answerAwaiting` — hai verb mỏng đưa-vào-chờ / trả-lời (append event chuyển-trạng-thái mang câu hỏi/câu trả lời rồi refresh view); `moveStage` — cửa ghi đổi-stage (mẫu `moveWork`, một tầng phía trên), chuyển tiếp `transitionStage`, cùng cách gắn `role` post-transition; `addDiscovery` — cửa ghi bản ghi discovery (mẫu `addFriction`); `moveWork` nhận thêm một tham số cộng-thêm tùy chọn `headAtTake` (gắn post-transition, cùng cách gắn `role` — không đưa vào `transitionWork`), để cửa pull `take` cõng HEAD của host repo lên sự kiện claim; mọi lời gọi khác (runner, `add`/`move`/`ask`/`answer`) không bao giờ truyền tham số này nên nó luôn `undefined`, no-op, tương thích ngược tuyệt đối; cùng khuôn, `moveWork` nhận thêm `headAtReturn` (per pr-lifecycle / 1359ab5e) — CHỈ cửa pull `return` truyền, gắn post-transition trên cạnh `doing→awaiting-approval`; cùng khuôn thêm lần nữa, `moveWork` nhận `branchHeadAtTake`/`branchHeadAtReturn` (per human-rounds / 5a6900b2) — CHỈ cửa pull `take`/`return` nguồn-nhánh truyền, gắn post-transition trên đúng cạnh `blocked→doing`/`doing→awaiting-approval` tương ứng; đây là fix write-side allowlist mà bee-validating gắn cờ CRITICAL trước khi cell dựng thật — thiếu nó, hai field mới bị `moveWork` âm thầm nuốt mất trước khi sự kiện tới `appendEvent`; `EDITABLE_FIELDS` (dòng ~185) nay có thêm `'acceptance'` (per str73-done-flip-cos-check cell 1); `moveWork` nay có HAI khối gác riêng, cả hai chạy trước `appendEventLocked`: khối `if (to === 'delivered')` đọc `work.acceptance` và ném `StoreError('precondition', ...)` nếu một clause có `text` mà thiếu `evidence` (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) — gác ở cửa `delivered`, không phải `done`; cửa duyệt gọi lại chính phép kiểm này như một bước tiền-kiểm trước merge), và khối `if (to === 'done')` soạn bản ghi học câu-6 (RUL21 (câu-6 tự động — bài học lúc đóng)). Khối gác compound-learn cũ ở cửa `done` đã gỡ cùng stage đó — điều nó cưỡng chế nay do hình dạng tuần tự của chuỗi đuôi đảm bảo (RUL50 (không đóng được nếu chưa qua tổng hợp — nay do hình dạng chuỗi))
- `src/state/work.mjs` — `validateWork`'s khối kiểm hình dạng `acceptance` (mirror khối `footprint`/`docsRef`): khi có mặt, đòi `Array.isArray`, mỗi phần tử là object thuần với `text` chuỗi không rỗng và `evidence` vắng/`null`/chuỗi không rỗng — sai hình dạng ném `WorkValidationError` nêu đích danh phần tử lỗi (Data Dictionary #24, str73-done-flip-cos-check cell 1)
- `src/cli/command-registry.mjs` — verb `add`/`submit`/`edit` mỗi verb có thêm property `acceptance` (type string, mô tả JSON-encoded array) trong `parameters.properties`; `bin/fgos.mjs` có thêm helper `parseAcceptanceFlag(value, message)` (JSON.parse bọc try/catch, ném lỗi `validation` khi parse hỏng) xâu qua `case 'add'`/`case 'submit'`/`case 'edit'` (str73-done-flip-cos-check cell 1)
- `src/state/events.mjs` — append/read JSONL `.fgos/events.jsonl` (seq + ts ISO, path tường minh), phát hiện corrupt tail; `appendEvent` bọc chuỗi đọc-seq/tính/append trong một `.fgos/events.lock` liên-tiến-trình (khóa dẫn xuất từ `path.dirname(logPath)` nên một log-dir khác — vd `porting-store.mjs` — tự có khóa riêng), chính sách CHẶN-có-timeout mirror `acquireSessionsLock` (một thể hiện thứ ba độc lập, KHÔNG import từ `loop.mjs`/`session.mjs`, giữ module zero-dep), timeout/retry cỡ đường-nóng (2s/10ms — không sao chép mù mốc 10s cỡ vòng-đời-phiên của `acquireSessionsLock`), giải phóng trong `finally` mọi lối ra, hết giờ → `EventLogError('lock-timeout')` (phạm trù MỚI); `repairTruncatedLastLine` CỐ Ý không lấy khóa này (xem yêu cầu KHÔNG-tiến-trình-song-song ở entry point `repair`); xuất thêm `withEventsLock(logPath, fn)` (giữ khóa qua `fn`, để một caller có tiền-kiểm riêng — vd `store.mjs` — bọc TRỌN chuỗi đọc-kiểm-ghi thành một phiên giữ khóa) và `appendEventLocked` (lõi đọc-seq/tính/append KHÔNG tự khóa, dùng khi khóa đã đang giữ; `appendEvent` công khai nay chỉ là `withEventsLock` bọc quanh lõi này, hành vi công khai không đổi cho mọi caller cũ) — per store-atomic-rmw; RUL10 (tiền đề có ngưỡng)
- `src/state/fsm.mjs` — bảng TRANSITIONS + precondition + CAS, thuần (chiều `status`, KHÔNG BAO GIỜ do domain chi phối); nay mang cả chuỗi đuôi `delivered → retrospective → cleanup → done` cộng cạnh rẽ `cleanup → blocked`; cạnh `todo/doing→awaiting-human` bắt buộc `ask`, cạnh `awaiting-human→todo` bắt buộc `answer` (cùng cơ chế `reason`-trên-`awaiting-approval→todo`), giá trị trim vào `payload.ask`/`payload.answer`; cạnh `awaiting-approval→blocked` (per pr-lifecycle / 1359ab5e) bắt buộc `reason`, cùng cơ chế enforce với `awaiting-approval→todo`; cạnh `blocked→awaiting-approval` (per fan-out-parallel / 2e92b7a5) KHÔNG bắt buộc `reason` — mirror khuôn cơ học của `blocked→todo`/`blocked→doing`, không phải khuôn bắt-buộc-lý-do
- `src/state/stage.mjs` — bảng chuyển-stage + precondition + CAS, thuần, mẫu hệt `fsm.mjs` một tầng phía trên (chiều `stage`); cạnh sống của `coding` hôm nay: `discovery → planning`, `discovery → exploring`, `exploring → planning`, `planning → executing`; cộng cạnh di sản `exploring → decompose`, `decompose → executing` (bí danh drain-only) và hai cạnh `clarify → …` chỉ còn để một item lịch sử đi tiếp được hợp lệ; `expectedStage` CAS chống đua giữa phiên sống và vòng tự hành cùng phán một item; `transitionStage` tra cạnh chuyển-stage hợp lệ từ sổ đăng ký `workflow-stage-graphs.mjs` theo domain của item (thay hằng `STAGE_TRANSITIONS` phẳng cũ) — hành vi domain `coding` không đổi một byte (per base-workflow-model)
- `src/state/work.mjs` — schema + validate (ID_PATTERN kebab-case); STATUSES gồm cả `awaiting-human` lẫn chuỗi đuôi `delivered`/`retrospective`/`cleanup`; bộ stage hợp lệ nay tra theo domain của item chứ không còn là một hằng phẳng, field `stage` optional (đọc lazy `?? 'executing'` khi vắng mặt, không có trong DEFAULTS); field `parent` optional (lineage, validate string non-self-referencing, không đòi tồn tại — additive, không có trong DEFAULTS); field `domain` optional (đọc lazy `?? 'coding'` khi vắng mặt, không có trong DEFAULTS, cùng khuôn `stage`); `validateWork`'s enum-check cho `stage` tra sổ đăng ký `workflow-stage-graphs.mjs` theo domain của item (thay hằng `STAGES` phẳng cũ) — hành vi domain `coding` không đổi một byte
- `src/state/workflow-stage-graphs.mjs` — sổ đăng ký domain (kernel layer — `work.mjs` cũng kernel và phải import module này theo RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage); đặt module này ở layer `domain` sẽ tạo import ngược theo kiểm chiều-một-chiều-xuống của `test/architecture.test.mjs`): `DOMAINS` (frozen, hôm nay bốn entry: `coding` sản xuất thật cộng ba fixture `synthetic`/`triage`/`fixture-marketing`); mỗi entry khai stage list/step-mapping/cạnh-chuyển/skill-map, cộng `worktreeBacked`, bảng nhãn status, bảng lý-do-dừng cho vòng lái, và bộ `kind`/`risk` hợp lệ; `resolveDomainName`/`getDomain` — fail-safe, không bao giờ throw, dùng bởi `frontier.mjs`/`loop.mjs`/`stage.mjs`; `stageForStep` — tra stage theo bước base-workflow (đây là chỗ `planning` thắng bí danh `decompose`); `skillForStage` — tra skill theo stage HOẶC theo status `retrospective`, `null`/vắng mặt đều nghĩa là "không skill"
- `src/state/replay.mjs` — fold events → view, thuần; case `work.outcome` gộp theo id vào `view.outcomes` (key lazy, cộng thêm không đè); case `work.friction` APPEND theo id vào `view.frictions` (key lazy, mảng — mỗi record một lần xảy ra, không gộp/không đè); case `work.move` mang `ask`/`answer` gộp theo id vào `view.gates` (key lazy có bảo vệ, cộng thêm không đè); case `work.move` mang `answer` hoặc `to==='done'` (VÀ sự kiện mang phiên bản schema — bảo vệ nhật ký di sản thật) APPEND một bản ghi settlement theo id vào `view.settlements` (key lazy, mảng, kind answer/close); case `work.move` với `to==='done'` mang thêm `learning` APPEND theo id vào `view.learnings` (key lazy, mảng); case `work.add` fold thêm `item.parent` khi payload mang (additive, key lazy); case `work.stage` set `item.stage` (và `item.verify` khi payload mang verify — một sự kiện làm cả hai) và, khi RỜI stage đầu chuỗi (guard theo cạnh ĐI, `from === 'discovery'`, không theo đích cụ thể — để retarget đích không làm câm settlement) VÀ bản ghi `work.discovery` gần nhất của item không mang `clear: false` (RUL27 (settlement clarify-pass theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict)), APPEND một bản ghi settlement kind clarify-pass vào `view.settlements` (tên kind là nhãn di sản đã ghi vào nhật ký, không phải tên stage — xem RUL27 (settlement clarify-pass theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict)); case `work.discovery` APPEND theo id vào `view.discovery` (key lazy, mảng, cùng khuôn `view.frictions`); case `work.move` đích `doing` fold thêm `role` payload thành `item.claimRole` và `headAtTake` payload thành `item.headAtTake` khi sự kiện mang chúng (additive, lazy — đây là cách `return`/gặt-lại của runner phân biệt claim của cửa pull với claim của runner, xem "Cửa pull giao–nhận việc" trên và spec Runner), cộng thêm `branchHeadAtTake` payload thành `item.branchHeadAtTake` trên CÙNG cạnh khi sự kiện mang nó (nguồn-nhánh, RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)); case `work.move` đích `awaiting-approval` fold thêm `branchHeadAtReturn` payload thành `item.branchHeadAtReturn` khi sự kiện mang nó (mirror `headAtReturn` ở trên nhưng field riêng, không bao giờ cùng mặt trên một item, RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)); case `work.move` mang `reason` (bất kỳ đích nào, không chỉ `awaiting-approval→todo`/`awaiting-approval→blocked`) fold thành `item.reason` — GHI ĐÈ mỗi lần (latest-wins, khác khuôn cộng-thêm-không-đè của outcome/friction/settlement/discovery ở trên, per worker-execution STR33 / 396d9d9e, xem RUL32 (reason mới nhất fold lên item, latest-wins) và spec Runner RUL23 (hợp đồng con — verify thật, không placeholder))
- `src/state/dep-graph.mjs` — dò chu trình đồ thị cạnh-định-kiểu (per work-graph-intelligence S1 + S2a): thuần (không fs/mutation, chỉ import `WorkValidationError` từ `work.mjs` — Domain→Kernel, không import `store.mjs`). **S1 (deps-only):** `findDepCycle(workMap)` → đường chu trình hoặc `null` (DFS + recursion-stack), `assertNoCycle(candidate, workMap)` throw `WorkValidationError` single-arg (message "would close a dependency cycle") khi khép vòng `deps`. **S2a (đồ thị hợp nhất):** `buildUnifiedEdges`/`findUnifiedCycle`/`assertNoUnifiedCycle` chiếu `deps`→cạnh `blocks` và `parent`→cạnh `parent-child` (hướng cha→con) rồi dò chu trình trên tập cạnh chặn hợp nhất; thông điệp lỗi phân biệt "would close a graph cycle" cho chu trình có `parent`, giữ "dependency cycle" cho chu trình `deps` thuần. Gọi tại cả hai site cửa ghi `store.mjs` NGAY SAU `validateWork`, THEO THỨ TỰ: `assertNoCycle` (deps-only, giữ thông điệp S1) rồi `assertNoUnifiedCycle` (phủ toàn đồ thị) trong cả `addWork` và `editWork`. Manifest layer: domain (governance tag). Chu trình `deps` nhiều-nút chỉ phát sinh qua `editWork`; chu trình `parent-child`/trộn phát sinh qua `addWork` (id `parent` không kiểm tồn tại → cha tiến; chu trình khép khi cạnh còn lại được ghi) hoặc `editWork` `deps`
- `src/state/frontier.mjs` — bộ lọc `status === 'todo'` (đã loại `awaiting-human`) VÀ item đang ở stage cuối (bước Thực-thi) theo sổ đăng ký `workflow-stage-graphs.mjs` của domain item đó (thay so-sánh phẳng `stage ?? 'executing' === 'executing'` cũ — domain `coding` vẫn resolve đúng `executing`, hành vi không đổi một byte) VÀ, dẫn xuất thuần từ `parent` (đệ quy qua chuỗi hậu duệ, KHÔNG đụng `deps`), loại một gốc khi bất kỳ hậu duệ nào của nó chưa `done` khỏi ready set
- `src/intake/discovery.mjs` — Use-case của hai stage đầu chuỗi. Phán-quan lồng bên trong (một tiến trình con gọi model) ĐÃ RÚT: `resolveDiscovery` nay ĐÒI một verdict do người gọi truyền vào; chỉ còn hai lối thay thế là tín hiệu tin-cậy `readLockedContext` (artifact quyết định đã commit dưới `docsRef`) và một no-op an toàn cho lượt quét cơ học của runner. Hàm chung DUY NHẤT cho cả verb `discover` và vòng tự hành: đọc item, ghi bản ghi discovery LUÔN, rồi `moveStage` (`clear` → **`planning`** kèm verify thật; `unclear` → **`exploring`**) hoặc `putInAwaiting` (cần người, kèm câu hỏi). Đích của cạnh tra qua `stageForStep(domain, 'Divide')` chứ không hard-code, nên một domain đặt tên stage khác vẫn đi đúng
- `src/intake/plan.mjs` — Use-case tầng sau discovery (đổi tên từ `decompose.mjs` cùng lượt đổi tên stage). Cùng khuôn: phán-quan lồng bên trong đã rút, `resolvePlan` đòi verdict của người gọi. Hàm chung cho cả verb `plan` và vòng tự hành: đọc item, rồi một trong bốn nhánh — pass-through (`moveStage` `planning→executing`, giữ verify cũ), chia (ghi n con qua `addWork` — `parent`/`deps`/verify thật từng con, id con sinh vị trí `<id-gốc>-<n>` không qua `generateId` per id-systems-audit.md #1 — rồi `moveStage` gốc; re-entrancy: view đã có con mang `parent` trỏ về gốc thì không sinh thêm, chỉ hoàn tất chuyển stage gốc), cần-người (`putInAwaiting` mang đề xuất chia làm câu hỏi, gate risk `heavy` đọc từ `item.risk`), hoặc không hợp lệ (không ghi gì, item ở nguyên cho lượt sau). Khi item tới `executing`, hàm này còn NHẢ claim của item về `todo` — phiên cầm việc thi công phải claim lại qua cửa pull. Xuất `readLockedContext`, dùng lại bởi `discovery.mjs` làm tín hiệu tin-cậy
- `bin/fgos.mjs` — verb `check`: đọc `listWork(dir).outcomes`, in predicted-vs-actual; cộng thêm mục friction (đọc `view.frictions`, đếm theo lớp + cap 5 record gần nhất), mục settlement (đọc `view.settlements`, đếm theo kind+role + cap 5), mục học (đọc `view.learnings`, cap 5), và nhắc item trạng thái cuối thiếu outcome — tất cả read-only, không sự kiện mới; tín hiệu entropy-trend + seal-digest trên cùng `check` — xem spec Runner; verb `ask`/`answer` gọi `putInAwaiting`/`answerAwaiting`; `list` mang `view.gates` (câu hỏi hiện ra không cần formatter mới) và trường `parent` khi item mang (đã đi qua `listWork`'s full-object dump, không cần formatter mới); verb `submit` — gọi `classify.mjs` (deriveTitle/classify/generateId) + `envelope.mjs` (wrapEnvelope) rồi `addWork` sẵn có, KHÔNG cửa ghi mới, gắn stage đầu chuỗi của domain (`discovery` với `coding`); verb `discover` — chỉ phục vụ `discovery`/`exploring`, gọi `resolveDiscovery` với `role:'session'`; verb `plan` — verb RIÊNG cho `planning` (và bí danh `decompose`), gọi `resolvePlan`; verb `retrospective` — quét cơ học mọi item `delivered` sang `retrospective`; verb `cleanup <id>` — harness đóng chặng cuối, kiểm TTL + merge-còn-giải-được rồi `cleanup→done`, không đạt thì `cleanup→blocked`; verb `take` — cầm đầu frontier (`readyWork`) hoặc một `--id` cùng tập, CAS `todo→doing` qua `moveWork` mang `role`+`headAtTake` (`currentHead` của host repo), ghi outcome dự đoán qua `addOutcome`; item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) rẽ nhánh RIÊNG trước nhánh main-based: CAS `blocked→doing` qua `moveWork` mang `branchHeadAtTake` (`git rev-parse` trên chính nhánh, không phải host repo) thay vì `headAtTake`; verb `return` — kiểm `item.branchHeadAtTake` TRƯỚC mọi guard main-based (nguồn-nhánh không mang `headAtTake` nên kiểm main trước sẽ từ chối oan) — nếu có: đo số commit mới trên nhánh qua `commitsSince`, verify chạy qua `runGoalCheck` trong một worktree tạm DETACHED tại SHA nhánh (`git worktree add --detach`, dọn bằng `git worktree remove --force` trong `finally`, best-effort) — không đụng working tree host repo; xanh + có commit mới → `moveWork` `doing→awaiting-approval` mang `branchHeadAtReturn` (KHÔNG BAO GIỜ `headAtReturn`); không đủ điều kiện → từ chối rõ lý do hoặc `moveWork` `doing→blocked` (`reason:'verify-fail'`) + `addFriction`. Đường main-based cũ (không `branchHeadAtTake`) không đổi: TỰ CHẠY `verify` của item qua `runGoalCheck` (`src/runner/goal-check.mjs`, module dùng chung với runner — xem spec Runner) sau khi tự kiểm `isWorkingTreeClean`/`commitsSince` so `headAtTake`; xanh → `moveWork` `doing→awaiting-approval` mang thêm `headAtReturn` (`currentHead`, per pr-lifecycle) + `addOutcome` thực tế; đỏ → `moveWork` `doing→blocked` (`reason:'verify-fail'`) + `addOutcome` thực tế + `addFriction` lớp `verification`; verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của một cửa duyệt cho mọi đề xuất `awaiting-approval`; cơ chế merge/verify đầy đủ sống ở `src/runner/merge.mjs` (xem spec Runner "Cổng duyệt PR nội bộ" cho hợp đồng đầy đủ)
- `src/runner/loop.mjs` — `runOnce`: NGAY SAU startupReap, TRƯỚC vòng dispatch executing: (1) quét mọi item đang ở stage soi-rõ của domain nó và `status==='todo'`, gọi `resolveDiscovery` — lưới đỡ RUL19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode); (2) NGAY SAU đó, đọc lại view TƯƠI rồi quét mọi item ở stage lập-kế-hoạch và `status==='todo'`, gọi `resolvePlan` — cùng lưới đỡ, cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời stage đầu; không đọc `item.mode` ở cả hai sweep; mọi `moveWork` runner tự ghi (claim/propose/park) gọi kèm `role:'runner'`; cả hai sweep chạy với `role:'runner'` và, vì không mang verdict nào, degrade an toàn về không-làm-gì thay vì đoán bừa
- `src/intake/classify.mjs` — thuần, không import store.mjs: `deriveTitle` (cắt câu/dòng đầu hoặc N ký tự), `classify` (bảng từ khóa → tier/kind/risk, mặc định standard/task khi không khớp), `generateId` (tiền tố cố định `tsk-` + hậu tố hash base36 adaptive 3-8 ký tự, thử lại khi trùng — không còn chứa slug title, per id-systems-audit.md #1, work-id-tsk-hash)
- `src/state/envelope.mjs` — thuần: `wrapEnvelope(data)` → `{contract:'fgos.v1', generated_at, data_hash (sha256 hex của data), data}`
- `src/install/coexist.mjs` — detection marker harness khác (read-only) + ghi manifest `.fgos/coexistence.json` (v1); gọi từ verb `init` trong `bin/fgos.mjs`
- `test/install/coexist.test.mjs`, `test/e2e/coexistence-canary.test.mjs` — unit + canary e2e (guard bee thật qua stdin event, footprint snapshot-diff, nhường-nhịn init)
- `docs/coexistence.md` — doctrine đầy đủ record ADR0009 (lãnh địa, một-nhạc-trưởng-mỗi-phiên, nhường-nhịn, manifest schema, Known Gaps)
- `.fgos/events.jsonl` (committed, truth) · `.fgos/state.json` (gitignored, view)
- Test: `npm test` (`node --test 'test/**/*.test.mjs'`); e2e tại `test/e2e/rebuild-determinism.test.mjs` + `test/e2e/runner-loop.test.mjs` — bao gồm các kịch bản của hai stage đầu chuỗi, các kịch bản của stage lập-kế-hoạch (pass-through, chia-con-chặn-frontier, cần-người), VÀ 1 kịch bản S2-pull (submit → pass-through 2 stage → `take` người → một `fgos-runner --once` song song không giẫm claim người → người `return` xanh → `awaiting-approval`) chạy qua binary thật; round-trip cổng chờ-người tại `test/state/awaiting.test.mjs` + e2e CLI tại `test/cli/fgos.test.mjs`; unit tại `test/intake/{classify,discovery,plan}.test.mjs` + `test/state/{envelope,stage,store,frontier,work,replay}.test.mjs`; entropy-trend tại `test/report/entropy.test.mjs`. LƯU Ý phạm vi: suite KHÔNG đọc chính tài liệu này — không có test nào quét nội dung `docs/specs/*.md`, nên `npm test` xanh KHÔNG phải bằng chứng spec còn đúng với code. Bộ dò trích-dẫn-quyết-định-đã-lỗi-thời (`scripts/check-decision-citation-drift.mjs`) có quét `docs/specs/`, nhưng là script chạy tay, chỉ phát hiện, KHÔNG nối vào `npm test` (per `docs/specs/decision-citation-drift.md`)

## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.


### 0002 — Mô hình việc phẳng

> **Một phần đã supersede bởi [0012](0012-typed-edge-model-supersedes-deps-parent-separation.md):**
> "deps và parent tách rời có chủ đích" nay đọc là "tách rời về lưu trữ và ngữ
> nghĩa, nhưng hợp nhất thành một đồ thị typed-edge derive". Phần còn lại của
> record này (mô hình việc phẳng, một FSM, "epic" là item thường) vẫn hiện hành.

# 0002 — Mô hình việc phẳng

#### Bối cảnh

forgent cần một mô hình dữ liệu cho công việc tự-quản, đồng thời mở đường cho hướng
nhiều-agent chạy song song (fan-out). Cám dỗ quen thuộc là dựng cấp bậc entity
riêng: epic ⊃ story ⊃ task, mỗi cấp một schema. Cách đó nhân bội bề mặt trạng thái
và khoá độ mịn công việc vào schema.

#### Quyết định

- **Một loại work item duy nhất, một FSM duy nhất.** Item trỏ **deps** vào nhau.
- **"Epic" chỉ là một item thường** được các item khác trỏ deps tới — không phải một
  cấp entity riêng.
- Vòng đời cấp-câu-chuyện (bối cảnh, phê duyệt) là **thuộc tính/tài liệu gắn vào
  item**, không phải entity mới.
- **Frontier sẵn-sàng** = tập mọi item có toàn bộ deps đã xong, **derive toàn cục**
  từ trạng thái — không phải danh sách duy trì bằng tay.

#### Hệ quả

- **Fan-out đa-agent xuyên câu chuyện tự nhiên:** frontier gom mọi việc làm-được-ngay
  bất kể chúng thuộc "epic" nào.
- **Việc-kế-tiếp là một truy vấn derive,** không phải danh sách người ta cập nhật tay
  — đúng tiêu chí "agent lạ tự tìm việc kế tiếp từ state".
- **Độ mịn item là kỷ luật planning, không phải tính chất schema:** muốn nhỏ hơn thì
  tách item + deps, không cần thêm loại entity.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0003 — Đặt tên & bố cục dữ liệu

#### Bối cảnh

Cần chốt danh xưng và bố cục dữ liệu trên đĩa cho lớp work-state trước khi viết
code, để mọi area sau này nhất quán và để ranh giới truth/view hiện ra ngay trong
layout.

#### Quyết định

- **CLI = `fgos`** (cửa lệnh của sản phẩm).
- **Entity đơn vị việc = `work`.**
- **Data dir = `.fgos/`**, trong đó:
  - `events.jsonl` — **committed vào git = sự thật** (per 0001).
  - `state.json` — **bản chiếu, gitignored** (dựng lại được từ replay, không phải
    sự thật).

#### Hệ quả

- **Brand nhất quán** giữa CLI, tài liệu và data dir.
- **Ranh giới truth/view hiện ngay trong layout:** một file được commit (log), một
  file bị ignore (view) — đọc `.gitignore` là thấy đâu là sự thật.
- Vị trí cụ thể của `.fgos/` (đường dẫn, tổ chức con) là quyền quyết định khi thực
  thi, miễn giữ đúng cặp truth-committed / view-ignored ở trên.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0004 — Phạm vi & non-goal

#### Bối cảnh

Trước khi xây lớp state, cần chốt hai biên: nó phục vụ *ai trước*, và nó *quan hệ
thế nào* với harness (bộ công cụ điều phối) đang được dùng để phát triển chính
forgent. Không chốt hai biên này thì phạm vi trôi và dễ xây thừa.

> Ghi chú viết lại: quyết định gốc phát biểu qua quan hệ với harness phát triển nội
> bộ của dự án. Ở đây viết thuần theo sản phẩm — "harness phát triển" — không phụ
> thuộc tên công cụ cụ thể nào.

#### Quyết định

1. **Domain đầu tiên của lớp state là work-state của chính forgent** — việc của
   repo: item, trạng thái, quyết định. Các consumer khác (ví dụ vùng học từ nguồn
   tham chiếu) **đến sau**, không thiết kế cho chúng ở bước đầu.
2. **Non-goal — chạy song song, không thay thế, không interop:** forgent chạy **song
   song** với harness phát triển đang dùng, **không thay thế nó và không interop**.
   Việc thay thế harness chỉ được **mở lại khi forgent chạm ngưỡng-có-tên**: một agent
   lạ tự tìm được việc kế tiếp từ chính state của forgent.

#### Hệ quả

- **Scope bước đầu nhỏ:** không phải cover ngay các cơ chế điều phối nặng; tập trung
  chứng minh work-state tự-quản trước.
- **Ngưỡng mở-lại rõ ràng, không trôi:** "thay harness" là một quyết định có điều
  kiện đặt tên trước, không phải thứ lén mở rộng dọc đường.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0006 — Trạng thái `proposed`

#### Bối cảnh

Runner (0005) cho worker sinh kết quả trên **nhánh chưa merge**. Điều đó mở ba lỗ:

1. Một việc B phụ thuộc A có thể chạy trên nền **thiếu code của A** (A mới chỉ đề
   xuất, chưa nhận vào cây chính).
2. Khi kết quả bị **từ chối**, không có lối ra rõ ràng cho item.
3. Trạng thái **chờ-duyệt** không nhìn thấy được trong FSM.

#### Quyết định

Thêm trạng thái **`proposed`** vào FSM, với các cạnh:

- `doing → proposed` — goal-check pass, runner ghi `proposed`.
- `proposed → done` — được duyệt/merge.
- `proposed → todo` — **từ chối:** event mang lý do, item quay lại frontier;
  anti-loop max-visits chặn lặp vô hạn.
- `blocked` giữ nguyên hai chiều với `todo`/`doing` (muốn "park" thì dùng
  `todo → blocked` sẵn có).

Ngữ nghĩa:

- **`done` vẫn là trạng thái terminal**, và từ nay nghĩa là **"đã nhận vào cây
  chính"** (không chỉ "worker báo xong").
- **Frontier chỉ mở việc phụ thuộc khi dep thật sự `done`** — nên B không bao giờ
  chạy trên nền thiếu code A.

#### Hệ quả

- **Ghép nối qua nhánh an toàn:** phụ thuộc chỉ mở khi dep đã vào cây chính.
- **Chờ-duyệt hiện rõ:** `proposed` là trạng thái nhìn thấy được, không phải giai
  đoạn ẩn.
- **Từ chối có lối ra sạch:** item về `todo` kèm lý do, được anti-loop bảo vệ.
- Record này **supersede** tập trạng thái FSM của Phase 1; spec work-state phản ánh
  tập trạng thái mới.

- Record này supersede **Tập trạng thái FSM của Phase 1 (spec work-state cập nhật khi đóng feature)**.
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0007 — Tiến hoá schema & event

#### Bối cảnh

Trạng thái `proposed` (0006) và trường `tier` (0005) **đổi shape dữ liệu** ghi trên
một nhật ký đã committed vào git (0001). Log cũ (viết dưới code cũ) phải tiếp tục
đọc được dưới code mới, nếu không nguyên lý "log là sự thật dựng-lại-được" sụp.

#### Quyết định

Ba luật cho mọi tiến hoá schema/event từ đây về sau:

1. **Log đã commit là bất khả xâm phạm.** Không bao giờ chạy migration ghi đè event
   cũ. Sự thật chỉ được thêm, không viết lại.
2. **Replay backward-compatible, CÓ TEST.** Item/event thiếu trường mới nhận
   **default khai báo tường minh**. Cụ thể: log của phiên bản trước phải replay được
   dưới code phiên bản sau — và điều này được một test bảo vệ, không phải giả định.
3. **Mỗi event mang trường schema version** (từ khi luật này có hiệu lực), để code
   đọc biết mình đang replay shape nào.

#### Hệ quả

- **Log là hợp đồng tiến-tới:** thêm trường an toàn; đổi ngữ nghĩa thì thêm event
  mới, không sửa event cũ.
- **Test replay là phòng tuyến:** hồi quy tương thích ngược bị bắt bằng test, không
  bằng may rủi.
- **Chi phí:** phải khai default tường minh cho trường mới và duy trì test replay
  xuyên phiên bản — đổi lại là log không bao giờ "mục".

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0011 — Version tường minh cho mọi contract

#### Bối cảnh

0007 đã khoá "mỗi **event** mang trường schema version". Nhưng fgOS không chỉ
expose event ra ngoài code của nó — nó còn expose **schema** (shape của
work item, state.json) và **artifact** (file sinh ra cho người/agent khác đọc:
report, plan, brief). Cả ba đều là hợp đồng (contract) mà một bên ngoài —
người, agent khác, phiên bản code sau — phải đọc đúng shape mà không cần hỏi
lại. Không khai version ở cả ba là cùng một lỗ hổng 0007 đã vá cho event,
chỉ chưa vá cho hai loại còn lại.

Bằng chứng sống trong chính workshop: bee (harness phát triển cạnh fgOS) đã
tự giải bài này cho artifact bằng một quy ước cụ thể — frontmatter
`artifact_contract: bee-plan/v1` trên mọi artifact có shape ổn định
(`bee-planning`, `bee-briefing`, `bee-xia`: `bee-plan/v1`,
`bee-walkthrough/v1`, `bee-implement-plan/v1`, `bee-research/v1`). Version
nhúng thẳng trong định danh — đọc được bằng mắt (không cần mở schema riêng)
và bằng code (regex/parse một field), khác với version-là-field-số-rời mà
0007 dùng cho event.

#### Quyết định

Ba loại contract fgOS expose ra ngoài code của nó — **schema** (shape dữ liệu
bền: work item, state.json), **artifact** (file sinh cho người/agent khác:
report, plan, spec-fragment), và **event** (đã khoá ở 0007) — đều phải khai
version tường minh trong định danh của chính nó, theo mẫu `<name>/v<N>`:

1. **Artifact có shape ổn định mang `contract: <name>/v<N>`** trong
   frontmatter hoặc header của file — không phải một ghi chú rời, mà một
   field có thể regex/parse được bằng code lẫn đọc được bằng mắt.
2. **Schema (work item, state.json) mang version trong chính bản thân dữ
   liệu** — kế thừa nguyên xi cách 0007 đã làm cho event (field version rời,
   vì đây là dữ liệu máy đọc liên tục, không phải file người mở ra đọc).
3. **Tăng `vN` khi shape đổi không tương thích ngược** (field bị xoá/đổi
   nghĩa); thêm field mới an toàn không bắt buộc tăng version (đã có ở 0007
   cho event, áp dụng chung).
4. Không có quy ước version nào là non-goal: nếu một artifact/schema mới
   sinh ra không có kế hoạch đổi shape trong tương lai gần, nó vẫn khai
   `v1` — khai version rẻ, thiếu version mới đắt (không dò được ai đang đọc
   shape nào).

#### Hệ quả

- **0007 không bị supersede** — 0011 mở rộng phạm vi (event → +schema,
  +artifact), không đổi luật event đã có.
- **Artifact fgOS tương lai (report, plan, spec) theo đúng mẫu bee đã dùng
  sống**: `contract: <ten>/v<N>` — không cần phát minh lại quy ước, port
  nguyên cái đã chứng minh trong workshop.
- **Chi phí:** mỗi artifact/schema type mới phải chọn tên contract + version
  ngay từ v1, không hoãn "để sau".

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0012 — Mô hình đồ thị cạnh-định-kiểu hợp nhất thay thế deps/parent tách rời

#### Bối cảnh

0002 khoá "deps và parent là hai quan hệ tách rời có chủ đích": `deps` là cạnh
phụ thuộc phẳng cho phép fan-out xuyên story; `parent` là quan hệ lineage
(decompose) mà chỉ frontier dùng riêng để chặn cha cho tới khi mọi con xong
(`work.mjs:165-166` trước sửa). work-graph-intelligence S1 (decision 896219a7)
đóng một lỗ hổng sống: `deps` không có cycle-check — `editWork` có thể ghi một
chu trình A↔B lặng lẽ. Guard của S1 chỉ phủ nhánh `deps`.

Việc dò tay lúc validating S2a phát hiện một lỗ hổng sống **khác**, benign
nhưng có thật: `parent` **không bao giờ được existence-check**
(`validateDeps`, `work.mjs:205-213`, chỉ xét `deps`; `store.mjs` trước S2a
chưa từng đọc `parent`). Hai lệnh `addWork` với một `parent` trỏ tới một id
chưa tồn tại (dangling forward parent) đóng được một chu trình cha-con A↔B mà
guard deps-only bỏ sót — vô hại (`frontier.mjs`'s tập `seen` chặn treo máy khi
duyệt) nhưng thật, không phải giả định lý thuyết.

Beads (nguồn tham khảo đã mined — `beads.md:36`, `work-item-management.md:117`)
mô hình hoá cycle-check hợp nhất trên `blocks`+`parent-child`+`conditional` —
không tách theo trường lưu trữ. fgOS đi theo đúng bằng chứng đó: gộp `deps` và
`parent` thành MỘT đồ thị cạnh-định-kiểu (typed edges) cho mục đích tính toán
và bảo đảm phi-chu-trình, trong khi hai trường lưu trữ vẫn tách riêng.

#### Quyết định

- **fgOS mô hình hoá quan hệ giữa các work item bằng MỘT đồ thị cạnh-định-kiểu
  DẪN XUẤT** (derived — không phải một trường vật lý mới): `deps` chiếu thành
  cạnh `blocks` (`I -> d`, nghĩa "I chờ d"); `parent` chiếu thành cạnh
  `parent-child` (`P -> C`, nghĩa "cha chờ con" — đúng hướng
  `hasOpenDescendant` của `frontier.mjs`, không phải hướng con→cha ngây thơ,
  vì hướng ngây thơ sẽ làm một chu trình hỗn hợp blocks/parent-child không
  phát hiện được). `waits-for` và `discovered-from` là **từ vựng đã khai báo**
  — chưa có dạng lưu trữ hay producer nào (hoãn sang S2b).
- **Quyết định này SUPERSEDE 0002** (và spec Data Dictionary #13,
  `work.mjs:164-166`) ở đúng một điểm: "deps và parent tách rời có chủ đích"
  giờ đọc là "tách rời về **lưu trữ và ngữ nghĩa**, nhưng hợp nhất thành
  **một đồ thị** cho cycle-check và mọi compute slice sau này (S5+)". 0002
  không sai về lưu trữ — phần đó giữ nguyên; nó chỉ chưa tính tới việc hai
  quan hệ cần chung một bảo đảm phi-chu-trình.
- **Bảo đảm phi-chu-trình tại cửa ghi duy nhất (`store.mjs`) giờ phủ ĐỒ THỊ
  HỢP NHẤT `blocks`+`parent-child`**, không chỉ `deps` — **đã ship và verify
  xanh** (work-graph-intelligence cell -3/-4): `src/state/dep-graph.mjs` thêm
  `buildUnifiedEdges`/`findUnifiedCycle`/`assertNoUnifiedCycle` bên cạnh các
  hàm `deps`-only của S1 (`findDepCycle`/`assertNoCycle`, giữ nguyên hành vi
  và chữ ký); `store.mjs` gọi `assertNoUnifiedCycle` cạnh `assertNoCycle` cũ
  tại cả `addWork` và `editWork`, trước `appendEvent`. Điều này **đóng** lỗ
  hổng chu trình cha-con sống nói trên (benign nhưng có thật) — làm cho bất
  biến 896219a7 ("đồ thị phi chu trình") đúng cho **toàn bộ** đồ thị hợp
  nhất, không chỉ nhánh `deps`.
- **Dẫn xuất, không vật lý (derived-not-physical) — ba căn cứ:**
  1. **RUL11 (tiến hóa schema)** (log bất khả xâm phạm, `work-state.md:703`): một trường
     `edges[]` lưu trữ mới sẽ đòi migration cho mọi event cũ; một
     read-projection thuần Domain thì không.
  2. **Học thuyết DT2 "add-through-không-alongside"**: mở rộng cửa ghi hiện
     có (`assertNoCycle` cộng thêm `assertNoUnifiedCycle`, cùng một cửa)
     thay vì mở một đường ghi song song.
  3. **~10 consumer đọc trực tiếp `.deps`/`.parent`** (frontier, impact,
     `validateDeps`, v.v.) — giữ nguyên, không cần migrate.
- Vì thuần dẫn xuất: **không có trường lưu trữ mới; tại thời điểm quyết định
  này, SCHEMA_VERSION vẫn ở 2** (nay đã lên 3, per str46-io-contract),
  mọi event cũ replay y hệt (RUL11 (tiến hóa schema)).

#### Hệ quả

- `docs/architecture-map.md` nâng v0.2 → v0.3: dòng version trỏ record 0012,
  hàng component §6 (`dep-graph.mjs`) và hàng contract **C2** đều cập nhật để
  phản ánh bảo đảm phi-chu-trình đã mở rộng sang đồ thị hợp nhất.
- `waits-for`/`discovered-from` vẫn chỉ là từ vựng khai báo — không producer,
  không dạng lưu trữ — cho tới S2b (dạng lưu trữ thật; chỗ dành SCHEMA_VERSION
  cho S2b dời sang 4 vì STR46 đã lấy 3 trước, per str46-io-contract — có
  producer, và quyết định riêng cho tính chất load-bearing/chặn hay không của
  `waits-for`).

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0013 — Kênh báo-cáo-không-ghi (worker→runner) cho `discovered-from`

#### Bối cảnh

work-graph-intelligence S2b thêm `discoveredFrom` — một trường lineage phi-chặn
ghi lại "việc này lộ ra trong lúc làm việc kia". Trường đã có hai nhà sản xuất:
(A) cờ tường minh `fgos add/submit --discovered-from <id>` (người/agent gọi tay,
cell wgi-7); (B) **tự động từ runner** — khi một worker đang chạy một việc phát
hiện ra một đơn vị công việc mới đáng tồn tại riêng.

Nhà sản xuất (B) va thẳng vào một bất biến đã khoá: **runner là nhà ghi duy nhất**
trong suốt một lượt dispatch (C2). Prompt của worker cấm nó gọi `fgos` hay ghi
`.fgos/` (`dispatch.mjs`), và lượt spawn không truyền cho worker id của việc đang
chạy dưới dạng ngữ cảnh ghi được. Nếu để worker tự tạo item, ta phá vỡ
runner-một-cửa-ghi và mất luôn tính tái lập của goal-check (chỉ `verify` mới phán
việc worker làm, không phải report của nó).

#### Quyết định

Phát minh một **kênh báo-cáo-không-ghi** (report-not-write) giữa worker và runner,
mở rộng hợp đồng C3 (orchestrator ↔ worker) — không supersede gì:

1. **Worker chỉ báo cáo, dữ liệu thuần.** Prompt dispatch mô tả một kênh: worker
   CÓ THỂ phát một hay nhiều khối rào `fgos-discovered` trong output của nó
   (JSON: `title` bắt buộc; `kind`/`risk`/`description` tuỳ chọn) để nêu một việc
   mới phát hiện. Đây là dữ liệu, KHÔNG phải lệnh ghi — worker vẫn KHÔNG BAO GIỜ
   gọi `fgos` hay chạm `.fgos/`. Ràng buộc này giữ nguyên từng chữ.

2. **Runner đọc và tự ghi.** `loop.mjs` `dispatchClaimedItem` parse các khối
   `fgos-discovered` từ output đã bắt của worker **đúng một lần mỗi lượt dispatch,
   tại kết cục cuối** (không parse trong mỗi lần retry — nếu không một khối lặp
   lại sẽ đúc ra item trùng qua `generateId`). Parse phủ **cả hai** nguồn output:
   `worker.stdout` (đường thành-đề-xuất/chấm-trượt) VÀ `err.stdout` (đường
   quá-giờ/hỏng-spawn — một worker quá giờ vẫn có thể đã nêu việc).

3. **Parse là an-toàn-hỏng (fail-safe).** Khối méo/thiếu `title`/không phải object
   → log rồi bỏ qua; parser KHÔNG BAO GIỜ throw, KHÔNG BAO GIỜ đổi kết cục của
   worker hay luồng điều khiển của dispatch. Một report méo không bao giờ làm
   trật một lượt dispatch.

4. **Item tạo ra có hình dạng như một `submit` tươi.** `generateId(title)` +
   `classify(title)` cho tier/kind/risk (giá trị trong khối ghi đè), một `verify`
   placeholder DÙNG CHUNG (`FALLBACK_VERIFY` từ `discovery.mjs` — không nhân bản
   literal), `status: 'todo'`, `stage: 'clarify'` (để context-discovery sau đó gắn
   `verify` thật, y như một item submit), `deps: []`, `refs: []`,
   `discoveredFrom = item.id` của việc đang chạy. Mọi lần ghi đi qua
   `queue.enqueue` (cửa ghi tuần-tự-hoá), không bao giờ `addWork` thô — an toàn
   fan-out.

#### Hệ quả

- **Runner vẫn một-cửa-ghi.** Worker phát dữ liệu; RUNNER ghi. Không có
  đường ghi song song mới nào mở ra.
- **`discoveredFrom` là lineage phi-chặn** — loại khỏi cycle-check theo thiết kế
  (nó không phải cạnh phụ-thuộc), cưỡi SCHEMA_VERSION lúc bằng 2 tại thời điểm
  đó (nay đã lên 3, per str46-io-contract) — trường lazy additive.
- **C3 mở rộng, có tên, không sửa ngầm.** architecture-map v0.3 → v0.4: hàng C3
  thêm mệnh đề kênh khám-phá; §11 changelog ghi delta. Không module mới, không
  row §6/manifest mới — `loop.mjs`/`dispatch.mjs` mở rộng tại chỗ.

#### Ranh giới tin cậy (bổ chú 2026-07-18, review-fix S11)

`title`/`description` trong một khối `fgos-discovered` là VĂN BẢN KHÔNG ĐÁNG TIN — do
chính worker (một trợ lý đang chạy, có thể bị chèn lệnh từ nội dung không đáng tin nó
đọc phải) tự soạn. Item runner tạo ra từ đó vào thẳng giai đoạn `clarify`, nơi
`title`/`description` nạp vào prompt của MODEL làm-rõ — đây là mặt tiếp xúc thứ hai
(sau chính worker) nơi văn bản không đáng tin chạm tới một model sẽ sinh ra lệnh chạy
được. Chấp nhận CÓ CHỦ Ý, không phải bỏ sót: giảm nhẹ đã có từ thiết kế gốc giữ nguyên
— `verify` KHÔNG BAO GIỜ do worker đặt (luôn `FALLBACK_VERIFY` rồi model/người ở bước
làm-rõ gán lại), nên văn bản worker không đáng tin không thể trực tiếp trở thành một
lệnh shell chạy được; item không mang niềm tin đặc biệt nào, đi qua đúng vòng xét-lại
như một item người tự khai. **Phương án đã cân nhắc, CHƯA XÂY:** một cửa xét-duyệt-người
bắt buộc trước khi một item runner-tự-tạo được dispatch tự động (thay vì vào thẳng
`clarify` như hôm nay) — đổi thiết kế lớn hơn phạm vi một P3 review-fix, ghi lại đây để
cân nhắc lại nếu bằng chứng chèn-lệnh thật xuất hiện.

#### Bảo đảm giao-nhận (bổ chú 2026-07-18, review-fix S11)

Kênh này là **cố-gắng-tối-đa, tối-đa-một-lần** (best-effort, at-most-once) — KHÔNG PHẢI
ít-nhất-một-lần. Một report hợp lệ được `runner` phân tích thành công đúng MỘT LẦN, tại
kết cục cuối của lượt dispatch; nếu tiến trình runner chết giữa lúc phân tích và lúc
`addWork` ghi xong, report đó mất — không có cơ chế đối-soát-lại nào đọc lại output đã
lưu để phục hồi report đã mất. Xem spec Runner "Báo việc-phát-hiện từ trợ lý" / RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm).

#### Phương án đã cân nhắc và bỏ

- **Worker tự gọi `fgos add`.** Bỏ — phá vỡ runner-một-cửa-ghi và làm report
  của worker thành đường ghi không qua goal-check.
- **Truyền id việc đang chạy vào worker để nó tự stamp `discoveredFrom`.** Bỏ —
  vẫn là worker ghi; cùng vi phạm.
- **Parse trong mỗi lần retry.** Bỏ — một khối phát lại qua các lần thử sẽ đúc ra
  item trùng; parse một lần tại kết cục cuối là điểm đúng.

### 0019 — Miễn trừ pre-release cho RUL11 (viết lại nhật ký tại chỗ)

#### Bối cảnh

`RUL11 (tiến hóa schema)` (`docs/specs/work-state.md:886`, D-ID `feed7428`) cấm tường minh: "Nhật ký
đã commit bất khả xâm phạm — không bao giờ migration ghi đè". Luật này nằm trong
một spec, không phải một decision record — nó không có file riêng mang khoá
`superseded_by` để trỏ ngược.

STR46 đổi tên trường `actor` (và các trường phái sinh: `claimActor`, khoá `actor`
trong `settlements[]`, `payload.predicted.actor`) thành `role`/`claimRole` trên
sự kiện đã commit. Ba kho `.fgos` mang dữ liệu cũ: kho sống dùng chung giữa mọi
worktree, kho `dogfood-fixture` (git-theo-dõi trong chính repo sản phẩm), và kho
`fgos-test-drive`. Không viết lại các kho này thì replay sẽ đọc vĩnh viễn hai tên
cho cùng một trường.

#### Quyết định

Ghi nhận một **miễn trừ pre-release** cho `RUL11 (tiến hóa schema)`: trong lúc sản phẩm còn chưa
phát hành, một thao tác migration được phép **viết lại tại chỗ** (ghi đè
`events.jsonl`, không phải append sự kiện bù) thay vì tuân thủ tuyệt đối
"không bao giờ migration ghi đè".

- **Phạm vi (coverage).** Miễn trừ bao trùm cả BA kho `.fgos` liệt ở trên: kho
  sống dùng chung, kho `dogfood-fixture`, và kho `fgos-test-drive`. Cả ba cùng
  nằm trong phạm vi được phép viết lại — không phân biệt kho nào "quan trọng
  hơn" kho nào.
- **Lát cắt (slicing) là chuyện khác, tách bạch khỏi phạm vi.** Slice nào của
  STR46 thực sự thi hành việc viết lại cho kho nào là một quyết định lịch trình,
  không phải một quyết định phạm vi, và nó đã bị dời hai lần: kho sống được dời
  sang bước merge (vì nó dùng chung qua symlink giữa mọi worktree đang sống, và
  viết lại lúc mã còn trên nhánh chưa merge sẽ mở cửa sổ hỏng), rồi kho
  `fgos-test-drive` theo sau khi write-guard được đo là từ chối mọi đường dẫn nằm
  ngoài worktree. Một bản ghi vĩnh viễn không được kế thừa một quyết định lịch
  trình còn đang di chuyển — nên bản ghi này chỉ khoá PHẠM VI, không khoá SLICE
  nào viết kho nào lúc nào.
- **Hết hiệu lực (lapse).** Miễn trừ này **hết hiệu lực khi sản phẩm lên
  v1.0.0**. Từ mốc đó, `RUL11 (tiến hóa schema)` áp dụng đầy đủ trở lại không ngoại lệ — không có
  mốc thì "đang còn xây" sẽ thành một cái cớ vĩnh viễn.
- **Không bao gồm.** Miễn trừ này **không** bao trùm
  `repo/test/fixtures/phase1-events.jsonl` — file đã commit, header tự khai
  "NEVER regenerated or hand-edited", và mang một khẳng định bất biến riêng tại
  `test/state/backward-compat.test.mjs:245` ("the fixture file itself is never
  modified by any test in this suite"). File này không mang trường `actor` nên
  không có gì để đổi; nó bị loại rõ ràng để một script quét theo mẫu
  `**/events.jsonl` không vô tình chạm vào nó.

Vì `RUL11 (tiến hóa schema)` là một luật trong spec chứ không phải một decision record, cách
supersede đúng là: bản ghi này mang `supersedes: []` (không có id nào để trỏ),
và chính dòng `RUL11 (tiến hóa schema)` trong `docs/specs/work-state.md` được sửa để trích dẫn
ngược lại bản ghi này — văn xuôi làm việc mà `superseded_by` sẽ làm nếu mục tiêu
là một decision record.

#### Hệ quả

- **Replay không còn đọc hai tên cho một trường.** Sau khi viết lại và
  `fgos rebuild`, mọi bản chiếu dựng từ log chỉ còn thấy `role`/`claimRole`.
- **Miễn trừ có hạn, không phải giấy phép vĩnh viễn.** Sau v1.0.0, mọi migration
  tương lai quay lại nghĩa vụ append-không-đè của `RUL11 (tiến hóa schema)` như hôm nay.
- **`phase1-events.jsonl` giữ nguyên vai trò chuẩn nghiệm thu tương thích ngược**
  — nó không bị đưa vào bất kỳ lần viết lại nào, kể cả lần này.
- Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0024 — Đổi tên status `proposed` thành `awaiting-approval`

#### Bối cảnh

`0006` đặt tên status `proposed` cho trạng thái "goal-check đạt, đề xuất nằm
trên nhánh chờ duyệt". Quan sát người dùng (2026-07-28, `tsk-66l`): `proposed`
là danh từ trừu tượng, không tự nói "chờ gì" — khác 5 trong 7 status còn lại
(`todo`/`doing`/`blocked`/`done`/`wontfix`), vốn tự-giải-nghĩa hoặc có tiền lệ
ngành (GitHub/Jira). `awaiting-human` đã có convention `awaiting-*` cho trạng
thái chờ; `proposed` là ngoại lệ duy nhất không theo convention đó.

Xác nhận qua đọc code (không suy đoán): FSM chứa `proposed` là domain-agnostic
— `test/e2e/synthetic-domain.test.mjs` chứng minh domain `synthetic` (không
dùng git/merge) cũng đi qua đúng status này. Vậy một tên gắn nghĩa "merge"
(`awaiting-merge`) sẽ SAI bản chất — hardcode ngữ nghĩa domain `coding` vào một
field lẽ ra domain-agnostic.

`proposed` còn là từ vựng DÙNG CHUNG giữa hai field: `work.status` VÀ
`outcome.actual.outcome`/disposition (`docs/specs/work-state.md` Data
Dictionary #4 và O4 cùng dùng chuỗi này cho cùng 1 khái niệm) — đổi một nơi mà
bỏ nơi kia sẽ tái tạo đúng khoảng ambiguity giữa 2 field lẽ ra đồng nghĩa.

#### Quyết định

Đổi tên giá trị `proposed` → `awaiting-approval`, đồng nhất ở CẢ HAI nơi dùng
chung từ vựng: `work.status` (1 trong 7 giá trị enum, `src/state/work.mjs`
`STATUSES`) và `outcome.actual.outcome`/`outcome.predicted.outcome`. Không đổi
FSM edges (`blocked→X`, `doing→X`, `X→done`, `X→todo`, `X→blocked` giữ nguyên
cấu trúc — chỉ đổi TÊN của `X`) — `0006`'s thiết kế FSM vẫn nguyên vẹn, record
này chỉ supersede THUẬT NGỮ, không phải cạnh chuyển trạng thái.

Migration: dưới miễn trừ pre-release cho RUL11 (tiến hóa schema) đã có tiền lệ (`0019`,
`package.json` version `0.1.0`, miễn trừ còn hiệu lực tới v1.0.0), viết
`scripts/migrate-status-proposed-to-awaiting-approval.mjs` (theo đúng khuôn an
toàn của `scripts/migrate-actor-to-role.mjs`: single-path, backup bắt buộc,
dry-run, seq-contiguity check) để ghi đè tại chỗ 3 kho `.fgos` trong phạm vi
`0019` (kho sống dùng chung, `dogfood-fixture/.fgos`, `fgos-test-drive/.fgos`)
— KHÔNG đụng `test/fixtures/phase1-events.jsonl` (đã đo: 0 chỗ chứa
`"proposed"`, loại trừ vô hại).

#### Hệ quả

- Mọi consumer đọc `.status === 'proposed'` hoặc `.outcome === 'proposed'`
  phải đổi sang `'awaiting-approval'` cùng lúc với migration — không có
  compat-shim vĩnh viễn trong `replay.mjs`.
- Dry-run migration script phát hiện kho sống mang một corruption seq-trùng
  lịch sử đã biết trước (`src/state/events.mjs:25`,
  "spike-confirmed duplicate-seq corruption") — không liên quan tới rename
  này, chặn Pha B trên riêng kho sống cho tới khi ai đó xử lý riêng; không
  chặn `dogfood-fixture`/`fgos-test-drive` (dry-run sạch trên cả hai).
- `0006` không sửa tại chỗ — vẫn đúng nguyên văn lịch sử của nó (chỉ nhận thêm
  `superseded_by: 0024` trong frontmatter, đúng khuôn STR72 trỏ-ngược-bắt-buộc);
  record này khai `supersedes: [0006]` — supersede MỘT PHẦN (thuật ngữ), không
  phải toàn bộ thiết kế FSM của `0006`.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0027 — Domain sở hữu vocabulary/transition status đoạn TRƯỚC `delivered` (supersede base-workflow-model)

#### Bối cảnh

`base-workflow-model` (git content-hash `2ae492d8`) không tồn tại như một file
`docs/decisions/` đánh số riêng — nó chỉ sống dưới dạng trích dẫn nội tuyến
`per base-workflow-model / 2ae492d8` ở đúng 3 chỗ trong code/spec hôm
nay: `docs/specs/work-state.md` dòng 61 (Data Dictionary #21, field `domain`)
và dòng 1070 (RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage)), và file header của `src/state/workflow-stage-graphs.mjs`
dòng 1-2. Record này supersede đúng nguyên văn đó — không có id đánh số nào
khác để trỏ tới, nên `supersedes` khai thẳng content-hash `2ae492d8`, đúng
khuôn trích dẫn mà `work-state.md`/`workflow-stage-graphs.mjs` đã tự dùng, thay
vì bịa một id `00NN` không có thật.

**Luật gốc (nguyên văn từ `work-state.md` dòng 1070, RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage)):** "Một
domain khai đúng ba thứ: danh sách stage có thứ tự, step-mapping (bước nào
trong 5 bước base-workflow mỗi stage thỏa), và cạnh chuyển-stage hợp lệ riêng
của nó — domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`), tách
bạch tuyệt đối khỏi `status`." Nói cách khác: `stage` (vĩ mô — domain tự khai
qua `DOMAINS` registry, `workflow-stage-graphs.mjs`) và `status` (vi mô — một
bảng `TRANSITIONS` PHẲNG duy nhất trong `status-fsm.mjs`, dùng chung cho MỌI
domain, không domain nào override) là hai trục tách biệt tuyệt đối. Domain
`coding` và `synthetic` hôm nay (`workflow-stage-graphs.mjs` dòng 51-91) đúng
là ví dụ sống của vế đầu (`DOMAINS[domain].stages/stepMap/transitions`); vế
sau (status) chưa từng có tương đương — `status-fsm.mjs`'s `TRANSITIONS`
(24 cạnh) và `work.mjs`'s `STATUSES` (10 giá trị: `todo`/`doing`/`blocked`/
`awaiting-approval`/`awaiting-human`/`delivered`/`retrospective`/`cleanup`/
`done`/`wontfix`) là hằng số toàn cục duy nhất, không tham số hoá theo
`work.domain` ở đâu cả.

**Vì sao bị revise:** `tsk-38t` (multi-domain schema, Phase 2) cần một domain
sản xuất thật thứ hai (vd `marketing`) tự khai nhãn/luồng trạng thái riêng mà
không phải học/đụng 10 chữ coding-flavored, đồng thời giữ cho các cơ chế
domain-agnostic của fgOS (frontier dep-resolve, rollup, outcome/friction,
discovery-judge, compound-learn trigger) có một cách đọc "item đang ở đâu"
không phụ thuộc từ vựng domain. Bản thân report nguồn
(`plans/reports/research-260730-0931-work-item-schema-multi-domain-upgrade-report.md`,
round 4) ban đầu kết luận **"domain sở hữu TOÀN BỘ bảng transition"** — một
khung rộng hơn record này thật sự chốt. Khung đó đã bị xét lại và THU HẸP
trong phiên `fgos-coding-exploring` cho `tsk-38t`
(`docs/history/phase-2-status-category-schema/DISCUSSION.md`, đọc toàn văn):
§1 tự ghi nhận "Đây là thu hẹp thật so với kết luận round-4 của report gốc
('domain sở hữu TOÀN BỘ bảng transition') — thu hẹp lại đúng phạm vi domain
thật sự cần tự khai (đoạn đầu vòng đời)". Quyết định (chốt vòng 3, seq 5571, xác nhận
người dùng nguyên văn: "đúng, mỗi phần domain sẽ có status/stage trước deliver
là chắc chắn khác nhau. nhưng retro không có status khác nhưng sẽ có cách học
khác (skill), cleanup cũng sẽ có cách dọn khác (skill)") là quyết định thật sự
được chốt — record này formalize đúng, không phải khung rộng ban đầu của
report.

#### Quyết định

**Phạm vi supersede CHÍNH XÁC — chỉ ĐOẠN ĐẦU, không phải toàn bộ FSM.** 10
status hôm nay chia làm hai nhóm bản chất khác nhau, theo tiêu chí "domain có
được tự đặt nhãn/cạnh chuyển khác cho status này không" (DISCUSSION.md §6):

- **NHÓM ĐẦU — 6 status TRƯỚC `delivered`:** `todo` / `doing` / `blocked` /
  `awaiting-human` / `awaiting-approval` / `wontfix`. Kể từ record này, domain
  SỞ HỮU nhãn + bảng transition riêng cho nhóm này — đây là phần thật sự
  supersede `base-workflow-model`. Domain KHÔNG BẮT BUỘC đổi tên
  (coding giữ nguyên cả 6 chữ, 0 migration) — cả hai điều này chỉ trao QUYỀN, không
  ép dùng.
- **NHÓM ĐUÔI — 4 status TỪ `delivered` trở đi:** `delivered` → `retrospective`
  → `cleanup` → `done`, chuỗi TUYẾN TÍNH cố định. KHÔNG domain nào được
  relabel — đây là nghĩa vụ phổ quát của bất kỳ loại hình việc nào (delivery
  thật, nhìn lại, dọn dẹp), không phải từ vựng riêng của `coding` (xác
  nhận trực tiếp: "loại hình việc nào cũng cần delivery, retro, và cleanup...
  chỉ có tổ chức nào quá hời hợt sẽ bỏ qua retro và cleanup"). Khác biệt
  per-domain ở nhóm này nằm ở **skill nào chạy** bước `retrospective` (mở
  rộng đúng field `skillMap` đã có trong `DOMAINS[domain]`,
  `workflow-stage-graphs.mjs`, thêm key `retrospective`; `cleanup` giữ nguyên
  pure-harness, không cần skill — khác biệt per-domain của nó đã đủ qua field
  `worktreeBacked` có sẵn), KHÔNG phải ở tên/cạnh chuyển status.

Bảng map 6 status đoạn đầu → `statusCategory` (field foundation mới,
đóng băng lúc ghi event `work.move`/`work.add`, **KHÔNG derive-on-read** —
luật L3, `docs/platform-foundations.md`):

| status (đoạn đầu) | statusCategory |
|---|---|
| `todo` | `todo` |
| `doing` | `in-progress` |
| `blocked` | `in-progress` |
| `awaiting-human` | `in-progress` |
| `awaiting-approval` | `review` |
| `wontfix` | `canceled` |

`statusCategory` là **bản nén có mất mát, đã chứng minh lủng** — KHÔNG được
dùng để validate move: cạnh `blocked → awaiting-human` không tồn tại trong 24
cạnh thật của `status-fsm.mjs` hôm nay, dù cả hai status cùng rơi vào category
`in-progress`; validate ở tầng category sẽ tự động legalize sai cạnh này.
Validate move vẫn luôn đi qua bảng transition ĐẦY ĐỦ, MỊN của chính domain đó
(`status-fsm.mjs` hôm nay cho `coding`) — `statusCategory` chỉ phục vụ các cơ
chế domain-agnostic (frontier `ready`-filter, rollup, outcome/friction,
discovery-judge) đọc "item đang ở nhóm nào" mà không cần học từ vựng của từng
domain.

4 status đoạn đuôi **KHÔNG cần** `statusCategory` — literal status đã đủ dùng
mãi mãi cho mọi domain, không có khái niệm "domain tự đặt nhãn cho `delivered`"
để cần nén.

Ngoài phạm vi supersede (tách bạch nêu trên, không phải quyết định mới):
thêm field optional `domainFields: { [domainName]: {...} } }` trên work item
cho dữ liệu nested per-domain, optional-additive, ghi đè toàn object mỗi lần
`edit` (latest-wins, cùng khuôn `refs`/`deps`/`acceptance`), validate qua
`fieldSchema` optional khai trong `DOMAINS[domain]` nếu domain có khai — pattern
độc lập với phần status/category ở trên, KHÔNG được implement trong record này
(ngoài phạm vi `tsk-38t-1`, thuộc `tsk-38t-2` trở đi).

#### Audit: mọi consumer thật của `status-fsm.mjs`/`STATUSES`/`TRANSITIONS`/literal status hôm nay

Quét bằng `rg -n "STATUSES|TRANSITIONS" src/ bin/ --glob '*.mjs'` và
`rg -n "'todo'|'doing'|'blocked'|'awaiting-approval'|'awaiting-human'|
'delivered'|'retrospective'|'cleanup'|'wontfix'"` trên `frontier.mjs`,
`retro-pool.mjs`, `status-fsm.mjs`, `runner/*.mjs`, `bin/fgos.mjs` — cộng thêm
quét mở rộng ra mọi consumer thật của tập `RESOLVED_STATUSES` (đã là 1 tập
"giống category" viết tay, DISCUSSION.md §3 #3) và ra khỏi thư mục `src/`/`bin/`
(CLI-display doc, external Rust consumer) để không bỏ sót theo đúng yêu cầu
acceptance của `tsk-38t`. Cột "Đổi?" nói rõ consumer này có cần đổi sang đọc
`statusCategory` (hoặc bảng transition riêng của domain) hay giữ nguyên literal
mãi mãi theo đúng ranh giới đầu/đuôi vừa chốt ở trên.

##### 1. Nguồn sự thật (định nghĩa STATUSES/TRANSITIONS)

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/state/work.mjs:83-94` | `STATUSES` — 10 giá trị hợp lệ, nguồn duy nhất (`status-fsm.mjs` re-export, không định nghĩa lại) | Có — trở thành union của "10 giá trị coding" thay vì hằng số toàn cục duy nhất; domain khác khai `statusLabels` riêng trong `DOMAINS[domain]` (mở rộng `workflow-stage-graphs.mjs`, chưa tồn tại — `tsk-38t-2`) |
| `src/state/work.mjs:205-207` | `validateWork` — chặn `work.status` ngoài `STATUSES` (phạm trù `validation`) | Có — phải đọc bảng transition/label của `work.domain`, không phải hằng số toàn cục |
| `src/state/status-fsm.mjs:99-152` (`TRANSITIONS`, 24 cạnh) | Bảng chuyển-status PHẲNG duy nhất, validate mọi `transitionWork` | Có, nhưng CHỈ phần đoạn đầu (19/24 cạnh chạm 6 status đoạn đầu) — 5 cạnh đoạn đuôi (`delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`) giữ nguyên, dùng chung mọi domain |
| `src/state/status-fsm.mjs:193-256` (`transitionWork`) | Hàm validate + sinh event, đọc `TRANSITIONS` trực tiếp | Có — cần tham số hoá theo `work.domain` cho phần đoạn đầu |

##### 2. `RESOLVED_STATUSES` (tập "giống category" viết tay, trộn cả 2 nhóm)

`src/state/frontier.mjs:186` khai `RESOLVED_STATUSES = new Set(['delivered',
'retrospective', 'cleanup', 'done', 'wontfix'])` — trộn 4 status ĐUÔI (cố
định) với `wontfix` (ĐẦU, domain-owned label nhưng luôn map `canceled`).
Đây chính là hệ quả DISCUSSION.md §6 "Hệ quả 1" đã lường trước: khi hiện thực
hoá, chỗ này phải đọc HỖN HỢP — literal cho 4 tên đuôi + `statusCategory ===
'canceled'` cho phần thay `wontfix` (để bắt được cả label khác domain map vào
cùng category) — không còn là 1 Set string thuần.

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/state/frontier.mjs:107,128,186,202` | Định nghĩa + dùng cho `ready`-filter dep-resolve và `hasOpenDescendant` | Có — hỗn hợp literal-đuôi + category-canceled, như trên |
| `src/state/frontier.mjs:92` | `item.status !== 'todo'` — cạnh CÒN LẠI của `ready`-filter, literal `todo` (đoạn đầu) | Có — phải đọc `statusCategory === 'todo'` để domain khác dùng nhãn khác cho "chưa bắt đầu" vẫn được nhặt |
| `src/state/graph-metrics.mjs:15,298,358,378,401,406` | Import `RESOLVED_STATUSES`, đếm dep-blocked/not-done cho `graph`/`triage`/`stale` verb | Kế thừa tự động từ thay đổi ở frontier.mjs (chỉ gọi `.has`, không tự literal-compare) — cần đổi CHỮ KÝ gọi nếu `RESOLVED_STATUSES` đổi từ Set sang hàm `isResolved(item)` |
| `src/state/graph-harness.mjs:22,103,106,108,143,154` | Import `RESOLVED_STATUSES`, gate `deps`/`mergeAfter` sẵn sàng cho `evolve`/dispatch | Như trên — kế thừa, đổi chữ ký gọi |
| `src/state/drift-status.mjs:16,93` | `needsSync` — root chưa resolved mà ahead-of-target | Như trên |
| `src/state/impact.mjs:24,90,146` | `openIds`/dep resolved-filter cho impact-analysis nội bộ fgOS | Như trên |
| `src/runner/claim-port.mjs:11,159` | `unmergedDeps` — chặn claim khi dep chưa resolved | Như trên |
| `src/report/entropy.mjs:15,17,41,96` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ riêng (`awaiting-approval`,`blocked`,`done`) cho báo cáo entropy/stale-clarify | Có — `FINAL_STATUSES` cục bộ này TỰ Ý trộn 1 status đầu (`awaiting-approval`,`blocked`) với 1 status đuôi (`done`), là một bản sao lệch nghĩa của `RESOLVED_STATUSES` cần rà lại cùng lúc |
| `bin/fgos.mjs:33,544,1373` | Import `RESOLVED_STATUSES` + `FINAL_STATUSES` cục bộ (`awaiting-approval`,`blocked`,`delivered`,`retrospective`,`cleanup`,`done`) cho outcome-backfill check và ready-view filter | Có — cùng lý do, cần đối chiếu lại theo ranh giới đầu/đuôi mới |

##### 3. Literal status trong verb logic của `bin/fgos.mjs` (tầng CLI/store — chính là "bảng transition của domain coding" hôm nay)

| File:line (khu vực) | Vai trò | Đổi? |
|---|---|---|
| `bin/fgos.mjs:700,816,2958` | `status: 'todo'` mặc định lúc `add`/`submit`/`sync-root` khai item mới | Không đổi hành vi coding (label giữ nguyên); về nguyên tắc trở thành default của domain đó, không hằng số toàn cục |
| `bin/fgos.mjs:1358,1382` | Check `item.status === 'awaiting-human'` cho verb `ask`/`answer` | Đoạn đầu — domain-owned, nhưng cơ chế ask/answer bản thân domain-agnostic (async-human-gate, `status-fsm.mjs` header) nên về sau nên đọc category `in-progress` + field `ask`/`answer` thay vì literal `'awaiting-human'` nếu domain khác đặt tên khác cho park-state |
| `bin/fgos.mjs:1800,1834,1866,1894,1957` | Check `'todo'`/`'blocked'`/`'doing'` cho `take`/`return`'s claim/verify flow | Đoạn đầu — domain-owned; verb `take`/`return` hôm nay hardcode transition coding, cần đọc bảng transition của `work.domain` khi domain thứ hai sản xuất thật xuất hiện |
| `bin/fgos.mjs:2036-2114` | `doing → awaiting-approval`/`doing → blocked` (return verb, goal-check pass/fail) | Đoạn đầu — domain-owned |
| `bin/fgos.mjs:2129,2278,3015-3019` | `awaiting-approval` check cho `approve`/`reject`, `awaiting-approval → todo` (reject, mang `reason` bắt buộc) | Đoạn đầu — domain-owned |
| `bin/fgos.mjs:2234,2455-2456,2525-2748` | `awaiting-approval → delivered` (approve merge/GitHub/verify-only) và các cạnh `awaiting-approval → blocked` (merge-conflict/verify-fail-post-merge, mang `reason`) | **Ranh giới đầu/đuôi** — cạnh này BẮC CẦU 2 nhóm (nguồn đoạn đầu, đích đoạn đuôi); giữ nguyên vì `delivered` là điểm vào cố định của đuôi, nhưng điều kiện gate ở phía `awaiting-approval` vẫn đoạn đầu, domain-owned |
| `bin/fgos.mjs:3047,3125-3193` | `blocked → awaiting-approval` (sync-root/catchup mechanical reconcile, fan-out-parallel) | Đoạn đầu — domain-owned |
| `bin/fgos.mjs:1020-1025` | `case 'retrospective'`: yêu cầu `item.status === 'delivered'`, chuyển `delivered → retrospective` | **Đuôi — KHÔNG đổi** (chuỗi đuôi cố định, dùng chung mọi domain) |
| `bin/fgos.mjs:1042-1082,1114` | `case 'cleanup'`: yêu cầu `status === 'cleanup'`, chuyển `cleanup → done`/`cleanup → blocked`; `case 'compound'` yêu cầu `status === 'retrospective'` | **Đuôi — KHÔNG đổi** cạnh transition; nhưng verb `cleanup`/skill chạy `retrospective` là nơi gap thật của `skillMap.retrospective` sẽ cắm vào (chưa code — `tsk-38t` decompose kế tiếp) |
| `bin/fgos.mjs:658-672` (`collectRollupData`) | `w.status === 'done'` — đếm con `done`/tổng con cho verb `rollup` | **Đuôi — KHÔNG đổi** (`done` là literal cố định) |

##### 4. `runner/` — vòng tự hành, tiêu thụ nặng nhóm đầu

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/runner/loop.mjs:336,352,381,383` | Check `status !== 'doing'`, resolve crash-reclaim (`doing → blocked`) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:546,598` | `status: 'todo'` mặc định item mới do runner tự sinh (discovered-from) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:720,729,738` | `doing → awaiting-approval`, outcome `'awaiting-approval'` (goal-check pass) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:797-798,1060` | `doing → blocked` (verify-fail/anti-loop trip) | Đoạn đầu — domain-owned |
| `src/runner/loop.mjs:976,996` | Check `item.stage === clarifyStage/decomposeStage && item.status === 'todo'` — cổng phối `stage` × `status` để chọn dispatch | **Điểm giao thoa 2 trục** — `stage` đã domain-owned (phần cũ vẫn đúng phần này), `status` literal `'todo'` ở đây cần đổi sang category `todo` để domain khác không bị lệch |
| `src/runner/anti-loop.mjs:59` | Đếm `event.payload.to === 'doing'` cho visit-count chống lặp | Đoạn đầu — domain-owned |
| `src/runner/claim-port.mjs:44,204-261` | `take` verb: `'todo'`/`'blocked'` (branch-take) → `'doing'` | Đoạn đầu — domain-owned |
| `src/runner/github-adapter.mjs:56,90,106,123,150,179` | `outcome: 'blocked'` (disposition, TỪ VỰNG DÙNG CHUNG với `status` per `0024`) khi `gh` thất bại | Đoạn đầu (disposition-side) — cần đồng bộ cùng lúc với `status`, đúng bài học `0024` (đổi 1 nơi bỏ nơi kia tái tạo ambiguity) |
| `src/runner/promote-engine.mjs:79` | `outcome: 'blocked'` | Như trên |
| `src/runner/recovery.mjs:131,133` | Crash-recovery resolve `to: 'awaiting-approval'` / `to: 'blocked'` | Đoạn đầu — domain-owned |

##### 5. Cơ chế domain-agnostic khác (được DISCUSSION.md liệt tường minh)

| File:line | Vai trò | Đổi? |
|---|---|---|
| `src/state/retro-pool.mjs:12,21` | `isRetrospectiveReady`: `item.status === 'retrospective'` literal | **KHÔNG đổi — xác nhận trực tiếp** ("`retro-pool.mjs`'s literal `status === 'retrospective'` đúng mãi mãi, không cần đổi") |
| `src/intake/discovery.mjs:128,649,651,674-690` | `statusAtAsk`/ask-answer gate đọc `work.status` (`todo`/`doing`/`awaiting-human`) để resume đúng chỗ | Đoạn đầu — domain-owned; cơ chế bản thân domain-agnostic (mirror `status-fsm.mjs`'s async-human-gate), nên về sau nên đọc category thay vì literal 3 tên này |
| `docs/reference/triage-table-columns.md:18` | Bảng cột hiển thị CLI liệt kê CHỈ 7 status cũ (`todo`/`doing`/`blocked`/`awaiting-human`/`awaiting-approval`/`done`), "rendered as-is" — literal, đã lệch 10 status thật hôm nay (thiếu `delivered`/`retrospective`/`cleanup`/`wontfix`) | **Gap có thật, ĐỘC LẬP với quyết định category** (DISCUSSION.md §3 #6) — cần sửa dù thiết kế category chốt kiểu gì; hiển thị "as-is" hôm nay đã ngầm giả định 1 domain, sẽ hiện sai khi domain khác dùng nhãn khác cho cùng category |
| `herdr-plugin/src/fgos.rs:46,101,110,203-272` | Tiến trình Rust NGOÀI runtime Node — parse `fgos list --all --json` stdout, lọc `item.status == "doing" \|\| item.status == "awaiting-approval"` (tsk-4vo) để hiển thị pane "in-process" | **Consumer NGOÀI biên `src/`/`bin/`, qua ranh giới CLI/JSON** — domain-owned, đọc literal string coding hôm nay; nếu domain khác đổi nhãn 2 status này, `herdr-plugin` vỡ ngầm trừ khi tự đọc `statusCategory` thay literal — phải liệt vào backlog migrate-consumer của `tsk-38t-3` (consumer-migration), không chỉ audit mã nguồn `.mjs` |

##### 6. Gap liên quan nhưng KHÔNG phải phạm vi audit status literal (ghi nhận để không lặp lại công sức)

`fgos-coding-compounding` bị gọi CỨNG cho mọi item tới `retrospective`
(`src/state/retro-pool.mjs`, `bin/fgos.mjs:1012,1088`) — không tham số hoá
theo domain. Đây là gap đã chốt hướng xử lý (mở rộng `skillMap` sang key
`retrospective`) nhưng CHƯA code — thuộc `tsk-38t` decompose kế tiếp, không
phải một "consumer literal status" cần audit ở record này.

#### Hệ quả

- **Record này là tiền điều kiện bắt buộc cho `tsk-38t-2` đến `tsk-38t-7`**
  (schema `statusCategory`/`STATUS_CATEGORIES`, migration backfill,
  consumer-migration theo audit ở trên, `skillMap.retrospective`,
  `domainFields`/`fieldSchema`, domain giả lập thứ hai THẬT có bảng
  transition khác coding để chứng minh thiết kế) — **không phần nào trong số
  đó được bắt đầu code trước khi file này tồn tại**, đúng yêu cầu acceptance
  gốc của `tsk-38t` ("cần decision record mới đúng khuôn 0024 supersede 0006,
  viết TRƯỚC khi code").
- `base-workflow-model` (`2ae492d8`) KHÔNG bị sửa tại chỗ — nguyên văn
  của nó vẫn đúng lịch sử; record này chỉ supersede đúng phạm vi status/domain
  đã nêu, không phải toàn bộ ngữ cảnh `base-workflow-model` (S1/S2 domain
  registry cho `stage` vẫn đứng nguyên, không bị chạm).
- `RESOLVED_STATUSES` (`frontier.mjs:186`) và mọi consumer của nó (§2 ở trên)
  là điểm rủi ro tập trung nhất khi hiện thực hoá — nó là tập string viết tay
  DUY NHẤT hôm nay trộn cả 2 nhóm đầu/đuôi; sửa sai chỗ này lan ra ít nhất 7
  file khác (`graph-metrics.mjs`, `graph-harness.mjs`, `drift-status.mjs`,
  `impact.mjs`, `claim-port.mjs`, `entropy.mjs`, `bin/fgos.mjs`) chỉ vì chúng
  gọi `.has` trên đúng 1 Set dùng chung.
  `entropy.mjs`/`bin/fgos.mjs`'s `FINAL_STATUSES` cục bộ là 2 bản sao ĐÃ LỆCH
  nghĩa nhau (khác tập con) — cần rà đồng thời, không chỉ theo dấu
  `RESOLVED_STATUSES`.
- `herdr-plugin/src/fgos.rs` xác nhận việc audit "consumer của status" không
  dừng ở biên `src/`/`bin/` của repo Node — bất kỳ tiến trình ngoài nào đọc
  `fgos list --all --json` cũng là 1 consumer thật của vocabulary status, cần
  đưa vào phạm vi khi `tsk-38t-3` (consumer-migration) thực thi.
- `docs/reference/triage-table-columns.md` lệch code (7 vs 10 status thật) là
  gap có thật nhưng ĐỘC LẬP khỏi quyết định category — không chặn record này,
  nhưng nên sửa cùng đợt `tsk-38t-3` để tránh phải quét lại 2 lần.

### 0032 — Multi-role Team Harness: trục role/holder, handoff, và marketing-cockpit absorption

> Bằng chứng distill của 24 vòng thảo luận (2026-08-15, item `tsk-2t9c`),
> người dùng duyệt từng cụm qua các vòng và duyệt bản distill này ở vòng
> 21 (mục Artifact-schema bổ sung ở vòng 24). Nguồn chi tiết: `docs/history/fgos-
> marketing-domain-foundation/DISCUSSION.md` (Q&A log + §6 synthesis),
> `CONTEXT.md` (bảng đầy đủ các quyết định), `plan.md` (spec 3
> mảnh triển khai, chi tiết per-file).
> Mỗi D-ID dưới đây có bản ghi máy tương ứng qua `fgos decision`
> (event seq ghi kèm) — ba nguồn phải luôn khớp nhau. File này là bản
> copy đã đóng dấu quyết định (nguồn sống, đầy đủ nhất vẫn là
> `docs/history/fgos-marketing-domain-foundation/`).

#### Hành trình

Xuất phát từ yêu cầu so sánh cơ chế điều phối fgOS vs marketing-cockpit
(2 scout haiku + phản biện fable, vòng 1–2), thảo luận mở rộng thành
thiết kế **core harness tổng quát cho team agent đa role** — absorption
cockpit trở thành *khách hàng đầu tiên* của harness thay vì mục tiêu duy
nhất. Hội tụ lần 1 ở vòng 8 (exploring + planning đã chạy), người
dùng dừng trước implement rồi đào sâu thêm 16 vòng ra, và
planning chi tiết per-file (vòng 22).

#### I. Kiến trúc nền (seq 18029, 18031)

- **Mechanism vs Policy**: harness (cơ học) chỉ gác legality + ghi sự
  thật vào event log + đánh thức đúng vai — *không bao giờ phán đoán*.
  Soul (agent-type) hiểu vai trò, hiểu vấn đề, biết cần ai support — *tự
  chọn* edge hợp lệ. Route bậy → REFUSED kèm danh sách edge hợp lệ
  (chặn và dạy tại chỗ).
- **Ba trục trực giao trên work item**: `status` (lifecycle phổ quát, 11
  trạng thái — giữ nguyên) × `stage` (thuộc workflow đã chọn) ×
  `role/holder` (mới, opt-in per-domain qua `roleGraph`).
- **Ba tầng điều phối không giẫm nhau**: Router/Driver (who/what-next —
  `fgos-routing`, `fgos-coding-driving`) / Guard (legality — FSM +
  roleGraph + gates) / Dispatch (executor nào chạy —
  `src/runner/dispatch.mjs` decide/execute, một cửa).

#### II. Handoff — trái tim của tính uyển chuyển (seq 18032, 18070, 18058)

- **Hai loại handoff**: **Call** (round-trip, bóng về người gửi) với 4
  reason do người dùng định nghĩa: `advise` / `assist` (tay chân) /
  `review` (phản biện) / `consult` (chuyên môn) — tổng quát hoá
  `fgos ask/answer` sẵn có. **Pass** (chuyển giao một chiều theo stage).
  Ranh giới: cùng item → handoff; khác item/cây → signal.
- **Call lồng được, trần callstack** (mặc định 3, config override — con
  số cụ thể do planning quyết, người dùng chốt nguyên tắc vòng 5).
- **Ghi log hai mức**: async call = handoff event đầy đủ, holder
  đổi; sync call trong-session (subagent) = một event `call-summary`
  gọn, holder giữ nguyên. Invariant: *holder chỉ đổi qua async handoff*.
  Mỗi handoff = một checkpoint hạt mịn tự nhiên (context snapshot trong
  event + worktree commit cho artifact) — không cần checkpoint machinery
  riêng như cockpit.
- **Gate hard/soft**: hard một-chiều ⟺ side effect vượt ranh giới
  item/worktree (merge main CTR005, publish ra ngoài, terminal
  done/wontfix, cleanup đã xoá worktree; vùng hậu-merge một chiều —
  rework = item mới). Mọi gate nội bộ item = soft: quay lại được nhưng
  *bắt buộc ghi reason* → rework thành tín hiệu compound-learn. Áp
  nguyên xi cho marketing (publish = hard, editorial approval = soft).

#### III. Cấu trúc khai báo (seq 18059, 18060, 18110, 18189, 18232, 18242)

- **Hierarchy: domain → N workflow → item**. Coding đang gộp 1
  workflow (bằng chứng gồng: discovery-verdict skip là nhánh vá; luật
  bug-prove-cause khác bản chất feature; docs/chore chịu ceremony thừa)
  — un-gộp thành `feature` (graph hiện tại, default) / `bugfix` /
  `lightweight`. Selector tái dùng `kind` qua map `workflowFor` có
  default; item cũ fold về default, không migration. Phân biệt đóng
  đinh: **workflow** = shape lifecycle MỘT item; **template**
  (`fgos expand`) = composition NHIỀU item thành cây.
- **Ontology 4 tầng**: **task-spec** (phiếu giao việc —
  contract: input/output/gates/verify-template; bất biến theo người làm)
  / **skill** (know-how — của executor, compound-learn rewrite tự do) /
  **knowledge** (chuyên môn domain — coding phần lớn nằm trong model
  weights, marketing là tài sản file thật của cockpit) / **context**
  (bối cảnh instance — chính là refs/docsRef/docs/CONTEXT.md/memory sẵn
  có, không xây gì mới). Lợi ích tách đã kiểm chứng: `review-item` có 3
  executor ngay hôm nay (người + /code-review + reviewer-agent tương
  lai); engine chỉ parse được contract (sự cố tsk-59a: contract `Mode:`
  chôn trong skill prose, đổi văn phong gãy regex engine); tần suất đổi
  khác nhau cần mức gate khác nhau; có-phiếu-trước-có-tay-nghề-sau khi
  port cockpit. Nói thật cả case không đáng tách: 1 executor vĩnh viễn,
  không engine coupling → A-lite không tách đại trà.
- **Collaboration trigger**: mỗi task-spec bắt buộc có bảng
  trigger-prose per call-edge, per (workflow × stage) — *khi nào gọi,
  reason gì, tới ai, bóng về mang gì*. Đây là câu trả lời cho "làm sao
  agent biết khi nào nên hỏi gì và hỏi ai". Prototype đã chạy thật ở
  dạng ngầm: filter material/grounded/answerable của exploring = trigger
  advise; description của fgos-researching = trigger consult. Phân công
  runtime: **prose dạy — soul quyết — guard chặn**; lệch pattern hiện ra
  ở compound-learn qua call-summary/handoff events.
- **Position vs Agent-type**: roleGraph đóng ở **5
  position** (implementer / researcher / reviewer / helper /
  advisor) — nguyên tắc *nở task trước, nở role sau*
  (security-auditor = Reviewer + phiếu `audit-security`, không phải role
  mới). Chức danh (PO/PM/TechLead/SE/Tester) = **agent-type definition
  sẵn có** (`.claude/agents/*.md`), khai eligibility bằng đúng **một
  field frontmatter `claims: [phiếu]`** — positions suy ra từ phiếu.
  *(Ghi chú: Field `claims:` trong D-12 đã bị đảo ngược bởi decision D-20 tại `docs/history/core-foundation-domain-boundary/DISCUSSION.md:461` và `assignable-to` được đổi tên thành `agent:` bởi decision D-26 tại `:467`. Mô hình hiện hành: agent-type khai báo `skills:` trên agent-type definition; task-spec khai báo `requires-skill:` hoặc chỉ định agent-type cụ thể qua `agent:`).*
  Không roster file, không humans registry, không agent-pools: pool size
  = worker-slots sẵn có; spawn-on-demand = runner/dispatch sẵn có; thẩm
  quyền human = pull-door verbs sẵn có (approve/answer do người chạy).
  PM cổ điển đã được máy hoá (frontier/triage/stale/merge) — đúng nghĩa
  ưu tiên #2 "release con người". Coding có ~13 phiếu: 6 phiếu stage của
  implementer + 7 phiếu call-target.
- **Binding soul↔role (seq 18229)**: role là thuộc tính *per-item*,
  không phải ghế team. Cross-item: nhiều soul cùng position chạy song
  song (parallel claims sẵn có). Trong item: call nhắm `(position,
  phiếu)` → rơi vào frontier như work-order nhỏ → session mang
  agent-type có phiếu đó trong `claims` tự claim (**pull**, không
  push-assign), claim event ghi (sessionId, agent-type); **sticky trong
  một call-thread** (vòng sau về đúng soul giữ context); **targeted
  call** (`--to-soul`) là ngoại lệ có chủ đích, ghi event cho
  compound-learn soi. Soul instance là runtime record sinh lúc claim —
  không phải config. Solo mode thoái hoá êm: một soul mang nhiều
  agent-type, self-review vẫn hữu hình trong log.
- **Artifact-schema (seq 18242)**: ép schema tách đôi — **harness**
  cấp validator + chokepoint (validate TRƯỚC dispatch để không đẻ item con
  mồ côi; lỗi trả về machine-readable để agent tự sửa; luôn có đường soft
  ghi reason, không chặn cứng), **schema là domain data** khai cạnh
  task-spec. Cockpit ship 41 file JSON-Schema draft-07 chia hai họ:
  declaration (~8: agent/skill/workflow/runtime — học ngay dạng doctor
  check) và artifact (~33: brief/slot/calendar/persona/brand-profile —
  đi cùng port marketing). KHÔNG làm artifact-schema cho coding: artifact
  coding là văn xuôi, không phải structured data. Việc cockpit thường
  xuyên sai schema là bằng chứng ỦNG HỘ gate cơ học cho structured data do
  LLM sinh, đồng thời cảnh báo enforcement không có đường sửa thì item
  kẹt.

#### IV. Trình tự triển khai (seq 18030)

**Coding trước** (quyết định người dùng, đảo đề xuất marketing-first ban
đầu): coding đã chứa đủ 4 tương tác call ở dạng ngầm — chỉ nâng thành
move hữu hình, không phát minh tương tác mới:

| Reason | Tương tác ngầm hiện có |
|---|---|
| consult | `fgos-researching` gọi giữa exploring/planning |
| review | `code-review` / vòng approve-reject |
| assist | subagent fanout (`fgos-fanout`, Agent tool) |
| advise | `fgos ask`/`answer` + `awaiting-human` |

Thứ tự: ① role-axis + handoff đáp lên graph đơn hiện tại → ② un-gộp
coding thành 3 workflow → ③ task-spec A-lite (~13 phiếu, chạy song song
①② được) → ④ marketing (DOMAINS entry + port + template + judge-gate).

#### V. Kết luận so sánh marketing-cockpit (vòng fable, vẫn đứng vững)

**Lấy về fgOS**: 39 skills + 30 task-spec (tài sản chính); signal →
biểu diễn lại thành event typed-payload + projection theo consumer
cursor trên `.fgos/events.jsonl` (KHÔNG store thứ hai; phần engine thật
duy nhất là frontier signal-readiness cho fan-out tới item chưa tồn tại
— *hoãn* tới use-case thật); 25 workflow → phân về template stamper
(`fgos expand`) hoặc per-item workflow tuỳ cái; 5 loại quality-gate →
skill sau `fgos gate` CLI mỏng (chờ câu hỏi #7).

**Quy tắc port tách-bốn** cho một task yaml của cockpit: schema/gates →
task-spec; process-steps → nguyên liệu seed skill; frameworks/formulas →
knowledge; studio/brand → context.

**Cockpit bỏ khi vào fgOS**: `run.yaml` per-run (source-of-truth kép —
event-sourced work item thay thế, phải giết đầu tiên); run FSM riêng
(status FSM 11 trạng thái của fgOS bao trùm, có awaiting-human vs
awaiting-approval vs retrospective mà cockpit không phân biệt); bộ 3
file routing/delegation/priority (protocol-not-engine, prose-enforced là
liability — 1 DOMAINS entry engine-enforced thay thế); phần lớn
checkpoint machinery (có free từ event log + worktree commit); adapter
đa nền tảng (scope cut ghi nhận tường minh — fgOS Claude-native trước).

#### VI. Treo có chủ đích (không phải quên)

1. **#7 — Judge-gate (LLM-graded rubric) có tính là "proof" theo luật L5
   DoD không?** Rủi ro sắc nhất: nếu không chấp nhận, mọi item marketing
   rơi về `awaiting-human`, frontier nghẽn ở người, ưu tiên #2 sụp đúng
   domain vừa thêm. Quyết tường minh ở lượt marketing.
2. **#15 — Team overlay trên domain** (2 team cùng domain khác shape) —
   YAGNI, chưa xây.
3. **Signal bus** — hoãn tới fan-out use-case thật (vd brand-voice
   invalidation).
4. **Scheduler** — cron ngoài gọi `fgos add` trước; trigger primitive
   chỉ khi cron chứng minh thiếu.
5. **Human modeling đa người** — pull-door verbs đủ cho tới khi có team
   nhiều người thật.

#### VII. Trạng thái tại thời điểm distill (2026-08-15)

- **Validating đã chạy xong**: reality gate 6/6 PASS, feasibility matrix
  có bằng chứng thật từng dòng, verdict **READY WITH CONSTRAINTS**; gate
  `validateApprove` hỏi người (`canAutoApprove: false` — hard-gate
  keyword `schema`/`migration`, true positive), người dùng chọn
  mechanism-first → **D7a** (seq 18248). `fgos plan --verdict decompose`
  materialize **3 item con** ở stage `executing`: `tsk-2t9c-1` (role
  axis, heavy), `tsk-2t9c-2` (workflow hierarchy, heavy, `deps:
  [tsk-2t9c-1]`), `tsk-2t9c-3` (task-spec + doctor check, standard).
- 13 D-ID khớp ở 3 nơi: event log, bảng §4 `DISCUSSION.md`,
  bảng Locked decisions `CONTEXT.md`.
- Hai bẫy ghi lại trong plan: `src/state/handoff.mjs` phải có row trong
  `docs/architecture-manifest.json` (không thì `test/architecture.
  test.mjs` đỏ), và file đó phải PURE (cap/depth do caller truyền —
  khuôn `hasWorkerSlotRoom({ceiling})`).

#### VIII. Sau distill — implement, review độc lập, và verify thật (2026-08-15/16)

Phần này KHÔNG có trong bản distill gốc — thêm khi copy sang
`docs/decisions/` để bản ghi không đứng yên khi thực tế đã đi xa hơn.
Toàn bộ chi tiết per-D-ID, per-commit sống ở
`docs/history/fgos-marketing-domain-foundation/CONTEXT.md` (bảng)
và `DISCUSSION.md` (Q&A theo round); đây chỉ là điểm mốc.

Ba mảnh ①②③ implement, test, tự review, commit tuần tự trên chính branch
`fgw/tsk-2t9c` theo lệnh người dùng ("mọi thứ tự quyết"). Sau đó, theo
yêu cầu review nghiêm túc của người dùng:

- **Nối dây handoff thật**: 5 skill coding-domain (`fgos-coding-implement`/
  `discovering`/`exploring`/`planning`/`validating`) nối dây thật vào
  `handoff`/`handoff-return` — không chỉ có cơ chế, mà skill THẬT gọi nó.
- **Review độc lập**: review độc lập (agent `code-reviewer` mới, không chia sẻ
  context) tìm ra 2 lỗi HIGH + 3 MED + 4 LOW trong chính cách nối dây
  handoff thật vừa làm ở trên — tất cả đã sửa (chi tiết: giữ role/holder axis nhất quán qua
  reclaim lặp tới khi về `implementer`, `roleGraph` phủ cả stage
  `decompose` legacy, v.v.).
- **Khoá `kind` sau khi rời `todo`**: một câu hỏi kiến trúc của người dùng ("`fgos-coding-driving`
  có nên là cross-workflow router?") dẫn tới tư vấn Opus độc lập, phát
  hiện `kind` (field chọn workflow của item) sửa tự do không kiểm soát —
  fix: khoá `kind` một khi `status` rời `todo`, không cần field
  `workflow` riêng.
- **Chuyển lệnh review vào ENGINE**: một lần chạy AGENT THẬT (không phải test đơn vị) theo đúng
  prose của `fgos-coding-implement`, trên một item thật, phát hiện
  handoff `review` KHÔNG bắn được trong thực tế dù prose ra lệnh rõ ràng
  — nguyên nhân: lệnh nằm cuối, lặp lại 2 lần (return/catchup), không gì
  kiểm tra khi bị bỏ sót. Fix: chuyển lệnh vào ENGINE (`moveWork` tự bắn
  khi `status` chạm `awaiting-approval`), không còn phụ thuộc agent đọc
  hết prose. Xác nhận lại bằng agent thật lần nữa (`tsk-3vk`,
  2026-08-16): `work.handoff` với `reason: "review"` bắn đúng, agent
  không hề tự gọi.

Bài học chung xuyên suốt ba mục trên: **test đơn vị/tích hợp chứng minh
engine đúng, không chứng minh agent theo prose sẽ hành xử đúng** — chỉ
một lần chạy thật, agent thật, theo đúng hướng dẫn, trên item thật, mới
lộ ra khoảng cách đó. Nơi khoảng cách này lặp lại (một hành vi bắt buộc
nhưng không gì kiểm tra khi bị bỏ sót), hướng sửa đúng là chuyển bảo
đảm vào engine, không phải viết prose mạnh hơn.
