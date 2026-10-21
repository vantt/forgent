# Tổng hợp: Knowledge Registry đã có so với Knowledge and Documentation Engine của proposal

Viết ngày 2026-10-21 17:59 (Asia/Saigon), chỉ đọc, trên `main` ở `10c412c90`. Tổng hợp ba báo cáo của ba agent quét song song, cộng các điểm em tự kiểm lại. Theo yêu cầu của owner: dò xem Knowledge and Documentation Engine (KDE, `documentation-system-unification.md` §4.7.1) có trùng với Knowledge Registry và các phần quản lý tài liệu đã xây trước đó không.

Ba báo cáo nguồn:
- `research-261021-1752-knowledge-registry-overlap-plans-reports.md` (plans và reports)
- `research-261021-1752-knowledge-registry-overlap-history-journals.md` (docs/history và docs/journals)
- `research-261021-1752-knowledge-registry-overlap-work-items-code-specs.md` (work item, mã, spec)

Cách đọc nhãn: **Đã kiểm** là em tự chạy lệnh hoặc đọc mã trên main. **Theo agent** là lời của agent, em chưa tái lập.

## 1. Kết luận

1. **KDE không nên được xây như một component mới. Phần lớn nó đã tồn tại dưới tên Knowledge Registry.** Registry đã làm identity, lifecycle, alias, provenance và read model cho **tài liệu end-user** (479 topic, 479 doc, khoảng 15% trong số 3146 file `.md` của `docs/`, theo agent). Cái registry **không phủ** là `docs/platform`, `docs/architect`, `docs/specs`, tức đúng vùng mà kế hoạch 260925 đang chuyển.
2. **Phần thật sự mới của KDE chỉ có sáu thứ, và chưa có mã nào:** claim identity, typed graph, vocabulary đóng cho type/audience/authority-kind, supersession cấp điều khoản, phủ ba vùng tài liệu nền tảng, và hiến pháp đọc được bằng máy.
3. **Registry đang dừng ở vận hành và có lỗi thật.** Dựng KDE trên nền này mà không sửa thì kế thừa nguyên các lỗi đó (mục 3).
4. **Có bốn cặp cơ chế song song cùng làm một việc** đang tồn tại ngay hôm nay (mục 4), chưa cần KDE mới đã có.
5. **Proposal đã đúng một nửa:** §9.2 ghi "generalize the existing registry by profile rather than creating a parallel store". Nhưng nó không nói registry hiện đã chạy ở mức nào, không nhắc ràng buộc D2 của `tsk-1lv` ("không stored graph, không daemon"), và không nói các lỗi dưới đây.

## 2. Bản đồ: cái gì của KDE đã có

| Việc của KDE | Hiện có | Mức | Kiểm |
|---|---|---|---|
| Document identity và lifecycle | `docId = topicId:role`, năm trạng thái `reserved/provisional/active/superseded/retired`, cổng promote, demote, supersede (`src/state/knowledge-registry.mjs`) | **Đã có**, chỉ cho end-user | Theo agent. Số doc và lifecycle đã kiểm: 332 provisional, 147 active |
| Alias và lineage đường dẫn | `aliases[]`, resolver, hơn 1000 sự kiện `doc.path-move` | Đã có cho end-user, chưa cho `docs/specs` và `docs/architect` | Theo agent |
| Provenance và evidence | `sourceCaptureIds`, `doc.attest`, check `doc-source-*` | Đã có | Theo agent |
| Read model | `doc-registry.json`, `enduser-docs-index.json`, `docs/decisions/index.md` | Đã có nhưng **ba bản rời, chưa hợp nhất** | Đã kiểm số mục: 479 và 492 |
| Decision và supersession cấp quyết định | `state.decisions`, `--relation`, `scope`, index (`tsk-1lv`) | Một phần: không có thay một phần, 4 quyết định chỉ nêu bằng văn xuôi | Đã kiểm (báo cáo `1643`) |
| Vocabulary đóng | Framework `diataxis` và 4 mode đã đóng; `role` là slug tự do | Một phần | Đã kiểm: 365 role khác nhau trên 479 doc |
| Claim identity và chủ canonical | Không có thực thể claim. Chỉ proxy: `authoritative_for` (213 doc) và `Canonical for:` (188 doc, prose) | **Chưa có** | Theo agent |
| Typed graph | Không. Chỉ ba cạnh rời: lineage topic, `supersededBy`, `relation` của decision | **Chưa có** | Theo agent |
| Hiến pháp máy đọc được | `docs/doc-governance.md` là prose, không có mã, không có check | **Chưa có** (có bản nháp giấy) | Theo agent |
| Phủ `docs/platform`, `docs/architect`, `docs/specs` | 0 doc đăng ký. `assertFrameworkModeRoleValid` ép `diataxis` và 4 mode nên platform doc không đăng ký được | **Chưa có** | Theo agent |

Subcomponent "Claim and Decision Registry" của proposal vì vậy là hai nửa: nửa decision đã có (`tsk-1lv`), nửa claim chưa.

## 3. Registry đang dừng và có lỗi thật

| Phát hiện | Kiểm |
|---|---|
| `doc-provisional-aged` **không bao giờ bắn được**: `src/setup/registrations.mjs` so `now - doc.updatedAt > maxAgeMs` mà `updatedAt` là chuỗi ISO, nên phép trừ ra `NaN`. Hiện có 332 doc `provisional`, đã 47–55 ngày | **Đã kiểm** (đọc mã và dữ liệu `updatedAt`) |
| Log `.fgos/events.jsonl` chỉ có sự kiện `doc.register` và `topic.register` (332 mỗi loại), sự kiện cuối ngày 2026-08-26. Agent ghi "không có sự kiện nào sau 2026-09-11"; em đếm theo tiền tố loại sự kiện nên chỉ thấy tới 08-26. Chưa rõ vì sao 479 doc mà log có 332 bản đăng ký | **Đã kiểm một phần**, lệch với agent chưa giải |
| 34 file end-user đã commit nhưng chưa đăng ký; 10 file thêm sau 2026-09-12 đều bỏ qua registry | Theo agent |
| 365 role khác nhau cho 479 doc, trong khi thiết kế là tập đóng nhỏ; check `role-underused` chỉ in thông tin | **Đã kiểm** số role |
| Ba chỉ mục song song liệt kê tài liệu: `enduser-docs-index.json` (492), `doc-registry.json` (479), `.fgos/docs/enduser-docs-index.json` (0) | **Đã kiểm** số mục |
| Registry **không có spec area**, trái luật "a new product area gets a spec before it gets code"; `docs/specs/knowledge.md` không tồn tại dù phase 12 của plan 260825 ghi `completed` | **Đã kiểm** (`ls`) |
| `docs/reading-map.md` và hai spec end-user còn mô tả layout quadrant cũ, dù 332 trong 512 file đã ở `docs/knowledge` | Theo agent |
| Plan 260825 đã lưu trữ ở `archive/plans/260825-1841-knowledge-registry/` (2026-09-30); plan 260925 còn trỏ vào đường dẫn cũ | **Đã kiểm** thư mục archive |

## 4. Bốn cặp cơ chế song song

| Việc | Các cơ chế cùng làm | Lệch |
|---|---|---|
| Liệt kê "tài liệu nào tồn tại" | `view.docs` của registry; quét thư mục `enumerateDocEntries`; `authoritative-match`; `doc-near-duplicate` | 479 so với 492 so với 34 file chưa đăng ký; `authoritative-match` mù `docs/knowledge` |
| Ai sở hữu một claim | `authoritative_for` (213) và `Canonical for:` (188) và cặp (topic, role) của registry và `scope` của decision | Hai tập 213 và 188 gần như không giao nhau; giao chính xác chưa tính |
| Supersession | `doc.supersede` và `supersededBy`; `--relation supersedes` của decision; header `Supersedes:`; trường `superseded-by` của work item | Mỗi loại một cửa, không nối nhau. 0 trong 479 doc có `supersededBy` |
| Provenance | `sourceCaptureIds` và `attest`; `outcome.docType/docPath` của `compound` cũ; frontmatter OKF | `sourceCaptureId` rỗng ở 167 trong 492 mục index |

## 5. Ràng buộc đã khoá mà KDE có nguy cơ vi phạm

- **D2 của `tsk-1lv`: không dựng stored graph, không daemon.** Typed graph của KDE phải là bản dẫn xuất tái sinh được từ `state.decisions` và registry, không phải store riêng. Proposal chưa nêu.
- **D3 của `tsk-1lv`: không dựng decision-store mới.** Nửa decision của "Claim and Decision Registry" phải đọc `state.decisions`.
- **Luật "spec trước code" của `AGENTS.md`:** KDE và registry đều chưa có spec area; không nên thêm code khi chưa có.

## 6. Hệ quả cho lane RULE và kế hoạch

1. **Không dựng thêm registry cho luật.** Đơn vị luật nên là một profile hoặc một consumer của registry và của `state.decisions`, đúng chiều phụ thuộc báo cáo kongming đã vẽ (Agent Context Engine đọc qua port, không tự giữ chân lý).
2. **Hàng "Knowledge, Learning, And Documentation Registry" trong `component-boundary.md` chính là Knowledge Registry.** Hàng này cần được viết lại cho đúng thực tế (end-user only, đã chạy, các lỗi ở mục 3) trước khi thêm hàng KDE; nếu không bản đồ sẽ có hai hàng cho một thứ.
3. **Các lỗi ở mục 3 nên sửa trước khi "generalize".** Chúng là việc nhỏ, có bằng chứng, và nằm ngoài phạm vi nhóm 1A nên cần mục riêng.

## 7. Đề xuất (chờ owner chọn; chưa làm)

1. Sửa ba lỗi có bằng chứng: `doc-provisional-aged` so `Date.parse(updatedAt)`; thêm check chênh lệch giữa đĩa và registry cho tài liệu end-user; cho `authoritative-match` và `doc-near-duplicate` liệt kê từ cùng nguồn với registry.
2. Viết spec area `docs/specs/knowledge-registry.md` (còn thiếu) và cập nhật `reading-map` cùng hai spec end-user.
3. Chốt một nguồn liệt kê tài liệu là `view.docs`; hạ `enduser-docs-index.json` và `doc-registry.json` thành bản chiếu của cùng một hàm.
4. Với KDE: giữ registry hiện có, thêm profile thay vì store mới; claim và graph là hai thứ thật sự mới, làm sau và là mục riêng.
5. Ghi một câu vào proposal §4.7.1 rằng KDE bắt đầu từ registry đang chạy, kèm ràng buộc D2 và D3. Em chưa sửa proposal lần này.

## 8. Chưa kiểm và số liệu lệch giữa các nguồn

- **Số quan hệ `supersedes`:** em đếm 18 trong `.fgos/events.jsonl`; agent 3 ghi 23. Chưa đối chiếu (có thể agent gồm cả file backup `events.jsonl.backup-*`, nơi em đếm thêm 16).
- **Trích dẫn "proposal :549-551":** agent 3 dẫn dòng đó cho nhận định "5 trong 7 quan hệ chỉ thay một phần". Dòng đó là **ghi chú em thêm vào proposal hôm nay**, không phải bằng chứng độc lập. Con số 5 trên 7 là của em, đếm từ câu chữ index.
- **Số sự kiện registry:** 332 sự kiện đăng ký so với 479 doc trong snapshot; 147 doc `active` có thể nằm ở store khác (spec event-store ghi store Rust "dormant"). Chưa kiểm.
- **Snapshot cũ:** số liệu của agent 2 lấy từ `doc-registry.json` commit cuối 2026-09-15, không phải store sống.
- **Chưa đọc:** `docs/architect/knowledge-registry-redesign.md` (743 dòng) và `documentation-system-design.md`; Q&A log §5 của DISCUSSION `tsk-28x` (183 KB); 12 phase file của plan 260825.
- **Chưa tính:** giao của `authoritative_for` và `Canonical for:`. Chưa chạy test hay `doctor`.
- **Chưa biết:** vì sao 147 doc `active` vẫn nằm ở đường dẫn quadrant cũ; 332 doc `provisional` là chủ ý (luật migrate để provisional) hay bị quên.

## 9. Câu hỏi còn mở

1. Knowledge Registry sẽ mở rộng phủ `docs/platform`, `docs/architect`, `docs/specs` bằng profile mới, hay tách thành một registry khác?
2. Ai sở hữu việc sửa ba lỗi ở mục 3: lane DOC, lane RULE, hay một item riêng?
3. `fgos-coding-knowledge` còn là đường ghi duy nhất cho tài liệu mới không? (10 doc mới sau 09-12 đi đường khác.)
4. `tsk-43q` và `tsk-5mh` đóng hay giữ blocked? (Mã đã land, item kẹt vì retrospective không để lại bằng chứng, theo agent 3.)
