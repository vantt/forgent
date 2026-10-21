# Bản đồ cơ chế quản lý tài liệu/tri thức: docs/history + docs/journals

Ngày 2026-10-21. Phạm vi: `docs/history/` (881 thư mục, tạo từ 2026-07-14 đến 2026-10-06 theo `git log --diff-filter=A`) và `docs/journals/`. Chỉ đọc. Mọi claim về "còn sống" đã kiểm bằng `ls`/`rg`/`jq` trên main, không tin lời "done" trong history.

## 1. Kết luận

- `docs/journals/` (5 file, 2026-07-28..08-03) không có gì về quản lý tài liệu: toàn bài học về claim/worktree/hook. Bỏ qua được.
- `docs/history/` chứa gần như toàn bộ lịch sử thiết kế của ba thứ mà Knowledge and Documentation Engine (KDE) định bao trùm: (a) Knowledge Registry (tsk-28x, 2026-08-25, đã land, 479 doc trong snapshot), (b) lớp decision/anti-rot (tsk-1lv, 2026-08-17, đã land: `state.decisions` + `decision-index` + retire ADR corpus + `authoritative-match`), (c) enduser-docs-index (2026-07-21, còn sống song song với registry). Cộng một họ ratchet citation (tsk-37i, tsk-3ch).
- KDE chồng chéo nặng với (a), (b), (c): identity/lifecycle/alias/lineage/provenance/read model/near-duplicate đều đã có mã. Phần KDE thật sự mới: đồ thị có kiểu (typed graph), claim ở mức clause, authority-kind vocabulary, supersession ở mức claim. Đúng phần này lại chạm quyết định khoá D2 của tsk-1lv ("không stored graph, không daemon").
- Hai điều quan trọng nhất: (1) registry hiện tại chưa đạt chính thiết kế của nó (role "đóng" thực tế mở: 365 role khác nhau trên 479 doc; 332/332 doc đã migrate vẫn `provisional`; metrics harness B6 chưa từng xây; không có spec area trong `docs/specs/`); (2) hiện có HAI index sinh tự động trên cùng tập tài liệu (`docs/doc-registry.json` và `docs/enduser-docs-index.json`) với cách liệt kê khác nhau, đó là chỗ tùm lum lớn nhất và KDE phải gom chứ không được thêm cái thứ ba.

## 2. Dòng thời gian

| Ngày | Cơ chế | Thư mục history / nguồn | Trạng thái hiện tại |
|---|---|---|---|
| 2026-07-14 | ADR corpus `docs/decisions/00NN.md` (Nygard, 1 file/quyết định, `0000-index.md` viết tay) | commit `c93aa4acf` | RETIRE 2026-08-17 (`4722361ae`), còn mỗi `docs/decisions/index.md` sinh tự động |
| 2026-07-14 | `docs/specs/reading-map.md` + specs "state layer" (frontmatter `area/updated/sources/decisions/coverage`) | `ad65f59fd` | SỐNG (đang là cửa đọc đầu của AGENTS.md) |
| 2026-07-18 | `docs/id-systems-audit.md` (hệ ID ADR/RUL/D-local) | `400668931` | SỐNG, nền cho tsk-37i |
| 2026-07-20/21 | compound-learn stage + `fgos compound --doc-type/--doc-path` (Diataxis 4 quadrant, 13 sub-item) | commits `ec93a3aaa`..`b4fdd4c58`, thư mục feature không còn trong history | `compound` verb SỐNG nhưng deprecated (`src/cli/command-registry.mjs:625`, test `knowledge-deprecation.test.mjs`); stage `compound-learn` retire, thay bằng status `retrospective` |
| 2026-07-21 | `fgos docs-index` → `docs/enduser-docs-index.json` (`081d2d329`), skill `fgos-indexing`, spec `enduser-docs-index.md` | `docs-index-repo-root-fix`, `docs-index-store-unreachable` (tsk-f31), `enduser-index-test-dirty-manifest` (tsk-2ce) | SỐNG: `src/report/enduser-index*.mjs`, 492 entry |
| 2026-07-26/27 | `check-decision-supersession.mjs`, `check-decision-citation-drift.mjs` (STR72 doc-rot, detection-only) | `canonical-decision-projection` §1 | SỐNG, đã nâng thành write-time sweep (tsk-1lv-1) |
| 2026-08-07/09 | CHANGELOG capture: `tsk-3ip` check `changelog-unreleased-stale`; `tsk-12m` (auto ghi) | `automated-changelog-compound-learn` | tsk-3ip SỐNG (`src/setup/registrations.mjs:3483`); tsk-12m còn `todo`, chưa làm |
| 2026-08-08..18 | doctor `enduser-docs-index-stale` (tsk-1m0) + mở rộng orphan (tsk-uky) | `doctor-check-enduser-docs-index-stale`, `enduser-docs-index-orphan-detection` | SỐNG (`registrations.mjs:3690-3696`) |
| 2026-08-12 | Realign spec/docs vòng đời (tsk-5eq) | `spec-docs-lifecycle-realignment` | Land (tsk-5eq `done`). Quyết định quan trọng: KHÔNG rename file how-to vì gãy back-link `sourceCaptureId` |
| 2026-08-05..12 | tsk-3ts "ghi doc trước, tag sau, tag không có file thì refuse" + tsk-558 cleanup check đọc `docType/docPath` và kiểm file tồn tại | `retrospective-doc-write-path`, `tsk-558-...` | Land, `done`; bất biến "tag tồn tại ⇒ file có trên main" |
| 2026-08-17 | tsk-1lv: `--relation` bắt buộc, `scope`, `decision-index`, `context-render`, retire ADR, 4-door trong `retrospective`, `authoritative_for` + `authoritative-match` | `canonical-decision-projection`, `tsk-1lv-1..6` | Land (tsk-1lv `done`); mã: `src/report/{decision-index,context-render,authoritative-match}.mjs`, `src/state/retrospective-doors.mjs` |
| 2026-08-17..19 | Ratchet citation tự-chứa (tsk-37i) + `check-decision-codes` (tsk-3ch) | `self-contained-id-references`, `decision-code-check-enforcement`, `tsk-2sp`, `tsk-3x8` | SỐNG, baseline `scripts/check-decision-citation-drift.baseline.json` (38 file) |
| 2026-08-25 | **Knowledge Registry** (tsk-28x, 12 phase): event-sourced topic/doc, resolver, classifier, bootstrap, `fgos doc/topic/knowledge`, attest gate, 8 doctor check `doc-*`, projection, writer skill (`fgos-coding-compounding` đổi tên `fgos-coding-knowledge`), canary, migration, deprecate compound | `compound-learn-artifact-registry` (DISCUSSION 183 KB, 10 vòng), `tsk-28x`; thiết kế `docs/architect/knowledge-registry-redesign.md` | Land `5c948d2a4`; mã `src/state/knowledge-registry.mjs` (812 dòng), `scripts/knowledge-*.mjs`, `src/report/knowledge-{resolver,projection}.mjs` |
| 2026-08-26/27 | tsk-1uj bật `docRegistry.enforce: true`; tsk-ozk bắt purposeSlug dài + thêm tiền tố `docs/knowledge/` (D-tsk28x-16) | `tsk-1uj`, `tsk-ozk-purpose-slug-length-fix` | SỐNG (`.fgos/config.json:1444`) |
| 2026-09-03/04 | tsk-5mh apply migration thật 332 doc; tsk-43q enumeration docs-index cộng quét `docs/knowledge/` | `compound-learn-artifact-registry/plan.md`, `docs-index-registry-driven-enumeration` | Land (332 file dưới `docs/knowledge/`); cả hai item vẫn `blocked` do cleanup-harness ("retrospective may not have actually run") dù đã merge `fe6b0bf7e`, `9101a5d8e` |
| 2026-09-15 | `docs/doc-governance.md`, `docs/architect/documentation-system-design.md` | `23fb220e3` | Ngoài history: không có thư mục history nào cho chúng (rg `doc-governance` trong history = 0) |
| chưa | B6 metrics harness; tsk-422 (thu chất liệu kể chuyện); tsk-12m | `b6-metrics-harness-prd.md` ("zero code, zero design decisions locked"), item `todo` | CHƯA LÀM (xác nhận: không có mã metrics harness nào trong `scripts/`, `test/`) |

## 3. Bảng cơ chế và quan hệ với KDE

| Cơ chế | Một câu | Nguồn | Trạng thái | Mã còn trên main | So với KDE |
|---|---|---|---|---|---|
| Knowledge Registry (topic/doc event-sourced, lifecycle `reserved/provisional/active/superseded/retired`, alias, lineage split/merge) | Danh tính và vòng đời doc theo (topic, role), bất biến `activeDoc(topic,role)<=1` | tsk-28x D-tsk28x-1..16; `knowledge-registry.mjs:12-18` | SỐNG | `src/state/knowledge-registry.mjs`, verb `doc`, `topic`, `knowledge`, `doc-registry` | TRÙNG (document identity, lifecycle, aliases, lineage, generated registry read model) |
| Resolver old→new path (alias) | `doc-sources` tra qua `currentPath` + `aliases` | tsk-5mh RESEARCH R3 | SỐNG | `src/report/knowledge-resolver.mjs:31-45` | TRÙNG (aliases + legacy-path lineage) |
| Attest gate `fgos knowledge attest` + `docRegistry.enforce` | Cổng ghi: doc phải đăng ký, capture-id phải gắn | tsk-28x A3b; tsk-1uj | SỐNG, enforce=true | verb `knowledge` | TRÙNG (contribution provenance, evidence link) |
| 8 doctor check `doc-*` (alias-broken, active-duplicate, near-duplicate, provisional-aged, topic-oversized, role-underused, source-conservation…) | Đo sức khoẻ registry | tsk-28x B5 | SỐNG | `registrations.mjs:4236-4246` | TRÙNG (KDE sẽ phải sở hữu đúng bộ này) |
| `authoritative_for` + skeleton-match | Chủ sở hữu duy nhất một chủ đề + phát hiện trùng bằng chuỗi chuẩn hoá | tsk-1lv D8, D12 (CONTEXT.md:38,42); tsk-1lv-6 | SỐNG; độ phủ: 67/332 doc dưới `docs/knowledge/` có field (vẫn 67 như số đo 2026-08-25 "67/331 ≈ 20%", DISCUSSION.md:1223), cộng 146 file dưới thư mục quadrant cũ | `src/report/authoritative-match.mjs`, verb `authoritative-match`, check `doc-near-duplicate` | CHỒNG MỘT PHẦN: KDE "claim identity and canonical owner" là bản tổng quát hoá (mức clause) của đúng cái này; "claim" hiện = 1 chủ đề/1 doc, không clause |
| `state.decisions` + `fgos decision --relation/--scope` | Decision event-sourced, relation tường minh, write-time citation sweep | tsk-1lv-1/2, tsk-63c | SỐNG | `command-registry.mjs:845-849`, `src/state/store.mjs` | TRÙNG (decision records, supersession) ở mức decision; KDE đòi thêm mức claim/clause: BỔ SUNG |
| `decision-index` projection → `docs/decisions/index.md` | Read model sinh, `--check` chống drift | tsk-1lv-2 | SỐNG | `src/report/decision-index.mjs`, test | TRÙNG (generated read model); mô hình "generate + check" cần tái dùng |
| `context-render` (CONTEXT.md bảng Locked decisions từ `state.decisions`) | Bề mặt đọc render từ nguồn thật | tsk-1lv-3 | SỐNG | `src/report/context-render.mjs` | CHỒNG MỘT PHẦN (read model); proposal §4.6 "context compiler" là thành phần khác |
| Retire ADR corpus → narrative vào `docs/specs/<area>.md` mục "Lịch sử quyết định" | Một nguồn narrative, `state.decisions` giữ bản ngắn | tsk-1lv D5, `tsk-1lv-4/plan.md` | SỐNG (34 ADR đã migrate verbatim) | `docs/specs/*.md` | ĐỘC LẬP với KDE nhưng KDE phải chấp nhận nó là hiện trạng (đừng khôi phục 1-file/decision) |
| 4-door trong `retrospective` (freshness/impact/routing/doc-deferral) | Check cơ học advisory, không gate `approve` | tsk-1lv D7, D11 | SỐNG | `src/state/retrospective-doors.mjs` | CHỒNG MỘT PHẦN (doc-rot detection) |
| `enduser-docs-index` (verb `docs-index`, JSON, spec, doctor stale/orphan, skill `fgos-indexing`) | Index đọc-theo-tag theo quadrant, `sourceCaptureId` | 2026-07-21; tsk-f31, tsk-1wn, tsk-2ce, tsk-1m0, tsk-uky, tsk-43q | SỐNG, song song với registry | `src/report/enduser-index{,-generate}.mjs`, `registrations.mjs:3690-3696` | CHỒNG MỘT PHẦN, nguy cơ lớn nhất: KDE "generated registry and index read models" sẽ là cái thứ ba nếu không gom (xem mục 5) |
| Writer skill `fgos-coding-knowledge` (ex-compounding) | Retrospective → doc registry-backed | tsk-28x A4 | SỐNG | `.agents/skills/fgos-coding-knowledge/SKILL.md` | BỔ SUNG (workflow "contribution", KDE nói learning chỉ cấp contribution, khớp) |
| Cleanup-harness `checkRetrospectiveContent` | Doc tag phải có file thật, resolve qua registry | tsk-558; `27e691093` | SỐNG | `src/state/cleanup-harness.mjs` | BỔ SUNG (consumer của registry) |
| Ratchet citation (tsk-37i) + `check-decision-codes` | Citation `ID (gloss)`, baseline | tsk-37i D1-D8, tsk-3ch D1 | SỐNG | `scripts/check-decision-citation-drift*.mjs`, baseline 38 file | ĐỘC LẬP (kiểm cú pháp tham chiếu); KDE nên dùng, không thay |
| Spec lifecycle realign (tsk-5eq) | Dọn tên stage retire trong specs | `spec-docs-lifecycle-realignment` | Land, one-off | n/a | ĐỘC LẬP (sự kiện, không phải cơ chế) |
| Bộ ba Diataxis như trục thư mục | `docs/<quadrant>/` + `DIATAXIS_DOC_TYPES` | tsk-28x D-tsk28x-1,5 | ĐÃ BỊ THAY (nửa): quadrant không còn là thư mục cho doc mới theo thiết kế, nhưng 147 doc "active" vẫn nằm dưới `docs/explanation|how-to|reference` | `store.mjs` `DIATAXIS_DOC_TYPES` còn | KDE "document type/purpose/audience vocabulary" nối tiếp trục này |
| Metrics harness B6 | 6 chỉ số chống sprawl (docs/ngày, topic mới/tuần, tuổi provisional…) | `b6-metrics-harness-prd.md` | CHƯA TỪNG XÂY | không có | KDE nên nhận làm tiêu chí thành công; đừng bỏ lại lần nữa |
| Storytelling/material harvest (tsk-1hy phép thử, tsk-422) | Chất liệu kể chuyện trích từ capture, lifecycle `material:draft` tách khỏi doc | D-tsk28x-12,15 | tsk-1hy `done` (script thử), tsk-422 `todo` | không | ĐỘC LẬP; KDE đừng nuốt, và phải giữ luật "chữ `draft` không ở tầng doc" |

## 4. Quyết định khoá mà KDE có nguy cơ vi phạm hoặc làm lại

1. **D2 của tsk-1lv, không stored graph, không daemon** (`canonical-decision-projection/CONTEXT.md:32`, lý do ở DISCUSSION.md:146, :184 trích bee R9 "a second source of truth is exactly the failure mode this area exists to kill"). KDE đề xuất "typed documentation graph relationships" + "claim/clause-level supersession graph". Phải là dẫn xuất tái sinh được từ nguồn thật (event log + frontmatter), có `--check` drift, không phải store song song. Nếu KDE lưu graph riêng, đây là đảo ngược quyết định đã khoá, phải đưa owner theo mẫu câu hỏi quyết định.
2. **D3 của tsk-1lv, không xây decision-store mới** (CONTEXT.md:33): `state.decisions` là nguồn. KDE "decision records" phải bọc/mở rộng nó, không tạo cái thứ hai.
3. **D-tsk28x-14, `activeDoc(topicId, role) <= 1`, không escape hatch**, thêm active doc chỉ qua split/merge/đổi-role tường minh có lineage (DISCUSSION.md:367). Mọi "profile" mới trong KDE phải giữ.
4. **D-tsk28x-9, `docPath` cũ là sự thật lịch sử, không sửa; registry chiếu qua lineage/alias** (DISCUSSION.md:362) và quyết định không rename how-to vì gãy `sourceCaptureId` (`spec-docs-lifecycle-realignment/RESEARCH.md:177-198`). KDE đổi cấu trúc đường dẫn phải đi qua `doc.path-move` + alias.
5. **§9.2 proposal: "generalize the existing registry by profile"** khớp D-tsk28x-3/7 (registry framework mở, vocabulary từng framework đóng). Nhưng D-tsk28x-3 còn nói rõ: Diataxis KHÔNG được thành thư mục; trục identity (mục đích/vai trò/entity) tách khỏi trục cách viết. KDE thêm "authority-kind" phải đặt ở trục identity, không nhét vào Diataxis mode (DISCUSSION.md:994-1006, luật OKF "không thêm loại mới để mã hoá phân biệt nhét vừa vào field cũ").
6. **D-tsk28x-15**: lifecycle hai tầng, chữ `draft` chỉ ở tầng chất liệu; doc dùng `provisional/active/superseded/retired` (`knowledge-registry.mjs:12-18`; còn thêm `reserved`). Document lifecycle của KDE phải dùng lại tập này.
7. **D-tsk28x-8/Q7**: một bộ máy, hai registry tách rời: tầng người (`docs/knowledge`, chấp nhận trùng lặp) vs tầng máy (`docs/specs`, tối ưu độ gọn), chung verb/projection/doctor, KHÔNG chung vocabulary và ngưỡng. KDE gộp cả hai vào một vocabulary là vi phạm.
8. **D8 của tsk-1lv** (CONTEXT.md:38): chống fork = doctrine + harness backstop, "KHÔNG BAO GIỜ một hàm gate sống". Nhưng tsk-28x A3b đã đặt attest gate live (`docRegistry.enforce`). Hai quyết định đã mâu thuẫn trong history; KDE sẽ phải chọn một. D-tsk28x-13 (DISCUSSION.md:366) đã chốt anti-fork ngữ nghĩa là `authoritative-match` + nâng độ phủ + cưỡng chế khai báo, không xây mới.
9. **D6/D14 của tsk-1lv**: `authoritative_for` chỉ chống trùng trong subject-space đã định nghĩa, audience-as-dimension "CHƯA GIẢI, thuộc tsk-28x" (CONTEXT.md:44). KDE "audience vocabulary" là nơi trả món nợ này; kiểm `docs/specs/enduser-docs-index.md` R4 (audience khoá cứng theo quadrant) có còn đúng.
10. **tsk-3ts D3: viết file trước, tag sau, tag không có file thì refuse** (`retrospective-doc-write-path/CONTEXT.md`); bất biến "tag tồn tại ⇒ doc tồn tại trên main". Mọi cơ chế contribution của KDE phải giữ thứ tự này.
11. **D5 của tsk-1lv**: ADR corpus đã retire, narrative ở `docs/specs/<area>.md` mục "Lịch sử quyết định". Không khôi phục.
12. Kèm theo (không phải D-ID): AGENTS.md "Install/setup/doctor gate" và L5 câu 2 (component mới có spec trước code), mà Knowledge Registry chính nó chưa có (xem mục 5).

## 5. "Sơ khai bị quên" và khoảng trống tìm được

1. **Hai index sinh tự động trên cùng tập doc, enumeration khác nhau.** `docs/doc-registry.json` (479 doc, 479 topic) và `docs/enduser-docs-index.json` (492 entry, 332 knowledge + 137 explanation + 15 how-to + 7 reference + 1 decisions). tsk-43q cố ý KHÔNG làm index driven bởi registry (giữ fallback unreachable-store của tsk-f31, `docs-index-registry-driven-enumeration/plan.md`), nên chúng sẽ trôi khác nhau. Tên thư mục history `docs-index-registry-driven-enumeration` hứa "registry-driven" nhưng kết quả thật là quét thư mục thêm. Đây là chỗ KDE phải quyết "một read model", không thêm cái thứ ba.
2. **Vocabulary role "đóng" chưa bao giờ được thực thi.** Thiết kế: role là tập đóng nhỏ, tên file (D-tsk28x-4/7, Q6; 4 role ví dụ: pitfall, runbook, decision, pattern). Thực tế: 365 role khác nhau trong 479 doc (99 là `overview`, 14 `summary`, 4 `decision-record`, còn lại là slug dài bằng chính tên topic). Mã thừa nhận: `knowledge-registry.mjs:87-96` "does NOT enforce a closed set of role values... a product decision beyond this mechanical guard's scope". Nghĩa là mục tiêu chống sprawl chỉ đạt ở tầng đường dẫn, chưa ở tầng ngữ nghĩa.
3. **332/332 doc đã migrate vẫn `provisional`, chưa ai promote** (jq trên `docs/doc-registry.json`). Skill ghi rõ không auto-promote (`fgos-coding-knowledge/SKILL.md` Hard rules). Check `doc-provisional-aged` có, nhưng không thấy quy trình promote chạy. 147 doc `active` còn lại đều nằm ở đường dẫn quadrant cũ (136 explanation, 4 how-to, 6 reference, 1 knowledge), tạo ngày 2026-09-03 (110) và 09-04 (36): nghĩa là writer sau migration vẫn ghi vào `docs/<quadrant>/` trái D-tsk28x-16. Lý do chưa kiểm.
4. **B6 metrics harness chưa từng xây.** PRD tự ghi "not started (zero code, zero design decisions locked)". Chỉ số gốc: +7.1 doc/ngày (268 doc, 2026-08-11→18). Không có bằng chứng nào cho thấy sprawl đã giảm.
5. **Không có spec area cho Knowledge Registry.** `ls docs/specs | rg knowledge` rỗng; `docs/specs/enduser-docs-index.md` (cập nhật cuối 2026-08-12, trước registry) chỉ 1 chỗ nhắc "knowledge". Thiết kế nằm ở `docs/architect/knowledge-registry-redesign.md` ("Status: design target") và history. Trái AGENTS.md (area mới có spec trước code). KDE là dịp trả nợ này.
6. **Chữ trong skill lệch layout đã chốt.** `fgos-coding-knowledge/SKILL.md` nói `docs/<purposeSlug>/<role>.md` trong khi D-tsk28x-16 (supersede D-tsk28x-5) đổi thành `docs/knowledge/<purposeSlug>/<role>.md`. Một phần có thể giải thích điểm 3.
7. **Snapshot generated bị cũ.** `docs/doc-registry.{json,md}` commit cuối `23fb220e3` 2026-09-15 (từng stale, `69a827f9c` 2026-09-04 viết "stale since 2026-09-03"). Check `doc-registry-stale` có, nhưng snapshot trên main phản ánh 2026-09 chứ không phải hiện tại.
8. **tsk-5mh và tsk-43q `blocked` (system-error) dù đã merge** (`fe6b0bf7e`, `9101a5d8e`): lý do hệ thống "retrospective may not have actually run". Rác trạng thái, không ảnh hưởng thiết kế, nhưng cho thấy cleanup-harness và registry vẫn lệch nhau.
9. **Đề xuất CHANGELOG tự động (tsk-12m) và storytelling (tsk-422) treo `todo`.** Cả hai đều dựa vào "framework viết thứ hai" của trục D-tsk28x-3. KDE đừng giả định chúng đã tồn tại.
10. **Phát hiện ngoài history:** `docs/doc-governance.md`, `docs/architect/documentation-system-design.md` (2026-09-15) không có thư mục history, không được history nhắc. Chúng là lớp governance mới nhất, chồng khái niệm với D-tsk28x (doc types, authority, lifecycle, placement). Thuộc agent khác, nhưng cần đối chiếu.

## 6. Không kiểm được

- Store sống `.fgos/` (số doc, lifecycle thật hôm nay): chỉ đọc snapshot `docs/doc-registry.json`, không chạy verb ghi và không replay event log.
- Nguyên nhân 147 doc active ở đường dẫn cũ (bootstrap hay writer): không kiểm.
- Plan gốc `plans/260825-1841-knowledge-registry/` đã chuyển sang `archive/plans/260825-1841-knowledge-registry` (chỉ xác nhận tồn tại, không đọc 12 phase file).
- Thư mục history cho 13 sub-item compound-learn-enduser-docs tháng 7: không còn trong `docs/history/` (chỉ thấy qua commit message).
- DISCUSSION.md của tsk-28x (183 KB) đọc phần trạng thái, §4 bảng D-ID, §6, §6.7, danh mục task; không đọc toàn bộ §5 Q&A log (~550 dòng). Số liệu "267/268/332 doc" trong tài liệu khác nhau theo thời điểm đo.
- Hai báo cáo tham khảo đã nêu trong brief: không đọc (theo phân công).
- `ls docs/how-to ... | wc -l` = 167 mục gồm cả thư mục/README, không phải số doc chính xác.

## 7. Câu hỏi còn mở

1. KDE có bao trùm cả hai tầng (người `docs/knowledge`, máy `docs/specs`) không? Nếu có, D-tsk28x-8/Q7 phải được supersede tường minh.
2. Đồ thị có kiểu của KDE là dẫn xuất tái sinh (theo D2 tsk-1lv) hay store riêng (đảo D2)?
3. "Claim" của KDE có thay `authoritative_for` (1 frontmatter field/1 chủ đề) hay lồng trên nó? Độ phủ hiện 67/332 doc migrate cho thấy cưỡng chế khai báo là việc chưa xong.
4. Index nào là read model chuẩn: `doc-registry.json` hay `enduser-docs-index.json`? Cái còn lại retire (L10) hay thành view của cái chuẩn?
5. Vì sao writer sau migration vẫn ghi vào quadrant cũ?

## Đề xuất (tách riêng, chờ owner chọn)

- Trước khi mở KDE: gom tùm lum thật sự đang có (RUL11): (a) một read model thay vì hai index, (b) viết spec area `docs/specs/knowledge-registry.md` từ `docs/architect/knowledge-registry-redesign.md` + history, (c) đóng khoảng cách role/promote/layout ở mục 5.2-5.3, (d) xây B6 làm thước đo thành công cho KDE. Lý do: KDE sẽ chồng lên nền chưa đạt chính thiết kế của nó; bằng chứng ở mục 5.
- Phương án KDE = "khái quát hoá registry hiện có theo profile" (đúng §9.2) hợp với history hơn mọi phương án store mới, với điều kiện chấp nhận mục 4.1-4.3 làm ràng buộc.

Status: DONE
