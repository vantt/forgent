# Phase 01 — Executor capability profile, trust, và HOME của worker

Lease: `executor-profile` | Vào được sau: Phase 00 | Ra khỏi: Phase 02 dựa vào cả ba

## Context

- Thiết kế: [§8.2 readiness](../../docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md), §12b (P7 socket, trust), §12c (P6), Phụ lục capability profile.
- Ràng buộc cài đặt: `AGENTS.md` mục "Install/setup/doctor gate" — thêm phụ thuộc hạ tầng thì phải đăng ký vào `fgos setup` và `src/setup/checks.mjs`.
- Ranh giới worker: [worker/provider boundary](../../docs/architect/proposals/coordination-worker-provider-boundary.md).

## Requirements

R1. Mechanism khai capability tường minh trong config, không suy diễn trong adapter:

```yaml
mechanism: herdr-spawn
lifecycleOwner: dispatch
visibilityTransport: herdr
capabilities: { interactive: true, observe: true, contact: {channels:[system], kinds:[exit]}, interrupt: false, checkpoint: false, resume: reattach-or-relaunch }
promptDelivery: file-pointer | inline
trustStore: { kind: 'claude-json' } | null
receipt: receiver-written-file
```

R2. Capability nào mechanism không khai thì caller hỏi tới phải nhận **refusal có type**
(`{refused: {capability, reason}}`), không bao giờ im lặng bỏ qua hay tự chế đường thay thế.

R3. Trust pre-seed chạy trước `agent start`, và chỉ chạy khi cả hai đúng:
- path cần seed do chính fgOS tạo trong lượt dispatch này;
- repo root của path đó **đã** được tin sẵn trong store.
Không thoả thì không seed và refuse có lý do, không bao giờ tự tin một path lạ.

R4. Ghi trust là atomic (tmp rồi rename), idempotent, và **fail loud** khi schema đổi
(không tìm thấy `projects` hay `hasTrustDialogAccepted`) thay vì âm thầm bỏ qua.

R5. Entry trust bị xoá khi worktree teardown. Store hiện đã 145 entry; V0 không được làm nó phình vô hạn.

R6. Worker chạy với HOME riêng cho mỗi Run, không dùng HOME thật của người.
Điều này đóng luôn hai thứ: lỗ socket herdr của P7, và private-scratch mà P00.1's
Known Limitation đã đòi cho bwrap.

R7. `fgos doctor` có check cho: herdr có trên PATH, integration của agent kind đang dùng
có `current` không, và trust store có đọc/ghi được không.

## Files

Sửa:
- `.fgos/config.json` — schema executor mới. **Không commit từ worker branch** (ADR0020); land bằng commit thẳng trên main checkout như tiền lệ `tsk-2ii`/`tsk-4zi`.
- `src/runner/dispatch/config.mjs` — validate các field mới.
- `src/runner/dispatch/resolve.mjs` — trả capability profile ra cùng invocation.
- `src/setup/registrations.mjs` — đăng ký ba check của R7.

Tạo:
- `src/runner/dispatch/trust-store.mjs` — một cửa duy nhất đọc/ghi/gỡ trust, không ai khác chạm `~/.claude.json`.
- `src/runner/dispatch/worker-home.mjs` — dựng và dọn HOME riêng cho một Run.
- `test/runner/dispatch-trust-store.test.mjs`, `test/runner/dispatch-worker-home.test.mjs`, `test/setup/visibility-checks.test.mjs`.

Không đụng: `transport.mjs` (Phase 02), `cli-spawn`, `herdr-plugin/`.

## Steps

1. Chạy impact analysis trên `resolveExecutorConfig` và `loadRunnerConfig` trước khi sửa; báo blast radius.
2. Viết test đỏ trước cho từng invariant R3, R4, R5 — đặc biệt ca "root chưa được tin thì refuse".
3. Cài `trust-store.mjs` với fixture `~/.claude.json` giả, không bao giờ đụng file thật trong test.
4. Cài `worker-home.mjs`. **Trả lời câu hỏi mở số 3 trước khi đi tiếp**: dựng HOME rỗng rồi khởi động claude thật một lần, ghi lại nó cần tối thiểu những gì (auth, config, cache). Nếu không khởi động nổi với HOME rỗng, ghi rõ mức tối thiểu phải bind và tại sao, đừng lặng lẽ quay về HOME thật.
5. Mở rộng schema config + resolve, giữ mọi executor cũ hợp lệ không sửa một dòng.
6. Đăng ký doctor check.

## Validation

- `node --test test/runner/dispatch-*.test.mjs test/setup/*.test.mjs` xanh.
- `npm test` xanh, không sửa assertion nào của `cli-spawn`.
- Một lần chạy tay: seed trust cho một worktree dùng một lần, `agent start` đạt `idle`, rồi teardown và xác nhận entry đã biến mất và store về đúng số cũ.
- `fgos doctor` báo đúng khi gỡ herdr khỏi PATH tạm thời.

## Risks and rollback

- **Ghi hỏng `~/.claude.json` của người dùng.** Chặn: backup trước mỗi ghi trong dev, atomic rename, test chỉ chạy trên fixture. Rollback: file backup, và entry luôn xoá được bằng key path chính xác.
- **HOME riêng làm agent không khởi động được.** Đây là câu hỏi mở, không phải giả định. Nếu bước 4 chứng minh không khả thi trong ngân sách phase này, dừng lại, ghi capability profile là `unsafe: worker-can-drive-cockpit`, và đưa HOME isolation thành item riêng — đừng để Phase 02 xây trên một tiền đề chưa chứng minh.
- **Schema config mới làm executor cũ vỡ.** Chặn: mọi field mới optional, test cũ không sửa.
