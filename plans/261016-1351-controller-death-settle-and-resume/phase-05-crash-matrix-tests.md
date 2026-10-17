# Phase 05: test crash cho mọi dòng ma trận 9.7, hai adopter, resume sau adopt

Wave 1 (viết đỏ) → wave 2 (xanh sau khi P01–P04 vào nhánh tích hợp). Nhánh `controller-death/p05-crash-matrix`, worktree `.claude/worktrees/cd-p05`. Phụ thuộc: P00; nghiệm thu cần P01–P04.

## Đọc trước

r6 §9.7 bảng, §10 bảng; AGENTS.md L5 câu 5 (không nhánh test trong code: giết process từ ngoài theo file quan sát được); 6.2 P09 và 6.3 P06 (ma trận crash đã có cho supervisor — ở đây phủ phần resume/recover/unit và mọi dòng còn thiếu).

## Yêu cầu

Một test cho mỗi dòng ma trận × hai cách khởi động (`direct` qua bwrap thật; `terminal` qua fake herdr):

| Dòng 9.7 | Cách tạo đúng chỗ (từ ngoài) |
|---|---|
| Không binding, không receipt | SIGKILL controller khi `prepared` marker xuất hiện, trước spawn supervisor (bước fixture chặn bằng fifo) |
| Binding có, `gate-exit` chưa, receipt chưa | SIGKILL supervisor + gate cùng lúc khi `supervisor-binding.json` xuất hiện |
| `gate-exit` có, receipt chưa | Supervisor SIGKILL khi `gate-exit.json` xuất hiện (agent fixture thoát nhanh, supervisor chậm vì bước đọc fifo) |
| Receipt có, run control `settled`, `result.json` chưa | Bước `settle-attempt` fixture bị SIGKILL sau khi run control đổi `settled` (quan sát file ledger) |
| Receipt có, chưa settle | Supervisor SIGKILL khi receipt xuất hiện, trước bước 1 |
| `result.json` có, `finalize-home` chưa | SIGKILL supervisor khi `steps/settle-attempt.json` xuất hiện |
| `release-slot` chưa (`terminal`) | SIGKILL khi `steps/finalize-home.json` xuất hiện |
| Mọi bước có | adopt → `closed`; lần quét sau bỏ qua |

Mỗi test khẳng định: sau `fgos run --resume` (hoặc `dispatch recover` + apply), unit đi tới `unit-summary.json`; agent fixture chạy đúng 1 lần (trừ dòng "không binding", nơi agent chưa từng chạy và resume chạy nó lần đầu); credential write-back gọi đúng 1 lần; pane đóng đúng 1 lần (`terminal`).

Thêm: hai adopter đồng thời trên mỗi dòng có side effect (một `adopted`); resume sau khi adopt đã `closed` (không adopt lại, dùng kết quả).

Bước fixture chặn bằng fifo là **lệnh trong envelope** (envelope test ghi lệnh khác), không phải cờ hay env trong code production.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `test/run-supervisor/crash-matrix-adopt-resume.test.mjs`, `test/run-supervisor/helpers/{kill-on-file.mjs,fifo-step.mjs,envelope-fixture.mjs}` |

## Lệnh

`cargo build -p fgos`; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> FGOS_HERDR_BIN=test/helpers/fake-herdr-pane.mjs node --test test/run-supervisor/crash-matrix-adopt-resume.test.mjs`.

## Tiêu chí nghiệm thu / rollback

16 ca ma trận (8 dòng × 2 cách, dòng `release-slot` chỉ `terminal` → 15) + ca hai adopter + ca resume sau adopt xanh; chạy 5 lần liên tiếp không flaky. Rollback: revert (chỉ test).
