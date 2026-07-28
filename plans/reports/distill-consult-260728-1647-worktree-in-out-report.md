# Consult: Worktree in/out — fork-bootstrap + merge-back liên hoàn

Feature tracked under fgOS backlog `worktree-in-out` (milestone, targets: tsk-53f,
tsk-1an, tsk-3t4, tsk-3w8, tsk-56t, tsk-1os, tsk-424, tsk-3yl). 4 nguồn quét song
song (subagent thay Agent Teams — TeamCreate không dùng được trong background
job): **beads**, **beads-rust**, **repository-harness**, **bee**. Chỉ đọc sealed
index (`docs/distillery/sources/*.md`) — không có upstream clone local, không
descend được vào `Where:` file. Raw report mỗi nguồn:
`plans/reports/distill-consult-worktree-in-out-{beads,beads-rust,repository-harness,bee}-260728.md`.

## Bottom Line

4 nguồn chia làm 2 trường phái đối lập: **beads + beads-rust bỏ hẳn worktree**
(all-on-main + DB transactional/lock discipline) — chứng minh race "fork miss
uncommitted write" biến mất khi KHÔNG có fork, đổi lại mất git-diffable state.
**repository-harness + bee giữ worktree** nhưng đóng 2 lỗ hổng khác nhau:
repository-harness đóng lỗ *bootstrap* (copy db + RUN_CONTRACT.json, nhưng
durable truth luôn là changeset JSONL commit vào git, không phải db copy) và
lỗ *merge-race* (epoch-fence CAS state machine); bee đóng lỗ *merge-dirty*
triệt để nhất — `git merge --no-ff --no-commit` → verify trên cây CHƯA commit →
chỉ commit khi xanh, đỏ thì main byte-untouched + durable marker, KHÔNG BAO GIỜ
tự retry. Không nguồn nào (kể cả 2 nguồn dùng worktree) chứng minh được đóng
100% "write landed on main đúng lúc syscall fork chạy" — đây là lỗ hổng thật
của cả lưới, không riêng fgOS. Điểm quan trọng nhất: bee's merge-gate khớp gần
như nguyên văn với `worktree-merge-semantic-gate` — candidate ĐÃ NẰM SẴN trong
`porting-log.md` (R2 E2 F3) từ trước, quét lần này xác nhận lại chứ không phát
hiện mới; cái MỚI thật sự là repository-harness's epoch-fence (giải quyết race
KHÁC — nhiều session cùng approve — mà bee's verify-gate không tự đóng) và
beads-rust's proof-based-safety discipline (CI grep + strace witness) — 2 thứ
này CHƯA có candidate row nào trong porting-log.

## Chất liệu theo domain

### harness / orchestration — fork & bootstrap

- **beads** `context-memory:dolt-as-versioned-truth` — KHÔNG fork. "Concurrency
  chuyển từ branch-per-worker sang all-on-main + transaction discipline; 3-phase
  commit (mutation → PostWriteCommit → PostWritePush)". Vì-sao-liên-quan: chứng
  minh loại bỏ hẳn fork-boundary là 1 lựa chọn kiến trúc hợp lệ, không phải né
  tránh vấn đề.
- **beads-rust** `orchestration:two-tier-locking-app-backoff` — KHÔNG fork,
  thay bằng `.write.lock` blocking (timeout 30s, fast-path try_lock rồi poll) +
  `.sync.lock` advisory non-blocking + exponential backoff ±25% jitter chống
  thundering herd. Vì-sao-liên-quan: bằng chứng "khóa+backoff" là phương án
  thay thế fork rẻ hơn worktree khi contention vừa phải.
- **repository-harness** `harness:symphony-isolated-runner` (đã moved-to-symphony
  @9cc306d) — CÓ fork: "git worktree riêng + copy harness.db + RUN_CONTRACT.json
  + AGENTS shim"; "Root db không bao giờ là source of truth của run" — worktree
  chạy trên bản copy, phân kỳ tự do tới khi merge, ghi durable CHỈ qua changeset,
  không ghi thẳng db. `--here` cho tiny lane (in-place, không copy). Vì-sao-liên-
  quan: đây là mẫu bootstrap-copy GẦN NHẤT với nhu cầu tsk-1an, nhưng index
  KHÔNG xác nhận cơ chế copy có atomic/freeze trước copy hay không (gap thật).
- **bee** `orchestration:worktree-protected-attestation` +
  `protected-worktree-attestation-typed-halts` — orchestrator tự chụp 7 identity
  fact (commonDir/worktreePath/worktreeId/headRef/baseCommit/declaredPaths/
  reservedPaths) TRƯỚC khi worker tồn tại, KHÔNG BAO GIỜ lấy từ worker tự khai;
  4 typed halt khi lệch. `fleet-dispatch-and-merge-loop`: bootstrap tách biệt
  dispatch, mọi dispatch iteration "cold-start, zero memory" — state đứng
  NGOÀI fork (`.bee/state.json`, `.bee/backlog.jsonl` ở main), worker đọc tươi
  SAU khi fork xong chứ không được bootstrap-copy VÀO fork. Vì-sao-liên-quan:
  attestation giải quyết TOÀN VẸN (có bị tamper/lệch base không), KHÔNG giải
  quyết ĐỘ TƯƠI (write ngay trước fork có thấy không) — 2 câu hỏi khác nhau,
  đáng phân biệt rõ khi thiết kế tsk-1an.

### harness / integration-contract — merge-back reconciliation

- **beads** `context-memory:dolt-as-versioned-truth` + `orchestration:
  multiagent-routing-and-slots` — sync qua `bd dolt push/pull` (Dolt native,
  KHÔNG git); "merge slots" là coordination primitive tên gọi thôi, cơ chế
  thật là transaction serialization ở tầng Dolt, xung đột không thể xảy ra vì
  serialize tại DB transaction boundary.
- **beads-rust** `safety:sync-safety-blast-radius` — sync = atomic temp+rename
  + tombstone-protection + conflict-marker-scan KHÔNG override được by design +
  path allowlist cứng (chỉ ghi `.beads/`, từ chối `.git/`). Đây KHÔNG phải
  thuật toán merge mà là **proof-by-construction**: sync không thể corrupt vì
  guard chặn từ trước, không phải vì logic merge thông minh.
- **repository-harness** `orchestration:mutates-state-command-gate` +
  `harness:changeset-event-sourcing` — epoch-fence state machine `fenced →
  switched_pending_validation → complete/compensated`; lệnh mutate bị CHẶN khi
  journal chưa terminal; journal hỏng/thiếu SHA → fail-closed. Đồng thời
  `story-status-single-door`: update là compare-and-set `--expected-status`,
  lệch → CONFLICT exit 3, không ghi gì (giống hệt loại race của tsk-3w8: 2
  session cùng ghi). Changeset mang `content_sha256` — 2 changeset cùng ID khác
  content = conflict phát hiện được.
- **bee** `orchestration:multi-session-etiquette` + `red-stop-marker-anti-retry`
  — `git merge --no-ff --no-commit` (stage, KHÔNG commit) → verify chạy trên
  cây ĐÃ stage nhưng CHƯA có commit nào tồn tại → xanh mới commit; đỏ thì
  `git merge --abort`, main byte-untouched (tự nhận KHÔNG PHẢI rollback vì
  chưa từng commit) + ghi durable marker `.bee/tmp/bee-herding.red.<slug>`
  TRƯỚC KHI báo cáo, KHÔNG BAO GIỜ tự retry — lý do đo được: verify flake
  ~1/12, retry mù biến 1 lần đỏ thành nguy cơ thật đưa xung đột NGỮ NGHĨA vào
  main trong ~12 phút; "retrying tệ hơn gián đoạn nó né — 1 lần đỏ tốn 1 lần
  gián đoạn và 0 thiệt hại, vì merge đáng lẽ gây hại chưa từng xảy ra."

### safety / context-memory — event-source / log sync

- **beads**: KHÔNG có log riêng — event là ISSUE TYPE, node đồ thị first-class
  trong chính Dolt store (`orchestration:gate-beads-event-driven`). Không có
  fork nên không có bài toán đồng bộ log qua ranh giới fork.
- **beads-rust** `context-memory:sqlite-jsonl-classic-truth` +
  `orchestration:coordination-evidence-classifier` — audit event CHỈ ở SQLite,
  KHÔNG export JSONL; nhưng có 2 log append-only khác: `.beads/issues.jsonl`
  (interchange, git-tracked, 3-way merge với `.beads/beads.base.jsonl` base
  snapshot) và `.beads/interactions.jsonl` (flight-recorder content-addressed,
  append-only, KHÔNG BAO GIỜ replay/mutate). Crash-safety:
  `retry_mutation_with_jsonl_recovery` — DB hỏng giữa chừng thì rebuild từ
  JSONL rồi replay lại mutation đã stage.
- **repository-harness** `harness:changeset-event-sourcing` — CHÍNH XÁC mô
  hình fgOS cần soi gương: changeset JSONL (header+operations) COMMIT VÀO GIT,
  còn `harness.db` (derived view, tương đương `.fgos/state.json`) thì
  gitignored; `db rebuild` dựng lại toàn bộ db từ changesets — idempotent
  replay; changeset append CÙNG transaction SQLite với chính operation nó mô
  tả (rollback chung); payload full-record chứ không phải column-diff (replay
  tất định). fgOS ĐÃ có `fgos rebuild` verb tương tự — nhưng KHÔNG rõ có bước
  nào chạy `rebuild`/replay SAU KHI merge 2 nhánh event log lại hay không
  (2 nhánh worktree khác nhau đều append vào cùng file `.fgos/events.jsonl`
  qua git merge dòng-lệnh — nếu chỉ trust git's line merge mà không có
  `.gitattributes merge=union` như beegog từng đề xuất, dễ interleave sai thứ
  tự sự kiện).
- **bee** `orchestration:multi-session-etiquette` + `safety:
  file-reservation-system` — 2 cơ chế orthogonal: **holds** (né tránh, đọc
  `.bee/state.json`, `bee cells claim-next` tự skip claim đang bị hold, không
  block ai — 2 session chọn việc khác nhau) và **reservations** (chặn cứng
  theo path, `.bee/reservations.json`, trả `[BLOCKED]` ngay khi path đã bị
  giữ). CẢ HAI đều KHÔNG PHẢI cơ chế đồng bộ event-log qua ranh giới worktree
  — chúng ngăn xung đột TRƯỚC khi ghi, không hợp nhất log SAU khi ghi.

## Trade-offs đáng cân nhắc

- **Bỏ worktree (beads/beads-rust) vs giữ worktree (repository-harness/bee)**:
  bỏ worktree loại bỏ TOÀN BỘ lớp race fork/merge nhưng đổi git-diffable state
  lấy DB-native concurrency (beads: audit phải qua `bd`, không `git log`/
  `git diff` được) hoặc phải xây hẳn 1 tầng khóa+backoff+crash-recovery riêng
  (beads-rust). fgOS đã cam kết worktree-per-item (quyết định đã khóa theo
  AGENTS.md), nên trường phái đáng học THỰC SỰ là repository-harness/bee —
  beads/beads-rust hữu ích như "đường không đi" để hiểu TẠI SAO worktree tốn
  chi phí gì, không phải để port trực tiếp.
- **Attestation (bee) vs bootstrap-copy (repository-harness)**: 2 cơ chế GIẢI
  QUYẾT 2 CÂU HỎI KHÁC NHAU, dễ nhầm là cùng 1 thứ — attestation chứng minh
  worktree KHÔNG BỊ TAMPER/lệch base (toàn vẹn), bootstrap-copy chứng minh
  worktree CÓ dữ liệu (độ tươi). tsk-1an cần cả hai: bootstrap-copy đóng lỗ
  "thiếu data", nhưng nếu không có attestation-kiểu-bee thì không phát hiện
  được worktree đã bị worker tự sửa base commit sau khi nhận copy.
- **Verify-gate (bee) chỉ đóng lỗ CODE, không đóng lỗ STATE-MOVE tách rời**:
  báo cáo bee tự nêu rõ — nếu bước move-to-done (tsk-3w8's vấn đề) là 1 lệnh
  RIÊNG chạy SAU `git commit`, verify-gate của bee KHÔNG cứu được, vì
  verify chỉ gate cho commit, không gate cho lệnh sau commit. Cần
  hoặc (a) nhét state-move vào chính verify script trước khi commit
  (`test && state-move --dry-run && commit && state-move --apply`),
  hoặc (b) thêm 1 gate riêng kiểu epoch-fence (repository-harness) cho chính
  bước state-move.
- **Proof-based-safety (beads-rust) là kỷ luật TEST, không phải cơ chế RUNTIME**
  — CI grep contract (cấm gọi `Command::new("git")` trong `src/sync/`) + strace
  witness (verify runtime thật mọi write nằm trong allowlist) không thay thế
  verify-gate hay epoch-fence, mà XÁC MINH chúng đúng như thiết kế. Đáng áp
  dụng SONG SONG với bất kỳ cơ chế merge nào fgOS chọn, không phải thay thế.

## Candidate liên quan

Porting-log.md đã có sẵn 2 row từ beegog (không quét lại lần này, xem "Ngoài
lưới"): `worktree-merge-semantic-gate` (R2 E2 F3) và `worktree-isolation-axis`
(R2 E2 F3, chính là quyết định treo trong tsk-1an). Quét 4 nguồn lần này XÁC
NHẬN LẠI `worktree-merge-semantic-gate` qua bee's staged-verify gate (khớp gần
như nguyên văn — cùng 1 candidate, KHÔNG phải phát hiện mới). Phát hiện MỚI
chưa có row trong porting-log:

- **epoch-fence-merge-gate** (repository-harness, `harness:
  mutates-state-command-gate`) — bổ sung cho `worktree-merge-semantic-gate`:
  bee's verify-gate đóng lỗ "code sai" (semantic conflict), epoch-fence đóng
  lỗ KHÁC "2 session cùng approve/commit đồng thời" (chính là tsk-3w8). Đề
  xuất R2 (đụng tsk-3w8/tsk-53f's lock-wiring) E1 (chỉ 1 nguồn, chưa hội tụ)
  F2 (state machine 3 trạng thái + CAS, vừa phải).
- **changeset-committed-truth-db-rebuild** (repository-harness, `harness:
  changeset-event-sourcing`) — đối chiếu xem fgOS's `fgos rebuild` đã đủ chạy
  SAU merge 2 nhánh event log hay chưa; nếu chưa, đây chính là cơ chế đóng
  tsk-56t (worktree's .fgos diverge, main không thấy tới khi merge tay) THEO
  HƯỚNG KHÁC với tsk-1an's bootstrap-copy — thay vì copy VÀO worktree lúc
  fork, đảm bảo rebuild/replay đúng lúc merge-back. R2 E1 F2.
- **durable-red-marker-no-auto-retry** (bee, `red-stop-marker-anti-retry`) —
  fix pattern trực tiếp cho tsk-1os (force-remove checkout không phân biệt
  orphan/live) VÀ tsk-3yl (merge-back không idempotent, kẹt retry): thay vì
  tự động force-remove hay tự động retry, ghi marker durable + dừng, người
  xác nhận mới mở lại. R1 (nhỏ, áp trực tiếp) E1 F1.
- **proof-based-sync-safety** (beads-rust, `safety:sync-safety-blast-radius`)
  — kỷ luật test (CI grep contract + strace witness) cho BẤT KỲ cơ chế merge
  nào fgOS chọn cuối cùng; không phụ thuộc trục quyết định worktree-isolation-
  axis. R1 E1 F2 — đáng làm SAU khi chốt cơ chế merge, không phải trước.

## Coverage ledger

Phạm vi lần này: 4 nguồn được nêu tên (beads, beads-rust, repository-harness,
bee) — KHÔNG phải toàn bộ taxonomy × toàn bộ 11 nguồn trong distillery (đây là
consult thu hẹp theo yêu cầu, không phải full protocol run).

| domain | trạng thái |
|---|---|
| harness | consulted (7 entries — symphony-isolated-runner, changeset-event-sourcing, mutates-state-command-gate, story-status-single-door, dolt-as-versioned-truth, sqlite-jsonl-classic-truth, agent-first-cli-contract*) |
| orchestration | consulted (8 entries — multi-session-etiquette, worktree-protected-attestation, protected-worktree-attestation-typed-halts, red-stop-marker-anti-retry, two-tier-locking-app-backoff, coordination-evidence-classifier, multiagent-routing-and-slots, auto-polling-bounded) |
| safety | consulted (4 entries — sync-safety-blast-radius, workspace-health-contract, file-reservation-system, epoch-fence-migration-guard) |
| context-memory | consulted (4 entries — dolt-as-versioned-truth, sqlite-jsonl-classic-truth, llm-tier-compaction, gate-beads-event-driven) |
| self-improvement | consulted (1 entry — rollout-ladder-design-before-code, beads-rust) |
| testing-evals | consulted (1 entry — synthetic-scale-and-witness-harness, beads-rust) |
| quality-gates | consulted (1 entry — snapshot-review-log-gate, beads-rust) |
| tooling | consulted (1 entry — br-only-cli-additions, .br_history/) |
| skills | ruled out — không liên quan cơ chế fork/merge/event-sync |
| hooks | ruled out — không liên quan |
| workflow | maybe touched nhẹ (beads formula-molecule-lifecycle) nhưng không đào sâu — thuộc phạm vi khác (workflow modeling, không phải state-sync) |
| routing | ruled out — không liên quan |
| integration-contract | maybe — repository-harness's changeset schema chạm domain này nhưng chưa tách riêng, gộp chung vào harness ở trên |
| planning | ruled out |
| docs-style | ruled out |
| config-packaging | ruled out |
| repo-layout | ruled out — dù `.beads/`, `.harness/`, `.bee/` là repo-layout choice, không phải trọng tâm câu hỏi |
| ux | ruled out |

*agent-first-cli-contract chỉ trích dẫn gián tiếp qua beads-rust's harden version,
không phải trọng tâm 3 câu hỏi.

## Ngoài lưới

- **Không có upstream clone local** (`docs/distillery/upstreams/` không tồn
  tại trong checkout này) — cả 4 báo cáo chỉ đọc sealed index, KHÔNG descend
  được vào `Where:` file thật. Nhiều gap "not covered" trong 4 báo cáo con CÓ
  THỂ đã có câu trả lời trong source thật, chỉ là chưa index tới mức đó.
- **symphony.md CHƯA quét lần này** — chính bản thân repository-harness.md tự
  ghi nhiều entry "moved-to-symphony @9cc306d" (symphony-isolated-runner,
  doctor-preflight...) — nghĩa là chi tiết MỚI NHẤT của chính cơ chế
  bootstrap-copy nằm ở `sources/symphony.md`, không phải repository-harness.md
  (đã stale so với thực tế). Đáng quét riêng nếu cần đào sâu bootstrap-copy.
- **beegog.md CHƯA quét lần này** (user chỉ nêu tên "bee", không phải beegog)
  — nhưng chính beegog.md là nguồn gốc của 2 candidate row đã có sẵn trong
  porting-log (`worktree-merge-staged-verify-gate`,
  `independent-feature-worktrees`) và của cross-worktree-holds-ledger +
  store-lock-named-mutex được nhắc trong comparison-matrix — bee.md (report
  này) và beegog.md là 2 source KHÁC NHAU (bee = local snapshot v1.18.3 mới
  nhất; beegog = git-history github.com/vantt/beegog tới commit 05a131f,
  1.7.10-rc) — có thể lệch nhau, đáng đối chiếu nếu quyết định port thật.
- **beads-viewer-rust.md (bvr) CHƯA quét** — trường phái thứ 4 đã biết qua
  comparison-matrix (message-passing qua MCP Agent Mail) nhưng không nằm
  trong 4 tên user nêu, không đào sâu lần này.
- **6 câu hỏi "not covered"/"unresolved" cụ thể còn treo** trong 4 báo cáo
  con (vd: repository-harness's "copy có freeze trước copy không", bee's
  "worker có thấy write landed 1ms trước fork completion không") — đều thuộc
  loại chỉ upstream source thật (không phải index) mới trả lời được.

## Việc tiếp theo (đề xuất, KHÔNG tự quyết)

Human triage 4 candidate ở trên vào porting-log (2 mới hoàn toàn:
epoch-fence-merge-gate, changeset-committed-truth-db-rebuild; 2 đã có sẵn
nhưng cần thêm entry mới: durable-red-marker-no-auto-retry,
proof-based-sync-safety) trước khi bất kỳ task nào trong `worktree-in-out`
bắt đầu implement — đúng nguyên tắc distill: tìm và chấm điểm, con người
quyết định port.
