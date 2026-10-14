# Lane account — ghim account cho `fgos run` + chặn chạy lại chồng sau provider-limit

Lane ngoài phase (owner yêu cầu, không work item). Nhánh `feat/rununit-account`, worktree `/home/vantt/projects/forgentX-worktrees/rununit-account`, rebase trên main `ee4671ad9`.

## Động cơ

- (A) **proven**: gate-m1 ca 6/10 phải ghim invocation qua `--override` để né account `fgovn` hết quota; không có cách ghim account. Selector tự né được (ca 9) nhưng người không chọn được account cụ thể.
- (B) **UNPROVEN trên lượt thật** (chưa thấy ca thật nào ghi dở rồi bị rotate), nhưng **proven trên test**: trước sửa, seat ghi `notes.txt` + rename `README.md` rồi gặp quota bị rotate sang `1-fb1` chạy chồng, kết thúc `execution-failure` (log đỏ dưới).

## Prior art

- `fgos dispatch probe-account --account` (RUL79): `configPinnedToAccount` ở `src/runner/dispatch/provider-account-probe.mjs` (không nằm trong `cli.mjs`, nên không phải chuyển module). Tái dùng nguyên: dispatch của seat ghim nhận inventory thu hẹp còn đúng một account → lease vẫn chạy qua `acquireProviderAccountLease`, quarantine vẫn từ chối, governance không đổi.
- `--effort` (đường override có sẵn) làm khuôn cho `--account`.
- `capacityProviderOf` chuyển từ `account-rotation.mjs` sang `account-pin.mjs` (một định nghĩa, hai nơi dùng).
- Không tìm thấy cơ chế ghim account hay kiểm ghi-dở nào đã có rồi bị xoá (`git log -S'pinnedAccount'`, `-S'preferAccount'`, `-S'partial-writes'`: rỗng).

## Thiết kế

### Hình đã chọn (một hình)
`account` là **key trên override object** (`--override '{"account":"tetnu"}'`); `--account <id>` chỉ là đường tắt thêm key đó vào mọi override chưa có (y như `--effort`). **Không** thêm field trên Unit: G2 đã từ chối executor/provider/invocation trên Unit, account là id máy-cục-bộ của inventory global, không mang được trong file unit/workflow. Không làm cho `workflow start` (ngoài phạm vi; ghi ngỏ).

### A — ghim account
- `bind()` (sau khi chọn executor + mechanism): `resolveAccountPin` → account nằm trong `providers.<provider>.accounts` của provider executor đã bind (provider chuẩn hoá như lease) thì gắn `binding.account = { provider, id }`, `provenance.account = { value, source: 'override:<origin>' }` (`override:human-cli` cho cả `--account` lẫn `--override`).
- Seat mà provider không có account đó (checker khác family, executor không có account list, tool/inline) **bind không ghim**, ghi `provenance.account.skipped {reason, detail}`. Id rỗng/không phải chuỗi → refusal `account-pin-invalid`. Key kế thừa (`__proto__`, `constructor`) không bao giờ là account (`Object.hasOwn`).
- **Trước khi tạo unit run** (`assertAccountPinsBeforeRun`, chỉ chạy khi có override `account`): dry-bind mọi seat theo pattern thật (`simulateUnitBindings` nay nhận `overrides`, herdr detect như run thật). Không seat nào nhận pin → từ chối, nêu lý do từng role (đây là ca "account của provider khác" / "executor không có account list"). Account đang quarantine → từ chối, thông điệp nêu `until` + reasonCode.
- **Resume**: không nhận `--account` (CLI từ chối); binding đã ghi giữ pin; account ghim đang quarantine → resume bị từ chối trước dispatch, nêu `until`.
- **Dispatch**: `dispatchBound` dùng `runnerConfigForBinding` → inventory còn một account → lease chọn đúng account đó hoặc từ chối (`provider-capacity.exhausted-or-quarantined`).
- **Ghim = cứng**: provider-limit trên seat ghim → `fallbackExhausted.reason: 'account-pinned'`, không rotation, không failover; `attempts[n].retryStopped` ghi lại.
- Quyết định sau review (M4, phân tích chọn rõ, không hỏi lại): ghim áp cho **seat có provider sở hữu account** thay vì "mọi seat". Lý do: checker buộc khác family nên "mọi seat" làm `--account` vô dụng với reviewed/panel; "chỉ producer" sai khi người scope pin cho reviewer. Pin không lái việc chọn executor — dùng kèm `--provider`.

### B — chặn chạy lại chồng
- Mỗi lần launch một **seat ghi** (`readOnly === false`), runner chụp `writeBaseline = { head, files: {path: sha256|link:|null|unreadable:size:mtime} }` của worktree (`git status --porcelain -z --untracked-files=all`, bỏ `.fgos/`), lưu vào attempt. Chụp lại ở **mỗi lần launch** (resume cũng vậy). Seat read-only (sandbox) không chụp → không bao giờ bị dừng vì thay đổi nó không thể làm (vd. `verify` chạy song song).
- Provider-limit: so baseline với hiện trạng. Có path khác hoặc HEAD đổi → dừng, `outcome: provider-limit`, `fallbackExhausted: { reason: 'partial-writes', paths, headMoved, detail, accountPinned? }`, `attempts[n].retryStopped` ghi lại; không rotation, không failover. Kiểm này chạy **trước** kiểm pin, nên seat ghim vẫn nêu path.
- Không chụp được baseline (git lỗi) → `writeBaseline.error`, gặp limit thì dừng bảo thủ. File đọc không được → ghi `unreadable:`, không crash.
- Unit read-only, hoặc worktree không đổi → rotation/failover như cũ.

## Commit

| sha | subject |
|---|---|
| `a1f69644e` | feat(runner): pin the provider account of a unit run with --account |
| `dc22a2e51` | fix(runner): do not rerun a writing seat over its own partial writes after a provider limit |
| `6ae51505d` | fix(runner): pin an account only on seats of its provider and judge partial writes per launch |

File: `src/runner/execution/{account-pin.mjs (mới), partial-writes.mjs (mới), bind.mjs, dry-bind.mjs, run.mjs, account-rotation.mjs}`, `bin/fgos.mjs` (chỉ case `run`), `src/cli/command-registry.mjs` (flag `account` của `run`; `export-command-selectors --check` = 0, không thêm verb), `docs/architecture-manifest.json` (2 row), test.

**Phối hợp file run.mjs** (lane driver 10 giữ declared/dispatchBound/pinInputs): ngoài khối rotation còn đụng — (1) một dòng đầu `dispatchBound`: `runnerConfigForBinding(...)`; (2) `snapshotRunnerConfig` dời lên trước khi tạo unit dir + gọi `assertAccountPinsBeforeRun`; (3) kiểm pin khi resume sau `assertNoStrayCommit`; (4) chụp `writeBaseline` ngay trước `dispatchBound` trong vòng attempt. Không đụng `pinInputs`/declared. bin chỉ đụng case `run`, sau khối `--effort`.

## Test đỏ → xanh

Đỏ (trước code, `run-provider-failover.test.mjs` + `account-pin.test.mjs`):
```
✖ a pinned account runs, even when the lease would rank another account first  actual: 'a1' expected: 'a2'
✖ a provider limit on a pinned account ends the seat: no rotation, no other executor  actual: 'pass' expected: 'provider-limit'
✖ a quarantined pinned account is refused before any unit run exists, ...  actual: 'pass' expected: 'provider-limit'
✖ an account of another provider is refused before any unit run exists  Missing expected rejection.
✖ a writing seat that changed the worktree before a provider limit stops instead of running again
   actual: 'execution-failure' expected: 'provider-limit'  (runId …/producer/1-fb1_01: đã rotate chạy chồng)
✖ a file already dirty before the launch that the seat changed again also stops the retry  (giống trên)
✖ test/runner/execution/account-pin.test.mjs  (module chưa có)
```
CLI (`test/cli/run-verb.test.mjs`): `--account` trên executor không có account list chưa bị từ chối; `--resume --account` báo "unit.json not found" thay vì từ chối flag; `--account` rỗng không báo.
Vòng 2 (finding review/red-team), 9 đỏ: pin trên seat khác provider vẫn refuse cả run; seat ghim ghi dở chỉ báo `account-pinned`; reviewer read-only có `writeBaseline`; resume giữ baseline cũ (dừng `partial-writes` oan); file không đọc được làm crash; key `__proto__`.
Xanh: focused 373/373 (`test/cli/run-verb`, `test/runner/execution/*`, `test/architecture`, `test/workflow/units-runner`, `test/setup/{blind-steps-proven-pools,workflow-pool-independence}-check`, `test/rust-host/command-routes`).

Test mới: `account-pin.test.mjs` (bind thuần, 9), `partial-writes.test.mjs` (HEAD đổi với tree sạch, dirty không đổi, file không đọc được), 10 ca tích hợp trong `run-provider-failover.test.mjs` (worker bwrap thật, login marker `partial`/`partialtouch` mới), 4 ca CLI.

## Impact

`fgos tool query --capability impact-analysis --status present` → 0 present; GitNexus đăng ký với status `unknown` → **degraded**, blast radius chưa xác nhận bằng graph (index stale, last b334695). Cross-check `rg`: `bind()` gọi từ run.mjs, dry-bind.mjs, `src/setup/{registrations,blind-steps-proven-pools}.mjs`; `simulateUnitBindings` từ `src/workflow/runner.mjs`, `src/setup/{workflow-pool-independence,blind-steps-proven-pools}.mjs`. Nhánh mới chỉ chạy khi override có `account` (bind) hoặc seat ghi (baseline); `simulateUnitBindings` mặc định `overrides: []` như cũ. Đã biết từ protocol: `bind` HIGH — thay đổi trong bind là cộng thêm, không đổi binding nào không có `account`.

## Review độc lập + red-team

- Review (`reports/review-rununit-account-261014.md`): 0 HIGH, 4 MEDIUM — M1 pin che partial-writes, M2 reviewer read-only bị dừng oan khi `verify` ghi, M3 baseline cũ qua resume, M4 `--account` hỏng reviewed/panel → **đã sửa cả 4** (commit `6ae51505d`). LOW: L2 (crash file không đọc được, đọc cả file vào RAM) đã sửa (hash stream + `unreadable:`); L1 dry-bind thiếu herdr → đã truyền `herdrPresent`, `blind` không truyền (chỉ ảnh hưởng producer inline khi có Lead, mà unit run mặc định headless); L4 (pin chưa kiểm login store theo CLI) — lease vẫn từ chối `no-account-for-cli` lúc dispatch, an toàn nhưng là sau khi unit run tồn tại, để ngỏ; L5 `capacityProviderOf` vs lease có thể lệch provider cho executor không khai `providerModel` (code cũ, mọi executor hiện tại đều khai), để ngỏ; L6 snapshot config chạy sớm hơn, nhỏ.
- Red-team (`reports/redteam-rununit-account-261014.md`, file đòn `scratchpad/redteam/redteam-rununit-account.test.mjs`) — đòn sàn và kết quả **sau sửa**:

| Đòn | Kết quả |
|---|---|
| Ghim account bị quarantine | MISS (từ chối trước unit run, nêu until) |
| Account của provider khác; + `--override executor` provider khác | MISS (applies to no seat) |
| Ghim + executor failover (rotation, walk, fallback trong dispatch) | MISS (unit-run không có `fallbackExecutors`) |
| Resume sau ghim: quarantine / hết quarantine / có bỏ pin không | MISS ×3 |
| Resume sau partial-writes, giữ việc | HIT (medium) → **đã sửa**, nay MISS |
| Rename/xoá/ghi/sửa tiếp file dirty/chmod file tracked/file mới trong dir untracked | MISS |
| Worker `git add/commit/update-index` | MISS (gitdir RO trong bwrap) |
| Limit ở reviewer read-only của Unit ghi | MISS |
| Như trên + `verify` ghi file | HIT (medium) → **đã sửa**, nay MISS |
| Id `__proto__`/`constructor` | HIT (low) → **đã sửa**, nay MISS |
| Scope tới role không tồn tại; hai override khác account theo role; `openai`/`codex` | MISS |
| Ghi vào path gitignore; `<worktree>/.fgos/`; repo git lồng / submodule dirty; chmod-only file vốn dirty; empty dir; ghi rồi trả lại | **còn mù** (6 đòn đỏ trong file red-team) — chấp nhận, ghi vào spec: không path nào lọt vào commit của runner (runner chỉ commit write scope, `.fgos/**` cấm theo ADR0020) |

## `npm test`

Lượt 1 bị dừng (code đổi giữa chừng). Lượt 2 trên HEAD `6ae51505d` (rebase trên main `ee4671ad9`), `env -u CLAUDE_CODE_SESSION_ID npm test`: **exit=0**, tests 7615, pass 7540, fail 0, skipped 10, ~7 phút. Log ngoài `.fgos` (scratchpad phiên).

## Spec delta (`docs/specs/runner.md`, đề xuất RUL90/RUL91 — Lead cấp số)

- **RUL90 (a person may pin the provider account of a unit run; the pin is hard and never bypasses the lease, 2026-10-14).** `fgos run --account <id>`, or an `account` key on an `--override` object (one shape; a Unit carries no account), pins a provider account. `bind()` pins it on each seat its override reaches whose bound executor's provider (normalized as the lease does) lists it in `providers.<provider>.accounts`: `binding.account = { provider, id }`, `provenance.account = { value, source: override:<origin> }`. A seat on another provider, an executor without an account list, and a tool or inline binding bind unpinned with `provenance.account.skipped`; the pin never chooses the executor (pair it with `--provider`); a malformed id is refused (`account-pin-invalid`). Before the unit run exists the seats are dry-bound as the run would bind them: a pin no seat takes, or a quarantined account (message names `until`), is refused. A pinned seat is dispatched with the inventory narrowed to its account (`configPinnedToAccount`, as RUL79 (`fgos dispatch probe-account`)), so the lease, quarantine and governance apply unchanged. A provider limit on a pinned seat ends it (`fallbackExhausted.reason: account-pinned`, `retryStopped` on the attempt): no account rotation, no executor failover. `--account` is refused with `--resume`; a resumed run keeps its bindings' account and is refused while that account is quarantined. Open: the login store per CLI (RUL80 (an account is chosen first, then a CLI)) is checked only by the lease at dispatch; `workflow start` has no `--account`.
- **RUL91 (a writing seat is not run again over its own partial writes after a provider limit, 2026-10-14).** At every launch of a seat that writes (a resumed launch included), the runner records the worktree's HEAD and the content of every path `git status` sees as changed (`writeBaseline` on the attempt; `.fgos/` left out, an unreadable file recorded by size and mtime). When the seat stops on a provider limit and the worktree differs (a write, rename, delete, a further change to a file already dirty, a moved HEAD), it is not rotated to another account nor walked to another candidate: the seat ends `provider-limit` with `fallbackExhausted: { reason: partial-writes, paths, headMoved }` and `retryStopped` on the attempt, for a person to keep, finish or undo and resume. This check runs before the pinned stop. A read-only seat records no baseline and rotates as before (its sandbox keeps the worktree; a concurrent `verify` write never stops it), as does a writing seat that left the worktree as it was; a baseline git could not take stops the retry. Not seen: gitignored paths, `.fgos/`, changes inside a nested repository or a dirty submodule, a mode-only change to a file already dirty — none of them reaches the runner's commit.
- Reading map / Shared Entities: `src/runner/execution/account-pin.mjs` — account pin (`resolveAccountPin`, `runnerConfigForBinding`, `assertPinnedAccountsUsable`, `capacityProviderOf`); `src/runner/execution/partial-writes.mjs` — `worktreeSnapshot`, `writesSince`.

## CHANGELOG delta (`## [Unreleased]` → `### Added`)

- `fgos run --account <id>` (or `"account"` in `--override`) pins the provider account: each seat whose bound executor's provider lists that account runs on it, through the normal lease. A pin no seat can take, or an account that is quarantined (the message says until when), is refused before anything runs, and a resume is refused while the pinned account is quarantined. A provider limit on a pinned account ends the seat instead of switching account or executor. Pair it with `--provider` to choose the executor.
- A writing seat that already changed the worktree when it hit a provider limit is no longer run again on another account or executor on top of that half-done work: the unit stops as `provider-limit` with `fallbackExhausted.reason: "partial-writes"` and the changed paths. Read-only seats, and seats that changed nothing, rotate as before.

## Để ngỏ

1. RUL90/RUL91 số hiệu + áp spec/CHANGELOG (Lead / lane docs).
2. L4: kiểm login store theo CLI ngay trong pin pre-check (hiện lease từ chối lúc dispatch, sau khi unit run đã tạo).
3. L5: `capacityProviderOf` có thể lệch provider so với lease cho executor không khai `providerModel` (code cũ; config hiện tại không dính).
4. `workflow start --account` chưa có.
5. Điểm mù snapshot (gitignore, `.fgos/` trong worktree, repo lồng) — chấp nhận, ghi trong RUL91.
6. Khi cut/driver merge cần rebase; xung đột dự kiến ở run.mjs (dòng đầu `dispatchBound`, khối tạo unit) và bin case `run`.

Status: DONE_WITH_CONCERNS
Summary: `fgos run --account` (= `account` trên `--override`) ghim account cho các seat có provider sở hữu nó, kiểm trước khi tạo unit run (quarantine nêu until), lease vẫn qua provider-capacity với inventory thu hẹp, limit trên account ghim dừng seat; seat ghi đã đổi worktree trước provider-limit dừng với `partial-writes` + paths thay vì rotate/failover chạy chồng. Đỏ→xanh, review 4 MEDIUM + red-team 3 HIT đã sửa, `npm test` xanh.
Concerns: spec/CHANGELOG delta chưa áp (RUL90/91 chờ Lead cấp số); điểm mù snapshot (gitignore, `.fgos/` trong worktree, repo lồng) chấp nhận và ghi trong RUL91; L4/L5 để ngỏ; run.mjs đụng ngoài khối rotation (dòng đầu `dispatchBound`, khối tạo unit, resume) — cần rebase khi driver/cut merge.
