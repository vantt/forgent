# Lane timeout — một lượt chạy tự chọn timeout; home confinement và khoá worktree sống đủ lâu theo nó

Lane ngoài phase (owner yêu cầu, không tạo work item). Nhánh `feat/rununit-timeout`, worktree `/home/vantt/projects/forgentX-worktrees/rununit-timeout`. Đã rebase lên main `7fb996c7b` (gồm guard phase 11 / RUL95 và hai commit herdr promptDelivery, fgctl upgrade). Số rule: **RUL96** (guard lấy RUL95, sync lấy RUL97).

## Động cơ

- (1) **proven** (feedback Doer): lượt Doer nặng 30-60 phút. `fgos run` luôn dùng `cfg.timeoutMs` (35' ở repo này), vì `runUnit` không truyền `opts.timeoutMs` (`assignment-runner.mjs:1505`: `opts.timeoutMs ?? cfg.timeoutMs`).
- (2) **proven bằng test đỏ**: reaper bỏ qua home có pid sống chỉ khi tuổi ≤ `maxAgeMs` = 1h. Một home tạo cách đây 2h cho lượt 3h, pid còn sống, vẫn bị reap. `fgos run` (`run.mjs:301`) và `fgos-runner` gọi reaper mỗi lần chạy.
- (3) **proven bằng test đỏ** (lỗi mới tìm ra khi rà khoá):
  - `ttlMs` của khoá cwd = `timeoutMs` (đúng), và holder renew mỗi `timeoutMs/3`.
  - Nhưng contender phán holder "stale" bằng **ttl của chính contender**. Holder 4h renew mỗi 80'; contender 35' chiếm được khoá khi holder đã im 35-80'.
  - Trước lane này mọi lượt cùng `cfg.timeoutMs` nên lỗi không lộ ra. Timeout riêng từng lượt làm nó thành lỗi thật.
  - Repro trên code cũ: record `{pid:"<live>:<ms>:long", ts: now-70m, ttlMs: 4h}`, contender ttl 35' → `acquired`.

## Prior art

- `git log -S'timeoutMs' -- src/runner/execution/` không thấy đường timeout riêng nào ở tầng Unit từng có rồi bị xoá. `executeAssignment` đã nhận `opts.timeoutMs` và tự truyền xuống worker kill, poll pane, `ttlMs` khoá, adapter. **Tái dùng nguyên, không sửa `assignment-runner.mjs`.**
- Khuôn `--effort` / `reasoningEffort` (`bind.mjs` 7b, `bin/fgos.mjs` case `run`) được dùng nguyên cho `--timeout` / `timeoutMs`.
- Reaper: `maxAgeMs` = 1h có từ R5 (confinement P03). Marker chưa từng ghi timeout.

## Thiết kế

### (1) Timeout của một lượt
- **Ba nguồn, một khoá `timeoutMs` (ms):**
  - `fgos run --timeout <dur>`: số nguyên + một đơn vị `ms|s|m|h`, vd `90m`, `5400s`. Thêm `timeoutMs` vào mọi override chưa có, và thêm một override không scope nếu chưa có (y hệt `--effort`/`--account`).
  - Khoá `timeoutMs` trên `--override`.
  - Field Unit `timeoutMs`. Hợp contract: G2 chỉ cấm cơ chế thực thi (executor/provider/model/tier...); thời gian cần là kích cỡ của việc. Units file và template Workflow cũng mang được: `units-source.mjs`, `definition.mjs` kiểm khi load, `runner.mjs` truyền qua.
- **`bind()` 7c:** override thắng unit. Ra `binding.timeoutMs` + `provenance.timeoutMs {value, source: override:<origin>|unit|none}`. Ngoài khoảng → binding bị từ chối, `reason: run-timeout`.
- **Trước khi có unit run:** CLI parse/kiểm `--timeout`. `runUnit` kiểm `timeoutMs` của override trước khi tạo thư mục unit, `validateUnit` kiểm field Unit → không để lại unit run rác.
- **Resume:** giá trị nằm trong `unit.json` (`overrides`, `unit`, mọi binding đã ghi). Resume dùng binding đã ghi, nên giữ nguyên; `--timeout` cùng `--resume` bị từ chối. Fallback `nextCandidate` (bind lại cùng ask) và `retrySameCandidate` (spread binding) đều giữ timeout; có test cho cả ba.
- **`run.mjs`** truyền `timeoutMs: bound.timeoutMs` vào `executeAssignment` khi bind có giá trị; không có thì `cfg.timeoutMs` như cũ.
- **Khoảng 1m..4h** (`src/runner/dispatch/run-timeout.mjs`, leaf không import, `kernel` trong manifest):
  - Sàn 1m: gõ nhầm `90s` thay `90m` không giết lượt ngay.
  - Trần 4h = 4× lượt nặng nhất đã thấy (~1h). Nó chặn thời gian một worker treo giữ khoá worktree và một bản copy login account.
  - `runner.timeoutMs` > 4h giờ bị từ chối khi load config (red-team H2). Mọi config thật đang dùng: 15' hoặc 35'.

### (2) Reaper (`cleanup.mjs`)
- `writeOwnershipMarker` nhận và ghi `timeoutMs`; bwrap driver truyền `request.context.timeoutMs` (đã có sẵn trong context).
- **Home không có pane, pid sống:** giữ tới `createdAt + max(maxAgeMs, min(marker.timeoutMs, 4h) + 10m)`.
- Marker không có timeout (cũ) → quy tắc 1h cũ.
- Pid chết → reap ngay.
- Home giữ cho pane → không đổi.
- Marker giả (chuỗi/âm/Infinity/9e15) → bị kẹp ở trần 4h, không bao giờ giữ mãi.

### (3) Khoá cwd dispatch (`main-checkout-lock.mjs`)
- Holder có identity composite (`pid:ms:rand`, chỉ khoá dispatch) ghi `ttlMs` vào record và giữ nó qua renew/self-reacquire.
- Contender phán holder **sống** bằng `max(ttl của mình, min(ttl của holder, 4h))`.
- Identity số / chuỗi opaque (main-checkout.lock, session id, claim) không ghi `ttlMs` → hành vi và bytes không đổi.
- `remainingTtlMs` báo ttl hiệu lực.
- Heartbeat `timeoutMs/3` ≤ 80' (vì `runner.timeoutMs` ≤ 4h) → không cần sửa `assignment-runner.mjs`.

## File lane guard giữ

**Không sửa** `src/runner/dispatch/{assignment,assignment-policy,plan,assignment-runner,cli}.mjs`, `work-dispatch.mjs`, `test/architecture.test.mjs`. Không cần ghi chú rebase cho guard.

Hai file dùng chung khác, rebase có thể đụng:
- `docs/specs/runner.md`: RUL96 nằm ngay sau RUL95 (đã giải conflict khi rebase lên guard).
- `CHANGELOG.md`: một dòng đầu `### Added`.

## Commit

| sha | subject |
|---|---|
| 5693500c3 | feat(runner): let one run take its own timeout and keep its private home alive for it |
| 7eec849ac | fix(runner): judge a live dispatch lock by the ttl its holder took |
| 6020bcf0b | fix(runner): hold every run timeout and dispatch-lock ttl to the 4h ceiling |
| dc34b2582 | docs(runner): record that one run may take its own timeout from 1m to 4h |
| 88e7c4cb2 | test(hooks): copy the run-timeout leaf the lock module now imports into hook fixtures |

(Sha sau rebase lên `7fb996c7b`.)

## Test đỏ → xanh

Đỏ trước, chạy `env -u CLAUDE_CODE_SESSION_ID node --test`.

- **Lượt 1 (feature):** 5 fail.
  - `validateUnit: a unit may ask for its own run timeout` — throws chưa xảy ra.
  - `bind: a run timeout comes from an override, else the unit...` — `none.timeoutMs` undefined.
  - `fgos run "<prompt>" --timeout gives the run its own time...` / `fgos run --timeout is refused...` — "should have failed".
  - `test/runner/dispatch-run-timeout.test.mjs` — `does not provide an export named 'RUN_TIMEOUT_MAX_MS'`.
- **Reaper (sau khi có export):**
  - `the reaper keeps the home of a live run still inside its own timeout, past the default hour` — `actual: ['dead-run','forged-run','legacy-run','long-run','overdue-run']`, `expected` không có `long-run`.
  - `the ownership marker records the run timeout...` — `actual: undefined, expected: 5400000`.
- **Khoá:** `a live dispatch-lock holder is judged by the ttlMs it took...` — trên code cũ `fail 1`; repro trực tiếp: `contender: acquired`.
- **Sau red-team** (3 fail):
  - `a dispatch-lock holder's recorded ttl is honoured only up to the run-timeout ceiling`.
  - `runner.timeoutMs is held to the same ceiling as a run timeout`.
  - `a duration too large to count is refused with the text that was typed`.
- **Test chứng minh** (M3 của review, xanh ngay vì code đã đúng; chúng khoá hành vi):
  - Rotation + next-candidate giữ `timeoutMs` trên cả 3 attempt và 3 `run.json` (`run-provider-failover.test.mjs`).
  - Resume giữ 90m dù resume truyền override 2m (`run.test.mjs`).
  - Units file truyền tới `run.json` (`units-runner.test.mjs`).
- **Sửa kỳ vọng test cũ:** `test/state/domain-registry-compiled.test.mjs`. Danh sách file nó chép để load `definition.mjs` không cần `node_modules` phải thêm `run-timeout.mjs`, vì `definition.mjs` import leaf mới. Tên test không đổi nghĩa.

## Impact (GitNexus present, index **stale**: indexed `b334695`)

- `reapOrphanedConfinementResources` **HIGH** (3 caller trực tiếp: `run.mjs`, `loop.mjs` runOnce, doctor fix).
- `bind` HIGH (đã biết).
- `renewMainCheckoutLockIfOwn` **CRITICAL** (9 flow: `executeAssignment`, `dispatchBound`, loop `dispatchClaimedItem`, `planUseCase`...).
- `validateUnit`, `writeOwnershipMarker`, `runUnit` LOW. `runUnit` LOW là đếm thiếu do index stale; cross-check `rg`: caller thật gồm `bin`, `work-dispatch`, `operation-choice`, `fanout-batch`, workflow runner.

Giảm rủi ro cho khoá: chỉ đổi nhánh composite identity, field thêm vào là additive. Mọi reader khác chỉ đọc `.pid` / `.ts`: resume guard `run.mjs`, `reconciliation-planner` cwdLockHolder, `inspectMainCheckoutLock`.

`detect_changes(compare main)`: 25 file, risk high. Symbol đổi đúng kỳ vọng. Flow `ClaimWork → parseLockContent/tryAcquireOnce` bị chạm, nhưng identity của claim không phải composite → không ghi/đọc `ttlMs`.

## Review độc lập (code-reviewer)

DONE_WITH_CONCERNS, không có critical/high.

- **M1 thiếu spec/CHANGELOG:** đã áp.
- **M2 pid-reuse giữ khoá tới ttl holder:** kẹp 4h + ghi residual vào RUL96.
- **M3 thiếu test resume/fallback/rotation:** đã thêm.
- **L3 comment `definition.mjs`:** đã sửa.
- **L1** `--override` với `--resume` bị bỏ qua im lặng: hành vi có sẵn cho mọi key override. Ghi vào RUL96, không đổi.
- **L2** gate mutating không so `timeoutMs`: không phải ranh giới tin cậy (caller in-process); để ngỏ.
- **L4** `runner.timeoutMs` > 4h: đã chặn (cùng H2).

## Red-team (code-reviewer, adversarial)

- **H1** (Medium, HIT): `record.ttlMs` không trần → pid tái dùng chặn tới 9e15ms. **Sửa:** kẹp `min(record.ttlMs, 4h)`; test đỏ → xanh.
- **H2** (Low-Med, HIT): trần 4h của reaper lệch `runner.timeoutMs` không giới hạn. **Sửa:** config > 4h bị từ chối; test đỏ → xanh.
- **H3** (HIT): thiếu CHANGELOG/spec. Đã áp.
- **H4** (Low, HIT): số quá lớn báo `got: null`. **Sửa:** báo bằng text đã gõ; test đỏ → xanh.
- **MISS (đã thử, giữ được):**
  - Input CLI: `''`, `0m`, `1e3s`, `90M`, `+90m`, chữ số Ả Rập, `241m`, `59999ms`; `'  90m '` / `00090m` / `4h` / `60000ms` hợp lệ.
  - Giá trị override: chuỗi, âm, float, null, Infinity, `{}`, NaN.
  - Unit/YAML.
  - Không đường nào tạo unit run rồi mới từ chối.
  - Resume / fallback / rotation.
  - Marker reaper giả, `createdAt` tương lai (không phải regress).
  - Doctor `countDeadOwnedConfinementDirs` vẫn khớp reaper (chỉ đếm pid chết).
  - Identity khoá không composite.
  - Record khoá cũ.
  - Import cycle: 11 module load sạch trong process mới. Lúc làm tự bắt được một cycle `config → backend-registry → bwrap → cleanup → config` → tách leaf `run-timeout.mjs`.

## `npm test`

- Lượt 1 (trước sửa review, trước rebase): `tests 7650, pass 7574, fail 1, exit=1`. Fail duy nhất: `test/state/domain-registry-compiled.test.mjs` (`Cannot find module .../run-timeout.mjs`, fixture chép thiếu leaf mới) → đã sửa.
- Lượt 2 (trên `febafe586`): dừng giữa chừng khi Lead báo guard sắp vào main.
- Lượt 3 (trên guard tip `7fb996c7b`): `tests 7677, pass 7561, fail 41, exit=1`.
  - Một nguyên nhân: 3 test e2e hook (`main-checkout-lock-hook*.test.mjs`, `root-file-guard-hook.test.mjs`) chép `main-checkout-lock.mjs` + danh sách import cứng vào repo tạm. Commit kẹp 4h làm module khoá import leaf `run-timeout.mjs` → `ERR_MODULE_NOT_FOUND` trong hook.
  - Sửa: thêm leaf vào bộ chép của fixture (`88e7c4cb2`). Không nới kiểm tra; hook thật chạy từ repo đầy đủ.
- **Lượt 4 (main = `7fb996c7b`, đủ 5 commit): `tests 7677, pass 7602, fail 0, skipped 10, exit=0`.**
- Guard phase 11 (`test/architecture.test.mjs`, RUL95) xanh trên code lane, không cần sửa code. Conflict rebase duy nhất: `docs/specs/runner.md` RUL95/RUL96 cùng chỗ → giữ cả hai theo thứ tự số.
- Log: `/tmp/claude-1000/fgos-work/lane-timeout-npmtest-{1,3,4}.log` (ngoài `.fgos`).

## Spec delta (đã áp trong lane)

- `docs/specs/runner.md`:
  - Thêm **RUL96 (one run may take its own timeout, from 1m to 4h; its private home and worktree lock last as long)** sau RUL94.
  - Bảng config dòng 75: `timeoutMs` là trần mặc định, tối đa 4h, một lượt có thể xin riêng.
  - Thêm dòng code-path `src/runner/dispatch/run-timeout.mjs`.

## CHANGELOG delta (đã áp)

- `## [Unreleased]` → `### Added`:
  - `fgos run --timeout <dur>` / `"timeoutMs"` trong `--override` / `timeoutMs` của Unit (1m..4h, giữ khi resume).
  - Lượt > 1h không bị reap home giữa chừng.
  - Lượt timeout ngắn không chiếm khoá worktree của lượt dài.
  - `runner.timeoutMs` > 4h bị từ chối.

## Còn để ngỏ

- `--override` truyền cùng `--resume` vẫn bị bỏ qua im lặng, cho mọi key: hành vi có sẵn. Muốn từ chối thì làm cho cả `--effort` / `--override`, ngoài phạm vi lane này.
- Pid tái dùng sau khi holder bị SIGKILL: khoá cwd bị giữ tới ttl của holder (≤ 4h) thay vì ttl contender. Gỡ tay bằng `fgos dispatch reconcile`. Gốc là khoá composite không ghi process start time (gap có từ trước).
- `fgos workflow start` chưa có cờ `--timeout` cho cả run (unit trong units file / template thì đã mang được).
- Một lượt đã hết giờ không resume với thời gian dài hơn được: `--timeout` bị từ chối khi resume theo yêu cầu "resume giữ nguyên". Nếu owner muốn "resume với giờ mới" thì đó là quyết định riêng.
- GitNexus index stale (`b334695`): blast radius có thể đếm thiếu; đã cross-check `rg`.

Status: DONE_WITH_CONCERNS
Summary: `fgos run --timeout`, override `timeoutMs` và field Unit `timeoutMs` (1m..4h, lưu `unit.json`, resume giữ nguyên) truyền xuống `executeAssignment` mà không sửa `assignment-runner.mjs`. Reaper giữ home của lượt còn sống trong hạn timeout của chính nó. Sửa thêm lỗi khoá cwd mới lộ ra: contender timeout ngắn chiếm khoá của lượt dài. Review độc lập + red-team: 4 HIT đều đã sửa kèm test đỏ → xanh.
Concerns: pid-reuse giữ khoá tới 4h (residual ghi trong RUL96); `--override` cùng `--resume` bị bỏ qua (có từ trước); `workflow start` chưa có `--timeout` cho cả run. `npm test` xanh trên main `7fb996c7b` (7677/0 fail).
