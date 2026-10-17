# Phase 04: adapter agent-protocol cách `terminal` cho 5 CLI

Wave 1. Nhánh `terminal-mode/p04-agent-protocol-terminal`, worktree `.claude/worktrees/tm-p04`. Phụ thuộc: P00.

## Đọc trước

r6 §8; nguồn trong [`herdr-round.mjs`](../../src/runner/dispatch/herdr-round.mjs): `startAgent` `:798`, `briefMessage` `:840`, `submitBrief` `:854`, `deliverBrief` `:871`, `readAgentState` `:919`, `ensureHerdrKnowsAgent` `:942`, `awaitPromptReady` `:974`, `refuseBriefIntoUnreadyPane` `:1024`, `PASTE_CHIP_RE` `:1040`, `VISIBLE_WORKING_TAIL_RE` `:1043`, `isDraftStillInComposer` `:1052`, `confirmBriefSubmitted` `:1092`, `MAX_RESENDS` `:400`, `DEFAULT_IDLE_TIMEOUT_MS` `:419`, `UNRULED_READY_MS` `:441`; [`herdr-agent.mjs`](../../src/runner/dispatch/herdr-agent.mjs) (`READY_STATES`, `isReadyState`, `normalizeAgentName`, nếu 6.5 còn giữ); test [`herdr-spawn-adapter.test.mjs`](../../test/runner/herdr-spawn-adapter.test.mjs), [`herdr-agent.test.mjs`](../../test/runner/herdr-agent.test.mjs). Đọc ở HEAD sau 6.5 land (6.5 P06 đã đổi IO sang client, logic chờ còn nguyên).

## Yêu cầu

- `terminal/` một adapter mỗi CLI: máy trạng thái thuần trên `AgentIo` (P00 6.2): `await_ready(io, readyMs)`, `deliver(io, brief)` (paste/ký tự/file pointer theo `briefMessage`), `confirm_submitted(io, message)` (paste-chip, draft còn trong composer, đuôi "Working"), tối đa `MAX_RESENDS` lần gửi lại chỉ khi **chắc** chưa nhận (không gửi lại mù), `detect_completed(io, outbox)`, `exit_command()`, `classify_blocked(screen)` (trust dialog, login).
- Chuyển regex nguyên văn; mỗi regex có vector từ màn hình thật.
- Fixture màn hình 5 CLI: lấy từ phép đo 2.4 của hội đồng (`git show 8b61ae947:plans/reports/architecture-council-261015-1508-…` phần bảng đo) và từ pane thật (ghi bằng `herdr pane read` trong tab riêng); lưu `packages/agent-protocol/contracts/fixtures/terminal/<cli>/*.txt`.
- Không phụ thuộc `fgos-terminal-control` (cổng IO riêng, r6 §4.1).

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/agent-protocol/rust/src/terminal/{mod.rs,claude.rs,codex.rs,agy.rs,pi.rs,omp.rs,common.rs}`, `packages/agent-protocol/rust/tests/terminal_vectors.rs`, `packages/agent-protocol/contracts/fixtures/terminal/**` |
| sửa | `packages/agent-protocol/rust/src/lib.rs` |

## Test

Mỗi CLI: màn hình sẵn sàng → `ready`; trust dialog → `blocked(trust-dialog)`; paste-chip còn trong composer → chưa nhận, gửi Enter (không dán lại); đuôi "Working" → `delivered`; màn hình không đổi + không chip → `delivery-unknown` (không gửi lại); outbox có kết quả → `completed`. Ca chuyển từ test Node hiện có giữ nguyên kỳ vọng. Lệnh: `cargo test -p fgos-agent-protocol terminal`.

## Tiêu chí nghiệm thu / rollback

Vector 5 CLI xanh; mọi ca của test Node hiện có về logic chờ có vector tương ứng (bảng đối chiếu trong báo cáo phase). Rollback: revert.
