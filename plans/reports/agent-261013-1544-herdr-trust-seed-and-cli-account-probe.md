# Herdr trust seed và CLI account probe

Ngày: 2026-10-13. Nhánh: `worktree-agent-adaf4fd7e0bfc012e`.

## 1. Task 2: Codex vẫn hỏi "Trust this folder?" trong private home

### Nguyên nhân (đã chứng minh)

Pane confine (bwrap, có private home) mang login của account mà capacity layer **lease** (`tetcu72`,
`provider-capacity-selection.json`, `credentialProvisioned: true`). Nhưng bước gieo trust
(`seedWorkspaceTrust` → `trustStorePaths`, `src/runner/dispatch/herdr-round.mjs`) đọc quyết định trust
từ store của account mà **env tĩnh của invocation** chỉ tới: `codex-herdr-fgovn` khai
`CODEX_HOME=${HOME}/.codex-fgovn`, nên root store là `~/.codex-fgovn/config.toml`.

- Bằng chứng: `visibility.json` của run 14:24 ghi
  `trustSeedFailed: codex trust seed refused for "/home/vantt/projects/forgentX": its repo root ... is not itself trusted in /home/vantt/.codex-fgovn/config.toml`.
  Private home vì vậy không có entry nào, và codex dừng ở prompt (`herdr-diagnosis.json`, rule `trust_directory`).
- `~/.codex-tetcu72/config.toml` (account được lease) có `[projects."/home/vantt/projects/forgentX"]`.
  `~/.codex-fgovn/config.toml` lúc 14:24 không có (chỉ có `/home/vantt/projects`, `forgent`, `herdr-gateway`);
  file này bị sửa lúc 14:31, sau sự cố, và giờ đã có entry forgentX (không rõ ai thêm; vì vậy chạy lại
  với config hiện tại sẽ không tái hiện được).
- Inventory toàn máy (`~/.fgos/config.json`) cho openai chỉ có `tetcu72`, nên mọi pane codex confine đều
  mang login tetcu72 nhưng đọc trust từ fgovn.
- Commit trước đó `6e8d0304e` ("trust ... derived from the real account store") làm đúng ý cho trường hợp
  account tĩnh trùng account lease; lệch khi capacity layer chọn account khác.

Không phải nguyên nhân: định dạng config codex 0.160.1 (entry kiểu `[projects."<path>"]` vẫn được đọc, xem
lần chạy B dưới đây); dạng đường dẫn worktree vs main checkout (`trustRoots` đã thêm main checkout qua
`git rev-parse --git-common-dir`, và codex tự nói "Trusting will apply to the repository root").

### Tái hiện (read-only, không đụng config thật)

Script `ab-experiment.mjs` (scratchpad), cùng Assignment door, invocation `codex-herdr-fgovn`, cwd là
worktree này, env tĩnh `CODEX_HOME` trỏ tới một home tạm chỉ trust `/home/vantt/projects` (giống fgovn lúc 14:24):

- A, code của main (`0990a010a`): `outcome: blocked`, `trustSeedFailed: ... not itself trusted in .../static-codex-home/config.toml`,
  herdr rule `trust_directory`, màn hình "Trust this folder?". Pane `wS:p4V9` đã đóng, private home đã gỡ.
- B, code đã sửa: `confined-bwrap`, `trustSeeded: codex-toml`, `outcome: settled`. Home tạm không bị sửa.

### Sửa

- `trustStorePaths({ ..., accountSource })`: khi round có private home riêng, root store đọc từ account được
  lease: `codex-home` → `<home>/config.toml`, `home-files` (agy) → settings agy dưới `<home>`.
  `trustStore.path` khai tường minh vẫn thắng. Round không có private home vẫn đọc home của invocation.
- Đường đi của credential source: `executeThroughConfinement` thêm adapter option `trustAccountSource`
  (`request.providerCapacity.credentialSource`, chỉ đường dẫn, không có credential) → `herdrSpawnInteractiveAdapter` → `driveRound` → `seedWorkspaceTrust`.
- Hook trust của codex dùng cùng root nên cũng theo.
- Không sửa `src/runner/dispatch/confinement/drivers/**`.

Test viết trước, fail trước khi sửa:
- `test/runner/herdr-private-home-trust.test.mjs`: 2 test (định tuyến root theo account lease; gieo private home
  khi chỉ account lease trust repo). Trước khi sửa: fail đúng thông báo `untrusted-root` như bằng chứng.
- `test/runner/dispatch-confinement-authority.test.mjs`: `trustAccountSource` tới được adapter (đã kiểm chứng
  bằng cách tắt dòng sửa thì test fail).

Phần còn mở: "trust vanishing" ngày 2026-10-07 (một phiên codex khác ghi đè `config.toml` của account) là
nguyên nhân khác; nó vẫn xảy ra nếu chính account được lease mất entry. **UNPROVEN:** codex 0.160 có công
nhận trust của thư mục cha (`/home/vantt/projects`) hay không; seed vẫn đòi chính repo root được trust.

## 2. Task 1: `fgos dispatch probe-account`

### Prior art đã dùng lại

- Door: `executeAssignment` với Assignment read-only có `binding.posture: read-only` và
  `cliOverride.preferInvocation`, giống cách `runUnit` của Workflow giao việc (`src/runner/execution/run.mjs`).
  Door trực tiếp `executeExecutorCli` không chuẩn bị được launch confine cho herdr-spawn
  ("herdr-spawn requires prepared invocation"), nên probe phải đi qua Assignment door.
- Ghim account: đưa cho door một runner config mà inventory của provider chỉ còn đúng account đó, nên lease
  không thể chọn account khác và quarantine vẫn từ chối như thật. Không đổi engine.
- Phân loại: `matchAuthFailureLine` (provider-auth-failure.mjs), câu chữ quota của lazy probe RUL74,
  `herdr-diagnosis.json` (`explain.matchedRule`) mà round bị chặn đã tự ghi.
- RUL75: opt-in renewal (sau merge main: `createConfinementCredentialRenewal({ tempRoots })`).
- Dọn: đóng pane bằng herdr client, gỡ private home giữ cho pane đã đóng bằng `reapOrphanedConfinementResources`.

### Cách dùng

```
fgos dispatch probe-account --provider openai --account tetcu72 \
  [--executor openai] [--invocation id1,id2] [--timeout-ms 180000] [--cwd <dir>] [--repo-root <dir>]
```

Invocation thuộc account khi: confine có private home và CLI khớp layout credential của account (`lease`);
env credential trỏ đúng home account (`env`); hoặc id kết thúc bằng `-<account>` (`name`, quy ước
`<bin>-<mode>-<account>` trong config). Lớp kết quả: `ok`, `blocked-trust-prompt`, `auth`, `quota`,
`sandbox`, `timeout`, `other`. Verdict: `healthy`, `account-fault` (mọi CLI hỏng ở `auth`/`quota`),
`cli-fault` (có CLI trả lời), `mixed`. Chỉ chẩn đoán, không chọn CLI, không lập lịch.
Đã đăng ký trong `src/cli/command-registry.mjs`, `bin/fgos.mjs`, usage của `src/runner/dispatch.mjs`.
Install/setup/doctor gate: không thêm config default, env var hay dependency mới (herdr, bwrap đã có sẵn), nên không có check doctor mới.

### Một lần chạy thật (openai/tetcu72, 2026-10-13 09:10Z, cwd và repo-root là worktree này)

```
verdict: cli-fault
codex  codex-cli-bwrap       cli-spawn   lease  ok       "OK"                         asgn_..._op_009
codex  codex-herdr-fgovn     herdr-spawn lease  ok       "Account probe completed. ... OK."  asgn_..._op_010  pane wS:p4VD (not-open: round tự đóng)
pi     pi-cli-tetcu72        cli-spawn   name   sandbox  "EROFS: read-only file system, mkdir '/home/vantt/.pi/accounts/openai-tetcu72/settings.json.lock'"
pi     pi-cli-bwrap-tetcu72  cli-spawn   name   sandbox  (cùng dòng EROFS)
```

Đọc kết quả: account tetcu72 khoẻ (cả hai đường codex trả lời, kể cả pane herdr confine nhờ fix ở mục 1).
Hai invocation pi hỏng ở mức CLI: dưới posture read-only, pi phải ghi lock vào thư mục account của chính nó
trước khi trả lời và không có private home, rồi báo "No matching provider is authenticated". Lần chạy qua
door trực tiếp không confine (trước khi chuyển sang Assignment door), `pi-cli-tetcu72` đã trả lời `ok`.
Run dir đầy đủ: `.fgos/assignments/asgn_cfcd0e10_beed_4753_94c8_04bd36d661bf_op_009..012/runs/01` trong worktree.

Chạy lại sau khi merge main (renewal mới): cùng kết quả (`cli-fault`; codex ×2 `ok`, pi ×2 `sandbox`).

Dọn dẹp: không còn pane nào của em trong `herdr pane list`; `/tmp/fgos-confinement/` rỗng sau khi reaper
gỡ home của lần chạy A; không còn tiến trình nền nào.

## 3. Test

- Focused: `herdr-private-home-trust` (16/16), `provider-account-probe` (5/5), `dispatch-confinement-authority`,
  `herdr-spawn-adapter`, `dispatch-trust-store`, `dispatch-confinement-backend-p03` (150/150 trước merge),
  `dispatch-operability` (11/11; regex invoke string cập nhật thêm `probe-account`).
- `npm test` chạy khi đã bỏ `CLAUDE_CODE_SESSION_ID`, sau khi merge main: lần đầu có 5 test hỏng, đều là luật tĩnh liên quan tới code mới
  (thiếu row trong architecture manifest, import graph, số call site `executeAssignment` trong cli.mjs, đọc thẳng
  `RunResult.status`, citation RUL thiếu gloss). Đã sửa ở `1b818c586`: probe đọc qua `runOutcome`. Lần chạy lại:
  **7291 tests, 7216 pass, 0 fail, exit 0** (11 test hỏng sẵn có trên main không xuất hiện ở lần chạy này).

## 4. GitNexus

Index cũ (indexed `b334695`): Degraded. Mức impact: `trustStorePaths` LOW, `seedWorkspaceTrust` LOW, `driveRound` LOW,
`herdrSpawnInteractiveAdapter` LOW, `runDispatchCli` LOW, **`executeThroughConfinement` CRITICAL** (8 process:
dispatchClaimedItem, executeAssignment, dispatchBound, spawnWorker, ...). Thay đổi ở đó chỉ thêm một adapter
option (`trustAccountSource`), adapter khác không đọc. `bin/fgos.mjs` không có symbol nào được index (tsk-38h),
nên đã kiểm tra bằng grep. `detect_changes` so với main liệt kê thêm các symbol do main mới đổi (cleanup.mjs,
run.mjs, registrations.mjs). Diff thật của nhánh: 14 file.

## 5. Commits

- `ed145600f` fix(dispatch): read a confined pane's folder trust from the leased account's store
- `80cf7a8a6` feat(dispatch): probe one provider account across all its CLIs at once (gồm docs: runner.md RUL78/RUL79,
  confinement-authority.md §13.1, CHANGELOG Unreleased)
- `272d8311c` merge main vào nhánh (conflict import trong `cli.mjs`; probe dùng `createConfinementCredentialRenewal`)
- `1b818c586` fix(dispatch): register the account probe with the architecture and RunResult rules
- commit báo cáo này

No component-boundary change: probe chỉ dùng các door có sẵn; fix đi qua Authority → adapter herdr đã có.

## 6. Rủi ro và câu hỏi mở

- Nên sửa invocation pi (thêm private-home binding hoặc posture khác) hay chấp nhận pi chỉ dùng cho việc ghi, không confine? Đây là quyết định config, em chưa đổi.
- Reaper gỡ private home không có credential write-back (driver bwrap lo phần đó); một login được renew trong home bị giữ lại rồi reap thì vẫn mất. Thuộc khu vực của agent khác.
- Home giữ cho pane mà marker không có `herdrSession` (pane confine chạy ở session mặc định) chỉ bị reaper thường gỡ sau 1 giờ.
- Probe ghim account bằng cách thu hẹp inventory; với provider nhiều account, việc đếm lease đồng thời không bị ảnh hưởng ngoài phạm vi probe.
- Tên invocation `codex-herdr-fgovn` gây hiểu lầm: thực tế nó chạy bằng account được lease.
