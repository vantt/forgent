# Phase 01 — Executor profile, trust, và nhốt worker

Lease: `executor-profile` | Vào được sau: Phase 00 | Phase 02 dựa vào cả ba nhóm A, B, C

## Context

- Thiết kế: [§8.2 readiness, Phụ lục capability profile](../../docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md)
- Bằng chứng của phase này, đo 2026-09-06, mỗi cái một trang riêng dưới
  `docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/`:
  [env và socket](../../docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/findings.md) ·
  [session cô lập](../../docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/session-findings.md) ·
  [agent trong session cô lập](../../docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/agent-in-session-findings.md) ·
  [permission posture](../../docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md)
- Ràng buộc cài đặt: `AGENTS.md` mục "Install/setup/doctor gate" — thêm phụ thuộc hạ tầng
  thì phải đăng ký vào `fgos setup` và `src/setup/checks.mjs`.
- Ranh giới worker: [worker/provider boundary](../../docs/architect/proposals/coordination-worker-provider-boundary.md).

Phần nghiên cứu của phase này **đã xong**, không còn câu hỏi chặn. Bốn trang bằng chứng ở
trên giữ toàn bộ quá trình đo và cả những kết luận đã bị bác; file này chỉ giữ thứ phải thi hành.

## A. Khai báo capability

A1. Mechanism khai capability tường minh trong config, adapter không suy diễn:

```yaml
mechanism: herdr-spawn
lifecycleOwner: dispatch
visibilityTransport: herdr
capabilities: { interactive: true, observe: true, contact: {channels:[system], kinds:[exit]}, interrupt: false, checkpoint: false, resume: reattach-or-relaunch }
promptDelivery: file-pointer | inline
trustStore: { kind: 'claude-json' } | null
receipt: receiver-written-file
permissionMode: ask | bypass
confinement: { privateHome: true, isolatedSession: true, ownWorktree: true }
```

A2. Capability nào mechanism không khai thì caller hỏi tới nhận **refusal có type**
(`{refused: {capability, reason}}`), không bao giờ im lặng bỏ qua hay tự chế đường thay thế.

A3. Mọi field mới là optional. Executor đang có phải còn hợp lệ mà không sửa một dòng nào.

## B. Trust store

B1. Trust pre-seed chạy trước `agent start`, và chỉ khi cả hai đúng: path cần seed do chính
fgOS tạo trong lượt dispatch này, và repo root của path đó **đã** được tin sẵn. Không thoả
thì refuse có lý do — trust là **dẫn xuất**, không bao giờ tự bịa cho một path lạ.

B2. Ghi là atomic (tmp rồi rename), idempotent, và **fail loud** khi schema đổi (không thấy
`projects` hay `hasTrustDialogAccepted`) thay vì âm thầm bỏ qua.

B3. Entry bị xoá khi worktree teardown. Store trên máy dev đã 145 entry; V0 không được làm
nó phình vô hạn.

B4. Một cửa duy nhất chạm `~/.claude.json`. Không module nào khác được mở file đó.

## C. Nhốt worker

Ba lớp dưới đây là **một cơ chế**, không phải ba tuỳ chọn rời. Khai một lớp mà thiếu lớp
kia là lỗi cấu hình, không phải một lựa chọn hợp lệ.

C1. **HOME riêng mỗi Run**, và HOME đó phải được **provision**, không phải chỉ rỗng. Năm mục
bắt buộc, mỗi mục tìm ra bằng cách vấp phải chính nó:

| Mục | Thiếu thì |
|---|---|
| `.zshrc` (file rỗng là đủ) | zsh chạy wizard lần đầu, ăn mất ký tự đầu của lệnh khởi động: `claude` thành `laude` |
| `.claude/.credentials.json` | không có auth |
| `.claude.json` `hasCompletedOnboarding` + theme | agent kẹt ở wizard onboarding **trong khi herdr báo `idle` và `interactive_ready`** |
| `.claude.json` `projects[cwd].hasTrustDialogAccepted` | dialog tin thư mục |
| `.claude/settings.json` `skipDangerousModePermissionPrompt` | `--dangerously-skip-permissions` dừng ở màn hình chấp thuận một lần |

C2. **Session herdr riêng cho worker.** `herdr --session <tên> server` khởi headless, có
socket riêng; pane tạo trong đó nhận `HERDR_SESSION` và socket của chính session đó, và từ
trong chỉ thấy pane của nó. Teardown bằng `session stop` rồi `session delete`.

C3. **`HERDR_SESSION` là assertion, không phải quy ước.** Trước khi khởi worker, adapter từ
chối nếu session đích trùng session của người vận hành.

C4. **Permission posture khai trong profile, không bao giờ thừa hưởng từ shell.** herdr
không tự thêm `--dangerously-skip-permissions`; trên máy dev cờ đó đến từ một alias trong
`~/.zshrc` cộng một key trong `~/.claude/settings.json` — hai dòng fgOS không nhìn thấy,
trong hai file fgOS không sở hữu. Adapter truyền posture tường minh qua `agent start -- <args>`.

C5. **`permissionMode: bypass` đòi đủ ba cờ `confinement`.** Thiếu thì **config load từ chối,
có tên lỗi rõ ràng** — invariant kiểm được, không phải một dòng bình luận. Khai `bypass`
cũng kéo theo nghĩa vụ ghi `skipDangerousModePermissionPrompt` vào HOME riêng (C1 mục 5).

C6. **Giới hạn phải ghi thẳng, không tô hồng.** C2 là **ranh giới định tuyến, không phải
namespace**: worker gọi thẳng đường socket tuyệt đối của người vận hành vẫn thấy đủ pane
cockpit. Đủ chặn trôi dạt — đúng mối đe dọa ADR-0005 xác định và đúng hình dạng sự cố
`tsk-1nih`. Không đủ chặn nhắm có chủ đích; muốn thế phải `bwrap` hoặc user OS riêng, và
chưa mối đe dọa nào quan sát được biện minh cho chi phí đó.

C7. **Giá phải trả là khả năng quan sát**, ghi rõ để không ai tưởng là miễn phí:
`herdr session attach` bị từ chối khi chạy trong pane của session khác. Người xem worker
bằng cửa sổ terminal thứ hai, hoặc bật `[experimental] allow_nested`. Đây là quyết định
của người vận hành, phase này không tự đặt mặc định.

C8. **Ngoài phạm vi, nêu để không tưởng đã giải:** worker vẫn cầm credential của người vận
hành, vì credential buộc phải với tới được thì worker mới chạy. HOME riêng không giải bài
này. Đó là khoảng trống `coordination-worker-provider-boundary.md` đã nêu, để dành cho relay.

## D. Doctor

D1. `fgos doctor` kiểm: herdr có trên PATH; integration của agent kind đang dùng có `current`
không; trust store đọc/ghi được không; và mọi executor khai `bypass` có đủ ba cờ confinement không.

## Files

Sửa:
- `.fgos/config.json` — schema executor mới. **Không commit từ worker branch** (ADR0020); land bằng commit thẳng trên main checkout như tiền lệ `tsk-2ii`/`tsk-4zi`.
- `src/runner/dispatch/config.mjs` — validate field mới, và invariant C5.
- `src/runner/dispatch/resolve.mjs` — trả capability profile ra cùng invocation.
- `src/setup/registrations.mjs` — bốn check của D1.

Tạo:
- `src/runner/dispatch/trust-store.mjs` — cửa duy nhất của B4.
- `src/runner/dispatch/worker-home.mjs` — dựng và dọn HOME riêng, provision đủ năm mục C1.
- `src/runner/dispatch/worker-session.mjs` — khởi, kiểm và dọn session herdr riêng (C2, C3).
- `test/runner/dispatch-trust-store.test.mjs`, `test/runner/dispatch-worker-home.test.mjs`,
  `test/runner/dispatch-worker-session.test.mjs`, `test/setup/visibility-checks.test.mjs`.

Không đụng: `transport.mjs` (Phase 02), `cli-spawn`, `herdr-plugin/`.

## Steps

1. Impact analysis trên `resolveExecutorConfig` và `loadRunnerConfig`; báo blast radius trước khi sửa.
2. Test đỏ trước cho B1, B2, B3 và C5 — đặc biệt hai ca từ chối: "root chưa được tin" và "bypass thiếu confinement".
3. `trust-store.mjs`, test chỉ chạy trên fixture, không bao giờ đụng file thật.
4. `worker-home.mjs` provision đủ năm mục C1.
5. `worker-session.mjs`, gồm assertion C3.
6. Mở rộng schema config và resolve theo A1, A3; cài invariant C5 tại chỗ load.
7. Đăng ký doctor check D1.

## Validation

- `node --test test/runner/dispatch-*.test.mjs test/setup/*.test.mjs` xanh.
- `npm test` xanh, không sửa một assertion nào của `cli-spawn`.
- **C5 phải từ chối được**: một executor khai `bypass` mà thiếu một cờ confinement làm config load fail với tên lỗi đúng.
- **C1 phải đủ**: bỏ đi từng mục một trong năm mục và xác nhận nó hỏng đúng kiểu ghi ở bảng — đây là test chống hồi quy cho một danh sách được rút ra từ năm lần vấp.
- **C2/C3 phải chặn được**: một worker trong session riêng không liệt kê được pane của người vận hành qua đường mặc định, và adapter từ chối khi session đích là session người vận hành.
- Một lần chạy tay trọn vòng: seed trust, `agent start` đạt ready, một turn thật để lại artifact, rồi teardown và xác nhận trust entry lẫn session đều biến mất.
- `fgos doctor` báo đúng khi gỡ herdr khỏi PATH tạm thời.

## Risks and rollback

- **Ghi hỏng `~/.claude.json` của người dùng.** Chặn: atomic rename, một cửa duy nhất (B4), test chỉ trên fixture. Rollback: entry luôn xoá được bằng key path chính xác.
- **Session riêng bị bỏ quên chạy nền.** Chặn: teardown trong cùng đường thoát với worktree; doctor liệt kê session `fgos-*` còn sống. Đây là đúng bệnh mà `process-management.md` của repo cảnh báo.
- **Khai `bypass` mà quên confinement.** Chặn bằng C5 tại config load, không phải bằng review.
- **Schema mới làm executor cũ vỡ.** Chặn bằng A3 và test cũ không sửa.
- **Rollback toàn phase**: ba module mới chỉ được gọi từ config/resolve; hoàn nguyên chúng cộng schema là quay về hành vi cũ, `transport.mjs` chưa bị đụng ở phase này.
