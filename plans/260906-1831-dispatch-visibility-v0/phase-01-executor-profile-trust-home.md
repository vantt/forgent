# Phase 01 — Executor capability profile, trust, và HOME của worker

Lease: `executor-profile` | Vào được sau: Phase 00 | Ra khỏi: Phase 02 dựa vào cả ba

## Context

- Thiết kế: [§8.2 readiness](../../docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md), §12b (P7 socket, trust), §12c (P6), Phụ lục capability profile.
- Ràng buộc cài đặt: `AGENTS.md` mục "Install/setup/doctor gate" — thêm phụ thuộc hạ tầng thì phải đăng ký vào `fgos setup` và `src/setup/checks.mjs`.
- Ranh giới worker: [worker/provider boundary](../../docs/architect/proposals/coordination-worker-provider-boundary.md).

## Requirements

R0. **Permission posture khai trong profile, không bao giờ thừa hưởng từ shell** — đo và
chứng minh 2026-09-06, xem
[permission-posture-findings](../../docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md).
herdr **không** tự thêm `--dangerously-skip-permissions`; cờ đó trên máy này đến từ
`~/.zshrc:148` (`alias claude=...`), và dialog chấp thuận một lần của nó bị chặn bởi
`~/.claude/settings.json`'s `skipDangerousModePermissionPrompt`. Hai dòng fgOS không nhìn
thấy, trong hai file fgOS không sở hữu. Adapter phải truyền posture tường minh qua
`agent start -- <args>`.

R0b. **Bypass chỉ hợp lệ khi có confinement.** Trong profile:

```yaml
permissionMode: ask | bypass
confinement: { privateHome: true, isolatedSession: true, ownWorktree: true }
```

`permissionMode: bypass` đòi đủ ba cờ confinement; thiếu thì **config load từ chối, có tên
lỗi rõ ràng** — một invariant kiểm được, không phải một dòng bình luận. Khai `bypass` cũng
kéo theo nghĩa vụ: provisioner phải ghi `skipDangerousModePermissionPrompt: true` vào
`settings.json` của HOME riêng, thiếu thì agent dừng ở dialog chấp thuận.

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

R6. **Đã đo lại 2026-09-06, phát biểu cũ sai và đã sửa** — xem
[findings](../../docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/findings.md).
Worker chạy với HOME riêng cho mỗi Run: giữ, vì nó đóng được đường `$HOME/.config/herdr`
và đồng thời là private-scratch mà P00.1's Known Limitation đã đòi cho bwrap — một cơ
chế giải hai bài. Nhưng nó **không đủ**: `HERDR_SOCKET_PATH` do herdr tự tiêm và không
thể xoá hay chuyển hướng bằng `--env`, đã chứng minh hai lần (giá trị rỗng ở P7, giá trị
giả khác rỗng ở probe D). Chừng nào worker còn chạy trong một pane thuộc session herdr
của người vận hành thì nó còn chạm được cockpit. Cô lập worker vì vậy **không phải bài
toán biến môi trường mà là bài toán topology session**. Ba phương án còn lại, theo chi
phí tăng dần: session herdr riêng cho worker, mount namespace bằng `bwrap`, hoặc user OS
riêng. Phase này phải chọn và chứng minh một trong ba trước khi Phase 02 dựa vào.

R6b. **Đã chọn và đã đo 2026-09-06** — xem
[session-findings](../../docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/session-findings.md).
Phương án là **session herdr riêng cho worker**, cộng HOME riêng của R6. Đo được:
`herdr --session <tên> server` khởi headless, có socket riêng; pane tạo trong đó nhận
`HERDR_SESSION` và socket **của chính session đó**; từ trong nhìn ra chỉ thấy pane của nó,
trong khi cockpit người vận hành có 18 pane. Teardown bằng `session stop` rồi
`session delete`, không để lại gì.

R6c. Giới hạn phải ghi thẳng, không được tô hồng: đây là **ranh giới định tuyến, không
phải ranh giới namespace**. Một worker gọi thẳng đường socket tuyệt đối của người vận hành
vẫn thấy đủ 18 pane (đã đo). Đủ để chặn trôi dạt — đúng mối đe dọa mà ADR-0005 xác định và
đúng hình dạng sự cố `tsk-1nih` từng xảy ra. Không đủ để chặn nhắm có chủ đích; muốn chặn
cái đó phải `bwrap` hoặc user OS riêng, và chưa mối đe dọa nào quan sát được biện minh cho
chi phí đó.

R6d. Giá phải trả là khả năng quan sát: `herdr session attach` **bị từ chối** khi chạy
trong một pane của session khác (`nested herdr is disabled by default`). Người xem worker
bằng một cửa sổ terminal thứ hai, hoặc bật cờ thử nghiệm `[experimental] allow_nested`.
Đây là quyết định của người vận hành, không phải mặc định phase này tự đặt.

R6e. Dùng `HERDR_SESSION` làm **assertion** chứ không phải quy ước: trước khi khởi worker,
adapter từ chối nếu session đích trùng session của người vận hành.

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
4. Cài `worker-home.mjs`. **Câu hỏi mở số 3 đã trả lời 2026-09-06** — xem
   [agent-in-session-findings](../../docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/agent-in-session-findings.md).
   HOME rỗng là HOME hỏng, không phải HOME riêng. Bốn thứ bắt buộc provision, mỗi thứ tìm
   ra bằng cách vấp phải nó: `.zshrc` dù rỗng (thiếu thì zsh chạy wizard lần đầu và ăn mất
   ký tự đầu của lệnh khởi động, `claude` thành `laude`); `.claude/.credentials.json`;
   `.claude.json` với `hasCompletedOnboarding` cộng theme (thiếu thì agent kẹt ở wizard
   onboarding **trong khi herdr báo `idle` và `interactive_ready`**); và entry trust cho cwd.
   Thứ năm chưa chốt: **permission posture** — trong session của người vận hành herdr tự
   thêm `--dangerously-skip-permissions`, trong session cô lập thì không, nên agent dừng ở
   dialog xin quyền. Phải khai tường minh trong executor profile, không để phụ thuộc vào
   việc nó tình cờ khởi trong session nào. Việc worker cầm credential của người vận hành
   **không** được HOME riêng giải quyết; đó vẫn là khoảng trống `coordination-worker-provider-boundary.md`
   đã nêu, để dành cho relay.
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
