# Approach: Repo Divorce

## Recommended path

Di trú bằng **script có checkpoint, diễn tập trước trên bản sao** thay vì gõ lệnh tay: (1) viết `scripts/repo-divorce.mjs` (zero-dep, tài sản xưởng) với `--dry-run` in kế hoạch từng bước và `--execute` chạy thật, mỗi bước kiểm điều kiện trước/sau, dừng ngay khi lệch; (2) soạn sẵn nội dung doctrine hai bên (AGENTS.md/CLAUDE.md xưởng rút về bee + luật xưởng; bản `./repo` chỉ nói forgent) như file staged; (3) validating DIỄN TẬP TRỌN VẸN script trên bản sao đầy đủ workspace trong /tmp — mọi proof phải xanh trên bản sao TRƯỚC khi được phép chạy thật (per D1–D4, luật crash-recovery-cần-test-giết-thật áp tinh thần: rehearsal thật, không fixture); (4) execution chạy script thật + proof suite. Thứ tự bước trong script (SỬA sau feasibility probe): move NGUYÊN KHỐI workspace + `.git` vào `repo/` (move-một-phần để lại dòng D trong status — probe chứng minh) → swap doctrine + reading-map → `rm --cached` phần xưởng + `.gitignore` + MỘT commit untrack (điểm-không-quay-lại, xác nhận tường minh) → BƯỚC TÁCH: move thư mục xưởng từ repo/ ngược lên gốc ở mức filesystem (kèm đồ ignored của xưởng; đồ ignored sản phẩm ở lại) → `git init` xưởng + commit khởi tạo → sửa commands (text-edit, config hiện không strict-JSON).

## Rejected alternatives

- Gõ lệnh tay từng bước — không lặp lại được trên bản sao để diễn tập, không checkpoint, đúng loại thao tác gây mất dữ liệu.
- filter-repo — bị D1 loại.
- Di trú từng phần nhiều đợt — kéo dài trạng thái nửa-nạc-nửa-mỡ, mỗi đợt một lần rủi ro; một script một đợt có diễn tập là gọn nhất.

## Risk map

| Component | Risk | Reason | Proof needed |
|---|---|---|---|
| Move cây + .git nguyên khối | HIGH (data-loss-shaped) | sai một path là working tree lệch index | diễn tập trên bản sao: sau move, `git -C repo status` sạch (layout khớp index), suite 234/234 trong repo |
| Commit untrack | MEDIUM | gỡ nhầm file sản phẩm khỏi tracking | dry-run in đủ danh sách từ `git ls-files` (không đoán); sau commit: `git ls-files` chỉ còn path sản phẩm |
| Doctrine swap | MEDIUM | phiên bee sau đó mất luật hoặc nhiễm chéo | sau swap: onboard check tại xưởng vẫn `up_to_date`; AGENTS.md repo không còn khối bee |
| bee tiếp tục vận hành | MEDIUM | commands/verify đổi cwd | chạy nguyên văn chuỗi verify mới (critical pattern); một cell bee smoke trọn vòng ghi vào ./repo |
| Runner/fgos chỗ mới | LOW | code đã cwd-relative | `cd repo && fgos ready` + `fgos-runner --dry-run` |
| GitNexus/khối phụ | LOW | index cũ, block CLAUDE.md | bước dọn cuối theo A3 |

## Files and order

`scripts/repo-divorce.mjs` (mới) → nội dung doctrine staged (mới) → chạy script (mutate toàn workspace theo D2) → `.bee/config.json` commands → proof suite. Danh sách move đầy đủ sinh từ `git ls-files` lúc chạy, đối chiếu bảng D2 — không hardcode danh sách trong plan.

## Relevant learnings

- Verify chạy nguyên văn (20260714-p1) — mọi chuỗi lệnh mới phải được thực thi thật ở validating.
- Test giết-thật cho crash-path (20260714-p2) — áp tinh thần: diễn tập di trú là chạy THẬT script trên bản sao thật, không phải đọc kế hoạch.
- Worktree cleanup từ repo gốc (validation-s1) — script mọi lệnh git chạy với `-C <path>` tường minh, không cd lung tung.

## Questions for validating

- Bản sao diễn tập: `cp -a` đủ hay cần `git clone` riêng cho .git? (cp -a giữ nguyên .git là sát thật nhất — xác nhận bằng chính rehearsal)
- Chuỗi verify mới chính xác (đường distill từ xưởng) — chốt bằng chạy thật.
- 2 review candidates sau commit untrack: `reviews status` báo stale thế nào — quan sát thật trên bản sao.
