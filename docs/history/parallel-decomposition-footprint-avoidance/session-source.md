# Session source — parallel decomposition + footprint avoidance (tsk-66o)

Nguồn thô cho `fgos-coding-shaping` distill vào `DISCUSSION.md`. Ghi lại
nguyên trình tự phiên làm việc, không phải bản tổng hợp — giữ đúng thứ tự
phát hiện để distill tự judge cái gì resolved/open.

## 1. Yêu cầu gốc

User muốn distill upstream project **bee** (và superpowers nếu đáng) để
học cách bee chia task con chạy song song ("cell") và tránh xung đột
footprint, so với mô hình hiện tại của forgentX: đẩy việc con ra ngoài cho
agent provider khác (agy, opencode) thực thi. Ranh giới user tự đặt: nếu
chính Claude điều phối song song trong-phiên → học cell; nếu đẩy ra ngoài
→ giữ cách chia hiện tại, chỉ cần học cách tránh xung đột footprint + ảnh
hưởng tới cách hợp nhất (merge) cha/con.

## 2. Deep-dive distill (đã sealed, không phải phần còn mở)

Chạy `/distill` skill, dùng nguồn đã managed sẵn: `bee` (living-doc,
v1.18.3), `superpowers`, `beegog`, `symphony`, `repository-harness`,
`beads`, `beads-viewer-rust`. Viết deep-dive:
`docs/distillery/deep-dives/parallel-decomposition-and-merge.md`.

**Kết luận chính của deep-dive:** forgentX đã hội tụ độc lập phần lớn
"cell" của bee rồi — `footprint` khai báo, `acceptance`+evidence, merge
dàn trận verify-trước-commit (`src/runner/merge.mjs`, `git merge
--no-commit --no-ff` → verify trên cây chưa commit → commit khi xanh)
đều đã có. forgentX đang đúng nhánh symphony/bee-herding (worker = tiến
trình NGOÀI, kém tin hơn), không phải bee's in-chat cell-swarm (worker =
subagent Claude cùng phiên) — khớp đúng kiến trúc agy/opencode.

3 khoảng trống đề xuất (ghi vào `docs/distillery/porting-log.md` làm
`candidate`):
1. `worktree-dispatch-attestation` (bee:worktree-protected-attestation +
   beegog:independent-feature-worktrees, R2 E2 F2) — mở rộng
   `src/runner/frozen-judge.mjs` gác diff-toàn-phần (không chỉ file dạng
   test/CI/lockfile) + chụp `baseCommit`/`headRef` trước dispatch quanh
   `resolveExecutorConfig`.
2. `computed-parallel-wave-schedule` (beegog:computed-parallel-schedule,
   R2 E2 F2) — lịch sóng song song tính được (Kahn+cycle-detection),
   mở rộng `footprintOverlap`.
3. Củng cố hàng có sẵn `orchestration-protocol-v1` (repository-harness +
   symphony + bee:fleet-dispatch-and-merge-loop, R3 E3 F2) — RUN_CONTRACT-
   shaped dispatch↔agy/opencode.

Sửa thêm: hàng `worktree-merge-semantic-gate` trong porting-log ghi
"YAGNI, chưa port" nhưng đọc code thấy đã tồn tại thật trong
`src/runner/merge.mjs` — sửa status `candidate` → `ported`.

## 3. Quyết định định hướng dispatch (decision 0026, đã chốt sẵn từ trước)

User chỉ ra deep-dive tự hỏi sai một câu ("agy/opencode dispatch qua cơ
chế nào") — đã có sẵn `docs/decisions/0026-vision-orchestrator-roottask-
capacity-native-vs-cli-spawn.md`: agy/opencode luôn khác provider với
rootTask Claude → luôn `cli/spawn` (quy tắc 3, không ngoại lệ), qua MỘT
adapter chuẩn: `resolveExecutorConfig` (`src/runner/dispatch.mjs`) +
config `capacities.<id>` (`kind:"cli"`, `command`, `args`), gác riêng
`capacities.<id>.allowCrossProvider` (`docs/reference/capacity-cross-
provider-governance.md`). Cơ chế spawn cụ thể bên trong adapter không
quan trọng với `worktree-dispatch-attestation` — chỉ cần MỘT điểm chèn
quanh `resolveExecutorConfig`.

Phát hiện thêm: một prior-art consult trước đó (2026-07-31,
`plans/reports/distill-consult-260731-1733-agent-executor-backend-
dispatch-report.md`) đã ĐỘC LẬP trỏ tới đúng `symphony:isolated-run-
contract` cho bài toán backend-dispatch nói chung — hội tụ độc lập lần
hai. Đã củng cố hàng `orchestration-protocol-v1` trong porting-log với
bằng chứng này (E3).

## 4. Chuyển 3 candidate thành work item — chọn nhánh test trước

User muốn test song song bằng Claude (Task tool, native, in-session)
TRƯỚC khi đổ công vào cơ chế agy/opencode thật — validate cơ chế
footprint-tránh-xung-đột + merge bằng chi phí rẻ trước.

Chọn 2 candidate chia được thành 2 mảnh file tách biệt (test tốt cho
footprint-conflict), theo đề nghị của user "sao không test cả 2":
- `worktree-dispatch-attestation`: mảnh A `src/runner/dispatch.mjs`
  (quanh `resolveExecutorConfig`), mảnh B `src/runner/frozen-judge.mjs`.
- `computed-parallel-wave-schedule`: mảnh A `src/state/graph-metrics.mjs`
  (thuật toán), mảnh B `src/cli/command-registry.mjs` + `bin/fgos.mjs`
  (verb CLI).

## 5. Phát hiện `tsk-66o` đã tồn tại — dùng làm gốc thay vì submit trùng

Trước khi submit 2 item mới, quét `fgos list --json` tìm dependency
candidate — phát hiện **`tsk-66o`** (todo, stage `clarify`, chưa claim)
đã hỏi gần đúng câu hỏi gốc: "Kiểm tra xem Planning/Validating có khai
báo rõ footprint chưa? có dùng graph để phân chia task để không đụng
footprint?" Cũng thấy `tsk-49o` (todo, dep `tsk-62v`) — sandbox OS-level
cho cli-spawn (`dispatch.mjs`, `EXECUTOR_ADAPTERS`) — khác cơ chế nhưng
cùng file `dispatch.mjs`.

User chốt: dùng tsk-66o làm gốc — claim, discover (Socratic), trả lời
bằng chính 2 candidate làm kết quả decompose, thay vì submit item mới
trùng câu hỏi.

## 6. `fgos take tsk-66o` + `fgos-coding-exploring` — D1-D4

Claim tsk-66o (`todo` → `doing`). Chạy `fgos-coding-driving` ceiling
`stage:decompose` → resolve skill `fgos-coding-exploring` cho stage `clarify`.

Scout: `rg footprint` tìm ra **`src/state/graph-harness.mjs`**
(`mergeReadiness`, tsk-4j9-2) — phát hiện làm thay đổi bức tranh deep-dive
lúc nãy: module này ĐÃ CÓ SẴN cơ chế gom-nhóm-theo-connected-component +
xếp-thứ-tự-serialize dựa trên `footprintOverlapAmong`, nhưng chỉ chạy ở
thời điểm MERGE (item `proposed`) — KHÔNG chạy ở thời điểm DISPATCH (item
`todo`/`ready`, nơi `fgos conflicts`/`footprintOverlap` chỉ báo CẶP, chạy
trên `frontier()`, không gom nhóm/xếp thứ tự). Kết luận deep-dive "chưa có
wave-schedule" đúng ở tầng dispatch nhưng sai khi ngụ ý cần thuật toán
hoàn toàn mới — cần hỏi lại có nên tái dùng logic đã có hay không.

Cũng phát hiện: `fgos pick` đã tạo worktree cô lập cho MỌI coding item
claim rồi (không phải tính năng tương lai — chạy thật hôm nay, đọc từ
`fgos-coding-driving/SKILL.md`'s claim rule: `domain.worktreeBacked ===
true` → `fgos pick` + `EnterWorktree`).

Và gap khác: `docs/explanation/auto-decompose-can-drop-a-locked-decision-
from-every-childs-footprint.md` — bằng chứng sống tsk-2ta (D1 amended dời
`.fgos-runner.json` → `.fgos/config.json`, sinh 4 con, không con nào khai
footprint đụng file đó, quyết định chưa bao giờ được làm dù cả 4 con
`done`). Khác bản chất: BỎ SÓT (không con nào nhận trách nhiệm một quyết
định) chứ không phải CHỒNG LẤN (2 con đá nhau).

Impact-analysis capability: `present` (GitNexus, `gitnexus` provider) —
mode Full áp dụng theo gate ở đầu CLAUDE.md.

### Quyết định đã khoá (ghi qua `fgos decision`, đã trong `view.decisions`)

- **D1**: children = worktree-dispatch-attestation-shaped work +
  computed-parallel-wave-schedule-shaped work (2 candidate từ
  porting-log.md, deep-dive parallel-decomposition-and-merge.md). Nguồn:
  user chốt sống trong phiên (mục 5 ở trên).
- **D2**: thuật toán wave-schedule RIÊNG (Kahn+cycle-detection kiểu
  beegog), KHÔNG tái dùng `graph-harness.mjs`'s connected-component+order
  logic — vì bài toán khác nhau thật: dispatch cần đếm SONG SONG ĐƯỢC MẤY
  CÁI ngay bây giờ, merge chỉ cần THỨ TỰ tuần tự. User trả lời "Riêng".
- **D4**: gap "bỏ sót" (decompose không phủ hết quyết định đã khoá vào
  footprint con) để NGOÀI scope tsk-66o — khác bản chất với chồng-lấn.
  User chốt: "file luôn thành task riêng đi, gap bỏ sót phải cover luôn"
  → filed **`tsk-1gr`** (todo, stage `clarify`, không dep logic với
  tsk-66o, chỉ liên hệ text).

### Còn MỞ — D3, chưa chốt

Phạm vi `worktree-dispatch-attestation`, vì `fgos pick` đã cô lập worktree
sẵn cho mọi coding item rồi (thu hẹp candidate gốc). User hỏi ngược "rộng
hơn là cỡ nào" khi được hỏi hẹp/rộng — đã trình bày 3 mức, CHƯA được
user chọn:

1. **Advisory-only** — chụp identity (`baseCommit`/`headRef` quanh
   `resolveExecutorConfig`) + mở rộng `frozen-judge.mjs` gác diff-toàn-
   phần, chỉ GẮN CỜ, không bao giờ chặn (giữ tinh thần frozen-judge hiện
   có, STR63 tiền lệ — advisory, không tự fail).
2. **Hard refusal tại merge** — lệch identity/base/diff NGOÀI footprint
   khai → merge bị CHẶN thật (typed halt kiểu bee's `WORKTREE_*_MISMATCH`,
   không chỉ gắn cờ) — đổi hành vi merge, nặng hơn mức 1.
3. **Cô lập cấp OS** — sandbox tiến trình spawn, giới hạn ghi file ở tầng
   hệ điều hành — ĐÂY CHÍNH LÀ scope của `tsk-49o` đã file riêng
   (`EXECUTOR_ADAPTERS` sandboxed-cli-spawn, dep `tsk-62v`, tier heavy).
   Nếu chọn mức này, `worktree-dispatch-attestation`'s child nên
   `deps: [tsk-49o]` thay vì tự làm lại.

Chưa có câu trả lời cho câu hỏi này khi phiên chuyển hướng sang
`code-shape` để chuyển toàn bộ hội thoại vào `DISCUSSION.md`.

## 7. Trạng thái tsk-66o tại thời điểm chuyển sang code-shape

`tsk-66o`: `doing` / stage `clarify` / claimed bởi phiên này (branch
`fgw/tsk-66o` nếu có, hoặc main checkout tuỳ `worktreeBacked` của domain
`coding` tại stage `clarify` — `fgos-coding-exploring` không tự tạo worktree,
chỉ `fgos pick` ở stage `executing` mới tạo). `CONTEXT.md` CHƯA được viết
(bước 3 của `fgos-coding-exploring` chưa chạy — phiên bị ngắt bởi yêu cầu
code-shape trước khi tới bước viết doc + gate). `fgos discover --verdict
clear` CHƯA được gọi.
