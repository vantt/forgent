# Prompt: nạp và kiểm tra plan documentation-authority-unification để biết nơi tiếp tục

Dán nguyên văn (hoặc đưa đường dẫn file này) vào một phiên chat mới. Phiên này là phiên thi hành riêng của plan; việc đầu tiên của nó là **định hướng và kiểm tra, chỉ đọc**. Nó không chạy phase nào cho tới khi anh cho phép tường minh.

## Bạn là ai và đang ở đâu

- Repo `/home/vantt/projects/forgentX`. Plan **không nằm ở main** mà ở một worktree riêng: `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`, branch `plan/260925-documentation-authority-unification`. Mở và làm việc ở đó. Trạng thái lúc viết prompt (2026-10-06 16:52): commit đầu `50639672a`, cây sạch, branch có 69 commit chưa vào main, main không có commit nào branch chưa có (`git rev-list --left-right --count main...HEAD` ra `0 69`), chưa push. Main có thể đã đi tiếp từ lúc đó (phiên observe vẫn đang làm ở main checkout): đo lại, đừng tin con số này.
- Plan: `plans/260925-documentation-authority-unification/plan.md` (định dạng AgentKit, `status: in-progress`). Mục tiêu: gom các quyền chuẩn tài liệu platform về `docs/platform/**` theo claim, không mất claim, lý do, hợp đồng hay quyết định nào. Phase 1-3 đã xong (có tag). Phase 4-10 chưa được phép chạy.
- Anh đã quyết (2026-10-06): plan này chạy ở **phiên chat riêng của nó (chính là phiên này)**; chat điều tra harness chỉ giữ ý định, không chạy gì. Mọi quyết định của anh đã ghi ở `plan.md` §7.5b.

## Việc phải làm bây giờ: định hướng, chỉ đọc

1. **Nạp theo thứ tự này:** `plan.md` (khối trạng thái ở đầu, §1, §3 quyết định khoá, §5, §7.1 bảng trạng thái từng phase, §7.3 đến §7.7), `phase-04-freeze-the-minimum-constitution-and-migration-method.md` (nhất là mục "Pre-step: gate tooling"), `dropped-claims-register.json`, rồi báo cáo nối lại `plans/reports/resume-261006-1635-doc-authority-unification.md` và thư mục `plans/260925-documentation-authority-unification/reports/resync-261006/` (nhất là `inventory-comparison.json`).
2. **Đọc thêm bối cảnh ở main checkout** (chỉ đọc): `plans/reports/harness-investigation-261006-synthesis.md` (hàng H6 và mục 8), và ba plan sẽ sửa tài liệu cũ: `plans/261006-1415-fgos-single-door-mechanisms/` (Plan A), `plans/261006-1415-fgos-convention-component/` (Plan B), `plans/261006-1445-fgctl-dev-activation/` (Plan C, draft, không phải điều kiện của cutover).
3. **Kiểm bằng lệnh chỉ đọc, ghi lại kết quả** (đếm bằng script hoặc `rtk proxy <lệnh>`, không dùng `grep | wc` qua hook, vì hook `rtk` từng làm một con số rớt từ 3320 xuống 130):
   - `pwd`, `git branch --show-current`, `git status --short` (kỳ vọng rỗng), commit đầu.
   - Main đã đi tiếp bao nhiêu kể từ lần sync gần nhất: `git rev-list --left-right --count main...HEAD`; nếu số bên trái > 0, liệt kê commit của main chạm `docs/` hoặc các gốc cũ (`docs/specs`, `docs/architect`) và nói còn bao nhiêu ngoại lệ chưa được ghi nhận.
   - `node scripts/check-legacy-docs-ratchet.mjs` (chỉ đọc; kỳ vọng exit 0, 24 sửa và 1 file mới đã ghi nhận). **Không chạy** bộ sinh kiểm kê hay `verify-phase-*` trừ khi plan nói chúng chỉ đọc: bộ sinh ghi file và đang hết bộ nhớ trên đầu branch (xem pre-step).
   - Trạng thái từng phase trong plan có khớp với tag và commit thật không (`git tag --list 'documentation-authority-*'`, `git log --oneline -15`).

## Câu trả lời cần đưa cho anh (trong chat, bằng tiếng Việt, ngắn, không tạo file)

Xưng "em", gọi "anh". Ghi UNPROVEN chỗ chưa chứng minh.

1. **Plan đang ở đâu:** bảng phase 1-10 với trạng thái thật, kèm bằng chứng (tag hoặc commit).
2. **Được phép gì, chưa được phép gì:** theo `plan.md` §7.5b. Hiện chỉ có bước chuẩn bị "gate tooling" (bộ sinh bỏ qua file kết quả của chính nó) được phép, và nó chạy như bước đầu của Phase 4; bản thân Phase 4 trở đi chưa được phép.
3. **Bước tiếp theo chính xác** và ai phải cho phép nó.
4. **Điều kiện bắt đầu Phase 4:** những gì phải đúng (ví dụ main đã sync, ngoại lệ đã ghi nhận, pre-step 0a, 0b xong), và cái nào chưa đúng.
5. **Độ lệch hiện tại với main** và việc cần làm nếu có.
6. **Rủi ro và mâu thuẫn trong chính plan** mà bạn tìm thấy (câu nào lỗi thời, phụ thuộc nào vô lý). Đã biết: cutover **không** phụ thuộc Plan C; nếu còn chỗ nào nói khác thì báo.
7. **Câu hỏi cần anh quyết** trước khi thi hành.

## Ràng buộc (kể cả sau khi định hướng xong)

- Chỉ làm trong worktree; không ghi vào main checkout, nơi phiên khác đang làm việc. Không `git checkout`/`switch` ở main. `pwd` và `git branch --show-current` trước mọi lệnh git.
- **Không chạy phase nào, không merge, không commit, không push cho tới khi anh nói rõ.** Plan §5 đòi anh cho phép tường minh từng phase. Nếu anh cho phép Phase 4, bước đầu là pre-step 0a/0b trong phase file, làm đúng như đã ghi.
- Khi được phép: chỉ `git merge` main vào branch (không rebase, không force-push); commit bằng đường dẫn tường minh (`git commit -- <paths>`), conventional, không nhắc AI, không nhãn phase hay mã phát hiện trong comment hoặc tên test; chạy test với `env -u CLAUDE_CODE_SESSION_ID`; dùng `node bin/fgos.mjs` cho truy vấn chỉ đọc, không dùng hàm shell `fgos` hay `rtk proxy fgos`; không lệnh đổi trạng thái (`fgos submit/pick/move/approve`, `fgctl init/upgrade/stage`, `doctor --fix`); không đọc `.fgos/secrets.local.env`.
- Điểm dừng (báo anh, không tự quyết): merge xung đột trong nội dung `docs/platform/**` hoặc từ 10 file; script cổng fail vì nguyên nhân chưa hiểu; claim mất mà không có chỗ ghi nhận; cần sửa script cổng ngoài phạm vi §7.5b.
- `ak-*`, `ck-*`, hook, rules của AgentKit/ClaudeKit và `rtk` là dự án của người khác: dùng như công cụ, không đề xuất sửa.

## Không làm

- Không bắt đầu di trú nội dung, không viết lại tài liệu, không cutover, không merge vào main, không dọn worktree khác.
- Không dùng chat này để sửa Plan A, B, C hay báo cáo điều tra: chúng thuộc chat điều tra.
