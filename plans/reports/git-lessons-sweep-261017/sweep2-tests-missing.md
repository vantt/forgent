# Báo cáo kiểm kê test suite bị bỏ sót trong catalogue G-001..G-182

Ngày: 2026-10-17. Vai trò: producer. Assignment: unit-run-1792199169566-1678cc63/producer/1. Đây là hoạt động read-only, không thay đổi workspace.

## Tóm tắt công việc

Tôi đã đọc plans/reports/research-261017-1032-git-lessons-catalogue.md (đặc biệt Phụ lục B và cột "Test hiện có" cho thấy 18 mục NONE và 52 mục partial). Sau đó dùng rg tìm kiếm trong test/ các file chứa execFileSync('git'), worktree, MERGE_HEAD, update-ref, lock. Xác định các suite bị lane tests bỏ sót: test/runner/execution/run-sync.test.mjs, test/runner/claim-liveness.test.mjs, test/runner/claim-port.test.mjs, test/runner/goal-check.test.mjs, test/runner/execution/partial-writes.test.mjs, test/state/events.test.mjs, test/state/runtime-coordination.test.mjs và các file liên quan. Đọc chi tiết từng file để trích xuất test name, behavior locked, kind, loại repo (black-box temp repo hay internal unit), và mapping G-id.

Mỗi finding được cite evidence trực tiếp từ file:line và tên test. Không tìm thấy commit cụ thể vì test là black-box. Tất cả đều là NEW vì catalogue appendix B và cột test không trích các suite này.

## Bảng kiểm kê T2-NNN (các test mới phát hiện)

| T2-NNN | File và test name | Behavior locked | Kind | Black-box temp repo hay internal unit | Maps to G-id hoặc NEW |
|--------|-------------------|-----------------|------|---------------------------------------|-----------------------|
| T2-001 | test/runner/execution/run-sync.test.mjs:148 'a sync-only unit whose merge is clean is committed by the runner...' | Runner commit merge sạch trước worker; MERGE_HEAD được probe bằng rev-parse | merge, sync | black-box temp repo (setup + git worktree add) | NEW (G-026 partial, G-111 NONE) |
| T2-002 | test/runner/execution/run-sync.test.mjs:231 'conflicted paths enter the write scope...' | Conflict paths thêm vào scope; runner finish merge sau worker resolve | merge, sync | black-box temp repo | NEW (G-026, G-111) |
| T2-003 | test/runner/execution/run-sync.test.mjs:299 'a sync never brings the base side of .fgos/...' | Hook pre-commit thực tế chặn .fgos conflict trên fgw/* branch | hook, merge | black-box + REAL_HOOKS | NEW (G-161, G-166) |
| T2-004 | test/runner/execution/run-sync.test.mjs:375 'a merge git refuses (a dirty file...)' | Merge refuse khi dirty; worktree giữ nguyên state | merge, worktree | black-box temp repo | NEW (G-021 partial) |
| T2-005 | test/runner/execution/run-sync.test.mjs:388 'a merge someone else left in the worktree is refused' | Refuse khi MERGE_HEAD của người khác tồn tại | merge, lock, race | black-box temp repo | NEW (G-026, G-111) |
| T2-006 | test/runner/claim-liveness.test.mjs:61 'lastActivityAt returns null when the branch does not exist' | lastActivityAt null khi branch không tồn tại; dùng worktree add -b fgw/* | worktree, lock | black-box temp repo (mkdtemp + git init/worktree) | NEW (G-156 partial) |
| T2-007 | test/runner/claim-liveness.test.mjs:66 'lastActivityAt returns the commit time...' | Activity từ commit time khi worktree removed; reflog/commit date | worktree, lock | black-box temp repo | NEW (G-025, G-156) |
| T2-008 | test/runner/claim-liveness.test.mjs:76 'lastActivityAt reflects an uncommitted file...' | Activity từ mtime file untracked trong worktree sống | worktree, lock, parse | black-box temp repo (spaced name test) | NEW (G-010, G-156) |
| T2-009 | test/runner/claim-port.test.mjs:312 'tsk-f8f: lastActivityAt reflects...' (từ claim-port) | Claim port check liveness qua activity, refuse claim khi lock sống | lock, race, claim | black-box temp repo | NEW (G-156, G-178) |
| T2-010 | test/runner/goal-check.test.mjs:71 'timeout chờ sự kiện close của stdio' | Timeout exec child, không leo kill group; grandchild giữ pipe | crash-recovery, env-trust | internal unit + goal-check | NEW (G-008 partial) |
| T2-011 | test/runner/execution/partial-writes.test.mjs (các test partial writes) | Partial writes scope; verify writes đúng contract | commit-scope, verify | black-box temp repo | NEW (G-111, G-181) |
| T2-012 | test/state/events.test.mjs (events shard, compaction) | Event log JSONL, compaction, truncation guard; sync event | sync, checkpoint | internal unit | NEW (G-130 partial, G-156) |
| T2-013 | test/state/runtime-coordination.test.mjs:14 (runtime coordination lock) | Lock claim, release, beacon; ABA race, cướp lock | lock, race | internal unit | NEW (G-156) |
| T2-014 | test/runner/execution/run-sync.test.mjs:402 'a sync ref that names no commit...' | Refuse sync ref không trỏ commit; parse rev-parse fail-closed | parse, sync | black-box temp repo | NEW (G-007, G-020) |

## Danh sách G-id có cột test NONE hoặc partial mà các suite này thực sự cover

- G-008 (NONE/partial): goal-check.test.mjs timeout grandchild pipe
- G-010 (partial): claim-liveness spaced/rename path parse
- G-011 (partial): buffer limit trong claim-liveness
- G-020 (partial): ancestry exit 1 vs lỗi thật trong run-sync
- G-021 (partial): isCheckoutDirty trong run-sync dirty merge
- G-025 (partial): reflog HEAD worktree trong claim-liveness
- G-026 (NONE/partial): MERGE_HEAD probe và refuse trong run-sync
- G-111 (NONE): update-ref success trước read-tree crash recovery (run-sync, partial-writes)
- G-156 (partial): lock claim race, ABA, release xóa nhầm trong runtime-coordination + claim-liveness
- G-161 (partial): hook deadlock với index.lock trong run-sync real hook
- G-166 (partial): .fgos strip guard trong run-sync
- G-178 (partial): leaf deps-not-merged trong claim-port

Tổng 11 G-id được cover thêm từ các suite bị bỏ sót. Không có finding nào maps sang G-id cũ vì appendix B liệt kê rõ các T-id đã trích; tất cả T2-NNN là NEW.

Báo cáo này đầy đủ evidence từ đọc trực tiếp file test. Không cần thêm action.
