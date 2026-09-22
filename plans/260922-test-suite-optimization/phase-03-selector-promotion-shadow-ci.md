# Phase 03 — Pillar 3: Selector promotion path + CI shadow/circuit breaker

Ngày: 2026-09-22. Trạng thái: **đề xuất, đã chốt hướng với người dùng** (ITR-D07 giữ nguyên; hướng (c) merge-gate phê duyệt, triển khai ở item riêng; hai item liên quan không nộp, prompt ở Appendix).

## Context (đọc trước)

- Contract hiện hành: [tech-lead-ranking-260922-1508-phase3-selector-promotion-brainstorm.md](../reports/tech-lead-ranking-260922-1508-phase3-selector-promotion-brainstorm.md) §3–§4 và 12 AC ở §12. Phase file này là bản thực thi của contract đó; khi mâu thuẫn, contract thắng.
- Plan cha: [plan.md](plan.md) — Pillar 3 §3.2.3 (pointer về đây) và quyết định D-OPT-09. Thay thế §3.2.3 replay lịch sử cũ.
- Red-team đã bác replay lịch sử: `plans/reports/red-team-plan-review-260922-1217-test-suite-optimization-3-pillars.md` §4; P05: `plans/260920-immediate-test-feedback-reduction/reports/selector-shadow-evaluation.md`.
- Code có sẵn: `scripts/test-select.mjs` (`selectTests`, `runShadow`, `validateManifest`, extension point `staticGraphTests`), `test/test-ownership.mjs` (33 rule, `FULL_TRIGGERS`), `scripts/run-tests.mjs` (forward runner args → `--test-reporter` dùng được), `.github/workflows/ci.yml` (`npm test` 3 OS, `push: main` + `pull_request`).
- Luật khóa: ITR-D01 (`npm test` = full, không đổi), ITR-D07 (static graph chỉ ADD; sinh rule = suggestion-only).

## Outcome, constraints, non-goals, acceptance

**Outcome.** Selector chạy shadow trên CI với bằng chứng đủ tin để promote **từng rule** theo evidence, không theo lịch; breaker per-rule trip trên confirmed miss; manifest không decay âm thầm.

**Constraints.**
- Full suite vẫn required trên mọi PR CI. Không có "related xanh = merge" ở bất kỳ tầng nào.
- `item.verify` không chứa selector ở bất kỳ dạng nào; `fgos return`/`approve` không dùng related (policy; enforcement thuộc item merge-gate).
- Phase 3 **không** quảng bá "full bảo vệ trước local merge" — hiện full chỉ chạy sau merge cục bộ (contract §3.1, §11).
- Phase 3 thêm compute (job related + compare + nightly); merge latency không phải mục tiêu, chỉ là guardrail.

**Non-goals.** Merge queue/sampling; related trong `fgos return`; sửa 142 case đỏ dispatch; đổi merge contract (item riêng); evidence reuse ở merge-gate.

**Acceptance:** 12 AC ở contract §12, ánh xạ vào slice bên dưới.

## Ba contract kỹ thuật + một mục verification (khóa trước khi code)

### C1. Classifier (per test case, cùng OS: related ubuntu vs full ubuntu)

Với mỗi test case T đỏ trong full(PR), theo thứ tự:

| # | Điều kiện | Nhãn | Đếm vào K? |
|---|---|---|---|
| 1 | Chỉ đỏ ở macOS/Windows, xanh ở ubuntu | `os-specific` | không |
| 2 | Base artifact thiếu / thiếu marker hoàn tất | `inconclusive` | không |
| 3 | T đỏ trong full(merge-base) | `baseline-failing` (= inconclusive) | không |
| 4 | T ∈ selected ∧ T đỏ trong related | `caught` | có |
| 5 | T ∈ selected ∧ T xanh trong related | `selected-but-divergent` (= inconclusive) | không |
| 6 | T ∉ selected ∧ related đã đỏ vì case khác | `omitted-failing-test` | có (mapping chưa tốt, không phải gate escape) |
| 7 | T ∉ selected ∧ rerun T một lần xanh | `inconclusive` | không |
| 8 | còn lại | `confirmed-miss` → attribute rule(s) match changed paths; không xác định được → quarantine cả area | có |

Hàng riêng: related đỏ / full xanh → `related-only-fail` (inconclusive), đếm để quyết định khi nào job related được required.

### C2. Mutation verdict (nightly)

| Baseline không mutation | Related trên mutant | Full trên mutant | Verdict |
|---|---|---|---|
| related đỏ | — | — | mutant không hợp lệ, loại |
| xanh | đỏ hợp lệ (assertion fail) | không chạy | `killed` |
| xanh | đỏ do syntax/crash/timeout | không chạy | `invalid`, loại |
| xanh | xanh | đỏ hợp lệ, case đó xanh ở baseline | `confirmed-miss` → quarantine rule |
| xanh | xanh | đỏ do hạ tầng | `inconclusive` |
| xanh | xanh | xanh | `equivalent-or-suite-gap`, loại khỏi mẫu, ghi side-output |

Checklist nhận mutant (đủ 5 mới vào registry): boundary nào; full có bắt được; related có bắt được; không trùng boundary + vị trí với mutant khác; gắn hash rule đang kiểm định.

### C3. Breaker state

- **Manifest** = policy có review: mỗi rule thêm `status: 'shadow' | 'live' | 'quarantined'` (mặc định `shadow`); `validateManifest` kiểm enum. Trong Phase 3, `shadow`/`live` chọn như nhau (chỉ là nhãn ledger); `quarantined` → coi như unknown → full.
- **Breaker state** = control state vận hành: repo variable `SELECTOR_BREAKER` = JSON `{ "version": n, "global": bool, "quarantined": ["ruleId"] }`. CI đọc **một lần** ở đầu job `selector-plan` (env từ `vars.SELECTOR_BREAKER`); rỗng/không parse được → decision `full`, reason `breaker-unreadable`. Hiệu lực tại lần đọc tiếp theo; không hồi tố selection đã tính; run đang chạy không bị ảnh hưởng.
- Trip: 1 `confirmed-miss` (C1 hàng 8 hoặc C2 hàng 4) → compare/nightly job ghi rule vào `quarantined` (tăng `version`) và mở issue kèm diff đề xuất đổi `status` manifest (không bot-commit; manifest đổi qua PR có review). ≥2 rule quarantine trong 7 ngày → `global: true`, audit tay.
- Rule đổi nội dung → evidence cũ mất hiệu lực (evidence keyed theo `sha256(JSON.stringify(rule))`).
- Telemetry/artifact thiếu → promotion dừng; "không có báo cáo miss" ≠ "zero miss".

### C4. Authoritative verification ngoài CI (policy trong Phase 3)

- Policy: related không thay authoritative verification ở `fgos return`/`approve`. `npm run test:related` chỉ chạy tay ở inner-loop.
- Enforcement: **không** thuộc Phase 3; thuộc item merge-gate (Appendix B). Phase 3 chỉ thêm lint warn: `item.verify` chứa `test:related`/`test-select` → cảnh báo ở compare job nếu PR đổi `.fgos/` (best-effort, không block).
- Migration: event log không có literal `test:related`; trạng thái item hiện tại và alias chưa kiểm chứng → AC của item merge-gate.

## Workspace (bắt buộc)

- **Không bao giờ** switch branch hay commit trực tiếp trong shared main checkout (`~/projects/forgentX`); mọi slice chạy trong worktree riêng, nhánh riêng, merge về trunk qua `fgos approve` (ADR0020: không commit `.fgos/` trên nhánh worker).
- Mỗi slice P3-0x = một work item → `fgos submit` rồi `fgos pick <id>` tự dựng worktree `fgw/<id>`; hoặc nếu làm ngoài Work: `git worktree add .claude/worktrees/test-opt-p3-<slice> -b feature/test-opt-p3-<slice> main`. Ngay sau `worktree add`: symlink `node_modules`, kiểm `pwd` trước mọi `git add/commit`.
- Slice độc lập về file (P3-01/02 vs P3-05 vs P3-06/07) được phép chạy song song ở worktree khác nhau; **P3-03 và P3-04 cùng đụng `ci.yml` và `test-select-compare.mjs` → tuần tự**.
- Verify trong worktree: `node --test <files>` với `CLAUDE_CODE_SESSION_ID` unset; `npm test` toàn suite trước khi `fgos return`. Commit ngay sau verify xanh (shared-checkout mất file đã từng xảy ra 2026-09-10).
- Nightly script (P3-06) tự tạo worktree `--detach` tạm cho mỗi mutant và dọn trong `finally`; không dùng checkout của người.
- Hai item Appendix A/B: đi qua `fgos submit`/`pick` → worktree riêng như mọi item; Appendix B đụng `src/runner/merge.mjs`, không chạy song song với bất kỳ slice nào sửa `merge.mjs` hoặc `shared-config-file.mjs`.
- Tài liệu plan/phase/report của chính phase này: commit trên nhánh docs từ worktree (ví dụ `docs/test-opt-phase-03`), không commit thẳng trên `main` trong shared checkout.

## Files

**Modify**
- `scripts/test-select.mjs` — `--plan-out <file>` xuất selector-plan.json; đọc `SELECTOR_BREAKER` env; hiểu `status` rule; `--mode` không thêm (YAGNI).
- `test/test-ownership.mjs` — thêm `status` cho 33 rule hiện có (`shadow`).
- `scripts/run-tests.mjs` — không đổi logic; chỉ thêm doc rằng `-- --test-reporter=junit --test-reporter-destination=<f>` là đường xuất artifact.
- `.github/workflows/ci.yml` — job `full` thêm reporter + marker + upload `if: always()`; thêm jobs `selector-plan`, `related`, `compare`.
- `package.json` — scripts `test:select:plan`, `test:select:compare`, `test:select:mutate`, `test:select:coverage-map`, `test:ownership:lint`.
- `CHANGELOG.md` `## [Unreleased]` — một dòng: CI shadow selector jobs + nightly fault-injection (user-visible).
- `plan.md` — Pillar 3 trỏ về file này; D-OPT-09.

**Create**
- `scripts/test-select-compare.mjs` — classifier C1 + ledger + PR comment.
- `scripts/test-select-mutate.mjs` — nightly C2 runner (worktree detach + symlink `node_modules`, `HOME`/`~/.fgos` cô lập như P05).
- `test/test-ownership-mutants.mjs` — registry mutant `{ id, ruleId, ruleHash, file, boundary, origin, find, replace }`.
- `scripts/test-select-coverage-map.mjs` — H2: mỗi test file một process với `NODE_V8_COVERAGE`, granularity file, ∪ static import closure (parse `import ... from`, `import('literal')`); flag computed import; xuất suggestion diff vs manifest. Suggestion-only.
- `scripts/test-ownership-lint.mjs` — block: test file không tồn tại, schema/enum sai, `test/direct/*` mồ côi; warn: src mới không rule, directTest không import source.
- `.github/workflows/selector-nightly.yml` — nightly mutation + coverage-map refresh.
- Tests: `test/scripts/test-select-compare.test.mjs` (fixture cho 9 nhãn C1), `test/scripts/test-select-mutate.test.mjs` (6 hàng C2 với fake runner), `test/scripts/test-ownership-lint.test.mjs`, thêm case vào `test/scripts/test-select.test.mjs` (hoặc file test hiện có của selector): breaker unreadable → full; quarantined → full; path unknown + `staticGraphTests` có kết quả vẫn `full` (AC 11).

**Delete** — không.

Không có env var/infra mới cho máy dev: `SELECTOR_BREAKER` chỉ CI đọc; `npm run test:related` local không đọc → không cần đăng ký `fgos doctor` (AGENTS.md gate: ghi rõ ở đây).

## Slices (mỗi slice park/tiến độc lập; thứ tự là phụ thuộc, không phải lịch)

### P3-01 Selection plan + manifest status (AC 1)
1. Thêm `status` vào schema + 33 rule; `validateManifest` kiểm enum; test.
2. `selectTests` đọc breaker state từ tham số (không đọc env trực tiếp trong hàm thuần); CLI đọc `process.env.SELECTOR_BREAKER`; rỗng/lỗi → full `breaker-unreadable`; rule `quarantined` → escalate như unknown.
3. `--plan-out`: `{ sha, base, manifestHash, breakerVersion, selectorVersion, changedPaths, matchedRules, selectedFiles, decision, reason, escalations, os, node }`.
4. Test contract AC 11 trên extension point hiện có.
Verify: `node --test test/scripts/test-select*.test.mjs`; `npm run test:ownership:lint` (khi P3-05 có) .

### P3-02 Full artifact per test case (AC 2)
1. Job `full` (3 OS): `npm test -- --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=test-results/full.xml`.
2. Bước sau (luôn chạy): script nhỏ ghi `test-results/marker.json` `{ sha, os, node, plannedFiles, reportedCases, exitCode, completed: true }`; `plannedFiles` từ `discoverTestFiles()` của run-tests.
3. `actions/upload-artifact` `if: always()`, tên `full-<os>-<sha>`.
4. Push lên main cũng sinh artifact (base cho PR sau).
Verify: một PR thật có 3 artifact; xóa marker thủ công trong test fixture → compare ra `inconclusive`.

### P3-03 Related + compare jobs + classifier (AC 3)
1. Job `selector-plan` (ubuntu): checkout đủ lịch sử để có merge-base; `npm run test:select:plan -- --base origin/main --plan-out selector-plan.json`; upload.
2. Job `related` (ubuntu, **không required**, `needs: selector-plan`, `if: decision == 'related'`): `node scripts/run-tests.mjs --files-from selector-plan.json` — nếu run-tests không có cửa file-list từ CLI (R5 cấm narrowing ở `npm test`), gọi seam `runTestFiles()` từ một script riêng `scripts/test-select-run-plan.mjs`; junit + marker như P3-02; `NODE_V8_COVERAGE=coverage/related` (cho P3-06).
3. Job `compare` (`needs: [related, full]`, `if: always()`, không required): tải plan + related + full(ubuntu) + base(ubuntu, tìm qua `gh api` theo merge-base SHA; thiếu → inconclusive); chạy C1; rerun một lần các case ứng viên `confirmed-miss` (`node --test <file>`); ghi `ledger.json` (artifact) + comment PR (nhãn, wall-time related vs full, escalation reasons + gợi ý rule từ coverage-map mới nhất nếu có).
4. Guardrail: ghi wall-time và queue time của job `full` vào ledger; báo động nếu p50 tăng >15% so với 20 run trước.
Verify: fixture test 9 nhãn; một PR cố ý (đổi file đã map, thêm assertion fail vào boundary test ngoài selection) → `confirmed-miss` xuất hiện trong ledger; PR sửa `.fgos/` với verify chứa `test:related` → cảnh báo C4.

### P3-04 Breaker state + diễn tập (AC 4)
1. Tạo repo variable `SELECTOR_BREAKER` mặc định `{ "version": 1, "global": false, "quarantined": [] }` (bước setup thủ công, ghi vào README của workflow).
2. Compare/nightly job ghi state qua `gh variable set` — **kiểm tra quyền** `GITHUB_TOKEN` (`actions: write` có đủ với Actions variables không); không đủ → dùng PAT scoped trong secret, hoặc fallback: mở issue `breaker-trip` + `global` do người set; ghi kết luận vào phase report.
3. Trip → mở issue kèm diff đề xuất `status: 'quarantined'` cho rule (không bot-commit).
4. Diễn tập 3 kịch bản, mỗi kịch bản một run có bằng chứng: (a) xóa artifact base → mọi case `inconclusive`, không trip; (b) set `SELECTOR_BREAKER` thành chuỗi hỏng → `selector-plan` decision `full`, reason `breaker-unreadable`; (c) đổi state khi một run đang chạy → run đó không đổi, run kế tiếp đổi.
Verify: 3 run link trong phase report.

### P3-05 Manifest lint + nudge (AC 8)
1. `scripts/test-ownership-lint.mjs` chạy trong `selector-plan`: block/warn theo Files; exit code chỉ non-zero cho hạng block.
2. Nudge: compare comment liệt kê path escalate + wall-time mất + gợi ý từ coverage-map; human confirm mới thành rule (ITR-D07).
Verify: test lint; PR thêm `src/foo.mjs` không rule → warn, không block; rule trỏ test không tồn tại → block.

### P3-06 Nightly fault-injection (AC 5)
1. Registry mutant: bắt đầu bằng 3 case P05 + N=3/rule cho `src/verbs/state/*`; mỗi mutant đủ checklist C2; `origin: 'authored' | 'regression:<sha>'`.
2. `scripts/test-select-mutate.mjs`: cho mỗi mutant → worktree detach tại HEAD + symlink `node_modules` + `HOME` tạm; chạy related không mutation (baseline); áp `find/replace`; chạy related; chỉ khi related xanh mới chạy full; verdict C2; ghi `nightly-ledger.json`; `confirmed-miss` → trip như P3-04.
3. Workflow `selector-nightly.yml` (cron 1 lần/ngày, ubuntu) + refresh coverage-map (P3-07) cùng job.
Verify: unit test 6 hàng C2 với fake runner; một run nightly thật có ledger; mutant equivalent bị loại đúng.

### P3-07 Coverage-map generator H2 (suggestion-only, ITR-D07)
1. `scripts/test-select-coverage-map.mjs`: chạy từng test file một process với `NODE_V8_COVERAGE=<dir>/<test-file-slug>`; gom `url` các script dưới `src/`, `bin/` → map source→tests granularity file; ∪ static closure (ESM parser đơn giản, thấy `import()` literal); flag file có computed import (`import(` không literal) → đề xuất `FULL_TRIGGERS`.
2. Output: `plans/260922-test-suite-optimization/reports/coverage-map-<date>.json` + markdown "suggestion diff vs manifest" (thêm/bớt test cho rule, rule mới đề xuất, golden/baseline test phát hiện theo convention → đề xuất boundary tay).
3. Không wire vào `staticGraphTests` runtime trong Phase 3 (YAGNI; vai trò union-only đã có test contract AC 11).
Verify: chạy trên `src/verbs/state/*` cho ra tập ⊇ directTests hiện có của 33 rule (nếu không → tìm lỗ (a)/(b) của contract §3.3 trước khi tin).

### P3-08 Changed-lines coverage warn-only (AC bổ sung, không block)
Intersect `coverage/related` với hunk diff của PR → "% dòng thay đổi được tập related thực thi" trong comment. Ngưỡng: đo 4 tuần rồi mới đặt.

### P3-09 State canary → dispatch (AC 9, 10, 6, 12)
1. Canary `src/verbs/state/*`: rule đã có, `status: shadow`. Exit criteria (không theo lịch): P3-01..P3-04 chạy đúng trên ≥1 PR thật với phân loại đúng + 3 diễn tập có bằng chứng. Timebox 2 tuần; hết mà chưa đạt → blocker, không promote.
2. Dispatch: chạy P3-07 cho `src/runner/dispatch/*` → suggestion → review người → rule `shadow` (không đợi 142 case đỏ được sửa để onboard; chỉ đợi để promote rule bị giao).
3. Promote per-rule (`shadow → live`) khi: baseline sạch hai phía (selected của rule **và** tập đối chứng từ full shadow + bộ fault — không định nghĩa bằng generator); ≥K=10 failure opportunities không inconclusive; kill-rate 100% trên ≥N=3 mutant hợp lệ; H5 wall-time ratio đo được. N/K là budget bootstrap, checklist C2 là điều kiện thực.
4. `live → quarantined`: 1 confirmed-miss. `quarantined → live`: rule sửa + mutant tái hiện miss vào registry + evidence mới theo hash rule mới.
5. Q5 đánh dấu "phê duyệt hướng, chưa triển khai" trong mọi comment/report của Phase 3; không tuyên bố pre-merge full protection.

## Ánh xạ AC (contract §12)

| AC | Slice | Bằng chứng |
|---|---|---|
| 1 plan artifact | P3-01/03 | artifact `selector-plan.json` trên PR thật |
| 2 full artifact + marker | P3-02 | 3 artifact/PR; fixture thiếu marker → inconclusive |
| 3 classifier 8 nhãn + fixture | P3-03 | `test/scripts/test-select-compare.test.mjs` |
| 4 breaker đọc/fallback/diễn tập | P3-01/04 | 3 run diễn tập |
| 5 nightly + checklist | P3-06 | registry + nightly ledger |
| 6 promote per-rule, tập đối chứng độc lập | P3-09 | ledger tổng hợp per rule |
| 7 `item.verify` policy, migration chưa kiểm chứng | C4, P3-03 | warn C4; audit ở item merge-gate |
| 8 lint warn/block | P3-05 | test lint |
| 9 canary exit criteria + timebox | P3-09 | phase report |
| 10 142 case đỏ là item riêng | Appendix A | không trong scope |
| 11 static graph union-only test | P3-01 | test contract |
| 12 Q5 chưa triển khai | C4, P3-09 | ghi trong comment/report |

## Validation tổng

- Narrow: `node --test test/scripts/test-select*.test.mjs test/scripts/test-ownership-lint.test.mjs`.
- Broad: `npm test` (chạy ngoài agent session với `CLAUDE_CODE_SESSION_ID` unset — suite không hermetic trong session).
- CI: PR mở với `.github/workflows` đổi → 4 job mới chạy; `full` vẫn required; `related`/`compare` không required.
- Impact-analysis gate: chạy `fgos tool query --capability impact-analysis --status present` trước khi sửa `selectTests`/`runShadow`; chạy `impact({target:"selectTests"})`, `impact({target:"runShadow"})`, `impact({target:"validateManifest"})` và ghi blast radius vào phase report; `bin/fgos.mjs` không đụng.

## Rủi ro & rollback

| Rủi ro | Mitigation / rollback |
|---|---|
| Job mới tranh runner, `full` chậm hơn | Guardrail P3-03.4; rollback = bỏ 3 job, `full` không đổi |
| `GITHUB_TOKEN` không ghi được variable | Fallback issue + set tay; ghi kết luận; không block ledger |
| Base artifact thiếu (run main chết trước `npm test`) | `inconclusive`, không trip; theo dõi tỷ lệ inconclusive |
| Mutant registry viết sai → false trip | C2 baseline check + checklist; trip mở issue, không bot-commit manifest |
| Coverage-map sai vì subprocess không phải node (Rust) | Flag `FULL_TRIGGERS`; suggestion-only nên sai không lọt vào selection |
| Manifest `status` field làm `validateManifest` cũ fail ở worktree khác | Field optional, mặc định `shadow` |
| Tuyên bố sai về bảo vệ merge | C4 + AC 12: mọi output ghi "post-merge check only" |

Rollback toàn phần: revert workflow + package.json scripts; `status` field optional nên manifest cũ vẫn valid; không có state persistent ngoài repo variable (xóa được).

## Ước tính

| Slice | Effort |
|---|---|
| P3-01, P3-02 | 1.5 ngày |
| P3-03 | 2 ngày |
| P3-04 | 1 ngày (+ chờ quyền token) |
| P3-05 | 0.5 ngày |
| P3-06 | 2 ngày |
| P3-07 | 1.5 ngày |
| P3-08 | 0.5 ngày |
| P3-09 | chạy theo evidence, timebox canary 2 tuần |

## Appendix A — Prompt cho work item riêng: 142 test case đỏ trên main (không nộp, xử lý độc lập)

```text
Sửa toàn bộ test case đang đỏ trên CI main của forgentX để `npm test` xanh trên ubuntu, macOS, windows.

Bằng chứng: run CI main gần nhất (ví dụ run 35702387686, job "test (ubuntu-latest)"): 142 fail / 7340 case, gói trong ~12 file, hơn 80% ở test/runner/dispatch.test.mjs, test/runner/loop.test.mjs, test/runner/dispatch-production-call-sites.test.mjs; còn lại ở test/runner/dispatch-confinement-*.test.mjs, test/e2e/runner-loop.test.mjs, test/e2e/pr-gate.test.mjs, test/e2e/domain-aware-stage-literals.test.mjs, test/runner/coordination-stale-action-proof.test.mjs, test/scripts/*seq-contiguity*.test.mjs. 6/8 run gần nhất đỏ tại chính step `npm test`, không phải build.

Chẩn đoán sơ bộ (2026-09-22, cần xác nhận lại trên CI): 61+ case đỏ cùng DispatchError "confinement backend instance bwrap not found in machine registry" (src/runner/dispatch/confinement/authority.mjs:678). Registry là state CẤP MÁY tại ~/.fgos/confinement-backends.json, do `fgos setup` (src/setup/registrations.mjs) ghi; CI cài bubblewrap nhưng KHÔNG chạy `fgos setup`, nên runner mới không có registry. Cùng file test chạy xanh 20/20 trên máy dev đã setup. 75 AssertionError còn lại nhiều khả năng là hệ quả (dispatch bị từ chối → kỳ vọng sau đó sai); 3 RunnerConfigError "NO_ASSISTANT_CLI_FOUND... cross-provider egress" cùng lớp: mặc định phụ thuộc máy. Phân loại: bug HERMETICITY của test/CI, không phải bug feature — hành vi fail-closed của product là đúng thiết kế ("confinement không thiết lập được thì từ chối dispatch").

Yêu cầu:
- Xác nhận chẩn đoán trên CI (ck:debug), rồi chọn hướng: ưu tiên test tự seed registry qua fixture (test không được phụ thuộc ~/.fgos của máy — cùng nguyên tắc P05 cô lập HOME); KHÔNG ưu tiên thêm bước `fgos setup` vào CI vì chỉ che dấu phụ thuộc. Mọi test còn đỏ sau khi seed mới xét là bug feature.
- Lưu ý đã biết: suite không hermetic trong agent session (CLAUDE_CODE_SESSION_ID rò vào CLI spawn) — tái hiện với env unset trước khi gọi là regression; CI chạy Node 20; worktree mới cần symlink node_modules.
- Không nới lỏng hay skip test để xanh; nếu một test sai đặc tả thì sửa test kèm lý do đối chiếu spec (docs/specs/runner.md).
- Chạy impact analysis (GitNexus) trước khi sửa symbol trong src/runner/dispatch/*, src/runner/loop.mjs; báo blast radius.
- Workspace: làm trong worktree riêng (`fgos pick` → fgw/<id>), không switch branch trong shared main checkout; symlink node_modules sau worktree add; commit ngay sau verify xanh.
- DoD: `npm test` xanh 3 OS trên PR; ghi nguyên nhân gốc + fix vào report plans/reports/.
- Liên kết: đây là prerequisite để promote rule dispatch trong plans/260922-test-suite-optimization/phase-03-selector-promotion-shadow-ci.md (P3-09); không phải scope của phase đó.
```

## Appendix B — Prompt cho work item riêng: merge-gate (c) — full verification tại protected integration boundary (không nộp, xử lý độc lập)

```text
Thay đổi merge contract của fgos (hướng (c) đã được người dùng phê duyệt 2026-09-22): protected integration target chỉ nhận candidate đã vượt full verification. Đọc trước: plans/reports/tech-lead-ranking-260922-1508-phase3-selector-promotion-brainstorm.md §3.1 (mục "Authoritative verification ngoài CI") và §4 Q5; docs/specs/runner.md "Cổng duyệt PR nội bộ"; docs/platform-foundations.md L5; AGENTS.md "Install/setup/doctor gate".

Hiện trạng đã kiểm chứng: `fgos approve` (src/runner/merge.mjs, mergeRunnerItemLocked) chạy item.verify + invariantChecks.commands (.fgos/config.json hiện chỉ có `node --test test/architecture.test.mjs`) trên cây `git merge --no-commit`, abort khi đỏ, dưới acquireMainCheckoutLock; trunk qua detectTrunk; GitHub transport vẫn verify cục bộ. Full suite chỉ chạy sau merge trên CI. Giữa runInvariantChecks và `git commit --no-edit` không recheck HEAD/tree; sweep D2 (tsk-3tp) cộng .fgos/events* vào staged commit sau verify.

Acceptance criteria:
1. Target theo detectTrunk/config, không hardcode `main`; full verification (`npm test`) chỉ khi target là trunk, không cho leaf→root.
2. Cập nhật ref có điều kiện: `git write-tree` trước verify → `git commit-tree <tree> -p <expectedHead> -p <branchHead>` → `git update-ref refs/heads/<trunk> <new> <expectedHead>`; lệch → từ chối, không commit; thay cho `git commit --no-edit` trong merge state; dọn MERGE_HEAD.
3. Verify trên candidate bất biến trong worktree cô lập (pattern catchup/return); dữ liệu verify sinh ra không nhập vào candidate. Ngoại lệ có giới hạn: chỉ metadata .fgos/ do chính verb approve ghi được vào commit; mọi path khác phải đúng tree đã xác minh; tài liệu không tuyên bố hai tree bằng nhau tuyệt đối.
4. Fail/cancel/thiếu evidence → không cập nhật target; test cleanup cho fail, crash giữa chừng, `git merge --abort` thất bại.
5. Không transport nào bypass (--github đi cùng đường).
6. Migration audit: liệt kê item hiện tại có verify placeholder/yếu/alias selector; đề xuất xử lý; không tự sửa hàng loạt.
7. Đăng ký vào `fgos setup` config-merge và `fgos doctor` (src/setup/checks.mjs): invariantChecks có `npm test` cho trunk; CHANGELOG Unreleased; quyết định ghi vào docs/specs/runner.md "Lịch sử quyết định".
8. Evidence reuse cho cùng candidate+environment: KHÔNG làm trong item này (tối ưu sau, ghi follow-up).

Ràng buộc: worktree riêng (`fgos pick`), không chạy song song với item nào khác sửa src/runner/merge.mjs hoặc src/config/shared-config-file.mjs; chạy impact analysis trước khi sửa mergeRunnerItemLocked/runInvariantChecks; giữ tests test/runner/merge.test.mjs, test/e2e/pr-gate.test.mjs xanh và thêm case cho AC 2–4; đo thời gian approve trước/sau trên trunk merge và ghi vào report. Đây là đổi merge contract: PR phải nêu rõ rủi ro "trước đây full chỉ chạy sau merge".
```

## Câu hỏi mở còn lại

- Quyền ghi Actions variables của `GITHUB_TOKEN` (P3-04.2) — trả lời bằng thử nghiệm, không giả định.
- `runTestFiles()` seam có nhận file list từ script ngoài mà không vi phạm R5 của `npm test` không (P3-03.2) — nếu không, thêm script riêng, không sửa `npm test`.
