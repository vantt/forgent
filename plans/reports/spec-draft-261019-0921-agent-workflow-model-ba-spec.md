# Cover note: bản nháp spec BA cho mô hình agent ↔ workflow (lane AGENT-WF)

Viết 2026-10-19 (Asia/Saigon), sửa lần hai cùng ngày sau review độc lập, vòng hội đồng tập trung và các câu trả lời của owner lúc 12:20. Bản nháp nằm trên nhánh riêng, chưa merge vào main, chưa có hiệu lực.

## Những gì có trên nhánh

- [docs/specs/workflow.md](../../docs/specs/workflow.md) (khoảng 680 dòng): spec khu vực mới, tiếng Việt, luật mang id tạm `RUL-WF-1…28`, battery 26 kịch bản.
- [component-boundary.md](../../docs/platform/component-boundary.md): các hàng Workflow, Work Lifecycle, Execution Core, Holder-lock (`advance`) mang đoạn "Proposed … pending owner approval" cạnh chữ hiện hành (không xoá chữ cũ).
- Một dòng pointer ở [reading-map.md](../../docs/specs/reading-map.md); một đoạn pointer ở [runner.md](../../docs/specs/runner.md) (0048/0049 không bị sửa tại chỗ).

Kiểm: `scripts/check-decision-citation-drift.mjs` không còn finding; `test/docs/*`, dead-vocabulary guard và test citation-drift đều pass. Không đụng code, config, skill hay YAML.

## Đổi gì trong lần sửa này, và vì sao

| Thay đổi | Nguồn |
|---|---|
| Execution Core **sở hữu giao diện AdmissionPort**, Workflow cài, entry tiêm; Unit ghi file thiếu port bị từ chối; ghi đứng riêng chỉ khi port trả `unbound` khẳng định; port còn có mặt ở cổng ghi; admission sau giải pattern, trước `bind()`; test A4 giữ nguyên | review B1, S9; vòng tập trung (N14) |
| **Bản ghi binding** theo danh tính gốc worktree, có generation, tạo độc quyền; ràng ở start, mọi reservation ghi file và khi harness tạo worktree; bỏ câu "binding rộng bằng `writes`" (RUL-WF-27) | review B2, S2; vòng tập trung (R1) |
| **Giao thức ngữ cảnh authority**: kiểm hội, từ chối worktree đã ràng mà không có danh tính, phân giải phía host, ngữ cảnh case do cửa đặt và lọc biến kế thừa (RUL-WF-11) | vòng tập trung (R1) |
| **Ghi lồng từ worker bị giam bị từ chối theo tên**, không relay; chỉ-đọc lồng không đổi | owner 2026-10-19 |
| **N1 chỉ ràng hai cửa**: ghi trong phiên nằm ngoài ledger, nêu thành mục riêng (§1.3); hook là ý tưởng F15 | review S1; owner 2026-10-19 |
| **N17 = Shape C**: proposer giữ `advance` suốt đời cho playbook case; conductor case giữ theo từng admission; thu hẹp reserve-then-release và song song cho playbook case được viết công khai (§5.4, RUL-WF-10, §7.4); answer khi proposer sống chỉ ghi; proposer chết không nhả reservation; bác custody attempt | owner 2026-10-19; review S5, S7 |
| Tên **Playbook proposer**; câu "runner" được chỉnh: từ đứng một mình không gọi tên gì, định danh vật lý giữ tới một bước L10 riêng; id gọi bằng tên (`caseId`, `unitRunId`, `assignmentId`, `attemptId`); component là Workflow với hai thực thể guide và case | owner 2026-10-19; vòng tập trung (N13); review N-f |
| **Event Store không thuộc cutover này**: ledger JSONL làm cứng tại chỗ (fsync trước khi nhả `advance`, bộ đọc fail closed với dòng hỏng); nếu F10 mở về sau: append sau đoạn ngắn, không re-rank, reservation/binding không thành event | owner 2026-10-19; vòng tập trung (N15) |
| **Trần seat launch giao cho Unit**, settle một lần; Execution Core không ghi ledger giữa chừng | review S6 |
| **Case lồng**: trừ khung cha trong đoạn `advance` riêng, hoàn idempotent; không bao giờ hai `advance` một scope (RUL-WF-28) | review S4 |
| Bỏ điều kiện đảo "admission theo cửa sang Rust" và "biến case do gate cấp"; thay bằng điều kiện *đánh giá lại* | vòng tập trung (N14) |
| Sửa trích dẫn: câu tóm tắt N14 xếp proposer vào infra là của gói reopen, không phải của §5.3 bản nháp; bảng N14 trong spec nay ghi đúng tầng | red-team vòng tập trung (RT2-1) |
| `listedRoutesOnly` bỏ khỏi milestone trong ví dụ; `frameDefaults` không còn chuỗi trong ô số; tên hai test phải giữ xanh được nêu | review N-a, N-b, S8 |
| Mục mới **§14 Điều kiện đảo quyết định**: với mỗi mục owner quyết hoặc mặc định hội đồng, tín hiệu quan sát được sẽ mở lại và đổi sang gì; bảng mặc định đánh dấu "owner 2026-10-19" | owner: "nhớ ghi nhận các note khi nào thay đổi" |
| Battery thêm kịch bản 16–22; nghĩa vụ chứng minh cho plan; rủi ro R8–R10; bất đồng mới của vòng tập trung | vòng tập trung |

## Sửa lần ba: theo red-team bản sửa ([review-261019-1220](review-261019-1220-agent-workflow-model-ba-spec-revision.md))

| Mục | Sửa |
|---|---|
| B1′ | `answer` không bao giờ append ledger trực tiếp: ghi file gate-answer (runtime state, bất biến sau khi tiêu), thử `advance` một lần; bị giữ thì proposer append `gate.answer` ở lần đọc lại kế tiếp, trước khi hành động (§5.4, §7.4, §8, battery 14, RUL-WF-24) |
| B2′ | Dispatch gọi tên một playbook case đang sống từ bên trong Unit của nó (ghi hay chỉ-đọc, kể cả mở case con) bị từ chối theo tên `playbook-case-admits-via-proposer-only`; xoá câu "rút từ trần seat launch của Unit"; ghi vào R8 là giá của Shape C; ghi việc doctrine `coordination-driver.md` phải theo (làn COOK) (§5.4, RUL-WF-28, §8, battery 23) |
| B3′ | Mọi caller `runUnit` có `writes` tiêm port thật ngay khi land, gồm các đường Work đang chạy; không case nào ràng → `unbound`, chạy như trước; "khi cutover coding" chỉ còn nghĩa gọi tên case/activity (§5.2, §8, §9, §11.2, battery 24) |
| S1′ | Port nhận lần giữ `advance` đang có (battery 25) |
| S2′ | RUL-WF-27: một tên file, `state` bên trong, chỉ chủ ghi đè; thiếu bản ghi = `unbound` trên đường nóng; đối chiếu ledger là đường sửa chữa (battery 26) |
| S3′ | `status`/`resume` theo loại case: conductor case `running` khi còn reservation sống, `resume` chỉ nhặt file gate-answer (§5.4, §7.6, battery 9) |
| S4′ | §14 thêm dòng: hệ quả N17, luật `answer`, port nhận lần giữ, tạo-độc-quyền-là-mutex (làn holder-lock), thiếu bản ghi = `unbound`, RUL-WF-28, N8, N11 |

Boundary rows (Execution Core, Holder-lock) chỉnh theo B1′, B2′, B3′, S1′. Không cần owner quyết thêm; hệ quả B2′ đã đưa vào R8 để owner thấy là giá của lựa chọn 12:20.

## Spec khoá gì, để mở gì

Khoá: phép tách authority; từ vựng; MUST/SHOULD/MAY instead/unlisted/`listedRoutesOnly`; catalog đóng; N1 và giao thức ngữ cảnh; binding; AdmissionPort do Execution Core sở hữu; đơn vị đếm khung; `advance` theo Shape C; ledger làm cứng; đích supersede một phần 0048 §2 và 0049 §4 (proposed — decision ID gán khi owner duyệt).

Để mở (không khoá): bố cục YAML, tên file, flag, nơi đặt module, chữ ký port, ngôn ngữ cài, định dạng Event Store, phase cài đặt, cutover coding (R2).

## Tự quyết, không hỏi lại

File spec riêng thay vì nhồi vào runner.md; hàng ranh giới đặt cạnh chữ hiện hành; không sửa `system-overview.md` (thêm dòng `workflow` khi land); không CHANGELOG; nhãn bất đồng đặt lại để qua check citation-drift; các ý đã được owner trả lời gắn "owner 2026-10-19" ở mọi chỗ chúng xuất hiện.

## Owner còn cần trả lời

1. **Duyệt spec, gồm supersede một phần 0048 §2 và 0049 §4.** Khi duyệt, một decision ID mới được ghi và id `RUL-WF-n` được gán chính thức.
2. **Chọn ý tưởng tính năng (§15).** Khuyến nghị:
   - duyệt **F1–F7, F9, F11, F12** làm lõi; F11 thực tế owner đã chọn qua quyết định 12:20;
   - **F10** để đó cho tới khi có lý do (hình dạng đã định sẵn);
   - **F8, F14, F15, F16** hoãn, mỗi cái đã có điều kiện mở trong §14;
   - **F13** chỉ sau khi phần lõi land.

Pilot-trước-engine (bất đồng P2-pilot-first) là câu hỏi trình tự; owner gặp nó lúc duyệt plan.

## Chuẩn bị landing (owner duyệt)

- Owner duyệt spec 2026-10-19 12:32 ("duyệt spec") và chọn ý tưởng tính năng 12:35 ("đồng ý, chọn theo đề xuất"): F1–F7, F9, F11, F12 là lõi; F13 sau khi lõi land; F8, F14, F15, F16 hoãn; F10 không thuộc cutover này.
- Quyết định **D-ADR0070**: record đầy đủ ở cuối "Lịch sử quyết định" của `docs/specs/runner.md`; 0048 và 0049 không bị sửa, chỉ thêm một dòng trỏ "Superseded một phần bởi D-ADR0070" (theo cách 0061 trỏ tới 0062 trong `platform-foundations.md`).
- `workflow.md`: trạng thái Settled, bảng mặc định ghi "settled cùng D-ADR0070", mục 15 có cột lựa chọn của owner.
- `component-boundary.md`: bốn hàng (Workflow, Work Lifecycle, Execution Core, Holder-lock) thành chữ settled; `system-overview.md` có dòng `workflow` trong area map; `reading-map.md` bỏ nhãn bản nháp.
- Hai mục trên trước đây ghi "câu hỏi owner còn cần trả lời" nay đã được trả lời; không còn câu hỏi mở cho owner.
