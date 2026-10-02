# Nghiệm thu Ca 1 — P1 lõi thực thi (viết lại theo bằng chứng thật)

Date: 2026-10-02 (viết lại; bản 2026-10-01 ghi "Accepted" với số liệu "12 lệnh → 1", "~45 phút" không có run id nào đứng sau — đã bỏ)
Plan: [plan.md](../plan.md) · Spike: [spike-herdr-bwrap.md](spike-herdr-bwrap.md)
Status: **PARTIAL** — Unit thật chạy được qua `fgos run` (producer + checker, cli); herdr transport, posture confinement và so sánh engine cũ **chưa nghiệm thu được** (lý do ở §3).

## 1. Lần chạy thật

Store: checkout chính `/home/vantt/projects/forgentX/.fgos` (`--dir`), worktree chạy: `forgentX-r2r-fix`. Transport thật: **cli-spawn, headless** (`binding.transport: "cli"`). Executor: claude (cli).

| Mục | Giá trị |
|---|---|
| Lệnh | `fgos run --unit - --pattern reviewed --dir /home/vantt/projects/forgentX --json` (Unit trên stdin: id `r2r-case1-docs`, capability `execute`, writes `plans/reports/r2r-case1-docs-note.md`) |
| unitRunId | `unit-run-1790918559997-8757d4c9` |
| unit.json | `.fgos/assignments/unit-run-1790918559997-8757d4c9/unit.json` (createdAt 05:22:40.005Z) |
| Producer | assignment `…/producer/1`, mutating, posture `workspace-write`, claude, 14.3 s, outcome ok, verdict pass |
| Checker | assignment `…/reviewer/1`, read-only, claude, 17.1 s, outcome ok, verdict pass (`runs/01/agent-report.md`) |
| Sản phẩm | `plans/reports/r2r-case1-docs-note.md` (10 dòng, thật; reviewer đối chiếu từng dòng với `src/runner/execution/run.mjs`) |
| Tổng thời gian | ~31 s từ unit.json đến checker settled |
| Lead-active | 1 lệnh (số đo duy nhất lấy từ file; **không** có số của engine cũ cho cùng Unit) |

Lần chạy thứ hai cùng Unit (`unit-run-1790918596138-e52eabe7`, chỉ producer, outcome `execution-failure`): producer thoát 0 nhưng file đã tồn tại từ lần một nên không có thay đổi → bị phân loại failure. Ghi lại để không ai đọc nhầm là pass.

## 2. Phát hiện khi nghiệm thu (đã sửa trong vòng này, có test)

- Checker độc lập **không có hiệu lực**: `independentOf` mang tên vai (`producer`), `bind()` so họ provider → không bao giờ khớp. Trong lần chạy trên, producer và checker đều là claude. Sửa: tên vai được đổi thành executor đã được bind cho vai đó; panelist chạy song song thấy anh em đã bind (`src/runner/execution/run.mjs`, `test/runner/execution/run.test.mjs`: reviewed khác họ, một họ → `independence` refusal, panel 3 họ khác nhau, panel thiếu họ → refusal).
- `fgos run` không bao giờ dùng herdr: `runUnit` mặc định `herdrPresent: false`, không nơi nào dò herdr. Thêm `detectHerdrPresent()` (HERDR_ENV + socket). **Chưa đủ**: xem §3.

## 3. Chưa đạt / chưa chạy (không ghi Accepted)

- **herdr transport**: `bind()` trả `transport: 'herdr'` nhưng `run.mjs`/`assignment-runner.mjs` không đọc trường này; adapter herdr chỉ được chọn khi invocation `herdr-spawn` được chọn (ở cấu hình thật bind chọn invocation `cli-spawn`). NOT DONE.
- **Posture confinement**: `resolvePosture()` (`confinement/policies.mjs`) không có nơi gọi ngoài test; `canApplyPosture()` luôn `true`. Run trên có `confinement: null` — checker "read-only" chỉ bị chặn ghi bằng phát hiện git-diff sau chạy, không bằng OS. Spike chứng minh khả thi (bwrap trong pane herdr: ghi repo bị chặn, ghi outbox được), chưa nối dây. NOT DONE.
- **Provider-limit / fallback pane mới**: không chạy được thật (codex hết hạn đăng nhập trên máy này; không có màn hình limit để thử). Chỉ có test đơn vị.
- **So với engine cũ trên cùng Unit**: NOT RUN (cần Lead lái tay 6–13 bước `operation-authorized`; chỉ có số đo từ session lịch sử — xem P4 báo cáo).
- Cấu hình thật không có `docs:write`/`docs:review`: Unit docs đúng nghĩa của báo cáo cũ không bind được; lần chạy trên dùng capability `execute`.

## 4. Test chứng minh phần đã đạt

`test/runner/execution/*.test.mjs` (bind, run, patterns, gate mutating fail-closed, independence, panel), full `npm test` xanh trên nhánh sửa.
