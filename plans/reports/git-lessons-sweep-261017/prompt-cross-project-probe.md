# Prompt: quét sự cố git trong một project đang dùng fgOS

Dán nguyên phần dưới vào agent trên máy có project cần quét. Thay `<PROJECT_DIR>` bằng đường dẫn tuyệt đối của project, và `<PROJECT>` bằng tên ngắn của nó (ví dụ `forgentx`, `mcp-skill-hub`).

---

Bạn làm một lượt quét **chỉ đọc** trên project `<PROJECT_DIR>`. Không sửa, không commit, không chạy lệnh git nào làm thay đổi repo (không `checkout`, `reset`, `stash`, `clean`, `merge`, `pull`, `worktree add/remove/prune`). Chỉ dùng các lệnh git đọc: `log`, `show`, `status`, `worktree list`, `branch -a`, `diff`, `ls-files`, `check-ignore`.

## Bối cảnh

fgOS là nền vận hành agent, được cài vào nhiều project. Hiện fgOS có nhiều cơ chế git chồng chéo: tạo/dọn worktree, sync base vào nhánh, land (merge chưa commit, verify, abort, CAS lên trunk), commit theo phạm vi ghi, checkpoint event log `.fgos/events*` vào git, khoá main checkout, khoá merge slot, và hook `.githooks/pre-commit`. Chúng sẽ được gom thành **một component git duy nhất viết bằng Rust**. Yêu cầu bắt buộc là mọi sự cố đã gặp và mọi bài học đều phải được mang sang. Nhiệm vụ của bạn là tìm các sự cố và bài học **xảy ra trong project này** mà repo gốc fgOS có thể chưa biết.

## Cần quét

1. **Event store `.fgos/`**:
   - Phần nào được git track, phần nào bị ignore (`git ls-files .fgos`, `git check-ignore -v`), và kích thước từng phần.
   - Trong event log (`.fgos/events.jsonl` và `.fgos/events/*.jsonl` nếu có), tìm item bị `blocked`, các lý do park, kết quả `merge`/`catchup`/`approve`/`sync-root`/`return`, event friction, và các lỗi có chữ `git`, `worktree`, `lock`, `MERGE_HEAD`, `index.lock`, `conflict`, `fgos-write-rejected`, `timeout`.
   - Event log có từng bị mất, bị cắt cụt, bị conflict, hay bị commit nhầm không (xem `git log --stat -- .fgos`).
2. **Lịch sử git:** các commit fix, revert và sửa tay liên quan tới merge, worktree, khoá, `.fgos` (`git log --all --oneline`, `git log -S`/`-G` với các từ khoá trên). Tìm cả dấu hiệu dọn dẹp thủ công sau sự cố, ví dụ commit kiểu "restore events" hay "fix merge".
3. **Worktree và nhánh hiện tại:** `git worktree list` (worktree mồ côi, worktree bẩn, worktree trỏ vào thư mục không còn), các nhánh `fgw/*` không có item tương ứng, nhánh lệch trunk nhiều.
4. **Tài liệu và nhật ký:** `plans/`, `plans/reports/`, `docs/journals/`, `docs/` (nếu có): bất kỳ ghi chép nào về sự cố git, khoá, race, mất dữ liệu, hay làm việc với fgOS bị kẹt.
5. **Log runtime của fgOS** nếu đọc được: `<PROJECT_DIR>/.fgos/logs/`, `<PROJECT_DIR>/.fgos/runtime/`, `~/.fgos/runtime/`. Tìm lỗi liên quan git hoặc khoá.
6. **Khác biệt so với repo gốc:** project này có dùng trunk tên khác `main`, submodule, `--separate-git-dir`, LFS, hook riêng, monorepo, hay Windows/macOS không? Mỗi khác biệt là một rủi ro cho component mới.

## Định dạng report

Ghi report bằng tiếng Việt, câu đầy đủ; tên định danh, đường dẫn và thuật ngữ git giữ nguyên. Ghi vào file:

`<PROJECT_DIR>/fgos-git-probe-<PROJECT>-261017.md`

Đặt ở gốc project để dễ lấy về; đừng commit file này. Cấu trúc:

1. **Tóm tắt:** project, máy, phiên bản fgOS đang dùng (`fgos --version` nếu có), số sự cố tìm được, ba điều quan trọng nhất.
2. **Hiện trạng `.fgos/`:** bảng phần track và phần ignore kèm kích thước, và event log đang ở dạng baseline hay shard.
3. **Bảng sự cố**, mỗi dòng một sự cố, các cột:
   - `X-NNN`;
   - loại (`lock`, `race`, `crash-recovery`, `env-trust`, `parse`, `worktree`, `merge`, `sync`, `commit-scope`, `verify`, `cleanup`, `hook`, `event-store`, `other`);
   - triệu chứng;
   - bằng chứng (file, dòng hoặc id event, commit sha);
   - nguyên nhân gốc nếu biết được;
   - hậu quả (mất dữ liệu, kết quả sai, kẹt, hay vệ sinh);
   - hành vi mà component git mới phải giữ hoặc phải thêm (viết trung lập với cách cài đặt);
   - mức ưu tiên (P0 mất/hỏng dữ liệu; P1 kết quả sai hoặc kẹt; P2 vệ sinh).
4. **Khác biệt môi trường** (mục 6 ở trên) và rủi ro của từng khác biệt.
5. **Những gì không đọc được hoặc không chắc**, kèm lý do.

Không suy đoán thay cho bằng chứng. Mỗi khẳng định phải có nguồn kiểm lại được. Nếu không tìm thấy sự cố nào ở một hạng mục, ghi rõ "không tìm thấy" và cách bạn đã tìm.
