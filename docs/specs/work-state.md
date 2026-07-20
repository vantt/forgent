---
area: work-state
updated: 2026-07-21
sources: [phase-1-state-layer, phase-1-review-fixes, phase-2-routing-s1, phase-2-routing-s2, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, async-human-gate, stage-intake, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1, install-coexistence, discovery-context, worker-execution, fan-out-parallel, human-rounds, work-item-verb-surface, base-workflow-model-s1, base-workflow-model-s2, self-improve-loop, work-graph-intelligence-s1, work-graph-intelligence-s2a, work-graph-intelligence-s2b, entry-standardization, work-id-tsk-hash, p50-workflow-induct, str61-chat-context-continuity, str68-discovery-judge-robustness, compound-learn-enduser-docs]
decisions: [9ac6ca50, 0790031c, 451ca088, fd17309a, 55ad2f9f, feed7428, 1a80b4d3, 65c642a8, 9f6b52c8, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e, f1715488, 8788e9bb, cfae0120, 396d9d9e, 2e92b7a5, 5a6900b2, b28487af, 2ae492d8, 76b7a36b, 8d04bba3, 1cd895e1, 38160a70, a2146274, 896219a7, b5c0ba0c, b2d18cc7, b0da87aa, 8cf7effe, 81322763, 28e6184b, 14091e58, 19330e09, bce79d8a, 87536f3f, 9c67c3d1, 6aa67ae4, 1c776c56]
coverage: full
---

# Spec: Work-State (tầng quản việc của forgent)

Bộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận "đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn.

## Entry Points & Triggers

- `fgos init` → khởi tạo kho work-state rỗng tại thư mục làm việc hiện hành (nhật ký rỗng + bản chiếu rỗng); đồng thời quét READ-ONLY project tìm marker của harness agent khác đã có mặt (thư mục dấu ấn như `.bee/`, `.claude/`, `.codex/`, `.cursor/`, và khối managed trong `AGENTS.md` khi file đó tồn tại — `init` không bao giờ tạo/sửa `AGENTS.md`), ghi kết quả phát hiện ra output + vào manifest `.fgos/coexistence.json`; lỗi phát hiện không bao giờ chặn `init` (fail-safe), re-init lặp lại ghi manifest nhất quán (idempotent) — doctrine đầy đủ: `docs/coexistence.md`
- `fgos submit "<mô tả tự do>" [--async|--unattended]` → **cửa vào công khai duy nhất** cho việc mới: khai một work item từ một câu mô tả văn xuôi duy nhất — id, title, kind, risk, tier đều TỰ SUY (không cần người submit tự đặt); toàn văn mô tả gốc được giữ nguyên trên trường `description` (Data Dictionary #17, per discovery-context STR30) — nguồn ngữ cảnh đầy đủ cho context-discovery đọc lại sau, không bị cắt gọn như `title`; `verify` nhận placeholder cố định chờ bổ sung sau; kết quả in ra bọc trong một phong bì máy-đọc chuẩn (xem "Phong bì output" dưới)
- `fgos move` → chuyển trạng thái một item, kèm `--expect` (kỳ vọng, chống ghi đè mù); cạnh từ-chối-đề-xuất bắt buộc `--reason`
- `fgos decision --text "..."` → ghi một quyết định vào nhật ký
- `fgos ask <id> --text "..."` → đưa một item vào chờ người (`awaiting-human`), kèm **câu hỏi** người phải quyết; item rời tập việc-sẵn-sàng cho tới khi được trả lời; nếu item có `parent`, `ask` còn chụp thêm một ảnh `{id, title, status}` của gốc lúc này làm mốc so sánh sau (per D2/D3 str61-chat-context-continuity — xem RUL45)
- `fgos answer <id> --text "..."` → **trả lời** câu hỏi của một item đang chờ; ghi câu trả lời vào nhật ký rồi đưa item rời `awaiting-human` về `todo`, thành việc actionable trở lại
- `fgos list` → đọc danh sách item từ bản chiếu hiện hành; item đang `awaiting-human` hiện kèm câu hỏi của nó (không cần lệnh đọc riêng); item `awaiting-human` có `parent` còn kèm thêm `awaitingContext` — gốc hiện tại để neo ngữ cảnh, cộng phần đổi-từ-lúc-hỏi nếu có (per D1/D2/D3 str61-chat-context-continuity — xem RUL45), khóa này vắng mặt hoàn toàn khi không có item nào thuộc diện đó
- `fgos ready` → đọc frontier: mọi item `todo` có toàn bộ deps đã `done` (đã duyệt/merge), đang ở stage `executing`, VÀ không còn hậu duệ nào (qua `parent`) dang dở, thứ tự đúng thứ tự khai — thao tác ĐỌC thuần; item `awaiting-human`, còn ở stage `clarify`/`decompose`, hoặc còn con dang dở KHÔNG BAO GIỜ xuất hiện trong tập này
- `fgos discover <id>` → chạy context-discovery cho một item đang ở stage `clarify` — đọc gì trước "Giai đoạn Làm-rõ (stage clarify)" dưới
- `fgos rebuild` → dựng lại bản chiếu từ zero bằng cách phát lại toàn bộ nhật ký
- `fgos repair` → sửa CHỈ MỘT hình dạng hỏng hẹp của nhật ký sự kiện: dòng cuối bị cắt cụt (crash giữa lúc append). Trước khi cắt, sao lưu nguyên trạng nhật ký hỏng ra file backup có dấu thời gian; sau khi cắt, tự đọc lại kiểm chứng nhật ký sạch trước khi báo thành công. Hỏng hình dạng khác (giữa file, nhiều dòng hỏng, hoặc nhật ký vốn đã sạch) đều bị từ chối rõ lý do, KHÔNG đụng file — cửa fail-closed cho `corrupt-log` (mã thoát 5) không bị nới, chỉ có đúng một khe hẹp này được vá tay bởi người vận hành. **Yêu cầu KHÔNG-tiến-trình-song-song (per fgos-multi-session-checkout Epic 3):** `repair` là ghi-đè-cả-file (`writeFileSync` sau khi sao lưu) và CỐ Ý không lấy `.fgos/events.lock` của `appendEvent` — nó phải chỉ chạy khi KHÔNG có tiến trình fgos nào đang sống, vì một `appendEvent` chen vào giữa lúc đọc và lúc ghi-đè của repair sẽ bị âm thầm nuốt mất (drop). Đây là thao tác hiếm, người vận hành chủ động gọi, không nằm trên đường append thường; bảo vệ repair khỏi ca đó là ngoài phạm vi, chỉ ghi nhận yêu cầu chứ không cưỡng chế
- `fgos check [id]` → đọc bản chiếu, in cặp dự đoán/thực tế (outcome) đã gộp cho một item, hoặc cho mọi item đang có dữ liệu nếu không truyền id — thao tác ĐỌC thuần
- `fgos rollup <id>` → đọc bản chiếu, in một item gốc (title/status) kèm đếm con theo status (`k/n done`) và liệt kê từng con trực tiếp (qua `parent`, dựng từ STR16 decompose) cùng status của nó; item không con in `0/0 done` + ghi rõ "không có con"; id không tồn tại báo lỗi `validation` — thao tác ĐỌC thuần, không sự kiện mới
- `fgos triage` → đọc bản chiếu, xếp hạng mọi item CHƯA `done` theo số item khác (cũng chưa `done`) đang liệt kê nó trong `deps` (`blocks`), giảm dần rồi id tăng dần (tie-break); backlog-triage impact ranking (STR21), tách bạch khỏi phân loại rủi ro/lane lúc intake (STR14 `classify.mjs`) — thao tác ĐỌC thuần, không sự kiện mới
- `fgos take [--id <id>] [--actor human|session]` → **cửa pull giao–nhận việc** (bên ngoài vòng runner): một tác nhân ngoài (người mặc định, hoặc một phiên đang sống) cầm đúng một item từ ĐÚNG tập frontier runner dispatch-được — xem "Cửa pull giao–nhận việc" dưới
- `fgos return <id> [--timeout <ms>]` → trả kết quả cho một item đã `take` — verb tự đo tiến độ thật (tree sạch + HEAD tiến + verify thật), KHÔNG tin lời người gọi — xem "Cửa pull giao–nhận việc" dưới
- `fgos compound <id>` → chuyển stage `executing → compound-learn` — hành động CHỦ Ý duy nhất mở lối vào Compound-learn (không có đường tự-động nào khác); đòi item đang ở status `proposed` (đã `return`/duyệt, verify đã xanh) — item ở status khác bị từ chối rõ lý do, không sự kiện nào ghi thêm; nay nhận thêm cờ tùy chọn `--doc-type <quadrant>` ghi nhãn Diataxis thật lên outcome (bên sản xuất đầu tiên của nhãn) (per D2/D3 + producer slice 3 compound-learn-enduser-docs — xem RUL49/RUL51/RUL52)
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>]` / `fgos reject <id> --reason "..."` → cổng duyệt PR nội bộ, MỘT cổng cho mọi đề xuất `proposed` bất kể nguồn (runner hay pull-door) — bề mặt CLI này sống ở đây (cửa lệnh `fgos` một cửa), nhưng cơ chế merge/verify đầy đủ được đặc tả ở spec Runner "Cổng duyệt PR nội bộ"
- Bản ghi dự đoán/thực tế (outcome) không có verb ghi riêng qua cửa lệnh: nó được ghi từ bên trong vòng tự hành (xem spec Runner) — nửa dự đoán lúc nhận việc, nửa thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại); cửa pull `take`/`return` ghi hai nửa này trực tiếp, cùng khuôn

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | id | Định danh bền của work item, dạng kebab-case chữ thường, mở đầu bằng chữ cái; không trùng. KHÔNG mang nội dung title (title lưu ở field riêng #2) — item gốc sinh tiền tố cố định `tsk-` + hậu tố ngắn chống trùng; item con (sinh qua chia-việc) mang id `<id-của-gốc>-<n>` (n = thứ tự trong lứa con, đệ quy nếu con lại bị chia tiếp) | ví dụ `tsk-e5i0f2` (gốc), `tsk-e5i0f2-1` (con thứ 1) | yes | — |
| 2 | title | Tên việc người đọc hiểu; nhận mọi ký tự unicode | free text | yes | — |
| 3 | kind | Loại việc (trả lời "việc này thuộc loại gì" — câu 2 của sáu câu) | free text | yes | — |
| 4 | status | Trạng thái vòng đời; schema từ chối giá trị ngoài sáu trạng thái này (phạm trù `validation`) kể cả qua tầng thư viện | `todo` — chưa bắt đầu · `doing` — đang làm · `blocked` — kẹt vì lỗi/runner-park, hai chiều với todo/doing; nhận thêm một cạnh vào từ `proposed` (per pr-lifecycle D3 / 1359ab5e) khi cổng duyệt gãy — merge conflict hoặc verify đỏ sau merge — mang `reason` bắt buộc, cùng khuôn enforce với `proposed→todo`; xem spec Runner "Cổng duyệt PR nội bộ"; và một cạnh RA thẳng tới `proposed` (per D18 fan-out-parallel) khi một lần đồng bộ-lại (catch-up) sạch — cạnh này KHÔNG mang `reason` (mirror khuôn cơ học của `blocked→todo`/`blocked→doing`, khác khuôn bắt-buộc-lý-do của `proposed→todo`/`proposed→blocked`) và KHÔNG BAO GIỜ đi qua `doing`; xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)" · `awaiting-human` — đậu chờ người quyết, mang một câu hỏi; runner/frontier KHÔNG BAO GIỜ pick; rời khi người trả lời (một lối vào từ `todo` hoặc `doing`, một lối ra về `todo`); đậu vô thời hạn, không timeout · `proposed` — goal-check đạt, đề xuất nằm trên nhánh chờ duyệt · `done` — đã nhận vào cây chính, TERMINAL: hai lối vào (`doing→done` thao tác tay, `proposed→done` duyệt đề xuất), không bao giờ ra | yes | `todo` |
| 5 | deps | Các id item phải xong trước; mọi id phải tồn tại, cấm tự trỏ; "epic" chỉ là một item thường được deps trỏ vào. **Bất biến phi-chu-trình (per work-graph-intelligence S1):** đồ thị `deps` không bao giờ được phép khép vòng — cửa ghi duy nhất (qua verb `add` và `edit`) chặn MỌI lần ghi (thêm mới hoặc sửa `deps`) mà kết quả sẽ tạo một chu trình (A→B→A hoặc dài hơn), ngay sau bước kiểm tồn tại và TRƯỚC khi sự kiện được ghi; lần ghi bị chặn trả lỗi phạm trù `validation` (mã thoát 4). Chu trình được đo qua đúng một đường kiểm tra dùng chung, không có đường thứ hai. Vì id của một item mới phải trỏ tới các id đã tồn tại, một chu trình nhiều-nút chỉ có thể phát sinh khi SỬA `deps` của item đang có; lần ghi thêm mới chỉ có thể tự-trỏ (đã bị chặn từ trước ở bước kiểm hình dạng). Trước bất biến này, một lần sửa `deps` có thể tạo chu trình A↔B mà lọt qua âm thầm (phép kiểm deps khi đó chỉ xét sự tồn tại của id) — lỗ hổng đó nay đã đóng. **Mở rộng (per work-graph-intelligence S2a / record ADR0012):** bất biến phi-chu-trình nay phủ ĐỒ THỊ CẠNH-ĐỊNH-KIỂU HỢP NHẤT (`blocks` từ `deps` + `parent-child` từ `parent`), không chỉ riêng `deps` — xem quy tắc RUL44 và Data Dictionary #13 | danh sách id | yes (rỗng được) | `[]` |
| 6 | risk | Mức rủi ro của việc (câu 4) | free text | yes | — |
| 7 | refs | Đọc gì trước / chạm contract nào (câu 1 + 3) | danh sách tham chiếu | yes (rỗng được) | — |
| 8 | verify | Proof gì thì xong (câu 5) | free text | yes | — |
| 9 | learn | Link bài học để lại (câu 6 — chỗ cắm vòng học sau này) | text | no | — |
| 10 | tier | Hạng nặng-nhẹ của việc, để chọn model thực thi (bảng tier→model đến ở Phase 2 E3; tập giá trị provisional tới lúc đó) | `light` · `standard` · `heavy` | no | `standard` |
| 11 | mode | Chế độ submit đã dùng khi item được tạo qua `submit` — quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-DISCOVERY-TRƯỚC (agent đang sống hay runner tự hành), KHÔNG phải điều kiện mà code rẽ nhánh (xem RUL17) | `sync` (mặc định — người submit tương tác ngay) · `async` (người submit rời đi ngay) | no | `sync` (khi tạo qua `submit`; vắng mặt trên item tạo qua `add`) |
| 12 | stage | Giai đoạn vòng đời VĨ MÔ của item — chiều MỚI, song song với `status` (chiều vi mô, không đổi). Quyết định loại tác vụ/persona nào xử lý item ở thời điểm hiện tại; `status` vẫn áp dụng như cũ BÊN TRONG mỗi stage | `clarify` — chưa qua kiểm chất lượng thông tin, context-discovery còn phải chạy · `decompose` — đã qua clarify, đang chờ/qua phán chia-việc (làm giàu ngữ cảnh + phân rã thành con, hoặc pass-through nếu không cần chia) trước khi vào executing · `executing` — đã qua kiểm và qua chia-việc (hoặc chưa từng cần cả hai), sẵn sàng cho vòng thi công hiện có · `compound-learn` — đã qua thi công, điểm quan sát-được nơi tổng hợp/học sau-thi-công diễn ra trước khi item được đóng; CHỈ tồn tại ở domain `coding` (đến sau `executing`, qua verb `compound`) — domain `synthetic` không khai stage này (per D2 compound-learn-enduser-docs / 9c67c3d1); một item của domain khai stage này KHÔNG được đóng (`done`) trước khi đi qua nó — xem RUL49/RUL50 | no | `executing` khi vắng mặt (item tạo qua `add`, hoặc mọi item tạo trước tính năng này); `clarify` khi tạo qua `submit`. Cạnh `clarify → executing` trực tiếp vẫn hợp lệ trong bảng chuyển-stage (log di sản) nhưng không còn caller nào nhắm tới kể từ khi `decompose` chèn vào giữa — dormant, ghi nhận trung thực (xem "Giai đoạn Chia-việc" dưới) |
| 13 | parent | Lineage: id của item GỐC mà item này là hậu duệ; chỉ sinh ra qua phán chia-việc, không phải trường người tự điền qua `add`/`submit`. **Mô hình cạnh-định-kiểu (per work-graph-intelligence S2a / record ADR0012, supersede ADR0002):** `parent` là cạnh `parent-child` trong MỘT đồ thị cạnh-định-kiểu hợp nhất cùng `deps` (cạnh `blocks`) — hai quan hệ vẫn TÁCH BẠCH về lưu trữ và về điều-phối (con của một lần chia-việc KHÔNG BAO GIỜ được ghi vào `deps` của gốc — RUL24 giữ nguyên), nhưng là MỘT đồ thị cho phép kiểm phi-chu-trình: `parent` nay tham gia bất biến acyclic ở cửa ghi (xem RUL44). Trước S2a, một chu trình `parent-child` (A cha B, B cha A) lọt qua âm thầm vì id của `parent` không được kiểm tồn tại — nay bị cửa ghi từ chối | id của một work item đã tồn tại, hoặc vắng mặt | no | vắng mặt (item gốc, hoặc mọi item tạo trước tính năng chia-việc) |
| 14 | claimActor | Ai đang cầm claim `doing` hiện tại của item — cộng-thêm (fold) từ `actor` trên chính sự kiện `work.move` đưa item vào `doing`, KHÔNG phải trường người tự điền; phân biệt claim của cửa pull với claim của runner (xem "Cửa pull giao–nhận việc" dưới) | `runner` · `human` · `session` | no | vắng mặt (nhật ký di sản không mang `actor` trên cạnh claim) |
| 15 | headAtTake | Vị trí commit (HEAD) của host repo tại đúng thời điểm cửa pull `take` cầm item — cộng-thêm trên CÙNG sự kiện `work.move` đưa item vào `doing`; CHỈ `take` ghi trường này, claim của runner không bao giờ mang nó | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim của runner, hoặc item chưa từng qua cửa pull) |
| 16 | headAtReturn | Vị trí commit (HEAD) của host repo tại đúng thời điểm `return` đo verify XANH — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→proposed`; đối xứng `headAtTake` nhưng ghi ở đầu RA thay vì đầu VÀO (per pr-lifecycle D1 / 1359ab5e); nguồn diff trung thực cho cổng duyệt tính dải `headAtTake→headAtReturn` của một đề xuất pull-door (xem spec Runner "Cổng duyệt PR nội bộ") | mã commit (string), hoặc vắng mặt | no | vắng mặt (đề xuất của runner không qua `return`, hoặc mọi đề xuất tạo trước pr-lifecycle) |
| 17 | description | Toàn văn mô tả gốc người submit gõ — nguồn ngữ cảnh đầy đủ để context-discovery đọc lại (xem "Giai đoạn Làm-rõ" dưới), không bị cắt gọn/phân loại như `title` (per discovery-context STR30 / cfae0120) | free text (không rỗng khi có mặt) | no | vắng mặt (item tạo qua `add`, hoặc mọi item tạo trước tính năng này) |
| 18 | reason | Lý do từ-chối/đỗ MỚI NHẤT của item — fold từ trường `reason` trên sự kiện `work.move` gần nhất mang nó (reject `proposed→todo`, hoặc gate-gãy `proposed→blocked`), KHÔNG phải trường người tự điền. GHI ĐÈ mỗi lần fold (latest-wins) — khác khuôn "cộng thêm không đè" của outcome/friction/settlement/discovery, vì đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker prompt, xem spec Runner RUL23 (runner)), không phải một chuỗi lịch sử cần giữ mọi lần | free text | no | vắng mặt (item chưa từng bị đỗ/từ chối lần nào) |
| 19 | branchHeadAtTake | Vị trí commit (HEAD) của CHÍNH NHÁNH đề xuất (`fgw/<id>`) tại đúng thời điểm `take` cầm một item `blocked` mang nhánh sống — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `blocked→doing`; KHÔNG BAO GIỜ cùng mặt với `headAtTake` trên một item (RUL34) | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim main-based, hoặc claim của runner) |
| 20 | branchHeadAtReturn | Vị trí commit (HEAD) của CHÍNH NHÁNH tại đúng thời điểm `return` đo verify XANH trên một item nguồn-nhánh — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→proposed`; KHÔNG BAO GIỜ cùng mặt với `headAtReturn` trên một item (RUL34) | mã commit (string), hoặc vắng mặt | no | vắng mặt (return main-based, hoặc đề xuất của runner) |
| 21 | domain | Domain nào chi phối bộ stage/chuyển-stage của item — chiều thứ BA, song song `stage` (vĩ mô, "loại tác vụ nào") và `status` (vi mô, "đang ở đâu"); một domain khai đúng ba thứ: danh sách stage có thứ tự, step-mapping (bước nào trong 5 bước base-workflow mỗi stage thỏa — xem "Mô hình domain" dưới), và cạnh chuyển-stage hợp lệ riêng của nó; domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`) (per base-workflow-model D1-D3 / 2ae492d8) | `coding` (stage `clarify`/`decompose`/`executing`/`compound-learn` — per D2 compound-learn-enduser-docs / 9c67c3d1) · `synthetic` — minh họa/dùng-một-lần (per D1), đúng MỘT stage, chỉ thỏa bước Thực-thi, không thỏa Làm-rõ/Chia-việc/Compound-learning | no | `coding` khi vắng mặt (mặc định lazy, cùng khuôn `stage`'s D8); `add`/`submit` đều nhận `--domain <tên>` tùy chọn (xem "Khai việc"/"Nộp vấn đề tự do" dưới) |
| 22 | discoveredFrom | Dòng dõi PHÁT-HIỆN: id của item mà trong lúc thi công nó, việc này lộ ra — cạnh `discovered-from` của mô hình cạnh-định-kiểu (xem #13/RUL44), khác `parent` (dòng dõi CHIA-VIỆC): `discoveredFrom` không sinh từ một phán chia-việc, mà từ việc thi công item nguồn phát hiện thêm việc mới. KHÔNG BAO GIỜ chặn — loại trừ khỏi phép kiểm phi-chu-trình theo đúng thiết kế (chỉ `blocks`/`parent-child` tham gia acyclic, xem RUL44); tồn tại của id nguồn KHÔNG được kiểm (cùng khuôn `parent` — một id treo vẫn được chấp nhận, degrade an toàn). Hai nguồn sinh: (a) người tự khai tường minh lúc `add`/`submit` một item mới; (b) tự động — khi trợ lý thi công một item báo có việc mới lộ ra, runner (bên duy nhất được ghi) tự tạo item đó và đóng dấu trường này trỏ về item đang thi công (xem spec Runner "Báo việc-phát-hiện từ trợ lý") | id của một work item đã tồn tại, hoặc vắng mặt (tồn tại không được kiểm) | no | vắng mặt (item không có dòng dõi phát-hiện, hoặc mọi item tạo trước tính năng này) |
| 23 | docsRef | Con trỏ CEREMONY-STATE tới artifact quyết định của tính năng đã tạo ra item này — đường dẫn tương đối trỏ vào `docs/history/<feature>/` (nơi CONTEXT.md/plan.md của tính năng đó thực sự sống). Item chỉ mang CON TRỎ; nội dung quyết định ở nguyên trong file markdown git-hoá đó — không có sự kiện/contract mới (`work.add`/`work.edit` payload đã đủ chỗ, C2 không đổi) (per p50-workflow-induct D7 / 28e6184b). Cùng khuôn optional-additive với `description`/`parent` ở trên: kiểm hình dạng (chuỗi không rỗng) khi có mặt, KHÔNG kiểm tồn tại trên đĩa lúc ghi — một `docsRef` trỏ tới đường dẫn chưa tồn tại hoặc đã dời đi vẫn được chấp nhận, degrade an toàn cùng khuôn `parent`/`discoveredFrom` | đường dẫn tương đối dạng chuỗi (không rỗng khi có mặt), ví dụ `docs/history/p50-workflow-induct/` | no | vắng mặt (item tạo qua `add` không kèm field, hoặc mọi item tạo trước tính năng này) |
| — | Sự kiện (không hiển thị) | Đơn vị ghi của nhật ký; mỗi thao tác ghi đúng MỘT sự kiện, số thứ tự tăng dần + thời điểm + phiên bản schema `v` (hiện hành: 2; sự kiện di sản không có `v` vẫn đọc được) | `work.add` — khai item (luôn mang tier tường minh từ v2) · `work.move` — chuyển trạng thái (from/to; cạnh từ-chối `proposed→todo` VÀ cạnh gate-gãy `proposed→blocked` (per pr-lifecycle D3) đều mang `reason` bắt buộc; cạnh vào chờ mang `ask`, cạnh rời chờ mang `answer`; mọi ngã-ngũ có thể mang thêm `actor` tùy chọn — xem "Bản ghi settlement" dưới; ngã-ngũ vào `done` cũng tự mang thêm một bản ghi học — xem "Bài học lúc đóng" dưới; cạnh claim `todo→doing` qua cửa pull `take` mang thêm `headAtTake`, xem Data Dictionary #15 (hoặc `branchHeadAtTake` thay vào đó khi claim là nguồn-nhánh, cạnh `blocked→doing`, Data Dictionary #19); cạnh `doing→proposed` qua cửa pull `return` (verify xanh) mang thêm `headAtReturn`, xem Data Dictionary #16 (hoặc `branchHeadAtReturn` cho nguồn-nhánh, Data Dictionary #20, xem RUL34)) · `decision` — quyết định kèm chữ · `work.outcome` — dự đoán HOẶC thực tế cho một item (mỗi nửa là một sự kiện riêng, cùng id; xem "Bản ghi kết quả" dưới) · `work.friction` — một lần thất bại tự-quy-tội tại park/halt (xem "Bản ghi friction" dưới) · `work.stage` — chuyển stage (from/to; có thể kèm `verify` khi rời clarify — xem "Giai đoạn Làm-rõ" dưới; ngã-ngũ rời clarify cũng có thể mang `actor` tùy chọn) · `work.discovery` — một lần context-discovery phán (xem "Bản ghi cổng discovery" dưới) | — | — |
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
| O4 | thực tế | kết cục (disposition) | Kết cục cuối của lần chạy | `proposed` — goal-check đạt, thành đề xuất chờ duyệt · `parked` — dừng lại theo lẽ thường (hết trần thử lại, hoặc lỗi không thử lại được), item bị đỗ · `halted` — cầu dao chấm-trượt-liên-tiếp cắt cả vòng chạy, item bị đỗ trước khi vòng dừng hẳn | lúc item tới trạng thái cuối |
| O5 | thực tế | đạt goal-check | Phép đo goal-check của chính vòng tự hành có đạt hay không | boolean | lúc item tới trạng thái cuối |
| O6 | thực tế | số lần thử | Số lần thử trong đúng lần chạy này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| O7 | thực tế | lớp lỗi | Lớp lỗi (theo bảng phục hồi của spec Runner) nếu thất bại; rỗng nếu thành công | free text hoặc rỗng | lúc item tới trạng thái cuối |
| O8 | thực tế | số commit | Số commit mà item để lại trên nhánh đề xuất | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O9 | thực tế | số lần nhận (đến giờ) | Item này đã từng được nhận bao nhiêu lần tính đến hết lần chạy này | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O10 | — (trực giao) | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN gắn trên bản ghi — chiều AUDIENCE/loại-tài-liệu, TRỰC GIAO với chiều type-axis kỹ sư (pattern/decision/failure), một chiều CỘNG THÊM chứ không thay thế (per D5). Kiểm hình dạng khi CÓ MẶT (phải là đúng một trong bốn quadrant); vắng mặt/`null` = chưa gắn nhãn, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (Data Dictionary #23). Đi ké payload thô của sự kiện capture nên sống sót replay qua chính spread-fold sẵn có, không đổi cơ chế (per D6) | `tutorial` / `how-to` / `reference` / `explanation` (bốn quadrant Diataxis; giá trị khác khi có mặt bị từ chối `validation`) | tùy — bên sản xuất `compound --doc-type` (RUL51/52) hoặc bất kỳ bên ghi capture nào cung cấp |

Item chưa từng chạy không mang bản ghi outcome nào — vắng mặt hoàn toàn, không phải bản ghi
rỗng. Nhật ký ghi trước khi bản ghi này tồn tại replay lại nguyên vẹn, không sinh ra outcome
nào cho item nào (tương thích ngược, theo luật tiến hóa schema RUL11).

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
| F6 | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN, cùng nghĩa và cùng khuôn với O10 của bản ghi outcome (trực giao với type-axis kỹ sư, kiểm khi có mặt, vắng/`null` = chưa gắn) — đi ké payload thô của sự kiện friction, sống sót replay không đổi cơ chế (per D5/D6) | `tutorial` / `how-to` / `reference` / `explanation` | tùy — bên sản xuất `compound --doc-type` (RUL51/52) hoặc bất kỳ bên ghi capture nào cung cấp |

Item chưa từng thất bại không mang bản ghi friction nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11). `fgos check` in mục friction: đếm theo lớp trên TOÀN BỘ record,
kèm tối đa 5 record gần nhất (không xả vô hạn); và nhắc mọi item đã tới trạng thái
cuối (`proposed`/`blocked`/`done`) mà chưa có nửa outcome thực tế — hai cảnh báo này
đọc từ view, không sự kiện mới nào sinh ra khi chạy `check` (vẫn là read thuần, D1).

### Bản ghi settlement — kênh 1 của capture 2 kênh (Phase 3 S3-closeout)

Mỗi lần một item đi qua một **ngã-ngũ** — một điểm quyết-xong cụ thể trong
vòng đời của nó — sinh thêm một **bản ghi settlement**, cùng khuôn "cộng thêm
không đè" với friction/discovery: mỗi lần ngã-ngũ là một lần xảy ra, APPEND
vào danh sách của id, không bao giờ gộp/đè lên lần trước.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| S1 | loại ngã-ngũ (kind) | Loại điểm quyết-xong | `clarify-pass` — context-discovery cho qua, item RỜI stage `clarify` (đích hôm nay là `decompose`; log di sản đích thẳng `executing` vẫn ngã-ngũ y hệt) · `answer` — người trả lời một câu hỏi đang chờ · `close` — item tới `done` (qua cả hai lối vào) | lúc chính ngã-ngũ đó xảy ra |
| S2 | actor | Ai/cái gì đã ngã-ngũ | `runner` — vòng tự hành tự động (quét làm-rõ, nhận việc, đề xuất, đỗ) · `session` — phiên đang sống gọi tay context-discovery · `human` — người qua lệnh CLI (`move`, `answer`) · vắng mặt (rỗng) — ngã-ngũ không kèm actor (nhật ký cũ hơn tính năng này, hoặc lời gọi không khai) | lúc ngã-ngũ xảy ra, tùy chọn |
| S3 | chi tiết | Nội dung đi kèm ngã-ngũ này — verify thật (clarify-pass), câu trả lời (answer), hoặc rỗng (close) | free text hoặc rỗng | lúc ngã-ngũ xảy ra |

Bản ghi settlement không sinh event mới: nó là một **bề mặt đọc dẫn xuất** từ
ba ngã-ngũ đã có sẵn trong nhật ký — không thêm một loại sự kiện "settlement"
riêng, tránh ghi-đôi cùng một sự thật (nguyên tắc sự-thật-một-nguồn). `actor`
là trường tùy chọn cộng-thêm trên chính ngã-ngũ đó (`work.move`/`work.stage`)
— item chưa từng mang actor (nhật ký cũ) vẫn fold bình thường, chỉ với actor
rỗng.

**Bảo vệ tương thích ngược:** ngã-ngũ `answer`/`close` chỉ sinh bản ghi
settlement khi sự kiện gốc mang phiên bản schema hiện hành — một sự kiện nhật
ký thật sự tiền-phiên-bản (trước khi khái niệm phiên bản schema tồn tại) giữ
nguyên hình dạng bản chiếu lịch sử của nó, không tự nhiên "mọc thêm" một bản
ghi settlement mà nó chưa từng có (cùng luật tiến hóa schema RUL11).

Item chưa từng qua ngã-ngũ nào không mang bản ghi settlement — vắng mặt hoàn
toàn (tương thích ngược, RUL11). `fgos check` in mục settlement: đếm theo
kind+actor trên TOÀN BỘ record, kèm tối đa 5 record gần nhất (cùng cap-5 của
friction) — đọc từ view, không sự kiện mới nào sinh ra khi chạy `check`.

### Bài học lúc đóng — câu-6 tự động (Phase 3 S3-closeout)

Đúng lúc một item tới `done` — qua BẤT KỲ lối vào nào (thao tác tay
`doing→done`, hoặc duyệt đề xuất `proposed→done`) — hệ thống tự động soạn
thêm một **bản ghi học**, trả lời câu-6 của sáu câu hỏi harness ("learning gì
để lại?"). Soạn cơ học hoàn toàn từ dữ liệu item đã tích lũy — không có phán
xét bên ngoài, không gọi model, không spawn — và không bao giờ chặn việc đóng
item nếu soạn lỗi (best-effort, cùng tinh thần fail-safe của context-discovery).

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| L1 | kết cục (outcome) | Nửa thực tế của bản ghi kết quả tại thời điểm đóng — kết cục/số lần thử/lớp lỗi | object, hoặc rỗng nếu item chưa từng chạy | lúc item tới `done` |
| L2 | friction theo lớp | Đếm các bản ghi friction của item, theo lớp | map lớp→số lượng, rỗng nếu item chưa từng thất bại | lúc item tới `done` |
| L3 | settlement theo loại/actor | Đếm các bản ghi settlement của item — kể cả chính ngã-ngũ đóng vừa xảy ra — theo cặp loại+actor | map loại/actor→số lượng | lúc item tới `done` |

Item đóng mà KHÔNG có outcome/friction/settlement nào trước đó vẫn nhận một
bản ghi học tối thiểu nhưng thật — không nổ, không im lặng bỏ qua. Ngược lại,
soạn bài học không bao giờ là điều kiện chặn đóng item: nếu việc soạn lỗi,
item vẫn đóng thành công, chỉ bản ghi học bị bỏ qua lần đó.

Item chưa từng đóng không mang bản ghi học nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11). `fgos check` in mục học: mỗi item đã đóng một dòng tóm tắt
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
| G3 | ảnh chụp gốc | `parentSnapshotAtAsk` | Ảnh `{id, title, status}` của gốc (`parent`) tại đúng lúc item vào chờ — mốc so sánh cho RUL45's "đổi-từ-lúc-hỏi"; KHÔNG BAO GIỜ tự sửa lại sau khi ghi (per D2/D3 str61-chat-context-continuity) | `{id, title, status}` | lúc item vào `awaiting-human`, CHỈ KHI item có `parent` giải được lúc đó |

Item chưa từng vào cổng chờ-người không mang bản ghi cổng nào — vắng mặt hoàn toàn, không phải
bản ghi rỗng. Item đang chờ có G1 mà G2 chưa tới (đang chờ trả lời). Item không có `parent`
(hoặc `parent` không giải được lúc `ask`) không mang G3 — vắng mặt, không phải `null`. Một
lần `ask` mới trên item vừa được `answer` xong ghi lại G3 mới, GHI ĐÈ ảnh cũ (không gộp hai
ảnh). Nhật ký không có sự kiện cổng nào replay lại không sinh bản ghi cổng nào (tương thích
ngược, cùng khuôn RUL11/RUL13).

### Giai đoạn Làm-rõ (stage clarify)

Song song với `status` (vi mô, không đổi), mỗi item mang một chiều thứ hai —
`stage` — trả lời "loại tác vụ nào đang cần cho item này ngay lúc này". Hôm
nay có ba stage: `clarify` (chưa qua kiểm chất lượng thông tin), `decompose`
(đã qua clarify, đang chờ/qua phán chia-việc — xem "Giai đoạn Chia-việc"
dưới), và `executing` (đã qua cả hai, hoặc chưa từng cần qua). `status` vẫn
vận hành y hệt BÊN TRONG mỗi stage — một item ở stage `clarify` vẫn có thể là
`todo` hay `awaiting-human`, ý nghĩa của hai status đó không đổi.

Item vào stage `clarify` phải đi qua **context-discovery**: một phép phán
(gọi model thật, đọc toàn bộ item, không phải quy tắc cơ học) xem thông tin
đã đủ để bắt tay thi công chưa.

**Ngữ cảnh phán (per discovery-context STR30 / cfae0120):** phép phán không chỉ
đọc title/kind/refs/deps — prompt còn mang toàn văn `description` (Data
Dictionary #17; item không có description, vd tạo qua `add`, đọc ra
"(không có)" — degrade, không nổ), cặp hỏi-đáp MỚI NHẤT của cổng chờ-người
nếu item từng qua đó ("Bản ghi cổng-người" trên), và toàn bộ các lần phán
discovery trước đó của chính item ("Bản ghi cổng discovery" dưới). **Câu trả
lời của người ở đây là quyết định CUỐI CÙNG — phán không bao giờ hỏi lại một
chủ đề đã được trả lời**; một câu trả lời đủ để thi công phải ra verdict đủ
rõ kèm một `verify` chạy được thật. Known limitation: bản ghi cổng chỉ giữ
cặp hỏi-đáp MỚI NHẤT (gộp-mới-nhất theo id, không phải một mảng lịch sử) —
nếu một vòng làm-rõ cần nhìn lại nhiều vòng hỏi-đáp trước đó, đó là mở rộng
sau (xem Open Gaps).

- **Đủ rõ** — item chuyển `clarify → decompose` (không thẳng `executing` —
  giai đoạn chia-việc chèn ở giữa, xem "Giai đoạn Chia-việc" dưới); MỘT sự
  kiện `work.stage` vừa đổi stage vừa gắn lại `verify` bằng một lệnh chạy
  được thật (đề xuất của model), thay cho placeholder cố định `submit` đã
  điền lúc tạo — không bao giờ để placeholder giả sống sót qua khỏi clarify.
- **Chưa đủ rõ** — item đậu vào `awaiting-human` (như mọi cổng chờ-người
  khác — xem "Bản ghi cổng-người" trên), mang đúng một câu hỏi cụ thể;
  người trả lời xong, item về `todo` (vẫn ở stage `clarify`), và
  context-discovery chạy lại — lặp tới khi đủ rõ. Không có cơ chế "quay lại"
  riêng; đây là hành vi tự nhiên của vòng lặp.
- **Phán không ra kết quả tin cậy được** (model lỗi/timeout/trả lời không
  đọc được) — KHÔNG BAO GIỜ tự cho qua: rơi về "chưa đủ rõ" với một câu hỏi
  mặc định cố định, y hệt nhánh chưa-đủ-rõ ở trên. **Thử lại một lần trước
  khi rơi vào đây, nhưng chỉ khi model đã TRẢ LỜI THÀNH CÔNG mà nội dung
  không đọc được thành verdict hợp lệ** (per str68 D2/D3/RUL48): phán gọi
  lại model đúng một lần nữa với một chỉ dẫn định dạng nghiêm ngặt hơn; đọc
  được lần này thì dùng verdict đó, vẫn không đọc được mới rơi vào fail-safe
  trên. Model lỗi/timeout THẬT (không trả lời được, không phải trả lời khó
  đọc) không bao giờ thử lại — rơi thẳng fail-safe ngay từ lần đầu.

**Ai chạy context-discovery, khi nào:** hai điểm gọi cùng một phép phán —
(a) lệnh `fgos discover <id>` (gọi tay/agent đang sống, dùng khi người submit
còn ở đó — mode `sync`); (b) vòng tự hành, MỖI lần chạy, quét TOÀN BỘ item
đang ở stage `clarify` và status `todo` rồi tự chạy phán cho từng item —
BẤT KỂ giá trị `mode` mang gì, TRƯỚC khi giao bất kỳ việc thi công nào trong
cùng lượt chạy đó (xem spec Runner). Vòng tự hành là lưới đỡ: dù phiên sống
(mode `sync`) không kịp gọi `discover` — chết giữa chừng, hay người rời đi
không dùng `--async` — lượt chạy kế tiếp của vòng tự hành vẫn tự quét, không
item nào kẹt vô hình. `mode` chỉ là quy ước NGƯỜI-GỌI-NÀO-NÊN-LÀM-TRƯỚC,
không phải điều kiện mà code rẽ nhánh (RUL17).

### Bản ghi cổng discovery

Mỗi lần context-discovery phán (dù đủ rõ hay chưa) sinh thêm một **bản ghi
discovery**, ghi CẢ hai kết cục — cùng khuôn "cộng thêm không đè" với bản
ghi friction: mỗi lần phán là một lần xảy ra, APPEND vào danh sách của id,
không bao giờ gộp/đè lên lần trước.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| C1 | đủ rõ | Kết quả phán của lần này | boolean | mỗi lần context-discovery chạy |
| C2 | câu hỏi | Điều cần người làm rõ (chỉ có khi chưa đủ rõ) | free text | khi đủ rõ = false |
| C3 | verify đề xuất | Lệnh proof thật model đề xuất (chỉ có khi đủ rõ) | free text | khi đủ rõ = true |

Item chưa từng qua context-discovery không mang bản ghi discovery nào — vắng
mặt hoàn toàn (tương thích ngược, RUL11).

### Giai đoạn Chia-việc (stage decompose)

Mọi item RỜI stage `clarify` (đủ rõ) không còn đi thẳng sang `executing` —
giữa hai stage đó có thêm một giai đoạn thứ ba, `decompose`: item đã qua kiểm
chất lượng thông tin nhưng còn phải qua đúng một phép phán chia-việc trước
khi thi công. Cạnh `clarify → executing` trực tiếp vẫn còn hợp lệ trong bảng
chuyển-stage (log di sản chưa từng qua tính năng này đọc lại đúng), nhưng
không caller nào nhắm tới cạnh đó nữa kể từ khi `decompose` chèn vào giữa.

Item vào stage `decompose` đi qua **phán chia-việc**: một phép phán (gọi
model thật, đọc toàn bộ item, không phải quy tắc cơ học) xem item có cần
tách thành các việc con độc lập hay không.

- **Pass-through** (item đơn giản, hoặc không có gì để chia) — item chuyển
  thẳng `decompose → executing`, GIỮ NGUYÊN `verify` đã gắn từ lúc rời
  `clarify` — không có bước gắn lại verify riêng ở đây.
- **Chia (decompose)** — phán sinh ra n ≥ 1 item con ĐỘC LẬP, mỗi con mang:
  field `parent` trỏ về item gốc (lineage — xem Data Dictionary #13), `deps`
  giữa các con nếu phán đề xuất (dùng nghĩa `deps` sẵn có, không phải trường
  mới), và một `verify` THẬT — con bỏ qua clarify nên chính phán chia-việc là
  nơi duy nhất sản xuất verify đó, không bao giờ để lại placeholder. Sinh đủ
  con xong, gốc chuyển `decompose → executing` ngay — gốc KHÔNG tự động
  `done`; nó chỉ dispatch-được khi mọi con đã `done` (xem bộ lọc frontier
  lineage dưới).
- **Cần người quyết (need-human)** — rơi vào cổng có điều kiện khi (a) phán
  tự báo mơ hồ không tách được rành mạch, hoặc (b) item gốc mang risk `heavy`
  (ngưỡng risk cao ánh xạ thẳng vào giá trị risk sẵn có từ classify). Item đậu
  `awaiting-human` (như mọi cổng chờ-người khác) mang một **đề xuất chia**
  (danh sách con + deps dự kiến) làm câu hỏi — CHƯA ghi con nào vào queue.
  Người trả lời xong, item về `todo` (vẫn ở stage `decompose`), phán chia-việc
  chạy lại từ đầu ở lượt quét sau (không giữ lại đề xuất cũ, cùng khuôn lặp
  của clarify).
- **Phán không ra kết quả tin cậy được** (model lỗi/timeout/trả lời không đọc
  được), HOẶC verdict chia sinh ra ít nhất một con THIẾU verify thật — CẢ HAI
  đều là verdict KHÔNG HỢP LỆ: item ở nguyên trạng thái/stage hiện tại, không
  con nào được ghi, không pass-through ngầm; lượt quét sau thử lại (fail-safe,
  không bao giờ throw, mẫu hệt context-discovery). **Cùng khuôn thử-lại-một-
  lần của context-discovery áp dụng ở đây** (per str68 D2/D3/RUL48): nếu model
  trả lời thành công nhưng nội dung không đọc được thành verdict, phán gọi lại
  model đúng một lần với chỉ dẫn định dạng nghiêm ngặt hơn trước khi coi verdict
  là không hợp lệ; model lỗi/timeout thật không bao giờ thử lại. Verdict chia
  thiếu verify ở một con KHÔNG thuộc diện thử-lại này — đó là nội dung đọc được
  nhưng không đạt hợp đồng con (xem trên), không phải lỗi định dạng.

**Ai chạy phán chia-việc, khi nào:** hai điểm gọi cùng một phép phán — (a)
lệnh `fgos discover <id>` khi item đang ở stage `decompose` (gọi tay/phiên
sống, mode `sync` — cùng verb, dispatch theo stage hiện tại của item); (b)
vòng tự hành, MỖI lần chạy, NGAY SAU quét làm-rõ và TRƯỚC khi giao việc thi
công, quét TOÀN BỘ item đang `stage: decompose` và `status: todo` rồi tự chạy
phán cho từng item (xem spec Runner) — cùng lưới đỡ như clarify: dù phiên
sống chết giữa chừng, lượt chạy kế tiếp của vòng tự hành vẫn tự quét.

**Lineage (`parent`) tách bạch khỏi `deps`:** `parent` trả lời "item này là
hậu duệ của gốc nào", `deps` trả lời "việc nào phải xong trước việc này" —
hai quan hệ không bao giờ trộn; con của một lần chia-việc TUYỆT ĐỐI KHÔNG bao
giờ được ghi vào `deps` của gốc. Bộ lọc frontier (tập việc sẵn-sàng) chặn một
item gốc khi bất kỳ hậu duệ nào của nó (dẫn xuất qua chuỗi `parent`, đệ quy
xuống mọi tầng) chưa `done` — chặn này DẪN XUẤT thuần từ `parent`, không thêm
cơ chế mới, không đụng `deps`. Khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt
frontier ở lượt kế tiếp như một item thường: KHÔNG có bước "đóng bộ" ghi
riêng — `verify` của chính gốc (mang từ lúc rời `clarify`) đóng vai trò phép
kiểm tích hợp cho toàn bộ hậu duệ, và gốc đi hết đường thường `todo →
doing → proposed → done` (duyệt/merge) như mọi item khác. Một con bị `blocked`
hoặc đỗ giữa chừng không sinh ra một trạng thái "bộ khẩn" riêng — nó dùng
đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn
dispatch cho tới khi con đó (và mọi hậu duệ khác) thật sự `done`.

Item được tạo trước tính năng chia-việc, hoặc tạo qua `add`, không mang
`parent` — vắng mặt hoàn toàn, không lọt vào bộ lọc lineage (tương thích
ngược, RUL11).

### Mô hình domain (base-workflow + domain-extension)

Song song với `stage` (đã ổn định ở coding: `clarify`/`decompose`/
`executing`, xem hai mục trên), mỗi item còn thuộc về một **domain** —
chiều thứ ba, trả lời "bộ stage nào áp dụng cho item này". Một domain khai
đúng ba thứ: (a) danh sách stage có thứ tự của nó, (b) mỗi stage đó thỏa
bước nào trong 5 bước của chu trình nền base-workflow (Init/Làm-rõ/
Chia-việc/Thực-thi/Compound-learning — `work-item-lifecycle-vision.md` §2),
và (c) cạnh chuyển-stage hợp lệ (`{from,to}`) riêng của domain đó. `status`
(vi mô, không đổi) và bảng chuyển-status (`fsm.mjs`) KHÔNG BAO GIỜ thuộc về
domain — domain chỉ chi phối chiều `stage`.

Hôm nay tồn tại hai domain. `coding` tái tạo byte-for-byte danh sách stage /
step-mapping / cạnh chuyển-stage đã có từ trước (xem "Giai đoạn Làm-rõ"/
"Giai đoạn Chia-việc" trên) — cộng thêm một stage thứ tư, **`compound-learn`**,
chèn vào SAU `executing` (cạnh chuyển-stage mới `executing → compound-learn`,
đi qua verb `compound`) và thỏa bước Compound-learning của base-workflow: nơi
tổng hợp/học sau-thi-công diễn ra, nay là một stage quan sát-được của chính
item, không còn là một phản xạ có thể mất dấu (per D2 compound-learn-enduser-
docs / 9c67c3d1). `coding` vậy có bốn stage, thỏa cả bốn bước Làm-rõ/Chia-việc/
Thực-thi/Compound-learning. `synthetic` là domain thứ hai, minh họa và
dùng-một-lần (per D1) — KHÔNG phải một sản phẩm marketing/HR/tài-chính thật,
chỉ tồn tại để chứng minh mô hình chạy được với một domain KHÁC coding: đúng
một stage, chỉ thỏa bước Thực-thi, không có cạnh chuyển-stage nào (một stage
thì không có gì để chuyển) — `synthetic` KHÔNG khai stage `compound-learn`
và không đổi một byte hành vi trước/sau quyết định này, cùng khuôn các bước
Làm-rõ/Chia-việc mà nó đã không thỏa từ trước (per D2 compound-learn-enduser-
docs / 9c67c3d1). Cả hai domain dispatch qua đúng MỘT sổ đăng ký chung và
đúng MỘT đường thi công (vòng tự hành/CLI) — chứng minh trực tiếp acceptance
criterion "domain thứ hai chạy trên cùng base FSM, chỉ thêm stage riêng,
không fork chu trình" (backlog STR18).

**Một domain không bắt buộc thỏa cả 5 bước base-workflow — và việc THIẾU một
bước có hệ quả vận hành thật, không chỉ là khai báo suông (R-domain-1, per
1cd895e1/38160a70).** Nếu một domain không có stage nào thỏa bước Làm-rõ,
item của nó KHÔNG BAO GIỜ được quét vào context-discovery (`resolveDiscovery`)
dù đang ở vòng tự hành — tương tự cho Chia-việc và `resolveDecompose`. Đây là
chủ đích, không phải khiếm khuyết: `resolveDiscovery`/`resolveDecompose` là
hai bộ máy phán CỐ ĐỊNH theo tên stage của `coding` (`clarify`/`decompose`),
chưa domain-hóa; một domain không map bước nào tới đó thì item của nó không
bao giờ chạm hai bộ máy này — an toàn, nhưng cũng có nghĩa domain đó KHÔNG
dùng được context-discovery/chia-việc, dù muốn. (Cùng lý do, verb `discover`
và bộ đếm entropy "item đang ở stage làm-rõ" cũng chỉ nhận diện đúng tên
stage của `coding` — một domain khác không lọt vào hai chỗ đó, không phải lỗi
mà là hệ quả của cùng giới hạn.) Domain thứ ba nào muốn dùng context-discovery/
chia-việc thật sẽ cần domain-hóa cả hai bộ máy trước — backlog chưa làm (xem
Open Gaps).

Item KHÔNG mang trường `domain` đọc ra `coding` — mặc định lazy, cùng khuôn
`stage`'s D8; `add`/`submit` đều nhận `--domain <tên>` tùy chọn, mặc định
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

- **`fgos take [--id <id>] [--actor human|session]`** (mặc định `human`) —
  cầm đúng một item: không truyền `--id` thì cầm đầu frontier; truyền
  `--id` thì item đó phải thật sự nằm trong frontier (cùng luật
  stage/deps/lineage như dispatch thường) nếu còn `todo` — một id đã bị
  cầm/đỗ/kẹt rơi thẳng xuống kỳ vọng (CAS) của chính cạnh chuyển trạng
  thái, báo `conflict` thật (mã 3), không phải một thông điệp tùy biến
  trùng lặp. Chuyển `todo → doing` qua đúng CAS sẵn có, gắn thêm `actor`
  (người cầm) và `headAtTake` (HEAD hiện tại của host repo) vào CÙNG sự
  kiện đó; ghi nửa DỰ ĐOÁN của một bản ghi outcome, đối xứng claim của
  runner (xem spec Runner).
- **`fgos return <id> [--timeout <ms>]`** — trả kết quả, KHÔNG BAO GIỜ tin
  lời người gọi: verb tự đo đủ ba điều kiện, mirror TRUNG THỰC contract
  `proposed` của chính runner — (a) working tree của host repo phải SẠCH
  (mọi việc đã commit, loại trừ `.fgos/` — store sống tự mutate bởi chính
  take/return/approve nên không bao giờ tính là bẩn), (b) HEAD phải tiến so `headAtTake` (tiến bộ THẬT,
  không phải commit rỗng hay chưa commit gì), (c) verb TỰ CHẠY `verify`
  thật của item (goal-check — cùng một hàm runner dùng, xem spec Runner)
  tại HEAD đó, ngay trong thư mục làm việc hiện hành. Thiếu (a) hoặc (b) →
  từ chối `validation` (mã 4), item giữ nguyên `doing`, KHÔNG ghi sự kiện
  nào. Verify xanh → `doing → proposed` + nửa THỰC TẾ của outcome (KHÔNG
  sinh settlement ở đây — settlement thuộc cạnh `→done`, xem "Bài học lúc
  đóng" trên). Verify đỏ → `doing → blocked` (lý do `verify-fail`) + nửa
  thực tế + một bản ghi friction lớp `verification` — mirror đúng đường đỗ
  của runner.

`return` chỉ hoàn tất một `take`: một item đang `doing` nhưng KHÔNG mang
`claimActor` là `human`/`session` (nghĩa là claim của chính runner, hoặc một
claim di sản không actor) bị `return` từ chối `validation` — cửa pull không
bao giờ đụng vào claim của runner.

#### Cửa pull mở rộng: hoàn tất một đề xuất nguồn-nhánh bị đỗ

Một item `blocked` mang một nhánh đề xuất còn sống (`fgw/<id>` — vd bị đỗ do
chạm trần chống-lặp, xem spec Runner RUL29 (runner)) cũng đi qua CÙNG hai verb `take`/
`return` ở trên, không phải verb riêng — chỉ khác Ở NGUỒN được ghi lại:

- **`take`** trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua
  cạnh `blocked → doing` (thay vì `todo → doing`), ghi **`branchHeadAtTake`**
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
  `doing → proposed` mang **`branchHeadAtReturn`** (HEAD nhánh tại lúc đo) —
  **TUYỆT ĐỐI không ghi `headAtReturn`** (trộn hai marker cho `reviewDiff`
  của cổng duyệt một dải vô nghĩa). Không có commit mới, hoặc verify đỏ →
  từ chối rõ lý do (nguồn-nhánh: `verify-fail` + friction lớp
  `verification`), item giữ nguyên `doing`, nhánh không đổi tip.
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

### Sổ verb máy-đọc (manifest) — `--help --json`

CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}`, mỗi mục mô tả một verb —
`name`, cách gọi, mô tả một dòng, lược đồ tham số (cờ/positional), ví dụ, cờ
**`access` (`read` hay `mutation`)** cho biết verb chỉ đọc hay có đổi trạng thái,
và ô `deprecated`. Sổ này để một listener/giao diện **sinh** khung lệnh và khung
form từ manifest thay vì hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu
về CLI**, KHÔNG bọc trong phong bì `data` (nó mô tả CLI, không phải kết quả một
verb). Cờ `access` mới chỉ là **khai báo** — chưa nối vào điều-phối hay xác danh;
cổng "ai được nói verb nào" là việc riêng sau này (backlog STR38), sổ verb chỉ cung
cấp nguyên liệu cho nó. Dạng trợ giúp thường (không máy-đọc) in cùng thông tin ở
dạng chữ cho người đọc.

## Behaviors & Operations

### Khởi tạo (init)

- **Runs when:** người/agent gọi `fgos init` tại thư mục làm việc — bước đầu
  tiên trước khi bất kỳ verb nào khác dùng được kho work-state.
- **Blocked when:** không có điều kiện chặn — `init` luôn thành công bất kể
  phát hiện gì (per install-coexistence D4/D6 / f1715488).
- **What changes:** tạo `.fgos/` rỗng (nhật ký rỗng + bản chiếu rỗng) tại cwd
  nếu chưa có; quét READ-ONLY project tìm marker của harness agent khác đã có
  mặt (thư mục dấu ấn — `.bee/`, `.claude/`, `.codex/`, `.cursor/` là tập khởi
  đầu, mở rộng được — và khối managed trong `AGENTS.md` của host nếu file đó
  tồn tại); ghi kết quả phát hiện vào `.fgos/coexistence.json` (manifest v1:
  `territory` {data, worktrees {descriptor, resolved}, branches} +
  `detected_harnesses`), và in ra output những gì phát hiện được.
- **Side effects:** không ghi/sửa/xóa bất kỳ file nào thuộc harness khác —
  host không có `AGENTS.md` thì `init` bỏ qua bước đó, không tự tạo (per D6).
  Lỗi đọc một marker (vd `AGENTS.md` hỏng quyền) không chặn `init` — ghi nhận
  lỗi vào manifest, `init` vẫn thành công (fail-safe).
- **Afterwards:** re-init trên cùng project ghi lại manifest nhất quán
  (idempotent — không tích lũy/trùng lặp entry qua nhiều lần chạy). Doctrine
  đầy đủ (lãnh địa, một-nhạc-trưởng-mỗi-phiên, Known Gaps): `docs/coexistence.md`.

### Khai việc (add) — bề mặt nội bộ

`add` không còn là cửa vào của câu chuyện public (đó là `submit`, per D9
stage-intake) — vẫn hoạt động nguyên vẹn cho test/tooling nội bộ, đòi người
gọi tự điền mọi trường (kể cả tự đặt id kebab-case), khác hẳn UX "nộp rồi đi"
của `submit`. **Đã quyết (STR22, per D1 work-item-verb-surface): giữ `add`
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
- **Side effects:** không.
- **Afterwards:** người/agent thấy item trong `list`; clone khác thấy sau khi nhận commit chứa nhật ký.

### Nộp vấn đề tự do (submit)

- **Runs when:** người/agent gọi `fgos submit "<mô tả>" [--async|--unattended] [--domain <tên>]` —
  song song với `add`, không thay thế; dùng khi người submit không muốn/không
  thể tự điền các trường tách rời của `add`.
- **Blocked when:** thiếu mô tả (không truyền văn bản nào) — `validation` (mã
  4), KHÔNG sự kiện nào được ghi. Không có điều kiện chặn nào khác — mọi mô tả
  không khớp từ khóa phân loại nào vẫn tạo item thành công (rơi về mặc định an
  toàn), đúng tinh thần "không bao giờ chặn vì không đoán được loại".
- **What changes:** một sự kiện khai-item (đúng loại `work.add` như `add`,
  không phải sự kiện mới) vào nhật ký. Các trường được suy tự động từ mô tả:
  - **title** — câu/dòng đầu tiên của mô tả, hoặc một đoạn cắt gọn nếu mô tả
    không có ranh giới câu tự nhiên.
  - **id** — sinh từ title, kèm hậu tố chống trùng; nếu trùng với id đã có
    (hai mô tả tương tự nhau), tự thử lại với hậu tố khác cho tới khi ra một
    id chưa dùng.
  - **tier, kind, risk** — suy bằng cách đếm các từ khóa rủi ro/loại-việc xuất
    hiện trong mô tả (quy tắc cơ học, không dùng model/AI) — không khớp từ
    khóa nào thì `tier`/`risk` về mặc định `standard`, `kind` về mặc định
    `task`. Luôn ghi đè được bằng một sửa (`move`/edit) sau đó.
  - **verify** — một giá trị placeholder cố định, đánh dấu "chưa xác định" —
    một stage sau bổ sung proof thật.
  - **mode** — `sync` nếu không truyền cờ; `async` nếu truyền `--async` hoặc
    `--unattended` (hai cờ cùng nghĩa). Chỉ được GHI lại ở bước này, chưa có
    hành vi nào khác đi kèm — không có gì tự động đậu chờ người ở bước submit,
    kể cả với `--async`.
  - item xuất hiện trong bản chiếu ở `todo` — y hệt `add`, ngay lập tức actionable
    nếu deps rỗng (mặc định của submit).
  - **domain** — tùy chọn qua `--domain <tên>`; vắng mặt đọc ra `coding`.
  - **stage** — stage của domain đó thỏa bước Làm-rõ, nếu domain đó có (per
    "Mô hình domain" trên); với `coding` (mặc định/vắng mặt) luôn là `clarify`
    y hệt trước đây (xem "Giai đoạn Làm-rõ" dưới) — item từ `submit`
    KHÔNG BAO GIỜ xuất hiện trong `ready` cho tới khi context-discovery cho
    qua, dù deps đã rỗng. Một domain KHÔNG có stage nào thỏa bước Làm-rõ (vd
    `synthetic`) nhận stage đầu tiên trong danh sách khai của domain đó thay
    thế — bỏ qua context-discovery hoàn toàn (per R-domain-1 trên); `submit`
    cho một domain như vậy chưa có proof thật (`verify` vẫn là placeholder
    của `submit`, không ai điền lại) — dùng `add --domain <tên> --verify ...`
    cho một domain bỏ-qua-discovery thay vì `submit`.
- **Side effects:** không.
- **Afterwards:** kết quả in ra là work item vừa tạo, bọc trong phong bì máy-đọc
  (xem dưới); item xuất hiện trong `list` ngay (ở stage `clarify`); chỉ xuất
  hiện trong `ready` sau khi qua context-discovery.

### Chạy context-discovery / phán chia-việc (discover)

- **Runs when:** người/agent gọi `fgos discover <id>` — điểm gọi tay/phiên-
  sống (mode `sync`); verb dispatch theo stage HIỆN TẠI của item: item ở
  stage `clarify` chạy context-discovery, item ở stage `decompose` chạy phán
  chia-việc (xem "Giai đoạn Chia-việc" dưới) — cùng một verb, hai phép phán
  khác nhau theo đúng giai đoạn item đang đứng. Vòng tự hành cũng gọi đúng
  hai phép phán này cho mọi item tương ứng mỗi lượt chạy (xem spec Runner) —
  cùng hành vi, khác điểm gọi.
- **Blocked when:** item không tồn tại — `validation`. Không có điều kiện
  chặn nào khác — kể cả khi phép phán chính nó không ra kết quả tin cậy
  (lỗi/timeout), item vẫn chuyển hợp lệ sang `awaiting-human` (context-
  discovery) hoặc ở nguyên trạng thái/stage hiện tại (phán chia-việc — xem
  dưới), không bao giờ crash/throw ra ngoài.
- **What changes:** ở stage `clarify`: một bản ghi discovery (xem trên); rồi
  HOẶC một sự kiện đổi-stage `clarify → decompose` (kèm `verify` thật) NẾU đủ
  rõ, HOẶC một sự kiện đổi-status sang `awaiting-human` (kèm câu hỏi) NẾU
  chưa đủ rõ. Ở stage `decompose`: HOẶC một sự kiện đổi-stage `decompose →
  executing` (pass-through hoặc sau khi sinh đủ con), HOẶC các sự kiện khai-
  con (verdict chia), HOẶC một sự kiện đổi-status sang `awaiting-human` (cần
  người quyết), HOẶC không gì cả nếu verdict không hợp lệ (xem "Giai đoạn
  Chia-việc" dưới).
- **Side effects:** một lời gọi model thật (không phải quy tắc cơ học) — có thể là HAI lời gọi khi lần đầu trả lời thành công nhưng nội dung không đọc được (thử lại một lần với chỉ dẫn nghiêm ngặt hơn, RUL48).
- **Afterwards:** ở clarify, đủ rõ → item sang stage `decompose` (chưa lọt
  `ready` — còn một giai đoạn nữa phải qua) với `verify` thật, không còn
  placeholder; chưa đủ rõ → item xuất hiện trong `list` ở `awaiting-human`
  kèm câu hỏi, y hệt mọi cổng chờ-người khác. Ở decompose, pass-through hoặc
  chia xong → item/gốc sang `executing`, xuất hiện trong `ready` khi deps/
  lineage cũng đã mở; cần người quyết → `awaiting-human` mang đề xuất chia.
  Mọi nhánh chưa xong đều trả lời xong rồi gọi lại `discover` (hoặc để vòng
  tự hành tự quét) sẽ phán lại.

### Chuyển trạng thái (move)

- **Blocked when:** (a) cạnh chuyển không có trong bảng — `todo→doing`, `doing→done`, `doing→proposed`, `proposed→done`, `proposed→todo` (bắt buộc lý do), `proposed→blocked` (bắt buộc lý do — per pr-lifecycle D3 / 1359ab5e, cạnh gate duyệt gãy: merge conflict hoặc verify đỏ sau merge, xem spec Runner "Cổng duyệt PR nội bộ"), `todo/doing→blocked`, `blocked→todo/doing`, `blocked→proposed` (per D18 fan-out-parallel — cạnh cơ học, KHÔNG bắt buộc lý do, dành riêng cho một lần đồng bộ-lại/catch-up sạch, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)"), `todo/doing→awaiting-human` (bắt buộc câu hỏi), `awaiting-human→todo` (bắt buộc câu trả lời) là toàn bộ cạnh hợp lệ — trả `precondition` (mã 2); (a2) cạnh từ-chối `proposed→todo` hoặc cạnh gate-gãy `proposed→blocked` thiếu/rỗng lý do, hoặc cạnh vào chờ thiếu/rỗng câu hỏi, hoặc cạnh rời chờ thiếu/rỗng câu trả lời — trả `validation` (mã 4); (b) trạng thái thực khác `--expect` — trả `conflict` (mã 3); (c) cờ thiếu giá trị hoặc rỗng (`--to` trống, `--expect ""`) — trả `validation` (mã 4), không bao giờ lọt sang phạm trù 2/3. Cả ba trường hợp KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái (kèm from/to) vào nhật ký, rồi bản chiếu cập nhật — luôn theo thứ tự nhật-ký-trước, bản-chiếu-sau.
- **Side effects:** không.
- **Afterwards:** `done` là cửa một chiều ra: item đã done thì mọi lần move tiếp theo đều bị `precondition`. Item bị từ chối về `todo` mang lý do trong nhật ký, vào lại hàng chờ làm tiếp. Cạnh `proposed→todo` (reject) hoặc `proposed→blocked` (gate gãy) mang `reason`: giá trị MỚI NHẤT còn được fold thêm lên chính item (`item.reason`, Data Dictionary #18, latest-wins) — không chỉ nằm trong nhật ký sự kiện, để consumer sau (prompt worker, người đọc `list`) thấy lý do mới nhất mà không cần lục nhật ký (per worker-execution STR33 / 396d9d9e, xem spec Runner RUL23 (runner)). Cạnh `blocked→proposed` (per D18 fan-out-parallel) là cạnh DUY NHẤT rời `blocked` không mang `reason` và không đi qua `doing` — dành riêng cho một lần đồng bộ-lại (catch-up) sạch, phân biệt với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, đi qua chống-lặp bình thường như mọi lần nhận việc khác); xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)".

### Sửa việc (edit) — luôn ghi đè được (STR23, per D2-D5 work-item-verb-surface)

`edit` là cửa công khai để sửa đè các trường trên một item ĐÃ có sẵn — đóng
khoảng trống "luôn ghi đè được" mà `submit`'s phân loại cơ học (mechanical
classification) để lại (item vào qua `submit` không có cơ hội sửa lại field
đã phân loại sai). Ghi qua CÙNG một cửa ghi duy nhất (CTR002, `src/state/
store.mjs`) như `add`/`move` — không tạo cửa ghi thứ hai. Danh sách trường
được sửa (D4, RỘNG): `title`, `kind`, `risk`, `verify`, `tier`, `refs`,
`deps`. Cố tình KHÔNG sửa được `id` (định danh bất biến), `status` (thuộc
`move`), `stage` (thuộc `moveStage` nội bộ, chưa có verb công khai), hay
`domain` (D5) — mỗi trường đó đã có cửa ghi riêng, gộp vào `edit` sẽ tạo cửa
ghi thứ hai cho cùng một trường.

- **Blocked when:** id không tồn tại — `validation` (mã 4); patch rỗng
  (không cờ `--<field>` nào được truyền) — `validation`; patch chứa một
  trường ngoài danh sách D4 ở trên (kể cả cố tình truyền `id`/`status`/
  `stage`/`domain`) — `validation`, bị chặn TRƯỚC khi merge vào bản ghi; giá
  trị sau merge không qua được `validateWork` (vd `--tier` ngoài domain,
  `--deps` trỏ id không tồn tại) — `validation`. Cả bốn trường hợp KHÔNG ghi
  sự kiện nào.
- **What changes:** một sự kiện `work.edit` mang patch (CHỈ những trường
  thật sự đổi, không phải toàn bộ bản ghi) vào nhật ký; bản chiếu gộp thêm
  (Object.assign) đúng những trường đó lên item — additive, không bao giờ
  ghi đè lại một sự kiện cũ (per D3/RUL11).
- **Side effects:** không.
- **Afterwards:** hai lần `edit` liên tiếp trên cùng item đều đọng lại —
  patch sau không xóa mất trường patch trước đã đổi (mỗi lần chỉ gộp đúng
  các key nó mang). Bỏ qua một cờ `--refs`/`--deps` giữ nguyên trường đó;
  truyền cờ với giá trị rỗng (`--refs ''`) XÓA trường về `[]` — hai trường
  hợp này phân biệt được, không lẫn vào nhau (cùng cơ chế `parseListFlag`
  `add` đã dùng). `edit` chạy được y hệt bất kể `status` hiện tại của item
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
- **What changes:** một sự kiện chuyển-trạng-thái mang câu trả lời vào nhật ký; item về `todo`, bản chiếu gộp câu trả lời vào bản ghi cổng (cạnh câu hỏi đã có vẫn còn — cộng thêm, không đè).
- **Side effects:** không.
- **Afterwards:** item lại actionable — xuất hiện trong `ready` khi deps đủ điều kiện; bản ghi cổng giữ cả câu hỏi lẫn câu trả lời để tra sau.

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

### Xem tiến độ theo bộ (rollup)

- **Runs when:** người/agent gọi `fgos rollup <id>` để hỏi "việc tôi nộp tới đâu rồi" cho một item gốc (per stage-clarify D11 / STR24).
- **Blocked when:** thiếu id — `validation`; id không tồn tại trong bản chiếu — `validation`, cùng khuôn `requireField`/not-found với `review`/`approve`. Không bao giờ ghi gì — đọc thuần, cùng họ với `check`/`list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** in item gốc (title + status), rồi đếm con TRỰC TIẾP (qua `parent`, dựng từ STR16 decompose) đã `done` trên tổng số con (`k/n done`), rồi liệt kê từng con kèm status riêng của nó; item gốc không có con nào vẫn in `0/0 done` cộng một ghi chú rõ ràng "không có con" — không throw, không coi là lỗi.

### Xếp hạng tác động backlog (triage)

- **Runs when:** người/agent gọi `fgos triage` để hỏi "việc nào nổi lên chú ý" — cửa 2 của triage, phân biệt với STR14 intake-triage (cửa 1, phân loại rủi ro/lane lúc submit) — per deep-dive work-item-management.md, STR21.
- **Blocked when:** nhật ký hỏng → `corrupt-log`. Không bao giờ ghi gì — đọc thuần, cùng họ với `rollup`/`check`/`list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** in mọi item CHƯA `done`, xếp hạng theo `blocks` — số item khác CŨNG CHƯA `done` đang liệt kê id đó trong `deps` — giảm dần, tie-break id tăng dần; item `done` không bao giờ xuất hiện trong danh sách VÀ không bao giờ được đếm vào `blocks` của item khác (một dep đã `done` không còn "chặn" ai); backlog rỗng hoặc mọi item đã `done` → một dòng thông báo rõ ràng, không throw. `blocks` là một proxy tác động (fan-out chặn), KHÔNG phải trường `priority` trên schema (đó là phạm vi STR7/STR8, còn `proposed`) — một derive thuần trên `deps` sẵn có, cùng tinh thần với `frontier.mjs`'s derive trên `parent`.

### Cầm việc qua cửa pull (take)

- **Runs when:** một tác nhân ngoài runner gọi `fgos take [--id <id>] [--actor human|session]`.
- **Blocked when:** `--actor` khác `human`/`session` — `validation`; không truyền `--id` và frontier rỗng — `validation`; `--id` truyền một id không tồn tại — `validation`; `--id` truyền một item còn `todo` nhưng CHƯA nằm trong frontier (stage/deps/lineage chưa mở) — `validation`, thông điệp nói rõ "take chỉ mở đúng tập runner dispatch-được" (D1); `--id` truyền một item đã bị cầm/đỗ/kẹt — rơi thẳng xuống CAS của cạnh chuyển trạng thái, báo `conflict` thật (mã 3). Mọi nhánh chặn KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái `todo → doing` vào nhật ký, mang thêm `actor` và `headAtTake` (Data Dictionary #14/#15); một sự kiện outcome nửa DỰ ĐOÁN (tier/số dep/số lần nhận trước đó) cho cùng item — đối xứng claim của runner (xem spec Runner).
- **Side effects:** không.
- **Afterwards:** item chuyển sang `doing`, biến mất khỏi frontier (giống mọi claim khác); `fgos check` đọc được nửa dự đoán ngay; item chờ một `fgos return` để tới kết cục.

### Trả việc qua cửa pull (return)

- **Runs when:** người/phiên đang cầm một item qua `take` gọi `fgos return <id> [--timeout <ms>]`.
- **Blocked when:** item không tồn tại — `validation`; item không ở `doing` — `validation`; item đang `doing` nhưng `claimActor` không phải `human`/`session` (claim của runner) — `validation`, `return` chỉ hoàn tất một `take`; item thiếu `headAtTake` (claim di sản/không qua `take`) — `validation`; working tree host repo KHÔNG sạch (loại trừ `.fgos/` — store sống tự mutate bởi chính `return`, không bao giờ tính là bẩn) — `validation`; HEAD chưa tiến so `headAtTake` — `validation`; `--timeout` không phải số dương — `validation`. KHÔNG có nhánh chặn nào ghi sự kiện.
- **What changes:** verb TỰ CHẠY `verify` thật của item (goal-check) tại HEAD hiện hành, trong thư mục làm việc hiện hành — không bao giờ tin lời người gọi. Verify xanh: một sự kiện chuyển-trạng-thái `doing → proposed` mang thêm `headAtReturn` (HEAD tại đúng thời điểm này, Data Dictionary #16, per pr-lifecycle D1 / 1359ab5e), cộng một sự kiện outcome nửa THỰC TẾ (kết cục `proposed`, đạt goal-check, số commit kể từ `headAtTake`). Verify đỏ: một sự kiện chuyển-trạng-thái `doing → blocked` (lý do `verify-fail`), cộng nửa thực tế (kết cục `blocked`, không đạt), cộng một bản ghi friction lớp `verification`.
- **Side effects:** một tiến trình con chạy `verify` của item (shell, trong `cwd` hiện hành).
- **Afterwards:** verify xanh → item ở `proposed` mang `headAtReturn`, chờ người duyệt qua cổng `review`/`approve`/`reject` như mọi đề xuất khác (xem spec Runner "Cổng duyệt PR nội bộ" — dải `headAtTake→headAtReturn` là nguồn diff của một đề xuất pull-door) — KHÔNG sinh settlement ở bước này (settlement thuộc cạnh `→done`); verify đỏ → item ở `blocked`, mang một bản ghi friction verification, đi lại đường `blocked → todo` thường như mọi item đỗ khác.

### Dựng lại (rebuild) — thao tác phục hồi

- **Runs when:** người/agent gọi, đặc biệt khi bản chiếu mất hoặc nghi lệch so với nhật ký.
- **What changes:** bản chiếu được dựng lại từ zero bằng phát lại toàn bộ nhật ký — kết quả giống hệt bản chiếu trước đó (đã chứng minh bằng test đầu-cuối chạy lệnh thật: xóa bản chiếu → rebuild → so sánh sâu bằng nhau).
- **On failure:** nhật ký có dòng cuối dở dang (đứt giữa chừng khi ghi) → báo `corrupt-log` (mã 5) nói rõ lỗi, phần nguyên vẹn phía trước vẫn đọc được; hỏng ở GIỮA nhật ký là lỗi cứng, không tự sửa, không nuốt.

### Đọc (list / ready)

- **Blocked when:** nhật ký hỏng → `corrupt-log` (mã 5). Đọc không bao giờ ghi gì — chạy bao nhiêu lần nhật ký cũng không đổi một byte (có test so byte khóa).
- **ready:** trả danh sách việc sẵn-sàng dẫn xuất từ trạng thái (`todo` + mọi dep `done` thật + đang ở stage `executing` + không còn hậu duệ dang dở qua `parent`; dep đang `proposed`/`doing`/`blocked`/`awaiting-human` KHÔNG mở việc phụ thuộc), thứ tự đúng thứ tự khai việc; kho chưa khởi tạo → danh sách rỗng, thành công. Đầu ra máy-đọc-được. Item `awaiting-human` không lọt vào tập này vì chỉ trạng thái `todo` mới sẵn-sàng — cổng chờ-người được loại "miễn phí" bởi chính bộ lọc trạng thái, và một item có dep đang chờ-người cũng không được mở. Item còn ở stage `clarify`/`decompose` cũng không lọt vào tập này dù status là `todo` — "sẵn sàng" nghĩa là đã qua cả context-discovery lẫn chia-việc, không chỉ đã hết dep. Một item gốc còn hậu duệ dang dở cũng không lọt vào tập này dù bản thân nó `todo`+`executing` — lineage (`parent`) là một chiều lọc riêng, tách khỏi `deps`.
- **Thứ tự sẵn-sàng là một HỢP ĐỒNG CÓ VERSION (STR43 S4).** Thứ tự `ready` trả về (FIFO theo thứ tự khai việc) không phải ngẫu nhiên — nó là hợp đồng phân-thứ-tự có tên, có số phiên bản (v1 = FIFO khai-việc, khóa duy nhất). Đây là bề mặt DUY NHẤT quyết định thứ tự cầm-giao việc; một khóa ưu tiên tương lai (STR7) là một thay đổi v1→v2 CÓ CHỦ Ý làm ở đúng chỗ đó, không phải một đảo-thứ-tự vô tình.

### Đọc metrics đồ thị (graph) — bề mặt đọc-thuần STR43

Một verb đọc-thuần trả **metrics CƠ HỌC** của đồ thị công việc, fold từ nhật ký, qua envelope CTR001. Không bao giờ ghi, không bao giờ gọi model — chỉ tính SỰ THẬT đồ thị cho một bên đọc (picker STR7, planner-brain STR8) dùng làm đầu vào, thay vì tự suy lại topology (stance RUL42 (runner)). Mọi số liệu deterministic (cùng nhật ký → cùng kết quả → `data_hash` ổn định).

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

- Mỗi item có thể khai một **`footprint`** — danh sách đường-dẫn file nó dự kiến chạm (`add --footprint a,b`). Trường phụ TÙY CHỌN, cưỡi SCHEMA_VERSION 2, vắng-khi-không-khai; là nội dung cụ thể cho hai trường CTR003 có-tên-mà-rỗng (`forbidden_paths`/`required_outputs`). PHI-CHẶN: chỉ nuôi cố-vấn này, không vào cycle-check/frontier.
- Mỗi cặp ready chia sẻ ≥1 đường-dẫn footprint được nêu kèm đường-dẫn chung + **lựa chọn giải quyết** `sequence`/`hoist`/`re-slice`. Bên cố-vấn CHỈ gợi ý — không bao giờ tự re-slice hay sửa deps. Item không khai footprint không bao giờ xung đột.

## Actors & Access

| Capability | Người vận hành | Agent trong repo | Clone/máy khác |
|---|---|---|---|
| Mọi thao tác ghi (init/add/move/decision/ask/answer) | ✓ qua cửa lệnh duy nhất | ✓ qua cửa lệnh duy nhất | — (nhận qua commit) |
| Trả lời một cổng chờ-người (answer) | ✓ — người là bên quyết | ✓ về mặt cơ chế (cùng cửa lệnh); ai được phép trả lời cổng nào chưa phân quyền | — |
| Đọc (list) / rebuild | ✓ | ✓ | ✓ sau khi clone/pull |
| Ghi thẳng vào nhật ký hay bản chiếu không qua cửa | — cấm | — cấm | — cấm |

## Business Rules

- **RUL1.** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lại được từ zero — không bao giờ là truth (per D3 / 451ca088; luật nền L3).
- **RUL2.** Mọi mutation đi qua đúng MỘT cửa; mỗi mutation để lại đúng một sự kiện (per D3).
- **RUL3.** Thứ tự ghi bất biến: sự kiện vào nhật ký TRƯỚC, bản chiếu cập nhật SAU; bản chiếu lệch thì rebuild là đường phục hồi (per D3).
- **RUL4.** Chuyển trạng thái chỉ theo bảng cạnh tường minh; `done` terminal: hai lối vào (thao tác tay / duyệt đề xuất), không lối ra (per D4 / fd17309a; mở rộng per D5 phase-2-routing / feed7428). Với domain khai stage `compound-learn` (coding), cả hai lối vào `done` còn đòi thêm một điều kiện tiên quyết — item phải đã qua stage đó trước; domain không khai stage này (`synthetic`) đóng không đổi (per D2/D3 compound-learn-enduser-docs / 9c67c3d1 — xem RUL49/RUL50).
- **RUL5.** Ghi có kỳ vọng: trạng thái thực khác kỳ vọng → từ chối, không ghi đè mù (per D3).
- **RUL6.** Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp (per luật L4 / 14ebeea9).
- **RUL7.** Schema item mang đủ chất liệu trả lời sáu câu hỏi harness: refs (đọc gì/contract), kind (loại), risk (rủi ro), verify (proof), learn (bài học) (per luật L5).
- **RUL8.** Deps phải trỏ id tồn tại, cấm tự trỏ; một loại item duy nhất, không cấp bậc entity (per D4 / D1).
- **RUL9.** Tầng này quản việc của chính forgent; không generic hóa cho consumer khác khi chưa tới lượt (per D1 / 9ac6ca50).
- **RUL10 (tiền đề có ngưỡng).** Một người ghi tại một thời điểm; khi nhiều agent ghi đồng thời thành tải chính, mở lại thiết kế store theo ngưỡng đã ghi trong luật L3 (per ae461c8b). **Bổ chú (fgos-multi-session-checkout Epic 3 / STR35):** cửa ghi sự kiện `appendEvent` nay tự khóa liên-tiến-trình bằng một `.fgos/events.lock` riêng (chính sách CHẶN-có-timeout — thử lại với backoff cho tới khi thắng hoặc hết giờ, mirror `acquireSessionsLock` chứ KHÔNG phải lối lùi-không-chặn của `acquireRunnerLock`; một thể hiện thứ ba độc lập của cùng primitive wx-atomic-create + gặt-pid-chết, không đụng `runner.lock`/`sessions.lock`). Nhờ đó hai tiến trình `fgos` chạy song song không còn cùng đọc một `seq` cuối rồi cùng ghi `seq+1` — đua trùng-seq trên nhật ký append-only (đã xác nhận bằng spike) bị đóng NGAY TẠI append. Hết timeout khi giành khóa → phạm trù lỗi MỚI `lock-timeout` (tách bạch `corrupt-log`/`validation`: nghĩa là "đang có người ghi, thử lại cả thao tác", không phải hỏng dữ liệu). **Bổ chú 2 (store-atomic-rmw):** dư lượng trên — khóa chỉ đóng đua tại chính append, không đóng đua đọc-sửa-ghi cấp cao ở `store.mjs` — nay ĐÃ ĐÓNG. `events.mjs` xuất thêm `withEventsLock(logPath, fn)` (giữ nguyên `.fgos/events.lock` hiện có, không khóa mới) và `appendEventLocked` (lõi không-tự-khóa của `appendEvent`, dùng khi khóa đã đang giữ). `addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`) trong MỘT phiên giữ khóa đó — tiến trình thứ hai giành khóa sẽ đọc lại SAU KHI sự kiện của tiến trình thứ nhất đã nằm trong nhật ký, nên tiền-kiểm của nó phát hiện đúng xung đột (`validation` "already exists" hoặc `conflict` CAS) thay vì cùng qua rồi cùng ghi. `refreshView` (dựng lại bản chiếu + ghi `state.json`) vẫn chạy SAU khi khóa nhả, không đổi. `runner.lock`/hàng-ghi ở tầng vòng lặp không đụng tới.
- **RUL12 (frontier dẫn xuất).** Việc-kế-tiếp là truy vấn dẫn xuất từ trạng thái, không bao giờ là danh sách tay; dep chỉ mở việc phụ thuộc khi thật sự `done` — đề xuất chưa duyệt không mở (per D5 phase-2-routing / luật RUL5 nền tảng).
- **RUL11 (tiến hóa schema).** Nhật ký đã commit bất khả xâm phạm — không bao giờ migration ghi đè; replay tương thích ngược có test khóa (bản ghi di sản thiếu trường nhận default khai báo, fixture nhật ký Phase 1 thật là chuẩn nghiệm thu); mỗi sự kiện mới mang phiên bản schema (per D7 phase-2-routing / feed7428).
- **RUL13 (bản ghi outcome, cộng thêm không đè).** Dự đoán và thực tế của cùng một item là hai sự kiện outcome riêng, gộp theo id ở bản chiếu; nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất nửa trước (per D2 phase-3-compound-learning / 1a80b4d3). Đây là một ca cụ thể của luật tiến hóa schema RUL11: cộng thêm, không migration, log cũ replay nguyên vẹn không sinh outcome nào.
- **RUL14 (cổng chờ-người, awaiting-human).** "Chờ người quyết" là một trạng thái RIÊNG, tách bạch khỏi `blocked` (kẹt vì lỗi/runner-park) — "việc đang chờ tôi" tra được sạch theo một status (per D1). Là MỘT trạng thái chung, không đẻ nhiều loại cổng (need-review/need-approval/…) khi chưa có consumer thật cần — nội dung câu hỏi/câu trả lời đã gánh phần "chờ gì" (per D3). Mỗi cổng mang một cặp câu hỏi/câu trả lời cụ thể, không chỉ nhãn: câu hỏi ghi lúc vào chờ, câu trả lời ghi lúc người trả lời (per D2). Đậu VÔ THỜI HẠN — không timeout, không hết-hạn, không đánh-thức tự động; người quay lại lúc nào trả lời lúc đó (per D4). Người trả lời qua một lệnh CLI; câu trả lời thành một sự kiện trong nhật ký, rồi item RỜI `awaiting-human` về `todo` và chạy tiếp (per D5). Câu hỏi của một cổng đang chờ đọc được qua `list` sẵn có — không cần surface đọc riêng (per D7). Tất cả per 65c642a8 (khóa exploring async-human-gate).
- **RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng).** Bộ chọn việc-sẵn-sàng và runner KHÔNG BAO GIỜ pick một item `awaiting-human`; một item có dep đang `awaiting-human` cũng không được mở (dep chỉ mở khi thật `done`). Đây là tiêu chí nghiệm thu, không phải khuyến nghị: một việc chờ người mà runner vẫn pick thì phá cả ý nghĩa cổng (per D6 / 65c642a8). Là hệ quả trực tiếp của RUL12 (chỉ `todo` mới sẵn-sàng) áp cho trạng thái mới — không cần điều kiện lọc thêm, có test khóa cả hai chiều.
- **RUL16 (submit là cơ học, không bao giờ chặn).** Phân loại tier/kind/risk của `submit` chỉ đếm từ khóa, không gọi model/AI; mô tả không khớp từ khóa nào KHÔNG BAO GIỜ chặn tạo item — luôn rơi về mặc định an toàn, luôn ghi đè được sau (per D1/D5 stage-intake / 9f6b52c8). **Bổ chú (self-improve loop STR13 Slice 2, D13/D14):** bộ từ khóa rủi-ro-nặng quyết định tier `heavy` không còn riêng của `submit` — nó là MỘT nguồn dùng chung với phép thử-từ-khóa của Iron Law (xem spec Runner "Iron Law — phân loại rủi ro của một candidate fix"), và đã được mở rộng thêm 13 từ khóa (nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán) — `submit` từ nay phân loại `heavy` cho các mô tả trùng từ khóa mới này, một thay đổi hành vi CHỦ Ý, không phải hồi quy.
- **RUL17 (mode là quy ước gọi, không phải điều kiện code).** Trường `mode` do `submit` ghi lại chế độ đã dùng khi tạo item; KHÔNG có đoạn code nào (submit, discover, hay vòng tự hành) đọc/rẽ nhánh theo giá trị của nó. Ý nghĩa của `mode` là quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-discover-TRƯỚC (per D6 stage-intake / 9f6b52c8, làm rõ tại D5/D13 stage-clarify / 9a19eea5): `sync` gợi ý phiên đang sống nên tự gọi `discover` ngay; `async` gợi ý không ai làm vậy, để vòng tự hành lo. Dù người gọi bỏ qua gợi ý này (gọi sai chiều, hoặc không gọi gì cả), RUL18 đảm bảo item vẫn được xử lý.
- **RUL18 (stage — chiều vĩ mô song song với status).** Mỗi item mang thêm một trường `stage` (`clarify`/`decompose`/`executing`), tách bạch khỏi `status` (vi mô, không đổi ở quyết định này): `stage` trả lời "loại tác vụ nào đang cần", `status` trả lời "việc đang ở đâu trong vòng đời của tác vụ đó". Item vào hệ qua `submit` bắt đầu ở `clarify`; qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing` (per D1/D8 stage-clarify / 9a19eea5; giá trị `decompose` thêm sau, per D2 stage-decompose / 43f257ae).
- **RUL19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode).** Mỗi lượt chạy, vòng tự hành quét TOÀN BỘ item đang `stage: clarify` VÀ `status: todo` — không phân biệt giá trị `mode` — và tự chạy context-discovery cho từng item, TRƯỚC khi giao bất kỳ việc thi công executing nào trong cùng lượt. Không bao giờ chạm item đang `awaiting-human` (hệ quả trực tiếp của RUL15, áp dụng cho cả sweep này). Đảm bảo không item nào kẹt vô hình dù phiên sống đã chết giữa chừng hoặc người submit bỏ đi không gọi `discover` (per D13 stage-clarify / 9a19eea5).
- **RUL20 (settlement — kênh 1 của capture 2 kênh).** `actor` là trường cộng-thêm tùy chọn trên chính ngã-ngũ (`work.move`/`work.stage`) — không sinh event mới. Bản ghi settlement là bề mặt đọc dẫn xuất từ ba loại ngã-ngũ đã có (clarify-pass/answer/close), cộng thêm không đè theo id, và giữ nguyên nhật ký di sản thật (không tự "mọc" bản ghi cho một ngã-ngũ tiền-phiên-bản) (per D2/D3 phase-3-compound-learning S3-closeout / 96a65365; hoàn thành quyết định trì hoãn 719cbe3a).
- **RUL21 (câu-6 tự động — bài học lúc đóng).** Bất kỳ item nào tới `done`, qua CẢ HAI lối vào, đều tự động sinh một bản ghi học cơ học — không phán xét, không gọi model. Soạn bài học là best-effort: lỗi soạn không bao giờ chặn việc đóng item; item không dữ liệu nào trước đó vẫn nhận một bản ghi tối thiểu, không rỗng-im-lặng (per D3 phase-3-compound-learning S3-closeout / 96a65365).
- **RUL22 (mọi item qua chia-việc trước executing).** Item rời `clarify` luôn vào stage `decompose` trước — không còn cạnh nào đi thẳng `clarify → executing` trong thực tế, dù cạnh đó vẫn hợp lệ trong bảng chuyển-stage cho log di sản. Item đơn giản được phán pass-through rẻ; chỉ item cần chia mới tốn công thật (per D2 stage-decompose / 43f257ae).
- **RUL23 (hợp đồng con — verify thật, không placeholder).** Mỗi con sinh ra từ phán chia-việc phải mang `verify` THẬT (lệnh chạy được) ngay từ lúc sinh — con bỏ qua `clarify` nên chính phán chia-việc là nơi sản xuất verify đó. Verdict có bất kỳ con nào thiếu verify là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item ở nguyên trạng cho lượt quét sau (per D2 stage-decompose / 43f257ae).
- **RUL24 (lineage `parent` tách bạch với `deps` về lưu trữ và điều-phối).** `parent` là quan hệ lineage (hậu duệ→gốc); `deps` là quan hệ chặn. Về LƯU TRỮ và ĐIỀU-PHỐI hai quan hệ không bao giờ trộn: con của một lần chia-việc TUYỆT ĐỐI KHÔNG được ghi vào `deps` của gốc (per D4/D5 stage-decompose / 43f257ae). **Bổ chú (work-graph-intelligence S2a / record ADR0012):** "tách bạch" nay giới hạn ở lưu trữ + điều-phối; cho phép kiểm PHI-CHU-TRÌNH, `deps` và `parent` được chiếu thành MỘT đồ thị cạnh-định-kiểu hợp nhất (RUL44) — không mâu thuẫn: con vẫn không nằm trong `deps` của gốc, chỉ là cả hai cạnh cùng được một phép kiểm chu trình soi.
- **RUL25 (frontier chặn gốc theo lineage, gốc tự chứng minh khi bộ đóng).** Bộ lọc frontier chặn một gốc khi bất kỳ hậu duệ nào (qua chuỗi `parent`, đệ quy) chưa `done` — dẫn xuất thuần từ `parent`, không cơ chế mới. Khi hậu duệ cuối đóng, gốc tự lọt frontier như một item thường; `verify` của chính gốc (mang từ lúc rời clarify) là phép kiểm tích hợp của cả bộ — không có bước "đóng bộ" ghi riêng, không auto-`done` không chứng minh (per D4 stage-decompose / 43f257ae).
- **RUL26 (cổng-người có điều kiện trên kết quả chia).** Con mặc định vào queue thẳng; item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`. Chế độ sync hỏi ngay trong phiên, dấu vết y hệt async (per D3 stage-decompose / 43f257ae).
- **RUL27 (settlement `clarify-pass` theo rời-clarify, không theo đích cụ thể).** Bản ghi settlement kind `clarify-pass` ghi khi item RỜI stage `clarify`, bất kể đích là `decompose` (hôm nay) hay `executing` (log di sản/cạnh cũ) — khóa theo cạnh RỜI, không theo cạnh ĐẾN, để việc chèn stage mới ở giữa không làm câm bản ghi settlement đã có (per D2 stage-decompose / 43f257ae).
- **RUL28 (cửa pull take/return — mirror trung thực, không tin lời).** `take` mở đúng tập frontier runner dispatch-được (`readyWork`), không bao giờ mở một tập riêng (per D1 stage-decompose / 43f257ae). `return` không bao giờ chuyển `doing → proposed` chỉ vì người gọi tự báo xong: nó tự đo working tree sạch + HEAD tiến so `headAtTake` (tiến bộ THẬT) + tự chạy `verify` thật của item, cùng khuôn "không tin lời" của RUL13; verify đỏ đi đúng đường `blocked` + friction như runner tự đỗ. Không sinh settlement ở `return` — settlement chỉ sinh ở cạnh `→done` (per D4 stage-decompose), giữ đúng một nguồn sự thật cho "đóng bộ" (per 6f2cbc47, a30a3d3c).
- **RUL29 (cạnh `proposed→blocked` — gate duyệt gãy, bổ sung schema duy nhất của pr-lifecycle).** Cổng duyệt (spec Runner "Cổng duyệt PR nội bộ") khi gặp merge conflict hoặc verify đỏ sau merge chuyển item `proposed → blocked` mang `reason` bắt buộc, cùng khuôn enforce-reason với `proposed→todo` — cạnh MỚI DUY NHẤT mà feature này thêm vào bảng FSM (per D3 pr-lifecycle / 1359ab5e). `todo` bị loại vì runner tự re-dispatch (sai nghĩa giữ-chờ-người); `blocked` đúng nghĩa kẹt-vì-lỗi. KHÔNG tự rebase, KHÔNG halt cả vòng runner — item đậu lại như mọi `blocked` khác, đi lại đường `blocked → todo/doing` sẵn có khi người xử lý xong.
- **RUL30 (`headAtReturn` — đối xứng `headAtTake`, nguồn diff của một đề xuất pull-door).** `return` verify xanh ghi thêm `headAtReturn` (HEAD host repo tại đúng thời điểm đó) lên CÙNG sự kiện `doing→proposed` (per pr-lifecycle D1 / 1359ab5e) — cổng duyệt dùng dải `headAtTake→headAtReturn` làm nguồn diff trung thực của một đề xuất pull-door. Vắng mặt cho đề xuất runner (không qua `return`) và cho mọi đề xuất tạo trước feature này (tương thích ngược, RUL11).
- **RUL31 (lãnh địa fgos tường minh, `init` chỉ đọc-và-ghi-nhận).** Lãnh địa ghi/khóa của fgos là CHÍNH XÁC `.fgos/` (data dir theo cwd) + worktree tmpdir + nhánh `fgw/*`, cộng đúng hai cửa có chủ (merge-sau-duyệt cổng review, và source repo khi một runner worker được giao việc) — mọi thứ fgos làm với file của một harness khác là READ-ONLY, không bao giờ ghi/sửa/xóa. `init` quét marker harness khác (thư mục dấu ấn + khối managed AGENTS.md) chỉ để GHI NHẬN vào manifest `.fgos/coexistence.json`, không bao giờ tạo/sửa `AGENTS.md` của host; lỗi phát hiện không chặn `init` (fail-safe), re-init idempotent (per install-coexistence D2/D4/D6 / f1715488; doctrine đầy đủ: `docs/coexistence.md`).
- **RUL32 (`reason` mới nhất fold lên item, latest-wins — khác khuôn cộng-thêm-không-đè).** Trường `reason` trên một sự kiện `work.move` (reject `proposed→todo`, hoặc gate-gãy `proposed→blocked`) được fold thêm lên `item.reason` (Data Dictionary #18) — GHI ĐÈ giá trị cũ mỗi lần (latest-wins), khác hẳn khuôn "cộng thêm, không đè" của outcome/friction/settlement/discovery: đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker cần lý do MỚI NHẤT, không phải toàn bộ lịch sử), không phải một chuỗi ghi nhận lịch sử. Item chưa từng bị đỗ/từ chối không mang trường này — vắng mặt hoàn toàn (tương thích ngược, RUL11) (per worker-execution STR33 / 396d9d9e).
- **RUL33 (cạnh `blocked→proposed` — đồng bộ-lại cơ học, cạnh MỚI DUY NHẤT mà fan-out-parallel thêm vào bảng FSM).** Khi một việc đỗ vì gãy nhập (xung đột/verify-đỏ-sau-nhập/trôi-tích-hợp) được đồng bộ-lại (catch-up) sạch, nó chuyển thẳng `blocked → proposed` — cạnh này KHÔNG mang `reason` bắt buộc (khác khuôn của `proposed→todo`/`proposed→blocked`, cùng khuôn cơ học của `blocked→todo`/`blocked→doing`) và KHÔNG BAO GIỜ đi qua `doing`, nên không tính vào ngân sách chống-lặp (`visitCount`) của việc — phân biệt rõ với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, có tính) (per D18 fan-out-parallel / 2e92b7a5, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)").
- **RUL34 (`branchHeadAtTake`/`branchHeadAtReturn` — cặp marker nguồn-nhánh, luôn tách bạch với `headAtTake`/`headAtReturn`).** Cửa pull `take`/`return` trên một item `blocked` mang nhánh sống ghi CẶP marker riêng — `branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên cạnh `blocked→doing`, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên cạnh `doing→proposed` — mirror đúng cặp `headAtTake`/`headAtReturn` main-based nhưng KHÔNG BAO GIỜ cùng xuất hiện với cặp đó trên MỘT item: một claim nguồn-nhánh ghi `branchHeadAtTake` thay vì `headAtTake`, một return nguồn-nhánh ghi `branchHeadAtReturn` thay vì `headAtReturn` — trộn hai cặp cho cùng một đề xuất khiến `reviewDiff` của cổng duyệt dựng một dải vô nghĩa (cấm tuyệt đối, kiểm bằng test). `branchHeadAtTake` là discriminator DUY NHẤT `return` dùng để rẽ nhánh nguồn-nhánh — không dùng `classifySource` (nó ưu-tiên-nhánh và nhập nhằng với một pull-take main-based mà nhánh vẫn còn sót lại) (per D2 human-rounds / 5a6900b2, xem spec Runner RUL30 (runner)).
- **RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage).** Một domain khai đúng ba thứ: danh sách stage có thứ tự, step-mapping (bước nào trong 5 bước base-workflow mỗi stage thỏa), và cạnh chuyển-stage hợp lệ riêng của nó — domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`), tách bạch tuyệt đối khỏi `status`. Hôm nay tồn tại hai domain: `coding` (tái tạo byte-for-byte mọi giá trị stage/step-mapping/cạnh-chuyển đã có) và `synthetic` (minh họa, đúng một stage, mapped duy nhất vào Thực-thi); cả `add`/`submit` đều có flag `--domain` (mặc định `coding` khi vắng) nối thẳng vào cửa CLI thật (per D1-D4 base-workflow-model / 2ae492d8, hoàn tất S1+S2). Item vắng `domain` (mọi item tạo trước base-workflow-model) đọc ra `coding` — mặc định lazy, cùng khuôn `stage`'s D8. Một giá trị `domain` lạ tại các điểm đọc nóng (frontier/vòng tự hành/bảng chuyển-stage) fail-safe về `coding` kèm cảnh báo, không throw.
- **RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị).** Quan hệ giữa các work item được mô hình hóa thành MỘT đồ thị cạnh-định-kiểu DẪN XUẤT (không phải một trường lưu trữ mới): mỗi phần tử `deps` là một cạnh **chặn** (`blocks`), mỗi `parent` là một cạnh **cha-con** (`parent-child`) — hướng cạnh là "nguồn chờ đích" (một gốc chờ hậu duệ của nó, đúng theo lineage của frontier: cạnh cha→con). Bất biến phi-chu-trình của cửa ghi phủ TOÀN đồ thị hợp nhất này (chặn + cha-con), không chỉ `deps`: `add`/`edit` từ chối mọi ghi khép một chu trình — kể cả chu trình TRỘN (một cạnh chặn cộng một chuỗi cha-con) hay chu trình cha-con thuần — với lỗi phạm trù `validation` (mã thoát 4). Đây là supersession CÓ CHỦ Ý của thiết kế "deps và parent tách bạch tuyệt đối" (record ADR0002 → record ADR0012): hai quan hệ giữ lưu trữ + điều-phối riêng (RUL24) nhưng là một đồ thị cho phép kiểm chu trình. Bốn LOẠI CẠNH của mô hình là `blocks` / `parent-child` / `waits-for` / `discovered-from`. `blocks`/`parent-child` có nguồn dữ liệu từ `deps`/`parent` và tham gia bất biến acyclic. `discovered-from` NAY CÓ trường lưu trữ thật (`discoveredFrom`, xem Data Dictionary #22) và hai nguồn sinh (tường minh lúc khai việc, hoặc tự động khi trợ lý báo phát-hiện lúc thi công — xem spec Runner "Báo việc-phát-hiện từ trợ lý", per work-graph-intelligence S2b / 8cf7effe) nhưng là cạnh KHÔNG chặn theo đúng thiết kế ban đầu — loại trừ khỏi phép kiểm chu trình. `waits-for` (chờ mềm) VẪN là TỪ VỰNG MÔ HÌNH đã khai, chưa có trường lưu trữ hay nguồn sinh — chưa có driver fgOS cụ thể nào cần tới nó, deferred có chủ ý (per work-graph-intelligence S2b / 81322763) tới khi một use-case thật xuất hiện. Chỉ hai loại cạnh chặn (`blocks`, `parent-child`) tham gia bất biến acyclic (per work-graph-intelligence S2a / b5c0ba0c, record ADR0012).
- **RUL45 (`awaitingContext` — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm, không lưu trữ).** Với mọi item `awaiting-human` có `parent`, `list` tính thêm một khóa cộng thêm `awaitingContext[id]` — KHÔNG BAO GIỜ lưu vào bản chiếu hay nhật ký, tính lại mỗi lần đọc từ đúng dữ liệu đang có (per D1 — không "session" nào sống ngoài nhật ký/bản chiếu; không có transcript nào được lưu lại hay phát lại). Nội dung luôn mang `parent: {id, title, status}` lấy từ trạng thái SỐNG hiện tại của gốc — neo luôn cập nhật, không đông cứng tại lúc hỏi (per D2); gốc trỏ một id không còn giải được trong bản chiếu degrade về không có neo (cùng khuôn dung sai id-treo đã có cho `parent`/`discoveredFrom` ở nơi khác trong schema này). Cộng thêm khóa `changedSinceAsk` — mảng `{field, from, to}` — CHỈ khi so ảnh chụp G3 (`parentSnapshotAtAsk`) với gốc hiện tại thấy khác trên `title` HOẶC `status` (so sánh chuỗi chính xác, không trim/normalize — cố ý, không phải thiếu sót); khóa này VẮNG MẶT hoàn toàn khi so ra không có gì đổi HOẶC khi item không mang G3 (item tạo trước tính năng này, hoặc gốc không giải được lúc `ask`) — hai trạng thái "đã so, không đổi" và "không có gì để so" không bao giờ lẫn vào nhau qua cùng một mảng rỗng đại diện cho cả hai (per D3). Bộ trường so sánh CHỈ gồm `title`/`status` — schema hôm nay chưa có trường `priority` (STR7, còn `proposed`, chưa xây) hay assignee/owner nào để so thêm; mở rộng bộ trường này khi trường mới đó thật sự tồn tại là follow-up tự nhiên, không phải khoảng hở của luật này. `list` không có item nào thuộc diện `awaiting-human`-có-`parent` thì không sinh khóa `awaitingContext` ở envelope — hành vi `list` với các repo/item không thuộc diện này y hệt trước khi tính năng này tồn tại (per D1 str61-chat-context-continuity / 14091e58, D2 / 19330e09, D3 / bce79d8a).
- **RUL48 (thử lại đúng một lần khi model trả lời được nhưng nội dung không đọc được; không bao giờ khi model lỗi thật).** Cả context-discovery và phán chia-việc phân biệt hai loại thất bại của lời gọi model: LỖI THẬT (không phản hồi được, hết giờ) không bao giờ được thử lại — rơi thẳng vào fail-safe hiện có ngay từ lần đầu; PHẢN HỒI THÀNH CÔNG nhưng nội dung không đọc được thành một verdict hợp lệ được thử lại đúng MỘT lần với một chỉ dẫn định dạng nghiêm ngặt hơn trước khi rơi vào cùng fail-safe đó. Thử lại không tạo ra một kết cục thứ ba nào: kết quả cuối vẫn chỉ là verdict hợp lệ (dùng nội dung của lần thử lại nếu lần đầu không đọc được) hoặc đúng fail-safe đã có từ trước tính năng này (chưa-đủ-rõ / không-hợp-lệ) — không có nhãn "model từ chối" hay trạng thái/verdict mới nào khác phát sinh. Một verdict đọc được nhưng không đạt hợp đồng nội dung của nó (vd verdict chia có con thiếu verify thật) không thuộc diện thử-lại này — nội dung đã đọc được, đây là thất bại hợp đồng, không phải thất bại định dạng (per str68 D1-D5 / 87536f3f).
- **RUL49 (Compound-learn — stage domain-hóa thứ tư của coding).** `coding` khai thêm một stage thứ tư, `compound-learn`, chèn SAU `executing` (cạnh chuyển-stage mới `executing → compound-learn`) và mapped vào bước Compound-learning của base-workflow (5 bước: Init/Làm-rõ/Chia-việc/Thực-thi/Compound-learning) — tổng hợp/học sau-thi-công nay là một stage quan sát-được, FSM-hóa, không còn là một phản xạ có thể bị bỏ sót lặng lẽ. `synthetic` không khai stage này — domain nào không mapped bước Compound-learning không bị chặn đóng bởi RUL50 (per D2 compound-learn-enduser-docs / 9c67c3d1).
- **RUL50 (Compound-learn gate cửa `done` — cả hai lối vào).** Một item của domain khai stage `compound-learn` (coding) KHÔNG thể tới `done` — qua CẢ HAI lối vào (`doing→done` thao tác tay, `proposed→done` duyệt đề xuất, RUL4) — nếu chưa đi qua stage đó; nỗ lực đóng bị từ chối `precondition` (mã 2), item ở nguyên trạng, không sự kiện nào ghi thêm. Gate này chạy SAU CAS/precondition sẵn có của `move`/`approve` — một kỳ vọng lệch (`--expect` cũ) vẫn báo `conflict` (mã 3) TRƯỚC khi gate này được xét, giữ đúng thứ tự "kỳ vọng lệch báo trước, thiếu điều kiện báo sau" đã có ở mọi cạnh khác. Domain không khai stage `compound-learn` (`synthetic`) đóng KHÔNG đổi — không bị gate này chạm tới. Bản ghi học câu-6 tự động lúc đóng (RUL21) không đổi, vẫn gắn trên cùng sự kiện đóng đó (per D3 compound-learn-enduser-docs / 9c67c3d1).
- **RUL51 (verb `compound` — cửa duy nhất mở lối vào Compound-learn).** `fgos compound <id>` là hành động CHỦ Ý duy nhất chuyển stage `executing → compound-learn` — không có đường tự-động nào khác (`return`/`approve` không tự advance qua nó, đúng ý RUL50: một auto-advance sẽ làm stage đó trống rỗng, đúng điều D3 cấm). Đòi item đang `status: proposed` (đã `return`/verify xanh) — item ở status khác bị từ chối `validation` (mã 4), không sự kiện nào ghi thêm (per D2/D3 compound-learn-enduser-docs / 9c67c3d1). Verb nhận thêm một cờ TÙY CHỌN `--doc-type <quadrant>` (bên sản xuất đầu tiên của nhãn Diataxis, per producer slice 3): khi có mặt, cùng lệnh `compound` vừa ghi một bản ghi outcome mang `docType` thật (qua bên ghi outcome sẵn có) NGAY TRƯỚC bước chuyển stage, vừa chuyển stage — nên một `--doc-type` sai (ngoài bốn quadrant) bị từ chối `validation` và KHÔNG để lại sự kiện chuyển-stage lơ lửng; khi VẮNG cờ, hành vi không đổi một byte (chỉ chuyển stage, không ghi outcome nào) — xem RUL52.
- **RUL52 (nhãn Diataxis `docType` — trường capture cộng-thêm, trực giao và tùy chọn).** Bản ghi capture của Compound-learn (outcome VÀ friction) mang thêm một trường TÙY CHỌN `docType` — nhãn phân loại tài liệu Diataxis theo chiều audience, đúng một trong bốn quadrant `tutorial`/`how-to`/`reference`/`explanation`. Chiều này TRỰC GIAO với type-axis kỹ sư (pattern/decision/failure): một chiều CỘNG THÊM, không thay thế (per D5). Kiểm hình dạng chỉ KHI có mặt — giá trị ngoài bốn quadrant bị từ chối `validation`; vắng mặt/`null` luôn hợp lệ (chưa gắn nhãn), không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (RUL nền của Data Dictionary #23). KHÔNG event type mới, KHÔNG đổi fold: trường đi ké payload thô của `work.outcome`/`work.friction` nên sống sót replay/rebuild qua chính spread-fold sẵn có, cơ chế không đổi một byte (per D6). `fgos check` hiển thị `docType` khi có mặt (trên khối outcome và trong record friction gần nhất); log chưa có nhãn nào giữ hình dạng đầu ra byte-for-byte như trước khi trường tồn tại. BÊN SẢN XUẤT nhãn nay đã tồn tại: cờ TÙY CHỌN `--doc-type <quadrant>` trên verb `compound` (RUL51) ghi một `docType` thật lên bản ghi outcome — nên `fgos check` hiển thị nhãn thật, không còn chỉ là khả năng. Cờ tái dùng đúng kiểm slice-2 (giá trị ngoài bốn quadrant bị từ chối `validation`); vắng cờ thì `compound` giữ hành vi cũ byte-for-byte. Lớp phán đoán tổng hợp cấp nhãn — kỹ năng `fgos-compounding` chạy ở stage `compound-learn` — nay cũng đã dựng: nó gom capture thật, phân loại quadrant, gọi `compound --doc-type`, rồi soạn tài liệu người-dùng-cuối đặt dưới `docs/<quadrant>/` có trích dẫn bằng chứng thật (per D5/D6 + producer/skill slice 3 compound-learn-enduser-docs / 6aa67ae4).

## Edge Cases Settled

- Tiêu đề unicode (tiếng Việt, CJK, emoji) đi qua toàn tuyến ghi-đọc-rebuild nguyên vẹn (test đầu-cuối).
- Kỳ vọng cũ dùng lại lần hai (double-apply) bị chặn ở `conflict`, nhật ký không phình (test đầu-cuối).
- Dòng cuối nhật ký đứt giữa chừng: phát hiện to và rõ, phần trước còn nguyên; đây là trường hợp DUY NHẤT được tha thứ khi đọc — hỏng giữa nhật ký là lỗi cứng.
- Nhiều tiến trình OS THẬT (fork) cùng gọi `appendEvent` trên một nhật ký đồng thời: mọi `seq` vẫn duy nhất, không trùng, không hở, tăng ngặt — `.fgos/events.lock` liên-tiến-trình tuần tự hóa chuỗi đọc-seq/append (per RUL10 bổ chú). Có test khóa fork nhiều tiến trình con thật, đồng bộ về một mốc khởi động chung để các đợt append thật sự chồng cửa sổ (mirror kỹ thuật spike ép-đua); một kiểm chứng vứt-đi cho thấy chính hình dạng đọc-rồi-append KHÔNG khóa va trùng nặng dưới cùng tải, nên test không rỗng-nghĩa.
- Hai tiến trình OS THẬT cùng gọi `addWork` trên CÙNG một id đồng thời: đúng một tiến trình thắng, phía thua nhận `validation` "already exists" thật (không crash/treo), nhật ký chỉ mang đúng MỘT sự kiện `work.add` cho id đó. Cùng kỹ thuật fork-đồng-bộ, cùng test khóa vứt-đi-nếu-thiếu-khóa (per RUL10 bổ chú 2, store-atomic-rmw) — chứng minh bằng cách tạm bỏ khóa (git stash bản vá) rồi chạy lại: cả 2/2 test race đỏ đúng như dự đoán (6/6 tiến trình đua cùng thắng thay vì 1/6), phục hồi bản vá thì cả hai xanh trở lại.
- Hai tiến trình OS THẬT cùng gọi `moveWork` với CÙNG `expectedStatus` trên CÙNG một id đồng thời: đúng một tiến trình thắng, phía thua nhận `conflict` CAS thật, nhật ký chỉ mang đúng MỘT sự kiện `work.move` khớp cạnh đó cho id đó (cùng kỹ thuật, cùng cell trên).
- Id trùng khi khai: từ chối, không sự kiện thừa.
- Cờ thiếu giá trị/rỗng ở `move` được phân loại `validation` (mã 4), không nhầm sang `precondition`/`conflict` — chốt từ review, có test khóa (phase-1-review-fixes).
- Nhật ký di sản (trước v2, thiếu tier/v) replay nguyên vẹn với default; nhật ký trộn cũ/mới cùng kết quả — test khóa bằng fixture sinh từ binary Phase 1 thật (`test/fixtures/phase1-events.jsonl`).
- View lệch-còn-tồn-tại (khác view mất): `rebuild` ghi đè toàn phần từ log, có test khóa đúng chế độ hỏng này; đọc không bao giờ tự sửa file view.
- Item được nhận rồi đóng ở hai thời điểm khác nhau (dự đoán lúc nhận, thực tế lúc đóng): cả hai nửa còn sống trong bản chiếu, không nửa nào bị mất — test khóa.
- Log không mang bản ghi outcome nào: bản chiếu không có key outcome (vắng mặt, không phải rỗng) — hành vi so-khớp bản chiếu cũ giữ nguyên (test tương thích ngược).
- Item `awaiting-human` không bao giờ vào tập việc-sẵn-sàng, và item có dep đang `awaiting-human` không được mở — cả hai có test khóa (không cần sửa bộ lọc frontier: bộ lọc `todo` sẵn có đã loại).
- Cạnh vào chờ thiếu câu hỏi / cạnh rời chờ thiếu câu trả lời bị chặn ở `validation` — cùng khuôn cạnh từ-chối `proposed→todo` thiếu lý do; câu hỏi/câu trả lời bị bỏ qua (không vào payload) trên mọi cạnh khác, hệt như `reason`.
- Log không mang sự kiện cổng nào: bản chiếu không có key bản-ghi-cổng (vắng mặt, không phải rỗng) — tương thích ngược, cùng khuôn bản ghi outcome.
- Item `awaiting-human` mà `parent` trỏ một id không giải được (gốc đã xóa/không tồn tại): `awaitingContext` cho item đó coi như không có gốc — không throw, không `changedSinceAsk`, cùng khuôn dung sai id-treo đã có cho `parent` ở nơi khác (RUL45).
- Item `awaiting-human` được park TRƯỚC khi tính năng `awaitingContext` tồn tại (không mang G3 trong bản ghi cổng): `list` vẫn hiện `parent` hiện tại của nó bình thường, nhưng không có khóa `changedSinceAsk` — im lặng đúng nghĩa "không có mốc để so", không phải "đã so và không đổi" (RUL45, D1).
- `answer` một item rồi `ask` lại đúng item đó lần hai: G3 của lần `ask` sau ghi đè hoàn toàn ảnh chụp gốc của lần trước, không gộp hai ảnh cũ/mới.
- Hai lần `submit` cùng một mô tả (cùng title suy ra): id lần hai tự khác id lần đầu — thử lại với hậu tố dài hơn cho tới khi hết trùng, cả hai item cùng tồn tại, không lỗi "id trùng".
- `submit` với mô tả không khớp từ khóa phân loại nào: vẫn tạo item thành công, `tier`/`risk` về mặc định `standard`, `kind` về mặc định `task` — không lỗi, không chặn.
- Context-discovery phán đủ rõ: item rời `clarify` vào stage `decompose` (không thẳng `executing`) MANG THEO verify thật trong đúng một sự kiện — không có khoảng hở nào item rời clarify mà verify còn placeholder giả; cạnh `clarify → executing` cũ vẫn hợp lệ trong bảng chuyển-stage nhưng không còn caller nào nhắm tới sau khi chia-việc chèn vào giữa (dormant, ghi nhận trung thực).
- Phán chia-việc trả verdict pass-through (item đơn giản, hoặc không có gì để chia): gốc chuyển thẳng `decompose → executing`, giữ nguyên verify đã có từ lúc rời clarify — không gắn lại verify lần hai.
- Phán chia-việc trả verdict chia (n≥1 con): mỗi con sinh qua đúng một cửa ghi, mang `parent` trỏ về gốc, `deps` nội bộ theo đề xuất mô hình, và verify THẬT của riêng nó; gốc chuyển `decompose → executing` ngay sau khi sinh đủ con nhưng KHÔNG lọt frontier cho tới khi mọi con `done` (chặn qua lineage, không qua deps).
- Sinh con giữa chừng bị crash (một vài con đã ghi, gốc chưa kịp chuyển stage): lượt quét sau phát hiện gốc đã có con mang `parent` trỏ về nó qua view hiện hành, không sinh thêm con trùng — chỉ hoàn tất việc chuyển stage gốc còn dang dở (re-entrancy an toàn, không đẻ đôi con).
- Phán chia-việc trả verdict cần người quyết (tự báo mơ hồ) hoặc gốc mang risk `heavy`: gốc đậu `awaiting-human` mang đề xuất chia (danh sách con + deps đề xuất) làm câu hỏi — chưa ghi con nào vào queue; người trả lời xong, gốc về `todo` ở stage `decompose`, lượt quét sau phán lại từ đầu.
- Phán chia-việc lỗi/timeout/verdict không đọc được, HOẶC bất kỳ con nào trong verdict chia thiếu verify thật: verdict bị coi là không hợp lệ toàn bộ — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không pass-through ngầm; lượt quét sau thử lại (fail-safe, không bao giờ throw).
- Model trả lời thành công nhưng nội dung không đọc được thành verdict (context-discovery hoặc phán chia-việc): phán thử lại đúng một lần với chỉ dẫn định dạng nghiêm ngặt hơn trước khi rơi vào fail-safe; thử lại đọc được thì dùng ngay, thử lại cũng không đọc được mới rơi fail-safe. Model lỗi/timeout thật (không trả lời được) không bao giờ thử lại — rơi fail-safe ngay từ lần đầu, không có kết cục thứ ba nào phát sinh (RUL48).
- Gốc có ≥1 hậu duệ dang dở (chưa `done`): gốc không bao giờ được runner dispatch dù chính gốc đang `todo` ở stage `executing` — bộ lọc frontier chặn qua chuỗi `parent`, không qua `deps`; khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt frontier ở lượt quét kế tiếp mà không cần thao tác tay nào, rồi tự chứng minh bằng verify của chính nó.
- Một con bị `blocked`/đỗ giữa chừng không sinh trạng thái "bộ khẩn" mới: nó đi qua đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn dispatch cho tới khi con đó thật sự `done`.
- Item đơn giản đi qua quét làm-rõ rồi quét chia-việc trong CÙNG một lượt chạy `--once`: cả hai ngã-ngũ (clarify-pass rồi pass-through) hoàn tất trước khi vòng dispatch thi công của lượt đó bắt đầu — không cần đợi lượt sau.
- Context-discovery phán chưa đủ rõ nhiều lần liên tiếp trên cùng item (người trả lời rồi vẫn chưa đủ): mỗi lần phán một bản ghi discovery riêng, tất cả còn sống — không lần nào bị mất; vòng lặp không có trần cố định (con người luôn là bên gate mỗi lượt lặp).
- Model gọi cho context-discovery lỗi/timeout/trả lời không đọc được: KHÔNG BAO GIỜ crash vòng tự hành hay lệnh `discover` — luôn rơi về "chưa đủ rõ" với câu hỏi mặc định cố định, item vẫn actionable (ở `awaiting-human`, không kẹt vô hình).
- Item tạo qua `add` không mang field `stage`: đọc ra `executing` (mặc định lazy), xuất hiện trong `ready` ngay như hôm nay — hành vi `add`/legacy không đổi một byte.
- Nhật ký di sản thật đã có sẵn một ngã-ngũ đóng (`→done`) từ trước khi khái niệm phiên bản schema tồn tại: replay KHÔNG tự sinh bản ghi settlement cho nó — bản chiếu lịch sử giữ nguyên byte-for-byte (test khóa bằng fixture nhật ký Phase 1 thật).
- Item đóng mà chưa từng chạy, chưa từng thất bại, chưa từng qua ngã-ngũ nào khác vẫn nhận đúng một bản ghi học tối thiểu — không rỗng-im-lặng, không lỗi.
- Soạn bài học lúc đóng gặp dữ liệu bất thường: transition đóng vẫn thành công (item vẫn thành `done`), chỉ bản ghi học của lần đó bị bỏ qua — chưa từng làm hỏng một lần đóng item nào.
- `take` không truyền `--id`: cầm đúng đầu frontier, mặc định `actor=human`, ghi `headAtTake` và nửa dự đoán — chứng minh qua CLI thật. `take --id` một item đã bị cầm rơi thẳng xuống CAS của `move`, báo `conflict` thật (mã 3), không phải một thông điệp validation trùng lặp.
- `return` từ chối sạch khi working tree bẩn, hoặc khi HEAD chưa tiến so `headAtTake` (kể cả tree sạch nhưng zero tiến bộ thật) — cả hai `validation`, item giữ nguyên `doing`, không sự kiện nào ghi thêm.
- `return` verify xanh: `doing → proposed` + nửa thực tế, KHÔNG sinh settlement (settlement thuộc cạnh `→done`, D4). `return` verify đỏ: `doing → blocked` (lý do `verify-fail`) + nửa thực tế + một bản ghi friction lớp `verification` — mirror đúng đường đỗ của runner.
- `return` trên một item claim bởi runner (`claimActor: 'runner'`, không `headAtTake`) bị từ chối `validation` — cửa pull không đụng vào claim của runner.
- Một `fgos-runner --once` chạy song song khi một người đang cầm item qua `take`: gặt-lại lúc khởi động của runner KHÔNG BAO GIỜ giẫm claim đó (claim người cầm vô thời hạn) — chứng minh bằng e2e qua binary thật, chạy runner song song trước khi người `return` (xem spec Runner "Gặt-lại lúc khởi động").
- Cạnh `proposed→blocked` thiếu `reason` bị từ chối `validation`, cùng khuôn `proposed→todo` — test khóa (per pr-lifecycle D3).
- `return` verify xanh ghi `headAtReturn` lên đúng sự kiện `doing→proposed`; fold đọc lại được qua rebuild (mẫu `headAtTake`), vắng mặt cho một đề xuất của runner (không qua `return`) — test khóa (per pr-lifecycle D1).
- Reject/park mang `reason`: giá trị fold lên `item.reason`, đọc lại được qua rebuild (mẫu `claimActor`/`headAtTake`); một lần fold sau GHI ĐÈ lần trước (latest-wins, không cộng thêm) — test khóa cả hai chiều (per worker-execution STR33 / 396d9d9e).
- `take` trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua `blocked→doing`, ghi `branchHeadAtTake` (không `headAtTake`) — chứng minh qua CLI thật; `take` trên một item `blocked` KHÔNG mang nhánh sống vẫn xung đột như trước (không đường mới nào mở toang `blocked→doing`).
- `return` nguồn-nhánh (item mang `branchHeadAtTake`): đo trên nhánh KHÔNG đụng working tree host repo — verify chạy trong worktree tạm detached tại SHA nhánh, dọn trong `finally` dù thành công hay thất bại; verify xanh + có commit mới → `proposed` mang `branchHeadAtReturn`, KHÔNG BAO GIỜ mang `headAtReturn` — test khóa cả hai chiều (mutual exclusion) (per D2 human-rounds / 5a6900b2, xem spec Runner RUL30 (runner)).
- `return` nguồn-nhánh khi nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, item giữ `doing`, không sự kiện nào ghi thêm, tip nhánh không đổi — chứng minh bằng test thật.
- `fold` của `branchHeadAtTake`/`branchHeadAtReturn` qua rebuild: chỉ fold trên đúng cạnh của nó (`blocked→doing`/`doing→proposed`), không bao giờ lẫn với `headAtTake`/`headAtReturn` của cùng item hay của item khác — test khóa (write-side allowlist trong `store.mjs` + read-side fold trong `replay.mjs` đều được kiểm, đây là lỗ CRITICAL mà bee-validating từng gắn cờ trước khi cell dựng thật).
- Item mang `domain` lạ (không khớp sổ đăng ký) tới điểm đọc nóng (bộ lọc frontier, vòng tự hành, bảng chuyển-stage): rơi về `coding` kèm một cảnh báo, không crash vòng tự hành — test khóa.
- Item vắng `domain` (100% item hôm nay): mọi hành vi dispatch/chuyển-stage y hệt trước khi tính năng domain tồn tại — test khóa qua toàn bộ suite hiện có, không sửa một assertion nào (retrofit D2 base-workflow-model).
- Item domain `coding` đang `executing` (hoặc `doing`/`proposed` mà chưa từng qua `compound`) bị đóng qua cả `move --to done` (tay) và `approve` (duyệt đề xuất): cả hai lối vào bị từ chối `precondition`, item ở nguyên trạng thái/stage hiện tại, không sự kiện nào ghi thêm — không có đường lách nào giữa hai lối vào (per D3 compound-learn-enduser-docs / 9c67c3d1).
- Item domain `synthetic` (không khai stage `compound-learn`) đóng qua `move --to done`: không bị gate mới chạm tới, đóng y hệt hành vi trước quyết định này — test khóa (per D2/D3 compound-learn-enduser-docs / 9c67c3d1).
- Đóng một item mang `--expect` (kỳ vọng) đã lệch VÀ chưa qua `compound-learn`: báo `conflict` (mã 3) từ CAS sẵn có, KHÔNG BAO GIỜ báo `precondition` của gate compound-learn trước — thứ tự "kỳ vọng lệch báo trước" giữ nguyên dù có thêm gate mới (per D3 compound-learn-enduser-docs / 9c67c3d1, xem RUL50).
- `fgos compound <id>` gọi trên một item đang `todo`/`doing`/`blocked`/`awaiting-human`/`done` (không phải `proposed`): từ chối `validation` (mã 4), không sự kiện nào ghi thêm; gọi đúng lúc item `proposed` chuyển sạch `executing → compound-learn` (per D2/D3 compound-learn-enduser-docs / 9c67c3d1).

## Open Gaps

- Bản ghi thực tế (outcome) chưa có trường "thời lượng chạy" — nếu cần, đây là một mở rộng schema cộng thêm mới, chưa quyết (nêu lúc validate slice 1 của phase-3-compound-learning).
- Cổng có-phân-loại (typed gates: need-review / need-approval) — vẫn cố ý gộp về một `awaiting-human` chung; thêm nhãn loại chỉ khi có consumer thật cần (per D3, deferred). Riêng nhu cầu "cần làm rõ trước khi thi công" đã giải qua chiều `stage` (clarify/decompose/executing) thay vì một loại cổng mới — xem "Giai đoạn Làm-rõ" và "Giai đoạn Chia-việc".
- Timeout / nhắc-nhở / đánh-thức khi người vắng lâu — cố ý không làm; đậu vô thời hạn (per D4, deferred).
- Phân quyền / nhiều người / giao việc: ai được trả lời cổng nào — chưa mô hình hóa (deferred).
- Orchestrator service tầng fleet (registry/heartbeat/push assignment/lease, giao thức+auth cho worker từ xa) — không thuộc cửa pull take/return đã dựng, đắp sau trên cùng nhật ký sự kiện chỉ khi cần fleet worker (deferred, per D1 stage-decompose).
- Rollup view theo bộ (tổng hợp trạng thái mọi hậu duệ của một gốc trong một màn hình) — STR24, chưa làm (deferred).
- Trong một project mà bee đang nghỉ (phase terminal), guard hiện tại của bee chặn ghi trực tiếp vào `.fgos/` (cổng idle-intake theo-phase, allowlist tĩnh không biết territory manifest) VÀ vào worktree tmpdir (containment phi-phase, không quan tâm phase) — hai cơ chế độc lập, không nhắm riêng fgos; luồng qua verb CLI `fgos <verb>` (Bash) không bị chặn bởi cả hai. Gap thuộc cây bee, không sửa trong feature này; friction đã file (`.bee/backlog.jsonl`, severity P2) làm địa chỉ flip khi bee sửa (per install-coexistence D7 / 8788e9bb; canary pin sự thật này — `docs/coexistence.md` Known Gaps, `docs/history/install-coexistence/reports/canary-run.md`).
- Ngữ cảnh phán context-discovery (xem "Giai đoạn Làm-rõ" trên) chỉ mang cặp hỏi-đáp MỚI NHẤT của một item — bản ghi cổng gộp-mới-nhất, không giữ một lịch sử đầy đủ mọi vòng hỏi-đáp trước đó; nếu một vòng làm-rõ nhiều bước cần nhìn lại toàn bộ chuỗi hỏi-đáp, đó là mở rộng sau (per discovery-context STR30 / cfae0120, chấp nhận cho CoS hiện tại — accepted trade-off, không phải bug).
- Domain thứ hai thật SẢN XUẤT (vd marketing, chạy trên vòng thi công thật `runner/dispatch.mjs`, không chỉ minh họa) — S1+S2 (base-workflow-model) đã dựng sổ đăng ký, retrofit domain `coding`, VÀ thêm domain `synthetic` minh họa chạy hết cửa CLI (`add`/`submit --domain`) thật; domain thứ hai mang giá trị sản xuất thật (nhiều stage, gắn quy trình riêng ngoài `coding`) vẫn là backlog STR18 tiếp tục (per D4 base-workflow-model / 2ae492d8).
- `repair` (ghi-đè-cả-file) KHÔNG lấy `.fgos/events.lock` — chỉ chạy khi không có tiến trình fgos nào đang sống; một `appendEvent` chen vào giữa lúc repair đọc và ghi-đè sẽ bị nuốt. Ghi nhận yêu cầu, không cưỡng chế (per fgos-multi-session-checkout Epic 3 / STR35; xem entry point `repair`).
- Lối tổng hợp Compound-learn nay đã đóng vòng đầu-cuối: `compound --doc-type` ghi `docType` thật (RUL51/52), kỹ năng `fgos-compounding` phân loại quadrant và soạn tài liệu người-dùng-cuối, và một tài liệu how-to thật đầu tiên đã được sinh có trích dẫn bằng chứng từ capture thật (per D4-D8 compound-learn-enduser-docs). Còn mở: (a) bề rộng sản xuất tài liệu — mới một tài liệu/một quadrant được chứng minh, chưa phủ cả bốn quadrant hay tự-động-hóa sinh hàng loạt; (b) kỹ năng `fgos-scribing` (đồng bộ BA-spec ở stage tổng hợp) được HOÃN có chủ ý slice này — chỉ dựng khi một stage spec-sync thật được nối (Agent's Discretion, CONTEXT D4).

**Đã đóng:** dư lượng CAS verb-tương-tác-vs-verb-tương-tác (per fgos-multi-session-checkout Epic 3 / STR35) — từng liệt ở đây, nay đã sửa (xem RUL10 bổ chú 2 ở trên và `docs/history/store-atomic-rmw/`).

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `bin/fgos.mjs` — CLI một cửa, bảng EXIT_CODES, resolve `.fgos/` từ cwd; verb `rollup <id>` (STR24) — đọc thuần qua `listWork`, không cửa ghi mới: not-found báo `validation` cùng khuôn `review`/`approve`; đếm con TRỰC TIẾP qua `Object.values(view.work).filter(w => w.parent === id)` (KHÔNG đệ quy đa tầng như `frontier.mjs`'s `hasOpenDescendant` — job khác nhau, gate frontier vs báo tiến độ, và decompose STR16 hiện chỉ sinh một tầng con); verb `triage` (STR21) — đọc thuần qua `listWork` + `rankImpact` (`src/state/impact.mjs`), formatter riêng `formatTriage` (không tái dùng `formatCandidateList`/`formatRollup` — hình dạng dòng khác)
- `src/state/impact.mjs` — backlog-triage impact ranking (STR21): thuần (`rankImpact(view)`), không fs/Date.now/mutation, cùng kỷ luật với `src/evolve/candidates.mjs`. `blocks` của một item = số item KHÁC chưa `done` đang liệt kê id đó trong `deps`; item `done` không được xếp hạng và không được đếm ở phía đếm; sắp xếp `blocks` giảm dần rồi id tăng dần (tie-break). Đây là proxy tác động dẫn xuất từ `deps` sẵn có — KHÔNG phải trường `priority`/`impact` mới trên schema work.mjs (đó là phạm vi STR7/STR8, còn `proposed`). Manifest layer: domain.
- `src/state/store.mjs` — chủ ghi duy nhất (append event → update view); facade lỗi: EXIT_CODES + categoryOf + re-export 4 error class; STATUSES sống ở work.mjs (fsm re-export); `addWork`/`editWork`/`moveWork`/`moveStage` mỗi cửa bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`) trong một phiên giữ `.fgos/events.lock` (qua `withEventsLock`/`appendEventLocked` của `events.mjs`) — hai verb tương tác song song trên CÙNG id không còn cùng qua tiền-kiểm cũ rồi cùng ghi hai sự kiện mâu thuẫn (per RUL10 bổ chú 2, store-atomic-rmw); `refreshView` vẫn chạy sau khi khóa nhả, không đổi; `addOutcome` — cửa ghi outcome (mẫu `addDecision`), gọi trực tiếp từ runner (không qua verb CLI); `addFriction` — cửa ghi friction (mẫu giống `addOutcome`), cũng gọi trực tiếp từ runner; `moveWork` chuyển tiếp `ask`/`answer` cho `transitionWork`, GẮN `actor` vào payload SAU khi transition thuần trả về (không truyền vào transitionWork — payload bị rebuild sẽ nuốt mất), và khi `to==='done'` compose bài học câu-6 (`composeLearning`, thuần, try/catch best-effort) từ view TRƯỚC transition + settlement đóng sắp sinh, gắn additive vào CÙNG event `work.move`; `putInAwaiting`/`answerAwaiting` — hai verb mỏng đưa-vào-chờ / trả-lời (append event chuyển-trạng-thái mang câu hỏi/câu trả lời rồi refresh view); `moveStage` — cửa ghi đổi-stage (mẫu `moveWork`, một tầng phía trên), chuyển tiếp `transitionStage`, cùng cách gắn `actor` post-transition; `addDiscovery` — cửa ghi bản ghi discovery (mẫu `addFriction`); `moveWork` nhận thêm một tham số cộng-thêm tùy chọn `headAtTake` (gắn post-transition, cùng cách gắn `actor` — không đưa vào `transitionWork`), để cửa pull `take` cõng HEAD của host repo lên sự kiện claim; mọi lời gọi khác (runner, `add`/`move`/`ask`/`answer`) không bao giờ truyền tham số này nên nó luôn `undefined`, no-op, tương thích ngược tuyệt đối; cùng khuôn, `moveWork` nhận thêm `headAtReturn` (per pr-lifecycle D1 / 1359ab5e) — CHỈ cửa pull `return` truyền, gắn post-transition trên cạnh `doing→proposed`; cùng khuôn thêm lần nữa, `moveWork` nhận `branchHeadAtTake`/`branchHeadAtReturn` (per D2 human-rounds / 5a6900b2) — CHỈ cửa pull `take`/`return` nguồn-nhánh truyền, gắn post-transition trên đúng cạnh `blocked→doing`/`doing→proposed` tương ứng; đây là fix write-side allowlist mà bee-validating gắn cờ CRITICAL trước khi cell dựng thật — thiếu nó, hai field mới bị `moveWork` âm thầm nuốt mất trước khi sự kiện tới `appendEvent`
- `src/state/events.mjs` — append/read JSONL `.fgos/events.jsonl` (seq + ts ISO, path tường minh), phát hiện corrupt tail; `appendEvent` bọc chuỗi đọc-seq/tính/append trong một `.fgos/events.lock` liên-tiến-trình (khóa dẫn xuất từ `path.dirname(logPath)` nên một log-dir khác — vd `porting-store.mjs` — tự có khóa riêng), chính sách CHẶN-có-timeout mirror `acquireSessionsLock` (một thể hiện thứ ba độc lập, KHÔNG import từ `loop.mjs`/`session.mjs`, giữ module zero-dep), timeout/retry cỡ đường-nóng (2s/10ms — không sao chép mù mốc 10s cỡ vòng-đời-phiên của `acquireSessionsLock`), giải phóng trong `finally` mọi lối ra, hết giờ → `EventLogError('lock-timeout')` (phạm trù MỚI); `repairTruncatedLastLine` CỐ Ý không lấy khóa này (xem yêu cầu KHÔNG-tiến-trình-song-song ở entry point `repair`); xuất thêm `withEventsLock(logPath, fn)` (giữ khóa qua `fn`, để một caller có tiền-kiểm riêng — vd `store.mjs` — bọc TRỌN chuỗi đọc-kiểm-ghi thành một phiên giữ khóa) và `appendEventLocked` (lõi đọc-seq/tính/append KHÔNG tự khóa, dùng khi khóa đã đang giữ; `appendEvent` công khai nay chỉ là `withEventsLock` bọc quanh lõi này, hành vi công khai không đổi cho mọi caller cũ) — per store-atomic-rmw; RUL10
- `src/state/fsm.mjs` — bảng TRANSITIONS + precondition + CAS, thuần (chiều `status`, KHÔNG đổi bởi stage-clarify); cạnh `todo/doing→awaiting-human` bắt buộc `ask`, cạnh `awaiting-human→todo` bắt buộc `answer` (cùng cơ chế `reason`-trên-`proposed→todo`), giá trị trim vào `payload.ask`/`payload.answer`; cạnh `proposed→blocked` (per pr-lifecycle D3 / 1359ab5e) bắt buộc `reason`, cùng cơ chế enforce với `proposed→todo`; cạnh `blocked→proposed` (per D18 fan-out-parallel / 2e92b7a5) KHÔNG bắt buộc `reason` — mirror khuôn cơ học của `blocked→todo`/`blocked→doing`, không phải khuôn bắt-buộc-lý-do
- `src/state/stage.mjs` — bảng chuyển-stage + precondition + CAS, thuần, mẫu hệt `fsm.mjs` một tầng phía trên (chiều `stage`); cạnh hợp lệ hôm nay: `clarify → decompose`, `decompose → executing`; cạnh `clarify → executing` cũ vẫn còn trong bảng (hợp lệ, log di sản đọc lại đúng) nhưng không caller nào nhắm tới nữa — dormant, chưa gỡ (quyết theo bằng chứng grep, xem `docs/history/stage-decompose/`); `expectedStage` CAS chống đua giữa phiên sống và vòng tự hành cùng phán một item; `transitionStage` tra cạnh chuyển-stage hợp lệ từ sổ đăng ký `domains.mjs` theo domain của item (thay hằng `STAGE_TRANSITIONS` phẳng cũ) — hành vi domain `coding` không đổi một byte (per base-workflow-model D2/D3)
- `src/state/work.mjs` — schema + validate (ID_PATTERN kebab-case); STATUSES gồm `awaiting-human`; STAGES = `clarify`/`decompose`/`executing`, field `stage` optional (đọc lazy `?? 'executing'` khi vắng mặt, không có trong DEFAULTS); field `parent` optional (lineage, validate string non-self-referencing, không đòi tồn tại — additive, không có trong DEFAULTS); field `domain` optional (đọc lazy `?? 'coding'` khi vắng mặt, không có trong DEFAULTS, cùng khuôn `stage`); `validateWork`'s enum-check cho `stage` tra sổ đăng ký `domains.mjs` theo domain của item (thay hằng `STAGES` phẳng cũ) — hành vi domain `coding` không đổi một byte
- `src/state/domains.mjs` — sổ đăng ký domain (kernel layer — `work.mjs` cũng kernel và phải import module này theo RUL35/D3; đặt module này ở layer `domain` sẽ tạo import ngược theo kiểm chiều-một-chiều-xuống của `test/architecture.test.mjs`): `DOMAINS` (frozen, hôm nay đúng một entry `coding` — stage list/step-mapping/cạnh-chuyển byte-for-byte giá trị cũ của `work.mjs`/`stage.mjs`); `resolveDomainName`/`getDomain` — fail-safe, không bao giờ throw, dùng bởi `frontier.mjs`/`loop.mjs`/`stage.mjs`; `stageForStep` — tra stage theo bước base-workflow
- `src/state/replay.mjs` — fold events → view, thuần; case `work.outcome` gộp theo id vào `view.outcomes` (key lazy, cộng thêm không đè); case `work.friction` APPEND theo id vào `view.frictions` (key lazy, mảng — mỗi record một lần xảy ra, không gộp/không đè); case `work.move` mang `ask`/`answer` gộp theo id vào `view.gates` (key lazy có bảo vệ, cộng thêm không đè); case `work.move` mang `answer` hoặc `to==='done'` (VÀ sự kiện mang phiên bản schema — bảo vệ nhật ký di sản thật) APPEND một bản ghi settlement theo id vào `view.settlements` (key lazy, mảng, kind answer/close); case `work.move` với `to==='done'` mang thêm `learning` APPEND theo id vào `view.learnings` (key lazy, mảng); case `work.add` fold thêm `item.parent` khi payload mang (additive, key lazy); case `work.stage` set `item.stage` (và `item.verify` khi payload mang verify — một sự kiện làm cả hai) và, khi RỜI clarify (guard `from === 'clarify'`, không phải đích cụ thể — chốt tại validating để retarget đích không làm câm settlement), APPEND một bản ghi settlement kind clarify-pass vào `view.settlements`; case `work.discovery` APPEND theo id vào `view.discovery` (key lazy, mảng, cùng khuôn `view.frictions`); case `work.move` đích `doing` fold thêm `actor` payload thành `item.claimActor` và `headAtTake` payload thành `item.headAtTake` khi sự kiện mang chúng (additive, lazy — đây là cách `return`/gặt-lại của runner phân biệt claim của cửa pull với claim của runner, xem "Cửa pull giao–nhận việc" trên và spec Runner), cộng thêm `branchHeadAtTake` payload thành `item.branchHeadAtTake` trên CÙNG cạnh khi sự kiện mang nó (nguồn-nhánh, RUL34); case `work.move` đích `proposed` fold thêm `branchHeadAtReturn` payload thành `item.branchHeadAtReturn` khi sự kiện mang nó (mirror `headAtReturn` ở trên nhưng field riêng, không bao giờ cùng mặt trên một item, RUL34); case `work.move` mang `reason` (bất kỳ đích nào, không chỉ `proposed→todo`/`proposed→blocked`) fold thành `item.reason` — GHI ĐÈ mỗi lần (latest-wins, khác khuôn cộng-thêm-không-đè của outcome/friction/settlement/discovery ở trên, per worker-execution STR33 / 396d9d9e, xem RUL32 và spec Runner RUL23 (runner))
- `src/state/dep-graph.mjs` — dò chu trình đồ thị cạnh-định-kiểu (per work-graph-intelligence S1 + S2a): thuần (không fs/mutation, chỉ import `WorkValidationError` từ `work.mjs` — Domain→Kernel, không import `store.mjs`). **S1 (deps-only):** `findDepCycle(workMap)` → đường chu trình hoặc `null` (DFS + recursion-stack), `assertNoCycle(candidate, workMap)` throw `WorkValidationError` single-arg (message "would close a dependency cycle") khi khép vòng `deps`. **S2a (đồ thị hợp nhất):** `buildUnifiedEdges`/`findUnifiedCycle`/`assertNoUnifiedCycle` chiếu `deps`→cạnh `blocks` và `parent`→cạnh `parent-child` (hướng cha→con) rồi dò chu trình trên tập cạnh chặn hợp nhất; thông điệp lỗi phân biệt "would close a graph cycle" cho chu trình có `parent`, giữ "dependency cycle" cho chu trình `deps` thuần. Gọi tại cả hai site cửa ghi `store.mjs` NGAY SAU `validateWork`, THEO THỨ TỰ: `assertNoCycle` (deps-only, giữ thông điệp S1) rồi `assertNoUnifiedCycle` (phủ toàn đồ thị) trong cả `addWork` và `editWork`. Manifest layer: domain (governance tag). Chu trình `deps` nhiều-nút chỉ phát sinh qua `editWork`; chu trình `parent-child`/trộn phát sinh qua `addWork` (id `parent` không kiểm tồn tại → cha tiến; chu trình khép khi cạnh còn lại được ghi) hoặc `editWork` `deps`
- `src/state/frontier.mjs` — bộ lọc `status === 'todo'` (đã loại `awaiting-human`) VÀ item đang ở stage cuối (bước Thực-thi) theo sổ đăng ký `domains.mjs` của domain item đó (thay so-sánh phẳng `stage ?? 'executing' === 'executing'` cũ — domain `coding` vẫn resolve đúng `executing`, hành vi không đổi một byte) VÀ, dẫn xuất thuần từ `parent` (đệ quy qua chuỗi hậu duệ, KHÔNG đụng `deps`), loại một gốc khi bất kỳ hậu duệ nào của nó chưa `done` khỏi ready set
- `src/intake/judge-executor.mjs` — shared retry-once helper (str68 D1/D5 / 87536f3f) used by both `judgeDiscovery` and `judgeDecompose`: `runJudgeExecutor(cfg, model, prompt, stricterPrompt)` spawns via `resolveExecutorCommand` (`dispatch.mjs`); a non-parse failure (`result.error || result.status !== 0`) returns `null` immediately, no retry; a parse-shaped failure (`JSON.parse` throws, or parses to a non-object) retries exactly once with `stricterPrompt`, same spawn options/timeout per attempt; returns the parsed-but-unvalidated verdict object on either attempt's success, or `null` after both attempts/any retry failure — callers apply their own existing field validation to whichever they get. `JUDGE_STRICT_JSON_SUFFIX` — the Vietnamese "raw JSON only" suffix appended to build each caller's `stricterPrompt`.
- `src/intake/discovery.mjs` — Use-case: `judgeDiscovery(work, cfg, view)` (gọi model thật qua `runJudgeExecutor` — spawn + retry-once, RUL48 — với `modelForTier` của `dispatch.mjs` chọn model trước; fail-safe try/catch bao trọn mọi lỗi resolve-tier/spawn/timeout/parse về `{clear:false, question:...}` mặc định, không bao giờ throw); `view` là tham số TÙY CHỌN (per discovery-context STR30 / cfae0120) — `resolveDiscovery` truyền view nó đã đọc sẵn (không đọc thêm lần nào); `buildDiscoveryPrompt(work, view)` dùng `work.description`, `view.gates[id]` (cặp hỏi-đáp MỚI NHẤT) và `view.discovery[id]` (mọi verdict trước) để dựng phần ngữ cảnh bổ sung của prompt — thiếu `view` (lời gọi 2-tham-số cũ, vd unit test) degrade từng phần về placeholder "(không có)", không throw; `resolveDiscovery` — hàm chung DUY NHẤT cho cả verb `discover` và vòng tự hành: đọc item, gọi judgeDiscovery, ghi bản ghi discovery LUÔN, rồi `moveStage`(đủ rõ → **`decompose`**, kèm verify thật)hoặc `putInAwaiting`(chưa đủ rõ, kèm câu hỏi)
- `src/intake/decompose.mjs` — Use-case tầng sau discovery: `judgeDecompose` (gọi model thật qua `runJudgeExecutor`, cùng executor/retry/fail-safe pattern với `judgeDiscovery`, RUL48 — mọi lỗi resolve-tier/spawn/timeout/parse-sau-thử-lại → verdict không hợp lệ mặc định, không bao giờ throw); `resolveDecompose` — hàm chung cho cả verb `discover` (khi item ở stage `decompose`) và vòng tự hành: đọc item, gọi judgeDecompose, rồi một trong bốn nhánh — pass-through (`moveStage` decompose→executing, giữ verify cũ), chia (ghi n con qua `addWork` — `parent`/`deps`/verify thật từng con, id con sinh vị trí `<id-gốc>-<n>` không qua `generateId` per id-systems-audit.md #1 — rồi `moveStage` gốc; re-entrancy: view đã có con mang `parent` trỏ về gốc thì không sinh thêm, chỉ hoàn tất chuyển stage gốc), cần-người (`putInAwaiting` mang đề xuất chia làm câu hỏi, gate risk `heavy` đọc từ `item.risk`), hoặc không hợp lệ (không ghi gì, item ở nguyên cho lượt quét sau)
- `bin/fgos.mjs` — verb `check`: đọc `listWork(dir).outcomes`, in predicted-vs-actual; cộng thêm mục friction (đọc `view.frictions`, đếm theo lớp + cap 5 record gần nhất), mục settlement (đọc `view.settlements`, đếm theo kind+actor + cap 5), mục học (đọc `view.learnings`, cap 5), và nhắc item trạng thái cuối thiếu outcome — tất cả read-only, không sự kiện mới; tín hiệu entropy-trend + seal-digest trên cùng `check` — xem spec Runner; verb `ask`/`answer` gọi `putInAwaiting`/`answerAwaiting`; `list` mang `view.gates` (câu hỏi hiện ra không cần formatter mới) và trường `parent` khi item mang (đã đi qua `listWork`'s full-object dump, không cần formatter mới); verb `submit` — gọi `classify.mjs` (deriveTitle/classify/generateId) + `envelope.mjs` (wrapEnvelope) rồi `addWork` sẵn có, KHÔNG cửa ghi mới, gắn `stage:'clarify'`; verb `discover` — dispatch theo `item.stage` hiện tại: gọi `resolveDiscovery` (stage clarify) hoặc `resolveDecompose` (stage decompose), cùng `actor:'session'`; verb `take` — cầm đầu frontier (`readyWork`) hoặc một `--id` cùng tập, CAS `todo→doing` qua `moveWork` mang `actor`+`headAtTake` (`currentHead` của host repo), ghi outcome dự đoán qua `addOutcome`; item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) rẽ nhánh RIÊNG trước nhánh main-based: CAS `blocked→doing` qua `moveWork` mang `branchHeadAtTake` (`git rev-parse` trên chính nhánh, không phải host repo) thay vì `headAtTake`; verb `return` — kiểm `item.branchHeadAtTake` TRƯỚC mọi guard main-based (nguồn-nhánh không mang `headAtTake` nên kiểm main trước sẽ từ chối oan) — nếu có: đo số commit mới trên nhánh qua `commitsSince`, verify chạy qua `runGoalCheck` trong một worktree tạm DETACHED tại SHA nhánh (`git worktree add --detach`, dọn bằng `git worktree remove --force` trong `finally`, best-effort) — không đụng working tree host repo; xanh + có commit mới → `moveWork` `doing→proposed` mang `branchHeadAtReturn` (KHÔNG BAO GIỜ `headAtReturn`); không đủ điều kiện → từ chối rõ lý do hoặc `moveWork` `doing→blocked` (`reason:'verify-fail'`) + `addFriction`. Đường main-based cũ (không `branchHeadAtTake`) không đổi: TỰ CHẠY `verify` của item qua `runGoalCheck` (`src/runner/goal-check.mjs`, module dùng chung với runner — xem spec Runner) sau khi tự kiểm `isWorkingTreeClean`/`commitsSince` so `headAtTake`; xanh → `moveWork` `doing→proposed` mang thêm `headAtReturn` (`currentHead`, per pr-lifecycle D1) + `addOutcome` thực tế; đỏ → `moveWork` `doing→blocked` (`reason:'verify-fail'`) + `addOutcome` thực tế + `addFriction` lớp `verification`; verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của một cửa duyệt cho mọi đề xuất `proposed`; cơ chế merge/verify đầy đủ sống ở `src/runner/merge.mjs` (xem spec Runner "Cổng duyệt PR nội bộ" cho hợp đồng đầy đủ)
- `src/runner/loop.mjs` — `runOnce`: NGAY SAU startupReap, TRƯỚC vòng dispatch executing: (1) quét mọi item `stage==='clarify' && status==='todo'` và gọi `resolveDiscovery` — lưới đỡ RUL19; (2) NGAY SAU đó, đọc lại view TƯƠI rồi quét mọi item `stage==='decompose' && status==='todo'` và gọi `resolveDecompose` — cùng lưới đỡ, cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời clarify; không đọc `item.mode` ở cả hai sweep; mọi `moveWork` runner tự ghi (claim/propose/park) gọi kèm `actor:'runner'`; cả hai sweep gọi `resolveDiscovery`/`resolveDecompose(..., 'runner')`
- `src/intake/classify.mjs` — thuần, không import store.mjs: `deriveTitle` (cắt câu/dòng đầu hoặc N ký tự), `classify` (bảng từ khóa → tier/kind/risk, mặc định standard/task khi không khớp), `generateId` (tiền tố cố định `tsk-` + hậu tố hash base36 adaptive 3-8 ký tự, thử lại khi trùng — không còn chứa slug title, per id-systems-audit.md #1, work-id-tsk-hash)
- `src/state/envelope.mjs` — thuần: `wrapEnvelope(data)` → `{contract:'fgos.v1', generated_at, data_hash (sha256 hex của data), data}`
- `src/install/coexist.mjs` — detection marker harness khác (read-only) + ghi manifest `.fgos/coexistence.json` (v1); gọi từ verb `init` trong `bin/fgos.mjs`
- `test/install/coexist.test.mjs`, `test/e2e/coexistence-canary.test.mjs` — unit + canary e2e (guard bee thật qua stdin event, footprint snapshot-diff, nhường-nhịn init)
- `docs/coexistence.md` — doctrine đầy đủ record ADR0009 (lãnh địa, một-nhạc-trưởng-mỗi-phiên, nhường-nhịn, manifest schema, Known Gaps)
- `.fgos/events.jsonl` (committed, truth) · `.fgos/state.json` (gitignored, view D4)
- Test: `npm test` (466 test; e2e tại `test/e2e/rebuild-determinism.test.mjs` + `test/e2e/runner-loop.test.mjs` — bao gồm 3 kịch bản stage-clarify (verdict pass/unclear/rác), 3 kịch bản stage-decompose (pass-through, chia-con-chặn-frontier, cần-người), VÀ 1 kịch bản S2-pull (submit → pass-through 2 stage → `take` người → một `fgos-runner --once` song song không giẫm claim người → người `return` xanh → `proposed`) chạy qua binary thật; round-trip cổng chờ-người tại `test/state/awaiting.test.mjs` + e2e CLI tại `test/cli/fgos.test.mjs` bao gồm `submit`/`discover`/settlement/học/parity chia-việc/cửa pull `take`+`return` (frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ); unit tại `test/intake/{classify,discovery,decompose,judge-executor}.test.mjs` + `test/state/{envelope,stage,store,frontier,work,replay}.test.mjs`; entropy-trend tại `test/report/entropy.test.mjs`; benchmark ngoài suite (F4, expected-delta khai trước run) tại `docs/history/phase-3-compound-learning/reports/f4-benchmark.md`)
