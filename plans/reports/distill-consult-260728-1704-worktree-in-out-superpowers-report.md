# Superpowers Consult: Fork/Isolate, Merge-Back, Cleanup — worktree-in-out

Nguồn thứ 5, bổ sung cho `distill-consult-260728-1647-worktree-in-out-report.md`
(beads/beads-rust/repository-harness/bee). `sources/superpowers.md` CHƯA sealed
(297B, "Chưa phân tích") — nhưng 1 phiên khác vừa gather 5 báo cáo mechanical
inventory xong (~16:53-16:59, ~10 phút trước), nên dùng lại phần gather đó
(đúng cost-tiering của consult-protocol: gathering máy móc đã xong, chỉ còn
phần phán đoán liên quan + viết brief là việc của phiên này) thay vì spawn
subagent mới đọc lại từ đầu:
`plans/reports/distill-superpowers-{docs,skills,tooling-tests,hooks,packaging}-inventory-260728-1653-report.md`.

**Đây là nguồn ĐỤNG TRỰC TIẾP bug thật của fgOS nhất trong cả 5 nguồn** — không
chỉ tương tự, mà named-fix cho đúng lỗi tsk-424 đã dogfood.

---

## 1. Fork/Isolate — "phantom state" warning khớp thẳng tsk-1an/tsk-424

`skills:using-git-worktrees` (skills-inventory:85-88): thứ tự ưu tiên NGHIÊM
NGẶT — detect đã-trong-worktree trước (`GIT_DIR != GIT_COMMON`, có submodule
guard qua `git rev-parse --show-superproject-working-tree`) → ưu tiên NATIVE
worktree tool của harness nếu có → chỉ fallback `git worktree add` thủ công
khi KHÔNG có native tool, kèm cảnh báo nguyên văn:

> "Using `git worktree add` when you have a native tool creates **phantom
> state your harness can't see or manage**."

**Đây CHÍNH XÁC là lỗi tsk-424**: fgOS's `createWorktree` (worktree.mjs) tạo
worktree ở `/tmp/fgos-worktrees/`, KHÔNG dưới `.claude/worktrees/` — nên khi
EnterWorktree (Claude Code's native tool) được gọi lần 2 để vào 1 tree con vừa
tạo, harness từ chối: ".claude/worktrees does not exist, so <path> cannot be a
worktree managed by Claude Code". fgOS đang tạo đúng loại "phantom state"
superpowers cảnh báo — Claude Code không biết/không quản được worktree đó.

## 2. Merge-back / Cleanup — 3 bug thật đã fix, áp trực tiếp tsk-1os/tsk-3yl

`docs:worktree-detect-and-defer` (docs-inventory:110-115) + `skills:
finishing-a-development-branch` (skills-inventory:46-49):

- **Ownership rule (đóng tsk-1os)**: "whoever creates the worktree owns its
  cleanup" — worktree dưới `.worktrees/`/`worktrees/` là của superpowers,
  superpowers tự dọn; bất kỳ đâu khác (`.claude/worktrees/`,
  `~/.codex/worktrees/`) thuộc về harness, KHÔNG ĐỘNG VÀO. fgOS's
  `reclaimOrphanedCheckout` force-remove BẤT KỲ checkout nào tồn tại của 1
  branch mà không kiểm tra ai đang sống trong đó — chính xác loại lỗi ownership
  rule này ngăn.
- **Cleanup ordering (đóng 1 phần tsk-3yl)**: gộp từ 3 bug thật đã đóng
  (#940, #999, #238) — thứ tự bắt buộc: **merge → verify → remove-worktree →
  delete-branch**, KHÔNG BAO GIỜ xóa branch TRƯỚC khi remove worktree (branch
  bị xóa trước mà worktree vẫn còn checkout ra nó → git worktree hỏng, không
  gỡ được sạch) + CWD safety kiểm tra trước `git worktree remove` (không đứng
  trong chính worktree sắp xóa).
- **Discard path có gate xác nhận literal**: menu tích hợp có nhánh "discard"
  bị khóa sau typed-confirmation — "chỉ đúng từ `discard` mới cho phép xóa" —
  mẫu đáng học cho bất kỳ thao tác force-remove nào fgOS thêm vào (kể cả sau
  khi sửa ownership rule, discard THẬT SỰ vẫn cần xác nhận rõ ràng, không chỉ
  suy luận orphan/live).

## 3. Tool-description-override — root cause khác của tsk-424, CHƯA fgOS biết

`docs:worktree-detect-and-defer` (docs-inventory:114), TDD validation
failure/fix cycle thật:

> "Claude Code's `EnterWorktree` tool description itself says 'ONLY when user
> explicitly asks,' which silently overrides skill instructions" — cite
> Claude Code issue #29950: "Tool descriptions override skill instructions."

Bản nháp đầu ("bạn tự biết toolkit của mình") chỉ đạt 2/6 pass rate — agent
bám vào lệnh git cụ thể trong bước fallback thay vì tool native mơ hồ. Fix:
đặt tên tool CỤ THỂ (`EnterWorktree`, `WorktreeCreate`, `/worktree`,
`--worktree`) biến quyết định thành tra-cứu-sự-kiện, cộng 1 câu "consent
bridge" đóng khung sự đồng ý của user LÀ chính uỷ quyền bắt buộc của tool.
Kết quả sau 3 vòng REFACTOR: 50/50 pass GREEN+PRESSURE.

**Vì-sao-liên-quan tsk-424**: fgOS's `pick/fgos-routing` skill BẢO agent dùng
EnterWorktree, nhưng KHÔNG biết (docs hiện tại không nhắc) rằng tool
description của chính EnterWorktree có thể tự chặn lệnh gọi thứ 2 tùy điều
kiện — đây là 1 lớp nguyên nhân KHÁC (harness-side override), tách biệt với
lỗi fgOS-side (path không dưới `.claude/worktrees/`) mà tsk-424 đã ghi. Có
thể fgOS đang bị CẢ HAI nguyên nhân cộng dồn, không chỉ 1.

## 4. Cùng-shape-bug: workspace không có identity xuyên nhiều work-item

`docs:subagent-driven-development-evolution` (docs-inventory:87), Jul 6 2026
fix thật: `.superpowers/sdd/progress.md` KHÔNG có plan identity → 1 plan tiếp
theo trong CÙNG working tree đọc nhầm ledger của plan KHÁC làm tiến độ của
mình — quan sát thật: 1 worktree tích lũy 68 file từ 3 plan khác nhau, phải
đặt tên tay `progress-p2.md` để né. Fix: workspace = `.superpowers/sdd/
<plan-basename>/`, dòng đầu ledger tự khai tên plan, workspace `rm -rf` khi
review sạch.

Đây CÙNG DẠNG BUG với tsk-424 (root decompose ra children, mỗi con cần
worktree/nhánh riêng NGAY TRONG cùng phiên) — cả hai đều là "workspace dùng
chung giữa nhiều đơn vị công việc logic khác nhau, không có identity phân
biệt". Đáng lưu ý finding phụ: RED baseline (25 rep, 3 fixture) cho thấy
controller KHÔNG BAO GIỜ tự nhận nhầm ledger lạ — luôn phát hiện qua đối
chiếu git-log, tốn 6-13 tool call mỗi lần resume (mean 9.0) — team vẫn quyết
ship fix trên CĂN CỨ CẤU TRÚC (structural grounds) dù chưa quan sát được thất
bại thật. Bài học: đừng đợi bug thật xảy ra mới coi là đáng sửa nếu cấu trúc
đã sai.

## 5. Testing pattern đáng học: RED/GREEN/PRESSURE eval cho quyết định worktree

`tooling-tests-inventory:111`: `test-worktree-native-preference.sh` — RED
(prompt KHÔNG có hướng dẫn, kỳ vọng agent fallback `git worktree add`) →
GREEN (skill text hiện tại, kỳ vọng dùng native `EnterWorktree`) → PRESSURE
(thêm khung urgency + có sẵn `.worktrees/` để dụ agent bỏ qua) — hỗ trợ chạy
lặp `RUNS` để có độ tin cậy thống kê; kết quả đã validate "50/50 runs, zero
failures". `test-worktree-path-policy.sh`: pure grep-based doc regression,
không gọi LLM.

Đáng học: nếu fgOS sửa `pick/fgos-routing` skill để agent BIẾT ưu tiên đúng
tool worktree, cần eval kiểu RED/GREEN/PRESSURE để chứng minh sửa THẬT (không
chỉ đọc code review), không phải chỉ sửa doc rồi tin.

---

## Different/Better — xếp hạng mức độ áp dụng trực tiếp

1. **Ownership-boundary rule + cleanup ordering** (mục 2) — áp trực tiếp nhất,
   fix nhỏ, đã có 3 bug thật + typed-confirm pattern làm bằng chứng. Đóng
   tsk-1os gần trọn vẹn.
2. **Tool-description-override awareness** (mục 3) — PHÁT HIỆN MỚI, chưa nằm
   trong bất kỳ mô tả nào của tsk-424 hiện có — cần thêm vào mô tả tsk-424 như
   1 nguyên nhân khả dĩ THỨ HAI, không chỉ path-không-dưới-.claude/worktrees.
3. **Phantom-state warning** (mục 1) — xác nhận lại (không mới) rằng
   `/tmp/fgos-worktrees/` là kiến trúc có vấn đề tận gốc, không chỉ path lẻ.
4. **Workspace-identity bug shape** (mục 4) — không sửa trực tiếp task nào có
   sẵn, nhưng đáng dùng làm phép so sánh khi thiết kế cách fgOS đặt tên/tách
   workspace cho children trong cùng phiên (tsk-424's phần "chưa có hướng dẫn
   chính thức").

## Candidate liên quan — bổ sung vào porting-log (đề xuất, chưa mutate)

- **worktree-ownership-cleanup-ordering** (superpowers, `using-git-worktrees`
  + `finishing-a-development-branch`) — path-based ownership + thứ tự
  merge→verify→remove-worktree→delete-branch. Đóng tsk-1os. R1 E2 (3 bug thật
  đã fix, evidence mạnh) F1 (nhỏ, cục bộ trong worktree.mjs).
- **tool-description-override-consent-bridge** (superpowers,
  `worktree-detect-and-defer`) — đặt tên tool cụ thể + câu consent-bridge
  trong skill doc, có eval 50/50 làm bằng chứng. Bổ sung nguyên nhân cho
  tsk-424. R2 (đụng cả skill doc lẫn khả năng harness-side) E2 F1.

## Coverage ledger (bổ sung)

| domain | trạng thái |
|---|---|
| skills | consulted (using-git-worktrees, finishing-a-development-branch, subagent-driven-development) — mới, chưa có ở lượt quét 4-nguồn trước |
| workflow | consulted nhẹ (SDD ledger evolution — workspace identity bug) |
| testing-evals | consulted (RED/GREEN/PRESSURE eval methodology) |
| hooks, config-packaging | quét (bootstrap = session-context injection) nhưng **ruled out** — trùng tên "bootstrap" với câu hỏi của ta nhưng khác nghĩa hoàn toàn (session-start context injection, không phải data/worktree bootstrap) |

## Ngoài lưới

- `sources/superpowers.md` vẫn CHƯA sealed (297B) — 5 report trên là raw
  inventory của 1 phiên khác, chưa qua bước Compare/Seal chính thức của
  distill lifecycle. Consult này dùng tạm nguyên liệu thô; khi superpowers
  seal xong, nên đối chiếu lại xem 2 entry đề xuất ở trên có khớp slug thật
  trong `sources/superpowers.md` hay không trước khi ghi vào porting-log.
- Không descend được vào code thật (`skills/using-git-worktrees/SKILL.md`
  đầy đủ) — chỉ đọc qua báo cáo inventory đã tóm tắt.
