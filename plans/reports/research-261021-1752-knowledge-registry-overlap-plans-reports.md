# Bản đồ cơ chế quản lý tài liệu và tri thức: mảng plans/ và plans/reports/

Nghiên cứu 2026-10-21 17:52 (Asia/Saigon), chỉ đọc, `main` = `10c412c90`. Một phần mã nằm ở `archive/plans/` (43 plan đã lưu trữ ngày 2026-09-30, commit `22e54f834`), vì `plans/260825-1841-knowledge-registry/` không còn ở main; tôi coi `archive/plans/` là một phần của mảng `plans/`.

Quy ước: `PR:n` = `docs/platform/proposals/documentation-system-unification.md`. Số dòng chỉ ghi khi tôi đã mở file. Hai báo cáo 1643 và 1707 tôi chỉ đối chiếu các điểm có liên quan, không lặp lại.

## 1. Kết luận

1. Trùng lắp là có thật và lớn nhất ở **Documentation Registry** (§4.7.1, `PR:690-697`): repo đã có Knowledge Registry chạy thật (`src/state/knowledge-registry.mjs`, 812 dòng; 479 doc đều `active` trong `docs/doc-registry.json`; `docRegistry.enforce: true` trong `.fgos/config.json:1444` từ `6cce97ab3`, 2026-08-27). Proposal đã tự ghi "generalize by profile" nên đây là nâng cấp, không phải kho mới, miễn là giữ đúng lời đó.
2. Các mảnh còn lại của engine (Governance Model, Claim and Decision Registry, Graph, Intake) hoặc chưa có mã, hoặc chồng với `authoritative_for` + skeleton-match (tsk-1lv-6) và `state.decisions` + `--relation` (tsk-1lv). Proposal không nhắc tên các cơ chế đó khi định nghĩa engine.
3. Ở mảng này không có cơ chế nào bị "quên" hoàn toàn; có ba thứ **bị bỏ dở hoặc lệch so với lời tự khai** (mục 4): phase 12 của plan knowledge-registry ghi `completed` nhưng đổi tên spec `knowledge.md` chưa làm; plan 260925 ở main tự ghi "Proposed, not authorized" trong khi board ghi "running"; con trỏ `plans/260825-1841-knowledge-registry/` chết trên main.
4. Có **hai nhóm sơ khai về "nơi đặt tên và đường dẫn"** không thuộc registry và không thuộc engine: component `convention` (đã land, Rust) và quy ước hook lệch nhau (mục 3, dòng 9 và 10). Engine phải nói rõ ranh giới với `convention` (kongming 1325 đã tách: `convention` lo tên artifact, engine lo con trỏ và neo trong văn xuôi).
5. Rủi ro chính cho owner: tồn tại **hai bộ chỉ mục end-user** song song (`docs/enduser-docs-index.json` 492 mục theo quadrant, và `docs/doc-registry.json` 479 topic theo registry) cùng sinh từ cây `docs/`, cùng có doctor check stale. Nếu engine "tổng quát hoá registry" mà không gỡ chỉ mục quadrant, ta thêm lớp thứ ba (vi phạm L10).

## 2. Dòng thời gian

| Ngày | Cơ chế | Chủ / plan | Trạng thái hiện tại |
|---|---|---|---|
| 2026-07-20 | verb `fgos compound` (gắn `docType`/`docPath` Diataxis vào outcome) | compound-learn-enduser-docs-2, commit `916f8d72b` | còn mã, đánh `deprecated: 'fgos doc reserve/register/promote'` (`src/cli/command-registry.mjs:643`) |
| 2026-07-21 | `fgos docs-index` + `enduser-docs-index.json` (chỉ mục theo quadrant) và `fgos doc-sources` | compound-learn-enduser-docs-13/15, `081d2d329`, `6a6a93fcd` | còn sống, chưa deprecated (`command-registry.mjs:1723,1735`); spec `docs/specs/enduser-docs-index.md` |
| 2026-07-29 | khảo sát "tách compound và full test về sau merge" | `plans/reports/from-scan-team-to-planning-260729-1614-...` | chỉ là khảo sát, đầu vào thảo luận (§2.5 phân biệt verb `compound` rẻ với skill compounding đắt); không thấy kết luận được thi hành, không kiểm thêm |
| 2026-08-17 | `authoritative_for` + `fgos authoritative-match` (skeleton-match) + chặn tạo trùng | tsk-1lv-6, `41b5b065e` | còn sống (`src/report/authoritative-match.mjs`, 101 dòng; doctor `doc-near-duplicate` `registrations.mjs:4242`). 239 file trong `docs/` có trường này |
| 2026-08-25 | báo cáo nhờ advisor ngoài về trục danh tính + topic registry | `plans/reports/for-external-advisor-260825-1209-...` (221 dòng) | đầu vào thiết kế của registry; đo 268 doc, +50 doc/7 ngày, 28% doc chạm ≥2 thực thể |
| 2026-08-25 | **Knowledge Registry** (tsk-28x), 12 phase | `archive/plans/260825-1841-knowledge-registry/`; code `5c948d2a4` | landed, còn sống; migration corpus tsk-5mh 2026-08-27; enforce bật `6cce97ab3` |
| 2026-08-25 | skill `fgos-coding-compounding` bị xoá, thay bằng `fgos-coding-knowledge` | `c1768fa51` | skill mới còn ở `domains/coding/skills/fgos-coding-knowledge/`; tên cũ vẫn còn ở 22 file spec/core (`skill-catalog-audit-261006.md:9`) |
| 2026-08-25 | `docs/architect/knowledge-registry-redesign.md` (đích thiết kế từ advisor ngoài) | `e9bf6e244` | file còn, ghi "design target"; không kiểm nội dung |
| 2026-09-13/15 | `docs/doc-governance.md` (loại tài liệu, thẩm quyền, vòng đời, đặt chỗ) | commit tuyển `23fb220e3` ("preserve main worktree"); header `Last reviewed: 2026-09-13`, "Implementation: Partial" | còn sống nhưng là văn bản, không có cơ chế cưỡng chế (xem 261006 audit); nguồn gốc `docs/architect/documentation-system-design.md` |
| 2026-09-15 | pilot test cho `docs-index` (cắt thời gian test) | `archive/plans/260915-0455-test-suite-feedback-cost/` phase 03 | landed, chỉ là tối ưu test; dẫn tới việc `docs-index` test ngốn 195,5 s (99,7% file test) |
| 2026-09-25/26 | **Documentation Authority Unification** (H1, bộ di trú) | `plans/260925-documentation-authority-unification/`; `2085d88fe` đặt plan lên main | board: running, Phase 8 bước 5; mã chỉ ở nhánh `origin/plan/260925-...` (scripts `check-doc-*`, `doc-alias-resolver`, `check-legacy-docs-ratchet`...), chưa land main |
| 2026-10-06/12 | **component `convention`** (tên/vị trí report, plan, journal) | `archive/plans/261006-1415-fgos-convention-component/` | completed 2026-10-12, mã ở `src/convention/`, `packages/convention/`, spec `docs/platform/convention/spec.md` |
| 2026-10-06 | harness-investigation: audit quy ước đặt tên + docs-roots | `plans/reports/harness-investigation-261006*` | chẩn đoán; sinh H2 (convention) và H6 (plan 260925) |
| 2026-10-21 | proposal engine + RULE lane | `PR:644-760`, `kongming-261021-1325`, `plans/261021-1513-rule-management-group-1a/` | proposal chưa duyệt; group 1A "proposed" chờ owner |

## 3. Bảng cơ chế

Nhãn so với Knowledge and Documentation Engine (KDE): TRÙNG / CHỒNG MỘT PHẦN / BỔ SUNG / ĐỘC LẬP / ĐÃ BỊ BỎ.

| # | Tên | Mô tả một câu | Nguồn | Trạng thái | Mã còn trên main | So với KDE |
|---|---|---|---|---|---|---|
| 1 | Knowledge Registry (topic/doc, reducer, invariant `activeDoc(topic,role)<=1`) | Sổ sự kiện `topic.*`/`doc.*` cho tri thức end-user, vòng đời reserved→provisional→active→superseded→retired | `archive/plans/260825-1841-knowledge-registry/plan.md:1-60` | Còn sống, enforce bật | `src/state/knowledge-registry.mjs` (812 d.), `src/report/knowledge-resolver.mjs`, `knowledge-projection.mjs`, `replay.mjs` (case `topic.*`), `store.mjs`, `cleanup-harness.mjs` | **TRÙNG** với Documentation Registry (§4.7.1). Proposal cũng tự nhận (`PR:~700`: "existing ... knowledge-registry.mjs belong on this side") |
| 2 | Verb `fgos topic`, `fgos doc reserve/register/mark-rendered/move-path/promote/demote/supersede/retire`, `fgos knowledge status/attest` | Mặt CLI của #1 | `bin/fgos.mjs:1522-1563`; `command-registry.mjs:1777-1838` | Còn sống | có | TRÙNG (cùng là cửa của Documentation Registry) |
| 3 | `fgos doc-registry` + `docs/doc-registry.json`/`.md` | Hai bản chiếu sinh ra của #1 (479 topic, mọi `active`) | `command-registry.mjs:1862`; doctor `doc-registry-stale` `registrations.mjs:4236` | Còn sống | có | TRÙNG với "Documentation Read Models" |
| 4 | 8 doctor check `doc-*` (alias-broken, active-duplicate, current-path-missing, source-unreachable, near-duplicate, provisional-aged, topic-oversized, role-underused, source-conservation) | Cưỡng chế bất biến của #1 | `registrations.mjs:4236-4246` | Còn sống | có | TRÙNG với phần kiểm của Registry. Phase 10 `fgos doc check` (chưa có mã) sẽ CHỒNG MỘT PHẦN với chúng, vì `BR:phase-10` chưa nói dùng lại (báo cáo 1707 dòng 13) |
| 5 | Chỉ mục end-user theo quadrant: `fgos docs-index`, `enduser-docs-index.json` (492 mục), `fgos doc-sources` | Chỉ mục đọc theo tag Diataxis, từ cây `docs/<quadrant>/` + nhật ký capture | `src/report/enduser-index.mjs` (140 d.), `enduser-index-generate.mjs` (161 d.); spec `docs/specs/enduser-docs-index.md`; doctor `enduser-docs-index-stale` (`registrations.mjs:3690`) | Còn sống; **song song với #3**. Có thêm bản `.fgos/docs/enduser-docs-index.json` (nguồn sinh chưa kiểm) | có | **CHỒNG MỘT PHẦN** với Read Models: hai chỉ mục, hai doctor check stale, cùng cây. Phase 07 của plan 260825 đã cho `docs-index` đi qua resolver (nên đã nối với #1), nhưng chưa hợp nhất |
| 6 | Diataxis làm trục | Bốn quadrant tutorial/how-to/reference/explanation; phase 12 hạ thành frontmatter `framework/mode` | `plan.md:44-49` | **Bị thay một nửa**: thư mục `docs/knowledge/<purposeSlug>/` (332 mục) đã thay `docs/<quadrant>/` cho phần mới, nhưng `docs/how-to`, `explanation`, `reference`, `tutorials` (167 mục) vẫn nằm trên đĩa và vẫn được #5 liệt kê | KDE dùng "document type, purpose, audience, authority-kind vocabulary" (`PR:687`): ĐỘC LẬP về từ vựng, nhưng phải quyết số phận quadrant |
| 7 | `fgos compound` | Verb gắn doc vào outcome, thay bằng `doc reserve/register/promote` | `command-registry.mjs:625-643`; `bin/fgos.mjs:1782` | Còn chạy, đã deprecated | có | ĐÃ BỊ BỎ (đúng kế hoạch phase 12) |
| 8 | Skill `fgos-coding-compounding` | Skill ghi tài liệu end-user theo Diataxis, tự đặt tên file | xoá `c1768fa51` | Đã xoá; 22 con trỏ chết | không | ĐÃ BỊ BỎ. Skill thay thế `fgos-coding-knowledge` là chính "adapter tạm" mà proposal muốn retire (`PR:733-752`) |
| 9 | Skill `fgos-coding-knowledge` | Writer registry-first (reserve → viết → register → attest) | `domains/coding/skills/fgos-coding-knowledge/SKILL.md`; `test/skills/fgos-coding-knowledge.test.mjs` | Còn sống | có | CHỒNG MỘT PHẦN với Knowledge Contribution Intake (`PR:723`); proposal định thay bằng trigger + workflow bề mặt + intake |
| 10 | `authoritative_for` + `authoritative-match` + doctor `doc-near-duplicate` | "Tìm trước khi tạo" bằng khớp khung nội dung | `src/report/authoritative-match.mjs`; `bin/fgos.mjs:42,3075`; `registrations.mjs:137,4036-4054` | Còn sống; ngày 2026-08-25 từng không có caller ngoài test (`plan.md:30-35`), nay có caller trong `bin/fgos.mjs` và doctor | có | **CHỒNG** với Knowledge Contribution Intake (dedup + route); proposal định thay về sau (báo cáo 1707 mục 2.2 dòng 18) |
| 11 | `fgos decision-index` + `docs/decisions/index.md` + `state.decisions` + `--relation` | Chỉ mục quyết định sinh từ state, chặn mâu thuẫn lúc ghi | `src/report/decision-index.mjs` (136 d.); `command-registry.mjs:859`; doctor `decision-index-stale` | Còn sống (tsk-1lv done) | có | **CHỒNG** với Claim and Decision Registry; **BỔ SUNG** cho Effective Decision Reducer (chưa có mã). Chi tiết ở báo cáo 1643 |
| 12 | `docs/doc-governance.md` | Hợp đồng quản trị tài liệu: loại, thẩm quyền, vòng đời, đặt chỗ; §13 bắt chuyển từng area | file; `Implementation: Partial` | Còn sống, bị 260925 viết lại thành hiến pháp; `research-261021-1054` mục 7.4 chỉ ra §13 sai | có | **CHỒNG MỘT PHẦN** với Documentation Governance Model (`PR:340-362,687`). Cùng nội dung, chưa có chủ cưỡng chế |
| 13 | `docs/architect/documentation-system-design.md` + `...-discussion.md` + `knowledge-registry-redesign.md` | Thiết kế gốc, được "promote" thành #12 | `docs/architect/` | Lịch sử | có | ĐÃ BỊ BỎ làm nguồn thẩm quyền; chưa kiểm chúng có nằm trong ledger 260925 |
| 14 | Bộ di trú 260925 (switchboard, legacy-docs ratchet, ledger claim, cổng bảo toàn, alias resolver, retirement check, intent-preservation ledger) | Công cụ chạy một lần để gom thẩm quyền tài liệu về `docs/platform/**` | `plans/260925-.../plan.md`; nhánh `origin/plan/260925-...` (ví dụ `scripts/doc-alias-resolver.mjs`); báo cáo 1707 mục 2.1 | Running; **chưa land main** (kiểm: `ls-tree` nhánh có `scripts/check-doc-*`, `check-legacy-docs-ratchet.*`, `doc-alias-resolver.mjs`, `next-doc-id.mjs`) | không, trừ ledger `docs/platform/intent-preservation-ledger.md` (đã land) | BỔ SUNG và là **hạt giống** (claim ledger → Claim Registry; alias resolver → alias của Registry). Nguy cơ: `doc-alias-resolver.mjs` dựng khái niệm alias thứ hai cạnh `knowledge-resolver.mjs` |
| 15 | `fgos convention name\|path\|classify\|check` | Tên và vị trí report/plan/journal; pre-commit cảnh báo | `archive/plans/261006-1415-fgos-convention-component/plan.md:1-14`; `docs/platform/convention/spec.md` | landed 2026-10-12 | `src/convention/`, `packages/convention/` | ĐỘC LẬP (đặt tên, không giữ danh tính tài liệu). Chồng chéo tiềm tàng với "placement rules" của Governance Model (`PR:687`) |
| 16 | `docs/templates/*` (spec, decision, contract, vision, ledger...) | Khuôn tài liệu theo loại | thư mục | Còn; nguồn chưa kiểm | có | BỔ SUNG cho Governance Model |
| 17 | Test pilot `docs-index-state-fixture` | Tối ưu test, không phải cơ chế | `archive/plans/260915-0455-.../reports/docs-index-pilot.md` | landed | `test/report/helpers/docs-index-state-fixture.mjs` (nêu trong báo cáo; không kiểm file) | ĐỘC LẬP |

## 4. Sơ khai bị quên, hoặc lệch so với lời tự khai

1. **Phase 12 ghi `completed` nhưng phần spec chưa làm.** `phase-12-deprecate-compound.md:25-35` đòi đổi tên `docs/specs/enduser-docs-authoring.md` thành `docs/specs/knowledge.md` và thay R4 (grow-vs-create theo tồn-tại-tệp) và R5 (Diataxis là trục duy nhất), cùng mục "Knowledge surfaces". Trên main: `ls docs/specs` không có `knowledge.md`; `enduser-docs-authoring.md:88,90` vẫn giữ R4/R5. Chỉ phần `deprecated` ở `command-registry.mjs:643` là có. Kết luận: "spec mô tả hệ registry" không tồn tại; registry chỉ có prose ở plan lưu trữ, `knowledge-registry-redesign.md` và code.
2. **Hai chỉ mục end-user song song** (dòng 5 trong bảng), cộng một bản thứ ba `.fgos/docs/enduser-docs-index.json` chưa rõ chủ.
3. **`docs/doc-registry.md` ghi "generated by `fgos doc-registry`"** nhưng nhiều plan (ví dụ `plans/261014-1400-two-doors-one-rununit/phase-07b-doctrine-remove-old-doors.md:33`) dặn "không sửa tay, nếu có generator thì chạy lại, không thì để nguyên". Ghi chú đó cho thấy tác giả plan không chắc generator còn dùng; thực tế verb còn (`command-registry.mjs:1862`).
4. **Registry không biết `plans/` hay `docs/specs`.** `path-name-docs-audit-261006.md` kết luận 5: doc-registry là sổ tri thức end-user, chỉ 4 root (knowledge/explanation/how-to/reference), "không phải hệ đặt chỗ". 116/131 phiên (89%) ghi `.md` mới vào `plans/` hoặc `docs/` mà chưa từng đọc reading-map/governance/registry (cùng file, kết luận 4). Tức hệ đã xây bỏ trống đúng phần nơi agent hay đẻ tài liệu; engine phải phủ phần này hoặc nói rõ là không phủ.
5. **Hai điểm vào mâu thuẫn:** `AGENTS.md` trỏ `docs/specs/reading-map.md`, `docs/README.md:28` trỏ `docs/reading-map.md` (hai file, 108 và 55 dòng, theo `path-name-docs-audit-261006.md`). Chưa kiểm hiện trạng sau 10-06.
6. **Con trỏ chết trên main:** `plans/260925-.../plan.md:7,241,700` trỏ `plans/260825-1841-knowledge-registry/`; thư mục không có ở main (chỉ có `archive/plans/...`). Commit `39e14c5e7` thêm README trỏ sang archive nhưng nó chỉ nằm trên nhánh `origin/plan/260925-...`.
7. **Plan 260925 tự mâu thuẫn trạng thái:** `plan.md:3-6` ở main ghi "Proposed — not authorized for execution", board `plan.md:52` ghi "running" (Phase 8 bước 5). Bản main của plan cũ hơn bản nhánh (báo cáo 1707 đầu trang).
8. **22 con trỏ tới skill đã xoá `fgos-coding-compounding`** và 124+ con trỏ tới `docs/decisions/00xx` đã retired (`skill-catalog-audit-261006.md:9`, báo cáo 1643 mục 1). Nhóm 1A (RULE lane) nhận phần dọn này.
9. **Bốn loại đặt tên mâu thuẫn do hai hook cùng chạy** (global và project; `path-name-docs-audit-261006.md` mục 2) đã được `convention` xử lý một phần (warn-only pre-commit, `plans/reports/` vẫn lệch). Không kiểm hiện trạng drift sau 10-12.

## 5. Không kiểm được

- Nội dung `docs/architect/knowledge-registry-redesign.md` và `documentation-system-design.md` (không đọc); chúng có nằm trong ledger của 260925 hay không.
- Nội dung phần `docs/history/` (agent khác phụ trách) nên tôi không đối chiếu 18 D-ID (D-tsk28x-*) với mã.
- Tính đúng của 790 file `plans/reports`: tôi lọc bằng từ khoá (hơn 60 file trúng) và đọc đầu/kết luận chừng 15 file; còn lại chỉ là nhắc thoáng. Từ khoá "projection" và "supersede" quá rộng, không rà hết.
- Chủ và nguồn sinh của `.fgos/docs/enduser-docs-index.json`; hai file `docs/enduser-docs-index.json` và `docs/doc-registry.json` hiện có doctor xanh hay không (không chạy `doctor`, theo ràng buộc read-only).
- Chạy `npm test` và `cargo test`: không chạy; mọi "còn sống" ở trên dựa trên có mặt mã và đăng ký verb/check, không dựa trên test xanh.
- Số 479 doc đều `active` là đọc từ JSON; chưa kiểm vì sao không còn doc `provisional`/`superseded`/`retired` nào, trong khi proposal nhắc nhiều lần về supersede.
- Mã nhánh `origin/plan/260925-...` chỉ kiểm bằng `ls-tree`, không đọc nội dung script.

## 6. Câu hỏi còn mở

1. Engine sẽ **hợp nhất hay thay** `fgos docs-index` + `enduser-docs-index.json` bằng một read model từ registry? Nếu không nói, hai chỉ mục sống tiếp.
2. Spec nào mô tả Knowledge Registry hiện hành? (Hiện không có; phase 12 chưa đóng.) Có nên làm đó là việc đầu của engine hay một mục riêng?
3. `doc-alias-resolver.mjs` của 260925 sẽ **dùng lại** `knowledge-resolver.mjs` hay thay? Hiện có hai khái niệm alias.
4. Phase 10 `fgos doc check` có dùng lại 9 doctor check `doc-*` và `findDuplicateAuthoritativeClaims` không, hay viết cái thứ ba?
5. Diataxis quadrant (167 mục ở `docs/how-to`/`explanation`/`reference`/`tutorials`) di về `docs/knowledge/` hay giữ? Câu hỏi này quyết định số phận của #5 và #6.
6. Registry có mở rộng sang `plans/`, `docs/specs`, `docs/platform` (profile) không, hay `convention` + `docs/platform/<area>/` giữ phần đó? Proposal nói "by profile" nhưng chưa nêu profile nào bắt buộc.

## 7. Đề xuất (ngắn)

- Trước khi viết bất kỳ code engine nào, thêm một hàng vào mục "Existing components" của proposal liệt kê đúng các cơ chế #1-#5, #10-#12 trong bảng ở trên, mỗi cơ chế ghi một câu: giữ, mở rộng, hay thay (L10: đổi một cơ chế thì chuyển caller và xoá đường cũ cùng đợt).
- Gom việc "đóng phase 12": viết spec hiện hành cho registry (đổi tên hoặc tạo `docs/specs/knowledge.md`) là điều kiện vào của engine, không phải việc phụ.
- Mục này thuộc RUL104: không thêm tính năng nào, chỉ ghi ranh giới; việc xây thêm do owner chọn sau.
