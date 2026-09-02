---
area: runner
updated: 2026-08-12
sources: [phase-2-routing, post-divorce-hardening, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1, discovery-context, worker-execution, fan-out-parallel, human-rounds, worker-dispatch-log, self-improve-loop, base-workflow-model-s2, fgos-multi-session-checkout, github-adapter-s3, github-adapter-s4, work-graph-intelligence-s2b, work-graph-intelligence-s10, work-graph-intelligence-s11, fgos-sample-testbed, p50-workflow-induct, str68-discovery-judge-robustness, str76-runner-bootstrap, str86-runner-headless-git, str7-str8-priority-intent, str51-2-reclaim-self-mount-fix, mvp2-scope-test-infra, str46-io-contract-lat2, spec-docs-lifecycle-realignment]
decisions: [feed7428, 14396a5c, 1a80b4d3, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e, cfae0120, 22699c61, 04a6cd05, 396d9d9e, 2e92b7a5, f0c40acc, 5a6900b2, 8575f1a3, c8df2479, cb09d6fd, b1aa1bdc, caecb9d1, 9b141173, a3176299, 140eb8a4, 76b7a36b, 8d04bba3, 1cd895e1, 38160a70, c11322cb, 2ac16176, f8a3a5d9, 3d4ea29c, 3c8e5926, 342102b9, d4c59ba2, 644916a4, ef6ed305, a4fe4c2b, f69951df, 5208dfe9, 8cf7effe, 7bbe6315, a7c93ec8, cfdd808f, 31b5f045, 87536f3f, 38f7e0b8, ecfd0d1a, f176c18a, d3445024, cf3ee399, fa12fd97, a58a7563, 6e2776cc, 8b95f883]
coverage: full
---

# Spec: Runner (vòng tự hành)

Vòng lặp tự hành của forgent: tự lấy việc sẵn-sàng từ work-state, giao cho một trợ lý thông minh chạy nền trong không gian cô lập, tự chấm kết quả bằng proof của chính việc đó, rồi ghi lại thành **đề xuất chờ duyệt**. Người dùng: người vận hành repo (khởi động vòng, duyệt đề xuất). Nguyên tắc sống còn: trong vòng dispatch, chỉ runner được ghi trạng thái; worker chỉ để lại commit trên nhánh riêng.

## Entry Points & Triggers

- `fgos-runner --once` → chạy đúng một vòng: gặt-lại → tìm việc → giao việc theo MẺ (nhiều việc cùng lúc, giới hạn hai tầng) → chấm từng việc → ghi, rồi nạp lại mẻ kế tiếp — lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng (xem "Giao việc theo mẻ, song song có giới hạn" dưới)
- `fgos-runner --dry-run` → in kế hoạch (việc nào sẽ chạy, model nào) mà không làm gì
- `fgos-runner --watch [--poll-ms <n>]` → chạy BỀN, không tự thoát khi frontier rỗng; lặp lại vòng đời `--once` mỗi lượt, phản ứng gần-tức-thời khi lượt vừa xong có ghi gì đó, nghỉ `--poll-ms` (mặc định 5000) khi lượt đó không ghi gì; dừng CHỈ qua SIGINT/SIGTERM tường minh — xem "Vòng cầm-giao bền (--watch)" dưới
- Khởi động MỌI vòng đều bắt đầu bằng bước **gặt-lại** (reap): giải quyết các claim runtime (hoặc item mang trạng thái bền `doing` di sản) từ lần chạy trước bị crash trước khi tìm việc mới — xem "Gặt-lại lúc khởi động" dưới
- Ngay sau gặt-lại, TRƯỚC khi tìm việc thi công: **quét nghiên-cứu** — giao worker thật cho mọi item ở stage `discovery`; xem "Quét nghiên-cứu trước dispatch" dưới
- Ngay sau quét nghiên-cứu, CÙNG TRƯỚC khi tìm việc thi công: **quét chia-việc** — mọi item ở stage `planning`, cộng tên stage di sản `decompose`; xem "Quét chia-việc trước dispatch" dưới
- `fgos take`/`fgos return` (cửa pull, ngoài vòng runner — xem spec Work-State "Cửa pull giao–nhận việc") claim/trả việc qua bản ghi runtime claim (mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` — *new claims do not durably write into doing*) + CAS + goal-check runner tự dùng; gặt-lại lúc khởi động BỎ QUA claim đến từ cửa pull — xem "Gặt-lại lúc khởi động" dưới
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>] [--acknowledge-iron-law]` / `fgos reject <id> --reason "..."` (ngoài vòng runner, gọi bởi người vận hành) — cổng duyệt PR nội bộ cho một đề xuất `awaiting-approval` đã sẵn, MỘT cổng cho cả nguồn runner lẫn pull-door; `approve` nguồn runner còn chạy phán Iron Law trước khi merge, nhưng CHỈ khi lần merge đó land lên trunk (self-improve loop STR13 Slice 3, ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" dưới
- `fgos review <id> --github [--pr <n>]` / `fgos approve <id> --github --pr <n>` (ngoài vòng runner, gọi bởi người vận hành, tuỳ chọn — github-adapter) — vận chuyển thay thế của CÙNG cổng duyệt trên, đưa việc duyệt sang GitHub thay vì diff/merge cục bộ, chỉ áp dụng cho đề xuất nguồn runner; `review --github` kèm `--pr` là phép hỏi thăm trạng thái sống của một PR đã mở, không mở PR mới (github-adapter, phát hiện đóng-không-merge) — xem "Cổng duyệt qua GitHub" dưới
- `fgos catchup <id>` (ngoài vòng runner, gọi bởi người vận hành) — đồng bộ lại một việc đang đỗ (`blocked`) vì gãy nhập (xung đột, verify đỏ sau nhập, hoặc trôi tích hợp): kéo trạng thái mới nhất của đích vào nhánh riêng của việc rồi thử lại — xem "Đồng bộ lại một việc đỗ (catch-up)" dưới
- `fgos evolve` / `fgos evolve --pick <id>` / `fgos evolve --submit <id>` (ngoài vòng runner, gọi bởi người vận hành, on-demand — self-improve loop STR13) — Gate A của vòng tự cải thiện: xếp hạng candidate từ friction chưa ngã-ngũ, người chọn một hoặc dừng (đọc-thuần tuyệt đối), hoặc bắc cầu candidate đã chọn sang một việc thật (`--submit`, hành động ghi duy nhất của bề mặt evolve) — xem "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)" dưới
- `fgos session start [--item <id>]` / `fgos session end <session-id> [--force]` / `fgos session list` / `fgos session gc` (ngoài vòng runner, gọi bởi người vận hành/một tác nhân) — vòng đời phiên checkout đa-phiên tùy chọn: một worktree detached-HEAD mỗi phiên cho cây nguồn, dùng chung MỘT kho `.fgos/` qua symlink; `end` từ chối một phiên đã rời commit khởi tạo trừ khi `--force`; `gc` dọn các mục sổ mồ côi (worktree đã mất khỏi git, hoặc pid của lệnh `start` một-lần đã chết), tha các phiên còn commit lửng hoặc còn thay đổi chưa commit — xem "Phiên checkout đa-phiên" dưới

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế {prompt}/{model} theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`, xem CTR009 v2 dưới) · `executors` — TÙY CHỌN, bảng tier→executor riêng (cùng hình dạng `executor`); tier không khai riêng rơi về `executor` chung (STR41/D a4fe4c2b) · `models` — bảng tier→model phẳng (light/standard/heavy), HOẶC `modelPolicies` (tsk-5tm, thay thế) — bảng provider→tier→model, provider mặc định `claude`, vocab tier riêng 5 giá trị (lightweight/standard/creative/analytical/critical), tự map từ tier work-item 3 giá trị qua `DEFAULT_TIER_TO_POLICY` (light→lightweight, standard→standard, heavy→critical), một executor có thể override qua `rigorOverrides` riêng; `modelForTier` ưu tiên `modelPolicies` khi cả hai cùng có mặt — chỉ cần khai MỘT trong hai, không bắt buộc cả hai · `timeoutMs` — trần thời gian một worker | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`) — bản mặc định dò trợ lý sẵn có trên máy, dùng đúng lệnh trợ lý đó nếu nhận diện được (`claude` hôm nay), hoặc một placeholder tự-báo-lỗi nếu không (xem RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)/RUL48b); một `--config <path>` tường minh trỏ vào đường vắng mặt KHÔNG tự sinh, vẫn báo lỗi ngay |
| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |
| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` **ở stage executing** TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp. Executing-phase-only scoping (claim-lock): trước đây, pick/take chỉ mở frontier (executing-phase), nên counting mọi `todo→doing` move tương đương dispatch attempts. Claim-lock cho phép `pick` cầm stage khác — claim-release cycle ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) không được tính vào ngân sách executing-phase (per claim-lock code-review finding) | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |
| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |
| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |
| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |
| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem "Xem live output worker khi đang chạy") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |
| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |
| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" và "Iron Law" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |
| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (từ STR91: luật `domain: 'coding'` khớp TRƯỚC wildcard — domain vắng mặt hay không nhận diện được đều fold về `coding` giống mọi nơi khác trong hệ, không phải một fallback riêng — trỏ `worker-prompt-skill-pointer.txt`; mọi domain đã đăng ký khác `coding` (vd `synthetic`) vẫn rơi về wildcard, trỏ `worker-prompt-default.txt` như trước STR91) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) · template `worker-prompt-skill-pointer.txt` giữ đủ 6 mục cố định sẵn có, CHỈ thêm đúng một mục `# Agent skill` trỏ `SKILL.md` của domain đó — đường dẫn luôn resolve qua sổ đăng ký domain→skill (`skillForStage`, spec Work-State "Mô hình domain"), không bao giờ hardcode (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`)) | yes (một template mặc định luôn có) | `worker-prompt-default.txt`, `worker-prompt-skill-pointer.txt` |

## Behaviors & Operations

### Kiểm tra tiền-điều-kiện lúc khởi động (repo root + HEAD phải resolve được)

- **Runs when:** MỌI lần `fgos-runner` khởi động — TRƯỚC CẢ bước gặt-lại, một lần duy nhất mỗi lần chạy.
- **Blocked when:** thư mục làm việc không nằm trong một repo git (`git rev-parse --show-toplevel` thất bại) — `validation`; repo tìm được nhưng KHÔNG có commit nào nên HEAD không resolve được (`git rev-parse --verify --quiet HEAD` thất bại) — CŨNG `validation`, cùng phạm trù với nhánh "không phải repo git" ngay phía trên, thông điệp nêu rõ nguyên nhân (0 commit) VÀ cách sửa (chạy `git commit` trước).
- **What changes:** không gì — đây là một kiểm tra thuần, dừng tiến trình runner trước khi bất kỳ item nào được claim, không ghi sự kiện nào.
- **Afterwards:** repo hợp lệ (có ≥1 commit) → runner tiếp tục xuống gặt-lại như trước, không đổi hành vi; repo 0 commit → runner dừng ngay tại đây với lỗi `validation` rõ ràng, KHÔNG còn đường cũ (thử claim một item, `git worktree add` thất bại vì HEAD không resolve, thử lại theo bảng phục hồi, rồi đỗ item sau khi tốn hai lượt thử vô ích) — lỗi bây giờ nêu đúng nguyên nhân gốc thay vì một lỗi worktree khó hiểu (per D ecfd0d1a).

### Một vòng --once (hạnh phúc)

- **Runs when:** người vận hành gọi; MỘT hoặc NHIỀU việc cùng lúc trong một mẻ (xem "Giao việc theo mẻ, song song có giới hạn" dưới) — mỗi việc đi đúng vòng đời dưới đây, độc lập với việc khác trong cùng mẻ.
- **What changes:** việc đầu frontier được claim qua `claimWork` / `acquireClaim` (tạo bản ghi claim runtime `.fgos/runtime/claims/<id>.json`, trạng thái bền giữ nguyên pre-claim, trạng thái hiệu lực `effectiveStatus` hiển thị `doing`; mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký — *new claims do not durably write into doing*); **ngay sau khi claim, runner ghi nửa DỰ ĐOÁN của một bản ghi kết quả (outcome) cho việc đó** — tier dự kiến, số dep, số lần nhận trước đó (xem spec Work-State); worktree + nhánh `fgw/<id>` mở ra từ đỉnh cây chính; trợ lý chạy nền với prompt dựng từ chính việc đó (mục tiêu / mô tả gốc nguyên văn / ranh giới worktree / proof kỳ vọng / cấm tự ghi trạng thái — cộng thêm một mục Human feedback khi item mang câu trả lời làm-rõ mới nhất và/hoặc lý do từ-chối/đỗ mới nhất, xem RUL23 (phản hồi người threading vào prompt worker)), dưới quyền TỐI THIỂU khai trong `.fgos/config.json`'s `runner` section (xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)), model chọn theo tier của việc; trợ lý tự commit trong worktree; **runner tự chạy lệnh proof của việc trong worktree** — không tin lời trợ lý; đạt → `settleClaim` chuyển bền trực tiếp từ `preClaimStatus → awaiting-approval` (không qua trạng thái trung gian bền `doing`) và giải phóng claim file, và **CÙNG LÚC runner ghi nửa THỰC TẾ tương ứng** (kết cục `awaiting-approval`, goal-check đạt, số lần thử, số commit, số lần nhận) — đo từ chính goal-check/kiểm nhánh của runner, không bao giờ từ lời tự báo của trợ lý; worktree dọn đi, **nhánh ở lại** làm đề xuất.
- **Side effects:** đúng các sự kiện chuyển trạng thái trong nhật ký; output của trợ lý được in console NHƯ CŨ, và CÒN được nối thêm vào một bản ghi cục bộ riêng cho việc đó (xem "Ghi lại output của trợ lý sau mỗi lượt dispatch" dưới) — bản ghi này không bao giờ vào cây committed.
- **Afterwards:** người vận hành thấy việc ở `awaiting-approval` + nhánh để review; việc phụ thuộc CHƯA mở (chờ duyệt/merge → `done`); vòng --once thứ hai không giao lại việc nào (frontier trống). Kết cục cuối của lượt được in ra dưới dạng phong bì máy-đọc (xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb) dưới), dòng cuối cùng của output.

### Vòng cầm-giao bền (`--watch`) — str7-str8-priority-intent

- **Runs when:** người vận hành gọi `fgos-runner --watch` — thay thế `--once` cho một tiến trình muốn sống lâu, phản ứng khi có việc thay vì phải gọi lại tay mỗi lần.
- **What changes:** mỗi LƯỢT bên trong đi đúng vòng đời "Một vòng --once" ở trên nguyên vẹn, không đổi gì trong đó. Giữa các lượt: lượt vừa xong ghi được ít nhất một sự kiện (claim, chuyển stage, kết quả, …) → lượt kế tiếp bắt đầu NGAY; lượt vừa xong không ghi gì (frontier rỗng, hoặc cả mẻ đều bị từ chối nhận) → chờ một khoảng nghỉ (`--poll-ms`, mặc định 5000ms) rồi mới thử lại. Cầu dao (Data Dictionary #5) và hàng-đợi-ghi tuần tự (RUL24 (một-người-ghi vẫn giữ nguyên dưới song song, qua một cửa ghi tuần tự)) đều dùng CHUNG một thực thể xuyên suốt cả tiến trình `--watch`, không tạo mới mỗi lượt — xem RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh).
- **Blocked when:** `--watch` kèm `--dry-run` → `validation` (mã 4), từ chối trước khi chạy lượt nào.
- **Side effects:** một lượt gặp lỗi/dừng (halted) chỉ dừng LƯỢT đó — được ghi nhận, tiến trình vẫn tiếp tục nghỉ-rồi-thử-lượt-kế-tiếp, không bao giờ tự thoát vì một lượt lỗi.
- **Afterwards:** tiến trình chạy tới khi nhận SIGINT/SIGTERM — thoát sạch, mã 0, in dòng xác nhận đã dừng, bất kể lượt cuối cùng ra sao; một tín hiệu dừng THỨ HAI trong lúc lượt đang dở buộc thoát ngay (mã 130), không chờ lượt đó tự xong. Mỗi chu kỳ bên trong in phong bì kết cục riêng của nó (xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)) trước khi chờ chu kỳ kế tiếp; dòng xác nhận-đã-dừng cuối cùng vẫn là chữ trần, không bọc phong bì.

### Giao việc theo mẻ, song song có giới hạn, giữ quyền-sở-hữu-gốc

- **Runs when:** ngay sau quét làm-rõ + quét chia-việc, và lặp lại mỗi khi một mẻ vừa dispatch xong (một hoặc nhiều việc trong mẻ tới kết cục cuối).
- **What changes:** đọc lại TOÀN BỘ tập việc sẵn-sàng tươi; lọc theo quyền sở-hữu gốc — một việc chỉ lọt vào mẻ nếu gốc của nó CHƯA có chủ, hoặc đã thuộc về CHÍNH lượt chạy này (một chủ khác giành nhận cùng gốc bị từ chối, cùng khuôn kỳ-vọng-lệch của mọi cửa nhận việc khác — trên một máy chỉ một chủ tồn tại nên đường từ-chối này hiếm khi thật sự xảy ra, nhưng vẫn được kiểm mỗi lần); nhóm phần còn lại theo gốc, lấy tối đa N gốc, mỗi gốc lấy tối đa M con (trần hai tầng, Data Dictionary #6); mỗi việc trong mẻ được nhận (`todo→doing`) qua đúng MỘT cửa ghi tuần tự (xem RUL24 (một-người-ghi vẫn giữ nguyên dưới song song, qua một cửa ghi tuần tự)) — dù nhiều việc thi công song song, quyết-nhận và ghi-nhận của từng việc vẫn nối tiếp nhau, không bao giờ hai lượt nhận chen lẫn; việc bị từ chối nhận ở lại chờ mẻ sau, không mất.
- **Side effects:** mỗi việc trong mẻ chạy vòng đời "Một vòng --once" ở trên, đồng thời với việc khác trong CÙNG mẻ, cho tới kết cục cuối của từng việc (đề xuất, đỗ, hoặc dừng).
- **Afterwards:** mẻ xong (mọi việc trong mẻ đã tới kết cục) → đọc lại tập sẵn-sàng TƯƠI (việc vừa xong có thể mở khóa việc phụ thuộc, hoặc mở khóa chính gốc của nó nếu đó là con cuối cùng) rồi nạp mẻ kế tiếp — lặp tới khi KHÔNG còn việc đang chạy VÀ KHÔNG còn việc sẵn-sàng, vòng --once mới kết thúc thật sự.

### Cây nhánh tích hợp — con nhập vào nhánh của gốc, chỉ gốc nhập vào cây chính

- **Runs when:** mỗi lần một việc CON (có việc cha, xem spec Work-State "Giai đoạn Chia-việc") được dispatch hoặc đề xuất của nó được duyệt.
- **What changes:** một việc GỐC (không việc cha, hoặc chính là đỉnh một cây) mở nhánh đề xuất riêng như mọi việc khác (Data Dictionary #2) — nhánh đó nay CŨNG đóng vai nhánh tích hợp của cả cây hậu duệ nó. Một việc CON mở worktree từ ĐỈNH nhánh của gốc nó (không phải từ cây chính) — kế thừa mọi việc anh em cùng gốc đã nhập trước nó. Đề xuất của một việc CON, khi qua cổng duyệt PR nội bộ, nhập vào NHÁNH CỦA GỐC — không bao giờ nhập thẳng vào cây chính. Một việc ĐỘC LẬP (không con, không cha) đi đúng đường cũ không đổi: đề xuất của nó nhập thẳng vào cây chính như trước.
- **Afterwards:** chỉ khi TOÀN BỘ con của một gốc đã `done`, gốc mới tới lượt sẵn-sàng dispatch (cơ chế lineage sẵn có, xem spec Work-State) — verify của chính gốc lúc đó chạy trên nhánh của gốc (đã chứa mọi con đã nhập) như phép kiểm tích hợp cho cả cây; gốc đi tiếp đúng vòng đời và cổng duyệt như mọi việc khác, và CHỈ đề xuất của gốc mới nhập vào cây chính, đúng một lần cho cả tính năng. Bảo đảm nghiệp vụ: cây chính không bao giờ nhận một mảnh dở của một tính năng nhiều-việc — chỉ nhận nguyên vẹn khi toàn bộ cây đã xong (xem RUL25 (cây chính chỉ nhận nguyên một tính năng đã xong, không mảnh dở)).

### Trôi tích hợp & đồng bộ lại tại gốc→cây chính (integration drift)

- **Runs when:** cổng duyệt PR nội bộ (`approve`) xử lý đề xuất của một GỐC từng có con (đã đi qua cây nhánh tích hợp ở trên).
- **What changes:** trước khi nhập vào cây chính, hệ thống kiểm CẢ HAI điều kiện: (a) nhập có xung đột văn bản không; (b) SAU khi nhập (nhưng CHƯA chốt), verify của chính gốc chạy lại trên cây đã nhập — đại diện cho "cả tính năng cộng với mọi thứ khác đã vào cây chính từ lúc gốc bắt đầu vẫn đúng cùng nhau", không chỉ "nhập được không xung đột". Xung đột văn bản HOẶC verify đỏ ở bước (b) đều bị coi ngang nhau — cả hai là TRÔI tích hợp: hủy sạch việc nhập (cây chính giữ nguyên, không bao giờ giữ một nhập xanh-mà-gãy), gốc đỗ lại mang lý do trôi-tích-hợp RIÊNG (phân biệt với lý do gãy-nhập thường của một việc không-con) cùng dấu vết chỗ cây chính đang đứng lúc đó.
- **Afterwards:** gốc đỗ vì trôi tích hợp chờ người gọi đồng bộ lại (xem "Đồng bộ lại một việc đỗ (catch-up)" dưới); nhập sạch + verify xanh ở bước (b) → gốc `done`, tính năng hoàn tất trên cây chính.

### Đồng bộ lại một việc đỗ (catch-up)

- **Runs when:** người vận hành gọi `fgos catchup <id>` trên một việc đang `blocked` vì gãy nhập (xung đột, verify đỏ sau nhập, hoặc trôi tích hợp).
- **Blocked when:** việc không tồn tại — `validation`; việc không ở `blocked` — `precondition`; lý do đỗ hiện tại không thuộc nhóm gãy-nhập (vd đỗ vì chạm trần chống-lặp, hoặc gặt-do-crash) — `validation`, đồng bộ-lại không giúp được những lý do đó, người phải cầm việc qua cửa pull để tự sửa tay; nhánh riêng của việc không còn tồn tại — `validation`.
- **What changes:** hệ thống xác định ĐÍCH cần đồng bộ — nhánh của gốc nếu việc là con, cây chính nếu việc là gốc/độc lập — rồi kéo trạng thái MỚI NHẤT của đích vào nhánh riêng của việc (nhập, chưa chốt), chạy verify của chính việc trên kết quả TRƯỚC KHI chốt: nhập sạch + verify xanh → chốt, việc chuyển thẳng `blocked → sẵn sàng nộp lại` — KHÔNG đi qua `đang làm`, một bước CƠ HỌC không tính vào ngân sách chống-lặp của việc; còn xung đột → hủy sạch việc nhập vừa thử, việc giữ nguyên `blocked`, thông báo tên các tệp xung đột cho người tự xử lý; verify đỏ sau khi nhập sạch → cũng hủy sạch, việc giữ nguyên `blocked`, người phải tự điều tra vì sao đồng bộ xong mà verify vẫn gãy — cả hai đường thất bại này KHÔNG có cơ chế agent tự giải xung đột (đó là mở rộng sau, xem Open Gaps).
- **Side effects:** không gì ngoài dấu vết trên nhánh riêng của chính việc đó (khi thành công) — cây chính/nhánh của gốc không bao giờ bị đụng bởi lệnh này.
- **Afterwards:** đồng bộ thành công → việc actionable lại qua đúng cổng duyệt PR nội bộ như một đề xuất bình thường, không cần nộp lại từ đầu; đồng bộ thất bại → việc vẫn đỗ, người chọn giữa gọi lại `catchup` sau khi đích đổi tiếp, hoặc cầm việc qua cửa pull để tự làm-lại tay — đường làm-lại tay CÓ tính vào ngân sách chống-lặp (đi qua `đang làm` bình thường), phân biệt với đường cơ học ở trên (xem RUL28 (đồng bộ-lại sạch = cơ học không đếm; làm-lại tay = có đếm)).

### Phát hiện trôi sau nhập nhánh (postLand drift & notify consumer)

- **Runs when:** một việc vừa nhập (`outcome === 'merged'`) vào nhánh đích của nó (`classifyPostLandDrift`/`detectPostLandDrift`, tsk-2ypd), hoặc khi kiểm tra liveness/doctor/orient (tsk-1el).
- **What changes:** cơ chế `postLand` (`detectPostLandDrift`, tsk-2ypd) tính toán danh sách các tệp thay đổi thực tế của nhánh vừa nhập và so sánh trùng lặp đường dẫn (real path overlap) với mọi nhánh con/gốc phụ thuộc đang mở chung đích. Khi có trùng lặp, kết quả được phân nhánh thành `notify` (nhánh có phiên sống) và `stale` (nhánh không phiên sống). Consumer phía `notify` (`postLandDrift`, `src/state/postland-drift.mjs`, tsk-1el) tính toán lại theo cơ chế recompute-on-read lũy thừa từ điểm phân nhánh (cumulative since fork): báo trực tiếp cho phiên sống sở hữu nhánh qua kiểm tra `fgos doctor` (`leaf-notify-drift`) và vòng lặp tự hành Orient (`fgos-coding-driving`). Nhánh `stale` được bảo vệ thụ động bởi cổng nhập catch-up.
- **Afterwards:** phiên sống phát hiện trôi tích hợp sớm để tự điều chỉnh hoặc đồng bộ lại trước khi tới lượt nhập real-merge.

### Quét nghiên-cứu trước dispatch (discovery dispatch)

- **Runs when:** mỗi lượt chạy, ngay sau gặt-lại, TRƯỚC khi giao bất kỳ việc
  thi công (executing) nào.
- **What changes:** mọi item ở stage `discovery` VÀ status `todo` được GIAO
  cho một worker thật — cùng cỗ máy worktree-tạm + spawn mà một việc thi công
  dùng, chỉ khác mẫu prompt: mẫu riêng của giai đoạn nghiên-cứu, trỏ tới đúng
  skill mà sổ đăng ký domain ánh xạ cho stage đó (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`), spec Work-State
  "Mô hình domain"). Đây là **pha máy-một-mình**: worker chỉ đọc và tra cứu,
  rồi tự phát một phán quyết máy-đọc-được (đủ-rõ hay chưa, kèm câu hỏi khi
  chưa, kèm đề xuất verify khi đã) trong chính output của nó; runner KHÔNG
  BAO GIỜ tự phán thay — không còn lời gọi phán-đoán lồng nào ở bước này.
  Chỉ item `todo` bị chạm: item đã có người/phiên cầm (`doing`) hoặc đang
  `awaiting-human` (đã hỏi, chưa ai trả lời) KHÔNG BAO GIỜ bị quét lại — cùng
  luật loại-trừ với dispatch thường (xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp) (work-state)/RUL15 (role trên mọi ngã-ngũ tự động của runner) (work-state)).
  Stage `exploring` — nửa máy+người của vòng làm-rõ — KHÔNG nằm trong bất kỳ
  quét nào của vòng tự hành: nó cần người quyết, nên runner để nguyên cho một
  phiên sống cầm qua cửa pull.
- **Side effects:** một lượt dispatch worker thật cho mỗi item quét được —
  worktree tạm, bản ghi output cục bộ, dọn worktree trên mọi đường thoát —
  y hệt một lượt thi công. Hai lưới an toàn giữ item đứng yên thay vì bị đẩy
  tiếp bừa: worker chạy xong mà nhánh KHÔNG có commit nào → không được coi là
  đã nghiên cứu, item nằm nguyên `discovery`/`todo` đợi lượt sau; output
  không mang phán quyết đọc được (thiếu khối, hỏng hình) → engine giữ nguyên
  item, không bao giờ tự coi "không chắc" là đủ rõ. Một lượt dispatch
  nghiên-cứu gãy (hỏng-spawn/quá-giờ/hỏng-worktree) chỉ được ghi log rồi
  sang item kế tiếp — không bao giờ làm sập cả lượt chạy.
- **Phân loại kèm theo (tuỳ chọn):** khi phán quyết của worker có kèm
  tier/kind/risk, runner áp thêm bằng đúng cửa sửa-trường sẵn có; một giá trị
  ngoài từ vựng của domain bị từ chối, ghi log rồi bỏ — không bao giờ chặn
  phán quyết đã ngã-ngũ ở trên.
- **Afterwards:** phán quyết đủ rõ → item sang stage `planning` THẲNG, bỏ qua
  `exploring` (mang verify thật khi item chưa có verify thật của riêng nó) —
  CÙNG lượt chạy này, quét chia-việc bên dưới (xem "Quét chia-việc trước
  dispatch") có thể nhặt được nó ngay; phán quyết chưa đủ rõ → item sang stage
  `exploring` VÀ đậu `awaiting-human` mang câu hỏi, để người trả lời xong là
  đã sẵn ở đúng chỗ cho một phiên làm-rõ có người, không phải quay lại
  nghiên-cứu cho cùng một câu hỏi. Một đề xuất verify bị vòng kiểm độc lập
  bắt lỗi cú pháp cũng đậu `awaiting-human` y như vậy. Đây là **lưới đỡ**: dù
  phiên submit chết trước khi tự chạy vòng làm-rõ, lượt chạy tiếp theo của
  vòng tự hành vẫn tự giao nghiên cứu — không item nào kẹt vô hình.

### Quét chia-việc trước dispatch (plan sweep)

- **Runs when:** mỗi lượt chạy, NGAY SAU quét nghiên-cứu (không phải một lượt
  chạy riêng) và vẫn TRƯỚC khi giao bất kỳ việc thi công (executing) nào.
  Đọc lại view TƯƠI sau quét nghiên-cứu — một item vừa được đẩy sang stage
  `planning` trong CÙNG lượt chạy này vẫn bị quét chia-việc ngay, không phải
  đợi lượt chạy sau.
- **What changes:** mọi item đang ở **stage thỏa bước Chia-việc của domain
  của chính nó** (per spec Work-State "Mô hình domain"; với `coding` đây là
  `planning`) VÀ status `todo` (xem spec Work-State "Giai đoạn Chia-việc")
  được chạy phán chia-việc — BẤT KỂ giá trị `mode` của item. CỘNG THÊM: item
  còn nằm ở tên stage di sản `decompose` cũng được quét bằng ĐÚNG bước này —
  đó là một **alias chỉ-để-rút-cạn**: không item mới nào còn được tạo ở tên
  đó, nhưng những item mở từ trước lần đổi tên phải rút ra được, không bị bỏ
  quên chỉ vì tên stage đã đổi (alias chỉ bật khi domain khai cả hai tên tách
  bạch — hôm nay chỉ `coding`). Cùng luật domain như quét nghiên-cứu trên:
  một domain không khai stage nào cho bước Chia-việc thì không item nào bị
  quét ở đây (per 1cd895e1, 38160a70). Việc đang `awaiting-human` KHÔNG BAO
  GIỜ bị quét lại — cùng luật loại-trừ với mọi dispatch khác (RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)
  (work-state)/RUL15 (role trên mọi ngã-ngũ tự động của runner) (work-state)).
- **Side effects:** KHÔNG có lời gọi model nào ở bước này. Quét của runner
  không mang theo phán quyết của người/phiên nào, nên nó chỉ đi một trong hai
  đường: bản kế hoạch đã ghi của item tự khai một cỡ việc một-mảnh (không
  chia được nữa) → item đi thẳng sang `executing`; mọi trường hợp còn lại →
  runner không làm gì cả, item nằm nguyên chờ một phiên sống tự phán rồi gọi
  verb chia-việc tay. Đây là fail-safe có chủ đích: sinh con là hành động GHI
  thật, không bao giờ được đoán — khác quét nghiên-cứu, nơi worker tự phán
  được vì phán quyết ở đó không ghi ra item mới nào (fail-safe, xem spec
  Work-State RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước) (work-state)).
- **Afterwards:** item đi thẳng (không chia) hoặc vừa sinh đủ con qua một
  phán quyết tay (gốc chuyển `planning → executing`) — CÙNG lượt chạy này,
  vòng dispatch bên dưới có thể nhặt được gốc ngay nếu deps/lineage cũng đã
  mở (gốc không có hậu duệ dang dở). **Claim-release (claim-lock §3b):** khi
  một gốc chuyển sang `executing`, nếu một claim `pick` đang sống ở stage
  `planning` (hoặc ở tên di sản `decompose`) được giữ — item ở
  `status: doing` — item được đặt lại về `status: todo`, giải phóng claim để
  phiên khác (hay cùng phiên) có thể gọi `pick <id>` lại ở stage `executing`
  với workspace cùng một branch (claim-release lifecycle cho các stage đầu
  vòng, per claim-lock §3a/§3c); item cần người quyết đậu ở `awaiting-human`
  mang đề xuất chia, đợi lượt chạy sau (hoặc gọi tay `fgos plan`) khi đã có
  câu trả lời. Đây cũng là một **lưới đỡ**, cùng tinh thần quét nghiên-cứu:
  không item một-mảnh nào ở stage `planning` kẹt vô hình chỉ vì chưa ai gọi
  `fgos plan` tay.

### Gặt-lại lúc khởi động (reap — phục hồi sau crash)

- **Runs when:** đầu MỌI lần chạy (`startupReap` trong `src/runner/loop.mjs`).
- **What changes:** `startupReap` thực hiện hai lượt quét theo thứ tự:
  1. **Lượt quét chính trên các bản ghi runtime claim (`readClaims`):** Duyệt qua mọi file claim runtime đang hoạt động (`.fgos/runtime/claims/*.json`). Các claim có `claimRole` (hoặc `actor`) là `human` hoặc `session` (claim từ cửa pull `take`/`pick` — xem spec Work-State) bị BỎ QUA hoàn toàn — người/phiên cầm vô thời hạn, gặt-lại không bao giờ giẫm lên claim đó. Với các claim runner còn lại (nghĩa là runner lần trước bị sập giữa chừng), gặt-lại giải quyết trực tiếp qua `settleClaim(..., finalStatus, role: 'runner')` chuyển thẳng từ `preClaimStatus` sang `finalStatus` (`awaiting-approval` nếu có commit + proof đạt, hoặc `blocked` kèm lý do gặt-do-crash nếu không đạt), giải phóng claim file mà KHÔNG ghi trạng thái trung gian bền `doing`.
  2. **Lượt quét fallback trên các item mang trạng thái bền `status: 'doing'` không có claim runtime:** Duyệt các item còn mang trạng thái **bền** `doing` trong nhật ký sự kiện mà KHÔNG có file claim runtime tương ứng (dữ liệu di sản chưa migrate hoặc vết từ đường ghi cũ). Lượt quét này trực tiếp gọi `moveWork(..., expectedStatus: 'doing', ...)` chuyển trạng thái bền sang `awaiting-approval` hoặc `blocked`. Lượt quét này cũng bỏ qua nếu `claimRole` của item là `human` hoặc `session`.
  Dọn dẹp nhánh/worktree theo nhánh của việc: nhánh bị worktree mồ côi giữ được đòi lại (dọn worktree cũ rồi mở lại); nhánh rỗng không commit → tỉa; nhánh có hàng → giữ cho người review.
- **On failure:** lỗi worktree khi gặt → việc đó về `blocked` có lý do, bước gặt KHÔNG BAO GIỜ chết thô — chạy-lại-sau-crash an toàn tự thân (có test giết thật giữa chừng).

### Chấm trượt / lỗi giữa vòng

- **What changes:** tra bảng phục hồi theo lớp lỗi — thử-lại (worktree mới, DÙNG LẠI nhánh cũ) → hết trần thì đỗ-lại (`doing→blocked` kèm lý do); lỗi tranh-chấp-ghi (kỳ vọng lệch vì người vận hành vừa ghi tay) → dọn dẹp rồi DỪNG sạch — không bao giờ giành ghi với người. Nhánh cũ reset về **baseline dispatch riêng của việc đó, chụp tại lần thử ĐẦU TIÊN** (không phải HEAD hiện tại của nhánh tại thời điểm thử-lại): một lần thử sau — dù sinh commit khác lần trước — không bao giờ mang commit của một lần thử ĐÃ THẤT BẠI đi tiếp, trong khi nội dung nhánh có từ trước lần thử đầu tiên (ví dụ một con đã merge trước đó) vẫn được giữ nguyên (fix STR1 #2, per review-260718-phase-2-routing-rerun / e2ccd0cd).
- **Side effects:** worktree luôn được dọn trên mọi đường thoát (kể cả dừng); quá trần chống-lặp → việc bị `todo→blocked` lý do chống-lặp, rời hẳn frontier.
- Khi việc bị đỗ-lại (`parked`, hết trần thử lại hoặc lỗi không thử lại được) hoặc bị dừng vì cầu dao (`halted`, chấm-trượt-liên-tiếp), runner **CŨNG ghi nửa THỰC TẾ** của bản ghi outcome — thất bại được học, không chỉ thành công. Nửa thực tế KHÔNG được ghi ở một lượt-thử-còn-thử-lại-được (chỉ ghi đúng một lần, ở kết cục CUỐI của việc).
- **Cùng lúc đó, runner ghi thêm một bản ghi friction** (kênh 2 của capture 2 kênh, Phase 3 Slice 2, xem spec Work-State): runner tự quy tội — dịch lớp lỗi thành một trong **5 lớp friction** cơ học: hỏng-spawn/quá-giờ/hỏng-worktree → `environment` · chấm-trượt → `verification` · nhật-ký-hỏng/việc-kẹt-do-crash/tranh-chấp-ghi → `state` · đề-xuất-bị-trả → `context` · lớp lạ → `task-spec` (mặc định). Bảng dịch là dữ liệu tĩnh, không phán xét — tích lũy friction là bằng chứng để hiệu chỉnh sau này, không phải kết luận tại chỗ.
- **Bổ chú (20260717, review-unreviewed-260717).** Ba lớp lỗi khoá-sự-kiện-bị-giữ/phiên-hỏng/nhập-gộp-hỏng (`lock-timeout`/`session-fail`/`merge-fail`) nay đều có mã thoát riêng trong bảng tra — một việc chạm một trong ba lớp này khiến `runOnce` dừng nhẹ đúng việc đó (`halted`, có kết quả cấu trúc) chứ không còn sập tung cả lượt chạy. Trước bản vá này, ba lớp lỗi trên vắng mặt khỏi bảng tra nên rơi vào nhánh sập-toàn-vòng (mọi việc khác trong lượt mất kết quả, mã thoát chung chung không phân biệt được với lỗi thật) — dù RUL7 (schema item mang đủ chất liệu trả lời sáu câu hỏi harness) vốn định nghĩa lớp lỗi lạ phải dừng nhẹ, không sập.

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
  luật kỷ-luật-output cũ (xem RUL31 (kỷ-luật-output nới rộng: console + bản ghi cục bộ riêng-từng-việc, không bao giờ vào cây committed)).
- **Afterwards:** người vận hành (hoặc một phiên agent khác) đọc lại được
  đúng những gì trợ lý đã làm/nói cho một việc, ngay cả sau khi console đã
  cuộn qua mất — kể cả cho những lượt thử KHÔNG BAO GIỜ tới `awaiting-approval`
  (quá-giờ, hỏng-spawn). Kết quả goal-check (verify) KHÔNG nằm trong bản ghi
  này — vẫn chỉ in console như trước, ngoài phạm vi thay đổi này.

### Xem live output worker khi đang chạy (live tee, STR39)

- **Runs when:** ngay mỗi khi một chunk stdout/stderr của trợ lý ĐẾN —
  trong lúc worker VẪN ĐANG CHẠY, không đợi lượt dispatch kết thúc (khác
  với khối kết-cục cuối trên, chạy ĐÚNG MỘT LẦN sau khi worker đã xong).
- **What changes:** chunk thô (không header/dấu thời gian, không bọc) được
  nối thẳng vào CÙNG file `.fgos/logs/<id>.log` của chính việc đó — qua
 đúng cửa ghi worker-log.mjs (một-cửa, không mở cửa ghi thứ hai). Mỗi
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
`.fgos/config.json`'s `runner.executor.args` đã là một mẫu Host Adapter (Data
Dictionary #1) — thêm một cờ như `--output-format stream-json` vào đó (nếu
CLI trợ lý hỗ trợ) chỉ đổi NỘI DUNG stdout trợ lý phát ra, không đổi đường đi
của nó: dispatch.mjs vẫn tee từng chunk y hệt bất kể định dạng (JSON-lines
hay text thường), worker-log.mjs vẫn là cửa ghi duy nhất. Không có nhánh code
nào phân biệt định dạng output — vì không cần: đây thuần là cấu hình, không
phải một tính năng runner phải hiểu.

### Ai ngã-ngũ — role trên settlement (Phase 3 S3-closeout)

Mỗi ngã-ngũ (kênh 1 của capture 2 kênh — xem spec Work-State "Bản ghi
settlement") mang thêm ai/cái gì đã ngã-ngũ nó:

- **Runs when:** mọi ngã-ngũ mà chính runner tự ghi trong vòng dispatch của
  nó — quét làm-rõ cho qua, quét chia-việc cho qua, nhận việc, đề xuất, đỗ.
- **What changes:** ngã-ngũ đó mang `role` = **runner**. Ngã-ngũ do một
  phiên đang sống tự gọi tay context-discovery mang `role` = **session**;
  ngã-ngũ do người gọi qua một lệnh CLI (chuyển trạng thái tay, trả lời một
  câu hỏi đang chờ) mang `role` = **human** — ba giá trị này phủ hết mọi
  đường ngã-ngũ hiện có. Từ vựng `role` nói chung nay có thêm giá trị thứ tư,
  `system` — cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết
 định — nhưng dùng trên cạnh park nội bộ (per str46-io-contract), không
  phải một điểm ngã-ngũ, nên không tính vào ba giá trị trên.
- **Afterwards:** ai đọc lại nhật ký (qua `fgos check`) biết chính xác AI đã
  đưa item qua từng ngã-ngũ của nó, không chỉ SỰ KIỆN gì đã xảy ra.

### Cổng duyệt PR nội bộ (approval gate) — review/approve/reject

MỘT cổng duyệt duy nhất cho MỌI đề xuất `awaiting-approval`, bất kể nguồn (per 
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
  "..."` trên một item đang `awaiting-approval`.
- **Blocked when:** item không tồn tại — `validation`; item không ở
  `awaiting-approval` — `precondition` ("nothing to review/approve/reject"); `reject`
  thiếu `--reason` — `validation` (bắt buộc, cùng khuôn `awaiting-approval→todo`);
  `approve --timeout` không phải số dương — `validation`; `approve` trên
  nguồn `runner` khi working tree của main KHÔNG sạch — `validation` (phép
  kiểm này loại trừ `.fgos/`: store sống mang cửa ghi riêng, tự mutate bởi
  chính take/return/approve nên không bao giờ tính là bẩn — `isFgosOnlyStatusLine`,
  `src/runner/merge.mjs`); `approve` trên nguồn `runner` **đang land lên trunk** (`resolveRoot(view,
  id) === id`) khi phán Iron Law trả
  `required: true` mà KHÔNG mang `--acknowledge-iron-law` **và
  `ironLaw.level` là `ask`** — `validation`,
  thông điệp nêu tên đúng cờ/module đã khớp (self-improve loop STR13 Slice 3,
ranh giới trunk + mức `ask`/`warn` per `0032` — xem "Iron Law"
  dưới, RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`)); chặn này chạy TRƯỚC cả bước kiểm cây sạch
  ở trên, không git nào chạy, đề xuất giữ nguyên `awaiting-approval`. Một
  leaf land vào `fgw/<root>` không đi qua chặn này chút nào, và ở mức
  `warn` chặn này không bao giờ từ chối — nó cảnh báo, ghi bản ghi, rồi
  merge tiếp. `approve` (KHÔNG
  `--github`) khi `cwd` NẰM TRONG một worktree phiên đã đăng ký (khớp hoặc
  lồng dưới một `worktreePath` trong `.fgos/sessions.json`) — `validation`,
  áp CHUNG cho cả hai nguồn `runner` VÀ `pull`/`legacy`, từ chối TRƯỚC mọi
  lệnh git và trước cả lần chạy `verify`/goal-check nào: đề xuất giữ nguyên
  `awaiting-approval`, main không đụng tới, thông điệp nêu ĐÍCH DANH session-id `cwd`
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
  goal-check nào, cùng khuôn với chặn sổ đăng ký (đề xuất giữ `awaiting-approval`,
  main không đụng tới); fail-open (coi là cây chính) khi `repoRoot` hoàn
  toàn KHÔNG phải một repo git — giữ nguyên hành vi đề xuất `legacy` chạy
  trên một thư mục không-git vẫn hoạt động như trước. **(Cập nhật,
 approve-worktree-guard-github-fix):** `approve --github` KHÔNG còn
  được miễn CẢ HAI chặn định-danh-worktree này — chặn sổ đăng ký và chặn
  cấu trúc đều dời lên chạy TRƯỚC nhánh `--github` (trước bất kỳ merge
  GitHub hay ghi trạng thái nào), vì tính hợp lệ của MÔI TRƯỜNG gọi lệnh
  (đây có đúng là worktree chính không) là điều kiện nền tảng hơn vận
  chuyển nào được chọn. `approve --github` CHỈ còn miễn phép kiểm
  cây-làm-việc-chính-phải-sạch (xem "Cổng duyệt qua GitHub" dưới) — phép
  kiểm đó tồn tại riêng vì một merge CỤC BỘ làm bẩn cây làm việc, điều một
  merge qua GitHub không hề gây ra. Phán Iron Law thì KHÔNG miễn: nó đã
  được dời lên chạy trước cả nhánh `--github` (review-20260718-self-improve-loop
  f01, xem RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)), nên một root land lên trunk qua GitHub đi qua đúng cổng
  ấy y như qua merge cục bộ. Không nhánh chặn nào ghi sự kiện.
- **What changes:**
  - `review <id>` — thuần đọc (không sự kiện nào): in diff theo nguồn —
    `runner` → `git diff main...fgw/<id>`; `pull` → `git diff
    headAtTake..headAtReturn` (dải NÀY có thể chứa commit của một phiên khác
    chen giữa `take`..`return` trong môi trường nhiều-phiên — CHẤP NHẬN
    degrade trung thực: in thêm một cảnh báo đếm số commit lạ trong dải,
    không bao giờ giấu); `legacy` → in cảnh báo "không có nguồn diff", KHÔNG
    BAO GIỜ nổ. Kèm một trace tóm tắt (outcome/friction hiện có của item, tái
    dùng định dạng của `check` sẵn có — không formatter mới).
  - `approve <id>` — nguồn `runner`: TRƯỚC MỌI thao tác git, khi và chỉ khi
    lần merge này land lên trunk (`resolveRoot(view, id) === id`), chạy phán
 Iron Law (self-improve loop STR13 Slice 3, ranh giới trunk per
    `0032` — xem "Iron Law" dưới) trên
    diff của chính đề xuất; `required: true` thiếu `--acknowledge-iron-law` →
    ở mức `ask` từ chối ngay (xem Blocked when), ở mức `warn` cảnh báo + ghi
    một bản ghi `kind: engine` rồi đi tiếp (RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`)); còn lại (required: false,
    hoặc required: true kèm cờ, hoặc merge target không phải trunk) đi tiếp
    đúng đường merge dưới đây, không đổi. `git merge --no-commit --no-ff
    fgw/<id>` staging-only vào main (spike "nocommit-probe", xem
    `docs/history/pr-lifecycle/reports/validation-s1-gate.md`); **conflict**
    → `git merge --abort` (main nguyên vẹn byte-for-byte, spike
    "merge-abort-probe") + `awaiting-approval → blocked` (reason `merge-conflict`) +
    một bản ghi friction lớp `state`; **staged sạch** → chạy `verify` CỦA
    ITEM (goal-check) trên chính cây đã staged, CHƯA commit — xanh → `git
    commit` (hoàn tất merge) rồi `awaiting-approval → done` mang **role `human`**
 (người chạy approve là ngã-ngũ, merge chỉ là hệ quả cơ học) + dọn
    nhánh/worktree (best-effort); đỏ → `git merge --abort` (main nguyên vẹn)
    + `awaiting-approval → blocked` (reason `verify-fail-post-merge`) + friction lớp
    `verification`. Nguồn `pull`/`legacy` — KHÔNG có bước merge (code đã
 trên main): chạy thẳng `verify` của item trên main qua CÙNG hàm
    `runGoalCheck` mà `return`/runner dùng — xanh → `done` role human; đỏ →
    `blocked` (reason `verify-fail`) + friction `verification`.
  - `reject <id> --reason` — `awaiting-approval → todo` mang `reason` + role human;
 KHÔNG BAO GIỜ chạy một lệnh git nào ("không auto-revert" — code của
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

Một VẬN CHUYỂN thay thế của CHÍNH cổng duyệt PR nội bộ trên (github-adapter)
— không phải một cổng thứ hai, không đổi luật FSM/role của cổng
gốc: chỗ diễn ra việc xem-diff chuyển sang trang PR thật trên GitHub, và chỗ
thực hiện merge chuyển sang API của GitHub thay vì `git merge` cục bộ. Chỉ áp
dụng cho đề xuất **nguồn runner** (nhánh `fgw/<id>` còn sống) — nguồn
pull-door/legacy không có nhánh để mở PR. Tuỳ chọn và cộng thêm: hoàn
toàn không đụng đường duyệt cục bộ sẵn có — một đề xuất không bao giờ bị ép
đi qua GitHub, người vận hành chọn mỗi lần gọi lệnh.

Việc mở PR và việc merge PR là HAI bước tách rời, gọi qua hai verb khác nhau
— không gộp một lệnh, vì một PR vừa mở chưa có lượt duyệt nào trên GitHub, gộp
một lệnh sẽ luôn gãy ngay lần dùng đầu tiên:

- **Runs when:** người vận hành gọi `fgos review <id> --github` (mở PR) rồi
  sau đó, sau khi đã tự duyệt/không-duyệt trên trang GitHub, gọi `fgos
  approve <id> --github --pr <n>` (merge PR số `n` vừa mở). Bất cứ lúc nào
  giữa hai bước đó, người vận hành cũng có thể gọi `fgos review <id> --github
  --pr <n>` (CÙNG verb, thêm `--pr`) để hỏi thăm trạng thái sống của PR trên
  GitHub mà không mở PR mới và không merge gì — đây là cơ chế phát hiện một
 PR bị đóng trên GitHub mà KHÔNG merge (github-adapter).
- **Blocked when:** đề xuất không phải nguồn runner (source ∈ pull/legacy) —
  từ chối `validation` ngay, không gọi GitHub, nêu rõ lý do "không có nhánh
 để gắn PR" — KHÔNG BAO GIỜ tự âm thầm quay về đường duyệt cục bộ (gãy
  chuyển thẳng sang chặn/đỗ, không tự hạ cấp vận chuyển). `approve --github`
  thiếu `--pr <n>` — `validation`, nêu rõ phải lấy số PR từ một lần `review
  --github` trước đó. Phép kiểm nguồn chạy TRƯỚC phép kiểm `--pr` (một đề
  xuất pull/legacy luôn nhận đúng thông điệp "không phải nguồn runner", không
  bao giờ bị thông điệp "thiếu --pr" gây hiểu lầm). `approve --github` KHÔNG
  đi qua phép kiểm cây-làm-việc-chính-phải-sạch của đường duyệt cục bộ —
  phép kiểm đó tồn tại chỉ vì một merge CỤC BỘ làm bẩn cây làm việc; một
  merge qua GitHub không đụng cây làm việc cục bộ chút nào. Phán Iron Law
  KHÔNG nằm trong miễn trừ này (review-20260718-self-improve-loop f01, xem
  RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)): nó chạy TRƯỚC cả nhánh `--github`, nên một root land lên trunk qua
  GitHub vẫn phải qua đúng cổng ấy.
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
 có chủ đích.
- **What changes:**
  - `review <id> --github` — đẩy nhánh của đề xuất lên remote gốc nếu nhánh
    đó chưa từng được đẩy (thăm dò tồn tại trước, chỉ đẩy khi thật sự cần —
    trường hợp bình thường của lần đầu), rồi mở một PR thật trên GitHub, đích
    là nhánh trục của kho (đề xuất gốc/độc lập) hoặc nhánh của gốc (đề xuất
    con, cùng khuôn tầng với đường cục bộ). Thành công → in số PR và hướng
    dẫn bước kế tiếp (đi duyệt trên GitHub rồi gọi `approve --github --pr
    <n>`); KHÔNG BAO GIỜ tự dựng đường dẫn PR (không đủ thông tin để dựng
    đúng, chỉ nêu số PR). Gãy (GitHub không cho mở PR — vd chưa đăng nhập,
    mất mạng) → in lý do, đề xuất giữ NGUYÊN `awaiting-approval`, không sự kiện nào
    được ghi — `review` vẫn thuần-đọc trên trạng thái FSM y hệt đường cục bộ,
    dù bên ngoài (GitHub) đã có tác dụng phụ thật (nhánh đã đẩy).
 - `review <id> --github --pr <n>` (github-adapter, phát hiện đóng-không-
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
 lại tình huống đó nằm ngoài phạm vi, giữ việc thực thi merge/verify ở
    máy cục bộ); (3) đã đóng KHÔNG merge → nêu rõ số PR, hướng dẫn người vận
    hành tự gọi `fgos reject <id> --reason "..."` nếu muốn đưa việc về lại
 hàng chờ — đây CHÍNH LÀ cơ chế phát hiện yêu cầu, nhưng bản thân phép
    hỏi thăm này không bao giờ tự động gọi `reject` thay người.
  - `approve <id> --github --pr <n>` — gọi merge của GitHub trên đúng PR số
 `n`. Sạch → `awaiting-approval → done` mang role `human` (người gọi approve
    là ngã-ngũ, merge chỉ là hệ quả cơ học — CÙNG nguyên tắc dù merge diễn ra
    ở đâu). Gãy (bất kỳ lý do nào — GitHub chưa cho phép merge vì thiếu lượt
    duyệt, xung đột thật, mất xác thực, giới hạn tần suất, mất mạng, hay bất
    kỳ lỗi nào khác của lời gọi) → `awaiting-approval → blocked` mang lý do cụ thể +
    một bản ghi friction, CÙNG khuôn với đường cục bộ (`merge-conflict`/
    `verify-fail-post-merge`) — không phải hai khuôn song song.
- **Side effects:** `review --github` có thể đẩy một nhánh lên remote gốc
  (tác dụng phụ ngoài repo cục bộ) và luôn gọi ra GitHub khi thành công lẫn
  khi gãy; `approve --github` luôn gọi ra GitHub.
- **Afterwards:** mở PR thành công → đề xuất vẫn `awaiting-approval`, chờ người tự
  duyệt trên GitHub rồi quay lại gọi `approve --github`; merge PR thành công
  → item `done` y hệt đường cục bộ, việc phụ thuộc mở khóa như mọi `done`
  khác — nhưng KHÁC đường cục bộ ở một điểm: nhánh riêng của đề xuất (cả bản
  cục bộ lẫn bản đã đẩy lên remote gốc) KHÔNG được dọn tự động sau khi merge
  qua GitHub (giới hạn đã biết, xem Open Gaps); merge gãy → item `blocked`
  mang lý do cụ thể, đậu lại chờ người, cùng luật "không tự rebase, không
  halt cả vòng runner" như mọi lần đỗ khác.

### Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)

Bước vào của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):
fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành
một danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể
bắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,
`--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không
phải một tính năng mở cho host project ngoài — và chạy khi người gọi tay,
không bao giờ là một nhánh tự động của vòng dispatch thường. Vòng khép
kín đầy đủ: `evolve` (liệt kê) → `evolve --pick` (xem một candidate, đọc-thuần)
→ `evolve --submit` (bắc cầu, HÀNH ĐỘNG GHI duy nhất của cả bề mặt evolve) →
runner dispatch việc mới như mọi việc khác → `review`/`approve` qua cổng duyệt
PR nội bộ, với `approve` chạy thêm phán Iron Law (xem dưới) trước khi merge.

- **Runs when:** người vận hành gọi `fgos evolve` (liệt kê), `fgos evolve
  --pick <id>` (xem chi tiết một candidate), hoặc `fgos evolve --submit <id>`
 (bắc cầu candidate sang một việc thật) — không có input tương tác nào
 khác, không vòng lặp chờ trả lời (hai bước, không stdin).
- **Blocked when:** `--pick <id>`/`--submit <id>` không khớp candidate nào
 đang mở — `validation`, thông điệp rõ ràng, KHÔNG BAO GIỜ hỏi lại (
  "input sai là lỗi sạch, không re-prompt"), không việc nào được tạo ra cho
  `--submit` khi không khớp; `--pick`/`--submit` mang cờ trần (không giá trị)
  cũng bị từ chối cùng khuôn `validation` như mọi verb khác dùng
  `requireField`.
- **What changes:**
  - `fgos evolve` (không `--pick`/`--submit`) và `fgos evolve --pick <id>` —
 ĐỌC-THUẦN TUYỆT ĐỐI, cùng request-class với `ready`/`list`/`check`:
    đọc view qua `listWork(dir)` DUY NHẤT, không bao giờ
    `rebuild`/`refreshView`/`initStore` (những cửa GHI view/log).
    - `fgos evolve` — xếp hạng MỖI id còn friction chưa ngã-ngũ
 (`src/evolve/candidates.mjs`'s `rankCandidates`, tái dùng cơ học
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
 cục "dừng" của Gate A — không có input hủy/dừng riêng nào khác
      cần xử lý.
 - `fgos evolve --submit <id>` (self-improve loop STR13 Slice 3) — HÀNH
    ĐỘNG GHI DUY NHẤT của cả bề mặt evolve: xếp hạng lại CÙNG một view, tìm
    `id`; khớp → soạn một mô tả người-đọc-được từ các trường của candidate
    (id/disposition/errorClass/layer/attempts/detail — trường vắng mặt được
    bỏ qua, không bao giờ in literal "undefined") rồi tạo đúng MỘT việc thật
    qua CÙNG cửa `submitWork` mà `fgos submit` tự dùng (không logic tạo-việc
    thứ hai) — `status: todo`, stage vào-vòng theo domain (stage đầu tiên
    domain đó khai; với `coding` là `discovery`), `tier`/`risk` dẫn xuất
    mechanically từ chính mô tả đó qua
    `classify()` giống hệt một `submit` bình thường. `evolve --submit` không
    mang cờ `--async`/`--unattended`/`--domain` riêng của nó (bề mặt cờ tối
    thiểu, YAGNI) — luôn gọi `submitWork` với mặc định. Việc mới tạo ra đi
    đúng vòng đời runner thường (quét nghiên-cứu → quét chia-việc → dispatch →
    `awaiting-approval`) như mọi việc khác — Gate A không có cơ chế dispatch/wiring
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
  `awaiting-approval`, nó đi qua đúng cổng duyệt PR nội bộ ở trên — nếu diff của nó
  chạm cờ/module Iron Law (xem dưới), `approve` từ chối cho tới khi người
  vận hành xác nhận bằng `--acknowledge-iron-law`.
  **Tương tác đã biết (chứng minh bằng e2e thật, STR13 Slice 3):** vì Iron
  Law's phép thử từ khóa TÁI DÙNG đúng `HEAVY_KEYWORDS` mà `classify()` cũng
 dùng, một mô tả candidate chứa từ khóa rủi ro nặng — điều kiện tự
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

Bước phán-rủi-ro của vòng tự cải thiện (CONTEXT.md): trước khi
một fix cho một candidate được phép BỎ QUA kỷ luật "chứng minh bằng test đỏ
trước" (failing-test-first), hệ tự hỏi hai câu — fix này có chạm module có
NĂNG LỰC làm yếu chính kỷ luật gate/verify của hệ không, và mô tả của
fix có mang từ khóa thuộc nhóm cờ rủi ro nặng không ? Trả lời CÓ ở BẤT KỲ
câu nào → Iron Law áp dụng, fix phải tự chứng minh bằng test đỏ trước khi
được coi là xong.

- **Runs when:** gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội
  bộ, trên) và từ `sync-root`, ngay TRƯỚC bước kiểm cây sạch và trước mọi
  thao tác git — mỗi
  lần một đề xuất nguồn runner được duyệt (self-improve loop STR13 Slice 3),
bất kể đề xuất đó tới từ `evolve --submit` hay từ `add`/`submit`
 thường (chung cho MỌI đề xuất nguồn runner, không riêng gì evolve).
 **Ranh giới trunk (per `0032`):** và CHỈ khi lần merge đó land lên
  trunk. `approve` phân biệt bằng `resolveRoot(view, id) === id` (pre-check
  thuần của `merge next` dùng cùng biểu thức); `sync-root` phân biệt bằng
  `!item.parent`, một biểu thức KHÁC và cố ý không gộp chung, vì verb đó chỉ
  land vào cha trực tiếp trong khi `resolveRoot` leo tới đỉnh lineage. Một
  leaf merge vào `fgw/<root>` và một gốc có cha `sync-root` vào `fgw/<parent>`
  đều đi thẳng, không gọi phép thử này lần nào — chỗ duy nhất còn chặn được
  gì là chỗ diff thật sự sắp lên trunk.
  **Ranh giới CHỦ Ý:** chỉ đề xuất nguồn `runner` mới đi qua phép thử này —
  đề xuất nguồn `pull`/`legacy` (code đã do chính người tự tay commit thẳng
  lên main qua cửa `take`/`return`, xem thang bền vững) không đi qua đường
  này; đây là một ranh giới đã xác nhận có chủ đích, không phải một khoảng
 trống bị bỏ sót (xem RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).
- **Blocked when:** không áp dụng — đây là hàm thuần, không có trạng thái để
  chặn. (Điểm chặn thật, bằng KẾT QUẢ hàm thuần này, nằm ở `approve` — xem
  "Cổng duyệt PR nội bộ" trên.)
- **What changes:** không gì ở tầng trạng thái — đây là một phép TÍNH thuần
  trên hai đầu vào (danh sách file candidate fix chạm tới, mô tả tùy chọn của
  fix), trả lại một phán quyết CÓ/KHÔNG kèm bằng chứng (đúng cờ nào, đúng
  module nào khớp) — không phải chỉ một boolean trơ.
 - Phép thử module (mở rộng): file chạm được CHUẨN HÓA path
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
 MINH HỌA, không đóng khung — module năng-lực-liên-quan khác ngoài
 danh sách vẫn có thể cần Iron Law theo phép thử năng lực gốc,
    một giới hạn còn lại đã ghi nhận (xem Open Gaps). `filesChanged` chứa một
    phần tử không phải string, hay `description` không phải string/vắng mặt,
    đều bị từ chối bằng lỗi validation sạch (không crash thô).
 - Phép thử từ khóa (mở rộng): mô tả fix (nếu có cung cấp) được so
    khớp không phân biệt hoa/thường với một bộ từ khóa rủi-ro-nặng dùng
    CHUNG với bước phân loại submission lúc `fgos submit` (cùng một nguồn dữ
    liệu, không hai danh sách lệch nhau theo thời gian) — bộ này phủ cả sáu
    nhóm cờ đã khóa (bảo mật/xác thực, phân quyền, mất dữ liệu, kiểm toán,
    hệ thống ngoài, bỏ kiểm tra). Mô tả VẮNG MẶT không bao giờ được coi là
    "an toàn" — phán quyết vẫn tính đủ từ phép thử module.
- **Side effects:** không có — hàm thuần tuyệt đối, không đọc/ghi gì ngoài
  hai tham số truyền vào.
- **Afterwards:** bên gọi nhận lại phán quyết kèm bằng chứng (đúng cờ/module
  nào khớp); `required: true` thiếu `--acknowledge-iron-law` → hệ quả do
  `ironLaw.level` quyết (RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`)): ở `ask` (mặc định) từ
  chối ngay trong cùng lượt gọi, thông điệp nêu tên đúng cờ/module đã khớp,
  không git nào chạy, đề xuất giữ nguyên `awaiting-approval`; ở `warn` in
  cảnh báo ra stderr kèm đúng cờ/module đã khớp, ghi một bản ghi `decision`
  mang `kind: engine` TRƯỚC lần merge nó cho phép, rồi đi tiếp;
  `required: true` kèm cờ,
  hoặc `required: false` — đi tiếp đúng đường merge/verify bình
  thường ở "Cổng duyệt PR nội bộ" trên, không đổi hành vi. Một đề xuất bị
  giữ ở mức `ask` ở NGUYÊN `awaiting-approval` và không nghẽn ứng viên khác:
  vòng quét merge ghi nó vào danh sách rồi đi tiếp, trình gom một lượt ở
 cuối (per `0032`).

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
    ngang hàng), item còn đọng ở stage đầu vòng của domain của chính nó
    (trọng vừa), một bản ghi friction chưa có settlement nào theo sau trên
    CÙNG id (trọng nhẹ), item đang đậu chờ người (trọng nhẹ).
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

### Phiên checkout đa-phiên — session start / end / list / gc

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
  list` / `fgos session gc`.
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
 symlink `<worktree>/.fgos` trỏ về `.fgos/` thật của cây chính (KHÔNG
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
  - `session gc` (p-fgos-session-gc) — dọn mục sổ MỒ CÔI: worktree đã mất khỏi
    `git worktree list`, HOẶC pid ghi trong mục đã chết. Lưu ý pid ghi lại là
    pid của chính tiến trình CLI `session start` MỘT-LẦN, tự thoát ngay sau khi
    in kết quả — nên gần như MỌI phiên có pid-chết trong vài khắc sau khi tạo,
    bất kể worktree còn đang được dùng hay không; vì vậy `gc` áp CÙNG phép bảo
    vệ phân kỳ như `end` (một commit lửng không bao giờ bị âm thầm bỏ), CỘNG
    THÊM một phép bảo vệ cây-bẩn riêng: một worktree còn thay đổi CHƯA commit
    (kể cả chưa từng commit — nằm ngoài phép kiểm phân kỳ dựa-commit) cũng được
    tha, không bị `--force` xóa. **CỘNG THÊM một phép bảo vệ tự-thân** (str51-2-reclaim-self-mount-fix):
    mục nào có đường worktree TRÙNG với đường gọi `gc` (`repoRoot` truyền vào)
    luôn được tha VÔ ĐIỀU KIỆN, kiểm TRƯỚC cả pid-chết lẫn phân kỳ/cây-bẩn — vì
    chính lệnh gọi `gc` đang chạy TỪ worktree đó đã là bằng chứng nó còn đang
    dùng, bất kể pid ghi sổ chết hay còn sống. Không có phép bảo vệ này, một
    phiên tự gọi `gc` từ bên trong worktree của chính nó (ví dụ qua `.fgos`
    symlink dùng chung sổ đăng ký) sẽ luôn đọc chính mình là mồ côi (pid-chết
    do thiết kế) và tự xóa worktree đang dùng — đã xảy ra thật một lần trước
    khi có phép bảo vệ này. Mục nào bị tha thì liệt vào `skipped`, mục nào
    dọn được thì liệt vào `reclaimed`; trả `{ reclaimed, skipped }`.
- **Side effects:** mọi đọc-sửa-ghi `sessions.json` được canh bởi một khóa
  RIÊNG `.fgos/sessions.lock` (tạo-nguyên-tử `wx` + đòi-lại-pid-chết, soi theo
  `acquireRunnerLock` của loop.mjs như một cơ chế MỚI, TÁCH BẠCH — không bao
  giờ đụng `runner.lock`) an toàn giữa nhiều tiến trình `fgos` độc lập; write-
  queue trong-tiến-trình KHÔNG dùng ở đây (nó chỉ tuần tự hóa ghi async trong
  MỘT tiến trình Node, cho zero bảo vệ liên-tiến-trình). `session start`/`end`
  chạy `git worktree add/remove`; `list` không chạm git.
- **Afterwards:** `session start` in đường worktree để tác nhân `cd` vào và một
  session-id để về sau `end`; chạy `fgos` trực tiếp ở cây chính mà KHÔNG bao
 giờ gọi `session start` vẫn hành xử y hệt hôm nay (tùy chọn, không có
  phiên = không đổi gì); một commit lửng bị `end` giữ lại (chờ `--force`) để
  người quyết định, không mất âm thầm.

### Bảo vệ approve khỏi lồng phiên (session-nesting guard, Epic 2)

`approve` (KHÔNG `--github`) TỪ CHỐI chạy khi `cwd` nằm trong một worktree
phiên đã đăng ký, TRƯỚC mọi lệnh git và trước cả lần chạy `verify`/goal-check
nào — đề xuất giữ nguyên `awaiting-approval`, main không đụng. Một refusal duy nhất
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

Khi một phiên trợ lý (người hoặc agent) mở repo để làm một item qua vòng đời của nó, phiên tự định vị bằng một entry skill đọc `stage` hiện tại của item rồi trỏ tới đúng skill giai đoạn kế tiếp — không có nghi thức khởi động nào khác ngoài đọc verb đọc-thuần (`list`/`ready`) rồi vào việc qua cửa pull `take` (per p50-workflow-induct). Bản đồ giai đoạn: skill `nghiên-cứu` hoạt động ở stage `discovery` — pha máy-một-mình, tự tra cứu rồi tự phán đủ-rõ hay chưa, không hỏi ai; một phán quyết đủ-rõ ở đây bỏ qua hẳn `exploring`, đi thẳng tới `planning`. Skill `làm-rõ` hoạt động ở stage `exploring` — pha máy+người; nó sàng lọc câu hỏi thật qua ba phép thử (chất-liệu/có-căn-cứ/trả-lời-được) trước khi hỏi người; câu hỏi không đạt sàng lọc (vd một lựa chọn chỉ ảnh hưởng người-triển-khai, không ảnh hưởng phạm vi sản phẩm) được ghim thành một giả định thay vì tạo cổng chờ-người. Skill `chia-việc` hoạt động ở nửa đầu stage `planning`; skill `thẩm-định` hoạt động ở nửa cuối, gác cạnh `planning→executing` — một thẩm định thất bại quay lại `chia-việc`, không bao giờ tự nhận đã qua; `thẩm-định` không phải một stage riêng và không chiếm ô nào trong bảng stage→skill, nó là pha thứ hai của chính skill `chia-việc`. Bước chuyển stage thật sự (đánh giá item đã đủ rõ/đủ khả thi hay chưa) luôn là verb máy của engine, không phải chính skill — skill không bao giờ tự áp cạnh chuyển-trạng-thái (cùng stance "trí tuệ không cầm picker" của RUL42 (stance trí-tuệ-giao-việc — picker cơ học vĩnh viễn, trí tuệ vào qua đúng hai cửa) áp dụng tương tự ở lớp hướng dẫn này — chính `fgos-routing/SKILL.md` cũng nêu tường minh nguyên tắc này trong mục "Precedence: the engine's verb always wins" của nó). Một cổng chờ-người thật (engine tự phán không đủ rõ) không bao giờ được chính vòng skill tự trả lời — nó luôn escalate ra ngoài phiên, chờ người quyết (mở rộng nguyên tắc "không tin lời trợ lý"/"không tự quyết thay người" của RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau) sang lớp hướng dẫn này). Toàn bộ vòng này chỉ dùng lại các verb/trạng thái đã có — không có event, stage, hay domain mới nào cho lớp hướng dẫn (per p50-workflow-induct).

Từ str89-fgos-domain-skills, vòng này không còn giả định ngầm domain
`coding`: entry skill (`fgos-routing`) đọc trường `domain` của item (mặc
định `coding` khi vắng mặt) rồi tra sổ đăng ký domain (spec Work-State,
mục "Mô hình domain") để biết skill nào ứng với từng stage — bảng
skill/stage không còn hard-code trong entry skill, mà đọc động từ sổ đăng
ký mỗi domain khai riêng (một domain khác `coding` có thể ánh xạ khác,
hoặc không ánh xạ skill nào cho một stage). Stage `executing` — trước đây
không skill nào ứng (thi công máy móc, không hướng dẫn) — nay CÓ một skill
cho domain `coding`: nó chạy vòng cài-đặt→kiểm-chứng→trả-việc (đọc item đã
claim, cài thật, chạy đúng `verify` đã ghi trên item, rồi `return`) — cùng
kỷ luật RUL46 (lớp hướng dẫn không bao giờ tự áp cạnh chuyển-trạng-thái — chỉ engine mới được)/RUL47 (cổng chờ-người của lớp hướng dẫn không bao giờ tự trả lời) (không tự áp cạnh chuyển-stage, không tự trả lời cổng
chờ-người) áp dụng ở stage này y hệt ba stage trước. Domain `marketing`
(nếu/khi được xây, xem backlog STR52) nằm ngoài phạm vi này — chưa có skill
executing riêng, hoãn có chủ ý.

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

- **RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất).** Trong vòng dispatch, runner là người ghi duy nhất qua một cửa; worker không bao giờ tự ghi trạng thái (per phase-2-routing / feed7428).
- **RUL2 (mọi mutation đi qua đúng một cửa ghi).** Kết quả worker là ĐỀ XUẤT mức bền: commit trên nhánh `fgw/`, phải qua người duyệt mới thành `done`; không bao giờ tự merge (auto-merge là backlog STR9).
- **RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau).** Runner tự chạy proof của việc làm goal-check — lời trợ lý không bao giờ là bằng chứng.
- **RUL4 (giao việc theo mẻ, giới hạn hai tầng, quyền-sở-hữu-gốc giữ nguyên trong lượt chạy).** Một lượt chạy giao TỐI ĐA N việc cùng lúc, giới hạn qua cấu hình hai tầng — số gốc đồng thời × số con đồng thời mỗi gốc (Data Dictionary #6); mọi con của MỘT gốc luôn về tay cùng một chủ trong suốt một lượt chạy (Data Dictionary #7, xem RUL26 (quyền-sở-hữu-gốc — mọi con của một gốc về tay cùng một chủ trong một lượt chạy)); dispatch nạp lại mẻ tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng. Chống-lặp qua vận hành thật (A1) là điều kiện đã chứng minh TRƯỚC khi song song được dựng — không còn là một ngưỡng-tên treo chờ (per fan-out-parallel / 2e92b7a5).
- **RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù).** Model chọn theo tier của việc qua bảng cấu hình; tập tier reconcile một nguồn tại đây.
- **RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp).** Chống đỡ bằng CHỈ DẪN + nhánh-vứt-được, KHÔNG phải sandbox OS/container. Worker headless chạy dưới tập quyền TỐI THIỂU khai tường minh trong `.fgos/config.json`'s `runner.executor.args`: `--permission-mode acceptEdits` (tự nhận sửa file) cộng đúng `--allowedTools "Bash(git add:*),Bash(git commit:*)"` — không rộng hơn; `--dangerously-skip-permissions` bị BÁC có chủ đích (worker chỉ cần sửa-file + commit trong worktree, prompt đã cấm merge/push/tự gọi fgos, và goal-check không tin lời trợ lý — RUL13 (vòng dự đoán-thực tế, học từ cả thành công lẫn thất bại) — nên quyền rộng hơn là rủi ro không cần) (per worker-execution / 22699c61, 04a6cd05). Root cause spike-proven (2 biến thể, claude CLI thật): thiếu allowlist này, headless `claude -p` sửa file được nhưng `git commit` treo vô thời hạn chờ duyệt tương tác → nhánh đề xuất luôn rỗng, dispatch luôn đỗ. Bất biến phải giữ: work item (nhất là trường proof — được chạy như lệnh shell) do chính người dùng tạo; không bao giờ nạp việc từ nguồn ngoài khi chưa có vòng kiểm (security panel, ghi trong hợp đồng handoff).
- **RUL7 (schema item mang đủ chất liệu trả lời sáu câu hỏi harness).** Lớp lỗi lạ → dừng, không bao giờ mặc định thử-lại (fail-safe).
- **RUL8 (deps phải trỏ id tồn tại, cấm tự trỏ).** Bước gặt-lại làm chạy-lại-sau-crash an toàn tự thân: không việc nào vô hình, không commit đôi, không worktree rò (reliability panel — 3 blocker vá trước khi code).
- **RUL9 (thực thi khi dev).** Mọi kiểm chứng chạy trong Claude Code bằng subscription: suite dùng executor giả (0 token), worker thật qua claude CLI login. API key chỉ hợp lệ khi tính năng đang test là executor-cắm-ngoài, và là key của môi trường người dùng (per 774b73ef).
- **RUL10 (diễn tập không chạm log thật).** Nhật ký sự kiện append-only bất biến → một event diễn tập lọt vào là rác vĩnh viễn: canary/drill LUÔN chạy trên repo mồi dùng-xong-vứt; chỉ dogfood việc-thật mới ghi log thật — và đó là lịch sử vận hành chủ đích (per f3a16887).
- **RUL11 (thang kiểm chứng).** T0 suite executor-giả mọi commit · T1 dogfood việc thật hằng ngày · T1c canary khai-môi-trường (worker tự báo pwd/git-root/doctrine nó thấy, verify assert từng dòng) định kỳ và sau mỗi đổi harness · T2 máy-trắng (HOME giả + credential tối thiểu) trước release (per f3a16887). Bất biến nền: mỗi agent khởi đầu tại project-root CỦA NÓ — thợ ở xưởng, worker ở git-root của worktree nó đứng.
- **RUL12 (khoá liên-tiến-trình).** Mỗi kho chỉ một runner sống tại một thời điểm: đầu MỌI lần chạy (trước cả bước gặt-lại — gặt cũng ghi trạng thái), runner chiếm khoá độc quyền trong vùng trạng thái, ghi định danh tiến trình của mình. Kho đang có runner sống → lần chạy mới thoát «bận» bằng mã thoát riêng (không trùng mã nào hiện hành): không ghi trạng thái, không đụng worktree, không đụng khoá của người giữ. Khoá của runner đã chết (crash để lại, hoặc nội dung không chứng minh được chủ sống) → **dọn-rồi-nhường**: kiểm nội dung sát trước khi xoá (đổi rồi thì không đụng), xoá xong lượt đó vẫn lui ra «bận» — không lượt chạy nào vừa xoá khoá vừa tự chiếm trong cùng một lần, nên hai lượt cùng gặp khoá chết không thể cướp khoá mới của nhau; lượt kế tiếp chiếm khoá sạch (sau crash, phục hồi trọn trong hai lượt). Khoá luôn được nhả trên mọi đường thoát.
- **RUL13 (vòng dự đoán-thực tế, học từ cả thành công lẫn thất bại).** Mỗi lần dispatch, runner ghi bản ghi outcome ở CẢ hai đầu: nửa dự đoán lúc nhận việc, nửa thực tế ở MỌI kết cục cuối — thành đề xuất, bị đỗ, hay bị dừng — không bao giờ chỉ ghi khi thành công. Giá trị thực tế luôn lấy từ phép đo goal-check/kiểm nhánh của chính runner, không bao giờ từ báo cáo tự khai của trợ lý (per phase-3-compound-learning / 1a80b4d3; mở rộng nguyên tắc "không tin lời trợ lý" đã khóa ở RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau)). Bản ghi outcome đọc lại được qua lệnh đọc-thuần `fgos check` của tầng Work-State — runner không có verb ghi riêng cho việc này.
- **RUL14 (quét nghiên-cứu chạy trước dispatch, bất kể mode).** Mỗi lượt chạy, ngay sau gặt-lại và trước khi tìm việc thi công, runner GIAO TOÀN BỘ item đang ở stage `discovery` + `status: todo` cho một worker thật, rồi áp đúng phán quyết mà chính worker đó phát ra — không đọc/không rẽ nhánh theo field `mode` của item (per stage-clarify / 9a19eea5, xem RUL17 (quét chia-việc chạy ngay sau quét nghiên-cứu, trước dispatch, bất kể mode)-RUL19 (`return` mirror trung thực contract `awaiting-approval` của runner, không tin lời) (work-state)). Runner KHÔNG BAO GIỜ tự phán thay: worker không để lại commit nào, hoặc output không mang phán quyết đọc được, thì item đứng nguyên tại chỗ chờ lượt sau — không bao giờ bị đẩy tiếp bừa. Never chạm item `awaiting-human`, và cũng không chạm item đã có người/phiên cầm (`doing`) — cùng luật loại-trừ RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp) (work-state)/RUL15 (role trên mọi ngã-ngũ tự động của runner) (work-state) áp cho cả bước quét này. Stage `exploring` nằm NGOÀI mọi quét của vòng tự hành: nó là pha cần người, để dành cho một phiên sống. Đây là lưới đỡ: phiên submit sống chết giữa chừng không để lại việc kẹt vô hình. `discovery` là tên stage riêng của `coding`, không domain nào khác khai — nên phép khớp trực tiếp ở đây không bao giờ bắt nhầm item của một domain khác (xem spec Work-State "Mô hình domain").
- **RUL15 (role trên mọi ngã-ngũ tự động của runner).** Mọi ngã-ngũ mà runner TỰ ghi trong vòng dispatch (quét nghiên-cứu cho qua, quét chia-việc cho qua, nhận việc, đề xuất, đỗ) mang `role` = `runner`; ngã-ngũ do phiên sống gọi tay context-discovery/phán chia-việc mang `role` = `session`; ngã-ngũ do người gọi qua lệnh CLI mang `role` = `human` — ba giá trị phủ hết mọi đường ngã-ngũ hiện có, không đường nào bị bỏ sót (per phase-3-compound-learning S3-closeout / 96a65365; xem spec Work-State "Bản ghi settlement"). Từ vựng `role` nay có thêm giá trị thứ tư, `system` — cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định — dùng trên cạnh park nội bộ (per str46-io-contract, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)); một cạnh park không phải một ngã-ngũ nên không tính vào ba giá trị trên.
- **RUL16 (điểm entropy luôn giải thích được + luôn kèm xu hướng).** Điểm entropy trên `check` không bao giờ là một con số đơn độc — luôn kèm các thành phần đã cộng nên nó, và luôn so với lần `check` gần nhất (lần đầu là baseline). Seal-digest chỉ im lặng một mệnh đề khi kênh đó thật sự không có gì để nói (số đếm hiện tại VÀ chênh lệch đều bằng 0) — một kênh có dữ liệu nhưng không đổi từ lần trước vẫn in ra "không đổi" (per phase-3-compound-learning S3-closeout / 96a65365).
- **RUL17 (quét chia-việc chạy ngay sau quét nghiên-cứu, trước dispatch, bất kể mode).** Mỗi lượt chạy, ngay sau quét nghiên-cứu và trước khi tìm việc thi công, runner đọc lại view tươi rồi quét TOÀN BỘ item ở stage thỏa bước Chia-việc của domain của chính nó (`planning` cho `coding`) — CỘNG THÊM item còn nằm ở tên stage di sản `decompose`, một alias chỉ-để-rút-cạn không item mới nào còn được tạo ở đó — với `status: todo`, rồi chạy phán chia-việc; không đọc/không rẽ nhánh theo field `mode` của item. Bước quét này KHÔNG gọi model: nó chỉ cho đi thẳng một item mà bản kế hoạch đã ghi tự khai là một-mảnh, mọi trường hợp khác nó không làm gì cả và chờ một phiên sống phán tay — sinh con là hành động ghi thật, không bao giờ được đoán. Never chạm item `awaiting-human` — cùng luật loại-trừ RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp) (work-state)/RUL15 (role trên mọi ngã-ngũ tự động của runner) (work-state) áp cho bước quét này. Đọc view tươi sau quét nghiên-cứu nghĩa là một item vừa rời `discovery` trong CÙNG lượt chạy vẫn được quét chia-việc ngay, không đợi lượt sau (per stage-decompose / 43f257ae, xem spec Work-State "Giai đoạn Chia-việc").
- **RUL18 (gặt-lại claim-role-aware — không giẫm người/phiên cầm qua cửa pull).** Bước gặt-lại lúc khởi động CHỈ gặt claim mà chính runner đã tạo và crash giữa chừng; một item `doing` mang `claimRole` `human`/`session` (đến từ `fgos take` — spec Work-State "Cửa pull giao–nhận việc") không bao giờ bị reclaim, dù nó không mang commit/proof nào — người/phiên cầm việc vô thời hạn cho tới khi chính họ `fgos return`. Đây là một THU HẸP thuần túy của tập item vốn đã bị reap — không mở rộng, không giảm an toàn của gặt-lại cho claim của chính runner (per stage-decompose, chốt tại validating sau 1 BLOCKER / 43f257ae, 6f2cbc47, a30a3d3c).
- **RUL19 (`return` mirror trung thực contract `awaiting-approval` của runner, không tin lời).** Cửa pull `return` chỉ chuyển `doing → awaiting-approval` sau khi TỰ đo — không tin báo cáo của người gọi — cả ba: working tree host repo sạch, HEAD tiến so `headAtTake` ghi lúc `take`, và verify thật của item chạy xanh qua CÙNG hàm goal-check runner dùng (`runGoalCheck`, `src/runner/goal-check.mjs`) — mở rộng nguyên tắc "không tin lời trợ lý" đã khóa ở RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau)/RUL13 (vòng dự đoán-thực tế, học từ cả thành công lẫn thất bại) sang tác nhân cửa pull. Verify đỏ đi đúng đường `blocked` + friction lớp `verification`, y hệt đường đỗ chấm-trượt của chính runner; không sinh settlement ở `return` (settlement thuộc cạnh `→done`, per stage-decompose — xem spec Work-State) (per stage-decompose / 43f257ae, 6f2cbc47, a30a3d3c).
- **RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn, per STR63).** Ngay khi `check.passed` (cả hai nhánh nguồn: branch-source qua `branchHeadAtTake→branchHead`, main-source qua `headAtTake→head`), `return` tính `changedFilesSince(cwd, from, to)` (`git diff --name-only`, KHÔNG dùng `changedFiles` của `merge.mjs` — hàm đó cố định trả `[]` cho item không phải nguồn runner, tức luôn rỗng với chính item cửa pull mà `return` phục vụ) rồi chấm qua `frozenJudgeHits(changedFiles, item.footprint)` (`src/runner/frozen-judge.mjs`, domain layer thuần — cổng mẫu `FROZEN_JUDGE_PATTERNS` bê nguyên từ frozen-judge của bee, khớp exact-path với `footprint` đã khai, không hỗ trợ prefix-thư-mục/glob, đúng quy ước `footprintOverlap` sẵn có). Kết quả gắn vào field `frozenJudgeHits` của JSON trả về — KHÔNG BAO GIỜ đổi `passed`/đường đi `blocked`, thuần advisory (per - str63-frozen-judge-fgos, xem forgent workshop `docs/history/str63-frozen-judge-fgos/CONTEXT.md`).
- **RUL20 (cổng duyệt là cửa MỘT DUY NHẤT cho mọi đề xuất, bất kể nguồn).** `review`/`approve`/`reject` hành động trên CẢ hai nguồn đề xuất — runner (nhánh `fgw/<id>`) và pull-door (dải `headAtTake→headAtReturn`) — qua cùng một luật, không hai bộ quy tắc song song; đề xuất di sản (thiếu cả nhánh lẫn cặp head) degrade trung thực (một cảnh báo, không throw) thay vì bị từ chối hoàn toàn (per pr-lifecycle / 1359ab5e).
- **RUL21 (merge sạch → done tự động; gãy → hủy sạch merge dở + blocked có lý do).** `approve` trên nguồn runner không bao giờ để main ở trạng thái merge dở trên bất kỳ đường thoát nào: conflict hoặc verify đỏ sau merge đều `git merge --abort` (main nguyên vẹn byte-for-byte, chứng minh bằng spike + test thật) rồi đậu item ở `blocked` mang lý do cụ thể (`merge-conflict`/`verify-fail-post-merge`) — KHÔNG tự rebase, KHÔNG halt cả vòng runner. `done` qua approve luôn mang role `human` (per pr-lifecycle / 1359ab5e — người chạy approve là ngã-ngũ, merge chỉ là hệ quả cơ học, per vision §8 "người ở cổng").
- **RUL22 (reject không bao giờ đảo lịch sử).** `reject` là một move FSM thuần `awaiting-approval→todo` mang `reason`; không bao giờ gọi một lệnh git nào, kể cả cho một đề xuất pull-door đã có code thật trên main — code đó ở lại như lịch sử, `reject` chỉ từ-chối coi-là-xong, không revert/rewrite (per pr-lifecycle / 1359ab5e).
- **RUL23 (phản hồi người threading vào prompt worker).** Prompt dựng cho worker (`buildPrompt`) mang thêm một mục `# Human feedback` TÙY CHỌN khi item mang câu trả lời làm-rõ mới nhất (fold từ cổng chờ-người, xem spec Work-State "Bản ghi cổng-người") và/hoặc lý do từ-chối/đỗ mới nhất (`item.reason`, xem spec Work-State Data Dictionary #18): câu trả lời in NGUYÊN VĂN dưới nhãn quyết-định-cuối-cùng-ràng-buộc, lý do mới nhất in NGUYÊN VĂN dưới nhãn ưu-tiên-sửa-trước-tiên. Vắng cả hai → mục này KHÔNG xuất hiện, prompt giữ nguyên byte-identical hình cũ (cộng thêm thuần, không phá vỡ hợp đồng 4 section pin sẵn có). Runner đọc lại view TƯƠI ngay trước khi spawn worker (item truyền vào dispatch có thể cũ hơn move gần nhất của chính lượt gặt-lại/quét) rồi truyền `feedback: {answer, reason}` xuống `spawnWorker`. Đây là cách một vòng reject hội tụ: dogfood-thật cho thấy không có mục này, worker vòng sau lặp lại đúng đề xuất vừa bị từ chối vì không thấy lý do (per worker-execution STR33 / 396d9d9e).
- **RUL24 (một-người-ghi vẫn giữ nguyên dưới song song, qua một cửa ghi tuần tự).** Dù nhiều việc thi công đồng thời trong một mẻ, MỌI thay đổi trạng thái (nhận việc, đề xuất, đỗ, nhập) đi qua ĐÚNG một cửa ghi tuần tự — một giao dịch ghi trọn vẹn rồi mới tới giao dịch kế tiếp, không bao giờ hai thay đổi chen lẫn nhau giữa chừng. Đây là hệ quả trực tiếp của RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất) dưới điều kiện mới: song song ở việc THỰC THI (nhiều worker chạy đồng thời), không phải ở việc GHI (per fan-out-parallel).
- **RUL25 (cây chính chỉ nhận nguyên một tính năng đã xong, không mảnh dở — SUPERSEDE quyết định trước đó).** Một việc CON không bao giờ nhập thẳng vào cây chính — nó nhập vào nhánh của GỐC nó; chỉ đề xuất của chính GỐC (sau khi mọi con đã xong) mới nhập vào cây chính, đúng một lần cho cả tính năng. Điều này THAY quyết định trước đây ("mỗi việc một đề xuất, thẳng vào cây chính") trong bối cảnh một việc có con — quyết định cũ vẫn đúng nguyên vẹn cho một việc ĐỘC LẬP (không con), đi thẳng đường cũ không đổi (per fan-out-parallel / 2e92b7a5, supersede-in-context quyết định pr-lifecycle).
- **RUL26 (quyền-sở-hữu-gốc — mọi con của một gốc về tay cùng một chủ trong một lượt chạy).** Lúc con ĐẦU TIÊN của một gốc được nhận trong một lượt chạy, gốc đó gắn chủ; con tiếp theo của CÙNG gốc chỉ được nhận bởi ĐÚNG chủ đó — một chủ khác giành nhận bị từ chối (cùng khuôn kỳ-vọng-lệch của mọi cửa nhận việc khác), việc đó ở lại chờ mẻ sau. Chủ xả khi gốc xong. Bảo vệ nguyên tắc "mọi con của một gốc chung một không gian làm việc" (per fan-out-parallel).
- **RUL27 (nhập gốc→cây chính bắt CẢ xung đột văn bản LẪN trôi ngữ nghĩa im lặng).** Một GỐC từng có con, lúc nhập vào cây chính, được kiểm CẢ hai: nhập có xung đột văn bản không, VÀ sau khi nhập (chưa chốt) verify của chính gốc còn xanh không trên cây đã nhập — verify đỏ ở bước này là TRÔI ngữ nghĩa (nhập sạch nhưng kết hợp gãy), bị coi ngang xung đột văn bản: hủy sạch, cây chính không bao giờ giữ một nhập xanh-mà-gãy (per fan-out-parallel / f0c40acc). Vì đây là phép kiểm DUY NHẤT cho cả cây hậu duệ, verify của gốc phải đủ mạnh lúc soạn — verify mỏng bỏ lọt trôi ngữ nghĩa.
- **RUL28 (đồng bộ-lại sạch = cơ học không đếm; làm-lại tay = có đếm).** Một việc đỗ vì gãy nhập được đồng bộ-lại: nếu sau khi kéo đích mới nhất vào, nhập sạch VÀ verify xanh, việc trở lại sẵn sàng nộp lại theo đường cơ học (không qua "đang làm", không tính vào ngân sách chống-lặp của việc) — phân biệt với người CHỌN cầm việc qua cửa pull để tự làm-lại tay, đường đó QUA "đang làm" như bình thường và ĐƯỢC đếm (per fan-out-parallel).
- **RUL29 (cổng chống-lặp reset theo can thiệp người CUỐI CÙNG của chính việc, per-item, trigger-set đóng, executing-phase-only scoping).** Cổng chặn dispatch (khác `visitCount` lifetime metric ở RUL13 (vòng dự đoán-thực tế, học từ cả thành công lẫn thất bại) — xem Data Dictionary #4/#4b) đếm `visitsSinceLastHumanEvent`: số lần việc vào `doing` **ở stage executing của chính domain** KỂ TỪ sự kiện người cuối cùng của CHÍNH việc đó. Trước claim-lock (str83-fgos-slash-commands), `take`/`pick` chỉ mở frontier (executing-stage items), nên counting lifetime `todo→doing` moves tương đương counting chỉ dispatch attempts thực. Claim-lock cho phép `pick --id` cầm item ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) — một claim-release cycle ở đó (pick → phán chia-việc release `doing→todo` → pick lại ở executing) KHÔNG phải attempt dispatch và không được silent-ăn ngân sách của executing-phase attempts thực (per claim-lock §3a/§3c). Số liệu dẫn xuất chỉ từ `to:'doing'` moves mà item đã ở executing stage (mirror frontier.mjs's eligibility check). Trigger-set đóng — chỉ hai hình reset: việc rời `awaiting-human` bằng một câu trả lời của người (`answer`, role `human`), hoặc một move mang `reason` VỚI role `human` (reject/park do người quyết). Một lần resume trần (`blocked→todo` không `reason`), một lần người `take` việc (`blocked→doing`, role `human`, không `answer`/`reason`), và mọi move của chính runner (kể cả park mang `reason` của chính nó) đều KHÔNG reset — chỉ tính là một visit như mọi lần khác. Không có sự kiện người nào của việc → ngân sách bằng đúng lifetime `visitCount` executing-scoped (một vòng lỗi máy thuần vẫn chết ở trần 3, không đổi). `MAX_VISITS=3` và mọi call site của `visitCount` (outcome/metric đã ship) giữ nguyên — chỉ điểm CHẶN DISPATCH đổi công thức đếm (per human-rounds / 5a6900b2, per claim-lock §6 / code-review finding).
- **RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới).** Một việc `blocked` mang nhánh đề xuất còn sống (`fgw/<id>`) — kể cả bị đỗ do chạm trần chống-lặp — có cửa công khai để người hoàn tất: `take` claim qua cạnh `blocked→doing` sẵn có, ghi `branchHeadAtTake` (HEAD của NHÁNH lúc take — discriminator DUY NHẤT của nguồn-nhánh, không dùng `classifySource` để phân biệt vì nó ưu-tiên-nhánh); người commit thêm lên nhánh; `return` kiểm `branchHeadAtTake` TRƯỚC mọi guard main-based (cây làm việc chính của người không bao giờ bị đọc/đụng), verify chạy trong một worktree TẠM, DETACHED tại đúng SHA của nhánh (không bao giờ checkout theo tên, không `reclaimOrphanedCheckout` — an toàn cả khi người đang đứng trên chính nhánh đó ở một worktree khác) → sạch + xanh → `awaiting-approval` mang `branchHeadAtReturn`; **TUYỆT ĐỐI không ghi `headAtReturn`** cho nguồn-nhánh (trộn hai marker cho `reviewDiff` một dải vô nghĩa). Không commit mới trên nhánh, hoặc verify đỏ trong worktree tạm → từ chối rõ lý do, việc giữ nguyên `doing`. Một đề xuất hoàn tất theo đường này đọc nguồn là `runner` như bình thường (nhánh `fgw/<id>` còn sống — không cần đổi `classifySource`/`merge.mjs`) và đi qua CÙNG cổng duyệt PR nội bộ (per human-rounds / 5a6900b2, xem spec Work-State "Cửa pull giao–nhận việc").

- **RUL62 (`return --no-new-commits-ok` — đóng sổ việc đã xong THẬT từ trước lúc claim, không phải "tin lời").** Khi `branchAheadCount`/`aheadCount` <= 0 (chưa có commit mới kể từ `branchHeadAtTake`/`headAtTake`) NHƯNG cờ `--no-new-commits-ok` được truyền, `return` bỏ qua đúng MỘT bước — throw "chưa tiến" — rồi tiếp tục y hệt đường thường: verify thật vẫn chạy qua CÙNG `runGoalCheck`, xanh mới `awaiting-approval` (ghi `actual.aheadCount: 0`), đỏ vẫn `blocked` + friction lớp `verification` như thường (cờ không bao giờ tắt verify). Trước khi bỏ qua, một cổng riêng (`assertNoPriorBlockedOutcome`) từ chối cờ nếu `outcomes[id].actual.outcome` từng là `'blocked'` bất kỳ lúc nào trong lịch sử item (toàn item, không chỉ lượt claim hiện tại — `view.outcomes[id].actual` sống sót qua một lượt tái-claim vì tái-claim chỉ ghi `predicted`, không đụng `actual`) — chặn đúng lỗ hổng cờ có thể mở: tái claim một việc đã `blocked` thật, gọi cờ với không commit mới, hy vọng verify xanh vì lý do khác. Cờ chỉ đóng sổ việc CHƯA từng return, không bao giờ cứu một lượt thử lại đã thất bại thật. Mặc định (không cờ) của `return` giữ nguyên byte-for-byte cho mọi caller hiện có (per - return-close-pre-done-work / tsk-4on, xem `docs/history/return-close-pre-done-work/CONTEXT.md`+`plan.md`).

- **RUL32 (vòng tự cải thiện chỉ nhắm vào chính repo sản phẩm, không phải tính năng mở cho host ngoài).** Toàn bộ vòng self-improve (Gate A, Iron Law, và Gate B wiring — cả ba đã xây, STR13 hoàn tất) tác động lên chính `repo/src` của fgOS — công cụ fgOS tự soi lại chính nó, không phải một khả năng fgOS cấp cho project khác mà nó đang điều phối (per self-improve-loop / c8df2479).
- **RUL33 (vòng tự cải thiện luôn on-demand, không bao giờ một nhánh tự động của vòng dispatch thường).** Không bước nào của `fgos-runner --once`/`--dry-run` tự khởi động Gate A hay bất kỳ bước nào sau nó — toàn vòng self-improve chỉ chạy khi người vận hành gọi tay qua verb riêng (`evolve`, và các verb Iron Law/Gate B của slice sau). Lý do: STR9 (auto-merge đề xuất worker) vẫn `awaiting-approval`, chưa đủ tin cậy để mở thêm bề mặt tự động quanh việc tự sửa hệ thống (per self-improve-loop / cb09d6fd).
- **RUL34 (Iron Law áp dụng khi CHẠM cờ rủi ro HOẶC module năng-lực — không cần cả hai).** Phán quyết Iron Law là phép HOẶC của hai phép thử độc lập trên một candidate fix: phép thử module (danh sách minh họa, mở rộng) và phép thử từ khóa (bộ từ khóa rủi ro nặng dùng chung với `fgos submit`, mở rộng). Mô tả fix vắng mặt KHÔNG BAO GIỜ được coi là bằng chứng an toàn — phán quyết vẫn tính đủ từ phép thử module một mình. Danh sách module là minh họa, không đóng khung (per self-improve-loop; xem phép thử năng lực gốc: một module đủ tư cách nếu sửa nó có thể làm YẾU hoặc BỎ QUA chính kỷ luật gate/verify của hệ) (per self-improve-loop). **Phạm vi TÍNH và hệ quả (per `0032`):** phép HOẶC này chỉ được TÍNH khi merge target là trunk — một đề xuất land vào `fgw/<root>` hay vào nhánh cha không bao giờ chạy tới phép thử này, nên "không khớp" và "không được hỏi" là hai kết cục khác nhau, đừng đọc lẫn (xem RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó) cho ranh giới, RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) cho cấu hình). Bản thân `classifyIronLaw` không đổi: cùng chữ ký, cùng hai phép thử, cùng bằng chứng `matchedFlags`/`matchedModules` — cái `0032` đổi là chỗ nó được gọi và chuyện gì xảy ra khi `required: true` (mức `ask` từ chối cứng; mức `warn` cảnh báo, ghi bản ghi, rồi merge tiếp).
- **RUL35 (bộ từ khóa rủi ro nặng là MỘT nguồn duy nhất, dùng chung giữa intake và Iron Law).** Bộ từ khóa quyết định tier `heavy` lúc `fgos submit` (xem spec Work-State "Nộp vấn đề tự do (submit)", RUL16 (điểm entropy luôn giải thích được, luôn kèm xu hướng)) và bộ từ khóa quyết định phép thử-từ-khóa của Iron Law là ĐÚNG MỘT bộ dữ liệu — không hai danh sách lệch nhau theo thời gian. Mở rộng bộ này (thêm nhóm hệ-thống-ngoài/bỏ-kiểm-tra/kiểm-toán) đồng thời làm `fgos submit` phân loại nặng hơn cho các mô tả trùng từ khóa mới — một hệ quả CHỦ Ý, không phải hồi quy (per self-improve-loop).
- **RUL36 (`evolve --submit` là hành động ghi DUY NHẤT trên bề mặt evolve, tái dùng CHÍNH cửa `submit`).** `fgos evolve --submit <id>` không tự viết logic tạo-việc riêng — nó soạn một mô tả người-đọc-được từ các trường của candidate (id/disposition/errorClass/layer/attempts/detail, bỏ qua trường vắng mặt thay vì in literal "undefined") rồi gọi CÙNG hàm `submitWork` mà verb `submit` tự dùng (tách ra khỏi thân `submit` đúng cho mục đích này, hành vi `submit` giữ byte-identical trước/sau tách). `evolve` (không cờ) và `evolve --pick <id>` giữ nguyên đọc-thuần tuyệt đối như Slice 1, không đổi bởi cell này (per self-improve-loop).
- **RUL38 (vận chuyển GitHub là MỘT cổng duyệt, không phải một luật thứ hai — github-adapter D1/D3/D5).** `review --github`/`approve --github` không tạo cạnh FSM mới, không đổi role cho `done` (vẫn `human`), và không đổi khuôn `blocked`+friction — CHỈ đổi chỗ xem-diff và chỗ merge sang GitHub. Chỉ áp dụng cho nguồn runner; một GitHub-side gãy KHÔNG BAO GIỜ tự hạ cấp về đường cục bộ (cùng nguyên tắc RUL21 (merge sạch → done tự động; gãy → hủy sạch merge dở + blocked có lý do) áp cho vận chuyển này). Ba giới hạn đã biết, ghi ở Open Gaps: không dọn nhánh sau merge qua GitHub (khác RUL21 (merge sạch → done tự động; gãy → hủy sạch merge dở + blocked có lý do)'s dọn nhánh cục bộ), gãy merge không phân biệt "chưa đủ lượt duyệt" khỏi lỗi thật khác (đều `blocked` như nhau), và đề xuất CON chưa có đường đẩy nhánh của GỐC nên `review --github` không dùng được cho con trên GitHub thật.
- **RUL37 (Iron Law hỏi ở ĐÚNG MỘT ranh giới — trunk — cho MỌI đề xuất nguồn runner tới đó, không riêng gì evolve, không riêng gì vận chuyển cục bộ).** Ngay sau các guard nhận-dạng-worktree hiện có (registry + cấu trúc) và TRƯỚC CẢ nhánh `--github`, `approve` chạy `classifyIronLaw({filesChanged, description})` trên chính đề xuất đang duyệt (`filesChanged` từ `changedFiles`, `description` từ `item.description`) — áp dụng bất kể đề xuất tới từ `evolve --submit`, `add`, hay `submit` thường, VÀ bất kể merge qua cục bộ hay qua GitHub (review-20260718-self-improve-loop f01: trước đây chặn này chỉ nằm trong nhánh merge cục bộ, nên `approve --github` từng bỏ-qua-hoàn-toàn gate này — một lỗ hổng thật, không phải "chưa xây"), vì bài toán hỏi diff này có NĂNG LỰC làm yếu kỷ luật gate/verify của hệ hay không, không phải nó tới từ đâu hay merge bằng đường nào. **RANH GIỚI (per `0032`, `docs/history/iron-law-gate-human-ux/CONTEXT.md`): chỉ chạy khi merge target là trunk.** `approve` chỉ classify khi `resolveRoot(view, id) === id` — một leaf land vào `fgw/<root>` đi thẳng, không hỏi, vì không gì tới được trunk ở bước đó; pre-check thuần của `merge next` soi gương đúng biểu thức ấy. `sync-root` dùng discriminator KHÁC — `!item.parent` — và cố ý không gộp chung: verb đó chỉ land vào cha TRỰC TIẾP (`targetBranch = item.parent ? branchNameFor(item.parent) : detectTrunk(repoRoot)`), còn `resolveRoot` leo tới đỉnh lineage, nên dùng chung một helper sẽ trip cổng trên một merge không bao giờ đi gần trunk (một gốc có cha mà cha lại có ông). Hai biểu thức riêng là CHỦ Ý, không phải copy-paste sót. `required: true` mà thiếu `--acknowledge-iron-law` (cờ boolean, cùng khuôn phân tích cờ với `--async`/`--unattended` của `submit` — không phải cờ mang giá trị như `--timeout`) → hệ quả do `ironLaw.level` quyết (RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`)): ở `ask` (mặc định) từ chối cứng (`StoreError('validation', …)`), nêu tên đúng matchedFlags/matchedModules, đề xuất giữ nguyên `awaiting-approval`, không git nào chạy; ở `warn` (opt-in) in cảnh báo ra stderr nêu đúng matchedFlags/matchedModules, ghi MỘT bản ghi `decision` mang `kind: engine` qua `addDecision` (không shell ra `fgos decision`, verb đó không có `--kind`), rồi merge tiếp. Bản ghi mức `warn` ghi TRƯỚC lần merge nó cho phép, không phải sau: nhật ký nói "cổng đã bị bỏ qua", không nói "merge đã xong", nên một merge gãy sau đó vẫn để bản ghi đứng đúng — fgOS không bao giờ tự nhận đã "chứng minh được" một test đỏ chạy trước khi fix (không có hạ tầng theo-dõi lịch-sử đỏ/xanh nào tồn tại); `--acknowledge-iron-law` là cử chỉ CHỦ Ý của người duyệt xác nhận điều đó thay hệ thống, không phải một xác minh cơ học. **Ai quyết, ai gõ (per `0032`):** cử chỉ đó vẫn là của người, nhưng người không phải gõ lệnh — một agent trình bán kính (verb nào, target nào, bao nhiêu item đi kèm) cộng `docs/history/<id>/iron-law-evidence.md` NGUYÊN VĂN, hỏi một lần, và chỉ khi người trả lời duyệt trong chat mới tự chạy lệnh kèm cờ, tự đọc exit code, tự sửa lỗi cơ học rồi retry. Bên thứ hai độc lập thật sự nhìn vào bằng chứng vẫn là điều kiện (`docs/explanation/iron-law-evidence-contract-stays-human-gated.md`); không agent nào được tự thêm cờ trên thẩm quyền của chính nó. **Một item bị giữ không nghẽn item khác (per `0032`):** engine trả sẵn `skipped` / `every ready item is blocked`, nên vòng quét merge ghi id vào danh sách rồi đi tiếp sang ứng viên sau và trình gom một lượt ở cuối; item bị giữ ở NGUYÊN `awaiting-approval` — không `fgos ask`, không `awaiting-human`, không cạnh FSM mới. **Ranh giới CHỦ Ý:** chỉ nguồn `runner` đi qua chặn này — nguồn `pull`/`legacy` (code đã do người tự tay commit thẳng lên main) không đi qua, vì code đó đã là lịch sử theo thang bền vững, không phải một diff đang chờ merge lần đầu (per self-improve-loop — mệnh đề "chặn cứng, ở mọi ranh giới merge, không có mức nào khác" của đã bị supersede bởi `0032`; phần "một điểm chung cho mọi đề xuất nguồn runner tới trunk" giữ nguyên hiệu lực).
- **RUL64 (`ironLaw.level` — key config RIÊNG của cổng Iron Law, fail-closed về `ask`).** Mức đẩy lại của cổng nằm ở `ironLaw.level` trong file cấu hình dùng chung (`.fgos/config.json`), đúng hai giá trị: `ask` (mặc định) và `warn` (opt-in). Key này **không** bao giờ được gộp vào `gateBypass` — floor của `gateBypass` được ghi rõ là không bao giờ chạm Iron Law (`docs/explanation/gate-bypass-design.md`), nên tái dùng từ vựng level của nó sẽ xoá đúng ranh giới ấy. Mọi thứ không phải đúng chữ `warn` đều đọc thành `ask`: key vắng mặt, file cấu hình hỏng, giá trị gõ sai, giá trị không phải string — cùng kỷ luật fail-closed mà `--acknowledge-iron-law` đã dùng cho phép thử boolean-trần của nó (review-20260718-self-improve-loop f02), và ở đây còn quan trọng hơn vì mức dễ dãi mới là mức để một diff tự-sửa land mà không ai xem. Đăng ký đủ ba chân theo khuôn `gateBypass` (`src/setup/registrations.mjs`): một config default để `fgos setup` merge vào, một check để `fgos doctor` báo khi key thiếu/không nhận ra, và một fix để `fgos doctor --fix` ghi mặc định `ask` — một dự án chưa từng chạy `fgos setup` vẫn nhận hành vi từ chối, không phải hành vi dễ dãi (per `0032`, `docs/history/iron-law-gate-human-ux/CONTEXT.md`).
- **RUL31 (kỷ-luật-output NỚI RỘNG: console + bản ghi cục bộ riêng-từng-việc, KHÔNG BAO GIỜ vào cây committed — SUPERSEDE một phần quyết định trước).** Trước đây output của trợ lý chỉ in console, không ghi ra file nào. Nay MỌI kết cục của một lượt dispatch — thành đề xuất, chấm-trượt, quá-giờ, hỏng-spawn (kể cả tràn bộ đệm) — đều CÒN được ghi thêm vào một bản ghi cục bộ, một file riêng mỗi việc, gộp theo thời gian qua các lần thử. Nửa bảo đảm gốc vẫn giữ nguyên tuyệt đối: bản ghi này không bao giờ vào cây committed (không git-track được) — chỉ nửa "không ghi ra file nào cả" bị nới. Một lượt dispatch hỏng trước khi trợ lý sinh ra output (lỗi worktree, không phải lỗi trợ lý) vẫn ghi được một khối (chỉ mang loại lỗi + thông điệp), không throw vì thiếu trường (per worker-dispatch-log / 8575f1a3). **Bổ chú (20260717, review-20260717-daily-batch, review finding F-STR1-1):** bản ghi cục bộ này KHÔNG BAO GIỜ throw ra ngoài, dù chính thao tác ghi thất bại (đĩa đầy, không có quyền ghi, thư mục chỉ-đọc) — bản ghi này là quan sát thuần, không bao giờ được phép làm hỏng hay che khuất kết cục dispatch thật; một lần ghi hỏng chỉ âm thầm bỏ qua (trả về rỗng), không bao giờ lan ra ngoài `dispatchClaimedItem`.

- **RUL39 (ĐÃ XÂY — backlog STR39, cell live-worker-log-1).** Bản ghi output cục bộ của một việc nhận output theo THỜI GIAN THỰC: từng mảnh output của trợ lý được nối vào bản ghi ngay khi đến (`appendWorkerLogChunk`, worker-log.mjs — cùng cửa ghi DUY NHẤT với khối kết-cục cuối, không mở cửa thứ hai), thay vì chỉ một khối sau khi lượt dispatch kết thúc — người vận hành theo dõi được một worker đang chạy bằng `tail -f .fgos/logs/<id>.log`, mỗi việc một bản ghi nên nhiều worker song song không giẫm dòng nhau. `spawnWorker` (dispatch.mjs) gọi chunk này qua `opts.onChunk(stream, chunk)` ngay trên mỗi sự kiện `data` của stdout/stderr, bọc try/catch để một callback ghi hỏng không bao giờ làm gãy dispatch thật. Khối kết-cục cuối (kể cả quá-giờ/hỏng-spawn) vẫn ghi đủ như RUL31 (kỷ-luật-output nới rộng: console + bản ghi cục bộ riêng-từng-việc, không bao giờ vào cây committed), không đổi vị trí gọi hay bảo đảm, và bảo đảm không-vào-cây-committed giữ nguyên tuyệt đối (per D 644916a4). Xem thêm "Xem live output worker khi đang chạy" ở trên.
- **RUL40 (đã xây — STR40, `scripts/herdr-cockpit.sh` + `scripts/herdr-cockpit-notify.mjs`).** Vận hành qua herdr là chế độ được hỗ trợ chính thức (D d3dbe7f5, supersedes D ef6ed305 — chốt 2026-07-18, user xác nhận đổi tmux→herdr): một phiên chuẩn bốn pane — (1) vòng runner lặp (`fgos-runner --once` trong shell loop, đứng trên `runner.lock` + idempotent, không flag mới), (2) theo dõi output live từng việc (`tail -F .fgos/logs/*.log`, đứng trên RUL39 (đã xây — backlog STR39, cell live-worker-log-1)), (3) cửa thao tác của người (nộp/trả lời/duyệt, shell tương tác thuần), (4) bảng trạng thái + chuông chờ-người gộp một pane (`herdr-cockpit-notify.mjs`: poll `fgos list --json`, in dòng trạng thái + gọi `herdr notification show` đúng MỘT LẦN khi một việc MỚI vào `awaiting-human` — không lặp lại khi việc vẫn đứng yên ở trạng thái đó, gọi lại nếu việc rời rồi quay lại) — kèm một trang runbook trong docs sản phẩm (`docs/operator-runbook-herdr-cockpit.md`). **LUẬT CỨNG (điều kiện supersede D d3dbe7f5, không phải tuỳ chọn):** herdr CHỈ dùng làm chrome (`pane split`/`pane run`/`pane read`/`tab create`/`notification show`) — KHÔNG BAO GIỜ gọi `herdr agent start` hay đọc `agent_status` (idle/working/blocked/done) của herdr làm tín hiệu quyết định; mọi trạng thái thật luôn qua fgOS CLI (`fgos list`/`rollup`/`triage`), một nguồn sự thật duy nhất — vi phạm luật này từng gây bug thật ("idle giết agent", đo được ở dogfood airemote của chính xưởng). Đa phiên chung checkout (STR35, đã đóng): herdr tự thương lượng qua `herdr terminal attach --takeover` — hành vi có sẵn của herdr, không phải code mới của cockpit.
- **RUL42 (STANCE trí-tuệ-giao-việc — picker cơ học VĨNH VIỄN, trí tuệ vào qua đúng hai cửa; ĐÃ XÂY — str7-str8-priority-intent).** Vòng chọn-giao của runner không bao giờ gọi một model thông minh: mọi quyết định của nó (việc nào, model nào, tiếp hay dừng) phải tra-bảng hoặc dẫn xuất được từ dữ liệu đã nằm trên item. Trí tuệ vào hệ qua đúng hai cửa — (1) dòng chính: một bộ não thông minh (phiên trợ lý, stage làm-rõ/chia-việc) đọc frontier, chấm điểm, và GHI KẾT LUẬN XUỐNG FIELD của item qua cửa ghi chuẩn (khóa ưu tiên `priority` — người/tác nhân tự khai qua `edit --priority`, xem spec Work-State Data Dictionary #25/RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, picker vẫn cơ học vĩnh viễn); khóa `intent` — giai đoạn Làm-rõ tự tính, Data Dictionary #26/RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, picker vẫn cơ học vĩnh viễn); cờ tuần-tự-hóa); picker chỉ đổi khóa sort (frontier v2 — priority ASC, intent DESC, FIFO tie-break, spec Work-State "Đọc (list / ready)"), không đổi bản chất; (2) ngoại lệ có cửa riêng: cửa pull take/return cho một phiên thông minh nhấc đúng một việc ra khỏi dòng máy — kết quả trả về vẫn bị đo lại cơ học như mọi đề xuất. Một trợ lý điều phối không bao giờ trở thành picker; nó là người viết điểm số mà picker đọc (per D f69951df, đã xây per str7-str8-priority-intent).
- **RUL41 (đã xây một phần — STR41, `src/runner/dispatch.mjs`; per-tier `executors.<tier>` rút bởi tsk-in1-2 D6).** Ranh giới executor là một cổng có tên — **CTR009 v2**: registry `EXECUTOR_ADAPTERS` map tên adapter → hàm spawn. Adapter LIVE duy nhất hôm nay là `cli-spawn` (mặc định khi `adapter` vắng mặt trên một khối executor) — chính là hành xử cũ, tách nguyên vẹn ra một hàm riêng (`spawn(command,args,{shell:false})`, timeout trên `'exit'`, maxBuffer tự đếm, `onChunk` tee trước khi đếm). Adapter `rpc`/`app-server` **vẫn deferred, chưa có code** — khai một tên adapter khác `cli-spawn` bị `RunnerConfigError` từ chối ở cả `loadRunnerConfig` lẫn `resolveExecutorCommand` (per D a4fe4c2b). Per-tier override từng có 1 rung trung gian riêng (`executors.<tier>`, giữa `executors.<executorId>` và `executor` toàn cục trong thứ tự ưu tiên) — rút bỏ tại tsk-in1-2 0 entry live trong cấu hình thật, và từng gây bug thật (`tsk-4eu`/`tsk-5tm` — một key không phải tier như `"judge"` rơi thẳng vào `executor` chung, không lỗi). `cfg.executors` giờ là field không được validate/không được đọc — một executor không tự khai `command`/`adapter`/`agentType` rơi thẳng về `executor` toàn cục, không còn điểm dừng trung gian.
- **RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`).** Nội dung chữ nghĩa của prompt worker (`buildPrompt`) không còn hard-code trong `dispatch.mjs`: tách sang file template committed `src/runner/prompt-templates/*.txt`. Chọn template qua `selectTemplate({kind, tier, domain})` — bảng tra cơ học (mảng luật thứ tự, luật cuối là wildcard luôn khớp, per RUL42 (stance trí-tuệ-giao-việc — picker cơ học vĩnh viễn, trí tuệ vào qua đúng hai cửa): không gọi model trong vòng chọn) — hôm nay đúng MỘT luật (`worker-prompt-default.txt`), chưa có template phân biệt (YAGNI, cùng kỷ luật "mua cái tên interface, chưa mua bậc" của RUL41 (đã xây một phần — STR41, `src/runner/dispatch.mjs`)). Substitution CHỈ `{placeholder}` string-replace từng phần tử (`renderTemplate`), KHÔNG bao giờ một template engine có logic — mọi thành phần điều-kiện (vd mục `# Human feedback` chỉ xuất hiện khi có feedback, RUL23 (phản hồi người threading vào prompt worker)) vẫn là JS tính TRƯỚC khi substitute, không chuyển vào trong file template. `buildPrompt(work, feedback)` giữ nguyên chữ ký + kiểu trả (string) — mọi test cũ xanh không sửa (bằng chứng byte-identical). `hashTemplate` băm sha256 nội dung RAW file template (không phải output đã render); `spawnWorker` đính `templateName`/`templateHash` lên kết quả trả về VÀ lên `DispatchError` khi adapter reject; `loop.mjs` truyền hai trường này vào `appendWorkerLog`; `worker-log.mjs` in `template <name>@<hash8-chars>` trong header khi có mặt — một lượt chạy tồi truy ngược đúng phiên bản template đã sinh ra nó (per backlog STR49).
- **RUL43 (phát hiện đóng-không-merge trên GitHub là một phép ĐỌC riêng, phân loại chỉ trên hai trường tự-nghĩa — github-adapter D6).** `review --github --pr <n>` (không mở PR mới) là cơ chế yêu cầu cho việc phát hiện một PR bị đóng trên GitHub mà không merge. Phân loại KHÔNG BAO GIỜ dựa vào chuỗi trạng thái tổng quát của GitHub (chưa từng được chứng minh thật cho một PR đã đóng/đã merge, per S1) — chỉ dựa hai trường tự-nó-đã-rõ-nghĩa: đã-đóng-chưa (đúng/sai) và đã-merge-lúc-nào (có/không dấu thời gian). Ba nhánh: còn mở (không việc gì), đã merge (chỉ thông tin, không tự đổi trạng thái cục bộ — kể cả khi merge diễn ra thẳng trên GitHub bỏ qua `approve --github`, đối chiếu lại nằm ngoài phạm vi), đã đóng không merge (nêu số PR, hướng dẫn gọi `fgos reject` — không tự động gọi thay). Dưới MỌI nhánh, kể cả nhánh lỗi gọi GitHub: không sự kiện nào được ghi, không friction nào — một PR bị đóng trên GitHub không tự nó là một hành động duyệt hay từ chối, y hệt nguyên tắc `reject` không tự động (RUL22 (reject không bao giờ đảo lịch sử)) áp cho hướng ngược lại.
- **RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, không niềm tin đặc biệt, có trần + chống trùng).** Kênh báo-cáo mô tả ở "Báo việc-phát-hiện từ trợ lý" (trên) giữ nguyên tắc một-người-ghi (chỉ runner ghi work-state, trợ lý không bao giờ được phép) trong khi vẫn cho trợ lý một đường DỮ LIỆU để lộ ra việc mới: (1) việc tách báo-cáo khỏi output chạy đúng MỘT LẦN cho mỗi lượt dispatch, tại thời điểm kết thúc (thành đề xuất/chấm-trượt/quá-giờ/hỏng) — không lặp lại giữa các lần thử nội bộ của cùng lượt, nên một báo-cáo lộ ra sớm rồi lặp lại ở lần thử sau trong CÙNG lượt không bao giờ tạo hai bản; (2) một báo-cáo hỏng-hình không bao giờ đổi kết cục của chính lượt dispatch — bị bỏ qua âm thầm, không throw; (3) item tạo ra từ báo-cáo vào hệ với KHÔNG niềm tin đặc biệt nào — cùng giai đoạn đầu vào, cùng vòng xét-lại như một item người tự khai; (4) một lượt dispatch chỉ hành động trên tối đa một số báo-cáo GIỚI HẠN, phần dư bị bỏ qua có ghi lại (S10, review-fix P2 — chặn một trợ lý bất thường sinh vô hạn item); (5) một báo-cáo đã được ghi nhận trước đó (khớp dòng dõi phát-hiện + tên việc, không phân biệt hoa/thường/khoảng trắng) không tạo item thứ hai — dù lặp trong CÙNG output hay tái xuất hiện ở một lượt dispatch SAU của cùng item nguồn (S10, review-fix P2 — chặn trùng lặp khi báo-cáo bị gửi lại) — hai tên việc THẬT SỰ khác nhau vẫn cả hai được tạo (per work-graph-intelligence S2b / 8cf7effe, S10 / 7bbe6315). **Bảo đảm giao-nhận (S11, review-fix P3).** Kênh là cố-gắng-tối-đa, TỐI-ĐA-MỘT-LẦN — không phải ít-nhất-một-lần: một báo-cáo mất giữa lúc phân tích và lúc ghi xong (vd runner chết đột ngột) không được phục hồi, không có đối-soát-lại nào đọc lại output đã lưu để dựng lại báo-cáo đã mất — chấp nhận CÓ CHỦ Ý cho một kênh tư vấn phi-chặn, không phải một hàng đợi đáng tin cậy. **Ranh giới tin cậy (S11, review-fix P3).** Tên/mô tả trong một báo-cáo là văn bản KHÔNG ĐÁNG TIN do trợ lý tự soạn; item tạo ra nạp thẳng văn bản đó vào prompt của worker nghiên-cứu ở stage `discovery` — mặt tiếp xúc thứ hai (sau chính trợ lý) nơi văn bản không đáng tin chạm một model sẽ sinh lệnh chạy được. Giảm nhẹ hiện có: `verify` KHÔNG BAO GIỜ do trợ lý đặt trực tiếp (luôn qua placeholder rồi được gán lại ở vòng nghiên-cứu/làm-rõ, và một đề xuất verify còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi) nên văn bản đó không thể tự nó thành một lệnh shell; item không mang niềm tin đặc biệt, đi qua đúng vòng xét-lại như mọi item khác. Một cửa xét-duyệt-người bắt buộc trước dispatch tự động của item runner-tự-tạo được cân nhắc nhưng CHƯA XÂY (đổi thiết kế lớn hơn phạm vi vá P3) — xem decision ADR0013 (kênh báo-cáo-không-ghi cho discovered-from — worker phát khối rào fgos-discovered, runner đọc và tự ghi). **Kỷ luật ghi log (S11, review-fix P3).** Tên việc trong một báo-cáo — văn bản KHÔNG ĐÁNG TIN — được CHUẨN HOÁ (gộp khoảng trắng/xuống dòng, cắt độ dài) trước khi đưa vào bất kỳ dòng log nào của kênh này; một tên việc mang ký tự xuống dòng không thể giả-mạo thêm dòng log. Việc chuẩn hoá này CHỈ áp dụng cho bản ghi log — tên việc ĐẦY ĐỦ, nguyên văn vẫn được lưu trên item tạo ra, không bị cắt hay đổi.

- **RUL46 (lớp hướng dẫn không bao giờ tự áp cạnh chuyển-trạng-thái — chỉ engine mới được).** Skill hướng dẫn giai đoạn (làm-rõ/chia-việc/thẩm-định) chỉ SÀNG LỌC câu hỏi, GHI giả định, và PHÁN xong-hay-chưa trong phạm vi phán đoán của chính nó — cạnh chuyển stage thật sự luôn đi qua verb máy của engine, không bao giờ do chính skill tự gọi hay tự suy ra kết quả (per p50-workflow-induct, cùng stance RUL42 (stance trí-tuệ-giao-việc — picker cơ học vĩnh viễn, trí tuệ vào qua đúng hai cửa)).
- **RUL47 (cổng chờ-người của lớp hướng dẫn không bao giờ tự trả lời).** Khi engine tự phán một item chưa đủ rõ/chưa đủ khả thi (cổng chờ-người), lớp hướng dẫn luôn escalate ra ngoài phiên và chờ người quyết — không bao giờ tự đưa ra câu trả lời thay người, kể cả khi câu hỏi có vẻ hiển nhiên (per p50-workflow-induct, mở rộng RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau)/RUL13 (vòng dự đoán-thực tế, học từ cả thành công lẫn thất bại) sang lớp hướng dẫn).
- **RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước).** `fgos discover` và `fgos-runner` đều giải đường cấu hình mặc định (không kèm `--config`) và, nếu đường đó chưa tồn tại, tự viết một bản mặc định (cùng hình dạng với cấu hình dogfood của chính repo — model light/standard/heavy, `timeoutMs`, khối `parallel`) trước khi nạp — không còn báo lỗi "không đọc được cấu hình" ngay từ bước đầu tiên của vòng làm-rõ. Việc tự sinh này LUÔN kèm một dòng thông báo (tên file + executor được chọn) để người vận hành biết ngay cấu hình vừa được tạo, không âm thầm. Một `--config <path>` TƯỜNG MINH trỏ vào đường vắng mặt KHÔNG BAO GIỜ được tự sinh thay — vẫn báo lỗi ngay như trước, vì một đường dẫn người tự chỉ định là chủ đích, không phải "chưa từng cấu hình" (per D 38f7e0b8).
- **RUL48b (bản mặc định tự sinh dò trợ lý sẵn có trên máy thay vì luôn giả định `claude` — STR82).** Trước khi viết bản mặc định của RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước), việc tự sinh dò xem máy có sẵn trợ lý nào trong một danh sách trợ lý nhận diện được (`claude`, `codex`, mở rộng được) — dò sự HIỆN DIỆN thôi, không gọi/chạy thử trợ lý đó. Tìm thấy `claude` → executor viết ra y hệt bản mặc định trước STR82 (không đổi hành vi trên máy đã có Claude Code). Không thấy `claude` nhưng thấy một trợ lý nhận diện được khác (vd `codex`) mà runner CHƯA có mẫu lệnh gọi đã kiểm chứng cho trợ lý đó, hoặc không thấy trợ lý nhận diện được nào → executor viết ra một lệnh placeholder tự-báo-lỗi (tên lệnh nêu rõ ngay nguyên nhân: không tìm thấy trợ lý, hay tìm thấy trợ lý X nhưng chưa có mẫu lệnh) thay vì đoán một mẫu lệnh gọi chưa kiểm chứng — để người vận hành gặp lỗi rõ ràng NGAY lúc cấu hình được tạo, thay vì đâm tường muộn ở bước dispatch thật với thông báo "command not found" khó hiểu. Dòng thông báo tự sinh của RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước) luôn nêu rõ trợ lý nào được dò thấy (hay không thấy trợ lý nào) và executor nào vừa được viết. Nhánh nạp cấu hình đã có sẵn (merge khoá mặc định còn thiếu) không đổi — việc dò chỉ chạy khi tự sinh bản MỚI (per D1bc96509).
- **RUL49 (khóa hoạt động cây chính chặn CỨNG, không phải cảnh báo — canh MỌI commit trần, không riêng gì verb fgOS).** Cơ chế mô tả ở "Khóa hoạt động cây chính" trên chặn ở tầng git, trước khi bất kỳ commit nào chạm cây chính — không phải một guard trong `bin/fgos.mjs`, nên không thể bị vòng qua bằng cách gọi git trực tiếp thay vì qua verb fgOS (đúng lỗ hổng đã biết của "Bảo vệ approve khỏi lồng phiên" trên, vốn chỉ canh MỘT verb và chỉ canh phiên đã đăng ký). Khóa dùng đúng một danh tính (biến môi trường phiên trợ lý khi có, tổ tiên tiến trình gần khi không) để phân biệt "chính phiên này tiếp tục" khỏi "một phiên khác đang hoạt động" — cùng danh tính luôn được coi là refresh, không bao giờ tự chặn chính mình (per STR65).
- **RUL50 (khóa hoạt động cây chính fail-closed trên tín hiệu không đọc được).** Khi nội dung khóa không phân tích được hoặc thiếu trường cần thiết, commit bị từ chối — không bao giờ được coi là "cây đang rảnh". Đây là lựa chọn CHỦ Ý ưu tiên an toàn hơn sẵn sàng, khác với "Bảo vệ approve khỏi lồng phiên"'s `isMainWorktree` (fail-open trên trường hợp mơ hồ) — hai cơ chế bảo vệ hai rủi ro khác nhau (một canh thẩm quyền FSM, một canh mất-dữ-liệu-thật đang hoạt động) nên được phép chọn khác nhau (per STR65).
- **RUL51 (repo phải có ≥1 commit trước khi runner claim bất kỳ item nào — kiểm MỘT LẦN lúc khởi động, không phải mỗi item).** `resolveRepoRoot` (site khởi động DUY NHẤT, gọi từ `main()` TRƯỚC `runOnce`) nay còn xác nhận HEAD của repo resolve được, không chỉ xác nhận repo là một repo git — cùng phạm trù lỗi `validation` với nhánh không-phải-repo-git đã có từ trước. Đây là kiểm MỘT LẦN mỗi lần `fgos-runner` khởi động, KHÔNG phải một nhánh mới trong bảng phục hồi per-item (Data Dictionary #3): trước quyết định này, một repo 0 commit khiến MỌI item đầu tiên được claim thất bại ở bước `git worktree add` (HEAD không resolve), tốn `maxRetries` lượt thử-rồi-đỗ (RUL7 (schema item mang đủ chất liệu trả lời sáu câu hỏi harness)/Data Dictionary #3) trước khi lộ ra một lỗi worktree khó truy nguyên; nay runner dừng NGAY tại khởi động với đúng nguyên nhân + cách sửa, không claim item nào, không chạm bảng phục hồi/`recovery.mjs` (per D ecfd0d1a).
- **RUL52 (luật template theo domain `coding` khớp TRƯỚC wildcard; domain lạ/vắng mặt fold về `coding` giống mọi nơi khác trong hệ — STR91).** Bảng luật của `selectTemplate` (Data Dictionary #11, RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) từ STR91 có thêm một luật đứng TRƯỚC luật wildcard cuối: `domain === 'coding'` (sau khi fold) trỏ `worker-prompt-skill-pointer.txt` — giữ nguyên đủ 6 mục cố định của template mặc định (5 mục khung `# Goal`/`# Description`/`# Worktree boundary`/`# Expected proof`/`# Constraints` cộng mục kênh báo-cáo `` ```fgos-discovered``` ``), CHỈ thêm đúng một mục mới `# Agent skill`. Phép fold domain (`undefined` hoặc một chuỗi domain KHÔNG nhận diện được → `coding`) diễn ra ĐÚNG MỘT nơi — bên trong chính `selectTemplate` (không phải ở nơi gọi `buildPrompt`/`spawnWorker`, vốn luôn truyền `work.domain` thô, nguyên vẹn) — cùng phép fold-về-`coding` hệ thống đã dùng ở lớp hướng dẫn qua skill (xem "Vòng làm việc có hướng dẫn qua tầng skill trích xuất" trên: entry skill `fgos-routing` cũng fold domain vắng mặt về `coding`), không phải một luật fallback riêng của prompt template. Đường dẫn skill (`{skillPath}`, dạng `.claude/skills/<skillName>/SKILL.md`) LUÔN resolve qua sổ đăng ký domain→skill sẵn có (`getDomain`/`skillForStage`, spec Work-State "Mô hình domain", per STR89/STR90) — KHÔNG BAO GIỜ một literal hardcode — nên luật này tự hội tụ cho bất kỳ domain tương lai nào (vd `marketing`) NGAY khi domain đó khai `skillMap` riêng cho stage `executing`, không cần sửa thêm code ở đây. Một domain đã đăng ký khác `coding` (vd `synthetic`) không đi qua luật mới — vẫn rơi về wildcard, nhận `worker-prompt-default.txt` như trước STR91 (per str91-runner-skill-convergence).


- **RUL53 (`--watch` — vòng cầm-giao BỀN, dừng CHỈ khi có tín hiệu tường minh — str7-str8-priority-intent).** `fgos-runner --watch` lặp lại nguyên vẹn vòng đời "Một vòng --once" nhiều lượt liên tiếp, KHÔNG dừng khi frontier rỗng (khác `--once`, vốn dừng khi rỗng): một lượt vừa GHI được gì (bất kỳ giao dịch cửa-ghi nào thành công) thì lượt kế tiếp bắt đầu NGAY, không chờ; một lượt không ghi được gì thì lượt kế tiếp chờ một khoảng nghỉ mặc định (đổi được qua `--poll-ms`) trước khi thử lại. Bộ đếm cầu dao (Data Dictionary #5) dùng CHUNG một thực thể xuyên suốt MỌI lượt của một tiến trình `--watch` — khác `--once`, nơi mỗi lời gọi có cầu dao riêng — nên cầu dao KHÔNG còn trơ dưới `--watch`: một việc lỗi rải rác qua nhiều lượt vẫn cộng dồn tới trần, đúng ý nghĩa "tiến trình bền tích lũy lịch sử lỗi" của chế độ này. Một lượt gặp lỗi/dừng (halted) KHÔNG kết thúc tiến trình `--watch` — chỉ lượt đó dừng, tiến trình vẫn tiếp tục thử lượt kế tiếp; DUY NHẤT tín hiệu dừng tường minh (SIGINT/SIGTERM) kết thúc tiến trình, luôn thoát mã 0 bất kể lượt cuối cùng ra sao. Một tín hiệu dừng thứ hai (người gõ Ctrl-C lần nữa khi lượt đang chạy còn dở) buộc thoát ngay (mã 130) — lối thoát khẩn cho một lượt kẹt, không chờ nó tự xong. `--watch` không tương thích với `--dry-run` (bị chặn `validation`); `--watch --once` không lỗi — `--watch` mặc nhiên thắng, giữ đúng tiền lệ `--once` đã là cờ chấp-nhận-nhưng-không-đọc (per str7-str8-priority-intent).

- **RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb — per D2 str46-io-contract).** Mỗi lượt `--once`, và mỗi chu kỳ của `--watch`, in đúng MỘT phong bì `fgos.v1` (cùng bốn trường `contract`/`generated_at`/`data_hash`/`data` đã tả ở spec Work-State "Phong bì output") thay cho dòng chữ trần trước đây — nhưng in **liền một dòng**, không xuống dòng nhiều tầng như `fgos.mjs`: một tiến trình `--watch` sống lâu phát NHIỀU phong bì nối tiếp theo thời gian, nên mỗi phong bì phải trọn trong đúng một dòng để bên đọc tách được cái này với cái kia. Với `--once`, phong bì này luôn là dòng cuối cùng của kết quả. **Ba luồng output khác của `fgos-runner` KHÔNG đổi, nằm ngoài phong bì này có chủ đích:** (1) tiến trình dò-xét từng bước bên trong một lượt (gặt-lại, nhận việc, phán làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng) tiếp tục in thẳng ra console y nguyên như trước — luồng này thuộc "Ghi lại output của trợ lý sau mỗi lượt dispatch"/"Xem live output worker khi đang chạy" đã tả trên, một tính năng tách bạch không đụng tới; (2) bản ghi cục bộ mỗi việc (`.fgos/logs/<id>.log`) không đổi; (3) dòng xác nhận đã dừng khi nhận tín hiệu dừng tường minh (RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)) vẫn là chữ trần, không bọc phong bì — đây là một dòng vòng-đời-tiến-trình, không phải kết cục của một lượt việc. Vì hai luồng (phong bì kết cục + dò-xét từng bước) độc lập và cùng ra `stdout`, bên đọc PHẢI phân biệt phong bì thật bằng cách phân tích một dòng thành JSON rồi kiểm `contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng cách đoán qua dấu hiệu chữ (vd "dòng bắt đầu bằng `{`"), vì dòng dò-xét từng bước có thể tự nhiên chứa `{` (proof của việc tự in JSON).

- **RUL63 (`executors.<id>.allowCrossProvider` — cổng governance chặn nội dung prompt rời hệ Claude qua 1 backend không rõ nguồn, mặc định hạn chế; phạm vi mở rộng thành kind-độc-lập, tsk-in1-4 D5).** `resolveExecutorConfig` (`src/runner/dispatch.mjs`), sau khi giải executor thắng cuộc theo thứ tự ưu tiên `executors.<executorId>` > `executor` (tsk-62v; rung trung gian `executors.<tier>` đã rút, tsk-in1-2), kiểm thêm: nếu `command` CUỐI CÙNG đã giải KHÔNG nằm trong danh sách CLI-Claude đã biết (`CLAUDE_CLI_COMMANDS`, hiện chỉ `'claude'` — cố ý KHÔNG dùng chung `KNOWN_ASSISTANT_CLI_NAMES`, vì danh sách đó có `'codex'`, một CLI không phải Claude) VÀ executor không mang `allowCrossProvider: true` tường minh → ném `RunnerConfigError` ngay tại thời điểm resolve, TRƯỚC bất kỳ dispatch nào — không bao giờ âm thầm gửi nội dung ra backend khác. Phép kiểm dựa trên `command` CUỐI CÙNG đã giải (không phải `kind` khai báo đơn thuần, không phải `provider` — nhãn hiển thị tự khai tùy ý, có thể spoof). Miễn trừ DUY NHẤT: một executor giải qua `buildAgentTypeExecutor` (không tự khai `command`/`adapter`/`invocations` — chỉ `agentType`) luôn tái dùng `command` của `executor` toàn cục, trên thực tế luôn là Claude, nên phép kiểm này tự vô hiệu cho đường đó — KHÔNG phải một miễn trừ theo `kind`. Trước tsk-in1-4, phạm vi CHỈ áp dụng cho `kind: "cli"` (`kind: "task"` được miễn trừ thẳng theo khai báo — lỗ hổng thật: 1 executor `kind:"task"` không có `agentType`, rơi thẳng về `executor` toàn cục qua đường KHÁC `buildAgentTypeExecutor`, đáng lẽ vẫn cần kiểm nếu `executor` đó không phải Claude, nhưng được bỏ qua nhầm). tách `kind` khỏi vai trò "cờ miễn trừ" — `agy` (`kind:"agent"`) VẪN cần `allowCrossProvider` cho backend `agy` CLI không phải Claude của nó, y hệt trước. Vắng mặt hoặc `false` ở `allowCrossProvider` luôn nghĩa là CHẶN (mặc định hạn chế) — không bao giờ đọc ngược thành "cho phép trừ khi đánh dấu nhạy cảm" (per - tsk-32n, xem `docs/history/capacity-cross-provider-governance/CONTEXT.md`+`plan.md`).
- **RUL65 (`executors.<id>.kind` là `agent`/`tool` — trục BẢN CHẤT, tách khỏi `invocations[].via` — trục CƠ CHẾ GỌI; tsk-in1-4 D5/D8/D9).** Trước item này, `kind` gánh 2 vai đồng thời: mượn thẳng `tool-registry.mjs`'s `KINDS` (`cli`/`binary`/`mcp`/`skill`) làm cơ chế probe-presence CHO CẢ dispatch, cộng thêm `'task'` cho dispatch native — 1 field, 2 câu hỏi khác nhau ("đây LÀ gì" và "gọi NÓ bằng cách nào"), khiến `gitnexus`'s `kind:"mcp"` và `herdr`'s `kind:"cli"` phải mang nghĩa kép không liên quan. Từ tsk-in1-4: `EXECUTOR_KINDS = ['agent', 'tool']` — `agent` = 1 persona sống, có thể dispatch-native khi phiên gọi có live Task access (`decideExecutorDispatchMechanism` đọc `kind === 'agent'`, không còn `'task'`); `tool` = cơ học, presence-only theo thiết kế gốc (`gitnexus`/`herdr`), dù về mặt cơ chế 1 entry `kind:"tool"` khai `command`/`args` phẳng vẫn dispatch được qua `resolveExecutorConfig` bình thường — `kind` chỉ quyết định tính đủ-điều-kiện-native, không phải có-dispatch-được-hay-không. Cơ chế gọi dời hẳn sang `invocations[].via` — `INVOCATION_VIA = ['cli', 'task', 'mcp']` (`'binary'`/`'skill'`/`'http'` bỏ khi gộp từ vocab cũ của `tool-registry.mjs`, `'api'` chưa quay lại — 0 producer lịch sử, bằng chứng qua `.fgos/events.jsonl`). `tool-registry.mjs`'s `toolsFromExecutors` (`src/state/tool-registry.mjs`) đọc probe-kind/probe-command từ `invocations[0].via`/`.command`, không còn từ `executor.kind` nữa — hệ quả trực tiếp của việc tách trục.

 Đi kèm bắt buộc 3 gate, thiếu 1 trong 3 thì `gitnexus` (chỉ có `invocations:[{via:"mcp",...}]`, không `command`/`args` phẳng) vỡ ngay lúc load hoặc bị spawn nhầm:
  - **Gate B1 (shape-theo-via, `validateInvocationShape`).** Không ép hình dạng executor (`command` string + `args` array) lên MỌI invocation bất kể `via` — `via:"cli"` cần đủ hình dạng executor thật (sẽ spawn thật); `via:"mcp"` chỉ cần `command` là 1 định danh không rỗng (không bao giờ spawn, không cần `args`); `via:"task"` không cần cả hai (dispatch native không mang subprocess argv).
  - **Gate B2 (chọn đúng invocation theo `via`, `resolveExecutorConfig`).** Không lấy `invocations[0]` mù — chọn ĐÚNG entry có `via:"cli"` (cơ chế DUY NHẤT `resolveExecutorConfig` thật sự dispatch), bất kể thứ tự khai trong mảng.
 - **Gate B3 (throw tường minh khi không dispatch-được, `resolveExecutorConfig`).** Khi 1 executor khai `invocations` nhưng KHÔNG entry nào `via:"cli"` (như `gitnexus`) — ném `RunnerConfigError` ngay, không bao giờ âm thầm rơi về `executor` toàn cục như thể executor đó chỉ mang metadata (khác hẳn 1 executor thật sự không khai `invocations`/`command`/`adapter`/`agentType` nào — ca đó vẫn rơi về `executor` toàn cục bình thường).

 `executors.<id>.for` đổi từ 1 giá trị đơn sang mảng string không rỗng — 1 executor phục vụ nhiều capability cùng lúc; mỗi phần tử phải là 1 tên (hoặc alias) đã khai trong `runner.capabilities` (RUL trên "curated capability catalog" — xem `docs/reference/forgentx-tool-registry-configuration.md`), thay hẳn enum đóng cũ `EXECUTOR_PURPOSES` (`['judge']`, đã rút). `resolveExecutorIdForPurpose` so khớp bằng `for.includes(purpose)` thay vì `for === purpose`.

  **Trạng thái triển khai (tsk-in1-4):** code + test (fixture tổng hợp) đã xong và xanh; `.fgos/config.json` SỐNG của chính repo này CHƯA migrate (`agy.kind` vẫn `"cli"`, `gitnexus`/`herdr` vẫn hình dạng cũ) — khác `runner.capabilities` (RUL trên, tsk-in1-3, thuần cộng thêm nên nạp được ở cả code cũ lẫn mới), đổi `kind` là đổi PHÁ VỠ tương thích ngược: code cũ từ chối thẳng `kind:"agent"/"tool"`. Nên KHÔNG commit thẳng lên `main` như các item liền trước (ADR0020 (chặn .fgos/ khỏi worktree worker — fgw/<id> không symlink lẫn bootstrap-copy .fgos/, merge.mjs từ chối cứng diff chạm .fgos/)'s "commit trực tiếp lên main, tách khỏi vòng đời code" chỉ an toàn khi dữ liệu mới còn tương thích code cũ) — phải land ĐỒNG THỜI với code của `fgw/tsk-in1` khi nhánh đó được merge lên `main`, không phải trước.

- **RUL66 (`EXECUTOR_ADAPTERS`' chữ ký tổng quát hoá thành `(invocation, opts)`; `'api'` quay lại `INVOCATION_VIA` với 1 adapter `http` thật; tsk-in1-5).** Trước item này `EXECUTOR_ADAPTERS` map tên adapter → hàm `(command, args, cwd, opts)` — 1 hình dạng định hình sẵn theo CLI argv, đúng "bẫy B1" (tsk-in1-4's gate B1 đã đóng cho `validateInvocationShape`, nhưng port thực thi bên dưới vẫn ép mọi adapter vào khuôn CLI). Từ tsk-in1-5: mỗi adapter nhận thẳng `(invocation, opts)` — `invocation` là bất cứ hình dạng nào adapter đó cần (`cliSpawnAdapter` đọc `command`/`args`; `httpAdapter` đọc `method`/`url`/`headers`/`body`), `opts` giữ nguyên field chung không phụ thuộc invocation (`cwd`, `timeoutMs`, `maxBuffer`, `onChunk`, `workId`, `tier`, `model` — `cwd` dời từ tham số riêng vào `opts` vì nó là ngữ cảnh thực thi, không phải dữ liệu invocation). `EXECUTOR_ADAPTERS` giờ đăng ký 2 adapter thật: `cli-spawn` (không đổi hành vi, chỉ đổi cách nhận tham số) và `http` (`httpAdapter`, tiền lệ pluggable THẬT — gọi HTTP thật qua `fetch`, timeout qua `AbortController` ném `DispatchError('worker-timeout',...)`, lỗi mạng ném `DispatchError('worker-spawn-fail',...)`, còn HTTP status khác 2xx KHÔNG bị coi là lỗi — cùng triết lý "exit code khác 0 không phải lỗi" áp cho `cli-spawn`). `INVOCATION_VIA` thêm lại `'api'` (từng bỏ vì 0 producer lịch sử — giờ có adapter thật đứng sau nên khôi phục: `['cli', 'task', 'mcp', 'api']`); Gate B1 (`validateInvocationShape`) thêm nhánh `via:"api"` yêu cầu `url` là string không rỗng, không ép `command`/`args`.

  **Phạm vi CHƯA làm (cố ý, đúng "tiền lệ" chứ không phải "tích hợp đầy đủ"):** `resolveExecutorConfig`'s gate B2/B3 (tsk-in1-4) VẪN chỉ chọn/spawn `via:"cli"` — chưa mở rộng để tự động dispatch 1 executor khai `via:"api"` qua `spawnWorker`/`executeExecutorCli`'s đường sản xuất thật. `httpAdapter` được test độc lập (gọi `EXECUTOR_ADAPTERS.http` trực tiếp với 1 test server local thật), không cần 1 executor thật đăng ký `via:"api"` — đúng như `agy` từng chứng minh `cli-spawn` trước khi có executor thứ hai nào dùng nó. Chưa có producer thật cho `'api'` tại thời điểm này (0 registration trong `.fgos/config.json` sống của repo).

- **RUL67 (dispatch chokepoint hiện rõ trên màn hình — `spawnWorker`, cả 2 nhánh `executeExecutorCli`).** Trước item này, dispatch xảy ra hoàn toàn im lặng trên stdout/stderr — kết quả (`{status, stdout, ...}` hay `{mechanism, ...}`) chỉ trả về giá trị JS/CLI JSON, không có tín hiệu nào cho người đang xem terminal biết "cái gì vừa được gọi, ai trả lời, qua đường nào" trước khi nó xảy ra. Mỗi chokepoint dispatch thật (nơi 1 executor thật sự được thực thi hoặc quyết định hand-back native, không phải nơi chỉ resolve/quyết định suông) giờ in đúng 1 dòng `stderr` ngay trước khi dispatch xảy ra: `fgos: dispatch capability=<...> executor=<...> via=<...> provider=<...> model=<...> tier=<...>`.
 - `spawnWorker` (runner tự dispatch 1 work item): `capability` in ra là kết quả `executorIdForWork` (tên skill executing-stage theo domain/stage — TRỤC KHÁC hẳn danh mục `runner.capabilities`) vì đường này không đi qua `for`/`capabilities` catalog; nhãn dùng `job=` thay vì `capability=` ngay trong dòng in để tránh lẫn 2 khái niệm. `executor` in `(global executor)` khi `cfg.executors` không có entry khớp `executorIdForWork`'s kết quả ('s "miss cố ý").
  - `executeExecutorCli` nhánh in-process (`mechanism:"in-process"`, hand-back cho caller, KHÔNG tự spawn): dòng in thêm `agentType=<...>`, `provider`/`model`/`tier` đều `n/a` (chưa resolve tới bước đó).
  - `executeExecutorCli` nhánh out-of-process (tự spawn thật): dòng in đầy đủ `provider`/`model`/`tier` như thật sẽ dùng để spawn — in NGAY TRƯỚC lệnh `adapterFn(...)` thật, không phải sau.
  - `capability` (2 nhánh `executeExecutorCli`) ưu tiên `purpose` (flag `--for` caller truyền vào) khi có; không thì đọc `cfg.executors.<id>.for` của chính executor đó (nhiều giá trị nối bằng dấu phẩy) làm nhãn thông tin; rỗng thì in `(none declared)`.
  - Thuần diagnostic (`process.stderr.write`) — không phải phần giá trị trả về của bất kỳ hàm nào, không ai đọc lại nó; không đổi hành vi/return-value hiện có của `spawnWorker`/`executeExecutorCli`.

## Edge Cases Settled

- Runner bị giết giữa việc: lần chạy sau gặt lại đúng trạng thái (proof đạt → awaiting-approval, không → blocked), nhánh có ĐÚNG MỘT commit worker — test giết thật.
- Nhánh bị worktree mồ côi giữ (path còn hoặc đã mất) đều đòi lại được — bug thật do e2e bắt sau khi code ship, vá bằng cell fix-first (phase-2-routing-10).
- Đề xuất bị người duyệt trả (`awaiting-approval→todo` kèm lý do): việc vào lại frontier, chống-lặp đếm và chặn lặp vô hạn.
- Kho chưa init / frontier trống: vòng kết thúc sạch, không nghi thức.
- Hai lần chạy chồng lấp: lần hai thoát «bận» — 0 ghi trạng thái, 0 thao tác worktree, khoá của lần một còn nguyên vẹn. Khoá mồ côi (chủ đã chết, hoặc nội dung rác) → lượt gặp nó dọn đi rồi vẫn lui ra «bận»; lượt kế tiếp chiếm khoá sạch và chạy bình thường (sau crash: hai lượt là phục hồi xong).
- Cách ly vị trí của worker có by construction: worktree nằm trong thư mục tạm hệ thống — đường walk-up từ cwd của worker không bao giờ gặp xưởng/harness phát triển.
- `fgos-runner` khởi động trên một repo git 0 commit: dừng ngay ở `validation`, nêu rõ nguyên nhân (HEAD không resolve) + cách sửa (`git commit` trước) — không claim item nào, không chạm bảng phục hồi/retry per-item, cùng phạm trù lỗi với nhánh không-phải-repo-git đã có.
- `fgos-runner` khởi động trên một repo git có ≥1 commit: hành vi không đổi một byte so với trước quyết định này — `resolveRepoRoot` vẫn trả về đúng chuỗi repo root như cũ.
- Việc bị đỗ-lại hoặc bị dừng cũng để lại bản ghi thực tế (outcome) — vòng học nhìn thấy thất bại, không chỉ thành công; đọc lại được qua `fgos check` — chứng minh bằng một lần dispatch thật (không chỉ fixture).
- Quét nghiên-cứu gặp worker sập giữa chừng, hoặc chạy xong mà không để lại commit nào: không crash vòng chạy — item nằm nguyên `discovery`/`todo` cho lượt quét sau thử lại, không bao giờ bị đẩy tiếp âm thầm; lượt chạy vẫn tiếp tục xử các item khác — chứng minh bằng e2e fail-safe qua binary thật.
- Item vừa được quét nghiên-cứu đẩy sang `planning` trong CÙNG lượt chạy: quét chia-việc ngay bên dưới đọc view tươi nên nhặt được nó trong chính lượt đó, không đợi lượt kế tiếp. Nó chỉ đi tiếp tới dispatch trong cùng lượt khi bản kế hoạch của chính nó đã khai là việc một-mảnh; còn lại nó dừng ở `planning` chờ một phiên sống phán tay — chứng minh bằng e2e một lượt `--once` đưa item từ `discovery` tới `planning` với status vẫn `todo` (không bị claim, không bị đề xuất).
- Ngã-ngũ tự động của runner trong một lượt dispatch thật (quét nghiên-cứu, nhận việc, đề xuất, đỗ) đều mang đúng `role` = `runner`; ngã-ngũ đóng tay qua CLI mang `role` = `human` — chứng minh bằng benchmark F4 chạy qua binary thật (không chỉ fixture), round 2: 6/6 tiêu chí đạt.
- `check` chạy hai lần liên tiếp trên cùng kho: lần hai luôn in phần chênh lệch entropy thật so lần một, kể cả khi điểm không đổi (in "+0 so lần trước", không im lặng) — chứng minh bằng benchmark thật.
- Một kênh seal-digest có số đếm khác 0 nhưng chênh lệch bằng 0 (không có gì mới kể từ lần trước) vẫn in ra — chỉ kênh trống tuyệt đối (số đếm 0 VÀ chênh lệch 0) mới im lặng hoàn toàn (bài học rút ra từ một lần khai sai kỳ vọng ở benchmark F4 vòng 1, sửa lại đúng ở vòng 2).
- Item đơn giản đi qua quét nghiên-cứu rồi quét chia-việc trong CÙNG một lượt chạy `--once`: chuỗi `discovery → planning → executing` hoàn tất và item tới `awaiting-approval` trước khi lượt chạy đó kết thúc — với điều kiện bản kế hoạch của nó khai một-mảnh; nếu không, nó dừng ở `planning` chờ người, và đó cũng là kết cục ĐÚNG — chứng minh bằng e2e một lượt duy nhất qua binary thật.
- Một phiên đi qua lớp hướng dẫn giai đoạn (P50) hỏi một item rõ ràng: skill làm-rõ sàng lọc câu hỏi ứng viên không đạt (chỉ ảnh hưởng người-triển-khai) và không tạo cổng chờ-người — item đi thẳng, không hỏi oan (chứng minh bằng case-study 2026-07-20).
- Engine tự phán "chưa đủ rõ" NGAY CẢ với một item khách quan rõ ràng, khi lời gọi phán-đoán bên dưới thất bại vì lý do hạ tầng (không phải vì item mơ hồ) — cổng chờ-người thật vẫn nổi lên đúng theo thiết kế fail-safe (không bao giờ coi phán đoán không chắc là pass); lớp hướng dẫn không tự trả lời thay, escalate đúng luật (chứng minh bằng case-study 2026-07-20, xem Open Gaps).
- Item phức tạp sinh ≥2 con qua một phán quyết chia-việc: gốc bị bộ lọc frontier chặn (lineage qua `parent`, không qua `deps`) cho tới khi cả hai con tới `done`; con cuối đóng xong, gốc tự lọt frontier ở lượt kế tiếp và runner tự chạy verify CỦA CHÍNH GỐC (mang từ lúc rời vòng làm-rõ) làm goal-check — chứng minh bằng e2e qua binary thật, không chỉ fixture.
- Item mơ hồ ở chia-việc (verdict cần người quyết, hoặc gốc mang risk `heavy`): đậu `awaiting-human` mang đề xuất chia làm câu hỏi; người trả lời xong, lượt phán sau phán lại từ đầu (không giữ đề xuất cũ) — chứng minh bằng e2e round-trip qua binary thật, cùng khuôn parity với vòng nghiên-cứu.
- Quét chia-việc không bao giờ tự gọi model, nên không có đường "model trả rác" ở bước này; còn một phán quyết chia tay mà có con thiếu verify thì bị từ chối — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, lượt chạy vẫn tiếp tục xử các item khác.
- Gặt-lại lúc khởi động SKIP một item `doing` mang `claimRole` người/phiên (cửa pull), dù item đó không mang commit/proof nào — nhưng vẫn gặt bình thường một claim mồ côi của chính runner ở cùng lượt gặt (chọn lọc, không phải tắt hẳn gặt-lại) — chứng minh bằng test thật cả hai nhánh trong cùng một pass.
- Một `fgos-runner --once` chạy song song trong khi một người đang cầm item qua cửa pull `take`: gặt-lại của lượt runner đó không đụng vào claim người, và runner cũng không dispatch lại item đã `doing` — chứng minh bằng e2e qua binary thật (submit → pass-through 2 stage → `take` người → `fgos-runner --once` song song → `return` xanh của người, không lượt nào giẫm lượt nào).
- Vòng đủ của một item runner qua cổng duyệt: submit/add → runner dispatch → `awaiting-approval` → `review` → `approve` → merge → `done`, mang settlement role human, bài học câu-6, và dọn nhánh/worktree đều được assert — chứng minh bằng e2e qua binary + git thật.
- Merge conflict thật trên một main đã rẽ nhánh: sau `approve` bị hủy, cây làm việc NGUYÊN VẸN byte-for-byte (HEAD không đổi, tracked tree sạch, nội dung file không đổi) — chứng minh bằng e2e thật, không chỉ spike.
- Vòng đủ của một item pull-door qua cổng duyệt: `take` → commit → `return` → `review` → `approve` (không bước merge) → `done` — chứng minh bằng e2e qua binary thật.
- `reject` một item pull-door: commit của nó vẫn là lịch sử THẬT trên main sau reject (no-auto-revert) — chứng minh bằng e2e thật.
- Hai việc độc lập (không chung gốc, không phụ thuộc nhau) dispatch trong CÙNG một mẻ đều tới đề xuất, và nhật ký sự kiện sau đó dựng lại đúng nguyên vẹn — chứng minh bằng một cửa sổ chồng-lấn THẬT giữa hai việc (không phải suy luận từ thời gian tường trình, vốn cũng đúng cho hai lần chạy tuần tự trông giống song song).
- Quyền-sở-hữu-gốc dưới hai chủ tranh cùng một gốc: chủ thứ hai luôn bị từ chối nhận, không có cửa sổ nào cả hai cùng nhận được cùng lúc — chứng minh bằng kịch bản đối đầu 2 tác nhân trước khi cell dựng thật, giữ nguyên khi dựng thật.
- Nhập xung đột thật ở tầng con→nhánh-của-gốc VÀ ở tầng gốc→cây chính: cả hai hủy sạch bằng đúng một cơ chế đã chứng minh cho việc-độc-lập trước đây — nhánh/cây nguyên vẹn sau khi hủy, không có tầng nào cần cơ chế riêng.
- Đồng bộ-lại thành công thật (đích đổi không đụng cùng chỗ với việc): việc chuyển thẳng từ đỗ về sẵn sàng nộp lại mà không đi qua "đang làm" — chứng minh bằng kịch bản thật, không rút gọn.
- Đồng bộ-lại gặp xung đột thật (đích đổi đụng đúng chỗ với việc): hủy sạch, việc giữ nguyên đỗ, nhánh của việc không đổi tip — chứng minh bằng kịch bản xung đột thật (không phải một xung đột dựng tắt), cùng cơ chế chứng minh cho cả tầng con→gốc lẫn tầng gốc→cây chính.
- Một câu trả lời làm-rõ của người (`answer`) hoặc một reject/park mang `reason` của người reset ngân sách cổng chống-lặp của chính việc đó — việc dispatch lại thay vì bị đỗ dù đã chạm trần trước đó; một resume trần (không `reason`), một `take` của người (không `answer`/`reason`), và mọi park của chính runner (kể cả mang `reason`) KHÔNG reset — chứng minh bằng test thật per-item cho từng hình, cộng một kịch bản tích hợp `runOnce` thật (RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)).
- Một vòng chỉ-máy-lỗi (không sự kiện người nào) vẫn chết đúng ở trần 3 — reset chỉ xảy ra khi CÓ can thiệp người, không phải mặc định (regression giữ nguyên cùng lúc RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc) được thêm).
- Vòng đủ của một đề xuất nguồn-nhánh từng bị đỗ (chạm trần chống-lặp): người `take` (ghi `branchHeadAtTake`) → commit thêm lên nhánh → `return` đo sạch trên worktree tạm detached tại tip nhánh → `awaiting-approval` mang `branchHeadAtReturn` (không `headAtReturn`) → `review`/`approve` (nguồn đọc là `runner`) → `done` — chứng minh bằng e2e qua binary + git thật (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)).
- `return` nguồn-nhánh với nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, việc giữ nguyên `doing`, không đổi tip nhánh — chứng minh bằng test thật.
- `return` nguồn-nhánh trong khi người đang đứng trên chính nhánh `fgw/<id>` đó ở một worktree khác: worktree tạm detached không đụng worktree của người (snapshot trước/sau byte-identical) — chứng minh bằng kịch bản hai-worktree thật, không phải suy luận.

- Đề xuất nguồn runner mở PR qua GitHub (`review --github`) rồi được merge sạch qua `approve --github --pr <n>`: item `done` mang role `human`, cùng khuôn với merge cục bộ — chứng minh bằng test thật qua một `gh` giả tiêm vào tiến trình con thật của CLI (không mock).
- `approve --github` gãy vì lời gọi GitHub thất bại (mọi lý do — xác thực, mạng, giới hạn tần suất, hay chưa rõ): item `blocked` mang lý do cụ thể cộng một bản ghi friction, cùng khuôn `merge-conflict`/`verify-fail-post-merge` — chứng minh bằng test thật.
- `review`/`approve --github` gọi trên một đề xuất KHÔNG phải nguồn runner (pull-door/legacy): từ chối `validation` ngay, không gọi GitHub, đề xuất giữ nguyên trạng thái — chứng minh bằng test thật cho cả hai verb.
- `approve --github` trên một cây làm việc chính đang bẩn (file KHÔNG liên quan đến GitHub còn thay đổi chưa commit): KHÔNG bị chặn bởi phép kiểm cây-sạch của đường cục bộ — phép kiểm đó chỉ áp cho merge cục bộ, không áp cho merge qua GitHub — chứng minh bằng test thật.
- `review --github --pr <n>` trên một PR đã bị đóng KHÔNG merge: nêu đúng số PR, hướng dẫn `fgos reject`, không đổi trạng thái item, không ghi friction — và trả lời trong đúng MỘT lời gọi GitHub dù trường sẵn-sàng-merge của PR đó đọc "chưa rõ" (không chờ-lặp cho phép hỏi thăm này, khác `viewGitHubPRStatus`'s hành vi mặc định) — chứng minh bằng test thật đo số lần gọi GitHub VÀ thời gian chạy.
- `review --github --pr <n>` trên một PR đã merge (kể cả merge thẳng trên GitHub, bỏ qua `approve --github`): chỉ báo tin, không tự đổi trạng thái item cục bộ — chứng minh bằng test thật.
- Một lượt dispatch hỏng vì lý do KHÔNG liên quan tới trợ lý (lỗi worktree, không có output/tier/model) vẫn ghi được một khối vào bản ghi cục bộ, chỉ mang loại lỗi + thông điệp — không throw vì thiếu trường — chứng minh bằng test thật.
- Một việc bị thử lại nhiều lần: mỗi lần thử nối thêm một khối MỚI vào CÙNG bản ghi cục bộ của việc đó, lần thử trước không bị mất — chứng minh bằng test thật.

- Vòng đủ tự-cải-thiện (self-improve loop STR13): một bản ghi friction chưa ngã-ngũ mang từ khóa rủi ro nặng → `evolve` (liệt kê, candidate hiện đủ trường) → `evolve --pick` (đọc-thuần, byte-compare nhật ký trước/sau xác nhận không sự kiện nào bị thêm) → `evolve --submit` (đúng một việc mới, mô tả mang từ khóa) → runner dispatch việc mới đó tới `awaiting-approval` → `review` (source: runner) → `approve` KHÔNG `--acknowledge-iron-law` (item không cha nên target là trunk, và `ironLaw.level` mặc định `ask` — từ chối cứng, nêu tên từ khóa khớp, HEAD không đổi, nhánh còn sống) → `approve --acknowledge-iron-law` (merge, verify xanh, `awaiting-approval → done`, settlement role human, nhánh/worktree dọn sạch) — chứng minh bằng e2e qua binary + git thật, mọi bước tự chạy trong CÙNG file, không dựa vào tham chiếu chéo sang test của cell khác. Hai điều kiện trong ngoặc là điều `0032` làm thành tường minh: cùng diff ấy trên một leaf land vào `fgw/<root>`, hoặc ở `ironLaw.level = "warn"`, không dừng ở bước từ chối.
- `fgos discover <id>` gọi trên một thư mục dự án MỚI, chưa từng có cấu hình runner: không còn chết vì không đọc được cấu hình — cấu hình mặc định được tự viết tại đường mặc định, item đi tiếp vào phán làm-rõ thật (đậu `awaiting-human` khi phán không chắc, đúng fail-safe hiện có, KHÔNG phải một kết quả "thành công" trần trụi) — chứng minh bằng test thật qua binary, PATH của tiến trình phán bị thu hẹp có chủ đích để không gọi trợ lý thật nào trong lúc test. Một `--config` tường minh trỏ đường vắng mặt vẫn báo lỗi ngay như trước, không bao giờ được tự sinh thay (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)).

## Open Gaps

- Cầu dao (breaker, Data Dictionary #5) trơ trong `--once`: `maxRetries` mặc định 2 luôn nhỏ hơn trần cầu dao 3, nên một việc không bao giờ tự kéo cầu dao trong một lượt `--once` đơn — chỉ đỗ qua đường trần thử-lại thường. Cần một cầu dao dùng chung xuyên lượt (hoặc hạ trần) mới làm cầu dao có tác dụng thật ở chế độ này; ghi nhận là biết-nhưng-chưa-sửa (review-debt-runner-2, không đổi hành vi).
- Nhiều lượt `check` chạy đồng thời trên cùng một kho chưa có cơ chế khóa/chống-tranh-chấp cho dòng lịch sử xu hướng (khác với nhật ký sự kiện chính, vốn đã có CAS) — cùng tinh thần ngưỡng-chưa-tới của RUL10 (diễn tập không chạm log thật) (work-state), mở lại khi ghi đồng thời thành tải chính.
- Tên nhánh trục (trunk) của cổng duyệt hiện là literal `"main"` (`merge.mjs`) — một host project dùng tên nhánh trục khác (vd `master`) sẽ gãy `approve`/`review`; đề xuất là tự phát hiện trunk lúc init/config thay vì literal (friction filed khi viết e2e cell pr-lifecycle-3, layer task-spec, severity P3 — xem `.bee/backlog.jsonl`).
- Chưa có escalation tự động khi một việc trải qua NHIỀU vòng người liên tiếp mà vẫn chưa hội tụ (vd item nổi lên "cần bàn sâu" sau N vòng người) — RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc) chỉ mở lại ngân sách theo can thiệp người, không giới hạn tổng số vòng người; escalation dạng đó cần intent-scoring và deferred có chủ đích (human-rounds, xem `docs/backlog.md` STR8).
- Nhiều tiến trình/máy ghi trạng thái thật cùng lúc (đa-writer, đa-máy) chưa được dựng — quyền-sở-hữu-gốc hôm nay chỉ sống trong bộ nhớ của MỘT lượt chạy, không bền qua tiến trình/máy khác; một lượt chạy thứ hai trên máy khác không biết gì về chủ của lượt thứ nhất (deferred, backlog STR27).
- Nạp mẻ mới hôm nay là chờ-mẻ-trước-xong-rồi-đọc-lại (poll khi một việc trong mẻ hoàn tất), không phải phản ứng tức thời theo tín hiệu bên ngoài; và vòng chạy vẫn kết thúc khi hết việc (không sống liên tục chờ việc mới) — cả hai là ranh giới có chủ đích với một cơ chế phản ứng-theo-tín-hiệu-liên-tục rộng hơn (deferred, backlog STR8).
- Chưa có ưu tiên nhập khi nhiều gốc cùng cạnh tranh cây chính — một gốc thua một lần đồng bộ-lại rồi thua lại lần sau (do gốc khác vào trước liên tục) không có cơ chế được ưu tiên hơn ở lần thử kế tiếp (deferred, backlog STR7).
- Khi đồng bộ-lại gặp xung đột thật, không có agent nào tự giải xung đột rồi đưa người duyệt lại — người luôn phải tự đọc và sửa tay (deferred lên một tầng cao hơn, backlog STR19).
- Chưa dự đoán trước những việc con nào của cùng một gốc khả năng chạm cùng chỗ để xếp chúng chạy nối tiếp thay vì song song — hai con cùng gốc chạm cùng chỗ vẫn ĐÚNG (một con catch-up/làm-lại), chỉ không phải TỐI ƯU (giảm việc-song-song-phí là một cải tiến hiệu năng hoãn lại, không phải một lưới đúng-sai, deferred, backlog STR16).
- Một cây nhiều hơn hai tầng (gốc-của-gốc, cháu) hôm nay chưa từng được tạo ra bởi hệ thống (phán chia-việc chỉ sinh con ở đúng một tầng dưới gốc) — cơ chế cây nhánh tích hợp phân giải MỌI con về nhánh của ĐỈNH cây (không phải nhánh của cha trực tiếp), điều này chỉ tương đương với "con nhập vào nhánh cha" khi cây đúng hai tầng; một cây sâu hơn hai tầng, nếu tương lai sinh ra được, sẽ cần xác nhận lại điều này còn đúng hay không — chưa kiểm chứng vì chưa có dữ liệu thật để thử.
- Cổng duyệt PR nội bộ do người gọi tay không có khóa chống hai lần gọi cùng lúc trên cùng một gốc (vd người duyệt hai việc con cùng gốc gần như đồng thời, hoặc người duyệt trong khi chính vòng tự hành đang dispatch gốc đó) — rủi ro thấp dưới một người vận hành, một cửa ghi tuần tự chỉ bảo vệ phần ghi trạng thái chứ không khóa riêng thao tác nhập của cổng duyệt tay; chưa xảy ra thật, ghi nhận như một giả định chưa kiểm.
- Danh sách module của phép thử Iron Law (Data Dictionary #10) vẫn là danh sách MINH HỌA, không đóng khung — có thể còn module năng-lực-liên-quan khác (vd các module domain/kernel khác trong `src/state/`, `src/runner/`) chưa được liệt kê mà lẽ ra đủ tư cách theo phép thử năng lực gốc; mở lại khi vận hành thật (wiring đã live, RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)) cho thấy một trường hợp bỏ sót thật.
- Merge qua GitHub (`approve --github`) không dọn nhánh sau khi xong — nhánh cục bộ `fgw/<id>` VÀ bản đã đẩy lên remote gốc đều còn nguyên, khác với merge cục bộ (tự dọn cả hai, xem RUL21 (merge sạch → done tự động; gãy → hủy sạch merge dở + blocked có lý do)) — không có cơ chế dọn nhánh đã merge phía-server hôm nay; chấp nhận biết-nhưng-chưa-sửa cho slice này (github-adapter S3).
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

- ~~**`return` không nhận ra hoàn tất của một `fgw/<id>` sinh ra từ lượt `take`/`pick` ĐẦU TIÊN (không phải tái claim một item `blocked`).**~~ RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)/RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai)'s discriminator nguồn-nhánh (`branchHeadAtTake`) trước đây chỉ được ghi trên cạnh `blocked→doing` (tái claim một đề xuất đã đỗ) — một lượt `pick` đầu tiên trên `todo→doing` chỉ ghi `headAtTake` (main-based), dù `pick` cũng dựng CÙNG worktree + nhánh `fgw/<id>` như đường tái claim. Vì `branchHeadAtTake` vắng mặt, `return` không rẽ vào nhánh nguồn-nhánh (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)) — nó chỉ đo `changedFilesSince` trên checkout CHÍNH, nơi không có gì đổi (việc thật nằm trên `fgw/<id>`) → từ chối "không có thay đổi", việc kẹt ở `doing`/`awaiting-human` dù verify xanh + đã commit thật trên nhánh riêng. Tái hiện thật (không suy đoán): `/fgOS:pick` một item `todo`, verify xanh 23/23, commit thật trên `fgw/tsk-57u` — `return` vẫn từ chối (docs/history/mvp2-scope-test-infra/reports/case-1-interactive.md, forgent workshop). **Đóng 2026-07-28:** `pick`'s nhánh claim ĐẦU TIÊN (`todo→doing`) nay ghi `branchHeadAtTake` (giá trị = HEAD hiện tại của repo lúc claim — đúng bằng điểm gốc `createWorktree` fork nhánh mới ra), cùng khuôn với nhánh tái-claim `blocked→doing` — không còn ghi `headAtTake` cho bất kỳ claim nào của `pick`; `take` (verb thuần, không dựng worktree) không đổi, vẫn dùng `headAtTake` đúng như trước.
- **`fgos-runner` không có cách tự-scope vào một thư mục/dự án con — luôn resolve repo root qua `git rev-parse --show-toplevel` từ `cwd`, không cờ/biến môi trường ghi đè.** `parseArgs` chỉ nhận `--once`/`--watch`/`--poll-ms`/`--dry-run`/`--config` (`bin/fgos-runner.mjs`); `--config` chỉ đổi FILE cấu hình đọc, không đổi root. Với một dự án con KHÔNG tự có `.git` riêng (vd một fixture/testbed sống bên trong một repo lớn hơn), `git rev-parse --show-toplevel` luôn thoát ra repo cha — runner claim/dispatch trên `.fgos/` của repo CHA, không phải của dự án con, dù các verb `fgos.mjs` khác (`submit`/`pick`/...) đã cô lập đúng qua `process.cwd()` trực tiếp. Tái hiện thật: `git -C <thư-mục-con> rev-parse --show-toplevel` thoát ra repo cha; không có config nào ở thư mục con mà runner tự nhận (docs/history/mvp2-scope-test-infra/reports/case-2-headless.md, forgent workshop). Việc: thêm một cờ/biến môi trường ghi đè root (vd `--root`/`FGOS_ROOT`) song song với cách các verb `fgos.mjs` đã cô lập, giữ `git rev-parse --show-toplevel` làm mặc định khi vắng cờ (`docs/backlog.md` PBI p-2a39f940).

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--config/--watch/--poll-ms — str7-str8-priority-intent), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng
- `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem "Gặt-lại lúc khởi động") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`modelForTier` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade "(không có)" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item
- `src/runner/loop.mjs`'s `parseDiscoveredBlocks(output)` + `captureDiscoveredWork(...)` — kênh báo việc-phát-hiện (xem "Báo việc-phát-hiện từ trợ lý" trên, RUL45 (báo việc-phát-hiện của trợ lý: đúng một lần mỗi lượt, fail-safe, có trần + chống trùng)): tách mọi khối lồng `fgos-discovered` (JSON, chỉ cần `title` khác rỗng) khỏi output đã thu của trợ lý, fail-safe (thân JSON hỏng/thiếu `title`/không phải object đều bị bỏ qua, không throw); gọi đúng MỘT LẦN trong `finally` bọc vòng thử lại của `dispatchClaimedItem`, tại kết cục cuối (không gọi lại giữa các lần thử nội bộ); mỗi khối hợp lệ đi qua `write-queue.mjs`'s `enqueue` (cùng cửa ghi tuần tự) — bên trong đó: cắt còn tối đa `DISCOVERY_CAP` (=20) khối trước khi lặp (phần dư log rồi bỏ), rồi với mỗi khối: quét view hiện hành tìm item có `discoveredFrom` khớp item đang thi công VÀ tên khớp sau khi chuẩn hoá (trim + hạ chữ) — khớp thì log rồi bỏ qua (không tạo); không khớp mới gọi `generateId`/`classify`/`addWork` (đóng dấu `discoveredFrom: item.id`, và stage vào-vòng của domain — `discovery` cho `coding`); `dispatch.mjs`'s văn bản prompt worker mô tả kênh khối lồng này cho trợ lý (nguyên tắc "chỉ báo, không tự ghi" — trợ lý vẫn không bao giờ được gọi `fgos`/đụng `.fgos/`); `sanitizeTitleForLog(title)` (S11, review-fix P3) — gộp khoảng trắng/xuống dòng + cắt 120 ký tự (kèm dấu `…` khi cắt), gọi tại đúng hai điểm `log` có nội suy `block.title` bên trong `captureDiscoveredWork`; KHÔNG áp dụng lên trường `title` truyền vào `addWork`
- `src/runner/goal-check.mjs` — hàm goal-check dùng chung DUY NHẤT (`runGoalCheck(item, cwd, timeoutMs)`): chạy `item.verify` qua shell tại `cwd`, phán chỉ bằng exit status — trích xuất từ `loop.mjs` (stage-decompose S2-pull) để cả vòng tự hành LẪN cửa pull `fgos return` (spec Work-State) gọi đúng một bản logic, không bao giờ hai bản song song
- `src/runner/frozen-judge.mjs` (STR63, domain layer thuần — không fs/git) — `FROZEN_JUDGE_PATTERNS` (bê nguyên từ frozen-judge của bee, bỏ mục `.bee/config.json` không áp dụng) + `frozenJudgeHits(changedFiles, footprint)`: chấm file đã đổi khớp nhóm nhạy cảm (test/CI/lockfile/manifest) NGOÀI `footprint` đã khai — khớp exact-path, không prefix/glob. `bin/fgos.mjs`'s `changedFilesSince(cwd, from, to)` (`git diff --name-only`, cạnh `commitsSince`) cấp input; gọi trong `return` khi `check.passed`, xem RUL60 (`return` mang thêm khuyến nghị frozen-judge — advisory, không bao giờ chặn)
- `src/intake/discovery.mjs` — xem Pointers spec Work-State (module dùng chung giữa runner và verb `discover`); verb `discover` (phiên sống) truyền `'session'`; verdict đủ rõ `moveStage` tới `planning` (bỏ qua `exploring`), verdict chưa đủ rõ `moveStage` tới `exploring` RỒI đậu `awaiting-human` mang câu hỏi (hai cửa ghi rời nhau — `stage` và `status` không giẫm nhau); một đề xuất `verify` còn phải qua một vòng kiểm cú pháp độc lập trước khi được ghi, bất đồng thì cũng đậu chờ người. `judgeDiscovery` (lời gọi phán lồng cũ) đã NGHỈ HƯU: engine luôn cần một verdict do người gọi đưa vào — worker của quét nghiên-cứu, hay phiên sống gọi `fgos discover --verdict` — thiếu verdict thì role `runner` no-op an toàn, role khác báo lỗi rõ ràng
- `src/intake/plan.mjs` (đổi tên từ `decompose.mjs`) — xem Pointers spec Work-State (module dùng chung giữa runner và verb `plan` khi item ở stage `planning`, hoặc còn ở tên di sản `decompose`); verb `plan` (phiên sống) truyền `'session'`; `resolvePlan` cũng là chỗ nhả claim `doing→todo` khi gốc sang `executing` (claim-lock §3b)
- `src/runner/prompt-templates/worker-prompt-discovery.txt` — mẫu prompt riêng của lượt dispatch nghiên-cứu, chọn bởi luật `{domain:'coding', stage:'discovery'}` trong `selectTemplate` (`src/runner/prompt-templates.mjs`); mọi lời gọi không truyền `stage` giữ nguyên hành vi cũ, không bị luật này chen trước. (Helper thử-lại `src/intake/judge-executor.mjs` của bản trước đã bị xoá cùng lúc `judgeDiscovery`/`judgeDecompose` nghỉ hưu — không còn lời gọi model phán lồng nào để thử lại.)
- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`.fgos/logs/entropy-history.jsonl`, gitignored, kể từ phase-01 plans/260825-0842-fgos-logs-dir-bucketing) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này
- `.fgos/config.json`'s `runner` section (tsk-5vf; tsk-5hv xoá hẳn fallback về file flat legacy cũ — đây giờ là nguồn config DUY NHẤT, `fgos setup` là verb thực hiện move thật) — config committed (executor template + `modelPolicies.claude` lightweight/haiku, standard/sonnet, critical/opus [tsk-5tm, thay `models` phẳng cũ] + timeoutMs); `executor.args` mang `--permission-mode acceptEdits` + `--allowedTools "Bash(git add:*),Bash(git commit:*)"` (quyền TỐI THIỂU, xem RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp)); khối `parallel` TÙY CHỌN — `maxRoots`/`maxLeavesPerRoot` (Data Dictionary #6, mặc định trong-code 4/4 khi khối vắng mặt, mọi config cũ vẫn chạy không cần sửa); `src/runner/dispatch.mjs`'s `ensureRunnerConfigForDir(dir)` — shared-file-aware: tại đường MẶC ĐỊNH (không `--config`) vắng file, gọi `detectAssistantCli` (quét PATH thuần, không spawn — `KNOWN_ASSISTANT_CLI_NAMES`) rồi viết `DEFAULT_RUNNER_CONFIG` với executor từ `SUPPORTED_EXECUTOR_TEMPLATES[detected]` khi trợ lý dò được có mẫu đã kiểm chứng (hôm nay chỉ `claude`, y hệt `DEFAULT_RUNNER_CONFIG.executor`), hoặc executor placeholder tự-báo-lỗi khi không (RUL48b) — rồi mới nạp, kèm một dòng thông báo tên file + executor được chọn (RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước)); `bin/fgos.mjs`'s verb `discover` và `bin/fgos-runner.mjs`'s vòng chính đều gọi `ensureRunnerConfigForDir` cho nhánh đường mặc định, `loadRunnerConfig` thẳng cho nhánh `--config` tường minh; đọc qua `mergeWithGlobalConfig` trước khi tách phần `runner` (project luôn thắng `~/.fgos/config.json` theo key, tsk-5vf)
- `src/runner/write-queue.mjs` — cửa ghi tuần tự thuần (không import fs/store): `createWriteQueue({onCommit})`'s `enqueue(fn)` chạy đúng MỘT giao dịch async trọn vẹn tại một thời điểm, theo thứ tự nộp FIFO, bất kể số điểm `await` bên trong; một giao dịch throw/reject không chặn hàng đợi cho giao dịch sau; hiện thực in-process của "cửa ghi"; `onCommit` (TÙY CHỌN, str7-str8-priority-intent) — callback gọi đúng một lần trên MỖI giao dịch thành công (không bao giờ trên giao dịch reject), tự bọc try/catch riêng nên một callback lỗi không bao giờ làm gãy hàng đợi; `createWriteQueue` không tham số giữ hành vi y hệt trước khi `onCommit` tồn tại
- `src/runner/loop.mjs`'s `runWatch(options)` (str7-str8-priority-intent) — vòng cầm-giao bền, xem "Vòng cầm-giao bền (--watch)" trên; ghép `runOnce` KHÔNG ĐỔI làm hộp đen, gọi lặp lại; MỘT `createWriteQueue({onCommit})` + MỘT `createMissBreaker` được tạo trước vòng lặp và dùng CHUNG xuyên mọi lượt (không tạo lại mỗi lượt — điểm đúng-sai cốt lõi cho cầu dao tích lũy per RUL53 (`--watch` — vòng cầm-giao bền, dừng chỉ khi có tín hiệu tường minh)); một cờ đóng (closure boolean) do `onCommit` set, kiểm tra SAU khi mỗi lượt `runOnce` trả về (không phải một listener chờ sự kiện — mọi giao dịch cửa-ghi trong sản phẩm đều nằm TRONG một lượt `runOnce` đã await xong, nên một thiết kế lắng-nghe-sau sẽ không bao giờ bắt được tín hiệu, đã bị loại per quyết định d3445024); lượt không ghi gì chờ qua `node:timers/promises`'s `setTimeout(ms, null, {signal})` — hủy được ngay khi `AbortSignal` bắn, không rò timer/listener vì không có listener nào để rò; một `runOnce` throw bị bọc try/catch, báo qua `options.onCycle`, KHÔNG BAO GIỜ thoát ra ngoài làm gãy vòng lặp
- `src/state/frontier.mjs` — `resolveRoot(view, id)` (đi ngược `parent` tới đỉnh, có bảo vệ chu trình); ở `state/` chứ không ở `runner/root-affinity.mjs` như trước (tsk-49i) vì chính `state/` cũng cần cùng phép đi ngược đó, và việc import ngược sang `runner/` là một trong các cạnh làm hai thư mục phụ thuộc vòng
- `src/runner/root-affinity.mjs` — quyền-sở-hữu-gốc thuần (không fs/child_process): `createOwnershipStore` (Map rootId→identity, sống trong bộ nhớ một `runOnce`, không bao giờ ghi bền); `claimRoot(store, view, id, ownerIdentity)` — quyết định THUẦN (không tự ghi), người gọi áp dụng bên trong `write-queue`; `steerFrontier(readyItems, view, store, ownerIdentity)` — lọc tập sẵn-sàng còn lại việc mà gốc chưa-chủ hoặc thuộc về chính danh tính này
- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c); `addOutcome` — cửa ghi outcome (mẫu `addDecision`); `moveStage`/`addDiscovery` — cửa ghi đổi-stage/bản-ghi-discovery (xem spec Work-State); `moveWork` gắn `role` post-transition + compose bài học câu-6 khi `to==='done'` (xem Pointers spec Work-State); `moveWork` cũng nhận `headAtTake` cộng-thêm tùy chọn — chỉ cửa pull `take` truyền, runner không bao giờ truyền nên không đổi hành vi claim của chính nó; cùng khuôn, nhận `headAtReturn` — chỉ `return` truyền (per pr-lifecycle)
- `bin/fgos.mjs` verb `take`/`return` — cửa pull giao–nhận việc ngoài vòng runner, `return` gọi thẳng `runGoalCheck` ở trên (xem spec Work-State "Cửa pull giao–nhận việc" cho hợp đồng đầy đủ); `take` nay CŨNG chấp nhận một item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) qua cạnh `blocked→doing`, ghi `branchHeadAtTake` thay vì `headAtTake`; `return` kiểm `item.branchHeadAtTake` TRƯỚC MỌI guard main-based — nguồn-nhánh verify trong worktree tạm detached tại SHA nhánh (`git worktree add --detach`, dọn trong `finally`), ghi `branchHeadAtReturn`, không bao giờ `headAtReturn` (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới), xem spec Work-State "Cửa pull giao–nhận việc")
- `src/runner/merge.mjs` — cỗ máy cơ chế của cổng duyệt (per pr-lifecycle / 1359ab5e), tách khỏi CLI cùng khuôn `worktree.mjs`/`goal-check.mjs`: `classifySource` (runner/pull/legacy — nhánh sống qua `worktree.mjs`'s `branchExists`, hay cặp `headAtTake`+`headAtReturn`, hay không cả hai); `reviewDiff(repoRoot, item, opts)` (diff theo nguồn + cảnh báo degrade trung thực; `opts.trunk` TÙY CHỌN mặc định `'main'`, per fan-out-parallel — cây nhánh tích hợp truyền nhánh của gốc cho một đề xuất con); `mergeRunnerItem` (`git merge --no-commit --no-ff` → verify trên staged tree qua `runGoalCheck` → renew/check lock ownership synchronously → commit-hoặc-abort, spike-proven; mất lock ở bước kiểm tra cuối trả `lock-lost-mid-merge` và KHÔNG abort merge state vì tree đó có thể thuộc chủ lock mới; target-agnostic — người gọi checkout đúng nhánh đích trước, cây chính cho gốc hoặc nhánh của gốc cho con); `cleanupMergedBranch` (dọn nhánh/worktree sau merge sạch, best-effort); `changedFiles(repoRoot, item, opts)` (STR13 Slice 3) — mirror hóa cơ chế phân giải trunk/nhánh của `reviewDiff` nhưng chạy `git diff --name-only` thay vì `git diff`, trả mảng path đã đổi; nguồn khác `runner` trả mảng rỗng (Iron Law approve-side chỉ soi đề xuất nguồn runner); dùng bởi `approve` để nạp `filesChanged` cho `classifyIronLaw`. KHÔNG BAO GIỜ ghi `.fgos/` trực tiếp — mọi chuyển trạng thái (`awaiting-approval→done`/`awaiting-approval→blocked`) vẫn ở `bin/fgos.mjs` qua `store.mjs`. Manifest layer (`docs/architecture-manifest.json`): infra
- `src/verbs/merge/*.mjs` (tầng `use-case`, tsk-49i) — logic nghiệp vụ của cả 7 verb cụm merge: `merge.mjs` (`mergeList`/`mergeNext`), `approve.mjs`, `review.mjs`, `sync-root.mjs`, `catchup.mjs`, `reject.mjs`, `promote-to-component.mjs`. `bin/fgos.mjs` cho 7 verb này chỉ còn parse args, tính `repoRoot` theo chính sách RIÊNG của từng verb (`--trust-dir` gate cho approve/sync-root/promote-to-component; `path.dirname(dir)` vô điều kiện cho catchup, tsk-5vl; `process.cwd` thô cho drift của `merge list`/`merge next`), rồi gọi một hàm use-case. `merge next` gọi thẳng `approveUseCase`/`syncRootUseCase` (same-rank, hợp lệ) thay cho đệ quy `runVerb` cũ, và option của hai verb đó được `parseMergeClusterOptions` dựng MỘT lần rồi truyền nguyên khối — thay cho việc forward raw `flags`
- `bin/fgos.mjs` verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của cổng duyệt một-cửa (xem "Cổng duyệt PR nội bộ" trên cho hợp đồng đầy đủ); `review`/`approve` nay leaf-vs-root-aware qua `state/frontier.mjs`'s `resolveRoot(view, id)`: một đề xuất con gọi `reviewDiff(..., {trunk: branchNameFor(rootId)})` và `approve` nhập vào một worktree ephemeral checkout trên `fgw/<rootId>` (không phải cây chính của người vận hành) rồi dọn nhánh con đó TỪ CHÍNH worktree ephemeral đó (`git branch -d` chỉ thành công từ checkout đã thật sự chứa merge); một đề xuất gốc từng có con (`view.work` có item nào `parent===id`) mà nhập-vào-cây-chính gãy mang lý do `integration-drift` riêng cộng dấu vết `main@<sha hiện tại>` trong chi tiết friction, thay vì lý do gãy-nhập thường; gốc không con giữ nguyên hành vi/lý do cũ, không đổi
- `src/runner/github-adapter.mjs` (github-adapter, layer infra) — vận chuyển GitHub thuần: `createGitHubPR`/`viewGitHubPRStatus`/`mergeGitHubPR` shell ra `gh` CLI thật (không gọi thẳng HTTP API), `classifyGhFailure` (thuần, không tiến trình con) ánh xạ một lời gọi `gh` gãy sang một lý do — khớp trên nội dung stderr (vd `HTTP 401`/`Bad credentials`), KHÔNG dựa vào mã thoát tài liệu hoá (mã 4) vì bằng chứng thật không khớp tài liệu; `viewGitHubPRStatus` chờ-lặp (poll) khi trường sẵn-sàng-merge của GitHub trả về "chưa rõ" (tính bất đồng bộ phía GitHub), có trần thời gian, không bao giờ treo vĩnh viễn — trần này truyền được qua `opts.pollTimeoutMs`, và `review --github --pr` (github-adapter) gọi với `pollTimeoutMs: 0` để buộc đúng MỘT lời gọi `gh` vì phép hỏi thăm đó chỉ cần `closed`/`mergedAt`, không liên quan tới trường sẵn-sàng-merge đang chờ-lặp. KHÔNG import `merge.mjs`/`bin/fgos.mjs`, không tự chạy verify cục bộ nào (verify vẫn ở cây làm việc cục bộ).
- `bin/fgos.mjs` verb `review --github [--pr <n>]` / `approve --github --pr <n>` — bề mặt CLI của vận chuyển GitHub (xem "Cổng duyệt qua GitHub" trên cho hợp đồng đầy đủ): đọc biến môi trường ghi đè lệnh `gh` (chỉ dùng khi kiểm thử tiêm một `gh` giả qua tiến trình con thật; sản xuất luôn dùng `gh` thật trên PATH); thăm dò nhánh đã có upstream chưa bằng một tiến trình con git thuần (không dùng lại helper ném lỗi sẵn có của file — helper đó đúng cho các bước git khác nhưng sai ngữ nghĩa cho một phép thăm dò vốn kỳ vọng gãy ở lần đầu); nhánh `--github` của `approve` chạy SAU phán Iron Law (chặn CHUNG cho mọi nguồn `runner`, hoisted lên trước cả nhánh `--github` — review-20260718-self-improve-loop f01, sửa một lỗ hổng bỏ-qua-gate thật) nhưng vẫn TRƯỚC (không đi qua) phép kiểm cây-sạch của đường cục bộ — `isMainTreeClean` chỉ có ý nghĩa cho một merge cục bộ làm bẩn cây, một merge phía GitHub không đụng cây cục bộ nên không cần; nhánh `--pr` của `review --github` (github-adapter) chèn NGAY SAU guard nguồn `runner` sẵn có, TRƯỚC bước đẩy-nhánh-rồi-mở-PR, nên áp dụng cho MỌI lời gọi `--github` bất kể có `--pr` hay không.
- `bin/fgos.mjs` verb `catchup <id>` — đồng bộ lại một việc `blocked` (xem "Đồng bộ lại một việc đỗ (catch-up)" trên): tiền điều kiện chấp nhận lý do đỗ ∈ {`merge-conflict`, `verify-fail-post-merge`, `verify-timeout-post-merge`, `integration-drift`, `merge-failed-unclassified`, `merge-blocked-other-item`, `lock-lost-mid-merge`} (tsk-18a một lần `git merge --no-commit --no-ff` gãy mà KHÔNG tạo `MERGE_HEAD` — không phải xung đột văn bản thật — nên catchup coi là ứng viên thử lại tốt nhất, vì lần gãy này rất có thể chỉ do điều kiện nhất thời; tsk-4hj `merge-blocked-other-item` — `MERGE_HEAD` đã có sẵn TRƯỚC lần merge này, thuộc về một việc KHÁC đang nhập dở, cũng là ứng viên thử lại tốt vì việc kia rồi sẽ xong hoặc bị hủy) và nhánh riêng của việc còn tồn tại (`branchExists`); đích = `branchNameFor(resolveRoot(view,id))` nếu là con, `'main'` nếu là gốc/độc lập; mở worktree ephemeral trên chính nhánh của việc, `git merge-base --is-ancestor <đích> HEAD` TRƯỚC khi nhập → nhánh đã chứa đích rồi (exit 0) → bỏ hẳn merge lẫn commit (merge sẽ là no-op, `git commit` sau đó chết vì "nothing to commit" và việc kẹt `blocked` vĩnh viễn), vẫn chạy `runGoalCheck` thật trên cây hiện có → đỏ → giữ nguyên `blocked`, KHÔNG gọi `git merge --abort` (không có merge nào đang chạy) → xanh → `moveWork(..., to:'awaiting-approval')` với `outcome: 'already-caught-up'`, không tạo commit nào; chưa chứa đích (exit 1) → `git merge --no-commit --no-ff <đích>` → xung đột thật → `git merge --abort` + giữ nguyên `blocked`; sạch → `runGoalCheck` trên cây đã stage TRƯỚC khi commit → đỏ → `git merge --abort` + giữ nguyên `blocked`; xanh → commit rồi `moveWork(..., to:'awaiting-approval', expectedStatus:'blocked')` — cạnh, không `reason`, không qua `doing` (spike `.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh` chứng minh trước khi build cell); một sự-kiện merge THỰC HIỆN TRỰC TIẾP trong verb này (không gọi `mergeRunnerItem` — hướng nhập của catch-up ngược với `mergeRunnerItem`, đích nhập VÀO nhánh của việc chứ không phải nhánh của việc nhập vào đích)
- `src/evolve/candidates.mjs` — Gate A candidate ranking (self-improve loop STR13 Slice 1): thuần (`rankCandidates(view)`), không fs/Date.now, tái dùng `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa "chưa ngã-ngũ" hay trọng số riêng); một candidate mỗi id còn friction chưa ngã-ngũ, trường hiển thị lấy từ bản ghi MỚI NHẤT theo `ts`, `score` cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, sắp xếp score giảm dần rồi id tăng dần (tie-break). Manifest layer: domain.
- `bin/fgos.mjs` verb `evolve` — bề mặt CLI của Gate A (xem "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)" trên cho hợp đồng đầy đủ): `evolve`/`evolve --pick <id>` hai bước đọc-thuần, KHÔNG BAO GIỜ stdin tương tác — không `--pick` thì liệt kê, `--pick <id>` thì in bản ghi friction đầy đủ của đúng id đó, tái dùng formatter friction sẵn có của `check` (`formatFrictionSection`, không formatter mới); `evolve --submit <id>` (STR13 Slice 3) soạn mô tả từ candidate rồi gọi `submitWork` (cùng cửa `fgos submit` dùng) — hành động ghi duy nhất của bề mặt này. Đọc view qua `listWork(dir)` DUY NHẤT — không bao giờ `rebuild`/`refreshView`/`initStore`.
- `src/intake/risk-keywords.mjs` — nguồn duy nhất của `HEAVY_KEYWORDS` (self-improve loop STR13 Slice 2): 34 từ khóa (21 gốc chuyển từ `classify.mjs` + 13 thêm, nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán). Manifest layer: kernel (tầng sâu nhất — `classify.mjs` tầng use-case và `iron-law.mjs` tầng domain đều import hợp lệ từ đây; `iron-law.mjs` KHÔNG BAO GIỜ import thẳng từ `classify.mjs` — chiều ngược, vi phạm luật một-chiều-xuống của `architecture.test.mjs`).
- `src/evolve/iron-law.mjs` — phán quyết Iron Law (self-improve loop STR13 Slice 2, xem "Iron Law — phân loại rủi ro của một candidate fix" trên cho hợp đồng đầy đủ): thuần (`classifyIronLaw({filesChanged, description})`), không fs/Date/network, import `HEAVY_KEYWORDS` từ `risk-keywords.mjs`. Manifest layer: domain. Call site: ba chỗ trong `bin/fgos.mjs`, tất cả nguồn `runner` và tất cả chỉ ở ranh giới trunk (per `0032`) — `approve` (ngay trước bước kiểm cây sạch, STR13 Slice 3), pre-check thuần của `merge next`, và `sync-root`. Ba bản gọi giữ nguyên hình dạng lặp có chủ đích: `approve`/`merge next` phân biệt bằng `resolveRoot`, `sync-root` bằng `!item.parent` (RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)).
- `src/runner/worker-log.mjs` — cửa ghi DUY NHẤT cho bản ghi output cục bộ (`.fgos/logs/<id>.log`, per worker-dispatch-log) — tách khỏi `store.mjs` vì đây là văn bản tự do (output trợ lý), khác nhật ký sự kiện có cấu trúc của `store.mjs`; `appendWorkerLog(dir, workId, entry)` nối thêm một khối, không bao giờ đè; field vắng mặt (vd không tier/model/output khi lỗi không phải của trợ lý) render mà không throw. `loop.mjs`'s `dispatchClaimedItem` gọi nó ở hai điểm: ngay sau trợ lý chạy xong (trước goal-check — bắt cả đề xuất lẫn chấm-trượt), và trong nhánh bắt lỗi mang `errorClass` (quá-giờ/hỏng-spawn/hỏng-worktree). Thư mục `.fgos/logs/` được git-ignore (không bao giờ vào cây committed) — khác `.fgos/events.jsonl` (committed, là truth) và giống `.fgos/state.json` (view cục bộ). `store.mjs`'s cửa ghi duy nhất (`events.jsonl`+`state.json`) không đổi phạm vi — bản ghi output là một cửa RIÊNG, không đi qua `moveWork`/`appendEvent`. Manifest layer (`docs/architecture-manifest.json`): infra.
- `domains/coding/AGENTS.md`'s `## fgOS Workflow` section — điểm vào của lớp hướng dẫn (P50): trỏ một phiên mới mở tới `.claude/skills/fgos-routing/SKILL.md`
- `.claude/skills/fgos-routing/SKILL.md` + `.agents/skills/fgos-routing/SKILL.md` (mirror byte-identical) — entry skill, đọc `stage` của item rồi trỏ tới đúng skill giai đoạn kế tiếp
- `.claude/skills/fgos-coding-discovering/SKILL.md` + `.agents/` mirror — skill `nghiên-cứu` (stage `discovery`, pha máy-một-mình)
- `.claude/skills/fgos-coding-exploring/SKILL.md` + `.agents/` mirror — skill `làm-rõ` (stage `exploring`, pha máy+người)
- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/` mirror — skill `chia-việc` (nửa đầu stage `planning`; cũng là skill mà tên stage di sản `decompose` trỏ tới)
- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/` mirror — skill `thẩm-định` (nửa cuối stage `planning`, gác cạnh `planning→executing`) — KHÔNG có ô riêng nào trong bảng stage→skill: nó chạy như pha thứ hai của chính `fgos-coding-planning`
- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/` mirror — skill `thi-công` (stage `executing`, domain `coding` — str89-fgos-domain-skills)
- `src/state/workflow-stage-graphs.mjs` field `skillMap` mỗi domain + hàm `skillForStage(domain, stage)` (str89-fgos-domain-skills) — sổ đăng ký domain nay còn khai skill ứng với mỗi stage, xem spec Work-State "Mô hình domain"
- `src/state/work.mjs` field `docsRef` (optional, xem spec Work-State Data Dictionary #23) — con trỏ tới `docs/history/<feature>/` của tính năng đã tạo ra item, dùng bởi lớp hướng dẫn để tìm CONTEXT.md/plan.md liên quan khi cần
- `docs/history/p50-workflow-induct/reports/p50-workflow-induct-6.md` — bằng chứng vận hành thật đầy đủ của case-study (lịch sử verb từng lệnh, kèm phát hiện lồng-phiên ở Open Gaps)
- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy
- `src/runner/main-checkout-lock.mjs` (STR65) — `acquireMainCheckoutLock(dir, {identity, ttlMs, now})`/`releaseMainCheckoutLock(dir)`: khóa tạo-nguyên-tử `wx` + đòi-lại-pid-chết, độc lập với ba khóa anh em (`runner.lock`/`sessions.lock`/`events.lock`, không import chung, xem lineage note ở `src/state/events.mjs`); `identity` nhận số nguyên (pid thật, kiểm sống qua tín hiệu 0) HOẶC chuỗi (danh tính phiên, không kiểm sống được); TỰ-NHẬN-DIỆN: danh tính khóa hiện có trùng đúng danh tính người gọi → luôn ACQUIRED (refresh), bất kể ttlMs/sống-chết — đây là "chính phiên này tiếp tục", không phải một chủ cạnh tranh; danh tính KHÁC: số nguyên giữ nguyên phép thử sống+ttl có sẵn, chuỗi chỉ xét độ mới theo `ttlMs` (không có gì để kiểm sống); nội dung khóa hỏng/không phân tích được → AMBIGUOUS (không bao giờ coi là rảnh hay đang giữ). Manifest layer: infra.
- `src/util/session-identity.mjs` (STR65; ở `src/runner/` cho tới tsk-49i — dời sang `util/` để `state/store.mjs` không phải import ngược sang `runner/`) — `resolveWriterIdentity(fgosDir, {env, pid, execFile})` → `{id, source}`: ưu tiên `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` làm `id` chuỗi; registry `<fgosDir>/sessions.json` chỉ ĐỐI CHIẾU giá trị đó, không bao giờ tự cấp một danh tính — khớp một `row.sessionId` → `source: 'registry'`, không khớp → `source: 'env'` (không có luật khớp theo thư mục hay pid của row, per str46-io-contract). Vắng cả hai biến môi trường (hoặc giá trị sai charset) thì đi ngược tối đa 3 tầng tiến trình cha (shell ra `ps -o ppid=`, dừng sớm ở pid 1 hoặc lỗi `ps`) lấy một pid số làm `id`, `source: 'pid'` — suy đoán tốt-nhất cho terminal tay gõ (xem Open Gaps); `ps` không gọi được ngay ở tầng đầu → `id` lui về pid của chính người gọi, `source: 'unresolved'` thay vì treo/ném lỗi (`unresolved` là nhãn xuất xứ, không phải danh tính vắng mặt — giá trị `id` không đổi, per str46-io-contract). Manifest layer: kernel.
- `.githooks/pre-commit` (STR65) — hook git-native (không phải verb fgOS, không phải cấu hình riêng công cụ trợ lý nào — xem "Khóa hoạt động cây chính" trên cho hợp đồng đầy đủ): giải thư mục gốc worktree bằng `path.resolve(__dirname, '..')` (KHÔNG gọi `git rev-parse --show-toplevel` — biến môi trường `GIT_DIR` mà git tự đặt khi hook chạy TRONG một git worktree làm lời gọi đó trả sai thư mục gốc, xác nhận thật bằng tái tạo có chủ đích trước khi vá); gọi `resolveWriterIdentity()` rồi `acquireMainCheckoutLock` với `ttlMs` mặc định 300000 (5 phút, đọc đè được qua biến môi trường `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`) — số này chọn từ bằng chứng thật (khoảng cách giữa các commit thật của 3 sự cố STR65 có SHA, ~2-3.5 phút), giảm từ mức mặc định 15 phút ban đầu qua 10 phút xuống 5 phút; HELD/AMBIGUOUS → in thông điệp bằng thời gian + trỏ `docs/how-to-parallel-lanes.md`, thoát khác 0; ACQUIRED → thoát 0 im lặng.
- `scripts/install-git-hooks.mjs` (STR65) — wire `core.hooksPath` về `.githooks` khi checkout có git thật (dev clone); vắng git (cài như dependency qua `npm install <github-url>`, không giữ lại git — xem `docs/specs/distribution.md`) thì thoát 0 im lặng, không throw; gọi qua `prepare` lifecycle script của `package.json` — chạy tự động sau `npm install` trên một clone mới, không cần bước cài tay riêng.
- Test: `test/runner/*` (gồm `test/runner/merge.test.mjs` — unit `classifySource`/`reviewDiff`/`mergeRunnerItem`/`cleanupMergedBranch`; `test/runner/write-queue.test.mjs` — chứng minh serialize thật qua marker enter/exit không xen kẽ; `test/runner/root-affinity.test.mjs` — resolveRoot/claimRoot/steerFrontier, khuôn race 2-tác-nhân đã spike-proven; `test/runner/goal-check.test.mjs` — mới, real-fake-executor) + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm, bao gồm 3 kịch bản stage-discovery — dispatch worker thật rồi phán quyết đủ rõ đẩy item sang `planning`, phán quyết chưa đủ rõ đẩy sang `exploring` + đậu chờ người, worker sập thì item đứng yên tại `discovery`/`todo` — cộng các kịch bản stage-clarify/stage-decompose còn lại, nay khẳng định `--once` KHÔNG tự phán ở hai tên stage đó: pass-through, chia-con-chặn-frontier, cần-người + 1 kịch bản S2-pull: `take` người + `fgos-runner --once` song song không giẫm + `return` xanh + kịch bản con fork từ tip nhánh gốc) + `test/e2e/pr-gate.test.mjs` (4 kịch bản thật qua binary + git: runner item full loop review→approve→merge→done, merge conflict thật với tree nguyên vẹn sau abort, pull-door item full loop, reject pull-door giữ commit làm lịch sử) + `test/cli/fgos.test.mjs` (unit CLI cho `take`/`return`/`review`/`approve`/`reject`/`catchup`: frontier-head claim, CAS conflict, dirty-tree/HEAD-chưa-tiến refusal, verify xanh/đỏ, main-never-holds-broken-merge cho cả conflict lẫn verify-fail, legacy degrade, leaf-vs-root branch targeting, integration-drift reason, catch-up sạch/xung-đột-thật/lý-do-không-áp-dụng-được) + `test/state/replay.test.mjs` (fold `claimRole`/`headAtTake`/`headAtReturn`) + `test/state/fsm.test.mjs` (cạnh `blocked→awaiting-approval`) + `test/report/entropy.test.mjs` (entropy thuần) + kịch bản chồng-lấn-thật hai việc song song trong `test/runner/loop.test.mjs` (peak-concurrency counter, không phải suy luận thời gian tường) + `test/runner/worker-log.test.mjs` (mới — create/append, nối-không-đè qua nhiều lần thử, degrade không throw khi field vắng) + `test/runner/frozen-judge.test.mjs` (STR63 — unit `frozenJudgeHits`, mọi rule + exact-path footprint match) + benchmark ngoài suite `docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (F4, real binaries, expected-delta khai trước run); 1380 test toàn suite tính tới STR63 (`cd repo && npm test`, số cũ 637 đã trôi qua nhiều feature trước đó — không phải drift do cell này)

## Từ vựng dispatch hiện hành

Lớp từ vựng dispatch hiện hành của fgOS phản ánh mô hình control plane hợp nhất (chuỗi ADR 0026 / 0028 / 0029 / 0031 / 0034 — Native-First Dispatch Doctrine và lịch sử tiến hóa control plane). Các thuật ngữ cũ như `rootTask`, `subTask` đã được loại bỏ hoàn toàn (superseded bởi ADR 0029 — Sửa ba mệnh đề từ vựng dispatch, xem `docs/decisions/index.md`), và `capacity` cũ đã được phân tách thành `capability` và `executor` (superseded bởi ADR 0034 — Đổi tên capacity/capacities thành executor/executors, xem `docs/decisions/index.md`).

### Bảng đối chiếu từ vựng dispatch

| Thuật ngữ hiện hành | Thuật ngữ cũ / superseded | Ý nghĩa ngắn gọn | Con trỏ tham chiếu |
|---|---|---|---|
| `work` | `rootTask` | Đơn vị công việc gốc (T2, `tsk-*`) mang vai trò T1 khi được kích hoạt | `runner.md:1958` (ADR 0029) |
| `child work` | `subTask` | Công việc con được phân rã từ một work cha | `runner.md:1959` (ADR 0029) |
| `executor` | `capacity` (đơn vị thực thi) | Đối tượng thực thi cụ thể (agentType/cli/task/mcp) đảm nhận một job/capability | `runner.md:2434` (ADR 0034) |
| `capability` | `capacity` (năng lực) | Năng lực / lời hứa hành vi có tên (abstract behavior promise) mà executor cung cấp | `runner.md:2434` (ADR 0034), `dispatch-control-plane-redesign.md:125` |
| `launcher` | `orchestrator` (nghĩa cũ `0026`) | Tiến trình/cơ chế quyết định kích hoạt work, dựng work lên rồi rời đi (buông) | `runner.md:1871` (ADR 0028) |
| `driver` | (không đổi) | Tiến trình/phiên đồng hành cùng work từ đầu đến cuối (ở lại) | `runner.md:1986` (ADR 0029), `runner.md:2172` (ADR 0031) |
| `orchestrator` | (tái gán nghĩa `0029`) | Tầng hợp thành T0 quản lý N đơn vị work (ở lại) | `runner.md:1995` (ADR 0029), `runner.md:2172` (ADR 0031) |
| `DispatchPlan` | (mới) | Kế hoạch dispatch được resolved gồm mechanism, target agent/tool, và metadata | `src/runner/dispatch/plan.mjs`, `dispatch-control-plane-redesign.md:175` |
| `DispatchAssignment` | (mới) | Đơn vị phân công dispatch cụ thể gán executor cho work item | `src/runner/dispatch/plan.mjs`, `dispatch-control-plane-redesign.md:210` |

*Ghi chú:*
- Về vai trò bên gọi `launcher` / `driver` / `orchestrator`: xem lưới 2×2 tại `runner.md:2172-2180` (kỷ yếu `0031`) tóm tắt trục T1/T0.
- Khái niệm `capacity` trong lịch sử từng đại diện cho cả năng lực lẫn đơn vị thực thi; từ ADR 0034 (`runner.md:2434`), các cấu hình `capacities.<id>` được chuyển thành `executors.<id>` và `capabilities.<id>`.
- `rootTask` và `subTask` đã bị loại bỏ khỏi từ vựng dispatch per ADR 0029 (xem `docs/decisions/index.md`).

## CoordinationSession — điều phối agent Work-độc-lập (Step 08 Phase 00)

Đây là mô tả tầm SPEC (BA-grade, WHAT chứ không phải code) của ranh giới
`CoordinationSession` đã được chốt ở Phase 00 của track `step-08-standalone-
coordination` — canonical đầy đủ (schema, ADR, ví dụ) sống ở
`docs/architect/agent-coordination/`; mục này chỉ tóm lược đủ để một phiên
đọc `docs/specs/` biết ranh giới tồn tại và trỏ đúng chỗ. Tính tới
2026-09-02 (Phase 06 R1-R7, cell P06.1+P06.2): manifest/event store + replay +
session engine + quorum/retry/cancellation + hard-budget/security hardening
đều đã có thật tại `src/runner/coordination/{schema,store,replay,
session-engine}.mjs` (test: `test/runner/coordination-*.test.mjs`) —
store/schema/events/direct cutover từ `mission-lite.mjs` cũ (đã xoá). Phase
06 R5-R7 (cell P06.2): `aggregateBounds` enforcement nay ĐỒNG NHẤT trên mọi
đường dispatch (trước đó, đường agent-led `dispatchPrimaryTask`/
`proposeConsult` không forward 3 cap concurrency-sensitive nào và không
chạy check wall-time/task-depth — tìm thấy và vá thật, không phải giả định);
`coordinationId` nay bị chặn ký tự an toàn (alnum/underscore/hyphen), đóng
một lỗ path-traversal thật (một `coordinationId` chứa `../` từng tạo được
thư mục THẬT ngoài `.fgos/coordination/sessions/`); `linkResult` nay từ
chối một `runId` không đúng quy ước của chính `assignmentId` nó gắn vào,
ngay tại thời điểm ghi (đóng một lỗ foreign-evidence thật, dù lỗ đó chưa
từng dẫn tới false-success vì đọc lại luôn fail-closed). Phase 06 R8 (đóng
độc lập bởi Reviewer+Red-Team cho toàn ma trận recovery/budget R1-R7) là
bước tiếp theo của Coordinator sau cell P06.2, chưa phải việc của Doer.

**CoordinationSession là gì.** Một lần điều phối agent có biên (bounded) —
objective, actor, budget, task/Assignment runtime khi cần, kết quả tổng hợp —
có thể chạy ĐỘC LẬP với Work (`workId: null`, không Stage, không TaskSpec,
không protocol) hoặc tham chiếu Work chỉ như context đọc-thôi. Nó là ROOT
thực thi/phục hồi của V1 — nghĩa là một phiên bị crash/resume tra cứu tiến độ
qua đúng bản ghi này, không qua đâu khác. CoordinationSession sở hữu tiến độ
điều phối, KHÔNG BAO GIỜ sở hữu vòng đời Work (bất biến cũ vẫn giữ nguyên,
xem `docs/architect/agent-coordination/architecture/work-integration.md`).
Chi tiết schema: `docs/architect/agent-coordination/contracts/coordination-session.md`;
quyết định nền: `docs/architect/agent-coordination/decisions/ADR-008-coordination-session-and-mission-deferral.md`.

**Tra cứu định nghĩa (definition discovery).** Một CoordinationSession có thể
agent-led (không cần định nghĩa nào — coordinator tự đề xuất Assignment nội
tuyến dưới chính sách nền tảng) hoặc declared (chọn một `CoordinationProtocol`
— cùng họ `FlowDefinition` với `Workflow`, chỉ khác profile: `Workflow` dùng
Stage + tích hợp vòng đời Work, `CoordinationProtocol` dùng Phase + topology/
cohort/synthesis, KHÔNG mang thẩm quyền vòng đời Work). `FlowDefinition` là
một IR (intermediate representation) đồ-thị/operation/policy dùng chung, CỘNG
THÊM vào loader hiện có (`normalizeWorkflow()`, `getDomain`,
`operationsForStage` và 15+ điểm gọi khác trong `src/runner/loop.mjs`,
`src/intake/plan.mjs`, `src/report/entropy.mjs`, `src/state/work.mjs`,
`src/setup/registrations.mjs`) — không migrate consumer nào trong giai đoạn
này. Schema đầy đủ:
`docs/architect/agent-coordination/contracts/flow-definition.md`; quyết định
nền: `docs/architect/agent-coordination/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md`.

**Dispatch-policy.** Một CoordinationSession/CoordinationProtocol không có
đường dispatch riêng — mọi execution-triggering activity vẫn hội tụ về đúng
MỘT lõi `Assignment -> DispatchPlan -> Run -> RunResult -> evidence` mà Team
Dispatch V1 đã accepted (xem "Từ vựng dispatch hiện hành" trên và
`docs/architect/agent-coordination/architecture/dispatch-control-plane.md`).
Một Cohort Planner (điều phối heterogeneous cohort theo provider/model/tier,
Step 08 Phase 04+) chỉ được phép EMIT policy input cho từng Assignment rồi
gọi lại đúng resolver đã có — không bao giờ tự spawn executor hay đọc state
của Assignment anh em (sibling) trước fan-in.

**Persistence.** Trạng thái runtime/recovery của CoordinationSession sống tại
`.fgos/coordination/sessions/<session-id>/` — CÂY GIT-IGNORED cục bộ, cùng
tinh thần `.fgos/assignments/` — KHÔNG BAO GIỜ sao chép lại bản ghi Assignment/
Run/RunResult canonical vào đây, chỉ tham chiếu id. Thành viên
session-to-Assignment là MỘT CHIỀU: ledger của session ghi nhận một Assignment
thuộc về nó NGAY TẠI LÚC Assignment được tạo (atomic, cùng khuôn `wx` mà
mission-lite prototype đã dùng); bản thân Assignment KHÔNG BAO GIỜ mang một
trường session/coordination nào (`sessionId`/`coordinationId`/`threadId`/
`coordinationRef` — đúng `FORBIDDEN_SESSION_FIELDS` mà ADR-006 §6 đã khoá,
`src/runner/dispatch/execution-contract.mjs:48`) — không có API "session nhận
nuôi (adopt)" một Assignment tạo trước đó. Mission (đối tượng nhóm nhiều
session lại, tuỳ chọn, tương lai) là `deferred-preserved`: V1 không có trường
`missionId` ở bất kỳ đâu. Prototype `mission-lite` cũ (`src/runner/dispatch/
mission-lite.mjs`) bị thay thế TRỰC TIẾP — không có reader/detector/reporter/
migration tương thích ngược nào cho `.fgos/missions/`.

**Quorum, retry/replacement, crash recovery, cancellation (Phase 06 R1-R4).**
Mặc định, một session chỉ đóng `completed` khi MỌI SessionActor bắt buộc đã
hoàn tất (evaluateSessionQuorum/closeSessionByQuorum,
`src/runner/coordination/session-engine.mjs`); một `partialPolicy` khai báo
NGAY LÚC MỞ session (`{minimumActors?, allowedOmissions?}`, bất biến sau đó,
không bao giờ tự chế ra lúc đóng) mới cho phép đóng `partial` — và `partial`
không bao giờ tự nhận là `completed`, trạng thái cuối luôn liệt kê đủ actor
missing/failed/late/replaced/dissenting. Retry (`retrySessionTask`) tạo một
Run MỚI cho ĐÚNG Assignment cũ (không tạo Assignment mới), theo policy
`maxRetries` khai báo; kết quả mới `supersede` view hiện hành của session
(`linkResult({allowSupersede: true})`) nhưng KHÔNG BAO GIỜ xoá/ghi đè
RunResult cũ — cả hai đều ở lại event log, bất biến. Thay actor
(`replaceSessionActor`) chỉ xảy ra qua đúng cơ chế này: bind actor mới CÙNG
role với actor cũ (không bao giờ đổi role ngầm), ghi provenance actor
cũ/mới + allocation, rồi việc dispatch thật cho actor mới vẫn đi qua đúng
`dispatchDeclaredOperation`/`dispatchPrimaryTask`/`proposeConsult` sẵn có —
không có đường dispatch tắt nào bỏ qua governance (provider/tier/diversity/
evidence). Phục hồi sau crash: mọi ghi nhiều-bước mới (retry declare ->
dispatch -> link; bind actor -> record replacement) đều tự self-heal khi
resume (không double-count, không double-dispatch), nhờ một bản ghi claim
trên đĩa riêng cho từng bước — với `replaceSessionActor`, claim khoá đúng
theo cặp (actor cũ, actor thay thế), nên một actor KHÁC đã bind sẵn vì lý
do độc lập (vd. một actor bắt buộc khai báo ngay lúc mở session nhưng chưa
từng dispatch — trạng thái MẶC ĐỊNH của một actor bắt buộc còn mới, không
phải ca hiếm) không bao giờ bị lẫn với resume của chính lệnh này và bị nuốt
mất slot bắt buộc của riêng nó; một state không rõ ràng (claim còn treo,
không rõ tiến trình cũ còn sống hay đã chết) fail closed với lỗi named rõ
hướng sửa, không bao giờ đoán liều. Cancellation
(`cancelSession`) chuyển sang trạng thái cuối `cancelled` (thêm vào
`active|completed|partial|failed`), chặn MỌI Assignment/Run mới (mọi cửa ghi
đều từ chối khi `status !== 'active'`), ghi lại ảnh chụp Assignment đang
in-flight lúc huỷ, nhưng không xoá/sửa Run/RunResult đã có; một Run in-flight
lúc huỷ vẫn được phép `linkResult` khi nó settle muộn. Mọi trạng thái cuối
(`completed|partial|failed|cancelled`) là hấp thụ — không có transition nào
đi tiếp từ trạng thái cuối. Chi tiết đầy đủ:
`docs/architect/agent-coordination/contracts/coordination-session.md`.

**CLI.** Verb thật (Step 08 Phase 07 R1-R4, `src/verbs/coordination/{schema,run,show}.mjs`
+ `bin/fgos.mjs`): `fgos coordination run --file <request>` (chạy đồng bộ,
mở session + dispatch mọi step khai báo + thử đóng-theo-quorum trong một
lời gọi) và `fgos coordination show <id> --json` (đọc-thôi, không mutation/
external effect). Override executor/model/tier con người đi qua đúng cờ CLI
toàn cục hiện có (`--executor`/`--model`/`--tier`), không mở cửa
infrastructure riêng cho coordination; chính sách per-actor (executor/model/
tier/persona) chỉ được khai trong request file's `actors[]`, không bao giờ
trong protocol reference. Headless adapter cùng entry point engine
(`src/runner/coordination/headless-adapter.mjs`'s `runCoordinationHeadless`),
khác duy nhất ở attachment/visibility/invocation lifecycle (R4). Ví dụ thật:
`docs/how-to/coordination-examples/*.json`; how-to:
`docs/how-to/run-a-coordination-session.md`.

**Ranh giới Work.** Một CoordinationSession có thể THAM CHIẾU Work làm context
đọc-thôi nhưng không bao giờ tự chuyển stage/status, không tự nhận acceptance/
approval từ đồng thuận agent, không tự merge nhánh, không tự đánh dấu Work
hoàn tất vì một Run/session hoàn tất — mọi hành vi đó vẫn phải qua đúng verb
Work engine sẵn có (bất biến không đổi từ
`docs/architect/agent-coordination/architecture/work-integration.md`). Không
module nào dưới `src/runner/coordination/**` (kể cả tương lai) được cấp năng
lực merge hay chuyển trạng thái Work; hai actor đang mutate không bao giờ
chạy đồng thời trên cùng một worktree. Tất cả các live proof standalone đầu
tiên của Step 08 giữ read-only; mutation gắn-Work là một stop gate cho tới khi
một live proof ở domain coding chứng minh được cô lập/merge/recovery/thẩm
quyền chuyển Work thật. Quyết định nền:
`docs/architect/agent-coordination/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md`.

## Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4)

Các ADR dưới đây được di dời nguyên văn từ `docs/decisions/` (tsk-1lv-4) -- corpus đó đã retired, `state.decisions` (qua `fgos decision --scope`) giữ record ngắn làm nguồn thật, phần narrative đầy đủ sống ở đây. Thứ tự theo số ADR gốc.


### 0005 — Runner & cô lập worker

#### Bối cảnh

Lớp state cần một "máy" thật để vòng recovery và anti-loop được **kiểm bằng chạy
thật**, không phải bảng chính sách treo. Đây cũng là bước đầu của hướng nhiều-agent
chạy song song. Đồ bảo hộ phải có máy để bảo vệ.

Mối đe dọa thực tế đối với worker trong fgOS không phải là worker cố ý gian lận (adversarial swarm worker), mà là worker drift không cố ý. Hai bằng chứng thực tế đã ghi nhận trong repo:
1. Lỗi `agy` cwd (`docs/history/agy-cwd-fidelity/RESEARCH.md`): tiến trình executor chạy với `cwd` đúng nhưng agent tự nhảy sang worktree của item khác (`fgw/tsk-1lv`), thoát thành công và báo xanh dù kết quả hoàn toàn sai.
2. Fanout worktree race (`.agents/skills/fgos-fanout/SKILL.md` dòng 159-166): trạng thái cô lập worktree ở session level bị clobber bởi sibling dispatched agents, khiến working directory của session điều phối trôi sang worktree sibling mid-run.

Ngoài ra, giả định "luôn có con người review trước khi merge" không phản ánh đúng vận hành thực tế — fgOS ưu tiên #2 "Release con người" (`docs/specs/runner.md`) với các vòng tự-duyệt batch tự động (`/fgOS:merge-loop`, `/fgOS:cleanup-loop`). Do đó, `verify` của item do RUNNER tự re-verify độc lập là bắt buộc để phát hiện worker drift trước khi auto-merge.

#### Quyết định

- **Runner tối thiểu, vòng lặp thật:** đọc frontier → lấy một việc → dispatch →
  thu kết quả → ghi qua `fgos`. Recovery matrix + anti-loop **sống trong runner** và
  được test bằng vòng chạy thật.
- **Executor = agent headless.** Prompt dựng từ chính work item (tiêu đề/loại/tham
  chiếu/verify). **`verify` của item do RUNNER tự chạy** làm goal-check độc lập —
  không tin lời worker tự khai.
- **Trong vòng dispatch, runner là NGƯỜI GHI DUY NHẤT** qua `fgos`; worker **không
  bao giờ tự gọi `fgos`**. (Giữ tiền đề single-writer của 0001 — phá là chạm ngưỡng
  mở lại luật.) Quyền ghi của người vận hành *ngoài* vòng dispatch giữ nguyên.
- **Worker chạy trên nhánh/worktree cô lập; kết quả là ĐỀ XUẤT** — commit trên nhánh
  + báo cáo. Con người (hoặc một vòng review được gọi riêng) duyệt rồi mới merge.
  **Worker không bao giờ sửa thẳng working tree chính.**
- **tier→model:** schema `work` thêm trường `tier`; runner đọc bảng map tier→model
  từ config khi dispatch worker (giao việc rẻ cho model rẻ).
- **Anti-loop đọc raw events:** đếm số lần thăm một việc cần đọc event thô, nên store
  có thêm một accessor **chỉ-đọc** trả về event thô; **cửa ghi duy nhất không đổi**.

#### Hệ quả

- **Sai thì vứt nhánh:** runner tự hành được mà không cần phòng tuyến hoàn hảo ngày
  đầu — kết quả xấu nằm trên nhánh cô lập, không đụng cây chính.
- **Recovery/anti-loop là hành vi được test,** không phải lời hứa trên giấy.
- **Cost-tiered delegation** ngay từ vòng dispatch.
- **Single-writer bảo toàn:** một cửa ghi trong lúc chạy tự động → không tranh ghi.
- **Bảo vệ trước worker drift không cố ý:** độc lập re-verify `verify` ngăn chặn sai sót lọt qua các vòng batch unattended merge (`/fgOS:merge-loop`, `/fgOS:cleanup-loop`) mà không đòi hỏi con người ngồi canh từng item.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0008 — Routing theo audience của từng interface

#### Bối cảnh

forgent có nhiều interface (giữa các bước trong một chuỗi agent, và giữa hệ thống
với các consumer bên ngoài). Cám dỗ là chọn **một** kiểu giao tiếp (một khuôn:
hoặc tất cả bằng văn xuôi, hoặc tất cả bằng dữ liệu cấu trúc) rồi áp toàn cục. Mỗi
khuôn đúng cho một loại người-đọc và sai cho loại kia.

#### Quyết định

Chọn kiểu routing **theo audience của TỪNG interface**, không toàn cục:

- **prose-handoff** (bàn giao bằng văn xuôi) cho **agent ↔ agent trong một chuỗi**:
  người đọc là một agent hiểu ngôn ngữ, cần bối cảnh và ý định.
- **data / exit-code / decision-table** (dữ liệu, mã thoát, bảng quyết định) cho
  **consumer không-chắc-là-agent**: người đọc có thể là script/máy, cần hợp đồng
  chặt và phân giải được không mơ hồ.

#### Hệ quả

- **Mỗi interface mang đúng hợp đồng cho người đọc nó** — không ép một agent phải
  parse bảng cứng, cũng không ép một script phải hiểu văn xuôi.
- **Quy tắc quyết định rõ:** hỏi "ai đọc đầu kia?" trước khi chọn định dạng, thay
  vì áp một khuôn quen tay lên mọi biên.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)

#### Bối cảnh

`tsk-1an` tái hiện: `worktree.mjs`'s `createWorktree` (dùng bởi pick/take/runner/approve
cho nhánh `fgw/<id>`) là `git worktree add` trần — vì `.fgos/` được git-tracked trong
repo này, fork checkout ra một BẢN CHỤP `.fgos/` đứng yên tại thời điểm fork, bỏ sót mọi
event chưa commit trên main. `session.mjs`'s `createSession` (dùng cho phiên driver
`fgos session start`) đã giải đúng lớp vấn đề này từ trước — xóa bản checkout rồi
symlink `.fgos/` về thẳng kho chung (trích tại `session.mjs:1-6` và
`specs/runner.md:26`). Hai code path lệch nhau về cách xử lý `.fgos/`; `docs/distillery/
porting-log.md:101` (`worktree-isolation-axis`, nguồn beegog `independent-feature-
worktrees`) treo câu hỏi mở "human chọn khóa-cây hay cô-lập-cây cho fan-out fgOS".

Trước khi chọn trục, đã xác minh bằng đọc code (không đoán):

- Không có gì trong đường dispatch worker đọc/ghi `.fgos/` hôm nay: `dispatch.mjs`'s
  executor spawn ở `cwd = wt.path` (`loop.mjs:699`) không hề gọi `fgos`; prompt worker
  cấm thẳng ("Never call `fgos` yourself and never write to `.fgos/` directly" —
  `worker-prompt-default.txt:18-21`); `dataDir()` của CLI resolve theo `process.cwd()`
  (`bin/fgos.mjs:59-61`), không có `repoRoot` cố định.
- Mọi transition trạng thái/stage — `doing→proposed/blocked` lẫn `proposed→done` — đều
  ghi **từ ngoài worktree**: `loop.mjs`'s `dispatchClaimedItem` gọi `moveWork` cùng
  process với `dir = repoRoot/.fgos` (`loop.mjs:727-815`, `store.mjs:327`); `approve`
  (merge thật) là lệnh CLI riêng chạy ở main checkout (`bin/fgos.mjs:1507`). Cửa ghi
  CTR001/one-door-write **chưa từng nằm trong worktree worker**, bất kể verify chạy ở
  đâu.
- Cơ chế duy nhất từng cho phép worker ẢNH HƯỞNG state — "discovered work" — đã đi theo
  mẫu output-có-cấu-trúc-rồi-runner-tự-áp (`0013`), không phải access sống vào
  `.fgos/`.
- `worker`'s cwd có quyền `Bash(git add:*),Bash(git commit:*)` KHÔNG giới hạn path
  (`dispatch.mjs:210-218`) — không có capability-wall thật, chỉ có lời dặn trong prompt.
  Đúng lớp lỗi repo đã tự ghi nhận ở `capability-enforced-readonly-fanout`
  (porting-log): "capability LÀ tường, không phải câu dặn — sự cố thật: analyst được
  dặn 'no writes' vẫn commit source."

#### Quyết định

Chọn phương án thứ ba, hẹp hơn cả hai vế của câu hỏi treo — **chặn-cây**, không phải
khóa-trong-cây (symlink) và không phải cô-lập-cây đầy đủ (bootstrap-copy + union-merge):

- `worktree.mjs`'s `createWorktree`, sau `git worktree add`, xóa hẳn bản `.fgos/` vừa
  checkout ra (không symlink, không giữ lại) — mirror bước xóa của `session.mjs:346-359`
  nhưng KHÔNG làm bước symlink theo sau.
- `merge.mjs` thêm một guard cơ học: một diff của nhánh `fgw/<id>` chạm bất kỳ path nào
  dưới `.fgos/` bị `approve` từ chối cứng trước khi tin merge — wall nằm ở phía trusted
  (mã chạy trên main), không dựa lời dặn worker.
- `session.mjs` giữ nguyên 100% (symlink) — actor khác hẳn: phiên driver được PHÉP
  gọi `fgos`, worker thì không.

##### Vì sao không khóa-trong-cây (symlink như session.mjs)

Đúng pattern cho actor trusted (session), SAI cho worker: symlink trỏ RA NGOÀI worktree
là lối thoát sandbox kinh điển — một write-guard mai sau muốn khoanh worker vào đúng cây
của nó sẽ phải tự biết resolve symlink target mới chặn được, nếu không thì path
`.fgos/events.jsonl` nhìn như "trong worktree" nhưng thật ra ghi thẳng ra kho sống. Hơn
nữa symlink cấp quyền ghi SỐNG vào kho DUY NHẤT từ một execution context không có
capability-wall thật (wildcard git add/commit, xem Bối cảnh) — một lần ghi lạc (bug,
prompt injection, hay agent tự ý) đâm thẳng vào `.fgos/events.jsonl` thật, không qua
review, không như code (code lỡ sai còn nằm trên nhánh vứt được). Nặng hơn cả hiện trạng
(bản chụp cũ đứng yên, ghi lạc vào đó chỉ tự làm bẩn nhánh của chính nó, bị chặn lúc
merge nếu commit).

##### Vì sao không cô-lập-cây đầy đủ (bootstrap-copy + union-merge, kiểu beegog/symphony)

Đúng pattern cho worker THẬT SỰ cần state riêng rồi hòa giải sau (repository-harness's
`symphony-isolated-runner`: "root db never source of truth of the run", đổi trạng thái
bền chỉ qua semantic changeset) — nhưng đó là bài **chưa ai hỏi** ở fgOS hôm nay: đã xác
minh không nơi nào trong dispatch cần đọc/ghi `.fgos/` từ worktree (xem Bối cảnh). Build
cả subsystem F3 (store riêng + grant read-only + resolve + union-merge lúc merge-back)
cho nhu cầu chưa tồn tại là xây trước — ngược YAGNI (`development-rules.md`). Nó còn kéo
thêm một mặt trận chưa có lời giải rẻ trong Node: cấp "read-only main-store" cho worktree
mà worktree "không tự-cấp" (đúng chữ porting-log dùng) đòi cơ chế permission/bind-mount
không cơ học đơn giản cross-platform — thêm bề mặt phải giữ đúng cho một khả năng chưa
dùng.

##### Vì sao chặn-cây

Đóng cả hai rủi ro cùng lúc, chi phí nhỏ nhất:

- Đóng bug tái hiện của `tsk-1an` triệt để hơn cả khóa lẫn cô-lập: không còn bản `.fgos/`
  nào trong worktree để "thiếu" hay "cũ" — không có gì để đọc sai, vì đọc sai cần có dữ
  liệu (dù cũ) để đọc.
- Đóng lối thoát sandbox mà khóa-trong-cây mở ra, mà không cần xây subsystem của cô-lập.
- Không thêm state phải đồng bộ, không thêm cửa ghi thứ hai — CTR001 one-door-write giữ
  nguyên nghĩa đen: chỉ một nơi vật lý là `.fgos/`, đứng ở `repoRoot`.
- Đường mở rộng vẫn còn nguyên nếu sau này worker THẬT cần ảnh hưởng state (planning
  worker, luồng dài tự đề xuất việc): nối theo đúng mẫu `0013` (output có cấu trúc,
  runner/main checkout tự áp qua verb) — không cần đảo quyết định này, chỉ cần thêm một
  kênh output nữa, giống discovered-work.

Không chốt cho trục điều phối rộng hơn (`worktree-isolation-axis`, đa-agent tách nhánh
tính năng song song) — câu hỏi đó vẫn `candidate` ở `porting-log.md:101`, phạm vi rộng
hơn hẳn bug `.fgos`-trong-`fgw/<id>` này.

#### Hệ quả

- `worktree.mjs`, `merge.mjs` cần sửa theo đúng hai gạch đầu dòng ở Quyết định — chưa
  làm tại thời điểm ghi record này, đây là quyết định trục, phần thực thi đi theo sau.
  Kiểm test: (1) tái hiện bug gốc (submit uncommitted rồi pick → xác nhận trước-sửa
  worktree mang bản `.fgos/` cũ/thiếu), (2) sau sửa, worktree hoàn toàn không có
  `.fgos/`, (3) `merge.mjs` từ chối một diff giả lập có chạm path `.fgos/`.
- `tsk-3w8` (đợi trục này chốt, theo `deps`) không đổi hướng gì thêm — vấn đề của nó
  (race main-checkout lúc `approve`/commit) là lớp coordination khác, không phải
  DB-copy/staleness của trục này.
- `session.mjs` không đổi — vẫn symlink, vẫn.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence

#### Bối cảnh

`tsk-3w8` tái hiện thật (2026-07-28, dogfood tsk-veg): `approve`'s bước cuối
(`mergeRunnerItem`'s `git commit --no-edit`, merge.mjs) fail khi 1 session
khác commit lên main CÙNG LÚC (`.git/index` clobbering — đúng lớp lỗi
`str65-worktree-isolation-enforcement` đặt tên). Code merge vẫn landed đúng
lên main; chỉ bước ghi `work.move(to:'done')` sau đó rớt, item ở lại
`proposed` dù thực tế đã xong.

Trước khi chọn hướng sửa, phát hiện qua đọc code (không đoán): cơ chế giải
đúng bài này ĐÃ CÓ SẴN, viết bởi 1 phiên khác (nhánh `str46`/`str65`/`str88`,
hợp nhất vào main qua `git pull` cùng ngày) — `src/runner/main-checkout-lock.mjs`
(primitive khóa) + `.githooks/pre-commit` (hook thật, acquire khóa đó cho MỌI
`git commit` trên checkout, bất kỳ actor nào — người, agent, CI, không riêng
verb nào của fgOS). `test/e2e/main-checkout-lock-hook.test.mjs` xanh 7/7,
`git commit` subprocess thật, tranh chấp identity thật. Hook này, MỘT KHI
ACTIVE, đã bảo vệ đúng bước `approve`'s `git commit --no-edit` mà `tsk-3w8`
nêu — không cần code application-level mới.

Nhưng hook KHÔNG active mặc định. Từng được wire tự động qua npm `prepare`
(`str65-worktree-isolation-enforcement-6`), rồi bị GỠ CHỦ Ý
(`str88-fgos-pnpm-lifecycle-1`, vì pnpm 10+ chặn `prepare` cho dependency
git-hosted), thay bằng bước tay `npm run setup:hooks` — có ghi ở README
nhưng `fgos setup`/`fgos doctor` chưa từng đọc/ghi tới, và không ai tự động
hoá lại. Không có decision record nào giải thích lý do hoãn — chỉ 1 commit
message ngắn.

#### Quyết định

Chọn **wire hook có sẵn vào `fgos doctor` (đọc) + `fgos setup` (ghi)** —
KHÔNG viết app-level lock-wrap riêng trong `approve`, KHÔNG xây
`epoch-fence-merge-gate` (CAS subsystem mới, nguồn repository-harness, ghi
trong `porting-log.md` là "Closes tsk-3w8"):

- `src/setup/git-hooks.mjs` (mới, layer `infra`) — `installGitHooks(repoRoot)`
  (ghi, **fill-only**: không bao giờ ghi đè `core.hooksPath` đã trỏ nơi khác,
  giống đúng nguyên tắc 2 side-effect kia của `setup` — `insertSourceLine`
  chỉ append, `mergeConfigDefaults` không bao giờ đụng key user đã có) và
  `mainCheckoutHookWired(cwd)` (đọc, dùng bởi cả doctor lẫn setup's report).
- `fgos doctor` thêm check thứ 4: `main-checkout-hook-wired`.
- `fgos setup` gọi `installGitHooks`, trả thêm `hooksWired` +
  `hooksSkippedExisting` (giá trị custom cũ nếu có, để không âm thầm mất
  thông tin khi từ chối ghi đè).
- `scripts/install-git-hooks.mjs` (giữ cho `npm run setup:hooks`) trở thành
  shim mỏng, re-export từ `src/setup/git-hooks.mjs` — logic thật phải nằm ở
  `src/setup/` vì `scripts/` không nằm trong `package.json`'s `files` (không
  ship theo npm package) và không nằm trong phạm vi
  `docs/architecture-manifest.json`'s import-direction check (chỉ quét
  `src/`+`bin/`) — `bin/fgos.mjs` import thẳng từ `scripts/` từng làm vỡ cả 2
  (test kiến trúc + e2e `npm pack -> npm install -g`).

##### Vì sao không app-level lock-wrap trong `approve`

Vá sai chỗ: ca lỗi thật là 1 session KHÁC không hề gọi qua `approve` — nó tự
`git commit` tay. Khóa chỉ đặt trong `approve` vô dụng với chính thủ phạm.
Hook giải đúng gốc vì chặn ở TẦNG GIT, mọi commit, không riêng 1 verb.

##### Vì sao không epoch-fence-merge-gate

Xây subsystem mới (F2 theo phân loại distill) để giải lại bài hook ĐÃ GIẢI —
ngược YAGNI. Chỉ đáng nếu sau này có bằng chứng mutex (khóa-độc-quyền) không
đủ — cần nhiều writer chạy song song thật, không chỉ chặn-nhau. Chưa có bằng
chứng đó.

#### Hệ quả

- **Đây là fix khả-tiếp-cận (reachability), không phải enforcement tự
  động** — tự đánh giá trung thực, không phóng đại: một checkout clone mới
  KHÔNG BAO GIỜ chạy `fgos setup`/`fgos doctor`/`npm run setup:hooks` (CI
  chạy `git commit` trần, hoặc agent không gọi 2 verb đó) vẫn hở y như trước
  quyết định này. Việc này thêm đường kích hoạt thứ 2 (không phụ thuộc npm
  lifecycle) + cách PHÁT HIỆN khoảng hở (`fgos doctor`), không bắt buộc kích
  hoạt.
- Việc còn mở, chưa làm trong quyết định này: có cần ép `fgos setup`/`doctor`
  chạy bắt buộc ở CI hay một trigger không tùy-chọn khác để đóng nốt khoảng
  hở đó hay không — để dành thành item riêng nếu ca thật (agent/CI commit
  không qua 2 verb này) xảy ra thường xuyên.
- Dogfood thật trên chính checkout này: `fgos setup` đã chạy, xác nhận
  `git config --get core.hooksPath` = `.githooks`, `fgos doctor` báo xanh.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill)

#### Bối cảnh

`tsk-53f` xác nhận 1 case cụ thể: claim + worktree-isolation (`take`/`pick`
vs runner) từng có 3 đường claim độc lập, đã hợp nhất qua `claim-port.mjs`
. `tsk-1ab` là khảo sát rộng hơn: những loại quyết định NÀO KHÁC trong
fgOS đang bị nhiều flow (CLI verb, runner loop, skill) tự implement riêng,
dẫn tới hành vi lệch nhau cho CÙNG một câu hỏi quyết định. Mỗi candidate
dưới đây được xác nhận bằng cách đọc trực tiếp từng call site — không suy
diễn từ tên/hình dạng giống nhau (yêu cầu (2) của item).

#### Candidates

##### Xác nhận THẬT (choke-point có bằng chứng cụ thể)

###### 1. `take` vs `pick` — 2 định nghĩa khác nhau cho "item này claim được không"

Cả hai đều delegate phần ghi state cho cùng `claimWork` (`claim-port.mjs`,
đã hợp nhất đúng theo tsk-53f) — NHƯNG mỗi verb tự gác một lớp kiểm tra
điều kiện claim RIÊNG, ngay trước khi gọi `claimWork`, và hai lớp gác đó
trả lời khác nhau cho cùng 1 input (id đang ở stage `clarify`/`decompose`,
status `todo`, chưa vào frontier):

- `take --id <id>` (`bin/fgos.mjs:1233-1237`): chặn cứng — nếu
  `status === 'todo'` và id không nằm trong `readyWork()` (frontier, tức
  chưa tới stage `executing`), ném lỗi `"is todo but not in the frontier
  yet (stage/deps/lineage)"`.
- `pick --id <id>` (`bin/fgos.mjs:1272-1285`): KHÔNG có kiểm tra
  frontier/stage — chỉ cần id tồn tại. Comment ngay tại chỗ
  (`bin/fgos.mjs:1263-1268`) xác nhận đây là chủ ý: "the frontier-membership
  guard removed below was a hard check at THIS verb layer, never an FSM
  law" — nới lỏng để clarify/decompose claim qua được cửa pick.

Hệ quả đã xác nhận thật, không suy đoán:
- `plugins/fgOS/skills/fgos-routing/SKILL.md` (bản trong worktree này) tự
  hướng dẫn dùng đúng `fgos take --role session [--id <id>]` để claim một
  item còn ở `clarify`/`decompose` — lệnh này BỊ REJECT bởi chính guard ở
  trên, vì `take` chưa từng được nới lỏng như `pick`.
- `plugins/fgOS/skills/cook/SKILL.md:36-39` đã tự phát hiện đúng lỗi này
  qua test thật ("Verified empirically against this repo... rejected"),
  ghi thành "Known gap (flagged, not guessed around)" — nhưng chỉ vá ở
  tầng cook's own flow, không sửa `fgos-routing`, và tự nhận "reconciling
  fgos-routing itself is a separate, out-of-scope fix".
- Phiên làm việc khảo sát item NÀY (tsk-1ab) tự confirm thêm 1 lần nữa:
  `pick tsk-1ab` thành công thật khi item còn stage `clarify` (log claim
  seq 518 (renumbered by tsk-n4i-1; was 502), `"from":"todo","to":"doing"`),
  đúng khớp phân tích code trên.

3 nguồn (code, cook's known-gap note, phiên này) đồng nhất — đây là
choke-point rõ nhất tìm được: 1 câu hỏi quyết định ("id này claim được
chưa"), 2 verb code trả lời khác nhau, và tài liệu skill chính thức
(`fgos-routing`) đang hướng dẫn sai theo nhánh `take` bị chặn.

**Đã sửa** (item `choke-point-take-vs-pick-claim-eligibility`): đồng bộ
guard giữa `take`/`pick` cho nhánh `--id` tường minh, KHÔNG nới `take`'s
no-`--id` default ("take mirrors runner dispatch" giữ nguyên cho nhánh
đó). `take`'s explicit-`--id` branch (`bin/fgos.mjs`) giờ gọi
`isDepsAndLineageReady` (`src/state/frontier.mjs`, factored từ `frontier`'s
own deps+lineage clause, trừ stage clause) thay vì `readyWork(dir).some(...)`
— dep-chưa-xong và open-descendant vẫn chặn claim y như cũ (test cũ
`pull-dep-blocked` vẫn xanh), chỉ riêng stage `clarify`/`decompose` không
còn chặn nữa, khớp đúng hành vi `pick` đã có từ trước. `fgos-routing`'s
prose ("claim it specifically with `--id <id>`" dùng `take --role session
[--id <id>]`) giờ ĐÚNG với hành vi thật, không cần sửa. Regression:
`test/cli/take-pick-claim-eligibility.test.mjs`.

###### 2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve`

Xác nhận lại tsk-63j với citation mới (file đã đổi dòng từ lúc ghi):

- `bin/fgos.mjs:98` định nghĩa `isWorkingTreeClean(cwd)` riêng cho `return`
  (gọi tại `bin/fgos.mjs:1428`) — chạy `git status --porcelain -- .`, chỉ
  soi subtree của `cwd`.
- `src/runner/merge.mjs:133` định nghĩa `isWorkingTreeClean(repoRoot)`
  riêng cho `approve` (import alias `isMainTreeClean` tại
  `bin/fgos.mjs:33`, gọi tại `bin/fgos.mjs:1714`) — chạy
  `git status --porcelain` không pathspec, soi TOÀN repo.

Cả hai dùng chung 1 helper loại trừ (`isFgosOnlyStatusLine`) nhưng hàm gác
chính thì viết riêng 2 lần, với khác biệt phạm vi thật (subtree vs
whole-repo) — không phải trùng tên ngẫu nhiên, là 2 implementation thật.

**Đã sửa** (item `choke-point-workingtree-clean-duplication`, commit
`3dad0c2`): hợp nhất về 1 hàm `isWorkingTreeClean(repoRoot, ownFileSet,
{ scope })` trong `src/runner/merge.mjs`, `scope` nhận `'subtree'` (return)
hoặc `'whole-repo'` (approve, mặc định) — cùng 1 lần tính `prefix`, cùng 1
lần loại trừ `.fgos/`. `bin/fgos.mjs`'s own `isWorkingTreeClean(cwd,
ownFileSet)` giờ chỉ delegate sang hàm trên với `scope: 'subtree'`.

###### 3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng

Re-verify tsk-53f's finding từ đầu theo —
xác nhận vẫn đúng 6 call site, line number đã trôi so với report cũ
(`plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md`,
tự nó là bằng chứng cho luận điểm của item này: tài liệu tĩnh trôi khỏi
code rất nhanh trong repo này):

| Ngữ cảnh | File:Line hôm nay | baseRef | Cleanup khi lỗi |
|---|---|---|---|
| `pick` | `bin/fgos.mjs` qua `claim-port.mjs:170` | HEAD hiện tại hoặc root branch (đã sửa theo baseRef truyền vào) | không có `finally`/cleanup tại call site này |
| `approve` (leaf merge, ephemeral) | `bin/fgos.mjs:1735` | root branch | có |
| `review` (ephemeral) | `bin/fgos.mjs:1994` | item branch | có |
| Runner `startupReap` | `src/runner/loop.mjs:398` | mặc định (không truyền `baseRef`) | có (`finally`) |
| Runner dispatch — LEAF | `src/runner/loop.mjs:679` | `branchNameFor(rootId)` | có |
| Runner dispatch — ROOT | `src/runner/loop.mjs:681` | mặc định | có |

`createWorktree` bản thân đã là 1 hàm dùng chung (`src/runner/worktree.mjs`)
— phần LẶP không nằm ở việc tạo worktree, mà ở việc MỖI call site tự quyết
`baseRef` nào truyền vào và tự viết cleanup riêng thay vì có 1 wrapper
chung theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch).

##### Đã kiểm tra, KHÔNG phải choke-point (loại khỏi danh sách, có bằng chứng)

Yêu cầu (2) của item đòi xác nhận thật, không chỉ giống bề ngoài — 3
candidate sau nằm trong 4 gợi ý gốc của description nhưng khi đọc code thì
ĐÃ hợp nhất đúng, không lặp:

- **Verify run + timeout**: 1 hàm dùng chung duy nhất,
  `runGoalCheck` (`src/runner/goal-check.mjs:20`) — gọi từ cả 8 nơi cần
  chạy verify (`bin/fgos.mjs:1391,1440,1886,2036`, `src/runner/loop.mjs:399,727`,
  `src/runner/merge.mjs:335`). Không có implementation thứ 2.
- **`docType` validation**: 1 hàm dùng chung duy nhất,
  `assertValidDocType` (`src/state/store.mjs:619`), gọi từ `bin/fgos.mjs:842`
  và nội bộ `store.mjs` (`addOutcome`, 2 chỗ). Comment tại
  `bin/fgos.mjs:808` tự xác nhận: "the single `DIATAXIS_DOC_TYPES` set".
- **`docsRef` validation**: 1 helper dùng chung, `optionalField`
  (`bin/fgos.mjs:172`), gọi 3 lần (`add`/`submit`/`edit`) với message lỗi
  khác nhau theo verb — khác message, không khác LOGIC kiểm tra, nên
  không tính là lặp thật.
- **Ghi `.fgos/events.jsonl`/`state.json` ở tầng thấp**: đã có 1 cửa ghi
  duy nhất có khóa, `withEventsLock`/`appendEventLocked`
  (`src/state/events.mjs`, dùng bởi mọi hàm ghi trong `store.mjs`) — tầng
  append-event tự nó KHÔNG hở, đúng như comment `store.mjs:24` tự nhận
  ("single-write-door scope stays exactly events.jsonl + state.json").

##### Ghi chú liên quan — không phải finding mới của item này

`main-checkout-lock.mjs` (2 export `acquireMainCheckoutLock`/
`releaseMainCheckoutLock`) từng bị tsk-53f's report gọi là "dead code,
imported by NOTHING" — claim đó nay ĐÃ SAI: `src/runner/claim-port.mjs:12,73`
import và gọi thật (wired post tsk-53f). Đào sâu hơn lộ ra đây là 1
cơ chế RIÊNG với mục đích khác — khóa claim-identity tại thời điểm claim,
không phải khóa git-commit — và cơ chế bảo vệ git-commit race (vụ `tsk-3w8`,
`approve`'s `git commit --no-edit` xung đột) đã được quyết định RIÊNG,
KHÔNG qua app-level lock mà qua `.githooks/pre-commit` (mọi actor, mọi
commit) — xem `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`,
đã accepted, có nêu rõ khoảng hở còn mở (hook không active mặc định) và
đã tự đóng thành 1 câu hỏi để dành cho item riêng nếu có bằng chứng thật.
Không liệt lại thành candidate riêng của tsk-1ab vì đã có quyết định +
theo dõi sẵn — trích dẫn ở đây để không đọc nhầm 2 cơ chế cùng tên
"main-checkout-lock" là một.

#### Ranked priority

1 bảng phẳng duy nhất — sort theo rủi ro lệch hành vi trước, tần suất
gọi làm tie-break. Chỉ xếp hạng 3 candidate đã XÁC NHẬN THẬT ở trên (mục
"Đã kiểm tra, KHÔNG phải choke-point" không vào bảng này vì không phải
việc cần hợp nhất).

| Hạng | Choke-point | Rủi ro lệch hành vi | Tần suất | Vì sao |
|---|---|---|---|---|
| 1 | `take` vs `pick` claim-eligibility (#1) | **Cao** — không chỉ khác hành vi ngầm, mà khiến lệnh do chính `fgos-routing` hướng dẫn literal bị CLI reject cứng, giữa chừng 1 session | Rất cao — `fgos-routing` được nạp "at the start of every fgOS work session" (chính mô tả skill), nên bất kỳ session nào theo đúng ví dụ prose sẽ dính | Sửa 1 lần (đồng bộ guard giữa `take`/`pick`, hoặc sửa lại prose `fgos-routing` theo hành vi thật của `pick`) chặn đứng lỗi lặp lại ở mọi session tương lai |
| 2 | `isWorkingTreeClean` trùng lặp (`return` vs `approve`, #2) | Trung bình — 2 phạm vi khác nhau thật (subtree vs whole-repo) có thể khiến `return` coi là sạch trong khi `approve` sau đó lại thấy bẩn (hoặc ngược lại), lệch kỳ vọng giữa 2 verb lõi | Cao — mọi lần `return` và mọi lần `approve` đều chạy qua 1 trong 2 hàm này | Hợp nhất về 1 hàm nhận tham số phạm vi (subtree/whole-repo) thay vì 2 định nghĩa riêng, để đảm bảo cùng logic loại trừ + cùng cách tính prefix |
| 3 | `createWorktree` 6 call site tự quyết baseRef/cleanup (#3) | Trung bình-thấp — mỗi nơi đã tự đúng theo ngữ cảnh riêng (baseRef hợp lý theo leaf/root, hầu hết đã có cleanup), rủi ro chủ yếu là worktree mồ côi khi cleanup thiếu (site `pick`), không phải state sai | Cao — 6 call site trải khắp `pick`/`approve`/`review`/runner dispatch, chạy thường xuyên | Thêm 1 wrapper theo "loại thao tác" (claim-isolate / merge-ephemeral / runner-dispatch) bọc `createWorktree` + cleanup thống nhất, thay vì sửa lẻ từng site |

#### No fixes applied

Đúng yêu cầu (4) của item: khảo sát này KHÔNG tự sửa bất kỳ choke-point
nào ở trên. Mỗi dòng trong bảng xếp hạng, nếu được chọn để sửa, trở thành
1 item riêng sau này (như cách finding của `tsk-53f` đã tách thành item
độc lập) — không nằm trong phạm vi thi công của `tsk-1ab`/`tsk-1ab-1`/
`tsk-1ab-2`.

### 0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng

#### Bối cảnh

User nêu định hướng ưu tiên cho dự án (session `b0010842-aafa-4cf1-9a8a-
6c7f0022d4c7`, 2026-07-28), bản gốc:

1. Ship faster — phải nhanh trước hết.
2. Better docs — thời AI, làm nhanh mà không có docs thì người khó tham gia
   vào tiến trình đảm bảo better result.
3. Better/stable result.

Phản biện: docs không nên đứng thành 1 bậc ưu tiên riêng tách khỏi result —
"on-eyes" (người đọc-hiểu để tham gia được) cần 2 trụ đồng thời, không phải
xếp tầng: **legibility** (docs) và **verifiability** (kiểm được đúng-sai
thật, không dựa lời khai — result đã verify cho được, docs không cho được).
Tách
riêng khiến "ship nhanh + docs tốt nhưng result chưa verify" đọc như đã đạt
bậc 2, dù chưa đủ tin. Gộp lại thành 1 mệnh đề CoS bắt buộc — **DoD** — đúng
kiểu STR73 đã đòi hỏi cho mọi mệnh đề CoS khác (evidence-link bắt buộc, không
chỉ cho feature-closed). Hạ tầng đối chiếu doc↔source đã có sẵn một phần:
`fgos doc-sources <docPath>` (`bin/fgos.mjs:1149`).

#### Quyết định

Thứ tự ưu tiên sản phẩm, 3 bậc:

1. **Ship faster** — tốc độ đi trước.
2. **DoD** — result đã verify VÀ docs evidence-linked, cùng một gate (không
   phải 2 bậc riêng: docs không đứng trước hay sau result, mà là điều kiện
   kèm result để tính "xong").
3. **Hoàn thiện sau ngưỡng** (post-threshold polish) — làm result tốt hơn
   mức tối thiểu DoD đã đủ tin, KHÔNG phải mở rộng tính năng/phạm vi.

#### Hệ quả

- Việc chỉ được coi "xong" (đủ điều kiện đóng) khi qua bậc 2 — result verify
  + docs evidence-linked cùng lúc; thiếu 1 trong 2 không tính là DoD.
- Bậc 3 (polish) chỉ bắt đầu SAU khi bậc 2 đã qua cho đúng lát cắt đó — không
  trộn lẫn polish vào trong khi DoD còn treo, và polish không được mở rộng
  scope/tính năng mới (khác biệt với feature work thật).

### 0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md

#### Bối cảnh

`0023` đặt 3 bậc ưu tiên nhưng bậc 1 ("ship faster") không nói rõ tốc độ gì
— chỉ code, hay cả luồng làm việc người-agent. User chốt lại nguyên văn 3
mục (2026-07-30) — ghi đúng, không diễn giải lại:

1. **Ship Faster**: giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux,
   ít chờ đợi.
2. **DoD**: reproducibly verifiable result + evidence-linked documentation.
3. **Polish Sau DoD**: hoàn thiện sau ngưỡng, không mở scope.

User hỏi thêm: đưa quyết định này lên đầu, luôn nạp cho mọi agent. Áp
placement test của `0008`'s họ hàng luật L8 (`docs/platform-foundations.md`):
"rule này có cần hold khi không workflow nào đang chạy không?" — có (thứ tự
ưu tiên áp dụng MỌI lúc, không riêng 1 workflow) → phải nằm standing sheet
(`AGENTS.md`, nạp mọi turn qua `CLAUDE.md`'s `@AGENTS.md`), không phải nằm
riêng `docs/decisions/` (nạp theo nhu cầu, dễ bị bỏ qua).

#### Quyết định

Nguyên văn 3 mục trên là quyết định — không đổi từ ngữ. Thứ tự CỐ ĐỊNH,
bậc dưới không được ghi đè bậc trên.

Đặt pointer ngắn (3 dòng) vào `AGENTS.md` ngay đầu file, trước "Before
touching code" — always-loaded, mọi agent thấy trước khi chạm code bất kỳ
việc gì. Toàn văn bối cảnh/hệ quả vẫn ở record này (`docs/decisions/0025`);
`AGENTS.md` chỉ giữ 3 dòng + link, không lặp lại lý lẽ.

#### Hệ quả

- `0023` không sửa tại chỗ, chỉ nhận `superseded_by: 0025`.
- `AGENTS.md` có thêm section priority-order — mọi agent mở repo đọc được
  ngay, không cần biết tới `docs/decisions/` mới thấy.
- L8's rule 3 (anchor-suite: mỗi doctrine rule cần cụm từ assert tự động)
  CHƯA làm ở record này — chưa có check tự động xác nhận `AGENTS.md` còn
  giữ đúng 3 mục theo thời gian. Treo lại, không phải phạm vi yêu cầu hiện
  tại.

#### Làm rõ phạm vi "ai" ship faster (bổ sung 2026-08-05)

Bối cảnh gốc ở trên đã tự nêu câu hỏi ("chỉ code, hay cả luồng làm việc
người-agent") nhưng quyết định lúc đó chỉ chốt NGUYÊN VĂN 3 mục, không trả
lời câu hỏi "ship faster — CỦA AI". Một phiên làm việc thật (`tsk-66o`, 
— mức miễn-kiểm cho `frozen-judge` khi item không khai footprint) hiểu sai
thành "ship faster = fgOS tự triển khai tính năng rẻ/nhanh hơn", khuyến
nghị theo hướng đó — SAI. User chốt lại tường minh:

> "ship faster nghĩa là các project sử dụng tool này để ship phải ship
> được faster (không loại trừ fgos) tuy nhiên nếu tập trung ship fgos
> nhanh hơn mà làm các sản phẩm dùng nó không faster được là không đúng."

**Nguyên văn 3 mục ở "Quyết định" KHÔNG đổi.** Làm rõ thêm, không diễn
giải lại chữ:

- "Ship Faster" đo tốc độ ship của **project ĐANG DÙNG fgOS** để ship sản
  phẩm của họ (agent + người vận hành fgOS trên một repo thật) — KHÔNG
  phải tốc độ tự thân team fgOS build/ship một tính năng của chính fgOS.
- fgOS không bị loại trừ — khi chính fgOS là "project đang ship" (dogfood,
  như repo này), tiêu chí vẫn áp y hệt cho NGƯỜI DÙNG fgOS-trên-fgOS.
- Khi một lựa chọn thiết kế làm fgOS rẻ/nhanh hơn để tự triển khai NHƯNG
  khiến agent/dev đang dùng fgOS trên project thật chậm hơn (noise đọc
  advisory, chờ gate, friction thao tác) — **chọn cái giúp project dùng
  fgOS nhanh hơn**, không phải cái làm fgOS rẻ hơn để build. Chi phí xây
  dựng của chính fgOS nằm ở bậc "Effort to port"/F-score khi cân nhắc
  triển khai, không phải ở tiêu chí Ship Faster này.

Placement test giữ nguyên như bản gốc (standing sheet, `AGENTS.md`, mọi
agent thấy trước khi chạm code) — làm rõ này áp dụng ngay khi đọc, không
cần đợi review threshold riêng.

### 0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity

**Pinned term: "Native-First Dispatch Doctrine"** — dùng tên này khi
tham chiếu tới toàn bộ vision trong quyết định này (vocabulary
launcher/rootTask/subTask/capacity + 4 quy tắc chọn native vs
cli/spawn dispatch bên dưới), thay vì lặp lại toàn bộ nội dung.

#### Bối cảnh

Trong lúc thi công `tsk-3sw` (capacity `agentType` field) và `tsk-53h`
(generalize cli-dispatch-for-cheap-cross-provider-tasks), và trong lúc
truy ra gap thật của `tsk-1ni` (`judgeDiscovery`/`judgeDecompose` luôn
cli/spawn 1 judge mù, kể cả khi caller đã là 1 soul sống cùng provider),
người dùng phát biểu 1 tầm nhìn tổng quát hơn cho toàn bộ cơ chế dispatch
— vượt ra ngoài phạm vi hẹp của 2 item đó. Quyết định này CHỐT tầm nhìn
đó thành văn bản chính thức (đặt tên **Native-First Dispatch Doctrine**),
làm định hướng chung cho mọi item sau này đụng tới dispatch (không tự nó
implement gì).

#### Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây)

- **launcher** — tiến trình/cơ chế QUYẾT ĐỊNH kích hoạt 1 rootTask,
  qua HOẶC 1 agent-terminal (tương tác) HOẶC 1 headless/non-interactive
  agent process (spawn/cli). Là 1 VAI TRÒ, không phải 1 phần mềm cụ thể
  duy nhất — nhiều cơ chế khác nhau đều đóng vai này:
  - Người dùng tự tay mở 1 session Claude Code/Codex/agy tương tác —
    chính người dùng là launcher.
  - `/fgOS:pick`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
    `/fgOS:cleanup-loop`, `/fgOS:retro-loop` — các skill lặp, chạy BÊN
    TRONG 1 session tương tác đang sống, lần lượt kích hoạt/đưa nhiều
    rootTask qua vòng đời của chúng.
  - `fgos-runner` (`bin/fgos-runner.mjs`/`loop.mjs`) — launcher
    HEADLESS, không cần người ngồi terminal — hình dung là tương lai khi
    không cần thao tác tay nhiều nữa, tự claim + spawn worker headless
    cho từng rootTask.
  - `herdr-plugin` (quản lý pane/tab terminal) — hạ tầng để đứng 1
    agent-terminal lên (tìm/mở pane), CÓ THỂ được 1 launcher dùng để
    đứng rootTask lên, và tự nó cũng có thể được bọc thành 1 launcher
    (ví dụ 1 automation dùng herdr mở N pane, mỗi pane chạy 1 rootTask).
  - **Vai trò launcher KHÔNG CẦN soul** — logic chọn "item nào tiếp
    theo" (FIFO picker, frontier, priority ranking...) giữ THUẦN CƠ HỌC,
 đúng tinh thần "trí tuệ không cầm picker" (`fgos-routing`'s own 
    stance) đã có sẵn trong repo. Soul chỉ vào cuộc SAU KHI launcher
    đã quyết định kích hoạt rootTask nào.

- **rootTask** — công việc gốc đang làm, được bao bọc/vận hành bởi 1
  agent-terminal (tương tác) hoặc 1 headless agent process. Vai trò này
  có tính ĐỆ QUY/fractal, không cố định ở 1 tầng: bất kỳ ai đang là "host"
  thực thi cho 1 việc, tại thời điểm nó tự kích hoạt việc con bên dưới,
  chính nó lại đóng vai rootTask cho những việc con đó (khớp
  `tsk-53h`'s nesting rule đã pin: 1 `claude` bị spawn qua cli/spawn, một
  khi đã chạy, chính nó lại là 1 Claude Code agent loop thật, có thể tiếp
  tục dispatch xuống 1 tầng nữa).

- **subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG bản chất chỉ là 1
  **rootTask** khác, được kích hoạt đệ quy bởi rootTask hiện tại (khớp
  đúng tính đệ quy/fractal đã nói ở trên — "subTask" chỉ là tên gọi
  tương đối, nhìn từ góc của bên kích hoạt).

- **capacity** — KHÁC bản chất với subTask: là 1 đơn vị functional/helper
  hẹp (judge-discovery, submit-assist-classify) — không tự mang vòng đời
  1 rootTask đầy đủ.

  **subTask và capacity KHÔNG gộp thành 1 khái niệm** (đính chính lại
  phát biểu ban đầu) — chúng khác nhau thật về bản chất (1 bên là
  rootTask đệ quy, 1 bên là helper). Cái GIỐNG NHAU, và là điều đáng nói,
  là **CƠ CHẾ DISPATCH/LAUNCH**: quyết định "kích hoạt bằng gì" (native
  hay cli/spawn, theo 4 quy tắc dưới) áp dụng Y HỆT cho cả 2 — bên kích
  hoạt không cần quan tâm target là 1 rootTask-con hay 1 helper, chỉ cần
  biết: có cần soul không, cùng provider không, có cơ chế native tương
  ứng không, config có ép cli/spawn không. Từ góc nhìn cơ chế dispatch
  (không phải góc nhìn khái niệm), coi cả 2 là "đối tượng bị kích hoạt"
  chung 1 quyết định là hợp lý — nhưng đó là hợp nhất Ở TẦNG CƠ CHẾ, chưa
  từng có ý gộp bản chất 2 khái niệm làm một.

#### Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity)

1. **Target thuần cơ học** (không cần suy luận/soul) → luôn cli/spawn.
   Hiển nhiên, không có lựa chọn khác, không tranh cãi.

2. **Target cần soul, CÙNG provider với rootTask đang chạy** → ưu tiên
   cơ chế NATIVE của chính provider đó (Claude: Task/SubAgent/Team; agy:
   `--agent` + cơ chế subagent nội bộ của riêng nó — xác nhận thật qua
   changelog agy: "subagent_info payload for delegated subagents...
   nested subagents (grandchild and deeper)" — agy có khái niệm
   native-subagent-trong-session y hệt Claude, không chỉ mỗi CLI flag
   `--agent`). Đây là **native dispatch** — tên tổng quát hoá của
   "task-dispatch" (`tsk-53h`) ra khỏi phạm vi riêng Claude, cho MỌI
   provider có cơ chế in-process của riêng nó.

   **Thu hẹp bởi `0033` (2026-08-16):** quy tắc 2 chỉ còn đúng cho
   capacity **agentType-shaped** (chỉ có `agentType`, không có `command`/
   `invocations` riêng — honoring nó `in-process` CHÍNH LÀ honoring cấu
   hình). Một capacity **cli-spawn-shaped** (có `command`/`invocations`
   riêng, ví dụ `agy`) giờ LUÔN cli/spawn khi đã cấu hình, kể cả khi
   caller cùng provider và có sẵn native mechanism — quyết định người
   dùng trực tiếp, xem `0033` cho lý do đầy đủ.

3. **Target cần soul, KHÁC provider với rootTask đang chạy** → bắt buộc
   cli/spawn (**cli/spawn dispatch** — tên giữ nguyên nghĩa "cli-dispatch"
   cũ). Không có ngoại lệ hôm nay — chưa provider nào hỗ trợ native
   cross-provider (Claude's Task tool chỉ chọn được model Claude, không
   gọi được binary khác — đã xác nhận qua `--model`/`--agent` help text
   lẫn `tsk-53h`'s locked fact).

4. **Ngoại lệ hợp lệ, không phải bug:** config có thể ép 1 target cùng
   provider vẫn phải cli/spawn, cho mục đích riêng (ví dụ: cách ly tài
   nguyên, cần chạy trong worktree/cwd khác, cần 1 tiến trình độc lập
   hoàn toàn không chia sẻ context). `tsk-3sw`'s `agentType` field
   (headless-runner spawn `claude --agent <name>`) CHÍNH LÀ case này —
   hợp lệ, không sai, không bị tầm nhìn này phủ nhận.

#### Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI)

Hiện nay 4 trong 5 pha triển khai doctrine (`tsk-1ni`, `tsk-27y`, `tsk-53h`, `tsk-3ik`) đã HOÀN THÀNH, và Pha 5 (`tsk-6db`, mở rộng native detection sang `agy`) được hoãn lại có chủ đích (deferred/YAGNI, chưa có consumer thật) — không phải gap chưa được giải quyết.

Bối cảnh lịch sử và bằng chứng ban đầu (`tsk-1ni`): `judgeDiscovery`/`judgeDecompose` — 1 capacity cần soul (helper functional, không phải subTask) — trước đây LUÔN cli/spawn 1 `claude -p` con, dù caller (chính session đang gọi `fgos discover`) đã là 1 soul sống, CÙNG provider, đã có sẵn context tốt hơn (đã đọc CONTEXT.md, đã tự Socratic xong). Đúng lẽ ra phải rơi vào nhánh 2 (native — tự suy luận tiếp, không cần spawn gì cả) nhưng lại rơi vào nhánh 3/4 một cách âm thầm, sai — không phải vì thiếu khái niệm kiến trúc, mà vì thiếu cơ chế PHÁT HIỆN "tôi đang được gọi từ 1 soul sống cùng provider hay không" trước khi quyết định.

Tầm nhìn ban đầu cho rằng lớp thiếu này cần LÀ MỘT PHÁN ĐOÁN CỦA LLM (không thuần cơ học) vì tín hiệu quyết định không chỉ là 1 biến môi trường boolean (`CLAUDECODE` có mặt hay không) — còn phải cân nhắc: capacity này có thật sự cần soul không, có tồn tại cơ chế native tương ứng không, config có ép cli/spawn không, và (khi native khả dụng) có đáng dùng native hay vẫn nên cli/spawn vì lý do cô lập/tài nguyên.

**Bản thu hẹp có chủ đích trong thực tế:** Những gì đã được ship (`tsk-53h` / `tsk-3ik`) là một bản thu hẹp có chủ đích (deliberate narrowing) của tầm nhìn 4 yếu tố phán đoán LLM ban đầu: 3 yếu tố được giải quyết cơ học ở thời điểm cấu hình (config-time: shape/kind agent vs tool, config ép cli-spawn), và yếu tố runtime duy nhất còn lại ("liệu tôi có đang là 1 soul sống có quyền truy cập Task tool hay không") được thu gọn thành cờ tự khai báo `--has-live-task-access` do caller truyền trực tiếp (không bao giờ tự dò tìm hay đoán mò). Bằng chứng mã nguồn: `src/runner/dispatch/mechanism.mjs:42` (`decideDispatchMechanism`) và `src/runner/dispatch/mechanism.mjs:82` (`decideExecutorDispatchMechanism`).

#### Quan hệ với việc đã khoá — không mâu thuẫn, chỉ hẹp hơn

- `tsk-3sw` (agentType, Claude-only, build qua cli/spawn) — là 1 mảnh
  ghép ĐÚNG của quy tắc 4 (ngoại lệ hợp lệ) + phần thật cần cho mọi
  nhánh khác cũng vậy (cli/spawn primitive vẫn cần tồn tại, dùng chung
  cho case cơ học/cross-provider/config-ép). Không bị supersede.
- `tsk-53h`'s nesting rule + bằng chứng đa-provider (Claude/agy/Codex 3
  shape khác nhau) — ĐÚNG NỀN TẢNG quy tắc 2/3 ở trên dựa vào, không đổi.
- Cả 2 item đó và gap `tsk-1ni` đều chỉ là MẢNH GHÉP hẹp (cơ chế
  `capabilities.<id>` config riêng của fgOS) của bức tranh rộng hơn tầm
  nhìn này vẽ ra (gộp cả việc tự gọi Task tool ngoài cơ chế
  `capabilities.<id>`, gộp cả khái niệm launcher tường minh).

#### Ranh giới quan sát được (observability) — tránh ngộ nhận

Ưu tiên native (quy tắc 2) có 2 lý do ĐỘC LẬP, không phải 1: (a) tránh
lãng phí/sai lệch khi soul mù re-derive 1 phán đoán soul sống đã làm rồi
(đúng bug `tsk-1ni`) — lý do này ĐÚNG ở CẢ launcher tương tác lẫn
headless; (b) quan sát được trực tiếp (agent-terminal tương tác cho thấy
pane/subagent sống) — lý do này CHỈ đúng khi launcher đang tương tác.
Khi rootTask tự nó chạy headless (spawn bởi `fgos-runner`), dùng native
bên trong nó (nested Task) VẪN tránh được lãng phí (a) nhưng KHÔNG cho
quan sát sống (b) — vẫn chỉ ghi lại post-hoc, có điều kiện, qua
scout-notes.md (đã trace thật trong buổi thảo luận này). Không đánh đồng
"dùng native" với "quan sát được" — 2 lợi ích tách biệt, chỉ trùng nhau
khi launcher vốn đã tương tác.

#### Việc chưa quyết, để lại cho item build lớp quyết định thật (Đã hoàn tất qua `dispatch.mjs decide` & Pha 1-4; Pha 5 hoãn)

- Tín hiệu phát hiện "launcher hiện tại có phải soul sống cùng provider không": Caller tự khai báo qua cờ `--has-live-task-access` khi gọi `dispatch.mjs decide` (Pha 3/4). Pha 5 mở rộng sang `agy` hoãn lại (YAGNI).
- Cơ chế tường minh áp CÙNG 1 quyết định dispatch cho cả subTask lẫn capacity trong code thật: `dispatch.mjs decide` đã hợp nhất qua 1 entry point duy nhất (Pha 4, `tsk-3ik`).
- Địa điểm đặt lớp quyết định native-vs-cli/spawn: Nằm ở helper `decideDispatchMechanism` / `decideExecutorDispatchMechanism` (`src/runner/dispatch/mechanism.mjs`), được gọi bởi `dispatch.mjs decide`.

#### Kế hoạch triển khai (5 pha, đã file thành work item, deps thật)

| Pha | Item | Phụ thuộc | Song song được với | Trạng thái |
|---|---|---|---|---|
| 1 | `tsk-1ni` — fix `repoRoot` (state-root/content-root lẫn nhau) + verify-overwrite | không | Pha 3 (`tsk-53h`, khác file) | Done |
| 2 | `tsk-27y` — protocol caller tự khai verdict cho `fgos discover`/`fgos plan` | không (chỉ overlap footprint với Pha 1, không phải dep logic) | Pha 3 (`tsk-53h`, khác file) | Done |
| 3 | `tsk-53h` — shared helper phát hiện native-vs-cli/spawn cho skill-facing capacity | `tsk-3sw` (đã done) | Pha 1, Pha 2 (khác file, không overlap) | Done |
| 4 | `tsk-3ik` — hợp nhất `capabilities.<id>` config dispatch với lời gọi Task tool trực tiếp | `tsk-27y` + `tsk-53h` | không (chờ cả 2 xong) | Done |
| 5 | `tsk-6db` — mở rộng native detection sang `agy` (deferred, YAGNI, chưa consumer thật) | `tsk-53h` | Pha 2, Pha 4 (concern khác nhau) | Hoãn / Deferred (YAGNI) |

#### Tham chiếu

- `tsk-3sw` — `docs/history/agent-executor-capacity-kind-task-resolution/CONTEXT.md`
- `tsk-53h` — `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md`
- `tsk-1ni` — gap `readLockedContext`/verify-overwrite, bằng chứng sống
  cho lớp quyết định còn thiếu
- `tsk-27y`, `tsk-3ik`, `tsk-6db` — Pha 2/4/5 của kế hoạch triển khai trên
- `docs/explanation/agent-executor-capacity-aware-dispatch.md`

### 0028 — Đổi tên pinned term `orchestrator` thành `launcher`

#### Bối cảnh

`0026` đặt tên **orchestrator** cho vai trò: tiến trình/cơ chế QUYẾT ĐỊNH
kích hoạt 1 rootTask, đứng nó lên, rồi bước ra hoàn toàn — logic chọn "item
nào tiếp theo" giữ THUẦN CƠ HỌC, không cần soul; soul chỉ vào cuộc SAU KHI
vai trò này đã quyết định kích hoạt rootTask nào (`0026`'s chính văn: "Vai
trò orchestrator KHÔNG CẦN soul").

Tên này sai nghĩa ngành: "orchestrator" trong ngành (Airflow, Temporal,
Kubernetes) chỉ định 1 tiến trình điều phối NHIỀU đơn vị theo thời gian,
duy trì liên hệ liên tục trong lúc chạy (dependency graph, retry, giám sát,
fan-in). Vai trò `0026` mô tả làm NGƯỢC LẠI: chọn đúng 1 item bằng logic cơ
học, đứng nó lên, rồi bước ra hoàn toàn — không điều phối gì thêm sau đó.
Gọi vai trò này là "orchestrator" là hứa quá: người đọc đi tìm logic điều
phối vốn không tồn tại trong vai trò này.

Người dùng chốt tên thay thế là **launcher** (2026-08-08), sau khi so sánh
4 ứng viên: launcher/invoker/activator/commander.

#### Quyết định

Đổi pinned term `orchestrator` → `launcher` xuyên suốt prose fgOS tự sở
hữu (decision doc, `docs/history/*`, `docs/how-to/*`, comment trong
`src/runner/*.mjs`, và mọi chỗ khác dùng từ này theo đúng nghĩa vai trò
`0026` mô tả — kiểm từng chỗ, không đổi hàng loạt mù). KHÔNG đổi:
`herdr-plugin/src/**/*.rs`'s `PaneOrchestrator` (khái niệm Rust khác hẳn —
trait mở/focus terminal pane, dùng từ đúng, giữ nguyên), `docs/distillery/**`
(trích dẫn verbatim từ nguồn upstream), `plans/reports/**` (bản ghi lịch
sử, không sửa ngược).

Record này chỉ supersede TÊN GỌI của `0026`, không phải thiết kế/logic của
vai trò đó — 4 quy tắc chọn cơ chế dispatch, khái niệm rootTask/subTask/
capacity, và kế hoạch triển khai 5 pha trong `0026` giữ nguyên, chỉ đổi
nhãn "orchestrator" thành "launcher" mọi nơi nó xuất hiện.

Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác, CHƯA
gán nghĩa trong record này — ứng viên đã bàn (chưa chốt): tầng điều phối
N đơn vị chạy đồng thời + hợp nhất kết quả (`fgos-fanout`,
`fgos-runner --watch`). Một item sau này claim nghĩa mới cho từ này, nếu
cần.

#### Hệ quả

- `0026` không sửa tại chỗ — vẫn đúng nguyên văn lịch sử của phần thiết kế
  (4 quy tắc dispatch, rootTask/subTask/capacity, kế hoạch 5 pha), chỉ đổi
  từ "orchestrator" thành "launcher" trong chính văn của nó (đây là phần
  ĐANG được rename, không phải phần bị đóng băng — khác với trường hợp
  `0006`/`0024` nơi `0006` giữ nguyên 100% chữ nghĩa cũ). `0026` nhận thêm
  `superseded_by: 0028` trong frontmatter, đúng khuôn STR72 trỏ-ngược-bắt-buộc.
- 6 skill (`.claude/skills/` + mirror `.agents/skills/`, 12 file) đang trỏ
  tới `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md` bằng đường dẫn — **filename của `0026` không đổi**, nên 12
  file này không cần sửa gì (đường dẫn vẫn đúng, chỉ nội dung 0026 trỏ tới
  đã đổi từ vựng bên trong).
- Test guard (`test/docs/launcher-vocabulary-guard.test.mjs`) chống tái
  phạm: fail khi "orchestrator" xuất hiện trong prose fgOS tự sở hữu ngoài
  allowlist trên.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

### 0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị

#### Bối cảnh

Phiên `tsk-5td` (`fgos-coding-shaping`, `docs/history/dispatch-concept-
boundary/DISCUSSION.md`) khoá lại ranh giới khái niệm tầng dispatch sau khi
gom bài học gather-work vs execution-work của bee, và chốt ba quyết định
cùng chạm đúng **một** mục định nghĩa của `0026` — mục "Đơn vị
vận hành (vocabulary, chốt dùng xuyên suốt từ đây)". Tiền lệ: `0028` đã
supersede `0026` một lần cho việc đổi tên `orchestrator`→`launcher`. Vì cả
ba quyết định lần này cũng sửa đúng mục đó, gộp chung **một** record thay vì
ba.

#### Quyết định

##### — bỏ `rootTask`/`subTask` khỏi từ vựng dispatch

`0026` viết: *"**rootTask** — công việc gốc đang làm... **Vai trò này** có
tính ĐỆ QUY/fractal"* và *"**subTask** — KHÔNG phải 1 phạm trù riêng, ĐÚNG
bản chất chỉ là 1 **rootTask** khác... 'subTask' chỉ là tên gọi **tương
đối**, nhìn từ góc của bên kích hoạt"*.

Sửa: bỏ cả hai chữ khỏi từ vựng dispatch. `0026` tự khai `rootTask` là một
**vai trò**, không phải một lớp phân loại — một item nằm backlog là `work`;
một launcher đứng nó lên thì cùng dòng, cùng id, state không đổi một byte mà
chỉ đổi tên gọi. Thay `rootTask` bằng **`work`** (T2, `tsk-*`) mang **vai
trò** T1 khi được kích hoạt. `subTask` đội hai nghĩa khác tập, tách theo
đúng nghĩa: (a) work con sinh ra bởi decompose — đã có tên và đã có field
lưu (`work.parent`, `0012`'s cạnh parent-child) → gọi là **child work**; (b)
target của một lần dispatch đệ quy, thoáng qua, không lưu — chỉ là một
`work`/exec-packet khác, không cần tên riêng.

##### — `capacity` = một năng lực có tên (behavior-promise / functional-helper)

`0026` viết: *"**capacity** — KHÁC bản chất với subTask: là 1 đơn vị
functional/helper hẹp (judge-discovery, submit-assist-classify) — không tự
mang vòng đời 1 rootTask đầy đủ"*.

Sửa: bản chất **giữ nguyên** — vẫn là đơn vị functional/helper hẹp — nhưng
nâng thành cặp **behavior-promise / functional-helper**: behavior-promise
trả lời nó **hứa** gì (`digest` hay `verdict`), functional-helper trả lời nó
**là** gì (hẹp, không authority, phục vụ mục tiêu người khác). Một mình
functional-helper thì hụt hợp đồng — lý do `0026` từng trôi sang tiêu chí
cấu trúc "không tự mang vòng đời rootTask đầy đủ"; một mình behavior-promise
thì không phân biệt được với tool (tool cũng hứa hành vi). **Tiêu chí phân
định** đổi từ cấu trúc ("không mang vòng đời rootTask đầy đủ") sang
**authority + state effects**. `capacities.<id>` (config) là **bản khai**
của một capacity, không phải bản thân capacity đó — cùng quan hệ giữa
`gitnexus` và dòng registry mô tả nó.

##### — T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0

`0026` chưa từng liệt kê rõ T1 có bao nhiêu giá trị — chỉ định nghĩa
`launcher`. `0028` chỉ đổi TÊN vai trò đó (`orchestrator`→`launcher`), chưa
từng đụng tới SỐ giá trị; `tsk-2cw` (đã `cleanup`) tự ghi mục đích thứ hai
trong tiêu đề của nó — *"giải phóng từ orchestrator để dành cho MỤC ĐÍCH
KHÁC"* — rồi để trống, không nói mục đích đó là gì.

Sửa: điền vào đúng chỗ trống đó. `0028` đã lập luận sẵn hai tính chất **độc
lập** của vai trò bên gọi: **arity** (1 đơn vị hay N đơn vị) và
**engagement** (bước ra hẳn — "buông" — hay giữ liên hệ liên tục — "ở
lại"). Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
(N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
hợp thành T0**: N lần dấn thân con (mỗi lần là một `driver`) rồi hợp nhất
kết quả (bằng chứng sống: `fgos-fanout` spawn N Agent, mỗi Agent chạy
`/fgOS:pick` end-to-end — mỗi cái là một `driver`, tổng thể là T0); (N,
buông) = trống **có lý do** — buông N đơn vị cùng lúc thì không còn ai hợp
nhất kết quả, đó chỉ là `launcher` chạy N lần, không phải một vai trò mới.
⇒ **T1 chỉ có hai giá trị.**

#### Hệ quả

- `0026` **không sửa tại chỗ nội dung** — chỉ frontmatter thay đổi: dòng
  `superseded_by: 0028` thành `superseded_by: [0028, 0029]`. `0028` và
  `0029` supersede hai phần **không chồng lấn** của `0026` (`0028` = tên gọi
  "orchestrator"→"launcher"; `0029` = ba mệnh đề định nghĩa
  `rootTask`/`subTask`/`capacity`/T1 ở trên), nên cả hai đều cần được trích
  từ record cũ — một `superseded_by` dạng danh sách, không phải ghi đè.
- `docs/decisions/0000-index.md`'s dòng của `0026` nhận thêm ghi chú trỏ tới
  `0029` bên cạnh ghi chú `0028` đã có sẵn.
- Không sửa code trong record này. `rg -n "rootTask|subTask" src/ bin/` vẫn
  còn 2 hit ở `src/runner/dispatch.mjs:649,654` — prose trong docstring mô
  tả cơ chế dispatch còn sống, không phải định danh, và nằm ngoài phạm vi
  record này; dọn lại prose đó (nếu cần) là việc của một item khác.
- Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích thứ hai của
  "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp thành T0.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

#### Tham chiếu

- `tsk-5td` —, (`fgos show tsk-5td`; `tsk-5td` còn `status:
  doing` trên nhánh riêng `fgw/tsk-5td` tại thời điểm record này được viết,
  nên các quyết định trên chỉ đọc được qua `.fgos` event log dùng chung,
  không qua file `CONTEXT.md` trên nhánh đó)
- `docs/history/dispatch-concept-boundary/DISCUSSION.md` §6.3 (T2 · CẦU),
  §6.4 (T3 · NĂNG LỰC CÓ TÊN — `capacity`), §6.7 (T0 và T1 — vai trò bên
  gọi), §7.1 (Decision doc supersede `0026`)
- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0012` — cạnh parent-child (`work.parent`), nền cho "child work"

### 0030 — Thêm bậc ưu tiên #2 "Release con người" vào thứ tự ưu tiên sản phẩm

#### Bối cảnh

`0025` chốt 3 bậc ưu tiên sản phẩm (Ship Faster > DoD > Polish Sau DoD),
nạp always-loaded qua `AGENTS.md`. Trong lúc điều tra `tsk-4b2` (2 stage
`discovery`/`exploring` không thể tới được về mặt cấu trúc), phiên làm
việc liên tục đề xuất gộp các bước nhỏ lại cho gọn (vd gộp bước phân loại
`tier`/`kind`/`risk` vào stage `discovery`) — user chặn lại, chỉ ra một
bậc ưu tiên đã phát biểu nhiều lần từ những phiên làm việc đầu tiên
("từ những ngày đầu", đặc biệt xuyên suốt 3 ngày cuối tuần thảo luận
khái niệm launcher/dispatch/capacity dẫn tới `0026`/`0028`/
`0029`) nhưng chưa từng được ghi thành quyết định sản phẩm đứng riêng —
khiến câu hỏi "có nên gộp không" cứ lặp lại ở nhiều phiên khác nhau.

User chốt lại nguyên văn (2026-08-10):

> "số 1 của chúng ta là Ship Faster, cần phải thêm số 2 là `Release con
> người`. Giải phóng con người khỏi việc ngồi canh và chờ trả lời. Hệ
> thống tự phán đoán tự vận hành ở mức cao nhất có thể và khi thật sự cần
> người sẽ hỏi người, và vì thế nó sẽ thiết kế để collect thành bộ để hỏi
> nhằm mỗi lần con người quay lại là có thể trả lời nhiều nhất những câu
> hỏi và đi, sau đó sẽ quay lại chứ không cần ngồi canh. Vì thế mà hệ
> thống cần có cách hoạt động và tích lũy câu hỏi: chuyện gì làm được thì
> làm, không rõ thì bỏ qua làm mảnh việc khác, tích lũy đủ nhiều câu hỏi
> đợi con người quay lại — chứ không phải câu đó stuck và có những việc
> khác của cùng item có thể giải quyết được trước thì lại không giải
> quyết mà ngồi chờ câu trả lời. Vì vậy cần chia nhỏ tiến trình,
> process/stages/skills thật nhỏ và mịn."
> — real conversation, phiên `tsk-4b2`, 2026-08-10

#### Quyết định

Thứ tự ưu tiên sản phẩm, mở rộng từ 3 lên **4 bậc cố định** — bậc dưới
không được ghi đè bậc trên:

1. **Ship Faster** — giao nhanh hơn, không đoán mò, giảm
   friction/better-dev-ux, ít chờ đợi. (nguyên văn `0025`, không đổi)
2. **Release con người** — giải phóng con người khỏi việc ngồi canh chờ
   trả lời. Hệ thống tự phán đoán, tự vận hành ở mức cao nhất có thể; chỉ
   hỏi người khi thật sự cần, và khi hỏi thì **collect thành bộ** — để mỗi
   lần con người quay lại có thể trả lời nhiều nhất số câu hỏi đang treo
   rồi đi tiếp, không phải ngồi canh từng câu một. Hệ quả kỹ thuật bắt
   buộc: một câu hỏi treo **không được** làm nghẽn toàn bộ item khi còn
   phần việc khác của CÙNG item có thể tiến tới mà không cần câu trả lời
   đó — process/stage/skill vì vậy phải chia **nhỏ và mịn**, mỗi mảnh tiến
   hoặc park độc lập, thay vì gộp thành đơn vị to, thô.
3. **DoD** — reproducibly verifiable result + evidence-linked
   documentation. (nguyên văn `0025`, không đổi, lùi từ bậc 2 xuống bậc 3)
4. **Polish Sau DoD** — hoàn thiện sau ngưỡng, không mở scope. (nguyên văn
   `0025`, không đổi, lùi từ bậc 3 xuống bậc 4)

Placement test giữ nguyên như `0025` đã áp (họ hàng luật L8,
`docs/platform-foundations.md`): thứ tự ưu tiên áp dụng MỌI lúc, không
riêng 1 workflow → phải nằm standing sheet (`AGENTS.md`, always-loaded),
không phải chỉ nằm `docs/decisions/`.

#### Hệ quả

- `0025` không sửa tại chỗ, chỉ nhận `superseded_by: 0030` (đúng khuôn
  STR72 trỏ-ngược-bắt-buộc, cùng cách `0023` → `0025` đã làm).
- `AGENTS.md`'s pointer 4 dòng cập nhật theo thứ tự mới, trỏ `docs/decisions/0030`.
- Bậc 2 mới này là căn cứ trực tiếp để `tsk-4b2` (wiring `discovery`/
  `exploring`) thiết kế theo hướng stage/skill chia nhỏ, mỗi mảnh
  park/tiến độc lập — không gộp bước phân loại `tier`/`kind`/`risk` vào
  `discovery` dù gộp có vẻ gọn hơn (YAGNI/DRY thuần code không áp được ở
  đây — bậc 2 này ghi đè trực tiếp bản năng "gộp cho gọn" khi thiết kế
  stage/skill của fgOS).
- Chưa làm ở record này (treo lại, không phải phạm vi hiện tại): một check
  tự động xác nhận `AGENTS.md` còn giữ đúng 4 mục theo thời gian (L8 rule
  3, cùng khoảng trống `0025` đã treo cho bậc cũ).

### 0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới

#### Bối cảnh

`0028` đổi tên pinned term `orchestrator` → `launcher` cho vai trò `0026` mô
tả (chọn 1 item, đứng nó lên, bước ra hẳn), vì tên cũ sai nghĩa ngành. Cùng
record đó ghi rõ từ vừa giải phóng:

> Từ "orchestrator" sau khi giải phóng được ĐỂ DÀNH cho mục đích khác,
> **CHƯA gán nghĩa trong record này** — ứng viên đã bàn (chưa chốt): tầng
> điều phối N đơn vị chạy đồng thời + hợp nhất kết quả.

Và dựng một anti-recidivism guard (`test/docs/launcher-vocabulary-guard.
test.mjs`) fail khi từ đó xuất hiện trong prose fgOS tự sở hữu ngoài
allowlist. Guard đó đúng **trong đúng cửa sổ thời gian ấy**: từ chưa có
nghĩa mới, nên mọi lần nó tái xuất đều là tái phạm nghĩa cũ.

Cửa sổ ấy đã đóng. `0029` điền vào đúng chỗ trống `0028` để lại:

> Xếp thành lưới 2×2: (1, buông) = `launcher`; (1, ở lại) = `driver`;
> (N, ở lại) = **`orchestrator`** — không phải ô thứ ba của T1 mà là **tầng
> hợp thành T0** [...] Điền vào đúng chỗ trống `tsk-2cw` để lại — mục đích
> thứ hai của "orchestrator" sau khi giải phóng tên gọi chính là tầng hợp
> thành T0.

Từ thời điểm `0029` được chấp nhận, `orchestrator` là **từ vựng fgOS hợp lệ,
đã được định nghĩa chính thức**, chỉ tầng hợp thành T0 (N đơn vị, ở lại) —
đúng thứ `/fgOS:retro-loop`, `/fgOS:merge-loop`, `/fgOS:discover-loop`,
`/fgOS:cleanup-loop` và `fgos-fanout` đang làm. Guard của `0028` vẫn chặn nó,
nên nó đang cấm fgOS dùng chính từ vựng fgOS vừa chốt.

#### Quyết định

Bỏ hẳn guard cấm từ `orchestrator`: xoá
`test/docs/launcher-vocabulary-guard.test.mjs` và toàn bộ cơ chế allowlist
đi kèm.

Ba lý do, theo thứ tự sức nặng:

1. **Guard mâu thuẫn với `0029`.** Nó chặn một từ mà một decision record
   sau nó đã định nghĩa chính thức. Giữ nguyên nghĩa là để một record cũ
   phủ quyết một record mới hơn — ngược hẳn khuôn supersede của repo này.

2. **Guard là `grep` mức-từ, không phân biệt được nghĩa.** Giá trị còn lại
   duy nhất của nó là bắt người dùng `orchestrator` theo nghĩa CŨ (vai
   1-item). Một phép so khớp chuỗi không làm nổi việc đó: nó chặn nghĩa mới
   hợp lệ y hệt cách nó chặn nghĩa cũ sai. Không có cách thu hẹp nào giữ
   được phần giá trị thật.

3. **Chi phí bảo trì đã vượt giá trị, có bằng chứng đếm được.**
   `ALLOWED_FILES_ENTRIES` đã phình lên 28 entry, mỗi entry một lý do
   hand-written riêng, cộng 3 cơ chế miễn trừ theo pattern
   (`FROZEN_FILENAMES`, `FROZEN_PHRASES`, `IRON_LAW_EVIDENCE_META_CITATION`).
   Ít nhất bốn item đã sinh ra **chỉ để vá allowlist này** (`tsk-2au`,
   `tsk-2lg`, `tsk-2uo`, `tsk-4cx`). Chính `docs/decisions/0000-index.md`
   phải viết vòng vo *"tên gọi ban đầu của `0026`"* ở hai dòng thay vì gọi
   thẳng tên — guard đang bóp méo văn của chính fgOS.

Record này chỉ supersede **mệnh đề guard** trong "Hệ quả" của `0028`. Phần
chính của `0028` — việc đổi tên vai trò `0026` từ `orchestrator` thành
`launcher` — **giữ nguyên hiệu lực**: `launcher` vẫn là tên đúng cho vai (1
đơn vị, buông), và không chỗ nào được quay về dùng `orchestrator` cho nghĩa
đó. Cùng khuôn supersede-từng-phần mà `0028` và `0029` đã dùng với `0026`
(hai phần không chồng lấn).

#### Từ vựng sau record này

Lưới 2×2 của `0029` là từ vựng hiện hành, dùng thẳng, không cần né:

| | buông (bước ra hẳn) | ở lại (giữ liên hệ) |
|---|---|---|
| **1 đơn vị** | `launcher` | `driver` |
| **N đơn vị** | trống có lý do | `orchestrator` (tầng hợp thành T0) |

#### Hệ quả

- Xoá `test/docs/launcher-vocabulary-guard.test.mjs`.
- Xoá entry của file đó khỏi `scripts/check-decision-codes.baseline.json`
  (baseline chỉ chặn phát hiện MỚI, nên entry cũ vô hại — bỏ đi để không
  còn dữ liệu chết trỏ tới một file không tồn tại).
- Xoá `docs/how-to/allowlist-a-historical-mention-in-launcher-vocabulary-
  guard.md` và dòng của nó trong `docs/enduser-docs-index.json`: how-to đó
  hướng dẫn dùng một cơ chế không còn tồn tại.
- `0028` nhận `superseded_by: [0031]` trong frontmatter, đúng khuôn STR72
  trỏ-ngược-bắt-buộc; `docs/decisions/0000-index.md` nhận dòng của `0031`
  và ghi chú trên dòng `0028`.
- Không đụng: `herdr-plugin/src/**/*.rs`'s `PaneOrchestrator` (khái niệm
  Rust khác hẳn), `docs/distillery/**` (trích verbatim upstream),
  `plans/reports/**` (bản ghi lịch sử). Ba nhóm này vốn đã nằm ngoài phạm
  vi guard và không đổi gì.
- Không sửa ngược prose cũ. Những chỗ đang né từ (ví dụ hai dòng vòng vo
  trong `0000-index.md`) được phép viết thẳng lại khi có item chạm vào
  chúng — không phải việc của record này.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

#### Tham chiếu

- `0026` — `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
- `0028` — `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`
- `0029` — `docs/decisions/0029-sua-dinh-nghia-roottask-subtask-capacity-t1-cua-0026.md`

### 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người

#### Bối cảnh

Cổng Iron Law (`classifyIronLaw`, `src/evolve/iron-law.mjs`) hỏi một câu
đáng hỏi: diff đang chờ merge này có NĂNG LỰC làm yếu chính kỷ luật
gate/verify của hệ không? Câu hỏi giữ nguyên giá trị. Cách nó hỏi thì
không.

` self-improve-loop` — hai quyết định nội tuyến, chỉ tồn tại dưới
dạng trích dẫn trong `docs/specs/runner.md` và trong `view.decisions` của
nhật ký sự kiện, không phải một record đánh số dưới `docs/decisions/` —
khoá cổng ở đúng một hình dạng: chạy trên MỌI đề xuất nguồn `runner`, và
`required: true` mà thiếu `--acknowledge-iron-law` thì **từ chối cứng,
không có mức nào khác**. Ba hệ quả đo được, ghi trong
`docs/history/iron-law-gate-human-ux/DISCUSSION.md`:

1. **Hỏi ở chỗ không có gì để mất.** Một leaf merge vào `fgw/<root>` không
   đụng tới trunk, nhưng vẫn phải trả lời câu hỏi "diff này có thể làm yếu
   gate không" y như một root land thẳng lên main. Cùng một diff bị hỏi
   nhiều lần trên đường đi lên, và lần hỏi cuối — lần duy nhất thật sự
   chặn được gì — chìm giữa những lần hỏi vô hại.
2. **Không có nấc nào giữa "chặn cứng" và "gỡ hẳn".** Một người muốn xem
   cổng bắt gì mà chưa muốn nó chặn thì không có lựa chọn nào ngoài việc
   không dùng.
3. **Câu hỏi treo nghẽn cả hàng.** `merge-loop` gặp một item bị Iron Law
   giữ thì dừng cả vòng, dù những item còn lại phía sau không liên quan gì
   — ngược thẳng bậc ưu tiên #2 "Release con người" (`0030`): một câu hỏi
   treo không được nghẽn phần việc khác còn tiến được.

Iron Law **không** nằm trong `docs/platform-foundations.md` (đã kiểm bằng
grep, không khớp) — nên đây là sửa spec, không phải đổi một luật khoá.

#### Quyết định

Record này supersede **đúng mệnh đề "chặn cứng, luôn luôn, ở mọi ranh
giới merge"** của ` self-improve-loop`. Bốn thay đổi, tất cả đã có
thật trong code trước khi record này được viết:

1. **Cổng chỉ chạy ở ranh giới trunk** (`CONTEXT.md`). Leaf → `fgw/<root>`
   và `sync-root` vào nhánh cha đi thẳng, không hỏi. Discriminator **khác
   nhau theo từng call site**, cố ý không gộp thành helper chung
   (`plan.md` A1b): `approve` và pre-check của `merge next` dùng
   `resolveRoot(view, id) === id`; `sync-root` dùng `!item.parent`, vì nó
   chỉ land vào cha TRỰC TIẾP nên `resolveRoot` — vốn leo tới đỉnh lineage
   — sẽ trả lời sai cho một gốc có cha mà cha lại có ông.
2. **Hai mức, key config riêng** (`CONTEXT.md`). `ironLaw.level`:
 `ask` (mặc định) giữ nguyên hành vi từ chối cứng; `warn`
   (opt-in) in cảnh báo, ghi một bản ghi, rồi merge tiếp. Key **riêng**,
   không nhét vào `gateBypass` — floor của `gateBypass` được ghi trong
   `docs/explanation/gate-bypass-design.md` là không bao giờ chạm Iron Law,
   tái dùng từ vựng level của nó sẽ xoá đúng ranh giới ấy. Mọi giá trị
   không phải đúng chữ `warn` — thiếu key, file hỏng, gõ sai — đều đọc
   thành `ask`; mức dễ dãi là mức để một diff tự-sửa land mà không ai xem,
   nên nó không bao giờ được là mặc định của một lỗi.
3. **Người quyết định, agent thao tác** (`CONTEXT.md`). Người trả
   lời duyệt trong chat là đủ; agent tự chạy `fgos approve <id>
   --acknowledge-iron-law`, tự đọc exit code, tự sửa lỗi cơ học và tự
   retry — không đẩy một dòng lệnh cho người gõ tay. Cái được giữ nguyên
   là điều `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
   bảo vệ: **một bên thứ hai độc lập thật sự nhìn vào bằng chứng**. Agent
   trình `docs/history/<id>/iron-law-evidence.md` nguyên văn rồi hỏi; nó
   không bao giờ tự thêm `--acknowledge-iron-law` trên thẩm quyền của
   chính nó. Đổi là đổi ai gõ, không đổi ai quyết.
4. **Item bị giữ không nghẽn item khác** (`CONTEXT.md`). `merge-loop`
   đọc tín hiệu `skipped` / `every ready item is blocked` mà engine vốn đã
   trả sẵn, ghi id vào một danh sách rồi **đi tiếp**, cuối vòng trình gom
   một lượt kèm bằng chứng. Item ở nguyên `awaiting-approval` — không
   `fgos ask`, không `awaiting-human`, không cạnh FSM mới.

Đã cân nhắc và loại, ghi lại để không phải cãi lại:

- **Field bypass trên workitem** — loại: biến một quyết định vận hành
  thành một thuộc tính dữ liệu đi theo item mãi mãi.
- **Thêm cạnh FSM `awaiting-approval → awaiting-human` cho ** — loại:
  `src/state/status-fsm.mjs` nằm trong `MODULE_RULES` của chính Iron Law,
  nên bản vá sẽ trip đúng cái cổng nó đi sửa; và engine đã có sẵn
  `skipped`.
- **Nới nửa từ-khoá của `classifyIronLaw`** — ra khỏi phạm vi, chuyển
  sang `tsk-1js`. Chữ ký và hành vi `classifyIronLaw` giữ nguyên byte-for-byte.

#### Vì sao `supersedes:` trống

` self-improve-loop` không phải record đánh số — chúng là quyết
định nội tuyến, trích dẫn trong `docs/specs/runner.md` (RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai), RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó),
Data Dictionary #10) và sống trong `view.decisions`. Không có file nào để
gắn `superseded_by:` trỏ ngược, nên khuôn trỏ-ngược-bắt-buộc STR72
(`scripts/check-decision-supersession.mjs`) không áp dụng được và
`supersedes:` để trống có chủ đích, thay vì bịa một id không tồn tại.
Việc supersede được ghi bằng văn, ở đây và tại chính RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó).

#### Hệ quả

- `docs/specs/runner.md`: RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai) nói rõ phán quyết chỉ được TÍNH ở ranh giới
  trunk và hệ quả của `required: true` do `ironLaw.level` quyết định;
  RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó) viết lại theo bốn điểm trên; RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) mới cho chính key
  `ironLaw.level` (mặc định, fail-closed, đăng ký vào `fgos doctor`).
- `.fgos/config.json` nhận `ironLaw.level` qua `fgos setup`/`fgos doctor
  --fix`; thiếu key thì `doctor` báo, gate vẫn chạy ở `ask`.
- `plugins/fgOS/skills/approve/SKILL.md` là bề mặt người dùng chạm vào cho
  điểm 3; `merge-loop`/`merge-next` cho điểm 4.
- Không đụng `src/evolve/iron-law.mjs` — phép phân loại không đổi, chỉ đổi
  chỗ nó được gọi và chuyện gì xảy ra sau đó.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.

#### Tham chiếu

- `docs/history/iron-law-gate-human-ux/CONTEXT.md` — - đã khoá
- `docs/history/iron-law-gate-human-ux/plan.md` — A1/A1b, bản đồ rủi ro
- `docs/history/tsk-5t3-iron-law-evidence-contract/` — hợp đồng
  `docs/history/<id>/iron-law-evidence.md`
- `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
- `docs/explanation/gate-bypass-design.md`
- `0030` — `docs/decisions/0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md`

### 0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2

#### Quyết định

Một capacity `kind:agent` **cli-spawn-shaped** — declares `command`/
`adapter` của riêng nó, hoặc một entry `invocations[].via === "cli"` —
LUÔN dispatch out-of-process khi đã được cấu hình cho job đó, bất kể
caller có `hasLiveTaskAccess:true` hay không. `0026` rule 2 (ưu tiên
native khi caller cùng provider và có Task tool sống) vẫn đúng nguyên vẹn
cho capacity **agentType-shaped** (chỉ có `agentType`, không `command`
riêng — ví dụ `judge-discovery`) — quyết định này KHÔNG đảo `0026`, chỉ
thu hẹp phạm vi rule 2 xuống đúng nửa case còn hợp lý.

#### Người quyết

Người dùng, trực tiếp, trong phiên làm việc 2026-08-16 (sau khi test
sống capacity `fgos-coding-implement` → `agy`, thấy một session sống vẫn
resolve `in-process` — tức KHÔNG bao giờ thật sự gọi `agy` — dù capacity
đã cấu hình rõ ràng). Nguyên văn ý định: "một soul sống sẽ chọn soul khác
phù hợp để làm việc thay nó" — tức cấu hình phải thắng, không phải mặc
định "tự làm" chỉ vì có Task tool.

#### Lý do 0026 rule 2 không áp dụng ở đây

Rule 2 tự nêu lý do của chính nó (trích 0026): *"tránh lãng phí/sai lệch
khi soul mù re-derive 1 phán đoán soul sống đã làm rồi"* — bug thật
`tsk-1ni` (`judgeDiscovery` cli-spawn một judge mù dù caller đã tự đọc
CONTEXT.md xong). Lý do này đúng khi target là MỘT PHIÊN BẢN KHÁC CỦA
CHÍNH CALLER (native subagent, cùng provider, không có command riêng) —
không đúng khi target là một BACKEND THẬT SỰ KHÁC đã được người vận hành
đặt tên rõ ràng (`command: "agy"`). "In-process" trong case cli-spawn-
shaped không phải "dùng native thay vì spawn mù" — nó là "âm thầm bỏ qua
hoàn toàn config, tự làm thay". Đó không phải tối ưu hoá native-first,
đó là bỏ qua một quyết định cấu hình.

#### Cơ chế phân biệt (không phải heuristic mới)

`resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã sẵn có đúng phép
thử này cho `resolvedViaAgentType`/`cliInvocation` — 2 hình dạng loại
trừ lẫn nhau. `decideCapacityDispatchMechanism` giờ dùng lại đúng phép
thử đó trước khi hỏi `hasLiveTaskAccess`:

```js
const isCliSpawnShaped = Boolean(
  capacity && (capacity.command || capacity.adapter ||
    (Array.isArray(capacity.invocations) && capacity.invocations.some((inv) => inv.via === 'cli'))),
);
if (isCliSpawnShaped) return 'out-of-process';
// agentType-shaped, kind:'tool', hoặc chưa cấu hình -- giữ nguyên logic cũ
```

#### Bằng chứng đã kiểm

- `tsk-1m8` (item trước, 2026-08-16): live-proved cơ chế cli-spawn ra
  `agy` hoạt động thật (real spawn, real output) khi capacity được cấu
  hình — nhưng chỉ test qua `hasLiveTaskAccess:false` (headless). Session
  sống thật sự hỏi `decide --work` với `hasLiveTaskAccess:true` vẫn nhận
  `in-process` — đây chính là gap `0033` sửa.
- Quét toàn bộ 28 chỗ `hasLiveTaskAccess: true` trong
  `test/runner/dispatch.test.mjs` (`docs/history/tsk-pdg/RESEARCH.md`):
  không có test nào dùng capacity cli-spawn-shaped + `hasLiveTaskAccess:
  true` mong đợi `in-process` — 0 test hiện có bị gãy, xác nhận thật sau
  khi sửa (`npm test`: 3459 pass / 0 fail).
- Xác nhận sống trên config thật của chính repo này (`.fgos/config.json`,
  capacity `fgos-coding-implement` → `agy`):
  ```
  trước 0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"in-process"}
  sau  0033: decide('fgos-coding-implement', {hasLiveTaskAccess:true}) -> {"mechanism":"out-of-process","configured":true}
  ```

#### Việc chưa quyết, để lại

- Có nên đổi tên/tài liệu hoá rõ hơn khái niệm "cli-spawn-shaped" thành
  một field tường minh trên capacity (thay vì suy ra từ shape) không —
  chưa cần, chưa có case thật đòi hỏi.
- 6 skill (`fgos-coding-exploring`/`fgos-coding-planning`/
  `fgos-coding-validating`/`fgos-coding-implement`/`fgos-fanout`/
  `_shared/capacity-dispatch-fallback.md`) trích "Native-First Dispatch
  Doctrine rule 2" làm lý do không tự dispatch Task tool tuỳ tiện — đã
  đọc lại, không cái nào khẳng định sai sau `0033` (lý do của chúng là
  "đừng tự tạo sub-dispatch tuỳ tiện", không phải "hasLiveTaskAccess luôn
  thắng") — không sửa file nào trong số này.

#### Tham chiếu

- `0026` — quyết định gốc, rule 2 bị thu hẹp
- `docs/history/tsk-pdg/RESEARCH.md`, `plan.md` — bằng chứng đầy đủ
- `docs/history/tsk-1m8/` — item trước, phát hiện gap này khi live-test

### 0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability`

#### Quyết định

`runner.capacities.<id>` (danh mục backend cụ thể có thể thực thi công
việc — vd `agy`, `gitnexus`) đổi tên dứt điểm thành `runner.executors.<id>`
— trên cả field config LẪN mọi identifier code liên quan trong `src/`.
Không giữ back-compat/alias cho tên cũ. `runner.capabilities.<name>` (một
purpose/lời hứa trừu tượng, vd `fgos-coding-implement`) và `runner.executor`
(số ít, cấu hình default toàn cục) giữ nguyên tên, không đổi.

`executor` thắng phương án thay thế `backend` trên hai căn cứ: (1) kỹ
thuật — `resolveExecutorConfig` (`src/runner/dispatch.mjs`) đã giải cả
một backend có tên LẪN default toàn cục thành cùng một shape mà chính code
gọi là `executor` từ trước — đổi tên là hợp nhất một sự thật đã có sẵn
trong code, không phải chọn một từ mới tùy ý; (2) ngữ nghĩa — `capability`
= một lời hứa hành vi (behavior-promise), executor = sự hiện thực hóa lời
hứa đó (gốc động từ "to execute"); `backend` là danh từ tĩnh, không mang
nghĩa hành động này.

#### Chính thức hóa việc tách `capability`/`capacity` mà `0029` để ngỏ

`0029` định nghĩa gốc: `capacity` = "một năng lực có tên (behavior-
promise / functional-helper)" — tức lịch sử "capacity" từng gộp CẢ lời
hứa (behavior-promise) LẪN đơn vị hiện thực (functional-helper) làm một,
không phân biệt. `tsk-34n` (2026-08-16, trước record này) sau đó TÁCH khái
niệm đó thành hai field riêng — `capability` (lời hứa/purpose) và
`capacity` (backend cụ thể hiện thực nó, qua `for`/`prefer`) — nhưng chưa
bao giờ chính thức sửa lại điều khoản gốc của `0029`. Record này ghi nhận rõ sự
tách đó, thay vì để nó ngầm định: điều khoản gốc's "behavior-promise" nay là
`capabilities.<name>`; điều khoản gốc's "functional-helper" nay là `executors.<id>`
(đổi tên bởi chính record này).

#### Phạm vi đổi tên

- `.fgos/config.json` (live, main checkout): `runner.capacities` →
  `runner.executors`.
- `src/` (7 file), `test/` (8 file), `bin/fgos.mjs`,
  `scripts/dispatch-decide-hook.mjs`, `scripts/project-agents.mjs`,
  `scripts/check-decision-codes.baseline.json`: mọi identifier/field
  liên quan đổi tên đồng bộ (`resolveCapacityAndOverrides` →
  `resolveExecutorAndOverrides`, `capacityId` → `executorId`, `cfg.
  capacities` → `cfg.executors`, v.v.) — xác nhận `npm test` xanh toàn
  bộ sau đổi tên (3477 pass / 0 fail / 5 skip).
- **Không đổi**: `docs/history/*capacity*/` (~14 thư mục lịch sử, nội
  dung ghi lại nguyên trạng dùng thuật ngữ đúng thời điểm được viết —
  đổi tên riêng thư mục sẽ làm nội dung bên trong sai lệch với chính tên
  thư mục nó nằm trong); nội dung của chính `0026`/`0029`/`0033` (giữ
  nguyên chữ "capacity" trong văn bản gốc, không mở lại/supersede).
- **Có đổi**: docs sống (`docs/explanation/`, `docs/how-to/`,
  `docs/reference/`) và fragment skill dùng chung
  `_shared/capacity-dispatch-fallback.md` → `_shared/executor-dispatch-
  fallback.md` (cả nội dung lẫn tên file), vì cả hai mô tả hành vi hệ
  thống HIỆN TẠI, không phải một bản ghi lịch sử.

#### Một collision đã xử lý khi thực thi

`runner.executors` (số nhiều) trùng CHỮ với một field đã bị RÚT hoàn toàn
từ trước (`executors.<tier>`, rung override theo tier, rút tại `tsk-in1-2`,
0 entry sống, chưa bao giờ được validate). Đây là trùng CHỮ, không
trùng Ý — field cũ đã chết hẳn từ trước record này (không xuất hiện ở bất
kỳ config nào trên đĩa), record này tái dùng đúng chuỗi ký tự đó cho một
khái niệm thật, có validate, khác hẳn. Một test cũ (`test/runner/
dispatch.test.mjs`) từng khẳng định field "executors" "never validated,
inert" — đúng cho field CŨ, sai cho field MỚI record này tạo ra; test đã
sửa lại để phản ánh đúng, cùng một dòng comment lịch sử giải thích rõ hai
"executors" khác nhau qua thời gian, tránh nhầm lẫn cho người đọc sau.

#### Tham chiếu

- `0029` — định nghĩa gốc, nay được chính thức hóa việc tách
- `docs/history/capability-capacity-remodel/` — tsk-34n, lần đầu tách
  capability/capacity trên thực tế (code), trước khi record này chốt tên
- `docs/history/capacity-naming-rename/` — DISCUSSION.md/CONTEXT.md/
  plan.md/iron-law-evidence.md của chính tsk-225, toàn bộ scout + bằng
  chứng thật cho quyết định này
