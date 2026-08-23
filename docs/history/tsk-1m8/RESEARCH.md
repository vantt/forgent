---
item: tsk-1m8
---

# RESEARCH.md — tsk-1m8

## Round 1 — 2026-08-16 (discovery)

**Asked:** Có cơ chế dispatch out-of-process (`src/runner/dispatch.mjs`
`decide`/`execute`) đã sẵn sàng đẩy MỘT work item cụ thể ở stage `executing`
đi thực thi thật (code/verify/report) qua capacity kind `agent` (ví dụ
`agy`, đã đăng ký `.fgos/config.json` `runner.capacities.agy`) hay không?
Và cơ chế đó khớp ở đâu với luồng in-process bình thường
(`fgos-coding-implement`)?

**Checked (repo search, cited):**

- `src/runner/dispatch.mjs:1512-1515` `capacityIdForWork(work)` = `skillForStage(domainObj, 'executing')`.
  Với domain `coding`, kết quả luôn là **chuỗi tên skill**
  `"fgos-coding-implement"` — đây là capacity id thật sự dùng để dispatch
  stage `executing`, KHÔNG phải id tuỳ ý như `"agy"`.
- `test/runner/dispatch.test.mjs:3275` — pin cứng:
  `assert.equal(capacityIdForWork(sampleWork()), 'fgos-coding-implement')`.
- `.fgos/config.json` (đọc trực tiếp, 2026-08-16): `runner.capacities` có
  key `"agy"` (kind: agent, invocations[0].via=cli, command=agy,
  providerModel=gemini, allowCrossProvider=true) nhưng **KHÔNG có** key
  `"fgos-coding-implement"`.
- `src/runner/dispatch.mjs:1848-1864` (comment ngay tại `decideCapacityCli`,
  nhánh `--work`): xác nhận sống ("confirmed live") — `resolve
  fgos-coding-implement` hiện âm thầm rơi về global executor (Claude),
  đúng gap mà 0026 (Native-First Dispatch Doctrine) đặt tên: item chưa có
  `cfg.capacities["fgos-coding-implement"]` thì mặc định về native/soul
  (rule 2), KHÔNG tự out-of-process.
- `docs/reference/capacity-cross-provider-governance.md:55-73` — có sẵn ví
  dụ CHÍNH XÁC cho case này:
  ```json
  { "capacities": { "fgos-coding-implement": {
      "kind": "agent", "command": "agy", "args": ["{prompt}"],
      "allowCrossProvider": true } } }
  ```
  Không có `allowCrossProvider: true` thì `resolveExecutorConfig` throw
  `RunnerConfigError` tại resolve time, trước khi spawn — không im lặng
  fallback.
- `src/runner/loop.mjs:807,1194` — `spawnWorker` (headless runner, `fgos
  loop`) là nơi THẬT SỰ chạy stage `executing` không tương tác — khác với
  skill `fgos-coding-implement` (in-session, người ngồi cạnh). Đây là
  đường thật để "đẩy code-implement ra cho agy làm": không phải sửa skill
  in-session, mà là route runner headless của item này qua capacity
  `fgos-coding-implement` đã cấu hình trỏ tới `agy`.
- Không tìm thấy nơi nào khác trong repo (`rg -n '"agy"'`) đòi hỏi
  capacity id `"agy"` phải giữ nguyên tên đó cho một mục đích khác (không
  có `for: 'agy'`/purpose lookup nào khoá cứng chuỗi này) — thêm một entry
  MỚI `"fgos-coding-implement"` bên cạnh `"agy"` (không sửa/xoá `"agy"`)
  là an toàn, không phá gì đang có.
- Môi trường (lệnh chạy thật, 2026-08-16): `command -v agy` → tồn tại tại
  `/home/vantt/.local/bin/agy`. Kiểm chứng sống: có thể chạy thử thật, đây
  không phải một khoảng trống lý thuyết.

**Còn mở (không chặn `clear`, để lại cho planning):** thêm
`runner.capacities["fgos-coding-implement"]` trỏ agy vào
`.fgos/config.json` (repo-level, dùng chung mọi item coding domain khi
chạy headless qua `fgos loop`) đổi hành vi dispatch mặc định cho MỌI item
khác chạy qua runner headless sau đó, không chỉ tsk-1m8. Planning cần
quyết: giữ vĩnh viễn, revert sau thử nghiệm, hay cô lập bằng cách nào đó
(ví dụ chỉ bật tạm trong lúc chạy thật rồi trả config về cũ, có ghi lại
before/after).

**Verdict:** `clear` — cơ chế đã tồn tại sẵn, có ví dụ cấu hình thật trong
docs, có gate cross-provider đã biết cách vượt qua đúng luật
(`allowCrossProvider: true`), và `agy` binary có thật trên máy để chạy thử
sống. Verify đề xuất: `npm test && node src/runner/dispatch.mjs decide --work tsk-1m8 --dir "$(pwd)" | grep -q '"mechanism": "out-of-process"'`.
