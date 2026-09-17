# Design review — executor-policy-dispatch-seams, sẵn sàng Phase 04?

Reviewer độc lập, read-only. Không sửa file plan/code, không commit, không chạy
harness. Ngày 2026-09-16 18:15 (+07). Đối chiếu trên `main` @ `746a4fa0`
(đã merge account rotator slice 1 `ec6a0745`), working tree có sửa uncommitted
ở `plans/260915-*/{plan,design,phase-04..08}.md` — review dùng bản working
tree đó (bản anh đang định commit).

impact-analysis: không áp dụng (review-only, không sửa symbol).

## 0. Cách review

Đọc: AGENTS.md, reading-map, runner.md (RUL65b, data dictionary #1/#1b),
routing-handoff-contract, distribution-vision/spec, toàn bộ plan/design/phase
00–08, account-rotator design/plan/post-review-recut. Code: `assignment-runner`
(redirect §225–300, admission→lease §1240–1470, classifier §2128–2175),
`provider-capacity.mjs`, `config.mjs`, `bwrap.mjs`, `run-lock.mjs`,
`assignment-policy.mjs`, `resolve.mjs`, `plan.mjs`, `schema.mjs`
(`mergePolicyStack`), `session-engine.mjs` (`resolveDeclaredPolicyStack`),
`.fgos/config.json` + `~/.fgos/config.json` (chỉ đọc key, không in giá trị).
Chạy 1 script scratchpad để xác nhận empirically H1.

## 1. Trạng thái thật của track (khác với plan.md đang mô tả)

| Phase | Plan nói | Thực tế |
|---|---|---|
| 00 | landed `282fd62e` | đúng, trên main qua `47639eab`; snapshot test `test/runner/dispatch-policy-baseline-snapshot.test.mjs` (39 pairs) |
| 01 | W1, chưa ghi status | 1 commit `3bb4cf74` trên `executor-policy-dispatch-seams--cell-01` (`src/runner/dispatch/provider-adapter.mjs` — tên SỐ ÍT, plan ghi `provider-adapters.mjs`), **chưa merge vào track/main** |
| 02 | W1 | cell-02 không có commit code, chỉ docs |
| 03 | W2 | chưa bắt đầu |
| track | sync point trước Phase 04 | `track/executor-policy-dispatch-seams` @ `64c1fd94` **lệch main 8 commit**, 9 file dispatch drift (`assignment-runner` +133, `bwrap` ±97, `config` +7, `provider-capacity` mới, `registrations` +34) |
| baseline | `npm test` tại `3bc87899` | main đã thêm ~10 test files sau đó → baseline cần ghi lại sau sync |

Kết luận sơ bộ: plan.md `## Cell status` chỉ có Phase 00; W3 ghi Phase 04
"should run after Phase 03" nhưng 01–03 chưa land. Xem M1.

## 2. Bảng tóm tắt findings

| ID | Sev | Vùng | Disposition |
|---|---|---|---|
| B1 | Blocker | Phase 04: nguồn `minRigor` vs `rigorOverrides` calibration, rule "fail on conflict" | accept |
| B2 | Blocker | Phase 04: chưa định nghĩa projection quality→legacy lookup tier; mode resolve độc lập tạo cặp không biểu diễn được | accept |
| H1 | High | Rotator: quarantine wiring no-op → structured refusal không bao giờ bắn trong production | accept (bug rotator, dependency Phase 05/07) |
| H2 | High | Refusal = bare throw sau `admitRunAttempt`, Run treo `running`, không RunResult; lifecycle fallback của PlacementPolicy chưa định | accept |
| H3 | High | Live dogfood: global inventory chưa khai, `FGOS_CODEX_CREDENTIAL_HOMES` còn trong config, codex-bwrap không còn đường lấy `auth.json` | accept (ngoài track, chặn precondition Phase 07) |
| H4 | High | design §3.7 `principalRef: "account://claude-fgovn"` = account id trong identity | accept |
| H5 | High | Legacy redirect không re-admit governance (`disallowedProviders`); Phase 05/07 chưa gọi tên divergence này | accept |
| M1 | Medium | Thứ tự phase/cell status/sync/baseline chưa khớp thực tế | accept |
| M2 | Medium | Hai semantics raise-only khác nhau đang sống; Phase 00 snapshot không phủ đường `minTier` | accept |
| M3 | Medium | `implied-by-persona` không có nguồn dữ liệu hôm nay | accept một phần |
| M4 | Medium | Phase 05 shadow: cách đọc capacity, tên field refusal, `kind:"tool"`, quan hệ với `fallbackExecutors`/executor-health proposal | accept |
| M5 | Medium | Phase 07: tiêu chí shadow→production chưa đo được; fail-closed chỉ ghi ở Phase 08 | accept |
| M6 | Medium | Phase 08: dependency ngầm vào Phase 01/03 và builtin default khi config vắng | accept |
| M7 | Medium | `readOnlyExecutorRedirects` không validate/không spec/không doctor (vi phạm gate AGENTS.md) | accept một phần |
| L1 | Low | Tên module/file trong "Likely files" lệch code | accept |
| L2 | Low | plan.md hotfix note còn tả cơ chế đã bị slice 1 gỡ | accept |
| L3 | Low | Baseline failing-list ở `/tmp`, không commit | reject (đủ dùng) |

Phản biện đã **bác** (không thành finding):

- "PlacementPolicy tự chọn account/biết account id?" — Không. design §3.6, phase-05
  "should not absorb", phase-07 "must not own" đều rõ; rotator `redactProviderCapacitySelection`
  chỉ để lộ id/label (`provider-capacity.mjs` cuối file). Chỉ còn H4 là chỗ
  rò ở ví dụ ExecutorProfile.
- "Rotator gọi sai lifecycle?" — Không. `assignment-runner.mjs:1334→1374`:
  `admitRunAttempt` rồi mới `acquireProviderAccountLease` với `runId`;
  `dispatch-plan.json` không có account (test `assignment-dispatch.test.mjs:1023`
  assert). Lease release ở control-acquire-fail (§1532), settle (§2277). Đúng
  recut plan. Vấn đề là ở nhánh *refused* (H2), không phải nhánh selected.
- "Phase 04 tạo model table/enum sáu tier sớm?" — Không. phase-04 "Catalog
  decision" cấm rõ; recut §4 đồng ý; `MODEL_POLICY_TIERS` 5 giá trị giữ nguyên.
- "`gitnexus` bị coi như agent provider?" — Không ở runtime hôm nay:
  `assignment-runner.mjs:1371` `kind !== 'tool'` bypass, test `:1091`. Chỉ cần
  Phase 05 ghi tường minh (M4).

## 3. Findings chi tiết

### B1 — Phase 04 tự mâu thuẫn: `minRigor` lấy từ đâu khi dispatch theo work item, và rule "fail validation on conflict"

- File: `phase-04-quality-bridge.md` §Legacy bridge ("If caller supplies both
  legacy tier and canonical quality and they conflict after bridge, fail
  validation"), §Catalog decision; `design.md` §5.2, §5.3.
- Bằng chứng code:
  - Hai đường dẫn tier sống song song: (a) `plan.mjs:14-17`
    `policyTierForDispatchTier(work.tier, rigorOverrides)` →
    `DEFAULT_TIER_TO_POLICY` (`config.mjs:468`: heavy→critical) hoặc executor
    `rigorOverrides` (`.fgos/config.json` agy-cli/agy-herdr: heavy→creative) →
    ghi vào `syntheticPolicy.minTier`; (b) `assignment-policy.mjs:93-129`
    raise-only trên `opPolicy.minTier`/`work.tier`/`cliOverride`.
  - `work.tier ∈ {light,standard,heavy}` (`src/state/work.mjs:161`) nhưng
    `assignment-policy.mjs:98` so với `MODEL_POLICY_TIERS` → chỉ `standard`
    khớp; `heavy` chỉ tác dụng qua `work.risk === 'heavy'`.
- Vì sao ảnh hưởng: với agy heavy, (a) cho `creative` → bridge `{standard,
  creative}`; runner semantic default design §5.2 cho heavy → `critical`.
  Nếu Phase 04 coi cả hai là "quality" thì conflict → fail validation → **agy
  heavy dispatch chết**. Nếu coi (a) là quality thì `minRigor=standard` cho
  heavy work — quality bị executor calibration kéo xuống, đúng cái coupling
  track này muốn gỡ. Phase 04 không nói (a) là gì.
- Đề xuất tối thiểu (sửa phase-04, không mở scope):
  1. `quality.minRigor` chỉ đến từ semantic scopes: runner default từ
     `work.tier` (light→low, standard→standard, heavy→critical, đúng §5.2),
     `opPolicy.minTier`/PolicyPatch scopes, cli — raise-only.
  2. Executor/capability `rigorOverrides` và `DEFAULT_TIER_TO_POLICY` là
     **model calibration** (placement), không phải quality; Phase 04 ghi
     `lookupPolicyTier` với `source.kind: 'calibration'` bên cạnh quality.
  3. Rule "fail on conflict" chỉ áp cho *cùng một caller/scope* cung cấp cả
     legacy tier lẫn canonical quality; KHÔNG áp giữa quality và
     calibration-derived lookup tier.
  4. Ghi rõ `modelForTier`/`cli.mjs` path không đổi trong Phase 04.
- Disposition: **accept**. Lý do: plan tự mâu thuẫn, đọc thẳng từ code; không
  quyết định thì doer sẽ tự chọn và snapshot agy heavy hoặc vỡ hoặc nói dối.

### B2 — Chưa có projection quality → legacy lookup tier; mode resolve độc lập theo scope tạo cặp không có tier legacy tương ứng

- File: `phase-04` §Resolver rule ("`mode` conflict … source-kind precedence
  then scope precedence"), §Exit criteria ("records … the legacy policy tier
  used for current model lookup", "New canonical quality callers pass").
- Bằng chứng:
  - Bridge 5→2 không đơn ánh ngược: `{high, balanced}`, `{high, creative}`,
    `{standard, analytical}`, `{standard, adversarial}`, `{critical, balanced}`
    không có tier legacy. Với "minRigor raise-only" + "mode theo scope trong
    cùng sourceKind", stack `[op: analytical, actor: creative]` → minRigor
    `high` (op) + mode `creative` (actor, cụ thể hơn) = `{high, creative}` →
    lookup tier = ?
  - Hôm nay `TIER_STRENGTH` (`assignment-policy.mjs:30-36`) và `MIN_TIER_RANK`
    (`schema.mjs:29`) coi `creative(3) > standard(2)` là *ordinal*. Bridge biến
    nó thành nominal → hai delta có tên:
    - `mergePolicyStack` (`schema.mjs:315-318`): `[op: creative, actor:
      standard]` hôm nay **throw** (hạ tier); sau bridge minRigor bằng nhau →
      **pass**. Nới lỏng.
    - `assignment-policy`: `[op minTier: creative, work: standard]` hôm nay →
      `creative` → `gemini-3.8-flash-high`; sau bridge nếu mode theo scope
      (work cụ thể hơn) → `balanced` → `standard` → `flash-medium`. Đây đúng là
      creative-column trap §5.3 nhưng ở đường `minTier`, không phải đường
      `rigorOverrides`.
- Đề xuất tối thiểu: thêm vào phase-04 một bảng
  `legacyPolicyTierFor({minRigor, mode})` (low→lightweight;
  standard+creative→creative; standard+khác→standard; high→analytical;
  critical→critical) và rule cho `implied-by-tier-bridge`: **mode đi cùng tier
  đã thắng minRigor** (cặp gắn, không tách); khi minRigor hòa, giữ thứ tự
  `TIER_STRENGTH` cũ để snapshot không đổi, hoặc ghi delta có tên. Thêm test
  bảng cho 5×5 cặp legacy.
- Disposition: **accept**. Lý do: exit criteria không đạt được khi projection
  chưa định; đây là chỗ "no behavior change" dễ nói dối nhất.

### H1 — Quarantine wiring giữa runner và rotator là no-op → refusal không bao giờ xảy ra trong production

- File: `src/runner/dispatch/assignment-runner.mjs:2145-2156` gọi
  `quarantineProviderAccount({ runnerConfig, provider, accountId, reasonCode,
  manualClear: fault.manualClear, runtimeDir, evidence })`;
  `provider-capacity.mjs` `quarantineProviderAccount({ provider, accountId,
  reasonCode, quarantineKind = 'temporary', until, runtimeDir, detail })`;
  `classifyProviderCapacityFault` trả `{action, reasonCode, quarantineKind,
  until}` — runner không truyền `quarantineKind`/`until`, đọc
  `fault.confidence`/`fault.manualClear`/`quarantine.status` (không tồn tại).
  `isQuarantined` chỉ true khi `kind === 'manual-clear'` hoặc `until` tương lai.
- Empirical (scratchpad, không commit): stderr "Authentication failed: token
  expired" → classifier `manual-clear`; qua đúng call-shape của runner → state
  `{kind:'temporary', reasonCode:'auth-token'}` không `until` → lần acquire
  sau vẫn `selected`. Truyền đúng `quarantineKind` → `refused
  provider-capacity.exhausted-or-quarantined`.
- Không có test nào đi qua `executeAssignment` tới quarantine/refused
  (`grep "capacity refused\|exhausted-or-quarantined" test/` = 0; unit test
  `provider-capacity.test.mjs:170` gọi trực tiếp với `quarantineKind`).
- Vì sao ảnh hưởng: Phase 05 "consumes provider-capacity refusal facts", Phase
  07 "fallback triggered only by structured refusal" — tín hiệu đó hôm nay
  không thể phát sinh từ đường thật; shadow proof sẽ chỉ chứng minh trên
  fixture giả.
- Đề xuất: sửa ở rotator (1 call-site + evidence shape) + 1 integration test
  "quota stderr → quarantine → run kế tiếp refused". File work item riêng, không
  mở scope track seams.
- Disposition: **accept** (bug ở track rotator, là dependency cứng của Phase 05).

### H2 — Refusal là bare throw sau admission; lifecycle fallback của PlacementPolicy chưa định

- File: `assignment-runner.mjs:1384-1386` `throw new RunnerConfigError('provider
  capacity refused…')` — sau `admitRunAttempt` (§1334), trước bất kỳ cập nhật
  `run.json`/`result.json`; Run còn `phase:'admitted', status:'running',
  delivery:'not-sent'`. Lease chưa acquire nên không leak lease, nhưng Run treo.
- Rotator plan: "Selection must happen after `admitRunAttempt`". Seams
  design §2/§3.6: PlacementPolicy bind provider/model/executor ở
  `compileDispatchPlan` (trước admission). Vậy "fallback on
  provider-capacity-refusal" xảy ra ở đâu? Trước admission không có refusal;
  sau admission thì candidate đã bind vào Run đó.
- Đề xuất: plan chọn tường minh một trong hai và ghi vào phase-05/07:
  (a) refused → settle Run bằng RunResult có `outcome: refused,
  reason: provider-capacity.*` (structured, Run-owned) → recovery/attempt
  bookkeeping (`docs/architect/agent-coordination/architecture/executor-health-and-fallback.md`,
  PROPOSED) chọn candidate kế tiếp từ danh sách PlacementPolicy ở attempt mới;
  hoặc (b) probe read-only trước admission (không lease). Em khuyến nghị (a):
  hợp "lease identity = Run", hợp proposal có sẵn, và cần sửa rotator settle
  refused Run thay vì throw (thuộc rotator follow-up cùng H1).
- Disposition: **accept**.

### H3 — Live dogfood: rotator inert nhưng đường credential cũ đã bị gỡ

- Bằng chứng: `~/.fgos/config.json` `runner` keys không có `providers`;
  `.fgos/config.json:577` codex-bwrap còn `FGOS_CODEX_CREDENTIAL_HOMES` (không
  còn code nào đọc: `grep -rn FGOS_CODEX_CREDENTIAL_HOMES src/` = 0);
  `ec6a0745` diff `bwrap.mjs` gỡ hoàn toàn fallback copy
  `~/.codex/auth.json` / `~/.codex-fgovn/auth.json`;
  `provisionSelectedCodexCredential` (`bwrap.mjs:27-30`) `return false` khi
  không có `request.providerCapacity.credentialSource`; `providerCapacitySelection`
  = null khi `hasProviderAccounts` false (`assignment-runner.mjs:1368-1372`).
  Doctor `provider-capacity-state` báo **pass** "inactive"
  (`registrations.mjs:1675`).
- Hệ quả (theo đọc code, chưa chạy live dispatch để xác nhận): codex-bwrap
  spawn với `CODEX_HOME` = private home rỗng → không auth. Toàn bộ
  `readOnlyExecutorRedirects.claude → codex-bwrap`, `code:review`, `code:debug`
  đều đi vào đó. Precondition Phase 07 "slice 1 green for Codex bwrap" không
  đúng trên máy này; recut plan bước 7 "minimal Codex dogfood conversion" chưa
  làm.
- Đề xuất: khai `runner.providers.openai-codex.accounts` trong
  `~/.fgos/config.json` (3 home đã tồn tại `~/.codex-{tetcu72,tetnu,fgovn}`),
  gỡ env stale khỏi `.fgos/config.json`, thêm doctor check "executor bwrap có
  `private-home` binding cho provider không có inventory → warn". Việc này
  không thuộc track seams nhưng chặn mọi proof Phase 05/07 và có thể đang gây
  incident ngay lúc này.
- Disposition: **accept**.

### H4 — design §3.7 tạo lại coupling identity↔account

- File: `design.md` §3.7 ví dụ `"principalRef": "account://claude-fgovn"`.
- Mâu thuẫn với `phase-06` "principal/account family reference, not a concrete
  rotating account id" và "Do not create executor identity from
  provider-capacity account id"; với ràng buộc review "không tạo lại coupling".
- Đề xuất: đổi ví dụ thành `"principalRef": "provider://claude"` (hoặc
  `principal-family://claude-operator`) và thêm câu "account id chỉ xuất hiện
  trong Run-owned providerCapacity evidence".
- Disposition: **accept**. Lý do: ví dụ contract là thứ doer copy nguyên.

### H5 — Legacy redirect không re-admit governance; plan chưa gọi tên divergence này

- Bằng chứng: `assignment-policy.mjs:338-343` check `disallowedProviders`/
  `disallowedExecutors` trên `resolvedProvider`/`primaryExecutor` **trước**
  redirect; `assignment-runner.mjs` không có chữ `disallowed` (grep = 0);
  `policyForActualExecutor` (§258-284) chỉ đổi provider/model/provenance. Chỉ
  `allowCrossProvider` (executor-entry, `resolve.mjs:455`) được check sau đó.
  Với `options.disallowedProviders: ['openai-codex']` và redirect claude →
  codex-bwrap, governance không chặn.
- Vì sao ảnh hưởng: Phase 07 "Existing legacy behavior remains the baseline
  unless an intentional delta is recorded" — nếu baseline gồm lỗ này, binder
  mới có thể "bảo toàn" nó. Phase 05 phải báo divergence có tên
  `legacy.redirect.skipped-governance-readmission`; Phase 07 cần test: fallback
  với `disallowedProviders` chứa provider của candidate → refuse.
- Disposition: **accept**.

### M1 — Thứ tự phase, cell status, sync và baseline không khớp thực tế

- Bằng chứng: §1 ở trên. W3 "Phase 04 … after Phase 03 because effort defaults
  refer to canonical `minRigor`" — chiều phụ thuộc ngược: Phase 03 cần Phase
  04, không phải ngược lại; phase-03 tự nói "Before Phase 04, bridge from the
  existing tier vocabulary only where needed" = xây bridge tạm rồi bỏ.
- Đề xuất: (1) cập nhật `## Cell status`: 01 = commit `3bb4cf74` chưa merge, 02/03
  chưa bắt đầu; (2) đổi W3: Phase 04 chỉ phụ thuộc Phase 00, chạy TRƯỚC Phase
  03; Phase 03 dùng thẳng `minRigor` → bỏ tier→effort bridge tạm; (3) sync
  main→track trước Phase 04 (plan đã yêu cầu), ghi lại full-suite baseline
  trên sha sau sync; (4) cell-01 merge hoặc rebase sau Phase 04.
- Disposition: **accept**.

### M2 — Hai semantics raise-only; Phase 00 snapshot không phải oracle cho Phase 04

- Bằng chứng: `assignment-policy.mjs:45-56` silent-max; `schema.mjs:315-318`
  fail-closed khi scope cụ thể hơn hạ tier. `dispatch-policy-baseline-snapshot.test.mjs:19-21,62-68`
  chỉ gọi `modelForTier` + `resolveExecutorCommand` (executor × work-tier),
  không đi qua `resolveAssignmentDispatchPolicy`/`mergePolicyStack`/redirect.
- Đề xuất: phase-04 ghi "bảo toàn hai semantics theo surface" và nêu oracle
  tương đương là `test/runner/assignment-policy.test.mjs`,
  `test/runner/dispatch-coordination-role-tiers.test.mjs`,
  `test/runner/coordination*.test.mjs`; snapshot Phase 00 chỉ chứng minh
  đường calibration không đổi.
- Disposition: **accept**.

### M3 — `implied-by-persona` chưa có nguồn

- Bằng chứng: persona là chuỗi tự do (`plan.md` roster "analytical skeptical
  reviewer"); `grep -i adversarial src/runner/definitions/schema.mjs
  session-engine.mjs run.mjs` không có field posture; Phase 02 chưa land.
- Exit criterion "Red-team/adversarial persona posture is not overwritten by
  legacy `--tier analytical`" cần bảng persona→mode.
- Đề xuất: Phase 04 chỉ cần (a) sourceKind `explicit` cho `quality.mode` được
  khai trực tiếp, (b) một bảng tối thiểu `personaModeHints` (từ khoá persona
  roster → mode) HOẶC hạ exit criterion thành "explicit mode thắng bridge; test
  red-team dùng explicit mode". Không xây persona schema ở Phase 04.
- Disposition: **accept một phần** — nhận gap; không nhận việc mở persona schema
  trong Phase 04.

### M4 — Phase 05 shadow: cách đọc capacity, tên field, tool executor, chủ sở hữu fallback

- Bằng chứng: rotator refusal `{status:'refused', provider, reason}` — không
  `contract`, field `reason` (`provider-capacity.mjs` `acquireProviderAccountLease`);
  design §6/phase-05 dùng `refusalReason`. Shadow ở `compileDispatchPlan` (trước
  admission) không thể "consume refusal" mà chỉ có thể probe:
  `inspectProviderCapacity` (read-only, không lease, không ghi state) đã có.
  `fallbackExecutors` là PolicyPatch field "reserved-not-executed"
  (`assignment-policy.mjs:158-159`); `executor-health-and-fallback.md` PROPOSED
  kích hoạt nó qua recovery matrix — plan seams không nhắc → nguy cơ "fourth
  placement source" đúng cái plan cấm.
- Đề xuất: phase-05 ghi (1) shadow dùng `inspectProviderCapacity` làm probe,
  `capacity.status ∈ {not-applicable, available, exhausted}`; không bao giờ
  acquire lease trong shadow; (2) chuẩn hoá refusal contract
  `provider-capacity-refusal.v1 {status, provider, reason}` và dùng cùng tên
  ở cả hai track; (3) loại `kind:'tool'` khỏi candidate set với reason code;
  (4) một câu chủ quyền: PlacementPolicy = thứ tự candidate;
  recovery/attempt bookkeeping = khi nào thử candidate kế; `fallbackExecutors`
  legacy được PlacementPolicy hấp thụ như một nguồn ranking, không chạy song
  song.
- Disposition: **accept**.

### M5 — Phase 07: điều kiện shadow→production chưa đo được; fail-closed thiếu

- Bằng chứng: precondition "Phase 05 … has recorded legacy-vs-target
  divergence" — không có ngưỡng. Câu "If no admitted fallback exists, dispatch
  fails closed" chỉ ở phase-08 §Required behavior.
- Đề xuất: Phase 07 precondition = "shadow divergence report trên toàn bộ ma
  trận Phase 00 + toàn bộ đường `minTier`/redirect test = 0 divergence chưa
  gọi tên; mọi divergence còn lại có intentional-delta record"; copy câu
  fail-closed sang Phase 07 Required behavior.
- Disposition: **accept**.

### M6 — Phase 08: dependency ngầm và builtin default

- Bằng chứng: `assignment-runner.mjs:240-243`: khi config không có
  `readOnlyExecutorRedirects`, hardcode `claude → claude-reviewer` (write-safety
  invariant cho project mới, executor mặc định có `acceptEdits` + git tools).
  Phase 08 "Read-only safety remains enforced by business/permission/confinement
  policy" cần `permissionContract` (Phase 03) + ProviderAdapter
  `applied.readOnly` (Phase 01) để lọc candidate; preconditions Phase 08 không
  ghi.
- Đề xuất: thêm preconditions Phase 01/03; định nghĩa builtin PlacementPolicy
  default cho config vắng (read-only op không được rơi vào executor có
  `applied.readOnly === 'unsupported'`) và test "fresh project, review op".
- Disposition: **accept**.

### M7 — `readOnlyExecutorRedirects` chưa qua gate install/setup/doctor

- Bằng chứng: `config.mjs` không validate key (grep = 0, chỉ
  `assignment-runner` đọc raw); `docs/specs/runner.md` data dictionary #1
  không có hàng; `src/setup/registrations.mjs`/`checks.mjs` không có; CHANGELOG
  hotfix tả hành vi, không tả key. AGENTS.md "Install/setup/doctor gate": key
  config mới phải đăng ký vào setup/doctor.
- Đề xuất tối thiểu (không đăng ký đầy đủ vì sẽ retire Phase 08): shape
  validation + hàng spec đánh dấu "legacy window, retire Phase 08" + Phase 06
  doctor warning gọi tên migration target. Có thể gộp vào Phase 06a doc/doctor.
- Disposition: **accept một phần** — không đăng ký config-merge default (không
  nên có default cho bridge sắp retire).

### L1 — Tên file/module

- `phase-01` `provider-adapters.mjs` vs cell-01 `provider-adapter.mjs`;
  `phase-04` Likely files thiếu `plan.mjs` (`policyTierForDispatchTier`) và
  `assignment.mjs` (policy combine §368); `phase-06` doctor registry thực tế là
  `src/setup/registrations.mjs` (check `provider-capacity-state` ở đó), không
  chỉ `checks.mjs`. Disposition: accept.

### L2 — plan.md hotfix note lạc hậu

- "let `codex-bwrap` provision credentials from an ordered Codex home pool" —
  slice 1 đã gỡ (H3). Cập nhật câu này thành "provisioning theo selected
  account của rotator". Disposition: accept.

### L3 — Baseline failing-name list ở `/tmp`

- Phản biện: "không tái lập được". Bác: plan đã ghi command + sha + node version
  đủ để tái lập; và baseline phải ghi lại sau sync (M1) nên list cũ hết giá trị.
  Disposition: **reject**.

## 4. Kết luận

1. **NOT READY** để implement Phase 04 theo văn bản hiện tại. Lý do không phải
   kiến trúc sai — hướng đúng, ranh giới rotator/PlacementPolicy đúng — mà là
   Phase 04 tự mâu thuẫn ở hai điểm (B1, B2) khiến doer phải tự quyết về
   hành vi agy heavy và về projection ngược. Sửa plan xong (≈ vài chục dòng)
   thì thành READY.

2. Việc bắt buộc trước khi code Phase 04 (≤5):
   1. Sửa `phase-04`: nguồn `minRigor` (semantic scopes) tách khỏi
      calibration (`rigorOverrides`/`DEFAULT_TIER_TO_POLICY`); bảng
      `legacyPolicyTierFor`; rule cặp gắn cho bridge mode + tie rule; phạm vi
      rule "fail on conflict"; oracle tương đương (assignment-policy/role-tiers
      tests) — B1, B2, M2, M3.
   2. Sửa `plan.md`: cell status thật; W3 → Phase 04 chỉ phụ thuộc 00 và chạy
      trước 03; sync main→track; ghi lại baseline sau sync — M1, L2.
   3. Sửa `design.md` §3.7 `principalRef` — H4 (1 dòng, cùng lần sửa).
   4. File 2 work item cho track rotator (chạy song song, không chặn Phase 04
      nhưng chặn Phase 05): H1 quarantine wiring + H2 settle refused Run +
      refusal contract naming; H3 dogfood inventory + gỡ env stale + doctor
      check. **H3 nên làm ngay hôm nay** vì có thể đang là incident.
   5. Trước Phase 05 (không phải trước 04): bổ sung phase-05/07/08 theo H2
      (chọn lifecycle a), H5, M4, M5, M6, M7.

3. Không cần mở scope:
   - Không xây persona schema/posture ở Phase 04 (M3: bảng hint tối thiểu hoặc
     hạ exit criterion).
   - Không đăng ký `readOnlyExecutorRedirects` vào config-merge default (M7).
   - Không thêm capacity API mới cho shadow — dùng `inspectProviderCapacity`.
   - Không chạm `modelForTier`/`cli.mjs` trong Phase 04.
   - Đảo 03↔04 để bỏ hẳn tier→effort bridge tạm của Phase 03 — cắt được một
     mảnh code vứt đi.
   - Phase 06a (docs + doctor warning) có thể chạy ngay song song, doc-only.

4. Có cần chỉnh plan/design trước khi code: **Có** — phase-04 (B1/B2/M2/M3),
   plan.md (M1/L2), design.md §3.7 (H4). Phase 05–08 chỉnh trước khi mở Phase
   05, không cần trước Phase 04.

5. Bắt đầu từ Phase 04 hay xử lý dependency trước: **Phase 04 có thể là cell
   code đầu tiên** sau khi sửa plan (mục 2.1–2.3) và sync main→track. Không cần
   chờ Phase 01–03. Song song: H3 xử lý ngay ở tầng operator config; H1/H2 vào
   track rotator trước khi Phase 05 mở.

## 5. Câu hỏi chưa giải quyết

- H3: anh có muốn giữ hành vi "no inventory → fallback về `~/.codex/auth.json`"
  làm compatibility cho project khác dùng fgOS (mission #1), hay bắt buộc khai
  inventory global? Recut plan chọn fail-closed nhưng không nói gì về máy chưa
  chuyển đổi.
- B2 tie rule: khi minRigor hòa giữa `creative` và `standard`, giữ thứ tự cũ
  (creative thắng) để snapshot không đổi, hay chấp nhận delta có tên và để
  scope quyết? Cần một quyết định sản phẩm, em khuyến nghị giữ cũ ở Phase 04
  và mở delta ở Phase 05 khi có shadow proof.
- H2: chọn (a) settle refused Run + attempt mới, hay (b) probe trước admission?
  Em khuyến nghị (a).

---

## 6. Adjudication round 2 (2026-09-16 18:30) — đối chiếu ý kiến tác giả

Tác giả accept B1/B2/M1, accept một phần H1/H4, accept risk H2, chưa accept
H3-fallback-cũ và H5. Reviewer trace thêm bằng script scratchpad
(`h5-h2-probe.mjs`, `h1-inspect.mjs`, không commit) trước khi trả lời.

### H1 — giữ nguyên severity High, chỉnh wording

Tác giả đúng ở chỗ: record quarantine **có được ghi** (`kind:'temporary'`).
Nhưng "vẫn bị quarantine" chỉ đúng về mặt state file, không đúng về hiệu lực:

- `isQuarantined` (`provider-capacity.mjs`) chỉ true khi `kind === 'manual-clear'`
  hoặc `until` còn tương lai. Record `temporary` không `until` → **không lọc
  khỏi selection**, `inspectProviderCapacity` báo `healthy: true` trong khi
  `quarantine` non-null (empirical, cả hai script).
- Có **hai** lỗi chồng nhau, không phải một: (1) call-shape ở
  `assignment-runner.mjs:2145` mất `quarantineKind`/`until` (tác giả đã nhận);
  (2) ngay cả với call-shape đúng, quota fault không parse được "resets in Nh"
  → classifier không trả `until` → rotator không có "conservative long TTL"
  mà `plans/260916-account-rotator/plan.md` §Fault And Quarantine hứa.
  Empirical: stderr "You've hit your usage limit." → `healthy=true` sau
  quarantine.
- Sửa wording finding: "quarantine được ghi nhưng không có hiệu lực với
  selection/health trong hai trường hợp: auth manual-clear (mất kind) và quota
  không parse reset (không default TTL)". Hệ quả cho seams không đổi:
  structured `refused` vẫn không phát sinh từ đường thật.
- Disposition R2: **accept một phần đúng như tác giả**, nhưng severity giữ High
  vì hiệu lực = 0 ở cả hai fault class chính; thêm defect (2) vào work item
  rotator.

### H2 — "Run treo" đã trace outer settlement: xác nhận

- Callers của `executeAssignment`: `operation-choice.mjs:2211` (await, không
  try), `cli.mjs:1676` (catch → stderr + exitCode 1), `session-engine.mjs:314`
  (return promise). Không caller nào ghi `result.json`/settle Run.
- Empirical: sau refusal, `runs/01/` chỉ có `dispatch-plan.json` + `run.json`
  với `phase=admitted status=running delivery=not-sent`; không `result.json`.
- Hệ quả cụ thể hơn "treo": `reconciliation-planner.mjs:397` coi "an admitted,
  unsettled Run exists" là lý do **blocked** → reconcile của Assignment đó bị
  chặn cho tới khi có người xử lý tay. Đây là lý do refusal phải thành
  structured RunResult (tác giả và reviewer đồng ý), không chỉ vì evidence.
- Disposition R2: **accept nguyên trạng** (kết luận "Run treo" đã có proof);
  lifecycle (a)/(b) vẫn là quyết định tác giả cần chốt.

### H3 — đồng ý fail-closed, rút đề xuất "fallback cũ"

- Reviewer không đề xuất đưa fallback `~/.codex/auth.json` trở lại trong
  finding; câu hỏi cuối §5 chỉ hỏi để tác giả chốt. Tác giả đã chốt: thiếu
  inventory → fail closed + doctor báo lỗi. Reviewer đồng ý, và bổ sung: hôm nay
  chưa fail closed — `provisionSelectedCodexCredential` `return false` khi
  không có selection, bwrap vẫn spawn; doctor `provider-capacity-state` báo
  **pass** "inactive". Cần: (1) bwrap từ chối trước spawn khi executor có
  `private-home` binding + provider agent nhưng không có selection (class
  credential-provisioning); (2) doctor check tương ứng báo **fail**, không
  "inactive"; (3) khai inventory global + gỡ env stale ngay.
- Disposition R2: **accept**, đóng câu hỏi §5.1.

### H4 — hạ severity xuống Medium (doc)

- Đồng ý: lỗi minh hoạ, không phải lỗi kiến trúc; nhưng phải sửa trước Phase
  06 vì doer copy ví dụ contract. Disposition R2: accept, **Medium**.

### H5 — đã xác minh bằng test thật: finding đúng

- Trace: governance `disallowedProviders`/`disallowedExecutors` chỉ tồn tại ở
  `assignment-policy.mjs:188,338` (grep toàn `src/`, không comment = 3 dòng,
  đều trong resolver chạy TRƯỚC redirect). Sau redirect,
  `policyForActualExecutor` không gọi lại resolver; `resolveExecutorCommand`
  → `resolveExecutorConfig` chỉ check `allowCrossProvider` của executor entry
  (`resolve.mjs:455`), không nhận `options`.
- Empirical (`h5-h2-probe.mjs`, fixture copy từ
  `assignment-dispatch.test.mjs:947`): `readOnlyExecutorRedirects.claude →
  codex-bwrap` + `options.disallowedProviders: ['openai-codex']` →
  `status=done executorId=codex-bwrap provider=openai-codex redirected=true
  codexSpawned=true`. Control: `disallowedProviders: ['claude']` → throw
  "governance gate rejected provider claude". Governance chạy đúng một lần,
  trên executor trước redirect.
- Disposition R2: **accept nguyên trạng**, nâng từ "plan chưa gọi tên" thành
  **bug legacy đã xác nhận**; đề xuất thêm test này vào Phase 05 divergence
  fixture và Phase 07 re-admission test (có thể đưa thẳng vào
  `test/runner/assignment-dispatch.test.mjs` như regression trước cả Phase 05).

### M1 — đồng ý là quản trị, không phải kiến trúc

Giữ Medium. Không đổi.

### Bảng verdict sau round 2

| ID | Sev R1 | Sev R2 | Disposition R2 | Cần làm ở đâu |
|---|---|---|---|---|
| B1 | Blocker | Blocker | accept | phase-04 |
| B2 | Blocker | Blocker | accept | phase-04 |
| H1 | High | High | accept một phần (wording); thêm defect no-default-TTL | rotator, trước Phase 05 |
| H2 | High | High | accept (đã trace: Run unsettled chặn reconcile) | rotator + phase-05/07 lifecycle |
| H3 | High | High | accept; fail-closed + doctor fail, không fallback cũ | operator config + rotator, ngay |
| H4 | High | **Medium** | accept (doc) | design §3.7 |
| H5 | High | High | accept, **đã xác minh** | regression test ngay; phase-05/07 |
| M1 | Medium | Medium | accept (quản trị) | plan.md |

Kết luận §4 không đổi: NOT READY cho Phase 04 vì B1/B2; sửa xong plan là
READY; H1/H2/H3 chặn Phase 05, không chặn Phase 04. Câu hỏi mở còn lại:
B2 tie rule và H2 lifecycle (a)/(b).

---

## 7. Round 3 (2026-09-16 18:35) — tác giả chốt disposition + hai câu hỏi mở

Tác giả chốt: H1 accept High; H2 accept **Blocker cho Phase 05**; H5 accept
High + regression test; H3 accept, diễn đạt "hiện chưa fail-closed", sửa song
song, không chặn Phase 04. Reviewer đồng ý toàn bộ. Dưới đây chỉ là kiểm tra
hai quyết định mới với code để chúng không mở lại finding khác khi viết vào
plan.

### B2 — quyết định "legacyTier là khoá, minRigor derive, mode là thuộc tính riêng, explicit minRigor cao hơn → reject"

Kiểm với code — **nhất quán**:

- `TIER_STRENGTH` lightweight<standard<creative<analytical<critical → derive
  minRigor low<standard<standard<high<critical là **đơn điệu không giảm** →
  raise-only trên tier (cả `resolveStrongerTier` lẫn `mergePolicyStack`) tự
  động bảo toàn raise-only trên minRigor. Không cần đổi `TIER_STRENGTH`,
  `MIN_TIER_RANK`, `mergePolicyStack`. Hai delta đã nêu ở B2 (nới lỏng
  `[creative→standard]`, mất flash-high) **không xảy ra** — B2 đóng.
- "Mode override không tier mới → giữ tier": mode chỉ là metadata nominal,
  lookup vẫn theo tier → snapshot Phase 00 và đường `minTier` không đổi.

Hai điểm cần viết chính xác vào phase-04 để không mở lại B1:

1. **LegacyTier nào được derive?** Với dispatch theo work item có hai tier:
   semantic (`opPolicy.minTier` / `DEFAULT_TIER_TO_POLICY[work.tier]`, heavy →
   critical) và calibration (`rigorOverrides`, agy heavy → creative). Nếu
   derive minRigor từ tier calibration thì agy heavy = `standard`, claude heavy
   = `critical` cho cùng một work item — đúng coupling B1. Phase 04 phải ghi:
   `quality.minRigor` derive từ **semantic tier**; `lookupPolicyTier`
   (calibration) chỉ dùng cho model, ghi provenance `calibration`. Hai giá trị
   cùng xuất hiện trong evidence, không so sánh để fail.
2. **Exit criterion "New canonical quality callers pass"** phải hạ thành: caller
   canonical trong Phase 04 chỉ được cung cấp `quality.mode` (explicit) và
   `quality.minRigor` **≤** mức tier derive (bằng thì no-op, cao hơn → reject
   rõ). minRigor chưa phải kênh raise độc lập; kênh đó mở khi calibration được
   re-key theo minRigor (Phase 05+). design §3.2 "raise-only applies only to
   minRigor" cần một câu "Phase 04: derived, read-only". design §3.3
   `reasoningEffort` default từ minRigor vẫn đúng vì minRigor derive được.

Sửa chữ nhỏ: câu của tác giả "lookup hiện tại kiểu standard →
gemini-3.8-flash-high" — theo `.fgos/config.json:645-646` `standard` →
`flash-medium`, `creative` → `flash-high`. Tránh chép nhầm vào plan.

### H2 — quyết định lifecycle sau admission

Nội dung tác giả chọn (admit → acquire → refusal thành structured outcome →
settle attempt hiện tại → PlacementPolicy chọn candidate kế → attempt mới cùng
logical assignment → hết candidate thì fail closed) **trùng với phương án (a)**
trong báo cáo R1; tác giả gọi là (b). Đặt tên trong plan là
**settle-and-reattempt** để không lẫn với "probe trước admission" (bị loại).

Cơ chế sẵn có, không cần xây mới:

- `admitRunAttempt` đã hỗ trợ `retryId`/`predecessorRunId` và ghi
  `supersedesRunId` vào run meta (`assignment-runner.mjs:901-937`,
  `:1334-1345`) → "attempt kế tiếp cùng logical assignment" dùng đúng cửa này.
- `result-ladder.mjs`/`normalizeRunResultV2` chưa có outcome
  `provider-capacity-refused`; cần thêm một giá trị vào ladder vocabulary +
  `result.json` cho attempt refused, và một test "refused attempt không chặn
  `reconciliation-planner` (`:397`)".
- Giới hạn candidate/retry: gắn với PlacementPolicy `fallback.maxAttempts`
  (design §3.6) và attempt history theo
  `executor-health-and-fallback.md`; một chủ sở hữu cho cap, tránh hai bộ đếm.

### Trạng thái cuối

| Mục | Kết luận |
|---|---|
| Phase 04 | **READY sau khi sửa tài liệu** B1/B2 theo §7 (2 điểm viết chính xác), plan.md M1, design §3.7 H4 |
| Phase 05 | **chưa mở**: H1 (rotator quarantine + default TTL), H2 (settle-and-reattempt, Blocker), H3 (fail-closed + doctor fail + inventory), H5 regression test |
| Review kiến trúc thêm | không cần vòng lớn; chỉ cần re-read phase-04 sau khi sửa |

Không còn câu hỏi mở.
