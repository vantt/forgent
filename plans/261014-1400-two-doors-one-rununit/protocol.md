# Giao thức chung cho mọi phase

Đọc trước khi mở bất kỳ phase nào. Phase file chỉ ghi phần riêng; mọi thứ dưới đây áp dụng mặc định.

## Đọc trước

[AGENTS.md](../../AGENTS.md), [docs/specs/reading-map.md](../../docs/specs/reading-map.md), [docs/specs/runner.md](../../docs/specs/runner.md) (RUL65b ~1020, RUL68 1048, RUL73 1077, RUL77 1089, decision 0047 dòng 3070, 0052 dòng 3136), [plan.md](plan.md), phase file của mình.

## Cơ chế chạy lane (Lead quyết #2)

- Mỗi lane = một **phiên Claude interactive** trong một pane herdr riêng, ở tab riêng (tên tab `rununit-<lane>`), cwd là worktree của lane. Không dùng executor confined: lane phải tự chạy test và tự commit, mà gitdir trong sandbox là read-only.
- Lead mở pane và dán brief: "Đọc `plans/261014-1400-two-doors-one-rununit/protocol.md` và `phase-NN-*.md`, làm đúng phạm vi phase, kết thúc bằng Status". Chạy `fgos dispatch decide --for <label> --needs-soul --has-live-task-access` trước theo AGENTS.md; nếu kết quả khác cách mở pane interactive thì báo owner trước khi mở.
- Trong lane: `pwd` và `git -C "$WT" rev-parse --abbrev-ref HEAD` trước mỗi lần commit. Không đụng main checkout.
- Lead đọc pane để theo dõi tiến độ, và **đóng pane ngay khi lane merge xong**. Mỗi lần chuyển bước, Lead liệt kê pane đang mở và đóng pane đã xong.
- Thư mục plan phải có trên main trước khi tạo worktree (bước S0). Báo cáo lane và báo cáo cổng cũng phải commit lên main trước khi tạo worktree cho bước sau.

## Worktree và nhánh

```bash
LANE=<lane-slug>   # land, scope, spike, commit, settle, run, workflow, docs, cut, loop, driver, guard
WT=/home/vantt/projects/forgentX-worktrees/rununit-$LANE
git -C /home/vantt/projects/forgentX worktree add "$WT" -b feat/rununit-$LANE main
ln -s /home/vantt/projects/forgentX/target "$WT/target"
cp -al /home/vantt/projects/forgentX/node_modules "$WT/node_modules"   # thư mục thật, không symlink
```

- Các worktree của lane cũ (`.../forgentX-worktrees/dispatch-*`, `.../doer-probe`) **chỉ để đọc**.
  - Lấy commit bằng `cherry-pick`.
  - Lấy thay đổi chưa commit bằng `git -C <wt> diff > patch` rồi `git apply` trong worktree của mình.
- Dọn mọi worktree một lần khi plan đóng, không dọn theo từng phase.

## Trước khi sửa code

1. **Prior art.** Chạy `git log -S'<symbol>'` và `git log -G'<term>'` trên symbol, config key và thuật ngữ spec, kể cả tên cũ. Đọc "Lịch sử quyết định" của runner.md.
2. **Impact.** Chạy `fgos tool query --capability impact-analysis --status present`.
   - Kết quả full: chạy `impact({target, direction:"upstream"})` cho từng symbol sẽ sửa. Ghi HIGH/CRITICAL vào báo cáo trước khi sửa. Đã biết: `settleRunOutcome` CRITICAL, `bind` HIGH, `resolveExecutorCommand` và `executeExecutorCli` CRITICAL.
   - Kết quả degraded hoặc inactive: ghi rõ trong báo cáo và cross-check bằng `rg`.
3. **Chạy code của working tree.** Dùng `npm run fgos:dev -- <verb> ...`. `fgos` trần chạy release đã activate, không phải code đang sửa.
4. **Đổi verb hoặc registry.**
   - Phase thêm hoặc xoá **verb top-level**: chạy `node scripts/export-command-selectors.mjs` để sinh lại `packages/host-runtime/contracts/command-routes.json` + `command-route-annotations.json`, rồi chạy `test/rust-host/command-routes.test.mjs`. Rust host nhúng bảng route lúc build (`apps/fgos/src/main.rs:23-25`): `fgos:dev` tự build lại, còn release thì phải restage.
   - Phase chỉ sửa `command-registry.mjs`: chạy `node scripts/export-command-selectors.mjs --check`.
   - Plan hiện tại không thêm verb top-level.

## Test

- **Đỏ trước.** Viết test, chạy, chép dòng fail vào báo cáo, rồi mới sửa code.
- **Focused.** `env -u CLAUDE_CODE_SESSION_ID node --test <file...>`. Với zsh, nhiều file thì chạy `printf '%s\n' ... | xargs node --test`.
- **Toàn bộ.** `env -u CLAUDE_CODE_SESSION_ID npm test; echo "exit=$?"`.
  - Không pipe qua `tail`, vì sẽ mất exit code.
  - Một lượt mất khoảng 11 phút.
  - `test/rust-host/fgctl-init*.test.mjs` bị watchdog giết là lỗi đã biết. Chạy lại riêng file đó trước khi coi là hồi quy.
- Không thêm env switch, flag hay nhánh code chỉ dành cho test (L5 câu 5).
- Muốn đổi kỳ vọng của một test cũ: liệt kê test đó kèm lý do trong Requirements của phase. Không được để tên test nói ngược với kỳ vọng mới.

## Commit

- Conventional commit, không nhắc AI, plan id, phase hay lane.
- Commit bằng `git commit -- <paths>`, sau đó `git show --stat HEAD`. Commit ngay khi xanh.
- Không commit `.fgos/**` từ nhánh lane (ADR0020).

## Cổng mỗi phase

1. **Test.** Đỏ → xanh. `npm test` toàn bộ xanh trên nhánh lane, sau khi đã rebase lên main mới nhất.
2. **Review độc lập.** Agent `code-reviewer` (không phải người viết) đọc diff `main...feat/rununit-$LANE` cùng phase file. Finding mức cao: sửa, hoặc Lead bác kèm lý do ghi lại.
3. **Red-team** cho 00, 01+02, 04, 06, 09, 10, 11.
   - Danh sách đòn trong phase chỉ là **sàn**. Red-team được tự do tấn công thêm.
   - Mỗi đòn trúng: thêm test đỏ rồi sửa.
   - Báo cáo ghi các đòn đã thử và kết quả từng đòn.
4. **Báo cáo lane** ở `plans/261014-1400-two-doors-one-rununit/reports/lane-<slug>-<YYMMDD-HHMM>.md`.
   - Nội dung: động cơ (proven/UNPROVEN), thiết kế, commit, test đỏ→xanh, impact, kết quả `npm test`, "Spec delta", "CHANGELOG delta", phần còn để ngỏ.
   - Kết thúc bằng `Status: DONE | DONE_WITH_CONCERNS | BLOCKED` + Summary.
5. Lane không merge, không push.

## File dùng chung

| File | Người giữ | Cách |
|---|---|---|
| `docs/specs/runner.md`, `CHANGELOG.md`, `docs/decisions/index.md` | A: L0 (chỉ RUL82/83 và dòng changelog của lane cũ); B: không ai (lane ghi delta vào báo cáo); C: L7 (07a áp mọi delta 01-05 + decision 0060/0061); F: L7 (07b, decision 0062, áp delta của 06); G: Lead áp delta 09/10 khi merge; H: L11 (decision 0063) | Một bước chưa có commit docs thì chưa đóng (L5 câu 6). Decision ID cấp theo đợt, không sửa thân decision cũ |
| `bin/fgos.mjs`, `src/cli/command-registry.mjs` | B: L4 (case `run`); C: L5 (case `workflow`); F: L6; H: L11 | |
| `src/runner/execution/run.mjs` | A: L1 (dựng `unitRecord`); B: L2; G: L10 | |
| `src/runner/execution/unit.mjs` | A: L1 duy nhất | |
| `src/workflow/definition.mjs` | A: L1 (khối `writes`); B: L5 | L5 rebase sau 01 |
| `src/runner/dispatch/cli.mjs` | A: L0; F: L6; H: L11 | |
| `settlement.mjs`, `assignment-runner.mjs` | A: L0; B: L3; G: L10; H: L11 | |
| `src/runner/work-dispatch.mjs` | F: L9 (09a helper); G: L9; H: L11 | L10 chỉ dùng helper |
| `src/runner/fanout-batch.mjs` | B: L2 (lời gọi commit); F: L6 (chỉ lối vào `node`); G: L9 | |
| `docs/architecture-manifest.json` | A: L1; B: L5; F: L6 | Lane thêm hoặc xoá `.mjs` thì sửa row trong cùng commit |
| `AGENTS.md`, `core/skills/**`, bản render (`.agents/skills`, `plugins/fgOS/skills`, `.claude/skills`) | C: L7 (07a); F: L7 (07b) | Chỉ sửa qua `npm run build:skills` |
| `test/architecture.test.mjs` | F: L6; G: L9 rồi L10 (sau 06 và 09, chỉ allowlist/expectedFiles); H: L11 | |
| `.fgos/config.json` | Lead, trên main | |

## Merge (Lead)

```bash
cd /home/vantt/projects/forgentX && git status --short   # các path sắp đổi trong main checkout phải sạch
git -C "$WT" rebase main && (cd "$WT" && env -u CLAUDE_CODE_SESSION_ID npm test; echo "exit=$?")
git merge --ff-only feat/rununit-$LANE
env -u CLAUDE_CODE_SESSION_ID npm test; echo "exit=$?"
```

- Không dùng `update-ref` từ worktree khác.
- Lane sau rebase lên main mới, rồi chạy lại `npm test`.
- Rollback mức code: `git revert` từng commit của lane, mới nhất trước. Không `reset --hard` main.
- Rollback mức release: `fgctl repair` về `previousArtifactDigest` trong `.fgos/installation/activation.json`.

## Cổng thật

- Tạo worktree probe từ main mới nhất: `WTP=/home/vantt/projects/forgentX-worktrees/rununit-gate-<m1|m2>`, nhánh `probe/rununit-<m1|m2>`.
- File tạm đặt ở đường dẫn tuyệt đối `/home/vantt/projects/forgentX/.fgos/runtime/tmp/`.
- Một ca chỉ tính là đạt khi Lead đã đọc transcript hoặc pane của lượt đó, không chỉ nhìn `outcome`.
- Ghi kết quả vào `reports/gate-<m1|m2>-<YYMMDD-HHMM>.md`, gồm unitRunId, workflowRunId, sha và đoạn trích `result.json`.
