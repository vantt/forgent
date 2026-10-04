# Nghiệm thu: Work loop runner commit

Ngày: 2026-10-04. Nhánh `fix/work-loop-runner-commit`, đã merge `main` (`ab5021788`).

## Điều kiện
- impact-analysis: degraded. GitNexus index cũ (6bad420), `loop.mjs` vẫn coi là CRITICAL; chặn bằng test loop + e2e.
- Phase 1 chỉ là plan (sự thật + impact), không có code.

## Full suite
Lệnh: `env -u CLAUDE_CODE_SESSION_ID npm test` (không pipe), worktree `forgentX-loop-commit`.

- Điều kiện máy: 0 tiến trình `node --test` trước khi chạy; RAM available ~3.3GB.
- Lần 1: 6615 tests, 6541 pass, 1 fail, 8 skip, ~324s. Không file nào bị time-limit kill.
- Fail duy nhất là hồi quy thật: Data Dictionary #7 (`test/setup/registrations.test.mjs`) thiếu doctor check `invocation-git-write-grants`. Đã thêm vào hàng #7 `docs/specs/distribution.md`; file test đó chạy lại 53/53 pass.
- Sau merge main, nhóm test liên quan (loop, e2e runner-loop, dispatch, setup/checks, skills/fgos-mirror): 630/630 pass.
- Test chập chờn đã biết `herdr-reconciliation.test.mjs:1067` không đỏ trong lần chạy này.
- Chưa chạy lại toàn bộ suite sau sửa doc (chỉ doc + test registrations đã chạy lại).

## Chạy thật Work loop
Bằng chứng: `reports/evidence/` (`runner-commit.txt`, `worker-log-real-1.log`, `work-loop-runner-output.txt`).
- Worker thật (sonnet) sửa file, exit 0.
- Commit do runner tạo: `9e319b8b885085a55e0ba97caed0e364f8712f85` ("add output.txt") trên nhánh `fgw/real-1`.
- Worker log: `commit runner`. Goal-check pass.

## Quét quyền git
`rg -n 'Bash\(git (add|commit)' src core domains docs/specs .fgos/config.json`

- `src`, `core`, `domains`, `.fgos/config.json`: rỗng.
- `docs/specs/runner.md` còn 5 dòng, đều là mô tả lịch sử hoặc chính quyết định 0052: 955, 1178, 1631 (mô tả trạng thái cũ trước 0052), 3072 và 3087 (văn bản quyết định 0052 nêu quyền đã bỏ).
- Dòng 955 và 1178 viết thì hiện tại về `executor.args`; đã lỗi thời so với config thực. Ghi nhận, chưa sửa.
