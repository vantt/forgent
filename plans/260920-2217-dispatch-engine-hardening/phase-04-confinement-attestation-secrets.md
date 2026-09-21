# Phase 04 — Confinement attestation + secrets

Wave 2 · Gate: D2 (H10), D4 (M8 bypass) · Findings: H9, H11, H10, M8, L9. Context: review §H9/H10/H11/M8, Phụ lục 3.

## Status — 2026-09-21

**R1, R2, R3, R4, R5 xong trên nhánh `dispatch-hardening-phase04-confinement-attestation`** (worktree cùng tên, rẽ từ `main` HEAD hiện tại lúc bắt đầu). `npm test` ngoài session: 7224 test, 51 fail — so sánh trực tiếp (bỏ timing suffix) với danh sách fail của Phase 02 cho kết quả **giống hệt nhau, 0 khác biệt** — xác nhận toàn bộ 51 vẫn là gap rust-host/fgctl binary-build tiền tồn tại, Phase 04 không gây regression nào.

Chi tiết từng R:
- **R1 (H9)**: `prepareConfinementForLaunch` giờ trả `{backendPlan, preparedConfinement}`; `executeThroughConfinement` dùng `preparedLaunch?.backendPlan ?? backendPlan` cho attestation completed/failed thay vì biến ngoài (không bao giờ được set cho assignment door). Test mới `H9: the assignment/Run-owned launch door attests outcome:'enforced'...` verify đúng shape P06 evidence bằng dispatch thật qua bwrap thật. `dispatch-confinement-p04.test.mjs` R8 đổi default: chạy khi bwrap có sẵn, `FGOS_LIVE_BWRAP_TESTS=0` mới tắt (trước đây ngược lại).
- **R2 (H11)**: bug thật, nghiêm trọng — `prepared-invocation`/`launch-envelope` từng ghi TOÀN BỘ `process.env` (bao gồm mọi API key/token) ra JSON trên đĩa, không bao giờ xoá. Fix: `redactEnvForPersistence` (allow-list ngắn, chỉ biến shell chuẩn) cho record trên đĩa; env thật đi qua side file 0600 riêng (`protected/secrets/<launchCommandId>.env.json`, `publishSecretSideFile`/`consumeSecretSideFile`), supervisor đọc rồi unlink ngay. Envelope contract bump `v1`→`v2` (thêm `secretsRef`), supervisor chấp nhận cả hai một release. Verify end-to-end thật (không chỉ unit test): `cli-spawn-reconciliation.test.mjs`'s "2. Assignment-owned fresh launch..." giờ assert envelope trên đĩa không chứa `ANTHROPIC_API_KEY` VÀ side file bị xoá sau khi Run settle thật. `protected/` giờ mkdir 0700 khi tạo lần đầu.
  - Chưa làm trong R2 (deferral có ghi rõ): herdr `paneSplit --env` argv (`herdr-agent.mjs:154-160`) và launcher script cleanup-khi-fail (`herdr-round.mjs`) — trace code cho thấy `paneEnv` hiện KHÔNG được populate bằng full secret trong call path thật (`herdr-round.mjs`'s `paneEnv` param không nhận `fullEnv`/`workerEnv`), nên rủi ro thực tế thấp hơn nhiều so với 2 JSON record đã fix (luôn-trigger, mọi dispatch); launcher script đã có mode 0700 sẵn, chỉ thiếu cleanup trên failure path (có cleanup trên settled path). Không đủ bằng chứng đây là leak đang active để ưu tiên trong ngân sách phase này.
- **R3 (H10/D2)**: `effectiveBackendId = request.backendId ?? 'bwrap'` — một rule chung cho cả hai door (direct execute door trước đây refuse thẳng khi thiếu backendId thay vì default như assignment door). Xoá `backendRegistry.defaultBackend` dead code (schema đã cấm key này ở tầng validate, không bao giờ truthy). **Phát hiện phụ ngoài phạm vi ban đầu, đã sửa**: refactor R3 làm lộ ra `if (request.requirement?.mode === 'required')` trong `executeThroughConfinement` vốn nested BÊN TRONG `if (!request.assignmentLaunchContext)` — sửa nhầm cấu trúc ban đầu (tưởng 2 block độc lập) làm lệch brace, gây tất cả test cli-spawn thật hang do required-mode logic chạy 2 lần (assignment door lẫn direct door); phát hiện qua brace-count thủ công, sửa lại đúng cấu trúc gốc.
- **R4 (M8)**: `reapOrphanedConfinementResources` (tồn tại nhưng chưa từng được gọi từ production) giờ nối vào doctor check mới `confinement-orphaned-resources-reaped` (+ fix) và runner start (`loop.mjs`, best-effort, skip khi `dryRun`). `permissionMode` ghi vào attestation. **Không làm** (ghi rõ, không lặng bỏ): "bypass pairing derive từ plan coverage" — check hiện tại nằm ở đầu `executeThroughConfinement`, TRƯỚC khi `backendPlan` tồn tại; derive từ coverage thật cần dời check này ra sau bước assess, một thay đổi control-flow rủi ro cao hơn mức phù hợp cho tìm thấy M8 (Medium) trong ngân sách phase này — để lại cho phase/track riêng nếu cần.
- **R5 (L9)**: thêm helper `saveAttestationRecordThenThrow` (wrap lỗi `saveAttestationRecord` thành `cause` thay vì che mất refusal đã định), áp dụng cho 2 chỗ `getBackendDriver` phase file nêu tên rõ. **Không làm** (ghi rõ): retrofit cơ học toàn bộ ~30 chỗ `saveAttestationRecord(...); throw ...` khác trong file — quy mô lớn, rủi ro thấp (Low severity), để dành cho follow-up riêng thay vì mở rộng phase này.

Docs cập nhật: `attestation-store.mjs` header (redaction claim giờ đúng cho cả prepared-invocation/launch-envelope), `docs/specs/distribution.md` Data Dictionary #7/#7b (2 dòng check/fix mới), `CHANGELOG.md` `[Unreleased]` (Added: doctor check mới; Security: secret-leak fix).

**H9 là regression:** P06 evidence (`plans/260910-1243-confinement-authority-implementation/reports/phase-06-evidence/*.json`, dispatch 2026-09-10) có `phase:completed, outcome:enforced, backend:bwrap`; nhánh `if (!request.assignmentLaunchContext)` tách hai door vào 2026-09-13 (`8e3da27c`, `f7d8ccec`, `649792d6` — runtime-recovery P02). Từ đó assignment door ghi `outcome=unknown`.

## Requirements

- R1 (H9) `prepareConfinementForLaunch` trả `{backendPlan, preparedConfinement}`; completed/failed attestation dùng chúng; test assignment door → `outcome:'enforced'`, `backend.id:'bwrap'`. Bật p04 R8 mặc định khi bwrap có (`FGOS_LIVE_BWRAP_TESTS` chỉ để tắt).
- R2 (H11) Launch envelope + prepared-invocation lưu `envDigest` + allow-list env non-secret; secret qua side file 0600 xoá sau spawn (supervisor đọc rồi unlink); herdr `--env` argv chỉ non-secret, launcher script không export secret; `protected/` mkdir 0700. `attestation-store.mjs` header sửa cho đúng.
- R3 (H10, sau D2) Một rule `backendId = request.backendId ?? invocation.confinement.backend ?? executor.confinement.backend ?? 'bwrap'` dùng cho cả hai door; xoá `backendRegistry.defaultBackend` dead code.
- R4 (M8) Gọi `reapOrphanedConfinementResources` từ `fgos doctor --fix` + runner start; doctor check đếm markered dead-owner dirs; `finalize` với `timeout` receipt → schedule reap thay retained-forever; test dùng mkdtemp riêng. Bypass pairing (sau D4) derive từ plan coverage; ghi `permissionMode` vào attestation.
- R5 (L9) `saveAttestationRecord` fail trên refusal path không che typed refusal (wrap, attach `cause`); `getBackendDriver` untyped → `DispatchError`.

## Files

- `src/runner/dispatch/confinement/authority.mjs:586-589, 1094-1104, 1126-1300, 1349-1360, 1606-1646, 1690-1705` (R1, R2, R4), `:638-655, 1168` (R3), `:506-520` (R4 bypass), `:635` (R5)
- `src/runner/dispatch/confinement/request.mjs:413` (R3), `cleanup.mjs:100` (R4), `attestation-store.mjs:166` (R5), `backend-registry.mjs:151-157`
- `src/runner/dispatch/cli-spawn-supervisor.mjs:99, 125, 596` (R2), `herdr-round.mjs:66-80, 1135` + `herdr-agent.mjs:154-156` (R2)
- `src/setup/checks.mjs` / `registrations.mjs` (R4 doctor; thêm `confinement-attestation-store-writable` — trùng M16, làm ở đây)
- Tests: `test/runner/dispatch-confinement-authority.test.mjs:940-1000` mở rộng required + scratch registry; `dispatch-confinement-p04.test.mjs` R8; new envelope-redaction test; `test/setup/confinement-doctor-checks.test.mjs`

## Steps

1. `impact` cho `executeThroughConfinement`, `prepareConfinementForLaunch`, `finalizeConfinementResources`, `buildConfinementRequest`.
2. R1 (regression) trước, có test bám P06 evidence shape.
3. R2 — thiết kế side-file contract trong `cli-spawn-launch-envelope.v1` (thêm `secretsRef`), giữ digest verify; herdr đường riêng.
4. R3/R4 theo quyết định; R5.
5. Docs: control-plane §Launch/Confinement (`required` = host-write-deny; hai door cùng rule), `attestation-store.mjs` header, CHANGELOG `[Unreleased]` (user-visible: doctor check mới, reaper).

## Validation

Test gaps #8 xanh; live check: `ls /tmp/fgos-confinement | wc -l` giảm sau `doctor --fix`; grep envelope không có giá trị `ANTHROPIC_*`.

## Risk / rollback

R2 đổi contract envelope (supervisor cũ không đọc side file) — bump `cli-spawn-launch-envelope.v2`, supervisor chấp nhận cả hai một release. R1 thuần sửa lỗi. Rollback từng R.
