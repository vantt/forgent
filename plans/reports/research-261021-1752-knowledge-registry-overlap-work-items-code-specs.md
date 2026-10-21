# Chồng chéo giữa Knowledge Registry hiện có và Knowledge and Documentation Engine: work item, mã, spec

Ngày đo: 2026-10-21. Read-only; số liệu lấy từ `fgos list --all --json`, fold lại `.fgos/events.jsonl` + `.fgos/events/*.jsonl` bằng chính `foldKnowledgeEvents`, `fgos knowledge status`, `fgos doctor --json` (không `--fix`), `git ls-files`.

## 1. Kết luận

- Knowledge Registry đã là một document-identity + lifecycle + alias + provenance engine chạy thật, nhưng chỉ cho **tài liệu end-user (Diataxis)**: 479 topic / 479 doc, toàn bộ nằm dưới `docs/knowledge|explanation|how-to|reference`; 0 doc dưới `docs/platform`, `docs/architect`, `docs/specs` (khoảng 3146 file .md trong `docs/`, registry phủ ~15%, ~33% nếu bỏ `docs/history`). Đây là phần "Documentation Registry" của engine, đã có ~70% hợp đồng (identity, 5 trạng thái lifecycle, path-alias, lineage topic, attest/provenance, projection, 10 check doctor).
- Engine **không trùng** registry nếu đi theo §9.2 ("generalize by profile") vì chính proposal đã liệt kê registry là nền (proposal :40-47, :140-162, :701). Nó **trùng** nếu bất kỳ ai dựng store/CLI mới song song. Phần engine thật sự mới: claim identity, typed graph, vocabulary đóng cho type/audience/authority-kind, supersession cấp clause, phủ docs/platform+architect+specs, lập constitution máy đọc được. Các phần này CHƯA CÓ trong mã.
- Có 4 cặp cơ chế song song đang cùng làm một việc (mục 5), đáng gom trước khi thêm engine: ba cách liệt kê tài liệu, ba khái niệm "sở hữu claim", hai nơi ghi supersession, hai nơi ghi provenance.
- Registry đang **hỏng/đứng ở vận hành**, không chỉ thiếu tính năng: không có event doc/topic nào sau 2026-09-11; 34 file end-user tracked chưa đăng ký (10 file thêm mới sau 09-12 đều bỏ qua registry); `doc-provisional-aged` không bao giờ bắn được (bug); 332/479 doc kẹt `provisional` 47-55 ngày; `docs/specs/*` không có spec cho registry và còn mô tả layout cũ. Dựng engine lên nền này mà không sửa thì kế thừa đúng các lỗ đó.

## 2. Bảng work item (1195 item; mặc định `fgos list` chỉ trả 269 item mở, phải `--all`)

Lọc từ khoá trên title+description ra 110 item; bảng dưới là phần liên quan thật (không liệt kê hàng trăm item chỉ nhắc "claim"/"supersede" theo nghĩa khác).

| Item | Trạng thái | Nội dung một câu | Cơ chế |
|---|---|---|---|
| tsk-1lv (+1..6) | done | Luật/quyết định/doc outdate mâu thuẫn: dựng "ảnh cuối" cho agent | decision projection |
| tsk-1lv-1 | done | `fgos decision` bắt buộc `--relation none/supersedes/touches` + quét trích dẫn khi supersede | relation (store.mjs:1852-1877) |
| tsk-1lv-2 | done | Thêm `scope` vào state.decisions, sinh `docs/decisions/index.md` kèm `--check` | decision-index |
| tsk-1lv-3 | done | Bảng Locked-Decisions trong CONTEXT.md render từ state.decisions | decision read model |
| tsk-1lv-4 | done | Retire corpus `docs/decisions/*.md` (35 file), narrative về `docs/specs/<area>.md` | retire |
| tsk-1lv-5 | done | 4 cửa freshness/impact/routing/doc-deferral trong sweep retrospective | `src/state/retrospective-doors.mjs` |
| tsk-1lv-6 | done | `authoritative_for` + skeleton-match port/adapter | authoritative-match.mjs |
| tsk-28x (+1..12) | done | Đổi pipeline compound-learn thành registry topic/doc; 12 phase | knowledge registry |
| tsk-28x-1/2/4/5 | done | Domain model + reducer; resolver alias; bootstrap; verb `topic`/`doc` | knowledge-registry.mjs, resolver |
| tsk-28x-6 | done | `knowledge attest` + gate 4 điều kiện + `docRegistry.enforce` vào setup/doctor | attest gate |
| tsk-28x-7 | done | `doc-sources`/`docs-index` đọc qua resolver (chỉ nửa alias; nửa liệt kê xem tsk-43q) | enduser index |
| tsk-28x-8 | done | Projection JSON+MD và 8 check doctor, nối `doc-near-duplicate` đang "nằm chết" | doctor `doc-*` |
| tsk-28x-9/10/11/12 | done | Skill `fgos-coding-knowledge`, canary, migration, deprecate `fgos compound` | skill + scripts |
| tsk-3uc | done | Sửa 4 lỗ vòng đời registry (register ghi đè lifecycle, attest vào superseded, merge/split vào topic retired, retire no-op) | reducer |
| tsk-ozk | done | purposeSlug dài tới 420 ký tự (247/332), đổi layout thành `docs/knowledge/<slug>/<role>.md` | layout |
| tsk-1uj | done | Bật `docRegistry.enforce: true` (commit 6cce97ab3, 2026-08-27) | gate |
| tsk-5mh | blocked (system-error) | Chạy migration `--apply` thật 330 doc; **code/doc đã xong** (commit 1c6aa7a40 "after real migration apply"), item kẹt vì retrospective không để lại docType/docPath | migration |
| tsk-43q | blocked (system-error) | `docs-index` liệt kê theo thư mục quadrant, không theo registry; **đã sửa** ở 84f85c316, merge 9101a5d8e, nhưng item vẫn blocked | enduser index |
| tsk-3kj | todo | Harness đo B6: doc mới/ngày, tuổi provisional, cảnh báo trùng/tuần; item tự ghi "chưa có dấu vết nào trong repo" | chưa xây |
| tsk-4xi | wontfix | Capture proposal "unification": mở rộng registry thành multi-profile | proposal H2 |
| tsk-1wn, tsk-f31, tsk-2ce, tsk-3at, tsk-4wt | done/wontfix | `docs-index` ghi file mà khai báo read-only; test ghi đè file thật; xoá sạch `sourceCaptureId` khi store không với tới | enduser index |
| tsk-1m0, tsk-uky | done | Check `enduser-docs-index-stale` (85/236 thiếu), rồi mở rộng sang hướng mồ côi (36 mục) | doctor |
| tsk-37i, tsk-2yu, tsk-2sp | done / blocked / done | Quy ước trích dẫn tự-chứa; baseline 1788 vi phạm; dọn 12 file | citation drift |
| tsk-555, tsk-558, tsk-5fv, tsk-3ts | done | `checkRetrospectiveContent` (cleanup-harness.mjs:349-456) chấp nhận docType+docPath/attest/decision; doc retro bị bỏ mồ côi trên branch | retro gate |
| tsk-1zi, tsk-3o3, tsk-4op, tsk-5jb, tsk-3p1 | done/wontfix | Retire stage compound-learn; retro-loop; tách "ship" khỏi compound-learn | quy trình |
| tsk-12m, tsk-1hy | todo / done | Changelog tự động; script gom chất liệu kể chuyện | producer type (ý tưởng của tsk-28x) |
| tsk-3j1, tsk-5eq | done | Cập nhật spec `enduser-docs-*` cho vòng đời mới (2026-08-12), **trước** registry | spec |

Không tìm thấy work item nào cho: claim identity, typed graph, vocabulary type/audience, phủ docs/platform+architect, hay "doc-governance" (chỉ tsk-4xi nhắc proposal). Proposal 260925 (`plans/260925-documentation-authority-unification`) thuộc mảng agent khác.

## 3. Bảng mã

Trạng thái dùng thật: bằng chứng số liệu. "So với engine": TRÙNG / CHỒNG MỘT PHẦN / BỔ SUNG / ĐỘC LẬP.

| Cơ chế | File | Hợp đồng một câu | Dùng thật? | So với engine |
|---|---|---|---|---|
| Reducer topic/doc | `src/state/knowledge-registry.mjs` (812 dòng) | 9 event `topic.*` + 9 event `doc.*`, lifecycle 5 trạng thái (:12-18), 1 doc live/(topic,role) (:131-138,:172-186), path unique (:150-158), alias khi move (:772-790) | Có: 3496 event doc/topic, 479 topic, 479 doc; **ngừng từ 2026-09-11** | TRÙNG với "Documentation Registry"; nền để generalize |
| Verb `topic`/`doc`/`knowledge`/`doc-registry` | `bin/fgos.mjs:1517,1558,1683,1770`; `command-registry.mjs:1777,1807,1838,1862` | CLI ghi event, attest gate đòi path là currentPath + commit ở HEAD + `--capture-id` | Có (241 `doc.attest`; 1053 `path-move`) | TRÙNG |
| Resolver đường dẫn | `src/report/knowledge-resolver.mjs` (130 dòng) | oldPath/currentPath → doc live, đi theo `supersededBy` và lineage topic | Có (enduser index, attest, cleanup-harness :387) | TRÙNG với alias/lineage |
| Projection registry | `src/report/knowledge-projection.mjs` → `docs/doc-registry.{json,md}` | Chiếu 479 topic/doc, sinh lại được | Có, check `doc-registry-stale` xanh | TRÙNG với "Read Models" |
| Index end-user | `src/report/enduser-index*.mjs` → `docs/enduser-docs-index.json` | 492 mục, quét **thư mục** (quadrant + alias + `docs/knowledge/*`), `sourceCaptureId` từ log | Có, `enduser-docs-index-stale` xanh 492/492; 167 mục `sourceCaptureId` null | CHỒNG MỘT PHẦN: bản chiếu thứ hai của cùng kho; không đọc `view.docs` để liệt kê (enduser-index-generate.mjs:90-99) |
| `authoritative_for` + skeleton | `src/report/authoritative-match.mjs`, `frontmatter.mjs` | Khớp topic với frontmatter `authoritative_for` theo skeleton chữ thường/bỏ dấu; adapter pluggable | Dữ liệu: 213 doc có `authoritative_for` (136 explanation, 67 knowledge, 6 reference, 4 how-to); verb `authoritative-match` chỉ quét một thư mục `docs/<quadrant>` (bin :3085-3110) nên mù với `docs/knowledge` | BỔ SUNG/CHỒNG: là "claim ownership" sơ khai, một claim/doc, không phải claim identity |
| Check `doc-*` (10) | `registrations.mjs:3921-4246` | stale, alias-broken, active-duplicate, current-path-missing, source-unreachable, near-duplicate, provisional-aged, topic-oversized, role-underused, source-conservation | Chạy; kết quả hôm nay: 2 FAIL (`doc-current-path-missing` 1 doc; `doc-source-conservation` 4 outcome không resolve), `doc-provisional-aged` xanh giả (xem dưới) | TRÙNG với "richer doctor" của §9.2 một phần |
| `decision-index` | `src/report/decision-index.mjs`, `docs/decisions/index.md`, check `decision-index-stale` (:3786) | Chiếu quyết định có `scope` từ state.decisions + hàng đã commit | 5544 event decision (dedupe), 45 có `scope`; index 54 dòng bảng | CHỒNG MỘT PHẦN với "Claim and Decision Registry" |
| `--relation` | `store.mjs:1852-1877`, `scripts/check-decision-supersession.mjs` | Mỗi decision khai `none/supersedes:<id>/touches:<id>`; chỉ ở mức decision | 23 supersedes (10 có scope), 168 touches, 5353 none | CHỒNG: có chain supersession nhưng không có clause/partial, không có reducer "effective" |
| 4 cửa retrospective | `src/state/retrospective-doors.mjs` | freshness/impact/routing/doc-deferral, advisory | Không kiểm số lần chạy | ĐỘC LẬP (guard, không phải kho) |
| Citation drift | `scripts/check-decision-citation-drift.mjs` (515 dòng), baseline | Chặn vi phạm trích dẫn mới | Có baseline | ĐỘC LẬP/BỔ SUNG (check ngữ nghĩa văn bản) |
| Verb `compound` | `command-registry.mjs:625-643` | Gắn docType/docPath vào outcome; `deprecated: 'fgos doc reserve/register/promote'` | Còn đọc ngược trong cleanup-harness | Di sản; đã thay bằng attest |
| Header `Canonical for:` | `docs/doc-governance.md` §5; 188 file docs mang nó | Metadata định hướng, prose | **Không có mã nào đọc** (grep `src scripts bin` = 0) | Chưa thực thi; engine sẽ phải máy hoá |
| Scripts migration | `scripts/knowledge-{classifier,bootstrap,migration,canary}.mjs` | Phân loại, bootstrap, move/fold, canary | Đã chạy (bootstrap 08-26, move 08-27); proposal §9.2 bước 5 đã định retire | Tạm thời |

Phát hiện lỗi cụ thể (đã kiểm):
- `checkDocProvisionalAged` (`registrations.mjs:4065`) tính `now - doc.updatedAt`, nhưng `updatedAt` là chuỗi ISO (`event.ts`, ví dụ `"2026-08-27T08:15:48.776Z"`) nên phép trừ ra NaN, điều kiện luôn sai. Hôm nay doctor báo "no aged provisional docs" trong khi 332 doc provisional có tuổi 47.2-55.1 ngày. Check này chưa từng bắn trong sản xuất; đây cũng là chỉ số B6 mà tsk-3kj muốn đo.
- `doc-current-path-missing`: doc `how-to-wire-a-skill-to-an-executor-by-purpose-not-by-name:wire-a-skill-to-an-executor-by-purpose-not-name` vẫn `provisional` trong registry, nhưng file bị xoá bằng commit thường `beeca503d` mà không `doc retire`. Registry không chặn được xoá file ngoài verb.
- Không có check chiều "file end-user trên đĩa nhưng chưa vào registry": 34 file tracked (30 how-to, 1 explanation, 1 reference, 1 tutorials, 1 user) chưa đăng ký, 23 commit lần cuối tháng 9 và 10 trong tháng 10; 10 file mới thêm sau 2026-09-12 đều nằm ở thư mục quadrant cũ, 0 ở `docs/knowledge`. Dù `docRegistry.enforce=true`, enforce chỉ gác verb `knowledge attest`, không gác commit tài liệu.
- Skill `domains/coding/skills/fgos-coding-knowledge/SKILL.md` ghi layout `docs/<purposeSlug>/<role>.md` (0 lần nhắc `docs/knowledge`), lệch với layout thật `docs/knowledge/<slug>/<role>.md` sau tsk-ozk.

## 4. Đối chiếu từng việc của engine với mã hiện có

| Việc của engine (proposal :653-663, :664-673) | Hiện có | Mức |
|---|---|---|
| Document identity + lifecycle | `docId = topicId:role` (knowledge-registry.mjs:495,530), lifecycle `reserved/provisional/active/superseded/retired` (:12-18), cổng promote (:616-644), demote (:655-671), supersede với con trỏ `supersededBy` (:673-719) | ĐÃ CÓ (cho end-user doc) |
| Claim identity + canonical owner | Không có thực thể claim. Chỉ `authoritative_for` (một chuỗi/doc, frontmatter) và `Canonical for:` (prose, không mã đọc) | CHƯA CÓ (chỉ proxy) |
| Vocabulary type/purpose/audience/authority-kind | `VALID_FRAMEWORKS=['diataxis']`, 4 mode đóng (:24-25, :97-115); `role` là slug tự do (365 role khác nhau cho 479 doc; check `role-underused` chỉ in thông tin, luôn `passed: true`, :4100). Không có audience/authority-kind trong mã; `doc-governance.md` §3-4 là prose | CHỒNG MỘT PHẦN (mode đóng có; còn lại chưa) |
| Typed graph | Không. Chỉ lineage topic `splitFrom`/`mergedFrom` (:371,:446-451), `supersededBy` (:714), relation decision `touches/supersedes` | CHƯA CÓ (mầm: 3 cạnh rời rạc) |
| Contribution provenance + evidence | `sourceCaptureIds` (:512,:741-770), `doc.attest`, verb `doc-sources`, check `doc-source-conservation`/`doc-source-unreachable`; 479/479 doc có ≥1 capture | ĐÃ CÓ |
| Decision records + claim-level supersession | state.decisions + `relation` + `scope` + index; chỉ cấp decision đầy đủ, không partial; 4 quyết định chỉ nêu supersede bằng văn xuôi theo proposal :549-551 (chưa kiểm lại từng cái) | CHỒNG MỘT PHẦN |
| Alias + legacy-path lineage | `aliases[]` (:511,:589,:784-786), resolver chase `supersededBy`+lineage, 332 doc có alias, 1053 `doc.path-move`; check `doc-alias-broken` xanh | ĐÃ CÓ (end-user); chưa có cho legacy `docs/specs|architect` |
| Generated registry + index read models | `doc-registry.{json,md}`, `enduser-docs-index.json`, `decisions/index.md`, 3 check stale xanh | ĐÃ CÓ (3 bản chiếu rời) |
| Subcomponent: Governance Model (constitution, placement) | Prose `docs/doc-governance.md`; không có file máy đọc, không check | CHƯA CÓ (mã) |
| Subcomponent: Documentation Registry | Như trên | ĐÃ CÓ một phần lớn |
| Subcomponent: Claim and Decision Registry | Nửa decision có; nửa claim chưa | MỘT PHẦN |
| Subcomponent: Documentation Graph | Không | CHƯA CÓ |
| Subcomponent: Read Models | Như trên | ĐÃ CÓ, nhưng chưa hợp nhất |

## 5. Cơ chế song song cùng làm một việc

| Việc | Các cơ chế | Cửa chuẩn đề xuất | Bằng chứng lệch |
|---|---|---|---|
| Liệt kê "tài liệu nào tồn tại" | (a) `view.docs` registry 479; (b) `enumerateDocEntries` quét thư mục 492; (c) verb `authoritative-match` quét một `docs/<quadrant>`; (d) check `doc-near-duplicate` quét cả `docs/` (:4036-4050) | Registry (`view.docs`) | 479 vs 492 vs 34 file chưa đăng ký; (c) mù `docs/knowledge` sau migration |
| Ai sở hữu một claim | `authoritative_for` (213 doc) vs header `Canonical for:` (188 doc) vs cặp (topic, role) của registry vs `scope` của decision | Chưa có cửa; registry (topic, role) là gần nhất nhưng ở mức tài liệu | Hai tập 213 và 188 gần như không giao nhau (một bên end-user, bên kia platform/architect); kiểm chính xác giao: không kiểm |
| Supersession | `doc.supersede` + `supersededBy`; `--relation supersedes` ở decision; header `Supersedes:`/`Superseded by:` tuỳ chọn trong doc-governance §5; field `superseded-by` của work item | Không có; mỗi loại một cửa riêng không nối nhau | 0 doc có `supersededBy` trong registry (479 doc, 0 supersede) |
| Provenance của doc | `sourceCaptureIds` + `attest`; `outcome.docType/docPath` (compound cũ, còn đọc ở cleanup-harness.mjs:376-391); frontmatter OKF "bản sao ghi lúc soạn" (frontmatter.mjs, không có thẩm quyền) | `sourceCaptureIds` | `sourceCaptureId` null ở 167/492 mục index end-user |
| Lifecycle/status | `docLifecycle` (registry); `Design status`/`Implementation` header (doc-governance §5); `coverage: full|partial|implemented` trong frontmatter spec (`docs/specs/*.md`) | Không thống nhất | Ba từ vựng trạng thái cho ba tập tài liệu |

## 6. "Sơ khai bị quên"

- `docs/doc-governance.md` (promote 2026-09-13): 14 mục, đã mô tả placement, type, authority matrix, metadata bắt buộc; không có mã, không có check, không có registry của vocabulary. Là constitution viết tay, 188 file mang header nhưng không ai đọc.
- `authoritative-match` verb + `--check-duplicates`: lúc tsk-28x-8 mô tả là "backstop đang nằm chết"; hôm nay check doctor đã nối, nhưng verb vẫn quét một thư mục quadrant, không biết `docs/knowledge`.
- `docs/decisions/` thư mục chỉ còn `index.md`; `QUADRANT_DIR_ALIASES` vẫn coi nó là alias ngăn `explanation` (enduser-index-generate.mjs:93); 1 mục `decisions` trong index end-user.
- Verb `compound` deprecated nhưng còn trong registry và còn được `checkRetrospectiveContentForId` đọc lại; skill `fgos-coding-compounding` đã xoá ở c1768fa51 (2026-08-25) và thay bằng `fgos-coding-knowledge`; skill `fgos-indexing` vẫn còn (core/skills/fgos-indexing/SKILL.md) và vẫn nói "sau `fgos-coding-compounding`", tên không còn tồn tại.
- Tên thiết kế vs thực: `docs/architect/knowledge-registry-redesign.md` (status "design target", 743 dòng) nói `docs/knowledge-registry.json|md`; mã sinh `docs/doc-registry.{json,md}` (đổi tên). Chưa có `docs/specs/knowledge-registry.md`: registry không có spec area, trái luật "a new product area gets a spec before code" trong AGENTS.md.
- `docs/specs/enduser-docs-index.md` và `enduser-docs-authoring.md` (`updated: 2026-08-12`, `coverage: full`) có 0 lần nhắc `docs/knowledge`, `fgos doc`, `fgos topic`, `knowledge attest`; `docs/reading-map.md` còn mô tả bốn thư mục quadrant làm nơi ở của tài liệu end-user, dù 332/512 file đã ở `docs/knowledge`.
- `src/report/entropy.mjs`: không phải quản lý tài liệu (entropy của work-state), đã xoá khi chuyển Observe sang Rust (120af6b3d); không liên quan.
- Tìm `git log -S` cho `docSlot`, `doc-slot`, `docs-lint`, `docs-governance`, `checkDocGovernance`, `doc-lifecycle`: **0 kết quả** trong `src bin scripts core domains`. Không có cơ chế "doc slot" nào khác từng tồn tại ngoài `doc.reserve` (slot = (topic, role) trong registry), và không có verb `docs-index` nào đã bị xoá: `docs-index` vẫn sống (bin/fgos.mjs:3014).

## 7. Thứ không kiểm được

- Không đọc kỹ hai báo cáo tham khảo; chỉ đối chiếu số liệu decision. Tôi đếm 23 `supersedes` (10 có scope) trong log, proposal :549 nói "5 trong 7 platform relations chỉ thay một phần"; chưa tái lập con số 7, có thể khác cách đếm.
- Log còn event từ 2026-10 (73 event) nhưng không có event doc/topic nào sau 2026-09-11; chưa chắc event mới hơn không nằm ở store Rust/`refs/fgos/events` (spec event-store ghi "dormant trên main"). Số "registry ngừng dùng" đúng với `.fgos/events*` Node; chưa kiểm store khác.
- Chưa mở nội dung `docs/history/compound-learn-artifact-registry/*` (DISCUSSION, b6 PRD) và `plans/260825-1841-knowledge-registry/`; thuộc mảng khác.
- Giao của `authoritative_for` (213) và `Canonical for:` (188): chưa tính.
- Không chạy test suite.

## 8. Câu hỏi còn mở

1. Registry có dự định phủ `docs/platform`, `docs/architect`, `docs/specs` không, hay engine sẽ là một profile mới trên cùng reducer? `assertSafeDocPath` chỉ đòi tiền tố `docs/` nên về kỹ thuật phủ được; `assertFrameworkModeRoleValid` thì ép `framework=diataxis` + 4 mode, nên platform doc hiện không đăng ký được.
2. 332 doc `provisional` có phải chủ ý (migration §13.5 rule 6: "migrate xong để provisional") hay quên promote? Hiện không ai/gì phát hiện.
3. Skill `fgos-coding-knowledge` có còn là đường ghi duy nhất cho tài liệu mới không, vì 10 doc mới sau 09-12 đi đường khác?
4. tsk-43q và tsk-5mh nên đóng hay giữ blocked? Code đã landed, item kẹt vì retrospective không để lại bằng chứng.

## 9. Đề xuất (gom lại, chờ owner chọn; không làm trong lượt này)

- Sửa trước khi generalize: (a) `doc-provisional-aged` so sánh `Date.parse(updatedAt)`; (b) thêm check disk-vs-registry cho end-user docs; (c) để `authoritative-match` và `doc-near-duplicate` liệt kê từ cùng một nguồn với registry. Lý do: ba lỗi đã đo ở mục 3, và engine kế thừa nguyên.
- Viết `docs/specs/knowledge-registry.md` (area spec còn thiếu) và cập nhật `reading-map` + hai spec enduser. Lý do: luật "spec trước code" và layout trong spec đã sai.
- Chốt "một nguồn liệt kê tài liệu" = `view.docs`; hạ `enduser-docs-index.json` và `doc-registry.json` thành bản chiếu của cùng một hàm. Lý do: 479 vs 492 hiện lệch.
- Với engine: giữ reducer này, thêm profile (framework/mode đang đóng ở :24-25) thay vì store mới; claim/graph là hai thứ thật sự mới, nên là mục riêng sau.
