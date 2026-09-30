# Prompt: hoàn tất plan Observe (stage lại, sửa transcript worktree, verification)

Dán phần dưới dòng `---` cho agent đã cook plan này (hoặc một agent mới). Working directory: `/home/vantt/projects/forgentX`.

---

## Bối cảnh

Plan `plans/260929-1501-metrics-friction-rust-native/` đã được implement và merge vào `main` (commit `120af6b3d` cho F1–F6 và F8, `c36f8d746` cho F7, `374599353` là journal). Kiểm tra độc lập ngày 2026-09-29, khoảng 21:30, cho thấy Observe **chạy được** qua shim: `fgos metrics ping|case list|harness`, `fgos friction rank`; 4 verb cũ đã bị xoá; 752 friction record đã được chuyển; `cargo test -p fgos-observe` có 22 test xanh.

Còn **3 vấn đề** và **một số phần chưa kiểm chứng**. Hãy xử lý theo đúng thứ tự dưới đây.

## Vấn đề 1 (ưu tiên cao nhất): release bị ghi đè tại chỗ, store không khớp manifest

**Bằng chứng:**
- `.fgos/installation/activation.json`: `artifactDigest` = `sha256:358827811ad26b99453de9be3d38461b1cb4f2356ed4e285ccb523c40e825dca`, `activatedAt` = `2026-09-18T02:57:00Z`.
- Nhưng `~/.local/state/fgos/releases/sha256:3588…/bin/fgos` có mtime `2026-09-29 18:45`. Tức là binary mới đã được **chép đè vào một release đánh địa chỉ theo nội dung**, thay vì stage ra một release mới.
- `fgctl verify` báo: `file digest mismatch for bin/fgos: declared sha256:178cfb9e…, actual sha256:43420579…`. Lệnh này **tự quarantine release đang active**, làm shim báo `active runtime is not ready (quarantined)` và ngừng chạy cho cả workspace. Sự cố này đã xảy ra lúc kiểm tra và đã được khôi phục bằng tay: thư mục release được dời về chỗ cũ, `activation.json` đặt lại `status: ready`. Hiện release vẫn đang ở trạng thái **không khớp manifest**, nên lần `verify` tiếp theo sẽ lại làm sập shim.

**Yêu cầu:**
1. Tìm xem F3 hoặc F6 đã "stage" bằng cách nào (lệnh đã chạy, script, commit). Ghi lại nguyên nhân gốc: vì sao không đi qua `fgctl stage` / `fgctl upgrade`.
2. **Stage lại đúng quy trình:**
   - Đọc `fgctl stage --help` và `fgctl upgrade --help` trước (**không đoán cờ**; `fgctl repair --help` không có, nên đọc `fgctl` usage chung).
   - Ghi lại `fgctl status` hiện tại.
   - Build release từ `main` sạch, stage ra **digest mới**, rồi upgrade workspace forgentX.
   - Kiểm bằng `fgctl status` (digest mới), rồi **sau cùng** mới chạy `fgctl verify` (phải pass), cộng `fgos metrics ping`.
3. **Không được:**
   - chép hay sửa file trong `~/.local/state/fgos/releases/*`;
   - chạy `fgctl repair`: lệnh này rollback về `previousArtifactDigest` `08e33f…` (release ngày 11/9, không có Observe);
   - chạy `fgctl verify` trước khi stage xong.
4. Nếu quy trình stage có lỗi thật (ví dụ không build được release tree), **dừng lại và báo cáo**, không tìm cách lách.
5. Cập nhật F3 (phase-02 file) và runbook `docs/how-to/measure-a-real-case.md` với đúng quy trình stage đã chạy.

## Vấn đề 2: source transcript bỏ sót worktree nằm ngoài `.claude/worktrees`

**Bằng chứng:** `packages/observe/rust/src/sources/claude_transcripts.rs:151-172`. Bước chọn thư mục chỉ nhận `name == enc || name.starts_with("{enc}--claude-worktrees-")`. Danh sách `git worktree list` (`get_valid_cwds`, dòng 81-110) chỉ được dùng để **lọc `cwd` sau khi đã chọn thư mục**.

Hệ quả: worktree `~/projects/forgentX-phase00-documentation-authority-unification` có thư mục transcript `-home-vantt-projects-forgentX-phase00-documentation-authority-unification`, nên bị loại ở bước chọn thư mục. Token của Lead và của các run dispatch trong worktree đó không được đếm. Track documentation-authority sắp được đo bằng Observe, nên đây là **blocker** cho thử nghiệm đó.

**Yêu cầu:**
- Chọn thư mục transcript theo **encoding của mọi path trong `git worktree list`** (project root cộng từng worktree), cộng quy tắc `--claude-worktrees-` hiện có. Giữ bộ lọc `cwd` theo từng record.
- Giữ nguyên các chặn đã có: không match prefix trần (red-team #10: `-forgentX*` không được kéo `-forgentX-worker-isolation` nếu path đó không phải là worktree của repo).
- Test:
  - worktree ngoài `.claude/worktrees` được tính;
  - thư mục có cùng prefix nhưng không nằm trong `git worktree list` thì không được tính;
  - dedupe theo `message.id` vẫn đúng.
- Cập nhật mô tả trong F2 (phase-03 file) và `docs/specs/observe.md`.

## Vấn đề 3: trạng thái plan không khớp `ak`

**Bằng chứng:** `ak plan status` báo **2/8 phase done, 5/39 task**. Phase 1–5 và 7 ghi `status: done` nhưng **không tick tiêu chí nghiệm thu nào** (0/9, 0/4, 0/3, 0/5, 0/10, 0/3); chỉ F6 (2/2) và F8 (3/3) được tick. `done` không phải từ vựng của `ak` (`pending | in-progress | completed`). `plan.md` cũng đang ghi `status: done`.

**Yêu cầu:** làm một **verification pass thật**, không tick cho có:
- Với **từng** Success Criteria của từng phase, chạy lệnh hoặc test chứng minh, rồi mới tick `[x]`. Criterion nào không chứng minh được thì để `[ ]` và ghi lý do ngay dưới nó.
- Phải chạy ít nhất:
  - `npm test` (với `CLAUDE_CODE_SESSION_ID` bị unset; build host tự chạy trong `run-tests.mjs`);
  - `cargo test --workspace`;
  - `node --test test/rust-host/command-routes.test.mjs`.
- Parity F4: báo cáo `reports/f4-parity.md` hiện **chưa so tường minh** với số liệu audit (`plans/reports/measurement-audit-260929-1454-harness-scorecard.md`: 1.028 run toàn thời gian; gate-approve trung bình 0,91 mỗi item), và lead time chưa được đối chiếu với một phép tính JS độc lập tới `delivered` (F6). Bổ sung cả hai, và giải thích mọi chênh lệch.
- Đổi `status: done` thành `completed` ở các phase **thực sự** đạt; phase nào còn tiêu chí chưa đạt thì để `in-progress`. `plan.md` cũng làm tương tự. Chạy `ak plan validate` và `ak plan status`.
- Ghi kết quả vào `plan.md` § Validation Log (Session mới): lệnh đã chạy, kết quả thật, những gì NOT RUN.

## Quy ước

- Đọc `AGENTS.md`/`CLAUDE.md`. Chạy capability gate impact-analysis, và gitnexus `impact` trước khi sửa symbol; `detect_changes()` trước commit.
- Làm trong worktree riêng nếu sửa code (vấn đề 2). Merge tuần tự, commit ngay sau khi verify xanh, theo conventional commits, không ghi mã plan hay phase vào commit message.
- Single path, không backward compat (xem memory `project_no_backward_compat_single_user.md`).
- Không sửa plan RunResult (`plans/260929-1703-runresult-classification-single-path/`) hay draft Producer.

## Bàn giao

Báo cáo ngắn gồm:
1. nguyên nhân gốc và cách stage lại, kèm `fgctl status` trước và sau, và `fgctl verify` pass;
2. diff sửa transcript cùng test;
3. bảng tiêu chí nghiệm thu theo phase: đạt / chưa đạt kèm bằng chứng;
4. kết quả `npm test` và `cargo test --workspace`;
5. những gì NOT RUN.

Kết thúc bằng:
```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: 1–2 câu
Concerns/Blockers: nếu có
```
