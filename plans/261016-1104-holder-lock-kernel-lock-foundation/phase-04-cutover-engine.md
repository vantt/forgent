# Phase 04: engine cutover hai pha, hàng rào theo hình dạng, marker, sàn, revert

Wave 2. Nhánh `holder-lock/p04-cutover-engine`, worktree `.claude/worktrees/hl-p04`. Phụ thuộc: P01 (`scan`), P02 (route `quiesce-scan`), P03 (facade, registry, `familyActive`, `LOCK_PROTOCOL`).

## Yêu cầu (r4 §6.8)

Mô-đun `src/holder-lock/cutover.mjs` + verb `fgos lock cutover <family>|--all [--revert] [--attest-quiescent] [--json]`. Doctor `lock-cutover` (P11) gọi cùng engine cho phần báo và fix. Trạng thái mỗi họ: `v1 → fenced → active`; ghi vào `<locks>/<family>.cutover.json` (`{state, fencedAt, scans:[...], activatedAt}`), marker `<family>.active` chỉ ghi ở bước bật.

1. **Tiền điều kiện:** driver của thư mục lock của họ có `exclusion ∈ {kernel, kernel-unmeasured}`; khác → từ chối `lock-driver-unavailable` (Windows/NFS ở 4.2, Lead D6), họ giữ v1. Release đang chạy có `LOCK_PROTOCOL ≥ 3`.
2. **Pha 1 — hàng rào** (dưới điều kiện người vận hành đã dừng writer):
   - `tombstone`: với mỗi `v1Path` có sẵn của họ (đường cố định + liệt kê mọi run dir cho `advance`/`recovery` + mọi worktree từ `git worktree list --porcelain` và mọi claim cho `dispatch-cwd`, cả dạng `path.resolve` lẫn `realpath`): `mkdir` độc quyền tại đúng đường dẫn rồi ghi `TOMBSTONE` (`{family, by, at, protocol:3}`). Nếu `mkdir` gặp `EEXIST` vì file v1 đang có (holder cũ vừa link) → **huỷ cutover cả họ**, gỡ những tombstone đã đặt trong lần này, báo holder. Không bao giờ xoá file v1 của người khác.
   - `blocking-generation`: với mỗi thư mục ledger của họ: đọc thế hệ hiện tại theo đúng luật của v1 (`currentGeneration`, [`provider-capacity.mjs:463`](../../src/runner/dispatch/provider-capacity.mjs)); nếu đang `held` bởi holder sống → huỷ; nếu không, publish bằng `link` thế hệ kế với `{holder:{pid:1}, fence:{family, protocol:3}}` — **không** có `processStartTime`, `bootId` (Argon R4-3). `EEXIST` → đọc lại, quyết lại.
3. **Pha 2 — quiescence:** gọi `fgos internal quiesce-scan`; với mỗi process fgOS liên quan, phân loại payload root: source checkout có `src/holder-lock/protocol.mjs` với `LOCK_PROTOCOL ≥ 3` → mới; release có manifest `lockProtocol ≥ 3` → mới; còn lại hoặc không đọc được → **cũ**. Còn process cũ → `fenced` (chưa bật), in danh sách, lần chạy sau quét lại. Nền không quét được (`Unsupported`) hoặc có mục `unreadable` → chỉ qua khi có `--attest-quiescent` (người xác nhận), ghi vào `cutover.json`.
4. **Bật:** quét lại lần cuối ngay trước khi ghi; sạch → ghi `<family>.active`, rồi ghi sàn (`lock-protocol-floor.json` của workspace; họ máy ghi cả sàn máy). Họ `dispatch-cwd` thêm ba điều kiện r4 §6.8 bước 1, theo Lead D9: activation hiện tại và `previousArtifactDigest` của workspace đều có `lockProtocol ≥ 3`.
5. **Revert** (`--revert`): ngược hai pha — gỡ `<family>.active`; quét tới khi không còn process **mới** giữ lock của họ (dùng `probe` từng `v3Path` + quét process theo payload `≥ 3`); rồi gỡ tombstone (`rm -r` chỉ thư mục có `TOMBSTONE` của đúng họ) và để nguyên thế hệ chặn nhưng publish thêm một thế hệ `releasedAt` cho nó (v1 thấy trống). Sàn không hạ (rollback chỉ về release ≥ R-dual, r4 §6.8 bước 6).
6. **Lười:** facade (P03) ở đường v3 tự đặt tombstone cho `v1Path` của tài nguyên lần đầu acquire (run mới, cwd mới) bằng cùng hàm `placeTombstone` của engine; thế hệ chặn lười cho account chưa có ledger.

Lỗi code cũ gặp hàng rào: `EISDIR` thô hoặc "held by pid 1" (chấp nhận, r4 §6.8). Code R-dual gặp hàng rào trong lúc marker chưa có → lỗi có tên `lock-cutover-pending` chỉ tới `fgos lock cutover <family>`, không tự xoá.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/holder-lock/cutover.mjs`, `src/verbs/lock/cutover.mjs` |
| sửa | `bin/fgos.mjs` (chỉ dòng dispatch verb `lock`), `src/cli/command-registry.mjs` (help `lock cutover`), `packages/host-runtime/contracts/command-routes.json` (sinh lại bằng `scripts/export-command-selectors.mjs`) |
| tạo | `test/holder-lock/{cutover-tombstone-v1.test.mjs,cutover-ledger-fence-v1.test.mjs,cutover-two-phase.test.mjs,cutover-revert.test.mjs,cutover-lazy.test.mjs}`, `test/cli/lock-cutover.test.mjs` |

Không phase nào khác sửa `bin/fgos.mjs` trong 4.2; cần thì đi qua Lead.

## Test (trước writer đầu tiên)

1. **Tombstone với code v1 thật** (import đúng module hiện có, không bản sao): sau pha 1, `acquireGatewayLock`, `acquireSessionsLock`, `acquireRunnerLock`, `acquireAdvanceLock` (qua `withAdvanceLock`), `withRunLock` của `recover.mjs`, `withLocalLock` của reconcile, `acquireFullSuiteQueue` (lockPath tạm), `acquireMainCheckoutLock({lockFile: dispatchLockFile(cwd)})` đều thất bại (không vào vùng găng). Ghi cách mỗi cái thất bại (EISDIR, timeout, vòng lặp) vào báo cáo; cái nào **treo** thay vì lỗi phải có timeout trong test và ghi vào CHANGELOG như hành vi của release cũ.
2. **Thế hệ chặn với code v1 thật:** `tryAcquireAccountLock` trước chặn → handle, sau chặn → `null`; `withFileLock(state-lock)` sau chặn → `ProviderCapacityLockError` sau `waitMs` ngắn; chạy cả trong `bwrap --unshare-pid` nếu máy có (Argon R4-3).
3. **Hai pha, holder xuất hiện sau quét đầu** (lịch `r3-cutover` của Astra): pha 1 xong, lần quét đầu sạch, rồi khởi động một process "cũ" (một bản sao payload không có `src/holder-lock/protocol.mjs`, chạy `node` với cwd trong worktree) → bước bật phải thấy nó và **không** ghi marker. Process thoát → lần chạy sau bật được.
4. **Holder v1 đang giữ lúc pha 1** → `mkdir` `EEXIST` → huỷ, tombstone của lần này được gỡ, file v1 còn nguyên.
5. **P6:** holder v1 bị giành file theo TTL nhưng vẫn trong vùng găng (file đã vắng) → quét thấy process cũ → không bật.
6. Revert: bật → revert → code v1 thật lại acquire được; process v3 còn giữ lock thì revert chờ.
7. Lười: run dir mới tạo sau cutover → acquire v3 đặt tombstone ở `v1Path`; `acquireAdvanceLock` v1 trên run đó thất bại.

Lệnh: `env -u ... FGOS_HOST_BIN=<build tích hợp> node --test test/holder-lock/cutover-*.test.mjs test/cli/lock-cutover.test.mjs test/rust-host/command-routes.test.mjs test/rust-host/help-routes.test.mjs`.

## Tiêu chí nghiệm thu

7 nhóm test xanh trên code v1 thật; quét process thật; không có đường nào xoá file v1 đang tồn tại.

## Rủi ro / rollback

- Phân loại payload sai (process mới bị coi là cũ) → không bật được, an toàn. Ngược lại (cũ bị coi là mới) là nguy hiểm: mặc định "không đọc được → cũ".
- Rollback code: revert commit (chưa họ nào bật). Rollback trạng thái đã bật: `fgos lock cutover <family> --revert`.
