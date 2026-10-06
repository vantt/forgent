# Báo cáo nối lại plan documentation-authority-unification (2026-10-06)

Phạm vi: ba việc được giao (đồng bộ main, kiểm kê lại, cập nhật plan). Không làm Phase 4+, không cutover, không push, không đụng main checkout. Plan: [plan.md](../260925-documentation-authority-unification/plan.md).

## 1. Độ lệch trước và sau

| Đo | Trước | Sau | Cách đo |
|---|---|---|---|
| main đi trước branch | 400 commit (main `e63a17b8e`) | 0 | `git rev-list --count HEAD..main` |
| branch có commit chưa vào main | 59 | 59 + 2 merge + 6 commit hồ sơ | `git rev-list --count main..HEAD` |
| main là tổ tiên của HEAD | không | có (main `2fd5cb6a3`) | `git merge-base --is-ancestor main HEAD` |

Hai lần merge: `b9fee1e56` (main `e63a17b8e`, 3 xung đột, đều ngoài `docs/platform/**`: `CHANGELOG.md` giữ cả hai khối; `docs/specs/reading-map.md` lấy dòng gateway của main và giữ sửa `fgos-coding-knowledge` của branch; theo main chuyển plan knowledge-registry vào `archive/plans/`) và `6b8ef0e8d` (main đi thêm 3 commit trong lúc em làm, merge sạch).

## 2. Kiểm kê lại

Kết quả: [reports/resync-261006/](../260925-documentation-authority-unification/reports/resync-261006/) (manifest, Markdown, `inventory-comparison.json`).

| | 2026-09-26 (commit `f0c76c5e5`) | 2026-10-06 | Cách đo |
|---|---|---|---|
| File trong phạm vi | 4.305 | 4.311 (+6, mất 0, đổi 73) | so registry theo path + blobSha |
| Đơn vị claim | 85.772 | 86.085 | `claimLedger` của inventory |
| Consumer edges | 98.406 | 101.286 | `consumerEdges` |
| Gap tường minh | 1.360 | 1.361 (thêm `docs/specs/observe.md`) | `check-doc-inventory-gates --json` |
| Nhóm trùng nội dung / xung đột ngữ nghĩa | 818 / 151 | 818 / 151 | như trên |

So claim (ghép multiset theo `(sourcePath, identityFingerprint)` giữa registry cũ và registry mới bootstrap): giữ nguyên 85.481, sửa 248, mất 43, mới 356, chuyển chỗ 0. 43 đơn vị "mất" nằm ở `docs/specs/runner.md` (21), `docs/specs/work-state.md` (6), `AGENTS.md` (6), `component-boundary-advisory.md` (5), `docs/how-to/use-fgos-group-thinking.md` (3), `confinement-authority.md` (1), `docs/architect/agent-coordination/README.md` (1). Phần lớn là khối không có heading đánh số theo vị trí, nên một số là đổi số chứ không mất thật; heading đổi tên thấy được: `AGENTS.md` "herdr gateway" → "fgos gateway", "a executor" → "an executor"; `runner.md` mục CoordinationSession (engine đã gỡ). Từng đơn vị mất thật hay chỉ đổi chỗ: UNPROVEN. Tất cả nằm trong file đã ghi ngoại lệ hoặc file ngoài gốc cũ, có danh sách trong `inventory-comparison.json`; Phase 4 phải chạy lại conservation có carry-forward.

Tài liệu mới ngoài `docs/platform/**` (6): `docs/specs/observe.md` (gốc cũ, `unknown-blocking`), `docs/distillery/sources/council-of-high-intelligence.md`, ba how-to (`compare-discussion-setups-with-metrics-eval`, `install-fgos-in-a-project-and-use-doctor`, `measure-a-real-case`), `docs/reference/discussion-quality-rubric.md` (đều `reclassify-out-of-platform-scope`).

Mã thoát:

| Lệnh | Mã thoát | Ghi chú |
|---|---|---|
| `generate-doc-inventory --commit <HEAD sau merge 1>` với registry cũ | 1 | đúng thiết kế: registry gắn commit `f0c76c5e5` |
| cùng lệnh với registry bootstrap mới, heap 4 GB | 134 | V8 hết bộ nhớ sau 82 s |
| cùng lệnh, heap 7,5 GB | 137 | OS giết sau 44 phút |
| cùng lệnh trên commit đo (HEAD bỏ 3 đường dẫn artifact kiểm kê) | 0 | 17 s, RSS 1,9 GB |
| `check-doc-inventory-gates` (cũ / mới) | 0 / 0 | clean, 0 fatal |
| `check-legacy-docs-ratchet` sau merge | 1 → 0 | 20 vi phạm trước khi ghi ngoại lệ |
| `verify-phase-02.mjs --skip-full-suite` (BASE `f0c76c5e5`, FIXED_END HEAD) | 1 | `ENOENT` registry: script còn trỏ đường dẫn trước khi artifact chuyển vào `reports/` |
| `verify-phase-01.mjs --skip-full-suite` (BASE `38a337ecb`) | 1 | 2 test `generate-shipped-path-inventory` hỏng; đã hỏng sẵn trên `551687021` (trước merge) |
| test tập trung ratchet + inventory + verify-phase-02 | 0 | 99/99 |

Nguyên nhân OOM đã chứng minh: bộ sinh đọc mọi blob văn bản để tìm consumer, kể cả ~250 MB JSON kiểm kê đã commit của chính nó; bỏ ba đường dẫn đó thì chạy được. Commit đo `e5c468aba` không có ref (công thức tạo lại ghi trong `inventory-comparison.json`). Shard (~197 MB) và registry bootstrap (~43 MB, ID ngẫu nhiên) không commit.

## 3. Ngoại lệ đã ghi nhận

20 file gốc cũ main đổi từ `81f7db801` (19 sửa, 1 mới `docs/specs/observe.md`) được ghi vào `scripts/check-legacy-docs-ratchet.exceptions.json` theo tiền lệ `b3fbcdd41`, kèm digest và tóm tắt commit; `approvedBy` ghi rõ "per-file content review pending". Ratchet sạch: 995 file, 24 sửa có ghi nhận, 1 file mới có ghi nhận. Main checkout còn thay đổi chưa commit ở `docs/specs/observe.md`, `runner.md`, `reading-map.md` (phiên khác) nên lần sync sau sẽ cần ghi lại.

Claim bị rơi: "Dev / Source Activation" ghi vào [dropped-claims-register.json](../260925-documentation-authority-unification/dropped-claims-register.json) (Phase 3 ledger `claim_efd5afeb...`, `unknown-blocking`, chặn Phase 9). Nguyên nhân rơi: UNPROVEN.

## 4. Kiểm lại các điểm tách đôi (script trên cây đã sync)

Ba `platform-foundations.md`: còn đủ ba; `AGENTS.md` trỏ 2. Hai reading-map: còn; `docs/specs/reading-map.md` có 109 token đường dẫn theo cách em tách (không so được với "94"), 4 đường dẫn chết đã xác nhận tay. `plan.md`: 612 dưới `docs/history`, 19 dưới `plans/`, 36 dưới `archive/plans/`; 22 file skill/task-spec còn trỏ `docs/history/<feature>/plan.md`. Journal: 11 ở `plans/journals/`, 5 ở `docs/journals/`. Trùng `docs/architect` và `docs/platform`: 302 file `.md` giống hệt cùng đường dẫn tương đối (khớp số cũ). Chi tiết ở plan §7.6.

## 5. Ước lượng Phase 4-10

Dựa trên file phase và số đo, không có tiền lệ đo thời gian, nên đều UNPROVEN:

| Phase | Ước lượng | Căn cứ |
|---|---|---|
| 4 | 3-5 ngày | constitution, conservation checker, alias resolver, lease, cộng sửa 3 lỗi công cụ ở §2 |
| 5 | 3-5 ngày | hai pilot, review người đọc mới |
| 6 | 3-6 tuần | 1.383 file `unknown-blocking`, ~39.650 claim `unknown-blocking`, 818 nhóm trùng |
| 7 | 1 tuần | review chéo + người đọc mới |
| 8 | 1-2 tuần | viết lại consumer (`AGENTS.md`, skill, test, generator) |
| 9 | 2-3 ngày | cutover nguyên tử + rollback |
| 10 | 1 tuần | MVP bảo trì, có thể dùng lại `fgos convention` của Plan B |

## 6. Rủi ro

- Branch sống càng lâu, main càng sửa gốc cũ; mỗi lần sync thêm một đợt ngoại lệ. Cần chính sách đứng (Phase 4).
- Công cụ của plan không tự chạy được trên HEAD (bộ sinh, `verify-phase-02`, `verify-phase-01`); sửa là sửa script, ngoài quyền em lần này.
- Main đã chuyển plan knowledge-registry sang `archive/plans/`, trái yêu cầu Phase 1 "giữ ở đường dẫn lịch sử".
- Plan A/B/C cùng ghi `AGENTS.md`; cutover phải đi sau A06, B06, C05.
- Kho kiểm kê ~250 MB trong git làm repo nặng và gây OOM ở trên.

## 7. Thứ tự đề xuất với Plan A, B, C

Phase 4-8 chạy trên branch này song song với A/B/C, mỗi lần sync ghi ngoại lệ cho phần chúng sửa ở gốc cũ. Packaging-distribution chỉ chuyển ở Phase 6 sau khi docs của Plan C vào main. Phase 9 sau Plan A phase 06, Plan B phase 06, Plan C phase 05. Ghi ở plan §7.5.

## 8. Cho anh

Kết luận: branch đã chứa main (`2fd5cb6a3`), cây sạch, không push, không phase nào được phép. Kiểm kê mới không mất file nào; 43 đơn vị claim cần phân định ở Phase 4; một claim rơi đã vào sổ. Công cụ verify của plan hiện không chạy xanh trên HEAD, đây là điểm dừng em không tự sửa.

Ba việc cần anh quyết:
1. Cho phép sửa công cụ của plan (bộ sinh bỏ qua artifact của chính nó, đường dẫn `verify-phase-02`, hai test shipped-path) như một phần Phase 4, hay làm riêng trước.
2. Ngoại lệ gốc cũ: duyệt nội dung 20 file đã ghi lần này, và chọn chính sách đứng cho các lần sync sau.
3. Việc main chuyển plan knowledge-registry sang `archive/plans/`: chấp nhận đường dẫn mới, hay yêu cầu giữ đường dẫn lịch sử.

Việc đầu tiên nếu anh cho phép Phase 4: sửa bộ sinh để không đọc artifact của chính nó, rồi chạy lại conservation có carry-forward trên HEAD để phân định 43 đơn vị mất và 248 đơn vị sửa.

## Câu hỏi chưa giải

- Có nên commit shard và registry mới (~240 MB) hay giữ ngoài git như lần này?
- Mục HI-I027 trong ledger host-invocation-routing ghi `dev:<rev>` "implemented preview"; Plan C nói chưa có code. Em chưa kiểm.
- Đường review `fgos run --pattern rfc` chưa chạy thử cho tài liệu.
