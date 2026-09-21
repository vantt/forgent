# Báo cáo brainstorm: giảm chi phí và độ dư thừa của test suite

**Ngày:** 2026-09-20  
**Trạng thái:** brainstorm / chưa phải quyết định hay implementation plan  
**Phạm vi:** giảm feedback latency, full-suite cost, số test dư thừa và chi phí bảo trì mà không làm yếu bằng chứng Definition of Done.

## 1. Vấn đề và dữ liệu nền

Các số liệu đã được ghi nhận trong repo:

- Baseline P02: full suite median khoảng **342.70s**; các lần chạy hợp lệ nằm trong khoảng **335.22–384.76s**.
- Full suite ở cuối track test-cost: khoảng **398s**, **6,802 pass**, 9 skipped, 0 fail.
- Hiện có khoảng **359 test files** và gần **7,791 vị trí cú pháp `test()`/`it()`**.
- Phân bố file lớn: `test/runner` 124, `test/cli` 66, `test/state` 50, `test/setup` 35.
- CLI harness audit từng ghi nhận 1,722 static `run()` call sites: 633 fixture construction, 496 business/use-case behavior, 405 Git/process integration, 188 process contract.
- Chẻ file từng hạ wall-clock mạnh nhưng đã chạm sàn; chẻ mịn hơn còn làm chậm vì process/import overhead.
- Pilot đã chứng minh ba hướng có giá trị:
  - docs-index fixture: khoảng **195.46s → 5.27s** cho file tập trung;
  - external-Claude isolation: focused sequential **50.68s → 9.84s**;
  - fast CLI fixture trên ba file: **94.36s → 67.57s**, giảm `fgos init` sites từ 136 xuống 3.

Vấn đề không chỉ là “test nhiều”. Có bốn loại chi phí khác nhau:

1. **Selection cost:** chạy những test không liên quan đến thay đổi.
2. **Execution cost:** subprocess, Git, fixture, replay và import graph bị dựng lại nhiều lần.
3. **Proof duplication:** cùng invariant được chứng minh lặp qua nhiều surface/layer.
4. **Proof repetition:** cùng một bằng chứng xanh bị chạy lại ở nhiều gate hoặc cùng input.

## 2. Nguyên tắc không được đánh đổi

- `npm test` hiện vẫn là full-suite DoD proof; brainstorm này chưa thay đổi điều đó.
- Tối ưu inner loop không được tự nhận là thay thế return/post-merge/CI gate.
- Một test chỉ được coi là dư thừa khi cùng invariant, cùng production guard, cùng boundary và cùng failure mode đã có canonical proof khác.
- Process, Git, persistence, cross-language, packaging và concurrency boundaries không được xóa chỉ vì assertion text giống nhau.
- Dependency không biết rõ phải dẫn tới cache miss hoặc fallback full, không được optimistic pass.
- Mọi claim về tốc độ cần before/after evidence; giảm source lines không đồng nghĩa giảm runtime.

## 3. Toàn bộ các hướng brainstorm đã có

### 3.1 Related-test selector — ý tưởng khởi đầu của người dùng

Tạo `npm run test:related` cho inner loop:

1. Lấy tracked changes từ merge-base tới working tree, cộng staged/unstaged/untracked.
2. Giữ cả hai phía rename/delete.
3. Map changed paths qua ownership manifest.
4. Dùng static import/call graph chỉ để **bổ sung**, không loại test.
5. Thêm mandatory boundary tests.
6. Nếu có path không giải thích được hoặc surface động/rủi ro thì fallback full suite.
7. `--explain` phải in changed paths, matched rules, selected tests và lý do escalation.
8. Empty selection không bao giờ được xanh.

Manifest nên có `id`, `ownerArea`, `sourcePatterns`, `directTests`, `boundaryTests`, `reason`, `escalationPolicy` và được lint chống stale/empty/traversal/symlink escape.

Đây là cách giảm inner-loop latency, không giảm full-suite CPU hay số test thật.

### 3.2 Proof reuse theo commit SHA

Một full-suite result có thể gắn với:

- commit SHA;
- test-manifest/runner/config hash;
- toolchain/runtime class;
- relevant environment class;
- proof command và artifact digest.

Nếu return, post-merge hoặc CI gặp đúng cùng immutable proof input thì tái sử dụng artifact thay vì chạy lại. Bất kỳ input nào khác làm invalidation. Hướng này nhắm vào số **lần** chạy full suite, không phải test selection.

### 3.3 Proof registry / proof ownership

Tạo registry:

```text
Invariant → canonical direct proof → boundary witnesses → historical faults
```

Một business invariant có thể có nhiều direct cases nhưng chỉ cần số lượng boundary witness nhỏ và có chủ đích. Registry cho phép trả lời test nào thật sự dư thừa và ngăn regression test mới luôn được thêm ở lớp e2e đắt nhất.

### 3.4 Chuyển business behavior khỏi CLI subprocess

Tách narrow use-case modules theo pattern `src/verbs/merge/*`; business matrix chạy trực tiếp, mỗi verb giữ một số CLI smoke cho parser, envelope, cwd/env và exit mapping. Không cần tạo global `runCli(argv, ctx)`.

Cụm đã được audit: `discover`, `plan`, `edit`, `move`, `graph`, `stale`, `workflow`, `gate-check`; khoảng 259 static business call sites trong stage/edit/read cluster.

### 3.5 Fast fixture expansion

Dùng explicit opt-in `tmpCwdFast`, `initGitCwdFast`, `initGitCwdMainFast`, `initHeadlessGitCwdFast` ở nơi CLI `fgos init` chỉ dựng fixture. Giữ subprocess khi test chứng minh init output, pre-init refusal, idempotency, cwd/subdir hoặc process boundary.

Follow-up đã có scope 9 file và 128 residual static `fgos init` fixture sites.

### 3.6 Model-based/state-machine conformance tests

Mô tả transition bằng dữ liệu rồi dùng runner chung sinh:

- happy path;
- illegal predecessor;
- wrong role;
- stale CAS;
- emitted event;
- replay equivalence.

Phù hợp với Work status/stage, claim lifecycle, coordination, Assignment/Run và authorization windows. Chỉ giảm runtime nếu fixture/action cũng được chia sẻ hoặc chạy direct; parameterization đơn thuần chỉ giảm source duplication.

### 3.7 Metamorphic và property testing

Thay nhiều expected-output variations bằng quan hệ bất biến:

- replay/normalize/idempotency ổn định;
- serialize–parse round trip;
- thêm event không liên quan không đổi query;
- retry không sinh event thừa;
- reorder bất hợp lệ bị từ chối.

Property có thể nén variation matrix nhưng không thay boundary witness.

### 3.8 Pairwise/t-wise combinatorial testing

Với ma trận OS × status × stage × role × config × transport × error, dùng pairwise hoặc 3-wise covering arrays thay Cartesian product, trong khi pin riêng historical regressions và high-risk combinations.

### 3.9 Dynamic dependency tracing

Instrument test để ghi dependency hành vi thực:

- module/symbol đã load;
- file/config/template đã đọc;
- subprocess/verb/Git operation;
- event type đã ghi;
- registry key/artifact đã lookup.

Selection an toàn hơn khi dùng hợp:

```text
ownership manifest ∪ dynamic trace ∪ graph additions ∪ mandatory boundaries
```

Dynamic trace không đủ một mình vì chỉ thấy nhánh từng chạy.

**Cập nhật thực nghiệm (2026-09-21) — GitNexus làm phần "graph additions" tĩnh, miễn phí:**

Repo đã có GitNexus index sẵn (MCP `context`/`impact`, 52k+ node sau reindex sạch).
Prototype thật (không phải lý thuyết) trên 6 symbol, đối chiếu grep ground-truth:

- `src/state/**`, `src/setup/**`, `src/report/**`, `src/intake/**` (đúng phạm vi
  manifest pilot hiện tại): GitNexus **chính xác 4/4** — kể cả phân biệt đúng
  lời gọi thật với chỉ nhắc tên trong comment/test description, và tự flag
  đúng `mergeConfigDefaults` là CRITICAL risk (461 impacted) dù file nhỏ/thuần —
  tín hiệu loại ứng viên rủi ro mà hand-curate theo kích thước file sẽ bỏ sót.
- `src/verbs/**` (2/2 case thử): GitNexus báo sai "0 callers" cho
  `rejectUseCase`/`mergeList` — caller thật là `bin/fgos.mjs` (import trực
  tiếp + gọi thật, xác nhận bằng grep). Đây là blind spot **đã có tài liệu
  sẵn** trong CLAUDE.md của repo (tsk-38h: `bin/fgos.mjs` 5000+ dòng, 0
  Function symbol được index kể cả sau reindex sạch) — không phải staleness,
  là giới hạn cấu trúc. Đúng lý do `src/verbs/merge/**` đã bị loại thủ công
  khỏi manifest P04; prototype này xác nhận lại quyết định đó đúng.
- Index GitNexus có thể hỏng thật (FTS inconsistent, gặp trong session này) —
  `--repair-fts` sửa được, không cần rebuild toàn bộ trước.

**Kết luận phạm vi:** dùng được làm tín hiệu bổ sung/validate cho ownership
manifest, nhưng chỉ trong 4 thư mục pilot hiện tại — không dùng được cho
`src/verbs/**` (toàn bộ verb CLI, không riêng `merge/`) vì mù cấu trúc với
`bin/fgos.mjs`. Bất kỳ tooling nào dựa trên GitNexus để auto-suggest manifest
rule bắt buộc phải cross-check `bin/fgos.mjs` trước khi tin "0 callers" —
đúng nguyên tắc UNKNOWN-không-phải-an-toàn đã có sẵn trong CLAUDE.md. Cơ hội
thật nhưng hẹp hơn kỳ vọng ban đầu — không phải cú hích cho toàn bộ ~7,791 test.

### 3.10 Differential/parity testing giữa direct use-case và CLI

Chạy cùng representative input qua direct use-case và CLI adapter, normalize semantic result rồi chứng minh parity. Sau khi adapter parity được khóa:

```text
N business cases × 2 surfaces
```

có thể nén thành:

```text
N direct cases + K adapter parity cases, K << N
```

### 3.11 Fixture DAG / immutable snapshots

Xây các trạng thái fixture có quan hệ:

```text
empty → initialized → work-state / git-root / coordination-session → specialized states
```

Mỗi test clone/copy-on-write snapshot gần nhất rồi chỉ thực hiện delta. Mỗi snapshot cần builder/conformance proof với production path để tránh fixture stale.

### 3.12 Negative-space coverage map

Lập ma trận:

```text
contract × operation × allowed/refused × boundary
```

Tối ưu dựa trên ô proof, không dựa trên số test. Có thể xóa nhiều test cùng chứng minh một ô nhưng vẫn phát hiện ô quan trọng chưa có proof nào.

### 3.13 Historical fault corpus

Chuyển regression history thành fault specimens có minimal input, invariant, fix/ref và expected detector. Nhiều regression tests trở thành data rows chạy qua canonical harness/property thay vì mỗi bug tạo thêm một file hoặc e2e scenario độc lập.

### 3.14 Test budget và admission gate

Theo dõi theo area:

- inner-loop p95;
- full-suite CPU/wall;
- subprocess/fixture count;
- boundary-test count;
- flake rate.

Test mới khai metadata như invariant, layer, historical fault và boundary. Review cảnh báo khi invariant đã có quá nhiều boundary proofs, test dùng subprocess mà không chứng minh process contract, hoặc dùng `fgos init` chỉ để dựng fixture.

### 3.15 Mutation-boundary proof policy

Chọn proof theo loại contract bị đổi, không chỉ file dependency:

| Mutation | Proof tối thiểu gợi ý |
|---|---|
| Pure state function | direct + property |
| CLI parser | verb CLI contract |
| Event schema/replay | state + migration + representative CLI |
| Git merge behavior | Git integration + rollback/conflict |
| Config/default | setup + doctor + platform |
| Generated projection | generator + source/target parity |
| Rust host route | Rust route + Node compatibility witness |

### 3.16 Evidence ladder

- L0 static/schema/architecture/generated checks.
- L1 direct behavioral tests.
- L2 boundary witnesses.
- L3 full regression.

Các level tích lũy bằng chứng, không phải các suite tùy tiện cạnh tranh nhau.

### 3.17 Changed-output/artifact-delta testing

Với generated docs/indexes/manifests/routes/skill wrappers, chọn test theo artifact dependency và output delta. Nếu output không đổi có thể tránh một số downstream proof; nếu output đổi thì chạy contract tests của artifact đó.

### 3.18 Process virtualization

Dùng deterministic adapters cho clock, process runner, Git transcript, filesystem events, provider CLI, PID/liveness. Chạy policy matrix qua adapter và giữ representative real-process/real-Git proofs. Rủi ro chính là tạo mock universe khác production.

### 3.19 Input-closure memoization xuyên commit

Tái sử dụng test result nếu hash của toàn bộ input closure không đổi:

```text
test source + imported production + fixture builders + config/schema/templates + runtime class
```

Dynamic trace có thể bổ sung closure; dependency chưa biết phải là cache miss. Tiềm năng lớn nhưng cache hit sai nguy hiểm hơn selector thiếu.

### 3.20 Canary-first scheduling

Chạy theo thứ tự:

1. directly related tests;
2. related historical faults;
3. fast high-yield tests;
4. related boundaries;
5. slow unrelated tail.

Không nhất thiết giảm CPU khi suite xanh nhưng giảm time-to-first-useful-failure. Local inner loop có thể fail-fast; DoD/CI có thể tiếp tục thu toàn bộ failure.

### 3.21 Semantic long-test lanes

Không tạo một bucket `slow` chung. Phân theo nguyên nhân: real-process, real-Git, cross-language, packaging/install, concurrency/timing, provider/network, large-state replay. Mỗi lane có fixture policy và cadence phù hợp.

## 4. Brainstorm round mới — các góc nhìn bổ sung

### 4.1 Test portfolio optimization theo giá trị phát hiện trên chi phí

Coi suite như một portfolio. Mỗi test có:

- runtime/CPU/RSS;
- flake probability;
- historical unique detections;
- overlap với test khác;
- severity của invariant;
- boundary uniqueness.

Xếp hạng theo **marginal fault-detection value per cost**, không theo “unit/integration/e2e”. Test đắt nhưng là proof duy nhất vẫn giữ; test rẻ nhưng chưa từng mang thông tin mới và trùng hoàn toàn là candidate dọn. Cần tránh diễn giải “chưa từng fail” thành “vô dụng”: metric chỉ hỗ trợ review, không tự xóa.

### 4.2 Failure-signature clustering

Thu thập lịch sử failure signatures: assertion, stack, invariant, production guard, changed paths. Nếu hàng chục test luôn fail cùng nhau vì cùng một guard, giữ một canonical detector nhanh ở đầu và một số boundary witnesses; phần còn lại được xem xét nén. Ngược lại, test có failure signature độc lập dù nội dung giống nhau phải giữ.

### 4.3 Dominator/minimal hitting-set analysis cho proof graph

Biểu diễn:

```text
test → invariant → boundary → risk/fault class
```

Tìm tập test nhỏ nhất bao phủ mọi required proof node (set cover/hitting set), nhưng thêm constraints bắt buộc cho historical faults và boundary độc lập. Kết quả không tự động xóa test; nó cho biết phần dư thừa lý thuyết và các proof không có backup.

### 4.4 Contract mutation seeding có mục tiêu

Thay broad mutation testing bằng targeted seeded faults tại các guard quan trọng:

- đảo điều kiện authorization;
- bỏ CAS/version check;
- bỏ event emission;
- đổi exit category;
- bỏ rollback/cleanup.

Ghi test nào bắt từng seeded fault. Test không bắt fault nào chưa chắc vô dụng, nhưng matrix này giúp chứng minh test nào thật sự khác biệt và hỗ trợ dedup bằng evidence mạnh hơn coverage.

### 4.5 Hierarchical change-risk classification

Không phải mọi diff cùng rủi ro. Classifier cơ học dựa trên changed contracts:

- leaf pure logic;
- local use-case;
- shared state/schema;
- process/Git boundary;
- test infra;
- packaging/cross-language.

Risk class quyết định proof ladder và cache policy. Không cần model phán tùy ý; mapping phải explicit/auditable, unknown → full.

### 4.6 Spec/example executable tests

Một số test lặp vì cùng contract được mô tả ở specs, command registry, examples và tests riêng. Có thể biến canonical examples/tables thành executable fixtures, để một nguồn sinh cả documentation example và conformance row. Điều này giảm drift và duplication nguồn, nhưng không được làm specs phụ thuộc implementation details.

### 4.7 Shared immutable service sandboxes

Với test phải dùng process thật nhưng chỉ đọc baseline, khởi động một sandbox/service daemon theo worker rồi cấp namespace riêng cho mỗi case thay vì boot process tree từ đầu. Phù hợp cho gateway/provider fake hoặc Rust host; không phù hợp nếu process startup chính là boundary cần kiểm. Isolation key và cleanup phải được chứng minh để không biến thành shared-state flake.

### 4.8 Work-stealing scheduler theo thời lượng dự đoán

Node chạy song song theo file nhưng tail imbalance gây core rảnh. Thay file list tĩnh bằng scheduler chia test shard theo historical duration, chạy longest-first và work-steal. Khác việc chẻ thêm file: giữ process pool cố định, tránh thêm startup overhead. Muốn làm được cần runner/harness hỗ trợ shard execution mà không phá file-level isolation.

### 4.9 Persistent test workers

Giữ một pool Node worker đã preload common modules, gửi isolated test jobs thay vì spawn một Node process cho mỗi file/CLI case. Có thể giảm import/startup CPU lớn. Rủi ro là module cache/global/env leakage; chỉ phù hợp cho tests đã chứng minh reset protocol. Process-contract tests vẫn chạy ngoài pool.

### 4.10 Resource-aware test scheduling

Gắn resource class cho test: CPU-heavy, IO-heavy, Git-lock, shared-package-root, port, memory-heavy. Scheduler tránh chạy cùng lúc các test tranh cùng tài nguyên và ghép CPU-heavy với IO-wait-heavy. Mục tiêu là giảm contention/OOM/flakes, không chỉ tăng concurrency mù quáng.

### 4.11 Flake tax accounting và deterministic-time conversion

Flake làm test phải rerun và phá cache/proof reuse. Mỗi flaky test cần “flake tax” = runtime × retry/diagnosis frequency. Ưu tiên thay polling/timing windows bằng fake clock, event/latch hoặc deterministic scheduler. Đây có thể mang ROI cao hơn xóa test bình thường vì flake gây cả chi phí máy lẫn chi phí người.

### 4.12 Failure-preserving minimization

Khi một test integration lớn bắt bug, tự động/minh bạch delta-debug fixture, event log, argv hoặc sequence thành minimal reproducer. Sau đó giữ minimal direct regression và một boundary witness thay vì giữ nguyên scenario khổng lồ mãi mãi.

### 4.13 Test expiration/revalidation policy

Regression test không tự hết hạn, nhưng có checkpoint revalidation khi production guard được thay thế hoặc boundary biến mất. Review hỏi:

- fault còn có thể xảy ra qua kiến trúc hiện tại không;
- canonical invariant đã chuyển sang guard khác chưa;
- test đang đỏ vì contract hay vì implementation shape cũ;
- có thể chuyển specimen vào corpus/property không.

Đây là lifecycle management, không phải TTL tự xóa.

### 4.14 Proof provenance ledger

Mỗi proof artifact ghi exact code SHA, test list, input closure, runtime, environment, result digest và consumer gates. Ledger làm nền cho reuse/cache và giúp tránh chạy lại vì không biết kết quả trước có đáng tin hay không. Nó cũng phân biệt “test đã chạy” với “proof còn hợp lệ cho artifact hiện tại”.

### 4.15 Remote/distributed execution và historical-duration sharding

Nếu CPU local là bottleneck, chia shards theo duration lịch sử sang nhiều worker/máy, giữ deterministic artifact aggregation. Đây chỉ giảm wall-clock, không giảm tổng CPU hay redundancy; nên đứng sau việc loại bỏ work vô ích và chỉ dùng khi latency còn quan trọng.

### 4.16 Build/test dependency sandboxing kiểu content-addressed

Chạy tests trong sandbox khai báo input/output, tương tự build systems hermetic. Content-addressed execution cho phép cache xuyên branch/máy. Đây là phiên bản mạnh và đắt của input-closure memoization; chỉ đáng làm nếu proof provenance và dependency declaration đã đủ trưởng thành.

### 4.17 Prod telemetry → test prioritization, không → test deletion

Nếu fgOS được dùng ngoài repo, telemetry ẩn danh/được phép về verb, config shape và failure class có thể ưu tiên combinations thực tế. Không được dùng “ít dùng” để xóa security/correctness boundary; telemetry chỉ điều chỉnh scheduling và bổ sung missing scenarios.

### 4.18 Counterfactual gate analysis

Đo giá trị từng gate bằng replay lịch sử: nếu bỏ test/gate X, bao nhiêu lỗi lịch sử sẽ lọt tới gate sau hoặc production? Điều này định lượng duplication giữa local, return, post-merge và CI, từ đó quyết định proof reuse/cadence dựa trên lead time chứ không chỉ runtime.

## 5. Nhóm giải pháp theo mục tiêu

| Mục tiêu | Đòn bẩy mạnh |
|---|---|
| Feedback nhanh cho diff hiện tại | related selector, risk policy, canary-first |
| Full suite nhanh hơn | fast fixture, direct use-case, parity compression, persistent workers, scheduler |
| Ít lần chạy full suite | SHA/input-closure reuse, provenance ledger |
| Ít test thật sự | proof registry, fault corpus, state-machine/property/pairwise, hitting-set audit |
| Ít flake/OOM | deterministic time, resource scheduling, hermetic sandbox |
| Không phình trở lại | admission gate, budget, test lifecycle/revalidation |
| Scale wall-clock sau khi đã tối ưu | distributed execution, duration-balanced shards |

## 6. Các hướng không nên nhảy vào trước

- Chẻ test file mịn hơn: đã đo và từng làm chậm hơn.
- Static import graph làm selector duy nhất: không thấy dependency động/cross-language/subprocess.
- Cache lạc quan: cache hit sai có thể giả mạo DoD proof.
- Global `runCli(argv, ctx)`: scope kiến trúc quá rộng; nên tách narrow use-case.
- Xóa test dựa trên assertion text, code coverage hoặc “chưa từng fail”.
- Một bucket “slow tests” chung không phân biệt semantics.
- Tăng concurrency tối đa mà không tính memory/shared resources.
- Distributed execution trước khi loại bỏ work dư thừa: chỉ trả tiền để chạy lãng phí nhanh hơn.

## 7. Chương trình thí nghiệm đề xuất

### Track A — Đo và mô hình hóa proof

1. Sinh inventory per-test: duration, subprocess count, fixture, invariant, production guard, boundary, historical fault.
2. Tạo proof graph và negative-space matrix.
3. Cluster failure signatures và ước lượng overlap.
4. Không xóa test trong bước đo.

### Track B — Related selection ở shadow mode

1. Ownership manifest + conservative selector + `--explain`.
2. Dynamic trace pilot trên một area.
3. Replay 30–50 historical diffs.
4. Đo selected ratio, fallback rate, overhead và misses.
5. Chưa thay full-suite gate.

### Track C — Giảm execution cost đã có evidence

1. Fast-fixture expansion cho 9 file đã audit.
2. Extract stage/edit/read use cases.
3. Thêm differential CLI parity tests.
4. Đo subprocess count và full-suite impact.

### Track D — Proof reuse pilot

1. Bắt đầu reuse cùng immutable SHA giữa hai gate cục bộ.
2. Ghi provenance đầy đủ.
3. Unknown env/input → rerun.
4. Sau khi đúng mới thử input-closure reuse xuyên commit.

### Track E — Compression pilot

Chọn một state machine hoặc config matrix:

1. Lập canonical invariant map.
2. Chạy targeted mutation seeds.
3. So sánh suite hiện tại với model/property/pairwise replacement.
4. Giữ historical fault corpus và boundary witnesses.
5. Chỉ xóa test khi proof equivalence được chứng minh.

### Track F — Scheduler pilot

1. Thu historical duration/resource class.
2. So sánh Node mặc định với longest-first fixed worker pool.
3. Không thay semantics/test count.
4. Đo wall, CPU, RSS và tail utilization.

## 8. Ưu tiên hiện tại

Thứ tự có khả năng cho ROI tốt nhất:

1. **Fast-fixture expansion** — đã có bằng chứng, rủi ro thấp.
2. **Narrow use-case extraction + CLI parity** — giảm subprocess bền vững.
3. **Related selector shadow mode** — feedback nhanh, nhưng cần miss evidence.
4. **Proof provenance + same-SHA reuse** — tránh chạy lặp cùng bằng chứng.
5. **Proof inventory/registry** — nền để xóa test có căn cứ.
6. **Duration/resource-aware scheduler** — tối ưu tail mà không chẻ thêm file.
7. **Dynamic trace + input-closure cache** — tiềm năng lớn, rủi ro lớn hơn.
8. **Model/property/pairwise compression** — làm theo từng bounded context.
9. **Distributed execution/content-addressed sandbox** — chỉ sau khi work dư thừa đã giảm.

## 9. Đánh giá sau nhiều lát quan sát và xếp hạng theo impact

### 9.1 Các lát quan sát dùng để tránh xếp hạng theo cảm tính

Xếp hạng dưới đây đối chiếu cùng một hướng qua sáu lát:

1. **Wall-clock xanh:** suite xanh mất bao lâu.
2. **Time-to-first-failure:** lỗi liên quan tới diff được trả về sớm đến đâu.
3. **Tổng CPU/I/O/RSS:** có giảm work thật hay chỉ dời/chạy song song work.
4. **Độ phình tương lai:** có ngăn test/subprocess/fixture mới sinh thêm không.
5. **Độ tin cậy proof:** nguy cơ false-green, stale fixture hay cache sai.
6. **Bằng chứng repo-local:** đã có số đo hay mới là giả thuyết.

Các quan sát độc lập cùng chỉ về một cấu trúc chi phí:

- P02 profile có tổng testcase time khoảng **2,928.6s**; `cli` chiếm **51.6%**, `runner` **17.3%**, `rust-host` **9.6%**, `report` **7.6%**. Vì vậy tối ưu leaf unit tests không thể là đòn bẩy chính.
- Trong CLI audit, **1,129/1,722 call sites (65.6%)** là fixture construction hoặc business behavior — hai nhóm có khả năng rời khỏi subprocess mà không bỏ boundary proof. 593 sites còn lại là process/Git integration và không nên nén cơ học.
- Fast-fixture pilot giảm 136 `fgos init` sites xuống 3 và giảm focused time khoảng **28.4%**; đây là bằng chứng trực tiếp cho fixture elimination.
- Docs-index small-state fixture giảm file khoảng **97.3%**; external-provider isolation giảm focused set khoảng **80.6%**. Cả hai chứng minh “loại work không thuộc invariant” mạnh hơn scheduling.
- Chẻ file mịn hơn từng làm suite chậm hơn; do đó parallelism/file sharding không giải quyết work gốc.
- Related selection chưa có implementation/shadow miss analysis; impact inner loop có thể rất cao nhưng độ chắc hiện thấp hơn fixture/use-case work.
- Full suite từng dao động khoảng 335–399s và chịu ambient load/OOM; scheduler và resource isolation có giá trị nhưng không chống suite phình.

### 9.2 Thang chấm

Mỗi hướng được chấm 1–5:

- **Speed:** tác động tiềm năng lên feedback và/hoặc full-suite cost.
- **Anti-growth:** khả năng ngăn hệ thống phình trở lại.
- **Proof safety:** 5 là dễ giữ proof đúng/fail-closed.
- **Evidence:** mức bằng chứng hiện có trong repo.
- **Reach:** độ rộng phần suite được hưởng lợi.

`Impact tier` ưu tiên Speed + Anti-growth + Reach, nhưng hạ bậc nếu Proof safety/Evidence quá thấp. Đây không phải công thức giả chính xác; điểm dùng để công khai trade-off.

### 9.3 Xếp hạng tổng thể — triệt để và bền vững nhất trước

| Hạng | Cách tiếp cận | Speed | Anti-growth | Safety | Evidence | Reach | Impact tier | Đánh giá |
|---:|---|---:|---:|---:|---:|---:|---|---|
| 1 | **Proof architecture: invariant registry + canonical proof + boundary witnesses + admission/budget gate** | 4 | 5 | 5 | 2 | 5 | **S** | Hướng duy nhất vừa cho phép xóa duplication có căn cứ vừa ngăn test mới quay lại lớp đắt. Không cho win tức thì nếu làm metadata-only; phải đi cùng migration theo hotspot. |
| 2 | **Direct use-case extraction + differential CLI parity** | 5 | 4 | 4 | 4 | 5 | **S** | Đánh đúng 51.6% testcase time ở CLI và 496 business call sites. Nén `N × surfaces` thành `N direct + K boundary`; giảm process thật và tạo kiến trúc test bền. |
| 3 | **Fixture elimination/DAG + production-equivalence contracts** | 5 | 4 | 4 | 5 | 4 | **S** | ROI đã chứng minh rất mạnh. Muốn bền phải cấm fixture-only subprocess qua admission lint; nếu chỉ thay vài file thì suite sẽ mọc lại. |
| 4 | **Conservative related selection + mutation-boundary policy + canary-first** | 5 inner-loop / 1 full | 3 | 4 khi fail-closed | 1 | 5 | **A+** | Cải thiện trải nghiệm nhanh nhất. Không giảm full-suite hay số test; cần shadow history và unknown→full. Nên là projection từ proof registry, không thành manifest thứ hai tự trôi. |
| 5 | **Proof provenance + same-SHA reuse giữa các gate** | 5 khi có rerun | 3 | 4 | 2 | 4 | **A+** | Có thể xóa nguyên lần chạy 6–7 phút. Bền nếu gate bắt buộc tiêu thụ ledger thay vì tự chạy lại; chưa biết tần suất exact-SHA rerun nên phải instrument trước. |
| 6 | **Historical fault corpus + model/property/pairwise compression** | 4 | 5 | 4 | 2 | 4 | **A** | Cách chính để giảm số test thật và source duplication trong state/policy matrices. Chỉ làm theo bounded context, giữ historical faults và real-boundary witnesses. |
| 7 | **Targeted mutation seeding + proof graph/hitting-set audit** | 2 trực tiếp | 5 | 5 | 1 | 4 | **A** | Không tự làm suite nhanh ngay, nhưng là bằng chứng mạnh nhất để xóa test an toàn và đo unique detector value. Là công cụ quyết định cho hạng 1/6. |
| 8 | **Resource-aware fixed worker pool, longest-first/work-stealing** | 3 | 1 | 4 | 1 | 5 | **B+** | Giảm tail/contestion mà không chẻ file. Không giảm CPU, duplication hoặc growth; chỉ đáng làm sau khi loại work vô ích. |
| 9 | **Flake-tax program + deterministic clock/latches** | 3 | 3 | 5 | 3 | 3 | **B+** | Giảm rerun, false alarms và phá cache; impact thường bị profile wall-time che khuất. Nên ưu tiên flakes có tax cao, không phải mọi timing test. |
| 10 | **Dynamic trace + input-closure memoization xuyên commit** | 5 tiềm năng | 3 | 2 | 1 | 5 | **B / research** | Trần lợi ích rất cao nhưng false cache hit nguy hiểm. Chỉ được xây sau provenance, ownership và dependency unknown semantics; bắt đầu observe-only, không dùng làm DoD. |
| 11 | **Persistent workers/shared service sandboxes/process virtualization** | 4 | 2 | 2–3 | 1 | 4 | **B / selective** | Có thể giảm startup/import/process cost, nhưng leak global/env/cache dễ làm test giả. Chỉ áp dụng lane đã có reset/equivalence proof. |
| 12 | **Changed-output/artifact-delta proof** | 3 | 3 | 4 | 3 | 2 | **B** | Rất hợp generated projections/docs/indexes nhưng reach hẹp; nên là policy chuyên biệt trong proof architecture. |
| 13 | **Semantic lanes + risk classifier/evidence ladder** | 2 | 4 | 4 | 2 | 5 | **B** | Tạo control plane tốt và chống “slow bucket” vô nghĩa; tự nó không giảm work nếu không kéo theo fixture/direct/compression policies. |
| 14 | **Distributed execution/content-addressed remote sandbox** | 4 wall / 0 CPU | 1 | 3 | 1 | 5 | **C** | Chạy lãng phí nhanh hơn và tăng hạ tầng. Chỉ hợp sau khi S/A tracks đã loại work dư thừa. |
| 15 | **Tiếp tục chẻ file/tăng concurrency mù quáng** | 1 | 1 | 3 | 5 âm tính | 3 | **Reject** | Repo đã đo chẻ mịn làm chậm hơn. Không thử lại nếu chưa đổi execution model. |

### 9.4 Quan sát lặp theo các mục tiêu khác nhau

#### Nếu mục tiêu là inner-loop nhanh nhất

1. Related selector + canary-first.
2. Same-SHA proof reuse nếu workflow thực sự lặp SHA.
3. Direct use-case tests.
4. Fast fixtures.
5. Scheduling.

Nhưng thứ tự này **không** phải thứ tự kiến trúc dài hạn: selector đứng đầu latency nhưng không trị suite phình.

#### Nếu mục tiêu là full suite giảm CPU/wall thật

1. Direct use-case extraction + parity compression.
2. Fixture elimination/DAG.
3. Model/property/pairwise compression.
4. Flake/determinism fixes.
5. Persistent workers/scheduler.
6. Distributed execution chỉ giảm wall.

#### Nếu mục tiêu là không phình trong tương lai

1. Proof registry/ownership + admission gate + budget.
2. Historical fault corpus và canonical state-machine/property runners.
3. Targeted mutation/proof graph để chứng minh redundancy.
4. Mutation-boundary policy/evidence ladder.
5. Fixture/process lints: subprocess phải khai boundary responsibility.
6. Test lifecycle/revalidation.

#### Nếu mục tiêu là triệt để nhưng an toàn

Kiến trúc đích nên là một vòng khép kín, không phải nhiều công cụ rời:

```text
Invariant/contract registry
  → admission policy cho test mới
  → direct canonical proofs + bounded boundary witnesses
  → selector/scheduler được sinh từ cùng registry
  → provenance ledger cho mỗi proof run
  → reuse chỉ khi identity/input còn nguyên
  → mutation/fault replay kiểm tra định kỳ registry có còn bắt lỗi
  → full suite authoritative fallback
```

Điểm then chốt: ownership manifest, selector, budget và proof registry không được trở thành bốn nguồn sự thật khác nhau. Một canonical proof registry phải sinh hoặc validate các projection kia.

### 9.5 Thứ tự triển khai khuyến nghị

#### Wave 0 — Instrument, không tối ưu mù

- Ghi gate-run identity để biết exact-SHA full suite đang bị chạy lặp bao nhiêu lần.
- Bổ sung per-test/file duration, subprocess/fixture/resource class và failure signature.
- Baseline lại sau các thay đổi hiện có; profile P02 là orientation vì code đã tiếp tục đổi.

**Exit:** có Pareto current-tree và biết proof repetition rate.

#### Wave 1 — Quick wins đã có bằng chứng

- Mở rộng fast fixtures cho 9 file/128 sites đã audit.
- Audit provider/network leaks và large-state folds tương tự P03/P04.
- Thêm lint chặn fixture-only `fgos init`/real provider mới.

**Exit:** giảm focused/full cost đo được và ngăn cùng anti-pattern mọc lại.

#### Wave 2 — Thay hình dạng test, bắt đầu tại CLI hotspot

- Extract narrow use cases cho stage/edit/read.
- Chuyển business matrix direct.
- Khóa CLI parity và giữ parser/env/cwd/envelope/Git witnesses.
- Không tạo global `runCli`.

**Exit:** giảm subprocess thực, không chỉ source lines; canonical proof mapping tồn tại cho cụm đầu.

#### Wave 3 — Canonical proof registry và admission gate

- Định nghĩa invariant IDs, canonical tests, boundary responsibilities, historical fault refs.
- Sinh ownership/selector projection từ registry.
- Test mới phải khai invariant/layer/boundary; subprocess cần lý do.
- Ban đầu warning-only, sau đó ratchet theo area đã migrate.

**Exit:** suite không thể phình lại âm thầm trong area đã onboard.

#### Wave 4 — Related selector ở shadow mode

- Chạy selector nhưng vẫn chạy full.
- Replay historical diffs và so related/full outcomes.
- Đo fallback, miss, selection ratio, overhead.
- Chỉ mở cho inner loop sau zero unresolved patch-related miss; DoD vẫn full.

**Exit:** feedback nhanh có evidence, không phải niềm tin.

#### Wave 5 — Proof reuse same-SHA

- Ledger ký bằng SHA + proof inputs + toolchain/environment class.
- Chỉ reuse immutable exact match.
- Audit mọi consumer gate và invalidation.

**Exit:** loại các full-suite rerun thật sự trùng; không mở cross-commit cache.

#### Wave 6 — Compression có bằng chứng

- Chọn một state machine/config matrix.
- Lập negative-space/proof graph, fault corpus và targeted mutation seeds.
- Thay manual matrix bằng model/property/pairwise runner.
- Xóa test chỉ khi required proof set và historical mutants vẫn được bắt.

**Exit:** test count/source/CPU giảm và anti-growth shape được chứng minh.

#### Wave 7 — Scheduler và advanced caching

- Fixed worker pool, longest-first, resource classes.
- Sau đó mới nghiên cứu dynamic trace/input-closure memoization observe-only.
- Distributed/cache xuyên máy là cuối cùng.

### 9.6 Ước lượng impact có kỷ luật

Không cộng thẳng các pilot savings vì chúng đo ở snapshot/load khác nhau. Tuy nhiên có thể đặt bound định tính:

- **High-confidence immediate:** fixture/provider/large-state elimination — đã có before/after lớn.
- **High-confidence structural:** direct use-case + parity — audit cho thấy hơn nửa CLI sites là fixture/business, nhưng chưa có full migration measurement.
- **High-potential uncertain:** related selection và proof reuse — có thể bỏ phần lớn thời gian người chờ, nhưng cần đo diff distribution và duplicate-gate rate.
- **Long-term anti-growth:** registry/admission/mutation-backed compression — impact runtime đến chậm nhưng là cách duy nhất tránh quay lại 10,000+ tests/subprocesses.
- **Optimization-only:** scheduler/distribution — không được tính là giải quyết redundancy.

### 9.7 Quyết định đề xuất từ đánh giá này

Nếu chỉ tài trợ một chương trình, không chọn riêng selector hay riêng cache. Chọn chương trình ba trục:

1. **Remove unnecessary work:** fixture elimination + direct use-case/parity.
2. **Run only necessary work:** conservative selector + canary scheduling.
3. **Prevent work from returning:** canonical proof registry + admission/budget + fault/mutation validation.

Proof provenance/reuse là trục thứ tư sau khi đo thấy duplicate gates đủ lớn. Đây là hình dạng vừa tối ưu tốc độ, vừa giảm test thật, vừa chống hệ thống phình trong tương lai.

## 10. Câu hỏi cần khóa trước implementation

- Gate nào hiện đang chạy lại đúng cùng SHA và environment class?
- Invariant taxonomy đặt ở đâu và ai sở hữu?
- Historical test timing/failure data có đủ sạch để làm scheduling/portfolio analysis chưa?
- Dynamic dependency nào có thể instrument an toàn trong Node, Rust và subprocess?
- Những boundary nào bắt buộc phải có real process/Git/Rust binary?
- Mức miss/fallback nào khiến related selector đáng dùng?
- Proof reuse được phép ở inner loop בלבד hay cả return/post-merge?
- Cơ chế nào chứng minh fixture snapshot tương đương production builder?

## 10. Kết luận brainstorm

Không có một “silver bullet”. Thiết kế hợp lý là một hệ nhiều lớp:

```text
proof inventory/ownership
  → conservative related selection
  → direct/cheap proofs first
  → boundary witnesses
  → provenance-aware reuse
  → full suite at authoritative gates
```

Đồng thời phải giảm cost gốc bằng fast fixtures, direct use-cases và proof compression. Selector chỉ giúp không chạy work không liên quan; proof reuse giúp không chạy lại work đã chứng minh; proof registry/model-based consolidation mới giúp xóa work dư thừa; scheduler/distribution chỉ giúp phần work còn cần thiết hoàn thành sớm hơn.
