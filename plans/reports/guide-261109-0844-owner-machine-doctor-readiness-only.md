# Hướng dẫn cho máy owner: doctor chỉ trả lời về độ sẵn sàng

Hướng dẫn này cho máy owner và máy thứ ba. fg-server2 tự land từng phase. Mỗi phase có một mục bên dưới, xếp theo số phase. Plan: [`plans/261106-1216-doctor-readiness-only/plan.md`](../261106-1216-doctor-readiness-only/plan.md). Mục theo thứ tự phase 01 đến 08, rồi phase 10 (tài liệu, số đo, đóng plan). Phase 09 thuộc lane WORK, chưa land (xem mục Phase 09). Dòng chung cho mọi phase: `git pull --rebase` (xem bước lưu khối AgentKit ngay dưới), build, stage, kích hoạt release như thường lệ, rồi `fgos doctor --json </dev/null`.

## Trước khi pull

`AGENTS.md` trên máy owner có khối AgentKit chưa commit. Phase 10 sửa mục "Install/setup/doctor gate" của `AGENTS.md`, nên pull sẽ xung đột nếu khối đó còn nằm trong working tree. Cách làm: lưu khối (`git diff AGENTS.md > ~/agents-md-agentkit.patch`), `git checkout -- AGENTS.md`, `git pull --rebase`, rồi áp lại (`git apply ~/agents-md-agentkit.patch`). Không commit khối đó. Kiểm tra `git status` sau cùng: chỉ còn khối AgentKit và `.claude/settings.json` là thay đổi cục bộ.

## Phase 01: doctor không ghi gì trong project chưa cài fgOS

Commit main: `26cac4ef4`. Báo cáo: [`lead-261106-1350-harden-doctor-p01-defects.md`](lead-261106-1350-harden-doctor-p01-defects.md).

### Đổi gì cho người dùng

- `fgos doctor` trong một repo Git chưa cài fgOS không còn tạo `.fgos/{logs,observe,locks}` và không còn mở child `events sync`. Child đó từng ghi lỗi bảo người dùng chạy `fgos setup` (đã deprecated).
- Dòng `executor-profile-warnings` báo `passed: true` kèm `warning:` (trước đây `passed: false` dù ghi là "informational").
- Fix của `no-stuck-merge-abort` bị xoá (nó không làm gì).
- Thông báo từ chối thư mục khoá của Event Store nay chỉ `fgos doctor --fix`.

### Sau khi kích hoạt

1. `cd $(mktemp -d) && git init -q && fgos doctor --json </dev/null >/dev/null; ls -a` không có `.fgos`.
2. Phase này không đổi số dòng: source có 146 dòng (release cũ hơn có 147 vì còn `shadow-binder-divergence`).

### Quay lại

Revert commit, kích hoạt lại release trước. Không đổi định dạng trên đĩa.

## Phase 02: 12 dòng chết hoặc trùng bị xoá

Commit main: `ff6947580`. Báo cáo: [`lead-261106-1434-harden-doctor-p02-dead-rows.md`](lead-261106-1434-harden-doctor-p02-dead-rows.md).

### Đổi gì cho người dùng

- Mười hai dòng doctor bị xoá vì điều kiện của chúng đã có chủ khác: `dependencies-installed`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged`, `command-routes-drift`, `tier-vocabulary-dead-keys`, `coordination-protocol-dead-vocabulary`, `coordination-protocol-fixtures-valid`, `coordination-example-requests-valid`, `operation-capability-resolves`, `identity-pinned-machines`, `event-store-refspec`, `event-store-native-addon`.
- `git-repository-config` nay cũng báo lỗi refspec xuất bản không an toàn, thiếu nguồn gốc của mapping và remote đã đổi từ lúc setup. `git-component-compatible` nay cũng kiểm các export của Event Store trong addon.
- Khoá cấu hình đã bị bỏ qua nay do `config-unknown-key` nêu tên (mức cảnh báo, không còn là lỗi). Xem pin của máy khác bằng `fgos identity pins`.

### Sau khi kích hoạt

`fgos doctor --json` trả 134 dòng; không còn mười hai id trên. `git-repository-config` và `git-component-compatible` đạt.

### Quay lại

Revert merge, kích hoạt lại release trước. Không đổi định dạng trên đĩa.

## Phase 03: chín dòng về file của repo fgOS chuyển sang npm test

Commit main: `35d7745d1`. Báo cáo: [`lead-261108-0820-doctor-p03-repo-rows-to-tests.md`](lead-261108-0820-doctor-p03-repo-rows-to-tests.md).

### Đổi gì cho người dùng

- Chín dòng và ba fix của chúng rời doctor: `enduser-docs-index-stale`, `decision-index-stale`, `instruction-projections-stale`, `git-mutation-one-door`, `identity-ids-unique`, `readme-install-tag-exists`, `convention-conformance`, `changelog-unreleased-stale`, `observe-run-coverage`. Mỗi phán đoán nay có đúng một chỗ chứng minh trong `npm test` hoặc script release (`test/scripts/doc-health.test.mjs`, `test/setup/instruction-projections.test.mjs`, `test/setup/git-mutation-census.test.mjs`, `test/scripts/convention-conformance.test.mjs`, `scripts/prepare-release.mjs`).
- Doctor nhanh hơn khoảng 21 giây trên fg-server2 (dòng chỉ mục tài liệu một mình tốn 19,7 giây).
- Project của người dùng làm mới chỉ mục bằng `fgos docs-index` và `fgos decision-index`; doctor không còn tự sinh lại. Chiếu instruction được sinh bởi `npm run build:skills`.

### Sau khi kích hoạt

`fgos doctor --json` trả 125 dòng. Không còn chín id trên.

### Quay lại

Revert merge, kích hoạt lại release trước. Không đổi định dạng trên đĩa.

## Phase 04: `fgos git status` và `fgos git recover`

Commit main: `4430edde8`. Báo cáo: [`lead-261108-0924-doctor-p04-git-status-recover.md`](lead-261108-0924-doctor-p04-git-status-recover.md).

### Đổi gì cho người dùng

- Động từ mới `fgos git status` (chỉ đọc: journal, thao tác đang chờ, Land được giữ lại, worktree, khoá native, merge dở) và `fgos git recover` (xử lý nốt thao tác Land bị ngắt). Hai lệnh có `--json` và `--dir`.
- `fgos init` tự recover Land bị ngắt ở bước cuối, an toàn khi lỗi (cảnh báo, không dừng init). Lý do chọn `fgos init` thay vì thêm bước vào đuôi `fgctl`: `fgctl` không tự cập nhật, bản cũ sẽ không chạy bước mới.
- Thông báo của `merge` và `approve` nay chỉ `fgos git recover` thay vì `doctor --fix`.

### Sau khi kích hoạt

1. `fgos git status --json </dev/null`: `journal.initialized` đúng, `pendingOperations` rỗng khi không có gì dở.
2. `fgos git recover --json </dev/null`: `recovered: []`, `kept: []`.
3. Phase này chưa đổi dòng doctor. Giữ release này trước khi kích hoạt phase 06 (thứ tự bắt buộc: cửa Git phải có trước khi `git-land-recovery` rời `--fix`).

### Quay lại

Phase 04 chỉ revert được sau khi đã revert phase 06. Revert merge, kích hoạt lại release trước.

## Phase 05: dòng tri thức chuyển sang các lệnh knowledge

Commit main: `a16fce064`. Báo cáo: [`lead-261108-1023-doctor-p05-knowledge-rows.md`](lead-261108-1023-doctor-p05-knowledge-rows.md).

### Đổi gì cho người dùng

- Mười dòng tri thức (`doc-registry-stale`, `doc-alias-broken`, `doc-active-duplicate`, `doc-current-path-missing`, `doc-source-unreachable`, `doc-near-duplicate`, `doc-provisional-aged`, `doc-topic-oversized`, `doc-role-underused`, `doc-source-conservation`) và fix `doc-registry-stale` rời doctor.
- `fgos knowledge status` thêm `findings` (chín lint, mỗi lint có mức `fail` hay `warn`); `fgos doc-registry --check` báo projection cũ mà không ghi (exit 4 khi cũ hoặc thiếu).
- Mất khả năng thấy `doc-current-path-missing` trong doctor: owner đã chấp nhận ("chỉ kiểm cái checkout có"); nay xem bằng `fgos knowledge status`.

### Sau khi kích hoạt

1. `fgos doctor --json` trả 115 dòng.
2. `fgos knowledge status --json </dev/null` có khoá `findings`.
3. `fgos doc-registry --check </dev/null` exit 0 khi projection mới.

### Quay lại

Revert merge, kích hoạt lại release trước. Không đổi định dạng trên đĩa.

## Phase 06: Git rời doctor, còn một dòng chỉ đường

Commit main: `b5b1d4ca4`. Báo cáo: [`lead-261108-1110-doctor-p06-git-doctor-cut.md`](lead-261108-1110-doctor-p06-git-doctor-cut.md). Cần phase 04 đã kích hoạt.

### Đổi gì cho người dùng

- Bỏ `git-worktree-recovery`, `git-native-locks`, `no-stuck-merge-abort` và fix `git-land-recovery`. `git-operation-journal` chỉ phán độ sẵn sàng (hàng rào, WAL đã khởi tạo, danh sách đủ, không lỗi WAL).
- Thêm `git-incidents`: dòng chỉ đường chỉ đọc, luôn `passed: true`, đếm thao tác Git đang chờ, khoá native và merge dở, rồi trỏ tới `fgos git status` và `fgos git recover`; thêm cảnh báo khi chuỗi đã xong chất đống.
- `fgos doctor --fix` không còn recover Land.

### Sau khi kích hoạt

`fgos doctor --json` trả 113 dòng; có `git-incidents`, không có ba dòng cũ. `fgos git status --json </dev/null` để xem chi tiết.

### Quay lại

Revert riêng phase 06 trả `git-land-recovery` về `--fix` (cửa của phase 04 vẫn còn, cả hai đường cùng recover).

## Phase 07: mỗi thành phần một dòng chỉ đường

Commit main: `c2631fb79` (cùng hai sửa `9d39cb1df` và `32d75317f`). Báo cáo: [`lead-261108-1208-doctor-p07-component-pointer-rows.md`](lead-261108-1208-doctor-p07-component-pointer-rows.md).

### Đổi gì cho người dùng

- Event Store: `event-store-unsealed`, `event-store-integrity`, `event-store-sync` thành một dòng `event-store-incidents` (đếm, rồi trỏ `fgos events status`). Dòng này vẫn **fail** khi có lỗi toàn vẹn, mirror ngang hàng bị bỏ qua và cảnh báo sync.
- `lock-holders` là dòng chỉ đường không quét (quét tốn khoảng 950 ms, quá trần 250 ms): in "run `fgos lock-status`"; hai phán đoán còn thiếu nay nằm trong `fgos lock-status` (`problems`).
- `run-attempts-stuck` là dòng chỉ đường (cảnh báo, không fail, không fix): lần `fgos run` kế tiếp tự adopt các attempt dở và dọn socket mồ côi; hoặc `fgos dispatch recover`. `doctor --fix` không còn adopt.
- `terminal-allocations` đếm slot kẹt và trỏ `fgos dispatch inspect --terminal` (liệt kê từng slot).
- `mailbox-hook` vẫn **fail** khi bản ghi mailbox không đọc được hoặc không tin được; trỏ `fgos mailbox status`.
- `doctor --strict` vì vậy không còn fail vì attempt kẹt; các dòng sẵn sàng vẫn làm nó fail.

### Sau khi kích hoạt

1. `fgos doctor --json` trả 111 dòng; có `event-store-incidents`, không có ba id Event Store cũ.
2. `fgos lock-status --json </dev/null` có khoá `problems`; `fgos dispatch inspect --terminal </dev/null` liệt kê slot.

### Quay lại

Revert merge, kích hoạt lại release trước. Release cũ sẽ lại có fix adopt trong `doctor --fix`. Không đổi định dạng trên đĩa.

## Phase 08: định nghĩa đóng gói do npm test phán

Commit main: `35c281e73`. Báo cáo: [`lead-261109-0730-doctor-p08-packaged-definitions.md`](lead-261109-0730-doctor-p08-packaged-definitions.md).

### Đổi gì cho người dùng

- Hai dòng doctor bị xoá: `task-specs-resolve` và `domain-workflow-operations-coverage`. Chúng chỉ đọc domain đóng gói trong release, nay là case của `npm test` (`test/setup/packaged-definitions.test.mjs`).
- Bốn dòng chỉ phán tầng do dự án cấp: `agent-claims-resolve`, `domain-registry-compiled` (bỏ qua chính thư mục nguồn release), `agent-type-names-unique` (bỏ qua tầng đọc từ trong release), `operation-prompt-templates-valid` (chỉ `.fgos/prompt-templates`).
- Dự án thường không có `domains/` hay `core/` riêng thì các dòng này pass, không còn phán release thay dự án.

### Sau khi kích hoạt

1. Build, stage, activate release từ main `35c281e73` hoặc mới hơn.
2. `fgos doctor --json` trả 109 dòng; không còn hai id trên.
3. Trong checkout fgOS chạy bằng dev host, các dòng `agent-claims-resolve` và `domain-registry-compiled` in "this directory is the release source; npm test judges ...". Release đã kích hoạt chạy trong checkout coi cây đó là tầng dự án nên vẫn phán.

### Quay lại

Revert merge, kích hoạt lại release trước. Không đổi định dạng trên đĩa.

## Phase 09: phần còn lại của WORK (chưa land)

Phase này thuộc lane WORK, không phải HARDEN. Phần Workflow đã xong trong T6 (bản sửa binding case): repair chạy trên đường bình thường của Workflow và `fgos workflow status` in `bindingsJudgment`. Còn lại cho WORK:

- Sáu dòng Work còn trong doctor: `work-classification-vocabulary`, `work-step-vocabulary`, `work-recorded-conflicts`, `root-drift`, `leaf-notify-drift`, `delivered-not-on-trunk`. Mỗi dòng cần một lệnh đọc của Work trả lời cùng phán đoán, rồi xoá khỏi doctor cùng đợt; sau đó HARDEN thêm dòng chỉ đường `work-incidents`. `delivered-not-on-trunk` một mình tốn 5 đến 7 giây mỗi lần doctor.
- `workflow-case-bindings` vẫn **fail** khi có bản ghi binding lệch ledger; chuyển sang dạng dòng chỉ đường (cảnh báo, trỏ `fgos workflow status`) sau khi WORK xong.
- Khi hai việc trên land, mục tiêu doctor tối đa 12 giây mới đo lại được (cùng việc cắt dòng ghế của T5).

Không có bước nào cho máy owner ở phase này cho tới khi WORK land.

## Phase 10: tài liệu, số đo, đóng plan

Commit main: xem dòng bảng chương trình `HARDEN: doctor P10 lands`. Báo cáo đóng plan: [`lead-261109-0855-doctor-p10-docs-gate-measure-close.md`](lead-261109-0855-doctor-p10-docs-gate-measure-close.md) (bảng mọi dòng của audit và số đo).

### Đổi gì cho người dùng

- Chỉ tài liệu và một dòng backlog: mục "Install/setup/doctor gate" của `AGENTS.md` viết lại cho các lệnh hiện có (khoá cấu hình vào `core/config-standard` và `core/config-schema`; phụ thuộc runtime mới cần một dòng readiness; tình trạng sự cố mới phải đọc và sửa được qua lệnh của chính thành phần, doctor chỉ có thể có một dòng chỉ đường; luật về file của repo fgOS vào `npm test`, CI, pre-commit hay kiểm tra release). Spec packaging-distribution có luật RUL109 và đoạn lịch sử quyết định; hợp đồng `setup-doctor-registry.md` có mục "Pointer rows" và bảng chứng minh nằm ngoài doctor.
- Dọn hai dấu vết của dòng `dependencies-installed` đã xoá từ phase 02 (một mục baseline, một đoạn trong bài knowledge về npm dependency).
- Một dòng backlog `p-bkmh4egqlv`: gỡ dòng `shell-integration-sourced` khi cửa sổ tương thích của `fgos setup` đóng.

### Lệnh trên từng workspace

1. `git pull --rebase` (lưu và áp lại khối AgentKit của `AGENTS.md` theo mục "Trước khi pull").
2. Build, stage, kích hoạt release từ main này hoặc mới hơn (phase 08 chỉ có trong release từ `35c281e73`).
3. `fgos doctor --json </dev/null`: 109 dòng; cách đếm: `fgos doctor --json </dev/null | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["data"]["checks"]))'`.
4. Xem từng cửa mới thay doctor: `fgos git status`, `fgos knowledge status`, `fgos lock-status`, `fgos dispatch inspect --terminal`, `fgos events status`, `fgos mailbox status`.

### Dòng doctor mong đợi

- Dòng chỉ đường (luôn đạt, tin nhắn bắt đầu bằng `warning:` khi có việc): `git-incidents`, `lock-holders`, `run-attempts-stuck`, `terminal-allocations`.
- Hai dòng chỉ đường vẫn có thể **fail** theo quyết định của owner: `event-store-incidents` (lỗi toàn vẹn, mirror bị bỏ qua, cảnh báo sync) và `mailbox-hook` (bản ghi mailbox không đọc được hoặc không tin được).
- Máy owner hiện đỏ hai dòng cũ: `tool-registry-configured`, `work-step-vocabulary`. Cả hai có từ trước các phase này.

### Quay lại

Revert commit tài liệu; không có thay đổi mã hay định dạng trên đĩa.
