---
area: runner
updated: 2026-07-22
sources: [phase-2-routing, post-divorce-hardening, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1, discovery-context, worker-execution, fan-out-parallel, human-rounds, worker-dispatch-log, self-improve-loop, base-workflow-model-s2, fgos-multi-session-checkout, github-adapter-s3, github-adapter-s4, work-graph-intelligence-s2b, work-graph-intelligence-s10, work-graph-intelligence-s11, fgos-sample-testbed, p50-workflow-induct, str68-discovery-judge-robustness, str76-runner-bootstrap]
decisions: [feed7428, 14396a5c, 1a80b4d3, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e, cfae0120, 22699c61, 04a6cd05, 396d9d9e, 2e92b7a5, f0c40acc, 5a6900b2, 8575f1a3, c8df2479, cb09d6fd, b1aa1bdc, caecb9d1, 9b141173, a3176299, 140eb8a4, 76b7a36b, 8d04bba3, 1cd895e1, 38160a70, c11322cb, 2ac16176, f8a3a5d9, 3d4ea29c, 3c8e5926, 342102b9, d4c59ba2, 644916a4, ef6ed305, a4fe4c2b, f69951df, 5208dfe9, 8cf7effe, 7bbe6315, a7c93ec8, cfdd808f, 31b5f045, 87536f3f, 38f7e0b8]
coverage: full
---

# Spec: Runner (vòng tự hành)

Vòng lặp tự hành của forgent: tự lấy việc sẵn-sàng từ work-state, giao cho một trợ lý thông minh chạy nền trong không gian cô lập, tự chấm kết quả bằng proof của chính việc đó, rồi ghi lại thành **đề xuất chờ duyệt**. Người dùng: người vận hành repo (khởi động vòng, duyệt đề xuất). Nguyên tắc sống còn: trong vòng dispatch, chỉ runner được ghi trạng thái; worker chỉ để lại commit trên nhánh riêng.

## Entry Points & Triggers

- `fgos-runner --once` → chạy đúng một vòng: gặt-lại → tìm việc → giao việc theo MẺ (nhiều việc cùng lúc, giới hạn hai tầng) → chấm từng việc → ghi, rồi nạp lại mẻ kế tiếp — lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng (xem "Giao việc theo mẻ, song song có giới hạn" dưới)
- `fgos-runner --dry-run` → in kế hoạch (việc nào sẽ chạy, model nào) mà không làm gì
- Khởi động MỌI vòng đều bắt đầu bằng bước **gặt-lại** (reap): việc kẹt ở `doing` từ lần chạy đổ trước được giải quyết trước khi tìm việc mới
- Ngay sau gặt-lại, TRƯỚC khi tìm việc thi công: **quét làm-rõ** (clarify sweep) — xem "Quét làm-rõ trước dispatch" dưới
- Ngay sau quét làm-rõ, CÙNG TRƯỚC khi tìm việc thi công: **quét chia-việc** (decompose sweep) — xem "Quét chia-việc trước dispatch" dưới
- `fgos take`/`fgos return` (cửa pull, ngoài vòng runner — xem spec Work-State "Cửa pull giao–nhận việc") claim/trả việc qua đúng CAS + goal-check runner tự dùng; gặt-lại lúc khởi động BỎ QUA claim đến từ cửa pull — xem "Gặt-lại lúc khởi động" dưới
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>] [--acknowledge-iron-law]` / `fgos reject <id> --reason "..."` (ngoài vòng runner, gọi bởi người vận hành) — cổng duyệt PR nội bộ cho một đề xuất `proposed` đã sẵn, MỘT cổng cho cả nguồn runner lẫn pull-door; `approve` nguồn runner còn chạy phán Iron Law trước khi merge (self-improve loop STR13 Slice 3, D16/D17) — xem "Cổng duyệt PR nội bộ" dưới
- `fgos review <id> --github [--pr <n>]` / `fgos approve <id> --github --pr <n>` (ngoài vòng runner, gọi bởi người vận hành, tuỳ chọn — github-adapter D5) — vận chuyển thay thế của CÙNG cổng duyệt trên, đưa việc duyệt sang GitHub thay vì diff/merge cục bộ, chỉ áp dụng cho đề xuất nguồn runner (D1); `review --github` kèm `--pr` là phép hỏi thăm trạng thái sống của một PR đã mở, không mở PR mới (github-adapter D6, phát hiện đóng-không-merge) — xem "Cổng duyệt qua GitHub" dưới
- `fgos catchup <id>` (ngoài vòng runner, gọi bởi người vận hành) — đồng bộ lại một việc đang đỗ (`blocked`) vì gãy nhập (xung đột, verify đỏ sau nhập, hoặc trôi tích hợp): kéo trạng thái mới nhất của đích vào nhánh riêng của việc rồi thử lại — xem "Đồng bộ lại một việc đỗ (catch-up)" dưới
- `fgos evolve` / `fgos evolve --pick <id>` / `fgos evolve --submit <id>` (ngoài vòng runner, gọi bởi người vận hành, on-demand — self-improve loop STR13 D1/D3/D15) — Gate A của vòng tự cải thiện: xếp hạng candidate từ friction chưa ngã-ngũ, người chọn một hoặc dừng (đọc-thuần tuyệt đối), hoặc bắc cầu candidate đã chọn sang một việc thật (`--submit`, hành động ghi duy nhất của bề mặt evolve) — xem "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)" dưới
- `fgos session start [--item <id>]` / `fgos session end <session-id> [--force]` / `fgos session list` (ngoài vòng runner, gọi bởi người vận hành/một tác nhân) — vòng đời phiên checkout đa-phiên tùy chọn: một worktree detached-HEAD mỗi phiên cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink (D10); `end` từ chối một phiên đã rời commit khởi tạo trừ khi `--force` — xem "Phiên checkout đa-phiên" dưới

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế {prompt}/{model} theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`, xem CTR009 v2 dưới) · `executors` — TÙY CHỌN, bảng tier→executor riêng (cùng hình dạng `executor`); tier không khai riêng rơi về `executor` chung (STR41/D a4fe4c2b) · `models` — bảng tier→model (light/standard/heavy) · `timeoutMs` — trần thời gian một worker | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`) — bản mặc định giả định trợ lý `claude` (xem RUL48); một `--config <path>` tường minh trỏ vào đường vắng mặt KHÔNG tự sinh, vẫn báo lỗi ngay |
| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |
| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |
| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |
| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |
| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |
| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem "Xem live output worker khi đang chạy") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |
| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |
| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner (D16) — xem "Cổng duyệt PR nội bộ" và "Iron Law" dưới, Business Rules RUL36/RUL37 | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa D10/D14) | — | required mặc định `false` khi cả hai phép thử đều không khớp |
| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (hôm nay 1 luật: `worker-prompt-default.txt`) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44) | yes (một template mặc định luôn có) | `worker-prompt-default.txt` |

## Behaviors & Operations

### Một vòng --once (hạnh phúc)

- **Runs when:** người vận hành gọi; MỘT hoặc NHIỀU việc cùng lúc trong một mẻ (xem "Giao việc theo mẻ, song song có giới hạn" dưới) — mỗi việc đi đúng vòng đời dưới đây, độc lập với việc khác trong cùng mẻ.
- **What changes:** việc đầu frontier được claim (`todo→doing` có kỳ vọng); **ngay sau khi claim, runner ghi nửa DỰ ĐOÁN của một bản ghi kết quả (outcome) cho việc đó** — tier dự kiến, số dep, số lần nhận trước đó (xem spec Work-State); worktree + nhánh `fgw/<id>` mở ra từ đỉnh cây chính; trợ lý chạy nền với prompt dựng từ chính việc đó (mục tiêu / mô tả gốc nguyên văn / ranh giới worktree / proof kỳ vọng / cấm tự ghi trạng thái — cộng thêm một mục Human feedback khi item mang câu trả lời làm-rõ mới nhất và/hoặc lý do từ-chối/đỗ mới nhất, xem RUL23), dưới quyền TỐI THIỂU khai trong `.fgos-runner.json` (xem RUL6), model chọn theo tier của việc; trợ lý tự commit trong worktree; **runner tự chạy lệnh proof của việc trong worktree** — không tin lời trợ lý; đạt → `doing→proposed`, và **CÙNG LÚC runner ghi nửa THỰC TẾ tương ứng** (kết cục `proposed`, goal-check đạt, số lần thử, số commit, số lần nhận) — đo từ chính goal-check/kiểm nhánh của runner, không bao giờ từ lời tự báo của trợ lý; worktree dọn đi, **nhánh ở lại** làm đề xuất.
- **Side effects:** đúng các sự kiện chuyển trạng thái trong nhật ký; output của trợ lý được in console NHƯ CŨ, và CÒN được nối thêm vào một bản ghi cục bộ riêng cho việc đó (xem "Ghi lại output của trợ lý sau mỗi lượt dispatch" dưới) — bản ghi này không bao giờ vào cây committed.
- **Afterwards:** người vận hành thấy việc ở `proposed` + nhánh để review; việc phụ thuộc CHƯA mở (chờ duyệt/merge → `done`); vòng --once thứ hai không giao lại việc nào (frontier trống).

### Giao việc theo mẻ, song song có giới hạn, giữ quyền-sở-hữu-gốc

- **Runs when:** ngay sau quét làm-rõ + quét chia-việc, và lặp lại mỗi khi một mẻ vừa dispatch xong (một hoặc nhiều việc trong mẻ tới kết cục cuối).
- **What changes:** đọc lại TOÀN BỘ tập việc sẵn-sàng tươi; lọc theo quyền sở-hữu gốc — một việc chỉ lọt vào mẻ nếu gốc của nó CHƯA có chủ, hoặc đã thuộc về CHÍNH lượt chạy này (một chủ khác giành nhận cùng gốc bị từ chối, cùng khuôn kỳ-vọng-lệch của mọi cửa nhận việc khác — trên một máy chỉ một chủ tồn tại nên đường từ-chối này hiếm khi thật sự xảy ra, nhưng vẫn được kiểm mỗi lần); nhóm phần còn lại theo gốc, lấy tối đa N gốc, mỗi gốc lấy tối đa M con (trần hai tầng, Data Dictionary #6); mỗi việc trong mẻ được nhận (`todo→doing`) qua đúng MỘT cửa ghi tuần tự (xem RUL24) — dù nhiều việc thi công song song, quyết-nhận và ghi-nhận của từng việc vẫn nối tiếp nhau, không bao giờ hai lượt nhận chen lẫn; việc bị từ chối nhận ở lại chờ mẻ sau, không mất.
- **Side effects:** mỗi việc trong mẻ chạy vòng đời "Một vòng --once" ở trên, đồng thời với việc khác trong CÙNG mẻ, cho tới kết cục cuối của từng việc (đề xuất, đỗ, hoặc dừng).
- **Afterwards:** mẻ xong (mọi việc trong mẻ đã tới kết cục) → đọc lại tập sẵn-sàng TƯƠI (việc vừa xong có thể mở khóa việc phụ thuộc, hoặc mở khóa chính gốc của nó nếu đó là con cuối cùng) rồi nạp mẻ kế tiếp — lặp tới khi KHÔNG còn việc đang chạy VÀ KHÔNG còn việc sẵn-sàng, vòng --once mới kết thúc thật sự.

### Cây nhánh tích hợp — con nhập vào nhánh của gốc, chỉ gốc nhập vào cây chính

- **Runs when:** mỗi lần một việc CON (có việc cha, xem spec Work-State "Giai đoạn Chia-việc") được dispatch hoặc đề xuất của nó được duyệt.
- **What changes:** một việc GỐC (không việc cha, hoặc chính là đỉnh một cây) mở nhánh đề xuất riêng như mọi việc khác (Data Dictionary #2) — nhánh đó nay CŨNG đóng vai nhánh tích hợp của cả cây hậu duệ nó. Một việc CON mở worktree từ ĐỈNH nhánh của gốc nó (không phải từ cây chính) — kế thừa mọi việc anh em cùng gốc đã nhập trước nó. Đề xuất của một việc CON, khi qua cổng duyệt PR nội bộ, nhập vào NHÁNH CỦA GỐC — không bao giờ nhập thẳng vào cây chính. Một việc ĐỘC LẬP (không con, không cha) đi đúng đường cũ không đổi: đề xuất của nó nhập thẳng vào cây chính như trước.
- **Afterwards:** chỉ khi TOÀN BỘ con của một gốc đã `done`, gốc mới tới lượt sẵn-sàng dispatch (cơ chế lineage sẵn có, xem spec Work-State) — verify của chính gốc lúc đó chạy trên nhánh của gốc (đã chứa mọi con đã nhập) như phép kiểm tích hợp cho cả cây; gốc đi tiếp đúng vòng đời và cổng duyệt như mọi việc khác, và CHỈ đề xuất của gốc mới nhập vào cây chính, đúng một lần cho cả tính năng. Bảo đảm nghiệp vụ: cây chính không bao giờ nhận một mảnh dở của một tính năng nhiều-việc — chỉ nhận nguyên vẹn khi toàn bộ cây đã xong (xem RUL25).

### Trôi tích hợp & đồng bộ lại tại gốc→cây chính (integration drift)

- **Runs when:** cổng duyệt PR nội bộ (`approve`) xử lý đề xuất của một GỐC từng có con (đã đi qua cây nhánh tích hợp ở trên).
- **What changes:** trước khi nhập vào cây chính, hệ thống kiểm CẢ HAI điều kiện: (a) nhập có xung đột văn bản không; (b) SAU khi nhập (nhưng CHƯA chốt), verify của chính gốc chạy lại trên cây đã nhập — đại diện cho "cả tính năng cộng với mọi thứ khác đã vào cây chính từ lúc gốc bắt đầu vẫn đúng cùng nhau", không chỉ "nhập được không xung đột". Xung đột văn bản HOẶC verify đỏ ở bước (b) đều bị coi ngang nhau — cả hai là TRÔI tích hợp: hủy sạch việc nhập (cây chính giữ nguyên, không bao giờ giữ một nhập xanh-mà-gãy), gốc đỗ lại mang lý do trôi-tích-hợp RIÊNG (phân biệt với lý do gãy-nhập thường của một việc không-con) cùng dấu vết chỗ cây chính đang đứng lúc đó.
- **Afterwards:** gốc đỗ vì trôi tích hợp chờ người gọi đồng bộ lại (xem "Đồng bộ lại một việc đỗ (catch-up)" dưới); nhập sạch + verify xanh ở bước (b) → gốc `done`, tính năng hoàn tất trên cây chính.

### Đồng bộ lại một việc đỗ (catch-up)

- **Runs when:** người vận hành gọi `fgos catchup <id>` trên một việc đang `blocked` vì gãy nhập (xung đột, verify đỏ sau nhập, hoặc trôi tích hợp).
- **Blocked when:** việc không tồn tại — `validation`; việc không ở `blocked` — `precondition`; lý do đỗ hiện tại không thuộc nhóm gãy-nhập (vd đỗ vì chạm trần chống-lặp, hoặc gặt-do-crash) — `validation`, đồng bộ-lại không giúp được những lý do đó, người phải cầm việc qua cửa pull để tự sửa tay; nhánh riêng của việc không còn tồn tại — `validation`.
- **What changes:** hệ thống xác định ĐÍCH cần đồng bộ — nhánh của gốc nếu việc là con, cây chính nếu việc là gốc/độc lập — rồi kéo trạng thái MỚI NHẤT của đích vào nhánh riêng của việc (nhập, chưa chốt), chạy verify của chính việc trên kết quả TRƯỚC KHI chốt: nhập sạch + verify xanh → chốt, việc chuyển thẳng `blocked → sẵn sàng nộp lại` — KHÔNG đi qua `đang làm`, một bước CƠ HỌC không tính vào ngân sách chống-lặp của việc; còn xung đột → hủy sạch việc nhập vừa thử, việc giữ nguyên `blocked`, thông báo tên các tệp xung đột cho người tự xử lý; verify đỏ sau khi nhập sạch → cũng hủy sạch, việc giữ nguyên `blocked`, người phải tự điều tra vì sao đồng bộ xong mà verify vẫn gãy — cả hai đường thất bại này KHÔNG có cơ chế agent tự giải xung đột (đó là mở rộng sau, xem Open Gaps).
- **Side effects:** không gì ngoài dấu vết trên nhánh riêng của chính việc đó (khi thành công) — cây chính/nhánh của gốc không bao giờ bị đụng bởi lệnh này.
- **Afterwards:** đồng bộ thành công → việc actionable lại qua đúng cổng duyệt PR nội bộ như một đề xuất bình thường, không cần nộp lại từ đầu; đồng bộ thất bại → việc vẫn đỗ, người chọn giữa gọi lại `catchup` sau khi đích đổi tiếp, hoặc cầm việc qua cửa pull để tự làm-lại tay — đường làm-lại tay CÓ tính vào ngân sách chống-lặp (đi qua `đang làm` bình thường), phân biệt với đường cơ học ở trên (xem RUL28).

### Quét làm-rõ trước dispatch (clarify sweep)

- **Runs when:** mỗi lượt chạy, ngay sau gặt-lại, TRƯỚC khi giao bất kỳ việc
  thi công (executing) nào.
- **What changes:** mọi việc đang ở **stage thỏa bước Làm-rõ của domain của
  chính nó** (per spec Work-State "Mô hình domain"; với `coding` đây luôn là
  `clarify`) VÀ status `todo` (xem spec Work-State "Giai đoạn Làm-rõ") được
  chạy context-discovery — BẤT KỂ giá trị `mode` của item mang gì (mode chỉ
  là quy ước ai NÊN gọi trước, không phải điều kiện runner rẽ nhánh). Một
  domain KHÔNG có stage nào thỏa bước Làm-rõ (vd `synthetic`) không có item
  nào từng bị quét ở đây — dù `stage` của item đó vắng mặt (per R-domain-1
  spec Work-State / 1cd895e1, 38160a70): quét chỉ khớp khi domain đó THẬT SỰ
  khai một stage cho bước Làm-rõ, không khớp nhầm hai giá trị vắng mặt với
  nhau. Việc đang `awaiting-human` (đã hỏi, chưa ai trả lời) KHÔNG BAO GIỜ bị
  quét lại — cùng luật loại-trừ với dispatch thường (xem RUL6 (work-state)/RUL15 (work-state)).
  Prompt phán mà runner gọi ở đây mang cùng ngữ cảnh đầy đủ như lời gọi
  `fgos discover` tay — description gốc + cặp hỏi-đáp mới nhất + các lần phán
  trước của item (per discovery-context STR30 / cfae0120, xem spec Work-State
  "Giai đoạn Làm-rõ") — không phải một bản rút gọn riêng cho vòng tự hành.
  `resolveDiscovery` bản thân nó vẫn CHƯA domain-hóa — chỉ nhận diện đúng tên
  stage của `coding` (xem spec Work-State "Mô hình domain") — quét ở đây chỉ
  bảo đảm nó không BAO GIỜ bị gọi nhầm cho một domain khác, không bảo đảm nó
  DÙNG được cho domain khác.
- **Side effects:** một lời gọi model thật cho mỗi item quét được; khi lời
  gọi đó trả về nhưng không đọc được thành phán quyết hợp lệ (dạng gãy-đọc —
  JSON hỏng hoặc không phải object), hệ thống thử lại ĐÚNG MỘT LẦN với một
  bản nhắc chặt hơn, cùng ngân sách thời gian mỗi lần gọi như lần đầu (không
  cộng dồn); một lần gọi gãy vì lý do KHÁC gãy-đọc (model lỗi/timeout/tiến
  trình hỏng) không bao giờ được thử lại — rơi thẳng về fail-safe hiện có;
  lần thử lại tự nó gãy (dù gãy-đọc hay gãy-gọi) cũng rơi về đúng fail-safe
  đó, không có trạng thái từ-chối mới nào phát sinh — không bao giờ throw ra
  ngoài dù model lỗi/timeout (fail-safe, xem spec Work-State RUL48
  (work-state); per D1-D5 discovery-judge-robustness / 87536f3f).
- **Afterwards:** item đủ rõ chuyển sang stage `decompose` (mang verify thật,
  không thẳng `executing` — giai đoạn chia-việc chèn ở giữa) — CÙNG lượt chạy
  này, quét chia-việc bên dưới (xem "Quét chia-việc trước dispatch") có thể
  nhặt được nó ngay; item chưa đủ rõ đậu ở `awaiting-human` mang câu hỏi,
  đợi lượt chạy sau (hoặc gọi tay `fgos discover`) khi đã có câu trả lời.
  Đây là **lưới đỡ**: dù người submit dùng chế độ tương tác-ngay nhưng phiên
  chat của họ chết trước khi tự gọi `discover`, lượt chạy tiếp theo của vòng
  tự hành vẫn tự quét — không item nào kẹt vô hình.

### Quét chia-việc trước dispatch (decompose sweep)

- **Runs when:** mỗi lượt chạy, NGAY SAU quét làm-rõ (không phải một lượt
  chạy riêng) và vẫn TRƯỚC khi giao bất kỳ việc thi công (executing) nào.
  Đọc lại view TƯƠI sau quét làm-rõ — một item vừa được quét làm-rõ đẩy sang
  stage `decompose` trong CÙNG lượt chạy này vẫn bị quét chia-việc ngay, không
  phải đợi lượt chạy sau.
- **What changes:** mọi item đang ở **stage thỏa bước Chia-việc của domain
  của chính nó** (per spec Work-State "Mô hình domain"; với `coding` đây luôn
  là `decompose`) VÀ status `todo` (xem spec Work-State "Giai đoạn Chia-việc")
  được chạy phán chia-việc — BẤT KỂ giá trị `mode` của item. Cùng luật domain
  như quét làm-rõ trên: một domain không có stage nào thỏa bước Chia-việc
  không bao giờ bị quét ở đây (per 1cd895e1, 38160a70). Việc đang
  `awaiting-human` KHÔNG BAO GIỜ bị quét lại — cùng luật loại-trừ với mọi
  dispatch khác (RUL6 (work-state)/RUL15 (work-state)).
- **Side effects:** một lời gọi model thật cho mỗi item quét được; cùng luật
  thử-lại-có-điều-kiện như quét làm-rõ trên (xem "Side effects" quét làm-rõ):
  gãy-đọc thử lại đúng một lần với bản nhắc chặt hơn trong cùng ngân sách
  thời gian, gãy-gọi không bao giờ thử lại, thử lại tự gãy cũng rơi về cùng
  fail-safe — không bao giờ throw ra ngoài dù model lỗi/timeout, hay verdict
  sinh con thiếu verify (fail-safe, xem spec Work-State RUL48 (work-state);
  per D1-D5 discovery-judge-robustness / 87536f3f).
- **Afterwards:** item pass-through hoặc vừa sinh đủ con (gốc chuyển
  `decompose → executing`) — CÙNG lượt chạy này, vòng dispatch bên dưới có
  thể nhặt được gốc ngay nếu deps/lineage cũng đã mở (gốc không có hậu duệ
  dang dở); item cần người quyết đậu ở `awaiting-human` mang đề xuất chia,
  đợi lượt chạy sau (hoặc gọi tay `fgos discover`) khi đã có câu trả lời. Đây
  cũng là một **lưới đỡ**, cùng tinh thần quét làm-rõ: không item nào ở stage
  `decompose` kẹt vô hình dù không ai gọi `discover` tay.

### Gặt-lại lúc khởi động (reap — phục hồi sau crash)

- **Runs when:** đầu MỌI lần chạy.
- **What changes:** trước hết, mọi item `doing` mang `claimActor` là `human`/`session` (cầm qua cửa pull `take` — xem spec Work-State) bị BỎ QUA hoàn toàn — người/phiên cầm vô thời hạn, gặt-lại không bao giờ giẫm lên claim đó (stage-decompose D1). Với phần còn lại (claim của runner, hoặc claim di sản không actor), việc kẹt ở `doing` (runner lần trước chết giữa chừng) được giải quyết theo nhánh của nó: có commit + proof đạt → hoàn tất `doing→proposed` (idempotent); không → `doing→blocked` kèm lý do gặt-do-crash. Nhánh bị worktree mồ côi giữ được đòi lại (dọn worktree cũ rồi mở lại); nhánh rỗng không commit → tỉa; nhánh có hàng → giữ cho người review.
- **On failure:** lỗi worktree khi gặt → việc đó về `blocked` có lý do, bước gặt KHÔNG BAO GIỜ chết thô — chạy-lại-sau-crash an toàn tự thân (có test giết thật giữa chừng).

### Chấm trượt / lỗi giữa vòng

- **What changes:** tra bảng phục hồi theo lớp lỗi — thử-lại (worktree mới, DÙNG LẠI nhánh cũ) → hết trần thì đỗ-lại (`doing→blocked` kèm lý do); lỗi tranh-chấp-ghi (kỳ vọng lệch vì người vận hành vừa ghi tay) → dọn dẹp rồi DỪNG sạch — không bao giờ giành ghi với người. Nhánh cũ reset về **baseline dispatch riêng của việc đó, chụp tại lần thử ĐẦU TIÊN** (không phải HEAD hiện tại của nhánh tại thời điểm thử-lại): một lần thử sau — dù sinh commit khác lần trước — không bao giờ mang commit của một lần thử ĐÃ THẤT BẠI đi tiếp, trong khi nội dung nhánh có từ trước lần thử đầu tiên (ví dụ một con đã merge trước đó) vẫn được giữ nguyên (fix STR1 #2, per review-260718-phase-2-routing-rerun / e2ccd0cd).
- **Side effects:** worktree luôn được dọn trên mọi đường thoát (kể cả dừng); quá trần chống-lặp → việc bị `todo→blocked` lý do chống-lặp, rời hẳn frontier.
- Khi việc bị đỗ-lại (`parked`, hết trần thử lại hoặc lỗi không thử lại được) hoặc bị dừng vì cầu dao (`halted`, chấm-trượt-liên-tiếp), runner **CŨNG ghi nửa THỰC TẾ** của bản ghi outcome — thất bại được học, không chỉ thành công. Nửa thực tế KHÔNG được ghi ở một lượt-thử-còn-thử-lại-được (chỉ ghi đúng một lần, ở kết cục CUỐI của việc).
- **Cùng lúc đó, runner ghi thêm một bản ghi friction** (kênh 2 của capture 2 kênh, Phase 3 Slice 2, xem spec Work-State): runner tự quy tội — dịch lớp lỗi thành một trong **5 lớp friction** cơ học: hỏng-spawn/quá-giờ/hỏng-worktree → `environment` · chấm-trượt → `verification` · nhật-ký-hỏng/việc-kẹt-do-crash/tranh-chấp-ghi → `state` · đề-xuất-bị-trả → `context` · lớp lạ → `task-spec` (mặc định). Bảng dịch là dữ liệu tĩnh, không phán xét — tích lũy friction là bằng chứng để hiệu chỉnh sau này, không phải kết luận tại chỗ.
- **Bổ chú (20260717, review-unreviewed-260717).** Ba lớp lỗi khoá-sự-kiện-bị-giữ/phiên-hỏng/nhập-gộp-hỏng (`lock-timeout`/`session-fail`/`merge-fail`) nay đều có mã thoát riêng trong bảng tra — một việc chạm một trong ba lớp này khiến `runOnce` dừng nhẹ đúng việc đó (`halted`, có kết quả cấu trúc) chứ không còn sập tung cả lượt chạy. Trước bản vá này, ba lớp lỗi trên vắng mặt khỏi bảng tra nên rơi vào nhánh sập-toàn-vòng (mọi việc khác trong lượt mất kết quả, mã thoát chung chung không phân biệt được với lỗi thật) — dù RUL7 vốn định nghĩa lớp lỗi lạ phải dừng nhẹ, không sập.

### Ghi lại output của trợ lý sau mỗi lượt dispatch (persist log)

- **Runs when:** ngay sau MỖI kết cục của một lượt dispatch cho một việc —
  trợ lý chạy xong (dù sau đó goal-check đạt hay chấm-trượt), HOẶC dispatch
  hỏng trước khi trợ lý kịp chạy xong (quá-giờ, hỏng-spawn kể cả tràn bộ
  đệm, hoặc lỗi worktree không liên quan gì tới trợ lý).
- **What changes:** output (stdout/stderr) của trợ lý cho lượt thử đó được
  nối thêm thành một khối có dấu thời gian vào một bản ghi cục bộ riêng cho
  việc đó (một file mỗi việc, gộp mọi lần thử theo thời gian — lần thử sau
  KHÔNG đè lần thử trước). Khi dispatch hỏng TRƯỚC khi trợ lý kịp sinh ra
  output (vd lỗi worktree), khối ghi lại chỉ mang loại lỗi + thông điệp —
  KHÔNG throw vì thiếu output/tier/model.
- **Side effects:** một khối mới nối vào bản ghi cục bộ của việc đó; bản ghi
  này KHÔNG BAO GIỜ vào cây committed — không đổi nửa bảo đảm cốt lõi của
  luật kỷ-luật-output cũ (xem RUL31).
- **Afterwards:** người vận hành (hoặc một phiên agent khác) đọc lại được
  đúng những gì trợ lý đã làm/nói cho một việc, ngay cả sau khi console đã
  cuộn qua mất — kể cả cho những lượt thử KHÔNG BAO GIỜ tới `proposed`
  (quá-giờ, hỏng-spawn). Kết quả goal-check (verify) KHÔNG nằm trong bản ghi
  này — vẫn chỉ in console như trước, ngoài phạm vi thay đổi này.

### Xem live output worker khi đang chạy (live tee, STR39)

- **Runs when:** ngay mỗi khi một chunk stdout/stderr của trợ lý ĐẾN —
  trong lúc worker VẪN ĐANG CHẠY, không đợi lượt dispatch kết thúc (khác
  với khối kết-cục cuối trên, chạy ĐÚNG MỘT LẦN sau khi worker đã xong).
- **What changes:** chunk thô (không header/dấu thời gian, không bọc) được
  nối thẳng vào CÙNG file `.fgos/logs/<id>.log` của chính việc đó — qua
  đúng cửa ghi worker-log.mjs (một-cửa D3, không mở cửa ghi thứ hai). Mỗi
  việc chỉ ghi vào file của chính nó nên N việc dispatch song song không
  bao giờ giẫm dòng nhau. Khối kết-cục cuối (trên) vẫn chạy nguyên vẹn sau
  đó, không đổi — file cuối cùng mang cả live chunk lẫn khối tổng kết.
- **Side effects:** không throw dù ghi hỏng hay callback ghi hỏng (cùng kỷ
  luật never-throws với khối kết-cục cuối — quan sát không bao giờ được
  phép làm gãy một dispatch thật).
- **Afterwards:** người vận hành `tail -f .fgos/logs/<id>.log` trong lúc
  việc đang `doing` thấy output đến theo thời gian thực, thay vì phải đợi
  worker xong mới đọc được gì. Nền cho chiều-ra của STR38/STR40 (UI tail +
  tmux pane).

**Phần (b) — stream-json qua executor args (backlog STR39, KHÔNG CẦN CODE riêng):**
`.fgos-runner.json`'s `executor.args` đã là một mẫu Host Adapter (Data
Dictionary #1) — thêm một cờ như `--output-format stream-json` vào đó (nếu
CLI trợ lý hỗ trợ) chỉ đổi NỘI DUNG stdout trợ lý phát ra, không đổi đường đi
của nó: dispatch.mjs vẫn tee từng chunk y hệt bất kể định dạng (JSON-lines
hay text thường), worker-log.mjs vẫn là cửa ghi duy nhất. Không có nhánh code
nào phân biệt định dạng output — vì không cần: đây thuần là cấu hình, không
phải một tính năng runner phải hiểu.

### Ai ngã-ngũ — actor trên settlement (Phase 3 S3-closeout)

Mỗi ngã-ngũ (kênh 1 của capture 2 kênh — xem spec Work-State "Bản ghi
settlement") mang thêm ai/cái gì đã ngã-ngũ nó:

- **Runs when:** mọi ngã-ngũ mà chính runner tự ghi trong vòng dispatch của
  nó — quét làm-rõ cho qua, quét chia-việc cho qua, nhận việc, đề xuất, đỗ.
- **What changes:** ngã-ngũ đó mang `actor` = **runner**. Ngã-ngũ do một
  phiên đang sống tự gọi tay context-discovery mang `actor` = **session**;
  ngã-ngũ do người gọi qua một lệnh CLI (chuyển trạng thái tay, trả lời một
  câu hỏi đang chờ) mang `actor` = **human** — ba giá trị này phủ hết mọi
  đường ngã-ngũ hiện có.
- **Afterwards:** ai đọc lại nhật ký (qua `fgos check`) biết chính xác AI đã
  đưa item qua từng ngã-ngũ của nó, không chỉ SỰ KIỆN gì đã xảy ra.

### Cổng duyệt PR nội bộ (approval gate) — review/approve/reject

MỘT cổng duyệt duy nhất cho MỌI đề xuất `proposed`, bất kể nguồn (per D4
pr-lifecycle / 1359ab5e): một đề xuất do runner tự đề xuất (nhánh `fgw/<id>`
còn sống) và một đề xuất đến qua cửa pull `take`/`return` (dải commit
`headAtTake→headAtReturn`, xem spec Work-State) đi qua CÙNG ba verb, cùng
luật. Trước khi `review`/`approve` hành động, đề xuất được PHÂN LOẠI đúng một
trong ba nguồn: **runner** (nhánh `fgw/<id>` tồn tại — `git rev-parse
--verify`), **pull** (không nhánh, nhưng mang cả `headAtTake` VÀ
`headAtReturn`), hoặc **legacy** (không cả hai — đề xuất từ trước feature này,
hoặc nhánh/dấu vết đã mất).

Song song với phân loại NGUỒN ở trên, một đề xuất nguồn **runner** còn được phân
biệt theo TẦNG trong cây nhánh tích hợp (xem "Cây nhánh tích hợp" trên): một đề
xuất **con** (có việc cha) so sánh/nhập với NHÁNH CỦA GỐC nó thay vì cây chính;
một đề xuất **gốc/độc lập** so sánh/nhập với cây chính như trước, không đổi. Một
việc con gãy nhập mang đúng lý do gãy-nhập sẵn có (`merge-conflict`/`verify-fail-
post-merge`) như mọi nhập gãy khác; lý do trôi-tích-hợp riêng chỉ dành cho một
GỐC từng có con gãy nhập vào CÂY CHÍNH (xem "Trôi tích hợp & đồng bộ lại" trên).

- **Runs when:** người vận hành gọi `fgos review <id>` / `fgos approve <id>
  [--timeout <ms>] [--acknowledge-iron-law]` / `fgos reject <id> --reason
  "..."` trên một item đang `proposed`.
- **Blocked when:** item không tồn tại — `validation`; item không ở
  `proposed` — `precondition` ("nothing to review/approve/reject"); `reject`
  thiếu `--reason` — `validation` (bắt buộc, cùng khuôn `proposed→todo`);
  `approve --timeout` không phải số dương — `validation`; `approve` trên
  nguồn `runner` khi working tree của main KHÔNG sạch — `validation` (phép
  kiểm này loại trừ `.fgos/`: store sống mang cửa ghi riêng, tự mutate bởi
  chính take/return/approve nên không bao giờ tính là bẩn — `isFgosOnlyStatusLine`,
  `src/runner/merge.mjs`); `approve` trên nguồn `runner` khi phán Iron Law trả
  `required: true` mà KHÔNG mang `--acknowledge-iron-law` — `validation`,
  thông điệp nêu tên đúng cờ/module đã khớp (self-improve loop STR13 Slice 3,
  D16/D17 — xem "Iron Law" dưới); chặn này chạy TRƯỚC cả bước kiểm cây sạch
  ở trên, không git nào chạy, đề xuất giữ nguyên `proposed`. `approve` (KHÔNG
  `--github`) khi `cwd` NẰM TRONG một worktree phiên đã đăng ký (khớp hoặc
  lồng dưới một `worktreePath` trong `.fgos/sessions.json`) — `validation`,
  áp CHUNG cho cả hai nguồn `runner` VÀ `pull`/`legacy`, từ chối TRƯỚC mọi
  lệnh git và trước cả lần chạy `verify`/goal-check nào: đề xuất giữ nguyên
  `proposed`, main không đụng tới, thông điệp nêu ĐÍCH DANH session-id `cwd`
  đang lồng trong và bảo người gọi chạy `approve` từ cây chính, hoặc `fgos
  session end <id>` trước (fgos-multi-session-checkout Epic 2 — xem "Phiên
  checkout đa-phiên" dưới cho hai mối nguy riêng của mỗi nguồn). Ngay sau
  chặn theo sổ đăng ký đó, `approve` (KHÔNG `--github`) còn chạy MỘT chặn cấu
  trúc thứ hai, không dựa sổ đăng ký: `isMainWorktree(repoRoot)`
  (`src/runner/merge.mjs`) so `git rev-parse --show-toplevel` của `cwd` với
  thư mục cha của `git rev-parse --git-common-dir` (đã resolve tuyệt đối) —
  bằng nhau nghĩa là cây chính, khác nhau nghĩa là MỘT worktree liên-kết bất
  kỳ, dù đã đăng ký qua `fgos session start` hay một `git worktree add` tay
  không bao giờ gọi qua verb đó (STR44 — sổ đăng ký ở trên chỉ bắt được
  trường hợp đã đăng ký; chặn cấu trúc này bắt luôn worktree tay không đăng
  ký, cùng nguy cơ false-verification hệt như worktree phiên: merge đáp vào
  chính checkout của worktree đó thay vì cây chính, hoặc goal-check xác minh
  đúng cây (có thể cũ/lệch) của worktree đó trong khi đề xuất vẫn báo
  "done"/"verified on main"). Từ chối TRƯỚC mọi lệnh git và trước verify/
  goal-check nào, cùng khuôn với chặn sổ đăng ký (đề xuất giữ `proposed`,
  main không đụng tới); fail-open (coi là cây chính) khi `repoRoot` hoàn
  toàn KHÔNG phải một repo git — giữ nguyên hành vi đề xuất `legacy` chạy
  trên một thư mục không-git vẫn hoạt động như trước. **(Cập nhật,
  approve-worktree-guard-github-fix D1):** `approve --github` KHÔNG còn
  được miễn CẢ HAI chặn định-danh-worktree này — chặn sổ đăng ký và chặn
  cấu trúc đều dời lên chạy TRƯỚC nhánh `--github` (trước bất kỳ merge
  GitHub hay ghi trạng thái nào), vì tính hợp lệ của MÔI TRƯỜNG gọi lệnh
  (đây có đúng là worktree chính không) là điều kiện nền tảng hơn vận
  chuyển nào được chọn. `approve --github` CHỈ còn miễn phép kiểm
  cây-làm-việc-chính-phải-sạch và phán Iron Law (xem "Cổng duyệt qua
  GitHub" dưới) — hai phép kiểm đó tồn tại riêng vì một merge CỤC BỘ làm
  bẩn cây làm việc, điều một merge qua GitHub không hề gây ra. Không nhánh
  chặn nào ghi sự kiện.
- **What changes:**
  - `review <id>` — thuần đọc (không sự kiện nào): in diff theo nguồn —
    `runner` → `git diff main...fgw/<id>`; `pull` → `git diff
    headAtTake..headAtReturn` (dải NÀY có thể chứa commit của một phiên khác
    chen giữa `take`..`return` trong môi trường nhiều-phiên — CHẤP NHẬN
    degrade trung thực: in thêm một cảnh báo đếm số commit lạ trong dải,
    không bao giờ giấu); `legacy` → in cảnh báo "không có nguồn diff", KHÔNG
    BAO GIỜ nổ. Kèm một trace tóm tắt (outcome/friction hiện có của item, tái
    dùng định dạng của `check` sẵn có — không formatter mới).
  - `approve <id>` — nguồn `runner`: TRƯỚC MỌI thao tác git, chạy phán Iron
    Law (self-improve loop STR13 Slice 3, D16/D17 — xem "Iron Law" dưới) trên
    diff của chính đề xuất; `required: true` thiếu `--acknowledge-iron-law` →
    từ chối ngay (xem Blocked when); còn lại (required: false, hoặc required:
    true kèm cờ) đi tiếp đúng đường merge dưới đây, không đổi. `git merge --no-commit --no-ff
    fgw/<id>` staging-only vào main (spike "nocommit-probe", xem
    `docs/history/pr-lifecycle/reports/validation-s1-gate.md`); **conflict**
    → `git merge --abort` (main nguyên vẹn byte-for-byte, spike
    "merge-abort-probe") + `proposed → blocked` (reason `merge-conflict`) +
    một bản ghi friction lớp `state`; **staged sạch** → chạy `verify` CỦA
    ITEM (goal-check) trên chính cây đã staged, CHƯA commit — xanh → `git
    commit` (hoàn tất merge) rồi `proposed → done` mang **actor `human`**
    (D3: người chạy approve là ngã-ngũ, merge chỉ là hệ quả cơ học) + dọn
    nhánh/worktree (best-effort); đỏ → `git merge --abort` (main nguyên vẹn)
    + `proposed → blocked` (reason `verify-fail-post-merge`) + friction lớp
    `verification`. Nguồn `pull`/`legacy` — KHÔNG có bước merge (code đã
    trên main, D4): chạy thẳng `verify` của item trên main qua CÙNG hàm
    `runGoalCheck` mà `return`/runner dùng — xanh → `done` actor human; đỏ →
    `blocked` (reason `verify-fail`) + friction `verification`.
  - `reject <id> --reason` — `proposed → todo` mang `reason` + actor human;
    KHÔNG BAO GIỜ chạy một lệnh git nào (D4 "không auto-revert" — code của
    một đề xuất pull-door đã trên main là lịch sử; `reject` chỉ là từ-chối
    coi-là-xong, không đảo ngược lịch sử).
- **Side effects:** `approve` nguồn `runner` chạy các tiến trình con git
  (`merge --no-commit --no-ff`, `merge --abort` khi cần, `commit`) cộng một
  lần chạy `verify` của item; `approve` nguồn `pull`/`legacy` chỉ chạy
  `verify`; `review`/`reject` không có side effect ngoài đọc/ghi sự kiện
  tương ứng.
- **Afterwards:** merge sạch → item `done`, nhánh/worktree dọn, việc phụ
  thuộc mở khóa như mọi `done` khác; merge/verify gãy → item `blocked` mang
  reason cụ thể, đậu lại chờ người (không tự rebase, không halt cả vòng
  runner); `reject` → item về `todo` mang reason, vào lại hàng chờ, chống-lặp
  đếm bình thường như mọi lần trả về khác.

### Cổng duyệt qua GitHub (GitHub transport, tuỳ chọn) — review/approve --github

Một VẬN CHUYỂN thay thế của CHÍNH cổng duyệt PR nội bộ trên (github-adapter
D1/D3/D5) — không phải một cổng thứ hai, không đổi luật FSM/actor của cổng
gốc: chỗ diễn ra việc xem-diff chuyển sang trang PR thật trên GitHub, và chỗ
thực hiện merge chuyển sang API của GitHub thay vì `git merge` cục bộ. Chỉ áp
dụng cho đề xuất **nguồn runner** (nhánh `fgw/<id>` còn sống) — nguồn
pull-door/legacy không có nhánh để mở PR (D1). Tuỳ chọn và cộng thêm: hoàn
toàn không đụng đường duyệt cục bộ sẵn có — một đề xuất không bao giờ bị ép
đi qua GitHub, người vận hành chọn mỗi lần gọi lệnh (D5).

Việc mở PR và việc merge PR là HAI bước tách rời, gọi qua hai verb khác nhau
— không gộp một lệnh, vì một PR vừa mở chưa có lượt duyệt nào trên GitHub, gộp
một lệnh sẽ luôn gãy ngay lần dùng đầu tiên:

- **Runs when:** người vận hành gọi `fgos review <id> --github` (mở PR) rồi
  sau đó, sau khi đã tự duyệt/không-duyệt trên trang GitHub, gọi `fgos
  approve <id> --github --pr <n>` (merge PR số `n` vừa mở). Bất cứ lúc nào
  giữa hai bước đó, người vận hành cũng có thể gọi `fgos review <id> --github
  --pr <n>` (CÙNG verb, thêm `--pr`) để hỏi thăm trạng thái sống của PR trên
  GitHub mà không mở PR mới và không merge gì — đây là cơ chế phát hiện một
  PR bị đóng trên GitHub mà KHÔNG merge (github-adapter D6).
- **Blocked when:** đề xuất không phải nguồn runner (source ∈ pull/legacy) —
  từ chối `validation` ngay, không gọi GitHub, nêu rõ lý do "không có nhánh
  để gắn PR" — KHÔNG BAO GIỜ tự âm thầm quay về đường duyệt cục bộ (D3: gãy
  chuyển thẳng sang chặn/đỗ, không tự hạ cấp vận chuyển). `approve --github`
  thiếu `--pr <n>` — `validation`, nêu rõ phải lấy số PR từ một lần `review
  --github` trước đó. Phép kiểm nguồn chạy TRƯỚC phép kiểm `--pr` (một đề
  xuất pull/legacy luôn nhận đúng thông điệp "không phải nguồn runner", không
  bao giờ bị thông điệp "thiếu --pr" gây hiểu lầm). `approve --github` KHÔNG
  đi qua phép kiểm cây-làm-việc-chính-phải-sạch hay phán Iron Law của đường
  duyệt cục bộ — cả hai phép kiểm đó tồn tại chỉ vì một merge CỤC BỘ làm bẩn
  cây làm việc; một merge qua GitHub không đụng cây làm việc cục bộ chút nào.
  `approve --github` VẪN chạy qua hai chặn định-danh-worktree của đường cục
  bộ (sổ đăng ký phiên + chặn cấu trúc `isMainWorktree` — xem "Cổng duyệt PR
  nội bộ" trên), TRƯỚC CẢ nhánh `--github`: dù merge diễn ra qua GitHub,
  trạng thái `done` vẫn không được lạc vào một worktree khác trong khi GitHub
  đã báo PR merged. Vì hai chặn này chạy trước phép kiểm nguồn của `--github`,
  một đề xuất nguồn KHÔNG-runner gọi `approve --github` TỪ một worktree
  liên-kết (đã đăng ký hay tay) nhận thông điệp từ-chối định-danh-worktree,
  không phải thông điệp "không phải nguồn runner" ở trên — tính hợp lệ MÔI
  TRƯỜNG (đây có phải cây chính không) được kiểm trước tính hợp lệ NGHIỆP VỤ
  (nguồn của đề xuất có hợp với `--github` không), phòng-thủ-theo-chiều-sâu
  có chủ đích (D3).
- **What changes:**
  - `review <id> --github` — đẩy nhánh của đề xuất lên remote gốc nếu nhánh
    đó chưa từng được đẩy (thăm dò tồn tại trước, chỉ đẩy khi thật sự cần —
    trường hợp bình thường của lần đầu), rồi mở một PR thật trên GitHub, đích
    là nhánh trục của kho (đề xuất gốc/độc lập) hoặc nhánh của gốc (đề xuất
    con, cùng khuôn tầng với đường cục bộ). Thành công → in số PR và hướng
    dẫn bước kế tiếp (đi duyệt trên GitHub rồi gọi `approve --github --pr
    <n>`); KHÔNG BAO GIỜ tự dựng đường dẫn PR (không đủ thông tin để dựng
    đúng, chỉ nêu số PR). Gãy (GitHub không cho mở PR — vd chưa đăng nhập,
    mất mạng) → in lý do, đề xuất giữ NGUYÊN `proposed`, không sự kiện nào
    được ghi — `review` vẫn thuần-đọc trên trạng thái FSM y hệt đường cục bộ,
    dù bên ngoài (GitHub) đã có tác dụng phụ thật (nhánh đã đẩy).
  - `review <id> --github --pr <n>` (github-adapter D6, phát hiện đóng-không-
    merge) — KHÔNG mở PR mới; chỉ hỏi thăm trạng thái SỐNG của PR số `n` trên
    GitHub, thuần đọc tuyệt đối (không sự kiện nào, không friction nào, dưới
    MỌI kết cục — một PR bị đóng trên GitHub không tự nó là một hành động
    duyệt hay từ chối). Phân loại CHỈ dựa trên hai trường tự-nó-đã-rõ-nghĩa —
    "đã đóng chưa" (có/không) và "đã merge lúc nào" (có dấu thời gian hay
    không) — KHÔNG BAO GIỜ dựa vào một chuỗi trạng thái tổng quát của GitHub,
    vì lần chứng minh thật (S1) chưa từng quan sát chuỗi đó cho một PR đã đóng
    hay đã merge. Ba kết quả: (1) còn mở → không có gì để làm, gợi ý gọi
    `approve --github --pr <n>` khi đã sẵn sàng; (2) đã merge → chỉ mang tính
    thông tin, KHÔNG tự đổi trạng thái cục bộ (bao trùm cả trường hợp một
    người merge thẳng trên trang GitHub, bỏ qua `approve --github` — đối chiếu
    lại tình huống đó nằm ngoài phạm vi, D4 giữ việc thực thi merge/verify ở
    máy cục bộ); (3) đã đóng KHÔNG merge → nêu rõ số PR, hướng dẫn người vận
    hành tự gọi `fgos reject <id> --reason "..."` nếu muốn đưa việc về lại
    hàng chờ — đây CHÍNH LÀ cơ chế phát hiện D6 yêu cầu, nhưng bản thân phép
    hỏi thăm này không bao giờ tự động gọi `reject` thay người.
  - `approve <id> --github --pr <n>` — gọi merge của GitHub trên đúng PR số
    `n`. Sạch → `proposed → done` mang actor `human` (D3: người gọi approve
    là ngã-ngũ, merge chỉ là hệ quả cơ học — CÙNG nguyên tắc dù merge diễn ra
    ở đâu). Gãy (bất kỳ lý do nào — GitHub chưa cho phép merge vì thiếu lượt
    duyệt, xung đột thật, mất xác thực, giới hạn tần suất, mất mạng, hay bất
    kỳ lỗi nào khác của lời gọi) → `proposed → blocked` mang lý do cụ thể +
    một bản ghi friction, CÙNG khuôn với đường cục bộ (`merge-conflict`/
    `verify-fail-post-merge`) — không phải hai khuôn song song.
- **Side effects:** `review --github` có thể đẩy một nhánh lên remote gốc
  (tác dụng phụ ngoài repo cục bộ) và luôn gọi ra GitHub khi thành công lẫn
  khi gãy; `approve --github` luôn gọi ra GitHub.
- **Afterwards:** mở PR thành công → đề xuất vẫn `proposed`, chờ người tự
  duyệt trên GitHub rồi quay lại gọi `approve --github`; merge PR thành công
  → item `done` y hệt đường cục bộ, việc phụ thuộc mở khóa như mọi `done`
  khác — nhưng KHÁC đường cục bộ ở một điểm: nhánh riêng của đề xuất (cả bản
  cục bộ lẫn bản đã đẩy lên remote gốc) KHÔNG được dọn tự động sau khi merge
  qua GitHub (giới hạn đã biết, xem Open Gaps); merge gãy → item `blocked`
  mang lý do cụ thể, đậu lại chờ người, cùng luật "không tự rebase, không
  halt cả vòng runner" như mọi lần đỗ khác.

### Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)

Bước vào của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md
D1/D3/D6/D11/D12/D15): fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành
một danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể
bắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,
`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS (D1) — không
phải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,
không bao giờ là một nhánh tự động của vòng dispatch thường (D3). Vòng khép
kín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)
→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →
runner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt
PR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge.

- **Runs when:** người vận hành gọi `fgos evolve` (liệt kê), `fgos evolve
  --pick <id>` (xem chi tiết một candidate), hoặc `fgos evolve --submit <id>`
  (bắc cầu candidate sang một việc thật, D15) — không có input tương tác nào
  khác, không vòng lặp chờ trả lời (D11: hai bước, không stdin).
- **Blocked when:** `--pick <id>`/`--submit <id>` không khớp candidate nào
  đang mở — `validation`, thông điệp rõ ràng, KHÔNG BAO GIỜ hỏi lại (D11
  "input sai là lỗi sạch, không re-prompt"), không việc nào được tạo ra cho
  `--submit` khi không khớp; `--pick`/`--submit` mang cờ trần (không giá trị)
  cũng bị từ chối cùng khuôn `validation` như mọi verb khác dùng
  `requireField`.
- **What changes:**
  - `fgos evolve` (không `--pick`/`--submit`) và `fgos evolve --pick <id>` —
    ĐỌC-THUẦN TUYỆT ĐỐI (D6), cùng request-class với `ready`/`list`/`check`:
    đọc view qua `listWork(dir)` DUY NHẤT, không bao giờ
    `rebuild`/`refreshView`/`initStore` (những cửa GHI view/log).
    - `fgos evolve` — xếp hạng MỖI id còn friction chưa ngã-ngũ
      (`src/evolve/candidates.mjs`'s `rankCandidates`, D12: tái dùng cơ học
      `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` của
      `entropy.mjs`, không tự định nghĩa lại "chưa ngã-ngũ" hay trọng số
      riêng) rồi in TOÀN BỘ danh sách — mỗi dòng mang đủ id/score/
      disposition/errorClass/layer/attempts/detail, không cắt bớt (cùng kỷ
      luật "mọi trường người cần để phán" như phần friction của `check`).
      Không friction chưa ngã-ngũ nào → một thông điệp trạng-thái-rỗng rõ
      ràng, exit 0 — chưa khởi tạo `.fgos/` nếu nó chưa tồn tại, giữ đúng hợp
      đồng đọc-thuần của `ready`/`list`.
    - `fgos evolve --pick <id>` — xếp hạng lại CÙNG một view rồi tìm `id`
      trong danh sách; khớp → in bản ghi friction đầy đủ của candidate đó,
      TÁI DÙNG đúng formatter friction sẵn có của `check` (không viết
      formatter mới); không khớp → lỗi `validation` sạch, không đổi trạng
      thái. Chạy `fgos evolve` không mang `--pick`/`--submit` CHÍNH LÀ kết
      cục "dừng" của Gate A (D6) — không có input hủy/dừng riêng nào khác
      cần xử lý.
  - `fgos evolve --submit <id>` (self-improve loop STR13 Slice 3, D15) — HÀNH
    ĐỘNG GHI DUY NHẤT của cả bề mặt evolve: xếp hạng lại CÙNG một view, tìm
    `id`; khớp → soạn một mô tả người-đọc-được từ các trường của candidate
    (id/disposition/errorClass/layer/attempts/detail — trường vắng mặt được
    bỏ qua, không bao giờ in literal "undefined") rồi tạo đúng MỘT việc thật
    qua CÙNG cửa `submitWork` mà `fgos submit` tự dùng (không logic tạo-việc
    thứ hai) — `status: todo`, stage vào-Làm-rõ theo domain (mặc định
    `clarify`), `tier`/`risk` dẫn xuất mechanically từ chính mô tả đó qua
    `classify()` giống hệt một `submit` bình thường. `evolve --submit` không
    mang cờ `--async`/`--unattended`/`--domain` riêng của nó (bề mặt cờ tối
    thiểu, YAGNI) — luôn gọi `submitWork` với mặc định. Việc mới tạo ra đi
    đúng vòng đời runner thường (quét làm-rõ → quét chia-việc → dispatch →
    `proposed`) như mọi việc khác — Gate A không có cơ chế dispatch/wiring
    riêng nào cho việc bắc cầu này.
- **Side effects:** `evolve`/`evolve --pick` — không có: không sự kiện nào
  vào nhật ký, không dòng nào vào `state.json`, không tiến trình con git nào.
  `evolve --submit` — đúng MỘT sự kiện `work.add` mới (qua `submitWork`), y
  hệt một `fgos submit` bình thường; không tiến trình con git nào (việc mới
  chưa dispatch, chưa có nhánh).
- **Afterwards:** `evolve`/`evolve --pick` — người vận hành thấy đúng
  candidate mình cần để quyết định có bắc cầu hay không; không candidate nào
  bị chọn tự động, không việc nào được tạo ra chỉ vì `evolve` chạy.
  `evolve --submit` — việc mới nằm trong hàng chờ runner thường, sẵn sàng cho
  quét làm-rõ/chia-việc/dispatch như mọi việc khác; khi đề xuất của nó tới
  `proposed`, nó đi qua đúng cổng duyệt PR nội bộ ở trên — nếu diff của nó
  chạm cờ/module Iron Law (xem dưới), `approve` từ chối cho tới khi người
  vận hành xác nhận bằng `--acknowledge-iron-law`.
  **Tương tác đã biết (chứng minh bằng e2e thật, STR13 Slice 3):** vì Iron
  Law's phép thử từ khóa TÁI DÙNG đúng `HEAVY_KEYWORDS` mà `classify()` cũng
  dùng (D13/D14), một mô tả candidate chứa từ khóa rủi ro nặng — điều kiện tự
  nhiên để một fix thật sự cần Iron Law — cũng khiến chính việc mới đó nhận
  `risk: 'heavy'` ngay lúc `submitWork` chạy. Root mang `risk: 'heavy'` đi
  đúng nhánh "cần người quyết" của quét chia-việc (xem "Edge Cases Settled"
  dưới, mục risk `heavy`) — đậu `awaiting-human` TRƯỚC KHI kịp dispatch, dù
  không phải vì thiếu rõ. Đây không phải bug — người vận hành cần một bước
  thao tác thường (vd `fgos edit <id> --risk standard`, verb công khai đã có
  từ work-item-verb-surface) giữa `evolve --submit` và khi item tới dispatch,
  nếu muốn bỏ qua cửa chia-việc cho trường hợp này; `description` giữ
  nguyên nên Iron Law's phép thử từ khóa tại `approve` vẫn chạy đúng như
  thiết kế bất kể `risk` bị đổi sau đó.

### Iron Law — phân loại rủi ro của một candidate fix (self-improve loop STR13 Slice 2/3)

Bước phán-rủi-ro của vòng tự cải thiện (CONTEXT.md D5/D10/D13/D14): trước khi
một fix cho một candidate được phép BỎ QUA kỷ luật "chứng minh bằng test đỏ
trước" (failing-test-first), hệ tự hỏi hai câu — fix này có chạm module có
NĂNG LỰC làm yếu chính kỷ luật gate/verify của hệ không (D10), và mô tả của
fix có mang từ khóa thuộc nhóm cờ rủi ro nặng không (D5)? Trả lời CÓ ở BẤT KỲ
câu nào → Iron Law áp dụng, fix phải tự chứng minh bằng test đỏ trước khi
được coi là xong.

- **Runs when:** gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội
  bộ, trên), ngay TRƯỚC bước kiểm cây sạch và trước mọi thao tác git — mỗi
  lần một đề xuất nguồn runner được duyệt (self-improve loop STR13 Slice 3,
  D16/D17), bất kể đề xuất đó tới từ `evolve --submit` hay từ `add`/`submit`
  thường (D16: chung cho MỌI đề xuất nguồn runner, không riêng gì evolve).
  **Ranh giới CHỦ Ý:** chỉ đề xuất nguồn `runner` mới đi qua phép thử này —
  đề xuất nguồn `pull`/`legacy` (code đã do chính người tự tay commit thẳng
  lên main qua cửa `take`/`return`, xem thang bền vững) không đi qua đường
  này; đây là một ranh giới đã xác nhận có chủ đích, không phải một khoảng
  trống bị bỏ sót (per D16, xem RUL37).
- **Blocked when:** không áp dụng — đây là hàm thuần, không có trạng thái để
  chặn. (Điểm chặn thật, bằng KẾT QUẢ hàm thuần này, nằm ở `approve` — xem
  "Cổng duyệt PR nội bộ" trên.)
- **What changes:** không gì ở tầng trạng thái — đây là một phép TÍNH thuần
  trên hai đầu vào (danh sách file candidate fix chạm tới, mô tả tùy chọn của
  fix), trả lại một phán quyết CÓ/KHÔNG kèm bằng chứng (đúng cờ nào, đúng
  module nào khớp) — không phải chỉ một boolean trơ.
  - Phép thử module (D10, mở rộng D14): file chạm được CHUẨN HÓA path
    (`./x` và `x` khớp như nhau; một `..`-traversal thoát khỏi thư mục được
    bảo vệ đúng đắn KHÔNG khớp — chuẩn hóa chỉ gỡ bỏ khớp-thừa, không bao giờ
    làm sót một khớp thật, review-20260717-self-improve-base-workflow finding
    F1) rồi so vào danh sách minh họa — mọi file trong nhóm điều-phối-runner,
    module tính-điểm-entropy, mọi file trong nhóm tự-cải-thiện (chính vòng
    evolve), toàn bộ file điểm-vào CLI (thay đổi bất kỳ đâu trong đó bị coi
    là chạm — cố ý rộng hơn thực tế, hướng AN TOÀN hơn là bỏ sót), module
    lưu-trữ sự-kiện lõi, module máy-trạng-thái lõi. Kết quả trả về (`matchedModules`)
    vẫn giữ NGUYÊN VĂN path gốc người gọi truyền vào (không phải bản đã chuẩn
    hóa), để thông điệp từ chối nói đúng cái người gọi thấy. Danh sách này
    MINH HỌA, không đóng khung (D10) — module năng-lực-liên-quan khác ngoài
    danh sách vẫn có thể cần Iron Law theo phép thử năng lực gốc của D10,
    một giới hạn còn lại đã ghi nhận (xem Open Gaps). `filesChanged` chứa một
    phần tử không phải string, hay `description` không phải string/vắng mặt,
    đều bị từ chối bằng lỗi validation sạch (không crash thô).
  - Phép thử từ khóa (D5, mở rộng D14): mô tả fix (nếu có cung cấp) được so
    khớp không phân biệt hoa/thường với một bộ từ khóa rủi-ro-nặng dùng
    CHUNG với bước phân loại submission lúc `fgos submit` (cùng một nguồn dữ
    liệu, không hai danh sách lệch nhau theo thời gian) — bộ này phủ cả sáu
    nhóm cờ đã khóa (bảo mật/xác thực, phân quyền, mất dữ liệu, kiểm toán,
    hệ thống ngoài, bỏ kiểm tra). Mô tả VẮNG MẶT không bao giờ được coi là
    "an toàn" — phán quyết vẫn tính đủ từ phép thử module.
- **Side effects:** không có — hàm thuần tuyệt đối, không đọc/ghi gì ngoài
  hai tham số truyền vào.
- **Afterwards:** `approve` nhận lại phán quyết kèm bằng chứng (đúng cờ/module
  nào khớp); `required: true` thiếu `--acknowledge-iron-law` → `approve` từ
  chối ngay trong cùng lượt gọi, thông điệp nêu tên đúng cờ/module đã khớp,
  không git nào chạy, đề xuất giữ nguyên `proposed`; `required: true` kèm cờ,
  hoặc `required: false` — `approve` đi tiếp đúng đường merge/verify bình
  thường ở "Cổng duyệt PR nội bộ" trên, không đổi hành vi.

### Tín hiệu compounding qua check (entropy-trend + seal-digest)

Ngoài mục outcome/friction/settlement/học đã có, `fgos check` (lệnh đọc-thuần
dùng chung với Work-State — xem spec Work-State) còn tổng hợp một tín hiệu
sức khỏe cho toàn bộ vòng compounding.

- **Runs when:** mỗi lần `fgos check` được gọi (có id hay không).
- **Blocked when:** không có điều kiện chặn riêng — cùng hợp đồng lỗi với
  `check`, đọc thuần.
- **What changes:** không có event nào vào nhật ký sự kiện (đây vẫn là một
  lệnh đọc) — riêng lần chạy này tự thêm đúng MỘT dòng vào một lịch sử xu
  hướng nằm CÙNG chỗ với dữ liệu của kho đang được đọc (không phải nhật ký sự
  kiện, không đi qua cửa ghi work-state). Đọc baseline (dòng cuối của lịch sử
  xu hướng) chịu được một dòng cuối bị TORN (crash/ghi dở giữa chừng, per
  `readLastHistoryEntry` bin/fgos.mjs): lùi ngược từ dòng cuối, bỏ qua mọi
  dòng không parse được, dùng checkpoint HOÀN CHỈNH gần nhất làm baseline —
  một dòng cuối rách không bao giờ làm `check` throw, cùng độ khoan-dung
  "thiếu/hỏng dữ liệu đọc như baseline, không bao giờ crash" mà nhánh
  file-vắng-mặt đã có sẵn.
- **Side effects:** một dòng mới trong lịch sử xu hướng; không có lời gọi
  model nào.
- **Afterwards:**
  - Một **điểm entropy** có trọng số cho work-state hiện hành, cộng dồn từ
    năm tín hiệu, mỗi tín hiệu luôn giải thích được (không bao giờ một con số
    trần trụi): item ở trạng thái cuối (đề xuất/đỗ/xong) mà thiếu nửa
    thực-tế của kết quả (trọng số nặng nhất), item hiện đang "doing" (snapshot
    tại thời điểm check, không có ngưỡng thời gian riêng — trọng số nặng
    ngang hàng), item còn ở stage `clarify` (trọng vừa), một bản ghi friction
    chưa có settlement nào theo sau trên CÙNG id (trọng nhẹ), item đang đậu
    chờ người (trọng nhẹ).
  - Điểm này LUÔN đi kèm **so với lần `check` gần nhất** — lần đọc đầu tiên
    là baseline (chưa có gì để so); mọi lần sau in kèm phần chênh lệch thật.
  - Một dòng **seal-digest** tóm tắt những gì đã "gộp thêm" kể từ lần `check`
    trước: số kết quả mới có nửa thực-tế, số friction mới, số settlement
    mới — mỗi mệnh đề chỉ bị bỏ qua khi CẢ số đếm hiện tại VÀ phần chênh lệch
    của nó đều bằng 0; một kênh có dữ liệu tồn tại nhưng không đổi từ lần
    trước vẫn in ra, dưới dạng "không đổi" (giá trị 0), chỉ kênh thật sự
    trống mới im lặng hoàn toàn.
  - Kho chưa từng có việc nào → toàn bộ tín hiệu này vắng mặt, `check` không
    tự khởi tạo bất cứ gì — giữ nguyên hợp đồng đọc-thuần.

### Phiên checkout đa-phiên — session start / end / list

Một **phiên** (session) là chỗ làm việc cô lập, TÙY CHỌN, gắn với đúng một
việc: mỗi phiên có một git worktree riêng cho cây nguồn git-tracked, trong khi
kho `.fgos/` (nhật ký sự kiện đã commit + view + logs) vẫn là MỘT chỗ vật lý
duy nhất chia sẻ cho mọi phiên và cây chính. Sinh ra để nhiều phiên `fgos`
chạy đồng thời trên cùng một checkout không còn thấy thay đổi chưa-commit của
nhau qua phép kiểm cây-sạch (approve/return). Epic 1 dựng vòng đời worktree +
sổ đăng ký. Epic 2 nối verb `approve` vào sổ đăng ký ở dạng CHẶN, KHÔNG phải
thích ứng: `approve` chạy TỪ TRONG một worktree phiên bị TỪ CHỐI sạch (xem
"Bảo vệ approve khỏi lồng phiên" dưới) — vì một worktree phiên về cấu trúc là
chỗ SAI để một merge-vào-main xảy ra. `return` KHÔNG cần đổi: phép kiểm tiến-độ
của nó (`aheadCount` + `verify`) vốn đã đúng khi chạy từ trong worktree phiên
(spike-proven), nên chạy `return` từ trong phiên vẫn hành xử y hệt mọi chỗ khác.

- **Runs when:** người vận hành/một tác nhân gọi `fgos session start
  [--item <id>]` / `fgos session end <session-id> [--force]` / `fgos session
  list`.
- **Blocked when:** thiếu sub-verb, hoặc sub-verb lạ — `validation`; `session
  end` thiếu session-id — `validation`; `session end <id>` với id không có
  trong sổ (hoặc đã kết thúc) — `validation`; `session end <id>` khi HEAD của
  worktree đã RỜI khỏi commit khởi tạo (có commit tạo ra TỪ TRONG worktree
  detached — một commit lửng, không nhánh nào chứa) mà KHÔNG có `--force` —
  `validation`, và thông báo nêu ĐÍCH DANH (các) sha lửng, tuyệt đối không xóa
  âm thầm; mọi lỗi vòng đời phiên khác (git thất bại, v.v.) cũng quy về
  `validation` (một mã thoát phân loại sạch, không bao giờ nổ trần).
  `--force` bỏ qua phép kiểm rời-commit và vẫn gỡ.
- **What changes:**
  - `session start` — mở đúng MỘT worktree mới qua `git worktree add --detach`
    trên HEAD hiện tại (KHÔNG nhánh mới — detached HEAD thật, khác hẳn
    `fgw/<id>` của runner vốn luôn tạo nhánh mới), tại một đường tạm; tạo một
    symlink `<worktree>/.fgos` trỏ về `.fgos/` thật của cây chính (D10 — KHÔNG
    BAO GIỜ sao chép, luôn symlink); ghi một mục `{ sessionId, worktreePath,
    itemId, startCommit, pid, startedAt }` vào sổ `.fgos/sessions.json`.
    Phiên KHÔNG lồng nhau: gọi `start` từ TRONG một worktree phiên đã đăng ký
    bị từ chối.
  - `session end` — gỡ worktree và bỏ mục sổ của nó. Một phiên không rời-commit
    gỡ bằng `git worktree remove` THƯỜNG (dựa vào chính phép từ-chối cây-bẩn
    của git làm lưới an toàn nền); chỉ `--force` mới dùng `--force`. KHÔNG BAO
    GIỜ xóa `.fgos/` — chỉ symlink (nằm trong worktree đang bị gỡ) biến mất
    theo.
  - `session list` — đọc thuần sổ đăng ký, in mỗi phiên một dòng (id / đường
    worktree / item / thời điểm mở).
- **Side effects:** mọi đọc-sửa-ghi `sessions.json` được canh bởi một khóa
  RIÊNG `.fgos/sessions.lock` (tạo-nguyên-tử `wx` + đòi-lại-pid-chết, soi theo
  `acquireRunnerLock` của loop.mjs như một cơ chế MỚI, TÁCH BẠCH — không bao
  giờ đụng `runner.lock`) an toàn giữa nhiều tiến trình `fgos` độc lập; write-
  queue trong-tiến-trình KHÔNG dùng ở đây (nó chỉ tuần tự hóa ghi async trong
  MỘT tiến trình Node, cho zero bảo vệ liên-tiến-trình). `session start`/`end`
  chạy `git worktree add/remove`; `list` không chạm git.
- **Afterwards:** `session start` in đường worktree để tác nhân `cd` vào và một
  session-id để về sau `end`; chạy `fgos` trực tiếp ở cây chính mà KHÔNG bao
  giờ gọi `session start` vẫn hành xử y hệt hôm nay (D7 — tùy chọn, không có
  phiên = không đổi gì); một commit lửng bị `end` giữ lại (chờ `--force`) để
  người quyết định, không mất âm thầm.

### Bảo vệ approve khỏi lồng phiên (session-nesting guard, Epic 2)

`approve` (KHÔNG `--github`) TỪ CHỐI chạy khi `cwd` nằm trong một worktree
phiên đã đăng ký, TRƯỚC mọi lệnh git và trước cả lần chạy `verify`/goal-check
nào — đề xuất giữ nguyên `proposed`, main không đụng. Một refusal duy nhất
canh CẢ HAI nguồn không-github, mỗi nguồn nguy theo cách riêng:

- **Nguồn `runner`:** merge chạy với `cwd` là worktree phiên detached-HEAD sẽ
  đáp xuống chính HEAD của worktree đó, KHÔNG BAO GIỜ tới `main` (spike-proven,
  `.bee/spikes/fgos-multi-session-checkout/epic2-approve-from-session-worktree-probe.sh`)
  — một item bị đánh dấu "đã duyệt" mà code không hề vào main, không lỗi nào nổ.
- **Nguồn `pull`/`legacy`:** đường này chạy goal-check trên bất kỳ thứ gì `cwd`
  đang checkout rồi đánh dấu `done` với thông điệp "verified on main". Worktree
  phiên đứng ở `startCommit` (chụp lúc mở phiên) — nếu `main` đã tiến lên từ đó,
  đây sẽ verify code CŨ trong khi tuyên bố đã kiểm main, vẫn đánh dấu xong — một
  xác minh SAI âm thầm.

Cả hai nhận đúng một refusal (cùng khuôn lỗi, cùng chỉ dẫn), nêu ĐÍCH DANH
session-id đang lồng và bảo chạy `approve` từ cây chính hoặc `fgos session end
<id>` trước. Phép kiểm khớp `cwd` với từng `worktreePath` trong sổ (realpath cả
hai vế qua một wrapper `try realpathSync / catch → path.resolve` — bản sao CỤC
BỘ trong `bin/fgos.mjs`, KHÔNG import từ `session.mjs`: một mục sổ có worktree
đã biến mất khỏi đĩa không được phép làm `fs.realpathSync` trần đánh sập approve
cho MỌI người gọi, kể cả từ cây chính), khớp hoặc lồng dưới qua tiền tố nối
`path.sep`. `approve --github` CŨNG chạy qua chặn này — cả chặn sổ đăng ký
này lẫn chặn cấu trúc `isMainWorktree` dưới đều chạy TRƯỚC nhánh `--github`,
vì một merge qua GitHub tuy không đụng cây cục bộ vẫn cần `cwd` đúng là cây
chính để trạng thái `done` không lạc vào một worktree khác trong khi GitHub
đã báo PR merged.

**Bổ sung hành vi (ghi nhận, không phải byte-identical):** vì phép kiểm gọi
`listSessions(repoRoot)`, một kho CHƯA từng dùng phiên (`sessions.json` vắng,
`listSessions` trả `[]`) hành xử y hệt trước — nhưng một kho ĐÃ có lịch sử
phiên nay khiến MỌI lần `approve` chiếm `.fgos/sessions.lock` (một `sessions.json`
hỏng nay ném lỗi; một khóa cũ kẹt thêm tối đa ~10s trễ). Đây là một bổ sung
hành vi được chấp nhận, không nói dối là "y hệt từng bit".

**Rủi ro còn lại (deferred, không vá ở Epic 2 — một phần đã vá khác lớp bởi STR65):**
phép kiểm dựa trên SỔ đăng ký nên KHÔNG bắt được một `git worktree add` thủ công
chưa từng đăng ký qua `fgos session start` — `approve` chạy từ một worktree
không-đăng-ký như vậy vẫn dính đúng mối nguy xác-minh-sai của nguồn `pull`/`legacy`,
vô hình MỘT MÌNH theo cơ chế NÀY (`isMainWorktree`, canh riêng verb `approve`). Vá
trọn CHO VERB NÀY cần xác nhận DƯƠNG rằng `repoRoot` ĐÚNG là worktree chính (vd
`git rev-parse --show-toplevel` so với cha của `--git-common-dir`) — một đổi thiết
kế vượt lát này vẫn chưa xây (xem CONTEXT.md Deferred Ideas). Lớp bảo vệ riêng, rộng
hơn — "Khóa hoạt động cây chính" dưới (STR65) — đã đóng phần lớn khoảng trống THỰC
TẾ này từ một góc khác: nó canh MỌI commit trần vào cây chính (không riêng gì
`approve`, không cần sổ đăng ký nào), nên một `git worktree add` thủ công không
đăng ký vẫn bị khóa hoạt động phát hiện nếu nó thực sự commit đè lên phiên khác —
gap còn lại thu hẹp về đúng một verb (`approve`) và đúng loại lỗi (xác-minh-sai âm
thầm, không phải mất dữ liệu).

### Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65)

Khác với "Bảo vệ approve khỏi lồng phiên" trên (chỉ canh MỘT verb, `approve`, và chỉ
canh phiên đã đăng ký qua sổ `session start`), cơ chế này canh MỌI `git commit` trần
vào cây chính (dù qua verb fgOS nào, qua một trợ lý, hay tay gõ thẳng) và không phụ
thuộc sổ đăng ký — vá đúng lỗ hổng "một `git worktree add` thủ công chưa từng đăng ký"
mà rủi ro-còn-lại ở trên nêu tên.

- **Runs when:** mọi lần `git commit` chạm cây chính — dù người gõ tay, một trợ lý,
  hay CI — đi qua một hook cài sẵn ở tầng git (không phải một verb fgOS, không phải
  một cấu hình riêng của công cụ trợ lý nào).
- **Blocked when:** một khóa hoạt động ghi rằng một danh tính KHÁC đã chạm cây chính
  này trong cửa sổ gần đây (mặc định 15 phút) — commit bị từ chối thẳng, không chạy;
  hoặc khóa không đọc được (hỏng/không phân tích được) — commit CŨNG bị từ chối (thà
  chặn nhầm còn hơn để lọt một race thật).
- **What changes:** khi cây chính đang rảnh, hoặc khi CHÍNH danh tính đang commit là
  danh tính đã ghi khóa gần nhất (cùng phiên tiếp tục làm việc), commit đi qua bình
  thường, không thông báo gì. Danh tính ưu tiên biến môi trường phiên trợ lý khi có;
  vắng mặt (terminal tay gõ) thì suy ra từ một tiến trình tổ tiên gần đó — suy đoán
  tốt-nhất, không tuyệt đối (hai terminal tay gõ chia sẻ cùng tiến trình cha gần có
  thể không phân biệt được nhau — xem Open Gaps).
- **Side effects:** ghi lại khóa hoạt động (danh tính + thời điểm) ngay tại chính cây
  chính, dùng đúng cơ chế tạo-nguyên-tử + đòi-lại-pid-chết đã có ba lần trong hệ (xem
  "Phiên checkout đa-phiên" trên) — không đụng sổ đăng ký phiên, không đụng khóa
  `sessions.lock`/`runner.lock`/`events.lock` nào đã có.
- **Afterwards:** một commit bị từ chối in thông điệp giải thích bằng thời gian ("một
  phiên khác dường như đang hoạt động ở đây gần đây") và trỏ người tới đúng cách mở
  một cây làm việc cô lập — không bao giờ in ra một định danh thô (pid/session-id) như
  thể đó là thứ người đọc cần tự hành động theo.

### Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50)

Khi một phiên trợ lý (người hoặc agent) mở repo để làm một item qua vòng đời của nó, phiên tự định vị bằng một entry skill đọc `stage` hiện tại của item rồi trỏ tới đúng skill giai đoạn kế tiếp — không có nghi thức khởi động nào khác ngoài đọc verb đọc-thuần (`list`/`ready`) rồi vào việc qua cửa pull `take` (per D10 p50-workflow-induct). Bản đồ giai đoạn: skill `làm-rõ` hoạt động ở stage `clarify` — nó sàng lọc câu hỏi thật qua ba phép thử (chất-liệu/có-căn-cứ/trả-lời-được) trước khi hỏi người; câu hỏi không đạt sàng lọc (vd một lựa chọn chỉ ảnh hưởng người-triển-khai, không ảnh hưởng phạm vi sản phẩm) được ghim thành một giả định thay vì tạo cổng chờ-người. Skill `chia-việc` hoạt động ở nửa đầu stage `decompose`; skill `thẩm-định` hoạt động ở nửa cuối, gác cạnh `decompose→executing` — một thẩm định thất bại quay lại `chia-việc`, không bao giờ tự nhận đã qua. Bước chuyển stage thật sự (đánh giá item đã đủ rõ/đủ khả thi hay chưa) luôn là verb máy của engine, không phải chính skill — skill không bao giờ tự áp cạnh chuyển-trạng-thái (per D8, cùng stance "trí tuệ không cầm picker" của RUL42 áp dụng tương tự ở lớp hướng dẫn này — chính `fgos-routing/SKILL.md` cũng nêu tường minh nguyên tắc này trong mục "Precedence: the engine's verb always wins" của nó). Một cổng chờ-người thật (engine tự phán không đủ rõ) không bao giờ được chính vòng skill tự trả lời — nó luôn escalate ra ngoài phiên, chờ người quyết (per D11, mở rộng nguyên tắc "không tin lời trợ lý"/"không tự quyết thay người" của RUL3 sang lớp hướng dẫn này). Toàn bộ vòng này chỉ dùng lại các verb/trạng thái đã có — không có event, stage, hay domain mới nào cho lớp hướng dẫn (per D2/D3/D6/D7 p50-workflow-induct).

Chứng minh vận hành thật (case-study, 2026-07-20): một item thật (thêm một hàm mới vào một dự án đồ chơi dogfood) đi trọn `submit → clarify (entry skill → skill làm-rõ, một câu hỏi bị lọc không đạt sàng lọc, không tạo cổng chờ-người) → engine tự phán "chưa đủ rõ" (cổng chờ-người THẬT, không phải kịch bản dàn dựng — nguyên nhân: một lời gọi phán-đoán lồng bên trong một phiên trợ lý đang chạy trả về văn xuôi thay vì phán quyết máy-đọc-được, xem Open Gaps) → escalate ra ngoài, không tự trả lời → người trả lời thật → engine tự phán "đủ rõ" → decompose (skill chia-việc → skill thẩm-định, thẩm-định gắn cờ "đạt kèm ràng buộc") → executing → cài đặt thật → trả việc (bắt được một lỗi thật khác: chuỗi lệnh xác nhận do skill chia-việc đề xuất giả định sai thư mục làm việc — sửa tại chỗ qua verb sửa-trường sẵn có, một sai lệch thật chứ không phải giả lập) → duyệt → xong, không chạm bất kỳ cơ chế riêng nào của công cụ điều phối bên ngoài dự án.

### Báo việc-phát-hiện từ trợ lý (worker→runner discovery report)

Trong lúc thi công một item, trợ lý CÓ THỂ nhận ra một việc mới đáng tách ra thành item riêng — một việc kéo theo, một phụ thuộc mới lộ ra, hoặc một mối lo nên tách khỏi việc đang làm. Trợ lý KHÔNG được phép tự ghi việc đó vào work-state (nguyên tắc một-người-ghi giữ nguyên tuyệt đối cho kênh này — xem "Ai ngã-ngũ" ở trên): nó chỉ được BÁO — đưa một mô tả có cấu trúc của việc phát-hiện vào chính output của mình, thuần dữ liệu, không phải một lệnh ghi.

Sau khi lượt dispatch của item đó KẾT THÚC — dù kết cục là thành đề xuất, chấm-trượt, quá-giờ, hay hỏng — runner đọc lại output đã ghi được của trợ lý, tách ra mọi báo-cáo hợp lệ, rồi TỰ MÌNH tạo một item mới cho mỗi báo-cáo (runner vẫn là bên duy nhất ghi, không đổi), đóng dấu dòng dõi PHÁT-HIỆN của item mới trỏ về đúng item đang thi công (xem spec Work-State Data Dictionary #22). Việc tách-báo-cáo này chạy ĐÚNG MỘT LẦN cho mỗi lượt dispatch, tại đúng thời điểm kết thúc — không chạy lại giữa các lần thử nội bộ của cùng một lượt — nên một lượt chạy không ổn định lặp lại cùng một báo-cáo nhiều lần trước khi kết thúc không tạo ra nhiều bản.

Một báo-cáo hỏng-hình (không phân tích được, thiếu tên việc) bị âm thầm bỏ qua — không bao giờ làm hỏng hay đổi kết cục của chính lượt dispatch đang xét. Item mới tạo ra vào hệ như một item bình thường ở giai đoạn đầu vào tiêu chuẩn — không có niềm tin đặc biệt, chịu cùng vòng xét-lại/làm-rõ như mọi item khác.

**Kỷ luật S10 (chống lạm dụng + chống trùng lặp, review-fix 2 P2):**
- **Trần mỗi lượt.** Một lượt dispatch chỉ hành động trên một số lượng báo-cáo GIỚI HẠN — output vượt trần chỉ tạo đúng số item bằng trần, phần dư bị bỏ qua có ghi lại, không bao giờ ảnh hưởng tới kết cục của chính lượt dispatch. Chặn đường một trợ lý bất thường (hay bị chèn lệnh từ nội dung không đáng tin nó đọc phải) sinh ra vô hạn item.
- **Chống trùng lặp.** Một báo-cáo ĐÃ được ghi nhận trước đó (cùng dòng dõi phát-hiện + tên việc khớp, không phân biệt hoa/thường/khoảng trắng) không tạo item thứ hai — dù báo-cáo đó lặp lại hai lần trong CÙNG một output, hay item nguồn được nhận lại và chạy một lượt SAU tự báo lại đúng báo-cáo đã ghi nhận. Hai việc có tên KHÁC NHAU thật sự vẫn cả hai đều được tạo — phép so khớp không vơ trùng những gì không trùng.

## Actors & Access

| Capability | Người vận hành | Runner | Worker (trợ lý nền) |
|---|---|---|---|
| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |
| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |
| Commit trong worktree/nhánh riêng | — | — | ✓ |
| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |
| Đồng bộ lại một việc đỗ vì gãy nhập (`catchup`) | ✓ | — | — |
| Xếp hạng/xem candidate tự cải thiện (Gate A, `evolve`) | ✓ | — | — |

## Business Rules

- **RUL1.** Trong vòng dispatch, runner là người ghi duy nhất qua một cửa; worker không bao giờ tự ghi trạng thái (per D3 phase-2-routing / feed7428).
- **RUL2.** Kết quả worker là ĐỀ XUẤT mức bền D1: commit trên nhánh `fgw/`, phải qua người duyệt mới thành `done`; không bao giờ tự merge (per D4; auto-merge là backlog STR9).
- **RUL3.** Runner tự chạy proof của việc làm goal-check — lời trợ lý không bao giờ là bằng chứng (per D3).
- **RUL4 (giao việc theo mẻ, giới hạn hai tầng, quyền-sở-hữu-gốc giữ nguyên trong lượt chạy).** Một lượt chạy giao TỐI ĐA N việc cùng lúc, giới hạn qua cấu hình hai tầng — số gốc đồng thời × số con đồng thời mỗi gốc (Data Dictionary #6); mọi con của MỘT gốc luôn về tay cùng một chủ trong suốt một lượt chạy (Data Dictionary #7, xem RUL26); dispatch nạp lại mẻ tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng. Chống-lặp qua vận hành thật (A1) là điều kiện đã chứng minh TRƯỚC khi song song được dựng — không còn là một ngưỡng-tên treo chờ (per D5/D10/D13/D14/D15 fan-out-parallel / 2e92b7a5).
- **RUL5.** Model chọn theo tier của việc qua bảng cấu hình (per D6); tập tier reconcile một nguồn tại đây.
- **RUL6.** Chống đỡ bằng CHỈ DẪN + nhánh-vứt-được, KHÔNG phải sandbox OS/container. Worker headless chạy dưới tập quyền TỐI THIỂU khai tường minh trong `.fgos-runner.json` `executor.args`: `--permission-mode acceptEdits` (tự nhận sửa file) cộng đúng `--allowedTools "Bash(git add:*),Bash(git commit:*)"` — không rộng hơn; `--dangerously-skip-permissions` bị BÁC có chủ đích (worker chỉ cần sửa-file + commit trong worktree, prompt đã cấm merge/push/tự gọi fgos, và goal-check không tin lời trợ lý — RUL13 — nên quyền rộng hơn là rủi ro không cần) (per worker-execution / 22699c61, 04a6cd05). Root cause spike-proven (2 biến thể, claude CLI thật): thiếu allowlist này, headless `claude -p` sửa file được nhưng `git commit` treo vô thời hạn chờ duyệt tương tác → nhánh đề xuất luôn rỗng, dispatch luôn đỗ. Bất biến phải giữ: work item (nhất là trường proof — được chạy như lệnh shell) do chính người dùng tạo; không bao giờ nạp việc từ nguồn ngoài khi chưa có vòng kiểm (security panel, ghi trong hợp đồng handoff).
- **RUL7.** Lớp lỗi lạ → dừng, không bao giờ mặc định thử-lại (fail-safe).
- **RUL8.** Bước gặt-lại làm chạy-lại-sau-crash an toàn tự thân: không việc nào vô hình, không commit đôi, không worktree rò (reliability panel — 3 blocker vá trước khi code).
- **RUL9 (thực thi khi dev).** Mọi kiểm chứng chạy trong Claude Code bằng subscription: suite dùng executor giả (0 token), worker thật qua claude CLI login. API key chỉ hợp lệ khi tính năng đang test là executor-cắm-ngoài, và là key của môi trường người dùng (per 774b73ef).
- **RUL10 (diễn tập không chạm log thật).** Nhật ký sự kiện append-only bất biến → một event diễn tập lọt vào là rác vĩnh viễn: canary/drill LUÔN chạy trên repo mồi dùng-xong-vứt; chỉ dogfood việc-thật mới ghi log thật — và đó là lịch sử vận hành chủ đích (per f3a16887).
- **RUL11 (thang kiểm chứng).** T0 suite executor-giả mọi commit · T1 dogfood việc thật hằng ngày · T1c canary khai-môi-trường (worker tự báo pwd/git-root/doctrine nó thấy, verify assert từng dòng) định kỳ và sau mỗi đổi harness · T2 máy-trắng (HOME giả + credential tối thiểu) trước release (per f3a16887). Bất biến nền: mỗi agent khởi đầu tại project-root CỦA NÓ — thợ ở xưởng, worker ở git-root của worktree nó đứng.
- **RUL12 (khoá liên-tiến-trình).** Mỗi kho chỉ một runner sống tại một thời điểm: đầu MỌI lần chạy (trước cả bước gặt-lại — gặt cũng ghi trạng thái), runner chiếm khoá độc quyền trong vùng trạng thái, ghi định danh tiến trình của mình. Kho đang có runner sống → lần chạy mới thoát «bận» bằng mã thoát riêng (không trùng mã nào hiện hành): không ghi trạng thái, không đụng worktree, không đụng khoá của người giữ. Khoá của runner đã chết (crash để lại, hoặc nội dung không chứng minh được chủ sống) → **dọn-rồi-nhường**: kiểm nội dung sát trước khi xoá (đổi rồi thì không đụng), xoá xong lượt đó vẫn lui ra «bận» — không lượt chạy nào vừa xoá khoá vừa tự chiếm trong cùng một lần, nên hai lượt cùng gặp khoá chết không thể cướp khoá mới của nhau; lượt kế tiếp chiếm khoá sạch (sau crash, phục hồi trọn trong hai lượt). Khoá luôn được nhả trên mọi đường thoát.
- **RUL13 (vòng dự đoán-thực tế, học từ cả thành công lẫn thất bại).** Mỗi lần dispatch, runner ghi bản ghi outcome ở CẢ hai đầu: nửa dự đoán lúc nhận việc, nửa thực tế ở MỌI kết cục cuối — thành đề xuất, bị đỗ, hay bị dừng — không bao giờ chỉ ghi khi thành công. Giá trị thực tế luôn lấy từ phép đo goal-check/kiểm nhánh của chính runner, không bao giờ từ báo cáo tự khai của trợ lý (per D2/D3 phase-3-compound-learning / 1a80b4d3; mở rộng nguyên tắc "không tin lời trợ lý" đã khóa ở RUL3). Bản ghi outcome đọc lại được qua lệnh đọc-thuần `fgos check` của tầng Work-State — runner không có verb ghi riêng cho việc này.
- **RUL14 (quét làm-rõ chạy trước dispatch, bất kể mode).** Mỗi lượt chạy, ngay sau gặt-lại và trước khi tìm việc thi công, runner quét TOÀN BỘ item đang ở stage thỏa bước Làm-rõ của domain của chính nó (`clarify` cho `coding`) + `status: todo` và tự chạy context-discovery — không đọc/không rẽ nhánh theo field `mode` của item (per D5/D13 stage-clarify / 9a19eea5, xem RUL17-RUL19 (work-state)). Never chạm item `awaiting-human` — cùng luật loại-trừ RUL6 (work-state)/RUL15 (work-state) áp cho cả bước quét này. Đây là lưới đỡ: phiên submit sống chết giữa chừng không để lại việc kẹt vô hình. Quét này khớp domain qua step-mapping thật, không khớp nhầm một domain KHÔNG có stage-Làm-rõ với `stage` vắng mặt của chính item đó — hai giá trị vắng mặt không được coi là bằng nhau (per base-workflow-model 1cd895e1/38160a70, xem spec Work-State "Mô hình domain").
- **RUL15 (actor trên mọi ngã-ngũ tự động của runner).** Mọi ngã-ngũ mà runner TỰ ghi trong vòng dispatch (quét làm-rõ cho qua, quét chia-việc cho qua, nhận việc, đề xuất, đỗ) mang `actor` = `runner`; ngã-ngũ do phiên sống gọi tay context-discovery/phán chia-việc mang `actor` = `session`; ngã-ngũ do người gọi qua lệnh CLI mang `actor` = `human` — ba giá trị phủ hết mọi đường ngã-ngũ hiện có, không đường nào bị bỏ sót (per D2 phase-3-compound-learning S3-closeout / 96a65365; xem spec Work-State "Bản ghi settlement").
- **RUL16 (điểm entropy luôn giải thích được + luôn kèm xu hướng).** Điểm entropy trên `check` không bao giờ là một con số đơn độc — luôn kèm các thành phần đã cộng nên nó, và luôn so với lần `check` gần nhất (lần đầu là baseline). Seal-digest chỉ im lặng một mệnh đề khi kênh đó thật sự không có gì để nói (số đếm hiện tại VÀ chênh lệch đều bằng 0) — một kênh có dữ liệu nhưng không đổi từ lần trước vẫn in ra "không đổi" (per D2 phase-3-compound-learning S3-closeout / 96a65365).
- **RUL17 (quét chia-việc chạy ngay sau quét làm-rõ, trước dispatch, bất kể mode).** Mỗi lượt chạy, ngay sau quét làm-rõ và trước khi tìm việc thi công, runner đọc lại view tươi rồi quét TOÀN BỘ item `stage: decompose` + `status: todo` và tự chạy phán chia-việc — không đọc/không rẽ nhánh theo field `mode` của item. Never chạm item `awaiting-human` — cùng luật loại-trừ RUL6 (work-state)/RUL15 (work-state) áp cho bước quét này. Đọc view tươi sau quét làm-rõ nghĩa là một item vừa rời clarify trong CÙNG lượt chạy vẫn được quét chia-việc ngay, không đợi lượt sau (per D2 stage-decompose / 43f257ae, xem spec Work-State "Giai đoạn Chia-việc").
- **RUL18 (gặt-lại claim-actor-aware — không giẫm người/phiên cầm qua cửa pull).** Bước gặt-lại lúc khởi động CHỈ gặt claim mà chính runner đã tạo và crash giữa chừng; một item `doing` mang `claimActor` `human`/`session` (đến từ `fgos take` — spec Work-State "Cửa pull giao–nhận việc") không bao giờ bị reclaim, dù nó không mang commit/proof nào — người/phiên cầm việc vô thời hạn cho tới khi chính họ `fgos return`. Đây là một THU HẸP thuần túy của tập item vốn đã bị reap — không mở rộng, không giảm an toàn của gặt-lại cho claim của chính runner (per D1 stage-decompose, chốt tại validating sau 1 BLOCKER / 43f257ae, 6f2cbc47, a30a3d3c).
- **RUL19 (`return` mirror trung thực contract `proposed` của runner, không tin lời).** Cửa pull `return` chỉ chuyển `doing → proposed` sau khi TỰ đo — không tin báo cáo của người gọi — cả ba: working tree host repo sạch, HEAD tiến so `headAtTake` ghi lúc `take`, và verify thật của item chạy xanh qua CÙNG hàm goal-check runner dùng (`runGoalCheck`, `src/runner/goal-check.mjs`) — mở rộng nguyên tắc "không tin lời trợ lý" đã khóa ở RUL3/RUL13 sang tác nhân cửa pull. Verify đỏ đi đúng đường `blocked` + friction lớp `verification`, y hệt đường đỗ chấm-trượt của chính runner; không sinh settlement ở `return` (settlement thuộc cạnh `→done`, per D4 stage-decompose — xem spec Work-State) (per D1 stage-decompose / 43f257ae, 6f2cbc47, a30a3d3c).
- **RUL20 (cổng duyệt là cửa MỘT DUY NHẤT cho mọi đề xuất, bất kể nguồn).** `review`/`approve`/`reject` hành động trên CẢ hai nguồn đề xuất — runner (nhánh `fgw/<id>`) và pull-door (dải `headAtTake→headAtReturn`) — qua cùng một luật, không hai bộ quy tắc song song; đề xuất di sản (thiếu cả nhánh lẫn cặp head) degrade trung thực (một cảnh báo, không throw) thay vì bị từ chối hoàn toàn (per D4 pr-lifecycle / 1359ab5e).
- **RUL21 (merge sạch → done tự động; gãy → hủy sạch merge dở + blocked có lý do).** `approve` trên nguồn runner không bao giờ để main ở trạng thái merge dở trên bất kỳ đường thoát nào: conflict hoặc verify đỏ sau merge đều `git merge --abort` (main nguyên vẹn byte-for-byte, chứng minh bằng spike + test thật) rồi đậu item ở `blocked` mang lý do cụ thể (`merge-conflict`/`verify-fail-post-merge`) — KHÔNG tự rebase, KHÔNG halt cả vòng runner. `done` qua approve luôn mang actor `human` (per D3 pr-lifecycle / 1359ab5e — người chạy approve là ngã-ngũ, merge chỉ là hệ quả cơ học, per vision §8 "người ở cổng").
- **RUL22 (reject không bao giờ đảo lịch sử).** `reject` là một move FSM thuần `proposed→todo` mang `reason`; không bao giờ gọi một lệnh git nào, kể cả cho một đề xuất pull-door đã có code thật trên main — code đó ở lại như lịch sử, `reject` chỉ từ-chối coi-là-xong, không revert/rewrite (per D4 pr-lifecycle / 1359ab5e).
- **RUL23 (phản hồi người threading vào prompt worker).** Prompt dựng cho worker (`buildPrompt`) mang thêm một mục `# Human feedback` TÙY CHỌN khi item mang câu trả lời làm-rõ mới nhất (fold từ cổng chờ-người, xem spec Work-State "Bản ghi cổng-người") và/hoặc lý do từ-chối/đỗ mới nhất (`item.reason`, xem spec Work-State Data Dictionary #18): câu trả lời in NGUYÊN VĂN dưới nhãn quyết-định-cuối-cùng-ràng-buộc, lý do mới nhất in NGUYÊN VĂN dưới nhãn ưu-tiên-sửa-trước-tiên. Vắng cả hai → mục này KHÔNG xuất hiện, prompt giữ nguyên byte-identical hình cũ (cộng thêm thuần, không phá vỡ hợp đồng 4 section pin sẵn có). Runner đọc lại view TƯƠI ngay trước khi spawn worker (item truyền vào dispatch có thể cũ hơn move gần nhất của chính lượt gặt-lại/quét) rồi truyền `feedback: {answer, reason}` xuống `spawnWorker`. Đây là cách một vòng reject hội tụ: dogfood-thật cho thấy không có mục này, worker vòng sau lặp lại đúng đề xuất vừa bị từ chối vì không thấy lý do (per worker-execution STR33 / 396d9d9e).
- **RUL24 (một-người-ghi vẫn giữ nguyên dưới song song, qua một cửa ghi tuần tự).** Dù nhiều việc thi công đồng thời trong một mẻ, MỌI thay đổi trạng thái (nhận việc, đề xuất, đỗ, nhập) đi qua ĐÚNG một cửa ghi tuần tự — một giao dịch ghi trọn vẹn rồi mới tới giao dịch kế tiếp, không bao giờ hai thay đổi chen lẫn nhau giữa chừng. Đây là hệ quả trực tiếp của RUL1 dưới điều kiện mới: song song ở việc THỰC THI (nhiều worker chạy đồng thời), không phải ở việc GHI (per D16 fan-out-parallel).
- **RUL25 (cây chính chỉ nhận nguyên một tính năng đã xong, không mảnh dở — SUPERSEDE quyết định trước đó).** Một việc CON không bao giờ nhập thẳng vào cây chính — nó nhập vào nhánh của GỐC nó; chỉ đề xuất của chính GỐC (sau khi mọi con đã xong) mới nhập vào cây chính, đúng một lần cho cả tính năng. Điều này THAY quyết định trước đây ("mỗi việc một đề xuất, thẳng vào cây chính") trong bối cảnh một việc có con — quyết định cũ vẫn đúng nguyên vẹn cho một việc ĐỘC LẬP (không con), đi thẳng đường cũ không đổi (per D2/D3 fan-out-parallel / 2e92b7a5, supersede-in-context quyết định D2 pr-lifecycle).
- **RUL26 (quyền-sở-hữu-gốc — mọi con của một gốc về tay cùng một chủ trong một lượt chạy).** Lúc con ĐẦU TIÊN của một gốc được nhận trong một lượt chạy, gốc đó gắn chủ; con tiếp theo của CÙNG gốc chỉ được nhận bởi ĐÚNG chủ đó — một chủ khác giành nhận bị từ chối (cùng khuôn kỳ-vọng-lệch của mọi cửa nhận việc khác), việc đó ở lại chờ mẻ sau. Chủ xả khi gốc xong. Bảo vệ nguyên tắc "mọi con của một gốc chung một không gian làm việc" (per D5/D13 fan-out-parallel).
- **RUL27 (nhập gốc→cây chính bắt CẢ xung đột văn bản LẪN trôi ngữ nghĩa im lặng).** Một GỐC từng có con, lúc nhập vào cây chính, được kiểm CẢ hai: nhập có xung đột văn bản không, VÀ sau khi nhập (chưa chốt) verify của chính gốc còn xanh không trên cây đã nhập — verify đỏ ở bước này là TRÔI ngữ nghĩa (nhập sạch nhưng kết hợp gãy), bị coi ngang xung đột văn bản: hủy sạch, cây chính không bao giờ giữ một nhập xanh-mà-gãy (per D6/D9 fan-out-parallel / f0c40acc). Vì đây là phép kiểm DUY NHẤT cho cả cây hậu duệ, verify của gốc phải đủ mạnh lúc soạn — verify mỏng bỏ lọt trôi ngữ nghĩa.
- **RUL28 (đồng bộ-lại sạch = cơ học không đếm; làm-lại tay = có đếm).** Một việc đỗ vì gãy nhập được đồng bộ-lại: nếu sau khi kéo đích mới nhất vào, nhập sạch VÀ verify xanh, việc trở lại sẵn sàng nộp lại theo đường cơ học (không qua "đang làm", không tính vào ngân sách chống-lặp của việc) — phân biệt với người CHỌN cầm việc qua cửa pull để tự làm-lại tay, đường đó QUA "đang làm" như bình thường và ĐƯỢC đếm (per D11/D18 fan-out-parallel).
- **RUL29 (cổng chống-lặp reset theo can thiệp người CUỐI CÙNG của chính việc, per-item, trigger-set đóng).** Cổng chặn dispatch (khác `visitCount` lifetime metric ở RUL13 — xem Data Dictionary #4/#4b) đếm `visitsSinceLastHumanEvent`: số lần việc vào `doing` KỂ TỪ sự kiện người cuối cùng của CHÍNH việc đó. Trigger-set đóng — chỉ hai hình reset: việc rời `awaiting-human` bằng một câu trả lời của người (`answer`, actor `human`), hoặc một move mang `reason` VỚI actor `human` (reject/park do người quyết). Một lần resume trần (`blocked→todo` không `reason`), một lần người `take` việc (`blocked→doing`, actor `human`, không `answer`/`reason`), và mọi move của chính runner (kể cả park mang `reason` của chính nó) đều KHÔNG reset — chỉ tính là một visit như mọi lần khác. Không có sự kiện người nào của việc → ngân sách bằng đúng lifetime `visitCount` (một vòng lỗi máy thuần vẫn chết ở trần 3, không đổi). `MAX_VISITS=3` và mọi call site của `visitCount` (outcome/metric đã ship) giữ nguyên — chỉ điểm CHẶN DISPATCH đổi công thức đếm (per D1 human-rounds / 5a6900b2).
- **RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới).** Một việc `blocked` mang nhánh đề xuất còn sống (`fgw/<id>`) — kể cả bị đỗ do chạm trần chống-lặp — có cửa công khai để người hoàn tất: `take` claim qua cạnh `blocked→doing` sẵn có, ghi `branchHeadAtTake` (HEAD của NHÁNH lúc take — discriminator DUY NHẤT của nguồn-nhánh, không dùng `classifySource` để phân biệt vì nó ưu-tiên-nhánh); người commit thêm lên nhánh; `return` kiểm `branchHeadAtTake` TRƯỚC mọi guard main-based (cây làm việc chính của người không bao giờ bị đọc/đụng), verify chạy trong một worktree TẠM, DETACHED tại đúng SHA của nhánh (không bao giờ checkout theo tên, không `reclaimOrphanedCheckout` — an toàn cả khi người đang đứng trên chính nhánh đó ở một worktree khác) → sạch + xanh → `proposed` mang `branchHeadAtReturn`; **TUYỆT ĐỐI không ghi `headAtReturn`** cho nguồn-nhánh (trộn hai marker cho `reviewDiff` một dải vô nghĩa). Không commit mới trên nhánh, hoặc verify đỏ trong worktree tạm → từ chối rõ lý do, việc giữ nguyên `doing`. Một đề xuất hoàn tất theo đường này đọc nguồn là `runner` như bình thường (nhánh `fgw/<id>` còn sống — không cần đổi `classifySource`/`merge.mjs`) và đi qua CÙNG cổng duyệt PR nội bộ (per D2 human-rounds / 5a6900b2, xem spec Work-State "Cửa pull giao–nhận việc").

- **RUL32 (vòng tự cải thiện chỉ nhắm vào chính repo sản phẩm, không phải tính năng mở cho host ngoài).** Toàn bộ vòng self-improve (Gate A, Iron Law, và Gate B wiring — cả ba đã xây, STR13 hoàn tất) tác động lên chính `repo/src` của fgOS — công cụ fgOS tự soi lại chính nó, không phải một khả năng fgOS cấp cho project khác mà nó đang điều phối (per D1 self-improve-loop / c8df2479).
- **RUL33 (vòng tự cải thiện luôn on-demand, không bao giờ một nhánh tự động của vòng dispatch thường).** Không bước nào của `fgos-runner --once`/`--dry-run` tự khởi động Gate A hay bất kỳ bước nào sau nó — toàn vòng self-improve chỉ chạy khi người vận hành gọi tay qua verb riêng (`evolve`, và các verb Iron Law/Gate B của slice sau). Lý do: STR9 (auto-merge đề xuất worker) vẫn `proposed`, chưa đủ tin cậy để mở thêm bề mặt tự động quanh việc tự sửa hệ thống (per D3 self-improve-loop / cb09d6fd).
- **RUL34 (Iron Law áp dụng khi CHẠM cờ rủi ro HOẶC module năng-lực — không cần cả hai).** Phán quyết Iron Law là phép HOẶC của hai phép thử độc lập trên một candidate fix: phép thử module (danh sách minh họa D10, mở rộng D14) và phép thử từ khóa (bộ từ khóa rủi ro nặng dùng chung với `fgos submit`, D5, mở rộng D14). Mô tả fix vắng mặt KHÔNG BAO GIỜ được coi là bằng chứng an toàn — phán quyết vẫn tính đủ từ phép thử module một mình. Danh sách module là minh họa, không đóng khung (per D10 self-improve-loop; xem D10's phép thử năng lực gốc: một module đủ tư cách nếu sửa nó có thể làm YẾU hoặc BỎ QUA chính kỷ luật gate/verify của hệ) (per D5/D10/D13/D14 self-improve-loop).
- **RUL35 (bộ từ khóa rủi ro nặng là MỘT nguồn duy nhất, dùng chung giữa intake và Iron Law).** Bộ từ khóa quyết định tier `heavy` lúc `fgos submit` (xem spec Work-State "Nộp vấn đề tự do (submit)", RUL16) và bộ từ khóa quyết định phép thử-từ-khóa của Iron Law là ĐÚNG MỘT bộ dữ liệu — không hai danh sách lệch nhau theo thời gian. Mở rộng bộ này (per D14, thêm nhóm hệ-thống-ngoài/bỏ-kiểm-tra/kiểm-toán) đồng thời làm `fgos submit` phân loại nặng hơn cho các mô tả trùng từ khóa mới — một hệ quả CHỦ Ý, không phải hồi quy (per D14 self-improve-loop).
- **RUL36 (`evolve --submit` là hành động ghi DUY NHẤT trên bề mặt evolve, tái dùng CHÍNH cửa `submit`).** `fgos evolve --submit <id>` không tự viết logic tạo-việc riêng — nó soạn một mô tả người-đọc-được từ các trường của candidate (id/disposition/errorClass/layer/attempts/detail, bỏ qua trường vắng mặt thay vì in literal "undefined") rồi gọi CÙNG hàm `submitWork` mà verb `submit` tự dùng (tách ra khỏi thân `submit` đúng cho mục đích này, hành vi `submit` giữ byte-identical trước/sau tách). `evolve` (không cờ) và `evolve --pick <id>` giữ nguyên đọc-thuần tuyệt đối như Slice 1, không đổi bởi cell này (per D15 self-improve-loop).
- **RUL38 (vận chuyển GitHub là MỘT cổng duyệt, không phải một luật thứ hai — github-adapter D1/D3/D5).** `review --github`/`approve --github` không tạo cạnh FSM mới, không đổi actor cho `done` (vẫn `human`), và không đổi khuôn `blocked`+friction — CHỈ đổi chỗ xem-diff và chỗ merge sang GitHub. Chỉ áp dụng cho nguồn runner (D1); một GitHub-side gãy KHÔNG BAO GIỜ tự hạ cấp về đường cục bộ (D3, cùng nguyên tắc RUL21 áp cho vận chuyển này). Ba giới hạn đã biết, ghi ở Open Gaps: không dọn nhánh sau merge qua GitHub (khác RUL21's dọn nhánh cục bộ), gãy merge không phân biệt "chưa đủ lượt duyệt" khỏi lỗi thật khác (đều `blocked` như nhau), và đề xuất CON chưa có đường đẩy nhánh của GỐC nên `review --github` không dùng được cho con trên GitHub thật.
- **RUL37 (Iron Law áp vào `approve` một điểm CHUNG cho MỌI đề xuất nguồn runner — không riêng gì evolve, không riêng gì vận chuyển cục bộ — chặn CỨNG, không phải cảnh báo im lặng).** Ngay sau các guard nhận-dạng-worktree hiện có (registry + cấu trúc) và TRƯỚC CẢ nhánh `--github`, `approve` chạy `classifyIronLaw({filesChanged, description})` trên chính đề xuất đang duyệt (`filesChanged` từ `changedFiles`, `description` từ `item.description`) — áp dụng bất kể đề xuất tới từ `evolve --submit`, `add`, hay `submit` thường, VÀ bất kể merge qua cục bộ hay qua GitHub (review-20260718-self-improve-loop f01: trước đây chặn này chỉ nằm trong nhánh merge cục bộ, nên `approve --github` từng bỏ-qua-hoàn-toàn gate này — một lỗ hổng thật, không phải "chưa xây"), vì bài toán D10 hỏi diff này có NĂNG LỰC làm yếu kỷ luật gate/verify của hệ hay không, không phải nó tới từ đâu hay merge bằng đường nào. `required: true` mà thiếu `--acknowledge-iron-law` (cờ boolean, cùng khuôn phân tích cờ với `--async`/`--unattended` của `submit` — không phải cờ mang giá trị như `--timeout`) → từ chối cứng (`StoreError('validation', …)`), nêu tên đúng matchedFlags/matchedModules, đề xuất giữ nguyên `proposed`, không git nào chạy — fgOS không bao giờ tự nhận đã "chứng minh được" một test đỏ chạy trước khi fix (không có hạ tầng theo-dõi lịch-sử đỏ/xanh nào tồn tại); `--acknowledge-iron-law` là cử chỉ CHỦ Ý của người duyệt xác nhận điều đó thay hệ thống, không phải một xác minh cơ học. **Ranh giới CHỦ Ý:** chỉ nguồn `runner` đi qua chặn này — nguồn `pull`/`legacy` (code đã do người tự tay commit thẳng lên main) không đi qua, vì code đó đã là lịch sử theo thang bền vững, không phải một diff đang chờ merge lần đầu (per D16/D17 self-improve-loop).
- **RUL31 (kỷ-luật-output NỚI RỘNG: console + bản ghi cục bộ riêng-từng-việc, KHÔNG BAO GIỜ vào cây committed — SUPERSEDE một phần quyết định trước).** Trước đây output của trợ lý chỉ in console, không ghi ra file nào. Nay MỌI kết cục của một lượt dispatch — thành đề xuất, chấm-trượt, quá-giờ, hỏng-spawn (kể cả tràn bộ đệm) — đều CÒN được ghi thêm vào một bản ghi cục bộ, một file riêng mỗi việc, gộp theo thời gian qua các lần thử. Nửa bảo đảm gốc vẫn giữ nguyên tuyệt đối: bản ghi này không bao giờ vào cây committed (không git-track được) — chỉ nửa "không ghi ra file nào cả" bị nới. Một lượt dispatch hỏng trước khi trợ lý sinh ra output (lỗi worktree, không phải lỗi trợ lý) vẫn ghi được một khối (chỉ mang loại lỗi + thông điệp), không throw vì thiếu trường (per D1/D2/D3/D4 worker-dispatch-log / 8575f1a3). **Bổ chú (20260717, review-20260717-daily-batch, review finding F-STR1-1):** bản ghi cục bộ này KHÔNG BAO GIỜ throw ra ngoài, dù chính thao tác ghi thất bại (đĩa đầy, không có quyền ghi, thư mục chỉ-đọc) — bản ghi này là quan sát thuần, không bao giờ được phép làm hỏng hay che khuất kết cục dispatch thật; một lần ghi hỏng chỉ âm thầm bỏ qua (trả về rỗng), không bao giờ lan ra ngoài `dispatchClaimedItem`.

- **RUL39 (ĐÃ XÂY — backlog STR39, cell live-worker-log-1).** Bản ghi output cục bộ của một việc nhận output theo THỜI GIAN THỰC: từng mảnh output của trợ lý được nối vào bản ghi ngay khi đến (`appendWorkerLogChunk`, worker-log.mjs — cùng cửa ghi DUY NHẤT với khối kết-cục cuối, không mở cửa thứ hai), thay vì chỉ một khối sau khi lượt dispatch kết thúc — người vận hành theo dõi được một worker đang chạy bằng `tail -f .fgos/logs/<id>.log`, mỗi việc một bản ghi nên nhiều worker song song không giẫm dòng nhau. `spawnWorker` (dispatch.mjs) gọi chunk này qua `opts.onChunk(stream, chunk)` ngay trên mỗi sự kiện `data` của stdout/stderr, bọc try/catch để một callback ghi hỏng không bao giờ làm gãy dispatch thật. Khối kết-cục cuối (kể cả quá-giờ/hỏng-spawn) vẫn ghi đủ như RUL31, không đổi vị trí gọi hay bảo đảm, và bảo đảm không-vào-cây-committed giữ nguyên tuyệt đối (per D 644916a4). Xem thêm "Xem live output worker khi đang chạy" ở trên.
- **RUL40 (đã xây — STR40, `scripts/herdr-cockpit.sh` + `scripts/herdr-cockpit-notify.mjs`).** Vận hành qua herdr là chế độ được hỗ trợ chính thức (D d3dbe7f5, supersedes D ef6ed305 — chốt 2026-07-18, user xác nhận đổi tmux→herdr): một phiên chuẩn bốn pane — (1) vòng runner lặp (`fgos-runner --once` trong shell loop, đứng trên `runner.lock` + idempotent, không flag mới), (2) theo dõi output live từng việc (`tail -F .fgos/logs/*.log`, đứng trên RUL39), (3) cửa thao tác của người (nộp/trả lời/duyệt, shell tương tác thuần), (4) bảng trạng thái + chuông chờ-người gộp một pane (`herdr-cockpit-notify.mjs`: poll `fgos list --json`, in dòng trạng thái + gọi `herdr notification show` đúng MỘT LẦN khi một việc MỚI vào `awaiting-human` — không lặp lại khi việc vẫn đứng yên ở trạng thái đó, gọi lại nếu việc rời rồi quay lại) — kèm một trang runbook trong docs sản phẩm (`docs/operator-runbook-herdr-cockpit.md`). **LUẬT CỨNG (điều kiện supersede D d3dbe7f5, không phải tuỳ chọn):** herdr CHỈ dùng làm chrome (`pane split`/`pane run`/`pane read`/`tab create`/`notification show`) — KHÔNG BAO GIỜ gọi `herdr agent start` hay đọc `agent_status` (idle/working/blocked/done) của herdr làm tín hiệu quyết định; mọi trạng thái thật luôn qua fgOS CLI (`fgos list`/`rollup`/`triage`), một nguồn sự thật duy nhất — vi phạm luật này từng gây bug thật ("idle giết agent", đo được ở dogfood airemote của chính xưởng). Đa phiên chung checkout (STR35, đã đóng): herdr tự thương lượng qua `herdr terminal attach --takeover` — hành vi có sẵn của herdr, không phải code mới của cockpit.
- **RUL42 (STANCE trí-tuệ-giao-việc — picker cơ học VĨNH VIỄN, trí tuệ vào qua đúng hai cửa).** Vòng chọn-giao của runner không bao giờ gọi một model thông minh: mọi quyết định của nó (việc nào, model nào, tiếp hay dừng) phải tra-bảng hoặc dẫn xuất được từ dữ liệu đã nằm trên item. Trí tuệ vào hệ qua đúng hai cửa — (1) dòng chính: một bộ não thông minh (phiên trợ lý, stage làm-rõ/chia-việc, chấm-điểm tương lai) đọc frontier, chấm điểm, và GHI KẾT LUẬN XUỐNG FIELD của item qua cửa ghi chuẩn (khóa ưu tiên STR7, intent STR8, cờ tuần-tự-hóa); picker chỉ đổi khóa sort, không đổi bản chất; (2) ngoại lệ có cửa riêng: cửa pull take/return cho một phiên thông minh nhấc đúng một việc ra khỏi dòng máy — kết quả trả về vẫn bị đo lại cơ học như mọi đề xuất. Một trợ lý điều phối không bao giờ trở thành picker; nó là người viết điểm số mà picker đọc. STR7 và STR8 thiết kế dưới stance này (per D f69951df).
- **RUL41 (đã xây một phần — STR41, `src/runner/dispatch.mjs`).** Mỗi tier khai được một executor riêng qua `executors.<tier>` trong cấu hình runner; tier không khai riêng rơi về `executor` chung — cấu hình cũ (không có `executors`) chạy nguyên, không đổi hành xử (chứng minh bằng toàn bộ test cũ của `dispatch.test.mjs` xanh không sửa). Ranh giới executor là một cổng có tên — **CTR009 v2**: registry `EXECUTOR_ADAPTERS` map tên adapter → hàm spawn. Adapter LIVE duy nhất hôm nay là `cli-spawn` (mặc định khi `adapter` vắng mặt trên một khối executor) — chính là hành xử cũ, tách nguyên vẹn ra một hàm riêng (`spawn(command,args,{shell:false})`, timeout trên `'exit'`, maxBuffer tự đếm, `onChunk` tee trước khi đếm). Adapter `rpc`/`app-server` **vẫn deferred, chưa có code** — khai một tên adapter khác `cli-spawn` bị `RunnerConfigError` từ chối ở cả `loadRunnerConfig` lẫn `resolveExecutorCommand` (per D a4fe4c2b).
- **RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`).** Nội dung chữ nghĩa của prompt worker (`buildPrompt`) không còn hard-code trong `dispatch.mjs`: tách sang file template committed `src/runner/prompt-templates/*.txt`. Chọn template qua `selectTemplate({kind, tier, domain})` — bảng tra cơ học (mảng luật thứ tự, luật cuối là wildcard luôn khớp, per RUL42: không gọi model trong vòng chọn) — hôm nay đúng MỘT luật (`worker-prompt-default.txt`), chưa có template phân biệt (YAGNI, cùng kỷ luật "mua cái tên interface, chưa mua bậc" của RUL41). Substitution CHỈ `{placeholder}` string-replace từng phần tử (`renderTemplate`), KHÔNG bao giờ một template engine có logic — mọi thành phần điều-kiện (vd mục `# Human feedback` chỉ xuất hiện khi có feedback, RUL23) vẫn là JS tính TRƯỚC khi substitute, không chuyển vào trong file template. `buildPrompt(work, feedback)` giữ nguyên chữ ký + kiểu trả (string) — mọi test cũ xanh không sửa (bằng chứng byte-identical). `hashTemplate` băm sha256 nội dung RAW file template (không phải output đã render); `spawnWorker` đính `templateName`/`templateHash` lên kết quả trả về VÀ lên `DispatchError` khi adapter reject; `loop.mjs` truyền hai trường này vào `appendWorkerLog`; `worker-log.mjs` in `template <name>@<hash8-chars>` trong header khi có mặt — một lượt chạy tồi truy ngược đúng phiên bản template đã sinh ra nó (per backlog STR49).
- **RUL43 (phát hiện đóng-không-merge trên GitHub là một phép ĐỌC riêng, phân loại chỉ trên hai trường tự-nghĩa — github-adapter D6).** `review --github --pr <n>` (không mở PR mới) là cơ chế D6 yêu cầu cho việc phát hiện một PR bị đóng trên GitHub mà không merge. Phân loại KHÔNG BAO GIỜ dựa vào chuỗi trạng thái tổng quát của GitHub (chưa từng được chứng minh thật cho một PR đã đóng/đã merge, per S1) — chỉ dựa hai trường tự-nó-đã-rõ-nghĩa: đã-đóng-chưa (đúng/sai) và đã-merge-lúc-nào (có/không dấu thời gian). Ba nhánh: còn mở (không việc gì), đã merge (chỉ thông tin, không tự đổi trạng thái cục bộ — kể cả khi merge diễn ra thẳng trên GitHub bỏ qua `approve --github`, đối chiếu lại nằm ngoài phạm vi, D4), đã đóng không merge (nêu số PR, hướng dẫn gọi `fgos reject` — không tự động gọi thay). Dưới MỌI nhánh, kể cả nhánh lỗi gọi GitHub: không sự kiện nào được ghi, không friction nào — một PR bị đóng trên GitHub không tự nó là một hành động duyệt hay từ chối (D6), y hệt nguyên tắc `reject` không tự động (RUL22) áp cho hướng ngược lại.
- **RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, không niềm tin đặc biệt, có trần + chống trùng).** Kênh báo-cáo mô tả ở "Báo việc-phát-hiện từ trợ lý" (trên) giữ nguyên tắc một-người-ghi (D3 — chỉ runner ghi work-state, trợ lý không bao giờ được phép) trong khi vẫn cho trợ lý một đường DỮ LIỆU để lộ ra việc mới: (1) việc tách báo-cáo khỏi output chạy đúng MỘT LẦN cho mỗi lượt dispatch, tại thời điểm kết thúc (thành đề xuất/chấm-trượt/quá-giờ/hỏng) — không lặp lại giữa các lần thử nội bộ của cùng lượt, nên một báo-cáo lộ ra sớm rồi lặp lại ở lần thử sau trong CÙNG lượt không bao giờ tạo hai bản; (2) một báo-cáo hỏng-hình không bao giờ đổi kết cục của chính lượt dispatch — bị bỏ qua âm thầm, không throw; (3) item tạo ra từ báo-cáo vào hệ với KHÔNG niềm tin đặc biệt nào — cùng giai đoạn đầu vào, cùng vòng xét-lại như một item người tự khai; (4) một lượt dispatch chỉ hành động trên tối đa một số báo-cáo GIỚI HẠN, phần dư bị bỏ qua có ghi lại (S10, review-fix P2 — chặn một trợ lý bất thường sinh vô hạn item); (5) một báo-cáo đã được ghi nhận trước đó (khớp dòng dõi phát-hiện + tên việc, không phân biệt hoa/thường/khoảng trắng) không tạo item thứ hai — dù lặp trong CÙNG output hay tái xuất hiện ở một lượt dispatch SAU của cùng item nguồn (S10, review-fix P2 — chặn trùng lặp khi báo-cáo bị gửi lại) — hai tên việc THẬT SỰ khác nhau vẫn cả hai được tạo (per work-graph-intelligence S2b / 8cf7effe, S10 / 7bbe6315). **Bảo đảm giao-nhận (S11, review-fix P3).** Kênh là cố-gắng-tối-đa, TỐI-ĐA-MỘT-LẦN — không phải ít-nhất-một-lần: một báo-cáo mất giữa lúc phân tích và lúc ghi xong (vd runner chết đột ngột) không được phục hồi, không có đối-soát-lại nào đọc lại output đã lưu để dựng lại báo-cáo đã mất — chấp nhận CÓ CHỦ Ý cho một kênh tư vấn phi-chặn, không phải một hàng đợi đáng tin cậy. **Ranh giới tin cậy (S11, review-fix P3).** Tên/mô tả trong một báo-cáo là văn bản KHÔNG ĐÁNG TIN do trợ lý tự soạn; item tạo ra nạp thẳng văn bản đó vào prompt của model làm-rõ ở giai đoạn `clarify` — mặt tiếp xúc thứ hai (sau chính trợ lý) nơi văn bản không đáng tin chạm một model sẽ sinh lệnh chạy được. Giảm nhẹ hiện có: `verify` KHÔNG BAO GIỜ do trợ lý đặt trực tiếp (luôn qua placeholder rồi model/người gán lại ở làm-rõ) nên văn bản đó không thể tự nó thành một lệnh shell; item không mang niềm tin đặc biệt, đi qua đúng vòng xét-lại như mọi item khác. Một cửa xét-duyệt-người bắt buộc trước dispatch tự động của item runner-tự-tạo được cân nhắc nhưng CHƯA XÂY (đổi thiết kế lớn hơn phạm vi vá P3) — xem decision ADR0013. **Kỷ luật ghi log (S11, review-fix P3).** Tên việc trong một báo-cáo — văn bản KHÔNG ĐÁNG TIN — được CHUẨN HOÁ (gộp khoảng trắng/xuống dòng, cắt độ dài) trước khi đưa vào bất kỳ dòng log nào của kênh này; một tên việc mang ký tự xuống dòng không thể giả-mạo thêm dòng log. Việc chuẩn hoá này CHỈ áp dụng cho bản ghi log — tên việc ĐẦY ĐỦ, nguyên văn vẫn được lưu trên item tạo ra, không bị cắt hay đổi.

- **RUL46 (lớp hướng dẫn không bao giờ tự áp cạnh chuyển-trạng-thái — chỉ engine mới được).** Skill hướng dẫn giai đoạn (làm-rõ/chia-việc/thẩm-định) chỉ SÀNG LỌC câu hỏi, GHI giả định, và PHÁN xong-hay-chưa trong phạm vi phán đoán của chính nó — cạnh chuyển stage thật sự luôn đi qua verb máy của engine, không bao giờ do chính skill tự gọi hay tự suy ra kết quả (per D8 p50-workflow-induct, cùng stance RUL42).
- **RUL47 (cổng chờ-người của lớp hướng dẫn không bao giờ tự trả lời).** Khi engine tự phán một item chưa đủ rõ/chưa đủ khả thi (cổng chờ-người), lớp hướng dẫn luôn escalate ra ngoài phiên và chờ người quyết — không bao giờ tự đưa ra câu trả lời thay người, kể cả khi câu hỏi có vẻ hiển nhiên (per D11 p50-workflow-induct, mở rộng RUL3/RUL13 sang lớp hướng dẫn).
- **RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước).** `fgos discover` và `fgos-runner` đều giải đường cấu hình mặc định (không kèm `--config`) và, nếu đường đó chưa tồn tại, tự viết một bản mặc định (executor giả định `claude`, cùng hình dạng với cấu hình dogfood của chính repo — model light/standard/heavy, `timeoutMs`, khối `parallel`) trước khi nạp — không còn báo lỗi "không đọc được cấu hình" ngay từ bước đầu tiên của vòng làm-rõ. Việc tự sinh này LUÔN kèm một dòng thông báo (tên file + executor giả định) để người vận hành biết ngay cấu hình vừa được tạo, không âm thầm. Một `--config <path>` TƯỜNG MINH trỏ vào đường vắng mặt KHÔNG BAO GIỜ được tự sinh thay — vẫn báo lỗi ngay như trước, vì một đường dẫn người tự chỉ định là chủ đích, không phải "chưa từng cấu hình" (per D 38f7e0b8).
- **RUL49 (khóa hoạt động cây chính chặn CỨNG, không phải cảnh báo — canh MỌI commit trần, không riêng gì verb fgOS).** Cơ chế mô tả ở "Khóa hoạt động cây chính" trên chặn ở tầng git, trước khi bất kỳ commit nào chạm cây chính — không phải một guard trong `bin/fgos.mjs`, nên không thể bị vòng qua bằng cách gọi git trực tiếp thay vì qua verb fgOS (đúng lỗ hổng đã biết của "Bảo vệ approve khỏi lồng phiên" trên, vốn chỉ canh MỘT verb và chỉ canh phiên đã đăng ký). Khóa dùng đúng một danh tính (biến môi trường phiên trợ lý khi có, tổ tiên tiến trình gần khi không) để phân biệt "chính phiên này tiếp tục" khỏi "một phiên khác đang hoạt động" — cùng danh tính luôn được coi là refresh, không bao giờ tự chặn chính mình (per STR65).
- **RUL50 (khóa hoạt động cây chính fail-closed trên tín hiệu không đọc được).** Khi nội dung khóa không phân tích được hoặc thiếu trường cần thiết, commit bị từ chối — không bao giờ được coi là "cây đang rảnh". Đây là lựa chọn CHỦ Ý ưu tiên an toàn hơn sẵn sàng, khác với "Bảo vệ approve khỏi lồng phiên"'s `isMainWorktree` (fail-open trên trường hợp mơ hồ) — hai cơ chế bảo vệ hai rủi ro khác nhau (một canh thẩm quyền FSM, một canh mất-dữ-liệu-thật đang hoạt động) nên được phép chọn khác nhau (per STR65).


## Edge Cases Settled

- Runner bị giết giữa việc: lần chạy sau gặt lại đúng trạng thái (proof đạt → proposed, không → blocked), nhánh có ĐÚNG MỘT commit worker — test giết thật.
- Nhánh bị worktree mồ côi giữ (path còn hoặc đã mất) đều đòi lại được — bug thật do e2e bắt sau khi code ship, vá bằng cell fix-first (phase-2-routing-10).
- Đề xuất bị người duyệt trả (`proposed→todo` kèm lý do): việc vào lại frontier, chống-lặp đếm và chặn lặp vô hạn.
- Kho chưa init / frontier trống: vòng kết thúc sạch, không nghi thức.
- Hai lần chạy chồng lấp: lần hai thoát «bận» — 0 ghi trạng thái, 0 thao tác worktree, khoá của lần một còn nguyên vẹn. Khoá mồ côi (chủ đã chết, hoặc nội dung rác) → lượt gặp nó dọn đi rồi vẫn lui ra «bận»; lượt kế tiếp chiếm khoá sạch và chạy bình thường (sau crash: hai lượt là phục hồi xong).
- Cách ly vị trí của worker có by construction: worktree nằm trong thư mục tạm hệ thống — đường walk-up từ cwd của worker không bao giờ gặp xưởng/harness phát triển.
- Việc bị đỗ-lại hoặc bị dừng cũng để lại bản ghi thực tế (outcome) — vòng học nhìn thấy thất bại, không chỉ thành công; đọc lại được qua `fgos check` — chứng minh bằng một lần dispatch thật (không chỉ fixture).
- Quét làm-rõ với model trả lời rác/timeout: không crash vòng chạy — item rơi về `awaiting-human` với câu hỏi mặc định cố định, lượt chạy vẫn tiếp tục xử các item khác — chứng minh bằng một lần chạy thật với executor kịch bản in stdout không phải JSON.
- Item vừa qua quét làm-rõ trong CÙNG lượt chạy: nếu deps cũng đã xong, vòng dispatch bên dưới nhặt được ngay, không cần đợi lượt chạy kế tiếp — chứng minh bằng e2e một lượt `--once` duy nhất đưa item từ `clarify` tới `proposed`.
- Ngã-ngũ tự động của runner trong một lượt dispatch thật (quét làm-rõ, nhận việc, đề xuất, đỗ) đều mang đúng `actor` = `runner`; ngã-ngũ đóng tay qua CLI mang `actor` = `human` — chứng minh bằng benchmark F4 chạy qua binary thật (không chỉ fixture), round 2: 6/6 tiêu chí đạt.
- `check` chạy hai lần liên tiếp trên cùng kho: lần hai luôn in phần chênh lệch entropy thật so lần một, kể cả khi điểm không đổi (in "+0 so lần trước", không im lặng) — chứng minh bằng benchmark thật.
- Một kênh seal-digest có số đếm khác 0 nhưng chênh lệch bằng 0 (không có gì mới kể từ lần trước) vẫn in ra — chỉ kênh trống tuyệt đối (số đếm 0 VÀ chênh lệch 0) mới im lặng hoàn toàn (bài học rút ra từ một lần khai sai kỳ vọng ở benchmark F4 vòng 1, sửa lại đúng ở vòng 2).
- Item đơn giản đi qua quét làm-rõ rồi quét chia-việc trong CÙNG một lượt chạy `--once`: cả hai stage (`clarify → decompose → executing`) hoàn tất và item tới `proposed` trước khi lượt chạy đó kết thúc — chứng minh bằng e2e một lượt duy nhất qua binary thật.
- Một phiên đi qua lớp hướng dẫn giai đoạn (P50) hỏi một item rõ ràng: skill làm-rõ sàng lọc câu hỏi ứng viên không đạt (chỉ ảnh hưởng người-triển-khai) và không tạo cổng chờ-người — item đi thẳng, không hỏi oan (chứng minh bằng case-study 2026-07-20).
- Engine tự phán "chưa đủ rõ" NGAY CẢ với một item khách quan rõ ràng, khi lời gọi phán-đoán bên dưới thất bại vì lý do hạ tầng (không phải vì item mơ hồ) — cổng chờ-người thật vẫn nổi lên đúng theo thiết kế fail-safe (không bao giờ coi phán đoán không chắc là pass); lớp hướng dẫn không tự trả lời thay, escalate đúng luật (chứng minh bằng case-study 2026-07-20, xem Open Gaps).
- Item phức tạp sinh ≥2 con qua quét chia-việc: gốc bị bộ lọc frontier chặn (lineage qua `parent`, không qua `deps`) cho tới khi cả hai con tới `done`; con cuối đóng xong, gốc tự lọt frontier ở lượt kế tiếp và runner tự chạy verify CỦA CHÍNH GỐC (mang từ lúc rời clarify) làm goal-check — chứng minh bằng e2e qua binary thật, không chỉ fixture.
- Item mơ hồ ở chia-việc (verdict cần người quyết, hoặc gốc mang risk `heavy`): đậu `awaiting-human` mang đề xuất chia làm câu hỏi; người trả lời xong, lượt quét sau phán lại từ đầu (không giữ đề xuất cũ) — chứng minh bằng e2e round-trip qua binary thật, cùng khuôn parity với stage-clarify.
- Quét chia-việc với model trả lời rác/timeout, hoặc verdict chia có con thiếu verify: không crash vòng chạy — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, lượt chạy vẫn tiếp tục xử các item khác.
- Gặt-lại lúc khởi động SKIP một item `doing` mang `claimActor` người/phiên (cửa pull), dù item đó không mang commit/proof nào — nhưng vẫn gặt bình thường một claim mồ côi của chính runner ở cùng lượt gặt (chọn lọc, không phải tắt hẳn gặt-lại) — chứng minh bằng test thật cả hai nhánh trong cùng một pass.
- Một `fgos-runner --once` chạy song song trong khi một người đang cầm item qua cửa pull `take`: gặt-lại của lượt runner đó không đụng vào claim người, và runner cũng không dispatch lại item đã `doing` — chứng minh bằng e2e qua binary thật (submit → pass-through 2 stage → `take` người → `fgos-runner --once` song song → `return` xanh của người, không lượt nào giẫm lượt nào).
- Vòng đủ của một item runner qua cổng duyệt: submit/add → runner dispatch → `proposed` → `review` → `approve` → merge → `done`, mang settlement actor human, bài học câu-6, và dọn nhánh/worktree đều được assert — chứng minh bằng e2e qua binary + git thật.
- Merge conflict thật trên một main đã rẽ nhánh: sau `approve` bị hủy, cây làm việc NGUYÊN VẸN byte-for-byte (HEAD không đổi, tracked tree sạch, nội dung file không đổi) — chứng minh bằng e2e thật, không chỉ spike.
- Vòng đủ của một item pull-door qua cổng duyệt: `take` → commit → `return` → `review` → `approve` (không bước merge, per D4) → `done` — chứng minh bằng e2e qua binary thật.
- `reject` một item pull-door: commit của nó vẫn là lịch sử THẬT trên main sau reject (D4 no-auto-revert) — chứng minh bằng e2e thật.
- Hai việc độc lập (không chung gốc, không phụ thuộc nhau) dispatch trong CÙNG một mẻ đều tới đề xuất, và nhật ký sự kiện sau đó dựng lại đúng nguyên vẹn — chứng minh bằng một cửa sổ chồng-lấn THẬT giữa hai việc (không phải suy luận từ thời gian tường trình, vốn cũng đúng cho hai lần chạy tuần tự trông giống song song).
- Quyền-sở-hữu-gốc dưới hai chủ tranh cùng một gốc: chủ thứ hai luôn bị từ chối nhận, không có cửa sổ nào cả hai cùng nhận được cùng lúc — chứng minh bằng kịch bản đối đầu 2 tác nhân trước khi cell dựng thật, giữ nguyên khi dựng thật.
- Nhập xung đột thật ở tầng con→nhánh-của-gốc VÀ ở tầng gốc→cây chính: cả hai hủy sạch bằng đúng một cơ chế đã chứng minh cho việc-độc-lập trước đây — nhánh/cây nguyên vẹn sau khi hủy, không có tầng nào cần cơ chế riêng.
- Đồng bộ-lại thành công thật (đích đổi không đụng cùng chỗ với việc): việc chuyển thẳng từ đỗ về sẵn sàng nộp lại mà không đi qua "đang làm" — chứng minh bằng kịch bản thật, không rút gọn.
- Đồng bộ-lại gặp xung đột thật (đích đổi đụng đúng chỗ với việc): hủy sạch, việc giữ nguyên đỗ, nhánh của việc không đổi tip — chứng minh bằng kịch bản xung đột thật (không phải một xung đột dựng tắt), cùng cơ chế chứng minh cho cả tầng con→gốc lẫn tầng gốc→cây chính.
- Một câu trả lời làm-rõ của người (`answer`) hoặc một reject/park mang `reason` của người reset ngân sách cổng chống-lặp của chính việc đó — việc dispatch lại thay vì bị đỗ dù đã chạm trần trước đó; một resume trần (không `reason`), một `take` của người (không `answer`/`reason`), và mọi park của chính runner (kể cả mang `reason`) KHÔNG reset — chứng minh bằng test thật per-item cho từng hình, cộng một kịch bản tích hợp `runOnce` thật (RUL29).
- Một vòng chỉ-máy-lỗi (không sự kiện người nào) vẫn chết đúng ở trần 3 — reset chỉ xảy ra khi CÓ can thiệp người, không phải mặc định (regression giữ nguyên cùng lúc RUL29 được thêm).
- Vòng đủ của một đề xuất nguồn-nhánh từng bị đỗ (chạm trần chống-lặp): người `take` (ghi `branchHeadAtTake`) → commit thêm lên nhánh → `return` đo sạch trên worktree tạm detached tại tip nhánh → `proposed` mang `branchHeadAtReturn` (không `headAtReturn`) → `review`/`approve` (nguồn đọc là `runner`) → `done` — chứng minh bằng e2e qua binary + git thật (RUL30).
- `return` nguồn-nhánh với nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, việc giữ nguyên `doing`, không đổi tip nhánh — chứng minh bằng test thật.
- `return` nguồn-nhánh trong khi người đang đứng trên chính nhánh `fgw/<id>` đó ở một worktree khác: worktree tạm detached không đụng worktree của người (snapshot trước/sau byte-identical) — chứng minh bằng kịch bản hai-worktree thật, không phải suy luận.

- Đề xuất nguồn runner mở PR qua GitHub (`review --github`) rồi được merge sạch qua `approve --github --pr <n>`: item `done` mang actor `human`, cùng khuôn với merge cục bộ — chứng minh bằng test thật qua một `gh` giả tiêm vào tiến trình con thật của CLI (không mock).
- `approve --github` gãy vì lời gọi GitHub thất bại (mọi lý do — xác thực, mạng, giới hạn tần suất, hay chưa rõ): item `blocked` mang lý do cụ thể cộng một bản ghi friction, cùng khuôn `merge-conflict`/`verify-fail-post-merge` — chứng minh bằng test thật.
- `review`/`approve --github` gọi trên một đề xuất KHÔNG phải nguồn runner (pull-door/legacy): từ chối `validation` ngay, không gọi GitHub, đề xuất giữ nguyên trạng thái — chứng minh bằng test thật cho cả hai verb.
- `approve --github` trên một cây làm việc chính đang bẩn (file KHÔNG liên quan đến GitHub còn thay đổi chưa commit): KHÔNG bị chặn bởi phép kiểm cây-sạch của đường cục bộ — phép kiểm đó chỉ áp cho merge cục bộ, không áp cho merge qua GitHub — chứng minh bằng test thật.
- `review --github --pr <n>` trên một PR đã bị đóng KHÔNG merge: nêu đúng số PR, hướng dẫn `fgos reject`, không đổi trạng thái item, không ghi friction — và trả lời trong đúng MỘT lời gọi GitHub dù trường sẵn-sàng-merge của PR đó đọc "chưa rõ" (không chờ-lặp cho phép hỏi thăm này, khác `viewGitHubPRStatus`'s hành vi mặc định) — chứng minh bằng test thật đo số lần gọi GitHub VÀ thời gian chạy.
- `review --github --pr <n>` trên một PR đã merge (kể cả merge thẳng trên GitHub, bỏ qua `approve --github`): chỉ báo tin, không tự đổi trạng thái item cục bộ — chứng minh bằng test thật.
- Một lượt dispatch hỏng vì lý do KHÔNG liên quan tới trợ lý (lỗi worktree, không có output/tier/model) vẫn ghi được một khối vào bản ghi cục bộ, chỉ mang loại lỗi + thông điệp — không throw vì thiếu trường — chứng minh bằng test thật.
- Một việc bị thử lại nhiều lần: mỗi lần thử nối thêm một khối MỚI vào CÙNG bản ghi cục bộ của việc đó, lần thử trước không bị mất — chứng minh bằng test thật.

- Vòng đủ tự-cải-thiện (self-improve loop STR13, D1-D17): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `proposed` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `proposed → done`, settlement actor human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác.
- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả "thành công" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48).

## Open Gaps

- Cầu dao (breaker, Data Dictionary #5) trơ trong `--once`: `maxRetries` mặc định 2 luôn nhỏ hơn trần cầu dao 3, nên một việc không bao giờ tự kéo cầu dao trong một lượt `--once` đơn — chỉ đỗ qua đường trần thử-lại thường. Cần một cầu dao dùng chung xuyên lượt (hoặc hạ trần) mới làm cầu dao có tác dụng thật ở chế độ này; ghi nhận là biết-nhưng-chưa-sửa (review-debt-runner-2, không đổi hành vi).
- Nhiều lượt `check` chạy đồng thời trên cùng một kho chưa có cơ chế khóa/chống-tranh-chấp cho dòng lịch sử xu hướng (khác với nhật ký sự kiện chính, vốn đã có CAS) — cùng tinh thần ngưỡng-chưa-tới của RUL10 (work-state), mở lại khi ghi đồng thời thành tải chính.
- Tên nhánh trục (trunk) của cổng duyệt hiện là literal `"main"` (`merge.mjs`) — một host project dùng tên nhánh trục khác (vd `master`) sẽ gãy `approve`/`review`; đề xuất là tự phát hiện trunk lúc init/config thay vì literal (friction filed khi viết e2e cell pr-lifecycle-3, layer task-spec, severity P3 — xem `.bee/backlog.jsonl`).
- Chưa có escalation tự động khi một việc trải qua NHIỀU vòng người liên tiếp mà vẫn chưa hội tụ (vd item nổi lên "cần bàn sâu" sau N vòng người) — RUL29 chỉ mở lại ngân sách theo can thiệp người, không giới hạn tổng số vòng người; escalation dạng đó cần intent-scoring và deferred có chủ đích (human-rounds D1, xem `docs/backlog.md` STR8).
- Nhiều tiến trình/máy ghi trạng thái thật cùng lúc (đa-writer, đa-máy) chưa được dựng — quyền-sở-hữu-gốc hôm nay chỉ sống trong bộ nhớ của MỘT lượt chạy, không bền qua tiến trình/máy khác; một lượt chạy thứ hai trên máy khác không biết gì về chủ của lượt thứ nhất (deferred, backlog STR27).
- Nạp mẻ mới hôm nay là chờ-mẻ-trước-xong-rồi-đọc-lại (poll khi một việc trong mẻ hoàn tất), không phải phản ứng tức thời theo tín hiệu bên ngoài; và vòng chạy vẫn kết thúc khi hết việc (không sống liên tục chờ việc mới) — cả hai là ranh giới có chủ đích với một cơ chế phản ứng-theo-tín-hiệu-liên-tục rộng hơn (deferred, backlog STR8).
- Chưa có ưu tiên nhập khi nhiều gốc cùng cạnh tranh cây chính — một gốc thua một lần đồng bộ-lại rồi thua lại lần sau (do gốc khác vào trước liên tục) không có cơ chế được ưu tiên hơn ở lần thử kế tiếp (deferred, backlog STR7).
- Khi đồng bộ-lại gặp xung đột thật, không có agent nào tự giải xung đột rồi đưa người duyệt lại — người luôn phải tự đọc và sửa tay (deferred lên một tầng cao hơn, backlog STR19).
- Chưa dự đoán trước những việc con nào của cùng một gốc khả năng chạm cùng chỗ để xếp chúng chạy nối tiếp thay vì song song — hai con cùng gốc chạm cùng chỗ vẫn ĐÚNG (một con catch-up/làm-lại), chỉ không phải TỐI ƯU (giảm việc-song-song-phí là một cải tiến hiệu năng hoãn lại, không phải một lưới đúng-sai, deferred, backlog STR16).
- Một cây nhiều hơn hai tầng (gốc-của-gốc, cháu) hôm nay chưa từng được tạo ra bởi hệ thống (phán chia-việc chỉ sinh con ở đúng một tầng dưới gốc) — cơ chế cây nhánh tích hợp phân giải MỌI con về nhánh của ĐỈNH cây (không phải nhánh của cha trực tiếp), điều này chỉ tương đương với "con nhập vào nhánh cha" khi cây đúng hai tầng; một cây sâu hơn hai tầng, nếu tương lai sinh ra được, sẽ cần xác nhận lại điều này còn đúng hay không — chưa kiểm chứng vì chưa có dữ liệu thật để thử.
- Cổng duyệt PR nội bộ do người gọi tay không có khóa chống hai lần gọi cùng lúc trên cùng một gốc (vd người duyệt hai việc con cùng gốc gần như đồng thời, hoặc người duyệt trong khi chính vòng tự hành đang dispatch gốc đó) — rủi ro thấp dưới một người vận hành, một cửa ghi tuần tự chỉ bảo vệ phần ghi trạng thái chứ không khóa riêng thao tác nhập của cổng duyệt tay; chưa xảy ra thật, ghi nhận như một giả định chưa kiểm.
- Danh sách module của phép thử Iron Law (Data Dictionary #10, D10/D14) vẫn là danh sách MINH HỌA, không đóng khung — có thể còn module năng-lực-liên-quan khác (vd các module domain/kernel khác trong `src/state/`, `src/runner/`) chưa được liệt kê mà lẽ ra đủ tư cách theo phép thử năng lực gốc của D10; mở lại khi vận hành thật (wiring đã live, RUL37) cho thấy một trường hợp bỏ sót thật.
- Merge qua GitHub (`approve --github`) không dọn nhánh sau khi xong — nhánh cục bộ `fgw/<id>` VÀ bản đã đẩy lên remote gốc đều còn nguyên, khác với merge cục bộ (tự dọn cả hai, xem RUL21) — không có cơ chế dọn nhánh đã merge phía-server hôm nay; chấp nhận biết-nhưng-chưa-sửa cho slice này (github-adapter S3).
- `approve --github` chưa phân biệt được lý do gãy "PR chưa đủ lượt duyệt trên GitHub" (một trạng thái BÌNH THƯỜNG, đang chờ người, không phải lỗi) khỏi mọi lý do gãy KHÁC (xác thực, mạng, xung đột thật) — hôm nay cả hai đều đi cùng một đường `blocked`+friction; tách riêng cần bằng chứng thật từ một PR bị chặn duyệt thật (chưa có), không đoán (github-adapter S3, cùng kỷ luật "không đoán giá trị enum chưa chứng minh" như S2's quyết định bỏ outcome `conflict` riêng).
- Một đề xuất CON (có việc cha) gọi `review --github` chỉ đẩy nhánh của CHÍNH NÓ lên remote gốc, không đẩy nhánh của GỐC nó — nên `gh pr create` thật trên GitHub sẽ gãy vì nhánh đích (`base`) không tồn tại trên remote cho một đề xuất con; vận chuyển GitHub hôm nay chỉ dùng được thật cho đề xuất gốc/độc lập, ngữ nghĩa GitHub cho con cần một slice riêng (github-adapter S3, giới hạn đã biết trước khi build).
- Lời gọi phán-đoán bên dưới engine (quyết đủ-rõ/chưa-đủ-rõ) có thể trả về văn bản không máy-đọc-được thay vì phán quyết đúng khuôn khi được gọi TỪ BÊN TRONG một phiên trợ lý khác đang chạy (lồng phiên) — engine fail-safe đúng thiết kế (đậu cổng chờ-người, không bao giờ coi không chắc là pass). **Nguyên nhân gốc xác nhận 2026-07-22 (`claude -p` thật, không đoán):** không phải lỗi định dạng — model con ĐÔI KHI từ chối một prompt-chỉ-đòi-JSON vì đọc như prompt-injection (exit code vẫn 0), tính chất XÁC SUẤT chứ không tất định. Thử thêm một câu mào đầu "hợp thức hoá" lời gọi — PHẢN TÁC DỤNG, model đọc chính khung đó như dấu hiệu injection rõ hơn (bằng chứng thật, gỡ bỏ). Giải pháp còn lại: tăng số lần thử lại từ 1 lên 2 (3 lượt tổng) — giảm xác suất gặp phải, KHÔNG loại trừ hoàn toàn (`docs/backlog.md` STR68, đóng lại 2026-07-22).

- Khóa hoạt động cây chính (STR65) suy danh tính từ một tiến trình tổ tiên gần khi
  không có biến môi trường phiên trợ lý — suy đoán tốt-nhất cho terminal người gõ
  tay, KHÔNG tuyệt đối: hai terminal người khác nhau chia sẻ cùng một tiến trình cha
  đủ gần (vd cùng phiên tmux/sshd) vẫn có thể đọc ra cùng một danh tính và không bị
  chặn dù đang thực sự đồng thời hoạt động. Cả 3 sự cố STR65 có SHA cụ thể trước đây
  đều là phiên trợ lý (có biến môi trường riêng, không rơi vào giới hạn này) — giới
  hạn chỉ áp dụng cho trường hợp chưa quan sát được thật (terminal-đối-terminal).
  Vá trọn cần một danh tính phiên bền hơn cho terminal tay gõ (deferred, backlog
  STR84 nhắm khác lớp — enforcement phía bee-core — không trực tiếp vá gap này).

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--config), exit theo phạm trù
- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem "Gặt-lại lúc khởi động") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='clarify' && status==='todo'` (không đọc `item.mode`) và gọi `resolveDiscovery` (`src/intake/discovery.mjs`) cho từng item, truyền `'runner'`; (2) đọc lại view tươi rồi quét mọi item `stage==='decompose' && status==='todo'` và gọi `resolveDecompose` (`src/intake/decompose.mjs`) cho từng item, cùng truyền `'runner'` — cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời clarify; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `actor:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`modelForTier` (tái dùng bởi discovery.mjs VÀ decompose.mjs cho lời gọi model phán); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23); `description` là `work.description` nguyên văn, degrade "(không có)" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc, per D3/D4/D17); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `actor==='human'` mang `answer` hoặc `reason`, xem RUL29) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (D10/D13/D14/D15, cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos-runner.json`, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue()` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành của D13), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `root-affinity.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng (D15); `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item
- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem "Báo việc-phát-hiện từ trợ lý" trên, RUL45): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự D12) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, `stage: 'clarify'`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc "chỉ báo, không tự ghi" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log()` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`
- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song
- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ nay `moveStage` tới `decompose`, không còn thẳng `executing`; `judgeDiscovery` nhận thêm `view` tùy chọn (per discovery-context STR30) — cả sweep của runner LẪN verb `discover` truyền view đã đọc sẵn, không lời gọi nào cần đọc thêm
- `src/intake/decompose.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover` khi item ở stage `decompose`); verb `discover` (phiên sống) truyền `'session'`
- `src/intake/judge-executor.mjs` (discovery-judge-robustness D1-D5 / 87536f3f) — helper thử-lại dùng chung giữa `judgeDiscovery` và `judgeDecompose`: một lần gọi model qua cùng `resolveExecutorCommand`/`modelForTier`/spawn options hai file trên đã dùng; gãy-đọc (JSON hỏng/không phải object) thử lại đúng một lần với bản nhắc chặt hơn, cùng `cfg.timeoutMs` mỗi lần gọi (hai ngân sách độc lập, không cộng dồn); gãy vì lý do khác (spawn lỗi/không-zero-exit/timeout) không bao giờ thử lại; thử lại tự gãy (dù kiểu gì) trả `null`, hai call site tự áp fail-safe hiện có của riêng mình lên `null` đó — helper không tự tạo verdict shape mới
- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`entropy-history.jsonl`, cùng thư mục dữ liệu với `events.jsonl`) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này
- `.fgos-runner.json` — config committed (executor template + models light/haiku, standard/sonnet, heavy/opus + timeoutMs); `executor.args` mang `--permission-mode acceptEdits` + `--allowedTools "Bash(git add:*),Bash(git commit:*)"` (quyền TỐI THIỂU, xem RUL6); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfig(configPath)` — bọc quanh `loadRunnerConfig` không đổi (vẫn báo lỗi ngay trên một đường tường minh vắng mặt): tại đường MẶC ĐỊNH (không `--config`) vắng mặt, viết `DEFAULT_RUNNER_CONFIG` (mirror y hệt nội dung file này) rồi mới nạp, kèm một dòng thông báo tên file + executor giả định (RUL48); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfig` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh
- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue()`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau (D16); hiện thực in-process của "cửa ghi" D12
- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process, per D13): `createOwnershipStore()` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này
- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `actor` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle D1)
- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State "Cửa pull giao–nhận việc" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30, xem spec Work-State "Cửa pull giao–nhận việc")
- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per D1-D5 pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per D3 fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → commit-hoặc-abort, spike-proven; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3, D16) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner, D16); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`proposed→done`/`proposed→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra
- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem "Cổng duyệt PR nội bộ" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `root-affinity.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường (D8); gốc không con giữ nguyên hành vi/lý do cũ, không đổi
- `src/runner/github-adapter.mjs` (github-adapter D1-D5, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về "chưa rõ" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter D6) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (D4 — verify vẫn ở cây làm việc cục bộ).
- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem "Cổng duyệt qua GitHub" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter D6) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.
- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem "Đồng bộ lại một việc đỗ (catch-up)" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `integration-drift`} và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'proposed', expectedStatus:'blocked')` — cạnh D18, không `reason`, không qua `doing` (per D6/D7/D11, spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)
- `src/evolve/candidates.mjs` — Gate A candidate ranking (self-improve loop STR13 Slice 1, per D6/D11/D12): thuần (`rankCandidates(view)`), không fs/Date.now(), tái dùng `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa "chưa ngã-ngũ" hay trọng số riêng); một candidate mỗi id còn friction chưa ngã-ngũ, trường hiển thị lấy từ bản ghi MỚI NHẤT theo `ts`, `score` cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, sắp xếp score giảm dần rồi id tăng dần (tie-break). Manifest layer: domain.
- `bin/fgos.mjs` verb `evolve` — bề mặt CLI của Gate A (xem "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác (D11) — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3, D15) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.
- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2, per D13/D14): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm per D14, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).
- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem "Iron Law — phân loại rủi ro của một candidate fix" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: `bin/fgos.mjs`'s `approve` verb, nguồn `runner`, ngay trước bước kiểm cây sạch (STR13 Slice 3, D16/D17).
- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per D3 worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed, per D4/D1) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent` (per D3). Manifest layer (`docs/architecture-manifest.json`): infra.
- `AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos/fgos-routing/SKILL.md`
- `.claude/skills/fgos/fgos-routing/SKILL.md` + `.agents/skills/fgos/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp
- `.claude/skills/fgos/fgos-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `clarify`)
- `.claude/skills/fgos/fgos-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `decompose`)
- `.claude/skills/fgos/fgos-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `decompose`, gác cạnh `decompose→executing`)
- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần
- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)
- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy
- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là "chính phiên này tiếp tục", không phải một chủ cạnh tranh; danh tính KHÁC: số nguyên giữ nguyên phép thử sống+ttl có sẵn, chuỗi chỉ xét độ mới theo `ttlMs` (không có gì để kiểm sống); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ). Manifest layer: infra.
- `src/runner/session-identity.mjs` (STR65) — `resolveWriterIdentity()`: ưu tiên `BEE_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` (đúng thứ tự ưu tiên với `.bee/bin/lib/lock.mjs`'s `envSessionId`) làm danh tính chuỗi; vắng cả hai thì đi ngược 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi ps) lấy một pid số làm danh tính — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → lui về pid của chính người gọi thay vì treo/ném lỗi. Manifest layer: infra.
- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem "Khóa hoạt động cây chính" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); gọi `resolveWriterIdentity()` rồi `acquireMainCheckoutLock` với `ttlMs` mặc định 900000 (15 phút, đọc đè được qua biến môi trường `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`) — số này chọn từ bằng chứng thật (khoảng cách giữa các commit thật của 3 sự cố STR65 có SHA, ~2-3.5 phút); HELD/AMBIGUOUS → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0; ACQUIRED → thoát 0 im lặng.
- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.
- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-clarify + 3 kịch bản stage-decompose: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimActor`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→proposed`, D18) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 637 test toàn suite (`cd repo && npm test`)
