# Codex CLI sandbox — research briefing (for anh's own follow-up research)

Bối cảnh: tsk-4kh thử wire `codex` (OpenAI Codex CLI, codex-cli 0.146.0)
làm executor mới cho fgOS, học từ kinh nghiệm tsk-1xm (agy). Đã live-test
kỹ, tìm ra một giới hạn thật, cụ thể — dừng ở đây để anh tự đào sâu nếu
muốn. Bằng chứng đầy đủ, từng lệnh từng output, nằm ở
`docs/history/codex-permission-capability-boundary/RESEARCH.md` (3 vòng,
đã commit vào `fgw/tsk-4kh`) — file này chỉ là bản tóm tắt định hướng.

## Đã chứng minh (live, không suy đoán)

1. **`codex exec -s workspace-write` là sandbox thật, cấp OS, không phải
   agent tự phán như agy.** Ghi file ngoài workspace bị chặn ở tầng
   filesystem (`read-only file system`), gọi mạng bị chặn ở tầng DNS
   (`curl: (6) Could not resolve host`) — không phải logic của agent
   chọn không làm, mà kernel/sandbox thật sự từ chối syscall.
2. **`codex sandbox -- <cmd>`** chạy một lệnh trực tiếp qua sandbox,
   KHÔNG tốn LLM turn nào (~38ms, exit code sạch) — hữu ích để tự test
   nhanh mà không tốn quota.
3. **Với một linked worktree (`fgw/<id>`, đúng hình dạng fgOS dùng),
   `git add` cần CẢ HAI cờ `--add-dir` riêng biệt:**
   - `--add-dir <git rev-parse --git-dir>` (thư mục quản trị riêng của
     worktree, VD `.../worktrees/tsk-4kh-qXtpCj`)
   - `--add-dir <git rev-parse --git-common-dir>` (thư mục `.git` gốc
     của main checkout, chứa object database dùng chung)

   Chỉ truyền MỘT trong hai — kể cả cái "rộng hơn" — không đủ. Phải cả
   hai, tách rời, mới thấy `git add` chạy (exit 0, `git status` xác nhận
   file đã staged).

## Giới hạn thật, chưa có cách vượt qua

**`git commit` vẫn thất bại** — không phải vì đường dẫn, mà vì
**sandbox chặn spawn tiến trình con**. Repo này có pre-commit hook viết
bằng Node.js, và hook đó tự spawn một tiến trình `git` con qua
`child_process.spawnSync`. Tiến trình con đó bị **EPERM**, dù chính lệnh
`git commit` gọi trực tiếp (không qua spawn lồng) chạy bình thường.

Đã tự confirm đây là giới hạn CHUNG, không riêng gì pre-commit hook: chạy
thử `node -e "require('child_process').spawnSync('git', [...])"` như
lệnh top-level — vẫn EPERM y hệt. Kết luận: sandbox của codex chỉ cấp
quyền đầy đủ cho đúng tiến trình được gọi trực tiếp; bất kỳ tiến trình
nào tiến trình đó tự spawn ra (không phải built-in của shell) đều bị
chặn thực thi, bất kể `--add-dir` gì.

## Đã thử, không ra manh mối thêm (để anh không lặp lại)

- `codex --help`/`codex exec --help`/`codex sandbox --help` — không có
  cờ nào riêng cho "cho phép spawn tiến trình con".
- `codex features list` (miễn phí, không LLM) — quét toàn bộ feature
  flag. Hai cái đáng chú ý:
  - `codex_git_commit` — **removed, false** (từng có cơ chế commit
    "native" riêng, đã bị gỡ — không rõ lý do, đáng để anh tra changelog
    xem thay bằng gì).
  - `use_linux_sandbox_bwrap` — **removed, false** (gợi ý sandbox hiện
    tại KHÔNG dùng bubblewrap nữa — có thể đang dùng Landlock/seccomp
    trực tiếp, đúng kiểu cơ chế hay có giới hạn "chỉ tiến trình gọi trực
    tiếp được cấp quyền, con thì không").
  - `exec_permission_approvals` — **under development, false** — TÊN
    nghe rất đúng hướng (permission cho từng lệnh exec), nhưng chưa bật
    ở bản 0.146.0. Đáng theo dõi ở release sau.
- `~/.codex/config.toml` không có `sandbox_permissions` nào set sẵn;
  `codex --help` chỉ cho một ví dụ duy nhất
  (`sandbox_permissions=["disk-full-read-access"]`) — chưa biết hết các
  giá trị hợp lệ trong enum đó, có thể có giá trị liên quan tới
  process-spawn mà help text không liệt kê đủ.

## Hướng để anh tự đào tiếp (nếu muốn quay lại item này)

1. **Tìm full enum của `sandbox_permissions`** — không thấy trong
   `--help`. Có thể phải đọc source code thật của codex-cli (repo GitHub
   chính thức của OpenAI, `openai/codex` hoặc tên tương đương) hoặc tài
   liệu chính thức, tìm struct Rust/Go định nghĩa các permission string
   hợp lệ.
2. **Tìm hiểu sandbox backend thật đang dùng** (Landlock? seccomp-bpf
   trực tiếp? gì khác?) — `use_linux_sandbox_bwrap: removed` là manh
   mối duy nhất hiện có. Biết đúng cơ chế mới đoán được có config nào
   nới được rule "chặn nested exec" hay không, hay đó là giới hạn cứng
   của chính cơ chế.
3. **Theo dõi `exec_permission_approvals`** — release note của codex-cli
   các bản sau 0.146.0, xem feature này có bật không và giải quyết đúng
   vấn đề gì.
4. **Cân nhắc hướng khác hẳn permission**: thay vì bắt codex tự
   `git commit`, để chính runner của fgOS làm bước git add/commit sau khi
   codex trả lời (bước cơ học, không qua sandbox, không qua LLM) — anh
   đã từ chối hướng này lúc quyết định dừng item, nhưng nếu sau này đổi
   ý, đây là hướng khả thi nhất theo bằng chứng đã có, không phải đoán.

## Item liên quan

- `tsk-4kh` — item vừa dừng, ghi `wontfix` với đúng lý do trên.
- `tsk-1xm` — item tương tự cho `agy`, đã ship (denylist, không phải
  allowlist thật) — `docs/history/agy-permission-capability-allowlist/`.
