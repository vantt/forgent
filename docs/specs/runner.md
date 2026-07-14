---
area: runner
updated: 2026-07-14
sources: [phase-2-routing, post-divorce-hardening]
decisions: [feed7428, 14396a5c]
coverage: full
---

# Spec: Runner (vòng tự hành)

Vòng lặp tự hành của forgent: tự lấy việc sẵn-sàng từ work-state, giao cho một trợ lý thông minh chạy nền trong không gian cô lập, tự chấm kết quả bằng proof của chính việc đó, rồi ghi lại thành **đề xuất chờ duyệt**. Người dùng: người vận hành repo (khởi động vòng, duyệt đề xuất). Nguyên tắc sống còn: trong vòng dispatch, chỉ runner được ghi trạng thái; worker chỉ để lại commit trên nhánh riêng.

## Entry Points & Triggers

- `fgos-runner --once` → chạy đúng một vòng: gặt-lại → tìm việc → giao việc → chấm → ghi (mặc định Phase 2, tuần tự một việc)
- `fgos-runner --dry-run` → in kế hoạch (việc nào sẽ chạy, model nào) mà không làm gì
- Khởi động MỌI vòng đều bắt đầu bằng bước **gặt-lại** (reap): việc kẹt ở `doing` từ lần chạy đổ trước được giải quyết trước khi tìm việc mới

## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế {prompt}/{model} theo từng phần tử, không bao giờ qua shell) · `models` — bảng tier→model (light/standard/heavy) · `timeoutMs` — trần thời gian một worker | yes | có sẵn bản mặc định |
| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
| 4 | Bộ đếm chống-lặp | visitCount: số lần một việc vào `doing` — dẫn xuất từ nhật ký sự kiện, không trường mới; trần mặc định 3 (provisional) | — | — | — |
| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3 | — | — | — |

## Behaviors & Operations

### Một vòng --once (hạnh phúc)

- **Runs when:** người vận hành gọi; tuần tự đúng một việc.
- **What changes:** việc đầu frontier được claim (`todo→doing` có kỳ vọng); worktree + nhánh `fgw/<id>` mở ra từ đỉnh cây chính; trợ lý chạy nền với prompt dựng từ chính việc đó (mục tiêu / ranh giới worktree / proof kỳ vọng / cấm tự ghi trạng thái), model chọn theo tier của việc; trợ lý tự commit trong worktree; **runner tự chạy lệnh proof của việc trong worktree** — không tin lời trợ lý; đạt → `doing→proposed`; worktree dọn đi, **nhánh ở lại** làm đề xuất.
- **Side effects:** đúng các sự kiện chuyển trạng thái trong nhật ký; output chạy chỉ in console, không bao giờ ghi vào cây committed.
- **Afterwards:** người vận hành thấy việc ở `proposed` + nhánh để review; việc phụ thuộc CHƯA mở (chờ duyệt/merge → `done`); vòng --once thứ hai không giao lại việc nào (frontier trống).

### Gặt-lại lúc khởi động (reap — phục hồi sau crash)

- **Runs when:** đầu MỌI lần chạy.
- **What changes:** việc kẹt ở `doing` (runner lần trước chết giữa chừng) được giải quyết theo nhánh của nó: có commit + proof đạt → hoàn tất `doing→proposed` (idempotent); không → `doing→blocked` kèm lý do gặt-do-crash. Nhánh bị worktree mồ côi giữ được đòi lại (dọn worktree cũ rồi mở lại); nhánh rỗng không commit → tỉa; nhánh có hàng → giữ cho người review.
- **On failure:** lỗi worktree khi gặt → việc đó về `blocked` có lý do, bước gặt KHÔNG BAO GIỜ chết thô — chạy-lại-sau-crash an toàn tự thân (có test giết thật giữa chừng).

### Chấm trượt / lỗi giữa vòng

- **What changes:** tra bảng phục hồi theo lớp lỗi — thử-lại (worktree mới, DÙNG LẠI nhánh cũ đã reset về đỉnh, trong trần attempt) → hết trần thì đỗ-lại (`doing→blocked` kèm lý do); lỗi tranh-chấp-ghi (kỳ vọng lệch vì người vận hành vừa ghi tay) → dọn dẹp rồi DỪNG sạch — không bao giờ giành ghi với người.
- **Side effects:** worktree luôn được dọn trên mọi đường thoát (kể cả dừng); quá trần chống-lặp → việc bị `todo→blocked` lý do chống-lặp, rời hẳn frontier.

## Actors & Access

| Capability | Người vận hành | Runner | Worker (trợ lý nền) |
|---|---|---|---|
| Khởi động vòng / duyệt đề xuất (merge → done) | ✓ | — | — |
| Ghi trạng thái trong vòng dispatch | — (ngoài vòng vẫn ghi tay được) | ✓ duy nhất, qua một cửa | — CẤM (bằng chỉ dẫn) |
| Commit trong worktree/nhánh riêng | — | — | ✓ |
| Sửa cây làm việc chính | ✓ | — | — CẤM (bằng chỉ dẫn + kết quả chỉ là đề xuất) |

## Business Rules

- **R1.** Trong vòng dispatch, runner là người ghi duy nhất qua một cửa; worker không bao giờ tự ghi trạng thái (per D3 phase-2-routing / feed7428).
- **R2.** Kết quả worker là ĐỀ XUẤT mức bền D1: commit trên nhánh `fgw/`, phải qua người duyệt mới thành `done`; không bao giờ tự merge (per D4; auto-merge là backlog P9).
- **R3.** Runner tự chạy proof của việc làm goal-check — lời trợ lý không bao giờ là bằng chứng (per D3).
- **R4.** Tuần tự một việc một lúc; nâng song song chỉ sau khi chống-lặp chứng minh trong vận hành thật (A1 — ngưỡng tên, backlog P6).
- **R5.** Model chọn theo tier của việc qua bảng cấu hình (per D6); tập tier reconcile một nguồn tại đây.
- **R6.** Chống đỡ bằng CHỈ DẪN + nhánh-vứt-được, KHÔNG phải sandbox: worker chạy full quyền user. Bất biến phải giữ: work item (nhất là trường proof — được chạy như lệnh shell) do chính người dùng tạo; không bao giờ nạp việc từ nguồn ngoài khi chưa có vòng kiểm (security panel, ghi trong hợp đồng handoff).
- **R7.** Lớp lỗi lạ → dừng, không bao giờ mặc định thử-lại (fail-safe).
- **R8.** Bước gặt-lại làm chạy-lại-sau-crash an toàn tự thân: không việc nào vô hình, không commit đôi, không worktree rò (reliability panel — 3 blocker vá trước khi code).
- **R9 (thực thi khi dev).** Mọi kiểm chứng chạy trong Claude Code bằng subscription: suite dùng executor giả (0 token), worker thật qua claude CLI login. API key chỉ hợp lệ khi tính năng đang test là executor-cắm-ngoài, và là key của môi trường người dùng (per 774b73ef).
- **R10 (diễn tập không chạm log thật).** Nhật ký sự kiện append-only bất biến → một event diễn tập lọt vào là rác vĩnh viễn: canary/drill LUÔN chạy trên repo mồi dùng-xong-vứt; chỉ dogfood việc-thật mới ghi log thật — và đó là lịch sử vận hành chủ đích (per f3a16887).
- **R11 (thang kiểm chứng).** T0 suite executor-giả mọi commit · T1 dogfood việc thật hằng ngày · T1c canary khai-môi-trường (worker tự báo pwd/git-root/doctrine nó thấy, verify assert từng dòng) định kỳ và sau mỗi đổi harness · T2 máy-trắng (HOME giả + credential tối thiểu) trước release (per f3a16887). Bất biến nền: mỗi agent khởi đầu tại project-root CỦA NÓ — thợ ở xưởng, worker ở git-root của worktree nó đứng.
- **R12 (khoá liên-tiến-trình).** Mỗi kho chỉ một runner sống tại một thời điểm: đầu MỌI lần chạy (trước cả bước gặt-lại — gặt cũng ghi trạng thái), runner chiếm khoá độc quyền trong vùng trạng thái, ghi định danh tiến trình của mình. Kho đang có runner sống → lần chạy mới thoát «bận» bằng mã thoát riêng (không trùng mã nào hiện hành): không ghi trạng thái, không đụng worktree, không đụng khoá của người giữ. Khoá của runner đã chết (crash để lại, hoặc nội dung không chứng minh được chủ sống) → **dọn-rồi-nhường**: kiểm nội dung sát trước khi xoá (đổi rồi thì không đụng), xoá xong lượt đó vẫn lui ra «bận» — không lượt chạy nào vừa xoá khoá vừa tự chiếm trong cùng một lần, nên hai lượt cùng gặp khoá chết không thể cướp khoá mới của nhau; lượt kế tiếp chiếm khoá sạch (sau crash, phục hồi trọn trong hai lượt). Khoá luôn được nhả trên mọi đường thoát.

## Edge Cases Settled

- Runner bị giết giữa việc: lần chạy sau gặt lại đúng trạng thái (proof đạt → proposed, không → blocked), nhánh có ĐÚNG MỘT commit worker — test giết thật.
- Nhánh bị worktree mồ côi giữ (path còn hoặc đã mất) đều đòi lại được — bug thật do e2e bắt sau khi code ship, vá bằng cell fix-first (phase-2-routing-10).
- Đề xuất bị người duyệt trả (`proposed→todo` kèm lý do): việc vào lại frontier, chống-lặp đếm và chặn lặp vô hạn.
- Kho chưa init / frontier trống: vòng kết thúc sạch, không nghi thức.
- Hai lần chạy chồng lấp: lần hai thoát «bận» — 0 ghi trạng thái, 0 thao tác worktree, khoá của lần một còn nguyên vẹn. Khoá mồ côi (chủ đã chết, hoặc nội dung rác) → lượt gặp nó dọn đi rồi vẫn lui ra «bận»; lượt kế tiếp chiếm khoá sạch và chạy bình thường (sau crash: hai lượt là phục hồi xong).
- Cách ly vị trí của worker có by construction: worktree nằm trong thư mục tạm hệ thống — đường walk-up từ cwd của worker không bao giờ gặp xưởng/harness phát triển.

## Open Gaps

(none)

## Visuals

Not applicable — không có màn hình.

## Pointers (implementation)

- `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--config), exit theo phạm trù
- `src/runner/loop.mjs` — vòng + startup reap + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment); `worktree.mjs` — lifecycle + reclaimOrphanedCheckout; `recovery.mjs` — 8 lớp; `anti-loop.mjs` — visitCount/breaker
- `.fgos-runner.json` — config committed (executor template + models light/haiku, standard/sonnet, heavy/opus + timeoutMs)
- `src/state/store.mjs` `readRawEvents` — accessor chỉ-đọc cho anti-loop (decision 14396a5c)
- `docs/routing-handoff-contract.md` — hợp đồng handoff + ranh giới tin cậy
- Test: `test/runner/*` + `test/e2e/runner-loop.test.mjs` (executor giả, repo git tạm; 241 test toàn suite)
