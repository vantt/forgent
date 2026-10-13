# Per-CLI credential sources per account

Ngày: 2026-10-13. Branch `worktree-agent-aee5ec3b34769f116` (fast-forward lên main `fe22f997a` trước khi làm). Các commit: `1f911229f` (code, config, test, spec, changelog), `31f676749` (thêm gloss cho các trích dẫn trong RUL80), và commit chứa báo cáo này (commit cuối trên branch).

## Mục tiêu

Chọn account trước, rồi mới chọn CLI. Một account (vd openai `tetcu72`) dùng được qua nhiều CLI (codex, pi, omp), mỗi CLI giữ login store riêng. Quota, lock, quarantine, rotation vẫn tính theo account, không tách account giả theo CLI.

## Tiền lệ (prior art)

- `git log -S credentialSource`: `ec6a0745d` (rotator slice 1, chỉ `codex-home`) thay `FGOS_CODEX_CREDENTIAL_HOMES`. `569f72d3b` bỏ allowlist `codex-bwrap` để chỉ copy credential của account được lease. `6e8d0304e`/`27030e1b8` thêm private home cho pane herdr và check doctor `confined-pane-accounts`. `8c3e414df`/`ecfff58f6`/`186237d27`/`60626065a`/`c62b37204` thêm `home-files`, renewal và write-back (`pending/`, account lock). `ed145600f` đưa trust seed sang store của account được lease (`trustAccountSource`). `80cf7a8a6` thêm `fgos dispatch probe-account`.
- `git log -S credentialSources` không ra gì: trước đây **chưa từng có** khái niệm nhiều store trong một account. `b5e1a4bfe` từng bỏ các invocation riêng theo account của agy để chuyển sang account gemini; đây cũng là hướng "account trước" mà thay đổi này đi tiếp.
- `pi-cli-bwrap-tetcu72` có từ `2f16f0711` (gom account pi của openai dưới tiền tố `openai-`). Từ đó tới nay nó vẫn chưa có `resourceBindings`. Hình dạng binding lấy nguyên từ `pi-cli-bwrap-openrouter`.
- **Dùng lại:** kind `codex-home`/`home-files`, `copyCredentialFiles`, các layout renewal, account lock, `trustAccountSource`, heuristic tên CLI = basename của `command` (từ `provider-account-probe.mjs`, nay chuyển sang `commandCli`).
- **Còn thiếu và đã thêm:** schema nhiều store; một điểm duy nhất để chọn store theo lệnh thật sự được chạy; tách thư mục chứa bản copy renewal theo từng store.

## Schema đã chọn và lý do

Trong inventory toàn máy, mỗi account khai **đúng một** trong hai dạng sau (khai cả hai hoặc không khai cái nào đều bị từ chối):

- `credentialSource`: dạng cũ, không đổi. Một store dùng cho mọi CLI. Các project khác đang dùng dạng này.
- `credentialSources: { <cli>: { kind, home, files? } }`: key là basename của `command` trong invocation (`codex`, `pi`, `omp`, `agy`), viết thường theo `^[a-z0-9][a-z0-9_-]*$`. Khi normalize, mỗi entry được gắn thêm `cli`.

Lý do loại trừ nhau: tránh câu hỏi "store mặc định cộng override thì ai thắng". Mỗi account chỉ có một cách đọc.

Store được chọn ở đâu (`provider-capacity.mjs`: `commandCli`, `credentialSourceForCli`, `accountCredentialSources`, `providerCapacityForCommand`, `credentialStoreDir`):

1. **Lúc dựng confinement request** (`buildConfinementRequest`), cửa chung của cả hai đường launch (supervisor và `executeExecutorCli`/herdr). Bước này đặt `providerCapacity.credentialSource` thành store của CLI trong lệnh thật. Nhờ vậy việc copy vào private home (`bwrap.mjs`), write-back marker và trust seed (`authority.mjs` `trustAccountSource`) đều nhận đúng store mà không phải sửa từng chỗ. Account dạng per-CLI không có store cho CLI đó thì bị từ chối `credential-provisioning` trước khi worker chạy.
2. **Lúc lease:** chỉ khi invocation đã được pin (`cliOverride.preferInvocation`, như Workflow unit và probe-account). Khi đó chỉ account có store cho CLI ấy mới được lease. Không account nào có thì refused `provider-capacity.no-account-for-cli`. Lease không pin thì giữ nguyên như cũ.
3. **Refresh-ahead (RUL75):** chạy trước khi invocation được chốt. Với account per-CLI, gia hạn store của từng CLI mà executor còn có thể chạy (nếu đã pin thì chỉ CLI được pin).
4. **Lazy probe (RUL74):** gọi qua store của CLI đầu tiên trong danh sách ứng viên. Nếu không biết CLI thì dùng store đầu tiên account khai.
5. **Renewal `pending/`, scratch, cooldown:** store per-CLI nằm ở `account-locks/<provider>/<account>/stores/<cli>/`, để bản copy của pi không bao giờ bị áp lên store codex. Marker ghi thêm `store`. Account lock vẫn một cái cho mỗi account. Check doctor `credential-copies-retained` đọc cả hai chỗ.
6. **Account probe:** `lease` khi invocation confine, có private home, và account có store cho CLI của invocation đó. `env` khi env của invocation trỏ tới bất kỳ home nào của account.
7. **Doctor:** `confined-pane-accounts` kiểm từng pane theo store của chính CLI của pane. `agy-permissions` đọc store `agy` của account per-CLI.

## File đã đổi (commit `1f911229f`)

- `src/runner/dispatch/provider-capacity.mjs`: schema, các helper, lease theo `cli`, `cli` cho lazy probe, `credentialStoreDir`.
- `src/runner/dispatch/confinement/request.mjs`: chọn store theo lệnh.
- `src/runner/dispatch/confinement/drivers/bwrap.mjs`: từ chối khi CLI không có store.
- `src/runner/dispatch/provider-credential-renewal.mjs`: thư mục store, `store` trong marker, quét `stores/`.
- `src/runner/dispatch/provider-credential-probe.mjs`: probe theo store của CLI.
- `src/runner/dispatch/assignment-runner.mjs`: `launchCandidateClis`; truyền `cli` vào lease (khi pin), lazy probe và renewal.
- `src/runner/dispatch/provider-account-probe.mjs`: chọn invocation theo store của account.
- `src/setup/registrations.mjs`, `src/setup/agy-permissions.mjs`: doctor.
- `.fgos/config.json`: `pi-cli-bwrap-{tetcu72,fgovn,tetnu}` thêm `resourceBindings` (`private-home` -> env `PI_CODING_AGENT_DIR`), y hệt glm `pi-cli-bwrap-openrouter`. Các invocation pi đang confine khác (glm, deepseek, glm-herdr) đã có binding này từ trước.
- `test/runner/provider-per-cli-credential-sources.test.mjs` (mới, 9 test).
- `docs/specs/runner.md`: RUL80 và dòng 1b của Data Dictionary. `docs/specs/confinement-authority.md` §13.1. `CHANGELOG.md` `[Unreleased]` (Added + Fixed).
- Cổng install/setup/doctor: không có config key nào ở cấp setup. Key mới nằm trong inventory đã có validator (`providerAccountInventory`) và đã có doctor (`confined-pane-accounts`, `credential-copies-retained`), cả hai đều đã được cập nhật.

## Global config (`~/.fgos/config.json`)

- Backup: `~/.fgos/config.json.bak-261013` (sha256 `1a2be21addc165621bd963d850bb92544cd9a5eb21f0a1ca1f37b9f6c142b832`).
- Bản per-CLI được để sẵn ở `~/.fgos/config.json.per-cli-261013` (mode 600, sha256 `a00eb9f8237d7c1b5f53473db80f6f180acee8070f7ab39ff0919d7981c22c11`). Bản này thay đổi:
  - `runner.providers.openai.accounts.tetcu72`: bỏ `credentialSource` (codex-home), thay bằng `credentialSources.codex` (`codex-home`, `${HOME}/.codex-tetcu72`) và `credentialSources.pi` (`home-files`, `${HOME}/.pi/accounts/openai-tetcu72`, files `auth.json, models-store.json, settings.json, trust.json, bin/fd`). Giữ nguyên label.
  - `runner.providers.openai.accounts.fgovn` (**mới**): codex `${HOME}/.codex-fgovn`, pi `${HOME}/.pi/accounts/openai-fgovn` (cùng danh sách files).
  - `runner.providers.openai.accounts.tetnu` (**mới**): codex `${HOME}/.codex-tetnu`, pi `${HOME}/.pi/accounts/openai-tetnu` (cùng danh sách files).
  - Mọi file trong danh sách đều đã được kiểm là tồn tại (chỉ kiểm tồn tại, không đọc nội dung).
- **`~/.fgos/config.json` hiện là bản cũ, khôi phục byte-for-byte** (sha256 trùng với backup). Lý do: release fgos đang activate dùng validator cũ, coi `credentialSources` là key lạ và từ chối **toàn bộ** inventory. Như vậy mọi dispatch có lease trên máy sẽ chết, kể cả agent phase00 đang dispatch openai bằng `fgos`. Theo chỉ đạo của coordinator: không có override sẵn có nào cho đường dẫn global config (`src/config/global-config.mjs` cố định `os.homedir()/.fgos/config.json`; đổi `$HOME` sẽ làm hỏng mọi đường dẫn `${HOME}` của executor), nên chỉ swap trong lúc chạy probe:
  - Lần 1 (tetcu72): swap khoảng 10:13:30Z, restore ngay sau khi probe xong (`generated_at` 10:14:36Z). Lần này không dùng trap; restore bằng lệnh kế tiếp rồi kiểm sha256.
  - Lần 2 (fgovn, tetnu): swap 10:15:25Z, restore 10:16:50Z bằng `trap restore EXIT`.
  - Sau cả hai lần: sha256 của `config.json` bằng sha256 của `config.json.bak-261013`.
  - Trong hai khoảng này (khoảng 1 phút và 1,5 phút), một dispatch có lease chạy bằng release cũ có thể đã bị từ chối inventory. **UNPROVEN** việc có dispatch nào thực sự bị ảnh hưởng hay không.
- **Lệnh áp dụng sau khi merge và activate release mới** (kiểm bằng `fgos doctor` qua shim đã cài):

  ```sh
  cp ~/.fgos/config.json.per-cli-261013 ~/.fgos/config.json && chmod 664 ~/.fgos/config.json
  ```

- **Chú ý:** thêm `fgovn` và `tetnu` vào inventory openai thì rotator sẽ **lease được hai account này** cho mọi dispatch openai có lease, chứ không còn chỉ `tetcu72`. `fgovn` từng bị quarantine `quota-limit` tạm, đã hết hạn từ 2026-10-07.

## Tests

- Test mới fail trên code trước khi sửa: chạy file test trên `git archive HEAD` của `src` cũ thì lỗi `SyntaxError: ... does not provide an export named 'credentialSourceForCli'`. Lưu ý: lỗi xảy ra ngay ở bước import, nên chưa có test nào chạy tới phần hành vi. Trên code mới: 9/9 pass. Các test phủ:
  - schema;
  - lease theo CLI được pin và trường hợp không có account phục vụ CLI đó;
  - provisioning: pi lấy store pi, codex lấy store codex của **cùng một account**;
  - từ chối CLI không có store;
  - dạng single-source không đổi;
  - renewal/scratch nằm trong `stores/pi`, marker có `store`, write-back được dàn vào `stores/pi/pending` chứ không vào thư mục chung của account;
  - lazy probe theo CLI;
  - account probe chọn đúng invocation.
- Test có liên quan (provider-capacity, credential-probe, credential-renewal, account-probe, credential-hygiene, quarantine-probe, account-rotation, setup checks, agy-permissions, herdr trust, confinement-authority, architecture): 336/336 pass.
- Full suite (`npm test`, đã unset `CLAUDE_CODE_SESSION_ID`): xem mục kết quả suite cuối file.

## probe-account (chạy bằng code trong worktree: `node bin/fgos.mjs dispatch probe-account --provider openai --account <a> --repo-root <worktree>`)

| account | invocation | adapter | via | confined | outcome |
|---|---|---|---|---|---|
| tetcu72 | codex-cli-bwrap | cli-spawn | lease | yes | ok (`OK`) |
| tetcu72 | codex-herdr-fgovn | herdr-spawn | lease | yes | ok (`OK`, pane tự đóng) |
| tetcu72 | pi-cli-bwrap-tetnu / -fgovn / -tetcu72 | cli-spawn | lease | yes | ok ×3, trả lời OK, không có EROFS |
| tetcu72 | pi-cli-tetcu72 | cli-spawn | env | no | other: `ENOENT mkdir ~/.pi/accounts/openai-tetcu72/sessions/...` |
| fgovn | codex-cli-bwrap, codex-herdr-fgovn | | lease | yes | ok ×2 |
| fgovn | pi-cli-bwrap-* ×3 | | lease | yes | ok ×3, trả lời OK, không có EROFS |
| fgovn | codex-cli-bypass-fgovn | | env | no | sandbox: `Read-only file system` |
| fgovn | pi-cli-fgovn | | env | no | other (`node:fs`) |
| tetnu | codex ×2 | | lease | yes | ok ×2 |
| tetnu | pi-cli-bwrap-* ×3 | | lease | yes | ok ×3, trả lời OK, không có EROFS |
| tetnu | pi-cli-tetnu | | env | no | other (`node:fs`) |

- Verdict của cả ba account là `cli-fault`. Lý do: các invocation **không confine** (`pi-cli-<a>`, `codex-cli-bypass-fgovn`) vẫn được probe chạy dưới posture read-only, nên không ghi được thư mục account thật. Đây là thiết kế từ trước của RUL79/RUL77 (cửa read-only luôn có sandbox) và nằm ngoài phạm vi việc này: các invocation đó không có private home.
- Kiểm `provider-capacity-selection.json` của từng run: run của tetcu72 lease `tetcu72` (6 run), fgovn lease `fgovn` (7 run), tetnu lease `tetnu` (6 run).
- Đã kiểm `stdout`/`stderr` của các run pi confine: không có `EROFS`, và agent trả lời OK.
- Dọn dẹp: không còn pane nào của probe trong `herdr pane list` (round tự đóng, probe báo `not-open`). Root private home `/tmp/fgos-confinement` rỗng sau probe (cleanup của driver và reaper của probe đã xoá). Các thư mục assignment nằm trong `.fgos/assignments` của worktree, đều untracked và không commit.

## Rủi ro và câu hỏi mở

- **GitNexus:** index stale (last indexed `b334695`, không tìm thấy `refreshAhead`); đã cross-check bằng grep. `impact` báo **CRITICAL** cho `validateProviderAccountInventory`, `acquireProviderAccountLease`, `buildConfinementRequest`, `executeAssignment`, vì đây là đường dispatch trung tâm. Giảm rủi ro: account dạng single-source đi qua đúng code cũ (`providerCapacityForCommand` trả nguyên selection; lease không có `cli` thì không lọc). Suite và probe xác nhận điều này. `detect_changes` so với main: risk high, phạm vi khớp các symbol dự kiến.
- **Thứ tự rollout:** release cũ từ chối `credentialSources`. Chỉ áp `~/.fgos/config.json.per-cli-261013` **sau khi** release mới đã activate; các project khác trên máy cũng đọc cùng inventory này.
- **Refresh-ahead khi chưa pin:** có thể gia hạn cả store của CLI cuối cùng không chạy (chẳng hạn openai không pin thì gia hạn cả codex lẫn pi). Việc này chỉ xảy ra khi login đã trong cửa sổ sắp hết hạn, nên vô hại, nhưng tốn tối đa một cuộc gọi probe cho mỗi store.
- **Lease không pin:** không lọc theo CLI. Account thiếu store cho CLI cuối cùng được chạy sẽ fail closed ở bước provisioning, chứ không chọn account khác. Hiện ba account openai đều có cả codex lẫn pi nên chưa gặp.
- **Tên invocation lệch:** tên `pi-cli-bwrap-<account>` giờ không còn nói lên account nào chạy, vì lease quyết định account (probe tetcu72 chạy `pi-cli-bwrap-fgovn` bằng `tetcu72`). Có thể gộp ba invocation thành một `pi-cli-bwrap`. Đây là việc riêng, chưa làm.
- **pi auth.json:** layout `pi-auth-json` của renewal chọn entry theo provider family (`openai-codex`). UNPROVEN rằng `auth.json` thật của pi openai dùng đúng key đó (không đọc file credential). Nếu khác key, renewal báo `entry-unidentified` và bỏ qua; không hỏng gì.

## Kết quả full suite

- Lần chạy đầy đủ `npm test` (đã unset `CLAUDE_CODE_SESSION_ID`): 7301 test, 7150 pass, 76 fail. 76 test fail này nằm trong 7 file:
  - 75 test ở 6 file `test/rust-host/*` (dev-host, fgctl-init, fgctl-stage, fgctl-upgrade, release-targets, release-tree). Nguyên nhân là môi trường: worktree này chưa có `target/release/fgos` và `target/release/fgctl` ("Build the release fgos host before this suite").
  - 1 test `check-decision-citation-drift`: RUL80 mới trích RUL74/75/79 mà không kèm gloss. Đã sửa ở commit docs.
- Sau khi link `target/release` của worktree tới bản build release của main checkout (đây là symlink untracked, không commit) và sửa phần trích dẫn, chạy lại đúng 7 file đó: 112 test, 111 pass, 0 fail (1 test không chạy, không phải fail).
- Cả nhóm `fgctl-init` (×10) lẫn `release-tree` (×1), vốn được phép fail trên main với "--from <source> is required", đều pass sau khi link.
- Không chạy lại toàn bộ suite lần thứ hai, vì queue toàn máy đang bận với các lần chạy suite của phiên khác.

Status: DONE_WITH_CONCERNS
Summary: Account có thể khai `credentialSources` theo từng CLI. Launch confine nhận store của đúng CLI nó chạy; renewal, write-back, trust, lazy probe và account probe đều đi theo store đó. Ba account openai đã probe live: mọi invocation codex và pi confine đều ok, không còn EROFS.
Concerns/Blockers: `~/.fgos/config.json` đã khôi phục về bản cũ để release đang chạy không từ chối inventory. Bản per-CLI để sẵn ở `~/.fgos/config.json.per-cli-261013`, áp sau khi merge và activate. Hai lần swap ngắn (khoảng 1 phút và 1,5 phút) để chạy probe live.
