# Phase 05 — `check` ở pre-commit và `fgos doctor`; gộp thư mục journal

Trạng thái: pending · Công: 1d · Phụ thuộc: phase 04; thay đổi pre-commit (chặn rác gốc repo) và check doctor của Plan A đã merge

## Bối cảnh

- Luật doctor gate (`AGENTS.md` §Install/setup/doctor gate): check mới đăng ký qua `registerCheck` (`src/setup/registrations.mjs`), và dòng 70 của `docs/specs/distribution.md` "names every registered check ... a module adding one updates this row in the same change".
- Mẫu suy giảm khi host cũ: `checkObserveRunCoverage` (`registrations.mjs:5753`).
- Pre-commit hiện là Node 398 dòng (`.githooks/pre-commit`), đã có guard xoá `.fgos/` chạy vô điều kiện và guard khoá main checkout chỉ chạy "at home". Plan A thêm guard rác gốc repo vào cùng file → phase này rebase lên sau, không sửa song song.

## Yêu cầu

- **Pre-commit:** lấy file mới thêm (`git diff --cached --name-only --diff-filter=A`), gọi `conventionCheck(paths)`; Rust tự bỏ qua path ngoài thư mục quy tắc (để pre-commit không giữ danh sách thư mục). Có vi phạm → in `path: code message` và chặn. Không có host / host cũ → cảnh báo stderr một dòng, không chặn (Q12). Chạy cả ở main checkout lẫn worktree (giống guard `.fgos/`), vì report được viết ở cả hai.
- **Doctor:** check `convention-conformance` gọi `conventionCheck({all:true})`; vi phạm trên file cũ → `passed: true, degraded: true` kèm số lượng và tối đa 3 ví dụ (không `failed`, vì 78 report cũ được giữ nguyên tên để không gãy liên kết); host không có/cũ → `degraded`.
- **Gộp journal (theo Q6):** dời thư mục journal không được chọn vào thư mục chuẩn bằng `git mv`, đổi tên theo mẫu đã chốt nếu anh chọn đổi; sửa liên kết trỏ tới chúng (grep trước). Kết quả: một thư mục journal.

## Files

Sửa: `.githooks/pre-commit`, `src/setup/registrations.mjs` (hàm `checkConventionConformance` + `registerCheck`), `docs/specs/distribution.md` (dòng 70 thêm `convention-conformance`), `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` nếu file này cũng liệt kê check (UNPROVEN: grep `observe-run-coverage` trong file đó).
Tạo: `test/setup/convention-doctor-check.test.mjs`, test e2e pre-commit theo mẫu test hiện có của hook (UNPROVEN: tên file test hook hiện có; tìm bằng `rtk proxy rg -l "githooks/pre-commit" test`).
Dời: `docs/journals/*` hoặc `plans/journals/*` (5 hoặc 10 file) theo Q6.
Xoá/gộp: hai thư mục journal → một; không có danh sách thư mục/mẫu nào trong pre-commit hay doctor (Rust giữ).

## Các bước

1. Kiểm Plan A đã merge phần pre-commit và doctor: `git log --oneline -5 -- .githooks/pre-commit src/setup/registrations.mjs`. Nếu chưa, dừng phase này.
2. Cổng impact: `impact` upstream cho hàm chính của pre-commit (UNPROVEN: tên hàm; file có thể không được index đầy đủ như `bin/fgos.mjs` — đối chiếu `rtk proxy rg`), `registerCheck`, `DOCTOR_CHECKS`. Thêm check mới không sửa symbol cũ, nhưng vẫn ghi blast radius.
3. Viết check doctor + test (host thật, host giả cũ, không host).
4. Sửa pre-commit + test e2e trong repo tạm (mẫu test hook hiện có): file mới sai bị chặn; file mới đúng qua; file cũ sai không chặn; không host → qua và cảnh báo.
5. `git mv` journal, sửa liên kết (`rtk proxy rg -n 'docs/journals|plans/journals' docs plans core domains AGENTS.md`), chạy `fgos convention check --all` bằng `target/debug/fgos` để xác nhận thư mục journal sạch.
6. Cập nhật `docs/specs/distribution.md:70`.

## Kiểm chứng

- `node --test test/setup/convention-doctor-check.test.mjs <test pre-commit>`.
- `node bin/fgos.mjs doctor` liệt kê `convention-conformance` (tiêu chí 8). Với release đang kích hoạt (chưa có verb) kết quả phải là `degraded`, không `failed` — đây là bằng chứng của Q11/Q12 trên máy thật.
- Thử thật: `git commit` một file `plans/reports/harness-audit-261006.md` mới trong worktree nháp → bị chặn khi `FGOS_HOST_BIN=target/debug/fgos`; không đặt biến và release cũ → qua kèm cảnh báo.
- Rộng: `env -u CLAUDE_CODE_SESSION_ID npm test`.

## Rủi ro

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Pre-commit chặn nhầm mọi commit | Thấp × Cao | Chỉ file mới thêm, chỉ khi có host; test e2e; rollback là revert một commit. |
| Thêm độ trễ commit (spawn host) | Trung bình × Thấp | Một lần spawn cho cả danh sách; bỏ qua spawn khi không có file mới. |
| Dời journal gãy liên kết | Trung bình × Thấp | Grep liên kết trước và sau; `doc-current-path-missing` doctor sẽ báo. |
| Đụng thay đổi pre-commit của Plan A | Trung bình × Trung bình | Bước 1 là cổng tuần tự. |

## Rollback

Revert theo thứ tự: commit pre-commit, commit doctor, commit dời journal (mỗi cái riêng).

## Commit (ba commit)

- `feat(doctor): report files that break the naming and placement convention`
- `feat(hooks): refuse newly added report, plan and journal files with nonconforming names`
- `docs(journals): keep journals in one directory`

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- **Hook nạp client bằng `await import()` động trong try/catch**, chỉ khi đúng là repo nguồn fgOS (marker `apps/fgos/Cargo.toml`, cùng quy tắc với Plan A) và chỉ khi có file mới trong thư mục quy tắc. Lỗi nạp chỉ cảnh báo. Lý do: `src/util/host-bin.mjs` kéo 29 module (đã xác nhận bằng bộ đi qua import), trong khi hook hiện chỉ import 2 module và tám file test chép đúng bộ bốn file này vào repo tạm (`test/e2e/main-checkout-lock-hook.test.mjs:56-59`); một lỗi nạp tĩnh làm mọi `git commit` ở mọi worktree thất bại vì hook chạy từ đường dẫn tuyệt đối của main checkout. Cập nhật tám file test chép hook: merge, claim-port, main-checkout-lock, hai main-checkout-lock-hook, resync-worktree, fgos-claim-2, uninstall-wiring; thêm một ca chạy bản hook chép mà không có `src/convention/`.
- **Danh sách file staged:** `git diff --cached --name-only -z --diff-filter=ACR` và tách theo NUL (`--diff-filter=A` bỏ qua đổi tên, và không có `-z` git trích dẫn tên không ASCII nên Rust bỏ qua; đã tái hiện bằng git 2.34.1). Đường dẫn truyền cho host sau `--`. Ca e2e: đổi tên (`git mv`), tên tiếng Việt, tên bắt đầu bằng `-`.
- **Tư thế: chỉ cảnh báo, không bao giờ chặn** trong phase này; chặn là quyết định riêng của anh sau khi đo (H4). Cưỡng chế chỉ có hiệu lực khi host có verb `convention`, tức là khi stage lại release, không phải khi code merge: ghi rõ đây là một bước phát hành phải được thông báo. Thử thật ở một repo tạm có `core.hooksPath` trỏ vào bản hook của phase (bản hook ở main checkout không có chốt chặn mới).
- **Doctor `convention-conformance`:** vòng lặp doctor chỉ đọc `{passed, message}` và bỏ `degraded` (`bin/fgos.mjs:3950-3952`; không nơi nào đọc `.degraded`), nên "degraded" không hiện ra. Dùng `passed: true` kèm thông báo đếm (cũ/mới sau mốc cutoff) cho vi phạm cũ và host cũ/thiếu (pass-skip nêu lý do); `passed: false` chỉ cho vi phạm mới sau mốc. Pass-skip khi không phải repo nguồn fgOS (không áp quy ước nội bộ lên project khác dùng fgOS); dùng toplevel đang làm việc, không phải gốc main. Tiêu chí 8 viết lại để quan sát được qua `fgos doctor --json`. Phải sửa thêm `test/setup/checks.test.mjs` (so sánh đúng danh sách id), `test/setup/registrations.test.mjs:258-262`, bảng check trong `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`, và `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`; sắp thứ tự sau Plan A Phase 04 vì cùng ghi các file này.
- **Bỏ việc gộp thư mục journal** (xem Phase 00). Số "78 báo cáo cũ" sai: dùng số đo ở Phase 00.

- **Bổ sung 2026-10-07:** pass-skip "không phải repo nguồn fgOS" của doctor (và điều kiện nạp client của hook) chỉ áp khi repo không có overlay quy tắc; repo có overlay thì doctor/hook chạy các quy tắc của overlay. Vị trí overlay: [phase 00 §Chỗ dành sẵn](phase-00-spec.md#chỗ-dành-sẵn-cho-quy-tắc-tài-liệu-2026-10-07-anh-quyết) mục 3 (câu hỏi mở Q13).
