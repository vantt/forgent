# Phase 05 — Policy/plan governance coherence

Wave 3 · Gate: D1 cho H6(b); M5 phối hợp chủ plan `260915-executor-policy-dispatch-seams` (Phase 08 pending) · Findings: H6, H12, M5, M6, M7, M12, L4. Context: review §H6/H12/M5/M6/M7/M12, Phụ lục 1/2.

## Status — 2026-09-23 (Unit I06 / Phase 3A Completion)

- **Status**: `implemented` (awaiting independent review verification; not claimed as integrated).
- **Candidate Branch**: `coordination-skill-harness-i06-dispatch-governance`
- **Base Commit**: `15e4048503ca1ee02dae23263dee84b9c983386d` (`main`)
- **Candidate SHA**: `d75d311d1b7a853bfede60c4bf52e10b0a41c82f` (code fix `2e210796`; lineage `b67f3794` -> `2e210796` -> `d6dc386f` -> `d75d311d`)
- **Last-Verified Date / Revision**: 2026-09-23 at revision `d75d311d`
- **Next Dependency Gate**: Unit I08 (dispatch governance/CLI/doctor verification) and Unit I09 (DAG forward-port).
- **Direct Candidate Evidence**:
  - `node --test test/architecture.test.mjs test/runner/dispatch-cross-provider-redirect.test.mjs test/runner/placement-policy-matrix-coverage.test.mjs test/runner/placement-policy-redirect-selection.test.mjs test/runner/placement-policy.test.mjs test/runner/dispatch-coordination-role-tiers.test.mjs`: 101 pass / 0 fail (~4.1s).
  - `node --test test/runner/assignment-dispatch.test.mjs`: 75 pass / 0 fail (~15.9s).
  - Full dispatch test matrix: 560 pass / 0 fail.
  - 11-suite coordination matrix: 317 pass / 0 fail.
  - `git diff --check`: 0 warnings/errors (clean).
- **Historical Evidence (separated)**:
  - Initial Phase 05 exploration (2026-09-22 morning): 529 tests passing across dispatch.test.mjs / assignment-policy.test.mjs / placement-policy.test.mjs.

### Requirements Summary (R1–R8)

- **R5 (M6)**: Revalidated — `deriveProviderFamily` và `normalizeProviderFamily` đã là single canonical path trong `assignment-policy.mjs`. Model lookup / tier resolution đã được phân định độc lập (`modelForTier`, `resolveVerifiedAssignmentModel`). Giữ nguyên, không thêm abstraction `lookupProvider` không cần thiết.
- **R6 (M7)**: Hoàn tất trọn vẹn contract `crossProvider: true`:
  - `normalizePreferCandidates` (`config.mjs`) validate boolean `crossProvider` cho pool entries (default `false`).
  - `selectReadOnlyRedirectExecutor` (`assignment-runner.mjs`) ném typed refusal `redirect.cross-provider-not-permitted` nếu redirect candidate vượt provider boundary mà không opt in `crossProvider: true`.
  - Ném `redirect.empty-pool` khi pool rỗng và `redirect.unknown-executor` khi executor chưa đăng ký.
  - Governance checks (`disallowedProviders`, `disallowedExecutors`, và `allowCrossProvider`) được bảo vệ nghiêm ngặt trước và trong execution.
  - Persist toàn bộ `redirectDecision` (`{sourceExecutorId, sourceProvider, pool, seed, chosen, selectedProvider, invocation, crossProvider}`) vào `dispatch-plan.json`.
- **R7 (M5)**: Settled theo **Disposition 1: Retain live PlacementPolicy authority and deduplicate duplicate selection logic**.
  - `PlacementPolicy` là binder thực sự cho model resolution và redirect invocations.
  - Deduplicate: loại bỏ `stableIndex` trùng lặp trong `assignment-runner.mjs`, import và dùng canonical `stablePoolIndex` từ `placement-policy.mjs`.
  - Giữ lại `evaluatePlacementPolicyShadow` để bảo vệ test coverage lịch sử mà không sinh duplicate code trong production. Doc comment cập nhật phản ánh đúng việc chia sẻ canonical.
- **R8 (L4)**: Cắt trọn vẹn import cycle giữa `config.mjs` và `transport.mjs`:
  - Tạo `src/runner/dispatch/adapters.mjs` leaf module chứa adapter registry và lookup helpers.
  - `config.mjs` chỉ import từ `adapters.mjs`.
  - `transport.mjs` re-export registry để bảo toàn backward compatibility.
  - Đăng ký `adapters.mjs` trong `docs/architecture-manifest.json` và thêm architectural cycle-cut tests trong `test/architecture.test.mjs`.

### Trước đó (2026-09-22 sáng)

**R1–R4, R6 xong; R5 một nửa; R7/R8 điều tra kỹ rồi hoãn có chủ đích** trên nhánh `dispatch-hardening-phase05-policy-governance-coherence`. D1 (H6b's quyết định) đã có sẵn từ Phase 00: `unavailable` + `reasonCodes:['selector.unregistered']`. Test đích: 529 test qua `dispatch.test.mjs`/`assignment-policy.test.mjs`/`assignment-dispatch.test.mjs`/`coordination-session-engine.test.mjs`/`placement-policy.test.mjs` — 0 fail. Full `npm test` đang chạy so baseline.

Chi tiết:
- **R3 (H12)**: `preferInvocation` được VALIDATE (schema.mjs) nhưng KHÔNG BAO GIỜ thực sự merge — thiếu trong `mergePolicyStack`'s field loop (`schema.mjs:343`) VÀ thiếu trong `session-engine.mjs`'s `cliOverride` rebuild (`:2496-2504`) — khai báo `preferInvocation` trong một PolicyPatch không có tác dụng gì, dù consumer thật (`assignment-runner.mjs`'s `opts.cliOverride?.preferInvocation`) đã sẵn sàng đọc. Thêm vào cả 2 chỗ, nối trọn đường ống.
- **R1 (H6a)**: `--work` early-return (executor không "configured" rõ ràng, fallback global) hardcode `governance: {providerFamily:null, egress:null}` — không hề gọi `resolveExecutorConfig` hay `resolveAssignmentDispatchPolicy`, nghĩa là `disallowedProviders`/`disallowedExecutors` KHÔNG BAO GIỜ được đánh giá cho path này dù plan vẫn báo "dispatchable" (native-first). Thêm: thử `resolveExecutorConfig` cho governance thật; synthesize policy tối thiểu rồi gọi `resolveAssignmentDispatchPolicy` để governance gate chạy thật — governance-blocked → `mechanism:'unavailable'`+`reasonCodes:['governance.blocked']` (đúng pattern "second-round advisor finding" đã có sẵn ở nhánh out-of-process khác trong cùng file). **Tự bắt bug do mình gây ra**: catch ban đầu coi MỌI throw từ `resolveAssignmentDispatchPolicy` là governance-block — vỡ 1 test D4 có sẵn (`--work` case với executor chưa đăng ký, không khai `disallowedProviders` nào, nhưng throw vì lý do khác không liên quan governance). Sửa: chỉ downgrade khi message khớp đúng `"governance gate rejected"` — pattern lỗi thật assignment-policy.mjs's governance check ném ra.
- **R2 (H6b, D1)**: `decide <executorId>` với id KHÔNG đăng ký rơi thẳng qua `decideExecutorDispatchMechanism` đoán mechanism (native-first) — check `configured` chỉ tính SAU khi mechanism đã "quyết" xong. Thêm early-return ngay sau khi `configured` tính được: `selector.type==='executor' && !configured` → `unavailable`+`selector.unregistered`. Cập nhật 2 test pin hành vi cũ (`dispatch.test.mjs`, 1 qua CLI spawn thật `decide no-such-executor-configured`, 1 qua `decideExecutorCli('fgos-coding-implement', ...)` trong test D4) sang giá trị mới — cả hai đúng target R2 nói tới dù số dòng đã lệch so với phase doc gốc (file đổi nhiều lần từ lúc review viết).
- **R4 (M12)**: `POLICY_PATCH_FIELDS` (schema.mjs) export ra; `registrations.mjs`'s `ALLOWED_POLICY_KEYS` — bản copy tay ĐÃ LỆCH THẬT (thiếu `preferInvocation`/`repeatMode`) — thay bằng import trực tiếp. `execution-contract.mjs`'s `ACCEPTED_POLICY_FIELDS` (chỉ `minTier`, cố ý hẹp hơn theo thiết kế) giữ nguyên phạm vi nhưng thêm assertion module-load-time cross-check với `POLICY_PATCH_FIELDS` (bắt drift tương lai nếu `minTier` bị đổi tên/xoá khỏi schema thật). `policyProvenance` (session-engine.mjs) chỉ track 4/7 field (`tier`/`persona`/`executor`/`visibility`) — thêm `invocation`/`fallbackExecutors`/`repeatMode`. `cliOverride`→`policyInputs`: alias thêm ở `resolveAssignmentDispatchPolicy` (điểm resolver trung tâm nhất) — `policyInputs` thắng khi cả hai được truyền; KHÔNG rename toàn bộ 82+ chỗ tham chiếu nội bộ rải khắp 8 file nguồn + 9 file test (rủi ro cao, giá trị thấp cho phần rename cosmetic nội bộ so với việc alias ở biên public). "Xoá 2 precedence list lệch trong comment" — tìm được 1 list ở đầu file này (10 scope) và 1 list khác ở session-engine.mjs (7 scope, `runner<definition<operation<role<actor<assignment<cli`) nhưng đọc kỹ thấy chúng mô tả 2 TẦNG khác nhau của cùng pipeline (session-engine's stack gộp lại thành MỘT input "cli" cho tầng ngoài), không chắc là "lệch" theo đúng nghĩa review muốn — để nguyên, không đoán mò sửa docs.
- **R6 (M7)**: `selectReadOnlyRedirectExecutor` trước đây tính đủ `{pool, seed, chosen}` rồi CHỈ TRẢ VỀ executorId — mọi bằng chứng khác bị vứt, `dispatch-plan.json` không có dấu vết vì sao một redirect xảy ra. Đổi return shape thành object `{executorId, pool, seed}`; caller (`executeAssignment`) build `compiledPlan.redirectDecision = {sourceExecutorId, pool, seed, chosen, invocation}` khi có redirect thật, merge vào TRƯỚC khi `admitRunAttempt` persist `dispatch-plan.json`. Phần "pool entry cross-provider phải khai `crossProvider:true`" — đây là một RULE GOVERNANCE MỚI (không có `crossProvider` field nào tồn tại trong pool-entry shape hiện tại), cần thiết kế thêm (đọc/validate field mới, define hành vi khi thiếu khai báo) — hoãn, không đủ ngân sách phase để thiết kế an toàn.
- **R5 (M6)**: điều tra kỹ — `deriveProviderFamily`/`normalizeProviderFamily` ĐÃ LÀ single, shared, import nhất quán giữa `assignment-policy.mjs` và `assignment-runner.mjs` (không phải bị trùng lặp như finding mô tả). `cli.mjs`'s 2 vùng dòng review trích không hề dùng 2 hàm này — đó là logic MODEL/TIER resolution (`modelForTier`) khác hẳn provider-family, khớp đúng phần THỨ HAI của R5 ("tách `lookupProvider` khỏi `providerFamily`") chứ không phải phần đầu. `lookupProvider` không tồn tại ở đâu cả — đây là một abstraction MỚI cần thiết kế, đè lên logic ĐÃ qua nhiều vòng debug thật (comment "Attempted follow-up, reverted... đo được vỡ 125 test" ngay trong assignment-policy.mjs) — hoãn, rủi ro cao nếu làm vội.
- **R7 (M5)**: Phase 00's docs decision #2 đã xác nhận "giữ shadow" cho PlacementPolicy — không tự ý flip thành binder thật. Điều tra `admitFallbackCandidate`/`fallbackCandidates`: xác nhận qua grep — **0 production caller** cho `evaluatePlacementPolicyShadow` (hàm export duy nhất dùng 2 machinery này) ở bất kỳ đâu ngoài test. Đúng là dead/superseded code (comment trong `assignment-runner.mjs` tự xác nhận: "NOT used here -- resolveFallback is a strict superset"). NHƯNG có test coverage riêng (`test/runner/placement-policy.test.mjs`, nhiều test tên "Phase 05" — thuộc plan `executor-policy-dispatch-seams` KHÁC, không phải track này) đang xanh và chủ động test đúng behavior này — xoá cần dọn cả test suite đó, thuộc quyền chủ plan seams đúng như R7 tự đề nghị hỏi. Không tự ý xoá.
- **R8 (L4)**: chưa điều tra — hết ngân sách phase hợp lý cho một lần chạy. Cần một phiên riêng.

**Quyết định phạm vi (tường minh, không giấu)**: Với 3 gap còn lại (R5 nửa sau, R6's `crossProvider:true`, R7, R8), mỗi cái đều được ĐỌC CODE THẬT trước khi quyết định hoãn — không phải đoán hay bỏ qua vì lười. R7 đặc biệt cần quyết định của chủ plan `executor-policy-dispatch-seams` (đúng như finding tự nêu), không phải quyết định một mình được.

## Requirements

- R1 (H6a) `--work` early-return plan vẫn chạy `resolveExecutorConfig` cho global executor và copy `governance`; synthesize minimal policy để `disallowedProviders` được đánh giá. Không còn plan "dispatchable" nào thiếu `governance`.
- R2 (H6b, sau D1) `selector.type==='executor'` + `configured:false` → `mechanism:'unavailable'`, `reasonCodes:['selector.unregistered']`; cập nhật `dispatch.test.mjs:5189` có chủ đích.
- R3 (H12) `preferInvocation` vào merge loop `schema.mjs:341` và rebuild `cliOverride` `session-engine.mjs:2896`; test declared-protocol assert invocation id spawn và read-only redirect không fire khi đã pin.
- R4 (M12) Một allow-list `POLICY_PATCH_FIELDS` là nguồn duy nhất (schema, resolver reader, `registrations.mjs:853`, `execution-contract.mjs` import từ nó); `policyProvenance` cho mọi field; rename param `cliOverride` → `policyInputs` (giữ alias một release); xoá 2 precedence list lệch trong comment.
- R5 (M6) Một `deriveProviderFamily(entry, cliCommand)` + `normalizeProviderFamily` dùng ở `assignment-policy.mjs:407-425`, `assignment-runner.mjs:270-296, 1628, 1270`, `cli.mjs:855-890, 303`; tách `lookupProvider` (bảng model) khỏi `providerFamily` (governance/provenance).
- R6 (M7) Persist redirect decision `{sourceExecutorId, pool, seed, chosen, invocation}` vào `dispatch-plan.json`; pool entry cross-provider phải khai `crossProvider:true`.
- R7 (M5) Hỏi chủ plan seams: flip PlacementPolicy thành binder thật (theo Phase 08 của plan đó) hay giữ shadow → nếu giữ, xoá `admitFallbackCandidate/fallbackCandidates` shadow và sửa header/docs.
- R8 (L4) Cắt cycle `config.mjs:39 → transport.mjs`: `EXECUTOR_ADAPTERS` vào `adapters.mjs` leaf.

## Files

- `src/runner/dispatch/plan.mjs:117-135, 229-263` (R1, R2), `resolve.mjs:135, 331-334, 365, 498`
- `src/runner/definitions/schema.mjs:125, 272-345` (R3, R4), `src/runner/coordination/session-engine.mjs:2885-2905`
- `src/runner/dispatch/assignment-policy.mjs:3-8, 132-563` (R4, R5), `assignment-runner.mjs:270-296, 1477-1520, 1628` (R5, R6), `cli.mjs:303, 855-890` (R5), `placement-policy.mjs` (R7), `config.mjs:39`, `transport.mjs` (R8)
- `src/setup/registrations.mjs:853`, `src/runner/dispatch/execution-contract.mjs:325-333` (R4)
- Tests: `dispatch.test.mjs` (`--work` plan có `governance.egress`; global executor cross-provider không `allowCrossProvider` → unavailable), new `policy-patch-fields.test.mjs` (table-driven: mọi key sống sót merge), `dispatch-policy-baseline-snapshot.test.mjs` thêm fixture `--work` + `decide <unregistered>`, `assignment-policy.test.mjs` provenance mọi field

## Steps

1. `impact` cho `compileDispatchPlan`, `resolveExecutorAndOverrides`, `resolveExecutorConfig`, `mergePolicyStack`, `resolveAssignmentDispatchPolicy`, `deriveProviderFamily`.
2. R3 (nhỏ, độc lập) → R1 → R2 (theo D1) → R4 → R5 → R6 → R7 → R8.
3. Docs: control-plane §PolicyPatch (precedence thật, allow-list), §DispatchPlan (partial → implemented sau R1), §Merge rules (override exception), §Component-Outer (cohort-planner).

## Validation

Test gaps #7, #13 (part), #14 (part) xanh; `dispatch-policy-baseline-snapshot` không đổi ngoài fixture mới.

## Risk / rollback

R2 đổi hành vi public `decide` — ghi CHANGELOG `[Unreleased]`. R4 rename param có alias. R5 chạm 125 fixture phụ thuộc default `claude` (ghi ở `assignment-policy.mjs:389-405`) — chỉ sửa hai site runner không nằm trong fixture path trước; site resolver để sau khi fixture cập nhật. Rollback từng R.
