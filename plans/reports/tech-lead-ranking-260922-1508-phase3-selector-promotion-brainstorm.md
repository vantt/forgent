# Đánh giá và xếp hạng brainstorm Phase 3 — Test Selector promotion path + CI circuit breaker

Ngày: 2026-09-22. Vai trò: Tech Lead review. Input: 3 bản brainstorm (Agent 1/2/3).
Căn cứ kiểm chứng trước khi chấm: `scripts/test-select.mjs`, `test/test-ownership.mjs`,
`.github/workflows/ci.yml`, `plans/260922-test-suite-optimization/plan.md` (ITR-D01, ITR-D07),
`plans/reports/red-team-plan-review-260922-1217-test-suite-optimization-3-pillars.md`, `gh run list`.

## 1. Sự thật nền quyết định thứ hạng

| Claim | Kiểm chứng | Hệ quả cho đánh giá |
|---|---|---|
| Selector default-deny: file không map → escalate full | `test-select.mjs:267-271`, đúng | Manifest **thiếu** = mất tốc độ, không lọt lỗi. Vector lọt lỗi thật là rule **sai/stale**. Mọi đề xuất coi "file mồ côi" là rủi ro correctness đều sai tiền đề. |
| `runShadow()` có sẵn, `patchRelatedMiss` = related green ∧ full red | `test-select.mjs:352-401`, đúng | Đã có primitive, thiếu điểm quan sát trên CI. |
| CI chỉ chạy `npm test` 3 OS, không shadow | `ci.yml:45-46`, đúng | Breaker chưa có chỗ trip. |
| CI main đỏ gần như liên tục | `gh run list`: 6 fail / 1 success trong 8 run | Tín hiệu "full red" hiện là nhiễu. Nghiêm trọng hơn: thuật toán phân loại miss dựa trên "đỏ ở base = pre-existing" sẽ xếp gần như MỌI fail thành pre-existing → true miss bị che. |
| ITR-D01 `npm test` = full, ITR-D07 không auto-discovery | plan.md:591, 648, đúng | Mọi đề xuất "related xanh = merge" hoặc "auto-sinh mapping từ import graph" đảo ngược quyết định đã khóa. |
| Replay lịch sử = vô nghĩa, đã pivot fault-injection | red-team §4, P05 report | Đề xuất "historical fault replay" lặp lại việc đã chứng minh bất khả thi trong repo này. |
| Manifest 33 rule / 202 file src | grep, đếm trực tiếp | Traffic thật ở `src/runner/dispatch` chưa map. |

## 2. Xếp hạng

### #1 — Agent 1 (điểm 8.5/10). Chọn làm khung chính.

**Vì sao thắng:** duy nhất đọc repo trước khi nghĩ. Đặt lại bài toán đúng (thiếu ≠ sai), chỉ đúng vector lọt lỗi (rule stale), nhìn thấy main đỏ, biết replay đã chết, biết ITR-D07 và không tự đảo. Đề xuất B (song song + compare job) + D (fault-injection nightly) là kiến trúc đúng cho repo này. Thuật toán phân loại miss (selected? → pre-existing? → flake? → true miss → attribute về rule) là phần khiến breaker tin được. Breaker per-rule với `status: shadow|live|quarantined` sống trong manifest khớp doctrine "chia nhỏ, mỗi mảnh park/tiến độc lập". H5 (ratio go/no-go) là góc nhìn Tech Lead thật: một module "không đáng làm" là kết luận hợp lệ, không phải thất bại.

**Điểm yếu phải vá:**
- Tiêu chí promote "2 tuần compare-job 0 true-miss" yếu về thống kê: 2 tuần toàn PR xanh = 0 cơ hội fail = 0 bằng chứng. Phải đếm **failure opportunities** (mutant bị giết + full-shadow fail được phân loại), không đếm lịch (mượn Agent 2).
- Phân loại "pre-existing" cần artifact per-file của run main cùng merge-base. Với main đỏ 6/8, bước này nuốt true miss. "Main xanh ổn định" vì thế là **điều kiện đúng đắn của classifier**, không chỉ là chống nhiễu. Agent 1 nói đúng kết luận nhưng chưa nêu đủ lý do.
- Demote bằng "bot commit đổi một field manifest": commit của bot lên main đi qua cửa merge nào? Repo này merge qua `fgos approve`, không có bot commit thẳng. Cần kill switch tức thời ngoài source (repo variable `FORCE_FULL_SUITE`) + bot mở PR sửa status; kill switch giữ an toàn cho tới khi PR được merge (mượn Agent 2).
- Job related cần được phép **required** thì fail-fast mới có nghĩa; related ⊆ full nên related đỏ ⇒ full đỏ, không thêm rủi ro, chỉ thêm khả năng block PR do flake ở related (Agent 2 hàng 3). Chấp nhận, ghi log riêng.

### #2 — Agent 2 (điểm 7/10). Mượn khung đo lường và promotion model.

**Điểm mạnh riêng, Agent 1 không có:**
- `selector-plan.json` là artifact bất biến (SHA, merge-base, manifest hash, changed paths, matched rules, selected tests, decision) mà cả related-gate và full-shadow cùng đọc. Agent 1 dựa vào "deterministic nên CI tự tính lại" — đúng nhưng kém audit hơn; một artifact là bằng chứng rõ ràng cho retrospective.
- Bảng phân loại 5 hàng related×full, có hàng "related fail / full pass" (flake bên related) mà Agent 1 bỏ qua.
- Lưu ý thống kê "0 miss trong 30 PR xanh không nói gì" — điểm này sửa trực tiếp tiêu chí của Agent 1.
- Holdout tests (một số boundary test chỉ chạy trong full-shadow, chưa đưa vào mapping) là kiểm tra độc lập chống self-confirmation. Rẻ, đáng làm.
- Registry admission per module (`full-only | shadow | selective`) cùng ý với per-rule status của Agent 1, ở granularity module. Đề xuất: giữ **per-rule status trong manifest** (một nguồn, reviewable, `validateManifest` đã có), không thêm registry riêng. Module = tập rule có prefix chung.
- Kill switch global + "một confirmed miss là đủ để quarantine, không dùng ngưỡng %" — đúng, và là điểm bác Agent 3.

**Điểm yếu:**
- Không đọc repo: không biết main đỏ, không biết ITR-D01/D07, không biết P05. Vì thế:
  - "Historical fault replay" lặp lại việc red-team đã chứng minh bất khả thi (manifest validate fail trên tree cũ, chạy test từ checkout cũ làm hỏng `~/.fgos/config.json`).
  - Stage 2–3 "full required trong merge queue / full sampled 10–20%" giả định có merge queue GitHub. Repo này merge qua `fgos approve`; DoD là `npm test` full xanh. Phần này ngoài scope Phase 3 và đảo ITR-D01. Câu hỏi lớn cuối bài ("ưu tiên feedback sớm hay giảm merge latency") có câu trả lời sẵn trong repo: **feedback sớm**, merge vẫn chờ full.
  - Boundary matrix cho merge/rebase (topology × operation × boundary × failure semantics) là công cụ tư duy tốt nhưng là bảng điền tay hàng chục ô; với repo này H2 coverage-derived của Agent 1 sinh tập boundary bằng máy, matrix chỉ nên dùng để **review** output của H2, không phải nguồn.
- Block mapping trong module đã promote (Option C): với default-deny, file mới thiếu rule trong module selective vẫn escalate an toàn. Block ở đây là kỷ luật process, không phải safety. Xếp sau C của Agent 1 (block rule **sai**), vốn chặn đúng vector lọt lỗi.

### #3 — Agent 3 (điểm 3.5/10). Không dùng làm khung, lấy đúng một ý.

**Sai tiền đề với repo này:**
- "Leak Rate < 1% → biến test-full thành non-blocking, dev merge ngay khi related pass" đảo ITR-D01 và DoD. Không có tầng nào trong repo cho phép "related xanh = merge".
- Option 1B (bỏ full khỏi PR, chạy post-merge, auto-revert) đưa main vào trạng thái đỏ có chủ đích, trong khi main đỏ đang là vấn đề số một.
- Breaker theo ngưỡng "Leak Rate > 3% trong 1 tuần": với volume PR của repo này, 3% là 0 hoặc 1 PR; ngưỡng % không có nghĩa. Agent 2 đúng: một confirmed miss là đủ.
- Orphan File Checker chặn PR ở giây thứ 5: chính là Option B mà cả Agent 1 lẫn Agent 2 bác vì tạo động cơ map bừa → rule sai → lọt lỗi thật. Với default-deny, file mồ côi vốn **an toàn**.
- "Dùng Jest `--findRelatedTests` / madge / dependency-cruiser để thoát manual mapping": repo dùng `node:test`, phần lớn verb test spawn `bin/fgos.mjs` subprocess, import graph mù hoàn toàn (Agent 1 H1 blind spot). Và ITR-D07 cấm auto-discovery làm nguồn quyết định.
- Quarantine Zone `require_full_suite: true` = `FULL_TRIGGERS` đã tồn tại. Reverse Coverage = H2. Mutation = H3/D. Không có ý mới.

**Một ý đáng lấy — Option 2B:** đo coverage của **chính các dòng thay đổi trong PR** bằng tập related (bật `NODE_V8_COVERAGE` trên job related, giao với hunk của diff). Đây là bản PR-time, rẻ, của H2, và đóng điểm mù subprocess của linter tĩnh (Agent 1 câu 2-C) ngay tại PR thay vì chờ nightly. Dùng làm **metric warn-only** trong compare job, không block. Ngưỡng 80% của Agent 3 là số bịa, đo trước rồi đặt.

## 3. Quyết định tổng hợp (khung chọn) — contract hiện hành

§3–§4 và bộ acceptance criteria ở §12 là **contract hiện hành** mà phase file tham chiếu. §7–§15 là lịch sử phản biện 9 vòng, giữ để truy vết; khi mâu thuẫn, §3–§4 thắng. Đã rà nhất quán lần cuối sau vòng 10 (reviewer đọc nguyên văn file): related không required lúc đầu; verdict mutation theo §3.3; `baseline-failing` là `inconclusive`; breaker hiệu lực tại lần đọc state tiếp theo; `fgos return` không nằm trong lợi ích Phase 3; migration verify chưa kiểm chứng; điều kiện 2 của Q5 chưa được cơ chế bảo đảm.

Khung = Agent 1, vá bằng Agent 2, cộng một metric từ Agent 3.

### 3.1 Circuit breaker
- **Kiến trúc B + D**, không A, không C-của-Agent-2 (merge queue).
  - Job `selector-plan` (ubuntu): tính selection, xuất `selector-plan.json` (schema Agent 2).
  - Job `related` (ubuntu, **không required lúc đầu**): chạy đúng tập trong plan; đỏ là feedback sớm, chưa block. Chuyển required khi `related-only-fail` ≈ 0 trong cửa sổ quan sát.
  - Job `full` (matrix 3 OS, **required**, giữ nguyên `npm test`): xuất kết quả per-file dạng JSON artifact.
  - Job `compare` (`needs: [related, full]`, `if: always()`, không required): chạy classifier, ghi ledger, comment PR.
  - Job nightly `fault-injection`: mỗi rule `live`/`shadow` ≥ N mutant tại decision point; verdict theo bảng §3.3: miss = related không bắt được **nhưng full bắt được** fault hợp lệ; cả hai xanh → không phải miss (mutant tương đương hoặc suite thiếu).
- **Classifier** (Agent 1, sửa theo §7 và §8): đơn vị là **test case** (file + tên test, từ TAP/junit của `node --test`), không phải file, vì cùng file có thể chứa lỗi mới bên cạnh lỗi cũ. So sánh **cùng OS** (related ubuntu vs full ubuntu; fail chỉ có ở macOS/Windows → `os-specific`, không phải bằng chứng selector). Với mỗi test case T đỏ trong full(PR):
  - T đỏ trong full(merge-base) → `baseline-failing`, xếp vào `inconclusive` (không phân biệt được cùng lỗi hay lỗi mới khi chưa có failure signature; không phải explained non-miss, không tính là an toàn). Base artifact thiếu → `inconclusive`.
  - T ∈ selected ∧ T đỏ trong related → `caught`.
  - T ∈ selected ∧ T xanh trong related → `selected-but-divergent` (order/isolation/env), `inconclusive`.
  - T ∉ selected ∧ related đã đỏ vì test khác → `omitted-failing-test` (mapping chưa tốt, không phải gate escape).
  - T ∉ selected ∧ rerun T xanh → `inconclusive` (không gọi là flake; không tính vào bằng chứng an toàn; ở Phase 3 chỉ ghi ledger vì full đã required).
  - còn lại → `confirmed-miss` (gate escape), attribute về rule(s) match changed paths; không xác định được rule → quarantine cả area, không đoán.
  - Hàng related-đỏ/full-xanh → `related-only-fail`, `inconclusive`, đếm riêng để quyết định khi nào job related được required.
  - Mọi `inconclusive` không tính vào K failure opportunities.
- **Breaker:** per-rule, không toàn cục. Hai tầng tách trách nhiệm: **manifest** giữ policy có review (`status` per rule); **breaker state** là control state vận hành (repo variable `FORCE_FULL_SUITE` + file JSON quarantine list) mà CI **bắt buộc đọc** ở đầu job `selector-plan` và lại một lần trong `compare`, không đọc được → full. 1 confirmed miss → ghi quarantine vào breaker state ngay; **hiệu lực tại lần đọc state tiếp theo** (job `selector-plan` của run kế tiếp, kể cả của PR đang mở), không hồi tố selection đã tính; run đang chạy không bị ảnh hưởng và không cần, vì full vẫn chạy. Bot mở PR đổi `status` manifest sau để audit. Selector crash / manifest invalid / base không xác định → run hiện tại tự full (đã có). ≥2 rule quarantine cùng tuần → global force-full, audit tay. Rule đổi nội dung → evidence cũ của rule đó mất hiệu lực (evidence keyed theo hash rule). Telemetry/artifact thiếu → promotion dừng; "không có báo cáo miss" ≠ "zero miss". Diễn tập breaker bằng lỗi cố ý (mất artifact, state unavailable, run in-flight) trước khi tin.
- **Phạm vi bảo vệ ở Phase 3:** full vẫn required trên mọi PR CI, nên **không lỗi nào thoát merge gate của CI**. Đây là lý do trạng thái cuối "related required + full required" là đúng cho Phase 3, không phải thiếu sót.
- **Authoritative verification ngoài CI (sửa sau §9, đo lại §11):** `fgos return` và `fgos approve` chạy `item.verify` (shell literal per item, qua `runGoalCheck`) cộng `invariantChecks.commands` trong `.fgos/config.json`, hiện chỉ có `node --test test/architecture.test.mjs`. CI chạy full trên `push: main` và `pull_request`, nhưng `approve` merge cục bộ rồi push, nên với luồng fgos **full suite chỉ chạy sau merge**; chỉ PR qua GitHub transport mới có full trước merge. Verify thực tế trong event log: 636 item `npm test`, 1061 placeholder "chưa xác định", 67 `node --test --test-name-pattern`, 57 `grep -q`; 0 item dùng `test:related`. Kết luận: **cửa merge cục bộ không được full suite bảo vệ từ trước khi có selector**; ITR-D01 là luật về `npm test`, không phải enforcement tại approve. CI sau merge là **kiểm tra sau merge**, không phải gate, vì không chặn deployment nào (§13 sửa thuật ngữ). Ba tầng cho phase file: **policy** — related không thay full ở bất kỳ cửa authoritative nào; **enforcement** — cấm chuỗi literal không đủ (alias/wrapper); contract cần bảo đảm là "candidate được tích hợp chính là candidate đã vượt full verification" tại **protected integration boundary** (`detectTrunk`, không hardcode `main`), chi tiết §4 Q5; **migration** — 0 item dùng `test:related` (đếm trên event log, không phải trạng thái hiện tại); verify placeholder/yếu là vấn đề của item merge-gate, ngoài Phase 3. Breaker state ở repo variable không tới local, nên nếu sau này muốn related ở `fgos return`, manifest status là kênh duy nhất local thấy và đó là scope riêng.
- **Guardrail compute/latency:** Phase 3 thêm compute, không giảm. Theo dõi wall-time và queue time của job `full` như guardrail chống regression (job mới tranh runner), không phải mục tiêu cải thiện.
- **Tiên quyết, sửa sau §8:** không gate compare job theo "main xanh". Kiểm chứng: main đỏ tại chính step `npm test` (không phải cargo build/install), nên base artifact per-test-case vẫn sinh ra được nếu upload với `if: always()`; base đỏ A, HEAD đỏ A+B thì B vẫn phát hiện. Điều kiện cứng thật là **base artifact tồn tại cho merge-base SHA**; thiếu → `inconclusive`. Compare job bật ngay ở chế độ ledger-only. Vùng đỏ hiện tại (đo lại §10): 142/7340 case, gói trong ~12 file, hơn 80% ở `test/runner/dispatch.test.mjs`, `loop.test.mjs`, `dispatch-production-call-sites.test.mjs`. Hệ quả **per-rule**, không per-area: một rule chỉ mất evidence khi test case của nó giao với tập đỏ ở base; 98% suite có baseline sạch. Luật promote (sửa sau §12, §14): baseline sạch phải phủ **cả hai phía** của phép kiểm định — tập selected của rule **và** tập đối chứng ngoài selection; chỉ selected xanh là chưa đủ vì chính boundary test bị bỏ sót có thể đang đỏ nền. Tập đối chứng **không** được định nghĩa bằng mapping hay generator đang kiểm định (vòng tự xác nhận); nó là (i) full shadow: mọi test case ngoài selection, phân loại per case theo bảng trên, và (ii) bộ fault đối chứng: test nào trong full đỏ khi có mutant. Evidence của rule = số phân loại không `inconclusive` từ (i) + số kill hợp lệ từ (ii). Evidence từ mutant chỉ đếm test **xanh trên run không mutation** rồi đỏ khi có mutant. Phần không phân biệt được regression với failure nền → `inconclusive`, không đếm vào K. "98% suite xanh" là mô tả, không phải gate: một nhóm test đỏ nhỏ vẫn có thể giao nhiều rule. Sửa 142 case đỏ vẫn là ưu tiên Ship Faster và là tiên quyết cho các rule dispatch cụ thể bị giao, không phải cho hạ tầng hay cho area.
- **Base artifact: cần nhưng chưa đủ.** Artifact phải mang SHA + OS + node version, marker hoàn tất (số case dự kiến vs số case báo cáo), và status enum per case (`pass | fail | skip | cancel | timeout | not-run`). Upload `if: always()` giữ được report đã sinh, không cứu run chết giữa chừng; report thiếu marker hoàn tất → `inconclusive`.
- **Job related required hay không:** bắt đầu **không required** vài tuần đầu, đo `related-only-fail`; chuyển required khi tỷ lệ đó ≈ 0. Feedback sớm vẫn có giá trị khi chưa required; block PR vì flake của related đi ngược "Release con người".
- **Force-full switch, ngữ nghĩa cụ thể:** đọc một lần ở đầu job `selector-plan` (run đang chạy không bị ảnh hưởng, không cần vì full vẫn chạy); không đọc được → full; ghi bởi compare job qua token có quyền ghi Actions variables (quyền `GITHUB_TOKEN` mặc định có đủ hay cần PAT: câu hỏi mở); giá trị JSON `{ global: bool, quarantined: [ruleId...] }`.

### 3.2 Chống manifest decay
- **Block rule SAI, nhưng chỉ phần chứng minh được bằng máy** (Agent 1 2-C thu hẹp sau §7): block khi test file trong rule không tồn tại, schema sai, hoặc `test/direct/*` mồ côi không được rule nào tham chiếu (`validateManifest` mở rộng). **Không block** vì static graph không thấy import. Số liệu sửa sau §9: 11/28 file `directTests` spawn `bin/fgos.mjs`, nhưng đối chiếu **từng rule** thì 0/33 rule có directTest spawn mà không import source, nên check "directTest import trực tiếp source" hiện không block rule nào. Vẫn chọn **warn** cho Phase 3 vì lý do nguyên tắc (import ≠ có assertion; contract in-process cho `directTests` chưa được ghi thành luật), không vì tỷ lệ block. Block chỉ hợp lý nếu anh muốn ghi structural contract cho `directTests`; nó không chứng minh mapping đúng, và có chi phí bảo trì cộng khả năng chặn test hợp lệ tương lai (§11 sửa câu "chi phí 0"). "Rule sai" được chứng minh bằng coverage (H2 offline, 2B tại PR), không bằng import graph.
- **Warn file thiếu rule** (plan D-OPT hiện tại, giữ nguyên): không block, đo compliance 1 tháng rồi ratchet.
- **Nudge đúng lúc** (Agent 1 2-E): compare job comment "PR này escalate vì `src/foo.mjs` chưa map, mất X phút" + suggestion tự sinh (Agent 2: cùng tên, import graph, coverage), **human confirm**, không auto-approve.
- **Không** block file mồ côi (Agent 3 2A / Agent 1 2-B).
- **Coverage của dòng thay đổi** (Agent 3 2B): warn-only trong compare job.
- Generated-but-committed direct tier (Agent 1 2-D): **chờ anh chốt**, xem §4.

### 3.3 Module khó (merge/rebase)
- H2 coverage-derived làm generator tập boundary (chạy offline, mỗi test file 1 process với `NODE_V8_COVERAGE`, xuyên subprocess).
- H3 mutation kill-rate làm gate promote (100% trên ≥ N mutant có nghĩa). **Mutant phải đối chiếu full** (§7): related xanh trên mutant chỉ là miss khi full đỏ hợp lệ; full cũng xanh → mutant tương đương hoặc suite thiếu, loại khỏi mẫu. Để rẻ, nightly chỉ chạy full trên mutant mà related xanh. Lỗi cú pháp, timeout, hạ tầng không tính là kill. 100% kill là **gate** cho bộ mutant đã chọn, không phải chứng minh mapping đủ cho mọi lỗi tương lai; holdout tests bù phần đó. Mutant ưu tiên (Agent 2): conflict branch, rollback/cleanup, stale-head check, exit-code mapping, lock handling.
- H5 go/no-go: đo bằng **wall-time** của tập related so với full, không phải số file (40% file có thể là 90% thời gian nếu toàn e2e). Đo xong mới đặt ngưỡng.
- H6 area floor: mọi thay đổi `src/verbs/merge/*` luôn kèm tập invariant cố định (iron-law, approve gate).
- Holdout để chống self-confirmation: **holdout mutant/fault scenario** (không lộ cho bước sinh rule), không phải giữ boundary test đã biết cần ngoài mapping (§8: làm selection thiếu có chủ đích; dependency đã biết thì bổ sung mapping).
- Boundary matrix của Agent 2 dùng để **review** output H2 cho merge/rebase, không phải nguồn. Ranh giới sau §10: coverage-derived đo ở **granularity file** (test có load/thực thi bất kỳ dòng nào của S, kể cả module top-level khi import), không phải dòng/nhánh. Ở granularity đó, tập coverage ⊇ import closure, nên "test có thể bắt lỗi nhưng lần đo không chạy nhánh đó" và "patch đổi luồng khiến test nay mới chạm S" phần lớn đã nằm trong tập (test đã load S). Hai lỗ **thật** còn lại: (a) test quan sát hệ quả của S mà không load S trong process hay subprocess nào — golden/baseline test so file generated đã commit với generator, ví dụ render target `.agents/skills`; (b) path chỉ chạy trên OS khác ubuntu. (a) xử lý bằng convention: golden test đưa vào `FULL_TRIGGERS` hoặc boundary rule tay; (b) chấp nhận vì related cũng chỉ chạy ubuntu. Lỗ thứ ba, thật trong repo (§12): **dynamic import có điều kiện** — `src/runner/dispatch/visibility-session.mjs` rẽ `import('./herdr-round.mjs')` / `import('./assignment-runner.mjs')` theo nhánh; nhánh chưa chạy trong lần đo thì S không được load. Xử lý: tập generator = coverage-derived **∪ static import closure** (static graph thấy `import()` literal). Hai vai trò của graph output phải ghi tách bạch (§14): **(1) sinh rule candidate** → suggestion-only, người review rồi mới vào manifest; **(2) `staticGraphTests` lúc chạy** → kiểm chứng `selectTests`: escalation trả `full` **trước** khi tập này được cộng, nên nó chỉ mở rộng một selection đã là related, không bao giờ tạo quyết định related hay thu hẹp. Union-only là (2); suggestion-only là (1); không cái nào tự cấp quyền narrowing. Lỗ thứ tư, cũng thật: `assignment.mjs` load harness theo **đường dẫn tính toán** (`import(pathToFileURL(harnessPath))`), cả coverage lẫn static đều mù → file như vậy vào `FULL_TRIGGERS` hoặc boundary rule tay. Subprocess: `NODE_V8_COVERAGE` kế thừa qua env cho child node, không phủ binary Rust/cargo. Ô matrix trống mà **không test nào có thể bắt** là lỗ suite (Pillar 1/2); ô trống mà test **có** nhưng generator không thấy là một trong bốn lỗ trên → bổ sung mapping tay. H2 chạy lại nightly, diff với manifest → suggestion, để chống stale; khoảng trống giữa hai lần refresh không được bảo vệ, chấp nhận vì full vẫn required.
- Historical regression thật, nếu tái tạo được trong worktree cô lập (`git worktree add --detach`, `HOME`/`~/.fgos` cô lập như P05 mô tả) → đưa vào bộ nightly như một **mutant có nguồn gốc lịch sử**, không phải pipeline replay riêng.
- Chấp nhận kết luận "merge/rebase giữ FULL_TRIGGER" nếu H5 nói vậy.

### 3.4 Promotion path (per rule, trạng thái trong manifest)

```text
unmapped ──(H2 sinh rule, human confirm)──▶ shadow
shadow ──▶ live   khi: H3 kill-rate 100% (≥N mutant)
                     ∧ coverage-set ⊆ rule-set
                     ∧ ≥ K failure opportunities đã phân loại, 0 true miss
                       (K đếm mutant + full-shadow fail, không đếm ngày)
                     ∧ H5 wall-time ratio < ngưỡng đo được
live ──▶ quarantined  khi: 1 true miss đã phân loại
quarantined ──▶ live  khi: rule sửa + mutant tái hiện miss đó vào bộ nightly
```

"Live" = `npm test` vẫn full (ITR-D01), CI full vẫn required. Lợi ích thật trong Phase 3: inner-loop dev (`npm run test:related` chạy tay) và feedback sớm trên CI. **Không** gồm `fgos return`/`approve` verify: related không thay authoritative verification ở bất kỳ cửa `fgos` nào (§3.1). Không có "related xanh = merge" ở bất kỳ stage nào. Merge queue / sampling: ngoài scope, không lên kế hoạch.

## 4. Điểm cần anh chốt (không tự quyết)

1. **ITR-D07 vs generated-but-committed direct tier.** Quyết định gốc: static graph chỉ ADD, không là nguồn sự thật. Đề xuất Agent 1 2-D: sinh `test-ownership.generated.mjs` theo convention `src/x/y.mjs ↔ test/x/y.test.mjs`, commit, CI check regenerate no-op. Trade-off: tầng direct không bao giờ decay và vẫn review được trên PR; nhưng rule sinh từ tên file có thể sai (test cùng tên không thật sự chạm source) → cần 2-C block rule sai đi kèm. Options: (a) giữ ITR-D07 nguyên, chỉ làm suggestion bot, xem lại sau 1 tháng compliance data — **em nghiêng về (a)**, khớp doctrine warn-then-ratchet của plan; (b) supersede ITR-D07 cho riêng tầng direct với 2-C bắt buộc.
2. **Area đầu tiên.** Hạ tầng (plan/related/full/compare/nightly) độc lập area, xây một lần. Chọn area chỉ quyết định rule nào lên shadow trước. `verbs/state` đã có rule → shadow ngay, chứng minh pattern. `runner/dispatch` là nơi có traffic → cần H2 sinh rule trước. Em đề xuất **cả hai, tuần tự**: state để chạy hạ tầng, dispatch ngay khi H2 xuất rule. Anh có muốn bỏ state để dồn vào dispatch không?
3. **Main đỏ** (đã chốt, không hỏi nữa): ledger bật ngay; onboard dispatch song song nếu không tranh nguồn lực với việc sửa; promote per-rule chỉ khi test case của rule xanh ở base. 142 case đỏ (12 file, chủ yếu `dispatch.test.mjs`/`loop.test.mjs`) là **work item riêng**, ngoài scope Phase 3, tiên quyết cho các rule dispatch bị giao. Nếu chỉ đủ nguồn lực một luồng, sửa trước.
5. **Enforcement full tại protected integration boundary** (§11, cơ chế kiểm chứng §13): hiện `approve` chạy `item.verify` + `node --test test/architecture.test.mjs`; full suite chỉ chạy sau merge trên CI. Cơ chế hiện có đã đúng ba điều kiện của reviewer: verify + invariant chạy **trên cây staged `git merge --no-commit`** (đúng candidate), `git merge --abort` khi đỏ, toàn bộ dưới `acquireMainCheckoutLock` có heartbeat (target không đổi giữa verify và commit), trunk qua `detectTrunk`, GitHub transport vẫn thực thi merge/verify cục bộ (không bypass). Cái thiếu duy nhất: invariant chạy ở **mọi** approve, kể cả leaf→root. Options: (a) thêm `npm test` vào `invariantChecks.commands`, chỉ config, nhưng full ở mọi leaf→root (root 13 con = 13 lần full); (b) giữ nguyên, ghi rõ rủi ro "phát hiện lỗi sau merge", dùng tạm; (c) `npm test` trong invariant chỉ khi target là trunk (`detectTrunk`), cần thay đổi code nhỏ trong `merge.mjs` để invariant checks nhận biết target. **Chốt: (c), làm trong work item merge-gate riêng, liên kết với Phase 3; (b) là trạng thái tạm có ghi rủi ro cho tới khi (c) landed.** Contract của item đó, không thu gọn thành "thêm full khi merge vào main" (§14): *protected integration target chỉ nhận candidate đã vượt full verification*, với acceptance criteria (sửa sau §15) — target theo `detectTrunk`/config, không hardcode; test candidate sau tích hợp (đã thỏa bằng staged merge); fail/cancel/thiếu evidence → không cập nhật target (đã thỏa); **target/candidate không đổi giữa verify và cập nhật ref: chưa được chứng minh** — lock chỉ ràng buộc actor tuân thủ lock, và recheck trước commit vẫn để lại cửa sổ giữa lần recheck cuối và cập nhật ref → AC (contract, không phải "thêm hai lệnh recheck"): *chỉ cập nhật target khi HEAD vẫn bằng giá trị dự kiến, bằng cập nhật có điều kiện, và commit dùng đúng tree đã xác minh* — cơ chế git có sẵn: `git write-tree` lấy tree hash trước verify → `git commit-tree <tree> -p <expectedHead> -p <branchHead>` → `git update-ref refs/heads/<trunk> <newCommit> <expectedHead>` (CAS nguyên tử của git, lệch → từ chối), thay cho `git commit --no-edit` trong merge state; **cây được test = cây được commit: hiện không đúng theo thiết kế** — sweep D2 cộng `.fgos/events*` vào staged commit sau verify, và untracked file trong workspace có thể ảnh hưởng kết quả test → AC: verify chạy trên candidate **bất biến trong worktree cô lập** (pattern có sẵn ở `catchup`/`return`), dữ liệu phát sinh từ verify không nhập vào candidate; ngoại lệ contract **có giới hạn** cho `.fgos/` (state store, truth ở JSONL theo L3, không phải source được test): metadata `.fgos/` do chính verb approve ghi được phép vào commit, mọi path khác phải đúng tree đã xác minh, và không tuyên bố hai tree bằng nhau tuyệt đối; kiểm thử cleanup khi fail, crash, abort thất bại. Tái dùng evidence full cho cùng candidate + environment: **tối ưu sau**, không phải điều kiện của gate đầu tiên (§15 rút lại nâng cấp ở §14). `git merge` tay ngoài fgos không kiểm soát được, ghi nhận. Là thay đổi merge contract → khuyến nghị đã hội tụ, **phê duyệt của anh còn chờ**; phase file đánh dấu chưa phê duyệt.
4. **N mutant tối thiểu mỗi rule** và **K failure opportunities** để promote: đề xuất N=3 (khớp P05), K=10. Số này là budget, không phải khoa học; anh chỉnh được.

## 5. Việc bị loại và lý do một dòng

- Sequential related→full trong một job: chậm hơn full, không có lợi ích tốc độ.
- Post-merge validation / auto-revert: cố ý đưa main vào đỏ.
- Breaker theo ngưỡng %: volume PR quá nhỏ, một confirmed miss là đủ.
- Block PR vì file mồ côi: default-deny đã an toàn, block tạo động cơ map bừa.
- Auto-discovery bằng import graph làm nguồn sự thật: mù subprocess, đảo ITR-D07.
- Historical replay: red-team + P05 đã chứng minh bất khả thi trong repo này.
- Merge queue / full sampling: repo merge qua `fgos approve`, đảo ITR-D01, ngoài scope.

## Phần B — Lịch sử phản biện (§7–§15; không phải contract)

Chín vòng đối chiếu với reviewer thứ hai. Mỗi vòng ghi rõ đọc §nào. Các khẳng định trong phần này có thể đã bị vòng sau rút lại; contract hiện hành là §3–§4 và AC §12.

## 7. Đối chiếu với review thứ hai (xếp Agent 2 > Agent 1)

Reviewer tự ghi "số liệu về repo chưa được kiểm chứng độc lập". Mọi điểm dưới đây được đối chiếu với repo trước khi nhận hay bác.

### 7.1 Thứ hạng: giữ Agent 1 > Agent 2

Lý do duy nhất reviewer đảo hạng: Agent 1 dừng ở "related required + full required", chưa giảm merge latency. Kiểm chứng: ITR-D01 khóa `npm test` = full (plan.md:591); DoD là full xanh; cửa merge là `fgos approve`, không có merge queue. Chính reviewer viết "nếu chưa có merge queue đáng tin cậy, dừng ở Stage 1", và Stage 1 của họ **là** trạng thái cuối của Agent 1. Tiêu chí đảo hạng không áp dụng cho Phase 3. Khoảng cách điểm giữa hai agent hẹp hơn §2 gợi ý; cả hai hội tụ về B + D + Stage 1.

### 7.2 Bảng tiếp nhận có điều kiện

| Điểm của reviewer | Quyết định | Căn cứ |
|---|---|---|
| C. Mutant phải đối chiếu full; related xanh + full xanh ≠ miss | **Nhận** | Đúng logic; đã sửa §3.3. Điều kiện: chỉ chạy full trên mutant mà related xanh để giữ chi phí nightly. |
| D. Retry xanh 1 lần ≠ flake; thêm `inconclusive`; tách gate-escape / omitted-failing-test | **Nhận phần phân loại, bác phần hành động** | Ba trạng thái và tách loại: đúng, rẻ, đã sửa §3.1. "Area về full tạm thời khi triage": **bác cho Phase 3** vì full đã required, cơ chế này thêm plumbing mà không thêm an toàn. Chỉ có nghĩa ở stage related gate một mình, stage đó không tồn tại trong scope. |
| E. Breaker state tách khỏi manifest; PR in-flight dùng manifest cũ; kiểm tra lại lúc cấp merge permission | **Nhận phần tách, bác phần merge-permission** | Tách policy (manifest) / control state (repo variable): đúng, đã có kill switch từ §3.1, nay tách rõ. "PR in-flight dùng manifest cũ" không phải rủi ro ở Phase 3 vì PR đó vẫn chạy full. "Kiểm tra lúc cấp merge permission": merge permission ở repo này = full xanh, breaker không tham gia; bác. |
| Đối chiếu cùng OS | **Nhận** | Manifest theo path, không theo OS; fail chỉ có ở macOS/Windows không phải bằng chứng selector. Đã sửa classifier. Chi phí ~0 vì artifact per-file đã có per OS. |
| Rule đổi → evidence mất hiệu lực; telemetry thiếu ≠ zero miss; diễn tập breaker | **Nhận** | Đúng và rẻ (hash rule). Diễn tập: một kịch bản cho mỗi failure mode (mất artifact, state unavailable, run in-flight), không phải chương trình liên tục. |
| B. Không block vì static graph không thấy import | **Nhận, và sửa cả đề xuất của em** | Em định thu hẹp import check vào `directTests` theo giả định chúng in-process. Kiểm tra manifest: **11/28 file `directTests` spawn `bin/fgos.mjs`**. Check sẽ block nhầm ~40% rule đúng. Hạ xuống warn; block chỉ cho test không tồn tại / schema sai / `test/direct/*` mồ côi. Đã sửa §3.2. |
| "100% kill = đủ" diễn giải quá mạnh | **Nhận về câu chữ** | Là gate cho bộ mutant đã chọn, không phải proof; holdout bù. Không đổi cơ chế. |
| A. Agent 2 nói correctness risk chỉ khi "rule rộng" là sai | **Nhận** | Đúng, exact-path rule vẫn stale được; củng cố nhận xét §2 rằng Agent 2 ít bám repo. |
| Historical regression replay "đúng cách" | **Bác** | P05 report + red-team §4: replay trên tree cũ làm manifest validate fail và hỏng `~/.fgos/config.json` toàn máy. Reviewer không biết P05. |
| Agent 2 có "đích giảm PR compute" là ưu điểm | **Bác cho Phase 3** | Phase 3 **thêm** compute (job related + compare + nightly), không giảm. Nói thẳng trong DoD thay vì hứa ngược. |
| §6 nghiệm thu: đo p50/p95 feedback time, merge time, compute | **Nhận một phần** | Feedback time (time-to-first-red) và inner-loop time: nhận. Merge time: **không đổi theo thiết kế** ở Phase 3, không đưa vào tiêu chí. Compute: đo để biết chi phí, không phải để giảm. |
| §6 còn lại: fail-closed, detection kích hoạt breaker thật, quarantine ảnh hưởng PR đang mở, re-promotion cần regression proof | **Nhận làm DoD Phase 3** | Khớp §3.1 và §3.4. |

### 7.3 Điều reviewer nói đúng nhất

"Circuit breaker không ngăn được lỗi đầu tiên lọt qua selector, chỉ hạn chế các lần sau." Đây chính là lý do full required là bất biến ở Phase 3, và là lý do trạng thái cuối của Agent 1 đúng chứ không phải thiếu. Breaker trong Phase 3 bảo vệ **độ tin của bằng chứng** và **`fgos return` verify** ở inner-loop, không bảo vệ merge.

## 8. Đối chiếu vòng hai (reviewer đọc lại report này)

Reviewer đọc **bản đầu** của report; ba mục "không đồng ý" (mutation đối chiếu full, rerun xanh ≠ flake, static import check) đã được sửa ở §7, không bàn lại. Các mục còn lại được kiểm chứng với repo trước khi quyết.

| Điểm của reviewer | Quyết định | Căn cứ / điều kiện |
|---|---|---|
| Main đỏ không làm mọi fail thành pre-existing; cho compare ghi ledger ngay | **Nhận, em sai ở vòng một** | Kiểm chứng `gh run view`: main đỏ tại chính step `npm test`, base artifact vẫn sinh được với `if: always()`. Gate thật là "base artifact tồn tại". Bổ sung dữ liệu reviewer không có: 154 test case đỏ tập trung ở runner/dispatch → main xanh vẫn là gate **thực tế** để promote dispatch. Đã sửa §3.1 và §4 Q3. |
| "5 run xanh" chỉ là health signal | **Nhận** | Bỏ con số; không còn là gate của hạ tầng. |
| Pre-existing cần test identity, không phải file | **Nhận** | Đơn vị classifier = test case (file + tên) từ TAP/junit. Không dùng failure-signature vì stack trace đổi theo run; case trùng tên nhưng lỗi khác → chấp nhận là điểm mù nhỏ, ghi nhận. |
| Selected → caught phải kiểm tra thật sự đỏ ở related | **Nhận** | Thêm `selected-but-divergent` → `inconclusive`. Rẻ, đã có artifact related. |
| Related-fail/full-pass chỉ là dấu hiệu | **Nhận** | Đổi `related-flake` thành `related-only-fail`, `inconclusive`, dùng làm thước đo để quyết định khi nào related được required. |
| Related job required tạo block do flake | **Nhận có điều kiện** | Bắt đầu không required, đo `related-only-fail`, chuyển required khi ≈ 0. |
| Force-full switch phải định nghĩa đọc/ghi/fallback/in-flight | **Nhận** | Đã định nghĩa ở §3.1. Quyền ghi Actions variables bằng `GITHUB_TOKEN` là câu hỏi mở. |
| State chỉ là canary, không kéo dài để né dispatch | **Nhận** | Đã là lập trường §4 Q2; thêm time-box: state onboard tối đa 2 tuần. |
| N=3/K=10 là budget bootstrap, không phải chứng chỉ | **Nhận** | Đúng như §4 Q4 đã ghi. |
| Coverage dòng thay đổi không "rẻ" | **Nhận về câu chữ** | Overhead V8 coverage chỉ trên tập related; cần script merge coverage với hunk diff. Không free, vẫn đáng làm warn-only. |
| Coverage-derived set không phải boundary đầy đủ; phải bổ sung đường chưa thực thi | **Bác một nửa** | Reviewer gộp "mapping đủ" với "suite đủ". Đường chưa test nào thực thi thì không có test để map; full suite cũng không bắt. Đó là lỗ suite (Pillar 1/2), không phải lỗ selector; selector không thể đủ hơn suite. Nhận phần: matrix review ghi ô trống ra làm side-output. Đã sửa §3.3. Điểm mù thật còn lại: coverage đo trên ubuntu, path chỉ chạy trên OS khác sẽ thiếu; chấp nhận vì related cũng chỉ chạy ubuntu. |
| Historical replay: harness lỗi là hạn chế triển khai, không bác phương pháp | **Nhận có điều kiện, bác phần pipeline riêng** | Đúng về nguyên tắc. Nhưng repo không có danh sách regression thật kèm test, và tái tạo cần ghép source pre-fix với test post-fix trên tree cũ, chính là tổ hợp làm P05 hỏng config. Chấp nhận dưới dạng: regression tái tạo được trong worktree cô lập → thành một mutant trong bộ nightly. Không xây pipeline replay. |
| Holdout boundary test = selection thiếu chủ động | **Nhận** | Đổi sang holdout mutant/fault scenario. Đã sửa §3.3. |
| Bốn câu hỏi chưa đủ khóa contract | **Nhận** | Phase file phải mang ba contract: bảng classifier (§3.1), bảng mutation verdict (§3.3), ngữ nghĩa breaker state (§3.1). Không chỉ là "hướng". |
| Agent 1 đứng đầu phụ thuộc scope full-required được xác nhận | **Đã xác nhận** | ITR-D01 là quyết định khóa trong plan, không phải giả định của report. Điều kiện của reviewer đã thỏa từ đầu. |

## 9. Đối chiếu vòng ba (reviewer đọc §7, chưa thấy §8)

Reviewer chấp nhận thứ hạng theo scope Phase 3 và rút lại việc đánh giá cao đích dài hạn của Agent 2. Các điểm còn lại:

| Điểm của reviewer | Quyết định | Căn cứ / điều kiện |
|---|---|---|
| Lý do chọn Agent 1 là hợp scope, không phải "đọc repo nên mọi suy luận đúng" | **Nhận** | §2 đã liệt kê bốn điểm yếu của Agent 1 phải vá; §7–§9 vá thêm. Tiêu chí là hợp scope + hạ tầng có sẵn. |
| "Không ép area về full" chỉ đúng cho CI; consumer local (`fgos return`) phải đánh giá riêng | **Nhận, và phát hiện rủi ro thật** | Kiểm chứng: `fgos return` và `approve` chạy `item.verify` literal qua `runGoalCheck`. Item đặt verify = `test:related` sẽ biến related thành gate merge nội bộ mà breaker state (repo variable) không thấy. Luật Phase 3 ghi ở §3.1: `item.verify` không bao giờ là `test:related`. |
| Theo dõi merge latency/compute như guardrail, không phải mục tiêu | **Nhận** | Đã thêm §3.1. |
| Full chỉ trên mutant related-xanh, với 4 điều kiện (baseline không mutation hợp lệ; related đỏ phải là test failure thật; related xanh + full lỗi hạ tầng → inconclusive; không dùng để tuyên bố metric cần full trên mọi mutant) | **Nhận cả 4** | Chính xác và rẻ; đưa vào bảng mutation verdict của phase file. |
| 11/28 file không suy ra 40% rule bị chặn | **Nhận, số rút lại** | Đối chiếu từng rule: 0/33 rule có directTest spawn mà không import source. Warn vẫn giữ vì lý do nguyên tắc; block là lựa chọn mở với chi phí 0 hiện tại (§3.2). |
| Replay: "chưa khả thi với harness hiện tại, Phase 3 chọn fault injection" thay vì "bất khả thi" | **Nhận về câu chữ** | Là quyết định ưu tiên đầu tư. §3.3 đã cho phép regression tái tạo được thành mutant nightly. |
| Không đưa "main xanh gate cứng" cho người dùng phê duyệt | **Đã rút ở §8**, reviewer chưa thấy | Q3 hiện là câu hỏi thứ tự ưu tiên (sửa main đỏ trước hay song song), dựa trên dữ liệu 154 case đỏ ở dispatch, không phải tiền đề sai. Giữ Q3 dạng đó vì nó quyết định ai làm gì trước. |
| N=3/K=10 không phải điều kiện đủ; 5 câu hỏi về fault (boundary nào, full bắt được, related bắt được, không đếm trùng, đúng phiên bản rule) | **Nhận** | Đã là lập trường §4 Q4; 5 câu hỏi thành **checklist nhận mutant vào bộ nightly**. Mỗi mutant phải gắn nhãn boundary và hash rule; hai mutant cùng boundary cùng vị trí đếm một. |

### Bốn điểm chốt sau ba vòng

1. **ITR-D07:** giữ nguyên, suggestion-only. Hai bên đồng ý; không còn là câu hỏi mở, chỉ cần anh xác nhận.
2. **Area:** state canary time-box ≤ 2 tuần → dispatch pilot. Hai bên đồng ý.
3. **Main đỏ:** compare ledger bật ngay; promotion gate bằng chất lượng evidence. Còn một lựa chọn ưu tiên thật: sửa 154 case đỏ ở dispatch **trước** khi onboard dispatch (em nghiêng về đây) hay song song.
4. **N/K:** budget bootstrap, không phải chứng nhận; checklist 5 câu hỏi là điều kiện thực.

## 10. Đối chiếu vòng bốn (reviewer đọc §8–§9)

Hai bên đã hội tụ về khung, thứ hạng, và ba contract kỹ thuật. Hai bất đồng thực chất còn lại được đo lại trước khi kết luận.

| Điểm của reviewer | Quyết định | Căn cứ / điều kiện |
|---|---|---|
| "Dispatch toàn inconclusive" là quá mạnh; fault làm case xanh→đỏ vẫn là evidence; rule không giao nhóm failure vẫn kiểm định được | **Nhận, em sai** | Đo lại run main ubuntu gần nhất: 142/7340 case đỏ (<2%), ~12 file, >80% ở `dispatch.test.mjs`/`loop.test.mjs`/`dispatch-production-call-sites.test.mjs`. 98% suite có baseline sạch. Luật đổi thành per-rule: promote khi mọi test case của rule xanh ở base. Đã sửa §3.1 và §4 Q3. |
| Coverage-derived là evidence mạnh, không phải bằng chứng đầy đủ; 4 trường hợp | **Nhận 2, bác 2, có điều kiện** | Điều kiện quyết định: coverage-derived đo ở **granularity file**, import làm chạy module top-level nên tập coverage ⊇ import closure. Với điều kiện đó, hàng "test có thể bắt nhưng lần đo không chạy nhánh" và "patch đổi luồng khiến test nay mới chạm S" đã nằm trong tập (test đã load S). **Nhận** hàng "test quan sát side effect mà không thực thi S": thật, dạng golden/baseline test so file generated đã commit (ví dụ `.agents/skills` là render target); xử lý bằng `FULL_TRIGGERS` hoặc boundary rule tay. **Nhận** thêm lỗ OS-specific. Kết luận chung của reviewer ("không nâng một lần đo thành chứng minh đủ") đúng: H2 chạy lại nightly, diff với manifest, và không phải mọi ô matrix trống đều là Pillar 1/2. Đã sửa §3.3. |
| "Base artifact tồn tại" cần nhưng chưa đủ: đúng SHA/env, đủ kết quả, phân biệt fail/skip/cancel/timeout/not-run | **Nhận** | Thêm contract artifact vào §3.1: SHA + OS + node version, marker hoàn tất, status enum per case; thiếu marker → `inconclusive`. |
| Đối chiếu theo revision cụ thể, không theo tóm tắt lệch phiên bản | **Nhận** | Từ đây mỗi vòng ghi rõ đối chiếu §nào. Report này là revision duy nhất; các § đánh số là mốc. |

### Trạng thái chốt sau bốn vòng

Hai bên thống nhất: Agent 1 làm khung cho Phase 3 full-required; ITR-D07 giữ nguyên suggestion-only; state canary ngắn rồi dispatch song song; ledger bật ngay, promote per-rule theo baseline sạch + fault evidence phân biệt được; N=3/K=10 là budget bootstrap với checklist 5 câu hỏi; ba contract (classifier §3.1, mutation verdict §3.3, breaker state §3.1) khóa trước implementation; `item.verify` không bao giờ là `test:related`.

Còn lại cho anh: xác nhận ITR-D07 (Q1) và quyết định 142 case đỏ là item riêng hay gộp vào Phase 3 (Q3). Không còn bất đồng kỹ thuật mở giữa hai reviewer.

## 11. Đối chiếu vòng năm (reviewer đọc §9, chưa thấy §10)

| Điểm của reviewer | Quyết định | Căn cứ / điều kiện |
|---|---|---|
| Import check: "chi phí 0" sai, vẫn có chi phí bảo trì và chặn test hợp lệ tương lai; block chỉ khi muốn structural contract | **Nhận** | Đã sửa câu chữ §3.2. |
| `item.verify`: cấm chuỗi literal không phải enforcement; cần policy / enforcement / migration; "full luôn bảo vệ mọi cửa merge" phải kiểm tra thật | **Nhận, và phát hiện lớn hơn** | Đo: `approve` chạy `item.verify` + `invariantChecks.commands` = chỉ `node --test test/architecture.test.mjs`. CI full chạy `push: main` + `pull_request`, nhưng luồng fgos merge cục bộ rồi push → full **sau** merge. Event log: 636 item `npm test`, 1061 placeholder, 67 `--test-name-pattern`, 57 `grep -q`, 0 `test:related`. Cửa merge cục bộ **chưa từng** được full bảo vệ. Migration: không cần. Enforcement thật = `npm test` trong `invariantChecks` → §4 Q5, quyết định của anh vì đổi contract cửa merge. Khẳng định "Phase 3 không hạ mức bảo vệ" sửa thành "Phase 3 không hạ mức bảo vệ **hiện có**, và mức hiện có thấp hơn ITR-D01 ngụ ý". |
| State canary: 2 tuần là timebox, exit criteria mới là điều kiện chuyển | **Nhận** | Exit: artifact đúng contract, classifier chạy trên ≥1 PR thật với phân loại đúng, breaker diễn tập 3 kịch bản. Đạt sớm chuyển sớm; hết timebox chưa đạt → báo blocker, không promote theo lịch. |
| Q3: làm song song, tách onboarding khỏi promotion, không bắt người dùng chọn | **Nhận, đã hội tụ ở §10** | §4 Q3 nay là quyết định, không phải câu hỏi: item riêng, song song nếu không tranh nguồn lực, sửa trước nếu chỉ một luồng. |
| Phase file thêm mục "authoritative verification ngoài CI" | **Nhận** | Là mục thứ tư bên cạnh ba contract, với ba tầng policy / enforcement / migration ở §3.1. |

## 12. Đối chiếu vòng sáu (reviewer đọc §10, chưa thấy §11)

| Điểm của reviewer | Quyết định | Căn cứ / điều kiện |
|---|---|---|
| "Mọi test case của rule xanh ở base" chưa đủ; phải phủ cả test ngoài selection dùng kiểm định rule; "98% suite" ≠ "98% rule" | **Nhận** | Đúng: miss lộ ra qua test **ngoài** selection; test đó đỏ nền thì miss vô hình. Gate sửa thành baseline sạch trên selected ∪ (coverage-derived ∪ static closure) của rule; mutant evidence chỉ đếm test xanh trên run không mutation. §3.1 đã sửa. |
| Coverage-derived: dynamic import có điều kiện làm S không được load; subprocess cần thu đủ; nightly refresh không bảo vệ khoảng giữa | **Nhận, có bằng chứng repo** | Kiểm chứng: `visibility-session.mjs` có đúng mẫu `import()` rẽ nhánh; `assignment.mjs` còn tệ hơn, import theo đường dẫn tính toán. Giải pháp: generator = coverage ∪ static closure qua `staticGraphTests` (đã có, union-only, khớp ITR-D07); import tính toán → `FULL_TRIGGERS`/boundary tay. Khoảng giữa hai refresh: chấp nhận vì full vẫn required. §3.3 đã sửa. Ranh giới đã thu hẹp đúng: hai trường hợp trước của reviewer được giải quyết với module **đã load**, không bị bác nói chung. |
| Mục verify ngoài CI phải nằm trong phase file, chỉ cơ chế thực thi | **Đã có** | §3.1 (ba tầng policy/enforcement/migration) và §11; là mục thứ tư của phase file bên cạnh ba contract. Reviewer chưa thấy §11 khi viết. |

### Acceptance criteria kiểm chứng được cho phase file Pillar 3

1. Mọi PR sinh `selector-plan.json` với SHA, base, manifest hash, breaker-state version, changed paths, matched rules, selected tests, decision + lý do.
2. Artifact `full` per OS: SHA + OS + node version, marker hoàn tất, status enum per case; upload `if: always()`; thiếu marker → `inconclusive`.
3. Classifier chạy per test case, cùng OS, xuất đúng 8 nhãn của §3.1; test contract bằng fixture cho từng nhãn.
4. Breaker state đọc ở đầu `selector-plan`, không đọc được → full; 3 kịch bản diễn tập (mất artifact, state unavailable, run in-flight) có bằng chứng.
5. Nightly fault-injection: mỗi mutant gắn boundary + hash rule, chạy related, full chỉ khi related xanh, verdict theo bảng §3.3; mutant không đủ 5 câu hỏi checklist không được nhận.
6. Promote per-rule: baseline sạch hai phía, trong đó tập đối chứng lấy từ full shadow + bộ fault, **không** từ mapping/generator đang kiểm định; ≥K failure opportunities không `inconclusive`, kill-rate 100% trên ≥N mutant, H5 wall-time ratio đo được.
11. Graph output ghi rõ hai vai trò: sinh rule candidate là suggestion-only có review; `staticGraphTests` lúc chạy chỉ cộng vào selection đã là related (test contract: path unknown + static graph có kết quả vẫn phải trả `full`).
12. Q5 (merge-gate) đánh dấu **chưa phê duyệt** trong phase file; Phase 3 không phụ thuộc vào nó để bắt đầu ledger/mutation/suggestion.
7. `item.verify` không chứa selector ở bất kỳ dạng nào (policy); enforcement theo Q5. Migration: event log không có literal `test:related`; trạng thái item hiện tại và alias/wrapper **chưa kiểm chứng** — audit này là AC của item merge-gate, không phải của Phase 3.
8. Import check là warn; block chỉ với test không tồn tại / schema sai / `test/direct/*` mồ côi.
9. State canary có exit criteria (1–4 đạt trên ≥1 PR thật) trong timebox 2 tuần; hết timebox chưa đạt → blocker, không promote.
10. 142 case đỏ là item riêng, prerequisite cho rule bị giao; Phase 3 không hứa sửa chúng.

## 13. Đối chiếu vòng bảy (reviewer đọc §11)

Reviewer rút lại khẳng định "full luôn bảo vệ cửa merge" theo evidence được báo cáo. Các điểm còn lại:

| Điểm của reviewer | Quyết định | Căn cứ / điều kiện |
|---|---|---|
| Ghi rõ khác biệt local merge vs GitHub PR transport | **Nhận, có sửa** | Kiểm chứng `github-adapter.mjs`: transport chỉ thay bề mặt review/approve; **merge và verify vẫn thực thi cục bộ**. Khác biệt thật là PR tới GitHub có CI full trước merge ở phía GitHub, còn merge fgos thì không. |
| "0 item `test:related`" chỉ là migration cho command đó; placeholder/verify yếu chưa kết luận; event log ≠ trạng thái hiện tại | **Nhận** | Thu hẹp claim đúng như vậy ở §3.1. Verify yếu/placeholder thuộc item merge-gate, không thuộc Phase 3. |
| "Main là nơi duy nhất" quá tuyệt đối; dùng protected integration boundary | **Nhận, code đã sẵn** | `merge.mjs` dùng `detectTrunk`, không hardcode `main`. (c) định nghĩa theo `detectTrunk`. |
| Post-merge CI không phải "gate" | **Nhận** | Sửa thuật ngữ §3.1: kiểm tra sau merge. |
| Nếu invariant chạy trước khi có candidate, một dòng config chưa đủ; 5 điều kiện của (c) | **Kiểm chứng: 4/5 đã thỏa bằng cơ chế** | Điểm gọi invariant thứ hai chạy trên cây staged `git merge --no-commit` với `git merge --abort` khi đỏ (đk 1, 3); `mergeRunnerItemLocked` giữ `acquireMainCheckoutLock` xuyên suốt (đk 2); GitHub transport không bypass (đk 4). Đk 5 (tái dùng evidence) chưa có, để item merge-gate cân nhắc. Cái thiếu là **phạm vi**: invariant chạy ở mọi approve kể cả leaf→root; (c) cần code nhỏ để gate theo target = trunk. |
| Chọn (c) đã sửa, item riêng liên kết Phase 3, (b) tạm với rủi ro ghi rõ | **Nhận, chốt** | §4 Q5 đã cập nhật. Phase 3 không quảng bá "full bảo vệ trước merge" cho tới khi (c) landed. |

Q5: **khuyến nghị** đã hội tụ ở (c); **phê duyệt** thay đổi merge contract là của anh, còn chờ (§15 sửa câu "không còn mở"). Cơ chế kiểm chứng ở bảng trên là 4/5 theo cách đọc vòng này; §15 hạ xuống 3/5 sau khi soát cửa sổ verify→commit.

## 14. Đối chiếu vòng tám (reviewer đọc §12, chưa thấy §13)

| Điểm của reviewer | Quyết định | Căn cứ / điều kiện |
|---|---|---|
| "Tập test có thể lộ miss" không được định nghĩa bằng mapping đang kiểm định (vòng tự xác nhận) | **Nhận, em sai ở §12** | Câu chữ §3.1 vòng trước định nghĩa tập đối chứng bằng coverage ∪ static closure, tức bằng chính generator sinh rule. Sửa: tập đối chứng = full shadow (mọi case ngoài selection) + bộ fault đối chứng. AC 6 sửa theo. |
| Union-only ≠ suggestion-only; phải ghi rõ graph output đề xuất rule hay chỉ cộng test sau khi selector đã được phép related; không tự cấp narrowing | **Nhận, kiểm chứng code** | `selectTests`: escalation trả `full` **trước** khi `staticGraphTests` được cộng → chỉ mở rộng selection đã related. Hai vai trò tách bạch ở §3.3; AC 11 thêm test contract "path unknown + static graph có kết quả vẫn `full`". |
| Q5 giữ 5 điều kiện, không thu gọn thành "full khi merge vào main" | **Nhận; §13 đã kiểm chứng 4/5 bằng cơ chế** | Reviewer chưa thấy §13. Điều kiện 5 (tái dùng evidence) nâng từ "cân nhắc" lên **yêu cầu** của item merge-gate, vì nó là điều kiện để (c) không làm chậm delivery. Q5 đánh dấu chưa phê duyệt trong phase file (AC 12). |
| Chưa xác nhận 10 AC vì chưa đọc nguyên văn | **Đúng quy trình** | AC nằm ở §12 của chính file này, nay 12 mục; đối chiếu theo revision, không theo tóm tắt. |

Trạng thái: không còn bất đồng kỹ thuật mở giữa hai reviewer sau khi reviewer đọc §13–§14. Phase file viết được ở dạng đề xuất, Q5 đánh dấu chưa phê duyệt. Còn lại cho anh: xác nhận ITR-D07 (Q1); ủy quyền nộp hai work item riêng (142 case đỏ dispatch; merge-gate (c) với 5 AC).

## 15. Đối chiếu vòng chín (reviewer đọc §13)

| Điểm của reviewer | Quyết định | Căn cứ / điều kiện |
|---|---|---|
| Tái dùng evidence là tối ưu sau, không phải điều kiện của gate đầu tiên | **Nhận, rút lại §14** | Em nâng nó thành yêu cầu ở §14 là quá mức. Thực tế: `fgos return` verify chạy trên branch, `approve` invariant chạy trên candidate — hai cây khác nhau, không có gì để tái dùng; với (c) full chỉ chạy ở trunk merge, một lần mỗi candidate. Lợi ích tái dùng nhỏ, để sau. |
| Lock có heartbeat chỉ ràng buộc actor tuân thủ lock; cần kiểm tra target/candidate trước commit hoặc chứng minh cơ chế có sẵn | **Nhận, kiểm chứng: không có cơ chế** | Soát cửa sổ giữa `runInvariantChecks` (dòng ~1549) và `git commit --no-edit` (dòng ~1624): chỉ có heartbeat renewal và sweep `.fgos/events*`. Không recheck HEAD, không so `write-tree`. §13 ghi "đk 2 đã thỏa trong lock" là sai; sửa thành AC của item merge-gate: ghi HEAD + staged tree hash trước verify, so lại trước commit, lệch → abort. |
| Cây được test phải đúng cây được commit; verify có thể đổi tracked files/index; kiểm thử cleanup khi fail/crash/abort thất bại | **Nhận, có bằng chứng ngược trong code** | Sweep D2 (tsk-3tp) tồn tại chính vì verify làm bẩn `.fgos/events`, và nó **cộng phần bẩn đó vào staged commit** → cây commit ≠ cây test theo thiết kế cho `.fgos/`. Không có kiểm tra tracked path khác. AC: sau verify, tracked path ngoài `.fgos/` sạch, hoặc verify trong worktree ephemeral của staged tree (pattern có sẵn ở `catchup`/`return`); cleanup có test cho fail, crash, abort thất bại (`abortMergeIfPossible` có 15 điểm gọi, chưa rõ có test crash giữa chừng). |
| "Q5 không còn mở" phải tách khuyến nghị khỏi phê duyệt | **Nhận, sửa câu chữ** | §4 Q5 và §13 sửa: khuyến nghị hội tụ ở (c); phê duyệt thay đổi merge contract là của anh. |
| Chưa tuyên bố implementation hiện có đáp ứng đầy đủ khi chưa tự kiểm chứng | **Đúng, và vòng này chứng minh lý do** | §13 nói 4/5 điều kiện đã thỏa; soát kỹ hơn còn 3/5. Hai điều kiện còn lại là AC của item merge-gate, không chặn Phase 3 shadow. |

### Đề xuất chốt với anh (không đổi nội dung, đổi cách gọi)

1. **ITR-D07:** giữ nguyên, suggestion-only — cần xác nhận.
2. **Q5:** phê duyệt **hướng** (c) tại protected integration boundary — cần phê duyệt vì đổi merge contract; implementation theo AC ở §4 Q5, trong đó hai AC (HEAD/tree recheck; tested tree = committed tree) là bắt buộc, tái dùng evidence là tối ưu sau.
3. **Ủy quyền nộp hai work item riêng:** 142 case đỏ dispatch; merge-gate (c) mang các AC trên.

Phase 3 shadow/ledger/mutation/suggestion không chờ 2 và 3.

## Câu hỏi chưa giải quyết

- Job `full` hiện chạy `npm test` qua `run-tests.mjs`; xuất per-file JSON có cần sửa runner không, hay `node --test-reporter=junit` đủ? Cần kiểm tra khi viết phase file.
- Bot mở PR đổi status trong manifest có đi qua được cửa `fgos approve` không, hay cần một đường riêng cho commit máy?
- `GITHUB_TOKEN` mặc định của workflow có quyền ghi Actions variables không, hay breaker state cần PAT / một cơ chế lưu khác (ví dụ artifact trên một branch cố định)?
- Artifact upload của job `full` phải `if: always()` để base artifact tồn tại khi main đỏ; `run-tests.mjs` có xuất được per-test-case TAP/junit không, hay phải thêm reporter?
