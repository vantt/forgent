# Phase 00 — Worker trong worktree không còn chạy hook hỏng

Lease: `worker-hook-neutral` | Vào được sau: điều kiện vào track | Item: `tsk-hem`

## Context

Phase này không đụng dispatch. Nó sửa một lỗi đang sống của repo mà V0 tình cờ phơi ra.

Đo được 2026-09-06 trong một pane herdr với agent claude thật ở worktree dùng một lần:
mọi turn kết thúc bằng `Stop hook error: Cannot find module '<wt>/.claude/hooks/cook-after-plan-reminder.cjs'`.
Chi tiết: [§12c dòng F19](../../docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md).

## Root cause, đã xác minh

| Sự thật | Bằng chứng |
|---|---|
| `.claude/settings.json` **được track** nên vào mọi worktree | `git ls-files --error-unmatch` trả 0 |
| Nó đăng ký **23** hook, trong đó **21** trỏ `${CLAUDE_PROJECT_DIR}/.claude/hooks/*.cjs` | đọc trực tiếp `hooks` key |
| `.gitignore:58` là `/.claude/*` với ngoại lệ chỉ cho `skills/`, `settings.json`, `agents/` | đọc `.gitignore` |
| Nên **0** script hook nào được track | `git ls-files .claude/hooks` rỗng |
| Trong worktree, `.claude/hooks` **không tồn tại** | `ls` trong worktree |
| 2 registration còn lại trỏ `scripts/*.mjs`, đều được track, nên vẫn chạy | `git ls-files scripts` |

Tức là: cấu hình được chia sẻ, phần thực thi thì không. Đó là mâu thuẫn, không phải một lỗi ngẫu nhiên.

Bốn trong 21 cái là `PreToolUse` (`privacy-block`, `scout-block`, `descriptive-name`, cộng
`dispatch-decide-hook` nhưng cái này track nên không sao). Lần đo vừa rồi chỉ thấy Stop hook
lỗi non-blocking, nhưng một hook `PreToolUse` crash có thể chặn tool call.

## Requirements

R1. Trong một worktree không có `.claude/hooks/`, **không** hook nào sinh lỗi. Im lặng, không crash.

R2. Trong main checkout nơi script có mặt, hành vi **không đổi một chút nào**: hook nào chạy hôm nay vẫn chạy, mã thoát vẫn nguyên, hook chặn được vẫn chặn được.

R3. Không track thêm artifact do kit sinh ra. `.claude/hooks/*.cjs` vẫn ignored.

R4. Không dùng cách "import trong tiến trình" để tiết kiệm process: **3 trong 14** script có
`require.main === module` guard (`usage-quota-cache-refresh`, `privacy-block`, `secret-output-guardrail`).
Import chúng sẽ im lặng không chạy — tệ hơn crash, vì crash thì thấy còn im lặng thì không.
`privacy-block` là hook bảo mật; một cách sửa làm nó lặng lẽ không chạy là không chấp nhận được.

R5. Không script hook nào hiện kiểm tra biến môi trường để tự bỏ qua, nên không có đường
"đặt marker rồi hook tự im" mà không sửa chính các script do kit sở hữu. Phase này không sửa chúng.

## Hai cách cài, chọn theo một sự thật phải xác minh trước

**Câu hỏi chặn:** command của hook có được chạy qua shell không?
Trên máy này **không** registration nào ở bất kỳ settings file nào dùng cú pháp shell, nên
không có bằng chứng thực nghiệm sẵn. Phải xác minh từ tài liệu Claude Code trước khi chọn.

**Cách A — guard bằng shell, nếu command chạy qua shell.**
```
P="${CLAUDE_PROJECT_DIR}/.claude/hooks/X.cjs"; [ -f "$P" ] || exit 0; exec node "$P"
```
Không thêm tiến trình nào (`exec` thay thế shell), stdin và mã thoát đi qua nguyên vẹn.
Giá phải trả: 21 chuỗi dài lặp lại trong settings.json.

**Cách B — shim được track, nếu command bị tách argv.**
`node "${CLAUDE_PROJECT_DIR}/scripts/optional-hook.mjs" ".claude/hooks/X.cjs"` —
cùng hình dạng argv với command hiện tại nên chắc chắn chạy. Shim **spawn** (không import,
theo R4) với `stdio: 'inherit'` rồi thoát theo đúng mã của con.
Giá phải trả: thêm một lần khởi động node cho mỗi lần hook chạy, đáng kể với `PostToolUse` matcher `*`.

Chọn A nếu shell được xác nhận; nếu không thì B.

## Files

Sửa: `.claude/settings.json` (21 registration).
Tạo, chỉ khi chọn cách B: `scripts/optional-hook.mjs`, `test/scripts/optional-hook.test.mjs`.

Không đụng: `.claude/hooks/*.cjs` (kit sở hữu), `.gitignore`, `src/`.

## Steps

1. Xác minh câu hỏi chặn từ tài liệu Claude Code, ghi câu trả lời vào `reports/`.
2. Chọn A hoặc B theo câu trả lời đó.
3. Sửa 21 registration. Giữ nguyên 2 cái trỏ `scripts/`.
4. Nếu B: viết shim, test rằng nó chuyển tiếp đúng mã thoát 0, 1, và 2, và im lặng thoát 0 khi file vắng.

## Validation

- **Chứng minh âm, bắt buộc live**: dựng một worktree dùng một lần, chạy một agent claude trong pane herdr, hoàn thành một turn, xác nhận **không** dòng hook error nào trên màn hình. Đây chính là phép đo đã phát hiện lỗi, chạy lại phải sạch.
- **Chứng minh dương, bắt buộc live**: trong main checkout, kích một hook chặn được (ví dụ `descriptive-name` với một tên file xấu) và xác nhận nó **vẫn chặn**.
- `npm test` xanh.

## Risks and rollback

- **Sửa hỏng `settings.json` làm gãy phiên đang chạy của chính người dùng.** Đây là rủi ro thật vì file này có hiệu lực ngay. Chặn: backup trước, sửa một registration trước rồi kiểm chứng, sau đó mới sửa 20 cái còn lại.
- **Chọn nhầm cách A khi command không qua shell** sẽ làm mọi hook hỏng cùng lúc. Chặn: bước 1 là điều kiện chặn, không được đoán.
- **Rollback**: `settings.json` nằm trong git, hoàn nguyên một file là xong; shim nếu có thì không ai gọi nữa.

## Ghi chú phạm vi

Có một cách sửa khác, rộng hơn, mà phase này **không** làm: tách hẳn hai loại registration —
hook do kit cài thì khai trong `.claude/settings.local.json` (đã tồn tại, đã ignored, hiện chỉ có
`enabledPlugins`), còn `settings.json` được track chỉ giữ hook trỏ file được track. Cách đó
sạch hơn về mặt khái niệm nhưng đổi chính sách chia sẻ cấu hình của repo và làm người dùng
mất hook trong worktree của chính họ. Đó là quyết định của người, không phải của phase này.
