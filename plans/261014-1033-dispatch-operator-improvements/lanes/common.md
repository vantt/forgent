# Ràng buộc chung cho mọi lane

Trả lời tiếng Việt, xưng em/anh với anh vantt. Đánh dấu UNPROVEN những gì chưa chứng minh.

- Repo /home/vantt/projects/forgentX (fgOS). Plan cha: plans/261014-1033-dispatch-operator-improvements/plan.md — đọc trước.
- Đọc trước: AGENTS.md, docs/specs/reading-map.md, docs/specs/runner.md (phần dispatch, RUL68/70/76/77/79/80), core/skills/_shared/executor-dispatch-fallback.md.
- Tạo worktree riêng từ main, nhánh của lane (ghi trong brief lane). Trong worktree: symlink target/ về main, node_modules là thư mục thật (`cp -al`). Không checkout nhánh trong main checkout. `pwd` trước mỗi lệnh git.
- Không đụng nhánh fix/credential-phase-02-doctor-scan, fix/dispatch-followups, và không sửa src/setup/registrations.mjs hay src/runner/dispatch/provider-credential-renewal.mjs khi hai nhánh đó chưa merge vào main (kiểm `git branch --merged main`).
- Bốn lane A–D chạy song song ở 4 pane khác. Chỉ sửa file trong vùng lane của mình; nếu buộc phải sửa file chung (cli.mjs, run-result.mjs, docs/specs/runner.md, CHANGELOG.md) thì sửa gọn, đúng chỗ, để merge sau ít xung đột.
- Prior art trước thiết kế: `git log -S`/`-G` trên symbol, config key, thuật ngữ spec; đọc "Lịch sử quyết định" của docs/specs/runner.md. Ghi rõ dùng lại gì, thiếu gì.
- Test đỏ trước, sửa, rồi xanh. Mỗi đề xuất một commit conventional; không nhắc AI, không ghi plan id/phase/lane. Commit bằng `git commit -- <paths>`, không `git add -A`. Commit ngay khi xanh.
- Test chạy với `env -u CLAUDE_CODE_SESSION_ID`. zsh không tách từ `$F`: dùng `xargs node --test`. Không pipe lệnh test qua `tail` làm mất exit code.
- Không đọc `.fgos/secrets.local.env`, không in credential, không tạo work item, không sửa `~/.fgos/config.json`.
- Hành vi người dùng thấy → một dòng CHANGELOG `## [Unreleased]`. Spec đổi → sửa docs/specs/*.md. Sửa core/skills → `npm run build:skills`.
- Trước khi gọi Agent/Task tool: `node src/runner/dispatch.mjs decide --for <label> --needs-soul --has-live-task-access`.
- Câu hỏi cho anh vantt chỉ khi các phương án thật sự ngang nhau, theo mẫu core/skills/_shared/decision-question.md (đủ 5 phần), gom thành một lần hỏi. Phương án thắng rõ thì quyết và ghi lý do.
- Xong: `npm test` toàn bộ trong worktree. KHÔNG merge, KHÔNG push. Viết báo cáo ở path lấy từ `fgos convention path --kind report --type <lane-type> --slug <slug> --plan 261014-1033-dispatch-operator-improvements`, commit báo cáo trên nhánh lane. Báo cáo: từng đề xuất — động cơ/nguyên nhân (proven/UNPROVEN), thiết kế, thay đổi, test, hash commit, còn để ngỏ; worktree, nhánh, kết quả npm test.
- Kết thúc bằng một tin nhắn cuối trong pane:
  Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_DECISION
  Summary: một hai câu, kèm đường dẫn báo cáo.
  Lead (phiên pane wS:p4T5) sẽ đọc pane, báo anh vantt và merge.
