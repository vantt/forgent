# Nghiên cứu: kế hoạch hợp nhất thẩm quyền tài liệu 260925 có component gom nhóm, khử trùng như canonical-decision-projection không

Nghiên cứu lúc 2026-10-21 17:13 (Asia/Saigon), chỉ đọc. Checkout chính `main` = `origin/main` = `10c412c90`. Đầu nhánh plan tôi thấy: `origin/plan/260925-documentation-authority-unification` = **`168a27c6c`** (2026-10-13 19:19 +07). GitHub API (`gh api .../branches/...`) cũng trả `168a27c6c`, nên đầu thật trong board (`763568157` ở `log.md:80`, `97c9694a4` ở `plan.md:52` của board) chưa được push ở đâu cả; `git cat-file -t 763568157` báo không có object. Nhánh này **không** là tổ tiên của main (chưa merge).

Quy ước trích dẫn:
- `PR:n` = `docs/platform/proposals/documentation-system-unification.md` (1129 dòng, main).
- `PM:n` = `plans/260925-documentation-authority-unification/plan.md` trên main (704 dòng, bản cũ).
- `BR:<path>:n` = file trên `origin/plan/260925-...` ở `168a27c6c`. Với `plan.md` của nhánh (580 dòng, viết lại 2026-09-29/10-06) tôi ghi `BP:n`. Bản main (`PM`) đã cũ hơn bản nhánh; phần dưới dùng `BP` khi hai bản khác nhau.
- `board:` = `plans/261017-1313-fgos-platform-program-board/`.

## 1. Kết luận

1. **Có, nhưng chia hai loại.** Trong kế hoạch (H1, phase 1–10) có cả một bộ cơ chế khử trùng và giữ một chủ cho một claim, nhưng nó là **bộ công cụ di trú dùng một lần** cho corpus tài liệu nền tảng (ledger claim, cổng bảo toàn, ratchet, alias, retirement check), chạy bằng script ở `scripts/`, **không phải component runtime**. Các component runtime kiểu "registry claim", "Effective Decision Reducer", "Agent Context Engine" chỉ có trong proposal (H2/H3) và bị **cố ý hoãn** (`PM:99`, `PM:106-122`, `BP:122-138`, ledger PF-I006/PF-I007/PF-I017).
2. **Chưa có mã nào land trên main.** Toàn bộ script di trú (`check-doc-*`, `generate-doc-inventory`, `doc-alias-resolver`, `check-legacy-docs-ratchet`...) chỉ có trên nhánh `168a27c6c` (`ls scripts` trên main không có file nào). Phần H2/H3 thì chưa có mã cả trên nhánh: `rg` không thấy reducer, claim registry hay `fgos doc check|new|classify|inventory` (`bin/fgos.mjs:1558-1561` trên main và `BR:bin/fgos.mjs:1411` đều chỉ có tám verb vòng đời `reserve…retire`).
3. **Quan hệ với tsk-1lv: bổ sung, ít chồng, không thay.** Kế hoạch 260925 không nhắc `--relation`, `authoritative_for`, `doc-near-duplicate`, bốn cửa retrospective (không có hit nào trong `plan.md`, phase file, constitution, ledger). Nó chạm tsk-1lv ở ba chỗ: giữ `docs/decisions/index.md` làm bản chiếu sinh ra, dời chỗ ở của narrative "Lịch sử quyết định" sang `docs/platform/<area>/decisions/`, và sửa các người đọc đường dẫn cũ (help của `decision --scope`, `check-decision-citation-drift`, test `decisions-corpus-retired`).
4. **"Tập quyết định đang hiệu lực" không do plan nào tính.** Proposal giao nó cho *Effective Decision Reducer* trong Agent Context Engine (`PR:708`, `PR:1098`); plan nói thẳng là không làm (`PM:111`); không có mã. tsk-1lv cũng chưa tính nó.
5. **Giao luật tới agent (Agent Context Engine) chưa có chủ làm.** Có chủ *thẩm quyền* (RUL102, `docs/specs/distribution.md:362`; PF-I007 `deferred-preserved`) nhưng không có phase nào, plan còn cấm phase 10 "lan sang" nó (`BR:phase-10:43-44`). Về thứ tự với cutover: board đã chốt ghi luật vào `AGENTS.md`/`CLAUDE.md`/`platform-foundations` chỉ land **sau** Phase 9 (`board/log.md:12`); đề xuất "land lát đầu của engine xen kẽ trước Phase 9" của lane RULE **chưa được owner duyệt** (`handoff-261021-1446:34,38`).

## 2. Bảng component và cơ chế (việc A và B)

Trạng thái "mã": **BR** = có trên nhánh `168a27c6c`, chưa land main; **main** = có trên main; **không** = không thấy mã (kiểm bằng `rg`/`ls`). Chủ sở hữu: tài liệu không có cột chủ riêng; "lead DOC" là phiên `forgentx-5f` (board `plan.md:52`, `log.md:80,81`), "owner" là người duyệt.

### 2.1. Cơ chế di trú trong phase của plan (H1)

| # | Tên và việc | Chủ | Phase (đánh số mới) | Vị trí | Trạng thái thực tế | So với tsk-1lv |
|---|---|---|---|---|---|---|
| 1 | **Switchboard**: một tuyến đọc cho từng area, thay việc đoán giữa legacy và target (`docs/transitional-switchboard.md` + `transitional-switchboard.json`) | lead DOC | 2 (xong), thêm route ở 6 | `BP:113` (quyết định 5 của §3), `BR:phase-02:30-31`; `PM:267-293` | **BR**: có (`BR:docs/transitional-switchboard.md` 119 dòng); **main**: không có. Chưa land vì Decision F hoãn (`BP:361`) | ĐỘC LẬP (điều hướng tài liệu, không đụng decision) |
| 2 | **Legacy-docs ratchet**: chặn file mới và sửa chưa ghi sổ dưới `docs/specs`, `docs/architect` | lead DOC | 2 (xong) | `BR:phase-02:34-35`; roots giữ nguyên `BP:370` | **BR**: `scripts/check-legacy-docs-ratchet.mjs` (745 dòng). Land sớm lên main đã bị owner hoãn (`BP:361`) | ĐỘC LẬP. Cùng ý "chặn lúc ghi" nhưng cho file, không cho quyết định |
| 3 | **Ledger claim và cổng bảo toàn**: mỗi đơn vị nguồn có id claim mờ, đúng một chủ đích (`targetOwner`), cổng `semantic-claim-multiple-owners`, `identical-units-multiple-owners`, `row-set-conserved` | lead DOC; reviewer tách khỏi tác giả | 3 (xong), 4 (đóng băng), 6 (đang chạy) | `PM:185-211`, `BP:201-228`; `BR:minimum-constitution.json` `retirementGate` | **BR**: `scripts/generate-doc-inventory.mjs` (1973 dòng, `semanticClaimId` ở `:1733`), `check-doc-inventory-gates.mjs` (1474 dòng, `:940`). **Không** có trên main | ĐỘC LẬP về corpus, CHỒNG MỘT PHẦN về mục đích (xem 3.2). `semanticClaimId` = băm blob nên chỉ bắt trùng **byte-y-hệt**, không bắt trùng ngữ nghĩa |
| 4 | **Hiến pháp tối thiểu** (loại tài liệu, nơi đặt, `authorityConflict`, cổng promote và retire) + `check-doc-constitution.mjs` | owner đóng băng 2026-10-06 | 4 (xong) | `BP:367-368`; `BR:minimum-constitution.json` | **BR** có. Bản rút gọn của `docs/doc-types.yaml` trong proposal (`PR:340-362`), phần còn lại ghi `deferredToEngine` | ĐỘC LẬP. Quy tắc `newer-decision-supersedes` là quy tắc giải xung đột lúc di trú, **không** tính tập hiệu lực |
| 5 | **Bảng alias + resolver** cho đường dẫn lịch sử bất biến | lead DOC | 4 (resolver xong), 6 (bản nháp), 9 (kích hoạt) | `PM:101`, `BR:alias-table-and-resolver-contract.md`; `BR:phase-06:134` ("alias-table.json rỗng tới Phase 9") | **BR**: `scripts/doc-alias-resolver.mjs`. Bảng thật còn rỗng | BỔ SUNG: giải đường dẫn `docs/specs/...` trong log bất biến (kể cả log decision) |
| 6 | **Sổ claim bị rơi** (`dropped-claims-register.json`, 17 mục) chặn Phase 9 | lead DOC | 4, 6, 9 | `BP:309-318`, `BR:phase-06:47,361` | **BR** có dữ liệu và cổng | ĐỘC LẬP |
| 7 | **Đóng nhóm trùng và xung đột** (`ledger/conflict-resolutions.json`, 818 nhóm trùng, 151 nhóm xung đột ngữ nghĩa) | lead DOC + owner cho ca thật | 6 | `BR:phase-06:283,360`; số liệu `BR:phase-06:138` | **BR** (công cụ T4); chưa đóng hết | CHỒNG MỘT PHẦN về mục đích với `authoritative-match --check-duplicates` (3.2) |
| 8 | **Kiểm tra trạng thái candidate** + **retirement check** (15 kiểm, hiện 15 bị chặn) | lead DOC | 4 (xong), chạy lại 6/8/9 | `BR:phase-04:89,102` | **BR**: `check-doc-candidate-status.mjs`, `check-doc-retirement.mjs` | ĐỘC LẬP |
| 9 | **Manifest viết lại consumer** (digest-bound theo blob của file người đọc) + công cụ `consumer-rewrites` | lead DOC | 8 | bản **nháp** `BR:reports/phase-07-08-prep/phase-08-draft.md:98-110,118,144`; bản thật theo board là Bước 3: 1.037 file/9.424 cạnh, Bước 4: 33 batch/275 bản ghi/331 file/890 slot (`board/log.md:80,81`) | **Không** thấy: `scripts/consumer-rewrites.mjs` không có ở `168a27c6c`. Bản thật nằm ở đầu nhánh tôi không đọc được | BỔ SUNG: sẽ sửa các người đọc của tsk-1lv (3.3) |
| 10 | **Verifier chuyển payload bằng chứng** (`check-evidence-relocation.mjs`, manifest digest) | lead DOC | 8 | `BR:evidence-payload-relocation-policy.md`; `BR:phase-09:36-38` | **Không**: chỉ có policy; retirement check ghi `evidence-digests` là `planned` (`BR:minimum-constitution.json` `retirementGate`) | ĐỘC LẬP |
| 11 | **Cutover write lease** (khoá ghi tài liệu trong lúc cutover) | lead DOC (+ lane Git nếu đổi cửa) | thiết kế ở 4, xây ở 8 Bước 6b | `BR:cutover-write-lease-design.md:21,31,56-58,153`; `board/log.md:151` | **Không có mã** ở `168a27c6c`. Board nói sẽ là lớp mỏng trên holder-lock, không thêm guard ref thứ hai (không đọc được bản thật) | ĐỘC LẬP; liên quan va chạm ở mục E |
| 12 | **Sổ claim niêm phong** ở `docs/platform/history/documentation-authority-unification/`, nguồn nhập cho H2 | lead DOC | 6 (dry-run), 9 (niêm phong) | `BR:phase-06:345`, `BP:473` mục rủi ro | **BR**: chưa có thư mục đích trên main | BỔ SUNG: là hạt giống của "Claim and Decision Registry" (H2) |
| 13 | **Bộ bảo trì sau cutover**: `fgos doc classify|new|check|inventory|retirement-check`, kiểm gồm "duplicate owner", "reintroduced legacy roots", "unaccounted claim lineage" | chưa có chủ (follow-on) | 10, chưa authorize | `BR:phase-10:22-41`, `PM:520-547`, `PR:444-479` | **Không**: `bin/fgos.mjs` chỉ có tám verb vòng đời; `fgos convention classify|check` (Plan B) có trên main nhưng là đặt tên và nơi đặt, không phải claim | CHỒNG MỘT PHẦN tiềm tàng: kiểm "duplicate owner" của phase 10 chưa nói có dùng lại `findDuplicateAuthoritativeClaims` hay không (`BR:phase-10:16` chỉ nhắc dùng lại Plan B) |

### 2.2. Component runtime trong proposal (H2, H3), nằm ngoài phase của plan

| # | Tên và việc | Chủ | Phase | Vị trí | Mã | So với tsk-1lv |
|---|---|---|---|---|---|---|
| 14 | **Documentation Governance Model** (`docs/doc-types.yaml`, từ vựng, cardinality) | thành phần của Knowledge and Documentation Engine | H2, sau cutover | `PR:340-362`, `PR:670`; PF-I011 | Không (hiến pháp #4 là bản rút gọn) | ĐỘC LẬP |
| 15 | **Documentation Registry** tổng quát hoá theo profile, từ registry hiện có | cùng engine | H2 | `PR:364-404`, `PR:671`; PF-I006 | Có sẵn bản hẹp: `src/state/knowledge-registry.mjs`, check `doc-*` ở `src/setup/registrations.mjs:4236-4246` (landed, tiền kế hoạch). Chưa tổng quát hoá | ĐỘC LẬP; cùng gia đình sự kiện nhưng khác loại sự kiện |
| 16 | **Claim and Decision Registry**: id claim, supersession đầy đủ và một phần, trạng thái hiệu lực/không | cùng engine | H2 | `PR:672`, `PR:1085-1086`; PF-I017 (`BR:docs/platform/intent-preservation-ledger.md:81`) | **Không** | **CHỒNG** với tsk-1lv ở phần decision: tsk-1lv đã có kho `state.decisions` + `relation`. Proposal gọi đây là việc của engine nhưng **không nhắc** kho đó (không có hit `relation`/`tsk-1lv` trong `PR`) |
| 17 | **Documentation Graph** (cạnh có kiểu: owns, supersedes, evidencedBy…) | cùng engine | H2 | `PR:673`, `PR:614-616`; PF-I013 | Không | ĐỘC LẬP |
| 18 | **Knowledge Contribution Intake**: kiểm, khử trùng, phân loại, định tuyến đề xuất trước khi đổi chủ canonical | cùng engine | H2 | `PR:723`, `PR:797-804` | Không | **CHỒNG** với `authoritative_for` + skeleton-match (tsk-1lv-6, "tìm trước khi tạo") và với bốn cửa retrospective (tsk-1lv-5). Proposal định **thay** chúng về sau (mục 3.4) |
| 19 | **Instruction Composer** | Agent Context Engine | H3 | `PR:707`, RUL102 (`docs/specs/distribution.md:362`) | Hạt giống trên main: `src/setup/instruction-registry.mjs`, `instruction-composition.mjs`, `instruction-projections.mjs` | ĐỘC LẬP |
| 20 | **Effective Decision Reducer** (kết luận hiệu lực từng phạm vi, kèm con trỏ chuỗi quyết định) | Agent Context Engine | H3 bước 1 | `PR:529-541`, `PR:708`, `PR:1098`, câu mở `PR:1052` | **Không** (`rg` không thấy reducer trong `src bin scripts packages apps`) | **BỔ SUNG**: là lớp đọc trên `state.decisions` mà tsk-1lv đã ghi (3.5) |
| 21 | **Reading Plan Compiler**, **Context Budgeter**, **Context Explainability**, `fgos doc context` | Agent Context Engine | H3 | `PR:564-639`, `PR:709-711` | Không | ĐỘC LẬP |
| 22 | **Retire component Learning/Retrospective**, tách thành trigger + workflow bề mặt + intake; `fgos-coding-knowledge` chỉ là adapter tạm | engine + Work | không nằm trong phase nào của plan | `PR:733-752`, `PR:934-952` | Không. Ledger không có hàng nào nói việc này (0 hit "retrospective" ở `BR:docs/platform/intent-preservation-ledger.md`) | **CHỒNG và định THAY**: bốn cửa của tsk-1lv-5 đang nằm **trong** lần gọi `retrospective` mà proposal muốn gỡ |
| 23 | **Intent-preservation ledger** (PF-I###) giữ ý định bị hoãn | lead DOC, owner duyệt | 1, thêm PF-I011–021 ở 4 | `BR:docs/platform/intent-preservation-ledger.md:70-85`; main `:71` | **main** có (đã land) | BỔ SUNG: PF-I007 gọi chính `docs/decisions/index.md` là hạt giống |

### 2.3. Phần tsk-1lv đã có trên main, để đối chiếu

`fgos decision --relation none|supersedes:<id>|touches:<id>` (`bin/fgos.mjs:1998`, regex chặn `src/state/store.mjs:1838`); `docs/decisions/index.md` sinh từ state (`src/report/decision-index.mjs:40`, doctor `decision-index-stale` ở `src/setup/registrations.mjs:3785-3794`); `authoritative-match` (`src/cli/command-registry.mjs:1754`, `src/report/authoritative-match.mjs:84`) và doctor `doc-near-duplicate` (`registrations.mjs:4036-4054`, `:4242`); corpus `docs/decisions/*.md` đã retire (`ls docs/decisions` chỉ còn `index.md`). Phần còn lại tôi không kiểm lại; theo `plans/reports/research-261021-1643-canonical-decision-projection-component.md`.

## 3. Đối chiếu với canonical-decision-projection

### 3.1. Plan có ý định thay hay hấp thụ tsk-1lv không

- **Không thay, không hấp thụ ở phase 1–10.** Không có phase nào nhắm `--relation`, `state.decisions`, hay `authoritative_for`.
- **Dời chỗ ở của narrative (tsk-1lv-4).** Phần "Lịch sử quyết định" trong `docs/specs/<area>.md` được tách thành tài liệu `decisions/` của area. Bằng chứng: Pilot B đặt `docs/specs/work-state.md#lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4` thành `docs/platform/work-state/decisions/retired-decision-history.md` (`BR:reports/phase-05/pilot-b-target-map.md:456`), và bản đồ runner có dòng tương tự (`BR:ledger/area-map-runner.md:50`). Khi Phase 9 xoá `docs/specs/**` (`BR:phase-09:34`), nơi narrative sống của tsk-1lv-4 đổi hẳn.
- **Giữ bản chiếu index.** `docs/decisions/index.md` được ghi `regenerate-from-source`, không phải root bị retire (owner N1: `BR:phase-06:71,102,154`; `BR:ledger/decisions/s2-generated-projections.json` nhưng trạng thái `pending`, chưa reviewed). Bản nháp Phase 7 còn dùng `decision-index --check` làm cổng đồng nhất (`BR:phase-07-draft.md:113`) và hỏi Q7-2 giữ "area `decisions/` + index sinh ra" (`:72`).
- **Phát hiện nhỏ:** trong `docs/decisions/index.md`, cột Scope là slug area (`runner`, `work-state`...; 24/13/10/3/2/1 dòng), **không** là đường dẫn, nên alias đường dẫn không đụng vào bảng đó. Tuy vậy mô tả code `store.mjs:1788-1790` nói scope có thể "khớp `docs/specs/<area>.md`", và help của `decision --scope` đang nêu `docs/specs/<area>.md` (`BR:consumer-survey.md:102`, trỏ `src/cli/command-registry.mjs:473`) nên sẽ nằm trong bản vá Phase 9.

### 3.2. Trùng hay chồng ở khử trùng claim

| Cơ chế plan | Cơ chế tsk-1lv | Phán quyết |
|---|---|---|
| Cổng một-chủ-cho-claim (`semanticClaimId`, băm blob byte-y-hệt; `BR:generate-doc-inventory.mjs:1733`, `check-doc-inventory-gates.mjs:940`) | `findDuplicateAuthoritativeClaims` so skeleton trên `authoritative_for` (`authoritative-match.mjs:84`) | **Khác corpus, cùng mục đích.** `authoritative_for` có ở 136 file `docs/explanation`, 4 `docs/how-to` và nhiều file `docs/knowledge` (đếm bằng `rg -l '^authoritative_for'`), **không** có ở `docs/platform`. Tài liệu nền tảng dùng ô `Canonical for` trong khối đầu (79 file `docs/platform` có dòng `Canonical for`). Hai máy không dùng chung mã hay trường |
| Bản nháp Phase 7: helper `cross-area-claims.mjs`, "mỗi giá trị `Canonical for` do ≥2 tài liệu nhận, khớp chính xác và chồng token ≥0.6" (`BR:phase-07-draft.md:107`) | cùng bài toán ("hai tài liệu nhận cùng chủ đề") | **CHỒNG MỘT PHẦN.** Helper nằm dưới `reports/phase-07/helpers/`, một lần, cố ý không vào `scripts/` (`:38`). Hai cách đo trùng ra đời độc lập, không port chung |
| Phase 10 "duplicate owner" | `doc-near-duplicate` (doctor) | **Chưa rõ.** Plan chưa nói dùng lại hay viết mới (F) |

### 3.3. Phase 8 sửa người đọc của tsk-1lv

Khảo sát consumer (`BR:consumer-survey.md`, mốc `57f3e7fe7`, trước Phase 6, chỉ là nháp): `test/docs/decisions-corpus-retired.test.mjs` khẳng định narrative đã retire nằm ở các mục "Lịch sử quyết định" của `docs/specs/<area>.md` (`:99`, sẽ hỏng); `scripts/check-decision-citation-drift.mjs:428` mặc định quét `docs/specs` (`:101`); `test/state/decision-relation.test.mjs` tạo `docs/specs/...` trong repo tạm (miễn, `:106`). Đây là việc **sửa người đọc**, không thay cơ chế.

### 3.4. Retrospective và `authoritative_for`: proposal muốn thay, plan chưa làm

`PR:733-752` và `PR:934-952` nói gỡ component Learning/Retrospective, chuyển intake/promotion sang engine, giữ `fgos-coding-knowledge` làm adapter tạm. Nếu làm, các cửa của tsk-1lv-5 và quy tắc "tìm trước khi tạo" của tsk-1lv-6 phải chuyển sang Knowledge Contribution Intake. Proposal dùng tên skill `fgos-coding-knowledge`; bản review đầu đã ghi skill `fgos-coding-compounding` mà `docs/specs/reading-map.md` còn nhắc "không còn tồn tại" (`independent-frontier-review-2026-09-25.md:123`). Tôi không đối chiếu tên với tree hiện tại.

### 3.5. Reducer so với `state.decisions`

Proposal §4.6 nói thẳng "decision index là lịch sử theo thời gian, vẫn hiển thị quyết định đã bị thay" (`PR:505-509`). Đúng với `src/report/decision-index.mjs:40-77` (sắp theo scope rồi D-ADR, không lọc supersede). Reducer của H3 sẽ đọc `relation` mà tsk-1lv đã ghi. Hạn chế: `relation` chỉ biểu đạt `supersedes:<id>`/`touches:<id>` cấp quyết định, trong khi proposal đòi supersede cấp claim/điều khoản (`PR:539-541`, câu mở `PR:1052`, PF-I017). Proposal không nhắc `--relation`.

## 4. Việc C: tập quyết định đang hiệu lực

- **Định nghĩa:** có trong proposal, không trong plan. `PR:529-541`: "Effective decisions — kết luận hiện tại của từng phạm vi quyết định sau supersession", không xoá lịch sử, supersede một phần cần mô hình claim/điều khoản. Cổng đầu ra của brief phải thất bại đóng khi supersession mơ hồ (`PR:555-558`).
- **Ai tính:** *Effective Decision Reducer*, thành phần của Agent Context Engine (`PR:708`); phase đầu của H3 (`PR:1098`, `PM` mục 9.3 tương ứng).
- **Phase nào:** không phase nào trong 1–10. Plan loại rõ "claim/clause-level decision supersession" khỏi những gì hoàn tất (`PM:111`; `BP:122-138`); hiến pháp ghi `clause-level-supersession` trong `deferredToEngine` với trigger "Decision records move into the engine registry"; PF-I007 trigger "Canonical platform corpus and minimum graph/decision reduction can support deterministic selection" (`docs/platform/intent-preservation-ledger.md:71`).
- **Mã:** không (`rg` các tên effective/reducer trong `src bin scripts packages apps` ra rỗng). Hạt giống gần nhất là `docs/decisions/index.md` + `state.decisions`, và PF-I007 tự nói "no context packet compiler exists".
- **Điều plan có:** quy tắc giải xung đột lúc di trú `newer-decision-supersedes` (`BR:minimum-constitution.json` mục `authorityConflict`) và `decisionRefs[]` trong mỗi hàng claim (`PM:185-211`). Cái đó giúp di trú, không phải tập hiệu lực.

## 5. Việc D: giao luật/instruction tới agent

- **Có chủ thẩm quyền, không có chủ thi công trong plan.** RUL102 (`docs/specs/distribution.md:362`, quyết 2026-10-17): việc ghép và chọn luật thuộc Agent Context Engine; packaging-distribution chỉ phát hiện, cài, render theo host, sửa. Hợp đồng đã promote nhắc lại (`docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md:31,36`). PF-I007 `deferred-preserved` (`docs/platform/intent-preservation-ledger.md:71`).
- **Trong plan:** Agent Context Engine chỉ là "preserved future" (`PM:115`, `BP:484-488`, §9 "Full Agent Context Engine: No need", `PM:579`) và phase 10 phải không "lan sang" nó (`BR:phase-10:43-44`). Hiến pháp ghi trigger "A separate Agent Context Engine plan is authorized" (`BR:minimum-constitution.md:295`).
- **Mã hiện có:** `src/setup/instruction-registry.mjs`, `instruction-composition.mjs`, `instruction-projections.mjs` (hạt giống do chính proposal nêu, `PR:495-504`, `PR:713-715`). Chưa có packet theo việc hay ngân sách token.
- **Thứ tự với Phase 9:** plan không nói gì ngoài "H3 không bao giờ chặn H1" (`PR:1106-1110`). Ràng buộc đến từ board: ghi `AGENTS.md`, `CLAUDE.md`, `docs/platform-foundations.md`, `docs/specs/platform-foundations.md` chỉ land **sau** cutover, "cutover không chờ RULE" (`board/plan.md:59`, `board/log.md:12`, owner L12-91). Ngoài ra Phase 9 phải chờ Plan A phase 06 và Plan B phase 06 vì cả hai ghi `AGENTS.md` (`BP:345`). Đề xuất xen kẽ lát đầu engine trước Phase 9 theo ranh giới tập file chưa được duyệt (`handoff-261021-1446:34,38`), và nó cần danh sách file từ lead DOC.
- **Việc nhỏ ngoài câu hỏi:** hai quy tắc khác nhau cùng mang số RUL102 trên main: `docs/specs/runner.md:1135` ("a tier cell names its pool...") và `docs/specs/distribution.md:362` ("one owner for composing agent instructions"). Một cơ chế chống trùng id luật sẽ bắt được; tôi chỉ ghi nhận, chưa kiểm id nào đúng.

## 6. Việc E: điểm có thể xung đột khi lane RULE xây component trong lúc cutover chạy

Mọi tên file dưới đây lấy từ **bản nháp/khảo sát** Phase 7–8 ở `168a27c6c` (số liệu trước Phase 6) và từ main; **manifest thật (331 file) tôi không đọc được**, nên danh sách này không phải danh sách bị khoá.

### 6.1. Cái "khoá" và cách nó hoạt động (theo bản nháp)

- Mỗi mục manifest mang `consumerBlobId` (blob git của file người đọc tại mốc ghim). File bị sửa trên main sau mốc = **drift**, mục đó phải đề xuất lại và review lại, không áp mù (`phase-08-draft.md:118,174-178`). Drift trên 10% tổng mục là điều kiện dừng (`:226`).
- Bản vá hành vi chuẩn bị sẵn nhưng chỉ áp ở Phase 9 (`:98-110`, board `log.md:81`: "596 patch + 234 row-flip đều để Phase 9").
- Theo board, Bước 4 (consumer lớp 1/2) đóng ở `763568157`: 331 file, 275 bản ghi, 890 slot (609 giữ, 59 patch Phase 9, 177 join render, 45 park) (`board/log.md:80`). Ý nghĩa chính xác của "slot" và "park": tôi không kiểm.
- Lease (thiết kế): phạm vi `docs/**`, `AGENTS.md`, `CLAUDE.md`, switchboard json, và ba thư mục skill `core/skills`, `.agents/skills`, `plugins/fgOS/skills`. **Không** gồm `core/instructions/**`, `src/**`, `test/**` (`BR:cutover-write-lease-design.md:21,158`).

### 6.2. Nhóm file nguồn luật có trong bản nháp (Group A, B, behavioral readers)

| File | Nguồn | Điều gì xảy ra ở cutover |
|---|---|---|
| `AGENTS.md` (~21 dòng viết tay trỏ `docs/platform-foundations.md`, `docs/specs/*`, `docs/decisions/`...; 10 dòng nữa trong khối sinh) | `BR:consumer-survey.md:72`, draft `:144,274` | Viết lại ở Phase 9, sau Plan A/B phase 06 (`BP:345`). Quyết 10-21: RULE chỉ ghi sau cutover |
| `core/instructions/platform-laws.md` (nguồn của khối "fgOS Effective Instructions"; neo `docs/platform-foundations.md#...`) | `consumer-survey.md:50,72` | Sửa nguồn rồi sinh lại khối; `docs/platform-foundations.md` gốc chuyển về `docs/platform/platform-foundations.md` (`BR:ledger/area-map-root-authorities.md:14`) |
| `CLAUDE.md`, `.claude/rules/**` | `consumer-survey.md:50` | `.claude/rules/**` không nằm trong git, ngoài lease (`:117`) |
| `core/skills/**`, `domains/*/skills/**`, `core/task-specs`, `prompt-templates`, `coordination-protocols`, `agents`, `workflows` + bản render `.agents/skills`, `plugins/fgOS/skills` | `consumer-survey.md:73-75`, draft `:145-146` | Sửa nguồn, rồi `npm run build:skills`; render không sửa tay |
| `test/docs/rul11-anchor-phrase.test.mjs` (đọc `docs/specs/platform-foundations.md`) | `consumer-survey.md:98` | Bản vá hành vi, chọn một trong ba `platform-foundations.md` |
| `src/setup/instruction-registry.mjs:458` (đọc `docs/architecture-manifest.json`) | `consumer-survey.md:104`; tôi xác nhận ở main `:458` | Bản đồ chuyển file đó sang `docs/platform/contracts/architecture-manifest.json` (`area-map-root-authorities.md:7`) |
| `scripts/check-decision-citation-drift.mjs:428` (mặc định quét `docs/specs`) | `consumer-survey.md:101`, draft `:148` | Bản vá hành vi |
| `src/cli/command-registry.mjs:473,1411` và help trong `bin/fgos.mjs` (nêu `docs/specs/<area>.md`) | `consumer-survey.md:102` | Viết lại help |

### 6.3. Điểm chạm cụ thể giữa RULE và DOC

1. **`AGENTS.md`, `core/instructions/**`, `core/skills/**`**: RULE 1A.2 (`src/runner/prompt-templates/worker-prompt-*.txt`) và 1A.3 (`core/skills/_shared/private-cell-worktree.md`, `AGENTS.md:128`, `.githooks/pre-commit`) chạm đúng vùng khảo sát ghi là Group A/B/F. `handoff-261021-1446:48-49` cũng thừa nhận chưa biết các file có nằm trong manifest không. Đáp án nằm ở manifest thật.
2. **`scripts/check-decision-citation-drift.mjs`**: 1A.5 của RULE sửa `:469-480` (`handoff-261021-1446:51`); khảo sát liệt kê chính script này là bản vá hành vi (`consumer-survey.md:101`). Hai bên cùng sửa một file, và bản vá của DOC bị drift nếu 1A.5 land trước Phase 9. Handoff ghi "không va", khảo sát cho thấy có thể va. Thật hay không: tuỳ manifest.
3. **`src/setup/instruction-registry.mjs`**: handoff dự định tách một port khỏi file này (`handoff-261021-1446:58`) cho lát đầu engine; nó là bản vá hành vi, blob đổi thì mục manifest drift.
4. **Tài liệu spec và luật**: RUL và "Lịch sử quyết định" nằm trong `docs/specs/*.md` và `docs/platform/*/spec.md` (`handoff-261021-1021` §3). Sửa `docs/specs/**` trên main = ngoại lệ ratchet + còn nợ review nội dung + làm cũ các hàng quyết định đã review (`BP:325,349`; stop 6 `BR:phase-06:254`). Ratchet chỉ canh `docs/specs` và `docs/architect` (`BP:370`), nên sửa `docs/platform/**` trên main không bị ratchet chặn nhưng lọt vào đo drift khi Phase 9 chạy lại inventory (`BR:phase-09:29-30`: drift chặn cutover).
5. **Tài liệu mới cho component RULE**: một `docs/platform/<engine>/spec.md` mới trên main là tài liệu nền tảng chưa có route (retirement check đang báo 134 tài liệu chưa có trạng thái switchboard, `BR:phase-04:102`). Tiền lệ: Plan B thêm `docs/platform/convention/spec.md` và route đến bằng merge (`BR:phase-06:321`).
6. **File nóng chung**: `docs/platform/component-boundary.md` (board `plan.md:118` liệt kê HARDEN, DOC, SEAT, TEST, GIT) và `src/setup/registrations.mjs`, `.githooks/pre-commit`, `src/runner/merge.mjs`, `src/cli/command-registry.mjs`, `bin/fgos.mjs` (nháp stop 9, `phase-08-draft.md:231`). Engine RULE cần đăng ký doctor (gate Install/setup/doctor của `AGENTS.md`) sẽ sửa `registrations.mjs`, cùng chỗ lease sửa.
7. **Writer ghi `docs/**` hoặc `AGENTS.md`**: lease chỉ chặn writer đã đăng ký qua hàm kiểm chung (`assertDocWriteAllowed`, `BR:cutover-write-lease-design.md:56-58`; danh sách quét có `src/setup/instruction-projections.mjs` và `src/report/decision-index.mjs`). Một writer mới của RULE (sổ luật, bản render) lọt qua nếu không được thêm vào danh sách; còn lại chỉ bị chặn ở commit/ref.
8. **Snapshot rollback**: Phase 9 phải chụp "projection, installation ledger, alias, installed skills" ngoài git (`BR:phase-09:74-75`). Kho sổ luật và bản render mới của RULE cần nằm trong tập đó.
9. **Số hiệu**: ledger bản nhánh đã đổi PF-I011/PF-I012 của main thành PF-I022/PF-I023 (`board/log.md:151`); thêm PF mới ở main trong lúc này sẽ va số.

## 7. Việc F: không kiểm được hoặc chỉ suy luận

**Chưa kiểm được:**
1. Mọi thứ ở đầu nhánh sau `168a27c6c`: Phase 7 đóng (board `log.md:151`), Phase 8 Bước 3, 4, 5, `97c9694a4`. Không có object, GitHub cũng dừng ở `168a27c6c`; máy của lead DOC (`forgentx-5f`) chưa push.
2. Manifest thật (331 file/275 bản ghi/890 slot), nên **không biết** các file như `src/runner/prompt-templates*`, `core/agents/*`, `core/skills/**` có nằm trong đó không. Bảng 6.2 là từ bản nháp và khảo sát cũ.
3. Mã lease, `consumer-rewrites`, `check-evidence-relocation`: không có ở `168a27c6c`. Chỉ thấy thiết kế và bản nháp.
4. "Ba guard tài liệu của cutover" như cách owner gọi: tôi không tìm thấy cụm đó. Gần nhất là lease (guard commit, guard ref, cổng merge, seam dispatch; `BR:phase-08-draft.md:299`) và ba kiểm retirement-check; không biết đúng ba cái nào.
5. Bước "Phase 8 bước 4" trong phase file thật: bản nháp tôi đọc có Bước 4 là "link queues" (`phase-08-draft.md:266`), không khớp với "Bước 4 = consumer lớp 1/2" của board. Phase 8 thật đã được viết lại so với nháp.
6. `plan.md` ở `168a27c6c` nói Phase 6–10 chưa authorize (`BP:15,276`), trong khi `reports/phase-06/owner-answers.md` ghi owner authorize 2026-10-07 và `progress.md` (2026-10-10) ghi batch Agent Coordination đang chờ review lại. Tức `plan.md` lệch với bằng chứng trong cùng nhánh. Tôi dùng bằng chứng, không dùng bảng trạng thái.
7. Nội dung `fgos-coding-compounding` vs `fgos-coding-knowledge` có tồn tại hay không.
8. Số `authoritative_for` ở `docs/knowledge/`: đếm theo thư mục chỉ cho thấy nhiều file lẻ, tôi không tổng hợp.
9. Trạng thái landed của Plan A/B ở main: thấy `docs/platform/convention/spec.md`, `src/convention`, `fgos convention` và plan B nằm trong `archive/plans/`, tôi không đọc phase 06 của từng plan.

**Chỉ suy luận:**
- "Hai cơ chế khử trùng sẽ không dùng chung mã": suy từ việc không có hit chéo; plan chưa quyết.
- Khả năng va ở mục 6.3 điểm 2: suy từ nháp.

## 8. Đề xuất ngắn (chỉ gom, chưa quyết)

1. Hỏi lead DOC (`forgentx-5f`) hai điều trước khi RULE sửa `AGENTS.md`, `core/**`, `scripts/check-decision-citation-drift.mjs`, `src/setup/instruction-registry.mjs`: file nào có trong manifest, và có sẵn lát nào phase 8 chưa chạm không. Đã có trong handoff 1446 (§3.1); báo cáo này thêm hai file cụ thể nữa.
2. Khi thiết kế cơ chế chống trùng luật, đặt cạnh `authoritative-match`/`doc-near-duplicate` và helper `cross-area-claims` của Phase 7, tránh dựng cách đo trùng thứ ba.
3. Ghi vào hồ sơ DOC rằng sổ luật/bản render là writer mới cần vào danh sách lease và snapshot rollback.

## 9. Câu hỏi còn mở

1. Manifest thật của Phase 8 Bước 4 có `core/instructions/**`, `core/agents/*`, `src/runner/prompt-templates*`, `scripts/check-decision-citation-drift.mjs`, `src/setup/instruction-registry.mjs` không?
2. Phase 10 "duplicate owner" có dùng lại `findDuplicateAuthoritativeClaims` không, hay viết mới theo `Canonical for`?
3. Component nào của H2/H3 sẽ hấp thụ bốn cửa retrospective và `authoritative_for` (`PR:733-752`); plan chưa có phase và ledger chưa có hàng.
4. Hai RUL102 trên main: id nào sai?
5. Lease cuối cùng (Bước 6b) có thêm `core/instructions/**` và `src/setup/**` vào phạm vi không, vì thiết kế cũ để ngoài.
